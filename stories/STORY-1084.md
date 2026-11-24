# STORY-1084 : chaque emprunt a son échéancier, et le prévisionnel le lit

Status: done

**Complexité :** élevée (8 pts ; un calcul d'échéancier exact au franc, une injection dans le moteur du prévisionnel,
quatre indicateurs de dette ; aucun droit neuf)

**Épic :** EPIC-266 (le dossier de financement bancaire, `financement`, M49), lot F1 — FR-3, FR-4 (dette), FR-6 du PRD
`prds/prd-services-cabinet-2026-11-18/prd.md` (§4.1, NFR-2, NFR-3, NFR-5)
**Dépôts :** `MoneyVibesGroup/prospera-bilan-service` (`src/modules/financement/`, `src/modules/bilan/projection/`) ;
`prospera-stories` (`manifestes/financement.manifest.ts`, amendé : 0.2.0)
**Plage :** reçue de A (STORY-1080 → 1084, 1093 ; plan du lot 4 §3, ligne 4). Identifiant réservé par A le 18/11.
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 4 : **Docker : non** (D-L4-3). Fini quand :
l'épic, STORY-1084, avec la valeur de référence **25 000 000, 12 %, 48 mois ⇒ 658 346 / 658 339 / 6 600 601**.
**Dépend de :** STORY-1083 (bilan #180, `36c22fa` sur `dev`).
**Débloque :** FE-140 (saisie des emprunts, échéancier, indicateurs au survol), FE-141 (indicateurs de dette),
STORY-1086 (le dossier figé reprend l'échéancier, le plan de financement et les indicateurs).
**Suivante :** STORY-1081.

**Sources lues :** plan du lot 4 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journaux de B (état, pièges,
« ⚠ Contrats »), de A (« Pièges rencontrés », 923 → 929), de C et D (aucune demande neuve à B depuis 1083) ; épic
STORY-1084 (AC-1 → AC-5) ; PRD FR-1, FR-3, FR-4, FR-6, NFR-3 ; addendum §1.1. Code relu sur `origin/dev` de bilan
`36c22fa` : tout `src/modules/financement/` (1083) ; `projection/` : `projection.service.ts`,
`projection-annuelle.service.ts` (le moteur), `echeancier.ts` (`serieExercices`, `serieEmpruntsNouveaux`,
`rangVentilationIncoherente`), `charges-financieres.ts` (intérêts sur l'encours moyen), `ratios.ts` (endettement,
autonomie financière, capacité de remboursement), `millesime.ts`, `projection.types.ts` ; `hypotheses.schema.ts`
(`financement`, `empruntsNouveaux`, `remboursements`, `tauxInteretPct` et leurs échéanciers par exercice) ;
`bilan.module.ts` (exports).

**Ce qui existait déjà (relu avant la fiche) :** aucun emprunt individuel. Le prévisionnel (EPIC-013) porte trois
agrégats par exercice — `financement` (dont la part `empruntsNouveaux`, le reste étant un apport en capital dérivé,
D-483-2), `remboursements` — et calcule les intérêts au `tauxInteretPct` sur l'**encours moyen** de la dette
projetée (STORY-467), sans la dette de la base (`dettesBaseNonPortees: true`). Trois ratios bancaires existent
(`ratios.ts` : endettement, **autonomie financière = capitaux propres / (capitaux propres + dettes financières)**,
capacité de remboursement), chacun `null` avec un motif quand il est incalculable. Ni échéancier, ni DSCR, ni capacité
d'endettement, ni plan de financement. Le fichier `projection/echeancier.ts` porte un autre sens (la série d'un
montant sur les trois exercices) : le calcul neuf vit dans `financement/`.

**Comprendre la valeur de référence (FR-3, AC-2).** 25 000 000 FCFA, 12 % l'an, 48 mois, échéances constantes, sans
différé : taux mensuel 1 % ; échéance exacte C × i / (1 − (1 + i)^−n) = 658 345,8858 ⇒ **658 346** (la mensualité,
arrondie au franc, payée 47 fois) ; intérêts de chaque mois arrondis au franc (demi vers le haut) sur le restant dû ;
la 48ᵉ échéance solde le restant dû plus ses intérêts : **658 339** (la dernière, qui absorbe l'écart d'arrondi) ;
somme des intérêts **6 600 601** ; total remboursé 47 × 658 346 + 658 339 = **31 600 601** = 25 000 000 + 6 600 601.
Recalculé avant la fiche en arithmétique rationnelle exacte : les quatre nombres sont retrouvés.

---

## Ce qui doit être vrai à la fin

| AC (épic) | Fait |
|---|---|
| AC-1 — un emprunt : capital, taux, durée, différé, périodicité, mode, date de début ; échéancier (capital, intérêts, restant dû) | emprunts du dossier de financement (sous-ressource, D-1084-1), échéancier calculé à la lecture (D-1084-2) |
| AC-2 — convention de FR-3, somme du capital = capital emprunté, valeur de référence écrite dans le test | arithmétique entière exacte (D-1084-3) ; 658 346 / 658 339 / 6 600 601 / 31 600 601 en dur dans le test |
| AC-3 — un jeu d'hypothèses retenu ; ses emprunts remplacent `empruntsNouveaux` pour les charges financières et les remboursements par exercice, sans copie | `scenarioRetenu` du dossier ; le moteur reçoit les séries des échéanciers en mémoire (D-1084-7 → 9) |
| AC-4 — indicateurs avec formule et sources : couverture du service de la dette, capacité d'endettement résiduelle, autonomie financière, plan de financement par année | `GET …/indicateurs` (D-1084-10, 11) |
| AC-5 — incalculable ⇒ `INCALCULABLE` et motif, jamais 0 ; mutation sur le report d'arrondi | motifs fermés (D-1084-12) ; mutations |

## Décisions retenues par défaut (contestables)

- **D-1084-1 — Les emprunts sont une liste du contenu du dossier de financement**, pas une collection à part :
  `emprunts[]` (20 au plus) dans la version courante, donc **archivés avec la version** quand un dossier `REMIS` est
  corrigé (D-1083-10) ; une version archivée montre ses emprunts tels qu'ils étaient. Ils se saisissent par une
  sous-ressource (`POST`, `PUT`, `DELETE …/emprunts`), **en `BROUILLON` seulement** (droit `preparer`), sinon 409
  `DOSSIER_FINANCEMENT_NON_MODIFIABLE` comme le `PATCH`. Chaque écriture est atomique et conditionnelle sur l'état et
  la version lus (D-1083-11) : deux saisies concurrentes ne s'écrasent pas. Un emprunt a un identifiant stable.
  Le prêt demandé et les dettes existantes sont des emprunts comme les autres (`nature` : `DEMANDE` | `EXISTANT`,
  pour l'affichage et le dossier figé ; le calcul ne lit que les dates, D-1084-7).
- **D-1084-2 — L'échéancier est calculé à la lecture, jamais rangé** : il dérive de ses six paramètres, même entrée ⇒
  même sortie. Le figer est l'affaire de 1086 (version figée, SHA-256).
- **D-1084-3 — Arithmétique exacte, aucun flottant pour un montant** (NFR-3) : le taux (quatre décimales au plus) est
  lu comme un entier de dix-millièmes de point ; taux périodique = taux annuel ÷ nombre de périodes de l'année (12, 4,
  2, 1) ; l'échéance constante C × i × (1 + i)ⁿ / ((1 + i)ⁿ − 1) se calcule en **rationnels exacts** (`bigint`) puis
  s'arrondit au franc ; intérêts de chaque période arrondis au franc, **demi vers le haut** ; capital = échéance −
  intérêts ; la **dernière** échéance = restant dû + ses intérêts (l'écart cumulé s'y reporte) : la somme du capital
  remboursé égale exactement le capital emprunté. Taux nul : échéance = C ÷ n arrondie, même report.
  **Amortissement constant** : capital de chaque période = C ÷ n arrondi au franc (demi vers le haut), intérêts sur
  le restant dû, la dernière solde le reste. Un capital de période ne dépasse jamais le restant dû (borne écrite).
- **D-1084-4 — La durée comprend le différé** (comme le dossier, D-1083-14 : différé < durée, sinon 400
  `DIFFERE_INVALIDE`) : « 60 mois dont 12 de différé » = 12 mois d'intérêts seuls, puis 48 mois d'amortissement. Un
  différé ne paie que les intérêts (pas de différé total, intérêts capitalisés : hors périmètre). Durée et différé
  sont des multiples de la période (trimestre = 3 mois…), sinon 400 `DUREE_HORS_PERIODICITE`.
- **D-1084-5 — Les dates** : `dateDebut` = date du décaissement ; l'échéance k tombe à `dateDebut` + k périodes (jour
  ramené au dernier jour du mois quand il n'existe pas : 31/01 + 1 mois = 28 ou 29/02).
- **D-1084-6 — Champs d'un emprunt** : `libelle` (3 à 200), `nature`, `capital` (entier FCFA, 1 → 10¹²),
  `tauxAnnuelPct` (0 à 100, quatre décimales au plus), `dureeMois` (1 → 360), `differeMois` (0 par défaut, < durée),
  `periodicite` (`MENSUELLE` | `TRIMESTRIELLE` | `SEMESTRIELLE` | `ANNUELLE`), `mode` (`ECHEANCES_CONSTANTES` |
  `AMORTISSEMENT_CONSTANT`), `dateDebut` (AAAA-MM-JJ, 1990 → 2100). Au-delà de 20 emprunts : 422
  `EMPRUNTS_TROP_NOMBREUX`.
- **D-1084-7 — Les échéanciers se rangent par exercice selon l'année civile de leur date**, l'exercice N+k du
  prévisionnel étant le millésime `base + k` (`millesime`, déjà partagé par les deux moteurs) : un capital décaissé en
  N+k est un **emprunt nouveau** de N+k ; le capital des échéances de l'année est le **remboursement** ; leurs intérêts
  sont les **charges financières d'emprunt** de l'année (à l'échéance, pas au prorata couru : c'est ce que lit un
  banquier sur un tableau d'amortissement). Un emprunt décaissé au plus tard l'année de la base est une **dette
  existante** : son restant dû à la clôture de la base est la dette de la base quand la comptabilité ne la fournit
  pas (`dettesFinancieresAncrees: false`) ; sinon la dette de la base reste celle des comptes, et la réponse dit
  laquelle (`detteBase.source` : `ECHEANCIERS` | `COMPTABILITE`). Base dont l'exercice n'est pas une année :
  `INCALCULABLE`, `EXERCICE_DE_BASE_SANS_MILLESIME`.
- **D-1084-8 — Le scénario retenu** : `scenarioRetenu: { hypothesesId }` (ou `null`) se pose par le `PATCH` du
  brouillon (et la correction d'un `REMIS`), contrôlé à l'écriture (jeu introuvable dans ce dossier client : 422
  `SCENARIO_INTROUVABLE`). Il désigne le jeu, **pas une copie** : la version courante du jeu est lue au calcul ;
  1086 figera les chiffres. FR-6 « comparer deux scénarios » est déjà servi par la comparaison du prévisionnel
  (`GET …/bilan/previsionnel/comparaison`, STORY-071) : rien de neuf ici.
- **D-1084-9 — L'injection dans le moteur, sans copie** (AC-3) : `ProjectionService` reçoit les échéanciers et
  projette le jeu retenu **en mémoire** avec : `empruntsNouveauxParExercice` = les décaissements de l'année ;
  `financementParExercice` = l'apport du jeu (`financement − empruntsNouveaux` du jeu, inchangé) + ces décaissements ;
  `remboursementsParExercice` = le capital remboursé de l'année ; les **intérêts** = ceux des échéanciers (au lieu de
  l'encours moyen × `tauxInteretPct`, qui reste le taux du découvert par repli, D-482-3). Le moteur prend un paramètre
  facultatif de plus ; sans lui, il rend **la même projection qu'avant, au franc** (les routes du prévisionnel ne
  changent pas). Un jeu dont la ventilation est indéterminée (financement sans `empruntsNouveaux`, D-483-7) ne dit pas
  quel est l'apport : `INCALCULABLE`, `VENTILATION_FINANCEMENT_INDETERMINEE`. **Module Nest** : `BilanModule` exporte
  `ProjectionService` et le dépôt des jeux d'hypothèses (lus par `financement`) ; prouvé sans Docker par le câblage du
  module racine (D-1083-1), le démarrage réel restant à 1082 ou 1080.
- **D-1084-10 — Les indicateurs de dette, par exercice N+1 → N+3 du scénario retenu** (`GET …/indicateurs`), chacun
  avec son code, son libellé, sa **formule** et ses **sources** :
  - `COUVERTURE_SERVICE_DETTE` (DSCR) = (CAF + intérêts d'emprunt) ÷ (capital remboursé + intérêts d'emprunt) ;
    ratio à quatre décimales ; la CAF du prévisionnel est après intérêts, d'où leur réintégration.
  - `CAPACITE_ENDETTEMENT_RESIDUELLE` = capitaux propres − dettes financières, à la clôture (FCFA) : la règle
    d'équilibre « les dettes financières ne dépassent pas les capitaux propres » ; négative = aucune capacité, publiée
    telle quelle (les seuils propres à une banque viendront du référentiel, 1085 / AP-50).
  - `AUTONOMIE_FINANCIERE` = capitaux propres ÷ (capitaux propres + dettes financières) : **la définition du
    prévisionnel** (`ratios.ts`), reprise telle quelle, avec ses motifs (pas celle de l'analyse du réel).
  - Le réel (trois exercices) : les 19 indicateurs de l'analyse (STORY-552 → 554) ; 1086 les assemble. 1084 ne sert
    que les indicateurs qui dépendent des emprunts saisis, sur l'horizon projeté.
- **D-1084-11 — Le plan de financement par année** (emplois / ressources) : emplois = investissements + capital
  remboursé + augmentation du BFR ; ressources = CAF + apports en capital + emprunts nouveaux + diminution du BFR ;
  solde = ressources − emplois = **la variation de trésorerie de l'exercice** (identité éprouvée) ; trésorerie
  d'ouverture et de clôture. La CAF est publiée signée (une CAF négative est une ressource négative, lue telle
  quelle).
- **D-1084-12 — `INCALCULABLE`, jamais 0** (AC-5) : chaque valeur porte `statut` (`CALCULE` | `INCALCULABLE`),
  `valeur` (`null` si incalculable) et `motif` (`null` si calculée). Motifs fermés : `SCENARIO_NON_RETENU`,
  `SCENARIO_INTROUVABLE` (le jeu a disparu depuis), `EXERCICE_DE_BASE_SANS_MILLESIME`,
  `VENTILATION_FINANCEMENT_INDETERMINEE`, `AUCUN_SERVICE_DE_LA_DETTE` (rien à rembourser dans l'année : DSCR sans
  dénominateur), `RESSOURCES_STABLES_NON_POSITIVES` (autonomie). Un refus du prévisionnel lui-même (jeu de forme
  ancienne, référentiel) garde son code et son statut (422…), comme sur les routes du prévisionnel.
- **D-1084-13 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, même contrôleur, même
  portée et mêmes gardes que 1083 ; aucun droit neuf) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /emprunts` | consulter | les emprunts de la version courante, chacun avec son échéancier et ses totaux |
  | `POST /emprunts` | préparer | ajoute un emprunt à un brouillon (201, l'emprunt et son échéancier) |
  | `PUT /emprunts/{empruntId}` | préparer | remplace un emprunt d'un brouillon (200) |
  | `DELETE /emprunts/{empruntId}` | préparer | retire un emprunt d'un brouillon (204) |
  | `GET /indicateurs` | consulter | dette par exercice, indicateurs, plan de financement du scénario retenu |

  `PATCH /{financementId}` et `POST /{financementId}/versions` acceptent `scenarioRetenu`. Le dossier et ses versions
  rendent `emprunts` (les paramètres) et `scenarioRetenu` dans leur contenu (ajouts). Emprunt inconnu : 404
  `EMPRUNT_INTROUVABLE`. Le manifeste M49 passe en 0.2.0 : les deux lectures neuves entrent dans
  `routesLectureSeule` (copie à l'octet dans bilan, empreinte changée).
- **D-1084-14 — La piste d'audit** : aucun type neuf ; une saisie d'emprunt est un `FINANCEMENT_MODIFIE` avec
  `emprunt` (identifiant) et `geste` (`AJOUT`, `REMPLACEMENT`, `RETRAIT`) dans le contexte.
- **D-1084-15 — Effacement C13** : rien de neuf (les emprunts vivent dans `dossiers_financement`, déjà au plan).

## Hors de cette story

Les exigences de la banque et leurs seuils (1085, AP-50) ; le dossier figé, l'échéancier et le plan de financement
dans le PDF et l'Excel (1086) ; les écrans (FE-140, FE-141) ; le différé total (intérêts capitalisés) ; les
intérêts courus au prorata ; les indicateurs de dette sur le réel.
## Livraison

- **bilan #181** — `d236c56` sur `dev` (branche `MNV-1084`, tête `dbe7901`, rejouée en rebase) : 31 fichiers.
- **Annonce avant le code** : stories #695 (fiche, manifeste `financement` 0.2.0, « ⚠ Contrats »). Livré sans écart
  au contrat annoncé.

## Preuves

Node 25.2.1 du poste, **sans Docker** (D-L4-3).

- **Valeur de référence (AC-2)**, en dur dans trois suites (unitaire, service, e2e) : 25 000 000, 12 %, 48 mois ⇒
  échéance **658 346** (×47), dernière **658 339**, intérêts **6 600 601**, total **31 600 601**, restant dû final 0 ;
  ligne 1 = 250 000 d'intérêts, 408 346 de capital ; ligne 2 = 245 917 (demi vers le haut). Recalculée avant la fiche
  en rationnels exacts (Python `fractions`).
- **e2e `test/financement-emprunts.e2e-spec.ts` : 21/21.** Vrai contrôleur, vraies gardes (JWT → e-mail → rôles →
  garde du module → portée), vrai service des emprunts, **vrai adaptateur du prévisionnel et vrai
  `ProjectionService`** (moteur annuel compris) ; stockages en mémoire. Échéancier de référence ; collaborateur qui
  saisit et lit ; PUT / DELETE (204) tracés `AJOUT`, `REMPLACEMENT`, `RETRAIT` ; 404 `EMPRUNT_INTROUVABLE` ; 7 corps
  refusés (400) + `DIFFERE_INVALIDE` + `DUREE_HORS_PERIODICITE` ; 21ᵉ emprunt 422 ; saisie refusée 409 dans les 5
  états hors brouillon (lecture 200) ; emprunts archivés avec la version d'un REMIS corrigé ; scénario d'un autre
  dossier ou inconnu 422 `SCENARIO_INTROUVABLE`, identifiant mal formé 400, retenu puis retiré ; indicateurs sans
  scénario (tout `INCALCULABLE`, `SCENARIO_NON_RETENU`), avec scénario (dette 2026 = 11 mensualités + la dette
  existante, dette de la base 4 000 000 tirée des échéanciers, trois indicateurs calculés sur 2026 → 2028, plan
  ressources − emplois), jeu disparu (`SCENARIO_INTROUVABLE`) ; `LECTURE_SEULE`, membre sans droit, hors portefeuille,
  autre cabinet, module fermé ; OpenAPI (5 opérations, énumérations nommées).
- **e2e de 1083 : 82/82** (fournisseurs ajoutés ; contrat OpenAPI : 13 opérations).
- **Unitaires neufs : 71** — échéancier 13 (référence, report d'arrondi sur 5 jeux de paramètres, différé, amortissement
  constant, borne du restant dû, taux nul, trimestriel, taux à 4 décimales, dates), dette par exercice 14 (rangement,
  dette de la base, millésime absent, apport conservé, jeu non modifié, ventilation indéterminée, moteur sans le
  paramètre identique, intérêts imposés, équilibre du bilan à écart nul), `projeterAvecEmprunts` 8, indicateurs 12
  (DSCR, capacité, autonomie, identité solde = variation de trésorerie, 4 motifs globaux, deux motifs par exercice),
  service des emprunts 15, service du dossier +5 (scénario contrôlé, archive), dépôts +4.
- **Projection et invariants** : `src/modules/bilan/projection` 35 suites vertes (hors `restitution.spec`, binding) ;
  `routes-sans-ecriture`, `routes-d-export-et-d-etats`, `plan-d-effacement`, `index-dossier` verts.
- **Câblage du module racine** vert (binding de Confluent doublé), **rouge** si `BilanModule` n'exporte plus
  `JeuHypothesesRepository` (« Nest can't resolve dependencies of the PrevisionnelDuBilan »).
- **Mutations : 28/28 rouges sur l'assertion** (aucune ne compile pas) : report sur la dernière, arrondi tronqué,
  intérêts sur le capital initial, différé ignoré, taux périodique figé, borne du restant dû, fin de mois, dette de la
  base, remboursement = échéance, apport oublié, intérêts des échéanciers ignorés par le moteur, source de la dette de
  la base, intérêts non passés, DSCR sans intérêts, DSCR à dénominateur nul, capacité sans dettes, augmentation du
  BFR, apports du plan, saisie hors brouillon, borne des 20, emprunt inconnu, durée hors période, différé = durée,
  scénario non contrôlé, emprunts hors archive, scénario jamais gardé, borne du dépôt, condition du remplacement.
- **Suite complète** : 345 suites, 11 901 passés ; **15 suites rouges, toutes préexistantes et hors des fichiers
  touchés** : 13 sur le binding de Confluent (Node 25), `dossier-scope.invariant` (« segment `:dossierId` », décorateur
  en CRLF), `analyse.agnosticisme` (séparateur `\` de Windows dans un chemin, dossier `analyse/` non touché).
  Lint des fichiers touchés, `tsc`, `nest build` verts.
- **Docker : non** (D-L4-3). Le démarrage réel de bilan avec `financement` (1083 et 1084) reste à prouver par la
  première story qui lève bilan (1082, au plus tard 1080).

## Correctif du 2026-11-24 (ticket de A, FE-140)

`tickets/TICKET-BACKEND-financement-schema-valeur-indicateur.md` : deux classes `ValeurIndicateurDto` dans bilan
(l'analyse de STORY-552 et la dette de cette story). Swagger range les schémas par nom de classe et n'en gardait
qu'une : `IndicateurDetteDto.valeurs` publiait la forme de l'analyse (ni `rang`, ni `exercice`, ni `statut`). Le
serveur rendait la bonne forme ; le type généré du front était faux. Correctif de cette story, sans identifiant neuf :
**bilan #183** (`2364abc` sur `dev`, branche `MNV-1084-schema`, tête `a30c9d6`) ; annonce avant la fusion :
stories #783.

- **D-1084-16 — Renommer la classe de la dette (`ValeurIndicateurDetteDto`)** plutôt que fixer un nom par
  `@ApiSchema({ name })` : le nom TypeScript et le nom publié restent le même, un `grep` les trouve ensemble. La forme
  de l'analyse garde son nom (c'est elle que Swagger publiait : les types déjà générés pour l'analyse ne bougent pas).
  Contrat servi inchangé (aucune route, aucun champ) : pas de `@2`.
- **D-1084-17 — Le garde porte sur le document de tout `AppModule`** (`src/openapi-schemas-uniques.invariant.spec.ts`,
  `preview: true` comme le câblage du module racine), pas sur le balayage de `test/openapi-contract.e2e-spec.ts`, qui
  ne monte pas tous les contrôleurs (le financement n'y est pas). Il relève la classe derrière chaque nom de schéma
  (`SchemaObjectFactory.getSchemaMetadata`, lue par son chemin : hors des `exports` du paquet) et les valeurs de
  chaque énumération nommée ; rouge si un nom vient de deux classes — même de forme identique — ou si une énumération
  nommée porte deux jeux de valeurs. L'avertissement « Duplicate DTO detected » de Swagger ne suffit pas : il ne se
  déclenche presque jamais (un nom déjà rangé n'est pas réexploré). Binding de Confluent doublé : le garde tourne sous
  Node 25 comme sous 24.
- **D-1084-18 — Les trois autres doublons trouvés par le garde sont corrigés ici**, plutôt que nommés dans le ticket :
  même défaut, même dépôt, même annonce. `ExerciceCompareDto` des états consolidés → `ExerciceCompareConsolideDto`
  (`ComparatifDto.exercice` publiait la comparaison d'exercices) ; `ControleArticulationDto` de la projection
  mensuelle → `ArticulationMensuelleDto` (`articulation` publiait les contrôles de cohérence) ; `ReferentielRefDto`
  local de la comparaison de versions → le commun (mêmes champs, document inchangé). À chaque fois, la classe que
  Swagger publiait garde son nom.
- **Preuves** (Node 25, sans Docker : aucun module, dépendance ni Dockerfile ne change) : document généré 576 → 579
  schémas (trois ajoutés, aucun retiré), trois schémas modifiés (leur seule référence), 98 chemins identiques ;
  `IndicateurDetteDto.valeurs.items.$ref` = `#/components/schemas/ValeurIndicateurDetteDto`
  `{ rang, exercice, statut, valeur, motif }`, `ValeurIndicateurDto` de l'analyse identique à l'octet. Garde 8/8 ;
  e2e `openapi-contract`, `financement`, `financement-emprunts`, `bilan-comparaison`, `bilan-comparaison-exercices`,
  `consolidation-etats`, `bilan-projection` 913/913 ; suite unitaire 347 suites, 11 928 passés, les 15 suites rouges
  connues (binding, chemins Windows) ; **mutations 4/4** rouges sur l'assertion (doublon de la dette remis, doublon de
  forme identique remis, énumération nommée en double, relevé qui ne note plus rien) ; `tsc`, lint, `nest build`.

## Pour la suite

- **FE-140 / FE-141** : types depuis l'OpenAPI vivant ; `echeancier.lignes` à afficher, `formule` au survol,
  `INCALCULABLE` + `motif` à traduire en texte d'écran.
- **STORY-1086** : figer l'échéancier, les indicateurs et le plan de financement avec la version (aujourd'hui calculés
  à la lecture, D-1084-2) ; le scénario retenu désigne la version COURANTE du jeu (D-1084-8) : le figement en garde la
  version (`scenario.hypothesesVersion` est déjà rendu).
- **STORY-1085** : les seuils des indicateurs viendront du référentiel `exigences-bancaires-uemoa`.
