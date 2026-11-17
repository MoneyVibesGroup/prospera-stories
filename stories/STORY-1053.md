# STORY-1053 : les 15 rôles appliqués par le serveur — droits lus de `/moi/droits`, périmètre lu sur `reseau.portee.changed@1`, données privées absentes

Status: in-progress

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

## Ce qui n'est pas fait ici

La portée appliquée aux données des douze autres modules (ils n'ont pas encore de route de données) ; le crédit d'un
tiers filtré par la portée (le nœud d'un tiers viendra de `pdv`) ; la piste d'audit de la consultation d'une donnée
privée ; la garde des modules sur l'état publié dans les cinq services (ils lisent encore `entitlement.changed`) ; la
purge des positions à 90 jours (EPIC-223, avec `terrain`).

## Avancement (tenu à jour pendant la story)

- 2026-11-17 : rituel fait (plan, règles, journaux A/B/C/D, fiches 960, 949, 1050, 1036, 1037, EPIC-223, annexe B) ;
  branches `MNV-1053` posées depuis `origin/dev` dans les cinq services ; verrou Docker tenu par B (STORY-963) au
  départ. Fiche, tracker et annonce « ⚠ Contrats » écrits (branche `docs-1053`).
- 2026-11-17, 11:40 : annonce fusionnée (prospera-stories #638, `main` 200187c). Code écrit et poussé sur `MNV-1053` :
  plateforme `cc7f1c9` (bibliothèque, 36 tests) ; ventes, terrain, recouvrement, pilotage, croissance (socle
  `src/socle/acces/` identique). Verrou Docker pris à 11:05. Node 24 : plateforme 610 pass / 0 fail ; les cinq services
  tsc, lint, build, unitaires, e2e, intégration verts ; mutations de la bibliothèque 16/16. Reste : mutations de
  `ventes`, pile `grp-d`, PR et fusions, recette depuis `origin/dev`, PR de docs finale.
