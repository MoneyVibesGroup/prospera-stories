# STORY-458 : La projection ne calcule ni ne décaisse aucun impôt — et au Togo l'impôt dû n'est pas 27 % du résultat

Status: review

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en confrontant `projection-annuelle.service.ts` au paquet fiscal du dépôt (`referentiels/paquet-fiscal-togo-2026.json`).

---

## Le fait

`CompteResultatPrevisionnel.resultatNet` est documenté comme un **résultat avant impôt** (« l'IS relève
du paquet fiscal, axe orthogonal — hook documenté »). Le plan de trésorerie ne sort donc **jamais un
franc d'impôt** : `fluxExploitation = CAF − ΔBFR`, et rien d'autre.

Ce serait une simplification acceptable si l'impôt togolais était proportionnel au bénéfice. **Il ne
l'est pas.** Le paquet fiscal du dépôt publie les deux termes :

| | Taux | Assiette | Source |
|---|---|---|---|
| IS | **27 %** | bénéfice imposable | Art. 113 CGI |
| Minimum forfaitaire de perception (MFP) | **1 %** | **CA HT du dernier exercice clos** | Art. 120 CGI |

et la règle de liquidation : `impôt dû = max(MFP, IS)`, avec `duEnCasDeDeficit: true`.

Sur le dossier de démonstration (marge nette constatée **1,22 %**), le MFP l'emporte **les trois
années** du scénario prudent :

| | Résultat avant impôt | IS 27 % | MFP 1 % | Dû |
|---|---|---|---|---|
| N+1 | 265 275 | 71 624 | **163 750** | 163 750 |
| N+2 | 286 497 | 77 354 | **176 850** | 176 850 |
| N+3 | 309 417 | 83 543 | **190 998** | 190 998 |

**531 598 F cumulés**, absents du plan : la trésorerie de N+3 n'est pas 1 634 288 mais **1 102 690**.
Pour une entreprise à faible marge — le cas de la quasi-totalité des distributeurs — l'impôt réel est
**2,3 fois** l'IS théorique, et il est dû **même en perte**.

## Critères d'acceptation

- [ ] AC-1 — Le moteur consomme le paquet fiscal du dossier et calcule `impot: { is, mfp, du, retenu }`
      par exercice projeté, avec `regleLiquidation = max(MFP, IS)`.
- [ ] AC-2 — `resultatNet` **après impôt** est publié à côté de `resultatAvantImpot` — les deux, jamais
      un seul, et jamais l'un sous le nom de l'autre.
- [ ] AC-3 — L'impôt est **décaissé** dans le plan de trésorerie, au rythme des **acomptes** que le
      paquet publie déjà (`acomptesProvisionnels.echeances`, 31-01 / 31-05 / 31-07 / 31-10) plus le
      solde — c'est le seul calendrier fiscal structuré dont dispose le produit.
- [ ] AC-4 — L'assiette du MFP est le **CA HT du dernier exercice clos** ⇒ dépend de **STORY-457**.
      Tant que le CA n'est pas isolé, le total des produits sert d'assiette et la réponse le **signale**.
- [ ] AC-5 — Un régime sans IS (TPU libératoire, zone franche) rend `impot: null` **motivé**, jamais 0.
- [ ] AC-6 — `MODELE_PROJECTION_VERSION` passe à `1.1.0` : les montants changent à hypothèses
      inchangées, et le contrat annonce déjà que ce hook le ferait.

## Conséquences ailleurs

- Un plan de trésorerie remis à une banque sans la charge d'impôt est **inutilisable** : c'est la
  première ligne qu'un analyste crédit reconstitue.
- Le module **Fiscalité** (EPIC-fiscal) porte déjà la liquidation `max(IS, MFP)` : la story doit
  **réutiliser** ce calcul, pas en écrire un second — deux formules divergeraient en silence.

---

## Arbitrages PO du 2026-09-05 (avant écriture d'une ligne)

