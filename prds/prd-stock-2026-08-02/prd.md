---
title: "PRD — Stock (stock-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: stock-service
position_sequence: 7
verticale: Distributeur
mode: coaching
---

# PRD — Stock (`stock-service`)

**Position 7 de la séquence** · Verticale : **Distributeur** · Dépend du **Catalogue (#3)**
Décisions tracées dans `.memlog.md`

---

## 1. Contexte et problème

### 1.1 La thèse — le stock qui dort ne crie pas

> *« Un catalogue de distribution n'est jamais composé que de références saines : il traîne toujours
> des palettes qu'on n'ose pas regarder. Elles ne provoquent aucune rupture, aucune alerte, aucun cri
> du commercial — **elles coûtent simplement 22 % de leur valeur par an, en silence**. »*
> — `stock-registry.ts`

**Le stock qui manque crie. Le stock qui dort ne dit rien.** Un module qui n'alerte que sur les
ruptures traite la moitié du problème, et pas la plus chère : la rupture se voit et se corrige en
jours ; le capital immobilisé se découvre après dix mois, quand il est trop tard pour l'écouler
autrement qu'à perte.

Le prototype nomme les **quatre façons classiques** d'y arriver, et elles structurent le groupe H :

| Cas | Ce qui l'a produit |
|---|---|
| **Invendu de campagne** | Commandé pour un événement, l'événement est passé. Obsolescence commerciale, pas péremption |
| **Achat d'opportunité** | Trois palettes pour décrocher une remise volume. *« La remise était réelle ; la demande, non. »* Dix mois de couverture |
| **Frais commandé au rythme d'un sec** | La couverture dépasse la durée de vie. Une partie du lot périme **en chambre froide, pas en rayon** |
| **Saisonnier bloqué** | Ne tourne qu'à la saison des pluies, occupe des emplacements toute l'année |

### 1.2 Ce que le modèle actuel ne permet pas

| Constat | Conséquence |
|---|---|
| `ProduitStock` porte `stock`, `seuil`, `entrepot` **au singulier** | Un article ne peut pas exister dans deux entrepôts — contourné par une table annexe |
| **Aucune valorisation** : ni coût d'entrée, ni CUMP, ni FIFO | **`bilan-service` tourne déjà** et n'a aucune source pour les comptes de classe 3 ni la variation de stock. Le distributeur a un bilan faux |
| **Ni lot ni date limite** | Le troisième cas de stock mort *est* un problème de DLC, et le garde-fou anti-stock-mort la confronte — sans qu'aucun champ ne la porte |
| **Le stock est un compteur**, pas une somme de mouvements | Aucune traçabilité : on ne peut pas répondre à « pourquoi 45 et pas 80 ? » |

---

## 2. Vision produit

> Le stock répond à trois questions et à une quatrième que personne ne pose :
> **où en est-on**, **combien ça vaut**, **qu'est-ce qui va manquer** — et **qu'est-ce qui dort**.

Trois propriétés :

1. **Le stock est la somme de ses mouvements**, jamais un compteur qu'on corrige. Toute quantité
   s'explique par la suite d'événements qui l'a produite.
2. **Le stock a une valeur, et cette valeur va au bilan.** Automatiquement quand la comptabilité est
   là, manuellement sinon.
3. **Le dormant est aussi visible que la rupture.** Les deux coûtent ; un seul se voit.

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| **Entrepôt** | Lieu physique où du stock est détenu. Porte son type, sa capacité et les zones qu'il dessert. **Les opérations qui s'y déroulent** (picking, quai, chargement) relèvent du module Opérations entrepôt (#12). |
| **Emplacement** | Subdivision d'un entrepôt (allée, travée, chambre froide). Optionnel. |
| **Stock détenu** | Quantité d'un article dans un entrepôt, **toujours exprimée en unité de base** du catalogue. |
| **Mouvement** | Événement qui fait varier un stock : entrée, sortie, transfert, ajustement. **Append-only.** Le stock est leur somme. |
| **Lot** | Sous-ensemble d'un article partageant une origine et une date limite. **Activable par article.** |
| **Date limite** | Date au-delà de laquelle un lot n'est plus vendable. Distincte de la **fin de vie commerciale** portée par le catalogue. |
| **Valorisation** | Valeur comptable du stock détenu. Méthode **CUMP par défaut, configurable**. |
| **Couverture** | Nombre de jours de vente que le stock actuel permet de tenir, au rythme observé. |
| **Stock dormant** | Stock dont la couverture excède largement sa rotation utile, ou dont la date limite arrivera avant l'écoulement. |
| **Stock réseau** | Estimation du stock détenu **par les détaillants** — qui n'appartient pas au distributeur. Deux sources, jamais une. |

---

## 4. Périmètre

### 4.1 Dans le périmètre

- **Entrepôts et emplacements** — le lieu
- **Stock détenu** par article et par entrepôt, en unité de base
- **Mouvements** append-only : entrée, sortie, transfert, ajustement
- **Lots et dates limites**, activables par article
- **Valorisation** CUMP configurable, et **alimentation automatique du bilan**
- **Seuils, couverture, alertes de rupture**
- **Stock dormant et capital immobilisé** — les quatre cas
- **Inventaire** : tournant, classification ABC, écarts
- **Transferts inter-entrepôts**
- **Stock du réseau détaillant** : deux sources et leur écart
- Publication vers les modules consommateurs

### 4.2 Hors périmètre

| Hors périmètre | Où ça vit |
|---|---|
| Article, unités, conditionnements, prix, profil commercial | **Catalogue (#3)** — ce module n'invente aucun article |
| Picking, expédition, chargement, réception physique, contrôle quai | **Opérations entrepôt (#12)** |
| Décision de réapprovisionner, choix du fournisseur, commande d'achat | **Approvisionnement (#13)** — ce module **fournit le signal**, il ne commande pas |
| Zones commerciales et leur découpage | **Réseau & zones (#4)** — référencées ici, définies là-bas |
| Écritures comptables | **Comptabilité / `bilan-service`** — ce module publie une valeur, il n'écrit pas le journal |
| Prévision de demande par modèle statistique | Module scoring & prévision (différé) |

---

## 5. Fonctionnalités & exigences (FR)

### A — Entrepôts & emplacements

| # | Exigence |
|---|---|
| **FR-S01** | Un **entrepôt** porte un nom, un type (principal, régional, dépôt avancé), une localisation, un **pays**, une **devise**, un responsable, et les **zones commerciales qu'il dessert** — référencées, non définies ici *[ASSUMPTION A1]*. La devise est celle dans laquelle son stock est valorisé ; elle ne se convertit pas (même règle que le catalogue et `paiement-service`). |
| **FR-S02** | Un entrepôt peut porter des **emplacements** (allée, travée, chambre froide). Leur usage est **facultatif** : un dépôt de quartier n'en a pas besoin, un entrepôt de 2 000 références oui. |
| **FR-S03** | Un emplacement peut porter des **contraintes** — température, incompatibilités. Un jus réfrigéré rangé au sol est une perte annoncée. |
| **FR-S04** | Un entrepôt porte une **capacité** exprimée dans l'unité qui a du sens pour l'organisation (palettes, m², m³). |
| **FR-S05** | Un entrepôt se **ferme** sans être supprimé : son historique de mouvements reste lisible. La fermeture est refusée tant qu'il détient du stock. |
| **FR-S05b** | ⚡ **Deux natures de point de stock, toutes deux détenues par l'organisation** : l'**entrepôt** (stockage et éclatement) et le **magasin propre** (magasin de l'enseigne, qui vend au détail). **Un magasin n'est pas un entrepôt** — il ne fait pas d'éclatement. **Un entrepôt peut vendre directement** : la vente au détail est une **capacité**, pas une nature. |
| **FR-S05c** | ⚡ **Le stock d'un magasin propre est valorisé et entre au bilan exactement comme celui d'un entrepôt** — il appartient à l'organisation. Il est suivi par **mouvements réels**, jamais estimé. Seul le stock d'un **détaillant partenaire** est estimé (groupe K) et exclu de toute valorisation. |

### B — Stock détenu

| # | Exigence |
|---|---|
| **FR-S06** | Le stock est tenu par **(article, entrepôt)** et, si le lot est activé, par **(article, entrepôt, lot)**. |
| **FR-S07** | ⚡ Toute quantité est exprimée en **unité de base du catalogue** (FR-C06). Aucune quantité n'est stockée dans une autre unité — l'affichage convertit, le stockage jamais. |
| **FR-S08** | Le stock distingue **physique**, **réservé** (engagé sur une commande non livrée) et **disponible**. Vendre du réservé est la façon la plus courante de créer une rupture qui n'aurait pas dû exister. |
| **FR-S08b** | La **réservation est posée par les modules qui engagent** — Commande (#11) au premier chef — jamais décidée ici. Ce module tient le compteur, il ne réserve pas de lui-même. |
| **FR-S08c** | ⚠️ **Commande (#11) est en position 11 ; ce module en 7.** À sa construction, aucune source de réservation n'existe. **Comportement du v1 : `réservé = 0`, donc `disponible = physique`.** Le champ existe, l'API le publie, et il se remplira sans changement de contrat quand Commande arrivera. Ce qui est écrit ici pour éviter qu'un lecteur croie la réservation opérationnelle au v1. |
| **FR-S09** | Le **stock négatif est refusé par défaut**. Il peut être autorisé explicitement par article ou par entrepôt, et tout stock négatif est alors signalé, jamais silencieux. |
| **FR-S10** | Le stock d'un article est **restituable à une date passée** : « combien en avais-je le 31 décembre ? » est la question de la clôture comptable, et elle doit avoir une réponse. |

### C — Mouvements

| # | Exigence |
|---|---|
| **FR-S11** | ⚡ **Le stock est la somme de ses mouvements**, jamais un compteur modifié en place. Recalculer un stock à partir de ses mouvements doit redonner exactement la valeur courante. |
| **FR-S12** | Types de mouvement : **entrée** (réception, retour client), **sortie** (livraison, perte, casse, péremption), **transfert** entre entrepôts, **ajustement** d'inventaire. Chaque type porte son motif. |
| **FR-S13** | Un mouvement est **append-only** : on ne le modifie pas, on le contre-passe. L'historique reste lisible. |
| **FR-S14** | Un mouvement porte : article, entrepôt, lot le cas échéant, quantité en unité de base, **le facteur de conversion utilisé** (FR-C10b), sa valeur unitaire, son auteur, son horodatage, sa pièce d'origine. |
| **FR-S15** | Un mouvement est **idempotent** à la source : rejouer une réception ne double pas le stock. |
| **FR-S16** | Un ajustement d'inventaire exige un **motif** et, au-delà d'un seuil — **défaut : 100 000 unités mineures de valeur**, paramétrable par organisation — une **validation** par un rôle habilité. Un ajustement libre et illimité vide le module de son sens. |

### D — Lots & dates limites

| # | Exigence |
|---|---|
| **FR-S17** | Le **suivi par lot est activable article par article** — c'est le client qui décide. La logique est construite pour tous ; elle ne s'impose à personne. |
| **FR-S18** | Un lot porte : identifiant, date d'entrée, **date limite**, origine (fournisseur, réception). |
| **FR-S19** | Sur un article suivi par lot, les sorties respectent une **règle d'écoulement** — par défaut **la date limite la plus proche d'abord**, configurable. |
| **FR-S20** | Le stock d'un article suivi par lot expose sa **répartition par échéance** : combien périme dans 30, 60, 90 jours. |
| **FR-S21** | Un lot **dont la date limite est dépassée** sort du disponible automatiquement et devient une perte constatée à traiter — jamais un stock fantôme qu'on croit vendable. |
| **FR-S22** | ⚡ **Alerte de couverture excessive** : quand la couverture d'un article dépasse le temps restant avant sa date limite, l'écart est signalé **avant** la péremption. C'est le troisième cas de stock mort, pris à temps. |

### E — Valorisation

| # | Exigence |
|---|---|
| **FR-S23** | Chaque entrée porte son **coût d'entrée**, dans la devise de l'entrepôt. |
| **FR-S24** | La **méthode de valorisation est configurable par organisation** : **CUMP par défaut** — coût unitaire moyen pondéré recalculé à chaque entrée — avec au moins **FIFO** en alternative. |
| **FR-S24b** | ⚡ **Articulation lot × méthode — la contradiction est tranchée ici.** Un lot porte son coût d'entrée (FR-S18/S23) ; le CUMP le dissout dans une moyenne. Les deux ne peuvent pas faire foi ensemble. **Règle : la méthode de l'exercice fait toujours foi au bilan.** Sous CUMP, le coût du lot est **informatif** — il sert la traçabilité et la négociation fournisseur, jamais la valeur comptable. Sous une méthode **par lot** (FIFO, coût réel), le coût du lot **devient** la valeur comptable. |
| **FR-S24c** | Le service **refuse** une configuration où une méthode par lot est choisie sur un article dont le suivi par lot n'est pas activé. Une valorisation par lot sans lot n'a pas de sens, et l'accepter produirait une valeur silencieusement fausse. |
| **FR-S25** | La méthode est **figée par exercice** : on n'en change pas en cours d'exercice, et le changement est tracé. Changer de méthode en cours d'année rend la variation de stock incomparable. |
| **FR-S26** | La valorisation est **rejouable** : recalculer la valeur d'un stock à partir de ses mouvements et de la méthode redonne exactement la valeur publiée. |
| **FR-S27** | Les montants suivent les mêmes règles d'exactitude que `paiement-service` et le catalogue : **entier d'unité mineure**, décimales de la devise — ⚠️ **le XOF n'en a aucune**. |
| **FR-S28** | La valeur du stock est restituable **par entrepôt, par catégorie et à une date donnée** (FR-S10). |
| **FR-S29** | Les pertes — casse, péremption, écart d'inventaire négatif — sont valorisées et **restituées séparément**. Ce sont elles qui donnent le coût réel du stock mort. |

### F — Alimentation du bilan ⚡

| # | Exigence |
|---|---|
| **FR-S30** | À la clôture d'un exercice, le service publie la **valeur de stock**, la **variation de stock** de la période, et **les pertes ventilées par nature** — casse, péremption, écart d'inventaire — par catégorie comptable. Les fondre dans la variation empêcherait le comptable de les traiter au compte de résultat, alors qu'elles n'y ont pas le même sort. |
| **FR-S31** | ⚡ **Quand la comptabilité Prospera est présente, l'alimentation est automatique** : le comptable n'a rien à ressaisir. C'est le gain principal du module pour un client qui possède déjà le Bilan. |
| **FR-S32** | **Quand elle est absente, la valeur reste consultable et exportable** pour une saisie manuelle. Le stock ne dépend pas de la comptabilité — le couplage est **à sens unique**. |
| **FR-S33** | La valeur publiée est **figée avec l'exercice** : rouvrir un stock passé ne modifie pas une clôture déjà transmise. Une correction produit un nouvel événement, jamais une réécriture. |
| **FR-S34** | La publication porte **de quoi être auditée** : méthode utilisée, date d'arrêté, périmètre d'entrepôts, et le moyen de descendre au mouvement. |

### G — Seuils, couverture & ruptures

| # | Exigence |
|---|---|
| **FR-S35** | Un article porte un **seuil** et une **couverture minimale** par entrepôt — les deux, parce qu'un seuil fixe ne vaut rien sur un produit dont la demande double en saison. |
| **FR-S36** | La **couverture** est calculée sur le rythme de sortie observé, sur une période d'observation explicite — **défaut 30 jours**, paramétrable par article ou par catégorie. |
| **FR-S37** | **Alerte de rupture** — actuelle ou prévue à l'horizon du délai de réapprovisionnement. |
| **FR-S38** | Le service **publie ses signaux** vers Approvisionnement (#13) et l'assistant IA. Il ne commande rien et ne décide rien. |
| **FR-S39** | Le service expose un **fournisseur de candidats** pour le moteur de règles (`FR-IA03b`) : articles en rupture, en surstock, à date limite menacée. |

### H — Capital dormant ⚡

Le groupe qui porte la thèse. Les quatre cas du §1.1 ont chacun leur détection.

| # | Exigence |
|---|---|
| **FR-S40** | Le service calcule et restitue la **part du capital stock qui ne tourne plus** — en valeur et en pourcentage, pas seulement en nombre de références. |
| **FR-S41** | **Détection du surstock** : couverture très supérieure à la rotation utile de l'article. Cas de l'achat d'opportunité. |
| **FR-S42** | **Détection du dormant** : aucune sortie depuis une période paramétrable — **défaut 90 jours**. |
| **FR-S43** | **Détection de l'obsolescence commerciale** : la **fin de vie commerciale** portée par le catalogue (FR-C36) approche ou est dépassée, alors que du stock reste. Cas de l'invendu de campagne — le produit n'est pas périmé, il est invendable. |
| **FR-S44** | **Détection du saisonnier bloqué** : stock détenu hors de ses mois de vente (FR-C35), avec la durée avant la prochaine saison. |
| **FR-S45** | Chaque détection porte son **coût de portage estimé** — le capital immobilisé multiplié par un taux annuel paramétrable. Une alerte sans montant ne déclenche aucune décision. |
| **FR-S46** | Le service publie ces constats à Marketing (#10) et Approvisionnement (#13) : ce sont eux qui liquident ou cessent d'acheter. Ce module **mesure**, il ne décide pas. |

### I — Inventaire

| # | Exigence |
|---|---|
| **FR-S47** | **Classification ABC** des articles par valeur de rotation, pour cadencer les comptages. |
| **FR-S48** | **Inventaire tournant** : génération de tâches de comptage selon la classification, sans arrêter l'activité. |
| **FR-S49** | Un comptage produit un **écart** — jamais une écriture directe du stock. L'écart devient un ajustement (FR-S16) après validation. |
| **FR-S50** | Les écarts sont restitués **en quantité et en valeur**, par entrepôt, par article et par compteur. |
| **FR-S51** | **Inventaire complet** possible, avec gel des mouvements sur le périmètre compté pendant l'opération. |

### J — Transferts inter-entrepôts

| # | Exigence |
|---|---|
| **FR-S52** | Un **transfert** est un mouvement en deux temps : sortie de l'origine, entrée à la destination, avec un **état de transit** entre les deux. La marchandise sur la route n'est ni ici ni là-bas — elle est en transit, et elle a une valeur. |
| **FR-S53** | Un transfert peut être **partiellement reçu** : l'écart entre expédié et reçu est un constat, pas une perte automatique. |
| **FR-S54** | Le transfert **conserve les lots** : ce qui part d'un entrepôt arrive avec ses dates limites. |
| **FR-S55** | Le service **suggère des transferts** quand un entrepôt est en rupture et un autre en surstock sur le même article. Il suggère ; l'humain arbitre. |

### K — Stock du réseau détaillant

Ce groupe ne concerne **que les détaillants partenaires** — indépendants. Leur stock n'appartient pas
au distributeur : il est estimé, jamais connu. ⚠️ **Les magasins propres en sont exclus** : leur stock
est détenu, suivi par mouvements réels et valorisé (FR-S05c).

| # | Exigence |
|---|---|
| **FR-S56** | Le service maintient **deux sources** d'estimation du stock d'un point de vente : le **relevé du commercial** en visite, et l'**estimation déduite** des livraisons et du rythme de vente. |
| **FR-S57** | ⚡ **Les deux sources sont conservées et comparées** — jamais fondues en un chiffre unique. L'écart est la donnée utile. Motif : tous les détaillants n'acceptent pas d'être relevés, donc la couverture du relevé est partielle par nature. |
| **FR-S58** | Toute restitution de stock réseau **indique sa source et sa fraîcheur**. Un relevé de six semaines n'a pas le même statut qu'une estimation d'hier. |
| **FR-S59** | Le stock d'un **partenaire** est **explicitement distingué du stock détenu** : il n'entre dans **aucune valorisation**, dans aucune publication comptable, dans aucun total de point de stock. Le confondre gonflerait l'actif d'un bien qu'on ne possède pas — et l'inverse, traiter un magasin propre comme un partenaire, omettrait un actif réel. |
| **FR-S60** | Un écart durable entre relevé et estimation est **signalé** : soit le détaillant écoule autrement qu'on ne le croit, soit les livraisons ne sont pas ce qu'on pense. |

### L — Administration & publication

| # | Exigence |
|---|---|
| **FR-S61** | Droits distincts au catalogue de permissions : consulter, saisir un mouvement, valider un ajustement, réaliser un inventaire, configurer la valorisation, administrer les entrepôts. |
| **FR-S62** | **Configurer la méthode de valorisation** est un droit distinct et restreint : c'est une décision comptable, pas une opération de magasinier. |
| **FR-S63** | Le service **publie ses événements** : mouvement enregistré, alerte de rupture, alerte de dormant, valeur d'exercice publiée. |
| **FR-S64** | Cloisonnement strict par organisation. |
| **FR-S65** | Journal d'audit append-only sur les mouvements, ajustements, changements de méthode et fermetures d'entrepôt. |

---

## 6. Exigences non fonctionnelles (NFR)

### NFR-1 — Le stock est une somme, pas un compteur *(structurante)*

**Condition observable :** recalculer le stock de n'importe quel couple (article, entrepôt) à partir
de la totalité de ses mouvements redonne exactement la valeur courante. Un écart signale une écriture
directe — c'est-à-dire une corruption silencieuse.

### NFR-2 — Une seule unité de vérité

Toute quantité persistée est en **unité de base du catalogue**. L'affichage convertit ; le stockage
jamais. C'est la protection contre l'erreur la plus coûteuse de la distribution.

### NFR-3 — Valorisation rejouable et auditée

Recalculer la valeur d'un stock à partir de ses mouvements et de la méthode de l'exercice redonne
exactement la valeur publiée. Une valeur comptable non rejouable n'est pas auditable.

### NFR-4 — Couplage comptable à sens unique

Le stock alimente la comptabilité ; il n'en dépend jamais. Le module fonctionne intégralement sans
`bilan-service`.

### NFR-5 — Le stock d'autrui n'est jamais un actif — et le sien l'est toujours

Le stock d'un **détaillant partenaire** n'entre dans aucune valorisation ni publication comptable
(FR-S59). Le stock d'un **magasin propre** y entre intégralement (FR-S05c). **La distinction ne
repose pas sur le type de lieu mais sur la propriété** — confondre les deux gonflerait l'actif d'un
bien qu'on ne possède pas, ou en omettrait un qu'on possède.

| Lieu | Propriété | Au bilan ? | Comment on le connaît |
|---|---|:--:|---|
| Entrepôt | organisation | ✅ | Mouvements réels |
| **Magasin propre** | organisation | ✅ | Mouvements réels |
| Détaillant partenaire | le détaillant | ❌ | Deux estimations comparées |

### NFR-6 — Cloisonnement par organisation

### NFR-7 — Délais *(cibles proposées, à confirmer)*

| Opération | Cible |
|---|---|
| Enregistrement d'un mouvement | P95 < 1 s |
| Consultation du stock d'un article, tous entrepôts | P95 < 1 s |
| **Stock à une date passée** (FR-S10) | **P95 < 5 s** — sa mise en œuvre naturelle, rejouer tous les mouvements, est la plus coûteuse du module. Si la cible n'est pas tenable par rejeu, des points d'arrêt périodiques sont nécessaires — et ils doivent rester **dérivés**, jamais une seconde source de vérité (NFR-1) |
| Valorisation d'arrêté sur un catalogue complet | traitement différé, progression visible |

---

## 7. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Écart entre stock recalculé et stock courant | **0** | NFR-1 |
| **SM-2** | Valeur publiée vs valeur recalculée | **0 écart** | NFR-3 |
| **SM-3** | Stocks négatifs non autorisés | **0** | FR-S09 |
| **SM-4** | **Part du capital stock dormant** | **mesurer d'abord** — la référence est établie au 1ᵉʳ arrêté, la cible de décroissance est fixée ensuite | La thèse du module |
| **SM-5** | Écarts d'inventaire en valeur | tendance décroissante | Le stock reflète la réalité |
| **SM-6** | Ruptures constatées non précédées d'une alerte | **0** | FR-S37 |
| **SM-7** | Clôtures où le comptable ressaisit une valeur de stock alors que la comptabilité est présente | **0** | FR-S31 — le gain principal |

### Contre-métriques

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | **Taux d'ajustement manuel** | Hausse. Si l'on ajuste souvent, le système ne reflète plus la réalité et les mouvements sont contournés. Un module de stock qu'on corrige tous les jours est un module qu'on a cessé d'alimenter |
| **CM-2** | Alertes de dormant émises et jamais suivies d'action | Hausse — la détection existe mais ne sert à rien, et le capital continue de dormir |
| **CM-3** | Écart moyen entre relevé et estimation du stock réseau | Hausse — l'une des deux sources dérive, et on ne sait pas laquelle |

---

## 8. Découpage en incréments

| Incrément | Pts est. | Titre | Critère de sortie |
|:--:|:--:|---|---|
| **1** | ~34 | **Le stock existe et s'explique** — A · B · C : entrepôts, stock détenu, mouvements append-only, réservé/disponible | Recalculer un stock depuis ses mouvements redonne exactement sa valeur courante |
| **2** | ~34 | **Le stock vaut quelque chose** — D · E · F · I : lots et dates limites, valorisation CUMP configurable, alimentation du bilan, inventaire | Une clôture d'exercice alimente le bilan sans aucune ressaisie |
| **3** | ~29 | **Le stock parle** — G · H · J · K : seuils, ruptures, capital dormant, transferts, stock réseau | Les quatre cas de stock mort sont détectés avec leur coût de portage |

**Pourquoi cet ordre.** L'incrément 1 est le socle : sans mouvements traçables, aucune valeur n'est
auditable. L'incrément 2 porte **le gain principal pour un client qui a déjà le Bilan** — la clôture
sans ressaisie. L'incrément 3 porte la thèse, et il est le seul décalable.

---

## 9. Dépendances

| Dépendance | État | Impact |
|---|---|---|
| **Catalogue (#3)** — articles, unités de base, conditionnements, profil commercial | ⬜ **à construire avant** | **Bloquant.** Sans unité de base, aucune quantité n'a de sens ; sans profil, les cas d'obsolescence et de saisonnier sont indétectables |
| ⚡ **Immuabilité de l'unité de base** d'un article (Catalogue, sa Q1) | ⛔ **question ouverte côté catalogue** | **Dépendance dure, à verrouiller.** Tout le stock historique est exprimé dans cette unité. Si elle changeait, **toutes les quantités passées deviendraient fausses en silence** — et rien ne le signalerait. Le catalogue doit trancher « non modifiable, créer un article de remplacement » |
| **Commande (#11)** — source des réservations | ⬜ **construite après ce module** | FR-S08c : au v1, `réservé = 0`. Le contrat existe, il se remplira sans le changer |
| `bilan-service` — comptabilité | ✅ **livré** | Consommateur de FR-S30/S31. **Optionnel** : le module fonctionne sans (NFR-4) |
| Réseau & zones (#4) | ⬜ | Zones desservies par un entrepôt — référence opaque en attendant *[A1]* |
| Approvisionnement (#13) | ⬜ | Consommateur des signaux (FR-S38) |
| Assistant IA (#6) | ⬜ | Consommateur du fournisseur de candidats (FR-S39) |
| Terrain / Commercial (#9) | ⬜ | Source du relevé de stock réseau (FR-S56) — l'estimation par les ventes fonctionne seule *[A3]* |

---

## 10. Risques

| # | Risque | Traitement |
|---|---|---|
| **R1** | Le stock devient un compteur qu'on corrige, les mouvements sont contournés | **NFR-1** (condition observable) + **CM-1** (taux d'ajustement surveillé) |
| **R2** | La valorisation publiée au bilan n'est pas rejouable → clôture inauditable | **NFR-3** + FR-S34 (descendre au mouvement) |
| **R3** | Le stock du réseau détaillant est confondu avec le stock détenu et gonfle l'actif | **NFR-5** + FR-S59 — exclusion explicite de toute valorisation |
| **R4** | Le suivi par lot est activé partout « par sécurité » et alourdit l'exploitation au point d'être abandonné | FR-S17 : activation **par article**, décidée par le client |
| **R5** | Les alertes de dormant s'accumulent sans effet — la détection existe, l'action non | **CM-2**, et FR-S45 (coût de portage chiffré) pour rendre l'inaction visible |
| **R6** | Changement de méthode de valorisation en cours d'exercice → variation de stock incomparable | **FR-S25** : méthode figée par exercice, changement tracé |

---

## 11. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | Le taux annuel de coût de portage (22 % dans le prototype) : valeur unique ou paramétrable par organisation ? | ouverte — mon avis : **paramétrable**, défaut 22 % |
| Q2 | Un article peut-il changer de méthode d'écoulement (FIFO date limite → autre) en cours d'exercice ? | ouverte — mon avis : **non**, même raison que FR-S25 |
| **Q3** | Le stock en transit (FR-S52) appartient-il à l'entrepôt d'origine ou de destination **au bilan** ? | ⏸ **REPORTÉE AU LANCEMENT DU MODULE** (décision utilisateur 2026-08-02) — **à ressortir obligatoirement à ce moment-là.** Question comptable, pas technique : à trancher avec un comptable. ⚠️ **Portée du blocage** : tant qu'elle n'est pas tranchée, FR-S28 (valeur par entrepôt) et FR-S30 (valeur d'arrêté) sont **incomplètes** dès qu'un transfert est en cours à la date d'arrêté |
| Q4 | Les emplacements (FR-S02) sont-ils nécessaires au v1, ou reportables au module Opérations entrepôt (#12) ? | ouverte — à trancher au découpage |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| **A1** | Les zones desservies par un entrepôt sont des **références opaques** tant que Réseau & zones (#4) n'existe pas | FR-S01 | PRD Réseau & zones |
| **A2** | Les catégories comptables de stock (classe 3) se déduisent de la classification du catalogue ; aucun plan comptable n'est câblé ici | FR-S30 | Intégration `bilan-service` |
| **A3** | L'estimation du stock réseau par les livraisons et le rythme de vente est utilisable **sans** le module Terrain ; le relevé l'enrichit sans le conditionner | FR-S56 | Module Terrain (#9) |
| **A4** | Un article suivi par lot l'est dans tous les entrepôts — pas de suivi par lot dans un entrepôt et global dans un autre | FR-S17 | Implémentation |
