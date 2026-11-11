---
title: "PRD — Moteur d'installation"
status: draft  # 2ᵉ réécriture le 2026-11-10 après le passage 2 de validation ; validation PO le 13/11
created: 2026-11-09
updated: 2026-11-10
project: prospera
service: platform-catalog-service  # partie A ; les services des parties B et C sont tranchés par la spine (§7)
position_sequence: 26
verticales: [Assurance, Distributeur, IMF, Cabinet, Money Vibes]
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (AD-P17, C1 → C11 ; C12 et C13 à ajouter)
mode: coaching
validation: validation-report.md (passage 2, 2026-11-10, thèmes U-01 → U-28) ; passage 1 dans revue-1/
addendum: addendum.md
---

# PRD — Moteur d'installation

*Brouillon complet, réécrit deux fois le 2026-11-10 après validation (passage 1 : 30 thèmes ; passage 2 :
28 thèmes, `validation-report.md`). Les prénoms des parcours sont provisoires et leurs cas d'échec sont
plausibles, pas vécus.*

*Découpé le 2026-11-10 : ce PRD garde les capacités ; le « comment » destiné à l'architecture (horloges, état de confiance, licence et clés, routes, événements, formes de données, chemins de code) est passé dans `addendum.md`, où mène chaque renvoi « (détail : addendum §A-n) ».*

---

## 0. Objet du document

Ce PRD décrit **comment un client reçoit Prospera** : quels modules il a, où ils tournent, comment ils sont
mis en service, mis à jour, et ce qui circule entre son instance et Money Vibes. Il s'adresse au PO (qui le
valide), à Dev A et Dev B (qui le construisent), et aux auteurs des PRD de chaque module (qui s'y branchent).

Il **applique** le contrat de module (`CONTRAT-DE-MODULE-2026-11-09.md`, AD-P17, clauses C1 → C11) sans le
répéter, et lui demande **deux clauses de plus** : **C12** (migrations rétrocompatibles pendant 7 jours et
interrupteurs de changement déclarés, FR-17, FR-18) et **C13** (installable sous contrôle : prérequis,
vérifications, santé, lecture de l'état publié, lecture seule déclarée, interception en essai, export,
import et effacement par organisation, FR-38), ainsi que **deux exceptions écrites à Q4** (effacement
de l'essai prospect, FR-33 ; suppression des données d'un acheteur hébergé sur la plateforme qui arrête son
abonnement d'hébergement, FR-32). Il est organisé en trois parties, décidées par le PO : **A. Activer** les
modules, **B. Livrer et mettre à jour l'instance**, **C. Données et apprentissage**. Le vocabulaire est
fixé au §3 et s'emploie tel quel partout. Les décisions et leurs raisons sont tracées dans `.memlog.md` ;
les inférences non encore confirmées portent la marque `[ASSUMPTION]` ; les points que le PO doit encore
trancher portent la marque `[NOTE FOR PM]` (§8.2). Les identifiants (FR-n, NFR-n, SM-n) sont **stables** :
ils gardent leur numéro d'origine et ne suivent donc pas toujours l'ordre du texte.

**Tout octroi de module passe par le moteur** (décision du PO, 2026-11-10), comme dans la liste
d'applications d'Odoo : un module ne s'ouvre que parce qu'il a été installé, puis mis en service. Seul le
module `instance` du moteur naît avec l'organisation (chemin 0 de FR-4). Payer,
renouveler, lever une sanction ou déposer une licence ne font que **prolonger ou rouvrir** un module déjà
installé (FR-4).

Le **cabinet comptable** passe lui aussi par le moteur, comme tout client (décision du PO, 2026-11-10). Il
est hébergé sur la plateforme Money Vibes (validé par le PO, 2026-11-10). Ses écrans vivent dans l'**app
expert-comptable**, pas dans `prospera-app` : cette app lit le même état publié (FR-34). Il n'a pas de
parcours propre dans ce PRD.

**Pas de reprise de l'existant** (décision du PO, 2026-11-10) : aucun contrat client n'est en cours ; les
droits présents sur `dev` sont des données de test, réamorcées à la mise en route du moteur. Le code déjà
livré (STORY-280, 281, 727) est ajusté à ce PRD (§8.4).

Deux modules voisins ont **leur propre PRD**, et ce document ne fait que s'y raccorder : **Reprise de
données** et **Connecteurs** (synchronisation permanente), tous deux au lot 1 et requis en février (QA-3).

**Jalons (décision du PO, 2026-11-10).** **Toutes les FR de ce PRD sont dues pour février 2027.** La démo
du 15/01 en montre la partie A (SM-1). Cela suppose la **révision de D3** (instance sur site prête avant
février, décidée en séance le 2026-11-09) : le plan v3 (§8), le contrat de module (§9) et AD-P17 disent
encore « après les 8 semaines » et doivent être amendés ; la charge réelle de Dev B se chiffre dans
l'amendement du plan v3, et l'**ordre de sacrifice** est décidé (§8.4). Pour FR-30 et FR-31, février livre
le **circuit** ; le premier modèle commun arrive quand les données le permettent (au plus tôt au 2ᵉ semestre
2027).

| Jalon | Exigences dues | Où |
|---|---|---|
| Démo du 15/01/2027 (SM-1) | partie A : FR-1 → FR-9, FR-12, FR-34 → FR-37 | espace d'essai de la plateforme Money Vibes |
| Février 2027 | toutes les FR (parties A, B et C) | les deux espaces, sur la plateforme et sur site |

## 1. Vision

Prospera se vend à des entreprises (assureurs, IMF, distributeurs) qui veulent **leur** logiciel, pas une
copie du voisin. Le moteur d'installation fait qu'**un même produit** devient, chez chacun, exactement ce
qu'il a acheté : on installe les modules de son offre, dans le bon ordre, sans oubli et sans code propre au
client. Comme dans Odoo, on ne développe pas un logiciel par client : on **installe** des modules, et rien
ne s'ouvre autrement.

Il le fait **là où le client l'exige**. Un distributeur est servi sur les serveurs de Money Vibes ; un
assureur ou une IMF, sur ses propres serveurs, parce que ses données ne doivent pas quitter ses locaux. Dans
les deux cas, c'est la même plateforme, la même ligne de version, le même geste d'installation. L'instance
du client reste **reliée à Money Vibes par une connexion sortante** : elle reçoit les mises à jour, une
licence signée et le modèle commun d'IA ; elle renvoie son état de santé et, **seulement avec le
consentement du client**, de quoi améliorer l'IA.

Le client garde la main sur ce qui change chez lui. Toute mise à jour passe d'abord par son **espace
d'essai**, où ses utilisateurs clés la testent sur leurs vrais dossiers ; sur site, son DSI choisit la
date de mise en service, et un retour arrière en un clic la défait pendant 7 jours, sans perte, sauf pour
une version déclarée avec perte (FR-18) ; sur la plateforme, chaque organisation choisit quand ses
utilisateurs voient un changement, avant une date limite. Pour Money Vibes, la récompense est double :
**dix clients la première année** sans dix produits à maintenir, et des historiques qui, mis en commun avec
l'accord de chacun, rendent le modèle d'IA commun **meilleur à chaque client signé**.

**Échéances :** la démo du **15/01/2027** installe le pack Terrain & Ventes sur une organisation
distributeur neuve, **en une action dans l'espace d'essai** (SM-1) ; en **février 2027**, tout ce PRD est
livré et deux premiers clients sont servis : un **assureur sur ses serveurs** et un **distributeur sur les
serveurs de Money Vibes**.

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

- Le client qui voudrait **installer lui-même** des modules : l'installation, y compris l'ouverture d'une
  offre d'essai, reste faite par Money Vibes. En revanche, **l'essai et l'import de données par le
  prospect se font en autonomie dès février** (FR-33, PRD Reprise FR-19).
- Les **versions propres à un client** : interdites (contrat de module C6).

### 2.3 Parcours clés

Les trois parcours ont été racontés par le PO le 2026-11-10. Chacun a un **message produit** :

| Produit | Message | Hébergement |
|---|---|---|
| Assurance | « On ne remplace pas votre logiciel, on lui ajoute l'IA. » | serveurs du client |
| Distributeur | « On sort la vente du cahier, de la clé USB et de WhatsApp. » | serveurs de Money Vibes |
| Microfinance | « Votre logiciel garde vos données ; Prospera s'y branche pour que tout réponde tout de suite. » | serveurs du client (confirmé par le PO le 2026-11-10) |

#### UJ-1. Fatou retrouve un dossier sinistre en trois secondes, et l'IA le lui résume

- **Contexte :** une compagnie d'assurance garde son logiciel métier (polices, primes), qui n'a aucune IA.
  Les données ne quittent pas ses locaux.
- **État de départ :** contrat signé ; serveur et NAS livrés chez le client ; export des clients, polices
  et sinistres ouverts fourni par la DSI ; cartons d'archives papier à numériser.
- **Parcours :**
  1. Yao (ingénieur données, Money Vibes) installe le serveur avec Koffi (DSI du client) : un
     espace d'essai, l'espace réel, des sauvegardes automatiques.
  2. Yao reprend l'export de l'ancien logiciel depuis la console Money Vibes ; un **rapport de reprise**
     liste les écarts (doublons, numéros de police incohérents).
  3. Aminata (cheffe de projet) forme les gestionnaires, dont Fatou, sur leurs vrais dossiers, dans
     l'espace d'essai.
  4. **Mise en service par étapes** : la recherche, les dossiers et la GED ; puis le circuit sinistre ;
     enfin l'IA locale, calibrée sur l'historique de la compagnie.
- **Moment gagné :** un assuré appelle ; Fatou retrouve son dossier en trois secondes ; l'IA affiche le
  résumé (pièces manquantes, expertise en cours, montant chiffré). La réception définitive est signée.
- **Cas d'échec :** la compagnie déploie un nouveau logiciel métier dont l'API n'est pas prête. Prospera
  fonctionne seul sur les données reprises, et l'API se branche dès qu'elle existe (clause du contrat).

#### UJ-2. Ibrahim finit sa tournée sans rien ressaisir

- **Contexte :** un distributeur travaille sur Odoo, à la main (cahiers, Excel, WhatsApp), ou les deux ;
  parfois tout tient sur une clé USB.
- **État de départ :** contrat signé ; accès à l'Odoo existant, ou clé USB confiée par le client ; liste des
  commerciaux, des points de vente et des produits.
- **Parcours :**
  1. Rachid (intégrateur) récupère les données là où elles sont : **connecteur Odoo** branché depuis la
     console Money Vibes (clients, produits, stock, compta), ou **fichiers de la clé USB** copiés chez le
     client en présence d'Awa (comptable) puis importés. Un **rapport de reprise** liste ce qui est repris et
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

#### UJ-3. Mariam ouvre le portefeuille à risque en réunion, depuis son téléphone

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
    importé seul ; on passe à l'API dès qu'elle existe ;
  - à l'amorçage, quelques dizaines de soldes divergent (pénalités calculées autrement) : **pas de mise en
    service tant que l'écart n'est pas nul** ; les deux systèmes tournent en parallèle sur un cycle de
    remboursement, le temps d'aligner les règles.

*Les trois parcours ci-dessus racontent les verticales. Les deux suivants racontent **le moteur lui-même** :
ils sont construits à partir des FR, pas racontés par le PO. Relus et validés par le PO le 2026-11-10.*

#### UJ-4. Rachid installe Prospera Distributeur chez Moussa sans rien oublier

- **Contexte :** Moussa (DG d'un distributeur) a signé, en abonnement mensuel, le pack Terrain & Ventes,
  Relances & Recouvrement et Encaissements & PI-SPI ; la vente y a ajouté Facturation, dont ces deux
  modules ont besoin (FR-12). Rachid (intégrateur, Money Vibes) a une journée.
- **Parcours :**
  1. Rachid ouvre la fiche du client dans la console Money Vibes. Elle montre le catalogue du vertical
     distributeur, avec l'**offre du contrat préchargée** (FR-12). Facturation y figure avec sa raison :
     « Relances en a besoin pour connaître les créances » (FR-2).
  2. Il lance l'installation **dans l'espace d'essai**. La clé PI-SPI manque : Encaissements passe 🔴 avec
     l'action à faire ; ce qui en dépend attend en 🟠 ; tout le reste est 🟢 et utilisable (FR-5).
  3. Il branche le connecteur Odoo **sur le bac à sable** d'Odoo déclaré et vérifié par le client (FR-9) ;
     la Reprise importe les données ; Awa et Moussa valident.
  4. Le bilan d'essai liste ce qui reste. Une date de mise en service est fixée **pour ce qui est vert**.
  5. Le jour venu, le dossier d'installation est rejoué dans l'espace réel ; la Reprise donne son feu vert
     sur le lot rejoué ; le client passe **En service partiel** (FR-8, §3). Encaissements suivra quand la
     banque aura livré la clé.
- **Moment gagné :** Moussa reçoit par e-mail le bilan de mise en service en PDF ; ses commerciaux voient
  dans leur menu exactement ce qu'il a acheté, et rien d'autre.
- **Cas d'échec :** une coupure électrique arrête l'installation à l'étape 7 sur 12 ; le bilan dit
  « interrompue à l'étape 7 » et « Reprendre » continue sans doublon (FR-40).

#### UJ-5. Koffi met à jour l'instance de son assurance, et revient en arrière

- **Contexte :** Koffi est DSI d'une compagnie d'assurance dont l'instance tourne sur ses serveurs.
- **Parcours :**
  1. Une nouvelle version arrive **dans l'espace d'essai** ; la recette automatique passe ; Koffi reçoit un
     message simple : ce qui change, quoi essayer, la date proposée (FR-17).
  2. Fatou et deux gestionnaires l'essaient sur leurs vrais dossiers pendant une semaine.
  3. Koffi **choisit la date** dans `prospera-app` (FR-36) ; la promotion se fait avec sauvegarde avant et
     contrôle de santé après.
  4. Deux jours plus tard, un état mensuel sort mal : Koffi **revient en arrière en un clic** ; la version
     est déclarée sans perte, et les sinistres saisis depuis la promotion sont toujours là (FR-18).
- **Moment gagné :** le correctif arrive la semaine suivante ; personne n'a perdu une saisie.
- **Cas d'échec :** la liaison internet de la compagnie tombe trois semaines ; rien ne s'arrête ; à J+7,
  Koffi et Money Vibes sont alertés ; la licence de la dernière échéance payée lui est arrivée **par
  e-mail** au paiement, et Koffi la dépose dans `prospera-app` (FR-14, FR-15, FR-22).

---

## 3. Vocabulaire

*Ces termes s'emploient tels quels dans tout le PRD et dans les documents qui en dérivent. Aucun synonyme.*

**Ce qu'on vend**
- **Organisation** : un client (assureur, IMF, distributeur, cabinet), ou Money Vibes elle-même.
- **Module** : ce qu'on installe ; un `code` au catalogue. Défini par le contrat de module. Le menu de
  `prospera-app`, les droits et les refus se raisonnent **toujours par code**.
- **Module commercial** : ce que le client lit sur la brochure et dans son menu (« Prise de commande »,
  « Relances & Recouvrement »). Il correspond à **un ou plusieurs codes** du catalogue (table de
  correspondance, FR-37).
- **Service** : ce qu'on déploie (un conteneur). Un service porte un ou plusieurs modules.
- **Pack** : un ensemble de **modules commerciaux** vendus ensemble pour un métier (« Terrain & Ventes »,
  « Finance & Recouvrement »…) ; **quatre par vertical**. « Bundle » et « pack » désignent la même chose
  (QA-1). C'est le mot du client et de la vente.
- **Add-on** : un module commercial vendu en complément d'une offre (ex. Réseau Freelance). Il se paie
  comme tout module.
- **Mode d'acquisition** : pour chaque élément de l'offre, **achat** (achat unique + maintenance) **ou**
  **abonnement** (mensuel), jamais les deux sur le même élément. Le profil du client (grand, moyen, petit)
  change le prix, jamais les modules.
- **Catalogue du vertical** : la plateforme complète, les packs, les modules à l'unité et les add-ons
  proposés à un vertical (assurance, distributeur, microfinance, cabinet). Le code l'appelle `VerticalPack`
  ; ce glossaire fait la correspondance. Il **n'ouvre rien** : la console le montre à l'ouverture d'une
  installation, avec l'offre du contrat préchargée dedans. Il remplace le « socle de vertical » de
  STORY-727 lot 7 (décision du PO, 2026-11-10).
- **Manifeste** : la fiche d'identité d'une version de module (contrat de module C1).
- **Dépendance dure** (`depends`) / **dépendance optionnelle** (`enrichiPar`) : contrat de module §3.

**Où ça tourne**
- **Instance** : un déploiement de la plateforme Prospera. Une instance a toujours **deux espaces**.
- **Plateforme Money Vibes** : l'instance hébergée sur les serveurs de Money Vibes ; elle sert plusieurs
  organisations (les distributeurs, les cabinets).
- **Instance sur site** : une instance hébergée sur les serveurs d'un client ; elle sert les organisations
  de ce client nommées dans sa licence (en général une seule : l'assureur, l'IMF).
- **Espace d'essai** : la partie d'une instance où l'on installe et l'on teste, avec les vrais dossiers du
  client, avant toute mise en service. Terme employé avec le client au lieu d'« environnement de test ».
- **Espace réel** : la partie d'une instance où travaillent les utilisateurs. Au lieu de « production ».
- **Console Money Vibes** : l'outil d'administration de Money Vibes. Sur une instance sur site, elle tourne
  **sur l'instance du client**.

**Ce qu'on fait à un module**
- **Octroi** : la première ouverture d'un module pour une organisation. **Tout octroi passe par le
  moteur** : installation dans l'espace d'essai, puis mise en service dans l'espace réel, comme la liste
  d'applications d'Odoo (décision du PO, 2026-11-10). Aucun autre chemin ne crée un droit (FR-4), sauf
  pour le module `instance`, posé à la naissance de l'organisation (chemin 0).
- **Installer** : rendre un module disponible pour une organisation **dans l'espace d'essai**.
- **Mettre en service** : rendre un module disponible **dans l'espace réel**, une fois ses conditions
  remplies : recette passée, et feu vert de la Reprise quand l'offre en comporte une pour ce sous-ensemble
  (FR-8). Installé ≠ en service. Le PRD Reprise dit « bascule » : c'est la mise en service.
- **Acquis, à installer** : un module que le contrat ou la licence donne, mais qui n'est pas encore
  installé. Il ne s'ouvre pas tant que le moteur ne l'a pas installé (FR-4).
- **Suspendre** : une **sanction décidée** par un opérateur Money Vibes nommé (litige, fraude, ou impayé
  que Money Vibes décide de sanctionner après la lecture seule). **Un impayé seul ne suspend jamais** : il
  suit FR-32 (décision du PO, 2026-11-10). Le module disparaît du menu et refuse tout, **sauf l'export**
  et les états réglementaires déclarés (FR-43) ; les données restent ; les modules qui en dépendent **continuent** (Q3) ; la levée rend l'état
  recalculé (§3.1).
- **Désinstaller** : un **choix du client**, fait avec Money Vibes. Refusé si d'autres modules en dépendent
  (FR-3) ; les données restent ; réinstaller retrouve tout (FR-39).
- **Effacer** : supprimer les données d'une organisation ; acte séparé, demandé, tracé, hors de ce PRD,
  **sauf** deux cas : l'effacement de l'essai d'un prospect qui n'a pas signé (FR-33), et la suppression
  des données d'un acheteur hébergé sur la plateforme qui a arrêté son abonnement d'hébergement, après sa
  lecture seule (FR-32).
- **Lecture seule** : un module qu'on consulte sans le modifier. Une seule règle (FR-43) : les lectures
  passent ; toute écriture est refusée, sauf les routes d'export et d'états réglementaires que le module
  déclare à son manifeste.
- **Réception définitive** : la signature, par le client, de la fin de l'installation d'un sous-ensemble de
  l'offre. Elle autorise la Reprise de données à supprimer les fichiers sources des lots de ce
  sous-ensemble.
- **Recette** : les tests qui valident une version ou une installation (automatiques, ou par l'accès
  encadré, FR-17).
- **Feu vert** : le fait publié par la Reprise de données quand un lot est réconcilié (écart nul). Il
  autorise la mise en service du sous-ensemble concerné (FR-8).
- **Bilan d'instance** : le bilan qui clôt le montage d'une instance sur site (FR-25). À ne pas confondre
  avec le **voyant de santé de l'instance** (FR-16), qui vit ensuite.
- **Dossier d'installation** : ce qui se rejoue de l'essai vers le réel : offre, tables de correspondance,
  rôles, zones, réglages, comptes à créer. Nommé, versionné, journalisé. **Aucune donnée métier** n'y
  figure (FR-8). Chaque élément a un propriétaire, qui l'importe (FR-42).
- **Plan d'installation** : la liste enregistrée des étapes d'une installation, d'une promotion ou d'un
  retour arrière ; il permet de reprendre après une coupure (FR-40).

**Ce qui relie l'instance à Money Vibes**
- **Connexion sortante** : la seule liaison permise ; c'est l'instance qui appelle Money Vibes, jamais
  l'inverse.
- **Licence** : un document **signé par Money Vibes** et **lié à une instance** (son identifiant ; refusé
  sur toute autre). Il liste les organisations, leurs modules et **deux droits**. Sur une instance sur
  site, c'est la source des droits.
  - **Droit d'utiliser** (par module) : **perpétuel** pour un élément acheté, une fois le prix payé ; **à
    échéance** pour un élément en abonnement, avec ses faits `echeanceLe` et `preavisJusquau` (§3.1).
  - **Droit aux mises à jour** : correctifs, nouvelles versions, nouveau modèle commun, support. Il suit la
    **maintenance**, a toujours une échéance, et se date **par instance** (FR-14).
- **Maintenance** : le contrat qui ouvre le droit aux mises à jour. À sa fin, l'instance passe en
  **version figée**, sans jamais être suspendue. Chaque version majeure a une **durée de maintenance
  publiée** (comme Odoo, FR-21).
- **Signal** : le message hebdomadaire de l'instance à Money Vibes (santé, version, licence).
- **Contact** : un échange **authentifié et daté par Money Vibes**, jamais déjà vu : signal, vérification
  quotidienne, ou fichier signé dont l'heure de référence est plus récente que la dernière vue (FR-22,
  NFR-11). Redéposer un fichier déjà vu n'est pas un contact.
- **Délai de silence** : 30 jours sans contact (comme Odoo). Au-delà, l'instance passe en **gel**. À ne pas
  confondre avec la **grâce de paiement** de `paiement-service` (STORY-281), un délai qu'un humain accorde
  sur une échéance impayée.
- **Gel** : l'état d'une instance sans contact depuis plus de 30 jours. Le travail quotidien continue, mais
  **plus rien ne change** (ni installation, ni mise à jour), sauf un correctif de sécurité critique apporté
  par fichier. Il se lève au premier contact.
- **Version figée** : l'état d'une instance dont la **maintenance a pris fin**. Le travail continue à vie,
  sur la dernière version ; les correctifs de sécurité critiques arrivent **tant que cette version majeure
  est dans sa durée de maintenance publiée** (FR-19, FR-21). Elle se lève en revenant à la maintenance.
- **Horloge scellée** : l'horloge interne de l'instance, protégée contre la modification et **jamais
  restaurée par une sauvegarde**. Elle ne recule jamais d'elle-même, n'avance pas sans borne, et fait
  tomber les échéances même hors ligne (FR-15).
- **Heure de référence** : l'heure signée par Money Vibes dans chaque réponse de contact et chaque fichier.
  Elle seule peut corriger l'horloge scellée (FR-15).
- **État de confiance** : l'horloge scellée, le plus haut numéro de licence vu par clé, l'heure de
  référence de la dernière licence acceptée, le registre des consentements et la tête du journal en ajout
  seul. Il vit hors des sauvegardes, n'est jamais restauré, et
  son empreinte est rapportée à Money Vibes à chaque contact (NFR-11).
- **Rappel** : l'avis envoyé 7 jours **avant** l'échéance du droit d'utiliser d'un élément en abonnement,
  si elle n'est pas payée. Le code de `paiement-service` l'appelle encore `PREAVIS` : il est renommé (§8.4).
- **Préavis** : les 30 jours qui **suivent** cette échéance ; tout fonctionne, avec un bandeau. Ensuite,
  **lecture seule** (FR-32).
- **Mise à jour depuis un fichier** : appliquer une licence ou un paquet signés apportés par e-mail, lien de
  téléchargement ou clé USB, sans que le serveur ait besoin d'internet.
- **Version** : un état de la plateforme et de ses modules. **Une seule ligne de version pour tous les
  clients.**
- **Version de plateforme** : un ensemble figé de versions de modules (`versionCode`), publié d'un bloc. (détail
  de la promotion : addendum §A-8).
- **Mise à jour** : le passage d'une instance à une nouvelle version. Elle arrive d'abord dans l'espace
  d'essai, puis est **promue** dans l'espace réel : à la date choisie par le DSI sur site, dans la fenêtre
  de Money Vibes sur la plateforme (FR-17).
- **Annonce** : l'avis, 7 jours avant, de la fenêtre de mise à jour de la plateforme (FR-17). À ne pas
  confondre avec le **préavis**, qui suit une échéance.
- **Interrupteur de changement** : un changement de comportement déclaré au manifeste et livré éteint. Sur
  la plateforme, l'administrateur d'une organisation l'allume quand il est prêt, et il s'allume seul à sa
  **date limite** ; sur site, il passe à sa position finale à la promotion (FR-17).
- **Retour arrière** : le retour à la version précédente pendant 7 jours, **sans perte**, grâce aux
  migrations rétrocompatibles (C12) ; sauf version déclarée `AVEC_PERTE`, permise sur site seulement
  (FR-18).
- **Correctif de sécurité** : une mise à jour au chemin rapide : 72 h, **hors vagues**, **sans migration**
  (FR-19). Il est **critique** quand son score CVSS vaut 9 ou plus, ou quand la faille est exploitée
  (décision du PO, 2026-11-10).
- **Incident** (sur une version) : un retour arrière demandé par un client, une anomalie grave ou bloquante
  imputée à la version, ou un contrôle de santé en échec après promotion (FR-20).
- **Vague** : un groupe d'instances qui reçoit une version en même temps ; la plateforme Money Vibes compte
  comme une instance. **Client pilote** : l'instance de la première vague (FR-20).

**Données et apprentissage**
- **Canal de données** : tout ce qui sort d'une instance vers Money Vibes, par niveau :
  **0** indicateurs (version, santé, licence, indicateurs IA agrégés) · **1** échantillon pseudonymisé
  approuvé à chaque export · **2** accès encadré (sur place, ou tunnel ouvert par le client) · **3** mise en
  commun consentie d'un jeu d'entraînement pseudonymisé.
- **Consentement** : l'accord d'une organisation pour **une** finalité et un niveau donnés ; révocable,
  journalisé. Sans lui, rien au-delà du niveau 0 ne sort, et rien n'est lu pour l'apprentissage.
- **Poste d'accès contrôlé** : le poste par lequel passe l'accès encadré par tunnel ; il enregistre la
  session et coupe le transfert de fichiers (FR-29).
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
- **Offre** : ce que le client a acheté, élément par élément : la **plateforme complète** du vertical, un
  ou plusieurs **packs**, des **modules à l'unité**, des **add-ons**, chacun avec son mode d'acquisition.
  Chaque module ajouté se paie.
- **Prospect** : une organisation qui essaie Prospera avant de signer, par une **offre d'essai** qui tient
  lieu de contrat dans l'espace d'essai seulement (FR-33).
- **Avis de fin d'essai** : l'avis envoyé 7 jours avant chaque fin d'un essai prospect (FR-33).
- **Certificat d'effacement** : le document remis au prospect qui n'a pas signé, quand ses données sont
  effacées (FR-33).
- **Bilan d'essai** / **bilan de mise en service** : le bilan d'installation dans l'espace d'essai, puis
  dans l'espace réel (FR-8).
- **Prérequis** : ce qu'un module exige du client pour fonctionner (clé d'accès PI-SPI, numéro WhatsApp
  vérifié, connecteur joignable…). Déclaré au manifeste, vérifié pendant l'installation.
