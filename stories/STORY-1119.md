# STORY-1119 : Les archives ont valeur de preuve — journal d'intégrité chaîné, contrôle périodique des empreintes, attestation et certificat

Status: done — **livrée le 2026-11-25** : document-service **#33** (`b7b3f91` sur `dev`), catalogue **#77** (`f4fcee0`) ;
voir « Livraison ». Fiche écrite le 2026-11-25 par la session du groupe B juste avant de la coder (lot 7, n° 1 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 1 ; identifiant réservé D-L7B-1).

**Service :** `document-service` (GitHub `prospera-ocr-service`, module `ged`, repris de C au commit `0716a58`) ·
**Points :** 8 · **Suite :** STORY-1120 (fin de mission et réversibilité), STORY-1121 (la destruction proposée, puis
visée) · **Écran :** FE-143 (A, lot 8 : types à régénérer quand l'écran viendra)
**Sources :** PRD des services du cabinet `prds/prd-services-cabinet-2026-11-18/` (FR-9 ; NFR-4 « documents figés »,
NFR-5 « piste d'audit », NFR-6 « accès tracé », NFR-7 ; addendum §4 : loi togolaise n° 2017-07 sur les transactions
électroniques, référentiel d'archivage électronique ARTP v2.0) ; STORY-1087 (amendement du 24/11 : « avec l'empreinte,
le scellé et le journal déjà en place, c'est la base d'une copie fiable, sans prétendre à une certification ») ;
STORY-997 (D-997-4, D-997-6) ; STORY-1088 ; STORY-1100.

---

## Pourquoi

La loi n° 2017-07 donne à l'écrit électronique la force probante du papier **si son auteur est identifié et son
intégrité garantie par sa conservation**. Le référentiel d'archivage de l'ARTP (v2.0) demande, pour le prouver, une
**traçabilité** des actes sur les archives et un **contrôle d'intégrité** régulier. Aujourd'hui la GED du cabinet
scelle et vérifie, mais à la demande seulement ; la trace de qui a consulté une pièce sensible est une ligne de journal
qu'un geste en base peut retirer sans que personne ne le voie ; et rien ne se remet à un tiers (un contrôleur, le
client) pour dire « ce fonds est intact, voici comment le vérifier ».

## Ce qui est déjà livré (et que cette story ne refait pas)

- **STORY-997** (assurance, puis le cabinet par STORY-1087) : le **scellé** d'un bordereau, SHA-256 de la liste triée
  `pieceId|version|sha256(fichier en clair)` précédée du numéro du bordereau ; le bordereau complémentaire `/Cn`, scellé
  **lié** au précédent ; la **vérification** à la demande qui relit chaque fichier et nomme `FICHIER_MODIFIE`,
  `FICHIER_ABSENT`, `VERSION_AJOUTEE` (`POST …/fonds/{numero}/verification`, ajoutée à `fonds.verifications`).
- **STORY-1087** : le versement, le scellé et la vérification du cabinet (`/api/v1/ged/cabinet/…`, D-1087-6), le
  chiffrement de toutes les pièces (`GED_CLE_CABINET`), la **trace de numérisation** de chaque version (format,
  résolution, pages, opérateur, date), le contrôle humain obligatoire, les natures sensibles en 404.
- **Le journal par pièce** `ged_journal` (STORY-995) : `CONTENU_LU`, `TEXTE_LU`, … — une ligne par acte, **non chaînée**.
  Il reste tel quel ; la chaîne de cette story porte les actes qui font preuve.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls**, sous `/api/v1/ged/cabinet` (gate `GED_NOT_ENTITLED`, droits lus par `GET /moi/droits`, D-1087-4).
**Aucun droit neuf** (D-1119-4) : rien ne change chez `auth-service` ni dans la table d'accès du cabinet. **Aucun fait
Kafka neuf** (D-1119-10). **Aucune dépendance neuve** (`pdf-lib` et `bullmq` sont déjà là). Le chemin de l'assurance ne
change pas.

### 1. Le journal d'intégrité chaîné (AC-1, AC-2)

Un journal **par cabinet** (D-1119-1), en ajout seul. Chaque entrée :
`{ rang, le, acte, acteurId, fondsNumero?, pieceId?, version?, details, precedente, empreinte }`.

- `rang` : 1, 2, 3… sans trou ; `precedente` : l'empreinte de l'entrée précédente (64 zéros pour la première) ;
  `empreinte` : SHA-256 de la forme canonique `[organisationId, rang, le, acte, acteurId, fondsNumero, pieceId, version,
  details (clés triées), precedente]` (JSON, `null` pour un champ absent, date ISO). Changer, retirer ou insérer une
  entrée casse la chaîne à cet endroit.
