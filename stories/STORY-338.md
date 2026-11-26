# STORY-338 : La liaison entre l'écriture comptable et la pièce qui la justifie — descendre jusqu'à la facture

Status: in-progress — écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 11 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat annoncé avant le code (« ⚠ Contrats » du journal de C). Il n'existait pas de
fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-032, STORY-338) et du PRD fiscalité (FR-F54, FR-F53).
Dans la même story : la demande de B **STORY-1124** (publier `comptabilite.facture.desinscrite@1`, D-1100-3 de C).

**Epic :** EPIC-032 · **Points :** 8 · **FR :** FR-F54 (la liaison écriture ↔ pièce, prérequise à toute restitution au
niveau de la facture), FR-F53 (le rapprochement annonce sa granularité) · **Architecture :** AD-14 (le fiscal ne lit
jamais la valeur de provenance d'une balance), D-962-4 (la pièce d'une écriture, vérifiée chez `document-service`),
D-964-3 (une écriture validée est inaltérable)
**Service :** `prospera-comptabilite-service` (C). Lu sans y écrire : `document-service` (B depuis le lot 7 : la pièce du
dossier, route de STORY-962 ; la métadonnée d'une version de la GED, route de STORY-1119, document-service #40).
**Après :** STORY-962 (la saisie et sa pièce justificative), STORY-964 (validation, contre-passation), STORY-1097 et 1098
(des factures aux écritures, la mémoire des choix), STORY-1100 (`comptabilite.facture.inscrite`).
**Suite :** STORY-337 de D (le rapprochement des pièces justificatives, fiscal), qui lit cette liaison (plan §5).

## Histoire

En tant qu'**expert-comptable**, je veux relier une écriture à la pièce qui la justifie, afin de descendre au niveau de la
facture. *(FR-F54)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** une écriture comptable **quand** une pièce lui est rattachée **alors** la liaison est persistée et
   consultable dans les deux sens.
2. **Étant donné** cette liaison disponible **quand** le rapprochement de STORY-337 s'exécute **alors** il peut descendre au
   niveau de la pièce.
3. **Étant donné** l'absence de liaison **quand** le rapprochement s'exécute **alors** il retombe sur la granularité compte ×
   période sans échouer.

## Ce que le code porte déjà (lu sur `origin/dev` `e4a53cc`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| La pièce de la saisie (962) | chaque écriture porte **une** `pieceJustificative` `{ pieceId, documentId, type, verifieeLe }`, vérifiée dans le dossier chez `document-service` à la saisie et à chaque correction (`PIECE_JUSTIFICATIVE_INCONNUE`, `DOCUMENTS_INDISPONIBLES`) | `ecritures/ecriture.schema.ts`, `source-des-pieces.ts` |
| Les écritures nées du programme | la contre-passation recopie la pièce de l'originale ; l'écart de lettrage celle de la ligne la plus récente ; les à-nouveaux d'une clôture portent une pièce **interne** `CLOTURE-<clotureId>` (`type: PIECE_DE_CLOTURE`) | `validation.service.ts`, `lettrage.service.ts`, `cloture.service.ts` |
| Le grand livre (966) | chaque mouvement rend le `pieceId` de son écriture | `grand-livre.service.ts` |
| Les factures (1097, 1100) | la pièce du lot (`pieceId` = SHA-256 du fichier) porte `inscription.ecritureId` ; l'abandon du brouillard rend la facture inscriptible (`MemoireDesChoixService.surAbandon`) **sans aucun fait** : la GED garde sa copie (D-1100-3) | `factures/`, `memoire/` |

**Ce qui manque** : la liaison ne va que dans un sens (on ne sait pas quelles écritures une pièce justifie) ; une écriture
n'a qu'une pièce, choisie à la saisie, et une écriture validée n'en reçoit plus ; rien ne se lit par compte et par période
pour le rapprochement de 337 ; rien ne cite une pièce du fonds d'archives (GED) ; l'abandon d'un brouillard né d'une
facture ne se dit pas à la GED (demande de B, STORY-1124).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls** : cinq routes neuves, une collection neuve, un fait publié neuf. Aucun champ existant ne change ; aucun
droit neuf ; manifeste `comptabilite` **0.6.0**.

### La liaison (AC-1)

Une écriture est justifiée par **sa pièce de saisie** (inchangée, `origine: SAISIE`) et par des **pièces rattachées**
(`origine: RATTACHEMENT`), dans la collection neuve **`liaisons_pieces`**, en ajout seul (un retrait se marque, rien ne
s'efface), hors de l'écriture : une écriture validée n'est jamais réécrite (D-964-3).

- **`POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ecritures/{ecritureId}/pieces`** — droit
  `comptabilite:ecriture:saisir`. Corps : `{ source: "DOSSIER", pieceId, lignes? }` (une pièce du dossier chez
  `document-service`, vérifiée comme à la saisie) **ou** `{ source: "GED", gedPieceId, gedVersion, lignes? }` (une version du
  fonds d'archives du cabinet, lue par `GET /api/v1/ged/cabinet/pieces/{gedPieceId}/versions/{gedVersion}`, jeton du membre :
  du **même dossier**, `etat: CONSERVEE`, son empreinte retenue, jamais le contenu). `lignes` : les numéros (1 à N) des lignes
  justifiées ; absent : toute l'écriture. Brouillard ou validée ; exercice ouvert, tenu au journal, non clôturé (la porte du
  brouillard). **201** la liaison ; acte de piste `PIECE_RATTACHEE` dans la même transaction.
  Refus : 400 corps ; 403 communs, `DROIT_INSUFFISANT` ; 404 `ECRITURE_INTROUVABLE`, `EXERCICE_NON_OUVERT` ; 409
  `EXERCICE_CLOS`, `EXERCICE_TENU_AUX_CAHIERS`, **`PIECE_DEJA_RATTACHEE`** (`details.origine`, `details.liaisonId`) ; 422
  `PIECE_JUSTIFICATIVE_INCONNUE` (`details.source`, `details.pieceId`), **`LIGNE_INCONNUE`** (`details.ligne`),
  **`PIECE_GED_NON_CONSERVEE`** (`details.etat`) ; 503 `DOCUMENTS_INDISPONIBLES`.
- **`POST …/ecritures/{ecritureId}/pieces/{liaisonId}/retrait`** — même droit, même porte ; corps `{ motif }` (1 à 500
  caractères). **200** la liaison retirée (`retrait: { le, par, motif }`) ; acte `PIECE_RETIREE`. Refus : 404
  **`LIAISON_INTROUVABLE`** ; 409 **`LIAISON_DEJA_RETIREE`**. La pièce de saisie ne se retire pas (elle n'a pas de
  `liaisonId`) : elle se change par la correction du brouillard.
- **`GET …/ecritures/{ecritureId}/pieces`** (lecture, `comptabilite:dossier:consulter` comme toute lecture) — l'écriture →
  ses pièces : `{ ecritureId, statut, numero?, numeroProvisoire?, pieces: [Piece], retirees: [Piece & { retrait }] }`, avec
  `Piece = { origine: SAISIE | RATTACHEMENT, liaisonId | null, source: DOSSIER | GED, pieceId, documentId | null, type |
  null, gedVersion | null, empreinte | null, nature: DOCUMENT | CLOTURE, lignes: number[] | null, rattacheeLe,
  rattacheePar }` (la pièce de saisie en tête ; `lignes: null` = toute l'écriture).
- **`GET /api/v1/dossiers/{dossierId}/pieces/{pieceId}/ecritures?source=DOSSIER|GED`** — la pièce → ses écritures, **tous
  exercices du dossier** : `{ source, pieceId, ecritures: [{ ecritureId, exerciceId, journal, statut, numero?,
  numeroProvisoire?, dateEcriture, libelle, devise, origine, liaisonId | null, lignes: [{ ligne, compte, debit, credit }] }],
  tronquee }` (les lignes que la pièce justifie ; 200 écritures au plus, par date). `source` absent : `DOSSIER`.

### La lecture du rapprochement (AC-2, AC-3)

- **`GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/pieces/justification?comptes=4431,4452&du=&au=&devise=`** —
  pour STORY-337. Sur les seules écritures **validées** (ce que la balance publie, Q2), pour chaque compte demandé (**préfixe**
  du plan, 1 à 20, `445` couvre `4452` et `44521`) et la période (`du`, `au` inclus, par défaut les bornes de l'exercice) :
  `{ granularite: "PIECE", dossierId, exerciceId, periode: { du, au }, devise, comptes: [{ compte, mouvements, documente,
  aNouveaux, nonDocumente, pieces: [{ source, pieceId, documentId | null, type | null, gedVersion | null, debit, credit,
  lignes, ecritures: [ecritureId] }] }] }`, où `mouvements`, `documente`, `aNouveaux`, `nonDocumente` = `{ debit, credit,
  lignes }`. Une ligne est **documentée** si au moins une pièce de nature `DOCUMENT` la couvre ; les lignes d'à-nouveaux
  (pièce de clôture) se comptent à part ; `nonDocumente` dit le reste (vide aujourd'hui par construction, D-962-4, et
  toujours rendu). Une pièce qui couvre une ligne la compte une fois ; une ligne couverte par deux pièces compte dans
  chacune, et une seule fois dans `documente`.
- **Absence de liaison** (AC-3) : un exercice **qui n'est pas tenu au journal ici** rend **200** `{ granularite:
  "COMPTE_PERIODE", raison: "EXERCICE_TENU_AUX_CAHIERS" | "EXERCICE_NON_TENU_ICI", comptes: [] , … }` : le résultat le dit,
  jamais un zéro ; l'appelant retombe sur le compte × la période. Un compte sans mouvement rend ses quatre totaux à zéro et
  `pieces: []` (« aucune écriture », pas « tout est documenté »).
- Refus : 400 `COMPTES_MALFORMES` (vide, plus de 20, un préfixe hors du motif du plan) ; 404 ; 409 `DEVISE_A_PRECISER` ; 422
  `PERIODE_INVALIDE`, `PERIODE_HORS_EXERCICE`.
- **Pour STORY-337 (D)** : appel avec le **jeton du membre** (comme le fiscal appelle `balance-service`). Ce que le
  rapprochement retombe sur le compte × période sans échouer : `granularite: COMPTE_PERIODE` ; **403**
  `COMPTABILITE_NOT_ENTITLED` (le cabinet n'a pas la comptabilité) ; **404** `DOSSIER_INTROUVABLE`, `EXERCICE_INTROUVABLE` ;
  **5xx** et délai dépassé. La granularité annoncée est celle de la réponse.

### ← B (STORY-1124) : `comptabilite.facture.desinscrite` v1

À l'**abandon d'un brouillard né d'une facture** (la pièce du lot qui portait `inscription.ecritureId`, trouvée par
`surAbandon`), dans la **transaction de l'abandon**, par l'outbox : topic `comptabilite.facture.desinscrite`, clé
`organisationId`, en-têtes `eventId` et `schemaVersion` posés par le relais. Charge : `{ eventId, schemaVersion: 1,
organisationId, dossierId, exerciceId, ecritureId, numeroProvisoire, lotId, pieceId, motif: "BROUILLARD_ABANDONNE",
desinscriteLe, desinscritePar }`, tous requis — ni montant, ni tiers, ni ligne. Schéma
`contrat/schemas/comptabilite.facture.desinscrite.v1.json` : **la copie à l'octet** du schéma proposé par B
(`prospera-ocr-service/contrat/consommes/comptabilite.facture.desinscrite.v1.json`, `dev` `e51c4d5`, sha256
`86a50e6f…2ecf`) ; sujet neuf au registre en BACKWARD. Un brouillard qui n'est pas né d'une facture ne publie rien.

### Manifeste `comptabilite` 0.6.0

`publie` + `comptabilite.facture.desinscrite` ; `routesLectureSeule` + les trois lectures (`…/ecritures/{ecritureId}/pieces`,
`…/pieces/{pieceId}/ecritures`, `…/pieces/justification`). Droits inchangés (neuf). **→ B** : recopie au catalogue.

## Décisions (contestables)

- **D-338-1 — La pièce de saisie reste la liaison principale.** Elle est vérifiée et datée (D-962-4) ; 338 ne la récrit pas et
  la lit comme la première liaison de l'écriture. Les rattachements vivent hors de l'écriture (`liaisons_pieces`) : une
  écriture validée en reçoit sans être touchée (D-964-3).
- **D-338-2 — Deux sources de pièce.** `DOSSIER` (les pièces du dossier chez `document-service`, la route et le contrat de la
  saisie) et `GED` (une version du fonds d'archives, la lecture des métadonnées servie par B en #40). La GED se vérifie : même
  dossier, `CONSERVEE` (une version `DETRUITE` ou `RETIREE` ne justifie plus rien de neuf), empreinte de 64 hexadécimaux
  retenue (comparée sans préfixe `sha256:`). Ni contenu, ni texte lu, ni nom de fichier.
- **D-338-3 — La portée d'un rattachement : l'écriture, ou certaines de ses lignes.** FR-F54 parle de la ligne ; un relevé de
  banque règle plusieurs factures. Un numéro de ligne hors de l'écriture : `LIGNE_INCONNUE`. Si les lignes d'un brouillard
  changent à la correction, une liaison qui cite une ligne disparue ne couvre plus rien (la lecture le dit par `lignes`).
- **D-338-4 — Rattacher et retirer sont des gestes d'écriture** : droit `comptabilite:ecriture:saisir` (aucun droit neuf), la
  porte du brouillard (exercice ouvert, tenu au journal, non scellé par la clôture). Documenter un exercice clôturé passe par
  sa réouverture, comme le lettrage (D-970).
- **D-338-5 — Un doublon actif est refusé** (`PIECE_DEJA_RATTACHEE`, la pièce de saisie comprise, ou la même version de la GED) :
  on retire d'abord. L'unicité tient sous la concurrence (index unique partiel sur les liaisons en vigueur).
- **D-338-6 — L'abandon d'un brouillard retire ses liaisons** (`motif: BROUILLARD_ABANDONNE`), dans sa transaction.
- **D-338-7 — La contre-passation ne recopie que la pièce de saisie** (comme aujourd'hui) : les rattachements de l'originale
  restent lisibles sur elle.
- **D-338-8 — Le rapprochement lit les validées seules**, par préfixe de compte, sur une période ; les à-nouveaux se comptent à
  part (leur justificatif est l'exercice précédent) ; une ligne couverte deux fois n'est documentée qu'une fois.
- **D-338-9 — L'absence de liaison est une réponse, pas une erreur** (AC-3) : `granularite: COMPTE_PERIODE` et sa raison quand
  l'exercice n'est pas tenu au journal ici. 338 ne touche pas le fiscal : le rapprochement est à 337 (D), qui lit cette route ;
  la descente jusqu'à la pièce d'une balance des **cahiers** reste celle de 329 (provenance de `balance-service`, D-329-6).
- **D-338-10 — ← B (1124) : le schéma de B tel quel**, copié à l'octet ; le fait part seulement si `surAbandon` trouve la pièce
  du lot, dans la transaction de l'abandon (pas d'abandon sans fait, pas de fait sans abandon).
- **D-338-11 — `REJET_REQUIS` (D-334-8 de D) passe à STORY-340** : MNV-334 (fiscal #82) n'est pas fusionnée quand 338 commence,
  et 338 ne touche pas le fiscal.
- **D-338-12 — La demande de A (FE-158, cinq points de commodité de l'écran)** n'entre pas dans 338 : elle n'a pas trait à la
  liaison et l'écran tient sans ; elle reste ouverte, à placer par la session de groupe (aucune autre story de C au lot 7
  n'ouvre la comptabilité).
