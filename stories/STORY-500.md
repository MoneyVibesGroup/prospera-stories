# STORY-500 : Dépôts de la clientèle — à vue, à terme, et les intérêts que l'institution DOIT

Status: in_progress

**Complexité :** high

**Épic :** EPIC-122 — Membres et comptes de dépôts
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Les dépôts sont **au passif** d'une IMF : ce sont des dettes envers les membres. C'est le point où
un module conçu pour une entreprise commerciale se trompe le plus vite — l'argent qui entre à la
caisse d'une IMF n'est pas un produit, c'est une **dette**.

Et les dépôts à terme portent **des intérêts que l'institution doit** : ils se rattachent à
l'exercice qui les a courus, pas à celui qui les paie.

## Cadrage mesuré avant de coder (2026-09-13)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Les dépôts sont au **passif** | **VRAI** | `sfd-bceao@2.0` : `2511` Comptes ordinaires, `2512` Comptes ordinaires sur livret, `252`/`2521` Dépôts à terme reçus |
| Les intérêts courus sont une **charge à payer** | **VRAI** | `2526` et `25116` Dettes rattachées ; charges `60252` Intérêts sur dépôts à terme reçus, `60251` sur comptes ordinaires créditeurs |
| Un précédent de calcul d'intérêts existe | **FAUX** | aucun calcul d'intérêt de dépôt dans le produit ; la base 360 de `bilan-service` sert aux délais de BFR, pas à un contrat |
| Le nantissement vise un **crédit** | **PRÉMATURÉ** | le crédit n'existe pas avant STORY-501 |

### Décisions du 2026-09-13

- **D-500-A — la base de calcul est portée par CHAQUE dépôt à terme (décision user)** : `EXACT_360` ou
  `EXACT_365`, obligatoire à l'ouverture. Aucune constante, aucun défaut — même doctrine que la devise
  (D-499-B) : une convention contractuelle n'est jamais supposée.
- **D-500-B — un compte à vue n'est pas rémunéré dans 500 (décision user).** Emplacement inerte documenté
  pour la rémunération de l'épargne (livret `2512`, charge `60251`).
- **D-500-C — intérêts SIMPLES sur le capital, payés à chaque période (décision user).** Les échéances
  découpent l'ouverture → l'échéance selon la périodicité ; un mouvement de paiement règle des intérêts
  échus. À une date d'arrêté sont publiés les **intérêts courus non échus** (AC-3) **et** les **intérêts
  échus non payés** — deux dettes rattachées. Aucun intérêt ne court après l'échéance ; pas de capitalisation.
- **D-500-D — le blocage est livré dès 500 (décision user)** : blocage et levée, append-only, datés, motivés,
  attribués ; `disponible = solde − bloqué`. La référence au crédit nanti est un **emplacement inerte**
  pour STORY-501.
- **D-500-E — aucun compte comptable n'est choisi ici** (patron D-499-D) : le choix appartient à
  l'adaptateur de balance (STORY-507).

### Décisions de correctif d'audit (2026-09-13, pendant le dev)

- **D-500-H — les intérêts courus incluent le jour d'arrêté.** Le solde d'une date est celui de fin de
  journée, l'arrêté aussi : les courus portent sur `[dernière échéance, arrêté + 1 jour)`, bornés à la
  prochaine échéance. ⛔ Arrêté exclu, le **31/12 était perdu pour l'exercice N** et réapparaissait dans
  l'échu du 01/01, rattaché à N+1 — ce qu'AC-3 interdit. Raccordement exact : la veille d'une échéance, les
  courus valent l'intérêt entier de la période.
- **D-500-I — sur un dépôt à terme, l'annulation d'un versement n'est admise que datée du jour
  d'ouverture.** Annuler la constitution plus tard retirait le capital avant l'échéance : une **rupture
  anticipée par la porte de derrière**, sans règle de pénalité, alors que la rupture est hors périmètre.
  ⚠️ Conséquence assumée : une constitution erronée découverte après le jour d'ouverture ne se corrige pas
  dans 500 — elle relève de la même story que la rupture anticipée.
- **Borne des entiers sûrs à l'écriture.** Un montant unitaire borné ne borne pas une somme : le
  9 008ᵉ versement maximal dépassait 2⁵³, était **admis**, puis toute situation postérieure rendait 500.
  Refus typé à l'écriture.

