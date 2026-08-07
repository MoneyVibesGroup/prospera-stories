# STORY-179 : Les pièces KYC sont signées sur un hôte que **le navigateur ne peut pas joindre**

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §A · **AP-03** · **STORY-013** *(URLs présignées de la revue admin)* · **FE-023** *(le même défaut, déjà payé sur `auth-service`)*
**Découverte par :** AP-INT-1, en affichant enfin le vrai document dans la console
**Priorité :** Must Have — ⚡ **la revue KYC est inexploitable tant que ce n'est pas fait**
**Story Points :** 3
**Statut :** ✅ Terminée *(2026-08-07)*
**Complexité :** low
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`)

---

## Le constat

`StorageModule` n'instancie **qu'un seul** client MinIO, sur l'endpoint **interne** :

```ts
// kyc-service/src/storage/storage.module.ts:19-27
const minio = config.getOrThrow<MinioConfig>('minio');
return new Client({ endPoint: minio.endPoint, /* … */ });   // 'minio' (nom docker), jamais 'localhost'
```

`presignedGetUrl` *(storage.service.ts:56)* signe donc `http://minio:9000/kyc-documents/…`. Cette URL
est **parfaitement valide côté serveur** — et **irrésoluble depuis un navigateur**, qui n'a aucune
entrée DNS pour `minio`.

⚡ **`auth-service` a déjà résolu exactement ce problème.** Le patron existe, il suffit de le recopier :

| | `auth-service` | `kyc-service` |
|---|---|---|
| Client interne | `MINIO_CLIENT` *(storage.module.ts:27)* | `MINIO_CLIENT` *(storage.module.ts:22)* |
| Client **public** | ✅ `MINIO_PUBLIC_CLIENT` sur `minio.publicEndPoint` *(storage.module.ts:41-46)* | ❌ **aucun** |
| Variables | `MINIO_PUBLIC_ENDPOINT` / `MINIO_PUBLIC_PORT` *(compose:109-110)* | ❌ aucune |

## Pourquoi ça n'a pas été vu plus tôt

Parce que **personne n'avait jamais affiché le document**. Jusqu'à AP-INT-1, la console dessinait une
feuille synthétique à partir du type de pièce : elle n'a jamais chargé l'URL, donc elle n'a jamais pu
constater qu'elle était injoignable. Le champ était servi, lu par personne, et donc juste par défaut.

> ⚡ **Une URL ne se vérifie qu'avec le client qui la consommera.** `curl` depuis l'hôte, le runner
> de tests, un test d'intégration côté service : tous ont accès au réseau docker. L'opérateur, non.
> C'est mot pour mot la leçon de FE-023, redécouverte sur un second service.

**Conséquence aujourd'hui :** l'opérateur ouvre un dossier, voit le cadre du document — et **rien
dedans**. La console affiche désormais un lien « Ouvrir dans un onglet » pour que l'échec porte le
message du navigateur plutôt que de ressembler à un bug du front. **Ça ne remplace pas ce correctif.**

---

## Décision attendue AVANT de coder