- **Actes inscrits** (D-1119-2) :

  | Acte | Quand | `details` |
  |---|---|---|
  | `VERSEMENT` | un bordereau versé au fonds | `bordereau`, `pieces`, `empreinteDesLignes` |
  | `SCELLEMENT` | un bordereau scellé | `bordereau`, `scelle`, `precedente?`, `pieces` |
  | `VERIFICATION` | une vérification à la demande | `ok`, `ecarts`, `bordereaux` |
  | `CONTROLE_PERIODIQUE` | une campagne, une entrée par cabinet | `campagneId`, `origine`, `fonds`, `enEcart`, `journalOk`, `empreinteDesResultats` |
  | `CONSULTATION_SENSIBLE` | le contenu ou le texte lu d'une pièce de nature sensible | `objet` (`CONTENU` ou `TEXTE`), `nature` |
  | `DOCUMENT_EMIS` | une attestation ou un certificat émis | `type`, `numero`, `empreinte` (du PDF), `bordereau?` |

- **Dans la même transaction** que l'acte (D-1119-3) : un versement, un scellé ou une vérification et leur entrée
  s'écrivent ensemble, ou pas du tout. **Pas de consultation sensible sans trace** : l'entrée s'écrit avant que le
  contenu parte ; si elle ne peut pas s'écrire, **503 `JOURNAL_INDISPONIBLE`** et rien n'est servi.
- Deux actes simultanés ne fourchent jamais la chaîne (tête de chaîne par cabinet sous verrou optimiste, index unique
  `(organisationId, rang)`).

| Geste | Route | Droit |
|---|---|---|
| Lire le journal | `GET /ged/cabinet/journal-integrite?depuisRang=&limite=&fondsNumero=` | `ged:fonds:gerer` |
| Vérifier la chaîne | `GET /ged/cabinet/journal-integrite/verification` | `ged:fonds:gerer` |

La vérification recalcule chaque empreinte du rang 1 à la tête et rend `{ ok, rangs, tete: { rang, empreinte },
rupture?: { rang, raison } }`, `raison` ∈ `EMPREINTE_FAUSSE`, `LIEN_ROMPU`, `RANG_MANQUANT`.

### 2. Le contrôle périodique des empreintes (AC-3, AC-4)

- **Mécanisme** (D-1119-5) : la file BullMQ du service (Redis, comme la lecture OCR de STORY-996), file
  `ged-integrite`, planificateur `ged-controle-integrite` au motif **`GED_CONTROLE_INTEGRITE_MOTIF`** (cron, défaut
  `0 3 * * *`, UTC ; `AUCUN` le coupe). Plusieurs instances : un seul planificateur (identifiant fixe).
- **Une campagne** contrôle, pour chaque cabinet, chaque fonds qui a au moins un bordereau scellé : chaque fichier relu,
  déchiffré, haché ; chaque scellé recalculé ; chaque lien au précédent relu ; puis la chaîne du journal du cabinet.
