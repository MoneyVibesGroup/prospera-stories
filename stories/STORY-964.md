# STORY-964 : la validation inaltérable

Status: done

**Complexité :** élevée (brouillard → définitif sous la concurrence, contre-passation, inaltérabilité gardée par le
programme et par la base, piste d'audit chaînée par empreinte et vérifiable)

**Épics :** EPIC-113 (validation brouillard → définitif, contre-passation) et EPIC-120 (piste d'audit : séquentialité
**prouvée**, horodatage, identité de l'auteur), d'`epics-comptabilite-2026-08-27.md` ; Q2 (D-L3-4)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service`
**Plage :** groupe B, n° 9 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 964).
**Dépend de :** STORY-962 (l'écriture en brouillard, `dev` `ce22d81`).
**Débloque :** STORY-966 (le grand livre, qui ne lit que des écritures validées), STORY-968 (les comptes de tiers).

**Sources lues :** fiches STORY-958, 961, 962 (« Pour la suite ») ; manifeste `comptabilite` (droits C7) ; épics de la
comptabilité (« Ce que la loi impose » : AUDCIF, écritures chronologiques, sans blanc ni altération, numérotation
continue ; « une écriture validée ne se modifie pas, elle se contre-passe ») ; journal de B (pièges de 961 et 962).

---

## Pourquoi

« Sans preuve de séquentialité, l'inaltérabilité est une affirmation, pas une garantie » (EPIC-120). STORY-962 a posé
le brouillard, qui se corrige (Q2). Cette story pose la frontière : une écriture **validée** reçoit son numéro
définitif, continu et sans trou dans son journal, et ne se modifie plus jamais. Une erreur se corrige par une écriture
de plus, la **contre-passation**. Chaque acte est consigné dans une piste dont chaque entrée porte l'empreinte de la
précédente : une altération, une suppression ou une insertion se voient.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 964)

| Exigence | Fait |
|---|---|
| Le brouillard passe au définitif | `POST …/ecritures/{id}/validation` : numéro définitif `VE-000001` émis dans la transaction de la validation (D-962-1, D-961-5) ; statut `VALIDEE` (D-964-1) |
| Une écriture validée ne se modifie plus | correction (`PUT`) et abandon (`DELETE`) d'une écriture validée : 409 `ECRITURE_VALIDEE_INALTERABLE` ; garde du programme sur la collection (D-964-3) |
| On la contre-passe | `POST …/ecritures/{id}/contre-passation` : écriture inverse, liée, numérotée, née validée ; une seule par écriture ; une contre-passation ne se contre-passe pas (D-964-4) |
| La séquence est prouvée par une piste chaînée | `rang` et empreinte SHA-256 de la précédente sur chaque entrée, une chaîne par exercice ; `GET …/piste/verification` détecte altération, suppression, insertion (D-964-5, D-964-6) |
| Droits | `comptabilite:ecriture:valider` (valider, contre-passer), lu dans `droits ∪ droitsHorsJeton` par le cache de 962 (D-964-7) |
| Exercice | pas de validation dans un exercice clos ni tenu aux cahiers (D-964-8) |
| Preuves | `test:socle` sur MongoDB 8.0 rs0 : validations concurrentes sans trou, contre-passation, refus de modification, chaîne vérifiée puis rompue ; mutations ; `docker compose up` sain |

## Décisions (prises par défaut, contestables)

- **D-964-1 : valider, c'est numéroter dans la transaction de la validation.**
  - Route `POST /api/v1/dossiers/{d}/exercices/{e}/ecritures/{ecritureId}/validation`, corps vide.
  - Ordre : portée ; exercice OUVERT chez dossier-service (`EXERCICE_CLOS`) ; tenue et plan (`EXERCICE_NON_OUVERT`,
    `EXERCICE_TENU_AUX_CAHIERS`) ; puis, dans UNE transaction : l'écriture relue (404 `ECRITURE_INTROUVABLE`), le
    numéro définitif `numeroter(portee, journal, session)`, la mise à jour conditionnée au statut `BROUILLARD`, l'entrée
    de piste `ECRITURE_VALIDEE`.
  - L'écriture reçoit `statut: VALIDEE`, `rang`, `numero` (`VE-000001`), `valideePar`, `valideeLe`. Le numéro
    provisoire reste (traçabilité du brouillard). Un index unique partiel `(portée, journal, rang)` interdit deux
    écritures au même numéro définitif, quoi qu'il arrive au compteur.
  - Rejouer la validation d'une écriture déjà validée rend **200** avec l'écriture, sans rien écrire ni numéroter (la
    première rend 201), comme l'ouverture d'un exercice (D-959). Deux validations concurrentes de la même écriture :
    `withTransaction` rejoue la perdante, qui retombe sur le rejeu.
  - L'ordre des numéros est celui des validations, pas celui des dates. La validation ne refuse pas une date antérieure
    à la dernière validée du journal : la détection des sauts de date est l'objet d'EPIC-118. Contestable.
- **D-964-2 : le brouillard se corrige et s'abandonne (Q2), tracé ; l'écriture validée, jamais.**
  - `PUT …/ecritures/{ecritureId}` corrige un brouillard (même corps que la saisie, sans `journal` : le journal et le
    numéro provisoire restent). Mêmes contrôles que la saisie (exercice, date, équilibre, pièce justificative
    revérifiée). Piste `ECRITURE_CORRIGEE`. L'écriture garde `saisiePar` et reçoit `corrigeePar`, `corrigeeLe`.
  - `DELETE …/ecritures/{ecritureId}` abandonne un brouillard : il est supprimé, la piste garde
    `ECRITURE_ABANDONNEE` avec son numéro provisoire et ses totaux. Le numéro provisoire n'est pas réémis (la série
    des brouillards peut avoir des trous : elle n'est pas légale).
  - Droit : `comptabilite:ecriture:saisir`. Une clé d'idempotence de la saisie reste à venir.
- **D-964-3 : l'inaltérabilité est gardée à deux étages.**
  - **HTTP** : corriger ou abandonner une écriture validée rend 409 `ECRITURE_VALIDEE_INALTERABLE` (`details.numero`),
    avec un message qui dit de contre-passer.
  - **Collection `ecritures`** (patron append-only de la piste, `rendreAppendOnly`) : `rendreValideesInalterables`
    pose des crochets Mongoose. Une requête qui modifie ou supprime (`updateOne`, `updateMany`, `findOneAndUpdate`,
    `deleteOne`, `deleteMany`, `findOneAndDelete`) doit filtrer `statut: 'BROUILLARD'`, sinon elle lève
    `EcritureValideeInalterable` ; `replaceOne`, `findOneAndReplace`, `bulkWrite` et le `save` d'un document persisté
    sont interdits. Une écriture validée est donc en ajout seul pour tout le code du service. C'est une exception, pas
    un refus métier (comme `EcritureAppendOnlyInterdite`).
  - Le lien de la contre-passation est porté par la NOUVELLE écriture (`contrePasse`), jamais écrit sur l'originale :
    la vue de l'originale le calcule (`contrePasseePar`).
- **D-964-4 : la contre-passation.**
  - Route `POST …/ecritures/{ecritureId}/contre-passation`, corps `{ dateEcriture, motif }`, droit
    `comptabilite:ecriture:valider`.
  - Elle crée une écriture inverse (débits et crédits permutés ligne à ligne), même journal, même devise, même pièce
    justificative, libellé `Contre-passation de VE-000003 — <motif>`, **née validée** : numérotée dans le journal dans
    sa transaction, sans numéro provisoire (elle ne passe pas par le brouillard : une correction d'écriture validée ne
    reste pas en suspens). `contrePasse: { ecritureId, numero }`. Piste `ECRITURE_CONTREPASSEE`.
  - Refus nommés : 409 `ECRITURE_NON_VALIDEE` (un brouillard se corrige ou s'abandonne) ; 409
    `ECRITURE_DEJA_CONTREPASSEE` (`details.numero` de la contre-passation existante), garanti par un index unique
    partiel sur `contrePasse.ecritureId`, même sous la concurrence ; 409 `CONTREPASSATION_NON_CONTREPASSABLE` (annuler
    une contre-passation se fait en saisissant l'écriture juste, pas en rétablissant l'erreur) ; 422
    `DATE_HORS_EXERCICE` ; 422 `DATE_ANTERIEURE_A_L_ORIGINALE`.
  - Dans le même exercice seulement : une écriture d'un exercice clos ne se contre-passe pas ici (`EXERCICE_CLOS`) ; la
    correction d'un exercice clos passe par l'exercice suivant (clôture, STORY-970).
- **D-964-5 : la piste est chaînée PAR EXERCICE (la portée), pas par journal.**
  - Pourquoi : la piste est déjà cloisonnée par organisation, dossier et exercice, et elle porte des actes qui ne sont
    d'aucun journal (`EXERCICE_OUVERT`). Une chaîne par exercice prouve l'ordre de TOUS les actes de l'exercice,
    validations et contre-passations comprises, et se vérifie d'une traite. Le coût : les actes d'un même exercice se
    sérialisent sur la tête de la chaîne (une transaction perdante est rejouée), ce qui est sans effet mesurable à
    l'échelle d'un cabinet.
  - Chaque entrée reçoit `rang` (1, 2…), `empreintePrecedente` et `empreinte` = SHA-256 (hex) d'une forme canonique de
    l'entrée (version, rang, empreinte précédente, portée, acte, objet, auteur, **provenance**, proposition, données aux
    clés triées, heure). La première entrée chaîne sur 64 zéros. La tête (`chaines_de_piste`, une par exercice) garde
    le dernier rang et la dernière empreinte ; elle est relue et avancée dans la transaction de l'acte (une course est
    un conflit d'écriture, rejoué par `withTransaction`). Index unique partiel `(portée, rang)`.
  - `consigner` exige désormais une session en transaction (`PisteHorsTransaction`), comme la numérotation (D-961-5) :
    tous les actes du service le font déjà.
  - Limite dite : une empreinte sans clé ne résiste pas à qui réécrit TOUTE la chaîne et sa tête en base. Le scellement
    (signature ou ancrage extérieur de la tête) viendra avec l'export du fichier des écritures (EPIC-120). Contestable.
- **D-964-6 : la vérification est exposée, et dit la première rupture.**
  - `GET /api/v1/dossiers/{d}/exercices/{e}/piste/verification`, droit `comptabilite:piste:consulter` (la piste dit
    qui a fait quoi). 200 `{ dossierId, exerciceId, intacte, entrees, tete: { rang, empreinte } | null, rupture?: {
    rang, motif, entreeId? }, verifieeLe }`. Une chaîne rompue n'est pas une erreur de la route : elle répond 200,
    `intacte: false`.
  - Motifs : `ENTREE_HORS_CHAINE` (une entrée sans rang : insérée hors de la chaîne), `RANG_INATTENDU` (un rang manque
    ou se répète : suppression ou insertion), `EMPREINTE_ALTEREE` (le contenu ne redonne plus son empreinte),
    `MAILLON_ROMPU` (l'empreinte précédente n'est pas celle de l'entrée d'avant), `TETE_DISCORDANTE` (la tête ne
    désigne pas la dernière entrée : la fin de la chaîne a été retirée).
  - Lecture par curseur, triée par rang : bornée en mémoire quel que soit le nombre d'entrées.
  - Au manifeste en `routesLectureSeule` (une comptabilité en lecture seule reste vérifiable).
- **D-964-7 : les droits.** Valider et contre-passer : `comptabilite:ecriture:valider` (déclaré au manifeste depuis 958
  pour « brouillard → définitif, contre-passation »). Corriger et abandonner un brouillard : `comptabilite:ecriture:saisir`.
  Vérifier la piste : `comptabilite:piste:consulter`. Lus par `/moi/droits` (`droits ∪ droitsHorsJeton`), derrière le
  cache `(membre, organisation, dv)` de 962.
  - **Pas de séparation des pouvoirs au niveau de l'acteur** : EPIC-113 et EPIC-120 ne l'exigent pas, l'AUDCIF non
    plus, et un petit cabinet a souvent un seul collaborateur par dossier, qui saisit et valide. La séparation est
    possible par les rôles (deux droits distincts) ; la piste dit qui a saisi et qui a validé (`saisiePar` dans les
    données de `ECRITURE_VALIDEE`). Une option « quatre yeux » par organisation viendra si un cabinet la demande.
    Contestable.
- **D-964-8 : l'exercice.** Valider, contre-passer, corriger, abandonner : refusés dans un exercice clos chez
  dossier-service (409 `EXERCICE_CLOS`), tenu aux cahiers (409 `EXERCICE_TENU_AUX_CAHIERS`) ou non ouvert (404
  `EXERCICE_NON_OUVERT`), avant toute lecture de l'écriture.
- **D-964-9 : l'index des numéros provisoires devient partiel.** Une contre-passation n'a pas de numéro provisoire.
  L'index unique `un_numero_provisoire_par_journal` (962) devient `un_numero_provisoire_par_journal_v2`, partiel
  (`rangProvisoire` présent). Aucune base n'est persistante avant cette story (les droits ne sont attribués à aucun
  rôle) ; une base levée avant 964 doit supprimer l'ancien index (`dropIndex`).

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Routes neuves** : `POST …/ecritures/{id}/validation`, `POST …/ecritures/{id}/contre-passation`,
  `PUT …/ecritures/{id}`, `DELETE …/ecritures/{id}`, `GET …/piste/verification`.
- **Vue d'une écriture** : `statut` admet `VALIDEE` ; champs facultatifs neufs `numero`, `valideePar`, `valideeLe`,
  `corrigeePar`, `corrigeeLe`, `contrePasse: { ecritureId, numero }`, `contrePasseePar: { ecritureId, numero }`.
  `numeroProvisoire` est absent sur une contre-passation (née validée).
- **Refus nommés neufs** : 409 `ECRITURE_VALIDEE_INALTERABLE`, `ECRITURE_NON_VALIDEE`, `ECRITURE_DEJA_CONTREPASSEE`,
  `CONTREPASSATION_NON_CONTREPASSABLE` ; 422 `DATE_ANTERIEURE_A_L_ORIGINALE`.
- **Piste** : actes neufs `ECRITURE_VALIDEE`, `ECRITURE_CONTREPASSEE`, `ECRITURE_CORRIGEE`, `ECRITURE_ABANDONNEE` ;
  champs neufs sur chaque entrée : `rang`, `empreintePrecedente`, `empreinte`.
- **Manifeste** : `GET …/piste/verification` en `routesLectureSeule` ; commentaire des droits.
- Aucun topic, aucun schéma au registre, aucune variable.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 17/11, l'annonce d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #640 (fiche, tracker, manifeste amendé, annonce du contrat, AVANT le code) | `main` `2677fee` |
| `prospera-comptabilite-service` | #5 | `dev` **`92f8c53`** (rejoué de `7b3c2cb` ; arbre identique) |

- `src/piste/` :
  - `chaine.ts` : la forme canonique (version 1), l'empreinte SHA-256, le vérificateur (première rupture) ;
  - `chaine-de-piste.schema.ts` : la tête de chaque exercice (`chaines_de_piste`) ;
  - `piste-audit.service.ts` : `consigner` exige une transaction, prend le rang suivant, chaîne sur la tête et
    l'avance sous condition ; `verifier` relit la chaîne par curseur ;
  - `piste.controller.ts` : `GET …/piste/verification` ;
  - `entree-de-piste.schema.ts` : `rang`, `empreintePrecedente`, `empreinte`, index unique `un_rang_par_exercice`.
- `src/ecritures/` :
  - `validation.service.ts` : la validation et la contre-passation ;
  - `contre-passation.ts` : les règles pures (contre-passable, date, lignes inverses, libellé) ;
  - `inalterable.ts` : la garde de la collection (`rendreValideesInalterables`) ;
  - `brouillard.service.ts` : correction et abandon du brouillard ; vue enrichie (`contrePasseePar`) ;
  - `exercice-ouvert.ts`, `vue.ts` : le contrôle d'exercice et la vue, en commun ;
  - `ecriture.schema.ts` : statut `VALIDEE`, numéro définitif, liens, trois index uniques partiels.
- `src/common/refus.ts` : cinq refus nommés neufs. `src/module.manifest.ts` recopié à l'octet depuis `main`.
- `test/socle/validation.socle-spec.ts` : suite neuve (28 tests) ; `socle.socle-spec.ts` consigne en transaction.

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` du commit poussé) :
  **33 suites, 436 passés, 3 sautés** ; `npm run lint`, `tsc --noEmit` et `npm run build` verts dans l'image.
- **`npm run test:socle`** (vrai MongoDB 8.0 `rs0`, vrai Kafka, doublures HTTP d'auth, de dossier-service et de
  document-service) : **98/98**, dont 28 neufs.
  - Validation : 201, `VE-000001`, numéro provisoire gardé, `valideePar` ; rejeu 200 sans numéro ni piste de plus.
  - Droit : un membre qui n'a que `saisir` rend 403 `DROIT_INSUFFISANT` (`details.droit` = `valider`) ; le droit
    seulement dans `droitsHorsJeton` passe.
  - **20 validations concurrentes dans AC : `AC-000001` → `000020`**, rangs 1 → 20 en base, tête de série à 20.
  - **La même écriture validée 6 fois en même temps : une 201, cinq 200, un seul numéro** (`OD-000001`).
  - **Inaltérabilité** : `PUT` et `DELETE` d'une écriture validée rendent 409 `ECRITURE_VALIDEE_INALTERABLE`, et le
    document est relu identique ; sur le vrai pilote, `updateOne`, `findOneAndUpdate`, `deleteOne`, `replaceOne` et
    `bulkWrite` sans filtre de brouillard lèvent `EcritureValideeInalterable` ; sous filtre de brouillard, la requête
    n'atteint pas l'écriture validée (`matchedCount` 0).
  - Brouillard : corrigé (200, journal et numéro provisoire gardés, `ECRITURE_CORRIGEE` ; une correction
    déséquilibrée rend 422 sans rien changer) ; abandonné (204, puis 404, `ECRITURE_ABANDONNEE`).
  - **Contre-passation** : 201, lignes inverses, née validée et numérotée, sans numéro provisoire ; l'originale montre
    `contrePasseePar` ; une seconde : 409 `ECRITURE_DEJA_CONTREPASSEE` sans numéro consommé ; contre-passer la
    contre-passation : 409 ; un brouillard : 409 `ECRITURE_NON_VALIDEE` ; datée avant l'originale : 422 ; hors
    exercice : 422 ; **5 contre-passations concurrentes : une 201, quatre 409, un seul numéro**.
  - Exercice : clos chez dossier-service, 409 `EXERCICE_CLOS` (le brouillard reste) ; aux cahiers, 409.
  - **Piste chaînée** : un exercice de 7 actes (ouverture, saisies, validations, contre-passation) aux rangs 1 → 7,
    chacun chaîné sur le précédent, tête au rang 7 : `intacte`. La chaîne de l'exercice des courses (20 validations,
    5 contre-passations concurrentes) est intacte aussi. Puis, **rompue à la main dans la base** et chaque fois
    détectée : un montant réécrit ⇒ `EMPREINTE_ALTEREE` au rang 5 ; une entrée supprimée ⇒ `RANG_INATTENDU` au rang 3 ;
    la dernière supprimée ⇒ `TETE_DISCORDANTE` ; une entrée insérée sans rang ⇒ `ENTREE_HORS_CHAINE` ; une entrée
    insérée avec rang et empreinte recalculés, la suite renumérotée ⇒ `MAILLON_ROMPU` au rang 5. Remise en état :
    intacte ; un acte de plus prend le rang 8. Sans `comptabilite:piste:consulter` : 403.
