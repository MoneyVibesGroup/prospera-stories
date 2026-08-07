# STORY-179 : Les pièces KYC sont signées sur un hôte que **le navigateur ne peut pas joindre**

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §A · **AP-03** · **STORY-013** *(URLs présignées de la revue admin)* · **FE-023** *(le même défaut, déjà payé sur `auth-service`)*
**Découverte par :** AP-INT-1, en affichant enfin le vrai document dans la console
**Priorité :** Must Have — ⚡ **la revue KYC est inexploitable tant que ce n'est pas fait**
**Story Points :** 3
**Statut :** 🔄 En cours *(démarrée le 2026-08-07)*
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

- [ ] Arbitrage `document-service` + CORS MinIO **tranché et consigné**
- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ Le test `e2e/integration-gate.spec.ts` marqué `test.fail()` côté console — « l'URL présignée
      est joignable DEPUIS LE NAVIGATEUR » — **passe au vert et son `test.fail()` est retiré**
- [ ] Branche `MNV-179`, PR rebase-mergée sur `dev`

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
