# STORY-967 : la balance dérivée du grand livre, publiée au hub de balance

Status: in-progress

**Complexité :** élevée (un premier fait produit par le service, par une outbox ; un sceau qui doit être identique à
l'octet à celui du hub ; l'idempotence d'une publication ; les retours du hub consommés ; une preuve de bout en bout
qui traverse quatre services)

**Épic :** EPIC-114 (grand livre et balance dérivée : « publication d'une balance canonique, 5ᵉ origine du hub »),
d'`epics-comptabilite-2026-08-27.md` ; Q2 (D-L3-4)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service` (et le manifeste `comptabilite` dans `prospera-stories`)
**Plage :** groupe B, n° 12 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 967).
**Dépend de :** STORY-966 (le grand livre, `dev` `7fed6ce`), STORY-971 (les droits `comptabilite:*` attribués aux
rôles du cabinet, auth `dev` `913bd92`), **A-921** (le hub accepte l'origine `comptabilite`, balance-service `dev`
`9dfd60e`).
**Débloque :** STORY-970 (la clôture publiera la balance définitive par le même chemin).

**Sources lues :** fiches STORY-921 (D-921-1 → 6), 958, 961, 962, 964 (piste chaînée), 966 (« Pour la suite » :
`comptesMouvementes` sans limite, refus tant que des brouillards restent, mouvements hors à-nouveaux), 971 (D-971-8) ;
`balance-service` sur `origin/dev` (`98078b0`, lu sans y toucher) : `INTEGRATION.md` §1, §1 ter, §2, §3,
`docs/schemas/balance.submitted.v1.schema.json`, `balance.rejected.v1`, `src/modules/balance/balance.checksum.ts`
(et ses deux vecteurs publiés), `ingestion/ingestion.regles.ts`, `ingestion.service.ts`, `balance.validator.ts`,
`types/balance-canonique.ts`, `config/configuration.ts` (`INGESTION_SOURCE_SYSTEMS`) ; journal de A (« → B, l'origine
`comptabilite` est disponible pour B-967 ») ; journal de B (pièges de 958 → 971).

---

## Pourquoi

Le livrable aval de la comptabilité n'est pas « des écritures », c'est **une balance** (EPIC-114). Le hub de balance
(`balance-service`) est le garde-qualité unique : la liasse, le fiscal et le bilan partent de lui. Tant que la
comptabilité ne lui publie pas sa balance, un cabinet qui tient un exercice au journal n'a rien en aval. Cette story
dérive la balance du grand livre (966), la scelle comme le hub la scelle, la publie sur `balance.submitted` avec
l'origine `comptabilite`, et lit la réponse du hub.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 967)

| Exigence | Fait |
|---|---|
| Balance dérivée du grand livre | `GrandLivreService.comptesMouvementes` (966) : écritures VALIDÉES seulement, lues dans un instantané, sommes en `bigint` (D-967-2) |
| Équilibrée | mouvements et soldes vérifiés exactement avant publication ; 422 `BALANCE_DESEQUILIBREE` sinon (D-967-7) |
| Brouillard validé avant (Q2) | 409 `BROUILLARDS_A_VALIDER` tant qu'un brouillard est daté dans la période (D-967-4) |
| Contrat canonique, origine `comptabilite`, `checksum` | `balance.submitted` v1, `source: direct`, `origine: comptabilite`, sceau v2 du hub recalculé à l'identique, payload conforme au JSON Schema du hub (D-967-1, D-967-3) |
| Idempotente | même exercice, même contenu ⇒ même publication, même `checksum`, rien d'écrit ni d'envoyé ; contenu neuf ⇒ version N+1 (D-967-6) |
| Tracée | entrée `BALANCE_PUBLIEE` dans la piste chaînée, avec sa `provenance`, dans la transaction de la publication (D-967-9) |
| Droit déclaré au manifeste | `comptabilite:ecriture:valider`, déjà déclaré et attribué (D-967-8) |
| Ingérée par `balance-service` | preuve de bout en bout sur la pile `grp-b` : balance-service reconstruit depuis `origin/dev` de A l'ingère avec l'origine `comptabilite` et le même `checksum` ; une balance déséquilibrée et un `checksum` faux y sont refusés (§ Preuves) |
| Manifeste | commentaire des droits corrigé (D-971-8), faits publiés et consommés, routes de lecture ; recopié à l'octet (D-967-12) |

## Décisions (prises par défaut, contestables)

