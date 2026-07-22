# STORY-127 : Le cabinet peut relire ses propres pièces KYC — URL présignée dans `GET /kyc/status`

**Epic :** EPIC-003 — KYC (kyc-service)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` § stockage & URL présignées
**Priorité :** Must Have
**Story Points :** 3
**Statut :** done ✅
**Sprint :** 16 (proposé)
**Créée le :** 2026-07-22
**Clôturée le :** 2026-07-22
**Assignée à :** vivianMoneyVibesGroupes
**Services :** `kyc-service` (:3002)
**Couvre :** asymétrie de lecture relevée à la conception de FE-015 (retour PO du 2026-07-22)

> **L'asymétrie, en une phrase :** Money Vibes peut consulter les pièces d'un cabinet ; **le cabinet ne peut
> pas relire les siennes**. L'URL présignée existe — mais uniquement sur le DTO **admin**.

---

## User Story

En tant qu'**administrateur de cabinet**,
je veux **rouvrir le RCCM et la carte CFE que j'ai déposés**,
afin de **vérifier ce que Money Vibes a réellement reçu avant qu'on me le rejette — et de savoir laquelle
de mes versions est en cours d'examen.**

---

## Description

### Constat vérifié dans les DTO générés

- `AdminKycDocumentDto` porte `url: string` — « URL présignée temporaire de consultation de la pièce ».
- `KycDocumentResponseDto` (celui que reçoit **le cabinet** via `GET /kyc/status`) porte
  `id, type, mimeType, size, version, status, createdAt` — **et rien pour consulter le fichier**.

Le cabinet dépose un document, puis ne peut plus jamais le revoir depuis l'application. En cas de rejet
(« RCCM illisible »), il ne peut pas vérifier si c'est le bon fichier qui est parti, ni comparer les versions.

### Ce que la story change

Le DTO tenant expose la même URL présignée, avec les mêmes garanties que côté admin : durée courte, jamais
journalisée, jamais devinable.

---

## Scope

**Inclus**

- Ajout de `url` (présignée, TTL court) à `KycDocumentResponseDto` dans `GET /kyc/status`.
- Génération de l'URL **au moment de la réponse** (jamais stockée), pour le seul `orgId` du jeton.
- Documentation OpenAPI du champ (le frontend en dérive ses types).

**Hors périmètre**

- Téléchargement forcé, filigrane, aperçu miniature côté serveur : l'UI ouvre l'URL, c'est tout.
- Statut/date de revue par pièce → **STORY-128**.

---

## Acceptance Criteria

- **AC-01** — `GET /kyc/status` renvoie pour chaque document une `url` exploitable : un `GET` sur cette URL
  retourne **200** et le bon `Content-Type`.
- **AC-02** — L'URL expire (TTL aligné sur celui du côté admin) : après expiration, **403** du stockage.
- **AC-03** — **Isolation** : l'URL servie ne concerne que les documents de l'organisation du jeton. Aucun
  moyen d'obtenir l'URL d'une pièce d'une autre organisation (test dédié, deux orgs).
- **AC-04** — L'URL **n'apparaît dans aucun log** (applicatif ou d'accès) — même règle que côté admin.
- **AC-05** — Les versions **supersédées** (`SUPERSEDED`) restent consultables : c'est précisément l'intérêt
  de comparer ce qu'on a envoyé.

---

## Technical Notes

- Réutiliser **le même service de présignature** que le chemin admin (aucune duplication de logique de
  stockage) ; seule la couche de projection du DTO change.
- Coût : une présignature par document et par appel. `GET /kyc/status` renvoyant au plus quelques pièces,
  l'impact est négligeable — pas de mise en cache nécessaire.
- Vérifier que la présignature n'est **pas** déclenchée pour les appels internes qui n'en ont pas besoin.

---

## Dependencies

- **Bloque** : **FE-022** (aperçu des pièces dans le profil du cabinet).
- **Aucun prérequis.**

---

## Definition of Done

- 5 AC passent, dont **AC-03 vérifié avec deux organisations réelles** sur le stack docker.
- OpenAPI régénérable côté frontend (`npm run gen:api`) et le champ apparaît dans `src/types/api/kyc.ts`.
- Revue de sécurité rapide : TTL, absence de journalisation, isolation `orgId`.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — écart trouvé en confrontant `KycDocumentResponseDto` et
  `AdminKycDocumentDto` pendant la conception de la carte « Documents » de FE-015.
- 2026-07-22 : Développée + revue + revue de sécurité + intégrée sur `dev`
  (vivianMoneyVibesGroupes) — **done**. PR module [prospera-kyc-service#6] (Rebase and merge).

**Implémentation (MNV-127) :**

- `KycDocumentResponseDto` porte une `url` **optionnelle** (`fromDocument(doc, url?)`), présente
  **uniquement** sur `GET /kyc/status` — la réponse d'upload (`POST /kyc/documents`) reste inchangée.
- `KycStatusService` injecte `StorageService` et **présigne chaque pièce au moment de la réponse**
  (jamais stockée), pour le seul `orgId` du jeton (isolation par `TenantScopedRepository`, fail-closed).
  Même service de présignature et **même TTL** (300 s) que la revue admin — aucune duplication.
- **Décision de périmètre (AC-05)** — la requête est **élargie de `SUBMITTED` seul à toutes les
  versions** (`find({}, { sort: { type: 1, version: -1 } })`) pour que le cabinet compare ses dépôts
  successifs. Les `SUPERSEDED` remontent donc désormais dans `GET /kyc/status` ; `status`/`version`
  distinguent la pièce courante des historiques. *Changement de contrat assumé et documenté* (FE-022
  s'appuie sur `status`/`version`). Hors périmètre inchangé : statut/date de revue par pièce → STORY-128.

**Vérification :**

- Lint 0 warning · build OK · **199 tests** unit+e2e verts · couverture ≥ seuils
  (`kyc-status.service.ts` et `kyc-document-response.dto.ts` à 100 %).
- **Mutation-test** (preuve anti-régression) : url vidée ⇒ tests url rouges ; filtre `SUBMITTED`
  réintroduit ⇒ test AC-05 rouge. Restauré, vert.
- **Vérif docker réelle (2 organisations)** sur la stack :
  - **AC-01** — chaque pièce porte une `url` ; `GET` sur l'URL → **200** + `Content-Type` correct
    (`application/pdf`) pour SUBMITTED **et** SUPERSEDED.
  - **AC-02** — `X-Amz-Expires=300` (défaut `MINIO_PRESIGNED_TTL`, identique à la revue admin).
  - **AC-03** — isolation : URLs de A ⊂ `kyc/<orgA>/…`, de B ⊂ `kyc/<orgB>/…`, **ensembles disjoints**,
    aucune fuite inter-org.
  - **AC-04** — **0 occurrence** d'URL/signature présignée dans les logs (l'intercepteur ne journalise
    pas les corps) ; les requêtes `GET /kyc/status 200` sont bien tracées, sans URL.
  - **AC-05** — RCCM v1 `SUPERSEDED` renvoyée et consultable (**200**) après ré-upload.
  - **Persistance** (`kyc_service.kycdocuments`) : orgA 3 docs / orgB 2 docs, **0 document ne stocke
    de champ `url`** (présignée à la volée uniquement).
- **CORS** — `GET /kyc/status` répond `Access-Control-Allow-Origin` pour l'origine FE autorisée
  (`http://localhost:3100`) et refuse les autres (câblage STORY-109 inchangé, allowlist explicite).

**Assigné à :** vivianMoneyVibesGroupes

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