- **Vérification** : un contrôle réel qu'un module exécute et dont il rend le résultat chiffré (données
  importées, comptes créés, message de test reçu). « Vérifié » ne veut jamais dire « pas d'erreur ».
- **Bilan d'installation** : l'écran, puis le PDF, qui donne pour chaque module de l'offre son voyant et
  ses vérifications.
- **Voyant** : 🟢 **vérifié** · 🟠 **en attente** (une dépendance ou un prérequis manque) · 🔴 **bloqué**
  (avec la raison et l'action à faire).
- **Bac à sable** : une copie du logiciel du client, distincte de son logiciel réel, où le connecteur de
  l'essai peut écrire (FR-9). **Liste blanche de test** : les destinations déclarées pour l'essai (numéros,
  adresses) vers lesquelles un envoi part réellement (FR-9).
- **État publié** : l'état, **calculé**, d'un module pour une organisation dans un espace (§3.1). C'est la
  seule chose que lisent les écrans et les gardes des modules (FR-34).
- **État du client** : **En installation** tant qu'aucun module de l'offre n'est en service ; **En service
  partiel** dès qu'un sous-ensemble de l'offre l'est (UJ-1 étape 4) ; **En service** quand toute l'offre
  et ses dépendances dures le sont. Seules les lignes de l'offre comptent (décisions du PO, 2026-11-10).

### 3.1 États et transitions

*Trois axes indépendants, puis **un seul état publié** par module, **calculé** : c'est lui, et lui seul,
que lisent `prospera-app`, l'app expert-comptable et les gardes des modules (FR-34, C2 amendée).*

**Axe 1 : l'instance et ses espaces.**
- **L'espace est une propriété du déploiement**, pas du module : l'espace d'essai et l'espace réel sont
  deux déploiements, chacun avec son adresse et ses droits. Un module installé dans l'essai n'a **aucun
  droit dans le réel** ; il n'apparaît donc **jamais au menu du réel** (décision du PO, 2026-11-10 : éviter
  l'incompréhension du client). `[ASSUMPTION : deux adresses distinctes par instance, sur site comme sur
  la plateforme]`
- Une organisation a **le même identifiant** dans les deux espaces ; c'est le moteur qui la crée dans
  chacun (FR-42).
- **État de l'instance** : `NORMAL` · `GEL` (plus de 30 jours sans contact, §3 ; levé au premier contact)
  · `VERSION_FIGEE` (maintenance échue, FR-32 ; levée par le retour à la maintenance). `GEL` et
  `VERSION_FIGEE` peuvent se cumuler. Ni l'un ni l'autre ne change l'état des modules : le travail
  quotidien continue ; seuls les changements (installation, mise à jour) sont bloqués. La plateforme Money
  Vibes n'est jamais en `GEL`, ni en `VERSION_FIGEE` : une plateforme partagée n'a qu'une version. Un
  acheteur qui y est hébergé suit donc la règle de FR-32 (abonnement d'hébergement et de maintenance
  obligatoire), y compris sur l'axe 3.

**Axe 2 : l'installation d'un module, pour une organisation, dans un espace.**

| État | Voyant | Entrée | Sortie |
|---|---|---|---|
| `NON_INSTALLE` | — | état initial | installation lancée (chemin 1 de FR-4) |
| `EN_INSTALLATION` | 🟠 ou 🔴 | installation, réinstallation ou rejeu lancés ; une dépendance, un prérequis ou une étape manque ; installation interrompue (FR-40) | toutes les vérifications passées |
| `INSTALLE` | 🟢 | vérifications passées (espace d'essai) ; **mise en service** (espace réel, FR-8) | désinstallation |
| `DESINSTALLE` | — | désinstallation (`REVOKED`, rien n'est supprimé, C9) | réinstallation → `EN_INSTALLATION` |

**Seul le moteur ouvre un module** (décision du PO, 2026-11-10) ; chaque transition est journalisée (détail : addendum §A-2).

**Axe 3 : le droit d'utiliser, pour une organisation et un module.** Ce n'est **pas** un automate : il se
**calcule** à chaque changement de fait et à chaque échéance, à partir de faits indépendants portés par le
droit (FR-34), sur l'horloge de référence (FR-15). Il ne garde aucun « état antérieur ».

Les faits : une sanction, l'échéance payée, la fin du préavis et les dates d'un essai (détail : addendum §A-2).

| Valeur | Quand (la première ligne qui s'applique) | Sortie |
|---|---|---|
| `SUSPENDU` | une sanction est en cours | levée de la sanction → valeur recalculée |
| `ESSAI_TERMINE{effacementLe}` | droit d'essai ; `finLe` passée, `effacementLe` à venir | signature → `ACTIF` ; `effacementLe` → organisation effacée (FR-33) |
| `ESSAI_PROSPECT{finLe}` | droit d'essai ; `finLe` à venir ; **espace d'essai seulement** | signature → `ACTIF` ; `finLe` → `ESSAI_TERMINE` |
| `LECTURE_SEULE` | `preavisJusquau` passée | paiement → `ACTIF` ; sur la plateforme, pour un élément acheté dont l'abonnement d'hébergement est arrêté : fin de la lecture seule → suppression de ses données (FR-32) |
| `PREAVIS{finLe}` | `echeanceLe` passée, `preavisJusquau` (= `finLe`) à venir | paiement → `ACTIF` ; `finLe` → `LECTURE_SEULE` |
| `ACTIF` | sinon | échéance, sanction |

Élément acheté, sur site et sur la plateforme ; impayé, qui ne produit jamais `SUSPENDU` (FR-32, FR-41) (détail : addendum §A-2).

**L'état publié** (un par organisation × module, dans l'espace où l'on se trouve ; calcul (détail : addendum §A-2)).

| État publié | Menu de `prospera-app` | Garde du module (C2 amendée) | Bandeau, et pour qui (FR-35) |
|---|---|---|---|
| `NON_INSTALLE` | caché ; URL saisie → écran « module non installé » | 403 `<MODULE>_NOT_ENTITLED` | — |
| `EN_INSTALLATION` | caché ; URL saisie → « module en cours d'installation » | 403, sauf l'identité de service du moteur sur les routes de vérification (FR-6), l'identité de service du moteur et celle de la Reprise de données sur les routes d'import déclarées pendant un rejeu (FR-42), et l'export (FR-43) | administrateurs : lien vers le bilan |
| `DESINSTALLE` | caché ; URL saisie → « module non installé » | 403, sauf l'export (FR-43) | — |
| `EN_SERVICE` | visible | ouvert | — |
| `ESSAI_PROSPECT{finLe}` | visible | ouvert | **tous** : compte à rebours |
| `ESSAI_TERMINE{effacementLe}` | caché ; URL saisie → « essai terminé, effacement le … » ; « Exporter » reste visible dans l'Administration | 403, sauf l'export | **tous** : « Votre essai est terminé ; vos données seront effacées le … » |
| `PREAVIS{finLe}` | visible | ouvert | **administrateurs et DG** : date de passage en lecture seule |
| `LECTURE_SEULE` | visible | lecture seule (FR-43) : écriture refusée `ABONNEMENT_EXPIRE`, sauf export et états déclarés | **tous** : « lecture seule », pour qu'on ne croie pas à une panne |
| `SUSPENDU` | **caché** ; URL saisie → « module suspendu, voir votre administrateur » | 403, aucune donnée, sauf l'export et les états réglementaires déclarés (FR-43) | **administrateurs et DG** : la raison et l'action |

Statut du droit au catalogue derrière chaque état publié (détail : addendum §A-2).

Un module suspendu est caché, pas grisé (validé par le PO, 2026-11-10).

**Combinaisons qui ne se devinent pas.**
- Ajouter un module à un client **En service** le fait passer **En service partiel**, jamais **En
  installation** ; les modules déjà en service ne bougent pas.
- `GEL` pendant une installation : les modules `EN_INSTALLATION` y restent ; « Réessayer » est refusé
  jusqu'à la levée du gel ; rien de ce qui est `EN_SERVICE` ne s'arrête.
- `GEL` pendant un `PREAVIS` : l'horloge du contrat continue (FR-15) ; le passage en `LECTURE_SEULE` se fait
  à sa date, hors ligne, sur l'horloge scellée ; le moteur de l'instance émet l'événement, sur l'heure que
  lui donne l'agent d'instance (FR-34 ; décision du PO, 2026-11-10).
- `VERSION_FIGEE` : aucun module ne s'ajoute sans revenir à la maintenance (un module neuf exige la
  version courante ; décision du PO, 2026-11-10).
- `SUSPENDU` d'un module : ni le voyant ni la visibilité des modules qui en dépendent ne changent (Q3) ;
  ils perdent seulement ce que le module suspendu leur apportait (emplacement vide, C4).
- Sanction levée après `preavisJusquau` : la valeur recalculée est `LECTURE_SEULE`, pas l'état d'avant la
  sanction.
- Un module `EN_SERVICE` dont un prérequis disparaît (clé PI-SPI révoquée, numéro WhatsApp banni) garde son
  état publié ; sa **santé** passe `DEGRADE`, sans fermeture automatique (FR-34).
- Un module 🟢 dans l'essai dont le rejeu échoue dans le réel n'y est pas mis en service : il y reste
  `EN_INSTALLATION`, avec le bilan de mise en service 🔴 (FR-8).

---

## 4. Fonctionnalités

### 4.A Activer : choisir, vérifier, installer, mettre en service

**Description.** Rachid ouvre la fiche du client dans la console Money Vibes et clique sur « Installer
Prospera Distributeur » (réalise UJ-2, UJ-4). La console montre le **catalogue du vertical** : la plateforme
complète, les packs (Terrain & Ventes, Finance & Recouvrement, Stock & Logistique, Croissance & Équipes),
les modules à l'unité et les add-ons (Réseau Freelance). L'**offre du contrat** y est préchargée ; Rachid
ajuste dans les limites du contrat. Exemple : Moussa a pris Terrain & Ventes (CRM, Terrain & Tournées,
Application mobile, Prise de commande), Relances & Recouvrement et Encaissements & PI-SPI ; la vente y a
ajouté Facturation, dont ces deux modules ont besoin.

**Tout octroi passe par ici** (décision du PO, 2026-11-10) : payer, renouveler ou déposer une licence ne
fait que prolonger ou rouvrir un module déjà installé (FR-4).

Les **dépendances** se règlent **au moment où l'on coche**, jamais au lancement : on ne peut pas lancer une
installation avec un module orphelin. Les **prérequis**, eux, ne se voient qu'à l'installation : un module
dont un prérequis manque passe en rouge, ceux qui en dépendent attendent en orange, et **le reste de
l'offre est utilisable tout de suite**. L'installation se termine sur le **bilan d'installation**, qui
montre ce qui a vraiment été vérifié. Le client passe **En service** quand toutes les lignes de son offre et
de leurs dépendances dures sont en service ; avant, il est **En installation** ou **En service partiel**
(§3).

**Exigences fonctionnelles**

#### FR-1 : Choisir l'offre du client
L'équipe de déploiement choisit, pour une organisation, les éléments de l'offre : la plateforme complète,
un ou plusieurs packs, des modules à l'unité, des add-ons. Elle peut ensuite ajouter ou retirer des modules
un par un, dans les limites du contrat (FR-12). Réalise UJ-2.

**Conséquences (testables) :**
- Choisir un pack coche tous ses modules ; le retirer décoche ceux qu'aucun autre choix ne retient. Chaque
  module garde la **liste de ses raisons** (pack, ajout un par un, dépendance de tel module) : il n'est
  décoché que lorsque cette liste est vide. Cas testé : Facturation, retenue à la fois par un pack et
  comme dépendance de Relances, reste cochée quand on retire le pack.
- Chaque élément porte le **mode d'acquisition** du contrat : achat (achat unique + maintenance) **ou**
  abonnement mensuel ; jamais les deux sur le même élément. Le profil du client (grand, moyen, petit) ne
  change que le prix : il n'entre pas dans le moteur.
- La sélection finale (éléments, ajouts, retraits), son auteur et sa date sont enregistrés.
- Un module ajouté hors pack est marqué comme tel dans la sélection et dans le bilan ; c'est un élément du
  contrat, qui se paie.

#### FR-2 : Ajouter les dépendances au moment du choix, avec leur raison
Quand un module coché a une dépendance dure non cochée, la console l'ajoute aussitôt et dit pourquoi.

**Conséquences (testables) :**
- Cocher Relances & Recouvrement sans Facturation ajoute Facturation et affiche : « ➕ Facturation
  ajoutée : Relances en a besoin pour connaître les créances. »
- **La raison vient du manifeste** : chaque dépendance dure y porte un libellé lisible par un humain.
- Annuler l'ajout d'une dépendance décoche aussi **tous** les modules qui l'ont demandée, après une
  confirmation qui les nomme (liste des raisons, FR-1).
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
**Tout octroi passe par le moteur** (décision du PO, 2026-11-10) : seul le chemin 1 **ouvre** un module de
l'offre ; le chemin 0 n'ouvre que le module `instance`, à la naissance de l'organisation. Les chemins 2 à 6
**prolongent ou rouvrent** un module déjà installé ; ils n'agissent que sur l'axe 3
(§3.1) et ne créent jamais de droit. Les chemins sont **nommés** ; il n'en existe pas d'autre :

| # | Chemin | Effet | Espace touché | Refus |
|---|---|---|---|---|
| 0 | Naissance de l'organisation (FR-42) | pose le module `instance` `INSTALLE` et `ACTIVE`, sans terme, et rien d'autre | chaque espace où l'organisation naît | aucun |
| 1 | Console Money Vibes : installation, réinstallation, offre d'essai, rejeu à la mise en service (FR-1, FR-8, FR-33, FR-39) | **ouvre** : axe 2, puis `ACTIVE` | essai, puis réel | `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE` |
| 2 | Échéance soldée d'un contrat (STORY-727 lot 2), y compris la première, à la signature d'un prospect | prolonge `echeanceLe` des modules installés (et retire l'offre d'essai de ceux d'un prospect) ; note les autres « acquis, à installer » | celui où le module est installé | aucun : écart nommé |
| 3 | Régularisation d'un impayé (`paiement.abonnement.regularise`) | prolonge l'échéance ; sort de `PREAVIS` ou de `LECTURE_SEULE` | idem | aucun : écart nommé |
| 4 | Pack modifié (lot 6) | ne touche que les **nouveaux** contrats ; les autres changent par avenant (FR-12) | aucun droit existant | — |
| 5 | Opérateur Money Vibes | pose ou lève une **sanction** ; prolonge une offre d'essai, une fois (FR-33) | celui de l'organisation | aucun |
| 6 | Licence déposée sur site (FR-14) | prolonge ou rouvre ; pose ou lève une sanction ; un module neuf de la licence devient « acquis, à installer » | essai et réel de l'instance | refusée entière si invalide (FR-14) |

Le **catalogue du vertical** (ex-socle de vertical, STORY-727 lot 7) n'est plus un chemin : il n'ouvre rien
(§3). Les chemins 2 à 6 sont des changements de **droits**, directs et journalisés, qui ne comptent pas
dans SM-3 (décision du PO, 2026-11-10). Tout changement de **code ou de schéma** passe par l'essai (FR-11).

**Conséquences (testables) :**
- Une demande d'installation à laquelle manque une dépendance dure est refusée par le serveur avec
  `MODULE_DEPENDANCE_MANQUANTE` (422) et la liste des modules manquants, **même si la console a été
  contournée**.
- Quand plusieurs refus s'appliquent, le serveur les **renvoie tous**, dans cet ordre :
  `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE`. Sur site, seul
  `MODULE_HORS_LICENCE` s'évalue : la licence est dérivée du contrat (FR-14).
- Un chemin 2 à 6 qui trouve un module jamais installé ne crée **aucun** droit : le module est noté
  « acquis, à installer » dans la console, et son état publié reste `NON_INSTALLE`. Test : solder
  l'échéance d'un contrat dont un module n'est pas installé ; aucun droit n'apparaît.
- Les chemins 2 et 3 sont des consommateurs d'événements : un refus n'y a personne à qui répondre. Il
  devient un **écart nommé**, journalisé, visible dans la supervision et au bilan du client.
- Le point de décision est le même sur la plateforme et sur site (détail : addendum §A-6).
- Le chemin 0 ne pose que le module `instance`. Test : une organisation neuve n'a aucun autre droit
  (SM-1).
- Les tests des chemins sont prouvés par mutation (détail : addendum §A-6).
- Un manifeste qui crée un cycle de dépendances est refusé **par le catalogue, à la publication** :
  `MANIFESTE_CYCLE` (422). (détail : addendum §A-6)

#### FR-5 : Vérifier les prérequis pendant l'installation, sans bloquer le reste
Chaque module déclare ses prérequis au manifeste. Pendant l'installation, un prérequis absent bloque ce
module et ceux qui en dépendent, et seulement eux.

**Conséquences (testables) :**
- Clé PI-SPI absente : « ✖ Encaissements & PI-SPI : clé d'accès PI-SPI absente. → Demander la clé à la
  banque du client, puis « Réessayer ». » Le voyant est 🔴, avec la raison et l'action.
- Les modules qui dépendent **durement** du module bloqué passent 🟠 **en attente** ; les autres
  s'installent. Un module qui n'en dépend qu'en option (`enrichiPar`) passe 🟢, avec un emplacement vide
  (C4).
- Cette règle vaut **à l'installation seulement** : en exploitation, la suspension d'un module ne ferme
  pas ses dépendants (Q3, §3.1).
- « Réessayer » ne rejoue que les vérifications en échec, et peut être relancé sans doubler ce qui a
  réussi (NFR-6).
- Un module en attente ou bloqué n'apparaît pas dans le menu des utilisateurs du client.

#### FR-6 : Des vérifications réelles, pas des « OK »
Chaque module installé exécute ses vérifications et en rend le résultat chiffré.

**Conséquences (testables) :**
- **Données importées** : le nombre d'objets repris par module (« 1 240 points de vente, 312 produits,
  9 commerciaux »), fourni par la Reprise de données, quelle que soit la source (Odoo ou fichiers).
- **Comptes et rôles** : chaque compte créé (DG, comptable, commercial) avec son rôle, et l'invitation
  envoyée.
- **Connexions testées** : message WhatsApp de test reçu, lien de paiement PI-SPI de test généré,
  synchronisation Odoo aller-retour (fournie par le module **Connecteurs**, QA-3).
- Une vérification qui n'a pas pu s'exécuter n'est jamais affichée comme réussie.
- Chaque vérification **déclare son critère** au manifeste : la valeur attendue, le seuil, la source. Un
  comptage à zéro n'est 🟢 que si zéro est attendu.
- Dans l'espace d'essai, un **message** intercepté (FR-9) vaut réussite : c'est la preuve que l'envoi
  serait parti. Une **synchronisation aller-retour** dont l'écriture est interceptée reste 🟠
  « aller-retour non vérifié » ; elle est vérifiée dans le réel à la mise en service.
- « Réessayer » ne renvoie jamais deux fois le même message : chaque vérification a sa clef
  d'idempotence (NFR-6).
- Les vérifications s'exécutent sous l'**identité de service du moteur** (détail : addendum §A-6). Aucun utilisateur n'y accède.

#### FR-7 : Le bilan d'installation et le passage « En service »
À la fin, la console affiche le bilan : une ligne par module, son voyant et ses vérifications.

**Conséquences (testables) :**
- Seules comptent les lignes **de l'offre et de ses dépendances dures** ; un module non acheté (Reprise,
  Connecteurs…) apparaît grisé « hors offre » et ne bloque rien (décision du PO, 2026-11-10).
- Sans Reprise de données dans l'offre, le bilan porte un **avertissement à lire**, non bloquant :
  « Aucune reprise prévue : l'historique ne sera pas dans Prospera. » Sa lecture est tracée.
- Le client est **En installation**, **En service partiel** ou **En service** selon le §3 ; la mise en
  service peut se faire **par sous-ensemble de l'offre** (UJ-1 étape 4) et le bilan sert de liste
  des choses à finir.
- « Envoyer le bilan au client » envoie le PDF par e-mail au dirigeant du client ; l'envoi est
  journalisé.
- Le bilan est conservé : on peut le rouvrir et voir qui a installé quoi, quand, et avec quels résultats.

#### FR-8 : La répétition générale, puis la mise en service
Toute installation se joue d'abord **dans l'espace d'essai**, puis est **rejouée** dans l'espace réel.
Réalise UJ-1, UJ-2, UJ-3.

**Conséquences (testables) :**
- Dans l'espace d'essai : offre installée, reprise de données, comptes, connecteurs, puis **bilan d'essai**.
- Une **date de mise en service** est fixée avec le client, pour toute l'offre ou pour **un sous-ensemble**
  (décision du PO, 2026-11-10).
- Le jour venu, le **dossier d'installation** (§3) est rejoué dans l'espace réel, avec une reprise
  **fraîche**, et **vers la même version** que l'essai ; sinon, refus `DOSSIER_VERSION_DIFFERENTE` (409).
  C'est le **seul** flux de l'essai vers le réel (NFR-3) : aucune donnée métier de l'essai n'est copiée. La
  naissance de l'organisation dans le réel vient de la console, pas de l'essai (FR-42, NFR-3).
  Chaque élément du dossier est importé par son propriétaire (FR-42).
- La mise en service d'un sous-ensemble est **refusée** tant que la Reprise de données n'a pas donné son
  **feu vert** sur le lot rejoué dans le réel, **quand l'offre comporte une Reprise et que ce sous-ensemble a
  un lot de reprise** : `MISE_EN_SERVICE_SANS_FEU_VERT` (409). Sans lot de reprise, le sous-ensemble se met
  en service sans feu vert (FR-11). La ligne Reprise du bilan ne passe 🟢 qu'à ce feu vert (PRD Reprise).
- Si une étape du rejeu échoue, le sous-ensemble n'est pas mis en service : ses modules restent
  `EN_INSTALLATION` dans le réel, le bilan de mise en service est 🔴 avec l'étape en cause, et rien n'est
  ouvert à moitié. « Reprendre » continue le plan (FR-40).
- Le **bilan de mise en service** est distinct du bilan d'essai ; seul le premier compte pour l'état du
  client (FR-7).
- La **réception définitive** (§3) est enregistrée par sous-ensemble ; elle est publiée pour la Reprise de
  données, qui libère alors les lots de ce sous-ensemble.

#### FR-9 : Un espace d'essai qu'on ne peut pas confondre avec le réel
**Conséquences (testables) :**
- L'espace d'essai porte en permanence un **bandeau jaune** (« ESPACE D'ESSAI : rien de ce que vous faites
  ici n'est réel »), une couleur différente et un **titre d'onglet différent**.
- **Aucune sortie réelle ne part de l'espace d'essai.** La garde fonctionne en **liste blanche** : une
  sortie (SMS, WhatsApp, e-mail, lien de paiement, écriture vers un système tiers) ne part que vers une
  destination **déclarée pour l'essai** (bac à sable vérifié, liste blanche de test) ; tout le reste est
  intercepté et reste consultable dans un journal.
- **Messages d'identité** : l'invitation et le code de connexion d'un membre de l'essai partent vers sa
  vraie adresse. C'est la seule exception, nommée et journalisée ; sans elle, le prospect en autonomie ne
  pourrait pas se connecter (FR-33).
- **Connecteurs** (décision du PO, 2026-11-10), dans cet ordre :
  1. un **bac à sable** du logiciel du client est déclaré et vérifié : le connecteur de l'essai écrit
     dedans (c'est le défaut) ;
  2. pas de bac à sable : les écritures sont **interceptées** ;
  3. le client peut **forcer l'interception** même s'il a un bac à sable ;
  4. le logiciel réel, **jamais** : refus nommé `ECRITURE_REELLE_DEPUIS_ESSAI`.
- Un bac à sable ne reçoit les écritures de l'essai qu'une fois **vérifié** (détail : addendum §A-7).
- L'espace d'essai n'a **jamais d'identifiant d'écriture** du réel. Lire le vrai logiciel du client reste permis (détail : addendum §A-7).
- Le serveur refuse toute destination déclarée pour l'espace réel. L'interdit est vérifié côté serveur, quel
  que soit l'écran. Le PRD Connecteurs **doit** reprendre ces règles (§8.4).

#### FR-10 : Un espace d'essai qui ressemble au réel
**Conséquences (testables) :**
- L'espace d'essai se **rafraîchit depuis l'espace réel** à la demande, et obligatoirement avant qu'une
  organisation n'essaie une version majeure.
- La copie reste **sur le même hébergement** et **cloisonnée par organisation**.
- Le rafraîchissement se fait **par organisation** : il ne touche jamais l'essai d'une autre organisation
  ni un essai prospect, et il est refusé pendant une répétition générale **de cette organisation**. Sur la
  plateforme, une organisation ne bloque donc jamais la majeure des autres.
- Il s'appuie sur la même identité d'organisation dans les deux espaces (FR-42) ; chaque module importe sa
  part (C13).
- Les données copiées gardent les **règles d'accès du réel** : personne ne voit dans l'essai ce qu'il ne
  voit pas dans le réel.
- Un rafraîchissement n'écrit jamais de données personnelles réelles dans le **bac à sable** du client sans
  son accord écrit ; sans accord, les champs personnels sont masqués avant (même liste qu'au niveau 1,
  FR-28).
- Un rafraîchissement ne modifie jamais l'espace réel, et les envois restent interceptés (FR-9).

#### FR-11 : Un seul chemin pour tout changement
Premier module, module ajouté plus tard, mise à jour de version : **toujours** essai, bilan, puis passage
dans le réel (mise en service pour un module, promotion pour une version).

**Conséquences (testables) :**
- Il n'existe aucune commande qui installe ou met à jour **du code** directement dans l'espace réel. Les
  changements de **droits** des chemins 2 à 6 de FR-4 sont les seules exceptions.
- Un module **sans reprise de données** peut être mis en service le jour même de son installation en essai.

#### FR-12 : Le contrat fait foi
L'offre installée doit **concorder avec le contrat ou l'abonnement** du client (vente directe aux
institutions).

**Conséquences (testables) :**
- À l'ouverture de l'installation, la console **précharge l'offre** depuis le contrat du client
  (contrat de `paiement-service`, STORY-727), dans le catalogue du vertical ; Rachid ajuste dans ses limites.
- Installer un module qu'aucun élément du contrat ne donne est refusé : `MODULE_NON_SOUSCRIT` (422). Le
  calcul passe par la table de FR-37 : élément du contrat → codes.
- **La vente résout les dépendances comme la console** (FR-2) : un contrat ne peut pas être conclu sans les
  dépendances dures de ses modules. FR-2 et FR-12 ne peuvent donc pas se contredire.
- Un module sans manifeste au catalogue n'est pas installable (FR-37) et ne se vend pas : la vente le
  refuse (décision du PO, 2026-11-10).
- Un module ajouté au contrat est **acquis, à installer** : il ne s'ouvre que par une installation (chemin 1
  de FR-4). Sur site, il arrive dans la nouvelle licence, **dérivée automatiquement du contrat** (FR-14), au
  contact suivant.
- Une version **majeure** qui ajoute une dépendance dure à un module la **fournit sans facturation** : un
  avenant automatique l'ajoute au contrat de chaque client concerné, avant la mise à jour, et il est
  journalisé (décision du PO, 2026-11-10). Le plan de la mise à jour l'installe et la met en service
  (FR-17).
- La modification d'un pack ne s'applique qu'aux **nouveaux contrats** ; un contrat en cours ne change que
  par avenant (décision du PO, 2026-11-10).

**Exception :** l'essai avant signature (FR-33), où une **offre d'essai** tient lieu de contrat, dans
l'espace d'essai seulement.

**Hors périmètre :** la place de marché, où la sélection du client ferait foi (plus tard).

#### FR-13 : Le même geste sur la plateforme Money Vibes et sur site
**Conséquences (testables) :**
- La console, les voyants, le bilan, le parcours de l'impayé (FR-41) et les refus sont **identiques** pour
  un distributeur hébergé chez Money Vibes et pour un assureur sur ses serveurs ; seule différence de
  refus, sur site seul `MODULE_HORS_LICENCE` s'évalue (FR-4). **La livraison des mises à jour, elle,
  diffère** (FR-17).
- Sur une instance sur site, la console tourne **sur l'instance** et les droits viennent de la **licence**
  (FR-14).

#### FR-33 : L'essai avant signature (ajouté le 2026-11-10)
Décision du PO : un **prospect** distributeur peut charger **ses propres données** dans l'espace d'essai et
tester **sans Money Vibes**, avant de décider de conclure. C'est pour lui que l'import en autonomie doit être
prêt en février (PRD Reprise de données, FR-19).

**Conséquences (testables) :**
- Une **offre d'essai** ouvre au prospect, **dans l'espace d'essai seulement**, les modules de **l'offre
  que le commercial lui a proposée**, pas la plateforme complète ; elle tient lieu de contrat pour FR-12.
  (détail : addendum §A-2)
- L'essai dure **30 jours**, prolongeable **une fois** par Money Vibes, **avant sa fin** : **60 jours au
  maximum**. À son terme, le prospect passe en `ESSAI_TERMINE` (§3.1) : ses modules se ferment, l'export
  reste ouvert (FR-43), rien n'est effacé immédiatement.
- Le prospect n'a **aucun accès à l'espace réel** ; son organisation n'y existe pas avant sa signature
  (FR-42) ; aucun envoi réel ne part, sauf ses messages d'identité (FR-9).
- **Il utilise l'IA déjà présente** : le modèle commun fonctionne pour lui comme pour un client.
  **L'IA s'ajuste aussi sur ses propres données** : sa calibration locale se calcule dans l'espace d'essai.
  C'est un argument de vente (décision du PO, 2026-11-10).
- **S'il signe**, son organisation est créée dans l'espace réel avec le même identifiant (FR-42) ; il garde
  son espace d'essai et ses réglages : ils forment son **dossier d'installation** (§3), rejoué dans
  l'espace réel avec une reprise **refaite à neuf** ; sa calibration est **recalculée** sur cette reprise.
  Son essai **est** la répétition générale (FR-8).
- **S'il ne signe pas**, ses données sont **effacées**. En ouvrant l'essai, il accepte cet effacement :
  c'est une **exception écrite à Q4** du contrat de module (décision du PO, 2026-11-10).
- **Chronologie** : J0 ouverture → J+30 fin de l'essai (J+60 s'il est prolongé) : `ESSAI_TERMINE` →
  **30 jours** pour exporter ou signer → effacement → **certificat d'effacement**. Un **avis de fin
  d'essai** part 7 jours avant chaque fin (fin d'essai, fin prolongée, effacement), à l'administrateur du
  prospect et à son commercial Money Vibes. Une signature pendant `ESSAI_TERMINE` rouvre l'essai sans
  perte.
- Les échéances de l'essai se lisent sur l'horloge de Money Vibes, qui héberge l'essai (FR-15).
- **Ce qui est effacé** : données de chaque module, copies chez les modules voisins, calibration. Chaque
  module exécute l'effacement de ses propres données (C13), la Reprise de données comprise (fichiers
  sources, tables de correspondance). Les journaux nominatifs sont **pseudonymisés**, pas supprimés : le
  journal reste en ajout seul (NFR-4).
- Le **certificat d'effacement** est remis à l'effacement ; il dit la date à laquelle la dernière
  sauvegarde qui contient encore ces données expire (NFR-7).
- Ses données restent **cloisonnées** et ne **sortent jamais** vers l'IA commune sans son consentement
  (partie C) : la règle limite ce qui sort, pas ce qu'il utilise.

#### FR-34 : Ce que le moteur publie pour les écrans et les gardes (ajouté le 2026-11-10)
La coque `prospera-app`, l'app expert-comptable (cabinet) et la garde de chaque module construisent leur
comportement à partir d'**un seul état publié**, fourni par le moteur. Aucun ne recalcule un état à partir
de dates ou de statuts bruts, ni ne lit l'horloge de son propre conteneur.

**Conséquences (testables) :**
- **Deux canaux, un seul contenu** : une lecture par organisation, et un événement à chaque changement de
  l'état publié d'un module (détail : addendum §A-2). La lecture exige d'être membre authentifié de l'organisation ; les
  droits déclarés et la santé ne sont rendus qu'aux administrateurs (FR-35).
- L'état publié est **calculé** (détail : addendum §A-2).
- **Les transitions dues au temps émettent un événement** : début et fin du préavis, fin d'essai,
  effacement, gel. Elles tombent à l'heure dite, sur l'horloge de référence, et celles qu'un arrêt a fait manquer sont
  émises au redémarrage (détail : addendum §A-1). Les gardes des modules ne calculent **jamais** une
  échéance sur l'horloge de leur conteneur.
- Une lecture rend l'instance, chaque module connu du catalogue (le module `instance` compris, toujours
  `EN_SERVICE`), l'utilisateur courant et l'accueil de l'organisation (détail : addendum §A-2).
- `PREAVIS` et `ESSAI_PROSPECT` ne reposent jamais sur une « échéance repoussée » (détail : addendum §A-2).
- Une valeur d'état inconnue de la coque se lit `NON_INSTALLE` (on ferme, on n'ouvre pas).
- Un changement d'état est visible par la coque **en moins d'une minute**, et toujours à la connexion.
  `[ASSUMPTION : délai]`
- **La santé ne ferme rien** : un module `DEGRADE` reste ouvert ; un bandeau le dit aux administrateurs, et
  sa ligne passe 🔴 dans la supervision de Money Vibes (FR-16).
- **Le menu et la garde ne se contredisent jamais** : un test en matrice vérifie, pour chacun des neuf
  états publiés, que la visibilité au menu (§3.1) et la réponse de la garde du module (C2) concordent. (détail : addendum §A-2)
- Dans l'espace d'essai, un module `INSTALLE` (🟢) se publie `EN_SERVICE` **pour cet espace seulement** ;
  le même module se publie `NON_INSTALLE` dans l'espace réel tant qu'il n'y est pas mis en service.
- Sur site, la lecture rend la même forme (détail : addendum §A-2).

#### FR-35 : Les droits de tenant suivent l'installation (ajouté le 2026-11-10)
**Conséquences (testables) :**
- Chaque module déclare ses droits de tenant dans son manifeste, sous la forme `<code>:<objet>:<action>`
  (contrat de module C7). (détail : addendum §A-5)
- L'administrateur du client attribue ces droits lui-même, par des rôles, **sans déploiement** (socle de
  STORY-166 et STORY-167, déjà sur `dev`).
- **Droits effectifs d'un membre = droits attribués ∩ droits des modules ouverts** (état publié
  `EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS` ou `LECTURE_SEULE`). (détail : addendum §A-5) En `LECTURE_SEULE`, les droits restent effectifs ;
  c'est la garde qui refuse les écritures (FR-43).
- Le moteur est enregistré au catalogue comme le module **`instance`**. Il est posé à la naissance de toute organisation (chemin 0 de FR-4) ; il est sans terme, non suspendable
  et jamais vendu (détail : addendum §A-5).
- Les droits `instance:*` sont **hors intersection** : ils restent effectifs quel que soit l'état des
  autres modules et de l'instance. Le DSI peut donc **déposer une licence** même quand tout est en lecture
  seule, suspendu ou gelé ; l'export reste toujours possible.
- Le moteur déclare ses droits `instance:*` ; sur la plateforme, l'écran des rôles ne propose pas ceux qui
  n'y ont pas d'objet (détail : addendum §A-5).
- **Le droit de consentir** (`instance:consentement:donner`) ne s'attribue que **par le DG**, à lui-même ou
  à une personne qu'il désigne par écrit ; la référence de l'écrit est rangée au registre (FR-27). Un
  administrateur qui tente de l'attribuer reçoit `CONSENTEMENT_RESERVE_AU_DG` (403).
- **Chaque bandeau a un droit** : « administrateurs » désigne les détenteurs de `instance:bilan:consulter` ;
  « DG » désigne le dirigeant enregistré au registre (FR-27).
- L'écran des rôles de `prospera-app` ne **propose** que les droits des modules ouverts et ceux
  d'`instance`. Un droit attribué pour un module désinstallé reste enregistré, n'ouvre rien, et revient tel
  quel à la réinstallation (C9).
- STORY-365 est **requalifiée** (détail : addendum §A-9).

#### FR-36 : Trois lieux d'écrans (ajouté le 2026-11-10, décision du PO)
Les écrans du **client** (son DSI, son DG, ses administrateurs) sont dans **`prospera-app`** ; pour le
**cabinet**, dans l'**app expert-comptable** (décision du PO, 2026-11-10). Les écrans de **Money Vibes**
sont dans la **console Money Vibes**. Aucun utilisateur d'un client n'a besoin d'un rôle plateforme.

**Conséquences (testables) :**
- **Console Money Vibes** (droits plateforme) : offre, installation, modules « acquis, à installer »,
  bilans, supervision des instances, licences, sanctions, création d'une offre d'essai prospect, lecture du
  registre des consentements.
- **`prospera-app`, « Administration »** (droits `instance:*`, FR-35) : voir les mises à jour, essayer,
  choisir la date, revenir en arrière ; mettre à jour depuis un fichier ; ouvrir le tunnel de support ;
  donner ou retirer un consentement (DG) ; exporter ses données ; consulter le bilan de son installation ;
  rôles et droits ; pour le prospect, l'import en autonomie, le compte à rebours de l'essai et l'export
  pendant `ESSAI_TERMINE`.
- **App expert-comptable** : les mêmes écrans d'Administration pour le cabinet, lus sur le même état publié
  (FR-34).
- Chaque écran exige un droit nommé ; chaque bandeau a un droit (FR-35).
- Sur une instance sur site, la console Money Vibes tourne sur l'instance ; ses comptes n'ont aucun accès
  aux écrans du client, et ils sont **fermés par défaut** (FR-23).

#### FR-37 : De l'offre au menu (ajouté le 2026-11-10)
**Conséquences (testables) :**
- Une **table de correspondance** unique, tenue au catalogue : élément du contrat (plateforme complète,
  pack, module à l'unité, add-on) → module commercial → codes du catalogue → dossier d'écran
  (`prospera-app`, ou app expert-comptable pour le cabinet) → libellé de menu.
- Chaque vertical (assurance, distributeur, microfinance, cabinet) a son **catalogue** : sa plateforme
  complète, ses packs (quatre par vertical), ses modules à l'unité, ses add-ons (ex. Réseau Freelance). Le
  contrat nomme ses éléments par les clés de cette table ; `MODULE_NON_SOUSCRIT` (FR-12) se calcule sur les
  codes qu'ils donnent.
- Chaque élément porte un **mode d'acquisition**, achat ou abonnement, jamais les deux (§3) ; la licence en
  tire le droit d'utiliser de ses modules (FR-14). Le profil du client ne change que le prix : la table ne
  le connaît pas.
- L'offre (FR-1) se choisit en éléments ; elle s'**installe** en codes. Le menu se construit **par code** ;
  son libellé est celui du module commercial.
- Un module commercial dont un code n'existe pas encore au catalogue est **visible dans l'offre, ni
  installable ni vendable** (FR-12), avec la raison ; il ne fait jamais échouer l'installation du reste.
- Le catalogue du vertical (`VerticalPack`) n'ouvre rien et n'est jamais présenté comme un pack au client.

#### FR-38 : Publier le manifeste d'une version (ajouté le 2026-11-10)
Chaque version de module publie son manifeste au catalogue (C1, Q1) ; le moteur ne connaît un module que
par lui.

**Conséquences (testables) :**
- Le manifeste porte tout ce que le moteur lit d'un module (détail : addendum §A-6).
- La copie au catalogue est comparée à la source du dépôt par une garde (Q1).
- Le catalogue refuse, à la publication, un manifeste qui crée un cycle (`MANIFESTE_CYCLE`), et une
  **version mineure qui ajoute une dépendance dure** (`MANIFESTE_DEPENDANCE_MINEURE`) : une nouvelle
  dépendance n'arrive qu'avec une majeure, et elle est fournie sans facturation (FR-12).
- Chaque module tient les obligations de la clause **C13** (« installable sous contrôle ») : déclarer ses
  prérequis et ses vérifications, et les laisser passer sous l'identité de service du moteur (FR-6) ;
  rendre sa santé ; lire l'état publié poussé (FR-34) ; déclarer ses routes autorisées en lecture seule
  (FR-43) ; intercepter ses sorties dans l'essai (FR-9) ; **exporter, importer et effacer** les données
  d'une organisation, et importer sa part d'un dossier d'installation (FR-42) ; donner une clef
  d'idempotence à chaque vérification (NFR-6).

#### FR-39 : Désinstaller et réinstaller (ajouté le 2026-11-10)
**Conséquences (testables) :**
- Désinstaller ne supprime rien : ni les données du module, ni la calibration, ni les copies qu'en gardent
  ses voisins (read-models). Ces copies restent **stockées et masquées** : les voisins affichent
  l'emplacement vide (C4) et les retrouvent à la réinstallation. La durée de conservation relève de la
  politique d'effacement (Q4).
- Les données d'un module désinstallé restent **exportables** par la route d'export (FR-43), sur site comme
  sur la plateforme.
- Désinstaller dans l'espace réel ne touche pas l'espace d'essai, et inversement.
- Réinstaller passe par le chemin 1 de FR-4 : lui seul rouvre un `REVOKED`. Après une ou plusieurs versions
  majeures, il rejoue les migrations manquées ; si l'une d'elles ne le permet pas, la réinstallation est
  refusée avec un code nommé, jamais faite à moitié.

#### FR-40 : Une installation interrompue reprend là où elle s'est arrêtée (ajouté le 2026-11-10)
**Conséquences (testables) :**
- Une installation est un **plan d'installation** enregistré, étape par étape. Après une coupure
  (électricité, réseau), ses modules restent `EN_INSTALLATION` ; le bilan dit « interrompue à l'étape X »
  et « Reprendre » continue sans refaire ni doubler ce qui est fait (NFR-6).
- Une **promotion** interrompue déclenche le retour arrière automatique (FR-17), sauf pour une version
  `AVEC_PERTE` : l'automatisme s'arrête et alerte le DSI et Money Vibes ; seul le DSI décide de la
  restauration (FR-18).
- Un **retour arrière** est lui aussi un plan enregistré : interrompu, il reprend là où il s'est arrêté ;
  son avancement est visible dans la supervision et dans `prospera-app`.
- Un test de coupure (arrêt brutal à une étape tirée au hasard) fait partie de la recette du moteur.

#### FR-42 : Une organisation dans deux espaces (ajouté le 2026-11-10)
Une organisation existe dans l'espace d'essai et dans l'espace réel de son instance avec **la même
identité** ; c'est le moteur qui la fait naître.

**Conséquences (testables) :**
- **Naissance** : le moteur crée l'organisation, avec un identifiant unique (`organisationId`), dans chaque
  espace où elle doit exister. Un client naît dans les deux espaces à l'ouverture de son installation ; un
  prospect naît dans l'espace d'essai seulement. Aucun autre service ne crée une organisation cliente. (détail : addendum §A-7)
- À sa naissance, l'organisation reçoit le module `instance` (FR-35) par le chemin 0 de FR-4, et **rien
  d'autre** : aucun module ne s'ouvre sans installation (FR-4).
- La naissance se fait **sur ordre de la console**, jamais par une lecture de l'essai : c'est la 3ᵉ
  exception de NFR-3.
- **Signature d'un prospect** : le moteur crée l'organisation dans l'espace réel **avec le même
  identifiant** ; rien ne s'y ouvre avant le rejeu du dossier d'installation et la mise en service (FR-8).
- **Rejeu** : chaque élément du dossier d'installation a un **propriétaire**, qui l'importe (détail : addendum §A-7). Les comptes de l'essai sont recréés dans
  le réel avec le même identifiant de membre ; leurs invitations partent à la mise en service. Rejoué deux
  fois, le dossier ne crée rien de plus (NFR-6).
- **Importer pendant `EN_INSTALLATION`** (décision du PO, 2026-11-11) : les modules du réel sont encore
  `EN_INSTALLATION` pendant le rejeu. Leurs **routes d'import déclarées au manifeste** (C13) laissent donc
  passer l'identité de service du moteur et celle de la Reprise de données, qui livre ses lots aux modules
  cibles (PRD Reprise) ; aucun utilisateur n'y accède, et toutes les autres routes restent fermées (§3.1).
- **Rafraîchissement** (FR-10) : il s'appuie sur la même identité ; aucune table de correspondance
  d'identifiants n'est nécessaire.
- Un membre présent dans les deux espaces passe de l'un à l'autre par un lien de la coque ; chaque espace
  garde son adresse et ses droits (§3.1). `[ASSUMPTION]`

#### FR-43 : La lecture seule et l'export, une seule règle (ajouté le 2026-11-10)
La lecture seule a **une seule définition**, la même pour la coque, la garde des modules et le test en
matrice de FR-34.

**Conséquences (testables) :**
- En `LECTURE_SEULE`, la garde de chaque module laisse passer les lectures (`GET`, `HEAD`, `OPTIONS`) et
  refuse toute écriture avec `ABONNEMENT_EXPIRE` (403), comme STORY-727 lot 4, **sauf** les routes que le
  module déclare à son manifeste comme autorisées en lecture seule : export et production des états
  réglementaires (BCEAO, SYSCOHADA) (C13).
- Saisir, encaisser, envoyer et synchroniser **vers** le logiciel du client sont des écritures : fermés.
  Une synchronisation **entrante** (depuis un logiciel qui reste la référence, UJ-3) continue, et l'écran
  dit sa fraîcheur.
- **L'export passe toujours** : chaque module expose une route d'export par organisation (C13), exemptée de
  la garde et réservée au détenteur de `instance:donnees:exporter`. Elle est ouverte partout où le module
  peut garder des données de l'organisation, réinstallation comprise ; un seul attendu par état publié :

  | État publié | Export |
  |---|---|
  | `NON_INSTALLE` | refusé : 403 `<MODULE>_NOT_ENTITLED` (aucune donnée) |
  | `EN_INSTALLATION` | ouvert : rend ce que le module garde (vide pour une première installation, tout pour une réinstallation) |
  | `DESINSTALLE` | ouvert |
  | `EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS`, `LECTURE_SEULE` | ouvert |
  | `ESSAI_TERMINE` | ouvert, jusqu'à l'effacement (FR-33) |
  | `SUSPENDU` | ouvert |

- L'export se fait dans un format ouvert (CSV et JSON), module par module.
- En `SUSPENDU`, l'export et les états réglementaires déclarés restent ouverts au détenteur de
  `instance:donnees:exporter` : une sanction commerciale ne crée pas de manquement réglementaire chez le
  client.
- Le test en matrice de FR-34 a **un seul attendu** par état publié et par sorte de route (lecture,
  écriture, export, état réglementaire).

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
arrière automatique en cas d'échec, sauf pour une version déclarée avec perte (FR-18). Pour un distributeur, tout cela se passe sur les serveurs de Money
Vibes, avec les mêmes étapes, sauf la date : Money Vibes fixe la fenêtre, et chaque organisation allume
ses interrupteurs de changement quand elle est prête (FR-17).

#### FR-14 : La licence signée
**Conséquences (testables) :**
- Money Vibes émet pour chaque instance sur site une **licence signée, liée à l'instance** : elle porte
  l'identifiant de l'instance et est refusée sur toute autre (`LICENCE_AUTRE_INSTANCE`). Elle liste les
  organisations, leurs modules et, pour chaque module, son droit d'utiliser : `perpétuel`, ou ses faits de
  l'axe 3, `echeanceLe` et `preavisJusquau` (§3.1) ; la
  **maintenance** a une seule date pour l'instance, `miseAJour: jusqu'au <date>` (décision du PO,
  2026-11-10). L'instance vérifie la signature **hors ligne**.
