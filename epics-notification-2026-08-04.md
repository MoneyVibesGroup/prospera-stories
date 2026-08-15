---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/prds/prd-notification-service-2026-08-02/prd.md
  - prospera-stories/prds/prd-notification-service-2026-08-02/.memlog.md
  - prospera-stories/architecture/architecture-notification-service-2026-08-03/ARCHITECTURE-SPINE.md
  - prospera-stories/architecture/architecture-notification-service-2026-08-03/.memlog.md
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md
  - prospera-stories/architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md
  - prospera-stories/epics-paiement-2026-08-03.md
  - prospera-stories/sprint-status.yaml
  - auth-service/src/modules/mail/ (code livré — la dette à solder)
  - docker-compose.yml (relevé des ports et des images, 2026-08-04)
---

# Canaux & notifications (`notification-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD Canaux & notifications et de la colonne vertébrale `notification-service`
(AD-1 → AD-19) en épics et stories implémentables. Périmètre **backend**, plus la surface publique
de désabonnement, qui appartient au service (AD-17) ; le reste du frontend suit sa série `FE-*` dans
son tracker propre.

### ⚠️ Correction de numérotation

Le memlog du PRD, écrit le **2026-08-02**, annonçait « 16 stories, STORY-150 à 165, 89 pts ». **Cette
plage n'est plus disponible.** Le découpage `paiement-service` du 2026-08-03 a repris STORY-150 →
STORY-165 (ancien EPIC-004 rescopé) puis les a passées en `superseded_stories`. Rouvrir ces numéros
créerait une collision avec une table de correspondance déjà publiée et citée par 21 stories frontend
et mobile.

**Série retenue :** épics **EPIC-054 → EPIC-064**. Dernier numéro d'épic réellement pris au
2026-08-15 : **EPIC-053**, vérifié dans `sprint-status.yaml` **et** enregistré dans son bloc
`reserved_ranges`.

**Aucun `story_id` n'est réservé ici.** Les numéros de story sont attribués **au slotting**, quand les
stories entrent dans `sprint-status.yaml` — pas au découpage. Voir l'historique ci-dessous : c'est
exactement cette réservation anticipée qui a échoué trois fois.

