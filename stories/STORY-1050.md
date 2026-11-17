# STORY-1050 : les dettes de `reseau-service` — la garde sur l'état publié, les droits lus de `/moi/droits`, le commercial republié quand son compte change

Status: in-progress

**Épics :** EPIC-145 (la garde de l'état publié dans chaque service) et EPIC-264 (chantiers de plateforme) · **Dépôt :**
`reseau-service` (tenu par D, port 3419) · **Plage :** groupe D, n° 6 du lot 3 (`PLAN-4-SESSIONS-LOT-3-2026-11-17.md`
§4). **Dépend de :** rien (B-937 `garde-etat-publie-v1` et B-949 `/moi/droits` sont fusionnés). **Suivante :**
STORY-1051 (prévenir l'assuré (1), `prospera-notification-service`).

**Sources :** D-1030-2 (la garde lit l'état du module par le port `EtatDesModules` ; « la bascule changera l'adaptateur
du port, pas la garde ») ; D-1032-2 (la table rôle → droits, « les droits hors du jeton (B-949) la remplaceront ») ;
D-1034-5 (`reseau.commercial.changed@1` n'est pas republié quand seul l'état du compte change) ; spine du moteur AD-24
(« la garde applique l'état publié SEUL ») ; contrat figé `contrat-etat-publie-v1` ; garde partagée
`garde-etat-publie-v1` (STORY-937, `prospera-plateforme/paquets/garde-etat-publie/src/index.ts`) ; patron de B-958
(`prospera-comptabilite-service/src/acces/`) ; ADR « droits hors du jeton » et B-949 (`GET /api/v1/moi/droits`,
`dv`, `identity.droits.changed@1`, patron `platform-catalog-service/src/droits-hors-du-jeton/`) ; manifeste `reseau`
(`consomme` : `etat-publie.changed.<espace>@1`, `identity.*`).

## Pourquoi

`reseau-service` est né (STORY-1030) avant que le moteur publie l'état des modules et avant qu'auth-service serve les
droits hors du jeton. Il en a gardé trois écarts, nommés au fil du lot 2 : sa garde lit encore `entitlement.changed`,
que le moteur ne ferme plus ; ses droits se déduisent du rôle par une table écrite dans le service ; et un commercial
dont le compte change d'état chez l'IdP (invitation acceptée, suspension) n'est pas republié, si bien qu'un consommateur
de `reseau.commercial.changed@1` (pdv, demain) garde un état du compte périmé. Cette story les solde avant que Dev A
reprenne le distributeur.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **La garde lit l'état publié seul** : `etat-publie.changed.<espace>` est projeté par `(organisation, module)`, appliqué seulement si `(epoque, numero)` est plus récent ; `entitlement.changed` n'est plus lu | unitaires ; MongoDB réel |
| AC-2 | **La décision est celle de la garde partagée**, copiée à l'octet (`garde-etat-publie-v1`, empreinte figée par un test) : `EN_SERVICE` ouvre, `SUSPENDU`, `ESSAI_TERMINE`, `DESINSTALLE` ferment (`RESEAU_NOT_ENTITLED`), `LECTURE_SEULE` lit et refuse l'écriture (`ABONNEMENT_EXPIRE`) | unitaires ; e2e |
| AC-3 | **Échec fermé** : aucun état reçu, un état inconnu ou une version de matrice inconnue ⇒ `RESEAU_NOT_ENTITLED`, sans donnée ; jamais ouvert par défaut | unitaires ; e2e ; pile `grp-d` |
| AC-4 | **Les droits viennent de `GET /moi/droits`** (avec le jeton de l'appelant) ; la table rôle → droits n'existe plus dans le service ; un droit absent ⇒ 403 `DROIT_INSUFFISANT` | unitaires ; pile `grp-d` |
| AC-5 | **Cache borné et invalidé** : 60 s au plus, relu si le jeton porte un `dv` plus récent, invalidé par `identity.droits.changed@1` d'une version plus récente | unitaires |
| AC-6 | **Échec fermé des droits** : auth-service injoignable, trop lent ou illisible ⇒ 503 `DROITS_INDISPONIBLES` (refus nommé) ; auth refuse ⇒ aucun droit | unitaires |
| AC-7 | **`reseau.commercial.changed@1` est republié quand seul l'état du compte change** (ou le compte lié), dans la transaction du fait `identity.*`, exactement une fois ; pas de republication si rien ne change ; même forme qu'avant | MongoDB réel ; pile `grp-d` (message lu sur Kafka) |
| AC-8 | **Rien d'autre ne casse** : la suite `conformite-portee-reseau-v1` passe ; les codes de refus existants gardent leur sens | unitaires ; intégration |
| AC-9 | **Mutations** rouges sur une assertion ; Node 24 ; `docker compose -p grp-d up` : le service démarre, la garde refuse sur appel réel quand l'état publié l'interdit, les droits sont lus de `/moi/droits`, le commercial est republié sur le topic | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1050-1 — L'état publié seul, sans double lecture.** `reseau` n'a jamais eu de double lecture et naît après le
  moteur (comme la comptabilité, B-958, et le fiscal après sa bascule, A-918) : `entitlement.changed` n'est plus lu,
  son groupe `reseau-service.droits` s'arrête, et la collection `socle_etat_des_modules` n'est plus ni écrite ni lue
  (laissée en place, sans migration). Le consommateur lit `etat-publie.changed.<espace>` de **son** espace
  (`KAFKA_ESPACE`, `REEL` par défaut, comme la comptabilité), groupe `reseau-service.etat-publie`, depuis le début (un
  groupe neuf rattrape le parc installé). Projection `socle_etats_publies`, une ligne par `(organisationId, module)`,
  état absolu, appliquée si `(epoque, numero)` dépasse celui de la ligne (un rejeu ou un message en retard ne rouvre
  rien). Le port `EtatDesModules` reste : l'adaptateur change, les routes non.
- **D-1050-2 — La décision est la garde partagée, copiée à l'octet.** `src/vendor/garde-etat-publie/garde-etat-publie.ts`
  à l'étiquette `garde-etat-publie-v1` (sha256 `a830c4491491e9505a9a761ecc549b11e10779bd13577bdd59bcffff17f892f7`,
  `ORIGINE.json`, empreinte figée par un test, hors lint et formatage). Sorte : la méthode HTTP (`sorteDeMethode`) ;
  identité : `UTILISATEUR` (aucune route de `reseau` n'est servie à une identité de service sous la garde) ; espace :
  celui du message projeté, jamais la configuration. L'ordre reste : e-mail vérifié, organisation du jeton, KYC
  (D-1031-2), état publié. Les codes ne changent pas : `RESEAU_NOT_ENTITLED`, `ABONNEMENT_EXPIRE`. La lecture seule
  vient de la matrice (`LECTURE_SEULE`), plus de l'échéance d'un droit : la garde ne lit plus d'horloge (AD-6 : la
  décision d'état est prise par le moteur, sur `HorlogeDeReference`).
- **D-1050-3 — Les modules enrichissants aussi** (`pdv`, `stock`, `freelance`) se lisent à l'état publié : un module
  est « installé » pour la couverture (C4) quand la matrice ouvre sa **lecture** à l'utilisateur (`EN_SERVICE`,
  `ESSAI_PROSPECT`, `PREAVIS`, `LECTURE_SEULE`). Inconnu ⇒ `NON_INSTALLE`, comme avant.
- **D-1050-4 — Les droits viennent de `GET /api/v1/moi/droits` d'auth-service**, avec le jeton de l'appelant tel quel
  (`AUTH_SERVICE_URL`, requise). Seuls les `droits` **de tenant** comptent : `droitsPlateforme` n'ouvre pas un module du
  client (FR-P59 ; un rôle de Money Vibes ne gère pas le réseau d'un client). La table `DROITS_PAR_ROLE` est retirée du
  service ; elle ne survit que comme doublure dans le banc de test. La garde pose les droits lus sur la requête : le
  journal (lignes de portée réservées à `reseau:portee:attribuer`) les lit là, sans seconde lecture.
- **D-1050-5 — Cache des droits, patron du catalogue (B-949).** Par `(membre, organisation)`, 60 s au plus, borné à
  10 000 entrées ; relu dès que le jeton porte un `dv` plus récent ; invalidé par `identity.droits.changed@1` portant un
  `dv` plus récent (groupe `reseau-service.droits-membres`, `fromBeginning: false` : le cache repart vide). Un service à
  plusieurs instances : chacune ne reçoit qu'une part des invalidations, le terme de 60 s borne l'écart (dit, pas
  corrigé ici).
- **D-1050-6 — Échec fermé des droits.** Auth injoignable, délai de 2 s dépassé, 5xx ou réponse illisible ⇒ **503
  `DROITS_INDISPONIBLES`** (code neuf de la garde) : rien n'est ouvert, rien n'est caché. Auth refuse (400, 401, 403 :
  `APPARTENANCE_INACTIVE`…) ⇒ aucun droit ⇒ 403 `DROIT_INSUFFISANT`. Une route sans `@ExigeDroit` n'appelle pas auth.
- **D-1050-7 — Conséquence assumée, comme la comptabilité (D-959-4).** Auth-service n'attribue encore aucun droit
  `reseau:*` (ils ne sont pas au catalogue de tenant, borne du jeton) : **en réel, toute route du module qui exige un
  droit répond 403 `DROIT_INSUFFISANT` jusqu'à B-960** (les rôles du distributeur). Demande à B dans le journal de D :
  les cinq codes, et ce que la table retirée donnait (`TENANT_ADMIN` les cinq, `TENANT_USER` la consultation).
- **D-1050-8 — `reseau.commercial.changed@1` republié quand le compte change.** Le commercial garde ce qu'il a publié
  en dernier sur son compte (`comptePublie` : `etatDuCompte`, `userId`), écrit à chaque publication. Un fait
  `identity.*` appliqué (utilisateur inscrit ou modifié, suspension, appartenance) relit, **dans sa transaction**, les
  commerciaux concernés (ceux qui portent l'e-mail de l'utilisateur dans une organisation dont il est membre, et ceux
  déjà liés à son `userId`) et republie ceux dont l'état du compte ou le compte lié a changé. Exactement une fois (le
  marqueur d'idempotence du fait est dans la même transaction). Rien ne change ⇒ rien n'est publié (un prénom modifié
  ne republie pas). Un commercial publié avant cette story (sans `comptePublie`) est republié au premier fait qui le
  touche. **La charge ne change pas** (aucun champ ajouté, rien renommé) et le `rang` non plus : comme la
  republication par une affectation, il suit les écritures du commercial, pas les publications.
- **D-1050-9 — Le socle ne dépend pas du module.** La projection `identity.*` appelle des « suites » qu'un module
  inscrit au démarrage (`SuitesDeLIdentite`), avec la session de sa transaction ; l'annuaire accepte la session pour lire
  ce que la transaction vient d'écrire.

## Ce qui n'est pas fait ici

Les quinze rôles du distributeur et leur table d'accès (B-960, puis D-1053) ; la vérification du module `freelance`
pour un `INDEPENDANT` (D-1034-6) ; le volet Reprise de l'import réseau (1055) ; un schéma au registre pour
`reseau.commercial.changed@1` (il n'en a pas, comme les faits de la hiérarchie : à poser avec son premier
consommateur).

## Preuves

À écrire à la fin.
