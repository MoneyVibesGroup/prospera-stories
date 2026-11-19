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

### Second tour : Efua présente la solution complète, et le prix change d'échelle

Après la présentation complète (facture en photo → écriture, GUDEF et dimana, rapprochement, prêt, archivage,
optimisation selon la loi de finances, multi-pays), le prix ne se compte plus en licences mais en **salaires
évités** :

| Qui | Façon de payer | Montant cité |
|---|---|---|
| Komlan | par dossier et par an, photo de facture et dimana du mois compris | 25 000 FCFA par dossier |
| Me Akossiwa | par an, prêt et archivage compris, **si** le premier dépôt réel passe (STORY-1102) | 3 à 4 M FCFA (3 salaires de saisie ≈ 5,4 M FCFA évités, à 150 000 FCFA par mois chacun, chiffre à vérifier) |
| Yves | par pays ouvert, plus par poste | un prix pour le Bénin avant d'acheter pour le Togo |

Règle de Mary : **pour 50 dossiers, le prix reste sous un salaire d'aide-comptable par an.**
Désaccord non tranché : « réduire les effectifs » (Efua, message du PO) contre « la même équipe, deux fois plus de
dossiers » (Mary).

## La grille proposée (2026-11-19) — proposition de A, NON DÉCIDÉE

> Demande de l'utilisateur : « détaille-moi les prix », puis « note cela quelque part, je vais revenir chercher
> l'information ». Rien n'est arbitré. Les prix des options n'ont pas été discutés en salle.

### Deux circuits d'argent — ne pas les confondre

```
La PME cliente ──(honoraires)──▶ le cabinet ──(abonnement Prospera)──▶ Money Vibes
```

- Les **honoraires** : le cabinet les fixe dans **son** catalogue (PRD services du cabinet, FR-12 : forfait,
  abonnement, volume) et les encaisse ; ils ne passent jamais par Money Vibes (règle SM-1).
- L'**abonnement** : le seul prix que Money Vibes fixe. C'est celui de cette grille.

Prix **hors taxe**, TVA 18 % en sus sur la facture de Money Vibes.

### Ce qui justifie le prix

| Gain du cabinet | Exemple |
|---|---|
| Du temps de saisie | la facture en photo devient une écriture ; la DSF n'est plus ressaisie |
| De nouvelles missions à facturer | le dossier de prêt, l'archivage |
| Moins de risque | majorations LPF de 30 / 40 / 80 % évitées (rapprochement, dépôt à l'heure) |

Repères : GETAFIS 1 180 000 FCFA (une fois, liasse seule) ; Compta Expert 550 000 FCFA (une fois) ; un aide-comptable
≈ 150 000 FCFA par mois, soit 1,8 M FCFA par an (chiffre d'un personnage, à vérifier).

### Formule « Liasse » — l'entrée

- **15 000 FCFA par liasse déposée et acceptée** ; rien n'est dû si le rejet de format vient du produit.
- Comprend : import de la balance Sage, 92 feuilles, 44 notes, dépôt guidé sur GUDEF, accusé archivé, mise à jour
  annuelle selon la loi de finances.
- Elle sert à faire entrer le cabinet ; il passe ensuite à la formule « Cabinet ».

### Formule « Cabinet » — la solution complète

Le cabinet paie **par dossier actif et par an**. Un dossier actif est un client pour lequel le cabinet a produit au moins
une déclaration ou une liasse dans l'année. Le tarif baisse par tranche, comme un barème :

| Tranche | Prix par dossier et par an |
|---|---|
| du 1er au 50e | 25 000 FCFA |
| du 51e au 150e | 20 000 FCFA |
| à partir du 151e | 15 000 FCFA |

**Compris :** la facture en photo → écriture, la comptabilité, la balance, la liasse, les déclarations dimana du mois
(entreprise et dirigeant), le rapprochement annuel, l'optimisation légale avec son article de loi, l'archivage numérique
des pièces du dossier, et **autant de collaborateurs que le cabinet veut**.

**Options, payées à l'usage (indicatif) :**

| Option | Prix | Raison |
|---|---|---|
| Dossier de prêt généré | 15 000 FCFA par dossier | le cabinet le facture bien plus cher à son client |
| Archivage d'un fonds entier (grandes structures) | 1 FCFA par page stockée et par an | 400 000 pages font 400 000 FCFA par an |
| Paie (lot P1, plus tard) | 300 FCFA par bulletin | 300 bulletins par mois font 90 000 FCFA par mois |
| Un pays de plus (réseaux) | 500 000 FCFA par pays et par an | paie la mise à jour du paquet de ce pays à chaque loi de finances |

**Paiement en deux fois** (idée de Mary) : 40 % en janvier, à l'ouverture de la saison, et 60 % en mai, quand le
cabinet a encaissé ses clients. Un paiement au mois reste possible.

### Trois exemples chiffrés (HT, par an)

| Cabinet | Calcul | Total | Par dossier |
|---|---|---|---|
| **Komlan** — 40 dossiers, formule Liasse | 40 × 15 000 | **600 000** | 15 000 |
| **Komlan** — 40 dossiers, formule Cabinet | 40 × 25 000 (400 000 en janvier + 600 000 en mai) | **1 000 000** | 25 000 |
| **Me Akossiwa** — 180 dossiers, 20 prêts | 50 × 25 000 + 100 × 20 000 + 30 × 15 000 + 20 × 15 000 = 1 250 000 + 2 000 000 + 450 000 + 300 000 | **4 000 000** | ≈ 22 000 |
| **Yves** — 400 dossiers au Togo + 100 au Bénin | 50 × 25 000 + 100 × 20 000 + 350 × 15 000 + 500 000 = 1 250 000 + 2 000 000 + 5 250 000 + 500 000 | **9 000 000** | 18 000 |

En face pour Me Akossiwa : trois postes de saisie libérés (≈ 5,4 M FCFA par an selon son calcul), remis sur le prêt et
l'archivage, qui rapportent.

### Pourquoi par dossier, et pas par poste

Si l'on fait payer chaque collaborateur, le cabinet qui réduit ses effectifs grâce au produit **paie moins** : on serait
puni pour la valeur qu'on apporte. Par dossier, le prix suit le portefeuille, qui grandit quand le cabinet prend des
marchés dans d'autres pays. C'est la promesse : moins de monde, plus de dossiers.

### Points faibles et vérifications

- **Comparé à GETAFIS sur trois ans** : pour Komlan, la formule Liasse coûte 1,8 M FCFA, contre 1,18 M FCFA payés une
  fois. Elle ne tient que parce que le dépôt guidé et la mise à jour annuelle sont compris ; si un concurrent les offre
  aussi, descendre à 10 000 FCFA par liasse.
- **La règle de Mary tient** : 50 dossiers coûtent 1 250 000 FCFA, sous 1,8 M FCFA.
- **À vérifier auprès du cabinet du 18/11** :
  - ce qu'il facture à un client pour sa mission annuelle (si c'est 300 000 FCFA, on lui coûte environ 7 %) ;
  - le vrai salaire d'un aide-comptable ;
  - le temps réellement gagné (mesuré par STORY-1102, AC-4).
