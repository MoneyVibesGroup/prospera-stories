# TICKET frontend — le pack Assurance doit citer `cima-assurances@6.0`

**Type :** désynchronisation d'offre (le front déclare une version de référentiel que le back ne sert plus)
**Dépôt :** `prospera-frontend-admin-panel` — `vertical-packs.ts`, `VERTICAL_PACKS.Assurance.referentiel`
**Débloqué par :** **STORY-671** (`bilan-service` / `balance-service` / `assurance-service` /
`platform-catalog-service` / `dossier-service`)
**Ouvert par :** STORY-671, 2026-10-09
**Remplace :** `TICKET-FRONTEND-referentiel-cima-5-0-story-522` — **non traité**, et désormais
périmé : le front doit passer directement de `@1.0` à `@6.0`, sans étape intermédiaire.
**Priorité :** Should — aucune panne côté client : le backend sert `@6.0` et le seed du catalogue
l'octroie déjà. Le front reste seulement **inexact** dans ce qu'il annonce, jusqu'à correction.

---

## Le changement

`cima-assurances@6.0` porte le plan de comptes de l'**art. 431** du Code CIMA **en entier** :
1 053 comptes à 2, 3, 4 et 5 chiffres (`@5.0` en portait 90), libellés officiels intégraux. Les postes
de la liasse et la table de passage sont **inchangés** : aucun montant ne bouge, seule la liste des
comptes saisissables et leurs libellés s'enrichissent.

## Ce que le backend sert aujourd'hui

| Service | Constante | Valeur servie |
|---|---|---|
| `bilan-service` | manifeste `ReferentielRegistry` | `cima-assurances@6.0` (`19be9539…`) |
| `balance-service` | `PONT_TAG['CIMA']` | `6.0`, puis `5.0` pour les octrois existants |
| `assurance-service` | `REFERENTIEL_SERVI` | `6.0` |
| `platform-catalog-service` | pack `assurance-cima` | `{ code: 'cima-assurances', version: '6.0' }` |

Le front, lui, annonce encore `@1.0`.

## Le diff à appliquer, et l'ORDRE des opérations

1. Dans `prospera-frontend-admin-panel`, `vertical-packs.ts` :
   `VERTICAL_PACKS.Assurance.referentiel` → `{ code: 'cima-assurances', version: '6.0' }`.
2. **Ensuite seulement**, dans `platform-catalog-service` : retirer l'entrée
   `assurance-cima.referentiels` de `ECARTS_ASSUMES_AU_FRONT` **et** mettre à jour
   `packs.front-snapshot.ts`.

⚠️ L'ordre est contraignant : retirer la ligne d'écart avant que le front ne bouge fait rougir la
suite du catalogue.

## Ce que ce ticket ne demande PAS

- ⛔ **Aucune migration d'octroi.** Une organisation octroyée `@5.0` reste servie par
  `balance-service`, mais `assurance-service` la refuse (`403 REFERENTIEL_NON_HABILITE`) tant que
  l'octroi n'est pas rejoué. Souci de prod, différé.
- ⛔ **Aucun écran nouveau.** Le sélecteur de comptes du plan (`GET …/plan-comptes`) rend désormais
  jusqu'à 1 053 comptes : si un écran les liste, prévoir le filtrage par classe ou par préfixe que la
  route accepte déjà.
