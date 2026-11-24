# STORY-1070 : lever une alerte bloquante — le gestionnaire lève avec un motif l'alerte `BLOQUANT` du décompte, et l'évaluation s'arrête

Status: done

**Épic :** EPIC-207 (instruire le dossier) ; FR-55 (« une alerte `BLOQUANT` empêche l'enregistrement de l'évaluation tant
qu'elle n'est pas levée par le gestionnaire avec un motif ; la raison s'affiche »), FR-75 (une évaluation arrêtée n'est
jamais recalculée), FR-7 et FR-29 (partie au dossier, cumuls interdits) · **Dépôt :** `prospera-sinistres-service`
(module `sinistres`) ; aucun schéma de `prospera-plateforme`, aucun manifeste, aucun autre dépôt ne change ·
**Plage :** groupe D, n° 6 du lot 6 (`PLAN-LOT-6-2026-11-23.md` §6), troisième story d'assurance de D (D-L6-3).
**Dépend de :** STORY-1011 (le formulaire d'instruction), 1012 (le décompte et ses alertes), 1013 (l'arrêt de
l'évaluation et son refus `ALERTE_BLOQUANTE_NON_LEVEE`), 1003 (partie et cumuls), livrées par C ; 1069 (D).
**Suivante :** STORY-1071 (la mission d'expertise, FR-61).

**Sources :** le reste de C, **D-1013-10** (« une alerte BLOQUANTE du décompte empêche l'arrêt ; la commande qui la lève
avec un motif n'existe pas encore : tant qu'elle n'est pas écrite, un dossier en RC seule avec assuré fautif ne s'évalue
pas ») ; PRD FR-55 (et `part-w2.md`, même texte) ; FR-136 (`ALERTE_BLOQUANTE_NON_LEVEE` : « une alerte bloquante doit
être levée, avec un motif, avant l'évaluation ») ; code de `sinistres` (`decompte.ts` : `AlerteDuDecompte`, niveaux
`BLOQUANT` / `ALERTE` / `INFO` ; `evaluation.ts` : `jugerLArret`) ; `separation-2026.1.json` (cumuls de `EVALUER`) ;
fiches 1011, 1013, 1069 ; « Pièges rencontrés » de C et de D (dont 1069-1 : les délais de crochet du banc MongoDB).

## « Fini quand » (D-1070-1)

Le plan du lot 6 ne le fixe pas (§6, ligne 6). Retenu : **un dossier dont le décompte porte une alerte `BLOQUANT`
s'évalue dès qu'un gestionnaire (GEST, GREC, RESP) l'a levée avec un motif écrit, sur l'enregistrement du formulaire
en vigueur (`POST …/dossiers/{id}/instruction/levees`) ; la levée est en ajout seul, tracée à la piste, fait de son
auteur une partie (`EVALUER`), se lit au formulaire (`GET …/instruction` : les alertes du décompte et leur levée) et
est copiée dans l'évaluation arrêtée ; un nouvel enregistrement du formulaire qui garde l'alerte la rebloque ; une
levée refusée ou rejouée n'écrit rien ; prouvé sous Node 24 (étage `verification`) par la suite unitaire complète,
d'un trait, sur MongoDB et Redis réels, et par l'e2e HTTP.** Le fait `sinistres.evaluation.arretee@1` ne change pas.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | ⛔ **Lever, c'est écrire un motif** : `POST …/instruction/levees` (`code`, `motif` ≥ 10 caractères, `roleExerce`, `versionLue`, `cleIdempotence`) ajoute une levée `{ code, enregistrement, motif, par, roleExerce, le }` ; sans motif suffisant : 400 `MOTIF_ECRIT` ; hors GEST, GREC, RESP : 403 | spec pure ; spec de service (mémoire et MongoDB réel) ; e2e ; mutations |
| AC-2 | ⛔ **On ne lève que ce qui bloque, sur le formulaire en vigueur** : une alerte absente du décompte du dernier enregistrement, ou d'un autre niveau que `BLOQUANT` : 409 `ALERTE_ABSENTE` (détails : les alertes bloquantes) ; déjà levée sur cet enregistrement : 409 `ALERTE_DEJA_LEVEE` ; sans enregistrement : 409 `INSTRUCTION_NON_ENREGISTREE` ; décompte impossible ou invalide : leur refus ; hors `EN_INSTRUCTION` et `EVALUE` : 409 `LEVEE_IMPOSSIBLE` | spec pure ; spec de service ; mutations |
| AC-3 | ⛔ **L'arrêt passe après la levée, et seulement pour cet enregistrement** : levée, l'alerte ne bloque plus `POST …/evaluations` ; l'évaluation copie la levée (`alertesLevees`) ; un nouvel enregistrement du formulaire qui garde l'alerte la rebloque (`ALERTE_BLOQUANTE_NON_LEVEE`, détails : les alertes non levées) ; le montant (> 0) et le motif de l'arrêt restent jugés comme avant | spec pure ; spec de service ; mutations |
| AC-4 | ⛔ **La séparation des tâches** : lever, c'est évaluer (`EVALUER`) : le cumul est jugé avant la levée (`SEPARATION_DES_TACHES`), et l'auteur de la levée devient partie (il ne valide, ne contrôle ni n'enregistre l'accord ensuite) | spec `partie` ; spec de service |
| AC-5 | **Une commande du dossier comme les autres** : version + 1, ligne de piste `LEVER_ALERTE` (code, enregistrement, motif), `sinistres.dossier.changed@1` seul (aucun fait neuf, aucun texte libre dans un fait) ; un rejeu (même clé, même corps) rend la même réponse sans rien écrire ; une version périmée : `ETAT_PERIME` | spec de service (mémoire et MongoDB réel) |
| AC-6 | **La raison s'affiche** : `GET …/instruction` gagne `alertes` (celles du décompte du dernier enregistrement : code, niveau, message ; pour un `BLOQUANT`, `levee` ou `null`) et `levees` (l'historique) ; rien ne change dans les lectures existantes | spec de service ; e2e |
| AC-7 | Node 24 (étage `verification`) : lint, **suite unitaire complète d'un trait sur MongoDB et Redis réels**, e2e, build ; mutations rouges sur l'assertion | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1070-1 — « Fini quand »** : ci-dessus (le plan ne le fixe pas).
- **D-1070-2 — Une route d'écriture à part, sous le formulaire** : `POST /api/v1/sinistres/dossiers/{id}/instruction/levees`.
  Lever n'est ni enregistrer le formulaire (les valeurs ne changent pas) ni arrêter (aucun montant) : c'est un acte
  motivé de plus, qui se rejoue par sa clé. Les rôles sont ceux de l'arrêt (GEST, GREC, RESP : FR-55 dit « le
  gestionnaire ») ; la fenêtre aussi (`EN_INSTRUCTION`, `EVALUE`). Aucune route de lecture neuve (la lecture est celle
  du formulaire, déjà déclarée en lecture seule) : **aucun manifeste ne change**.
