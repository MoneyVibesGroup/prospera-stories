# STORY-149 : Dépôt d'un paquet de référentiel par la console (upload d'artefact, sha256 calculé côté serveur, publication versionnée)

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` · **STORY-032** (catalogue admin CRUD) · **STORY-038** (`ReferentielPackage` : pointeur + checksum) · **STORY-105** (RBAC D15, catalogue figé de 8 permissions) · **AP-04** (console : registre des référentiels)
**Priorité :** Should Have
**Story Points :** 8
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 20
**Service :** `platform-catalog-service` — **+ 3 dépôts pour la seule propagation du catalogue de permissions**
(`auth-service`, `kyc-service`, `admin-panel`) ⇒ **4 branches `MNV-149`, 4 PR module**, plus la PR `docs/`.
**Branche :** `MNV-149`

---

## Contexte

**Le catalogue décrit les paquets ; personne ne peut en déposer un.**

`ReferentielPackage` (STORY-038) stocke un **pointeur d'artefact** (`oci://`, `s3://`, `https://`)
et un **sha256**. Les deux sont saisis à la main par l'administrateur, qui doit avoir publié
l'artefact ailleurs, par un moyen extérieur à la plateforme, et recopier une empreinte de 64
caractères hexadécimaux.

Deux conséquences opérationnelles :

1. **Aucun chemin dans le produit** pour l'événement métier réel : un pays publie une évolution
   du plan comptable (nouvelle version SYSCOHADA, révision SFD-BCEAO, texte CIMA). Aujourd'hui
   l'admin doit passer par l'infra.
2. **Une classe d'erreur non rattrapable.** Une faute de frappe dans le sha256 produit un
   référentiel enregistré avec une empreinte fausse. Rien ne le détecte : `catalog-service` ne
   télécharge pas l'artefact. L'erreur se révèle quand un cabinet ouvre le module et que
   `bilan-service` refuse le paquet — c'est-à-dire loin, tard, et sans lien visible avec la saisie.

⚠️ **Ce que la console fait déjà, et ce qu'elle ne peut pas faire.** `frontend-admin-panel` calcule
désormais le sha256 du fichier choisi (Web Crypto, `src/features/catalog/artifact-digest.ts`) et
pré-remplit le champ — ce qui retire la faute de frappe. Mais **le fichier ne part nulle part** :
il n'existe aucune route de dépôt. L'écran le dit explicitement plutôt que de le laisser croire.

---

## Porteur : `platform-catalog-service`, et non `document-service`

Tranché, avec le motif.

`document-service` gère les **pièces KYC** : documents d'une organisation, privés, présignés,
soumis à rétention et à une chaîne de revue. Un paquet de référentiel est l'exact opposé : c'est un
**actif de plateforme**, public à tous les tenants entitled, immuable une fois publié, versionné, et
dont le cycle de vie est celui du catalogue (`ACTIVE` / `DEPRECATED` / `RETIRED`).

Le porter par `document-service` obligerait à y introduire une seconde notion d'objet, sans
organisation propriétaire ni rétention, et à faire dépendre le catalogue d'un service de pièces
justificatives. Le checksum, lui, appartient **déjà** à `catalog-service` (STORY-038) : séparer le
dépôt de l'empreinte reviendrait à couper en deux l'invariant que cette story vient renforcer.

⇒ **`platform-catalog-service`**, avec un backend de stockage objet (S3/MinIO) monté par l'infra.

---

## User Story

En tant qu'**administrateur plateforme**,
je veux **déposer le paquet d'un référentiel depuis la console et le publier en une version**,
afin de **répercuter une évolution réglementaire publiée par un pays sans passer par l'infra**.

---

## Périmètre

**Inclus :**

0. **`referentiel:publish`, 13ᵉ code du catalogue**, propagé aux **4** copies et **vérifié par un
   guard** sur la seule route de dépôt (D-149-1).
1. `POST /catalog/admin/referentiels/:code/:version/artifact` — dépôt **multipart** (D-149-3).
2. **Le sha256 est calculé PAR LE SERVEUR** sur le flux reçu, et c'est **lui** qui est enregistré.
3. Contrôle d'intégrité du transport : si l'appelant fournit un `expectedChecksum`, une divergence
   est un **422** — le dépôt est rejeté, pas enregistré avec l'empreinte serveur.
4. Publication versionnée : un paquet déposé est **immuable**. Re-déposer sur une version existante
   est refusé (409) — on publie une nouvelle version.
