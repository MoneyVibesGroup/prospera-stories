# TICKET frontend — le pack Assurance doit citer `cima-assurances@7.0`

**Type :** désynchronisation d'offre (le front déclare une version de référentiel que le back ne sert plus)
**Dépôt :** `prospera-frontend-admin-panel` — `vertical-packs.ts`, `VERTICAL_PACKS.Assurance.referentiel`
**Débloqué par :** **STORY-672** (`bilan-service` / `balance-service` / `assurance-service` /
`platform-catalog-service` / `dossier-service`)
**Ouvert par :** STORY-672, 2026-10-09
**Remplace :** `TICKET-FRONTEND-referentiel-cima-6-0-story-671` et
`TICKET-FRONTEND-referentiel-cima-5-0-story-522` — **non traités**, et désormais périmés : le front
doit passer directement de `@1.0` à `@7.0`, sans étape intermédiaire.
**Priorité :** Should — aucune panne côté client : le backend sert `@7.0` et le seed du catalogue
l'octroie déjà. Le front reste seulement **inexact** dans ce qu'il annonce, jusqu'à correction.

---

## Le changement

`cima-assurances@7.0` garde le plan de comptes intégral de `@6.0` (1 053 comptes) et **route enfin
vers un poste** les onze comptes de gestion qu'aucune version précédente ne rattachait :

- `69` / `79` (charges et produits « à l'étranger ») suivent le poste de leur homologue national ;
- `73` « Réductions et ristournes de primes » réduit les primes (`RP1`) ;
- `74` rejoint les produits accessoires, `78` reçoit sa ligne (`RP7`) ;
- `82` à `86` entrent au compte de résultat (`RH1` → `RH5`) **et** au compte 87 (`PP2` → `PP6`).

⚠️ **Deux changements visibles à l'écran**, si un écran les affiche :

- le **résultat net** `RN` est désormais publié **après** impôt sur les bénéfices (son libellé le dit) ;
- le **compte 87** n'est plus un squelette `A_COMPLETER` : ses lignes sont calculées
  (`statut: CALCULE`), et l'articulation du compte 80 publie un champ de plus,
  `resultatHorsExploitation`.

## Ce que le backend sert aujourd'hui

| Service | Constante | Valeur servie |
|---|---|---|
| `bilan-service` | manifeste `ReferentielRegistry` | `cima-assurances@7.0` (`aef4982b…`) |
| `balance-service` | `PONT_TAG['CIMA']` | `7.0`, puis `6.0` et `5.0` pour les octrois existants |
| `assurance-service` | `REFERENTIEL_SERVI` | `7.0` |
| `platform-catalog-service` | pack `assurance-cima` | `{ code: 'cima-assurances', version: '7.0' }` |

Le front, lui, annonce encore `@1.0`.

## Le diff à appliquer, et l'ORDRE des opérations

1. Dans `prospera-frontend-admin-panel`, `vertical-packs.ts` :
   `VERTICAL_PACKS.Assurance.referentiel` → `{ code: 'cima-assurances', version: '7.0' }`.
2. **Ensuite seulement**, dans `platform-catalog-service` : retirer l'entrée
   `assurance-cima.referentiels` de `ECARTS_ASSUMES_AU_FRONT` **et** mettre à jour
   `packs.front-snapshot.ts`.

⚠️ L'ordre est contraignant : retirer la ligne d'écart avant que le front ne bouge fait rougir la
suite du catalogue.

## Ce que ce ticket ne demande PAS

- ⛔ **Aucune migration d'octroi.** Une organisation octroyée `@6.0` ou `@5.0` reste servie par
  `balance-service`, mais `assurance-service` la refuse (`403 REFERENTIEL_NON_HABILITE`) tant que
  l'octroi n'est pas rejoué. Souci de prod, différé.
- ⛔ **Aucun écran nouveau.**