> ### ⚠️ Historique des collisions — trois fois le même défaut
>
> **1. 2026-08-04.** Le memlog du PRD (2026-08-02) annonçait « 16 stories, STORY-150 à 165 ». Plage
> reprise entre-temps par le découpage `paiement-service` du 2026-08-03 (ancien EPIC-004 rescopé,
> puis passées en `superseded_stories`). ⇒ série repoussée à EPIC-043 / STORY-291.
>
> **2. 2026-08-07.** STORY-291 dépassée le même jour par deux mouvements : STORY-292/293
> (référentiels attribuables mais non servis, S20) et la renumérotation fiscale `179→235` ⇒
> `294→350`. ⇒ série repoussée à STORY-351.
>
> **3. 2026-08-09 — non détectée sur le moment, corrigée le 2026-08-15.** Le ticket dossier-client a
> pris **EPIC-043** (« Le dossier client devient l'unité de travail du cabinet », S20) **et**
> STORY-352→360, 362, 363. `EPIC-043` désignait donc **deux choses** : le socle notification ici, le
> socle dossier-client dans `sprint-status.yaml`, un dépôt (`prospera-dossier-service`), une spine
> (`architecture-dossier-service-2026-08-15`) et onze stories frontend. ⇒ les épics notification
> sont renumérotés **EPIC-043→053 ⇒ EPIC-054→064**, et la réservation de `story_id` est **supprimée**.
>
> **La cause n'est pas l'arithmétique, c'est le lieu.** Une série annoncée dans un document d'épics
> est invisible : le prochain découpage qui cherche un numéro libre lit `sprint-status.yaml`, pas ce
> fichier. Une plage non enregistrée dans `sprint-status.yaml` **n'est pas réservée**. D'où le bloc
> `reserved_ranges` en tête du tracker, créé le 2026-08-15.
>
> Corollaire assumé : le coût d'une renumérotation d'épic est nul tant qu'**aucun fichier story
> n'existe** et que rien n'est slotté — ce qui reste le cas de cette série. Il ne le serait plus après.

### ⚠️ Avertissement d'estimation

Le PRD a **déjà corrigé une fois** son estimation : la séquence des modules donnait 2 sprints, le
découpage réel en donne 3 (34 + 34 + 21 = 89 pts). La spine ajoute ensuite du travail que
le PRD ne portait pas — trois files BullMQ séparées, la trace d'audit en base protégée, l'horloge
courte des variables, l'interception du « STOP », les compteurs pré-agrégés de la vue plateforme.

Le découpage réel donne **118 pts**, soit **+33 %** sur l'estimation du PRD — exactement le même ratio
que le découpage `paiement-service` (94 estimés → 118 réels). Après le report d'EPIC-063 et EPIC-064
(décision PO du 2026-08-04), il reste **104 pts sur trois blocs** :

> ⛔ **AUCUN SPRINT N'EST ATTRIBUÉ — corrigé le 2026-08-15.** Ce tableau annonçait « S23 → S25 ».
> **Ces trois sprints appartiennent à la fiscalité** (EPIC-027, EPIC-028, EPIC-029 — vérifié dans
> `sprint-status.yaml` le 2026-08-15). Le module n'a donc, à ce jour, **aucune place dans le plan** :
> il n'est slotté nulle part et `notification-service` n'existe pas dans le dépôt (zéro code).
> Les colonnes ci-dessous sont des **blocs d'ordonnancement**, pas des sprints — l'attribution est une
> décision PO.
>
> ⚠️ **Contrainte dure à respecter au slotting :** le module doit être livré **avant le sprint 37**,
> où la story « Émission du lien via `notification-service` » (PI-SPI) en dépend, et où STORY-304
> porte un hook aujourd'hui **inerte** en attendant le service.

| Bloc | Épics | Pts | Capacité 34 |
| --- | --- | ---: | --- |
| **Bloc 1** | EPIC-054, EPIC-055, EPIC-056 | **40** | ⚠️ +6 |
| **Bloc 2** | EPIC-057, EPIC-058, EPIC-059, EPIC-060 | **41** | ⚠️ +7 |
| **Bloc 3** | EPIC-061, EPIC-062 | **23** | ✅ −11 |
| *reporté* | EPIC-063, EPIC-064 | *14* | — |

**Le report solde le total mais pas la répartition** : les blocs 1 et 2 dépassent encore la capacité de
six et sept points. C'est un problème de **sprint planning**, pas de structure d'épics — les
frontières d'incrément du PRD ne sont pas des frontières de sprint obligatoires, et EPIC-057 (5 pts,
sans dépendance) comme EPIC-062 (9 pts, sans dépendance amont) se déplacent sans rien casser.

### Une story n'est pas du travail sur ce service

**C8 — l'authentification machine-à-machine entre services** est une décision **programme**, portée
en condition bloquante par AD-2. Sans elle, `auth-service` ne peut pas cesser d'envoyer ses messages
porteurs de secrets, donc l'incrément 2 ne peut pas se solder. Elle figure dans ce découpage parce
qu'elle **bloque le bloc 2**, pas parce que l'équipe notification la livre.

## Inventaire des exigences

### Exigences fonctionnelles

**A — Carnet de contacts**

