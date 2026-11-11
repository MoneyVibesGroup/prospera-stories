---
title: "PRD — Connecteurs"
status: draft  # corrigé le 2026-11-11 après contrôle ciblé ; validation PO le 13/11
created: 2026-11-10
updated: 2026-11-11
project: prospera
module: connecteurs
service: "à trancher dans la spine (porteur : Dev B ; avant la validation du 13/11)"
verticales: [Distributeur, IMF, Assurance]
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (AD-P17, C1 → C13)
prd_lies: [prd-moteur-installation-2026-11-09, prd-reprise-donnees-2026-11-10]
mode: coaching
---

# PRD — Connecteurs

*Brouillon rédigé à partir du récit du PO (2026-11-10). Décisions et raisons dans `.memlog.md`.*

*Corrections du 2026-11-11 après `controle-cible.md` : décisions du PO QC-2 → QC-11 intégrées (module commercial, tables de correspondance, adaptateurs, relais de la Reprise, retour arrière, écart bloquant, prospect, supervision sur site, bandeaux rendus par la coque) ; nouvelles FR-18 à FR-21 ; contrat de module à 13 clauses. Les hypothèses non décidées sont marquées `[A-n]` et indexées au §8.*

---

## 0. Objet du document

Ce PRD décrit comment Prospera **reste branché**, en permanence et dans les deux sens, sur un logiciel que
le client garde : l'Odoo d'un distributeur, le logiciel de gestion d'une IMF, plus tard le logiciel métier
d'un assureur. Il s'adresse au PO, à Dev A et Dev B, et aux auteurs des modules dont les données
circulent.

Il complète la **Reprise de données**, qui fait entrer les données **une fois** et dont il **partage le
paquet d'adaptateurs**, et le **moteur d'installation**, qui l'installe et en fait une condition de mise en
service. La synchronisation **du téléphone** de l'agent avec Prospera (mode hors ligne) est un autre sujet,
hors de ce PRD : le connecteur relie Prospera **au logiciel du client**.

**Connecteurs est un module commercial** (décision du PO, 2026-11-11) : il a sa ligne au catalogue, il est
**ajouté d'office** à tout contrat qui déclare un logiciel du client, et il est **inclus dans la plateforme
complète**. Sans lui, le moteur ne peut ni le vendre ni décider du mode permanent ou temporaire (FR-3).

**Échéance.** Requis en **février** pour l'Odoo du distributeur (PRD moteur, QA-3 ; FR-17). Le connecteur de
l'IMF (FR-15) n'a pas de date : elle se fixe avec le premier client IMF (porteur : le PO) `[A-1]`.

## 1. Vision

Beaucoup de clients ne quitteront pas leur logiciel. Le comptable du distributeur travaille dans Odoo et ne
veut pas en changer ; le logiciel de l'IMF tient l'argent et le restera. Prospera ne leur demande pas de
choisir : il **s'y branche**, et chacun garde ce qu'il fait le mieux.

La règle qui rend cela sûr tient en une phrase : **chaque domaine de données a un seul propriétaire**. Le
propriétaire a toujours raison ; l'autre logiciel ne fait que recevoir. Trois garde-fous l'accompagnent : on
échange des **mouvements d'échange**, jamais des totaux ; on ne corrige **jamais l'argent en silence** ; et
chaque nuit, on vérifie que les deux logiciels concordent.

Quand le lien tombe, **Prospera continue de travailler et le dit**. Chaque donnée venue de l'autre logiciel
montre sa fraîcheur ; rien de ce qui est saisi n'est perdu ; Money Vibes est prévenue avant le client. Le
connecteur se construit **comme s'il était permanent** : quand un client abandonne son ancien logiciel, on
**arrête la synchro** des domaines un par un, après la mise en service.

## 2. Pour qui

### 2.1 Besoins

- **L'intégrateur et l'ingénieur données Money Vibes** (Rachid, Yao) : brancher le logiciel du client,
  fixer qui est propriétaire de quoi, et suivre la santé de chaque connecteur.
- **La personne qui tranche les écarts** (Awa, comptable chez le distributeur ; le chef d'agence à l'IMF) :
  voir les deux valeurs côte à côte et décider.
- **Les utilisateurs terrain** (Kodjo, Ibrahim) : savoir si la donnée qu'ils regardent est à jour avant
  d'agir.
- **L'administrateur du client** : être prévenu d'une panne qui dure.

### 2.2 Hors cible

