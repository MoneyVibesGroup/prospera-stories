# Story FE-A01 : Import de balance Sage 100 — upload, aperçu dry-run, persistance

Status: ready-for-dev

**Epic :** FE-EPIC-007 — Atelier Balance
**Points :** 5 · **Sprint :** 7 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** balance-service (`:3007`) — `POST /api/v1/balance/import/sage` (multipart)
**Backend d'appui :** **STORY-086** (adaptateur Sage → contrat canonique) — **done, vérifiée docker**
**Réf. plan :** `frontend-sprint-status.yaml` S7 · FR-A12 · **remplace l'ancien FE-B02** (STORY-050,
EPIC-009 superseded par D14)
**Dépendances :** FE-A00 (shell + routage `:3007`)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-a01`. Commits préfixés `FE-A01`.
- Branche depuis `dev` **puis rebase sur `origin/dev`** avant de coder ; PR vers `dev`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** : dépôt du fichier, écran d'aperçu (totaux, équilibre,
  avertissements, 5 premières lignes), confirmation de persistance.

---

## User Story

En tant que **comptable de cabinet**,
je veux **déposer l'export Sage de mon client et voir ce que le système en a compris avant d'enregistrer**,
afin de **ne jamais découvrir une balance fausse après coup.**

---

## Contexte

C'est l'**adaptateur n°1 du hub D13** : la voie d'entrée du cabinet équipé de Sage 100. Le backend fait tout
le travail de normalisation vers le contrat canonique ; le front n'interprète **jamais** le fichier
lui-même.

Le point de conception qui structure l'écran : le backend est **dry-run par défaut**. Un import se fait en
**deux temps** — on regarde, puis on décide. C'est ce qui doit se lire dans l'UI.

---

## Contrat réel (relevé à la source, `balance-service@dev`)

`POST /api/v1/balance/import/sage` — `multipart/form-data`, **50 Mo max** :

| Champ | Obligatoire | Valeur |
|---|---|---|
| `file` | oui | Le fichier Sage (Excel/CSV) |
| `exerciceDebut` | oui | ISO-8601, ex. `2026-01-01` |
| `exerciceFin` | oui | ISO-8601, ex. `2026-12-31` |
| `dryRun` | non | `'true'` (**défaut**) ou `'false'` — chaîne, pas booléen |

**Réponses :**

- **200 `ImportSagePreviewDto`** (dry-run) : `{ dryRun: true, lignesCount, previewLines[5], warnings[],
  totalDebiteur, totalCrediteur, estEquilibre, ecartEquilibre }` — **aucune persistance**.
- **201 `ImportSagePersistedDto`** (`dryRun='false'`, version nouvelle) : `{ dryRun: false, balanceId,
  version, status: 'BROUILLON', createdAt, idempotent: false }`.
- **200 `ImportSagePersistedDto`** avec `idempotent: true` — la version existait déjà : **NOP, pas une
  erreur**.
- **400** fichier absent / format non supporté · **422** balance déséquilibrée · **403** gate refusé.

---

## Périmètre

**Inclus**

- Dépôt du fichier (sélection + glisser-déposer), bornes d'exercice, pré-contrôle client **non autoritaire**
  (taille, extension).
- **Aperçu dry-run** : totaux, verdict d'équilibre et **écart chiffré**, `lignesCount`, les 5 lignes
  d'aperçu, et les `warnings` **rendus tels quels**.
- **Persistance explicite** : un second appel `dryRun='false'`, déclenché par une action délibérée — jamais
  automatiquement à la suite de l'aperçu.
- Distinction visible entre **créée** (201) et **déjà présente** (200 `idempotent: true`).
- Types **générés** depuis l'OpenAPI de `:3007`.

**Hors périmètre**

- **Le mapping de colonnes** : voir *Trou de contrat* ci-dessous.
- La saisie manuelle (FE-A02), la consultation (FE-A03).

---

## ⚠️ Trou de contrat à ne pas contourner

`mappingProfile` est déclaré dans `ImportSageDto` **et** dans le Swagger de la route… et **n'est lu nulle
part** dans le service (vérifié : seules deux occurrences, la déclaration du DTO et celle du Swagger).

**Conséquence : ne pas construire d'UI de mapping de colonnes dans cette story.** Un écran qui enverrait
`mappingProfile` donnerait à l'utilisateur le sentiment d'avoir paramétré quelque chose sans aucun effet —
la pire des interfaces. Le titre de la ligne au tracker mentionne « mapping colonnes » : **c'est ce point
qui est retiré du périmètre**, et il appartient à **FE-A12** (STORY-088, profil d'import réutilisable, S17).

→ **Ticket backend à ouvrir** : soit STORY-088 consomme `mappingProfile`, soit le champ est retiré du
contrat. Un champ accepté et ignoré est un piège pour tous les appelants.

---

## Critères d'acceptation

1. Déposer un export Sage valide affiche l'**aperçu** : `lignesCount`, totaux, verdict d'équilibre, écart
   chiffré, 5 lignes — **et rien n'est enregistré** (vérifiable : aucune balance nouvelle côté `GET
   /balances`).
2. Les `warnings` du backend sont affichés **tels quels**, sans reformulation ni filtrage.
3. La persistance exige une **action explicite** ; l'écran distingue « balance créée » (201) de « cette
   version existait déjà » (200 `idempotent: true`), cette dernière n'étant **pas** présentée comme une
   erreur.
4. Une balance **déséquilibrée** est refusée par le backend (**422**) : le message et l'**écart** sont
   affichés, et l'utilisateur comprend qu'il doit corriger sa source — l'écran ne casse pas.
5. Un fichier absent ou d'un format non supporté (**400**) affiche le message du backend ; le pré-contrôle
   client évite l'aller-retour quand il peut, sans jamais prétendre décider à la place du serveur.
6. Sans entitlement, **403** traité par son `code` (règle FE-A00).
7. Types générés ; zéro mock sur le chemin réel ; tests unitaires + E2E Playwright.

---

## Notes techniques

- **Réutiliser `uploadMultipart`** (`src/lib/api/multipart.ts`, mutualisé en FE-023) : progression, refresh
  401, normalisation d'erreur. Ne pas réécrire une troisième mécanique d'upload.
- **Montants en unités mineures XOF** : `totalDebiteur`, `totalCrediteur`, `ecartEquilibre` et les
  `previewLines` sont des **entiers** (valeur × 100). L'affichage divise par 100 ; **aucune arithmétique
  flottante** sur ces montants. Voir FE-A02, qui porte la règle complète.
- **50 Mo** est la borne serveur ; un export Sage réel peut être lourd — l'aperçu doit rester utilisable
  (pas de rendu des `lignesCount` complètes, le backend n'en renvoie que 5).

---

## Integration Gate

Import réel d'un export Sage contre le vrai service : aperçu dry-run **sans** persistance (confirmé par
lecture de `GET /balances`), puis persistance, puis **re-soumission identique** → `idempotent: true` et
**une seule** balance stockée.

---

## Definition of Done

- [ ] 7 critères d'acceptation validés ; tests verts.
- [ ] Aucune UI de mapping livrée ; ticket backend `mappingProfile` ouvert et référencé.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-a01`, préfixés `FE-A01`.

---

## Notes

- Créée le 2026-07-24. **Remplace `FE-B02`** (import Excel/CSV adossé à STORY-050 dans `bilan-service`) :
  la production de balance a quitté le Bilan pour l'Atelier avec la décision **D14**.