- Le droit d'utiliser suit le mode d'acquisition de l'élément (§3) : **perpétuel** pour un élément acheté,
  une fois le prix entièrement payé ; **à échéance** pour un élément en abonnement.
- Quand les éléments achetés d'une instance ont des échéances de maintenance différentes, la vente les
  aligne au prorata ; la licence porte la plus proche.
- Une licence altérée, mal signée ou liée à une autre instance est refusée, et l'instance garde la
  précédente.
- Un module absent de la licence ne s'installe pas : `MODULE_HORS_LICENCE` (422). Un module que la licence
  ajoute est « acquis, à installer » : il ne s'ouvre que par une installation (FR-4).
- Une sanction (`SUSPENDU`) ou un ajout de module arrive par une **nouvelle licence**, au contact suivant.
- La licence est **dérivée automatiquement du contrat** : le contrat fait foi sur la plateforme, la
  licence sur site, et une modification du contrat produit la nouvelle licence sans geste manuel.
- **Licence d'un abonné** (décision du PO, 2026-11-10) : elle vaut jusqu'à l'**échéance payée + 30 jours**
  de marge, c'est-à-dire la fin du préavis : sa validité vaut le plus tardif des `preavisJusquau` de ses
  modules en abonnement. Elle ne touche **jamais** un module perpétuel : une instance mixte (achat et
  abonnement) garde ses modules achetés quand la licence expire. À chaque paiement, la licence suivante est **envoyée
  automatiquement par e-mail** au DSI et reste **téléchargeable par un lien sécurisé à durée limitée** ;
  l'instance la reçoit aussi d'elle-même au contact suivant.
