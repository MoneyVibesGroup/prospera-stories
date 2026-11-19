# STORY-1097 : De la facture à l'écriture proposée — achats et ventes en partie double, pour le système normal

Status: done — **créée le 2026-11-18** à la demande de l'utilisateur. **Prise le 2026-11-23** par la session du
groupe C (consigne de l'utilisateur : 1097, puis 1098, 1099, 1101), contrat annoncé avant le code (#751). **Livrée le
2026-11-23** : comptabilite-service **#17** (`cd737dd` sur `dev`). Voir « Livraison » ci-dessous.

**Services :** `prospera-comptabilite-service` (tenu par B au lot 4) ; lecture de `document-service` (pièces extraites)
**Points :** 13 · **Suite :** STORY-1098 (mémoire des choix), FE-149 (l'écran)

---

## Contrat annoncé avant le code (2026-11-23)

**Ajouts seuls** dans `prospera-comptabilite-service` : aucune route, aucun champ ni aucun topic renommé ; aucun droit
neuf ; aucun événement Kafka neuf. Montants : entiers en francs (unité mineure XOF ou XAF, D-962-3).

### Routes, sous `/api/v1/dossiers/{dossierId}/exercices/{exerciceId}/factures/lots`

| Geste | Route | Droit |
|---|---|---|
| Déposer un lot | `POST /` (multipart) | `comptabilite:ecriture:saisir` |
| Les lots de l'exercice | `GET /` | tout membre dont la portée couvre le dossier |
| Un lot, ses lectures et ses propositions | `GET /{lotId}` | idem |
| Inscrire au brouillard les pièces retenues | `POST /{lotId}/inscrire` | `comptabilite:ecriture:saisir` |

**Déposer** — `multipart/form-data` : `fichiers` (1 à 50 ; PDF, JPEG ou PNG ; 10 Mo chacun), `sens` (`ACHAT` |
`VENTE`, exigé), `avoir` (booléen, défaut `false` : un lot d'avoirs), `devise` (`XOF` | `XAF`, défaut `XOF`). Chaque
fichier part chez `document-service` (`POST /api/v1/piece-extractions`, type `FACTURE`, `correlationId` = `lotId`,
`pieceId` = SHA-256 du fichier, `dossierId`), **avec le jeton du membre**. Réponse **202** : la vue du lot. Un fichier
présent deux fois dans le lot n'est déposé qu'une fois (`fichiersIgnores[] { nom, raison: MEME_FICHIER }`) ; un dépôt
refusé par `document-service` laisse la pièce `DEPOT_ECHOUE`, les autres continuent. **Le dépôt n'écrit aucune
écriture** (AC-1).

**Lire un lot** — `GET /{lotId}` lit les pièces chez `document-service` (`GET /dossiers/{d}/pieces?correlationId=<lotId>`,
jeton du membre) et **recalcule** la proposition à chaque lecture (règles pures, rien de proposé n'est stocké) :

```
{ lotId, dossierId, exerciceId, sens, avoir, devise, creeLe, creePar,
  compteurs: { pieces, enLecture, lues, illisibles, deposEchoues, inscriptibles, inscrites },
  pieces: [{
    pieceId, nomOrigine, statut,               // EN_LECTURE | LUE | ILLISIBLE | DEPOT_ECHOUE | INSCRITE
    urlConsultation?,                          // celle de document-service
    lecture?: { date?, fournisseur?, nifEmetteur?, numeroFacture?, montantHT?, montantTVA?, montantTTC? },
                                               // { valeur, confiance } tels que lus, jamais recalculés
    proposition?: {
      dateEcriture?, libelle, avoir,
      journal?: { code, source },
      tiers?: { tiersId, code, nom, source },  // source.origine : NIF | NOM
      tiersACreer?: { nom, nif?, categorie },  // jamais créé par la comptabilité
      compte?: { numero, source },             // source.origine : COMPTE_PAR_DEFAUT_DU_TIERS (1098 : MEMOIRE_*)
      tva: { traitement: RECUPERABLE | NON_RECUPERABLE, compte?, source },
      lignes: [{ role: CHARGE | PRODUIT | TVA | TIERS, compte?, debit, credit, tiersId?, reference?, libelle }],
      totalDebit, totalCredit, equilibree
    },
    signaux: [{ code, gravite: BLOQUANT | AVERTISSEMENT | INFO, message, details }],
    inscriptible,                              // aucun signal BLOQUANT
    inscription?: { ecritureId, numeroProvisoire, inscriteLe, inscritePar, decision: ACCEPTEE | MODIFIEE }
  }] }
```

**L'écriture proposée** suit les tableaux ci-dessus (achat : charge HT au débit, TVA récupérable au débit, fournisseur
TTC au crédit ; vente : client TTC au débit, produit HT et TVA facturée au crédit ; un avoir inverse les sens). La
ligne du tiers porte le `tiersId` et la `reference` = numéro de facture (le lettrage de STORY-969 la rapproche). TVA
non récupérable : la TVA s'ajoute à la charge, sans ligne de TVA. TVA nulle ou absente : pas de ligne de TVA.

**Signaux** (codes stables) : `LECTURE_EN_COURS`, `LECTURE_ECHOUEE`, `DEPOT_ECHOUE`, `DATE_ABSENTE`, `MONTANT_ABSENT`,
`MONTANT_NON_ENTIER`, `ECART_HT_TVA_TTC` (`details` : HT, TVA, TTC, écart ; rien n'est recalculé), `TVA_ABSENTE`
(avertissement), `TIERS_A_CREER`, `TIERS_A_CHOISIR`, `TIERS_AMBIGU` (`details.candidats`), `COMPTE_A_CHOISIR`,
`JOURNAL_A_CHOISIR`, `DOUBLON_PROBABLE` (avertissement ; `details` : l'écriture ou la pièce du lot), `AVOIR_RECONNU`
(info), `TVA_NON_RECUPERABLE` (info), `IMMOBILISATION` (info : la mise au registre reste un geste à part),
`DATE_HORS_EXERCICE`, `EXERCICE_CLOS`, `EXERCICE_INDETERMINE`, `AUTRE_EXERCICE` (la date désigne un autre exercice
ouvert : déposer la facture là), `DEVISE_ETRANGERE`. Tous bloquants, sauf ceux marqués avertissement ou info.

**Inscrire** — corps `{ pieces: [{ pieceId, corrections? }] }` (1 à 100) ; `corrections` (toutes facultatives) :
`dateEcriture`, `numeroFacture`, `montantHT`, `montantTVA`, `montantTTC`, `tiersId`, `compte`, `journal`, `tva`
(`RECUPERABLE` | `NON_RECUPERABLE`), `compteDeTva`, `avoir`, `libelle`, `devise`. **Ce qui est appliqué = ce qui a été
relu** : une correction prime sur la lecture. Chaque pièce retenue passe par la saisie existante (`ECRITURE_SAISIE`,
mêmes contrôles : exercice ouvert, journal admis, comptes admis du plan propre, tiers du collectif, pièce justificative
vérifiée chez `document-service`) et devient **un brouillard**. Rien n'est validé. Réponse **200**
`{ resultats: [{ pieceId, statut: INSCRITE, ecritureId, numeroProvisoire } | { pieceId, statut: REFUSEE, refus: { code,
message, details } }] }`. Refus par pièce : `PIECE_INCONNUE_DU_LOT`, `DEJA_INSCRITE` (`details.ecritureId`),
`PIECE_NON_INSCRIPTIBLE` (`details.signaux`), `INSCRIPTION_EN_COURS`, et tout refus de la saisie. Piste : la
proposition est citée (`origine: REGLE`, `capacite: comptabilite/facture-vers-ecriture@1`, `propositionId` =
`<lotId>:<pieceId>`, décision `ACCEPTEE` sans correction, `MODIFIEE` sinon).

**Refus du lot** : 409 `FACTURES_RESERVEES_AU_SYSTEME_NORMAL` (`details.referentiel` ; `details.renvoi: "cahiers"` pour
un exercice au SMT, AC-6), plus ceux de la saisie (`EXERCICE_CLOS`, `EXERCICE_NON_OUVERT`, `EXERCICE_TENU_AUX_CAHIERS`,
`REFERENTIEL_NON_DECIDE`) ; 400 `FICHIER_ABSENT`, `SENS_REQUIS` ; 422 `LOT_TROP_GRAND` (plus de 50 fichiers),
`FICHIER_TROP_VOLUMINEUX`, `FORMAT_NON_PRIS_EN_CHARGE` ; 404 `LOT_INTROUVABLE` (autre dossier, autre exercice, autre
cabinet : AC-7) ; 503 `DOCUMENTS_INDISPONIBLES` à la lecture d'un lot.

### Tiers (ajout seul à `POST /api/v1/dossiers/{dossierId}/tiers` et à la vue du tiers)

Deux champs **facultatifs**, fixés à la création comme le reste du tiers (D-968-4) : `nif` (1 à 30 majuscules ou
chiffres) et `compteParDefaut` (un compte du plan, hors collectif). La proposition retrouve le tiers **du dossier** (donc
du cabinet, AC-9) par son NIF, puis par son nom normalisé (casse, accents, ponctuation et espaces retirés), dans la
catégorie du sens (fournisseur à l'achat, client à la vente).

### Données

- `comptes-de-facturation@1` (`src/factures/comptes-de-facturation.json`), donnée du service comme `comptes-d-ecart@1` :
  pour **SN** seul, le compte de TVA récupérable (4452), celui de TVA facturée (443), les collectifs du fournisseur
  (401) et du client (411), et les racines à TVA non récupérable (liste vide, à valider par un expert). Validée au
  démarrage contre le plan publié et `comptes-collectifs@1`.
- Collection neuve `lots_de_factures` (lot, pièces, inscriptions), au plan d'effacement C13.
- Manifeste `comptabilite` : deux routes de lecture ajoutées à `routesLectureSeule` (`GET …/factures/lots`,
  `GET …/factures/lots/{lotId}`). **À recopier au catalogue par la session A.**

### Décisions prises au contrat (contestables)

- **D-1097-1** : le lot appartient à un exercice (la route est sous l'exercice) ; la date de chaque facture est
  contrôlée contre lui, et une date hors exercice est qualifiée (clos, absent, autre exercice ouvert) en lisant les
  exercices du dossier chez `dossier-service`.
- **D-1097-2** : la lecture se fait par HTTP chez `document-service`, pas par Kafka : la proposition est recalculée à
  chaque lecture ; seule l'inscription est stockée.
- **D-1097-3** : à la vente, l'OCR ne lit que l'émetteur (le cabinet du client lui-même) : le client est **à choisir**
  (`TIERS_A_CHOISIR`). Une demande à `document-service` (lire le destinataire) est nommée pour plus tard.
- **D-1097-4** : l'avoir est déclaré au dépôt ou à la correction ; il est « reconnu » quand un champ lu contient le mot
  AVOIR (`document-service` ne publie pas le texte brut de la pièce).
- **D-1097-5** : l'OCR ne lit pas la devise : celle du lot fait foi ; une correction dans une autre devise est
  `DEVISE_ETRANGERE`, bloquant (la conversion relève de la story des devises).
- **D-1097-6** : un montant lu avec des décimales est `MONTANT_NON_ENTIER` (le franc n'a pas de décimale) ; le
  comptable corrige.
- **D-1097-7** : un tiers inconnu n'est jamais créé par l'inscription : l'écran le crée par la route des tiers (geste
  de validation), puis inscrit avec son `tiersId`.
- **D-1097-8** : l'inscription est faite pièce par pièce, une écriture par transaction, avec un résultat par pièce ; une
  pièce est réservée le temps de son inscription, pour qu'un double clic ne crée pas deux écritures.

### Livraison (2026-11-23)

- **Code** : comptabilite-service #17, fusionnée sur `dev` (`cd737dd`) : module `src/factures/` (règles pures,
  adaptateurs HTTP, service, contrôleur), tiers (`nif`, `compteParDefaut`), manifeste **0.3.0**.
- **Preuves** : unitaires sous Node 24 (étage `verification`) **994 passés, 3 ignorés**, 65 suites ; mutation **10/10**
  sur les règles (écart, avoir, compte écarté, TVA sur la charge, client à la vente, inscriptible, décimales, borne de
  fin d'exercice, NIF, correction), chacune rouge sur une assertion ; `test:socle` **319 verts** (suite neuve
  `factures.socle-spec.ts` : AC-1, 2, 4, 5, 6, 7, 9, inscription, `DEJA_INSCRITE`, `MODIFIEE`, doublon) ; gate de
  câblage sur la pile `grp-c` : service `healthy`, `FacturesController` monté, quatre routes neuves en 401 sans
  jeton, OpenAPI publiée (trois chemins, `LotDeFacturesDto`, `nif` des tiers : AC-8). Verrou Docker rendu.
- **AC-10** : les factures sont déposées chez `document-service` dans le dossier, avec le jeton du membre du cabinet :
  elles sont aux pièces de ce dossier, de ce cabinet. Leur classement au fonds d'archives relève de STORY-1100.

### Écarts au contrat, décidés au code

- **D-1097-9** : la donnée s'appelle `comptes-de-facturation-declares.json` (et non `comptes-de-facturation.json`) :
  jest résout `./comptes-de-facturation` vers le `.json` du même nom avant le `.ts` (`moduleFileExtensions`).
- **D-1097-10** : `FORMAT_NON_PRIS_EN_CHARGE` est un **415** (le code existait déjà avec ce statut, STORY-1096). Un
  fichier de plus de 11 Mo, ou plus de 51 fichiers, est coupé par multer (**413**) avant tout traitement.
- **D-1097-11** : à la vente, `tva.traitement` vaut **`FACTUREE`** (la TVA facturée n'est ni récupérable ni non
  récupérable).
- **D-1097-12** : un `tiersId` corrigé qui n'est pas un tiers du dossier dans la catégorie du sens rend
  `TIERS_A_CHOISIR` (`details.raison: HORS_DU_DOSSIER_OU_DE_LA_CATEGORIE`) : aucun code neuf.
- **D-1097-13** : les deux lectures n'exigent aucun droit (comme les lectures d'écritures, D-958-9) : la portée du
  dossier suffit.
- **D-1097-14** : le compte suggéré (mémoire ou compte par défaut du tiers) est contrôlé contre le plan du dossier ; un
  compte désactivé, masqué ou sans racine est écarté et dit (`COMPTE_A_CHOISIR`, `details.ecarte`, `details.raison`).
  Un compte corrigé par le comptable n'est pas contrôlé à la lecture : la saisie le refuse nommément.

---

## Pourquoi

Le petit commerçant (système minimal de trésorerie, SMT) a ses cahiers : une facture y devient une recette ou une
dépense (STORY-084). Une entreprise au **système normal**, elle, tient une comptabilité en **partie double**. Une
facture d'achat à crédit crée une **dette** envers le fournisseur avant tout paiement. Une facture de vente crée une
**créance**. La TVA se ventile, et chaque écriture va dans **son** journal.

Le service comptable sait déjà tenir cette comptabilité : brouillard, écritures, validation, contre-passation,
journaux, tiers, lettrage, pièces liées. `document-service` lit déjà une facture : `date`, `fournisseur`, `nifEmetteur`,
`numeroFacture`, `montantHT`, `montantTVA`, `montantTTC` (`piece-extraction/parsers/facture.parser.ts`). **Rien ne
relie les deux** : l'expert-comptable ressaisit chaque facture ligne à ligne. C'est le travail le plus répétitif du
cabinet, et la raison pour laquelle il garde Sage.

## Ce qui est attendu

### 1. Déposer des factures, une ou un lot

- **Un lot** de factures pour un dossier au système normal, avec un **sens déclaré au dépôt** : `ACHAT` ou `VENTE`.
  On ne devine jamais le sens d'une pièce. Le dépôt et la lecture reprennent le patron de STORY-084 : un dépôt
  asynchrone, puis la relecture de ce que la machine a lu.
- **Le dépôt ne crée aucune écriture**, pas même au brouillard. L'invariant est le même que pour les cahiers
  (NFR-A05).

### 2. L'écriture proposée, par pièce

**Pour une facture d'achat**, en SYSCOHADA révisé :

| Ligne | Compte | Montant |
|---|---|---|
| débit | **compte de charge** (classe 6) | HT |
| débit | **TVA récupérable** (4452, ou la subdivision du référentiel du dossier) | TVA |
| crédit | **compte du fournisseur** (auxiliaire sous 401) | TTC |

**Pour une facture de vente** :

| Ligne | Compte | Montant |
|---|---|---|
| débit | **compte du client** (auxiliaire sous 411) | TTC |
| crédit | **compte de produit** (classe 7) | HT |
| crédit | **TVA facturée** (443) | TVA |

Les numéros viennent toujours du **référentiel du dossier** et de son plan propre (STORY-1094/1095), jamais d'une
liste écrite dans le service.

Règles de proposition :

- **Le tiers** est retrouvé par son **NIF** (`nifEmetteur`) dans les tiers du dossier, sinon par son nom normalisé. Un
  tiers inconnu est **proposé à la création** (nom, NIF), et jamais créé sans validation.
- **Le compte de charge ou de produit** vient, dans l'ordre :
  1. de la **mémoire des choix** (STORY-1098) ;
  2. du compte par défaut du tiers ;
  3. de rien : le compte est alors **laissé vide et signalé**. On n'invente jamais un compte.
- **Le journal** : le journal d'achats ou de ventes du plan de journaux du dossier (codes publiés, ou journaux propres).
- **La pièce** est liée à l'écriture : numéro de facture, empreinte, lien vers le document.
- **L'équilibre** est contrôlé : débit = crédit au franc près.
  - Si HT + TVA ≠ TTC à la lecture, l'écart est **signalé**, jamais corrigé en silence.
  - Si la TVA est absente, la TVA est laissée à zéro et un avertissement le dit. La facture peut être exonérée ou mal
    lue : le comptable tranche.

### 3. Les cas qui reviennent chaque mois

- **Avoir** : le même schéma en sens inverse, reconnu par le mot « avoir » ou déclaré au dépôt.
- **Doublon probable** (même tiers, même numéro de facture) : averti, jamais écarté d'office.
- **TVA non récupérable** (par exemple un véhicule de tourisme) : quand le compte retenu est marqué non récupérable
  au référentiel, la TVA s'ajoute à la charge.
- **Montant élevé sur un compte de classe 2** : quand le comptable choisit une immobilisation, l'écriture le suit. La
  mise au registre des immobilisations reste un geste à part (module livré).
- **Exercice** : la date de la facture désigne l'exercice. Exercice clos ou absent : refus nommé (`EXERCICE_CLOS`,
  `EXERCICE_INDETERMINE`).
- **Devise** : une facture dans une autre devise que celle du dossier est signalée. Sa conversion relève de la story
  des devises, hors de celle-ci.

### 4. Valider, une par une ou en lot

- Le comptable **retient** les écritures proposées, **corrige** comptes, montants, tiers et journal, puis les
  **inscrit au brouillard**.
- La **validation** (numérotation définitive, inaltérable) reste le geste existant du service. Rien n'est validé
  automatiquement.
- **Ce qui est appliqué = ce qui a été relu** : une valeur corrigée par le comptable prime sur la lecture de la
  machine, et cette correction alimente la mémoire (STORY-1098).

## ⛔ Cloisonnement par cabinet — exigence de l'utilisateur (2026-11-18), non négociable

> « Ça doit être lié par cabinet. Un cabinet A a sa façon d'écrire et sa propre compta : s'il insère quelque chose et
> que demain la même facture vient, on le lui suggère et on le remplit par défaut ; il peut modifier s'il veut, et
> c'est pris. Mais cela ne va pas apparaître pour un cabinet B, **même s'il a le même client**. C'est important. »

- Toute mémoire, toute suggestion et tout compte propre appartiennent à **l'organisation du cabinet** (`orgId` du
  jeton). Ils ne sont **jamais** indexés par le seul NIF du client ou du fournisseur : la clé contient toujours le
  cabinet.
- **Le même client suivi par deux cabinets** (même NIF, un dossier chez A, un dossier chez B) : B ne reçoit **rien** de
  A. Aucune suggestion, aucun compte, aucun tiers, aucune statistique, même anonymisée ou agrégée. Il n'existe **aucune
  mémoire « plateforme »** partagée entre cabinets.
- La valeur suggérée est **pré-remplie par défaut** ; le comptable la garde ou la change. **Ce qu'il valide devient la
  nouvelle mémoire** de son cabinet.
- **Test obligatoire** : deux cabinets A et B, un même client (même NIF) chez les deux. A comptabilise une facture de
  ce client. B dépose la même facture et ne reçoit aucune suggestion venant de A, alors que A la reçoit à la facture
  suivante.

## Critères d'acceptation

- **AC-1** : déposer un lot n'écrit aucune écriture ; seule l'inscription au brouillard écrit, et seulement les pièces
  retenues.
- **AC-2** : une facture d'achat lue (HT 100 000, TVA 18 000, TTC 118 000) propose exactement : 6xx débit 100 000,
  4452 débit 18 000, 401-tiers crédit 118 000, dans le journal d'achats, avec la pièce liée.
- **AC-3** : un écart HT + TVA ≠ TTC est signalé, et aucun montant n'est recalculé.
- **AC-4** : un tiers inconnu est proposé, jamais créé sans validation ; un tiers connu par son NIF est retrouvé.
- **AC-5** : un compte que rien ne propose reste vide et signalé, jamais inventé.
- **AC-6** : réservé aux dossiers au système normal. Un dossier SMT reçoit un refus nommé qui renvoie aux cahiers.
- **AC-7** : étanchéité. Un lot, ses pièces et ses écritures n'apparaissent dans aucun autre dossier (patron du gate
  FE-069).
- **AC-8** : le contrat est publié dans l'OpenAPI et annoncé dans « ⚠ Contrats » avant le code.
- **AC-9** : le tiers est retrouvé parmi les tiers **du cabinet et du dossier** seulement ; un tiers créé par un autre
  cabinet pour le même NIF n'est jamais retrouvé ni proposé.
- **AC-10** : les factures comptabilisées rejoignent le fonds d'archives du client **de ce cabinet** (STORY-1100).

## ✅ Ce que les cabinets veulent qu'on leur valide — salle du 2026-11-19 (V7)

Ajouté depuis `salle-cabinets-validations-2026-11-19.md`. Ce sont les critères qu'un cabinet vérifie lui-même avant d'adopter la solution.

- Une facture photographiée au téléphone (photo penchée, lumière moyenne) donne une écriture proposée ; ce que l'OCR n'a pas lu est surligné, jamais deviné.
- Le lot de factures du mois se valide en un clic pour les écritures sûres ; seules les écritures douteuses restent à regarder.
- Mesure attendue : le temps de saisie d'un mois de factures d'un client réel est noté avant et après (dossier de STORY-1102).

## Hors périmètre (nommé pour plus tard)

- Le **règlement** de la facture : l'écriture banque/401 et le lettrage automatique, à partir du relevé bancaire déjà
  importé (rapprochement livré). Ce sera une story à part.
- La lecture des factures **multi-taux** ligne à ligne : ici, un seul taux par facture, et l'écart est signalé.