- La synchronisation du téléphone avec Prospera (mode hors ligne de l'application terrain).
- La reprise initiale (PRD Reprise de données).

### 2.3 Parcours clés

**UJ-6. Kodjo ne relance pas un client qui a déjà payé.**
Un client rembourse au guichet de l'agence à 9 h. Le logiciel de l'IMF l'enregistre ; en quelques minutes,
le remboursement arrive dans Prospera, et Kodjo le voit sur son téléphone. Un autre jour, le lien est coupé
depuis 2 h : à côté du solde, Kodjo lit en orange « Solde non confirmé depuis 2 h. Vérifiez le reçu du
client avant de relancer. » Il demande le reçu au lieu de relancer.

**UJ-7. Awa tranche un écart d'encaissement.**
Un encaissement Mobile Money de 45 000 F apparaît dans Prospera et à 40 000 F dans Odoo. Rien n'est corrigé
automatiquement : l'écart arrive dans la **file des écarts**, avec les deux valeurs côte à côte et leurs
sources. Awa vérifie le relevé de l'opérateur, retient 45 000 F, et la correction part vers le propriétaire.

**UJ-8. Rachid fixe les propriétaires, puis arrête la synchro des domaines un par un.**
À l'installation, dans l'espace d'essai, Rachid fixe, domaine par domaine, qui est propriétaire : Prospera
pour les points de vente et les encaissements terrain, Odoo pour les écritures comptables ; ces réglages
sont rejoués dans l'espace réel à la mise en service. Chez un client qui a pris la plateforme complète,
l'ordre est celui du moteur et de la Reprise : semaine en parallèle, écart nul, **mise en service**, puis
Rachid **arrête la synchro** des domaines un par un ; Odoo s'arrête quand le dernier domaine est arrêté.

## 3. Vocabulaire

- **Connecteur** : le lien permanent, dans les deux sens, entre Prospera et un **logiciel du client**.
- **Logiciel du client** : le logiciel que le client garde (Odoo, logiciel de gestion de l'IMF, logiciel
  métier de l'assureur).
- **Adaptateur** : ce qui sait **lire et écrire** dans une sorte de logiciel (la Reprise de données n'en
  emploie que la lecture). Le code vit dans un **paquet d'adaptateurs commun** à la Reprise et à Connecteurs ;
  les identifiants, eux, sont propres à chaque module (FR-1).
- **Domaine** : un ensemble de données qui circule comme un tout (points de vente, produits et prix, stock,
  encaissements, écritures comptables, prêts, soldes…).
- **Domaine d'argent** : un domaine qui porte de l'argent : encaissements, remboursements, soldes, prêts,
  épargne, créances, écritures comptables, factures.
- **Propriétaire d'un domaine** : le seul logiciel qui a raison pour ce domaine. L'autre ne fait que
  recevoir. À ne pas confondre avec le « propriétaire » d'un élément du dossier d'installation, qui est le
  module chargé de l'importer (PRD moteur, FR-42).
- **Mode permanent** : le client garde son logiciel pour certains domaines.
- **Mode temporaire** : le connecteur ne sert que le temps du passage ; après la mise en service, on arrête
  la synchro des domaines un par un.
- **Mise en service** : au sens du moteur (PRD moteur, §3 et FR-8) : le passage de l'espace d'essai à
  l'espace réel. Ce que le PRD Reprise appelle « bascule ».
- **Arrêt de la synchro** (d'un domaine) : la fin des échanges pour ce domaine, après la mise en service.
  Ce n'est pas la mise en service.
- **Espace d'essai, espace réel, état publié, lecture seule, dossier d'installation** : au sens du PRD
  moteur (§3, §3.1, FR-43, FR-42).
- **Bac à sable** : au sens du PRD moteur (§3) : une base du logiciel du client, distincte du réel, déclarée
  et **vérifiée** (FR-18). La **liste blanche** est la liste des destinations autorisées en essai.
- **Mouvement d'échange** (« mouvement » dans la suite) : un changement unitaire (« −12 cartons, commande
  n° 4521 »), par opposition à un **total** (« stock = 88 »), qu'on n'échange jamais. À distinguer des
  mouvements d'entrepôt du module Stock, qui en sont une sorte.
- **En attente de confirmation** : l'état d'un mouvement envoyé au propriétaire et pas encore accepté.
- **File d'envoi** : les mouvements saisis dans Prospera qui attendent de partir vers le logiciel du client.
- **Refus du logiciel du client** (« refus » dans la suite) : un mouvement que le logiciel du client rejette,
  avec sa raison. À distinguer des refus nommés d'un serveur Prospera (`ABONNEMENT_EXPIRE`,
  `ECRITURE_REELLE_DEPUIS_ESSAI`…).
- **Écart de concordance** (« écart » dans la suite) : une différence d'argent ou de quantités entre les deux
  logiciels. À distinguer des écarts nommés du moteur et des écarts de reprise. La **file des écarts** les
  présente côte à côte, en attente d'une décision humaine.
- **Contrôle de concordance** : la comparaison nocturne des totaux (stock par entrepôt, encours par agence).
- **Niveau de fraîcheur** : le délai cible d'un domaine : **immédiat** (quelques minutes), **dans
  l'heure**, **la nuit** (avant 6 h).
- **Mention de fraîcheur** : l'indication, à côté d'une donnée venue du logiciel du client, de l'heure de sa
  dernière mise à jour (« Solde à jour à 10 h 12 »). Elle est **rendue par la coque** (FR-11).
- **Point de relais** (point de coupure daté) : la date et l'heure à partir desquelles Connecteurs prend le
  relais de la Reprise pour un domaine (FR-20).
- **Export du logiciel du client** : le secours quand ce logiciel n'a pas d'API ; un fichier produit à
  intervalle régulier et importé automatiquement. À distinguer de l'**export des données de l'organisation**
  (PRD moteur, FR-43).

## 4. Fonctionnalités

### 4.A Brancher et configurer

#### FR-1 : Les adaptateurs
**Conséquences (testables) :**
- Le connecteur parle à **Odoo**, à l'**API** du logiciel d'une IMF, et, sans API, à un **export du
  logiciel du client** (fichier produit plusieurs fois par jour ou chaque nuit).
- Les adaptateurs vivent dans un **paquet commun** à la Reprise de données et à Connecteurs (décision du PO,
  2026-11-11) : une source branchée pour la reprise se branche ensuite en connecteur sans que l'adaptateur
  soit réécrit. L'export du logiciel du client est un adaptateur de ce paquet, déclaré partagé des deux côtés.
  La spine place le paquet (§8, QK-15).
- **Chaque module garde ses propres identifiants** : ceux de la Reprise et ceux de Connecteurs sont deux
  jeux distincts. Rien ne se recopie de l'un à l'autre sans un acte tracé.
- Les identifiants d'accès au logiciel du client sont **chiffrés** et restent **sur l'instance**.
- Le connecteur **interroge** le logiciel du client (connexion sortante) ; il ne reçoit aucun événement
  poussé par lui (sur site : aucun port entrant, PRD moteur, FR-16). Le cas d'un événement poussé vers la
  plateforme est renvoyé à la spine (§8, QK-19).

#### FR-2 : Un propriétaire par domaine
Réalise UJ-8.

**Conséquences (testables) :**
- À l'installation, dans l'**espace d'essai**, l'intégrateur fixe dans la console, **domaine par domaine**,
  le propriétaire : Prospera ou le logiciel du client. Ces réglages font partie du **dossier d'installation**
  et sont rejoués dans l'espace réel à la mise en service (FR-18).
- Le propriétaire a **toujours raison** ; l'autre logiciel ne fait que recevoir.
- Dans Prospera, une donnée d'un domaine dont le propriétaire est le logiciel du client **ne se modifie
  pas directement** : on saisit un **mouvement**, qui part vers le propriétaire et reste **en attente de
  confirmation** jusqu'à son acceptation.
- Changer le propriétaire d'un domaine est un acte tracé, avec un contrôle de concordance juste avant ; pour
  un domaine d'argent, **aucun écart ouvert** sur ce domaine `[A-2]`.

#### FR-3 : Permanent par défaut, temporaire par offre
**Conséquences (testables) :**
- Le connecteur se construit **comme s'il était permanent**.
- **Module commercial** (décision du PO, 2026-11-11) : Connecteurs a une ligne au catalogue (PRD moteur,
  FR-12 et FR-37). Il est **ajouté d'office** dès que le contrat déclare un logiciel du client, et il est
  **inclus dans la plateforme complète**. Sans cette ligne, il ne se vend pas.
- **Mode temporaire** (client qui a pris la plateforme complète, ou le pack Finance & Recouvrement) : le
  connecteur ne sert que le temps du passage. L'ordre est celui du moteur et de la Reprise : marche en
  parallèle, écart nul (PRD Reprise, FR-17), **mise en service**, puis l'intégrateur **arrête la synchro**
  des domaines un par un ; le logiciel du client s'arrête quand le dernier domaine est arrêté.
- **Arrêt de la synchro d'un domaine d'argent** (décision du PO, 2026-11-11) : refusé tant qu'un **écart est
  ouvert** sur ce domaine ; il exige un contrôle de concordance juste avant, sans écart.
- **Mode permanent** (client qui a pris seulement Terrain & Ventes, ou Stock & Logistique ; cas le plus
  fréquent) : le client garde son logiciel pour ce que Prospera ne couvre pas chez lui, le plus souvent la
  comptabilité.
- Le mode **découle de l'offre** du client ; la console le propose, l'intégrateur le confirme.

### 4.B Échanger sans s'écraser

#### FR-4 : Des mouvements, jamais des totaux
**Conséquences (testables) :**
- Le connecteur envoie et reçoit des **mouvements** (« −12 cartons, commande n° 4521 »), jamais un total
  (« stock = 88 »).
- Deux saisies faites au même moment dans les deux logiciels **s'additionnent** au lieu de s'écraser.
- Chaque mouvement porte un identifiant unique ; l'idempotence est exigée par NFR-1.
- Les **prix** et les **attributs** (nom, adresse, statut) ne sont pas des mouvements : ils suivent la règle
  du **dernier effet daté** (FR-5). Le **stock disponible** n'est pas additionné : c'est un calcul du
  propriétaire du stock, que Prospera lit.

#### FR-5 : Trois niveaux de fraîcheur

| Niveau | Délai cible | Données |
|---|---|---|
| **Immédiat** | **5 minutes** au plus (avec API ; impossible avec un export du logiciel du client) | remboursements et encaissements ; blocage de crédit ; stock disponible au moment de valider une commande (lu chez le propriétaire du stock) |
| **Dans l'heure** | < 1 heure | nouveaux clients et points de vente ; produits ; changements de prix (toujours avec une **date d'effet**) |
| **La nuit** | avant 6 h | écritures comptables ; historique pour l'IA ; contrôle de concordance ; préparation des états BCEAO |

