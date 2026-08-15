---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/prds/prd-catalogue-produits-2026-08-02/prd.md
  - prospera-stories/prds/prd-catalogue-produits-2026-08-02/.memlog.md
  - prospera-stories/architecture/architecture-catalogue-produits-service-2026-08-15/ARCHITECTURE-SPINE.md
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.6 — AD-P15, AD-P16)
  - prospera-stories/epics-reseau-2026-08-15.md (mécanisme de conformité, repris ici)
  - prospera-stories/sprint-status.yaml (reserved_ranges, relevé le 2026-08-15)
  - auth-service/src/common/rbac/permission.enum.ts (le catalogue de permissions réel)
  - platform-catalog-service/src/modules/packs/packs.seed-data.ts (les codes de module livrés)
---

# Catalogue produits (`catalogue-produits-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD **Catalogue produits** et de la colonne vertébrale (AD-1 → AD-15) en épics
implémentables. Périmètre **backend** ; le frontend suit sa série `DI-*` dans son tracker propre.

**Série retenue : épics EPIC-065 → EPIC-074.** Dernier épic attribué au 2026-08-15 : **EPIC-053**
(reseau-service) ; **EPIC-054 → EPIC-064** sont **RÉSERVÉS** à `notification-service`. Vérifié dans
`reserved_ranges` de `sprint-status.yaml`, et la plage y est inscrite au nom de ce module **le jour où
elle est prise**.

**Aucun `story_id` n'est réservé ici** — attribution au slotting, comme la règle l'exige.

> ⚠️ **`catalogue-produits-service` n'est pas `platform-catalog-service`.** L'un catalogue les
> **modules Prospera**, l'autre les **produits qu'un distributeur vend**. `catalog` nu est **interdit**
> dans tout ce service (AD-14).

---

## ⚠️ 131 pts, le PRD en annonçait ~89. Les 42 d'écart sont sourcés.

| Source | Pts |
| --- | ---: |
| Incréments du PRD (1 + 2 + 3) | ~89 |
| **+ Socle, entitlement et cloisonnement** (EPIC-065) | **+13** |
| **+ Journaux partitionnés** (dans EPIC-073) | **+13** |
| **+ Étanchéité prouvable, conformité et route plateforme** (EPIC-071, 074) | **+11** |
| **+ Remises de pied de commande** *(Q5, tranchée le 2026-08-15 — périmètre `FR-C19` + forme panier `FR-C23`)* | **+5** |
| **Total** | **131** |

1. **Le socle n'était pas compté** — même manque que pour `reseau-service`. Le PRD ne mentionnait ni
   entitlement ni gate.
2. **Les journaux partitionnés n'existaient pas au chiffrage.** `FR-C49` **contredisait** `NFR-4` ; la
   contradiction a été tranchée le 2026-08-15 (**AD-7**) en deux journaux qui ne partagent **ni
   collection, ni index, ni route de lecture**. Ce n'est pas un champ de plus, c'est un second
   mécanisme d'audit.
3. **L'étanchéité freelance est plus lourde que son incrément ne le laissait croire.** Le PRD fondait
   `F` dans un incrément de 26 pts avec `G` et `J`. **AD-6** exige une **collection séparée**, un
   **dépôt dédié qui refuse toute lecture sans le propriétaire**, et une **prouvabilité** — on doit
   pouvoir montrer qu'aucun code n'interroge la collection autrement. S'y ajoutent la **suite de
   conformité** (AD-9, invariant distribué) et la **route plateforme** (AD-15, décidée le 15/08).

---

## ⛔ Trois stories HORS de ce service, et l'une d'elles bloque le premier épic

| # | Où | Quoi | Bloque |
| --- | --- | --- | --- |
| **1** | `platform-catalog-service` | **Enregistrer les six modules du pack distributeur** au catalogue. Aucun n'existe comme `Module` — il n'y a pas de seed, ils se créent par l'API admin ⇒ le provisioning rend **422 en vol** depuis le 2026-08-11 | ⛔ **EPIC-065** — sans module enregistré, pas d'entitlement, donc pas de gate |
| **2** | `platform-catalog-service` + `frontend-admin-panel` | **Renommer `catalogue` → `catalogue-produits`** dans `packs.seed-data.ts` et `vertical-packs.ts` (AD-14) | ⛔ **EPIC-065** — à faire *avec* la n°1, pas après : renommer un code déjà enregistré coûte une migration |
| **3** | `auth-service` | **Étendre le RBAC au périmètre tenant** (AD-P15). Le catalogue de permissions est plateforme (D15) et rend `perms: []` à tout tenant ⇒ ✅ **`STORY-365`, créée le 2026-08-15, slottée S21** (épic `EPIC-025`) | ⛔ **EPIC-068** (droits sur les grilles) — pas EPIC-065 |

