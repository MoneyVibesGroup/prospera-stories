# STORY-533 : Une organisation est habilitée à N référentiels, pas à un seul — le champ singleton bloque tout cabinet multi-secteur

Status: done

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `platform-catalog-service` (`:3003`) + read-model `balance-service` (`:3007`) + `bilan-service`
**Points :** 5 · **Sprint :** S20
**Bloque :** **STORY-422** (le plan de comptes suit le dossier) — c'est son « seul vrai inconnu », nommé tel quel dans sa recommandation du 26/08.
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27, demandée par le PO.

---

## Le fait

`OrgBalanceEntitlement.referentiel` est un **champ unique**. Le référentiel est attribué à
l'**octroi**, par la console (pack vertical AP-06), et vaut pour toute l'organisation.

Or l'organisation qui utilise ce produit est un **cabinet d'expertise comptable**, et un cabinet ne
tient pas un seul type d'entité. Le portefeuille de démonstration du produit le montre déjà : la
maquette liste *Ets Kossi Distribution* (SARL commerciale, SYSCOHADA) **et** *Mutuelle d'Épargne Bè*
(agrément SFD BCEAO) **dans le même cabinet**. Avec un champ singleton, l'un des deux dossiers est
nécessairement validé contre le plan de l'autre.

⚡ **Ce n'est pas une limite théorique : c'est le modèle économique du client.** Un cabinet togolais
qui ne tiendrait qu'un seul secteur n'existe pas. Le champ singleton dit l'inverse.

## Ce qui a caché le défaut

Le champ n'est faux **qu'en présence de plusieurs dossiers de natures différentes**. Tant que la
plateforme n'avait qu'un dossier par organisation (`POST /profil-societe` répond encore aujourd'hui
`409 PROFIL_SOCIETE_DEJA_EXISTANT`, index unique sur `orgId`), un référentiel par organisation était
exactement un référentiel par dossier. **Les deux modèles coïncidaient, donc le mauvais paraissait
juste.** EPIC-043 a séparé les deux, et le champ ne s'en est pas aperçu.

## Critères d'acceptation

- [ ] AC-1 — `OrgBalanceEntitlement.referentiel` devient `referentiels: string[]` (non vide). La
      lecture d'un octroi existant rend un tableau à un élément : **aucune migration de données à
      la main**, la projection le fait.
- [ ] AC-2 — La console (AP-06) octroie **une liste** de référentiels par pack vertical. Un pack
      « cabinet » en porte plusieurs ; un pack « microfinance » un seul.
- [ ] AC-3 — Nouvelle question, servie et testée : **`estHabilite(orgId, referentiel)`**. C'est
      elle, et elle seule, que STORY-422 appelle. Elle répond `false` sur un référentiel absent de
      la liste — jamais sur une liste vide traitée comme « tout permis ».
