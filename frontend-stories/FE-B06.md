# Story FE-B06 : Table de passage + arbitrage comptes non mappés + surcharges + référentiel

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 5 · **Sprint :** 6 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/mapping`, `/bilan/referentiel`) via gateway · **Backend d'appui :** STORY-054 (interface référentiel), STORY-055 (table de passage), STORY-056/057 (paquets SYSCOHADA/SFD), STORY-058 (surcharges org)
**Réf. plan :** `docs/frontend-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-005/006/007/008)
**Backend prêt :** S11
**Dépendances :** FE-B02 (balance importée), FE-B04 (intégrité)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b06`. Commits préfixés `FE-B06`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (arbitrage des comptes non mappés + surcharges), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **comptable interne**,
je veux **que mes comptes soient rattachés automatiquement aux postes d'états et arbitrer les cas non reconnus**,
afin d'**obtenir des états corrects selon mon référentiel (SYSCOHADA révisé)**.

---

## Contexte

Cœur du découplage P7 (moteur ⊥ référentiel). Le référentiel actif de l'org (via entitlement, FR-005) fournit la **table de passage** compte→poste (FR-006). L'automatisation **propose** ; les **comptes non reconnus** sont listés pour arbitrage humain. L'org peut **surcharger** localement un rattachement (FR-008), sans modifier le paquet packagé. Deux référentiels packagés : `syscohada-revise`, `sfd-bceao` (FR-007) — le pilote MV est SYSCOHADA révisé.

---

## Périmètre

**Inclus :**
- **Badge référentiel actif** (code+version) affiché sur les écrans du module (FR-005).
- **Table de passage** : vue compte→poste proposée par le référentiel ; **liste des comptes non mappés** avec arbitrage (associer à un poste).
- **Surcharges org** : associer un compte à un autre poste (proposé → validé, tracé) ; historique de la surcharge.
- **Garde de validation** : indiquer que la liasse ne pourra être validée tant que des comptes **significatifs** restent non mappés (relié à FE-B10).

**Hors périmètre :**
- Édition du contenu du paquet de référentiel (admin-panel/catalogue, hors module).
- Génération des états (FE-B07+).

---

## Critères d'acceptation

- [ ] Référentiel actif (code+version) affiché ; source = entitlement de l'org.
- [ ] Table de passage restituée ; comptes non mappés listés et arbitrables (compte → poste).
- [ ] Surcharge org (compte → poste) possible, tracée (auteur/date/ancien-nouveau) ; sans modifier le paquet.
- [ ] Message clair : comptes significatifs non mappés = blocage de la validation (cohérent FE-B10).
- [ ] i18n FR ; tests : rendu table, arbitrage non mappé, surcharge tracée, badge référentiel.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query mapping/référentiel | `src/features/bilan/mapping/api/*` + `hooks/*` | Nouveau |
| Écrans | `src/features/bilan/mapping/components/{PassageTable,UnmappedAccounts,OverrideDialog,ReferentielBadge}.tsx` | Nouveau |

**Décisions & vigilance :**
- **Proposer, pas décider** : les rattachements automatiques sont des propositions ; l'arbitrage humain prime (invariant programme).
- **Surcharge ≠ édition du référentiel** : la surcharge est locale à l'org `(orgId, compte) → poste` ; le paquet reste intact.
- **Traçabilité** : toute surcharge est journalisée (afficher l'historique).

---

## Tasks / Subtasks

- [ ] Query table de passage + référentiel actif + badge (AC 1, 2)
- [ ] `UnmappedAccounts` (arbitrage) (AC 2)
- [ ] `OverrideDialog` (surcharge tracée) (AC 3)
- [ ] Message garde-validation (AC 4)
- [ ] i18n + tests (AC 5)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b06`, préfixés `FE-B06`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
