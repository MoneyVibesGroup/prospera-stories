# STORY-049 : e2e chaîne KYC complète (docker) 🏁 — inscription → upload → OCR (`document.extrait`) → revue `admin-panel` → approbation

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-4 (e2e cross-service) ; `architecture-prospera-ecosystem-2026-07-04.md` § P8 (source de vérité chez les propriétaires) / K4 (contrats dupliqués, zéro dépendance inter-services) / DO-1 ; `sprint-plan-phase1-2026-07-10.md` § Module 0 / EPIC-015+EPIC-016 (AD-2, **jalon chaîne KYC 🏁**)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-16 (jalon 🏁)
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-16
**Sprint :** 10 (2026-11-05 → 2026-11-19)
**Service :** `admin-panel` (:3010) — **story de test pur : aucun code applicatif**
**Couvre :** le **jalon Module 0 🏁** — preuve exécutable que les 10 stories d'EPIC-015 + EPIC-016 (040→048) forment **une seule chaîne qui fonctionne**

> **La story qui ne code rien et prouve tout.** Chaque story de la chaîne KYC a été vérifiée **en docker, isolément** : STORY-042/043 (l'OCR lit et compare), STORY-045 (`kyc` projette `document.extrait`), STORY-047 (le BFF agrège), STORY-048 (le BFF approuve). Mais **personne n'a jamais joué le parcours entier en une seule passe automatisée** : un cabinet s'inscrit, dépose son RCCM et sa CFE, l'OCR tourne, l'admin ouvre le dossier enrichi, approuve — et le cabinet reçoit son e-mail. Ces vérifications isolées étaient **manuelles, à la main, jamais rejouées** : elles prouvent que chaque maillon tenait **le jour où il a été écrit**, pas que la chaîne tient **aujourd'hui**. STORY-049 transforme cette recette manuelle en **test exécutable et rejouable** (`npm run test:chain`). Sa valeur n'est pas de tester un maillon de plus — c'est de tester **les jointures** : les endroits que personne ne possède, où un contrat Kafka dupliqué (K4) peut diverger en silence sans qu'aucune suite unitaire ne rougisse. **Aucune ligne de `src/` n'est modifiée.**

---

## User Story

En tant qu'**équipe PROSPERA (et administrateur plateforme `PLATFORM_ADMIN` comme utilisateur final)**,
je veux **un test automatisé qui rejoue le parcours KYC complet sur la stack docker réelle** — inscription d'un cabinet, dépôt des pièces, OCR, revue du dossier enrichi depuis `admin-panel`, approbation, notification —
afin d'**avoir la preuve, rejouable à volonté, que la chaîne KYC fonctionne bout-en-bout** et de **détecter toute rupture d'un contrat inter-services** (événement Kafka, forme de payload, code HTTP) **avant** qu'elle n'atteigne un vrai cabinet — là où aucune suite unitaire ni e2e à amont mockés ne peut la voir.

---

## Description

### Contexte

La chaîne KYC traverse **cinq services** et **deux sauts Kafka asynchrones** :

```
auth-service ──(inscription, JWT RS256)──> kyc-service
kyc-service ──[kyc.document.uploaded]──> document-service   (OCR Tesseract)
document-service ──[document.extrait]──> kyc-service         (projection d'assistance)
admin-panel ──(fan-out lecture + proxy écriture, bearer relayé)──> auth + kyc + catalog
kyc-service ──[kyc.status.changed]──> expert-comptable       (e-mail au cabinet)
```

Chaque maillon est couvert par ses propres tests. **Aucun ne couvre les jointures** — et c'est précisément là que le risque vit :

- **Les contrats Kafka sont dupliqués (K4)**, délibérément : `document-service` et `kyc-service` possèdent **chacun leur copie** de `document.extrait` (`kafka/events/document-extrait-events.ts`), sans aucune dépendance partagée. C'est un invariant d'architecture assumé — mais il implique que **deux copies peuvent diverger sans que rien ne rougisse** : les tests de `document-service` valident sa copie, ceux de `kyc-service` valident la sienne, et **les deux passent au vert alors que la chaîne est cassée**. Un test qui les fait **réellement se parler** est le seul filet possible. C'est la raison d'être n°1 de cette story.
- **Les e2e existants d'`admin-panel` mockent les amont** — leur propre en-tête le dit : *« Le round-trip cross-service réel est couvert par la vérification docker »* (`admin-org-actions.e2e-spec.ts`). Cette story **est** cette vérification, enfin automatisée.
- **Les vérifications docker des stories 040→048 étaient manuelles** : jouées une fois, consignées en prose dans `sprint-status.yaml`, **jamais rejouées**. Une régression introduite en sprint 11 (RBAC, balance) ne serait détectée par personne.

Cette story ne crée **aucun endpoint, aucun service, aucune règle métier**. Elle ajoute **un test** et **son harnais**, dans le dépôt `prospera-admin-panel-service` (`admin-panel` est le point d'entrée du parcours admin, et le sprint-plan lui rattache la story).

### Nature du test : boîte noire, en HTTP pur

Le test parle **uniquement HTTP**, comme un vrai client :

| Interlocuteur | Rôle dans le test |
|---|---|
| `auth-service` :3001 | inscription, vérification d'e-mail, login (cabinet **et** admin) |
| `kyc-service` :3002 | dépôt des pièces (`POST /kyc/documents`) |
| `admin-panel` :3010 | **le sujet** : lecture du dossier enrichi + action d'approbation |
| Mailhog :8025 (API) | récupération du jeton de vérification **et** preuve de notification |

**Aucun accès direct à mongo, ni client Kafka, ni introspection de l'outbox.** C'est un choix de conception, pas une facilité :

- `admin-panel` **n'a délibérément aucune base de données** (invariant depuis STORY-046 : surface d'attaque réduite). Lui ajouter un driver mongo **en devDependency** pour aller lire la collection `outbox` de `kyc-service` reviendrait à **percer l'encapsulation d'un autre service** depuis les tests d'un service qui se définit par son absence de persistance.
- **La diffusion de l'événement se prouve mieux par son effet que par son artefact.** Un enregistrement d'outbox à `SENT` prouve seulement que `kyc-service` a *écrit qu'il allait publier*. **L'e-mail reçu dans Mailhog prouve la chaîne entière** : l'événement a été publié **et** transporté par Kafka **et** consommé par `expert-comptable` **et** traité par son worker BullMQ. C'est une preuve **strictement plus forte**, obtenue **sans** coupler le test aux internes de `kyc-service` (dont l'outbox est déjà couverte par ses propres tests + la vérif STORY-048).

> **Note vs. l'option retenue en création** : la question posée mentionnait « outbox `kyc.status.changed` SENT **+** e-mail Mailhog ». L'assertion Mailhog est conservée (et **renforcée** : elle englobe la publication) ; l'**introspection de l'outbox est délibérément abandonnée** — elle est redondante avec l'e-mail, et coûterait l'invariant « `admin-panel` ne connaît aucune base ». Le périmètre fonctionnel du jalon est **inchangé**.

### Périmètre

**Inclus :**

- **`admin-panel/test/kyc-chain.chain-spec.ts`** (nouveau) — le parcours complet, en **une** suite séquentielle (l'ordre est le sujet : chaque étape consomme l'état produite par la précédente).
- **`admin-panel/test/jest-chain.json`** (nouveau) — **3ᵉ** configuration Jest, `testRegex: "\\.chain-spec\\.ts$"`, `testTimeout` généreux (OCR Tesseract WASM + 2 sauts Kafka), `maxWorkers: 1`.
- **`npm run test:chain`** (nouveau script) — **le seul** point d'entrée qui exige docker. **`npm test` (unit) et `npm run test:e2e` (amont mockés) restent verts sans docker** — invariant de CI non négociable (voir §Isolation).
- **`admin-panel/test/fixtures/`** (nouveau) — deux images de pièces (RCCM, CFE) **committées**, textuellement lisibles (dénomination, n° RCCM, date), servant d'entrée réelle à Tesseract.
- **`admin-panel/test/utils/chain-env.ts`** (nouveau) — résolution des URLs (surchargeables par env : `CHAIN_AUTH_URL`, `CHAIN_KYC_URL`, `CHAIN_ADMIN_URL`, `CHAIN_MAILHOG_URL`, défauts `localhost:3001/3002/3010/8025`), identifiants admin (`CHAIN_ADMIN_EMAIL`/`CHAIN_ADMIN_PASSWORD`), **préflight fail-fast** et **helper `waitUntil`** (polling borné).
- **Mise à jour `admin-panel/README.md`** — prérequis (`docker compose up`, `npm run seed:admin`) + comment lancer et lire un échec.

**Hors périmètre :**

- **Toute modification de `src/`** — invariant : si ce test échoue, c'est un **service** qui est en cause, jamais le test. **Zéro ligne applicative** dans cette story (si le test révèle un bug, il est corrigé dans la story/le service **propriétaire**, tracé à part).
- **Lancement/orchestration de docker par le test** (`compose up/down`, testcontainers) — la stack est un **prérequis**, pas une responsabilité du test (voir §Points d'attention).
- **Exécution en CI par défaut** — le test exige les 8+ conteneurs ; il est **manuel/nightly** en v1 (voir §Additional Notes).
- **Assertion de la précision de Tesseract** (texte lu exact) — **décision explicite**, voir §Assertions OCR.
- **Introspection mongo / Kafka / outbox** — voir §Nature du test.
- **Le parcours de rejet** (`reject { reason }` → e-mail de rejet) — couvert par la vérif STORY-048 ; le **jalon** est l'approbation. (Extension naturelle, notée en §Additional Notes.)
- **Entitlements / activation d'un vertical** (`PUT …/entitlements/bilan`) — hors chaîne KYC, couvert par STORY-048/AP-04.
- **Charge, montée en charge, concurrence** — un parcours nominal, pas un test de perf.
- **Front (UI)** — les fronts AP-01→AP-04 consomment ces endpoints ; leur e2e est distinct.

### Flux du test (scénario nominal, séquentiel)

**Phase 0 — Préflight (fail-fast, avant toute assertion)**
1. `GET /health` sur `auth`, `kyc`, `admin` + `GET /api/v2/messages` sur Mailhog. Un seul indisponible → **échec immédiat** avec un message actionnable (*« stack docker absente : `docker compose up -d` »*), **jamais** un timeout obscur à la 4ᵉ minute.
2. Login admin (`CHAIN_ADMIN_EMAIL`) → `401` ⇒ échec explicite : *« exécuter `npm run seed:admin` dans `auth-service` »*. Le JWT obtenu doit porter `aud` incluant `admin-panel` et `roles:[PLATFORM_ADMIN]`.

**Phase 1 — Inscription du cabinet (auth-service)**
3. `POST /auth/register { cabinetName, email: chain-<timestamp>-<rand>@example.test, password, firstName, lastName }` → **201**. L'e-mail est **unique par exécution** ⇒ le test est **rejouable sans nettoyage** et sans collision (voir §Rejouabilité).
4. **Polling Mailhog** → e-mail de vérification pour cette adresse → extraction du jeton → `GET /auth/verify-email?token=…` → **200**.
5. `POST /auth/login` → JWT `TENANT_ADMIN`, `emailVerified: true`, `org: <orgId>`. **`orgId` est capturé** : c'est la clé de tout le reste du parcours.

**Phase 2 — Dépôt des pièces (kyc-service)**
6. `POST /kyc/documents` (multipart : `type=RCCM` + `file`) → **201**, puis idem `type=CFE` → **201**. Statut KYC de l'org ⇒ `UNDER_REVIEW`.
7. Chaque dépôt émet `kyc.document.uploaded` (outbox → Kafka, STORY-040). **Le test ne l'observe pas directement** — il observe son **effet** à l'étape 8.

**Phase 3 — OCR asynchrone (document-service → kyc-service) — le cœur du test**
8. **Polling borné** sur `GET /admin/orgs/:orgId` (BFF, jeton admin) **jusqu'à** ce que `kyc.ocrSummary.extractedCount === 2` — ou **timeout explicite**.
   Ce que cette unique attente prouve **de bout en bout** : `kyc` a publié `kyc.document.uploaded` → `document-service` l'a consommé, a téléchargé la pièce depuis MinIO et a fait tourner **Tesseract** → il a comparé déclaré/lu et publié `document.extrait` (STORY-043) → `kyc-service` l'a consommé et **projeté** `DocumentExtractionAssist` (STORY-045) → `admin-panel` a **agrégé** et exposé l'enrichissement (STORY-047). **Six stories, deux sauts Kafka, deux contrats dupliqués — validés par une seule assertion.**

**Phase 4 — Revue du dossier enrichi (admin-panel)**
9. `GET /admin/orgs/:orgId` (`PLATFORM_ADMIN`) → **200** ; assertions :
   - identité (dénomination du cabinet) et `kyc.status === 'UNDER_REVIEW'` ;
   - **2 pièces** (`RCCM`, `CFE`), chacune avec une **URL présignée** et un bloc **`extraction` défini** ;
   - `ocrSummary` **présent et cohérent** (`extractedCount: 2`, drapeaux booléens définis) ;
   - `sources: { kyc: 'ok', entitlements: 'ok' }` (aucune dégradation en marche nominale).
10. **Invariant DO-1 (assertion de non-action)** : le statut est **encore** `UNDER_REVIEW` — **l'OCR n'a jamais rien décidé**. C'est l'invariant central d'EPIC-015 (*« l'OCR affiche des signaux, l'humain décide »*) ; il n'a jamais été vérifié qu'à la main.

**Phase 5 — Approbation (admin-panel → kyc-service) 🏁**
11. `POST /admin/orgs/:orgId/kyc/approve` → **200** `{ orgId, status: 'APPROVED' }`.
12. **Relecture** `GET /admin/orgs/:orgId` → `kyc.status === 'APPROVED'` **persisté** (chez le propriétaire, pas dans le BFF) et **`reviewedBy` = `sub` du jeton admin relayé** — preuve que l'identité de l'acteur est bien **dérivée en amont** du bearer, jamais fabriquée par le BFF (STORY-048).
13. **Polling Mailhog** → e-mail d'**approbation** reçu à l'adresse du cabinet (`SEND_KYC_APPROVED_EMAIL_JOB`) ⇒ preuve que `kyc.status.changed` a été **publié**, **transporté**, **consommé** par `expert-comptable` et **traité** par son worker. **🏁 La chaîne est bouclée.**
14. **Négatif d'idempotence** : `POST …/kyc/approve` **rejoué** → **409** (org n'est plus `UNDER_REVIEW`) — la seconde décision n'est **pas** appliquée et **aucun second e-mail** n'est émis.

---

## Acceptance Criteria

- [ ] **Le parcours complet passe en une exécution** : `npm run test:chain` rejoue inscription → vérification e-mail → login → dépôt RCCM+CFE → OCR → revue enrichie → approbation → notification, sur la stack docker réelle, **en vert**.
- [ ] **La jointure OCR est prouvée** : le test attend et assert que `GET /admin/orgs/:orgId` expose `ocrSummary.extractedCount === 2` et un bloc `extraction` **sur chacune des 2 pièces** — validant la traversée `kyc.document.uploaded` → OCR → `document.extrait` → projection → agrégation **sans** client Kafka ni accès mongo.
- [ ] **L'invariant DO-1 est vérifié explicitement** : après OCR complet, le statut KYC est **toujours `UNDER_REVIEW`** — l'OCR **ne décide rien**, il informe (assertion de **non-action**, EPIC-015).
- [ ] **L'approbation est réelle et persistée chez le propriétaire** : `POST …/kyc/approve` → **200** `{ status: APPROVED }`, **relu** via un `GET` ultérieur (l'état vit dans `kyc-service`, jamais dans le BFF) avec **`reviewedBy` = `sub` de l'admin** dont le bearer a été relayé.
- [ ] **La diffusion de l'événement est prouvée par son effet** : un e-mail d'approbation arrive dans **Mailhog** à l'adresse du cabinet ⇒ `kyc.status.changed` publié + transporté + consommé par `expert-comptable`. **Aucune** introspection d'outbox, **aucun** accès mongo, **aucun** driver de base ajouté à `admin-panel`.
- [ ] **Idempotence de la décision** : `approve` rejoué → **409**, aucune seconde notification.
- [ ] **Assertions OCR : la chaîne, pas la précision** — le test assert la **présence et la forme** de l'enrichissement (`extraction` défini, `ocrProvider` renseigné, `confidence` numérique, `discrepancies` défini, `extractedCount: 2`) et **jamais** un texte lu exact. Un Tesseract qui lit mal produit un dossier `unreadable` **valide** : la chaîne est verte, car **elle a bien fonctionné**.
- [ ] **Isolation de la CI (non négociable)** : `npm test` et `npm run test:e2e` **restent verts sans docker** et **ne ramassent jamais** `*.chain-spec.ts` (vérifié : ni le `testRegex` unit, ni celui e2e ne matchent — voir §Isolation). La **couverture** et ses seuils **65/90/90/90** sont **inchangés** (le harnais de chaîne est hors `collectCoverageFrom`, qui ne porte que sur `src`).
- [ ] **Rejouable sans nettoyage** : deux exécutions consécutives passent **toutes les deux** (e-mail unique par run ⇒ org neuve ⇒ toujours `UNDER_REVIEW` à l'approbation). **Aucun `docker compose down` requis entre deux runs.**
- [ ] **Aucune attente aveugle** : **zéro `sleep`/délai fixe** — uniquement du **polling borné** (`waitUntil`) sur une condition observable, avec timeout et message de diagnostic.
- [ ] **Échec lisible** : stack absente / admin non seedé / OCR non arrivé ⇒ message **actionnable** nommant le service et le remède (jamais un timeout muet). Le préflight échoue **en secondes**, pas en minutes.
- [ ] **Zéro code applicatif** : `git diff` ne touche **aucun** fichier de `src/` — ni dans `admin-panel`, ni dans aucun autre service. Story de **test pur**.
- [ ] **Qualité** : `npm run lint` **0 warning** (le nouveau harnais est linté comme le reste) ; `nest build` vert.
- [ ] **Exécution consignée** en §Revue & validation (sortie du run, durée observée, version de stack).

---

## Technical Notes

### Arborescence (ajouts STORY-049 — `admin-panel`, tests uniquement)

```
admin-panel/
├── package.json                      # MODIFIÉ : + "test:chain": "jest --config ./test/jest-chain.json"
├── README.md                         # MODIFIÉ : prérequis stack + seed admin + lecture d'un échec
└── test/
    ├── jest-chain.json               # NOUVEAU : testRegex \.chain-spec\.ts$, testTimeout élevé, maxWorkers 1
    ├── kyc-chain.chain-spec.ts       # NOUVEAU : le parcours (préflight → 5 phases)
    ├── fixtures/
    │   ├── rccm.png                  # NOUVEAU : pièce lisible (dénomination, n° RCCM, date)
    │   └── cfe.png                    # NOUVEAU
    ├── utils/
    │   ├── rs256.ts                  # INCHANGÉ (fixture JWKS des e2e mockés — non utilisée ici : vrais JWT)
    │   └── chain-env.ts              # NOUVEAU : URLs, identifiants, préflight, waitUntil
    ├── admin-orgs.e2e-spec.ts        # INCHANGÉ
    ├── admin-org-actions.e2e-spec.ts # INCHANGÉ
    └── jest-e2e.json                 # INCHANGÉ
```

### Isolation des trois suites (le point à ne pas rater)

Trois configurations coexistent ; **seule la troisième exige docker** :

| Script | Config | `rootDir` | `testRegex` | Docker | CI |
|---|---|---|---|---|---|
| `npm test` | `package.json#jest` | `src` | `.*\.spec\.ts$` | non | ✅ |
| `npm run test:e2e` | `test/jest-e2e.json` | `.` | `.e2e-spec.ts$` | non (amont **mockés**) | ✅ |
| **`npm run test:chain`** | **`test/jest-chain.json`** | `.` | `\.chain-spec\.ts$` | **OUI** | manuel/nightly |

Le nom **`.chain-spec.ts`** est choisi **précisément** pour n'être ramassé par aucune des deux autres :
- unit : `rootDir: src` **et** exige un point littéral avant `spec` (`\.spec\.ts$`) — `kyc-chain.chain-spec.ts` est hors `src` **et** porte un tiret (`chain-spec`). **Doublement exclu.**
- e2e : exige la terminaison `e2e-spec.ts` — `chain-spec.ts` ne matche pas.

⚠️ **À vérifier explicitement à l'implémentation** (une régression de CI silencieuse coûterait plus cher que la story) : après ajout, lancer `npm test` **et** `npm run test:e2e` **stack éteinte** → les deux doivent rester **verts**, et `npx jest --listTests` sur chaque config **ne doit pas** lister `kyc-chain.chain-spec.ts`.

`collectCoverageFrom` ne porte que sur `src` ⇒ les seuils **65/90/90/90** sont **structurellement insensibles** à cette story.

### Stack docker requise (compose racine)

`mongo` (rs0) · `kafka` · `redis` · `minio` · `mailhog` · **`auth-service:3001`** · **`kyc-service:3002`** · **`document-service:3006`** · **`admin-panel:3010`** · **`expert-comptable:3000`**

> **`expert-comptable` et `redis` sont des prérequis non évidents** : ils ne participent pas au parcours HTTP, mais l'assertion finale (e-mail d'approbation) dépend de son consumer `kyc.status.changed` **et** de son worker BullMQ (redis). Sans eux, **seule la phase 5.13 échoue** — le préflight doit donc **aussi** vérifier `expert-comptable`/`health` pour transformer cet échec tardif en diagnostic immédiat. `platform-catalog-service:3003` n'est pas nécessaire au parcours, mais **son absence dégraderait `sources.entitlements` en `unavailable`** (STORY-047) et ferait échouer l'assertion `sources: ok/ok` de la phase 4 ⇒ **le préflight le vérifie aussi**.

### Obtention du jeton `PLATFORM_ADMIN`

`auth-service` expose `npm run seed:admin` (`seed-platform-admin.ts`, lit `PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD`). Le test **ne l'exécute pas** (il resterait pur HTTP, sans coupler les tests d'`admin-panel` au CLI docker) : il **se logue** avec `CHAIN_ADMIN_EMAIL`/`CHAIN_ADMIN_PASSWORD` et, sur `401`, **échoue au préflight** avec le remède exact.

