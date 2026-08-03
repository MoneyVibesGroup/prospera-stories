---
title: "PRD — Canaux & notifications (notification-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: notification-service
position_sequence: 1
sprints_cibles: "S23 — S24"
mode: coaching
---

# PRD — Canaux & notifications (`notification-service`)

**Position 1 de la séquence des modules** · Verticales : **les 5** · Dépend du Bloc 0
Décisions et arbitrages tracés dans `.memlog.md` · Relecture qualité dans `review-rubric.md`

---

## 1. Contexte et problème

### 1.1 D'où vient le besoin

Prospera est vendu à cinq verticales (IMF, Distributeurs, Assurance, Money Vibes App, Expert
Comptable) et **toutes communiquent avec des tiers** : un emprunteur qu'on prévient d'une échéance,
un détaillant qu'on relance sur sa créance, un dirigeant dont le dossier KYC vient d'être approuvé,
un réseau de points de vente à qui on annonce une promotion.

Aujourd'hui cette communication n'existe nulle part comme capacité. Elle existe **en morceaux, dans
les services qui en ont eu besoin** :

| Constat | Où |
|---|---|
| La logique d'envoi d'e-mail est écrite **trois fois** — vérification et invitation (`auth-service`), statut de dossier (`kyc-service`), notifications métier (`expert-comptable`) | `sprint-status.yaml` — STORY-006, 012, 021 |
| `notification-service` est déclaré au backlog avec `module: null`, **aucune cible, aucune spécification** | `program_backlog` |
| WhatsApp est **déjà vendu** comme capacité transverse native de l'offre | `prospera_modules_bundles_distributeur.md` §Capacités transverses |
| L'escalade multi-canal WhatsApp → SMS → visite → DG est **déjà spécifiée** au module Relance | idem §12 |

Le besoin n'est donc pas né d'un incident. Il est né d'un **écart** : l'offre commerciale vend une
capacité de communication multi-canal que la plateforme ne possède pas, et chaque module qui en a eu
besoin s'en est fabriqué un bout.

### 1.2 Ce qui se passe si on ne le fait pas

- **La dette se multiplie par module.** Trois copies de l'e-mail aujourd'hui ; avec Relance, Marketing,
  Studio social, Support et Automatisations, on en aurait huit. Le précédent existe : `STORY-138` a
  coûté **sept pull requests** pour corriger un seul comportement copié-collé sur sept services.
- **WhatsApp reste invendable.** Aucun service ne peut l'ajouter seul : il faut un carnet de contacts,
  des modèles, un journal et un désabonnement — c'est-à-dire le module entier.
- **La relance multi-canal est inécrivable.** Le module Relance ne peut pas orchestrer une escalade
  sur des canaux qui n'existent pas.

### 1.3 Deux régimes, pas un

Le module porte **deux natures de message** qui partagent leur infrastructure mais **pas leurs règles**.
La distinction est structurante et conditionne tout le reste du document :

| | **Transactionnel** | **Envoi de masse** |
|---|---|---|
| Déclencheur | un événement (`kyc.approved`, échéance J-3, paiement reçu) | **un humain**, au moment qu'il choisit |
| Destinataires | 1 | N (liste) |
| Nature | message de **service** — dû au destinataire | message **sollicité** — suppose son accord |
| Désabonnement | ne s'applique pas | **obligatoire et opposable** |
| Mesure | délivré / échoué | ouverture, réponse, effet |

**Pourquoi les séparer explicitement.** Un moteur unique produit deux défauts symétriques, tous deux
graves : une mise en demeure bloquée par un désabonnement marketing (le débiteur ne reçoit plus rien),
ou une promotion envoyée sous le régime « service » à quelqu'un qui l'a refusée.

---

## 2. Vision produit

> `notification-service` est **l'unique organe de parole de Prospera vers l'extérieur**.
> Tout module qui a quelque chose à dire à un être humain le lui confie — et aucun ne réimplémente
> l'envoi.

Trois propriétés définissent le module :

1. **Il possède le message.** Les modèles, les langues, les variantes par canal vivent ici — pas chez
   l'appelant. Un client Prospera peut créer et modifier ses propres modèles : le texte d'une relance
   n'est pas le même d'une organisation à l'autre.
2. **Il possède le destinataire.** Un carnet de contacts unique, alimenté par les modules que le client
   a souscrits — parce que la personne à joindre n'a le plus souvent **aucun compte Prospera**.
