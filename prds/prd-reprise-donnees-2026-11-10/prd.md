---
title: "PRD — Reprise de données"
status: draft  # contenu rédigé le 2026-11-10 ; relecture (Finalize) avant validation PO le 13/11
created: 2026-11-10
updated: 2026-11-10
project: prospera
module: reprise
service: "à trancher dans la spine (patron D13 de balance-service)"
verticales: [Assurance, Distributeur, IMF]
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (AD-P17, C1 → C11)
prd_lies: [prd-moteur-installation-2026-11-09 (FR-6, FR-8), PRD Connecteurs (à venir), GED (sinistres)]
mode: coaching
---

# PRD — Reprise de données

*Brouillon rédigé à partir du récit du PO (2026-11-10). Les décisions et leurs raisons sont dans
`.memlog.md` ; les inférences non confirmées portent la marque `[ASSUMPTION]`.*

---

## 0. Objet du document

Ce PRD décrit comment les données d'un client **entrent une fois** dans Prospera : depuis son ancien
logiciel, un export, une clé USB, des fichiers Excel ou JSON, Odoo, ou l'API de son logiciel. Il s'adresse
au PO, à Dev A et Dev B, et aux auteurs des PRD des modules qui reçoivent ces données.

Il s'appuie sur le **contrat de module** (AD-P17) et se raccorde à deux voisins : le **moteur
d'installation**, qui lit le feu vert de la reprise avant toute mise en service (PRD moteur FR-6 et FR-8),
et le module **Connecteurs**, qui prend le relais quand le client garde son ancien logiciel. La
**numérisation des archives papier** n'en fait pas partie : c'est un lot de la GED, qui consomme les clés
de rattachement que la reprise fournit.

## 1. Vision

La reprise est **le moment où le client décide de faire confiance à nos chiffres**. S'il retrouve ses
dossiers, ses soldes et ses créances exactement comme il les connaît, il signe la réception ; sinon, rien
d'autre ne compte. La reprise doit donc être **juste**, et le **prouver** : chaque écart est montré, chaque
correction est expliquée, et le client valide avant que rien n'entre.

Elle sépare ce qui sert **dès le premier jour** (les **données vivantes** : dossiers en cours, soldes,
créances, stock) de ce qui sert à **comprendre et à apprendre** (l'**historique** : sinistres clos, ventes
passées, prêts remboursés). Les premières doivent être exactes au franc près, sinon on ne bascule pas. Le
second entre en lecture seule ; ses défauts sont signalés sans retarder personne. C'est lui qui **calibre
l'IA dès le premier jour**, au lieu de la laisser apprendre pendant des mois.

Aujourd'hui, c'est l'équipe Money Vibes qui fait la reprise initiale et la bascule. Demain, le client fera
lui-même ses imports courants (une nouvelle zone, un nouveau catalogue, une agence rachetée) **avec le
même moteur, le même rapport et la même validation**. Le module est donc pensé dès maintenant pour ces deux
publics.

## 2. Pour qui

### 2.1 Besoins

- **L'ingénieur données et l'intégrateur Money Vibes** (Yao pour l'assurance et l'IMF, Rachid pour le
  distributeur) : faire entrer les données d'une source imparfaite, voir tout ce qui cloche, corriger, et
  rejouer la reprise à l'identique le jour de la bascule.
- **Le client qui valide** (DG, comptable, DSI) : voir ce qui va entrer, comprendre chaque écart, et
  signer en connaissance de cause.
- **Les utilisateurs du client** (gestionnaire, commercial, agent de crédit) : retrouver leurs dossiers
  dans un état cohérent, avec leurs vraies dates et leurs vrais montants.
- **Plus tard, l'administrateur du client** : charger lui-même un fichier courant (200 points de vente, un
  catalogue) sans appeler Money Vibes.

### 2.2 Hors cible

