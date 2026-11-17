# STORY-1008 : la provision d'ouverture posée à l'ouverture

Status: done

**Complexité :** petite (un paramètre figé, une fonction pure, un effet de la transition d'ouverture, un champ au dossier)

**Épic :** EPIC-206 (déclarer, ouvrir et attribuer)
**Dépôt :** `prospera-sinistres-service` (le port vers `assurance` existe depuis STORY-994 : le fait `sinistres.provision.revisee@1`)
**Plage :** groupe C, n° 4 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1001 et STORY-994.
Ancrage : FR-49, D-1001-5 (« la provision d'ouverture posée automatiquement (la commande de STORY-994 la propose déjà) »),
D-994-1 (« la provision d'ouverture posée par la commande d'ouverture viendrait avec 1001 »).

---

## Pourquoi

STORY-994 a donné à `sinistres` une route qui PROPOSE une provision (`POST …/provision`, motif `OUVERTURE`) et à
`assurance` le seul droit d'écrire les mouvements (grille par volet et gravité, arrondi à 5 000 FCFA, `DEJA_OUVERTE`).
Mais rien ne la déclenche : un dossier ouvert reste sans provision tant qu'un agent n'y pense pas, alors que FR-49 veut
une provision **posée à l'ouverture, sans attendre les pièces**. Cette story fait de l'ouverture elle-même l'acte qui
propose la provision d'ouverture, dans la même écriture que la transition.

**Source** : PRD FR-49 (provision d'ouverture, y compris en attente de pièces ; corporel saisi par l'humain), FR-76,
FR-188 ; annexe D (`arrondi_provision_fcfa`, `provision.grille_ouverture`) ; spine AD-11 (`sinistres` propose,
`assurance` écrit seul) ; STORY-994 (grille et contrat), STORY-1001 (ouverture).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | La transition d'**ouverture** d'un dossier `MATERIEL` ou `RISQUES_DIVERS` (1 : `DECLARE → OUVERT`, 2 : `DECLARE → PIECES_ATTENDUES`, 3 : rattrapage `PIECES_ATTENDUES → OUVERT`) PROPOSE la provision d'ouverture : `sinistres.provision.revisee@1`, motif `OUVERTURE`, volet et gravité de la déclaration (la grille, l'arrondi à 5 000 et le milieu de tranche restent chez `assurance`) ; le fait part par l'outbox **dans la transaction** de la transition | tests du service sur les deux bancs ; fait lu et validé contre le schéma |
| AC-2 | Une **estimation du déclarant** saisie est proposée à la place de la gravité (conservée comme source chez `assurance`) | test |
| AC-3 | **Rejouer** l'ouverture ne pose rien deux fois : la même clé d'idempotence rejoue la réponse sans fait ; la transition 3 après la 2 ne repose rien ; la provision posée est rangée au dossier (`provisionOuverture`) ; l'identifiant de la proposition est dérivé du dossier, donc un fait rejoué est « déjà tenu » chez `assurance` | tests ; Mongo réel |
| AC-4 | Le **corporel** et le **recours** ne reçoivent aucune proposition automatique (FR-49 : la provision d'ouverture corporelle est saisie par l'humain avec motif) ; un dossier sans estimation ni gravité non plus | tests |
| AC-5 | Une transition qui n'est pas une ouverture (prise en instruction, évaluation…) ne propose rien ; une transition **refusée** non plus | tests |
| AC-6 | `assurance` reste le **seul écrivain des mouvements** : `sinistres` ne calcule ni n'écrit aucun montant ; une proposition d'ouverture saisie à la main par la route de 994 range aussi le marqueur, l'ouverture automatique ne s'y ajoute pas | tests ; paramètre figé par empreinte |
| AC-7 | **Aucun fait neuf** : même sujet, même schéma, même enveloppe | invariant `faits-au-contrat` |

## Décisions retenues par défaut (contestables)

- **D-1008-1 — « L'ouverture » = les transitions 1 et 2 (sortie de `DECLARE` vers `OUVERT` ou `PIECES_ATTENDUES`),
  plus la 3 en rattrapage.** FR-49 dit « à l'ouverture, y compris en attente de pièces » : la transition 2 est
  l'ouverture en attente de pièces, elle pose donc la provision. La transition 3 (reprise, pièces reçues) ne repose
  rien quand la provision a déjà été posée ; elle ne sert qu'à rattraper un dossier ouvert avant cette story. La liste
  des transitions, des volets et la devise sont un **paramètre figé** (`provision-ouverture-2026.1.json`, empreinte
  sha256 testée), pas des constantes du code.
- **D-1008-2 — Le corporel (et le recours) est exclu.** Le plan écrit « grille par volet et gravité », mais FR-49 et la
  ligne 443 du PRD disent que la machine ne calcule **aucun milieu de tranche pour un préjudice corporel** : la
  provision corporelle est saisie par l'humain avec un motif, par la route de STORY-994. Le recours n'a pas de grille.
  (`assurance` sait calculer le corporel : c'est la route manuelle qui l'y envoie, jamais l'ouverture.)
- **D-1008-3 — Qui propose.** L'auteur est l'agent qui a ouvert ; le rôle porté par le fait est `RESP` si le dossier est
  ouvert par un `RESP`, sinon `GEST` (le schéma de 994 n'admet que ces deux rôles ; l'ouverture est exemptée du seuil
  glissant et du contrôle du `RESP` chez `assurance`, le rôle n'y change donc rien). Un `ACC` ou un `GREC` qui ouvre
  produit une proposition « au nom » du `GEST`.
- **D-1008-4 — Estimation avant gravité, jamais les deux.** Si le déclarant a donné une estimation entière, elle part ;
  sinon la gravité. Sans l'une ni l'autre, rien ne part (pas d'erreur : l'ouverture n'est jamais bloquée par la
  provision). ⚠️ Le dossier sans provision depuis l'ouverture est « une anomalie remontée au `RESP` » (FR-49) : cette
  alerte reste à écrire (écart nommé).
- **D-1008-5 — La devise est celle de la grille d'`assurance` (`XOF`)**, posée dans le paramètre figé (AD-11 : aucune
  devise par défaut dans le code) ; `assurance` refuse une autre devise sur la grille (`DEVISE_INCOHERENTE`).
- **D-1008-6 — Identifiant de proposition dérivé** (`ouverture-<dossierId>`) : un fait rejoué ou posé deux fois est
  `DEJA_TENUE` chez `assurance`, en plus du marqueur du dossier. Pas de preuve inter-services neuve : 994 a déjà prouvé
  `assurance` sur pile (grille, `DEJA_OUVERTE`, ajout seul) et le fait ne change pas ; la preuve de cette story est le
  fait émis, validé contre le **schéma de 994** (invariant `faits-au-contrat`) et le rejeu.
- **D-1008-7 — Pas de ligne d'audit propre** : l'ouverture écrit déjà sa ligne de transition ; la proposition est
  tracée par le marqueur `provisionOuverture` du dossier (identifiant, instant, source) et par l'outbox.

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#18** (`dev` `f9fe2f4`, deux commits rejoués), fusionnée en « Rebase and merge » :

- `ouverture/provision-ouverture.ts` (pure) et `provision-ouverture-2026.1.json` (transitions `1`, `2`, `3` ; volets
  `MATERIEL`, `RISQUES_DIVERS` ; devise `XOF` ; empreinte sha256 testée) : `provisionDOuverture(...)` décide si
  l'ouverture propose, et quoi (estimation entière, sinon gravité) ; `propositionDOuvertureDe`, `roleDeLaProposition`.
- `dossiers/dossiers.service.ts` : `transitionner` range `provisionOuverture` au dossier et publie
  `sinistres.provision.revisee@1` (motif `OUVERTURE`) dans la même transaction que la transition ; `proposerProvision`
  (route de 994) range le même marqueur (`SAISIE`) quand le motif est `OUVERTURE` ; la vue du dossier le montre.
  `Dossier`, schéma Mongoose et lecture Mongo gagnent le champ facultatif `provisionOuverture`.
- **Tests** : 7 purs (`provision-ouverture.spec.ts`) et 5 du service sur les deux bancs (mémoire, MongoDB réel) :
  gravité, estimation, rejeu (même clé, ouverture 2 puis reprise 3, ouverture manuelle déjà faite), corporel / recours /
  sans donnée, transition refusée ; le fait d'ouverture automatique est ajouté à l'invariant `faits-au-contrat`
  (schéma de 994, Ajv). Mutation : l'émission neutralisée fait rougir trois tests sur leur assertion.
- **Node 24** (étage `verification`, image construite depuis `git archive`, MongoDB réel en jeu de répliques) : lint 0,
  997 unitaires (50 suites, 1 sautée : la suite Redis), 19 e2e, build 0. Au premier passage, un test du banc Mongo
  comparait le fait par égalité stricte (l'enveloppe de l'outbox s'y ajoute) : corrigé (`toMatchObject`).
- Aucun module Nest, aucune dépendance, aucun Dockerfile ni aucune route ne change : pas de pile (règle de légèreté du
  lot 3, §5). Aucune preuve inter-services neuve (D-1008-6) : le fait est celui de 994, validé contre son schéma, et
  `assurance` a déjà été prouvée sur pile contre ce fait (grille, `DEJA_OUVERTE`, ajout seul).
- **Rejouée depuis `dev`** (export d'`origin/dev` `f9fe2f4`, arbre identique à la branche) : au 3e passage, lint 0,
  997 unitaires sur MongoDB réel, 19 e2e, build 0. Les deux premiers passages ont rougi sur des tests Mongo **sans
  rapport** (portée réseau « RESTREINTE », idempotence de 1002, création de 988 ; une autre à chaque fois, suites de 120
  à 136 s au lieu de 87 s, poste chargé par le groupe A) : non reproduits ensuite.

**Reste**
- **L'alerte « dossier sans provision depuis l'ouverture »** remontée au `RESP` (FR-49) : un dossier sans gravité ni
  estimation, ou corporel, n'a pas de provision tant qu'un agent ne la saisit pas ; l'alerte reste à écrire.
- **La lecture** de `assurance.provision.changed@1` par `sinistres` (afficher la provision en vigueur sur le dossier) :
  non faite (D-994-1 la rattachait à l'ouverture ; ici `sinistres` propose seulement et range le marqueur de ce qu'il a
  proposé, jamais un montant).
- **Le corporel** : la saisie humaine avec motif passe par la route de 994 ; aucun écran avant la coque.
- Le courtier et les coassureurs informés à l'ouverture (FR-48) ; l'envoi de l'accusé (EPIC-220, D).