- **D-1070-3 — Une levée vaut pour l'enregistrement du formulaire sur lequel elle est faite.** Le motif justifie un
  décompte précis (ses valeurs) ; un nouvel enregistrement est un nouveau décompte : si l'alerte y est encore, elle
  bloque de nouveau, et se lève de nouveau. Les levées sont en ajout seul (jamais effacées) ; celle qui compte est
  celle de `(code, enregistrement en vigueur)`.
- **D-1070-4 — On ne lève qu'une alerte `BLOQUANT` présente** dans le décompte du dernier enregistrement, jugé comme à
  l'arrêt (tables à la date de survenance) : on ne lève pas d'avance, ni une `ALERTE` ou une `INFO` (elles ne bloquent
  rien). Codes neufs : `ALERTE_ABSENTE`, `ALERTE_DEJA_LEVEE`, `LEVEE_IMPOSSIBLE` ; `MOTIF_ECRIT` reprend la règle des
  10 caractères de l'arrêt (`MOTIF_MINIMUM`).
- **D-1070-5 — Lever, c'est évaluer** (FR-29, FR-7) : la levée est un acte `EVALUER` ; le cumul est jugé avant
  (`SEPARATION_DES_TACHES`), et son auteur est partie au dossier (lu dans `instruction.levees`) : celui qui a levé
  l'alerte ne valide pas ensuite. La table `separation-2026.1.json` ne change pas.
- **D-1070-6 — La levée est une donnée du formulaire** (`instruction.levees`, champ `Mixed` déjà persisté) : ni
  collection ni schéma Mongo neuf. **L'évaluation arrêtée la copie** (`alertesLevees`), comme elle copie son décompte :
  elle n'est jamais relue ailleurs ni recalculée (FR-75).
- **D-1070-7 — Aucun fait neuf, aucun contrat de fait ne change** : la levée publie le seul `sinistres.dossier.changed@1`
  de toute commande (sans contenu) ; le motif reste au dossier et à la piste ; `sinistres.evaluation.arretee@1` ne porte
  pas la levée (schéma fermé, D-1069-3 : jamais de texte libre). Le consommateur `liaison-assureur` ne change pas.