La fiche a été rédigée le **2026-08-27**, soit **neuf jours avant** la clôture de STORY-457
(2026-09-05) qui isole le chiffre d'affaires. Sa table de chiffres reflète donc l'état
dégradé qu'AC-4 décrivait comme provisoire, et **deux points ont été tranchés par le PO**
avant le développement.

### D-458-1 — l'assiette du MFP est le CA HT de **l'exercice liquidé**, pas du précédent

AC-4 écrit « CA HT du **dernier exercice clos** » et sa table applique 1 % aux produits de
l'exercice **précédent** (163 750 / 176 850 / 190 998). Or :

- le paquet fiscal du dépôt (`minimumForfaitairePerception.base`) dit **« chiffre d'affaires
  hors TVA »**, sans décalage — Art. 120 CGI ;
- le moteur fiscal existant (`balance-service/src/modules/fiscal/liquidation.regles.ts`)
  l'assied sur le CA de **l'exercice liquidé** ;
- la fiche exige elle-même de **réutiliser ce calcul**, « pas d'en écrire un second — deux
  formules divergeraient en silence ». Un décalage d'un an **est** cette divergence.

**Retenu** : `assietteMfp(n) = chiffreAffaires(n)`. Le CA projeté est le CA de base isolé par
STORY-457, porté par la **même** croissance que les produits (le modèle suppose la structure
des produits stable — hypothèse **publiée**, pas cachée). Quand le référentiel ne déclare
aucun marqueur de CA (SFD-BCEAO, CIMA), l'assiette retombe sur le **total des produits** et
la réponse le **signale** (`assietteMfpSource: 'TOTAL_PRODUITS'`) — c'est le repli qu'AC-4
prévoyait, désormais l'exception et non la règle.

Effet mesuré sur le dossier de démonstration : MFP **135 000 / 145 800 / 157 464** (et non
163 750 / 176 850 / 190 998), l'IS restant écarté les trois années. **Les chiffres de la
section « Le fait » ci-dessus sont donc périmés** — ils décrivaient l'assiette de repli.

### D-458-2 — le décaissement mensuel : quatre quarts aux échéances du paquet

Le calendrier d'acomptes n'a de sens que dans le plan **mensuel** (12 mois de N+1) : l'annuel
n'a pas de granularité pour l'exprimer. Deux modèles étaient possibles ; le **calendrier réel**
(acomptes assis sur l'exercice **précédent**, solde l'année suivante) obligerait à liquider
l'exercice de base à partir d'un résultat comptable **déjà net d'impôt** — une approximation de
plus, sur une donnée que le modèle ne possède pas.

