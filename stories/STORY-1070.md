# STORY-1070 : lever une alerte bloquante — le gestionnaire lève avec un motif l'alerte `BLOQUANT` du décompte, et l'évaluation s'arrête

Status: in-progress

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
- **D-1070-10 — Les délais de crochet du banc MongoDB** (piège 1069-1) : la suite complète se joue d'un trait sous
  Node 24 ; si les délais reviennent, la cause est cherchée et corrigée dans un commit séparé (voir « Preuves »).
- **D-1070-11 — Ce qui reste** : les autres alertes de FR-55 (vol sans plainte, `BLOQUANT` ; les seuils de
  `alertes_instruction`) ne sont pas encore produites par le décompte : chacune, écrite un jour, se lève par la même
  commande ; l'écran « Lever » (front) ; le chiffrage de l'expertise comme repère du motif (FR-61, STORY-1071).

## Contrat annoncé avant le code

Voir le journal de D, « ⚠ Contrats » (2026-11-24, STORY-1070) : une route d'écriture neuve, trois codes de refus, deux
champs ajoutés à la lecture du formulaire, un champ ajouté à l'évaluation arrêtée. Aucun schéma de fait, aucun
manifeste, aucune collection ne change.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan, règles, journaux de A, B, C, D (aucune demande neuve à D) ; fiches 1011, 1013, 1069 ; FR-55, FR-136.
- [ ] Code : `prospera-sinistres-service` `MNV-1070`.
- [ ] Preuves sans Docker (Node 25) : unitaires, lint, `tsc`, mutations ; annonce fusionnée avant le code.
- [ ] Sous le verrou : Node 24 (étage `verification`) lint, suite unitaire complète d'un trait, e2e, build, mutations
  MongoDB.
- [ ] PR de code fusionnée ; PR de docs finale.