- **Mutations : 45/45 unitaires et 7/7 sur le socle rougissent sur une assertion** (« rouge » = `Tests: … failed` et
  aucun `TS\d{4}` ; quatre mutations écrites d'abord en `&& false` rougissaient par compilation, elles ont été
  réécrites et rejouées). Elles portent sur :
  - la chaîne : rang, empreinte, maillon, tête (rang et empreinte), entrée hors chaîne, précédente non avancée,
    provenance, tri des données et heure hors de l'empreinte ;
  - la piste : hors transaction admise, rang sauté, non chaînée sur la tête, tête avancée sans condition, tête lue hors
    transaction, tête créée au mauvais rang, tête déplacée ignorée ;
  - la garde de la collection : tout filtre admis, garde neutralisée, `bulkWrite`, `save`, `findOneAndDelete`, garde
    non posée ; les index uniques ; un statut inventé ;
  - la contre-passation : brouillard ou contre-passation contre-passables, date, lignes non inversées, statut, rejeu
    après une course perdue ;
  - la validation : rejeu renuméroté, numéro provisoire, mise à jour sans statut, acte faux, exercice clos ;
  - **sur le socle** : rejeu concurrent renuméroté, altération et suppression non détectées, garde de la collection
    retirée, contre-passation contre-passée, date avant l'originale, validation dans un exercice clos.
- **Pile `grp-b`** (compose du dépôt, image du commit, volumes neufs, verrou Docker pris de façon atomique) :
  `docker compose -p grp-b --profile comptabilite up -d --build` sain (quatre conteneurs `healthy`), `/api/v1/health`
  200 (`rs0`, primaire ; Kafka up). Les cinq routes neuves sont mappées et dans l'OpenAPI ; `POST …/validation` sans
  jeton : 401. Descendue avec ses volumes, images de preuve supprimées, verrou rendu.

## Pour la suite

- **STORY-966** (le grand livre) et **967** (la balance dérivée) ne lisent que les écritures `VALIDEE` ; une
  contre-passation est une écriture validée comme une autre (elle annule l'originale compte par compte). Q2 : la
  balance ne se publie pas tant qu'un brouillard reste dans la période.
- **Scellement de la tête** (D-964-5) : signer ou ancrer la tête de chaque chaîne avec l'export du fichier des
  écritures (EPIC-120, remplaçante du lot).
- **Clé d'idempotence de la saisie** (`Idempotency-Key`) : toujours à venir.
- **`comptabilite:*` à attribuer** aux rôles du cabinet dans auth-service (hors du jeton), avant B-967 : en réel,
  valider rend 403 jusque-là.
