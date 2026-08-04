# STORY-145 : `balance-service` — surface HTTP de validation / rejet d'une balance (`marquerEtat` cesse d'être un hook inerte)

**Epic :** EPIC-024 — Contrôles & livraison
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A28 · **STORY-101** (contrat canonique — `marquerEtat`, immutabilité, `ETATS_BALANCE`) · **STORY-099** (handoff `balance.created` via outbox transactionnel) · **STORY-098** (contrôles d'intégrité/cohérence — **le gate métier qui s'y branchera**)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** low
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Clôturée le :** 2026-08-03 — PR `balance-service#26` rebase-mergée sur `dev`
**Créée le :** 2026-07-31
**Sprint :** 19
**Service :** `balance-service` (:3007)
**Branche :** `MNV-145`
**Couvre :** FR-A28 (consultation + validation de la balance) — **volet manquant**
**Story sœur (frontend) :** **FE-027** (livrée, en review) — l'écran de détail existe déjà et n'a **aucune action** à appeler

---

## Origine — un trou creusé par trois délégations successives

Ce n'est pas un oubli, c'est un **renvoi en boucle**. Trois stories ont chacune écarté la surface HTTP
de validation en la confiant à une autre :

| Story | Ce qu'elle dit, mot pour mot |
|---|---|
| **STORY-101** (done) | « `marquerEtat` (+`findLatest`/`listByOrg`) = **hooks inertes documentés** — aucun endpoint HTTP de mutation en 101 ; le workflow métier validation/rejet est **le périmètre de 098/099** » |
| **STORY-099** (done) | « `marquerEtat` reste un **hook inerte** (workflow validation/rejet = **STORY-098**) » |
| **STORY-098** (`not_started`) | « **Gate de validation** : une balance **ne peut être VALIDÉE** (STORY-101) que si aucun contrôle BLOQUANT n'échoue → sinon **409** » — elle **contraint** la validation, elle ne la **crée** pas |

STORY-098 pose une **précondition** sur un acte qu'aucune story ne rend possible. Résultat vérifié sur
`origin/dev` le 2026-07-31 : `balance.controller.ts` n'expose que `POST /balances`, `GET /balances` et
`GET /balances/:id`. **Aucune route ne fait passer une balance de `BROUILLON` à `VALIDÉE`.**

### Ce que ça coûte aujourd'hui

- **FE-027 est livrée avec un écran de détail sans action.** Elle affiche l'immutabilité (« balance validée,
  aucune modification possible ») pour un état que **personne ne peut atteindre**. Sa note le dit :
  « validation d'état NON câblée (route backend absente) ».
- **FE-026 non plus** n'a pu câbler `marquerEtat`.
- **Le jalon e2e FE-039** (« balance→liasse→validation→export ») est **infranchissable** : son premier maillon
  n'existe pas.
- Plus grave sur le fond : **l'immutabilité est le socle de la défense légale** (NFR-A04). Une balance qu'on ne
  peut pas **figer** est une balance qu'on peut modifier indéfiniment après coup — c'est exactement ce que
  l'immutabilité était censée empêcher. Le mécanisme est implémenté et testé ; il est simplement **inatteignable**.

---

## État réel du code — ce qui existe déjà

`BalanceService.marquerEtat()` est **écrit, transactionnel et testé** (`balance.service.spec.ts` §
« marquerEtat (immutabilité) », 5 cas) :

```ts
async marquerEtat(orgId, id, etat: Extract<EtatBalance,'VALIDÉE'|'REJETÉE'>, auteur, motif): Promise<BalanceDocument>
```

- transition atomique dans une `session.withTransaction` ;
- garde d'immutabilité : `etat === 'VALIDÉE'` → `AlreadyValidatedBalanceException` (terminal) ;
- `updateStateAtomic` écrit `etat` + `horodatageValidation` + une entrée de `mutation`
  `{ version, horodatage, auteur, motif }` ;
- org-scoping par `findById(id, orgId)` ; `id` invalide → `NotFoundException`.

**Il ne manque que la surface HTTP.** D'où 3 points et non 5 : cette story **n'écrit pas de logique métier
de transition**, elle expose celle qui existe et pose la **couture** où STORY-098 viendra brancher ses contrôles.

---

## User Story

En tant que **comptable du cabinet**,
je veux **valider (ou rejeter) une balance depuis l'application, avec un motif**,
afin de **figer le chiffre sur lequel j'engage ma responsabilité** — et que le Bilan consomme une balance
**arrêtée**, pas un brouillon qui peut encore bouger sous lui.

---

## Périmètre

### A. Les deux routes

