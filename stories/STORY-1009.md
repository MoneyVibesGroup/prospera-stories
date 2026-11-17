# STORY-1009 : demander des pièces complémentaires pendant l'instruction

Status: done

**Complexité :** moyenne (un paramètre figé, un jugement pur, un effet de la transition 6 et 12, un champ de plus aux pièces et aux courriers)

**Épic :** EPIC-207 (instruire le dossier)
**Dépôt :** `prospera-sinistres-service` (module `sinistres`) ; aucun fait neuf, aucune route neuve (la demande se joint à la transition)
**Plage :** groupe C, n° 6 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1002 (affectation : le titulaire reste).
Ancrage : FR-57 (transition 6, demande du `RESP` avant validation = transition 12 / FR-80), FR-46 (courrier de demande), FR-47 et
STORY-999 (relances), FR-85 (suspensions : seule la date de présentation est conservée ici).

---

## Pourquoi

STORY-1001 pose la liste des pièces attendues à l'ouverture et STORY-999 relance le tiers qu'un dossier `PIECES_ATTENDUES`
attend. Mais pendant l'instruction, un gestionnaire s'aperçoit qu'il lui manque une pièce (devis corrigé, certificat de
consolidation…) : la machine a déjà la transition 6 (`EN_INSTRUCTION → PIECES_ATTENDUES`) et la 12 (`EN_VALIDATION →
PIECES_ATTENDUES`), mais elles ne disent **ni quelles pièces, ni pourquoi** : le dossier « revient en attente » sans rien
à attendre, et ne peut jamais reprendre (le constat `PIECES_COMPLETES` reste vrai). Cette story fait de la demande une
partie de la transition : les pièces nommées s'ajoutent à la liste, chacune avec son motif, la date de présentation et
l'auteur ; le courrier de demande est préparé ; les relances de 999 courent.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **La liste s'allonge avec un motif** : la transition 6 (GEST, GREC, RESP) ou 12 (RESP, COMITE, DT, DG) porte `piecesDemandees` (code, destinataire facultatif, motif) ; chaque pièce s'ajoute aux pièces attendues, **obligatoire**, à l'état `ATTENDUE`, avec son motif, la date de présentation, son auteur et le numéro de la demande ; le constat `PIECES_COMPLETES` repasse à faux | tests du service, deux bancs |
| AC-2 | ⛔ **Sans pièce nommée, refus** : `PIECES_NON_NOMMEES` (400, tracé) ; code hors catalogue `PIECE_INCONNUE` (400), pièce en double dans la demande `PIECE_EN_DOUBLE` (400), plus de 10 pièces `PIECES_TROP_NOMBREUSES` (400), motif absent ou de moins de 10 caractères `MOTIF_ECRIT` (400), pièce déjà attendue `PIECE_DEJA_ATTENDUE` (409) ; `piecesDemandees` sur une autre transition : `PIECES_HORS_DEMANDE` (400). Un refus ne change ni la liste ni le statut | tests ; e2e par HTTP |
| AC-3 | **Le courrier de demande** (FR-46) est préparé : un `DEMANDE_PIECES` par destinataire des pièces demandées (assuré, administration, expert, tiers), en `BROUILLON` | test |
| AC-4 | **Les relances de 999 la reprennent** : le dossier porte l'attente `PIECES` de l'assuré depuis la demande, la relance due court (5 jours), une relance se saisit ; un dossier dont trois relances d'une demande précédente étaient sans effet recommence à zéro (la reprise les avait levées) ; à la reprise (transition 3, pièces reçues) les relances sont levées | tests |
| AC-5 | **La liste, la reprise et l'accusé** : la dernière pièce demandée validée au contrôle (`ged`) rétablit `PIECES_COMPLETES` ; la reprise (transition 3) conserve le gestionnaire (H-047) ; l'accusé du dossier complet de 1007 **n'est pas reposé** ; une pièce demandée puis rejetée au contrôle redevient attendue **avec son motif** | tests |
| AC-6 | **La demande est horodatée, sa réponse aussi** : `demandeeLe` et `recueLe` sur la pièce, rendus en ISO dans la vue ; la ligne d'audit de la transition nomme les pièces ; la demande rejouée (même clé) rend la même réponse sans rien ajouter | tests ; Mongo réel |
| AC-7 | **Les gardes déjà livrées s'appliquent** : la portée de 1004 (un dossier hors portée est introuvable), le rôle exercé, la version lue, l'idempotence, les cumuls de 1003 ; le paramètre est figé par empreinte | tests ; e2e |

## Décisions retenues par défaut (contestables)

