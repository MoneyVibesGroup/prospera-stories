# STORY-486 : Une surcharge vers un poste sans règle exploitable écarte le solde du compte — en silence, et le compte est pourtant « affecté »

Status: ready-for-dev

**Épic :** EPIC-010 — Référentiels & table de passage (FR-006/FR-008) · *le code touché vit
dans `etats/` (EPIC-011) et la garde d'entrée dans `mapping-override/`*
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan/mapping-override`
**Points :** 3 · **Sprint :** S20
**Origine :** remontée le **2026-08-27** par la **revue de code de STORY-401**, puis
**confirmée et re-mesurée par sa revue de sécurité** (confiance 95) sur le référentiel réel
`syscohada-revise@2.1` — jamais déduite du code.

---

## Le fait

STORY-401 a posé `COMPTES_NON_AFFECTES` : un compte que la table de passage ne rattache à
**aucun** poste (`nonMappes`) et dont le solde net n'est pas nul bloque la validation. Le
contrôle regarde `nonMappes`, et c'est exactement sa portée.

⛔ **Il existe une seconde façon, non couverte, de sortir un solde des états — et elle
laisse le compte dans `mappes`, donc invisible au contrôle.**

`BilanProductionService.choisirRattachement` ne retient qu'un rattachement dont la `regle`
est **exploitable** (`NET_ACTIF`, `SOLDE_DEBITEUR`, `SOLDE_CREDITEUR`, `PRODUIT`, `CHARGE`) ;
sinon `continue` — le solde n'entre nulle part. Or `TableDePassageService.rattachementSurcharge`
pose `regle: regle?.regle ?? ''` : une surcharge dont le poste cible ne porte **aucune règle
de table de passage** produit un rattachement de règle vide.

Et la garde d'entrée ne l'interdit pas : `MappingOverrideService.proposer` exige seulement
que le poste **existe** dans `pkg.postes` (`POSTE_INCONNU`).

⚡⚡ **La revue de SÉCURITÉ de STORY-401 a mesuré le chemin de bout en bout, et il est
entièrement applicatif** — aucun accès base requis, `TENANT_USER` propose, `TENANT_ADMIN`
valide, les deux surcharges passent les gardes (`POSTE_INCONNU`, `COMPTE_HORS_REFERENTIEL`),
puis la liasse est acceptée. Mesure sur `syscohada-revise@2.1`, `211000 → {BILAN_ACTIF, AZ}`
et `101000 → {BILAN_PASSIF, CP}` :

| | `totalActifN` | `totalPassifN` | `equilibreN` | `soldesComptesNonMappes` |
|---|---|---|---|---|
| sans surcharge | 1 000 000 | 1 000 000 | `true` | `[]` |
| avec les 2 surcharges | **0** | **0** | `true` | **`[]`** |

⚠️ **Et la cause exacte n'est pas seulement « le poste n'a pas de règle »** : `AZ` **a** une
règle dans le paquet, sous `etat: 'BILAN'` — la cible visée est `BILAN_ACTIF`, et la
recherche `r.etat === cible.etat && r.poste === cible.poste` échoue sur le couple. Un
correctif qui ne regarderait que « ce poste porte-t-il une règle quelque part » laisserait
donc passer ce cas-là. **CWE-693** (*Protection Mechanism Failure*), A04:2021.

**Surface mesurée sur les 5 artefacts embarqués** : ~50 postes de `pkg.postes` ne portent
aucune règle (`AZ`, `BG`, `BK`, `BT`, `BZ`, `CP`…), **plus** tous les postes `type='total'`
(`XA..XI`, `ZA..ZH` du TFT, `RSA..RSG` en SFD v2). Tous sont des cibles de surcharge
acceptées aujourd'hui.

## Ce que ça coûte

Mesure faite sur `syscohada-revise@2.1`, deux surcharges `COMPTE` **VALIDATED** renvoyant
`999999` (D 7 000 000) et `999998` (C 7 000 000) vers `{etat: 'BILAN_ACTIF', poste: 'AZ'}` :

```
totalActifN = 10 000 000  (au lieu de 17 000 000)
comptesNonMappes = []
COMPTES_NON_AFFECTES = OK   EQUILIBRE_BILAN = OK   valide = true
```

⇒ **Le cas silencieux que STORY-401 vient de fermer est rejoué à l'identique**, par la porte
de la surcharge : liasse équilibrée, validable, et fausse. Avec une aggravation : le compte
**paraît affecté** — l'écran le montre rattaché au poste `AZ`, et le rapprochement « ce
compte est bien dans les états » est faux.

## Périmètre

**Inclus**

- **Refuser à la source** : `proposer()` refuse (422, code dédié) une cible dont le poste ne
  porte **aucune règle exploitable** dans `pkg.tableDePassage` — le geste est de viser un
  poste de **détail**, pas un agrégat. Message qui dit quoi faire, et code publié au contrat.
- **Filet en production** : un rattachement écarté par `choisirRattachement` cesse d'être un
  `continue` muet. Deux voies à arbitrer à la conception : le verser à
  `soldesComptesNonMappes` (le contrôle de 401 le couvre alors sans changer de code), ou
  ouvrir un 6ᵉ contrôle. **Le refus à la source ne suffit pas seul** : des surcharges
  d'avant cette story existent déjà en base.
- Le nommer au contrat : le compte est *affecté à un poste qui ne le reçoit pas*, et
  aujourd'hui rien ne le distingue d'un rattachement effectif.

**Hors périmètre**

- Rendre les postes `FORMULE` alimentables par des comptes : ils sont calculés par
  opérandes, c'est leur définition (STORY-112).
- Migrer/annuler les surcharges déjà `VALIDATED` visant un tel poste : à décider avec le PO
  (les invalider d'office effacerait un choix humain).

## Critères d'acceptation

1. Une surcharge visant un poste sans règle exploitable est **refusée** en 422, avec un code
   publié en énumération OpenAPI (patron STORY-375) et un message qui nomme le geste.
2. Une surcharge visant un poste de **détail** reste acceptée — témoin de non-régression.
3. Un compte rattaché par une surcharge **déjà en base** vers un tel poste **n'est plus
   écarté en silence** : la liasse le signale, et `valider()` s'y conforme.
4. Le cas **compensé** (deux tels comptes qui se neutralisent) est couvert par un test dédié :
   `EQUILIBRE_BILAN = OK` **et** la liasse non validable — le témoin exact de STORY-401,
   rejoué par la porte de la surcharge.
5. Le JSDoc de `controleComptesNonAffectes` (STORY-401), qui déclare aujourd'hui cet écart
   comme fiché ici, est mis à jour — pas laissé à pointer une story close.

## Notes

- ⚠️ **Écart de la famille de STORY-401**, dont il est le résidu exact : là, un solde écarté
  parce qu'aucun poste ne le recevait ; ici, un solde écarté alors qu'un poste **a été
  désigné**. Le second est plus trompeur que le premier.
- ⚠️ Mesuré, jamais déduit : les chiffres ci-dessus sortent d'une exécution sur l'artefact
  packagé, avec deux surcharges réellement insérées.
