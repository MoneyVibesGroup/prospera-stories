---
title: "PRD — Réseau, agences & zones (reseau-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: reseau-service
position_sequence: 4
verticales: [IMF, Distributeur]
mode: coaching
---

# PRD — Réseau, agences & zones (`reseau-service`)

**Position 4 de la séquence** · Verticales : **IMF · Distributeur** *(Assurance en réemploi si la
verticale existe un jour)* · Dépend du Bloc 0
Décisions tracées dans `.memlog.md`

---

## 1. Contexte et problème

### 1.1 Deux verticales, deux mots, une seule structure

« Réseau » ne désigne pas la même chose chez l'IMF et chez le distributeur — et c'est la raison
d'être de ce module :

| | **IMF** | **Distributeur** |
|---|---|---|
| Objet principal | **L'agence** — un lieu, avec du personnel, un coffre, un guichet, des horaires | **La zone** — un territoire commercial, sans mur |
| Découpage | Agence → secteur → sous-secteur | Zone → sous-zone |
| Ce qu'on y rattache | Employés, plafonds, ratios réglementaires | Points de vente, entrepôt d'approvisionnement, objectifs |
| Dans le prototype | `/agences`, `/zones`, `/dashboard/secteurs/[slug]/[sousSlug]`, `/credit/reseau` | `zones-registry.ts`, `zones_rattachees` sur l'entrepôt |

> **Une agence est un lieu. Une zone est un périmètre.** Un lieu peut desservir plusieurs zones ; une
> zone peut être servie par plusieurs lieux. Les fondre en un seul objet donnerait un module qui ne va
> bien à aucune des deux verticales.

### 1.2 Ce que ce module rend possible

Trois choses qu'aucun autre module ne peut faire, et dont plusieurs dépendent déjà :

1. **Une hiérarchie de responsabilité.** Sans elle, « le superviseur de la zone Kara » n'est qu'un
   libellé : rien ne définit ce qu'il voit.
2. **Une portée d'accès.** Le catalogue de permissions livré au sprint 18 dit **ce qu'un rôle peut
   faire** ; il ne dit pas **sur quel périmètre**. C'est le chaînon manquant du contrôle d'accès.
3. **Une couverture territoriale.** Les zones blanches, la carte, l'allocation d'objectifs et
   l'affectation des commerciaux supposent toutes un découpage nommé.

### 1.3 Une tension résiduelle, assumée

Il existe une **famille de lieux d'exploitation répartie sur trois modules** : l'**agence** (ici),
l'**entrepôt** et le **magasin propre** (Stock, `FR-S05b`), le **point de vente** (PDV, `FR-V01`).

**Aucun objet « lieu » générique n'est créé, et c'est délibéré.** Les trois n'ont en commun qu'une
adresse et une géolocalisation ; un objet partagé coupleraient trois modules pour gagner un champ.
Argument décisif : Stock est en position **7** ; s'il dépendait de ce module en position **4**,
l'écart serait de 3 positions et **violerait la règle des 4** qui structure toute la séquence.

**Conséquence acceptée :** la zone reste une **référence opaque** pour Catalogue, Stock et PDV — ce
que leurs assumptions déclarent déjà. Ce module la rend **résoluble**, il ne la leur impose pas.

---

## 2. Vision produit

> Le module réseau répond à **où l'entreprise est présente, qui y répond, et jusqu'où va son
> autorité**.

Trois propriétés :

1. **Le lieu et le périmètre sont deux objets.** L'un a des murs, l'autre des frontières.
2. **La hiérarchie porte l'autorité, pas seulement l'organigramme.** Elle est la source de la portée
   d'accès, pas une décoration d'affichage.
