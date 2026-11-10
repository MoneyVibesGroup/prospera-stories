---
title: "PRD — Moteur d'installation (platform-catalog-service)"
status: draft
created: 2026-11-09
updated: 2026-11-10
project: prospera
service: platform-catalog-service
position_sequence: 26
verticales: [Assurance, Distributeur, IMF, Cabinet, Money Vibes]
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (AD-P17, C1 → C11)
mode: coaching
---

# PRD — Moteur d'installation (`platform-catalog-service`)

*Brouillon. Sections rédigées : §0, §1, §2, §3. À venir : §4 (parties A, B, C), exigences transverses,
indicateurs. Les prénoms des parcours sont provisoires et leurs cas d'échec sont plausibles, pas vécus.*

---

## 0. Objet du document

Ce PRD décrit **comment un client reçoit Prospera** : quels modules il a, où ils tournent, comment ils sont
mis en service, mis à jour, et ce qui circule entre son instance et Money Vibes. Il s'adresse au PO (qui le
valide), à Dev A et Dev B (qui le construisent), et aux auteurs des PRD de chaque module (qui s'y branchent).

Il **applique** le contrat de module (`CONTRAT-DE-MODULE-2026-11-09.md`, AD-P17, clauses C1 → C11) sans le
répéter. Il est organisé en trois parties, décidées par le PO : **A. Activer** les modules, **B. Livrer et
mettre à jour l'instance**, **C. Données et apprentissage**. Le vocabulaire est fixé au §3 et s'emploie tel
quel partout. Les décisions et leurs raisons sont tracées dans `.memlog.md` ; les inférences non encore
confirmées portent la marque `[ASSUMPTION]`.

Deux modules voisins ont **leur propre PRD**, et ce document ne fait que s'y raccorder : **Reprise de
données** (lot 1, requise en février) et **Connecteurs** (synchronisation permanente, plus tard).

## 1. Vision

Prospera se vend à des entreprises (assureurs, IMF, distributeurs) qui veulent **leur** logiciel, pas une
copie du voisin. Le moteur d'installation fait qu'**un même produit** devient, chez chacun, exactement ce
qu'il a acheté : on installe les modules de son pack, dans le bon ordre, sans oubli et sans code propre au
client. Comme dans Odoo, on ne développe pas un logiciel par client : on **installe** des modules.

Il le fait **là où le client l'exige**. Un distributeur est servi sur les serveurs de Money Vibes ; un
assureur ou une IMF, sur ses propres serveurs, parce que ses données ne doivent pas quitter ses locaux. Dans
les deux cas, c'est la même plateforme, la même ligne de version, le même geste d'installation. L'instance
du client reste **reliée à Money Vibes par une connexion sortante** : elle reçoit les mises à jour, une
licence signée et le modèle commun d'IA ; elle renvoie son état de santé et, **seulement avec le
consentement du client**, de quoi améliorer l'IA.

Le client garde la main sur ce qui change chez lui. Toute mise à jour passe d'abord par son **espace
d'essai**, où ses utilisateurs clés la testent sur leurs vrais dossiers ; son DSI choisit la date de mise
en service ; un retour arrière en un clic la défait sans rien perdre. Pour Money Vibes, la récompense est
double : **dix clients la première année** sans dix produits à maintenir, et des historiques qui, mis en
commun avec l'accord de chacun, rendent le modèle d'IA commun **meilleur à chaque client signé**.

**Échéances :** la démo du **15/01/2027** installe le pack distributeur en une action sur une organisation
vierge ; en **février 2027**, deux premiers clients : un **assureur sur ses serveurs** et un
**distributeur sur les serveurs de Money Vibes**.

## 2. Pour qui

### 2.1 Besoins (« jobs to be done »)

- **L'équipe de déploiement Money Vibes** (intégrateur, ingénieur données, cheffe de projet) : installer chez
  un client les modules qu'il a achetés, dans le bon ordre, sans pouvoir se tromper ni oublier une
  dépendance ; savoir à tout moment ce qui est installé, en essai, en service.
- **Le DSI du client** : garder le contrôle de son système. Aucune mise à jour sans son accord, une date
  qu'il choisit, un retour arrière garanti, et la certitude que les données ne sortent pas sans son
  consentement.
- **Les utilisateurs clés du client** (gestionnaire, comptable, chef d'agence) : essayer une nouveauté sur
  leurs vrais dossiers avant qu'elle ne touche leur travail réel.
- **La direction de Money Vibes** : savoir quels clients ont quoi, dans quelle version, en bonne santé ou non,
  et garder l'autorité sur les licences, même pour une instance hors ligne plusieurs jours.
- **Les équipes qui construisent les modules** : une règle unique pour déclarer un module installable, et
  aucune exception par client.

### 2.2 Hors cible (v1)

- Le client qui voudrait **installer lui-même** des modules en libre-service : l'installation reste faite
  par Money Vibes. `[ASSUMPTION : rien dans les parcours ne montre de libre-service]`
- Les **versions propres à un client** : interdites (contrat de module C6).

## 2.3 Parcours clés

Les trois parcours ont été racontés par le PO le 2026-11-10. Chacun a un **message produit** :

| Produit | Message | Hébergement |
|---|---|---|
| Assurance | « On ne remplace pas votre logiciel, on lui ajoute l'IA. » | serveurs du client |
| Distributeur | « On sort la vente du cahier, de la clé USB et de WhatsApp. » | serveurs de Money Vibes |
| Microfinance | « Votre logiciel garde vos données ; Prospera s'y branche pour que tout réponde tout de suite. » | serveurs du client (confirmé par le PO le 2026-11-10) |

### UJ-1. Fatou retrouve un dossier sinistre en trois secondes, et l'IA le lui résume

- **Contexte :** une compagnie d'assurance garde son logiciel métier (polices, primes), qui n'a aucune IA.
  Les données ne quittent pas ses locaux.
- **État de départ :** contrat signé ; serveur et NAS livrés chez le client ; export des clients, polices
  et sinistres ouverts fourni par la DSI ; cartons d'archives papier à numériser.
- **Parcours :**
  1. Yao (ingénieur données, Money Vibes) installe le serveur avec Koffi (DSI du client) : un
     environnement de test, la production, des sauvegardes automatiques.
  2. Yao reprend l'export de l'ancien logiciel depuis la console Money Vibes ; un **rapport de reprise**
     liste les écarts (doublons, numéros de police incohérents).
  3. Aminata (cheffe de projet) forme les gestionnaires, dont Fatou, sur leurs vrais dossiers, dans
     l'environnement de test.
  4. **Mise en service par étapes** : la recherche, les dossiers et la GED ; puis le circuit sinistre ;
     enfin l'IA locale, calibrée sur l'historique de la compagnie.
- **Moment gagné :** un assuré appelle ; Fatou retrouve son dossier en trois secondes ; l'IA affiche le
  résumé (pièces manquantes, expertise en cours, montant chiffré). La réception définitive est signée.
- **Cas d'échec :** la compagnie déploie un nouveau logiciel métier dont l'API n'est pas prête. Prospera
  fonctionne seul sur les données reprises, et l'API se branche dès qu'elle existe (clause du contrat).

### UJ-2. Ibrahim finit sa tournée sans rien ressaisir

- **Contexte :** un distributeur travaille sur Odoo, à la main (cahiers, Excel, WhatsApp), ou les deux ;
  parfois tout tient sur une clé USB.
- **État de départ :** contrat signé ; accès à l'Odoo existant, ou clé USB confiée par le client ; liste des
  commerciaux, des points de vente et des produits.
- **Parcours :**
  1. Rachid (intégrateur) récupère les données là où elles sont : **connecteur Odoo** branché depuis la
     console Money Vibes (clients, produits, stock, compta), ou **fichiers de la clé USB** copiés chez le
     client en présence d'Awa (comptable) puis importés. Un **rapport d'import** liste ce qui est repris et
     ce qui manque.
  2. Aminata passe une journée avec Moussa (DG) et Awa : rôles, zones, tournées.
  3. Ibrahim (commercial terrain) installe l'application sur son téléphone et fait une tournée test
     accompagnée, en zone sans réseau.
- **Moment gagné :** en fin de journée, Ibrahim n'a rien ressaisi ; ses commandes prises hors ligne se sont
  synchronisées au retour du réseau ; les paiements Mobile Money sont rapprochés des factures ; Awa voit le
  stock à jour sans rien toucher.
- **Cas d'échec :**
  - la clé contient trois versions incomplètes du fichier clients : Rachid les fusionne et marque les
    doublons ; Awa et Moussa **valident la liste finale avant l'import** ; la clé ne sert plus ;
  - un ancien prestataire a personnalisé l'Odoo et les références produits ne correspondent pas : Rachid
    construit une **table de correspondance** ; l'ancien et le nouveau système tournent **en parallèle une
    semaine**, jusqu'à ce que les stocks concordent.

### UJ-3. Mariam ouvre le portefeuille à risque en réunion, depuis son téléphone

- **Contexte :** une IMF garde son logiciel actuel, qui **reste la référence** des données (comptes, prêts,
  remboursements) mais est très lent. Prospera ne le remplace pas : il dialogue avec lui et apporte la
  vitesse, le pilotage, le terrain et l'IA.
- **État de départ :** contrat signé ; accès à l'API du logiciel, ou accord de l'éditeur pour en ouvrir une ;
  premier export Excel ou JSON du portefeuille et de l'historique des prêts ; liste des agences et des
  agents de crédit.
- **Parcours :**
  1. Yao charge l'export depuis la console Money Vibes et **compare les soldes au franc près** avec le
     logiciel de l'IMF.
  2. Rachid branche l'API avec l'informaticien de l'IMF ou l'éditeur : chaque décaissement ou
     remboursement saisi dans le logiciel arrive dans Prospera ; ce que l'agent saisit sur le terrain
     **repart vers le logiciel**, qui reste la référence.
  3. Aminata forme Sékou (chef d'agence) et les agents de crédit, dont Kodjo : pipeline crédit, scoring,
     relances.
  4. Kodjo active le mode hors ligne et le GPS, et part en mission dans les villages.
  5. Les états BCEAO et la comptabilité SYSCOHADA se préparent à partir des données synchronisées.
- **Moment gagné :** un client rembourse à l'agence le matin ; quelques minutes plus tard, Kodjo le voit et
  ne le relance pas pour rien ; le PAR 30/60/90, qui demandait une demi-journée, s'affiche en quelques
  secondes ; Mariam (DG) l'ouvre en réunion ; le premier rapport réglementaire du mois sort sans ressaisie.
- **Cas d'échec :**
  - pas d'API, ou l'éditeur tarde : un **export automatique** (chaque nuit ou plusieurs fois par jour) est
    importé seul ; on bascule sur l'API dès qu'elle existe ;
  - à l'amorçage, quelques dizaines de soldes divergent (pénalités calculées autrement) : **pas de mise en
    service tant que l'écart n'est pas nul** ; les deux systèmes tournent en parallèle sur un cycle de
    remboursement, le temps d'aligner les règles.

---

## 3. Vocabulaire

*Ces termes s'emploient tels quels dans tout le PRD et dans les documents qui en dérivent. Aucun synonyme.*

**Ce qu'on vend**
- **Organisation** : un client (assureur, IMF, distributeur, cabinet), ou Money Vibes elle-même.
- **Module** : ce qu'on vend et qu'on installe ; un `code` au catalogue. Défini par le contrat de module.
- **Service** : ce qu'on déploie (un conteneur). Un service porte un ou plusieurs modules.
- **Pack** : une liste de modules et de référentiels vendus ensemble pour un métier.
- **Manifeste** : la fiche d'identité d'une version de module (contrat de module C1).
- **Dépendance dure** (`depends`) / **dépendance optionnelle** (`enrichiPar`) : contrat de module §3.

**Où ça tourne**
- **Instance** : un déploiement de la plateforme Prospera. Une instance a toujours **deux espaces**.
- **Plateforme Money Vibes** : l'instance hébergée sur les serveurs de Money Vibes ; elle sert plusieurs
  organisations (les distributeurs).
- **Instance sur site** : une instance hébergée sur les serveurs d'un client ; elle sert cette seule
  organisation (assureurs, IMF).
- **Espace d'essai** : la partie d'une instance où l'on installe et l'on teste, avec les vrais dossiers du
  client, avant toute mise en service. Terme employé avec le client au lieu d'« environnement de test ».
- **Espace réel** : la partie d'une instance où travaillent les utilisateurs. Au lieu de « production ».
- **Console Money Vibes** : l'outil d'administration de Money Vibes. Sur une instance sur site, elle tourne
  **sur l'instance du client**.

**Ce qu'on fait à un module**
- **Installer** : rendre un module disponible pour une organisation **dans l'espace d'essai**.
- **Mettre en service** : rendre un module disponible **dans l'espace réel**, une fois ses conditions
  remplies (recette passée, reprise de données réconciliée). Installé ≠ en service.
- **Suspendre** : fermer l'accès sans rien supprimer (impayé, litige).
- **Désinstaller** : fermer l'accès sans rien supprimer ; réinstaller retrouve tout.
- **Effacer** : supprimer les données d'une organisation ; acte séparé, demandé, tracé, hors de ce PRD.

**Ce qui relie l'instance à Money Vibes**
- **Connexion sortante** : la seule liaison permise ; c'est l'instance qui appelle Money Vibes, jamais
  l'inverse.
- **Licence** : un document **signé par Money Vibes** qui liste, pour une instance, les organisations, leurs
  modules et leurs échéances. Sur une instance sur site, c'est la source des droits d'usage.
- **Délai de grâce** : la durée pendant laquelle une instance sur site fonctionne sans pouvoir joindre Money
  Vibes. `[ASSUMPTION : 30 jours, à fixer]`
- **Version** : un état de la plateforme et de ses modules. **Une seule ligne de version pour tous les
  clients.**
- **Mise à jour** : le passage d'une instance à une nouvelle version. Elle est **tirée** par l'instance,
  arrive d'abord dans l'espace d'essai, puis est **promue** dans l'espace réel à la date choisie par le DSI.
- **Retour arrière** : le retour à la version précédente, sans perte de données.
- **Correctif de sécurité** : une mise à jour au chemin rapide (délai court, retour arrière automatique).

**Données et apprentissage**
- **Canal de données** : tout ce qui sort d'une instance vers Money Vibes, par niveau :
  **0** indicateurs (version, santé, licence, indicateurs IA agrégés) · **1** échantillon pseudonymisé
  approuvé à chaque export · **2** accès encadré (sur place, ou tunnel ouvert par le client) · **3** mise en
  commun consentie d'un jeu d'entraînement pseudonymisé.
- **Consentement** : l'accord d'une organisation pour une finalité et un niveau donnés ; révocable,
  journalisé. Sans lui, rien au-delà du niveau 0 ne sort.
- **Modèle commun** : le modèle d'IA livré par Money Vibes à toutes les instances ; il appartient à Money
  Vibes.
- **Calibration locale** : l'ajustement du modèle commun sur l'historique d'une organisation ; c'est une
  donnée de l'organisation, jamais écrasée par une mise à jour.
- **Contribution** : ce qu'une instance envoie pour améliorer le modèle commun, sous consentement de
  niveau 3.

**Modules voisins (leur propre PRD)**
- **Reprise de données** : faire entrer **une fois** les données d'un client (export, fichiers, Odoo, API
  fournie par le client), avec rapport d'écarts et validation par le client avant import.
- **Connecteurs** : la synchronisation **permanente et dans les deux sens** avec un logiciel que le client
  garde.

**Installation (partie A)**
- **Offre** : ce que le client a acheté, choisi dans la console : la **plateforme complète**, un ou
  plusieurs **packs**, plus ou moins des modules ajustés un par un. `[ASSUMPTION : « bundle » (terme
  commercial) = « pack » (terme du catalogue) ; voir §4.A, question ouverte QA-1]`
- **Prérequis** : ce qu'un module exige du client pour fonctionner (clé d'accès PI-SPI, numéro WhatsApp
  vérifié, connecteur joignable…). Déclaré au manifeste, vérifié pendant l'installation.
- **Vérification** : un contrôle réel qu'un module exécute et dont il rend le résultat chiffré (données
  importées, comptes créés, message de test reçu). « Vérifié » ne veut jamais dire « pas d'erreur ».
