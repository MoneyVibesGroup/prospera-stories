# Sprint Plan — PROSPERA Phase 1 (Module 0 chaîne KYC + Module 1 Bilan)

**Date :** 2026-07-10
**Scrum Master :** vivian
**Niveau de projet :** 3
**Portée :** Phase 1 imminente du PLAN FINAL — Module 0 (chaîne KYC) et Module 1 (Bilan & prévisionnel), + socle restant (catalog EPIC-007, bilan squelette EPIC-008) et amorce Module 2 (paiement).
**Statut :** Draft

---

## Résumé exécutif

Ce plan découpe et alloue les stories des **Module 0** (chaîne KYC : `document-service` OCR + `admin-panel` BFF, décision AD-2) et **Module 1** (Bilan & prévisionnel, PRD `prd-bilan-service-2026-07-10.md`, NB-1), en s'appuyant sur le socle (`platform-catalog-service` EPIC-007, squelette `bilan-service` EPIC-008). Il **re-séquence les sprints 7+** : le paiement (EPIC-004) est repoussé en Module 2.

**Capacité retenue :** référence historique — **1 flux, ~24 pts/sprint engagés** (capacité 34, moyenne des sprints 1-5 ≈ 24), sprints de 2 semaines. Les cibles calendaires du PLAN FINAL (KYC sept. / Bilan oct. 2026) supposaient l'accélération **3 devs / 2 flux** ; à vélocité historique la séquence s'étire (Module 0 livré fin sprint 10, Bilan fin sprint 14). L'ajout de devs résorbe le décalage.

**Métriques clés :**
- Nouvelles stories : **35** (STORY-040→074) — Module 0 : 10 ; Bilan : 25.
- Total stories planifiées sprints 7-15 : 44 (dont socle catalog/bilan-squelette déjà définis + paiement).
- Sprints planifiés : **7 → 15** (9 sprints).
- Jalons : 🏁 chaîne KYC complète fin **S10** ; 🏁 Bilan en prod interne fin **S14**.

---

## Inventaire des stories (nouvelles — Module 0 & Bilan)

> Détail (titres, épics, services, points, dépendances) : `docs/sprint-status.yaml`. Résumé ci-dessous.

### Module 0 — chaîne KYC (EPIC-015 OCR / EPIC-016 admin-panel) — 40 pts
| Story | Epic | Service | Pts | Objet |
|-------|------|---------|-----|-------|
| STORY-040 | EPIC-015 | kyc-service | 3 | Émettre `kyc.document.uploaded` (outbox) au dépôt de pièce *(prérequis DO-1)* |
| STORY-041 | EPIC-015 | document-service | 5 | Scaffold `:3006` + `OcrProvider` (Tesseract) + accès MinIO |
| STORY-042 | EPIC-015 | document-service | 5 | Consumer `kyc.document.uploaded` → OCR extraction RCCM/CFE |
| STORY-043 | EPIC-015 | document-service | 5 | Comparaison déclaré/lu + expiré/illisible → `document.extrait` |
| STORY-044 | EPIC-015 | document-service | 3 | Persistance `DocumentExtraction` (+ GET consultation) |
| STORY-045 | EPIC-015 | kyc-service | 3 | Consommer `document.extrait` → enrichir le dossier de revue |
| STORY-046 | EPIC-016 | admin-panel | 3 | Scaffold BFF (relying party, PLATFORM_ADMIN, sans base) |
| STORY-047 | EPIC-016 | admin-panel | 5 | Vue agrégée orgs (identité + KYC + entitlements) |
| STORY-048 | EPIC-016 | admin-panel | 5 | Actions proxifiées : revue KYC + grant entitlement |
| STORY-049 | EPIC-016 | admin-panel | 3 | e2e chaîne KYC complète (docker) 🏁 |

