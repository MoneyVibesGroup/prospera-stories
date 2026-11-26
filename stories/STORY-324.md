# STORY-324 : La validation du client capturée comme pièce — l'accord du client, opposable, sans lui ouvrir l'application

Status: in_progress — écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 6 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-031, STORY-324) et de la
salle des cabinets (V6, `salle-cabinets-validations-2026-11-19.md`).

**Epic :** EPIC-031 · **Points :** 3 · **FR :** FR-F35 (PRD fiscalité v0.4 §7.7, §5 : « la société cliente n'a pas
d'accès applicatif en v1 ») · **Architecture :** AD-9 (ce qui est consigné ne se récrit pas), AD-10 (journal chaîné, aucun
texte libre), AD-17 (un champ humain survit à la re-dérivation), AD-21 (aucune donnée personnelle de tiers hors de la
rémunération)
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas).
`document-service` (à **B** depuis le lot 7) est **lu par le cabinet, jamais par le fiscal** : aucune PR chez lui
(D-324-3, demande à B ci-dessous).
**Après :** STORY-323 (le cycle et le visa, #54), STORY-322 (le triplet, #56), STORY-321 (#72).
**Suite :** **STORY-325** (rectificatives versionnées, immuabilité, clôture) fige ce modèle sans le refaire (D-324-12) ;
**STORY-330 de D** attend 325 ; STORY-333 (D, l'accusé lié à l'obligation) passe par la même porte (D-324-7) ; STORY-336
(D, le dossier de contrôle) lit la pièce.

## Histoire

En tant qu'**expert-comptable**, je veux consigner l'accord du client sans lui ouvrir l'application, afin que la
validation reste opposable. *(FR-F35)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-031)

1. **Étant donné** un dossier exigeant la validation du client **quand** aucune pièce de validation n'est déposée **alors**
   l'obligation ne peut pas atteindre « Déposée ».
2. **Étant donné** une pièce de validation (document signé, courriel, ou mention manuelle) **quand** elle est enregistrée
   **alors** elle est horodatée et attribuée à celui qui la consigne.
3. **Étant donné** la société cliente **quand** on cherche son accès applicatif **alors** il n'en existe aucun.

Et la salle (V6) :

4. **Étant donné** l'accord du client reçu en capture WhatsApp ou par courriel **quand** il est consigné **alors** il est
   accepté comme pièce, au même titre qu'un document signé, en un seul geste.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `493a817`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le cycle (323) | onze états ; `A_DEPOSER → DEPOSEE` exige `fiscalite:declaration:deposer` ; visa exigé à `VALIDEE → A_DEPOSER` ; les gardes d'une transition entrent dans la condition d'écriture (`garde`, 328) | `domain/obligations/cycle.ts`, `cycle-obligations.service.ts` |
| Le déclaré (322) | `montantDeclare` remplaçable jusqu'à `A_DEPOSER`, figé dès le dépôt | `domain/obligations/triplet.ts` |
| La GED du cabinet (B) | `POST /api/v1/ged/cabinet/pieces` (multipart) range une pièce au fonds d'un dossier, chiffrée ; empreinte SHA-256 en 64 hexadécimaux (`ged.piece.recue`) | `document-service`, module `ged` |
| Le journal chaîné | une chaîne par périmètre (`obligation:<id>`, `organisation:<id>`…), aucun texte libre (`empreinteTexte`) | `domain/audit/chaine-audit.ts` |
| Les routes publiques | `health`, `coffre/depots`, `coffre/revocations` (560 : le client dépose son secret de canal par un lien, sans compte), `moi/invitations/refus` | contrôleurs `@Public()` |

