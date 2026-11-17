# STORY-959 : les exercices et la tenue

Status: done

**Complexité :** moyenne (première route d'écriture du service : droits, transaction tenue + piste, course tranchée par
l'index)

**Épic :** EPIC-111 (le socle de la comptabilité), Q1 d'`epics-comptabilite-2026-08-27.md`
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service`
**Plage :** groupe B, n° 4 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 959 ; D-L3-4).
**Dépend de :** STORY-958 (le socle, `dev` `8f36ef9`).
**Débloque :** STORY-961 (le plan de journaux : un exercice tenu au journal), puis 962 → 970.

---

## Pourquoi

Q1 : « Un dossier peut-il être tenu aux cahiers **et** au journal ? Si oui, deux sources produisent deux balances pour
un même exercice. » Recommandation de l'épic, retenue par le plan (D-L3-4) : **exclusivité par exercice**, choisie au
dossier, **avec bascule possible d'un exercice à l'autre**. Avant la première écriture (962), il faut donc savoir, pour
chaque exercice, s'il est tenu ici.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 959)

| Exigence | Fait |
|---|---|
| On peut ouvrir un exercice | `POST /api/v1/dossiers/{d}/exercices/{e}/ouverture` `{ tenue }` : 201 (D-959-1) |
| La tenue est exclusive : cahiers OU journal, jamais les deux | index unique `(organisation, dossier, exercice)`, collection append-only (D-959-2) |
| Choisir l'autre tenue est refusé par un refus nommé | 409 `TENUE_EXCLUSIVE`, `details.tenueExistante` et `details.tenueDemandee` ; la même tenue rejouée : 200, rien d'écrit |
| On peut basculer d'un exercice au suivant | l'exercice suivant choisit sa tenue ; `bascule` et `precedente` le disent, la piste aussi (D-959-3) |
| Chaque choix de tenue dans la piste, avec sa `provenance` | entrée `EXERCICE_OUVERT` dans la transaction de l'acte ; provenance déduite de la proposition citée (Q3, D-959-9) |
| Tests sur un vrai MongoDB en jeu de répliques | `npm run test:socle` (suite du socle et suite des tenues) |
| `docker compose up` sain | un module Nest neuf (`ExercicesModule`, `DroitsModule`) : pile `grp-b` levée |

## Décisions (prises par défaut, contestables)

- **D-959-1 : la comptabilité n'ouvre pas les exercices de dossier-service ; elle les ouvre À ELLE.** L'exercice naît,
  se clôt et se rouvre dans `dossier-service` (Q8 : un seul ouvert à la fois ; D-958-4). « Ouvrir un exercice » ici,
  c'est y attacher la tenue : `POST …/exercices/{e}/ouverture` sur un exercice que dossier-service dit `OUVERT`, relu
  avec le jeton du membre (sa portée s'applique). La collection `tenues_exercice` ne garde que ce que la comptabilité
  est seule à savoir : la tenue, la tenue de l'exercice précédent, la bascule, l'auteur et l'heure. Le libellé, les
  bornes et le statut restent chez dossier-service et se relisent à chaque requête. Seule exception : `debutExercice`,
  lu à l'ouverture et gardé pour ordonner les exercices du dossier. Il ne bouge pas une fois l'exercice ouvert.
  Contestable si dossier-service devait un jour porter la tenue lui-même : le port `SourceDuDossier` reste la seule
  porte.
- **D-959-2 : une tenue choisie ne change plus pour cet exercice.** Index unique `une_tenue_par_exercice`, collection
  append-only (`rendreAppendOnly`) :
  - rejouer la même tenue rend 200 sans rien écrire (idempotent) ;
  - demander l'autre rend 409 `TENUE_EXCLUSIVE` ;
  - deux ouvertures concurrentes donnent une tenue et une seule. Le perdant relit et retombe sur la règle, il ne
    rend jamais 500.
  Il n'y a pas de route pour changer la tenue d'un exercice. Une tenue choisie par erreur avant toute écriture
  pourrait un jour s'annuler par un acte tracé, à décider avec la première écriture (962) ; d'ici là, rien ne la défait.
- **D-959-3 : la bascule se lit par rapport à l'exercice PRÉCÉDENT du dossier.** C'est l'exercice ouvert à la
  comptabilité dont le début est le plus récent avant celui-ci. `bascule = true` si sa tenue diffère. Aucune
  reconduction automatique : chaque exercice choisit sa tenue. Un premier exercice ne bascule pas. Un exercice
  antérieur jamais ouvert à la comptabilité ne compte pas : la comptabilité ne devine pas comment il était tenu.
- **D-959-4 : les droits se lisent par `GET /moi/droits`, par un 4e maillon global.** La chaîne devient `Jwt →
  EmailVerified → GardeComptabilite → GardeDesDroits` :
  - une route qui écrit déclare son droit (`@DroitRequis`, borné aux droits du manifeste) ;
  - une route qui écrit sans en déclarer est fermée (`DroitNonDeclare`, 500 : faute de programmation) ;
  - une lecture sans droit déclaré passe : la portée décide (D-958-9).
  Seuls les droits de tenant (`droits`) comptent, jamais `droitsPlateforme`. Pas de cache : le geste est rare. Le cache
  `(membre, organisation, dv)` du patron de 949 viendra avec la saisie (962), derrière le même port. Auth injoignable,
  lent (3 s) ou hors contrat : 503 `DROITS_INDISPONIBLES`. Auth répond 403 (appartenance inactive) : aucun droit.
  **Conséquence, assumée** : auth-service n'attribue encore `comptabilite:*` à aucun rôle (borne du jeton,
  D-958-2). Tant que ce n'est pas fait, aucune ouverture ne passe en réel (403 `DROIT_INSUFFISANT`). C'est la même
  situation que le module absent du catalogue (`NON_INSTALLE`, D-958-3). Les deux sont à lever avant la première
  recette croisée (« Pour la suite »).
- **D-959-5 : aucun fait Kafka à 959.** Personne n'attend encore la tenue. Les deux lectures (`GET …/tenue`,
  `GET …/tenues`) la servent. Le fait `comptabilite.tenue.changed@1` (outbox, schéma au registre, annonce dans
  « ⚠ Contrats ») viendra avec son premier consommateur. Contestable si A veut projeter la tenue avant.
- **D-959-6 : `CAHIERS` est une déclaration dans la comptabilité ; elle ne lit pas les cahiers de balance-service.**
  L'exclusivité est garantie de ce côté : un exercice tenu aux cahiers ne s'ouvre pas au journal, et l'inverse. De
  l'autre côté, l'Atelier (dépôt de A) ne sait pas encore qu'un exercice est tenu au journal. Y refuser un cahier
  demandera le fait de D-959-5. Information à A dans le journal de B ; rien n'est demandé avant B-967.
- **D-959-7 : ouvrir exige un référentiel résolu.** `ResolveurDePortee.resoudre` refuse `REFERENTIEL_NON_DECIDE` et
  `REFERENTIEL_INCONNU` (409) : un exercice tenu au journal tire son plan de journaux du référentiel (961), et un
  exercice tenu aux cahiers aussi, par l'Atelier. Les lectures ne relisent pas les axes : elles passent par
  `resoudreDossier` (portée du dossier seule) et les trois clés de la tenue.
- **D-959-8 : un exercice clos ne s'ouvre plus** (409 `EXERCICE_CLOS`, `details.statut`). Les exercices repris
  (`MIGRATION`) naissent clos chez dossier-service : ils ne se tiennent pas ici. Rejouer la tenue d'un exercice clos
  depuis son ouverture rend toujours 200 : la règle de D-959-2 passe avant.
- **D-959-9 : la piste dit le choix, avec sa provenance.**
  - Acte `EXERCICE_OUVERT`, objet `exercice`, auteur le membre, dans la transaction de la tenue.
  - `donnees` (champ AJOUTÉ à la piste, chaînes, 16 clés au plus) : `tenue`, `bascule` (`OUI`/`NON`), et, s'il y a un
    exercice précédent, `tenuePrecedente` et `exercicePrecedentId`.
  - La provenance ne se saisit pas, elle se déduit (`choixDuGeste`). Sans proposition citée : « choisi par
    l'utilisateur ». Proposition citée et ACCEPTÉE telle quelle : « proposé par la machine », proposition citée.
    Proposition MODIFIÉE ou REJETÉE : « choisi par l'utilisateur », proposition citée.
  - Un refus n'est pas un choix : il n'est pas consigné.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 17/11, le contrat d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #609 (fiche, tracker, manifeste amendé, annonce du contrat, AVANT le code) | `main` `4410d8a` |
| `prospera-comptabilite-service` | #2 | `dev` **`a8784cb`** (rejoué de `65af177` ; arbre identique) |

- `src/exercices/` :
  - `tenue.ts` : les règles pures (exclusivité, idempotence, bascule) ;
  - `tenue-exercice.schema.ts` : collection `tenues_exercice`, index unique, append-only ;
  - `tenue.service.ts` : la transaction tenue + piste, la course tranchée par l'index ;
  - `exercices.controller.ts` : les trois routes ;
  - `tenue.dto.ts`.
- `src/droits/` : port `SourceDesDroits` (`GET /moi/droits`, borné, fermé), `GardeDesDroits` (4e garde globale) et
  `@DroitRequis` (borné aux droits du manifeste).
- `src/piste/` : champ `donnees` (chaînes, 16 clés au plus), `choixDuGeste` (la provenance déduite de la proposition) ;
  `HORLOGE` exportée.
- `src/portee/` : `PorteeDuDossier`, `filtreDuDossier` ; `src/referentiel/` : `ResolveurDePortee.resoudreDossier`.
- `src/common/refus.ts` : cinq refus nommés neufs et un `details` facultatif.
- `AUTH_SERVICE_URL` (requise) et `AUTH_SERVICE_DELAI_MS` ; compose, `.env.example`, README.
- `src/module.manifest.ts` : recopié à l'octet depuis `main` (`git -c core.autocrlf=false show`).
- `test/socle/tenue.socle-spec.ts` (suite neuve) ; `test/socle/outils.ts` gagne une doublure d'auth (`AuthDeTest`).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` du commit poussé) :
  **21 suites, 248 passés, 2 sautés** (les deux comparaisons aux sources de `prospera-plateforme` et
  `prospera-stories`, absentes du conteneur) ; `npm run lint`, `tsc --noEmit` et `npm run build` verts.
