# STORY-949 : droits hors du jeton, étapes 1 et 2

Status: done

**Complexité :** moyenne (une route, une version des droits sur chaque appartenance, un événement neuf, une double
lecture côté partie A)

**Épic :** EPIC-145 (la garde et l'état publié), EPIC-264 (`auth-service` pour le moteur)
**Dépôts :** `MoneyVibesGroup/prospera-auth-service`, `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 9 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3). Dépend de 942 et 948.
Attendue par **A-919** (étape 3, côté fiscal).
**Décision d'architecture :** `architecture/decisions/ADR-droits-hors-du-jeton-2026-11-15.md`, mise en œuvre étapes 1
et 2 ; l'étape 3 est A-919 et les gardes des autres modules, l'étape 4 le retrait de `perms[]`.

---

## Pourquoi

Le jeton porte les droits de tenant de l'appelant (`perms[]`), bornés à 44 par STORY-365. Les manifestes déclarent 347
droits ; un DG à plusieurs modules en aurait 60 à 100. L'ADR décide que le jeton porte l'identité et une **version des
droits** (`dv`), et que les droits se **lisent** chez `auth-service`, en cache, invalidé par un événement. Ses deux
premières étapes : la route, `dv` et l'événement dans `auth-service` (1), puis la partie A qui compose
`droitsEffectifs` avec la résolution, en double lecture contre `perms[]` (2).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 9)

| Exigence | Fait |
|---|---|
| `GET /moi/droits` | `GET /api/v1/moi/droits?organisationId=…` : droits de tenant effectifs, droits plateforme à part, `roleMetier`, `dv` ; contrat `auth-service/contrat/moi-droits.openapi.json` |
| `dv` dans le jeton | claim additif `dv`, la version des droits de l'appartenance ; avancée dans la transaction de chaque changement |
| `identity.droits.changed@1` annoncé | publié par l'outbox (clé `organisationId`), schéma au registre en BACKWARD ; annoncé dans « ⚠ Contrats » avant la fusion |
| Double lecture contre `perms[]` | la partie A compare `droitsEffectifs` tirés de la résolution à ceux du jeton ; le jeton décide encore, l'écart est journalisé |

## Ce qui a été livré

### `auth-service` (étape 1)

1. **`ResolutionDesDroitsService`** (`src/modules/droits/`) : **la** règle des droits d'un membre, lue par l'émission
   du jeton ET par la route.
   - rôle métier effectif (`resoudreRoleMetier`, STORY-902/942) ;
   - droits de tenant dans la portée de l'organisation, surcharge DELTA comprise (STORY-167) ;
   - droits plateforme à part ;
   - `perms` = leur union, dans l'ordre du jeton depuis STORY-166 ;
   - `AuthService.issueSession` n'a plus sa copie de la règle : le jeton et la route ne peuvent pas diverger par le
     code.
2. **`GET /api/v1/moi/droits?organisationId=…`** (`MoiDroitsController`) : `{ organisationId, userId, dv, roleMetier,
   droits, droitsPlateforme }`. On ferme : 400 `ORGANISATION_REQUISE`, 403 `ORGANISATION_HORS_JETON`, 403
   `APPARTENANCE_INACTIVE` (absente, suspendue, compte supprimé) ; un jeton de service reste refusé (401, STORY-948).
   Répond à un e-mail non vérifié (D-949-5).
3. **La version des droits `dv`** sur chaque appartenance (`memberships.dv`) :
   - absente (appartenance antérieure) = 0 ; une appartenance neuve naît à 1 ;
   - pas de `default` Mongoose (il s'appliquerait à la lecture, et le premier `$inc` ne ferait pas avancer la version) ;
   - avancée par `$inc` dans la **même écriture** que le `$set` (rôle, rôle métier, statut) et dans la **même
     transaction** que tout ce qui change les droits de plusieurs membres : rôle personnalisé modifié, surcharge posée
     ou retirée, vertical reclassé (toute l'organisation, D-949-3), rôle plateforme changé (toutes ses appartenances).
4. **Le claim `dv`** dans le jeton d'accès (absent pour un utilisateur sans organisation) ; `perms[]` reste émis.
5. **`identity.droits.changed@1`** : `{ schemaVersion, eventId, occurredAt, userId, organisationId, dv, cause }`, un
   par membre dont la version avance, par l'outbox dans la transaction de la mutation ; schéma
   `contrat/schemas/identity.droits.changed.json` (fermé, sans les droits), au registre par `npm run schemas:*`.

### `platform-catalog-service` (étape 2)

1. **`DoubleLectureDesDroits`** (`src/droits-hors-du-jeton/`), patron de STORY-937. La lecture de l'état publié sert
   toujours `droitsEffectifs` calculés sur `perms[]` du jeton. Elle lance, sans l'attendre, la comparaison avec la
   résolution d'`auth-service`, par la **même** règle (`filtrerDroitsEffectifs`, extraite pour être partagée). Verdicts :
   - `IDENTIQUE` ;
   - `JETON_PLUS_ANCIEN` : le `dv` du jeton précède celui de la résolution, l'écart est attendu, journalisé en
     information ;
   - `ECART` : même version, droits différents ; journalisé en avertissement `DROITS_HORS_DU_JETON_ECART` avec les droits
     en trop et les droits absents ;
   - `INDISPONIBLE` : la résolution n'a pas répondu, rien ne change à la réponse ;
   - `IGNOREE` : identité de service, pas de jeton, double lecture éteinte.
2. **`CacheDesDroits`** : clé (membre, organisation), 60 s au plus, borné. Un jeton au `dv` plus récent force la
   relecture.
3. **`ConsommateurDesDroits`** : `identity.droits.changed@1` (groupe `platform-catalog-droits`, `fromBeginning: false`)
   retire l'entrée dont la version est dépassée ; un événement rejoué ou en retard ne retire rien.
4. **`ClientDesDroitsParHttp`** : `GET /moi/droits` avec le jeton de l'appelant. Une réponse mal formée, lente ou en
   panne est `INDISPONIBLE`, jamais « aucun droit ».
5. Le claim `dv` est projeté par la stratégie JWT ; réglages `DROITS_AUTH_URL` (défaut : `NAISSANCE_AUTH_URL`),
   `DROITS_DOUBLE_LECTURE`, `DROITS_CACHE_TTL_MS` (≤ 60 000), `DROITS_DELAI_MS`, `DROITS_CONSOMMATEUR_ACTIF`,
   `DROITS_GROUP_ID`.

## Livraison

- **auth #41** : `6bd5560`, `e29b457`, `a30e78f` sur `dev`.
- **catalogue #54** : `abc5716` sur `dev`, rebasé sur STORY-952 (conflits additifs dans l'état publié, les deux
  côtés gardés).
- Contrats annoncés avant la fusion : stories #552.

## Preuves

- **Node 24**, étage `verification`, images construites depuis un export `git archive` :
  - auth : **97 suites, 1 331/1 331**, `tsc` et build verts. Un test de forme (`auth.service.spec`, le sujet exact du
    jeton) ne tournait pas sur le poste (bcrypt natif) : il a rougi sous Node 24, `dv: 0` y est ajouté ;
  - catalogue : **94 suites, 1 395/1 395**, `tsc` et build verts.
- **Lint** des fichiers touchés : vert dans les deux dépôts.
- **Karapace** (pile `grp-b-949`) :
  - `schemas:enregistrer` pose 7 sujets, dont `identity.droits.changed-value` ; `schemas:compatibilite` : tous
    compatibles BACKWARD ;
  - `test:schemas` **16/16** : un ajout facultatif à `identity.droits.changed` passe, les droits ajoutés comme champ
    requis et `dv` changé en chaîne sont refusés.
- **Pile `grp-b-949`** : auth et catalogue sur les images de la branche, MongoDB 8 en jeu de répliques, Kafka,
  Redis, Karapace ; sans MinIO, introuvable, comme en 942. Les deux services démarrent `healthy`.
  La preuve de bout en bout (`preuve.mjs`) compte **24 vérifications sur 24** :
  - **Inscription d'un cabinet** :
    - le jeton porte `dv = 1` et garde `perms[]` ;
    - `/moi/droits` rend `CAB_ASSOCIE` (`PAR_DEFAUT`), `dv = 1`, et `droits ∪ droitsPlateforme` = `perms[]` ;
    - 403 `ORGANISATION_HORS_JETON`, 400 `ORGANISATION_REQUISE`, 401 sans jeton.
  - **Première lecture de l'état publié** : aucun écart journalisé.
  - **Un changement réel**, la surcharge de `CAB_ASSOCIE` qui gagne `instance:bilan:consulter` :
    - `memberships.dv` passe à 2, dans la transaction ;
    - `/moi/droits`, avec l'**ancien** jeton, rend `dv = 2` et le droit gagné.
  - **Sur le fil**, `identity.droits.changed` :
    - deux messages pour ce membre, `APPARTENANCE` (dv 1) puis `SURCHARGE` (dv 2) ;
    - clé de partition = `organisationId` ;
    - aucun droit transporté.
  - **Le cache invalidé par l'événement** :
    - l'ancien jeton (dv 1) fait relire la résolution : `DROITS_HORS_DU_JETON_JETON_PLUS_ANCIEN`, avec
      `absentsDuJeton: ["instance:bilan:consulter"]`, `dvDuJeton: 1`, `dvResolu: 2` ;
    - la réponse servie ne change pas : le jeton décide encore.
  - **Nouveau jeton** (dv 2) : le droit est servi, aucun écart.
  - **Un écart réel est vu** : la surcharge est retirée en base sans avancer `dv`, ce que le code n'écrit jamais.
    Le jeton suivant reste à dv 2 sans le droit ; le cache tient la résolution à dv 2 avec le droit :
    `DROITS_HORS_DU_JETON_ECART`, avec le droit nommé.
  - **Auth arrêté** : l'état publié reste servi (200).
- **Mutations** : chacune rougit sur une assertion. Trois d'entre elles faisaient d'abord échouer la compilation
  (paramètre ou import devenu inutile) ; elles ont été réécrites pour compiler.
  - auth, 6 mutations :
    - `dv` n'avance plus ;
    - `dv` absent du jeton ;
    - organisation non comparée au jeton ;
    - appartenance suspendue ouverte ;
    - mauvaise cause pour la surcharge ;
    - `dv` absent lu 1 ;
  - catalogue, 6 mutations :
    - `dv` du jeton ignoré par le cache ;
    - un événement en retard qui invalide ;
    - résolution non filtrée par les modules ouverts ;
    - jeton plus ancien lu comme un écart ;
    - comparaison sur les `perms` bruts ;
    - un 401 lu comme une panne.
- Pile descendue avec ses volumes (`down -v`), images retirées, verrou Docker rendu.
- ⚠ **Piège** : le DNS de la VM Docker ne résolvait plus `auth.docker.io`, et la ligne `# syntax=docker/dockerfile:1`
  des Dockerfile fait télécharger le frontal à chaque construction. Les images de preuve ont été construites depuis
  l'export, ligne retirée (le dépôt n'est pas modifié) ; les images de base étaient locales.