- **Bilan d'installation** : l'écran, puis le PDF, qui donne pour chaque module de l'offre son voyant et
  ses vérifications.
- **Voyant** : 🟢 **vérifié** · 🟠 **en attente** (une dépendance ou un prérequis manque) · 🔴 **bloqué**
  (avec la raison et l'action à faire).
- **État du client** : **En installation** tant qu'un voyant n'est pas vert ; **En service** quand tous le
  sont.

---

## 4. Fonctionnalités

### 4.A Activer : choisir, vérifier, installer, mettre en service

**Description.** Rachid ouvre la fiche du client dans la console Money Vibes et clique sur « Installer
Prospera Distributeur » (réalise UJ-2). Il part de l'**offre** : la plateforme complète, ou un ou
plusieurs packs (Terrain & Ventes, Finance & Recouvrement, Stock & Logistique, Croissance & Équipes).
Choisir un pack coche ses modules ; Rachid ajuste ensuite un par un pour refléter ce que le client a
réellement acheté. Exemple : Moussa a pris Terrain & Ventes (CRM, Terrain & Tournées, Application mobile,
Prise de commande) et ajoute Facturation pour que ses commerciaux facturent depuis leur téléphone.

Les **dépendances** se règlent **au moment où l'on coche**, jamais au lancement : on ne peut pas lancer une
installation avec un module orphelin. Les **prérequis**, eux, ne se voient qu'à l'installation : un module
dont un prérequis manque passe en rouge, ceux qui en dépendent attendent en orange, et **le reste du pack
est utilisable tout de suite**. L'installation se termine sur le **bilan d'installation**, qui montre ce qui
a vraiment été vérifié. Le client passe **En service** seulement quand tout est vert.

**Exigences fonctionnelles**

#### FR-1 : Choisir l'offre du client
L'équipe de déploiement peut choisir, pour une organisation, la plateforme complète ou un ou plusieurs
packs, puis ajouter ou retirer des modules un par un. Réalise UJ-2.

**Conséquences (testables) :**
- Choisir un pack coche tous ses modules ; le retirer décoche ceux qu'aucun autre choix ne retient.
- La sélection finale (packs, ajouts, retraits), son auteur et sa date sont enregistrés.
- Un module ajouté hors pack est marqué comme tel dans la sélection et dans le bilan.

#### FR-2 : Ajouter les dépendances au moment du choix, avec leur raison
Quand un module coché a une dépendance dure non cochée, la console l'ajoute aussitôt et dit pourquoi.

**Conséquences (testables) :**
- Cocher Relances & Recouvrement sans Facturation ajoute Facturation et affiche : « ➕ Facturation
  ajoutée : Relances en a besoin pour connaître les créances. »
- **La raison vient du manifeste** : chaque dépendance dure y porte un libellé lisible par un humain.
- Annuler l'ajout de la dépendance décoche aussi le module qui l'a demandée.
- Les dépendances se résolvent en cascade (la dépendance d'une dépendance est ajoutée aussi).

#### FR-3 : Empêcher le retrait d'un module dont d'autres ont besoin
Quand on retire un module requis par d'autres modules cochés, la console arrête et propose deux issues.

**Conséquences (testables) :**
- Retirer Facturation alors qu'Encaissements et Relances sont cochés affiche : « ⚠ Encaissements et
  Relances utilisent Facturation. Retirer les trois, ou garder Facturation ? »
- Aucune des deux issues ne laisse un module orphelin dans la sélection.
- La même règle vaut pour désinstaller un module déjà installé : refus `MODULE_REQUIS_PAR` (409) avec la
  liste des modules dépendants (contrat de module §3, Q2).

#### FR-4 : Un seul point de décision, quel que soit le chemin
Toute installation passe par la même vérification des dépendances, qu'elle vienne de la console, d'un
abonnement payé, de la propagation d'un pack ou d'une licence importée sur site.

**Conséquences (testables) :**
- Une demande d'installation à laquelle manque une dépendance dure est refusée par le serveur avec
  `MODULE_DEPENDANCE_MANQUANTE` (422) et la liste des modules manquants, **même si la console a été
  contournée**.
- Retirer la vérification du point de décision fait échouer les tests des quatre chemins (test de mutation).
- Un manifeste qui crée un cycle de dépendances est refusé : `MANIFESTE_CYCLE` (422).

#### FR-5 : Vérifier les prérequis pendant l'installation, sans bloquer le reste
Chaque module déclare ses prérequis au manifeste. Pendant l'installation, un prérequis absent bloque ce
module et ceux qui en dépendent, et seulement eux.

**Conséquences (testables) :**
- Clé PI-SPI absente : « ✖ Encaissements & PI-SPI : clé d'accès PI-SPI absente. → Demander la clé à la
  banque du client, puis « Réessayer ». » Le voyant est 🔴, avec la raison et l'action.
- Les modules qui dépendent du module bloqué passent 🟠 **en attente** ; les autres s'installent.
- « Réessayer » ne rejoue que les vérifications en échec, et peut être relancé sans effet de bord.
- Un module en attente ou bloqué n'apparaît pas dans le menu des utilisateurs du client.

#### FR-6 : Des vérifications réelles, pas des « OK »
Chaque module installé exécute ses vérifications et en rend le résultat chiffré.

**Conséquences (testables) :**
- **Données importées** : le nombre d'objets repris par module (« 1 240 points de vente, 312 produits,
  9 commerciaux »), fourni par la Reprise de données, quelle que soit la source (Odoo ou fichiers).
- **Comptes et rôles** : chaque compte créé (DG, comptable, commercial) avec son rôle, et l'invitation
  envoyée.
- **Connexions testées** : message WhatsApp de test reçu, lien de paiement PI-SPI de test généré,
  synchronisation Odoo aller-retour `[ASSUMPTION : relève du module Connecteurs, voir QA-3]`.
- Une vérification qui n'a pas pu s'exécuter n'est jamais affichée comme réussie.

#### FR-7 : Le bilan d'installation et le passage « En service »
À la fin, la console affiche le bilan : une ligne par module, son voyant et ses vérifications.

**Conséquences (testables) :**
- Tant qu'une ligne est 🟠 ou 🔴, la fiche du client reste **En installation** et le bilan sert de liste
  des choses à finir.
- Quand toutes les lignes sont 🟢, la fiche passe **En service**.
- « Envoyer le bilan au client » produit un PDF reçu par le dirigeant du client.
- Le bilan est conservé : on peut le rouvrir et voir qui a installé quoi, quand, et avec quels résultats.

#### FR-8 : La répétition générale, puis la mise en service
Toute installation se joue d'abord **dans l'espace d'essai**, puis est **rejouée** dans l'espace réel.
Réalise UJ-1, UJ-2, UJ-3.

**Conséquences (testables) :**
- Dans l'espace d'essai : offre installée, reprise de données, comptes, connecteurs, puis **bilan d'essai**.
- Une **date de mise en service** est fixée avec le client.
- Le jour venu, la **même offre** et les **mêmes tables de correspondance** sont rejouées dans l'espace réel,
  avec une reprise **fraîche** : on ne copie jamais l'essai vers le réel.
- Le **bilan de mise en service** est distinct du bilan d'essai ; seul le premier fait passer le client
  **En service** (FR-7).

#### FR-9 : Un espace d'essai qu'on ne peut pas confondre avec le réel
**Conséquences (testables) :**
- L'espace d'essai porte en permanence un **bandeau jaune** (« ESPACE D'ESSAI : rien de ce que vous faites
  ici n'est réel »), une couleur différente et un **titre d'onglet différent**.
- **Aucun envoi réel ne part de l'espace d'essai** : SMS, WhatsApp, e-mail et liens de paiement sont
  interceptés, sauf vers une **liste blanche de test**, et restent consultables dans un journal.
- L'interdit est vérifié côté serveur : un envoi réel demandé depuis l'essai est refusé, quel que soit
  l'écran.

#### FR-10 : Un espace d'essai qui ressemble au réel
**Conséquences (testables) :**
- L'espace d'essai se **rafraîchit depuis l'espace réel** à la demande, et obligatoirement avant une mise à
  jour majeure.
- La copie reste **sur le même hébergement** et **cloisonnée par organisation**.
- Un rafraîchissement ne modifie jamais l'espace réel, et les envois restent interceptés (FR-9).

#### FR-11 : Un seul chemin pour tout changement
Premier module, module ajouté plus tard, mise à jour de version : **toujours** essai, bilan, puis promotion
dans le réel.

**Conséquences (testables) :**
- Il n'existe aucune commande qui installe ou met à jour directement dans l'espace réel.
- Un module **sans reprise de données** peut être promu le jour même de son installation en essai.

#### FR-12 : Le contrat fait foi
L'offre installée doit **concorder avec le contrat ou l'abonnement** du client (vente directe aux
institutions).

**Conséquences (testables) :**
- À l'ouverture de l'installation, la console **précharge l'offre** depuis le contrat du client
  (contrat de `paiement-service`, STORY-727) ; Rachid ajuste dans ses limites.
- Installer un module que le contrat ne couvre pas est refusé : `MODULE_NON_SOUSCRIT` (422).
- Un module ajouté au contrat devient installable sans autre action.

**Hors périmètre :** la place de marché, où la sélection du client ferait foi (plus tard).

#### FR-13 : Le même geste sur la plateforme Money Vibes et sur site
**Conséquences (testables) :**
- La console, les voyants, le bilan et les refus sont **identiques** pour un distributeur hébergé chez
  Money Vibes et pour un assureur sur ses serveurs.
- Sur une instance sur site, la console tourne **sur l'instance** et les droits viennent de la **licence**
  (FR-14).

**Questions de la partie A, tranchées le 2026-11-10**
- **QA-1** : la console montre les **modules commerciaux** (18 pour le distributeur, 4 packs, add-on
  Freelance). Le catalogue technique est incomplet **par choix** : **chacun de ces modules doit y entrer**,
  avec son manifeste. « Bundle » et « pack » désignent la même chose.
- **QA-2** : la répétition générale (FR-8 à FR-11).
- **QA-3** : **Connecteurs** doit être prêt en février ; son PRD entre au lot 1.
- **QA-4** : le contrat ou l'abonnement fait foi (FR-12).

### 4.B Livrer et mettre à jour l'instance

**Description.** Chez un assureur ou une IMF, Yao et Koffi (DSI) installent l'instance sur le serveur du
client : socle, modules de l'offre, deux espaces, sauvegardes (réalise UJ-1). L'instance n'accepte
**aucune connexion entrante** ; c'est elle qui appelle Money Vibes pour recevoir sa licence et ses mises à
jour, et pour dire comment elle va. Quand une version sort, Money Vibes la dépose d'abord dans l'espace
d'essai du client, la vérifie, puis prévient Koffi ; quelques utilisateurs clés l'essaient sur leurs vrais
dossiers ; Koffi choisit la date ; la promotion se fait avec sauvegarde avant, contrôle après et retour
arrière automatique en cas d'échec. Pour un distributeur, tout cela se passe sur les serveurs de Money
Vibes, avec les mêmes étapes.

#### FR-14 : La licence signée
**Conséquences (testables) :**
- Money Vibes émet pour chaque instance sur site une **licence signée** : organisations, modules,
  échéances. L'instance vérifie la signature **hors ligne**.
- Une licence altérée ou mal signée est refusée, et l'instance garde la précédente.
- Un module absent de la licence ne s'installe pas : `MODULE_HORS_LICENCE` (422).
- Une suspension (impayé, litige) ou un ajout de module arrive par une **nouvelle licence**, au contact
  suivant.

#### FR-15 : Fonctionner coupé de Money Vibes
**Conséquences (testables) :**
- Une instance sur site fonctionne normalement sans joindre Money Vibes pendant le **délai de grâce**
  `[ASSUMPTION : 30 jours]`.
- Le DSI et Money Vibes sont alertés à partir de `[ASSUMPTION : J+7]` sans contact.
- À l'expiration : `[QUESTION QB-1 : que se passe-t-il ?]`

#### FR-16 : Connexion sortante uniquement, et supervision
**Conséquences (testables) :**
- L'instance n'ouvre **aucun port entrant** ; toutes les liaisons sont initiées par elle, en HTTPS.
- Elle envoie un **battement** à intervalle régulier `[ASSUMPTION : toutes les 15 minutes]` : version, santé
  par module, licence, indicateurs de niveau 0.
- Money Vibes dispose d'une **vue de supervision** de toutes les instances : version, santé, dernier contact,
  mises à jour en attente.

#### FR-17 : Mises à jour tirées, essayées, puis promues à la date du client
**Conséquences (testables) :**
- L'instance voit les versions disponibles, télécharge des **paquets signés** et refuse un paquet dont la
  signature est invalide.
- La version s'installe **d'abord dans l'espace d'essai** ; Money Vibes y joue la recette.
- Le DSI reçoit un message en langage simple : ce qui change, ce qu'il faut essayer, la date proposée.
- Le DSI **choisit la date** de promotion ; sans son accord, rien ne change dans l'espace réel (sauf FR-19).
- Avant la promotion : **sauvegarde automatique** ; après : **contrôle de santé** ; en cas d'échec :
  **retour arrière automatique**.

#### FR-18 : Retour arrière en un clic, sans perte
**Conséquences (testables) :**
- Après une promotion, le DSI peut revenir à la version précédente en une action, pendant
  `[ASSUMPTION : 7 jours]`.
- Les données saisies depuis la promotion sont conservées ; une mise à jour dont la migration de données
  n'est pas réversible ne peut pas être publiée sans sauvegarde restaurable.

#### FR-19 : Le chemin rapide des correctifs de sécurité
**Conséquences (testables) :**
- Un correctif de sécurité passe par l'essai **et** la promotion dans un délai court
  `[ASSUMPTION : 72 heures]`, avec retour arrière automatique.
- Le DSI est prévenu avant ; `[QUESTION QB-2 : peut-il refuser ou reporter ?]`

#### FR-20 : Déploiement par vagues
**Conséquences (testables) :**
- Money Vibes fixe l'ordre : un **client pilote** d'abord, puis les autres.
- Une version ne passe à la vague suivante qu'après `[ASSUMPTION : 7 jours]` de santé sans incident sur la
  précédente.

#### FR-21 : Une seule ligne de version
**Conséquences (testables) :**
- Aucune branche de code propre à un client (contrat de module C6).
- Une instance ne peut pas rester plus de **deux versions majeures** en retard : c'est la fenêtre de support
  N/N-1 déjà appliquée par le catalogue (`fenetre-de-support.ts`).

#### FR-22 : Mise à jour hors ligne
**Conséquences (testables) :**
- Le **même paquet signé** peut être apporté sur clé USB lors d'une visite et appliqué par le même chemin
  (essai, puis promotion).

#### FR-23 : Support à distance à la demande
**Conséquences (testables) :**
- Un tunnel de support n'existe que **si le client l'ouvre**, pour une durée limitée, et chaque session est
  journalisée (qui, quand, combien de temps).
- Aucun accès permanent de Money Vibes à une instance sur site.

#### FR-24 : Les modèles d'IA du client sont intouchables
**Conséquences (testables) :**
- Une mise à jour ne modifie jamais une **calibration locale** : son empreinte est identique avant et après
  (contrat de module C11).
- La calibration est sauvegardée et restaurée avec les données (FR-17, FR-18).

#### FR-25 : Monter une instance sur site
**Conséquences (testables) :**
- À partir d'un serveur livré, une procédure scriptée monte le socle, les deux espaces et les modules de la
  licence, chacun par son **profil** (contrat de module C10), avec sauvegardes automatiques.
- La procédure se termine par un **bilan d'instance** : espaces actifs, licence valide, battement reçu par
  Money Vibes, sauvegarde testée par une restauration.

### 4.C Données et apprentissage

**Description.** Par défaut, rien de ce qui appartient au client ne sort de son instance : seuls partent des
indicateurs. Pour améliorer l'IA, Money Vibes peut demander plus, et chaque niveau supplémentaire exige le
**consentement** du client. Le but déclaré est un **modèle commun** nourri par les historiques des clients
qui l'acceptent, le plus tôt possible ; chaque client le recalibre ensuite chez lui. Ces règles valent
aussi pour les distributeurs hébergés chez Money Vibes : avoir leurs données sur nos serveurs ne donne pas
le droit de les mettre en commun.

#### FR-26 : Niveau 0, des indicateurs seulement
**Conséquences (testables) :**
- Sortent automatiquement : version, santé, licence, et **indicateurs IA agrégés** (taux d'erreur par
  modèle, nombre de corrections, dérive).
- Aucun indicateur ne contient un identifiant de personne ou de dossier ; un test le vérifie sur chaque
  envoi.

#### FR-27 : Le registre des consentements
**Conséquences (testables) :**
- Un consentement porte : organisation, **finalité**, **niveau** (1, 2 ou 3), auteur, date, référence de la
  clause du contrat client.
- Il est donné par `[QUESTION QC-1 : quel rôle chez le client ?]` ; il se **retire** à tout moment.
- Chaque don et chaque retrait sont journalisés ; le client consulte ce journal.
- Sans contrat client signé portant la clause correspondante, aucun consentement ne s'enregistre.

#### FR-28 : Niveau 1, l'échantillon pseudonymisé
**Conséquences (testables) :**
- Money Vibes demande un échantillon (par exemple les dossiers où l'IA s'est trompée) ; le client
  **approuve chaque export** ; l'échantillon est pseudonymisé avant de sortir.
- Le client voit dans le journal ce qui est sorti, quand et pour quoi.

#### FR-29 : Niveau 2, l'accès encadré
**Conséquences (testables) :**
- L'analyse se fait sur place, ou par le tunnel ouvert par le client (FR-23) ; rien n'est copié hors de
  l'instance.

#### FR-30 : Niveau 3, la contribution au modèle commun
**Conséquences (testables) :**
- L'entraînement s'exécute **sur l'instance** et produit une **contribution** (jeu d'entraînement
  pseudonymisé en première étape).
- Une contribution ne sort que sous consentement valide ; sinon, refus `CONSENTEMENT_ABSENT` et rien ne
  sort.
- Un consentement retiré exclut l'organisation du **prochain** tour d'entraînement ; il ne défait pas un
  modèle déjà produit (le contrat client le dit).

#### FR-31 : Le modèle commun redescend comme une mise à jour
**Conséquences (testables) :**
- Le modèle commun est livré comme un paquet signé, par le chemin de FR-17 (essai, puis promotion).
- Chaque instance le **recalibre localement** ; la calibration précédente reste disponible pour un retour
  arrière.

**Hors périmètre de 4.C :** l'apprentissage fédéré (deuxième étape, quand le nombre de clients le
justifie) ; la remise commerciale accordée à ceux qui partagent ; la rédaction du contrat client (prérequis
juridique, loi togolaise 2019-014).