**Conséquences (testables) :**
- Chaque domaine porte son niveau de fraîcheur.
- Les données de nuit sont arrivées **avant 6 h**, parce que l'IA prépare la nuit les priorités du matin.
  Ce « 6 h » se lit sur l'**heure de référence** de la plateforme (spine, AD-5) et dans le **fuseau de
  l'organisation** `[A-3]`.
- Un changement de prix sans date d'effet est refusé par le connecteur, avec son motif `[A-4]`.
- Les prix et attributs suivent le **dernier effet daté** : la valeur dont la date d'effet est la plus
  récente l'emporte, sans addition.

#### FR-6 : La file d'envoi : rien n'est perdu
**Conséquences (testables) :**
- Tout mouvement saisi dans Prospera pour un domaine dont le propriétaire est le logiciel du client entre
  dans la **file d'envoi**.
- Au retour de la connexion, les mouvements partent **dans l'ordre**, **sans doublon**.
- La file survit à un redémarrage du serveur.
- Chaque mouvement porte son **état d'envoi** (en attente, envoyé, confirmé, refusé) ; c'est une donnée
  conservée, que la version précédente du module relit (FR-21).
- En `LECTURE_SEULE`, la file est **figée** (FR-19) ; dans l'espace d'essai, elle est **interceptée**
  (FR-18).

#### FR-7 : Les refus, en clair
**Conséquences (testables) :**
- Chaque refus du logiciel du client apparaît avec **sa raison en clair** : « Odoo refuse la facture
  n° 4521 : produit inconnu dans Odoo. »
- Un bouton **« Corriger et renvoyer »** permet de corriger puis de renvoyer le mouvement ; il est enveloppé
  dans `<Ecriture>` (spine, AD-7) : fermé en lecture seule, la consultation reste ouverte.
- Un refus n'est jamais ignoré : il reste visible tant qu'il n'est pas traité.

### 4.C Ne jamais corriger l'argent en silence

#### FR-8 : La file des écarts
Réalise UJ-7.

**Conséquences (testables) :**
- Quand un **solde** ou un **encaissement** diffère entre les deux logiciels, la **correction automatique
  est interdite**.
- L'écart entre dans la **file des écarts**, avec les **deux valeurs côte à côte** et leurs sources.
- Une personne habilitée **tranche** : la comptable chez le distributeur, le chef d'agence à l'IMF. Le
  droit de trancher est un droit de tenant (contrat de module C7).
- Chaque décision est tracée (qui, quand, valeur retenue, motif) ; la correction part vers le propriétaire.
- Trancher est une écriture (la correction part vers le propriétaire) : l'action est enveloppée dans
  `<Ecriture>` (spine, AD-7). En `LECTURE_SEULE`, les écarts restent **consultables mais non tranchables**
  (FR-19).
- Un écart ouvert **bloque l'arrêt de la synchro** d'un domaine d'argent (FR-3).

#### FR-9 : Le contrôle de concordance, chaque nuit
**Conséquences (testables) :**
- Chaque nuit, avant 6 h, une comparaison globale des totaux (stock par entrepôt, encours par agence…)
  vérifie que les deux logiciels concordent.
- Toute discordance entre dans la file des écarts.
- Ce contrôle prolonge **sans intervention humaine** la vérification de la marche en parallèle (PRD Reprise,
  FR-17).
- Pendant la marche en parallèle, c'est **la file des écarts qui fait foi** pour l'arrêt de la synchro
  (QC-8). Le feu vert de la Reprise (écart de reprise nul) est une **autre condition** : il ne se lit pas dans cette file
  (hypothèse A-5 rejetée par le PO, 2026-11-11).

### 4.D Quand le lien tombe

#### FR-10 : Prospera ne s'arrête jamais à cause du connecteur
**Conséquences (testables) :**
- Une panne du connecteur ne bloque **aucun** écran ni aucune saisie de Prospera ; les équipes terrain
  continuent normalement. Test : une panne simulée du logiciel du client, puis la saisie d'une commande, d'un
  encaissement et d'une visite sur chaque écran concerné, sans aucune erreur bloquante.
- Une panne durable met la **santé** du module en `DEGRADE`, jamais en fermeture (PRD moteur, FR-34). Règle :
  `DEGRADE` dès qu'un domaine est **rouge** (FR-11) ou que le logiciel du client est injoignable depuis plus
  de 30 minutes `[A-6]`. Les administrateurs voient alors le bandeau « Santé dégradée » de la coque.
- L'utilisateur terrain (Kodjo) n'est pas administrateur : sa mention vient de la **fraîcheur de la donnée**
  qu'il regarde (FR-11), jamais de la santé.

#### FR-11 : Les mentions de fraîcheur
Réalise UJ-6.

**Conséquences (testables) :**
- À côté de chaque donnée venue du logiciel du client, une mention d'une ligne, qui ne masque ni ne bloque
  l'écran, donne l'heure de sa dernière mise à jour (« Solde à jour à 10 h 12 »). Elle ne repose pas sur la
  seule couleur : le texte dit l'état.
- **Qui fait quoi.** Le module **publie** des champs de fraîcheur normalisés par domaine : date du dernier
  échange, niveau (`IMMEDIAT | HEURE | NUIT`), source (`API | EXPORT`). La **coque** les lit et rend la
  mention avec le composant `<Fraicheur>` (spine, AD-7) ; le module ne rend pas la mention lui-même. La
  « date du jour » est l'heure de référence de la plateforme plus le temps écoulé (spine, AD-5).
