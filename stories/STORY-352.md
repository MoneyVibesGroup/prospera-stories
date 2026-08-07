# STORY-352 : `document-service` ne signe que sur l'endpoint MinIO **interne** — poser le client public avant qu'un écran en dépende

**Epic :** EPIC-003 — KYC (`document-service`)
**Réf. :** **STORY-179** *(arbitrage nº1 — le même défaut corrigé sur `kyc-service`)* · **FE-023** *(1ʳᵉ occurrence, `auth-service`)* · **STORY-173** *(le livrable inerte à ne pas rejouer)*
**Priorité :** Should Have — préventive : aucun écran ne consomme aujourd'hui une pièce servie par ce service
**Story Points :** 2
**Statut :** ✅ Terminée *(2026-08-07)*
**Complexité :** low
**Créée le :** 2026-08-07
**Sprint :** 20
**Service :** `document-service` (`:3006`)

---

## Le constat

`document-service` instancie **trois** clients MinIO — un par bucket, droits séparés (garde-fou #3) — et
**les trois pointent sur l'endpoint interne** :

```ts
// document-service/src/config/configuration.ts (avant la story)
minio:       { endPoint: process.env.MINIO_ENDPOINT ?? 'minio', … }   // kyc-documents    (lecture seule)
minioProfil: { endPoint: process.env.MINIO_PROFIL_ENDPOINT ?? process.env.MINIO_ENDPOINT ?? 'minio', … }
minioPiece:  { endPoint: process.env.MINIO_PIECE_ENDPOINT  ?? process.env.MINIO_ENDPOINT ?? 'minio', … }
```

`minio` n'est résoluble que **dans** le réseau docker, et la signature S3 **couvre l'hôte** : toute URL
présignée émise par ce service serait valide côté serveur et inutilisable côté navigateur. C'est le défaut
de FE-023 (`auth-service`) puis de STORY-179 (`kyc-service`) — **3ᵉ occurrence du motif « une garde posée à
un endroit et pas à l'autre »**.

## ⚡ Le fait qui distingue cette story des deux précédentes

```
grep -rn "presigned" document-service/src  →  1 seule occurrence, et c'est une ASSERTION D'ABSENCE :
  document-storage.reader.spec.ts:65  expect(surface.presignedGetUrl).toBeUndefined();
```

Ce service **lit** des objets MinIO pour l'OCR et en **écrit** deux catégories (profil, pièces comptables) ;
il n'en **signe aucun**, et aucun de ses trois contrôleurs ne renvoie d'URL. Il ne porte donc pas le défaut :
il porte le **terrain** du défaut. Rien n'est cassé aujourd'hui, rien ne le sera tant que personne ne signe.

## Le risque que la story doit éviter — et la façon de l'éviter

> ⚠️ Poser un client public **sans consommateur** produit exactement le profil de **STORY-173** : mergé,
> et **totalement inerte**. Les `*.module.ts` sont exclus de `collectCoverageFrom`, il n'y a aucun écran à
> montrer en vérification, et la variable manquante au compose est précisément ce qui avait rendu le
> livrable de STORY-173 mort sans que rien ne sonne.

Trois garde-fous **font partie du périmètre**, sans quoi la story ne doit pas être tirée :

| Mode de mort | Ce qui le ferme ici |
|---|---|
| Variable absente du compose *(STORY-173)* | `MINIO_PUBLIC_*` et `MINIO_REGION` **câblées au bloc `document-service`** de `docker-compose.yml` |
| Câblage invisible aux seuils *(`*.module.ts` hors couverture)* | `storage.module.spec.ts` **résout les providers** et assure endpoint/port/région ⇒ une mutation `publicEndPoint → endPoint` vire au rouge |
| « Ça signera bien le jour venu » — non vérifié | Preuve docker : signer depuis **le conteneur** avec la config du provider, puis `curl` l'URL **depuis l'hôte**, et montrer le **contraste** avec l'endpoint interne |

---

## Périmètre

### Inclus

1. **Bloc public partagé** dans `configuration.ts` : `publicEndPoint` / `publicPort` / `publicUseSSL`,
   chacun **retombant sur son équivalent interne** quand la variable est absente ⇒ un déploiement où les
   deux hôtes coïncident n'a rien à configurer, et le comportement d'avant la story reste le défaut.
2. **`region`, explicite, sur les clients — publics comme internes.** Sans elle le SDK **découvre la région
   par le réseau avant de signer** ; l'endpoint public (`localhost:9000`) désigne, depuis le conteneur, le
   conteneur lui-même ⇒ `ECONNREFUSED` silencieux (piège payé en STORY-129 puis STORY-179).
3. **Deux clients publics**, un par bucket **possédé** par le service :
   `MINIO_PROFIL_PUBLIC_CLIENT` (`profil-documents`) et `MINIO_PIECE_PUBLIC_CLIENT` (`piece-documents`),
   avec les **credentials du bucket correspondant** — la séparation des droits du garde-fou #3 est
   reconduite telle quelle côté public.
4. **`env.validation.ts`** : `MINIO_PUBLIC_ENDPOINT`, `MINIO_PUBLIC_PORT`, `MINIO_PUBLIC_USE_SSL`,
   `MINIO_REGION`, toutes **optionnelles** (repli), typées et bornées. `MINIO_PUBLIC_USE_SSL` en
   `@IsIn(['true','false'])` et **jamais** `@IsBoolean()` nu (`Boolean('false') === true`, STORY-093).
5. **`docker-compose.yml`** : les 4 variables sur le bloc `document-service`, mêmes défauts que
   `auth-service` / `kyc-service` (`localhost` / `9000` / `us-east-1`).
6. **Tests** : `storage.module.spec.ts` neuf — résolution des 5 providers, assertion du couple
   (endpoint, port, SSL, région) de chacun, et **non-régression du garde-fou #3** (aucun client public sur
   le bucket KYC).

