# STORY-970 : la clôture — centralisation, à-nouveaux dérivés du grand livre, réouverture tracée, exercice clos inaltérable

Status: in-progress

**Complexité :** élevée (un état neuf qui doit tenir face à dossier-service sans le dupliquer ; un acte qui lit tout
l'exercice et écrit dans DEUX exercices dans une seule transaction ; des à-nouveaux qui doivent redonner les soldes de
clôture compte par compte, garder le non-lettré pièce par pièce et le tiers de chaque ligne ; un sceau qui doit fermer
toutes les routes d'écriture, même sous la concurrence ; une réouverture qui défait sans rien réécrire)

**Épic :** EPIC-119 (« clôture : centralisation, à-nouveaux dérivés du grand livre, réouverture tracée, exercice clos
inaltérable »), d'`epics-comptabilite-2026-08-27.md` ; Q2 et Q3 (D-L3-4)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service` (et le manifeste `comptabilite` dans `prospera-stories`)
**Plage :** groupe B, n° 15 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 970). **La
dernière story du plan du lot 3 pour B.**
**Dépend de :** STORY-966 (le grand livre) ; s'appuie sur 959 (exercices et tenue), 961 (plan de journaux, journal des
à-nouveaux), 964 (validation, numérotation, piste chaînée), 967 (balance publiée), 968 (tiers) et 969 (lettrage), toutes
sur `dev` (`3f8806b`).
**Débloque :** rien dans le plan ; en attente du lot 4.

**Sources lues :** plan du lot 3 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges, « ⚠
Contrats », suivante 970) et journaux de A, C, D (aucune demande ouverte à B qui passe avant cette story ; la demande
de D sur le consommateur de `facturation.facture.emise@1` reste ouverte, sans urgence, hors de ce dépôt) ; fiches 959,
964, 966, 967, 968 et 969 (« Pour la suite ») ; manifeste `comptabilite` ; `prospera-dossier-service` sur `origin/dev`
(`768a4aa`, lu sans y toucher : `exercices.controller.ts` et `.service.ts` — `POST …/clore`, `POST …/rouvrir`
TENANT_ADMIN avec motif, Q8 un seul exercice OUVERT par dossier, `dossier.exercice.clos|rouvert`) ; paquets de
référentiels de `balance-service` (`98078b0`, lus sans y toucher : `racinesDeGestion` et plans de comptes de
`syscohada-revise@2.3`, `smt-togo@1.0`, `cima-assurances@7.0`, `sfd-bceao@2.0`).

---

## Pourquoi

Un exercice qu'on ne clôt pas n'est pas tenu : ses chiffres peuvent encore bouger, et l'exercice suivant part de soldes
qu'on a recopiés à la main. EPIC-119 : la clôture fige la centralisation, publie la balance définitive, passe les
à-nouveaux **dérivés du grand livre** dans l'exercice suivant, et rend l'exercice clos **inaltérable** — sauf une
réouverture, motif à l'appui, que la piste dit.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 970)

| Exigence | Fait |
|---|---|
| La centralisation | totaux par journal, par mois et par devise des écritures validées, figés dans la clôture ; `GET …/centralisation` (D-970-4) |
| Les à-nouveaux dérivés du grand livre | soldes de clôture du grand livre (966) ⇒ une écriture du journal des à-nouveaux de l'exercice suivant, née validée et numérotée (964) : bilan reporté, collectifs par pièce ouverte et par tiers (968, 969), gestion soldée dans le résultat à affecter (D-970-5 → 7) |
| La réouverture tracée | `POST …/cloture/reouverture { motif }` : les à-nouveaux contre-passés, `EXERCICE_ROUVERT` (motif, auteur) dans la piste chaînée (D-970-9) |
| L'exercice clos inaltérable | le sceau de la chaîne de piste : toute saisie, correction, abandon, validation, contre-passation, lettrage, délettrage, proposition, publication ⇒ 409 `EXERCICE_CLOS`, même si dossier-service le rouvre ; la consultation reste ouverte (D-970-1, D-970-2) |

## Décisions (prises par défaut, contestables)