**Retenu** : l'impôt de l'exercice est **décaissé dans l'exercice**. Côté annuel, la CAF devient
le résultat **après** impôt ; côté mensuel, une ligne `decaissementsImpot` porte **un quart** de
l'impôt de N+1 à chacune des quatre échéances publiées par le paquet (31-01, 31-05, 31-07,
31-10), par partition entière exacte. `Σ mensuel = annuel` reste une **identité**, arrondis
compris. Le décalage réel (acomptes sur l'exercice précédent + solde de régularisation) est un
**hook inerte documenté**, hors périmètre.

---

## Progress Tracking

**Statut : `review`** — branche `MNV-458` sur `bilan-service` (base `dev`), branche
`MNV-458` sur `docs/` (base `main`).

- [x] Arbitrages PO D-458-1 et D-458-2 tranchés et consignés **avant** la première ligne de code.
- [x] Développement.
- [x] Portes DoD : lint **0 warning**, build OK, **1 899** unitaires + **517** e2e verts,
      couverture **98,87 / 94,24 / 98,84 / 98,89** (seuils 65/90/90/90).
- [x] Discipline de mutation : **6 mutations, 6 rougissements ciblés** (détail plus bas).
- [x] Vérification docker sur la base réelle.
- [ ] Revue de code.
- [ ] Revue de sécurité.

### Ce qui a été livré

| AC | Où | État |
|---|---|---|
| AC-1 | `impot.ts` (`resoudreFiscalite`, `liquiderImpot`) + moteur annuel | livré |
| AC-2 | `resultatAvantImpot` **et** `resultatNet` après impôt, publiés côte à côte | livré |
| AC-3 | annuel : l'impôt sort par la CAF · mensuel : `decaissementsImpot` aux 4 échéances | livré |
| AC-4 | assiette = CA de l'exercice, repli `TOTAL_PRODUITS` **signalé** | livré (cf. D-458-1) |
| AC-5 | `impot: null` + `fiscalite.motif` (`PAQUET_FISCAL_ABSENT`, `TAUX_IS_NON_PUBLIE`) | livré |
| AC-6 | `MODELE_PROJECTION_VERSION` `1.0.0` → `1.1.0` | livré |

**Les TROIS chemins de projection** sont câblés — annuel, mensuel et **comparaison**, ce
dernier appelant les moteurs sans passer par `ProjectionService` (la leçon de STORY-457,
où la garde de forme n'avait été posée que sur deux d'entre eux).

**La « réutilisation » du moteur fiscal demandée par la fiche est impossible en l'état** :
`balance-service/src/modules/fiscal/liquidation.regles.ts` vit dans un **autre service, une
autre base, un autre dépôt**, et l'écosystème n'a aucune bibliothèque partagée (invariant
d'archi n° 2). Ce qui est reproduit est donc le **contrat** de ce moteur — arrondi, plancher
à 0, et surtout le `>` **strict** de l'arbitrage (à égalité, l'impôt dû est celui de droit
commun) — documenté ligne à ligne en tête de `impot.ts`, avec la table de correspondance des
trois règles. La spec met l'égalité à l'épreuve : sans elle, passer à `>=` ne rougirait nulle
part, puisque seul `retenu` changerait.

### Mutations volontaires (chacune restaurée)

| Mutation | Ce qui a rougi |
|---|---|
| `mfp > is` → `mfp >= is` | « à ÉGALITÉ, retient l'IS et non le minimum » |
| ligne d'impôt retirée du `fluxNet` mensuel | articulation, recomposition, trésorerie de clôture (3) |
| `resultatNet = resultatAvantImpot` | AC-1 déficit, AC-2, AC-3 (3) |
| assiette MFP → total des produits | 7 tests, dont l'AC-1 sur le CA de l'exercice |
| borne `]0 ; 1]` du taux supprimée | « un “27” vaudrait 2 700 % d'impôt », et le MFP aberrant |
| repli d'étalement 12 mois → un seul mois | « sans échéance publiée, étale sur les 12 mois » |

⚠️ La 6ᵉ a d'abord été écrite en supprimant la constante `TOUS_LES_MOIS` : elle rougissait
par **erreur de compilation**, ce qui ne prouve rien. Réécrite pour compiler.

### Vérification docker (2026-09-05, stack `docker compose`, `Found 0 errors`)

Base réelle du dossier de démonstration (`bilan_service`) : produits **16 375 000**,
**chiffre d'affaires 12 500 000** (celui qu'a isolé STORY-457), total actif 7 000 000,
trésorerie 5 000 000, référentiel `syscohada-revise@2.1`.

**1. L'état fiscal vient bien de l'artefact vérifié par checksum**
`fiscalite = { applicable: true, motif: null, parametres: { tauxIs: 0.27, tauxMfp: 0.01,
moisAcomptes: [1, 5, 7, 10] } }` — aucun taux ne vient du code.

**2. Le scénario de la fiche, rejoué (croissance 8 %, marge 21,5 %, charges 20 %)**