⚠️ **Le gap n°1 existe indépendamment de ce PRD.** Il a été ouvert le 2026-08-11 par la vérification
docker de STORY-293 et n'a jamais eu de porteur. Ce découpage ne le crée pas, il le rend bloquant.

---

## Blocs d'ordonnancement — **pas** des sprints

Capacité de référence : **34**. Aucun sprint attribué — l'ordonnancement est une décision PO.

| Bloc | Épics | Pts | vs 34 |
| --- | --- | ---: | --- |
| **1 — L'article existe et se compte** | EPIC-065, EPIC-066, EPIC-067 | **42** | ⚠️ +8 |
| **2 — Le prix se résout** | EPIC-068, EPIC-069, EPIC-070 | **39** | ⚠️ +5 |
| **3 — Le catalogue s'ouvre aux indépendants** | EPIC-071, EPIC-073 | **29** | ✅ −5 |
| **4 — Le catalogue sert les autres** | EPIC-072, EPIC-074 | **21** | ✅ −13 |

### Contraintes d'ordre à ne pas défaire au slotting

- ⛔ **EPIC-067 précède EPIC-068.** Un prix est porté **par article ET par unité** (`FR-C13`) ; sans la
  mécanique d'unités, une grille n'a pas de clé.
- ⛔ **EPIC-070 précède EPIC-071.** `FR-C31` calcule la marge du freelance contre **le prix société
  réellement résolu pour lui** — sa zone, son volume. Sans le résolveur, la marge serait calculée
  contre un prix de référence théorique, ce que le PRD interdit explicitement.
- ⛔ **EPIC-071 précède le volet freelance d'EPIC-073.** On ne partitionne pas un journal dont l'objet
  n'existe pas.

---

## Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-C52 · NFR-6 · AD-13 · invariants hérités | **EPIC-065** — socle, entitlement, gate, cloisonnement |
| FR-C01 → FR-C05 · FR-C41 → FR-C44 · AD-1 | **EPIC-066** — article, identifiants externes, médias, classification, cycle de vie |
| FR-C06 → FR-C12 · **NFR-2** · SM-1, SM-6 · AD-2, AD-3, AD-4, AD-9 | **EPIC-067** — unité de base immuable, conditionnements, **facteurs versionnés** |
| FR-C13 → FR-C17 · AD-11 | **EPIC-068** — grilles, devise, HT/TTC, régime de taxe, priorités, versions |
| FR-C18 → FR-C22 · CM-1 · AD-5 *(priorités)* | **EPIC-069** — remise et prix promotionnel daté, non-cumul, plafonds, expiration |
| FR-C23 → FR-C27 · **NFR-3**, NFR-5 · SM-2, SM-5 · AD-5 | **EPIC-070** — résolution déterministe et explicable, prix figé, « pas de prix » |
| FR-C28 → FR-C34 · **NFR-4** · SM-3 · AD-6, AD-8 | **EPIC-071** — double tarification freelance, étanchéité prouvable, révélation au départ |
| FR-C35 → FR-C40 · SM-4 · AD-10 | **EPIC-072** — profil commercial, absence identifiable |
| FR-C45 → FR-C47, FR-C49 · AD-7, AD-12 | **EPIC-073** — import tout-ou-rien, export, **journaux partitionnés** |
| FR-C48, FR-C50, FR-C51 · **NFR-1** *(mécanisme)* · AD-9, AD-15 | **EPIC-074** — droits, publication, fournisseur de candidats, **conformité + route plateforme** |
| AD-14 | **transverse** — conventions de nommage de chaque épic |

**Couverture : 52 exigences fonctionnelles sur 52, 6 NFR sur 6, 15 AD sur 15.**

---

## EPIC-065 : Socle, entitlement et cloisonnement · 13 pts