- Au-delà du délai cible de son niveau, la mention passe en **orange**, puis en **rouge**. Les **seuils
  orange et rouge sont une table unique de la coque**, alimentée par les seuils de QK-3 :
  - **immédiat** : orange après **5 min**, rouge après **15 min** ;
  - **dans l'heure** : orange après **1 h**, rouge après **3 h** ;
  - **la nuit** : pas d'orange ; rouge si la donnée n'est **pas arrivée à 6 h** (échéance fixe, pas de délai
    glissant), et le **message d'action apparaît dès 6 h**.
  Rouge à **3 fois** le délai cible, et non 2, pour éviter les fausses alertes dues aux coupures réseau
  brèves ; pour les niveaux immédiat et dans l'heure, le **message d'action apparaît dès l'orange** (validé
  par le PO le 2026-11-10).
- Pour les données d'argent, la mention dit **quoi faire** : « Solde non confirmé depuis 2 h. Vérifiez le
  reçu du client avant de relancer. » La coque tire ce message d'une **clef de libellé d'action par
  domaine**.
- Sans API (export du logiciel du client), le niveau **immédiat** est impossible : Prospera l'**affiche**
  (source `EXPORT`), au lieu de faire comme si la donnée était à jour.
- En `LECTURE_SEULE`, la synchronisation entrante continue : la mention reste affichée (FR-19).

#### FR-12 : Le bandeau de la file d'envoi
**Conséquences (testables) :**
- Quand des mouvements attendent, un bandeau l'indique : « 23 commandes en attente d'envoi vers Odoo ».
- Le bandeau est **rendu par la coque** (spine, AD-7, qui reçoit une ligne « file d'envoi » ; décision du
  PO, 2026-11-11). Le module publie seulement la **longueur de la file d'envoi** (et le domaine concerné) ;
  il ne rend aucun bandeau.
- Comme tout bandeau de la coque, il a un droit : il est visible des détenteurs de
  `connecteurs:file:consulter` `[A-7]`.

#### FR-13 : Qui est prévenu
**Conséquences (testables) :**
- **Sur la plateforme, Money Vibes d'abord** : la console montre l'état du connecteur de chaque client
  (dernier échange, longueur de la file d'envoi, nombre de refus et d'écarts) et alerte l'équipe **avant** le
  client : l'alerte de Money Vibes part au plus tard à la fin de la période de 30 minutes, et le client est
  prévenu après elle.
- **L'administrateur du client ensuite**, par WhatsApp ou e-mail (service de notification), si la panne dure
  **plus de 30 minutes**.
- Pour les données de nuit, l'administrateur est aussi prévenu si elles ne sont **pas arrivées à 6 h**
  (validé par le PO) : une panne nocturne ne dure jamais « 30 minutes » aux yeux de quelqu'un,
  mais elle prive l'IA des priorités du matin.
- **Sur site** (décision du PO, 2026-11-11) : **seuls des compteurs** remontent à Money Vibes, par le
  **contrôle quotidien** de l'instance (PRD moteur, FR-16 et FR-26) : état du connecteur, niveau de
  fraîcheur, longueur de la file d'envoi, nombre de refus et d'écarts. Le schéma est **fermé** et ne
  contient **aucune donnée métier** (ni numéro de facture, ni montant, ni nom). L'alerte à l'**administrateur
  du client reste sur l'instance** et part à 30 minutes. La console Money Vibes ne montre, sur site, **ni
  refus ni écarts au contenu métier**. Le délai réel d'alerte de Money Vibes sur site est donc celui du
  contrôle quotidien (jusqu'à 24 h), et non 30 minutes. Les champs du connecteur sont à ajouter au schéma de
  FR-26 (§8, QK-20).

### 4.E Par métier

#### FR-14 : Distributeur et Odoo
Exemple chez un distributeur qui garde Odoo pour la comptabilité :

| Domaine | Propriétaire | Pourquoi |
|---|---|---|
| Points de vente, visites, commandes terrain | Prospera | c'est là qu'ils naissent |
| Encaissements terrain (Mobile Money, espèces) | Prospera | encaissés dans l'application |
| Produits et prix | Odoo, si les achats y travaillent | une seule liste de prix, avec une date d'effet |
| Stock | Odoo, ou Prospera si le client a le pack Stock & Logistique | là où se font les mouvements d'entrepôt |
| Créances ouvertes (factures et soldes dus) | Odoo, tant qu'il tient la comptabilité | les factures y naissent (FR-17, étape 3) ; les promesses et relances restent à Prospera `[A-8]` |
| Commerciaux | Prospera | ce sont les utilisateurs terrain `[A-8]` |
| Fournisseurs | Odoo, si les achats y travaillent | comme les produits `[A-8]` |
| Écritures comptables, lettrage | Odoo | le comptable y travaille |

**Conséquences (testables) :**
- Cette répartition est la **proposition par défaut** de la console pour un distributeur avec Odoo ;
  l'intégrateur l'ajuste.
- Chaque domaine du distributeur a un propriétaire dans cette table : la console refuse de mettre en
  service un domaine sans propriétaire.

**Toutes les versions d'Odoo (décision du PO, 2026-11-10).** Odoo change de forme d'une version à
l'autre ; le connecteur doit donc s'adapter à celle qu'il trouve :
- il **détecte la version** et l'édition (Community ou Enterprise) à la connexion, et l'affiche dans le
  bilan d'installation ;
- il parle les **deux API** d'Odoo : l'ancienne (XML-RPC / JSON-RPC), présente dans toutes les versions
  mais dépréciée depuis Odoo 19 et dont la suppression est annoncée pour Odoo 22 (Odoo Online 21.1) ; et la
  nouvelle (**JSON-2**, depuis Odoo 19). La nouvelle est utilisée dès qu'elle existe ;
- il connaît les **générations de modèles** : par exemple, les factures sont `account.invoice` jusqu'à Odoo
  12, puis `account.move` à partir d'Odoo 13 ;
- un Odoo **personnalisé** par un ancien prestataire passe par les **tables de correspondance**, créées par
  la Reprise (PRD Reprise, FR-4) et copiées par Connecteurs au démarrage de sa synchro (FR-20) ;
- **Odoo Online** n'ouvre son API qu'au **plan Custom** : c'est un **prérequis** déclaré au manifeste et
  vérifié à l'installation (PRD moteur, FR-5), avec l'action à faire si le client n'y est pas ; la
  **version détectée** et les **droits du compte** sont aussi des prérequis vérifiés (C13) ;
- chaque version effectivement rencontrée chez un client entre dans la **matrice de tests** du connecteur ;
  une version jamais testée est signalée à l'installation, sans être refusée `[A-9]`.

#### FR-15 : IMF
**Conséquences (testables) :**
- Le logiciel de l'IMF est **toujours propriétaire de l'argent** : prêts, soldes, épargne.
- Prospera est propriétaire de **ce qu'il crée sur le terrain** : visites, promesses de paiement,
  comptes-rendus, positions GPS.
- Un remboursement saisi par l'agent sur le terrain reste **« en attente de confirmation »** jusqu'à ce que
  le logiciel de l'IMF l'accepte ; il ne modifie aucun solde avant.
- Les autres domaines (proposition par défaut, ajustable) : **clients et rattachement à l'agence** et
  **garanties** (elles portent sur les prêts) appartiennent au logiciel de l'IMF ; le **dossier KYC collecté
  sur le terrain** appartient à Prospera `[A-8]`.
- Séquence : la Reprise **amorce** les données de l'IMF (export ou API), puis Connecteurs prend le **relais**
  à un point de relais daté (FR-20). Le connecteur de l'IMF n'a pas de date (§0, `[A-1]`).

#### FR-16 : Assureur
**Conséquences (testables) :**
- La même règle (un propriétaire par domaine) s'appliquera ; la répartition sera fixée **après examen du
  logiciel de l'assureur**, que le PO n'a pas encore vu (porteur : le PO ; pas de date). Non requis en
  février.

### 4.F Février : l'ordre de livraison du connecteur Odoo

#### FR-17 : Livrer par étapes
Requis en février, pour l'Odoo du distributeur (§0). **Trois étapes** :

**Conséquences (testables) :**
1. **Clients et produits**, avec les prix (le relais de la Reprise se fait à un point de relais daté, FR-20).
2. **Stock**, en lecture.
3. **Factures et encaissements** vers la comptabilité Odoo, **livrés en même temps que la file des écarts
   et l'écran de santé**.
- (Validé par le PO.) Le récit plaçait la file des écarts en 4ᵉ étape. Or l'étape 3 est celle où
  l'**argent** commence à circuler : sans la file des écarts, la règle « jamais d'argent corrigé en
  silence » n'aurait aucun outil pour s'appliquer. L'étape 3 ne part donc pas sans elle.
- La comptabilité dans l'autre sens (d'Odoo vers Prospera) attend : c'est Odoo qui en est propriétaire.

