# STORY-122 : **Référentiel CIMA assurances** `@1.0` (version allégée) — plan propre + Bilan/CR technique & net — FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service) — **extension**
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-007 (multi-référentiel, même code) — ouvre le vertical `assurance` (prévu admin-panel)
**Réf. analyse :** `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §3 · `docs/referentiels/README-cima-assurances.md`
**Réf. code livré :** STORY-057 (patron « ajouter un référentiel = données ») · STORY-110/111/112 (opérandes/`FORMULE`)
**Priorité :** Could Have
**Story Points :** 5
**Statut :** in_progress ⏳ (incrément 1 — paquet allégé + cohérence — livré 2026-07-21 ; ventilation Vie/Non-Vie + provisions techniques + vérif docker + validation actuaire restants)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 15 (ajout hors engagement initial — extension EPIC-010/FR-007)

---

## User Story

**En tant qu'**entreprise d'assurance agréée **CIMA**,
**je veux** un référentiel comptable **propre à l'assurance** (plan CIMA, provisions techniques, résultat technique),
**afin de** produire mon Bilan et mon Compte de résultat selon le **Plan comptable particulier à l'assurance et à la capitalisation**, sur le **même** moteur que les autres verticaux (P7).

---

## Description

### Contexte (⚠️ secteur exclu du SYSCOHADA)
Les entreprises d'assurance sont **exclues du SYSCOHADA** (comme banques/PCB et SFD/RCSFD) : elles appliquent le **plan comptable CIMA** (Code des assurances, Chap. III, art. 431/433), à **classes propres** (1-8 et 0). Particularités : **provisions techniques (classe 3)** au cœur du passif, **cycle inversé** (primes d'avance / sinistres différés), **réassurance** omniprésente, séparation **Vie/Non-Vie**, **pas de TFT**. Le vertical `assurance` est déjà prévu au provisioning admin-panel.

### Amorce v1 (sourcée art. 431, à valider par actuaire)
- **`planDeComptes`** = **liste officielle art. 431** (comptes à 2 chiffres, libellés verbatim, classes **0-8**).
- **`postes` + `tableDePassage`** = **proposition structurellement cohérente** (plan ⊇ préfixes) :
  - Bilan actif : valeurs immobilisées, **part des réassureurs dans les provisions techniques**, créances, comptes financiers ;
  - Bilan passif : capitaux propres, provisions R&C, **provisions techniques brutes**, dettes ;
  - Compte de résultat : **résultat technique** (`FORMULE`) + **résultat net** (`FORMULE`).
- Statut **« à valider par un actuaire / expert assurance »**.

### Hors amorce (stories dédiées)
Ventilation fine **Vie/Non-Vie**, **variations de provisions techniques** poste à poste, part réassureurs ligne à ligne, états annexes **C1..C25**, impôt sur les bénéfices dans la cascade.

---

## Scope
**Dans le périmètre :** sources `plan-comptable-cima.json` / `postes-cima.json` / `table-de-passage-cima.json` ; entrée `cima-assurances@1.0` dans `build.mjs` + `ReferentielRegistry` ; spec de cohérence (CC1..CC4 + classe 3 = provisions techniques au **PASSIF**, classe 0 hors table).
**Hors périmètre :** production réelle de la liasse CIMA + vérif docker ; séparation Vie/Non-Vie ; variations de provisions techniques ; états C1..C25 ; entitlement `cima-assurances` à une org.

---

## Acceptance Criteria
- [ ] **AC-1 — Packagé & chargeable.** `resolve('cima-assurances','1.0')` ≠ null ; `load` OK ; checksum vérifié.
- [ ] **AC-2 — Plan propre bien formé (CC1).** Comptes art. 431, classes **0-8**, sans doublon ; la **classe 0** (engagements hors-bilan) est présente au plan.
- [ ] **AC-3 — Plan ⊇ table (CC2).** 0 mapping orphelin.
- [ ] **AC-4 — Cascades FORMULE intègres (CC4).** RT (résultat technique) et RN (résultat net) référencent des postes déclarés.
- [ ] **AC-5 — Découplage prouvé.** Le compte `31` → **BILAN_PASSIF / CP3** (provisions techniques), présentation **propre** à l'assurance (≠ SYSCOHADA).
- [ ] **AC-6 — Non-régression.** SYSCOHADA/SFD inchangés.
- [ ] **AC-7 (aval) — Production réelle & validation actuaire.** Liasse CIMA calculée sur une balance assurance ; **vérifiée docker** ; contenu validé par un expert.

---

## Definition of Done
- [ ] Lint 0 warning · build OK · couverture ≥ seuils · unit + e2e verts.
- [ ] AC-1 → AC-6 validés (**faits**, increment 1) ; **AC-7 + vérif docker** (aval, en attente).
- [ ] Non-régression (checksums intacts).
- [ ] `/code-review` + PR `MNV-122` → `dev` — **en attente**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (4ᵉ/5ᵉ référentiel — ouvre le vertical assurance) par vivian.
- 2026-07-21 : **Incrément 1 livré** — `defined → in_progress`.

**Incrément 1 (fait) :** `cima-assurances@1.0` packagé — plan **80** comptes (art. 431, classes 0-8), **25** postes dont RT/RN `FORMULE`, **25** règles. Artefact `cima-assurances-1.0.json` sha256 `1f36250c…`. Spec CC1..CC4 + compte `31` → CP3 PASSIF **verts**. Non-régression SYSCOHADA/SFD.

**Reste :** production de la liasse CIMA (résultat technique/net sur balance assurance), séparation Vie/Non-Vie + variations de provisions techniques, **vérification docker**, **validation actuaire**, `/code-review` + PR.

---

**Story créée avec la méthode BMAD v6 — extension EPIC-010 (FR-007).**