- **D-1070-8 — La raison s'affiche au formulaire** (FR-55) : `GET …/instruction` rend les alertes du décompte du dernier
  enregistrement (calculé à la lecture : ce n'est pas une évaluation arrêtée) et l'historique des levées. Un écran
  propose « Lever » sur une alerte `BLOQUANT` sans levée ; le serveur rejuge tout.
- **D-1070-9 — Pas de pile `grp-d`** : aucun module Nest, aucune dépendance, aucun Dockerfile ne change (§1.5), aucun
  fait neuf ; le chemin HTTP (gardes, validation, filtre) est prouvé par l'e2e, l'écriture par le service sur MongoDB
  réel (transaction, piste, outbox). Patron de 1013.
- **D-1070-10 — Les délais de crochet du banc MongoDB (piège 1069-1) : la cause est corrigée dans le banc, sans
  relever aucun délai** (prospera-sinistres-service#32, commit séparé de la story). Constat : la suite complète d'un
  trait est passée 1366/1366 à 5 s sur la branche (168 s), puis **7 échecs** au rejeu sur `origin/dev` (le
  `beforeEach` ET l'`afterEach` du même test au-delà de 5 s, puis six tests de suite : une saturation de `mongod`, pas
  un défaut de la story). Cause mesurée : `dossiers.service.spec.ts` créait **par test** une base, six collections et
  leurs index, puis la supprimait ; ces opérations de catalogue se sérialisent dans `mongod` — `beforeEach` médian
  **0,52 s seul, 1,58 s à 4 bancs concurrents, 2,83 s à 8** (p95 3,3 s). Le poste est partagé (B) : la marge sous 5 s
  disparaît sous charge. **Correction** : la base du fichier est créée une fois (collections et index posés une fois),
  vidée par `deleteMany` entre deux tests (même état de départ, compteurs compris), supprimée en `afterAll`. Un délai
  relevé aurait masqué la saturation ; un `maxWorkers` plus bas ne retire pas la DDL. Résultat : **1366/1366, 0 délai,
  85 s** (deux fois moins) ; sous une charge de DDL forcée (8 bancs concurrents en boucle) : 6 échecs en 266 s contre
  **35 en 791 s** avant. Les petits bancs par test qui restent (`provision-en-vigueur`, `experts`,
  `declaration-rapide`) ne font qu'une ou deux collections : à convertir au même patron s'ils rougissent un jour.
- **D-1070-11 — Ce qui reste** : les autres alertes de FR-55 (vol sans plainte, `BLOQUANT` ; les seuils de
  `alertes_instruction`) ne sont pas encore produites par le décompte : chacune, écrite un jour, se lève par la même
  commande ; l'écran « Lever » (front) ; le chiffrage de l'expertise comme repère du motif (FR-61, STORY-1071).

## Contrat annoncé avant le code

Voir le journal de D, « ⚠ Contrats » (2026-11-24, STORY-1070) : une route d'écriture neuve, trois codes de refus, deux
champs ajoutés à la lecture du formulaire, un champ ajouté à l'évaluation arrêtée. Aucun schéma de fait, aucun
manifeste, aucune collection ne change.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan, règles, journaux de A, B, C, D (aucune demande neuve à D) ; fiches 1011, 1013, 1069 ; FR-55, FR-136.
- [x] Code : `prospera-sinistres-service` `MNV-1070` (4e881f0) ; PR **#31**.
- [x] Preuves sans Docker (Node 25) : spec pure et banc mémoire de la story (22/22), lint des fichiers touchés, `tsc` ;
  annonce fusionnée avant le code (#803, `main` 36d4acf).
- [x] Sous le verrou (pris à 13:40) : Node 24 (étage `verification`) lint, suite unitaire complète d'un trait, e2e,
  build, mutations 11/11 et 3/3 ; mesure du banc MongoDB.
- [x] PR de code fusionnées (#31, `dev` 6a0c28d ; #32, le banc MongoDB, `dev` 6002aac) ; rejeu sur l'export
  d'`origin/dev` ; PR de docs finale.

## Ce qui a été livré

**2026-11-24** — trois PR fusionnées en « Rebase and merge » :

- prospera-stories **#803** (`main` 36d4acf) : la fiche, l'entrée du tracker et l'annonce « ⚠ Contrats », **avant le code**.
- prospera-sinistres-service **#31** (`dev` **6a0c28d**) :
  - `evaluation/evaluation.ts` (pur) : `decompteDuMoment` (l'aide commune à l'arrêt, à la levée et à la lecture : tables
    à la date de survenance, dernier enregistrement, calcul fait une fois ; l'arrêt garde son ordre de refus),
    `jugerLaLevee`, `leveeDe` (la levée d'UN enregistrement), `alertesDuFormulaire` ; `jugerLArret` : une alerte levée
    sur l'enregistrement en vigueur ne bloque plus, `ALERTE_BLOQUANTE_NON_LEVEE` nomme les seules non levées,
    `alertesLevees` copiées dans l'évaluation.
  - `instruction/formulaires.ts` : `LeveeDAlerte`, `instruction.levees` (ajout seul ; champ `Mixed` déjà persisté).
  - `partie/partie.ts` : une levée rend son auteur partie (`EVALUER`).
  - `dossiers/` : `leverUneAlerte` (commande du dossier : portée, rôle, fenêtre `LEVEE_IMPOSSIBLE`, cumul, jugement,
    piste `LEVER_ALERTE`, `dossier.changed@1` seul), `POST …/instruction/levees` et `LeveeDto`, codes `ALERTE_ABSENTE`,
    `ALERTE_DEJA_LEVEE`, `LEVEE_IMPOSSIBLE` ; `GET …/instruction` gagne `alertes` et `levees` ; les évaluations lues
    rendent `alertesLevees` (dates en ISO).
  - Tests : `evaluation/levee.spec.ts` (16 purs), six tests de service sur les deux dépôts (mémoire et MongoDB réel),
    un test de `partie`, un invariant de route, un e2e HTTP ; recette versionnée `scripts/recette/1070/mutations-1070.mjs`.
- prospera-sinistres-service **#32** (`dev` **6002aac**, commit séparé de la story, D-1070-10) : le banc MongoDB de
  `dossiers.service.spec.ts` crée sa base une fois et vide ses collections entre deux tests (plus de DDL par test).

## Preuves

- **Node 25** (poste, sans Docker) : `levee.spec` et les tests « 1070 » du service (banc mémoire) 22/22 ; lint des
  fichiers touchés (règle `endOfLine: auto`) 0 ; `tsc --noEmit` 0.
- **Node 24** (étage `verification`, image depuis `git -c core.autocrlf=false archive` de la branche, MongoDB en jeu de
  répliques et Redis réels) : lint 0 ; **suite unitaire complète d'un trait (`-w 2`), délai par défaut de 5 s :
  1366/1366, 68/68 suites, 168 s, aucun délai de crochet** ; e2e **34/34** (4 suites) ; build 0.
- **Mutations** (dans l'image, sur l'assertion, aucune « ne compile pas ») : **11/11** pures et banc mémoire (motif non
  exigé, levée valable pour tous les enregistrements, alerte non bloquante levée, double levée, levée sans effet sur
  l'arrêt, levée non copiée, levée sur le premier enregistrement, formulaire muet, levée non écrite, levée permise en
  validation, auteur hors partie) ; **3/3** sur MongoDB réel (levée non écrite, sans effet, valable partout).
- **Le banc MongoDB** (D-1070-10) : mesuré, `beforeEach` médian 0,52 s seul, 1,58 s à 4 bancs concurrents, 2,83 s à 8
  (p95 3,3 s). Rejeu sur l'export d'`origin/dev` `6a0c28d` (image `--no-cache`) : e2e 34/34, unitaires **1359/1366 : 7
  délais de crochet** (1070 AC-4 et six tests de 1015 à la suite, MongoDB réel) ⇒ #32. Avec le banc corrigé : **1366/1366,
  0 délai, 85 s** ; sous charge de DDL forcée : 6 échecs / 266 s, contre 35 / 791 s pour l'image d'avant.
- **Rejeu sur `origin/dev`** (`6002aac`, image depuis l'export) : lint 0, **unitaires 1366/1366 (68 suites) d’un trait, 0 délai, 80 s**, e2e 34/34, build 0.
- **Pas de pile `grp-d`** (D-1070-9) : aucun module Nest, aucune dépendance, aucun Dockerfile ne change.
- Verrou Docker : pris à 13:40, une seule prise, rendu à 14:34 ; aucun conteneur, volume ni réseau `grp-d` ne reste.

**Reste** (D-1070-11) : les autres alertes de FR-55 (vol sans plainte, `BLOQUANT` ; les seuils d'`alertes_instruction`)
ne sont pas produites par le décompte : chacune se lèvera par la même commande ; l'écran « Lever » ; le chiffrage de
l'expertise comme repère du motif (FR-61, STORY-1071).