### 4.G Dans le moteur d'installation et avec la Reprise

#### FR-18 : Le connecteur dans l'essai
Reprend les règles de l'espace d'essai du PRD moteur (FR-9, addendum §A-7) et la vérification aller-retour
que son FR-6 attribue à Connecteurs (PRD moteur, §8.4). Les mots « bac à sable », « liste blanche » et
« espace d'essai » sont ceux du moteur.

**Conséquences (testables) :**
- **Liste blanche.** Dans l'espace d'essai, toute **écriture vers le logiciel du client** est une sortie : elle
  ne part que vers une destination **déclarée pour l'essai** (un bac à sable vérifié). Toute autre est
  **interceptée** ; le connecteur la range dans un **journal des écritures interceptées**, consultable (en
  ajout seul).
- **Bac à sable déclaré et vérifié** (addendum §A-7). Il est vérifié quand : (a) le client confirme **par
  écrit** qu'il est distinct de son logiciel réel ; (b) le connecteur **constate une base distincte** :
  adresse et identifiant de base différents de ceux déclarés pour le réel. Le connecteur exécute cette
  vérification et la trace (qui, quand, adresse, identifiant). Tant qu'elle n'a pas réussi, le bac à sable ne
  reçoit rien.
- **Cascade, dans cet ordre** (PRD moteur, FR-9) : (1) le bac à sable vérifié reçoit les écritures de
  l'essai (c'est le défaut) ; (2) sans bac à sable, les écritures sont **interceptées** ; (3) le client peut
  **forcer l'interception** même avec un bac à sable ; (4) le logiciel réel, **jamais**.
- **Identifiants en lecture seule propres à l'essai.** Pour **lire** le vrai logiciel du client pendant
  l'essai (ce qui est permis), le connecteur reçoit un jeu d'identifiants **en lecture seule, distinct** de
  celui du réel. À leur déclaration, une **écriture de test** est tentée ; le logiciel du client doit la
  **refuser**, sinon les identifiants sont **rejetés**.
- **Jamais d'identifiant d'écriture du réel dans l'essai.** Le serveur refuse toute destination déclarée
  pour l'espace réel avec le refus nommé `ECRITURE_REELLE_DEPUIS_ESSAI`, **quel que soit l'écran**. Test :
  déclarer une destination réelle dans l'essai ; le refus est rendu côté serveur.
- **Ligne « aller-retour non vérifié ».** Le connecteur fournit au moteur la vérification **synchronisation
  aller-retour** (PRD moteur, FR-6) : une écriture de test part, puis se relit chez le logiciel du client.
  Critère chiffré : `1` objet de test écrit puis relu à l'identique ; clef d'idempotence propre à la
  vérification (PRD moteur, NFR-6) ; elle s'exécute sous l'identité de service du moteur. Dans l'essai, si
  l'écriture est **interceptée**, la ligne reste 🟠 « **aller-retour non vérifié** » ; elle est vérifiée
  **dans le réel, à la mise en service**.
- **Masquage.** Le rafraîchissement de l'essai n'écrit **aucune donnée personnelle réelle** dans un bac à
  sable sans accord écrit du client ; les champs personnels sont masqués avant l'écriture (PRD moteur,
  FR-10).
- **Le prospect** (décision du PO, 2026-11-11, QC-10). Un prospect qui essaie peut brancher son logiciel
  **en lecture seule** avec des identifiants **dédiés** (écriture de test refusée) ; ses écritures sont
  **toujours interceptées** ; il n'a **pas de bac à sable** sans Money Vibes.
- **Isolation essai / réel.** Le seul flux de l'essai vers le réel est le **dossier d'installation** (PRD
  moteur, FR-42, NFR-3) : y passent les **réglages** du connecteur (propriétaires, niveaux de fraîcheur,
  tables de correspondance par leur propriétaire). Jamais les identifiants (le réel reçoit les siens), ni les
  files d'envoi ou d'écarts, ni le journal des écritures interceptées de l'essai (données métier).
- **Effacement** (PRD moteur, FR-33). À l'effacement d'un essai prospect ou d'une organisation, le connecteur
  efface ses identifiants, ses files d'envoi et d'écarts, ses copies de données et ses tables ; le journal
  reste en ajout seul, **pseudonymisé** ; il rend un certificat à l'appel du moteur.
- **Qui lit quoi.** Pendant l'essai, la Reprise lit **le vrai logiciel** avec ses propres identifiants en
  lecture seule (QK-6) ; le connecteur lit avec les siens ; aucun bac à sable n'est lu par la Reprise `[A-10]`.

#### FR-19 : Le connecteur selon l'état publié
Le connecteur lit **l'état publié** poussé par le moteur (PRD moteur, §3.1), jamais l'horloge de son
conteneur. Un attendu par état :