### Module 1 — Bilan & prévisionnel (EPIC-009→014) — 105 pts
| Story | Epic | Pts | FR | Objet |
|-------|------|-----|----|----|
| STORY-050 | EPIC-009 | 5 | FR-001 | Import balance Excel/CSV |
| STORY-051 | EPIC-009 | 3 | FR-002 | Contrôle d'intégrité/équilibre |
| STORY-052 | EPIC-009 | 3 | FR-003 | Import comparatif N-1 |
| STORY-053 | EPIC-009 | 3 | FR-004 | Mapping de colonnes assisté |
| STORY-054 | EPIC-010 | 5 | FR-005 | Interface de référentiel + loader |
| STORY-055 | EPIC-010 | 5 | FR-006 | Table de passage comptes→postes |
| STORY-056 | EPIC-010 | 5 | FR-007 | Paquet SYSCOHADA révisé |
| STORY-057 | EPIC-010 | 5 | FR-007 | Paquet SFD-BCEAO |
| STORY-058 | EPIC-010 | 3 | FR-008 | Surcharges de mapping par org |
| STORY-059 | EPIC-011 | 5 | FR-009 | Bilan (actif/passif) N/N-1 |
| STORY-060 | EPIC-011 | 5 | FR-010 | Compte de résultat |
| STORY-061 | EPIC-011 | 5 | FR-011 | Tableau des flux (TFT/TAFIRE) |
| STORY-062 | EPIC-011 | 5 | FR-012 | Notes annexes |
| STORY-063 | EPIC-011 | 3 | FR-013 | Contrôles de cohérence liasse |
| STORY-064 | EPIC-012 | 3 | FR-014 | Cycle brouillon→validé |
| STORY-065 | EPIC-012 | 5 | FR-015 | Snapshot figé immuable |
| STORY-066 | EPIC-012 | 5 | FR-016 | Exercices comptables |
| STORY-067 | EPIC-012 | 3 | FR-017 | Piste d'audit |
| STORY-068 | EPIC-013 | 5 | FR-018 | Hypothèses prévisionnel |
| STORY-069 | EPIC-013 | 5 | FR-019 | Projection annuelle 3 ans |
| STORY-070 | EPIC-013 | 5 | FR-020 | Plan de trésorerie mensuel 12 mois |
| STORY-071 | EPIC-013 | 3 | FR-021 | Scénarios comparés |
| STORY-072 | EPIC-014 | 3 | FR-022 | Consultation états & prévisionnel |
| STORY-073 | EPIC-014 | 5 | FR-023 | Export PDF/Excel |
| STORY-074 | EPIC-014 | 3 | FR-024 | Comparaison inter-exercices |

---

## Allocation par sprint

| Sprint | Dates | Engagé | Contenu (objectif) |
|--------|-------|--------|--------------------|
| **S7** | 09-24 → 10-08 | 21 | Socle **catalog EPIC-007** (031-034) + amorce Module 0 (040) |
| **S8** | 10-08 → 10-22 | 21 | **Bilan squelette EPIC-008** (035-038) + scaffold document-service (041) |
| **S9** | 10-22 → 11-05 | 24 | **Module 0 OCR** : document-service (042-044) + kyc enrichit (045) + admin amorce (046-047) |
| **S10** | 11-05 → 11-19 | 22 | 🏁 **Chaîne KYC complète** (admin 048-049) + **Bilan import EPIC-009** (050-053) |
| **S11** | 11-19 → 12-03 | 23 | **Bilan référentiels EPIC-010** (054-058) |
| **S12** | 12-03 → 12-17 | 23 | **Bilan états/liasse EPIC-011** (059-063) |
| **S13** | 12-17 → 12-31 | 21 | **Bilan validation/immutabilité EPIC-012** (064-067) + hypothèses (068) |
| **S14** | 12-31 → 01-14 | 24 | 🏁 **Bilan livré** : prévisionnel (069-071) + consultation/export EPIC-014 (072-074) |
| **S15** | 01-14 → 01-28 | 24 | **Module 2 paiement EPIC-004** (016-019) + octroi entitlement (039) — JIT (PS-1/C8/PRD paiement) |

*Sprint 6 (en cours) inchangé : STORY-021 (done), 013, 014, 015.*

---

## Traçabilité épics → stories → sprints

