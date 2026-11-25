# TICKET-BACKEND — balance-service : recopier à l'octet les trois paquets SYSCOHADA révisé (bloc `seuils` de STORY-1076)

**Cible :** `prospera-balance-service`, tenu par **C** (D-L6-5)
**Ouvert par :** STORY-1076 (D, 2026-11-24), décision D-1076-6
**Priorité :** Should — rien ne casse en service ; la garde de byte-identité de balance rougit sur un poste où
`bilan-service` est à jour à côté
**État :** ✅ servi le 2026-11-25 par C (STORY-1020, balance-service #165) — voir « Suivi »

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

1. Recopier les trois artefacts depuis `origin/dev` de `prospera-bilan-service` (fusion de STORY-1076 : **`e4cee3e`**,
   prospera-bilan-service#186), **à l'octet** : `git -c core.autocrlf=false show origin/dev:src/modules/bilan/referentiel/assets/<f>`.
2. Mettre à jour les trois empreintes du registre (`src/modules/referentiel/referentiel-registry.ts`) et de
   `ARTEFACTS_PARTAGES` (`referentiel-assets-coherence.spec.ts`, `recopieLe: '… (STORY-1076)'`).
3. Vérifier que la garde « octets identiques à ceux de bilan-service » repasse au vert avec `bilan-service` à jour à côté.

Aucun contrat de balance ne change.

## Mise à jour (2026-11-25, STORY-1077, D)

STORY-1077 révise **encore en place** les mêmes trois artefacts (doctrine de D-1076-2) : le marqueur de table de
passage `capitauxPropresStricts` et le bloc `alerteCapitauxPropres` (alerte « capitaux propres < ½ capital »,
AUSCGIE 371-373 et 664-669). `balance-service` ne lit ni l'un ni l'autre. **Recopier la version de STORY-1077**
(elle contient celle de 1076) : le SHA de `dev` et les trois empreintes sont écrits dans l'entrée « PUBLIÉ » de
STORY-1077 du journal de D (« ⚠ Contrats ») et dans la fiche `stories/STORY-1077.md` (« Preuves »).

## Mise à jour (2026-11-25, STORY-1078, D)

STORY-1078 révise **encore en place** les mêmes trois artefacts : le bloc `controlesIntegrite` (les quatre contrôles
d'intégrité de la liasse, leurs comptes et leurs sources). `balance-service` ne le lit pas. **Recopier la version de
STORY-1078** (elle contient celles de 1076 et 1077). Empreintes de STORY-1078 : `syscohada-revise-2.1.json`
`a2da57d7732881165266db2dbd56a3c54ac409a2ecd9b7650a88adf4c9b466b7`, `syscohada-revise-2.2.json`
`65c9c9a9e48f2ad66e8fc966e1b1bab8625d83e40a73a33119344db99922ba08`, `syscohada-revise-2.3.json`
`39bb9f9954b161bf6cd2fa28e20fab405f8d91d99f1db1a0e49b591fbf0ed833` (`zone-franche-togo-1.0.json`, non recopié :
`70c87a37618ea5beddfe0bf1543f47b3b7d75636c9879c3344d59c70bb2da0a0`). Le SHA de `dev` est écrit dans l'entrée « PUBLIÉ »
de STORY-1078 du journal de D (« ⚠ Contrats »).

## Mise à jour (2026-11-25, STORY-1118, D)

STORY-1118 révise **encore en place** les tables de passage et les plans de comptes, et **cette fois la liasse
produite change** pour toute balance qui porte un compte `28`, `29`, `39`, `49` (hors `499`) ou `59` (hors `599`) :
ces comptes sont rattachés au poste de leur actif (colonne « Amort./Dépréc. »), et le plan de comptes gagne 117 comptes
officiels (281 → 2848, 291 → 2978, 391 → 398, 490 → 4983, 590 → 594). **Quatre artefacts à recopier cette fois**, car
`balance-service` embarque aussi `smt-togo-1.0.json`, révisé par la même story. **Recopier la version de STORY-1118**
(elle contient celles de 1076, 1077 et 1078) :

| Artefact | Empreinte de STORY-1078 | Empreinte de STORY-1118 |
|---|---|---|
| `syscohada-revise-2.1.json` | `a2da57d7…` | `3880b6c2b9ccef9cc063258489f8df1d130a77adb02b4da2616d9ae7e1c05c8b` |
| `syscohada-revise-2.2.json` | `65c9c9a9…` | `16071b45406637e9714c2ee58860536c88915649efa53b75939e8d7b78237df5` |
| `syscohada-revise-2.3.json` | `39bb9f99…` | `ea5798e908f6e3f3cb5576ce04dbaa66543e2a571d2c3fa28e26ed917540f5d0` |
| `smt-togo-1.0.json` | `00335c03…` | `5b614bd829b06c73b3b5988e18f1f778e208d71e8468544ffc35ef220e1d37b4` |

(`zone-franche-togo-1.0.json`, non recopié : `58e5bc9962bcfc41286f3621538b34eaeb22dcfad1f794d9d8ac0085a220d5eb`.)

Ce que la recopie change **dans `balance-service`** (à vérifier par C, qui tient le dépôt) : le plan s'enrichit, donc
le libellé « le plus spécifique » d'un compte `28x`, `29x`, `39x`, `49x`, `59x` change à l'import Sage
(`sage-import.service.ts`, `libelleDuPlanLePlusSpecifique`) et dans les cahiers (`cahiers-depenses.service.ts`,
`cahiers-recettes.service.ts`) ; `classeDuCompte` ne change pas (classes 2 à 5). Les règles fiscales qui lisent la
table de passage (`liquidation.regles.ts`) ne lisent aucun des postes touchés. **Source de la recopie : `origin/dev`
de `prospera-bilan-service` à `5055933`** (fusion de STORY-1118, prospera-bilan-service#189 ; les artefacts sont ceux
de `b6f2d49`).

## Suivi

- 2026-11-25 — **servi par C dans STORY-1020** (balance-service #165) : les quatre artefacts recopiés à l'octet de
  bilan-service `dev` (`b6f2d49`), empreintes `3880b6c2…`, `16071b45…`, `ea5798e9…`, `5b614bd8…` au registre et dans
  `ARTEFACTS_PARTAGES` (`f6d3f8f` sur `dev`) ; la garde « octets identiques à ceux de bilan-service » est verte avec
  bilan-service à jour à côté. Effets vérifiés : le plan servi compte 291 comptes (@2.1) et 296 (@2.2, @2.3) ; le canevas
  d'inventaire écarte 391 → 398 (`COMPTE_DE_DEPRECIATION`) ; `491` entre au poste `BI` mais n'est pas une créance en
  devise (la garde des créances réévaluables le dit) — `58322c4`. Aucune règle de balance-service ne change ; Node 24 :
  unitaires 5584, e2e 1989.
