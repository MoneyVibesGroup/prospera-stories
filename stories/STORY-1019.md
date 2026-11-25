# STORY-1019 : le conseil s'installe à part — sa garde propre et ses deux vérifications

Status: in_progress

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §3, amendement du 2026-11-25, n° **0b** (ligne d'origine :
`PLAN-LOT-6-2026-11-23.md` §4, amendement D-L6-5, n° 9 — « Fini quand : sans droit `conseil`, les routes des scénarios
refusent ; les deux vérifications servent par la route d'instance ; recette du moteur verte »). **Dépôt :**
`prospera-balance-service` (tenu par C ; `origin/dev` au départ : `58322c4`, STORY-1020) · **Plage :** groupe C, 1019
(réservée au tracker) · **Ordre de C :** 1020 ✅ → **1019** → 1021 → 1022 → 1023.
**Sources :** `manifestes/conseil.manifest.ts` (M38, 1.0.0 : écarts n° 1, 2 et 4, deux vérifications) ; « Ce qui reste »
de `STORY-1080.md` (les vérifications de `conseil` non servies ; patron D-1080-1 → 8) ; `STORY-549` (vente à part,
décision du PO du 2026-11-12) ; **patron le plus proche : `STORY-1074`** (D, bilan-service : `CONSOLIDATION_NOT_ENTITLED`,
route d'instance des vérifications, D-1074-1 → 11) ; `STORY-1079` (D : dans l'essai, la garde ne lit pas le KYC).
**Demande placée dans cette story :** **← D (2026-11-25, STORY-1079, Q-D-17)** — dans l'espace d'essai, la garde de
`balance-service` (`@RequiresBalanceAccess`) ne lit pas le KYC — **Q-D-17 confirmée par l'utilisateur le 2026-11-25**
(journal de D : la même règle vaut pour balance, ce n'est plus un choix par défaut) ; ticket `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`,
point 3 (C).
**Rituel (2026-11-25) :** aucune demande neuve à C chez A et B ; chez D, la demande ci-dessus (déjà placée par 1020).

## Ce qui existait déjà

`ScenariosController` (6 routes : créer, lister, lire, modifier, supprimer, simuler) et `JustificationController`
(2 routes : comparatif, dossier de justification), sous `dossiers/:dossierId/fiscal/…`, ne portent que
`@RequiresBalanceAccess()` et `@RequiresDossierScope()` : **toute organisation qui a `balance` a le conseil sans l'avoir
acheté** (écart n° 1 du manifeste). Aucun état publié de `conseil` n'est projeté (écart n° 2) ; aucune route
`instance/conseil/…` (écart n° 4). La garde de balance exige un KYC `APPROVED` quel que soit l'espace.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Une organisation qui a `balance` **sans** `conseil` (état publié inconnu, `NON_INSTALLE`, `ESSAI_TERMINE`, `DESINSTALLE`, `SUSPENDU`…) reçoit **403 `CONSEIL_NOT_ENTITLED`** sur **chacune** des 8 routes des scénarios et de la justification, avant la portée du dossier ; en `LECTURE_SEULE`, les lectures (et `simuler`, `@LectureSeule`) passent, une écriture rend 403 `ABONNEMENT_EXPIRE` | spec de la garde ; batterie `balance-dossier-portee-collaborateur` route par route ; e2e `scenarios` ; pile `grp-c` |
| AC-2 | Avec `balance` et `conseil` ouverts, **rien ne change** (e2e des scénarios verts) ; les routes hors conseil ne lisent pas l'état de `conseil` | batterie ; e2e |
| AC-3 | L'état publié de `conseil` est projeté du même topic `etat-publie.changed.<espace>` (collection `etats_publies_conseil`, règle `(epoque, numero)`), effacé par le plan C13 | specs ; invariant du plan d'effacement ; pile |
| AC-4 | `POST /api/v1/instance/conseil/{organisationId}/verifications/{code}` sert `aucun-scenario-applique` et `gate-conseil` (corps `verification-installation@1` relu par Ajv, mesure chiffrée, `VERT` à 0) ; identité `MOTEUR` seule, limitée à l'organisation du chemin ; deux espaces ; code non déclaré 404 `VERIFICATION_INCONNUE` ; rien d'écrit | specs ; e2e `instance-c13` ; pile |
| AC-5 | Toute route des scénarios et de la justification porte la garde (invariant par métadonnées) ; `gate-conseil` rougit si une route ne la porte pas ou si la garde n'est pas dans la chaîne globale | invariant ; spec sur les vrais contrôleurs ; mutations |
| AC-6 | **← D** : sur une instance `INSTANCE_ESPACE=ESSAI`, la garde de balance (et celle du conseil) **saute le seul palier KYC** sans lire le read-model ; e-mail vérifié et état publié restent exigés, dans le même ordre ; dans le réel, la même requête rend 403 `KYC_NOT_APPROVED` ; une garde construite sans espace exige le KYC (fail-closed) ; une mutation qui saute le KYC hors de l'essai rougit | specs `*.espace` ; mutations ; pile (deux instances) |

## Décisions retenues par défaut (contestables)

- **D-1019-1 — Une garde globale de plus, opt-in, sur le patron de 1074.** `ConseilAccessGuard`
  (`src/modules/read-models/guards/conseil-access.guard.ts`, à côté de celle de balance), décorateur
  `@RequiresConseilAccess()` (métadonnée pure, `src/common/decorators/`), posé au niveau de la **classe** sur
  `ScenariosController` et `JustificationController`. Déclarée dans `AppModule` **après** `BalanceAccessGuard` et
  **avant** `DossierScopeGuard` : un module fermé ne dit rien de l'existence du dossier. `@RequiresBalanceAccess()` reste
  sur chaque route (dépendance dure, deux gardes : « avec les deux, rien ne change »).
- **D-1019-2 — Elle se suffit à elle-même** : e-mail vérifié → organisation du jeton → KYC `APPROVED` (**sauté dans
  l'espace d'essai**, D-1019-9) → état publié de `conseil`, décidé par la garde partagée `garde-etat-publie-v1` (copie
  inchangée) selon la sorte de la requête (`@LectureSeule`, `@SorteDeRoute`, lus comme la garde de balance). Inconnu ⇒
  refus. Les premiers paliers ne se voient pas en pratique (la garde de balance, avant elle, rend les mêmes codes) ; ils
  gardent la règle vraie si une route perdait `@RequiresBalanceAccess`.
- **D-1019-3 — Refus nommé `CONSEIL_NOT_ENTITLED`** (403, « le module de conseil fiscal n'est pas ouvert pour
  l'organisation ») — le code que la garde partagée rend pour le module `conseil` ; `ABONNEMENT_EXPIRE` pour une
  écriture en lecture seule. Les descriptions 403 des 8 routes (OpenAPI) les nomment ; balance n'a pas d'énumération
  des refus (texte libre), aucun type généré ne change de forme.
- **D-1019-4 — Les droits C7 (`conseil:*`) ne sont pas lus** (écart n° 3 : auth est à B) ; les rôles
  `TENANT_ADMIN` / `TENANT_USER` continuent de décider. Écrit dans « Ce qui reste ».
- **D-1019-5 — L'état publié de `conseil` : une projection de plus**, collection `etats_publies_conseil`, même
  enveloppe, même règle `(epoque, numero)` (fonction `appliquerEtatPublie` partagée, patron de bilan), même consommateur ;
  effacée par le plan C13 (champ `organizationId`). Le schéma de l'état publié de `balance` (copié à l'identique dans
  bilan-service) n'est pas touché. **`entitlement.changed` n'est pas projeté pour `conseil`** : l'écart n° 2 du manifeste
  date d'avant STORY-918, depuis laquelle le droit ne décide plus rien (l'état publié seul).
- **D-1019-6 — Les vérifications mesurent sans lire l'habilitation** (D-1080-1) et suivent la forme de D-1080-8 et
  D-1074-6 : un contrôleur `instance/conseil` (`@AdmetIdentitesDeService('MOTEUR')`, `exigerLeMoteur`), hors des gardes
  métier, servi dans les deux espaces, aucune écriture, réponse relue contre `verification-installation@1` (copie déjà
  dans le service). Les deux codes du manifeste et eux seuls (404 `VERIFICATION_INCONNUE`,
  `details.verificationsServies`). Le registre des vérifications devient commun aux deux modules du service. Les autres
  routes d'instance de `conseil` (export, import, effacement, santé, `migrer`) ne sont pas dans cette ligne du plan.
- **D-1019-7 — `aucun-scenario-applique`** : chaque retraitement **réel** de l'organisation (`retraitements_fiscaux`,
  ceux de `POST …/fiscal/retraitements`, la seule porte par laquelle « retenir une option » passe), lu **brut** (tous
  dossiers, archivés compris : la justification est la défense du client en contrôle), est compté si sa base légale ou
  sa justification est absente, non textuelle ou vide après `trim` — ce que le schéma et le DTO refusent, donc ce qu'un
  chemin hors contrôleur aurait glissé. Mesure = leur nombre, nommés (dossier, exercice, code) dans `detail` ; 🔴.