- Une licence plus ancienne que la dernière acceptée est refusée, même authentique : `LICENCE_ANTERIEURE`.
  Redéposer la licence d'avant une sanction ne lève donc rien (détail : addendum §A-3).
- L'instance refuse aussi, **toutes clés confondues**, une licence dont l'heure de référence signée est
  antérieure à celle de la dernière licence acceptée : `LICENCE_ANTERIEURE`. (détail : addendum §A-3) Test : une licence signée par l'ancienne clé, reçue
  par e-mail et jamais déposée, est refusée après une sanction émise sous la nouvelle clé.
- Chaque licence nomme la clé qui l'a signée ; la gestion des clés suit NFR-8. (détail : addendum §A-3)

#### FR-41 : Sanctionner à distance une instance sur site (ajouté le 2026-11-10, décision du PO)
Money Vibes doit pouvoir agir sur une instance sur site dont le client ne respecte pas ses délais de
paiement, **même si le client coupe internet**.

**Conséquences (testables) :**
- **Un seul parcours de l'impayé, sur site comme sur la plateforme** (décision du PO, 2026-11-10) : rappel
  à J-7 si l'échéance n'est pas payée → échéance → `PREAVIS` pendant 30 jours → `LECTURE_SEULE` (FR-32).
  Un impayé ne produit jamais `SUSPENDU` de lui-même ; la suspension reste une sanction décidée (§3).
