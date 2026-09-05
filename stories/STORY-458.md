# STORY-458 : La projection ne calcule ni ne décaisse aucun impôt — et au Togo l'impôt dû n'est pas 27 % du résultat

Status: in_progress

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

**Statut : `in_progress`** — branche `MNV-458` sur `bilan-service` (base `dev`), branche
`MNV-458` sur `docs/` (base `main`).

- [x] Arbitrages PO D-458-1 et D-458-2 tranchés et consignés **avant** la première ligne de code.
- [ ] Développement.
- [ ] Portes DoD (lint, build, couverture, unit, e2e).
- [ ] Vérification docker de la persistance / des montants réels.
- [ ] Revue de code.
- [ ] Revue de sécurité.