- **D-1019-8 — `gate-conseil`** : mesure la **chaîne réelle** de l'instance par ses métadonnées Nest
  (`DiscoveryService`, patron D-1074-9) : chaque route d'un contrôleur dont le chemin est sous `…/fiscal/scenarios` ou
  `…/fiscal/dossier-justification` (hors `instance/`) doit porter `@RequiresConseilAccess()`, et `ConseilAccessGuard`
  doit être une garde globale de l'application. Mesure = routes ouvertes (toutes si la garde n'est pas dans la chaîne ;
  1 si aucune route n'est trouvée) ; 🔴. La mesure porte sur le service, pas sur l'organisation.
- **D-1019-9 — ← D (Q-D-17, confirmée) : dans l'essai, les gardes de balance et du conseil ne lisent pas le KYC.** L'espace est
  celui de l'**instance** (`EspaceDeLInstance`, STORY-928, lu de `INSTANCE_ESPACE`, déjà validée au démarrage, absente ⇒
  `REEL`), fourni par `AppModule` aux gardes globales ; jamais le jeton, un en-tête, un paramètre ni l'`espace` du message
  projeté. Dépendance **facultative** (`@Optional()`) : seule une instance d'`EspaceDeLInstance` qui répond `true` fait
  l'essai ; une garde construite sans lui, avec un double inerte `{}` ou un objet qui imite sa forme, exige le KYC
  (fail-closed). Aucun code neuf ; `KYC_NOT_APPROVED` n'est plus rendu par ces gardes dans l'essai.
