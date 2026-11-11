---
title: "PRD — Reprise de données"
status: draft  # corrigé le 2026-11-11 après contrôle ciblé ; validation PO le 13/11
created: 2026-11-10
updated: 2026-11-11
project: prospera
module: reprise
service: "service distinct (la Reprise possède un agrégat que nul module cible n'écrit : contrat de module §4, C3) ; la spine ne tranche que la place du paquet d'adaptateurs commun avec Connecteurs (QC-4)"
verticales: [Assurance, Distributeur, IMF]  # Cabinet : aucune reprise prévue (moteur FR-7), à confirmer (§8.3)
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (AD-P17, C1 → C13)
prd_lies: [prd-moteur-installation-2026-11-09 (FR-6, FR-7, FR-8, FR-33, FR-42, FR-43), prd-connecteurs-2026-11-10, GED (sinistres)]
mode: coaching
---

# PRD — Reprise de données

*Brouillon rédigé à partir du récit du PO (2026-11-10). Les décisions et leurs raisons sont dans
`.memlog.md` ; les inférences, toutes confirmées le 2026-11-11, sont récapitulées au §8.5.*

*Corrections du 2026-11-11 après `controle-cible.md` : décisions du PO QC-1 → QC-10 intégrées (module
installable, tables de correspondance, paquet d'adaptateurs commun, relais à Connecteurs, comptage du stock
avant la mise en service, validation, essai du prospect, exception d'import pendant `EN_INSTALLATION`,
module d'écran `reprise` dès février). Nouvelles exigences : FR-21 → FR-24, NFR-6.*

---

## 0. Objet du document

Ce PRD décrit comment les données d'un client **entrent une fois** dans Prospera : depuis son ancien
logiciel, un export, une clé USB, des fichiers Excel ou JSON, Odoo, ou l'API de son logiciel. Il s'adresse
au PO, à Dev A et Dev B, et aux auteurs des PRD des modules qui reçoivent ces données.

Il s'appuie sur le **contrat de module** (AD-P17) et se raccorde à deux voisins : le **moteur
d'installation**, qui lit le feu vert de la reprise avant toute mise en service (PRD moteur FR-6 et FR-8),
et le module **Connecteurs** (`prd-connecteurs-2026-11-10`), qui prend le relais quand le client garde son
ancien logiciel. La **numérisation des archives papier** n'en fait pas partie : c'est un chantier de la
GED, qui consomme les clés de rattachement que la reprise fournit.

La Reprise est un **module installable** (décision du PO, 2026-11-11, QC-1) : elle a son manifeste, sa
garde, sa ligne dans l'offre, et elle est **ouverte d'office** dans l'essai du prospect (FR-21).

## 1. Vision

La reprise est **le moment où le client décide de faire confiance à nos chiffres**. S'il retrouve ses
dossiers, ses soldes et ses créances exactement comme il les connaît, il valide la reprise et peut être
mis en service ; sinon, rien d'autre ne compte. La reprise doit donc être **juste**, et le **prouver** : chaque écart est montré, chaque
correction est expliquée, et le client valide avant que rien n'entre.

Elle sépare ce qui sert **dès le premier jour** (les **données vivantes** : dossiers en cours, soldes,
créances, stock) de ce qui sert à **comprendre et à apprendre** (l'**historique** : sinistres clos, ventes
passées, prêts remboursés). Les premières doivent être exactes au franc près, sinon on ne met pas en
service. Le second entre **protégé** (non modifiable) ; ses défauts sont signalés sans retarder personne. C'est lui qui **calibre
l'IA dès le premier jour**, au lieu de la laisser apprendre pendant des mois.

Aujourd'hui, c'est l'équipe Money Vibes qui fait la reprise initiale et la mise en service. Demain, le client fera
lui-même ses imports courants (une nouvelle zone, un nouveau catalogue, une agence rachetée) **avec le
même moteur, le même rapport et la même validation**. Le module est donc pensé dès maintenant pour ces deux
publics.

## 2. Pour qui

### 2.1 Besoins

- **L'ingénieur données et l'intégrateur Money Vibes** (Yao pour l'assurance et l'IMF, Rachid pour le
  distributeur) : faire entrer les données d'une source imparfaite, voir tout ce qui cloche, corriger, et
  rejouer la reprise à l'identique le jour de la mise en service.
- **Le client qui valide** (DG, comptable, DSI) : voir ce qui va entrer, comprendre chaque écart, et
  valider en connaissance de cause.
- **Le prospect en essai** : charger ses propres données dans l'espace d'essai et juger la reprise sans
  Money Vibes, avant de décider de conclure (PRD moteur FR-33).
- **Les utilisateurs du client** (gestionnaire, commercial, agent de crédit) : retrouver leurs dossiers
  dans un état cohérent, avec leurs vraies dates et leurs vrais montants.
- **Plus tard, l'administrateur du client** : charger lui-même un fichier courant (200 points de vente, un
  catalogue) sans appeler Money Vibes.

### 2.2 Hors cible

- Le **paramétrage** : experts et partenaires agréés, barèmes, franchises, grilles de vétusté. Ils sont
  saisis et validés pendant les ateliers de cadrage.
- La **numérisation** des archives papier (GED).
- La **synchronisation permanente** avec un logiciel que le client garde (module Connecteurs).
- La **vertical Cabinet** : le moteur la fait passer par le même chemin et avertit « aucune reprise
  prévue » (PRD moteur FR-7) ; à confirmer (§8.3).

### 2.3 Parcours clés

Les parcours UJ-1 (assurance, Fatou), UJ-2 (distributeur, Ibrahim) et UJ-3 (IMF, Mariam) du PRD moteur
s'appliquent ; la reprise en est l'étape 2. S'y ajoutent :