| État publié | Entrante (logiciel du client → Prospera) | Sortante, file d'envoi, décision d'un écart | Export |
|---|---|---|---|
| `NON_INSTALLE` | rien ; 403 `CONNECTEURS_NOT_ENTITLED` | rien | refusé (aucune donnée) |
| `EN_INSTALLATION` | rien en production ; **vérifications seules**, sous l'identité de service du moteur | rien ; une réinstallation retrouve la file figée (C9) | ouvert (vide à la première installation) |
| `EN_SERVICE` | continue | continue | ouvert |
| `ESSAI_PROSPECT` | lecture seule du logiciel du client, selon FR-18 | écritures **interceptées** (FR-18) | ouvert |
| `PREAVIS` | continue | continue | ouvert |
| `LECTURE_SEULE` | **continue**, et l'écran dit sa **fraîcheur** | **fermée** : nouveaux mouvements refusés `ABONNEMENT_EXPIRE` ; file existante **figée**, reprise au paiement ; écarts **consultables mais non tranchables** | ouvert |
| `SUSPENDU` | fermée, aucune donnée | fermée | ouvert (seul passage) |
| `ESSAI_TERMINE` | fermée | fermée | ouvert jusqu'à l'effacement (FR-33) |
| `DESINSTALLE` | échanges coupés, rien supprimé (C9) | coupée ; file figée | ouvert |

**Conséquences (testables) :**
- En `LECTURE_SEULE` (PRD moteur, FR-43), les lectures (`GET`, `HEAD`, `OPTIONS`) passent ; toute écriture
  est refusée `ABONNEMENT_EXPIRE`, sauf les routes déclarées au manifeste (export, consultation des écarts et
  des refus). Envoyer vers le logiciel du client est une écriture : **fermée**. La synchronisation
  **entrante** continue et l'écran dit sa fraîcheur (FR-11).
- Au paiement (retour à `ACTIF`, état publié `EN_SERVICE`), la file figée **reprend** dans l'ordre, sans
  doublon (NFR-1, NFR-2).
- En `SUSPENDU` et `ESSAI_TERMINE`, **tout est fermé sauf l'export** (et les états réglementaires déclarés,
  s'il y en a).
- `GEL` et `VERSION_FIGEE` (axe 1 du moteur) **ne changent rien** à l'état du connecteur : le travail
  quotidien, donc les échanges, continue ; seuls les changements (installation, mise à jour) sont bloqués.
- Un module `EN_SERVICE` dont un prérequis disparaît (accès au logiciel du client perdu) garde son état
  publié ; sa **santé** passe `DEGRADE` (FR-10), sans fermeture.
- Test : la matrice des **neuf états publiés** est jouée sur `CONNECTEURS_NOT_ENTITLED`, pour chaque sens.

#### FR-20 : Reprendre le relais de la Reprise
Le passage du « une fois » au « permanent » (PRD Reprise, FR-1) a une frontière écrite.

**Conséquences (testables) :**
- **Tables de correspondance** (décision du PO, 2026-11-11, QC-3) : la Reprise les **crée** ; Connecteurs en
  prend une **copie au démarrage de sa synchro** et en est ensuite **seul propriétaire**. La Reprise ne les
  modifie plus. Sans Reprise dans l'offre, le connecteur démarre avec des tables vides et le dit au bilan.
- **Produits, prix et stock** (décision du PO, 2026-11-11, QC-5) : la Reprise les **charge** ; Connecteurs
  prend le **relais à partir d'un point de relais daté**. Les mouvements antérieurs à ce point ne sont pas
  rejoués ; le premier échange part du point de relais (curseur), sans doublon avec le lot repris.
- **Quand la synchro démarre** : **au point de relais**, c'est-à-dire à la mise en service du sous-ensemble (hypothèse A-11
  modifiée par le PO, 2026-11-11) ; pas à la réception définitive, qui peut venir des semaines plus tard.
- **Stock d'ouverture** (décision du PO, 2026-11-11) : quand Odoo est propriétaire du stock, le **comptage
  d'ouverture** se saisit dans les écrans de la Reprise, mise en service la première dans le réel (PRD Reprise FR-16,
  décision du PO du 2026-11-11), puis il est livré au module Stock et part vers Odoo comme **mouvement d'ajustement**
  « en attente de confirmation ».
- **Identifiants** : le connecteur ne reprend pas les identifiants de la Reprise (FR-1). À la réception
  définitive, la Reprise retire les siens (A-11 modifiée).

#### FR-21 : Mise à jour et retour arrière
Concerne la clause C12 (PRD moteur, FR-17 et FR-18).

**Conséquences (testables) :**
- **Un retour arrière ne défait pas ce qui a été écrit chez le client** (décision du PO, 2026-11-11, QC-7).
  Il est `SANS_PERTE` **côté Prospera** : files, écarts, configuration, journal se relisent.
- L'**état d'envoi** de chaque mouvement (FR-6) est une donnée que la **version précédente relit**.
- Les corrections se font par des **mouvements inverses, proposés** à l'intégrateur et à la personne
  habilitée, **jamais automatiques** (NFR-3).
- **Déduplication par adaptateur** : après une restauration `AVEC_PERTE` sur site, le souvenir des mouvements
  déjà envoyés peut être perdu et un renvoi devient possible. L'idempotence (NFR-1) ne protège que si le
  logiciel du client **déduplique sur l'identifiant du mouvement** : chaque adaptateur déclare s'il le fait,
  et le test de conformité le vérifie.
- **La file d'envoi est suspendue** pendant la fenêtre de 7 jours d'un retour arrière, **tant que le DSI n'a
  pas confirmé** qu'elle peut repartir.
- **Interrupteurs.** Le choix de l'API JSON-2 « dès qu'elle existe » (FR-14) et tout changement de
  comportement des adaptateurs sont des **interrupteurs de changement** ; un interrupteur ne change jamais la
  forme des données.

---

## 5. Exigences transverses

- **NFR-1, idempotence** : un mouvement reçu ou envoyé deux fois ne s'applique qu'une fois.
- **NFR-2, ordre** : au sein d'un domaine, les mouvements s'appliquent dans l'ordre de leur création.
- **NFR-3, argent** : aucun chemin de code ne corrige automatiquement un solde ou un encaissement ; un test de
  mutation le vérifie.
- **NFR-4, résistance** : file d'envoi et file des écarts survivent à un redémarrage.
- **NFR-5, confidentialité** : sur site, le connecteur tourne sur l'instance ; aucune donnée métier ne transite
  par Money Vibes. Seuls des compteurs, au schéma fermé, remontent par le contrôle quotidien (FR-13).
- **NFR-6, traçabilité** : propriétaires, arrêts de la synchro d'un domaine, refus, décisions sur les écarts,
  écritures interceptées de l'essai : journalisés en ajout seul.

## 6. Indicateurs de réussite

