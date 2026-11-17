# STORY-929 : clôture du lot 3 de A — la recette croisée complète, `POST /installations` éprouvé

Status: done

**Complexité :** moyenne (la recette seule ; aucun service touché)

**Dette :** n° 3 de STORY-918 (« la recette installe par le moteur, plus par le `PUT` de la console »)
**Dépôt :** `prospera-recette` seul (règle de légèreté du lot 3 : ni service, ni contrat neuf)
**Plage :** groupe A, lot 3, n° 10 et dernière (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 : « la recette installe par le
moteur, plus par le `PUT` de la console ; recette croisée complète verte sur pile neuve, **jouée une fois** »). Fiche écrite avant de coder.

---

## Étape 0 — faisabilité, lue dans le code du catalogue sur `origin/dev` (`5004cc5`)

**Ce que `POST /installations` appelle sur un module du cabinet** (`platform-catalog-service`, `src/installation/`) :

1. `PlansService.lancer` : manifeste du module au catalogue (`MODULE_INCONNU` sinon), axe 2 (`MODULE_DEJA_INSTALLE`, `INSTALLATION_EN_COURS`),
   point de décision unique (`MODULE_NON_SOUSCRIT` : l'**offre** doit contenir le module, `PUT /offres/{organisationId}` ; dépendances dures).
2. Un plan enregistré, étapes par module : `INSCRIRE` (axe 2 `EN_INSTALLATION`) → **une étape `VERIFIER` par vérification déclarée au manifeste** →
   `OUVRIR` (droit `ACTIVE` + axe 2 `INSTALLE`).
3. `VerificationsParHttp` : `POST <INSTALLATION_SERVICES[module]>/api/v1/instance/<code>/{organisationId}/verifications/<verification>`, corps `{}`,
   en-tête `Idempotency-Key`, jeton de service. **Seul un 200 au corps `verification-installation@1` et au voyant `VERT` passe** ; tout le reste
   (service sans adresse `SERVICE_NON_CONFIGURE`, injoignable, délai, statut ≠ 200 — dont le **404 d'une route absente** —, corps hors contrat,
   ORANGE, ROUGE) est `NON_EXECUTEE` ou un échec : **jamais une réussite** (FR-6). Seul un plan `CONSOLE_PUT` **diffère** une vérification
   `SERVICE_NON_CONFIGURE` (`verificationDifferee`) : « Un plan de `POST /installations` ne diffère jamais rien ».
4. Un échec bloque son module (le plan reste `EN_ATTENTE`, « Réessayer »), le module reste `EN_INSTALLATION` : fermé aux utilisateurs.

**Ce que le catalogue déclare pour les modules du cabinet** (`copies.json`, manifestes semés au démarrage) :

| Module | Vérifications déclarées | Servies aujourd'hui ? |
|---|---|:--:|
| `balance` | `referentiel-resolu`, `paquet-fiscal-disponible`, `balances-equilibrees` | non |
| `bilan` | `referentiel-resolu`, `snapshots-intacts`, `consommateurs-actifs` | non |
| `conseil` (dans `balance-service`) | `aucun-scenario-applique`, `gate-conseil` | non |
| `consolidation` | `perimetre-arrete`, `ecritures-equilibrees`, `gate-consolidation` | non |
| `declarations` | `paquet-fiscal-publie`, `bilan-joignable`, `depots-sans-preuve` | non |
| `instance` | aucune (toujours installé) | sans objet |

**Ce que les services servent** (code lu sur `origin/dev` : balance `98078b0`, bilan `1651d33`, dossier `768a4aa`, fiscal `4ee8ed7`) :
`POST /api/v1/instance/{balance|bilan}/{organisationId}/import` et `/effacement` (STORY-928). **Aucune** route `…/verifications/…`, `sante`, `export`,
`migrer` (`git grep verifications` ne trouve rien dans balance ni bilan). `dossier`, `fiscal` et `kyc` ne sont pas des modules du catalogue :
rien à installer.

## Décision

- **D-929-1 — (b) : la recette garde le `PUT` de la console pour installer le cabinet, et l'écrit.** Le moteur ne peut pas ouvrir `balance` ni `bilan`
  par `POST /installations` tant que **six routes de vérification** (3 dans balance, 3 dans bilan) ne répondent pas : sans elles, chaque plan
  s'arrête `EN_ATTENTE` et le module reste fermé. Ce sont de **petites routes chez A**, mais coder six vérifications chiffrées (référentiel résolu
  par dossier, balances recalculées, empreintes de snapshots, consommateurs Kafka…) dans deux services est une story de service, que la règle de
  légèreté interdit de déguiser en clôture de recette. **Rien n'est bloqué chez B** (catalogue et moteur font leur travail : le test le prouve).
  Bascule de ce qui peut l'être : le **parcours** s'enrichit (ci-dessous) et le moteur est **éprouvé par `POST /installations` lui-même**, dans son
  refus honnête. Le `PUT` quitte la recette dans la story nommée au journal de A (**STORY-1080**, « les routes de vérification de balance et de
  bilan », id proposé : max 1079 = D ; la plage suivante de A reste à fixer par le plan suivant).
