---
title: "Addendum au PRD — Moteur d'installation"
status: draft
created: 2026-11-10
updated: 2026-11-10
prd: prd.md
---

# Addendum au PRD — Moteur d'installation

*Ce document reçoit le « comment » du PRD `prd.md`, destiné à l'architecture : mécanismes, noms de routes et d'événements, champs et formes de données, horloges par délai, chemins du code déjà livré. Le PRD garde les capacités et fait foi ; chaque section ci-dessous nomme les exigences qu'elle détaille, et chaque morceau dit de quel endroit du PRD il vient. Le texte est déplacé tel quel. Les identifiants (FR-n, NFR-n, SM-n, UJ-n) sont ceux du PRD, qui seul les définit.*

## §A-1 Horloges de référence et horloge scellée

**Détaille :** FR-15, FR-34, NFR-11.

Sur quelle horloge tombe chaque délai, comment l'horloge scellée est bornée, et qui émet les transitions dues au temps.

**Depuis FR-34 : qui émet les transitions dues au temps, et sur quelle horloge**

Le moteur les calcule sur l'**horloge de référence** (horloge scellée sur site, NFR-11 ; horloge de Money Vibes sur la plateforme) et émet `etat-publie.changed` à l'heure dite ; à son redémarrage, il émet celles qu'il a manquées. Le moteur de la partie A est le **seul émetteur** de `etat-publie.changed`, sur site comme sur la plateforme ; sur site, il lit l'horloge scellée auprès de l'agent d'instance, qui la tient (§7, C3 et C5).

**Depuis FR-15 : l'horloge de chaque délai**

