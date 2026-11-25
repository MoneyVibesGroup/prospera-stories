# STORY-1021 : les routes d'instance `export`, `sante` et `migrer` de la balance

Status: done

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §3, amendement du 2026-11-25, n° **0c** (ligne d'origine :
`PLAN-LOT-6-2026-11-23.md` §4, amendement D-L6-5, n° 10 — « Fini quand : les trois routes répondent au contrat du moteur ;
la garde des manifestes reste verte »). **Dépôt :** `prospera-balance-service` (tenu par C ; `origin/dev` au départ :
`ab4e468`, STORY-1019) · **Plage :** groupe C, 1021 (réservée au tracker) · **Ordre de C :** 1020 ✅ → 1019 ✅ → **1021**
→ 564 → 1022 → 1023 (564 avancée le 25/11 à 21:50 : 348 de D l'attend).
**Sources :** `manifestes/balance.manifest.ts` (1.2.0 : `routesInstance.export`, `.sante`, `migrer`, `routesLectureSeule`,
C7 « l'export de l'organisation reste réservé à `instance:donnees:exporter` ») ; `CONTRAT-DE-MODULE-2026-11-09.md` C2
(« l'export passe toujours », seul `NON_INSTALLE` le refuse) et C13 (points 3 et 7) ; spine du moteur AD-21 (santé
`DEGRADE`), AD-33 (`migrer`), AD-37 ; `prospera-plateforme@contrats-instance-v1` (5a50249) :
`contrats/reprise/sante.schema.json` (`sante@1`) ; la matrice `garde-etat-publie-v1` déjà copiée dans le service (sortes
`export` et `sante`). **Patron le plus proche : `STORY-1075`** (D, bilan-service : les mêmes trois routes, D-1075-1 → 13 ;
`prospera-bilan-service` `993b78f`, `4317dd2`) ; dans balance, la route d'instance des vérifications (STORY-1080) et celle
du conseil (STORY-1019). Code d'`origin/dev` : `instance-c13.controller.ts` (vérifications, import, effacement : l'identité
du moteur seule), `plan-d-effacement.ts`, `effaceur.ts`, `health/indicators/kafka.health.ts`,
`migration/dossiers-migration.service.ts` (STORY-356, 402, 529), `migration/profils-migration.service.ts` (STORY-529).
**Réponses du PO appliquées (journal de D, rituel de STORY-560, 2026-11-25) :** **Q-D-18 → 20 validées, « avec le CSV
en plus »** — l'export reste au moteur (Q-D-18), `migrer` garde sa route sans corps (Q-D-20), l'export sort **aussi en
CSV** (Q-D-19, C13 point 7) ; les contrats restent à publier par B dans `prospera-plateforme/contrats/instance/`.
**Rituel (2026-11-25) :** aucune demande neuve à C chez A, B et D qui porte sur cette story (celle de A, FE-158, vise
`prospera-comptabilite-service`, non bloquante, à placer au lot 7 quand l'utilisateur l'ouvre).

## Ce qui existait déjà

