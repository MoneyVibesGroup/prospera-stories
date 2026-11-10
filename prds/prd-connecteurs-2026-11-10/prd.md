---
title: "PRD — Connecteurs"
status: draft  # contenu rédigé le 2026-11-10 ; relecture (Finalize) avant validation PO le 13/11
created: 2026-11-10
updated: 2026-11-10
project: prospera
module: connecteurs
service: "à trancher dans la spine"
verticales: [Distributeur, IMF, Assurance]
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (AD-P17, C1 → C11)
prd_lies: [prd-moteur-installation-2026-11-09, prd-reprise-donnees-2026-11-10]
mode: coaching
---

# PRD — Connecteurs

*Brouillon rédigé à partir du récit du PO (2026-11-10). Décisions et raisons dans `.memlog.md`.*

---

## 0. Objet du document

Ce PRD décrit comment Prospera **reste branché**, en permanence et dans les deux sens, sur un logiciel que
le client garde : l'Odoo d'un distributeur, le logiciel de gestion d'une IMF, plus tard le logiciel métier
d'un assureur. Il s'adresse au PO, à Dev A et Dev B, et aux auteurs des modules dont les données
circulent.

Il complète la **Reprise de données**, qui fait entrer les données **une fois** et dont il **partage les
adaptateurs**, et le **moteur d'installation**, qui l'installe et en fait une condition de mise en service.
La synchronisation **du téléphone** de l'agent avec Prospera (mode hors ligne) est un autre sujet, hors de
ce PRD : le connecteur relie Prospera **au logiciel du client**.

## 1. Vision

Beaucoup de clients ne quitteront pas leur logiciel. Le comptable du distributeur travaille dans Odoo et ne
veut pas en changer ; le logiciel de l'IMF tient l'argent et le restera. Prospera ne leur demande pas de
choisir : il **s'y branche**, et chacun garde ce qu'il fait le mieux.

La règle qui rend cela sûr tient en une phrase : **chaque domaine de données a un seul propriétaire**. Le
propriétaire a toujours raison ; l'autre logiciel ne fait que recevoir. Trois garde-fous l'accompagnent : on
échange des **mouvements**, jamais des totaux ; on ne corrige **jamais l'argent en silence** ; et chaque
nuit, on vérifie que les deux logiciels concordent.

Quand le lien tombe, **Prospera continue de travailler et le dit**. Chaque donnée venue de l'autre logiciel
montre sa fraîcheur ; rien de ce qui est saisi n'est perdu ; Money Vibes est prévenue avant le client. Le
connecteur se construit **comme s'il était permanent** : quand un client abandonne son ancien logiciel, on
coupe simplement les domaines un par un le jour de la bascule.

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

**UJ-8. Rachid fixe les propriétaires, puis coupe les domaines un par un.**
À l'installation, Rachid fixe, domaine par domaine, qui est propriétaire : Prospera pour les points de vente
et les encaissements terrain, Odoo pour les écritures comptables. Chez un client qui a pris la plateforme
complète, il coupe les domaines un par un le jour de la bascule ; Odoo s'arrête après la semaine en
parallèle.

## 3. Vocabulaire