### Hors périmètre, déclaré

Rupture anticipée d'un dépôt à terme, renouvellement, capitalisation, rémunération des comptes à vue,
clôture d'un compte, publication d'événement, production de balance.

## Critères d'acceptation

- [ ] AC-1 — Comptes de dépôt à vue et à terme, par membre. Les mouvements sont **append-only**
      (AD-1) : le solde d'un compte est la somme de ses opérations, à une **date d'arrêté**.
- [ ] AC-2 — Un dépôt à terme porte son **taux**, sa **date d'échéance** et sa **périodicité**
      d'intérêts.
- [ ] AC-3 — ⚡ **Les intérêts courus non échus sont calculés à la date d'arrêté** et constatés en
      charge à payer. Les ignorer sous-évalue les charges de l'exercice — et le déficit qui en
      résulterait n'apparaîtrait qu'au paiement, dans l'exercice suivant.
- [ ] AC-4 — Un blocage de compte (nantissement d'un dépôt en garantie d'un crédit) est **tracé et
      visible** : c'est une information de portefeuille autant que de dépôt.
- [ ] AC-5 — Le solde d'un compte à une **date passée** se recalcule à l'identique. Test de rejeu.

## Progress Tracking

**Statut : `in_progress` (2026-09-13).** Branches `MNV-500` ouvertes sur `docs` (base `main`) et
`microfinance-service` (base `dev`). Décisions D-500-A → D-500-I consignées ci-dessus.

### Développement — livré

- Module `depots` : collections `comptes_depot` (conditions immuables, compteur de révision servant de
  verrou) et `mouvements_depot` (append-only, refus de réécriture par le schéma, index uniques nommés
  d'annulation et de levée). Situation **dérivée** à une date d'arrêté ; blocages actifs du dossier.
- Fonctions pures : calendrier des échéances (pas `k × mois` depuis l'ouverture, jour borné en fin de
  mois), intérêts (numérateur exact cumulé, arrondi une fois par période), invariants à toute date
  (solde ≥ 0, bloqué ≤ solde, payés ≤ échus), borne des entiers sûrs.

### ⚡⚡ Ce que les suites mockées ne voyaient pas

- ⛔ **Aucun mouvement ne s'écrivait contre un vrai Mongo.** Le schéma `comptes_depot` déclare
  `timestamps.createdAt` : Mongoose ajoute alors, à l'incrément `$inc` du verrou, l'initialisation de
  `ouvertLe`. Le hook d'immuabilité — qui n'admet que l'incrément seul — refusait **toute** écriture. Les
  unitaires testaient le hook sur une mise à jour fabriquée à la main, les e2e mockaient la couche
  données : **tout était vert**. Seule la spec sur Mongo réel l'a vu. Corrigé (`timestamps: false` sur le
  verrou) ; la mutation inverse fait rougir cette spec.
- Audit de calcul (sous-agent `opus`, constats vérifiés dans le code avant correction) : D-500-H, D-500-I,
  borne des entiers sûrs ; un test qui prétendait garder les jours d'échéance ne gardait rien (renommé).
