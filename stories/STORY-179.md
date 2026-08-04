# STORY-179 : Les pièces KYC sont signées sur un hôte que **le navigateur ne peut pas joindre**

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §A · **AP-03** · **STORY-013** *(URLs présignées de la revue admin)* · **FE-023** *(le même défaut, déjà payé sur `auth-service`)*
**Découverte par :** AP-INT-1, en affichant enfin le vrai document dans la console
**Priorité :** Must Have — ⚡ **la revue KYC est inexploitable tant que ce n'est pas fait**
**Story Points :** 3
**Statut :** À faire
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
