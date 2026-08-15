---
name: 'catalogue-produits-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — module du vertical Distributeur, relying-party de l''IdP, producteur d''événements'
scope: 'micro-service catalogue-produits-service — article, unité de base et conditionnements versionnés, grilles tarifaires société, promotions, résolution de prix explicable, double tarification freelance étanche, profil commercial'
status: 'final — 7 arbitrages PO du 2026-08-15 (dont AD-P15 et AD-P16, décisions PROGRAMME) ; ils AMENDENT le PRD sur 7 points et imposent 3 stories HORS de ce service'
created: '2026-08-15'
updated: '2026-08-15'
binds:
  - 'PRD Catalogue produits v1 — FR-C01→C52, NFR-1→NFR-6'
sources:
  - 'prospera-stories/prds/prd-catalogue-produits-2026-08-02/prd.md'
  - 'prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.5, AD-P15)'
  - 'prospera-stories/architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md'
  - 'prospera-stories/architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md'
  - 'auth-service/src/common/rbac/permission.enum.ts + modules/auth/auth.service.ts (le catalogue de permissions réel)'
  - 'platform-catalog-service/src/modules/packs/packs.seed-data.ts (les codes de module déjà livrés)'
companions:
  - 'prospera-stories/prds/prd-catalogue-produits-2026-08-02/.memlog.md'
---

# Architecture Spine — catalogue-produits-service

> **Ce que ce service est.** Le référentiel de ce qui se vend : ce que c'est, sous quelle forme, à quel
> prix pour qui, et **ce qu'il faut savoir avant d'en acheter**.
>
> **Sa thèse, reprise du PRD :** *« Un catalogue qui décrit est un annuaire. Un catalogue qui refuse
> est un outil. »* Il ne refuse rien lui-même — il **porte l'information sans laquelle
> l'Approvisionnement et la Commande ne peuvent pas refuser**.
>
> ⚠️ **À ne jamais confondre avec `platform-catalog-service`**, qui catalogue les *modules Prospera*.
> Deux objets sans aucun rapport, un mot commun. Voir AD-14.

## Design Paradigm

**Modules NestJS sur le moule commun Prospera.** Le service possède quatre agrégats, en garde les
invariants, résout un prix de façon déterministe, et publie des faits.

| Couche | Répertoire | Contenu |
| --- | --- | --- |
| Entrée | `src/modules/*/` `*.controller.ts` | Contrôleurs, DTO, guards |
| Application | `src/modules/*/` `*.service.ts` | Cas d'usage, transactions, **résolution de prix** |
| Persistance | `src/modules/*/schemas/`, `*.repository.ts` | Schémas, index. ⚠️ **Le dépôt freelance est à part** (AD-6) |
| Événements | `src/kafka/`, `src/kafka/outbox/` | Contrats, outbox transactionnelle |
| Read-models entrants | `src/modules/read-models/` | `identity.*`, `kyc.status.changed`, `entitlement.changed` |
| Transverse | `src/common/` | Guards, RBAC, contexte |

## Inherited Invariants

| Hérité | Source | Ce qu'il contraint ici |
| --- | --- | --- |
| **AD-P15 — le RBAC s'étend au tenant** | `architecture-prospera-ecosystem` v1.5 | Les droits métier de `FR-C48` vivent au catalogue de permissions ⇒ **story hors service** |
| **AD-P16 — lecture plateforme inter-org** | `architecture-prospera-ecosystem` v1.6 | Money Vibes lit la donnée métier de toute org, **prix freelance compris** ⇒ AD-15, et AD-6 amendée |
| **Discriminant borné / non borné** | `architecture-prospera-ecosystem` v1.5 | Les droits catalogue sont un **vocabulaire fermé** ⇒ ils vont dans le jeton, contrairement à la portée réseau |
| Relying-party / JWKS | `architecture-prospera-ecosystem` | Validation locale RS256, aucun appel chaud à `auth-service` |
| `orgId` du jeton signé | `architecture-prospera-ecosystem` | L'isolation inter-org ne vient jamais du corps. ⚠️ **Elle ne suffit PAS pour NFR-4** — voir AD-6 |
| Database-per-service | `architecture-prospera-ecosystem` | Ne lit aucune base d'un autre service |
| Entitlement `(org × module)` | `architecture-catalog-service` | Le module `catalogue-produits` est octroyé par entitlement (AD-13) |
| Unités mineures entières | STORY-101 · `paiement-service` | **Tout montant en entier d'unité mineure** ⚠️ **le XOF n'a aucune décimale** |
| Outbox transactionnelle | STORY-099 | Publication dans la transaction qui produit le fait |
| Énumérations de topics séparées | `dossier-service` AD-11 | Un nouveau flux crée son énumération |
| **Ce qui a servi est conservé avec ce qu'il a produit** | ⚡ invariant de programme — `paiement` (tarif), `reseau` AD-4 (version de découpage) | **AD-4 et AD-5 ici** : facteur de conversion et prix figés à l'engagement |