**Rien** ne porte encore l'accord du client : une obligation passe « Déposée » sans lui.

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, plus **une précision de comportement** (la porte de « Déposée »). Aucun champ, aucune route, aucun code
renommé ; **aucun droit neuf** (`preparer` consigne, `valider` règle l'exigence) ; aucun événement ; manifeste
`declarations` et catalogue d'auth inchangés ; rien chez `document-service`.

### La pièce (AC-2, AC-4) — `POST /api/v1/obligations/validations-client`

Droit `fiscalite:declaration:preparer`, rôles `TENANT_ADMIN` / `TENANT_USER` (gate fiscale). **Un seul geste** : une
pièce, rattachée d'un coup à 1 à 50 obligations **d'un même dossier**, tout ou rien.

```json
{
  "obligationIds": ["66f1…"],
  "nature": "DOCUMENT_SIGNE | COURRIEL | CAPTURE_MESSAGERIE | MENTION_MANUELLE",
  "recueLe": "2026-11-20",
  "reference": { "gedPieceId": "…", "gedVersion": 1 },
  "empreinte": "<sha256, 64 hexadécimaux>",
  "mention": "Accord donné par téléphone par la gérante le 20/11, sur le montant de 1 250 000."
}
```

- **Un document** (`DOCUMENT_SIGNE`, `COURRIEL`, `CAPTURE_MESSAGERIE` — la capture WhatsApp, SMS ou autre messagerie) :
  `empreinte` **obligatoire** (le SHA-256 du fichier, tel que la GED le rend) et une `reference` **obligatoire** —
  soit la pièce de la GED du cabinet (`gedPieceId` 1 à 64 caractères, `gedVersion` entier ≥ 1), soit `libre` (1 à 200
  caractères : l'objet du courriel, le classeur papier…), jamais les deux ; pas de `mention`.
- **Une mention manuelle** (`MENTION_MANUELLE`) : `mention` obligatoire (10 à 2 000 caractères) ; ni `reference` ni
  `empreinte` (le service calcule l'empreinte du texte).
- `recueLe` (facultatif, `AAAA-MM-JJ`) : le jour où le client a donné son accord ; par défaut le jour de la consignation ;
  jamais dans le futur.
- **Horodatée et attribuée par le serveur** : `consigneeLe` (l'instant serveur), `par` (l'identifiant du jeton, jamais
  le corps).

Réponse **201** : `{ validation: ValidationClientDto, obligations: ObligationResponseDto[] }`, avec

```
ValidationClientDto = { pieceId, dossierId, nature, recueLe, consigneeLe, par, empreinte ("sha256:<hex>"),
  reference: { gedPieceId, gedVersion } | { libre } | null, mention: string | null,
  obligations: { obligationId, statut, declare }[] }
```

(`statut` et `declare` : l'état et le montant déclaré de chaque obligation **au moment** de la consignation — ce que le
client a validé.)

Refus : `400` forme (`VALIDATION_CLIENT_INVALIDE`, `details.champ`, pour une combinaison nature / champs qui ne tient pas) ;
`403 DROIT_FISCAL_REFUSE` ; `404 OBLIGATION_INTROUVABLE` (absente, d'une autre organisation ou hors portée : même réponse) ;
`409 OBLIGATION_DESACTIVEE`, **`VALIDATION_CLIENT_TARDIVE`** (l'obligation est déjà `DEPOSEE` ou au-delà : un accord se
recueille avant le dépôt), **`VALIDATION_CLIENT_CONCURRENTE`** (une obligation a changé pendant la consignation : rien
n'est écrit) ; `422` **`VALIDATION_CLIENT_DOSSIERS_MULTIPLES`**, **`VALIDATION_CLIENT_DATEE_DANS_LE_FUTUR`**.

### Lire les pièces — `GET /api/v1/obligations/{id}/validations-client`

→ `200 { obligationId, exigence: ExigenceValidationClientDto, pieces: ValidationClientDto[] }`, la plus récente d'abord ;
`404 OBLIGATION_INTROUVABLE` (même réponse hors portée).

### L'exigence du dossier (AC-1) — `GET` et `PUT /api/v1/obligations/validation-client/exigences/{dossierId}`

```
ExigenceValidationClientDto = { dossierId, exigee: boolean, parDefaut: boolean, motif: string | null, par, le }
```

- **Par défaut, un dossier exige la validation du client** (`exigee: true, parDefaut: true`) : PRD §3.1 (N2 —
  validation du client capturée comme preuve : obligatoire en v1) et V6 (« rien ne part sans lui »).
- `PUT` (droit `fiscalite:declaration:valider` : l'acte de l'associé) `{ exigee: boolean, motif: string (10 à 500) }` →
  `200` l'exigence ; acte **`VALIDATION_CLIENT_EXIGENCE_CHANGEE`** au journal chaîné `dossier:<dossierId>` (`avant`,
  `apres`, empreinte du motif). `404 DOSSIER_INTROUVABLE` (hors portée : même réponse). Lecture : portée de l'appelant.

### La porte de « Déposée » (AC-1) — précision de comportement de `POST /obligations/{id}/transition`

`A_DEPOSER → DEPOSEE` sur un dossier qui exige la validation :

- **`409 VALIDATION_CLIENT_REQUISE`** — aucune pièce n'est rattachée à l'obligation ;
- **`409 VALIDATION_CLIENT_PERIMEE`** (`details { valide, declare }`) — la pièce courante a validé un autre montant
  déclaré que celui qui partirait (le déclaré a changé après l'accord) : consigner l'accord sur le nouveau montant.

Ordre : le droit `deposer`, les gardes d'état, le cycle, les anomalies bloquantes (328), puis la validation du client. La
pièce lue (et le déclaré lu) entrent dans la **condition d'écriture** : une transition concurrente répond
`TRANSITION_CONCURRENTE`. Un dossier qui n'exige pas la validation passe sans pièce. Aucune autre transition ne change.

### Champs neufs

- **`ObligationResponseDto.validationClient`** (`null` tant qu'aucune pièce) : `{ pieceId, nature, empreinte, declare,
  recueLe, consigneeLe, par }` — la pièce **courante** (la dernière consignée).
- Base : `validationClient` sur `obligations` (humain, `$setOnInsert: null` ; absent ⇒ `null`) ; deux collections neuves,
  **`validations_client`** (une pièce par document, **jamais récrite**) et **`exigences_validation_client`** (une ligne
  par dossier dont l'exigence a été réglée). Index posés par Mongoose. **Aucune migration**, aucune reprise.
- Journal chaîné : **`OBLIGATION_VALIDATION_CLIENT_CONSIGNEE`** (`obligation:<id>` : `pieceId`, `nature`, `empreinte`,
  `declare`, `recueLe`, la référence GED s'il y en a une ; **jamais** la mention ni la référence libre, textes libres),
  **`VALIDATION_CLIENT_EXIGENCE_CHANGEE`** (ci-dessus).

## Persistance et fichiers communs (D-L7-2)

**Aucune migration** ; ni `app.module.ts`, ni `package.json`, ni `read-models/` (la réplique des dossiers est **lue** pour
la portée, comme en 319), ni copie du paquet, ni manifeste `declarations`. Touché parmi les communs : **le contrat
OpenAPI** (quatre routes neuves, un champ). Tout le reste dans les dossiers de C : `domain/obligations`,
`application/obligations`, `modules/obligations`, `adapters/mongo` (schémas et registre des validations ; `versDomaine`
des obligations exporté), `ports/`, `test/utils`, l'e2e et la conformité des obligations, et une garde neuve à la racine de
`src/` (`garde-acces-client.spec.ts`, AC-3). **Rien dans les dossiers de D.** Le constructeur de
`CycleObligationsService` gagne un port (le registre des validations).

## Décisions (D-324-n) — prises le 2026-11-26, contestables

- **D-324-1 — La pièce est un document neuf, jamais récrit.** `validations_client` reçoit une pièce par consignation ;
  le port n'a **aucune** méthode de mise à jour ni de suppression (une garde le vérifie sur l'adaptateur). Quatre
  natures : `DOCUMENT_SIGNE`, `COURRIEL`, `CAPTURE_MESSAGERIE` (V6 : WhatsApp « au même titre qu'un document signé »),
  `MENTION_MANUELLE` (FR-F35 : l'accord oral, horodaté et attribué). Une pièce erronée ne se retire pas : une pièce de
  plus la complète, **la dernière fait foi** (le pointeur de l'obligation).
- **D-324-2 — Le fiscal tient la preuve, son empreinte et sa référence ; jamais les octets.** Le fichier (le PDF signé,
  le courriel, la capture) est rangé par le cabinet dans **sa GED** (`POST /api/v1/ged/cabinet/pieces`, document-service,
  inchangé) ou ailleurs (référence libre) ; le fiscal garde la référence et le SHA-256 que la GED a rendu, au format de
  la GED (64 hexadécimaux, rendu `sha256:<hex>` comme les autres empreintes du service). Aucun téléversement de plus dans
  le fiscal, aucun second stockage des pièces du client.
- **D-324-3 — Le fiscal n'appelle pas document-service.** Il ne vérifie ni l'existence de la pièce de la GED ni son
  empreinte : la référence et l'empreinte sont **déclarées** par qui consigne, attribuées et horodatées ; elles se
  vérifient à la main (la GED montre l'empreinte de chaque version) et le seront par une lecture de B si elle vient
  (**→ B**, ci-dessous). Une dépendance HTTP de plus au dépôt d'une déclaration, pour un contrôle que le dossier de
  contrôle peut faire à froid, n'est pas retenue.
- **D-324-4 — Un seul geste (V6).** Une requête : la pièce et son rattachement à 1 à 50 obligations du même dossier (un
  courriel du client valide souvent plusieurs déclarations d'un coup), tout ou rien. Deux dossiers ⇒ `422
  VALIDATION_CLIENT_DOSSIERS_MULTIPLES` : un accord vient d'un client.
- **D-324-5 — Horodatée et attribuée par le serveur (AC-2).** `consigneeLe` et `par` ne viennent jamais du corps ;
  `recueLe` est la date de l'accord, **déclarée** (≤ aujourd'hui, défaut aujourd'hui).
- **D-324-6 — L'exigence est une donnée du dossier, exigée par défaut.** FR-F35 dit « lorsque le dossier l'exige » ; le
  PRD (§3.1, N2 obligatoire) et V6 en font la règle. Retenu : **exigée sauf décision contraire de l'associé** (droit
  `valider`), motivée, journalisée au périmètre du dossier, réversible. L'inverse (opt-in) laisserait partir sans accord
  tout dossier qu'on aurait oublié de régler. Pas d'exigence par organisation (une ligne par dossier suffit en v1).
- **D-324-7 — La porte est dans le cycle, et seulement à « Déposée ».** `VALIDATION_CLIENT_REQUISE` sans pièce,
  `VALIDATION_CLIENT_PERIMEE` si le déclaré a changé depuis l'accord (le client a validé un montant : c'est lui qui part).
  Après les anomalies bloquantes ; la pièce et le déclaré lus entrent dans la comparaison-échange. **→ D** : toute voie
  qui fera passer une obligation à `DEPOSEE` (333, l'accusé lié ; un dépôt engagé par le canal) passe par
  `CycleObligationsService.transitionner` ou par `verifierValidationClientAuDepot` (domaine), jamais à côté.
- **D-324-8 — Quand consigner.** De `A_PREPARER` à `A_DEPOSER` : l'accord peut précéder le visa (le parcours du PRD :
  « la validation du client est déjà au dossier »). À partir de `DEPOSEE` : `409 VALIDATION_CLIENT_TARDIVE`. Une
  obligation écartée refuse (`OBLIGATION_DESACTIVEE`) ; un redevable bloqué ne refuse pas (consigner n'avance rien).
- **D-324-9 — Aucun droit neuf.** Consigner : `preparer` (le collaborateur reçoit le courriel). Régler l'exigence :
  `valider`. Le manifeste et le catalogue d'auth ne changent pas.
- **D-324-10 — AC-3 exécutable : une garde par l'AST.** `src/garde-acces-client.spec.ts` : les routes `@Public()` du
  service forment une **liste fermée**, chacune avec sa raison (santé, coffre du client par jeton — 560 —, refus d'une
  invitation par jeton) ; aucune ne touche la validation ; les quatre routes neuves portent les rôles du cabinet
  (`TENANT_ADMIN`, `TENANT_USER`) ; l'énumération des rôles n'a aucun rôle de client. La société cliente n'a ni compte, ni
  rôle, ni route : sa validation n'existe que comme pièce consignée par un membre du cabinet.
- **D-324-11 — Aucun événement Kafka.** Personne ne consomme la consignation ; le journal chaîné est la trace (comme
  D-323-11). Un fait `fiscal.obligation.validation-client.consignee` s'ajoutera le jour où un lecteur existera.
- **D-324-12 — Ce que 325 trouve, et fige sans le refaire.** (1) La pièce est immuable et porte, par obligation, l'état
  et le **déclaré qu'elle a validés** : elle reste attachée à la version qu'elle a validée. (2) L'obligation porte un
  **pointeur** vers la pièce courante (`validationClient`), comme elle pointera la version courante (AD-9). (3) Une
  rectificative (325) remet le pointeur à `null` dans sa transaction : la nouvelle version exige un nouvel accord ; la
  pièce précédente ne bouge pas. (4) Un retour en arrière (325) ne touche pas le pointeur : si le déclaré change ensuite,
  la porte dit `VALIDATION_CLIENT_PERIMEE`. (5) L'immuabilité de 325 (« aucun chemin applicatif ne met à jour une
  version ») s'étend à `validations_client` sans rien changer : le port n'a pas de mise à jour.
- **D-324-13 — Aucune donnée personnelle de tiers structurée (AD-21).** Ni nom, ni courriel, ni téléphone du signataire
  côté client : aucun champ ne les demande. La mention et la référence libre sont des textes libres gardés **dans la
  pièce seulement**, jamais au journal chaîné (ineffaçable dix ans) : il n'en porte que l'empreinte de la pièce.

## Demande à B (`document-service`, lot 7) — choix par défaut de C

**→ B (information, non bloquante)** : les pièces de validation du client sont rangées par le cabinet dans la GED
(`POST /api/v1/ged/cabinet/pieces`, inchangé), le fiscal n'en garde que la référence (`pieceId`, `version`) et
l'empreinte. Demandé, sans urgence : (1) une nature de pièce « validation du client » dans le plan de classement par
défaut du fonds annuel (aujourd'hui le cabinet la crée par `POST …/ged/cabinet/natures`) ; (2) une lecture des
métadonnées d'une version par sa référence (`pieceId`, `version` → empreinte, taille, nature, dossier ; sans contenu),
au jeton du membre, pour que le dossier de contrôle (336) puisse vérifier une référence sans télécharger la pièce.
**Choix par défaut** : la référence et l'empreinte sont déclarées et attribuées ; rien ne vérifie la GED ; 324 ne
dépend de rien chez B.

## Preuves attendues

Unitaires (`-w 2`, Node 24) du domaine (natures et combinaisons, empreinte de la mention, date future, porte requise /
périmée / non exigée, faits audités sans texte libre), du service (ordre des vérifications, tout ou rien, portée, droit,
tardive, exigence par défaut) et de la garde AST ; `test:conformite` sur `mongo` en jeu de répliques (pièce, pointeurs et
actes dans la même transaction ; comparaison-échange : rien d'écrit si une obligation a changé ; une re-dérivation garde
le pointeur ; la transition à `DEPOSEE` refuse sans pièce et passe avec ; l'exigence et son acte) ; e2e (le cycle entier
avec la pièce ; les quatre natures ; les refus) ; mutations sur la logique neuve, qui rougissent sur l'assertion ;
`docker compose up` du service (§1.5 : le module des obligations change), sain, les routes neuves en `401` sans jeton.
Pas de preuve Kafka (aucun événement).

## Hors périmètre

Le téléversement du fichier dans le fiscal (D-324-2) ; la vérification de la référence chez la GED (D-324-3, → B) ; le
retrait d'une pièce ; les versions de déclaration et les rectificatives (325) ; l'écran (FE-081 : consigner l'accord en
un geste, téléverser à la GED puis consigner) ; tout événement.

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-26 | Fiche écrite, contrat et communs annoncés (PR de docs) avant le code. |
