---
title: "PRD — Points de vente & portefeuille (pdv-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: pdv-service
position_sequence: 2
verticale: Distributeur
mode: coaching
---

# PRD — Points de vente & portefeuille (`pdv-service`)

**Position 2 de la séquence** · Verticale : **Distributeur** · Dépend du Bloc 0
Décisions tracées dans `.memlog.md`

> ⚠️ **« PDV » ne désigne pas une caisse.** Il désigne le **réseau de détaillants** que le
> distributeur fournit. L'encaissement au guichet est le module **Caisse (#15)**, verticale IMF.

---

## 1. Contexte et problème

### 1.1 La thèse

> **Un distributeur ne vend pas à un marché. Il vend à 1 847 boutiques dont il connaît mal la moitié.**

Le réseau est l'actif commercial du distributeur, et c'est celui qu'il documente le moins : le
commercial connaît ses clients, le système ne connaît que leurs factures. Quand le commercial part,
la connaissance part avec lui.

Ce module fait de chaque point de vente un **objet du système** plutôt qu'une ligne de facturation :
qui il est, où il est, qui s'en occupe, ce qu'il achète, ce qu'il doit, et **s'il est en train de
partir**.

### 1.2 Deux natures qu'il ne faut pas confondre

| Nature | Ce que c'est | Conséquence |
|---|---|---|
| **Magasin propre** | Un magasin **de l'enseigne** — le distributeur en est propriétaire | Son stock **est un actif** du distributeur : suivi par mouvements réels, valorisé, au bilan (`FR-S05c`) |
| **Détaillant partenaire** | Un commerçant **indépendant** que le distributeur fournit | Son stock ne lui appartient pas : estimé, **jamais valorisé** (`FR-S59`) |

Cette distinction a été trouvée en écrivant ce module, et elle a **corrigé le PRD Stock** qui traitait
tout point de vente comme non détenu. Un magasin propre traité en partenaire, c'est un actif absent
du bilan.

**Un magasin propre n'est pas un entrepôt** — il ne fait pas d'éclatement. Mais **un entrepôt peut
vendre au détail** : la vente est une **capacité**, pas une nature.

---

## 2. Vision produit

> Le module de points de vente répond à : **qui compose mon réseau, qui s'en occupe, et lequel suis-je
> en train de perdre ?**

Trois propriétés :

1. **Le portefeuille appartient à l'entreprise, la relation appartient au commercial.** Le système
   conserve ce que le second sait, pour que le premier ne le perde pas à son départ.
2. **Le pipeline se calcule et se corrige.** Les règles sont propres à chaque distributeur ; le
   système les applique, il ne les impose pas.
3. **Ce module décrit et signale ; il n'agit pas.** Il ne facture pas, ne relance pas, ne bloque pas
   une commande — il porte ce qui permet aux autres de le faire.

---

## 3. Le parcours le plus délicat — UJ-1 : le départ d'un freelance

> **Kofi** est commercial indépendant. Il a bâti un portefeuille de 34 boutiques dans le sud de Lomé,
> avec ses propres prix négociés boutique par boutique — que le distributeur n'a jamais vus
> (`FR-C29`). En mars, il arrête.
>
> **Ses 34 points de vente restent au distributeur.** Ce sont des clients de l'entreprise, pas les
> siens.
>
> Le jour de son départ, un événement daté est enregistré : **ses prix sont révélés au distributeur**
> — uniquement ceux en vigueur, uniquement pour les points de vente qui restent, et **Kofi en est
> notifié** (`FR-C29b/c`). Sans cela, le commercial qui reprend le secteur arrive chez la Boutique
> Akossombo sans savoir à quel prix elle achetait depuis deux ans, et la relation casse au premier
> rendez-vous.
>
> Le portefeuille est **réaffecté**, point de vente par point de vente. Chaque transfert conserve
> l'historique : commandes, créances, visites, évolution du pipeline. Ce qui change, c'est **qui s'en
> occupe** — pas ce qu'on sait.

**Ce que ce parcours impose** : la propriété du portefeuille par l'entreprise (`FR-V09`), l'historique
attaché au point de vente et non au commercial (`FR-V11`), la réaffectation sans perte (`FR-V12`), et
la révélation encadrée des prix (`FR-C29b/c/d`, PRD Catalogue). ⚠️ Il impose aussi une **clause au
contrat de l'indépendant** — une promesse de confidentialité avec une exception non annoncée n'en est
pas une.

