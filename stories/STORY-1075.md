# STORY-1075 : les routes d'instance `export`, `sante` et `migrer` du bilan

Status: done

**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` §6, amendement D-L6-5, ligne n° 12 (« Fini quand : les trois routes
répondent au contrat du moteur »). **Dépôt :** `prospera-bilan-service` (tenu par D au lot 6 ; `origin/dev` au départ :
`c0dc720`, STORY-1074) · **Plage :** groupe D, 1075 (réservée au tracker) · **Ordre de D :** 1074 ✅ → **1075** (la
dernière du lot 6 amendé).
**Sources :** `manifestes/bilan.manifest.ts` (M36, 1.0.0 : `routesInstance.export`, `.sante`, `migrer`, `routesLectureSeule`,
C7 « l'export de l'organisation reste réservé à `instance:donnees:exporter` ») ; `CONTRAT-DE-MODULE-2026-11-09.md` C2
(« l'export passe toujours », seul `NON_INSTALLE` le refuse) et C13 (points 3 et 7, tableau des chemins, amendements du
2026-11-11) ; spine du moteur d'installation AD-17, AD-21 (santé `DEGRADE`), AD-33 (`migrer`), AD-37 (l'export de
l'écran Administration passe par les commandes de la partie A) ; `prospera-plateforme@contrats-instance-v1` (5a50249) :
`contrats/reprise/sante.schema.json` (`sante@1`) ; la matrice `garde-etat-publie-v1` copiée dans le service (sortes
`export` et `sante`). Code d'`origin/dev` : `instance-c13.controller.ts` (vérifications, import, effacement : l'identité du
moteur seule), `instance-consolidation.controller.ts` (1074), `plan-d-effacement.ts`, `etat-consommateurs.service.ts`,
`migration/dossiers-migration.service.ts` (STORY-356/357).
**Rituel (2026-11-25) :** aucune demande neuve à D chez A, B et C.

## Ce qui existait déjà

`instance/bilan` sert `import`, `effacement` (STORY-928, essai seul) et `verifications/{code}` (STORY-1080, deux espaces),
sous l'identité de service du moteur seule. **Aucune** route `export`, `sante` ni `migrer` (STORY-928 : « ne le sont
toujours pas ») ; le manifeste les déclare « à créer ». **Aucun service** de l'écosystème ne les sert encore (`git grep`
sur `origin/dev` de tous les dépôts du poste : rien à copier) ; le moteur (catalogue, agent) ne les appelle pas encore.

**Ce que la plateforme publie, et ce qu'elle ne publie pas :**

| Route | Chemin (manifeste) | Contrat publié | Ce qui manque |
|---|---|---|---|
| santé | `GET /api/v1/instance/bilan/{organisationId}/sante` | **`sante@1`** (`{ etat: OK \| DEGRADE, raison? }`) ; matrice : sorte `sante` ouverte au `MOTEUR` dans les neuf états | rien |
| export | `GET /api/v1/instance/bilan/{organisationId}/export` | aucun schéma ; C2 : ouvert dans tous les états sauf `NON_INSTALLE` (403 `<MODULE>_NOT_ENTITLED`) ; C13 : « en CSV et JSON » ; matrice : sorte `export` | la forme du corps (→ **Q-D-19**) ; l'appelant utilisateur (→ **Q-D-18**) |
| migrer | `POST /api/v1/instance/bilan/migrer` | aucun schéma ; AD-33 : idempotent, additif, appelé par l'agent sous verrou | la demande, la réponse, l'échec (→ **Q-D-20**) |

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | `GET …/{organisationId}/sante` rend 200 `sante@1` (relu par Ajv contre la copie à l'octet) : `OK`, ou `DEGRADE` avec sa `raison` quand MongoDB n'est pas prêt, que Kafka ne répond pas ou qu'un consommateur est à l'arrêt ; jamais un refus pour la santé ; dans les deux espaces, quel que soit l'état publié | specs ; e2e ; pile `grp-d` |
| AC-2 | `GET …/{organisationId}/export` rend 200 l'export JSON de ce que le module `bilan` tient de l'organisation (plan d'export, chaque objet et son nombre), et rien d'une autre organisation ; état publié absent ou `NON_INSTALLE` ⇒ 403 `BILAN_NOT_ENTITLED`, aucune donnée ; tout autre état (dont `SUSPENDU`, `LECTURE_SEULE`, `ESSAI_TERMINE`) ⇒ 200 ; dans les deux espaces | specs ; e2e ; pile `grp-d` |
| AC-3 | Le plan d'export couvre le plan d'effacement : chaque collection effacée est exportée, ou écartée **avec sa raison** (invariant) | invariant |
| AC-4 | `POST …/migrer` joue les migrations du service (aujourd'hui `dossiers-d8`), idempotent : rejoué, rien de plus ; 200 `MIGRE` avec le rapport ; orphelins ⇒ 409 `MIGRATION_INCOMPLETE` avec le rapport ; dans les deux espaces | specs ; e2e ; pile `grp-d` |
| AC-5 | Les trois routes : l'identité `MOTEUR` seule (jeton d'utilisateur ⇒ 403 `IDENTITE_DE_SERVICE_REQUISE`, même `TENANT_ADMIN` à e-mail vérifié) ; `export` et `sante` limitées à l'organisation du chemin (403 `ORGANISATION_HORS_JETON`) ; sans jeton 401 ; hors limite de débit | e2e ; pile `grp-d` |
| AC-6 | Export, effacement, import : l'aller-retour **si le contrat le permet** — il ne le permet pas pour `bilan` (aucun objet importable, D-928-5) : la preuve montre l'export, l'effacement, l'export refusé après (plus rien, plus d'état publié), l'import refusé `OBJET_INCONNU` | pile `grp-d` |

## Décisions retenues par défaut (contestables)

- **D-1075-1 — Trois handlers de plus sur le contrôleur existant `instance/bilan`**, sous la même règle que l'import,
  l'effacement et les vérifications (D-928-1, D-1080-8) : `@AdmetIdentitesDeService('MOTEUR')`, hors des gardes métier
  (`BilanAccessGuard`, `DossierScopeGuard`), sans limite de débit. **Aucun contrôleur neuf** : le compte des invariants
  (30 contrôleurs) ne bouge pas. **Les deux espaces** (pas `exigerEssai`) : l'export est un droit du client au réel,
  la santé sert la supervision des deux, `migrer` se joue dans l'essai puis dans le réel (AD-33).
- **D-1075-2 — `export` et `sante` : `exigerLeMoteur`** (moteur, limité à l'organisation du chemin). **`migrer` : le
  moteur, sans organisation** : la route n'en porte pas, la migration vaut pour le service entier ; le jeton du moteur
  est limité à une organisation (C2), n'importe laquelle l'ouvre (Q-D-20).
- **D-1075-3 — L'utilisateur détenteur de `instance:donnees:exporter` n'est pas servi par `export`** (Q-D-18). Le
  tableau de C13 le nomme (« par le chemin public »), mais AD-37 fait passer l'export de l'écran Administration par les
  commandes de la partie A (qui appelle le module sous l'identité du moteur), et le jeton que lit bilan ne projette pas
  `perms[]` (la stratégie JWT du service n'en lit aucun). Un jeton d'utilisateur reçoit 403
  `IDENTITE_DE_SERVICE_REQUISE`, comme aux autres routes d'instance.
- **D-1075-4 — L'export applique la matrice de l'état publié** (sorte `export`, identité `MOTEUR`, espace de
  l'instance), lue dans `etats_publies_bilan` : état absent ⇒ `NON_INSTALLE` ⇒ 403 **`BILAN_NOT_ENTITLED`**, aucune
  donnée (C2 : « seul `NON_INSTALLE` la refuse ») ; ailleurs, ouvert (`SUSPENDU` compris). La route n'entre pas dans
  `ROUTES_D_EXPORT_ET_D_ETATS` : cette liste est celle des routes métier que garde `BilanAccessGuard` (l'invariant
  exige qu'elles la portent) ; la route d'instance décide elle-même par la même matrice.
- **D-1075-5 — Ce qui s'exporte : ce que le module `bilan` calcule et garde** (`PLAN_D_EXPORT`) : `jeux_etats`,
  `snapshots_liasse`, `jeux_hypotheses`, `versions_hypotheses`, `mapping_overrides`, `exercices`, `audit_events`.
  Écartés avec leur raison : les collections de `consolidation` et de `financement` (deux modules à part, chacun sa
  route d'export au manifeste) ; les copies des voisins (read-models : balances, dossiers, exercices du dossier,
  périmètres, immobilisations, appartenances, états publiés, options, KYC, droit) qui s'exportent chez leur
  propriétaire ; `outbox_events` (transit) ; `instance_c13_imports` (registre interne). L'invariant lit le plan
  d'effacement : une collection ajoutée demain ne s'oublie pas.
- **D-1075-6 — La forme de l'export : du JSON** (Q-D-19), une enveloppe `{ schemaVersion: 1, module: 'bilan',
  organisationId, espace, exporteLe, objets: [{ objet, nombre, enregistrements }] }`, les objets dans l'ordre du plan,
  chaque document en **MongoDB Extended JSON (relaxed)** — identifiants et dates gardent leur type, rien ne se perd. Le
  CSV de C13 (point 7) n'est pas servi : aucun contrat n'en fixe la forme (une collection de documents imbriqués n'a pas
  de CSV évident). L'export lit les deux formes d'identifiant (ObjectId et chaîne, §1.9), comme l'effacement.
- **D-1075-7 — L'aller-retour n'est pas possible pour `bilan`, et c'est écrit** : l'import n'a aucun objet (D-928-5,
  les états se recalculent depuis la balance). La preuve d'AC-6 montre ce que le contrat permet.
- **D-1075-8 — La santé** (`sante@1`, copiée à l'octet de `contrats-instance-v1`, `contrats/reprise/sante.schema.json`) :
  `DEGRADE` si MongoDB n'est pas connecté (`readyState`) ou si la **sonde Kafka de `/health`** (`KafkaHealthIndicator` :
  un broker qui répond en 5 s au plus, puis chaque consommateur attendu dans son groupe et non bloqué) est en bas ;
  `raison` les nomme (bornée à 512) ; sinon `OK`. *Revu sur la pile* : la première forme ne lisait que le registre des
  consommateurs, qui ne voit pas un broker arrêté (Kafka coupé : `OK` pendant 2 min, `/health` déjà 503). Toujours
  200 : la santé ne ferme rien (C13 point 3). Pas de lecture de l'état publié (la matrice ouvre `sante` au moteur dans
  les neuf états).
- **D-1075-9 — `migrer`** (Q-D-20) : sans corps ; joue les migrations du service dans l'ordre — aujourd'hui une,
  **`dossiers-d8`** (`DossiersMigrationService`, STORY-356/357 : index obsolètes retirés, `dossierId` posé, orphelins
  comptés ; idempotente) ; 200 `{ schemaVersion: 1, module: 'bilan', statut: 'MIGRE', migrations: [{ code, ...rapport }] }` ;
  des orphelins ⇒ **409 `MIGRATION_INCOMPLETE`** avec le rapport (l'agent arrête son plan, la commande se rejoue). La
  commande `npm run migrate:dossiers` reste. Rien ne se joue au démarrage (AD-33 : déjà le cas).
- **D-1075-10 — Deux codes de refus neufs** à l'inventaire `CODES_REFUS_C13` : `BILAN_NOT_ENTITLED` (celui de la garde
  de bilan, rendu ici par la route d'export) et `MIGRATION_INCOMPLETE`.
- **D-1075-11 — Le manifeste ne change pas** : les routes sont servies aux chemins qu'il déclare ; ses commentaires
  « à créer » restent à la source (les retoucher changerait l'empreinte et demanderait une recopie au catalogue) : écrit
  dans « Ce qui reste ».
- **D-1075-12 — Docker :** `MigrationModule` exporte `DossiersMigrationService`, importé par `InstanceC13Module` (un
  module Nest change), avec `TerminusModule` et `KafkaHealthIndicator` (la sonde de `/health`) ; aucune dépendance ni
  Dockerfile. `docker compose up` sain prouvé sur la pile `grp-d`.
- **D-1075-13 — Le nom d'un objet exporté suit le motif des objets C13** (`^[a-z0-9][a-z0-9-]*$`, celui
  d'`import-c13-demande@1`) : `jeux_etats` ⇒ `jeux-etats`, la collection d'origine à côté (`collection`). *Vu sur la
  pile* : un import nommé comme la collection était refusé `SCHEMA_NON_CONFORME` avant même d'être jugé.

## Contrat annoncé avant le code

« ⚠ Contrats » du journal de D (entrée STORY-1075) : trois routes d'instance neuves, deux codes de refus neufs, une copie
de contrat neuve (`sante@1`), trois questions au PO (Q-D-18 → 20).

## Preuves

**Livré :** prospera-bilan-service#192, fusionnée en rebase le 2026-11-25 (`head` `d28630b`, rejoué sur `dev` en
**`993b78f`** (les trois routes) et **`4317dd2`** (la santé lit la sonde Kafka ; les noms d'objet de l'export), arbre de `dev`
identique au `head` poussé) ; annonce « ⚠ Contrats » prospera-stories #885 (`main` b2eadd0) avant la fusion du code.

- **Suite unitaire complète sous Node 24** (étage `verification`, image construite depuis l'archive de `8ff049d`,
  `Dockerfile.local` sans `# syntax=`, `-w 4 --workerIdleMemoryLimit=700MB`, conteneur nommé, sortie dans le conteneur) :
  **367/367 suites, 12 678 tests verts (6 ignorés), 1 429 s**. **e2e : 45/45 suites, 3 560/3 560**, 394 s.