`instance/balance` sert `import`, `effacement` (STORY-928, essai seul) et `verifications/{code}` (STORY-1080, deux
espaces), sous l'identité de service du moteur seule ; `instance/conseil` sert les vérifications du conseil (STORY-1019).
**Aucune** route `export`, `sante` ni `migrer` : le manifeste les déclare « à créer ». Les deux migrations du service ne
se jouent que par la ligne de commande (`npm run migrate:dossiers`, `migrate:profils`). Bilan sert les trois routes depuis
STORY-1075, sur la forme par défaut que le PO vient de valider (JSON seul ; le CSV n'y est pas encore).

| Route | Chemin (manifeste) | Contrat publié | Ce qui manque |
|---|---|---|---|
| santé | `GET /api/v1/instance/balance/{organisationId}/sante` | **`sante@1`** ; matrice : sorte `sante` ouverte au `MOTEUR` dans les neuf états | rien |
| export | `GET /api/v1/instance/balance/{organisationId}/export` | aucun schéma ; C2 : ouvert sauf `NON_INSTALLE` (403 `<MODULE>_NOT_ENTITLED`) ; C13 : « en CSV et JSON » ; matrice : sorte `export` | la forme du corps (Q-D-19 : défaut de 1075 validé, plus le CSV) |
| migrer | `POST /api/v1/instance/balance/migrer` | aucun schéma ; AD-33 : idempotent, additif, appelé par l'agent sous verrou | la demande, la réponse, l'échec (Q-D-20 : défaut de 1075 validé) |

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | `GET …/{organisationId}/sante` rend 200 `sante@1` (relu par Ajv contre la copie à l'octet) : `OK`, ou `DEGRADE` avec sa `raison` quand MongoDB n'est pas connecté, que le broker Kafka ne répond pas ou qu'un consommateur est hors de son groupe ou bloqué ; jamais un refus pour la santé ; dans les deux espaces, quel que soit l'état publié | specs ; e2e ; pile `grp-c` (Kafka arrêté) |
| AC-2 | `GET …/{organisationId}/export` rend 200 l'export JSON de ce que le module `balance` tient de l'organisation (chaque objet du plan d'export, son nombre, ses documents), et rien d'une autre organisation ni du module `conseil` ni des copies des voisins ; état publié absent ou `NON_INSTALLE` ⇒ 403 `BALANCE_NOT_ENTITLED`, aucune donnée lue ; tout autre état (dont `SUSPENDU`, `LECTURE_SEULE`, `ESSAI_TERMINE`) ⇒ 200 ; dans les deux espaces | specs ; e2e ; pile `grp-c` |
| AC-3 | **Le CSV** (Q-D-19) : `?format=csv&objet=<objet>` rend un objet du plan en `text/csv` (BOM, `;`, CRLF, cellules de texte neutralisées puis échappées, comme les autres CSV du service) ; `objet` filtre aussi le JSON ; `format` hors `json` / `csv` ⇒ 400 `FORMAT_NON_SERVI` ; CSV sans `objet` ⇒ 400 `OBJET_REQUIS` ; objet hors du plan ⇒ 422 `OBJET_INCONNU` avec les objets servis — sans rien lire | specs ; e2e ; pile |
| AC-4 | Le plan d'export couvre le plan d'effacement : chaque collection effacée est exportée, ou écartée **avec sa raison** (invariant) | invariant |
| AC-5 | `POST …/migrer` joue les migrations du service dans l'ordre (`dossiers-d8`, puis `profils-529`), idempotent : rejoué, rien de plus ; 200 `MIGRE` avec les deux rapports ; un orphelin ou un profil non rattaché ⇒ 409 `MIGRATION_INCOMPLETE` avec les rapports ; le rejeu ne republie pas les profils des cabinets déjà connus ; dans les deux espaces | specs ; e2e ; pile `grp-c` |
| AC-6 | Les trois routes : l'identité `MOTEUR` seule (jeton d'utilisateur ⇒ 403 `IDENTITE_DE_SERVICE_REQUISE`, même `TENANT_ADMIN` ou `PLATFORM_ADMIN`) ; `export` et `sante` limitées à l'organisation du chemin (403 `ORGANISATION_HORS_JETON`) ; sans jeton 401 ; hors limite de débit | e2e ; pile `grp-c` |
| AC-7 | Export, effacement, import : l'aller-retour **si le contrat le permet** — il ne le permet pas pour `balance` (l'import ne prend que les objets du jeu de démonstration, D-1021-12) : la preuve montre l'export, l'effacement, l'export refusé après (plus d'état publié), l'import d'un objet exporté refusé | pile `grp-c` |
| AC-8 | Le manifeste ne change pas : la garde des manifestes du catalogue reste verte | `git diff` nul sur `manifestes/` |

