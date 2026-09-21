# TICKET frontend — le pack Assurance doit citer `cima-assurances@2.0`

**Type :** désynchronisation d'offre (le front déclare une version de référentiel que le back ne sert plus)
**Dépôt :** `prospera-frontend-admin-panel` — `vertical-packs.ts`, `VERTICAL_PACKS.Assurance.referentiel`
**Débloqué par :** **STORY-518** (`bilan-service` / `balance-service` / `assurance-service` / `platform-catalog-service`)
**Ouvert par :** STORY-518, 2026-09-21
**Priorité :** Should — aucune panne côté client : le backend sert `@2.0` et le seed du catalogue
l'octroie déjà. Le front reste seulement **inexact** dans ce qu'il annonce, jusqu'à correction.

---

## Le problème

STORY-518 fait entrer les variations de provisions techniques au compte de résultat CIMA : le
résultat technique `RT` cessait d'être un résultat de trésorerie, ce qui **change la valeur
publiée**. Le changement est porté par une **nouvelle version du paquet** de référentiel,
`cima-assurances@2.0` — `@1.0` restant packagée et intacte, parce qu'elle a été attribuée à des
organisations et qu'on ne réécrit pas un chiffre déjà servi.

Côté backend, `@2.0` est désormais la version **servie** :

| Service | Où | Valeur |
|---|---|---|
| `assurance-service` | `REFERENTIEL_SERVI` | `cima-assurances@2.0` |
| `balance-service` | `PONT_TAG['CIMA']` | `cima-assurances@2.0` |
| `platform-catalog-service` | pack `assurance-cima` | `cima-assurances@2.0` |

Le front, lui, transcrit encore `cima-assurances@1.0` dans `VERTICAL_PACKS.Assurance`.

## Pourquoi ça ne casse rien aujourd'hui — et ce que ça coûte quand même

Le seed du catalogue est la source de l'octroi : c'est **lui** qui décide ce qu'une organisation
reçoit, pas le front. Une organisation abonnée au pack Assurance reçoit donc bien `@2.0` et la
liasse se produit normalement.

Ce qui reste faux est **ce que la console annonce** : un écran qui affiche la version du référentiel
d'un pack montrera `1.0` là où l'organisation recevra `2.0`. Et la divergence est aujourd'hui
**déclarée** côté backend (`ECARTS_ASSUMES_AU_FRONT`, clé `assurance-cima`, champ `referentiels`),
ce qui **suspend** la comparaison de valeur entre le seed et la transcription du front — le mécanisme
exact par lequel la version fantôme `sfd-bceao@1.3` est passée inaperçue pendant des semaines
(STORY-185, trouvée en STORY-497).

⛔ **Cette suspension est ce que le ticket vient fermer.** Elle est compensée, en attendant, par une
garde qui **nomme** la version attendue (`packs.seed-data.spec.ts`, test « l'écart déclaré du pack
Assurance NOMME sa version ») — une garde qu'aucune table d'écarts ne peut suspendre.

## Ce qu'il faut faire

1. Dans `vertical-packs.ts`, passer `VERTICAL_PACKS.Assurance.referentiel` à
   `{ code: 'cima-assurances', version: '2.0' }`.
2. Prévenir le backend : la transcription `packs.front-snapshot.ts` doit être **relue** et mise à
   jour à la même valeur, **et la ligne d'écart `assurance-cima` / `referentiels` doit alors être
   RETIRÉE** de `ECARTS_ASSUMES_AU_FRONT`. ⚠️ Le test exige qu'un écart déclaré **existe encore** :
   une ligne laissée là après la correction du front fait virer la suite au rouge, ce qui est voulu.

## Ce qui n'est PAS demandé ici

- Rien sur l'affichage du compte de résultat : `RT` change de **valeur**, pas de forme, et son
  libellé est porté par le paquet servi (« Résultat technique (amorce — hors séparation
  Vie/Non-Vie) »), donc affiché correctement sans changement front.
- Rien sur `@1.0`, qui reste packagée et résolvable : les dossiers qui y sont continuent d'être
  servis.
