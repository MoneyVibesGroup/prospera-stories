# STORY-1126 : La recette des archives de bout en bout — 40 boîtes, une facture de 2019 en deux gestes, une sortie, un récolement, une restitution

Status: done — **livrée le 2026-11-26** : prospera-recette **#34** (`585d8bd`, `9a7749a`, `3ca9907` sur `dev`) ; défaut
révélé corrigé à part : document-service **#41** (`5261720`, `57f9581` sur `dev`) ; voir « Livraison ». Fiche écrite le
2026-11-26 par la session du groupe B juste avant de coder (lot 7, n° 8 de B,
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

## Livraison (2026-11-26)

- **Recette, `prospera-recette` #34** (`585d8bd`, `9a7749a`, `3ca9907` sur `dev`) : `recette/archives.recette.ts` (13 tests,
  le parcours ci-dessus), `src/archives.ts` (les 40 boîtes, le PDF de chaque pièce, `compteurDeGestes`, `cleDeLaGed`,
  `fuitesDeLaConsole`) et ses tests ; `environnementDeLaPile` porte `RECETTE_GED_CLE_CABINET` ; profil (`document-service` :
  trois réglages) et sa garde ; README (section STORY-1126). `npm run recette -- archives`.
- **Défaut révélé, `document-service` (`prospera-ocr-service`) #41** (`5261720`, `57f9581` sur `dev`), fusionné avant la
  recette (D-1126-11) :
  - **la passe 1 l'a montré** : la GED relisait `GET /moi/droits` à chaque requête (deux ou trois fois pour `PUT
    …/original`, `GET …/pieces/{id}`) ; l'adresse de la GED dépassait la limite d'auth (100 par minute et par adresse) bien
    avant la sienne — **aucun** `429` de la GED, **404** lignes `429` au journal d'auth — et Edem recevait **503
    `DROITS_INDISPONIBLES`** au dépôt de la cinquième boîte (passe 1 : 5/13, tout l'aval en cascade) ;
  - **le correctif** : `CacheDesDroits` devant `SourceDesDroitsHttp`, câblé par le module `ged` : clé = empreinte SHA-256 du
    jeton présenté + organisation (le jeton jamais gardé en clair), 60 s au plus, un échec jamais gardé, deux lectures
    simultanées d'un jeton n'en font qu'une, borné à 10 000 jetons ;
  - second commit : le recensement des routes du cabinet (STORY-695, `dossier-portee-collaborateur.e2e-spec`) inscrit `GET
    …/ged/cabinet/pieces/{pieceId}/versions/{version}` : la route de « f » manquait à la liste fermée et l'e2e rougissait sur
    `dev` (rouge sans le diff, `git stash`).
- **Preuves** :
  - recette : `npm test` **175/175** (17 suites), `npm run verifier` vert ; mutations **10/10** tuées sur assertion (R3, la clé
    retirée de l'environnement de la pile, a d'abord survécu : un test de plus) ;
  - `document-service`, Node 25 : `droits.spec` 11/11 (+7), unitaires 1 396 passés (117 suites, les 3 rouges connues du poste),
    e2e **222/222**, lint des fichiers touchés, `tsc` ; mutations **8/8** ; Node 24 (étage `verification`, archive
    d'`origin/dev` `57f9581`) : **117/117 suites** (1 400 passés), e2e **222/222** ;
  - **pile `grp-b-recette` neuve, images depuis les archives d'`origin/dev`** (auth `e9c32c1`, kyc `9cef9cb`, catalogue
    `ce8cbc0`, notification `749b3cd`, paiement `64b5838`, dossier `645a699`, document-service `57f9581`, BFF `81817fe`),
    volumes neufs : **13/13** en 115 s (passe 3). `MESURES-1126` : dépôts des 40 pièces 10 s, lecture 1 s, numérisation des 40
    boîtes (lots, dépôts, lectures, contrôles, originaux) 81 s, recherche + copie 126 ms, texte lu à l'index aussitôt, export
    2 s, un `429` de la GED attendu ; `GESTES-1126` : `GET …/recherche`, `GET …/versions/1/contenu` ; journal d'intégrité :
    10 actes chaînés (versement, scellé, attestation, vérification, fermeture, export, deux téléchargements, `BRN-`) ;
    aucune erreur au journal de la GED ni du BFF.
  - Passes : 1 (12:48 → 13:02, `origin/dev` d'avant le correctif : le défaut), 2 (13:23 → 13:35, avec le correctif et
    l'étage `verification` : 12/13, une assertion de la recette sur le journal, D-1126-13), 3 (13:44 → 13:49 : 13/13).
    `down -v` à chaque fin, aucun conteneur `grp-b-*` restant, verrou rendu.
- **Recette de l'Atelier non rejouée** (D-1126-12) : le correctif ne touche ni l'OCR, ni les extractions, ni le module commun.

### Décisions prises au code

- **D-1126-11 — Les droits du membre en cache, 60 s par jeton, dans la GED** : l'ADR « droits hors du jeton » (décision 2)
  prescrit le cache sous (membre, organisation, `dv`) ; la comptabilité le fait (STORY-962). La clé est l'empreinte du jeton
  plutôt que `dv` : un jeton porte membre, organisation et `dv`, et la GED n'a pas à projeter `dv` pour cela ; un droit
  retiré se voit en une minute au plus, comme ailleurs. Corrigé dans `document-service` (dépôt de B), PR à part fusionnée
  avant la recette.
- **D-1126-12 — La recette de l'Atelier n'est pas rejouée** : le diff de #41 tient dans le module `ged` (sa source des droits)
  et un e2e de recensement ; ni l'OCR, ni les extractions, ni le module Nest commun (D-1125-13). La recette des archives
  rejoue la lecture de la GED.
- **D-1126-13 — Le journal d'intégrité se prouve par ses actes** : il chaîne les actes probants (STORY-1119 : versement,
  scellé, documents émis, vérification, fermeture, export et téléchargement…), pas chaque geste ; la recette lit le journal,
  y trouve les actes du parcours, et exige `rangs` = entrées relues par la vérification.

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