- Le parcours suit l'échéance du **droit d'utiliser** de chaque élément en abonnement ; une échéance
  mensuelle payée à temps ne déclenche rien, pas même un rappel.
- **Instance connectée** : une sanction décidée part dans la réponse à la vérification quotidienne
  suivante, donc **en 24 heures au plus** (FR-16), sous forme d'une nouvelle licence.
- **Instance coupée** : la licence d'un abonné ne vaut que jusqu'à l'échéance payée + 30 jours, le plus
  tardif des `preavisJusquau` (FR-14). Ne
  pas payer, c'est ne pas recevoir la suivante : le préavis puis la lecture seule tombent à leur date, hors
  ligne, sur l'horloge scellée (FR-15). Test : le client coupe internet et ne paie pas ; le préavis puis la
  lecture seule tombent à leur date.
- **Un abonné qui paie n'est pas puni par le silence** : sa licence lui arrive par e-mail à chaque paiement
  (FR-14). S'il ne la dépose pas, l'échéance tombe : c'est assumé (décision du PO, 2026-11-10). Money Vibes
  est alertée 7 jours avant l'échéance d'une licence payée que l'instance n'a pas reçue, pour relancer le
  DSI.
- Un client **acheteur** qui paie en plusieurs fois n'a un droit d'utiliser **perpétuel** qu'une fois le
  prix entièrement payé ; jusque-là, sa licence est à échéance.
