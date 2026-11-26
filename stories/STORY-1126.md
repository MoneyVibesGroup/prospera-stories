# STORY-1126 : La recette des archives de bout en bout — 40 boîtes, une facture de 2019 en deux gestes, une sortie, un récolement, une restitution

Status: in-progress — fiche écrite le 2026-11-26 par la session du groupe B juste avant de coder (lot 7, n° 8 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 8 ; identifiant réservé D-L7B-1). Dernière story de la partie
archives.

**Services :** `prospera-recette` (la recette, le profil de la pile) ; `document-service` (GitHub `prospera-ocr-service`,
module `ged`) et `admin-panel` (le BFF) **éprouvés**, corrigés seulement si la recette révèle un défaut (PR à part, avec son
test, avant la fusion de la recette) · **Points :** 5 · **Dépend de :** STORY-1087, 1088, 1100 (C), 1119 → 1125 et la suite
« f » de 1119 (`ged` 1.10.0) · **Écrans :** FE-143 (archives du client), AP-51 (console) : A, lot 8
**Sources :** PRD des services du cabinet, **UJ-2** (« Edem, archiviste, reçoit 40 boîtes d'un grand client […] Six mois
plus tard, le client demande la facture d'un fournisseur de 2019 : Edem la retrouve par recherche, et sait dans quelle boîte
dort l'original »), FR-7 → FR-11, FR-19 ; épics EPIC-267 ; salle des cabinets du 19/11, **V9** (« Une boîte papier reçue a sa
cote et son emplacement, et chaque pièce numérisée renvoie à son original papier. Une pièce se retrouve en tapant le
fournisseur ou le mois, **en moins de trois gestes** »).

---

## Pourquoi

Les sept stories d'archives du lot 7 (1119 → 1125, et « f ») ont chacune été prouvées sur une pile de preuve, avec une
doublure d'auth et des faits Kafka posés à la main. Personne n'a encore joué **le parcours d'un cabinet** d'un bout à
l'autre, avec les vrais services : auth (les droits du membre), catalogue (l'état publié de `ged`), dossier-service (le
dossier client, connu de la GED par Kafka), la GED, et la console par le BFF. Cette recette le joue, et garde le parcours
UJ-2 vert pour la suite.

## Ce que la pile sait faire (relu le 26/11)

- **La GED n'est pas réglée dans la pile de recette** : le compose racine (non versionné) lève `document-service` sans
  `GED_CLE_CABINET` (toute route du cabinet : 503), sans `AUTH_SERVICE_URL` (droits : 503 `DROITS_INDISPONIBLES`) ni
  l'espace de la pile. La comptabilité (STORY-1093) n'y dépose qu'une pièce justificative, hors GED.
- **Numérisation** : la GED **lit** chaque version déposée dans sa file (`LecteurDePieces`, STORY-996) : un PDF dont la
  couche texte fait au moins 60 caractères par page est lu par elle (`mode: COUCHE_TEXTE`) ; une image ou un PDF sans texte
  passe par Tesseract (`OCR`). STORY-1121 a vu des « faux PDF » (quelques octets) finir en `ECHEC` : la recette dépose de
  **vrais PDF minimaux**, générés par elle (`pdfFactice`, une page, du texte), pour que le texte lu existe. Elle ne touche ni
  l'OCR du KYC, ni les extractions de l'Atelier.
- **Le parcours a toutes ses routes** : fonds (1087), réception, cotes, étiquettes, sorties, récolement, restitution,
  recherche d'un fonds (1088), lots et lecture (996, 1087), versement et scellé (1087), attestation et journal (1119),
  fermeture, export, bordereau de restitution (1120), recherche du cabinet par l'index aveugle (1122), circuit verrouillé
  (1124), compteurs et quota par le BFF (1125), référence d'une version (« f »).
- **Le BFF relaie** l'octroi d'un module (`PUT /admin/orgs/{orgId}/entitlements/{module}`, la route servie de la console ;
  le moteur, `POST …/installations`, n'ouvre que les modules qui servent leurs vérifications, et `ged` n'en sert pas),
  l'état publié (`GET …/etat-publie`), les compteurs et le quota (1125).
- **Limites de débit** : la GED, 100 requêtes par minute et par adresse (son défaut) ; auth, 100 par minute et par adresse
  (la GED lit `GET /moi/droits` à chaque requête, sans cache).

## Ce que la recette joue (`prospera-recette`, `recette/archives.recette.ts`)

