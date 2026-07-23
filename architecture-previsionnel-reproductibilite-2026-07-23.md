# Architecture — Prévisionnel : reproductibilité, ancrage et invariants (EPIC-013/014)

> **Date :** 2026-07-23 · **Statut :** décisions de cadrage — à appliquer par STORY-070/071/073
> **Périmètre :** les points ouverts remontés par la revue de **STORY-069** (FR-019, projection annuelle 3 ans),
> qui engagent le reste d'EPIC-013 (070/071) et EPIC-014 (073).
> **Fondé sur :** le code livré `bilan-service/src/modules/bilan/projection/` (069), `…/hypotheses/` (068),
> `…/jeu-etats/snapshot/` (065) et `…/audit/` (067), le [PRD bilan §FR-018→FR-023](prd-bilan-service-2026-07-10.md)
> et le [tech-spec B8](tech-spec-bilan-b8-2026-07-20.md).

---

## 0. Le problème en une phrase

**STORY-069 annonce une projection « déterministe et reproductible ». Elle ne l'est que dans l'instant.**

Une projection est fonction de **trois** entrées. Une seule est immuable aujourd'hui :

| Entrée | État actuel | Conséquence |
|---|---|---|
| Snapshot de liasse (065) | **immuable** ✅ — collection append-only, le repository n'expose ni `updateOne` ni `deleteOne` | rejouable |
| Paramètres d'hypothèses (068) | **écrasés en place** ❌ — `JeuHypothesesService.editer` fait `updateOne(id, { hypotheses, version: doc.version + 1 })` sur un `TenantScopedRepository` nu : les valeurs de la v3 **n'existent plus** en v4 | **non rejouable** |
| Modèle de projection (069) | `MODELE_PROJECTION_VERSION = '1.0.0'` exposée dans la réponse ✅ (posée par 069), mais **aucune garde n'oblige à l'incrémenter** | traçable en principe, invérifiable en pratique |

La réponse de 069 expose pourtant `hypothesesVersion` comme gage de traçabilité — or **cette version n'est pas
résolvable**. C'est un engagement que le code ne tient pas.

### Ce n'est pas un ajout de périmètre : c'est une dette de conformité de 068

Le fondement n'est pas FR-023 AC-3 (« l'export d'un **état validé** reproduit exactement le snapshot ») — celui-là
porte sur la **liasse** et 065 le satisfait déjà. Le fondement, **déjà violé aujourd'hui**, est :

> **FR-018 AC-2** — « Hypothèses éditables **et versionnées** ; base = snapshot validé (traçable). »

STORY-068 a livré un **compteur d'éditions**, pas un versionnement : `version` s'incrémente, mais aucune version
antérieure n'est conservée. L'arbitrage de capacité (§Séquencement) porte donc sur le **remboursement d'une dette**,
pas sur un élargissement de scope. La distinction est déterminante.

---

## D1 — Figer les **entrées**, pas la sortie

**Décision : historiser les versions de paramètres d'hypothèses en append-only ; ne PAS persister les projections.**

Quatre voies ont été pesées :

| | Principe | Verdict |
|---|---|---|
| **(a) Historiser les entrées** — *retenue* | collection `versions_hypotheses` append-only + `MODELE_PROJECTION_VERSION` ⇒ tout couple `(snapshotId, versionHypothesesId, modeleVersion)` est rejouable | **retenue** : la projection **reste** une dérivation ; rien à invalider quand le modèle évolue |
| (a′) Copy-on-write sur `jeux_hypotheses` | append-only sur la collection existante, index `(tenantId, serieId, version)`, courant = version max (patron `SnapshotLiasseRepository.dernier`) | **écartée** — élégante (pas de transaction 2-docs, pas de duplication de vérité), mais impose de casser l'index unique `(tenantId, nom)` livré par 068 et d'introduire un `serieId` stable. Coût de migration du contrat pour un gain interne. **À reconsidérer** si (a) fait apparaître une divergence doc courant / version courante |
| (b) Agrégat `SnapshotProjection` | figer la **sortie** calculée à l'export | **écartée** — crée un second objet à invalider ; les projections figées garderaient l'ancienne formule, bugs compris, sans moyen de les distinguer |
| **(c) Figer l'artefact remis** | stocker + hacher le PDF/XLSX effectivement rendu (patron MinIO de STORY-129 : clé stockée, jamais l'URL présignée) | **orthogonale, non exclusive de (a)** — à trancher dans le cadrage de **073**. (a) rend l'export *reconstructible*, (c) prouve *ce qui a été remis*. Les deux répondent à des questions différentes |

