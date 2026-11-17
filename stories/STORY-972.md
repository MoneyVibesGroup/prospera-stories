# STORY-972 : les demandes de D et de C — le jeu « Grossiste du Golfe » chez B, la comptabilité au catalogue

Status: in-progress

**Complexité :** moyenne (trois dépôts ; deux routes et une collection neuves dans auth ; une copie de manifestes et un
fichier de configuration dans le catalogue ; une ligne de README)

**Épic :** EPIC-226 (le jeu « Grossiste du Golfe », l'essai du prospect : FR-12, FR-21) et EPIC-111 (socle de la
comptabilité : « entitlement, gate »)
**Dépôts :** `MoneyVibesGroup/prospera-auth-service`, `prospera-platform-catalog-service`, `prospera-plateforme`
**Plage :** groupe B, plage réservée 930 → 979 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §8). Story
**neuve**, insérée avant STORY-969 par la session du groupe B (D-972-1, contestable).
**Dépend de :** STORY-1058 (D : le jeu, `identifiantDuJeu`, étiquette `jeu-grossiste-golfe-v1`) ; STORY-958 → 968 (le
manifeste `comptabilite`) ; STORY-945 (le PUT de la console passe par le moteur) ; STORY-938 (identité du moteur dans
auth).
**Débloque :** la preuve de la comptabilité en réel **sans doublure** de l'état publié (967, 971 la doublaient) ; la
connexion « en tant que » de l'essai (FR-21) ; le catalogue de l'essai qui sait où sont `commande` et `terrain`.
**Suivante :** STORY-969 (le lettrage).

**Sources lues :** journal de D (« → B (2026-11-17) : le jeu « Grossiste du Golfe » (STORY-1058) », points 1 à 4) ;
fiche STORY-1058 (D-1058-1 → 14, « Ce qui reste ») ; contrat `jeu-demonstration@1` (`prospera-plateforme/contrats/
instance/`) ; PRD distributeur FR-9 → FR-12, FR-21, UJ-1 → UJ-5, UJ-8 ; spine du distributeur (§ essai : « la connexion
« en tant que » un compte du jeu n'existe que dans l'essai ») ; spine du moteur AD-15, AD-38 (un `auth-service` par
espace) ; journal de C (« → B : recopier les manifestes amendés », « → B : les référentiels habilités dans l'état
publié ? ») ; journal de B (STORY-966 « ← C », 958, 967, 971 : le module au catalogue) ; fiches 945, 953, 971 ; code
d'auth (naissance, `issueSession`, attribution d'un rôle métier) et du catalogue (`PassageParLeMoteur`,
`VerificationsParHttp`, `manifestes:copier`).

**Comment les jeux du cabinet (A, `jeu-cabinet-v1`) et de l'assurance (D, `jeu-assurance-v1`) ont été servis côté
auth :** ils ne l'ont pas été. Auth n'a, avant 972, aucune notion de jeu, de compte de démonstration ni d'espace
(`git grep` sur `origin/dev`, `913bd92`). Ces deux jeux n'en ont pas besoin : le cabinet se joue avec le compte du
prospect, l'assurance contre la compagnie fictive. Le distributeur est le premier jeu à demander des comptes (FR-21).

---

## Pourquoi cette story, ici (décision de la session de groupe, contestable)

**D-972-1.** Trois demandes adressées à B sont ouvertes, et une demande passe avant la story suivante
(`REGLES-DES-GROUPES.md` §1.1) :

1. **D, STORY-1058** (obligatoire) : la ligne du README, `INSTALLATION_SERVICES` de l'essai, les comptes du jeu dans
   auth ; plus un point d'information (quatre modules qui déclarent des routes C13 qu'ils ne servent pas) ;
2. **C, relevée par STORY-966** : recopier au catalogue les manifestes amendés (`assurance`, `liaison-assureur`,
   `expertises`, `sinistres`) ;
3. **le module `comptabilite` au catalogue** (958, 967, 971) : sans lui, l'état publié du module est `NON_INSTALLE` et
   la garde refuse tout en réel. Les preuves de 967 et 971 doublaient l'état publié sur le fil.