- [ ] AC-4 — ⛔ **Fail-closed prouvé par mutation** : une organisation dont la liste est **vide** ou
      absente ne peut charger **aucun** plan. Le test doit virer au rouge si la garde est retirée —
      une liste vide qui ouvre tout est le mode de panne le plus coûteux du programme (même patron
      que la portée vide d'EPIC-049/050, tracé dans `reserved_ranges`).
- [ ] AC-5 — La route publie **la liste des référentiels habilités**, pas seulement un verdict :
      l'écran doit pouvoir dire « votre cabinet est habilité à SYSCOHADA et SFD-BCEAO, ce dossier
      demande CIMA », qui est actionnable, plutôt que « accès refusé », qui ne l'est pas.

## Conséquences ailleurs

- **STORY-422** devient chiffrable et démarrable : son estimation basse (5 pts « si l'entitlement
  porte déjà l'information ») ne s'applique pas ; c'est 8, et cette story-ci est le complément.
- L'écran de la console (AP-06) passe d'un sélecteur à une liste à cocher — **FE à ficher**.
- ⚠️ `bilan-service` lit le même read-model pour la liasse : la propagation doit être vérifiée dans
  les **deux** services, comme l'a exigé la byte-identité des artefacts (STORY-368).

## Notes

- Voir [[STORY-422]], `stories/STORY-394.md` (l'énumération org-scopée qui a fermé la question de
  sécurité), `stories/STORY-366.md` (les quatre verticaux reçoivent `balance`).

---

## Progress Tracking

**Statut : `done`** — démarrée **et** clôturée le **2026-08-31**, avant STORY-422 qui la déclare en
prérequis (choix user du 2026-08-31, après constat que `OrgBalanceEntitlement.referentiel` est bien
resté un champ unique).

**4 PR mergées en rebase sur `dev`, dans cet ordre — le seul sûr** : `bilan-service` #55,
`balance-service` #79, `admin-panel` #25, puis `platform-catalog-service` #17. ⚠️ **Les consommateurs
d'abord** : un consommateur resté sur la lecture v1 face à un producteur v2 verrait « aucune
habilitation » et **révoquerait** l'organisation en état absolu. L'inverse — consommateurs en avance —
est inoffensif, le repli v1 les couvre.

### Périmètre réel : QUATRE dépôts, pas trois

La fiche annonçait `platform-catalog-service` + `balance-service` + `bilan-service`. Le recensement
avant branchement en trouve un quatrième :

| Dépôt | Rôle | Ce qui change |
|---|---|---|
| `platform-catalog-service` | producteur | `Entitlement`, `VerticalPack`, DTO d'octroi, règle référentiel, contrat `entitlement.changed` |
| `balance-service` | consommateur | contrat miroir, `OrgBalanceEntitlement`, projection, `estHabilite` (AC-3) |
| `bilan-service` | consommateur | contrat miroir, `OrgBilanEntitlement`, projection, `resolveReferentielForOrg` |
| **`admin-panel`** | **BFF (HTTP, pas Kafka)** | `AdminEntitlementDto` **ré-expose `referentiel` au singulier** — laissé tel quel, il publierait sur l'écran AP-06 un champ **menteur** dès qu'une org en porte deux, ou `undefined` dès que l'amont cesse de l'émettre. C'est exactement la classe de défaut que cette story ferme. |

⚠️ Deux corrections de la fiche relevées au passage : `platform-catalog-service` est sur **`:3003`**
(le `:3006` annoncé est `document-service`), et les 5 pts couvrent mal quatre dépôts.

### Décisions de conception

**1. `referentiels: {code, version}[]`, et non `string[]`** (AC-1 dit `string[]`).
Un référentiel est un **couple** partout ailleurs dans les quatre dépôts (`ReferentielRef`,
`PackReferentiel`, `ReferentielRefDto`, le payload Kafka). L'aplatir en `"code@version"` inventerait
une sérialisation qu'il faudrait re-parser dans `bilan-service`, qui n'a aucun helper pour ça. La
**substance** d'AC-1 — pluriel, non vide, aucune migration à la main — est tenue à l'identique.

**2. `schemaVersion` passe à `2`.** Le champ `referentiel` **quitte** le payload : c'est une rupture
de contrat de fil, et c'est exactement ce à quoi sert le numéro. Les consommateurs ne s'en servent
**pas** comme aiguillage (ils lisent la forme, qui ne ment pas) — mais un producteur tiers qui
n'incrémenterait pas laisserait un consommateur muet.

**3. Le repli v1 vit dans `referentiels-habilites.util.ts`, jumeau dans les deux consommateurs.**
Placé hors d'un fichier `*bootstrap*` **à dessein** : `collectCoverageFrom` les exclut, et c'est ce
trou qui avait caché les trois bugs Kafka de STORY-076/108.
⚠️ Le cas qui a demandé un arbitrage : **`referentiels: []` présent + `referentiel` v1 présent**.
Aucun des deux producteurs n'émet ça (le v1 ignore le champ, le v2 l'omet quand il n'y a rien). On
retient « voici la liste, elle est vide » plutôt que « champ absent » : l'autre lecture
**ressusciterait** une habilitation que le producteur est en train d'effacer.

**4. `resoudreReferentiel` refuse au lieu de choisir** (`409 REFERENTIEL_AMBIGU`, message nommant les
candidats), dans `balance-service` **et** `bilan-service`. Rendre `habilites[0]` rejouerait le mode de
panne le plus grave du programme — les comptes d'une IMF validés contre SYSCOHADA passent **tous**
(les 44 racines communes existent des deux côtés) et sont **tous** faux. 🪝 Branche levée par
STORY-422, qui résoudra depuis le **dossier**.

**5. `PACKS_SEED` reste une transcription du front : listes à UN élément, aucune valeur changée.**
Le modèle est pluralisé (AC-2, capacité), mais **quels** référentiels un pack « cabinet » doit porter
n'a pas été arbitré — AC-2 dit « plusieurs » sans dire lesquels. Les inventer ici ferait de ce fichier
une décision d'offre, ce que son propre en-tête interdit (« ce n'est pas une inspiration, c'est une
reprise »). ⇒ **Question ouverte portée au PO**, et à la story FE qui passe le sélecteur en liste à
cocher.

### Ce que la revue de code de `bilan-service` a attrapé toute seule

`jeu-etats.codes.exhaustivite.spec.ts` (STORY-381, AC-4) a **viré au rouge** dès l'ajout de
`REFERENTIEL_AMBIGU` : il balaie les sources des routes `/dossiers/:id/bilan/etats` et confronte les
`code:` trouvés à l'inventaire publié en `enum` OpenAPI. Sans lui, le contrat aurait **déclaré** une
exhaustivité qu'il n'avait plus, et un client écrivant `Record<CodeRefusJeuEtats, string>` aurait reçu
une valeur hors de son union. C'est la garde qui a fonctionné, pas la vigilance.

### Passes de mutation (obligatoires, toutes compilent)

| Mutation | Fichier | Attendu | Constaté |
|---|---|---|---|
| ne valider que `referentiels[0]` | `referentiel-rule.ts` (catalog) | rouge sur « une seule entrée hors familles refuse la liste ENTIÈRE » | ✅ 1 rouge / 15 |
| retirer le `$unset` du champ singulier | `entitlements.service.ts` (catalog) | rouge sur « migration sans script (AC-1) » | ✅ 1 rouge / 50 |
| liste vide ⇒ tout permis | `referentiel-resolver.service.ts` (balance) | rouge sur les 2 tests AC-4 | ✅ |
| `length > 1` → `> 2` (choisir le premier) | `referentiel-resolver.service.ts` (balance) | rouge sur les 2 tests d'ambiguïté | ✅ 4 rouges / 33 au total |
| `length > 1` → `> 2` | `bilan-engine.service.ts` (bilan) | rouge sur « DEUX habilitations » | ✅ 1 rouge / 24 |

⚠️ La première tentative de mutation sur le résolveur `balance` a été **rejetée** : supprimer le
`throw` rendait l'import inutilisé et le rouge venait d'une **erreur de compilation**, qui ne prouve
rien. Refaite en `> 1` → `> 2`, qui compile.

### Vérification docker — persistance réelle, sur stack neuve (`down -v`)

Stack : `mongo` (rs0) + `kafka` (KRaft) + `redis` + `auth-service` + `platform-catalog-service` +
`balance-service` + `bilan-service`. Les quatre services confirment `Found 0 errors` et
`/health` → `{"mongodb":"up","kafka":"up"}` avant la première requête.
⚠️ `docker compose up --build` a échoué sur `admin-panel` (`npm ci`, miroir de registre injoignable) :
démarrage **sans** `--build`, `src/` monté en volume, donc le code exécuté est bien celui de la
branche (procédure documentée dans `CLAUDE.md`). `admin-panel` est un BFF **sans base** — il n'entre
dans aucune des assertions ci-dessous.

Organisation réelle : `cabinet533@prospera.local` → `org 6a953edec7e3686106fc4240`,
jeton `TENANT_ADMIN`, `emailVerified: true`, `orgkycstatuses.status = APPROVED`.

| # | Ce qui est prouvé | Résultat mesuré |
|---|---|---|
| ⓐ | **AC-1 — un octroi ANTÉRIEUR, jamais réécrit, reste servi.** Document inséré *à la main* dans `balance_service.orgbalanceentitlements` avec le **seul** champ v1 `referentiel` | `GET /referentiels/actifs` → **200**, `referentiel: syscohada-revise@2.1`, `referentielsHabilites: [syscohada-revise@2.1]`, `integrity: verified` |
| ⓑ | Octroi HTTP de **DEUX** référentiels | `PUT /catalog/entitlements/:org/balance` → **201**, corps renvoyant les 2 |
| ⓒ | Persistance producteur | `catalog_service.entitlements` : `referentiels` = 2 entrées, **`referentiel` absent** (`'referentiel' in e === false`) |
| ⓒ′ | **Contrat réellement publié** | `outbox_events` : enveloppe `schemaVersion: 2`, `payload.schemaVersion: 2`, `payload.referentiels` = 2 entrées, **`payload.referentiel` absent**, `status: SENT` |
| ⓓ | **Round-trip Kafka + migration sans script** | `balance_service.orgbalanceentitlements` passe de `versionCode 0.9` + champ v1 à `versionCode 1.0` + `referentiels` = 2, **champ v1 disparu**. `bilan_service.orgbilanentitlements` : `referentiels` = 1, champ v1 absent |
| ⓓ′ | Idempotence consommateur | `processed_events` = **1** dans chaque base (⚠️ `snake_case` — `db.processedevents` rend `0` sans erreur, piège de `CLAUDE.md` rencontré et corrigé) |
| ⓔ | **Ambiguïté refusée, pas devinée** | `GET /referentiels/actifs` → **409 `REFERENTIEL_AMBIGU`**, message : *« habilitée à 2 référentiels (syscohada-revise@2.1, sfd-bceao@2.0) : le référentiel à appliquer dépend du dossier traité »* |
| ⓕ | Le refus vaut pour **tous** les lecteurs | `GET /referentiels/plan-comptes?classe=2` → **409**, même code, même message |
| ⓖ | **Atomicité : un octroi refusé n'écrit RIEN** — 3 refus enchaînés (famille non consommée en 2ᵉ position → 422 `REFERENTIEL_INCOMPATIBLE` ; couple répété → 422 `REFERENTIEL_DUPLIQUE` ; `[]` → 400) | `entitlements` **2 → 2**, `outbox_events` **2 → 2**, et le droit préexistant **inchangé** (ses 2 référentiels intacts) |
| ⓗ | **AC-4 — liste vide ⇒ jamais « tout permis »** (état forcé en base, qu'aucun producteur n'émet) | **409 `REFERENTIEL_UNRESOLVED`**, aucun plan servi |
| ⓘ | **L'arbitrage du § *Décisions* n°3, sur données réelles** : liste v2 vide **+** champ v1 résiduel | **409 `REFERENTIEL_UNRESOLVED`** — le repli ne ressuscite pas le droit que le producteur efface |

⚠️ **Observation hors périmètre, relevée en passant** : `catalog_service.entitlements.organizationId`
est stocké en **`string`**, alors que le schéma le déclare `Types.ObjectId`. Comportement
**préexistant** (le filtre et le `$set` de l'upsert passent la même chaîne, donc les lectures sont
cohérentes) et **inchangé** par cette story — signalé pour une story ultérieure, pas corrigé ici.

Stack arrêtée (`docker compose stop`) après la vérification.

---

## Revue de code (phase ⑥) — 7 constats, 7 corrigés

⚡⚡ **Les deux premiers étaient invisibles à TOUTE la batterie** — unitaires, e2e, passes de mutation
et vérification docker comprises — parce qu'ils portent sur ce que **Mongoose fait du schéma**, jamais
sur ce que le service écrit. Les deux ont été **reproduits empiriquement** sur le mongoose du dépôt
avant correction, pas admis sur lecture.

### ① ⛔ BLOQUANT — le `$unset` du champ singulier était **inerte** côté producteur

`Entitlement` ne déclarait plus le chemin `referentiel`, et le schéma est `strict` : **Mongoose retire
du casting tout chemin non déclaré, `$unset` compris**. Mesuré :

```
chemin absent  ⇒ $unset après casting = undefined      ← le code livré
chemin déclaré ⇒ $unset après casting = { referentiel: '' }
```

⇒ Un octroi antérieur à 533 ré-octroyé se retrouvait avec **`referentiel` ET `referentiels`** — les
deux vérités que le commentaire d'`upsert` déclare impossibles, la périmée n'étant plus atteignable
par aucune écriture du service. **La « migration sans script » d'AC-1 ne fonctionnait pas côté
producteur.** Les deux consommateurs, eux, avaient fait le bon geste (`@Prop` `@deprecated` conservée).

⚠️ **Pourquoi ma propre vérification docker ne l'a pas vu** : l'assertion ⓒ (`'referentiel' in e ===
false`) portait sur un document **créé neuf**, qui n'a jamais porté le champ. La garde était
**vacante pour la migration qu'elle prétendait prouver** — même patron que le test tautologique de
STORY-149. Le § *Vérification docker rejouée* ci-dessous la refait sur un document **préexistant**.

**Correctif** : `@Prop({ type: Object }) referentiel?` re-déclarée `@deprecated` (« déclarée pour
pouvoir être effacée »), + `entitlement.schema.spec.ts`, un fichier neuf qui teste **le schéma** et
non le service — retirer la `@Prop` le fait rougir (mutation vérifiée, compile).

### ② ⛔ BLOQUANT — le catalogue publiait `referentiels: []`, l'exact contraire de son propre contrat

Un chemin **tableau** Mongoose porte un défaut implicite `[]`. `upsert` (`new: true`) et les listes
rendent des documents **hydratés** ⇒ `PUT /catalog/entitlements/:org/stock` répondait
`"referentiels": []` sur tout module non normatif — soit la seconde façon de dire « aucun » que le
contrat écrit par cette même story interdit en trois endroits, servie à la console qui **génère ses
types depuis cet OpenAPI**. L'e2e qui prétendait le garder était **vacant** : son `FakeModel` n'est
pas Mongoose et n'applique aucun défaut.

**Correctif** : `default: undefined` sur les **trois** schémas (`Entitlement`, `OrgBalanceEntitlement`,
`OrgBilanEntitlement`). Sur les read-models le défaut n'était pas encore nuisible — mais seulement
parce que **tous** les lecteurs actuels sont en `.lean()` : un futur lecteur hydraté aurait vu
`referentiels: []`, `Array.isArray` vrai, **aucun repli v1**, et tout octroi antérieur serait passé en
`409 REFERENTIEL_UNRESOLVED`. Deux specs de schéma neuves gardent le cas hydraté dans chaque
consommateur (mutation vérifiée dans les deux).

### ③ ⛔ BLOQUANT — `REFERENTIEL_AMBIGU` absent de **9** descriptions OpenAPI (`balance-service`)

Ces descriptions énoncent la liste **fermée** des codes de 409. Les 20 points d'appel de
`chargerReferentiel` peuvent tous rendre le nouveau code. Un client qui `switch (code)` tombe dans le
`default` — alors que l'intérêt entier de ce refus est d'être actionnable. **3ᵉ occurrence du patron
« le bloquant est une description OpenAPI »** après STORY-400 et STORY-376.
⚠️ `balance-service` n'a pas l'équivalent de `CODES_REFUS_JEU_ETATS` — c'est exactement cette garde
qui a rattrapé le même oubli côté `bilan-service`, toute seule.

### ④ ⛔ BLOQUANT — `REFERENTIEL_DUPLIQUE` absent du 422 du `PUT` qui le rend (catalog)

Même classe. La description est rédigée comme une énumération exhaustive ; la mention « **cette
énumération est exhaustive et doit le rester** » y a été ajoutée avec le code.

### ⑤ NON-BLOQUANT — `estHabilite` avalait les pannes d'infrastructure

Le `catch` était **nu**. Une élection de replica set rendait `false` ⇒ « votre cabinet n'est pas
habilité à SYSCOHADA » **sur un incident** : message faux, non réessayable, invisible aux logs.
Seul `BalanceEntitlementInactiveError` vaut « pas habilité » — c'est un verdict *métier*. Correctif :
`catch` typé, le reste remonte. Test + mutation (revenir au `catch` nu ⇒ rouge).

### ⑥ NON-BLOQUANT — deux passe-plats de façade sans appelant, et `diagnostic()` qui la contournait

`ReferentielService.referentielsHabilites()` / `estHabilite()` n'étaient appelées **par rien**, alors
que leur docblock dit « la façade reste le seul point d'entrée » — et `diagnostic()` appelait le
résolveur directement, déclenchant **deux `findOne` identiques** sur `orgbalanceentitlements` par
`GET /referentiels/actifs`. Correctif : `diagnostic()` passe par la façade (une seule lecture,
assertion dédiée), et le prédicat est couvert en attendant son appelant de STORY-422.

### ⑦ NON-BLOQUANT — l'`example` d'AC-5 promettait un état inatteignable

`diagnostic()` compose `chargerReferentiel`, qui lève **dès deux** habilitations : le 200 n'est
atteignable qu'avec **une seule**. L'`example` en montrait deux — un développeur codant l'écran d'AC-5
depuis cet exemple aurait écrit une **branche morte**, et l'information ne lui arrivait que dans la
*phrase* du 409.

**Correctif, qui rend AC-5 réellement actionnable avant STORY-422** : le corps du `409` porte
`details.referentielsHabilites` en **champ structuré**, et l'`example` du 200 passe à un élément.
⚠️ **Le canal `details` est un opt-in du filtre** (`AllExceptionsFilter`, STORY-085) : le reste du
corps d'erreur est une **liste blanche**, et une clé inventée de premier niveau aurait été supprimée
**en silence** — le test aurait alors gardé une promesse que la réponse ne tient pas. Premier essai
fait exactement cette erreur, rattrapé par l'e2e.

⚠️ **Écart assumé `bilan-service`** : les candidats y restent dans la **phrase**. Son
`AllExceptionsFilter` est une liste blanche **stricte, sans canal `details`** ; lui en ouvrir un
déborderait le périmètre pour une branche que STORY-422 rend inatteignable, et l'écran d'AC-5 se
construit sur l'Atelier, pas sur la liasse.

### Un aléa non reproduit, signalé plutôt que tu

`test/entitlements.e2e-spec.ts › révocation → événement status REVOKED` a échoué **une fois** dans une
exécution de fond, puis a passé **7 fois de suite** (4 suites complètes + 3 fichiers isolés).
L'assertion (`toHaveLength(2)` sur les événements d'`EVENT_ORG`) et l'organisation concernée ne sont
touchées par aucun changement de cette story, et la structure du fichier ne montre aucun couplage
d'ordre. **Cause non identifiée** — consigné ici plutôt que déclaré résolu.

