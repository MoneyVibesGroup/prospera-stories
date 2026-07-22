# STORY-126 : Sessions d'authentification — une par appareil, listables et révocables (remplace le `refreshTokenHash` unique)

**Epic :** EPIC-002 — Authentification & sécurité du compte (auth-service)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` § jetons & rafraîchissement
**Priorité :** **Must Have** ⚠️ (corrige un **défaut de conception en place**, pas seulement un manque de fonctionnalité)
**Story Points :** 8
**Statut :** done ✅
**Sprint :** 16 (avec le triptyque identité 123/124/125 — même service, même surface de test)
**Créée le :** 2026-07-22
**Clôturée le :** 2026-07-22
**Assigné à :** vivianMoneyVibesGroupes
**Révisée le :** 2026-07-22 (re-vérification sur `origin/dev` après le merge de 123/124/125 — voir *Progress Tracking*)
**Services :** `auth-service` (:3001)
**Couvre :** dette de conception + FR « sessions ouvertes » (origine : maquette FE-015, retour PO du 2026-07-22)

> **Le point dur en une phrase :** l'IdP stocke **un seul `refreshTokenHash`, scalaire, sur le document `User`**
> (`src/modules/users/schemas/user.schema.ts:91`). Il n'existe donc **aucune notion de session** — et
> **se connecter sur un second appareil invalide silencieusement le premier**. Ce n'est pas une
> fonctionnalité manquante : c'est un comportement déjà subi par tout utilisateur qui ouvre Prospera sur
> son téléphone après son ordinateur.

---

## User Story

En tant qu'**utilisateur de Prospera (cabinet ou plateforme)**,
je veux **rester connecté sur plusieurs appareils, voir lesquels sont ouverts et pouvoir en fermer un à distance**,
afin de **ne pas être déconnecté sans raison quand je change d'appareil, et de reprendre la main si je ne reconnais pas une connexion.**

---

## Description

### Contexte — vérifié dans le code sur `origin/dev`, pas supposé

`user.schema.ts:91` porte `@Prop() refreshTokenHash?: string;` — **un champ, une valeur**.
`auth.service.ts:249-257` compare le jeton présenté à cette unique empreinte, et
`auth.service.ts:323-326` (`issueSession`) l'**écrase** à chaque émission. Conséquences mesurables :

1. **Éviction silencieuse.** Le login écrase l'empreinte : l'appareil précédent voit son rafraîchissement
   refusé au prochain cycle, sans message, sans trace. L'utilisateur croit à un bug.
2. **Rien à lister.** Aucun agent utilisateur, aucune IP, aucune date de création n'est conservé ⇒ l'écran
   « Sessions ouvertes » de FE-015 n'a aucune donnée à afficher.
3. **Révocation tout-ou-rien.** `logout` efface l'empreinte ; on ne peut pas fermer *une* session
   (téléphone perdu) sans fermer *toutes* les autres.
4. **Angle mort de sécurité.** Une connexion depuis un lieu inhabituel est invisible, pour l'utilisateur
   comme pour le support.

### Ce que la story change

Le jeton de rafraîchissement cesse d'être un attribut de l'utilisateur pour devenir une **entité `Session`**
(une ligne par appareil connecté). `login` en crée une, `refresh` la fait vivre, `logout` en ferme une seule.

### Ce qu'elle ne fait pas

Pas de reconnaissance d'appareil (« nouvel appareil, confirmez par e-mail »), pas de 2FA, pas de scoring de
risque. Le drapeau « lieu inhabituel » de la maquette est **purement dérivé côté affichage** (IP différente
de la session courante) : aucune intelligence côté serveur ici.

---

## Les deux points durs (à lire avant de coder)

### ⚡ Point dur n°1 — « laquelle est la session courante ? » : il faut un claim `sid`

`GET /users/me/sessions` doit marquer `current: true` sur **une seule** entrée. Or l'appelant présente son
**access token**, et le payload actuel (`token.service.ts:56-74`) ne porte que `sub`/`org`/`roles`/`perms`/
`emailVerified` : **rien qui identifie la session**. Le `jti` du refresh (`token.service.ts:76`) ne convient
pas — il est régénéré à **chaque rotation**, donc il n'est pas une identité stable.

**Décision :** ajouter un claim **`sid`** (identifiant de session, = `_id` de la ligne `sessions`) dans
**l'access token ET le refresh token**, **stable pendant toute la vie de la session** (inchangé par la
rotation). `issueSession` reçoit un `sid` existant (cas `refresh`) ou en fait naître un (cas `login`).
Le claim est **strictement additif** : aucun service consommateur ne le lit, aucun n'est cassé (même
propriété que l'ajout de `perms` en STORY-103).

⚠️ Corollaire : `AuthenticatedUser` (`common/decorators/current-user.decorator.ts`) et `jwt.strategy.ts`
doivent propager `sid`, sinon le contrôleur ne peut ni marquer la session courante, ni la protéger d'une
auto-révocation mal cadrée.

### ⚡ Point dur n°2 — la révocation globale existe déjà à 4 endroits et doit suivre

Le champ n'est pas seulement lu par `auth.service` : **quatre parcours déjà mergés** révoquent aujourd'hui
en effaçant `refreshTokenHash`. Les laisser derrière serait une **régression de sécurité silencieuse**
(« j'ai changé mon mot de passe » sans que les autres appareils tombent). Ils sont **dans le périmètre** :

| Site | Fichier | Parcours | Comportement attendu après 126 |
|---|---|---|---|
| `changePassword` | `my-profile.service.ts:183` | STORY-123 | révoque **toutes** les sessions |
| `confirmEmailChange` | `my-profile.service.ts:323` | STORY-124 | révoque **toutes** les sessions |
| `applyPasswordReset` | `users.service.ts:293` | STORY-125 | révoque **toutes** les sessions |
| `softDelete` | `users.service.ts:371` | suppression de membre | révoque **toutes** les sessions |

> La version initiale de cette story renvoyait ces corrections « dans la foulée, si 126 arrive après ».
> 123/124/125 **sont mergées** (`19cd603`, `642b854`, `c8fd311`) : le report n'a plus lieu d'être, la
> conversion fait partie de la livraison.

**Détection de rejeu — déjà en place, à conserver.** `auth.service.ts:257` efface l'empreinte quand un
jeton présenté ne correspond pas (réutilisation d'un ancien refresh) et journalise un `warn`. Après 126,
ce comportement se **restreint à la session concernée** : on révoque **cette** session (`revokedReason:
'REJEU_DETECTE'`), pas le compte entier. La question « recommandé, à confirmer » de la v1 est donc
**tranchée par le code existant**.

---

## Scope

**Inclus**

- **Collection `sessions`** (Mongo, `@Schema({ collection: 'sessions' })`) : `userId`, `tokenHash`,
  `userAgent`, `ip`, `createdAt`, `lastUsedAt`, `expiresAt`, `revokedAt?`, `revokedReason?`.
  Index sur `userId`, index sur `tokenHash`, **TTL sur `expiresAt`**.
- **Claim `sid`** additif dans l'access token et le refresh token (point dur n°1), propagé par
  `jwt.strategy` jusqu'à `AuthenticatedUser`.
- **`login`** : crée une session, capte `User-Agent` et l'IP d'origine (voir Technical Notes — proxy).
- **`refresh`** : retrouve la session par empreinte, met à jour `lastUsedAt`, **rotation** de l'empreinte
  dans la même ligne (le `sid` ne change pas).
- **`logout`** : révoque **la session courante seulement**.
- **`GET /users/me/sessions`** : liste des sessions actives de l'appelant, la courante marquée
  (`current: true`), triées par `lastUsedAt` décroissant.
- **`DELETE /users/me/sessions/:id`** : révoque une session ciblée.
- **`DELETE /users/me/sessions`** : révoque **toutes sauf la courante**.
- **Conversion des 4 sites de révocation globale** (point dur n°2) de « effacer le champ » à
  « révoquer toutes les sessions de l'utilisateur ».
- **Migration** : les `refreshTokenHash` existants sont convertis en une session « héritée »
  (`userAgent: null`, `ip: null`) — personne n'est déconnecté par le déploiement.
- Retrait du champ `refreshTokenHash` du schéma `User` **après** migration.

**Hors périmètre**

- Reconnaissance d'appareil, 2FA, scoring de risque.
- Géolocalisation IP (ville/pays). L'UI affichera l'IP brute tant qu'aucune source n'est décidée — voir
  question ouverte.
- Révocation d'une session **par un administrateur** (surface console : à cadrer séparément).

---

## Acceptance Criteria

- **AC-01** — Un utilisateur connecté sur l'appareil A puis sur l'appareil B **reste connecté sur A** :
  après le login B, un `refresh` depuis A renvoie 200 (aujourd'hui : 401).
- **AC-02** — `GET /users/me/sessions` renvoie une entrée par appareil connecté, avec `userAgent`, `ip`,
  `createdAt`, `lastUsedAt`, et **exactement une** entrée `current: true`.
- **AC-03** — `DELETE /users/me/sessions/:id` sur la session de l'appareil B : le `refresh` depuis B renvoie
  **401**, celui depuis A reste **200**.
- **AC-04** — `DELETE /users/me/sessions` ferme toutes les autres et **conserve** la session appelante
  (un `refresh` depuis l'appelant renvoie 200 juste après).
- **AC-05** — Une session d'un **autre** utilisateur ne peut être ni lue ni révoquée : **404**
  (⚠️ **jamais 403** — règle anti-énumération du projet : on ne révèle pas l'existence de l'identifiant).
- **AC-06** — La rotation du jeton au `refresh` **ne crée pas** de nouvelle session : après 3
  rafraîchissements, le nombre de sessions est stable **et le `sid` est inchangé**.
- **AC-07** — Après migration, un utilisateur qui avait un `refreshTokenHash` valide **n'est pas déconnecté**
  et voit une session « héritée » dans la liste.
- **AC-08** — Un `logout` sur A laisse la session B active.
- **AC-09** — Les sessions expirées (TTL) disparaissent de la liste sans intervention.
- **AC-10** — `userAgent` est stocké **tronqué à 256 caractères** et jamais interprété comme du HTML par les
  consommateurs (l'UI l'affiche en texte).
- **AC-11** — **Révocation globale préservée** : `POST /users/me/password` (123), la confirmation de
  changement d'e-mail (124) et `POST /auth/reset-password` (125) ferment **toutes** les sessions — un
  `refresh` depuis A **et** depuis B renvoie 401 après chacun de ces trois parcours.
- **AC-12** — **Rejeu d'un ancien refresh** : présenter un jeton déjà tourné révoque **la session
  concernée** (401) et **laisse les autres sessions actives** (aujourd'hui : tout le compte tombe).
- **AC-13** — Aucune réponse d'API ni ligne de log ne contient `tokenHash` ni un jeton de rafraîchissement.

---

## Technical Notes

- **Ordre de déclaration des routes** (`users.controller.ts`) : `me/sessions` et `me/sessions/:id` sont des
  chemins à 2 et 3 segments — pas de collision avec `@Patch(':id')`/`@Delete(':id')` (1 segment). Les
  déclarer malgré tout **avant** les routes paramétrées, comme `me/email` (`users.controller.ts:207-218`) :
  c'est la convention en place et elle protège des futurs déplacements.
- **Aucun `@Roles`** sur les 3 nouvelles routes : ce sont des ressources personnelles, tout membre y accède
  (même raisonnement que `PATCH /users/me`, STORY-123).
- **IP derrière proxy** : en dev l'app tape le service en direct ; en production il y aura un ingress.
  Utiliser `X-Forwarded-For` **uniquement si** le proxy est de confiance (`app.set('trust proxy', …)`),
  sinon l'IP est falsifiable par le client. À trancher au déploiement, mais coder l'extraction dans un seul
  utilitaire testable.
- **Empreinte** : garder la primitive existante — `hashRefreshToken` (sha256, `token.service.ts:90`) et
  `compareRefreshHash` (comparaison à temps constant, `token.service.ts:109`). On **déplace** le champ, on
  ne change pas la primitive.
- **`expiresAt`** : aligné sur `JWT_REFRESH_TTL` (`configuration.ts:178`, défaut `7d`). Le TTL Mongo est un
  filet de nettoyage, **pas** le contrôle d'autorisation — la vérification d'expiration reste applicative.
- **Transaction** : `refresh` écrit **un seul document** (rotation + `lastUsedAt`) ⇒ pas de transaction.
  La révocation globale écrit N documents mais via **un seul `updateMany`** ⇒ atomique par opération, pas
  de transaction non plus. Ne pas en ajouter par réflexe.
- **Volumétrie** : une ligne par appareil et par utilisateur, TTL sur `expiresAt` ⇒ la collection reste petite.
- **Migration** : script idempotent (rejouable) — chaque `User` porteur d'un `refreshTokenHash` produit
  **au plus une** session héritée.

---

## Dependencies

- **Bloque** : **FE-021** (écran « Sessions ouvertes ») — sans cette story, l'écran n'a rien à afficher.
- **Absorbe** la mise à jour de STORY-123 / STORY-124 / STORY-125 (révocation globale, point dur n°2) —
  ces trois stories sont `done`, la conversion est **dans ce périmètre**, pas dans un suivi.
- **Aucun prérequis bloquant** : la story est autonome dans `auth-service`.
- **Aucun impact `expert-comptable`** : aucun événement Kafka n'est ajouté ni modifié, le read-model
  d'identité ne porte pas de session.

---

## Definition of Done

- Les 13 AC passent, dont **AC-01, AC-07, AC-11 et AC-12 vérifiés en docker sur stack neuve**
  (`down -v`) — l'éviction silencieuse ne se voit pas en test unitaire.
- **Mutation-test obligatoire sur AC-01** : rétablir volontairement l'écrasement du hash au login et
  vérifier que le test **vire au rouge**, puis restaurer. Un test multi-appareils écrit après coup passe au
  vert sans rien prouver.
- Migration jouée sur une base contenant des `refreshTokenHash` réels : `mongosh` avant/après, **aucun
  utilisateur déconnecté**, aucune session orpheline.
- Seuils projet tenus : lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts.
- OpenAPI à jour (les 3 routes + le DTO de session) — le frontend génère ses types depuis là.

---

## Question ouverte

**Géolocalisation IP (ville/pays)** : non tranchée. Aucune source décidée (base locale type MaxMind vs
service tiers — ce dernier ferait sortir l'IP d'un utilisateur hors de l'infra, à peser). En attendant,
l'API renvoie l'**IP brute** et l'UI l'affiche telle quelle.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — écart **trouvé en lisant `user.schema.ts` et `auth.service.ts` sur
  `origin/dev`** pendant la conception de la maquette FE-015 « Sessions ouvertes » demandée par le PO.
  Requalifiée en cours de route : la demande était « afficher les sessions », le constat est
  « **il n'y a pas de sessions, et la connexion multi-appareils est cassée** ».
- 2026-07-22 : **Révisée** (Scrum Master) après re-vérification sur `origin/dev` — 123/124/125 ayant été
  mergées entre-temps, trois écarts ont été corrigés dans le document :
  1. **Contradiction interne levée** : le *Scope* annonçait `403` sur la session d'autrui, l'AC-05 `404`.
     La règle anti-énumération du projet tranche : **404** partout.
  2. **Point dur n°1 ajouté** — rien dans le payload JWT actuel n'identifie une session
     (`sub`/`org`/`roles`/`perms`/`emailVerified` ; le `jti` du refresh change à chaque rotation) : sans
     claim **`sid`**, `current: true` d'AC-02 est **inimplémentable**. Manquait entièrement à la v1.
  3. **Point dur n°2 requalifié** — les 4 sites de révocation globale (123/124/125 + `softDelete`) passent
     de « dépendance croisée à traiter ensuite » à **dans le périmètre** : les trois stories sont mergées,
     et livrer 126 sans eux transformerait « j'ai changé mon mot de passe » en révocation partielle.
     Nouveaux **AC-11** (révocation globale préservée) et **AC-12** (rejeu = 1 session, pas le compte).

- 2026-07-22 : **Implémentée** (branche `MNV-126`, auth-service) — voir le détail ci-dessous.

### Implémentation

**Livré.** Module `sessions/` **feuille** (`SessionsModule` importé par Auth *et* Users : `AuthModule`
importe déjà `UsersModule`, loger les sessions dans l'un des deux aurait créé un cycle). Collection
`sessions` (index `userId`, `tokenHash`, `{userId, lastUsedAt:-1}`, **TTL sur `expiresAt`**). Claim `sid`
additif dans les deux jetons, propagé `jwt.strategy` → `AuthenticatedUser.sessionId`. `login`/`accept-invitation`
ouvrent une session, `refresh` la fait tourner **dans la même ligne**, `logout` ferme la sienne. 3 routes
`/users/me/sessions` sans `@Roles`. Utilitaire `extractClientOrigin` (un seul point testable).
`SessionsMigrationService` (`OnApplicationBootstrap`, `_id` **déterministe** dérivé de l'empreinte ⇒
idempotent et sûr en concurrence). Champ `refreshTokenHash` **retiré** du schéma `User`.

**⚠️ Un 5ᵉ site de révocation globale, non recensé par la story** : `user-management.service.ts:119`
(**suspension** d'un membre par un administrateur). La story en listait 4 ; le 5ᵉ a été trouvé en cherchant
les appelants réels. Le laisser derrière aurait laissé un membre suspendu connecté sur ses autres
appareils. Motif dédié `COMPTE_SUSPENDU`.

**Qualité.** lint 0 warning · build OK · **496 unitaires** (53 suites) + **123 e2e** (10 suites) verts ·
couverture **96.99 / 89.4 / 97.86 / 97** (seuils 90/65/90/90) — `sessions.service.ts`,
`sessions-migration.service.ts` et `client-origin.util.ts` à **100 %**.

### Mutation-tests — dont un qui a invalidé un de mes propres tests

| Mutation | Résultat |
|---|---|
| Le `login` referme les autres sessions (éviction d'avant 126) | ✅ **rouge** — exactement le test AC-01 |
| `revokeOwnedOrFail` lève `Forbidden` au lieu de `NotFound` | ✅ **rouge** — 2 tests unitaires |
| `changePassword` ne révoque plus | ✅ **rouge** — le test AC-11 |
| Inverser `DELETE me/sessions` et `DELETE me/sessions/:id` | ❌ **RESTÉ VERT** |

⚡ **La 4ᵉ mutation est le vrai enseignement.** Elle devait rougir : elle n'a rien cassé. Raison : mes routes
font 2 et 3 segments et `@Delete(':id')` en fait 1 — **elles ne peuvent pas collisionner**, quel que soit
l'ordre, contrairement à `@Patch('me')` vs `@Patch(':id')` (deux chemins d'UN segment, eux réellement en
concurrence). Deux de mes tests e2e étaient donc nommés « ordre des routes » alors qu'ils ne gardaient rien :
**ils ont été reformulés** pour dire ce qu'ils prouvent réellement (appariement du chemin, absence de
`@Roles`), et le commentaire du contrôleur qui affirmait que l'ordre « protège » ces routes a été corrigé.
Sans la mutation, ce faux filet serait passé pour une garantie.

Constat voisin, tracé dans le fichier : l'e2e ne peut pas prouver le choix *404 plutôt que 403* — son faux
service réimplémente ce choix. C'est l'unitaire (+ mutation) qui le garde.

### Vérification docker — stack NEUVE (`down -v`), 13/13 AC

Mongo `rs0` réinitialisé, auth-service sur le code de la branche (`Found 0 errors. Watching…`).

| AC | Preuve |
|---|---|
| **01** | login ORDINATEUR → login TÉLÉPHONE → `refresh` ORDINATEUR **200** (avant 126 : 401). 2 `sid` distincts, `_id` en base = `sid` du JWT |
| **02** | `GET /users/me/sessions` → 2 entrées, `userAgent`/`ip`/dates, **exactement une** `current: true` |
| **03** | `DELETE …/:idB` → 204 ; `refresh` B **401**, `refresh` A **200** ; motif `REVOQUEE_PAR_UTILISATEUR` |
| **04** | 3 actives → `DELETE /users/me/sessions` → **1** (la TABLETTE appelante), son refresh reste 200, l'autre 401 |
| **05** | **Deux utilisateurs réels** : l'appelant vise la session de la victime → **404** (jamais 403), session **intacte** (`revokedAt: null`), refresh victime toujours 200. Inconnue et identifiant mal formé → 404 aussi |
| **06** | après `refresh`, `sid` **inchangé** et nombre de sessions **stable** |
| **07** | jeton pré-126 reconstitué (empreinte remise dans l'ancien champ, session supprimée) → **401 avant** redémarrage, **200 après** ; log `1 session(s) héritée(s) reprise(s)` ; session `userAgent: null, ip: null` listée ; `users` avec `refreshTokenHash` : **0** |
| **08** | `logout` sur APPAREIL-F → F **401**, TABLETTE **200** ; motif `DECONNEXION` |
| **09** | `expiresAt` antidaté : la ligne **est encore en base** (démon TTL pas passé) mais disparaît de la liste et son refresh est **401** ⇒ **le filtre applicatif est le vrai contrôle**, le TTL n'est qu'un nettoyage |
| **10** | agent utilisateur de 900 caractères → **256** stockés |
| **11** | `POST /users/me/password` : 2 actives → **0**, les deux refresh 401. `POST /auth/reset-password` (jeton lu dans Mailhog) : 2 actives → **0**, motif `MOT_DE_PASSE_REINITIALISE`, login au nouveau mot de passe 200 |
| **12** | 3 sessions, rejeu d'un jeton déjà tourné → 401 et **3 → 2** : seule la session du rejeu tombe (`REJEU_DETECTE`), la TABLETTE se rafraîchit toujours. **Avant 126, tout le compte tombait** |
| **13** | `tokenHash`/`refreshToken` : **0 occurrence** dans les réponses d'API **et** dans les logs ; le `warn` de rejeu ne cite que `userId` et `sid` |

### Revue de sécurité — 2 constats, tous deux corrigés

Aucune vulnérabilité critique ou élevée. Deux constats de sévérité faible, tous deux des **affaiblissements
réels de contrôles existants** introduits par la story — donc corrigés, pas classés.

**1. Détection de rejeu inopérante pour un jeton pré-126** (CWE-613, A07). La révocation sur rejeu était
ciblée par le claim `sid` ; un jeton émis **avant** le déploiement n'en porte pas, et le code sortait alors
sans rien révoquer. Conséquence : pendant toute la fenêtre `JWT_REFRESH_TTL` suivant le déploiement, un
voleur de jeton pré-126 n'avait qu'à rafraîchir en premier — la victime encaissait un 401 **sans que la
session de l'attaquant tombe**, alors qu'avant 126 ce même 401 la tuait. La détection de réutilisation
exigée par `securite.md` était donc désactivée. → **Repli** sur le comportement d'avant 126 (révocation
globale) quand le `sid` est absent ; il s'éteint de lui-même avec le dernier jeton pré-126.

**2. Perte d'atomicité sur le changement et la réinitialisation de mot de passe** (CWE-362, A07). Avant, les
deux effets tenaient dans **un seul `updateOne`** (`$set` hash + `$unset` empreinte) — atomiques par
construction. La story les a séparés en deux écritures sur **deux collections**, sans transaction, alors que
`confirmEmailChange` en utilisait bien une : incohérence, et violation de `transactions-mongo.md`. Un échec
entre les deux laissait le mot de passe changé **et les sessions de l'attaquant actives** — l'inverse exact
du but du parcours — sans que la victime puisse réessayer (son « mot de passe actuel » avait changé, son
jeton de reset était purgé). → **Transaction** (patron du projet, abort gardé) autour des deux écritures,
`ClientSession` propagée à `revokeAllForUser`.

**Points explicitement audités sans constat** : le claim `sid` n'autorise jamais, il ne fait que *restreindre*
une révocation elle-même cadrée par `userId` (au pire un porteur ferme une de ses propres sessions) ·
IDOR impossible, `userId` est **dans le filtre Mongo** et non dans un contrôle post-lecture · 404/403
indiscernables · aucune injection NoSQL (DTO validés, `@Param` toujours `string`, `ObjectId.isValid` avant
conversion) · `rotate` filtre `revokedAt: null` ⇒ une révocation concurrente n'est pas écrasée · les 3
nouvelles routes sont derrière le throttler global · `_id` de session héritée = 96 bits de sha256 tronqué,
préimage infaisable et sans effet (tout est cadré par `userId`) · `X-Forwarded-For` non lu ⇒ aucune donnée
contrôlée par le client n'entre en base.

**Vérification docker des deux correctifs** (stack en cours) : changement de mot de passe → 2 sessions
fermées `MOT_DE_PASSE_CHANGE`, les deux refresh 401, login au nouveau mot de passe 200, aucune session
orpheline · rejeu **avec** `sid` → 3→2 (ciblé) · rejeu **sans** `sid` (jeton pré-126 forgé, signature
validée au préalable par un contrôle positif à 200) → **3→0** avec le log de repli.

⚠️ **Le hot-reload a menti.** La compilation incrémentale de `nest --watch` annonçait `Found 0 errors` alors
que le module en mémoire était encore l'ancien : le repli semblait ne pas fonctionner (3 sessions
intactes). Seul un `docker restart` complet a prouvé le correctif. À retenir pour toute vérification docker
d'un changement de logique : **redémarrer le conteneur, ne pas se fier au watcher**.

**Effort réel :** 8 points (conforme à l'estimation)

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