**Autonome :** ⛔ **non** — bloqué par les stories hors service **n°1 et n°2**.

- Scaffold : base propre, configuration, santé, **démarrage dégradé** si le bus n'est pas là.
- Gate **`@RequiresCatalogueProduitsAccess`** = `emailVerified` + KYC `APPROVED` + entitlement
  `ACTIVE`, lu dans les read-models locaux.
- Read-models entrants (`identity.*`, `kyc.status.changed`, `entitlement.changed`) — patron **à
  copier** de `bilan-service` / `balance-service`, pas à concevoir.
- Cloisonnement strict par organisation (`FR-C52`, `NFR-6`) : `orgId` du **jeton signé**.
- Outbox transactionnelle + énumération `CatalogueProduitsTopic` **propre**.
- ⛔ Convention posée dès le premier commit : **`catalog` nu interdit** (AD-14).

## EPIC-066 : L'article, ses identifiants et son cycle de vie · 13 pts

**Autonome :** oui. **Amont :** EPIC-065.

- Article : référence **unique dans l'organisation**, nom, classification à **deux niveaux au moins**
  propre à l'organisation, unité de base, état. ⛔ **Aucune quantité.**
- Identifiants externes multiples (code-barres, référence fournisseur, douanière) — **jamais le même
  identifiant pour deux articles actifs**.
- Médias : le commercial en tournée **montre** le produit au détaillant.
- Cycle `brouillon → actif → suspendu → retiré`. **Seul un article actif peut être commandé.**
- ⛔ **La référence n'est jamais réattribuée**, même après retrait — commandes et factures y renvoient
  pour toujours. Le retrait d'un article portant du stock ou des commandes en cours est **refusé, avec
  le détail de ce qui l'empêche**.
- Filiation de remplacement (`FR-C44`) — elle porte aussi le changement d'unité de base d'EPIC-067.

## EPIC-067 : Unités, conditionnements et facteurs versionnés · 16 pts

**Autonome :** oui. **Amont :** EPIC-066. ⛔ **Précède EPIC-068.**

> ⚡ **C'est la mécanique centrale du module**, et celle qui porte son défaut le plus coûteux.

- **Unité de base immuable** (`FR-C06b`, Q1 tranchée) : le service refuse la modification **quel que
  soit le rôle**, y compris `PLATFORM_ADMIN`, avec le code `UNITE_DE_BASE_IMMUABLE` — pas un 400
  générique : l'appelant doit pouvoir proposer l'article de remplacement.
  ⚠️ **Cet invariant n'appartient pas à ce service** : tout le stock historique y est exprimé, et le
  PRD Stock le déclare **dépendance dure**.
- Conditionnements en **hiérarchie** ; le facteur vers l'unité de base est **CALCULÉ**, jamais saisi
  deux fois. Facteurs **entiers** (A1 : le vrac est hors v1).
- Chaque conditionnement déclare **achetable / stockable / vendable**, les trois indépendants.
- ⚡ **Facteurs VERSIONNÉS** : modifier crée une version, ⛔ jamais en place. **Tout engagement stocke
  le facteur qu'il a utilisé** — il ne référence pas une version qui pourrait disparaître.
- ⛔ **Aucune quantité nue** : `{ valeur, unite }` dans l'API, dans les événements, dans les documents.

**Critère de sortie (`NFR-2`, `SM-6`), mesurable :** après passage du carton de 20 à 24, **une commande
antérieure restituée affiche toujours ses quantités d'origine**. C'est le défaut le plus silencieux du
module — il ne se voit qu'à l'inventaire suivant, des mois plus tard.

## EPIC-068 : Grilles tarifaires société · 13 pts

**Autonome :** ⚠️ partiellement — ses **droits** dépendent de la story hors service **n°3**.
**Amont :** EPIC-067.

- Prix **par article ET par unité** — le prix du carton n'est pas 20 fois celui de l'unité.
- ⛔ **Aucun prix ne se déduit d'un autre** : pas de prix pour l'unité ⇒ « pas de prix » pour l'unité.
  Le service **ne divise jamais par le facteur** — la remise de gros **est** l'écart entre les deux, et
  la déduire l'efface.
- Chaque grille porte **sa devise** ; ⛔ les prix **ne se convertissent jamais** entre grilles.
  Montants en **entier d'unité mineure** ⚠️ **XOF : zéro décimale**.