**UJ-4. Yao reprend les sinistres de l'assureur, et aucun dossier n'arrive dans un état impossible.**
Yao charge l'export de l'ancien logiciel dans l'espace d'essai. Le rapport montre 1 830 assurés, 2 410
polices en vigueur, 312 sinistres ouverts, et 27 sinistres **requalifiés** : l'ancien logiciel les disait
« ouverts » alors que leurs pièces manquent ; ils arrivent « en attente de pièces ». Neuf sinistres n'ont
pas de montant chiffré validé : ils sont signalés, et le gestionnaire le saisira avec un motif. Koffi et le
responsable sinistres relisent la liste ; le DG de l'assureur, ou la personne qu'il a désignée par écrit, la
valide (FR-13). Le jour J, Yao rejoue la même reprise sur un export frais, et le DG valide le lot du réel.
*(chiffres illustratifs)*

**UJ-5. Awa charge 200 nouveaux points de vente toute seule.** *(libre-service : dès février pour le
prospect en essai, ensuite pour le client)*
Six mois après la mise en service, Moussa ouvre une zone. Awa, administratrice chez le client, dépose le
fichier Excel des 200 points de vente. Le même rapport lui montre 4 doublons avec des points de vente
existants et 11 lignes sans commercial rattaché. Elle corrige, puis valide : le DG l'a désignée par écrit,
une fois, pour les imports courants (FR-13). Les points de vente apparaissent dans la zone. Personne chez
Money Vibes n'est intervenu.
*Variante du prospect (février).* Un prospect distributeur, dans son espace d'essai, dépose ses propres
fichiers, lit le rapport et voit ses données dans les modules de son offre d'essai, sans Money Vibes
(PRD moteur FR-33). S'il signe, sa reprise est refaite à neuf dans l'espace réel (FR-16) ; s'il ne signe
pas, tout est effacé (FR-22).

## 3. Vocabulaire

- **Source** : l'endroit d'où viennent les données. Fichier (Excel, CSV, JSON ; une clé USB n'est qu'un
  porteur de fichiers), Odoo, ou API du logiciel du client.
- **Adaptateur** : ce qui sait lire une sorte de source et la traduire dans le format commun. Le code des
  adaptateurs Odoo et API est un **paquet commun** avec le module Connecteurs (FR-1).
- **Lot de reprise** : un passage complet d'une source vers Prospera, de la lecture au rapport. Un lot se
  rejoue.
- **Dossier d'installation** : ce qui se rejoue de l'essai vers le réel (PRD moteur §3). Pour la Reprise :
  adaptateurs réglés, tables de correspondance et règles de traduction d'état. Jamais de rapport, de
  validation, de fichier ni de feu vert.
- **Mise en service** : l'acte du moteur qui ouvre un sous-ensemble dans l'espace réel (PRD moteur FR-8).
  Ce document n'emploie aucun autre mot pour cet acte.
- **Point de coupure** : la date et l'heure à partir desquelles le module Connecteurs, et non plus la
  Reprise, transmet les mouvements d'un domaine (FR-24). Ce n'est pas la mise en service.
- **Données vivantes** : les données qui servent au travail dès le premier jour. Elles entrent dans les
  tables métier ; la règle **écart nul** s'applique, sauf au stock d'ouverture (FR-10).