> **Simplification héritée de STORY-103 (2026-07-16)** : la suppression manuelle de la membership **n'est plus nécessaire** — le fix `issueSession` (la membership gagnait sur le `platformRole`) est livré. La recette est désormais : `npm run seed:admin` → login. Le JWT porte aussi `perms[]` (additif) ; **le test n'assert que `roles:[PLATFORM_ADMIN]` et l'`aud`** — n'introduire **aucune** dépendance à `perms[]` (EPIC-025 est en cours ; le test ne doit pas se coupler à une story en vol).

### Cohérence à terme : polling borné, jamais de `sleep`

Deux sauts Kafka + Tesseract WASM + un worker BullMQ ⇒ **latence variable, non bornée par construction**. Un délai fixe serait **soit flaky, soit lent** (et les deux avec le temps).

```ts
// utils/chain-env.ts
export async function waitUntil<T>(
  probe: () => Promise<T | null>,
  { timeoutMs, intervalMs, what }: { timeoutMs: number; intervalMs: number; what: string },
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value !== null) return value;
    } catch (error) { last = error; }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timeout (${timeoutMs} ms) en attendant : ${what}. Dernier état : ${String(last)}`);
}
```

Budgets indicatifs (à ajuster **à la mesure**, pas au doigt mouillé) : e-mail de vérification **~15 s** ; **OCR des 2 pièces ~90 s** (le plus long : Tesseract WASM à froid) ; e-mail d'approbation **~30 s**. `testTimeout` global confortablement au-dessus de la somme.

### Assertions OCR : la chaîne, pas la précision (décision)

`OcrModule` câble **Tesseract en dur** (`useClass: TesseractOcrProvider`, **pas** de bascule par env) : la stack docker fait donc du **vrai OCR**. On assert **le chaînage**, **jamais** le texte lu :

```ts
expect(doc.extraction).toBeDefined();
expect(doc.extraction.ocrProvider).toEqual(expect.any(String));
expect(doc.extraction.confidence).toEqual(expect.any(Number));
expect(doc.extraction.discrepancies).toBeDefined();
expect(kyc.ocrSummary.extractedCount).toBe(2);
// JAMAIS : expect(doc.extraction.extracted.denomination).toBe('PROSPERA SARL')
```

**Pourquoi** : assertionner le texte relu transformerait un test **de chaîne** en test **de précision Tesseract** — rouge selon le rendu de police, la version WASM ou l'OS, **sans qu'aucun service ne soit cassé** (un test qui échoue pour la mauvaise raison finit désactivé). Un OCR qui lit mal produit `flags.unreadable: true` et `discrepancies: [missing_read]` : c'est un résultat **parfaitement valide** de la chaîne — le dossier remonte à l'humain **avec** ses signaux, exactement comme prévu (DO-1). **La précision de Tesseract appartient aux tests de `document-service` (STORY-042/043), pas ici.**

### Rejouabilité (invariant de conception)

L'e-mail du cabinet est **unique par exécution** (`chain-<Date.now()>-<rand>@example.test`) ⇒ **org neuve à chaque run** ⇒ toujours `UNDER_REVIEW` au moment d'approuver. Conséquences :
- **aucun nettoyage, aucun `compose down`** entre deux runs (le test n'est pas hôte de sa propre fragilité) ;
- pas de `409` parasite dû à une org déjà approuvée lors d'un run précédent ;
- Mailhog est **filtré par destinataire** (jamais « le dernier e-mail reçu », qui casserait dès deux runs concurrents ou une boîte non vide) ;
- **trace assumée** : chaque run laisse une org de test en base (`chain-*@example.test`), cohérent avec l'état actuel (74+ orgs de vérif). Un `README` note le motif de purge éventuel.

### Sécurité (NFR)

- **Aucun secret committé** : identifiants admin par **env** (`CHAIN_ADMIN_*`), avec défauts de dev uniquement.
- Le test **ne journalise jamais** les bearers qu'il manipule (cohérent avec la redaction pino des services).
- **Fixtures neutres** : pièces **fictives** (dénomination inventée), **aucune** donnée réelle de cabinet — les images sont committées publiquement.
- Adresses en **`@example.test`** (TLD réservé) ⇒ aucun envoi hors Mailhog, même par mésconfiguration.

### Points d'attention d'implémentation

- **Le test ne pilote pas docker** (`compose up` / testcontainers) : la stack est un **prérequis**. Un test qui redémarre 10 conteneurs devient un orchestrateur — lent, fragile, propriétaire d'un cycle de vie qui n'est pas le sien. **Préflight explicite + message actionnable** est le bon rapport valeur/coût pour 3 points.
- **Multipart** : `supertest` (déjà présent) `.attach('file', path).field('type', 'RCCM')` — l'upload exige `TENANT_ADMIN` **et** `emailVerified` ⇒ la phase 1 doit être **complète** avant la phase 2 (un `403` ici signale une vérification d'e-mail ratée, pas un bug d'upload : le message d'erreur doit le dire).
- **Mailhog** : `GET /api/v2/search?kind=to&query=<email>` (filtrage par destinataire) ; le jeton de vérification s'extrait du corps par regex. Prévoir le corps **encodé (quoted-printable)** — un lien coupé sur 76 colonnes est un piège classique.
- **`orgId`** : capturé depuis le claim `org` du JWT du cabinet (déjà présent) — inutile d'appeler un endpoint dédié.
- **Ne pas réutiliser la fixture RS256/JWKS** (`test/utils/rs256.ts`) : ici les JWT sont **réels**, émis par `auth-service`. La fixture reste réservée aux e2e mockés.
- **Diagnostic en cas d'échec OCR** : sur timeout de la phase 3, l'erreur doit **dumper l'`ocrSummary` observé en dernier** (souvent `extractedCount: 1` ⇒ **une seule** pièce a traversé : le symptôme le plus probable d'une **divergence de contrat `document.extrait`** — précisément le bug que la story existe pour attraper).

---

## Dependencies

**Stories prérequises (toutes ✅ — la chaîne est complète, il ne manque que sa preuve) :**
- **STORY-040** (`kyc` : émission `kyc.document.uploaded` à l'upload) — départ de la chaîne OCR ✅
- **STORY-041/042/043** (`document-service` : scaffold + OCR Tesseract + comparaison → `document.extrait`) ✅
- **STORY-045** (`kyc` : consomme `document.extrait` → projette l'assistance de revue + enrichit `getDetail`) ✅
- **STORY-013** (`kyc` : revue admin approve/reject + transitions + outbox `kyc.status.changed`) ✅
- **STORY-021** (`expert-comptable` : consomme `kyc.status.changed` → e-mails approbation/rejet) — **fournit l'assertion finale** ✅
- **STORY-046/047/048** (`admin-panel` : scaffold + vue agrégée + actions proxifiées) — **le sujet du test** ✅
- **STORY-103** (`auth` : fix `issueSession`) — **simplifie** la recette du jeton admin (plus de suppression de membership) ✅

**Stories débloquées / bénéficiaires :**
- **Aucune dépendance dure** — mais le test devient le **filet de non-régression** de toute la chaîne KYC pour les sprints suivants (RBAC EPIC-025 en cours, balance-service en S11), en particulier pour **STORY-105** (migration des amont vers les permissions : `kyc-service` revérifie `PLATFORM_ADMIN` → ce test rougirait immédiatement si la migration cassait la revue KYC).
- **AP-01→AP-04** (fronts) — le parcours prouvé ici est exactement celui qu'ils outillent.

**Dépendances externes :**
- Stack docker complète (compose **racine**) + `npm run seed:admin` joué une fois dans `auth-service`.
- Aucune nouvelle dépendance runtime ; `supertest`/`jest` déjà présents. **Aucun driver mongo, aucun client Kafka** (voir §Nature du test).

---

## Definition of Done

- [ ] ESLint : 0 warning (`npm run lint`, harnais de chaîne inclus)
- [ ] Build : `nest build` vert
- [ ] **Isolation prouvée, stack éteinte** : `npm test` **vert** + `npm run test:e2e` **vert** ; `npx jest --listTests` sur les deux configs **ne liste pas** `kyc-chain.chain-spec.ts` ; couverture et seuils **65/90/90/90 inchangés**
- [ ] **`npm run test:chain` vert sur la stack docker complète** (`mongo` rs0 + `kafka` + `redis` + `minio` + `mailhog` + `auth:3001` + `kyc:3002` + `document:3006` + `admin:3010` + `expert-comptable:3000` + `catalog:3003`), consigné en §Revue & validation avec la **durée observée** :
  - préflight : services up + admin seedé (sinon message actionnable **en secondes**) ;
  - inscription → e-mail de vérification (Mailhog) → `verify-email` → login `TENANT_ADMIN` (`org` capturé) ;
  - upload **RCCM** + **CFE** → **201** ×2 → KYC `UNDER_REVIEW` ;
  - **attente OCR** → `ocrSummary.extractedCount === 2` + `extraction` sur les 2 pièces (**forme**, pas texte lu) ;
  - **DO-1** : statut **toujours `UNDER_REVIEW`** après OCR ;
  - `GET /admin/orgs/:orgId` → **200**, 2 pièces présignées, `sources: { kyc: ok, entitlements: ok }` ;
  - **approve** → **200** `APPROVED` ; relecture → **persisté** + `reviewedBy` = `sub` admin ;
  - **e-mail d'approbation** reçu (Mailhog) 🏁 ;
  - **re-approve** → **409**, aucun second e-mail
- [ ] **Rejouabilité** : le test passe **deux fois d'affilée** sans nettoyage ni `compose down`
- [ ] **Zéro `sleep`/délai fixe** : uniquement `waitUntil` borné, avec message de timeout nommant l'attente et dumpant le dernier état observé
- [ ] **Zéro modification de `src/`** (vérifié par `git diff --stat`) ; **aucune** dépendance runtime ajoutée
- [ ] README `admin-panel` : prérequis, lancement, lecture d'un échec, purge des orgs `chain-*`
- [ ] `/code-review` réalisé ; constats correctness corrigés
- [ ] Statut mis à jour dans `sprint-status.yaml` (+ `completed_date` à la clôture) ; **jalon Module 0 🏁** consigné
- [ ] Flux git projet : branche `MNV-049` (depuis `dev`, rebasée `origin/dev`), commit `MNV-049(admin-panel): …`, PR « Rebase and merge » sur `dev`, branche supprimée après merge (dépôt `prospera-admin-panel-service`)

---

## Story Points Breakdown

- **Harnais** (`jest-chain.json` + `chain-env.ts` : URLs, préflight fail-fast, `waitUntil`, diagnostics) + **isolation vérifiée** des 3 suites : **1 pt** — *le vrai risque de la story n'est pas le scénario, c'est de casser la CI en silence ou de livrer un test flaky.*
- **Phases 1-2** (inscription, extraction du jeton Mailhog quoted-printable, login, upload multipart ×2) + fixtures d'images : **0,75 pt**
- **Phases 3-5** (attente OCR, assertions d'enrichissement + DO-1, approbation, `reviewedBy`, e-mail 🏁, re-approve 409) : **0,75 pt**
- **Exécution docker réelle, calibrage des budgets d'attente, rejouabilité ×2, README** : **0,5 pt**
- **Total : 3 points**

**Rationale :** aucun code applicatif, aucune règle métier, aucun contrat nouveau — les 5 services et leurs endpoints existent et sont vérifiés. L'effort est **de plomberie de test** : orchestrer un parcours séquentiel long, **absorber l'asynchronisme sans flakiness** (le seul vrai piège technique), et **garantir que la CI reste verte sans docker**. Le scénario lui-même est déjà écrit — c'est la recette manuelle des vérifs 045/047/048, qu'on transcrit. Conforme à l'estimation du sprint-plan (3 pts).

---

## Additional Notes

- **La valeur est dans les jointures, pas dans les maillons.** Les tests de chaque service prouvent qu'il fait ce qu'il croit devoir faire ; **rien** ne prouve aujourd'hui qu'ils sont **d'accord entre eux**. Avec des contrats **dupliqués par choix** (K4), l'accord n'est garanti par **aucun compilateur** : deux copies de `document.extrait` peuvent diverger avec **100 % des suites au vert**. Ce test est le **seul** endroit du système où ce désaccord devient visible.
- **Pourquoi maintenant, précisément.** La chaîne est complète (048 done le 2026-07-16) **et** EPIC-025/RBAC va **toucher les amont** (STORY-105 : `kyc-service` et `catalog` migrent leurs gardes `PLATFORM_ADMIN`). Écrire le filet **avant** la migration, c'est convertir un risque de régression silencieuse en test rouge immédiat. **Après**, ce serait de l'archéologie.
- **Test pur, invariant strict** : si `npm run test:chain` rougit, **c'est un service qui a un bug** — jamais le test à « ajuster ». Un test de chaîne qu'on assouplit pour le faire passer n'a plus aucune valeur. Si un timeout est trop court, la correction est de **mesurer et recalibrer**, pas de relâcher une assertion.
- **Preuve par l'effet plutôt que par l'artefact** : Mailhog prouve `publié + transporté + consommé + traité` ; l'outbox ne prouve que `écrit`. Preuve **plus forte**, couplage **plus faible** — et l'invariant « `admin-panel` n'a aucune base » reste intact.
- **CI : manuel/nightly en v1.** Le test exige 10 conteneurs et ~2 min : l'intégrer à la CI de PR d'`admin-panel` **ralentirait chaque PR d'un service qui n'y est pour rien**. Le bon foyer est un **job nightly / une CI d'écosystème** — qui n'existe pas encore (aucun dépôt racine : la racine **n'est pas versionnée**). Noté comme **dette explicite**, hors périmètre de ces 3 points.
- **Extensions naturelles** (non incluses) : parcours de **rejet** (`reject { reason }` → e-mail de rejet, STORY-021) ; **entitlement** après approbation (« org validée → vertical activé ») ; **dégradation** (`stop kyc-service` → `sources.kyc: unavailable` en lecture, `503` en écriture). Le harnais (`chain-env.ts`, `waitUntil`, fixtures) est conçu pour les accueillir **sans réécriture**.
- **Emplacement** : `admin-panel` retenu car (a) le sprint-plan y rattache la story (`service: admin-panel`), (b) le BFF **est** le point d'entrée du parcours admin, (c) c'est le seul foyer **versionné** disponible — la racine et `scripts/` **ne sont pas des dépôts git** (un script y serait perdu, jamais poussé, jamais rejoué). Un dépôt `prospera-e2e` dédié serait plus neutre à terme (et le foyer naturel des e2e balance/bilan à venir) : **à rouvrir** quand un 2ᵉ e2e cross-service apparaîtra — pas pour 3 points aujourd'hui.
- **Dépôt GitHub** : `prospera-admin-panel-service` (existe) — push après validation (branche `MNV-049`).

---

## Revue & validation

**Implémentée le 2026-07-16 (BMAD dev-story).** Story de **test pur** : `git diff --stat` ne touche **aucun** fichier de `src/`, et **aucune dépendance n'a été ajoutée** (`FormData`/`Blob` **natifs** Node 18+ — axios pose lui-même la frontière multipart ; `form-data` n'est pas une dépendance directe du service).

**Livré** (7 fichiers, +775 lignes) : `test/kyc-chain.chain-spec.ts` (préflight + 5 phases, 8 tests) · `test/utils/chain-env.ts` (URLs, préflight fail-fast, `waitUntil`, `assertNeverDuring`, lecture Mailhog) · `test/jest-chain.json` (3ᵉ config) · `test/fixtures/{rccm,cfe}.png` · script `test:chain` · README (mode d'emploi + diagnostic ; au passage : **retrait de la mention obsolète de `GET /admin/whoami`**, endpoint supprimé en STORY-047).

### Isolation de la CI — **prouvée stack réellement éteinte**

`docker compose stop` (tous conteneurs arrêtés, `curl` admin-panel injoignable), puis :
- `npm test` → **124 tests / 20 suites verts** ; `npm run test:e2e` → **28 tests / 3 suites verts**.
- `npx jest --listTests` : la config unit → **0** occurrence de `chain-spec` ; la config e2e → les 3 `*.e2e-spec.ts` seulement ; la config chain → `kyc-chain.chain-spec.ts` seul.
- Couverture **inchangée** : **99.76 / 89.81 / 100 / 99.73** (seuils 65/90/90/90) — `collectCoverageFrom` ne porte que sur `src`, le harnais y est structurellement insensible.
- `npm run lint` **0 warning** · `nest build` **OK** (codes de sortie vérifiés).

### Exécution docker bout-en-bout — **verte** (`npm run test:chain`, 8/8, ~13-26 s)

Stack : `mongo` rs0 + `kafka` + `redis` + `minio` + `mailhog` + `auth:3001` + `kyc:3002` + `catalog:3003` + `document:3006` + `admin:3010` + `expert-comptable:3000`. Admin obtenu par `npm run seed:admin` **puis login** — la suppression de membership **n'est plus nécessaire** (fix `issueSession`, STORY-103, confirmé : les 4 rôles système sont seedés au bootstrap).

Parcours prouvé : inscription → e-mail de vérification (Mailhog) → `verify-email` → login `TENANT_ADMIN` (`org` capturé du claim) → upload **RCCM + CFE** (201 ×2) → `UNDER_REVIEW` → **attente OCR** → `ocrSummary.extractedCount === 2` → dossier enrichi (2 pièces présignées + `extraction`, `sources: ok/ok`) → **DO-1 : statut toujours `UNDER_REVIEW`, `reviewedBy` absent** → **approve → 200 `APPROVED`**, relu **persisté** avec **`reviewedBy` = `sub` de l'admin relayé** → **e-mail d'approbation 🏁** → **re-approve → 409**, **aucune seconde notification**.

**L'OCR réel a parfaitement lu les fixtures** (non assertionné — par choix) : `tesseract`, **confiance 92**, `discrepancies: []`, `flags: {unreadable:false, expired:false}` ; RCCM → `{registrationNumber: "CI-ABJ-2024-B-12345", denomination: "PROSPERA CHAIN SARL", legalForm: "SARL", documentDate: "2024-03-15"}` ; CFE → `{registrationNumber: "CI-CFE-2024-778899", taxId: "CI2024778899X", denomination: "PROSPERA CHAIN SARL"}`. Parcours **nominal réel** — meilleur que la vérif manuelle de STORY-045 (qui sortait `missing_read`/`unreadable`). Les fixtures ont été générées **hors dépendance** (rendu HTML → `qlmanage`, one-off ; le PNG est committé) et **alignées sur les parseurs** (`RCCM_NUMBER_RE`, `DENOMINATION_RE`, `LEGAL_FORM_RE`, `TAX_ID_RE`, `DATE_RE`).

### Le test peut **rougir** — contrôles négatifs (la vérification qui compte)

Un test de chaîne qui ne peut que passer ne vaut rien. Les deux chemins d'échec ont été **exercés pour de vrai** :

1. **Préflight** — `docker compose stop expert-comptable` → échec **en secondes** : `✗ expert-comptable (injoignable : …) — sinon aucun e-mail d'approbation (consumer kyc.status.changed)` + remède `docker compose up -d`. (Le stop initial a d'ailleurs révélé que `minio` et `expert-comptable` étaient absents et `document-service` *unhealthy* — le préflight fait son travail dès la première minute.)
2. **Chaîne rompue** — `document-service` **stoppé**, préflight leurré vers un service sain (simulation d'un `document-service` joignable qui ne publie plus `document.extrait`, c.-à-d. **la divergence de contrat K4 que la story existe pour attraper**) → la phase OCR rougit à 180 s avec le diagnostic exact :
   `Timeout (180000 ms) en attendant : l'enrichissement OCR des 2 pièces (ocrSummary.extractedCount === 2). Dernier état observé : {"hasDiscrepancies":false,…,"extractedCount":0}.`

**Rejouabilité** : deux exécutions consécutives vertes, **sans aucun nettoyage** ni `compose down` (~13 s chacune) — adresse unique par run ⇒ org neuve ⇒ toujours `UNDER_REVIEW` à l'approbation.

### `/code-review` (high) — 3 constats correctness **corrigés**, 3 assumés

- 🔴 **L'assertion « aucune seconde notification » était creuse** (le constat le plus grave) : elle recomptait les e-mails **~80 ms** après le `409`, alors qu'un e-mail met **~2 s** à traverser Kafka → `expert-comptable` → BullMQ → SMTP. Elle passait donc **même avec un doublon en vol** — précisément le cas qu'elle prétend interdire. Corrigé par `assertNeverDuring` : fenêtre bornée (10 s, ≫ latence mesurée), échec **immédiat** si un doublon apparaît. Le test passe de **85 ms → 10 154 ms** : il attend désormais réellement. **Seule exception assumée à la règle « aucun délai fixe »** — et elle est structurelle : *on ne peut pas sonder une absence* (documenté dans le code et le README).
- 🔴 **Mojibake UTF-8** : `decodeQuotedPrintable` décodait octet par octet en latin-1 (`String.fromCharCode`) → `=?UTF-8?Q?V=C3=A9rifiez…` donnait « VÃ©rifiez ». Le filtre `/v[ée]rifiez/` n'aurait **jamais** matché ⇒ phase 1 en timeout sur une chaîne pourtant saine. Masqué tant que le prédicat portait sur le corps (jeton pur ASCII). Corrigé : réassemblage des octets **puis** décodage UTF-8.
- 🔴 **Diagnostic illisible** : `String(error)` rendait `[object Object]` / `AggregateError` nu. Corrigé par `describeError()` (déplie les causes d'`AggregateError`) — le diagnostic est la raison d'être du harnais.
- 🟡 **Contrats retypés localement** (`KycDetail`, `OrgDetail`…) vs `src/upstream/contracts/` — **assumé** : le test est un client **boîte noire** ; importer les types de `src/` le coupleraient à l'implémentation qu'il vérifie et **masqueraient une rupture de contrat HTTP** (le test compilerait toujours). Cohérent avec la duplication K4.
- 🟡 `getOrgDetail` lève via `expect()` dans une sonde ⇒ un non-200 **persistant** est réessayé jusqu'au timeout — **assumé** : c'est ce retry qui absorbe les 502/503 transitoires au démarrage des conteneurs, et `describeError` fait remonter l'assertion comme « dernière erreur ».
- 🟡 `src/app.module.ts:31` porte un **commentaire obsolète** (« sonde `GET /admin/whoami` », retirée en STORY-047) — **non corrigé** : l'invariant « zéro `src/` » prime. À traiter dans une story qui touche légitimement ce fichier.

**Reste :** — **Jalon Module 0 🏁 atteint** : la chaîne KYC est livrée **et prouvée rejouable**.

---

## Progress Tracking

**Status History:**
- 2026-07-16 : Créée par vivian (Scrum Master, BMAD create-story)
- 2026-07-16 : Implémentée + vérifiée docker (8/8) + contrôles négatifs + `/code-review` (3 correctness corrigés) + intégrée dans `dev` (BMAD dev-story)

**Actual Effort:** 3 points (conforme à l'estimation)

---

**Status:** ✅ Done (vérifiée docker 2026-07-16) — **jalon chaîne KYC complète 🏁**
**Created:** 2026-07-16
**Reference:** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-4 ; `architecture-prospera-ecosystem-2026-07-04.md` § P8/K4/DO-1 ; `sprint-plan-phase1-2026-07-10.md` § Module 0 / EPIC-015+EPIC-016 (AD-2, jalon 🏁)

**Cette story a été créée avec BMAD Method v6 — Phase 4 (Implementation Planning).**