### Hors périmètre — explicite

- ❌ **Aucun client public sur `kyc-documents`.** Ce bucket appartient à `kyc-service`, qui signe déjà ses
  pièces depuis STORY-179 ; le `DocumentStorageReader` est **délibérément** dépourvu de toute signature
  (garde-fou #3, assertion `presignedGetUrl` → `undefined` conservée telle quelle). En poser un ici
  élargirait les droits du chemin KYC pour zéro besoin.
- ❌ **Aucune méthode `presignedGetUrl`, aucun endpoint HTTP, aucun DTO.** Une méthode sans appelant est du
  code mort, pas un hook. Le jour où un écran consomme une pièce servie par ce service, la story
  consommatrice ajoute la méthode **et** son endpoint — le client, lui, sera déjà là et déjà prouvé.
- ❌ **Aucune configuration CORS sur MinIO** (arbitrage nº2 de STORY-179 : inutile pour `<img>`/`<iframe>`,
  et il n'y a ici aucun `fetch()`).
- ❌ **Aucun TTL de présigné** (`MINIO_PRESIGNED_TTL`) : il n'a de sens qu'avec un signataire.

## Hooks inertes documentés

- `MINIO_PROFIL_PUBLIC_CLIENT` / `MINIO_PIECE_PUBLIC_CLIENT` sont **exportés** par `StorageModule` et
  injectables partout. Leur `storage.constants.ts` porte l'interdit d'usage : **jamais** pour signer une
  écriture (`presignedPutUrl`) — cela exposerait le dépôt hors du réseau docker sans raison.
- Le bloc public de `configuration.ts` est unique et partagé : ajouter un 4ᵉ bucket possédé ⇒ un provider
  de plus, aucune variable de plus.

---

## Critères d'acceptation

| # | Critère | Vérifié par |
|---|---|---|
| AC-1 | `MINIO_PUBLIC_ENDPOINT` absente ⇒ `publicEndPoint === endPoint` (et idem port/SSL) — comportement d'avant la story inchangé | unit `configuration` |
| AC-2 | `MINIO_PUBLIC_ENDPOINT=localhost` ⇒ les **deux** clients publics sont construits sur `localhost`, les trois clients internes sur `minio` | unit `storage.module` |
| AC-3 | `region` est passée aux **5** clients (3 internes + 2 publics) ; défaut `us-east-1` | unit `storage.module` |
| AC-4 | Le client public **profil** porte les credentials profil, le client public **pièce** ceux des pièces — jamais croisés | unit `storage.module` |
| AC-5 | **Aucun** client public n'est câblé sur le bucket KYC ; `DocumentStorageReader` n'expose toujours pas `presignedGetUrl` | unit (non-régression) |
| AC-6 | `MINIO_PUBLIC_USE_SSL=oui` ⇒ **le boot échoue** (validation), il ne retombe pas silencieusement sur `false` | unit `env.validation` |
| AC-7 | Les 4 variables sont présentes au bloc `document-service` du compose, avec défauts `${VAR:-…}` | vérif docker |
| AC-8 | Une URL signée avec la config **publique** est téléchargeable **depuis l'hôte** ; la même signée avec la config **interne** ne l'est pas | vérif docker (contraste) |

## Definition of Done

Lint 0 warning · build OK · couverture ≥ 65/90/90/90 (jamais abaissée) · unit + e2e verts ·
mutation-test sur AC-2 et AC-3 (inverser `publicEndPoint` → `endPoint`, retirer `region` : les specs
doivent virer au rouge, puis restaurer) · vérification docker consignée ci-dessous.

---

## Progress Tracking

### Implémentation *(2026-08-07)*

| Fichier | Changement |
|---|---|
| `src/config/configuration.ts` | `publicEndPoint`/`publicPort`/`publicUseSSL` sur `minioProfil` et `minioPiece` *(repli : `MINIO_PUBLIC_*` → endpoint interne **du bucket** → bloc `minio` → défaut)* ; `region` sur les **3** blocs |
| `src/config/env.validation.ts` | `MINIO_PUBLIC_ENDPOINT` / `_PORT` / `_USE_SSL` / `MINIO_REGION`, optionnelles, typées et bornées ; SSL en `@IsIn(['true','false'])` |
| `src/storage/storage.constants.ts` | `MINIO_PROFIL_PUBLIC_CLIENT`, `MINIO_PIECE_PUBLIC_CLIENT` + l'interdit d'usage écrit ; **et l'absence assumée** d'un client public KYC, documentée |
| `src/storage/storage.module.ts` | 2 providers publics, `region` sur les 5 clients, exports élargis |
| `src/storage/storage.module.spec.ts` | **neuf** — 5 clients réels, assertions sur l'URL réellement signée |
| `src/config/*.spec.ts` | chaîne de repli, primauté des `MINIO_PUBLIC_*`, région, refus au boot |
| `docker-compose.yml` *(racine)* | les 4 variables au bloc `document-service` |

### Portes de qualité

- Lint **0 warning** · `nest build` OK.
- **415 unitaires** (56 suites) verts · **40 e2e** (7 suites) verts.
- Couverture **99,41 st / 92,47 br / 99,20 fn / 99,36 li** — au-dessus de 65/90/90/90, seuils inchangés.

### Mutation-tests — 4 mutations, 4 rouges, toutes restaurées

| # | Mutation | Résultat |
|---|---|---|
| M1 | client public **profil** construit sur `minio.endPoint` | ✅ rouge — `hostname` attendu `console.prospera.invalid`, reçu `minio` |
| M2 | `region` retirée du client **profil** (interne + public) | ✅ rouge ×2 — `getaddrinfo ENOTFOUND`, le SDK part chercher la région sur le réseau |
| M3 | `region` retirée du **seul** client public **pièce** | ✅ rouge — chaque client est gardé individuellement |
| M4 | repli public court-circuitant `MINIO_PROFIL_ENDPOINT` | ✅ rouge — la spec de repli tombe |

> Les mêmes specs sans mutation : 7/7 vertes. C'est ce qui distingue ce câblage d'un provider posé « en confiance » : `*.module.ts` et `configuration.ts` étant hors `collectCoverageFrom`, ces quatre rouges sont la **seule** preuve que le câblage est tenu.

### Vérification docker *(stack `docker compose`, 2026-08-07)*

Le service ne persiste rien ici : la vérification porte sur la **configuration réellement chargée** et sur
la **signature réellement produite**.

**AC-7 — les variables sont dans le conteneur** (`printenv`) :

```
MINIO_PUBLIC_ENDPOINT=localhost   MINIO_PUBLIC_PORT=9000
MINIO_PUBLIC_USE_SSL=false        MINIO_REGION=us-east-1
```

Boot propre, `/api/v1/health` ⇒ `{"status":"ok"}` avec `minio: up`.

**AC-8 — contraste public / interne.** Script exécuté **dans** le conteneur, chargeant la **vraie**
fabrique compilée (`/app/dist/config/configuration.js`) et construisant les clients dans la forme exacte
des providers ; dépôt de l'objet par le client interne, signature par les deux :

```
public : http://localhost:9000/piece-documents/story-352/preuve.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&…
interne: http://minio:9000/piece-documents/story-352/preuve.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&…
```

Téléchargement **depuis l'hôte** (le client que l'utilisateur aura) :

| URL signée par | `curl` depuis l'hôte |
|---|---|
| client **public** | **HTTP 200**, corps `preuve STORY-352` ✅ |
| client **interne** | **exit 6** — hôte `minio` non résolu ❌ |

**Bonus — `region` est bien porteuse, dans la topologie réelle.** Le même client public reconstruit
**sans** `region`, depuis le conteneur :

```
ÉCHEC ATTENDU sans region -> ECONNREFUSED
```

`localhost:9000` désigne, depuis le conteneur, le conteneur lui-même : la découverte de région échoue et
la pièce disparaîtrait de la réponse **sans erreur visible**. C'est le mode de panne de STORY-129/179,
reproduit et fermé ici.

Objet de preuve retiré, stack arrêtée (`docker compose stop`).

### Revue de code ⑥ — 0 bloquant, 4 constats retenus et corrigés

Les quatre portaient sur la **valeur probante des tests**, pas sur le code livré. Le plus instructif :

> ⚡ **La fixture du test de repli coïncidait avec les littéraux de repli de `configuration.ts`**
> (`'minio'`, `'9000'`, `'false'`). L'assertion ne distinguait donc plus « la chaîne a lu l'interne » de
> « la chaîne est tombée sur son défaut » : **4 mutations survivaient** — supprimer le maillon
> `?? MINIO_PROFIL_PORT ?? MINIO_PORT`, ou `?? MINIO_*_USE_SSL ?? MINIO_USE_SSL`, ou
> `?? MINIO_ENDPOINT` du bloc pièce, laissait la suite entière verte. **Le repli SSL n'était gardé par
> rien.** Un déploiement en `MINIO_PORT=9002` / `MINIO_USE_SSL=true` sans `MINIO_PUBLIC_*` aurait signé
> sur `http://…:9000` — la classe de défaut même que la story existe pour fermer.

Corrigé : valeurs de fixture désormais **distinctes de tout défaut**, plus un test dédié au maillon
**du bucket**. **M5, M6, M7 revérifiées rouges** après correctif — dont M7, qui exigeait une assertion de
plus (cascade allant jusqu'au bloc `minio` quand aucun endpoint de bucket n'est posé).

Deux autres constats : la liste de nettoyage d'env omettait 4 clés (le test lisait l'environnement
ambiant) ; et la garde « aucun client public KYC » assertait sur les **noms d'export** de
`storage.constants.ts` au lieu des providers du module — un provider public à token local l'aurait
franchie. Elle interroge désormais les clients **réellement résolus**. Quatrième : README complété.