- **D-967-1 : la voie est celle que A a construite, `balance.submitted` sur Kafka, par une outbox.**
  - `INTEGRATION.md` §1 : « publier via votre outbox transactionnelle : l'événement doit être écrit dans la même
    transaction que [l'acte] qui le produit ». La publication écrit donc, dans UNE transaction : la publication
    (`balances_publiees`), l'événement (`outbox_events`) et l'entrée de piste. Un relais publie ensuite les
    événements en attente (au moins une fois ; le hub déduplique par `eventId`), clé `orgId`, en-têtes `eventId` et
    `schemaVersion: "1"`.
  - Ni appel HTTP, ni dépôt de fichier : le hub n'a pas d'autre entrée pour un vertical intégré.
  - Le relais crée le topic avant son premier envoi : l'auto-création est éteinte sur la pile du service (comme le
    consommateur crée ses topics avant `subscribe`, STORY-940).
- **D-967-2 : ce que porte la balance.**
  - **Mouvements HORS à-nouveaux** (les journaux de nature `A_NOUVEAUX` du plan arrêté) : le hub chaîne lui-même le
    socle d'à-nouveaux de l'exercice (A-921, `INTEGRATION.md` §1 ter, point 2). Ni `aNouveau*`, ni cumul antérieur.
  - **Soldes = solde de clôture à la date d'arrêté**, à-nouveaux compris : c'est le solde du compte (« solde à la date
    de la balance », contrat canonique). Le bilan lit les soldes ; les priver de l'ouverture fausserait le bilan.
  - Une ligne par compte mouvementé de la période ; une ligne dont les quatre colonnes sont nulles est omise.
  - `niveauPreuve: "fichier"` : chaque écriture validée cite une pièce justificative vérifiée chez document-service
    (D-962-4). `saisie` classerait la balance « majorité estimée » (règle FR-A27 du hub), ce qui serait faux.
  - **Libellé : « Compte <numéro> ».** Le service ne porte pas le plan de comptes du référentiel (il est dans les
    paquets de `balance-service`) ; le libellé est scellé, il doit être déterministe. Un libellé du plan viendra quand
    la comptabilité lira le paquet du référentiel (il changera le sceau, donc une version N+1). Contestable.
  - `referentiel` **déclaré** (le tag effectif du dossier pour l'exercice, `SN` | `SMT` | `SFD-BCEAO` | `CIMA`) : le
    hub le vérifie contre celui qu'il résout (`CONTENU_INVALIDE` s'il diffère), et il est scellé tel quel.
  - `devise` **déclarée** (celle du grand livre) : le hub refuse une devise qui n'est pas celle du dossier, au lieu de
    lire des XAF comme des XOF.
  - `exercice` : les bornes de l'exercice telles que dossier-service les sert, en ISO (`toISOString`) : le hub
    rattache la balance à son exercice par ces instants exacts.
  - `metadata.periode` : la date d'arrêté (contexte libre, jamais interprété par le hub).