- **Les écarts nommés** : `FICHIER_MODIFIE`, `FICHIER_ABSENT`, `VERSION_AJOUTEE` (ceux de STORY-997), et deux neufs
  (D-1119-7) : **`SCELLE_MODIFIE`** (l'empreinte gardée du scellé ne se recalcule plus depuis les lignes du bordereau)
  et **`LIEN_ROMPU`** (le scellé ne pointe plus le scellé du bordereau précédent) ; au niveau de la campagne,
  **`JOURNAL_ROMPU`** (la chaîne casse, avec son rang). Chaque écart porte `rang` (bordereau), et `pieceId`, `version`
  quand il touche une pièce. La vérification à la demande (`POST …/verification`) nomme aussi les deux neufs.
- Les résultats se gardent (`ged_campagnes_integrite`, `ged_controles_integrite`), **pas** dans `fonds.verifications`
  (D-1119-6) ; une entrée `CONTROLE_PERIODIQUE` par cabinet et par campagne porte l'empreinte de ses résultats.

| Geste | Route | Droit |
|---|---|---|
| Lancer une campagne pour son cabinet | `POST /ged/cabinet/controles-integrite` → **202** `{ campagneId, etat: PLANIFIEE }` | `ged:versement:verser` |
| Les dernières campagnes | `GET /ged/cabinet/controles-integrite?limite=` | `ged:fonds:gerer` |
| Une campagne, fonds par fonds | `GET /ged/cabinet/controles-integrite/{campagneId}` | `ged:fonds:gerer` |
| Les contrôles d'un fonds | `GET /ged/cabinet/fonds/{numero}/controles-integrite` | `ged:fonds:gerer` |

### 3. L'attestation de numérisation et le certificat d'intégrité (AC-5, AC-6)

Deux **documents probants** PDF, **figés** (NFR-4, D-1119-8) : produits une fois, gardés chiffrés dans le stockage de la
GED, **retéléchargés à l'identique** ; leur SHA-256 est inscrit au journal (`DOCUMENT_EMIS`).

| Geste | Route | Droit |
|---|---|---|
| Émettre l'attestation de numérisation d'un bordereau | `POST /ged/cabinet/fonds/{numero}/bordereaux/{rang}/attestation-de-numerisation` → **201** | `ged:fonds:gerer` |
| Émettre le certificat d'intégrité d'un fonds | `POST /ged/cabinet/fonds/{numero}/certificat-d-integrite` → **201** | `ged:fonds:gerer` |
| Les documents d'un fonds | `GET /ged/cabinet/fonds/{numero}/documents-probants` | `ged:fonds:gerer` |
| Télécharger | `GET /ged/cabinet/documents-probants/{numero}/pdf` (`attachment`, `X-Empreinte-Sha256`) | `ged:fonds:gerer` |

- **Attestation** `ATT-AAAA-NNNNN` : un bordereau **scellé** (409 `BORDEREAU_NON_SCELLE`, 404 `BORDEREAU_INCONNU`),
  intact à l'émission (409 `INTEGRITE_EN_ECART`, `details.ecarts`). Elle porte le fonds, le client, le bordereau, son
  scellé, et pour chaque pièce : nature (**« nature protégée »** pour une nature sensible, D-1119-11), exercice, pages,
  format, résolution, opérateur et date de numérisation, contrôle humain (par, le), empreinte SHA-256.
- **Certificat** `CERT-AAAA-NNNNN` : tout le fonds contrôlé à l'émission (409 `AUCUN_SCELLE`, `INTEGRITE_EN_ECART`), la
  chaîne du journal vérifiée (409 `JOURNAL_ROMPU`). Il porte chaque bordereau et son scellé (et le lien), le résultat du
  contrôle, la tête du journal vérifié (rang, empreinte) et la manière de vérifier soi-même.
- Les deux citent la loi n° 2017-07 et le référentiel ARTP v2.0 **comme références** ; ni certification par un tiers,
  ni horodatage qualifié (D-997-6, D-1119-9) ; le support de référence reste le papier.
- `numero` : séquence par cabinet et par année (`ged_compteurs`), jamais réutilisée. Objet `…/probants/<numero>.pdf`.

### Données, configuration, manifeste

- Collections neuves : `ged_journal_integrite` (unique `(organisationId, rang)`), `ged_journal_integrite_tetes`
  (unique `organisationId`), `ged_campagnes_integrite`, `ged_controles_integrite`, `ged_documents_probants` (unique
  `(organisationId, numero)`). Aucune méthode ne supprime.
- Variable neuve : `GED_CONTROLE_INTEGRITE_MOTIF`. File BullMQ neuve : `ged-integrite`.
- Manifeste **`ged` 1.4.0** : les sept routes `GET` neuves en `routesLectureSeule` ; `droits`, `publie`, `consomme`
  inchangés. **Recopie au catalogue** par B après la fusion du code (suite de cette story, D-979-24).
- **→ A (FE-143)** : types à régénérer depuis l'OpenAPI de `document-service` quand l'écran viendra.

## Livraison (2026-11-25)

- **Code** : document-service (`prospera-ocr-service`) **#33**, `b7b3f91` sur `dev` : `src/modules/ged/cabinet/`
  `integrite.ts` (forme canonique, chaîne, écarts, documents), `depot-integrite.ts` (cinq collections, transaction et
  tête de chaîne), `integrite.service.ts`, `integrite.controller.ts` (dix routes, DTO de réponse), `pdf-probants.ts`,
  `controle-integrite.planificateur.ts` (file `ged-integrite`, planificateur, processeur) ; `CabinetService` inscrit
  versement, scellé, vérification et consultation sensible, et gagne `controlerFonds` ; `DepotCabinet.changer` prend la
  session. Manifeste `ged` **1.4.0** recopié depuis `prospera-stories@13e17a4` (#918), empreinte épinglée.
- **Catalogue** : `platform-catalog-service` **#77**, `f4fcee0` sur `dev` : `ged` 1.4.0 recopié (seul manifeste qui
  change ; `manifestes:garde` verte, 48).
- **Preuves** :
  - Node 25 : unitaires 1196 passés (2 suites rouges connues du poste : copies CRLF de `ged.service.spec`, chemins
    Windows de `piece-conservation.spec` ; vertes sous Node 24) ; e2e **209/209** (15 suites ; `ged-integrite` 6/6,
    recensement de STORY-695 compris) ; lint des fichiers touchés, `tsc`, build.
  - Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive`) : unitaires 108/108 suites, 1198
    passés ; e2e 209/209.
  - Mutations **15/15** rouges sur assertion (forme canonique, lien, rang manquant, fin de journal retirée, consultation
    sensible non inscrite, servie sans trace, scellé et lien réécrits, atomicité acte-entrée, nature sensible nommée,
    certificat sur écart, certificat sur journal rompu, document altéré servi, campagne terminée rejouée, `AUCUN`) ;
    catalogue 2/2.
  - **Pile `grp-b` neuve** (image depuis l'archive ; Mongo rs0, Kafka, Redis, MinIO Chainguard ; doublure d'auth :
    JWKS et `/moi/droits` ; dossier client posé dans `dossiers_dossier`, état publié `ged` `EN_SERVICE` par Kafka ;
    motif `* * * * *`) : `healthy`, 0 erreur au journal du service ; planificateur posé dans Redis ; fonds ouvert,
    facture et bulletin de paie déposés, lus, contrôlés, versés, scellés ; **20 consultations simultanées** du bulletin
    ⇒ rangs 1 → 24 sans trou ni doublon, chaîne vérifiée ; campagne demandée `TERMINEE` par la file ; `ATT-2026-00001` et
    `CERT-2026-00001` émis, PDF retéléchargé à l'octet, SHA-256 = entrée `DOCUMENT_EMIS` = `X-Empreinte-Sha256`,
    `attachment` ; **un octet changé dans MinIO** ⇒ la campagne PÉRIODIQUE suivante (12 s plus tard) nomme
    `FICHIER_MODIFIE` (pièce, version, bordereau), le certificat est refusé 409 `INTEGRITE_EN_ECART`, le certificat déjà
    émis se retélécharge ; **une entrée réécrite en base** ⇒ rupture `EMPREINTE_FAUSSE` au rang 5, nommée aussi par la
    campagne suivante (`journal.ok: false`) ; index uniques créés. Verrou 22:14 → 22:23, `down -v`.
- **Variable neuve** : `GED_CONTROLE_INTEGRITE_MOTIF` (défaut `0 3 * * *`, UTC).

### Écarts au contrat, décidés au code

- **D-1119-12** : le CORS du service **expose** `X-Empreinte-Sha256` et `Content-Disposition` (l'écran lit l'empreinte
  et le nom d'un document téléchargé) ; ajout seul.
- **D-1119-13** : les dix routes neuves ont leurs **DTO de réponse** à l'OpenAPI, nommés par le module
  (`…IntegriteDto`, `DocumentProbantDto`) : A génère ses types sans rien écrire à la main. L'avertissement « Duplicate
  DTO `ReceptionDto` » (STORY-1088) reste à renommer avant FE-143.
- **D-1119-14** : la campagne vérifie la chaîne **après** les fonds et s'inscrit **même si la chaîne est rompue** (la
  rupture est dans `journal` de la campagne et `journalOk: false` de l'entrée) : se taire sur un journal rompu serait
  pire.
- **D-1119-15** : un document probant dont l'objet ne se déchiffre plus, ou ne redonne plus son empreinte, n'est pas
  servi : 409 `INTEGRITE_EN_ECART` (`details.document`).
- **D-1119-16** : le PDF est déposé (chiffré) **avant** la transaction du document et de son entrée ; une panne entre
  les deux perd le numéro et laisse un objet orphelin (rien ne se supprime). Rare, sans faux document : accepté.
- **D-1119-17** : la recette de l'Atelier (règle §4 de `document-service`) n'est pas rejouée : le diff ne touche ni
  l'OCR ni les extractions de pièces ; leurs e2e passent tels quels sous Node 24 et 25.
- **D-1119-18** : au catalogue, le test de STORY-1100 ne fige plus la version de `ged` ; un test STORY-1119 fige 1.4.0,
  les sept routes et les vingt droits.

## Critères d'acceptation

- **AC-1** : chaque versement, scellé, vérification, campagne, document émis et chaque consultation (contenu, texte lu)
  d'une pièce de nature sensible inscrit une entrée chaînée ; l'acte et son entrée sont atomiques ; une consultation
  sensible sans entrée possible est refusée (503).
- **AC-2** : la chaîne se vérifie ; une entrée changée, retirée ou insérée est nommée avec son rang ; deux actes
  simultanés ne fourchent jamais la chaîne.
- **AC-3** : un contrôle périodique tourne seul (motif configurable) et à la demande ; il relit les fichiers et nomme
  chaque écart (`FICHIER_MODIFIE`, `FICHIER_ABSENT`, `VERSION_AJOUTEE`, `SCELLE_MODIFIE`, `LIEN_ROMPU`, `JOURNAL_ROMPU`).
- **AC-4** : les résultats se lisent par campagne et par fonds ; la campagne est inscrite au journal.
- **AC-5** : l'attestation de numérisation d'un bordereau scellé se télécharge, à l'identique, et son empreinte est au
  journal ; une nature sensible n'y est jamais nommée.
- **AC-6** : le certificat d'intégrité d'un fonds intact se télécharge, à l'identique ; un fonds en écart ou une chaîne
  rompue le refusent (409, écarts nommés).
- **AC-7** : aucune suppression ; le chemin de l'assurance ne change pas ; le recensement des routes du cabinet
  (STORY-695) classe les routes neuves.

## Décisions prises au contrat (contestables)

- **D-1119-1 — Un journal par cabinet**, pas par fonds : une seule chaîne à vérifier et l'ordre total des actes ; le
  filtre par fonds se fait à la lecture.
- **D-1119-2 — Ce qui s'inscrit** : les actes qui fondent la preuve (versement, scellé, vérification, contrôle,
  document émis) et la **consultation sensible** au sens de l'accès au contenu (fichier ou texte lu) ; la fiche de
  métadonnées d'une pièce sensible n'en est pas une (elle reste au journal par pièce, comme aujourd'hui).
- **D-1119-3 — Atomique** : l'acte et son entrée dans une transaction MongoDB ; la tête de chaîne du cabinet sous verrou
  optimiste, l'index unique `(organisationId, rang)` en second rempart.
- **D-1119-4 — Aucun droit neuf** : `ged:fonds:gerer` (associé, archiviste) lit le journal et les contrôles, émet et
  télécharge les documents ; `ged:versement:verser` (archiviste) lance un contrôle, le même geste que la vérification.
  Un droit `ged:integrite:*` aurait demandé auth, la table d'accès et le catalogue pour la même population.
- **D-1119-5 — Le mécanisme de tâches existant** : BullMQ sur le Redis du service (STORY-996), planificateur à
  identifiant fixe ; 03:00 UTC par défaut (heure creuse au Togo, UTC+0).
- **D-1119-6 — Le contrôle périodique n'allonge pas le fonds** : ses résultats vivent dans leurs collections ; une
  entrée de journal par cabinet et par campagne, qui porte l'empreinte des résultats, les rend opposables.
- **D-1119-7 — Deux écarts neufs**, `SCELLE_MODIFIE` et `LIEN_ROMPU` : ils voient une réécriture en base que la relecture
  des fichiers ne voit pas (une ligne et son fichier changés ensemble).
- **D-1119-8 — Des documents figés** (NFR-4) : produits une fois, gardés, retéléchargés à l'identique ; refusés sur un
  fonds en écart.
- **D-1119-9 — Valeur probante, sans plus** : références à la loi 2017-07 et à l'ARTP v2.0 ; ni certification tierce
  (NF Z42-013, NF Z42-026), ni horodatage qualifié (interrupteur `horodatage-qualifie` éteint, D-997-6).
- **D-1119-10 — Aucun fait Kafka neuf** : un écart se lit ; sa publication et l'alerte de l'archiviste sont nommées pour
  STORY-1123 (les alertes de l'archiviste).
- **D-1119-11 — Une nature sensible n'est jamais nommée dans une attestation** : le document est figé et se retélécharge
  par d'autres que son émetteur ; la ligne garde pièce, version et empreinte.

## Nommé pour plus tard

- La publication d'un écart et l'alerte de l'archiviste (STORY-1123) ; la destruction visée inscrite dans ce journal
  (STORY-1121) ; le journal et les documents probants dans l'export de réversibilité (STORY-1120).
- L'horodatage qualifié d'une tête de chaîne ou d'un certificat (interrupteur `horodatage-qualifie`).
- Le journal de l'assurance (sinistres) reste non chaîné.