- **D-929-2 — l'ESPACE de la pile est un réglage, `RECETTE_ESPACE` (défaut `REEL`).** La consigne pensait poser `INSTANCE_ESPACE=ESSAI` sur balance et
  bilan seuls. Le code dit autre chose : **un service ne lit que le topic de son espace** (`etat-publie.changed.<espace>`, AD-24) ; balance et
  bilan seuls en `ESSAI` ne verraient jamais l'état publié (`REEL`) du catalogue, et `cabinet-moteur` rougirait (`BALANCE_NOT_ENTITLED`). L'espace est
  donc posé **sur tous les services qui lisent l'état publié** (catalogue, notification, paiement, balance, bilan, dossier, fiscal), par une seule
  variable. Par défaut la pile **représente le réel** ; `RECETTE_ESPACE=ESSAI` n'est posé que pour la recette qui joue la démonstration C13
  (la matrice de l'état publié ne distingue les espaces que pour `import`, `reprise` et `controles` : le reste est inchangé).
- **D-929-3 — images construites depuis `origin/dev` par `git archive`, pas depuis les checkouts.** Les checkouts du poste sont sur d'autres
  branches (`MNV-924`, `MNV-922`, `MNV-1005`…) et appartiennent à d'autres sessions (catalogue, paiement, notification, auth : B ; document : C). Les
  mettre à jour en ff-only reviendrait à y déplacer le travail des autres. Chaque contexte de build est donc une extraction
  `git -c core.autocrlf=false archive origin/dev` (LF des référentiels JSON, aucun « barrel » non suivi), reliée à la pile par une surcouche
  (`RECETTE_SURCOUCHES`) hors dépôt. Même effet (« on recette ce qui est livré »), aucun checkout touché.

## Ce que la story livre

1. **Profil** : `INSTANCE_ESPACE: ${RECETTE_ESPACE:-REEL}` sur catalogue, notification, paiement, balance, bilan, dossier (`docker-compose.recette.yml`)
   et fiscal (`docker-compose.fiscal.yml`). La garde du profil (« des réglages, jamais un état ») est étendue : quatre services de plus, une seule
   variable chacun, jamais `ESSAI` en dur.
2. **`cabinet-moteur`** (même cabinet, même dossier), à la suite des quatre tests de 918 :
   - **`POST /installations` éprouvé** : l'offre (`conseil`, qui dépend de `balance`), le plan se joue seul et s'arrête `EN_ATTENTE`, chaque
     vérification `ECHEC` / `NON_EXECUTEE`, l'étape `OUVRIR` jamais jouée, ligne du bilan non `VERT`. Quand A servira les routes (STORY-1080), ce
     test s'inverse.
   - **STORY-924** : la complétude du dossier sans NIF ni RCCM le dit (`pretPourDsf: false`) et n'empêche rien.
   - **STORY-923 contre le vrai `dossier-service`** : le BFF relaie `PATCH /dossiers/{id}` (la complétude change, la version avance), puis **`409
     CONFLIT_CONCURRENT` relayé sans texte (le `message` n'est que le code)** sur la version périmée, rien d'écrit. (923 n'avait que des e2e au client simulé.)
   - **STORY-928** (espace d'essai seulement) : jeton du moteur par `POST /api/v1/interne/jetons-de-service` ; import de `cabinet-demo-togo`
     (`profil-societe` puis `balance`, `IMPORTE`, rejeu `DEJA_IMPORTE`) ; un jeton d'utilisateur reçoit 403, sans jeton 401 ; `bilan` refuse tout
     objet (422 `OBJET_INCONNU`, D-927-1) ; effacement `EFFACE` puis `DEJA_EFFACE` sur balance et sur bilan. L'habilitation de référentiel de
     l'import (`orgbalanceentitlements`) est **produite par l'installation** du module `balance` (le `PUT` pose le référentiel au droit) : rien posé à la main.
3. **Preuve** : tests de la recette (garde du profil) verts, mutation rouge sur l'assertion ; **une recette croisée complète sur pile neuve** (résultat
   ci-dessous).

## Critères d'acceptation

- **AC-1** : la recette dit pourquoi le cabinet s'installe encore par le `PUT`, et l'éprouve : `POST /installations` ne rend jamais un module ouvert
  dont les vérifications ne répondent pas.
- **AC-2** : la pile représente le réel par défaut ; `ESSAI` seulement sur demande, partout à la fois.
- **AC-3** : le relais BFF `PATCH /dossiers/{id}` est joué contre le vrai `dossier-service` (succès et 409 sans texte : le `message` n'est que le code) ; la complétude est jouée.
- **AC-4** : l'import et l'effacement C13 du jeu `cabinet-demo-togo` sont joués sur balance et bilan réels, jeton du moteur d'`auth-service`.
- **AC-5** : **toute** la recette croisée (pile, zone-franche, atelier-balance, referentiel-par-dossier, abonnement, cabinet-moteur, distributeur,
  facturation, délégation, renvoi du lien) est verte, jouée d'un bout à l'autre sur pile neuve, images reconstruites depuis `origin/dev`.

## Definition of Done

- [x] Tests du paquet (`npm test`) et `tsc`/prettier verts ; mutation de la garde du profil rouge sur l'assertion.
- [x] Recette croisée complète verte sur pile neuve (`COMPOSE_PROJECT_NAME=grp-a`, volumes neufs, `down -v` ensuite).
- [x] PR code fusionnée en rebase sur `dev` ; PR de docs (fiche, tracker, journal, bilan du lot) fusionnée.

## Livraison

🏁 **DONE (2026-11-17)** — prospera-recette #25 (dev `f7944dc`, deux commits rejoués : `df3009a`, `f7944dc`). Aucun service touché.

- **Recette croisée complète, jouée une fois sur pile neuve : 10 suites sur 10, 134 tests sur 134, 1 044 s** (`pile`, `zone-franche`, `atelier-balance`,
  `referentiel-par-dossier`, `abonnement`, `cabinet-moteur` — 8 tests dont les 3 neufs de la clôture et 2 de C13 —, `distributeur`, `facturation`, `delegation`,
  `renvoi-du-lien`). `COMPOSE_PROJECT_NAME=grp-a`, `RECETTE_ESPACE=ESSAI`, volumes neufs (`down -v` avant), images des **onze** services construites depuis
  `origin/dev` par `git archive` (auth `a30e78f`, kyc `d4932c6`, catalogue `5004cc5`, notification `5e6c553`, paiement `1e90517`, balance `98078b0`, bilan `1651d33`,
  dossier `768a4aa`, fiscal `4ee8ed7`, admin-panel `18a9893`, plateforme `e958bd6` pour le jeu), fiscal en surcouche. `down -v` ensuite : plus aucun conteneur,
  volume ni réseau `grp-a` ; verrou rendu.
- **Essais avant la recette finale : 3.** (1) premier passage : deux assertions fausses de ma recette (les étapes `VERIFIER` suivant la première restent `A_FAIRE`, pas
  `ECHEC` ; le `409` du BFF porte le **code** dans `message`, il ne l'omet pas — 923 l'écrit) + un `ECONNRESET` sur le relais mail de `abonnement` ; (2) second passage sur pile
  neuve : `cabinet-moteur` rougit en `ECONNRESET` partout sur `localhost` pendant ~2 min (poste à **691 Mo libres**, services `healthy`) ; (3) `cabinet-moteur` seul sur la même pile :
  le même `ECONNRESET` (mailhog). `docker desktop restart` a rendu 3,4 Go ; la pile neuve qui a suivi est la preuve.
- Tests du paquet : 93/93, garde étendue comprise, `tsc` et prettier verts ; **mutation** : `INSTANCE_ESPACE: ESSAI` en dur sur balance ⇒ la garde du profil rougit sur
  l'assertion (`Expected substring: "INSTANCE_ESPACE: ${RECETTE_ESPACE:-REEL}"`).
- Ce que la recette ne prouve pas : la **validation** de la balance importée et sa réception par bilan (le dossier de démonstration n'existe que dans balance, ticket
  `dossier-de-demonstration-sans-creation-par-le-moteur`) ; le `PUT` reste le chemin d'installation du cabinet (D-929-1, ticket `verifications-de-balance-et-de-bilan-non-servies`, STORY-1080).
- Pièges : (1) la consigne « `INSTANCE_ESPACE=ESSAI` sur balance et bilan » ne suffit pas : un service ne lit que le topic de son espace (D-929-2). (2) Le compose publie
  `abonnement` avant `cabinet-moteur` selon la durée des suites : l'ordre des suites n'est pas l'ordre alphabétique. (3) `COMPOSE_PARALLEL_LIMIT=2` pour construire onze images : à onze
  en parallèle, `npm ci` a fait tomber le moteur Docker (500 sur toute l'API). (4) Un `docker desktop restart` est le remède, pas `wsl --shutdown` seul.