| Epic | Nom | Stories | Pts | Sprint(s) |
|------|-----|---------|-----|-----------|
| EPIC-007 | platform-catalog-service | 031-034 (039→S15) | 18 | S7 |
| EPIC-008 | bilan-service (squelette) | 035-038 | 16 | S8 |
| EPIC-015 | Chaîne KYC — OCR (document-service) | 040-045 | 24 | S7-S9 |
| EPIC-016 | Chaîne KYC — admin-panel (BFF) | 046-049 | 16 | S9-S10 |
| EPIC-009 | Import & normalisation de balance | 050-053 | 14 | S10 |
| EPIC-010 | Référentiels & table de passage | 054-058 | 23 | S11 |
| EPIC-011 | États financiers (liasse OHADA) | 059-063 | 23 | S12 |
| EPIC-012 | Validation, clôture & immutabilité | 064-067 | 16 | S13 |
| EPIC-013 | Prévisionnel | 068-071 | 18 | S13-S14 |
| EPIC-014 | Consultation & export | 072-074 | 11 | S14 |
| EPIC-004 | paiement-service (Module 2) | 016-019 | 21 | S15 |

**Couverture FR :** FR-001→024 du PRD Bilan sont toutes rattachées à une story (voir tableau Module 1). ✅

---

## Risques & dépendances

**Chemin critique / dépendances internes :**
- **Catalog (S7) avant admin-panel (S9-10) et gate Bilan (EPIC-008 S8)** — les entitlements sont le socle des droits d'usage.
- **STORY-040 (`kyc.document.uploaded`)** conditionne tout le flux OCR (S9). ⚠️ À vérifier : STORY-020 n'émet aujourd'hui que `kyc.status.changed` → 040 est bien un prérequis réel.
- **EPIC-008 squelette (S8) avant Bilan fonctionnel (S10+)** — read-models, gate, `ReferentielLoader`.
- **STORY-054 (interface de référentiel)** = cœur du découplage P7 (risque archi #2) : à stabiliser tôt, avant les états (S12).
- **KYC revue (STORY-013, sprint 6)** avant admin-panel actions (048).

**Risques :**
- **Qualité OCR Tesseract** sur pièces réelles → seuils de confiance + drapeau « illisible » (l'OCR assiste, ne décide pas — DO-1).
- **Constitution des paquets de référentiel** (SYSCOHADA révisé, SFD-BCEAO) — donnée réglementaire à sourcer/valider (question ouverte PRD).
- **Ampleur du v1 Bilan** (liasse complète + 2 référentiels + prévisionnel double) → le noyau **Must** (import→liasse→validation→prévisionnel→export) constitue le jalon ; les Should/Could n'y bloquent pas.
- **Décalage calendaire** vs cibles PLAN FINAL (3 devs) — assumé à 1 flux.

**Dépendances externes :** référentiels OHADA, formats de balance des logiciels sources MV, bibliothèque PDF/Excel ; pour Module 2 : PS-1 (SPI BCEAO), décision C8 (M2M).

---

## Definition of Done (par story)
- [ ] Code implémenté (moule PROSPERA : relying party JWKS, read-models, outbox le cas échéant)
- [ ] Tests unitaires + e2e ; seuils Jest 65/90/90/90
- [ ] Lint 0 warning
- [ ] **Vérification docker bout-en-bout** (standard PROSPERA)
- [ ] Critères d'acceptation validés ; statut mis à jour dans `sprint-status.yaml`
- [ ] Commit uniquement sur demande explicite

---

## Prochaines étapes
- Sprint 6 en cours à terminer (kyc 013/014).
- Puis `/bmad:create-story STORY-031` (ou la 1re story du sprint attaqué) pour produire le document de story détaillé, puis `/bmad:dev-story`.
- Confirmer **STORY-040** (`kyc.document.uploaded`) comme prérequis Module 0.
- Questions ouvertes du PRD Bilan à trancher avant EPIC-010/011 (paquets de référentiel, méthode TFT, format balance).

---

**Plan créé avec BMAD Method v6 — Phase 4 (Implementation Planning).**