- Chaque grille déclare **HT ou TTC**, et l'article porte son **régime de taxe**. Sans cela, la
  Facturation ne peut produire aucune facture conforme et la comptabilité **n'a aucune source pour la
  TVA collectée**.
- Conditions d'application = **données, pas du code** (zone, catégorie de client, seuil de volume).
  ⚠️ La zone est une **référence opaque** au v1 (A2) — `reseau-service` la rendra résoluble.
- **Priorité explicite** : deux grilles applicables ne sont **jamais** départagées par un hasard
  d'implémentation. Versions : un prix ayant servi reste consultable tel qu'il était.

## EPIC-069 : Promotions, y compris les remises de pied de commande · 10 pts

**Autonome :** oui. **Amont :** EPIC-068.

- **Deux formes, toutes deux nécessaires** : une **remise** appliquée au prix de grille, et un **prix
  promotionnel daté** qui s'y **substitue**.
- Période, périmètre (articles, catégories, zones, clients), priorité.
- ⚡ **Périmètre « COMMANDE ENTIÈRE » (Q5, tranchée le 2026-08-15)** : les **remises de pied de
  commande** ne sont pas un objet nouveau, mais une promotion dont le périmètre n'est pas un article.
  Elles héritent des quatre mécaniques ci-dessus — période, priorité, plafond, expiration.
- ⛔ **Deux promotions applicables ne se cumulent JAMAIS implicitement.** La plus prioritaire
  s'applique, ou le cumul est **déclaré autorisé** sur la promotion. **Le silence vaut non-cumul.**
  ⚡ **Cette règle couvre désormais l'interaction LIGNE × PIED DE COMMANDE** — c'est la raison
  décisive de Q5 : une remise de pied définie ailleurs se serait cumulée à une promotion de ligne
  **sans que personne l'ait déclaré**.
- **Plafonds** : quantité maximale, montant maximal de remise. *Une promotion sans plafond sur un
  produit à forte élasticité peut coûter plus que la marge du mois.*
- ⚡ **Une promotion expire d'elle-même.** Aucune n'a besoin d'être désactivée à la main pour cesser.

## EPIC-070 : La résolution du prix — par ligne ET par panier, déterministe et explicable · 16 pts

**Autonome :** oui. **Amont :** EPIC-068, EPIC-069. ⛔ **Précède EPIC-071.**

- **DEUX formes de résolution**, toutes deux explicables. ① **par ligne** — article, unité, quantité,
  client, zone, date. ② **par PANIER** *(Q5)* — l'ensemble des lignes d'une commande, seule forme
  capable d'appliquer une **remise de pied de commande**, qui suppose le total.
- L'explication rend **l'arbitrage de non-cumul** entre promotions de ligne et remise de pied.
  ⚡ Appliquer le pied dans `Commande` **éclaterait l'explication du total sur deux modules** et ferait
  tomber `NFR-3` devant le détaillant. ⚠️ Ce service est donc sur le chemin de la commande — **il
  l'était déjà** par la forme ligne ⇒ **cible de latence due sur la forme panier**.
- ⛔ La résolution par panier **ne crée aucun engagement** : elle résout, `FR-C25` fige.
- **Déterminisme observable** : rejouer 1 000 fois donne 1 000 fois le même résultat **et la même
  explication**.
- ⛔ **Aucune grille applicable ⇒ « pas de prix ».** Jamais un prix par défaut, jamais zéro, jamais le
  dernier prix connu. **Un prix inventé se propage jusqu'à la facture.**
- **Le prix est figé à l'engagement et conservé avec lui**, jamais relu. *Une grille modifiée le mardi
  ne change pas ce qu'un détaillant doit sur une commande de lundi.*
- **Simulation** sans engagement (`FR-C27`).

⚠️ **`CM-1` est à instrumenter ici** : le nombre de grilles et promotions simultanément actives. Une
résolution peut rester **déterministe pour la machine** et devenir **incompréhensible pour le
commercial** qui doit expliquer un prix à son détaillant. *La complexité tarifaire se paie au
comptoir.*

## EPIC-071 : Double tarification freelance — étanchéité prouvable · 16 pts

**Autonome :** oui. **Amont :** EPIC-070 *(obligatoire)*. ⛔ **Précède le volet freelance d'EPIC-073.**