---

## 5. Exigences transverses

- **NFR-1, signature** : licences, paquets de version et modèles communs sont signés par Money Vibes ;
  l'instance refuse tout ce qui ne l'est pas.
- **NFR-2, aucune entrée** : aucune instance sur site n'expose de port entrant vers internet.
- **NFR-3, cloisonnement** : l'espace d'essai ne lit ni n'écrit jamais l'espace réel, sauf le
  rafraîchissement (FR-10), qui va dans un seul sens.
- **NFR-4, traçabilité** : installations, mises en service, promotions, retours arrière, consentements,
  exports et sessions de support sont journalisés en **ajout seul**.
- **NFR-5, rapidité** : le pack distributeur complet s'installe dans l'espace d'essai en moins de
  `[ASSUMPTION : 15 minutes]`, hors reprise de données.
- **NFR-6, idempotence** : rejouer une installation, une promotion ou un « Réessayer » ne crée aucun doublon.

## 6. Indicateurs de réussite

| # | Indicateur | Cible |
|---|---|---|
| SM-1 | Démo du 15/01 : le pack distributeur installé **en une action** sur une organisation vierge, bilan tout vert | atteint |
| SM-2 | Clients **En service** en février 2027 | 2 (un assureur sur site, un distributeur chez Money Vibes) |
| SM-3 | Changements arrivés dans un espace réel **sans** passer par l'essai | 0 |
| SM-4 | Données sorties d'une instance **sans** consentement valide | 0 |
| SM-5 | Clients installés la première année | ≈ 10 |