- **`POST /api/v1/balances/:id/valider`** — corps `{ motif: string }` → `200` avec la balance à jour.
- **`POST /api/v1/balances/:id/rejeter`** — corps `{ motif: string }` → `200` avec la balance à jour.

Contraintes communes :

- gardées par **`@RequiresBalanceAccess`** comme les routes existantes (KYC approuvé + entitlement ACTIVE) ;
- **org-scopées par le JWT** — l'`orgId` n'est **jamais** un paramètre d'entrée (patron déjà en place sur
  `GET /balances/:id`) ;
- `auteur` **dérivé du JWT**, jamais du corps : c'est une trace d'imputabilité, elle ne se déclare pas ;
- **`motif` obligatoire** sur les deux (déjà exigé par la signature de service). Sur un **rejet**, c'est
  évident ; sur une **validation**, c'est la trace de la décision — l'AC-4 le verrouille.

### B. Les codes de retour, qui sont le vrai contrat

| Cas | Réponse |
|---|---|
| `BROUILLON` → `VALIDÉE` / `REJETÉE` | **200** + balance à jour |
| balance déjà `VALIDÉE` | **409** `BALANCE_DEJA_VALIDEE` (`AlreadyValidatedBalanceException`) |
| balance d'une **autre organisation** ou inexistante | **404** — jamais 403, **jamais de distinction entre les deux** (patron d'isolation déjà appliqué en `GET /balances/:id` et re-prouvé en STORY-090) |
| `id` non-ObjectId | **404** (comportement actuel du service — ne pas le changer en 400) |
| `motif` absent / vide | **400** |
| gate KYC / entitlement | **403** avec `code` (`KYC_NOT_APPROVED`, `BALANCE_NOT_ENTITLED`, `EMAIL_NOT_VERIFIED` — cf. STORY-138) |

### C. La couture pour STORY-098 — **le point de conception de cette story**

STORY-098 exigera : « validation **refusée (409)** s'il reste un contrôle **BLOQUANT** ; les avertissements
n'empêchent pas ». Il faut donc que 098 **se branche sans réécrire cette story**.

- Introduire une **couture explicite** — un `ValidationGate` (interface + implémentation par défaut) appelé
  **avant** `marquerEtat`, dans la **même transaction**.
- **Implémentation par défaut de CETTE story** : le seul contrôle bloquant disponible aujourd'hui est
  **l'équilibre**, déjà garanti par `BalanceValidator` **à la création** (STORY-101). La porte est donc
  **passante** par construction — mais elle **existe**, elle est **appelée**, et elle a **sa forme définitive**.
- **Contrat de refus figé dès maintenant** : `409` avec un corps `{ code: 'CONTROLES_BLOQUANTS', bloquants: [...] }`.
  Le front doit pouvoir écrire son écran **une seule fois**. Sur l'implémentation par défaut la liste est vide
  et le 409 ne se produit pas — mais **la forme est publiée à l'OpenAPI**, donc typée côté client.
- ⚠️ **Ce que cette story ne fait PAS** : implémenter les 8 contrôles de cohérence de la GUIDEF. C'est
  **STORY-098**, intégralement. Ici on pose la prise, pas l'appareil.

### D. Hors périmètre — et pourquoi

- **Émission d'un événement `balance.validated`.** STORY-099 l'avait déjà classé « évolution ultérieure ».
  Vérifié le 2026-07-31 : **`bilan-service` ne consomme aujourd'hui aucun événement de balance** — il travaille
  en `dry-run` sur des soldes fournis (`/bilan/etats/*/dry-run`). Émettre un événement que personne ne lit,
  c'est créer un contrat à maintenir sans consommateur. ⚠️ **Le jour où il sera ajouté, il devra passer par
  l'outbox transactionnel de STORY-099** — pas par une émission directe dans la transaction.
- **Réouverture d'une balance `VALIDÉE`.** `VALIDÉE` est **terminal** par conception (STORY-101, NFR-A04).
  Une correction se fait par une **nouvelle version** de balance, pas par une réouverture — c'est tout l'objet
  du versionnement `(orgId, exercice, source, version)`. Ne pas ouvrir cette porte.
