# Journal du groupe A (poste principal)

> Écrit par le groupe A seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §3 (terminé). **Lot 2 :**
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2 (STORY-905 → 919), **terminé le 2026-11-16**. **Lot 3 :** `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 (STORY-920 → 929), **terminé le 2026-11-17**. **Lot 4 :** `PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §2 — FE-069 ✅ (18/11), puis FE-034 et AP-38.

## État

### Lot 4 (ordre validé le 2026-11-18) — en attente du plan

- **Réponses de l'utilisateur (2026-11-18)** à l'analyse des journaux des lots 1 à 3 :
  1. **Ordre du lot 4 de A, validé** : STORY-1080 d'abord, puis les demandes ouvertes de B et de D (ci-dessous).
     Identifiants réservés au tracker : **STORY-1080 → 1082** (au-delà de la plage de D, 1030 → 1079).
  2. **FE-069** : l'utilisateur s'en charge (porteur, date). A n'y touche pas sans consigne.
  3. **D-923-1 renversée** : le relais BFF `PATCH /dossiers/{id}` s'ouvre au **collaborateur**, comme le plan du
     lot 3 le disait ⇒ **STORY-1081**.
  4. **D-928-3 remplacée** : le dossier de démonstration se crée dans `dossier-service`, par une route appelable par le
     moteur ⇒ **STORY-1082** (ferme le ticket `dossier-de-demonstration-sans-creation-par-le-moteur`).
  5. **Confirmés** : D-926-2 (balances anciennes `NON_ENREGISTREE`, sans migration), D-926-6 (route de provenance
     sous `/balance/`), STORY-300 (tout membre du cabinet lit le fichier déposé).
  6. **Gestes réservés, vérifiés le 2026-11-18** : « Rebase and merge » seul sur les 32 dépôts dont le compte voit les
     réglages (dont `prospera-plateforme`, `reseau-service`, les cinq du distributeur, `centrale-service`,
     `agent-instance`, `prospera-comptabilite-service`, les trois de C). Réglage invisible (compte en lecture seule) :
     `prospera-frontend-admin-panel` (ancien ; la console vit dans `frontend-admin-panel`), `prospera-platform-config`,
     `prospera-infra`, `moneyvibeswebsite`. **Node 24 toujours absent du poste principal** (nvm : 25.2.1 seule ;
     Laragon : 22) : les `*.module.spec.ts` restent rouges en local (`bindings`).
