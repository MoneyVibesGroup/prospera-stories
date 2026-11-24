# STORY-322 : Calculé, déclaré, payé — trois montants distincts et durables, et l'écart se motive

Status: ready-for-dev — **Fiche écrite le 2026-11-24** par la session du groupe A (lot 6, n° 7 de la ligne de A : plan
amendé le 24/11, #769). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md`
(EPIC-031, STORY-322), la règle FR-F24 du PRD fiscalité, et ce que lira STORY-1101 (C).

**Service :** `prospera-fiscal-service` (tenu par A jusqu'à la fusion de 328, puis rendu à C) ; `balance-service` n'est pas
touché (tenu par C) · **Points :** 3 · **Epic :** EPIC-031 · **Après :** STORY-320 (#55, `da3acd3`) ·
**Suite :** STORY-328 (anomalies), STORY-1101 (C, le rapprochement des douze mois face à la liasse) ; STORY-321 (le calcul
délégué au moteur) reste à faire.

---

## Le fait

Une obligation porte aujourd'hui **un seul montant** : `montantAttendu` (toujours `null`, aucun moteur ne l'alimente) ou
`montantSaisi` (314, pour les taxes que le moteur ne calcule pas). Rien ne dit **ce qui a été déclaré**, ni **ce qui a été
payé**. Le contrôleur, lui, compare les trois, et c'est l'écart qui devient le redressement (V4, salle des cabinets du
19/11). FR-F24 : « chaque déclaration conserve, distinctement et définitivement : montant calculé, montant déclaré, montant
payé. Un écart entre les trois est visible et doit être motivé. »

## Ce que le code porte déjà (lu sur `origin/dev`, `da3acd3`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le calculé | `montantAttendu` (dérivé, `null` : aucun moteur) ; `montantSaisi` `{ montant, par, le }` pour les familles non calculables (314) ; `montantASaisir`, `refusCalcul` | `obligation.schema.ts`, `domain/obligations/montant.ts` |
| La source du calculé | `basesFiscales.source` `{ balanceId, version, etat, statutPreuve, checksum, … }` (320) | `domain/obligations/bases-fiscales.ts` |
| Le cycle | onze états ; `VALIDEE` = le visa de l'associé ; `DEPOSEE`, `A_PAYER`, `PAYEE` | `domain/obligations/cycle.ts` (323) |
| Le patron d'écriture | `transitionner`, `constaterBases`, `saisirMontant` : comparaison-échange sur l'état, audit dans la même transaction | `adapters/mongo/mongo-registre-obligations.ts` |
| Le moteur de balance | `balance-service` sert déjà un moteur fiscal PAR DOSSIER et PAR EXERCICE (`GET /dossiers/{id}/fiscal/tva?periode=`, `…/liquidation`, `…/tpu`, `…/moteur`). Rien n'y est PAR OBLIGATION (taxe, période) | lu seulement |

## Critères d'acceptation

Ceux de l'épic, tels quels :

1. **Étant donné** une déclaration **quand** on la consulte **alors** montant calculé, déclaré et payé sont trois valeurs
   distinctes et durables.
2. **Étant donné** un montant déclaré différent du montant calculé **quand** la déclaration est validée **alors** un motif
   est exigé.
3. **Étant donné** un tel écart **quand** on consulte le dossier de contrôle **alors** l'écart et son motif y figurent.

## Décisions (D-322-n) — prises le 2026-11-24, contestables

- **D-322-1 — 321 N'EST PAS faite avec 322 ; le « calculé » dit honnêtement ce qu'il est.** Le moteur de `balance-service`
  existe, mais par dossier et par exercice. Faire dire à ce moteur « le montant de CETTE obligation » (correspondance
  taxe × période → route du moteur, traduction de ses 409 de paramétrage, un appel par obligation) est une story à part
  (321, 5 points), et STORY-1101 n'en a pas besoin : elle lit le **déclaré** (cumul des périodes déposées) face à la
  liasse. La plus petite livraison qui serve : le triplet, dont le calculé est **explicite** : `MOTEUR` quand 321
  écrira `montantAttendu` (rien ne change alors dans 322), `SAISI_CABINET` aujourd'hui pour les familles non calculables,
  sinon **indisponible, avec son motif nommé** (`CALCUL_DELEGUE_NON_DISPONIBLE`, `MONTANT_A_SAISIR`, `SANS_MONTANT`).
  Jamais un zéro, jamais un calcul local (AD-1, AD-4). **Demande à C : aucune bloquante.** Recommandation pour 321, au
  journal : un calcul par obligation côté `balance-service` (taxe, période, redevable → montant et détail), plutôt qu'un
  mappage du côté fiscal.
- **D-322-2 — Le triplet est une VUE sur trois valeurs ; deux sont des champs humains neufs.** Le calculé n'est pas
  copié : il se lit (`montantAttendu`, sinon `montantSaisi`), et `basesFiscales.source` dit sur quelle balance (320).
  `montantDeclare` et `montantPaye` sont deux champs HUMAINS de l'obligation : une re-dérivation ne les touche jamais
  (AD-17), comme le statut et le montant saisi.
- **D-322-3 — Le montant saisi (314) vaut « calculé par le cabinet ».** Pour une taxe que le moteur ne calcule pas, le
  cabinet fait le calcul et le saisit : c'est son calculé, avec `origine: SAISI_CABINET`, qui dit qui et quand. Sans cela
  le triplet resterait vide pour toutes les taxes aujourd'hui.
- **D-322-4 — Le déclaré s'enregistre de la préparation à l'accusé de réception.** `POST /obligations/{id}/montant-declare`
  `{ montant, motifEcart? }` (entier ≥ 0, unités de la devise, comme 314). États permis : `EN_PREPARATION` à
  `ACCUSE_RECU`. Une nouvelle saisie REMPLACE la précédente jusqu'à `A_DEPOSER` ; à partir de `DEPOSEE`, un déclaré déjà
  enregistré est **figé** (`409 MONTANT_DECLARE_FIGE` : une correction est une rectificative, STORY-325) ; un premier
  enregistrement reste permis (retrouver ce qui figure sur l'accusé). Droit `fiscalite:declaration:preparer` (aucun droit
  neuf). Obligation écartée : `409 OBLIGATION_DESACTIVEE` ; redevable bloqué : `409 OBLIGATION_BLOQUEE`. Famille sans
  montant (DSF) : `409 MONTANT_NON_SAISISSABLE`.
- **D-322-5 — L'écart se motive à la VALIDATION, et le calculé se fige au visa.** Écart = déclaré − calculé, quand les
  deux existent. Au passage `A_VALIDER → VALIDEE`, un écart sans motif refuse : `409 MOTIF_ECART_REQUIS`. Le motif
  s'écrit avec le déclaré (`motifEcart`, 3 à 500 caractères). Avant le visa, l'écart se calcule contre le calculé
  COURANT ; **au visa, le calculé est figé sur le déclaré** (`calculeFige`) : ce que l'associé a visé reste lisible même
  si le calculé change ensuite (une nouvelle saisie 314, le moteur de 321). Un déclaré enregistré après le visa se fige à
  l'enregistrement. Calculé indisponible : aucun écart, donc aucun motif exigé, et le triplet le dit.
- **D-322-6 — Le payé s'enregistre à `A_PAYER` et `PAYEE`.** `POST /obligations/{id}/montant-paye`
  `{ montant, motifEcart? }`. Il suppose un déclaré (`409 MONTANT_DECLARE_ABSENT`). Un payé différent du déclaré exige un
  motif **à l'enregistrement** (aucune transition ne s'y prête : un règlement partiel ou des pénalités s'expliquent au
  moment où on les inscrit) : `409 MOTIF_ECART_REQUIS`. Hors de ces deux états : `409 PAIEMENT_NON_ENREGISTRABLE`.
  Remplaçable jusqu'à `PAYEE` ; `CLOTUREE` le fige. Droit `preparer`.
- **D-322-7 — Audit, dans la même transaction.** Deux actes neufs au journal chaîné `obligation:<id>` :
  `OBLIGATION_MONTANT_DECLARE` et `OBLIGATION_MONTANT_PAYE`, contenu `{ montant, precedent, calcule, empreinteMotif }`.
  Le journal est ineffaçable : le motif en CLAIR reste sur l'obligation, l'audit n'en garde que l'empreinte (comme
  `OBLIGATION_DESACTIVEE`, 306). L'acte `OBLIGATION_TRANSITION` ne change pas d'un octet : le figement du calculé au visa
  s'écrit par un acte à part, `OBLIGATION_CALCULE_FIGE`, dans la même transaction, uniquement quand un déclaré existe.
- **D-322-8 — Le dossier de contrôle lit les écarts.** `GET /api/v1/exercices/{exerciceId}/obligations/ecarts`
  (`?redevableId=` comme le calendrier) rend les obligations ACTIVES de l'exercice qui portent un écart non nul, avec
  `triplet`, motif compris. STORY-336 (le dossier de contrôle) la lira ; STORY-1101 lit le déclaré directement chez
  `RegistreObligations`.
- **D-322-9 — Aucun événement, aucun droit neuf, manifeste `declarations` inchangé** (1.0.0).
- **D-322-10 — Hors périmètre, nommé :** le calcul délégué (321) ; l'anomalie `ECART_SANS_MOTIF` et sa levée (328) ;
  `BASE_PROVISOIRE` (laissée par 320 à 328) ; la rectificative (325) ; le rapprochement avec la liasse (1101) ; les
  règlements partiels répétés (un seul payé, remplaçable) ; l'écran (FE-081).

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls** dans `prospera-fiscal-service` : aucun champ, route ni code renommé ; aucun droit neuf ; aucun événement
Kafka ; manifeste inchangé. Rien d'écrit ni de lu chez `balance-service`.

- **Champ neuf sur `ObligationResponseDto`** (calendrier, fiche, retours de `transition`, `bases`, `montant`) : `triplet`
  (jamais `null`) :
  ```
  triplet: {
    calcule: { montant: number | null,
               origine: 'MOTEUR' | 'SAISI_CABINET' | null,
               indisponible: 'SANS_MONTANT' | 'MONTANT_A_SAISIR' | 'CALCUL_DELEGUE_NON_DISPONIBLE' | null,
               message: string | null,
               source: { balanceId, version, etat, statutPreuve, checksum } | null },
    declare: { montant, motifEcart: string | null, calculeRetenu: number | null, fige: boolean,
               par, le } | null,
    paye:    { montant, motifEcart: string | null, par, le } | null,
    ecarts:  { declareMoinsCalcule: number | null, payeMoinsDeclare: number | null, motifRequis: boolean }
  }
  ```
  `calcule.montant` non nul ⇒ `origine` non nul et `indisponible` nul ; sinon `indisponible` et `message` (en clair) sont
  non nuls. `declare.calculeRetenu` : le calculé figé au visa si `fige`, sinon le calculé courant. `ecarts.motifRequis` :
  un écart existe et son motif manque. **→ D (FE-081)** : types à régénérer ; les trois colonnes du triplet, l'écart en
  rouge tant que `motifRequis`.
- **Routes neuves** (droit `preparer`, 200 : l'obligation) : `POST /api/v1/obligations/{id}/montant-declare` et
  `POST /api/v1/obligations/{id}/montant-paye`, corps `{ montant: entier ≥ 0, motifEcart?: string }`.
  `GET /api/v1/exercices/{exerciceId}/obligations/ecarts` (lecture, tout membre habilité) : `ObligationResponseDto[]`.
- **Comportement ajouté** : `POST …/transition` vers `VALIDEE` refuse `409 MOTIF_ECART_REQUIS` quand un écart déclaré / calculé
  n'a pas de motif ; elle fige le calculé quand un déclaré existe. Les autres transitions ne changent pas d'un octet.
- **Refus nouveaux** : `400 MONTANT_INVALIDE`, `MOTIF_INVALIDE` ; `409 MONTANT_NON_SAISISSABLE`, `OBLIGATION_DESACTIVEE`,
  `OBLIGATION_BLOQUEE`, `MONTANT_DECLARE_NON_ENREGISTRABLE` (état hors de la plage), `MONTANT_DECLARE_FIGE`,
  `MONTANT_DECLARE_ABSENT`, `PAIEMENT_NON_ENREGISTRABLE`, `MOTIF_ECART_REQUIS`, `TRANSITION_CONCURRENTE` ; `404
  OBLIGATION_INTROUVABLE`.
- **Champs de base neufs** sur `obligations` : `montantDeclare`, `montantPaye` (humains, absents ⇒ `null`, aucune reprise de
  données). **Journal chaîné** : actes neufs `OBLIGATION_MONTANT_DECLARE`, `OBLIGATION_MONTANT_PAYE`,
  `OBLIGATION_CALCULE_FIGE`.
- **Pour STORY-1101 (C)** : le déclaré d'une obligation se lit sur `Obligation.montantDeclare` (`RegistreObligations`,
  `duDossier`) ; le cumul des périodes d'une taxe sur un exercice est le travail de 1101, avec ses périodes non déclarées
  NOMMÉES (jamais zéro). Pour STORY-328 : les candidats d'anomalie sont `DECLARE_ABSENT_AU_DEPOT`, `ECART_SANS_MOTIF`,
  `BASE_PROVISOIRE` ; les lire sur `triplet` et `basesFiscales`.

## Preuves attendues

Unitaires (`-w 2`, Node 24, étage `verification`) du domaine (le calculé et ses quatre indisponibilités, l'écart, le
figement, les états permis) et des services (ordre des vérifications, motif exigé au visa, aucun écrit sur un refus) ;
`test:conformite` sur `mongo:7` en jeu de répliques (écriture + audit dans la même transaction, comparaison-échange, une
re-dérivation n'efface ni le déclaré ni le payé, le figement et son acte, le visa sans déclaré) ; e2e ; mutations qui
rougissent sur l'assertion ; `docker compose up` du service, qui démarre, et les routes neuves rendent `401` sans jeton.
Pas de preuve Kafka (aucun événement).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-24 | Fiche écrite, contrat annoncé (PR de docs) avant le code. Décision sur 321 : non, D-322-1. |
