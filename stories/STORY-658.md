# STORY-658 : Lever un seul blocage de throttle efface les échéances de tous les clients — 12 services, et la connexion à l'IdP en tête

Status: done

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

- [x] AC-1 — Chaque service fournit à `ThrottlerModule` un **stockage propre** (`ThrottlerStorage`,
      `increment(key, ttl, limit, blockDuration, throttlerName)`) dont les échéances sont tenues **par clé** : la levée
      du blocage d'une clé ne touche **jamais** le compteur d'une autre clé. Mêmes limites, même traceur IP
      (`IpThrottlerGuard`), même contrat HTTP (429, en-têtes `X-RateLimit-*`, `Retry-After`).
- [x] AC-2 — ⛔ **Test qui rougit sur le stockage de la bibliothèque** : deux clés ; la première est bloquée puis levée
      pendant que la seconde a des requêtes en vol ⇒ après la fenêtre, le compteur de la seconde est **revenu à zéro**.
      Le même test exécuté contre le stockage par défaut 6.5.0 **échoue** (mutation : remettre le stockage par défaut).
- [x] AC-3 — Pas de fuite mémoire : une clé sans requête depuis plus de sa fenêtre et de son blocage est **purgée** ;
      un test borne le nombre d'entrées après une rafale de clés distinctes.
- [x] AC-4 — Le stockage n'introduit aucun `setTimeout` par requête non libéré : l'arrêt de l'application
      (`onApplicationShutdown`) laisse la boucle d'événements vide (pas de handle ouvert qui retient jest ou le process).
- [x] AC-5 — Les **12** dépôts reçoivent le même stockage et le même test ; chaque dépôt passe ses portes DoD. Le code est
      identique d'un dépôt à l'autre (même empreinte), pour ne pas faire diverger les services.
- [x] AC-6 — **Vérification docker sur `auth-service`** : reproduire le scénario de l'IdP **avant** correctif (compteur
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

---

## Progress Tracking

### 2026-09-15 — ✅ done : 12 dépôts, 12 PR rebase-mergées sur `dev`, `auth-service` en tête

**Livraison.** `src/common/throttler/stockage-throttler-par-cle.ts` (`StockageThrottlerParCle`) et sa spec, **identiques
dans les 12 dépôts** (md5 `114d5043…` / `2aa15f86…`), fournis via `ThrottlerModule.forRootAsync({ storage })`. Échéances
tenues **par clé** dans une `Map`, **aucun minuteur** : une requête échue est retirée à la lecture suivante de sa clé, les
compteurs échus sont purgés au plus une fois par minute. Limites, garde IP et contrat HTTP inchangés ;
`notification-service` garde ses deux throttlers (IP + jeton). Hook `THROTTLE_PROPRE_DU_PROVISIONNEMENT` (D-504-R) mis à
jour dans `microfinance-service` : la moitié « stockage » est livrée, reste le comptage par utilisateur.

| Dépôt | PR | Dépôt | PR |
|---|---|---|---|
| **auth-service** | **#27** | expert-comptable | #7 |
| microfinance-service | #10 | balance-service | #106 |
| admin-panel | #27 | bilan-service | #124 |
| kyc-service | #20 | paiement-service | #65 |
| platform-catalog-service | #20 | notification-service | #58 |
| dossier-service | #29 | document-service (ocr) | #19 |

**Tests.** AC-2 scénario de l'IdP ; **AC-1 parité appel pour appel avec `ThrottlerStorageService`** (mêmes
enregistrements sur une clé seule — seul `timeToBlockExpire` d'une clé *non bloquée* diffère, champ que `ThrottlerGuard`
ne lit que sous blocage) ; AC-3 rafale de 1 000 clés ramenée à 1 ; AC-4 `jest.getTimerCount() === 0` et vidage à l'arrêt ;
ttl variable ; deux throttlers nommés sur la même clé.

