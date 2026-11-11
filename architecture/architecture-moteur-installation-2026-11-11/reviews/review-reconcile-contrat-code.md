# Relecture : réconciliation de la spine du moteur avec le contrat, l'écosystème, le plan et le code

Date : 2026-11-11. Objet : `ARCHITECTURE-SPINE.md` (moteur d'installation, draft).
Gravité : **B** bloquante (un build de la partie A ou une recette casse, ou une règle de programme est violée), **H** haute (coût ou risque important, à trancher avant le 07/12), **M** moyenne, **L** basse.

Verdict : la spine tient bien sa partie B et C (agent, ancrage, signature), mais elle ignore presque tout l'existant de la partie A (`platform-catalog-service`, `auth-service`, `paiement-service`, compose, dépôts) et plusieurs exigences du contrat et du plan ; elle ne peut pas servir de base à la semaine 5 sans une passe de réconciliation.

Méthode : sources lues en entier (contrat C1 → C13, amendement du plan, spine de la coque) ou par sections ciblées (écosystème : P6 à P12, AD-P13 à P17, ownership map, contrats d'événements) ; code vérifié par lecture directe (`platform-catalog-service` `src/kafka`, `src/modules/entitlements`, `src/modules/catalog`, `package.json`, Dockerfile ; `docker-compose.yml` ; `auth-service` `auth.controller.ts`, `auth.service.ts`, `tenant-permission.enum.ts` ; `prospera-paiement-service` `domain/abonnement`, invariants).

---

## Partie 1. Ce que les sources exigent et qui n'a pas atterri, ou est contredit

### E-01 (B) Les gardes existantes lisent `entitlement.changed` et ferment à l'échéance ; le contrat veut un préavis de 30 jours ouvert

- **Sources :** contrat C2 amendé, « la garde ne lit jamais l'horloge de son conteneur : elle lit l'état publié » ; amendement §4, STORY-727 lot 4, « préavis de 30 jours (`preavisJusquau`) à la place de "échu ⇒ lecture seule immédiate" ». Code : `terme.ts` `statutEffectif()` rend `EXPIRED` dès que `echeanceLe <= maintenant` ; l'événement porte `terme` et `echeanceLe` (STORY-609) et son commentaire prévient « un consommateur qui teste `status !== REVOKED` ouvrira un module expiré ».
- **Spine :** AD-17 liste `entitlement.changed` (v2, `preavisJusquau`, `essai` additifs) ET `etat-publie.changed` comme deux sources lues par « gardes des modules ». Aucune phrase sur laquelle fait foi, sur ce que porte `echeanceLe` pendant `PREAVIS`, ni sur la bascule des gardes déjà livrées (paiement, microfinance, bilan, notification, balance).
- **Écart :** deux sources pour une même décision. Si `echeanceLe` reste la fin de la période payée, les gardes existantes fermeront le module le jour de l'échéance, au lieu de laisser 30 jours de préavis ; si on le décale, elles divergent de `terme.ts`.
- **Correction :** ajouter un AD « source unique de la garde » : l'état publié est la seule lecture de décision, `entitlement.changed` reste un fait d'octroi dont `echeanceLe` n'est plus lu pour fermer, et une période de double lecture avec un test de conformité joué par chaque consommateur existant (C5) est planifiée par service.

### E-02 (B) La spine ne dit rien de la suppression des chemins d'octroi existants ni du réamorçage

- **Sources :** contrat §0 et §1, « aucun autre chemin ne pose `ACTIVE` » ; amendement §4, « les droits présents sur `dev` sont des données de test, réamorcées à la mise en route du moteur » ; STORY-727 lots 2, 6, 7.
- **Code :** le catalogue a `octroi-par-abonnement`, `octroi-par-vertical`, `propagation-des-packs`, `PUT` d'entitlement, `rattrapage-packs` (migration), tous posant `ACTIVE`. Les recettes 631, 632, 649, 650/651, 728 reposent dessus.
- **Spine :** AD-8 écrit « elle ne crée jamais un droit autrement (FR-4) » sans nommer ce qui est retiré, ni la date, ni la migration.
- **Écart :** l'invariant le plus fort du contrat n'a pas de plan de bascule ; le jour où il s'applique, la recette croisée (prospera-recette, 5 recettes vertes) rougit.
- **Correction :** ajouter un AD ou une section « bascule » qui liste les 4 chemins retirés, le réamorçage unique, et la recette à rejouer à la fin de la partie A.

### E-03 (H) P10 « mono-repo » est fausse dans l'existant, et la spine l'utilise comme acquis

- **Sources :** écosystème P10, « un seul dépôt (services en sous-dossiers, `docker-compose` racine) : changements cross-service atomiques, une seule matrice CI ». Spine : arbre `MoneyVibes_Apps/` avec `packages/adaptateurs/` « bibliothèque du mono-dépôt, versionnée avec la plateforme » et `deploiement/`.
- **Code :** `MoneyVibes_Apps` n'est pas un dépôt git ; 19 sous-dossiers ont chacun leur `.git` (catalogue, auth, paiement, `prospera-stories`, `prospera-recette`…) ; `docker-compose.yml` racine n'est dans aucun dépôt ; `packages/` n'existe pas ; aucun `.github`, donc aucune CI (le README du contrat de notification le dit : « aucun ci.yml »).
- **Écart :** `packages/adaptateurs` et `deploiement/` n'ont aucun dépôt d'accueil ; « versionnée avec la plateforme » et le manifeste signé (empreintes d'images de tous les services) supposent un dépôt ou un pipeline de build unique qui n'existe pas ; cosign, schema registry et les tests de conformité « en CI » n'ont aucun endroit où tourner.
- **Correction :** décider dans la spine du dépôt de `deploiement/` et de `packages/adaptateurs` (nouveau dépôt de plateforme, ou dépôt frère comme `prospera-recette`) et de l'endroit où se construit et se signe la version de plateforme ; amender P10 en conséquence.

### E-04 (H) P9 : le schema registry est invoqué, rien ne le fournit

- **Sources :** écosystème P9 (« compatibilité BACKWARD imposée en CI »). Spine : convention « schema registry, compatibilité BACKWARD (P9) ».
- **Code :** aucun conteneur `schema-registry` au compose racine, aucune CI (README `prospera-notification-service/contracts`) ; la vérification existe en script local (`schemas:verifier`) ; aucun script dans `platform-catalog-service`.
- **Spine :** ni la Stack ni la structure ne portent de registry ; et sur site, aucun registry n'est joignable de toute façon (instance coupée).
- **Écart :** les nouveaux topics (`etat-publie.changed`, `instance.*`) n'ont aucun mécanisme de compatibilité, alors que C12 (lecteur tolérant, topics `@2`) en dépend ; la compatibilité ne peut se faire qu'au build, hors site.
- **Correction :** écrire que P9 est tenue par des schémas JSON versionnés dans le dépôt et un script de compatibilité joué au build (patron notification), sans registry en instance, et nommer qui l'exécute faute de CI.

### E-05 (H) P12 / AD-6 : BullMQ et Redis n'existent pas dans `platform-catalog-service`

- **Sources :** écosystème (Redis + BullMQ = jobs internes). Spine AD-6 : « chaque échéance est une tâche BullMQ à clé idempotente ».
- **Code :** `package.json` du catalogue sans `bullmq` ni `ioredis` ; `app.module.ts` : « Pas de Redis/BullMQ (aucun job interne) » ; `env.validation.ts` idem ; le compose du catalogue ne dépend pas de `redis`. L'outbox est un `setInterval` mono-instance sans verrou (`outbox-relay.service.ts`, « Phase 1 = mono-instance »). Paiement et auth ont déjà BullMQ (`bullmq` 6.3.x et 5.79.x).
- **Contradiction de principe :** `terme.ts` a choisi « statut LU, jamais écrit : le stocker demanderait une tâche planifiée qui bascule les statuts, et une tâche tombe, laissant un droit ouvert ». AD-6 réintroduit des tâches, sans dire que l'état publié doit rester un calcul de lecture sur `HorlogeDeReference` et que les tâches ne servent qu'à émettre `etat-publie.changed`.
- **Écart de périmètre :** AD-6 dit « aucun autre service ne calcule une échéance de contrat », or `paiement-service` fait tomber ses jalons (J-7 préavis, J+7 impayé, `echeancier-bullmq.adapter.ts`) sur sa propre horloge.
- **Correction :** préciser que l'état publié se calcule à la lecture (la tâche n'est qu'un déclencheur d'émission), borner « échéance de contrat » aux transitions d'état publié, et déclarer l'ajout de BullMQ/Redis au catalogue (dépendance compose, config, santé, relais d'outbox inclus s'il passe en file) comme une story de la semaine 5.

### E-06 (H) `auth-service` : aucune route ne crée une organisation avec un identifiant imposé

- **Sources :** amendement §4 (« création des organisations à la demande du moteur, dans chaque espace, avec le même identifiant », « avant la mise en service d'un module à tiret ») ; spine AD-15 : la partie A « demande à l'`auth-service` de son espace de créer l'organisation avec un `organisationId` donné ».
- **Code :** la seule création est `POST /auth/register` (publique, libre-service) : elle génère `new Types.ObjectId()`, crée aussi un utilisateur `TENANT_ADMIN` avec mot de passe, vérifie l'e-mail, exige un vertical « ouvert à l'inscription ». Pas de route admin ni de service-à-service pour créer une organisation ; seul `demo-seed` pose un `_id` imposé.
- **Écart :** le plan date le changement « avant le premier module à tiret », alors que la naissance de l'organisation dans l'essai est sur le chemin de la démo du 15/01 (SM-1 « en une action dans l'essai »). De plus, deux `auth-service` (un par espace) signifient deux bases d'utilisateurs, deux émetteurs de jetons, et la spine ne dit pas comment le membre naît dans l'autre espace ni avec quels identifiants.
- **Correction :** ajouter à la spine le contrat de naissance (route de service sous identité de service du moteur, `organisationId` imposé, idempotente sur cet identifiant, sans utilisateur), le déplacer en semaine 5 dans le plan, et trancher l'identité des utilisateurs entre essai et réel.

### E-07 (H) Le format de droit d'`auth-service` refuse déjà les codes à tiret, et le catalogue en contient quatre

- **Sources :** C7, amendement §4. Code : `TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/` : le tiret est admis dans l'objet, pas dans le segment module ; le seed du catalogue a `pi-spi`, `conformite-bceao`, `finance-transactions`, `support-client`.
- **Spine :** silencieuse. Elle ne lie pas C7 (`binds` n'a ni C1, ni C2, ni C7, ni C9, ni C11) et ne dit pas que `droitsEffectifs` (coque AD-6) est calculé par le moteur à partir des droits de tenant.
- **Correction :** lier C1, C2, C7, C9 et C11 dans `binds`, et inscrire la dépendance « format élargi dans `auth-service` » avec sa date.

### E-08 (H) L'état publié que la coque attend n'est ni défini ni attribué

- **Sources :** coque AD-5 (`instance.heureDeReference`, `sante`, `interrupteurs[].dateLimite`, `finLe`, `effacementLe`, `utilisateur.droitsEffectifs`, `instance.hebergement`) ; coque AD-15 (« la matrice des neuf états est un fichier JSON versionné publié par le moteur ») ; coque AD-23 (doublure générée depuis `contrat/etat-publie.openapi.json` et `contrat/matrice-etats.json`, éteinte au premier gate).
- **Spine :** AD-17 donne seulement le chemin `GET /api/instance/v1/etat-publie/{organisationId}`. Elle ne nomme ni le propriétaire des deux fichiers de contrat, ni leur versionnage, ni la date de la vraie route, ni le calcul de `droitsEffectifs` (qui force la partie A à lire les membres et rôles d'`auth-service`, avec surcharges DELTA, donc un read-model `identity.membership.changed` qu'elle n'a pas). Le chemin est celui vu du navigateur : côté service, le proxy réécrit en `/api/v1/…` (coque AD-8), et la spine ne le dit pas.
- **Correction :** un AD « l'état publié » : charge utile, propriétaire des deux fichiers, calcul des droits effectifs, route côté service, et date de la route réelle (au plus tard au premier gate de la coque).

### E-09 (H) Le plan ajuste cinq services existants ; la spine n'en cite aucun

- **Sources :** amendement §4 (STORY-727 lots 2, 4, 6, 7 ; STORY-280 ; STORY-281 ; STORY-365 ; `paiement-service` vente).
- **Code :** le consommateur `suspension-par-impaye` vit dans le **catalogue** (`suspension-par-impaye.service.ts`, topics `paiement.abonnement.impayee` / `regularise` / `echeance.encaissee`), et non dans le paiement : le plan écrit « STORY-280 (`paiement-service`, catalogue) » sans trancher ; `terme.ts` recopie `echeanceSuivante` du paiement « à l'identique ».
- **Spine :** aucune mention de ces topics comme entrées de la partie A (la source `contrat` d'A-2), ni de la fin de la suspension par impayé, ni du renommage `RAPPEL` (STORY-281, côté paiement et modèles de notification), ni de ce que `SUSPENDU` devient (sanction portée par la licence, AD-8).
- **Correction :** ajouter les topics `paiement.abonnement.*` au tableau AD-17 comme contrat consommé par la partie A, et lister les ajustements par service avec leur semaine.

### E-10 (H) Paiement → licence : aucun contrat nommé

- **Sources :** amendement §4, `paiement-service` « licence envoyée par e-mail à chaque paiement » ; spine AD-2 : `centrale-service` possède les « licences émises ».
- **Code :** `prospera-paiement-service` interdit d'appeler le catalogue (invariant `aucun-appel-au-catalogue`, décision C8 : « un jeton de service, un mTLS, une autorité de certification »). Le même raisonnement vaut pour la centrale.
- **Spine :** AD-17 n'a pas de ligne « paiement encaissé → centrale → licence → e-mail ». Qui envoie l'e-mail, qui émet la licence, sur quel topic ?
- **Correction :** ajouter le contrat par bus (la centrale consomme `paiement.abonnement.echeance.encaissee`, émet la licence, et demande l'envoi à `notification-service`), sans appel direct.

### E-11 (M) AD-P16 est citée à contre-emploi

- **Sources :** écosystème AD-P16 : routes de lecture plateforme, `orgId` en paramètre, lecture seule, une organisation à la fois, motif journalisé, pas d'export en masse. Spine AD-13 et AD-14 : « compte de service dédié (AD-P16) » pour `apprentissage-service`.
- **Écart :** l'apprentissage est une mise en commun multi-organisations, ce que AD-P16 interdit ; et rien n'est dit de la façon dont AD-P16 s'applique sur site (port entrant interdit, comptes Money Vibes fermés hors tunnel, AD-20) ni sur un distributeur hébergé (C11 point 5 : la donnée sur nos serveurs ne donne pas le droit de la mettre en commun).
- **Correction :** remplacer la référence par « compte de service du contrat C11 amendé », et écrire que les routes AD-P16 sont inaccessibles sur site hors tunnel ouvert et ne servent jamais l'apprentissage.

### E-12 (M) Écart interne sur l'agent et le socle

- **Sources :** C10 « le socle (Mongo, Kafka, auth, catalogue) n'a pas de profil et démarre toujours ». Spine AD-10 range « agent » dans le socle de chaque projet Compose, alors que AD-3 interdit à l'agent d'appartenir à un projet Compose d'espace.
- **Écart :** deux projets Compose chacun avec leur Kafka, et un agent unique qui doit produire `instance.licence.acceptee` et consommer `instance.journal` dans les deux. La spine ne dit pas s'il a deux clients Kafka ou un bus commun, ce qui violerait NFR-3.
- **Correction :** préciser que l'agent est dans un projet Compose propre (`<instance>-agent`) et raccordé à chaque Kafka d'espace par un listener dédié.

### E-13 (M) Noms : trois graphies de l'identifiant et une convention de topics non tenue

- **Sources et code :** la charge utile `entitlement.changed` dit `orgId`, les schémas Mongo `organizationId` (en chaîne), la spine `organisationId`. Convention de la spine « topics `domaine.objet.fait` en français, au passé » mais `entitlement.changed`, `etat-publie.changed`, `instance.bilan.changed` sont en anglais ou au présent ; les topics paiement existants sont français (`paiement.abonnement.impayee`).
- **Correction :** écrire dans la convention que l'existant fait foi (`orgId` dans les charges utiles, `organizationId` en base) et que `.changed` est toléré par précédent, ou renommer avant le premier consommateur.

### E-14 (M) Stack : Node 24 contre Node 20 partout

- **Spine :** Node 24.x LTS. **Code :** les Dockerfiles du catalogue et d'auth sont sur `node:20-slim`. Les nouveaux services ne suivraient donc pas « le socle ». **Correction :** aligner sur Node 20 ou ajouter la montée de Node au différé avec le reste du mono-dépôt.

### E-15 (M) Ordre de sacrifice : la spine range en « jamais » des éléments dégradables

- **Source :** amendement §3 (FR-16, FR-26/27, FR-28, FR-29, FR-30/31, FR-20, FR-21 dégradables ou sacrifiables). **Spine :** crée dès le départ `apprentissage-service` (partie C complète, FR-30/31 comprises), un registre signé des consentements, et la supervision complète, sans marquer ce qui est découpé en version minimale. Le contrat C11 et le §3 rendent le niveau 2 et le circuit du modèle commun sacrifiables, mais la spine impose un service séparé avec base et compte dédiés dès février.
- **Correction :** marquer dans la table des unités ce qui est livré en version minimale si février glisse (supervision réduite, apprentissage = réception des niveaux 0 et 1 seulement).

### E-16 (M) Infrastructure du compose de développement

- **Code :** aucun Traefik, aucun proxy ; `TRUSTED_PROXIES` vide par défaut dans tous les services, avec la consigne « prod : le seul CIDR de l'ingress » (STORY-133) ; chaque service publie son port sur l'hôte (3001 à 3008), ce qui contredit « aucune instance n'expose de port entrant » (AD-1) si le gabarit les recopie ; trois instances MongoDB aujourd'hui (`mongo`, `mongo-paiement`, `mongo-notification`, ces deux-là avec authentification et clé interne), donc jusqu'à six en deux espaces.
- **Mongo (point demandé) :** le compose racine **a** un jeu de réplicas à un nœud (`--replSet rs0`, initialisé par le healthcheck) pour `mongo`, et un `rs-paiement` / `rs-notification` pour les deux autres. L'exigence d'AD-16 est donc satisfaite sans changement ; ce qui manque est la même chose dans le gabarit `deploiement/instance`.
- **Écart de ports :** la coque réserve :8080 et :3200 ; aucun port n'est assigné à la centrale, à l'agent, à l'apprentissage, au registre d'images.
- **Correction :** ajouter au gabarit d'instance la liste « ne publie aucun port, `TRUSTED_PROXIES` = CIDR de Traefik, réplica initialisé », et une table de ports de dev.

### E-17 (M) La spine ne lie pas la moitié des clauses qu'elle prétend tenir

- `binds` omet C1 (manifeste, copie par `ModuleVersion`, garde de comparaison, codes `MANIFESTE_CYCLE`, `MODULE_DEPENDANCE_MANQUANTE`, `MODULE_REQUIS_PAR`, `AVEC_PERTE_INTERDIT_PLATEFORME`), C2 (matrice des neuf états), C7, C9, C11. Le `ModuleVersion` actuel (`moduleCode`, `version`, `status`, `deprecationDate`, `releasedAt`) n'a aucun champ de manifeste, et la partie A n'a aucun AD (état à neuf valeurs, dossier d'installation, bascule `EN_INSTALLATION`, module `instance`). Comme c'est le seul code livrable avant le 15/01, c'est l'absence la plus coûteuse en semaine 5.
- **Correction :** un AD « Partie A » (manifeste, machine à neuf états, `instance` né avec l'organisation, essai prospect) qui renvoie à chaque clause du contrat.

### E-18 (L) La doctrine du plan contredit un énoncé de la spine

- Spine, Deferred : « Montée à NestJS 12 et Mongoose 9, tout le mono-dépôt d'un coup » alors que `prospera-paiement-service` embarque déjà `@nestjs/bullmq ^12`. À vérifier avant de figer la Stack.

---

## Partie 2. Là où la spine contredit l'existant sans le dire (chiffrage des écarts)

| # | Existant | Spine | Coût de l'écart |
|---|---|---|---|
| 1 | Outbox à `setInterval`, mono-instance, sans verrou ; BullMQ absent du catalogue (E-05) | AD-6 suppose BullMQ + Redis | 1 story socle (config, compose, santé, tests) ; ~5 à 8 points |
| 2 | Mongo en réplica à un nœud déjà en place (E-16) | AD-16 l'exige | 0 dans le compose racine ; à répliquer dans le gabarit d'instance |
| 3 | Entitlement ACTIVE/SUSPENDED/REVOKED + `echeanceLe` fermant (E-01, E-02) | neuf états publiés, préavis ouvert | Migration des gardes dans au moins 5 services + double lecture ; le plus gros coût caché |
| 4 | Topics existants `entitlement.changed` (v2, `orgId`), `paiement.abonnement.*` (E-09, E-13) | `entitlement.changed` v2 additif, `etat-publie.changed` neuf | Additif possible, mais la sémantique de `echeanceLe` doit changer |
| 5 | `auth-service` : création d'organisation libre-service seulement (E-06) | AD-15 impose un identifiant | 1 route de service + tests ; 8 à 13 points, à placer en semaine 5, pas « avant le module à tiret » |
| 6 | Format de droit sans tiret dans le segment module (E-07) | modules à tiret | Regex + tests, petit, mais bloquant pour `pi-spi` et consorts |
| 7 | Paiement n'appelle pas le catalogue (invariant) (E-10) | licence par e-mail et dépendances dures dans la vente | Contrat par bus à créer ; la « résolution comme la console » côté vente exige une lecture, donc un read-model de manifestes dans le paiement |
| 8 | 19 dépôts, pas de dépôt racine, pas de CI (E-03, E-04) | mono-dépôt, `packages/`, cosign, registry | Décision d'organisation + pipeline de build et de signature à créer (non chiffré dans le plan) |
| 9 | Node 20 (E-14) | Node 24 | Montée de runtime ou alignement |
| 10 | Compose sans Traefik, ports publiés (E-16) | Traefik, aucun port entrant | Gabarit d'instance à écrire ; NFR-5 (pack distributeur en moins de 15 minutes) en dépend |

---

## Partie 3. Dépendances non planifiées au calendrier du plan (semaine 5 = 07/12)

1. **`auth-service` : route de naissance de l'organisation et format de droit.** Le plan la place « avant la mise en service d'un module à tiret » ; la partie A en a besoin dès la semaine 5 ou 6 pour la démo du 15/01 (E-06, E-07).
2. **Doublure de la coque contre vrai moteur.** Dev A construit la doublure en PRA-01 (semaine 3) depuis des fichiers de contrat que le moteur doit publier ; l'extinction « au premier gate » n'a pas de date côté moteur (E-08).
3. **Manifeste au nouveau format dès la semaine 1** : Dev A enregistre `reseau` avec ce format avant que la spine ne le fixe (11/11) et sans AD pour le schéma de manifeste ni la garde de comparaison (E-17).
4. **Trois services neufs plus deux (reprise, connecteurs).** Le contrat §4 compte ~13 points de socle par service ; `centrale-service`, `agent-instance`, `apprentissage-service` ajoutent ~39 points que l'amendement §5 (parties B et C à 7 à 8 et 3 à 4 semaines, rédigé avant la spine) n'a pas isolés ; l'écart de 7 à 10 semaines s'aggrave.
5. **Infrastructures sans propriétaire ni date :** registre d'images signées, cérémonie de la clé racine hors ligne et coffre, autorité de certification des certificats d'instance (mTLS, renouvelés à chaque contact), second hôte pour la centrale, TPM 2.0 physique et second support de 1 To chez l'assureur (approvisionnement avant février), pipeline de build/signature (E-03).
6. **Validation juridique** des clauses d'apprentissage avant le premier contrat (déjà au Deferred, mais le circuit FR-30/31 est un « jamais » partiel) ; **questions au PO du 13/11** non tranchées dont dépend la spine : Q3 du contrat (dépendance suspendue), classement de FR-42/43 et NFR-11, validation de C12/C13, voie de couverture de la charge (la spine suppose février entier).
7. **Recette croisée des deux modes d'hébergement** : exige le gabarit d'instance, Traefik, l'agent et la centrale ; au plus tôt après le 15/01, sans story identifiée dans le plan.

---

## Ce que la spine tient bien (pour mémoire)

Cohérente avec le contrat : agent sans port entrant (NFR-2), retour arrière par relance des empreintes précédentes (C12), journal chaîné, état de confiance hors sauvegarde, horloge à borne de 48 h, un seul émetteur de l'état publié (P8 pour la partie A), `instance` comme module du catalogue (C1), rejeu par contrat d'import (C13), `GET /heure` interne. La doublure AD-23 de la coque est compatible avec AD-17 à condition de E-08.
