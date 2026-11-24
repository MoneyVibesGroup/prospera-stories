# TICKET-BACKEND — balance-service : recopier à l'octet les trois paquets SYSCOHADA révisé (bloc `seuils` de STORY-1076)

**Cible :** `prospera-balance-service`, tenu par **C** (D-L6-5)
**Ouvert par :** STORY-1076 (D, 2026-11-24), décision D-1076-6
**Priorité :** Should — rien ne casse en service ; la garde de byte-identité de balance rougit sur un poste où
`bilan-service` est à jour à côté
**État :** ouvert

---

## Le constat

STORY-1076 révise **en place** (D-1076-2, doctrine de D-552-2) les paquets `syscohada-revise@2.1`, `@2.2` et `@2.3` de
`bilan-service` : le bloc `seuils` (STORY-553) y reçoit trois repères sourcés de la BCEAO (accords de classement, mars
2020) — `POIDS_CAPITAUX_PROPRES` ≥ 20 %, `LIQUIDITE_GENERALE` ≥ 1, `MARGE_NETTE` ≥ 0. Hors de ce bloc, l'octet est
identique ; la liasse produite ne change pas ; **`balance-service` ne lit pas `seuils`**.

Ces trois artefacts sont recopiés à l'octet dans `balance-service` (D-078-2, AD-6 ; patron STORY-428) ; la recopie fait
d'ordinaire partie de la story qui révise, mais `balance-service` est tenu par C au lot 6 : D n'y touche pas.

| Artefact | Empreinte d'avant | Empreinte de STORY-1076 |
|---|---|---|
| `syscohada-revise-2.1.json` | `1a859fc10c37337dbbc48fa494629754569246b73e9cc77c553fa7f166928ecb` | `abaffa013da94aac9f00b1693fdaef855dff677697a695a309a3474c8556ae93` |
| `syscohada-revise-2.2.json` | `c3d2ecc8dd35bd0d5947c69c11a32d04c55211eaaa264e181e880d741e6369f7` | `8b6255f7f25c3251b2fb197616a5eae73499ccfcac7e9ead175614fadb40b177` |
| `syscohada-revise-2.3.json` | `a2fd635c8021f9b58c98204cfd344b7a7b88981dbbf68a4c5f0891dfe497f94c` | `7a39c0da930fb8378d589e70c91c438ea182d28b4125d43e7cf2cb3dc5bad8b9` |

(`zone-franche-togo-1.0.json` bouge aussi côté bilan ; il n'est pas recopié dans balance.)

## Ce qui est demandé à C

1. Recopier les trois artefacts depuis `origin/dev` de `prospera-bilan-service` (SHA de la fusion de STORY-1076, au
   journal de D), **à l'octet** : `git -c core.autocrlf=false show origin/dev:src/modules/bilan/referentiel/assets/<f>`.
2. Mettre à jour les trois empreintes du registre (`src/modules/referentiel/referentiel-registry.ts`) et de
   `ARTEFACTS_PARTAGES` (`referentiel-assets-coherence.spec.ts`, `recopieLe: '… (STORY-1076)'`).
3. Vérifier que la garde « octets identiques à ceux de bilan-service » repasse au vert avec `bilan-service` à jour à côté.

Aucun contrat de balance ne change.
