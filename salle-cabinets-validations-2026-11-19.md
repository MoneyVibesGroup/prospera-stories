# Ce que les cabinets veulent qu'on leur valide — salle du 2026-11-19

> **Origine :** séance de la salle (bmad-party-mode) du 2026-11-19. Question du PO : « Si tu étais expert-comptable,
> opterais-tu pour la solution cabinet, de la balance au dépôt de la liasse (GUDEF) et des impôts (dimana) ; que
> veux-tu qu'on te facilite ; combien paierais-tu ? »
> **À la table :** Me Akossiwa (associée, 180 dossiers à Lomé), Komlan (40 dossiers, Sage 100 + Excel), Yves (cabinet
> en réseau international), Ndeye (ancienne inspectrice des impôts), Efua (commerciale MV), Mary (analyste).
> ⚠️ Ce sont des personnages, pas des cabinets réels. Chaque point se confirme auprès du cabinet qui a écrit le 18/11
> (`prds/prd-services-cabinet-2026-11-18/prd.md` §1), et d'abord par STORY-1102.

Chaque point est écrit comme un critère qu'un cabinet vérifie lui-même. Le bloc
« ✅ Ce que les cabinets veulent qu'on leur valide » de chaque story porte le critère testable.

| # | Ce que le cabinet veut voir validé | Qui l'a demandé | Story | État de la story |
|---|---|---|---|---|
| V1 | Ne rien ressaisir de la DSF : la balance Sage déposée telle qu'elle sort donne les 92 feuilles et les 44 notes | Komlan | STORY-555, 556, 557, 559, 537 (livrées) ; preuve sur dossier réel : **STORY-1102** | livré, à prouver sur le terrain |
| V2 | Un premier dépôt **réel** accepté sur GUDEF, avec son accusé, **avant toute vente** | Me Akossiwa | **STORY-1102** (neuve), FE-081, STORY-333 | neuve / ready-for-dev / not_started |
| V3 | Les déclarations du mois sur dimana prêtes : valeurs dans l'ordre du formulaire, copiables, aucune ressaisie ; l'entreprise et le dirigeant séparés | Mary, Komlan | STORY-332, STORY-565, STORY-1102 | not_started / ready-for-dev |
| V4 | Le rapprochement annuel : les douze mois déclarés (TVA, retenues sur salaires, acomptes) face à la liasse, **avant** le dépôt | Ndeye | **STORY-1101** (neuve) ; STORY-326 reste intra-période | neuve |
| V5 | Un rejet expliqué en clair : la feuille, la cellule, la règle, et la correction proposée | Me Akossiwa, Ndeye | STORY-334, STORY-562 | not_started / ready-for-dev |
| V6 | Le visa de l'associé : rien ne part sans lui, son nom et la date figurent au dossier de dépôt ; l'accord du client est gardé comme pièce | Yves, Me Akossiwa | STORY-323, STORY-324, FE-081 | not_started / ready-for-dev |
| V7 | La facture prise en photo devient une écriture proposée, relue en lot | Komlan (relancé par le PO) | STORY-1097 | ready-for-dev |
| V8 | Le dossier de prêt sort de la liasse figée, sans ressaisir un chiffre | Me Akossiwa | STORY-1085, STORY-1086 (`epics-services-cabinet-2026-11-18.md`) | réservées |
| V9 | Les liasses, les accusés et les pièces se retrouvent depuis le dossier, en numérique et en papier | Me Akossiwa | STORY-335, STORY-1087, STORY-1088, STORY-1100 | not_started / réservées / ready-for-dev |
| V10 | Savoir où sont hébergées les données, et pouvoir exporter tout le dossier à tout moment | Yves | **aucune story** : à placer (Reprise, EPIC-161+, ou spine du moteur) | ⚠️ trou |
| V11 | Ne jamais promettre « zéro redressement » : on promet zéro rejet de format | Ndeye | règle de libellé dans STORY-1101 AC-7 et FE-081 | — |

## Ce qui n'est pas une story : le prix

La salle a donné trois façons de payer, sans se mettre d'accord :

| Qui | Façon de payer | Montant cité |
|---|---|---|
| Komlan (40 dossiers) | à la liasse déposée, rien si le rejet vient du produit | 15 000 FCFA la liasse |
| Me Akossiwa (180 dossiers) | au forfait annuel, si les déclarations du mois et l'archivage sont compris | 1,5 à 2,5 M FCFA par an |
| Yves (réseau) | par collaborateur, avec visa et signature | ≈ 25 000 FCFA par mois et par poste |

Proposition de Mary, née du désaccord entre Komlan et Efua : **un abonnement par dossier actif, payé en deux fois**
(à l'ouverture de la saison, puis au dépôt), avec les déclarations du mois comprises. Repères du marché, payés une
fois : GETAFIS cabinet 1 180 000 FCFA, Compta Expert 550 000 FCFA (annonces ohada.com, 2018 → 2023).

⚠️ Arbitrage du PO, à poser : rien n'est décidé sur le prix.
