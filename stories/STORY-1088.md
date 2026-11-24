# STORY-1088 : L'original papier, et retrouver une pièce — où dort chaque original, et une pièce en une minute

Status: in-progress — **écrite le 2026-11-24** par la session du groupe C juste avant de la coder (lot 6, n° 3 de C),
depuis le bloc de `epics-services-cabinet-2026-11-18.md` (EPIC-267, lot G1), le PRD des services du cabinet (FR-10,
FR-11 ; reprend FR-170, FR-171 du PRD assurance) et la salle des cabinets du 19/11 (V9).

**Service :** `document-service` (module `ged`, tenu par C) · **Points :** 8 · **Dépend de :** STORY-1087 (livrée,
document-service #30) · **Suite :** STORY-1100 · **Écran :** FE-143

---

## Pourquoi

Un cabinet ne garde pas que des copies : il reçoit les **boîtes** de ses clients, les range, les prête, les rend. Le jour
d'un contrôle, il doit dire où dort l'original d'une facture, et la retrouver vite. Les cabinets l'ont dit en salle le
19/11 (V9) : « une boîte papier reçue a sa cote et son emplacement, et chaque pièce numérisée renvoie à son original
papier » ; « une pièce se retrouve en tapant le fournisseur ou le mois, en moins de trois gestes ».

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls**, sous `/api/v1/ged/cabinet` (le circuit du cabinet de STORY-1087). Aucun événement Kafka neuf. Droit
neuf utilisé : `ged:physique:gerer` (déjà déclaré au manifeste 1.1.0). Toutes les lectures respectent la portée du
dossier et cachent les natures sensibles comme en 1087 (D-1087-8).

### 1. Recevoir les archives d'un client (AC-1)

`POST /fonds/{numero}/receptions` (`ged:physique:gerer`) : `{ remisPar, remisLe, periode: { debut, fin },
boites: [{ libelle, periode?, etat: BON | ABIME | INCOMPLET, observation? }] }` (1 à 500 boîtes) → **201** : numéro
de réception **`REC-AAAA-NNNNN`** (séquence par cabinet et par année), et une **boîte** créée par ligne (identifiant,
rang dans la réception, état). `GET /fonds/{numero}/receptions` et `GET /receptions/{numero}` lisent ;
`GET /receptions/{numero}/bordereau` rend le **bordereau de réception en PDF** (servi en `inline`, à voir avant de le
télécharger).

### 2. La cote de chaque boîte, son étiquette, le lien avec la copie (AC-2)

- `PUT /boites/{boiteId}/cote` (`ged:physique:gerer`) : `{ local, travee, tablette, boite, rang }` (textes courts).
  Une cote est **unique** dans le cabinet (409 `COTE_PRISE`). Chaque changement de cote est gardé à l'historique de la
  boîte.
- `GET /boites/{boiteId}/etiquette` : l'**étiquette PDF** de la boîte (raison sociale du client, numéro du fonds, cote
  lisible, période) avec un **code QR** qui porte l'identifiant de la boîte et sa cote.
- `PUT /pieces/{pieceId}/original` (`ged:physique:gerer`) : `{ boiteId, emplacement? }` relie une copie numérique à son
  original papier ; la vue d'une pièce rend alors `original: { boiteId, cote, emplacement? }`. Une pièce reprise sans
  papier (D-1087) peut rester sans original.
- `GET /fonds/{numero}/boites` et `GET /boites/{boiteId}` : la boîte, sa cote, son état, sa présence (`EN_PLACE`,
  `SORTIE`, `RESTITUEE`), ses pièces reliées.

### 3. Sortir et rendre (AC-3)

- `POST /boites/{boiteId}/sorties` (`ged:physique:gerer`) : `{ motif, emprunteur, retourPrevuLe, pieceId? }` (une
  boîte entière, ou une pièce de la boîte). Une boîte déjà sortie : 409 `DEJA_SORTIE`.
