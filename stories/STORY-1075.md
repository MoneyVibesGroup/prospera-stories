# STORY-1075 : les routes d'instance `export`, `sante` et `migrer` du bilan

Status: in-progress

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
| AC-1 | `GET …/{organisationId}/sante` rend 200 `sante@1` (relu par Ajv contre la copie à l'octet) : `OK`, ou `DEGRADE` avec sa `raison` quand MongoDB n'est pas prêt ou qu'un consommateur est à l'arrêt ; jamais un refus pour la santé ; dans les deux espaces, quel que soit l'état publié | specs ; e2e ; pile `grp-d` |
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
  `DEGRADE` si MongoDB n'est pas connecté (`readyState`) ou si un consommateur attendu est hors de son groupe ou bloqué
  (le registre que lisent `/health` et `consommateurs-actifs`) ; `raison` les nomme (bornée à 512) ; sinon `OK`. Toujours
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
  module Nest change) ; aucune dépendance ni Dockerfile. `docker compose up` sain prouvé sur la pile `grp-d`.

## Contrat annoncé avant le code

« ⚠ Contrats » du journal de D (entrée STORY-1075) : trois routes d'instance neuves, deux codes de refus neufs, une copie
de contrat neuve (`sante@1`), trois questions au PO (Q-D-18 → 20).

## Preuves

*(à remplir)*

## Ce qui reste

*(à remplir)*
