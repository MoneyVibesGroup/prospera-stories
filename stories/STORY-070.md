# STORY-070 : Plan de trésorerie mensuel 12 mois (encaissements/décaissements, échéancier BFR) — FR-020

**Epic :** EPIC-013 — Prévisionnel (mensuel 12 mois + annuel 3 ans) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-020 (échéancier mensuel des encaissements/décaissements sur 12 mois glissants, dérivé des hypothèses — notamment délais BFR — et du solde de trésorerie initial) ; **dépend FR-018**
**Réf. cadrage :** [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md) — **D3** (réutilisation obligatoire de `ancrage.ts` + `bfr.ts`, garde P7 en spec exécutable) et **D4** (garde d'incrément de `MODELE_PROJECTION_VERSION`)
**Réf. code livré :** **STORY-069** (`extraireAncres`, `ProjectionAnnuelleService`, `controleEquilibre`, `MODELE_PROJECTION_VERSION`) · **STORY-068** (`JeuHypotheses`) · **STORY-065** (`SnapshotLiasse`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** defined
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

- [ ] `GET /bilan/hypotheses/:id/projection-mensuelle` renvoie **12 périodes mensuelles** (`mois` 1..12,
      millésime déduit comme en 069), chacune avec **encaissements**, **décaissements** (fournisseurs +
      charges), **flux net**, **trésorerie d'ouverture** et **trésorerie de clôture**.
- [ ] **Solde cumulé** : `tresorerieOuverture(1)` vaut l'ancre de trésorerie de la base, et
      `tresorerieOuverture(m+1) === tresorerieCloture(m)` pour tout `m`.
- [ ] **Articulation (identité, FR-020 AC-2)** : `ecartArticulation === 0` et `articule === true` ; en
      corollaire `tresorerieCloture(12)` est **égale** à la trésorerie de clôture N+1 de
      `GET …/projection` — sur les mêmes hypothèses, y compris avec des taux produisant des arrondis.
- [ ] **Les délais décalent réellement** : à délais BFR **nuls**, encaissements = produits du mois ; à délai
      clients de 90 j, les 3 premiers mois n'encaissent que l'encours d'ouverture. Une trésorerie qui
      **plonge en cours d'année puis remonte** est visible dans les 12 soldes alors que l'annuel la masque.
- [ ] **Réutilisation prouvée (D3)** : le mensuel consomme `extraireAncres` et `bfr.ts` ; **spec exécutable**
      vérifiant que `LiasseProduite` n'est importé que par `ancrage.ts`.
- [ ] **Garde de version (D4)** : test figeant sortie canonique + `MODELE_PROJECTION_VERSION`.
- [ ] **Gardes** : jeu d'hypothèses d'une autre org → **404** ; snapshot absent → **404 `BASE_INTROUVABLE`** ;
      gate refusé → **403** ; sans jeton → **401**. **Déterminisme** : deux appels ⇒ réponse identique.
- [ ] **Non-régression 069** : les 39 tests du moteur annuel passent **inchangés** après l'extraction de `bfr.ts`.

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

- [ ] Lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · **non-régression 069 explicite**.
- [ ] **Mutation-test** sur les critères protecteurs — au minimum : casser la partition entière (perdre le
      reste) ⇒ `ecartArticulation ≠ 0` rouge · annuler le décalage des délais ⇒ le test « les délais décalent
      réellement » rouge · figer le BFR ⇒ rouge. Vérifier le rouge, puis restaurer.
- [ ] **Vérif docker réelle** : 12 mois calculés sur une base validée réelle, `ecartArticulation = 0` constaté,
      `tresorerieCloture(12)` **égale** à la clôture N+1 de l'endpoint annuel, aucune écriture (compteurs de
      collections identiques avant/après). Consignée dans *Progress Tracking*.
- [ ] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [ ] Flux git : `MNV-070` sur `dev` + docs sur `main`, PR « Rebase and merge ».

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

**Réalisé :** _(à compléter en dev-story)_

**Qualité (DoD) :** _(à compléter — lint / build / couverture / unit / e2e / non-régression 069)_

**Mutation-test :** _(à compléter — mutations prévues : partition entière privée de son reste ⇒ articulation
non nulle ; décalage des délais annulé ; BFR figé)_

**Vérification docker réelle :** _(à compléter — 12 mois sur base validée réelle, `ecartArticulation = 0`,
clôture mois 12 = clôture N+1 de l'annuel, aucune écriture)_

**Actual Effort :** _(à compléter)_