3. **Le modèle est un arbre ; la profondeur est une règle.** On limite aujourd'hui sans se fermer
   demain.

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| **Zone** | Périmètre géographique ou commercial. N'a pas d'adresse : elle a des **frontières**. |
| **Agence** | Lieu d'exploitation avec du personnel et des horaires. A une **adresse**. Verticale IMF principalement. |
| **Nœud** | Élément de la hiérarchie — une agence, une zone, un secteur. Le modèle est **récursif**. |
| **Profondeur** | Nombre de niveaux autorisés dans la hiérarchie. **Règle configurable**, pas structure figée. |
| **Rattachement** | Lien entre un lieu et les zones qu'il dessert. **Plusieurs à plusieurs.** |
| **Portée d'accès** | Ensemble des nœuds sur lesquels un utilisateur exerce ses permissions. Répond à « **sur quoi ?** », quand le catalogue de permissions répond à « **quoi ?** ». |
| **Responsable** | Personne qui répond d'un nœud. Un nœud sans responsable est un trou d'exploitation. |
| **Couverture** | Part d'une zone effectivement servie — mesurée par ce que les autres modules y rattachent. |
| **Zone blanche** | Zone déclarée sans aucun rattachement actif. |

---

## 4. Périmètre

### 4.1 Dans le périmètre

- **Zones** et leur découpage hiérarchique
- **Agences** : identité, adresse, horaires, responsable, hiérarchie
- **Rattachement** lieux ↔ zones, plusieurs à plusieurs
- **Hiérarchie récursive** avec profondeur maximale configurable
- **Affectation des personnes** à un nœud
- ⚡ **Portée d'accès** : l'extension du contrôle d'accès au périmètre
- **Paramètres par agence** : horaires, plafonds opérationnels
- **Couverture et zones blanches** — le calcul, à partir de ce que les autres rattachent
- Publication vers les modules consommateurs

### 4.2 Hors périmètre