### Vérification docker **rejouée** après les correctifs de revue

Les constats ① et ② touchent la persistance ; la vérification de la phase ④ est donc rejouée sur
l'**état final**, en particulier sur le point que la revue a montré **vacant**.
⚠️ Hot-reload contrôlé avant toute assertion : `Found 0 errors` postérieur au dernier commit, et le
code **exécuté** dans le conteneur confirmé porteur de la `@Prop` corrigée
(`docker exec … grep -c` sur le fichier monté).

| # | Ce qui est prouvé | Résultat mesuré |
|---|---|---|
| ⓙ | **AC-1 sur un document PRÉEXISTANT** — `catalog_service.entitlements` ramené à l'état v1 réel (`referentiel` seul, `referentiels` absent), puis ré-octroi | `referentiels: [sfd-bceao@2.0]` **et `'referentiel' in e === false`**. ⚠️ C'est **exactement** l'assertion qui, avant le correctif ①, aurait rendu `true` — et que la vérification initiale ne posait pas, faute d'un document préexistant |
| ⓚ | **Constat ②** — octroi d'un module non normatif (`stock`) | Le corps HTTP ne porte **plus** la clé : `['config','grantedBy','moduleCode','organizationId','source','status','updatedAt','versionCode']` — `referentiels` absent, plus de `[]` |
| ⓛ | **Constat ⑦** — le `409 REFERENTIEL_AMBIGU` publie les candidats en **champ structuré** | `details: {"referentielsHabilites": [{"code":"syscohada-revise","version":"2.1"},{"code":"sfd-bceao","version":"2.0"}]}` — plus besoin d'extraire la liste d'une phrase française |
| ⓜ | Le round-trip Kafka survit aux correctifs | Le read-model de `balance-service` se resynchronise à 2 référentiels après le ré-octroi |

