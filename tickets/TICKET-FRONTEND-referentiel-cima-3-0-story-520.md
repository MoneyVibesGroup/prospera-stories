# TICKET frontend — le pack Assurance doit citer `cima-assurances@3.0`

**Type :** désynchronisation d'offre (le front déclare une version de référentiel que le back ne sert plus)
**Dépôt :** `prospera-frontend-admin-panel` — `vertical-packs.ts`, `VERTICAL_PACKS.Assurance.referentiel`
**Débloqué par :** **STORY-520** (`bilan-service` / `balance-service` / `assurance-service` / `platform-catalog-service`)
**Ouvert par :** STORY-520, 2026-09-21
**Remplace :** `TICKET-FRONTEND-referentiel-cima-2-0-story-518` — **non traité**, et désormais
périmé : le front doit passer directement de `@1.0` à `@3.0`, sans étape intermédiaire.
**Priorité :** Should — aucune panne côté client : le backend sert `@3.0` et le seed du catalogue
l'octroie déjà. Le front reste seulement **inexact** dans ce qu'il annonce, jusqu'à correction.

---

## Le problème

STORY-520 fait entrer les **cessions en réassurance** au compte de résultat CIMA. ⛔ Ce n'est pas un
manque comblé : c'est une **compensation défaite**.

Les comptes `609` (« Part des réassureurs dans les prestations et frais ») et `709` (« Part des
réassureurs dans les primes ») existent à l'article 431 du Code CIMA, et l'article 432 les désigne
nommément comme les « (cessions) » des postes du compte 80. Le plan packagé s'arrêtant à **deux
chiffres**, la résolution au plus long préfixe les rabattait sur `60` et `70` — c'est-à-dire sur les
postes `RC1` et `RP1`. Le compte de résultat servi n'omettait donc pas la réassurance : il la
**compensait**, et aucun libellé ne le disait.

⇒ `cima-assurances@3.0` ajoute au plan **exactement deux comptes** — les premiers à trois chiffres
de ce référentiel — et deux postes de détail, `RP6` et `RC9`, que `RT` **et** `RN` intègrent.
`@1.0` et `@2.0` restent packagées et intactes : toutes deux ont été attribuées, et on ne réécrit
pas un chiffre déjà servi.

Côté backend, `@3.0` est désormais la version **servie** :

| Service | Où | Valeur |
|---|---|---|
| `assurance-service` | `REFERENTIEL_SERVI` | `cima-assurances@3.0` |
| `balance-service` | `PONT_TAG['CIMA']` | `cima-assurances@3.0` |
| `platform-catalog-service` | pack `assurance-cima` | `cima-assurances@3.0` |

Le front, lui, transcrit toujours `cima-assurances@1.0` dans `VERTICAL_PACKS.Assurance`.

## Pourquoi ça ne casse rien aujourd'hui — et ce que ça coûte quand même

Le seed du catalogue est la source de l'octroi : c'est **lui** qui décide ce qu'une organisation
reçoit, pas le front. Une organisation abonnée au pack Assurance reçoit donc bien `@3.0`.

Ce qui reste faux est **ce que la console annonce** : un écran qui affiche la version du référentiel
d'un pack montrera `1.0` là où l'organisation recevra `3.0` — deux versions d'écart, désormais. Et
la divergence est **déclarée** côté backend (`ECARTS_ASSUMES_AU_FRONT`, clé `assurance-cima`, champ
`referentiels`), ce qui **suspend** la comparaison de valeur entre le seed et la transcription du
front — le mécanisme exact par lequel la version fantôme `sfd-bceao@1.3` est passée inaperçue
pendant des semaines (STORY-185, trouvée en STORY-497).

⛔ **Cette suspension est ce que le ticket vient fermer.** Elle est compensée, en attendant, par une
garde qui **nomme** la version attendue (`packs.seed-data.spec.ts`, test « l'écart déclaré du pack
Assurance NOMME sa version ») — une garde qu'aucune table d'écarts ne peut suspendre.

## Ce qu'il y a à faire

Dans `vertical-packs.ts` :

```diff
 VERTICAL_PACKS.Assurance = {
   legacy: 'assurance',
-  referentiel: { code: 'cima-assurances', version: '1.0' },
+  referentiel: { code: 'cima-assurances', version: '3.0' },
 }
```

Puis, côté backend et **dans la même vague**, retirer la ligne
`{ cle: 'assurance-cima', champ: 'referentiels' }` de `ECARTS_ASSUMES_AU_FRONT`
(`platform-catalog-service/src/modules/packs/packs.seed-data.ts`) : la comparaison stricte reprend
alors, et le test nominatif redevient simplement redondant plutôt qu'indispensable.

⚠️ **L'ordre compte** : retirer l'écart **avant** que le front ne soit corrigé ferait rougir la
suite de `platform-catalog-service`.

## Ce que ce ticket ne demande PAS

- ⛔ **Aucune migration d'octroi.** `estHabiliteParmi` compare le couple `code@version` EXACT : une
  organisation déjà octroyée à `@1.0` ou `@2.0` est refusée par `balance-service` (409) et par
  `assurance-service` (403) tant que l'octroi n'est pas rejoué. C'est une opération d'exploitation,
  pas de front — et la migration de données reste un souci de prod, délibérément différé.
- ⛔ **Aucun écran de réassurance.** Le module `reassurance` d'`assurance-service` publie des
  traités et l'état de leurs cessions, mais aucun écran ne les consomme : c'est une story front à
  part entière, non ouverte ici.