| # | Indicateur | Cible |
|---|---|---|
| SM-1 | Corrections d'argent faites automatiquement | 0 |
| SM-2 | Mouvements perdus ou appliqués deux fois | 0 |
| SM-3 | Mouvements du niveau « immédiat » arrivés dans le délai cible (avec API) | ≥ 95 % `[A-12]` |
| SM-4 | Contrôles de concordance terminés avant 6 h | 100 % |
| SM-5 | Connecteur Odoo du distributeur de février en service, étapes 1 à 3 de FR-17 | atteint |

**Contre-indicateurs** :
- écarts restés **plus de 48 h** dans la file sans décision `[A-13]` ;
- refus non traités depuis **plus de 24 h** `[A-13]` ;
- pannes découvertes **par le client avant Money Vibes** (sur la plateforme ; sur site, le délai est celui
  du contrôle quotidien, FR-13).

## 7. Contrat de module

| Clause | Pour les connecteurs |
|---|---|
| C1 | Manifeste `connecteurs`, **module commercial** (FR-3). `depends: []` : il peut être vendu sans la Reprise. `enrichiPar` : `reprise` (raison : elle crée les tables de correspondance et charge produits, prix et stock avant le point de relais, FR-20 ; code à fixer par le PRD Reprise) et les modules dont les domaines circulent (raison : ils reçoivent les mouvements). Prérequis : accès au logiciel du client **joignable**, version détectée, droits du compte, plan Custom d'Odoo Online. Déclare aussi : vérifications (code, route, critère), `retourArriere: SANS_PERTE`, `interrupteurs`, `routesLectureSeule`, routes d'export, droits nommés |
| C2 | Gate et cloisonnement par organisation ; refus `CONNECTEURS_NOT_ENTITLED`. Lit l'**état publié poussé**, jamais l'horloge du conteneur ; `LECTURE_SEULE` : écriture refusée `ABONNEMENT_EXPIRE` sauf les routes déclarées ; export toujours ouvert ; identité de service du moteur admise sur les routes de vérification ; matrice des 9 états : FR-19 |
| C3 | Possède (service distinct des modules cibles et de la Reprise, contrat §4 ; QK-15) : configuration des domaines et propriétaires, identifiants du connecteur, files d'envoi et d'écarts, journal, et les **tables de correspondance** une fois copiées de la Reprise (FR-20). Livre aux modules par un **contrat de mouvements nommé et versionné** (C5), n'écrit chez aucun d'eux. L'import de masse reste à la Reprise |
| C4 | Un module cible absent : son domaine est déclaré « non installé », jamais synchronisé ailleurs |
| C5 | Contrats nommés et versionnés : `mouvements-echange@1` (vers les modules cibles et depuis eux) ; `fraicheur-domaine@1` (date du dernier échange, niveau, source, longueur de la file d'envoi, lus par la coque) ; `etat-connecteur@1` (santé, nombre de refus et d'écarts) |
| C6 | Propriétaires, niveaux de fraîcheur et correspondances sont des données par client, jamais du code ; schéma de données identique pour toutes les organisations |
| C7 | Droits nommés `connecteurs:<objet>:<action>` `[A-7]` : `connecteurs:configuration:administrer` (droit de **plateforme**, Rachid, FR-2) ; droits de **tenant** : `connecteurs:ecart:trancher`, `connecteurs:refus:renvoyer`, `connecteurs:file:consulter` |
| C8 | Écrans client dans `prospera-app`, module d'écran `connecteurs` (`src/modules/connecteurs/`) : file des écarts, refus avec « Corriger et renvoyer », file d'envoi ; actions enveloppées dans `<Ecriture>`, consultation ouverte en lecture seule. Les **mentions de fraîcheur** et les **bandeaux** (file d'envoi, fraîcheur dégradée) sont rendus par la **coque** (spine, AD-7), pas par le module. Écrans Money Vibes (configuration, santé, vue par client) dans la console (FR-36) |
| C9 | Désinstaller coupe les échanges sans rien supprimer. Avertissement avant désinstallation : « le logiciel du client cessera de recevoir les mouvements de Prospera ». La file d'envoi et les écarts sont **figés** ; à la réinstallation, rien ne repart seul : la file figée est présentée à l'intégrateur, qui la rejoue ou l'écarte `[A-14]` |
| C10 | Profil compose `connecteurs` |
| C11 | **Sans objet pour le module lui-même** : pas de champ `ia` au manifeste, pas de modèle. Il **achemine** l'historique de nuit vers les modules cibles par `mouvements-echange@1` ; les modèles, journaux de prédictions et consentements vivent dans ces modules. L'historique initial est acheminé par la Reprise (PRD Reprise, FR-20). Rien ne sort de l'instance sans consentement |
| C12 | `retourArriere: SANS_PERTE` pour les données Prospera du connecteur : migrations **additives** pendant 7 jours, lecteur tolérant, topics `@2` si incompatible. **Un connecteur qui a écrit chez le client n'est pas réversible** : l'état d'envoi de chaque mouvement est relu par la version précédente ; les mouvements inverses sont **proposés**, jamais automatiques ; déduplication déclarée par adaptateur ; file d'envoi suspendue pendant la fenêtre tant que le DSI n'a pas confirmé. Interrupteurs : JSON-2 « dès qu'elle existe », comportement des adaptateurs ; jamais de changement de forme (FR-21) |
| C13 | (1) prérequis : logiciel du client joignable (une lecture de test aboutit en moins de 30 secondes `[A-15]`), version détectée, droits du compte, plan Custom ; (2) vérifications chiffrées sous l'identité de service du moteur : version détectée, nombre d'objets lus, écriture de test acceptée sur bac à sable ou refusée sur les identifiants en lecture seule, aller-retour (🟠 « non vérifié » en essai) ; (3) santé `OK | DEGRADE` selon la règle de FR-10, sans fermeture ; (4) état publié lu (C2) ; (5) routes en lecture seule : export, consultation des écarts et des refus ; (6) interception en essai et `ECRITURE_REELLE_DEPUIS_ESSAI` (FR-18) ; (7) export CSV/JSON, import des réglages du dossier d'installation, effacement par organisation ; (8) clef d'idempotence par vérification ; (9) un prérequis en échec marque le connecteur rouge et ses dépendants orange, sans bloquer le reste |

⚡ **Note pour la doctrine.** Quand le propriétaire d'un domaine est le logiciel du client, le module
Prospera qui stocke ces données reste le seul à écrire sa base (C3), mais **l'autorité métier est
extérieure** : ses utilisateurs ne modifient pas ces données directement, ils saisissent des mouvements en
attente de confirmation (FR-2). C'est le premier cas de ce genre ; la spine devra l'écrire comme règle
(porteur : Dev B ; QK-16).

## 8. Questions ouvertes

### 8.1 Questions

| # | Question | État |
|---|---|---|
| QK-1 | Versions d'Odoo | ✅ **Toutes** (PO) ; exigences d'adaptation dans FR-14 |
| QK-2 | Propositions du récit | ✅ **Gardées** (PO), avec trois améliorations **validées** par le PO : file des écarts livrée **avec** l'étape 3 (FR-17) ; alerte « pas arrivé à 6 h » pour la nuit (FR-13) ; seuils de couleur (FR-11) |
| QK-3 | Délai immédiat et seuils | **5 min** ; orange au délai cible, **rouge à 3 fois** (15 min, 3 h), **6 h fixe** pour la nuit (FR-11) : ✅ **validé** par le PO |
| QK-4 | Connecteurs dans l'offre | ✅ tranchée le 2026-11-11 (QC-2) : module commercial, ajouté d'office, inclus dans la plateforme complète (FR-3) |
| QK-5 | Tables de correspondance : un seul propriétaire | ✅ tranchée le 2026-11-11 (QC-3) : créées par la Reprise, copiées par Connecteurs, qui en est ensuite seul propriétaire (FR-20) |
| QK-6 | Adaptateurs et identifiants partagés avec la Reprise | ✅ tranchée le 2026-11-11 (QC-4) : paquet commun, identifiants propres à chaque module (FR-1) |
| QK-7 | Produits, prix et stock : qui charge, qui relaie | ✅ tranchée le 2026-11-11 (QC-5) : la Reprise charge, Connecteurs relaie à un point de relais daté (FR-20) |
| QK-8 | Retour arrière d'un connecteur qui a écrit chez le client | ✅ tranchée le 2026-11-11 (QC-7) : écritures laissées intactes, `SANS_PERTE` côté Prospera, mouvements inverses proposés, file suspendue (FR-21, C12) |
| QK-9 | Un écart ouvert bloque-t-il l'arrêt d'un domaine ? | ✅ tranchée le 2026-11-11 (QC-8) : oui, pour un domaine d'argent (FR-3) |
| QK-10 | Un prospect peut-il brancher un connecteur ? | ✅ tranchée le 2026-11-11 (QC-10) : lecture seule, identifiants dédiés, écritures interceptées, pas de bac à sable sans Money Vibes (FR-18) |
| QK-11 | Supervision sur site | ✅ tranchée le 2026-11-11 (QC-11) : compteurs seuls par le contrôle quotidien ; alerte à l'administrateur sur l'instance (FR-13) |
| QK-12 | Fraîcheur et bandeaux dans la coque | ✅ tranchée le 2026-11-11 (« Amont ») : champs normalisés, table de seuils et ligne « file d'envoi » dans la spine (AD-7) ; le module ne rend pas de bandeau (FR-11, FR-12) |
| QK-13 | Comportement en `LECTURE_SEULE`, `SUSPENDU`, `ESSAI_TERMINE` | ✅ tranchée le 2026-11-11 (selon la recommandation du contrôle ciblé) : FR-19 |
| QK-14 | Stock d'ouverture quand Odoo est propriétaire du stock | ✅ tranchée le 2026-11-11 (selon la recommandation) : comptage saisi dans Prospera, ajustement « en attente de confirmation » (FR-20) |
| QK-15 | Service de Connecteurs et lieu du paquet d'adaptateurs | ✅ orientation validée le 2026-11-11 : **deux services** (Reprise et Connecteurs), paquet d'adaptateurs = bibliothèque commune versionnée avec la plateforme ; la spine du moteur l'écrit (Dev B, avant le 07/12) |
| QK-16 | Règle de doctrine « autorité métier extérieure » | ✅ orientation validée le 2026-11-11 : décision de programme **AD-P18** ; les utilisateurs ne saisissent que des mouvements en attente de confirmation, et la coque les affiche « en attente » ; à écrire par Dev B avant le 07/12 |
| QK-17 | Répartition des propriétaires chez l'assureur | **Ouverte** (réponse du PO reportée, 2026-11-11) : après examen de son logiciel ; porteur : le PO ; pas de date, hors février |
| QK-18 | Date du connecteur de l'IMF | **Ouverte** (réponse du PO reportée, 2026-11-11) : avec le premier client IMF ; porteur : le PO ; pas de date |
| QK-19 | Webhook entrant sur la plateforme | ✅ tranchée le 2026-11-11 : **non en v1**, interrogation sortante seulement (AD-8 de la spine `prospera-app`) ; une interrogation à la minute tient le délai immédiat de 5 min |
| QK-20 | Amendements des documents voisins | Spine AD-7 et PRD Reprise **faits le 2026-11-11** ; schéma fermé de FR-26 du moteur : ✅ validé le 2026-11-11, on y **ajoute les compteurs** par domaine (envoyés, refusés, écarts ouverts, longueur de la file, dernier échange) |

### 8.2 Hypothèses `[A-n]`

**Confirmées par le PO le 2026-11-11**, sauf **A-5, rejetée** (le feu vert de la Reprise ne se lit pas dans la file des écarts) et **A-11, modifiée** (la synchro démarre au point de relais, à la mise en service). Les renvois `[A-n]` restent dans le texte comme traces.

| # | Hypothèse | Où |
|---|---|---|
| A-1 | Le connecteur de l'IMF n'a pas de date ; elle se fixe avec le premier client IMF | §0, FR-15 |
| A-2 | Aucun écart ouvert pour changer le propriétaire d'un domaine d'argent | FR-2 |
| A-3 | « 6 h » = heure de référence de la plateforme (AD-5), fuseau de l'organisation | FR-5 |
| A-4 | Un changement de prix sans date d'effet est refusé par le connecteur | FR-5 |
| A-5 | Le feu vert de la Reprise (écart à zéro) se lit comme « aucun écart ouvert » dans la file des écarts | FR-9 |
| A-6 | `DEGRADE` dès qu'un domaine est rouge ou que le logiciel du client est injoignable depuis plus de 30 minutes | FR-10 |
| A-7 | Noms des droits `connecteurs:<objet>:<action>` et visibilité du bandeau de la file d'envoi | FR-12, C7 |
| A-8 | Propriétaires par défaut des domaines ajoutés (créances, commerciaux, fournisseurs, KYC, garanties, clients IMF) | FR-14, FR-15 |
| A-9 | Une version d'Odoo jamais testée est signalée, sans être refusée | FR-14 |
| A-10 | Pendant l'essai, la Reprise ne lit pas le bac à sable, seulement le vrai logiciel en lecture seule | FR-18 |
| A-11 | La synchro démarre après la réception définitive du lot ; la Reprise retire alors ses identifiants | FR-20 |
| A-12 | SM-3 : au moins 95 % | §6 |
| A-13 | Contre-indicateurs : 48 h pour les écarts, 24 h pour les refus | §6 |
| A-14 | À la réinstallation, la file figée est présentée à l'intégrateur, qui la rejoue ou l'écarte | C9 |
| A-15 | « Joignable » = une lecture de test aboutit en moins de 30 secondes | C13 |