## Décisions

- **D-949-1 — Les six droits `reprise:*` n'entrent PAS encore au catalogue de tenant.** `perms[]` reste émis et borné
  (STORY-365, 44 droits) jusqu'à l'étape 4 de l'ADR ; les y mettre ferait refuser le jeton d'un DG (`JETON_HORS_BORNE`,
  41 ⇒ 47 droits, rapport de 948). Ils y entreront avec le retrait de `perms[]`, quand plus aucun service ne lira le
  jeton pour décider. La route `/moi/droits` est prête à les servir : elle n'a pas de borne.
- **D-949-2 — Les droits plateforme sont servis à part (`droitsPlateforme`).** L'ADR parle des droits de tenant ; mais
  le jeton les unit aux droits plateforme depuis STORY-166. Les servir à part rend la double lecture exacte
  (`droits ∪ droitsPlateforme = perms[]`) sans mélanger les deux portées. Un changement de rôle plateforme avance donc
  la version de toutes les appartenances de l'utilisateur.
- **D-949-3 — Ce qui change les droits de plusieurs membres avance la version de TOUTE l'organisation.** Rôle
  personnalisé modifié, surcharge d'un rôle du socle, vertical reclassé. Une invalidation de trop coûte une relecture ;
  une de moins sert des droits périmés jusqu'à 60 s. Un rôle du socle modifié par Prospera (semis) n'avance rien :
  c'est une livraison, couverte par le terme du cache.
- **D-949-4 — `identity.droits.changed@1` ne porte pas les droits.** Il invalide ; la vérité reste la route. Un droit
  sur le fil serait une seconde source à garder cohérente, et une donnée de plus à protéger. Le contrat est neuf : il
  écrit `organisationId`.
- **D-949-5 — `/moi/droits` répond à un e-mail non vérifié.** Résoudre des droits n'est pas un acte ; le jeton d'un tel
  membre porte déjà ses `perms[]`. Chaque service garde sa garde d'e-mail vérifié sur ses actes.
- **D-949-6 — La double lecture ne retarde pas l'état publié.** Elle part après le calcul et ne lève jamais ; le jeton
  décide jusqu'à la bascule de la partie A (une story à part, après une semaine de journaux sans `ECART`).

## Suite

- **A-919** (étape 3, côté fiscal) : la garde fiscale lit `/moi/droits` en double lecture contre `perms[]`, par le même
  patron (cache par `dv`, invalidation par `identity.droits.changed@1`). Voir le journal de B, « → A ».
- Les gardes de paiement et de notification (B), à la semaine de leur propriétaire ; puis le retrait de `perms[]`, de
  la borne de STORY-365, et l'entrée des droits `reprise:*` (D-949-1).
