# TICKET FRONTEND — la console de provisioning octroie `syscohada-revise@2.1` codé en dur (STORY-677)

**Dépôt :** `frontend-admin-panel` · **Fichier :** `src/features/provisioning/config/vertical-packs.ts`
**Statut back :** livré avec STORY-677 — les packs du catalogue (`GET /catalog/packs`) citent
`syscohada-revise@2.2`, et `balance-service` sert `@2.2`.

---

## Le fait, relu dans le dépôt front (2026-09-25)

`VERTICAL_PACKS` porte ses référentiels **en dur**, et le plan de provisioning (`plan.ts`) les lit
là, pas dans le catalogue :

| Pack | Le front octroie | Le catalogue dit |
|---|---|---|
| distributeur (SYSCOHADA) | `syscohada-revise@2.1` | **`@2.2`** |
| cabinet (SYSCOHADA) | `syscohada-revise@2.1` | **`@2.2`** |
| microfinance | `sfd-bceao@1.3` — ⛔ **n'existe dans aucun registre** | `sfd-bceao@2.0` |
| assurance | `cima-assurances@1.0` | `cima-assurances@5.0` |

⇒ Une organisation créée par la console reçoit `@2.1` : ni les 44 feuilles de notes (STORY-559), ni
le Bilan corrigé (STORY-676 : en `@2.1`, l'actif immobilisé n'additionne que les avances). Et une
organisation microfinance reçoit une version **inexistante** — l'octroi échoue (422) ou la sert
nulle part.

## Ce qu'il faut

- **Cible** : lire les packs dans `GET /api/v1/catalog/packs` (champ `referentiels`, une liste —
  STORY-533) au lieu de `VERTICAL_PACKS` ; c'est ce que `packs.front-snapshot.ts` (catalogue) annonce
  comme la fin de la transcription.
- **À défaut, immédiatement** : aligner `VERTICAL_PACKS` sur le catalogue — `syscohada-revise@2.2`
  (×2), `sfd-bceao@2.0`, `cima-assurances@5.0`.

## Critères de recette

- [ ] Une organisation « cabinet » provisionnée par la console a une habilitation `bilan` **et**
      `balance` en `syscohada-revise@2.2` (lisible dans l'écran d'habilitations).
- [ ] Sa liasse sort 43 notes annexes ; son Bilan porte `AD`/`AI`/`AQ` et `AZ` = l'actif immobilisé.
- [ ] Une organisation « microfinance » est provisionnée sans 422.
- [ ] Prévenir le back quand `VERTICAL_PACKS` disparaît : les écarts déclarés au catalogue
      (`ECARTS_ASSUMES_AU_FRONT`) se retirent alors.
