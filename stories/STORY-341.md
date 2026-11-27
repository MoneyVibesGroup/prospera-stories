# STORY-341 : L'ordre de règlement produit, jamais exécuté — la chaîne financière reste chez le client

Status: done — **livrée le 2026-11-27** : balance-service **#175** (`53e1595` sur `dev`) et prospera-fiscal-service **#91** (`481a8f4` sur `dev`, rebasée sur `dae6a10` de D) ; voir « Livraison ». Écrite le 2026-11-27 par la session du groupe C juste avant de la coder (lot 7, n° 13 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-033, STORY-341), du PRD
fiscalité (FR-F47, §3.3 « Le règlement n'est pas le dépôt ») et de la fiche STORY-565 de D, qui transporte cet ordre.

**Epic :** EPIC-033 · **Points :** 3 · **FR :** FR-F47 (le système produit un ordre ou des instructions de règlement,
sans jamais l'exécuter) · **Architecture :** AD-13 (aucun accès bancaire n'entre au service), FR-F58 (`ACCES_BANCAIRE` :
jamais stocké), AD-9 (la version scellée fait foi), NFR-A06 (aucun texte de loi ni aucun organisme dans le code) ·
**PRD** §3.3 : « Prospera prépare, rapproche et prouve ; il n'exécute pas. »
**Services :** `prospera-fiscal-service` (dossier `reglement`, à C par D-L7-1 ; communs nommés plus bas) et
`balance-service` (la source du paquet fiscal Togo, à C depuis D-L7-3).
**Après :** STORY-340 (le montant à régler, `MontantAReglerService`, le bloc `reglement` du paquet et R13), 563 (les
redevables et leur NIF), 325 (la version scellée), 317 (l'échéance applicable), 339 (la citation mot pour mot).
**Suite :** STORY-342 (le rapprochement du règlement) ; **STORY-565 de D** (le dépôt automatisé transporte cet ordre jusqu'au
bon redevable : AC-1 « témoin de non-régression de 341 », AC-5 « l'ordre porte l'identifiant fiscal, la taxe, la période et
le montant — jamais une coordonnée bancaire »).

## Histoire

En tant qu'**expert-comptable**, je veux préparer le règlement sans que l'outil touche aux comptes de mon client, afin que
la chaîne financière reste chez lui. *(FR-F47, AD-13)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-033)

1. **Étant donné** un montant à régler **quand** je demande l'ordre de règlement **alors** un ordre ou des instructions sont
   produits.
2. **Étant donné** le service **quand** on cherche une capacité d'exécution de paiement **alors** il n'en existe aucune, sous
   aucune forme.
3. **Étant donné** un ordre produit **quand** on l'inspecte **alors** il ne contient aucun identifiant d'accès bancaire.

Et, de la fiche STORY-565 (D) et de la salle des cabinets du 19/11 : l'ordre est rattaché au **bon redevable** et porte
son **identifiant fiscal**, la taxe, la période et le montant ; **le montant s'affiche avec sa date limite ; le produit ne
paie jamais** ; le canal de paiement est **indiqué** à la personne.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `efd0992`, balance `e68ae10`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le montant à régler (340) | la référence (le déclaré de la version scellée), les imputations du paquet, le déjà réglé, `aRegler` ≥ 0, `excedents`, `complet` et `manques` | `domain/reglement/montant-a-regler.ts`, `MontantAReglerService` (exporté par `ReglementModule`) |
| Le paquet | `reglement.obligations.<CODE>` : la règle du paiement (`libelle`, livre, article, millésime), ses imputations, son excédent ; R13 | `balance-service`, `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` |
| Les redevables (563) | l'entreprise dérivée du dossier (raison sociale et NIF lus chez `dossier-service`), les personnes physiques stockées avec leur NIF | `domain/redevables/redevable.ts`, `RegistreRedevables` |
| Les natures d'accès (300) | `ACCES_BANCAIRE` : « l'accès au compte bancaire qui règle l'impôt : jamais stocké » ; `IDENTIFIANT_FISCAL` : une donnée métier | `domain/habilitations/natures-acces.ts` |
| Les gardes AD-13 (560) et AD-21 (563) | aucun champ d'accès hors du coffre ; un champ `identifiantFiscal` seulement chez ses porteurs nommés | `modules/coffre-secrets/garde-ad13.spec.ts`, `domain/redevables/garde-identifiant-fiscal.spec.ts` |

**Ce qui manque** : rien ne rend ce que le payeur doit reporter (à qui, combien, pour quoi, jusqu'à quand, sous quel NIF) ;
le paquet ne dit nulle part **où** chaque impôt se paie ; et aucune garde ne prouve qu'aucune capacité de paiement n'existe.

## Ce que dit le texte (corpus OTR 2025, relu le 2026-11-27)

- **LPF Art. 7** : « […] les paiements auprès de tout receveur des impôts ne peuvent s'effectuer sans le NIF. »
- **LPF Art. 55** (acomptes d'IS) : « payés […] à la caisse du receveur des impôts ».
- **LPF Art. 57** (TPU) : les acomptes « sont payés […] à la caisse du receveur des impôts » ; « Le solde de l'impôt est
  acquitté spontanément, au moment du dépôt des états financiers » — **sans nommer la caisse du solde**.
- **LPF Art. 99** (RSH) : « versées à la caisse du receveur chargé du recouvrement contre quittance ».
- **LPF Art. 27** (retenue d'IRPP) : « reversé […] à la caisse du service des impôts ».
- **LPF Art. 60** (TVA) : la déclaration se souscrit « auprès du service des impôts » ; **aucun article du corpus ne nomme
  la caisse où la TVA se paie**.

## Contrat annoncé avant le code (2026-11-27)

**Ajouts seuls** : une route de lecture, un champ neuf par obligation du bloc `reglement` du paquet et un sous-bloc `ordre`.
Aucun droit, aucun événement, aucune collection, aucune écriture ; aucun champ existant ne change ; manifeste `declarations`
inchangé ; aucune route de `balance-service` ne change (le moteur ne lit pas le bloc).

### `GET /api/v1/obligations/{id}/ordre-de-reglement` (AC-1, AC-3)

Rôles `TENANT_ADMIN`, `TENANT_USER`, accès fiscal ; portée de l'obligation (comme le montant à régler) : hors portée ou
autre organisation ⇒ `404 OBLIGATION_INTROUVABLE`. Lecture seule, rien n'est stocké. Réponse `200` :

```
{ nature: ORDRE_DE_REGLEMENT, execution: PAR_LE_REDEVABLE, avertissement,
  obligationId, dossierId, taxe, libelle, periode, produitLe,
  redevable: { redevableId, nature: ENTREPRISE | PERSONNE_PHYSIQUE, designation, identifiantFiscal },
  montant: { aRegler (entier > 0), devise | null, reference, origine, deduit, dejaRegle, chemin },
  echeance: { dateLimite | null, legale | null, reportee },
  declaration: { numero, nature, versionId | null, deposeeLe | null },
  versement: { organisme | null, baseLegale | null, aConfirmer | null },
  regle: { libelle, baseLegale } | null,
  identifiantFiscalExige: baseLegale | null,
  mentions: [{ code: REDEVABLE | IDENTIFIANT_FISCAL | IMPOT | PERIODE | MONTANT | DEVISE | DATE_LIMITE | ORGANISME,
               libelle, valeur }],
  reserves: [{ code: ORGANISME_A_CONFIRMER | VERSEMENT_NON_DECLARE_AU_PAQUET | ECHEANCE_NON_DATEE | DEVISE_NON_DECLAREE,
               message }],
  paquet: { code, version, checksum }, corpus, empreinte }
```

- **Jamais un ordre faux** : l'ordre n'est produit que sur un montant **prouvé, complet et positif** de la déclaration
  **déposée**. Sinon, **`409`** nommé, sans ordre : `DECLARATION_NON_DEPOSEE` (le montant peut encore changer),
  `MONTANT_A_REGLER_INDISPONIBLE` (`details.motif` de 340), `MONTANT_A_REGLER_INCOMPLET` (`details.manques` : un acompte sans
  paiement enregistré, des imputations non déclarées au paquet… — payer sur un montant incomplet, c'est risquer de payer deux
  fois), `RIEN_A_REGLER` (`details.excedents`), `IDENTIFIANT_FISCAL_ABSENT` (LPF Art. 7, citée depuis le paquet),
  `REDEVABLE_INTROUVABLE`. `details.chemin` renvoie au montant à régler.
- **Ce qui manque à l'ordre sans le fausser se nomme** dans `reserves` (l'organisme que le texte ne nomme pas, une échéance
  non datée) : rien n'est inventé.
- **Aucun accès bancaire** (AC-3) : l'ordre ne porte que des données métier ; ni compte, ni IBAN, ni RIB, ni carte, ni code,
  ni portefeuille mobile. `execution: PAR_LE_REDEVABLE` : Prospera ne paie pas.
- **L'empreinte** : `sha256:` de la forme canonique de l'ordre, `produitLe` et `empreinte` retirés : deux productions du même
  ordre ont la même empreinte (342 et 565 la reconnaissent).

### Aucune capacité d'exécution, sous aucune forme (AC-2)

Une garde structurelle, sur l'AST de tout `src/` et sur `package.json` : aucune route qui paie, vire, débite, prélève ou
initie un paiement ; aucune dépendance de paiement ; aucun client ni adresse de `prospera-paiement-service` ; aucun sujet
`paiement.*` produit ou consommé ; aucun champ d'accès bancaire (compte, IBAN, RIB, BIC, carte, CVV, code PIN, portefeuille
mobile) ; chaque motif « mord » sur un exemple. **C'est le témoin de non-régression de STORY-565 (AC-1)** : il passe sans
modification après elle.

### Le paquet fiscal Togo 2026 (`balance-service`, source et artefact)

- **`reglement.obligations.<CODE>.versement`** (obligatoire pour chaque obligation du bloc) : `{ organisme, livre, article,
  millesime }` ou `{ organisme: null, aConfirmer }` — `IS_ACOMPTE` « caisse du receveur des impôts » (LPF Art. 55),
  `TPU_ACOMPTE` « caisse du receveur des impôts » (LPF Art. 57), `RSH` « caisse du receveur chargé du recouvrement » (LPF
  Art. 99), `RETENUE_IRPP` « caisse du service des impôts » (LPF Art. 27) ; `TVA` et `TPU` (le solde) : `aConfirmer` (le
  texte ne nomme pas la caisse).
- **`reglement.ordre.identifiantFiscal`** `{ libelle, livre: LPF, article: Art. 7, millesime }`.
- Garde **R13** étendue : un `versement` par obligation ; un organisme nommé cite sa référence, un organisme `null` dit ce
  qui reste à confirmer, jamais les deux ; `ordre.identifiantFiscal`, s'il est là, porte son libellé et sa référence.
  `_meta.revision` gagne sa ligne. Nouvelle empreinte, réépinglée ; **B prévenu** (recopie de `dossier-service`), **D
  prévenu**.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration**, aucune collection, aucune écriture. Communs touchés dans le fiscal : **le contrat OpenAPI** (la route
neuve) ; **la copie du paquet** (`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, à l'octet de balance-service) ;
**`src/app.module.invariant.spec.ts`** (l'export du service de l'ordre). Tout le reste dans des dossiers de C :
`domain/reglement`, `application/reglement`, `modules/reglement` ; `domain/redevables/garde-identifiant-fiscal.spec.ts` (deux
porteurs nommés de plus : l'ordre et son DTO) ; `test/obligations.e2e-spec.ts`. **`MontantAReglerService` garde son
constructeur et la signature de `deLObligation`** (565 de D l'importe) ; il gagne une lecture `lire` (le montant et ses
sources). `ReglementModule` importe en plus `RedevablesModule` ; ni `app.module.ts`, ni `package.json`, ni `read-models/`.

## Décisions (D-341-n) — prises le 2026-11-27, contestables

- **D-341-1 — Une lecture composée, rien n'est stocké.** L'ordre projette le montant à régler (340) sur ce que le payeur
  reporte ; il se recompose à la demande et se reconnaît à son empreinte (sans sa date de production). Le stocker
  ouvrirait un état à tenir en phase avec la déclaration ; 342 rapprochera le règlement de la déclaration, pas d'un ordre.
- **D-341-2 — Sur la déclaration déposée seulement.** Avant le dépôt, le montant est un déclaré courant ou un calculé qui
  peut encore changer : `409 DECLARATION_NON_DEPOSEE`. Après, le déclaré de la version scellée (ou figé au dépôt, avant 325).
- **D-341-3 — Jamais un ordre faux.** Un montant indisponible, incomplet (un manque de 340) ou nul ne produit pas d'ordre :
  le refus est nommé et porte ce qui manque. Un ordre sur un montant incomplet ferait payer un acompte déjà payé mais non
  enregistré — exactement ce que 340 empêche.
- **D-341-4 — Le bon redevable et son NIF.** L'entreprise (raison sociale et NIF de `dossier-service`, comme 563) ou la
  personne physique de l'obligation (registre de 563). Sans NIF, aucun paiement ne se fait au receveur (LPF Art. 7, cité
  depuis le paquet) : `409 IDENTIFIANT_FISCAL_ABSENT`. Le NIF est une **donnée métier** (`IDENTIFIANT_FISCAL`, FR-F58) : la
  garde AD-21 nomme l'ordre et son DTO parmi ses porteurs ; il n'entre dans aucun journal.
- **D-341-5 — Où payer est une donnée du paquet, lue du texte.** Le code ne nomme aucun organisme (NFR-A06) ; l'ordre lit
  `versement` de l'obligation. Le texte nomme la caisse des acomptes d'IS et de TPU, de la RSH et de la retenue d'IRPP ; il
  ne la nomme pas pour la TVA ni pour le solde de TPU : `aConfirmer`, et l'ordre est produit avec la réserve
  `ORGANISME_A_CONFIRMER`, jamais un organisme supposé. Question au PO (journal) ; **défaut** : à confirmer par un
  fiscaliste.
- **D-341-6 — Aucune capacité d'exécution, prouvée par la structure (AC-2).** Une garde AST et `package.json` (voir plus
  haut), dans le dossier `reglement`, sur tout `src/` ; elle est le témoin de 565 (AC-1). L'ordre dit qui l'exécute
  (`execution: PAR_LE_REDEVABLE`) et un avertissement le répète. Aucune écriture chez `prospera-paiement-service` (le
  paiement des abonnements Prospera, une autre chaîne : PRD, « collision de nom »).
- **D-341-7 — Aucun identifiant d'accès bancaire (AC-3).** Un test parcourt chaque clé et chaque valeur de l'ordre produit ;
  `ACCES_BANCAIRE` reste `JAMAIS_STOCKEE`.
- **D-341-8 — Des mentions copiables.** Le parcours du PRD (§8 : « elle ne retape aucun montant : elle copie ») : une liste
  ordonnée `{ code, libelle, valeur }` — redevable, NIF, impôt, période, montant, devise, date limite, organisme (s'il est
  nommé). Les valeurs sont des chaînes, sans mise en forme.
- **D-341-9 — La date limite est l'échéance applicable.** Reportée s'il y a un report (317), la légale à côté ; non datée :
  la réserve `ECHEANCE_NON_DATEE`, l'ordre reste produit (le montant, lui, est sûr).
- **D-341-10 — Aucun droit neuf.** L'ordre est une lecture, comme le montant (rôles, accès fiscal, portée).
  `fiscalite:declaration:regler` (FR-F59) attend la route qui l'exerce : consigner le règlement (342, 343).
- **D-341-11 — `OrdreDeReglementService`, exporté par `ReglementModule`.** Il rend un résultat discriminé (`PRODUIT` avec
  l'ordre, `NON_PRODUIT` avec le motif) pour un appel en processus (565) ; la route traduit `NON_PRODUIT` en 409.
  `ReglementModule` importe `RedevablesModule` (le registre des personnes) ; il n'importe toujours ni `RemunerationModule` ni
  `AccusesDepotModule` : un module de D l'importe sans cycle.
- **D-341-12 — Hors périmètre, nommé.** (1) Le **bordereau-avis** de la retenue d'IRPP (LPF Art. 27 : période, désignation,
  adresse et profession de la partie versante, montant total) : des mentions de plus, à placer avec 565 ou 342. (2) Un ordre
  **groupé** de plusieurs obligations. (3) Une référence de paiement d'un portail (aucun texte ne la décrit). (4) Le
  rapprochement (342), « déposée » / « payée » (343), les pénalités (344), l'écran (A), le transport au redevable (565, D).

## Preuves attendues

Unitaires (Node 24, `-w 2`) : la projection pure (chaque refus, chaque réserve, les mentions, l'empreinte stable et sans
`produitLe`, aucune clé bancaire), le service (portée, entreprise et personne physique, NIF absent), la garde FR-F47 (chaque
motif mord), la garde AD-21 étendue, l'invariant d'`AppModule` ; balance-service : R13 étendue (le paquet Togo la passe,
chaque faute refusée), l'artefact régénéré et réépinglé, chaque organisme lu dans son article ; e2e (un acompte d'IS déposé :
l'ordre, sa caisse, LPF Art. 55 mot pour mot ; une TPU déposée nette de ses acomptes : l'ordre avec la réserve de l'organisme ;
un acompte non payé : 409 `MONTANT_A_REGLER_INCOMPLET` ; avant le dépôt : 409 ; rien à régler : 409 ; hors portée : 404 ;
l'empreinte stable) ; toute la suite du fiscal, celles de D comprises ; mutations sur la logique neuve ; `docker compose up`
du fiscal, sain (le module change d'imports).

## Dette de preuve de STORY-340 (soldée avant le code, 2026-11-27)

340 (fiscal #88) avait été rebasée sur la 336 de D après ses preuves, sans rejouer la suite complète sur le commit fusionné.
Rejouée sous le verrou (02:55 → 03:04), Node 24, étage `verification`, archive LF d'**`origin/dev` `efd0992`** (le commit
fusionné de 340) : unitaires **258/259 suites (1 ignorée), 3 888 tests (3 ignorés)** ; e2e **15/15, 383** ; conformité
MongoDB (jeu de répliques) **31/31, 197** ; `nest build` vert, le corpus dans `dist/`. **Tout vert : aucun correctif
nécessaire**, aucune PR séparée.

## Livraison (2026-11-27)

- **Paquet** : balance-service **#175** (`MNV-341`, `cec9c3b` poussé, rejoué `53e1595` sur `dev`) : `versement` des six
  obligations du bloc (quatre caisses nommées par le texte, deux à confirmer), `reglement.ordre.identifiantFiscal` (LPF Art. 7),
  garde **R13** étendue, schéma, `_meta.revision` ; artefact régénéré, empreinte **`6eebc02f6712feece1913bd62303955ce9741ff1ac5fc58cfe34ab3f15e7baa7`**, réépinglée (registre, spec, e2e).
- **Fiscal** : **#91** (`MNV-341`, `952fb18` poussé, rejoué `481a8f4` sur `dev`, rebasé sur `dae6a10` de D — la suite de 335,
  fichiers disjoints). Fichiers : `domain/reglement/ordre-de-reglement.ts` (la projection pure),
  `application/reglement/ordre-de-reglement.service.ts`, `MontantAReglerService.lire` (constructeur et `deLObligation`
  inchangés), `modules/reglement/` (route, DTO, module : `RedevablesModule` importé, `OrdreDeReglementService` exporté), la
  garde FR-F47 `domain/reglement/garde-aucune-execution-de-paiement.spec.ts`, la garde AD-21 (deux porteurs nommés),
  l'invariant d'`AppModule`, e2e dans `test/obligations.e2e-spec.ts`, la copie du paquet.
- **Preuves** (Node 24, étage `verification`) : sur `a1a18d1` (avant le rebase) unitaires 261/262 suites, 3 927 ; e2e 15/15,
  387 ; conformité 31/31, 197 ; `nest build` vert ; balance-service unitaires **300/300, 5 826** ; e2e **38/38, 2 324** ;
  **pile `grp-c`** fiscal + balance saine (santé `ok` des deux, `…/ordre-de-reglement` en 401 sans jeton, `ReglementModule`
  initialisé, quatre routes montées dont la neuve, aucune erreur d'injection — les trois « Error: » sont l'« Unknown topic or
  partition » connu d'une pile neuve —, aucun redémarrage). **Rejouées sur le commit rebasé `952fb18`** (archive LF) :
  unitaires **265/266 (1 ignorée) suites, 3966 tests** ; e2e **15/15, 391** ; conformité **31/31, 204** ; `nest build` vert. Verrou pris trois fois
  (02:55 → 03:04 la dette ; 03:24 → 03:44 ; 03:46 → 03:56), rendu ; aucun conteneur `grp-c` restant.
- **Mutations** : fiscal **28/28** tuées (domaine 20, service 5, contrôleur 2, garde 1 — sept réécrites qui rougissaient par
  compilation, toutes tuées ensuite sur l'assertion) ; balance-service **R13 11/11**.
- **B prévenu** (recopie du paquet de `dossier-service` : `dev` `53e1595`, sha256 `6eebc02f…baa7`) ; **D prévenu** (empreinte ;
  `OrdreDeReglementService` pour 565 ; la garde FR-F47 témoin de son AC-1).
- **Ce que 565 (D) lit** : `OrdreDeReglementService.deLObligation(acteur, id)` ⇒ `PRODUIT` : `redevable { redevableId, nature,
  designation, identifiantFiscal }`, `taxe`, `periode`, `montant.aRegler` et `devise`, `echeance.dateLimite`, `versement.organisme`
  (ou la réserve), `mentions`, `empreinte` — jamais une coordonnée bancaire (AC-5 de 565) ; `NON_PRODUIT` : le motif et ce qui
  manque. Rien d'autre n'est exigé de C pour 565.

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-27 | Fiche écrite, contrat et communs annoncés avant le code. |
| 2026-11-27 | Dette de preuve de 340 soldée (tout vert sur `efd0992`). |
| 2026-11-27 | **DONE.** Paquet : balance-service #175 (`53e1595`) ; code : fiscal #91 (`481a8f4`). Preuves : voir « Livraison ». B et D prévenus. |