- **Reprise d'une balance `REJETÉE`.** Elle n'est pas terminale (le service l'autorise déjà à retransitionner),
  mais aucun parcours ne la demande aujourd'hui : ne rien ajouter tant que le besoin n'est pas exprimé.
- **L'UI.** Elle appartient à une story frontend d'amendement de FE-027, à ouvrir à la livraison de celle-ci.

---

## Critères d'acceptation

1. `POST /balances/:id/valider` fait passer une balance `BROUILLON` en `VALIDÉE` : **200**, `etat` à jour,
   `horodatageValidation` renseigné, entrée de `mutation` ajoutée avec l'`auteur` **issu du JWT** et le `motif`.
2. `POST /balances/:id/rejeter` fait de même vers `REJETÉE`.
3. Rejouer `valider` sur une balance déjà `VALIDÉE` → **409 `BALANCE_DEJA_VALIDEE`**, **sans aucune écriture**
   (prouvé : `mutation` inchangée, `horodatageValidation` inchangé).
4. `motif` absent ou vide → **400** sur les deux routes, **avant** toute écriture.
5. **Isolation** : une balance appartenant à une autre organisation renvoie **404** sur les deux routes —
   identique, au corps près, à celui d'un `id` inexistant (aucune fuite d'existence).
6. `auteur` **n'est jamais lu du corps** : une charge utile qui tente d'imposer un auteur est **ignorée ou
   rejetée**, et la trace porte l'identité du JWT (test dédié — c'est une trace d'imputabilité).
7. Le **`ValidationGate` est appelé** avant `marquerEtat`, **dans la même transaction** — prouvé par un test
   qui injecte une implémentation refusante et vérifie **409 `CONTROLES_BLOQUANTS` + zéro écriture**.
8. La forme du 409 `CONTROLES_BLOQUANTS` est **publiée à l'OpenAPI** (les types front en dérivent) même si
   l'implémentation par défaut ne la produit jamais.
9. Le gate d'accès (`@RequiresBalanceAccess`) s'applique aux deux routes : 403 avec `code` (STORY-138).
10. Portes DoD du dépôt : lint 0, build OK, couverture maintenue, **mutation-tests** sur la garde
    d'immutabilité et sur la dérivation de l'`auteur`.

---

## Vérification docker (obligatoire)

Sur un stack **neuf** (`down -v`), avec une organisation **réelle** KYC-approuvée et entitlée :

1. Créer une balance (`POST /balances`) → `etat: BROUILLON`.
2. `POST /balances/:id/valider` avec motif → **200**, `etat: VALIDÉE`, `horodatageValidation` présent.
3. Rejouer → **409**, et **relire en base** pour prouver qu'aucune écriture n'a eu lieu.
4. Depuis une **seconde organisation**, appeler `valider` sur la balance de la première → **404**.
5. `GET /balances/:id` renvoie bien le nouvel `etat` — c'est ce que **FE-027 affiche déjà**.
6. ⚠️ **Piège relevé en STORY-090** : les read-models de la gate sont keyés `organizationId` en **ObjectId**
   (pas `orgId`, pas une chaîne) — un seed en chaîne donne un **403 `KYC_NOT_APPROVED` muet** qui ressemble à
   un bug de la story.

---

## Notes

- ⚠️ **Cette story doit être livrée avant STORY-098**, pas après : 098 pose une précondition sur un acte que
  145 rend possible. Les livrer dans l'ordre inverse obligerait 098 à créer la route « en passant », ce qui
  est précisément le glissement qui a produit ce trou.
- ⚠️ **Divergence de tracker relevée le 2026-07-31** : le fichier `STORY-098.md` porte « **Sprint : 19** » alors
  que `sprint-status.yaml` la place au **S20**. À trancher au sprint-planning — si 098 revient au S19, elle y
  retrouve 145 et l'ordre ci-dessus est naturel.
- Le versionnement `(orgId, exercice, source, version)` de STORY-101 est ce qui rend l'immutabilité **vivable** :
  figer n'empêche pas de corriger, cela oblige à corriger **au grand jour**, dans une nouvelle version. C'est
  l'argument à tenir si quelqu'un demande une réouverture.

---

## Progress Tracking

**Statut : `done`** — livré le 2026-08-03, PR `balance-service#26` rebase-mergée sur `dev`
(commits `a2ea3a0` feature · `fe81a2d` revue · `3c14d4b` sécurité).

### Ce qui a été livré