- **Ordre du lot 4 de A** (identifiants des points 4 et 5 : au plan du lot 4) :
  1. **STORY-1080** : les six routes `…/verifications/…` de balance et de bilan (`verification-installation@1`) ;
     `INSTALLATION_SERVICES` au catalogue de la recette ; `cabinet-moteur` installe par `POST /installations` (le
     test D-929-1 s'inverse) ; ensuite seulement, D peut retirer le `PUT` de la console.
  2. **STORY-1081** : relais BFF ouvert au collaborateur ; au rituel, vérifier le 409 de version muet (D12) côté
     `dossier-service`.
  3. **STORY-1082** : création du dossier de démonstration par le moteur (identité `MOTEUR`, espace d'essai) ; l'import
     C13 de balance le résout au lieu de le dériver ; la balance validée de la démo arrive à bilan.
  4. **Demandes de B** : (a) `comptabilite-service` dans le défaut d'`INGESTION_SOURCE_SYSTEMS` de balance (absent de
     `dev` `98078b0`, vérifié le 18/11) ; (b) la comptabilité dans la recette (audience de l'IdP, service au compose) ;
     (c) relecture de `kit-cible` 1.0.1 (D4 → D8 restent ouverts) ; (d) client admin Kafka gardé dans `/health` et
     `renouveler()` sans attendre la fermeture (balance, bilan, fiscal, dossier, kyc).
  5. **Demande de D** : la recette de la démo assurance dans `prospera-recette`, quand C aura le parcours
     `SIN-2026-9002`.

- **2026-11-18 (suite)** : **Node 24 installé** sur le poste principal (nvm, `24.22.3`, à côté de `25.2.1` qui reste
  active : `nvm use 24.22.3` pour basculer, ou `C:\Users\thier\CONFIG~1\herd\bin\nvm\v24.22.3\node.exe` pour une
  suite). **Point 6** : le texte de la loi 2011-018 et l'avis du fiscaliste ne viendront pas de sitôt ; on avance
  sans (D-901-5 et les lectures de 568 restent telles qu'appliquées). Réponses de l'utilisateur aux questions de B, C
  et D : « Demandes aux autres groupes » ; STORY-973, 974 (B), 1015 → 1017 (C) et 1060 (D) réservées au tracker.

- **2026-11-18 (services du cabinet)** : sur demande de l'utilisateur, **PRD court** `prds/prd-services-cabinet-2026-11-18/`
  (financement bancaire, archives du client, missions et facturation, paie ; FR-1 → FR-25 ; relu, corrigé) et **épics**
  `epics-services-cabinet-2026-11-18.md` : EPIC-266 → 269, **cinq lots de quatre** (F1, F2, G1, M1, P1) :
  STORY-1083 → 1092, écrans FE-140 → 145, console AP-50 → 53. **Consigne de l'utilisateur : les lots sont désormais de
  quatre stories.** Le lot 4 de A (1080, 1081, 1082 + l'habilitation de `comptabilite-service` demandée par B) en fait
  quatre. ⚠️ La paie entre dans Prospera (renverse FR-F28, D-SC-10). Gestes réservés : créer
  `prospera-cabinet-service` et `prospera-paie-service` avant M1 et P1.

### Lot 4 (proposé le 2026-11-18) — `PLAN-4-SESSIONS-LOT-4-2026-11-18.md`

- **Consigne de l'utilisateur (18/11)** : le backend de A (1080 → 1084, 1093) est fait par **B, sur l'autre poste** ;
  A, avec l'utilisateur, fait les **écrans** : FE-069 (en cours, tenue par l'utilisateur), puis **FE-034** et **AP-38**
  (console tenue par A pour ce lot). L'ordre de lot 4 écrit plus bas (« Lot 4 (ordre validé le 2026-11-18) ») est
  **remplacé** par ce plan : ses stories passent à B.
- **Passation à B (D-L4-1), à la fusion du plan** : balance, bilan, dossier, `admin-panel-service` (BFF),
  `prospera-recette`. Derniers commits sur `dev` : balance `98078b0`, bilan `1651d33`, dossier `768a4aa`, BFF `18a9893`,
  recette `f7944dc` (vérifiés le 18/11). **B lit d'abord « Pièges rencontrés » ci-dessous.**
- **2026-11-18 (après-midi) — consigne de l'utilisateur** : « on débute par FE-069, celui qui refait tout ce qui est
  cassé au niveau du cabinet » ; maquettes de FE-034 et d'AP-38 arrêtées (rien de commité, worktrees retirés). Docker
  pris en exclusivité le temps de régénérer les types, puis rendu à C ; le code du front s'est fait sans Docker ; le
  verrou a été repris à C (fin de sa vérification de 1015) pour le seul gate final, puis rendu.
- ~~1. **FE-069**~~ ✅ **DONE (2026-11-18)** — prospera-frontend-expert-comptable **#54** (dev `6796601`). Types
  régénérés depuis origin/dev du 18/11 ; A1 → A13 et B1 → B25 traités ; tsc 65 → 0 ; Vitest 148 fichiers ; e2e simulés
  verts (7 rouges sur dev corrigés, 1 instable) ; **gate sur la vraie pile vert** (`npm run e2e:gate`, étanchéité A/B sur
  les quatre services, CORS, collaborateur). Restes nommés dans la fiche : migration STORY-356 sur données anciennes,
  AC-8 clavier, relecture des réserves de FE-059 → 068.
- **Suite du lot** : ~~FE-034 maquette~~ ✅ **validée par l'utilisateur le 2026-11-19** (prospera-stories #703 ; prototype cabinet
  réaligné sur TOUT le livré en cinq passes, version 17 ; décisions de A : Ets Kossi au régime réel partout, écart du TFT
  905 000 gardé, paquet `syscohada-revise@2.3`). **Code de FE-034 non lancé** (consigne de l'utilisateur). Puis AP-38
  (maquette console à valider).
- **2026-11-19 — consigne de l'utilisateur** : code de FE-034 lancé (sous-session, sans Docker d'abord) ; pour la
  console, « tout tester comme FE-069 avant d'ajouter AP-38 » ⇒ **AP-54** (gate de la console) créée et lancée ; AP-38
  (maquette arrêtée avant toute écriture) reprendra après AP-54.
- **Ticket ouvert pour le groupe qui tient bilan-service** : `tickets/TICKET-BACKEND-projection-remboursements-non-plafonnes.md`.
- ⏰ **À REPRENDRE EN FIN DE CHANTIER (consigne de l'utilisateur, 2026-11-19)** : `revue-ux-prototype-cabinet-2026-11-19.md`.
  Le prototype est utilisable sur le fond, mais pas facile : trop d'écrit, notes de conception mêlées à l'écran, jargon
  technique, 13 onglets dans l'Atelier. Recommandations : interrupteur « Notes de conception », passe « langage métier »,
  tableau de bord « à faire », onglets regroupés, test avec de vrais experts-comptables. Aucune story créée à ce stade.
- **FE-146 créée (2026-11-18, demande de l'utilisateur)** : le message de l'Atelier pendant la propagation des axes (409 SYSTEME_COMPTABLE_INDETERMINE juste après la décision). Front seul, 3 pts, quatrième story du lot 4 de A, après AP-38.
- **Comptabilité propre et export des clients (2026-11-18, demande de l'utilisateur)** : STORY-1094 (plan propre du
  cabinet), 1095 (plan propre d'un client), 1096 (import du plan comptable de Sage 100) dans `comptabilite-service`
  (tenu par B) ; écrans FE-147 (exporter la liste des clients, CSV ou Excel) et FE-148 (plan propre à l'écran). Règle
  retenue : un compte propre est une subdivision d'une racine du référentiel, pour que la liasse reste juste.
  Toutes non slottées : à placer au prochain plan.
- **Des factures aux écritures (2026-11-18, demande de l'utilisateur)** : STORY-1097 (facture → écriture proposée en
  partie double, achats et ventes, système normal), 1098 (mémoire des choix du cabinet pour les écritures), 1099
  (mémoire des choix pour les cahiers) ; écrans FE-149 (factures en écritures) et FE-150 (suggestions reprises).
  Jamais d'écriture sans relecture ; la proposition dit toujours sa source. Non slottées.
- **Cloisonnement par cabinet et archives (2026-11-18, demande de l'utilisateur)** : STORY-1097 → 1099 et FE-150
  amendées. Toute mémoire appartient au cabinet ; le même client suivi par deux cabinets ne partage rien (test à deux
  cabinets obligatoire). STORY-1100 (document-service, ged) : la mémoire de classement des archives, et les factures
  comptabilisées versées au fonds du client ; écran FE-151. Non slottées.
- **Passation** : `prospera-frontend-expert-comptable` reste tenu par A pour le lot 4 (FE-034) ; dernier commit sur
  `dev` : `6796601`.

### Lot 3 (depuis le 2026-11-17) — l'état courant

- ✅ **LOT 3 DE A TERMINÉ (2026-11-17) — en attente du plan suivant.** 920 → 929 : dix stories, toutes DONE le jour même.
- ~~10. **STORY-929**~~ ✅ **DONE (2026-11-17)** — prospera-recette **#25** (dev `f7944dc`). **Recette croisée complète, jouée une fois sur pile neuve : 10 suites sur 10, 134 tests sur 134, 1 044 s** (`grp-a`, volumes neufs, `RECETTE_ESPACE=ESSAI`, images des onze services construites depuis `origin/dev` par `git archive`, fiscal en surcouche, `down -v` ensuite : plus rien de `grp-a`, verrou rendu) ; **3 essais avant** (deux assertions fausses de ma recette, puis deux `ECONNRESET` sur un poste à 691 Mo libres, remède : `docker desktop restart`). **D-929-1 (b)** : le cabinet **reste installé par le `PUT`** de la console : `POST /installations` exige que chaque vérification du manifeste réponde VERT, et ni balance ni bilan ne servent leurs six routes `…/verifications/…` ; ce sont de petites routes chez A mais une story de service, que la règle de légèreté interdit ici. Rien n'est bloqué chez B. La recette **éprouve** le moteur : `POST /installations` de `conseil` s'arrête `EN_ATTENTE`, première vérification `NON_EXECUTEE`, module fermé (ce test s'inverse quand les routes existent). Ticket `verifications-de-balance-et-de-bilan-non-servies`, **story nommée STORY-1080** (id proposé, max réservé 1079). **Parcours ajoutés à `cabinet-moteur`** : complétude du dossier (924) ; relais BFF `PATCH /dossiers/{id}` **contre le vrai `dossier-service`** (succès, puis `409 CONFLIT_CONCURRENT` relayé, `message` = le code, rien d'écrit) (923) ; C13 (928) dans l'espace d'essai : jeton du moteur d'`auth-service`, import de `cabinet-demo-togo` (`IMPORTE`, rejeu `DEJA_IMPORTE`, utilisateur 403, sans jeton 401, `bilan` 422 `OBJET_INCONNU`), effacement `EFFACE` puis `DEJA_EFFACE` sur balance et bilan ; l'habilitation de référentiel vient de l'installation (le `PUT` pose le référentiel), rien posé à la main. **D-929-2** : l'espace est un réglage de la pile, `RECETTE_ESPACE` (défaut `REEL`), posé sur **tous** les services qui lisent l'état publié (catalogue, notification, paiement, balance, bilan, dossier, fiscal), pas sur balance et bilan seuls : un service ne lit que le topic de son espace. **D-929-3** : images construites depuis des extractions `git archive origin/dev`, pas depuis les checkouts (ils sont sur d'autres branches et appartiennent à d'autres sessions). Fiche : `stories/STORY-929.md`.
- **Bilan du lot 3 de A (920 → 929)** — *Livré* : MinIO à la norme (920) ; 5e origine `comptabilite` du hub (921) ; code mort de la double lecture retiré (922) ; relais BFF `PATCH /dossiers/{id}` (923) ; complétude du dossier (924) ; référentiel effectif par dossier, déclaré (925) ; provenance de chaque ligne de balance, FE-075 débloquée (926) ; jeu `cabinet-demo-togo` (927) ; routes C13 d'import et d'effacement (928) ; clôture et recette complète 134/134 (929). *Ouvert* : (1) **STORY-1080**, les six routes de vérification de balance et de bilan (puis `PUT` hors de la recette) ; (2) le **dossier de démonstration** n'existe que dans balance (ticket `dossier-de-demonstration-sans-creation-par-le-moteur`) : valider la balance de démonstration et la voir dans bilan reste à faire ; (3) `refuseeEnLectureSeule` sans appelant (dette 922) ; (4) relais BFF de la complétude, à la demande de l'écran (924) ; (5) la console doit migrer vers les routes d'installation (lot de D) ; (6) `ajv` 8 au premier niveau du lock (928). *Décisions contestables à rappeler au PO* : **D-923-1** (relais BFF réservé à `TENANT_ADMIN`, un collaborateur simple a 403 tant que D12 n'a pas son 409 muet) et **D-923-2** (refus relayés par code seulement, liste fermée de 11, jamais le texte amont) ; **D-924-1** (`dirigeants` bloquant seulement si la forme juridique en exige un) ; **D-925-1** (`referentielComptable` déduite du paquet servi, `SN`/`SMT` ⇒ SYSCOHADA) ; **D-926-2** (balances déjà stockées : `NON_ENREGISTREE`, pas de migration) et **D-926-6** (route sous `/balance/`, pas `/balances/`) ; **D-927-3** (le jeu suit les formats des services, pas un format neuf) ; **D-928-3** (dossier de démonstration dérivé et projeté dans balance seul) ; **D-929-1** (le `PUT` reste) et **D-929-2** (espace de la pile en un réglage ; `ESSAI` pour toute la pile de la recette de démonstration, jamais par défaut).
- **→ B (2026-11-17) : rien à changer chez toi pour 929.** Le moteur fait ce qu'il doit : un plan refuse d'ouvrir un module dont les vérifications ne répondent pas, et la recette le prouve. Information : le catalogue de la recette n'a pas `INSTALLATION_SERVICES` (voulu : sinon le `PUT` n'est plus « différé » et échoue) ; il devra le recevoir au moment de STORY-1080. — information.
- **→ D (2026-11-17) : la console ne doit pas retirer le `PUT` des droits avant STORY-1080** (installation par le moteur impossible pour balance et bilan sans les vérifications). — information.
- **Pièges (929)** : (1) `INSTANCE_ESPACE=ESSAI` sur balance et bilan seuls casse l'état publié (topic de l'espace) : poser l'espace sur tout ce qui garde. (2) Onze `npm ci` en parallèle ont fait tomber le moteur Docker (500 sur toute l'API) : `COMPOSE_PARALLEL_LIMIT=2`, puis `docker desktop restart`. (3) `ECONNRESET` sur `localhost` à 691 Mo libres : les services sont `healthy`, le poste est saturé ; rendre la mémoire avant la recette de preuve. (4) Les étapes `VERIFIER` qui suivent la première en échec restent `A_FAIRE`. (5) Le `message` d'un refus relayé par le BFF est le code, pas un texte absent. (6) Un heredoc de plus de 150 lignes a échoué en bloc : outil d'écriture.
- **Pour la suite** : à l'arrivée de Dev A (04/12) ou au plan suivant, STORY-1080 en premier (elle débloque la mise en service par le moteur) ; la recette est prête (RECETTE_ESPACE, garde du profil, test D-929-1 à inverser).
- ~~9. **STORY-928**~~ ✅ **DONE (2026-11-17)** — balance #156 (dev `98078b0`), bilan #179 (dev `1651d33`). Les routes C13 d'import et d'effacement des deux services, aux corps exacts de `contrats/instance/` (`contrats-instance-v1`, copies à l'octet gardées par empreinte, validées par `ajv ^8.20.0`). **Garde** : identité de service `MOTEUR` seule (jeton d'`auth-service`, STORY-948, limité à l'organisation du chemin ; un jeton de service n'ouvre aucune autre route) ; **espace d'essai seulement** (`INSTANCE_ESPACE=ESSAI`, sinon 403 `ESPACE_REEL_REFUSE`) ; import limité à `JEU_DEMONSTRATION`, effacement au motif `FIN_ESSAI`. **balance** importe `profil-societe` puis `balance` (BROUILLON, par `submitInSession`, le chemin unique du hub) ; **bilan** n'a aucun objet (tout objet 422 `OBJET_INCONNU`). **Effacement complet** par un plan de 40 (balance) et 22 (bilan) collections, gardé par un test qui lit les schémas réels ; `audit_events` effacée, copies d'identité effacées si l'organisation est leur seule appartenance ; idempotent (`EFFACE` puis `DEJA_EFFACE`, même date). **Dossier de démonstration** : `dossierId` dérivé (sha256) et projeté dans balance seul faute de création appelable dans `dossier-service` (D-928-3, ticket `dossier-de-demonstration-sans-creation-par-le-moteur`). Tests : 19 e2e par service, mutations rouges, **preuve Docker `grp-a` de bout en bout verte (29 contrôles)**. **D-918-4 soldée pour l'import et l'effacement** (restent `verifications/…`, `sante`, `export`, `migrer`). **Suite : STORY-929.**
- **Pour STORY-929** (fiche 928, « Pour STORY-929 ») : (1) les `verifications/…` des manifestes de balance et de bilan ne sont pas servies : la recette `cabinet-moteur` ne peut pas passer à `POST /installations` sans elles, à vérifier au rituel ; (2) `INSTANCE_ESPACE=ESSAI` à poser sur balance et bilan dans la recette, sinon 403 ; (3) jeton du moteur par `POST /api/v1/interne/jetons-de-service` ; (4) l'import de `balance` exige l'habilitation de référentiel (`orgbalanceentitlements`).
- **Pièges (928)** : (1) **`ajv` 8 remplace la 6 au premier niveau du lock** (eslint et webpack gardent la leur imbriquée) : prévoir ce remous au prochain `npm install`. (2) Trois invariants existants lisent tout `src/` : `lecture-profil-par-dossier` (allowlist du profil, 5 → 7), `axes-lecture-unique` (une variable nommée `profil` lue en `.systemeComptable` rougit : la renommer), `dossier-scope.invariant` (le `@Controller` doit porter un chemin LITTÉRAL, pas un gabarit ; compte de contrôleurs de bilan 27 → 28). (3) `Schema.get('collection')` ne rend rien pour un schéma sans `collection` explicite : le nom par défaut est `mongoose.pluralize()(NomDeLaClasse)` (`orgkycstatuses`, `orgbalanceentitlements`). (4) Un `@Prop({ type: Types.ObjectId })` peut ranger une chaîne : le filtre d'effacement cherche l'identifiant sous les DEUX formes. (5) Preuve Docker : un `mongosh --eval` passé par `docker exec` sous Windows perd ses guillemets : `execFileSync('docker', [..., 'sh', '-c', 'mongosh --quiet <base> --eval "$(cat)"'], { input })` ; un témoin laissé par une preuve précédente (index unique de `balances`) fait échouer la suivante : le nettoyer au début. (6) Le compose racine + la surcouche de recette ne posent pas `INSTANCE_ESPACE` : surcouche temporaire hors dépôt pour la preuve. (7) Un `jest` complet lancé avec un `( … ) &` dans la même commande ne laisse aucune sortie : le lancer seul, en arrière-plan de l'outil.
- ~~8. **STORY-927**~~ ✅ **DONE (2026-11-17)** — plateforme #25 (dev `e958bd6`), **données seules** : `jeux-demonstration/cabinet-demo-togo/` (`cabinet-demo-togo@1.0.0`, verticale `CABINET`, graine `20270115`). Une part, le module `balance` : `profil-societe` (1 enregistrement, client fictif « DÉMO NÉGOCE TOGO SARL », NIF/RCCM/CNSS préfixés `DEMO`) puis `balance` (2 enregistrements : exercices 2024 et 2025, 36 lignes chacun, quatre colonnes, équilibrées, sceau v2 de balance-service, ouverture 2025 = clôture 2024 après affectation). `generateur/generer.mjs` (sans dépendance) : même graine, mêmes octets. `npm run jeu:verifier` conforme (3 enregistrements), aussi depuis un `git archive` sans conversion ; jeu témoin de B toujours conforme ; aucun script, contrat, README ni `package.json` de B touché. **`bilan` hors jeu** (D-927-1) : il ne stocke rien à importer, ses états se calculent de la balance validée ; fiscal, consolidation, conseil, ged… sans route C13 en février (`SANS_ROUTE`). Docker non requis. **Suite : STORY-928.**
- **Pour STORY-928** (fiche 927, « Pour STORY-928 ») : importer `profil-societe` avant `balance` ; **`dossierRef` → `dossierId`** à résoudre par l'import (le jeu ne porte aucun identifiant de dossier ; si `dossier-service` n'a pas de création appelable par le moteur, ticket) ; la balance importée est un `balance.submitted` (checksum inchangé), à l'état `BROUILLON` : la démonstration la valide pour que le bilan la reçoive ; la route d'import de `bilan` n'a aucun objet ; l'effacement efface tout, `DEJA_EFFACE` au rejeu.
- **Pièges (927)** : (1) **un nombre de compte n'est pas une classe** : `compte >= 600` prenait `2844` (amortissements) pour une charge, le report à nouveau de 2025 perdait les amortissements et la banque d'ouverture devenait négative ; la classe est le premier chiffre. (2) **Un worktree n'a pas de `node_modules`** : une jonction vers le checkout principal suffit pour `jeu:verifier` (Ajv) mais casse les espaces de travail `@prospera/*` (`npm test` racine rougit en `Cannot find package '@prospera/garde-etat-publie'`) : artefact de la jonction, hors sujet (le dossier n'est pas ramassé par les scripts racines) ; la jonction n'est pas versionnée. (3) Le générateur de barrels de l'éditeur a réécrit `bibliotheques/kit-cible/src/index.ts` et `paquets/point-de-decision/src/index.ts` dans le worktree : `git checkout --` avant le commit, jamais `git add -A`. (4) Il n'existe aucun schéma d'objet pour balance ni bilan (`contrats/objets/` vide, `objetsDeReprise: []`) : le format du jeu est celui des services, écrit dans la fiche (D-927-3). (5) Les sorties de `node` relatives à `/tmp` de Git Bash partent dans `C:	mp` : passer des chemins absolus Windows (`C:/…`) aux scripts Node.
- ~~7. **STORY-926**~~ ✅ **DONE (2026-11-17)** — balance #155 (dev `6df0ce6`). Chaque ligne de balance servie porte **`provenance`** (`CAHIERS` | `FICHIER` | `DIRECTE` | `DERIVEE` | `NON_ENREGISTREE`), dérivée à la lecture de la balance (hors sceau, aucun checksum ne bouge) ; marqueur interne `Balance.adaptateur` posé par le chemin cahiers (le seul qui écrivait `source: ocr` sans rien d'autre) ; route **`GET /dossiers/{id}/balance/{balanceId}/lignes/{compte}/provenance`** : transactions des cahiers du compte (même ventilation rejouée), `pieceId`/`lotId`, totaux, **écart signé** avec la ligne, `409 PROVENANCE_NON_OUVRABLE` / `404`. Balances anciennes : `NON_ENREGISTREE` (valeur nommée, pas de migration : D-926-2). Relu d'abord : STORY-391/392 livrées depuis août ; le ticket ne manquait que la nature de la provenance et la route. e2e agregation 41/41, openapi 223/223, 22 unitaires neufs, mutations rouges x3 sur l'assertion. **Docker non requis** (verrou non pris). Contrat annoncé avant la fusion (#607). Ticket `ligne-de-balance-sans-provenance` **fermé**. **Suite : STORY-927.**
- **→ D (2026-11-17) : FE-075 débloquée par STORY-926 (balance #155, dev `6df0ce6`).** Le contrat existe : `provenance` sur chaque ligne de `GET …/balances/{id}` (enum `ProvenanceLigne`, facultatif ; `NON_ENREGISTREE` ≠ « aucune pièce » : l'écran nomme la raison, il n'ouvre pas de tiroir vide) et `GET /dossiers/{dossierId}/balance/{id}/lignes/{compte}/provenance` pour la balance `CAHIERS` (lignes avec `pieceId`/`lotId` ; ouvrir l'image par `GET /dossiers/{id}/pieces?pieceId=…`, STORY-392 ; `ecart` signé à afficher face au solde, jamais absorbé). Types : `npm run gen:api` depuis balance-service (:3007). ⚠️ Le BFF ne relaie pas ces routes à ce jour (relais à nommer par A si l'écran en a besoin). Je n'ai pas modifié la fiche FE-075 ni le tracker frontend (propriété de D) : la mention `blocked` et la dépendance au ticket sont à lever par D au réancrage (le DoD de la fiche demande de réancrer sur l'OpenAPI vivant). — information.
- **Pièges (926)** : (1) relire le code AVANT la fiche, encore : l'amont (391/392) était livré, et la vraie lacune était que le chemin cahiers n'enregistre pas sa nature (`source: ocr` ambigu), donc impossible à reconstituer pour l'ancien. (2) Le préfixe d'un contrôleur ne se surcharge pas : une route sous `/balances/` demandait un contrôleur neuf déclaré au module (donc Docker) ; placée sous `/balance/` dans `AgregationController` (D-926-6). (3) Les fichiers sont mélangés LF/CRLF (`git diff --stat` identique avec et sans `--ignore-cr-at-eol`) : scripts de remplacement qui détectent et restituent la fin de ligne ; le lint `--fix` avec `endOfLine: auto` reformate sans changer les fins de ligne. (4) `/tmp` de Git Bash n'est pas celui du Python de Windows : passer les chemins en argument. (5) Les `*.module.spec.ts` échouent en `Cannot find module 'bindings'` sous Node v25 (préexistant, prouvé en mettant la story de côté). (6) Un long heredoc avec apostrophes échoue en bloc : écrire le script avec l'outil d'écriture.
- ~~6. **STORY-925**~~ ✅ **DONE (2026-11-17)** — balance #154 (dev `055b423`). `GET /api/v1/dossiers/{dossierId}/referentiels/actifs` rend désormais **`dossierId`** et **`referentielComptable`** (`SYSCOHADA` | `SFD-BCEAO` | `CIMA`, déduite du paquet servi ; `SN`/`SMT` ⇒ SYSCOHADA) : ajouts seuls. La route était **déjà par dossier depuis STORY-422** (versions, empreinte, tampon, paquet fiscal) et 906 y avait mis `tag` : le ticket (19/08) était périmé sur l'essentiel ; le reste était la portée déclarée. e2e : deux dossiers d'un même cabinet (SN / SFD-BCEAO) ⇒ paquets et familles différents, archivé lisible, autre cabinet et inconnu 404, sans cadre ⇒ 409 nommé, formes d'origine intactes. Mutations rouges ×2 sur l'assertion. e2e referentiel + openapi-contract 275/275, unitaires referentiel 470/470, tsc et lint propres. **Docker non requis** (verrou non pris). Contrat annoncé avant la fusion (#602). Ticket `referentiel-effectif-non-resolu-par-dossier` **fermé**. **Suite : STORY-926.**
- **→ D (2026-11-17) : FE-061 peut afficher les versions du référentiel du dossier** : `GET /api/v1/dossiers/{id}/referentiels/actifs` est servie par balance-service (:3007) ; le BFF ne la relaie pas à ce jour (à vérifier côté écran, relais à nommer par A si besoin). Champs : `referentiel {code, version}`, `checksum`, `stamp`, `libelle`, `planCount`, `fiscal`, `tag`, et neufs `dossierId` (à comparer au dossier ouvert) et `referentielComptable`. Types : `npm run gen:api`. ⚠️ `referentielComptable` de cette route (paquet réellement servi) peut différer de celui de `GET /dossiers/{id}` (dérivé du seul `typeEntite`) quand le dossier porte une décision d'axes explicite : l'écran affiche celui de la route des versions, c'est ce qui valide les comptes. — information.
- **Pièges (925)** : (1) relire le code AVANT la fiche : un ticket d'août décrivait une route déjà déplacée par 422 ; la story s'est réduite à deux champs. (2) Un test unitaire qui compare le corps entier (`toEqual`) rougit sur tout ajout : réaligner l'attendu en dur, jamais en relisant la constante. (3) Les fichiers de test sont en LF et les sources en CRLF selon les cas : écrire les scripts de remplacement en lisant `
` dans le fichier ; `git diff --stat` avec et sans `--ignore-cr-at-eol` identiques. (4) Une mutation qui casse la compilation donne « 0 test » : viser une valeur, pas un identifiant.
- ~~5. **STORY-924**~~ ✅ **DONE (2026-11-17)** — dossier-service #55 (dev `768a4aa`). `GET /api/v1/dossiers/{id}/completude` (tout membre dans la portée ; 404 hors portée ; archivé lisible ; lecture pure). Bloquants/optionnels de STORY-079 (`nif` devient `nifSociete`), `dirigeants` bloquant seulement si la forme l'exige (D-924-1). Unitaires 49/49, e2e 157/157, deux mutations rouges sur l'assertion, lint propre. Docker non requis (une route de plus, rien d'autre). Ticket « trois surfaces » **fermé**. Contrat annoncé avant la fusion (PR docs #598). **Suite : STORY-925.**
- **→ D (2026-11-17) : la complétude du dossier est servie par `dossier-service`, mais le BFF ne la relaie pas encore.** L'onglet de la fiche dossier ne peut pas l'appeler depuis la console avant une story de relais BFF en lecture (modèle : STORY-923). Champs rendus : identifiants machine (`nifSociete`, `rccm`, `dirigeants`…), c'est l'écran qui les libelle. — information ; relais BFF à nommer par A si l'écran le demande.
- **Pièges (924)** : (1) un `jest` lancé en tâche de fond dans la même commande que `tsc` peut rendre une sortie vide : relancer séparément. (2) Le test e2e ne peut pas éprouver « SARL sans dirigeant » : la création le refuse déjà (`DIRIGEANT_REQUIS`) ; c'est le unitaire qui porte la mutation. (3) Un heredoc de bash contenant plusieurs blocs `EOF` et des apostrophes a échoué en bloc sans rien écrire : passer par l'outil d'écriture.
- ~~4. **STORY-923**~~ ✅ **DONE (2026-11-17)** — admin-panel #36 (dev `18a9893`). `PATCH /api/v1/dossiers/{id}` relayé par le BFF (`TENANT_ADMIN`, `DossierServiceClient`, `DOSSIER_SERVICE_URL` facultative) ; version dans le corps (pas d'`If-Match`) ; refus relayés par code HTTP + code (liste fermée de 11), **sans texte** ; OpenAPI du BFF à jour. Unitaires 43/43 (533), e2e 13/13 (232), 2 mutations rouges sur l'assertion. `docker compose up` admin-panel (grp-a, `--no-deps`) healthy, route mappée ; pile retirée, verrou rendu. **Suite : STORY-924.**
- **→ D (2026-11-17) : la route est disponible pour l'écran de la fiche dossier** (onglet Identité) : `PATCH /api/v1/dossiers/{id}` sur le BFF (:3010), corps `ModifierIdentiteDossierDto` (`version` lue au `GET`, `null` retire un champ facultatif). Sur `409` lire `code` (`CONFLIT_CONCURRENT` = recharger et rejouer ; `DOSSIER_ARCHIVE`, `DOSSIER_NIF_DEJA_UTILISE`…) : **le BFF ne fournit aucun texte**, l'écran écrit le sien. Types : `npm run gen:api` depuis l'OpenAPI du BFF. Réservé `TENANT_ADMIN` (un collaborateur simple a 403 : D12 demande d'abord un 409 muet côté dossier-service). — information.
- **Pièges (923)** : (1) le BFF n'avait AUCUN relais de `dossier-service` : le « motif des routes de dossier déjà relayées » du brief n'existait pas ; le motif suivi est celui des proxys d'écriture (`UpstreamClient.patch`, `rethrowUpstreamError`). (2) Règle du BFF (STORY-378) : jamais de corps amont relayé : on garde statut + code d'une liste fermée, le champ `message` porte le code (le filtre en exige un). Un 400 de `class-validator` sans code rend un 400 générique. (3) `forbidNonWhitelisted` global : les champs d'identité sont déclarés `@Allow()` sans type (aucune conversion implicite). (4) Les fichiers du dépôt sont en CRLF : les scripts de remplacement doivent le respecter ; les heredocs > ~180 lignes n'écrivent rien (outil d'écriture).
- ~~3. **STORY-922**~~ ✅ **DONE (2026-11-17)** — balance #153 (dev `e67034a`), bilan #178 (dev `557d402`), fiscal #53 (dev `4ee8ed7`). `decisionAncienne`, `memeDecision`, `libelle` et `DroitLu` retirés de `double-lecture.ts` (aucun appelant : code, tests, autres dépôts) ; `decisionPubliee` et `EtatPublieLu` gardés ; trois copies identiques (comparées par `diff`). Aucun champ de contrat touché (les `libelle` du paquet fiscal et des balances sont d'autres symboles). tsc, lint, read-models : balance 26/26 suites (336 tests), fiscal 14/14 (179, `-w 2`), bilan 32/34 : les 2 échecs (`read-models.module.graphe.spec.ts` : `Cannot find module 'bindings'` ; `dossier-scope.invariant.spec.ts`) sont **préexistants**, identiques sur `origin/dev` (stash de la seule modification, mêmes deux fichiers). Docker non requis. **Suite : STORY-923.**
- **Piège (922)** : le Node du poste est v25 ; `bindings` (client Kafka natif de Confluent) casse les suites qui chargent le module de lecture de bilan (ne touche pas les dépendances ; elles se jouent sous Node 24 dans l'étage `verification`). `dossier-scope.invariant.spec.ts` (bilan) met 270 s en parallèle complet et échoue aussi sur `dev`. Dette nouvelle : `refuseeEnLectureSeule` (`lecture-seule.ts`) n'a plus d'appelant hors de son spec, dans les trois dépôts ; à retirer avec son spec au prochain passage sur ces gardes.
- ~~2. **STORY-921**~~ ✅ **DONE (2026-11-17)** — balance #152 (dev `9dfd60e`). Origine `comptabilite` dans `ORIGINES_BALANCE`, publiable par ingestion directe ; mutations rouges sur l'assertion ; e2e OpenAPI 221/221 ; Docker non requis. **Suite : STORY-922.**
- **→ B (2026-11-17) : l'origine `comptabilite` est disponible pour B-967** (dev `9dfd60e`, balance-service). Forme attendue de la balance sur `balance.submitted` v1 : `balance.source = "direct"`, `balance.origine = "comptabilite"`, `dossierId` requis, `exercice`, `version` ≥ 1 (lignée propre à l'origine), `lignes` aux QUATRE colonnes de montant en unités mineures entières (SANS `aNouveau*`), `checksum` = SHA-256 de `{ exercice, source, referentiel, version, lignes triées par compte }` (voir `INTEGRATION.md` §1 ter), `referentiel` facultatif : omis, le hub le résout depuis le dossier, mais le sceau porte quand même ce tag. `sourceSystem` à faire ajouter à l'allowlist `INGESTION_SOURCE_SYSTEMS`. Balance GÉNÉRALE (pas une contribution partielle) : le hub chaîne le socle d'à-nouveaux de l'exercice, donc n'envoyer que les mouvements de l'exercice. Retours : `balance.created` ou `balance.rejected` (codes stables). — ouverte jusqu'à B-967.
- **Piège (921)** : le plan parlait de « 4 origines, la 5e `comptabilite` » ; le code a 3 sources (`sage`, `direct`, `ocr`) et 5 origines (`A_NOUVEAUX`…`INVENTAIRE`). Lecture retenue : `comptabilite` est une ORIGINE (6e symbole de `ORIGINES_BALANCE`, la 2e publiable), sur `source: direct` (D-921-1) ; contestable par B si elle attendait une source.
- ~~1. **STORY-920**~~ ✅ **DONE (2026-11-17)** — recette #24 (dev `68ef348`) ; compose racine du poste principal modifié en
  place (non versionné). Image `cgr.dev/chainguard/minio:latest`, `user: '0'` ; garde du profil réalignée (18/18,
  mutation rouge) ; pile neuve `grp-a` : recette `zone-franche` 5/5, `mc ls` voit les artefacts dans MinIO. Pile
  descendue avec ses volumes, verrou rendu. **Suite : STORY-921.**
- **Piège (920)** : l'image de Chainguard est distroless (ni `curl` ni `mc`) : pas de healthcheck `CMD` possible, MinIO
  reste en `depends_on: service_started` comme avant. Le client est `cgr.dev/chainguard/minio-client:latest-dev`
  (`--entrypoint sh`, sur le réseau de la pile). Un `docker compose down` sans le fichier fiscal laisse
  `fiscal-service` et `mongo-fiscal` : les passer tous les `-f` du `up`, ou `docker rm -f -v`.
- **Piège (920)** : le générateur de barrels de l'éditeur recrée des `index.ts` entre deux commandes : purger
  (`git ls-files --others`) dans la MÊME commande que le build.

### Lot 2 (depuis le 2026-11-16) — l'état courant

- **Consigne de l'utilisateur (2026-11-16)** : « prends le groupe A pour le terminer, celui du lot 2 » : STORY-905 →
  919 dans l'ordre du §2, sans s'arrêter ; remplaçante du §2 si une story attend B (917, 918 attendent B-945 ; 919
  attend B-949). C tourne sur le même poste : verrou `MoneyVibes_Apps\.verrou-docker`, piles `grp-a-…`.
- ~~1. **STORY-905**~~ ✅ **DONE (2026-11-16)** — balance #145 (dev `4a2abec`), bilan #173 (dev `663063d`). La garde
  d'accès lit `@LectureSeule()` ; `ROUTES_SANS_ECRITURE` déclarée (4 routes balance, 8 bilan) et balayée sur tous les
  contrôleurs ; 4 mutations rouges ; pile `grp-a-905` : dry-run en 200 avec un droit échu (témoin dev : 403).
- ~~2. **STORY-906**~~ ✅ **DONE (2026-11-16)** — balance #146 (dev `921b333`). `dossierId` publié ; `tag` servi par
  `…/referentiels/actifs` ; `409 REFERENTIEL_CONTRADICTOIRE` (`details`) ; import Sage au tag du dossier. Pile
  `grp-a-906` : SFD ⇒ `SN` refusé, `SFD-BCEAO` 201 ; témoin dev : `SN` accepté.
- ~~3. **STORY-907**~~ ✅ **DONE (2026-11-16)** — balance #147 (dev `7a885bb`), dossier #48 (dev `249b2ed`), fiscal #47
  (dev `8487497`). Paquet `togo@2026` régénéré (sha256 **`e8e94c84…`**, était `17d66e23…`) : `TPU`, `TPU_ACOMPTE`, `RSH`
  au catalogue ; conformité fiscal 65/65 (rs-fiscal) ; recette `zone-franche` 5/5 sur les branches. Le test TPU
  « CA 18 M » réaligné. ⚠️ **La procédure de publication du paquet (plus bas) cite encore `17d66e23…`** : l'empreinte
  à publier est désormais `e8e94c84…` (mise à jour ici).
- ~~4. **STORY-908**~~ ✅ **DONE (2026-11-16)** — balance #148 (dev `985e8d1`), bilan #174 (dev `982c2db`). Node 24,
  client de Confluent ; deux défauts du patron de 950 trouvés et corrigés (relance sur consommateur neuf ; `/health`
  borné à 5 s) — **demande à B et C** ci-dessous. Recettes `zone-franche` + `atelier-balance` **56/56 depuis `dev`**
  (valent aussi pour 907).
- ~~5. **STORY-909**~~ ✅ **DONE (2026-11-16)** — fiscal #48 (dev `a552d77`). Node 24, client de Confluent, les deux
  correctifs de 908 ; conformité 65/65 sous Node 24 ; pile : topic neuf vu en 6,6 s, `/health` 503 en 6,8 s sans Kafka,
  200 en 16 s au retour. Recette depuis `dev` jouée au gate de 910 (qui recette la même pile).
- ✅ **Relecture de `kit-cible` 1.0.0 (demande de B)** : `coordination/relecture-kit-cible-1.0.0-groupe-A.md`. Verdict :
  **1.0.1 nécessaire** (D1 bloquant : une clé en double dans un lot perd une ligne en silence ; D2 messages hors
  contrat ; D3 montants requis non appliqués ; trous de la suite : cloisonnement, atomicité, `controles`).
- ~~6. **STORY-910**~~ ✅ **DONE (2026-11-16)** — dossier #49 (dev `2e7e0dc`), kyc #28 (dev `d4932c6`). Node 24 : 113/113 et
  50/50 suites ; pile : topic neuf vu en 3,2 s par dossier, `/health` 503 en 3,1 s sans Kafka, 200 en 8 s au retour.
- ~~7. **STORY-911**~~ ✅ **DONE (2026-11-16)** — BFF #34 (dev `84120a5`), recette #21 (dev `979ec45`). BFF sous Node 24
  (41/41), coupe-circuit de 903 rejoué (20/20 en 200) ; piles de recette sur **MongoDB 8.0** ; garde du profil de
  recette réalignée (rouge sur `dev` depuis 933/938). **Recettes `pile` + `zone-franche` + `atelier-balance` : 63/63
  depuis `dev` sur MongoDB 8.0.38** — valent pour 909, 910 et 912.
- ~~8. **STORY-912**~~ ✅ **DONE (2026-11-16)** — balance #149 (dev `390775c`), bilan #175 (dev `d2e900b`). Garde partagée en
  double lecture ; pile : `LECTURE_SEULE` publié ferme l'écriture en 0,1-4,6 s, un rejeu ancien ne rouvre rien.
- ~~9. **STORY-913**~~ ✅ **DONE (2026-11-16)** — fiscal #49 (dev `6d424cc`), dossier #50 (dev `45f8ecd`). Garde
  partagée en double lecture dans fiscal et dossier.
- ~~10. **STORY-914**~~ ✅ **DONE (2026-11-16)** — balance #150, bilan #176, fiscal #50, dossier #51. Préavis de 30 j,
  horloge injectée, liste blanche d'export et d'états (FR-43) tenue par un invariant.
- ~~11. **STORY-915**~~ ✅ **DONE (2026-11-16)** — dossier #52. `axesDetermines` par ligne du portefeuille ; ticket fermé.
- ~~12. **STORY-916**~~ ✅ **DONE (2026-11-16)** — dossier #53. `PATCH /dossiers/{id}` journalisé ;
  `?type=MANDAT_ATTESTE` ; ticket « trois surfaces » : 1 et 3 fermées, **2 (complétude) ouverte**.
- ~~13. **STORY-917**~~ ✅ **DONE (2026-11-16)** — recette #22, BFF #35. Recettes sur le point de décision ; la console
  relaie les routes d'installation du moteur. Recettes depuis `dev` 87/87.
- ~~14. **STORY-918**~~ ✅ **DONE (2026-11-16)** — balance #151 (dev `e282c22`), bilan #177 (dev `68c6de8`), fiscal #52 (dev `a587b88`),
  dossier #54 (dev `d6dfac5`), recette #23 (dev `58ebabd`). Les gardes décident par l'état publié seul, **inconnu ⇒
  refus** ; mutation (ancienne garde rebranchée) rouge ×4 ; recettes sur pile neuve **91/91**, dont la nouvelle
  `cabinet-moteur` (inconnu refusé, installé par le moteur ouvert, `SUSPENDU` garde l'export). Deux défauts de recette
  corrigés au passage (`abonnement` dépendait de l'ordre ; `cabinet-moteur` sans axes).
- ~~15. **STORY-919**~~ ✅ **DONE (2026-11-16)** — fiscal #51. `/moi/droits` en double lecture dans la garde fiscale ;
  la décision reste celle du jeton.
- **Lot 2 de A terminé.** À l'ordre de la mise en service : `migrate:reamorcage-moteur` du catalogue (945) **avant** les
  images de 918 (D-918-3), sinon un cabinet installé avant le moteur est refusé.
- **Pièges (918)** : (1) une recette ne doit rien attendre d'une autre : sur une pile **neuve** (`down -v`), `abonnement`
  rendait 422 parce que `sfd-bceao@2.0` n'était déclaré que par `referentiel-par-dossier` ; une pile réutilisée cachait
  le défaut (917 « verte seule »). Rejouer les recettes sur une pile neuve avant de fusionner. (2) `zone-franche` lève
  fiscal-service en cours de passage : sur ce poste saturé, des appels voisins prennent `ECONNRESET` ; seule, sur la
  même pile, elle passe. (3) Un passage jest complet dans une image, sur un poste chargé, laisse des échecs de minutage :
  relancer **par chemin de fichier**, jamais par `-t` (qui charge toutes les suites).
- **Pièges (910-912)** : (1) l'éditeur régénère des `index.ts` dans **toutes** les copies, y compris celles de B, et
  casse les builds Docker depuis la copie de travail ⇒ construire les images depuis `git archive origin/dev`, et pour
  une recette, une surcouche qui remplace chaque `build` par ces images (`build: !reset null` + `image:`) ; ne jamais
  `git add -A` (un commit a embarqué 31 `index.ts`, retirés avant de pousser) ; (2) le DNS de Docker vers
  `auth.docker.io` tombe par moments : la directive `# syntax` échoue ⇒ `DOCKER_BUILDKIT=0` ; (3) un `sed` sur
  `production$` a changé `ENV NODE_ENV=production` en `production.` (BFF en boucle de redémarrage, corrigé).
- **Piège (913-916)** : `git archive` applique `core.autocrlf` du poste : l'archive d'une branche porte des CRLF
  et les empreintes des artefacts embarqués tombent (paquet fiscal `15de8f3e…` au lieu de `e8e94c84…`, 1 419 échecs
  sur bilan). **Toujours `git -c core.autocrlf=false archive`.** Contrôler par `sha256sum`, pas par `grep -c $''`
  (un JSON d'une ligne n'en montre aucun).
- **Piège (913-916)** : le DNS de la VM Docker est retombé (`registry.npmjs.org` introuvable) : un `npm ci` non
  caché échoue au build ; attendre, ou réutiliser une couche en cache.
- **Piège (909)** : le build de fiscal vérifie l'empreinte de ses artefacts (`paquets-depot/assets`,
  `completude-depot/assets`) ; une copie de travail Windows les a en CRLF ⇒ `PAQUET_DEPOT_INTEGRITE` au `nest build`.
  Réextraire en LF (`rm` puis `git -c core.autocrlf=false checkout --`) avant une image construite depuis la copie.
- **Piège (906)** : le `docker-compose.override.yml` racine monte le dépôt et lance `start:dev` ; une preuve sur
  image se lève avec `docker compose -f docker-compose.yml`. Le générateur de « barrels » de l'éditeur recrée des
  `index.ts` pendant la session : les purger avant chaque build.
- **Docker** : aucune pile de A ne tourne (piles de 918 descendues avec leurs volumes, verrou rendu). Deux conteneurs arrêtés d'une
  session précédente restent : `grp-a-kafka-1`, `grp-a-karapace-1`.

### Lot 1 (14 → 15/11), archivé

- **2026-11-14 (soir)** : journal ouvert. Prochaine étape : la relecture de STORY-299, 300, 365 et 563 (§3.1).
- **2026-11-14 (soir)** : STORY-569 livrée (fiscal #39, notification #86) ; elle sort du lot, remplacée par STORY-345.
  Le lot se termine par la relecture de tout ce qu'ont fait les quatre groupes (§3.4).
- Déjà fusionné le 14/11 par les deux sessions de la journée : STORY-178, 177, 175, 174, 365, 176, 100, 563, 567, 568
  (et 293 clôturée) ; STORY-299, 298, 300, 362, 305 → 312.
- **2026-11-15** : **STORY-901 DONE** (balance #143, dossier #47, fiscal #40, recette #16 ; docs #479, #482, #483).
- **2026-11-15** : **relecture §3.1 faite** (299, 300, 365, 563) →
  `coordination/relecture-groupe-A-2026-11-14.md`. Aucun bloquant dans le code livré. La migration de 563 est
  **jouée** sur la pile de recette et **inscrite** au README de fiscal-service (« Mise en service », **fiscal #41**,
  fusionnée).
- **Machine** : poste principal (Windows). **Docker** : aucune pile ne tourne. `recette100` est arrêtée (conteneurs conservés), `grp-a` descendue avec ses
  volumes.
- **Consigne de l'utilisateur (2026-11-15)** : A termine son lot, **puis fait le lot de B** (§4, B n'a pas démarré),
  puis finit par la story du seed du catalogue (`fiscal-tg-*` octroyables pour `declarations`, voir « Questions »).
  Les stories s'enchaînent **sans s'arrêter** (la consigne d'un `/clear` après chaque story est annulée). **Ce
  journal reste la mémoire du lot** si le contexte d'une session est résumé.
- **Lot de A, ordre à jour** :
  1. ~~relecture §3.1~~ ;
  2. ~~restes §3.2~~ : ticket pour D écrit, procédure écrite (voir « Procédures »), question 300 retenue par
     défaut ; STORY-903 nommée (fiche juste avant de la coder) ; la partie bloquée de 901 (texte de la loi 2011-018 :
     un scan sans texte) est consignée dans sa fiche (D-901-5) ;
  3. ~~STORY-901~~ ;
  4. ~~STORY-345~~ : **fiscal #42** (base de rémunération versionnée, D-345-1 → 5) ;
  5. ~~STORY-902~~ : **auth #37**, puis **fiscal #43** (rôles du cabinet, rôle par défaut du vertical, fin de la
     compatibilité) ;
  6. ~~STORY-903~~ : **admin-panel #33** (coupe-circuit du catalogue, fan-out borné) ;
  7. ~~STORY-313~~ : **fiscal #44** (aiguillage, état daté d'un tiers) ;
  8. ~~STORY-314~~ : **fiscal #45** (montant à saisir, contre-métrique) ;
  9. ~~STORY-904~~ : **fiscal #46** (garde du jeu de répliques, sérialisation fermée, conformité) ;
  10. ~~relecture finale §3.4~~ : `coordination/relecture-finale-groupe-A.md`.
- 🏁 **LOT DE A TERMINÉ (2026-11-15).** Docker éteint ; passations écrites (notification `8916ee4`, auth `456035f`) ;
  relecture finale livrée. **Suite (consigne de l'utilisateur) : le lot de B** (§4, STORY-930 → 939), tenu par cette
  session, qui écrit désormais aussi dans `journal-groupe-B.md`. **Puis** la story du seed du catalogue. La relecture
  finale sera **rejouée** à la fin du lot de B.
- **STORY-904 réservée par A** (fiche à écrire juste avant de la coder) : *le fiscal tient sur un vrai MongoDB*.
  Elle couvre :
  - le refus de démarrer sans jeu de répliques ;
  - la sérialisation canonique fermée (`Date`, `ObjectId` et `Buffer` refusés) ;
  - une course sur un même périmètre d'audit ;
  - l'atomicité de l'audit et de l'écriture ;
  - le rejeu de la dérivation sur une obligation d'avant 563.

  Le tout est prouvé par `test:conformite`.
- **STORY-902 élargie** par la relecture :
  - côté fiscal : fin du mode de compatibilité (mode strict), fait d'audit marqué `via` (jeton ou rôle), test
    d'invariant « toute route d'écriture est décorée » ;
  - côté auth-service : la borne du jeton contrôlée **à l'attribution** d'un rôle ou d'une surcharge
    (`@ArrayMaxSize(50)` ramené à 44), un 4xx nommé au lieu du 500 `JETON_HORS_BORNE`, et des tests de connexion et
    de rafraîchissement hors borne.

## Dépôts tenus

`prospera-fiscal-service`, `prospera-balance-service`, `prospera-bilan-service`, `prospera-dossier-service`,
`prospera-kyc-service`, `prospera-admin-panel-service`, `prospera-recette`. Plus ni `prospera-notification-service`
ni `prospera-auth-service` : tous deux sont cédés à B (voir Passations).

## Passations

- **2026-11-14 : `prospera-notification-service` cédé à B**, dernier commit sur `dev` : `8916ee4`
  (STORY-569 livrée). A n'y touche plus.
- **2026-11-15 : `prospera-auth-service` cédé à B**, dernier commit sur `dev` : **`456035f`** (STORY-902 fusionnée).
  A n'y touche plus. À reprendre par B :
  - STORY-938, droits à tiret dans les trois segments (demande ci-dessous) ;
  - la console, qui affiche « sans rôle métier » pour un membre qui reçoit le rôle par défaut. L'API
    d'administration rend le `tenantRole` stocké, pas le rôle effectif (écart de STORY-902).
- **2026-11-14 (nuit) : FE-069 remise à D** (sur demande de l'utilisateur), branche **`fe-069`** poussée
  dans `prospera-frontend-expert-comptable`, commit **`4148d65`**, sans PR. A ne touche plus ce dépôt.
- **2026-11-15 : FE-069 et `prospera-frontend-expert-comptable` REVIENNENT à A** (décision de l'utilisateur : « le
  travail a été remis au groupe D, qui n'a pas démarré ; il faut que quelqu'un la reprenne cette semaine »). Le
  journal de D dit « lot pas encore commencé » ; aucun commit de D sur `fe-069` (tête `4148d65`, la mienne). A tient
  le dépôt **jusqu'à la fusion de FE-069**, puis le rend à D par une ligne ici. D garde `frontend-admin-panel` et
  `prototypes/`. Amendement : `PLAN-4-SESSIONS-2026-11-14.md` §2 et §6.

## Demandes aux autres groupes

- **→ C (2026-11-18, suite) : deux réponses de plus** — **ouverte** (à lire au rituel).
  - **Le vocal : tranché, texte seulement.** STORY-1017 (déclaration rapide) pré-remplit la fiche depuis le **texte** d'un
    message WhatsApp ou d'un e-mail ; un vocal reçu est rangé comme pièce, non lu (FR-35, D13). Le vocal reste « bientôt ».
  - **FR-73 corrigé** (PRD assurance, 2026-11-18) et **STORY-1018 écrite pour toi** (`stories/STORY-1018.md`, prête) :
    arrêter l'évaluation à l'indemnité proposée (700 000) ne doit plus exiger de motif ; `jugerLArret` ne compare
    aujourd'hui qu'au décompte au franc (702 000), et le refus ne cite que `calcule`.

- **→ B (2026-11-18) : réponses de l'utilisateur à tes questions au PO** — **ouverte** (à lire au rituel de ta
  prochaine story ; A ne les recopie pas dans ton journal).
  - **D-961-1 renversée** : un plan SMT **propre**, comme l'AUDCIF le prévoit (journal de trésorerie : recettes et
    dépenses), au lieu des six journaux du système normal ⇒ **STORY-973**, réservée pour toi.
  - **D-951-8** : la story de l'invitation au réel **doit exister avant février** ⇒ **STORY-974**, réservée pour toi,
    à mettre en tête de ton prochain lot (route d'invitation pour l'identité de service du moteur dans auth, AD-15).
  - **D-972-6 et D-972-9 : oui aux deux.** Les quatre modules sans routes C13 (`facturation`, `approvisionnement`,
    `entrepot`, `conquete-objectifs`) restent hors de l'offre d'essai jusqu'à leurs routes ; les comptes du bureau
    prennent tes clés et rôles par défaut (`AKOSSIWA`, `MENSAH`, `YAWA`, `AYITE` ; `COM-nn`), avec l'ajout facultatif
    `comptes` à `jeu-demonstration@1` (toi) et le fichier des comptes du jeu (D).
  - **Ta question à A (970)** : rouvrir N quand N+1 est OUVERT ? **Non**, rien ne change chez A.
  - Sans réponse de l'utilisateur, **restent retenus par défaut** : D-960-10 (manifeste `automatisations` réaligné sur
    l'annexe B), D-960-12 (aucun rôle par défaut au distributeur), D-955-2 (ni NestJS ni MongoDB ni Kafka au premier
    incrément de l'agent et de la centrale), l'ADR « droits hors du jeton » (938).

- **→ C (2026-11-18) : réponses de l'utilisateur à tes questions au PO** — **ouverte** (à lire au rituel).
  - **Q de 1002 (`sinistres.declaration.enregistree@1`) : oui, ta proposition, avant la démo** ⇒ **STORY-1015**, avec
    `sinistres.garantie.decidee@1`.
  - **La déclaration rapide** ⇒ **STORY-1017** (FR-34, FR-35, EPIC-206, EPIC-217). L'utilisateur veut une page de
    déclaration rapide, avec la fiche pré-remplie depuis un message WhatsApp, comme l'écran « Déclaration assistée » de
    la démo (`prospera-font-end/prospera-assurance`, `src/components/ia/DeclarationIA.tsx`, page `/dossiers/nouveau`).
    ⚠️ **Le vocal** : la démo a un bouton « Importer un vocal » (transcription factice) ; le PRD l'écarte (FR-35, D13 :
    un vocal reçu est rangé comme pièce, non lu). Question reposée à l'utilisateur le 18/11 ; en attendant, FR-35 tient.
  - **D-1010-4 (702 000 ou 700 000), tranchée selon les règles** (R8 des arbitrages, FR-73, H-060) : le décompte
    s'affiche au franc, ligne à ligne (780 000 − 78 000 = **702 000**) ; l'**indemnité proposée** (un montant calculé
    par le système, le repère) est arrondie au multiple de 5 000 le plus proche : **700 000** ; le **montant arrêté**
    par le gestionnaire reste au franc et n'est jamais pré-rempli (FR-75). C'est ce que 1010 rend déjà
    (`indemniteCalculee`, `reperePropose`) : l'écran montre les deux, nommés. À corriger dans le PRD : FR-73 appelle
    702 000 « un repère déjà arrondi », c'est faux. Le pas de 5 000 reste un paramètre (`arrondi_indemnite_fcfa`).
  - **D-1013 : oui**, l'arrêt de l'évaluation propose la provision (motif `EVALUATION`, FR-76) ⇒ **STORY-1016**.
  - **Gardés** : D-981-1/2 (`compta-cima` éteinte par défaut), D-980-3 (pas de KYC dans la garde de `sinistres`),
    D-983-8 (liste des champs de santé : éprouvée par un test au déploiement).
  - **Grille de vétusté de la compagnie** (D-1012) : pas de sitôt ; la grille indicative de la démo (H-059) reste.

- **→ D (2026-11-18) : réponses de l'utilisateur à Q-D-1 → Q-D-10** — **ouverte** (à lire au rituel).
  - **Confirmées** : Q-D-1 (KYC exigé partout), Q-D-2 (une personne sur plusieurs branches), Q-D-3 (racine =
    `TENANT_ADMIN`), Q-D-4 (encours certain : protège contre la fraude), Q-D-5 (droit propre
    `commande:parametres:modifier`), Q-D-6 (seul le message du numéro officiel est facultatif), Q-D-7 (la recette lit
    par rôle ; vérifier que « SAREX » est bien fictif), Q-D-8 (`VERT`, C-10 `SANS_OBJET` ; l'utilisateur cherche des
    documents générables pour le jeu), Q-D-10 (la série démarre à 0 sans reprise).
  - **Q-D-9 renversée** : un **calendrier propre à chaque organisation** (jours travaillés, jours fériés), dès
    maintenant, paramètre C6 lu par le plan de journée et par la résolution à l'import ⇒ **STORY-1060**, réservée pour
    toi.
  - **Mise en service (Q-D-10)** : pour un client qui quitte Sage (le distributeur de février), la reprise du dernier
    numéro de facture (`facturation.suite-numerotation@1`) se pose **avant sa première facture** : à inscrire à ta
    liste de mise en service.
  - **D-972-9 (de B)** : le fichier des comptes du bureau dans ton jeu est à faire, voir la réponse à B ci-dessus.

- **→ C (2026-11-17, information) : le compose racine et le profil de recette de A portent désormais MinIO de Chainguard**
  (`cgr.dev/chainguard/minio:latest`, `user: '0'`), STORY-920, recette #24. Vos piles MinIO sur ce poste (`grp-c-…`,
  `document-service` 995 → 997) n'ont plus besoin d'une image en cache ; un compose de pile à vous qui définit son propre
  `minio` prend la même image et le même `user`. Rien à rejouer côté A.

