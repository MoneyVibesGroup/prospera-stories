# STORY-1122 : Retrouver dans tous les fonds du cabinet — la recherche partout, et un index aveugle qui tient sur un gros fonds

Status: in_progress — fiche écrite le 2026-11-26 par la session du groupe B juste avant de la coder (lot 7, n° 4 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 4 ; identifiant réservé D-L7B-1).

**Service :** `document-service` (GitHub `prospera-ocr-service`, module `ged`) · **Points :** 5 · **Dépend de :**
STORY-1088 (la recherche dans un fonds, `9d0cfd3`), STORY-1087 (chiffrement `GED_CLE_CABINET`), STORY-1121 (pièce
détruite, `023446c`) · **Suite :** STORY-1123 (alertes ; elle prend la liste des pièces échues de tout le cabinet,
D-1122-11) · **Écran :** FE-143 (A, lot 8)
**Sources :** STORY-1088 (D-1088-4 : « la recherche dans tous les fonds du cabinet est nommée pour plus tard » ;
D-1088-6 : « pas d'index texte […] la recherche libre déchiffre en mémoire, pour 500 pièces au plus par requête […] une
recherche sur un très gros fonds demandera un index chiffrable ») ; STORY-1120 (« nommé pour plus tard » : la lecture de
plus de 1 000 pièces d'un fonds par le versement et le contrôle, `DepotGed.piecesDuFonds` borné à 1 000) ; STORY-1121
(« nommé pour plus tard » : la liste des pièces échues de tout le cabinet ; une pièce détruite ne se retrouve plus) ;
PRD des services du cabinet (FR-10 : retrouver une pièce ; salle du 19/11, V9 : « une pièce se retrouve en tapant le
fournisseur ou le mois, en moins de trois gestes ») ; STORY-1087 AC-6 (tout le cabinet chiffré au repos).

---

## Pourquoi

Un cabinet a un fonds par dossier client, et des centaines de dossiers. Le jour d'un contrôle, d'une question d'un
associé ou d'un client qui a changé de nom, on cherche « la facture CEET de mars » sans savoir dans quel fonds elle dort.
Aujourd'hui la recherche porte sur un seul fonds, et son texte libre **déchiffre en mémoire le texte lu de 500 pièces
au plus** par requête (D-1088-6) : au-delà, une pièce n'est plus trouvée par son texte, sans un mot. Et le versement
d'un fonds de plus de 1 000 pièces oublie les suivantes (`piecesDuFonds` borné à 1 000).

Cette story donne au cabinet **une recherche sur tous ses fonds**, servie par **un index qui ne contient aucun mot en
clair** : la base ne voit que des jetons (HMAC à clé du cabinet) ; le texte n'est déchiffré que dans le service, au
moment d'indexer, jamais à la recherche ; et la recherche ne parcourt plus rien en mémoire, quelle que soit la taille du
fonds.

## Ce qui est déjà livré (relu dans le code le 26/11)

- **STORY-1088** : `GET …/fonds/{numero}/recherche` (`PhysiqueService.rechercher`) : critères `q`, `mois`, `nature`,
  `exercice`, `tiers`, `dateDu`, `dateAu`, `montantMin`, `montantMax`, `reference`, `rubrique`, `limite` ≤ 100, `curseur`
  (un décalage) ; lit **toutes** les pièces du fonds par `piecesDuFonds` (1 000 au plus), filtre en mémoire, compare les
  mots en sous-chaîne ; texte lu déchiffré pour 500 pièces au plus ; une nature sensible : métadonnées seulement, et
  absente sans `ged:sensible:consulter`. **Aucune recherche hors d'un fonds, aucun index de recherche en base.**
- **STORY-1121** : la recherche écarte une pièce détruite ; `piecesDuFondsParPage` (par `pieceId`) sert l'export, les
  pièces échues et la proposition. Restent bornés à 1 000 : le **versement** (`verser`), la liste des pièces d'un fonds,
  les pièces du dossier déjà reprises et la reprise (tous par `piecesDuFonds`).
- **Le contrôle d'un fonds** (`controlerFonds`, vérification et campagnes) lit les lignes de ses bordereaux et chaque
  version par sa pièce : il n'a **pas** la borne de 1 000 (relu ; D-1122-10).
- Le texte lu d'une pièce du cabinet est rangé chiffré par la lecture OCR (`lecteur.ts`, `GED_CLE_CABINET`).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls** sous `/api/v1/ged/cabinet` (gate `GED_NOT_ENTITLED`, droits lus par `GET /moi/droits`) ; le chemin de
l'assurance ne change pas. **Aucun droit neuf** (auth inchangé), **aucun fait Kafka**, aucune dépendance neuve. Une
variable neuve, une collection neuve, une file BullMQ neuve.

### 1. Chercher dans tous les fonds (AC-1, AC-2)

`GET /ged/cabinet/recherche` (`ged:piece:consulter`) : les critères de la recherche dans un fonds (`q`, `mois`, `nature`,
`exercice`, `tiers`, `dateDu`, `dateAu`, `montantMin`, `montantMax`, `reference`, `rubrique`, `limite` ≤ 100,
`curseur`), plus **`fonds`** (un numéro de fonds) et **`dossierId`**, facultatifs. → `{ total, resultats, curseurSuivant? }` ;
chaque résultat : `pieceId`, `version`, `nature`, `libelleNature?`, `rubrique?`, `sousRubrique?`, `exercice?`, `date?`,
`tiers?`, `montant?`, `reference?`, **`fondsNumero`**, **`dossierId`**, **`raisonSociale?`** (le client), `original?`
(`boiteId`, `cote?`, `emplacement?`).

- **Portée** : `TENANT_ADMIN` ou `ged:fonds:gerer` cherche dans **tout le cabinet** ; tout autre membre, dans les fonds
  des dossiers dont il est responsable ou contributeur (la règle `filtrePorteeDossier` de STORY-695, en filtre de
  requête), jamais « Mon cabinet » (D-1122-7). Un `fonds` ou un `dossierId` hors portée ne rend rien (aucun oracle).
- ⛔ **Une nature sensible** : sans `ged:sensible:consulter`, elle n'apparaît pas (ni total, ni filtre) ; avec, elle ne
  s'apparie que par ses métadonnées : son texte lu **n'est jamais déchiffré pour l'index ni indexé** (D-1122-4).
- ⛔ **Une pièce détruite** (STORY-1121) n'apparaît jamais, ni par ce qui est détruit (texte, tiers, NIF, montant), ni par
  ce qui est gardé (identité, nature, exercice, référence) : elle se retrouve au registre des destructions (D-1122-5).
- Ordre de réception (`pieceId`), curseur opaque ; `total` compté par la base.

### 2. La recherche dans un fonds, sur le même index (AC-3)

`GET …/fonds/{numero}/recherche` garde ses critères, sa portée (404 `FONDS_INCONNU` hors portée) et la forme de sa
réponse ; ses résultats **gagnent** `fondsNumero`, `dossierId`, `raisonSociale?` ; son curseur devient opaque (le dernier
`pieceId`, plus un décalage). Elle est servie par l'index : **plus de borne de 500 textes ni de 1 000 pièces**.
Ce qui change dans l'appariement (D-1122-2) : un mot du **texte lu** s'apparie **mot entier** (sans accents ni casse) ;
un mot des **métadonnées** (tiers, référence, nature et son libellé) **par son début** (trois caractères au moins ; un mot
d'un ou deux caractères, entier) ; `tiers` et `reference` cherchent chaque mot donné au début d'un mot du champ
(« `tiers=ceet` » trouve « CEET Togo » ; « `tiers=eet` » ne le trouve plus).

### 3. L'index aveugle (AC-4, AC-5)

- Collection **`ged_index_recherche`**, une entrée par pièce du cabinet : identité (`pieceId`, `fondsNumero`,
  `dossierId`), ce qui se filtre (`type`, `exercice`, `date`, `montant`), l'état de la pièce indexée (`versionEtat`,
  `version`), et des **jetons** : `HMAC-SHA256` tronqués des mots normalisés, sous une **clé propre au cabinet dérivée de
  `GED_CLE_CABINET`** (aucune clé neuve à distribuer). **Aucun mot, aucun tiers, aucune référence, aucun texte en clair**
  dans l'index ; le jeton d'un mot chez un cabinet ne ressemble pas à celui du même mot chez un autre (D-1122-1).
- Le texte lu est déchiffré **dans le service, au moment d'indexer**, puis oublié ; la recherche **ne déchiffre rien**
  (elle calcule les jetons des mots cherchés). Sans `GED_CLE_CABINET`, une recherche par mots (`q`, `tiers`,
  `reference`) rend 503 `CHIFFREMENT_INDISPONIBLE` ; une recherche sans mot (mois, nature, exercice,
  montant…) reste servie.
- **Tenue à jour** (D-1122-6) : après chaque écriture d'une pièce du cabinet par le service (réception, copie rangée par
  la comptabilité, reprise, version, indexation, contrôle), hors de sa transaction (un index en panne n'empêche aucun
  dépôt) ; **dans la transaction de l'acte `DESTRUCTION`** pour une pièce détruite (jetons et montant vidés, l'entrée ne
  se réécrit plus). Le texte lu arrive par la lecture OCR, **que cette story ne touche pas** : une file BullMQ neuve,
  **`ged-index`**, porte un balayage répétable toutes les **`GED_INDEX_BALAYAGE_SECONDES`** (défaut 15 ; `0` le coupe)
  qui indexe le texte des pièces qui l'attendent (délai croissant jusqu'à 24 h pour une lecture en échec) et fait, une
  fois par jour, le tour de toutes les pièces du cabinet (les pièces versées avant cette story, une écriture manquée,
  un changement des règles d'indexation).
- Le texte d'une pièce s'indexe sur ses **5 000 premiers mots distincts** (D-1122-3).

### 4. Le versement d'un gros fonds (AC-6)

Le versement, la liste des pièces d'un fonds, les pièces du dossier déjà reprises et la reprise lisent **toutes** les
pièces du fonds, par pages (plus la borne de 1 000 de `piecesDuFonds`). Aucune forme de réponse ne change.

### Données, configuration, manifeste

- Collection neuve `ged_index_recherche` (index : un par pièce ; jetons ; jetons des métadonnées ; fonds ; texte
  attendu) et l'état du balayage. Variable neuve **`GED_INDEX_BALAYAGE_SECONDES`**. File BullMQ neuve **`ged-index`**
  (le Redis du service), planificateur à identifiant fixe `ged-index-balayage` (plusieurs instances : un seul).
- **Manifeste `ged` 1.7.0** (`manifestes/ged.manifest.ts`, cette PR) : `GET /api/v1/ged/cabinet/recherche` en
  `routesLectureSeule` ; `droits`, `publie`, `consomme` inchangés ; recopié dans le service par le code, **puis au
  catalogue par B** après la fusion du code.
- **OpenAPI** : DTO de réponse des deux recherches (`ResultatsDeRechercheDto`) ; A en génère les types.

## Critères d'acceptation

- **AC-1** : une recherche sur tous les fonds du cabinet rend les copies trouvées avec leur fonds, leur client et la cote
  de l'original ; « `q=CEET` » ou « `mois=2026-03` » suffisent ; les critères se cumulent ; pagination par curseur.
- **AC-2** : la portée du dossier est tenue (le collaborateur ne voit que ses dossiers ; `fonds`/`dossierId` hors portée
  ne rendent rien) ; une nature sensible ne s'apparie que par ses métadonnées, et n'apparaît pas sans le droit ; une pièce
  détruite n'apparaît jamais.
- **AC-3** : la recherche dans un fonds rend les mêmes pièces qu'avant sur le jeu de STORY-1088, servie par l'index, sans
  borne de 500 textes ni de 1 000 pièces.
- **AC-4** : l'index ne contient aucun mot ni aucun texte en clair (ni tiers, ni référence) ; le jeton d'un même mot
  diffère d'un cabinet à l'autre ; la recherche ne déchiffre aucun texte lu.
- **AC-5** : un texte lu après le dépôt est trouvé dès le balayage suivant ; une pièce versée avant cette story est
  indexée par le tour du cabinet ; une pièce détruite est vidée de l'index dans la transaction de sa destruction.
- **AC-6** : un fonds de plus de 1 000 pièces se verse en entier ; un mot du texte de la 1 001ᵉ pièce et au-delà se
  retrouve.

## Décisions prises au contrat (contestables)

- **D-1122-1 — Un index aveugle à jetons, pas un index texte de MongoDB** : un index texte de la base exigerait le texte
  en clair en base, contre AC-6 de STORY-1087. Les jetons sont des `HMAC-SHA256` tronqués à 72 bits (12 caractères
  base64url) sous `HMAC(GED_CLE_CABINET, « ged-index-recherche/v1| » + organisation)`. **Ce qu'ils laissent voir** à qui
  lit la base sans la clé : qu'un même mot revient dans deux pièces du même cabinet (fréquences), jamais le mot ; rien
  d'un cabinet à l'autre. Le changer de clé réindexe tout (le tour du cabinet le fait).
- **D-1122-2 — Mot entier pour le texte, début de mot pour les métadonnées** : indexer les débuts de chaque mot du texte
  multiplierait l'index par cinq ou six ; les métadonnées sont courtes (et déjà en clair dans `ged_pieces`). La
  sous-chaîne de STORY-1088 (« `eet` » dans « CEET ») ne se garde pas : un index aveugle ne sait pas la servir.
- **D-1122-3 — 5 000 mots distincts par pièce** (dans l'ordre de lecture) : un relevé de 30 pages en compte moins ; la
  borne tient l'entrée d'index sous 100 Ko. L'entrée dit `texteTronque`.
- **D-1122-4 — Le texte d'une nature sensible n'entre jamais dans l'index**, même chiffré en jetons ; et la requête
  relit le plan courant : une nature devenue sensible ne s'apparie plus que par ses métadonnées.
- **D-1122-5 — Une pièce détruite ne se retrouve jamais par la recherche**, même par ce qui en est gardé : la recherche
  sert à trouver une copie à consulter, et une pièce détruite n'en a plus ; sa preuve est au registre et au
  procès-verbal (STORY-1121).
- **D-1122-6 — L'OCR n'est pas touchée** : le texte lu s'indexe par le balayage, pas par un rappel dans le lecteur ; un
  texte lu est donc trouvable au plus `GED_INDEX_BALAYAGE_SECONDES` après sa lecture. Une écriture de pièce indexe à la
  suite, hors transaction ; le tour quotidien rattrape ce qui manquerait.
- **D-1122-7 — La portée de la recherche partout** est celle d'un fonds (`trouverDossier`) : tout le cabinet pour
  `TENANT_ADMIN` et `ged:fonds:gerer`, ses dossiers pour un collaborateur.
- **D-1122-8 — L'ordre de réception par `pieceId`** (identifiant d'ordre chronologique) : un curseur stable même quand
  des pièces arrivent pendant qu'on pagine.
- **D-1122-9 — La pièce relue fait foi** : chaque résultat est relu dans `ged_pieces` ; détruite, illisible pour ce droit
  ou ne répondant plus aux critères de métadonnées (entrée d'index en retard), elle est écartée de la page.
- **D-1122-10 — Le contrôle n'avait pas la borne** : seul le versement (et la liste, les reprises) la portait ; le
  contrôle d'un fonds ne change pas.
- **D-1122-11 — Les pièces échues de tout le cabinet vont à STORY-1123** : les lister sans parcourir chaque fonds
  demande l'échéance de chaque pièce dans un index, recalculée à la fermeture d'un fonds ; c'est le calcul de « l'échéance
  de conservation proche », l'alerte de STORY-1123.
- **D-1122-12 — La recette de l'Atelier n'est pas rejouée** si le diff ne touche ni l'OCR, ni les extractions, ni le
  module Nest commun (seul `GedModule` gagne des fournisseurs et une file), comme D-1121-16.

## Nommé pour plus tard

- La liste des pièces échues de tout le cabinet (STORY-1123, D-1122-11).
- Les bordereaux d'un fonds vivent dans son document (`ged_fonds_cabinet`) : au-delà d'environ 100 000 lignes de
  bordereau, le document atteint la limite de 16 Mo de MongoDB ; les sortir dans leur collection est d'une story
  suivante (le versement lit désormais toutes les pièces, le stockage des lignes reste celui de 1087).
- La pagination de la liste des pièces d'un fonds (`GET …/fonds/{numero}/pieces`, qui rend tout le fonds en une fois).