| Question | Issues |
|---|---|
| **`document-service` porte le même défaut** *(configuration.ts:242, 257, 285 — `endPoint` interne partout)*. Aucun écran ne le consomme aujourd'hui. | ① Le corriger dans la foulée *(même patron, même heure)* · ② Le tracer en story distincte. ⚠️ Ce qui ne se défend pas : le laisser se redécouvrir une **troisième** fois |
| **CORS sur MinIO** | Inutile pour un affichage `<iframe>`/`<img>` — **nécessaire** si un client doit `fetch()` la pièce *(l'e2e de la console le fait)*. À trancher ici, pas à l'implémentation |

### ✅ Arbitrages rendus au lancement — 2026-08-07 (décision user)

**① `document-service` ⇒ story distincte, pas dans celle-ci.** Décidé **sur un fait mesuré, pas par
prudence** : `grep -rn "presigned" document-service/src` rend **zéro occurrence**. Ce service *lit* des
objets MinIO pour l'OCR, il ne **signe aucune URL** — donc il ne porte pas le défaut, il porte le
*terrain* du défaut. Y poser un `MINIO_PUBLIC_CLIENT` aujourd'hui produirait un provider **sans aucun
consommateur** : invisible aux seuils de couverture, non prouvable en docker (rien à afficher), et
inerte jusqu'au jour où quelqu'un signera — exactement le profil du livrable mergé et mort de
STORY-173. Ce qui est refusé, c'est l'oubli : l'entrée de story est créée **dans le même commit `docs/`
que cette clôture**, avec le patron et les 3 lignes à changer, pour qu'une 3ᵉ redécouverte soit
impossible.

**② CORS MinIO ⇒ mesuré avant d'être configuré.** Le service `minio` du `docker-compose.yml` racine ne
fixe **aucun** `MINIO_API_CORS_ALLOW_ORIGIN` : il tourne donc sur le défaut de l'image, qui doit être
**constaté par un préflight `OPTIONS` réel** depuis l'origine de la console (`:3110`) en phase de
vérification docker — pas supposé. Si MinIO répond déjà, **aucune ligne n'est ajoutée au compose** et le
résultat est consigné ici ; s'il ne répond pas, l'allowlist est posée dans la foulée. ⚠️ Raison de ne
pas durcir *a priori* : le compose racine n'est versionné **dans aucun dépôt** — un durcissement y vivrait
hors de toute CI et hors de toute revue, précisément le piège payé en STORY-173.

---

## Périmètre

- Un **second client MinIO** dédié aux URL destinées au navigateur, sur le patron d'`auth-service`
  *(`MINIO_PUBLIC_CLIENT`)*.
- Variables `MINIO_PUBLIC_ENDPOINT` / `MINIO_PUBLIC_PORT` *(+ `MINIO_PUBLIC_USE_SSL`)*, avec repli
  sur l'endpoint interne quand elles sont absentes — un déploiement où les deux coïncident ne doit
  rien avoir à configurer.
- `presignedGetUrl` — utilisé par la **revue admin** — signe avec le client **public**.
- Entrée `kyc-service` du `docker-compose.yml` racine alignée sur celle d'`auth-service`.

### Hors périmètre

Le dépôt de pièces *(`presignedPutUrl` s'il arrivait un jour)* : il est fait par le serveur, il doit
rester sur l'endpoint interne. ⚠️ Signer un **upload** avec le client public l'exposerait sans raison.

---

## Critères d'acceptation

1. `GET /api/v1/admin/kyc/:orgId` renvoie des `documents[].url` portant l'hôte **public**.
2. Variables absentes ⇒ repli sur l'endpoint interne, **sans erreur au démarrage** : le comportement
   actuel reste le défaut.
3. La signature reste valide : l'URL publique est acceptée par MinIO *(l'hôte fait partie de ce qui
   est signé — signer avec l'un et servir l'autre produit un `SignatureDoesNotMatch`)*.
4. Le TTL (`MINIO_PRESIGNED_TTL`) est inchangé — cette story ne touche pas à la durée de vie.
5. ⚡ **Preuve navigateur depuis `:3110`** : ouvrir une revue KYC et **voir le document s'afficher**.
   Une vérification `curl` ou depuis le runner ne prouve **rien** ici — c'est très exactement le
   piège que cette story corrige.
6. Non-régression : aucune URL présignée n'apparaît dans les journaux *(elle porte sa propre
   autorisation — invariant de STORY-013)*.

---

## Definition of Done

- [x] Arbitrage `document-service` + CORS MinIO **tranché et consigné** *(les deux au lancement ; le
      second re-tranché **par la mesure** en vérif docker : rien à ajouter au compose)*
- [x] Les 6 critères vérifiés · `lint` 0 · couverture 95.95 / 91.94 / 94.91 / 95.85
- [ ] ⚡ Le test `e2e/integration-gate.spec.ts` marqué `test.fail()` côté console — « l'URL présignée
      est joignable DEPUIS LE NAVIGATEUR » — **passe au vert et son `test.fail()` est retiré**
      → ⚠️ **TRANSMIS AU FRONT, non cochable ici** : ce fichier vit dans le dépôt de la console, absent
      de cet espace de travail. La preuve navigateur ci-dessus (Chrome headless depuis `:3110`, dans les
      deux sens) est le feu vert : le `test.fail()` peut être retiré et doit passer.
- [x] Branche `MNV-179`, PR **kyc-service#13 rebase-mergée sur `dev`** (`53a0e0d`), branche supprimée

---

## Progress Tracking

### Démarrage 2026-08-07 — état trouvé, et ce qui est hors d'atteinte