- **FR-N01** — Un contact représente une personne joignable : nom d'usage, un ou plusieurs identifiants de canal, une langue préférée, un consentement par nature de message.
- **FR-N02** — Le contact est unique et dédoublonné au sein d'une organisation, sur l'identifiant de canal normalisé (format international pour le téléphone, minuscules pour l'e-mail).
- **FR-N03** — Le dédoublonnage s'arrête à la frontière de l'organisation : deux organisations détenant le même numéro détiennent deux contacts distincts, sans lien ni visibilité mutuelle.
- **FR-N04** — Un contact porte la trace des modules qui l'ont inscrit ; un client qui n'a souscrit que Relance ne voit que ce que Relance a renseigné.
- **FR-N05** — Le carnet ne stocke que ce qui sert à joindre. Aucune donnée métier n'y entre : elle transite comme variable de message.
- **FR-N06** — L'inscription ou la mise à jour d'un contact par un module est idempotente et n'écrase jamais un consentement.
- **FR-N07** — Recherche d'un contact par identifiant de canal, retournant tout ce que l'organisation détient sur cette personne.
- **FR-N08** — Import de contacts en masse avec compte rendu avant persistance : créations, rapprochements, lignes rejetées et motif.

**B — Modèles de message**

- **FR-N09** — Un modèle porte un objet (si le canal en a un), un corps avec des variables typées, une langue et un canal.
- **FR-N10** — Les modèles sont versionnés et immuables une fois utilisés ; un envoi référence la version exacte qui l'a produit.
- **FR-N11** — Prospera livre un socle de modèles système ; une organisation peut les surcharger sans les altérer pour les autres.
- **FR-N12** — Une organisation peut créer ses propres modèles. Le droit est porté par un rôle dédié.
- **FR-N13** — Langues au v1 : français et anglais. L'ajout d'une langue est une donnée, pas un développement.
- **FR-N14** — La langue est un attribut du couple (modèle, canal) : le SMS non latin bascule en UCS-2, 70 caractères par segment au lieu de 160. Le module annonce segments et coût estimé avant l'envoi.
- **FR-N15** — Rendu d'essai : prévisualiser un modèle avec un jeu de variables, sur chaque canal, sans consommer de quota ni écrire au journal.
- **FR-N16** — Un modèle porte un statut d'approbation par canal (`non requis` · `en attente` · `approuvé` · `refusé`).

**C — Canaux**

- **FR-N17** — Les canaux sont implémentés derrière un contrat unique `ChannelProvider`.
- **FR-N18** — Canaux du v1 : e-mail, SMS, WhatsApp, push, in-app.
- **FR-N19** — Le canal in-app est le seul dont le destinataire est un utilisateur Prospera authentifié : il ne passe pas par le carnet, et son état lu/non lu est fiable par construction.
- **FR-N20** — Le service publie les capacités de chaque canal : longueur, pièces jointes, accusés de délivrance et de lecture, bidirectionnalité.
- **FR-N21** — Un envoi peut désigner une liste ordonnée de canaux de repli. Le repli se déclenche sur échec technique du canal, jamais sur l'absence de lecture.
- **FR-N22** — Aucun canal n'est un prérequis de démarrage : le service démarre en mode dégradé et le dit dans son état de santé.

**D — Envoi transactionnel**

- **FR-N23** — Un module demande un envoi en fournissant modèle, destinataire, variables, canal (ou liste de repli) et son identité d'appelant. Jamais un texte déjà rendu.
- **FR-N24** — Le service consomme les événements métier du bus et déclenche l'envoi par correspondance événement → modèle, configurable par organisation.
- **FR-N25** — Tout envoi porte une clé d'idempotence ; rejouer une demande ou un événement n'envoie pas deux fois.
- **FR-N26** — Un envoi transactionnel ignore le désabonnement de masse, mais respecte un blocage global.
- **FR-N27** — Les messages sortants de `auth-service`, `kyc-service` et `expert-comptable` sont migrés vers ce service et leur code d'envoi retiré.

**E — Envoi de masse**

- **FR-N28** — Une liste est un ensemble nommé de contacts, constitué par sélection, import, ou remise par un module appelant.
- **FR-N29** — Un envoi de masse se prépare, se prévisualise sur un échantillon, et s'exécute ; les trois temps sont distincts et l'objet préparé est réutilisable.
- **FR-N30** — Exécution par lots avec point de reprise : une interruption puis reprise laisse zéro destinataire non servi et zéro servi deux fois, prouvé par comparaison du journal à la liste.
- **FR-N31** — Avant exécution : destinataires retenus, destinataires écartés et pourquoi, nombre de segments et coût estimé.
- **FR-N32** — Un envoi de masse est interruptible en cours d'exécution, avec état exact au moment de l'arrêt.
- **FR-N33** — Garde-fous par organisation : plafond d'envois par période et fenêtre horaire autorisée.
- **FR-N34** — Un envoi de masse peut requérir une validation par un rôle habilité avant exécution, activable par organisation.

**F — Journal d'envoi & accusés**

- **FR-N35** — Chaque envoi est journalisé : destinataire, canal, modèle et version, variables, module appelant, horodatages, statut, coût.
- **FR-N36** — Statut normalisé sur tous les canaux avec transitions autorisées explicites ; aucun saut arrière ; `échoué` porte un motif exploitable.
- **FR-N37** — Tout statut de lecture porte son niveau de certitude — `confirmé`, `présumé`, `indisponible sur ce canal`.
- **FR-N38** — Les accusés sont restitués au module appelant par événement sortant.
- **FR-N39** — Consultation et export du journal, filtrable par période, canal, envoi de masse, module appelant et statut.
- **FR-N40** — Rejeu manuel d'un envoi échoué, sans reconstruire la demande d'origine.

**G — Réponses entrantes**

- **FR-N41** — Le service reçoit les messages entrants des canaux bidirectionnels et les rattache à l'envoi qui les a provoqués.
- **FR-N42** — Une réponse est routée selon son contexte vers le module qui avait parlé.
- **FR-N43** — Une réponse sans contexte identifiable est orientée vers une destination par défaut configurable par organisation.
- **FR-N44** — L'inbox centralisée du Studio social (#14) est un consommateur de ce flux, pas son propriétaire.
- **FR-N45** — Une réponse fait passer l'envoi d'origine au statut `répondu`.

**H — Consentement, désabonnement & droits des personnes**

- **FR-N46** — Le consentement est enregistré par personne, par canal et par nature de message, avec date et source. Il ne se déduit jamais de l'absence de refus.
- **FR-N47** — Tout message de masse porte un moyen de désabonnement adapté au canal.
- **FR-N48** — Un désabonnement est opposable immédiatement, y compris à un envoi de masse déjà en cours d'exécution.
- **FR-N49** — Le désabonnement suit la personne, pas le module : un refus vaut pour tous les modules de l'organisation.
- **FR-N50** — Un désabonnement de masse n'éteint pas les messages transactionnels.
- **FR-N51** — Sur demande transmise par l'organisation responsable : restitution, rectification et effacement, par identifiant de canal.
- **FR-N52** — Un effacement conserve la preuve du désabonnement.

**I — Administration**

- **FR-N53** — Les droits sont portés par le catalogue de permissions plateforme (STORY-140), distincts et attribuables séparément.
- **FR-N54** — Une organisation configure ses passerelles sans accéder à celles d'une autre.
- **FR-N55** — Console d'exploitation sur `admin-panel`, bornée à quatre actions : file d'attente, échecs et motifs, rejeu d'un envoi échoué, suspension d'un envoi de masse.
- **FR-N56** — Les secrets de passerelle ne sont jamais restitués en lecture, ni journalisés, ni renvoyés par l'API.
- **FR-N56b** — Le service expose un fournisseur de candidats pour le moteur de règles de l'assistant (`FR-IA03b`).

**J — Mesure de consommation**

- **FR-N57** — Chaque envoi porte son coût unitaire (segments × tarif) et son auteur. Aucun envoi n'est anonyme.
- **FR-N57b** — Tout montant porte sa devise et se stocke en entier d'unité mineure. Le XOF et le GNF n'ont aucune décimale.
- **FR-N57c** — Une organisation multi-pays voit sa consommation par devise, sans conversion ni total agrégé.
- **FR-N58** — Le rattachement organisationnel de l'auteur est figé au moment de l'envoi, jamais recalculé.
- **FR-N59** — Restitution de la consommation par période, canal et nature : volume envoyé, délivré, échoué, coût.
- **FR-N60** — Ventilation au sein de l'organisation, par utilisateur et par rôle au v1 ; par équipe avec le module Équipe (#18).
- **FR-N61** — Vue plateforme (Money Vibes), toutes organisations confondues, réservée au rôle plateforme.
- **FR-N62** — Le tarif appliqué est enregistré avec l'envoi, pas recalculé à la lecture.
- **FR-N63** — Aucune facturation ni blocage sur dépassement au v1 ; le modèle de coût est complet pour que la facturation s'y branche sans reprise de données.

**K — Rétention & purge**

- **FR-N64** — Les durées de conservation sont paramétrables par organisation, chacune bornée par un plafond opposable que le service refuse de dépasser.
- **FR-N65** — Purge automatique à échéance, chaque exécution tracée et son compte rendu consultable.
- **FR-N66** — À 13 mois, le journal détaillé est remplacé par des agrégats anonymes.
- **FR-N67** — À la résiliation : export mis à disposition, puis suppression complète à 90 jours.
- **FR-N68** — La purge préserve la preuve de consentement et de désabonnement au-delà de la donnée qu'elle protège.

> **71 items pour « 68 FR » annoncés** — l'écart vient des trois exigences suffixées ajoutées après
> coup (FR-N56b à la revue croisée, FR-N57b et FR-N57c à l'élargissement Afrique de l'Ouest).
> Aucune n'est un doublon ; le compte du PRD est simplement antérieur.

### Exigences non fonctionnelles

- **NFR-1** — Vérité du statut de lecture *(structurante)* : « lu » n'a pas le même sens selon le canal.
  - **NFR-1a** — Tout statut de lecture est accompagné de son niveau de certitude (`confirmé` · `présumé` · `indisponible`). Aucune surface n'affiche « non lu » quand la vraie réponse est « on ne peut pas savoir ».
  - **NFR-1b** — Aucune décision automatique ne se déclenche sur un statut de lecture. Les automatismes se déclenchent sur l'absence de l'effet attendu.
- **NFR-2** — Envoi de masse traité par lots avec point de reprise : une interruption ne perd aucun destinataire et n'en sert aucun deux fois.
- **NFR-3** — Délais : envoi transactionnel **P95 < 30 s** ; envoi transactionnel sensible au temps (code de vérification) **P95 < 10 s** ; envoi de masse sans cible de bout en bout mais progression observable.
- **NFR-4** — Idempotence de bout en bout : toute demande et tout événement portent une clé ; l'invariant est prouvé par test, pas affirmé.
- **NFR-5** — Cloisonnement par organisation : contacts, modèles, listes, journaux et secrets. Aucune requête ne traverse cette frontière, y compris le dédoublonnage.
- **NFR-6** — Aucun canal n'est un prérequis de démarrage ; l'état de santé distingue « service indisponible » de « canal indisponible ».
- **NFR-7** — Confidentialité des secrets : ni restitués, ni journalisés, ni inclus dans une réponse d'API ou une trace d'erreur.

### Exigences additionnelles (issues de la colonne vertébrale)

Ces exigences ne figurent dans aucun FR : elles naissent des dix-neuf AD et doivent produire du
travail au même titre.

- **AR-01** — **Pas de starter, pas de greenfield isolé.** Le service se scaffolde sur le **moule des 18 services** déjà en place (`balance-service` comme référence la plus récente) : NestJS 11, relying-party JWKS, Mongoose 8.24, outbox, `nestjs-cls` + `nestjs-pino`, seuils de couverture 65/90/90/90. Aucune stack à inventer *(AD — paradigme, Stack)*.
- **AR-02** — **Port `:3008`** au `docker-compose` racine, et inscription dans l'`AUTH_AUDIENCE` de l'IdP *(Déploiement)*.
- **AR-03** — **Deux bases Mongo** sur le réplica set `rs0` : `notification_service` (readWrite) et `notification_service_preuves` (`find`+`insert` seulement), plus un **compte de maintenance** absent de la configuration du service *(AD-14)*.
- **AR-04** — **Trois files BullMQ disjointes** — `transactionnel-prioritaire`, `transactionnel`, `masse` — avec pools d'exécutants séparés, la file étant déterminée par la nature de l'envoi et jamais par l'appelant *(AD-13, NFR-3)*.
- **AR-05** — **Deux chemins d'entrée** : API pour les messages porteurs d'un secret, consumers de bus pour tout le reste *(AD-2)*.
- **AR-06** — **C8 — authentification machine-à-machine** : décision programme, condition bloquante de l'incrément 2 *(AD-2)*.
- **AR-07** — **Boîte de réception d'accusés append-only** avec vérification de signature avant persistance et **parseur brut monté uniquement sur les routes de webhook** *(AD-4, AD-17)*.
- **AR-08** — **Trois index uniques d'idempotence** distincts, plus la clé étendue `(orgId, cleIdempotence, regleDeclenchementId, destinataireRef, canal)` *(AD-3)*.
- **AR-09** — **Moteur de rendu par substitution de variables déclarées** — aucune compilation d'un texte lu en base *(AD-8)*.
- **AR-10** — **Normalisation d'identifiant de canal** en fonction pure du domaine, avec indicatif par défaut de l'organisation surchargeable à l'import, et stockage des deux formes *(AD-11)*.
- **AR-11** — **Calcul de segments** (GSM-7 / UCS-2) en fonction pure du domaine, annonçable avant le choix du canal *(AD-16)*.
- **AR-12** — **Compteurs pré-agrégés** pour la vue plateforme ; aucun chemin de code ne rend l'`orgId` facultatif sur une collection opérationnelle *(AD-16)*.
- **AR-13** — **Deux surfaces non authentifiées énumérées** à la gateway : désabonnement public et webhooks de passerelle, chacune avec son plafond de débit *(AD-17)*.
- **AR-14** — **Secrets de passerelle chiffrés AES-256-GCM**, clé maîtresse en environnement, aucun chemin de lecture en clair *(hérité `paiement` AD-14)*.
- **AR-15** — **Réutilisation du référentiel `pays-devises-ao@AAAA.N`** de `platform-catalog-service`, par `artifactUri` avec vérification de `checksum` ; référentiel irrésoluble ⇒ service dégradé *(AD-16)*.
- **AR-16** — **Schémas des topics `notification.*` au schema registry**, compatibilité BACKWARD imposée en CI *(hérité écosystème P9)*.
- **AR-17** — **État de santé à deux niveaux** : canal indisponible ⇒ dégradé sur ce canal ; zéro canal ou référentiel irrésoluble ⇒ service dégradé, pas sain *(AD-6, NFR-6)*.
- **AR-18** — **Politique de sauvegarde distincte** pour `notification_service_preuves` *(AD-14)*.
- **AR-19** — **Trois tests dans la définition de terminé**, pas dans la recette : rejeu d'envoi *(AD-3)*, reprise d'un envoi de masse interrompu *(AD-13)*, exactitude du XOF à zéro décimale *(AD-16)*.
- **AR-20** — **Amendement du §9.3 du PRD**, qui affirme une minimisation que FR-N35 contredit *(AD-15)*.

### Exigences de conception UX

Sans objet à ce découpage. Le PRD est **backend** ; la seule surface servie par le service est la
page publique de désabonnement (AD-17), dont le gabarit est livré avec le code. Les écrans de
console, de carnet, d'éditeur de modèle et de campagne relèvent de la série `FE-*` et de son propre
tracker.

### Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-N01 → FR-N08 | EPIC-054 — contact, dédoublonnage normalisé, frontière d'organisation, visibilité par module, import |
| FR-N09 → FR-N15 | EPIC-055 — modèle, versions immuables, socle surchargeable, langues, segments, rendu d'essai |
| FR-N16 | EPIC-063 — statut d'approbation, capacité déclarée du fournisseur |
| FR-N17, FR-N20, FR-N22 | EPIC-056 — port `ChannelProvider`, capacités publiées, démarrage dégradé |
| FR-N18 | EPIC-056 (e-mail) + EPIC-057 (in-app) + EPIC-063 (SMS, WhatsApp, push) |
| FR-N19 | EPIC-057 — in-app sans carnet, lu/non lu fiable par construction |
| FR-N21 | EPIC-063 — chaîne de repli |
| FR-N23, FR-N25, FR-N26 | EPIC-056 — demande d'envoi, idempotence, régime transactionnel |
| FR-N24, FR-N27 | EPIC-058 — consumers du bus, migration des trois services, `SM-1 = 0` |
| FR-N28 → FR-N34 | EPIC-061 — listes, instantané, lots avec reprise, garde-fous, validation |
| FR-N35 → FR-N40 | EPIC-056 — journal, statut normalisé, certitude, restitution, export, rejeu |
| FR-N41 → FR-N45 | EPIC-064 — messages entrants, rattachement à certitude, destination par défaut |
| FR-N46 → FR-N52 | EPIC-059 — consentement, désabonnement opposable, droits des personnes |
| FR-N53, FR-N54 | EPIC-054 — permissions au catalogue, cloisonnement des passerelles |
| FR-N55, FR-N56, FR-N56b | EPIC-060 — console bornée, secrets, fournisseur de candidats |
| FR-N57 → FR-N63 | EPIC-060 — coût figé, unité mineure, par devise, ventilation, vue plateforme |
| FR-N64 → FR-N68 | EPIC-062 — plafonds opposables, purge tracée, agrégats, résiliation |
| AR-01, AR-02, AR-03, AR-10, AR-14, AR-18 | EPIC-054 — socle, deux bases, normalisation, secrets, sauvegarde |
| AR-09, AR-11 | EPIC-055 — substitution sans compilation, calcul de segments |
| AR-04, AR-07, AR-08, AR-16, AR-17 | EPIC-056 — trois files, boîte de réception, index d'idempotence, schema registry, santé |
| AR-05, AR-06 | EPIC-058 — deux chemins d'entrée, **C8** (hors service) |
| AR-13 | EPIC-059 (désabonnement public) + EPIC-064 (webhooks entrants) |
| AR-12, AR-15 | EPIC-060 — compteurs pré-agrégés, référentiel pays × devise |
| AR-19 | EPIC-056, EPIC-060, EPIC-061 — les trois tests de la définition de terminé |
| AR-20 | EPIC-062 — amendement du §9.3 du PRD |

**Couverture : 71 exigences fonctionnelles sur 71 mappées, et 20 exigences additionnelles sur 20.**
Les 7 NFR sont transverses et portées par les critères d'acceptation des stories concernées, pas par
un épic dédié — sauf **NFR-3**, qui a sa story de preuve dédiée dans EPIC-056 (les trois files), et
**NFR-2**, prouvée par la story de reprise d'EPIC-061.

> **Une exigence reste partielle jusqu'à EPIC-064.** FR-N47 exige un moyen de désabonnement **adapté
> au canal**. EPIC-059 le livre pour l'e-mail et l'in-app (lien public, AD-17) ; sur les canaux où le
> refus arrive comme un **message entrant** — « répondez STOP » en SMS et WhatsApp — il exige
> l'interception d'AD-10, qui vit dans EPIC-064. Tant que ces canaux ne sont pas livrés, l'écart est
> sans effet ; il redevient bloquant le jour où EPIC-063 est ordonnancé. **Les deux ne se séparent
> pas.**

## Liste des épics

### EPIC-054 : Socle `notification-service`, carnet de contacts et cloisonnement

Le service existe, il est cloisonné, ses preuves sont ineffaçables, et une organisation peut y
enregistrer **qui elle veut joindre** — dédoublonné, normalisé, et réduit à ce qui sert à joindre.
*Couvre FR-N01→N08, FR-N53, FR-N54, NFR-5, NFR-7, AR-01, AR-02, AR-03, AR-10, AR-14, AR-18.*
**~13 pts.**

### EPIC-055 : Modèles versionnés, multilingues, et un rendu qui n'exécute rien

Le message appartient au service, le client peut écrire le sien, et le rendu ne compile jamais rien —
la substitution de variables déclarées ferme la surface d'exécution qu'ouvrirait FR-N12.
*Couvre FR-N09→N15, AR-09, AR-11.* **~11 pts.**

### EPIC-056 : Le premier message part — port de canal, e-mail, journal et accusés

Le cœur de l'incrément 1 : un e-mail part du service avec son journal, son statut normalisé, son
niveau de certitude et son coût — et il ne fait jamais la queue derrière autre chose.
*Couvre FR-N17, FR-N18 (e-mail), FR-N20, FR-N22, FR-N23, FR-N25, FR-N26, FR-N35→N40, NFR-1a, NFR-3,
NFR-4, NFR-6, AR-04, AR-07, AR-08, AR-16, AR-17, AR-19.* **~16 pts.**

### EPIC-057 : Le canal in-app

La cloche applicative — « 3 dossiers à valider ». Le seul canal dont le destinataire est un utilisateur
authentifié, donc sans carnet, sans passerelle et sans contrat : son état lu/non lu est écrit par le
service lui-même, ce qui en fait le seul `confirmé` par construction.
*Couvre FR-N18 (in-app), FR-N19, NFR-1a.* **~5 pts.**

### EPIC-058 : Le service devient l'organe de parole unique

`auth-service`, `kyc-service` et `expert-comptable` cessent d'envoyer. C'est le motif d'existence du
module, et son critère de sortie est un nombre : `SM-1 = 0`.
*Couvre FR-N24, FR-N27, AR-05, AR-06.* **~13 pts.**

### EPIC-059 : Consentement, désabonnement et droits des personnes

Le refus d'une personne est opposable immédiatement, traçable, et survit à l'effacement de tout le
reste — y compris à l'effacement qu'elle a elle-même demandé.
*Couvre FR-N46→N52, NFR-5, AR-13 (surface publique de désabonnement).* **~9 pts.**

### EPIC-060 : Mesure de consommation, multi-devise et console d'exploitation

Savoir qui consomme avant de savoir qui paie — sans jamais additionner des XOF et des NGN, et sans que
la restitution commerciale devienne la porte par laquelle le cloisonnement tombe.
*Couvre FR-N55, FR-N56, FR-N56b, FR-N57→N63, NFR-5, AR-12, AR-15, AR-19.* **~14 pts.**

### EPIC-061 : Envoi de masse — listes, lots avec reprise et garde-fous

Interrompre à mi-parcours et reprendre sans perdre ni doubler personne. C'est le critère de sortie de
l'incrément 3, et il se prouve en comptant.
*Couvre FR-N28→N34, FR-N48 (opposabilité en cours d'exécution), NFR-2, AR-04, AR-19.* **~14 pts.**

### EPIC-062 : Rétention, purge et fin de relation

La politique de conservation cesse d'être déclarative : elle s'exécute, elle se trace, et elle refuse
ce qui dépasse le plafond au lieu de le ramener en silence.
*Couvre FR-N64→N68, AR-20.* **~9 pts.**

---

## Épics reportés au-delà du bloc 3

**Décision PO du 2026-08-04.** Les passerelles tierces sont reportées : aucun contrat WhatsApp, SMS ou
push n'est signé (R2), et le PRD lui-même construit l'incrément 1 pour être livrable sans elles. Le
report est **scindé sur la ligne de la dépendance externe**, pas sur la ligne des épics — le canal
in-app (EPIC-057) n'en dépend pas et reste au bloc 2.

### EPIC-063 : Passerelles tierces — SMS, WhatsApp, push et la chaîne de repli

Les trois canaux qui coûtent de l'argent et qui exigent un contrat, plus « WhatsApp sinon SMS » qui
laisse une trace honnête de ce que chaque canal a coûté.
*Couvre FR-N16, FR-N18 (SMS, WhatsApp, push), FR-N21, NFR-1, NFR-6.* **~8 pts.**
**Déclencheur d'ordonnancement :** la signature du premier contrat de passerelle.

### EPIC-064 : Réponses entrantes et routage contextuel

Ce qui fait qu'une conversation existe dans les deux sens. **Reporté par dépendance, pas par choix :**
FR-N41 est explicite — « canaux bidirectionnels (WhatsApp au v1) » — donc sans EPIC-063 il n'existe
aucun canal d'où recevoir une réponse.
*Couvre FR-N41→N45, NFR-1b, AR-13 (webhooks entrants).* **~6 pts.**
**Dépend de :** EPIC-063. Porte aussi l'**interception du « STOP »** (AD-10), qui complète le
désabonnement d'EPIC-059 sur les canaux où le refus arrive comme un message entrant.
