---
title: "PRD — Catalogue produits (catalogue-produits-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: catalogue-produits-service
position_sequence: 3
verticale: Distributeur
mode: coaching
---

# PRD — Catalogue produits (`catalogue-produits-service`)

**Position 3 de la séquence** · Verticale : **Distributeur** · Dépend du Bloc 0
Décisions tracées dans `.memlog.md`

> ⚠️ **À ne pas confondre avec `platform-catalog-service`** (livré, EPIC-007), qui catalogue les
> **modules Prospera**, leurs versions et les droits d'usage. Le présent service catalogue les
> **produits qu'un distributeur vend**. Deux objets sans aucun rapport, un mot commun.

---

## 1. Contexte et problème

### 1.1 La thèse

> **Un catalogue qui décrit est un annuaire. Un catalogue qui refuse est un outil.**

Cette phrase n'est pas de moi — elle est déjà écrite dans le prototype, et c'est la meilleure
définition du module :

> *« Les quatre causes de capital immobilisé ont toutes un point commun : au moment de l'achat,
> l'information qui aurait dit « non » existait déjà, mais elle n'était nulle part dans le système.
> On achetait donc à l'aveugle, et on découvrait la palette morte dix mois plus tard. […] Elles ne
> servent pas à décrire les produits : elles servent à refuser des commandes. »*
> — `profil-produit-registry.ts`

Le catalogue ne refuse pas lui-même — l'Approvisionnement et la Commande le font. Mais **il porte
l'information sans laquelle ils ne peuvent pas refuser**. C'est sa raison d'être.

### 1.2 Ce que le modèle actuel ne permet pas

| Constat dans le prototype | Ce qui devient impossible |
|---|---|
| Le **conditionnement est du texte libre dans le nom** — *« Pâtes 500g (carton 20) »* | Commander en cartons, convertir carton ↔ unité, valoriser un stock, comparer deux fournisseurs |
| `ProduitStock` **mélange produit et stock** : champs `stock`, `seuil`, `entrepot` **au singulier** | Tenir le même produit dans plusieurs entrepôts — contourné par une table annexe, ce qui prouve que ce sont deux objets |
| **Aucune double tarification** | La fonctionnalité la plus différenciante de l'offre distributeur — vendue dans les deux catalogues commerciaux — n'a aucun modèle |
| **Un prix unique par produit** | Les grilles par zone, par catégorie de client, par volume, et les promotions |

### 1.3 Une contradiction à trancher dans l'argumentaire

Les deux documents commerciaux se contredisent sur la visibilité des marges freelance :

