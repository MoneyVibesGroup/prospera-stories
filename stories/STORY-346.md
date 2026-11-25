# STORY-346 : Import d'un fichier de paie, idempotent et versionné

Status: done (2026-11-25 — prospera-fiscal-service#64, `dev` e4630f1 ; annonce avant le code #915 ; lot 7 de D, n° 2)

**Épic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 8 · **Service :** `fiscal-service` (`:3012`), dossier de D `modules/remuneration` (D-L7-1)
**FR :** `FR-F28` (l'import est le chemin nominal) · `FR-F29` (rejouable, idempotent, versionné) · `NFR-F16`
(1 000 lignes, tout ou rien)
**Décision :** **AD-20** (l'agrégat, l'idempotence par la clé, import et saisie au même chemin) · **AD-21** (donnée
personnelle de tiers, minimisation) — `architecture-fiscal-service-2026-08-03`
**Dépend de :** **STORY-345** ✅ (prospera-fiscal-service#42, `dev` `d9a7ae2`) — l'agrégat, les deux collections,
l'index unique, le chemin unique `RemunerationService.constituer(…, provenance)` déjà prêt pour `IMPORT`.
**Débloque :** STORY-347 (la saisie, qui doit aboutir « à l'identique » de l'import), STORY-348 (le calcul).

> ⚠️ **Le format réel d'un outil de paie n'est pas connu** (question ouverte n° 2 du PRD fiscalité ; pièce n° 8 de
> `demande-pieces-fiscales-2026-08-03.md`, « un export de votre outil de paie », jamais reçue ; commentaire du tracker
> « dépend de la question ouverte n° 2 »). Le plan du lot 7 place quand même la story. **Choix par défaut (D-346-1,
> Q-D-21)** : Prospera publie **son gabarit** — un CSV aux colonnes nommées comme l'API de saisie — et le cabinet y
> verse la sortie de son outil. La correspondance avec le fichier d'un outil précis viendra quand un export réel sera
> reçu ; elle s'ajoutera devant ce lecteur, sans toucher au reste.

---

## Ce que la story livre

Une route d'import qui transforme un fichier CSV en **la même base** que la saisie : elle passe par
`RemunerationService.constituer(…, 'IMPORT')`, donc par la même validation (`validerBase`), le même document
canonique, la même empreinte, la même version et la même trace au journal (`BASE_REMUNERATION_CONSTITUEE`, provenance
`IMPORT`). Ce qui est neuf, c'est **la lecture du fichier** et **le rapport d'erreurs complet** d'un fichier refusé.

## Critères d'acceptation

- **Étant donné** un fichier de paie conforme au gabarit **quand** je l'importe **alors** la base de la période est
  constituée sans saisie (201 `CREEE`, provenance `IMPORT`).
- **Étant donné** le même fichier réimporté **quand** l'import s'exécute **alors** rien n'est dupliqué : 200
  `INCHANGEE`, aucune version, aucune ligne, aucune trace de plus. Deux imports **parallèles** du même fichier écrivent
  **une** version.
- **Étant donné** un fichier corrigé **quand** il est réimporté **alors** la base est versionnée (201, version
  suivante) **et** l'antérieure reste consultable (`GET …/:periode?version=1`).
- **Étant donné** un import de 1 000 lignes dont une est invalide **quand** il s'exécute **alors** la période entière
  est refusée (422 `IMPORT_REFUSE`) : **rien** n'est écrit, la version précédente reste la dernière ; le refus nomme
  **chaque** ligne fautive (numéro de ligne du fichier, code, message), pas seulement la première. *(NFR-F16)*
- ⛔ **Étant donné** une ligne dont la cellule `typeBeneficiaire` est vide **quand** le fichier est importé **alors**
  la ligne est en erreur `TYPE_BENEFICIAIRE_ABSENT` — **aucune valeur par défaut `SALARIE`** (FR-F79, comme 345).
- ⛔ **Étant donné** une colonne hors gabarit (un NIF, un numéro CNSS, une rubrique inconnue) **quand** le fichier est
  importé **alors** il est refusé tout entier (400 `EN_TETE_INVALIDE`, colonnes nommées) — jamais une colonne ignorée
  en silence (D-346-3).
- **Étant donné** un montant écrit avec un séparateur décimal, un point ou un signe (`250.000`, `250000,50`, `-1`)
  **quand** il est lu **alors** la ligne est en erreur `MONTANT_INVALIDE` — jamais une lecture devinée (D-346-4).
- **Étant donné** un fichier importé **quand** l'import se termine **alors** le fichier lui-même n'est conservé nulle
  part (mémoire seule) ; le journal trace l'acte, jamais le contenu (AD-21, comme 345).

## Décisions (contestables ; appliquées par défaut, `REGLES-DES-GROUPES.md` §1.2)

- **D-346-1 — Le format : le gabarit de Prospera, en CSV.** Faute d'un export réel (Q-D-21), un CSV dont la première
  ligne nomme les colonnes, **avec les noms des champs de l'API de saisie** (un seul vocabulaire pour les deux chemins) :
  `beneficiaireId`, `designation`, `typeBeneficiaire`, `redevableId`, `periode`, `salaireDeBase`, `primes`,
  `gratifications`, `commissions`, `avantagesEnNature`, `remboursementsDeFrais`. Un tableur l'écrit sans outil.
- **D-346-2 — La lecture.** UTF-8 seul (un BOM en tête est accepté ; des octets qui ne sont pas de l'UTF-8 valide ⇒ 400
  `ENCODAGE_INVALIDE`, jamais un caractère deviné). Séparateur reconnu sur la ligne d'en-tête : `;` (le tableur en
  français), `,` ou tabulation. Guillemets à la manière de la RFC 4180 (`"…"`, `""` pour un guillemet, séparateur et
  saut de ligne permis dedans) ; un guillemet non fermé ⇒ 400 `FICHIER_ILLISIBLE` avec le numéro de ligne. Fins de
  ligne `CRLF` ou `LF`. Une ligne dont toutes les cellules sont vides est ignorée (les lignes vides qu'un tableur
  ajoute en fin de feuille).
- **D-346-3 — L'en-tête est fermé.** Noms comparés sans tenir compte de la casse ni des espaces autour. Obligatoires :
  `beneficiaireId`, `designation`, `typeBeneficiaire`. Facultatives : `redevableId`, `periode` et les six rubriques
  (absente ou cellule vide ⇒ 0, comme une rubrique absente de la saisie). Une colonne **inconnue**, une colonne en
  **double** ou une obligatoire **manquante** ⇒ 400 `EN_TETE_INVALIDE` (`details` : `manquantes`, `inconnues`,
  `enDouble`). *Pourquoi refuser plutôt qu'ignorer :* une colonne « indemnités » ignorée sortirait de l'assiette sans
  que personne le voie, et une colonne de numéro CNSS n'a rien à faire dans un fichier remis au fiscal (AD-21).
- **D-346-4 — Les montants.** Des francs CFA entiers : des chiffres, avec des groupes de trois séparés par une espace
  (ordinaire, insécable ou fine insécable) permis (`250 000`). Tout point, toute virgule et tout signe ⇒
  `MONTANT_INVALIDE` : `250.000` se lirait 250 ou 250 000 selon l'outil, et le franc CFA n'a pas de subdivision en
  usage.
- **D-346-5 — Tout ou rien, et tout le rapport.** Le fichier est lu en entier et **chaque** ligne est jugée par les
  règles de la saisie (la même fonction du domaine, ligne par ligne, et les doublons de bénéficiaire). Une seule erreur
  ⇒ 422 `IMPORT_REFUSE`, `details` : `erreurs` (`{ ligne, code, message }`, les 100 premières), `nombreErreurs`,
  `lignesLues` ; rien n'est écrit. Sans erreur, la base passe par `constituer` : l'écriture (en-tête, lignes, trace) est
  **une** transaction MongoDB (345) — un échec en cours d'écriture ne laisse rien non plus. Le message du refus est
  constant (il est journalisé) ; le détail des lignes ne part qu'au client.
- **D-346-6 — L'idempotence est celle du document** (D-345-3). Le même fichier, ou le même contenu dans un autre ordre
  ou avec un autre séparateur, donne le même document ⇒ 200 `INCHANGEE`. Un contenu qui égale la dernière version,
  même saisie, est `INCHANGEE` (le document est le même). Aucune empreinte du fichier n'est gardée, ni le fichier
  (AD-21 : minimisation).
- **D-346-7 — Le transport.** `multipart/form-data`, un seul champ fichier `fichier`, **2 Mio** au plus (une ligne du
  gabarit pèse 600 octets au pire, 2 000 lignes 1,2 Mio), en mémoire seule, aucun autre champ. Le type de média déclaré par le
  navigateur est ignoré (un CSV arrive en `text/csv`, `application/vnd.ms-excel` ou `application/octet-stream`) : c'est
  le contenu qui est jugé. Les gardes (accès fiscal, rôle, droit `PREPARER`) passent avant la lecture du fichier.
- **D-346-8 — La colonne `periode`, si elle est là, protège d'une erreur de mois** : chaque cellule doit égaler la
  période du chemin, sinon `PERIODE_DISCORDANTE` sur la ligne. Absente, la période est celle du chemin.
- **D-346-9 — Le type** : cellule rognée et mise en capitales (`salarie` ⇒ `SALARIE`) ; vide ⇒
  `TYPE_BENEFICIAIRE_ABSENT` ; autre ⇒ `TYPE_BENEFICIAIRE_INCONNU`.
- **D-346-10 — Pas de route de gabarit.** L'en-tête est écrit dans la description OpenAPI de la route et dans cette
  fiche ; l'écran (A) le propose au téléchargement s'il le veut. Une route de plus pour une ligne constante n'apporte
  rien.
- **D-346-11 — Hors de cette story, sur le même chemin** : la reprise de la paie par `prospera-paie-service` (FR-24 du
  PRD des services du cabinet, 2026-11-18 : la clôture d'une période écrit la base avec la source `IMPORT`) appellera
  `constituer(…, 'IMPORT')` de service à service ; elle n'a pas de porteur au lot 7.

## Contrat (annoncé avant le code ; journal de D, « ⚠ Contrats »)

| | |
|---|---|
| Route | `POST /api/v1/dossiers/{dossierId}/remuneration/{periode}/import` |
| Gardes | accès fiscal (classe), rôle `TENANT_ADMIN` ou `TENANT_USER`, droit `fiscalite:declaration:preparer` ; dossier dans la portée (sinon 404, la même réponse) |
| Corps | `multipart/form-data`, champ `fichier` (le CSV du gabarit), 2 Mio au plus, aucun autre champ |
| 201 / 200 | `{ statut: 'CREEE' \| 'INCHANGEE', version: VersionDeBase, lignesLues }` — `version` est celle de la saisie (`provenance` `IMPORT` si elle est créée) |
| 400 | `FICHIER_ABSENT`, `MULTIPART_INVALIDE`, `ENCODAGE_INVALIDE`, `FICHIER_ILLISIBLE`, `EN_TETE_INVALIDE` (`details.manquantes`, `inconnues`, `enDouble`), `BASE_TROP_GRANDE`, `PERIODE_INVALIDE` |
| 404 | `DOSSIER_INTROUVABLE` |
| 409 | `DOSSIER_ARCHIVE`, `BASE_CONCURRENTE` |
| 413 | `FICHIER_TROP_VOLUMINEUX` (`details.limiteOctets`) |
| 422 | `IMPORT_REFUSE` (`details.erreurs[] { ligne, code, message }`, `nombreErreurs`, `lignesLues`) ; `BASE_VIDE` (aucune ligne de données) |

Codes d'une ligne dans `erreurs` : ceux de la saisie (`BENEFICIAIRE_INVALIDE`, `BENEFICIAIRE_EN_DOUBLE`,
`TYPE_BENEFICIAIRE_ABSENT`, `TYPE_BENEFICIAIRE_INCONNU`, `MONTANT_INVALIDE`, `REDEVABLE_INTROUVABLE`,
`SALARIE_NON_REDEVABLE`, `DESIGNATION_INCOMPATIBLE`) et deux du fichier : `COLONNES_EN_NOMBRE_INCORRECT`,
`PERIODE_DISCORDANTE`. Aucune route existante ne change ; aucun topic, aucun schéma de fait, aucun manifeste.

## Fichiers communs touchés (D-L7-2 ; journal de D, « ⚠ Communs »)

- Le **contrat OpenAPI** : une route neuve (ci-dessus). Rien d'autre : ni `app.module.ts` (le module
  `RemunerationModule` est déjà monté), ni `package.json` (multer vient avec `@nestjs/platform-express`, déjà employé
  par `livrables-depot`), ni migration (aucune collection, aucun index, aucun champ neuf), ni `read-models/`, ni copie du
  paquet, ni manifeste `declarations`.

## Ce que cette story ne fait PAS

- ⛔ Elle ne lit pas le fichier d'un outil de paie précis (Q-D-21) ; ni XLSX, ni format fixe.
- ⛔ Elle ne calcule rien (STORY-348) et ne change pas la saisie (STORY-347, qui comparera son résultat à celui-ci).
- ⛔ Elle ne garde ni le fichier, ni son empreinte, ni son nom.

## Definition of Done

- [x] Domaine pur du fichier (lecture, en-tête, montants, diagnostic ligne par ligne) testé, et **mutations** :
      valeur par défaut `SALARIE` sur une cellule vide ; ligne fautive écartée au lieu de refuser la période ; colonne
      inconnue ignorée ; montant à virgule accepté ; guillemets ignorés ; `periode` non comparée — chacune **rougit sur
      l'assertion**.
- [x] Service : l'import passe par `constituer(…, 'IMPORT')` ; même fichier ⇒ `INCHANGEE` ; corrigé ⇒ version 2, la 1
      lisible ; fichier fautif ⇒ rien d'écrit.
- [x] e2e (Node 24) : multipart réel, gardes avant lecture, 413, 400 multipart, 422 avec le rapport, 201 puis 200.
- [x] Conformité sur `mongo-fiscal` (jeu de répliques) : 1 000 lignes importées en une version ; le même fichier
      réimporté et deux imports parallèles ⇒ une version ; 1 000 lignes dont une fautive ⇒ aucune écriture, la
      dernière version inchangée ; import et saisie du même contenu ⇒ le même document.
- [x] Lint des fichiers touchés, `tsc`, build ; `docker compose -p grp-d` du fiscal sain et la route montée.
---

## Livré (2026-11-25) — prospera-fiscal-service#64, `dev` `e4630f1`

**Aucun écart au contrat annoncé** (prospera-stories#915). Un ajout, sans effet sur le contrat : la garde AD-13 de
STORY-560 (`garde-ad13.spec.ts`, « une seule route reçoit un fichier ») admet désormais la route d'import, avec sa
raison (D-346-12).

- **Domaine pur** `domain/remuneration/fichier-de-paie.ts` : `decoderFichier` (UTF-8 fatal, BOM retiré),
  `detecterSeparateur`, `decouper` (RFC 4180, numéro de ligne du fichier), `lireEnTete` (fermé), `lireMontant`,
  `lireFichierDePaie` (rapport complet, puis `validerBase`). `EN_TETE_GABARIT` est l'en-tête publié.
- **Domaine de 345** : `validerLigne` extraite de `validerBase` (la règle d'une ligne), `beneficiaireEnDouble` ; le
  comportement de `validerBase` est inchangé (ses 33 tests verts).
- **Application** : `RemunerationService.importer` ; `constituer` et `importer` passent par une seule écriture privée
  (`ecrire`). Le dossier est vérifié dans la portée **avant** la lecture du fichier.
- **HTTP** : la route `POST …/remuneration/{periode}/import`, `FileInterceptor` en mémoire avec les bornes complètes de
  busboy (`import-paie.constants.ts`), `TraduireRefusMulterPaieInterceptor` (413 `FICHIER_TROP_VOLUMINEUX`, 400
  `MULTIPART_INVALIDE`), `ResultatImportDto`. La description OpenAPI porte l'en-tête du gabarit.

### Décision prise en codant

- **D-346-12 — La garde AD-13 admet une troisième route de fichier.** La garde de 560 refusait toute route neuve qui
  reçoit un fichier (critère 8 : pas de pièce jointe libre où glisser un identifiant de portail). Le fichier de paie y
  entre parce que son en-tête est **fermé** : une colonne `motDePasse` ou `identifiantPortail` refuse le fichier entier
  avant toute lecture de ses cellules (test dédié), et le fichier n'est gardé nulle part.

## Preuves

- **Node 24** (étage `verification`, archive LF) : sur `9c7fa84`, e2e **13/13 suites, 253 tests**
  (`remuneration-import.e2e-spec.ts` 11) ; **`test:conformite` 18/18 suites, 114 tests** sur `mongo-fiscal` en jeu de
  répliques (`import-paie.conformite-spec.ts` 5 : 1 000 lignes en une version et une trace ; même fichier réimporté et
  trois imports parallèles ⇒ une version ; 1 000 lignes dont une fautive ⇒ aucune écriture, la version 1 reste la
  dernière ; fichier corrigé ⇒ version 2, la 1 lisible, chaîne intacte et sans montant ni nom ; saisie puis import du
  même contenu ⇒ `INCHANGEE`). Unitaires : sur `9c7fa84`, 199/200 suites — la garde AD-13 (critère 8) a vu la route
  neuve, ce qui a donné D-346-12 ; sur `e402ba1`, 200/200 suites, 2 863 tests (sur e402ba1).
- **Unitaires de la story** : fichier 43, service +4 (12), e2e 11, conformité 5.
- **Mutations 16/16 tuées** (Node 25, sur l'assertion) : type vide ⇒ `SALARIE` ; ligne fautive écartée au lieu de
  refuser ; colonne inconnue ignorée ; montant à point ou virgule accepté ; guillemets ignorés ; `periode` non comparée ;
  doublon non jugé ligne par ligne ; BOM gardé (survivante au premier passage : `trim()` retire aussi U+FEFF ; tuée par
  un test d'en-tête entre guillemets derrière le BOM) ; décodage non fatal ; rapport non borné ; colonnes sans nom de fin
  refusées ; cellules en trop non vues ; import écrit en `SAISIE` ; fichier absent non refusé ; 413 et multipart non
  traduits.
- **§1.5 — le service démarre** (`docker compose -p grp-d … --profile fiscal up -d --build fiscal-service`, image
  runtime de l'archive) : `/health` 200 (MongoDB `rs-fiscal`, audit, Kafka, Redis) ; la route
  `…/remuneration/:periode/import, POST` est montée (journal de démarrage), aucune dépendance non résolue ; un import
  sans jeton ⇒ 401.
- Lint des fichiers touchés 0 ; `tsc` 0.
- Verrou Docker : pris à 21:20 (première passe : unitaires, e2e, conformité, compose), rendu à 21:31 par le trap ; repris à 21:40 après C (seconde passe : unitaires de la tête corrigée), rendu à 21:47 ; B et C prévenus ; aucun conteneur, volume ni réseau grp-d.

## Ce qui reste (nommé, hors de cette story)

- **Q-D-21** : la correspondance avec le fichier d'un outil de paie réel, quand un export sera reçu (pièce n° 8).
- **STORY-347** : la saisie doit aboutir « à l'identique » de l'import — c'est déjà le même chemin (`ecrire`) ; 347
  vérifiera l'écran et la traçabilité de l'origine.
- La reprise de la paie par `prospera-paie-service` (FR-24 du PRD des services du cabinet) : `constituer(…, 'IMPORT')`
  de service à service, sans porteur au lot 7.
- **→ A** (écran du cabinet) : l'import et l'affichage du rapport d'erreurs ; le gabarit à proposer au téléchargement.