- **`npm run test:socle`** sur la pile `grp-b` (vrai MongoDB 8.0 `rs0`, vrai Kafka sans création automatique de topics,
  doublures HTTP d'auth et de dossier-service) : **36/36**, dont les 20 du socle et 16 tenues neuves.
  - Sans `comptabilite:exercice:ouvrir` : 403 `DROIT_INSUFFISANT` (`details.droit`). Dossier-service n'est pas
    appelé, rien n'est écrit, et `/moi/droits?organisationId=` reçoit le jeton du membre tel quel.
  - Auth lente : 503 `DROITS_INDISPONIBLES`, borné à 800 ms.
  - Tenue inconnue ou champ en trop : 400.
  - 2025 ouvert aux CAHIERS : 201, une entrée `EXERCICE_OUVERT` « choisi par l'utilisateur ».
  - 2025 au JOURNAL : 409 `TENUE_EXCLUSIVE`, rien d'écrit. CAHIERS rejoué : 200, toujours une seule entrée.
  - Lecture de la tenue (même sans droit d'écriture) ; exercice non ouvert : 404 `EXERCICE_NON_OUVERT`.
  - Exercice clos sans tenue : 409 `EXERCICE_CLOS`. Dossier hors portée : 404. Autre organisation sans le module :
    403.
  - **Bascule** : 2025 clos, 2026 ouvert au JOURNAL sur une proposition acceptée. La réponse donne `bascule: true` et
    `precedente` (2025, CAHIERS). La piste écrit « proposé par la machine », avec la proposition citée et
    `donnees.tenuePrecedente`. 2025 ne passe pas au journal après coup (409).
  - **Course** : quatre ouvertures concurrentes de 2027, deux par tenue, rendent `201, 409, 200, 409` : une tenue et
    une seule entrée de piste.
  - L'historique `GET …/tenues` liste 2027, 2026, 2025.
  - `updateOne` et `deleteMany` sur les tenues lèvent sur le vrai pilote.
  - `LECTURE_SEULE` : l'ouverture rend 403 `ABONNEMENT_EXPIRE`, la lecture reste ouverte.
- **Mutations : 25/25 rougissent sur une assertion** (script joué dans l'image de vérification). Elles portent sur :
  - les règles (exclusivité, bascule) ;
  - le service : idempotence, exercice clos, borne `$lt` de l'exercice précédent, relecture après doublon, provenance,
    `bascule` dans la piste, borne de la liste, refus exclusif ;
  - l'index unique ;
  - Q3 (`choixDuGeste`) ; `donnees` (borne, recopie) ;
  - `filtreDuDossier` ; le résolveur (organisation) ;
  - la garde (lecture sans droit, droit requis, droit hors manifeste) ;
  - la source des droits (403, chaînes, droits de plateforme exclus) ;
  - le `details` des refus ; le câblage du 4e maillon ; `AUTH_SERVICE_URL` requise.
  Trois mutations rougissaient d'abord par compilation (rétrécissement de type, import inutilisé) : elles ont été
  réécrites pour rougir sur l'assertion.
- **Pile `grp-b`** (compose du dépôt, image runtime du commit poussé, volumes neufs, verrou Docker pris de façon
  atomique après celui de D) :
  - `docker compose up` sain, les quatre conteneurs `healthy` ;
  - `/api/v1/health` 200 (`mongodb` : `rs0`, primaire ; `kafka` : up) ;
  - `ExercicesController` et ses trois routes mappés, présents dans l'OpenAPI ;
  - `POST …/ouverture` sans jeton : 401.
  Pile descendue avec ses volumes (`down -v`), verrou rendu.

## Pour la suite

- **STORY-961** (le plan de journaux) : n'ouvrir des journaux que sur un exercice tenu au JOURNAL. Lire la tenue
  par `filtreCloisonne(portee)` sur `tenues_exercice`. Un exercice aux CAHIERS, ou pas ouvert, refuse nommément.
- **STORY-962** (le brouillard) : le cache des droits `(membre, organisation, dv)` derrière `SOURCE_DES_DROITS` (la
  saisie est fréquente) ; décider s'il faut un acte tracé pour annuler une tenue choisie par erreur avant toute
  écriture (D-959-2).
- **Avant la première recette croisée (B-967)**, trois verrous à lever, chacun dans une story de B :
  - `comptabilite:*` attribués aux rôles du cabinet dans auth-service (D-959-4, borne du jeton) ;
  - le module au catalogue (D-958-3) ;
  - les routes d'instance (C13).
- **Le fait `comptabilite.tenue.changed@1`** (D-959-5), par une outbox, quand un consommateur l'attend. Le premier
  probable : balance-service, pour refuser un cahier sur un exercice tenu au journal (D-959-6, A).
