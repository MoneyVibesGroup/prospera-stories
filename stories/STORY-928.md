# STORY-928 : Les routes d'import et d'effacement de la démonstration (C13), dans balance et bilan

Status: done

**Complexité :** moyenne à grande (deux services, une identité de service à brancher dans chacun, un plan d'effacement complet, une preuve Docker)

**Épic :** EPIC-147 (l'essai prospect), EPIC-160 (le contenu des jeux de démonstration)
**Dépôts :** `MoneyVibesGroup/prospera-balance-service` (PR **#156**, `dev` **`98078b0`**), `MoneyVibesGroup/prospera-bilan-service` (PR **#179**, `dev` **`1651d33`**) ; contrat annoncé avant la fusion (stories #614)
**Plage :** groupe A, n° 9 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Sources : STORY-953 (B, contrats
`import-c13-*@1`, `effacement-c13-*@1`, étiquette `contrats-instance-v1`), STORY-927 (le jeu `cabinet-demo-togo`, section
« Pour STORY-928 »), dette D-918-4 (balance et bilan servent leurs routes C13), modèle : STORY-1046 (D, les mêmes routes dans le LC
fictif de l'assurance).
**Suite :** STORY-929 (clôture : `cabinet-moteur` installe par `POST /installations`, recette croisée complète).

---

## Ce que le plan demande

« Les routes déclarées dans `routesInstance` répondent au corps de `contrats/instance/` ; effacement idempotent. » Les manifestes de
`balance` et de `bilan` déclarent déjà `routesInstance.import` et `routesInstance.effacement` (chemins sous `/api/v1/instance/<code>/{organisationId}/…`).
Rien n'était servi : c'est la dette D-918-4.

## Décisions (recommandations appliquées, contestables)

- **D-928-1 — Une identité de service dans balance et bilan, patron du catalogue (STORY-948) et de D (1046).** `JwtStrategy` lit les claims
  `identite` et `organisationId` d'un jeton de service ; `EmailVerifiedGuard` n'ouvre un jeton de service que sur une route marquée
  `@AdmetIdentitesDeService('MOTEUR')`, partout ailleurs 403 `IDENTITE_DE_SERVICE_REFUSEE` ; la route exige en plus l'identité `MOTEUR`
  (403 `IDENTITE_DE_SERVICE_REQUISE` pour un jeton d'utilisateur, même `TENANT_ADMIN` à e-mail vérifié) et `organisationId` du jeton = celui du chemin
  (403 `ORGANISATION_HORS_JETON`). Une identité inconnue, ou sans organisation : 401 `JETON_DE_SERVICE_INVALIDE`. Les routes sont hors des gardes métier
  (`BalanceAccessGuard`, `DossierScopeGuard`) : l'effacement doit passer quel que soit l'état publié, et il n'y a pas de dossier dans le chemin.
- **D-928-2 — La garde « jamais une organisation réelle ».** Les deux routes (import comme effacement) ne répondent **que dans un espace d'essai** :
  `INSTANCE_ESPACE=ESSAI` (la même variable que lit déjà le consommateur de l'état publié, STORY-912 : absente ou autre valeur ⇒ `REEL`). Dans un
  espace `REEL`, 403 `ESPACE_REEL_REFUSE`, avant toute lecture du corps et sans rien écrire. En plus : l'import ne sert que `source = JEU_DEMONSTRATION`
  (`DOSSIER_INSTALLATION` : 422 `SOURCE_NON_SERVIE`, c'est le dossier d'installation de la Reprise, hors de cette story) et l'effacement ne sert que
  le motif `FIN_ESSAI` (`FIN_CONTRAT` : 422 `MOTIF_NON_SERVI`, D-953-9 : l'effacement d'un contrat n'est pas servi). Trois verrous indépendants
  contre l'effacement d'une organisation réelle par erreur : l'espace, le motif, l'identité du moteur limitée à l'organisation du chemin.
- **D-928-3 — Le dossier de démonstration est matérialisé dans balance seul, faute de création appelable dans `dossier-service`.** Le jeu ne porte
  aucun identifiant de dossier (`dossierRef`, la clef du dossier dans le jeu). `dossier-service` n'a aucune création appelable par une identité
  de service (ses routes sont celles d'un membre du cabinet) et la story ne code pas dans `dossier-service`. Résolution retenue, la plus sûre :
  `dossierId` = les 12 premiers octets de `sha256("jeu-demonstration|<organisationId>|<dossierRef>")` (déterministe : même organisation et même
  `dossierRef` ⇒ même dossier ; aucun état à retenir, un rejeu retrouve le même), et l'import de `profil-societe` pose, pour ce dossier, **les trois
  projections que balance tient déjà d'un dossier** (`dossiers_dossier`, `axes_dossier` avec `SN`/`REEL`, plus le profil société). Le dossier n'existe
  donc que **dans balance** : ni dossier-service ni bilan ne le connaissent. Conséquence nommée au ticket
  `TICKET-BACKEND-dossier-de-demonstration-sans-creation-par-le-moteur` : tant que `dossier-service` ne crée pas le dossier de démonstration (et ne
  publie pas `dossier.created`), la console ne le liste pas et bilan ne peut pas bâtir ses états depuis lui (la validation de la balance livrera
  `balance.created` à un bilan qui ne connaît pas le dossier). C'est la dette à solder avant que la démonstration montre un bilan.
- **D-928-4 — Import de `balance`.** Chaque enregistrement est **une balance entière** (D-927-3) : `dossierRef` résolu comme ci-dessus (le profil doit
  avoir été importé avant : sinon 422 `DOSSIER_DE_DEMONSTRATION_INCONNU`), `orgId` posé par la route, puis la balance passe par
  `BalanceService.submitInSession` (**le seul chemin de soumission du hub** : mêmes contrôles que l'ingestion, que l'import Sage et que les cahiers :
  équilibre, comptes au plan du référentiel du dossier, checksum, devise cohérente), à l'état `BROUILLON`, avec l'`auteur` `SERVICE`/`moteur`. Elle
  n'emprunte pas l'autorisation de l'ingestion Kafka (KYC approuvé, entitlement actif) : c'est une route du moteur, pas un émetteur tiers. Un refus
  du validateur (checksum, déséquilibre, compte inconnu, référentiel non résolu) refuse le lot **en entier**, rien n'est écrit : 422 `BALANCE_REFUSEE`
  avec le code du validateur.
- **D-928-5 — Bilan n'a rien à importer (D-927-1).** La route `import` de bilan est servie (le manifeste la déclare, le moteur la nomme) mais n'a **aucun
  objet** : tout `objet` reçoit 422 `OBJET_INCONNU` (le contrat l'admet, il est écrit dans la réponse 422 de `instance-c13.openapi.json`), un lot
  vide aussi, puisque l'objet est inconnu. Pas de `IMPORTE` sur zéro enregistrement : le contrat de réponse n'y gagne rien et un « importé » qui n'a rien
  fait est un faux. Le jeu ne passe jamais par cette route (il n'a pas de part `bilan`).
- **D-928-6 — Idempotence.** Un registre propre au service (`instance_c13_imports`, clef unique `(organisationId, idempotence)`) : un lot déjà joué rend
  `DEJA_IMPORTE` avec le même décompte, **sans rien réécrire**. Le lot et l'enregistrement du registre partagent une transaction (un rejeu concurrent
  perd sur l'index unique et rend `DEJA_IMPORTE`). Effacement : `effacements_c13` (une ligne par organisation : date, décompte, rien de personnel) ;
  `EFFACE` s'il y avait quelque chose à effacer ou si c'est le premier ordre, `DEJA_EFFACE` quand il n'y avait plus rien et qu'un effacement
  est déjà inscrit. Si des données sont revenues entre deux ordres (réimport), le nouvel ordre les efface (`EFFACE`) : on ne ment jamais par un
  `DEJA_EFFACE` sur des données présentes. `effaceLe` est l'heure de référence de la demande (`demandeLe`, AD-6), reportée telle quelle au rejeu.
- **D-928-7 — L'effacement efface TOUT, par un plan nommé et gardé par un test d'inventaire.** `plan-d-effacement.ts` liste chaque collection qui garde une
  donnée de l'organisation et son champ d'organisation (`orgId`, `organizationId`, `tenantId`, `partitionKey` pour l'outbox). Les identifiants sont
  cherchés sous leurs **deux formes** (ObjectId et chaîne : `@Prop({ type: Types.ObjectId })` range parfois en `Mixed`, piège 1.9). Un test lit tous les
  `*.schema.ts` du service et rougit si une collection à champ d'organisation n'est ni dans le plan ni dans la liste des exclusions justifiées : une
  collection ajoutée demain ne s'oublie pas. Inventaires ci-dessous.
- **D-928-8 — Les journaux ne sont pas pseudonymisés, ils sont effacés.** Le contrat dit « pseudonymise ses journaux (AD-12) » ; `instance.journal@1` n'existe
  pas encore, et `audit_events` de bilan est un journal propre à l'organisation d'essai : dans un espace d'essai effacé, le garder pseudonymisé n'a aucune
  valeur. On l'efface avec le reste, et le registre des effacements ne garde que l'organisation, la date et le décompte.
- **D-928-9 — Les pièces ne sont pas à balance.** `lots_pieces_ocr` et `lignes_pre_proposees` référencent des pièces de `document-service` (C) ; les
  fichiers y restent. Aucune route d'effacement n'existe dans `document-service` : dette nommée au journal (D-928-9), à demander à C quand le jeu portera
  des pièces (celui-ci n'en porte aucune).

## Dépendance ajoutée (justification)

`ajv ^8.20.0` dans `package.json` et `package-lock.json` des deux services : valider chaque corps contre le schéma JSON de
`contrats/instance/` copié à l'octet (`src/modules/instance-c13/contrat/`, `ORIGINE.json` garde l'empreinte, `copie.invariant.spec.ts`
rougit sur une copie retouchée, `.gitattributes` : `-text`). Sans validateur, « le corps exact du contrat » serait une relecture à la
main. Ajv 8 est celui des schémas draft-07 de B et de D (assureur-fictif, STORY-1046). Effet sur le lock : npm replace `ajv` de premier
niveau (6, tiré par eslint et webpack) par la 8 et imbrique la 6 sous ses consommateurs (+95 / −162 lignes de lock, aucune autre
dépendance changée). Prouvé par `docker compose up` : l'image `runtime` démarre avec la 8, les routes sont mappées.

## Inventaires effacés

Le plan (`plan-d-effacement.ts`) nomme chaque collection et son champ d'organisation ; l'effacement cherche l'organisation sous ses
deux formes (ObjectId et chaîne). Le test d'inventaire lit les `*.schema.ts` réels (Mongoose) et rougit si une collection à champ
d'organisation n'est ni dans le plan ni exclue avec sa raison.

- **balance (40 collections)** : `instance_c13_imports` ; `balances`, `balance_ingestions`, `exercices_atelier`, `profils_import` ;
  cahiers (`lignes_recettes`, `lignes_depenses`, `categories_depenses`, `comptes_ventilation`, `surcharges_rattachement`,
  `lots_pieces_ocr`, `lignes_pre_proposees`) ; fiscal (`retraitements_fiscaux`, `deficits_reportables`, `acomptes_provisionnels`,
  `credits_impot`, `credits_tva_anterieurs`, `taxes_fiscales`, `tpu_parametrages`, `tpu_versements`, `scenarios_fiscaux`,
  `journal_dossiers_justification`) ; `immobilisations_mouvements`, `creances_dettes_devises` ; trésorerie et rapprochement
  (`comptes_tresorerie`, `imports_releve`, `lignes_releve`, `appariements`, `qualifications_ecart`) ; profil (`profils_societe`,
  `profils_societe_audit`, `propositions_profil`) ; `referentiels_epingles` ; copies de voisins (`dossiers_dossier`, `axes_dossier`,
  `exercices_dossier`, `etats_publies_balance`, `org_options_normatives`, `orgkycstatuses`, `orgbalanceentitlements`) ;
  `outbox_events` (clef de partition). Exclue avec sa raison : `instance_c13_effacements`.
- **bilan (22 collections)** : `instance_c13_imports` ; `jeux_etats`, `snapshots_liasse`, `jeux_hypotheses`, `versions_hypotheses`,
  `mapping_overrides`, `exercices` ; consolidation (`appariements_consolidation`, `ecritures_consolidation`, `etats_consolides`,
  `methodes_comptables`) ; `audit_events` (effacée, non pseudonymisée : D-928-8) ; copies de voisins (`balances_balance`,
  `dossiers_dossier`, `exercices_dossier`, `perimetres_arretes`, `tableaux_immobilisations`, `identity_memberships`,
  `etats_publies_bilan`, `org_options_normatives`, `orgkycstatuses`, `orgbilanentitlements`) ; `outbox_events`. **Plus une étape à
  part** : les copies d'identité (`identity_users`, nom et e-mail) des seuls utilisateurs dont l'organisation effacée était l'unique
  appartenance ; celui qui appartient à une autre organisation est gardé.

## Écarts avec les décisions de départ

- Un corps hors contrat rend **422 `SCHEMA_NON_CONFORME`** (comme le dit `instance-c13.openapi.json`), pas 400 ; 400 `ORGANISATION_INCOHERENTE`
  quand l'organisation du corps n'est pas celle du chemin ; 409 `IDEMPOTENCE_REUTILISEE` quand une clef sert pour un autre lot (empreinte du lot
  gardée au registre) : deux codes de plus que l'annonce, ajouts seuls.
- Une identité de service autre que le moteur (Reprise, Connecteurs) sur ces routes : 403 `IDENTITE_DE_SERVICE_REFUSEE` (garde d'e-mail, avant le
  contrôleur) ; 403 `IDENTITE_DE_SERVICE_REQUISE` pour un jeton d'utilisateur.
- Deux invariants existants ont été touchés, chacun par un ajout justifié : `lecture-profil-par-dossier.spec.ts` (balance : l'allowlist passe de 5 à 7
  fichiers, l'import écrit le profil toujours par dossier, le plan nomme la collection) et `portee-cabinet.invariant.spec.ts` (balance :
  `InstanceC13Controller` dans la liste justifiée) ; `dossier-scope.invariant.spec.ts` (bilan : 27 → 28 contrôleurs).

## Preuves

- **balance-service** (Node 25 du poste, 24 à l'image) : tsc propre ; lint propre sur les fichiers touchés ; jest complet 5 459 tests, 5 457 passés, 2 échecs et
  14 suites qui ne tournent pas, **identiques sur `origin/dev`** (pile de `stash`, mêmes 14 suites et mêmes 2 tests : `Cannot find module 'bindings'`
  sous Node 25 pour les 13 qui chargent le client Kafka, et chemins Windows de `devise-paquet.exhaustivite`). Neufs : 26 (contrat, plan, effaceur,
  démonstration) + 22 (service) + 6 (garde, stratégie) unitaires, **19 e2e** avec la chaîne de gardes réelle et un vrai JWKS RS256.
- **bilan-service** : tsc propre ; lint propre ; jest complet 11 749 tests, 7 en échec et 17 suites rouges dont 15 **identiques sur `origin/dev`**
  (les deux autres : `rendu-excel` rouge par délai sous charge, vert seul ; `dossier-scope.invariant`, dont le test « ApiParam » est rouge sur `dev` aussi,
  et dont le compte de contrôleurs, 27 → 28, est corrigé ici). Neufs : 35 unitaires et **19 e2e**.
- **Mutations**, rouges sur l'assertion : balance — `exigerEssai()` retiré de l'effacement (test « hors d'un espace d'essai : rien n'est effacé »),
  `balances` retirée du plan (inventaire « balances (orgId) » et `effaceur.spec`) ; bilan — `audit_events` retirée du plan (inventaire), l'effacement des
  identités sans test d'appartenance (test « garde celui qui en a une autre »).
- **Docker, une pile `grp-a` neuve** (verrou pris 05:11, rendu après `down -v`), images `runtime` reconstruites depuis les branches, `INSTANCE_ESPACE=ESSAI`,
  recette de la pile (`MOTEUR_JETON_SERVICE`), organisation de l'`auth-service` `68a1800000000000000001aa`, jeton de service du moteur obtenu par
  `POST /api/v1/interne/jetons-de-service`. Les deux services démarrent `healthy`, `InstanceC13Module dependencies initialized`, les quatre routes mappées.
  Script de preuve (hors dépôt) joué de bout en bout, **PREUVE VERTE, 29 contrôles** :
  - le jeu `cabinet-demo-togo` importé dans l'ordre : `profil-societe` `IMPORTE` (1), `balance` `IMPORTE` (2) ; rejeu des deux : `DEJA_IMPORTE` ; en base :
    2 balances `BROUILLON`, 1 profil société, le dossier et sa décision d'axes projetés, 2 lots au registre ;
  - refus : objet inconnu 422 `OBJET_INCONNU` ; bilan, tout objet, 422 `OBJET_INCONNU` (`objetsImportables: []`) ; corps hors contrat 422 ; sans jeton 401 ;
    jeton d'une autre organisation 403 `ORGANISATION_HORS_JETON` ; `FIN_CONTRAT` 422 `MOTIF_NON_SERVI` ;
  - effacement : balance `EFFACE` (10 documents), puis bilan `EFFACE` (6, dont un utilisateur et son appartenance) ; rejeu : `DEJA_EFFACE` avec la même
    date ; **contrôle en base de toutes les collections, tous champs d'organisation** : aucun document pour l'organisation dans `balance_service` ni dans
    `bilan_service` (seul le registre des effacements reste : organisation, date, décompte, clef) ; les documents témoins d'une autre organisation
    (balance, profil, outbox, jeux d'états) intacts ;
  - réimport après effacement : `IMPORTE` ; des données revenues effacées et dites : `EFFACE` (4), jamais `DEJA_EFFACE` ;
  - balance relancée **sans** `INSTANCE_ESPACE` : 403 `ESPACE_REEL_REFUSE`.
  `down -v` avec tous les `-f` : plus aucun conteneur ni volume `grp-a`.
- La balance importée est validée à l'état `BROUILLON` ; **sa validation et la réception par bilan ne sont pas jouées** (bilan ne connaît pas le dossier de
  démonstration : D-928-3, ticket `dossier-de-demonstration-sans-creation-par-le-moteur`).

## Pour STORY-929

- Les routes sont servies : `balance` et `bilan` répondent à `POST /api/v1/instance/<code>/{organisationId}/import` et `/effacement` aux corps de B.
  Les `verifications/…` et `sante`, `export`, `migrer` du manifeste **ne le sont toujours pas** (D-918-4 est soldée pour import et effacement seulement) : la
  recette `cabinet-moteur` qui installerait par `POST /installations` en a besoin pour les vérifications (`referentiel-resolu`, `paquet-fiscal-disponible`,
  `balances-equilibrees` ; `snapshots-intacts`, `consommateurs-actifs` pour bilan). À vérifier au rituel de 929 avant de promettre « plus de `PUT` ».
- Le jeton du moteur s'obtient par `POST /api/v1/interne/jetons-de-service` (auth-service, `Authorization: Bearer <MOTEUR_JETON_SERVICE>`, corps
  `{ organisationId }`), limité à l'organisation ; la recette pose déjà `MOTEUR_JETON_SERVICE` (`docker-compose.recette.yml`).
- **`INSTANCE_ESPACE=ESSAI` doit être posé sur balance et bilan** pour que ces routes répondent (le compose racine ne la passe à aucun des deux ; défaut `REEL`).
  Absente, le moteur reçoit 403 `ESPACE_REEL_REFUSE`.
- balance ne répond à l'import de `balance` que si l'organisation a une **habilitation de référentiel** (`orgbalanceentitlements`, projection d'`entitlement.changed`)
  : sinon 422 `BALANCE_REFUSEE` / `REFERENTIEL_NON_RESOLU`. Dans la preuve elle a été posée à la main (le catalogue ne l'avait pas publiée pour cette organisation) ;
  dans le parcours réel, c'est l'installation du module `balance` par le moteur qui la produit.