## Décisions retenues par défaut (contestables)

- **D-1021-1 — Trois handlers de plus sur le contrôleur existant `instance/balance`**, sous la règle de l'import, de
  l'effacement et des vérifications (D-928-1, D-1080-8, D-1075-1) : `@AdmetIdentitesDeService('MOTEUR')`, hors des
  gardes métier (`BalanceAccessGuard`, `ConseilAccessGuard`, `DossierScopeGuard`), sans limite de débit ; **aucun
  contrôleur neuf**. **Les deux espaces** (pas `exigerEssai`) : l'export est un droit du client au réel, la santé sert la
  supervision des deux, `migrer` se joue dans l'essai puis dans le réel (AD-33).
- **D-1021-2 — `export` et `sante` : `exigerLeMoteur`** (limité à l'organisation du chemin). **`migrer` : le moteur, sans
  organisation** : la route n'en porte pas, la migration vaut pour le service entier (Q-D-20 validée).
- **D-1021-3 — L'utilisateur détenteur de `instance:donnees:exporter` n'est pas servi** (Q-D-18 validée : l'export de
  l'écran Administration passe par la partie A, AD-37) : 403 `IDENTITE_DE_SERVICE_REQUISE`.
- **D-1021-4 — L'export applique la matrice de l'état publié** (sorte `export`, identité `MOTEUR`, espace de l'instance),
  lue dans `etats_publies_balance` : absent ⇒ `NON_INSTALLE` ⇒ 403 **`BALANCE_NOT_ENTITLED`** (le code de la garde de
  balance, rendu ici par la route), aucune donnée lue ; ailleurs ouvert. La route n'entre pas dans
  `ROUTES_D_EXPORT_ET_D_ETATS` (la liste des routes métier que garde `BalanceAccessGuard`) : elle décide elle-même par la
  même matrice (D-1075-4). L'état de `conseil` n'est pas lu : l'export est celui du module `balance`.
- **D-1021-5 — Ce qui s'exporte : ce que le module `balance` écrit et garde** (`PLAN_D_EXPORT`, 32 collections, dans
  l'ordre du plan d'effacement) : balances, ingestions, exercices de l'Atelier, profils d'import, cahiers et leur mémoire
  des choix, pièces OCR (métadonnées : les fichiers sont à `document-service`), calculs fiscaux réels (retraitements,
  déficits, acomptes, crédits, taxes, TPU), immobilisations, créances et dettes en devises, trésorerie et rapprochement,
  profil société et sa piste d'audit, référentiels épinglés. **Écartés avec leur raison** : les scénarios et le journal des
  dossiers de justification (module **`conseil`**, vendu à part, sa propre route d'export au manifeste M38) ; les copies
  des voisins (dossiers, axes, exercices du dossier, options normatives, KYC, droit) ; les états publiés (tenus par la
  partie A) ; `outbox_events` (transit) ; `instance_c13_imports` (registre interne). L'invariant lit le plan d'effacement :
  une collection ajoutée demain ne s'oublie pas.
- **D-1021-6 — La forme JSON : celle de bilan** (Q-D-19 validée), `{ schemaVersion: 1, module: 'balance', organisationId,
  espace, exporteLe, objets: [{ objet, collection, nombre, enregistrements }] }`, chaque document en **MongoDB Extended
  JSON (relaxed)** ; l'objet porte le nom C13 de sa collection (`balance_ingestions` ⇒ `balance-ingestions`, D-1075-13).
  Les deux formes d'identifiant sont lues (ObjectId et chaîne, §1.9), comme l'effacement. Format par défaut : `json`.
- **D-1021-7 — Le CSV (réponse du PO à Q-D-19) : un objet par fichier.** `?format=csv&objet=<objet>` ⇒ `text/csv;
  charset=utf-8`, pièce jointe `export-balance-<objet>-<organisationId>.csv`, `Cache-Control: no-store`. Les règles de
  format sont celles des autres CSV du service (`fiscal/export-liasse.regles.ts` : BOM UTF-8, `;`, CRLF, échappement RFC
  4180, neutralisation des formules) : une ligne d'en-tête (les chemins des champs, dans l'ordre où ils apparaissent),
  puis une ligne par document. Un sous-document s'aplatit en `a.b` ; une valeur Extended JSON (`{ "$oid": … }`,
  `{ "$date": … }`, `{ "$numberDecimal": … }`…) est une feuille (sa valeur) ; un tableau s'écrit en JSON dans sa cellule ;
  absent ou `null` ⇒ cellule vide. Le texte est neutralisé puis échappé ; un nombre ou un booléen est seulement échappé.
  Pourquoi un objet par fichier : des collections différentes n'ont pas les mêmes colonnes, et une réponse HTTP n'a qu'un
  fichier ; le moteur appelle la route une fois par objet (la liste est dans le JSON). `objet` filtre aussi le JSON.
- **D-1021-8 — Les refus de l'export avant toute lecture** : `format` hors `json` / `csv` ⇒ 400 `FORMAT_NON_SERVI` ; CSV
  sans `objet` ⇒ 400 `OBJET_REQUIS` ; `objet` hors du plan ⇒ 422 `OBJET_INCONNU` (`details.objetsServis`). Puis l'état
  publié.
- **D-1021-9 — La santé, celle de bilan** (`sante@1` copié à l'octet de `contrats-instance-v1`,
  `contrats/reprise/sante.schema.json`, sha256 `74b74a6c…`) : `DEGRADE` si MongoDB n'est pas connecté (`readyState`) ou
  si la **sonde Kafka de `/health`** (`KafkaHealthIndicator` : broker borné à 5 s, puis chaque consommateur dans son
  groupe et non bloqué) est en bas ; `raison` les nomme (bornée à 512) ; sinon `OK`. Toujours 200 (C13 point 3) ; l'état
  publié n'est pas lu.
- **D-1021-10 — `migrer`** (Q-D-20 validée) : sans corps ; joue dans l'ordre **`dossiers-d8`** (`DossiersMigrationService`,
  STORY-356/402 : index obsolètes retirés, `dossierId` posé, orphelins comptés) puis **`profils-529`**
  (`ProfilsMigrationService`, STORY-529 : profils et brouillons OCR rattachés au dossier « Mon cabinet », ancien index
  retiré) — les deux migrations du service, toutes deux idempotentes ; 200 `{ schemaVersion: 1, module: 'balance',
  statut: 'MIGRE', migrations: [{ code, ...rapport }, …] }` ; un orphelin (`aDesOrphelins`) ou un profil non rattaché
  (`enErreur`) ⇒ **409 `MIGRATION_INCOMPLETE`** avec les deux rapports (l'agent arrête son plan, la commande se rejoue).
  Les deux se jouent toujours (chacune rapporte ce qui reste). Les commandes `npm run migrate:*` restent ; rien ne se
  joue au démarrage.
- **D-1021-11 — Par la route, `dossiers-d8` ne republie que les profils des cabinets inconnus.** Sa phase 1 publie
  `profil.societe.consolide` pour chaque profil du cabinet, à chaque passage, pour que `dossier-service` crée le dossier
  « Mon cabinet » ; par la ligne de commande, c'est voulu (rattrapage). Appelée par l'agent à chaque promotion, elle
  republierait tous les cabinets à chaque fois, et chaque republication relance une projection chez les voisins. Une
  option de l'exécution (`publication: 'CABINETS_INCONNUS'`) ne publie que les profils dont l'organisation n'a pas
  encore de dossier « Mon cabinet » dans la copie locale ; la commande garde `'TOUS'` (inchangée). Le rapport dit le mode
  joué. Rejouée sur une base convergée, la route ne publie rien.
- **D-1021-12 — L'aller-retour n'est pas possible pour `balance`, et c'est écrit** : l'import C13 ne prend que les objets
  du jeu de démonstration (`profil-societe`, `balance`, source `JEU_DEMONSTRATION`, dossier tenu par `dossier-service`,
  STORY-1082), pas un export. La preuve d'AC-7 montre ce que le contrat permet.
- **D-1021-13 — Quatre codes de refus neufs** à `CODES_REFUS_C13` : `BALANCE_NOT_ENTITLED` (celui de la garde de balance,
  rendu par la route d'export), `MIGRATION_INCOMPLETE`, `FORMAT_NON_SERVI`, `OBJET_REQUIS` ; `OBJET_INCONNU` existe.
- **D-1021-14 — Le manifeste ne change pas** : les routes sont servies aux chemins qu'il déclare ; ses commentaires « à
  créer » restent (les retoucher changerait l'empreinte et demanderait une recopie au catalogue) ; la garde des manifestes
  reste verte. Écrit dans « Ce qui reste ».
- **D-1021-15 — Les routes d'instance du module `conseil`** (export, import, effacement, santé, `migrer`) ne sont pas dans
  cette ligne du plan (D-1019-6) : écrit dans « Ce qui reste ».
- **D-1021-17 — L'aller-retour, vu sur la pile** (complète D-1021-12) : un enregistrement exporté tel quel (`_id`,
  enveloppes Extended JSON) n'a pas la forme d'un enregistrement C13 (`import-c13-demande@1` n'admet que des champs
  `^[a-z][A-Za-z0-9_]*$`) : 422 `SCHEMA_NON_CONFORME` ; réduit à des champs admis, l'objet `balances` n'est pas importable :
  422 `OBJET_INCONNU`. L'export sert la restitution des données du client, pas une réinstallation.
- **D-1021-18 — La garde STORY-529** (`lecture-profil-par-dossier.spec.ts`, liste fermée des fichiers qui nomment
  `profils_societe`) admet `plan-d-export.ts` (balayage par nature, au filtre de l'effacement), comme
  `plan-d-effacement.ts` : la liste passe de 7 à 8. *Vu sous Node 24* : la suite entière l'a rougie au premier passage
  (second commit).
- **D-1021-16 — Docker :** `MigrationModule` exporte ses deux services, importé par `InstanceC13Module`, avec
  `TerminusModule` et `KafkaHealthIndicator` (un module Nest change) ; aucune dépendance ni Dockerfile. Le démarrage réel
  et le comportement de bout en bout sont prouvés sur une pile `grp-c` (deux instances, `REEL` et `ESSAI`), qui vaut le
  `docker compose up` du §1.5 (comme D-1019-12).

## Contrat annoncé avant le code

« ⚠ Contrats » du journal de C (entrée STORY-1021) : trois routes d'instance neuves (l'export en JSON et en CSV), quatre
codes de refus neufs, une copie de contrat neuve (`sante@1`) ; aucune question neuve au PO (Q-D-18 → 20 répondues).

## Preuves

**Livré :** prospera-balance-service#167, fusionnée en rebase le 2026-11-25 (`head` `735ff8a`, rejoué sur `dev` en
**`b52d262`** (les trois routes) et **`465a308`** (la garde STORY-529 admet le plan d'export), arbre de `dev` identique au
`head` poussé) ; annonce « ⚠ Contrats » prospera-stories #916 (`main` `728c34e`) avant le code.

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive`) : sur `6676abc`,
  unitaires 296/297 suites (la garde STORY-529 rouge, D-1021-18), **e2e 37/37 suites, 2291 tests**, `nest build` 0 ; sur
  `735ff8a`, **unitaires 297/297 suites, 5691 tests** (2 suites sautées, comme sur `dev`). Lint des fichiers touchés : 0 ;
  `tsc --noEmit` 0.
- **Specs neuves** : `export-c13.spec` (état absent, `NON_INSTALLE`, état inconnu, version de matrice inconnue ⇒ 403 sans
  rien lire ; les huit autres états ⇒ 200 dans les deux espaces ; l'enveloppe, l'ordre, les noms d'objet ; `objet` filtre ;
  le CSV et son nom ; les refus de la demande avant toute lecture ; le lecteur MongoDB : les deux formes d'identifiant,
  l'organisation seule, tri, Extended JSON relaxed) ; `export-csv.spec` (BOM, `;`, CRLF, colonnes dans l'ordre
  d'apparition, sous-documents aplatis, tableaux en JSON, valeurs Extended JSON d'un vrai document en feuilles, texte
  neutralisé puis échappé, nombres jamais neutralisés) ; `plan-d-export.invariant.spec` (le plan d'export couvre le plan
  d'effacement ; rien du conseil, des voisins, de l'état publié ni de l'outbox) ; `sante-c13.spec` (la vraie sonde Kafka,
  broker doublé : OK, broker injoignable, consommateur hors groupe, bloqué, MongoDB en cours de connexion ; raison bornée ;
  `sante@1` relu par Ajv) ; `migrer-c13.spec` (ordre, mode `CABINETS_INCONNUS`, 409 sur orphelins ou profils non
  rattachés, les deux jouées) ; `dossiers-migration.service.spec` (+4 : `TOUS` par défaut, `CABINETS_INCONNUS`, base
  convergée, organisation en chaîne) ; `copie.invariant.spec` (six copies, `sante.schema.json` à l'octet) ; e2e
  `instance-c13` : 36 tests (8 neufs : export JSON et CSV, refus, états, santé, `migrer`, 401/403, autre organisation,
  hors limite de débit).
- **Mutations : 32/32 tuées par une assertion** (aucune par compilation) : NON_INSTALLE ouvert, décision ignorée, version
  de matrice ignorée, espace inversé, nombre faux, tri inversé, filtre de l'organisation effacé, EJSON strict, un objet de
  moins, le conseil exporté, CSV sans objet admis, objet ignoré, nom d'objet = collection, CSV non neutralisé, décimal
  neutralisé, nombre neutralisé, tableau aplati, valeur EJSON aplatie, MongoDB ignoré, Kafka ignoré, raison non bornée,
  orphelins ignorés, profils non rattachés ignorés, profils non joués, publication `TOUS` par la route, mode de publication
  ignoré, cabinet comparé sans forme texte, `migrer` sans identité, export sans moteur, santé sans organisation, moteur
  sans organisation, export mis en cache.
- **Pile `grp-c`** (mongo:7 `rs0`, Kafka 3.9.0, un IdP de test RS256, l'image `runtime` lancée deux fois :
  `INSTANCE_ESPACE=REEL` et `ESSAI`, bases et groupes distincts ; `/api/v1/health` 200 des deux côtés ; états publiés par
  Kafka). **37/37 cas verts** (seconde passe, images de `735ff8a`) :

  | Instance | Cas | Réponse |
  |---|---|---|
  | réel et essai | `GET …/{org}/sante` (A, B sans état publié, P) | **200** `{"etat":"OK"}` |
  | réel | `GET …/A/export`, A `EN_SERVICE` | **200**, 32 objets : `balances` 3 (identifiant ObjectId et chaîne), `retraitements-fiscaux` 1, `profils-societe` 1 ; ni la balance ni le retraitement de B, ni le scénario de A (`conseil`), ni la copie des dossiers ; `Cache-Control: no-store` |
  | réel | B (aucun état) ; D `NON_INSTALLE` | **403 `BALANCE_NOT_ENTITLED`** |
  | réel | C `SUSPENDU` ; F `LECTURE_SEULE` | **200** |
  | réel | `?format=csv&objet=retraitements-fiscaux` | **200** `text/csv; charset=utf-8`, BOM, pièce jointe `export-balance-retraitements-fiscaux-<A>.csv` ; colonnes `_id;orgId;dossierId;exercice.debut;exercice.fin;code;sens;montant;baseLegale;justification;parUserId;createdAt` ; la justification `=HYPERLINK(…)` écrite `'=HYPERLINK(…)` |
  | réel | `?objet=balances` ; `?format=xml` ; `?format=csv` ; `?objet=scenarios-fiscaux` | 200 (un objet) ; **400 `FORMAT_NON_SERVI`** ; **400 `OBJET_REQUIS`** ; **422 `OBJET_INCONNU`** |
  | réel | les trois routes : sans jeton ; administrateur de A ; administrateur de la plateforme | **401** ; **403 `IDENTITE_DE_SERVICE_REQUISE`** ; **403 `IDENTITE_DE_SERVICE_REQUISE`** |
  | réel | moteur de B sur l'export et la santé de A ; 12 santés d'affilée | **403 `ORGANISATION_HORS_JETON`** ; 12 × 200 |
  | réel | `migrer` (moteur de B) ; rejouée | **200 `MIGRE`** : `dossiers-d8` `CABINETS_INCONNUS`, 0 profil publié, `balances` 1 rattachée ; `profils-529` 1 rattaché ; rejouée : 0, 0, 0 (1 déjà rattaché) |
  | essai | `migrer`, P sans dossier « Mon cabinet » | **409 `MIGRATION_INCOMPLETE`** : 1 balance orpheline, 1 profil publié (le seul cabinet inconnu), 1 profil non rattaché |
  | essai | export de P ; effacement ; export après | **200** (`balances` 1, `profils-societe` 1) ; **200 `EFFACE`** (4) ; **403 `BALANCE_NOT_ENTITLED`** |
  | essai | import des balances exportées ; d'un objet `balances` à champs admis | **422 `SCHEMA_NON_CONFORME`** ; **422 `OBJET_INCONNU`** (D-1021-17) |
  | réel | Kafka arrêté : santé ; export | **200 `DEGRADE`** « Kafka : Local: Broker transport failure. » ; **200** (le module reste ouvert) |

  En base après la preuve : aucune balance sans dossier dans le réel, le profil de A rattaché à « Mon cabinet », aucun
  message en attente dans l'outbox du réel (rien n'a été republié). La première passe (images de `6676abc`) avait deux
  cas rouges, tous deux du script de preuve : `fetch().text()` retire le BOM, et l'import des balances exportées tombe au
  schéma avant l'objet (D-1021-17). Le démarrage réel des deux instances vaut le `docker compose up` du §1.5 (D-1021-16).
- **Garde des manifestes** : aucun fichier de `manifestes/` ne change (AC-8).
- **Verrou Docker** : pris à 21:31:31 (après D, 346), rendu à 21:40:18 (images, unitaires, e2e, build, première pile) ;
  repris à 21:47:07, rendu à 21:52:05 (unitaires sur le second commit, pile). Aucun conteneur, réseau ni image
  `grp-c-*1021*` restant.

## Ce qui reste

- Les contrats d'export et de `migrer` à publier par B dans `prospera-plateforme/contrats/instance/` ; balance les
  recopiera à l'octet et s'y rangera.
- Un export volumineux se lit en un seul corps : pagination ou flux quand le contrat le dira ; une cellule CSV de plus de
  32 767 caractères (un tableau de lignes de balance) ne s'ouvre pas entière dans un tableur, le JSON reste la forme fidèle.
- Les commentaires « à créer » du manifeste `balance` (à la source) : à retirer à sa prochaine révision, avec la recopie
  au catalogue (B).
- Les routes d'instance du module `conseil` (D-1021-15), sur le même patron.
- Bilan (D) sert l'export en JSON seul : le CSV de Q-D-19 lui reste à faire (même forme que D-1021-7, si D la retient).
