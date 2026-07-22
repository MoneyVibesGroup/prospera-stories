# STORY-128 : Statut et date de revue **par pièce** KYC (aujourd'hui : un seul `reviewedAt` global au dossier)

**Epic :** EPIC-003 — KYC (kyc-service)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` § cycle de revue
**Priorité :** Should Have
**Story Points :** 2
**Statut :** done ✅
**Sprint :** 16 (proposé — à tirer avec STORY-127, même DTO)
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-22
**Services :** `kyc-service` (:3002)
**Couvre :** granularité de restitution relevée à la conception de FE-015

---

## User Story

En tant qu'**administrateur de cabinet**,
je veux **savoir quelle pièce a été validée et quand**,
afin de **comprendre où en est mon dossier sans deviner, quand une pièce est acceptée et l'autre encore en
attente.**

---

## Description

### Constat

`KycStatusResponseDto` expose `kycStatus` (dossier), `rejectionReason?` et **un `reviewedAt` unique, global
au dossier**. Le statut par document se limite à `SUBMITTED | SUPERSEDED` — deux valeurs qui décrivent le
**dépôt**, pas la **revue**.

Un cabinet dont le RCCM est accepté et la carte CFE encore à l'étude voit donc deux pièces au même statut
apparent, et une seule date qui ne dit pas à quoi elle se rapporte. L'écran FE-015 ne peut afficher
« Validé le … » sur la bonne ligne.

### Ce que la story change

Chaque document porte son propre résultat de revue et sa propre date.

---

## Scope

**Inclus**

- Ajout à `KycDocumentResponseDto` de `reviewStatus` (`PENDING | APPROVED | REJECTED`) et `reviewedAt?`.
- **Décision de revue par pièce** : deux routes admin `POST /admin/kyc/:orgId/documents/:documentId/approve|reject`
  (permissions **existantes** `kyc:approve` / `kyc:reject`).
- Alimentation de ces champs **aussi** par le parcours de revue admin **existant** (approve/reject du dossier),
  dont le verdict descend au niveau pièce.
- Cohérence : le `kycStatus` du dossier reste la synthèse, il n'est pas remplacé.
- Le `rejectionReason` par pièce s'il existe déjà côté revue ; sinon rester au niveau dossier et le documenter.

**Hors périmètre**

- Refonte du flux de revue admin (l'UI admin AP-03 est cadrée ailleurs).
- URL de consultation → **STORY-127**.

### ⚠️ Arbitrage de cadrage (tranché avant implémentation, le 2026-07-22)

La rédaction initiale portait une **contradiction**, que les *Technical Notes* anticipaient : le périmètre disait
« alimentation par le parcours de revue admin **existant** », mais **AC-01** exigeait l'approbation « d'une seule
pièce », et le Constat décrivait « le RCCM accepté et la CFE encore à l'étude ».

**Vérification dans le code** (pas une supposition) : la revue est **exclusivement au dossier** —
`kyc-admin.controller.ts` n'expose que `:orgId/approve|reject`, `KycStatusService` écrit `reviewedAt`/`reviewedBy`
sur `TenantKycProfile`, et `KycDocument` ne portait **aucun** champ de revue. **AP-03** (UI admin,
`ready-for-dev`) ne prévoit rien non plus par pièce.

⇒ Alimenter `reviewStatus` par la **seule** décision au dossier en aurait fait un **miroir** de `kycStatus`,
incapable de produire l'état mixte que la story vise. **Décision (PO) : livrer la décision par pièce**
(2 endpoints), la propagation du verdict dossier venant **compléter** — jamais remplacer — la synthèse.

---

## Acceptance Criteria

- **AC-01** — Après approbation d'une seule pièce, `GET /kyc/status` montre cette pièce
  `reviewStatus: APPROVED` **avec** son `reviewedAt`, et l'autre `PENDING` **sans** date.
- **AC-02** — Un rejet de pièce donne `REJECTED` sur **cette** pièce ; le dossier reste cohérent avec la
  règle de synthèse existante.
- **AC-03** — Une pièce `SUPERSEDED` conserve le résultat de revue qu'elle avait — l'historique n'est pas
  réécrit par un nouveau dépôt.
- **AC-04** — Rétrocompatibilité : `reviewedAt` global et `kycStatus` restent servis à l'identique
  (l'admin-panel et le read-model EC ne cassent pas).
- **AC-05** — Les dossiers déjà revus avant la migration ne mentent pas : soit ils sont rétro-alimentés
  depuis la décision existante, soit ils restent `PENDING` par pièce — décision à acter et à documenter,
  jamais une date inventée.

---

## Technical Notes

- ~~Vérifier si le modèle de revue conserve déjà la décision par pièce~~ → **vérifié : non**, la décision
  n'existait qu'au dossier. Il a donc fallu **un champ persistant** *et* le moyen de le poser (cf. arbitrage
  ci-dessus).
- L'enrichissement OCR par pièce existe déjà côté admin (`extraction{…}`) : la granularité par document est
  donc **déjà** une notion établie dans ce service.

### Décisions de conception actées

| Point | Décision | Pourquoi |
|---|---|---|
| **AC-05 — rétro-alimentation** | **Non.** Une pièce antérieure à la story est restituée `PENDING`, **sans** date. | La date du dossier n'est **jamais** recopiée sur une pièce jamais revue — ce serait une date inventée. Le `reviewedAt` global reste servi pour l'antériorité. Conforme à la règle projet « migration de données = souci de prod, différé ». |
| **Motif par pièce** | **Écarté.** Le `rejectionReason` reste au **dossier**. | Le périmètre le prévoyait (« sinon rester au niveau dossier et le documenter »). Un motif par pièce exigerait un champ **et** un contrat d'événement de plus — c'est aussi le seul motif que l'e-mail au cabinet sait porter (FR-006). |
| **Propagation du verdict dossier** | **Asymétrique.** `approve` estampille **toutes** les pièces courantes ; `reject` **épargne** celles déjà `APPROVED` individuellement. | Approuver le dossier, c'est accepter les pièces sur lesquelles il repose. Mais marquer rejetée une pièce que l'admin venait d'accepter serait faux **et** priverait le cabinet de la seule information utile : *quelle* pièce refaire. |
| **Re-soumission** | **Aucun** verdict de pièce n'est réinitialisé. | La pièce ré-uploadée est un **nouveau** document (`PENDING`), l'ancienne passe `SUPERSEDED` verdict figé (AC-03). Une pièce **non** remplacée garde le verdict rendu sur *ce fichier-là*. Conséquence assumée : dossier `UNDER_REVIEW` avec une pièce encore `REJECTED` — c'est le message le plus utile, pas une incohérence. |
| **Contrat d'événement** | **Inchangé.** Une décision par pièce n'émet **aucun** `kyc.status.changed`. | Le statut du dossier — seul contenu de ce contrat — n'a pas bougé. ⇒ **un seul dépôt** touché, pas deux. |
| **Permissions** | Réutilisation de `kyc:approve` / `kyc:reject`. | Le catalogue est **figé** (STORY-103) ; décider d'une pièce est la même prérogative que décider du dossier, à une granularité près. La délégation `PLATFORM_KYC_OFFICER` (STORY-105) fonctionne donc d'emblée. |
| **Sémantique d'erreur** | `404` pièce inconnue **ou d'une autre org** (jamais `403`) · `404` id malformé · `409` dossier hors `UNDER_REVIEW` · `409` pièce `SUPERSEDED`. | Anti-énumération : deviner un `documentId` ne doit rien révéler. Le filtre d'écriture (`tenantId` + `status: SUBMITTED`) est le **vrai** filet, pas la lecture préalable. |
| **Réponse de décision** | Sans URL présignée, sans `reviewedBy`. | Une route d'**écriture** n'a aucune raison de frapper MinIO ni de faire circuler une URL de consultation. L'identité de l'admin décideur reste interne. |

---

## Dependencies

- **Bloque** : **FE-022** (colonne « Validé le » des aperçus de pièces).
- **Cohérent avec** : STORY-127 (même DTO — les livrer ensemble évite deux régénérations de types côté front).

---

## Definition of Done

- 5 AC passent ; AC-04 vérifié en rejouant la chaîne KYC complète (dépôt → revue → read-model EC).
- OpenAPI à jour ; types régénérés côté frontend sans casse.
- La décision prise pour AC-05 (rétro-alimentation ou non) est écrite dans la story.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — écart relevé en dessinant les aperçus de pièces de FE-015 : la
  maquette demandait « Envoyé le / Validé le » par pièce, le contrat ne sert que la première.
- 2026-07-22 : `in_progress` — arbitrage de cadrage tranché (décision par pièce livrée, cf. section dédiée).
- 2026-07-22 : **`done`** — PR [prospera-kyc-service#7](https://github.com/MoneyVibesGroup/prospera-kyc-service/pull/7)
  mergée sur `dev` en « Rebase and merge », branche `MNV-128` supprimée.

### Implémentation

| Fichier | Nature |
|---|---|
| `enums/kyc-document-review-status.enum.ts` | **nouveau** — `PENDING \| APPROVED \| REJECTED` |
| `schemas/kyc-document.schema.ts` | `reviewStatus` (défaut `PENDING`), `reviewedAt?`, `reviewedBy?` — aucun index ajouté (volume de 2-6 pièces par org, préfixe `tenantId` suffisant) |
| `kyc-documents.repository.ts` | `decideOne` (verdict unitaire, filtre `_id`+`tenantId`+`SUBMITTED`) · `applyDossierVerdict` (propagation sous session) — **écritures cross-tenant délibérées**, équivalent en écriture de `forTenant` |
| `kyc-admin.service.ts` | `approveDocument` / `rejectDocument` + `reviewDocument` privé (404/409 ordonnés) |
| `kyc-admin.controller.ts` | 2 routes `POST :orgId/documents/:documentId/approve\|reject` |
| `kyc-status.service.ts` | `propagateVerdictToDocuments` appelé **dans** la transaction, après la transition conditionnelle, avant l'enqueue outbox |
| `dto/admin-kyc-document-review.dto.ts` | **nouveau** — retour de décision (sans `url`, sans `reviewedBy`) |
| `dto/kyc-document-response.dto.ts` · `dto/admin-kyc-document.dto.ts` | `reviewStatus` + `reviewedAt` (fallback `?? PENDING` pour l'existant — AC-05) |

### Qualité

`lint` 0 warning · `build` OK · **216 unit + 70 e2e** · couverture **95.49 / 89.67 / 94.08 / 95.35**
(seuils 90/65/90/90 tenus). OpenAPI vérifié sur le service en marche : les 2 routes et les 3 DTO exposent
bien `reviewStatus`/`reviewedAt` — les types front se régénèrent sans casse.

**Mutation-testing — 4 mutations volontaires, toutes rattrapées :**

| Mutation | Résultat |
|---|---|
| filtre `status: SUBMITTED` retiré de `decideOne` | AC-03 **rouge** |
| `tenantId` retiré du filtre d'écriture | unitaire repo **rouge** — ⚠️ **l'e2e seul ne l'attrapait PAS** (la lecture 404 avant d'atteindre l'écriture) : c'est le test unitaire du filtre qui protège l'isolation |
| `$ne: APPROVED` retiré de la propagation | règle asymétrique **rouge** |
| session de propagation dissociée | atomicité **rouge** |

### Vérification docker (obligatoire — la story écrit en base)

Stack **neuve** (`down -v`), JWT **RS256 réels** (2 cabinets inscrits + `PLATFORM_ADMIN` seedé), 20 contrôles A→T
via `mongosh` sur `kyc_service` :

- **A** — pièces nées `reviewStatus: PENDING` en base, sans `reviewedAt`.
- **B/C** — approbation d'**une** pièce → **état mixte réellement persisté** : RCCM `APPROVED` + `reviewedAt` +
  `reviewedBy`, CFE `PENDING` **sans** date ; dossier toujours `UNDER_REVIEW` ; **0 événement** émis.
- **D** — `GET /kyc/status` du cabinet restitue l'état mixte (et **jamais** `reviewedBy`).
- **E→I** — pièce d'une **autre org** → `404` **et document non modifié** (revérifié en base) · `documentId`
  malformé → `404` · org inconnue → `404` · sans jeton → `401` · `TENANT_ADMIN` → `403`.
- **J→L** — **AC-03** : CFE v1 supersédée **conserve** `REJECTED` + sa date, v2 naît `PENDING`, verdict sur la
  supersédée → `409`.
- **M** — **rejet du dossier** : CFE v2 → `REJECTED` à la date du dossier, RCCM **reste** `APPROVED` à la sienne
  (la règle asymétrique, prouvée en base).
- **N** — **approbation du dossier** : toutes les pièces `APPROVED` à la **date exacte** du dossier (invariant
  vérifié par égalité stricte), `reviewedBy` = l'admin.
- **O/P/Q** — trois `409` (course perdue, dossier hors `UNDER_REVIEW`) → **aucune écriture**, dates inchangées ;
  `kyc.status.changed` = **4** (les seules bascules de statut), payload **inchangé** (AC-04) ; **0 pièce orpheline**.
- **R/S** — vue finale cabinet (ce que FE-022 affichera) et détail admin portant les verdicts par pièce.
- **T** — **0 occurrence** d'URL présignée dans les journaux (garantie STORY-127 préservée).

### Revues

- **Code review** — 1 constat retenu et corrigé (commit de revue dédié) : le sort des verdicts **par pièce** lors
  d'une re-soumission était implicite ; explicité dans `onDocumentSubmitted`. Aucun changement de comportement.
- **Security review** — **aucune vulnérabilité exploitable**. Axes couverts : isolation multi-tenant / IDOR sur les
  nouvelles écritures cross-tenant, RBAC (le handler l'emporte sur le plancher de classe ⇒ `PLATFORM_SUPPORT`
  reste à `403`), anti-énumération, injection NoSQL (`@Param` toujours `string`, validé avant le filtre), fuite de
  `reviewedBy` / d'URL présignée, intégrité et races.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