| | Résultat avant impôt | IS 27 % | MFP 1 % du CA | Dû | Résultat net |
|---|---|---|---|---|---|
| N+1 | 265 275 | 71 624 | **135 000** | 135 000 (MFP) | 130 275 |
| N+2 | 286 497 | 77 354 | **145 800** | 145 800 (MFP) | 140 697 |
| N+3 | 309 417 | 83 543 | **157 464** | 157 464 (MFP) | 151 953 |

⚡ **Le résultat avant impôt et l'IS tombent à l'unité près sur les chiffres de la fiche**
(265 275 / 286 497 / 309 417 et 71 624 / 77 354 / 83 543) : le scénario est bien celui
qu'elle décrit. **Seul le MFP diffère**, et c'est exactement l'objet de D-458-1 — 1 % du
**chiffre d'affaires** de l'exercice (13 500 000) et non 1 % des **produits de l'exercice
précédent** (16 375 000). Le minimum forfaitaire l'emporte **les trois années**, comme la
fiche l'annonçait. Cumul décaissé : **438 264** (et non 531 598).

**3. CAF, équilibre, trésorerie** — `capaciteAutofinancement === resultatNet` sur les trois
exercices ; `controle = { ecart: 0, equilibre: true }` partout ; trésorerie N+1 **5 052 221**
contre **5 187 221** sans impôt, soit exactement les 135 000 décaissés.

**4. Le mensuel décaisse aux échéances du paquet**
`decaissementsImpot = [33 750, 0, 0, 0, 33 750, 0, 33 750, 0, 0, 33 750, 0, 0]`, somme
**135 000** = l'impôt annuel ; `ecartArticulation: 0` ; `fluxNet` recomposable ligne à ligne
sur les 12 mois ; clôture du mois 12 = clôture annuelle de N+1.

**5. AC-5, sur des référentiels réels** (le référentiel du snapshot a été basculé en base,
puis restauré) : `sfd-bceao@2.0` ⇒ `motif: PAQUET_FISCAL_ABSENT` ; `zone-franche-togo@1.0`
(barème dégressif par ancienneté, aucun taux unique) ⇒ `motif: TAUX_IS_NON_PUBLIE`. Dans les
deux cas `impot: null` sur les trois exercices, `resultatNet === resultatAvantImpot`, et la
trésorerie redevient celle d'avant la story — **jamais un impôt nul silencieux**.

**6. Le troisième chemin** (`GET /bilan/previsionnel/comparaison`) publie bien des résultats
**après impôt** (130 275 pour le scénario prudent, identique à l'endpoint annuel) et
`modeleVersion: 1.1.0`.

**7. L'export PDF réel** porte la métadonnée « Impôt sur les bénéfices : IS 27.00 %, minimum
forfaitaire 1.00 % du chiffre d'affaires — impôt dû = max des deux » et les lignes
« dont chiffre d'affaires », « Résultat avant impôt », « Impôt sur les bénéfices » (en
négatif) et « Résultat net (après impôt) ».

### Hooks inertes documentés (hors périmètre, non codés)

- **Le calendrier réel des acomptes** (acomptes assis sur l'exercice **précédent**, solde de
  régularisation l'année suivante) — cf. D-458-2.
- **Le régime d'imposition du dossier** : rien, ni dans les hypothèses ni dans le snapshot,
  ne dit qu'une entreprise relève du réel ou d'un régime libératoire. La règle appliquée est
  « le paquet publie un taux d'IS unique ⇒ droit commun », donc un paquet TPU tomberait dans
  `TAUX_IS_NON_PUBLIE` **par ses données**, pas par un `if` sur un nom de régime.
- **Le barème dégressif de la zone franche** : il faudrait l'**ancienneté depuis l'agrément**,
  qui n'est pas une donnée du prévisionnel.
- **Les exonérations de MFP** que `balance-service` sait traiter (STORY-412) : hors périmètre
  ici, et leur absence est **conservatrice** (elle ne minore jamais l'impôt annoncé).