1. **La console ouvre la GED** au cabinet par le BFF (octroi de `ged`), lit l'état publié `EN_SERVICE` par le BFF ;
   l'archiviste lit le plan 2026.2 (`VALIDATION_CLIENT` compris).
2. Kafui, associée, inscrit le cabinet, invite **Edem** et lui donne `CAB_ARCHIVISTE` ; elle ouvre le dossier client
   (dossier-service). Edem **ouvre le fonds** (`ARC-AAAA-STG-00001`) et **reçoit les 40 boîtes** en une réception (`REC-`,
   bordereau PDF).
3. **Chaque boîte cotée** (local, travée, tablette, boîte, rang) et **son étiquette** à code QR (PDF) ; une cote prise : 409.
4. **Chaque boîte numérisée dans son lot** (un lot par boîte : ouvert, scan, indexation, contrôle qualité, archivé) : une
   pièce indexée selon le plan (nature, exercice, date, tiers, montant, référence ; trace de numérisation), **lue** par la
   GED (« N lus sur M »), **contrôlée** (contrôle humain obligatoire), **reliée à son original** ; la durée de conservation
   affichée.
5. **Le versement** : un bordereau de 40 lignes, scellé ; l'attestation de numérisation `ATT-` ; la vérification des
   scellés.
6. **La facture de 2019 retrouvée en moins de trois gestes** (D-1126-8) : la recherche du fournisseur dans l'exercice (un
   résultat, avec le fonds, le client et **la cote de l'original**), puis la copie (à l'octet). « En tapant le mois » : un
   geste, un résultat. Le **texte lu** se cherche ; celui d'une nature sensible (bulletins de paie) jamais.
7. **La référence d'une version** (« f ») : l'empreinte est celle des octets déposés, jamais le contenu.
8. **L'original sort** (motif, emprunteur, retour prévu), une seconde sortie est refusée, **il rentre**.
9. **Un récolement** daté : 39 boîtes trouvées, la manquante nommée avec sa cote, une boîte en trop.
10. **La console** voit l'archivage du cabinet par le BFF (AP-51) : des compteurs, aucun mot d'une pièce ; le quota de
    l'offre posé s'applique au cabinet ; un membre du cabinet n'entre pas à la console.
11. **Fin de mission** : les 40 boîtes **restituées** (`RES-`, bordereau PDF), une boîte restituée ne sort plus ; le fonds
    **fermé** (`FONDS_FERME` au dépôt suivant), **exporté** (volumes ZIP, empreintes justes), son **bordereau de
    restitution** `BRN-` émis.
12. La console voit le fonds fermé et plus aucune boîte sur les rayons ; **le journal d'intégrité** du cabinet est intact
    du premier au dernier acte.

## Contrat annoncé avant la fusion (2026-11-26)

**Le profil de recette** (`prospera-recette/docker-compose.recette.yml`), lu par tous ceux qui lèvent la pile (A, C, D) :
**ajouts seuls**, des réglages, rien qui touche une donnée.