**Pourquoi (a) plutôt que (b).** Le discriminant est : « que faire des projections figées quand la formule change ? ».
Avec (a), un correctif de formule améliore rétroactivement toutes les lectures, et l'archive dit **quelle** version a
produit un export donné. Avec (b), on accumule des sorties périmées indistinguables.

> ⚠️ **Ne pas invoquer « le dérivable ne se stocke pas »** comme argument : ce serait faux dans ce service.
> `SnapshotLiasse` stocke `liasse` alors que le même document fige `soldesN`, `referentiel`, `checksum` et
> `moteurVersion` — la liasse y est entièrement dérivable. La règle réelle est : **le dérivable ne se fige que sur
> acte humain engageant** (la validation). La projection n'a pas d'acte engageant ⇒ (a).

**Ce que ça implique concrètement** (story dédiée, voir §Séquencement) :

- collection `versions_hypotheses` **append-only**, tenant-scoped, index unique `(tenantId, jeuHypothesesId, version)` ;
- `JeuHypothesesService.editer` **insère** la version sortante avant de muter le document courant, **dans une
  transaction** (2 documents écrits ⇒ `transactions-mongo.md` s'applique — contrairement à 068, mono-document) ;
- la projection accepte un `?versionHypotheses=N` optionnel (défaut : version courante) ;
- la réponse expose le **triplet** de reproductibilité : `snapshotId` + `versionHypothesesId` + `modeleVersion` ;
- **l'export journalise ce triplet dans `audit_events`** — voir D5.

**Nuance assumée.** Rejouer une formule **ancienne** reste impossible : `MODELE_PROJECTION_VERSION` *identifie* le
modèle, elle ne l'*archive* pas. C'est volontaire — versionner du code exécutable en base est un coût sans commune
mesure avec le besoin. L'engagement tenu est : « cet export a été produit par le modèle 1.0.0 à partir de ces entrées
exactes ». **Cette nuance n'est honnête qu'à deux conditions** : que l'incrément de version soit **garanti par un test**
(D4) et que l'acte d'export soit **tracé** (D5). Sans elles, « produit par le modèle 1.0.0 » n'est pas vérifiable et la
nuance devient une échappatoire. **À mentionner dans le PDF exporté** (version du modèle), pour ne pas promettre plus
que ce qui est vrai.

---

## D2 — Un scénario comparé est ancré sur la même base — avec une issue

**Décision : STORY-071 distingue deux cas d'hétérogénéité, et n'en bloque qu'un sans issue.**

Rien ne contraint aujourd'hui : l'index unique de 068 est `(tenantId, nom)`, et deux jeux « prudent » et « optimiste »
peuvent pointer deux bases différentes. Les afficher côte à côte produirait une comparaison **muette sur sa propre
invalidité** : l'écart lu serait attribué aux hypothèses alors qu'il viendrait de la base.

Mais **interdire toute divergence de `snapshotId` créerait un cul-de-sac**. Le PRD dit « ≥ 2 scénarios coexistants pour
un même **exercice** de base » (FR-021 AC-1), et 065 autorise la ré-ouverture puis re-validation ⇒ snapshot v2. Un jeu
créé avant pointe v1, un jeu créé après pointe v2 : **même exercice, même jeu d'états, comparaison refusée
définitivement** — car `base` n'est capturé qu'à la création et **aucun endpoint ne permet de rebaser** (le contrôleur
n'expose que `POST` / `GET` / `GET :id` / `PUT :id`).

| Cas | Règle |
|---|---|
| `base.jeuEtatsId` (donc l'exercice) **diffère** | **409 `BASES_HETEROGENES`**, en nommant les jeux fautifs — le PRD l'exige, il n'y a pas de lecture sensée |
| Même `jeuEtatsId`, **versions de snapshot différentes** | comparaison **autorisée**, assortie d'un **avertissement porté dans la réponse** (`baseHomogene: false` + les versions en présence). Ne pas bloquer un cas légitime |

Si 071 devait malgré tout durcir le second cas, elle **doit** livrer conjointement un endpoint de **rebasage** — sinon
elle livre un blocage sans issue.

**Pourquoi 409 et pas 400.** Argument interne au service, pas sémantique HTTP abstraite : ici **409 = l'état des
ressources référencées interdit l'opération** (`BASE_NON_VALIDEE`, `JEU_VALIDE_NON_RECALCULABLE`, `EXERCICE_CLOS`) et
**422 = contenu métier invalide** (`LIASSE_NON_VALIDABLE`, 064). La comparaison relève du premier cas.

---

## D3 — Le prévisionnel n'accède à la liasse que par `ancrage.ts` — et il faut d'abord extraire le BFR

**Décision : extraire `bfrNormatif` et `arrondir` en unités pures exportées AVANT STORY-070 ; garder `LiasseProduite`
importable dans le seul `ancrage.ts` ; prouver la règle par une spec exécutable.**

`extraireAncres` est déjà exportée et réutilisable en l'état (`ancrage.ts`). **Mais `bfrNormatif` et `arrondir` sont
`private`** dans `ProjectionAnnuelleService`. Prescrire « à réutiliser, pas à réécrire » sans lever ce verrou serait
prescrire l'impossible : 070 écrirait un BFR local, et l'articulation exigée par **FR-020 AC-2** (« la somme annualisée
s'articule avec la projection annuelle N+1 ») deviendrait le **rapprochement de deux formules divergentes** au lieu
d'une identité — exactement le scénario que cette décision veut prévenir.

**Action, en préalable de 070 :** extraire vers `projection/bfr.ts` (fonctions pures exportées), au même titre
qu'`extraireAncres` (`ancrage.ts`) et `controleEquilibre` — ce dernier ayant déjà été exporté « à dessein » en revue de
069. Le précédent est dans le fichier même ; il suffit de l'invoquer. Coût : quelques lignes, aucune régression
(couverture `projection/` à 100 %).

**La garde P7, en spec exécutable.** Un `grep` de codes de postes est trop étroit (les commentaires de `ancrage.ts` et
`projection.types.ts` en citent volontairement) et non mécanisable. La garde robuste — **et vraie aujourd'hui** — est :

> `LiasseProduite` n'est importé que par `ancrage.ts`. Aucun autre fichier du prévisionnel ne connaît la forme de la
> liasse.

À écrire comme **spec de cohérence exécutable**, sur le patron d'`operandes-coherence.spec.ts` /
`notes-meta-coherence.spec.ts`, plutôt qu'en consigne déclarative. Une consigne se contourne par inattention ; un test
rouge, non.

---

## D4 — Trois approximations gelées, et une garde qui rend le gel vérifiable

**Décision : ne pas corriger au fil de l'eau ; toute évolution qui change un montant à entrées inchangées incrémente
`MODELE_PROJECTION_VERSION`, et un test le prouve.**

Les trois approximations documentées dans le code de 069 :

1. **`produitsBase` n'est pas le chiffre d'affaires** — c'est le **total des produits** (financiers et HAO inclus), la
   seule assiette agnostique disponible. Un CA exact exige un **marqueur additif de paquet référentiel**, sur le patron
   `tresorerie?` / `role?`, donc un changement de paquet + checksum. **Différé**, à instruire avec l'expert-comptable
   (blocker « expert » déjà ouvert côté B8), pas en cours de story.
2. **`resultatNet` est un résultat avant impôt.** ⚠️ **Point à trancher** : STORY-121 (`in_progress`) porte
   explicitement « RESTE : **consommation barème par prévisionnel EPIC-013** » (barème Zone Franche dégressif). Deux
   documents de cadrage se contredisent. Soit ce reste-à-faire sort d'EPIC-013 et l'IS reste différé, soit il y entre et
   **l'incrément de `MODELE_PROJECTION_VERSION` est à prévoir dès le S15**. À arbitrer avec l'user — ne pas laisser les
   deux versions coexister.
3. **`CAF = résultat net`** (dotations aux amortissements hors modèle simplifié) — les intégrer supposerait un plan
   d'amortissement des investissements projetés, un sujet en soi.

**Le critère d'incrément n'est pas « ces trois points »** — ce ne sont que des exemples. Le critère est : **toute
évolution qui change un montant à `(snapshot, hypothèses)` inchangés**. L'arrondi, la base 360, le recalcul du BFR sur
les produits projetés en font partie.

**La garde.** `MODELE_PROJECTION_VERSION` est une constante littérale : *rien n'oblige à l'incrémenter*. Sans garde, la
règle est un vœu et la nuance assumée de D1 devient invérifiable. **À livrer avec 070** : un test figeant, pour un jeu
d'essai canonique, **la sortie complète ET la version** — sur le patron des `*-coherence.spec.ts`. Modifier une formule
sans toucher la version devient alors rouge.

**Exports déjà remis sous une version antérieure :** rien à faire — ils portent leur mention de version. À écrire tel
quel plutôt qu'à laisser implicite.

---

## D5 — L'export journalise le triplet dans la piste d'audit

**Décision : STORY-073 consomme le hook `AuditType.export` déjà réservé par 067.**

Le triplet de reproductibilité renvoyé dans le corps HTTP n'engage personne : il disparaît avec la réponse. C'est
**dans `audit_events` (append-only)** qu'il devient opposable — « tel utilisateur a exporté tel prévisionnel, ancré sur
tel snapshot, telle version d'hypothèses, tel modèle, à telle date ».

`AuditType` réserve explicitement `import`/`export` (« hooks : actions à venir — interop balance / EPIC-014 »). Le hook
inerte est posé depuis 067 ; 073 le consomme. C'est aussi la condition n°2 qui rend honnête la nuance assumée de D1.

---

## Séquencement recommandé

| Story | Ce que le cadrage impose |
|---|---|
| **Préalable à 070** (~0,5 pt, absorbé) | extraire `bfrNormatif` + `arrondir` en unités pures exportées (D3) |
| **STORY-070** (FR-020, 5 pts) | réutilise `extraireAncres` + `bfr.ts` (D3) ; articulation avec N+1 prouvée comme **identité** ; livre la spec de garde P7 et le test de version (D3, D4) |
| **STORY-071** (FR-021, 3 pts) | 409 `BASES_HETEROGENES` sur exercice différent ; avertissement — non blocage — sur versions de snapshot divergentes (D2) |
| **Nouvelle story — versions d'hypothèses append-only** (~3 pts) | D1. **Prérequis de 073**, pas de 070/071. À insérer avant 073, **jamais après** |
| **STORY-073** (FR-023, 5 pts) | triplet de reproductibilité + mention de version dans l'export (D1) ; audit `export` (D5) ; trancher (c) figer l'artefact remis |

### ⚠️ Capacité — le sprint 15 est déjà en dépassement

`committed_points: 24` **ne reflète plus la réalité** : le S15 porte aussi STORY-120/121/122 (toutes `in_progress`),
ajoutées sans remonter le compteur. Le commentaire du S16 l'acte noir sur blanc :

> « le S15 est déjà à **37 pts pour 34 de capacité** (120/121/122 ajoutés sans remonter `committed_points`) »

D1 porterait le sprint à **40 pts pour 34**, avec 3 stories inachevées — et le S16 n'a plus de marge (31 pts, le
triptyque identité 123/124/125 y a déjà été slotté pour cette raison). L'arbitrage réel, à trancher avec l'user :

- **sortir du S15** STORY-074 (FR-024, « Could Have », 3 pts) et/ou STORY-122 ;
- **ou** absorber D1 dans STORY-073 (qui devient ~8 pts) plutôt qu'en story dédiée ;
- **ou** décaler 120-122 au S16 — au prix d'un S16 lui-même surchargé.

Ce qui n'est **pas** une option : livrer 073 sans D1. L'export porterait alors une traçabilité que rien ne soutient,
et FR-018 AC-2 resterait violé.