**Mutations (dans chaque dépôt, par assertion).** Stockage de la bibliothèque (`as unknown as`, spec compilable) ⇒ le test
AC-2 rougit (victime à 3 au lieu de 1). Purge calée sur la dernière échéance ⇒ test ttl variable rouge.

**Revue de sécurité (⑦, opus) — aucune vulnérabilité ; le DoS est fermé.** Scénario de la fiche rejoué sur 20 min contre
les vraies classes : **12 refus injustifiés** pour la victime avec la bibliothèque, **0** avec ce stockage. Parité mesurée
sur 90 000 appels aléatoires : 0 divergence. La purge ne lève jamais un blocage avant terme ; clé composite non forgeable
(sha256 hexadécimal) ; mémoire mieux bornée qu'avant (la bibliothèque ne supprimait jamais une clé).

**Revue de code (⑥, opus) — constats traités.** ③ Purge sur `echeances.at(-1)` : fausse avec un ttl variable (tableau non
trié) ⇒ `Math.max(...echeances)` + test. ④ La mutation d'AC-2 décrite dans la spec ne compilait pas ⇒ commentaire corrigé
(double conversion).

⚠️ **Incident de livraison.** Le séparateur de clé `\u0000` avait été écrit comme **un octet NUL brut** : tout vert à
l'exécution, mais git traitait le fichier en **binaire** (diff « Bin », illisible en revue). Repéré après recopie dans
5 dépôts ; corrigé en v3 (séquence d'échappement, chaîne identique à l'exécution) par un commit de revue dédié partout, et
réaligné dans `document-service` où il avait été remplacé par une espace. Contrôle final : 0 octet NUL, même md5, 0 fichier
binaire dans les 24 diffs.

**AC-5 — portes.** Lint 0, build, unit et e2e verts dans les 12 dépôts, couverture au seuil dans 11. ⚠️ **Exception
`notification-service`** : seuil **functions** déjà manqué sur `origin/dev` (89,18 %), branche à 89,24 % — décision user
du 2026-09-15 : pousser et consigner la dette. `auth-service` : `password.service.spec.ts` avait expiré (bcrypt) sous une
charge machine de 470 ; **`test:cov` rejoué en session sur les deux branches : vert, seuils atteints**.

**AC-6 — vérification docker sur `auth-service` (appariement refait en session depuis les fichiers bruts).**
Route publique `POST /auth/forgot-password` (5 / 60 s) ; attaquant sur l'hôte, victime dans un conteneur (IP distincte) ;
adresse e-mail différente à chaque requête (auth-service limite aussi par e-mail dans Redis, 3 / h, qui survit au restart).

| Phase | Code servi | Victime après la levée du blocage de l'attaquant | 429 reçus par la victime |
|---|---|---|---|
| **AVANT** (`dev`) | `StockageThrottlerParCle` = 0 | `restant` **2** — ses deux requêtes précédentes ne sont jamais décomptées ; encore 2 après 7 min 31 s | **2**, levés par le **garde**, alors qu'elle était sous la limite |
| **APRÈS** (`MNV-658@fa9f1cd`), passage 1 | = 2 | `restant` **4** — compteur revenu | **0** |
| **APRÈS**, passage 2 | = 2 | `restant` **4** | **0** |
| non-régression `microfinance-service` (`origin/MNV-658`) | = 2 | limite globale 100, `Remaining` 99 → 94 | 0 erreur, 0 pile, 0 réponse 5xx depuis le restart |

Limites : un cycle de levée par passage ; limite globale non saturée ; premier essai AVANT non concluant (VM saturée,
latence de 10 à 20 s), conservé comme trace. Preuve brute : `scratchpad/verif-docker/` de la session (`v3-*`, `v4*`).

**Reste hors périmètre, à cadrer.** Throttle **par utilisateur ou par organisation**, placé après `JwtAuthGuard` (débloque
le throttle propre du provisionnement, D-504-R) · signaler le défaut en amont à `@nestjs/throttler`.
