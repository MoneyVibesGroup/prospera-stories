# STORY-959 : les exercices et la tenue

Status: in-progress

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

*(à compléter à la fusion)*

## Preuves

*(à compléter à la fusion)*

## Pour la suite

*(à compléter à la fusion)*
