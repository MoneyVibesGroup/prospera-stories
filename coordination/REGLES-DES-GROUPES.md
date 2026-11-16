# Les règles que suit chaque groupe

> **Date :** 2026-11-16 · **Demandé par :** l'utilisateur (Dev B)
> **Lu par :** les sessions des groupes A, B, C et D, et Dev A à son arrivée (04/12).
> **Rang :** ce fichier rassemble des règles. Il **ne remplace pas** `PLAN-4-SESSIONS-2026-11-14.md` : en cas d'écart,
> le plan fait foi, puis l'entrée du tracker, puis ce fichier. Les règles du plan sont reprises ici en bref, avec leur
> paragraphe ; celles qui n'y figurent pas viennent de défauts déjà payés, et chacune dit pourquoi elle existe.

---

## 1. Règles communes aux quatre groupes

### 1.1 Avant chaque story : le rituel (plan §0)

1. `git fetch` de `prospera-stories`, puis lire sur `origin/main` : le plan (il a pu être amendé), **les trois autres
   journaux** (ce qui vous est demandé passe avant votre story suivante) et le tableau des dépôts (plan §2).
2. Lire **l'entrée de la story dans `sprint-status.yaml`**, puis sa fiche. L'entrée du tracker porte des arbitrages du
   PO que la fiche n'a pas toujours reçus (titre différent, commentaire « arbitrage », « décision »). Si elles
   divergent, demander **avant** de coder.
   *Pourquoi : STORY-167 a été livrée selon la fiche alors que le tracker portait depuis un mois la décision contraire
   du PO.*
3. Pas de fiche : l'écrire juste avant de coder, avec un identifiant **de sa plage** (plan §1).
4. Lancer `git status` dans chaque dépôt qu'on va toucher. Des fichiers qu'on n'a pas écrits ⇒ une autre session
   travaille dans le même checkout : `ListAgents`, puis s'arrêter et le dire.
   *Pourquoi : le 15/11, deux sessions ont codé STORY-345 dans le même checkout et se sont écrasé les fichiers.*

### 1.2 Décider et enchaîner

- **Face à un choix, appliquer sa propre recommandation** et l'écrire (fiche ou journal) pour qu'elle reste
  contestable. On ne demande pas « je recommande X, tu valides ? ».
- Restent à l'utilisateur : les gestes irréversibles ou extérieurs que le plan lui réserve (créer un dépôt GitHub,
  changer ses réglages), la validation des maquettes et les questions au PO. Une question au PO s'écrit dans le journal
  **avec le choix retenu par défaut** ; on avance avec ce choix.
- **Une série de stories s'enchaîne sans s'arrêter** : story finie ⇒ poussée ⇒ PR fusionnée ⇒ journal à jour ⇒ story
  suivante. S'il manque quelque chose pour pousser (mesure, arbitrage), le dire **tout de suite** au lieu de continuer
  en silence.
- Une pause demandée par l'utilisateur s'écrit dans le journal (« ⏸️ pause après STORY-xxx ») et se respecte jusqu'à
  sa reprise.

### 1.3 Git et PR (plan §8)

- Une story = une branche `MNV-<n>` (ou `fe-<n>`, `AP-<n>`) partie d'`origin/dev` **à jour**. Dans `prospera-stories` :
  branche `docs-<n>` partie d'`origin/main`, **dans un worktree**, jamais dans le checkout partagé.
- Ordre : branche ⇒ code ⇒ preuves (§1.5) ⇒ push ⇒ `gh pr create --base dev` (`--base main` pour les docs) ⇒
  **fusion par soi-même en « Rebase and merge »** (`gh pr merge <n> --rebase`) ⇒ vérifier `merged = true`. Code
  d'abord, docs ensuite. Jamais de commit de fusion, jamais de squash.
- **Après chaque push sur une branche en PR**, relire la PR par l'API : elle doit être `open` **et** son `head.sha`
  doit être le SHA poussé. Sinon : branche neuve depuis la base, cherry-pick, nouvelle PR.
  *Pourquoi : deux fois, une PR a été fusionnée quelques secondes avant un push ; le commit poussé n'était plus dans
  aucune PR.*
- « Rebase and merge » **rejoue le commit sous un nouveau SHA**. Une référence écrite dans un autre dépôt (fiche,
  journal) pointe le commit **fusionné sur `dev`**, pas celui de la branche. Une branche empilée sur une branche
  fusionnée se rebase sur `origin/dev` avant d'être poussée.
- Jamais `git add -A` : on ajoute ses fichiers un par un. Le générateur de « barrels » de l'éditeur crée des
  `index.ts` non suivis : les supprimer avant `tsc`, avant un build d'image et avant chaque commit (repérage par
  `git ls-files --others --exclude-standard`, jamais par un `find -delete`).
