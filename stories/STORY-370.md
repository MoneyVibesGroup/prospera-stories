# STORY-370 : L'import cesse de fondre deux banques en une — la provenance d'un auxiliaire survit à la normalisation

Status: in_progress

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 5 · **Sprint :** 20 (backend) · **Service :** `balance-service` (`:3007`)
**Gap repris :** `GAP-auxiliaires-fusionnes-a-l-import`
**Décision :** **AD-5** de `architecture-balance-service-2026-08-15` — *la normalisation ne détruit
jamais une distinction qu'elle ne sait pas reconstituer*
**Origine :** défaut **créé par STORY-146**, **confirmé** par la vérification docker de STORY-172

---

## Le constat

La normalisation d'import ramène tout auxiliaire au compte de plan : **`5211BOA0` ET `5211ECO1`
deviennent tous deux `521100`** (tête `5211`, complétée par des zéros), puis sont **fusionnés en une
seule ligne** de balance.

⇒ **La balance ne distingue plus les deux banques.**

## Pourquoi ce n'est pas un bug de normalisation

⚠️ **La normalisation est une fonction du SEUL numéro de compte.** Elle **ne peut pas savoir** que deux
auxiliaires d'un même collectif désignent **deux comptes bancaires réels et distincts**. Elle fait
exactement ce qu'on lui a demandé.

Le regroupement **est signalé** — `comptesReecritsSansRegroupement`, avertissements d'import — mais
⛔ **l'information de provenance n'est pas conservée dans la ligne produite**. C'est là qu'est le
défaut : pas dans le calcul, dans **ce qui est jeté**.

## ⚡ La conséquence, et pourquoi aucun avertissement ne peut la rattraper

Le rapprochement bancaire ne peut **pas** restituer une position par banque : **l'information n'existe
plus dans la donnée**.

> ⛔ **Et le garde-fou existant est aveugle sur ce cas précis.** STORY-172 publie un avertissement dès
> que l'appariement retient **plusieurs** lignes. Ici, il en retient **UNE** — `nbComptesApparies = 1`
> — sur un solde pourtant **CUMULÉ**. **Donc aucun avertissement n'est possible.**

⇒ **Un cabinet à deux banques voit le solde des deux présenté comme celui d'une seule, face au relevé
d'une seule.**

⚠️ Le défaut est **antérieur à STORY-172**, qui **ne l'aggrave pas** : avant elle, ces comptes ne
s'appariaient **à rien du tout**.

## ⛔ Ce qu'il ne faut surtout pas faire

**Ne PAS corriger dans l'appariement.** *Deviner une ventilation que personne n'a déclarée serait pire
que le silence* — le rapprochement produirait des positions par banque **fabriquées**, et elles
seraient crédibles.

⇒ **La correction est côté IMPORT**, là où l'information existe encore.

## Ce que la story livre — deux voies, à trancher à l'ouverture

| Voie | Ce qu'elle fait | Ce qu'elle coûte |
| --- | --- | --- |
| **A — conserver la provenance** | La ligne de balance garde les auxiliaires qui l'ont produite ; le rapprochement **ventile** | Le contrat de ligne s'enrichit ⇒ checksum et consommateurs à vérifier |
| **B — refuser de fondre** | ⛔ Refus de fusionner deux auxiliaires rattachés à des **comptes de trésorerie déclarés distincts** | Aucun changement de contrat ; mais un import légitime peut être bloqué et demande une déclaration préalable |

⚡ **Les deux sont acceptables ; ce qui ne l'est pas est de fondre en silence.** La voie retenue est
écrite **dans la story avant de coder**, pas déduite du diff.

### ✅ Voie retenue à l'ouverture (2026-08-18) — **A, dans sa forme complète**

**La ligne de balance conserve les auxiliaires qui l'ont produite, AVEC leurs montants**, et le
rapprochement **ventile** — il ne devine rien, il relit ce que le fichier portait.

**Ce qui a été mesuré dans le code avant de trancher**, et qui rend A moins cher que la story ne le
craignait :

1. ⚡ **Le checksum n'est pas touché.** `v2` ne couvre que
   `{compte, libelle, mouvementDebit, mouvementCredit, soldeDebiteur, soldeCrediteur, niveauPreuve}`
   (`balance-canonique.ts`). Un champ **optionnel** hors de cette liste s'introduit exactement comme
   `origine` l'a été (« son absence est le cas courant […] c'est ce qui permet de l'introduire **sans**
   toucher au checksum, sans migration et sans changer le contrat `balance.created` »). ⇒ **pas de `v3`,
   pas de migration, contrat d'événement inchangé.**
