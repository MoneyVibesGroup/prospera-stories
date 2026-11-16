# STORY-948 : la naissance d'une organisation ; l'identité de la Reprise

Status: review

**Complexité :** moyenne (deux dépôts, une route neuve, un jeton neuf, un registre)

**Épic :** EPIC-146 (deux espaces : essayer, puis mettre en service), EPIC-264 (auth pour le moteur)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service`, `MoneyVibesGroup/prospera-auth-service`
**Plage :** groupe B, n° 8 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

La spine du moteur (AD-15, AD-42) fait naître une organisation sur un **ordre de la console** :

1. la partie A de chaque espace appelle la route interne d'`auth-service` (STORY-938), sous l'identité de service du
   moteur et avec un identifiant imposé ;
2. `auth-service` publie `identity.org.created` ;
3. la partie A pose le module `instance` (chemin 0).

Trois écarts de STORY-936 attendaient cette naissance :

- **D-936-2** : la route de l'état publié ne rend jamais 404 `ORGANISATION_INCONNUE`, faute de registre des
  organisations ;
- **D-936-3** : un jeton de service n'est pas lu, donc seuls les membres lisent la route. Or le moteur, la Reprise et
  Connecteurs la lisent sous leur identité de service, limitée à l'organisation (contrat C2, spine de la Reprise
  AD-27) ;
- **l'identité de la Reprise** : la Reprise appelle les cibles « sous son identité de service, émise par
  l'`auth-service` de son espace » (AD-10). Aucun service n'émettait encore ce jeton.

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 8)

| Exigence | Fait |
|---|---|
| `POST /api/instance/v1/naissances` idempotent | oui : idempotent sur `organisationId`. Un ordre rejoué reprend à l'étape qui manque, ou rend la naissance telle quelle (200) |
| 404 `ORGANISATION_INCONNUE` (fin de D-936-2) | oui : il vient après le 403, pour qu'un jeton d'une autre organisation n'apprenne rien |
| Jeton de service lu (fin de D-936-3) | oui : `MOTEUR`, `REPRISE` et `CONNECTEURS` lisent l'état publié de leur organisation ; partout ailleurs, 403 `IDENTITE_DE_SERVICE_REFUSEE` |
| Droits `reprise:*` | **en partie** (D-948-4). La règle « réservé au DG » couvre `reprise:lot:valider`. Les six codes entrent au catalogue de tenant d'auth avec STORY-949 : la borne du jeton l'interdit avant |

## Ce qui a été livré

### `auth-service` (auth #…)

1. **`POST /api/v1/interne/jetons-de-service`** : un jeton de service limité à une organisation.
   - L'identité s'authentifie par **son** secret : `MOTEUR_JETON_SERVICE`, `REPRISE_JETON_SERVICE` ou
     `CONNECTEURS_JETON_SERVICE`, 32 caractères au moins.
   - Le secret **désigne** l'identité : la demande ne la déclare pas, elle ne peut donc pas en usurper une autre.
   - Les empreintes sont comparées en temps constant, toutes, sans sortie anticipée.
   - Corps : `{ organisationId }`.
   - Réponse 200 : `{ jeton, identite, organisationId, expireDans }`.
   - Refus : 404 `ORGANISATION_INCONNUE` si l'organisation n'existe pas dans cet espace ; 401
     `IDENTITE_DE_SERVICE_REQUISE` si le secret n'est pas reconnu.
2. **Le jeton** est signé RS256 par la clé active et vérifiable par le même JWKS. Il porte :
   - `sub: service:<identité>`, `identite`, `organisationId` ;
   - `roles: []`, `perms: []`, `emailVerified: false`, et **pas** de claim `org` ;
   - une vie de 300 s (`JETON_DE_SERVICE_DUREE_S`, de 60 à 3 600).
3. **La stratégie JWT d'auth-service** refuse un jeton de service : 401 `IDENTITE_DE_SERVICE_REFUSEE`.
4. **Les droits réservés au DG** (`DROITS_RESERVES_AU_DG`) :
   - `instance:consentement:donner`, refusé par `CONSENTEMENT_RESERVE_AU_DG` (inchangé) ;
   - `reprise:lot:valider`, refusé par `VALIDATION_DE_REPRISE_RESERVEE_AU_DG` (PRD Reprise FR-13).

### `platform-catalog-service` (catalogue #…)

1. **`POST /api/v1/naissances`** (public : `/api/instance/v1/naissances`). Contrat **nouveau** :
   `contrat/naissance.openapi.json`.
   - **Corps** : `{ organisationId, nom, vertical, pays? }`.
   - **Droit** : de plateforme, `entitlement:grant` (D-948-1).
   - **Étapes**, collection `naissances`, `_id` = `<espace>:<organisationId>` :
     - `ORGANISATION` : la route interne d'auth, sous `MOTEUR_JETON_SERVICE` (`NAISSANCE_AUTH_URL`) ;
     - `INSTANCE` : la ligne `installations` du module `instance` (`INSTALLE`, plan `naissance:<id>`) et son état publié
       émis, dans une transaction.

     Chaque étape est horodatée à l'heure de référence.
   - **Réponses** :
     - 201 : née par cet ordre ;
     - 200 : elle existait ;
     - 409 `NAISSANCE_DIVERGENTE` (`champs`) : même identifiant, autre nom, vertical ou pays ;
     - 422 `NAISSANCE_REFUSEE` (`cause`, ex. `VERTICAL_INCONNU`) : l'ordre ne laisse aucune trace ;
     - 503 `AUTH_INJOIGNABLE` (`cause`) ou `HORLOGE_INDISPONIBLE` : la naissance reste `EN_COURS`, et le même ordre
       la reprend.
2. **`GET /api/v1/naissances/{organisationId}`** (`org:read`) : la naissance, ou 404 `NAISSANCE_INCONNUE`.
3. **Le registre des organisations de l'espace** (collection `organisations_connues`). Il est nourri :
   - par la naissance (`NAISSANCE`) ;
   - par le consommateur de `identity.org.created` / `.updated`, qui lit désormais `origine` (`MOTEUR`, sinon
     `INSCRIPTION`).

   Une organisation est **connue** si elle est au registre, ou si l'espace tient déjà sur elle un droit, une
   installation ou une offre (D-948-2).
4. **L'état publié** :
   - **404 `ORGANISATION_INCONNUE`**, après le 403 ;
   - **les identités de service lisent la route** :
     - le décorateur `@AdmetIdentitesDeService('MOTEUR', 'REPRISE', 'CONNECTEURS')` les admet ;
     - la stratégie projette le jeton en `{ identite, organisationId }`, sans tenant, rôle, droit ni e-mail vérifié ;
     - `EmailVerifiedGuard` refuse une identité de service partout ailleurs (403 `IDENTITE_DE_SERVICE_REFUSEE`),
       `@AllowUnverified()` compris ;
     - la réponse garde la forme figée : `utilisateur.id` = `service:<identité>`, `droitsEffectifs` vide, ni
       administrateur ni DG.
5. **Filtre d'erreurs** : `cause` (chaîne) et `champs` (liste de chaînes) entrent à la liste blanche.

## Preuves

- **Node 24**, étage `verification`, construit depuis un export `git archive` :
  - catalogue : **91 suites, 1 331/1 331**, `tsc` et build verts ;
  - auth : **95 suites, 1 302/1 302**, `tsc` et build verts.
- **Lint** des fichiers touchés : vert dans les deux dépôts.
- **Pile `grp-b-948`** : auth et catalogue sur les images de la branche, MongoDB 8 en jeu de répliques, Kafka,
  Redis ; sans MinIO, introuvable, comme en 942. Les deux services démarrent `healthy`. La preuve de bout en bout
  (`preuve.mjs`) compte **27 vérifications sur 27** :
  - **Avant la naissance** : aucun jeton de service pour une organisation inconnue d'auth (404
    `ORGANISATION_INCONNUE`).
  - **`POST /naissances`** : 201, `NEE`, deux étapes `FAITE`.
    - Dans auth : l'organisation existe sous l'identifiant imposé, sans fondateur.
    - Sur le fil : `identity.org.created` porte `origine: MOTEUR`, sans `createdByUserId`.
    - Dans le catalogue : `installations` `REEL:<org>:instance` est `INSTALLE` (plan `naissance:<org>`),
      `etat-publie.changed.reel` est émis (instance `EN_SERVICE`), et l'organisation est au registre.
  - **Rejeu** :
    - même ordre : 200, la même naissance, une seule organisation dans auth ;
    - autre nom : 409 `NAISSANCE_DIVERGENTE`, `champs: ["nom"]` ;
    - vertical inconnu : 422 `NAISSANCE_REFUSEE`, `cause: VERTICAL_INCONNU`, aucune trace.
  - **Jetons de service** : `MOTEUR`, `REPRISE` et `CONNECTEURS` obtiennent leur jeton et lisent l'état publié
    (200, `utilisateur.id = service:<identité>`, aucun droit effectif).
  - **Une autre organisation** :
    - son chemin, lu avec le jeton de la première : 403 `ORGANISATION_HORS_JETON` ;
    - née par la route interne d'auth seule, elle est **connue par le fil** (200) ;
    - effacée du registre et sans droit : 404 `ORGANISATION_INCONNUE`.
  - **Ce que le jeton de service n'ouvre pas** :
    - `GET /offres` et `POST /naissances` du catalogue : 403 `IDENTITE_DE_SERVICE_REFUSEE` ;
    - `GET /users/me` d'auth : 401 ;
    - un secret inconnu : 401 `IDENTITE_DE_SERVICE_REQUISE` ;
    - un jeton d'opérateur sur la route d'émission : 401.
  - **Auth arrêté** (`docker stop`) : 503 `AUTH_INJOIGNABLE`, la naissance reste `EN_COURS`. Auth relancé, le même
    ordre : 200, `NEE`.
- **Mutations**, chacune rougit sur une assertion :
  - le 404 retiré ;
  - une identité de service limitée au `tenantId` ;
  - une identité admise sur toute route ;
  - la divergence ignorée ;
  - auth rappelé à la reprise ;
  - les rôles du jeton de service repris ;
  - auth-service qui accepte un jeton de service ;
  - un jeton de service à e-mail vérifié ;
  - `reprise:lot:valider` hors de la liste du DG ;
  - un secret non comparé.

  Trois de ces mutations faisaient d'abord échouer la compilation, d'où leur réécriture pour qu'elles compilent.
- Pile descendue avec ses volumes (`down -v`), images retirées, verrou Docker rendu.

## Décisions

- **D-948-1 — L'ordre de naissance demande `entitlement:grant`**, comme l'offre et l'installation (D-944) : c'est le
  droit de l'équipe de déploiement. Un droit dédié viendra avec les écrans de la console (ticket pour D).
- **D-948-2 — « Connue » = au registre, ou un fait de l'espace la concerne** (droit, installation, offre). Sans le
  second chemin, une organisation née avant le registre, dont `identity.org.created` a quitté la rétention de Kafka,
  recevrait un 404 alors qu'elle est en service. Le 404 ne vaut donc que pour une organisation dont cet espace ne
  sait rien.
- **D-948-3 — `organisationId` est obligatoire dans l'ordre.** La console le choisit une fois et le donne aux deux
  espaces (FR-42). Le générer côté partie A rendrait un ordre rejoué capable de créer deux organisations.
- **D-948-4 — Les six `reprise:*` n'entrent pas encore au catalogue de tenant d'auth.** La borne du jeton
  (`borne-du-jeton.spec.ts`) exige que les deux catalogues tiennent dans un jeton : 17 + 24 + 6 = 47 > 44. Ils
  entrent avec STORY-949, quand les droits sortent du jeton (ADR « droits hors du jeton »). D'ici là :
  - ils sont déclarés dans le manifeste `reprise`, au catalogue depuis STORY-935 ;
  - la règle « réservé au DG » de `reprise:lot:valider` est posée et s'appliquera telle quelle.
- **D-948-5 — Le jeton de service n'a rien d'un utilisateur.** Pas de claim `org`, aucun rôle, aucun droit, et
  `emailVerified: false`. Un service qui ne connaît pas encore la claim `identite` le refuse donc par sa garde
  d'e-mail, au lieu de le prendre pour un opérateur de plateforme (`tenantId: null`). On ferme, on n'ouvre pas.
- **D-948-6 — Le secret désigne l'identité.** Une seule route d'émission pour les trois identités ; aucun champ
  « identité » dans la demande.
- **D-948-7 — La naissance est synchrone et rejouable**, sans exécuteur de fond. Elle compte deux étapes, et l'ordre
  de la console est le seul déclencheur ; un ordre rejoué reprend où la naissance s'était arrêtée.
- **D-948-8 — L'invitation n'est pas dans cette story.** La spine la place après le module `instance` ; l'invitation au
  réel part à la mise en service (STORY-951). Dans l'essai, la console invite par la route d'auth existante.

## Suite

- STORY-949 : les droits hors du jeton (étapes 1 et 2) ; les six `reprise:*` au catalogue de tenant.
- STORY-951 : essai ou réel, répétition générale et mise en service (l'invitation au réel).
- STORY-952 : l'essai prospect, qui naît par cette route dans l'espace d'essai.
