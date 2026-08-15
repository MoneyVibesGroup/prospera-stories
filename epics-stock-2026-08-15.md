---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/prds/prd-stock-2026-08-02/prd.md
  - prospera-stories/prds/prd-stock-2026-08-02/.memlog.md
  - prospera-stories/architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.6 — AD-P13, AD-P14, AD-P15, AD-P16)
  - prospera-stories/architecture/architecture-catalogue-produits-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-2, AD-4, AD-9, AD-10)
  - prospera-stories/architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-5, AD-6, AD-12)
  - prospera-stories/sprint-status.yaml (reserved_ranges, relevé le 2026-08-15)
  - balance-service/src/modules/balance/types/balance-canonique.ts (SOURCES_BALANCE, fermée à trois)
  - balance-service/src/modules/referentiel/assets/syscohada-revise-2.1.json (compte 38)
  - bilan-service/src/modules/bilan/jeu-etats/dto/creer-jeu-etats.dto.ts (l'entrée réelle du bilan)
  - auth-service/src/common/rbac/permission.enum.ts (le catalogue de permissions réel)
---

# Stock (`stock-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD **Stock** et de la colonne vertébrale (AD-1 → AD-18) en épics implémentables.
Périmètre **backend** ; le frontend suit sa série `DI-*` dans son tracker propre.

**Série retenue : épics EPIC-075 → EPIC-084.** Dernier épic attribué au 2026-08-15 : **EPIC-074**
(`catalogue-produits-service`). Les plages **EPIC-044→053** (`reseau-service`), **EPIC-054→064**
(`notification-service`) et **EPIC-065→074** (`catalogue-produits-service`) sont **RÉSERVÉES** —
vérifié dans `reserved_ranges` de `sprint-status.yaml`. La plage y est inscrite au nom de ce module
**le jour où elle est prise**.

**Aucun `story_id` n'est réservé ici** — attribution au slotting, comme la règle l'exige.

> ⚡ **Ce que ce module livre a changé de nature à l'architecture.** Le PRD promettait de « publier une
> valeur de stock » au `bilan-service`. Vérification faite, `bilan-service` n'ingère que des **soldes
> de comptes** — il n'a aucune notion de valeur de stock. Ce module publie donc une **balance**, à
> `balance-service`, comme **quatrième adaptateur** du hub multi-source (AD-7). Le §4.2 du PRD survit
> intact : *une balance n'est pas un journal*.

---

## ⚠️ 148 pts, le PRD en annonçait ~97. Les 51 d'écart sont sourcés.

| Source | Pts |
| --- | ---: |
| Incréments du PRD (1 + 2 + 3) | ~97 |
| **+ Socle, entitlement, gate et cloisonnement par dossier** (EPIC-075) | **+13** |
| **+ Adaptateur #4 : publier une balance, pas une valeur** (EPIC-081) | **+18** |
| **+ Read-model d'exercice et méthode figée par `(dossierId, exerciceId)`** (EPIC-080) | **+8** |
| **+ Portée réseau et DEUX suites de conformité** (EPIC-084) | **+11** |
| **+ Route de lecture plateforme** (EPIC-084) | **+3** |
| **+ Échelle de validation par rôle** (EPIC-082) | **+3** |
| **− Emplacements et contraintes reportés** *(Q4, tranchée)* | **−5** |
| **Total** | **148** |

1. **Le socle n'était pas compté** — troisième fois d'affilée, après `reseau-service` et
   `catalogue-produits-service`. Le PRD ne mentionne ni entitlement, ni gate, ni dossier.
2. ⚡ **Le +18 le plus important n'est pas une charge en plus, c'est un livrable différent.** « Publier
   une valeur » et « soumettre une balance canonique » ne sont pas la même chose : contrat
   `balance.submitted`, rejouabilité prouvée, `checksum`, versions successives, cas de réouverture
   d'exercice, et une **story hors service** pour ouvrir l'énumération des sources.
3. **L'exercice n'appartient pas à ce module.** Depuis `AD-P14` il appartient au dossier : il faut le
   read-model `exercices_dossier` que `balance-service` et `bilan-service` tiennent déjà, et le cas de
   la **réouverture**, que le PRD ne traitait pas.
4. **La portée n'était nulle part au PRD**, qui ne connaissait que le cloisonnement par organisation.
   S'y ajoute le fait que **Stock est le premier service à exécuter deux suites de conformité
   externes** et à figurer dans deux registres.

---

## ⛔ Quatre stories HORS de ce service — deux nouvelles, deux héritées

| # | Où | Quoi | Bloque | Nouvelle ? |
| --- | --- | --- | --- | :--: |
| **1** | `balance-service` | ⚡ **Ouvrir `SOURCES_BALANCE` à une quatrième valeur `stock`** et accepter l'adaptateur #4. L'énumération est **fermée à `['sage','direct','ocr']` dans un service livré et en production** | ⛔ **EPIC-081** | ✅ **oui** |
| **2** | `auth-service` | **Étendre le RBAC au périmètre tenant** (AD-P15). `permission.enum.ts` est intégralement plateforme ⇒ `perms: []` pour tout tenant | ⛔ **EPIC-082** (échelle de validation) et le volet droits d'**EPIC-084** | ❌ **déjà ouverte** |
| **3** | `platform-catalog-service` | **Enregistrer les six modules du pack distributeur** au catalogue. `stock` y figure comme code de pack mais n'existe comme `Module` nulle part ⇒ provisioning à **422 depuis le 2026-08-11** | ⛔ **EPIC-075** | ❌ **déjà ouverte** |
| **4** | `platform-catalog-service` + `frontend-admin-panel` | Renommage `catalogue` → `catalogue-produits` | — *(n'affecte pas ce module, mais partage sa livraison avec la n°3)* | ❌ **déjà ouverte** |

⚡ **La n°2 bloque maintenant TROIS modules** — `reseau` (`FR-R28b`), `catalogue-produits` (`FR-C48`)
et `stock` (`FR-S61`/`FR-S62`). Elle est nommée depuis trois spines et **n'existe toujours pas comme
story**. Sa charge n'a pas bougé ; le nombre de choses qui l'attendent, si.

⚠️ **La n°1 est d'une autre nature que les trois autres.** Elle touche un service **en production qui
porte la balance canonique de tous les clients existants** — cabinets expert-comptable compris. Ce
n'est pas une extension de seed, c'est une modification du contrat d'ingestion. Story dédiée, jamais
en effet de bord d'un module distributeur.

---

## Blocs d'ordonnancement — **pas** des sprints

Capacité de référence : **34**. Aucun sprint attribué — l'ordonnancement est une décision PO.

| Bloc | Épics | Pts | vs 34 |
| --- | --- | ---: | --- |
| **1 — Le socle et le lieu** | EPIC-075, EPIC-076 | **23** | ✅ −11 |
| **2 — Le stock s'explique** | EPIC-077, EPIC-078 | **34** | ✅ pile |
| **3 — Le stock vaut quelque chose** | EPIC-079, EPIC-080, EPIC-081 | **47** | ⚠️ +13 |
| **4 — Le stock se compte, se déplace et parle** | EPIC-082, EPIC-083, EPIC-084 | **44** | ⚠️ +10 |

### Contraintes d'ordre à ne pas défaire au slotting

- ⛔ **EPIC-078 précède EPIC-080.** `NFR-3` (valorisation rejouable) est une lecture du même journal
  que `NFR-1` (stock rejouable). **`SM-2` ne peut pas valoir `0` si `SM-1` ne vaut pas `0`** : publier
  une valeur avant d'avoir prouvé le rejeu, c'est publier un chiffre qu'on ne sait pas reconstruire.
- ⛔ **EPIC-079 précède EPIC-080.** `FR-S24c` **refuse** une méthode par lot sur un article dont le
  suivi par lot n'est pas activé. Ce refus n'est **testable** que si le lot existe.
- ⛔ **EPIC-080 précède EPIC-081.** On ne publie pas une valeur dont la méthode n'est pas figée par
  exercice — sinon la variation de stock devient incomparable d'une publication à l'autre (`R6`).
- ⚡ **EPIC-081 porte le compte `38` dès sa PREMIÈRE version, alors qu'aucun transfert n'existe
  encore** (EPIC-083 vient après). C'est délibéré : si le périmètre de transit entrait dans le contrat
  de publication *après* les transferts, la première clôture postérieure à EPIC-083 serait **fausse et
  crédible** — un actif amputé de ce qui est sur la route, sans que rien ne le signale.

### ⚠️ L'épic le plus risqué : EPIC-078

Son erreur **ne se voit pas en test fonctionnel**. Un point d'arrêt qui devient une seconde source de
vérité rend des chiffres **justes la plupart du temps** : le solde courant reste bon, seul le stock à
une date passée diverge — et il n'est consulté qu'à la clôture, c'est-à-dire au pire moment. Tout ce
qui suit repose dessus : la valorisation (EPIC-080), la publication comptable (EPIC-081), les écarts
d'inventaire (EPIC-082) et le capital dormant (EPIC-084) lisent **le même journal**.

⇒ Sa DoD porte un **test de mutation** : purger tous les points d'arrêt ne doit changer **aucun**
résultat, seulement le temps de réponse.

---

## Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-S64 · **NFR-6** · AD-6, AD-17 · invariants hérités | **EPIC-075** — socle, entitlement, gate, **cloisonnement par dossier** |
| FR-S01, FR-S04, FR-S05, FR-S05b, FR-S05c, FR-S59 · **NFR-5** · R3 · AD-11 | **EPIC-076** — entrepôts, magasins propres, la propriété décide |
| FR-S06 → FR-S09, FR-S08b, FR-S08c, FR-S12 → FR-S15 · **NFR-2** · SM-3, SM-6 · AD-2, AD-3, AD-4, AD-14 | **EPIC-077** — mouvements append-only, idempotence, quantité toujours unitée |
| FR-S10, FR-S11 · **NFR-1**, NFR-7 · SM-1 · R1 · AD-1 | **EPIC-078** — dérivation, stock à une date, points d'arrêt |
| FR-S17 → FR-S22 · R4 · AD-10 *(lots)* | **EPIC-079** — lots, dates limites, règle d'écoulement, couverture excessive |
| FR-S23 → FR-S27, FR-S29 · **NFR-3** · R6 · AD-5, AD-10 | **EPIC-080** — valorisation figée par exercice, read-model d'exercice, pertes ventilées |
| FR-S28, FR-S30 → FR-S34 · **NFR-4** · SM-2, SM-7 · R2 · AD-7, AD-8, AD-9 *(compte 38)* | **EPIC-081** — **adaptateur #4 : la balance de stock** |
| FR-S16, FR-S47 → FR-S51, FR-S65 · CM-1 · AD-16 | **EPIC-082** — inventaire, écarts, **échelle de validation par rôle**, journal d'audit |
| FR-S35 → FR-S39, FR-S52 → FR-S55 · SM-6 · AD-9 *(transit)*, AD-15 *(seuils)* | **EPIC-083** — seuils, couverture, ruptures, transferts et transit |
| FR-S40 → FR-S46, FR-S56 → FR-S58, FR-S60 → FR-S63 · SM-4 · CM-2, CM-3 · R5 · AD-4, AD-12, AD-13, AD-15, AD-18 | **EPIC-084** — capital dormant, réseau détaillant, portée, conformité, plateforme |
| FR-S02, FR-S03 | ⏸ **DIFFÉRÉS** — Q4 tranchée : module Opérations entrepôt (#12) |

**Couverture : 69 identifiants d'exigence sur 71** (FR-S01 → FR-S65 plus six *bis*), **2 explicitement
différés**, **7 NFR sur 7**, **18 AD sur 18**.

---

## EPIC-075 : Socle, entitlement, gate et cloisonnement par dossier · 13 pts

**Autonome :** ⛔ **non** — bloqué par la story hors service **n°3**.

- Scaffold : base propre, configuration, santé, **démarrage dégradé** si le bus n'est pas là.
- Gate **`@RequiresStockAccess`** = `emailVerified` + KYC `APPROVED` + entitlement `ACTIVE`, lu dans
  les read-models locaux. Code de module : **`stock`**.
- Read-models entrants (`identity.*`, `kyc.status.changed`, `entitlement.changed`) — patron **à
  copier** de `bilan-service` / `balance-service`, pas à concevoir.
- ⚡ **Cloisonnement à DEUX clés** (AD-6) : `orgId` vient du **jeton signé**, `dossierId` vient de
  **l'URL** et est vérifié contre la portée serveur à chaque appel. ⛔ **Ne jamais inférer le dossier
  du jeton.**
- ⛔ Un dossier hors portée rend **`404`, jamais `403`** — le service refuse de révéler son existence.
- Outbox transactionnelle + **deux** énumérations séparées, `StockTopic` et `StockValorisationTopic`.
- Convention posée dès le premier commit : `PorteeReseau` / `PorteeDossier`, ⛔ **jamais `portee` nu**.

## EPIC-076 : Entrepôts, magasins propres — la propriété décide · 10 pts

**Autonome :** oui. **Amont :** EPIC-075.

- Entrepôt : nom, type, localisation, **pays**, **devise**, responsable, **capacité** dans l'unité qui
  a du sens pour l'organisation, et les **zones desservies** — **références opaques** tant que
  `reseau-service` n'existe pas (`A1`, et AD-12 réseau le confirme).
- ⚡ **Deux natures, deux régimes** : entrepôt et **magasin propre**, tous deux détenus par
  l'organisation, tous deux valorisés et suivis par **mouvements réels**.
- ⚡ **La vente au détail est une CAPACITÉ, pas une nature** : un magasin ne fait pas d'éclatement, un
  entrepôt **peut** vendre directement. Le modèle porte une nature **et un jeu de capacités**.
- ⛔ **L'exclusion du stock partenaire est structurelle**, pas un filtre : le stock d'un détaillant
  partenaire n'entre dans aucune valorisation, aucune publication, aucun total de point de stock. Un
  filtre oublié produirait un actif **faux et crédible** (`R3`).
- Fermeture sans suppression ; ⛔ **refusée tant que l'entrepôt détient du stock**, avec le détail de
  ce qui l'empêche.

## EPIC-077 : Mouvements append-only, idempotence, quantité toujours unitée · 21 pts

**Autonome :** oui. **Amont :** EPIC-076.

> C'est le cœur du module. Tout ce qui suit lit ce journal.

- Mouvement : article, entrepôt, lot le cas échéant, quantité **en unité de base**, **le facteur de
  conversion utilisé**, valeur unitaire, auteur, horodatage, pièce d'origine.
- ⛔ **Append-only** : aucune mutation, aucune suppression. On **contre-passe**, et le correctif
  référence ce qu'il annule.
- **Motif dans un vocabulaire fermé et typé par nature** — réception, retour client · livraison, perte,
  casse, péremption · transfert · ajustement. ⚠️ Un motif en texte libre rendrait `FR-S30` (pertes
  **ventilées par nature**) inapplicable **au moment de la clôture**, c'est-à-dire trop tard.
- ⚡ **Idempotence définie ICI** (AD-3) : `FR-S15` disait « à la source » et **aucune source n'existe**
  — Commande est en position 11. Clé exigée sur toute écriture, **contrainte par un index unique**, et
  la seconde occurrence **rend le premier résultat** — jamais un doublon, jamais une erreur qui
  pousserait à réessayer.
- ⛔ **Clé d'idempotence ≠ pièce d'origine.** Les confondre interdirait la réception légitime de deux
  lots sur un même bon.
- ⛔ **Aucun nombre nu** : toute quantité est `{ valeur, unite }`, persistée **en unité de base**
  (`NFR-2`). L'affichage convertit, le stockage jamais.
- ⚡ **Le mouvement STOCKE son facteur de conversion**, il ne le référence pas — obligation qu'`AD-4`
  du catalogue impose à ses consommateurs. **Condition observable :** après passage du carton de 20 à
  24, un mouvement antérieur restitue toujours ses quantités d'origine.
- Stock **physique / réservé / disponible**, avec **`réservé = 0` au v1** — et ⚠️ **l'API le DIT** :
  « aucune source de réservation branchée », pas « rien n'est réservé ». Le champ se remplira **sans
  changement de contrat** quand Commande arrivera.
- Stock négatif **refusé par défaut**, autorisable explicitement, et alors **toujours signalé**.

## EPIC-078 : La dérivation — solde, stock à une date, points d'arrêt · 13 pts

**Autonome :** oui. **Amont :** EPIC-077. ⚠️ **L'épic le plus risqué du module.**

- ⛔ **Aucun chemin d'écriture directe sur une quantité n'existe dans le service.** Pas de `$set`, pas
  de variante d'administration, pas d'exception de reprise. Une correction est un **mouvement**.
- Solde courant, et **stock restituable à une date passée** — *« combien en avais-je le 31 décembre ? »*
  est la question de la clôture, et elle doit avoir une réponse.
- **Points d'arrêt périodiques** pour tenir `NFR-7` (`P95 < 5 s`), ⛔ **dérivés et jamais une seconde
  source de vérité**.
- ⚡ **DoD — test de mutation :** purger **tous** les points d'arrêt ne change **aucun** résultat,
  seulement le temps de réponse. Sans ce test, la règle centrale de l'épic n'est pas tenue.
- **Condition observable de `NFR-1`, exécutée en continu** : recalculer depuis la totalité des
  mouvements redonne **exactement** la valeur courante. Un écart est une **alerte d'intégrité**, pas un
  avertissement (`SM-1 = 0`).

## EPIC-079 : Lots, dates limites et règle d'écoulement · 13 pts

**Autonome :** oui. **Amont :** EPIC-077.

- **Suivi par lot activable article par article** — c'est le client qui décide (`R4`). ⚡ **La logique
  est construite pour tous ; elle ne s'impose à personne.**
- Lot : identifiant, date d'entrée, **date limite**, origine. Un article suivi par lot l'est **dans
  tous les entrepôts** (`A4`).
- **Règle d'écoulement** configurable, par défaut **la date limite la plus proche d'abord**.
  ⚠️ **Non modifiable en cours d'exercice** (`Q2`, tranchée — même raison que `FR-S25`).
- **Répartition par échéance** : combien périme dans 30, 60, 90 jours.
- ⛔ **Un lot dont la date limite est dépassée sort du disponible automatiquement** et devient une
  perte constatée à traiter — **jamais un stock fantôme qu'on croit vendable**.
- ⚡ **Alerte de couverture excessive** (`FR-S22`) : quand la couverture dépasse le temps restant avant
  la date limite, l'écart est signalé **avant** la péremption. C'est le troisième cas de stock mort,
  pris à temps — *le lot périme en chambre froide, pas en rayon*.

## EPIC-080 : Valorisation figée par exercice · 16 pts

**Autonome :** ⛔ **non** — dépend du read-model `dossier.exercice.*`. **Amont :** EPIC-078, EPIC-079.

- ⚡ **Read-model `exercices_dossier`** alimenté par `dossier.exercice.ouvert|clos|rouvert`, **exactement
  celui que `balance-service` et `bilan-service` tiennent déjà**. ⛔ Ce service **ne crée, ne clôt et ne
  rouvre aucun exercice** — un troisième cycle de vie répéterait littéralement la panne que STORY-355 a
  réparée.
- ⚠️ **Piège déjà documenté ailleurs, à ne pas reproduire** : la projection décide **d'après le champ
  `statut`**, jamais d'après le nom du topic. Oublier `rouvert` figerait ce read-model sur `CLOS`.
- **CUMP par défaut**, **FIFO** au minimum en alternative, **méthode clé par `(dossierId, exerciceId)`
  et figée** dès la première publication. Le changement est **refusé**, pas averti.
- ⚡ **Lot × méthode :** sous CUMP le coût du lot est **informatif** (traçabilité, négociation
  fournisseur) ; sous une méthode par lot il **devient** la valeur comptable. **La méthode de
  l'exercice fait toujours foi.**
- ⛔ **Refus structurel** : méthode par lot sur un article sans suivi par lot (`FR-S24c`), par code
  machine stable. L'accepter produirait une valeur **silencieusement fausse** — plausible, donc pire.
- **La devise de l'entrepôt est la devise de valorisation, et elle ne se convertit pas.** ⛔ Une entrée
  libellée dans une autre devise est **refusée**, jamais convertie à un taux que personne n'a décidé.
- **Entier d'unité mineure** partout ⚠️ **le XOF n'a aucune décimale**.
- **Pertes valorisées et restituées séparément, par nature** — ce sont elles qui donnent le coût réel
  du stock mort.

## EPIC-081 : Adaptateur #4 — la balance de stock · 18 pts

**Autonome :** ⛔ **non** — bloqué par la story hors service **n°1**. **Amont :** EPIC-080.

> ⚡ **C'est ici que le livrable a changé de nature.** Le module ne publie pas « une valeur » : il
> **soumet une balance** au hub multi-source, comme Sage, la saisie directe et l'OCR.

- Publication par **`balance.submitted`**, avec l'enveloppe et le contrat de l'adaptateur #1. Le hub
  journalise **les deux issues**, acceptée et rejetée (`NFR-A07`).
- ⚡ **Le service transmet une CATÉGORIE et un LIBELLÉ, jamais un numéro de compte** (AD-8). Le
  rattachement classe 3 appartient à `balance-service`, où `RattachementService`, les surcharges par
  organisation et la suggestion selon le **référentiel actif** sont **déjà livrés**. ⛔ Aucun plan
  comptable ne vit ici — c'est ce qui rend le module indépendant de SYSCOHADA, SFD-BCEAO et CIMA.
- ⚡ **Seule exception, nommée : le compte `38`** — *« Stocks en cours de route, en consignation ou en
  dépôt »*, présent dans les trois référentiels livrés. **Le transit n'appartient ni à l'origine ni à
  la destination** (`Q3`, tranchée). ⚠️ **Le périmètre de transit entre dans le contrat dès cette
  version**, avant que les transferts n'existent — voir la contrainte d'ordre.
- Publication de la **valeur**, de la **variation de la période** et des **pertes ventilées par
  nature**, **par entrepôt, par catégorie et à une date donnée**.
- **`NFR-3` — rejouable** : recalculer depuis les mouvements et la méthode redonne **exactement** la
  valeur publiée (`SM-2 = 0 écart`). La publication porte de quoi être auditée : méthode, date
  d'arrêté, périmètre d'entrepôts, **`checksum`**, et le moyen de **descendre au mouvement**.
- ⚡ **Réouverture d'exercice** (absente du PRD) : elle ne réécrit **rien**. Elle autorise une
  **nouvelle publication versionnée** ; la précédente reste, le hub les distingue par `version`.
- ⚠️ **Une balance rejetée ne consomme pas la clé** `(orgId, exercice, source, version)` (`D-102-2`).
  Le service distingue *rejeté* de *à corriger*, et ⛔ **ne réutilise jamais un numéro de version pour
  réparer un rejet**.
- **`NFR-4` — couplage à sens unique** : le module fonctionne **intégralement** sans `balance-service`.
  `FR-S32` (consultation et export pour ressaisie) est le **chemin nominal en son absence**, pas un
  mode dégradé. ⛔ Aucune fonction ne prend le hub pour condition.

## EPIC-082 : Inventaire, écarts et échelle de validation · 13 pts

**Autonome :** ⛔ **non** — l'échelle dépend de la story hors service **n°2**. **Amont :** EPIC-078.

- **Classification ABC** par valeur de rotation, pour cadencer les comptages.
- **Inventaire tournant** : génération de tâches de comptage, **sans arrêter l'activité**.
  **Inventaire complet** possible, avec **gel des mouvements** sur le périmètre compté.
- ⛔ **Un comptage produit un ÉCART, jamais une écriture directe du stock.** L'écart devient un
  ajustement **après validation** — c'est le seul chemin par lequel une correction entre.
- Écarts restitués **en quantité ET en valeur**, par entrepôt, par article et **par compteur**.
- ⚡ **Échelle de validation par rôle** *(arbitrage PO — le PRD l'avait aplatie en seuil unique)* :
  plafonds paramétrables par organisation, sur le modèle `PLAFONDS_VALIDATION` du prototype
  (`RESP_STOCK` / `DAF` / `DG` illimité) et un `valideurPourMontant`. **Un écart de 30 M ne se valide
  pas au même niveau qu'un écart de 2 M.** L'échelle est structurelle ; les plafonds sont des données.
- **Journal d'audit append-only** sur mouvements, ajustements, changements de méthode et fermetures
  d'entrepôt, **protégé par le serveur** — jamais par l'absence de route.
- ⚡ **`CM-1` calculée par le service** : le **taux d'ajustement manuel** est surveillé et publié.
  *Un module de stock qu'on corrige tous les jours est un module qu'on a cessé d'alimenter.* C'est le
  seul garde-fou contre `R1`, et il ne peut pas vivre dans un tableur.

## EPIC-083 : Seuils, ruptures, transferts et transit · 13 pts

**Autonome :** oui. **Amont :** EPIC-078, EPIC-081 *(le compte 38 doit exister avant le transit)*.

- **Seuil ET couverture minimale** par entrepôt — *un seuil fixe ne vaut rien sur un produit dont la
  demande double en saison*.
- **Couverture** calculée sur le rythme de sortie observé, période d'observation **explicite** (défaut
  30 jours), paramétrable par article ou par catégorie.
- **Alerte de rupture**, actuelle ou prévue à l'horizon du délai de réapprovisionnement. **`SM-6` : 0
  rupture non précédée d'une alerte.**
- **Transfert en deux temps** : sortie de l'origine, **état de transit**, entrée à la destination.
  ⚡ *La marchandise sur la route n'est ni ici ni là-bas — elle est en transit, et elle a une valeur*,
  portée par le compte `38`.
- ⛔ **Réception partielle = constat d'écart, jamais une perte automatique.** La perte est une décision
  humaine, prise sur un ajustement motivé (EPIC-082).
- **Le transfert conserve les lots** et leurs dates limites — un lot qui perdrait son échéance en
  changeant d'entrepôt réapparaîtrait comme vendable.
- **Suggestion de transfert** quand un entrepôt est en rupture et un autre en surstock sur le même
  article. ⚡ **Il suggère ; l'humain arbitre.**
- ⛔ **Un transfert entre DOSSIERS n'est pas un transfert** — c'est une vente entre entités juridiques,
  et elle est **différée** (AD-6).

## EPIC-084 : Capital dormant, réseau détaillant, portée, conformité et plateforme · 18 pts

**Autonome :** ⛔ **non** — la portée dépend de `reseau-service`, les droits de la story hors service
**n°2**. **Amont :** EPIC-078, EPIC-083.

> L'épic qui porte **la thèse du module** : *le stock qui dort ne crie pas.*

- **Les quatre détections**, chacune avec sa source :

  | Cas | Détection | Source |
  | --- | --- | --- |
  | Achat d'opportunité | Couverture ≫ rotation utile | Interne |
  | Dormant | Aucune sortie depuis *N* jours (défaut 90) | Interne |
  | Invendu de campagne | Fin de vie commerciale approchée ou dépassée | ⚡ Catalogue `FR-C36` |
  | Saisonnier bloqué | Détenu hors de ses mois de vente | ⚡ Catalogue `FR-C35` |

- ⚡ **Un profil absent n'est PAS un profil neutre** (AD-10 catalogue). Un article sans saisonnalité
  déclarée est restitué comme **non qualifiable** — sans quoi le module affirmerait qu'il n'y a pas de
  saisonnier bloqué alors qu'il ne peut pas le savoir.
- ⛔ **Chaque détection porte son coût de portage chiffré** — capital immobilisé × taux annuel
  **paramétrable, défaut 22 %** (`Q1`, tranchée). *Une alerte sans montant ne déclenche aucune
  décision*, et `CM-2` mesure les alertes sans suite.
- **`SM-4` se mesure d'abord** : référence établie au 1ᵉʳ arrêté, cible de décroissance **ensuite**.
  ⛔ Aucune cible chiffrée inventée avant d'avoir mesuré.
- **Deux sources de stock réseau, conservées et comparées, ⛔ jamais fondues** — relevé du commercial
  et estimation déduite. ⚡ **L'écart est la donnée utile** ; c'est le patron du rapprochement bancaire.
  ⚠️ Motif à ne pas perdre : *tous les détaillants n'acceptent pas d'être relevés*.
- Toute restitution **indique sa source et sa fraîcheur**. Écart durable **signalé** (`CM-3`) — le
  service signale, il ne conclut pas.
- ⚡ **Portée réseau fail-closed sur le SEUL groupe K** (AD-13) : portée absente, vide ou non résolue
  rend **zéro enregistrement**. Une portée « totale » est une **valeur explicite**. ⛔ **Le stock
  détenu n'est jamais filtré par zone** — une valorisation sous portée partielle produirait un bilan
  silencieusement incomplet.
- ⚡ **Deux suites de conformité externes en CI** — unité (catalogue `AD-9`) et portée (réseau `AD-6`)
  — et **inscription aux deux registres**, ⛔ **condition de sortie d'épic, jamais implicite**. Stock
  est le premier service du programme dans ce cas.
- **Six droits de tenant** (`FR-S61`) + **configurer la valorisation** comme droit distinct et restreint
  (`FR-S62`) — *c'est une décision comptable, pas une opération de magasinier*.
- **Publication des événements** (`FR-S63`) et **fournisseur de candidats** (`FR-S39`) : **des faits,
  jamais un jugement ni une action**.
- **Route de lecture plateforme** `@PlatformReadOnly` (AD-18) : `PLATFORM_ADMIN`, **`orgId` en
  paramètre explicite**, ⛔ lecture seule, ⛔ une organisation à la fois, **journalisée avec son motif**.

---

## Les 4 questions du PRD sont tranchées

| # | Question | Réponse | Où |
| --- | --- | --- | --- |
| **Q1** | Taux annuel de coût de portage : unique ou paramétrable ? | **Paramétrable, défaut 22 %** | EPIC-084 |
| **Q2** | Règle d'écoulement modifiable en cours d'exercice ? | **Non** — même raison que `FR-S25` | EPIC-079 |
| **Q3** | Stock en transit : origine ou destination au bilan ? | ⚡ **Ni l'un ni l'autre — compte `38`**, déjà dans les trois référentiels livrés | EPIC-081, EPIC-083 |
| **Q4** | Emplacements nécessaires au v1 ? | **Reportés au module Opérations entrepôt (#12)** ⚠️ la contrainte de température part avec | ⏸ différés |

⚡ **`Q3` avait été reportée le 2026-08-02 « au lancement du module », avec consigne explicite de la
ressortir.** Elle est ressortie — et sa réponse était dans le dépôt depuis le début.