| Hors périmètre | Où ça vit |
|---|---|
| **Caisse, coffre, clôture journalière, écarts de caisse** d'une agence | **Caisse & guichet (#15)** — l'agence existe ici, sa caisse vit là-bas |
| Entrepôt, magasin propre, stock détenu | **Stock (#7)** — voir §1.3 |
| Points de vente et leur portefeuille | **PDV (#2)** |
| Employés, contrats, performance individuelle | **Équipe & performance (#18)** — ce module rattache une personne à un nœud, il ne gère pas sa carrière |
| Objectifs et quotas par zone | **Conquête & objectifs (#16)** — il consomme le découpage, il ne le définit pas |
| Tournées, itinéraires, GPS | **Commercial terrain (#9)** |
| Ratios réglementaires par agence | **Conformité BCEAO (#27)** |

---

## 5. Fonctionnalités & exigences (FR)

### A — Zones

| # | Exigence |
|---|---|
| **FR-R01** | Une **zone** porte un nom, un code stable, un type propre à l'organisation (commercial, administratif, logistique) et un parent éventuel. Elle **n'a pas d'adresse**. |
| **FR-R02** | Une zone peut porter une **emprise géographique** — un contour, ou à défaut un ensemble de localités. L'emprise est **facultative** : beaucoup de distributeurs raisonnent en noms de quartiers avant de raisonner en polygones. |
| **FR-R03** | Le **code d'une zone est stable et non réutilisable**. Les objets qui la référencent — points de vente, entrepôts, grilles tarifaires, objectifs — le font pour longtemps. |
| **FR-R04** | Une zone se **ferme** sans être supprimée. La fermeture est refusée tant que des objets actifs y sont rattachés, avec le détail de ce qui l'empêche. |
| **FR-R05** | Une zone peut être **redécoupée** : scission, fusion, transfert d'un sous-ensemble. Toute opération est **datée et tracée**, et l'ancien découpage reste consultable — sans quoi les comparaisons de performance d'une année sur l'autre deviennent fausses sans prévenir. |
| **FR-R05b** | ⚡ **Mécanisme : la hiérarchie est versionnée**, et chaque objet rattaché **conserve la version de découpage** en vigueur au moment du rattachement. Restituer une période passée utilise la version de cette période, jamais la version courante. Même principe que le facteur de conversion stocké avec le mouvement (`FR-C10b`) et le tarif stocké avec l'encaissement (`FR-P24b`) : **ce qui a servi est conservé avec ce qu'il a servi à produire**. |

### B — Agences

| # | Exigence |
|---|---|
| **FR-R06** | Une **agence** porte un nom, un code stable, une **adresse**, une géolocalisation, un type (siège, agence, point de service), un **responsable**, et un parent éventuel. |
| **FR-R07** | Une agence porte ses **horaires d'ouverture** et son calendrier de fermetures. |
| **FR-R08** | Une agence porte des **paramètres opérationnels** — plafonds, seuils — dont l'usage appartient aux modules qui les appliquent. Ce module les **détient**, il ne les applique pas. Tout paramètre **monétaire porte sa devise** et suit les règles d'exactitude de la série : entier d'unité mineure, décimales de la devise (⚠️ **le XOF n'en a aucune**). |
| **FR-R09** | ⚡ **La caisse d'une agence n'est pas ici.** Coffre, fond de caisse, clôture journalière, écarts relèvent du module Caisse (#15). Ce module dit **que l'agence existe**, pas ce qui s'y compte. |
| **FR-R10** | Une agence se **ferme** sans être supprimée ; son historique et ses rattachements restent consultables. |

### C — Hiérarchie

| # | Exigence |
|---|---|
| **FR-R11** | La hiérarchie est un **arbre récursif** de nœuds. Le modèle ne code en dur **aucun** nombre de niveaux. |
| **FR-R12** | ⚡ **La profondeur maximale est une règle configurable, pas une structure.** Défaut **3 niveaux** — agence → secteur → sous-secteur côté IMF, zone → sous-zone côté distributeur. L'augmenter plus tard est un **changement de paramètre**, sans migration ni réécriture. |
| **FR-R13** | Un nœud ne peut pas devenir son propre ancêtre. Le contrôle est fait à l'écriture, pas découvert à la lecture. |
| **FR-R14** | Déplacer un nœud déplace sa descendance, avec un **compte rendu préalable** de ce qui va bouger et de qui va changer de portée d'accès. |
| **FR-R15** | Restitution de la hiérarchie complète, et du chemin d'un nœud jusqu'à la racine. |

### D — Rattachement lieux ↔ zones

| # | Exigence |
|---|---|
| **FR-R16** | Le rattachement est **plusieurs à plusieurs** : un lieu dessert plusieurs zones, une zone est servie par plusieurs lieux. |
| **FR-R17** | Un rattachement peut porter un **rôle** — desserte principale ou de secours. Le module de Stock suggère déjà des transferts entre entrepôts ; savoir lequel est le secours de qui rend ces suggestions justes. |
| **FR-R18** | Le module expose une **résolution** : « quels lieux desservent cette zone ? », et « quelle zone pour ce point ? ». |
| **FR-R18b** | ⚡ **Deux chemins de résolution, deux fiabilités.** Avec une **emprise géographique** (FR-R02), la résolution d'un point est **géométrique et certaine**. Sans emprise — le cas courant au v1 — elle se fait par **correspondance de localité déclarée**, avec un taux d'échec réel : une adresse inconnue du référentiel de localités ne résout pas. Le service **répond « non résolu »**, jamais une zone approchante. Le chemin utilisé est **restitué avec la réponse**. |
| **FR-R19** | Le rattachement d'un lieu détenu par un autre module (entrepôt, magasin, point de vente) se fait par **référence** : ce module ne détient ni ne duplique ces objets. |

### E — Personnes & responsabilité

| # | Exigence |
|---|---|
| **FR-R20** | Une personne est **affectée à un ou plusieurs nœuds**, avec une date de début et de fin. |
| **FR-R21** | Un nœud porte un **responsable**. Un nœud **sans responsable est listable et signalé** : c'est un trou d'exploitation, pas une configuration neutre. |
| **FR-R22** | L'historique des affectations est conservé : savoir qui répondait d'une agence à une date passée est une question d'audit, pas de confort. |
| **FR-R23** | Ce module **ne gère pas les personnes** — identité, contrat, performance appartiennent ailleurs. Il gère leur **rattachement**. |

### F — Portée d'accès ⚡

Le chaînon manquant du contrôle d'accès. Le catalogue de permissions livré au sprint 18 dit **ce qu'un
rôle peut faire** ; il ne dit pas **sur quoi**.

| # | Exigence |
|---|---|
| **FR-R24** | ⚡ Un utilisateur porte une **portée d'accès** : l'ensemble des nœuds sur lesquels ses permissions s'exercent. Permission et portée sont **deux dimensions distinctes** et se combinent. |
| **FR-R24b** | ⚡ **La portée s'applique aux lectures ET aux écritures** (décision utilisateur). Voir un enregistrement et pouvoir le modifier sont deux autorisations distinctes, toutes deux territorialisées. |
| **FR-R24c** | ⚡ La **portée d'écriture peut être plus étroite** que la portée de lecture — un superviseur lit tout son secteur et ne modifie que son agence. Elle ne peut **jamais être plus large** : on ne modifie pas ce qu'on ne voit pas. Le service **refuse** une portée d'écriture qui déborde la portée de lecture ; il ne l'ajuste pas silencieusement. |
| **FR-R25** | La portée est **héritée par descendance** : qui a la portée d'une agence a celle de ses secteurs. L'héritage est **explicite**, jamais supposé. |
| **FR-R26** | Une portée peut être **restreinte à un sous-ensemble** de la descendance, sans casser l'héritage général. |
| **FR-R27** | ⚡ **Une portée vide n'est pas une portée universelle.** L'absence de portée déclarée **refuse l'accès** — elle ne l'ouvre pas. C'est le défaut de conception le plus courant et le plus coûteux de ce type de module. |
| **FR-R28** | Le module **publie la portée**, il ne l'applique pas lui-même : chaque service filtre ses propres données avec elle. Un module qui garderait le filtrage pour lui deviendrait un point de passage obligé de toutes les lectures. |
| **FR-R28b** | ⚡ **La portée voyage dans le jeton**, en extension du `perms[]` déjà livré (STORY-140). Aucun appel à ce module sur le chemin de lecture : le service reçoit le jeton, y lit la portée, filtre. C'est le seul des trois mécanismes possibles qui respecte FR-R28 sans créer de copie. |
| **FR-R28c** | ⚠️ **Conséquence assumée : la révocation d'une portée n'est effective qu'au renouvellement du jeton.** Cette latence est une **propriété connue du système**, pas une surprise : elle est bornée par la durée de vie du jeton, documentée, et une **révocation immédiate** reste possible par invalidation de session pour les cas graves. L'écrire ici évite de la découvrir le jour où l'on retire une portée en urgence. |
| **FR-R29** | Un **rôle plateforme** peut disposer d'une portée totale, explicitement déclarée comme telle et journalisée — jamais obtenue par l'absence de restriction. |
| **FR-R30** | Toute modification de portée est **journalisée** avec auteur, motif et périmètre avant/après. Élargir la portée d'un utilisateur est une décision de sécurité. |

### G — Couverture & zones blanches

| # | Exigence |
|---|---|
| **FR-R31** | Le module calcule la **couverture** d'une zone à partir de ce que les autres modules y rattachent — points de vente, agences, lieux de stock. Il **compte**, il ne juge pas de la qualité de la couverture. |
| **FR-R32** | Une **zone blanche** est une zone déclarée sans aucun rattachement actif. Elle est listable et cartographiable. |
| **FR-R33** | ⚠️ Le module ne détecte **pas** les territoires **non déclarés** : une zone qui n'existe pas dans le système n'est pas une zone blanche, elle est **invisible**. Identifier des territoires à créer relève de Conquête (#16), qui travaille sur des données externes. Le dire ici évite de croire la carte exhaustive. |
| **FR-R34** | Le module expose un **fournisseur de candidats** pour le moteur de règles (`FR-IA03b`) : zones blanches, nœuds sans responsable, agences fermées avec des rattachements actifs. |

### H — Administration & publication

| # | Exigence |
|---|---|
| **FR-R35** | Droits distincts : consulter le réseau, créer ou modifier un nœud, redécouper, affecter une personne, **attribuer une portée d'accès**. |
| **FR-R36** | ⚡ **Attribuer une portée d'accès est le droit le plus sensible du module** et se gouverne comme tel : nul ne peut s'attribuer une portée supérieure à la sienne, ni en attribuer une qu'il ne détient pas. Même principe que le mandat de l'assistant IA (`FR-IA36c`). |
| **FR-R37** | Import du réseau par fichier, avec compte rendu **avant** persistance. Tout ou rien. |
| **FR-R38** | Le module **publie ses événements** : nœud créé, déplacé, fermé, redécoupé, portée modifiée, responsable changé. |
| **FR-R39** | Cloisonnement strict par organisation. |
| **FR-R40** | Journal d'audit append-only : hiérarchie, rattachements, portées, redécoupages. |

---

## 6. Exigences non fonctionnelles (NFR)

### NFR-1 — Une portée absente refuse, elle n'ouvre pas *(structurante)*

**Condition observable :** un utilisateur sans portée déclarée obtient **zéro** enregistrement sur
chaque service consommateur — jamais l'ensemble. Le test fait partie de la définition de terminé.

### NFR-2 — La portée est publiée, jamais appliquée ici

Chaque service filtre ses propres données. Ce module reste un **référentiel**, pas un intermédiaire
obligatoire sur le chemin de lecture.

### NFR-3 — Le redécoupage ne réécrit pas le passé

Un redécoupage crée un nouvel état ; l'ancien reste consultable et daté. Sans cela, une comparaison
de performance d'une année sur l'autre devient fausse sans prévenir.

### NFR-4 — Extensibilité de la profondeur sans migration

Le modèle est récursif ; la profondeur est une règle. **Condition observable :** passer de 3 à 4
niveaux se fait par configuration, sans changement de schéma ni reprise de données.

### NFR-5 — Cloisonnement par organisation

### NFR-6 — Délais *(cibles proposées)*

| Opération | Cible |
|---|---|
| **Calcul de la portée à l'émission du jeton** | **P95 < 200 ms** — il est sur le chemin de la connexion, **pas** sur celui de chaque lecture (FR-R28b) |
| Restitution de la hiérarchie complète | P95 < 1 s |
| Résolution zone ↔ localité | P95 < 500 ms |

---

## 7. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Utilisateurs sans portée déclarée obtenant des données | **0** | NFR-1 — le défaut le plus coûteux du module |
| **SM-2** | Nœuds sans responsable | **≈ 0**, et toujours listables | FR-R21 |
| **SM-3** | Services consommateurs appliquant la portée | **tous** ceux qui portent des données territorialisées | NFR-2 |
| **SM-4** | Redécoupages ayant rendu un historique illisible | **0** | NFR-3 |
| **SM-5** | Passage de 3 à 4 niveaux réalisé par configuration seule | **vérifié une fois** | NFR-4 |

### Contre-métriques

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | Zones créées et restées vides | Hausse — un découpage plus fin que la réalité de terrain, qui alourdit tout et ne sert rien |
| **CM-2** | Portées attribuées « totales » à des utilisateurs non plateforme | Toute occurrence. C'est ainsi que le contrôle d'accès se vide de son sens : non par une faille, mais par une commodité accordée un jour de urgence |
| **CM-3** | Profondeur réellement utilisée par rapport à la profondeur autorisée | Écart durable — soit le paramètre est trop généreux, soit le découpage n'est pas allé au bout |

---

## 8. Découpage en incréments

| Incrément | Pts est. | Titre | Critère de sortie |
|:--:|:--:|---|---|
| **1** | ~26 | **Le réseau existe** — A · B · C : zones, agences, hiérarchie récursive, profondeur configurable | Passer de 3 à 4 niveaux se fait par configuration, sans migration |
| **2** | ~29 | **L'autorité s'applique** — E · F · H : affectations, responsables, **portée d'accès**, gouvernance du droit d'attribuer | Un utilisateur sans portée obtient zéro enregistrement partout |
| **3** | ~21 | **Le réseau se lit** — D · G : rattachements, résolution zone ↔ lieu, couverture, zones blanches | Les références opaques des autres modules deviennent résolubles |

**Pourquoi cet ordre.** L'incrément 2 est le plus précieux et le plus risqué : c'est lui qui rend le
contrôle d'accès complet, et c'est lui dont l'erreur — une portée vide qui ouvre tout — est
silencieuse. L'incrément 3 sert les autres modules ; il peut venir quand ils arrivent.

---

## 9. Dépendances

| Dépendance | État | Impact |
|---|---|---|
| **Catalogue de permissions plateforme** (STORY-140) | ✅ **livré S18** | Ce module en est **l'autre moitié** : il ajoute le « sur quoi » au « quoi » |
| Identité, rôles, isolation | ✅ livré | — |
| Catalogue produits (#3), Stock (#7), PDV (#2) | ⬜ | **Consommateurs** — ils référencent la zone de façon opaque en attendant (leurs A1/A2) |
| Caisse & guichet (#15) | ⬜ | Consommateur : l'agence existe ici, sa caisse là-bas (FR-R09) |
| Conquête & objectifs (#16) | ⬜ | Consommateur du découpage |
| Équipe & performance (#18) | ⬜ | Consommateur des affectations |
| Assistant IA (#6) | ⬜ | Consommateur du fournisseur de candidats (FR-R34) |

---

## 10. Risques

| # | Risque | Traitement |
|---|---|---|
| **R1** | ⚡ Une portée vide est interprétée comme « tout voir » | **NFR-1** avec condition observable + **SM-1**. C'est le défaut classique de ce type de module, et il ne se voit pas en test fonctionnel — seulement en audit |
| **R2** | Le module devient un point de passage obligé de toutes les lectures et un goulot | **NFR-2** : il publie la portée, chaque service filtre lui-même |
| **R3** | Un redécoupage rend les comparaisons d'une année sur l'autre fausses sans prévenir | **NFR-3** + FR-R05 : l'ancien découpage reste consultable |
| **R4** | La duplication des « lieux » sur trois modules produit des adresses divergentes | **Assumée** (§1.3). Mitigation : chaque module détient son lieu, ce module ne détient que l'agence et la zone. À réexaminer si un 4ᵉ module crée un lieu |
| **R5** | Des portées « totales » sont accordées pour dépanner et jamais reprises | **CM-2** : toute occurrence est une alerte, pas un seuil |
| **R6** | La carte est prise pour exhaustive alors qu'elle ne montre que les zones déclarées | **FR-R33** l'écrit explicitement |

---

## 11. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | Une **agence** peut-elle aussi être un **point de stock** (une agence IMF détient des valeurs, un dépôt avancé du distributeur vend) ? | ouverte — §1.3 laisse chaque module détenir son lieu ; à réexaminer au module Caisse (#15) |
| Q2 | La portée s'applique-t-elle aux écritures ou seulement aux lectures ? | ✅ **tranchée 2026-08-02 — aux deux.** Avec la contrainte que cela implique : la portée d'écriture peut être **plus étroite** que celle de lecture, **jamais plus large** (FR-R24b/c) |
| Q3 | Une personne peut-elle être affectée à des nœuds de **branches différentes** (deux zones sans ancêtre commun) ? | ouverte — mon avis : **oui**, c'est le cas d'un superviseur itinérant |
| Q4 | Le contour géographique (FR-R02) est-il nécessaire au v1, ou une liste de localités suffit-elle ? | ouverte — mon avis : **liste de localités au v1**, contour quand un client le demande |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| **A1** | Les organisations raisonnent d'abord en **noms de lieux**, pas en polygones ; l'emprise géographique précise est un raffinement | FR-R02, Q4 | 1ᵉʳ client demandant une carte précise |
| **A2** | Trois niveaux suffisent aux réseaux visés au v1 (agence → secteur → sous-secteur) | FR-R12 | 1ᵉʳ réseau plus profond |
| **A3** | Les services consommateurs acceptent de **filtrer eux-mêmes** avec la portée publiée plutôt que de déléguer le filtrage | NFR-2, FR-R28 | Architecture |
| **A4** | L'agence est un objet **IMF** ; le distributeur raisonne en zones et en lieux de stock, sans agence | §1.1 | 1ᵉʳ distributeur à agences |