- Un retard sur la seule **maintenance** ne sanctionne jamais un acheteur : son instance passe en version
  figée (FR-32).
- Un acheteur **entièrement payé** n'est jamais suspendu par le logiciel : un litige se règle par la voie du
  contrat.

#### FR-15 : Fonctionner coupé de Money Vibes : le silence ne punit pas
Le silence ne dit rien de la bonne foi du client (câble coupé, panne réseau, refus de payer) : il ne
sanctionne donc rien. Le contrat a sa propre horloge (FR-32), et un abonné qui paie reçoit sa licence par
e-mail (FR-14, FR-41).

**Conséquences (testables) :**
- **J+7 sans contact** (§3) : alerte au DSI et à Money Vibes.
- **J+30 sans contact** (fin du délai de silence) : **gel**. Le travail quotidien continue ; aucune
  installation ni mise à jour ne s'applique ; un bandeau orange s'affiche **pour les administrateurs
  seulement** (FR-35) ; le DG est alerté une fois ; Money Vibes ouvre un ticket et appelle le client.
- Le gel se lève au **premier contact** (§3) : signal, vérification quotidienne, ou fichier signé plus
  récent que le dernier vu (FR-22). Redéposer un fichier déjà vu ne lève rien.
- Débrancher internet n'arrête pas l'horloge du contrat : le droit d'utiliser d'un abonné expire à sa date,
  connecté ou non.
- **Chaque délai a son horloge de référence** (détail : addendum §A-1).
- Un délai observé en retard (agent d'instance ou moteur arrêté) se rattrape au redémarrage : le moteur
  émet les transitions passées (FR-34).
- Sur site, les échéances se lisent sur l'**horloge scellée** (décision du PO, 2026-11-10) : elle ne recule
  jamais d'elle-même et fonctionne hors ligne. Reculer la date du serveur est une anomalie tracée et ne
  prolonge rien. Test : reculer la date du serveur de 40 jours ; l'échéance tombe quand même.
- L'horloge scellée **n'avance pas sans borne** (détail : addendum §A-1). Test : avancer la date du serveur de 10 ans ; aucune
  échéance ne tombe.
- L'horloge scellée fait partie de l'**état de confiance** : aucune sauvegarde ne la restaure (NFR-11).

#### FR-16 : Connexion sortante uniquement, et supervision
**Conséquences (testables) :**
- L'instance n'ouvre **aucun port entrant** ; toutes les liaisons sont initiées par elle, en HTTPS.
- Elle envoie un **signal hebdomadaire** (comme Odoo), selon un schéma fermé (FR-26) (détail : addendum §A-4). Une instance en
  version figée continue de l'envoyer.
- Elle vérifie **chaque jour** s'il existe un **correctif de sécurité** pour elle. (détail : addendum §A-4)
- Money Vibes dispose d'une **vue de supervision** de toutes les instances : version, santé de chaque module
  (`DEGRADE` en 🔴, FR-34), voyant de santé de l'instance, dernier contact, état de confiance, mises à jour
  en attente, écarts nommés (FR-4).

#### FR-17 : Mises à jour essayées, puis promues
Deux variantes, parce qu'une plateforme partagée par plusieurs organisations n'a qu'une version
(décision du PO, 2026-11-10).

**Conséquences communes (testables) :**
- Les mises à jour arrivent en **paquets signés** ; un paquet dont la signature est invalide est refusé.
- La version s'installe **d'abord dans l'espace d'essai**. La recette s'y joue par des **tests
  automatiques**, sans qu'aucune personne de Money Vibes voie les données ; une recette manuelle passe par
  l'accès encadré de niveau 2 (FR-29).
- Avant la promotion : **sauvegarde automatique** ; après : **contrôle de santé** ; en cas d'échec :
  **retour arrière automatique**, sauf pour une version `AVEC_PERTE` (FR-18).
- Quand une version **majeure** ajoute une dépendance dure fournie par avenant (FR-12), le plan de la mise à
  jour **installe** ce module dans l'espace d'essai avec la version, puis le **met en service** avec la
  promotion, par le chemin 1 de FR-4. Aucun module `EN_SERVICE` ne dépend d'un module non installé (FR-3).
  Test : promouvoir une majeure qui ajoute une dépendance ; la dépendance est `EN_SERVICE` dans le réel.
- **Pas deux promotions dans la même fenêtre de 7 jours**, sauf un correctif de sécurité (décision du PO,
  2026-11-10) : la fenêtre de retour arrière d'une version ne chevauche jamais celle de la suivante.
- Tout changement de **comportement** visible des utilisateurs est déclaré au manifeste comme
  **interrupteur de changement** (`interrupteurs: [...]`, C12) ; la revue de la version classe ce qui est
  visible. Un interrupteur **ne change jamais la forme des données** (décision du PO, 2026-11-10) : il ne
  commande que du comportement ; un changement de forme passe par une migration rétrocompatible (C12). (détail : addendum §A-8) Un test de conformité par
  module joue chaque interrupteur éteint puis allumé.

**Sur site :**
- L'instance **tire** les versions disponibles.
- Le DSI reçoit un message en langage simple : ce qui change, ce qu'il faut essayer, la date proposée.
- Le DSI **choisit la date** de promotion ; sans son accord, rien ne change dans l'espace réel (sauf FR-19).
- À la promotion, **tous les interrupteurs passent à leur position finale** (décision du PO, 2026-11-10) :
  le DSI les essaie allumés dans l'espace d'essai avant de choisir sa date. Aucune instance sur site ne
  garde un interrupteur éteint.

**Sur la plateforme Money Vibes** (comme les grands éditeurs en ligne) :
- Le **code** est promu pour toutes les organisations dans une **fenêtre fixée par Money Vibes**, avec une
  **annonce** 7 jours avant (§3). (détail : addendum §A-8)
- Les répétitions générales en cours et les essais prospects sont migrés avec la version ; une organisation
  essaie une majeure après le rafraîchissement de son essai (FR-10).
- Chaque interrupteur est livré éteint : l'administrateur d'une organisation l'essaie dans l'espace d'essai
  et l'allume quand il est prêt ; à sa **date limite** (30 jours), il s'allume seul.
- **Une seule version d'interrupteurs ouverte à la fois** (décision du PO, 2026-11-10) : la date limite des
  interrupteurs d'une version tombe avant la fenêtre de la version suivante.
- Un interrupteur ne survit **jamais** à sa date limite : sinon chaque organisation finirait avec sa
  version cachée, contre FR-21.

#### FR-18 : Retour arrière en un clic, sans perte
**Conséquences (testables) :**
- Sur site, après une promotion, le DSI peut revenir à la version précédente en une action, pendant
  **7 jours**, **sans perte** : ce qui a été saisi depuis la promotion reste lisible et modifiable par la
  version précédente. Le retour arrière se fait d'**un pas** : vers la version précédente seulement.
- Cela repose sur la clause **C12** du contrat de module (décision du PO, 2026-11-10) : pendant 7 jours,
  chaque migration est **rétrocompatible** (détail : addendum §A-8). Chaque module le
  prouve par un test : promouvoir, saisir, revenir, tout se relit ; re-promouvoir, tout se relit encore.
- Une version dont une migration ne peut pas être rétrocompatible se déclare `retourArriere: AVEC_PERTE` au
  manifeste. Une version de plateforme hérite du pire `retourArriere` de ses modules.
- **`AVEC_PERTE` est permise sur site seulement** (décision du PO, 2026-11-10). Le DSI voit un **bandeau
  rouge** qui le dit **avant** de choisir sa date ; elle ne part jamais dans une vague automatique ; son
  retour arrière restaure la sauvegarde d'avant promotion. Si le contrôle de santé échoue après sa
  promotion, l'automatisme **s'arrête et alerte** le DSI et Money Vibes au lieu de restaurer : seul le DSI
  décide de la restauration.
- **Sur la plateforme, `AVEC_PERTE` est interdite** : le catalogue refuse de l'inclure dans une version de
  plateforme promue sur la plateforme Money Vibes (`AVEC_PERTE_INTERDIT_PLATEFORME`). Un module servi sur la
  plateforme reste donc `SANS_PERTE`.
- Avant le clic, l'écran affiche la durée prévue du retour arrière : quelques minutes sans perte ; jusqu'au
  temps de remise en route de NFR-7 avec une restauration.
- Un retour arrière est un plan enregistré, qui reprend après une coupure (FR-40).
- Revenir en arrière ne retire jamais un correctif de sécurité : le correctif est publié pour chaque version
  majeure encore maintenue (FR-19) et reste appliqué. `[ASSUMPTION]`
- Sur la plateforme, le retour arrière est **global** et décidé par Money Vibes.

#### FR-19 : Le chemin rapide des correctifs de sécurité
**Conséquences (testables) :**
- En cas d'urgence, Money Vibes **prévient le DSI** par téléphone et par e-mail, sans attendre la
  vérification quotidienne.
- Un correctif de sécurité passe par l'essai **et** la promotion en **72 heures** à partir du moment où le
  client est prévenu, avec retour arrière automatique.
- Le DSI peut le **reporter une seule fois, de 7 jours au plus** ; il ne peut pas le refuser.
- Un correctif de sécurité ne porte **jamais de migration** : son retour arrière est toujours sans perte.
- Il passe **hors vagues** (FR-20).
- Un correctif est publié pour chaque version majeure **encore dans sa durée de maintenance publiée**
  (FR-21), jamais au-delà : le coût de portage est borné par cette durée.
- Une instance en **version figée** reçoit les correctifs de sécurité **critiques** (§3 : CVSS de 9 ou plus,
  ou faille exploitée), et eux seulement, **tant que sa version majeure est dans sa durée de maintenance**
  (décision du PO, 2026-11-10, modèle Odoo). Au-delà, plus aucun correctif : il faut revenir à la
  maintenance et monter de version (FR-21, FR-32). Une instance en **gel** les reçoit par fichier (FR-22).

#### FR-20 : Déploiement par vagues
**Conséquences (testables) :**
- Money Vibes fixe l'ordre : un **client pilote** d'abord, puis les autres. La plateforme Money Vibes compte
  comme une instance ; Money Vibes fixe sa place dans l'ordre.
- Une version ne passe à la vague suivante qu'après **7 jours sans incident** (§3) sur la précédente : aucun
  retour arrière demandé par un client, aucune anomalie grave ou bloquante imputée à la version, aucun
  contrôle de santé en échec après promotion.
- L'attente d'une instance qui ne promeut pas est bornée : au-delà de 14 jours, la vague suivante part sur
  la foi des autres instances de la vague.
- Les correctifs de sécurité ne suivent pas les vagues (FR-19).

#### FR-21 : Une seule ligne de version
**Conséquences (testables) :**
- Aucune branche de code propre à un client (contrat de module C6).
- **Chaque version majeure a une durée de maintenance publiée** (décision du PO, 2026-11-10, modèle Odoo) ;
  la version suivante embarque les correctifs de la précédente et ses améliorations. La durée est de **3 ans, comme Odoo** (décision du PO,
  2026-11-10), publiée à la sortie de la version.
- Une instance maintenue n'a **jamais plus d'une version majeure de retard** (N-1). (détail : addendum §A-8)
- Hors de cette fenêtre, le support contractuel cesse et le DG du client est prévenu ; il n'y a **pas de
  promotion forcée**. Une instance en version figée est exemptée.
- Le DG d'une instance en version figée est prévenu 90 jours avant que sa version majeure ne sorte de sa
  durée de maintenance.

#### FR-22 : Mise à jour depuis un fichier, y compris à l'étranger
Le serveur du client n'a pas besoin d'internet : seuls les fichiers voyagent, et leur signature prouve
leur origine.

**Conséquences (testables) :**
- La **licence** (quelques kilo-octets) est **envoyée automatiquement par e-mail** au DSI à chaque paiement,
  et téléchargeable par un lien sécurisé à durée limitée (FR-14).
- Le **paquet de mise à jour** se télécharge par un **lien sécurisé à durée limitée**, depuis n'importe quel
  poste du client, ou arrive sur **clé USB** lors d'une visite.
- **`prospera-app`, Administration**, offre l'écran « **Mettre à jour depuis un fichier** » (FR-36),
  réservé à `instance:fichier:deposer` et ouvert même en lecture seule, en suspension ou en gel (FR-35) :
  la signature est vérifiée sous les yeux du DSI, puis le chemin habituel s'applique (essai, puis
  promotion ; une licence s'applique tout de suite).
- Chaque fichier porte une heure de référence signée. Un fichier plus récent que le dernier vu est un
  contact (§3) ; un fichier déjà vu ne l'est pas.
- Le geste technique peut se faire **en visioconférence**, avec le tunnel ouvert par le client (FR-23) ;
  aucune visite sur place n'est nécessaire.
- Quand un pays compte plusieurs clients, un **intégrateur partenaire local** peut faire les visites (hors
  périmètre du produit : décision commerciale).

#### FR-23 : Support à distance à la demande
**Conséquences (testables) :**
- Un tunnel de support n'existe que **si le client l'ouvre**, pour une durée limitée, et chaque session est
  journalisée (qui, quand, combien de temps).
- Aucun accès permanent de Money Vibes à une instance sur site.
- Les **comptes Money Vibes** de la console qui tourne sur l'instance (Rachid, Yao) sont **fermés par
  défaut** une fois l'installation finie. Le client les ouvre pour une durée bornée, comme le tunnel ;
  chaque session est journalisée et le client consulte ce journal (décision du PO, 2026-11-10).

#### FR-24 : Les modèles d'IA du client sont intouchables
**Conséquences (testables) :**
- Une mise à jour **de code** ne modifie jamais une **calibration locale** : son empreinte est identique
  avant et après (contrat de module C11).
- Un **nouveau modèle commun** (FR-31) produit une **nouvelle** calibration, à côté de la précédente, qui
  reste disponible pour un retour arrière.
- La calibration est sauvegardée et restaurée avec les données (FR-17, FR-18, NFR-7).

#### FR-25 : Monter une instance sur site
**Conséquences (testables) :**
- À partir d'un serveur livré, une procédure scriptée monte le socle, les deux espaces et les modules de la
  licence, chacun par son **profil** (contrat de module C10), avec sauvegardes automatiques (NFR-7), sur un
  serveur qui respecte la configuration minimale (NFR-10).
- La procédure se termine par un **bilan d'instance** : espaces actifs, licence valide, premier signal reçu
  par Money Vibes, sauvegarde testée par une restauration, état de confiance initialisé et rapporté à
  Money Vibes (NFR-11).

#### FR-32 : Fin de contrat : l'échéance du droit d'utiliser, la fin de la maintenance
**Conséquences (testables) :**
- **Élément en abonnement, droit d'utiliser échu** : un **rappel** 7 jours avant l'échéance, si elle n'est
  pas payée ; à l'échéance, **30 jours de préavis** (`PREAVIS`) où tout fonctionne, avec un bandeau pour les
  administrateurs et le DG ; puis **lecture seule** (`LECTURE_SEULE`). Jamais d'écran noir, jamais
  d'effacement (décision du PO, 2026-11-10), sauf pour l'acheteur hébergé sur la plateforme qui arrête son
  abonnement d'hébergement (ci-dessous).
- Le même parcours vaut pour un **impayé**, sur site comme sur la plateforme (FR-41). (détail : addendum §A-9) La
  suspension (`SUSPENDU`) reste une sanction distincte, décidée (§3).
- La lecture seule suit **une seule règle** (FR-43).
- **Élément acheté (droit d'utiliser perpétuel), maintenance échue** : le logiciel **continue à vie** ;
  l'instance passe en **version figée** ; plus de mises à jour, de support ni de nouveau modèle commun,
  **sauf les correctifs de sécurité critiques**, tant que sa version majeure est dans sa durée de
  maintenance publiée (FR-19, FR-21) ; **jamais de suspension**.
- Une instance en version figée **ne peut pas ajouter de module** sans revenir à la maintenance : un module
  neuf exige la version courante.
- **Acheteur hébergé sur la plateforme** (décision du PO, 2026-11-10, comme Odoo en ligne) : sur la
  plateforme, l'achat unique s'accompagne **obligatoirement** d'un **abonnement d'hébergement et de
  maintenance**, puisqu'une plateforme partagée ne peut pas figer la version d'un seul client. Ses modules
  achetés ont pour `echeanceLe` celle de cet abonnement (§3.1). S'il l'arrête :
  **préavis** de 30 jours, puis **lecture seule** pendant laquelle il **exporte ses données** (FR-43), puis
  **suppression** de ses données par Money Vibes selon les règles de protection des données en vigueur (loi
  togolaise 2019-014), avec certificat. C'est une exception écrite au §3 « Effacer » et à Q4 (§8.4). Il
  peut aussi **passer sur site**, où sa version peut être figée. (validé par le PO, 2026-11-10 : 90 jours de
  lecture seule avant la suppression).
- **Revenir à la maintenance se paie, avec le rattrapage de la période manquée** (comme SAP ; décision du
  PO, 2026-11-10), et impose de rattraper les versions manquées (FR-21).

### 4.C Données et apprentissage

**Description.** Par défaut, rien de ce qui appartient au client ne sort de son instance : seuls partent des
indicateurs. Pour améliorer l'IA, Money Vibes peut demander plus, et chaque niveau supplémentaire exige le
**consentement** du client. Le but déclaré est un **modèle commun** nourri par les historiques des clients
qui l'acceptent, le plus tôt possible ; chaque client le recalibre ensuite chez lui.

**Sur la plateforme Money Vibes** (distributeurs et cabinets hébergés), rien ne « sort » : les données sont
déjà sur nos serveurs, et AD-P16 permet aux services de Money Vibes de les lire pour l'exploitation. La
règle porte donc sur l'**usage** : lire pour le support et l'exploitation est permis, journalisé, et
n'exporte jamais en masse. **Apprendre** sur ces données (entraîner, analyser pour l'IA) est couvert par des
clauses du contrat d'abonnement, **une par finalité**, signées une fois (décision du PO, 2026-11-10) :
aucune demande au quotidien. L'IA lit ces données par un **compte de service dédié**, dont toute lecture
passe par la garde du registre (FR-27). La validation juridique de ces clauses est un point ouvert (§8.2).

#### FR-26 : Niveau 0, des indicateurs seulement
**Conséquences (testables) :**
- Sortent automatiquement : version, santé, licence, empreinte de l'état de confiance, et **indicateurs IA
  agrégés** (taux d'erreur par modèle, nombre de corrections, dérive).
- Le signal suit un **schéma fermé et publié** : un test échoue si un champ non déclaré sort.
- Aucun indicateur ne contient un identifiant de personne ou de dossier ; un test le vérifie sur chaque
  envoi.
- Chaque module avec IA remet ses indicateurs agrégés à l'agent d'instance par un contrat nommé (C11, C5).
- Le module Connecteurs y ajoute ses **compteurs**, par domaine : mouvements envoyés et refusés, écarts
  ouverts, longueur de la file d'envoi, date du dernier échange ; jamais un contenu métier (PRD Connecteurs
  FR-13, QK-20 ; décision du PO, 2026-11-11). Sur site, ils remontent aussi par la vérification quotidienne.

#### FR-27 : Le registre des consentements
**Conséquences (testables) :**
- Un consentement porte : organisation, **finalité**, **niveau** (1, 2 ou 3), auteur, date, référence de la
  clause du contrat client. **Une ligne par finalité.**
- Il est donné par le **dirigeant (DG)** du client, ou par une personne qu'il **désigne par écrit** ; il se
  **retire** à tout moment. Le DG est le dirigeant enregistré par Money Vibes à la signature du contrat ;
  une désignation écrite est un document signé par lui, dont la référence est rangée au registre.
- Chaque don et chaque retrait sont journalisés ; le client consulte ce journal.
- Sans contrat client signé portant la clause correspondante, aucun consentement ne s'enregistre.
- **Sur la plateforme**, les clauses du contrat d'abonnement s'enregistrent au registre **à la signature**,
  une ligne de niveau 3 par finalité (décision du PO, 2026-11-10) ; elles se retirent comme les autres.
- Le registre vit sur l'instance (sur site) ou sur la plateforme ; il fait partie de l'**état de
  confiance** (NFR-11) : une sauvegarde ne le restaure jamais, et un retrait tient même après une
  restauration.
- **Le registre est une garde technique, partout** : sur la plateforme comme sur site, un entraînement ne
  lit les données d'une organisation qu'à travers une vérification du registre, par le compte de service IA
  dédié. Sans consentement valide : `CONSENTEMENT_ABSENT`, et rien n'est lu. Les champs personnels sont
  retirés comme au niveau 1 (FR-28).
- Les lectures d'exploitation (AD-P16) sont journalisées à part ; elles ne servent jamais l'apprentissage,
  et ce journal entre dans SM-4.

#### FR-28 : Niveau 1, l'échantillon pseudonymisé
**Conséquences (testables) :**
- Money Vibes demande un échantillon (par exemple les dossiers où l'IA s'est trompée) ; l'échantillon est
  pseudonymisé avant de sortir.
- **Pseudonymiser**, c'est au minimum : retirer nom, téléphone, numéro de pièce d'identité, adresse,
  position GPS précise, photos et **texte libre** ; ramener la date de naissance à l'année ; garder les
  montants. La **table de correspondance** qui permettrait de ré-identifier **ne quitte jamais
  l'instance** (décision du PO, 2026-11-10, selon la loi togolaise 2019-014).
- Un échantillon résiste à la **ré-identification par recoupement** : deux exports ne se joignent pas (détail : addendum §A-10).
- Chaque export a un **manifeste signé** : champs, nombre de lignes, finalité. Il est approuvé par le **DG
  du client** (ou la personne qu'il a désignée, FR-27) **et** par le responsable des données de Money Vibes,
  puis rangé au registre. Pas d'approbation, pas d'export.
- Le client voit dans le journal ce qui est sorti, quand et pour quoi.

#### FR-29 : Niveau 2, l'accès encadré
**Conséquences (testables) :**
- L'analyse se fait sur place, ou par le tunnel ouvert par le client (FR-23) : on **regarde** les données,
  on ne les copie pas.
- Par le tunnel, l'accès passe par un **poste d'accès contrôlé** : la session est **enregistrée et
  rejouable**, le rôle est en **lecture seule**, la durée est bornée, le **transfert de fichiers est
  coupé** (testé), et le nombre de lignes affichées est plafonné. Le client peut regarder la session en
  direct et la couper.

#### FR-30 : Niveau 3, la contribution au modèle commun
**Conséquences (testables) :**
- L'entraînement s'exécute **sur l'instance** et produit une **contribution** (jeu d'entraînement
  pseudonymisé en première étape).
- Une contribution ne sort que sous consentement valide ; sinon, refus `CONSENTEMENT_ABSENT` et rien ne
  sort.
- Un consentement retiré exclut l'organisation du **prochain** tour d'entraînement ; il ne défait pas un
  modèle déjà produit (le contrat client le dit).
- Une contribution non transmise dans les 30 jours est purgée sur l'instance. Chez Money Vibes, une
  contribution est gardée jusqu'au tour d'entraînement qui l'emploie, puis supprimée ; seul le modèle
  produit est conservé.

#### FR-31 : Le modèle commun redescend comme une mise à jour
**Conséquences (testables) :**
- Le modèle commun est livré comme un paquet signé, par le chemin de FR-17 (essai, puis promotion).
- Chaque instance le **recalibre localement** ; la calibration précédente reste disponible pour un retour
  arrière (FR-24).
- En février, le **circuit** de FR-30 et FR-31 est livré et testé avec un modèle de démonstration ; le
  premier modèle commun réel arrive quand assez de clients y contribuent (au plus tôt au 2ᵉ semestre
  2027).

**Hors périmètre de 4.C :** l'apprentissage fédéré (deuxième étape, quand le nombre de clients le
justifie) ; la remise commerciale accordée à ceux qui partagent ; la rédaction du contrat client (prérequis
juridique, loi togolaise 2019-014).