| Document | Ce qu'il dit |
|---|---|
| `prospera_modules_bundles_distributeur.md` | *« La direction voit volumes et CA société, **sans exposer les marges freelance** »* |
| `prospera_modules_ia_distribution.md` §11 | *« Marge nette freelance (visible uniquement par l'indépendant **et la direction**) »* |

**Tranché** (décision utilisateur, 2026-08-02) : **la société ne voit pas** les prix que le freelance
pratique chez ses détaillants. L'argumentaire commercial devra être aligné sur ce point — c'est un
engagement de confidentialité vis-à-vis d'indépendants, pas un réglage d'affichage.

---

## 2. Vision produit

> Le catalogue est **le référentiel de ce qui se vend** : ce que c'est, sous quelle forme, à quel prix
> pour qui, et **ce qu'il faut savoir avant d'en acheter**.

Trois propriétés :

1. **L'unité est une mécanique, pas un libellé.** On achète en palettes, on stocke en unités, on vend
   parfois à l'unité un produit acheté en carton. Les conversions sont explicites et versionnées.
2. **Le prix n'est pas un nombre, c'est une résolution.** Une grille, une zone, un volume, une
   promotion en cours — le prix applicable se **calcule**, de façon déterministe et explicable.
3. **Le produit porte ce qui permet de le refuser.** Saisonnalité, fin de vie commerciale, élasticité,
   reprise fournisseur : l'information qui aurait dit « non ».

---

## 3. Le parcours qui porte le différenciateur — UJ-1

> **Ayaba** est commerciale indépendante à Sokodé. Elle achète à son distributeur au prix société et
> revend à une trentaine de boutiques dont elle a construit le portefeuille elle-même.
>
> Ce matin, elle négocie avec **deux** détaillants pour le même savon. Le premier, une grosse boutique
> du marché, lui prend 10 cartons et discute âprement : elle descend à 12 800 F le carton. Le second,
> une petite épicerie de quartier qui prend 2 cartons et paie comptant, accepte 14 000 F.
>
> Dans Prospera, elle enregistre **deux prix différents pour le même article** — un par point de vente.
> Elle voit sa marge sur chacun : le prix société qui lui est appliqué est 11 900 F le carton, donc
> 900 F sur le premier, 2 100 F sur le second.
>
> **Ce que son distributeur voit :** qu'Ayaba lui a commandé 12 cartons au prix société. **Rien
> d'autre.** Ni ses prix, ni ses marges, ni ce que paient ses détaillants.

**Ce que ce parcours impose** : le prix freelance par article **et par point de vente** (FR-C28), la
marge calculée contre le prix société réellement appliqué (FR-C31), et une étanchéité vérifiée au
niveau des données et non des écrans (NFR-4). Ce dernier point n'est pas une commodité : c'est un
**engagement de confidentialité vis-à-vis d'indépendants** qui ne sont pas salariés de l'entreprise.

---

## 4. Glossaire

| Terme | Définition |
|---|---|
| **Article** | Ce qui se vend, identifié par une référence unique dans l'organisation. Ne porte **aucun stock** — le stock est un autre module. |
| **Unité de base** | La plus petite unité dans laquelle un article peut être compté. **Le stock est toujours tenu en unité de base**, quelle que soit l'unité d'achat ou de vente. |
| **Conditionnement** | Un emballage dans lequel l'article circule (carton de 20, palette de 48 cartons), avec son **facteur de conversion** vers l'unité de base. |
| **Grille tarifaire** | Ensemble de prix applicable sous condition (zone, catégorie de client, volume). Un article peut relever de plusieurs grilles. |
| **Promotion** | Écart temporaire au prix de grille : soit une **remise** (pourcentage ou montant), soit un **prix promotionnel daté** qui se substitue. |
| **Prix résolu** | Le prix effectivement applicable dans un contexte donné, après application des grilles et des promotions. **Toujours explicable.** |
| **Grille société** | Prix de référence du distributeur, visible par tous ses utilisateurs. |
| **Grille freelance** | Prix qu'un commercial indépendant pratique, défini **par article et par point de vente**. **Invisible de la société.** |
| **Profil commercial** | Ce que l'article porte pour qu'on puisse refuser d'en acheter : saisonnalité, fin de vie commerciale, élasticité prix, reprise fournisseur. |
| **Fin de vie commerciale** | Date après laquelle l'article devient invendable au prix normal, **indépendamment de sa date limite de consommation**. Un maillot d'une compétition passée n'est pas périmé : il est invendable. |

---

## 5. Périmètre

### 5.1 Dans le périmètre

- Article, référence, classification, cycle de vie
- **Unité de base et conditionnements**, avec conversions versionnées
- **Grilles tarifaires** société et leur résolution
- **Promotions** : remise ponctuelle et prix promotionnel daté
- **Double tarification freelance** par article et par point de vente, avec isolation
- **Profil commercial** : saisonnalité, fin de vie commerciale, élasticité, reprise fournisseur
- Import et export de catalogue
- Publication vers les modules consommateurs

### 5.2 Hors périmètre

| Hors périmètre | Où ça vit |
|---|---|
| Quantités en stock, seuils, entrepôts, mouvements | **Stock** (#7) — c'est un autre objet, la preuve est dans le prototype |
| Prise de commande, panier, validation | **Commande** (#11) |
| Prix d'achat, conditions fournisseur, réapprovisionnement | **Approvisionnement** (#13) |
| **La décision de refuser** un achat ou une commande | Approvisionnement (#13), Commande (#11) — ce module **fournit l'information**, il ne décide pas |
| Facturation, avoirs, e-facture | **Facturation** (#17) |
| Recommandation de panier, prévision de demande | Module scoring & prévision (différé) |

---

## 6. Fonctionnalités & exigences (FR)

### A — Article

| # | Exigence |
|---|---|
| **FR-C01** | Un **article** porte : une référence **unique dans l'organisation**, un nom, une classification, une unité de base, un état de cycle de vie. Il ne porte **aucune quantité**. |
| **FR-C02** | La référence est **stable et non réutilisable** : une référence libérée par un article retiré n'est jamais réattribuée. L'historique des commandes et des factures y renvoie pour toujours. |
| **FR-C03** | Un article peut porter des **identifiants externes** : code-barres, référence fournisseur, référence douanière. Plusieurs identifiants pour un article, jamais le même identifiant pour deux articles actifs. |
| **FR-C04** | Un article porte des **médias** (photos) — le commercial en tournée montre le produit au détaillant. |
| **FR-C05** | Classification à **deux niveaux au moins** (catégorie, famille), propre à l'organisation. Aucune taxonomie imposée : un distributeur de boissons et un distributeur de pièces détachées ne classent pas pareil. |

### B — Unités & conditionnements ⚡

C'est la mécanique centrale. Elle est réclamée par un fait métier confirmé : **on vend à l'unité des
produits achetés en carton**.

| # | Exigence |
|---|---|
| **FR-C06** | Chaque article déclare **une unité de base** — la plus petite unité comptable. **Tout stock est tenu en unité de base**, sans exception. |
| **FR-C06b** | ⚡ **L'unité de base est immuable après création.** Le service refuse sa modification, quel que soit le rôle. Changer d'unité se fait par **article de remplacement** (FR-C44). Motif : tout le stock, tous les mouvements et toutes les commandes historiques y sont exprimés — la changer les rendrait faux **en silence**. |
| **FR-C07** | Un article déclare **zéro, un ou plusieurs conditionnements**, chacun avec son **facteur de conversion entier** vers l'unité de base (carton = 20 unités ; palette = 48 cartons = 960 unités). |
| **FR-C08** | Les conditionnements forment une **hiérarchie** : la palette contient des cartons, le carton contient des unités. Le facteur vers l'unité de base est calculé, jamais saisi deux fois. |
| **FR-C09** | Un conditionnement déclare ce qu'il autorise : **achetable**, **stockable**, **vendable**. Une palette peut être achetable sans être vendable. |
| **FR-C10** | ⚡ **Les facteurs de conversion sont versionnés.** Quand un fournisseur passe le carton de 20 à 24 unités, **les mouvements et commandes antérieurs conservent l'ancien facteur**. Modifier un facteur en place réécrirait silencieusement l'historique des quantités — et l'erreur ne se voit qu'à l'inventaire suivant, des mois plus tard. |
| **FR-C10b** | Le mécanisme est explicite : **tout engagement (commande, mouvement, document) stocke le facteur qu'il a utilisé**, il ne référence pas une version qui pourrait disparaître. Même principe que le tarif enregistré avec l'encaissement dans `paiement-service`. |
| **FR-C11** | Toute quantité échangée avec un autre module porte **son unité explicite**. Aucun nombre nu ne circule : `120` n'est pas une quantité, `120 unités` ou `120 cartons` en est une. |
| **FR-C12** | Les conversions sont **exactes en entiers**. Vendre 7 unités d'un article conditionné par 20 est autorisé si l'unité est vendable ; cela ne produit **jamais** un nombre fractionnaire de cartons dans un document. |

### C — Grilles tarifaires société

| # | Exigence |
|---|---|
| **FR-C13** | Une **grille tarifaire** porte un prix par article **et par unité** — le prix du carton n'est pas 20 fois le prix de l'unité. |
| **FR-C13b** | ⚡ **Aucun prix ne se déduit d'un autre.** Si une grille donne le prix du carton et pas celui de l'unité, le service répond « pas de prix » pour l'unité (FR-C26). Il ne divise jamais par le facteur de conversion : la remise de gros est précisément l'écart entre les deux, et la déduire l'efface. |
| **FR-C13c** | ⚡ Une grille porte **sa devise**. Un distributeur opérant dans plusieurs pays tient une grille par devise ; les prix ne se convertissent pas entre elles. Les montants suivent les mêmes règles d'exactitude que `paiement-service` : **stockage en entier d'unité mineure**, avec le nombre de décimales de la devise — ⚠️ **le XOF n'en a aucune**. |
| **FR-C13d** | ⚡ Une grille déclare si ses prix sont **hors taxes ou toutes taxes comprises**, et l'article porte son **régime de taxe** (taux applicable, exonération). Sans cette information, la Facturation ne peut pas produire une facture conforme et la comptabilité n'a pas de source pour la TVA collectée. |
| **FR-C14** | Une grille s'applique sous **conditions** : zone géographique, catégorie de client, seuil de volume. Les conditions sont des **données**, pas du code. |
| **FR-C15** | Une organisation détient **plusieurs grilles simultanées**. Une grille porte une période de validité. |
| **FR-C16** | Une grille a une **priorité explicite**. Deux grilles applicables au même contexte ne sont jamais départagées par un hasard d'implémentation. |
| **FR-C17** | Une grille est **versionnée** : la modifier crée une version. Un prix ayant servi à une commande reste consultable tel qu'il était. |

### D — Promotions

| # | Exigence |
|---|---|
| **FR-C18** | Deux formes, toutes deux nécessaires : une **remise** (pourcentage ou montant) appliquée au prix de grille, et un **prix promotionnel daté** qui s'y **substitue**. |
| **FR-C19** | Une promotion porte une **période**, un périmètre (articles, catégories, zones, clients) et une priorité. |
| **FR-C20** | ⚡ **Deux promotions applicables au même article ne se cumulent jamais implicitement.** La règle est explicite : la plus prioritaire s'applique, ou le cumul est déclaré autorisé sur la promotion. Le silence vaut non-cumul. |
| **FR-C21** | Une promotion peut être **plafonnée** : quantité maximale, montant maximal de remise consenti. Une promotion sans plafond sur un produit à forte élasticité peut coûter plus que la marge du mois. |
| **FR-C22** | Une promotion **expire d'elle-même**. Aucune promotion n'a besoin d'être désactivée manuellement pour cesser de s'appliquer. |

### E — Résolution du prix ⚡

| # | Exigence |
|---|---|
| **FR-C23** | Le service **résout un prix** pour un contexte donné — article, unité, quantité, client, zone, date — et retourne le prix **avec son explication** : quelle grille, quelle promotion, quelle condition remplie. |
| **FR-C24** | La résolution est **déterministe** : le même contexte donne toujours le même prix. Condition observable — rejouer 1 000 fois une résolution identique donne 1 000 fois le même résultat et la même explication. |
| **FR-C25** | ⚡ **Le prix est figé au moment de l'engagement** (commande, proforma) et conservé avec lui. Il n'est **jamais relu** ensuite. Une grille modifiée le mardi ne change pas ce qu'un détaillant doit sur une commande de lundi. |
| **FR-C26** | Si aucune grille ne s'applique, le service répond **« pas de prix »** — il ne retourne jamais un prix par défaut, un zéro, ou le dernier prix connu. Un prix inventé se propage jusqu'à la facture. |
| **FR-C27** | La résolution est **simulable** : un utilisateur habilité peut demander « quel prix pour cet article, ce client, cette quantité, à cette date ? » sans créer d'engagement. |

### F — Double tarification freelance ⚡

| # | Exigence |
|---|---|
| **FR-C28** | Un **commercial indépendant** définit ses propres prix de vente, **par article et par point de vente** — il négocie chaque détaillant séparément, et le modèle doit le permettre. |
| **FR-C29** | ⚡ **La société ne voit pas les prix pratiqués par un freelance chez ses détaillants.** Ce n'est pas un réglage d'affichage : aucune requête, aucun export, aucun tableau de bord, aucune restitution consolidée ne les expose. |
| **FR-C29b** | ⚡ **Une seule exception, et elle est encadrée : le départ du freelance.** Ses points de vente restent au distributeur (PRD PDV) ; ses prix lui sont alors **révélés**, pour que le service aux détaillants puisse continuer sans repartir de zéro. |
| **FR-C29c** | La révélation est un **événement daté, tracé et notifié au freelance** — jamais un accès qui s'ouvre en silence. Elle porte **uniquement les points de vente qui restent** au distributeur, et **uniquement les prix en vigueur au départ**, pas l'historique des négociations. |
| **FR-C29d** | ⚠️ **L'existence de cette exception doit figurer au contrat de l'indépendant.** Une promesse de confidentialité assortie d'une exception non annoncée n'est pas une promesse — et le freelance confie ici la matière de son fonds de commerce. *Action produit hors PRD.* |
| **FR-C30** | Un freelance ne voit **que ses propres prix**. Deux indépendants ne se voient pas. |
| **FR-C31** | La **marge du freelance** est calculée comme l'écart entre son prix client et **le prix société qui lui est effectivement appliqué** — celui que résout sa propre grille, avec sa zone et son volume, pas un prix de référence théorique. Elle est **visible du seul freelance**. |
| **FR-C32** | La **grille société reste visible** de tous : c'est le prix auquel le freelance achète, et il doit le connaître. La visibilité est **asymétrique par conception**. |
| **FR-C33** | Un prix freelance sans prix société correspondant est **refusé** : on ne peut pas revendre ce qu'on n'achète pas. |
| **FR-C34** | La vente d'un freelance à son détaillant est **hors des livres de la société**. Le catalogue ne doit produire aucune donnée qui ferait entrer ce chiffre d'affaires dans les états de la société. |

### G — Profil commercial

Ce groupe est la thèse du module : ce qui permet de **refuser**.

| # | Exigence |
|---|---|
| **FR-C35** | Un article porte une **saisonnalité** : aucune, saisonnière (avec ses mois de vente), ou événementielle. |
| **FR-C36** | Un article peut porter une **fin de vie commerciale** — date après laquelle il devient invendable au prix normal, **distincte de toute date limite de consommation**. |
| **FR-C37** | Un article porte une **élasticité prix** : de combien les ventes varient quand le prix baisse de 1 %. C'est ce coefficient qui dit si une décote peut réellement écouler un stock ou si elle ne fera que brader. |
| **FR-C38** | Un article peut porter un **taux de reprise fournisseur** : ce que le fournisseur reprend des invendus, et avec quelle décote. |
| **FR-C39** | Le profil est **publié aux modules qui décident** — Approvisionnement, Commande, Marketing. Ce module ne refuse rien lui-même ; il rend le refus possible. |
| **FR-C40** | Un article **sans profil renseigné** est identifiable comme tel. Un profil absent n'est pas un profil neutre : c'est une information manquante, et elle doit se voir. |

### H — Cycle de vie

| # | Exigence |
|---|---|
| **FR-C41** | États explicites : `brouillon → actif → suspendu → retiré`. Seul un article **actif** peut être commandé. |
| **FR-C42** | Un article **retiré** n'est jamais supprimé : les commandes et factures passées y renvoient. |
| **FR-C43** | Le retrait d'un article portant du stock ou des commandes en cours est **refusé**, avec le détail de ce qui l'empêche. |
| **FR-C44** | Un article peut **remplacer** un autre (changement de format, de fournisseur). La filiation est enregistrée et restituée. |

### I — Import, export & administration

| # | Exigence |
|---|---|
| **FR-C45** | **Import de catalogue** par fichier, avec compte rendu **avant** persistance : créations, mises à jour, lignes rejetées et motif. Rien n'est écrit avant que l'utilisateur ait vu ce qui va l'être. |
| **FR-C45b** | La **clé de rapprochement** d'une ligne d'import est la **référence article**, à défaut un identifiant externe déclaré (code-barres, référence fournisseur). Une ligne sans clé résoluble est rejetée, jamais créée « au cas où ». |
| **FR-C45c** | Un import est **tout ou rien** : si une ligne échoue, aucune n'est écrite. Un catalogue à moitié importé est plus difficile à réparer qu'un import à refaire. |
| **FR-C46** | L'import **n'écrase jamais** un prix figé sur un engagement, ni un facteur de conversion historique. |
| **FR-C47** | Export du catalogue et des grilles, dans un format réimportable. |
| **FR-C48** | Droits distincts au catalogue de permissions plateforme : gérer les articles, gérer les grilles société, gérer les promotions, gérer son propre tarif freelance, consulter. |
| **FR-C49** | Toute modification de prix, de grille, de promotion ou de facteur de conversion est **journalisée** : qui, quoi, quand, valeur avant et après. |

### J — Publication

| # | Exigence |
|---|---|
| **FR-C50** | Le catalogue **publie ses changements** (article créé, modifié, retiré ; grille publiée ; promotion ouverte ou close) à destination des modules consommateurs. |
| **FR-C51** | Le service expose un **fournisseur de candidats** pour le moteur de règles de l'assistant IA — par exemple « articles dont la fin de vie commerciale est dans 60 jours ». Contrat défini au PRD Assistant IA (FR-IA03b). |
| **FR-C52** | Cloisonnement strict par organisation. Le catalogue d'un distributeur n'est jamais visible d'un autre. |

---

## 7. Exigences non fonctionnelles (NFR)

### NFR-1 — Aucune quantité sans unité *(structurante)*

Aucun nombre représentant une quantité ne circule sans son unité, ni dans l'API, ni dans les
événements publiés, ni dans les documents. C'est la seule protection contre l'erreur la plus coûteuse
de la distribution : **commander 120 quand on voulait 120 cartons**, ou l'inverse.

### NFR-2 — Historique des conversions préservé

Un facteur de conversion modifié ne réécrit jamais le passé. Condition observable : après changement
du carton de 20 à 24, une commande antérieure restituée affiche toujours ses quantités d'origine.

### NFR-3 — Déterminisme et explicabilité du prix

Toute résolution de prix est reproductible **et** explicable. Un prix qu'on ne peut pas justifier
devant un client est un prix qu'on ne peut pas défendre.

### NFR-4 — Étanchéité de la tarification freelance

L'isolation de FR-C29 est vérifiée au niveau des données, pas des écrans. Condition observable : un
utilisateur de la société, quel que soit son rôle — y compris administrateur — ne peut obtenir un
prix freelance par **aucun** chemin : API, export, agrégat, journal, message d'erreur.

### NFR-5 — Le prix figé prime toujours

Aucun recalcul de prix ne s'applique rétroactivement à un engagement existant.

### NFR-6 — Cloisonnement par organisation

Articles, grilles, promotions, profils, tarifs freelance.

---

## 8. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Articles dont le conditionnement est exprimé en texte libre | **0** | La mécanique d'unités remplace le libellé |
| **SM-2** | Résolutions de prix non reproductibles ou sans explication | **0** | NFR-3 |
| **SM-3** | Fuites d'un prix freelance vers un utilisateur de la société | **0** | NFR-4 — engagement de confidentialité |
| **SM-4** | Articles actifs portant un profil commercial **complet** — les quatre champs renseignés, `AUCUNE` comptant comme une réponse | **> 80 %** *(cible proposée)* | La thèse du module : sans profil, on ne peut pas refuser |
| **SM-5** | Prix résolus « pas de prix » sur des articles actifs | **tendance décroissante** | Les grilles couvrent réellement le catalogue |
| **SM-6** | Écarts de quantité constatés à l'inventaire imputables à une conversion | **0** | NFR-1 et NFR-2 |

### Contre-métriques

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | Nombre de grilles et de promotions simultanément actives | Hausse continue. Une résolution peut rester **déterministe pour la machine** et devenir **incompréhensible pour le commercial** qui doit expliquer un prix à son détaillant. La complexité tarifaire se paie au comptoir |
| **CM-2** | Articles créés puis jamais commandés en 6 mois | Hausse — un catalogue qui enfle sans se vendre est un coût de gestion, pas une offre |

---

## 9. Découpage en incréments

| Incrément | Pts est. | Titre | Critère de sortie |
|:--:|:--:|---|---|
| **1** | ~29 | **L'article existe et se compte** — A · B · H : article, classification, unité de base, conditionnements, conversions versionnées, cycle de vie | Un article acheté en cartons se vend à l'unité, et un changement de facteur ne réécrit aucun historique |
| **2** | ~34 | **Le prix se résout** — C · D · E · I : grilles, promotions, résolution explicable, prix figé, import/export | Le même contexte donne toujours le même prix, avec son explication ; une grille modifiée ne change aucune commande passée |
| **3** | ~26 | **Le catalogue sert les autres** — F · G · J : double tarification freelance, profil commercial, publication | Aucun utilisateur de la société n'atteint un prix freelance, par aucun chemin |

**Pourquoi cet ordre.** L'incrément 1 est le socle : sans unités, aucun prix n'a de sens. L'incrément 2
rend le catalogue utilisable par la Commande. L'incrément 3 porte les deux différenciateurs — la
confidentialité freelance et le profil qui permet de refuser — et il est le seul décalable.

---

## 10. Dépendances

| Dépendance | État | Impact |
|---|---|---|
| Identité, isolation, catalogue de permissions | ✅ livré | — |
| **Stock** (#7) | ⬜ à construire — **après ce module** | Le catalogue ne détient aucune quantité ; il publie les articles que Stock suivra |
| **Commande** (#11) | ⬜ | Consommateur principal de la résolution de prix |
| **Approvisionnement** (#13) | ⬜ | Consommateur du profil commercial |
| **Réseau, agences & zones** (#4) | ⬜ à construire | **Les grilles par zone (FR-C14) supposent une définition des zones.** Au v1 la zone est une référence opaque fournie par l'appelant *[ASSUMPTION A2]* |
| **Assistant IA** (#6) | ⬜ | Consommateur du fournisseur de candidats (FR-C51) |

---

## 11. Risques

| # | Risque | Traitement |
|---|---|---|
| **R1** | La complexité tarifaire devient ingérable : le commercial ne sait plus expliquer un prix | **CM-1** en fait un signal surveillé. FR-C23 impose l'explication avec le prix |
| **R2** | Un facteur de conversion modifié réécrit l'historique des quantités — erreur invisible jusqu'à l'inventaire | **FR-C10 + NFR-2.** C'est le défaut le plus coûteux du module et le plus silencieux |
| **R3** | Un prix freelance fuit vers la société par un agrégat ou un export non prévu | **NFR-4** exige la vérification par **tous** les chemins, pas seulement les écrans |
| **R4** | La contradiction de l'argumentaire commercial sur la visibilité des marges freelance n'est pas corrigée, et un client découvre l'écart | Signalé en §1.3. **Action produit hors PRD** : aligner les deux documents |
| **R5** | Le catalogue enfle : des milliers d'articles dont une minorité se vend | **CM-2**, et FR-C41 (cycle de vie) donne le moyen de suspendre |

---

## 12. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | Unité de base : peut-elle changer après création d'un article ? | ✅ **tranchée 2026-08-02 — NON, jamais.** Le changement se fait par article de remplacement (FR-C44). **Motif rendu impératif par le PRD Stock** : tout le stock historique est exprimé dans cette unité ; la changer rendrait **toutes les quantités passées fausses en silence**, sans qu'aucun contrôle ne le signale. La laisser ouverte alors qu'un autre module en dépend serait le motif de défaut déjà relevé trois fois dans ce chantier |
| Q2 | Un article peut-il relever de plusieurs organisations (catalogue partagé entre distributeurs d'un même groupe) ? | ouverte — FR-C52 pose le cloisonnement strict en attendant |
| Q3 | Les grilles par volume s'appliquent-elles par ligne ou par commande entière ? | ✅ **tranchée — par ligne.** Les FR l'avaient déjà décidé (FR-C14 pose le seuil de volume en condition de grille, FR-C23 prend la quantité en entrée) : la laisser « ouverte » était une contradiction. Ce qui reste ouvert est **Q5**, distinct |
| **Q5** | Les **remises de pied de commande** (sur le total, tous articles confondus) — dans ce module ou dans Commande (#11) ? | ouverte — mon avis : **Commande**, parce qu'elles ne portent sur aucun article en particulier |
| Q4 | Le prix freelance est-il plafonné par la société (prix maximum conseillé) ? | ouverte — question commerciale : encadrer un indépendant ou pas |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| **A1** | Les facteurs de conversion sont des **entiers** — un carton contient un nombre entier d'unités. Les articles vendus au poids ou au volume variable ne sont pas couverts au v1 | FR-C07, FR-C12 | 1ᵉʳ client vendant du vrac |
| **A2** | La zone est une **référence opaque** fournie par l'appelant tant que le module Réseau & zones (#4) n'existe pas | FR-C14, §9 | PRD Réseau & zones |
| **A3** | Un article appartient à une seule organisation ; il n'y a pas de catalogue partagé entre distributeurs | FR-C52, Q2 | 1ᵉʳ groupe multi-sociétés |
| **A4** | L'élasticité prix est **saisie ou héritée d'une famille**, pas mesurée par le système au v1 — la mesure suppose un historique de promotions que les premiers clients n'ont pas | FR-C37 | Module scoring & prévision (différé) |