- **D-1019-10 — Hors périmètre, écrit :** l'ingestion Kafka des balances des verticaux (`ingestion.service.ts`, qui lit
  aussi le KYC) n'est pas une garde HTTP et n'est pas dans la demande de D (comme D-1079-5) ; inchangée.
- **D-1019-11 — Le manifeste ne change pas** : ses deux vérifications et leurs routes sont servies telles qu'il les
  déclare (1.0.0) ; copié à l'octet dans `src/vendor/manifestes/` (patron D-1074-10, blob `99518bf`, sha256
  `e9405675…`), gardé par son empreinte ; les codes servis sont lus de la copie. **Aucune recopie au catalogue.**
- **D-1019-12 — Docker :** un contrôleur, des fournisseurs et une collection dans des modules existants,
  `DiscoveryModule` de `@nestjs/core` ; aucune dépendance ni Dockerfile ne change. Le démarrage réel et le comportement
  de bout en bout sont prouvés sur une pile `grp-c` (deux instances, `REEL` et `ESSAI`).

## Conséquence pour les autres groupes (écrite au journal de C)

- **B (recette)** : la recette croisée `atelier-balance` (STORY-100) appelle les routes des scénarios avec un cabinet qui
  n'a que `balance` et `bilan` : elle doit octroyer `conseil` au cabinet (`octroyer(cabinet, 'conseil')`, après
  `balance`) avant l'étape « conseil », sinon elle reçoit 403 `CONSEIL_NOT_ENTITLED`. Facultatif : `conseil` dans
  `INSTALLATION_SERVICES` (`conseil=http://balance-service:3007`), ses vérifications étant servies ; le test FR-6 de
  `cabinet-moteur`, qui prend `conseil` pour module « sans adresse », devra alors en prendre un autre.
- **A (écrans)** : un cabinet sans le module voit `CONSEIL_NOT_ENTITLED` sur les scénarios et la justification (proposer
  l'option), plus seulement `BALANCE_NOT_ENTITLED`.

## Contrat annoncé avant le code

« ⚠ Contrats » du journal de C (entrée STORY-1019) : comportement de garde, code de refus neuf, route d'instance neuve,
collection neuve, règle de l'essai.

## Preuves

À écrire à la livraison.

## Ce qui reste

- Les droits C7 de `conseil` (`conseil:scenario:consulter`, `:simuler`, `conseil:justification:consulter`) au catalogue
  d'auth (B), puis un droit par route (D-1019-4).
- Les autres routes d'instance de `conseil` (export, import, effacement, santé, `migrer`) ; l'en-tête du manifeste
  (écarts n° 1, 2, 4) à rafraîchir à sa prochaine version.