5. `zone` (pays / zone réglementaire) sur la version de référentiel — l'admin doit savoir à quel
   périmètre s'applique le paquet qu'il octroie.

   ⚠️ **Décision PO du 2026-07-28 : `zone` est reportée ICI, elle n'est PAS implémentée côté
   front.** Le brief console la demandait dans le parcours de dépôt ; la porter côté front seul
   produirait un champ saisi, affiché, puis perdu à l'enregistrement — `ReferentielVersion` ne le
   transporte pas et aucune route ne l'accepte. Un champ qui ne persiste pas est **pire** qu'un
   champ absent : l'admin croit avoir renseigné le périmètre réglementaire du paquet. La console
   l'ajoutera quand cette story l'aura exposé.

**Hors périmètre :**
- La vérification d'intégrité au **chargement** — c'est `bilan-service`, inchangé.
- L'attribut `referentielFamilies` — c'est **STORY-148** (ex 145, renumérotée le 2026-07-31).

---

## ⚠️ Le sha256 est calculé côté serveur, jamais accepté du client

C'est l'invariant de cette story.

Accepter l'empreinte fournie par le client, c'est laisser l'appelant **décrire** le contenu qu'il
dépose au lieu de le **prouver**. Un client fautif — ou un octet perdu en transit — enregistrerait
un couple (artefact, empreinte) incohérent, et l'on retomberait exactement sur le défaut que la
story corrige, en le rendant plus difficile à voir puisqu'il y aurait eu un « upload réussi ».

Le calcul côté navigateur reste utile (retour immédiat, détection d'un mauvais fichier avant
l'envoi) mais il est **indicatif** : le serveur recalcule et fait foi.

---

## Critères d'acceptation

- [ ] **AC-1** — `POST …/artifact` accepte un multipart, stocke l'objet et renvoie l'empreinte
      **calculée par le serveur**.
- [ ] **AC-2** — L'empreinte enregistrée au catalogue est celle du serveur, en toutes circonstances
      (y compris lorsqu'un `expectedChecksum` concordant est fourni : il est **contrôlé**, jamais
      recopié).
- [ ] **AC-3** — `expectedChecksum` divergent ⇒ **422**, rien n'est stocké ni enregistré.
- [ ] **AC-4** — Re-dépôt sur une version déjà pourvue ⇒ **409** (immuabilité) — cf. D-149-4 : toute
      version existante est pourvue, l'index unique `(code, version)` en est le filet réel.
- [ ] **AC-5** — Taille maximale et types acceptés configurables ; dépassement ⇒ **413** portant
      `code: ARTIFACT_TOO_LARGE` **et `limitBytes`** (l'écran doit pouvoir dire « 8 Mo max », pas
      « échec ») — cf. D-149-5.
- [ ] **AC-6** — Un dépôt interrompu ne laisse **ni objet orphelin ni version à moitié publiée** :
      objet écrit d'abord, base ensuite, **objet ramassé** si l'enregistrement échoue.
- [ ] **AC-7** — `zone` exposée en lecture sur la version de référentiel (voie admin **et** voie
      lecture publiée), et renseignable au dépôt comme à la création par pointeur.
- [ ] **AC-8** — La route est gardée par `referentiel:publish` : un porteur de `catalog:manage`
      **seul** reçoit **403**, et le `PLATFORM_ADMIN` passe (son rôle système porte le catalogue
      entier).
- [ ] **AC-9** — Les **4** copies de `permission.enum.ts` restent identiques à l'octet près
      (`diff -q` vert entre les quatre).
- [ ] OpenAPI régénéré.

---

## Permissions — ⛔ IL EN MANQUE UNE

**C'était le point bloquant à arbitrer avant développement. ✅ Tranché — voir D-149-1.**

⚠️ **Le cadrage se trompait sur deux chiffres, vérifiés dans le code au lancement :**

- le catalogue n'est **pas à 8 codes mais à 12** (`org:read`, `org:suspend`, `kyc:approve`,
  `kyc:reject`, `entitlement:grant`, `entitlement:revoke`, `user:invite`, `role:manage`,
  `catalog:read`, `catalog:manage`, `project:read`, `project:manage`) — `catalog:*` et `project:*`
  sont arrivés après la rédaction (STORY-140/141). `referentiel:publish` est donc le **13ᵉ** code,
  pas le 9ᵉ ;
- il est dupliqué dans **quatre** dépôts et non trois — `permission.enum.ts` le dit lui-même :
  `auth-service`, `kyc-service`, `platform-catalog-service` **et `admin-panel`** (la copie oubliée
  par le cadrage de STORY-140).

La règle d'or reste : *« une permission n'existe que si un guard la vérifie »*. Aucun des 12 codes
ne désigne le dépôt d'un artefact de référentiel.