Stack arrêtée après la vérification.

### Portes, état final (après correctifs de revue)

| Dépôt | Lint | Build | Unit | E2E | Couverture (br/fn/li/st) |
|---|---|---|---|---|---|
| `platform-catalog-service` | 0 | ✅ | 669 | 196 | 96.52 / 100 / 99.92 / 99.85 |
| `balance-service` | 0 | ✅ | 3479 | 863 | 92.34 / 98.64 / 99.25 / 99.15 |
| `bilan-service` | 0 | ✅ | 1231 | 346 | 93.73 / 98.43 / 98.67 / 98.72 |
| `admin-panel` | 0 | ✅ | 474 | 216 | 93.68 / 100 / 99.66 / 99.69 |

Seuils exigés : **65 / 90 / 90 / 90** — tenus partout, aucun abaissement.

---

## Revue de sécurité (phase ⑦) — **0 vulnérabilité**

Revue menée sur la PR complète des 4 dépôts. ⚠️ **Ce n'était pas une formalité** : la story modifie le
**droit d'usage** qui décide quel plan de comptes une organisation peut lire et contre lequel ses
écritures sont validées — c'est un changement d'**autorisation**, pas de présentation.

Points examinés et trouvés sains :

- **`estHabilite` est fail-closed sur ses quatre chemins** (`orgId` non-ObjectId, entitlement
  absent/`SUSPENDED`/`REVOKED`, liste vide, couple absent) et **ne peut rendre `true` sans habilitation
  réelle**. Le `catch` typé introduit par la revue de code ne peut pas non plus transformer une panne
  en `true`.