- On ne réécrit jamais un historique déjà poussé sur `dev` ou `main`.

### 1.4 Le tracker et les journaux (plan §8, §9)

- Dans `sprint-status.yaml`, on ne modifie que **les entrées de ses stories** (et la marque haute au commit qui crée
  une fiche). Après tout rebase qui touche le tracker, même sans conflit :
  `python -c "import yaml,io; yaml.safe_load(io.open('sprint-status.yaml',encoding='utf-8'))"`, et refaire la somme
  des points de sprint sur le fichier résolu.
- Le statut `done` s'écrit dans la PR de docs, puisque la fusion du code a déjà eu lieu.
- Chaque groupe n'écrit que **son** journal, **dans la PR de docs de chaque story** : état, dépôts tenus, passations,
  demandes aux autres groupes, contrats annoncés, questions au PO, pièges. Le journal est **la mémoire du lot** : une
  session qui reprend après un résumé de contexte repart de lui.
- Une demande à un autre groupe : `→ B (date) : … — ouverte` dans son journal ; le destinataire répond dans **le sien**
  (`← A (date) : servie par PR #…`).
- Un défaut trouvé dans un dépôt qu'on ne tient pas devient un **ticket** (`tickets/TICKET-<BACKEND|OPS|FRONTEND>-<sujet>.md`)
  plus une ligne de demande. On ne le corrige jamais soi-même.

### 1.5 Les preuves

- Tests, lint et build verts **ne suffisent pas**. Dès qu'un module Nest, une dépendance ou un Dockerfile change :
  **`docker compose up` du service**, et le service doit démarrer.
  *Pourquoi : en septembre, plus de 5 700 tests verts, et ni paiement ni notification ne démarrait
  (`UnknownDependenciesException`, découvertes une par redémarrage).*
- Lire la ligne `Test Suites: … failed`, pas seulement le décompte des tests : une suite qui ne compile pas
  n'apparaît pas dans les tests en échec.
- Un test de mutation doit rougir **sur l'assertion**, pas sur une erreur de compilation : si la mutation rend un
  import inutile, retirer l'import aussi. Une valeur attendue s'écrit dans le test, jamais en relisant la constante
  testée.
- Un témoin « avant la correction » se fait par `git stash push -u`, puis `up --build --force-recreate`, en vérifiant
  dans l'image que le code neuf est absent. Un `git switch dev` emporte les modifications non commitées.
- **Une recette se joue sur des images reconstruites depuis `origin/dev`** après la fusion, avec des volumes neufs.
  Jamais « c'est identique à l'octet près » : on recette ce qui est livré.
- Une recette sur une pile neuve se joue d'un bout à l'autre. Une recette verte **ne mesure pas une latence** : une
  attente se chronomètre à part.

### 1.6 Docker

- **À la demande seulement** : pas pendant le code, les maquettes, les docs ou les PR. On le lève pour la preuve ou la
  recette, et on le descend à la fin de la story, avec ses volumes.
- Chaque groupe préfixe ses piles : `COMPOSE_PROJECT_NAME=grp-a`, `grp-b`, `grp-c`, `grp-d`.
- Une pile de recette publie des ports fixes (3001 → 3010, 27017, 6379, 9000). Avant de lever : `docker ps`. Deux
  groupes ne lèvent pas leur recette en même temps sur un même poste.
- Le `docker-compose.yml` racine n'est pas versionné : une dépendance de service se pose dans
  `prospera-recette/docker-compose.recette.yml`, par une demande à A.
- `docker compose down` ne rend pas la mémoire de la VM : `wsl --shutdown` le fait (poste Windows).

### 1.7 Fichiers et fins de ligne (poste Windows)

- `core.autocrlf=true` sort en CRLF les fichiers hachés (paquets de référentiels JSON, scripts `mongo/`, assets) :
  empreintes fausses, conteneur qui refuse ses référentiels ou ne démarre pas. Les supprimer puis
  `git -c core.autocrlf=false checkout -- <dossier>`. Une image de vérification se construit depuis
  `git -c core.autocrlf=false archive HEAD | tar -x`.
- Avant chaque commit : comparer `git diff --stat` et `git diff --stat --ignore-cr-at-eol`. S'ils diffèrent, les fins
  de ligne ont bougé et le diff est faux.
- Lint : ne linter que les fichiers touchés, avec `--rule '{"prettier/prettier":["error",{"endOfLine":"auto"}]}'`.
- **Un heredoc mange un niveau d'antislash** (expressions régulières, JSON, `package.json`) : écrire ces fichiers avec
  l'outil d'écriture ou un script Python, jamais par heredoc. Au-delà d'environ 180 lignes, un heredoc n'écrit rien.