Les deux routes, gardées par `@RequiresBalanceAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)` au niveau
classe, `200` (rien n'est créé), `motif` obligatoire et **rogné avant validation**, `auteur` dérivé du
seul JWT en un point unique. La couture `ValidationGate` est fournie par **jeton d'injection**
(`Symbol`), appelée **dans la transaction** et **seulement pour la transition vers `VALIDÉE`** ;
STORY-098 substituera un `useClass` sans rouvrir `BalanceService`. La forme du refus
`CONTROLES_BLOQUANTS` est publiée à l'OpenAPI alors qu'aucune implémentation ne la produit encore.

### Décisions et écarts au cadrage

- **D-145-1 — `BALANCE_ALREADY_VALIDATED` → `BALANCE_DEJA_VALIDEE`.** L'AC-3 nommait un code qui
  n'existait pas ; le code réel était l'unique écart anglophone du service. Renommage **gratuit
  aujourd'hui** (hook inerte : aucune route ne l'exposait, aucun client ne l'a jamais reçu), rupture de
  contrat demain. Vérifié par grep sur les 7 services + `docs/` + `postman/` : zéro consommateur.
- **D-145-2 — la liste des bloquants passe par `details.bloquants`**, pas par un champ racine
  `bloquants` comme l'écrivait le § C. `AllExceptionsFilter` construit le corps par **liste blanche** et
  jetterait le champ en silence (STORY-085). Corps publié :
  `{ statusCode, error, message, code, details: { bloquants } }`.
- **D-145-3 — la porte ne s'applique PAS au rejet.** Refuser un rejet parce que des contrôles échouent
  enfermerait la balance fautive dans le brouillon : les contrôles en échec sont *la raison même* de la
  rejeter.
- **D-145-4 — `horodatageValidation` n'est plus posé sur un rejet** (constat de revue). Il l'était
  inconditionnellement depuis STORY-101 ; invisible tant que `marquerEtat` était inerte, c'est **cette
  story** qui rend observable une balance `REJETÉE` portant une « date de validation », que FE-027
  afficherait telle quelle. Écart au « diff minimal » assumé : le laisser, c'était livrer le défaut. La
  date de la décision reste portée par `mutation.horodatage` dans tous les cas.
- **D-145-5 — une transition SANS EFFET est refusée** (`409 BALANCE_ETAT_INCHANGE`, constat de sécurité).
  Voir ci-dessous. `REJETÉE → VALIDÉE` **reste permis**, conformément au § D.

### ⚠️ Trois pièges qui compilent, passent les tests, et se paient en production

1. **Une porte « prudente » aurait rendu invalidable toute balance héritée.** Re-contrôler
   `sommaire.estEquilibre` semblait une défense en profondeur gratuite. Mongoose n'hydrate que le schéma
   **courant** : le sommaire plat d'avant STORY-147 y est lu `undefined`, donc falsy. Chaque balance
   antérieure aurait reçu un `409` accusant un déséquilibre inexistant. L'implémentation par défaut est
   **passante**, et c'est un choix, pas un oubli.
2. **« `updateStateAtomic` appelé une fois » ne prouve rien de ce qui est écrit.** Les tests n'assertaient
   que le *nombre* d'appels : un service posant `motif: ''`, `version: 0` ou un auteur fabriqué compilait
   et laissait 1943 unitaires + 397 e2e au vert — alors que le contenu de cette entrée **EST** la trace
   d'imputabilité (AC-1/AC-2). Même angle mort sur l'org-scoping : les e2e d'isolation *stubent* le
   service, donc prouvent le transport du 404, jamais l'isolation elle-même.
3. **L'OpenAPI mentait sur le 409 le plus fréquent.** `/valider` renvoie **deux** corps de 409 ; la
   réponse était typée sur la seule forme `CONTROLES_BLOQUANTS`, celle que la porte par défaut ne produit
   **jamais**. Le front générait un type promettant `details.bloquants` sur le cas courant (balance déjà
   figée) où il est absent — et ne pouvait pas discriminer sur `code`, son type n'en connaissant qu'une
   valeur. Les deux formes sont désormais publiées en `oneOf`.

### 🔒 Revue de sécurité — 1 vulnérabilité trouvée et corrigée

**CWE-770 / A04:2021 — `POST /rejeter` rejouable à l'infini** (confiance 85). `historiqueMutations` est
append-only et **non plafonné** ; la seule garde étant l'immutabilité de `VALIDÉE`, un utilisateur
**légitime** du tenant (aucune élévation de privilège) pouvait rejouer le rejet indéfiniment sur la même
balance : ~700 octets par appel, 100 appels/min autorisés par le throttler ⇒ limite BSON de 16 Mo en
quelques heures. Passé ce seuil, tout `$push` échoue : la balance devient **définitivement** invalidable
et irrejetable — immuable *par accident*, l'inverse exact de ce que la story livre. Bien avant ce seuil,
chaque lecture transfère un document de plusieurs Mo : l'amplification est subie par **tous** les tenants.

**Correctif** : une transition vers l'état déjà en cours est refusée sans écriture ⇒ deux mutations au
maximum par balance, tableau borné **par construction**. Pas de `$push`/`$slice` : plafonner en tronquant
supprimerait des entrées d'audit, au prix exact de la défense légale (NFR-A04) que le plafond protège.

**Écarté après instruction** : le scan signalait `REJETÉE → VALIDÉE` comme un contournement de workflow.
Le rejet n'a **jamais** été une barrière d'autorisation — les 20 contrôleurs du service portent le même
`@Roles(TENANT_ADMIN, TENANT_USER)`, donc quiconque peut re-valider aurait pu valider directement depuis
`BROUILLON` : aucune frontière de privilège n'est franchie. Et le § D pose explicitement `REJETÉE` comme
non terminale. ➡️ **À trancher avec le PO** (séparation préparateur/réviseur), tracé pour STORY-098.
Également instruits sans défaut : isolation multi-tenant, imputabilité de l'auteur, race sur la double
validation, contournement de la porte, fuite via `details.bloquants`, injection NoSQL via `motif`,
throttler.

### Portes de qualité

Lint **0 warning** · build OK · **1948 unitaires + 399 e2e** verts · couverture
**98.77 / 90.97 / 97.88 / 98.80** (seuils 65/90/90/90) · **16 mutation-tests, tous rouges à la mutation** :
garde d'immutabilité retirée · verdict de la porte ignoré · porte appliquée au rejet · session non
transmise à la porte · porte déplacée après l'écriture · auteur lu du corps · rognage du motif retiré ·
`200` devenu `201` · motif altéré à l'écriture · version de mutation figée · auteur fabriqué par le
service · relecture non org-scopée · `horodatageValidation` reposé sur un rejet · repository réécrivant
un champ absent du patch · garde de transition sans effet retirée · garde élargie à `!== BROUILLON`.

### Vérification docker (obligatoire — stack neuve `down -v`)

Deux organisations réelles enregistrées sur l'IdP, e-mails vérifiés, read-models `orgkycstatuses`
(`APPROVED`) et `orgbalanceentitlements` (`ACTIVE` + `syscohada-revise@2.1`) semés en **ObjectId**.

| # | Contrôle | Résultat |
|---|---|---|
| 1 | `POST /balances` | `201`, `etat: BROUILLON` |
| 2 | `POST /:id/valider` | `200`, `etat: VALIDÉE`, `historiqueMutations` portant l'auteur **du JWT** et le motif |
| 3 | Rejeu `valider` **et** `rejeter` | `409 BALANCE_DEJA_VALIDEE` × 2, document **strictement identique** avant/après |
| 4 | Org B vise la balance d'org A | `404`, indiscernable d'un id inexistant |
| 5 | `GET /:id` | renvoie bien `VALIDÉE` — ce que FE-027 affiche déjà |
| 6 | `motif: "   "` · `auteur` dans le corps | `400` × 2, **aucune écriture**, `etat` toujours `BROUILLON` |
| 7 | `motif: "  Écarts non justifiés  "` | persisté **rogné** : `Écarts non justifiés` |
| 8 | `REJETÉE` puis `valider` | `200` — non terminale, historique append-only à 2 entrées |
| 9 | **Porte rendue refusante en conteneur** | `409 CONTROLES_BLOQUANTS`, `details.bloquants` **survivant au filtre**, zéro écriture, et le **rejet passe malgré tout** |
| 10 | Rejet → `horodatageValidation` | champ **absent** (pas nul) ; posé sur validation ; récupéré lors d'une revalidation |
| 11 | `/api/docs-json` | `oneOf` des deux formes de 409, 4 modèles publiés |
| 12 | **10 rejets consécutifs** sur la même balance | `200` puis **9 × 409**, historique à **1** entrée et non 10 |

⚠️ Le provider `{ provide: VALIDATION_GATE, useClass: ValidationGatePassante }` n'est exercé par **aucun**
test (aucun spec ne construit `BalanceModule`, tous les e2e mockent `BalanceService`) : un oubli laisserait
la CI **entièrement verte** et ne se manifesterait qu'au boot. C'est la vérification docker — service
réellement démarré — qui en tient lieu.

### Ce qui reste ouvert

- **STORY-098** branche ses huit contrôles GUIDEF sur `VALIDATION_GATE` : un `useClass`, rien d'autre.
- **Amendement de FE-027** : câbler les deux actions, discriminer les trois codes de `409` sur `code`.
- **Séparation préparateur/réviseur** à arbitrer avec le PO (voir revue de sécurité ci-dessus).
- Le jour où un `balance.validated` sera nécessaire, il devra passer par **l'outbox transactionnel** de
  STORY-099 — jamais par une émission directe dans la transaction.