- **Historique** : les données passées, **protégées** (non modifiables depuis l'application), pour la
  consultation et la calibration de l'IA. Leurs écarts sont signalés, jamais bloquants. Ce n'est pas
  l'état `LECTURE_SEULE` d'un module (PRD moteur FR-43) : la protection est une propriété de l'**objet**.
- **Écart de reprise** (ou **écart**) : une différence entre la source et ce que Prospera accepte ou
  calcule (doublon, référence inconnue, solde différent, champ obligatoire absent). À ne pas confondre avec
  l'**écart de synchronisation** de Connecteurs (décision humaine sur une écriture, dans sa file des écarts).
- **Écart nul** : la condition du feu vert (PRD moteur FR-8) ; aucun écart de reprise ouvert sur les
  données vivantes (hors stock). Le stock a son propre feu vert : le **comptage clos** (FR-10).
- **Table de correspondance** : la règle qui relie une valeur de la source à une valeur de Prospera
  (référence produit, état, code agence). Créée par la Reprise (FR-4).
- **Traduction d'état** : la règle qui transforme l'état d'un objet dans l'ancien logiciel en un **état
  valide** du circuit Prospera.
- **Requalification** : un objet dont l'état a dû être changé par la traduction ; toujours signalée.
- **Rapport de reprise** : le livrable du lot : ce qui est repris, ce qui manque, les écarts, les
  requalifications. Le client le **valide** (FR-13).
- **Validation** : l'acte du client qui accepte la liste finale **avant** l'import. Ce n'est pas la
  **réception définitive** du moteur, qui est la signature de la fin d'installation d'un sous-ensemble.
- **Feu vert** : le fait publié par la Reprise, **par sous-ensemble** et sur le lot rejoué dans le réel,
  que le moteur lit avant la mise en service (FR-15).
- **Clé de rattachement** : l'identifiant (n° de police, n° de sinistre) qui permet à la GED de relier un
  document numérisé à un dossier repris.
- **Orphelin** : un document ou un objet qu'aucune clé ne relie ; il va dans une file « à rattacher ».
- **Module cible** : le module qui reçoit les données reprises et qui seul les écrit (contrat de module C3).

## 4. Fonctionnalités

### 4.A Lire la source

#### FR-1 : Des sources multiples, un seul format commun
**Conséquences (testables) :**
- La reprise lit des fichiers **Excel, CSV et JSON**, **Odoo**, et l'**API** du logiciel du client quand
  il en a une.
- Pour l'IMF, l'amorçage se fait **par export ou par API, selon le logiciel en face** ; ensuite, le module
  Connecteurs maintient les données, à partir d'un point de coupure daté (FR-24).
- Chaque source passe par un **adaptateur** qui produit le même format commun ; ajouter une source, c'est
  ajouter un adaptateur, sans toucher au reste : un test ajoute un adaptateur de démonstration sans
  modifier le code des autres.
- Le code des adaptateurs Odoo et API est un **paquet commun** à la Reprise et à Connecteurs ; chaque
  module garde ses **propres identifiants de connexion** (décision du PO, 2026-11-11, QC-4). La spine place
  le paquet et son versionnement (§8.3).
- La Reprise bénéficie de la même couverture des **versions d'Odoo** que Connecteurs (détection de version,
  deux API, matrice de tests du PRD Connecteurs) et du même prérequis (plan Custom d'Odoo Online) ; ce
  prérequis est déclaré au manifeste (§7, C13).

#### FR-2 : Chaque objet garde sa trace d'origine
**Conséquences (testables) :**
- Tout objet repris garde sa **source**, son **lot**, et sa **ligne ou son identifiant d'origine**.
- Depuis n'importe quel dossier repris, on retrouve la ligne de la source dont il vient, **tant que le
  lot existe** : la Reprise garde, après la suppression des fichiers (FR-3), un **index** (numéro de ligne,
  empreinte de la ligne, lot) sans le contenu de la ligne.
- La **provenance** est fournie à la cible par son point d'import (champ de provenance à nommer dans le
  contrat d'import) ; l'emplacement du lien « ligne de la source » dans l'écran de chaque cible est à
  déclarer (§8.3).

#### FR-3 : Les fichiers déposés restent chez le client
**Conséquences (testables) :**
- Sur une instance sur site, les fichiers déposés restent **sur l'instance** ; aucun ne transite par Money
  Vibes.
- Les fichiers d'une reprise se conservent **jusqu'à la réception définitive** (PRD moteur FR-8, §3), puis
  sont **supprimés**, et la suppression est tracée (décision du PO, 2026-11-10).
- La réception définitive est enregistrée **par sous-ensemble** ; la Reprise la **consomme** (événement
  publié par le moteur). Chaque lot est rattaché à un ou plusieurs sous-ensembles. Un fichier n'est supprimé
  qu'à la réception de **tous** les sous-ensembles qu'il alimente.
- **Imports courants** (après la mise en service) : aucune réception ne les clôt. Leurs fichiers sont
  supprimés **30 jours** (décision du PO, 2026-11-11) après la validation et l'import réussi du lot, la suppression étant
  tracée.
- Les fichiers de l'**essai** ne passent jamais dans l'espace réel : seul le dossier d'installation y passe
  (FR-16). Ceux d'un prospect non signé sont effacés (FR-22).

### 4.B Traduire sans trahir

#### FR-4 : Les tables de correspondance
**Conséquences (testables) :**
- Une valeur de la source qui ne correspond à rien dans Prospera (référence produit personnalisée dans un
  Odoo, code agence) est un **écart**, jamais une invention.
- La **Reprise crée** les tables de correspondance (décision du PO, 2026-11-11, QC-3) : l'intégrateur les
  construit ; elles sont enregistrées avec le lot et **rejouées telles quelles** le jour de la mise en
  service.
- Une table de correspondance ne contient que des **codes et libellés de référence** (produit, état,
  agence), jamais un montant ni l'identité d'une personne : c'est ce qui lui permet de
  figurer au dossier d'installation (PRD moteur FR-42, addendum A-7).
- La Reprise **importe sa part du dossier d'installation** par sa propre route d'import ; rejouée deux
  fois, elle ne crée rien de plus. Si la version du dossier diffère de celle de l'essai, le moteur refuse
  (`DOSSIER_VERSION_DIFFERENTE`, 409) avant tout import.
- Quand le client garde son logiciel, Connecteurs **copie** les tables au démarrage de sa synchronisation
  et en devient seul propriétaire (FR-24).

#### FR-5 : Un état repris est un état valide
Leçon des répétitions de démonstration : un sinistre ne passe de « déclaré » à « ouvert » que si ses
pièces sont complètes.

**Conséquences (testables) :**
- Chaque état de la source est **traduit** vers un état valide du circuit Prospera.
- Un objet qui ne satisfait pas les conditions de l'état traduit est **requalifié** (« ouvert » sans
  pièces devient « en attente de pièces »), et le rapport liste chaque requalification avec sa raison.
- Aucun objet n'entre dans un état que le circuit ne pourrait pas atteindre.

#### FR-6 : Les dates d'origine, jamais la date d'import
**Conséquences (testables) :**
- Déclaration, expertise, décision, règlement, échéance : chaque date reprise est la **date d'origine**.
- Aucune date métier ne prend la date du jour de l'import ; un test vérifie qu'un délai calculé sur un
  objet repris est identique à celui de la source.

#### FR-7 : Jamais de zéro silencieux
**Conséquences (testables) :**
- Un montant **requis** absent de la source (par exemple le montant chiffré validé d'un sinistre) n'est
  jamais remplacé par zéro : l'objet est marqué « montant à saisir ».
- L'utilisateur le saisit ensuite **avec un motif**, tracé.
- L'objet porte un marqueur `montantASaisir` que les écrans du module cible honorent (§8.3).

### 4.C Données vivantes et historique

#### FR-8 : Deux régimes
**Conséquences (testables) :**
- Les **données vivantes** entrent dans les tables métier des modules cibles ; la règle **écart nul**
  s'applique (sauf au stock d'ouverture, FR-10).
- L'**historique** entre **protégé** ; ses écarts figurent au rapport mais ne bloquent jamais la mise en
  service.