3. **Les canaux ne sont que des véhicules.** E-mail, SMS, WhatsApp, push et in-app sont
   interchangeables derrière un même contrat. Ajouter un canal n'est pas un projet.

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| **Contact** | Une personne joignable, identifiée dans le carnet d'**une** organisation. N'a pas de compte Prospera, sauf pour le canal in-app. |
| **Identifiant de canal** | Ce par quoi on joint un contact sur un canal donné : numéro au format international, adresse e-mail en minuscules, jeton push, identifiant d'utilisateur. Clé de dédoublonnage. |
| **Modèle** | Le texte paramétrable d'un message, décliné par **langue** et par **canal**, versionné et immuable une fois utilisé. |
| **Variable** | Donnée métier typée injectée dans un modèle à l'envoi (montant, échéance, nom). Ne réside jamais dans le carnet. |
| **Envoi** | Une remise unitaire à un destinataire sur un canal. Unité du journal, de l'accusé et de la mesure de consommation. |
| **Liste** | Ensemble nommé de contacts d'une organisation, destinataire d'un envoi de masse. |
| **Envoi de masse** | Exécution d'un même modèle vers une liste. **C'est l'objet de ce module.** |
| **Campagne** | Objet **du module Marketing** (#10) : intention, ciblage, budget, ROI. Une campagne *déclenche* un envoi de masse ; ce PRD n'en porte ni la définition ni la mesure. |
| **Nature de message** | `transactionnel` ou `masse`. Détermine les règles de consentement (§1.3). |
| **Accusé** | Retour du canal sur le sort d'un envoi : délivré, lu, répondu, échoué. Porte un **niveau de certitude**. |
| **Consentement** | Accord d'une personne à recevoir des messages de masse, par canal, daté et sourcé. |
| **Passerelle** | Fournisseur tiers qui achemine un canal. Interchangeable (`ChannelProvider`). |

---

## 4. Périmètre

### 4.1 Frontières avec les modules voisins

Trois modules de la séquence communiquent avec des humains. La ligne de partage est **exécution vs
intention vs décision** — chacun appelle `notification-service`, aucun ne réimplémente l'envoi.

| Module | Ce qu'il possède | Ce qu'il délègue à `notification-service` |
|---|---|---|
| **Marketing & campagnes** (#10) | L'**intention** : segmentation métier, offre, budget, mesure du ROI | La constitution de la liste, le rendu du message, l'envoi, le désabonnement, le journal |
| **Relance & Recouvrement** (#24) | La **décision** : qui relancer, quand, avec quelle escalade, quand basculer en visite ou en judiciaire | Chaque envoi de l'escalade, sur le canal demandé, avec son accusé |
| **Support / Service client** (#8) | Le **dossier** : ticket, SLA, historique de la demande | Les messages sortants du ticket et les accusés |
| **`notification-service`** (#1) | L'**exécution** : contacts, modèles, listes, canaux, envoi, journal, désabonnement | — |

L'envoi porte **l'identité de l'appelant** : le journal sait toujours quel module a parlé, et l'état
de l'envoi remonte à ce module.

> **Frontière mince, assumée.** Le groupe E (listes, planification, validation, garde-fous) touche à
> la mécanique de campagne. La ligne tient ainsi : ce module porte **la mécanique d'envoi en masse**,
> Marketing porte **le ciblage et la mesure de l'effet commercial**. Une liste remise par Marketing
> est exécutée ici ; elle n'est pas construite ici.

### 4.2 Dans le périmètre

- Carnet de contacts unique et dédoublonné, alimenté par les modules souscrits
- Modèles de message versionnés, multilingues, éditables par le client
- Canaux : **e-mail, SMS, WhatsApp, push, in-app** derrière un contrat unique
- Envoi transactionnel déclenché par appel ou par événement
- Envoi de masse : listes, préparation, planification, **traitement par lots avec reprise**
- Journal d'envoi avec statut normalisé et **niveau de certitude par canal**
- Réception et routage contextuel des réponses entrantes
- Consentement et désabonnement par personne et par nature de message
- Restitution des accusés aux modules appelants
- Mesure de consommation par organisation, utilisateur et équipe

### 4.3 Hors périmètre

| Hors périmètre | Où ça vit | Pourquoi |
|---|---|---|
| Segmentation métier, ciblage, ROI de campagne | Marketing (#10) | C'est l'intention, pas l'exécution |
| Règles d'escalade de relance | Relance (#24) | C'est la décision, pas l'exécution |
| Publication sur les réseaux sociaux, inbox sociale | Studio social (#14) | Média de diffusion publique, pas message adressé |
| Rédaction assistée par IA des messages | Assistant IA (#6) | L'IA **propose**, `notification-service` **envoie** |
| Facturation et blocage sur dépassement | PI-SPI (Bloc 0) | La mesure précède la facturation (FR-N63) |

---

## 5. Fonctionnalités & exigences (FR)

### A — Carnet de contacts

Le destinataire n'a le plus souvent **aucun compte Prospera**. Le carnet est la réponse à « comment
joindre cette personne », et rien d'autre.

| # | Exigence |
|---|---|
| **FR-N01** | Un **contact** représente une personne joignable : nom d'usage, un ou plusieurs **identifiants de canal** (numéro de téléphone, e-mail, jeton push), une langue préférée, un consentement par nature de message. |
| **FR-N02** | Le contact est **unique et dédoublonné au sein d'une organisation** : deux modules qui inscrivent le même numéro alimentent **une seule** fiche. Le dédoublonnage s'appuie sur l'identifiant de canal normalisé (format international pour le téléphone, minuscules pour l'e-mail). |
| **FR-N03** | Le dédoublonnage **s'arrête à la frontière de l'organisation**. Deux organisations qui détiennent le même numéro détiennent deux contacts distincts, sans lien ni visibilité mutuelle. |
| **FR-N04** | Un contact porte la trace des **modules qui l'ont inscrit**. Un client qui n'a souscrit que Relance ne voit que ce que Relance a renseigné, même si le contact existe aussi pour Commande. |
| **FR-N05** | Le carnet ne stocke **que ce qui sert à joindre**. Aucune donnée métier (montant dû, solde, score, statut de dossier) n'y entre : elle reste dans le module propriétaire et transite comme **variable de message**, non comme attribut de contact. |
| **FR-N06** | Un module inscrit ou met à jour un contact par une opération **idempotente** (rejouer l'inscription ne crée pas de doublon et n'écrase pas un consentement). |
| **FR-N07** | Recherche d'un contact par **identifiant de canal**, retournant tout ce que l'organisation détient sur cette personne — condition nécessaire pour honorer une demande d'accès ou d'effacement. |
| **FR-N08** | Import de contacts en masse (fichier), avec compte rendu **avant** persistance : créations, rapprochements sur contact existant, lignes rejetées et motif. |

### B — Modèles de message

| # | Exigence |
|---|---|
| **FR-N09** | Un **modèle** porte un objet (si le canal en a un), un corps avec des **variables typées**, une langue et un canal. La déclinaison par canal n'est pas cosmétique : le même message n'a pas la même forme en SMS (160 caractères) et en e-mail. |
| **FR-N10** | Les modèles sont **versionnés et immuables une fois utilisés** : un envoi référence la version exacte qui l'a produit. Modifier un modèle crée une version, n'en réécrit jamais une. |
| **FR-N11** | Prospera livre un **socle de modèles système** (vérification d'e-mail, invitation, statut KYC, échéance, reçu de paiement). Une organisation peut les **surcharger** sans les altérer pour les autres. |
| **FR-N12** | Une organisation peut **créer ses propres modèles**. Le droit est porté par un **rôle dédié**, pas par tout utilisateur ni par le rôle d'administration générale. |
| **FR-N13** | Langues au v1 : **français et anglais**. L'ajout d'une langue est une donnée, pas un développement. |
| **FR-N14** | La langue est un attribut du couple **(modèle, canal)** et non du seul modèle : une langue à caractères non latins fait basculer le SMS en encodage UCS-2 (**70 caractères par segment au lieu de 160**), ce qui change le coût et le point de troncature. Le module annonce le nombre de segments et le coût estimé **avant** l'envoi. |
| **FR-N15** | Rendu d'essai : prévisualiser un modèle avec un jeu de variables et un destinataire de test, sur chaque canal, **sans consommer de quota ni écrire au journal d'envoi**. |
| **FR-N16** | Un modèle porte un **statut d'approbation par canal** (`non requis` · `en attente` · `approuvé` · `refusé`). Inerte avec la passerelle retenue au v1, il devient bloquant sans changement de modèle de données si le projet bascule sur l'API officielle WhatsApp. |

### C — Canaux

| # | Exigence |
|---|---|
| **FR-N17** | Les canaux sont implémentés derrière un contrat unique `ChannelProvider` — même patron que `OcrProvider`, `LlmProvider` et `PaymentProvider`. Ajouter un canal ou changer de passerelle est une **configuration**, pas une réécriture. |
| **FR-N18** | Canaux du v1 : **e-mail**, **SMS**, **WhatsApp**, **push**, **in-app**. |
| **FR-N19** | Le canal **in-app** est le seul dont le destinataire est un **utilisateur Prospera authentifié** : il ne passe pas par le carnet de contacts mais par l'identité. Il porte les alertes applicatives (« 3 dossiers à valider ») avec un état lu/non lu **fiable par construction**. |
| **FR-N20** | Le service **publie les capacités de chaque canal** : longueur maximale, pièces jointes, accusé de délivrance, accusé de lecture, bidirectionnalité. Un appelant peut donc interroger ce qu'un canal sait faire au lieu de le supposer. |
| **FR-N21** | Un envoi peut désigner une **liste ordonnée de canaux de repli** (« WhatsApp, sinon SMS »). Le repli se déclenche sur échec technique **du canal**, jamais sur l'absence de lecture (cf. NFR-1b). |
| **FR-N22** | Aucun canal n'est un prérequis de démarrage : le service démarre en mode dégradé si une passerelle est absente, et le dit dans son état de santé. |

### D — Envoi transactionnel

| # | Exigence |
|---|---|
| **FR-N23** | Un module demande un envoi en fournissant : un **modèle**, un **destinataire**, des **variables**, un **canal** (ou une liste de repli), et **son identité d'appelant**. Il ne fournit **jamais** un texte déjà rendu. |
| **FR-N24** | Le service consomme les **événements métier** publiés sur le bus et déclenche l'envoi par correspondance événement → modèle, configurable par organisation. **Disponibles aujourd'hui :** `identity.*`, `kyc.*`, `entitlement.*`, `document.*`. **Attendus :** `paiement.*` — `paiement-service` n'est pas construit *[ASSUMPTION A3]*. |
| **FR-N25** | Tout envoi porte une **clé d'idempotence**. Rejouer une demande ou un événement n'envoie pas deux fois — invariant vérifiable, non « en principe ». |
| **FR-N26** | Un envoi transactionnel **ignore le désabonnement de masse** : c'est un message de service, dû au destinataire. Il respecte en revanche un blocage global (numéro invalide, plainte, demande d'effacement). |
| **FR-N27** | Les messages sortants de `auth-service`, `kyc-service` et `expert-comptable` sont **migrés vers ce service** et leur code d'envoi retiré. C'est le motif d'existence du module, pas un nettoyage optionnel. |

### E — Envoi de masse

| # | Exigence |
|---|---|
| **FR-N28** | Une **liste** est un ensemble nommé de contacts, constitué par sélection manuelle, import de fichier, ou remise par un module appelant (Marketing fournit le segment — il ne le construit pas ici). |
| **FR-N29** | Un **envoi de masse** se prépare (modèle, liste, canal, planification), se prévisualise sur un échantillon, et s'exécute — les trois temps sont distincts et l'objet préparé est réutilisable. |
| **FR-N30** | Exécution **par lots avec point de reprise**. Condition observable : interrompre l'exécution à mi-parcours puis la reprendre laisse **zéro destinataire non servi et zéro destinataire servi deux fois**, prouvé par comparaison du journal à la liste. |
| **FR-N31** | Avant exécution, le module annonce : destinataires retenus, **destinataires écartés et pourquoi** (désabonné, canal absent, identifiant invalide), nombre de segments et coût estimé. |
| **FR-N32** | Un envoi de masse est **interruptible** en cours d'exécution, avec état exact au moment de l'arrêt. |
| **FR-N33** | Garde-fous par organisation : **plafond d'envois** par période et **fenêtre horaire autorisée** — on ne réveille pas un détaillant à 3 h du matin. La fenêtre s'entend dans le fuseau de l'organisation *[ASSUMPTION A4 : UTC+0 pour le Togo]*. |
| **FR-N34** | Un envoi de masse peut requérir une **validation** par un rôle habilité avant exécution, activable par organisation. |

### F — Journal d'envoi & accusés

| # | Exigence |
|---|---|
| **FR-N35** | Chaque envoi est journalisé : destinataire, canal, modèle et sa version, variables, **module appelant**, horodatages, statut, coût. |
| **FR-N36** | Statut **normalisé** sur tous les canaux, avec transitions autorisées explicites : `préparé → envoyé → délivré → lu → répondu`. Aucun saut arrière ; `lu` est inatteignable sans `délivré`. `échoué` est atteignable depuis `préparé` et `envoyé`, avec un motif exploitable (identifiant invalide, refus de la passerelle, quota, désabonné). |
| **FR-N37** | Tout statut de lecture porte son **niveau de certitude** — `confirmé`, `présumé`, `indisponible sur ce canal` (cf. NFR-1a). |
| **FR-N38** | Les accusés sont **restitués au module appelant** (événement sortant), pour que Relance sache qu'elle a été lue sans interroger le journal. |
| **FR-N39** | Consultation et export du journal, filtrable par période, canal, envoi de masse, module appelant et statut. |
| **FR-N40** | **Rejeu manuel** d'un envoi échoué, sans reconstruire la demande d'origine. |

### G — Réponses entrantes

| # | Exigence |
|---|---|
| **FR-N41** | Le service reçoit les **messages entrants** des canaux bidirectionnels (WhatsApp au v1) et les rattache à l'envoi qui les a provoqués. |
| **FR-N42** | Une réponse est **routée selon son contexte** vers le module qui avait parlé : une réponse à une relance revient à Relance, une réponse à un message de support revient à Support. Le routage est contextuel, pas un déversement dans une boîte unique. |
| **FR-N43** | Une réponse **sans contexte identifiable** (message spontané) est orientée vers une destination par défaut configurable par organisation. |
| **FR-N44** | L'**inbox centralisée du Studio social** (#14) est un **consommateur** de ce flux, pas son propriétaire : elle s'abonne aux conversations qui la concernent. |
| **FR-N45** | Une réponse fait passer l'envoi d'origine au statut `répondu` — le seul signal d'engagement **fiable sur tous les canaux bidirectionnels**. |

### H — Consentement, désabonnement & droits des personnes

| # | Exigence |
|---|---|
| **FR-N46** | Le consentement est enregistré **par personne, par canal et par nature de message**, avec sa date et sa source. Il ne se déduit jamais de l'absence de refus. |
| **FR-N47** | Tout message de masse porte un moyen de désabonnement adapté au canal. |
| **FR-N48** | Un désabonnement est **opposable immédiatement** — y compris à un envoi de masse déjà en cours d'exécution. |
| **FR-N49** | Le désabonnement **suit la personne**, pas le module : le contact étant unique, un refus vaut pour tous les modules de l'organisation. |
| **FR-N50** | Un désabonnement de masse **n'éteint pas** les messages transactionnels (cf. FR-N26). Le refus de la publicité n'est pas le refus d'une mise en demeure. |
| **FR-N51** | Sur demande d'une personne, transmise par l'organisation responsable : **restitution** de tout ce qui la concerne, **rectification**, et **effacement** — le tout par identifiant de canal (cf. FR-N07). |
| **FR-N52** | Un effacement conserve la **preuve du désabonnement** (cf. §9) : effacer sa propre preuve de conformité en même temps que la donnée est un contresens. |

### I — Administration

| # | Exigence |
|---|---|
| **FR-N53** | Les droits sont portés par le **catalogue de permissions plateforme** existant (STORY-140) : rédaction de modèle, exécution d'envoi de masse, validation, consultation du journal, administration des canaux — distincts et attribuables séparément. |
| **FR-N54** | Une organisation configure ses passerelles (identifiants, expéditeur, plafonds) sans accéder à celles d'une autre. |
| **FR-N55** | Console d'exploitation sur `admin-panel`, bornée à quatre actions : consulter la file d'attente, consulter les échecs avec leur motif, rejouer un envoi échoué, suspendre un envoi de masse en cours. Toute autre surface est hors v1. |
| **FR-N56** | Les **secrets de passerelle** ne sont jamais restitués en lecture, ni journalisés, ni renvoyés par l'API. |
| **FR-N56b** | Le service expose un **fournisseur de candidats** pour le moteur de règles de l'assistant (`FR-IA03b`) : envois échoués non rejoués, destinataires dont tous les canaux échouent, modèles en attente d'approbation, envois de masse préparés et jamais exécutés. *Ajouté à la revue croisée : cinq PRD sur sept exposaient ce contrat, celui-ci l'omettait alors que ses cas d'automatisation sont évidents.* |

### J — Mesure de consommation

WhatsApp et SMS coûtent à l'envoi. Avant de savoir **qui paie** (Q7, dépend du PRD PI-SPI), il faut
savoir **qui consomme** — et la mesure doit être en place dès le premier envoi, faute de quoi
l'historique manquera le jour où la question du paiement se posera.

| # | Exigence |
|---|---|
| **FR-N57** | Chaque envoi porte son **coût unitaire** (nombre de segments × tarif du canal) et son **auteur** : l'utilisateur qui l'a déclenché, ou à défaut le module ou la règle automatique à l'origine. Aucun envoi n'est anonyme. |
| **FR-N57b** | ⚡ **Tout montant porte sa devise** et suit les règles d'exactitude de la plateforme : stockage en **entier d'unité mineure**, avec le nombre de décimales de la devise — ⚠️ **le XOF et le GNF n'en ont aucune**, le NGN et le GHS en ont deux. Un coût d'envoi traité à deux décimales par défaut est faux d'un facteur 100 sur le marché principal. *Ajouté à la revue croisée : ce PRD a été rédigé avant la décision de couvrir toute l'Afrique de l'Ouest.* |
| **FR-N57c** | Une organisation opérant dans plusieurs pays voit sa consommation **par devise**, sans conversion ni total agrégé toutes devises confondues — additionner des XOF et des NGN ne produit aucun nombre qui veuille dire quelque chose. |
| **FR-N58** | Le rattachement organisationnel de l'auteur est **figé au moment de l'envoi**, jamais recalculé. Un utilisateur qui change d'affectation ne réécrit pas l'historique de consommation de son ancienne équipe. |
| **FR-N59** | Restitution de la consommation d'une organisation par **période**, **canal** et **nature** (transactionnel / masse) : volume envoyé, volume délivré, volume échoué, coût. |
| **FR-N60** | **Ventilation au sein de l'organisation** — l'exigence porteuse : un dirigeant doit voir ce que chaque équipe a consommé, pas seulement un total. Au v1 la ventilation se fait par **utilisateur et par rôle** (disponibles dans `auth-service`) ; la ventilation par **équipe** au sens métier arrive avec le module Équipe (#18) *[ASSUMPTION A2]*. |
| **FR-N61** | Vue **plateforme** (Money Vibes), toutes organisations confondues, pour le pilotage commercial : consommation par client, par canal, par période. Réservée au rôle plateforme, jamais exposée à une organisation. |
| **FR-N62** | Le tarif appliqué est **enregistré avec l'envoi**, pas recalculé à la lecture : un changement de tarif de passerelle ne modifie pas rétroactivement la consommation déjà mesurée. |
| **FR-N63** | Aucune facturation ni aucun blocage sur dépassement au v1. La mesure **précède** la facturation ; le modèle de coût est complet pour que la facturation puisse s'y brancher **sans reprise de données**. |

### K — Rétention & purge

La politique de conservation (§9) n'est pas déclarative : elle s'exécute.

| # | Exigence |
|---|---|
| **FR-N64** | Les durées de conservation sont **paramétrables par organisation**, chacune bornée par un **plafond opposable** que le service refuse de dépasser — la tentative est rejetée, pas silencieusement ramenée au plafond. |
| **FR-N65** | Purge automatique à échéance : contacts sans interaction, journaux détaillés, rendus figés. Chaque exécution de purge est **tracée** (volume, catégorie, échéance appliquée) et le compte rendu est consultable. |
| **FR-N66** | À 13 mois, le journal détaillé est **remplacé par des agrégats anonymes** (compteurs par envoi de masse, canal et période) — l'analyse reste possible, la donnée personnelle disparaît. |
| **FR-N67** | À la résiliation d'une organisation : **export** du carnet et du journal mis à disposition, puis **suppression complète à 90 jours**. Aucune donnée d'un client résilié ne survit ni ne sert à un autre. |
| **FR-N68** | La purge **préserve la preuve de consentement et de désabonnement** au-delà de la donnée qu'elle protège (cf. FR-N52, §9.2). |

---

## 6. Exigences non fonctionnelles (NFR)

### NFR-1 — Vérité du statut de lecture *(structurante)*

« Lu » n'a pas le même sens selon le canal, et le module ne doit **jamais** présenter une inférence
comme un fait :

| Canal | Envoyé | Délivré | Lu | Certitude du « lu » |
|---|:--:|:--:|:--:|---|
| In-app | ✅ | ✅ | ✅ | **confirmé** — par construction |
| WhatsApp | ✅ | ✅ | ✅ | **confirmé** — sauf accusés désactivés côté destinataire |
| Push | ✅ | ✅ | ✅ | **confirmé** (affiché / cliqué) |
| E-mail | ✅ | ✅ | ⚠️ | **présumé** — pixel faussé par le préchargement d'images (Apple Mail, Gmail) |
| SMS | ✅ | ⚠️ selon l'opérateur | ❌ | **indisponible sur ce canal** |

**Conséquences opposables :**

- **NFR-1a** — Tout statut de lecture est accompagné de son niveau de certitude
  (`confirmé` · `présumé` · `indisponible`). Aucune surface n'affiche « non lu » quand la vraie
  réponse est « on ne peut pas savoir ».
- **NFR-1b** — Aucune décision automatique (escalade, relance, blocage) ne se déclenche sur un
  statut de lecture. Les automatismes se déclenchent sur **l'absence de l'effet attendu** — pas de
  réponse, pas de paiement, pas de connexion. Le « lu » **informe** l'humain, il ne **décide** pas
  à sa place.

> **Motif.** Le SMS est le 2ᵉ barreau de l'escalade de relance et n'a pas la notion de « lu ». Une
> escalade déclenchée sur « non lu » se déclencherait systématiquement à ce barreau — y compris pour
> les débiteurs qui ont lu et vont payer.

### NFR-2 — Envoi de masse par lots avec reprise

Le volume dépend du client et n'est pas connu à l'avance. L'envoi de masse est traité **par lots avec
point de reprise** : une interruption ne perd aucun destinataire et n'en sert aucun deux fois.

### NFR-3 — Délais

| Type | Cible |
|---|---|
| Envoi **transactionnel** — de la demande ou de l'événement à la remise à la passerelle | **P95 < 30 s** |
| Envoi transactionnel **sensible au temps** (code de vérification) | **P95 < 10 s** |
| Envoi de masse | Pas de cible de bout en bout — la **progression** doit être observable et la reprise possible (NFR-2) |

### NFR-4 — Idempotence de bout en bout

Toute demande d'envoi et tout événement consommé portent une clé d'idempotence. Un rejeu — de
l'appelant, du bus, ou d'une reprise de lot — ne produit jamais un second message. L'invariant est
prouvé par test, pas affirmé.

### NFR-5 — Cloisonnement par organisation

Contacts, modèles, listes, journaux et secrets de passerelle sont cloisonnés par organisation.
Aucune requête ne peut traverser cette frontière, y compris le dédoublonnage (FR-N03).

### NFR-6 — Aucun canal n'est un prérequis de démarrage

L'absence d'une passerelle dégrade le canal concerné, jamais le service. L'état de santé distingue
« service indisponible » de « canal indisponible ».

### NFR-7 — Confidentialité des secrets

Les identifiants de passerelle ne sont ni restitués en lecture, ni journalisés, ni inclus dans une
réponse d'API ou une trace d'erreur.

---

## 7. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Logique d'envoi résiduelle hors du service — appels SMTP ou API de canal dans `auth`, `kyc`, `expert-comptable` | **0** | La thèse du module : organe de parole **unique** |
| **SM-2** | Taux de délivrance par canal | à **calibrer après 30 jours** de mesure réelle, puis opposable | Le service fait le travail |
| **SM-3** | Coût d'ajout d'un 6ᵉ canal | modification limitée au `ChannelProvider` + configuration, **cœur non touché** | L'interchangeabilité annoncée (FR-N17) |
| **SM-4** | Délai P95 d'un envoi transactionnel | **< 30 s** (< 10 s pour les envois sensibles au temps) | NFR-3 |
| **SM-5** | Modules consommateurs branchés | **≥ 3** (auth, kyc, expert-comptable) au terme du v1 | Le module sert, il n'attend pas |

### Contre-métriques

Le risque propre à un module d'envoi est d'**envoyer plus**, pas mieux. Deux garde-fous :

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | Volume moyen de messages reçus par destinataire et par mois | En hausse continue sur 3 mois sans hausse de l'effet mesuré côté métier |
| **CM-2** | Taux de désabonnement mensuel et nombre de plaintes | Toute hausse — un module qui réussit techniquement mais fait fuir les destinataires a échoué |

---

## 8. Découpage en incréments

**68 FR sur trois sprints (S23 → S25).** ⚠️ La séquence des modules estimait ce module à **2 sprints** :
l'estimation était **basse**. Le découpage en stories donne 34 + 34 + 21 = **89 points**, soit 3 sprints
à capacité 34. La correction est actée ici plutôt que découverte en cours de sprint.

| Incrément | Sprint | Pts | Titre | Critère de sortie |
|:--:|:--:|:--:|---|---|
| **1** | S23 | 34 | **Le service parle** — carnet, modèles, envoi transactionnel, journal, e-mail | Un e-mail part du service avec son journal, son statut normalisé et son niveau de certitude |
| **2** | S24 | 34 | **Il remplace l'existant et gagne ses canaux** — migration ×3, in-app, SMS/WhatsApp/push, réponses, consentement, mesure, console | `auth`, `kyc` et `expert-comptable` n'envoient plus rien eux-mêmes (**SM-1 = 0**) |
| **3** | S25 | 21 | **Il fait campagne** — listes, envoi de masse par lots, garde-fous, rétention, e2e | Un envoi de masse interrompu puis repris ne perd ni ne double aucun destinataire (FR-N30) |

**Pourquoi cet ordre.** L'incrément 1 ne dépend d'**aucune passerelle tierce** : l'e-mail s'appuie sur
l'existant. Il est donc livrable même si aucun contrat WhatsApp ou SMS n'est signé. L'incrément 2
solde la dette qui motive le module (SM-1). L'incrément 3 est le seul à porter du périmètre réellement
nouveau — c'est donc le seul décalable sans conséquence.

---

## 9. Conservation des données & conformité

### 9.1 Cadre applicable

Le texte contraignant n'est **pas** le RGPD : les organisations clientes sont au Togo et en UEMOA,
donc la **loi togolaise n° 2019-014** sur la protection des données à caractère personnel (autorité :
IPDCP) et l'**Acte additionnel CEDEAO A/SA.1/01/10** s'appliquent. La politique ci-dessous est
**calée sur le RGPD**, plus exigeant — s'y aligner met à l'abri des deux. **[À faire valider
juridiquement : durées et formalités exactes auprès de l'IPDCP.]**

**Rôles.** Prospera est **sous-traitant**. L'organisation cliente est **responsable de traitement** :
le carnet lui appartient, les demandes des personnes lui parviennent, et à la résiliation elle le
récupère.

### 9.2 Durées de conservation

Toutes les durées sont **paramétrables par organisation, dans la limite d'un plafond opposable** que
le service refuse de dépasser. Les valeurs ci-dessous sont les **défauts**. Aucune donnée n'est
conservée sans durée — y compris le contact actif.

| Donnée | Défaut | Plafond | Motif |
|---|:--:|:--:|---|
| **Contact actif** | 3 ans après la **dernière interaction** — envoi, réponse ou mise à jour par un module | 5 ans | Le carnet reflète une relation vivante ; une relation sans trace depuis 3 ans n'est plus une relation |
| **Contact inactif** | purge ou anonymisation à l'échéance ci-dessus | — | Anonymisation si le journal agrégé doit rester exploitable |
| **Journal d'envoi détaillé** | **13 mois**, puis agrégats anonymes (compteurs par envoi de masse et par canal) | 24 mois | Couvre une saison commerciale complète sans constituer un historique de vie |
| **Preuve de consentement / désabonnement** | **3 ans après la fin de la relation** — donc **survit au contact** | 5 ans | C'est la pièce qui prouve la conformité ; l'effacer avec la donnée revient à effacer sa propre défense |
| **Contenu rendu du message** | **non conservé** — modèle + variables uniquement | — | 2 000 rendus figés = 2 000 copies de données personnelles sans usage |
| **Contenu rendu — messages à valeur probante** (mise en demeure) | **5 ans**, rendu figé | 10 ans | Valeur de preuve en cas de contentieux **[à confirmer juridiquement]** |
| **Carnet après résiliation du client** | export mis à disposition, puis **suppression à 90 jours** | 90 jours | Le carnet appartient au client, jamais réutilisé pour un autre |

### 9.3 Minimisation

- Le carnet ne stocke **que ce qui sert à joindre** : nom d'usage, identifiants de canal, langue,
  consentement. Jamais le montant dû, le solde, le score ou le statut de dossier — ceux-ci restent
  dans le module et transitent comme variables de message (FR-N05).
- Le rendu du message n'est pas conservé, sauf valeur probante — donc les variables sensibles ne se
  retrouvent pas dupliquées dans le journal.

### 9.4 Droits des personnes

La personne notifiée **n'a pas de compte Prospera** : elle ne peut pas exercer ses droits en se
connectant. Le service expose donc à l'organisation responsable une **recherche par identifiant de
canal** (FR-N07) qui restitue tout ce qui est détenu et permet la rectification ou l'effacement.
Sans elle, l'organisation cliente est dans l'incapacité matérielle d'honorer une demande.

---

## 10. Dépendances

### 10.1 Disponible aujourd'hui

| Dépendance | État |
|---|---|
| Bus Kafka (KRaft), patron *transactional outbox* | ✅ livré depuis STORY-022 |
| Identité et jetons RS256/JWKS (`auth-service`) | ✅ livré |
| Catalogue de permissions plateforme + rôles métier | ✅ livré S18 (STORY-140) |
| `admin-panel` (console) | ✅ livré |
| Topics `identity.*`, `kyc.*`, `entitlement.*`, `document.*` | ✅ publiés |

### 10.2 Manquant — à obtenir avant la fin de l'incrément 2

| Dépendance | Nature | Impact si absent |
|---|---|---|
| **Passerelle WhatsApp** | contrat / compte externe | L'incrément 2 perd son canal principal. **N'affecte pas l'incrément 1.** |
| **Agrégateur SMS** (Togo) | contrat opérateur | Idem |
| **Service de push** | choix technique | Canal push reporté |
| **Topics `paiement.*`** | `paiement-service` non construit (Bloc 0) | Aucun envoi transactionnel lié au paiement. Le reste fonctionne. |
| **Notion d'équipe métier** | module Équipe (#18), très en aval | FR-N60 se rabat sur utilisateur + rôle au v1 |

---

## 11. Risques

| # | Risque | Décision |
|---|---|---|
| **R1** | La passerelle WhatsApp visée n'est pas l'API officielle Meta → risque de blocage du numéro émetteur, alors que WhatsApp est **vendu** comme capacité native | **Accepté** (décision utilisateur, 2026-08-02). Mitigation conservée : le patron `ChannelProvider` rend la bascule vers l'API officielle un changement de configuration, pas de code. FR-N16 garde la place du statut d'approbation |
| **R2** | Aucun contrat de passerelle n'est signé à la rédaction | **Mitigé par le découpage** : l'incrément 1 ne dépend d'aucune passerelle tierce |
| **R3** | La frontière avec Marketing (#10) est mince sur la mécanique de campagne | **Nommée** en §4.1. À revérifier à la rédaction du PRD Marketing |

---

## 12. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | Les réponses entrantes : qui les reçoit ? | ✅ **tranchée** — routage contextuel vers le module qui avait parlé (FR-N42/N44) |
| Q2 | Langues couvertes | ✅ **tranchée** — fr/en au v1 ; langue portée par le couple (modèle, canal) (FR-N13/N14) |
| Q3 | Qui peut créer un modèle ? Validation d'un envoi de masse ? | ✅ **tranchée** — rôle dédié (FR-N12) ; validation activable (FR-N34) |
| Q4 | Notifications in-app | ✅ **tranchée** — 5ᵉ canal, **dans** le périmètre (FR-N18/N19) |
| Q5 | Conservation | ✅ **validée** 2026-08-02, toutes durées bornées et plafonnées — §9 |
| Q7 | Qui paie les envois | ⏸ **reportée au PRD PI-SPI.** Au v1 : mesure sans facturation (FR-N57→N63) |
| **Q6** | Le rôle de rédaction de modèle : nouveau rôle, ou permission ajoutée à un rôle existant du catalogue S18 ? | 🔻 **déléguée au découpage en stories** (décision utilisateur) |
| **Q8** | Le seuil de SM-2 (taux de délivrance opposable) | 🔻 **à fixer après 30 jours** de mesure réelle |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| **A1** | Les modules Marketing (#10), Relance (#24) et Support (#8) existeront sous la forme décrite en §4.1 et appelleront ce service plutôt que de réimplémenter l'envoi | §4.1 | À la rédaction de chacun de ces PRD |
| **A2** | La notion d'« équipe » de FR-N60 n'existe pas encore ; le v1 ventile par utilisateur et rôle | FR-N60, §10.2 | Module Équipe (#18) |
| **A3** | Les topics `paiement.*` seront publiés par `paiement-service` avec une charge utile permettant de rendre un message | FR-N24 | PRD PI-SPI (atelier 2) |
| **A4** | Fuseau horaire unique UTC+0 pour la fenêtre d'envoi ; à revoir si le déploiement UEMOA sort de ce fuseau | FR-N33 | 1er client hors Togo |
| **A5** | La passerelle retenue restitue des accusés de délivrance et de lecture exploitables ; sans quoi NFR-1 se dégrade en « présumé » sur WhatsApp | NFR-1 | Choix de passerelle |
