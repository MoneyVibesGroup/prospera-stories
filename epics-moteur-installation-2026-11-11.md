---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/prd.md
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/addendum.md
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/.memlog.md
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/manifestes-a-produire.md
  - prospera-stories/architecture/architecture-moteur-installation-2026-11-11/ARCHITECTURE-SPINE.md (finale, avec la PR #406)
  - prospera-stories/architecture/architecture-moteur-installation-2026-11-11/.memlog.md
  - prospera-stories/CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13)
  - prospera-stories/amendement-plan-v3-2026-11-10.md (§3 ordre de sacrifice, §4 stories avant la semaine 5, §5, §6)
  - prospera-stories/sprint-status.yaml (reserved_ranges : EPIC-142 → 299, STORY-900 → 1199, relevés le 2026-11-11)
  - platform-catalog-service, auth-service, prospera-paiement-service (code existant)
---

# Moteur d'installation — Découpage en épics et en stories

## Vue d'ensemble

Découpage du PRD **Moteur d'installation** et de sa spine (AD-1 → AD-42) en **épics**, comme pour le stock : les fiches de
stories ne sont **pas** écrites ici, mais par celui qui code la story, juste avant de la coder. Deux développeurs : Dev B
porte la majorité des épics et **tous les écrans** ; Dev A porte le socle (EPIC-155), la démo (EPIC-160) et le backend de
153, 154, 156 et 158 (décisions du PO du 2026-11-11). Le découpage couvre **jusqu'à février** (deux clients en service).
Périmètre : backend **et** écrans (tranches verticales, voir plus bas) des quatre unités du moteur (partie A dans
`platform-catalog-service`, `agent-instance`, `centrale-service`, `apprentissage-service`), le dépôt `prospera-plateforme`, et les
ajustements que le moteur impose à `auth-service`, `prospera-paiement-service` et aux gardes des modules existants.
**Hors périmètre** : l'intérieur de Reprise et de Connecteurs (leurs propres épics ; Connecteurs n'est plus requis en
février, spine de Connecteurs AD-32).

*Amendé le 2026-11-12 par la spine de Connecteurs (`architecture-connecteurs-2026-11-12`, AD-31) : EPIC-142 (matrice : échange entrant, contrôles à deux identités), EPIC-143 (`domainesEchange`, association objet → domaine), EPIC-157 (Connecteurs producteur des compteurs).*

**Identifiants.** Épics **EPIC-142 → EPIC-160**, pris dans la plage réservée à Dev B et inscrits au registre le jour du
découpage. **Aucun `story_id` n'est réservé ici** : chaque fiche prend le suivant de la plage de celui qui la code
(`STORY-900 → 1199` pour Dev B, `STORY-730 → 899` pour Dev A), au moment de l'écrire. Relevé du 2026-11-11 : aucune branche distante n'emploie EPIC-142+ ni STORY-900+, et le checkout partagé n'a aucun fichier non suivi.

## Requirements Inventory

### Functional Requirements

- **FR-1** : Choisir l'offre du client
- **FR-2** : Ajouter les dépendances au moment du choix, avec leur raison
- **FR-3** : Empêcher le retrait d'un module dont d'autres ont besoin
- **FR-4** : Un seul point de décision, quel que soit le chemin
- **FR-5** : Vérifier les prérequis pendant l'installation, sans bloquer le reste
- **FR-6** : Des vérifications réelles, pas des « OK »
- **FR-7** : Le bilan d'installation et le passage « En service »
- **FR-8** : La répétition générale, puis la mise en service
- **FR-9** : Un espace d'essai qu'on ne peut pas confondre avec le réel
- **FR-10** : Un espace d'essai qui ressemble au réel
- **FR-11** : Un seul chemin pour tout changement
- **FR-12** : Le contrat fait foi
- **FR-13** : Le même geste sur la plateforme Money Vibes et sur site
- **FR-14** : La licence signée
- **FR-15** : Fonctionner coupé de Money Vibes : le silence ne punit pas
- **FR-16** : Connexion sortante uniquement, et supervision
- **FR-17** : Mises à jour essayées, puis promues
- **FR-18** : Retour arrière en un clic, sans perte
- **FR-19** : Le chemin rapide des correctifs de sécurité
- **FR-20** : Déploiement par vagues
- **FR-21** : Une seule ligne de version
- **FR-22** : Mise à jour depuis un fichier, y compris à l'étranger
- **FR-23** : Support à distance à la demande
- **FR-24** : Les modèles d'IA du client sont intouchables
- **FR-25** : Monter une instance sur site
- **FR-26** : Niveau 0, des indicateurs seulement
- **FR-27** : Le registre des consentements
- **FR-28** : Niveau 1, l'échantillon pseudonymisé
- **FR-29** : Niveau 2, l'accès encadré
- **FR-30** : Niveau 3, la contribution au modèle commun
- **FR-31** : Le modèle commun redescend comme une mise à jour
- **FR-32** : Fin de contrat : l'échéance du droit d'utiliser, la fin de la maintenance
- **FR-33** : L'essai avant signature
- **FR-34** : Ce que le moteur publie pour les écrans et les gardes
- **FR-35** : Les droits de tenant suivent l'installation
- **FR-36** : Trois lieux d'écrans
- **FR-37** : De l'offre au menu
- **FR-38** : Publier le manifeste d'une version
- **FR-39** : Désinstaller et réinstaller
- **FR-40** : Une installation interrompue reprend là où elle s'est arrêtée
- **FR-41** : Sanctionner à distance une instance sur site
- **FR-42** : Une organisation dans deux espaces
- **FR-43** : La lecture seule et l'export, une seule règle

*43 exigences fonctionnelles. Le texte qui fait foi est celui du PRD ; chaque story cite la FR qu'elle sert.*

### NonFunctional Requirements

- **NFR-1, signature** : licences, paquets de version, modèles communs et heures de référence sont signés par Money Vibes ; l'instance refuse tout le reste.
- **NFR-2, aucune entrée** : aucune instance sur site n'expose de port entrant vers internet.
- **NFR-3, cloisonnement** : l'essai ne lit ni n'écrit jamais le réel, sauf trois exceptions nommées et journalisées (rafraîchissement, dossier d'installation, naissance d'une organisation).
- **NFR-4, traçabilité** : installations, mises en service, promotions, retours arrière, sanctions, consentements, exports et sessions de support sont journalisés en ajout seul ; la tête du journal est dans l'état de confiance.
- **NFR-5, rapidité** : le pack distributeur s'installe dans l'essai en moins de 15 minutes, du clic au bilan d'essai (hors reprise et prérequis externes).
- **NFR-6, idempotence** : rejouer une installation, une promotion, un dossier ou un « Réessayer » ne crée aucun doublon.
- **NFR-7, sauvegardes** : règle 3-2-1, perte maximale 1 h, remise en route 4 h, test de restauration mensuel ; une sauvegarde ne restaure jamais l'état de confiance.
- **NFR-8, clés de signature** : clé racine hors ligne, clés de publication annuelles, clé d'exécution de la centrale, liste de révocation, fichier d'urgence.
- **NFR-9, interruption** : une promotion n'interrompt pas le travail plus de 15 minutes, annoncées.
- **NFR-10, serveur du client** : configuration minimale publiée, refusée en dessous par la procédure de montage ; aucun TPM en v1.
- **NFR-11, état de confiance** : ancré hors des sauvegardes (ancrage logiciel + Money Vibes témoin en v1), il n'avance que ; un recul est vu au contact suivant.

**Indicateurs de réussite :**

- **SM-1** : Démo du 15/01 : le pack **Terrain & Ventes** installé **en une action dans l'espace d'essai**, sur une organisation distributeur **neuve** (seul le module `instance` y est installé), sans 🔴 hors prérequis externes. Les codes démontrés sont ceux que la table de FR-37 donne pour ce pack ; les prérequis de démonstration (clé PI-SPI de test, numéro WhatsApp de test) sont déclarés à l'avance
- **SM-2** : Clients **En service** (au moins partiel) en février 2027
- **SM-3** : Changements de **code** arrivés dans un espace réel **sans** passer par l'essai : journal des promotions, et une sonde qui compare l'empreinte du code déployé dans chaque espace réel à ce journal (un test d'intrusion de la sonde fait partie de la recette)
- **SM-4** : Données sorties d'une instance, ou lues pour l'apprentissage sur la plateforme, **sans** consentement valide (registre, journal d'export, journal de la garde et journal des lectures d'exploitation AD-P16, vérifiés à chaque export et à chaque entraînement)
- **SM-5** : Clients installés la première année
- **SM-6** : Règles propres à un client dans le code : garde de balayage C6, posée au gabarit de chaque dépôt (§8.4)
- **SM-7** : Durée d'installation du **deuxième** distributeur, mesurée par le plan d'installation (FR-40) du clic « Installer » à la mise en service, comparée au premier

### Additional Requirements

Décisions d'architecture de la spine (`architecture/architecture-moteur-installation-2026-11-11/ARCHITECTURE-SPINE.md`, statut final) ; chaque story cite les AD qu'elle tient :

- **AD-1** : Le poste central ne pousse rien ; l'agent tire et applique
- **AD-2** : Quatre unités, un propriétaire par donnée
- **AD-3** : L'agent vit hors de la version de plateforme
- **AD-4** : L'ancrage de l'état de confiance : le magasin, un miroir qui n'avance que, un témoin
- **AD-5** : L'horloge scellée n'avance que, et seul Money Vibes la corrige
- **AD-6** : Un seul port d'heure pour les échéances de contrat
- **AD-7** : Tout ce qui arrive de Money Vibes est signé, et vérifié hors ligne
- **AD-8** : La licence est le seul canal des droits et des sanctions sur site
- **AD-9** : Le contact : un seul protocole sortant, trois rythmes, un gel
- **AD-10** : Exécuter : Docker Compose, deux projets, l'agent seul aux commandes
- **AD-11** : Promouvoir, puis revenir sans perte : relancer, pas restaurer
- **AD-12** : Le journal : chaîné, écrit par l'agent seul, une seule enveloppe
- **AD-13** : Les consentements vivent sur l'instance ; Money Vibes n'en a qu'une copie signée
- **AD-14** : La partie C : un service à part, des données qui ne sortent que préparées
- **AD-15** : Une organisation, deux espaces : le moteur seul la fait naître
- **AD-16** : Les sauvegardes : orchestrées par l'agent, sans jamais l'état de confiance
- **AD-17** : Les contrats nommés du moteur
- **AD-18** : Reprise, Connecteurs et adaptateurs : des voisins aux frontières fixées
- **AD-19** : La plateforme Money Vibes est une instance comme les autres, sauf sept points
- **AD-20** : Le support à distance : ouvert par l'agent, borné, journalisé
- **AD-21** : Un seul fait de contrat par instance : le réel fait foi, l'essai le reçoit
- **AD-22** : L'état voulu : un document versionné, signé comme un tout, qui propose
- **AD-23** : La partie A : manifeste, point de décision, neuf états, bascule
- **AD-24** : L'état publié : une forme, un propriétaire, un état par espace
- **AD-25** : L'émission de la licence : la centrale, par le bus
- **AD-26** : Deux dépôts neufs ; des formats signés et testés des deux côtés
- **AD-27** : Le bus : un client Kafka, un registre de schémas, une graphie
- **AD-28** : La garde des clés
- **AD-29** : L'identité de l'instance : une autorité de certificats mTLS
- **AD-30** : Maintenance, version figée et fenêtre N/N-1
- **AD-31** : Le correctif de sécurité : un chemin rapide hors vagues
- **AD-32** : Les vagues et les incidents
- **AD-33** : Les migrations : déclarées au manifeste, jouées par l'agent, sous verrou
- **AD-34** : Le magasin de l'agent et son raccordement aux espaces
- **AD-35** : Le ré-ancrage après sinistre, et la continuité de la centrale
- **AD-36** : La posture de sécurité de l'hôte et de la chaîne de livraison
- **AD-37** : Les commandes vers l'agent
- **AD-38** : L'effacement : l'essai prospect et l'acheteur hébergé
- **AD-39** : L'IA du client est intouchable
- **AD-40** : Observabilité et mesures
- **AD-41** : La tranche de départ et le repli
- **AD-42** : L'existant, ratifié ou changé

*42 AD.*

### UX Design Requirements

Aucune spécification UX pour les écrans du moteur. Les stories d'écran (console Money Vibes, coque `prospera-app`, app
expert-comptable) s'appuient sur FR-36 et sur la spine de la coque (AD-7, AD-14). ⛔ **Règle n°1 du programme front** : chaque
écran passe d'abord par sa **maquette**, ajoutée dans `prototypes/prospera-prototype.html` et republiée sur son Artifact,
avant la story qui le code ; ses chiffres sont tirés du référentiel du dépôt, jamais inventés.

