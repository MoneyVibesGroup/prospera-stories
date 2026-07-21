# STORY-121 : **Référentiel Zone Franche Togo** `@1.0` — présentation SYSCOHADA + paquet fiscal dérogatoire — FR-005/FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service) — **extension**
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-005 (chargement du référentiel actif) / §FR-007 (multi-référentiel, même code)
**Réf. analyse :** `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §2 · `docs/referentiels/README-zone-franche-togo.md`
**Réf. code livré :** STORY-056 (SYSCOHADA packagé) · STORY-038 (loader/registre) · paquet fiscal Togo (`paquet-fiscal-togo-2026.json`)
**Priorité :** Could Have
**Story Points :** 3
**Statut :** in_progress ⏳ (incrément 1 — paquet `@1.0` + fiscal + cohérence — livré 2026-07-21 ; consommation prévisionnel + vérif docker restants)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 15 (ajout hors engagement initial — extension EPIC-010/FR-007)

---

## User Story

**En tant qu'**entreprise agréée en **Zone Franche togolaise** (statut d'Entreprise Franche),
**je veux** un référentiel qui produise ma liasse **exactement comme en SYSCOHADA révisé** mais qui porte mon **régime fiscal dérogatoire** (barème IS dégressif, exonérations),
**afin de** dériver plus tard un **prévisionnel d'impôt** conforme à mon agrément, sans fork de code (P7).

---

## Description

### Nature (⚠️ lire avant de coder)
La Zone Franche est un **régime FISCAL et douanier dérogatoire**, **pas un plan comptable**. Une entreprise franche tient sa comptabilité en **SYSCOHADA révisé**. Sur **décision utilisateur (2026-07-21)**, elle est néanmoins packagée comme **référentiel pluggable distinct** (4ᵉ référentiel), pour être sélectionnable/attribuable comme les autres.

### Modélisation honnête (aucune donnée comptable inventée)
- **plan / postes / table de passage** = **sources SYSCOHADA révisé réutilisées** (`plan-comptable-syscohada.json`, `postes-syscohada-guidef-togo.json`, `table-de-passage-syscohada.json`, `notes-syscohada.json`) → la **liasse est identique** à SYSCOHADA.
- **`paquetFiscal` propre** = `paquet-fiscal-togo-zonefranche.json` : **barème IS dégressif** (0 % ans 1-5 · 8 % ans 6-10 · 10 % ans 11-20 · 20 % dès 21), taxe dividendes (exonérée 5 ans puis 50 %), exonérations TVA / fiscalité de porte — `pays=TG`, `regime=zone-franche`. Sources publiques (investissement.gouv.tg, OTR, MCA-Togo) — **à valider/actualiser par un fiscaliste** (évolue avec la loi de finances).

Ce qui **distingue** ce référentiel du SYSCOHADA de droit commun = **son seul paquet fiscal**. Le `paquetFiscal` est **optionnel** pour le moteur d'états (non requis par la liasse) ; il sera consommé par le **prévisionnel** (EPIC-013, impôt prévisionnel).

---

## Scope
**Dans le périmètre :** source `paquet-fiscal-togo-zonefranche.json` ; entrée `zone-franche-togo@1.0` dans `build.mjs` (réutilise les sources SYSCOHADA + fiscal propre) + `ReferentielRegistry` ; spec de cohérence (présentation = SYSCOHADA à l'identique + paquet fiscal `regime=zone-franche`).
**Hors périmètre :** **consommation du barème dégressif par le prévisionnel** (calcul IS par ancienneté) = EPIC-013 ; variantes régionales Plateaux/Centrale/Kara/Savanes (paramétrées, non calculées) ; conditions d'agrément SAZOF (métier, hors moteur) ; vérif docker de la production.

---

## Acceptance Criteria
- [ ] **AC-1 — Packagé & chargeable.** `resolve('zone-franche-togo','1.0')` ≠ null ; `load` OK ; checksum vérifié.
- [ ] **AC-2 — Présentation = SYSCOHADA à l'identique.** `postes.length` et `tableDePassage.length` **égaux** au SYSCOHADA ; un compte (ex. `601`) se rattache au **même** poste/état que sous SYSCOHADA.
- [ ] **AC-3 — Paquet fiscal dérogatoire présent.** `paquetFiscal._meta.regime === 'zone-franche'` ; barème IS à 4 paliers dégressifs.
- [ ] **AC-4 — Déterminisme (CC3) & non-régression.** checksum registre = sha256 artefact ; SYSCOHADA `@2.1` **inchangé**.
- [ ] **AC-5 (EPIC-013) — Prévisionnel dérogatoire.** L'impôt prévisionnel applique le **taux du palier** selon l'ancienneté de l'entreprise franche ; **vérifié docker**.

---

## Definition of Done
- [ ] Lint 0 warning · build OK · couverture ≥ seuils · unit + e2e verts.
- [ ] AC-1 → AC-4 validés (**faits**, increment 1) ; **AC-5 + vérif docker** (EPIC-013, en attente).
- [ ] Non-régression SYSCOHADA (checksum intact).
- [ ] `/code-review` + PR `MNV-121` → `dev` — **en attente**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (décision utilisateur : zone franche = référentiel distinct) par vivian.
- 2026-07-21 : **Incrément 1 livré** — `defined → in_progress`.

**Incrément 1 (fait) :** `zone-franche-togo@1.0` packagé — présentation SYSCOHADA réutilisée (**174** comptes / **163** postes / **124** règles, égaux au SYSCOHADA) + `paquetFiscal` dérogatoire propre. Artefact `zone-franche-togo-1.0.json` sha256 `ecbd01e2…`. Spec : mapping `601` **identique** à SYSCOHADA + `regime='zone-franche'` **verts**. Non-régression SYSCOHADA (`01b892c0…` inchangé).

**Reste :** consommation du barème par le **prévisionnel** (EPIC-013), **vérification docker**, validation fiscaliste, `/code-review` + PR.

---

**Story créée avec la méthode BMAD v6 — extension EPIC-010 (FR-005/FR-007).**
