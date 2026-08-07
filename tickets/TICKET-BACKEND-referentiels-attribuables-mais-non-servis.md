# TICKET-BACKEND — des référentiels **attribuables** par la console mais **non servis** par `balance-service`

**Cible :** `balance-service` (:3007) — et, pour le constat ③, la **console** (`frontend-admin-panel`)
**Ouvert par :** maquette **FE-056** (barry thierno alhassane, 2026-08-07) — extension aux cinq secteurs
**Origine du constat :** question du PO sur la maquette FE-056 (« on n'a pas uniquement SFD ou IMF, il y a
aussi CIMA, et pour les grands distributeurs comment cela se gère ? »)
**État :** ➡️ **repris** — ① par **STORY-292**, ③ par **STORY-293**. ② est **clos sans action** (voir plus bas).

---

## Ce qui a été cherché, et pourquoi

La maquette FE-056 branche la saisie de balance sur `POST /balances/suggest-comptes`, dont la résolution
est **pilotée par le référentiel actif de l'organisation**. Pour la dessiner honnêtement il a fallu
répondre à une question simple : **quels référentiels une organisation peut-elle réellement porter ?**

La réponse tient en une chaîne, et c'est elle qui rend le constat intéressant :

```
console (pack vertical AP-06)  →  entitlement.changed  →  OrgBalanceEntitlement.referentiel  →  ReferentielResolver
   vertical-packs.ts                                        read-model local                     referentiel-resolver.service.ts:57
```

**Le référentiel est une donnée d'octroi, pas une branche de code.** Ajouter un secteur ne demande aucune
ligne dans un écran ni dans un service : il suffit que le couple `code@version` soit attribué. C'est une
bonne architecture — et c'est précisément ce qui rend le problème possible : **la console peut attribuer
un code que `balance-service` ne sait pas charger.**

Le manifeste de `balance-service` ([`referentiel-registry.ts:49`](../../balance-service/src/modules/referentiel/referentiel-registry.ts))
ne porte que **trois** entrées — `syscohada-revise@2.1`, `sfd-bceao@2.0`, `smt-togo@1.0` (non packagé) —
et le contrat canonique n'admet que **trois tags** : `REFERENTIELS_BALANCE = ['SN', 'SMT', 'SFD-BCEAO']`.
La console, elle, propose **quatre packs verticaux**.

---

## ① ⛔ `cima-assurances@1.0` est attribuable, et ne se charge pas → **500**

**Constat.** Le pack vertical **Assurance** attribue `cima-assurances@1.0`
([`vertical-packs.ts:83`](../../frontend-admin-panel/src/features/provisioning/config/vertical-packs.ts)).
L'artefact **existe** : il a été livré et corrigé côté `bilan-service` par **STORY-122** (done le
2026-07-27, checksum final `7e644ab1`), et il est présent sur le disque
(`bilan-service/src/modules/bilan/referentiel/assets/cima-assurances-1.0.json`, 22 Ko).

Mais il **n'est pas au manifeste de `balance-service`**, et son tag **n'existe pas au contrat canonique
de la balance**. Une organisation Assurance qui saisit une balance reçoit donc, via
`versHttpDepuisErreurReferentiel`, un **`500 REFERENTIEL_UNAVAILABLE`** — la catégorie « lacune serveur »,
c'est-à-dire exactement le bon diagnostic : le service est mal déployé pour cette organisation.

**Ce n'est pas qu'une copie d'asset.** Le point dur est le **contrat canonique** : `BalanceCanonique.referentiel`
est typé sur `ReferentielBalance`, et le pont `PONT_TAG` est **exhaustif par construction** (TypeScript
refuse de compiler si un tag n'est pas résolu). Ajouter `CIMA` est un **changement de contrat**, du même
ordre que STORY-147 — il touche le type, le pont, les DTO et les types générés côté front.

**Impact aujourd'hui :** nul en production (aucune organisation Assurance n'existe), **bloquant** dès la
première. Le vertical Assurance est vendable par la console et **inexploitable** en balance.

➡️ **Repris par STORY-292.**

---

## ② ✅ `smt-togo@1.0` — refus déjà correct, **aucune action**

Le registre déclare le SMT **sans artefact**, avec son motif en clair : *« plan de comptes et table de
passage SMT non sourcés — packaging subordonné aux sources officielles et à une validation experte »*
(décision D-078-3). La route de suggestion traduit l'erreur via `versHttpDepuisErreurReferentiel` et rend
un **`409 REFERENTIEL_NON_PACKAGE`** en **conservant le motif**.