---

## 5. Exigences transverses

- **NFR-1, signature** : licences, paquets de version, modèles communs et heures de référence sont signés
  par Money Vibes ; l'instance refuse tout ce qui ne l'est pas.
- **NFR-2, aucune entrée** : aucune instance sur site n'expose de port entrant vers internet.
- **NFR-3, cloisonnement** : l'espace d'essai ne lit ni n'écrit jamais l'espace réel, à trois exceptions
  près, nommées et journalisées : le **rafraîchissement** (FR-10, du réel vers l'essai), le **dossier
  d'installation** (FR-8, de l'essai vers le réel, sans donnée métier) et la **naissance d'une
  organisation** (FR-42), sur ordre de la console, jamais une lecture de l'essai.
- **NFR-4, traçabilité** : installations, mises en service, promotions, retours arrière, sanctions,
  consentements, exports et sessions de support sont journalisés en **ajout seul**. La tête du journal fait
  partie de l'état de confiance (NFR-11) : une restauration ne l'ampute pas sans que Money Vibes le voie.
  Les journaux d'un prospect effacé sont pseudonymisés, pas supprimés (FR-33).
- **NFR-5, rapidité** : le **pack** distributeur (ses codes installables, FR-37) s'installe
  dans l'espace d'essai en moins de **15 minutes**, du clic « Installer » à l'affichage du bilan d'essai,
  hors reprise de données et hors prérequis externes, mesurée sur la plateforme Money Vibes, images déjà
  téléchargées. Sur site, la cible est fixée après la première installation. `[ASSUMPTION : conditions de
  mesure]`
- **NFR-6, idempotence** : rejouer une installation, une promotion, un dossier d'installation ou un
  « Réessayer » ne crée aucun doublon ; chaque vérification a sa clef d'idempotence (C13).
- **NFR-7, sauvegardes** (décisions du PO, 2026-11-10) : règle **3-2-1** (trois copies, deux supports, une
  hors de la machine) ; sur site, la copie hors machine est sur un **second support dans les locaux du
  client**. Les sauvegardes sont chiffrées. Sur site, le client détient seul la clé qui restaure sur une autre machine (détail : addendum §A-3). Perte maximale tolérée **1 heure, sur site comme sur
  la plateforme** (journal des opérations) ; remise en route **4 heures**, sur site comme sur
  la plateforme (validé par le PO, 2026-11-10). Un **test de restauration automatique chaque mois**, dont l'échec fait passer le
  **voyant de santé de l'instance** en orange (FR-16). Sur la plateforme, conservation par paliers
  (7 quotidiennes, 4 hebdomadaires, 3 mensuelles). **Une sauvegarde ne restaure
  jamais l'état de confiance** (NFR-11).
- **NFR-8, clés de signature** (décision du PO, 2026-11-10) : les clés de signature sont certifiées par une clé racine hors
  ligne et changent régulièrement (détail : addendum §A-3) ; la **liste de révocation** voyage dans le signal hebdomadaire, dans la réponse
  quotidienne **et** dans chaque fichier de mise à jour. Une clé compromise est révoquée par un **fichier d'urgence** signé par la clé racine (détail : addendum §A-3).
- **NFR-9, interruption** : une promotion n'interrompt pas le travail plus de **15 minutes**, annoncées.
- **NFR-10, serveur du client** : une configuration minimale publiée (processeur, mémoire, disque,
  second support de sauvegarde) ; la procédure de FR-25 refuse un serveur qui ne la respecte pas.
  `[ASSUMPTION : chiffres à fixer par l'architecture]`
- **NFR-11, état de confiance** (ajoutée le 2026-11-10) : l'**état de confiance** de l'instance (§3) est ancré **hors des sauvegardes**
  (détail : addendum §A-4). Il n'avance que. Un recul est vu par Money Vibes au contact suivant (détail : addendum §A-4). Tests : restaurer une sauvegarde
  de six mois, puis vérifier que l'ancienne licence reste refusée, que le retrait d'un consentement tient,
  et que l'échéance tombe à la même date. Le mécanisme d'ancrage (puce de sécurité, support séparé) est
  laissé à l'architecture (§8.2).

## 6. Indicateurs de réussite