- Le **paramétrage** : experts et partenaires agréés, barèmes, franchises, grilles de vétusté. Ils sont
  saisis et validés pendant les ateliers de cadrage.
- La **numérisation** des archives papier (GED).
- La **synchronisation permanente** avec un logiciel que le client garde (module Connecteurs).

### 2.3 Parcours clés

Les parcours UJ-1 (assurance, Fatou), UJ-2 (distributeur, Ibrahim) et UJ-3 (IMF, Mariam) du PRD moteur
s'appliquent ; la reprise en est l'étape 2. S'y ajoutent :

**UJ-4. Yao reprend les sinistres de l'assureur, et aucun dossier n'arrive dans un état impossible.**
Yao charge l'export de l'ancien logiciel dans l'espace d'essai. Le rapport montre 1 830 assurés, 2 410
polices en vigueur, 312 sinistres ouverts, et 27 sinistres **requalifiés** : l'ancien logiciel les disait
« ouverts » alors que leurs pièces manquent ; ils arrivent « en attente de pièces ». Neuf sinistres n'ont
pas de montant chiffré validé : ils sont signalés, et le gestionnaire le saisira avec un motif. Koffi et le
responsable sinistres valident la liste. Le jour J, Yao rejoue la même reprise sur un export frais.
`[ASSUMPTION : chiffres illustratifs]`

**UJ-5. Awa charge 200 nouveaux points de vente toute seule.** *(plus tard, libre-service)*
Six mois après la mise en service, Moussa ouvre une zone. Awa, administratrice chez le client, dépose le
fichier Excel des 200 points de vente. Le même rapport lui montre 4 doublons avec des points de vente
existants et 11 lignes sans commercial rattaché. Elle corrige, valide, et les points de vente apparaissent
dans la zone. Personne chez Money Vibes n'est intervenu.

## 3. Vocabulaire

- **Source** : l'endroit d'où viennent les données. Fichier (Excel, CSV, JSON ; une clé USB n'est qu'un
  porteur de fichiers), Odoo, ou API du logiciel du client.
- **Adaptateur** : ce qui sait lire une sorte de source et la traduire dans le format commun. Partagé avec
  le module Connecteurs.
- **Lot de reprise** : un passage complet d'une source vers Prospera, de la lecture au rapport. Un lot se
  rejoue.
- **Données vivantes** : les données qui servent au travail dès le premier jour. Elles entrent dans les
  tables métier ; la règle **écart à zéro** s'applique.
- **Historique** : les données passées, en **lecture seule**, pour la consultation et la calibration de
  l'IA. Leurs écarts sont signalés, jamais bloquants.
- **Écart** : une différence entre la source et ce que Prospera accepte ou calcule (doublon, référence
  inconnue, solde différent, champ obligatoire absent).
- **Écart à zéro** : la condition de bascule ; aucun écart ouvert sur les données vivantes.
- **Table de correspondance** : la règle qui relie une valeur de la source à une valeur de Prospera
  (référence produit, état, code agence).
- **Traduction d'état** : la règle qui transforme l'état d'un objet dans l'ancien logiciel en un **état
  valide** du circuit Prospera.
- **Requalification** : un objet dont l'état a dû être changé par la traduction ; toujours signalée.
- **Rapport de reprise** : le livrable du lot : ce qui est repris, ce qui manque, les écarts, les
  requalifications. Le client le signe.
- **Validation** : l'acte du client qui accepte la liste finale **avant** l'import.
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
  Connecteurs maintient les données.
- Chaque source passe par un **adaptateur** qui produit le même format commun ; ajouter une source, c'est
  ajouter un adaptateur, sans toucher au reste.
- Les adaptateurs Odoo et API sont **partagés avec le module Connecteurs**.

#### FR-2 : Chaque objet garde sa trace d'origine
**Conséquences (testables) :**
- Tout objet repris garde sa **source**, son **lot**, et sa **ligne ou son identifiant d'origine**.
- Depuis n'importe quel dossier repris, on retrouve la ligne de la source dont il vient.