- **Connecteur** : le lien permanent, dans les deux sens, entre Prospera et un **logiciel du client**.
- **Logiciel du client** : le logiciel que le client garde (Odoo, logiciel de gestion de l'IMF, logiciel
  métier de l'assureur).
- **Adaptateur** : ce qui sait parler à une sorte de logiciel ; partagé avec la Reprise de données.
- **Domaine** : un ensemble de données qui circule comme un tout (points de vente, produits et prix, stock,
  encaissements, écritures comptables, prêts, soldes…).
- **Propriétaire** : pour un domaine, le seul logiciel qui a raison. L'autre ne fait que recevoir.
- **Mode permanent** : le client garde son logiciel pour certains domaines.
- **Mode temporaire** : le connecteur ne sert qu'à la bascule ; on coupe les domaines un par un.
- **Mouvement** : un changement unitaire (« −12 cartons, commande n° 4521 »), par opposition à un **total**
  (« stock = 88 »), qu'on n'échange jamais.
- **En attente de confirmation** : l'état d'un mouvement envoyé au propriétaire et pas encore accepté.
- **File d'envoi** : les mouvements saisis dans Prospera qui attendent de partir vers le logiciel du client.
- **Refus** : un mouvement que le logiciel du client rejette, avec sa raison.
- **File des écarts** : les différences d'argent ou de quantités entre les deux logiciels, présentées côte à
  côte, en attente d'une décision humaine.
- **Contrôle de concordance** : la comparaison nocturne des totaux (stock par entrepôt, encours par agence).
- **Niveau de fraîcheur** : le délai cible d'un domaine : **immédiat** (quelques minutes), **dans
  l'heure**, **la nuit** (avant 6 h).
- **Mention de fraîcheur** : l'indication, à côté d'une donnée venue du logiciel du client, de l'heure de sa
  dernière mise à jour (« Solde à jour à 10 h 12 »).
- **Export planifié** : le secours quand le logiciel du client n'a pas d'API ; un fichier produit à
  intervalle régulier et importé automatiquement.

## 4. Fonctionnalités

### 4.A Brancher et configurer

#### FR-1 : Les adaptateurs
**Conséquences (testables) :**
- Le connecteur parle à **Odoo**, à l'**API** du logiciel d'une IMF, et, sans API, à un **export planifié**
  (fichier produit plusieurs fois par jour ou chaque nuit).
- Les adaptateurs sont **partagés avec la Reprise de données** : une source branchée pour la reprise se
  branche ensuite en connecteur sans être réécrite.
- Les identifiants d'accès au logiciel du client sont **chiffrés** et restent **sur l'instance**.

#### FR-2 : Un propriétaire par domaine
Réalise UJ-8.

**Conséquences (testables) :**
- À l'installation, l'intégrateur fixe dans la console, **domaine par domaine**, le propriétaire : Prospera
  ou le logiciel du client.
- Le propriétaire a **toujours raison** ; l'autre logiciel ne fait que recevoir.
- Dans Prospera, une donnée d'un domaine dont le propriétaire est le logiciel du client **ne se modifie
  pas directement** : on saisit un **mouvement**, qui part vers le propriétaire et reste **en attente de
  confirmation** jusqu'à son acceptation.
- Changer le propriétaire d'un domaine est un acte tracé, avec un contrôle de concordance juste avant.

#### FR-3 : Permanent par défaut, temporaire par bascule
**Conséquences (testables) :**
- Le connecteur se construit **comme s'il était permanent**.
- **Mode temporaire** (client qui a pris la plateforme complète, ou le pack Finance & Recouvrement avec la
  comptabilité SYSCOHADA) : le jour de la bascule, l'intégrateur **coupe les domaines un par un** ; le
  logiciel du client s'arrête après la marche en parallèle.
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
- Chaque mouvement porte un identifiant unique ; le recevoir deux fois ne l'applique qu'une fois.

#### FR-5 : Trois niveaux de fraîcheur

| Niveau | Délai cible | Données |
|---|---|---|
| **Immédiat** | quelques minutes `[ASSUMPTION : ≤ 5 minutes]` | remboursements et encaissements ; blocage de crédit ; stock disponible au moment de valider une commande |
| **Dans l'heure** | < 1 heure | nouveaux clients et points de vente ; produits ; changements de prix (toujours avec une **date d'effet**) |
| **La nuit** | avant 6 h | écritures comptables ; historique pour l'IA ; contrôle de concordance ; préparation des états BCEAO |

**Conséquences (testables) :**
- Chaque domaine porte son niveau de fraîcheur.
- Les données de nuit sont arrivées **avant 6 h**, parce que l'IA prépare la nuit les priorités du matin.
- Un changement de prix sans date d'effet est refusé.

#### FR-6 : La file d'envoi : rien n'est perdu
**Conséquences (testables) :**
- Tout mouvement saisi dans Prospera pour un domaine dont le propriétaire est le logiciel du client entre
  dans la **file d'envoi**.
- Au retour de la connexion, les mouvements partent **dans l'ordre**, **sans doublon**.
- La file survit à un redémarrage du serveur.

#### FR-7 : Les refus, en clair
**Conséquences (testables) :**
- Chaque refus du logiciel du client apparaît avec **sa raison en clair** : « Odoo refuse la facture
  n° 4521 : produit inconnu dans Odoo. »
