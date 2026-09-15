# STORY-506 : PAR 30/90/180 et taux de recouvrement, par agence et par produit

Status: in_progress

**Complexité :** high

**Épic :** EPIC-125 — Indicateurs de portefeuille
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-503** (le classement dérivé) · **STORY-505** (catégories et passage en perte)
**Origine :** découpage `epics-microfinance-2026-08-27.md`.
**Assigné :** `vivianMoneyVibesGroupes`

---

## Le fait

Le **portefeuille à risque** est le chiffre qu'un directeur d'IMF regarde tous les lundis, et celui
qu'un bailleur demande avant tout le reste. Sans lui, le produit est un livre de comptes, pas un
outil de pilotage — et c'est l'écart entre « nous tenons votre comptabilité » et « nous vous aidons
à piloter ».

⚠️ **La définition du PAR n'est pas universelle.** PAR 30 = encours des crédits ayant au moins une
échéance impayée depuis plus de 30 jours, **rapporté à l'encours total** — mais le numérateur
prend-il **tout** l'encours du crédit en retard, ou seulement la part échue ? Les deux conventions
existent, elles donnent des chiffres très différents, et un ratio dont la convention n'est pas
publiée n'est comparable à rien.

## Cadrage mesuré avant de coder (2026-09-15)

| Affirmation | Verdict | Mesure |
|---|---|---|
| L'agence existe quelque part dans le produit | **FAUX** | `grep -rni agence src` sur `microfinance-service` : 12 fichiers, **aucun champ**, que des emplacements inertes. `AGENCE_DU_CREDIT` (D-501-A) et `RATTACHEMENT_AGENCE_MEMBRE` (D-499-A) **nomment déjà STORY-506** comme la victime d'un code libre : « une faute de frappe y créerait une agence fantôme, avec une somme exacte sur une clé fausse » |
| L'encours d'un crédit est dérivable à une date d'arrêté | **VRAI** | `situationALaDate` : `encours = décaissé − capital imputé − passé en perte`, fonction pure, sommes `BigInt` |
| La catégorie sain / restructuré / en souffrance est publiée | **VRAI** | STORY-505, `CategorieClassementCredit` — présente SSI le statut vaut `CLASSE` |
| Un crédit passé en perte pèse encore dans l'encours | **FAUX — et c'est le piège du PAR** | D-505-K : l'encours tombe à **0** dès le passage. Passer en perte fait donc **baisser le PAR** sans qu'un franc soit recouvré ⇒ D-506-J |
| Le produit d'un crédit est une clé d'agrégation sûre | **VRAI** | `credits.produitId` obligatoire, validé à l'octroi contre `produits_credit` du **même dossier** (D-501-B) ; le produit est **immuable** — changer son code réécrirait rétroactivement le portefeuille, le schéma le refuse |
| Un parcours de TOUT le portefeuille existe déjà | **VRAI** | `ProvisionnementService.lignes()` : boucle page par page sur `lotDuPortefeuille` (3 lectures/page), bornée par `compterLePortefeuille` + `PLAFOND_DE_COUT_CREDITS_PAR_ARRETE` (D-504-N) |
| Le taux d'encaissement se somme sur TOUTES les versions d'échéancier | **FAUX** | une nouvelle version reprend `capitalRestantDu` + `interetsAReporter` de la précédente (`baseDUneNouvelleVersion`, D-502-M) : sommer les versions remplacées **compte deux fois** le reporté. Le ratio ne vaut que sur la version **en vigueur** — donc « depuis la dernière consolidation », et ça se publie (D-506-B) |
| Le payé d'une échéance peut dépasser son dû | **FAUX** | `imputation-echeancier.ts` : l'imputation s'arrête à `restant === 0n` par ligne — le taux d'encaissement d'un crédit est borné par 1 |
| Le projet sait publier un ratio | **FAUX** | `DecimalExact` (D-504-E) est construit **sans division** : « aucune division : le résultat reste un décimal EXACT ». Un ratio en est une ⇒ D-506-K |

### Décisions du 2026-09-15 (user)

- **D-506-A — PAR : le numérateur est l'encours TOTAL des crédits en retard.** Convention CGAP/BCEAO :
  dès qu'une échéance dépasse le seuil, **tout** l'encours restant dû du crédit entre au numérateur ;
  le dénominateur est l'encours total du portefeuille à l'arrêté. ⛔ La convention est **publiée dans
  la réponse**, jamais implicite : numérateur, dénominateur et comparaison.
- **D-506-B — deux taux de recouvrement, nommés distinctement.** ① **taux d'encaissement des échéances
  échues** = payé / dû sur les échéances **échues de la version en vigueur** — donc *depuis la dernière
  consolidation*, la seule somme qui ne compte pas deux fois le reporté ; ② **taux de récupération après
  perte** = recouvré après perte / montant passé en perte. Les deux ne coûtent aucune lecture de plus, et
  ② est le contrepoids de ce que ① et le PAR ne voient pas.
- **D-506-C — l'agence reste un emplacement inerte.** La ventilation par **produit** est livrée
  entièrement ; l'agence est documentée dans `emplacements-non-livres.ts`, propriétaire `reseau-service`.
  ⛔ **AC-3 est donc partiellement livré, et la story le dit** : aucune clé inventée n'entre dans un
  indicateur de pilotage.
- **D-506-D — « encours en souffrance » = la catégorie dérivée `EN_SOUFFRANCE`** (D-505-C / D-505-E) : au
  moins une échéance échue impayée — **celle du jour comprise, à 0 jour de retard** — ou la contagion du
  débiteur. C'est la catégorie sur laquelle le module **provisionne** déjà : deux définitions auraient
  fait diverger l'indicateur de pilotage et l'arrêté réglementaire.