**Le défaut est confirmé, ligne à ligne** : `kyc-service/src/storage/storage.module.ts` fournit un seul
provider `MINIO_CLIENT` sur `minio.endPoint`, `storage.service.ts:56` signe avec **ce** client, et
`configuration.ts:170-180` n'expose ni `publicEndPoint`, ni `publicPort`, ni `publicUseSSL` — **ni même
`region`**, que le patron d'`auth-service` déclare INDISPENSABLE côté public (sans elle le client SDK va
découvrir la région **par le réseau** avant de signer, sur un hôte que le conteneur ne peut pas joindre :
`ECONNREFUSED` silencieux, cf. mémoire STORY-129). `env.validation.ts` ne déclare **aucune** variable
`MINIO_*`, et l'entrée `kyc-service` du compose n'en porte que 4 (aucun `MINIO_PORT`, aucun
`MINIO_REGION`), contre 8 côté `auth-service`.

**⚠️ Point de DoD hors d'atteinte depuis ce dépôt** : le retrait du `test.fail()` sur
`e2e/integration-gate.spec.ts` vit dans le dépôt de la **console front**, qui n'est pas dans cet espace de
travail (`find` sur les 8 services + `docs/` = fichier introuvable). Ce dépôt-ci ne peut donc pas cocher
cette case : elle est **transmise au front**, avec la preuve navigateur produite ci-dessous comme feu vert.

**⚠️ Dépendance de vérification, connue et contournée à la main** : le tracker note (GAP
`console-inexercable-faute-de-donnees`) que 179 « n'est pas vérifiable sans 180 » — sans dossier semé,
aucune pièce à afficher. STORY-180 n'étant pas tirée, le dossier de revue est créé **à la main par les
API réelles** pour cette vérification (organisation, upload d'une pièce réelle dans le bucket, passage en
`UNDER_REVIEW`). Cela prouve *cette* story ; cela ne remplace pas 180, dont l'objet est de rendre le semis
**reproductible**.

### Ce qui a été livré

| Fichier | Changement |
|---|---|
| `storage.constants.ts` | `MINIO_PUBLIC_CLIENT` + l'interdit explicite : **jamais pour écrire** |
| `storage.module.ts` | seconde fabrique sur `publicEndPoint`/`publicPort`/`publicUseSSL`, `region` des **deux** côtés |
| `storage.service.ts` | `presignedGetUrl` signe par le client **public** ; `putObject` reste sur l'interne |
| `configuration.ts` | `publicEndPoint`/`publicPort`/`publicUseSSL` + `region`, chacun avec **repli sur l'interne** |
| `env.validation.ts` | 7 variables `MINIO_*` déclarées — il n'y en avait **aucune** — toutes optionnelles, bornes validées |
| `.env.example` · `docker-compose.yml` | entrée `kyc-service` alignée sur `auth-service` (+ `MINIO_PORT`, absent lui aussi) |

⚡ **`region` n'est pas cosmétique, c'est mesuré** : un client sans `region` fait un **appel réseau** pour
découvrir la région *avant* de signer. Vérifié hors Nest — `endPoint: 'kyc.prospera.invalid'` sans
`region` ⇒ `ENOTFOUND` ; avec `region` ⇒ URL signée hors-ligne en quelques millisecondes. Comme l'hôte
public n'est **pas** joignable depuis le conteneur, l'oublier aurait produit un `ECONNREFUSED` silencieux
et la pièce aurait disparu de la réponse — le défaut d'origine, remplacé par un autre.

### Portes DoD

`lint` 0 warning · `build` OK · **305 unitaires** (36 suites) à **95.94 / 91.94 / 94.91 / 95.84** — au-dessus
de 65/90/90/90 · **73 e2e** (5 suites) verts. `storage.service.ts` à 100 % sur les 4 axes.

### Valeur probante — 5 mutations, 5 rouges