---

## Invariants & Rules

### AD-1 — L'article ne porte aucune quantité, et sa référence est éternelle

- **Binds:** FR-C01, FR-C02, FR-C42, FR-C43
- **Rule:** l'article **ne porte aucun stock** — c'est un autre module. Le prototype mélangeait les
  deux (`ProduitStock` avec `stock`, `seuil`, `entrepot` **au singulier**) et le contournement par
  table annexe **prouvait** que ce sont deux objets.
- **Rule:** la référence est **stable et jamais réattribuée**, même après retrait. Commandes et
  factures y renvoient **pour toujours**.
- **Rule:** on **retire**, on ne supprime pas. Le retrait d'un article portant du stock ou des
  commandes en cours est **refusé, avec le détail de ce qui l'empêche**.

### AD-2 — L'unité de base est immuable, et c'est un invariant inter-modules

- **Binds:** FR-C06, FR-C06b, FR-C44 · **Q1, tranchée le 2026-08-02**
- **Rule:** ⛔ **le service refuse la modification de l'unité de base, quel que soit le rôle** — y
  compris `PLATFORM_ADMIN`. Le changement se fait par **article de remplacement**, avec filiation.
- **Rule:** ⚡ **Cet invariant n'appartient pas à ce service seul.** Tout le stock, tous les mouvements
  et toutes les commandes historiques y sont exprimés : la changer les rendrait faux **en silence**,
  et l'erreur ne se verrait qu'à l'inventaire suivant. Le PRD Stock la déclare **dépendance dure**.
- **Rule:** le refus est un **code machine stable** (`UNITE_DE_BASE_IMMUABLE`), pas un 400 générique :
  l'appelant doit pouvoir proposer l'article de remplacement.

### AD-3 — Les conditionnements sont une hiérarchie à facteurs entiers, calculés jamais saisis deux fois

- **Binds:** FR-C07, FR-C08, FR-C09, FR-C12 · **A1**
- **Rule:** la palette contient des cartons, le carton contient des unités. **Le facteur vers l'unité
  de base est CALCULÉ**, jamais saisi une seconde fois — deux saisies divergent.
