# STORY-1082 : le dossier de démonstration créé par le moteur

Status: done

**Complexité :** moyenne à grande (une identité de service neuve dans `dossier-service`, deux routes du moteur, la
résolution du dossier dans l'import C13 de balance, la première pile de B qui lève bilan)

**Épic :** EPIC-147 (l'essai prospect), EPIC-160 (le contenu des jeux de démonstration)
**Dépôts :** `MoneyVibesGroup/prospera-dossier-service` ; `MoneyVibesGroup/prospera-balance-service`
**Plage :** reçue de A (STORY-1080 → 1084, 1093 ; plan du lot 4 §3, ligne 8). Identifiant réservé par A le 18/11.
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 8 : **Docker : 1 pile**. Fini quand :
`dossier-service` crée le dossier de démonstration sous l'identité `MOTEUR`, en espace d'essai seulement ; l'import C13
de balance le résout au lieu de le dériver (fin de D-928-3) ; la balance validée de la démo arrive à bilan ; ticket
`dossier-de-demonstration-sans-creation-par-le-moteur` fermé.
**Points ouverts à prouver ici** (première pile de B qui lève bilan) : le démarrage réel de bilan avec le module
`financement` (STORY-1083, 1084) ; celui de `dossier-service` après 1081.
**Livraison :** dossier #57 (`dev` **`2bf9dbd`**), balance #157 (`dev` **`d43fbe4`**) ; contrat annoncé avant la fusion
(stories #721), sans écart.
**Suivante :** STORY-1093.

**Sources lues :** plan du lot 4 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, passations,
pièges, D-975-11) ; journaux de A, C, D (aucune demande neuve à B qui passe avant) ; ticket
`TICKET-BACKEND-dossier-de-demonstration-sans-creation-par-le-moteur` ; fiches STORY-927 (D-927-2, D-927-3, « Pour
STORY-928 »), 928 (D-928-1 → 9), 929 (D-929-2), 975 (D-975-1 → 3, D-975-11), 1081 ; code sur `origin/dev` : dossier
`82642d6`, balance `98078b0`, bilan `d236c56`, auth `96f8ab3` (jeton de service : audience entière de l'IdP), catalogue
(`import-du-jeu.ts` : une part qui échoue s'arrête, aucune reprise dans l'appel) ; jeu
`jeux-demonstration/cabinet-demo-togo/` (`profil-societe` : 1 enregistrement, axes `SN`/`REEL` ; `balance` : 2024 et
2025).

---

## Passation constatée (première story de B sur balance, D-L4-1)

- **balance** (`prospera-balance-service`) : `origin/dev` = **`98078b0`** (STORY-928), le commit nommé par A ; **rien
  n'a bougé depuis**. Le checkout du poste (`balance-service`) était sur `dev`, 19 commits derrière : branche partie
  d'`origin/dev`.

## Ce qui existait déjà (relu avant la fiche)

- **balance** : l'import C13 de `profil-societe` pose lui-même un `dossierId` **dérivé** (12 octets de
  `sha256("jeu-demonstration|<org>|<dossierRef>")`) et écrit, pour ce dossier, la projection du dossier, la décision
  d'axes et le profil ; l'import de `balance` retrouve le dossier par la même dérivation. Le dossier n'existe donc que
  dans balance (D-928-3).
- **balance** n'a pas l'exercice : `submitInSession` résout `exerciceId` dans la projection `exercices_dossier`
  (alimentée par `dossier.exercice.*`), **hors session**, et laisse le champ vide si rien n'y est. Or bilan refuse une
  liasse sur une balance sans exercice (`409 BALANCE_SANS_EXERCICE`) ou dont l'exercice ne lui est pas encore projeté
  (`409 EXERCICE_NON_PROJETE`). Les balances de 928 n'avaient aucun exercice : même avec un dossier connu de bilan, elles
  n'y seraient pas arrivées.
- **dossier-service** n'admet aucune identité de service (D-975-3) ; toutes ses routes métier portent la garde
  `@RequiresDossierAccess()` (KYC de l'organisation approuvé), vérifiée par un invariant. Les axes ne se décident que
  sur un exercice ouvert (`409 AUCUN_EXERCICE_OUVERT`) ; un seul exercice ouvert par dossier (Q8, index).
- Les projections de balance (`dossiers_dossier`, `axes_dossier`, `exercices_dossier`) sont des `upsert` par clef en
  `$set` : l'événement écrit l'état entier, quel que soit l'ordre.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|---|---|---|
| AC-1 | `dossier-service` lit un jeton de service : identité connue et organisation de 24 hexadécimaux, sinon 401 `JETON_DE_SERVICE_INVALIDE` ; un jeton de service n'ouvre que les routes marquées `@AdmetIdentitesDeService('MOTEUR')` (403 `IDENTITE_DE_SERVICE_REFUSEE` partout ailleurs, `@AllowUnverified()` compris) | unitaires ; e2e |
| AC-2 | `PUT /api/v1/instance/dossier/{organisationId}/dossiers-de-demonstration/{dossierRef}` : identité `MOTEUR` seule (403 `IDENTITE_DE_SERVICE_REQUISE`), limitée à l'organisation du chemin (403 `ORGANISATION_HORS_JETON`), espace d'essai seulement (403 `ESPACE_REEL_REFUSE`, avant le corps) ; crée le dossier (identité du profil du jeu, origine `JEU_DEMONSTRATION`, clef `dossierRef`) et publie `dossier.created` ; rejouée, rend le même dossier sans rien écrire | e2e ; pile |
| AC-3 | `PUT …/dossiers-de-demonstration/{dossierRef}/exercices` (`debut`, `fin`) : ouvre l'exercice du jeu (le précédent ouvert est clos par le moteur), décide les axes du jeu au premier exercice (`dossier.axes.decides`), publie `dossier.exercice.*` ; rejouée, rend le même exercice ; un exercice antérieur à l'ouvert : 409 `EXERCICE_DE_DEMONSTRATION_HORS_ORDRE` ; dossier inconnu : 404 `DOSSIER_DE_DEMONSTRATION_INCONNU` | e2e ; pile |
| AC-4 | L'import C13 de balance résout le dossier par `dossier-service` (jeton du moteur relayé) au lieu de le dériver ; la dérivation est retirée ; chaque balance du jeu porte son `exerciceId` ; rejeu `DEJA_IMPORTE` | unitaires ; pile |
| AC-5 | La balance de démonstration validée arrive à bilan : bilan connaît le dossier et l'exercice, et en bâtit un jeu d'états | pile |
| AC-6 | bilan démarre sur la pile avec `FinancementModule` (`/health` sain, une route `financement` répond) ; `dossier-service` démarre après 1081 | pile |
| AC-7 | Tests relancés par chemin, lint des fichiers touchés, build, mutations rouges sur une assertion ; `docker compose up` sain | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-1082-1 — Le dossier est créé par `dossier-service`, appelé par l'import C13 de balance avec le jeton du moteur
  relayé.** Le jeu reste tel qu'il est (une part `balance`, `profil-societe` d'abord, D-927-2) et le catalogue ne change
  pas : l'import du premier objet du jeu demande à `dossier-service` le dossier de démonstration de son `dossierRef`, qui
  le crée sous l'identité du moteur (le jeton présenté à balance, limité à l'organisation, réémis tel quel : balance
  n'a pas d'identité machine, patron de `DocumentServiceClient`, P3). Le ticket recommandait la création « à
  l'ouverture de l'essai, avant l'import » : elle a lieu avant toute balance, au premier objet du jeu, sans dépendance
  neuve du moteur vers un service du socle. La résolution est **synchrone** : l'identifiant vient de la réponse, jamais
  d'une projection en retard.
- **D-1082-2 — Une identité de service dans `dossier-service`, au patron de balance (D-928-1) et de la comptabilité
  (D-975-1).** `JwtStrategy` lit `identite` et `organisationId` ; le porteur garde `tenantId: null` et `roles: []` (rien
  d'une route métier ne s'ouvre par lui). `EmailVerifiedGuard` décide de l'identité **avant** `@AllowUnverified()`. Le
  contrôleur du moteur n'est pas sous `@RequiresDossierAccess()` (le KYC d'une organisation d'essai n'est pas approuvé,
  et le moteur n'est pas un membre) : l'invariant de STORY-363 l'exclut **nommément**, et vérifie qu'il porte la marque
  du moteur à la place.
- **D-1082-3 — Espace d'essai seulement**, par `INSTANCE_ESPACE=ESSAI` (la variable déjà lue par le service pour son
  topic d'état publié, D-929-2) : 403 `ESPACE_REEL_REFUSE` avant la lecture du corps.
- **D-1082-4 — Le dossier de démonstration** : origine `JEU_DEMONSTRATION` (valeur neuve d'`OrigineDossier`, non
  publiée), clef `demonstration.dossierRef` unique par organisation (index partiel : la course de deux imports se
  tranche par la base), axes du jeu gardés sur le dossier (`demonstration.systemeComptable`, `.regimeFiscal`) jusqu'au
  premier exercice. Pays et dirigeants jugés comme à la création par le cabinet (`PAYS_NON_SERVI`,
  `DIRIGEANT_REQUIS`). **Sans responsable** (aucun membre ne le crée : l'administratrice le voit, l'affecte ensuite),
  **sans attestation de mandat** (client fictif ; seconde exception à D2 après « Mon cabinet »), **hors palier et hors
  lecture seule** (c'est le contenu de l'offre d'essai, écrit par le moteur). Rejouée, la route rend le dossier existant
  **sans le réécrire** (`cree: false`) : le jeu est figé, une correction passe par les routes du cabinet.
- **D-1082-5 — Les exercices du jeu s'ouvrent dans l'ordre, l'ouvert précédent est clos par le moteur.** Pour chaque
  balance, l'import demande l'exercice de ses bornes : déjà là ⇒ rendu tel quel ; sinon, l'exercice ouvert antérieur est
  clos (auteur `moteur`), puis le nouveau est ouvert (`ATELIER`, auteur `moteur`), par les services existants (un seul
  point de passage, journal et outbox compris). Le jeu cabinet donne donc 2024 `CLOS` et 2025 `OUVERT` : la démo montre
  une liasse validable sur 2025, et 2024 pour le comparatif. Un exercice qui précède l'ouvert : 409
  `EXERCICE_DE_DEMONSTRATION_HORS_ORDRE` (le jeu est ordonné ; naître `CLOS` serait l'origine `MIGRATION`, « sans liasse
  Prospera »). **Les axes du jeu sont décidés au premier exercice** (effet à son premier jour), avant toute clôture :
  une reprise après une panne entre deux étapes les décide encore au bon exercice.
- **D-1082-6 — Balance pré-projette ce que `dossier-service` vient de répondre, en `$setOnInsert`, hors de la
  transaction du lot.** Les réponses portent l'**état publié** (la forme exacte des événements) ; balance le passe par
  ses propres convertisseurs de projection (`versDossierProjetable`, `versExerciceProjetable`, `versAxesProjetables`).
  `$setOnInsert` : l'événement reste maître (il écrit en `$set`, quel que soit l'ordre d'arrivée). Hors transaction :
  `resoudreExerciceId` et la résolution du référentiel lisent hors session ; une écriture dans la session du lot leur
  serait invisible. Un lot refusé laisse ces projections : elles disent ce que `dossier-service` tient déjà. Le profil
  société reste écrit dans la transaction du lot, sous le `dossierId` résolu. **La dérivation `sha256` est retirée.**
- **D-1082-7 — Les refus de `dossier-service` vus par le moteur.** 404 `DOSSIER_DE_DEMONSTRATION_INCONNU` ⇒ 422
  `DOSSIER_DE_DEMONSTRATION_INCONNU` (le code de 928, inchangé) ; tout autre 4xx ⇒ 422 `DOSSIER_DE_DEMONSTRATION_REFUSE`
  (le code et le statut de `dossier-service` dans `details`) ; réseau, délai ou 5xx ⇒ 502 `DOSSIER_SERVICE_INJOIGNABLE`.
  Rien n'est écrit dans balance (le lot est refusé en entier) ; rejouer le lot reprend où `dossier-service` s'est
  arrêté (chaque étape y est idempotente).
- **D-1082-8 — Réglage neuf dans balance : `DOSSIER_SERVICE_URL`** (défaut `http://dossier-service:3009`, le nom et le
  port du compose et de la recette) et `DOSSIER_SERVICE_TIMEOUT_MS` (défaut 10 000).
- **D-1082-9 — La validation reste un geste humain** (D-928-4 inchangée : balances importées en `BROUILLON`). La
  preuve la joue en administratrice de l'organisation d'essai, puis demande le jeu d'états à bilan.
- **D-1082-10 — L'effacement de `dossier-service` n'est pas servi ici.** `dossier` n'est pas un module du catalogue :
  le moteur n'appelle aucune route d'effacement chez lui. À la fin d'un essai, le dossier de démonstration et ses
  exercices restent dans `dossier-service` (données fictives) ; balance efface toujours ses projections. Dette nommée
  au journal (à servir quand le moteur effacera le socle).
- **D-1082-11 — D-975-11 n'est pas nécessaire à cette preuve** : la pile obtient le jeton de l'organisation d'essai
  directement d'auth (comme 928 et 975). Elle reste à 1080.

## Contrats touchés (annoncés dans « ⚠ Contrats » avant la fusion)

- `dossier-service` : deux routes neuves, réservées au moteur en espace d'essai ; les événements `dossier.created`,
  `dossier.axes.decides` et `dossier.exercice.*` gardent leur forme (aucun champ neuf : `origine` et `demonstration` ne
  sont pas publiés).
- `balance-service` : l'import C13 garde ses corps (`contrats/instance/`) ; codes neufs (ajouts) : 422
  `DOSSIER_DE_DEMONSTRATION_REFUSE`, 502 `DOSSIER_SERVICE_INJOIGNABLE` ; réglages neufs `DOSSIER_SERVICE_URL`,
  `DOSSIER_SERVICE_TIMEOUT_MS` ; l'identifiant du dossier de démonstration n'est plus dérivé (un `ObjectId` de
  `dossier-service`).

## Preuves

- **dossier-service, Node 25** : `tsc` propre ; lint des fichiers touchés propre (`endOfLine auto`) ; unitaires **115
  suites, 1 871 passés**, 7 suites rouges **préexistantes** (6 binding de Confluent, `registre-pays.coherence`) ; e2e
  **10/10 suites, 395/395** (15 neufs : `test/demonstration.e2e-spec.ts`, vraie chaîne RS256/JWKS → gardes → garde du
  moteur → `ValidationPipe`, services doublés en mémoire avec Q8 et l'exercice ouvert exigé par les axes) ; neufs
  unitaires : stratégie (4), garde d'e-mail (5), `creerDossierDeDemonstration` (7) ; invariants : STORY-363 (exception
  nommée vérifiée), exhaustivité des codes (`demonstration`), méthodes du dépôt. Câblage du module racine **vert** avec
  le client Kafka doublé, **rouge** sans `AxesModule`.
- **balance-service, Node 25** : `npm ci --ignore-scripts` (checkout de 15/11) ; `tsc` propre ; lint propre ;
  instance-c13 : 7 suites, 18 tests neufs (importateur, client HTTP, bornes, identité) ; e2e `instance-c13` **19/19**
  (jeton relayé) ; suite complète **282 suites, 14 rouges préexistantes** (13 binding, `devise-paquet.exhaustivite` ;
  quatre suites lentes rouges sous charge, vertes seules : `sage-parser`, `plan-amortissement.regles`,
  `export-balance`, `export-balance.cout`). Câblage du module racine vert, rouge sans le fournisseur du client.
- **Mutations, rouges sur une assertion** : dossier **13/13** (identité traitée en utilisateur, `@AllowUnverified`
  avant l'identité, identité inconnue acceptée, organisation non vérifiée, espace jugé après le corps, hors ordre
  accepté, axes non décidés avant la clôture, exercice existant rouvert, précédent non clos, rejeu recréé, course non
  rattrapée, palier appliqué, marque du moteur retirée) ; balance **9/9** (autre organisation acceptée, pré-projection
  du dossier puis des exercices en `$set`, axes non pré-projetés, 404 non traduit, jeton non relayé ×2, 4xx pris pour
  une panne, NIF non traduit). Cinq réécrites d'abord pour compiler (`&& false` ⇒ `&& Date.now() < 0`).
- **Pile `grp-b`** (verrou pris à 00:13, rendu à 00:41 ; compose racine + surcouche hors dépôt ; images `runtime`
  depuis `git -c core.autocrlf=false archive` : auth `96f8ab3` et bilan `d236c56` d'`origin/dev`, dossier et balance
  des branches ; MongoDB en jeu de répliques, Kafka ; `INSTANCE_ESPACE=ESSAI` sur dossier, balance, bilan). Les quatre
  services `healthy` ; **bilan démarre avec `FinancementModule`** (huit routes `financement` mappées ; `GET
  /dossiers/{id}/financements` **200**) ; **dossier-service démarre après 1081** avec `DemonstrationModule` (deux
  routes). Accès de l'organisation de démonstration d'auth (`68a1…01aa`) **semés** (KYC, droits, états publiés
  `balance`, `bilan`, `financement` : hors de cette story). Script hors dépôt, **46 contrôles verts** :
  - refus : sans jeton 401 ; administratrice vérifiée 403 `IDENTITE_DE_SERVICE_REQUISE` ; jeton du moteur sur une autre
    organisation 403 `ORGANISATION_HORS_JETON` ; jeton du moteur sur `GET /dossiers` 403 `IDENTITE_DE_SERVICE_REFUSEE` ;
    rien d'écrit ;
  - import C13 du jeu `cabinet-demo-togo` par balance : la balance avant le profil 422
    `DOSSIER_DE_DEMONSTRATION_INCONNU` ; `profil-societe` `IMPORTE` (1), `balance` `IMPORTE` (2), rejeux `DEJA_IMPORTE` ;
    réimport sous d'autres clefs : rien de neuf ; `PUT` du dossier rejoué `cree: false` ;
  - dossier-service : **un** dossier (origine `JEU_DEMONSTRATION`, identité du jeu, sans responsable), visible de
    l'administratrice (`GET /dossiers`) ; 2024 `CLOS` et 2025 `OUVERT` par le moteur ; une décision d'axes `SN`/`REEL`
    au 2024-01-01 par le moteur ;
  - balance : deux balances `BROUILLON` sous le dossier de dossier-service, chacune avec son `exerciceId` (2025 = celui
    de dossier-service) ; la clôture de 2024 arrive par l'événement malgré la pré-projection ;
  - bilan : dossier et deux exercices projetés (événements de dossier-service) ; **balance 2025 validée** par
    l'administratrice, reçue `VALIDÉE` par bilan, **jeu d'états bâti (201, exercice 2025, `syscohada-revise`)**.
- **Suite, 11 contrôles verts** : dossier-service relancé en espace `REEL` : `PUT` (corps malformé) et exercice 403
  `ESPACE_REEL_REFUSE` ; l'import par balance 422 `DOSSIER_DE_DEMONSTRATION_REFUSE` (`details` : 403
  `ESPACE_REEL_REFUSE`), rien d'écrit nulle part ; effacement C13 de balance `EFFACE`, balances et projections
  (dossier, exercices, axes, profil) effacées. `down -v` : aucun conteneur, volume ni réseau `grp-b`.

## Ce qui reste

- **D-1082-10** : `dossier-service` n'efface pas le dossier de démonstration en fin d'essai (dette nommée au journal).
- **D-975-11** (jeton statique du moteur) reste à STORY-1080 : cette preuve n'en a pas eu besoin.
- La recette `cabinet-moteur` (1080) joue l'import C13 contre le vrai dossier-service : elle doit avoir
  `INSTANCE_ESPACE` sur dossier-service (D-929-2 le pose déjà) et peut ajouter la validation et le jeu d'états.
