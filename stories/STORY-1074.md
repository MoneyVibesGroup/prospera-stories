# STORY-1074 : la consolidation s'installe à part — sa garde propre et ses trois vérifications

Status: done

**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` §6, amendement D-L6-5, ligne n° 11 (« Fini quand : sans droit
`consolidation`, ses routes refusent ; les trois vérifications servent ; recette du moteur verte »). **Dépôt :**
`prospera-bilan-service` (tenu par D au lot 6 ; `origin/dev` au départ : `2d186b9`, STORY-1079) · **Plage :** groupe D,
1074 (réservée au tracker) · **Ordre de D :** 1079 ✅ → **1074** → 1075.
**Sources :** `manifestes/consolidation.manifest.ts` (M45, 1.0.0 : écarts n° 1 et 2, trois vérifications) ; « Ce qui
reste » de `STORY-1080.md` (les vérifications de `consolidation` non servies ; patron : D-1080-1 → 8) ; `STORY-549`
(vente à part, décision du PO du 2026-11-12) ; `STORY-1083` (la garde d'un second module du même service, D-1083-2 et 5) ;
`STORY-1079` (dans l'essai, la garde ne lit pas le KYC). Code d'`origin/dev` : `instance-c13.controller.ts`,
`verifications/*`, `financement-access.guard.ts`, `bilan-access.guard.ts`, `etat-publie.projection.service.ts`,
`portee-groupe.guard.ts` (la portée de groupe, qui n'est pas une garde de module), `plan-d-effacement.ts`.
**Rituel (2026-11-25) :** aucune demande neuve à D chez A, B et C.

## Ce qui existait déjà

Les douze contrôleurs de `src/modules/bilan/consolidation/` (≈ 50 routes) ne portent que `@RequiresBilanAccess()` et
`@PorteeGroupe()` : **toute organisation qui a `bilan` consolide** (écart n° 1 du manifeste). Aucun état publié de
`consolidation` n'est projeté (écart n° 2) ; aucune route `instance/consolidation/…`.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Une organisation qui a `bilan` **sans** `consolidation` (état publié inconnu, `NON_INSTALLE`, `ESSAI_TERMINE`, `DESINSTALLE`, `SUSPENDU`…) reçoit **403 `CONSOLIDATION_NOT_ENTITLED`** sur **chaque** route de `dossiers/:dossierId/consolidation/…`, avant la portée du dossier et du groupe ; en `LECTURE_SEULE`, les lectures passent et les écritures rendent 403 `ABONNEMENT_EXPIRE` | spec de la garde ; batterie `bilan-dossier-portee-collaborateur` route par route ; pile `grp-d` |
| AC-2 | Avec `bilan` et `consolidation` ouverts, **rien ne change** (la batterie existante reste verte, chaque route franchit la chaîne) ; les routes hors consolidation ne lisent pas l'état de `consolidation` | batterie ; e2e consolidation inchangés |
| AC-3 | Dans l'espace d'essai, même règle que STORY-1079 : le KYC n'est pas lu, l'e-mail vérifié et l'état publié restent exigés ; fail-closed sans espace | spec `consolidation-access.guard.espace` |
| AC-4 | L'état publié du module `consolidation` est projeté du même topic `etat-publie.changed.<espace>` (collection `etats_publies_consolidation`, règle `(epoque, numero)`), effacé par le plan C13 | specs ; invariant du plan d'effacement |
| AC-5 | `POST /api/v1/instance/consolidation/{organisationId}/verifications/{code}` sert `perimetre-arrete`, `ecritures-equilibrees`, `gate-consolidation` (corps `verification-installation@1` relu par Ajv, mesure chiffrée, `VERT` à 0) ; identité `MOTEUR` seule, limitée à l'organisation du chemin ; code non déclaré 404 `VERIFICATION_INCONNUE` ; rien d'écrit | specs ; e2e ; pile `grp-d` |
| AC-6 | Tout contrôleur de consolidation porte la garde (invariant par métadonnées) ; la vérification `gate-consolidation` rougit si une route ne la porte pas ou si la garde n'est pas dans la chaîne globale | invariant ; spec ; mutations |

## Décisions retenues par défaut (contestables)

- **D-1074-1 — Une garde globale de plus, opt-in, sur le patron de `financement` (D-1083-2).**
  `ConsolidationAccessGuard` (`src/modules/bilan/consolidation/acces/`), déclarée dans `AppModule` après
  `BilanAccessGuard` et `FinancementAccessGuard`, **avant** `DossierScopeGuard` (et donc avant `PorteeGroupeGuard`, de
  contrôleur) : un module fermé ne dit rien de l'existence du dossier ni du groupe. Elle s'applique à un contrôleur
  `@RequiresConsolidationAccess()` ; les douze la portent au niveau de la classe. `@RequiresBilanAccess()` reste sur
  chaque route (dépendance dure, deux gardes : « avec les deux, rien ne change »).
- **D-1074-2 — Elle se suffit à elle-même** (comme celle de `financement`) : e-mail vérifié → organisation du jeton →
  KYC `APPROVED` (**sauté dans l'espace d'essai**, D-1079-1 → 3 : `EspaceDeLInstance`, facultatif, seul un
  `EspaceDeLInstance` qui répond `true` fait l'essai) → état publié de `consolidation`, décidé par la garde partagée
  `garde-etat-publie-v1` (copie inchangée) selon la sorte de la requête (`@LectureSeule`, `@SorteDeRoute` lus comme la
  garde de bilan). Inconnu ⇒ refus. Les premiers paliers ne se voient pas en pratique : la garde de bilan, avant elle,
  rend les mêmes codes ; ils gardent la règle vraie si une route perdait `@RequiresBilanAccess`.
- **D-1074-3 — Refus nommé `CONSOLIDATION_NOT_ENTITLED`** (403, « le module de consolidation n'est pas ouvert pour
  l'organisation ») ; `ABONNEMENT_EXPIRE` pour une écriture en lecture seule. Les deux entrent à l'inventaire
  `CODES_REFUS_CONSOLIDATION` (l'enum OpenAPI de `RefusConsolidationDto` : **deux valeurs de plus**, A régénère ses types)
  et aux descriptions 403 des routes. `ABONNEMENT_EXPIRE` y manquait déjà (rendu par la garde de bilan) : rattrapé.
- **D-1074-4 — Les droits C7 (`consolidation:*`) ne sont pas lus dans cette story.** Ils ne sont pas au catalogue
  d'auth (écart n° 3, auth est à B) ; les rôles `TENANT_ADMIN` / `TENANT_USER` continuent de décider, comme avant. Un
  droit par route (patron `@DroitFinancement`) suppose ce catalogue : écrit dans « Ce qui reste ».
- **D-1074-5 — L'état publié de `consolidation` : une projection de plus** (collection `etats_publies_consolidation`,
  même enveloppe, même règle `(epoque, numero)` par `appliquerEtatPublie`, même consommateur), effacée par le plan C13
  (champ `organizationId`). Le schéma de `bilan` (copié dans balance) n'est pas touché.
- **D-1074-6 — Les vérifications mesurent sans lire l'habilitation** (D-1080-1) et suivent la forme de D-1080-8 : un
  contrôleur `instance/consolidation` (`@AdmetIdentitesDeService('MOTEUR')`, `exigerLeMoteur`), hors des gardes métier,
  servi dans les deux espaces, aucune écriture, réponse relue contre `verification-installation@1` (copie à l'octet déjà
  dans le service). Les trois codes du manifeste et eux seuls (404 `VERIFICATION_INCONNUE`,
  `details.verificationsServies`). Les autres routes d'instance de `consolidation` (export, import, effacement, santé,
  migrer) ne sont pas dans cette ligne du plan.
- **D-1074-7 — `perimetre-arrete`** : un **groupe** est un dossier MÈRE non archivé que le service connaît comme tel
  (cité en `mereDossierId` par un périmètre arrêté, ou porteur d'écritures, de méthodes ou d'appariements de
  consolidation). Pour chacun, chaque exercice `OUVERT` de la mère (`exercices_dossier`) doit avoir un arrêté **à sa date
  de clôture** — la règle exacte de l'agrégat (`dernierALaDate(org, mère, fin)`, sinon `PERIMETRE_NON_ARRETE`). Mesure =
  groupes dont au moins un exercice ouvert n'a pas de périmètre arrêté ; 🟠 (critère du manifeste) ; un groupe sans
  exercice ouvert n'est pas compté (dit dans `detail`). Le moteur ne tient que `VERT` pour une réussite (FR-6) : c'est
  le critère, assumé (comme D-1080-3).
- **D-1074-8 — `ecritures-equilibrees`** : chaque écriture `ACTIVE` de l'organisation (`ecritures_consolidation`), lue
  brute, recalculée par la règle de la saisie : Σ débits = Σ crédits, aux entiers sûrs ; une ligne illisible (montant non
  entier, négatif, absent) rend l'écriture déséquilibrée. Une omission motivée (sans ligne) est équilibrée. Mesure =
  écritures en écart, nommées (mère, exercice, numéro) dans `detail` ; 🔴.
- **D-1074-9 — `gate-consolidation`** : mesure la **chaîne réelle** de l'instance par ses métadonnées Nest
  (`DiscoveryService`) : chaque route d'un contrôleur dont le chemin porte `consolidation` (hors `instance/`) doit porter
  `@RequiresConsolidationAccess()`, et `ConsolidationAccessGuard` doit être une garde globale de l'application. Mesure =
  routes ouvertes (toutes si la garde n'est pas dans la chaîne) ; 🔴. La mesure porte sur le service, pas sur
  l'organisation (comme `consommateurs-actifs`).
- **D-1074-10 — Le manifeste ne change pas** : ses trois vérifications et leurs routes sont servies telles qu'il les
  déclare (1.0.0). Il est copié à l'octet dans `src/vendor/manifestes/` (patron D-1083-5), gardé par son empreinte ; les
  codes servis sont lus de la copie. **Aucune recopie n'est demandée au catalogue.**
- **D-1074-11 — Docker :** un fournisseur et un contrôleur de plus dans des modules existants, `DiscoveryModule` de
  `@nestjs/core` ; aucune dépendance ni Dockerfile ne change. Le démarrage réel est prouvé par la pile `grp-d`.

## Contrat annoncé avant le code

« ⚠ Contrats » du journal de D (entrée STORY-1074) : comportement de garde, code de refus neuf, route d'instance neuve,
collection neuve.

## Preuves

**Livré :** prospera-bilan-service#191, fusionnée en rebase le 2026-11-25 (`head` `cc2f587`, rejoué sur `dev` en
**`130f8a5`** (la story) et **`c0dc720`** (le compte de l'invariant de portée du dossier), arbre de `dev` identique au
`head` poussé) ; annonce « ⚠ Contrats » prospera-stories #883 (`main` bd83fda) avant la fusion du code.

- **Suite complète sous Node 24** (étage `verification`, image construite depuis l'archive de `3340be6`,
  `Dockerfile.local` sans `# syntax=`, `-w 4 --workerIdleMemoryLimit=700MB`) : **362/363 suites, 12 648 tests verts
  (6 ignorés), 935 s** ; la seule rouge, `dossier-scope.invariant` (compte des contrôleurs : 29 → 30 avec
  `instance/consolidation`), corrigée en `cc2f587` puis rejouée sous Node 24 avec les 88 autres suites de
  `bilan/consolidation`, `instance-c13` et `etat-publie` : vertes (`conversions.controller.spec`, tuée par un SIGKILL
  mémoire du conteneur sans `-w`, rejouée seule : verte). **e2e : 45/45 suites, 3 554/3 554**, 91 s.
- **Specs neuves** : `consolidation-access.guard.spec` 18/18 (dont l'essai et le fail-closed : sans espace, `{}`, objet
  qui imite) ; `consolidation-access.invariant.spec` (12 contrôleurs gardés à la classe, aucun handler ne la retire,
  ordre dans `AppModule`) ; `consolidation.manifest.spec` (copie à l'octet, vérifications et routes du manifeste) ;
  `verifications-consolidation.spec` (27) ; `carte-des-routes.spec` (les douze vrais contrôleurs montés par Nest :
  50 routes, toutes gardées ; contrôleur oublié ⇒ ROUGE ; garde hors `APP_GUARD` ⇒ ROUGE) ;
  `etat-publie-consolidation.spec`.
- **La garde de portée des contrôleurs, route par route** (`bilan-dossier-portee-collaborateur`, chaîne réelle JWT RS256
  → e-mail → rôles → bilan → financement → **consolidation** → portée) : 550/550 ; pour **chacune des routes des 12
  contrôleurs de consolidation**, une organisation qui a `bilan` sans `consolidation` (aucun état, puis `NON_INSTALLE`)
  reçoit 403 `CONSOLIDATION_NOT_ENTITLED`, le même corps sur un dossier inexistant, la chaîne jamais franchie ; les
  routes des 13 autres contrôleurs franchissent la chaîne sans état de `consolidation` (rien ne change). e2e
  `instance-c13` : les trois vérifications de consolidation (deux espaces, 401/403/404).
- **Mutations 19/19 tuées** (sur une assertion ; trois réécrites parce que leur première forme ne compilait pas, cf.
  piège 3 de 1079) : état inconnu ouvert, décision ignorée, KYC sauté dans le réel, KYC jamais sauté, sorte ignorée,
  e-mail non exigé, projection sur `bilan`, Σ débits ≠ Σ crédits, montant négatif, lignes non tableau, exercice
  ouvert vu arrêté, arrêté à n'importe quelle date, chaîne globale ignorée, aucune route = vert, garde vue hors
  `APP_GUARD`, handler lu sans la classe, routes du moteur comptées, garde retirée d'un contrôleur, garde après la
  portée du dossier dans `AppModule`.
- **Pile `grp-d`** (mongo `rs0`, Kafka 3.9.0, un JWKS, l'image `runtime` de `3340be6` lancée deux fois :
  `INSTANCE_ESPACE=REEL` et `ESSAI`, bases et groupes de consommateurs distincts ; `/api/v1/health` 200 des deux
  côtés ; `InstanceConsolidationController` mappé). États publiés par Kafka (`etat-publie.changed.reel|essai`),
  read-models semés en base :

  | Instance | Cas | Réponse |
  |---|---|---|
  | réel | A (`bilan` + `consolidation`), `GET …/consolidation/appariements`, `…/methodes-groupe` | **200** `[]` |
  | réel | B (`bilan` seul), `GET …/appariements`, `POST …/exercices/{id}/eliminations` | **403 `CONSOLIDATION_NOT_ENTITLED`** |
  | réel | B, dossier inexistant | 403 `CONSOLIDATION_NOT_ENTITLED` (même corps) |
  | réel | B, `GET …/bilan/etats` | 200 (le bilan reste ouvert) |
  | essai | P (aucun KYC, `bilan` + `consolidation` en `ESSAI_PROSPECT`) | **200** |
  | essai | Q (aucun KYC, `bilan` seul) | **403 `CONSOLIDATION_NOT_ENTITLED`** ; son bilan : 200 |
  | réel | `perimetre-arrete` (exercice ouvert au 31/12/2025, aucun arrêté) | 200 **ORANGE**, mesure 1, la mère nommée |
  | réel | `ecritures-equilibrees` (n° 1 équilibrée, n° 2 altérée en base 500/450, n° 3 annulée) | 200 **ROUGE**, mesure 1 (« 2 non annulées », n° 2 nommée) |
  | réel et essai | `gate-consolidation` | 200 **VERT**, mesure 0, « 50 routes examinées, garde dans la chaîne globale » |
  | réel | jeton d'utilisateur ; autre organisation ; code de bilan | 403 `IDENTITE_DE_SERVICE_REQUISE` ; 403 `ORGANISATION_HORS_JETON` ; 404 `VERIFICATION_INCONNUE` |
  | réel | après l'arrêté au 31/12/2025 et l'annulation du n° 2 | `perimetre-arrete` **VERT** ; `ecritures-equilibrees` **VERT** |
  | réel | `consolidation` `NON_INSTALLE` pour A (numéro 3) | 403 `CONSOLIDATION_NOT_ENTITLED` ; son bilan : 200 |

  `etats_publies_consolidation` porte A (`EN_SERVICE`, `REEL`) et P (`ESSAI_PROSPECT`, `ESSAI`), jamais B ni Q.
- **Lint** 0 sur les fichiers touchés ; `tsc -p tsconfig.build.json` OK ; images `verification` et `runtime`
  construites. Sans `docker compose up` du dépôt : un module de `@nestjs/core` (`DiscoveryModule`), un contrôleur et des
  fournisseurs dans des modules existants, aucune dépendance ni Dockerfile ; démarrage réel prouvé sur la pile.
- **« Recette du moteur verte »** : la recette croisée (B) n'est pas rejouée — aucune recette, ni le BFF, n'appelle une
  route de consolidation (`git grep` sur `prospera-recette` et `admin-panel`, `origin/dev`) et `consolidation` n'est pas
  dans `INSTALLATION_SERVICES` : rien n'y change. Les trois vérifications du moteur sont servies et vertes sur la pile.
- **Verrou Docker** : pris à 08:51 (libre), une seule prise, rendu à 09:15 ; aucun conteneur, volume ni réseau `grp-d`.

## Ce qui reste

- Les droits C7 de `consolidation` (`consolidation:etats:consulter`, `:ecriture:saisir`, `:methodes:administrer`,
  `:etats:arreter`) au catalogue d'auth (B), puis un droit par route (D-1074-4).
- Les autres routes d'instance de `consolidation` (export, import, effacement, santé, `migrer`).
- `consolidation` dans `INSTALLATION_SERVICES` de la recette et l'adresse de ses vérifications au catalogue (B ; le
  catalogue porte déjà sa copie du manifeste 1.0.0) : tant qu'aucun état n'est publié pour lui, toutes les routes de
  consolidation rendent 403 `CONSOLIDATION_NOT_ENTITLED` (fermé, voulu).
