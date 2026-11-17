# STORY-1047 : la bibliothèque d'encours

Status: in-progress

**Épic :** EPIC-225 · **Dépôt :** `prospera-plateforme` (dossier `encours/`, tenu par D, D-L3-5) · **Plage :** groupe
D, n° 3 du lot 3 (`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** B-956 (README et scripts racines),
fusionnée (plateforme #22, `dev` 189183f). **Suivante qui la consomme :** STORY-1049 (les garde-fous, `ventes`).

**Sources :** spine distributeur AD-9 (l'encours, le plafond, le blocage), AD-2 (bibliothèques partagées : majeur
déclaré, vecteurs d'or), AD-31 (périmètres) ; PRD distributeur FR-52, FR-187, FR-189, §3 (glossaire) et la règle de
l'encaissement déclaré (partie 3, terrain) ; amendement de `paiement` du 2026-11-13 (§3 et §5) ; code de `paiement`
(`STATUTS_CREANCE` = `OUVERTE`, `CLOTUREE` ; les deux restants `restantCertain` et `restantAffiche`, STORY-259).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Une seule règle de calcul** (AD-9, FR-52) : `encours = créances ouvertes + commandes validées non facturées − crédit du tiers`, par `(tiers, périmètre)`, dans une fonction pure `calculerEncours(entree, le)` | exemples du PRD retrouvés, valeurs écrites dans le test : FR-52 (900 000 + 600 000 − 100 000 = 1 400 000, disponible 600 000) et FR-187 (1 500 000, disponible 500 000) |
| AC-2 | **Même entrée, même résultat** : aucune horloge (la date entre en paramètre), aucun I/O, aucun flottant (entiers en unité mineure), aucun état ; les faits sont des états absolus, la plus haute révision par clé l'emporte, **quel que soit l'ordre d'arrivée** | test : toutes les permutations des faits rendent le même résultat ; le scénario d'AD-9 (plafond 1 000 000, deux commandes de 600 000, une facture entre elles) rend le même encours dans les 720 ordres ; deux appels successifs identiques |
| AC-3 | **Une entrée d'un module non installé est `ABSENTE`** : comptée zéro **et dite** (`absentes`, `complet: false`), jamais un zéro muet ; une source installée sans fait n'est pas absente | tests ; le disponible et le jugement rendent `NON_INSTALLE` (FR-187 (2)), jamais 0 ni le plafond entier |
| AC-4 | **Ce qui n'entre pas dans l'encours est écrit** (D-1047-3) : créance `CLOTUREE`, fait d'un autre tiers ou d'un autre périmètre (refusé, AD-31), devise différente (refusée) | tests, un par exclusion |
| AC-5 | **Le plafond se juge par la même bibliothèque** : `disponibleACredit` (fiche) et `jugerPlafond` (commande : `PLAFOND_CREDIT_DEPASSE` au-delà, strictement) ; plafond `SANS_OBJET` (client comptoir, enseigne interne) | tests ; plafond 1 000 000 : 600 000 passe, la seconde de 600 000 est refusée ; égalité acceptée |
| AC-6 | **Vecteurs d'or** (AD-2) : `encours/vecteurs-or.json`, entrées et sorties écrites à la main, rejoués ici et chez chaque consommateur | test qui joue chaque vecteur |
| AC-7 | **Mutations** : chaque règle a une mutation qui rougit **sur une assertion** | script de mutations, résultat dans « Preuves » |
| AC-8 | **Joué par les scripts racines** de la plateforme ; étiquette `encours-v1` posée sur le SHA fusionné ; empreintes des fichiers à copier données ici | `npm test` et `npm run typecheck` racines sous Node 24 ; sha256 |

## L'encours retenu (D-1047-1 → D-1047-3)

```
encoursCertain = Σ restantCertain  des Créances OUVERTE du tiers, dans le périmètre
               + restantAFacturer  de l'engagement du tiers (TTC des commandes validées non facturées)
               − Σ solde           des crédits du tiers, dans le périmètre
encoursAffiche = la même règle, avec restantAffiche (les encaissements déclarés en moins)
```

| Entrée de la bibliothèque | Fait d'origine (AD-9) | Champs lus |
|---|---|---|
| `creances` | `paiement.creance.changed@1` (état absolu) | `creanceId` (`<source>:<sourceId>`, K-7), `revision`, `tiersId`, `perimetre`, `devise`, `statut`, `restantCertainMineur`, `restantAfficheMineur`, `echeanceLe` |
| `creditsTiers` | `paiement.credit-tiers.changed@1` (état absolu) | `creditId`, `revision`, `tiersId`, `perimetre`, `devise`, `soldeMineur` |
| `engagement` | `commande.engagement-tiers.changed@1` (état absolu par `(tiers, perimetre)`) | `revision`, `tiersId`, `perimetre`, `devise`, `restantAFacturerMineur`, `versionEncours` |

## Décisions retenues par défaut (contestables)

- **D-1047-1 — La définition** est celle d'AD-9 et de FR-52, sans rien de plus : créances ouvertes (reste dû des
  factures émises et reprises, **échues ou non**), plus l'engagement non facturé publié par `commande`, moins le crédit
  du tiers. La bibliothèque ne décide pas **quand** l'engagement baisse : `commande` ne le baisse qu'à la réception du
  fait de Créance de la facture (AD-9) ; pendant la fenêtre, la facture compte deux fois, jamais zéro.
- **D-1047-2 — Deux lectures, une seule règle**, comme les deux restants de `paiement` (STORY-259 : aucun champ
  `restant` nu, donc aucun champ `encours` nu). `encoursCertain` ne retranche que l'argent constaté : c'est lui qui
  **juge** (commande), qui dit « plafond dépassé » et que `recouvrement` évalue (« le blocage lit le reste dû
  confirmé », PRD, encaissement déclaré). `encoursAffiche` retranche aussi les encaissements déclarés : c'est lui que
  la fiche montre (« il diminue l'encours affiché »). Un encaissement déclaré n'ouvre donc jamais de crédit : celui qui
  déclare ne confirme pas (FR-P60). Question au PO ci-dessous (Q-D-4).
- **D-1047-3 — Ce qui n'entre pas dans l'encours** :
  - une Créance `CLOTUREE` (remisée, réglée hors du service ou saisie à tort : `CLOTUREE` ne veut pas dire payée, mais
    plus rien n'est exigible) ; une Créance soldée compte zéro d'elle-même ;
  - un fait d'un **autre tiers** ou d'un **autre périmètre** : **refusé** (`HORS_TIERS`, `HORS_PERIMETRE`), jamais
    filtré en silence. Le périmètre est `SOCIETE` ou `FREELANCE:<id>` (AD-31) : la commande d'un freelance engage le
    freelance, jamais le détaillant ; un fait au prix freelance n'est pas sur ces topics ;
  - une **autre devise** : refusée (`DEVISE_DIFFERENTE`) ; aucune conversion ;
  - les commandes non validées, les proformas, les devis (seul l'engagement validé de `commande` entre) ; pour une
    commande modifiée (FR-35), le consommateur juge le **supplément**, pas la commande entière (elle est déjà dans
    l'engagement) ;
  - les pénalités et intérêts de retard (aucun chez le distributeur ; chez l'IMF, ce sont des composantes de la
    Créance, déjà dans son reste dû) ;
  - le montant d'une **dérogation** : il reste dans l'encours. C'est l'**évaluation du blocage** par `recouvrement`
    qui l'exclut tant que la commande n'est pas facturée (AD-9) ; elle entrera dans la bibliothèque en ajout (`1.x`)
    avec la story de `recouvrement` qui la lit, pas avant.
- **D-1047-4 — Des états absolus, la plus haute révision l'emporte.** Chaque fait porte sa clé et un entier
  `revision` ; la bibliothèque garde, par clé, le fait de plus haute révision ; un rejeu identique est sans effet ;
  deux contenus différents sous la même révision sont refusés (`REVISION_INCOHERENTE`), quel que soit leur ordre.
  Toute liste rendue (provenance) est triée par clé : l'ordre d'arrivée ne se voit nulle part.
- **D-1047-5 — `ABSENTE` n'est pas « vide »** : une source `{ statut: 'ABSENTE' }` (module non installé) compte zéro,
  apparaît dans `absentes` et met `complet` à faux ; une source `{ statut: 'PRESENTE', faits: [] }` (module installé,
  rien encore) compte zéro et le résultat reste complet. L'encours se calcule dans les deux cas (l'IMF n'a pas
  `commande`, AD-9) ; le **disponible** et le **jugement** rendent `NON_INSTALLE` dès qu'une source manque (FR-187
  (2)) : jamais 0, jamais le plafond entier.
- **D-1047-6 — L'encours peut être négatif** (un acompte sans facture : le tiers est créancier). Il n'est pas ramené
  à zéro : c'est la formule, et le disponible du tiers qui a payé d'avance dépasse son plafond d'autant.
- **D-1047-7 — Entiers en unité mineure, une devise par calcul.** Tout montant est un entier sûr, positif ou nul
  (`ENTREE_INVALIDE` sinon) ; `restantAffiche ≤ restantCertain` ; une somme qui sort des entiers sûrs est refusée
  (`MONTANT_HORS_BORNES`).
- **D-1047-8 — La date entre en paramètre** (`le`, `AAAA-MM-JJ`) ; elle ne sert qu'à l'**échu** : le reste dû
  certain des Créances dont l'échéance est **avant** `le`, la plus ancienne échéance dépassée et le retard en jours
  (le lendemain de l'échéance = 1 jour). Les seuils (J+1, J+30, 60 jours) restent la table de `recouvrement` : la
  bibliothèque ne dit pas « bloqué ».
- **D-1047-9 — Le plafond se compare ici**, pour que `commande`, `pdv` et `recouvrement` ne comparent pas chacun à
  leur façon : « dépasse » est **strict** (PRD : « dépasse le plafond ») ; `jugerPlafond` refuse
  `PLAFOND_CREDIT_DEPASSE` si `encoursCertain + supplément > plafond`. Le plafond **vient de `pdv`** : la bibliothèque
  ne le calcule pas (le plafond par défaut `max(400 000, 0,6 × CA mensuel)` est un paramètre de `pdv`), ni ne juge le
  crédit bloqué (`CREDIT_BLOQUE` passe avant, chez `commande`) ni la dérogation.
- **D-1047-10 — Version et copie.** `VERSION_ENCOURS = '1.0.0'`, majeur 1 ; l'engagement porte la version de la
  fonction (AD-9) : un majeur différent est refusé (`VERSION_ENCOURS_DIFFERENTE`). Bibliothèque d'un fichier, sans
  import (patron de `series-v1`) ; chaque consommateur copie à l'octet, à l'étiquette `encours-v1`,
  `encours/src/index.ts` **et** `encours/vecteurs-or.json`, et joue les vecteurs d'or dans ses tests (AD-2).
- **D-1047-11 — L'entrée est celle de la bibliothèque, pas le schéma de `paiement`.** B-963 et B-965 fixeront
  `paiement.creance.changed@1` et `paiement.credit-tiers.changed@1` ; le consommateur fait la correspondance (tableau
  ci-dessus). Ce que la bibliothèque attend d'eux est écrit à B dans le journal (information) : un état absolu par
  clé, une révision croissante, les deux restants (ou le montant déclaré à part, comme le dit l'amendement), le
  statut, l'échéance et le périmètre.
- **D-1047-12 — Aucune copie dans un service en 1047** : `ventes` (`commande`) la copie avec 1049 ; `pdv` et
  `recouvrement` avec leurs stories d'EPIC-225 et EPIC-235.

## Questions au PO (choix retenu par défaut)

- **Q-D-4 — La commande se juge-t-elle sur l'encours certain ou sur l'encours affiché ?** Choix par défaut :
  **certain** (D-1047-2) : un encaissement déclaré mais non confirmé ne libère pas de crédit.