| # | Mutation | Test qui vire au rouge | Signature de l'échec |
|---|---|---|---|
| M1 | Les deux clients injectés **échangés** ⇒ `presignedGetUrl` signe par l'interne *(le défaut d'origine)* | `storage.service.spec` (6/6) | `Expected "http://localhost:9000/publique"` / `Received "http://minio:9000/interne"` |
| M2 | La fabrique publique construit sur `minio.endPoint` | `storage.module.spec` | `Expected "console.prospera.invalid"` / `Received "minio"` |
| M3 | `region` retirée de la fabrique publique | `storage.module.spec` | `getaddrinfo ENOTFOUND console.prospera.invalid` |
| M4 | Repli **inversé** dans `configuration.ts` (l'interne prime) | `configuration.spec` | `Expected "localhost"` / `Received "minio"` |
| M5 | `@Max(65535)` retiré sur `MINIO_PUBLIC_PORT` | `env.validation.spec` | port 70000 accepté |

⚠️ **Une première mutation a été écartée parce qu'elle ne prouvait rien.** Écrire directement
`this.client.presignedGetObject` fait échouer la suite sur `TS6138 — 'publicClient' is declared but its
value is never read` : **une erreur de compilation, pas une assertion**. Rouge, mais rouge pour la
mauvaise raison — cela n'aurait dit *rien* du pouvoir discriminant du test. Elle a été rejouée sous une
forme qui compile (échange des deux paramètres injectés), et c'est cette forme-là qui donne la signature
du tableau. *(Effet de bord utile à connaître : tant que `publicClient` est injecté, le compilateur refuse
qu'on cesse de s'en servir.)*

### Vérification docker — stack NEUVE (`down -v`), contrôle avant/après

Stack : `mongo` + `kafka` + `minio` + `auth-service` + `kyc-service`, volumes réinitialisés.
`Found 0 errors. Watching for file changes.` puis `Bucket MinIO « kyc-documents » créé.`

**Jeu de données réel, créé par les API** (pas de fixture, pas de mock) : cabinet inscrit sur l'IdP →
e-mail vérifié → login `TENANT_ADMIN` → **2 pièces réellement téléversées** (un PDF `RCCM`, un PNG `CFE`
décodable par un navigateur). Bascule automatique constatée en base :

```
kyc_service > db.tenantkycprofiles → [{ status: 'UNDER_REVIEW' }]
kyc_service > db.kycdocuments      → RCCM  kyc/6a75b18a…/e2af2512-…  SUBMITTED
                                     CFE   kyc/6a75b18a…/d862abea-…  SUBMITTED
```

⚠️ **Piège de nommage, à l'envers de la règle habituelle** : ici les collections sont les **pluriels
Mongoose par défaut** (`tenantkycprofiles`, `kycdocuments`), pas du `snake_case`. Une requête sur
`tenant_kyc_profiles` renvoie `[]` **sans erreur** — c'est ce qui est arrivé au premier essai. Toujours
commencer par `db.getCollectionNames()`.

| | **AVANT** *(variables publiques RETIRÉES = comportement d'avant la story)* | **APRÈS** *(compose de la story)* |
|---|---|---|
| Hôte des `documents[].url` | `minio:9000` | **`localhost:9000`** |
| Démarrage du service | ✅ `UP`, aucune erreur — **critère 2** | ✅ `UP` |
| `curl` depuis l'hôte | `HTTP=000` *(hôte irrésoluble)* | **`HTTP=200`** |
| Binaire reçu | — | **sha256 identique** à ce qui a été téléversé, des deux côtés |

⚠️ La colonne AVANT a été obtenue en **retirant** les variables (fichier d'override avec `MINIO_PUBLIC_ENDPOINT:`
sans valeur), **pas en les vidant** : `${VAR:-défaut}` réactive le défaut sur une variable vide — piège
payé en STORY-173. Elle vaut aussi comme preuve du **critère nº2** : sans les variables, le service
démarre et se comporte exactement comme avant.

### ⚡ Critère nº5 — preuve NAVIGATEUR, dans les deux sens

Chrome headless, page servie sur **`http://localhost:3110`** — l'origine réelle de la console — chargeant
la pièce en `<img>` **et** en `fetch()` *(le `fetch` déclenche le CORS ; l'`<img>` non)* :

```
APRÈS  {"origine":"http://localhost:3110","img":"AFFICHÉE 1x1",
        "fetchCfe":"200 / image/png / 70 octets","fetchRccm":"200 / application/pdf / 68 octets"}
AVANT  {"origine":"http://localhost:3110","img":"ÉCHEC DE CHARGEMENT","fetch":"ÉCHEC Failed to fetch"}
```

Le contrôle **négatif** est ici la moitié qui compte : il reproduit exactement ce que voyait l'opérateur
— le cadre du document, et rien dedans. *(Ce contrôle négatif en navigateur est précisément celui que
STORY-173 n'avait pas pu exécuter.)*

### Arbitrage nº2 tranché PAR LA MESURE : rien à ajouter au compose

Préflight `OPTIONS` réel sur l'URL présignée, MinIO sur son défaut :

| `Origin` envoyé | `Access-Control-Allow-Origin` reçu |
|---|---|
| `http://localhost:3110` | `http://localhost:3110` |
| `https://evil.example` | `https://evil.example` |
| `null` | `null` |

MinIO **reflète l'origine appelante, quelle qu'elle soit** (`204`, `Access-Control-Allow-Credentials: true`,
`Vary: Origin`). Le `fetch()` de la console passe donc sans configuration : **aucune ligne n'est ajoutée au
`docker-compose.yml`**, conformément à l'arbitrage. ⚠️ **Constat transmis à la revue de sécurité, pas
masqué** : ce défaut est *permissif*. Il ne donne rien à qui ne possède pas l'URL signée (l'autorité est
**dans l'URL**, il n'y a ni cookie ni session sur MinIO — donc pas d'autorité ambiante à voler), mais
`MINIO_API_CORS_ALLOW_ORIGIN` reste une défense en profondeur légitime, à traiter avec le durcissement
MinIO de production et non ici.

### Critères nº4 et nº6

- **nº4** — `X-Amz-Expires=300` sur les URLs servies : le TTL (`MINIO_PRESIGNED_TTL`) est **inchangé**.
- **nº6** — `grep -ciE "X-Amz-Signature|X-Amz-Credential|presigned|kyc-documents/kyc/"` sur tous les
  journaux du service : **0**. Témoin que le grep n'est pas vide de sens : le même journal contient bien
  les 8 lignes de l'appel `GET /api/v1/admin/kyc/:orgId 200`, dont l'URL n'est pas journalisée.

### Revue de code — 1 constat, corrigé (commit dédié `bec453b`)

**`MINIO_PUBLIC_USE_SSL` était la seule variable CRÉÉE par la story à n'être déclarée dans aucun schéma
de validation.** `configuration.ts` la compare à la **chaîne** `'true'` : `MINIO_PUBLIC_USE_SSL=1` — ou
`True`, ou `on` — vaut donc silencieusement `false`. Le client public repart en `http://` sur un endpoint
servi en TLS, la pièce est bloquée en **contenu mixte** par le navigateur, la signature est pourtant
valide et **rien** n'apparaît côté serveur : le mode de panne même que cette story ferme, déplacé d'un
cran.

⚡ **En le vérifiant, le constat s'est révélé plus large que signalé.** Le repli **introduit par cette
story** fait passer `MINIO_USE_SSL` (préexistant) dans le client public : ne valider que la variable
publique laissait le trou ouvert **par l'autre chemin**. Les deux sont donc validées —
`@IsIn(['true','false'])` et **non** `@IsBoolean()` nu, qui serait pire (`Boolean('false') === true`,
piège payé en STORY-093). Mutation M6 : garde retirée ⇒ 4 tests rouges.

⚠️ **Le `git checkout --` de restauration de M6 a emporté le correctif, qui n'était pas encore commité** —
exactement l'incident consigné en STORY-144. Détecté et réappliqué immédiatement. La leçon tient : ne
mutation-tester qu'un arbre **commité**.

Écartés en connaissance de cause : le repli **partiel** (`MINIO_PUBLIC_ENDPOINT` sans
`MINIO_PUBLIC_PORT` ⇒ `https://hôte:9000`) — c'est le repli champ par champ documenté, identique à
`auth-service`, un choix et non un défaut ; la validation ajoutée à 4 variables MinIO **préexistantes** —
techniquement au-delà du cadrage, mais c'est le bloc `auth-service` recopié tel quel, sans risque de boot.

⚠️ Le correctif touchant la **validation au boot**, la vérification docker a été **rejouée sur l'état
final** : service `UP`, zéro `Configuration d'environnement invalide`, URLs toujours sur `localhost:9000`
avec `X-Amz-Expires=300`, récupération `HTTP=200`. Aucun résultat mesuré avant le correctif n'est reporté.

### Revue de sécurité — **aucune vulnérabilité**

Le changement est un changement d'**hôte de signature à autorité constante** : même bucket privé, même
signature SigV4, même TTL, dépôt toujours confiné au réseau docker.

- **Le CORS réfléchi de MinIO n'est pas une faille ici**, et l'argument est précis : l'API S3 n'a
  **aucune session par cookie** sur `:9000`. L'unique porteur d'autorisation est la signature dans la
  query string ⇒ `Access-Control-Allow-Credentials: true` **ne confère rien**, il n'existe pas d'autorité
  ambiante à voler. C'est le cas où « ACAO réfléchi + ACAC true » (CWE-942), normalement critique, est
  **inerte**. Une page hostile sans l'URL signée reçoit un `403 AccessDenied` ; avec l'URL, elle n'a pas
  besoin de CORS (`curl` suffit).
- ⚡ **Correction d'une prémisse de la story** : l'endpoint MinIO n'était **pas** « confiné au réseau
  docker » — le compose publiait déjà `9000:9000` **avant** cette PR. Seule la *signature* l'était. La PR
  ne change donc rien à l'exposition réseau.
- Identifiants root partagés avec le client public : sans conséquence, il **ne fait aucun appel réseau**
  (`region` fixée ⇒ signature hors-ligne). L'URL ne divulgue que l'`accessKeyId`, déjà le cas avant.
- Signer une **écriture** avec le client public : impossible en l'état — aucun `presignedPutObject` dans
  tout `src/`, `putObject` est câblé en dur sur le client interne, et un test le garde.
- Repli mal renseigné ⇒ URL irrésoluble ⇒ **panne de disponibilité, jamais fuite** : fail-closed.

**Deux durcissements notés, volontairement NON faits ici** *(ni l'un ni l'autre n'atteint le seuil de
constat, et tous deux relèvent du déploiement de production, hors périmètre)* :

1. `MINIO_API_CORS_ALLOW_ORIGIN` sur le service `minio` du compose, limité à l'origine de la console.
2. `MINIO_PUBLIC_USE_SSL` a pour défaut `false` : un déploiement qui renseignerait `MINIO_PUBLIC_ENDPOINT`
   sur un hôte réel **en oubliant** ce drapeau ferait transiter en clair les pièces d'identité **et**
   l'URL-credential. À traiter avec le durcissement MinIO de production — pas par un `NODE_ENV`
   conditionnel improvisé ici.

### ⚠️ Le correctif de compose ne vit dans aucun dépôt — recopié ici in extenso

La racine PROSPERA n'est versionnée nulle part. C'est ce qui a rendu STORY-173 inerte sans le moindre
signal, et ce serait le cas ici aussi. Entrée `kyc-service` de `docker-compose.yml`, telle qu'appliquée :

```yaml
      MINIO_ENDPOINT: ${MINIO_ENDPOINT:-minio}
      MINIO_PORT: ${MINIO_PORT:-9000}
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
      MINIO_BUCKET: ${MINIO_BUCKET:-kyc-documents}
      MINIO_PUBLIC_ENDPOINT: ${MINIO_PUBLIC_ENDPOINT:-localhost}
      MINIO_PUBLIC_PORT: ${MINIO_PUBLIC_PORT:-9000}
      MINIO_REGION: ${MINIO_REGION:-us-east-1}
```

*(`MINIO_PORT` manquait lui aussi : le service tournait sur le défaut de `configuration.ts`.)*

### Clôture — 2026-08-07

Statut **`done`** aux 3 endroits (en-tête, `sprint-status.yaml`, ici), `completed_date: "2026-08-07"`,
`assigned_to: vivianMoneyVibesGroupes`, S20 à **29/87** points. PR **kyc-service#13 rebase-mergée sur
`dev`** (`53a0e0d`), branche `MNV-179` supprimée.

**Arbitrage nº1 exécuté** : `document-service` est tracé en **STORY-352** *(et non 237 : le numéro était
déjà pris — `origin/main` fait foi, même règle qu'en STORY-173)*, avec le fait qui la justifie, le patron
et les sites à changer, pour qu'une 3ᵉ redécouverte soit impossible.

**Ce qui reste ouvert, nommément** : le `test.fail()` de la console *(dépôt front, hors de cet espace de
travail — feu vert donné par la preuve navigateur)* ; STORY-180, qui rendra **reproductible** le semis
fait ici à la main ; les 2 durcissements de production ci-dessus.