#### FR-3 : Les fichiers déposés restent chez le client
**Conséquences (testables) :**
- Sur une instance sur site, les fichiers déposés restent **sur l'instance** ; aucun ne transite par Money
  Vibes.
- Les fichiers d'une reprise se conservent `[ASSUMPTION : jusqu'à la réception définitive, puis
  suppression tracée]`.

### 4.B Traduire sans trahir

#### FR-4 : Les tables de correspondance
**Conséquences (testables) :**
- Une valeur de la source qui ne correspond à rien dans Prospera (référence produit personnalisée dans un
  Odoo, code agence) est un **écart**, jamais une invention.
- L'intégrateur construit la **table de correspondance** ; elle est enregistrée avec le lot et **rejouée
  telle quelle** le jour de la bascule.

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

### 4.C Données vivantes et historique

#### FR-8 : Deux régimes
**Conséquences (testables) :**
- Les **données vivantes** entrent dans les tables métier des modules cibles ; la règle **écart à zéro**
  s'applique.
- L'**historique** entre en **lecture seule** ; ses écarts figurent au rapport mais ne bloquent jamais la
  bascule.
- Un objet d'historique ne peut pas être modifié depuis l'application.

#### FR-9 : Le périmètre par métier

| Métier | Données vivantes (écart à zéro) | Historique (lecture seule) |
|---|---|---|
| **Assurance** | assurés (identité, contacts) ; polices en vigueur (garanties, échéances, primes) ; sinistres ouverts (état, montants chiffrés, réserves, pièces reçues, expert désigné) | sinistres clos des **3 à 5 dernières années** (nature, montants, délais, décisions, recours) et polices résiliées ou échues qui leur sont liées |
| **Distributeur** | points de vente (contacts, zone, GPS si disponible, commercial rattaché) ; produits et prix (prix société, prix freelance) ; créances ouvertes ; commerciaux ; fournisseurs ; stock d'ouverture (FR-10) | ventes des **12 à 24 derniers mois** par point de vente et par produit (au moins 12 mois pour voir les saisons) ; historique des paiements des clients |
| **IMF** | clients et KYC ; prêts en cours (capital restant dû, **échéancier complet**, retards, pénalités) ; soldes d'épargne ; garanties ; rattachement à l'agence et à l'agent de crédit | prêts clos et leurs remboursements sur **au moins 3 ans ou 3 cycles de crédit** |

**Conséquences (testables) :**
- Un prêt en cours sans échéancier complet est un écart bloquant : sans échéancier, pas de portefeuille à
  risque.
- La profondeur d'historique est un **paramètre du lot**, dans les bornes ci-dessus.

#### FR-10 : Le stock d'ouverture se compte, il ne se reprend pas
**Conséquences (testables) :**
- Le fichier de stock ne sert qu'à **pré-remplir la feuille de comptage**.
- Le stock d'ouverture est le **comptage physique** fait le jour de la bascule, par entrepôt.
- L'écart entre le fichier et le comptage figure au rapport, à titre d'information.

### 4.D Montrer, faire valider, puis importer

#### FR-11 : Le rapport de reprise
**Conséquences (testables) :**
- Pour chaque module cible : ce qui est repris (en nombre), ce qui manque, les écarts par type, les
  requalifications, les montants à saisir.
- Chaque écart pointe vers les lignes de la source concernées.
- Le rapport est le **livrable** du lot : il se télécharge en PDF et se conserve.

#### FR-12 : Les doublons se fusionnent sous contrôle
Leçon du parcours distributeur : la clé USB contient trois versions incomplètes du fichier clients.

**Conséquences (testables) :**
- La reprise détecte les doublons probables et les présente regroupés.
- L'intégrateur fusionne et marque ce qu'il a fusionné ; rien n'est fusionné sans trace.

#### FR-13 : Le client valide avant que rien n'entre
**Conséquences (testables) :**
- Aucune donnée n'entre dans un module cible tant que la **liste finale** n'a pas été validée par le client
  (DG ou personne désignée, `[ASSUMPTION : même règle que le consentement du PRD moteur FR-27]`).
- La validation enregistre qui, quand, et la version exacte du rapport validé.
- Toute modification après validation exige une nouvelle validation.

#### FR-14 : Livrer aux modules cibles par leur contrat
**Conséquences (testables) :**
- La reprise **n'écrit jamais** dans la base d'un module cible : elle lui livre les objets par son **point
  d'import** (contrat nommé, contrat de module C3 et C5).
- Chaque module cible qui reçoit une reprise expose un point d'import idempotent et joue la suite de
  conformité de la reprise.
- Les modules cibles sont alimentés **dans l'ordre de leurs dépendances** (les polices avant les sinistres,
  les points de vente avant les créances).
- Si un module cible n'est pas installé, ses lignes sont déclarées « non installé » au rapport, jamais
  importées ailleurs.

### 4.E Réconcilier et basculer

#### FR-15 : L'écart à zéro, puis le feu vert
**Conséquences (testables) :**
- Pour les données vivantes, la reprise **réconcilie** avec la source : soldes de prêts et d'épargne au
  franc près, créances, polices et sinistres ouverts, stock compté.
- Tant qu'un écart reste ouvert sur les données vivantes, la reprise ne donne **pas** son feu vert ; le
  moteur d'installation ne peut pas mettre le client en service (PRD moteur FR-6, FR-8).
- Le feu vert est un fait publié, lisible par le moteur, avec le lot et le rapport qui le fondent.

#### FR-16 : La répétition générale, puis la reprise fraîche
**Conséquences (testables) :**
- Un lot se joue d'abord dans l'**espace d'essai**.
- Le jour de la bascule, le **même lot** (mêmes adaptateurs, mêmes tables de correspondance, mêmes règles de
  traduction) est **rejoué** dans l'espace réel sur une source **fraîche**.
- Rejouer un lot ne crée aucun doublon.

#### FR-17 : La marche en parallèle
**Conséquences (testables) :**
- Quand le PO ou le client l'exige (Odoo personnalisé, pénalités de l'IMF calculées autrement), l'ancien et
  le nouveau système tournent **en parallèle** pendant une période fixée (une semaine, un cycle de
  remboursement).
- Pendant cette période, la reprise compare régulièrement les deux et produit un rapport d'écarts ; la
  bascule attend l'écart à zéro.

### 4.F Le lien avec la GED

#### FR-18 : Les clés de rattachement
**Conséquences (testables) :**
- La reprise **fournit** à la GED les clés de rattachement (n° de police, n° de sinistre) des dossiers
  repris ; la GED les **consomme**.
- La reprise des polices et des sinistres **précède** le rattachement des documents numérisés : d'abord les
  dossiers en cours, puis les archives historiques retenues.
- Un document dont la clé est illisible ou inconnue va dans la file **« à rattacher »** de la GED ; il ne
  bloque pas la bascule.
- Plus tard, l'OCR peut **compléter l'historique** (par exemple un montant d'expertise absent de l'ancien
  logiciel) ; toute donnée ainsi complétée garde sa provenance.

### 4.G Deux publics

#### FR-19 : Le même moteur pour Money Vibes et, plus tard, pour le client
**Conséquences (testables) :**
- Aujourd'hui, la reprise initiale et la bascule se font **dans la console Money Vibes**, par l'équipe
  Money Vibes.
- Plus tard, un **administrateur du client** fait ses imports courants **en libre-service**, avec le même
  rapport et la même validation ; seul change celui qui valide.
- Le droit d'importer est un **droit de tenant** déclaré par le module (contrat de module C7) ;
  `[ASSUMPTION : le libre-service n'est pas requis en février]`.

### 4.H L'historique et l'IA

#### FR-20 : L'historique nourrit la calibration, sous les règles du contrat
**Conséquences (testables) :**
- L'historique repris est **normalisé au schéma commun** du module cible, le même pour tous les clients
  (fondation n° 2 de la partie C du PRD moteur).
- Il sert à la **calibration locale** dès la mise en service (contrat de module C11).
- Il ne sort de l'instance que selon le niveau de consentement du client (PRD moteur FR-26 à FR-30).

---

## 5. Exigences transverses

- **NFR-1, idempotence** : rejouer un lot, ou une livraison à un module cible, ne crée aucun doublon.
- **NFR-2, traçabilité** : lots, correspondances, fusions, requalifications, validations et feux verts sont
  journalisés en ajout seul.
- **NFR-3, confidentialité** : sur site, aucune donnée reprise ni aucun fichier source ne quitte l'instance.
- **NFR-4, volume** : un lot de `[ASSUMPTION : 100 000 objets]` se traite (lecture, rapport) en moins de
  `[ASSUMPTION : 10 minutes]` sur le serveur de référence du client.
- **NFR-5, reprise sur incident** : un lot interrompu reprend où il s'était arrêté, sans recommencer ni
  doubler.

## 6. Indicateurs de réussite

| # | Indicateur | Cible |
|---|---|---|
| SM-1 | Écarts ouverts sur les données vivantes au moment de la bascule | 0 |
| SM-2 | Objets entrés dans un état invalide du circuit | 0 |
| SM-3 | Dates métier égales à la date d'import | 0 |
| SM-4 | Montants requis remplacés par zéro | 0 |
| SM-5 | Reprises des deux clients de février signées par le client | 2 |

**Contre-indicateurs** :
- nombre de **requalifications** (trop élevé : la traduction d'état est mal réglée) ;
- **orphelins** restés dans la file « à rattacher » au-delà de 30 jours ;
- **montants à saisir** encore vides un mois après la bascule.

## 7. Contrat de module

| Clause | Pour la reprise |
|---|---|
| C1 | Manifeste `reprise` ; `depends: []` ; `enrichiPar`: les modules cibles (chaque cible absente = lignes « non installé ») |
| C2 | Gate et cloisonnement par organisation ; refus `REPRISE_NOT_ENTITLED` |
| C3 | Possède : fichiers déposés, lots, tables de correspondance, rapports, validations ; n'écrit chez aucun module cible |
| C4 | Fonctionne sans aucun module cible installé (rapport seul) |
| C5 | Livre par le point d'import de chaque cible ; publie le **feu vert** de réconciliation, lu par le moteur |
| C6 | Correspondances et traductions d'état sont des **données** par lot, jamais du code par client |
| C7 | Droits : importer, valider, consulter les rapports |
| C8 | Écrans dans la console Money Vibes ; plus tard dans `prospera-app` pour le libre-service |
| C9 | Désinstaller ne supprime ni lots ni rapports |
| C10 | Profil compose `reprise` |
| C11 | Sans IA propre ; alimente la calibration des modules qui en ont (FR-20) |

## 8. Questions ouvertes

| # | Question | Proposition |
|---|---|---|
| QR-1 | Les profondeurs d'historique **12 à 24 mois** (distributeur) et **3 ans ou 3 cycles** (IMF) sont des propositions. On les retient ? | les retenir |
| QR-2 | Combien de temps garde-t-on les **fichiers source** déposés ? | jusqu'à la réception définitive, puis suppression tracée |
| QR-3 | Le **libre-service** client est-il requis en février ? | non : conçu maintenant, ouvert plus tard |
| QR-4 | Qui **valide** une reprise chez le client ? | même règle que le consentement : le DG ou une personne désignée par écrit |
| QR-5 | La **feuille de comptage** du stock est-elle un écran de la reprise ou du module Stock ? | du module Stock ; la reprise lui fournit le pré-remplissage |