### Décisions de cadrage prises en session (2026-09-15) — à relire en revue

- **D-506-E — les seuils du PAR sont des JOURS, et la comparaison est STRICTE** (`joursRetard > 30`).
  ⛔ **Aucune conversion mois → jours** : STORY-659 a mesuré que « 1 mois = 30 jours », annoncé prudent,
  sous-provisionnait (3 mois civils = 89 jours minimum). Le PAR se définit en jours par la profession ;
  seuils et sens de comparaison sont publiés dans la réponse.
- **D-506-F — le PAR lit le retard PROPRE du crédit, jamais la contagion.** La contagion du débiteur
  (D-505-G) déplace la tranche prudentielle et la catégorie, **pas l'âge de l'impayé** : un PAR qui
  bougerait avec elle ne serait plus un âge d'impayé. ⚠️ Conséquence assumée et documentée : l'encours
  « en souffrance » (D-506-D, contagion comprise) **peut dépasser** l'encours du PAR 30 — les deux
  lentilles sont publiées avec leur définition.
- **D-506-G — un indicateur porte sur TOUT le portefeuille, en une seule réponse**, bornée par le plafond
  de coût existant (`PLAFOND_DE_COUT_CREDITS_PAR_ARRETE`, D-504-N) ⇒ `409
  PORTEFEUILLE_AU_DELA_DU_PLAFOND_DE_COUT` avant tout calcul. Une ventilation **paginée** ne pourrait pas
  prouver AC-3 : la somme des pages n'est pas le total.
- **D-506-H — crédit ACTIF = encours > 0 à l'arrêté.** Encours moyen = encours total / nombre d'actifs,
  **absent** quand aucun crédit n'est actif — jamais `0`, qui se lirait « encours moyen nul ».
- **D-506-I — aucun état persisté, aucune écriture, aucun événement.** Lecture pure, comme le classement :
  un indicateur passé se rejoue à l'identique (AC-4), quelles que soient les écritures postérieures.
- **D-506-J — les montants cumulés passés en perte et recouvrés après perte sont publiés à côté du PAR.**
  Sans eux, D-505-K rend le PAR **flatteur par construction** : la seule façon de faire baisser un PAR
  sans encaisser un franc est d'abandonner la créance.
- **D-506-K — un ratio se publie en POINTS DE BASE ENTIERS, avec son numérateur et son dénominateur**, et
  son sens d'arrondi : **par excès** pour un ratio de risque (PAR — ne jamais sous-dire le risque), **par
  défaut** pour un ratio de performance (encaissement, récupération — ne jamais sur-dire la performance).
  ⛔ Dénominateur nul ⇒ le ratio est **absent**, jamais `0` : un PAR de 0 % sur un portefeuille vide se
  lirait « portefeuille sain ».
- **D-506-L — les sommes du portefeuille sont en `BigInt`**, publiées en entiers sûrs ou refusées
  (`409 INDICATEURS_HORS_BORNE`), comme `PROVISIONNEMENT_HORS_BORNE` (D-504) : jamais un arrondi silencieux.

### Périmètre

**Inclus** — une route de lecture `GET /dossiers/:dossierId/microfinance/indicateurs-portefeuille` :
PAR 30/90/180 avec leurs conventions publiées, les deux taux de D-506-B, encours total, encours en
souffrance, encours restructuré, encours sain, nombre de crédits actifs, encours moyen, cumuls de perte
et de récupération, et la **ventilation par produit** de chacun de ces indicateurs.

**Hors** — ventilation par agence (D-506-C) · ratios prudentiels opposables (STORY-510, autre chose) ·
publication d'une balance (STORY-507) · historisation/arrêté d'indicateurs persisté · cache (la dette
`CACHE_DE_LA_PROPOSITION_DE_PROVISION` reste ouverte) · tout événement Kafka.

## Critères d'acceptation

- [ ] AC-1 — PAR 30, PAR 90, PAR 180 à une date d'arrêté, **avec leur convention publiée** (numérateur
      et dénominateur explicités dans la réponse). ⛔ Pas de ratio sans sa définition. → D-506-A, D-506-E,
      D-506-F, D-506-K
- [ ] AC-2 — Taux de recouvrement, encours total, encours en souffrance, nombre de crédits actifs et
      encours moyen. → D-506-B, D-506-D, D-506-H, D-506-J
- [ ] AC-3 — Ventilation par **agence** et par **produit de crédit**, et la somme des ventilations
      **égale** le total. Un total qui ne se recompose pas est une erreur qu'aucun contrôle ne voit.
      ⚠️ **Partiellement livré (D-506-C)** : par produit, entièrement, somme prouvée = total ; **par
      agence, non livré** — le concept n'existe dans aucun service, emplacement inerte documenté.
- [ ] AC-4 — Chaque indicateur porte **sa date d'arrêté** et se **rejoue à l'identique** — corollaire
      direct d'AD-2. → D-506-I
- [ ] AC-5 — ⚠️ Les crédits **restructurés** apparaissent séparément dans tous les indicateurs
      (STORY-505 AC-3) : les noyer dans « sain » est précisément ce qui rend un PAR flatteur. → D-506-D

## Progress Tracking

- **2026-09-15** — cadrage mesuré (tableau ci-dessus), décisions user D-506-A → D-506-D, décisions de
  session D-506-E → D-506-L. Statut `ready-for-dev` → `in_progress`. Branches `MNV-506` (`docs/` et
  `microfinance-service`).

## Notes

- Voir [[STORY-503]], [[STORY-505]], [[STORY-510]] (les ratios prudentiels, qui sont autre chose).