- **Chaque délai a son horloge de référence** :

  | Délai | Horloge | Départ | Qui l'observe |
  |---|---|---|---|
  | Droit d'utiliser, préavis, lecture seule, sur site | horloge scellée de l'instance | `echeanceLe` du module, portée par la licence (FR-14) | l'agent d'instance tient l'horloge ; le moteur de l'instance émet l'événement (FR-34) |
  | Droit d'utiliser, préavis, lecture seule, sur la plateforme | horloge de Money Vibes | échéance du contrat (pour un élément acheté : celle de l'abonnement d'hébergement, FR-32) | le moteur de la plateforme |
  | Essai prospect et effacement | horloge de Money Vibes (l'essai est sur la plateforme) | ouverture de l'offre d'essai | le moteur de la plateforme |
  | Délai de silence : alerte de J+7 | horloge de Money Vibes | dernier contact connu de Money Vibes | Money Vibes |
  | Délai de silence : gel de J+30 | horloge scellée | dernier contact vu par l'instance | l'agent d'instance ; le moteur de l'instance publie le gel (FR-34) |
  | Retour arrière et rétrocompatibilité C12 (7 jours) | horloge de l'instance qui promeut (scellée sur site) | promotion | l'agent d'instance |
  | Correctif de sécurité (72 h) | horloge de Money Vibes | client prévenu (FR-19) | Money Vibes, qui appelle le DSI |
  | Vague (7 jours sans incident) | horloge de Money Vibes | promotion dans la vague | Money Vibes |

**Depuis FR-15 : la borne de l'horloge scellée et le temps machine éteinte**

- L'horloge scellée **n'avance pas sans borne** : au-delà de 48 heures d'écart avec le temps machine
  mesuré, elle n'avance pas et l'anomalie est tracée. Seule une **heure de référence** signée par Money
  Vibes (dans chaque réponse de contact et chaque fichier) peut la corriger, en avant comme en arrière.
  Test : avancer la date du serveur de 10 ans ; aucune échéance ne tombe. `[ASSUMPTION : borne de
  48 heures]`
- Une horloge logicielle ne sait pas combien de temps la machine est restée **éteinte** : pour ce temps-là,
  elle ne croit la date du serveur que si elle avance, dans la borne ci-dessus. Le mécanisme (puce de
  sécurité ou non) est laissé à l'architecture.

## §A-2 État publié : faits, calcul, canaux, forme et projection sur le droit

**Détaille :** FR-33, FR-34, FR-43, §3.1, §7 (C5).

Le PRD (§3.1, FR-34) fixe les états publiés et ce que chacun permet ; cette section dit comment l'état publié se calcule, par où il circule, ce qu'une lecture rend, et comment il se projette sur le statut du droit au catalogue (`EntitlementStatus`).

**Depuis §3.1, axe 2 : qui ouvre un module**

**Seul le moteur ouvre un module** (décision du PO, 2026-11-10). Il pose le droit `ACTIVE` à l'entrée en
`INSTALLE`, dans l'espace où elle a lieu ; aucun autre chemin ne crée un droit ni ne rouvre un `REVOKED`
(FR-4). Seule exception : le module `instance`, posé `INSTALLE` et `ACTIVE`, sans terme, à la naissance de
l'organisation, dans chaque espace où elle naît (chemin 0 de FR-4, FR-42). Un module en attente ou bloqué n'ouvre rien aux utilisateurs (FR-5) ; ses vérifications passent
par l'identité de service du moteur (FR-6). Chaque transition est journalisée : qui, quand, depuis quel
chemin (FR-4).

**Depuis §3.1, axe 3 : les faits portés par le droit**

Les faits :
- **sanction** : une suspension décidée est en cours, ou non ;
- **`echeanceLe`** : la fin de la période payée d'un élément en abonnement ; absente pour un élément acheté
  et payé sur site ; **sur la plateforme**, celle de l'abonnement d'hébergement et de maintenance pour un
  élément acheté (FR-32) ; même calcul que `paiement-service` (`terme.ts`) ;
- **`preavisJusquau`** : `echeanceLe` + 30 jours, écrit avec l'échéance ;
- **`essai`** : `{ finLe, effacementLe }`, pour un droit ouvert par une offre d'essai (FR-33).

**Depuis §3.1, axe 3 : élément acheté, impayé**

**Sur site**, un élément **acheté** et payé (droit d'utiliser perpétuel) n'a ni `echeanceLe` ni
`preavisJusquau` : il ne passe **jamais** par `PREAVIS` ni `LECTURE_SEULE` ; sa fin de maintenance touche
l'instance (`VERSION_FIGEE`), pas ses modules. **Sur la plateforme**, qui n'a pas de version figée, un
élément acheté porte l'`echeanceLe` de l'abonnement d'hébergement et de maintenance (FR-32) : arrêter cet
abonnement le fait passer par `PREAVIS`, puis `LECTURE_SEULE`, puis la suppression de ses données. `PREAVIS` est un état de 30 jours **entre** l'échéance et la lecture
seule (décision du PO, 2026-11-10) ; « échu ⇒ lecture seule immédiate » de STORY-727 lot 4 est ajusté en
conséquence. **Un impayé ne produit jamais `SUSPENDU`** (décision du PO, 2026-11-10) : la suspension
automatique à J+7 de STORY-280 est retirée (§8.4).

**Depuis §3.1 : comment l'état publié se calcule**

**L'état publié** (un par organisation × module, dans l'espace où l'on se trouve). Si l'axe 2 ne vaut pas
`INSTALLE`, il donne l'état publié ; sinon, l'axe 3 décide (`ACTIF` se publie `EN_SERVICE`). Comme seul le
moteur pose `ACTIVE`, un droit ouvert sans installation n'existe pas ; le test en matrice de FR-34 le
vérifie.

**Depuis §3.1 : projection de l'état publié sur le statut du droit au catalogue (`EntitlementStatus`)**

| État publié | Droit (catalogue) |
|---|---|
| `NON_INSTALLE` | absent |
| `EN_INSTALLATION` | absent, ou `REVOKED` pour une réinstallation |
| `DESINSTALLE` | `REVOKED` |
| `EN_SERVICE` | `ACTIVE`, échéance à venir ou sans échéance |
| `ESSAI_PROSPECT{finLe}` | `ACTIVE`, `essai.finLe` à venir |
| `ESSAI_TERMINE{effacementLe}` | `ACTIVE`, `essai.finLe` passée |
| `PREAVIS{finLe}` | `ACTIVE`, `echeanceLe` passée, `preavisJusquau` à venir |
| `LECTURE_SEULE` | `ACTIVE`, `preavisJusquau` passée |
| `SUSPENDU` | `SUSPENDED` |

**Depuis FR-33 : l'offre d'essai sur le droit**

Elle passe par le chemin 1 de FR-4 et pose `essai: { finLe, effacementLe }` sur chaque droit (FR-34).

**Depuis FR-34 : les deux canaux**

- **Deux canaux, un seul contenu** :
  - une **route de lecture** par organisation, servie par le moteur de chaque espace :
    `GET /etat-publie/{organisationId}`. Elle exige d'être membre authentifié de l'organisation ; les
    droits déclarés et la santé ne sont rendus qu'aux administrateurs (FR-35). `[ASSUMPTION : chemin de
    la route]`
  - un **événement** `etat-publie.changed`, émis à chaque changement de l'état publié d'un module : état
    absolu, `eventId` pour l'idempotence, clé de partition `organisationId`. Les gardes des modules le
    projettent dans leur read-model (C2 amendée).

**Depuis §7, clause C5 : ce que publie et sert le moteur**

| C5 | Publie `entitlement.changed` (existant ; champs additifs `preavisJusquau` et `essai`) et `etat-publie.changed`, dont la partie A est le seul émetteur, transitions dues au temps comprises (FR-34) ; sert `GET /etat-publie/{organisationId}` (FR-34) ; consomme le feu vert de la Reprise ; topics de bilan, de licence et de réception définitive à nommer dans la spine |

**Depuis FR-34 : de quoi l'état publié est calculé**

- L'état publié est **calculé** à partir du droit (statut et faits de l'axe 3, §3.1) et des faits propres au
  moteur (installation, espace, instance, santé, interrupteurs), dont le moteur est le propriétaire (C3).
  `entitlement.changed` reste la seule source du **droit** ; l'état publié n'en est pas une copie.

**Depuis FR-34 : ce que rend une lecture**

- Une lecture rend :
  - **l'instance** : espace (`ESSAI` | `REEL`), état (`NORMAL` | `GEL`), `VERSION_FIGEE` oui/non, version
    de plateforme, heure de référence ; `hebergement` (`PLATEFORME` | `SITE`) ; `fuseau` de
    l'organisation (identifiant IANA) ; `retourArriereEnCours`, s'il y en a un (étape et avancement,
    FR-40) ; `miseAJourAnnoncee`, s'il y en a une (version, `retourArriere` `SANS_PERTE` | `AVEC_PERTE`,
    date, FR-17, FR-18) *(champs ajoutés le 2026-11-11 pour la coque, spine `prospera-app` AD-7 et AD-14)* ;
  - **chaque module** connu du catalogue : son `code` ; le **libellé de son module commercial** (FR-37,
    ajouté le 2026-11-11) ; son **état publié** (énumération fermée de neuf
    valeurs, §3.1) ; la date que l'état porte (`finLe` ou `effacementLe`) ; `acquis` (oui quand le contrat
    ou la licence le donne sans qu'il soit installé ; lu par la console seulement) ; sa version de code ;
    ses **interrupteurs** `{ code, allume, dateLimite }` (FR-17) ; sa **santé** `OK` |
    `DEGRADE{raison, action}` ; les **droits de tenant** qu'il déclare (FR-35). Le module `instance` y
    figure comme les autres : son état publié vaut toujours `EN_SERVICE`, dès la naissance de
    l'organisation (chemin 0 de FR-4) ;
  - **l'utilisateur courant** : ses **droits effectifs** (FR-35), et s'il est **DG** ou
    **administrateur**, pour les bandeaux (§3.1) ;
  - **l'accueil de l'organisation** : marque, logo, couleurs, tableau de bord d'accueil, langue (D1).
   

**Depuis FR-34 : représentation sur le droit**

- **Représentation sur le droit** (champs additifs de `entitlement.changed` v2, sans changer
  `schemaVersion`, comme le terme de STORY-609) : `echeanceLe` reste l'échéance **payée**, calculée comme
  dans `paiement-service` ; `preavisJusquau` (= `echeanceLe` + 30 jours) est écrit avec elle ; un droit
  ouvert par une offre d'essai porte `essai: { finLe, effacementLe }`. `PREAVIS` et `ESSAI_PROSPECT` ne
  reposent donc jamais sur une « échéance repoussée ».

**Depuis FR-34 : les cas de plus du test en matrice**

La matrice compte trois cas de plus : un droit `ACTIVE` sans installation, hors le module `instance` (il ne doit pas pouvoir exister) ; la date du serveur reculée de 40 jours (l'état ne change pas) ; la date du serveur avancée de 10 ans (aucune échéance ne tombe, NFR-11).

**Depuis FR-34 : la lecture sur site**

- Sur site, la lecture rend la même forme ; les droits y viennent de la **licence**, projetée en droits du
  catalogue (source `licence`, FR-14).

## §A-3 Licence et clés : compteurs, heures, validité, révocation, fichier d'urgence

**Détaille :** FR-14, NFR-7, NFR-8.

Comment l'instance refuse une licence ancienne, comment les clés de signature vivent et meurent, et quelles clés protègent les sauvegardes.

**Depuis FR-14 : le numéro de licence et sa mémoire par clé**

- Chaque licence porte un **numéro qui ne fait que croître**. L'instance retient, **pour chaque clé de
  signature**, le plus haut numéro vu, dans son état de confiance (NFR-11), et refuse toute licence plus
  ancienne, même authentique : `LICENCE_ANTERIEURE`. Redéposer la licence d'avant une sanction ne lève donc
  rien.

Le numéro par clé ne sert qu'à borner l'attaque d'une clé compromise qui signerait un numéro démesuré (2⁶³) : le fichier d'urgence réinitialise le compteur de cette seule clé (NFR-8).

**Depuis FR-14 : validité des clés**

Une licence à échéance n'est acceptée que si sa clé est dans sa période de validité, lue sur l'horloge scellée : une instance coupée cesse d'elle-même de croire une clé ancienne. Une licence perpétuelle reste vérifiable par la chaîne de la clé racine.

**Depuis NFR-7 : les clés des sauvegardes**

Sur site, une **clé d'exploitation scellée sur l'instance** permet les automatismes (retour arrière, test mensuel), et une **clé de secours** est remise au client, qui seule permet de restaurer sur une autre machine.

**Depuis NFR-8 : la clé racine et le rythme des clés**

Une **clé racine hors ligne**, au coffre, qui ne sert qu'à certifier les clés de signature ; les clés de signature **changent chaque année** `[ASSUMPTION : rythme]`.

**Depuis NFR-8 : le fichier d'urgence**

Une clé compromise est révoquée par un **fichier d'urgence** signé par la clé racine : il **réinitialise le plus haut numéro** retenu pour cette clé (et l'heure de la dernière licence acceptée, si cette clé l'avait signée), révoque tout ce qu'elle a signé, ré-émet les licences sous une nouvelle clé et passe par le chemin rapide (FR-19).

## §A-4 Contact avec Money Vibes : signal, vérification quotidienne, empreinte de l'état de confiance

**Détaille :** FR-16, FR-22, NFR-11.

Ce que transporte chaque contact, et comment Money Vibes voit qu'un état de confiance a reculé.

**Depuis FR-16 : le contenu du signal**

- Elle envoie un **signal hebdomadaire** (comme Odoo), selon un schéma fermé (FR-26) : version, santé par
  module, licence, empreinte de l'état de confiance (NFR-11), indicateurs de niveau 0. Une instance en
  version figée continue de l'envoyer.

**Depuis FR-16 : la vérification quotidienne et le contact par fichier**

Cette requête n'envoie que l'identifiant de l'instance, sa version, le numéro de sa licence et l'empreinte de son état de confiance (niveau 0) ; sa réponse porte, s'il y a lieu, une nouvelle licence, la liste de révocation (NFR-8) et l'heure de référence. - Quand le contact est un fichier, rien ne répond : le fichier porte lui-même la licence, la liste de révocation et l'heure de référence (FR-22).

**Depuis NFR-11 : de quoi l'état de confiance est fait, et son ancrage**

- l'horloge scellée, le plus haut numéro de licence
  vu par clé, l'heure de référence de la dernière licence acceptée, le registre des consentements et la tête du journal forment l'**état de confiance** de
  l'instance. Il est ancré **hors des sauvegardes** : aucune restauration, aucun instantané de machine
  virtuelle, aucun retour arrière `AVEC_PERTE` ne le ramène en arrière. Il n'avance que.

**Depuis NFR-11 : l'empreinte rapportée et le rétablissement**

Son empreinte est rapportée à Money Vibes à chaque contact ; si elle a reculé, Money Vibes refuse toute licence et tout export de niveau 1 à 3 pour cette instance, et ouvre un ticket. Après la perte du serveur, il est rétabli depuis la dernière empreinte connue de Money Vibes, par un fichier signé.

## §A-5 Module `instance` et droits de tenant

**Détaille :** FR-35.

Comment le moteur s'enregistre au catalogue, la liste de ses droits, et où se calcule l'intersection des droits.

**Depuis FR-35 : format des codes de droit**

Le format d'`auth-service` refuse aujourd'hui un code de module à tiret (`pi-spi`) : la limite est signalée à C7 (§8.4).

**Depuis FR-35 : où se calcule l'intersection**

L'intersection se calcule **dans le moteur**, qui la rend dans la lecture (`utilisateur.droitsEffectifs`, §A-2). La coque, l'app expert-comptable et l'app mobile la **lisent** sans la recalculer (spine `prospera-app` AD-6, amendé le 2026-11-11) ; la garde de chaque module ferme ses routes quand son module n'est pas ouvert (C2) et vérifie le droit de chaque route. Jamais dans `perms[]`, qu'`auth-service` remplit sans appeler le catalogue.

**Depuis FR-35 : le module `instance` au catalogue**

Le moteur le pose à la naissance de toute organisation, dans chaque espace où elle naît, par le chemin 0 de FR-4 (FR-42) : `INSTALLE` et `ACTIVE` d'emblée, sans essai ni mise en service ; sans terme, non suspendable, jamais vendu. Son état publié vaut toujours `EN_SERVICE` (FR-34). Ses droits passent donc la vérification d'`auth-service` (STORY-167 AC 2) comme ceux de tout module.

**Depuis FR-35 : les droits du moteur**

- Les droits du moteur : `instance:mise-a-jour:consulter`, `instance:mise-a-jour:planifier`,
  `instance:mise-a-jour:revenir`, `instance:fichier:deposer`, `instance:support:ouvrir`,
  `instance:consentement:donner`, `instance:donnees:exporter`, `instance:bilan:consulter`. Sur la plateforme, `planifier`, `revenir`, `fichier:deposer` et `support:ouvrir` n'ont pas
  d'objet (Money Vibes décide, FR-17, FR-18) : l'écran des rôles ne les propose pas.

## §A-6 Point de décision, manifeste et identité de service

**Détaille :** FR-4, FR-6, FR-38.

Comment le point de décision est embarqué et prouvé, ce que porte un manifeste, et comment les vérifications passent la garde d'un module en installation.

**Depuis FR-4 : un seul point de décision embarqué**

- Le point de décision est une **bibliothèque unique**, embarquée telle quelle sur site, avec la même suite
  de conformité.

**Depuis FR-4 : preuve par mutation**

- Retirer la vérification du point de décision fait échouer les tests du chemin 1 ; retirer la règle
  « aucun droit créé hors des chemins 0 et 1 » fait échouer les tests des chemins 2 à 6 (test de
  mutation).

**Depuis FR-4 : contrôle du manifeste en CI**

La CI d'un dépôt peut vérifier son manifeste contre la copie publiée du graphe (FR-38).

**Depuis FR-6 : identité de service du moteur**

- Les vérifications s'exécutent sous l'**identité de service du moteur**, que la garde du module laisse
  passer sur les seules routes de vérification déclarées au manifeste, tant que le module est
  `EN_INSTALLATION` (C2 et C13 amendées). Aucun utilisateur n'y accède.
- Pendant un rejeu (FR-42), les **routes d'import** déclarées au manifeste laissent passer, de la même
  façon, l'identité de service du moteur et celle de la Reprise de données (décision du PO, 2026-11-11).

**Depuis FR-38 : les champs du manifeste**

- Le manifeste porte : `code`, version, `depends: [{ code, raison }]`, `enrichiPar`, prérequis,
  vérifications avec leurs critères et leurs routes (FR-6), droits de tenant (FR-35), `retourArriere:
  SANS_PERTE | AVEC_PERTE` (FR-18), `interrupteurs: [...]` (FR-17), routes autorisées en lecture seule
  (export, états réglementaires, FR-43), profil `docker compose` (C10).

## §A-7 Espaces : bac à sable, naissance et rejeu

**Détaille :** FR-9, FR-42.

Comment l'essai vérifie un bac à sable et lit le logiciel réel du client, comment une organisation naît, et qui importe chaque élément du dossier d'installation.

**Depuis FR-9 : vérifier un bac à sable**

- Un bac à sable est **vérifié** quand le client confirme par écrit qu'il est distinct de son logiciel réel,
  et que le connecteur constate une base distincte (adresse et identifiant de base différents de ceux
  déclarés pour le réel).

**Depuis FR-9 : lire le logiciel réel pendant l'essai**

Pour **lire** le vrai logiciel du client, ce qui reste permis pendant l'essai, il reçoit des identifiants **en lecture seule**, propres à l'essai ; à leur déclaration, une écriture de test est tentée et doit être refusée par le logiciel du client, sinon les identifiants sont rejetés.

**Depuis FR-42 : qui crée l'organisation**

`[ASSUMPTION : le moteur demande la création à l'auth-service de chaque espace, qui publie identity.org.created]`

**Depuis FR-42 : le propriétaire de chaque élément du dossier**

- **Rejeu** : chaque élément du dossier d'installation a un **propriétaire**, qui l'importe par un contrat
  nommé (C5, C13) : offre (moteur) ; rôles et comptes (`auth-service`) ; zones (`reseau`) ; tables de
  correspondance (Reprise de données) ; réglages (chaque module).

## §A-8 Mises à jour : interrupteurs, version de plateforme, rétrocompatibilité, fenêtre N-1

**Détaille :** FR-17, FR-18, FR-21, §3 (Version de plateforme).

Où vivent les interrupteurs, ce qu'écrit une promotion, ce qu'exige la clause C12, et d'où vient la règle N-1.

**Depuis FR-17 : où vivent les interrupteurs**

Les interrupteurs vivent dans le moteur et se lisent dans l'état publié (FR-34).

**Depuis §3, Version de plateforme : la promotion**

La promouvoir met à jour, en une écriture journalisée, la `versionCode` de tous les droits concernés (FR-17).

**Depuis FR-17 : ce qu'écrit une promotion sur la plateforme**

La promotion met à jour, en une écriture journalisée, la `versionCode` de tous les droits concernés.

**Depuis FR-18 : la clause C12**

- Cela repose sur la clause **C12** du contrat de module (décision du PO, 2026-11-10) : pendant 7 jours,
  chaque migration est **rétrocompatible** (on étend d'abord ; on ne contracte qu'à une version suivante,
  quand la fenêtre de la version qui a étendu est close partout) ; chaque consommateur d'événements ignore
  les champs **et les valeurs d'énumération** qu'il ne connaît pas ; un événement qui change de forme passe
  à une nouvelle version de topic (`@2`), publiée à côté de l'ancienne pendant 7 jours.

**Depuis FR-21 : d'où vient la règle N-1**

C'est une règle nouvelle, sur l'instance, qui reprend le principe de la fenêtre de support des versions de modules (`fenetre-de-support.ts`).

## §A-9 Code déjà livré, ajusté à ce PRD : STORY-280, 281, 365, 727

**Détaille :** FR-32, FR-35, §3.1, §8.4.

Le détail, lot par lot, de ce que le PRD change dans le code présent sur `dev` (aucun contrat client n'est en cours ; les droits de test sont réamorcés).

**Depuis FR-35 : STORY-365**

- STORY-365 (« le RBAC s'étend au tenant ») est **requalifiée** contre 166/167 : il reste le filtrage par
  modules ouverts (dans la coque et les gardes) et la lecture des droits depuis les manifestes.

**Depuis FR-32 : ce que le parcours remplace dans le code**

Il remplace « échu ⇒ lecture seule immédiate » de STORY-727 lot 4 et la suspension automatique à J+7 de STORY-280 (§8.4).

**Depuis §8.4 : STORY-727**

| STORY-727 | **Lot 2** : une échéance soldée prolonge les modules installés et note les autres « acquis, à installer » ; elle ne crée plus de droit. **Lot 4** : préavis de 30 jours avant la lecture seule (`preavisJusquau`) ; liste blanche d'export et d'états (FR-43). **Lot 6** : un pack modifié ne s'applique qu'aux nouveaux contrats ; la propagation ne crée plus de droit. **Lot 7** : le socle de vertical n'ouvre plus rien ; `VerticalPack` devient le catalogue du vertical. Les droits de test sont réamorcés, sans reprise de l'existant |

**Depuis §8.4 : STORY-280 et STORY-281**

| STORY-280 et STORY-281 (`paiement-service`, catalogue) | Le jalon `IMPAYE` (J+7) ne produit plus `SUSPENDED` : le consommateur `suspension-par-impaye` sort du chemin de l'impayé (il peut servir à la sanction décidée). Le jalon `PREAVIS` de J-7 est renommé `RAPPEL`, dans `paiement-service` et dans les modèles de notification ; aucun contrat n'est en cours, donc aucune clef d'idempotence à migrer. La régularisation (chemin 3 de FR-4) sort de `PREAVIS` ou de `LECTURE_SEULE`. La grâce de 281 reporte l'échéance du droit d'utiliser, donc le début du préavis |

## §A-10 Pseudonymisation contre le recoupement

**Détaille :** FR-28.

Comment un échantillon de niveau 1 résiste à la ré-identification par recoupement.

**Depuis FR-28 : contre la ré-identification par recoupement**

- **Contre la ré-identification par recoupement** : les identifiants de dossier sont remplacés par un
  pseudonyme salé propre à chaque export, si bien que deux exports ne se joignent pas ; un groupe de moins
  de 5 dossiers qui partagent les mêmes valeurs d'âge, de zone et de produit est retiré de l'échantillon.

## §A-11 Amendements demandés au contrat de module

**Détaille :** §8.4 (ligne « Contrat de module »).

Clause par clause, ce que le PRD demande au contrat de module (`CONTRAT-DE-MODULE-2026-11-09.md`) ; les amendements sont rédigés dans ce fichier (PR à venir) et attendent la validation du PO le 13/11.

**Depuis §8.4 : amendements au contrat de module**

- **§0 et §1** : Installer (le moteur installe puis met en service ; aucun autre chemin ne pose `ACTIVE`, hors le module `instance` à la naissance de l'organisation, chemin 0 de FR-4), Pack (pack commercial ; `VerticalPack` = catalogue du vertical), Suspendre (sanction décidée, plus l'impayé), Expiré (préavis de 30 jours, puis lecture seule).
- **C1** : `depends: [{ code, raison }]` et les nouveaux champs du manifeste (FR-38).
- **C2** : la garde lit l'état publié poussé, jamais l'horloge de son conteneur ; lecture seule selon FR-43 ; route d'export exemptée ; identité de service du moteur sur les routes de vérification ; preuve par état publié (neuf états).
- **C7** : le format d'`auth-service` refuse les codes de module à tiret, à élargir.
- **C8** : une entrée est visible si l'état publié vaut `EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS` ou `LECTURE_SEULE`, et si l'utilisateur a le droit ; l'app expert-comptable suit la même règle pour le cabinet.
- **C11 §5** : une clause par finalité, compte de service IA dédié (FR-27).
- **C11** : chaque module avec IA remet ses indicateurs agrégés de niveau 0 à l'agent d'instance par un contrat nommé (FR-26) ; un module a le même schéma de données pour toutes les organisations (§7, C6).
- **C12** (rétrocompatibilité 7 jours, valeurs d'énumération, topics `@2`, interrupteurs déclarés) et **C13** (installable sous contrôle, FR-38).
- **§6** : une section de **treize** lignes, et le contrôle de préparation à mettre à jour.
- **Q3** : sa raison (« l'impayé suspend déjà tous les droits », STORY-280) n'est plus vraie.
- **Q4** : deux exceptions écrites (effacement de l'essai prospect, FR-33 ; suppression des données de l'acheteur hébergé sur la plateforme, après sa lecture seule, FR-32).
- **§9** : suit la révision de D3.
- **Garde C6** : garde de balayage posée au gabarit de chaque dépôt (SM-6)