- **`document-service`** reçoit trois réglages : `INSTANCE_ESPACE: ${RECETTE_ESPACE:-REEL}` (l'espace de la pile, D-929-2),
  `AUTH_SERVICE_URL: http://auth-service:3001/api/v1` (les droits du membre), `GED_CLE_CABINET: ${RECETTE_GED_CLE_CABINET:-}`
  (la clé des pièces du cabinet, interpolée, jamais écrite dans le dépôt).
- **Le paquet** tire la clé une fois dans `.recette/cle-ged-cabinet.b64` (non versionné, 32 octets en base64) et la passe
  à chaque `docker compose` qu'il lance (`RECETTE_GED_CLE_CABINET`), comme la clé de signature commune (D-1115-3). Un
  compose lancé à la main garde une GED du cabinet fermée (503).
- **Une recette neuve** : `npm run recette -- archives`. Rien ne change pour les autres recettes ; `comptabilite` dépose
  toujours sa pièce hors GED.

Aucune route, aucun fait, aucun droit ne change dans un service (sauf défaut révélé, annoncé alors à part).

## Critères d'acceptation

- **AC-1** : sur une pile neuve, images reconstruites depuis `origin/dev`, volumes neufs, la recette joue le parcours UJ-2
  d'un bout à l'autre : 40 boîtes reçues, numérisées (lues), versées, cotées ; une facture de 2019 retrouvée en moins de
  trois gestes, avec la cote de son original ; une pièce sortie et rentrée ; un récolement ; une restitution.
- **AC-2** : la console passe par le BFF (octroi, état publié, compteurs, quota) ; le cabinet par la GED avec le jeton du
  membre ; rien n'est écrit en base.
- **AC-3** : les compteurs de la console sont ceux du parcours (fonds, pièces et pages versées, volume du cabinet, boîtes
  cotées, puis le fonds fermé et les boîtes restituées), sans un mot d'une pièce.
- **AC-4** : le profil ne pose que des réglages ; la clé de la GED n'est dans aucun fichier versionné (garde du profil).
- **AC-5** : les temps de la passe (dépôts, lecture, index, recherche, export) et les `429` sont écrits au journal de la
  suite (`MESURES-1126`).

## Décisions (contestables)

- **D-1126-1 — Une recette de plus dans `prospera-recette`** (`recette/archives.recette.ts`, logique pure dans
  `src/archives.ts` et ses tests), sur la pile de base plus `dossier-service`, `document-service` et `admin-panel`, levés à la
  demande comme la comptabilité (1093) les lève.
- **D-1126-2 — La clé de la GED tirée par le paquet, hors du dépôt** : une clé de chiffrement n'a rien à faire dans un
  fichier versionné, même de recette ; le patron existe (la clé commune, D-1115-3). Vide, la GED ferme (503).
- **D-1126-3 — La console passe par le BFF, l'accueil par les routes communes** : l'octroi de `ged`, l'état publié, les
  compteurs et le quota sont des gestes de la console (AP-51, AP-55) : ils passent par le BFF. L'inscription, le KYC et la
  déclaration du module au catalogue restent ceux de toutes les recettes (`Accueil`) : ils ne sont pas l'objet de celle-ci.
  L'octroi par le `PUT` de la console (`CONSOLE_PUT`, STORY-945) et non par le moteur : `ged` ne sert pas de vérification
  d'installation (`INSTALLATION_SERVICES` ne la nomme pas).
- **D-1126-4 — Le cabinet par la GED, avec le jeton du membre** : Edem (`CAB_ARCHIVISTE`) fait tous les gestes d'archives ;
  ses droits sont lus chez auth par la GED (`GET /moi/droits`), jamais posés.
- **D-1126-5 — Numériser = déposer un vrai PDF à couche texte, lu par la GED** : la pile n'a pas de scanner ; un PDF minimal
  généré par la recette (une page, son texte imprimé) est ce qu'un scanner avec reconnaissance produit. Tesseract (une image)
  n'est pas joué : ses tests sont ceux du service. La recette touche **la lecture de la GED** (pas l'OCR du KYC, ni les
  extractions de l'Atelier) : c'est elle qui est rejouée ; la recette de l'Atelier ne l'est pas tant que le code de
  `document-service` ne change pas.
- **D-1126-6 — Une pièce par boîte, une page par pièce** : quarante boîtes (la règle du plan), quarante lots, quarante
  pièces ; dix exercices de quatre boîtes (2017 → 2026). Pile légère (VM de 8 Go), une seule passe.
- **D-1126-7 — Au rythme de la GED, sans relever ses limites** : on recette ce qui est livré ; la recette attend un `429`
  (`Retry-After`) et le compte, au-dessus du transport (jamais un rejeu à l'aveugle d'un autre statut).
- **D-1126-8 — Un geste** : un appel d'API qu'un écran du cabinet ferait en réponse à une action de l'utilisateur (valider
  une recherche saisie, ouvrir un résultat, télécharger une copie). Une sonde, une attente, un rejeu sur `429` n'en sont pas.
  « Retrouver la facture » : la recherche du fournisseur dans l'exercice (1), la copie (2) ; la cote de l'original est dans
  le résultat de la recherche. Le compteur (`compteurDeGestes`) se pose au-dessus de la patience. B ne code aucun écran.
- **D-1126-9 — « Une restitution » = la restitution papier, puis la fin de mission** : les 40 boîtes rendues (FR-10,
  `RES-`), puis le fonds fermé, exporté et son bordereau `BRN-` (FR-10, STORY-1120) : c'est ce que fait un cabinet en fin de
  mission.
- **D-1126-10 — Les faits publiés par la GED ne sont pas lus par la recette** : ils sont prouvés par 1123 sur Kafka ; leur
  consommateur (cloche, e-mail) est chez D.

## Nommé pour plus tard

- Les écrans (FE-143, AP-51 : A, lot 8) ; un scan image (Tesseract) dans la recette quand un poste de numérisation existera.
