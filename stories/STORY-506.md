# STORY-506 : PAR 30/90/180 et taux de recouvrement, par agence et par produit

Status: review

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
- **D-506-M (prise en cours de développement) — le dû d'une créance ABANDONNÉE n'est plus exigible** : les
  crédits passés en perte (et ceux dont l'octroi est annulé) sortent du taux d'encaissement. Les compter y
  mesurerait **deux fois** le même échec — une fois dans le taux d'encaissement, une fois dans le taux de
  récupération, qui est fait pour ça. Mesuré en vérification docker : le crédit C5 pesait 206 500 d'exigible
  échu ; l'inclure aurait fait tomber le taux publié de 46,54 % à 41,69 %.

### Périmètre

**Inclus** — une route de lecture `GET /dossiers/:dossierId/microfinance/indicateurs-portefeuille` :
PAR 30/90/180 avec leurs conventions publiées, les deux taux de D-506-B, encours total, encours en
souffrance, encours restructuré, encours sain, nombre de crédits actifs, encours moyen, cumuls de perte
et de récupération, et la **ventilation par produit** de chacun de ces indicateurs.

**Hors** — ventilation par agence (D-506-C) · ratios prudentiels opposables (STORY-510, autre chose) ·
publication d'une balance (STORY-507) · historisation/arrêté d'indicateurs persisté · cache (la dette
`CACHE_DE_LA_PROPOSITION_DE_PROVISION` reste ouverte) · tout événement Kafka.

## Critères d'acceptation

- [x] AC-1 — PAR 30, PAR 90, PAR 180 à une date d'arrêté, **avec leur convention publiée** (numérateur
      et dénominateur explicités dans la réponse). ⛔ Pas de ratio sans sa définition. → D-506-A, D-506-E,
      D-506-F, D-506-K
- [x] AC-2 — Taux de recouvrement, encours total, encours en souffrance, nombre de crédits actifs et
      encours moyen. → D-506-B, D-506-D, D-506-H, D-506-J
- [x] AC-3 — Ventilation par **agence** et par **produit de crédit**, et la somme des ventilations
      **égale** le total. Un total qui ne se recompose pas est une erreur qu'aucun contrôle ne voit.
      ⚠️ **Partiellement livré (D-506-C)** : par produit, entièrement, somme prouvée = total ; **par
      agence, non livré** — le concept n'existe dans aucun service, emplacement inerte documenté.
- [x] AC-4 — Chaque indicateur porte **sa date d'arrêté** et se **rejoue à l'identique** — corollaire
      direct d'AD-2. → D-506-I
- [x] AC-5 — ⚠️ Les crédits **restructurés** apparaissent séparément dans tous les indicateurs
      (STORY-505 AC-3) : les noyer dans « sain » est précisément ce qui rend un PAR flatteur. → D-506-D

## Progress Tracking

- **2026-09-15** — cadrage mesuré (tableau ci-dessus), décisions user D-506-A → D-506-D, décisions de
  session D-506-E → D-506-L. Statut `ready-for-dev` → `in_progress`. Branches `MNV-506` (`docs/` et
  `microfinance-service`).
- **2026-09-16** — développement, portes de qualité, table de mutations et vérification docker (ci-dessous).

### Ce qui est livré

`GET /api/v1/dossiers/:dossierId/microfinance/indicateurs-portefeuille?dateArrete=AAAA-MM-JJ` —
`TENANT_ADMIN` ou `TENANT_USER`, **non paginée** (`limite` et `apres` refusés en 400, D-506-G).

| Fichier | Rôle |
|---|---|
| `credits/indicateurs/indicateurs-portefeuille.ts` | l'agrégation **pure** : PAR par seuil, catégories, perte, encaissement, ventilation par produit ; sommes `BigInt` |
| `credits/indicateurs/indicateurs-portefeuille.service.ts` | le parcours du portefeuille page par page, la contagion appliquée à l'ensemble, les refus |
| `credits/indicateurs/indicateurs-portefeuille.mapper.ts` | la réponse et les **conventions publiées avec les chiffres** (AC-1) |
| `credits/indicateurs/dto/…` | le contrat OpenAPI |