- `python -c "…"` exécute les antiquotes du texte : mettre le script dans un fichier.
- Un script Python qui réécrit un fichier encode le contenu **avant** d'ouvrir le fichier en écriture : un `open(p,'w')`
  qui échoue ensuite l'a déjà vidé.
- Git Bash réécrit les chemins : `MSYS_NO_PATHCONV=1` devant un `docker exec … /opt/…` ; une liste de chemins séparés
  par `;` (`RECETTE_SURCOUCHES`) se passe depuis PowerShell.
- Chaque commande shell commence par `cd <chemin absolu> &&` : un `cd` d'un appel précédent déplace les suivants.

### 1.8 Contrats

- On ne renomme jamais un champ, une route ou un topic existant : on ajoute (facultatif), ou on publie un `@2`
  (AD-27).
- Tout changement visible des autres s'annonce dans le journal, section « ⚠ Contrats », **avant** la fusion.
- Les types d'une API se **génèrent** depuis son OpenAPI ; ils ne s'écrivent jamais à la main.
- Le neuf écrit `organisationId` ; l'existant garde sa graphie.
- Une copie « à l'octet » (manifeste, paquet fiscal, contrat) se recopie depuis le blob source
  (`git -c core.autocrlf=false show origin/main:<chemin> > <copie>`), jamais à la main. Un renommage en masse (`sed`)
  ne doit pas la toucher.

### 1.9 Pièges de code déjà payés, valables dans tous les services Nest

- `@Prop({ type: Types.ObjectId })` est rangé en `Mixed` par `@nestjs/mongoose` : écrire `SchemaTypes.ObjectId`.
- `@Prop` sur un champ typé par une union (`'A' | 'B'`) fait échouer le chargement du module : `type: String` avec un
  `enum`. `tsc` ne le voit pas, `docker compose up` si.
- Client Kafka de Confluent : il ne crée pas un topic en s'y abonnant, et ne voit un topic neuf qu'au rafraîchissement
  des métadonnées (5 min). Il faut **`admin.createTopics` avant `subscribe` et `metadataMaxAge: 10_000`** sur le
  consommateur (mesuré : 291 s ⇒ 6,9 s). C'est un binding natif : ses tests se jouent sous Node 24, dans l'étage
  `verification` du Dockerfile.
- BullMQ 6 refuse un identifiant de tâche qui contient `:` ; il n'a plus `queue.client` (santé par `getJobCounts`).
- Karapace répond 500 quelques secondes après son démarrage, même `healthy` : relancer.

---

## 2. Groupe A : fiscalité, plateforme, front du cabinet, relecture

| Règle | Détail |
|---|---|
| Dépôts tenus | fiscal, balance, bilan, dossier, kyc, BFF de la console, `prospera-recette` ; **le front du cabinet jusqu'à la fusion de FE-069** (amendement du 15/11), puis rendu à D par une ligne du journal |
| Plage | STORY-902 → 929 ; FE-112 → 125 pour les fiches écrites au tri du 15/11 |
| Paquet fiscal Togo | seul A le modifie : sources dans `balance-service/scripts/referentiels/sources/`, `node scripts/referentiels/build.mjs`, réépinglage, puis **copie à l'octet** dans `prospera-dossier-service` et dans `prospera-fiscal-service/test/fixtures/paquet-fiscal/` |
| `prospera-recette` | les autres groupes **lancent** la pile, A seul la modifie. La recette fait `up` sans `--build` : reconstruire à la main l'image du service modifié |
| Fiscal | `test:conformite` exige un MongoDB en jeu de répliques (`mongo/demarrer-mongo-fiscal.sh`, scripts en LF) ; suite unitaire avec `-w 2` (instable en parallèle complet) |
| Relecture | A relit les contrats de B **avant qu'ils soient figés**, sous 24 h, et relit à la fin **tout** ce qu'ont fusionné les quatre groupes (plan §3.4) ; il ne corrige rien hors de ses dépôts : chaque trou devient un ticket |
| Front du cabinet (FE-069) | les règles du groupe D (§5) s'appliquent à A tant qu'il tient ce dépôt |

## 3. Groupe B : le moteur