### FR Coverage Map

| FR | Épic |
|---|---|
| FR-1, FR-4, FR-5, FR-6, FR-7, FR-39, FR-40 | EPIC-144 — installer en une action, point de décision unique |
| FR-2, FR-3, FR-12, FR-37, FR-38 | EPIC-143 — le catalogue connaît chaque module par son manifeste |
| FR-8, FR-9, FR-10, FR-11, FR-42 | EPIC-146 — deux espaces : essayer, puis mettre en service |
| FR-13, FR-16, FR-25 | EPIC-148 — monter une instance et la superviser |
| FR-14, FR-32, FR-41 | EPIC-150 — la licence signée ouvre, prolonge ou sanctionne |
| FR-15 | EPIC-149 — l'instance garde la confiance, même coupée |
| FR-17, FR-18, FR-22, FR-24 | EPIC-151 — mettre à jour sans peur |
| FR-19 | EPIC-152 — correctifs de sécurité et fin de maintenance |
| FR-20, FR-21 | EPIC-156 — vagues et fenêtre N/N-1 (FR-21 : la règle est tenue par EPIC-155, l'outillage ici) |
| FR-23 | EPIC-154 — support à distance |
| FR-26, FR-27 | EPIC-157 — consentements et indicateurs de niveau 0 |
| FR-28, FR-29, FR-30, FR-31 | EPIC-158 — apprentissage |
| FR-33 | EPIC-147 — l'essai avant signature |
| FR-34, FR-35, FR-43 | EPIC-145 — l'état publié fait foi (et EPIC-159 pour le cabinet) |
| FR-36 | transverse : chaque épic porte ses écrans (console `AP-38+`, Administration `PRA-100+`, cabinet `FE-112+`) |

**Couverture : 43 FR sur 43.** NFR : NFR-1, NFR-8 → EPIC-150 ; NFR-2, NFR-10 → EPIC-148 ; NFR-3 → EPIC-146 ; NFR-4, NFR-11 → EPIC-149 ;
NFR-5 → EPIC-144 ; NFR-6 → toutes ; NFR-7 → EPIC-153 ; NFR-9 → EPIC-151. AD-1 → AD-42 : citées par chaque story.

## Epic List

| Épic | Titre | FR | Propriétaire | Semaine |
|---|---|---|---|---|
| EPIC-142 | Un contrat d'état publié stable, et un socle prêt pour le moteur (contrat **figé le 11/12**, consommé par la doublure de la coque de Dev A) | socle de FR-34, FR-42 | Dev B | S5 |
| EPIC-143 | Le catalogue connaît chaque module par son manifeste | FR-2, FR-3, FR-12, FR-37, FR-38 | Dev B | S5 |
| EPIC-144 | Installer une offre en une action, par un seul point de décision (avec la réécriture des recettes croisées 631, 632, 649, 650/651 et 728, livrée **avec** le retrait des quatre chemins vers `ACTIVE`) | FR-1, FR-4 → FR-7, FR-39, FR-40 | Dev B | S5 |
| EPIC-145 | L'état publié fait foi pour la coque et pour chaque garde (première story : **la matrice des neuf états**) | FR-34, FR-35, FR-43 | Dev B | S5 |
| EPIC-146 | Deux espaces : essayer, puis mettre en service (**non divisé**, pour les tests) | FR-8 → FR-11, FR-42 | Dev B | S6 |
| EPIC-160 | Les démos du 15/01 : chaque prospect ouvre son propre essai et teste sur place tout le parcours métier de sa verticale | (SM-1 élargi) | Dev A | S6 → S8 (distributeur et assurance en S6, microfinance en S7-S8) |
| EPIC-159 | Le cabinet est installé par le moteur, et son app lit l'état publié | FR-34 → FR-37, FR-43 (cabinet) | Dev B | S6, **en premier** (recette en S7) |
| EPIC-147 | Le prospect essaie avant de signer (montré le 15/01 : la démo-vente) | FR-33 | Dev B | S6 |
| EPIC-155 | La version de plateforme 1.0 tourne sur un socle maintenu (Node 24, MongoDB 8.0, client Kafka Confluent, Karapace, gardes C6/C12/C13) | règle de FR-21 | Dev A | S4 → S7 (client Kafka et Karapace : **S4, fini le 04/12**) |
| EPIC-148 | Monter une instance sur site et la superviser | FR-13, FR-16, FR-25 | Dev B | S7 |
| EPIC-149 | L'instance garde la confiance, même coupée de Money Vibes | FR-15 | Dev B | S7 |
| EPIC-150 | La licence signée ouvre, prolonge ou sanctionne | FR-14, FR-32, FR-41 | Dev B | S7 |
| EPIC-153 | Sauvegarder et restaurer sans jamais reculer la confiance | NFR-7 | Dev A (écrans : Dev B) | S8 |
| EPIC-151 | Mettre à jour sans peur : essayer, promouvoir, revenir | FR-17, FR-18, FR-22, FR-24 | Dev B | S8 |
| EPIC-154 | Support à distance à la demande | FR-23 | Dev A (écrans : Dev B) | S9 |
| EPIC-152 | Correctifs de sécurité et fin de maintenance | FR-19 | Dev B | S9 |
| EPIC-157 | Consentements et indicateurs de niveau 0 | FR-26, FR-27 | Dev B | S9 |
| EPIC-156 | Vagues et fenêtre N/N-1 outillées | FR-20, FR-21 | Dev A (écrans : Dev B) | S9 → S10 |
| EPIC-158 | Apprentissage : échantillons, contributions, modèle commun | FR-28 → FR-31 | Dev A (écrans : Dev B) | S10 → S13 |

**Dépendances** : 142 → 143 → 144 → 145 → 146 → 147 → 160 (chemin de la démo, S5 et S6) ; 145 → 159 ; 148 → 149, 150, 151, 153, 154 ;
151 → 152, 156 ; 149 → 157 → 158. Chaque épic fonctionne avec ceux qui le précèdent seulement.

## Plan semaine par semaine : quatre chantiers par développeur et par semaine

Décision du PO (2026-11-11) : les deux développeurs sont chargés au maximum, **quatre chantiers par personne et par semaine**,
pour que février tienne ; le chemin de la démo (142 → 160) tient en deux semaines ; chaque démo déroule **tout le parcours
métier présent dans le code** ; l'app expert-comptable passe **sur le moteur** avant le 15/01. Les modules de Dev A hors
moteur (réseau, coque, PDV, catalogue-produits, stock, microfinance) sont repris du plan v3.

**Ordre de priorité du PO (2026-11-11)** : l'app expert-comptable d'abord, parce qu'elle est déjà bien avancée et doit être
clôturée vite ; puis le distributeur et l'assurance ; la microfinance en dernier, là où il reste du temps à gagner.

| Semaine | Dev A (4 chantiers) | Dev B (4 chantiers) | Croisement et fin de semaine |
|---|---|---|---|
| **S4** 30/11 → 04/12 | EPIC-155, **passage unique du socle** : client Kafka Confluent et Karapace dans **tous** les dépôts ; MongoDB 8.0 dans le Compose de développement ; Node 24 et gardes C6/C12/C13 dans les **dépôts de Dev B** (catalogue, auth, paiement, notification) · ses chantiers du plan v3 | stories d'EPIC-142 → 147 et 159 prêtes (amendement §4) | 🔁 **04/12** : le socle est neuf ; Dev B entre dans ses dépôts sans que Dev A y revienne |
| **S5** 07/12 → 11/12 | coque : squelette, doublure, lecture de l'état publié, menu, garde unique, `<Ecriture>` · réseau (finition) · PDV bloc 1 · EPIC-155 : Node 24 et gardes dans les dépôts du **cabinet** | EPIC-142 · EPIC-143 · EPIC-144 (avec les recettes croisées réécrites) · EPIC-145 (la matrice des neuf états en premier), **avec leurs écrans** (console, coque `moteur`) | 🔁 **11/12** : contrat d'état publié figé, matrice et garde publiées dans `prospera-plateforme` ; une offre s'installe dans l'essai ; la coque allume son menu |
| **S6** 14/12 → 18/12 | coque : modules d'écran métier **distributeur** et **assurance** · catalogue-produits · stock · EPIC-160 : offres et jeux de démonstration du distributeur et de l'assurance | **EPIC-159 en premier** : le cabinet sur le moteur, de bout en bout · EPIC-146 · EPIC-147 (jeu de démonstration, cinq essais simultanés) · EPIC-160 côté moteur | 🔁 **lundi 14/12** : contrat du jeu de démonstration (Dev B) ; 🎯 **cabinet sur le moteur** ; essais prospects distributeur et assurance qui s'ouvrent |
| *pause* 21/12 → 01/01 | — | — | — |
| **S7** 04/01 → 08/01 | stock (fin) · **microfinance** : modules d'écran et jeu de démonstration · recette des démos distributeur et assurance · EPIC-155 (fin : Node 24 et gardes dans ses propres dépôts) | EPIC-148 · EPIC-149 · EPIC-150 · recette et clôture du cabinet | 🔁 **08/01** : l'interface de l'agent est publiée ; agent et centrale vivants ; licence signée ; 🎯 **cabinet clôturé** |
| **S8** 11/01 → 15/01 | recette de la démo microfinance · EPIC-153 (dossier `sauvegardes/` de l'agent) · Integration Gate · démo | EPIC-151 · recette des trois démos et du cabinet · Integration Gate · démo · écrans d'EPIC-153 | 🎯 **démo du 15/01** : cabinet, puis distributeur, assurance, microfinance, chacun testable par le prospect |
| **S9** 18/01 → 22/01 | microfinance (démarrage client) · EPIC-154 (dossier `support/` de l'agent) · EPIC-156 (dossier `vagues/` de la centrale) · recette sur site | EPIC-151 (fin) · EPIC-152 · EPIC-157 · écrans « désinstaller et réinstaller » (EPIC-144) et d'EPIC-154 | 🔁 **lundi 18/01** : l'interface de la centrale est publiée ; promotions et retours arrière sur site |
| **S10** 25/01 → 29/01 | microfinance · EPIC-158 · EPIC-156 (fin) · durcissement de l'hôte | EPIC-157 (fin) · montage de l'instance de l'assureur · recette croisée des deux hébergements · écrans d'EPIC-156 | partie C ouverte (niveaux 0, 1, 3) |
| **S11 → S13** 01/02 → 19/02 | microfinance · EPIC-158 (fin) · réserve · corrections | mise en service des deux clients · écrans d'EPIC-158 · corrections · réserve | 🎯 **deux clients en service** (SM-2) |
| **S14** 22/02 → 26/02 | réserve | réserve | février tenu |

⚠️ **Ce plan suppose** que Dev A porte, **en plus** de ses modules, la S4 la plus lourde du programme (le passage unique du
socle) sans rien en retirer : c'est la décision du PO du 2026-11-11 (« il va pouvoir gérer lui seul »). Il entre ensuite sur
le moteur par EPIC-160, 153, 154, 156 et 158. Les semaines S11 → S14 sont la **réserve** : si une semaine glisse, l'ordre de
sacrifice du plan v3 §3 s'applique (EPIC-158 niveaux 3 et modèle commun, puis EPIC-156).

## Carte des dépôts semaine par semaine

**Règle du PO (2026-11-11)** : dans une même semaine, les chantiers de Dev A et de Dev B ne touchent jamais le même dépôt, pour
que chacun avance vite seul ; on ne croise qu'aux **points de croisement** nommés dans le plan, sur un contrat publié. Un
chantier transverse est fait **en entier** par un développeur dans une semaine ; l'autre le reprend la semaine suivante.

Deux dépôts sont partagés **par dossier**, parce que leur architecture le permet sans fichier commun :
- **`prospera-app`** : la mécanique de la coque (squelette, doublure, menu, garde, `<Ecriture>`) et les modules d'écran métier
  des verticales sont à **Dev A** ; **tous les écrans du moteur sont à Dev B** (décision du PO), dans deux dossiers à lui :
  le module **`instance`** (l'Administration) et le dossier **`moteur`** (bandeaux, écrans d'état, marque d'essai, compte à
  rebours), monté par la coque à un emplacement que Dev A publie le 11/12. Le menu et les droits se lisent dans l'état
  publié : aucun fichier n'est commun aux dossiers des deux développeurs (spine de la coque).
- **Console Money Vibes** : à Dev B, **y compris les écrans des épics dont le backend est à Dev A** (sauvegardes, support,
  vagues, apprentissage), écrits par Dev B sur l'API que Dev A livre.
- **`agent-instance`** et **`centrale-service`** : ce sont des dépôts de Dev B. Dev A n'y écrit que ses dossiers (`sauvegardes/`
  et `support/` dans l'agent, `vagues/` dans la centrale), derrière l'interface que Dev B publie au croisement du 08/01 (agent)
  et du 18/01 (centrale).
- **`prospera-recette`** : une recette par dossier ; chacun écrit seulement les siennes.

| Dépôt | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|---|---|---|---|---|---|---|---|
| `platform-catalog-service` | A (socle) | B | B | B | B | B | B |
| `prospera-plateforme` (neuf) | — | B | B | B | B | B | B |
| `auth-service` | A (socle) | — | B | B | — | — | — |
| `prospera-paiement-service` | A (socle) | B | B | B | — | B | — |
| `prospera-notification-service` | A (socle) | — | — | B | — | B | — |
| console Money Vibes (`frontend-admin-panel`) | — | B | B | B | B | B | B |
| cabinet : `dossier-service`, `bilan-service`, `balance-service`, `prospera-fiscal-service`, `document-service`, `prospera-frontend-expert-comptable` | A (Kafka) | A (Node 24, gardes) | **B** (EPIC-159) | **B** (recette, clôture) | — | — | — |
| `prospera-app` (coque) | — | A + B (`moteur`) | A + B (`moteur`) | A + B (`moteur`, `instance`) | A + B (`moteur`, `instance`) | B | B |
| `prospera-distributeur` (hors de `MoneyVibes_Apps`) | A (Kafka) | A | A | A | A | — | — |
| `prospera-assurance-service` | A (Kafka) | — | A | A | A | — | — |
| `prospera-microfinance-service` | A (Kafka) | — | — | A | A | A | A |
| `kyc-service` | A (Kafka) | — | — | — | — | — | — |
| `agent-instance` (neuf) | — | — | — | B | B + A (`sauvegardes/`) | B + A (`support/`) | B |
| `centrale-service` (neuf) | — | — | — | B | B | B + A (`vagues/`) | B + A (`vagues/`) |
| `apprentissage-service` (neuf) | — | — | — | — | — | — | A |
| `prospera-recette` | — | B (recettes de 144) | B | A (démos) + B (cabinet) | A + B | A + B | B |

Les gardes C8 des modules de Dev A (distributeur, assurance, microfinance) adoptent la garde publiée le 11/12 **par Dev A**,
pendant ses semaines de module ; celles du cabinet, **par Dev B** dans EPIC-159.

## Tranches verticales : les écrans de chaque épic

Décision du PO (2026-11-11) : chaque épic est une **tranche verticale**, backend **et** écrans, livrée la même semaine (le
backend par le propriétaire de l'épic, **les écrans toujours par Dev B**), pour qu'un test de bout en bout la prouve (principe 0 du programme front). Les stories d'écran gardent
l'identifiant de leur série et sont recopiées dans `frontend-sprint-status.yaml` au slotting :
console Money Vibes `AP-38+` ; coque `prospera-app` `PRA-100+` ; app expert-comptable `FE-112+` — **toutes par Dev B**
(décision du PO du 2026-11-11), y compris pour les épics dont le backend est à Dev A. Dev A garde `PRA-01+` pour la mécanique
de la coque et les modules d'écran métier des verticales. La charge n'est **pas plafonnée** : quatre chantiers par personne et par semaine au minimum,
davantage quand une tranche l'exige.

| Épic | Console Money Vibes (`AP-`) | Coque `prospera-app` (`PRA-`) | App expert-comptable (`FE-`) |
|---|---|---|---|
| EPIC-142 | — | doublure de l'état publié branchée sur les contrats (spine de la coque AD-23) | — |
| EPIC-143 | catalogue des modules commerciaux, manifestes et dépendances avec leur raison, table de l'offre au menu | — | — |
| EPIC-144 | choisir l'offre (dépendances ajoutées, retrait refusé nommé) ; installer en une action ; bilan d'installation ; reprendre une installation interrompue ; désinstaller et réinstaller (**après la démo**, S9 : non montré le 15/01) | — | — |
| EPIC-145 | — | dossier `moteur` (S5) : écrans d'état, bandeaux de préavis et de lecture seule, sur la mécanique de la coque de Dev A (lecture, menu, garde unique, `<Ecriture>`) ; dossier `instance` (S7) : export par l'Administration, écran des rôles et droits | — |
| EPIC-146 | naissance dans les deux espaces, répétition générale, rejeu, mise en service et son bilan, rafraîchissement | dossier `moteur` (S6) : marque d'essai permanente, lien vers l'autre espace | — |
| EPIC-147 | créer et prolonger une offre d'essai prospect, **avec ou sans jeu de démonstration**, signature ; tenue de **cinq essais simultanés** | dossier `moteur` (S6) : compte à rebours ; dossier `instance` (S7) : export pendant `ESSAI_TERMINE` | — |
| EPIC-148 | parc des instances (liste, dernier contact, version, santé, niveau d'ancrage), montage et enrôlement | — | — |
| EPIC-149 | reculs et bifurcations d'empreinte, ré-ancrage par fichier | bandeau de gel | — |
| EPIC-150 | licences émises, sanctions décidées, fin de contrat | dépôt d'une licence ou d'un fichier (Administration) | — |
| EPIC-151 | publier une version, suivre les promotions | Administration : voir les mises à jour, essayer, choisir la date, revenir en arrière, avancement, dépôt d'un fichier de mise à jour | — |
| EPIC-152 | publier un correctif, versions figées, alertes au DG | bandeau de version figée, correctif annoncé | — |
| EPIC-153 | état des sauvegardes et du test mensuel par instance | — | — |
| EPIC-154 | sessions de support ouvertes, journal | Administration : ouvrir et fermer le tunnel, journal (S9) | — |
| EPIC-155 | Node 24 dans la console | Node 24 dans la coque | Node 24 dans l'app expert-comptable |
| EPIC-156 | vagues, incidents, fenêtre N/N-1 | — | — |
| EPIC-157 | lecture du registre des consentements | Administration : consentement du DG et registre | — |
| EPIC-158 | approbation des exports, contributions, modèles communs | — | — |
| EPIC-159 | — | — | lecture de l'état publié (types générés, matrice partagée), menu et garde selon C8, bandeaux, lecture seule, écrans d'Administration du cabinet |
| EPIC-160 | offres d'essai prospect des trois verticales, ouvertes sur place à chaque prospect qui le veut, chacune avec son **jeu de démonstration** | modules d'écran de démo : distributeur (réseau, PDV, catalogue, stock), microfinance (crédit, collecte, épargne), assurance (sinistres de la déclaration à la clôture, polices), **tels que le code les présente aujourd'hui** (l'assurance sans GED ni OCR de lot, retirés des S7-S8 par l'amendement §6) | — |

## Comment lire les épics : chaque épic est livré backend **et** écrans

Décision du PO (2026-11-11) : un épic n'est pas fini quand son backend l'est. Chaque épic ci-dessous porte **deux blocs de
même rang**, *Backend* et *Écrans*, et une condition de fin qui exige les deux : l'écran est prouvé **de bout en bout sur le
vrai backend, sans aucun mock** (Integration Gate, principe 0 du programme front). Les écrans vivent dans trois apps :

| App | Dépôt | Rangement | Série d'identifiants |
|---|---|---|---|
| Console Money Vibes | `frontend-admin-panel` | un dossier par fonctionnalité (`src/features/<f>/`, `src/app/(app)/<f>/`) | `AP-38+` |
| Coque `prospera-app` (Administration, bandeaux, modules des verticales) | `prospera-app` | mécanique de la coque et modules métier à Dev A ; dossiers `instance` et `moteur` à Dev B | `PRA-01+` (Dev A), `PRA-100+` (Dev B, tous les écrans du moteur) |
| App expert-comptable | `prospera-frontend-expert-comptable` | `src/features/<f>/` | `FE-112+` |

**Qui fait les écrans.** Décision du PO (2026-11-11) : **tous les écrans du moteur sont faits par Dev B**, y compris ceux
des épics dont le backend est à Dev A (EPIC-153, 154, 156, 158) : la tranche reste verticale, mais à deux mains, et sa
condition de fin est commune. Dev A garde ce qui n'est pas un écran du moteur : la **mécanique de la coque** (squelette,
doublure, lecture de l'état publié, menu, garde unique, `<Ecriture>`) et les **modules d'écran métier** des verticales
(EPIC-160), ses chantiers du plan v3. Dans `prospera-app`, Dev B écrit dans deux dossiers à lui : le module **`instance`**
(l'Administration) et un dossier **`moteur`** (bandeaux, écrans d'état, marque d'essai, compte à rebours), que la coque
monte à un emplacement publié par Dev A au croisement du 11/12 (emplacement exact à fixer avec lui ce jour-là).

**Points.** Chiffrage **au 04/12** (amendement du plan v3 §5), épic par épic, sur ce découpage.

**Stories.** Aucune n'est écrite ici, comme pour le stock : la fiche est écrite **par celui qui code la story, juste avant de
la coder**, avec la skill de création de story. Dev B consomme `STORY-900 → 1199`, Dev A `STORY-730 → 899` ; les écrans
prennent leur identifiant dans leur série (`AP-`, `PRA-`, `FE-`). Les lignes « Backend » et « Écrans » de chaque épic sont la
liste de ce que ces fiches doivent couvrir, pas un découpage imposé.

## Ce que l'amendement §4 demandait « avant la semaine 5 » : où cela vit maintenant

L'amendement listait des stories « sans numéro encore ». Elles ne deviennent pas des fiches à part : ce sont des lignes des
épics.

| Demande de l'amendement §4 | Épic | Semaine |
|---|---|---|
| `auth-service` : route de naissance à identifiant imposé, réservée à l'identité de service du moteur ; format de droit élargi aux codes à tiret ; droit de consentir au DG seul | EPIC-142 | S5 (décision du PO du 2026-11-11 : Dev A tient `auth-service` en S4 pour le socle) |
| `platform-catalog-service` : Redis et BullMQ, verrou de l'outbox | EPIC-142 | S5 |
| `platform-catalog-service` : champs de manifeste de `ModuleVersion` | EPIC-143 | S5 |
| `platform-catalog-service` : retrait des quatre chemins d'octroi et réamorçage | EPIC-144 | S5 |
| double lecture de l'état publié dans les gardes de paiement, microfinance, bilan, notification, balance | EPIC-145 (garde publiée), puis chaque propriétaire à sa semaine (carte des dépôts) | S5 → S7 |
| `prospera-plateforme` : dépôt, contrats agent-centrale-partie A, vecteurs signés | EPIC-142 | S5 |
| `prospera-plateforme` : CI de publication | EPIC-151 | S8 |
| socle d'espace : Karapace, MongoDB 8.0, Node 24 ; migration vers `@confluentinc/kafka-javascript` | EPIC-155 | S4 → S7 |
| `paiement-service` : read-model de manifestes pour la vente | EPIC-143 | S5 |
| `paiement-service` : faits de paiement relayés par l'agent de la plateforme | EPIC-150 | S7 |
| STORY-727 lots 6 et 7 (pack modifié = nouveaux contrats ; le socle de vertical n'ouvre plus rien) | EPIC-143 | S5 |
| STORY-727 lot 2 (une échéance soldée prolonge, ne crée plus de droit) | EPIC-144 | S5 |
| STORY-727 lot 4 (préavis de 30 jours, liste blanche d'export et d'états) | EPIC-145 | S5 |
| STORY-280 et STORY-281 (l'impayé ne suspend plus ; J-7 devient `RAPPEL`) | EPIC-150 | S7 |
| STORY-365 requalifiée (filtrage par modules ouverts, droits lus dans les manifestes) | EPIC-145 | S5 |

## Contraintes d'ordre à ne pas défaire

- ⛔ **EPIC-155 (passage du socle) est fini le 04/12**, avant que Dev B entre dans le catalogue, `auth-service`, paiement et
  notification. Un reste du socle dans un dépôt de Dev B attend la semaine suivante : il ne se fait pas en même temps.
- ⛔ **EPIC-142 fige le contrat d'état publié le 11/12** : la doublure de la coque (Dev A) et la garde partagée se
  construisent dessus. Après le 11/12, le contrat ne change que par **ajout** (AD-24).
- ⛔ **La matrice des neuf états est la première story d'EPIC-145** : le compte à rebours (147), la marque d'essai (146), les
  bandeaux de la coque et la garde de chaque module la lisent.
- ⛔ **Le retrait des quatre chemins d'octroi (144) est livré avec la réécriture des cinq recettes croisées**, et avec la
  réamorce des droits de test **par le moteur** : sinon les recettes rougissent sur `dev` et l'app expert-comptable se ferme
  avant EPIC-159.
- ⛔ **EPIC-149 précède EPIC-150 dans la S7** : une licence ne s'accepte qu'au regard du plus haut numéro vu et de l'heure de
  référence, qui sont dans l'état de confiance.
- ⛔ **EPIC-157 précède l'envoi d'échantillons d'EPIC-158** : aucun export sans consentement en vigueur.
- ⚡ **Seule ligne d'un épic qui attend un épic plus tardif** : le **rafraîchissement** (146) est exécuté par l'agent ; il
  s'écrit côté partie A en S6 et se joue de bout en bout quand l'agent existe (148, S7). EPIC-146 reste **non divisé**.
- ⚡ **Le bilan de montage (148) inclut « sauvegarde testée par une restauration »**, qui est livrée par EPIC-153 en S8 : le
  montage d'une instance de client (S10) vient après les deux.

## Les épics les plus risqués

**Pour la démo du 15/01 : EPIC-145.** Son erreur ne se voit pas en test fonctionnel : une garde qui lit encore
`entitlement.changed`, ou une transition calculée sur `Date.now()`, rend des écrans **justes la plupart du temps** et faux
le jour d'une échéance, c'est-à-dire devant un prospect ou un client. ⇒ Sa condition de fin porte un **test de mutation** :
falsifier `echeanceLe` dans `entitlement.changed` ne change **aucune** décision de garde, et la matrice rejouée par la partie
A et par la doublure de la coque donne **le même résultat, cas par cas**.

**Pour février : EPIC-149.** Une faille de l'état de confiance donne une licence éternelle ou un consentement retiré qui
revient avec une sauvegarde : rien ne le signale tant que personne n'attaque. ⇒ Sa condition de fin est la **suite
d'attaques** de la spine, jouée en recette : « + 10 ans », « recul de 40 jours », « restaurer une sauvegarde de six mois »,
jumeau de VM, magasin restauré sous son miroir, licence rejouée, clé révoquée, fichier modifié.

---

## Les épics en détail

### EPIC-142 : Un contrat d'état publié stable, et un socle prêt pour le moteur · à chiffrer au 04/12

**Dev B · S5 · Autonome : oui · Amont : EPIC-155 (socle du 04/12)** · Client : la doublure de la coque de Dev A (contrat
figé le 11/12) · FR-34 et FR-42 (socle) · AD-6, AD-15, AD-17, AD-24, AD-26, AD-27, AD-28, AD-41, AD-42 · Dépôts :
`platform-catalog-service`, `prospera-plateforme` (neuf), `auth-service`.

**Backend**
- `contrat/etat-publie.openapi.json` et `contrat/matrice-etats.json` dans `platform-catalog-service` : la forme complète de
  l'état publié (par organisation × module, par instance, `droitsEffectifs` par appelant), versionnée, **ajouts seulement**
  après le 11/12 (AD-24).
- Dépôt **`prospera-plateforme`** créé : les contrats entre agent, centrale et partie A en **JSON Schema**, avec leurs
  **vecteurs signés** (JWS compact Ed25519, charge en JCS, champs `kid`, `iat`, `numero`, `instanceId`, `audience`), et le
  paquet `point-de-decision` amorcé (sa logique arrive avec EPIC-144).
- **Amendement (2026-11-12, spine de Connecteurs, AD-21 et AD-31).** La matrice `contrat/matrice-etats.json` (partie A, à
  sa publication) compte, en lecture seule (PRD moteur FR-43), une **troisième famille de routes autorisées**, l'**échange
  entrant** : quatre opérations passent (`APPLIQUER_OBJET`, `ENREGISTRER_MOUVEMENT`, `CONFIRMER`, `REFUSER`), `CORRIGER` non.
  Elle compte aussi deux **sortes de route** de plus : « échange » (par opération) et « contrôles à deux identités »
  (Reprise et Connecteurs, la Reprise seule en `EN_INSTALLATION` du réel).
- ⛔ Les vecteurs sont signés par une **racine de test** ; un agent de production refusera toute racine qui n'est pas de
  production (AD-28).
- `platform-catalog-service` : **Redis et BullMQ** entrent dans son périmètre ; l'outbox prend un **verrou** (AD-42).
  ⛔ BullMQ ne sert qu'à **émettre** `etat-publie.changed` à l'heure dite ; il ne calcule jamais un état (AD-6).
- `auth-service` : **route interne de naissance** d'organisation à identifiant imposé, réservée à l'identité de service du
  moteur, **idempotente** sur cet identifiant, sans utilisateur ; publie `identity.org.created` (AD-15) ; **format de droit
  élargi** aux codes de module à tiret ; le module `instance` est un module comme les autres ; le droit de **consentir** est
  attribuable par le DG seul (`CONSENTEMENT_RESERVE_AU_DG`).
- ⚡ **Premier incrément d'AD-41** : un agent simulé contacte une centrale simulée, vérifie un état voulu signé et applique
  une licence, avec le test croisé. Il peut se finir en S6 (AD-41).
- ⛔ Graphie : le neuf écrit `organisationId` ; l'existant garde la sienne (`orgId`, `organizationId`), un renommage passe
  par un topic `@2` (AD-27).

**Écrans**
- Coque (Dev A, mécanique de la coque S5, ce n'est pas un écran du moteur) : la **doublure** de l'état publié branchée sur le contrat publié (spine de la coque
  AD-23), qui lit `contrat/matrice-etats.json` au lieu d'une copie.

**Fin de l'épic**
- Le contrat est publié et étiqueté le 11/12 ; la doublure de la coque le rejoue sans écart.
- Les vecteurs sont rejoués par **deux** implémentations (agent simulé, centrale simulée).
- Deux appels de naissance avec le même identifiant créent **une** organisation ; un appel sans l'identité de service est
  refusé.

### EPIC-143 : Le catalogue connaît chaque module par son manifeste · à chiffrer au 04/12

**Dev B · S5 · Autonome : oui · Amont : EPIC-142** · FR-2, FR-3, FR-12, FR-37, FR-38 · AD-17, AD-23 · C1 amendé · Dépôts :
`platform-catalog-service`, `prospera-paiement-service`, console.

**Backend**
- Champs de manifeste dans `ModuleVersion` (C1 amendé) ; le catalogue garde une **copie par `ModuleVersion`**, comparée à la
  source `module.manifest.ts` du dépôt du service par une **garde de test** (AD-23).
- ⚡ La source `module.manifest.ts` s'écrit dans le dépôt de chaque service **par son propriétaire de la semaine** (carte des
  dépôts) : Dev B enregistre au catalogue les manifestes des modules de la démo et du cabinet ; la garde compare dès que les
  deux existent.
- Refus nommés : `MODULE_DEPENDANCE_MANQUANTE` (422), `MODULE_REQUIS_PAR`, `MANIFESTE_CYCLE`, `MANIFESTE_DEPENDANCE_MINEURE`,
  `AVEC_PERTE_INTERDIT_PLATEFORME`. `reseau` est enregistré au nouveau format ; le moteur est le module `instance`,
  `depends: []`.
- Publication du contrat **`catalogue.manifeste.publie`** (AD-17).
- Champ **`objetsDeReprise`** dans `ModuleVersion` (C1 amendé le 2026-11-11, spine de la Reprise AD-2 et AD-16), couvert
  par la garde source/copie ; le manifeste M44 (`reprise`) est le premier écrit, dans `prospera-stories/manifestes/`.
- **Amendement (2026-11-12, spine de Connecteurs, AD-2 et AD-31).** Champ **`domainesEchange`** dans `ModuleVersion` (C1
  amendé le 2026-11-12), couvert par la même garde source/copie ; le catalogue refuse un manifeste qui viole les règles
  de la spine de Connecteurs (`argent` sans `controle`, `objets` hors de `contrats/objets/<code>/`). **L'association
  objet → domaine** (le domaine d'un objet est celui qui le liste) est **rendue à la Reprise** depuis le catalogue.
- `paiement-service` : **read-model de manifestes** pour la vente, qui résout les dépendances dures **comme la console**,
  refuse un élément non installable, un seul mode d'acquisition par élément (amendement §4).
- FR-12, le contrat fait foi : un pack modifié ne s'applique qu'aux **nouveaux contrats**, la propagation ne crée plus de
  droit ; le socle de vertical n'ouvre plus rien, `VerticalPack` devient le **catalogue du vertical** (STORY-727, lots 6 et 7).
- FR-37 : la table de l'offre au menu (quel module de l'offre allume quelle entrée de menu).

**Écrans**
- Console (`AP-`) : le catalogue des modules commerciaux ; la fiche d'un manifeste avec ses dépendances et **leur raison** ;
  les refus affichés par leur nom (`MANIFESTE_CYCLE`, `MODULE_REQUIS_PAR`) ; la table de l'offre au menu.

**Fin de l'épic**
- Un cycle est refusé ; une mineure qui ajoute une dépendance dure est refusée ; la console affiche le refus nommé.
- La console et `paiement-service` résolvent **la même offre à l'identique** (test de contrat joué des deux côtés).

### EPIC-144 : Installer une offre en une action, par un seul point de décision · à chiffrer au 04/12

**Dev B · S5 (écrans de désinstallation en S9) · Autonome : oui · Amont : EPIC-143** · FR-1, FR-4 → FR-7, FR-39, FR-40 ·
NFR-5, NFR-6 · AD-23, AD-40 · Dépôts : `platform-catalog-service`, `prospera-plateforme`, console, `prospera-recette`.

**Backend**
- **Point de décision unique** : la logique du paquet `point-de-decision` (publié par `prospera-plateforme`), embarqué tel
  quel par la partie A et, plus tard, par la centrale ; une seule suite de conformité, une **preuve par mutation**. Ordre des
  refus : `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE` ; sur site, `MODULE_HORS_LICENCE` seul.
- Choisir l'offre : dépendances ajoutées avec leur raison (FR-1, FR-2), retrait refusé nommé (FR-3).
- **Installation = plan enregistré**, idempotent, aux étapes horodatées (mesure de NFR-5 et de SM-7) ; prérequis vérifiés
  pendant l'installation sans bloquer le reste (FR-5) ; **vérifications réelles** (FR-6) ; bilan et passage « En service »
  (FR-7), publiés par `instance.bilan.changed`.
- Une installation interrompue **reprend à son étape** (FR-40).
- **Bascule** : retrait des quatre chemins qui posent `ACTIVE` (`octroi-par-abonnement`, `octroi-par-vertical`,
  `propagation-des-packs`, le `PUT` d'entitlement) et de la migration `rattrapage-packs` ; les droits de test de `dev` sont
  **réamorcés une seule fois, par le moteur** ; une échéance soldée prolonge les modules installés et note les autres
  « acquis, à installer », sans créer de droit (STORY-727 lot 2).
- ⚡ **Transition du cabinet** : la réamorce passe par le moteur, dont les droits projetés continuent d'émettre
  `entitlement.changed` (fait d'octroi) ; les gardes actuelles du cabinet le lisent jusqu'à EPIC-159. Le cabinet ne se ferme
  donc pas entre le 11/12 et la S6.
- Réécriture des recettes croisées **631, 632, 649, 650/651 et 728** de `prospera-recette` sur le point de décision unique,
  livrée **avec** le retrait.
- FR-39, désinstaller et réinstaller : `MODULE_REQUIS_PAR` ; réinstaller retrouve les données.
- ⛔ Aucun chemin ne pose `ACTIVE` hors du moteur : un test le vérifie.

**Écrans**
- Console (`AP-`), **S5** : choisir l'offre (dépendances ajoutées et leur raison, retrait refusé nommé) ; installer en une
  action ; le **bilan d'installation**, qui passe au vert ligne par ligne ; reprendre une installation interrompue.
- Console (`AP-`), **S9** (après la démo, décision du PO) : désinstaller et réinstaller.

**Fin de l'épic**
- Le pack distributeur s'installe dans l'essai en **moins de 15 minutes**, mesurées par les étapes du plan, **depuis l'écran**.
- Une coupure à une étape tirée au hasard reprend à cette étape ; rejouer ne crée aucun doublon (NFR-6).
- Les cinq recettes croisées sont vertes sur des images **reconstruites depuis `dev`** ; l'app expert-comptable fonctionne
  toujours.

### EPIC-145 : L'état publié fait foi pour la coque et pour chaque garde · à chiffrer au 04/12

**Dev B · S5 · Autonome : oui · Amont : EPIC-144** · FR-34, FR-35, FR-43 · AD-6, AD-17, AD-24 · Dépôts :
`platform-catalog-service`, `prospera-plateforme` (garde partagée), `prospera-paiement-service`.

**Backend**
- **Première story : la matrice des neuf états** (C2), en cas exécutables (droit `ACTIVE` sans installation, recul, avance),
  publiée dans `contrat/matrice-etats.json` et rejouée par la partie A **et** par la doublure de la coque.
- L'état publié **se calcule à la lecture**, depuis les faits et le port **`HorlogeDeReference`** (sur la plateforme :
  l'horloge de Money Vibes ; sur site : `GET /heure`, branché avec EPIC-148). ⛔ Aucun `Date.now()` pour décider ; si l'heure
  est indisponible, aucune échéance ne tombe, `HORLOGE_INDISPONIBLE` (AD-6).
- La vraie route **`GET /api/instance/v1/etat-publie/{organisationId}`**, servie avant la démo.
- Émission de `etat-publie.changed.essai` et `.reel` par des tâches BullMQ à l'heure dite, clef
  `<organisationId>:<module>:<transition>:<date>:<epoque>` ; les tâches manquées sont rejouées au redémarrage.
- `droitsEffectifs` = droits du jeton de l'appelant ∩ état des modules ; la partie A ne tient aucun read-model des membres.
- **Garde partagée** publiée dans `prospera-plateforme` le 11/12 : elle applique l'**état publié seul** ;
  `entitlement.changed` ne ferme plus rien. Chaque consommateur existant joue un test de **double lecture** avant le retrait,
  **par le propriétaire de son dépôt et à sa semaine** : paiement (Dev B, S5), notification (Dev B, S7), bilan et balance
  (Dev B, EPIC-159), microfinance (Dev A, S7).
- FR-35 : les droits de tenant suivent l'installation (STORY-365 requalifiée : filtrage par modules ouverts, droits lus dans
  les manifestes).
- FR-43 : la lecture seule et l'export suivent **une seule règle** : préavis de 30 jours (`preavisJusquau`) avant la lecture
  seule, liste blanche d'export et d'états (STORY-727 lot 4).

**Écrans**
- Coque, dossier `moteur` (Dev B, `PRA-100+`, S5) : **écrans d'état** (les neuf états), **bandeaux** de préavis et de lecture
  seule, branchés sur la mécanique de la coque de Dev A (lecture de l'état publié, menu par code, garde unique,
  `<Ecriture>`).
- Coque, dossier `instance` (Dev B, S7) : export par l'Administration ; écran des rôles et droits effectifs.

**Fin de l'épic**
- La matrice rejouée par la partie A et par la doublure de la coque donne **le même résultat, cas par cas**.
- **Test de mutation** : falsifier `echeanceLe` dans `entitlement.changed` ne change aucune décision de garde.
- En avançant le port d'heure de 31 jours, le bandeau de préavis, puis la lecture seule, apparaissent **à l'écran** de la
  coque, sans rechargement manuel au-delà de la lecture périodique de 30 secondes.

### EPIC-146 : Deux espaces : essayer, puis mettre en service (non divisé, pour les tests) · à chiffrer au 04/12

**Dev B · S6 · Autonome : oui · Amont : EPIC-145 ; le rafraîchissement se joue de bout en bout avec EPIC-148** · FR-8 →
FR-11, FR-42 · NFR-3 · AD-10, AD-15, AD-17, AD-21 · Dépôts : `platform-catalog-service`, `auth-service`, console.

**Backend**
- **Naissance** : ordre de la console (`POST /api/instance/v1/naissances`), puis, dans chaque espace, la route interne
  d'`auth-service`, `identity.org.created`, le module `instance` (chemin 0), l'invitation ; même identifiant dans les deux
  espaces ; l'invitation au réel part à la mise en service.
- **L'essai ne se confond pas avec le réel** (FR-9) : aucun secret d'écriture du réel dans l'essai ; la partie A tient la
  liste blanche des sorties et le journal des interceptions ; chaque module intercepte (C13) :
  `ECRITURE_REELLE_DEPUIS_ESSAI`.
- **Répétition générale, puis mise en service** (FR-8) : le dossier d'installation passe de l'essai au réel **sans donnée
  métier**, rejoué par la route d'import C13 de chaque propriétaire ; la Reprise mise en service la première dans le réel ;
  tant qu'un module attendu n'est pas `VERT` (`reprise.feu-vert.changed`, par module, relu par la vérification
  `donnees-importees`), `MISE_EN_SERVICE_SANS_FEU_VERT` (spine de la Reprise, AD-12) ; bilan de mise en service ; `reception-definitive.enregistree`.
- **Rafraîchissement** (FR-10) : par organisation, vers un essai `ESSAI_CLIENT` seulement, jamais `ESSAI_PROSPECT` ; refusé
  pendant une répétition générale ; ordres `SUSPENDRE_ECHEANCES` et `REPRENDRE_ECHEANCES` ; masquage des champs personnels.
  ⚡ La partie A l'écrit en S6, l'agent l'exécute dès EPIC-148.
- FR-11 : un seul chemin pour tout changement.
- ⛔ Les **trois exceptions** de NFR-3, et seulement elles, sont journalisées ; aucun service d'un espace ne connaît l'adresse
  de l'autre.
- ⛔ La partie A de l'essai n'émet **aucune transition de contrat** avant d'avoir reçu le fait du réel (AD-21).

**Écrans**
- Console (`AP-`) : naissance d'une organisation dans les deux espaces ; répétition générale ; rejeu ; mise en service et son
  bilan ; rafraîchissement.
- Coque, dossier `moteur` (Dev B, S6) : **marque d'essai permanente**, lien vers l'autre espace.

**Fin de l'épic**
- Une organisation née deux fois n'en fait qu'une, avec le même identifiant dans les deux espaces.
- Une écriture vers le réel depuis l'essai est refusée et journalisée ; la Reprise est mise en service la première dans le
  réel ; un sous-ensemble dont un module attendu par la Reprise n'est pas `VERT` (relu par la vérification
  `donnees-importees`) est refusé, et la console affiche le refus nommé.
- ⚠️ Risque ouvert : les points d'import et les valeurs de contrôle des modules cibles (spine de la Reprise, AD-4 et AD-13)
  ne sont portés par aucun épic du moteur ; ils entrent dans les épics de la Reprise (EPIC-161 et suivants), et la charge
  qu'ils ajoutent aux propriétaires des modules cibles se mesure au chiffrage du 04/12.
- Le parcours « naissance → essai → répétition → mise en service » se joue **depuis la console**, sur le vrai backend.

### EPIC-147 : Le prospect essaie avant de signer (montré le 15/01 : la démo-vente) · à chiffrer au 04/12

**Dev B · S6 · Autonome : oui · Amont : EPIC-146** · FR-33 · AD-6, AD-12, AD-38 · Dépôts : `platform-catalog-service`,
`prospera-paiement-service`, console.

**Backend**
- Le fait **`ESSAI_PROSPECT`**, propriété de la partie A de la plateforme, sur l'horloge de Money Vibes : J0 → J+30, une
  prolongation avant la fin, **60 jours au plus** ; puis `ESSAI_TERMINE` et 30 jours pour exporter ou signer ; signer pendant
  `ESSAI_TERMINE` **rouvre l'essai sans perte** (AD-38).
- **Avis** 7 jours avant chaque fin, à l'administrateur du prospect et à son commercial, par le contrat d'envoi existant de
  `notification-service` (le modèle d'avis s'ajoute à la semaine de Dev B dans ce dépôt, S7).
- **Jeu de démonstration** (décision du PO, 18e séance) : option de l'offre d'essai. **En janvier**, l'essai s'ouvre **avec**
  le jeu de sa verticale et le prospect peut y ajouter ses propres données ; **à partir de février**, il s'ouvre **vide**. Le
  contrat du jeu est publié le **lundi 14/12** ; son contenu vient de chaque verticale (EPIC-160).
- **Cinq essais simultanés** sur l'hébergement Money Vibes : une story, recettée avant le 15/01.
- **Effacement** à la fin : plan enregistré et idempotent qui appelle la route d'effacement C13 de chaque propriétaire ;
  journaux pseudonymisés (AD-12) ; **certificat d'effacement** signé, avec la date d'expiration de la dernière sauvegarde qui
  contient les données.

**Écrans**
- Console (`AP-`) : créer une offre d'essai prospect (avec ou sans jeu de démonstration), la prolonger, la signer.
- Coque, dossier `moteur` (Dev B, S6) : **compte à rebours** de l'essai.
- Coque, dossier `instance` (Dev B, S7) : export pendant `ESSAI_TERMINE`.

**Fin de l'épic**
- En avançant l'horloge de 30 jours, l'essai passe en `ESSAI_TERMINE` **à l'écran** ; une deuxième prolongation est refusée ;
  signer rouvre sans perte.
- Cinq prospects ouvrent leur essai en même temps, chacun avec son jeu de démonstration, sans erreur ni lenteur visible.

### EPIC-159 : Le cabinet est installé par le moteur, et son app lit l'état publié · à chiffrer au 04/12

**Dev B · S6, en premier (clôture en S7) · Autonome : oui · Amont : EPIC-145 ; Node 24 du cabinet par Dev A en S5** ·
FR-34 → FR-37, FR-43 (cabinet) · AD-24 · C8 · Dépôts : `dossier-service`, `bilan-service`, `balance-service`,
`prospera-fiscal-service`, `document-service`, `prospera-frontend-expert-comptable`.

**Backend**
- Les manifestes des modules du cabinet sont au catalogue (EPIC-143) ; l'offre cabinet **s'installe par le moteur** dans
  l'essai, puis se met en service dans le réel de la plateforme.
- Les gardes des services du cabinet passent à la **garde partagée** : double lecture d'abord (bilan et balance sont dans la
  liste d'AD-24), puis retrait de la lecture de `entitlement.changed`.

**Écrans**
- App expert-comptable (`FE-`) : `features/modules` cesse de lire les entitlements (`get-entitlements.ts`,
  `resolve-modules.ts`) et lit l'**état publié** par la vraie route, avec des **types générés** depuis
  `contrat/etat-publie.openapi.json` et la **matrice partagée** ; menu et garde selon C8 ; bandeaux de préavis et de lecture
  seule ; lecture seule appliquée ; écrans d'Administration du cabinet.

**Fin de l'épic**
- Un cabinet installé par le moteur déroule **tout son parcours** dans l'app (dossier, balance, bilan, fiscal), sur des
  images reconstruites depuis `dev`, à l'Integration Gate, sans mock.
- Les cas de la matrice qui touchent le cabinet s'affichent comme dans la coque.
- 🎯 **Cabinet clôturé en S7.**

### EPIC-160 : Les démos du 15/01 : chaque prospect ouvre son propre essai et teste sur place tout le parcours de sa verticale · à chiffrer au 04/12

**Dev A · S6 → S8 · Autonome : non, bloqué par EPIC-147 (offre d'essai et contrat du jeu de démonstration du 14/12)** ·
SM-1 élargi · C8, C13 · Dépôts : `prospera-app` (modules d'écran), `prospera-distributeur`, `prospera-assurance-service`,
`prospera-microfinance-service`, `prospera-recette`.

**Backend**
- Une **offre d'essai prospect par verticale**, montée par le moteur : distributeur (réseau, PDV, catalogue-produits, stock),
  assurance (polices, sinistres de la déclaration à la clôture, **tels qu'ils sont aujourd'hui dans le code**, sans GED ni
  OCR de lot), microfinance (crédit, collecte, épargne).
- Un **jeu de démonstration** par verticale, assez riche pour dérouler tout le parcours sans saisie préalable.
- Les **routes C13** des modules de la démo : import (pour le jeu de démonstration), effacement (fin d'essai), interception
  des sorties de l'essai.
- La garde de chaque module de Dev A adopte la **garde partagée** du 11/12, avec la double lecture pour la microfinance
  (AD-24).
- Ordre (priorité du PO) : distributeur et assurance en S6 ; microfinance en S7 ; recette en S7 et S8.

**Écrans**
- Coque (`PRA-`, Dev A) : les modules d'écran des trois verticales, avec tout leur parcours métier tel que le code le
  présente.

**Fin de l'épic**
- Un prospect de chaque verticale ouvre **son** essai sur place, avec le jeu de démonstration, ajoute ses propres données et
  déroule le parcours complet ; à l'Integration Gate de la S8, sur le vrai backend, sans mock.

### EPIC-155 : La version de plateforme 1.0 tourne sur un socle maintenu · à chiffrer au 04/12

**Dev A · S4 → S7 · Autonome : oui** · règle de FR-21 · AD-27, AD-42 · C6, C12, C13 · Dépôts : tous, selon la carte.

**Backend**
- **S4, passage unique**, fini le 04/12 :
  - `kafkajs` remplacé par **`@confluentinc/kafka-javascript` 1.11** dans **tous** les dépôts (dans le catalogue : les cinq
    fichiers qui l'importent, l'interface de `KafkaProducerService` inchangée) ;
  - **Karapace 6.2** dans le socle de chaque espace, client `@confluentinc/schemaregistry` 1.11, JSON Schema, compatibilité
    **BACKWARD vérifiée en CI** ;
  - **MongoDB 8.0** dans le Compose de développement ;
  - dans les dépôts de Dev B (catalogue, auth, paiement, notification) : **Node 24**, **BullMQ 6** et les **gardes C6, C12,
    C13** posées au gabarit.
- **S5** : Node 24 et gardes dans les dépôts du cabinet. **S6 → S7** : dans les dépôts de Dev A, à mesure qu'il y passe.
- ⛔ Une graphie existante ne change que par un topic `@2` (AD-27). ⛔ Aucune migration au démarrage d'un service (C12).

**Écrans**
- Node 24 dans la console, la coque et l'app expert-comptable, au même passage que leur dépôt.

**Fin de l'épic**
- ⚡ **`docker compose up` de toute la pile démarre**, chaque service sain : des tests verts ne suffisent pas, un module Nest
  mal câblé ne se voit qu'au démarrage.
- Les schémas sont enregistrés dans Karapace ; une modification incompatible rougit la CI.
- Les recettes croisées sont vertes sur des images reconstruites depuis `dev`.

### EPIC-148 : Monter une instance sur site et la superviser · à chiffrer au 04/12

**Dev B · S7 · Autonome : oui · Amont : EPIC-142 (contrats), EPIC-155 (socle)** · FR-13, FR-16, FR-25 · NFR-2, NFR-10 ·
AD-3, AD-9, AD-10, AD-19, AD-29, AD-34, AD-36, AD-37, AD-40 · Dépôts : `agent-instance` et `centrale-service` (neufs),
`prospera-plateforme`, console.

**Backend**
- Naissance de **`agent-instance`** (port 3403) et de **`centrale-service`** (port 3401), sur Node 24 et le client Kafka de
  Confluent dès le premier commit.
- L'agent en **deux processus** : un exécuteur, seul à avoir le socket Docker, et un contact sans privilège (AD-36) ; magasin
  **SQLite chiffré**, clé sur le second support (AD-34) ; **bail exclusif** et ligne de version propre (AD-3).
- **Gabarit Compose** de l'instance dans `prospera-plateforme` : trois projets (`-essai`, `-reel`, `-agent`), un seul
  Traefik, socle d'espace (auth, catalogue, Kafka, Karapace, MongoDB 8.0 en jeu de réplicas à un nœud, Redis, MinIO), aucun
  port publié ; ⛔ `privileged`, montages de l'hôte, `network_mode: host` et capacités ajoutées interdits, vérifiés par test.
- **Montage** (FR-25) : refus sous la configuration minimale ou sans disque chiffré ; secrets et clé mTLS générés sur place ;
  certificat obtenu par le **jeton d'enrôlement** à usage unique (AD-29) ; état de confiance initialisé ; bilan de montage.
- **Contact** sortant en mTLS sur le 443, vers deux noms seulement ; vérification quotidienne et squelette du signal
  hebdomadaire (son contenu de niveau 0 arrive avec EPIC-157) ; `GET /heure` servi par l'exécuteur et branché au port
  d'heure de la partie A.
- **Commandes** (AD-37) : `POST /api/instance/v1/commandes`, `instance.commande.deposee` qui porte le jeton, revérifié par
  l'agent, puis `instance.commande.executee`.
- **Supervision** (FR-16) : parc, dernier contact, version, santé, niveau d'ancrage ; alerte de silence à **J+7** au DSI et à
  Money Vibes ; « agent muet » distinct de « centrale muette » (AD-40) ; sonde des empreintes lancées (SM-3).
- La **plateforme** est une instance comme les autres, sauf les sept points d'AD-19.
- 🔁 **08/01** : l'interface de l'agent est publiée pour les dossiers backend de Dev A (`sauvegardes/`, `support/`).

**Écrans**
- Console (`AP-`) : le **parc des instances** (liste, dernier contact, version, santé, niveau d'ancrage) ; le **montage** et
  l'enrôlement (émettre un jeton, suivre le bilan de montage).

**Fin de l'épic**
- Sur un serveur de recette, le montage est **refusé** sans disque chiffré et réussit sinon ; le premier signal est confirmé
  par la centrale et l'instance apparaît **dans la console**.
- Un balayage de ports ne trouve aucun port entrant ; un redémarrage de l'agent garde son bail.

### EPIC-149 : L'instance garde la confiance, même coupée de Money Vibes · à chiffrer au 04/12

**Dev B · S7, avant EPIC-150 · Autonome : oui · Amont : EPIC-148** · FR-15 · NFR-4, NFR-11 · AD-4, AD-5, AD-7, AD-9, AD-12,
AD-22, AD-28, AD-35 · Dépôts : `agent-instance`, `centrale-service`, console.

**Backend**
- **État de confiance** (AD-4) : horloge scellée, plus haut numéro de licence par clé, heure de référence, registre des
  consentements, tête du journal, époque, niveau d'ancrage ; niveau `LOGICIEL` en v1 ; **miroir qui n'avance que** sur le
  second support ; compteur incrémenté à chaque contact préparé ; Money Vibes **témoin** : recul, bifurcation, lacune.
- **Horloge scellée** (AD-5), trois règles : allumée, jamais plus de 48 h d'avance sur le temps mesuré ; éteinte, la date du
  serveur seulement si elle avance, de 48 h au plus ; seule une heure de référence signée de numéro plus élevé la corrige.
- **Gel** à **30 jours pour toutes les instances** (`gelApresJours` dans l'état voulu), fait `instance.etat.modifie`, levé au
  premier contact ; un seuil modifié ne raccourcit jamais un silence déjà écoulé. En gel, seules les commandes de fichier et
  de support passent (FR-35).
- **Journal chaîné** (AD-12) : enveloppe unique sur `instance.journal` ; l'agent ajoute `rang` et `empreintePrecedente`,
  hache en JCS, garde la tête ; dédoublonnage par `idempotence` ; tampon et fait « trou » si Kafka est arrêté ;
  pseudonymisation sur `acteurRef` seulement.
- **État voulu** (AD-22) signé comme un tout, `revision` croissante ; `ETAT_VOULU_TROP_RECENT` déclenche la mise à jour de
  l'agent seul ; une `versionCible` antérieure est une **proposition** au DSI.
- **Chaîne de clés** (AD-7, AD-28) : racine, certificats de clé d'`usage` `ci` ou `centrale`, liste de révocation, fichier
  d'urgence ; ⛔ une racine de test n'est jamais acceptée par un agent de production.
- **Ré-ancrage** après sinistre (AD-35) : fichier de rétablissement à usage unique, compteur à `dernier + 1` ; fichier de
  prolongation si une panne de Money Vibes dure plus de 3 jours.

**Écrans**
- Console (`AP-`) : reculs et bifurcations d'empreinte, avec le ticket ouvert ; ré-ancrage par fichier (demande écrite du DSI,
  émission du fichier).
- Coque, dossier `moteur` (Dev B) : **bandeau de gel**, lu dans l'état publié comme les autres bandeaux.

**Fin de l'épic** (l'épic le plus risqué de février)
- La **suite d'attaques** passe en recette : « + 10 ans », « recul de 40 jours », « restaurer une sauvegarde de six mois »,
  jumeau de VM, magasin restauré sous son miroir, licence rejouée, clé révoquée, fichier modifié.
- Couper le contact 30 jours fait apparaître le bandeau de gel **dans la coque** ; un contact le lève.

### EPIC-150 : La licence signée ouvre, prolonge ou sanctionne · à chiffrer au 04/12

**Dev B · S7 · Autonome : oui · Amont : EPIC-149** · FR-14, FR-32, FR-41 · NFR-1, NFR-8 · AD-8, AD-19, AD-25, AD-28, AD-38 ·
Dépôts : `centrale-service`, `agent-instance`, `platform-catalog-service`, `prospera-paiement-service`,
`prospera-notification-service`, console, coque (dossier `instance`).

**Backend**
- **Licence** (AD-8) : contenu, refus `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE`, `LICENCE_INVALIDE` (refusée entière,
  la précédente reste) ; remise par `instance.licence.acceptee`, accusé `instance.licence.projetee`, republiée jusqu'à
  l'accusé ; appliquée **dans l'ordre du numéro** ; projetée en entitlements de source `licence`, jamais autrement.
- **Émission** (AD-25) : les faits `paiement.abonnement.*` vont à la centrale **par l'agent de la plateforme** ; la centrale
  dérive la licence avec le **point de décision**, la signe de sa **clé d'exécution** (scellée sur son hôte, renouvelée chaque
  trimestre) ; envoi au DSI à chaque paiement par `notification-service`, avec un lien signé à durée limitée ; alerte 7 jours
  avant l'échéance d'une licence payée non reçue.
- **Sanction** (FR-41) : portée par la licence seule ; une nouvelle licence **dans la minute** ; appliquée avant tout autre
  élément ; ⛔ jamais contre un acheteur entièrement payé.
- **Hébergé** (AD-19) : aucune licence ; la partie A de la plateforme consomme `paiement.abonnement.impayee` et
  `.regularise` : préavis de 30 jours, puis lecture seule, **jamais `SUSPENDU`** (STORY-280 : `IMPAYE` à J+7 ne suspend plus,
  le consommateur `suspension-par-impaye` sert à la sanction décidée ; STORY-281 : J-7 devient `RAPPEL`, dans paiement et
  dans les modèles de notification).
- **Fin de contrat** (FR-32) : validité = le plus tardif des `preavisJusquau`, jamais sur un module perpétuel ; paiement en
  plusieurs fois = échéance jusqu'au solde ; un acheteur hébergé est effacé après 90 jours de lecture seule (mécanique
  d'EPIC-147).
- ⛔ **Aucune licence de production avant la cérémonie de la racine** (deux clés matérielles, le DG de Money Vibes et Dev B,
  AD-28).

**Écrans**
- Console (`AP-`) : licences émises ; sanctions décidées et levées ; fin de contrat.
- Coque, dossier `instance` (Dev B, `PRA-100+`) : dépôt d'une licence ou d'un fichier par l'Administration.

**Fin de l'épic**
- Une licence signée par une clé de CI est refusée ; une licence rejouée est refusée ; la console montre la licence émise et
  l'Administration la licence acceptée, **avec le même numéro**.
- Une sanction décidée dans la console s'applique au contact suivant ; tenter de sanctionner un acheteur payé est refusé.

### EPIC-153 : Sauvegarder et restaurer sans jamais reculer la confiance · à chiffrer au 04/12

**Dev A · S8 · Autonome : non, derrière l'interface de l'agent du 08/01** · NFR-7 · AD-16, AD-35 · Dépôts :
`agent-instance` (dossier `sauvegardes/`), `prospera-plateforme` (gabarit) ; **écrans par Dev B** dans la console.

**Backend**
- **3-2-1** : copie complète chaque jour, incrément chaque heure (perte 1 h, remise en route 4 h) ; Mongo et MinIO au **même
  instant** ; copie hors machine chiffrée sur le second support (côté contact, AD-36), sur l'hôte du poste central pour la
  plateforme ; rétention 7, 4, 3.
- ⛔ Le volume de l'état de confiance est **exclu** de tout jeu restaurable par le DSI.
- **Restauration** : la sauvegarde la plus récente antérieure à l'étape « migrer », jamais une autre sans décision écrite du
  DSI ; journal `restauration` ; **époque incrémentée** ; parties A redémarrées.
- **Test de restauration mensuel** dans un projet Compose jetable ; un échec passe le voyant à l'orange par le signal.
- Sauvegarde de la centrale (base, autorité de certificats, registre) sur l'hôte de la plateforme (AD-35).

**Écrans**
- Console (`AP-`, **Dev B**, S8, sur l'API de Dev A) : état des sauvegardes et du dernier test de restauration, par instance.

**Fin de l'épic**
- Restaurer une sauvegarde ne fait reculer **ni** la licence, **ni** l'horloge, **ni** le registre des consentements.
- Le test mensuel échoué apparaît en orange **dans la console**.

### EPIC-151 : Mettre à jour sans peur : essayer, promouvoir, revenir · à chiffrer au 04/12

**Dev B · S8 → S9 · Autonome : oui · Amont : EPIC-148, EPIC-150** · FR-17, FR-18, FR-22, FR-24 · NFR-9 · AD-3, AD-7, AD-11,
AD-22, AD-33, AD-36, AD-39 · Dépôts : `prospera-plateforme` (CI de publication), `agent-instance`, `centrale-service`,
console, coque (dossier `instance`).

**Backend**
- **CI de publication** dans `prospera-plateforme` : build, liste des composants, analyse de vulnérabilités (une critique
  **bloque la signature**), `cosign sign --tlog-upload=false` ; **manifeste signé** de la version (images, coque comprise,
  migrations, schémas, interrupteurs, `retourArriere`, niveau de correctif, fin de maintenance).
- **Promotion = plan enregistré** de l'agent : télécharger et vérifier, **migrer** (point d'entrée `migrer` de chaque service,
  en conteneur dédié, jamais au démarrage ; schémas enregistrés à cette étape), basculer, vérifier la santé ; d'abord dans
  l'essai, puis dans le réel à la date choisie ; **verrou** `PROMOTION_EN_COURS` (AD-33).
- **Interruption de 15 minutes au plus**, annoncée et journalisée (NFR-9).
- **Retour arrière** pendant 7 jours : relancer les empreintes de la version précédente au niveau de correctif courant, sans
  restauration, sans jamais retirer un correctif ; repris à son étape s'il est interrompu ; `AVEC_PERTE` : arrêt, alerte, le
  DSI décide (sur site seulement, jamais en vague, refusé sur la plateforme).
- Interrupteurs à leur position finale ; ⛔ un interrupteur ne change jamais la forme des données. Pas deux promotions en
  7 jours, sauf un correctif.
- **Fichier hors ligne** (FR-22) : les mêmes artefacts, dans une archive, appliqués par le même code.
- **Calibration intouchable** (FR-24, AD-39) : volumes versionnés hors de la migration, calibration sœur.
- Mise à jour de l'agent **hors plan** (AD-3).
- 🔁 **18/01** : l'interface de la centrale est publiée pour le dossier `vagues/` de Dev A.

**Écrans**
- Console (`AP-`) : publier une version ; suivre les promotions par instance.
- Coque, dossier `instance` (Dev B) : voir les mises à jour, **essayer**, choisir la date, **revenir en arrière**,
  avancement, dépôt d'un fichier de mise à jour.

**Fin de l'épic**
- « **Promouvoir, saisir, revenir, tout se relit** », puis re-promouvoir (C12), **depuis l'Administration** de la coque.
- Coupure à une étape tirée au hasard ; compatibilité croisée agent N/N-1 × plateforme N/N-1 ; interruption mesurée sous
  15 minutes sur une instance de recette au volume représentatif ; empreinte de la calibration identique avant et après.

### EPIC-154 : Support à distance à la demande · à chiffrer au 04/12

**Dev A · S9 · Autonome : non, derrière l'interface de l'agent du 08/01** · FR-23 · NFR-2 · AD-20, AD-36, AD-37 · Dépôts :
`agent-instance` (dossier `support/`) ; **écrans par Dev B** dans la coque et la console.

**Backend**
- **Tunnel inverse ouvert par l'agent**, sortant en 443, côté contact, sur le clic d'un détenteur de
  `instance:support:ouvrir`, pour 2 heures par défaut, prolongeable ; fermé à l'échéance ou au clic.
- Les **comptes Money Vibes** de l'instance : une ouverture distincte, bornée, fermée par défaut, dont le journal est lisible
  par le client.
- Chaque ouverture, session et fermeture va au journal. En gel, la commande de support passe (FR-35).

**Écrans**
- Coque, dossier `instance` (**Dev B**, S9) : ouvrir, prolonger, fermer le tunnel ; journal des sessions.
- Console (`AP-`, **Dev B**, S9) : sessions de support ouvertes et leur journal.

**Fin de l'épic**
- Le tunnel s'ouvre **depuis la coque** et se ferme seul à l'échéance ; aucun port entrant n'apparaît pendant la session.

### EPIC-152 : Correctifs de sécurité et fin de maintenance · à chiffrer au 04/12

**Dev B · S9 · Autonome : oui · Amont : EPIC-151** · FR-19 · AD-30, AD-31 · Dépôts : `centrale-service`, `agent-instance`,
`prospera-plateforme`, `prospera-notification-service`, console.

**Backend**
- Artefact **`CORRECTIF`** pour chaque majeure encore maintenue ; ⛔ **jamais de migration** ; critique si CVSS ≥ 9 ou faille
  exploitée ; annonce dans la réponse quotidienne, e-mail au DSI et ticket d'appel.
- Horloge de **72 heures** tenue par la centrale, depuis que le client est prévenu ; **un seul report**, de 7 jours au plus ;
  passé ce délai, le correctif s'applique seul, avec essai, promotion et retour arrière automatique ; hors vagues ; un retour
  arrière ne le retire jamais ; en gel, par fichier seulement.
- **Maintenance de 3 ans** par majeure, inscrite au manifeste ; **`VERSION_FIGEE`** (`miseAJour` de la licence contre
  l'horloge scellée) : correctifs critiques seulement, ni module ajouté ni montée de version ; DG prévenu **90 jours** avant la
  fin de maintenance d'une instance figée.

**Écrans**
- Console (`AP-`) : publier un correctif ; versions figées ; alertes au DG.
- Coque, dossier `moteur` (Dev B) : bandeau de **version figée** et **correctif annoncé**, lus dans l'état publié.

**Fin de l'épic**
- Sur une instance de recette, un correctif critique s'applique seul à 72 heures ; un correctif qui porte une migration est
  refusé par la CI ; le bandeau « correctif annoncé » apparaît dans la coque.

### EPIC-157 : Consentements et indicateurs de niveau 0 · à chiffrer au 04/12

**Dev B · S9 → S10 · Autonome : oui · Amont : EPIC-149** · FR-26, FR-27 · AD-9, AD-13, AD-14, AD-37 · Dépôts :
`agent-instance`, `centrale-service`, `prospera-paiement-service`, `auth-service`, console, coque (dossier `instance`).

**Backend**
- **Registre des consentements** tenu par l'agent, tête dans l'état de confiance ; seul le **DG enregistré** (ou la personne
  qu'il désigne par écrit) le modifie : `CONSENTEMENT_RESERVE_AU_DG` ; aucun consentement sans contrat signé portant la
  clause ; vocabulaire des finalités fermé et versionné.
- **Copie signée** du registre jointe au contact à **chaque changement**, retrait compris ; la centrale la garde.
- **Retrait** : la file d'export de la finalité est vidée **avant** d'écrire le retrait.
- **Plateforme** : registre alimenté par `abonnement.contrat.signe` de `paiement-service` ; l'IA lit par un compte de service
  dédié dont toute lecture passe par la garde du registre (`CONSENTEMENT_ABSENT`).
- **Niveau 0** (FR-26) : indicateurs agrégés sur `instance.indicateurs`, portés par le signal au **schéma fermé** ; un test
  échoue si un champ non déclaré ou un identifiant de personne sort.
- **Amendement (2026-11-12, spine de Connecteurs, AD-17 et AD-31).** **Connecteurs devient producteur** des compteurs par
  domaine (dont `niveau` et santé) sur `instance.indicateurs` ; le schéma fermé du signal les porte et le test cherche un
  numéro, un montant ou un nom dans les compteurs. Le producteur n'existe qu'au premier contrat qui garde un logiciel du client.

**Écrans**
- Coque, dossier `instance` (Dev B) : consentement du DG et registre.
- Console (`AP-`) : lecture du registre des consentements.

**Fin de l'épic**
- Un autre utilisateur que le DG est refusé à l'écran avec le refus nommé ; un retrait vide la file avant d'être écrit ; aucun
  identifiant de personne dans un indicateur.

### EPIC-156 : Vagues et fenêtre N/N-1 outillées · à chiffrer au 04/12

**Dev A · S9 → S10 · Autonome : non, derrière l'interface de la centrale du 18/01** · FR-20, FR-21 · AD-30, AD-32 · Dépôts :
`centrale-service` (dossier `vagues/`) ; **écrans par Dev B** dans la console.

**Backend**
- **Vagues** : un client pilote d'abord, la plateforme comptant comme une instance ; vague suivante après **7 jours sans
  incident**, plafond de **14 jours** ; un incident (retour arrière demandé, anomalie grave, santé en échec après promotion)
  remonte par le signal et la centrale peut arrêter une vague ; l'agent suit les mêmes vagues ; les correctifs n'en suivent
  aucune.
- **Fenêtre N/N-1** : une instance maintenue n'a jamais plus d'une majeure de retard ; hors fenêtre, le support cesse et le
  DG est prévenu ; ⛔ **pas de promotion forcée** ; l'instance figée est exemptée.

**Écrans**
- Console (`AP-`, **Dev B**, S10, sur l'API de Dev A) : vagues, incidents, fenêtre N/N-1 par instance.

**Fin de l'épic**
- Un incident remonté arrête la vague suivante, **à l'écran** de la console ; une instance hors fenêtre est signalée sans être
  promue.
- ⚠️ Deuxième dans l'ordre de sacrifice du plan v3 §3 (repli : vagues manuelles, outillage de fenêtre reporté).

### EPIC-158 : Apprentissage : échantillons, contributions, modèle commun · à chiffrer au 04/12

**Dev A · S10 → S13 · Autonome : non, après EPIC-157** · FR-28 → FR-31 · AD-13, AD-14, AD-39 · Dépôts :
`apprentissage-service` (neuf, port 3402), `agent-instance` (préparation de l'échantillon, dans un dossier de Dev A) ;
**écrans par Dev B** dans la console.

**Backend**
- **Niveau 1** : l'agent prépare l'échantillon sur l'instance (pseudonyme salé propre à chaque export, groupes de moins de 5
  retirés) ; ⛔ la table de correspondance ne quitte **jamais** l'instance ; **manifeste d'export signé**, approuvé par le DG
  **et** par le responsable des données de Money Vibes (`approbationsExport` dans l'état voulu) ; envoi en mTLS, par morceaux
  repris ; **jeton d'export** à courte durée, vérifié hors ligne, refusé après recul ou bifurcation.
- `apprentissage-service` : sa base, son compte de service dédié ; refuse toute donnée dont la finalité n'est pas couverte
  par la copie la plus récente du registre ; met en quarantaine ce qu'une copie ultérieure retire ; une copie de plus de
  14 jours n'autorise rien.
- **Niveau 2** fermé tant que le poste d'accès enregistré n'existe pas. **Niveau 3** : contributions par le chemin du niveau 1,
  purgées sur l'instance après 30 jours. **Modèle commun** : redescend comme un artefact signé de la ligne de version, en
  calibration sœur.

**Écrans**
- Console (`AP-`, **Dev B**, S11 → S13, sur l'API de Dev A) : approbation des exports, contributions, modèles communs.

**Fin de l'épic**
- Un export sans les deux approbations, ou sans jeton valide, est refusé ; un retrait de consentement met en quarantaine les
  données déjà reçues.
- ⚠️ Premier dans l'ordre de sacrifice du plan v3 §3 (niveaux 3 et modèle commun d'abord).

---

### Décisions du PO, 18e séance de la salle (2026-11-11)

1. **EPIC-147 reste en S6** : le 15/01 montre aussi la démo-vente, une offre d'essai prospect qui s'allume.
2. **Désinstaller et réinstaller ne sont pas montrés le 15/01** : Money Vibes présente et installe ce qu'il faut ; les écrans
   correspondants d'EPIC-144 passent en S9. Le backend de la désinstallation reste dans EPIC-144 (FR-39).
3. **La démo assurance montre le parcours tel qu'il est dans le code aujourd'hui** : sinistres et polices, sans GED ni OCR de
   lot.
4. **Les démos du 15/01 sont fonctionnelles et testables par chaque prospect sur place** : les présentations ont déjà été
   faites sur maquettes ; cette fois, chaque prospect qui le veut ouvre **son propre essai** (EPIC-147) et déroule lui-même le
   parcours métier de sa verticale. EPIC-160 dépend donc d'EPIC-147.
5. **On compte en chantiers** : un chantier est un épic du moteur **ou** un module produit ; quatre par développeur et par semaine.
6. **Les chantiers de Dev A et de Dev B ne se touchent pas dans la même semaine** : chacun avance vite seul, et on ne croise que
   quand c'est nécessaire, à un point de croisement nommé (jour, livrable). Un chantier transverse (comme le client Kafka) est
   fait **entièrement par un développeur dans une semaine** ; l'autre le reprend la semaine suivante.
   - Matrice des neuf états : première story d'EPIC-145.
   - Recettes croisées 631, 632, 649, 650/651 et 728 réécrites dans EPIC-144, avec le retrait des chemins.
   - EPIC-142 nomme son client : contrat figé le 11/12 pour la doublure de la coque.
7. **Le client Kafka Confluent et Karapace passent en S4, chez Dev A, dans tous les dépôts** (catalogue compris), finis le
   04/12 : Dev B reprend le catalogue en S5 sur un client neuf, sans croisement. Rien ne sort de la S4 de Dev A (décision 10).
8. **Le jeu de démonstration** : en janvier, l'essai du prospect s'ouvre **avec le jeu de démonstration de sa verticale**, et
   le prospect peut y ajouter ses propres données pour voir ce que cela donnera ; à partir de février, l'essai s'ouvre **vide**
   et le prospect le remplit lui-même. Le jeu de démonstration est une option de l'offre d'essai (EPIC-147), son contenu
   vient de chaque verticale (EPIC-160).
9. **Cinq essais simultanés** : une story d'EPIC-147, recettée avant le 15/01 sur l'hébergement Money Vibes.
10. **Ordre de priorité** : l'app expert-comptable d'abord (EPIC-159 en tête de la S6, clôturée en S7), puis le distributeur
    et l'assurance (démos prêtes en S6, recettées en S7), la microfinance en dernier (S7-S8). Rien ne sort de la S4 de Dev A.
11. **Carte des dépôts** : voir la section du même nom ; partage par dossier seulement dans `prospera-app`, `agent-instance`,
    `centrale-service` et `prospera-recette`.
12. **Les écrans sont toujours faits par Dev B**, y compris ceux des épics dont le backend est à Dev A (153, 154, 156,
    158) ; Dev A garde la mécanique de la coque et les modules d'écran métier des verticales (EPIC-160).
13. **On écrit les épics, pas les stories**, comme pour le stock : la plage EPIC-142 → EPIC-160 est inscrite au registre le
    jour du découpage ; chaque fiche de story est écrite par celui qui la code, juste avant de la coder.
14. **La route de naissance d'`auth-service` est livrée en S5**, dans EPIC-142 (Dev A tient `auth-service` en S4 pour le
    socle) ; l'amendement du plan v3 §4 et l'AD-42 de la spine, qui disaient « avant la semaine 5 », sont alignés.