- **Rule:** facteurs **entiers** (A1 : le vrac n'est pas couvert au v1). Les conversions sont exactes ;
  ⛔ **aucun document ne porte jamais un nombre fractionnaire de cartons.**
- **Rule:** un conditionnement déclare ce qu'il autorise — **achetable, stockable, vendable** — et les
  trois sont indépendants : une palette peut être achetable sans être vendable.

### AD-4 — Le facteur de conversion est versionné, et l'engagement stocke celui qu'il a utilisé

- **Binds:** FR-C10, FR-C10b, NFR-2, SM-6, **risque R2** · **Prevents:** le défaut le plus coûteux et le plus silencieux du module
- **Rule:** modifier un facteur **crée une version**. ⛔ **Jamais en place.**
- **Rule:** ⚡ **tout engagement — commande, mouvement, document — STOCKE le facteur qu'il a utilisé.**
  Il ne référence pas une version qui pourrait disparaître ou être réinterprétée.
- **Rule:** ⚠️ **C'est une obligation de contrat pour des modules qui n'existent pas encore.** Le
  facteur est donc **dans la charge utile de l'événement** et dans la réponse de résolution — jamais à
  aller chercher par un appel supplémentaire.
- **Rule:** condition observable (NFR-2) : après passage du carton de 20 à 24, **une commande
  antérieure restituée affiche toujours ses quantités d'origine**.

### AD-5 — Le prix est une résolution déterministe et explicable, figée à l'engagement

- **Binds:** FR-C23 → FR-C27, NFR-3, NFR-5, SM-2
- **Rule:** la résolution rend le prix **avec son explication** : quelle grille, quelle promotion,
  quelle condition remplie. Un prix qu'on ne peut pas justifier devant un client est un prix qu'on ne
  peut pas défendre.
- **Rule:** **déterminisme observable** — rejouer 1 000 fois une résolution identique donne 1 000 fois
  le même résultat **et la même explication**.
- **Rule:** ⛔ **si aucune grille ne s'applique, la réponse est « pas de prix ».** Jamais un prix par
  défaut, jamais zéro, jamais le dernier prix connu. **Un prix inventé se propage jusqu'à la facture.**
- **Rule:** ⛔ **aucun prix ne se déduit d'un autre.** Pas de prix pour l'unité ⇒ « pas de prix » pour
  l'unité. Le service **ne divise jamais par le facteur de conversion** : la remise de gros **est**
  l'écart entre les deux, et la déduire l'efface.
- **Rule:** le prix est **figé à l'engagement et conservé avec lui**, jamais relu. Une grille modifiée
  le mardi ne change pas ce qu'un détaillant doit sur une commande de lundi.
- **Rule:** priorités **explicites** entre grilles (FR-C16) et entre promotions (FR-C20) : deux règles
  applicables ne sont **jamais** départagées par un hasard d'implémentation, et **le silence vaut
  non-cumul**.
- **Rule:** ⚡ *(Q5, tranchée le 2026-08-15)* **la résolution a DEUX formes : par ligne et par PANIER.**
  La forme panier prend l'ensemble des lignes d'une commande et applique, en plus, les promotions de
  périmètre **« commande entière »** — les **remises de pied de commande**, qui supposent de connaître
  le total.
- **Rule:** ⛔ **le non-cumul de FR-C20 arbitre AUSSI l'interaction ligne × pied de commande**, et cet
  arbitrage est **rendu dans l'explication**. C'est la raison décisive du choix : une remise de pied
  appliquée dans `Commande` **éclaterait l'explication du total sur deux modules**, et `NFR-3`
  tomberait exactement là où elle compte — devant le détaillant à qui le commercial doit justifier un
  montant.
- **Rule:** ⚠️ **Ce service est donc sur le chemin de la commande, et il l'était déjà** (`FR-C23` par
  ligne). Ce n'est pas une entorse au principe « publier plutôt qu'appliquer » — ce principe vaut pour
  le **profil commercial** (AD-10) et pour le refus, pas pour le prix, dont la résolution est la
  raison d'être du module. ⇒ une **cible de latence** est due sur la forme panier.
- **Rule:** ⛔ la résolution par panier **ne crée aucun engagement**. Elle résout ; `FR-C25` fige.

### AD-6 — L'étanchéité freelance est une isolation INTRA-organisation, portée par un dépôt dédié [ARBITRÉ PO 2026-08-15]

> ⛔ **C'est la décision la plus structurante du service, et le seul endroit du programme où une
> donnée doit être cachée au CLIENT QUI PAIE L'ABONNEMENT, au nom d'un tiers qui n'est pas son
> salarié.**

- **Binds:** FR-C28 → FR-C34, **NFR-4**, SM-3, **risque R3**

**Pourquoi aucune brique existante ne suffit :** tout le cloisonnement du programme est **par
`orgId`** — le jeton le porte, les dépôts filtrent dessus. Or **le freelance et la société sont dans
la MÊME organisation**. NFR-4 exige de cacher un prix **à l'administrateur de sa propre org**. C'est
un modèle de menace inédit ici, et `TenantScopedRepository` n'y répond pas.

- **Rule:** les grilles freelance vivent dans **leur propre collection**, keyée
  `(orgId, freelanceUserId, pointDeVenteId, articleId)`.
- **Rule:** ⛔ **tout accès passe par un dépôt dédié qui EXIGE le `userId` propriétaire.** Il n'existe
  **aucune** méthode de lecture sans lui — pas de `findAll`, pas de `findByOrg`, pas de variante
  « admin ». L'absence de chemin est **prouvable en montrant qu'aucun code n'interroge la collection
  autrement**.