- **D-1009-1 — Pas de route neuve : la demande se joint à la transition 6 ou 12** (`piecesDemandees` dans le corps de
  `POST …/transitions`). FR-57 dit que « la transition liste les pièces demandées » et se refuse sans pièce nommée : une
  demande qui ne change pas le statut n'aurait pas de sens, et une seconde route aurait pu contourner la machine. Donc
  aucun ajout au manifeste (une écriture n'y figure pas), pas de nouveau fait ; la table des transitions (figée) ne change
  pas : le refus `PIECES_NON_NOMMEES` est jugé par le service, après la machine.
- **D-1009-2 — Les pièces demandées sont obligatoires.** Le dossier revient en attente de pièces pour les recevoir : une
  pièce facultative n'empêcherait pas la reprise. Elles n'entrent donc pas dans les « complémentaires » du type (qui
  restent facultatives).
- **D-1009-3 — Le catalogue est celui de `pieces-2026.1`** (tout code qu'il cite : obligatoires, complémentaires,
  destinataires, médicales). Une pièce hors catalogue (« autre pièce », texte libre) n'est pas admise dans cette story :
  elle serait une pièce sans type, que ni `ged` ni la reprise ne savent rapprocher. Écart nommé : un code libre viendra
  avec un catalogue enrichi (paramètre `pieces-2026.2`).
- **D-1009-4 — Le motif est celui de la pièce, à défaut celui de la transition** (au moins 10 caractères, comme
  `LONGUEUR_MIN_DU_MOTIF`) ; la transition 12 exige déjà son motif.
- **D-1009-5 — Une pièce déjà attendue n'est pas redemandée** (`PIECE_DEJA_ATTENDUE`) ; une pièce déjà reçue peut l'être
  (nouvelle version : certificat mis à jour) : elle devient une ligne de plus, attendue.
- **D-1009-6 — L'attente reste celle de l'assuré** (`ATTENTES_PAR_STATUT` de 999 inchangé) : même une pièce que
  l'assuré obtient d'une administration (procès-verbal) est relancée auprès de l'assuré ; le courrier, lui, part au
  destinataire de la pièce.
- **D-1009-7 — La suspension des délais légaux du corporel (FR-85) n'est pas posée ici** : seule la **date de
  présentation** est conservée (`demandeeLe`), comme FR-57 le demande « pour le calcul des suspensions ». La suspension
  automatique appartient au décompte du délai d'offre (FR-85, story d'EPIC-209) ; la suspension manuelle (989) reste
  possible.
- **D-1009-8 — La ligne d'audit nomme les pièces** (« Pièces demandées : … ») avant le motif écrit, pour que la piste
  dise ce qui a été demandé sans lire le dossier.
- **D-1009-9 — Un paramètre figé** `demande-de-pieces-2026.1.json` (transitions qui portent une demande, 10 pièces au
  plus, motif de 10 caractères au moins), empreinte sha256 testée.
- **D-1009-10 — Quitter l'attente lève aussi le constat `RELANCES_EPUISEES`** (correctif d'une interaction avec 999) : la
  reprise lève les relances (« effet : TRANSITION ») mais le constat restait vrai ; une nouvelle demande de pièces aurait
  donc ouvert le classement sans suite (transition 26) sans qu'aucune relance n'ait été faite sur elle. Le constat est
  recalculé à la transition, seulement quand il était vrai.
- **D-1009-11 — Une pièce rejetée au contrôle garde son motif et sa demande** (correctif de `rejeterLaPiece`, qui ne
  gardait que le code, l'obligation et le destinataire) ; seule la réception (`pieceId`, `recueLe`) s'efface.

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#20** (`dev` `12ef41d`, un commit rejoué), fusionnée en « Rebase and merge » :

- `ouverture/demande-de-pieces.ts` (pur : `jugerLaDemandeDePieces`, `catalogueDesPieces`) et
  `demande-de-pieces-2026.1.json` (transitions `6` et `12`, 10 pièces au plus, motif de 10 caractères au moins ;
  empreinte sha256 testée). `PieceAttendue` gagne `motif`, `demandeNumero`, `demandeeLe`, `demandeePar`, `demandeeRole`
  (facultatifs).
- `dossiers.service.ts` : `transitionner` juge la demande après la machine, range les pièces, pose
  `PIECES_COMPLETES = false`, prépare le courrier `DEMANDE_PIECES` par destinataire, nomme les pièces dans la ligne
  d'audit, trace les refus ; `TransitionDto` accepte `piecesDemandees` (liste blanche, 100 au plus avant jugement).
  Refus nouveaux : `PIECES_NON_NOMMEES`, `PIECES_HORS_DEMANDE`, `PIECES_TROP_NOMBREUSES`, `PIECE_INCONNUE`,
  `PIECE_EN_DOUBLE`, `DESTINATAIRE_INCONNU` (400), `PIECE_DEJA_ATTENDUE` (409), plus `MOTIF_ECRIT` déjà connu.
- **Tests** : 8 purs (`demande-de-pieces.spec.ts`), 8 du service sur les deux bancs (mémoire, MongoDB réel) — pièces
  ajoutées, refus tracés, rejeu, relances reprises, reprise (gestionnaire gardé, accusé non reposé, classement sans suite
  refusé), validation et rejet, portée de 1004, transition 12 —, 1 e2e par HTTP. Trois mutations (constat des relances,
  refus « sans pièce », motif de la pièce rejetée) : chacune rougit sur l'assertion.
- **Node 24** (étage `verification`, image construite depuis `git archive`, MongoDB réel en jeu de répliques) : lint 0,
  1080 unitaires (54 suites + 1 sautée), 25 e2e, build 0. **Rejouée depuis `dev`** (export d'`origin/dev` 12ef41d, arbre identique à la
  branche) : mêmes chiffres (lint 0, 1080 unitaires, 25 e2e, build 0), du premier coup.
- **Pas de pile** (plan : « Docker : non ») : aucun module Nest, fournisseur ni import ne change ; le graphe d'injection
  et les invariants de câblage passent à la vérification. **Aucune route neuve, aucun fait neuf** : pas de manifeste à
  amender.

**Reste**
- **La suspension automatique des délais légaux du corporel** (FR-85) à la présentation de la demande : seule la date
  est conservée ; la suspension appartient au décompte du délai d'offre (EPIC-209), la manuelle (989) reste possible.
- **Une pièce hors catalogue** (texte libre) : catalogue enrichi (`pieces-2026.2`).
- **L'envoi du courrier de demande** et sa copie archivée : EPIC-220 (`notification`, groupe D).
- **L'écran** : la liste `transitionsPossibles` ne dit pas que 6 et 12 demandent des pièces ; l'écran (D) doit les
  collecter (code, motif, destinataire) avant d'envoyer.