- Un objet d'historique ne peut pas être modifié depuis l'application : il porte un marqueur `historique`
  que le point d'import de la cible pose et que ses écrans honorent (la protection est par objet, pas par
  module : voir §8.3).

#### FR-9 : Le périmètre par métier

| Métier | Données vivantes (écart nul) | Historique (protégé) |
|---|---|---|
| **Assurance** | assurés (identité, contacts) ; polices en vigueur (garanties, échéances, primes) ; sinistres ouverts (état, montants chiffrés, réserves, pièces reçues, expert désigné) | sinistres clos (nature, montants, délais, décisions, recours) et polices résiliées ou échues qui leur sont liées |
| **Distributeur** | points de vente (contacts, zone, GPS si disponible, commercial rattaché) ; produits et prix (prix société, prix freelance) ; créances ouvertes ; commerciaux ; fournisseurs ; stock d'ouverture (FR-10, feu vert propre : comptage clos) | ventes par point de vente et par produit ; historique des paiements des clients |
| **IMF** | clients et KYC ; prêts en cours (capital restant dû, **échéancier complet**, retards, pénalités) ; soldes d'épargne ; garanties ; rattachement à l'agence et à l'agent de crédit | prêts clos et leurs remboursements |

**Profondeur d'historique (décision du PO, 2026-11-10) :** **pas de borne fixe**. On reprend **tout
l'historique que le client peut fournir**, avec un **objectif de 3 ans ou plus** pour les trois métiers :
c'est ce qui rend l'IA utile (saisons des ventes, cycles de crédit, délais de sinistres).

**Conséquences (testables) :**
- Un prêt en cours sans échéancier complet est un écart bloquant : sans échéancier, pas de portefeuille à
  risque.
- Aucune borne haute ne limite l'historique repris.
- Un historique de **moins de 3 ans** est signalé au rapport (« historique court : l'IA démarrera avec
  moins de recul ») ; il ne bloque jamais la mise en service.
- Pour un distributeur qui **garde Odoo**, la Reprise charge quand même produits, prix et stock, puis
  Connecteurs prend le relais à un point de coupure daté (FR-24, décision du PO, 2026-11-11, QC-5).

#### FR-10 : Le stock d'ouverture se compte, il ne se reprend pas
**Conséquences (testables) :**
- Le fichier de stock ne sert qu'à **pré-remplir la feuille de comptage**, un écran du **module Stock**
  (décision du PO, 2026-11-10, QR-5) ; la Reprise la pré-remplit par le point d'import du module Stock, car
  elle n'écrit jamais chez la cible (FR-14).
- Le stock d'ouverture est le **comptage physique**, par entrepôt, fait **avant la mise en service**, dans
  l'espace réel, la veille au soir ou le matin même, au choix du client, sans aucun mouvement entre le comptage et la mise en service (décisions du PO, 2026-11-11, QC-6).
- Le module Stock est alors `EN_INSTALLATION` : la saisie de la feuille de comptage est une route
  d'import déclarée à son manifeste, ouverte par l'exception nommée du moteur (FR-42) et du contrat (C13).
- **« Comptage clos » vaut feu vert du stock** : la Reprise le publie dans le feu vert du sous-ensemble
  (FR-15). Le stock sort de la règle « écart nul ».
- L'écart entre le fichier et le comptage figure au rapport, **à titre d'information** ; il ne bloque rien.

### 4.D Montrer, faire valider, puis importer

#### FR-11 : Le rapport de reprise
**Conséquences (testables) :**
- Pour chaque module cible : ce qui est repris (en nombre), ce qui manque, les écarts par type, les
  requalifications, les montants à saisir.
- Chaque écart pointe vers les lignes de la source concernées.
- Le rapport est le **livrable** du lot : il se télécharge en PDF et se conserve.
- Les rapports de l'essai ne passent jamais dans le réel : chaque lot du réel a son propre rapport (FR-16).

#### FR-12 : Les doublons se fusionnent sous contrôle
Leçon du parcours distributeur : la clé USB contient trois versions incomplètes du fichier clients.

**Conséquences (testables) :**
- La reprise détecte les doublons probables et les présente regroupés. Un doublon est **probable** quand
  deux lignes ont le même identifiant national ou le même téléphone, ou le même nom et la même date de
  naissance (raison sociale et adresse pour une personne morale) après normalisation ; la fusion reste sous contrôle humain (critère confirmé par le PO le 2026-11-11, ajustable par Yao et Rachid avant le 07/12).
- L'intégrateur fusionne et marque ce qu'il a fusionné ; rien n'est fusionné sans trace.

#### FR-13 : Le client valide avant que rien n'entre
**Conséquences (testables) :**
- Aucune donnée n'entre dans un module cible tant que la **liste finale** n'a pas été validée par le client.
- **Reprise initiale** : la valide le **DG**, ou une personne qu'il **désigne par écrit** (même règle que le
  consentement, PRD moteur FR-27).
- **Imports courants** et imports du prospect : les valide un **détenteur du droit de valider**
  (`reprise:lot:valider`), **désigné une fois par écrit** par le DG ; la désignation est tracée (décision du
  PO, 2026-11-11, QC-9).
- La validation enregistre qui, quand, et la version exacte du rapport validé.
- Toute modification après validation exige une nouvelle validation.
- La validation obtenue dans l'essai **ne vaut pas** pour le réel : elle est refaite sur le lot rejoué
  dans l'espace réel (FR-16).

#### FR-14 : Livrer aux modules cibles par leur contrat
**Conséquences (testables) :**
- La reprise **n'écrit jamais** dans la base d'un module cible : elle lui livre les objets par son **point
  d'import** (contrat nommé, contrat de module C3 et C5).
- Chaque module cible qui reçoit une reprise expose un point d'import idempotent et joue la suite de
  conformité de la reprise.