- **D-970-1 : où vit l'état « clos à la comptabilité ».** Dans la comptabilité, **sans rien demander à A** : c'est le
  **sceau de la chaîne de piste** de l'exercice (`chaines_de_piste.scellee`, STORY-964), posé dans la transaction de la
  clôture avec son entrée `EXERCICE_CLOTURE` (la dernière de la chaîne), levé par celle de la réouverture
  (`EXERCICE_ROUVERT`). Les faits vivent à côté, en ajout seul : `clotures` (une par clôture : 1, 2…) et
  `reouvertures` (une par clôture au plus). Pourquoi pas le `statut: CLOS` de dossier-service :
  - c'est la clôture **administrative**, que tout membre du cabinet pose et qu'un `TENANT_ADMIN` lève sans rien savoir
    des écritures ; l'inaltérabilité de l'AUDCIF ne peut pas dépendre d'un geste qui l'ignore ;
  - son Q8 (un seul exercice OUVERT par dossier) impose l'ordre : N y est clos AVANT que N+1 y soit ouvert ; la
    clôture comptable de N vient donc après, quand N+1 est ouvert au journal (elle y passe les à-nouveaux) ;
  - la comptabilité ne garde que sa tenue, sans dupliquer la vérité (D-959-1) : le sceau ne dit pas « l'exercice est
    clos », il dit « la comptabilité de cet exercice est arrêtée ».
  **Deux verrous, deux clés** : une écriture exige l'exercice OUVERT chez dossier-service ET non scellé ici. dossier-service
  n'est pas modifié ; aucune demande à A n'est nécessaire (information « → A » au journal).
- **D-970-2 : toutes les routes d'écriture refusent un exercice clôturé.** Le contrôle est fait deux fois : tôt, dans
  `exigerExerciceOuvertAuJournal` (après le statut de dossier-service, avant le plan et tout appel), qui garde la
  saisie, la correction, l'abandon, la validation, la contre-passation, la publication, le lettrage, le délettrage et
  les propositions de lettrage ; et **dans la transaction de l'acte**, par `PisteAuditService.consigner` : une chaîne
  scellée ne reçoit plus d'entrée (sauf `EXERCICE_ROUVERT`). Un acte commencé avant la clôture se heurte à la tête de
  la chaîne, est rejoué, et tombe sur le sceau. Refus : 409 **`EXERCICE_CLOS`**, le code existant, avec `details.statut
  = 'CLOTURE'` et `details.clotureId` (dossier-service CLOS garde `details.statut = 'CLOS'`). La consultation reste
  ouverte (écritures, grand livre, balances, lettrages, tiers, piste, tenue, journaux, clôture, centralisation).
- **D-970-3 : les préalables.** Droit **`comptabilite:exercice:cloturer`** (déclaré en 958, attribué à `CAB_ASSOCIE`
  seul en 971 : aucun droit neuf). **Bloquent** (refus nommés) : l'exercice tenu au journal ; **aucun brouillard** dans
  l'exercice (409 `BROUILLARDS_A_VALIDER`, Q2) ; la balance équilibrée (422 `BALANCE_DESEQUILIBREE`) ; les chaînes de
  piste de N **et** de N+1 intactes (409 **`PISTE_ROMPUE`**, `details.rang`, `motif` : un exercice dont la séquence
  n'est plus prouvée s'examine, il ne se clôt pas) ; aucun compte ni de bilan ni de gestion avec un solde (409
  **`COMPTES_HORS_CLOTURE`**) ; l'exercice suivant (D-970-7). **N'avertit ni ne bloque** : le non-lettré — une facture
  ouverte au 31/12 est normale ; elle est reportée pièce par pièce, et la clôture dit combien (`piecesOuvertes`). Le
  statut de N chez dossier-service n'est pas exigé (Q8 le rend CLOS en pratique).