- **→ B et C (2026-11-16, STORY-908) : deux défauts du patron de supervision de 950, à vérifier chez vous.**
  Trouvés sur la pile de 908 (balance, bilan), corrigés chez A (balance #148, bilan #174) :
  1. **une relance ne peut pas réussir** : la supervision rappelle `connect()` sur **le même** consommateur ; le client de
     Confluent (1.11, `_consumer.js` : `state !== INIT` ⇒ « Connect has already been called elsewhere ») le refuse
     toujours. Un service démarré **sans Kafka** relance alors indéfiniment, même Kafka revenu (constaté : relance n°17
     en échec). Correctif : un consommateur neuf à chaque relance (`renouveler()` dans
     `supervision-consommateur.util.ts` de balance) ; test « chaque relance prend un consommateur NEUF » ;
  2. **`/health` attend ~30 s un broker absent** : `admin.connect()` n'est pas borné. Correctif : contrôle borné à 5 s
     (`DELAI_SANTE_KAFKA_MS`, `kafka.health.ts`).
  Services où le même code tourne (relevé sur `origin/dev`, non éprouvé par A) : **B** notification, paiement,
  catalogue ; **C** sinistres, assurance, document-service, liaison-assureur, assureur-fictif. Preuve à rejouer :
  arrêter Kafka, redémarrer le service, relancer Kafka, attendre `/health` 200.

- **→ B (2026-11-15) : le rôle métier effectif dans la liste des membres** —
  `tickets/TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres.md`. Bloque **FE-115** (février). C'est le même
  écart que la console « sans rôle métier » de la passation d'auth ci-dessus, vu côté cabinet.
- **→ D (2026-11-15) : nouveau point de départ.** FE-069 revient à A (voir « Passations »). D commence par **AP-38**
  (console) et par les **maquettes** des stories de février, dans l'ordre de `tri-frontend-fevrier-2026-11-15.md`
  §4.1 ; il reprend le dépôt du cabinet à la fusion de FE-069. Les fiches FE-112 → FE-125 sont écrites par A ; la
  plage libre de D devient **FE-126 → FE-139**.
- ~~**À D — reprendre FE-069 sur la branche `fe-069`**~~ *(close le 2026-11-15 : FE-069 revient à A ; le détail
  ci-dessous reste juste et sert à A)* (plan, ligne FE-069 du lot de D : « D la reprend où elle en est »).
  - **À lire d'abord** : la section « Recensement des écarts frontend ↔ backend (2026-11-14) » de la fiche
    `frontend-stories/FE-069.md` (#480) — ruptures A1→A3, écarts de schéma B1→B17, routes sans écran C1→C17,
    et le découpage proposé au PO (A+B dans FE-069, C en stories nommées — **pas encore validé**).
  - **État de la branche** : typecheck **rouge à dessein** — les types sont régénérés depuis la pile `recette100`
    (8/8 services, `origin/dev` du 14/11) et font remonter les écarts B. A1/A2 sont faits dans le code
    (`referentiels/actifs` et `tresorerie/*` sous `/dossiers/{id}/`, clés de cache sous `["dossier", id, …]`) ;
    restent `tresorerie.test.ts`, `scope-dossier.guard.test.ts`, les stubs e2e (A3), puis B.
  - **Le gate e2e** : `npx playwright test -c playwright.gate.config.ts` (`e2e/gate/`, aucune interception).
    `pile.ts` amorce un cabinet réel par API (inscription, lien Mailhog, KYC approuvé, modules, collaborateur).
    Vert jusqu'à la création du dossier par l'assistant ; bute ensuite sur A1 (Atelier fermé, faux « KYC non
    approuvé »). Le serveur `next start -p 3100` est **réutilisé** s'il tourne : le relancer après tout changement.
  - **La pile** : `recette100` tourne, **`expert-comptable` ajouté** (worktree `_wt-r100-expert-comptable`,
    surcouche avec `NODE_ENV: production`, sinon crash `pino-pretty`).

- **→ B (2026-11-15) : borne du jeton face aux verticales** (relecture de STORY-365) — **ouverte**.
  1. **STORY-938** : la regex des droits d'auth-service
     (`TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/`) refuse le tiret dans le 1er segment, ce qui écarte
     **56 des 347** codes des manifestes (`coeur-sfd`, `liaison-assureur`, `assureur-fictif`,
     `finance-transactions`…). Il faut élargir les trois segments : `^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*:[a-z]+$`.
  2. **STORY-935** : cinq codes dépassent la borne de 40 caractères. Ce sont les trois
     `approvisionnement:commande-fournisseur:*` (48, 47, 46), `finance-transactions:rapprochement:effectuer` (44) et
     `finance-transactions:tresorerie:consulter` (41). Les renommer, ou relever la borne de longueur et celle
     d'octets ensemble, sur une nouvelle mesure.
  3. **Décision d'architecture avant février** : la borne de 44 droits et 3 584 octets ne tient pas face aux
     verticales. Les manifestes déclarent 347 droits ; `sinistres` en porte 23 à lui seul ; un DG à plusieurs
     modules dépasse 60 à 100 droits. A recommande que le jeton porte les rôles et les modules, et que les droits se
     résolvent par une lecture en cache (un read-model ou `/me/permissions`).

  Détail : `coordination/relecture-groupe-A-2026-11-14.md`, section STORY-365.

- **→ D (2026-11-15) : le motif saisi pièce par pièce dans la revue KYC est perdu sans bruit** (reste de STORY-176)
  — **ouverte**. Le ticket est `tickets/TICKET-FRONTEND-motif-par-piece-revue-kyc.md`, et il devient **AP-38** (lot de
  D, n° 12).
  - Choix de A : **aucun changement de backend**. La console reporte les motifs par pièce dans le motif du dossier
    (`reason`, au plus 1 000 caractères), qui est déjà persisté, journalisé et envoyé au cabinet.
  - L'opérateur voit le texte composé avant d'envoyer, et un dépassement est refusé sans troncature.
  - D inscrit AP-38 à son tracker.

- **→ B (2026-11-17) : le jeu du cabinet est dans `jeux-demonstration/cabinet-demo-togo/`** — ~~à faire par B~~ **servie par B (2026-11-17)** : plateforme #26 (`dev` `3407408`), étiquette `jeu-cabinet-v1` posée sur `e958bd6`. A a ajouté ce dossier (données seules, plateforme #25, `dev` `e958bd6`), sur la phrase du README « les jeux des verticales viennent de leurs propriétaires ». (1) La ligne du tableau « Qui écrit dans quel dossier » : `jeux-demonstration/cabinet-demo-togo/` → groupe A. (2) **L'étiquette `jeu-cabinet-v1`** : `generateur.source` du `jeu.json` la nomme (`prospera-plateforme@jeu-cabinet-v1:jeux-demonstration/cabinet-demo-togo/generateur/generer.mjs`) ; je n'en crée pas dans votre dépôt (D l'a fait pour `jeu-assurance-v1` ; si vous préférez qu'A le fasse, le dire ici). (3) Pour le catalogue : le dossier du jeu porte aussi `generateur/` (le vérificateur l'ignore) ; à `JEUX_DEMONSTRATION_DIR`, copier le dossier entier ou seulement `jeu.json` et `balance/`. Le jeu seul se rejoue : `node jeux-demonstration/cabinet-demo-togo/generateur/generer.mjs <dossier>` (même graine, mêmes empreintes). Les routes C13 de balance et de bilan viennent en STORY-928.

## Réponses aux demandes reçues

- **← B (2026-11-16) routes C13 du cabinet : servies** (2026-11-17, STORY-928, balance #156 `98078b0`, bilan #179 `1651d33`) : `POST /api/v1/instance/{balance|bilan}/{organisationId}/import` et `/effacement`, aux corps de `contrats-instance-v1`, sous l'identité `MOTEUR`, espace d'essai seulement (`INSTANCE_ESPACE=ESSAI`). Le jeu `cabinet-demo-togo` s'importe dans l'ordre (`profil-societe`, `balance`) et s'efface complètement (preuve Docker de bout en bout). Pour B : l'import de `bilan` n'a aucun objet (la part `bilan` du jeu n'existe pas, D-927-1) ; le dossier de démonstration n'est matérialisé que dans balance (ticket `dossier-de-demonstration-sans-creation-par-le-moteur`, à décider avec toi).
- **← B (2026-11-16) jeu de démonstration : jeu du cabinet livré** — chemin `jeux-demonstration/cabinet-demo-togo/` (prospera-plateforme), code `cabinet-demo-togo`, version `1.0.0`, verticale `CABINET`, PR plateforme **#25**, `dev` **`e958bd6`** ; `npm run jeu:verifier` conforme. Une part, le module `balance` (`profil-societe`, `balance`), 3 enregistrements ; `bilan` sans objet (D-927-1). **Routes C13 d'import et d'effacement à suivre en STORY-928** (balance, bilan). — **servie** pour le jeu, ouverte pour les routes.
- **← B (2026-11-17) : le lot 3 de A** — `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 : **dix stories légères, STORY-920
  → 929** (sept sans Docker, une seule recette complète, en 929). **B-967 attend A-921** (la 5e origine
  `comptabilite` du hub de balance).
- **← B (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest`, avec `user: '0'`** — **servie par PR
  prospera-recette #24 (dev `68ef348`), STORY-920** : (1) compose racine du poste principal basculé en place ; (2) service
  `minio` de `docker-compose.recette.yml` en image Chainguard + `user: '0'`, garde du profil réalignée ; (3) recette
  `zone-franche` 5/5 sur pile neuve (artefacts fiscaux écrits dans MinIO, relus par `mc`). Pas de healthcheck (image
  distroless, comme avant). Ancien texte de la demande : **à faire par
  A : c'est STORY-920 du lot 3**. Norme décidée par l'utilisateur (`REGLES-DES-GROUPES.md` §1.6) : `minio/minio` a été retiré de Docker Hub,
  `quay.io` refuse le pull anonyme. Trois gestes : (1) le `docker-compose.yml` racine du poste principal ; (2) le
  service `minio` de `prospera-recette/docker-compose.recette.yml` ; (3) une recette qui écrit dans MinIO, rejouée sur
  pile neuve. Détail et preuve : journal de B, « Demandes aux autres groupes ».

- **← B (2026-11-15) : relecture du contrat d'état publié avant figeage (STORY-932, plan §7)** — **faite**. Relecture
  indépendante sur les sources (PRD moteur §3.1, FR-34, FR-35, FR-43, addendum §A-2 ; C2, C8, C13 ; spines du moteur et
  de la coque). Verdict : **figeable après 4 corrections bloquantes**, toutes faites avant la fusion (export dans
  l'Administration en `EN_INSTALLATION`, motif d'un code de module, 503 sans heure connue, règle du calcul écrite en
  entier). Le détail et les ajouts retenus : `stories/STORY-932.md`, « Relecture avant figeage ».
- **← B (2026-11-15) : relecture de la matrice et de la route de STORY-936** — **sans objet de contrat** : ni la matrice
  ni la route n'ont changé depuis l'étiquette `contrat-etat-publie-v1`. Leur conformité est prouvée par les 33 cas
  rejoués par le calcul et par la réponse réelle de la route, validée contre le schéma figé (`stories/STORY-936.md`,
  D-936-5).

- **← B (2026-11-16) : 945 fusionnée, recettes croisées rouges sur `dev`** — **traitée par STORY-917** (branche
  `story-917` de `prospera-recette`) : `balance` avant `bilan` dans les trois recettes, `reseau` avant
  `microfinance` ; abonnement (631, 280, 728) : acquis à l'offre puis installation par le moteur, droit
  `moteur:<plan>` ; 727 : package et vertical n'ouvrent plus rien. **Aussi corrigé** : le test du package qui
  évolue (l. 729-757, source `pack:…`), que la liste ne citait pas. **Close** : 917 fusionnée (recette #22),
  recettes depuis `dev` 87/87.
- **← B (2026-11-16) : `/moi/droits` servi pour A-919** — **close** : STORY-919 fusionnée (fiscal #51).

## ⚠ Contrats

- **2026-11-17 (STORY-928), AVANT la fusion du code** : `balance-service` et `bilan-service` servent leurs routes C13 (déclarées aux manifestes, `routesInstance`), aux corps **exacts** de `prospera-plateforme/contrats/instance/` (`contrats-instance-v1`) : `POST /api/v1/instance/balance/{organisationId}/import` et `POST /api/v1/instance/bilan/{organisationId}/import` (`import-c13-demande@1` → `import-c13-reponse@1` : `IMPORTE`, puis `DEJA_IMPORTE` au rejeu ; objets servis : `balance` = `profil-societe` puis `balance` ; `bilan` = aucun objet, tout objet rend 422 `OBJET_INCONNU`, D-927-1), et `POST /api/v1/instance/{balance|bilan}/{organisationId}/effacement` (`effacement-c13-demande@1` → `effacement-c13-accuse@1` : `EFFACE`, puis `DEJA_EFFACE`). **Ajouts seuls**, aucune route existante modifiée ; les deux services acceptent désormais un jeton de SERVICE (claims `identite`, `organisationId`, STORY-948) mais seulement sur ces routes (`@AdmetIdentitesDeService('MOTEUR')`, partout ailleurs 403 `IDENTITE_DE_SERVICE_REFUSEE`). Garde : identité `MOTEUR` seule, `organisationId` du jeton = celui du chemin (403 `ORGANISATION_HORS_JETON`), **espace d'essai seulement** (`INSTANCE_ESPACE=ESSAI`, sinon 403 `ESPACE_REEL_REFUSE`), import limité à `source = JEU_DEMONSTRATION`, effacement limité au motif `FIN_ESSAI`. Refus nommés 422 : `OBJET_INCONNU`, `SCHEMA_NON_CONFORME`, `SOURCE_NON_SERVIE`, `MOTIF_NON_SERVI`, `DOSSIER_DE_DEMONSTRATION_INCONNU`, `BALANCE_REFUSEE`. **→ B** (catalogue, STORY-953) : rien à changer chez toi, tu appelles ces chemins avec le jeton du moteur ; le dossier de démonstration n'est matérialisé que dans balance (D-928-3, ticket à venir). Fiche : `stories/STORY-928.md`. Code : balance-service et bilan-service, branches `MNV-928`.
- **2026-11-17 (STORY-926), AVANT la fusion du code** : `balance-service` ajoute (ajouts seuls, rien de renommé) : (1) un champ facultatif **`provenance`** sur chaque ligne de `BalanceResponseDto.lignes` (`GET /api/v1/dossiers/{dossierId}/balances` et `…/balances/{id}`), enum nommée `ProvenanceLigne` = `CAHIERS` | `FICHIER` | `DIRECTE` | `DERIVEE` | `NON_ENREGISTREE` (dérivé à la lecture, hors sceau, aucun checksum ne bouge ; `NON_ENREGISTREE` = balances d'avant la story, **pas** « aucune pièce ») ; (2) une route **`GET /api/v1/dossiers/{dossierId}/balance/{id}/lignes/{compte}/provenance`** (OpenAPI `ProvenanceCompteResponseDto` : `lignes[]` {transactionId, sens, date, libelle, montantDebit, montantCredit, niveauPreuve, pieceId?, lotId?}, `totaux`, `balance`, `ecart` signé {…, nul}, `nonVentilees`) ; `409 PROVENANCE_NON_OUVRABLE` (`details.provenance`) si la balance ne vient pas des cahiers, `404` balance d'un autre dossier / compte absent (`COMPTE_ABSENT_DE_LA_BALANCE`). Pour D (FE-075) : types à régénérer (`npm run gen:api`) ; le BFF ne relaie pas la route. Fiche : `stories/STORY-926.md`. Code : balance-service MNV-926.
- **2026-11-17 (STORY-925), AVANT la fusion du code** : `balance-service` ajoute deux champs à la réponse de `GET /api/v1/dossiers/{dossierId}/referentiels/actifs` (OpenAPI `ReferentielDiagnosticDto`) : **`dossierId`** (hex, toujours servi, égal à celui de l'URL) et **`referentielComptable`** (`SYSCOHADA` | `SFD-BCEAO` | `CIMA`, facultatif, déduit du paquet réellement servi ; enum `FamilleReferentielComptable`). **Ajouts seuls** : aucun champ renommé ni retiré, `tag`, `referentiel`, `checksum`, `stamp` inchangés. Pour D (FE-061 : fiche dossier, versions du plan de comptes) : types à régénérer (`npm run gen:api`) ; la route est par dossier depuis STORY-422, les versions y sont déjà.

- **2026-11-17 (STORY-924), AVANT la fusion du code** : `dossier-service` ajoute **`GET /api/v1/dossiers/{id}/completude`** (tout membre du cabinet, dans la portée du jeton ; hors portée ou autre cabinet : 404). Réponse `{ dossierId, version, complet, pretPourDsf, champsManquants[], champsBloquantsManquants[], champsOptionnelsManquants[] }` ; noms de champs = identifiants machine (`nifSociete`, `rccm`, `adresse`, `dirigeants`…), aucun texte. **Ajout seul** : une route et un DTO nouveaux, aucun renommage. Lecture pure, jamais une garde. Fiche : `stories/STORY-924.md`. Le BFF ne la relaie pas encore (suite à prévoir). Code : dossier-service MNV-924.
- **2026-11-17 (STORY-923), AVANT la fusion du code** : le BFF de la console (`admin-panel`) ajoute **`PATCH /api/v1/dossiers/{id}`** (`TENANT_ADMIN`, relais vers `dossier-service`), publié dans son OpenAPI (`/api/docs-json`, schéma `ModifierIdentiteDossierDto`, `version` exigée + seize champs d'identité). **Ajout seul**, aucun renommage. Refus relayés par code HTTP + code applicatif (liste fermée de 11 : `CONFLIT_CONCURRENT`, `DOSSIER_ARCHIVE`, `DOSSIER_INTROUVABLE`, `DOSSIER_NIF_DEJA_UTILISE`, `IDENTITE_VIDE`, `DIRIGEANT_REQUIS`, `ABONNEMENT_EXPIRE`, `EMAIL_NOT_VERIFIED`, `KYC_NOT_APPROVED`, `ORGANISATION_REQUISE`, `PORTEUR_NON_IDENTIFIABLE`), **sans texte** (`message` = le code). Code : admin-panel#36. Fiche : `stories/STORY-923.md`.
- **2026-11-17 (STORY-921), AVANT la fusion du code** : `balance.submitted` v1, champ `origine` : l'énumération reçoit `comptabilite` (**ajout seul**, facultatif, aucun renommage). Publiée par `balance-service` (`docs/schemas/balance.submitted.v1.schema.json`, `INTEGRATION.md`, OpenAPI `OrigineBalance`). Pas de registre Avro/Karapace dans ce service : aucune compatibilité de registre à vérifier ; un émetteur existant ne change rien. `source` reste `direct`. La balance `comptabilite` est une balance GÉNÉRALE (complète, base fiscale, gel de la saisie), référentiel facultatif (résolu depuis le dossier), `origine` hors sceau. **→ B** : fusionné, dev `9dfd60e` (balance-service#152).

## Front cabinet : revérification et tri du 2026-11-15

- **Demande de l'utilisateur** : remettre le front à niveau sans rien ajouter (FE-069, blocs A et B) ; transformer le
  bloc C en stories nommées et les trier pour février ; « vérifier tout avant », la logique ayant beaucoup changé
  (type de société, paquet fiscal…), en lisant les stories livrées sur la période.
- **Fait** : relecture du backend du 15/11 contre `origin/fe-069`, sur les ≈ 200 stories livrées depuis le 27/08 ;
  FE-069 étendue (A1 → A13, B1 → B25, 13 pts) ; 14 fiches neuves **FE-112 → FE-125** ; 23 fiches d'août réancrées ;
  FE-042 remplacée par FE-118 ; tracker frontend à jour (185 stories). Document de référence :
  **`tri-frontend-fevrier-2026-11-15.md`**.
- **Mes recommandations, appliquées** (règle de l'utilisateur, contestables après coup) — classées sans consigne
  explicite du PO : en février, FE-034 (cycle de la liasse, prérequis du dépôt), FE-038 (export de la liasse),
  FE-096 et FE-095 (classeur e-DSF, rejet), FE-118 (zone franche) ; après février, FE-119 (espace déclarant, aucune
  app pour le porter) et tout ce que le PO n'a pas nommé (§4.2 du tri, marqué ◆).
- **STORY-905, nommée par A** (fiche juste avant de la coder ; dépôts de A : balance, bilan) : *une simulation est une
  lecture*. Un abonnement échu met le service en lecture seule, mais `refuseeEnLectureSeule` juge sur la méthode HTTP
  (`bilan-service`, `read-models/guards/lecture-seule.ts` ; même patron dans balance) : les `POST …/dry-run` sont
  refusés en `403 ABONNEMENT_EXPIRE` alors qu'ils n'écrivent rien. Vu par le relevé du front (FE-069 A10).

## Questions à l'utilisateur ou au PO

- **Réponses du 2026-11-18** : voir « État », lot 4 (D-923-1 renversée ; D-928-3 remplacée par STORY-1082 ; D-926-2,
  D-926-6 et la lecture du fichier déposé de 300 confirmées). **Restent retenues par défaut, sans réponse** : D-923-2,
  D-924-1, D-925-1, D-927-3, D-929-1, D-929-2 ; la question de B (970) « rouvrir N quand N+1 est OUVERT » (défaut :
  rien ne change chez A). **Pièces attendues de l'utilisateur, pas de sitôt (18/11 : on avance sans)** : le texte de la loi 2011-018 (901) ; l'avis d'un
  fiscaliste sur les deux lectures de 568.

- **STORY-300** : le mode de compatibilité par rôle des droits fiscaux (TENANT_ADMIN = tout, TENANT_USER = préparer)
  reste-t-il, et jusqu'à quand ? **Retenu par défaut (2026-11-15)**, selon la règle de l'utilisateur : « appliquer ce
  que A recommande, contestable après coup ».
  - Le mode reste jusqu'à la fusion de STORY-902, qui y met fin : un jeton sans droit fiscal est alors refusé.
    ✅ **Fait le 2026-11-15** : auth #37, puis fiscal #43.
  - STORY-902 attribue d'abord les droits `fiscalite:*` aux rôles du cabinet existants, pour que personne ne perde
    l'accès.
  - STORY-902 garde donc sa place (n° 5 du lot), sans attendre 313 et 314.
- **STORY-300, lecture du fichier déposé** : `GET /depots/:id/fichier` et `/audit` n'exigent que le rôle. Tout membre
  du cabinet lit donc le fichier déposé. **Retenu par défaut : on garde**, conformément à la règle d'or de 300 (la
  lecture suit le rôle). Si le PO veut un droit `fiscalite:declaration:lire`, il le dit.
- ✅ **Production : le seed du catalogue** — **réglée par STORY-940** (catalogue #49, recette #20 ; semis
  corrigé, migration pour les bases existantes, contournement de la recette retiré). Constat d'origine (STORY-901) : Le catalogue n'autorise aucun paquet `fiscal-tg-*`
  pour le module `declarations`, puisque `fiscalite` est retiré de l'offre. L'octroi échoue donc en
  `422 REFERENTIEL_INCOMPATIBLE`, et fiscal-service ne recevrait aucun paquet en production. La recette contourne
  par `PATCH /admin/modules/declarations`. **Demandée par l'utilisateur le 2026-11-15** : à faire **après le lot de
  B**, dans `prospera-platform-catalog-service` (dépôt de B) : corriger le seed, puis retirer le contournement de la
  recette.

## Dette relevée

- **Lot 2 (918, 2026-11-16)** :
  1. **Ingestion de balance** : le service d'ingestion autorise encore l'organisation par `OrgBalanceEntitlement` (identité
     de service, que la garde partagée ne modélise pas : `identite: 'UTILISATEUR'` seulement). À reprendre quand la
     matrice aura une identité de service (D-918-5).
  2. ~~**`double-lecture.ts`** (balance, bilan, fiscal) : `decisionAncienne`, `memeDecision`, `libelle` ne servent plus
     depuis 918 ; copies identiques laissées en place, à retirer ensemble.~~ **Faite par STORY-922 (2026-11-17).**
  3. **Recette `cabinet-moteur`** : installe par le `PUT` de la console (plan `CONSOLE_PUT`) — **éprouvée et écrite par STORY-929 (D-929-1) ; reste ouverte, portée par STORY-1080** ; passer à
     `POST /installations` quand balance et bilan serviront leurs routes de vérification (C13, D-918-4). **Import et effacement servis par STORY-928 (2026-11-17) ; restent les `verifications/…`** (STORY-929).
  4. ~~**BFF** : `PATCH /dossiers/{id}` (916) n'est pas relayé pour le collaborateur ; le 409 de version doit rester muet
     côté écran.~~ **Faite par STORY-923 (2026-11-17).** Reste : la console doit migrer vers les routes d'installation (lot de D).
  5. ~~**Fiche dossier, surface 2 (complétude)** : ouverte.~~ **Faite par STORY-924 (2026-11-17)**, ticket « trois surfaces » fermé. Reste le relais BFF de la complétude, à la demande de l'écran.

- **Mise en service des invitations (569)** : poser `JETONS_DE_SERVICE` dans fiscal-service, `NOTIFICATION_*` et
  `ESPACE_DECLARANT_URL` (fiche 569). Écrit jusqu'ici dans la relecture finale seulement.

- **Audit fiscal (299)** : la suppression de la **dernière** entrée d'une chaîne est indétectable. Seul le rôle
  find+insert du compte l'empêche. L'ancre externe (empreinte de tête publiée) sera à décider avec la spine fiscale.

## Procédures

### Publier le paquet fiscal Togo 2026 au catalogue, à la mise en service (geste d'administration)

Le paquet a été modifié quatre fois le 14/11 (305, 307, 308, 901). En production, **aucun** paquet `fiscal-tg-*` n'a
jamais été publié, puisque le seed ne les autorise pas : on publie donc la version `2026.1` **une fois**, avec les
octets de `balance-service` du tag déployé.

**Qui :** un administrateur de la plateforme (`PLATFORM_ADMIN`), avec son jeton, contre `platform-catalog-service`.

1. **Prendre les octets.** Le fichier se lit dans le tag de `balance-service` effectivement déployé, extrait en **LF**
   (`git -c core.autocrlf=false show <tag>:<chemin>`), et non dans un checkout Windows. Empreintes au 2026-11-15
   (`origin/dev`) :

   | Code, version | Fichier (`balance-service/src/modules/referentiel/assets/`) | sha256 |
   |---|---|---|
   | `fiscal-tg-entreprise@2026.1` | `paquet-fiscal-togo-2026.json` | `e8e94c846227e9429b4e7e641bc7ea0c8364f774616359d22ce0970f97df0dc6` (STORY-907) |
   | `fiscal-tg-entreprise-zone-franche@2026.1` | `paquet-fiscal-togo-zonefranche-2026.json` | `da92a432ed175189d46a71f2c526579194cb9b250f04e017b2d31c380f360f74` |

   L'empreinte calculée doit être celle qu'épinglent `balance-service` et `prospera-dossier-service`. Sinon, on
   s'arrête : les copies ont divergé.
2. **Publier chaque paquet** :
   `POST /admin/referentiels/<code>/<version>/artifact` (multipart : `file`, `expectedChecksum=sha256:<empreinte>`).
   Le catalogue écrit l'objet, puis crée la version `ACTIVE`. Un **409** veut dire que `(code, version)` est déjà
   pris : une version publiée ne se réécrit jamais.
3. **Ouvrir le module.** Depuis STORY-940, le semis du catalogue donne à `declarations` les deux familles
   `fiscal-tg-*`. Sur une base semée **avant** 940, on joue une fois la migration du catalogue :
   `npm run migrate:familles-fiscales` (ou `node dist/migrations/familles-fiscales-de-declarations.js` dans l'image).
   Elle ajoute seulement, et nomme les paquets pas encore déposés au registre. Plus de `PATCH` à la main.
4. **Octroyer** à chaque cabinet abonné :
   `PUT /entitlements/<organisationId>/declarations`, corps `{ "versionCode": "1.0", "status": "ACTIVE", "referentiels": [{ "code": "fiscal-tg-entreprise", "version": "2026.1" }, …] }`.
   Un utilisateur du cabinet ne voit les droits qu'après le **renouvellement** de son jeton.
5. **Contrôler.** fiscal-service sert le paquet d'un exercice (`GET …/exercices/:exerciceId/paquet-fiscal`) avec la
   même empreinte ;
   `balance-service` applique le même artefact.

**Toute modification ultérieure du paquet** passe par une **nouvelle version** (`2026.2`…), publiée par les étapes 1
à 4. L'ancienne passe ensuite en `DEPRECATED` (`PATCH /admin/referentiels/<code>/<version>`). Elle ne passe **pas** en
`RETIRED` tant que des exercices y sont rattachés : le catalogue cesse alors de la servir et de l'octroyer.

## Pièges rencontrés

- **Gate front sur la vraie pile (FE-069, 18/11)** :
  - les courriels de l'IdP passent par `notification-service` : sans lui, le courriel de vérification n'arrive jamais
    (« Échec de remise du job send-verification-email : TypeError » dans auth) ;
  - au catalogue, `bilan` exige `balance` (`422 MODULE_DEPENDANCE_MANQUANTE` si on octroie dans l'autre ordre) ;
  - `expert-comptable` plante sans `NODE_ENV: production` (`pino-pretty`) ;
  - les axes du dossier arrivent à balance par Kafka : réessayer l'analyse d'import quelques secondes ;
  - les images ont été construites depuis `git -c core.autocrlf=false archive origin/dev` dans le scratchpad, avec une
    surcouche `build.context` : aucun checkout d'un autre groupe n'est touché.
- **Vitest** se lance depuis `C:\…` en majuscule (PowerShell `Set-Location`) ; depuis Git Bash, « no tests ».
- Un `\b` écrit par un script Python dans une chaîne non brute devient un caractère de contrôle (0x08) : la regex
  compile et ne reconnaît plus rien. Écrire les regex par l'outil d'édition, ou en chaîne brute.

- **`bilan-service` aussi** : ses 72 JSON sortent en CRLF sous `core.autocrlf=true` ; son image refuse alors ses
  référentiels (« checksum invalide », 502 à la remise de `balance.created`). Il faut ré-extraire en LF
  (`git -c core.autocrlf=false checkout --`) AVANT de construire l'image.

- **Une suite qui ne COMPILE pas n'apparaît pas dans un filtre `grep "●.*›"`** : « Tests: 47 passed » venait des
  AUTRES suites. Il faut toujours lire `Test Suites: … failed` et lancer le fichier seul.

- **Un témoin « avant la correction » fait par `git switch dev` est FAUX** : le switch emporte les modifications
  non commitées, et `compose up --build` peut même ne pas recréer le conteneur (« Running »). Il faut mettre de côté
  (`git stash push -u`), puis `up --build --force-recreate`, et vérifier dans l'image que le code neuf est absent.
- **Un test qui compare à la constante qu'il teste ne mord pas** : la mutation de la borne du fan-out l'a montré. La
  valeur attendue s'écrit dans le test.

- **Deux sessions « groupe A » sur le même poste (2026-11-15)**. La même consigne a été donnée à deux sessions,
  qui ont codé STORY-345 dans le **même checkout** et se sont écrasé les fichiers. L'utilisateur a tranché : **une
  seule session porte le lot** (`moneyvibes-apps-32`). Avant d'écrire dans un dépôt partagé du poste : `git status`,
  et si des fichiers qu'on n'a pas écrits apparaissent, `ListAgents`, puis s'arrêter.
- `@Prop` de `@nestjs/mongoose` sur un champ typé par une **union** (`'A' | 'B'`) fait échouer le **chargement du
  module** (« Cannot determine a type »). `tsc` ne le voit pas ; l'invariant `app.module` et `docker compose up` le
  voient. Il faut toujours `type: String` avec un `enum`.

- La recette de `prospera-recette` fait `up` **sans** `--build` : reconstruire à la main l'image du service modifié.
- `prospera-fiscal-service` : `test:conformite` exige un MongoDB en jeu de répliques ; un `mongo:7` jetable lancé avec
  `mongo/demarrer-mongo-fiscal.sh` (scripts en LF), `-p 127.0.0.1:27020:27017`, `MONGO_HOTE_ANNONCE=localhost:27017`.
- La suite unitaire du fiscal est instable en parallèle complet : `-w 2`.
- Scripts `mongo/` de fiscal-service en CRLF sur Windows : le conteneur `mongo-fiscal` ne démarre pas. Faire
  `git -c core.autocrlf=false checkout -- mongo/`.
- Jouer une commande de fiscal-service sans lever toute la pile :
  `docker compose -p grp-a -f docker-compose.yml -f prospera-recette/docker-compose.recette.yml -f prospera-recette/docker-compose.fiscal.yml --profile fiscal run --rm --no-deps fiscal-service node dist/<script>.js`
  (après `up -d --no-deps mongo-fiscal`).
