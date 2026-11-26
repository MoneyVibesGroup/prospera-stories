# STORY-1128 : Le contrat d'état publié figé (EPIC-142), et l'inventaire de ce qui reste dans EPIC-142 → 147 et 159

Status: done — **livrée le 2026-11-26** : platform-catalog-service **#85** (`2a19265`, `e35d6a0` sur `dev`),
prospera-plateforme **#42** (`758568e` sur `dev`, étiquette **`contrat-etat-publie-v1.1`**) ; voir « Livraison » et
« Inventaire ». Fiche écrite le 2026-11-26 par la session du groupe B juste avant de coder (lot 7, n° 10 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 10 ; identifiant réservé D-L7B-1).
**Date dure : fusionnée au plus tard le 11/12** (plan §3, D-L7B-5) : « plus rien ne s'ajoute sans version neuve ».

**Dépôts :** `platform-catalog-service` (la partie A du moteur, source du contrat), `prospera-plateforme` (part moteur de B :
la copie publiée) · **Points :** 3 · **Dépend de :** STORY-932 (le contrat, `contrat-etat-publie-v1`), STORY-936
(l'émetteur), STORY-937 (la garde partagée), STORY-1127 (`module.referentiels`, `contrat-etat-publie-v1.1`) · **Suite :**
STORY-1131 (n° 13, les restes d'EPIC-145, 146, 147, nommés par l'inventaire ci-dessous)
**Sources :** plan du lot 7 de B §1 (n° 10) et §3 ; `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (S5 : « 11/12 : contrat
d'état publié figé (EPIC-142) ») ; `epics-moteur-installation-2026-11-11.md` (EPIC-142 → 147, 159 : ce que chaque épic promet)
; `PLAN-LOT-6-2026-11-23.md` §5 ; fiches STORY-932, 936, 937, 1080, 1127 (D-1127-10) et 953 (D-953-15) ; `REGLES-DES-GROUPES.md`
§1.8, §3, §6.

---

## Pourquoi

EPIC-142 promet un contrat d'état publié « versionné, **ajouts seulement** après le 11/12 » (AD-24), « publié et étiqueté le
11/12 ». Aujourd'hui, le gel n'est qu'une phrase du README du catalogue : rien ne rougit si quelqu'un change un champ de
`contrat/etat-publie.openapi.json` sans changer sa version, retire une valeur d'énumération ou rend un champ requis (deux trous
connus de Karapace 6.2 en BACKWARD, journal de B, « Pièges »). La garde partagée de `prospera-plateforme` relit la matrice dans
le checkout voisin du catalogue, et **se saute** quand il manque. Cette story fait du gel une propriété vérifiée, et écrit
l'inventaire de ce qui reste dans les épics du moteur, pour STORY-1131.

## Ce qui est déjà livré (relu dans le code le 26/11 : catalogue `origin/dev` `efedd3e`, plateforme `origin/dev` `d68a468`)

- **Le contrat** : `contrat/etat-publie.openapi.json` (**1.1.0**), `contrat/matrice-etats.json` (`versionMatrice` 1, inchangée
  depuis la v1), `contrat/schemas/etat-publie.changed.json` (`schemaVersion` 1). Étiquettes `contrat-etat-publie-v1`
  (`fb5381b`, STORY-932) et `contrat-etat-publie-v1.1` (`efedd3e`, STORY-1127). Entre les deux, seul `efedd3e` a touché ces
  trois fichiers (la route et l'événement ; pas la matrice).
- **Ce qui garde** : `src/contrat/etat-publie.contrat.spec.ts` (une définition d'un module pour la route et l'événement, les
  neuf états partout, le menu qui ne contredit pas la garde) ; `scripts/schemas/registre.mjs` met **BACKWARD** sur chaque
  sujet et ne compare qu'à la **dernière** version ; `test:schemas` (Karapace). **Aucune garde ne compare le contrat à une
  version publiée.**
- **La garde partagée** (`prospera-plateforme/paquets/garde-etat-publie`, étiquette `garde-etat-publie-v1`, `058257f`) : copie
  de la partie « garde » de la matrice ; son test relit `../platform-catalog-service/contrat/matrice-etats.json` et **se saute**
  si le fichier manque. Douze services en gardent une copie épinglée (`src/vendor/garde-etat-publie/ORIGINE.json`), à l'octet.
- **Personne ne garde de copie** de l'OpenAPI, de la matrice ou du schéma de l'événement (relevé du 26/11 dans tous les dépôts du
  poste, `origin/dev`) ; les fronts génèrent leurs types depuis l'OpenAPI du catalogue, sans épingle.
- **L'émetteur** compare `etat`, `finLe`, `effacementLe` et `referentiels` (`etats_emis`) ; **pas `versionCode`** : une montée
  de version seule n'est pas republiée (D-1127-10, depuis STORY-936).
- **Le manifeste `instance`** (`src/module.manifest.ts`) déclare `routesInstance.export`, `import`, `effacement`, `sante` et
  `migrer` ; **aucun contrôleur du catalogue ne les sert** (D-953-15 : l'export « à STORY-1128 au plus tard »). L'effacement
  d'un essai saute le module `instance` (`modules.delete('instance')`), qui n'appelle donc jamais ces routes.

## Contrat annoncé avant le code (2026-11-26)

**Le gel, sans changer un octet du contrat.** La version figée est **1.1.0** (`contrat-etat-publie-v1.1`, `efedd3e`) ; aucune
version neuve n'est publiée par cette story.

1. **Catalogue — l'historique des versions** : `contrat/historique/etat-publie/versions.json` (une entrée par version publiée :
   `version`, `etiquette`, `commit`, `story`, `date`, `resume`, et l'**empreinte canonique** de chacun des trois fichiers) et la
   **photo** de chaque version (`contrat/historique/etat-publie/<version>/`, recopiée de son étiquette à l'octet).
2. **Catalogue — la garde du gel** (`src/contrat/etat-publie.gel.spec.ts`, unitaire, sans Docker) : rouge si les trois fichiers
   diffèrent de la photo de la dernière version (« changement non versionné ») ; si `info.version` de l'OpenAPI n'est pas la
   dernière version ; si une photo a bougé ; si deux versions d'une même majeure ne sont pas **des ajouts seuls** (règles
   D-1128-3) ; si la matrice change dans une majeure (D-1128-4).
3. **Catalogue — le registre** : les sujets `etat-publie.changed.essai-value` et `.reel-value` passent en
   **`BACKWARD_TRANSITIVE`** (`schemas:enregistrer`) ; `schemas:compatibilite` compare le schéma du dépôt à **chaque** version
   enregistrée de ces sujets. Les autres sujets restent BACKWARD.
4. **Plateforme — le contrat publié** : `contrats/etat-publie/` = copie à l'octet des trois fichiers à l'étiquette
   `contrat-etat-publie-v1.1`, avec `ORIGINE.json` (dépôt, étiquette, commit, version, empreintes) ; un test (jamais sauté)
   rejoue la garde partagée contre **cette** matrice, vérifie les empreintes, et, quand le catalogue est sur le poste, que la
   copie est une version listée par son historique. Étiquette **`contrat-etat-publie-v1.1`** posée dans `prospera-plateforme`
   sur le commit fusionné. `paquets/garde-etat-publie/src/index.ts` **inchangé** (les douze copies épinglées restent vraies).
5. **Émission (comportement, forme inchangée)** : l'émetteur range et compare aussi `versionCode` (D-1127-10 refermée) : une
   montée de version seule publie un état neuf (`numero` suivant). Au premier démarrage du catalogue livré, chaque module
   installé dont le droit porte une version est **republié une fois** (rattrapage, comme D-1127-4).
- **Inchangés** : les trois fichiers du contrat (OpenAPI 1.1.0, matrice v1, schéma `@1`), les topics, `entitlement.changed`,
  la garde partagée et ses copies, le BFF, auth, les manifestes.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | Un changement d'un des trois fichiers sans version neuve rougit ; une version neuve qui retire, retype, rend requis, change une énumération ou une contrainte rougit ; un ajout facultatif versionné passe | unitaires (`etat-publie.gel.spec`), mutations |
| AC-2 | Les photos 1.0.0 et 1.1.0 sont celles des étiquettes, à l'empreinte près ; 1.0.0 → 1.1.0 est un ajout seul | unitaires |
| AC-3 | Sur Karapace, les sujets de l'état publié sont `BACKWARD_TRANSITIVE` ; un schéma compatible avec la dernière version mais pas avec la v1 est refusé | `test:schemas`, `schemas:enregistrer` sur pile neuve |
| AC-4 | `prospera-plateforme` publie la copie à l'étiquette ; la garde partagée y est rejouée cellule par cellule sans se sauter | `npm test` de la plateforme |
| AC-5 | Une montée de `versionCode` seule publie un état neuf ; inchangé, rien ; un état émis sans `versionCode` rangé est republié une fois | unitaires ; `test:socle` (vrai MongoDB) |
| AC-6 | La règle est écrite dans les README du catalogue et de la plateforme ; l'inventaire d'EPIC-142 → 147 et 159 est écrit (livré, story, SHA, reste, à qui) | relecture |
| AC-7 | Annoncé dans « ⚠ Contrats » avant la fusion ; C et D prévenus | journal ; message |

## Décisions retenues par défaut (contestables)

- **D-1128-1 — « Figé » veut dire trois verrous, et un octet = une version.** (a) La garde du gel dans le catalogue (la seule qui
  joue partout, sans Docker) ; (b) le registre en compatibilité transitive pour l'événement ; (c) la copie publiée et
  étiquetée dans `prospera-plateforme`, contre laquelle la garde partagée se rejoue. Tout changement d'un des trois fichiers,
  même une description, demande une version neuve (photo, entrée, `info.version`, étiquette après la fusion) et une annonce.
- **D-1128-2 — L'empreinte canonique** : `sha256` de `JSON.stringify(JSON.parse(texte))`, insensible aux fins de ligne et aux
  espaces (le checkout du poste est en CRLF, les images en LF) ; la même dans le catalogue et dans la plateforme.
- **D-1128-3 — Un « ajout seul »** (entre deux versions d'une même majeure, appliqué à tout le document) : rien ne disparaît
  (propriété, chemin, méthode, réponse, schéma, paramètre) ; aucun type, `$ref`, motif, format, borne, `const` ou
  `additionalProperties` ne change ; `required` et `enum` gardent exactement les mêmes valeurs (un état neuf est une majeure :
  C8 le lirait `NON_INSTALLE`) ; une clé neuve n'entre que dans une carte de noms (`properties`, `paths`, `schemas`,
  `responses`, une méthode d'un chemin) et jamais comme exigée ; `description`, `title`, `summary`, `example(s)` et
  `info.version` sont libres.
- **D-1128-4 — La matrice est figée pour toute la majeure 1.** Les copies de la garde refusent une `versionMatrice` inconnue ;
  changer une cellule, c'est `versionMatrice` 2, donc le contrat 2.0.0, l'événement `@2` (AD-27) et une garde neuve
  étiquetée. La garde du gel l'exige (matrice identique à l'empreinte près dans une majeure).
- **D-1128-5 — Aucune version neuve ici** : les trois fichiers ne bougent pas ; la version figée est 1.1.0, son étiquette dans
  le catalogue reste `contrat-etat-publie-v1.1` (`efedd3e`), aucune étiquette neuve n'y est posée.
- **D-1128-6 — `BACKWARD_TRANSITIVE`, et la vérification contre chaque version.** Karapace 6.2 laisse un champ facultatif
  devenir requis en BACKWARD (piège de 942) ; contre la v1, où le champ n'existait pas, le même changement est refusé. Le
  script, qui ne fait que vérifier en `compatibilite`, compare à chaque version enregistrée (la règle ne dépend pas du mode
  posé sur le sujet).
- **D-1128-7 — La copie publiée vit dans `prospera-plateforme/contrats/etat-publie/`**, dossier de B, recopiée par
  `git -c core.autocrlf=false show contrat-etat-publie-v1.1:<chemin>` (§1.8). La source reste le catalogue (AD-17) ; la copie
  est ce qu'un consommateur épingle. Le test de la garde du checkout voisin (STORY-937) reste ; le neuf ne se saute jamais.
- **D-1128-8 — `versionCode` entre dans la comparaison de l'émetteur** (D-1127-10) : petit, et c'est le contrat (le champ est
  publié, une montée de version doit se voir). Rattrapage une fois au démarrage, voulu.
- **D-1128-9 — Les routes `instance` du manifeste ne sont pas servies ici** (export, import, effacement, santé, migrer) : servir
  l'export du module `instance`, c'est l'export par l'Administration (EPIC-145, coque `instance`) et l'export pendant
  `ESSAI_TERMINE` (EPIC-147) ; ni petit, ni le contrat d'état publié. Le manifeste ne change pas (il ne se raye pas) ; la route
  va à STORY-1131, qui recopiera `contrats-instance-v1.1` au catalogue (D-953-15).
- **D-1128-10 — L'inventaire vit dans cette fiche** (« Inventaire »), pas dans un fichier neuf de `coordination/` :
  `REGLES-DES-GROUPES.md` §6 dit ce que chaque session écrit, et une fiche est à son groupe.
- **D-1128-11 — `REGLES-DES-GROUPES.md` ne change pas** (§6 : par une PR demandée par l'utilisateur). Sa ligne §3 « figé
  (étiquette `contrat-etat-publie-v1`) : ajouts seulement » reste vraie ; la règle précise est écrite dans les README et au
  journal ; la mise à jour de la ligne est une question à l'utilisateur (journal de B), défaut : laisser la ligne.
- **D-1128-12 — C et D** : un message court quand c'est figé ; ce qui change pour eux : rien, sinon que tout ajout demande une
  version neuve, annoncée.

## Livraison (2026-11-26)

**platform-catalog-service #85**, fusionnée en « Rebase and merge » : `dev` **`2a19265`**, **`e35d6a0`** (branche
`b7c7eb3`, `d1907bb`, arbre identique). **prospera-plateforme #42** : `dev` **`758568e`** (branche `6e00f2d`, arbre
identique) ; étiquette annotée **`contrat-etat-publie-v1.1`** posée sur `758568e` et poussée. Dans le catalogue, aucune
étiquette neuve (D-1128-5). Contrat annoncé avant le code : stories #1000 (`main` `6742cfb`). Conforme à l'annonce, sans
écart.

- **Catalogue** : `contrat/historique/etat-publie/` (`versions.json` ; photos `1.0.0/` et `1.1.0/` recopiées par
  `git -c core.autocrlf=false show <étiquette>:…`) ; `src/contrat/gel-du-contrat.ts` (`empreinteCanonique`,
  `ecartsNonAdditifs`, `manquementsAuGel`) et `src/contrat/etat-publie.gel.spec.ts` (37 tests : le gel tient, l'historique,
  l'empreinte, les ajouts admis et refusés sur la version figée, un dépôt jetable où chaque manquement rougit) ;
  `scripts/schemas/registre.mjs` (`TRANSITIFS`, `compatibiliteDu`, la vérification contre chaque version) ;
  l'émetteur (`versionCode` calculé une fois, rangé dans `etats_emis`, comparé ; `EtatEmis.versionCode` déclaré) ; un cas de
  `test:schemas` (transitif), un de `test:socle` ; README (« Le contrat d'état publié est figé »).
- **Plateforme** : `contrats/etat-publie/` (les trois fichiers à l'octet, `ORIGINE.json`), `test/contrat-etat-publie.test.ts`
  (5 tests, dont la garde partagée rejouée contre cette matrice, jamais sautée), README (dossier de B et règle).
  `paquets/garde-etat-publie/src/index.ts` inchangé.

### Preuves

- **Node 25** : `src/contrat` et `src/etat-publie` 162/162 puis 163 ; suite complète **1 699 passés** / 1 700, 3 suites
  rouges connues (binding de Confluent : `app-cablage.invariant`, `kafka-producer`, `outbox-relay`). Un premier passage
  complet avait une quatrième suite rouge (2 tests) ; le second, identique au code près, non (charge du poste, D-1128-14).
  Lint des fichiers touchés et `tsc` propres. Plateforme : `npm test` **674/674**, `typecheck` vert.
- **Mutations 18/18 tuées sur assertion** (aucune au compilateur) : empreinte sans réécriture, `enum` hors des ensembles,
  ensembles toujours égaux, paramètre neuf exigé admis, contrainte neuve admise, retrait admis, `properties` hors des cartes,
  `description` non libre, contrat courant non comparé, `info.version` non lue, matrice non comparée, majeures confondues,
  photos non relues, ordre non vérifié ; émetteur : `versionCode` non comparé, non rangé, absent ≠ `null`, publié hors
  installation (survivante au premier tour, tuée par un cas ajouté : en installation, le droit portant déjà sa version).
- **Node 24, étage `verification`** (image de l'export de la branche) : **105/105 suites, 1 719/1 719**, lint 0, build 0.
- **Pile `grp-b` neuve** (MongoDB rs0, Redis, Kafka, Karapace 6.2), Node 24 dans le réseau de la pile :
  - `schemas:enregistrer` : les deux sujets de l'état publié en **`BACKWARD_TRANSITIVE`**, les autres en BACKWARD (relu par
    `GET /config/<sujet>`) ; `schemas:compatibilite` : « compatible BACKWARD_TRANSITIVE » contre chaque version, code 0.
  - `test:schemas` **9/9** : les photos 1.0.0 puis 1.1.0 s'enregistrent en transitif (versions `[1, 2]`) ; la liste
    `referentiels` rendue requise est **refusée contre la v1 et refusée à l'enregistrement** (409) ; sur un sujet en
    BACKWARD seul, Karapace l'**accepte** contre la dernière version (le trou que le transitif ferme).
  - `test:socle` **20/20** (dont le cas neuf : un état émis sans `versionCode` republié une fois, n° 5 ; rejoué, rien ; la
    version montée seule, n° 6 ; rangée `1.1` sous le schéma strict).
  - Verrou **20:38 → 20:44** (une passe), `down -v`, aucun conteneur ni volume `grp-b` restant, image de preuve retirée.

### Décisions ajoutées à la livraison

- **D-1128-13 — La v1 n'a pas été posée d'avance sur les vrais sujets de la pile** (Karapace a rendu `50003` « forwarding
  to the master » juste après sa santé) : les vrais sujets portent la 1.1.0 seule ; la compatibilité transitive v1 → 1.1.0
  est prouvée sur des sujets jetables (`test:schemas`), avec les photos publiées. Rien d'autre ne dépend de cet ordre.
- **D-1128-14 — Le premier passage complet sous Node 25 (4 suites rouges, 2 tests) n'est pas compté** : le second, sur le
  même code, n'a que les trois suites connues, et l'étage `verification` est vert en entier.
- **D-1128-15 — Le cas « en installation, le droit portant déjà sa version »** est ajouté après la mutation survivante
  (M18) : même règle que la publication de `versionCode` depuis STORY-936.

## Inventaire d'EPIC-142 → 147 et 159 (2026-11-26)

Relevé sur `origin/dev` de chaque dépôt du poste, le 26/11, contre ce que chaque épic promet
(`epics-moteur-installation-2026-11-11.md`). « SHA » = un commit de la PR sur `dev`. « À qui » : le propriétaire du
dépôt au lot 7 (B, sauf mention), ou la story de B qui le prend (plan du lot 7, ligne n°). Il nourrit **STORY-1131**
(n° 13).

### EPIC-142 — un contrat d'état publié stable, un socle prêt pour le moteur

| Livré | Story | PR, SHA |
|---|---|---|
| Socle du catalogue : client de Confluent, Node 24, Karapace, schéma de `entitlement.changed` | STORY-930 | catalogue #43 `55bf016`, recette #17 `85d54b8` |
| `prospera-plateforme` : contrats agent / centrale / partie A, vecteurs signés, `@prospera/signature` | STORY-931 | plateforme #1 `7630cdd` |
| Le contrat d'état publié : route, matrice des neuf états, événement (`contrat-etat-publie-v1`) | STORY-932 | catalogue #44 `fb5381b` |
| Redis, BullMQ et le verrou de l'outbox du catalogue | STORY-933 | catalogue #45 `45dd370`, recette #18 `55009e7` |
| auth pour le moteur : droits à tiret, `instance:*`, consentement réservé au DG, naissance interne idempotente | STORY-938 | auth #38 `f29e902` |
| Verrou npm et scripts racines de la plateforme | STORY-941 | plateforme #6 `9f43fa9` |
| AD-41, premier incrément : centrale et agent, test croisé des vecteurs | STORY-955 | centrale #1 `5671fab`, agent #1 `db1dd58` |
| `module.referentiels` (`contrat-etat-publie-v1.1`) | STORY-1127 | catalogue #84 `efedd3e` |
| **Le gel** : un octet = une version, ajouts seuls, matrice figée, Karapace transitif, copie publiée | STORY-1128 | catalogue #85 `2a19265`, plateforme #42 `758568e` |

**Reste** :
- La **doublure de la coque** branchée sur le contrat publié, rejouée sans écart → **A** (coque, AD-23) : elle lit désormais
  `prospera-plateforme/contrats/etat-publie/` à l'étiquette `contrat-etat-publie-v1.1`.
- La **relecture par A** de la v1.1 (le seul ajout depuis la v1, relue avant le premier gel) → **A** (`REGLES` §2), demandée
  au journal ; non bloquante (ajout facultatif).
- `libelle` n'entre pas dans la comparaison de l'émetteur : un module renommé au catalogue n'est pas republié (cosmétique,
  noté) → STORY-1131 s'il le faut.

### EPIC-143 — le catalogue connaît chaque module par son manifeste

| Livré | Story | PR, SHA |
|---|---|---|
| Manifeste dans `ModuleVersion` (C1), refus nommés, résolution des dépendances, garde source/copie | STORY-934 | catalogue #46 `b901f60` |
| 46 manifestes enregistrés, `catalogue.manifeste.publie`, droits renommés | STORY-935 | catalogue #47 `f13a0b8` |
| Read-model de manifestes de paiement : la vente résout comme la console (`resolution-dependances.json` rejoué) | STORY-939 | paiement #118 `9b88b72` |
| `domainesEchange` et contrats de Connecteurs rejoués par le catalogue | STORY-954 | catalogue #51 `60473e1`, plateforme #9 `b4c5c46` |
| Recopies des manifestes au catalogue (cinq suites, jusqu'à `paiement` 1.2.0 et `ged` 1.10.0) | STORY-979 | catalogue #71 → #83, `ce8cbc0` |

**Reste** : les **écrans** de la console (catalogue des modules, fiche d'un manifeste, refus nommés, table de l'offre au menu)
→ **A** (ticket `TICKET-FRONTEND-console-manifestes.md`) ; FR-12 (un pack modifié ne vaut que pour les contrats neufs,
STORY-727 lots 6 et 7) et FR-37 (la table de l'offre au menu, côté données) : **à relire par STORY-1131**, aucune preuve
trouvée dans ce relevé.

### EPIC-144 — installer une offre en une action, par un seul point de décision

| Livré | Story | PR, SHA |
|---|---|---|
| La logique du point de décision (`point-de-decision-v1`), conformité et mutation | STORY-943 | plateforme #7 `5883740` |
| L'installation, un plan enregistré, idempotent, repris après coupure | STORY-944 | catalogue #52 `c3c63c8` |
| La bascule : aucun `ACTIVE` hors du moteur, échéance soldée « acquis, à installer » | STORY-945 | catalogue #55 `9798ff5` |
| Recettes croisées réécrites sur le point de décision unique | A-917 | recette `2debafe` |
| Le cabinet installé par le moteur dans la recette ; balance et bilan servent leurs vérifications | STORY-1080 | catalogue #67 `fddfa7d`, BFF #38 `7c85076`, recette #27 `a6da2ea` |

**Reste** : retirer les chemins d'octroi après AP-55 (le `PUT …/entitlements` gardé pour la sanction seule) et rejouer
`cabinet-moteur` et `abonnement` → **STORY-1129** (n° 11, 18/12) ; désinstaller et réinstaller (FR-39) → **lot 8** (S9).

### EPIC-145 — l'état publié fait foi pour la coque et pour chaque garde

| Livré | Story | PR, SHA |
|---|---|---|
| Matrice exécutée, route `GET /etat-publie/{organisationId}`, émetteur à l'heure dite | STORY-936 | catalogue #48 `f49cf22` |
| Garde partagée (`garde-etat-publie-v1`), paiement en double lecture | STORY-937 | plateforme #2 `058257f`, paiement #117 `fdfc7dd` |
| Droits hors du jeton, étapes 1 et 2 (`GET /moi/droits`, `dv`, `droitsEffectifs` en double lecture) | STORY-949 | auth #41 `a30e78f`, catalogue #54 `abc5716` |
| Notification sur le socle, garde en double lecture | STORY-950 | notification #87 `e895c79`, catalogue #50 `9713dff`, paiement #120 `aa985c8` |
| Le jeton du moteur par organisation | STORY-978 | catalogue #63 `f9e9e26` |
| La lecture de la console (`GET /console/etat-publie/{org}`) | STORY-1080 | catalogue #67 `fddfa7d` |
| `module.referentiels` ; `versionCode` republié (D-1127-10) | STORY-1127, 1128 | catalogue #84, #85 |
| `reseau` sur l'état publié seul (D) ; `assurance` sur l'état publié (C, puis D) | STORY-1050, 1006 | reseau #13, #14 ; assurance |

**Reste** :
- **`module.interrupteurs` est toujours vide** (`interrupteurs: []` à la route et dans l'événement, « pas encore tenu
  (EPIC-151) ») : c'est le champ qui doit remplacer `config` de `entitlement.changed` (voir EPIC-159) → **STORY-1135**
  (n° 17, EPIC-151) ou STORY-1131 ; le champ est déjà au contrat (le remplir n'est pas une version neuve).
- La **route d'export du module `instance`** (et `import`, `effacement`, `sante`, `migrer` du manifeste) : déclarée, non
  servie (D-1128-9) ; l'export par l'Administration (FR-43, coque `instance`) → **STORY-1131**, qui recopie
  `contrats-instance-v1.1` au catalogue (D-953-15).
- `HorlogeDeReference` sur site (`GET /heure`) → **STORY-1133** (EPIC-148).
- FR-35 (droits de tenant filtrés par les modules ouverts, STORY-365 requalifiée) : **à relire par STORY-1131**.
- Droits hors du jeton, étape 3 (fin de la double lecture de `droitsEffectifs`) : **à relire par STORY-1131** (ADR
  `ADR-droits-hors-du-jeton-2026-11-15.md`).
- Quatre copies de la garde partagée **sans test de copie** : `document-service` (**B**, depuis le lot 7), `assurance`,
  `liaison-assureur`, `sinistres` (**D**) ; les autres en ont un (empreinte, et le voisin `prospera-plateforme`).
- Les **écrans** d'état, bandeaux de préavis et de lecture seule (coque `moteur`) → **A**.

### EPIC-146 — deux espaces : essayer, puis mettre en service

| Livré | Story | PR, SHA |
|---|---|---|
| La naissance d'une organisation, le registre, l'identité de la Reprise | STORY-948 | catalogue #53 `102f7e2`, auth #40 `017b938` |
| Essai ou réel : liste blanche des sorties, journal des interceptions, mise en service d'un sous-ensemble, feu vert | STORY-951 | catalogue #56 `8f3e321` |
| L'invitation au réel à la mise en service | STORY-974 | auth #45 `e83568d`, catalogue #61 `a672a44` |
| Le BFF relaie mise en service, sorties de l'essai, naissances | STORY-1113 | catalogue #72 `45971cf`, BFF #40 `dcd76df` |
| « Essayer, puis mettre en service » de bout en bout sur pile neuve | STORY-1115 | recette #28, #29 |

**Reste** : le **rafraîchissement** (FR-10 : vers un `ESSAI_CLIENT`, jamais `ESSAI_PROSPECT`, `SUSPENDRE_ECHEANCES` /
`REPRENDRE_ECHEANCES`, masquage des champs personnels) → **STORY-1131** (la partie A ; l'agent l'exécute avec EPIC-148) ;
NFR-3 (les trois exceptions journalisées, et elles seules) : **à relire par STORY-1131** ; les routes d'import C13 de chaque
module (répétition générale) → leurs **propriétaires** (C, D) ; les écrans (AP-56, marque d'essai de la coque) → **A**.

### EPIC-147 — le prospect essaie avant de signer

| Livré | Story | PR, SHA |
|---|---|---|
| L'essai d'un prospect : J+30, une prolongation, `ESSAI_TERMINE`, signer rouvre ; avis J-7 | STORY-952 | catalogue #57 `45c3b33`, notification #88 `9d6f3ae` |
| Jeu de démonstration, effacement C13, certificat signé, cinq essais simultanés ; export C13 (suite « e ») | STORY-953 | plateforme #17 `5a50249`, #41 `d68a468` ; catalogue #58 `4dfde25` |
| Le BFF relaie les essais ; le premier membre d'un essai | STORY-1112 | catalogue #70, #73 ; BFF #39, #43 ; auth #50 ; recette #30 |
| Cinq essais simultanés sur la même pile | STORY-1116 | recette #31 `8d4d88c` |

**Reste** : effacer le dossier de démonstration à la fin d'un essai (D-1082-10) → **STORY-1130** (n° 12) ; les modules ouverts
dans l'essai (ticket de 1116) → **STORY-1137** ; l'**export pendant `ESSAI_TERMINE`** (la route `instance` ci-dessus) et les
**journaux pseudonymisés** (AD-12 : `instance.journal` n'existe pas) → **STORY-1131** ; les jeux des verticales
(`jeu-demonstration@1`) et leurs routes C13 → **A, C, D** (EPIC-160) ; les écrans (compte à rebours, export) → **A**.

### EPIC-159 — le cabinet est installé par le moteur, son app lit l'état publié

| Livré | Story | PR, SHA |
|---|---|---|
| Le cabinet installé par le moteur dans la recette (balance, bilan) | STORY-1080 | catalogue #67, BFF #38, recette #27 |
| Les gardes de balance, bilan et fiscal décident sur l'état publié | STORY-918, 922 | (A, lot 1) |
| `module.referentiels` : la dernière raison de lire `entitlement.changed` pour `assurance` | STORY-1127 | catalogue #84 |

**Reste** : `conseil` dans `INSTALLATION_SERVICES`, FR-6 de `cabinet-moteur` sur `declarations`, recettes rejouées
(D-100-4) → **STORY-1129** ; l'app du cabinet lit l'état publié par la vraie route, types générés depuis
`contrat/etat-publie.openapi.json` (`features/modules`) → **A** ; et **le retrait de `entitlement.changed`** (ci-dessous).

### Ce qui reste avant de retirer `entitlement.changed` (EPIC-145, EPIC-159)

**Quatorze services le consomment encore** (relevé du 26/11, `origin/dev`) :

| Service | À qui | Lit aussi l'état publié ? | Ce qu'il lit encore dans `entitlement.changed` |
|---|---|---|---|
| `balance-service` | C | oui (la garde décide dessus, STORY-918) | `config`, `referentiels`, `versionCode` (résolveur de référentiel, ingestion) |
| `prospera-bilan-service` | D | oui (même patron) | `config`, `referentiels` (moteur du bilan, déclaration déposée) |
| `prospera-fiscal-service` | C et D | oui | `config`, `referentiels` avec `artifactUri` et `checksum` (rattachement du paquet) |
| `prospera-assurance-service` | D | oui, en double lecture (STORY-1006) | « la configuration du droit » (`config`), `referentiels` (palier ④) |
| `prospera-notification-service` | D | oui | `status`, `echeanceLe` (garde d'envoi, porte de la délégation, purge) |
| `prospera-paiement-service` | **B** | oui (STORY-937) | `config`, `status` (garde de paiement, porte de la délégation) |
| `dossier-service` | **B** | oui (STORY-913) | `config`, `status`, `echeanceLe` (droits d'usage, STORY-727) |
| `prospera-microfinance-service` | (sans propriétaire au lot 7) | **non** | tout (la garde le lit) |
| `ventes`, `terrain`, `recouvrement`, `pilotage`, `croissance`, `assureur-fictif` | D | **non** (« demain par l'état publié ») | `status`, `echeanceLe`, `terme`, `versionCode` (socle `etat-des-modules`) |

Avant le retrait : (1) **`module.interrupteurs` tenu** par la partie A, puisque `config` n'existe pas dans l'état publié
(sinon une version neuve 1.2.0 qui porte la configuration, à décider par STORY-1131) ; (2) chaque consommateur bascule chez
son propriétaire, double lecture d'abord, puis retrait (AD-24 : la garde partagée seule) — `referentiels` est servi depuis
1127 ; (3) le producteur du catalogue (`entitlements.service`, `octroi-par-abonnement`, `suspension-par-impaye`) ne
s'arrête qu'après le dernier consommateur ; le topic reste au registre (aucun `@2`). Côté B : `paiement` et
`dossier-service` (STORY-1131 ou STORY-1136, qui ouvre `paiement`). Les demandes à C et D sont au journal de B.

## Hors de cette story

- Le retrait des consommateurs de `entitlement.changed` (chez leurs propriétaires ; inventaire, EPIC-159) ; la route d'export
  du module `instance` (STORY-1131) ; le relais du BFF de `referentiels` (D-1127-8) ; tout écran (A).