| # | Indicateur | Cible |
|---|---|---|
| SM-1 | Démo du 15/01 : le pack **Terrain & Ventes** installé **en une action dans l'espace d'essai**, sur une organisation distributeur **neuve** (seul le module `instance` y est installé), sans 🔴 hors prérequis externes. Les codes démontrés sont ceux que la table de FR-37 donne pour ce pack ; les prérequis de démonstration (clé PI-SPI de test, numéro WhatsApp de test) sont déclarés à l'avance | atteint |
| SM-2 | Clients **En service** (au moins partiel) en février 2027 | 2 (un assureur sur site, un distributeur chez Money Vibes) |
| SM-3 | Changements de **code** arrivés dans un espace réel **sans** passer par l'essai : journal des promotions, et une sonde qui compare l'empreinte du code déployé dans chaque espace réel à ce journal (un test d'intrusion de la sonde fait partie de la recette) | 0 |
| SM-4 | Données sorties d'une instance, ou lues pour l'apprentissage sur la plateforme, **sans** consentement valide (registre, journal d'export, journal de la garde et journal des lectures d'exploitation AD-P16, vérifiés à chaque export et à chaque entraînement) | 0 |
| SM-5 | Clients installés la première année | ≈ 10 |
| SM-6 | Règles propres à un client dans le code : garde de balayage C6, posée au gabarit de chaque dépôt (§8.4) | 0 |
| SM-7 | Durée d'installation du **deuxième** distributeur, mesurée par le plan d'installation (FR-40) du clic « Installer » à la mise en service, comparée au premier | ≤ 50 % du premier |

**Contre-indicateurs** (à surveiller pour qu'on ne triche pas avec les cibles) :
- nombre de **retours arrière** par version (une promotion trop rapide se paie ici) ;
- modules restés **🟠 en attente plus de 7 jours** (un bilan « presque vert » n'est pas un client servi) ;
- instances **au-delà du délai de silence**.

## 7. Contrat de module du moteur lui-même

La **partie A** vit dans `platform-catalog-service`. Les **parties B et C** (émission des licences,
distribution des paquets, supervision, agent d'instance qui signale, promeut, revient en arrière et tient
l'état de confiance, registre des consentements) sont des agrégats distincts : leurs services se tranchent
dans la spine d'architecture. Un retour arrière ne peut pas être exécuté par le service qu'il remplace.
`[ASSUMPTION : découpage laissé à la spine]`

| Clause | Pour le moteur |
|---|---|
| C1 | Le moteur a son propre manifeste : `code: instance`, `depends: []`, prérequis (serveur conforme, NFR-10), vérifications (bilan d'instance, FR-25), droits `instance:*`, `retourArriere: SANS_PERTE`, pas de champ `ia`. Il enrichit le manifeste de tous les modules (FR-38) |
| C2 | Socle existant du catalogue (droits plateforme `entitlement:*`). **Amendée pour tous** : la garde lit l'état publié poussé (FR-34), jamais l'horloge de son conteneur ; lecture seule selon FR-43 ; route d'export exemptée ; identité de service du moteur sur les routes de vérification (FR-6) |
| C3 | La partie A possède : offres, dossiers d'installation, plans d'installation, bilans, état publié et ses faits (installation, espace, santé, interrupteurs). Elle est le **seul émetteur** de l'état publié ; sur site, elle lit l'horloge scellée auprès de l'agent d'instance, qui la tient (parties B et C). Licences, état de confiance, consentements et journal appartiennent aux services des parties B et C. Le moteur n'écrit dans aucun autre module : le rejeu passe par le contrat d'import de chaque propriétaire (FR-42) |
| C4 | Sans Reprise ni Connecteurs dans l'offre, leurs lignes sont grisées « hors offre » et ne bloquent rien (FR-7) |
| C5 | Publie `entitlement.changed` (existant) et `etat-publie.changed`, dont la partie A est le seul émetteur, transitions dues au temps comprises (FR-34) ; consomme le feu vert de la Reprise ; topics de bilan, de licence et de réception définitive à nommer dans la spine (détail : addendum §A-2) |
| C6 | Aucune règle propre à un client ; tout passe par le contrat et la licence. Un module, le moteur compris, a **le même schéma de données pour toutes les organisations** : aucune variante par client (C6, C11) |
| C7 | Droits plateforme existants ; droits de tenant `instance:*` du module `instance` pour les écrans du client (FR-35) |
| C8 | Trois lieux (FR-36) : console Money Vibes pour Money Vibes ; module d'écran « Administration » dans `prospera-app` pour le client ; mêmes écrans dans l'app expert-comptable pour le cabinet |
| C9 | Désinstaller ne supprime rien (existant : `DELETE` = `REVOKED`) ; seul le chemin 1 rouvre un `REVOKED` (FR-39) |
| C10 | Socle minimal : démarre toujours, sans profil ; l'agent d'instance fait partie du socle, hors des profils de modules |
| C11 | Sans objet : le moteur n'embarque pas d'IA ; il transporte les contributions et les indicateurs de niveau 0 (4.C) |
| C12 *(nouvelle)* | Ses propres migrations sont rétrocompatibles pendant 7 jours (FR-18) ; ses changements de comportement passent par des interrupteurs déclarés (FR-17) |
| C13 *(nouvelle)* | Il déclare ses prérequis et vérifications, rend sa santé, déclare sa lecture seule, exporte, importe et efface par organisation (FR-38) |

## 8. Décisions, points ouverts et suites

### 8.1 Décisions du PO

| # | Question | Décision |
|---|---|---|
| QB-1 | Instance coupée au-delà du délai de silence | **Gel** à J+30 ; le silence ne punit pas ; le contrat a sa propre horloge (FR-15, FR-32) |
| QB-2 | Report d'un correctif de sécurité | **Une fois, 7 jours au plus**, pas de refus (FR-19) |
| QC-1 | Qui consent chez le client | **Le DG**, ou une personne qu'il désigne par écrit (FR-27) |
| — | Valeurs | Signal **hebdomadaire** + contrôle sécurité **quotidien** ; délai de silence **30 j**, alerte **J+7** ; retour arrière **7 j** ; correctif **72 h** ; maintenance d'une version majeure **3 ans** ; vague **7 j** ; installation **< 15 min** ; préavis **30 j** |

Le 2026-11-10, après la première validation, le PO a tranché : menu de l'essai, mise en service par
sous-ensemble, lignes hors offre, rétrocompatibilité (C12), connecteurs en essai, sauvegardes et clés,
horloge scellée, pseudonymisation et tunnel, incident et correctifs, jalons, C13, dossier d'installation,
deux variantes de mise à jour, effacement de l'essai, préavis, version figée, fenêtre N-1, contrat et
licence, comptes Money Vibes sur site, suspension à distance, apprentissage sur la plateforme.

Le même jour, après la deuxième validation, le PO a tranché :

| Sujet | Décision du PO (2026-11-10) | Où |
|---|---|---|
| Octroi | Tout octroi de module passe par le moteur, cabinet compris (écrans dans l'app expert-comptable) ; paiement, pack, opérateur et licence ne font que prolonger ou rouvrir ; le socle de vertical devient le catalogue du vertical ; pas de reprise de l'existant | §0, §3, §3.1, FR-4, FR-12, FR-37, FR-42 |
| Impayé | Le PRD fait foi : préavis de 30 jours, puis lecture seule ; `SUSPENDU` est une sanction décidée ; le code de STORY-280 et 281 est ajusté | §3.1, FR-32, FR-41, §8.4 |
| Licence d'un abonné | Liée à l'instance ; valable jusqu'à l'échéance payée + 30 jours ; envoyée par e-mail à chaque paiement et téléchargeable par un lien à durée limitée | FR-14, FR-22, FR-41 |
| Interrupteurs | Sur site, position finale à la promotion ; sur la plateforme, une seule version d'interrupteurs ouverte à la fois ; jamais de changement de forme des données | FR-17 |
| Retour arrière | `AVEC_PERTE` interdite sur la plateforme ; permise sur site, l'automatisme s'arrête et alerte au lieu de restaurer ; pas deux promotions dans la même fenêtre de 7 jours, sauf correctif de sécurité | FR-17, FR-18 |
| Version figée | Modèle Odoo : durée de maintenance publiée par version majeure ; correctifs critiques tant que la version de l'instance est maintenue ; maintenance datée par instance ; critique = CVSS ≥ 9 ou faille exploitée | §3, FR-14, FR-19, FR-21, FR-32 |
| Apprentissage sur la plateforme | Une clause par finalité, une ligne de registre par finalité ; l'IA lit par un compte dédié qui passe par la garde ; validation juridique en point ouvert | §4.C, FR-27, §8.2 |
| Sauvegardes | Perte maximale 1 heure aussi sur la plateforme ; clé d'exploitation scellée sur l'instance et clé de secours remise au client ; copie hors machine sur un second support dans les locaux du client | NFR-7 |
| Dépendances | Une majeure qui ajoute une dépendance dure la fournit sans facturation (avenant automatique) ; la modification d'un pack ne s'applique qu'aux nouveaux contrats | FR-12, FR-38 |

Chaque décision et sa raison sont au `.memlog.md` ; le texte ci-dessus les applique.

### 8.2 Points ouverts

- `[NOTE FOR PM]` **Validation juridique** des clauses d'apprentissage par finalité (plateforme) et des
  clauses du contrat client pour les niveaux 1 à 3 (loi togolaise 2019-014). Propriétaire : PO, avec un
  juriste. Date : avant la signature du premier contrat d'abonnement, en février 2027.
- `[NOTE FOR PM]` **Révision de D3** à acter dans le plan v3 (§8), le contrat de module (§9) et AD-P17 :
  l'amendement est rédigé dans `amendement-plan-v3-2026-11-10.md`, à valider par le PO le 13/11. La charge
  réelle de Dev B s'y chiffre (§8.4). Propriétaire : PO et Dev B. Date : séance du 13/11.
- `[NOTE FOR PM]` **C12, C13 et les amendements du contrat de module** (§8.4) : ils sont rédigés dans
  `CONTRAT-DE-MODULE-2026-11-09.md` (PR à venir), à valider par le PO le 13/11. Propriétaire : PO.
  Date : séance du 13/11.
- `[NOTE FOR PM]` **Entrée au catalogue des modules commerciaux** (18 pour le distributeur, et ceux des
  autres verticaux), avec leur manifeste C13. Tant qu'un module n'y est pas, il ne se vend pas (FR-12,
  décision du PO, 2026-11-10). La liste de tous les modules à manifester, toutes verticales, est dans
  `manifestes-a-produire.md` (fichier produit à part). Propriétaire : Dev B pour la liste et la table de
  FR-37 ; l'auteur de chaque module pour son manifeste. Date : table et pack Terrain & Ventes avant la démo
  du 15/01 ; le reste selon la liste.
- `[NOTE FOR PM]` **Mécanisme d'ancrage de l'état de confiance et de l'horloge scellée** (puce de sécurité
  ou support séparé), et son coût. Propriétaire : l'architecte de la spine du moteur. Date : spine du
  moteur, avant la semaine 5 (07/12).

### 8.3 Inférences

Les inférences « à confirmer par le PO » ont été **validées par le PO le 2026-11-10** ; leurs marques
`[ASSUMPTION]` sont retirées du texte. Les durées et les seuils qu'elles portent (7 j, 30 j, 14 j, 90 j,
5 dossiers, 4 h…) sont des valeurs de départ. Seul le classement de FR-42, FR-43 et NFR-11 parmi les
exigences jamais sacrifiées reste marqué `[ASSUMPTION : classement à confirmer par le PO]` (§8.4).

**Laissé à l'architecture (spine du moteur et de la coque), marqué `[ASSUMPTION]` dans le texte :**
- deux adresses par instance (§3.1) ; chemin de la route de lecture (FR-34, addendum §A-2) et délai d'une
  minute (FR-34) ;
- borne d'avance de 48 heures de l'horloge scellée (FR-15, addendum §A-1) ; correctif maintenu au retour arrière (FR-18) ;
- création des organisations par l'`auth-service` de chaque espace (FR-42, addendum §A-7), et lien de la
  coque entre les deux espaces (FR-42) ;
- conditions de mesure de NFR-5 ; rythme de rotation des clés (NFR-8, addendum §A-3) ; chiffres de NFR-10 ; découpage des
  services des parties B et C (§7).

### 8.4 Ce que ce PRD demande ailleurs

| Document | Changement |
|---|---|
| Contrat de module | Amendements à **§0, §1, C1, C2, C7, C8, C11, C12, C13, §6, Q3, Q4, §9** et à la garde C6 (SM-6), rédigés dans `CONTRAT-DE-MODULE-2026-11-09.md` (PR à venir), à valider par le PO le 13/11 (détail : addendum §A-11) |
| Plan v3 (§8) et AD-P17 | Acter **D3 révisée** (sur site avant février) et **toutes les FR pour février** (table du §0) ; chiffrer dans cet amendement la charge réelle de Dev B ; ordre de sacrifice (ci-dessous, décidé) |
| STORY-727 | Lots 2, 4, 6 et 7 ajustés à ce PRD ; droits de test réamorcés (détail : addendum §A-9) |
| STORY-280 et STORY-281 (`paiement-service`, catalogue) | L'impayé ne suspend plus ; le rappel de J-7 est renommé ; la régularisation sort du préavis ou de la lecture seule (détail : addendum §A-9) |
| `paiement-service` (vente) | Résoudre les dépendances dures comme la console (FR-12) ; refuser un élément non installable ; avenant automatique quand une majeure ajoute une dépendance ; un seul mode d'acquisition par élément ; envoi de la licence par e-mail à chaque paiement (FR-14) |
| `auth-service` (STORY-167) | Création des organisations à la demande du moteur, dans chaque espace, avec le même identifiant (FR-42) ; module `instance` traité comme les autres ; droit de consentir attribuable par le DG seul (FR-35) |
| AD-P16 | Lecture d'exploitation journalisée, sans export en masse, jamais pour l'apprentissage ; l'IA lit par un compte dédié qui passe par la garde du registre (FR-27) |
| App expert-comptable | Lire l'état publié (FR-34) et porter les écrans d'Administration du cabinet (FR-36) |
| PRD Connecteurs | **Doit** reprendre FR-9 : liste blanche, bac à sable vérifié, identifiants en lecture seule propres à l'essai, ligne « aller-retour non vérifié », `ECRITURE_REELLE_DEPUIS_ESSAI` ; comportement en `LECTURE_SEULE` (FR-43) ; C12 et C13 à son tableau. À valider avec ce PRD le 13/11 |
| PRD Reprise de données | Le feu vert et la réception définitive sont consommés par le moteur (FR-8) ; une réception par sous-ensemble libère les lots de ce sous-ensemble ; C8 : écrans dans `prospera-app` **dès février** (libre-service du prospect) ; effacement du prospect et import de sa part du dossier d'installation (C13, FR-33, FR-42) ; C12 et C13 à son tableau ; « bascule » = mise en service |

**Ordre de sacrifice, si février glisse** (décision du PO, 2026-11-10, classement de la salle ; il
s'adapte au fil du projet). FR-17 **sur site** est classée parmi les jamais sacrifiées : le DSI de
l'assureur en a besoin en février.

| Groupe | Exigences | Version minimale si on dégrade |
|---|---|---|
| **Jamais sacrifiées** | FR-1 → FR-9, FR-11, FR-12, FR-14, FR-15, FR-17 (sur site), FR-18, FR-19, FR-22, FR-23, FR-24 (IA calibrée de l'assureur), FR-25, FR-32 → FR-38, FR-40, FR-41 ; NFR-1 → NFR-4, NFR-6 → NFR-8 ; FR-42, FR-43 et NFR-11 `[ASSUMPTION : classement à confirmer par le PO]` | — |
| **Dégradables** | FR-10 | rafraîchissement par un script lancé à la demande |
| | FR-13 | même console ; les écarts sont listés |
| | FR-16 | supervision réduite à la liste des instances et au dernier contact |
| | FR-17 (plateforme) | fenêtre annoncée, sans interrupteurs de changement |
| | FR-26, FR-27 | registre et garde, sans écran côté client |
| | FR-28 | export manuel, approuvé par écrit |
| | FR-29 | **niveau 2 fermé** tant que le poste d'accès enregistré n'existe pas |
| | FR-39 | réinstallation après une majeure refusée avec un code nommé |
| | NFR-5, NFR-9, NFR-10 | mesurées, non bloquantes |
| **Sacrifiables, dans l'ordre** | 1. FR-30 et FR-31 (circuit du modèle commun) | aucun modèle réel avant le 2ᵉ semestre 2027 |
| | 2. FR-20 (vagues) | avec deux clients, le pilote est le premier |
| | 3. FR-21 (outillage de l'escalade) | la règle N-1 reste écrite et s'applique à la main |

L'essai prospect (FR-33) et l'IA calibrée (FR-24) ne sont **jamais** sacrifiés : le premier est l'outil de
vente de février, la seconde ce que l'assureur achète.