| Règle | Détail |
|---|---|
| Dépôts tenus | catalogue, paiement, `prospera-plateforme` (sauf les dossiers de C), notification et auth (reçus de A par passation) |
| Plage | STORY-930 → 979 |
| Contrat d'état publié | figé (étiquette `contrat-etat-publie-v1`) : **ajouts seulement**, tout ajout facultatif (compatibilité BACKWARD vérifiée au registre) |
| Annonces | tout contrat touché s'annonce dans « ⚠ Contrats » avant la fusion ; un renommage passe par un `@2` |
| Horloge | une décision d'état ne lit jamais `Date.now()` : elle part de `HorlogeDeReference` |
| Paiement | ses invariants mordent à juste titre (la garde ne lit aucune configuration ; seul le service des demandes écrit `$set: { etat }`) ; ses routes `@SurfacePlateforme()` rendent 404 avant la garde : éprouver une garde sur une route sans surface plateforme |
| Images | `.dockerignore` du catalogue et de paiement : l'étage `verification` a besoin de `test/` |
| Écrans | B n'écrit pas les écrans de la console : il écrit un ticket pour D |

## 4. Groupe C : l'assurance

| Règle | Détail |
|---|---|
| Dépôts tenus | assurance, `document-service` (ocr), sinistres, liaison-assureur, assureur-fictif ; dans `prospera-plateforme`, **seulement** `contrats/assurance/`, `champs-sensibles/` et `classification-sante/` |
| Plage | STORY-980 → 1029 |
| Backend seul | aucun écran tant que la coque `prospera-app` n'existe pas |
| `document-service` | le cabinet s'en sert : rejouer l'OCR et la recette de l'Atelier (STORY-100) **avant** de fusionner |
| Données de santé | un champ de santé ajouté à un schéma d'événement doit faire échouer la CI |
| Compagnie | jamais nommée : on parle de « la compagnie » ; la démo tourne contre la compagnie fictive, à graine fixe |
| Source de l'annexe C | `prds/prd-assurance-2026-11-13/prd.md`, version corrigée |
| Droits | C déclare les droits de ses modules dans leurs manifestes et les vérifie par la garde ; un droit fait au plus 40 caractères (borne du jeton) |

## 5. Groupe D : le frontend (app du cabinet et console)

| Règle | Détail |
|---|---|
| Dépôts tenus | la console (`frontend-admin-panel`) ; le front du cabinet **après** la fusion de FE-069 ; dans `prospera-stories`, `prototypes/` et `frontend-sprint-status.yaml` |
| Plage | FE-126 → 139, AP-38 → 49 |
| **Maquette d'abord** | aucun écran neuf n'est codé avant que sa maquette soit ajoutée à `prototypes/prospera-prototype.html`, republiée sur son Artifact (relister l'Artifact avant **et** après : l'adresse dépend du compte) et **validée par l'utilisateur**. Les chiffres d'une maquette sont générés depuis le référentiel et vérifiés ; on rend l'écran et on le **regarde** |
| **Vrai backend** | une story n'est finie qu'au contact du vrai backend (Integration Gate en fin d'épic) : aucun contrat supposé, aucun mock restant sur le périmètre |
| Types | régénérés depuis l'OpenAPI des services **vivants** de `dev` (`npm run gen:api`) ; `gen:api`, `tsc`, lint et build verts ne prouvent pas qu'une route existe (le front se type sur les schémas, pas sur les chemins) : un appel réel le prouve |
| Navigateur | l'app cliente se sert sur **:3100** (:3000 est le service expert-comptable). Le CORS ne se voit qu'en navigateur : un `curl` à 200 ne prouve rien |
| Backend | D ne corrige **jamais** un backend : ticket au groupe qui tient le dépôt, plus une ligne dans son journal |
| Vitest | lancer depuis un chemin dont le lecteur est en **majuscule** (`C:\…`) : avec `c:\…`, « failed to find the runner » sur tout `src/features` ; la suite unitaire est instable en parallèle (timeouts `userEvent`) : relancer le fichier seul avant de conclure |
| Numérotation | plate (`FE-0XX`), jamais lettrée ; un identifiant se réserve au maximum vu **sur toutes les branches**, et la réservation reste visible |
| TanStack | une `queryFn` qui résout `undefined` met la requête en erreur |

---

## 6. Ce que chaque session écrit, et nulle part ailleurs

| Fichier | Qui écrit |
|---|---|
| `coordination/journal-groupe-<X>.md` | le groupe X seul |
| ses fiches `stories/STORY-<n>.md`, `frontend-stories/FE-<n>.md` | le groupe qui tient la plage |
| `sprint-status.yaml`, `frontend-sprint-status.yaml` | chacun **les entrées de ses stories** |
| `tickets/TICKET-*.md` | le groupe qui constate le défaut |
| `PLAN-4-SESSIONS-2026-11-14.md`, ce fichier | par une PR demandée par l'utilisateur |
