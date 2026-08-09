# TICKET-BACKEND — la **répartition par version** d'un module n'est pas croisée avec le statut de l'octroi

**Cible :** `prospera-admin-panel-service` (:3010) → `platform-catalog-service` (:3003)
**Routes :** `GET /admin/modules/:code/summary` · `GET /catalog/entitlements/by-module/:code/summary`
**Ouvert par :** **AP-10** (barry thierno alhassane, 2026-08-09) — **trouvé à l'Integration Gate**, pas en revue de code
**Priorité :** Should — rien n'est cassé, mais l'écran qui doit mesurer l'impact d'une dépréciation ne peut pas le mesurer juste
**État :** ⛔ ouvert

---

## Le constat, sur données réelles

Relevé le 2026-08-09 sur le stack docker, module `balance` :

```
GET :3010/api/v1/admin/modules/balance/summary
{ "total": 7,
  "byVersion": [ { "version": "1.0", "count": 7 } ],
  "byStatus":  [ { "status": "ACTIVE", "count": 1 }, { "status": "REVOKED", "count": 6 } ] }
```

**Sept octrois, dont six révoqués.** Une seule organisation utilise encore ce module.

`byVersion` et `byStatus` sont deux ventilations **du même ensemble, jamais croisées**. La question
que l'écran doit poser — « combien d'organisations **encore actives** sur la v1.0 ? » — n'a donc
aucune réponse servie.

## Pourquoi ça compte, et dans quel sens ça casse

AP-10 existe pour **mesurer l'impact d'une dépréciation avant de la décider**. C'est le seul geste
du catalogue qui soit irréversible pour un client.

Avec `byVersion` tous statuts confondus, l'écran annonce « 7 organisations sur la v1.0 » là où il
n'y en a qu'une. L'erreur va donc dans le sens le plus coûteux : **elle fait renoncer à déprécier
une version que plus personne n'utilise**, et laisse une majeure occuper un emplacement de la
fenêtre N/N-1 pour des clients qui sont partis.

⚠️ L'inverse serait moins grave : un chiffre trop bas ferait vérifier avant d'agir. Ici le chiffre
trop haut fait **ne rien faire**, et ne se remarque jamais.

## Ce que le front a fait en attendant (et pourquoi ce n'est pas une solution)

`module-organizations.tsx` nomme le périmètre au lieu de bricoler le chiffre :

> « Répartition sur 7 octrois, tous statuts confondus — révocations comprises. **1 est encore actif.** »

Le total et le nombre d'actifs sont tous deux servis, donc exacts. Mais **la répartition par version
reste fausse** dès qu'un module a plusieurs versions et des révocations réparties dessus : on ne sait
toujours pas laquelle des versions les révoqués ont quittée.

⚠️ **Ce n'est pas rattrapable côté client.** Le déduire de la liste paginée donnerait un compte juste
sur un périmètre faux (une page sur N) — c'est exactement le piège que la pagination serveur existe
pour éviter, et le même que `STORY-175` a déjà relevé sur le filtre KYC d'`/admin/orgs`.

## Ce qui est demandé

Au choix, par ordre de préférence :

1. **Un `status` sur `/summary`** — `GET /admin/modules/:code/summary?status=ACTIVE`. Le plus simple,
   et symétrique du filtre que `/organizations` accepte déjà.
2. **Une ventilation croisée** — `byVersionAndStatus: [{ version, status, count }]`. Plus riche : elle
   permet d'afficher une barre empilée par version **segmentée par statut**, ce qui répond à la
   question sans second appel.

⚠️ Dans les deux cas, **`platform-catalog-service` doit servir la donnée en premier** : le BFF ne fait
que proxifier ce `/summary`, il n'a rien à agréger lui-même.

## Effet côté console, une fois servi

- La barre de répartition porte sur ce qui est **encore servi**, pas sur l'historique des octrois.
- La ligne « tous statuts confondus » et son garde-fou orange disparaissent d'eux-mêmes.
- Le compteur « Organisations » du tiroir (AP-04) devient lisible sans ambiguïté — il compte
  aujourd'hui les révocations, et personne ne le sait en le lisant.

## Traçabilité

- Story frontend : **AP-10** — section « Organisations » du tiroir d'un module.
- Le garde-fou provisoire est testé (`module-organizations.test.tsx`, « dit que la répartition compte
  les révocations »). Ce test **doit être retiré** quand le contrat croisé arrive : le laisser ferait
  passer pour un comportement voulu ce qui n'est qu'un pansement.
