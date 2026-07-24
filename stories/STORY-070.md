# STORY-070 : Plan de trésorerie mensuel 12 mois (encaissements/décaissements, échéancier BFR) — FR-020

**Epic :** EPIC-013 — Prévisionnel (mensuel 12 mois + annuel 3 ans) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-020 (échéancier mensuel des encaissements/décaissements sur 12 mois glissants, dérivé des hypothèses — notamment délais BFR — et du solde de trésorerie initial) ; **dépend FR-018**
**Réf. cadrage :** [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md) — **D3** (réutilisation obligatoire de `ancrage.ts` + `bfr.ts`, garde P7 en spec exécutable) et **D4** (garde d'incrément de `MODELE_PROJECTION_VERSION`)
**Réf. code livré :** **STORY-069** (`extraireAncres`, `ProjectionAnnuelleService`, `controleEquilibre`, `MODELE_PROJECTION_VERSION`) · **STORY-068** (`JeuHypotheses`) · **STORY-065** (`SnapshotLiasse`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + revue de code avec correctifs + vérifiée docker bout-en-bout + revue de sécurité + intégrée dans `dev` le 2026-07-24 — PR #28 bilan-service, MNV-070 « Rebase and merge », HEAD `d273adf`, branche supprimée)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-23
**Sprint :** 15

---

## User Story

**En tant que** cabinet comptable disposant d'un jeu d'hypothèses rattaché à une base validée,
**je veux** un **échéancier de trésorerie mensuel sur 12 mois** — encaissements, décaissements et **solde cumulé mois par mois** —, dérivé de mes **délais BFR** et de ma trésorerie de départ,
**afin de** voir *quand* la trésorerie se tend dans l'année, et pas seulement où elle atterrit au 31/12.

---

## Description

### Contexte & cadrage

STORY-069 a livré la projection **annuelle** : elle dit que la trésorerie de fin N+1 sera de X. Elle ne dit
**pas** si l'entreprise passe en trésorerie négative au mois 4 pour remonter au mois 9 — or c'est précisément
la question qu'un prévisionnel doit trancher. STORY-070 **ouvre la première année** en 12 périodes.

**070 ne persiste rien** (même invariant que 069) : c'est une **dérivation pure** de
`(snapshot figé, hypothèses)`, recalculée à chaque appel.

### L'articulation avec l'annuel est une **identité**, pas un rapprochement

FR-020 AC-2 exige que « la somme annualisée s'articule avec la projection annuelle N+1 ». Deux façons de le
faire — une seule est tenable :

- ❌ **Rapprocher deux formules** écrites séparément, puis constater un écart « acceptable ». C'est ce que la
  décision **D3** du cadrage interdit explicitement : deux formules divergentes qu'aucun test ne réconcilie.
- ✅ **Construire le mensuel de sorte que la somme des 12 mois SOIT le flux annuel N+1**, par construction, et
  le **prouver** par un contrôle `ecart = 0` — sur le patron déjà éprouvé de `controleEquilibre` (069).

**Pourquoi c'est structurellement vrai et pas une coïncidence.** Le BFR normatif de 069 (`délai × assiette / 360`)
est exactement l'**état stationnaire** de l'échéancier mensuel : si les produits sont répartis uniformément sur
12 mois, les créances non encore encaissées au 31/12 valent `produits/12 × délai/30 = produits × délai/360` —
la formule normative elle-même. Le mensuel et l'annuel ne sont pas deux modèles : c'est **le même modèle à deux
granularités**. L'identité en découle ; le contrôle la matérialise.

### Le modèle mensuel (mois `m ∈ 1..12` de l'exercice N+1)

**1. Répartition de l'activité** — les agrégats annuels N+1 (déjà calculés par 069) sont répartis sur 12 mois
par **partition entière exacte** : `q = ⌊V/12⌋`, et le reste `V − 12q` est distribué **un par un sur les
premiers mois**. Aucune perte d'unité mineure : `Σ des 12 parts = V` **exactement**.

**2. Échéancier — les délais décalent l'encaissement, pas la production**
```
produits(m), achats(m), chargesExploitation(m)   = parts mensuelles (cf. 1)
encaissementsClients(m)   = créances arrivées à échéance ce mois
                            (produits du mois m − delaiBfrClientsJours, et reliquat d'ouverture)
decaissementsFournisseurs(m) = dettes fournisseurs arrivées à échéance
                            (achats du mois m − delaiBfrFournisseursJours, et reliquat d'ouverture)
decaissementsCharges(m)   = chargesExploitation(m)            (réglées au comptant — convention du modèle)
```
Les **encours d'ouverture** (créances et dettes du BFR normatif de la base, `bfr(0)`) sont encaissés/décaissés
sur les premiers mois, selon leur délai résiduel. Les **encours de clôture** au mois 12 valent donc exactement
`bfr(1)` de l'annuel — c'est ce qui ferme l'identité.

**3. Solde de trésorerie cumulé**
```
fluxNet(m)              = encaissementsClients(m)
                          − decaissementsFournisseurs(m) − decaissementsCharges(m)
                          − investissements(m) + financement(m) − remboursements(m)
tresorerieOuverture(1)  = ancres.tresorerieBase          (identique à l'ouverture N+1 de 069)
tresorerieCloture(m)    = tresorerieOuverture(m) + fluxNet(m)
tresorerieOuverture(m+1)= tresorerieCloture(m)
```
`investissements` / `financement` / `remboursements` sont répartis par la **même** partition entière (§1) —
un échéancier non uniforme (saisi par l'utilisateur) est **hors périmètre**, hook documenté.

**4. Contrôle d'articulation — le critère protecteur de la story**
```
ecartArticulation = Σ_{m=1..12} fluxNet(m) − fluxNetAnnuel(N+1)
articule          = (ecartArticulation === 0)
```
et, en corollaire, `tresorerieCloture(12) === tresorerieCloture(N+1)` de la projection annuelle.
**Arrondis inclus** : la partition entière ne perd aucune unité, et l'échéancier est un pur décalage
d'encours (il déplace des montants dans le temps, il n'en crée ni n'en détruit).

### Ce que le cadrage impose (décisions D3/D4)

- **Préalable, dans cette story** : `bfrNormatif` et `arrondir` sont aujourd'hui **`private`** dans
  `ProjectionAnnuelleService`. Les extraire en unités pures exportées (`projection/bfr.ts`) **avant** d'écrire
  le mensuel — sans quoi 070 réécrirait la formule et l'identité deviendrait un rapprochement (D3).
- **Garde P7 en spec exécutable** : prouver que `LiasseProduite` n'est importé que par `ancrage.ts`, sur le
  patron d'`operandes-coherence.spec.ts`. Une consigne se contourne par inattention ; un test rouge, non (D3).
- **Garde de version** : un test figeant, pour un jeu d'essai canonique, **la sortie complète ET**
  `MODELE_PROJECTION_VERSION` — pour qu'un changement de formule sans incrément de version vire au rouge (D4).

---

## Scope

**Dans le périmètre :**
- **Refactor préalable** : `projection/bfr.ts` (extraction de `bfrNormatif` + `arrondir` en pur exporté),
  `ProjectionAnnuelleService` recâblé dessus — **aucun changement de comportement** (non-régression prouvée par
  les 39 tests existants de 069, inchangés).
- `projection/projection-mensuelle.service.ts` — moteur **pur** (0 injection) : partition entière, échéancier
  par délais, solde cumulé, contrôle d'articulation.
- `projection/projection-mensuelle.types.ts` + extension de `ProjectionService` (même orchestration, même
  snapshot, mêmes ancres) + `GET /bilan/hypotheses/:id/projection-mensuelle` + DTO.
- **Spec de garde P7** (import de `LiasseProduite`) et **test de garde de version** (D3/D4).
- Tests unit + e2e + **discipline mutation-test** + vérif docker.

**Hors périmètre :**
- Mensualisation de **N+2/N+3** (FR-020 dit 12 mois ; l'annuel couvre le reste).
- **Échéancier non uniforme** saisi par l'utilisateur (répartition manuelle mois par mois) — hook.
- **TVA / encaissements décalés d'impôts** — hors modèle simplifié (cf. D4 §2, IS différé).
- **Scénarios comparés** (FR-021 → STORY-071), **versions d'hypothèses** (D1 → story dédiée avant 073).

---

## Critères d'acceptation

- [x] `GET /bilan/hypotheses/:id/projection-mensuelle` renvoie **12 périodes mensuelles** (`mois` 1..12,
      millésime déduit comme en 069), chacune avec **encaissements**, **décaissements** (fournisseurs +
      charges), **flux net**, **trésorerie d'ouverture** et **trésorerie de clôture**.
- [x] **Solde cumulé** : `tresorerieOuverture(1)` vaut l'ancre de trésorerie de la base, et
      `tresorerieOuverture(m+1) === tresorerieCloture(m)` pour tout `m`.
- [x] **Articulation (identité, FR-020 AC-2)** : `ecartArticulation === 0` et `articule === true` ; en
      corollaire `tresorerieCloture(12)` est **égale** à la trésorerie de clôture N+1 de
      `GET …/projection` — sur les mêmes hypothèses, y compris avec des taux produisant des arrondis.
      **Prouvé sur un balayage de 1260 combinaisons**, pas sur un jeu d'essai (cf. *Réalisé*).
- [x] **Les délais décalent réellement** : à délais BFR **nuls**, encaissements = produits du mois ; à délai
      clients de 90 j, les 3 premiers mois n'encaissent que l'encours d'ouverture. Une trésorerie qui
      **plonge en cours d'année puis remonte** est visible dans les 12 soldes alors que l'annuel la masque.
- [x] **Réutilisation prouvée (D3)** : le mensuel consomme `extraireAncres`, `bfr.ts` et `millesime.ts` ;
      **spec exécutable** lisant les **sources** de `projection/` et échouant sur tout import de
      `LiasseProduite` hors `ancrage.ts`.
- [x] **Garde de version (D4)** : test figeant les **12 périodes complètes** + `MODELE_PROJECTION_VERSION`.
- [x] **Gardes** : jeu d'hypothèses d'une autre org → **404** ; snapshot absent → **404 `BASE_INTROUVABLE`** ;
      gate refusé → **403** ; sans jeton → **401**. **Déterminisme** : deux appels ⇒ réponse identique.
- [x] **Non-régression 069** : les tests du moteur annuel passent **inchangés** après l'extraction de `bfr.ts`.
- [x] **Ajout au périmètre initial** — *contrat de la réponse* : `fluxNet(m)` est **exactement** la somme des
      lignes publiées de la période. A imposé de publier la variation de stocks (`decaissementsStocks`),
      qui entrait dans le flux sans figurer dans la réponse.

---

## Notes techniques

- **`ProjectionMensuelleService`** — service **pur**, sur le patron de `ProjectionAnnuelleService`. Il prend
  les **ancres**, les **hypothèses** et le **résultat annuel N+1 déjà calculé** (pour que l'articulation soit
  une identité, pas une re-dérivation).
- **Partition entière** : `repartir(V, 12)` → 12 entiers dont la somme est exactement `V` (reste distribué sur
  les premiers mois). C'est le cœur de l'exactitude ; à tester isolément, y compris sur `V` négatif.
- **Délais en mois** : `delaiJours / 30`, partie entière = nombre de mois de décalage, reste = fraction
  encaissée le mois suivant. Convention à figer et documenter (cohérente avec la base **360** de 069 :
  12 mois × 30 j).
- **Route** : `@Get(':id/projection-mensuelle')`, même contrôleur que la projection annuelle ou contrôleur
  frère — segments distincts de `@Get(':id')` (piège d'ordre de routes CLAUDE.md), **prouvé en e2e**.
- **Aucune écriture**, aucune transaction, aucune nouvelle collection.

---

## Dépendances

**Prérequis :** STORY-069 ✅ (ancres, BFR normatif, résultat annuel N+1, patron de contrôle) · STORY-068 ✅ · STORY-065 ✅.
**Débloque :** STORY-071 (FR-021 — les scénarios comparent annuel **et** mensuel).
**Ne dépend PAS de** la story « versions d'hypothèses » (D1) — celle-ci est prérequis de 073 seulement.

---

## Definition of Done

- [x] Lint 0 warning · build OK · couverture **98,48 / 92,63 / 98,91 / 98,44** (≥ 65/90/90/90) ·
      **554 unit** + **128 e2e** verts · **non-régression 069 explicite**.
- [x] **Mutation-test** — **6 mutations vérifiées rouges**, fichiers restaurés à l'identique ensuite
      (cf. *Mutation-test* ci-dessous).
- [x] **Vérif docker réelle** : 12 mois calculés sur une base validée réelle, `ecartArticulation = 0`,
      `tresorerieCloture(12)` **égale** à la clôture N+1 de l'endpoint annuel, aucune écriture (compteurs
      identiques avant/après). Consignée dans *Progress Tracking*.
- [x] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [x] Flux git : `MNV-070` sur `dev` + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- Extraction `bfr.ts` + non-régression : 0,5 pt · partition entière + échéancier par délais : 2 pts ·
  contrôle d'articulation + solde cumulé : 1 pt · endpoint/DTO/orchestration : 0,5 pt ·
  tests unit/e2e + gardes P7 & version + mutation : 0,5 pt · vérif docker : 0,5 pt · **Total : 5 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-23 : Créée (Scrum Master) — statut `defined`. Cadrée par
  [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md)
  (D3 : extraction préalable de `bfr.ts`, garde P7 exécutable ; D4 : garde d'incrément de version).
- 2026-07-24 : Implémentée → revue de code (**3 constats bloquants** corrigés) → vérif docker → revue de
  sécurité (0 vulnérabilité) → PR #28 « Rebase and merge » sur `dev`, HEAD `d273adf`. Statut `done`.

**Réalisé :**
- `ProjectionMensuelleService` — moteur **pur** (0 injection) : `partition` entière exacte,
  `echeancierDelai` (décalage par délais BFR, bouclé sur l'encours de clôture normatif),
  solde cumulé, `verifierArticulation`.
- `GET /bilan/hypotheses/:id/projection-mensuelle` + `ProjectionMensuelleResponseDto` (Swagger),
  orchestré par `ProjectionService.projeterMensuel` — **lecture pure**, aucune écriture.
- **Préalable D3 livré** : `bfr.ts` (`bfrNormatif` + `arrondir`) et `millesime.ts` extraits en unités pures
  exportées, consommées par les **deux** moteurs — le mensuel ne réécrit aucune formule de l'annuel.

**Constats de revue corrigés avant intégration (3 bloquants + 3 majeurs) :**
1. **L'articulation n'était PAS une identité.** L'échéancier laissait « tomber » la production échéant
   après le mois 12, produisant un encours de clôture en **parts entières**, là où l'annuel retranche le
   BFR **normatif** `arrondir(assiette × délai/360)`. Les deux quantités diffèrent de quelques unités
   d'arrondi : **écart non nul sur 792 des 1260 combinaisons (63 %)**, l'écart n'étant nul que si
   `⌊délaiClients/30⌋ == ⌊délaiFournisseurs/30⌋`. Les deux jeux d'essai livrés (45/60 et 17/11) tombaient
   tous deux dans la même bande — verts **par coïncidence**. Correctif : l'encours de clôture devient un
   **paramètre imposé**, `Σ règlements = ouverture + production − clôture`, le résidu d'arrondi tombant
   sur le dernier mois.
2. **`fluxNet` n'était pas la somme des lignes publiées** : un terme de variation de stocks y entrait sans
   figurer dans la réponse (48 611 inexpliqués sur le mois 1 du jeu canonique). Correctif : ligne
   `decaissementsStocks` publiée (types + DTO + Swagger), invariant testé en unitaire **et** en e2e.
3. **Suite e2e rouge** : `JeuHypothesesController` absent du module de test → le test de non-collision de
   routes répondait 404 et ne prouvait rien. Correctif : les deux contrôleurs montés.
4. **Garde P7 factice** : elle assertait `not.toHaveProperty('postes')` sans inspecter aucun import.
   Correctif : la garde lit les **sources** de `projection/` et échoue sur tout `LiasseProduite` hors
   `ancrage.ts`.
5. **Garde de version incomplète** : les 12 périodes n'étaient pas figées. Correctif : gel complet.
6. **Tests à fausse assurance** : `toBeLessThanOrEqual` / `toBeGreaterThan(0)` là où le critère énonce une
   **égalité** — un moteur renvoyant `0` partout les franchissait (vérifié). Et le flux annuel était écrit
   **en dur** (`7_333_332`) au lieu d'être calculé : c'est ce qui a laissé passer le constat n°1.
   Correctif : égalités exactes, et les specs font tourner `ProjectionAnnuelleService` pour alimenter le
   mensuel. **Mineurs** : commentaires anglais traduits, JSDoc supprimés hors périmètre restaurés (dont le
   `+ 0` d'`arrondir`, avec avertissement explicite qu'il n'est pas mort), duplication de `millesime` levée.

**Qualité (DoD) :** lint **0 warning** · build OK · couverture **98,48 branches / 92,63 fonctions /
98,91 lignes / 98,44 statements** (module `projection` à **100 %** hors `projection.service.ts` à 96,77) ·
**554 unit** + **128 e2e** verts · non-régression 069 (moteur annuel inchangé après extraction de `bfr.ts`).

**Mutation-test :** 6 mutations, **toutes vérifiées rouges**, fichiers restaurés à l'identique après chaque
essai (`diff` de contrôle) :
| Mutation | Garde qui rougit |
|---|---|
| `partition` privée de son reste | balayage d'articulation |
| bouclage sur l'encours de clôture annulé (**le bug d'origine**) | balayage d'articulation |
| ligne stocks retirée du contrat mais gardée dans `fluxNet` | invariant « total = somme des lignes » |
| `LiasseProduite` importé hors `ancrage.ts` | garde P7 (D3) |
| décalage des délais annulé | test « les délais décalent réellement » |
| formule modifiée sans incrément de version (totaux préservés) | garde de version (D4) |

**Vérification docker réelle :** stack `docker compose down -v` puis neuve (mongo rs0 + kafka + redis +
mailhog + IdP + bilan-service), org réelle créée via `register`/`login` sur l'IdP, **JWT RS256 réel**,
`emailVerifiedAt` posé en base, read-models `orgkycstatuses`/`orgbilanentitlements` alimentés.
⚠️ Ces deux read-models n'ont **pas** de `collection` explicite : Mongoose applique le pluriel par défaut —
requêter `org_kyc_status` crée une collection fantôme et renvoie 0 sans erreur.
- Jeu d'hypothèses **clients 30 j / fournisseurs 90 j / stocks 60 j** — précisément la combinaison qui
  sortait `ecart = -1` **avant** correction.
- `GET …/projection-mensuelle` → **200**, 12 périodes, `ecartArticulation = 0`, `articule = true`.
- `tresorerieCloture(12) = 19 750 000` **=** clôture N+1 de `GET …/projection` ;
  `Σ fluxNet mensuels = 7 750 000` **=** flux net annuel N+1.
- `fluxNet` = somme des lignes publiées sur **12/12** mois ; chaîne `ouverture(m+1) = clôture(m)` vérifiée ;
  `ouverture(1) = 12 000 000` = ancre de trésorerie ; deux appels **strictement identiques**.
- **Aucune écriture** : compteurs `jeux_etats` / `snapshots_liasse` / `jeux_hypotheses` / `audit_events` /
  `exercices` **identiques avant et après** les appels.
- Gardes : sans jeton → **401** · id inconnu → **404 `HYPOTHESES_INTROUVABLE`** · jeu d'une **autre org** →
  **404 `HYPOTHESES_INTROUVABLE`** · snapshot disparu → **404 `BASE_INTROUVABLE`** · endpoint présent dans
  Swagger (`/api/docs-json`).

**Revue de sécurité (PR #28) :** **aucune vulnérabilité exploitable**. Douze points instruits et écartés
avec preuve, dont : franchissement de tenant via `jeu.base.snapshotId` (`SnapshotLiasseRepository` est
**lui aussi** tenant-scoped ⇒ 404, jamais le contenu) · `tenantObjectId` au retour ignoré (garde
décorative : l'isolation vient du `TenantContext` + fusion `{ tenantId }` en dernier, doublée par
`BilanAccessGuard`) · injection NoSQL via `:id` (segment unique ⇒ toujours `string` sous Express, plus
`ObjectId.isValid` en amont) · DoS algorithmique (boucles bornées par `NOMBRE_MOIS = 12`, délais bornés à
l'écriture par `@Max(3650)`).

**Incident rencontré (hors périmètre, traité à part) :** `origin/dev` était **cassé** à l'arrivée — le
commit `9ae9b04` « dto module » ajoutait 14 barrels `index.ts` générés pointant vers des modules
inexistants (**55 erreurs `TS2307`** au build + 3 erreurs de lint). Aucun fichier ne les important, ils ont
été retirés par une **PR dédiée (#27)** avant de rebaser la story, plutôt que d'être réparés en inventant
une surface d'export. Réintroduire des barrels corrects relève d'un commit dédié.

**Points ouverts remontés pour les stories suivantes :**
- **STORY-071 (scénarios)** : les scénarios devront comparer annuel **et** mensuel ; l'invariant « même
  base validée » entre jeux comparés reste à porter (déjà signalé par 069).
- **Échéancier non uniforme** (saisie mois par mois) et **mensualisation N+2/N+3** : hors périmètre FR-020,
  hooks laissés inertes.
- **Convention de délai** figée à `⌊délai/30⌋` mois + fraction résiduelle, cohérente avec la base 360 du BFR
  normatif — à ne pas modifier sans incrémenter `MODELE_PROJECTION_VERSION` (la garde D4 le force).

**Actual Effort :** ~5 pts (conforme), dont une part notable en revue/correction plutôt qu'en écriture.