- Un bouton **« Corriger et renvoyer »** permet de corriger puis de renvoyer le mouvement.
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

#### FR-9 : Le contrôle de concordance, chaque nuit
**Conséquences (testables) :**
- Chaque nuit, avant 6 h, une comparaison globale des totaux (stock par entrepôt, encours par agence…)
  vérifie que les deux logiciels concordent.
- Toute discordance entre dans la file des écarts.
- Ce contrôle prolonge **sans intervention humaine** la vérification de la marche en parallèle (PRD Reprise,
  FR-17).

### 4.D Quand le lien tombe

#### FR-10 : Prospera ne s'arrête jamais à cause du connecteur
**Conséquences (testables) :**
- Une panne du connecteur ne bloque **aucun** écran ni aucune saisie de Prospera ; les équipes terrain
  continuent normalement.

#### FR-11 : Les mentions de fraîcheur
Réalise UJ-6.

**Conséquences (testables) :**
- À côté de chaque donnée venue du logiciel du client, une mention discrète donne l'heure de sa dernière
  mise à jour (« Solde à jour à 10 h 12 »).
- Au-delà du délai cible de son niveau, la mention passe en **orange**, puis en **rouge**
  `[ASSUMPTION : rouge au double du délai cible]`.
- Pour les données d'argent, la mention dit **quoi faire** : « Solde non confirmé depuis 2 h. Vérifiez le
  reçu du client avant de relancer. »
- Sans API (export planifié), le niveau **immédiat** est impossible : Prospera l'**affiche**, au lieu de
  faire comme si la donnée était à jour.

#### FR-12 : Le bandeau de la file d'envoi
**Conséquences (testables) :**
- Quand des mouvements attendent, un bandeau l'indique : « 23 commandes en attente d'envoi vers Odoo ».

#### FR-13 : Qui est prévenu
**Conséquences (testables) :**
- **Money Vibes d'abord** : la console montre l'état du connecteur de chaque client (dernier échange, file
  d'envoi, refus, écarts) et alerte l'équipe, souvent avant que le client ne remarque rien.
- **L'administrateur du client ensuite**, par WhatsApp ou e-mail, si la panne dure **plus de 30 minutes**.
- Sur une instance sur site, l'état du connecteur fait partie des informations de santé envoyées à Money
  Vibes (PRD moteur, FR-16 et FR-26), sans aucune donnée métier.

### 4.E Par métier

#### FR-14 : Distributeur et Odoo
Exemple chez un distributeur qui garde Odoo pour la comptabilité :

| Domaine | Propriétaire | Pourquoi |
|---|---|---|
| Points de vente, visites, commandes terrain | Prospera | c'est là qu'ils naissent |
| Encaissements terrain (Mobile Money, espèces) | Prospera | encaissés dans l'application |
| Produits et prix | Odoo, si les achats y travaillent | une seule liste de prix, avec une date d'effet |
| Stock | Odoo, ou Prospera si le client a le pack Stock & Logistique | là où se font les mouvements d'entrepôt |
| Écritures comptables, lettrage | Odoo | le comptable y travaille |

**Conséquences (testables) :**
- Cette répartition est la **proposition par défaut** de la console pour un distributeur avec Odoo ;
  l'intégrateur l'ajuste.
- Versions d'Odoo supportées : `[QUESTION QK-1]`.

#### FR-15 : IMF
**Conséquences (testables) :**
- Le logiciel de l'IMF est **toujours propriétaire de l'argent** : prêts, soldes, épargne.
- Prospera est propriétaire de **ce qu'il crée sur le terrain** : visites, promesses de paiement,
  comptes-rendus, positions GPS.
- Un remboursement saisi par l'agent sur le terrain reste **« en attente de confirmation »** jusqu'à ce que
  le logiciel de l'IMF l'accepte ; il ne modifie aucun solde avant.

#### FR-16 : Assureur
**Conséquences (testables) :**
- La même règle (un propriétaire par domaine) s'appliquera ; la répartition sera fixée **après examen du
  logiciel de l'assureur**, que le PO n'a pas encore vu. Non requis en février.

### 4.F Février : l'ordre de livraison du connecteur Odoo

#### FR-17 : Livrer par étapes
**Conséquences (testables) :**
1. **Clients et produits**, avec les prix.
2. **Stock**, en lecture.
3. **Factures et encaissements** vers la comptabilité Odoo.
4. **La file des écarts** et l'**écran de santé**.
- La comptabilité dans l'autre sens (d'Odoo vers Prospera) attend : c'est Odoo qui en est propriétaire.