Les points 2 et 3 sont la même PR du catalogue (une seule recopie). Une seule story, avant 969.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Le README de `prospera-plateforme` a la ligne `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/` → groupe D, étiquette `jeu-grossiste-golfe-v1` ; aucun fichier de D touché | diff |
| AC-2 | `copies.json` du catalogue est regénéré par `manifestes:copier` depuis `origin/main` de `prospera-stories` : 47 copies, dont `comptabilite` 0.1.0, et les manifestes amendés de C ; `manifestes:garde` verte | garde, specs |
| AC-3 | `INSTALLATION_SERVICES` de l'espace d'essai nomme `commande` (ventes, 3412) et `terrain` (terrain, 3413) : `.env.essai.example`, gardé par un test (chaque module nommé est au catalogue et déclare ses routes C13) | spec ; pile (le catalogue de l'essai le lit) |
| AC-4 | Le vrai catalogue installe la comptabilité pour une organisation du réel et publie `EN_SERVICE` sur `etat-publie.changed.reel` ; une route de la comptabilité répond 200 au vrai jeton d'un associé, **sans aucune doublure de l'état publié** | pile `grp-b` |
| AC-5 | Auth pose les comptes du jeu : la partie A de l'essai (identité du moteur) les crée sous `identifiantDuJeu(organisationId, objet, cle)` (`commercial`, `COM-nn` pour un agent), actifs, sans mot de passe (FR-12), membres avec leur rôle métier ; idempotent | unitaires ; pile |
| AC-6 | Un membre de l'organisation de l'essai se connecte « en tant que » un compte du jeu, en un geste, sans mot de passe ; le jeton reçu est celui du compte (son rôle, ses droits) ; un compte d'un autre essai, ou un vrai membre, est refusé | unitaires ; pile |
| AC-7 | Dans un espace réel, la pose et la connexion « en tant que » rendent 403 `ESPACE_REEL_REFUSE` avant toute lecture | unitaires ; pile |
| AC-8 | La décision sur le point (4) de D est écrite (D-972-6) | fiche |
| AC-9 | Node 24 (étage `verification`), lint des fichiers touchés, build, mutations rouges sur une assertion, `docker compose up` sain (auth : un module Nest neuf) | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-972-1 — L'insertion avant 969** (ci-dessus).
- **D-972-2 — La comptabilité entre au catalogue par sa copie, sans version neuve ; elle s'installe par le PUT de la
  console.** `manifestes:copier` lit `prospera-stories@51f4803` (le manifeste `comptabilite` 0.1.0 tel que 968 l'a
  laissé) : le semis la fait naître au démarrage, `ACTIVE`, avec ses quatre familles de référentiel. Sa vérification
  `referentiel-resolu` n'est pas encore servie par le service (manifeste : « à créer ») : par
  `PUT /catalog/entitlements/{org}/comptabilite`, la vérification sans adresse est **différée** (STORY-945) et le plan
  `CONSOLE_PUT` installe le module ; l'état publié passe `EN_SERVICE`. Par `POST /installations`, elle n'est jamais
  différée (FR-6) : la comptabilité y attend sa route de vérification, et ses routes C13 (remplaçante de B, voir « Ce
  qui reste »). C'est la voie que la recette de A emprunte déjà pour les modules qui ne servent pas leurs
  vérifications (STORY-929).
- **D-972-3 — Les manifestes amendés sont recopiés à leur version.** C a amendé `assurance`, `liaison-assureur`,
  `expertises` et `sinistres` sans changer leur version (1.0.0). Sur une base neuve, ils naissent amendés. Sur une base
  existante, le semis les nomme `divergentes` sans les réécrire (une version publiée ne change pas, STORY-935) : pour
  les republier là, C publie une version neuve de son manifeste (→ C, information). Même chose pour `commande`,
  `facturation` (D) et `paiement` (B, 965), recopiés en même temps.
- **D-972-4 — La configuration de la partie A de l'essai est un fichier versionné, gardé par un test.** Aucun
  déploiement de l'essai n'est versionné (le compose racine ne l'est pas ; la recette de A n'a volontairement pas
  `INSTALLATION_SERVICES`, STORY-929). `.env.essai.example` dit `INSTANCE_ESPACE=ESSAI` et
  `INSTALLATION_SERVICES=commande=http://ventes-service:3412,terrain=http://terrain-service:3413,…` ; les noms d'hôte
  sont ceux des services dans le compose de chaque dépôt (`ventes-service`, `terrain-service`,
  `assureur-fictif-service`, `balance-service`, `bilan-service`), les ports ceux des dépôts. `.gitignore` et
  `.dockerignore` le laissent passer. `src/config/espace-essai.spec.ts` exige que chaque module nommé soit au catalogue
  et déclare `routesInstance.import` et `.effacement` au chemin du contrat C13.
- **D-972-5 — Les comptes du jeu vivent dans auth, sous l'identifiant de leur objet du jeu.** Collection
  `comptes_du_jeu` (en ajout seul) : c'est elle qui dit qu'un utilisateur est un compte du jeu. `_id` =
  `identifiantDuJeu(organisationId, objet, cle)`, **copie à l'octet** de `src/socle/instance/identifiant-du-jeu.ts` de
  ventes (`origin/dev` `7f674ef`, identique dans terrain), avec le vecteur figé de ventes : le compte de Kodjo
  (`commercial`, `COM-01`) a le même identifiant que son commercial dans `terrain`. L'utilisateur naît `ACTIVE`, adresse
  vérifiée `<objet>.<cle>.<organisationId>@jeu-demonstration.invalid` (domaine réservé, RFC 2606 : aucun courrier ne
  part), **sans `passwordHash`** (FR-12 : aucun mot de passe nulle part ; la connexion par mot de passe lui est
  fermée) ; son appartenance est `TENANT_USER` avec son rôle métier, un rôle **du socle proposé au métier** de
  l'organisation (même règle que l'attribution, STORY-166 ; 422 `TENANT_ROLE_INCONNU`, `TENANT_ROLE_NON_PROPOSE`).
  `identity.user.registered@1` et `identity.membership.changed@1` partent dans la transaction (contrats inchangés),
  comme `identity.droits.changed@1` par l'attribution du rôle.