- **Après le second commit** (`d28630b`, image reconstruite) : sous Node 24, les 42 suites de `instance-c13`, `health`,
  `migration`, `common` (invariants des routes et des contrôleurs), `app` et `read-models/guards` : **42/42, 471 tests** ;
  **e2e complet : 45/45 suites, 3 560/3 560**.
- **Specs neuves** : `export-c13.spec` (état absent, `NON_INSTALLE`, état inconnu et version de matrice inconnue ⇒ 403
  sans rien lire ; les huit autres états ⇒ 200 ; l'enveloppe, l'ordre, les noms d'objet au motif C13 ; le lecteur MongoDB :
  les deux formes d'identifiant, l'organisation seule, tri, Extended JSON relaxed) ; `plan-d-export.invariant.spec` (le
  plan d'export couvre le plan d'effacement) ; `sante-c13.spec` (sur la vraie sonde Kafka de `/health`, broker doublé :
  OK, broker injoignable, consommateur bloqué, MongoDB en cours de connexion ; `sante@1` relu par Ajv, raison bornée) ;
  `migrer-c13.spec` (MIGRE, 409 avec le rapport) ; `copie.invariant.spec` (six copies, `sante.schema.json` à l'octet) ;
  e2e `instance-c13` : 35/35 (six cas neufs : les trois routes, deux espaces, 401/403, hors limite de débit).
- **Mutations : 19/19 tuées sur `8ff049d`** (deux réécrites parce que leur première forme ne compilait pas : « Tests : 13
  passed » sans la suite visée), **puis 6/6 sur la santé revue** : NON_INSTALLE ouvert, décision ignorée, version de
  matrice ignorée, espace inversé, nombre faux, tri inversé, filtre effacé, EJSON strict, un objet de moins, un voisin
  exporté, orphelins ignorés, `migrer` sans identité, export sans moteur, santé sans organisation, moteur sans
  organisation ; MongoDB ignoré, Kafka ignoré, sonde lue à l'envers, `readyState` ignoré, raison non bornée, nom d'objet
  = collection.
- **Pile `grp-d`** (mongo `rs0`, Kafka 3.9.0, un JWKS, l'image `runtime` lancée deux fois : `INSTANCE_ESPACE=REEL` et
  `ESSAI`, bases et groupes distincts ; `/api/v1/health` 200 des deux côtés ; les trois routes mappées) :

  | Instance | Cas | Réponse |
  |---|---|---|
  | réel et essai | `GET …/{org}/sante` (A, P, et B sans état publié) | **200** `{"etat":"OK"}` |
  | réel | `GET …/A/export`, A `EN_SERVICE` | **200** : `jeux-etats` 2, `snapshots-liasse` 1, `exercices` 1, `audit-events` 1 (identifiant ObjectId et chaîne), les autres 0 ; ni le jeu de B, ni le dossier de financement, ni la copie de balance de A |
  | réel | `GET …/B/export`, aucun état publié | **403 `BILAN_NOT_ENTITLED`** |
  | réel | A `SUSPENDU` ; puis `NON_INSTALLE` | **200** (même export) ; **403 `BILAN_NOT_ENTITLED`** |
  | réel | les trois routes : sans jeton ; administrateur de A ; administrateur de la plateforme | **401** ; **403 `IDENTITE_DE_SERVICE_REQUISE`** ; **403 `IDENTITE_DE_SERVICE_REQUISE`** |
  | réel | moteur de B sur l'export et la santé de A | **403 `ORGANISATION_HORS_JETON`** |
  | réel | `migrer`, le jeu de B sans dossier du cabinet | **409 `MIGRATION_INCOMPLETE`** (rapport : 1 orphelin, ceux de A rattachés) |
  | réel | `migrer` après le dossier du cabinet de B ; rejouée | **200 `MIGRE`** (`jeux_etats` 1 rattaché) ; **200 `MIGRE`**, 0 rattaché (idempotente) |
  | essai | `GET …/P/export` | **200** : `jeux-etats` 1, `audit-events` 1 |
  | essai | effacement de P ; export de P après | **200 `EFFACE`** (3) ; **403 `BILAN_NOT_ENTITLED`** (l'état publié est parti avec l'organisation) |
  | essai | import de P, objet `jeux-etats` | **422 `OBJET_INCONNU`** (bilan n'a aucun objet importable : pas d'aller-retour, D-1075-7) ; 0 document de P restant |
  | réel | Kafka arrêté depuis ≈ 10 s : santé ; export | **200 `DEGRADE`** « Kafka : Local: Broker transport failure. » ; **200** (le module reste ouvert) |

  La première pile (images de `8ff049d`) a vu les deux écarts corrigés par `d28630b` : santé `OK` deux minutes après
  l'arrêt de Kafka (`/health` déjà 503), et un import nommé comme la collection (`jeux_etats`) refusé
  `SCHEMA_NON_CONFORME`.

- **Lint** 0 sur les fichiers touchés ; `tsc` OK ; images `verification` et `runtime` construites ; `docker compose up`
  sain (§1.5 : un module Nest change).
- **Verrou Docker** : pris à 09:46 (libre), tenu pendant la suite Node 24, les mutations et une première pile ; la sous-session coupée par une erreur réseau vers 11:15, le verrou rendu orphelin par la session principale ; repris à 13:06, pile rejouée sur les images de `d28630b`, rendu à 13:09 après `down -v` ; aucun conteneur, volume ni réseau `grp-d`.

## Ce qui reste

- **Q-D-18 → 20** (au PO, défauts appliqués) : l'utilisateur détenteur de `instance:donnees:exporter` ; la forme de
  l'export et le CSV ; le contrat de `migrer`. Quand B publie les contrats d'export et de `migrer` dans
  `prospera-plateforme/contrats/instance/`, bilan les recopie à l'octet et s'y range.
- Un export volumineux se lit en un seul corps : pagination ou flux quand le contrat le dira.
- Les commentaires « à créer » du manifeste `bilan` (à la source) : à retirer à sa prochaine révision, avec la recopie
  au catalogue (B).
- Les routes d'instance de `consolidation` et de `financement` (export, import, effacement, santé, `migrer`), sur le
  même patron.