---

## 5. Exigences transverses

- **NFR-1, idempotence** : un mouvement reçu ou envoyé deux fois ne s'applique qu'une fois.
- **NFR-2, ordre** : au sein d'un domaine, les mouvements s'appliquent dans l'ordre de leur création.
- **NFR-3, argent** : aucun chemin de code ne corrige automatiquement un solde ou un encaissement ; un test de
  mutation le vérifie.
- **NFR-4, résistance** : file d'envoi et file des écarts survivent à un redémarrage.
- **NFR-5, confidentialité** : sur site, le connecteur tourne sur l'instance ; aucune donnée métier ne transite
  par Money Vibes.
- **NFR-6, traçabilité** : propriétaires, coupures de domaines, refus, décisions sur les écarts : journalisés
  en ajout seul.

## 6. Indicateurs de réussite

| # | Indicateur | Cible |
|---|---|---|
| SM-1 | Corrections d'argent faites automatiquement | 0 |
| SM-2 | Mouvements perdus ou appliqués deux fois | 0 |
| SM-3 | Mouvements du niveau « immédiat » arrivés dans le délai cible (avec API) | ≥ 95 % `[ASSUMPTION]` |
| SM-4 | Contrôles de concordance terminés avant 6 h | 100 % |
| SM-5 | Connecteur Odoo du distributeur de février en service, étapes 1 à 4 | atteint |

**Contre-indicateurs** :
- écarts restés **plus de 48 h** dans la file sans décision ;
- refus non traités depuis **plus de 24 h** ;
- pannes découvertes **par le client avant Money Vibes**.

## 7. Contrat de module

| Clause | Pour les connecteurs |
|---|---|
| C1 | Manifeste `connecteurs` ; `depends: []` ; `enrichiPar` : les modules dont les domaines circulent ; prérequis : accès au logiciel du client, vérifié à l'installation (PRD moteur FR-5) |
| C2 | Gate et cloisonnement par organisation ; refus `CONNECTEURS_NOT_ENTITLED` |
| C3 | Possède : configuration des domaines et propriétaires, files d'envoi et d'écarts, journal ; livre aux modules par leur point d'import, n'écrit chez aucun d'eux |
| C4 | Un module absent : son domaine est déclaré « non installé », jamais synchronisé ailleurs |
| C5 | Contrats nommés vers les modules ; publie l'état de santé et les écarts |
| C6 | Propriétaires, niveaux de fraîcheur et correspondances sont des données par client, jamais du code |
| C7 | Droits : configurer, trancher un écart, corriger et renvoyer un refus |
| C8 | Écrans : console Money Vibes (configuration, santé) ; `prospera-app` (file des écarts, mentions de fraîcheur) |
| C9 | Désinstaller coupe les échanges sans rien supprimer |
| C10 | Profil compose `connecteurs` |
| C11 | Sans IA propre ; achemine la nuit l'historique dont l'IA a besoin |

⚡ **Note pour la doctrine.** Quand le propriétaire d'un domaine est le logiciel du client, le module
Prospera qui stocke ces données reste le seul à écrire sa base (C3), mais **l'autorité métier est
extérieure** : ses utilisateurs ne modifient pas ces données directement, ils saisissent des mouvements en
attente de confirmation (FR-2). C'est le premier cas de ce genre ; la spine devra l'écrire comme règle.

## 8. Questions ouvertes

| # | Question | Proposition |
|---|---|---|
| QK-1 | Quelles **versions d'Odoo** le connecteur supporte-t-il ? | Odoo 17 et 18, Community et Enterprise, à confirmer selon la version du distributeur de février |
| QK-2 | Les **propositions** du récit (mode selon l'offre, trois garde-fous, trois niveaux de fraîcheur, alerte au client après 30 min, ordre de livraison pour février) sont-elles retenues telles quelles ? | les retenir |
| QK-3 | Délai « immédiat » : **5 minutes** au plus, et alerte rouge au double du délai cible ? | oui |
