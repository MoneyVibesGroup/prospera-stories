# STORY-1053 : les 15 rôles appliqués par le serveur — droits lus de `/moi/droits`, périmètre lu sur `reseau.portee.changed@1`, données privées absentes

Status: done

**Épic :** EPIC-223 (les rôles, les périmètres, les droits et les données privées), FR-4 → FR-8 du PRD distributeur ·
**Dépôts :** `prospera-plateforme` (dossier `contrats/distributeur/`, de D), `prospera-ventes-service` (3412),
`prospera-terrain-service` (3413), `prospera-recouvrement-service` (3414), `prospera-pilotage-service` (3415),
`prospera-croissance-service` (3416) · **Plage :** groupe D, n° 9 du lot 3 (`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4).
**Dépend de :** B-960 (auth #42, `dev` cf8e001 et 8d48710 : les 15 rôles, `droitsHorsJeton`, `roleMetier`). **Suivante :**
STORY-1054 (prévenir l'assuré (2), `prospera-notification-service`).

**Sources :** PRD distributeur, annexe B (B.1 périmètres, B.2 rôles × droits) et FR-4 → FR-8 ; EPIC-223 ; fiche
`STORY-960.md` (« Ce que D lit pour D-1053 », D-960-4 les données privées, D-960-12 aucun droit sans rôle `DIST_*`) ;
B-949 (`GET /moi/droits`, `dv`, `identity.droits.changed@1`) ; patron de `reseau-service` (STORY-1050 :
`src/socle/droits-du-membre/`) ; contrat `reseau.portee.changed@1` (STORY-1036), suite `conformite-portee-reseau-v1` et
registre des consommateurs (STORY-1037) ; spine distributeur AD-12 (paramètres) ; manifestes des treize modules.

## Pourquoi

Les cinq services du distributeur sont nés (STORY-1042, 1043) avec une seule garde : l'organisation a-t-elle le
module ? Ils ne savaient pas **qui** appelle. Depuis B-960, auth-service porte la table d'accès des 15 rôles (annexe
B.2), servie par `GET /moi/droits` (les droits des modules sont tous hors du jeton), et `reseau-service` publie le
périmètre de chacun (`reseau.portee.changed@1`). Cette story fait appliquer les deux par le serveur, dans les cinq
services : sans le droit, un refus nommé ; hors du périmètre, rien ; et une donnée privée absente de la réponse pour
qui n'y a pas droit.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Une bibliothèque, une règle** : la lecture de `/moi/droits`, le cache, le jugement d'un droit, la lecture et la résolution de la portée, le retrait des données privées vivent dans `acces-distributeur` (plateforme), copiée à l'octet dans les cinq services, empreinte figée par un test | `node --test` ; invariants des cinq services |
| AC-2 | **Chaque route d'un module exige un droit** (un droit nommé, ou « l'un des droits du module ») ; une route qui n'en déclare pas fait rougir l'invariant ; sans le droit : 403 `DROIT_INSUFFISANT`, sans donnée | unitaires ; e2e ; pile `grp-d` |
| AC-3 | **Les droits viennent de `/moi/droits`** (`droits ∪ droitsHorsJeton`), jamais de `perms[]` ni de `roleMetier` ; cache 60 s, relu sur un `dv` plus récent, invalidé par `identity.droits.changed@1` ; auth injoignable ⇒ 503 `DROITS_INDISPONIBLES` | unitaires ; pile `grp-d` |
| AC-4 | **Le périmètre est lu sur `reseau.portee.changed@1`** par chacun des cinq services : par membre, le fait de plus haute `revision` ; aucun fait, `RETIREE` ou `noeuds: []` ⇒ **zéro** ; seule `totale: true` ouvre tout ; l'écriture reste contenue dans la lecture | suite `conformite-portee-reseau-v1` sur MongoDB réel (cinq services) ; pile `grp-d` |
| AC-5 | **`commande` filtre ses actes par la portée** : la liste ne rend que les actes du périmètre ; un acte hors périmètre est introuvable ; valider ou reprendre hors de l'écriture est refusé `HORS_PORTEE` | intégration ; pile `grp-d` |
| AC-6 | **Les données privées sont absentes** de la réponse (clé absente, jamais `null`) pour un rôle qui n'y a pas droit (la marge de l'acte, `catalogue:marge:consulter`) | unitaires ; pile `grp-d` |
| AC-7 | **Inscription au registre** des consommateurs de `reseau` après un passage vert | pile `grp-d` |
| AC-8 | Node 24 : tsc, lint des fichiers touchés, build, unitaires, e2e, intégration ; mutations rouges sur une assertion (bibliothèque, `ventes`) ; `docker compose -p grp-d up` : les cinq services démarrent, appels réels, rejoués depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1053-1 — Le code commun vit dans la plateforme, dans le dossier de D déjà lu par les scripts racines.**
  `prospera-plateforme/contrats/distributeur/src/acces.ts` (test `contrats/distributeur/test/acces.test.ts`), étiquette
  **`acces-distributeur-v1`** : un fichier sans dépendance ni I/O, copié **à l'octet** dans chaque service
  (`src/socle/acces/acces-distributeur.ts`, provenance dans `source.ts`, empreinte écrite dans
  `src/acces.invariant.spec.ts`). Le `test` et le `typecheck` racines lisent déjà `contrats/distributeur/**` (comme pour
  1045) : **aucun fichier de B n'est touché**, aucune demande de README (un dossier racine `acces-distributeur/` aurait
  fait rougir `test/scripts-racines.test.ts` jusqu'à une PR de B). Les pièces Nest (garde, client HTTP, consommateurs,
  projection) forment un dossier `src/socle/acces/` **identique** dans les cinq services (même contenu, vérifié à la
  livraison), qui ne dépend que de la configuration du service.
- **D-1053-2 — Ce que chaque service garde.** Une garde globale de plus, après la garde des modules : chaque route d'un
  module déclare `@ExigeDroit(d1, d2…)` (l'un d'eux suffit) ou `@ExigeUnDroitDuModule()` (l'un des droits que le
  manifeste du module déclare, C7) ; un invariant fait rougir une route qui ne déclare rien. Mêmes codes que `reseau` :
  **403 `DROIT_INSUFFISANT`**, **503 `DROITS_INDISPONIBLES`** (EPIC-223 parle de `ROLE_NON_AUTORISE` : un seul nom pour
  un seul refus, celui déjà livré). Routes :
  - les treize modules : `GET /<module>/module` et `GET /<module>/piste` ⇒ l'un des droits du module (un membre sans
    rôle `DIST_*` n'en a aucun, D-960-12 ; `support-client:*` n'est attribué à personne : module fermé à tous) ;
  - `commande` : lire les paramètres ⇒ l'un des droits du module ; **les changer ⇒ `commande:parametres:modifier`**
    (D-1053-7) ; le crédit d'un tiers ⇒ l'un des droits du module ; **valider** et **reprendre** la saga ⇒
    `commande:commande:valider` ; **lire** un acte ou la liste ⇒ `commande:reseau:consulter` ou
    `commande:portefeuille:consulter` ; les séries (lecture, émissions de recette) ⇒ `commande:bon-livraison:emettre`.
  - `@Roles(TENANT_ADMIN)` disparaît de `commande` ; la garde des rôles reste dans la chaîne.
- **D-1053-3 — Les droits.** `GET {AUTH_SERVICE_URL}/api/v1/moi/droits?organisationId=<org du jeton>` avec le jeton de
  l'appelant ; droits effectifs = **`droits ∪ droitsHorsJeton`** (absent = `[]`) ; `droitsPlateforme`, `perms[]` et
  `roleMetier` ne décident jamais. Cache par `(membre, organisation)`, 60 s au plus, borné à 10 000 entrées, relu si
  le jeton porte un `dv` plus récent, invalidé par `identity.droits.changed@1` d'un `dv` plus récent (groupe
  `<service>.droits-membres`, `fromBeginning: false`). Auth refuse (400, 401, 403) ⇒ aucun droit ⇒ 403 ; auth
  injoignable, plus de 2 s, 5xx ou réponse illisible ⇒ 503. **`AUTH_SERVICE_URL` est requise.** Le claim `dv` est
  projeté par la stratégie JWT.
- **D-1053-4 — Le périmètre.** Chaque service consomme `reseau.portee.changed` (groupe `<service>.portee-reseau`, depuis
  le début, topic créé avant l'abonnement, `metadataMaxAge: 10_000`) et projette `socle_portees_reseau`, une ligne par
  `(organisationId, userId)` : le fait de plus haute `revision` (une révision égale ou inférieure est ignorée, quel que
  soit son `eventId`) ; un fait illisible est écarté. La résolution est celle de la bibliothèque, en **échec fermé** :
  aucun fait, `RETIREE` ou `noeuds: []` ⇒ `AUCUNE` ; `totale: true` ⇒ toute l'organisation, jamais une autre ;
  l'écriture est **l'intersection** de l'écriture et de la lecture. La condition de requête d'une portée `AUCUNE` est
  `{ <champ>: { $in: [] } }`, jamais `{}` : un appelant qui oublierait de tester l'absence n'ouvre rien. Un objet sans
  nœud n'est visible que d'une portée totale.
- **D-1053-5 — La projection par service, et ce que chaque module en fait.** La projection est la même dans les cinq
  services (le fait est déjà résolu par `reseau`, le consommateur n'a pas l'arbre). Chaque module applique la portée
  par le nœud de ses objets : **`commande`** par le `noeudId` de l'acte (la zone du point de vente ; reçu dans le corps
  du squelette, D-1049-9, jusqu'à `pdv` et 1056). Les douze autres modules n'ont encore aucune route de données : ils
  appliqueront la même condition avec leur première route de lecture. Lecture hors portée ⇒ **404** (comme un objet
  inexistant : jamais un 403 qui révèle) ; écriture sur un objet visible hors de l'écriture, ou création sur un nœud
  hors de l'écriture ⇒ **403 `HORS_PORTEE`**.
- **D-1053-6 — Les données privées sont absentes, pas masquées.** Pour qui n'a pas le droit, la clé **n'est pas dans la
  réponse** ; `null` garde son sens (« sans objet » ou « inconnu »), il ne veut jamais dire « caché ». La bibliothèque
  porte les quatre droits privés de B-960 (D-960-4 : rémunérations, commissions, prix d'achat, marge) et retire, sur un
  objet, les champs qu'un service déclare privés. `commande` : `margeMineur` de l'acte ⇐ `catalogue:marge:consulter`
  (DG, DC, DAF, CONTROLE_GESTION par défaut). Une donnée privée servie est journalisée (`DONNEE_PRIVEE_SERVIE` :
  membre, organisation, champ) ; la piste d'audit de la consultation viendra avec la première vraie marge (1056).
- **D-1053-7 — Les paramètres de `commande` : un droit neuf, `commande:parametres:modifier`.** AD-12 réserve le geste au
  DG et à `DIST_ADMIN` ; l'annexe B ne nomme aucun droit pour lui, et B-960 déconseille `roleMetier` (une surcharge
  retire un droit sans changer le nom du rôle). Le droit entre au manifeste `commande` (prospera-stories, PR
  d'annonce) et se demande à B (catalogue, hors du jeton ; DG et `DIST_ADMIN` par défaut). **Jusqu'à ce qu'auth
  l'attribue, personne ne change les paramètres** (403, échec fermé), comme `reseau` avant B-960. Q-D-5 au PO.
- **D-1053-8 — Le corps du squelette de validation gagne deux champs facultatifs** (D-1049-9) : `noeudId` (ObjectId
  hex, le nœud du réseau où vit le point de vente) et `margeMineur` (entier signé, la marge de la commande telle que la
  résolution du prix la donnera en 1056). Un acte d'avant 1053 n'a pas de nœud : seule une portée totale le voit.
  Route neuve : `GET /api/v1/commande/validations` (les actes du périmètre, les plus récents d'abord, `limite` 1 → 200,
  50 par défaut).
- **D-1053-9 — La suite de conformité dans chaque service, sur sa vraie projection.** `conformite-portee-reseau-v1`
  copiée à l'octet (sha256 `f2779975…`) dans `src/socle/acces/conformite-portee-reseau.ts`, jouée sur MongoDB réel
  avec un adaptateur sur le vrai consommateur (`traiter`), la vraie projection et le vrai filtre. Chaque service
  s'inscrit au registre de `reseau` pour chacun de ses modules ; la liste `MODULES_QUI_FILTRENT_PAR_LA_PORTEE` de
  `reseau` n'est pas changée ici.

- **D-1053-10 — Les noms des variables suivent `reseau`** (écart avec l'annonce) : `DROITS_DELAI_MS` et
  `DROITS_CACHE_TTL_MS` (au lieu des `AUTH_DROITS_*` annoncés), comme dans `reseau-service` (STORY-1050) : un seul nom
  pour un même réglage dans les six services. `AUTH_SERVICE_URL`, `KAFKA_DROITS_MEMBRES_GROUP_ID` et
  `KAFKA_PORTEES_GROUP_ID` sont ceux de l'annonce.
- **D-1053-11 — Le refus nomme ce qu'il fallait**, jamais ce que le membre a (`messageDroitInsuffisant`) ; pour
  « l'un des droits du module », il cite les droits du manifeste.
- **D-1053-12 — Les bancs gardent les vrais adaptateurs** : seul auth-service est remplacé (un petit serveur qui rend
  les droits portés par le jeton de test, et qu'on met en panne) ; la projection des portées est réelle (MongoDB). Les
  e2e doublent le port des droits (comme l'état des modules).

## Ce qui n'est pas fait ici

La portée appliquée aux données des douze autres modules (ils n'ont pas encore de route de données) ; le crédit d'un
tiers filtré par la portée (le nœud d'un tiers viendra de `pdv`) ; la piste d'audit de la consultation d'une donnée
privée ; la garde des modules sur l'état publié dans les cinq services (ils lisent encore `entitlement.changed`) ; la
purge des positions à 90 jours (EPIC-223, avec `terrain`).

## Livré

- **prospera-plateforme #28**, fusionnée en rebase : `dev` **e3727f8** (branche cc7f1c9) ; étiquette
  **`acces-distributeur-v1`** sur e3727f8 ; `contrats/distributeur/src/acces.ts`, sha256
  `abe061535c64e4fbbe1eef92a9e4b85d62c2da458ec43b31399047262c87b99f`.
- **prospera-ventes-service #5** : `dev` f3f4774, 1233037, **9e626fa** (branche b93958d).
- **prospera-terrain-service #2** : `dev` 8cbee4f, 93bc0af, **5b701a8** (branche 93564cd).
- **prospera-recouvrement-service #2** : `dev` dc4697d, cdd4653, **2879924** (branche cdd51c8).
- **prospera-pilotage-service #2** : `dev` 4c6e67d, 2a86792, **faa553a** (branche e917f3c).
- **prospera-croissance-service #2** : `dev` f7a8ada, b83c5a0, **a035e61** (branche de3309f).
- Annonce « ⚠ Contrats » fusionnée **avant** le code : prospera-stories **#638** (`main` 200187c), avec le manifeste
  `commande` (+ `commande:parametres:modifier`, sha256 `c507d420…`, recopié dans `ventes`).

## Preuves

- **Bibliothèque** (Node 24, `git archive` de la branche dans `node:24-slim`) : `npm run typecheck` racine vert ;
  `npm test` racine **611 tests, 610 pass, 0 fail** (1 ignoré, de B) ; 36 tests neufs (`acces.test.ts`).
  **Mutations 16/16 rouges sur une assertion** : `droitsHorsJeton` ignorés ; 401 rendu indisponible ; corps illisible
  pris pour « aucun droit » ; `dv` du jeton ignoré ; cache servi à 60 s pile ; invalidation par un `dv` égal ; « rien
  d'exigé » ouvert ; révision égale qui remplace ; `RETIREE` ignoré ; vide pris pour une liste ; écriture hors de la
  lecture ; objet sans nœud visible d'une portée restreinte ; `AUCUNE` rendue `{}` ; donnée privée mise à `null` ; nœud
  hors ObjectId accepté ; droit non privé accepté.
- **Les cinq services** (image `verification`, Node 24, construite depuis `git -c core.autocrlf=false archive HEAD`) :
  tsc, `npm run lint` (tout le dépôt) et build verts dans les cinq.
  | Service | Unitaires (Test Suites / Tests) | e2e | Intégration (MongoDB 8.0 réel, jeu de répliques) |
  |---|---|---|---|
  | ventes | 40/40, 370 | 1/1, 16 | 7/7, 59 (garde-fous HTTP, séries HTTP, conformité six cas…) |
  | terrain | 33/33, 314 | 1/1, 16 | 2/2, 11 (piste, conformité six cas) |
  | recouvrement | 33/33, 312 | 1/1, 15 | 2/2, 11 |
  | pilotage | 33/33, 318 | 1/1, 16 | 2/2, 11 |
  | croissance | 33/33, 316 | 1/1, 16 | 2/2, 11 |
  Un premier passage avait 1 à 2 tests rouges par service (`env.validation.spec` sans `AUTH_SERVICE_URL`) : corrigé
  (commit « validateEnv »), rejoué vert. **Mutations de `ventes` 14/14 rouges sur une assertion** (garde qui ne juge
  pas ; « un droit du module » qui ne demande rien ; panne d'auth prise pour « aucun droit » ; `dv` non passé au cache ;
  délai non tenu ; invalidation sans effet ; projection sans condition de révision ; liste sans portée (requête et
  règle : l'une seule est équivalente, défense en profondeur) ; acte hors portée rendu ; écriture non jugée à la
  validation, puis à la reprise ; marge servie à tous ; paramètres ouverts à tout droit du module ; séries ouvertes à
  un autre droit). Une mutation qui laissait un symbole inutilisé a été tournée pour compiler.
- **Pile `grp-d`** (compose de preuve : les cinq services, `reseau-service`, Kafka, MongoDB en jeu de répliques,
  émetteur de jetons de recette qui sert la doublure de `/moi/droits` ; les droits de chaque rôle y sont **dérivés de
  `table-d-acces-distributeur.ts` d'auth-service** `dev` 8d48710 : 131 droits, DIST_DC 50) : les six services
  `healthy` ; les deux groupes neufs abonnés (`<service>.portee-reseau`, `<service>.droits-membres`, topics créés avant
  l'abonnement). Sur les images de la branche : **34/34** appels conformes. **Rejoué sur des images reconstruites depuis
  `origin/dev`** (`--no-cache`, volumes neufs) :

```
== l'organisation a ses treize modules et stock (entitlement.changed)
== les portées (reseau.portee.changed@1) : DC et DG totales, superviseur sur N1
== un rôle autorisé passe, un rôle non autorisé reçoit 403 (cinq services)
  ✔ GET :3412/commande/module → 200 {"module":"commande","version":"1.0.0","organisationId":"f6fc3eaf6174e7b4c96403f …
  ✔ GET :3412/commande/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne co …
  ✔ GET :3412/commande/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne co …
  ✔ GET :3412/entrepot/piste → 200 {"lignes":0,"integre":true,"premiereLigneFautive":null,"tete":null}
  ✔ GET :3412/facturation/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne …
  ✔ PUT :3412/commande/parametres → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits n …
  ✔ GET :3412/commande/series → 200 {"ancree":false,"series":[{"serie":"bons-livraison","dernier":0,"epoque":1,"trou …
  ✔ GET :3412/commande/series → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne co …
  ✔ GET :3413/terrain/module → 200 {"module":"terrain","version":"1.0.0","organisationId":"f6fc3eaf6174e7b4c96403fc" …
  ✔ GET :3413/terrain/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne com …
  ✔ GET :3414/recouvrement/module → 200 {"module":"recouvrement","version":"1.0.0","organisationId":"f6fc3eaf6174e7b …
  ✔ GET :3414/recouvrement/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits n …
  ✔ GET :3415/equipe/module → 200 {"module":"equipe","version":"1.0.0","organisationId":"f6fc3eaf6174e7b4c96403fc"," …
  ✔ GET :3415/equipe/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne comp …
  ✔ GET :3415/dashboard/module → 200 {"module":"dashboard","version":"1.0.0","organisationId":"f6fc3eaf6174e7b4c9640 …
  ✔ GET :3416/marketing/module → 200 {"module":"marketing","version":"1.0.0","organisationId":"f6fc3eaf6174e7b4c9640 …
  ✔ GET :3416/marketing/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits ne c …
  ✔ GET :3416/support-client/module → 403 {"statusCode":403,"error":"Forbidden","message":"Accès refusé : vos droits …
== commande : le périmètre limite la liste ; la marge est absente sans droit
  ✔ POST :3412/commande/validations → 201 {"commandeId":"ad080e85-2159-4a15-92a2-a345fa2727b8","tiersId":"PDV-ADJO", …
  ✔ POST :3412/commande/validations → 201 {"commandeId":"82d9b531-db17-4869-bf46-645c61edb595","tiersId":"PDV-ADJO", …
  ✔ POST :3412/commande/validations → 201 {"commandeId":"cedd3258-cbc6-45b9-b9d4-04ae54da86ad","tiersId":"PDV-ADJO", …
  ✔ GET :3412/commande/validations → 200 {"validations":[{"commandeId":"cedd3258-cbc6-45b9-b9d4-04ae54da86ad","tiers …
    DC voit : 3 actes
  ✔ GET :3412/commande/validations → 200 {"validations":[{"commandeId":"ad080e85-2159-4a15-92a2-a345fa2727b8","tiers …
    superviseur (N1) voit : 1 [True] [False] (nombre, A1, marge présente)
  ✔ GET :3412/commande/validations/{id} → 404 {"statusCode":404,"error":"Not Found","message":"Aucune validation de  …
  ✔ POST :3412/commande/validations/{id}/reservations → 403 {"statusCode":403,"error":"Forbidden","message":"Accès r …
  ✔ GET :3412/commande/validations/{id} → 200 {"commandeId":"ad080e85-2159-4a15-92a2-a345fa2727b8","tiersId":"PDV-AD …
    DG : margeMineur = 90000
  ✔ GET :3412/commande/validations/{id} → 200 {"commandeId":"ad080e85-2159-4a15-92a2-a345fa2727b8","tiersId":"PDV-AD …
    superviseur : margeMineur = ABSENTE
  ✔ POST :3412/commande/validations → 403 {"statusCode":403,"error":"Forbidden","message":"Cet acte est hors de votr …
== une portée retirée donne zéro ; un rejeu plus ancien ne rouvre rien
  ✔ GET :3412/commande/validations → 200 {"validations":[]}
    superviseur après retrait : 0 acte(s)
== la portée est projetée dans chacun des cinq services
    ventes : [{"userId":"u-dc","fait":{"statut":"ATTRIBUEE"},"revision":1},{"userId":"u-dg","fait":{"statut":"ATTRIB …
    terrain : [{"userId":"u-dc","fait":{"statut":"ATTRIBUEE"},"revision":1},{"userId":"u-dg","fait":{"statut":"ATTRI …
    recouvrement : [{"userId":"u-dc","fait":{"statut":"ATTRIBUEE"},"revision":1},{"userId":"u-dg","fait":{"statut":" …
    pilotage : [{"userId":"u-dc","fait":{"statut":"ATTRIBUEE"},"revision":1},{"userId":"u-dg","fait":{"statut":"ATTR …
    croissance : [{"userId":"u-dc","fait":{"statut":"ATTRIBUEE"},"revision":1},{"userId":"u-dg","fait":{"statut":"AT …
== auth arrêté : 503 DROITS_INDISPONIBLES (membres jamais lus, hors cache)
  ✔ GET :3412/commande/module → 503 {"statusCode":503,"error":"Service Unavailable","message":"Vos droits ne peuvent …
  ✔ GET :3413/terrain/module → 503 {"statusCode":503,"error":"Service Unavailable","message":"Vos droits ne peuvent  …
  ✔ GET :3414/recouvrement/module → 503 {"statusCode":503,"error":"Service Unavailable","message":"Vos droits ne peu …
  ✔ GET :3415/dashboard/module → 503 {"statusCode":503,"error":"Service Unavailable","message":"Vos droits ne peuven …
  ✔ GET :3416/marketing/module → 503 {"statusCode":503,"error":"Service Unavailable","message":"Vos droits ne peuven …
RESULTAT : 34 vérifiés, 0 écarts
== registre des consommateurs de reseau (PUT …/conformite/consommateurs/<module>, PLATFORM_ADMIN) : 13 × 200
   approvisionnement 1.0.0 6 cas prospera-ventes-service@9e626fa
   commande 1.0.0 6 cas prospera-ventes-service@9e626fa
   conquete-objectifs 1.0.0 6 cas prospera-terrain-service@5b701a8
   controle-gestion 1.0.0 6 cas prospera-pilotage-service@faa553a
   dashboard 1.0.0 6 cas prospera-pilotage-service@faa553a
   entrepot 1.0.0 6 cas prospera-ventes-service@9e626fa
   equipe 1.0.0 6 cas prospera-pilotage-service@faa553a
   facturation 1.0.0 6 cas prospera-ventes-service@9e626fa
   finance-transactions 1.0.0 6 cas prospera-pilotage-service@faa553a
   marketing 1.0.0 6 cas prospera-croissance-service@a035e61
   recouvrement 1.0.0 6 cas prospera-recouvrement-service@2879924
   studio-social 1.0.0 6 cas prospera-croissance-service@a035e61
   support-client 1.0.0 6 cas prospera-croissance-service@a035e61
   terrain 1.0.0 6 cas prospera-terrain-service@5b701a8
```

- **Témoin avant la correction** (images d'`origin/dev` e4a27c7 et 0d194cc, `dist/socle/acces` absent, même pile) :
  `TENANT_ADMIN` sans rôle et `DIST_ADMIN` ouvrent `/commande/module` (200), `DIST_GEST_ENTREPOT` ouvre
  `/terrain/module` (200), `TENANT_ADMIN` sans rôle change les paramètres de commande (200, version 2).
- Verrou Docker pris à 11:05 (B l’avait rendu à 10:44), rendu à 12:02 après `down -v` : aucun conteneur, volume ni réseau
  `grp-d`.
- Fins de ligne : `git diff --stat` et `--ignore-cr-at-eol` identiques avant chaque commit ; aucun `index.ts` non suivi.

## Avancement (tenu à jour pendant la story)

- 2026-11-17 : rituel fait (plan, règles, journaux A/B/C/D, fiches 960, 949, 1050, 1036, 1037, EPIC-223, annexe B) ;
  branches `MNV-1053` posées depuis `origin/dev` dans les cinq services ; verrou Docker tenu par B (STORY-963) au
  départ. Fiche, tracker et annonce « ⚠ Contrats » écrits (branche `docs-1053`).
- 2026-11-17, 11:40 : annonce fusionnée (prospera-stories #638, `main` 200187c). Code écrit et poussé sur `MNV-1053` :
  plateforme `cc7f1c9` (bibliothèque, 36 tests) ; ventes, terrain, recouvrement, pilotage, croissance (socle
  `src/socle/acces/` identique). Verrou Docker pris à 11:05. Node 24 : plateforme 610 pass / 0 fail ; les cinq services
  tsc, lint, build, unitaires, e2e, intégration verts ; mutations de la bibliothèque 16/16. Reste : mutations de
  `ventes`, pile `grp-d`, PR et fusions, recette depuis `origin/dev`, PR de docs finale.
- 2026-11-17, 12:05 : PR fusionnées (plateforme #28, ventes #5, terrain #2, recouvrement #2, pilotage #2, croissance
  #2), étiquette `acces-distributeur-v1` posée ; recette rejouée depuis `origin/dev` (34/34) ; registre de `reseau` :
  13 modules inscrits ; verrou rendu à 12:02. **Story finie.**