> ⚡ **L'épic le plus risqué du module.** Son erreur n'est pas un défaut fonctionnel : c'est un
> **manquement à un engagement de confidentialité envers des tiers** qui ne sont pas salariés de
> l'entreprise cliente.

- Prix freelance **par article ET par point de vente** — il négocie chaque détaillant séparément.
- ⚡ **Collection séparée**, keyée `(orgId, freelanceUserId, pointDeVenteId, articleId)`, et **tout
  accès passe par un dépôt dédié qui EXIGE le `userId` propriétaire** : ⛔ aucune méthode de lecture
  sans lui, **pas de `findAll`, pas de `findByOrg`, pas de variante « admin »**.
- ⛔ **Aucun agrégat, export, tableau de bord ou restitution consolidée de la société ne lit cette
  collection.** Jamais de jointure, jamais de `$lookup`.
- Marge calculée contre **le prix société réellement résolu pour ce freelance** — sa zone, son volume —
  **pas un prix de référence théorique**. Visible du **seul** freelance.
- La **grille société reste visible de tous** : c'est le prix auquel il achète. **L'asymétrie est une
  conception, pas un oubli.**
- Un prix freelance **sans prix société correspondant est refusé** : on ne revend pas ce qu'on n'achète
  pas. Deux indépendants **ne se voient pas**.
