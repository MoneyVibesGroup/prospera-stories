# TICKET frontend — le pack Assurance doit citer `cima-assurances@5.0`

**Type :** désynchronisation d'offre (le front déclare une version de référentiel que le back ne sert plus)
**Dépôt :** `prospera-frontend-admin-panel` — `vertical-packs.ts`, `VERTICAL_PACKS.Assurance.referentiel`
**Débloqué par :** **STORY-522** (`bilan-service` / `balance-service` / `assurance-service` / `platform-catalog-service`)
**Ouvert par :** STORY-522, 2026-09-21
**Remplace :** `TICKET-FRONTEND-referentiel-cima-4-0-story-522` — **non traité**, et désormais
périmé : le front doit passer directement de `@1.0` à `@5.0`, sans étape intermédiaire.
**Priorité :** Should — aucune panne côté client : le backend sert `@5.0` et le seed du catalogue
l'octroie déjà. Le front reste seulement **inexact** dans ce qu'il annonce, jusqu'à correction.

---

## Le problème

STORY-522 corrige un **chiffre faux**, pas un manque. Les quatre versions précédentes déclaraient le
compte `80 Exploitation générale` parmi les **racines de gestion**, alors que l'**article 432** du
Code CIMA en fait un compte de **regroupement** :

> « Le solde du compte 80 est viré, pour clôture des écritures, au compte 87. »

⚡ **Mesuré** : sur une balance d'après inventaire, le résultat comptable sortait à **280 000 000**
pour un résultat réel de **140 000 000** — facteur exactement 2 — et **aucun contrôle d'articulation
ne pouvait le voir**, `resoudreCompteResultatNet` rendant `null` pour CIMA.

⇒ `cima-assurances@5.0` retire `80` des racines, marque les **quatre** comptes de regroupement
(`80`, `87`, `88`, `89`) dans le plan, et le générateur **refuse désormais d'empaqueter** tout
référentiel dont une racine en capterait un.

---

## Ce que le backend sert aujourd'hui

| Service | Constante | Valeur servie |
|---|---|---|
| `bilan-service` | manifeste `ReferentielRegistry` | `cima-assurances@5.0` (`021992b5…`) |
| `balance-service` | `PONT_TAG['CIMA']` | `5.0` |
| `assurance-service` | `REFERENTIEL_SERVI` | `5.0` |
| `platform-catalog-service` | pack `assurance-cima` | `{ code: 'cima-assurances', version: '4.0' }` |

Le front, lui, annonce encore `@1.0`.

---

## Pourquoi ça ne casse rien, et coûte quand même

L'écart est **déclaré** dans `ECARTS_ASSUMES_AU_FRONT` (`platform-catalog-service`,
`packs.seed-data.ts`), ce qui **suspend** la comparaison de valeur entre le seed et la transcription
du front — mécanisme hérité de `sfd-bceao@1.3`. La compensation est la **garde nominative** de
`packs.seed-data.spec.ts`, qui épingle la version attendue du pack et rougit si elle dérive.

⇒ Tant que le ticket n'est pas traité, une console qui lit la transcription du front **annonce une
version que le backend ne sert plus**. C'est un écart d'information, pas une panne.

---

## Le diff à appliquer, et l'ORDRE des opérations

1. Dans `prospera-frontend-admin-panel`, `vertical-packs.ts` :
   `VERTICAL_PACKS.Assurance.referentiel` → `{ code: 'cima-assurances', version: '4.0' }`.
2. **Ensuite seulement**, dans `platform-catalog-service` : retirer l'entrée
   `assurance-cima.referentiels` de `ECARTS_ASSUMES_AU_FRONT` **et** mettre à jour
   `packs.front-snapshot.ts` (qui transcrit le dépôt frontend).

⚠️ **L'ordre est contraignant** : retirer la ligne d'écart avant que le front ne bouge fait rougir la
suite du catalogue, puisque la comparaison de valeur reprend alors sur deux valeurs divergentes.

---

## Ce que ce ticket ne demande PAS

- ⛔ **Aucune migration d'octroi.** `estHabiliteParmi` compare le couple `code@version` **exact** :
  une organisation octroyée `@1.0`, `@2.0` ou `@3.0` reçoit `409` / `403` tant que l'octroi n'a pas
  été rejoué. C'est un **souci de prod, différé** — le dev repart de zéro.
- ⛔ **Aucun écran nouveau.** Les trois états (`COMPTE_80_VIE_CAPITALISATION`,
  `COMPTE_80_TOUTE_NATURE`, `COMPTE_87_PERTES_ET_PROFITS`) sont servis par
  `POST /bilan/etats/resultat-cima/dry-run`, mais leur **présentation** relève d'une story frontend
  à part.
- ⚠️ **Si un écran est un jour construit** : le modèle non applicable est servi **vide et non omis**,
  avec `statut: 'NON_APPLICABLE'` et des montants `null`. ⛔ **`null` ne veut pas dire zéro** — un
  affichage qui le rendrait `0` publierait « néant » là où la vérité est « sans objet », et
  masquerait l'information la plus utile de l'état.