- Les modules cibles sont alimentés **dans l'ordre de leurs dépendances** (les polices avant les sinistres,
  les points de vente avant les créances).
- Si un module cible n'est pas installé (`NON_INSTALLE`), ses lignes sont déclarées « non installé » au
  rapport, jamais importées ailleurs.
- Si un module cible est dans un état fermé (`LECTURE_SEULE`, `SUSPENDU`, `ESSAI_TERMINE`, `DESINSTALLE`),
  ses lignes sont déclarées « cible fermée (état) » au rapport, la livraison est **refusée** et n'est
  jamais reportée en silence (FR-21).
- Pendant le rejeu dans l'espace réel, les modules cibles sont `EN_INSTALLATION` : la livraison passe par
  leur point d'import, route déclarée à leur manifeste et ouverte à l'identité de service de la Reprise
  par l'exception nommée du moteur (FR-42) et du contrat (C13).

### 4.E Réconcilier et mettre en service

#### FR-15 : L'écart nul, puis le feu vert par sous-ensemble
**Conséquences (testables) :**
- Pour les données vivantes, la reprise **réconcilie** avec la source : soldes de prêts et d'épargne au
  franc près, créances, polices et sinistres ouverts. Le stock a son propre critère : le comptage clos
  (FR-10).
- Le **feu vert est par sous-ensemble** (PRD moteur FR-8) et rattaché au **lot rejoué dans le réel**,
  jamais à un lot de l'essai. Tant qu'un écart reste ouvert sur les données vivantes de ce sous-ensemble,
  ou que son comptage de stock n'est pas clos, la Reprise ne donne **pas** son feu vert, et le moteur
  refuse la mise en service du sous-ensemble (`MISE_EN_SERVICE_SANS_FEU_VERT`, 409).
- Un sous-ensemble **sans lot de reprise** n'a pas besoin de feu vert (PRD moteur FR-8 et FR-11).
- Le feu vert est un fait publié, lisible par le moteur, avec le lot et le rapport qui le fondent ; sa
  forme (topic ou route) est nommée dans la spine (§8.3). La ligne Reprise du bilan de mise en service ne
  passe 🟢 qu'à ce feu vert.
- La Reprise déclare une **vérification « données importées »** au manifeste : route appelée sous
  l'identité de service du moteur (PRD moteur FR-6), critère chiffré (nombre d'objets reçus égal au nombre
  de lignes retenues de la source, seuil nul pour les données vivantes), clef d'idempotence.

#### FR-16 : La répétition générale, puis la reprise fraîche
**Conséquences (testables) :**
- Un lot se joue d'abord dans l'**espace d'essai**.
- Le jour de la mise en service, le **dossier d'installation** (adaptateurs réglés, tables de
  correspondance, règles de traduction) est **rejoué** dans l'espace réel et le lot est **rejoué** sur une
  source **fraîche**.
- Le rejeu importe pendant `EN_INSTALLATION` grâce à l'**exception nommée** du moteur (FR-42) et du
  contrat (C13) : les routes d'import sont déclarées au manifeste et ouvertes à l'identité de service du
  moteur et à celle de la Reprise.
- Rapports, validations, fichiers et feux verts de l'essai **ne passent jamais** dans le réel : seul le
  dossier d'installation passe (PRD moteur NFR-3). Le lot du réel a son rapport, sa validation (FR-13) et
  son feu vert.
- **Qui saisit pendant le rejeu** (décision du PO, 2026-11-11, OQ-4) : la Reprise est **mise en service la première** dans le
  réel ; elle n'a pas de lot à elle, donc pas de feu vert à attendre (PRD moteur FR-11). Le **comptage d'ouverture** et la
  **validation du lot du réel** (FR-13) se saisissent dans **ses** écrans ; elle livre ensuite aux modules cibles, encore
  `EN_INSTALLATION`, par l'exception nommée. Aucun utilisateur n'appelle une route d'un module en installation.
- Rejouer un lot ne crée aucun doublon.

#### FR-17 : La marche en parallèle
**Conséquences (testables) :**
- Quand le PO ou le client l'exige (Odoo personnalisé, pénalités de l'IMF calculées autrement), l'ancien et
  le nouveau système tournent **en parallèle** pendant une période fixée (une semaine, un cycle de
  remboursement).
- Pendant cette période, c'est **Connecteurs** (mode temporaire) qui synchronise les mouvements ; la
  Reprise **compare les deux états chaque nuit** (décision du PO, 2026-11-11) et produit le **rapport
  d'écarts de la période**. Le contrôle de concordance de Connecteurs reste un contrôle de synchronisation,
  non un rapport de reprise.
- La mise en service attend l'écart nul.

### 4.F Le lien avec la GED

#### FR-18 : Les clés de rattachement
**Conséquences (testables) :**
- La reprise **fournit** à la GED les clés de rattachement (n° de police, n° de sinistre) des dossiers
  repris ; la GED les **consomme**.
- La reprise des polices et des sinistres **précède** le rattachement des documents numérisés : d'abord les
  dossiers en cours, puis les archives historiques retenues.
- Un document dont la clé est illisible ou inconnue va dans la file **« à rattacher »** de la GED ; il ne
  bloque pas la mise en service.
- Le complément de l'historique par OCR est **hors périmètre** de ce PRD (PRD de la GED) ; la Reprise
  exige seulement que toute donnée ainsi complétée garde sa provenance (FR-2).

### 4.G Deux publics

#### FR-19 : Le même moteur pour Money Vibes et, plus tard, pour le client
**Conséquences (testables) :**
- Par défaut, la reprise initiale et la mise en service se font **dans la console Money Vibes**, par
  l'équipe Money Vibes.
- **Pour un distributeur, le DSI du client peut faire lui-même la reprise, s'il le souhaite**, y compris
  la reprise initiale (décision du PO, 2026-11-10). Il utilise le même moteur, le même rapport et la même
  validation.