---

## 4. Glossaire

| Terme | Définition |
|---|---|
| **Point de vente** | Un commerce que le distributeur fournit ou détient. Objet central du module. |
| **Magasin propre** | Point de vente **détenu** par le distributeur. Son stock est un actif (PRD Stock). |
| **Détaillant partenaire** | Point de vente **indépendant**. Son stock n'appartient pas au distributeur. |
| **Portefeuille** | Ensemble des points de vente affectés à un commercial. **Propriété de l'entreprise**, quelle que soit la nature du commercial. |
| **Pipeline** | État de la relation commerciale : prospection, actif, fidèle, à risque, perdu. |
| **Règle de transition** | Condition, **définie par le distributeur**, qui fait passer un point de vente d'un état de pipeline à un autre. |
| **Segment** | Regroupement de points de vente par comportement (dormant, VIP…), calculé ou déclaré. |
| **Zone blanche** | Territoire sans point de vente couvert, identifié par la carte. |
| **Plafond de crédit** | Encours maximal accordé à un point de vente. **Porté ici, appliqué ailleurs.** |

---

## 5. Périmètre

### 5.1 Dans le périmètre

- Le point de vente : identité, contact, adresse, géolocalisation, nature
- **Portefeuille et affectation** au commercial, salarié ou indépendant
- **Isolation du portefeuille freelance** et **réaffectation à son départ**
- **Pipeline** et ses règles de transition, propres à chaque distributeur
- **Vue 360°** : historique de commandes, livraisons, créances, visites
- **Segmentation** et **carte de couverture** (zones blanches)
- **Plafond de crédit** porté par le point de vente
- Champs de **score** alimentés de l'extérieur
- Publication vers les modules consommateurs

### 5.2 Hors périmètre