| Option | Conséquence |
|---|---|
| **A — réutiliser `catalog:manage`** | Aucun changement de catalogue. Mais quiconque édite une fiche module peut aussi **injecter un binaire** servi à tous les cabinets. Les deux gestes n'ont pas le même rayon de dégâts. |
| **B — ajouter `referentiel:publish`** (13ᵉ code) | Sépare l'administration éditoriale du dépôt d'exécutable. Coût : ouvrir un enum figé, dupliqué **octet pour octet dans quatre services**, et le propager (STORY-105/106, K4). |

**Recommandation : option B.** Un paquet de référentiel est du code exécuté par `bilan-service`
chez tous les porteurs. Le confondre avec « renommer un module » revient à donner un droit de
déploiement à qui n'a besoin que d'un droit de rédaction. Le coût de l'option B est ponctuel ; celui
de l'option A est permanent et invisible.

---

## Décisions de lancement (2026-08-05)

### D-149-1 — Option **B** : `referentiel:publish`, propagé **dans cette story**

Tranché par l'user au lancement. La story de propagation préalable qu'annonçait le cadrage n'est
**pas** créée : la propagation est mécanique (une entrée d'enum, un libellé côté IdP, les specs de
catalogue), elle ne comporte aucun jugement, et en faire une PR séparée laisserait la console
bloquée un cycle de plus pour ~30 lignes.

⚠️ **La propagation à `auth-service` n'est pas cosmétique, elle est vitale.** `PLATFORM_ADMIN` reçoit
`PERMISSION_CATALOG` **par construction** ([`jwt.strategy.ts`](../../auth-service/src/modules/auth/strategies/jwt.strategy.ts),
`system-roles.ts`) — depuis la copie de l'IdP. Sans propagation, le jeton d'un `PLATFORM_ADMIN` ne
porterait pas `referentiel:publish` et **la route de dépôt répondrait 403 à l'administrateur le plus
puissant de la plateforme**. De même côté `admin-panel` : son `CreatePlatformRoleDto` valide
`permissions[]` par `@IsEnum` sur **sa** copie, donc une copie en retard rejette en **400 au bord**
un rôle que l'IdP accepterait.

`auth-service` porte en plus le libellé humain (`permission-catalog.ts`, `Record<Permission, string>`
— une permission sans libellé **casse la compilation**, c'est voulu : le panel ne peut pas afficher
une case à cocher anonyme).

### D-149-2 — Le stockage vit **dans `platform-catalog-service`**, et **C3 est amendée explicitement**

Tranché par l'user au lancement, conformément au motif déjà écrit dans cette story (§ *Porteur*).

