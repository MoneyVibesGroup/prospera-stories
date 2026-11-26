# STORY-1128 : Le contrat d'état publié figé (EPIC-142), et l'inventaire de ce qui reste dans EPIC-142 → 147 et 159

Status: in-progress — fiche écrite le 2026-11-26 par la session du groupe B juste avant de coder (lot 7, n° 10 de B,
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

## Hors de cette story

- Le retrait des consommateurs de `entitlement.changed` (chez leurs propriétaires ; inventaire, EPIC-159) ; la route d'export
  du module `instance` (STORY-1131) ; le relais du BFF de `referentiels` (D-1127-8) ; tout écran (A).