- **D-967-3 : le sceau est celui du hub, recalculé à l'identique.**
  - SHA-256 hex de `JSON.stringify({ exercice: { debut, fin } en ISO, source, referentiel, version, lignes })`, lignes
    triées par compte en ordre des points de code, clés de chaque ligne dans l'ordre `compte, libelle,
    mouvementDebit, mouvementCredit, soldeDebiteur, soldeCrediteur, niveauPreuve` (checksum v2 de STORY-147).
    `origine` et `devise` sont hors sceau.
  - Réécrit dans le service (pas de dépendance vers le dépôt de A), et **prouvé sur les deux vecteurs publiés par le
    hub** (`6c4a5008…`, vecteur de parité FE-026 ; `08c0679e…`, vecteur du producteur microfinance).
  - Le payload produit est validé, en test, contre le JSON Schema `balance.submitted.v1` du hub, **copié à l'octet**
    depuis `origin/dev` de balance-service (`test/fixtures/balance-service/`, avec son origine).
- **D-967-4 : un brouillard dans la période est un refus nommé, pas un avertissement (Q2).**
  - 409 `BROUILLARDS_A_VALIDER` (`details.brouillards`, `details.au`) tant qu'un brouillard est daté entre le début de
    l'exercice et la date d'arrêté ; rien n'est publié.
  - Pourquoi pas une publication avec avertissement : Q2 dit « le brouillard est validé avant toute balance
    publiée ». Au hub, une balance `comptabilite` est complète, base fiscale et gèle la saisie (D-921-2) : un
    avertissement porté par une réponse HTTP ne la suivrait pas en aval. Le compte des brouillards est lu dans le même
    instantané que la balance (966).
  - Un brouillard daté **après** la date d'arrêté ne bloque pas une balance intermédiaire.
- **D-967-5 : la période et l'exercice.**
  - Une balance est celle de l'exercice, du premier jour à la date d'arrêté `au` (facultative, fin de l'exercice par
    défaut ; dans l'exercice : 422 `PERIODE_HORS_EXERCICE`, `PERIODE_INVALIDE`).
  - L'exercice est OUVERT chez dossier-service (409 `EXERCICE_CLOS` sinon : le hub refuse lui-même un dépôt sur un
    exercice clos) et tenu au JOURNAL (404 `EXERCICE_NON_OUVERT`, 409 `EXERCICE_TENU_AUX_CAHIERS`). La balance
    définitive d'un exercice clos viendra avec la clôture (970).
  - Plusieurs devises validées : 409 `DEVISE_A_PRECISER` (une lignée de versions par exercice, une devise). Aucune
    écriture validée dans la période : 409 `BALANCE_VIDE` (le hub refuse une balance sans ligne).
- **D-967-6 : l'idempotence et les versions.**
  - La lignée `comptabilite` d'un exercice a ses propres versions au hub (clé `(dossier, exercice, source, origine,
    version)`, D-921-4). La comptabilité les numérote 1, 2, 3… par exercice.
  - **Même contenu que la dernière publication** (même référentiel, mêmes bornes, mêmes lignes : l'empreinte est le
    sceau du hub sans la version) **et celle-ci n'a pas été rejetée** ⇒ 200, la même publication, le même `checksum` ;
    rien n'est écrit, rien n'est envoyé, rien n'entre dans la piste.
  - Contenu neuf ⇒ version N+1, `eventId` neuf (« une balance corrigée se pousse en N+1 », `INTEGRATION.md` §2).
  - Même contenu, mais la dernière a été REJETÉE par le hub ⇒ N+1 aussi : le hub n'a rien gardé de la rejetée, et la
    republier est le geste qui suit une correction chez lui (allowlist, KYC, référentiel).
  - La date d'arrêté est hors empreinte : le hub ne la voit pas ; deux arrêtés au même contenu sont la même balance.
  - Index unique `(organisation, dossier, exercice, version)` : deux publications concurrentes ne prennent jamais la
    même version ; la perdante est rejouée (3 fois au plus) et retombe sur la gagnante si le contenu est le même.
- **D-967-7 : l'équilibre, exactement.** Σ mouvements débit = Σ mouvements crédit, et Σ soldes débiteurs = Σ soldes
  créditeurs, en `bigint`, sans la tolérance d'une unité du hub. Une pièce validée est équilibrée par construction
  (962) : ce contrôle est une défense, il rend 422 `BALANCE_DESEQUILIBREE` (`details.ecartMouvements`,
  `ecartSoldes`) plutôt que de laisser le hub rejeter. Un montant au-delà de 2^53 − 1 : 422 `MONTANT_HORS_BORNE` (966).
- **D-967-8 : le droit.** `POST …/balance/publications` exige **`comptabilite:ecriture:valider`**, déjà déclaré au
  manifeste et attribué aux deux rôles du cabinet (971) : publier la balance, c'est rendre opposable ce que la
  validation a figé. **Aucun droit neuf, rien à attribuer dans auth.** Les lectures exigent
  `comptabilite:dossier:consulter` (« balance (lecture) » au manifeste depuis 958). Contestable : un droit propre
  `comptabilite:balance:publier` (hors du jeton, une story d'auth) si un cabinet veut séparer la publication de la
  validation.
- **D-967-9 : la piste.** Acte `BALANCE_PUBLIEE`, objet `{ type: 'balance', id: publicationId }`, auteur le membre,
  provenance déduite du geste (`CHOISI_PAR_L_UTILISATEUR` : aucune proposition de la machine), données : version,
  `checksum`, `eventId`, période, référentiel, devise, nombre de comptes, totaux. Écrite dans la transaction de la
  publication, chaînée (964). Le verdict du hub n'entre pas dans la piste (aucun humain ne l'engage) : il est porté
  par la publication.
- **D-967-10 : les retours du hub sont lus** (`INTEGRATION.md` §3 : « non optionnel »).
  - Un consommateur (groupe `comptabilite-retours-balance`, `fromBeginning`) lit `balance.rejected` et
    `balance.created`. Un rejet s'apparie par `submittedEventId` ; une création par (organisation, `checksum`,
    `version`, `source: direct`), puisque `balance.created` ne porte pas l'`eventId` soumis.
  - La publication passe de `PUBLIEE` à `INGEREE` (avec `balanceId`) ou `REJETEE` (avec `code` et `motif`). Un fait
    qui n'est pas d'une publication du service est ignoré ; un fait rejoué ne change rien.
- **D-967-11 : l'émetteur s'appelle `comptabilite-service`.**
  - C'est le nom du service (audience du jeton, `clientId` Kafka). L'allowlist du hub sur `origin/dev`
    (`INGESTION_SOURCE_SYSTEMS`, défaut `ComptabiliteServiceIMF,ComptabiliteServiceDistributeur,microfinance-service`)
    **ne le contient pas** : demande « → A » dans le journal de B. D'ici là, une pile le pose par la variable
    `INGESTION_SOURCE_SYSTEMS` (un réglage de la pile, pas un code de A) ; sans elle, le hub rejette
    `SOURCE_SYSTEM_INCONNU` et la publication le dit (`REJETEE`).
- **D-967-12 : le manifeste.** Le commentaire « Droits (C7) : DÉCLARÉS, pas encore attribuables » est corrigé
  (D-971-8 : ils sont attribués depuis 971, lus hors du jeton) ; `publie: balance.submitted` (publié) ; `consomme`
  reçoit `balance.created` et `balance.rejected` ; les deux routes de lecture entrent en `routesLectureSeule`.
  Recopié à l'octet dans le service depuis `origin/main`.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Fait produit (le premier du service)** : `balance.submitted` v1 (contrat de `balance-service`, inchangé ; JSON
  Schema, pas de registre), clé `orgId`, en-têtes `eventId` et `schemaVersion: "1"`. `sourceSystem:
  "comptabilite-service"`, `balance.source: "direct"`, `balance.origine: "comptabilite"`, `referentiel` et `devise`
  déclarés, `metadata.periode` = date d'arrêté.
- **Faits consommés** : `balance.created` et `balance.rejected` (groupe `comptabilite-retours-balance`).
- **Routes neuves** (sous `/api/v1/dossiers/{d}/exercices/{e}`) :
  - `POST …/balance/publications` (`comptabilite:ecriture:valider`), corps `{ au? }` → 201 (version neuve) ou 200
    (même contenu) : `{ publicationId, dossierId, exerciceId, version, origine, source, sourceSystem, periode: { du,
    au }, exercice: { debut, fin }, referentiel, devise, checksum, eventId, nombreDeComptes, totaux: {
    mouvementDebit, mouvementCredit, soldeDebiteur, soldeCrediteur }, lignes: [{ compte, libelle, mouvementDebit,
    mouvementCredit, soldeDebiteur, soldeCrediteur, niveauPreuve }], etat, hub, publieePar, publieeLe }` ;
  - `GET …/balance/publications` (`comptabilite:dossier:consulter`) → `{ dossierId, exerciceId, publications: [...] }`
    (la plus récente d'abord, sans les lignes) ;
  - `GET …/balance/publications/{version}` (`comptabilite:dossier:consulter`) → une publication, lignes comprises.
  - `etat` : `PUBLIEE` (écrite, en route vers le hub) → `INGEREE` | `REJETEE` ; `hub` : `null`, ou `{ balanceId? ,
    code?, motif?, recuLe }`.
- **Refus nommés neufs** : 409 `BROUILLARDS_A_VALIDER` (`details.brouillards`, `au`), 409 `BALANCE_VIDE`, 422
  `BALANCE_DESEQUILIBREE` (`details.ecartMouvements`, `ecartSoldes`), 404 `PUBLICATION_INTROUVABLE`. Existants :
  `EXERCICE_CLOS`, `EXERCICE_NON_OUVERT`, `EXERCICE_TENU_AUX_CAHIERS`, `DEVISE_A_PRECISER`, `PERIODE_INVALIDE`,
  `PERIODE_HORS_EXERCICE`, `MONTANT_HORS_BORNE`, `DROIT_INSUFFISANT`.
- **Base** : collections neuves `balances_publiees` (index unique `(organisation, dossier, exercice, version)`,
  `eventId` unique) et `outbox_events` (`eventId` unique, `(statut, creeLe)`).
- **Variables facultatives** : `OUTBOX_RELAIS_INTERVALLE_MS` (1 000 par défaut), `KAFKA_RETOURS_BALANCE_GROUP_ID`
  (`comptabilite-retours-balance` par défaut). Aucune variable requise de plus.
- **Manifeste** : D-967-12.
- **Pour A** : rien ne change dans `balance-service` ; il faut seulement que `comptabilite-service` entre dans
  `INGESTION_SOURCE_SYSTEMS` (demande « → A »).

## Definition of Done

- [ ] Tests unitaires (Node 24, étage `verification`), lint des fichiers touchés, `tsc`, build.
- [ ] `test:socle` sur un vrai MongoDB 8.0 en jeu de répliques et un vrai Kafka, sous `timeout`.
- [ ] Mutations rouges sur l'assertion (logique neuve).
- [ ] `docker compose up` sain (module Nest neuf).
- [ ] Preuve de bout en bout sur la pile `grp-b` : ingestion au hub, `checksum` identique, refus du hub sur une
  balance déséquilibrée et un `checksum` faux.
- [ ] PR de code fusionnée en rebase ; PR de docs (fiche, tracker, journal).
