# TICKET frontend — régénérer les types générés : `ReferentielBalance` gagne `CIMA`

**Type :** dette de contrat (types front désynchronisés de l'`openapi.json` backend)
**Dépôt :** `prospera-frontend-admin-panel` (et tout front consommant l'`openapi.json` de `balance-service`)
**Débloqué par :** **STORY-292** (`balance-service`, :3007)
**Ouvert par :** STORY-292, 2026-08-10
**Priorité :** Should — aucune panne : le contrat backend est correct et déjà servi, seuls les
types générés côté client sont périmés jusqu'à régénération.

---

## Le problème

STORY-292 étend le contrat canonique de balance : `REFERENTIELS_BALANCE` passe de
`['SN', 'SMT', 'SFD-BCEAO']` à `['SN', 'SMT', 'SFD-BCEAO', 'CIMA']`. L'extension est **additive**
(aucune valeur retirée, aucune balance existante affectée) mais elle change l'`enum` exposé par
`openapi.json` sur tous les DTO qui portent `referentiel` (`SubmitBalanceDto`, `BalanceResponseDto`,
`AgregationApercuDto`, `RejetResponseDto`…).

Tant que les types générés côté front ne sont pas régénérés, un type `ReferentielBalance` généré
avant cette story reste figé sur 3 valeurs — un écran qui distinguerait les référentiels par ce type
(sélecteur, libellé affiché, garde de rendu) ignorera `CIMA` par construction, sans erreur visible :
le vertical Assurance reste **provisionnable et servi côté backend**, mais l'écran qui l'affiche
peut rester aveugle à sa valeur de référentiel tant qu'il lit l'ancien type.

## Ce que STORY-292 met à disposition

- `GET /api/v1/referentiels/actifs` résout `cima-assurances@1.0` (200, `checksum` vérifié).
- `POST /api/v1/balances/suggest-comptes` rend des suggestions du plan CIMA pour une org habilitée.
- `POST /api/v1/balances` accepte `referentiel: "CIMA"`.
- Contrat complet dans le Swagger de `:3007` (`/api/docs`).

Voir aussi `TICKET-BACKEND-tag-referentiel-non-expose.md` (ouvert, sans rapport direct) : ce ticket-ci
ne porte que sur la régénération de types, pas sur l'exposition du tag au client avant soumission.

## Résolution attendue

- [ ] Régénérer les types front depuis l'`openapi.json` de `balance-service` (ou attendre/s'adosser à
      la story de régénération déjà en cours — cf. `TICKET-BACKEND-objets-imbriques-non-types-dans-l-openapi.md`).
- [ ] Vérifier qu'aucun sélecteur/garde de rendu ne liste les référentiels en dur (`['SN','SMT','SFD-BCEAO']`)
      indépendamment du type généré — même défaut que celui que FE-056 a fermé pour le dictionnaire
      `libellé → compte`.
- [ ] Le pack vertical Assurance (`cima-assurances@1.0`, `vertical-packs.ts:83`) cesse d'afficher
      l'encart « À livrer côté backend » (maquette FE-056).

## Definition of Done

- [ ] Le type généré `ReferentielBalance` (ou équivalent) porte `CIMA`.
- [ ] Une organisation Assurance provisionnée est exploitable de bout en bout dans la console.