**Hors diff, corrigé au passage** : `MINIO_PUBLIC_USE_SSL` n'était câblée dans le compose racine que sur
`document-service`, alors qu'`auth-service` et `kyc-service` **lisent** la variable. Un `.env` à `true`
aurait fait signer l'un en `https` et les deux autres en `http`, sans que rien ne le signale.

### Revue de sécurité ⑦ — 0 vulnérabilité (confiance ≥ 80)

Examiné et écarté : credentials **non croisés** entre buckets et jamais journalisés (les logs ne portent
qu'un nom de bucket) ; fixtures factices sur un TLD `.invalid` ; cloisonnement du garde-fou #3 respecté —
le `@Global()` élargit l'**injection**, pas le **privilège**, les 2 clients publics portant exactement les
droits que leurs homologues internes avaient déjà ; validation d'env **plus stricte** qu'avant ; repli
**fail-closed** (variables absentes ⇒ endpoint interne, jamais un hôte tiers) ; **aucun vecteur SSRF** —
`publicEndPoint` vient exclusivement de `process.env`, jamais d'une entrée utilisateur, et le client
public **ne fait aucun appel réseau** puisque la signature est hors-ligne.

### 🪝 Deux exigences transmises à la story CONSOMMATRICE

Elles ne sont pas des constats sur cette story — aucune URL n'est émise ici — mais elles devront être
portées **au moment où la première méthode de signature sera câblée** :

1. **Borner explicitement le TTL de présignature.** Le défaut de la lib `minio` est de **7 jours**
   (CWE-613) : sans `presignedExpirySeconds` (le patron `kyc-service`, défaut 300 s), une URL de pièce
   comptable ou de pièce profil resterait valide une semaine.
2. **Exiger `MINIO_PUBLIC_USE_SSL=true` hors `NODE_ENV=development`.** Dans la topologie de prod attendue
   (MinIO en HTTP dans le réseau docker, TLS terminé par un reverse proxy), renseigner
   `MINIO_PUBLIC_ENDPOINT` **sans** `MINIO_PUBLIC_USE_SSL` produirait des URLs signées en `http://` —
   document en clair, `X-Amz-Signature` et access key ID en clair (CWE-319).

### Ce que la story ne prouve pas — et l'assume

Aucun écran ne consomme encore une pièce servie par ce service : les deux clients publics restent des
**hooks**. Ce qui est prouvé, c'est que **le terrain est bon** — variables câblées, repli correct,
signature valide depuis le poste, région porteuse — et que chacun de ces quatre points est gardé par un
test qu'une mutation fait tomber. C'est exactement ce qui manquait à STORY-173.