**Contre-indicateurs** (à surveiller pour qu'on ne triche pas avec les cibles) :
- nombre de **retours arrière** par version (une promotion trop rapide se paie ici) ;
- modules restés **🟠 en attente plus de 7 jours** (un bilan « presque vert » n'est pas un client servi) ;
- instances **au-delà du délai de grâce**.

## 7. Contrat de module du moteur lui-même

Le moteur vit dans `platform-catalog-service` ; il applique le contrat qu'il fait respecter.

| Clause | Pour le moteur |
|---|---|
| C1 | Le manifeste s'enrichit : raison par dépendance, prérequis, vérifications, champ `ia` |
| C2 | Socle existant du catalogue (droits plateforme `entitlement:*`) |
| C3 | Possède : offres, bilans, licences, consentements, journal ; n'écrit dans aucun autre module |
| C4 | Sans Reprise ni Connecteurs, le bilan déclare leurs lignes « non installé », jamais vertes |
| C5 | Publie `entitlement.changed` (existant) ; topics de bilan et de licence à nommer dans la spine |
| C6 | Aucune règle propre à un client ; tout passe par le contrat et la licence |
| C7 | Droits plateforme existants ; droit client à créer pour donner un consentement (FR-27) |
| C8 | Écrans dans la console Money Vibes (installation, bilan, supervision, consentements) |
| C9 | Désinstaller ne supprime rien (existant : `DELETE` = `REVOKED`) |
| C10 | Socle minimal : démarre toujours, sans profil |
| C11 | Sans objet : le moteur n'embarque pas d'IA ; il transporte les contributions (4.C) |

## 8. Questions ouvertes

| # | Question | Bloque |
|---|---|---|
| QB-1 | À l'expiration du délai de grâce, que fait l'instance ? (continuer et alerter / lecture seule / arrêt) | FR-15 |
| QB-2 | Le DSI peut-il refuser ou reporter un correctif de sécurité, et jusqu'à quand ? | FR-19 |
| QC-1 | Qui, chez le client, donne un consentement (DG, DSI, délégué à la protection des données) ? | FR-27 |
| — | Les valeurs marquées `[ASSUMPTION]` : délai de grâce 30 j, alerte à J+7, battement 15 min, retour arrière 7 j, correctif 72 h, vague 7 j, installation 15 min | à confirmer en bloc |