C3 (« le catalog ne détient que des **pointeurs** d'artefacts : aucun `StorageModule` ») est inscrite
en toutes lettres dans [`catalog.module.ts`](../../platform-catalog-service/src/modules/catalog/catalog.module.ts),
[`app.module.ts`](../../platform-catalog-service/src/app.module.ts),
[`env.validation.ts`](../../platform-catalog-service/src/config/env.validation.ts) et jusque dans les
en-têtes du schéma et du DTO. Cette story l'ouvre — **elle ne la contourne pas en silence** : les
cinq emplacements sont réécrits avec la date, le motif et le renvoi à cette story. Une décision
d'architecture qu'on enfreint sans la réécrire devient un commentaire qui ment.

Formulation retenue : *le catalogue peut désormais **héberger** l'artefact d'un référentiel, parce que
c'est lui qui en détient déjà l'ancre d'intégrité (le `checksum`, STORY-038). Il reste sans stockage
pour toute autre notion.*

### D-149-3 — La route s'aligne sur la surface admin existante

Le cadrage écrit `POST /catalog/referentiels/:code/versions/:version/artifact`. La surface réelle du
service est préfixée `/catalog/admin` et n'a pas de segment `versions` :
`POST /catalog/admin/referentiels`, `PATCH /catalog/admin/referentiels/:code/:version`.

⇒ Route retenue : **`POST /catalog/admin/referentiels/:code/:version/artifact`**. Aucun consommateur
n'est cassé : AP-12 est `blocked` et n'a jamais appelé l'ancienne forme.

### D-149-4 — Le dépôt **crée** la version ; il ne complète pas une version existante

Point non tranché par le cadrage, et il fallait le trancher : `CreateReferentielVersionDto` exige
**`artifactUri` ET `checksum`**. Il est donc aujourd'hui **impossible de créer une version puis de
lui déposer son paquet** — il faudrait inventer un pointeur et une empreinte bidon pour les remplacer
ensuite, c'est-à-dire écrire volontairement le couple incohérent que cette story vient supprimer.

Deux voies étaient possibles : rendre `artifactUri`/`checksum` optionnels (⇒ une version « déclarée
mais non publiée », donc un **nouvel état de cycle de vie** — l'enum `VersionStatus` est
`ACTIVE→DEPRECATED→RETIRED`, strictement descendant, et une version sans artefact serait `ACTIVE` et
octroyable **en pointant sur le vide**), ou faire du dépôt le geste de publication lui-même.

⇒ **Le dépôt publie.** `POST …/artifact` **crée** la `ReferentielVersion` avec le `checksum` calculé
par le serveur et l'`artifactUri` de l'objet écrit. Si `(code, version)` existe déjà — quelle que soit
sa provenance — c'est **409** : *on publie une nouvelle version*, exactement ce que dit le périmètre.
L'ancienne route par pointeur reste ouverte, inchangée, pour les paquets publiés hors plateforme.

⚡ **Conséquence sur l'AC « re-dépôt sur une version déjà pourvue ⇒ 409 » : elle est plus forte que
prévu** — toute version existante est « pourvue » par construction, puisque `artifactUri` a toujours
été obligatoire. L'immuabilité n'a donc aucun trou à couvrir.

### D-149-5 — Le 413 porte sa limite dans un champ, pas dans une phrase

`AllExceptionsFilter` construit le corps d'erreur par **liste blanche**
(`statusCode`, `error`, `message`, `code`, `requestId`) : un champ supplémentaire posé sur
l'exception serait **jeté sans erreur**, et l'AC « la limite dans le corps » serait tenue pour
satisfaite alors qu'elle ne l'est pas.

⇒ Le filtre gagne un champ **`limitBytes?: number`**, strictement additif et conditionnel, sur le
modèle exact du `code` de STORY-138. Le 413 porte donc `code: ARTIFACT_TOO_LARGE` **et**
`limitBytes` : l'écran calcule « 8 Mo max » au lieu de parser une phrase française.

### D-149-6 — Taille et types acceptés : 8 Mo, `application/json`, vérifiés sur le **contenu**

Un paquet de référentiel réel est un **JSON unique** produit par `build.mjs`
(`syscohada-revise-2.1.json` = 90 Ko, `sfd-bceao-2.0.json` = 32 Ko, `cima-assurances-1.0.json` =
21 Ko) — c'est ce fichier dont `bilan-service` vérifie le sha256 sur les octets.

- Plafond par défaut **8 Mo** (`REFERENTIEL_ARTIFACT_MAX_BYTES`), soit ~90× le plus gros paquet réel.
  Le « 40 Mo » de l'AC était une **copie d'écran d'exemple**, pas une exigence : ce qui est exigé,
  c'est que la limite soit configurable et lisible dans la réponse.
- Types acceptés configurables (`REFERENTIEL_ARTIFACT_MIME_TYPES`), défaut `application/json`.
- **Vérification sur le contenu, jamais sur l'extension ni sur le `Content-Type` déclaré** (règle
  posée par STORY-129) : les octets doivent s'analyser en un **objet** JSON. Un type mis dans
  l'allowlist sans validateur de contenu associé est **refusé** (fail-closed) — sans quoi élargir la
  liste par variable d'environnement désarmerait le contrôle en silence.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests unitaires + e2e (dont dépôt interrompu et re-dépôt).
- [ ] Décision de permission tranchée par le PO et **appliquée** (guard vérifié, pas seulement
      déclaré).
- [ ] Stockage objet provisionné par l'infra, documenté (bucket, rétention, accès).
- [ ] Portes projet : lint 0 warning · build · couverture ≥ 65/90/90/90 · unit + e2e verts sur les
      **4** services touchés.
- [ ] **Vérification docker réelle** : dépôt bout en bout sur la stack, objet présent dans MinIO,
      document Mongo portant l'empreinte **du serveur**, et absence d'orphelin après échec provoqué.
- [ ] OpenAPI publié ; console rebasculée sur la vraie route (retrait du bandeau
      « aucune route de dépôt n'existe encore »).
      ⚠️ **Ce dernier point restera NON FAIT** : `frontend-admin-panel` est absent de l'espace de
      travail (même constat qu'à la clôture de STORY-148) — il relève d'AP-INT-0 / AP-12.

---

## Progress Tracking

| Date | Phase | État |
|---|---|---|
| 2026-07-28 | rédaction | `draft`, sprint « à planifier » |
| 2026-08-01 | slottage | `ready-for-dev`, déplacée S19 → **S20** (décision PO) |
| 2026-08-05 | lancement | **`in_progress`** — arbitrages D-149-1 (option B) et D-149-2 (MinIO dans le catalogue, C3 amendée) rendus par l'user ; D-149-3 à D-149-6 tranchés au cadrage technique. 4 branches `MNV-149` ouvertes. |
