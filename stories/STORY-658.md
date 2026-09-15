# STORY-658 : Lever un seul blocage de throttle efface les échéances de tous les clients — 12 services, et la connexion à l'IdP en tête

Status: in_progress

**Complexité :** high

**Épic :** transverse — socle commun des services (hors décompte d'épic, précédent STORY-109)
**Service :** les **12** dépôts de services backend — `admin-panel`, `auth-service`, `balance-service`,
`bilan-service`, `document-service` (`prospera-ocr-service`), `dossier-service`, `expert-comptable`, `kyc-service`,
`microfinance-service`, `notification-service`, `paiement-service`, `platform-catalog-service`
**Points :** 8 · **Sprint :** S20
**Origine :** défaut **trouvé en revue de sécurité de STORY-504** (2026-09-14, confiance 85), **reproduit sur la stack
docker** le même jour, puis **mesuré dans les 12 dépôts le 2026-09-15**. Hors périmètre de 504, consigné en dette à sa
clôture (emplacement inerte `THROTTLE_PROPRE_DU_PROVISIONNEMENT`).

---

## Le fait

Tous les services limitent le débit par IP avec `@nestjs/throttler` et son stockage **en mémoire par défaut**. Ce
stockage range les minuteurs qui font redescendre les compteurs **par nom de throttler** (`default`), et non **par
clé** (route × IP). Quand **une** clé bloquée revient après son blocage, la bibliothèque efface les minuteurs de
**toutes** les clés du même nom : les compteurs de tous les autres clients, sur toutes les routes, **cessent de
redescendre**. Ils ne redescendront qu'après avoir été eux-mêmes bloqués puis levés.

**Mesuré, pas supposé :**

| Constat | Mesure |
|---|---|
| mécanisme dans la bibliothèque | `node_modules/@nestjs/throttler/dist/throttler.service.js` 6.5.0 : `timeoutIds` est une `Map` indexée par `throttlerName` (l. 14, 25-32) ; `resetBlockdRequest(key, throttlerName)` appelle `clearExpirationTimes(throttlerName)` (l. 38-41), qui fait `clearTimeout` sur **tous** les minuteurs du nom (l. 34-36) ; appelé dès qu'un blocage expiré est levé (l. 77) |
| reproduit sur la vraie classe | script de la revue de STORY-504 : un attaquant **anonyme** à 4 requêtes/min sur une route à limite 3 fait refuser une victime qui ne fait que 2 requêtes/min, **dès la minute 5,5** |
| reproduit sur la stack docker | vérification de STORY-504 (`e3111d0`) : après la levée d'un blocage sur une route, le compteur d'une AUTRE route (`classement-credits`) reste à **93** au lieu de revenir à 99 après la fenêtre — six requêtes jamais décomptées |
| aucune version corrigée | `@nestjs/throttler` **6.5.0 est la dernière version publiée** (2025-12-02) |
| les 12 dépôts sont exposés | `^6.5.0` déclaré et installé partout ; **aucun** stockage propre (`ThrottlerModule` sans `storage`) ; `notification-service` et `paiement-service` vérifiés via l'API GitHub |

## ⛔ Là où c'est le plus grave

Le défaut se déclenche d'autant plus facilement que la limite est **basse** et la route **publique**. Relevé le
2026-09-15 des limites propres (hors specs) :

| Service | Route | Limite propre |
|---|---|---|
| **`auth-service`** | `auth.controller.ts:76, 208, 234, 250` et `users.controller.ts:204, 233` | **5** requêtes / 60 s |
| **`auth-service`** | `auth.controller.ts:160` | **3** requêtes / 60 s |
| `bilan-service` | `export.controller.ts:53, 102` (export de la liasse) | 10 requêtes / 60 s |
| tous les services | limite globale | 100 requêtes / 60 s par IP |

⚡⚡ **Scénario de l'IdP** : les routes d'authentification sont publiques par nature. Un anonyme qui dépasse
volontairement la limite de 3 ou 5 sur l'une d'elles, attend la levée, puis recommence, **gèle en boucle les
compteurs de tous les autres clients** de l'instance d'`auth-service`. Leurs essais s'additionnent sans jamais
redescendre : des utilisateurs légitimes reçoivent **429 à la connexion** après quelques tentatives étalées sur
plusieurs minutes. C'est un **déni de service sur l'IdP**, donc sur tout l'écosystème (aucun jeton émis ⇒ aucun
service utilisable).

## Critères d'acceptation

- [ ] AC-1 — Chaque service fournit à `ThrottlerModule` un **stockage propre** (`ThrottlerStorage`,
      `increment(key, ttl, limit, blockDuration, throttlerName)`) dont les échéances sont tenues **par clé** : la levée
      du blocage d'une clé ne touche **jamais** le compteur d'une autre clé. Mêmes limites, même traceur IP
      (`IpThrottlerGuard`), même contrat HTTP (429, en-têtes `X-RateLimit-*`, `Retry-After`).
- [ ] AC-2 — ⛔ **Test qui rougit sur le stockage de la bibliothèque** : deux clés ; la première est bloquée puis levée
      pendant que la seconde a des requêtes en vol ⇒ après la fenêtre, le compteur de la seconde est **revenu à zéro**.
      Le même test exécuté contre le stockage par défaut 6.5.0 **échoue** (mutation : remettre le stockage par défaut).
- [ ] AC-3 — Pas de fuite mémoire : une clé sans requête depuis plus de sa fenêtre et de son blocage est **purgée** ;
      un test borne le nombre d'entrées après une rafale de clés distinctes.
- [ ] AC-4 — Le stockage n'introduit aucun `setTimeout` par requête non libéré : l'arrêt de l'application
      (`onApplicationShutdown`) laisse la boucle d'événements vide (pas de handle ouvert qui retient jest ou le process).
- [ ] AC-5 — Les **12** dépôts reçoivent le même stockage et le même test ; chaque dépôt passe ses portes DoD. Le code est
      identique d'un dépôt à l'autre (même empreinte), pour ne pas faire diverger les services.
- [ ] AC-6 — **Vérification docker sur `auth-service`** : reproduire le scénario de l'IdP **avant** correctif (compteur
      d'un second client gelé, 429 injustifié) puis **après** (compteur du second client revenu, zéro 429 injustifié),
      avec des jetons et des requêtes réels, sans saturer la limite globale ; même preuve de non-régression sur
      `microfinance-service`.

## Hors périmètre

Un throttle **par utilisateur authentifié ou par organisation** (placé après `JwtAuthGuard`) — c'est ce qui débloquera le
throttle propre du provisionnement de STORY-504, à cadrer ensuite · un stockage partagé entre instances (Redis) : les
limites restent **par instance**, comme aujourd'hui · la mise en commun du code dans un paquet partagé · signaler le
défaut en amont à `@nestjs/throttler` est **souhaitable** mais ne conditionne pas cette story.

## Notes

- ⚠️ **12 dépôts ⇒ 12 branches `MNV-658` et 12 PR** sur `dev`, livrées en série cohérente. **`auth-service` en premier** :
  c'est lui qui porte les limites les plus basses sur des routes publiques.
- ⚠️ `docker-compose*.yml` et la CI racine ne sont versionnés dans aucun dépôt : rien à y changer ici.
- Voir [[STORY-504]] (revue de sécurité et vérifications docker qui ont mis le défaut en évidence, décision D-504-R),
  [[STORY-133]] (`IpThrottlerGuard`), [[STORY-657]] (l'autre défaut transverse relevé à la même clôture).