- **D-970-4 : la centralisation.** Les écritures VALIDÉES (contre-passations et écarts compris), groupées par
  **journal, mois (`AAAA-MM` de la date d'écriture) et devise** : nombre de pièces, total au débit, au crédit,
  `equilibree` ; puis les totaux par journal, et ceux de l'exercice (`equilibre`). Figée dans la clôture
  (`clotures.centralisation`, montants entiers exacts) ; `GET …/centralisation` rend la figée (`figee: true`,
  `clotureId`) pour un exercice clôturé, la calculée à l'instant (instantané MongoDB) sinon.
- **D-970-5 : les à-nouveaux, dérivés du grand livre.** Source : les **soldes de clôture** du grand livre de N (966),
  lus DANS la transaction de la clôture. Règle (pure, `src/cloture/a-nouveaux.ts`) :
  - **bilan** : une ligne par compte, de son solde (débiteur au débit, créditeur au crédit) ; un solde nul, aucune ;
  - **collectifs** (968) : **une ligne par pièce ouverte** — chaque ligne de tiers validée garde son reste NON LETTRÉ
    (969), au même compte, au même tiers, dans le même sens, avec **son échéance** (sinon sa date) et **sa référence**
    (sinon le numéro de sa pièce, `VE-000002`) : la balance âgée de N+1 la range au même retard, et le lettrage de N+1
    retrouve la facture par sa référence. Ce qui est lettré ne se reporte pas. Un lettrage entre deux sous-comptes du
    même collectif (411100 / 411200, même tiers) laisse un sous-compte dont les restes diffèrent du solde : une ligne
    d'**AJUSTEMENT** par sous-compte et par tiers rétablit le solde (elles se lettrent entre elles dans N+1). Les lignes
    sans tiers (validées avant 968) : une ligne par compte, sans tiers. Vérifié par construction : la somme des lignes
    d'un compte égale son solde de clôture (une faute lève, rien n'est écrit) ;
  - **gestion** : aucune ligne ; le net des comptes de gestion est **le résultat à affecter**, une ligne au compte de
    résultat du référentiel (bénéfice au crédit, perte au débit) ;
  - les à-nouveaux s'équilibrent si le grand livre l'est ; ils sont vérifiés équilibrés avant d'être écrits.
- **D-970-6 : ce qui est de bilan, de gestion, et le compte du résultat : `comptes-de-cloture@1`**, une donnée par
  référentiel (`src/cloture/comptes-de-cloture-declares.json`), validée au démarrage, **vérifiée dans les paquets de
  balance-service** (`racinesDeGestion` et plans de comptes) :
  - **SN, SMT** : bilan 1 à 5 ; gestion 6, 7, 8 ; résultat **131 « Résultat net : bénéfice » / 139 « Résultat net :
    perte »** (13 « Résultat net de l'exercice » est au paquet ; 131 et 139 sont ses divisionnaires du plan SYSCOHADA
    révisé) ;
  - **CIMA** : bilan 1 à 5 et 88 ; gestion 6, 7, 82 à 86 ; résultat **88 « Résultats en instance d'affectation »** —
    13 y est « Réserves réglementaires », pas le résultat ; 80, 87, 89 sont des comptes de passage de la clôture :
    **à valider par un expert** (comme 844 / 849 en 969) ;
  - **SFD-BCEAO** : bilan 1 à 5 ; gestion 6, 7 ; résultat **59 « Résultat »** (13 y est un compte de prêts).
  La classe 9 (engagements hors bilan, analytique) n'est ni reportée ni soldée : un solde y refuse la clôture.
- **D-970-7 : l'écriture d'à-nouveaux.** Dans l'**exercice suivant** : la tenue du dossier qui commence après N (959),
  **au journal** (409 `EXERCICE_SUIVANT_NON_OUVERT`, `EXERCICE_SUIVANT_TENU_AUX_CAHIERS`), **OUVERT chez
  dossier-service** (409 `EXERCICE_SUIVANT_CLOS`), qui commence **le lendemain** de la fin de N (409
  `EXERCICES_NON_CONTIGUS`), dans le **même référentiel** (409 `REFERENTIELS_DIFFERENTS`), avec un journal de nature
  `A_NOUVEAUX` au plan arrêté (409 `JOURNAL_DES_A_NOUVEAUX_ABSENT`), et pas lui-même clôturé (409
  `EXERCICE_SUIVANT_CLOTURE`). Une écriture par clôture, **née VALIDÉE** et numérotée par `numeroter` dans la
  transaction (`AN-000001`, 964), **datée du premier jour** de N+1, libellé « À-nouveaux de l'exercice <N> » ; sa pièce
  justificative est **la clôture elle-même** (`pieceId: CLOTURE-<id>`, type `CLOTURE_D_EXERCICE`) ; provenance
  `CHOISI_PAR_L_UTILISATEUR` (la règle est déterministe, l'associé l'engage) ; elle porte le champ **ajouté**
  `aNouveauDe: { clotureId, exerciceId }` et s'inscrit dans la piste de N+1 (`A_NOUVEAUX_GENERES`). 10 000 lignes au
  plus (422 `A_NOUVEAUX_TROP_VOLUMINEUX` ; une pièce saisie en a 500). Une seule devise par exercice (sinon 409
  `DEVISE_A_PRECISER`, 966). Un exercice sans aucune écriture se clôt sans à-nouveaux.