- ⛔ La vente d'un freelance à son détaillant est **hors des livres de la société**.
- **Révélation au départ** (AD-8) : événement **daté, tracé et NOTIFIÉ au freelance** — jamais un accès
  qui s'ouvre en silence. Uniquement les points de vente **qui restent**, uniquement les prix **en
  vigueur au départ**, ⛔ **pas l'historique des négociations**.
  ⚠️ Le déclencheur appartient au module **PDV (#2), qui n'existe pas** ⇒ **hook inerte, documenté et
  TESTÉ comme tel** (leçon STORY-173).

**Critère de sortie (`NFR-4`, `SM-3`) :** l'étanchéité se prouve **au niveau des données, pas des
écrans** — on montre qu'**aucun code** n'interroge la collection sans le propriétaire.
⚠️ **Une seule exception, et elle est nommée** : la route plateforme d'EPIC-074 (`AD-P16`).

## EPIC-072 : Profil commercial — ce qui permet de refuser · 8 pts

**Autonome :** oui. **Amont :** EPIC-066.

> C'est la **thèse du module** : *« un catalogue qui décrit est un annuaire ; un catalogue qui refuse
> est un outil. »*

- Saisonnalité (aucune / saisonnière avec ses mois / événementielle), **fin de vie commerciale**,
  élasticité prix, taux de reprise fournisseur.
- ⚡ La **fin de vie commerciale est distincte de toute date limite de consommation**. *Un maillot
  d'une compétition passée n'est pas périmé : il est invendable.*
- ⛔ **Ce module ne refuse rien** — il **publie** aux modules qui décident (Approvisionnement,
  Commande, Marketing) et **rend le refus possible**.
- ⚡ **Un article sans profil est identifiable comme tel.** Un profil absent **n'est pas un profil
  neutre** : c'est une information manquante et elle doit se voir. `AUCUNE` compte comme réponse ; le
  vide ne compte pas (`SM-4` : > 80 % d'articles actifs à profil **complet**).
- Élasticité **saisie ou héritée d'une famille**, jamais mesurée par le système au v1 (A4).

## EPIC-073 : Import, export et journaux partitionnés · 13 pts

**Autonome :** oui. **Amont :** EPIC-068 · EPIC-071 *(pour le volet freelance)*.

- Import par fichier avec **compte rendu AVANT persistance** — créations, mises à jour, lignes
  rejetées **et motif**. Rien n'est écrit avant que l'utilisateur ait vu ce qui va l'être.
- ⛔ **Tout ou rien.** *Un catalogue à moitié importé est plus difficile à réparer qu'un import à
  refaire.*
- Clé de rapprochement = **référence article**, à défaut un identifiant externe déclaré. Une ligne sans
  clé résoluble est **rejetée**, ⛔ jamais créée « au cas où ».
- ⛔ L'import **n'écrase jamais** un prix figé sur un engagement ni un facteur historique.
- Export réimportable.
- ⚡ **DEUX JOURNAUX D'AUDIT PARTITIONNÉS** (AD-7, arbitrage du 15/08 — `FR-C49` **contredisait**
  `NFR-4`) : celui de la société, et celui du freelance **lisible du seul propriétaire**.
  ⛔ **Ni collection, ni index, ni route de lecture en commun.**
  ⚠️ **Danger principal, écrit pour qu'il ne se découvre pas :** toute future restitution consolidée
  devra **se souvenir de ne jamais les joindre**. Une vue « historique des prix » naïve rouvrirait la
  fuite que `NFR-4` ferme.
- ⚠️ **La route de lecture est livrée par la même story que l'écriture, avec son consommateur nommé.**
  Ce programme a payé **trois fois** l'écriture sans lecture.
- Auteur rendu **par son identité**, jamais un `userId` brut.

## EPIC-074 : Droits, publication, conformité et route plateforme · 13 pts

**Autonome :** ⚠️ non — ses **droits** dépendent de la story hors service **n°3**, et son critère de
sortie s'exécute **chez des consommateurs qui n'existent pas**.

- **Droits distincts** (`FR-C48`) : gérer les articles, gérer les grilles société, gérer les
  promotions, consulter. ⚠️ « Gérer son propre tarif freelance » **n'en fait pas partie** : ce n'est
  pas une permission mais une **propriété**, portée par EPIC-071.
- **Publication** des changements (article créé, modifié, retiré ; grille publiée ; promotion ouverte
  ou close) — la charge utile porte **l'unité** et **le facteur** (AD-4, AD-9).
- **Fournisseur de candidats** pour le moteur de règles (`FR-C51`) — des **faits**, jamais un jugement
  ni une action.
- ⚡ **Suite de tests de conformité versionnée + registre des consommateurs conformes** (AD-9), pour
  `NFR-1`. **Même mécanisme que `reseau-service`**, par cohérence : un consommateur absent du registre
  est un **écart ouvert**, pas une absence d'information.
- ⚡ **Route plateforme `@PlatformReadOnly`** (AD-15 / **AD-P16**) : `orgId` en **paramètre explicite**
  et ⛔ jamais tiré du jeton, **lecture seule**, **une organisation à la fois**, **journalisée avec son
  motif**. ⚠️ **Seules routes du service où le gate d'EPIC-065 ne s'applique pas** — un opérateur Money
  Vibes n'a ni KYC ni entitlement. Rien d'autre ne doit employer cette garde.

---

## Ce qui n'est PAS du travail sur ce service

- **Les consommateurs qui appliquent `NFR-1`.** EPIC-074 livre la suite et le registre ; **l'exécuter
  est du travail chez Stock, Commande et Facturation** — dont aucun n'existe.
- **Les trois stories hors service** (module au catalogue, renommage, RBAC tenant). Deux d'entre elles
  **bloquent EPIC-065**.
- **`FR-C29d` — la mention au contrat de l'indépendant.** Action **produit**, hors architecture. ⚠️ Il
  y a désormais **deux** exceptions au secret des prix freelance, et **la seconde est permanente** :
  l'éditeur de la plateforme (AD-P16). Le contrat doit annoncer les deux.
- **`R4` — la contradiction de l'argumentaire commercial** sur la visibilité des marges freelance
  (§1.3 du PRD). Deux documents commerciaux se contredisent ; le PRD a tranché, **les documents n'ont
  pas été alignés**.

## Questions ouvertes restantes

| # | Question | À trancher avant |
| --- | --- | --- |
**Aucune. Les quatre questions du PRD sont tranchées et intégrées :**

| # | Réponse |
| --- | --- |
| **Q1** | Unité de base **immuable** — changement par article de remplacement (EPIC-067) |
| **Q2** | **Pas** de catalogue partagé entre distributeurs. Le besoin de vision transverse est satisfait autrement, par **AD-P16** (lecture plateforme, EPIC-074) |
| **Q4** | Prix freelance **non plafonné** — cohérent : la société ne voit pas ces prix, il aurait été singulier qu'elle les encadre. Seul garde-fou : `FR-C33` (EPIC-071) |
| **Q5** | Remises de pied de commande **ici**, règle ET résolution — contre l'avis initial du PRD (EPIC-069 + EPIC-070) |