- Plus tard, un **administrateur du client** fait ses imports courants **en libre-service**, de la même
  façon.
- Le droit d'importer est un **droit de tenant** déclaré par le module (contrat de module C7). Le **rôle du
  DSI** d'un distributeur le contient dès l'installation ; ensuite, l'**administrateur du client**
  l'attribue lui-même (PRD moteur FR-35). Money Vibes n'accorde rien en dehors du moteur.
- **Le libre-service est prêt en février** pour le distributeur : des **prospects** chargeront leurs propres
  données dans l'espace d'essai et testeront **sans Money Vibes**, avant de décider de conclure (PRD
  moteur FR-33, essai avant signature). Les écrans sont ceux du module d'écran `reprise` de `prospera-app`
  (§7, C8), livrés dès février.
- Même quand le DSI fait la reprise, ou que le prospect a essayé seul, le feu vert est vérifié par la
  reprise elle-même, et la **mise en service** reste un acte de Money Vibes, sur ce feu vert (décision du
  PO, 2026-11-11 : confirmation de la décision du 2026-11-10).

### 4.H L'historique et l'IA

#### FR-20 : L'historique nourrit la calibration, sous les règles du contrat
**Conséquences (testables) :**
- L'historique repris est **normalisé au schéma commun** du module cible, le même pour tous les clients
  (contrat de module C6 amendé : même schéma pour toutes les organisations).
- À la fin de la livraison de l'historique à un module cible, la Reprise publie l'événement **« historique
  livré »** (nom dans la spine) ; c'est lui qui déclenche la **calibration locale** chez la cible avec IA
  (contrat de module C11). Un test vérifie que, sans l'événement, la calibration ne démarre pas, et qu'avec
  lui elle démarre une seule fois par lot.
- Dans l'essai, la calibration du prospect se calcule sur son lot d'essai ; après la reprise **refaite à
  neuf** dans le réel, elle est **recalculée** sur l'événement du lot du réel (PRD moteur FR-33).
- Il ne sort de l'instance que selon le niveau de consentement du client (PRD moteur FR-26 à FR-30).

### 4.I Module, états publiés, effacement, relais

#### FR-21 : Un module installable, un comportement par état publié
**Conséquences (testables) :**
- La Reprise est un **module installable** (décision du PO, 2026-11-11, QC-1) : manifeste `reprise` ajouté à
  la liste des manifestes à produire, gate, ligne de l'offre, ligne grisée « hors offre » quand l'offre n'en
  comporte pas (PRD moteur FR-7).
- Elle est **ouverte d'office** dans toute offre d'essai du prospect (PRD moteur FR-33) : sans elle, le
  prospect ne peut pas charger ses données.
- Comportement par état publié de la Reprise elle-même (PRD moteur §3.1, FR-43) :

  | État publié | Reprise |
  |---|---|
  | `NON_INSTALLE` | refus `REPRISE_NOT_ENTITLED` (403), aucune donnée |
  | `EN_INSTALLATION` | 403, sauf les routes d'import et de vérification déclarées, ouvertes à l'identité de service du moteur et à celle de la Reprise (exception nommée) ; export ouvert |
  | `EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS` | ouvert |
  | `LECTURE_SEULE` | lectures ouvertes ; tout nouveau lot, toute validation, toute fusion refusés (`ABONNEMENT_EXPIRE`, 403) ; un lot en cours est suspendu, repris à la sortie ; export ouvert |
  | `SUSPENDU` | 403, sauf l'export |
  | `ESSAI_TERMINE` | 403, sauf l'export, jusqu'à l'effacement (FR-22) |
  | `DESINSTALLE` | 403, sauf l'export ; ni lots ni rapports supprimés (C9) |

- Une **route d'export** par organisation rend les lots, rapports et tables de correspondance en CSV et
  JSON, réservée au détenteur de `instance:donnees:exporter`.
- Le comportement des **cibles** dans ces états est traité en FR-14.

#### FR-22 : L'effacement du prospect non signé
**Conséquences (testables) :**
- Quand l'organisation d'un prospect est effacée (PRD moteur FR-33), la Reprise **efface** ses données :
  fichiers sources, index de provenance, lots, tables de correspondance, rapports, validations et feux verts.
- L'effacement passe par une route d'effacement **par organisation**, appelée par le moteur, et rend un
  accusé que le moteur reprend dans le **certificat d'effacement**.
- Les journaux nominatifs de la Reprise sont **pseudonymisés**, pas supprimés (NFR-2).
- Si le prospect signe avant l'effacement, rien n'est effacé et la reprise est refaite à neuf (FR-16).

#### FR-23 : La Reprise lit la source, elle ne l'écrit jamais
**Conséquences (testables) :**
- La Reprise ne fait que **lire** la source : aucune écriture dans l'ancien logiciel, dans aucun espace.
- Dans l'**essai**, elle lit le vrai logiciel du prospect avec des **identifiants en lecture seule propres
  à l'essai** ; une écriture tentée est refusée (décision du PO, 2026-11-11, QC-10 ; PRD moteur FR-9 et
  addendum A-7). Il n'y a pas de bac à sable sans Money Vibes.
- Les écritures vers le logiciel du client relèvent du seul module Connecteurs (interceptées en essai).

#### FR-24 : Le relais à Connecteurs, à un point de coupure daté
**Conséquences (testables) :**
- Quand le client **garde son logiciel** (Odoo, IMF), la Reprise charge le chargement initial, y compris
  produits, prix et stock ; Connecteurs ne transmet ensuite que les **mouvements** à partir d'un **point
  de coupure daté**, fixé et enregistré dans le lot (décision du PO, 2026-11-11, QC-5).