**Réutilisations plutôt que copies** (aucune règle dupliquée) : l'exigible et l'encaissé échus sont calculés
**dans la passe d'imputation qui existait déjà** (`imputation-echeancier.ts`, +2 champs) ; le plafond de coût
du portefeuille (`exigerPortefeuilleSousLePlafondDeCout`) et la garde de devise d'un crédit
(`exigerDeviseDuCredit`) deviennent des fonctions **partagées** avec le provisionnement, qui en portait des
copies privées ; la catégorie vient de `categorieDuClassement` (STORY-505), jamais d'une seconde règle.

### Portes de qualité (HEAD `c51b83c` + correctifs de la passe de mutation)

Lint 0 warning · build OK · **2 648 unitaires** verts · **454 e2e** verts, Mongo réel compris ·
couverture globale **99,76 / 97,23 / 99,55 / 99,78** (seuils 65/90/90/90), et **100 % sur les quatre
fichiers de la story**.

### Table de mutations — ce qui prouve que les tests filtrent

Chaque règle a été **cassée volontairement**, les tests relancés, puis le code restauré. ⚠️ Une mutation qui
ne compile pas ne compte pas : elle rend « 0 test », jamais un rouge (leçon STORY-505).

| Mutation | Verdict |
|---|---|
| M1 — PAR : `>=` au lieu de `>` (le crédit à 180 jours pile entre) | **ROUGE** (1) |
| M2 — PAR : numérateur = la seule part échue au lieu de l'encours total | **ROUGE** (5) |
| M3 — PAR arrondi par défaut au lieu de par excès | **ROUGE** (5) |
| M4 — ratio publié à `0` quand le dénominateur est nul | **ROUGE** (3) |
| M5 — un crédit passé en perte reçoit une catégorie | **ROUGE** (2) |
| M6 — l'échu d'une créance abandonnée compte dans le taux d'encaissement | **ROUGE** (1) |
| M7 — encours moyen publié à `0` sans aucun crédit actif | **ROUGE** (2) |
| M8 — le plafond de coût du portefeuille n'est plus opposé | **ROUGE** (1) |
| M9 — la devise d'un crédit n'est plus confrontée à celle du dossier | **ROUGE** (1) |
| M10 — la contagion s'applique page par page, pas au portefeuille | **ROUGE** (1) |

⚡ **M9 a trouvé un test qui passait pour la mauvaise raison.** Le crédit « divergent » du test portait des
mouvements dans la devise du DOSSIER : c'est la garde « mouvements vs crédit » de STORY-501 qui levait, et le
test serait resté vert même sans jamais confronter le crédit au dossier. Le crédit divergent est désormais
cohérent avec lui-même — seule la garde visée peut le refuser.

### ✅ Vérification docker (stack neuve, `down -v` puis `up --build`) — dix points prouvés

Code servi prouvé avant tout point : `Found 0 errors`, `indicateurs/` monté dans le conteneur, et la route
publiée par l'**OpenAPI servie** (`/api/docs-json`). Tenant monté par l'API réelle : organisation et jeton
RS256 de l'IdP (`aud` contenant `microfinance-service`), dossier **MICROFINANCE** créé par `dossier-service`
et **arrivé par Kafka** dans le read-model `dossiers_dossier`, exercice 2026 ouvert. ⚠️ **Seuls le KYC et
l'entitlement ont été semés directement** dans leurs read-models (`org_kyc_status`,
`org_microfinance_entitlement`) au lieu de passer par `kyc-service` et `platform-catalog-service` : ce sont
des projections, et aucune n'est le sujet de cette story. Attendus **calculés à la main avant l'appel**.

Portefeuille semé (XOF, exposant 2), arrêté au **2026-08-31** :