2. ⚡ **La provenance n'est conservée QUE sur le cas visé** — un regroupement dont ≥ 2 sources
   s'apparient à ≥ 2 **comptes de trésorerie déclarés distincts**. Le collectif `411` d'un fichier à
   4 000 auxiliaires **ne porte rien** : c'est l'AC-3 (« le comportement actuel est inchangé »), et c'est
   aussi ce qui empêche le document de croître avec le fichier (CWE-770, même discipline que
   `MAX_SOURCES_PAR_REGROUPEMENT`).
3. ⚡ **Ventiler ici n'est pas deviner.** Les montants par auxiliaire **existent dans le fichier** ; ils
   sont aujourd'hui jetés au moment du netting. Les rendre au rapprochement lui restitue une position par
   banque **déclarée**, pas fabriquée — la frontière que la story trace au § *Ce qu'il ne faut surtout
   pas faire* reste tenue : **aucune règle de ventilation n'est inventée**, ni ici ni dans l'appariement.

**Pourquoi pas B.** Le refus est plus sûr sur le contrat, mais le plan comptable du référentiel fait
**6 caractères** : l'auxiliaire n'y survit pas. Un cabinet à deux banques — le cas courant, pas
l'exception — **n'a donc aucun chemin de reprise** : il ne peut pas produire deux lignes `5211xx` que le
plan n'admet pas. B échangerait une fusion silencieuse contre un **blocage sans issue**, et le motif du
blocage (« déclarez vos comptes autrement ») ne décrit aucune action que le comptable puisse réellement
faire.

**Pourquoi pas A-minimal** (les noms des sources, sans les montants). Il aurait suffi à satisfaire l'AC-2
*par le refus de présenter* — le rapprochement dit « solde cumulé sur 2 banques, je ne publie pas de
position par banque ». C'est honnête, mais ça laisse le cabinet **sans son rapprochement** alors que la
donnée nécessaire était dans le fichier et qu'on venait de la jeter. Conserver les montants coûte le même
champ optionnel ; s'en priver, c'est choisir de rester aveugle par économie.

## Critères d'acceptation

- **Étant donné** un import portant `5211BOA0` et `5211ECO1`, tous deux rattachés à des **comptes de
  trésorerie déclarés distincts** **quand** l'import s'exécute **alors** ⛔ **les deux soldes ne sont
  jamais présentés comme un seul, sans trace** — soit la provenance survit (A), soit l'import refuse
  (B).
- **Étant donné** un rapprochement sur ce cas **quand** il s'exécute **alors** il **ne présente pas un
  solde cumulé comme celui d'une seule banque**.
- **Étant donné** deux auxiliaires d'un même collectif **qui ne désignent aucun compte de trésorerie
  déclaré** **quand** l'import s'exécute **alors** le comportement actuel est **inchangé** — ⛔ la story
  ne durcit pas le cas ordinaire.
- ⛔ **Étant donné** l'appariement **quand** on lit son code **alors** **aucune ventilation n'y est
  devinée** : la correction reste côté import.
- **Étant donné** un import ancien rejoué **quand** il passe **alors** son résultat est **explicable** :
  ce qui change est **annoncé**, jamais découvert dans une balance.

## Ce que cette story ne fait PAS

- ⛔ Elle ne revient pas sur la normalisation elle-même (STORY-146), qui reste **juste** pour tous les
  comptes non auxiliaires.
- ⛔ Elle ne touche pas au niveau de détail ni aux prédicats de compte (STORY-146/172, fermés).
- ⛔ Elle n'invente **aucune** règle de ventilation.

## Definition of Done

- [ ] Le cas **deux banques** est couvert par un test **qui échoue sur la version actuelle**.
- [ ] La voie retenue (A ou B) est **écrite dans la story** avant l'implémentation, avec son motif.
- [ ] Le rapprochement **ne peut plus** présenter un solde cumulé comme celui d'un seul compte.
- [ ] **Non-régression** : un import sans auxiliaire de trésorerie produit **exactement** la même
      balance qu'aujourd'hui.
- [ ] `GAP-auxiliaires-fusionnes-a-l-import` passe à **fermé**.

---

## Progress Tracking

- **2026-08-18** — statut `not_started` → `in_progress`. Branches `MNV-370` ouvertes sur `docs/` (base
  `main`) et `balance-service` (base `dev`).
- **2026-08-18** — ✅ **voie tranchée à l'ouverture : A dans sa forme complète** (provenance *et*
  montants, restreinte au cas trésorerie). Motif complet au § *Voie retenue à l'ouverture*, écrit
  **avant** la première ligne de code.