| Hors périmètre | Où ça vit |
|---|---|
| **Calcul** du score, détection de churn, potentiel | Module scoring & prévision (**différé**) — ce module **porte** le score, il ne le calcule pas |
| Prise de commande, panier | Commande (#11) |
| Facture, créance, avoir, **application** du plafond de crédit | Facturation (#17) |
| Relance, escalade, recouvrement | Relance (#24) |
| Tournées, visites, GPS de l'agent | Commercial terrain (#9) — les visites sont **restituées** ici, pas planifiées |
| Prix pratiqués (société et freelance) | **Catalogue (#3)** |
| Stock détenu ou estimé du point de vente | **Stock (#7)** |
| Prospection de nouveaux territoires | Conquête & territoires (#16) |

---

## 6. Fonctionnalités & exigences (FR)

### A — Le point de vente

| # | Exigence |
|---|---|
| **FR-V01** | Un **point de vente** porte : raison sociale ou enseigne, contacts (téléphone, dont un numéro joignable), adresse, **zone** référencée, et sa **nature** — magasin propre ou détaillant partenaire. |
| **FR-V02** | ⚡ La **nature** est structurante et ne se change pas à la légère : elle décide si le stock du lieu est un **actif du distributeur** (PRD Stock, `FR-S05c`). Son changement exige un rôle habilité et laisse une trace. |
| **FR-V03** | Un point de vente porte une **géolocalisation** — indispensable à la carte de couverture et aux zones blanches. Elle est **facultative à la création** mais son absence est **visible** : un point non localisé n'apparaît sur aucune carte, et c'est un trou, pas une neutralité. |
| **FR-V04** | Un point de vente porte des **photos** (devanture, enseigne) : c'est ainsi qu'un commercial remplaçant le reconnaît. |
| **FR-V05** | Un point de vente porte son **point de stock d'approvisionnement** habituel — entrepôt ou magasin (PRD Stock). |
| **FR-V06** | **Dédoublonnage** à la création. Clé **primaire : le numéro de téléphone** — disponible sur tout point de vente. La **proximité géographique** est un contrôle **secondaire**, appliqué seulement quand les deux points sont localisés : la géolocalisation étant facultative (FR-V03), s'y fier seul laisserait passer précisément les saisies hâtives, celles qui produisent le plus de doublons. Les doublons probables sont signalés **avant** création. |
| **FR-V07** | Un point de vente se **ferme** sans être supprimé. Son historique reste attaché ; ses créances restent dues. |

### B — Portefeuille & affectation

| # | Exigence |
|---|---|
| **FR-V08** | Un point de vente est **affecté à un commercial**, salarié ou indépendant. L'affectation est datée. |
| **FR-V09** | ⚡ **Le portefeuille appartient à l'entreprise**, quelle que soit la nature du commercial. Un indépendant qui part **ne l'emporte pas** — décision explicite du PO. |
| **FR-V10** | Un **indépendant ne voit que ses propres points de vente**. Deux indépendants ne se voient pas. Même étanchéité que les prix freelance (`FR-C30`), vérifiée au niveau des données. |
| **FR-V11** | ⚡ **L'historique est attaché au point de vente, pas au commercial** : commandes, livraisons, créances, visites, transitions de pipeline. Changer de commercial ne fait perdre aucune donnée. |
| **FR-V12** | **Réaffectation** possible point par point ou par lot, avec motif et trace. L'ancien titulaire perd l'accès à la date de réaffectation, pas rétroactivement à ses propres traces. |
| **FR-V13** | ⚡ **Au départ d'un indépendant**, le module déclenche l'événement de **révélation des prix** au distributeur, pour les points de vente qui restent (`FR-C29b/c`, PRD Catalogue). Le départ n'est pas une simple désactivation de compte : c'est un transfert de connaissance encadré. |
| **FR-V14** | Un point de vente peut être **sans commercial** — état transitoire, mais il doit être **visible** et listable. Un point sans titulaire est un point que personne ne visite. |

### C — Pipeline commercial

| # | Exigence |
|---|---|
| **FR-V15** | États du pipeline : `prospection → actif → fidèle`, plus `à risque` et `perdu`. Un point de vente peut revenir en arrière. |
| **FR-V16** | ⚡ **Deux moteurs de transition, tous deux légitimes** : un **humain** qui décide, et un **calcul** sur le comportement d'achat. Aucun des deux n'a la priorité par principe. |
| **FR-V17** | ⚡ **Les règles de transition sont définies par le distributeur** — délai sans commande, chute du panier, ancienneté de créance, fréquence. Ce sont des **données**, pas du code : *chaque distributeur a sa logique*. |
| **FR-V18** | Un point de vente **redevenu bon repasse automatiquement** en `actif` ou `fidèle` selon les critères du distributeur. La sortie de `à risque` est aussi automatique que l'entrée — sinon la liste des clients à risque ne fait que grossir. |
| **FR-V19** | ⚡ **Toute transition est expliquée** : quel moteur (humain ou règle), quelle règle, quelles valeurs l'ont déclenchée, quand. Un commercial à qui l'on dit « ce client est à risque » doit pouvoir savoir pourquoi avant d'aller le voir. |
| **FR-V20** | Une transition **automatique peut être corrigée** par un humain habilité, avec motif. La correction ne désactive pas la règle — elle est **tracée comme un désaccord**, matière première du réglage des critères. |
| **FR-V21** | L'historique complet des transitions est conservé et restituable. |

### D — Vue 360°

| # | Exigence |
|---|---|
| **FR-V22** | Le point de vente restitue, en un lieu : commandes, livraisons, **créances et leur ancienneté**, visites, transitions, contacts. Les données appartiennent aux modules d'origine ; ce module les **agrège** pour lecture. |
| **FR-V23** | Chaque élément restitué porte **sa source et sa fraîcheur**. Une créance de la veille et une créance d'il y a un mois n'engagent pas la même conversation. |
| **FR-V24** | Le module **ne duplique pas** les données des autres : il les demande au moment de l'affichage ou s'appuie sur ce que l'appelant fournit. Même invariant que l'assistant IA (`FR-IA03`). |
| **FR-V25** | La vue est **exploitable hors connexion** pour le commercial en tournée : un cache de son seul portefeuille, daté, avec la mention explicite de sa fraîcheur. |
| **FR-V25b** | ⚡ **Ce cache vit sur l'appareil du commercial, jamais sur le serveur.** Il est **dérivé, daté et jetable** — il ne fait autorité sur rien et n'est source d'aucune restitution. NFR-4 interdit une copie **côté service** ; elle n'interdit pas un cache client, qui est le seul moyen de travailler sans réseau. La distinction est écrite ici parce que deux lecteurs en concluraient l'inverse. |

### E — Segmentation & couverture

| # | Exigence |
|---|---|
| **FR-V26** | **Segments** par comportement : actif, dormant, VIP, nouveau. Calculés sur des critères du distributeur, ou déclarés à la main. |
| **FR-V27** | **Carte de couverture** : les points de vente sur une carte, filtrable par zone, segment, pipeline, commercial. |
| **FR-V28** | **Zones blanches** : territoires sans point de vente couvert, identifiés depuis la carte. Le module les **signale** ; la conquête est le module #16. |
| **FR-V29** | Export de listes filtrées, exploitables par Marketing (#10) comme audience et par `notification-service` comme liste d'envoi. |
| **FR-V29b** | ⚡ Le contact d'un point de vente est **une personne** — nom, numéro joignable — même si le point de vente est un commerce. Ces données relèvent de la **politique de conservation et des droits des personnes du PRD `notification-service` (§9)**, à laquelle ce module se conforme : minimisation, durée bornée, recherche par identifiant de canal, effacement. Ce module alimente ses listes d'envoi ; il ne peut pas s'en exonérer. |

### F — Encadrement du crédit

| # | Exigence |
|---|---|
| **FR-V30** | Un point de vente porte un **plafond de crédit** — montant **avec sa devise**, stocké en entier d'unité mineure comme partout ailleurs (⚠️ **le XOF n'a pas de décimale**) — et des **conditions de règlement**. Ce sont des attributs du client, donc ils vivent ici. |
| **FR-V31** | ⚡ **Le module porte le plafond ; il ne l'applique pas.** Le blocage d'une commande en dépassement est la décision de Commande (#11) ou Facturation (#17). Ce module publie la limite et l'encours connu. |
| **FR-V32** | Toute modification d'un plafond est **journalisée avec motif et auteur**. Relever le plafond d'un client à risque est une décision, pas un réglage. |
| **FR-V33** | Le plafond peut être **suspendu** sans être remis à zéro — un blocage temporaire n'efface pas la confiance négociée. |

### G — Scores et signaux externes

| # | Exigence |
|---|---|
| **FR-V34** | Le point de vente porte des **champs de score** — santé, risque de churn, potentiel. **Ils sont alimentés de l'extérieur** ; ce module ne calcule aucun score. |
| **FR-V35** | Chaque score porte **sa source, sa date et sa version de modèle**. Un score sans provenance n'est pas exploitable et ne doit pas s'afficher comme un fait. |
| **FR-V36** | ⚡ Le champ existe **dès le v1, même sans producteur** — le module de scoring est différé (décision utilisateur). Il est déclaré vide et visible comme tel, **pour que la place ne soit pas oubliée** et que son arrivée ne demande aucun changement de contrat. |
| **FR-V37** | Le module expose un **fournisseur de candidats** pour le moteur de règles de l'assistant (`FR-IA03b`) : points de vente sans commande depuis N jours, entrés en `à risque`, sans commercial, non géolocalisés. |

### H — Administration & publication

| # | Exigence |
|---|---|
| **FR-V38** | Droits distincts : consulter son portefeuille, consulter tout le réseau, créer un point de vente, réaffecter, modifier un plafond, définir les règles de pipeline. |
| **FR-V39** | ⚡ **Définir les règles de pipeline est un droit restreint** : ces règles décident de qui est « à risque » dans toute l'entreprise. |
| **FR-V40** | Import de réseau par fichier, avec compte rendu **avant** persistance et **dédoublonnage** (FR-V06). Tout ou rien. |
| **FR-V41** | Le module **publie ses événements** : point créé, réaffecté, transition de pipeline, plafond modifié, départ de commercial. |
| **FR-V42** | Cloisonnement strict par organisation ; isolation du portefeuille indépendant à l'intérieur (FR-V10). |
| **FR-V43** | Journal d'audit append-only : affectations, réaffectations, transitions corrigées, plafonds, changements de nature. |

---

## 7. Exigences non fonctionnelles (NFR)

### NFR-1 — Le portefeuille est à l'entreprise, la donnée reste au point de vente

Aucune donnée d'historique n'est perdue ni rendue inaccessible par un changement de commercial.
**Condition observable :** après réaffectation, l'historique restitué est identique à celui d'avant,
au titulaire près.

### NFR-2 — Étanchéité du portefeuille indépendant

Un indépendant n'atteint les points de vente d'un autre par **aucun** chemin : API, export, carte,
agrégat, message d'erreur. Vérifié au niveau des données, pas des écrans — même exigence que
`NFR-4` du catalogue.

### NFR-3 — Toute transition de pipeline est explicable

Aucun état ne s'affiche sans que sa cause puisse être restituée.

### NFR-4 — Le module n'est pas une copie du système

Il agrège pour lire ; il ne duplique pas les données des autres modules (FR-V24).

### NFR-5 — Cloisonnement par organisation

### NFR-6 — Délais *(cibles proposées)*

| Opération | Cible |
|---|---|
| Ouverture d'une fiche point de vente complète | P95 < 2 s |
| Carte de couverture, 2 000 points | P95 < 3 s |
| Recalcul du pipeline sur tout le réseau | traitement différé, progression visible |

---

## 8. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Points de vente sans commercial affecté | **≈ 0**, et toujours listables | FR-V14 |
| **SM-2** | Transitions de pipeline sans explication restituable | **0** | NFR-3 |
| **SM-3** | Fuites entre portefeuilles d'indépendants | **0** | NFR-2 |
| **SM-4** | Points de vente géolocalisés | **> 90 %** — mais **mesurable seulement à partir de l'arrivée du module Commercial terrain (#9)**, qui est la source de la saisie *(A4)*. Au v1, la géolocalisation dépend d'une saisie manuelle et la cible n'est pas atteignable par construction | La carte et les zones blanches ne valent que par la couverture |
| **SM-5** | Perte de données constatée après réaffectation | **0** | NFR-1 |
| **SM-6** | Doublons de points de vente dans le réseau | **tendance décroissante** | FR-V06 |

### Contre-métriques

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | Points créés en `prospection` et jamais convertis | Hausse — le carnet enfle sans que le réseau grandisse. Un fichier de prospects n'est pas un portefeuille |
| **CM-2** | Points entrés en `à risque` et **jamais ressortis** | Hausse — soit les critères sont trop durs, soit on a cessé de travailler ces clients. Dans les deux cas l'alerte a perdu son sens |
| **CM-3** | Transitions automatiques corrigées à la main | Hausse — les règles du distributeur ne correspondent pas à sa réalité et doivent être revues (FR-V20 en fait la matière) |

---

## 9. Découpage en incréments

| Incrément | Pts est. | Titre | Critère de sortie |
|:--:|:--:|---|---|
| **1** | ~29 | **Le réseau existe** — A · B : point de vente, nature, géolocalisation, dédoublonnage, portefeuille, affectation, isolation | Un indépendant ne voit que ses points ; une réaffectation ne perd aucune donnée |
| **2** | ~26 | **Le réseau se lit** — D · E · F : vue 360°, mode hors connexion, segments, carte, zones blanches, plafond de crédit | Un commercial en tournée consulte son portefeuille sans réseau, avec la fraîcheur affichée |

⚠️ **La vue 360° sera largement vide à la livraison, et il faut le dire.** Ce module est en position
**2** ; ses sources sont en **9** (visites), **11** (commandes), **17** (créances) et **24** (relances).

| Ce que l'incrément 2 affiche **réellement au v1** | Ce qui n'arrivera qu'avec son module |
|---|---|
| Identité, contacts, nature, géolocalisation | Commandes et livraisons (#11) |
| Portefeuille, historique d'affectation | Créances et leur ancienneté (#17) |
| Segments, carte, zones blanches | Visites (#9) |
| Plafond de crédit et conditions | Historique de relance (#24) |

La vue est donc conçue **complète** et **remplie progressivement** : chaque module qui arrive branche
sa source sans modifier le contrat (même patron que `FR-S08c` et `FR-V36`). Ce qui est proscrit, c'est
de laisser croire à une fiche 360° opérationnelle au v1.
| **3** | ~26 | **Le réseau se pilote** — C · G · H : pipeline, règles du distributeur, explication des transitions, champs de score, publication | Un point redevenu bon ressort de `à risque` sans intervention, et l'on sait dire pourquoi |

**Pourquoi cet ordre.** L'incrément 1 pose l'objet et la confidentialité — sans quoi rien d'autre n'est
sûr. L'incrément 2 sert le commercial sur le terrain, c'est-à-dire l'usage quotidien. L'incrément 3
porte l'intelligence, et il suppose assez d'historique pour que les règles aient du sens.

---

## 10. Dépendances

| Dépendance | État | Impact |
|---|---|---|
| **Catalogue (#3)** — prix freelance, révélation au départ | ⬜ à construire | FR-V13 déclenche `FR-C29b` : sans le catalogue, le départ se réduit à une réaffectation |
| **Stock (#7)** — nature du point de stock | ⬜ à construire | FR-V02 : la nature du point de vente décide de la valorisation côté Stock |
| **Réseau & zones (#4)** | ⬜ | Zone du point de vente — référence opaque en attendant *[A1]* |
| Commande (#11), Facturation (#17), Relance (#24) | ⬜ | Consommateurs du plafond et fournisseurs de l'historique de la vue 360° *[A2]* |
| Commercial terrain (#9) | ⬜ | Source des visites restituées |
| Module **scoring & prévision** | ⛔ **différé** | FR-V34/V36 : champs présents, non alimentés |
| Assistant IA (#6) | ⬜ | Consommateur du fournisseur de candidats (FR-V37) |

---

## 11. Risques

| # | Risque | Traitement |
|---|---|---|
| **R1** | Un magasin propre est enregistré en partenaire → son stock disparaît de l'actif | **FR-V02** : changement de nature réservé et tracé. Le défaut serait invisible au bilan |
| **R2** | Le portefeuille d'un indépendant fuit vers un autre ou vers la société | **NFR-2**, vérification par tous les chemins |
| **R3** | Les règles de pipeline sont mal calibrées : tout le monde est « à risque », l'alerte perd son sens | **CM-2 + CM-3**, et FR-V20 fait des corrections humaines la matière du réglage |
| **R4** | Le départ d'un indépendant est traité comme une désactivation de compte, sans révélation des prix ni réaffectation | **FR-V13** en fait un processus, pas un interrupteur |
| **R5** | La clause de révélation ne figure pas au contrat des indépendants | **Action produit hors PRD** (`FR-C29d`) |
| **R6** | La vue 360° devient une copie du système, avec des données périmées | **NFR-4** et FR-V23 (source et fraîcheur affichées) |

---

## 12. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | Un point de vente peut-il être servi par **plusieurs** commerciaux (un salarié et un indépendant sur des gammes différentes) ? | ouverte — mon avis : **non au v1**, un titulaire unique ; sinon l'isolation des prix devient inextricable |
| Q2 | Un magasin propre a-t-il un **plafond de crédit** ? | ouverte — se faire crédit à soi-même n'a pas de sens, mais le suivi d'encours interne peut en avoir |
| Q3 | Les règles de pipeline sont-elles **communes au réseau** ou déclinables par zone ? | ouverte — à trancher au découpage |
| Q4 | Que devient le portefeuille d'un salarié qui part ? Même processus que l'indépendant, **sans** la révélation des prix (il n'en a pas) ? | ouverte — mon avis : **oui**, la révélation est propre à l'indépendant |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| **A1** | La zone est une **référence opaque** tant que Réseau & zones (#4) n'existe pas | FR-V01 | PRD Réseau & zones |
| **A2** | La vue 360° se construit par **agrégation à la demande** auprès des modules détenteurs ; au v1 elle n'affiche que ce qui existe, sans dupliquer | FR-V22/V24 | Architecture |
| **A3** | Un point de vente appartient à **une seule** organisation ; deux distributeurs servant la même boutique ne la partagent pas | FR-V42 | 1ᵉʳ cas multi-distributeurs |
| **A4** | La géolocalisation est saisie par le commercial en visite, sans appareil dédié | FR-V03 | Module Commercial terrain (#9) |