C'est le comportement **souhaité** et il est déjà là : un refus explicite, nommé, et que l'appelant **ne
doit pas réessayer** — le mapper le dit lui-même (« 409, l'appelant ne peut rien réessayer »). Vérifié
sur le chemin de la suggestion : `suggestion.service.ts:97` passe bien par le mapper.

**Aucune story n'est ouverte.** Ce constat est consigné ici pour que la prochaine revue ne le redécouvre
pas comme un défaut : le packaging du SMT attend une **source officielle**, pas un développement. La
seule dette est côté **UI**, et FE-056 la traite déjà (le motif est affiché, « Réessayer » est masqué).

---

## ③ ⛔ La console attribue `sfd-bceao@1.3`, les services servent `@2.0`

**Constat.** Le pack **Finance** déclare `{ code: "sfd-bceao", version: "1.3" }`
([`vertical-packs.ts:76`](../../frontend-admin-panel/src/features/provisioning/config/vertical-packs.ts)).
Or `1.3` **n'existe nulle part** : `balance-service` sert `sfd-bceao@2.0`, `bilan-service` porte `1.0` et
`2.0`, et le catalogue ne publie aucune version en dur — les paquets sont **déposés à l'exécution**
(STORY-149). La valeur `1.3` semble reprise de l'**exemple de documentation** du schéma
(`referentiel-version.schema.ts:10`), pas d'un paquet réel.

**Deux issues, aucune bonne :**

1. le catalogue ne publie pas `1.3` ⇒ `plan.ts` bloque la ligne avec `reason: "referentiel-missing"` et
   **le vertical Finance n'est pas provisionnable** ;
2. un opérateur dépose `1.3` pour débloquer l'écran ⇒ l'organisation reçoit un code que
   `balance-service` **ne sait pas charger** ⇒ on retombe sur le **500** du constat ①.

⚠️ **Le garde-fou de `plan.ts` a fait son travail** — il confronte le pack au catalogue réel au lieu de
faire confiance à la config. Sans lui, ce ticket décrirait une panne en production. C'est la raison pour
laquelle ce constat est **Should**, pas **Must**.

**Cible :** la **console**. La correction est une valeur de configuration, pas un développement backend —
mais elle demande un **arbitrage** : quelle version de SFD fait foi pour un octroi ?

➡️ **Repris par STORY-293.**

---

## Ce que ce ticket ne demande PAS

- **Un plan de comptes par secteur pour la distribution.** Le pack **Distribution** est sur
  `syscohada-revise@2.1`, comme le cabinet — et c'est **correct** : un distributeur ne relève pas d'un
  référentiel sectoriel, il relève du droit commun OHADA. Ce qui le distingue est ailleurs :
  - son **vocabulaire** (stocks, démarque, transport sur ventes) — déjà traité par le rapprochement de
    tokens de STORY-139, vérifié sur le plan réel (174 comptes) ;
  - son **volume** : un auxiliaire client par point de vente dépasse `MAX_LIBELLES_PAR_LOT = 200`. Le
    **client découpe** (241 libellés ⇒ 2 appels), la borne serveur est bonne et **ne doit pas être
    relevée** — elle protège un service qui confronte chaque libellé à tout le plan.
  - son **jeu de modules** (`pdv`, `stock`, `catalogue`, `commande`, `facturation`), qui n'a rien à voir
    avec le référentiel comptable.
- **Une refonte de la résolution.** La chaîne octroi → read-model → résolveur est saine ; c'est son
  **alimentation** qui diverge de ce que les services savent servir.

---

## Traces

- Maquette : prototype cumulatif, écran **Atelier → Saisie directe**, bascule d'organisation à cinq
  profils. Les deux référentiels non servis y sont marqués `⚠` et rendent leur refus réel (409 / 500)
  avec l'encart « À livrer côté backend » nommant le contrat manquant.
- Story frontend : **FE-056** (livrée sur le périmètre servi — la saisie reste entière dans les deux cas
  de refus : invariant DO-1).
- Gaps ouverts : `GAP-cima-non-servi-par-balance`, `GAP-version-sfd-console-vs-services` dans
  `sprint-status.yaml` → `open_contract_gaps`.

## Numérotation

STORY-292 et 293 sont prises **au-dessus de 291**. Au 2026-08-07, tous les numéros ≤ 291 étaient
référencés quelque part dans le dépôt : `epics-notification-2026-08-04.md` annonçait sa série « à partir
de **STORY-291** » sans **avoir consommé aucun numéro**.

⚠️ **Cette vérification a mis au jour une collision bien plus large, corrigée le même jour** : les
`story_id` **179 → 188** désignaient DEUX stories chacun — la dette console/KYC du sprint 20 (10 fichiers
`stories/*.md`, sprint en cours) et le socle du module fiscalité (57 stories, sprints 22→30, aucun
fichier). **La série fiscale a été renumérotée `179→235` ⇒ `294→350`** (+115) ; la série console n'a pas
bougé. Détail et critères d'arbitrage dans l'encadré en tête de `epics-fiscalite-2026-08-03.md`.

⇒ **Dernier numéro pris au 2026-08-07 : STORY-350.** La série notification démarre à **STORY-351** ; son
document a été amendé, exactement comme il l'avait lui-même fait quand la plage 150→165 lui a été reprise.