- **D-970-8 : la clôture publie la balance définitive.** Dans sa transaction, sur le grand livre qu'elle vient de lire,
  au dernier jour de N, par la publication de 967 (outbox `balance.submitted`, entrée `BALANCE_PUBLIEE` juste avant
  `EXERCICE_CLOTURE`) ; idempotente : la même balance déjà publiée est reprise, rien n'est envoyé
  (`publieeParLaCloture: false`). Pourquoi : dossier-service clôt N avant N+1 (Q8), et la publication ordinaire refuse
  un exercice CLOS ; sans la clôture, la balance définitive ne partirait jamais. Après la clôture, `POST
  …/balance/publications` est refusé (D-970-2) ; la balance publiée reste lisible. Un exercice vide ne publie rien.
- **D-970-9 : la réouverture.** `POST …/cloture/reouverture { motif }` (même droit ; motif obligatoire, pas fait
  d'espaces, 500 caractères) : dans une transaction, l'écriture d'à-nouveaux de la clôture est **contre-passée** dans
  N+1 (née validée, numérotée dans le même journal, `contrePasse`, `aNouveauDe`, `A_NOUVEAUX_CONTREPASSES` dans la
  piste de N+1), l'entrée `EXERCICE_ROUVERT` (motif, auteur, clôture, contre-passation) **descelle** la chaîne de N, et
  la réouverture s'écrit. La clôture suivante **régénère** des à-nouveaux neufs. Pourquoi contre-passer plutôt que
  refuser quand N+1 a des écritures : N+1 en a toujours (on y travaille depuis janvier) ; refuser rendrait la
  réouverture impossible. Refus : 409 `EXERCICE_NON_CLOTURE` ; 409 **`A_NOUVEAUX_LETTRES`** si une ligne des
  à-nouveaux est lettrée dans N+1 (on délettre d'abord, comme D-969-10) ; 409 `EXERCICE_SUIVANT_CLOS`,
  `EXERCICE_SUIVANT_CLOTURE`. **La comptabilité ne rouvre pas l'exercice chez dossier-service** : s'il y est CLOS, la
  saisie reste refusée tant qu'un `TENANT_ADMIN` ne l'y a pas rouvert (et Q8 exige alors d'y clore N+1 d'abord).
- **D-970-10 : la concurrence et le rejeu.** Deux clôtures simultanées se heurtent sur la tête de la chaîne de N (et
  sur la série du journal des à-nouveaux) : une seule s'engage, l'autre est rejouée par `withTransaction`, relit le
  sceau et rend la clôture en vigueur (200). Une clôture rejouée plus tard : 200, rien d'écrit. Une course sur un index
  unique (`une_cloture_par_numero`, version de balance) est rejouée trois fois au plus.
- **D-970-11 : des à-nouveaux ne se contre-passent pas à la main** : 409 **`A_NOUVEAUX_DE_CLOTURE`** ; seule la
  réouverture de l'exercice clos les annule (sinon N+1 ouvrirait sur des soldes que la clôture de N ne dit plus). Ils
  se lettrent dans N+1 comme toute ligne de tiers validée.
- **D-970-12 : les lectures.** `GET …/cloture` : l'état (`NON_CLOTURE`, `CLOTURE`, `ROUVERT`), la dernière clôture et
  l'historique (chaque clôture avec sa réouverture). `GET …/centralisation` (D-970-4). Droit
  `comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`.
- **D-970-13 : aucun droit neuf, aucun topic neuf, aucun schéma au registre.** `balance.submitted` est le fait de 967,
  inchangé.
- **D-970-14 : le manifeste.** Deux routes de lecture, le commentaire de la clôture et des droits, « clôtures » dans
  l'avertissement de désinstallation ; recopié à l'octet dans le service après la fusion de l'annonce.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Routes neuves**, sous `/api/v1/dossiers/{d}/exercices/{e}` :
  - `POST …/cloture` (`comptabilite:exercice:cloturer`, sans corps) → **201** `Cloture`, **200** au rejeu ;
  - `POST …/cloture/reouverture { motif }` (`comptabilite:exercice:cloturer`) → **201** `EtatDeCloture` ;
  - `GET …/cloture` → `EtatDeCloture` ; `GET …/centralisation` → `{ dossierId, exerciceId, figee, clotureId,
    centralisation }` (`comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`).
  - `Cloture` = `{ id, dossierId, exerciceId, numero, referentiel, devise, debutExercice, finExercice, centralisation:
    { lignes: [{ journal, mois, devise, pieces, debit, credit, equilibree }], journaux: [{ journal, devise, pieces,
    debit, credit }], totaux: [{ devise, pieces, debit, credit, equilibre }] }, resultat: { sens: BENEFICE | PERTE |
    NUL, montant, compte, totalCharges, totalProduits }, aNouveaux: { exerciceId, ecritureId, numero, journal,
    dateEcriture, nombreDeLignes, piecesOuvertes, totalDebit, totalCredit }, balance: { version, checksum,
    publieeParLaCloture } | null, nombreDeComptes, rangDansLaPiste, cloturePar, clotureLe, reouverture: { id, motif,
    rouvertPar, rouvertLe, exerciceSuivantId, contrePassations: [{ ecritureId, numero, contrePasse,
    numeroContrePasse }], rangDansLaPiste } | null }` ;
  - `EtatDeCloture` = `{ dossierId, exerciceId, etat: NON_CLOTURE | CLOTURE | ROUVERT, derniere: Cloture | null,
    historique: Cloture[] }`.
- **Champ AJOUTÉ (facultatif), rien de renommé** : `aNouveauDe: { clotureId, exerciceId }` sur toute écriture lue
  (présent sur les à-nouveaux nés d'une clôture et sur leur contre-passation).
- **Comportements** :
  - sur un exercice **clôturé**, toute route d'écriture (saisie, correction, abandon, validation, contre-passation,
    lettrage, propositions, acceptation, délettrage, publication de la balance) rend 409 **`EXERCICE_CLOS`** avec
    `details: { statut: 'CLOTURE', clotureId }`, même si l'exercice est OUVERT chez dossier-service ;
  - la contre-passation d'une écriture d'à-nouveaux née d'une clôture : 409 **`A_NOUVEAUX_DE_CLOTURE`**.
- **Refus nommés neufs** : 409 `PISTE_ROMPUE`, `COMPTES_HORS_CLOTURE`, `EXERCICE_SUIVANT_NON_OUVERT`,
  `EXERCICE_SUIVANT_TENU_AUX_CAHIERS`, `EXERCICE_SUIVANT_CLOS`, `EXERCICE_SUIVANT_CLOTURE`, `EXERCICES_NON_CONTIGUS`,
  `REFERENTIELS_DIFFERENTS`, `JOURNAL_DES_A_NOUVEAUX_ABSENT`, `EXERCICE_NON_CLOTURE`, `A_NOUVEAUX_LETTRES`,
  `A_NOUVEAUX_DE_CLOTURE` ; 422 `A_NOUVEAUX_TROP_VOLUMINEUX`.
- **Piste** : actes neufs `EXERCICE_CLOTURE` (scelle), `EXERCICE_ROUVERT` (descelle), `A_NOUVEAUX_GENERES`,
  `A_NOUVEAUX_CONTREPASSES`.
- **Base** : collections neuves `clotures`, `reouvertures` (en ajout seul) ; champ neuf `scellee` sur
  `chaines_de_piste` ; champ neuf `aNouveauDe` sur `ecritures`. **Donnée** du service : `comptes-de-cloture@1`.
- **Fait** : `balance.submitted` (967), inchangé, émis aussi par la clôture (la balance définitive). Aucun topic neuf,
  aucun schéma au registre, aucune variable neuve.
- **Manifeste** : D-970-14.

## Ce qui a été livré

_À compléter à la fusion._

## Preuves

_À compléter à la fusion._

## Definition of Done

- [ ] Tests unitaires (Node 24, étage `verification`), lint des fichiers touchés, `tsc`, build.
- [ ] `test:socle` sur un vrai MongoDB 8.0 en jeu de répliques et un vrai Kafka, sous `timeout` : cycle complet,
  chaîne intacte, concurrence.
- [ ] Mutations rouges sur l'assertion (logique neuve).
- [ ] `docker compose up` sain (module Nest neuf).
- [ ] PR de code fusionnée en rebase ; PR de docs (fiche, tracker, journal, fin du lot 3 de B).