- **Rule:** ⛔ **aucun agrégat, export, tableau de bord ou restitution consolidée de la société ne lit
  cette collection.** Jamais de jointure. Jamais de `$lookup`.
- **Rule:** ⚠️ **`PLATFORM_ADMIN` EST une exception, et une seule** *(arbitrage PO du 2026-08-15,
  **AD-P16** — cette règle disait l'inverse le matin même)*. Money Vibes lit les prix freelance **sans
  condition**, par la route plateforme d'AD-15 : `orgId` explicite, lecture seule, une organisation à
  la fois, **journalisée avec son motif**. ⛔ **Aucun autre rôle ne contourne le propriétaire** — et
  surtout pas `TENANT_ADMIN`, qui reste le destinataire premier de l'étanchéité.
  ⚠️ **`NFR-4` reste littéralement vrai** : il interdit l'accès à « un utilisateur **de la société** »,
  et un opérateur Money Vibes n'en est pas un. L'exception est donc **compatible avec l'exigence
  écrite** — mais elle doit être **nommée**, pas déduite d'une lecture serrée du texte.
  ⚡ **Conséquence hors architecture, et elle est sérieuse :** `FR-C29d` exige que le contrat de
  l'indépendant annonce l'exception de la révélation au départ. Il doit désormais annoncer **aussi**
  que l'éditeur de la plateforme peut consulter ses prix. Le freelance confie ici la matière de son
  fonds de commerce.
- **Rule:** un prix freelance **sans prix société correspondant est refusé** : on ne peut pas revendre
  ce qu'on n'achète pas.
- **Rule:** la marge (FR-C31) se calcule contre **le prix société réellement résolu pour ce freelance**
  — sa zone, son volume — pas un prix de référence théorique. Elle est **visible du seul freelance**.
- **Rule:** la **grille société reste visible de tous** : c'est le prix auquel le freelance achète.
  **La visibilité est asymétrique par conception**, et ce n'est pas un oubli.
- **Rule:** ⛔ la vente d'un freelance à son détaillant est **hors des livres de la société**. Le
  service ne produit **aucune** donnée qui ferait entrer ce chiffre d'affaires dans ses états.

### AD-7 — Le journal est partitionné : celui de la société, celui du freelance [ARBITRÉ PO 2026-08-15]

- **Binds:** FR-C49 vs **NFR-4** — une contradiction interne du PRD, tranchée ici
- **Rule:** **deux journaux d'audit distincts.** Celui de la société porte les valeurs avant/après des
  grilles société, promotions et facteurs. Celui du freelance porte les siennes, et **n'est lisible que
  du freelance propriétaire**.
- **Rule:** les deux sont **append-only**, protégés par le **rôle serveur** et non par la discipline du
  code applicatif.
- **Rule:** ⚠️ **DANGER PRINCIPAL DE CE CHOIX, à écrire pour qu'il ne se découvre pas** : toute future
  restitution consolidée d'audit devra **se souvenir de ne jamais joindre les deux**. Une vue
  « historique des prix » naïve rouvrirait la fuite que NFR-4 ferme. ⇒ **les deux journaux ne
  partagent ni collection, ni index, ni route de lecture**, et le dépôt du journal freelance suit la
  même règle qu'AD-6 : aucune lecture sans le `userId` propriétaire — **à la seule exception de la
  route plateforme d'AD-15**, qui lit les deux journaux comme elle lit les deux collections.
- **Rule:** l'auteur est rendu **par son identité**, jamais un `userId` brut.
- **Rule:** ⚠️ **la route de lecture est livrée par la même story que l'écriture, avec son consommateur
  nommé.** Ce programme a payé **trois fois** l'écriture sans lecture.

### AD-8 — La révélation au départ du freelance est la SEULE brèche, et elle est bruyante

- **Binds:** FR-C29b, FR-C29c, FR-C29d
- **Rule:** la révélation est un **événement daté, tracé et NOTIFIÉ au freelance** — ⛔ jamais un accès
  qui s'ouvre en silence.
- **Rule:** elle porte **uniquement les points de vente qui restent** au distributeur, et **uniquement
  les prix en vigueur au départ** — **pas l'historique des négociations**.
- **Rule:** ⚠️ **le déclencheur appartient au module PDV (#2), qui n'existe pas.** Le modèle porte donc
  la brèche **dès maintenant**, en hook inerte documenté et **testé comme tel** (leçon STORY-173) —
  la bricoler plus tard contre une garantie déjà livrée serait le pire moment.
- **Rule:** ⚠️ `FR-C29d` — l'existence de cette exception **doit figurer au contrat de l'indépendant**.
  Une promesse de confidentialité assortie d'une exception non annoncée n'est pas une promesse.
  *Action produit, hors de ce service — mais elle conditionne sa légitimité.*

### AD-9 — Aucune quantité ne circule sans son unité, et l'invariant est distribué

- **Binds:** FR-C11, **NFR-1**, SM-6
- **Rule:** ⛔ **aucun nombre nu** dans l'API, dans les événements publiés ou dans les documents.
  `120` n'est pas une quantité ; `120 unités` ou `120 cartons` en est une.
- **Rule:** ⚠️ **c'est un invariant DISTRIBUÉ**, comme `NFR-1` de `reseau-service` : il est tenu par
  Stock, Commande et Facturation, **dont aucun n'existe**. ⇒ **même mécanisme que celui arbitré pour le
  réseau** : ce service publie une **suite de tests de conformité versionnée** et tient un **registre
  des consommateurs conformes**. Un consommateur absent du registre est un **écart ouvert**, pas une
  absence d'information.
- **Rule:** la protection vise l'erreur la plus coûteuse de la distribution : **commander 120 quand on
  voulait 120 cartons**, ou l'inverse.

### AD-10 — Le profil commercial est publié, jamais appliqué ; son absence est une information

- **Binds:** FR-C35 → FR-C40, SM-4
- **Rule:** saisonnalité, fin de vie commerciale, élasticité, reprise fournisseur sont **publiés aux
  modules qui décident**. ⛔ **Ce service ne refuse rien** — il rend le refus possible.
- **Rule:** ⚡ **un article sans profil renseigné est identifiable comme tel.** Un profil absent
  **n'est pas un profil neutre** : c'est une information manquante, et elle doit se voir. `AUCUNE`
  compte comme une réponse ; le vide ne compte pas.
- **Rule:** la **fin de vie commerciale est distincte de toute date limite de consommation**. *Un
  maillot d'une compétition passée n'est pas périmé : il est invendable.*
- **Rule:** l'élasticité est **saisie ou héritée d'une famille**, jamais mesurée par le système au v1
  (A4).

### AD-11 — La grille porte sa devise, son régime de taxe, et ses prix par unité

- **Binds:** FR-C13, FR-C13b, FR-C13c, FR-C13d, FR-C15, FR-C17
- **Rule:** un prix est porté **par article ET par unité** — le prix du carton n'est pas 20 fois celui
  de l'unité.
- **Rule:** une grille porte **sa devise**, et **les prix ne se convertissent jamais entre grilles**.
  Montants en **entier d'unité mineure**, décimales de la devise ⚠️ **XOF : zéro**.
- **Rule:** une grille déclare **HT ou TTC**, et l'article porte son **régime de taxe**. Sans cela, la
  Facturation ne peut pas produire une facture conforme et la comptabilité n'a **aucune source pour la
  TVA collectée**.
- **Rule:** une grille est **versionnée** : la modifier crée une version ; un prix ayant servi reste
  consultable tel qu'il était (cohérent avec AD-5).
- **Rule:** les **conditions d'application sont des DONNÉES, pas du code** (zone, catégorie de client,
  seuil de volume). ⚠️ La zone est une **référence opaque** au v1 (A2) — `reseau-service` (EPIC-051) la
  rendra résoluble, il ne l'impose pas.

### AD-12 — L'import est tout ou rien, et n'écrase jamais un engagement

- **Binds:** FR-C45, FR-C45b, FR-C45c, FR-C46, FR-C47
- **Rule:** **compte rendu AVANT persistance** — créations, mises à jour, lignes rejetées et motif.
  Rien n'est écrit avant que l'utilisateur ait vu ce qui va l'être.
- **Rule:** ⛔ **tout ou rien.** Un catalogue à moitié importé est **plus difficile à réparer qu'un
  import à refaire**.
- **Rule:** clé de rapprochement = **référence article**, à défaut un identifiant externe déclaré. Une
  ligne sans clé résoluble est **rejetée**, ⛔ jamais créée « au cas où ».
- **Rule:** ⛔ l'import **n'écrase jamais** un prix figé sur un engagement, ni un facteur historique.

### AD-13 — Module du vertical Distributeur : entitlement et gate

- **Binds:** moule commun · packs livrés
- **Rule:** le module est octroyé par **entitlement** de `platform-catalog-service`, et le service porte
  un gate local **`@RequiresCatalogueProduitsAccess`** = `emailVerified` + KYC `APPROVED` + entitlement
  `ACTIVE`, lu dans les read-models locaux.
- **Rule:** ⚠️ **Aucun des six modules du pack distributeur n'est enregistré au catalogue** — il
  n'existe pas de seed de `Module`, ils se créent par l'API admin. Le provisioning rend donc **422** en
  vol. ⇒ **story hors de ce service** (voir §Ce que cette spine impose ailleurs).

### AD-14 — Le nom est un piège connu, et le code de module est arrêté [ARBITRÉ PO 2026-08-15]

- **Rule:** le code de module devient **`catalogue-produits`**, et non `catalogue` comme les packs
  livrés le déclarent aujourd'hui. ⚠️ **Ce renommage touche un livrable** —
  `packs.seed-data.ts` (`platform-catalog-service`) **et** sa migration frontend
  `vertical-packs.ts` — ⇒ **story hors de ce service**.
- **Rule:** ⛔ dans tout ce service, `catalog` **nu** est interdit. `platform-catalog-service` catalogue
  les **modules Prospera** ; celui-ci catalogue les **produits qu'un distributeur vend**. Types,
  topics et collections portent **`Produit`** ou **`CatalogueProduits`** sans exception.
- **Rule:** même discipline qu'AD-15 de `reseau-service` sur l'homonyme « portée ». Ce programme
  compte désormais **deux homonymes majeurs** ; les nommer coûte moins cher que de les démêler.

### AD-15 — La route plateforme : `orgId` explicite, lecture seule, journalisée [ARBITRÉ PO 2026-08-15]

- **Binds:** **AD-P16** (écosystème v1.6) · **Prevents:** un cloisonnement contourné en silence
- **Rule:** les routes de lecture plateforme sont réservées à `PLATFORM_ADMIN` et prennent l'**`orgId`
  en PARAMÈTRE EXPLICITE** — ⛔ **jamais tiré du jeton**. Un opérateur plateforme n'a pas d'org ; lui
  en inventer une par défaut ferait de l'exception un chemin ordinaire.
- **Rule:** ⛔ **lecture seule**, ⛔ **une organisation à la fois**. Pas d'export en masse, pas de
  balayage inter-org : le rayon d'action d'un compte compromis est borné par ce qui a été réellement
  consulté, et le journal le dit.
- **Rule:** **tout accès est journalisé** — opérateur, organisation, date, **motif**. Un accès sans
  motif n'est pas un accès autorisé. Ce journal est **celui de la plateforme**, distinct des deux
  journaux d'AD-7.
- **Rule:** ces routes **lisent, elles ne dupliquent pas**. Ni read-model plateforme consolidé, ni
  agrégation permanente au BFF : la carte de propriété ne bouge pas.
- **Rule:** ⚠️ ce sont les **seules** routes du service où le gate d'AD-13 ne s'applique pas — un
  opérateur Money Vibes n'a ni KYC ni entitlement. Elles portent leur propre garde,
  **`@PlatformReadOnly`**, et rien d'autre du service ne doit l'employer.

---

## Consistency Conventions

| Sujet | Convention |
| --- | --- |
| Collections | `articles`, `conditionnements`, `grilles`, `promotions`, `profils_commerciaux`, `grilles_freelance` *(à part, AD-6)*, `catalogue_journal` + `catalogue_journal_freelance` *(à part, AD-7)* |
| Montants | Entier d'unité mineure + devise ⚠️ **XOF : zéro décimale** |
| Quantités | **Toujours** `{ valeur, unite }` — jamais un nombre nu (AD-9) |
| Absence de prix | `PAS_DE_PRIX`, code machine stable — jamais `0`, jamais `null` interprétable |
| Refus | `UNITE_DE_BASE_IMMUABLE`, `PRIX_FREELANCE_SANS_PRIX_SOCIETE`, `ARTICLE_PORTE_ENGAGEMENTS` |
| Nommage | ⛔ `catalog` nu interdit (AD-14) |
| Topics | `CatalogueProduitsTopic` — énumération propre |

## Stack

NestJS · MongoDB (base propre) · Kafka (producteur `catalogue-produits.*` ; consommateur `identity.*`,
`kyc.status.changed`, `entitlement.changed`) · JWT RS256 en relying-party.

## Capability → Architecture Map

| Incrément PRD | Gouverné par |
| --- | --- |
| **1 — L'article existe et se compte** (A · B · H, ~29 pts) | AD-1, AD-2, AD-3, AD-4, AD-9, AD-13 |
| **2 — Le prix se résout** (C · D · E · I, ~34 pts) | AD-5, AD-11, AD-12 |
| **3 — Le catalogue sert les autres** (F · G · J, ~26 pts) | **AD-6, AD-7, AD-8**, AD-10 |

⚠️ L'incrément **3** porte les deux différenciateurs — la confidentialité freelance et le profil qui
permet de refuser. Le PRD le dit « le seul décalable » ; **AD-6 le rend le plus risqué** : son erreur
est un manquement à un engagement de confidentialité envers des tiers, pas un défaut fonctionnel.

---

## ⚡ Ce que cette spine impose AILLEURS — 3 stories hors de ce service

| # | Où | Quoi |
| --- | --- | --- |
| **1** | `auth-service` | **Extension du RBAC au périmètre tenant** (AD-P15). `FR-C48` en dépend entièrement. ⚠️ Service **livré et central** : story dédiée, consommateurs nommés, borne de croissance de `perms[]` fixée. |
| **2** | `platform-catalog-service` + `frontend-admin-panel` | **Renommage `catalogue` → `catalogue-produits`** dans `packs.seed-data.ts` et `vertical-packs.ts` (AD-14). Même forme qu'AP-25. |
| **3** | `platform-catalog-service` | **Enregistrement des six modules du pack distributeur** au catalogue. Le gap existe **indépendamment de ce PRD** : le provisioning rend 422 en vol depuis le 2026-08-11. |

## ⚡ Amendements au PRD

| Exigence | Amendement |
| --- | --- |
| **FR-C48** | ⛔ Sa prémisse était fausse — le catalogue de permissions est **plateforme** (D15), `perms: []` pour tout tenant. **AD-P15** l'étend au tenant ⇒ FR-C48 devient tenable, **mais conditionnée à une story `auth-service`** |
| **FR-C49** | ⚠️ **Contredisait NFR-4.** Tranché par **AD-7** : journal **partitionné**, celui du freelance lisible du seul freelance |
| **NFR-4** | ➕ Mécanisme nommé : **collection séparée + dépôt exigeant le propriétaire** (AD-6). `PLATFORM_ADMIN` **n'est pas une exception** |
| **NFR-1** | ➕ Mécanisme nommé : **suite de conformité + registre des consommateurs**, aligné sur `reseau-service` (AD-9) |
| **§10** | ➕ Le module est octroyé par **entitlement**, code **`catalogue-produits`** (AD-13, AD-14) |

## Deferred

| Différé | Pourquoi | Revient quand |
| --- | --- | --- |
| Articles au poids / volume variable | **A1** — facteurs entiers au v1 | 1ᵉʳ client vendant du vrac |
| Catalogue partagé multi-organisations | **Q2, OUVERTE** — `A3` pose un article = une org. ⚠️ **À verrouiller comme Q1 l'a été** : si elle bascule, c'est un changement de modèle de la même gravité, et elle n'a pas encore de dépendant identifié — **elle en aura un** | Avant l'incrément 1 |


| Élasticité mesurée par le système | **A4** — suppose un historique de promotions que les 1ᵉʳˢ clients n'ont pas | Module scoring & prévision |