- Aucun objet n'est chargé deux fois : la clé d'identité (identifiant d'origine, FR-2) est la même pour
  l'objet repris et pour le mouvement reçu ensuite.
- Au démarrage de sa synchronisation, Connecteurs **copie** les tables de correspondance de la Reprise
  par un contrat nommé et en devient **seul propriétaire** ; la Reprise ne les modifie plus (QC-3).
  Connecteurs déclare la Reprise dans son `enrichiPar` ; la copie survit à la réception définitive et à la
  désinstallation de la Reprise.
- Les domaines que le logiciel du client garde comme référence restent **en lecture** côté Prospera.

---

## 5. Exigences transverses

- **NFR-1, idempotence** : rejouer un lot, ou une livraison à un module cible, ne crée aucun doublon.
- **NFR-2, traçabilité** : lots, correspondances, fusions, requalifications, validations et feux verts sont
  journalisés en ajout seul. Seule exception : à l'effacement d'un prospect non signé (FR-22), les entrées
  nominatives sont **pseudonymisées**, jamais supprimées.
- **NFR-3, confidentialité et cloisonnement** : sur site, aucune donnée reprise ni aucun fichier source ne
  quitte l'instance. L'essai et le réel sont cloisonnés : seul le dossier d'installation passe de l'un à
  l'autre (FR-16).
- **NFR-4, volume** : un lot de **100 000 objets** se traite (lecture, rapport) en moins de
  **10 minutes** sur le serveur de référence du client (cible confirmée le 2026-11-11, mesurée à l'Integration Gate).
- **NFR-5, reprise sur incident** : un lot interrompu reprend où il s'était arrêté, sans recommencer ni
  doubler.
- **NFR-6, téléversement** : l'envoi d'un fichier volumineux (Excel, 100 000 objets) affiche sa progression
  et reprend là où il s'est arrêté après une coupure ; la limite de taille du corps de requête au proxy est
  fixée par la spine (§8.3).

## 6. Indicateurs de réussite

| # | Indicateur | Cible |
|---|---|---|
| SM-1 | Écarts ouverts sur les données vivantes au moment de la mise en service | 0 |
| SM-2 | Objets entrés dans un état invalide du circuit | 0 |
| SM-3 | Dates métier égales à la date d'import | 0 |
| SM-4 | Montants requis remplacés par zéro | 0 |
| SM-5 | Reprises des deux clients de février validées par le client (FR-13) et dont la réception définitive est enregistrée | 2 |

**Contre-indicateurs** :
- nombre de **requalifications** (trop élevé : la traduction d'état est mal réglée) ;
- **orphelins** restés dans la file « à rattacher » au-delà de 30 jours ;
- **montants à saisir** encore vides un mois après la mise en service.

## 7. Contrat de module

| Clause | Pour la reprise |
|---|---|
| C1 | Manifeste `reprise` (module installable, FR-21) ; `depends: []` ; `enrichiPar`: les modules cibles (chaque cible absente = lignes « non installé ») ; déclare aussi : prérequis (accès Odoo ou API, plan Custom d'Odoo Online, espace disque), vérification « données importées » avec critère (FR-15), `retourArriere: SANS_PERTE`, routes d'import (exception nommée), route d'export, routes autorisées en lecture seule |
| C2 | Gate et cloisonnement par organisation ; refus `REPRISE_NOT_ENTITLED` ; un seul attendu par état publié et par sorte de route (lecture, écriture, export) selon la matrice de FR-21 ; l'état se lit sur l'état publié poussé, jamais sur l'horloge du conteneur |
| C3 | Possède : fichiers déposés, index de provenance, lots, tables de correspondance, rapports, validations, feux verts, journal de fusion, clés de rattachement ; n'écrit chez aucun module cible. Service distinct : agrégat que nul module cible n'écrit |
| C4 | Fonctionne sans aucun module cible installé (rapport seul) ; une cible fermée (état) est déclarée au rapport (FR-14) |
| C5 | Contrats nommés (topics et routes à nommer dans la spine) : point d'import de chaque cible (avec champ de provenance) ; **feu vert** par sous-ensemble, lu par le moteur ; consommation de la **réception définitive** ; **clés de rattachement** à la GED ; événement **« historique livré »** ; copie des tables de correspondance à Connecteurs (FR-24) ; route de vérification « données importées » |
| C6 | Correspondances et traductions d'état sont des **données** par lot, jamais du code par client, et même schéma pour toutes les organisations |
| C7 | Droits de tenant `<code>:<objet>:<action>` : `reprise:lot:importer`, `reprise:lot:valider`, `reprise:doublon:fusionner`, `reprise:rapport:consulter` ; l'export reste réservé à `instance:donnees:exporter`. Le rôle du DSI les contient (FR-19). Un **rôle prédéfini « Responsable de la reprise »** porte `importer`, `fusionner` et `consulter`, **jamais** `reprise:lot:valider` (réservé au DG ou au désigné par écrit, QC-9) ; l'administrateur du client l'attribue (décision du PO, 2026-11-11) |
| C8 | Écrans dans la **console Money Vibes** (équipe) **et** module d'écran `reprise` dans `prospera-app` **dès février** (libre-service du prospect : dépôt, rapport, validation, import), entrées déclarées dans `ecran.ts` avec leur droit ; l'Administration de la coque y renvoie par un lien (spine AD-14) |
| C9 | Désinstaller ne supprime ni lots ni rapports ; la suppression des fichiers suit la réception définitive (FR-3), l'effacement suit FR-22 |
| C10 | Profil compose `reprise` ; démarre seule |
| C11 | Sans IA propre ; publie l'événement « historique livré » qui déclenche la calibration des modules qui en ont, recalculée après la reprise refaite à neuf (FR-20) |
| C12 | `retourArriere: SANS_PERTE` : format des lots, des correspondances et des règles de traduction lisible par la version précédente pendant 7 jours, y compris pour un lot en cours ; lecteur tolérant sur les topics de la Reprise ; interrupteurs qui ne changent jamais la forme des données |
| C13 | Installable sous contrôle : prérequis et vérification « données importées » avec critère (FR-15) ; santé ; **lecture de l'état publié** ; routes autorisées en lecture seule déclarées (export des rapports et correspondances) ; **interception en essai** (la Reprise ne fait que lire la source, FR-23) ; **export** par organisation (FR-21) ; **import** de sa part du dossier d'installation (FR-4) par les routes de l'**exception nommée** (rejeu pendant `EN_INSTALLATION`, FR-16) ; **effacement par organisation** avec accusé pour le certificat (FR-22) ; part prise au rafraîchissement de l'essai (PRD moteur FR-10) |

## 8. Questions ouvertes

### 8.1 Tranchées le 2026-11-10

| # | Question | Décision |
|---|---|---|
| QR-1 | Profondeur d'historique | **Pas de borne fixe** ; tout ce que le client fournit ; **objectif 3 ans ou plus** (FR-9) |
| QR-2 | Fichiers source | Gardés **jusqu'à la réception définitive**, puis supprimés, suppression tracée (FR-3, précisé le 2026-11-11 : par sous-ensemble) |
| QR-3 | Libre-service | **Prêt en février** pour le distributeur, y compris pour un **prospect en essai** (FR-19) |
| QR-4 | Qui valide | Le **DG**, ou une personne qu'il désigne par écrit (FR-13, précisé par QC-9) |
| QR-5 | Feuille de comptage | Écran du **module Stock** ; la reprise la pré-remplit (FR-10) |

### 8.2 Tranchées le 2026-11-11 (contrôle ciblé)

| # | Question | Décision |
|---|---|---|
| QC-1 | Module ou service de projet | **Module installable**, ouvert d'office dans l'essai du prospect (FR-21) |
| QC-3 | Propriétaire des tables de correspondance | La Reprise les **crée** ; Connecteurs en **copie** au démarrage de sa synchronisation et en est seul propriétaire (FR-4, FR-24) |
| QC-4 | Adaptateurs partagés | **Paquet commun**, identifiants de connexion propres à chaque module ; la spine place le paquet (FR-1) |
| QC-5 | Distributeur qui garde Odoo | La Reprise charge produits, prix et stock ; Connecteurs prend le relais à un **point de coupure daté** (FR-24) |
| QC-6 | Moment du comptage de stock | **Avant** la mise en service ; « comptage clos » = feu vert du stock ; le stock sort de la règle « écart nul » (FR-10) |
| QC-9 | Qui valide les imports courants | Reprise initiale : le DG ; imports courants : un détenteur du droit désigné une fois par écrit (FR-13) |
| QC-10 | Connecteur dans l'essai d'un prospect | Lecture seule de son vrai logiciel, identifiants dédiés, écritures toujours interceptées ; pas de bac à sable sans Money Vibes (FR-23) |
| Mise en service | Qui déclenche la mise en service | Acte de Money Vibes sur le feu vert, même si le DSI ou le prospect a fait la reprise (FR-19) ; marque « à confirmer » levée |
| Amont | Import pendant `EN_INSTALLATION` ; écrans de février | **Exception nommée** du moteur (FR-42) et du contrat (C13) pour les routes d'import ; module d'écran `reprise` dans `prospera-app` dès février, vers lequel l'Administration renvoie (C8) |

### 8.3 Tranchées le 2026-11-11 (questions restantes)

| # | Question | Décision |
|---|---|---|
| OQ-4 | Saisie humaine pendant le rejeu | La Reprise est mise en service la première dans le réel ; comptage et validation se saisissent dans ses écrans ; elle livre par l'exception nommée (FR-16) |
| OQ-5 | Charge de Dev A pour les écrans de février | Chiffrée au 04/12 avec le reste ; la ligne M44 de `manifestes-a-produire.md` est faite |
| OQ-6 | Reprise pour le cabinet | **Non en v1** : le cabinet importe ses balances par l'Atelier de balance (PRD moteur FR-7) |
| OQ-7 | Suppression des fichiers d'un import courant | **30 jours** après la validation de l'import (FR-3) |
| Rôle | Rôle dédié du journal | Rôle prédéfini « Responsable de la reprise », sans le droit de valider (C7) |

### 8.4 Orientations validées, à écrire dans les spines (Dev B, avant le 07/12)

| # | Sujet | Orientation validée par le PO le 2026-11-11 |
|---|---|---|
| OQ-1 | Service et paquet d'adaptateurs ; noms des topics et routes | **Deux services** (Reprise et Connecteurs : agrégats distincts, contrat §4) ; **paquet d'adaptateurs** = bibliothèque commune versionnée avec la plateforme ; topics et routes nommés par la spine |
| OQ-2 | Protection par objet (`historique`, `montantASaisir`) | Les API des modules cibles renvoient ces marqueurs **par objet** ; la coque fournit `<ProtectionObjet>` (nouvelle AD-25 de la spine `prospera-app`) |
| OQ-3 | Téléversement volumineux (NFR-6) | Envoi **par morceaux de 10 Mo, avec reprise**, sur la seule route `/api/reprise/v1/televersements` ; la limite du proxy n'est relevée que pour elle |

### 8.5 Inférences

Toutes les inférences de ce PRD ont été **confirmées par le PO le 2026-11-11** : chiffres de UJ-4 illustratifs ; 30 jours ; contenu des tables de correspondance ; moment du comptage ; critère de doublon ; comparaison chaque nuit ; 100 000 objets en 10 minutes. Il ne reste aucune inférence ouverte.
