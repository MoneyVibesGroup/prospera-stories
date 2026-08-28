---
name: 'microfinance-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — module du vertical IMF/SFD, relying-party de l''IdP, producteur d''événements, **adaptateur de la balance canonique**'
scope: 'micro-service microfinance-service — membres et dépôts, portefeuille de crédits par événements, échéancier, classement et provisionnement réglementaire BCEAO, indicateurs de portefeuille, engagements hors bilan, états DIMF et ratios prudentiels'
status: 'proposé — 2026-08-27, à la suite de la revue expert-comptable de la maquette cumulative (décision PO : l''IMF est promise)'
created: '2026-08-27'
binds:
  - 'epics-microfinance-2026-08-27.md — EPIC-121 → EPIC-127'
sources:
  - 'bilan-service/src/modules/bilan/referentiel/assets/sfd-bceao-2.0.json (372 comptes, 31 postes, BAT/BPT FORMULE + roles TOTAL_ACTIF/TOTAL_PASSIF, SIG RSA→RSG) — LU LE 2026-08-27'
  - 'prospera-stories/referentiels/plan-comptable-sfd-bceao.json + README-sfd-bceao.md'
  - 'prospera-stories/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md §1'
  - 'balance-service/src/modules/balance/types/balance-canonique.ts (SOURCES_BALANCE, fermée à trois)'
  - 'prospera-stories/stories/STORY-422.md (voie A : le plan suit le dossier) + STORY-533 + STORY-489'
  - 'prospera-stories/architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md (patron de l''adaptateur de balance)'
---

# Architecture Spine — microfinance-service

> **Ce que ce service est.** Le **portefeuille** d'une institution de microfinance : à qui elle a
> prêté, ce qui reste dû, ce qui est en retard, et **ce qu'il faut provisionner pour ça**.
>
> **Ce qu'il n'est pas.** Il ne refait pas la comptabilité de l'IMF : `sfd-bceao@2.0` est **déjà
> packagé, sourcé et complet** — 372 comptes du RCSFD, totaux de bilan en `FORMULE` avec leurs
> marqueurs `TOTAL_ACTIF`/`TOTAL_PASSIF`, cascade des soldes intermédiaires DIMF 2080 `RSA → RSG`.
> **Vérifié dans l'artefact le 2026-08-27.** Ce service ne touche pas à cela.
>
> **Sa propriété structurante :** *un plan de comptes dit où ranger un encours ; il ne dit pas si
> cet encours est sain.* Tout ce module tient dans cet écart.

## Ce que la revue du 2026-08-27 a établi

Une IMF qui ouvre Prospera aujourd'hui trouve **un référentiel comptable juste et rien pour tenir un
portefeuille**. Elle cherchera le provisionnement dans les cinq premières minutes.

⛔ **Seul endroit du programme où l'absence est un risque réglementaire pour le client, pas un
inconfort : une IMF sous-provisionnée est en infraction, pas en retard.**

## Colonne vertébrale — AD-1 → AD-12

| # | Décision | Ce qu'elle contraint |
|---|---|---|
| **AD-1** | **Le portefeuille est la somme de ses événements de crédit**, jamais un encours qu'on corrige (octroi, décaissement, remboursement, rééchelonnement, abandon) | Append-only. C'est ce qui permet de répondre à « pourquoi 1 240 000 et pas 1 500 000 ? ». Patron repris de `stock-service` (AD-1/AD-2) |
| **AD-2** | ⚡ **Le classement est DÉRIVÉ, jamais stocké** : sain / en souffrance se calcule depuis l'échéancier **et une date d'arrêté** | Un classement au 31/12 doit se **recalculer à l'identique en mars**. Un état stocké et mis à jour par un batch ne se rejoue pas, et un contrôle demandera qu'il se rejoue |
| **AD-3** | **Le paquet prudentiel est SÉPARÉ du paquet comptable** — tranches d'ancienneté, taux de provision, seuils de ratios ; versionné, sourcé, vérifié par checksum | Le RCSFD et les instructions prudentielles évoluent par des **textes différents et à des rythmes différents**. Les fusionner obligerait à republier le plan — donc à recalculer tous les checksums de liasse — à chaque instruction nouvelle |
| **AD-4** | **Le provisionnement est calculé et PROPOSÉ, jamais appliqué d'office** | Une dotation est une **écriture**. Même doctrine que l'affectation du résultat à la reprise d'à-nouveaux : rien n'est pré-rempli |
| **AD-5** | **Le module publie une BALANCE canonique**, jamais des écritures — nouvelle `origine` du hub | `SOURCES_BALANCE` est **fermée à trois** : elle s'ouvre. Le contrat aval (liasse, fiscal, prévisionnel) ne change pas d'une ligne |
| **AD-6** | **Le dossier est l'unité de travail** (AD-P13). Membre, crédit et dépôt appartiennent à un dossier | Hors portée ⇒ **`404`, jamais `403`** |
| **AD-7** | **L'exercice appartient au dossier** (AD-P14) — read-model `exercices_dossier` | Aucune écriture sur exercice clos, comme `balance-service` |
| **AD-8** | ⚡ **Le référentiel du dossier fait autorité** (STORY-422, voie A) : les comptes produits ici sont validés contre `sfd-bceao`, **jamais** SYSCOHADA | **44 racines existent dans les deux plans et les 44 divergent** : `57` est la Caisse en SYSCOHADA et le **Capital social** en SFD. Valider contre le mauvais plan **ne rate jamais** |
| **AD-9** | **Les engagements hors bilan sont tenus et n'entrent pas au bilan** — classe 8 du RCSFD, hors états DIMF 2000/2080 | Crédits accordés non décaissés, garanties reçues. Ils comptent pour le **prudentiel**, pas pour la liasse. Les y faire entrer gonflerait l'actif |
| **AD-10** | **Un état réglementaire porte son format et sa version**, et EPIC-127 exige un **jalon `format confirmé`** | Même garde qu'EPIC-032 pour le dépôt fiscal : un état au mauvais format n'est pas un état |
| **AD-11** | **La devise vient du contrat canonique** (STORY-489) — **aucune constante XOF dans ce service** | Le RCSFD couvre les 8 États UEMOA ; le service ne doit pas naître mono-devise deux mois après qu'on ait payé pour l'en sortir |
| **AD-12** | **Le module ne décide aucun octroi** : ni scoring, ni analyse de risque de contrepartie | Il **enregistre** une décision prise ailleurs. Décider engagerait l'outil sur un jugement de crédit |

## Ce qui reste ouvert

- **Q1 (tranchée par AD-4)** — calculé et proposé.
- **Q2 (tranchée par AD-3)** — paquet prudentiel séparé.
- **Q3 (tranchée par AD-12 + la place du portefeuille)** — le portefeuille vit **ici**, pas dans
  `comptabilite-service` : un échéancier n'est pas une écriture, et le mettre dans un moteur
  généraliste ferait porter une norme sectorielle à un module qui ne la connaît pas.
- ⛔ **Non tranché : le rang de séquence.** Le service n'existe pas, et quatre modules réservés en
  août n'ont toujours aucun code. C'est une décision PO.