- **D-972-6 — Point (4) de D : le catalogue n'exclut pas ces modules d'un essai, il note le risque.** `facturation`,
  `approvisionnement`, `entrepot` et `conquete-objectifs` déclarent des routes C13 qu'ils ne servent pas. Le catalogue
  ne peut le savoir qu'en les appelant ; une liste de modules écrite dans son code contredirait « la liste est une
  donnée » (FR-19) et resterait fausse dès que D les servira. Ce qui protège : (1) `.env.essai.example` ne les nomme pas,
  et le test le garde ; (2) l'effacement d'un essai qui en aurait installé un reste `EN_COURS`, sans certificat, et la
  file le rejoue (`SERVICE_NON_CONFIGURE` au plan, D-953-4) : visible, jamais un faux « effacé ». **Recommandation à D** : ne pas mettre ces modules dans l'offre d'essai (le pack
  ou le plan de l'essai) tant que leurs routes C13 ne sont pas servies. Les deux parts du jeu (`commande`, `terrain`)
  servent les leurs.
- **D-972-7 — La connexion « en tant que » : qui, et quoi.** `POST /api/v1/essai/connexion-en-tant-que { compteId }`,
  au jeton d'un **membre actif de l'organisation du jeton** : le prospect, ou un compte du jeu sous lequel il est déjà
  connecté (FR-21 : « d'un compte du jeu à un autre »). La cible doit être un compte du jeu **de cette organisation** ;
  tout autre identifiant (un vrai membre, un compte d'un autre essai, un compte suspendu) rend 404
  `COMPTE_DU_JEU_INCONNU`, sans dire pourquoi. La session est ouverte par `AuthService.issueSession`, la même émission
  que la connexion : le jeton porte le rôle et les droits du compte, la portée de FR-6 s'applique telle quelle. Une
  ligne de journal du service dit qui s'est connecté en tant que qui ; **pas de ligne dans `admin_audit`** (une action
  neuve de l'énumération d'audit, pour un geste de démonstration : contestable). `GET /api/v1/essai/comptes-du-jeu`
  rend la liste pour le menu « Se connecter en tant que… ».
- **D-972-8 — L'espace d'auth : `INSTANCE_ESPACE`.** Variable neuve, facultative, la même que celle des services de A
  et de D : `ESSAI` seulement si dit, sinon `REEL` (on ferme). En réel, une garde rend 403 `ESPACE_REEL_REFUSE`
  **avant** la lecture du corps, sur les trois routes. La pose reste sous l'identité du moteur (`JetonDuMoteurGuard`,
  celle de la naissance, STORY-938), puis la garde d'espace.
- **D-972-9 — Qui appelle la pose : pas encore le catalogue.** `jeu-demonstration@1` ne porte aucune liste de comptes,
  et les comptes du bureau (Akossiwa la comptable, Mensah au recouvrement, Yawa la superviseure, Ayité le DG) ne sont
  pas dans le jeu de 1058. Brancher la pose sur l'ouverture de l'essai demande : un ajout facultatif `comptes` au
  contrat du jeu (B), le fichier des comptes produit par le générateur de D, puis l'appel du catalogue après l'import
  des parts. C'est une story de plus (« Ce qui reste ») ; ici, la route est servie et prouvée telle que le moteur
  l'appellera.
- **D-972-10 — Les référentiels habilités dans l'état publié (question de C) : pas dans cette story.** Le contrat d'état
  publié est figé (`contrat-etat-publie-v1`) : un champ facultatif touche la route, l'événement, les deux schémas, le
  registre (BACKWARD) et le calcul de l'émetteur, avec son annonce. Ce n'est pas « simple » à côté du reste ; la
  question reste ouverte, prise en charge (remplaçante du lot). C garde son choix par défaut (D-1006-5).

## Ce qui a été livré

*(à remplir à la fusion)*

## Preuves

*(à remplir)*

## Ce qui reste

- **La pose des comptes par le catalogue** à l'ouverture d'un essai (D-972-9) : ajout facultatif `comptes` à
  `jeu-demonstration@1`, fichier des comptes dans le jeu de D (agents de `terrain/commercial.json` et comptes du
  bureau), appel du catalogue après l'import.
- **La vérification `referentiel-resolu` et les routes C13 de la comptabilité** : `POST /installations` l'installera
  alors sans différer (D-972-2).
- **`referentiels` dans l'état publié** (D-972-10).
- **Les quatre modules de D sans routes C13 servies** : hors de l'offre d'essai d'ici là (D-972-6).
