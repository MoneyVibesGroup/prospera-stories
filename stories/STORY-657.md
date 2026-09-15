# STORY-657 : Le journal d'accès ment sur chaque requête refusée — 12 services journalisent 200/201 là où le client a reçu 409, 404 ou 400

Status: ready-for-dev

**Complexité :** medium

**Épic :** transverse — socle commun des services (hors décompte d'épic, précédent STORY-109)
**Service :** les **12** dépôts de services backend — `admin-panel`, `auth-service`, `balance-service`,
`bilan-service`, `document-service` (`prospera-ocr-service`), `dossier-service`, `expert-comptable`, `kyc-service`,
`microfinance-service`, `notification-service`, `paiement-service`, `platform-catalog-service`
**Points :** 5 · **Sprint :** S20
**Origine :** défaut **constaté pendant la vérification docker de STORY-504** (2026-09-14), puis **mesuré dans les
12 dépôts le 2026-09-15**. Hors périmètre de 504, consigné en dette à sa clôture.

---

## Le fait

`LoggingInterceptor` écrit une ligne par requête terminée : méthode, route, statut, durée. Pour **toute requête qui
se termine par une exception**, le statut qu'il écrit est **faux** : 200 pour un GET, 201 pour un POST — le statut par
défaut d'Express — alors que le client a reçu 400, 403, 404 ou 409.

**Mesuré sur la stack, pas supposé** (vérification docker de STORY-504, lignes appariées par identifiant de requête
entre la ligne INFO de l'intercepteur et la ligne WARN du filtre d'exceptions) :

| Passage | Lignes INFO au statut faux |
|---|---|
| premier passage (`a84951c`) | **22** `POST …/arretes-provision 201` alors que le client a reçu 409 (7) ou 400 (15), et qu'**aucun arrêté n'existe en base** |
| re-vérification (`346a692`) | 42 lignes fausses (409 journalisés 200/201, 400 journalisés 201) |
| complément (`e3111d0`) et dernière passe (`d8b53f8`) | 49 et 35 lignes fausses ; le même motif relevé sur les routes de STORY-501 à 503 |

⛔ **Sur un acte réglementaire, la piste d'audit compte des écritures qui n'ont jamais eu lieu.** Et un tableau de bord
qui compterait les erreurs depuis ce journal verrait un service sain pendant qu'il refuse tout.

## La cause, lue dans le code

```ts
// src/common/interceptors/logging.interceptor.ts — identique dans les 12 dépôts
return next.handle().pipe(
  tap({
    next: () => this.write(method, originalUrl, response.statusCode, start),
    error: () =>
      this.write(method, originalUrl, response.statusCode || 500, start),
  }),
);
```

Dans `tap({ error })`, l'exception **n'a pas encore été traitée** : c'est `AllExceptionsFilter`, qui s'exécute
**après** l'intercepteur, qui pose le vrai statut sur la réponse (`-> ${statusCode}` dans sa ligne WARN). À cet
instant, `response.statusCode` vaut encore la valeur par défaut d'Express (200, ou 201 posé par `@Post`), jamais 0 : le
repli `|| 500` ne se déclenche **jamais**.

| Dépôt | Constat (2026-09-15) |
|---|---|
| 10 dépôts clonés | `logging.interceptor.ts` **identique octet pour octet** (même md5) |
| `notification-service`, `paiement-service` (lus via l'API GitHub, branche `dev`) | même lecture de `response.statusCode \|\| 500` dans `tap({ error })` |

## Pourquoi aucun test ne l'a vu

La spec existe dans chaque dépôt (`logging.interceptor.spec.ts`, identique dans 9 dépôts clonés sur 10). Son test du
chemin d'erreur **fixe lui-même** `statusCode: 500` sur la réponse simulée, puis vérifie seulement **qu'une** ligne est
écrite — jamais **laquelle** :

```ts
it('loggue aussi en cas d’erreur du handler', async () => {
  // makeContext(500) : la réponse simulée annonce déjà 500
  await expect(lastValueFrom(interceptor.intercept(makeContext(500), next))).rejects.toThrow('échec');
  expect(logSpy).toHaveBeenCalledTimes(1); // le statut écrit n'est pas vérifié
});
```

⇒ **Un test qu'un code bugué franchit.** Il passe avec le défaut, et passerait encore si l'intercepteur écrivait
n'importe quel nombre.

## Critères d'acceptation

- [ ] AC-1 — Pour une requête terminée par une exception HTTP, la ligne de l'intercepteur porte **le statut reçu par le
      client** : celui de l'exception (`HttpException.getStatus()`), et **500** pour une erreur non HTTP. Même règle que
      le filtre global (4xx `warn`, 5xx `error`) — le statut ne doit jamais diverger entre les deux lignes.
- [ ] AC-2 — Pour une requête réussie, le statut journalisé reste celui de la réponse (200, 201, 204…), inchangé.
- [ ] AC-3 — ⛔ **Le test du chemin d'erreur rougit sur le code actuel** : réponse simulée au statut par défaut
      d'Express (200, et 201 pour un POST), exception `ConflictException` ⇒ la ligne attendue contient **409** ; erreur
      non HTTP ⇒ **500**. **Mutation** : remettre la lecture de `response.statusCode` ⇒ le test rougit par assertion.
- [ ] AC-4 — **Preuve sur Mongo et HTTP réels, pas seulement en unitaire** : un test e2e (banc existant) envoie une
      requête refusée (409 et 400) et une réussie, et vérifie que la ligne journalisée et le statut HTTP reçu
      **concordent** — le défaut ne se voit qu'en présence du vrai filtre global.
- [ ] AC-5 — Les **12** dépôts reçoivent le même correctif et le même test ; chaque dépôt passe ses portes DoD (lint 0,
      build, couverture ≥ seuils, unit + e2e verts).
- [ ] AC-6 — Vérification docker sur au moins deux services (dont `microfinance-service`) : une rafale de requêtes
      refusées produit des lignes INFO dont le statut est **identique** à celui de la ligne WARN du filtre et de la
      réponse HTTP (appariement par identifiant de requête, zéro divergence).

## Hors périmètre

Le format de la ligne, pino, le `requestId`, la journalisation des corps (jamais) · le défaut du stockage du throttler
(STORY-658) · la mise en commun du code des 12 dépôts dans un paquet partagé.

## Notes

- ⚠️ **12 dépôts ⇒ 12 branches `MNV-657` et 12 PR** sur `dev`. Le correctif est mécanique et identique : le livrer en une
  série cohérente, pas dépôt par dépôt sur plusieurs semaines — sinon les journaux des services divergent.
- ⚠️ `docker-compose*.yml` et la CI racine ne sont versionnés dans aucun dépôt : rien à y changer ici.
- Voir [[STORY-504]] (vérifications docker qui ont mis le défaut en évidence), [[STORY-497]] (socle microfinance),
  [[STORY-109]] (précédent de story transverse sur plusieurs dépôts).