- `POST /sorties/{sortieId}/retour` (`ged:physique:gerer`) : `{ observation? }` ; rejouer : 409 `DEJA_RENTREE`.
- `GET /sorties?enRetard=true` : les sorties du cabinet dont le retour prévu est dépassé de plus de
  **`GED_RETARD_TOLERANCE_JOURS`** (paramètre, 0 par défaut), avec le nombre de jours de retard. L'alerte se **lit**
  (l'écran la montre) ; la notification par e-mail est nommée pour plus tard.

### 4. Le récolement et la restitution (AC-4)

- `POST /fonds/{numero}/recolements` (`ged:physique:gerer`) : `{ faitLe, trouvees: [boiteId], enTrop: [{ libelle,
  observation? }] }` → le récolement daté, avec ses **écarts nommés** : `MANQUANTE` (attendue en place, non trouvée),
  `EN_TROP` (trouvée, inconnue du fonds), `SORTIE_NON_RENTREE` (trouvée alors qu'elle est sortie). Il n'efface ni ne
  corrige rien : il constate. `GET /fonds/{numero}/recolements` lit.
- `POST /fonds/{numero}/restitutions` (`ged:physique:gerer`) : `{ remisA, remisLe, motif, boites: [boiteId] }` → les
  boîtes passent `RESTITUEE` (une boîte sortie ne se restitue pas : 409 `BOITE_SORTIE`) ;
  `GET /restitutions/{numero}/bordereau` rend le **bordereau de restitution en PDF**, avec une place pour la signature du
  client. Les copies numériques restent au fonds.

### 5. Retrouver une pièce (AC-5)

`GET /fonds/{numero}/recherche` (`ged:piece:consulter`) : `q` (texte libre : tiers, référence, et **texte lu** du
document), `mois` (`AAAA-MM`), `nature`, `exercice`, `tiers`, `dateDu`, `dateAu`, `montantMin`, `montantMax`,
`reference`, `rubrique` ; pagination (`limite` ≤ 100, `curseur`). Chaque résultat rend la **copie** (pièce, version,
nature, date, tiers, montant) et la **cote de l'original** quand elle est reliée. **Le texte lu d'une nature sensible
n'est jamais cherché** : seules ses métadonnées le sont, et sans `ged:sensible:consulter` elle n'apparaît pas.
« Le fournisseur ou le mois, en moins de trois gestes » : `q=CEET` ou `mois=2026-03` suffisent.

### 6. La durée de conservation (AC-6)

La vue d'une pièce rend `conservation: { ans, pointDeDepart, jusquau }` (calculée depuis la nature de 1087 et la fin de
l'exercice ou de la mission). **Aucune destruction** : aucune route, aucune méthode de stockage ne supprime.

### Données et manifeste

- Collections neuves : `ged_receptions`, `ged_boites`, `ged_sorties`, `ged_recolements`, `ged_restitutions` ; un index
  de recherche sur les pièces du cabinet (nature, exercice, tiers, date, référence) et un index texte sur le texte lu
  des natures non sensibles. Compteurs `rec-cabinet|org|année` et `res-cabinet|org|année`.
- Dépendances neuves : `pdf-lib` et `qrcode` (pur JavaScript ; le code QR est dessiné en carrés dans le PDF).
- Manifeste `ged` **1.2.0** : les routes de lecture neuves (`receptions`, `boites`, `sorties`, `recolements`,
  bordereaux, étiquettes, `recherche`). **→ B** : copie au catalogue après la fusion.

### Décisions prises au contrat (contestables)

- **D-1088-1** : une boîte naît à la réception (une ligne du bordereau), sa cote se pose ensuite : l'archiviste reçoit
  d'abord, range ensuite.
- **D-1088-2** : le récolement constate, il ne corrige pas la présence des boîtes ; corriger passe par une sortie, un
  retour ou une restitution.
- **D-1088-3** : l'alerte de retard est une lecture (`enRetard=true`), sans notification pour l'instant.
- **D-1088-4** : la recherche porte sur un fonds ; la recherche dans tous les fonds du cabinet est nommée pour plus tard.

## Critères d'acceptation

- **AC-1** : une réception a son bordereau (boîtes, période, état) et son numéro.
- **AC-2** : chaque boîte a sa cote (local, travée, tablette, boîte, rang) et son étiquette PDF à code QR ; un original
  est relié à sa copie numérique.
- **AC-3** : sortie et retour d'une boîte ou d'une pièce, avec motif, emprunteur et retour prévu ; le retard se lit.
- **AC-4** : un récolement daté nomme les boîtes trouvées, manquantes, en trop ; la restitution au client a son
  bordereau.
- **AC-5** : la recherche par nature, exercice, tiers, date, montant, référence et texte lu, sauf le texte des natures
  sensibles ; le résultat donne la copie et la cote de l'original.
- **AC-6** : la durée de conservation s'affiche par pièce ; aucune destruction.
