# STORY-130 : Dette de contrat OpenAPI — l'IdP décrit mal ce qu'il renvoie (`/users/me`, `/auth/verify-email`)

**Epic :** transverse / qualité de contrat (auth-service)
**Réf. process :** règle **Integration Gate** (`.claude/rules/integration-gate.md`) — « les types TS sont générés depuis l'OpenAPI, aucun type écrit à la main »
**Priorité :** Should Have
**Story Points :** 1
**Statut :** done ✅
**Assigné à :** vivianMoneyVibesGroupes
**Sprint :** 16 (proposé — à glisser avec n'importe quelle story auth du sprint)
**Créée le :** 2026-07-22
**Services :** `auth-service` (:3001)
**Couvre :** dette de contrat relevée pendant l'Integration Gate et FE-015

> Petite story, effet réel : **le frontend génère ses types depuis cet OpenAPI**. Chaque champ mal décrit
> oblige à écrire un contournement à la main — c'est-à-dire exactement ce que l'Integration Gate interdit.

---

## User Story

En tant que **frontend qui génère ses types depuis l'OpenAPI de l'IdP**,
je veux **que le schéma décrive ce que les routes renvoient réellement**,
afin de **ne pas réintroduire des types écrits à la main pour compenser une documentation fausse.**

---

## Description

Deux écarts constatés en confrontant les réponses réelles (stack docker `origin/dev`) aux schémas générés :

### 1. `GET /users/me` renvoie une organisation non déclarée

La réponse réelle contient un objet `organization` imbriqué (`id`, `name`, `slug`, `country`, `status`) —
la description de la route le dit d'ailleurs (« ses infos, son rôle, **son organisation** »). Mais
`UserResponseDto` ne porte pas ce champ. Le frontend qui voudrait l'utiliser doit soit le redéclarer à la
main, soit faire un second appel à `/organizations/me` — ce que fait FE-015 aujourd'hui.

### 2. `GET /auth/verify-email` déclare `content: never` mais renvoie un corps

Le schéma annonce une **200 sans contenu**. La route renvoie `{ "message": "Adresse e-mail vérifiée avec
succès." }`. Cet écart a un antécédent coûteux : le front typait l'appel en `Promise<void>`, la `queryFn`
résolvait `undefined`, et **TanStack Query mettait la requête en erreur** — l'écran affichait « Lien invalide
ou expiré » alors que le serveur répondait 200. Corrigé côté frontend (FE-INT-4), mais la cause est ici.

---

## Scope

**Inclus**

- Déclarer `organization` dans le DTO de `GET /users/me` (ou introduire un `MeResponseDto` distinct de
  `UserResponseDto` si les deux surfaces divergent — c'est le cas).
- Déclarer le corps de réponse de `GET /auth/verify-email` (`{ message: string }`), et faire de même pour
  toute route `/auth/*` qui renvoie un message non documenté (`resend-verification`, `logout` : à vérifier
  au passage).
- Re-générer et **relire** `/api/docs-json` après correction.

**Hors périmètre**

- Toute modification de comportement : la story ne change **que la description**. Si un écart révèle un vrai
  bug de comportement, il fait l'objet d'une story séparée.

---

## Acceptance Criteria

- **AC-01** — Le schéma de `GET /users/me` contient `organization` avec ses champs réels ; un `npm run
  gen:api` côté frontend produit un type exploitable sans ajout manuel.
- **AC-02** — `GET /auth/verify-email` déclare une réponse **200 avec** `{ message: string }`.
- **AC-03** — Les autres routes `/auth/*` renvoyant un message sont vérifiées et corrigées si besoin
  (liste explicite dans la PR, même si elle est vide).
- **AC-04** — Aucun changement de comportement : les réponses HTTP réelles sont identiques avant/après
  (diff de contrat only).

---

## Technical Notes

- Décorateurs `@ApiOkResponse({ type: … })` manquants ou pointant vers le mauvais DTO — c'est le motif
  habituel de ce genre d'écart avec `@nestjs/swagger`.
- Bon réflexe pour la suite : quand une route renvoie un corps, le DTO de ce corps doit exister ; `content:
  never` ne devrait apparaître que sur de vraies 204.

---

## Dependencies

- **Aucune.** Peut être livrée avec n'importe quelle story `auth-service`.
- **Sert** : toutes les stories frontend qui génèrent leurs types (FE-015, FE-019, FE-021…).

---

## Definition of Done

- 4 AC passent ; `npm run gen:api` rejoué côté frontend sans type manuel ajouté.
- La PR liste les routes vérifiées, y compris celles qui n'avaient rien à corriger.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — les deux écarts ont été rencontrés en conditions réelles :
  `verify-email` a produit un faux message d'erreur en navigateur (corrigé côté front en FE-INT-4),
  `organization` a été découvert en lisant la réponse réelle pendant FE-015.
- 2026-07-23 : **done** ✅ — branche `MNV-130`, PR
  [auth-service#12](https://github.com/MoneyVibesGroup/prospera-auth-service/pull/12) intégrée sur `dev`
  en *Rebase and merge*, branche supprimée.

---

### Ce qui a été livré

La story annonçait **2 écarts**. La confrontation du schéma généré aux réponses réelles (stack docker
`origin/dev`) en a fait apparaître **4**, puis le test généralisé un **5ᵉ** :

| # | Route / champ | Avant | Après |
|---|---|---|---|
| 1 | `GET /users/me` → `organization` | `{"type":"object"}` — opaque | `$ref: OrganizationInfo`, `nullable` |
| 2 | `GET /auth/verify-email` | `200` **sans contenu** | `200` → `MessageResponseDto` |
| 3 | 5 autres routes à corps `{ message }` | `content: never` | `MessageResponseDto` |
| 4 | `POST /auth/forgot-password` | déclarait **200** | déclare **202** (statut réel) |
| 5 | `GET /.well-known/jwks.json` | **aucune** déclaration | `JwksResponseDto` + `JwkDto` |

**Écart 1** — `organization?: OrganizationInfo | null` est une **union**, donc `emitDecoratorMetadata` ne
réfléchit que `Object` : le champ dégénérait en `Record<string, unknown>`. Corrigé par un
`type: () => OrganizationInfo` explicite ; la classe est exportée et son schéma désormais publié.

**Écart 4** — la route porte `@HttpCode(ACCEPTED)` : elle répond 202, statut que le schéma ne déclarait
nulle part. Un client généré strict traitait une réponse **normale** comme un échec.

**Écart 5 — hors liste d'origine.** Le test de contrat, une fois étendu aux 8 contrôleurs, a fait sortir
le JWKS : il renvoyait son corps sans aucune déclaration. Ce n'est pas une route anodine — c'est
l'**ancre de confiance RS256** contre laquelle les 7 autres services valident leurs jetons localement. La
doc du DTO insiste sur le fait que **plusieurs clés à la fois est le cas normal** (rotation : la clé
sortante reste publiée en `RETIRING`), pour qu'aucun client ne suppose `keys[0]`.

**Le détail qui empêche la doc de rementir** : chaque `example` **provient de la constante réellement
renvoyée** (`EMAIL_VERIFIED_MESSAGE`, `FORGOT_PASSWORD_MESSAGE`…), pas d'une chaîne recopiée. Changer le
message sans changer la doc ne compile plus. `INVITATION_RESENT_MESSAGE` a été extrait pour cette raison.

### AC-03 — inventaire complet, y compris ce qui n'avait rien à corriger

| Route | Verdict |
|---|---|
| `GET /auth/verify-email`, `POST /auth/resend-verification`, `GET /auth/confirm-email-change` | ❌ corrigées |
| `POST /auth/forgot-password` | ❌ corrigée (corps **et** statut) |
| `POST /users/me/email`, `POST /users/{id}/resend-invitation` | ❌ corrigées |
| `GET /.well-known/jwks.json` | ❌ corrigée (trouvée par le test) |
| `POST /auth/logout` | ✅ **déjà correct** (`LogoutResponseDto`) — rien à faire |
| `POST /auth/reset-password`, `DELETE /users/me/email`, `DELETE /users/me/sessions*` | ✅ vraies **204** — `content: never` légitime |

### Vérification

**Test de contrat** — `test/openapi-contract.e2e-spec.ts` construit le document OpenAPI et l'inspecte.
Aucun test HTTP ne pouvait attraper ces bugs : les réponses réelles étaient **déjà bonnes**, c'est *le
document* qu'il fallait tester. Le test central est la **règle générale** — aucune 2xx hors 204 ne
déclare un corps sans `schema` — appliquée aux **8 contrôleurs**, pas aux 2 que la story touche.

**Mutation-test — 6 mutations rejouées, 6 détectées :**

| # | Mutation | Détectée par |
|---|---|---|
| 1 | `type` retiré de `verify-email` | AC-02 |
| 2 | déclaration entière retirée de `resend-verification` | AC-03 (règle) |
| 3 | `forgot-password` repassé en `@ApiOkResponse` (200) | AC-03 statut + AC-04 |
| 4 | `organization` sans `type` explicite | 2 tests d'AC-01 |
| 5 | `example` **sans** `type` (faille trouvée en revue) | AC-03 durci |
| 6 | déclaration du JWKS retirée | AC-03 (règle) |

**Vérification docker** (stack `origin/dev`, `docker restart` avant chaque relecture) :

- Contrat relu sur `/api/docs-json` **avant** et **après** — les 7 routes passent de `content: NEVER` à un
  `$ref` ; `organization` passe de `{"type":"object"}` à `allOf: [$ref OrganizationInfo]` + `nullable`.
- **AC-04, réponses HTTP réelles capturées avant et après** : `verify-email` → 200 + même corps ;
  `forgot-password` → **202** + même corps ; `resend-verification` → 200 + même corps ; `/users/me` →
  200, **mêmes clés racine et mêmes clés `organization`**. Champs du JWKS réel (`kty`, `use`, `kid`,
  `alg`, `n`, `e`) confrontés un à un au DTO déclaré. **Aucun changement de comportement.**
- Story sans écriture en base : aucun invariant `mongosh` à contrôler.

**Portes DoD** — lint 0 warning · build OK · **594** tests unitaires (57 suites) · **153** e2e (12 suites) ·
couverture **96,89 / 89,65 / 97,8 / 96,92** (seuils 65/90/90/90).

### Revues

- **Code review** — `/code-review` est réservé à l'invocation utilisateur ; revue conduite via l'agent
  `test-prospera` sur l'axe concerné. **3 constats, tous retenus et corrigés** dans un commit dédié :
  (a) AC-03 se contentait d'un `content` non vide, or un `example:` sans `type:` suffit à en émettre un
  **sans `schema`** → la règle laissait passer la moitié des régressions qu'elle prétendait couvrir ;
  (b) le test ne montait que 2 des 8 contrôleurs alors que son docblock promettait une règle valant pour
  tout le service → promesse **tenue** plutôt que revue à la baisse, ce qui a révélé l'écart 5 ;
  (c) le `DocumentBuilder` recopiait la config de `setupSwagger()` — duplication supprimée, aucune
  assertion n'en dépendant.
  L'agent `nestjs-prospera` a échoué sur une erreur serveur 529 ; ses axes (placement du DTO, couplage
  d'import, décorateurs, ordre des routes) ont été couverts par la revue de sécurité et le test AC-04.
- **Revue de sécurité** — `/security-review` sur la PR #12 :
  **aucune vulnérabilité exploitable**. Vérifiés explicitement : le JWKS n'expose que des composants de
  clé **publique** (aucun `d`/`p`/`q`/`dp`/`dq`/`qi`, `publicJwk` inchangé) ; les `example` publiés sont
  des corps **déjà constants et renvoyés à tout appelant**, donc l'**anti-énumération** des routes 202
  systématiques est intacte ; `OrganizationInfo` n'expose aucun champ de trop et concerne l'organisation
  **de l'appelant** ; aucun `ClassSerializerInterceptor` n'existe dans l'app, donc le narrowing de type
  de retour ne peut avoir neutralisé aucune exclusion ; `@Throttle` conservé partout, aucun `@Public()`
  ajouté ou retiré.

### Hooks pour la suite

- La règle AC-03 vit désormais dans le test : toute route ajoutée à l'un des **8 contrôleurs** qui
  renverrait un corps non déclaré vire au rouge. **Un 9ᵉ contrôleur doit être inscrit dans la liste du
  `beforeAll`** — c'est le seul entretien que ce fichier demande, et il est signalé en commentaire.
- `MessageResponseDto` (`src/common/dto/`) est réutilisable par toute route à corps `{ message }`.
- Patron transposable aux 7 autres services, qui n'ont pas encore de test de contrat OpenAPI.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