| Crédit | Produit | Situation | Encours | Retard |
|---|---|---|---|---|
| C1 | CAMPAGNE | 7 échéances échues payées au centime | 500 000 | 0 j — `SAIN` |
| C2 | CAMPAGNE | jamais remboursé | 600 000 | **202 j** — `EN_SOUFFRANCE` |
| C3 | EQUIPEMENT | 1ʳᵉ échéance au 04/03 | 900 000 | **180 j pile** — `EN_SOUFFRANCE` |
| C4 | EQUIPEMENT | rééchelonné le 10/08 | 400 000 | 0 j — `RESTRUCTURE` |
| C5 | CAMPAGNE | passé en perte le 01/05 | **0** | 202 j — `PASSE_EN_PERTE` |

| Point | Verdict |
|---|---|
| **V1** encours total **2 400 000**, 5 crédits, **4 actifs**, moyen **600 000** — recomposé depuis les documents : décaissé 3 400 000 (mongosh) − 700 000 de capital imputé − 300 000 de perte | **PROUVÉ** |
| **V2** ⛔ **la borne stricte** : PAR 30 et PAR 90 = 1 500 000 (2 crédits) ; **PAR 180 = 600 000, 1 seul crédit** — C3, à 180 jours **pile**, n'y entre pas | **PROUVÉ** |
| **V3** arrondi **par excès** sur un ratio de risque : CAMPAGNE 600 000/1 100 000 = 54,5454 % ⇒ **5 455** points de base (par défaut aurait publié 5 454) | **PROUVÉ** |
| **V4** AC-5 : `SAIN` 500 000 · `RESTRUCTURE` 400 000 · `EN_SOUFFRANCE` 1 500 000 — somme **exactement** l'encours total, le restructuré jamais compté sain | **PROUVÉ** |
| **V5** AC-3 : Σ des ventilations = total pour l'encours (1 100 000 + 1 300 000), les effectifs (3 + 2) **et les trois numérateurs de PAR** | **PROUVÉ** |
| **V6** D-506-J/D-506-M : perte 300 000 sur 1 crédit ; taux d'encaissement **826 000 / 1 774 500 = 4 654 pdb**, recalculé à la main depuis les cinq échéanciers — les **206 500** d'échu de C5 en sont exclus (les inclure aurait publié 4 169) | **PROUVÉ** |
| **V7** D-506-I : **trois appels**, empreinte des 18 collections **identique** au document près, et les `revision` des 5 crédits inchangées — aucune écriture | **PROUVÉ** |
| **V8** AC-4 : un remboursement daté du **15/09** écrit après coup ⇒ la réponse au 31/08 est **identique octet pour octet** ; au 30/09 l'encours tombe à 2 310 000 et l'encaissé monte à 926 000 | **PROUVÉ** |
| **V9** refus : sans `dateArrete` **400**, date malformée **400**, **`limite` refusée en 400** (la route n'est pas paginée), sans jeton **401**, dossier d'un autre type **409 REFERENTIEL_DOSSIER_INDETERMINE** | **PROUVÉ** |
| **V10** `parAgence: null` publié avec sa raison dans les conventions, et aucune collection d'indicateurs n'existe en base | **PROUVÉ** |

⚡ **Ce que la vérification a rendu visible** — C4 portait **275 331** d'échéances échues **impayées** dans sa
version 1 ; son rééchelonnement du 10/08 les consolide, et sa version en vigueur n'a **aucune** échéance échue
au 31/08. Le taux d'encaissement, qui ne lit que la version en vigueur (D-506-B), ne les voit donc plus — les
compter en plus les aurait **comptées deux fois**, puisqu'elles sont déjà dans le capital de la version 2.
C'est exactement pourquoi `RESTRUCTURE` est publié à part (AC-5) : le ratio embellit, la catégorie le dit.

**Non productible sur la stack** : le plafond de coût (`PORTEFEUILLE_AU_DELA_DU_PLAFOND_DE_COUT`, 50 001
crédits) et `DEVISE_CREDIT_DIVERGENTE` — prouvés en unitaire, et par mutation (M8, M9). Stack arrêtée
(`docker compose stop`). Effets de bord en base de dev : organisation « IMF Verif 506 », 2 dossiers,
5 membres, 2 produits, 5 crédits.

## Notes

- Voir [[STORY-503]], [[STORY-505]], [[STORY-510]] (les ratios prudentiels, qui sont autre chose).