- **Collision de clé sur le séparateur `@`** écartée par preuve : `REFERENTIEL_CODE_PATTERN` et
  `SEMVER_PATTERN` excluent `@` des deux côtés — `a@1`+`x` ne peut pas être confondu avec `a`+`1@x`.
- **Prototype pollution impossible** : aucune valeur venue du réseau n'est utilisée comme **clé**
  d'objet ; la comparaison passe par une chaîne et un `===`.
- **`referentielsHabilites` sur types inattendus** (string, tableau imbriqué, `code`/`version`
  non-string) : tous les chemins rendent `[]` ou filtrent — **aucun ne fabrique une habilitation
  absente de la source**. Un `toString` piégé est hors d'atteinte : le payload sort de `JSON.parse`.
- **Le nouveau `details.referentielsHabilites` du 409 n'est pas une fuite inter-tenant** : l'`orgId`
  vient **toujours** de `user.tenantId` (JWT) sur les trois routes concernées, jamais d'un paramètre —
  vérifié à la main. Un appelant ne peut pas obtenir ce 409 pour une autre organisation.
- **Un message Kafka forgé ou hors contrat n'élargit rien** : le `.map(({code, version}) => …)`
  **strippe** toute clé supplémentaire avant l'écriture Mongo (ni `$`-opérateur, ni `_id` ne traverse
  jusqu'au chemin `Mixed`), et un message qui omet le champ **révoque** au lieu de conserver — la
  direction sûre.
- **Route d'octroi gardée** par `@RequirePermissions(Permission.ENTITLEMENT_GRANT)` (vérifié),
  `ValidationPipe` global en `whitelist + forbidNonWhitelisted`, `@ArrayMaxSize(20)` bornant la boucle
  de lectures Mongo. Pas de ReDoS : les deux regex sont linéaires.
- **Aucun guard, rôle, `@Public()`, CORS, secret ni journalisation touché** par le diff.
- **Recensement des consommateurs du topic** : `balance-service` et `bilan-service` uniquement, **tous
  deux dans cette PR**. Aucun consommateur laissé sur la lecture v1.
- Invariants d'archi intacts : anti-énumération, `TenantScopedRepository`, mapping `E11000`, RS256/JWKS,
  et « le JWT ne porte jamais l'entitlement » — l'habilitation reste relue dans le read-model local.

**Écarté, avec raison** : l'`organizationId` en clair dans le message du 409 est **identique au
comportement préexistant** de `ReferentielUnresolvedError`, et la valeur est celle du JWT de l'appelant
— non introduit par la PR, non exploitable. L'ordre de déploiement producteur/consommateurs est un
risque de **disponibilité** (fail-closed ⇒ 409), pas d'élévation.