- Revue du service : exposant jamais contrôlé (seule la devise l'était) — corrigé.
- Contrat Swagger : un `400` de méthode effaçait `DOSSIER_ID_INVALIDE` ; deux codes nouveaux publiés
  nulle part ; une description contredisait D-500-H — corrigés, gardés par l'e2e.

### Portes (rejouées en session sur l'état final)

Lint 0 · build OK · **1 594** unitaires / 88 suites, couverture **99,47 / 95,88 / 99,29 / 99,51** ·
**189** e2e (18 sautés : suites Mongo sans URI) · **18/18** sur Mongo réel.

| Mutation | Test qui rougit (par assertion) |
|---|---|
| verrou sans `timestamps: false` | `depots.mongo.e2e-spec.ts` |
| courus sans le jour d'arrêté (D-500-H) | `interets-dat.spec.ts` (clôture au 31/12) |
| garde D-500-I jamais exécutée | `depots.service.spec.ts` |
| borne des entiers sûrs ignorée | `depots.service.spec.ts` |
| exposant ignoré (entrée / transaction) | `depots.service.spec.ts` |
| code `MONTANT_DEPOT_HORS_BORNE` non publié | `depots.e2e-spec.ts` |
| route `:mouvementId` au niveau de `situation` | `depots.e2e-spec.ts` (20 rouges) |
| `@RequiresReferentielDuDossier()` retiré | invariant de portée + `depots.e2e-spec.ts` |
| retrait DAT, membre clos, exercice, solde à toute date, devise, index… (11) | `depots.service.spec.ts` |

⚠️ Deux mutations rougissaient d'abord **par erreur de compilation** (import ou méthode devenus inutilisés) :
rejouées sous une forme qui compile, elles rougissent par assertion.

### Revue de code (⑥) — PR `microfinance-service` #4 — aucun bloquant, deux constats corrigés

- **La vue portefeuille ne pouvait pas utiliser l'index des levées** (confiance 85, vérifié par `explain`) :
  l'index unique `unicite_levee_par_blocage` est **partiel** (`$type: objectId`) et un `$expr` ne porte pas
  cette condition — Mongo parcourait, pour chaque blocage, toutes les levées du dossier (≈ 25 millions
  d'entrées examinées pour une page de 50 sur un dossier de 5 000 blocages levés). **Corrigé** : la condition
  de l'index est ajoutée au `$match` des levées.
- **La vue `blocages-depot` n'était jamais exécutée contre un vrai Mongo** (confiance 80) : seule la FORME de
  son pipeline était testée — exactement l'angle mort où le verrou refusé est resté caché. **Corrigé** : tests
  sur Mongo réel (levée postérieure à l'arrêté, levée antérieure enregistrée après, autre dossier, pagination
  enjambant des blocages levés).
- Lentille over-engineering (`ponytail-review`) : six simplifications cosmétiques (spread, type en double,
  regex du motif recopiée de `texte-identite.ts`) — **non appliquées** : aucune ne change un comportement, et
  la factorisation de la regex toucherait un fichier partagé avec `membres`, hors périmètre.

### Revue de sécurité (⑦) — aucune vulnérabilité

Seize pistes examinées et écartées avec preuve dans le code : IDOR sur les identifiants de chemin **et sur
les cibles** d'annulation/levée (cherchées uniquement parmi les mouvements du compte lus sous verrou, même
409 qu'un identifiant inexistant), 404 jamais 403, décorateurs de classe sans exception de méthode,
injection NoSQL (`apres`, `dateArrete`, `limite` validés), mass assignment (`forbidNonWhitelisted`, devise
et auteur jamais lus du corps), motif libre absent des journaux, double annulation/levée concurrente (verrou
+ index uniques), verrou d'exercice sur chaque correction, intégrité comptable.
Un point sous le seuil, **corrigé par prudence** : sur un état proche de 2⁵³, le rapport d'une violation
convertissait les montants et levait une erreur brute (500) — la borne est désormais vérifiée **avant** les
invariants ; la mutation inverse fait rougir le test. Un point **consigné comme dette** : chaque écriture
et chaque situation chargent tous les mouvements du compte (linéaire, même patron que les parts sociales).

### Portes sur l'état final (HEAD `3974d70`, rejouées en session après les correctifs de revue)

Lint 0 · build OK · **1 595** unitaires / 88 suites, couverture **99,47 / 95,88 / 99,29 / 99,51** · **189** e2e
(23 sautés : suites Mongo sans URI) · **23/23** sur Mongo réel (dont 5 tests de la vue portefeuille ; la mutation
de la date des levées en fait rougir 3).

### ⚠️ Vérification docker — un premier passage NUL, dit plutôt que tu

Le premier passage a été **arrêté avant d'écrire quoi que ce soit** : le conteneur répondait `healthy`, mais le
processus en mémoire datait de 20:27 — **tous les rechargements à chaud échouaient en `EADDRINUSE :::3011`**
depuis 21:17, l'ancien processus tenant le port. Il servait donc du code d'AVANT D-500-H, D-500-I et la revue.
Un `grep` dans `src/` montrait le code à jour **sur disque** : il ne prouvait rien du processus. Stack
redémarrée par Portly ; le code servi est prouvé par l'OpenAPI publiée sur le port (elle contient
`ANNULATION_VERSEMENT_DAT_HORS_OUVERTURE`, que seul le contrôleur final déclare).

## Notes

- Voir [[STORY-499]], [[STORY-507]] (publication en balance), spine AD-1.
