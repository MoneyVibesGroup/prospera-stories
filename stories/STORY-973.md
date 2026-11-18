# STORY-973 : le plan SMT propre

Status: done

**Complexité :** faible (une donnée déclarée, une nature de journal de plus, la règle de validation des plans, un refus
nommé au lettrage ; aucun module, aucune dépendance, aucune collection, aucun topic)

**Épic :** EPIC-112 (journaux et pièces), d'`epics-comptabilite-2026-08-27.md`
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service`
**Plage :** groupe B, 930 → 979 ; réservée par A le 2026-11-18 sur décision de l'utilisateur (journal de A, « → B :
réponses de l'utilisateur à tes questions au PO » : « D-961-1 renversée : un plan SMT propre, comme l'AUDCIF le
prévoit (journal de trésorerie : recettes et dépenses), au lieu des six journaux du système normal »).
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 2 (Docker : non, D-L4-3).
**Dépend de :** STORY-961 (le plan de journaux, `dev` `acafd6f`) ; relu sur `origin/dev` `b27593c` (après 970).
**Suivante :** STORY-1083 (le dossier de financement existe, bilan).

**Sources lues :** fiche STORY-961 (D-961-1 → 7, « Pour la suite : SMT ») ; journal de B (question au PO D-961-1) ;
journal de A (réponse de l'utilisateur, 18/11) ; `referentiels/README-smt-togo.md` (le SMT est tenu sur le plan de
comptes SYSCOHADA révisé ; c'est une comptabilité de **trésorerie** : « RÉSULTAT = Recettes − Dépenses ± variations »).

**Ce qui existait déjà (relu avant la fiche) :** `src/journaux/plans-de-journaux.json` déclare pour SMT les six
journaux de SN (`AC VE BQ CA OD AN`, version 1). `validerDeclarations` exige de **chaque** plan les six natures. Trois
lecteurs d'une nature : la clôture, le grand livre et la balance lisent `A_NOUVEAUX` (970, 966, 967) ; le lettrage
passe l'écart de règlement dans le journal `OPERATIONS_DIVERSES` (969) et lève une `Error` (500) s'il n'y en a pas.
Aucun autre code ne lit une nature ; la saisie (962) n'accepte que les codes du plan arrêté (`JOURNAL_INCONNU`).

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Le plan SMT livré déclare le **journal de trésorerie** `TR` (« Journal de trésorerie (recettes et dépenses) », nature `TRESORERIE`) et le journal des à-nouveaux `AN`, en **version 2** ; plus d'achats, de ventes, de banque, de caisse ni d'OD | unitaires (plan livré) |
| AC-2 | SN, SFD-BCEAO et CIMA gardent leurs six journaux, en version 1 | unitaires |
| AC-3 | La déclaration se valide par la **forme** du plan, sans nommer de référentiel : tout plan déclare `A_NOUVEAUX` ; un plan qui déclare `TRESORERIE` est un plan de trésorerie et ne déclare ni achats, ni ventes, ni banque, ni caisse, ni OD ; un autre déclare les cinq. Un plan mêlé ou incomplet empêche le service de démarrer | unitaires (cas refusés) |
| AC-4 | Ouvrir au journal un exercice SMT arrête `TR` et `AN` (piste `planDeJournaux: SMT@2`), et amorce leurs deux séries | unitaires (`arreter`) |
| AC-5 | Un exercice SMT déjà arrêté en `SMT@1` garde ses six journaux (D-961-2) | inchangé : le plan arrêté est relu, jamais recalculé |
| AC-6 | Un lettrage avec écart sur un exercice dont le plan n'a pas de journal d'OD rend 409 `JOURNAL_DES_OPERATIONS_DIVERSES_ABSENT`, plus une erreur 500 ; sans écart, le lettrage passe | unitaires |
| AC-7 | `NatureDeJournal` (OpenAPI) reçoit `TRESORERIE` ; la description de `GET …/journaux` dit les deux formes | relecture de l'OpenAPI générée |

## Décisions (prises par défaut, contestables)

- **D-973-1 : une nature neuve, `TRESORERIE`, et un journal `TR`.** Le journal de trésorerie enregistre les recettes
  et les dépenses (caisse et banque) dans un seul journal, comme l'AUDCIF le prévoit pour le SMT. Un seul journal :
  un second (`TR2`, un second compte) s'ajoutera au plan arrêté par `comptabilite:journal:administrer` (à venir,
  D-961-2) ou par une version neuve du plan.
- **D-973-2 : le plan SMT garde le journal des à-nouveaux `AN`.** Ce n'est pas un journal d'opérations : il porte
  les soldes reportés à l'ouverture, et la clôture (970) y passe les à-nouveaux de l'exercice suivant
  (`JOURNAL_DES_A_NOUVEAUX_ABSENT` sinon) ; le grand livre et la balance distinguent les à-nouveaux des mouvements par
  sa nature. Sans lui, un exercice SMT ne se clôturerait pas et ses reports compteraient comme des recettes et des
  dépenses. Contestable : l'utilisateur a demandé « le journal de trésorerie au lieu des six journaux ».
- **D-973-3 : deux formes de plan, reconnues à leurs natures.** Le code ne nomme toujours aucun référentiel
  (D-961-1) : un plan qui déclare `TRESORERIE` est un plan de trésorerie (`TRESORERIE` et `A_NOUVEAUX`, rien
  d'autre) ; sinon c'est un plan en partie double (les cinq natures d'opérations et `A_NOUVEAUX`). Un plan mêlé est
  refusé au démarrage : un journal de ventes à côté du journal de trésorerie compterait deux fois une recette.
  Le contrat de la donnée reste `plans-de-journaux@1` (même forme ; seule la règle s'élargit).
- **D-973-4 : le plan SMT passe en version 2 ; rien n'est migré.** Un exercice SMT déjà ouvert au journal garde le
  plan arrêté `SMT@1` (D-961-2 : un livre légal ne change pas de journaux en cours d'exercice) ; seul un exercice
  ouvert après le déploiement reçoit `SMT@2`. Le service n'est déployé nulle part hors des piles de preuve.
- **D-973-5 : l'écart de règlement sans journal d'OD est un refus nommé.** Un exercice de trésorerie n'a pas de
  journal des opérations diverses ; un lettrage qui solderait un écart rend 409
  `JOURNAL_DES_OPERATIONS_DIVERSES_ABSENT` (`details.planDeJournaux`), comme `ECART_NON_DECLARE` pour SFD-BCEAO :
  l'écart se passe par une écriture saisie. Le lettrage exact ou partiel n'est pas touché ; les propositions de
  lettrage restent calculées (comme pour SFD-BCEAO). Contrôle placé après celui des comptes d'écart (ordre de 969).
- **D-973-6 : le journal de trésorerie n'impose pas de compte de trésorerie.** Une pièce saisie dans `TR` reste une
  pièce équilibrée sur le plan de comptes SYSCOHADA (le SMT est tenu sur ce plan, `README-smt-togo.md`) ; exiger
  qu'elle touche un compte de classe 5 nommerait des comptes par référentiel : à placer en story si le PO le veut.
- **D-973-7 : sans Docker.** Aucun module Nest, aucune dépendance, aucun Dockerfile ne change ; preuve par les tests
  unitaires du service relancés par chemin, lint, `tsc`, build, mutations. Les suites `test:socle` (MongoDB) ne sont
  pas jouées : relues, aucune n'ouvre au journal un exercice SMT pour y saisir (journaux : un exercice SN repassé en
  SMT garde `SN@1` ; clôture : un exercice suivant SMT est refusé `REFERENTIELS_DIFFERENTS` avant la lecture de son
  plan).

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- OpenAPI : l'énumération `NatureDeJournal` reçoit `TRESORERIE` (**ajout**). Un lecteur qui fait un `switch` exhaustif
  sur la nature doit prévoir la valeur.
- `GET …/exercices/{e}/journaux` d'un exercice SMT ouvert au journal après la fusion : `versionDuPlan: 2`,
  `journaux: [TR (TRESORERIE), AN (A_NOUVEAUX)]`. La forme de la réponse ne change pas.
- Piste : `EXERCICE_OUVERT.donnees.planDeJournaux` vaut `SMT@2` pour ces exercices.
- `POST …/lettrages` et `POST …/lettrages/propositions/{id}/acceptation` : refus neuf 409
  `JOURNAL_DES_OPERATIONS_DIVERSES_ABSENT` (au lieu d'une 500).
- Aucun topic, aucun schéma au registre, aucune variable.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 18/11, l'annonce d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #687 (fiche, tracker, annonce du contrat, AVANT le code) | `main` `dd14ea3` |
| `prospera-comptabilite-service` | #11 | `dev` **`dd3dc52`** (rejoué de `91ee8ad` ; arbre identique) |

- `src/journaux/plans-de-journaux.json` : SMT version 2, `TR` (`TRESORERIE`) et `AN` ; le commentaire de la donnée
  dit les deux formes.
- `src/journaux/plan-de-journaux.ts` : nature `TRESORERIE` ; `FORMES_DE_PLAN` (partie double, trésorerie) et
  `NATURE_COMMUNE` (`A_NOUVEAUX`) ; `validerPlan` exige les natures de la forme et refuse les natures étrangères
  (« plan de trésorerie mêlé : … »).
- `src/lettrage/ecarts-de-reglement.ts` : `exigerJournalDesEcarts(plan)` (409 `JOURNAL_DES_OPERATIONS_DIVERSES_ABSENT`,
  `details.planDeJournaux`) ; `lettrage.service.ts` l'appelle à la place de l'`Error` de 969.
- `src/common/refus.ts` : le refus neuf (409). Descriptions OpenAPI de `GET …/journaux` et des deux routes de
  lettrage à jour ; `NatureDeJournal` reçoit `TRESORERIE` par construction (le DTO lit `NATURES_DE_JOURNAL`).
- Tests : `plan-de-journaux.spec.ts` (plan SMT livré, plan de trésorerie lu, cinq cas refusés neufs),
  `plans-de-journaux.service.spec.ts` (l'arrêt d'un exercice SMT : `TR`, `AN`, version 2, quatre séries),
  `ecarts-de-reglement.spec.ts` (journal d'OD trouvé ; refus sur `SMT@2`).

## Preuves

- **Node 25** (poste Windows, sans Docker, D-L4-3) :
  - `jest src/journaux src/lettrage` : **116 passés** ; seul rouge, `series-des-journaux.spec` « la copie EST la
    source » (compare la copie de `series-v1` au checkout local de `prospera-plateforme`, plus avancé : rouge à
    l'identique sur `origin/dev`).
  - Suite complète : 50 suites, **741 passés**, 3 rouges dans 4 suites, **toutes rouges à l'identique sur
    `origin/dev`** (témoin par `git stash`) : binding de Confluent absent sous Node 25 (`auth/gardes.spec`,
    `acces/etat-publie.spec`), copies comparées aux checkouts locaux (`series`, manifeste vs `prospera-stories`).
  - Lint des fichiers touchés (`endOfLine: auto`), `tsc --noEmit`, `npm run build` verts ; `TRESORERIE` est dans
    `dist/journaux/plans-de-journaux.json`.
- **Mutations : 10/10 rougissent sur une assertion** (aucune par compilation ni par chargement) : plan mêlé admis,
  à-nouveaux non exigés, forme mal nommée dans le refus, SMT resté en version 1, code et libellé du journal de
  trésorerie, écart sans refus, mauvaise nature cherchée, détails sans version, 422 au lieu de 409.
- **Non prouvé ici** (D-973-7) : l'appel d'`exigerJournalDesEcarts` dans la transaction du lettrage n'a pas de test
  unitaire (le service n'en a que dans `test:socle`, sur MongoDB) ; il est relu et typé. Les suites `test:socle` ne
  sont pas jouées : à la prochaine pile de la comptabilité (STORY-975).

## Pour la suite

- **STORY-975** (comptabilité installable, pile) : jouer `test:socle` ; y ajouter, si la pile le permet, un exercice
  SMT ouvert au journal (`TR`, `AN`, `SMT@2`) et un lettrage avec écart refusé 409.
- **Contestables** : D-973-2 (le journal `AN` gardé au SMT), D-973-5 (écart refusé plutôt que passé dans `TR`),
  D-973-6 (aucun compte de trésorerie imposé dans `TR`). Un second journal de trésorerie (`TR2`) viendra avec
  `comptabilite:journal:administrer`.
