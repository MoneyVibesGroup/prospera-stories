---
title: "PRD — Prospera Microfinance"
status: draft
created: 2026-11-13
updated: 2026-11-13
project: prospera
verticale: IMF (SFD, zone BCEAO)
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13)
prd_lies: [prd-distributeur-2026-11-12 (règles transverses, partie 3 partagée), prd-reseau-zones-2026-08-02, prd-catalogue-produits-2026-08-02, prd-paiement-service-2026-08-02, prd-notification-service-2026-08-02, prd-reprise-donnees-2026-11-10, prd-connecteurs-2026-11-10, prd-moteur-installation-2026-11-09, prd-assistant-ia-2026-08-02]
mode: rapide
---

# PRD — Prospera Microfinance

*Brouillon complet, rédigé en mode rapide le 2026-11-13 à partir du récit du PO (`brain-dump-po-2026-11-13.md`), de ses réponses aux 71 questions (`questions-po-2026-11-13.md`), de sept extraits de la démo, des documents, de la plateforme et de la réglementation (`extract-*.md`), et du plan de rédaction (`plan-redaction.md`). Décisions et raisons dans `.memlog.md`. Les hypothèses restantes sont indexées au §13 ; les actions qui restent au PO sont au §12.2. Reste à faire : réconciliation avec les sources, relectures, tri des hypothèses, passe de style.*

---

## 0. Objet du document

Ce PRD décrit **Prospera Microfinance** : l'outil qui sert une institution de microfinance (IMF, un système financier décentralisé ou SFD) de la zone BCEAO, **du premier contact avec un client jusqu'à la clôture de son prêt**, et qui pilote son réseau d'agences. Il s'adresse au PO, à Dev A et Dev B, et aux auteurs du PRD assurance, qui s'écrit juste après lui.

**Le client visé** est une grande IMF à plusieurs agences, au stade du pré-contrat. Le PRD ne la nomme jamais : il écrit « l'IMF ». Elle démarre en **février 2027**, en même temps que les autres clients Prospera, **sur ses propres serveurs** (§7.9).

**Prospera ne remplace pas le logiciel de l'IMF.** Ce logiciel, appelé ici **« le cœur »**, garde les comptes, l'épargne, la caisse du guichet et la comptabilité officielle. **Il fait foi pour l'argent.** Prospera se branche à côté, surtout pour le crédit et le pilotage (FR-2). Le cœur de l'IMF n'est pas encore connu : le PRD définit les échanges sans dépendre d'un produit (§6.5, annexe C). Pour la démonstration, Money Vibes livre un **cœur fictif** qui parle ce contrat (§6.6) ; le vrai connecteur viendra plus tard.

**La priorité absolue est le crédit, détaillé de bout en bout** (partie 2). Tout le reste de la plateforme doit aussi fonctionner au premier jour, sauf la comptabilité, qui n'est pas prioritaire : au mieux, un export des écritures vers le cœur (§7.6).

**La source du produit** est le front de démo `prospera-font-end/prospera-web` (une trentaine de modules ; le crédit compte 23 écrans), avec les cahiers des charges par bundle et le discours produit `docs/prospera_microfinance.md`. Le backend que la démo appelle ne compte pas : ce PRD décrit des **capacités**, sans partir de cette API. Comme pour le distributeur, la démo montre beaucoup et n'enregistre rien : ses chiffres sont souvent des constantes et la plupart de ses boutons de décision sont décoratifs. **Ce PRD exige en vrai ce que la démo montre**, et ajoute les écrans qui lui manquent (visites, pièces, cautions, simulation, comité, décaissement).

**Ce PRD réutilise le PRD distributeur.** Les règles transverses de ce dernier (PRD-D §4) s'appliquent ici. Ses modules partagés (PRD-D partie 3 : terrain, recouvrement, équipes, marketing, automatisations, tableau de bord, support, finance) ne sont pas réécrits : la partie 4 les cite et dit seulement ce que l'IMF exige en plus.

**L'IA est présente sur tout le processus**, et ce PRD la spécifie module par module : score et décision suggérée du dossier, analyse micro (client, activité, flux, comportement, saison) et macro-économique (prix, inflation, conjoncture, concentration du portefeuille par secteur d'activité), relances, recouvrement, tournées et **zones de prospection**, caisse, épargne, risque, conformité, équipes, marketing (FR-8). Le **moteur** est l'**IA commune**, une famille de modules à part, partagée par toutes les verticales (Risque, Agents métier, Relation client, Pulse ; note de vision du 2026-11-10) : ce PRD dit **ce que l'IA fait pour l'IMF**, l'IA commune dit **comment**. L'IA propose, un humain décide.

Le document se lit en quatre parties :

| Partie | Contenu | Sections |
|---|---|---|
| **1. Le produit** | vision, rôles, parcours, vocabulaire, règles transverses (le cœur fait foi, paramètres, rôles et périmètres, secteur d'activité, IA commune, piste d'audit, usure, jeu de démonstration) | §1 à §4 |
| **2. Le crédit de bout en bout** | le module `credit`, phase par phase, de la demande à la clôture | §5 |
| **3. Les autres modules propres à l'IMF** | produits financiers, clients et KYC, collecte, caisse des collecteurs, échange avec le cœur, cœur fictif, risque de portefeuille, conformité BCEAO, reprise du portefeuille | §6 |
| **4. Les modules partagés et cadrés** | fiches de renvoi vers le PRD distributeur et les PRD existants, avec ce que l'IMF exige en plus ; l'installation chez l'IMF | §7 |

Suivent les exigences transverses (§8), les indicateurs (§9), le périmètre (§10), les non-objectifs (§11), les décisions, actions et risques (§12), les hypothèses (§13), puis trois annexes : **A** le contrat de module (13 lignes par module), **B** la matrice d'accès, **C** le contrat d'échange avec le cœur.

**Sources et décisions.** Le récit du PO (`brain-dump-po-2026-11-13.md`), ses réponses aux 71 questions (`questions-po-2026-11-13.md`), le journal `.memlog.md`, et sept extraits de la démo, des documents, de la plateforme et de la réglementation (`extract-*.md`). En cas d'écart, l'ordre de priorité est : le récit du PO, puis ses réponses, puis la démo, puis les cahiers, puis les sources secondaires.

---

## 1. Vision

Une IMF vit de son portefeuille. Ce qui la fait vivre ou mourir, c'est la qualité des prêts qu'elle accorde et la vitesse à laquelle elle voit un retard. Aujourd'hui, le dossier de crédit passe de main en main sur papier, la décision se prend sans trace, et le retard se découvre quand il est déjà vieux.

Prospera Microfinance donne à chaque acteur du crédit **une seule histoire du dossier**, enregistrée pas à pas, de l'agent qui rencontre le client jusqu'au comité qui fige les conditions, puis au gestionnaire qui suit le remboursement. Il voit le retard le jour même, relance au bon moment, et remonte au directeur général une image vraie du réseau, par agence, par agent, par secteur d'activité, jusqu'au client.

Il le fait **à côté du cœur de l'IMF, sans le remplacer** : le cœur tient l'argent, Prospera tient la décision et le suivi.

**Les cinq promesses du discours produit** (`docs/prospera_microfinance.md`), et ce que ce PRD en fait :

| # | Promesse (mot pour mot) | Impact annoncé | Ce que le PRD mesure (§9) |
|---|---|---|---|
| 1 | Réduire le PAR (Portefeuille à Risque) | Baisse du PAR > 30 jours de 15 à 25 % | PAR 30 en % de l'encours, mesuré depuis les échéances du cœur ; la baisse s'entend en **valeur relative** (un PAR de 12 % qui passe à 9-10 %) [ASSUMPTION] |
| 2 | Augmenter la productivité terrain | 30 à 50 % de clients supplémentaires par agent | clients actifs par agent, visites par jour, par rapport à une valeur de départ mesurée au démarrage |
| 3 | Digitaliser 100 % des encaissements | Zéro manipulation d'espèces | part des encaissements par Mobile Money et PI-SPI. Les espèces restent possibles (guichet, collecte) : la promesse est une **cible**, pas une règle qui refuse les espèces |
| 4 | Piloter en temps réel | Alertes IA et tableaux de bord 360° | fraîcheur des chiffres (délai entre l'événement et le tableau de bord), alertes émises et traitées |
| 5 | Garantir la conformité BCEAO | Reporting réglementaire automatisé + export PDF | indicateurs périodiques produits à l'heure ; export PDF en moins de 10 secondes |

---

## 2. Pour qui

### 2.1 Les rôles

L'IMF travaille avec **seize rôles** (décision du PO, question F1). Chacun ne voit que son périmètre (FR-5).

| Code | Rôle | Périmètre | Ce qu'il fait dans Prospera |
|---|---|---|---|
| DG | Directeur général | réseau entier | pilote le réseau ; siège au comité ; valide les rôles sensibles, le rapport BCEAO, la perte définitive |
| DAF | Directeur administratif et financier | réseau | finance, budget et rentabilité ; autorise un décaissement en espèces |
| ROC | Responsable des opérations de crédit | réseau | décide après le chargé de crédit ; préside le comité ; pilote le recouvrement ; seul à bloquer ou débloquer un dossier |
| RA | Responsable d'agence | son agence | pilote son agence ; peut siéger au comité ; peut demander un réexamen |
| CC | Chargé de crédit | ses dossiers, son agence | constitue et instruit le dossier, visite, rend l'avis |
| GP | Gestionnaire de portefeuille | son portefeuille | suit le prêt après le décaissement, enregistre les promesses, relance |
| AT | Agent terrain | sa zone | prospecte, crée les fiches, visite, envoie les pièces |
| COLL | Collecteur | sa zone, ses clients | collecte remboursements et épargne sur le terrain, remet au guichet |
| COM | Commercial | sa zone, ses prospects | crée les prospects, suit l'acquisition |
| RCC | Responsable commercial et collecte | son agence ou sa région | pilote commerciaux et collecteurs |
| RSQ | Analyste risque | réseau | lit le risque, rend un avis consultatif sur les dossiers au-dessus d'un seuil |
| REC | Agent de recouvrement | ses zones affectées | mène les actions de recouvrement |
| AUD | Auditeur interne | réseau, lecture seule | contrôle, lit le journal des accès et la piste d'audit |
| CPT | Comptable et caissier | son agence | valide les paiements à valider, autorise un décaissement en espèces, rapproche |
| COMM | Communication et marketing | réseau | campagnes, acquisition |
| ADMIN_IMF | Administrateur informatique de l'IMF | comptes et paramètres | crée les comptes, règle les paramètres ; **ne lit aucune donnée métier** |

Les vues « direction commerciale » et « direction des engagements » de la démo sont des vues du DG, pas des comptes. Il n'y a pas de rôle « paie » : la rémunération reste privée (décision F8 ; PRD-D FR-8).

### 2.2 Hors cible (v1)

- Le client final de l'IMF n'a pas d'application à lui : il reçoit des messages (SMS, WhatsApp) et des liens de paiement.
- Les autorités (BCEAO, Commission bancaire, ministère) ne se connectent pas : elles reçoivent les rapports déposés par l'IMF.
- La banque, l'assurance et le distributeur ont leurs propres PRD.

### 2.3 Parcours clés

Les noms des protagonistes et les montants sont ceux du jeu de démonstration (FR-11) [ASSUMPTION : noms fictifs à valider par le PO].

**UJ-1 — Le premier prêt d'Afi, de la rencontre au décaissement.** Kossi, agent terrain de l'agence de Kpalimé, rencontre Afi, couturière, sur son lieu de travail. Il crée sa fiche sur son téléphone, sans réseau : identité, activité « Confection » (secteur d'activité), photos, position GPS. Le soir, la fiche se synchronise. Le KYC est validé par Yawa, chargée de crédit, qui n'a pas créé la fiche. Kossi choisit le produit « Crédit Commerce 12 mois » pour 600 000 FCFA. La simulation affiche l'échéancier, la mensualité et un TEG conforme au plafond d'usure. Le dossier naît SOUMIS ; Yawa est prévenue. Elle liste les pièces manquantes, enregistre deux cautions, puis planifie deux visites, au domicile et à l'atelier, car le montant dépasse 500 000 FCFA. Chaque visite porte une photo et une position prise à moins de 100 m du lieu. Elle lit l'analyse des 5C, le score et la proposition venue de l'IA commune, coche la checklist à 100 % et rend un avis favorable. Edem, le ROC, approuve 550 000 FCFA sur 12 mois et désigne Mawuli comme gestionnaire. Le comité (Edem et le RA de Kpalimé) fige les conditions et génère l'échéancier : le dossier passe EN_GESTION. L'ordre de décaissement part ; Afi reçoit l'argent par Mobile Money, et le cœur confirme le décaissement. Afi, Mawuli, Kossi et le responsable commercial sont prévenus. *Ce parcours est le parcours n° 1 : il doit marcher en entier dans la démo, sur un dossier créé à la main (FR-12).*

**UJ-2 — Le prêt du groupe solidaire « Les Battantes ».** Un groupe de huit commerçantes demande un crédit de groupe. Un seul dossier de groupe porte huit sous-dossiers, une caution solidaire mutuelle, une seule décision du comité et un échéancier par membre. Quand une membre est en retard, la relance vise d'abord la membre, puis le groupe.

**UJ-3 — Le DG lit son réseau un lundi matin.** Le DG ouvre son tableau de bord : PAR 30 du réseau, décaissements de la semaine, alertes. Il descend du réseau à la région, puis à l'agence de Kara, dont le PAR monte, puis à l'agent, puis au client. Il refait la même lecture par secteur d'activité : le retard se concentre sur l'agriculture après une mauvaise récolte. Il pose une question au Copilot de l'IA commune, qui lui répond avec des chiffres sourcés.

**UJ-4 — La journée de Komla, collecteur, en zone sans réseau.** Komla visite ses clients du marché, encaisse des remboursements et de l'épargne en espèces, remet un reçu. Tout est enregistré sur son téléphone, sans réseau. Le soir, il remet l'argent au guichet ; sa caisse est clôturée et comparée à ce qu'il a déclaré ; un écart déclenche une alerte. Les encaissements partent vers le cœur, qui les comptabilise.

**UJ-5 — Le rapport BCEAO du mois.** Le DAF ouvre le rapport du mois : indicateurs du portefeuille calculés par Prospera, ratios calculés depuis la balance livrée par le cœur. Les ratios dont la balance manque s'affichent « en attente des données du cœur ». Le DG valide le rapport ; l'IMF l'exporte en PDF, le signe et le dépose elle-même.

**UJ-6 — Le prospect découvre la démo.** Une équipe de l'IMF reçoit l'accès à la démonstration : trois agences, dix agents, mille prêts actifs, branchés sur le cœur fictif. Elle crée une quatrième agence, un agent, puis un dossier de prêt qu'elle mène jusqu'à EN_GESTION (UJ-1). Rien n'est simulé à l'écran : chaque action est enregistrée et relue par les autres rôles.

**UJ-7 — Le retard de Kodjo, de J-3 au plan d'étalement.** Trois jours avant l'échéance, Kodjo reçoit un message WhatsApp préventif avec un lien de paiement. À J+1, un rappel courtois ; à J+3, un SMS. À J+7, une relance ferme et une mission terrain ; le ROC est alerté car le risque est élevé. Kodjo promet de payer le 20 ; Mawuli enregistre la promesse et les relances s'arrêtent jusqu'au 20. La promesse n'est pas tenue. Le ROC propose un plan d'étalement, qui est envoyé au cœur ; le prêt passe PLAN_ETALEMENT.

**UJ-8 — Le ROC pilote le recouvrement.** Le ROC voit le réseau trié par PAR, descend agence par agence jusqu'au dossier, définit une stratégie et affecte des agents de recouvrement par zone. Il bloque un dossier, avec un motif. Toute nouvelle demande du client et de ses cautions est suspendue.

**UJ-9 — L'informaticien de l'IMF installe une mise à jour.** L'administrateur reçoit une mise à jour, l'essaie dans l'espace d'essai, choisit la date, l'applique, et peut revenir en arrière en un clic. Il ne lit aucune donnée métier (§7.9).

---

## 3. Vocabulaire

Le vocabulaire commun est celui du PRD distributeur (PRD-D §3), lu avec les équivalences IMF ci-dessous. Les termes propres à ce PRD :

| Terme | Sens dans ce PRD |
|---|---|
| **Le cœur** | Le logiciel bancaire ou de gestion de SFD déjà en place chez l'IMF. Il tient les comptes, l'épargne, la caisse du guichet, les écritures. Il fait foi pour l'argent. |
| **Le cœur fictif** | Un cœur de démonstration livré par Money Vibes, qui parle le contrat d'échange (§6.6). Il n'est jamais installé en production réelle. |
| **Dossier de crédit** | L'histoire d'une demande, de SOUMIS à CLOTURE ou REFUSE, tenue par Prospera. |
| **Prêt** | Le prêt décaissé, tenu par le cœur ; Prospera en garde une projection (encours, échéances, retards). |
| **Échéancier contractuel** | L'échéancier généré par le comité de crédit de Prospera, envoyé au cœur avec le dossier accordé. |
| **Échéancier officiel** | L'échéancier tenu par le cœur après le décaissement. Il fait foi. Un écart avec l'échéancier contractuel est une alerte. |
| **Ordre de décaissement** | La demande, émise par Prospera, de verser l'argent d'un prêt accordé. Selon le canal, le cœur ou `paiement` l'exécute (FR-2). |
| **TEG** | Taux effectif global, actuariel et annuel, frais et assurance inclus, pénalités exclues. C'est lui que le plafond d'usure contrôle (FR-10). |
| **PAR n** | Portefeuille à risque à n jours : encours restant dû des prêts dont une échéance a plus de n jours de retard, divisé par l'encours total (PRD-D §6.0). |
| **Agence, zone** | Une agence est un lieu ; une zone est un périmètre (patron du PRD reseau). Le code d'agence est celui du cœur s'il en a un, sinon celui de Prospera. |
| **Secteur d'activité** | L'activité économique du client (commerce, agriculture, artisanat, services…), selon une nomenclature commune à toutes les verticales (FR-7). |
| **IA commune** | La famille de modules d'IA de Prospera (Risque, Agents métier, Relation client, Pulse), commune à toutes les verticales. |

**Équivalences avec le PRD distributeur** (le noyau partagé reste neutre ; l'écran affiche le mot de l'IMF) :

| Noyau (PRD-D) | Distributeur | IMF |
|---|---|---|
| Tiers | point de vente, client | client, membre, emprunteur |
| Tiers collectif | — | groupe solidaire |
| Créance | facture | échéance de prêt |
| Engagement | facture | prêt |
| Zone | zone commerciale | zone d'agent dans une agence |
| Commercial terrain | commercial | agent terrain, collecteur |
| Encaissement sans créance | avance, acompte | dépôt d'épargne |
| Blocage du crédit | commande refusée | nouvelle demande refusée, décaissement suspendu |

---

## 4. Partie 1 — Les règles transverses

Ces exigences valent pour **tous** les modules des parties 2, 3 et 4.

### 4.1 Les règles du PRD distributeur s'appliquent

#### FR-1 : Les règles transverses du PRD distributeur valent ici

Les règles suivantes du PRD distributeur s'appliquent à tous les modules de ce PRD, sans être réécrites : tout s'enregistre côté serveur (PRD-D FR-1) ; les boutons pas encore branchés sont « bientôt », sans date, jamais simulés (PRD-D FR-2) ; les enchaînements entre rôles sont des étapes enregistrées (PRD-D FR-3) ; une seule table d'accès, appliquée par le serveur (PRD-D FR-5, PRD-D FR-6) ; chaque rôle a sa vue (PRD-D FR-7) ; les données privées restent privées (PRD-D FR-8) ; les garde-fous bloquent (PRD-D FR-13) ; un modèle unique d'alerte et de décision (PRD-D FR-14) ; tout indicateur se calcule depuis les données (PRD-D FR-15) ; une prédiction dit d'où elle vient (PRD-D FR-16) ; de vrais documents et des exports (PRD-D FR-17, PRD-D FR-18) ; chaque module est installable seul (PRD-D FR-19).

**Conséquences (testables) :**
- Chaque test de recette des FR cités du PRD distributeur est rejoué sur les écrans de l'IMF, avec le vocabulaire de l'IMF (§3).
- Le test « aucun bouton ni branché ni bientôt » (PRD-D FR-2) couvre les écrans de ce PRD, en particulier les 23 écrans du crédit.
- Ne sont jamais « bientôt » : tout ce qu'exige le parcours UJ-1 (de la demande à EN_GESTION), et l'application terrain hors connexion (UJ-4).

### 4.2 Le cœur fait foi pour l'argent

#### FR-2 : Ce que Prospera tient, ce que le cœur tient

Le cœur de l'IMF fait foi pour l'argent (décision du PO). Prospera ne tient jamais un solde officiel. Le partage est le suivant :

| Objet | Qui le tient | Ce que fait l'autre |
|---|---|---|
| Dossier de crédit, de SOUMIS à EN_COMITE_CREDIT, décisions, avis, visites, pièces, cautions | **Prospera** | le cœur reçoit le dossier accordé |
| Échéancier contractuel (généré par le comité) | **Prospera** | envoyé au cœur avec le dossier accordé |
| Ordre de décaissement | **Prospera** l'émet | espèces et virement : le **cœur** l'exécute ; Mobile Money et PI-SPI : **`paiement`** l'exécute, puis le déclare au cœur (décision A3) |
| Compte de prêt, encours officiel, échéancier officiel après décaissement, pénalités, intérêts de retard, imputation | **le cœur** | Prospera les lit et les projette (décisions A2, A4) |
| Remboursements | **le cœur** les comptabilise | Prospera les saisit (terrain, guichet, Mobile Money) et les renvoie au cœur **si le cœur sait les recevoir** ; sinon il produit la liste à saisir dans le cœur (décision A1) |
| Épargne, comptes, caisse du guichet, écritures, balance | **le cœur** | Prospera les lit (décision A8) |
| Caisse des collecteurs (argent ramassé sur le terrain, remise au guichet) | **Prospera** | le cœur reçoit les encaissements |
| Relances, promesses, recouvrement, pilotage, risque proposé | **Prospera** | le cœur reçoit ce qui change l'argent (plan d'étalement, perte) |

**Conséquences (testables) :**
- Aucun écran de Prospera n'affiche un solde, un encours ou un reste dû comme officiel sans dire de quand date la dernière lecture du cœur.
- Un remboursement saisi dans Prospera reste « en attente du cœur » tant que le cœur n'a pas renvoyé le mouvement correspondant ; il n'est jamais compté deux fois.
- Si le cœur ne sait pas recevoir les remboursements, la liste « à saisir dans le cœur » est disponible chaque jour, par agence, et se vide à mesure que les mouvements du cœur arrivent.
- Un écart entre l'échéancier contractuel et l'échéancier officiel crée une alerte au ROC et au GP (§6.5).
- Dans la démonstration, le cœur fictif tient tout ce que le tableau attribue au cœur (§6.6).

### 4.3 Tout seuil est un paramètre de l'IMF

#### FR-3 : Les seuils de la démo sont des valeurs par défaut

Tout seuil métier (montants, nombres de cautions et de visites, quorum, délais de relance, rayons de présence, scores minimum, taux, tolérances) est un **paramètre de l'IMF**, réglé par l'administrateur sous la validation d'un rôle métier, versionné et daté. Les valeurs de la démo et des réponses du PO sont les valeurs par défaut (décision du PO).

**Conséquences (testables) :**
- Changer un paramètre ne modifie pas un dossier déjà engagé : un dossier garde les règles en vigueur à sa soumission (même principe que les produits, §6.1).
- Chaque changement de paramètre est enregistré : ancienne valeur, nouvelle valeur, auteur, validateur, date.
- Aucun seuil du PRD n'est écrit dans le code : un test change chaque paramètre listé et vérifie l'effet.

#### FR-4 : Les seuils d'alerte se calibrent sur les données de l'IMF

Les **seuils d'alerte** (PAR, concentration, écart de caisse, délais) sont calibrés **sur les données de l'IMF**, pas figés sur les valeurs de la démo (décision E5). À la reprise des données, Prospera calcule une proposition de seuil par alerte à partir de l'historique de l'IMF, un humain la valide, et la proposition est recalculée chaque trimestre [ASSUMPTION : méthode et fréquence de calcul].

**Conséquences (testables) :**
- Chaque seuil d'alerte affiche sa source : « valeur de démonstration », « calculé sur vos données du … », ou « fixé par … le … ».
- Un seuil calculé n'entre en vigueur qu'après validation par le rôle qui possède l'alerte.

### 4.4 Rôles, périmètres et séparation des tâches

#### FR-5 : Seize rôles, cinq échelons, un périmètre par rôle

Les seize rôles du §2.1 existent dès l'installation. Chacun voit son périmètre, appliqué par le serveur (PRD-D FR-6) : **réseau → région → agence → zone → portefeuille**. Le DG voit tout le réseau ; le RA son agence ; le GP son portefeuille ; l'agent sa zone (récit §5). Une personne peut cumuler des rôles, sauf ceux que la séparation des tâches interdit (FR-6).

**Conséquences (testables) :**
- Un RA qui interroge un dossier d'une autre agence reçoit un refus, sans donnée.
- Les comptes sont créés par ADMIN_IMF ; les rôles DAF, AUD et ROC ne sont actifs qu'après la validation du DG ; chaque création ou retrait de rôle fait intervenir deux personnes (décision F7).
- ADMIN_IMF ne lit aucune donnée métier : un test ouvre chaque écran métier avec ce rôle et vérifie le refus.
- La double authentification est obligatoire pour DG, DAF, ROC, CPT, AUD et ADMIN_IMF ; une session dure 8 h au plus et se ferme après 30 minutes d'inactivité (paramètres ; décision F9).

#### FR-6 : Séparation des tâches et délégation tracée

Une même personne ne peut pas, sur un même dossier : créer la fiche et valider le KYC ; instruire (avis CC) et décider (ROC) ; décider (ROC) et autoriser le décaissement en espèces (CPT ou DAF) ; saisir un paiement et le valider. Le DG ne décide pas à la place du ROC, sauf **délégation explicite**, datée, motivée et tracée, en cas d'absence (décision C4). Ces règles suivent l'instruction BCEAO n° 017-12-2010 sur le contrôle interne des SFD.

**Conséquences (testables) :**
- Chaque combinaison interdite est refusée par le serveur avec un code neutre (`SEPARATION_DES_TACHES`) et un libellé clair.
- Une délégation a une date de début et de fin ; hors de ces dates, elle n'agit plus ; l'AUD la voit dans la piste d'audit.

### 4.5 Le secteur d'activité

#### FR-7 : Le secteur d'activité est une donnée de premier rang

Chaque client porte un **secteur d'activité** obligatoire, choisi dans une nomenclature commune à toutes les verticales de Prospera (secteur, puis sous-secteur), et chaque prêt hérite du secteur de l'activité qu'il finance (décision F2). Le secteur est une **dimension de pilotage** partout où il y a une agence, un agent ou un produit : tableau de bord, PAR, recouvrement, risque, objectifs. C'est aussi une donnée que Prospera fournit à l'IA commune (FR-8).

**Conséquences (testables) :**
- Une fiche client ne peut pas être validée sans secteur d'activité.
- Chaque indicateur de portefeuille se lit par secteur, avec la même descente que par géographie (UJ-3).
- La nomenclature est partagée avec les autres verticales [ASSUMPTION : nomenclature de départ inspirée de la classification des activités de l'UEMOA, à valider] ; l'IMF peut ajouter des sous-secteurs, pas modifier les secteurs communs.

### 4.6 L'IA dans le processus

#### FR-8 : L'IA est spécifiée ici, servie par l'IA commune

Les capacités d'IA font partie du produit de l'IMF, **sur tout le processus** (correction du PO du 2026-11-13). Chaque module de ce PRD les écrit comme des exigences, d'après l'inventaire des IA du projet (`docs/prospera_modules_ia.md`, 13 modules) et l'analyse étendue du dossier de la démo. Le **moteur** qui les sert est l'**IA commune** : une famille de modules à part, partagée par toutes les verticales, qui apprend de leurs angles (la même PME emprunte à l'IMF, achète chez le distributeur, a un bilan chez l'expert-comptable). Ce PRD dit **ce que l'IA fait pour l'IMF** ; l'IA commune dit **comment**.

**Où est l'IA, et où elle est spécifiée :**

| Moment du processus | Ce que l'IA fait | Spécifié en |
|---|---|---|
| Prospection | suggère les **zones de prospection** (zones sous-couvertes, clients actifs au km², visites rares) et la réaffectation des agents ; note les prospects (zone couverte, secteur porteur, réactivité) | §7.1 terrain, §7.4 marketing |
| Fiche client | score dynamique 0-100, probabilité de défaut, classe BCEAO prévue, alertes sur signaux faibles, carte des zones à risque | §6.2 |
| Demande et simulation | recommande le produit adapté au profil et les conditions optimales, sous le plafond d'usure | §5.2, §6.1 |
| Instruction | score du dossier et sa décomposition ; **analyse étendue** : transactions, comportement (**micro**), **macro-économie** (prix, inflation, conjoncture du secteur et de la zone), saison, historique de recouvrement, **saturation du secteur** dans le portefeuille de l'agence ; vérification du comportement de crédit ; alertes (fraude, garanties, BCEAO) ; analyse rédigée ; décision suggérée (approuver, approuver réduit, demander des garanties, refuser) | §5.4 |
| Décision ROC et comité | rapport avec proposition de montant, de taux et de durée | §5.6, §5.7 |
| Remboursements et caisse | validation Mobile Money (erreurs, doublons), rapprochement, anomalies et fraude de caisse, prévision de trésorerie à 7 jours, rééquilibrage entre agences | §6.3, §6.4 |
| Relances | déclenchement selon le profil de retard, ordre de priorité par risque, choix du canal et du moment, probabilité de succès par canal, messages pré-rédigés | §7.2 |
| Recouvrement | score de recouvrement (probabilité de récupérer), stratégie par agence, analyse du comportement de retard, scripts, conseils par rôle | §7.2 |
| Terrain | ordre de visite optimal, saisie vocale vers la fiche, alerte de proximité d'un client en retard, rapport du soir | §7.1 |
| Épargne | comptes dormants, produit d'épargne recommandé, score de fidélité (sur les données lues du cœur) | §6.2 |
| Risque de portefeuille | prévision du PAR par agence, zone et **secteur d'activité**, perte attendue, coût du risque, secteur moteur du risque, analyse des provisions | §6.7 |
| Conformité et audit | score de conformité, alertes réglementaires avec délai d'action, rapport BCEAO préparé, anomalies, corrélation d'événements suspects | §6.8 |
| Équipes | écart à l'objectif, comparaison entre agences, recommandations de coaching, prévision du PAR par zone | §7.3 |
| Pilotage | Copilot par rôle (questions en langage courant, chiffres sourcés, lecture seule), priorités du jour, anomalies d'agence, synthèse du DG | §7.3 |
| Marketing | segmentation, ciblage des campagnes, notes de prospects ; chatbot WhatsApp « bientôt » (décision F4) | §7.4 |

**Règles communes à toutes ces capacités :**
- **Provenance** affichée sur chaque proposition : règle ou modèle, version, date de calcul, données utilisées (PRD-D FR-16). Le mot « IA » ne s'affiche que pour un modèle ; tant qu'un modèle n'existe pas, la capacité est servie par des **règles explicables** et le dit (décision F6).
- **L'IA propose, un humain décide** : aucune proposition n'engage l'IMF (spine microfinance, AD-12). Un humain qui s'écarte d'une proposition écrit un motif ; l'écart et le motif sont enregistrés et renvoyés comme correction.
- **Le secteur d'activité** (FR-7) et les données **micro** (client, activité, flux) et **macro** (prix, inflation, saison, conjoncture par secteur et par zone) sont des entrées de premier rang. Les données macro viennent de sources datées et citées [ASSUMPTION : sources de départ — indices de prix et d'inflation publics, calendrier agricole, données agrégées de l'IA commune (Pulse) quand elles existent].
- **Consentement** : une donnée de l'IMF ne quitte ses serveurs vers l'IA commune qu'avec son accord écrit ; l'apprentissage est fédéré (« on met en commun l'apprentissage, pas les données » ; PRD moteur d'installation). Sans consentement, l'IA tourne sur les seules données de l'IMF, sur ses serveurs.
- **Jamais bloquant** : si une capacité d'IA est indisponible, son emplacement le dit et le processus avance sur l'analyse humaine.

**Conséquences (testables) :**
- Chaque capacité du tableau a au moins une exigence dans la section indiquée, avec ses entrées, sa sortie et son rôle destinataire.
- Chaque proposition affichée porte origine, version, date et données utilisées ; un test vérifie qu'aucune n'en manque.
- Couper l'IA commune ne bloque aucun parcours : UJ-1 va jusqu'à EN_GESTION sans score ni recommandation.
- Sans consentement de l'IMF, aucune donnée ne sort vers l'IA commune ; un test sur une installation sans consentement le vérifie.
- Une analyse macro-économique cite ses sources et leur date ; une source de plus de 90 jours est signalée « ancienne » (paramètre).

### 4.7 La trace

#### FR-9 : Qui a fait quoi, et quand

Chaque changement d'état d'un dossier, d'un prêt, d'un paiement, d'un paramètre ou d'un droit est **horodaté**, avec son auteur, son rôle, l'état d'avant et l'état d'après, et son motif quand il en faut un (récit §4). Le journal est infalsifiable et conservé **au moins dix ans** (instruction BCEAO n° 017-12-2010).

**Conséquences (testables) :**
- L'historique d'un dossier se lit de bout en bout, dans l'ordre, sur une seule page.
- Aucune entrée du journal ne peut être modifiée ni supprimée, même par ADMIN_IMF ; une tentative est elle-même tracée.
- L'AUD peut exporter le journal d'un dossier, d'un agent ou d'une période.
- Le journal des accès (qui a consulté quoi) est lisible par l'AUD seul.

### 4.8 Le plafond d'usure

#### FR-10 : Aucun prêt au-dessus du plafond d'usure

Le **plafond d'usure** est un paramètre daté, par pays et par catégorie d'institution. Sa valeur pour les IMF de l'UMOA est **24 % par an** (décision du PO ; Décision n° 19 du 29/12/2025/CM/UMOA, en vigueur le 01/06/2026). Il s'applique au **TEG** : taux actuariel annuel, frais et assurance compris, pénalités et impôts exclus. Prospera calcule le TEG à la simulation, à la décision du ROC et au comité, et **refuse** tout dossier dont le TEG dépasse le plafond en vigueur à la date du comité.

**Conséquences (testables) :**
- Un produit dont les conditions par défaut donnent un TEG supérieur au plafond ne peut pas être publié (§6.1).
- Un dossier dont les conditions modifiées par le ROC ou le comité dépassent le plafond est bloqué avec `TEG_AU_DELA_DU_PLAFOND`, et le TEG calculé est affiché.
- Chaque type de frais porte une case « inclus dans le TEG » ; un test vérifie le TEG d'un prêt d'exemple avec une précision de 0,01 point.
- Le produit d'exemple de la démo (2,5 % par mois, TEG affiché 36,4 %) n'est pas repris ; le jeu de démonstration n'a que des produits conformes (FR-13).

### 4.9 Le jeu de démonstration

#### FR-11 : L'IMF de démonstration

La démo tourne sur une **IMF fictive** branchée sur le **cœur fictif** (§6.6) : **3 agences, 10 agents, 1 000 prêts actifs** (décision B4), avec leurs clients, leurs groupes solidaires, leur historique de paiements et de retards, leurs produits et leurs paramètres. Pays par défaut : le Togo, avec Flooz et Mixx comme opérateurs Mobile Money et PI-SPI pour les banques ; le pays et les opérateurs sont des paramètres [ASSUMPTION : agences fictives Lomé-Centre, Kpalimé, Kara ; nom de l'IMF fictive à choisir par le PO].

**Conséquences (testables) :**
- Le jeu couvre chaque statut de dossier et de recouvrement au moins dix fois, chaque secteur d'activité principal, et un PAR 30 réaliste (entre 5 % et 15 %).
- Chacun des seize rôles a un compte de démonstration et voit son périmètre.

#### FR-12 : Dans la démo, on crée pour de vrai

Dans la démonstration, on peut **créer une agence, créer un agent, et créer un vrai dossier de prêt** que l'on mène, rôle après rôle, **jusqu'à l'état EN_GESTION** (décision B4 ; UJ-1, UJ-6). Le cœur fictif exécute le décaissement et renvoie la confirmation.

**Conséquences (testables) :**
- Une agence créée apparaît dans le réseau, dans les périmètres et dans les tableaux de bord sans autre manipulation.
- Un agent créé reçoit un compte, un rôle et une zone, et peut se connecter à l'application terrain.
- Un dossier créé à la main traverse les douze statuts du chemin nominal sans intervention de Money Vibes, et le prêt apparaît dans le portefeuille du GP désigné.

#### FR-13 : Un jeu cohérent au centime

Les chiffres du jeu se recoupent : la somme des encours par agence donne l'encours du réseau ; le PAR se recalcule depuis les échéances du cœur fictif ; chaque échéancier se recalcule depuis ses conditions ; chaque produit a un TEG inférieur au plafond d'usure.

**Conséquences (testables) :**
- Un test recalcule chaque indicateur du tableau de bord du DG depuis les données brutes et trouve le même nombre.
- Aucun indicateur du jeu n'est une constante (PRD-D FR-15).

### 4.10 Messages, langue et données personnelles

#### FR-14 : Les messages passent par `notification`

Tout message (cloche et e-mail pour le personnel ; SMS et WhatsApp pour le client ; décision C16) passe par le module `notification` ; aucun module n'envoie lui-même. La langue par défaut est le français [ASSUMPTION : langues locales « bientôt »].

**Conséquences (testables) :**
- Chaque message envoyé est consultable : destinataire, canal, contenu, date, statut de remise.
- Un client qui refuse un canal ne reçoit plus de message sur ce canal.

#### FR-15 : Données personnelles et consentements

La fiche client recueille les consentements par finalité : traitement des données, géolocalisation, messages commerciaux, transmission à l'IA commune, consultation et déclaration au Bureau d'information sur le crédit (BIC). Les positions GPS des agents ne sont prises que pendant le service. Les règles de chaque pays (hébergement, transfert, durée de conservation) sont des paramètres, à faire vérifier par un juriste (§12.3).

**Conséquences (testables) :**
- Une donnée n'est utilisée que pour une finalité consentie ; un test retire un consentement et vérifie l'arrêt de l'usage.
- Les données de l'IMF restent sur ses serveurs ; seules sortent celles que l'IMF a consenties (FR-8) et les messages qu'elle envoie.

### 4.11 Modules installables

#### FR-16 : Les modules de l'IMF s'installent un par un

Chaque module de ce PRD respecte le contrat de module (C1 → C13 ; annexe A) : il s'installe seul, déclare ses dépendances, et affiche un emplacement vide quand une dépendance facultative manque. Le paquet de l'IMF installe au moins les modules ★ (`credit`, `produits-financiers`, `microfinance`, `collecte`, `coeur-sfd`, `risque-par`, `recouvrement`, `terrain`) et leurs dépendances. `prospera-microfinance-service`, le paquet comptable des SFD, n'est **pas** installé chez cette IMF au jour 1 (décision A11).

**Conséquences (testables) :**
- Le parcours UJ-1 marche avec les seuls modules ★ et le socle.
- Chaque emplacement vide des modules ★ a un test.

---

## 5. Partie 2 — Le crédit de bout en bout (`credit`, M15) ★

Le module `credit` porte le **dossier de crédit** de la demande jusqu'à la clôture : demande, simulation, constitution du dossier, instruction par le chargé de crédit (CC), avis consultatif du risque, décision du ROC, comité de crédit, échéancier contractuel, ordre de décaissement, suivi du prêt par le gestionnaire de portefeuille (GP), clôture et nouveau cycle. C'est la priorité absolue de la plateforme au jour 1 (récit §3) et le parcours UJ-1 : un premier prêt mené **de la demande à EN_GESTION**, dans la démo, par un vrai dossier créé à l'écran (décision B4).

**Ce que le module possède.** Le dossier et ses sous-objets : demande, simulation retenue, pièces, cautions, garanties, visites d'instruction, checklist, grille 5C, avis du CC, avis du risque, décision du ROC, séance et décision du comité, conditions figées, échéancier contractuel, ordre de décaissement, dérogations, délégations, journal des transitions.

**Ce qu'il lit.** Les produits de crédit, leurs limites et leurs versions (`produits-financiers`) ; le client, sa fiche, son KYC, son groupe (`microfinance`, partie 3a) ; l'état officiel du prêt, les soldes, l'échéancier officiel et les mouvements (le cœur, via `coeur-sfd`, partie 3b) ; le périmètre de chacun (`reseau`) ; les propositions de l'IA commune (score, décision suggérée, analyses), avec leur provenance.

**Ce qu'il ne fait pas.**
- Il **ne tient ni le compte de prêt officiel ni la caisse** : le cœur fait foi pour l'argent (soldes, encours officiel, échéancier officiel après décaissement, pénalités, écritures, caisse du guichet). C'est la décision qui commande tout ce PRD (plan §6).
- Il **spécifie ce que l'IA fait dans le crédit** (score du dossier, décision suggérée, analyse narrative, alertes, analyse étendue micro et macro-économique et par secteur d'activité, conditions optimales) : FR-49 et FR-95 à FR-99. Le **moteur est l'IA commune** (module Risque et agents métier), qui dit comment ; ce PRD dit quoi. L'IA propose, le CC, le ROC et le comité décident ; sans elle, le dossier avance sur l'analyse humaine.
- Il ne mène pas le recouvrement : après EN_GESTION, les retards et le contentieux sont un second axe de statuts, détaillé en partie 4a (PRD-D §6.2 et ses écarts). Le crédit en reçoit le résultat (clôture, perte) et lui donne ses données.
- Il ne tient pas la fiche client elle-même (partie 3a), ni les produits (partie 3a), ni l'échange avec le cœur (partie 3b).

**Rôles du crédit** (plan §3) : agent terrain (AT) et commercial (COM) créent les demandes ; CC instruit ; RSQ donne un avis consultatif ; ROC décide ; comité = ROC + (DG ou RA) ; GP suit le prêt ; CPT et DAF autorisent le décaissement en espèces ; AUD lit.

**Seuils.** Tout seuil de cette partie est un **paramètre de l'IMF**, avec sa valeur par défaut (réponses du PO, démo, cahier crédit). Le PRD ne code aucune valeur en dur (FR-86).

### 5.1 Prospection et fiche client (côté crédit)

La création du prospect, la fiche (identité, activité, photos, position GPS), le KYC et la LBC/FT, le rattachement à un groupe solidaire vivent dans le module `microfinance` (**partie 3a**) ; le prospect se crée dans la démo par `/clients/nouveau`, qui doit couvrir identité, activité, photos et GPS (écart relevé en 5.15). Le crédit y ajoute trois règles.

#### FR-30 : Une demande n'existe que sur un client dont la fiche est utilisable

Le crédit lit la fiche du client dans `microfinance` et refuse de créer une demande si le client est absent, si son KYC est EXPIRE, REJETE ou INCOMPLET au sens de la partie 3a, ou si une suspension de nouvelle demande est en vigueur (dossier BLOQUE, perte définitive : partie 4a). Réalise UJ-1.

**Conséquences (testables) :**
- Créer une demande sur un client au KYC REJETE est refusé avec le motif lisible « KYC non valide » ; le client n'est pas modifié.
- Le KYC « valide » est exigé **avant le décaissement** au plus tard (FR-66) ; une demande peut être créée pendant que le KYC est EN_VERIFICATION.
- Le score du client affiché sur la demande est celui de l'IA commune avec sa provenance (FR-49) ; s'il est absent, la mention « score non évalué » s'affiche et rien d'autre ne change.

#### FR-31 : Le crédit se branche sur les prospects venus du terrain et du commercial

Le prospect créé par un commercial ou un agent terrain (partie 3a, partie 4a) peut devenir une demande de crédit sans ressaisie : le crédit reprend l'identifiant du client, le rôle auteur et la zone. Réalise UJ-1.

**Conséquences (testables) :**
- Depuis la fiche d'un prospect, l'action « Demander un crédit » ouvre la demande préremplie ; aucune donnée d'identité n'est retapée.
- L'auteur de la demande (agent ou commercial) est enregistré et reste destinataire des notifications de refus et de décaissement (FR-87).

### 5.2 Demande et simulation

#### FR-32 : Créer la demande avec un produit du catalogue

L'agent choisit le client et un **produit de crédit** dans le catalogue du module `produits-financiers` (et nulle part ailleurs : la démo en a trois listes différentes, une seule subsiste), puis saisit le montant, la durée, l'objet et la date de décaissement souhaitée. Le dossier naît au statut **SOUMIS** ; le CC de l'agence est prévenu. Réalise UJ-1, UJ-2.

**Conséquences (testables) :**
- Le dossier reçoit une référence unique lisible et la **version du produit** en vigueur ; elle ne change plus pour ce dossier (conditions figées par dossier, décision T5).
- Le CC de l'agence du client reçoit une notification « nouvelle demande » (FR-87) ; sans CC affecté, la demande apparaît dans la file du RA.
- Le dossier est visible, après rechargement et depuis un autre appareil, par les rôles dont le périmètre le couvre (FR-1 de PRD-D, repris : tout s'enregistre).

#### FR-33 : Montant et durée restent dans les limites du produit

La demande est refusée à la saisie si le montant ou la durée sort des bornes du produit (montant minimum et maximum, durée minimum et maximum, périodicité de remboursement) (paramètres du produit ; défauts de démo : microcrédit individuel 50 000 à 2 000 000 FCFA, 3 à 12 mois ; crédit de groupe 500 000 à 5 000 000 FCFA, 6 à 24 mois). Le montant minimal général de la démo, 50 000 FCFA, n'est qu'un défaut de produit.

**Conséquences (testables) :**
- Un montant ou une durée hors bornes affiche la borne violée et ne crée aucun dossier.
- Changer la borne d'un produit ne modifie pas les dossiers déjà ouverts (ils gardent la version d'origine).

#### FR-34 : L'éligibilité du client est contrôlée avant la création

Le client doit être éligible au produit : **score minimum** (paramètre du produit ; défaut : 45) et **ancienneté minimum** d'activité ou de relation (paramètre du produit ; défaut : 3 mois). Un client inéligible est **bloqué** ; seule une dérogation motivée du ROC, tracée, débloque (décision C10 ; FR-84).

**Conséquences (testables) :**
- Le refus d'éligibilité nomme le critère non rempli et sa valeur.
- Une dérogation enregistre le ROC, la date, le critère et le motif ; la demande créée par dérogation porte un drapeau visible jusqu'au comité.
- Si le score est absent (IA commune non installée), le critère de score est marqué « non évalué » et ne bloque pas ; le critère d'ancienneté reste bloquant. [ASSUMPTION]

#### FR-35 : La simulation affiche l'échéancier prévu et le TEG

Avant de soumettre, l'agent obtient une **simulation** : mensualités, part d'intérêts, frais de dossier, assurance si le produit en a, coût total du crédit, **TEG actuariel**, date prévue de la première échéance. La simulation n'enregistre rien tant qu'elle n'est pas retenue ; retenue, elle est jointe au dossier comme *proposition* (l'échéancier contractuel naît au comité seul, FR-61). Réalise UJ-1.

**Conséquences (testables) :**
- La simulation de l'exemple de test donne les mêmes chiffres que l'échéancier généré par le comité pour les mêmes conditions (écart 0 FCFA, hors arrondi de dernière échéance).
- Les frais de dossier et l'assurance sont montrés séparément et inclus dans le TEG ; les pénalités n'y figurent pas.
- La simulation fonctionne hors ligne dans l'application terrain pour le calcul, et seule la soumission exige le réseau (FR-37).

#### FR-36 : Le TEG est actuariel et le plafond d'usure bloque l'octroi

Le TEG est calculé **sur le vrai échéancier** : taux actuariel de période, ramené à l'année par proportionnalité, **frais, assurance et coût des garanties inclus, pénalités exclues** (Décret TEG annexé à la loi uniforme sur l'usure ; Guide BCEAO DSF-001/2015). Le **plafond d'usure** est un paramètre **daté** par catégorie d'institution (défaut : **24 % par an** pour une IMF, en vigueur depuis le 01/06/2026, Décision n° 19 du 29/12/2025/CM/UMOA) ; l'historique des plafonds est conservé. Un TEG au-dessus du plafond **bloque l'octroi** : la simulation l'affiche en rouge, le dossier ne peut pas être soumis au comité ni décaissé. Réalise UJ-1.

**Conséquences (testables) :**
- Cas de test : 1,5 % par mois dégressif sur 12 mois et 1 % de frais donnent un TEG d'environ 20 % et passent ; 2,5 % par mois donnent plus de 24 % et sont bloqués.
- Le blocage se produit à trois endroits : simulation, soumission au comité, ordre de décaissement ; il se produit aussi après tout rééchelonnement qui change le TEG.
- Changer la date d'effet d'un plafond n'affecte que les dossiers dont la décision du comité est postérieure ; un dossier déjà décidé n'est pas rouvert, mais une alerte de conformité est émise si son TEG dépasse un nouveau plafond. [ASSUMPTION]
- Le contrat imprimé porte le TEG et le tableau d'amortissement (FR-62).
- Le produit d'exemple de la démo (2,5 % par mois, TEG 36,4 %) est **illégal** : le jeu de démo prend des produits conformes (FR-10, FR-13).

#### FR-37 : La demande se saisit en brouillon hors ligne

Dans l'application terrain, l'agent saisit une demande en **brouillon** hors connexion ; elle se synchronise au retour du réseau. Aucune décision, aucun avis, aucune approbation ne se prend hors ligne (décision T2).

**Conséquences (testables) :**
- Un brouillon synchronisé crée le dossier SOUMIS une seule fois (idempotence) ; les contrôles de FR-33, FR-34 et FR-36 sont rejoués à la synchronisation, et un brouillon qui échoue revient à son auteur avec le motif.
- Les boutons de décision (avis CC, décision ROC, comité, décaissement) sont absents du mode hors ligne.

#### FR-38 : Le client peut renoncer : statut ANNULE

Le client qui renonce avant le décaissement fait passer le dossier à **ANNULE** (motif obligatoire, auteur, date), depuis tout statut avant EN_GESTION. L'annulation est distincte du refus (REFUSE). Réalise UJ-1.

**Conséquences (testables) :**
- Un dossier ANNULE n'est plus dans aucune file de travail et reste consultable ; ses cautions et garanties sont libérées par le crédit (dépôt de garantie : demande de déblocage au cœur).
- Annuler un dossier dont un ordre de décaissement est déjà confirmé par le cœur est refusé : le prêt est en gestion.

### 5.3 Constitution du dossier

#### FR-39 : Le CC fixe le rendez-vous et liste les pièces manquantes

Le CC programme un rendez-vous avec le client (statut **RDV_PROGRAMME**, date, lieu) et dresse la liste des pièces manquantes (statut **EN_ATTENTE_DOCUMENTS**). La liste de pièces exigées est une donnée du **produit** (CNI, justificatif de domicile, photo, justificatif de revenu, registre de commerce, etc.) ; la « fiche visite terrain » s'ajoute à toute demande de crédit (cahier crédit). Réalise UJ-1.

**Conséquences (testables) :**
- Le CC coche, parmi les pièces du produit, celles qui manquent ; l'agent voit sa liste à envoyer et l'échéance de remise.
- Le passage par RDV_PROGRAMME est facultatif : SOUMIS peut aller directement à EN_ATTENTE_DOCUMENTS (FR-78).
- Chaque programmation et chaque liste est horodatée avec son auteur (FR-80).

#### FR-40 : L'agent téléverse les pièces et le CC les accepte ou les rejette

L'agent (en ligne ou depuis l'application terrain) téléverse chaque pièce rattachée au dossier ; le CC l'accepte ou la rejette avec un motif. Une pièce déjà présente dans la fiche client (KYC, partie 3a) est **réutilisée**, pas redemandée. Réalise UJ-1.

**Conséquences (testables) :**
- Chaque pièce a un état : MANQUANTE, EN_ATTENTE, ACCEPTEE, REJETEE, EXPIREE ; une pièce expirée avant le comité repasse à MANQUANTE.
- Le dossier garde l'historique des versions d'une pièce rejetée puis remplacée.
- Le téléversement fonctionne hors ligne (file locale, synchronisation) ; l'acceptation par le CC exige le réseau.

#### FR-41 : Les cautions sont enregistrées, au moins 2 au-dessus d'un seuil

Le CC enregistre les cautionnaires solidaires du dossier : ordre, identité, lien avec le client, téléphone, contact d'urgence, profession, pièce d'identité, revenu mensuel, date et montant d'engagement, statut (ACTIF, APPELE, INJOIGNABLE, REALISE, REFUSE ; une caution est « valide » si ACTIF ou REALISE). Le **nombre minimal de cautions** est un paramètre par produit (défaut : **2 cautions au-dessus de 300 000 FCFA**, décision C7 ; la démo l'applique à tout montant, le récit dit « au-dessus d'un seuil »). Réalise UJ-1.

**Conséquences (testables) :**
- Un dossier au-dessus du seuil avec une seule caution valide reste EN_ATTENTE_DOCUMENTS.
- Un cautionnaire est un client de la fiche (`microfinance`) ou une personne saisie ; une caution déjà engagée sur un prêt en retard est signalée au CC.
- Le **taux de couverture** (somme des revenus des cautions ÷ mensualité) est calculé et affiché ; en dessous de 1, l'alerte CAUTIONS_INSUFFISANTES s'ajoute à l'analyse (FR-48).

#### FR-42 : Les garanties exigées suivent un barème paramétrable

Selon le montant, le dossier exige un **dépôt de garantie** (compte d'épargne bloqué, tenu par le cœur) et une **garantie réelle** (stock, matériel, nantissement, hypothèque). Valeurs par défaut, paramétrables par produit (décision C7) :

| Montant demandé | Exigence |
|---|---|
| tout montant | cautions selon FR-41 |
| au-dessus de 300 000 FCFA | dépôt de garantie : 10 % du montant |
| au-dessus de 500 000 FCFA | garantie réelle : au moins 30 % du montant |
| au-dessus de 1 000 000 FCFA | dépôt de garantie : 15 % (remplace 10 %) ; garantie réelle : au moins 50 % |

Chaque exigence a un état (OK, MANQUANT, PARTIEL, NON_REQUIS), calculé, jamais saisi. Réalise UJ-1.

**Conséquences (testables) :**
- Pour une demande de 1 200 000 FCFA, le dossier affiche : dépôt 180 000, garantie réelle 600 000, 2 cautions ; tant qu'une exigence n'est pas OK, le dossier n'est pas complet (FR-43).
- Une garantie réelle porte sa nature, sa valeur retenue, sa pièce justificative et, si le CC l'exige, une photo ; un dépôt de garantie est constaté par le cœur (lecture), pas par une saisie de Prospera.
- Les garanties demandées par le ROC (FR-55) reviennent ici.

#### FR-43 : Le dossier passe seul à DOSSIER_COMPLET et le score est recalculé

Quand les pièces du produit sont acceptées, que les cautions et les garanties exigées sont OK et que le KYC est au moins EN_VERIFICATION, le dossier passe **seul** à **DOSSIER_COMPLET** et une demande de **recalcul du score** part à l'IA commune. Réalise UJ-1.

**Conséquences (testables) :**
- Le passage est fait par le système, sans action du CC, dans la minute qui suit la dernière pièce ; il est tracé avec la mention « système » (FR-80).
- Retirer une pièce acceptée ou une garantie fait repasser le dossier à EN_ATTENTE_DOCUMENTS tant qu'il n'est pas en VISITES_PLANIFIEES ; après, l'action exige un motif du CC.
- IA commune absente : le recalcul est sans objet, l'emplacement de score reste vide, le passage a lieu.

#### FR-44 : La consultation du BIC est saisie à la main, avec sa pièce

Le CC enregistre le résultat de la consultation du bureau d'information sur le crédit (BIC) : date, résultat (favorable, réserves, défavorable), pièce jointe. Le **consentement préalable** du client est conservé avec le dossier. L'**export de déclaration** au BIC est produit au jour 1 ; le **branchement direct est « bientôt »** (décision C18). Le caractère obligatoire de la consultation est un paramètre par pays et par produit (défaut : non obligatoire), car l'obligation légale n'est pas confirmée (extrait réglementaire §5). [ASSUMPTION]

**Conséquences (testables) :**
- Si la consultation est obligatoire pour le produit, le dossier ne peut pas passer en EN_ANALYSE sans résultat saisi.
- Sans consentement enregistré, la saisie du résultat est refusée.
- Le résultat saisi apparaît dans le rapport du CC et dans celui du ROC.

### 5.4 Instruction par le CC

#### FR-45 : Le CC planifie les visites à l'adresse et sur le lieu d'activité

Le CC planifie les visites d'instruction (statut **VISITES_PLANIFIEES**) : une visite au **lieu d'activité** pour tout dossier, une visite au **domicile** en plus au-dessus du seuil de visites (paramètre ; défaut : **500 000 FCFA ; 2 visites minimum au-dessus, 1 visite sous le seuil**, décision C13). La visite peut être faite par le CC ou par un agent terrain désigné. Réalise UJ-1.

**Conséquences (testables) :**
- Pour 500 000 FCFA ou moins, une seule visite (activité) suffit ; pour 500 001 FCFA, deux sont requises.
- La visite apparaît dans l'agenda du CC et dans la tournée de l'agent désigné (module `terrain`) ; le bouton « Planifier » de l'agenda est branché (écart de démo, 5.15).
- Une visite planifiée à un agent absent est réaffectable par le RA, avec trace.

#### FR-46 : Une visite d'instruction exige une photo et un GPS dans le rayon

La visite est saisie dans l'application terrain (module `terrain`, type visite d'instruction) avec **au moins une photo**, la **position GPS** et un compte rendu (revenus observés, stock, état de l'activité). Le **rayon de tolérance** entre la position de la visite et l'adresse du client est un paramètre (défaut : **100 m**, décision T7). Hors rayon, la visite est marquée « hors zone », **refusée comme preuve mais jamais effacée**. Réalise UJ-1.

**Conséquences (testables) :**
- Une visite sans photo ou sans GPS ne peut pas être clôturée.
- Une visite à 150 m est enregistrée « hors zone » et ne compte pas dans le total exigé par FR-45 ; le CC la voit et peut en refaire une.
- Une visite validée à plus de 500 m de toute adresse connue du client déclenche une alerte d'audit (paramètre ; défaut : 500 m).
- Le mode hors ligne enregistre la visite (photo, GPS) et la synchronise par lot avec idempotence ; le contrôle de rayon est rejoué côté serveur.
- Le dossier passe à **EN_ANALYSE** quand le nombre exigé de visites valides est atteint.

#### FR-47 : Le rapport d'analyse porte la grille des 5C et les indicateurs calculés

Le CC lit et complète le **rapport d'analyse** du dossier. La grille des **5C** (Caractère, Capacité, Capital, Collatéral, Conditions) est **renseignée par le CC**, critère par critère, sur une échelle fixée par l'IMF ; elle est l'analyse humaine, distincte du score de l'IA commune (décision C11). Le rapport affiche en plus des **indicateurs calculés** : taux d'effort (mensualité ÷ revenu), endettement externe, couverture des cautions, historique de remboursement du client. Réalise UJ-1.

**Conséquences (testables) :**
- Seuils d'alerte d'indicateurs (paramètres ; calibrés sur les données de l'IMF, décision E5 ; défauts de démo : taux d'effort critique au-dessus de **33 %** des revenus ; endettement externe d'alerte au-dessus de **50 %** des revenus).
- Le rapport est figé quand le CC rend son avis ; la version figée reste consultable par le ROC et l'AUD.
- La démo a deux grilles incompatibles (5C sur 100, huit dimensions sur 110) ; ce PRD retient les **5C pour l'analyse du CC** et le score /100 de l'IA commune pour le reste (FR-49).

#### FR-48 : Les alertes d'instruction sont affichées avec leur règle

Le rapport affiche les **alertes** qui s'appliquent au dossier : dépôt inhabituel, gonflement récent du solde (moins de 30 jours avant le rendez-vous), dépôt suspect 24 à 72 h avant le rendez-vous d'analyse, cautions insuffisantes, concentration sectorielle, endettement élevé, taux d'effort excessif, compte de transit, échantillon de comparaison faible (neuf codes de la démo). Chaque alerte donne : code, gravité (information, attention, critique), la règle qui l'a levée, les données qui la fondent.

**Conséquences (testables) :**
- Une alerte critique est commentée par le CC avant l'avis (FR-51) ; ne pas la commenter bloque l'avis favorable.
- Les alertes sont calculées par les règles du crédit (indicateurs, dates) ou proposées par l'IA (FR-98) avec provenance ; aucune alerte n'est affichée sans règle ou modèle nommé.
- Une alerte ne refuse jamais seule : elle informe.

#### FR-49 : Le score du dossier et la décision suggérée sont proposés par l'IA, avec provenance

Le dossier affiche, dans des **emplacements dédiés**, le **score consolidé 0-100** du dossier avec sa **décomposition** (paiement 40, capacité 30, activité 20, terrain 10, décision C11 ; classe de risque et probabilité de défaut), et la **décision suggérée** parmi quatre : APPROUVER, APPROUVER_REDUIT, DEMANDER_GARANTIES, REFUSER. Ils sont fournis par l'IA commune (module Risque) ; **tant que son modèle n'existe pas, une règle explicable versionnée les sert** [ASSUMPTION]. Chaque affichage porte sa **provenance** : règle ou modèle, version, date, données utilisées. Le mot « IA » n'est affiché que pour un modèle. Réalise UJ-1.

**Conséquences (testables) :**
- **L'IA propose, l'humain décide** : un score ou une suggestion ne change jamais seul un statut ; le CC, le ROC et le comité voient la même proposition.
- Un écart du CC, du ROC ou du comité avec la décision suggérée exige un **motif** (FR-51, FR-54) ; le motif est renvoyé à l'IA commune comme correction.
- IA indisponible ou sans réponse : les emplacements montrent « non disponible », aucune erreur ne bloque l'écran, et le dossier avance sur l'analyse humaine.
- Aucune donnée du dossier ne part vers l'IA commune sans le consentement de l'IMF prévu au PRD moteur (apprentissage fédéré).
- Le **secteur d'activité**, la zone, le montant, la durée et le produit sont fournis à l'IA comme données structurées (décision F2).
- Le score est recalculé à chaque transition utile (soumission, dossier complet, fin des visites, avis du CC, décision du ROC) ; son historique est conservé par dossier.

#### FR-50 : La checklist d'instruction doit être complète à 100 % avant l'avis

La **checklist d'instruction** est une liste de contrôles définie par produit (par défaut : identité vérifiée, KYC, pièces conformes, visites effectuées, cautions contactées, garanties valorisées, BIC consulté si exigé, plafond d'usure respecté, parties liées vérifiées, alertes critiques commentées). Elle doit être **complète à 100 %** pour qu'un avis favorable soit accepté. Réalise UJ-1.

**Conséquences (testables) :**
- Un avis favorable avec une checklist à 90 % est refusé avec la liste des cases manquantes.
- Une case se coche avec auteur et date ; certaines se cochent seules quand la donnée existe (visites valides, pièces acceptées).
- Les quatre cases de la démo (cautions, visites des cautions, dossiers des cautions reçus, prêt pour l'avis) deviennent des lignes d'une liste plus large.

#### FR-51 : Le CC rend un avis favorable ou défavorable, motivé

Le CC rend un **avis favorable ou défavorable** (deux valeurs, décision C3), avec notes et, s'il est favorable, des **conditions proposées** (montant réduit, garanties supplémentaires, durée). S'il s'écarte de la recommandation de l'IA commune (FR-49), il **justifie** son écart dans un champ obligatoire. Avis favorable : le dossier passe à **VALIDE_CHARGE** ; avis défavorable : le dossier passe à **REFUSE** avec motif et l'agent est prévenu (décision C2). Réalise UJ-1.

**Conséquences (testables) :**
- Un avis qui diffère de la recommandation sans justification est refusé.
- Après un refus par avis défavorable, **un seul réexamen** est possible, à la demande du RA, motivé ; le dossier repart alors à EN_ANALYSE et l'événement est tracé.
- Seul le CC (ou le CC délégué, FR-85) rend l'avis ; l'analyste risque ne le peut pas (la démo lui ouvre les mêmes boutons que le CC : corrigé).
- L'avis est rendu avec l'identité du CC, la date et le contenu du rapport à cet instant.

#### L'IA du crédit (suite de 5.4, FR-95 à FR-99)

Ces cinq exigences complètent FR-49. Elles disent **ce que l'IA fait pour le CC, le ROC et le comité** ; l'IA commune dit comment. Règles communes à toutes : provenance affichée (règle ou modèle, version, date, données utilisées) ; l'IA propose, l'humain décide ; un écart exige un motif renvoyé comme correction ; IA indisponible, le dossier avance sur l'analyse humaine ; données vers l'IA commune seulement avec consentement.

#### FR-95 : Le dossier porte une analyse narrative, des étoiles et un sentiment

Pour chaque dossier, l'IA propose une **analyse narrative complète** : synthèse, forces, faiblesses, questions à poser au client, points à vérifier avant le comité. Elle propose aussi une **priorité (1 à 3 étoiles)** et un **sentiment** (positif, neutre, négatif, critique) affichés sur la carte du pipeline. Entrées : dossier, fiche client, historique, garanties, visites, alertes. Sortie : texte et deux valeurs, avec provenance. Réalise UJ-1.

**Conséquences (testables) :**
- L'analyse est lue par le CC avant l'avis et par le ROC dans son rapport ; sa version est figée avec le rapport à l'avis du CC.
- Étoiles et sentiment sont recalculés à chaque transition ; le CC peut les corriger avec un motif.
- Les textes figés de la démo sont remplacés par une sortie qui change quand les données changent ; sans IA, la carte n'affiche ni étoile ni sentiment.

#### FR-96 : L'analyse étendue couvre six volets, du micro au macro

Le dossier affiche une **analyse étendue en six volets** proposée par l'IA : (1) **transactions et retraits** ; (2) **comportement du client** (micro : paiement, usage de l'épargne, activité) ; (3) **contexte macro-économique** (inflation, prix, conjoncture du secteur et de la zone) ; (4) **saison** (saisonnalité de l'activité et du remboursement) ; (5) **historique de recouvrement** du client et de ses cautions ; (6) **saturation du secteur** (FR-97). Chaque volet donne un constat, un niveau (favorable, neutre, défavorable) et ses données. Réalise UJ-1.

**Conséquences (testables) :**
- Les volets s'affichent dans le rapport du CC et du ROC ; un volet sans donnée affiche « non évalué », jamais un chiffre inventé.
- Les données macro-économiques viennent de sources paramétrées par pays (la provenance nomme la source et sa date).
- Le calendrier de risque du GP (mois à risque, saisonnalité) est généré à l'approbation du ROC à partir du volet saison.
- Le CC peut annoter un volet ; son annotation figure au rapport.

#### FR-97 : Le crédit analyse le secteur d'activité et sa saturation dans le portefeuille

Le **secteur d'activité** du client est une dimension de toute analyse. Pour chaque demande, l'IA fournit la **part du secteur dans le portefeuille de l'agence** (et du réseau), la comparaison avec les clients du même secteur (taux d'incident, taux de clôture, échantillon) et une **alerte de saturation** au-dessus d'un seuil (paramètre ; calibré sur les données de l'IMF ; défaut de démo : **35 %** du portefeuille de l'agence). Réalise UJ-1.

**Conséquences (testables) :**
- Pour une agence dont le commerce de détail pèse 38 % de l'encours, une nouvelle demande du secteur affiche l'alerte CONCENTRATION_SECTORIELLE avec les deux chiffres.
- Si l'échantillon est trop faible (paramètre ; défaut : 30 dossiers), la comparaison porte la mention « échantillon faible ».
- L'alerte informe le CC et le ROC ; elle ne refuse jamais seule.
- La part sectorielle est calculée sur l'encours du cœur (lecture) ; sans lecture du cœur, elle est « non évaluée ».

#### FR-98 : L'IA lève des alertes de fraude, de conformité et de comportement de crédit

L'IA propose des **alertes actives** sur le dossier : fraude suspectée (incohérence de revenus, faux documents, dépôt gonflé avant le rendez-vous), garanties insuffisantes, dépassement de seuils réglementaires (usure, parties liées, plafond de dossier), transaction inhabituelle, et une **vérification du comportement de crédit** (historique interne, BIC saisi, autres engagements déclarés). Entrées : dossier, mouvements lus du cœur, BIC, visites. Sortie : alertes avec code, gravité, règle ou modèle, données. Réalise UJ-1.

**Conséquences (testables) :**
- Les alertes de l'IA s'ajoutent à celles des règles du crédit (FR-48) dans la même liste, avec la même obligation de commentaire pour une alerte critique.
- Une alerte de fraude critique prévient l'AUD et le ROC ; elle ne bloque pas le dossier : l'humain décide.
- Un faux positif classé par le CC est renvoyé à l'IA comme correction.

#### FR-99 : À la simulation, l'IA recommande un produit et des conditions optimales

Lors de la simulation (FR-35), l'IA peut proposer le **produit** le mieux adapté au profil de l'emprunteur, et des **conditions optimales** (montant, durée, périodicité, garanties) qui respectent les bornes du produit, le plafond d'usure et le taux d'effort du client. Elle remplace l'« ajustement du taux par le score » de la démo, qui est supprimé s'il ferait dépasser le plafond d'usure (FR-36). Réalise UJ-1.

**Conséquences (testables) :**
- La proposition s'affiche à côté de la saisie de l'agent, avec sa provenance ; l'agent la retient ou la rejette, sans motif obligatoire à ce stade.
- Une proposition qui ferait dépasser les bornes du produit ou le plafond d'usure n'est jamais émise.
- IA absente : la simulation fonctionne avec les seules valeurs saisies.

### 5.5 Avis consultatif du risque

#### FR-52 : L'analyste risque donne un avis consultatif au-dessus d'un seuil

Au-dessus d'un **seuil de montant** (paramètre ; défaut : **2 000 000 FCFA** [ASSUMPTION], aucun seuil fixé par le PO), un dossier VALIDE_CHARGE est présenté à l'analyste risque (RSQ), qui rend un **avis consultatif** : favorable, réservé, défavorable, avec notes. L'avis est **non bloquant** : il n'empêche pas le dossier d'aller au ROC (décision C5). Il ne change jamais le statut. Réalise UJ-1 pour les dossiers concernés.

**Conséquences (testables) :**
- Le dossier reste au statut VALIDE_CHARGE pendant que l'avis est attendu, jusqu'à l'avis ou jusqu'au délai (paramètre ; défaut : **48 h**, comme le SLA de la démo) ; il passe alors à EN_ANALYSE_ROC avec la mention « avis du risque non rendu » si le délai est dépassé.
- Sous le seuil, ou si l'analyste n'existe pas dans l'organisation, l'étape est sautée sans blocage.
- L'avis du risque est affiché dans le rapport du ROC à côté de l'avis du CC, avec l'identité de son auteur.
- Le RSQ lit le dossier de tout le réseau, ne modifie ni pièce ni garantie, et ne rend pas l'avis du CC.

### 5.6 Décision du ROC

#### FR-53 : Le ROC lit un rapport complet avec une proposition

Quand l'étape précédente est terminée, le dossier passe **seul** à **EN_ANALYSE_ROC** et un **rapport du ROC** est généré : synthèse, score et recommandation avec provenance (FR-49), avis du CC, avis du risque s'il existe, alertes, indicateurs, garanties, BIC, visites, et une **proposition de montant, de taux et de durée** (celle du CC si elle existe, sinon la demande). Réalise UJ-1.

**Conséquences (testables) :**
- Le rapport est figé à l'ouverture et reste consultable après la décision ; la proposition n'est ni un échéancier ni une condition figée.
- L'action du ROC n'est ouverte qu'au statut EN_ANALYSE_ROC (la démo l'ouvre dès VALIDE_CHARGE : corrigé).
- Le ROC voit tous les dossiers de toutes les agences ; il ne voit pas ceux qu'il a lui-même ouverts comme CC sans délégation (séparation des tâches, FR-82).

#### FR-54 : Le ROC approuve en fixant montant, taux, durée et gestionnaire, sans échéancier

Le ROC a **trois choix** : approuver, refuser, demander des garanties. S'il **approuve**, il fixe le **montant accordé, le taux et la durée**, **désigne le GP** qui suivra le prêt, ajoute des notes ; le dossier passe à **EN_COMITE_CREDIT**. **Règle impérative : l'accord du ROC ne crée aucun échéancier.** Réalise UJ-1.

**Conséquences (testables) :**
- Le taux saisi est contrôlé : TEG recalculé sur les conditions du ROC, au-dessus du plafond d'usure l'approbation est refusée (FR-36).
- Un montant accordé supérieur au montant demandé est refusé ; un montant inférieur est accepté et motivé.
- Aucun échéancier n'existe après l'approbation : l'onglet « Échéancier » affiche « visible après le comité » ; un test vérifie l'absence de tout échéancier contractuel avant la décision du comité.
- Le GP désigné est un utilisateur de rôle GP, dans le périmètre de l'agence ou de la région du client ; il est notifié (FR-87).
- Seul le ROC (ou un ROC délégué, FR-85) approuve ; **le DG n'approuve pas à la place du ROC** (décision C4).

#### FR-55 : Le ROC refuse ou demande des garanties

S'il **refuse**, le dossier passe à **REFUSE**, le motif est obligatoire, l'agent et le CC sont prévenus. S'il **demande des garanties**, il précise lesquelles ; le dossier retourne à **EN_ATTENTE_DOCUMENTS** et le circuit des pièces, cautions et garanties reprend (FR-39 à FR-43), puis l'instruction et l'avis. Réalise UJ-1.

**Conséquences (testables) :**
- Un refus sans motif est refusé ; la démo propose « Valider avec réserves » et « Renvoyer au CC » : ils n'existent pas ; la demande de garanties les remplace.
- Après une demande de garanties, le dossier ne repasse au ROC qu'après un nouvel avis favorable du CC, et la demande du ROC est visible dans le dossier.
- Le nombre de retours pour garanties est limité (paramètre ; défaut : **2**) ; au-delà, le ROC doit refuser ou approuver. [ASSUMPTION]

### 5.7 Comité de crédit

#### FR-56 : Le comité délibère avec un quorum paramétrable

Le **comité de crédit** examine **tous les dossiers** approuvés par le ROC. Le **quorum** est le **ROC plus un membre de la direction (DG ou RA)**, paramétrable. Le comité n'est pas un rôle : la séance enregistre qui est présent (nom, rôle, date), qui vote quoi, et les notes. Réalise UJ-1.

**Conséquences (testables) :**
- Une décision sans quorum est refusée : le message dit qui manque.
- Chaque dossier porte la liste des présents et le vote de chacun ; l'AUD les lit.
- Un membre n'est jamais juge de son propre dossier ni de celui d'un parent déclaré dans la fiche (conflit d'intérêts) : il est exclu du vote et le quorum se recalcule.
- Le prochain comité affiche sa date, le nombre de dossiers et le montant total ; un dossier en attente de comité depuis plus de **72 h** (paramètre ; défaut de démo) lève une alerte « comité absent ».

#### FR-57 : Le niveau d'approbation dépend du montant

Les **niveaux de comité** sont des paramètres par tranche de montant (défaut : **DG obligatoire au-dessus de 5 000 000 FCFA** ; dessous, ROC plus RA ou DG). Aucune tranche ne dispense du ROC. Réalise UJ-1.

**Conséquences (testables) :**
- Un dossier de 6 000 000 FCFA sans le DG parmi les présents ne peut pas être décidé.
- Les plafonds de dossier par type de client et la dérogation de plafond de la démo (5 M, 3 M, 2 M) deviennent des paramètres ; une dérogation est validée par le DG (FR-84).
- La table des niveaux est datée et conservée : la décision garde le niveau en vigueur le jour du comité.

#### FR-58 : Les prêts aux parties liées passent par le conseil

Le dossier porte une case **« partie liée »** (dirigeant, administrateur, membre du personnel, ou apparenté : cochée par le CC et vérifiée par le comité). Un prêt à une partie liée exige l'**approbation de l'organe délibérant** (conseil d'administration), saisie dans le dossier avec sa pièce, et respecte un **plafond réglementaire** (défaut : **10 %** des fonds propres pour les dirigeants, paramétrable ; Instruction BCEAO n° 010-08-2010). Décision C17. Réalise UJ-1.

**Conséquences (testables) :**
- Un dossier « partie liée » ne peut pas être décidé tant que l'approbation du conseil n'est pas jointe.
- Le calcul du plafond dépend des fonds propres : si le cœur ne les fournit pas, la mention « plafond non vérifiable » s'affiche et le contrôle est manuel (comité). [ASSUMPTION]
- Les prêts aux parties liées sont listés pour le DG, l'AUD et l'export réglementaire (partie 3b).

#### FR-59 : La décision favorable fige les conditions finales

Si la décision est favorable, le comité **fige les conditions finales** : montant, taux, durée, **mensualité**, **frais**, assurance, **TEG**, **date de la première échéance**, GP, notes du comité. Une fois figées, elles ne changent plus ; toute modification demande une nouvelle séance. Réalise UJ-1.

**Conséquences (testables) :**
- La date de la première échéance est saisie par le comité (défaut : un mois après la date prévue de décaissement [ASSUMPTION]).
- Une modification d'un champ du dossier après la décision du comité (pièce, garantie, montant) est refusée sans nouvelle décision, et l'alerte « dossier modifié après comité » est levée à l'AUD.
- La bannière des conditions finales de la fiche affiche **tous** ces champs ; la démo n'en affiche que quatre (écart 5.15).
- Le TEG figé est celui du FR-36 sur l'échéancier du FR-61 ; au-dessus du plafond, la décision est refusée.

#### FR-60 : Un refus du comité est final pour la séance, avec motif

Une décision défavorable passe le dossier à **REFUSE**, avec motif et notes du comité ; l'agent, le CC et le ROC sont prévenus. Le client peut redéposer une demande (nouveau dossier) ; le réexamen unique de FR-51 ne s'applique pas à un refus du comité. Réalise UJ-1.

**Conséquences (testables) :**
- Un refus du comité n'ouvre aucun échéancier, aucun ordre de décaissement.
- Les motifs de refus du comité et du ROC sont dans une liste de référence paramétrable (revenus insuffisants, activité non vérifiable, endettement, garanties, historique, faux documents, taux d'effort, concentration) plus un champ libre.

#### FR-61 : Le comité génère l'échéancier contractuel, par annuité constante par défaut

C'est le **comité, et lui seul**, qui génère l'**échéancier contractuel** (numéro, date, capital, intérêts, assurance, total, solde restant) sur les conditions figées. Méthode par défaut : **annuité constante mensuelle** (dégressif) ; **options** par produit : capital constant, in fine, périodicité hebdomadaire ou bimensuelle, différé (décision C8). Les **frais de dossier** sont prélevés au décaissement ; l'**assurance** est incluse dans la mensualité si le produit en a une. Réalise UJ-1.

**Conséquences (testables) :**
- Pour 300 000 FCFA à 1,5 % par mois sur 12 mois, la mensualité d'intérêt et de capital est d'environ 27 504 FCFA (annuité constante) ; la somme des capitaux égale 300 000 FCFA ; la dernière échéance absorbe l'arrondi.
- Le dernier terme est ajusté pour que le solde final soit zéro.
- La démo génère un capital constant le 15 de chaque mois ; ce n'est pas un générateur d'annuité : le générateur du produit calcule intérêts, assurance et TEG (écart 5.15).
- L'échéancier contractuel est **inchangé** après la décision ; il est envoyé au cœur avec le dossier (FR-63).
- Le jour d'échéance est paramétrable (défaut : celui de la date de première échéance).

#### FR-62 : Le contrat imprimé porte le TEG et le tableau d'amortissement

Après la décision favorable, le crédit produit le **contrat de prêt** en PDF réel : parties, conditions figées, **TEG**, tableau d'amortissement, garanties, cautions solidaires. Il s'imprime et s'archive avec le dossier ; la signature se fait hors Prospera. Cette exigence reprend l'obligation de transparence (nouvelle loi microfinance, art. 90-91). Réalise UJ-1.

**Conséquences (testables) :**
- Le PDF est généré (la démo simule l'export par une minuterie) ; il porte la version du produit, la date et la référence du dossier.
- Le contrat est généré en français ; d'autres langues sont un paramètre.
- Le gabarit du contrat est un paramètre de l'IMF, jamais un texte fixe du produit.

#### FR-63 : Le dossier accordé est envoyé au cœur ; il y devient le prêt officiel après décaissement

À la décision favorable, le crédit **envoie au cœur** (via `coeur-sfd`, partie 3b) le **dossier accordé** : identifiant client, référence, conditions figées, échéancier contractuel, cautions et garanties. Le cœur **ne crée le prêt officiel** qu'au décaissement (FR-70). Après décaissement, **l'échéancier du cœur fait foi** ; un écart avec l'échéancier contractuel lève une alerte au GP et au ROC (décision A2). Réalise UJ-1.

**Conséquences (testables) :**
- Si le cœur sait recevoir par interface, l'envoi est immédiat ; sinon, un **fichier d'échange** est produit et tiré par le cœur (jamais de port entrant chez l'IMF ; partie 3b).
- Le crédit ne tient **jamais** de solde, d'encours officiel, de pénalités, de caisse ; il lit.
- Dans la démo, le **cœur fictif** reçoit le dossier accordé, exécute le décaissement et renvoie le mouvement.
- Si le cœur est injoignable, l'envoi est mis en file et la décision du comité n'est pas annulée.

### 5.8 Ordre de décaissement

**Sous-état de décaissement.** Comme le dit le récit du PO, c'est le comité seul qui génère l'échéancier, et **le dossier passe alors à EN_GESTION** (FR-70). Le décaissement se déroule ensuite **dans** EN_GESTION, par un **sous-état de décaissement** (À_ORDONNER, ORDONNE, EXECUTE, CONFIRME) qui n'est pas un statut de plus. Le prêt n'existe officiellement dans le cœur qu'à CONFIRME : tant que le sous-état n'est pas CONFIRME, le dossier EN_GESTION est affiché « en attente de décaissement » et n'entre ni dans l'encours, ni dans le PAR, ni dans les relances.

#### FR-64 : Le crédit émet un ordre de décaissement avec son canal

Quand les gardes de FR-66 sont remplies, le crédit émet l'**ordre de décaissement** : bénéficiaire, **montant net** (montant accordé moins les frais prélevés), **canal** (espèces au guichet, virement, Mobile Money, PI-SPI), compte ou numéro de destination, référence unique, date prévue. Réalise UJ-1.

**Conséquences (testables) :**
- Les canaux disponibles sont une liste **par pays et par opérateur** (Mobile Money : Flooz, Mixx dans la démo ; banques par PI-SPI), paramétrée par l'IMF.
- Un ordre est émis une seule fois par dossier ; une relance du même ordre est idempotente.
- Un ordre non exécuté après un délai (paramètre ; défaut : **24 h** [ASSUMPTION]) lève une alerte au CPT et au ROC.
- Annuler un ordre non exécuté est possible par le ROC, avec motif ; le dossier reste accordé.

#### FR-65 : Les frais et l'assurance sont prélevés au décaissement

Les **frais de dossier** (défaut de démo : 2 % pour le microcrédit individuel, 1,5 % pour le crédit de groupe) sont prélevés **au décaissement** : l'ordre porte le montant net, et le cœur comptabilise le prélèvement. L'**assurance décès-invalidité**, obligatoire sur les microcrédits dans la démo (1,2 % par an), est souscrite par le crédit auprès du module `assurance` si installé ; sa prime est incluse dans la mensualité (FR-61). Réalise UJ-1.

**Conséquences (testables) :**
- Pour 500 000 FCFA et 2 % de frais, le montant net de l'ordre est 490 000 FCFA ; le TEG du FR-36 inclut ces 10 000 FCFA.
- `assurance` absent : l'emplacement « assurance » est vide, et la garde « assurance souscrite » est non remplie si le produit l'impose ; le CPT voit pourquoi l'ordre est bloqué (FR-66).

#### FR-66 : Aucun décaissement tant que les gardes ne sont pas toutes vertes

L'ordre de décaissement est **refusé** si l'une des conditions suivantes manque : décision favorable du comité avec quorum ; KYC **valide** ; visite d'instruction valide au nombre exigé ; cautions et garanties OK, **dépôt de garantie constaté par le cœur** ; assurance décès-invalidité souscrite si le produit l'impose ; TEG sous le plafond ; approbation du conseil si partie liée ; pas de blocage LBC/FT (sanctions, PPE sans accord) selon la partie 3a. Réalise UJ-1.

**Conséquences (testables) :**
- La liste des gardes manquantes est affichée au CPT et au CC ; la démo (« Dossiers incomplets bloquent décaissement ») est généralisée.
- Chaque garde est lue depuis son module source (KYC dans `microfinance`, dépôt dans le cœur) ; une garde illisible vaut « non remplie ».
- Un décaissement sans visite validée est impossible ; l'alerte d'audit « décaissement sans visite validée » ne peut donc que signaler un contournement.

#### FR-67 : Le décaissement en espèces est autorisé par le comptable ou le DAF

Pour le canal **espèces**, l'ordre doit être **autorisé par le comptable-caissier (CPT) ou le DAF**, jamais par le CC, le ROC ou le GP (décision A3 ; cahier terrain). L'autorisation est un acte enregistré. Réalise UJ-1.

**Conséquences (testables) :**
- Un ordre en espèces sans autorisation n'est pas transmis au cœur.
- Le CPT qui autorise n'est ni le CC ni le GP du dossier (séparation des tâches, FR-82).
- L'autorisation porte l'identité, la date et le montant ; elle est en 2FA pour le CPT et le DAF (décision F9).
- Le CPT agit sur les dossiers de son agence ; le DAF sur tout le réseau.

#### FR-68 : Espèces et virement sont exécutés par le cœur sur l'ordre de Prospera

Pour les canaux **espèces** et **virement**, le crédit transmet l'ordre au cœur, qui **exécute** : caisse du guichet, compte, écriture. Le crédit n'exécute rien de lui-même. Réalise UJ-1.

**Conséquences (testables) :**
- L'ordre transmis garde le mode d'échange : interface si le cœur sait, fichier sinon (partie 3b).
- Tant que le cœur n'a pas confirmé, le sous-état est ORDONNE, jamais EXECUTE.
- Le cœur fictif de la démo exécute l'ordre et renvoie la confirmation en quelques secondes.

#### FR-69 : Mobile Money et PI-SPI passent par `paiement`, puis sont déclarés au cœur

Pour **Mobile Money** et **PI-SPI**, le crédit demande à `paiement` (PRD paiement) d'envoyer le virement au bénéficiaire ; `paiement` confirme l'exécution ; le crédit **déclare ensuite le décaissement au cœur** pour qu'il tienne le prêt (décision A3). Réalise UJ-1.

**Conséquences (testables) :**
- `paiement` absent : l'option est marquée « non installé » et seuls les canaux du cœur restent offerts.
- Un décaissement PI-SPI confirmé est irrévocable ; un refus ou un délai de l'opérateur laisse le dossier à ORDONNE avec l'alerte du FR-64.
- Le décaissement par `paiement` est déclaré au cœur avec son identifiant de transaction ; un doublon est reconnu et n'est pas redéclaré.

#### FR-70 : Le comité fait passer le dossier à EN_GESTION ; le cœur confirme le décaissement

La décision favorable du comité génère l'échéancier contractuel et fait passer le dossier à **EN_GESTION** (récit du PO). Le décaissement suit dans le sous-état de décaissement ; il est **confirmé** quand le **cœur** renvoie le mouvement : prêt créé, échéancier officiel. Le GP désigné, le client, l'agent et le responsable commercial sont prévenus à la confirmation du décaissement (FR-87). Réalise UJ-1 (fin du parcours).

**Conséquences (testables) :**
- Le passage à EN_GESTION est tracé avec la décision du comité ; la confirmation du décaissement est tracée avec la source « cœur » (ou « cœur fictif » dans la démo) et la référence du mouvement.
- Un dossier EN_GESTION dont le décaissement n'est pas CONFIRME est affiché « en attente de décaissement » et n'entre ni dans l'encours, ni dans le PAR, ni dans les relances.
- L'échéancier officiel du cœur est lu et rapproché de l'échéancier contractuel ; un écart sur un montant ou une date ouvre une alerte (FR-63).
- Le dossier apparaît dans le portefeuille du GP dès EN_GESTION ; il quitte la file des ordres à la confirmation du décaissement.
- Pour la démo : le dossier créé, instruit, décidé et décaissé au cœur fictif atteint EN_GESTION sans intervention technique.

#### FR-71 : Le GP suit le prêt EN_GESTION et saisit les remboursements sans doublon

Le GP lit dans le dossier l'état du prêt (solde, prochaine échéance, retards, pénalités : valeurs du cœur). Un remboursement reçu par Prospera (guichet, collecte terrain, Mobile Money validé) est **renvoyé au cœur s'il sait les recevoir** ; sinon il figure sur la liste **« à saisir dans le cœur »** et n'est confirmé que par le mouvement du cœur (décision A1, correction du PO). L'imputation est **pénalités, intérêts, capital** (paramétrable, A5) ; un paiement dont l'écart avec l'échéance est inférieur à **1 %** est rattaché automatiquement, sinon il va dans la file du comptable, jamais refusé (A6). Le détail du recouvrement et de la caisse est en parties 3a et 4a. Réalise UJ-1.

**Conséquences (testables) :**
- L'action « Encaisser » de la démo, qui affiche « enregistré » sans rien écrire, est remplacée par un enregistrement réel avec canal et statut (EN_ATTENTE, VALIDE, REJETE).
- Un paiement en attente du cœur est affiché comme tel ; le solde affiché reste celui du cœur.
- Le GP enregistre une promesse de paiement ; les relances sont suspendues jusqu'à la date promise (partie 4a).

### 5.9 Crédit de groupe solidaire (C14)

#### FR-72 : Un groupe solidaire a un dossier de groupe et un sous-dossier par membre

Un **crédit de groupe** (client de type groupe dans `microfinance`, partie 3a ; produit de type groupe) comprend **5 à 30 membres** (paramètre du produit ; défaut : minimum 5 ; la démo plafonne à 15 pour le produit « crédit groupe solidarité ») et une **caution solidaire**. Le crédit crée un **dossier de groupe** et un **sous-dossier par membre** (montant demandé, pièces, KYC, score propre). Réalise UJ-2.

**Conséquences (testables) :**
- Un groupe de 4 membres est refusé pour un produit à 5 membres minimum, avec le message du seuil.
- Chaque sous-dossier doit avoir un KYC valide du membre ; un membre au KYC invalide bloque la décision du groupe tant qu'il n'est pas retiré ou régularisé.
- Le dossier de groupe porte les rôles du groupe (président, trésorier, membre) lus de la fiche ; une modification de la liste des membres après DOSSIER_COMPLET repasse le dossier de groupe à EN_ATTENTE_DOCUMENTS.
- Le montant total est la somme des sous-dossiers et respecte les bornes du produit.

#### FR-73 : Le groupe a une seule décision et un échéancier par membre

Le groupe suit **une seule instruction, une seule décision du ROC, un seul comité** (mêmes statuts que FR-78). Le comité génère **un échéancier par membre** (FR-61) ; la garantie est croisée : chaque membre répond du groupe (caution solidaire). Les visites portent sur l'activité de chaque membre selon FR-45, et au moins une réunion de groupe est enregistrée avec ses décisions. Réalise UJ-2.

**Conséquences (testables) :**
- Une décision favorable fige les conditions de chaque membre ; le décaissement est ordonné **par membre** (canal par membre), le dossier de groupe passe à EN_GESTION à la décision du comité ; son décaissement n'est CONFIRME que quand **tous** les décaissements des membres le sont ; si certains seulement le sont, il reste en sous-état partiel, visible.
- Le ROC peut approuver le groupe avec une liste de membres réduite : les membres retirés sont notés « sortis » avec motif.
- La répartition du montant entre membres, la règle de solidarité en cas de défaut et la règle de vote d'un groupe ne sont pas définies par les sources : le comité les enregistre dans les notes de séance. [ASSUMPTION]

#### FR-74 : Le défaut d'un membre est une affaire du groupe

Si un membre est en retard, la **solidarité** du groupe est invoquée selon la règle de l'IMF (paramètre) : les autres membres sont notifiés, le recouvrement ouvre un dossier au groupe (partie 4a), et le statut de paiement du membre passe à RETARD ou EXCLU. Réalise UJ-2.

**Conséquences (testables) :**
- Un membre EXCLU garde sa dette mais est retiré de tout nouveau cycle du groupe.
- Le crédit ne calcule pas la répartition d'un impayé : le cœur détient les soldes de chaque membre.

### 5.10 Clôture et nouveau cycle côté crédit (C15)

#### FR-75 : La clôture est confirmée par le cœur et libère les garanties

Un prêt passe à **CLOTURE** quand le **cœur confirme** un solde nul (mouvement ou état lu). Le crédit libère alors les cautions et demande la restitution du dépôt de garantie au cœur, qui le restitue. Un prêt radié (perte définitive, partie 4a) ne se clôture pas par ce chemin. Réalise UJ-1 (fin de cycle).

**Conséquences (testables) :**
- Le passage est tracé avec la source « cœur » ; le système est l'acteur dans le journal.
- Les cautions du dossier passent à « libérées » ; une caution engagée sur un autre prêt reste engagée sur celui-ci.
- Le client et le GP sont prévenus (FR-87).
- Un prêt clôturé après paiement anticipé réduit la durée sans pénalité sauf règle du produit (A5).

#### FR-76 : Un nouveau cycle est proposé selon une règle

Dès la clôture, le client peut **repartir sur un nouveau cycle** si aucun retard de plus de **30 jours** n'a été relevé au cycle précédent (paramètre ; défaut : 30 jours), avec un **montant maximal** de **1,5 fois** le cycle précédent (paramètre ; défaut : 1,5) (décision C15). Le crédit propose le renouvellement au CC et au client ; la demande suit tout le circuit. Réalise UJ-1, UJ-2.

**Conséquences (testables) :**
- Le renouvellement d'un prêt de 300 000 FCFA est proposé jusqu'à 450 000 FCFA ; au-dessus, la demande est refusée à la saisie.
- Après une perte définitive, aucun nouveau cycle n'est proposé sans dérogation du DG (partie 4a, D10).
- Un client dont un autre dossier est BLOQUE ne peut pas demander (FR-30).
- Le cycle d'un groupe suit la même règle par membre ; un membre EXCLU n'est pas repris.

#### FR-77 : Le crédit lit les retours du recouvrement sans les ranger dans ses statuts

Le suivi après EN_GESTION (EN_RETARD, EN_RECOUVREMENT, PLAN_ETALEMENT, REGULARISE, BLOQUE, CONTENTIEUX_JUDICIAIRE, PERTE_DEFINITIVE) est un **second axe** de statuts tenu par le recouvrement (partie 4a) : il **n'ajoute aucun statut** aux 12 du dossier. Le crédit les **lit** et les affiche sur le dossier. Un plan d'étalement produit un nouvel échéancier ; ce nouvel échéancier est envoyé au cœur (partie 4a). Réalise UJ-1.

**Conséquences (testables) :**
- Le dossier EN_GESTION affiche à la fois son statut de crédit et son statut de recouvrement.
- Les quatre vocabulaires de la démo (statuts de base, colonnes du Kanban ROC, statuts de statistiques, étapes du cycle) sont remplacés par les statuts de FR-78 et des **vues** (filtres), jamais des statuts supplémentaires.

### 5.11 Machine à états et piste d'audit

#### FR-78 : Le dossier suit douze statuts, plus ANNULE

Les statuts, dans l'ordre : **SOUMIS → RDV_PROGRAMME → EN_ATTENTE_DOCUMENTS → DOSSIER_COMPLET → VISITES_PLANIFIEES → EN_ANALYSE → VALIDE_CHARGE → EN_ANALYSE_ROC → EN_COMITE_CREDIT → EN_GESTION → CLOTURE**, plus **REFUSE** (douzième) et **ANNULE** (le client renonce, hors des douze). Pas de REFUSE_CHARGE : un avis défavorable du CC mène à REFUSE (décision C2). Réalise UJ-1.

| De | Vers | Déclenche | Garde |
|---|---|---|---|
| création | SOUMIS | agent, commercial | client utilisable, montant et durée dans les bornes, éligible, TEG sous le plafond (FR-30 à FR-36) |
| SOUMIS | RDV_PROGRAMME | CC | rendez-vous saisi |
| SOUMIS, RDV_PROGRAMME | EN_ATTENTE_DOCUMENTS | CC | liste de pièces manquantes |
| EN_ATTENTE_DOCUMENTS | DOSSIER_COMPLET | système | pièces acceptées, cautions et garanties OK, KYC au moins en vérification (FR-43) |
| DOSSIER_COMPLET | VISITES_PLANIFIEES | CC | nombre de visites planifiées atteint (FR-45) |
| VISITES_PLANIFIEES | EN_ANALYSE | système | visites valides en nombre exigé, BIC saisi si exigé (FR-44, FR-46) |
| EN_ANALYSE | VALIDE_CHARGE | CC | avis favorable, checklist à 100 %, alertes critiques commentées (FR-50, FR-51) |
| EN_ANALYSE | REFUSE | CC | avis défavorable avec motif |
| VALIDE_CHARGE | EN_ANALYSE_ROC | système | avis du risque rendu ou délai écoulé ou seuil non atteint (FR-52) |
| EN_ANALYSE_ROC | EN_COMITE_CREDIT | ROC | montant, taux, durée, GP ; TEG sous plafond (FR-54) |
| EN_ANALYSE_ROC | REFUSE | ROC | motif (FR-55) |
| EN_ANALYSE_ROC | EN_ATTENTE_DOCUMENTS | ROC | garanties demandées (FR-55) |
| EN_COMITE_CREDIT | EN_GESTION | comité | décision favorable, quorum, échéancier généré (FR-56 à FR-63, FR-70) ; le décaissement suit dans le sous-état (FR-64 à FR-70) |
| EN_COMITE_CREDIT | REFUSE | comité | motif (FR-60) |
| EN_GESTION | CLOTURE | système, sur confirmation du cœur | solde nul (FR-75) |
| tout statut avant EN_GESTION | REFUSE ou ANNULE | rôle habilité | motif obligatoire |

**Conséquences (testables) :**
- Toute transition absente de la table est refusée, par n'importe quel écran ou n'importe quel rôle, avec le motif « transition interdite ».
- Aucune autre colonne de Kanban, aucun autre statut n'est créé (APPROUVE, DECAISSEMENT de la démo deviennent des vues).

#### FR-79 : Chaque transition a un acteur autorisé et des gardes évaluées au serveur

Chaque transition de FR-78 n'est faisable que par le **rôle** de la table et les gardes sont évaluées par le serveur au moment de l'action. Un clic sur un bouton hors droits ou hors garde est refusé avec la liste des conditions manquantes. Réalise UJ-1.

**Conséquences (testables) :**
- Le DG ne décide pas à la place du ROC (FR-54) ; le RSQ ne rend pas l'avis du CC (FR-51) ; le comité n'est pas un rôle mais une séance (FR-56).
- La même action ouverte dans deux onglets ne s'applique qu'une fois (idempotence) ; la seconde reçoit « déjà fait ».
- Une action de la démo qui n'a aucun effet (avis CC, décision ROC, comité) est branchée ou marquée « bientôt » (FR-91).

#### FR-80 : Chaque changement est horodaté : qui a fait quoi, et quand

Chaque **transition** et chaque acte du dossier (avis, décision, vote, pièce, caution, visite, autorisation, ordre, confirmation) est enregistré avec **auteur, rôle, date et heure, état avant et après, motif**. La piste est **infalsifiable** (aucune modification ni suppression) et **conservée au moins 10 ans** (Instruction BCEAO n° 017-12-2010, annexe II.2.2). Les acteurs « système » et « cœur » sont nommés. Réalise UJ-1.

**Conséquences (testables) :**
- Le journal d'un dossier se lit de la création à la clôture sur un seul écran, dans l'ordre, sans trou ; l'AUD le lit sans pouvoir le modifier.
- Tout accès d'un AUD ou d'un ADMIN_IMF au dossier est lui-même journalisé ; l'ADMIN_IMF ne lit pas le contenu métier.
- La durée de conservation est un paramètre (défaut : 10 ans).

#### FR-81 : Les retours en arrière sont limités et tracés

Le **seul retour** autorisé est EN_ANALYSE_ROC vers EN_ATTENTE_DOCUMENTS (garanties demandées, FR-55), plus le **réexamen unique** du FR-51. Reculer librement d'une colonne, comme le permet la démo, est supprimé. REFUSE et ANNULE sont possibles à tout moment avant EN_GESTION, avec motif. Réalise UJ-1.

**Conséquences (testables) :**
- Un dossier REFUSE ou ANNULE ne rouvre pas, sauf le réexamen unique ; une nouvelle demande est un nouveau dossier.
- Un retour est visible dans le journal avec son motif.

#### FR-82 : La séparation des tâches est contrôlée

Le crédit applique la **séparation des tâches** : la personne qui a créé le dossier n'en rend pas l'avis, celle qui a rendu l'avis du CC ne décide pas au ROC, celle qui instruit n'autorise pas le décaissement en espèces ; le comité exclut les membres en conflit (FR-56). Des **alertes d'audit** sont levées : dossier modifié après le comité, décaissement sans visite valide, même personne qui valide un paiement Mobile Money et modifie l'échéance du même client sous 1 h. Réalise UJ-1.

**Conséquences (testables) :**
- Une action qui violerait la séparation est refusée avec le motif, sauf délégation explicite tracée (FR-85).
- Les alertes d'audit sont envoyées à l'AUD et au DG ; leur seuil de délai (1 h par défaut) est un paramètre.

#### FR-83 : Les délais de traitement sont mesurés sur les horodatages

Le **délai** de chaque étape est calculé à partir du journal (FR-80) : attente par statut, délai de traitement du CC (objectif : **24 h** ; paramètre), délai entre la demande et le décaissement (objectif : **9 jours** ; paramètre), **SLA** d'un dossier en attente (alerte au-delà de **48 h** ; paramètre). Les taux d'approbation par tranche de montant et les motifs de refus sont calculés sur les dossiers réels. Réalise UJ-1.

**Conséquences (testables) :**
- Un dossier en attente depuis 48 h ou plus affiche « SLA dépassé » et remonte au supérieur (FR-87).
- Les chiffres du tableau de bord ROC viennent de ces calculs ; les constantes de la démo (38 h, 11 jours, répartitions fixes) sont supprimées.

### 5.12 Dérogations et délégations (C4, C10)

#### FR-84 : Une dérogation est motivée, limitée et tracée

Trois dérogations existent : **d'éligibilité** (FR-34 ; par le ROC), **de plafond de dossier** (FR-57 ; par le DG), **de nouveau cycle après perte** (FR-76 ; par le DG). Chaque dérogation enregistre qui, quand, quoi, pourquoi, et pour quelle valeur. Elles sont listées pour l'AUD et le DG. Aucune dérogation ne s'applique au plafond d'usure (FR-36) ni au KYC refusé. Réalise UJ-1.

**Conséquences (testables) :**
- Une dérogation sans motif est refusée.
- Le dossier dérogé porte un drapeau jusqu'à sa clôture ; le tableau de pilotage compte les dérogations par agence et par rôle.

#### FR-85 : En cas d'absence, un rôle peut être délégué, explicitement

Le **DG ne remplace pas le ROC** (décision C4). En cas d'absence du ROC ou du CC, une **délégation explicite** est créée par le DG (ou par le RA pour le CC de son agence) : délégataire, rôle délégué, début, fin, motif. Elle est tracée dans chaque acte rendu. Réalise UJ-1.

**Conséquences (testables) :**
- Une délégation expire à sa fin sans action ; aucun acte n'est possible après.
- Un acte fait sous délégation porte « par X, délégué de Y ».
- Une délégation ne permet jamais de rendre l'avis puis de décider sur le même dossier (FR-82).

#### FR-86 : Tout seuil du crédit est un paramètre de l'IMF

Les seuils de cette partie sont des paramètres, avec leur défaut, modifiables par le DG ou le ROC (ADMIN_IMF ne lit pas les valeurs métier mais applique la configuration validée par le DG, décision F7). Chaque changement est daté, tracé et ne touche pas les dossiers déjà décidés.

| Paramètre | Défaut | FR |
|---|---|---|
| Plafond d'usure (TEG, par an) | 24 %, daté | FR-36 |
| Score minimum, ancienneté minimum | 45 ; 3 mois | FR-34 |
| Cautions minimales, seuil | 2 ; 300 000 FCFA | FR-41 |
| Dépôt de garantie | 10 % (> 300 000) ; 15 % (> 1 000 000) | FR-42 |
| Garantie réelle | 30 % (> 500 000) ; 50 % (> 1 000 000) | FR-42 |
| Visites : seuil et nombre | 500 000 FCFA ; 1 sous, 2 au-dessus | FR-45 |
| Rayon de visite, alerte d'audit | 100 m ; 500 m | FR-46 |
| Taux d'effort, endettement | 33 % ; 50 % | FR-47 |
| Seuil de l'avis du risque ; délai | 2 000 000 FCFA [ASSUMPTION] ; 48 h | FR-52 |
| Retours pour garanties | 2 [ASSUMPTION] | FR-55 |
| Quorum ; DG obligatoire au-dessus de | ROC + (DG ou RA) ; 5 000 000 FCFA | FR-56, FR-57 |
| Plafond parties liées | 10 % des fonds propres | FR-58 |
| Méthode d'échéancier | annuité constante mensuelle | FR-61 |
| Délai d'ordre non exécuté | 24 h [ASSUMPTION] | FR-64 |
| Membres d'un groupe | 5 à 30 | FR-72 |
| Retard max au cycle précédent ; plafond du cycle suivant | 30 jours ; 1,5 fois | FR-76 |
| Conservation de la piste | 10 ans | FR-80 |
| Objectifs de délai ; SLA | CC 24 h ; décaissement 9 jours ; 48 h | FR-83 |
| Saturation sectorielle | 35 % (calibré sur les données de l'IMF) | FR-97 |

**Conséquences (testables) :**
- Aucune de ces valeurs n'est écrite dans le code d'un écran : la modification d'un paramètre change le comportement sans nouvelle version.
- Un dossier décidé garde les valeurs en vigueur le jour de sa décision.

### 5.13 Notifications du processus (C16)

#### FR-87 : Chaque événement du processus prévient les bonnes personnes

Le crédit publie ses événements ; le module `notification` (PRD notification) les achemine. Les destinataires et canaux par défaut (décision C16) :

| Événement | Destinataires | Canaux |
|---|---|---|
| Demande soumise (SOUMIS) | CC de l'agence (RA si aucun) | cloche, e-mail |
| Pièces manquantes, rendez-vous | agent, client | cloche ; SMS, WhatsApp pour le client |
| Avis du risque demandé | RSQ | cloche, e-mail |
| Dossier chez le ROC | ROC | cloche, e-mail |
| Refus (CC, ROC, comité) | agent, CC ; client | cloche, e-mail ; SMS, WhatsApp pour le client |
| Garanties demandées | CC, agent | cloche, e-mail |
| Décision du comité favorable ; GP désigné | GP, ROC, agent | cloche, e-mail |
| Ordre de décaissement à autoriser | CPT ou DAF | cloche, e-mail |
| Passage à EN_GESTION | client, GP, agent, responsable commercial | SMS, WhatsApp pour le client ; cloche, e-mail pour le personnel |
| SLA dépassé (48 h) | supérieur du responsable | cloche, e-mail |
| Clôture | client, GP | idem |

**Conséquences (testables) :**
- Chaque événement du tableau produit une notification, avec l'identifiant du dossier ; aucun événement n'a un destinataire en dur.
- Le français est la langue d'abord ; les gabarits sont des paramètres de l'IMF.
- `notification` absent : le crédit affiche une cloche interne et signale « canal non installé » ; il n'échoue pas.

#### FR-88 : Un message au client respecte son consentement et son canal

Un SMS ou un message WhatsApp au client n'est envoyé que s'il a **consenti** à ce canal (fiche, partie 3a) ; sinon aucun message n'est envoyé au client et le CC est invité à le prévenir par un autre moyen, noté au dossier. Le contenu ne révèle jamais le motif détaillé d'un refus ni de score. Réalise UJ-1.

**Conséquences (testables) :**
- Un refus notifié par SMS dit « votre demande n'a pas été retenue » et invite à voir le chargé de crédit.
- Un échec d'envoi est visible dans le dossier et ne retient aucune transition.

### 5.14 Les écrans du crédit

#### FR-89 : Les écrans conservés de la démo deviennent réels

Les écrans suivants de la démo sont conservés et **branchés** : `/credit` (RA : agence, PAR ; ROC et RSQ : tableau ROC), pipeline Kanban, liste des dossiers, fiche dossier (frise, onglets Workflow, Client, Instruction CC, Rapport CC, Rapport ROC, Score, Comité, Échéancier, Recouvrement), analyse (liste et rapport), cycle de crédit, réseau (ROC), plus les écrans voisins `/clients/nouveau`, `/kyc`, `/calendrier`, `/produits`, `/groupes`, `/emprunteurs/[id]`. Réalise UJ-1.

**Conséquences (testables) :**
- Le Kanban agence (4 colonnes) et ROC (statuts de FR-78) s'alimentent des dossiers réels ; un glisser-déposer n'est permis que si la transition de FR-78 l'est, et il n'est plus gardé en navigateur.
- Les KPI du cycle sont calculés (FR-83), plus aucune constante.
- Un test parcourt chaque écran et échoue si un bouton n'est ni branché ni « bientôt » (PRD-D FR-2).

#### FR-90 : Les écrans qui manquent sont créés

Sont à **créer** : **création de la demande** (produit du catalogue, simulation, FR-32 à FR-36) ; **pièces** (liste, téléversement, acceptation) ; **cautions et garanties** ; **visites d'instruction** (planification, saisie photo et GPS) ; **checklist d'instruction** ; **avis du CC, avis du risque, décision du ROC** (trois choix) ; **séance de comité** (présents, votes, conditions figées, génération de l'échéancier, impression du contrat) ; **ordre de décaissement** (canal, autorisation CPT/DAF, état) ; **dérogations et délégations** ; **clôture et renouvellement** ; **dossier de groupe**. Réalise UJ-1, UJ-2.

**Conséquences (testables) :**
- Chaque écran a ses droits (FR-92) et chaque action est une transition ou un acte tracé (FR-80).
- Aucun de ces écrans n'existe dans `credit/` aujourd'hui : cette liste est l'écart principal entre la démo et le récit (5.15).

#### FR-91 : Les boutons décoratifs deviennent branchés ou « bientôt »

Les boutons décoratifs de la démo sont inventoriés : avis CC, décision ROC, comité, planifier un rendez-vous, encaisser, promesse, relance, réception d'une caution, export PDF et Excel. Chacun est **branché** (exigences de cette partie) ou **« bientôt »** sans date (PRD-D FR-2), jamais simulé. Réalise UJ-1.

**Conséquences (testables) :**
- « Export PDF » du rapport génère un fichier réel ou affiche « bientôt » ; « Export Excel » idem.
- Sont « bientôt » : branchement direct au BIC (FR-44), tontines, chatbot WhatsApp entrant.

#### FR-92 : Chacun ne voit que son périmètre

Le DG voit le réseau, le RA son agence, le CC les dossiers de son agence et sa file, le ROC toutes les agences, le GP son portefeuille, l'agent sa zone, le RSQ tout en lecture, l'AUD tout en lecture avec le journal d'accès, le CPT son agence (autorisation de décaissement, validation de paiements). Le filtrage est fait par le serveur, par organisation et par portée lue dans `reseau`. Réalise UJ-1.

**Conséquences (testables) :**
- Un RA qui ouvre par URL un dossier d'une autre agence reçoit un refus sans contenu.
- Le filtre par nom d'agence en dur de la démo disparaît.

#### FR-93 : Le parcours UJ-1 est le test d'acceptation du crédit

Dans la démo, un utilisateur crée une agence et un agent, puis un client, puis une demande de crédit, et la mène **de SOUMIS à EN_GESTION** en jouant les rôles CC, ROC, comité et CPT, avec le **cœur fictif** qui exécute le décaissement et confirme (décision B4). Réalise UJ-1.

**Conséquences (testables) :**
- Le parcours passe sans aucune intervention technique ni donnée préparée à la main ; il dure moins de 30 minutes en jouant tous les rôles (objectif de démonstration ; paramètre).
- Chaque statut de FR-78 est atteint dans l'ordre ; la piste d'audit (FR-80) montre onze lignes d'acteurs identifiés.
- Le même parcours se rejoue avec l'IA commune absente.

#### FR-94 : Le parcours UJ-2 mène un prêt de groupe jusqu'à EN_GESTION

Dans la démo, un groupe solidaire de 5 membres obtient un crédit de groupe : dossier de groupe, 5 sous-dossiers, une décision, **cinq échéanciers**, cinq décaissements confirmés par le cœur fictif (FR-72, FR-73). Réalise UJ-2.

**Conséquences (testables) :**
- Le décaissement du dossier de groupe n'est CONFIRME que quand les cinq décaissements le sont.
- Retirer un membre au ROC recalcule le total et les échéanciers avant le comité.

### 5.15 Ce que la démo exige en plus et écarts relevés

| Écart démo ou récit | Ce que fait le PRD |
|---|---|
| Aucun écran pour visites, pièces, cautions, simulation, comité, décaissement | à créer (FR-90) |
| Avis CC, décision ROC, comité : boutons sans effet (callbacks vides) | branchés (FR-79, FR-91) |
| Quatre vocabulaires de statuts (14 en base, 9 colonnes ROC, 14 de statistiques, 6 étapes) ; REFUSE_CHARGE et ANNULE | 12 statuts + ANNULE ; le reste = vues (FR-77, FR-78) |
| Décision ROC ouverte dès VALIDE_CHARGE ; ROC et DG identiques ; RSQ = CC | ouverte à EN_ANALYSE_ROC, ROC seul, RSQ consultatif (FR-51, FR-53, FR-54) |
| Cautions : 2 toujours, barème fixe ; visites : aucune règle | seuils paramétrables (FR-41, FR-42, FR-45, FR-86) |
| Pas de simulation ni d'éligibilité ; produits en trois listes ; produit à 2,5 %/mois, TEG 36,4 % | simulation, éligibilité, usure 24 % sur TEG actuariel ; un catalogue ; jeu de démo conforme (FR-32 à FR-36) |
| Échéancier de démo = capital constant le 15 du mois, sans intérêts réels ni TEG | annuité constante, frais, assurance, TEG (FR-61) |
| Conditions finales : 4 champs sur 10 | tous les champs (FR-59) |
| Notifications : aucune | table des événements (FR-87) |
| Décaissement : une colonne Kanban seulement | ordre, autorisation, exécution par le cœur ou `paiement`, confirmation (FR-64 à FR-70) |
| Score, 5C, alertes : constantes saisies ; 8 dimensions sur 110 et sur 100 ; deux échelles de classes | 5C par le CC ; score et analyses par l'IA, 0-100, une échelle de classes (FR-47, FR-49, FR-95 à FR-98) |
| Avis CC à 2 ou 4 valeurs | 2 valeurs + conditions proposées (FR-51) |
| Écart à l'IA sans justification | motif obligatoire (FR-49, FR-51) |
| Décision d'IA à 5 valeurs (TRANSMETTRE_ROC) | 4 valeurs (FR-49) |
| Checklist de 4 cases | liste par produit, 100 % (FR-50) |
| Création du prospect à 8 champs, sans GPS ni photo | partie 3a ; le crédit lit la fiche (5.1) |
| Retour libre d'une colonne du Kanban | un seul retour, tracé (FR-81) |
| KPI et délais constants | calculés (FR-83) |
| Statut du récit : EN_GESTION à la génération de l'échéancier ; démo : après décaissement | EN_GESTION à la décision du comité, comme le récit ; décaissement dans un sous-état confirmé par le cœur (FR-70) |
| Groupe : lecture seule, 5 à 15 membres | 5 à 30, dossier de groupe, échéancier par membre (FR-72, FR-73) |

---

## 6. Partie 3 — Les autres modules propres à l'IMF

Cette partie décrit les modules qui portent le client, le produit et l'argent du terrain : les sections 6.1 à 6.4 (`produits-financiers`, `microfinance`, `collecte`, `caisse`) ; les sections 6.5 à 6.8 sont écrites à part (échange avec le cœur, import du portefeuille, risque, conformité BCEAO). Règle commune : **le cœur de l'IMF fait foi pour l'argent** (soldes, épargne, caisse du guichet, écritures). Prospera tient ce que le cœur ne tient pas : le catalogue commercial des produits, la fiche de relation (activité, photos, GPS, KYC, groupes), la collecte et la caisse des collecteurs. Dans la démo de février, le cœur fictif (6.5) tient tout ce qui revient au cœur. Tout seuil est un paramètre de l'IMF ; tout bouton non branché est « bientôt » (PRD-D FR-2).

Parcours cités : **UJ-1** (premier prêt de bout en bout), **UJ-2** (prêt de groupe), **UJ-4** (journée d'un collecteur hors ligne).

**Règles communes des capacités d'IA de cette partie.** Le moteur est l'**IA commune** (famille de modules à part : Risque, Agents métier, Relation client, Pulse) : ce PRD dit **ce que l'IA fait pour l'IMF**, l'IA commune dit comment. Pour chaque capacité : (1) la **provenance** s'affiche (règle ou modèle, version, date, données utilisées) et le mot « IA » n'est affiché que pour un modèle ; tant qu'un modèle n'existe pas, une règle explicable sert la capacité ; (2) **l'IA propose, un humain décide** ; l'écart à une proposition de **décision de crédit** exige un motif (partie 2), renvoyé comme correction ; pour les suggestions d'aide (produit, ordre de visite, zones), le choix de l'humain est enregistré sans motif ; (3) si l'IA est indisponible, **rien ne bloque** : la règle de base ou l'analyse humaine prend le relais ; (4) des données de l'IMF ne partent vers l'IA commune **qu'avec le consentement** de la finalité (FR-132) ; (5) le **secteur d'activité** (FR-117) alimente les analyses ; (6) les seuils d'alerte sont des paramètres calibrés sur les données de l'IMF (décision E5).

### 6.1 Produits financiers (`produits-financiers`, M46 [proposition]) ★

**Dans la démo.** `/produits` est en lecture seule : 9 produits (crédit, épargne, tontine, frais, assurance), aucun formulaire, aucune version, aucune simulation. Le modal « Demande de crédit » a sa propre liste de 5 produits en dur, différente du catalogue : il n'y a pas de source unique. L'éligibilité (score, ancienneté) n'est pas contrôlée. Le produit d'exemple (2,5 %/mois, TAEG 36,4 %) et le microcrédit à 28 % dépassent le plafond de 24 % par an.

**Ce que ça veut dire.** Un produit financier n'est pas un article : il a des bornes, un taux, des frais, une méthode d'amortissement, des conditions d'éligibilité, et **il change de version sans toucher aux dossiers en cours** (décision T5 du PO : module à part). Le module `produits-financiers` est propre aux verticales finance ; le `catalogue` (PRD-D §7.3) reste celui des articles. Le cœur fait foi pour le **code produit et le plan comptable** ; Prospera tient le catalogue commercial versionné et renvoie au cœur le code produit et les conditions figées du dossier accordé. Le calcul du TEG, le plafond d'usure daté et le blocage à l'octroi sont ceux des règles transverses de la partie 1 ; ce module les applique à **la publication** d'une version.

#### FR-100 : Un produit financier est une fiche versionnée, de crédit ou d'épargne, gérée à deux personnes

Le module tient le catalogue des produits financiers de l'IMF. Chaque produit a une famille (crédit individuel, crédit de groupe, épargne à vue, épargne bloquée, dépôt à terme), un code (voir FR-110), un nom, un statut (brouillon, publié, retiré) et une suite de versions. Les familles « tontine » et « assurance » s'affichent « bientôt » (décision T1 ; l'assurance relève du PRD assurance). Réalise UJ-1.

L'administrateur de l'IMF (ADMIN_IMF) ou le DAF crée et modifie un produit ; le DG ou le ROC le **publie** (deux personnes : l'auteur ne publie pas) ; le CC, le RA, le GP, l'agent terrain, le commercial et le collecteur le lisent et simulent ; le comité valide les conditions finales d'un dossier (partie 2). [ASSUMPTION : la séparation auteur et publicateur est déduite de la séparation des tâches de l'instruction BCEAO n° 017-12-2010 ; le cahier de la démo dit seulement « administrateur ou DAF gèrent ».] ADMIN_IMF ne lit pas les données métier des clients.

**Conséquences (testables) :**
- Le catalogue liste les produits par famille ; un produit publié a au moins une version publiée.
- Une famille « bientôt » n'est ni créable ni sélectionnable, et n'affiche aucune date.
- Le modal de demande de crédit (partie 2) et la simulation (FR-109) lisent **ce** catalogue : aucune liste de produits en dur ailleurs.
- Le créateur d'une version ne peut pas la publier lui-même.
- Un agent terrain ne voit aucun bouton de création ou de modification ; il voit les produits et simule.
- Chaque création, modification et publication est dans le journal d'accès (auteur, date, version).

#### FR-101 : Un produit de crédit porte ses bornes, son taux, son ajustement de risque et sa périodicité

Une version de produit de crédit définit : le montant minimum et maximum (pas de saisie compris), la durée minimum et maximum, le type de taux (mensuel, annuel, dégressif), le taux nominal, la périodicité de remboursement (hebdomadaire, bimensuelle, mensuelle), le différé éventuel, le public (individuel ou groupe, avec 5 à 30 membres pour un groupe : décision C14), la pénalité de retard (valeur transmise au cœur, qui la calcule : décision A4). Réalise UJ-1, UJ-2.

Une version peut déclarer un ajustement de risque : si le score du client est sous un seuil (défaut : 60), le taux monte de N points (défaut : 2 ; paramétrable de 1 à 5) ou la durée maximum est réduite. L'ajustement est une grille par score, jamais un taux négocié client par client.

**Conséquences (testables) :**
- Une demande de montant ou de durée hors des bornes de la version est refusée avec le motif et la borne violée.
- Le pas de saisie du montant par défaut est de 10 000 FCFA et le montant minimum de démo de 50 000 FCFA (paramètres de la version).
- Une version de crédit de groupe refuse un groupe de 4 membres et un groupe de 31 membres (bornes 5 et 30 : paramètres).
- Un client de score 55 sur un produit à 18 % avec ajustement de +2 points voit 20 % dans sa simulation, avec la ligne « ajustement de risque +2 points ».
- Si le taux ajusté porterait le TEG au-dessus du plafond d'usure en vigueur, la simulation et le dossier sont bloqués (FR-10) ; l'ajustement n'est pas écrêté en silence.

#### FR-102 : La méthode d'amortissement est un choix du produit

La version dit comment le capital est rendu : **annuité constante** (défaut, mensualité fixe), **capital constant**, **remboursement in fine** ; les autres périodicités sont des options (décision C8). Les frais sont perçus au décaissement ; l'assurance est incluse dans la mensualité si le produit en a. Le comité génère l'échéancier contractuel (partie 2) avec la méthode de la version figée sur le dossier. [ASSUMPTION : la démo montre deux méthodes contradictoires (capital constant dans l'exemple du cœur de la démo, mensualité constante dans le cahier) ; l'annuité constante est le défaut retenu par la recommandation C8 du PO.]

**Conséquences (testables) :**
- Pour 250 000 FCFA, 12 mois, 18 % par an en annuité constante, les 12 mensualités sont égales (à l'arrondi du dernier terme près) ; en capital constant, le capital de chaque échéance est égal à 20 833 FCFA (à l'arrondi près) et les intérêts décroissent.
- Changer la méthode d'une version crée une nouvelle version (FR-107) ; elle ne modifie aucun échéancier existant.

#### FR-103 : Frais, assurance et garanties de frais sont typés, avec le drapeau « inclus dans le TEG »

Chaque frais de la version (dossier, assurance, coût de garantie, frais de transfert, tenue de compte) a un type, un mode (pourcentage ou montant), un moment (décaissement ou échéance) et un drapeau **« inclus dans le TEG »**. Par défaut : dossier, assurance et coût de garantie sont inclus ; pénalités, impôts et taxes, frais de transfert et de tenue de compte non anormaux sont exclus (décret TEG annexé à la loi uniforme sur l'usure, guide BCEAO DSF-001/2015). Réalise UJ-1.

**Conséquences (testables) :**
- Passer « assurance obligatoire » à vrai ajoute sa prime au TEG calculé de la simulation (FR-109).
- Une pénalité ne peut pas être marquée « incluse dans le TEG » : le champ est verrouillé à « exclue ».
- Le contrat et la simulation affichent la liste des frais avec leur drapeau.

#### FR-104 : L'éligibilité d'un client à un produit se juge sur le score et l'ancienneté

Une version de produit fixe un **score minimum** (défaut de démo : 45) et une **ancienneté minimum** du client (défaut de démo : 3 mois), en paramètres (décision C10). Quand un agent choisit un client, les produits dont il n'est pas éligible s'affichent grisés avec le motif ; la demande est bloquée ; le ROC peut accorder une **dérogation motivée et tracée**. Le score vient du module Risque de l'IA commune ou, à défaut, de la règle v0 (FR-124). Réalise UJ-1.

**Conséquences (testables) :**
- Un client de score 40 et un produit à 45 : la demande est bloquée avec « score 40 < 45 ».
- Le ROC accorde la dérogation avec un motif ; la demande passe, et la dérogation (qui, quand, motif) est visible sur le dossier.
- Un client de 2 mois d'ancienneté est bloqué sur un produit à 3 mois ; ni le CC ni l'agent ne peuvent lever le blocage.
- Sans score disponible (IA commune absente et règle non calculable), la demande est refusée avec « score indisponible » ; elle n'est jamais acceptée par défaut.

#### FR-105 : Le produit dit quelles cautions et quelles garanties il exige

Une version fixe, par tranche de montant : le nombre de cautions exigées, le dépôt de garantie, la garantie réelle (stock, matériel, nantissement), tous paramétrables. Défauts de démo (décision C7) : **2 cautions au-dessus de 300 000 FCFA** ; dépôt de garantie 10 % du montant (15 % au-dessus de 1 000 000) sur un compte d'épargne bloqué ; garantie réelle d'au moins 30 % du montant (50 % au-dessus de 1 000 000). Ces exigences servent le dossier de crédit (partie 2). Le gel du dépôt de garantie se fait dans le cœur (PRD-D §6.0 « épargne et dépôts »). Réalise UJ-1.

**Conséquences (testables) :**
- Pour 400 000 FCFA, le dossier exige 2 cautions et un dépôt de 40 000 FCFA ; pour 250 000 FCFA, aucune caution n'est exigée avec les défauts.
- Le dossier ne passe pas à DOSSIER_COMPLET tant que les cautions et garanties exigées par la version figée ne sont pas enregistrées.
- Modifier les seuils d'un produit n'a aucun effet sur un dossier déjà ouvert (FR-107).

#### FR-106 : Un produit d'épargne dit ses règles ; le cœur tient les comptes

Un produit d'épargne (à vue, bloquée en garantie d'un crédit, dépôt à terme) définit : dépôt minimum, taux (information), fréquence de dépôt, plafond de retrait par jour, durée et règle de renouvellement pour le dépôt à terme, délai de dormance (défaut : 6 mois sans mouvement ; dépôt à terme : 3 mois après l'échéance non renouvelée). Prospera **tient le catalogue** ; les comptes, soldes, intérêts et blocages réels sont ceux du cœur (FR-130). L'ouverture d'un compte est une demande envoyée au cœur ; le bouton « Ouvrir compte », décoratif dans la démo, est « bientôt » tant que le cœur (ou le cœur fictif) ne sait pas la recevoir.

**Conséquences (testables) :**
- Le premier dépôt collecté d'un montant inférieur au dépôt minimum du produit est refusé avec le minimum.
- Aucun solde n'est calculé ni modifié par ce module.
- Un produit d'épargne « tontine » est « bientôt » (décision T1).

#### FR-107 : Chaque modification publiée crée une version ; le dossier garde ses conditions

Publier un produit crée une version **horodatée et signée** (auteur). Un dossier de crédit enregistre, au comité, la version exacte du produit : ses conditions d'origine ne changent jamais, même si le produit change ou est retiré. Retirer un produit le masque aux nouvelles demandes sans toucher aux dossiers en cours. Réalise UJ-1.

**Conséquences (testables) :**
- Le taux d'un produit passe de 18 % à 17 % : un dossier accordé la veille garde 18 % ; une nouvelle simulation donne 17 %.
- L'historique d'un produit liste chaque version avec son auteur, sa date et un résumé de ce qui a changé.
- Un produit retiré n'apparaît plus dans la demande, mais reste lisible sur les dossiers qui le portent.
- Les conditions figées par le comité ne sont modifiables que par l'administrateur, avec une entrée de journal (cahier crédit).

#### FR-108 : Une version qui dépasse le plafond d'usure ne se publie pas

À la publication d'une version de produit de crédit, le module calcule le **TEG actuariel** (méthode et drapeaux de FR-103) sur les cas extrêmes de la version : montant et durée minimum et maximum, avec frais, assurance et ajustement de risque maximum. Si l'un des cas dépasse le **plafond d'usure en vigueur à la date de publication** (24 % par an pour une IMF, Décision n° 19 du 29/12/2025/CM/UMOA, en vigueur le 01/06/2026 ; plafond paramétrable daté, partie 1), la publication est refusée avec le cas fautif. Si le plafond baisse plus tard, les versions publiées qui le dépassent passent à « à revoir » et ne sont plus proposées pour de nouvelles demandes.

**Conséquences (testables) :**
- Un produit à 24 % nominal avec 2 % de frais de dossier est refusé à la publication, avec « TEG 25,x % > plafond 24 % ».
- Un produit à 1,5 %/mois avec 1 % de frais de dossier sur 12 mois se publie.
- Changer le plafond daté à 22 % marque « à revoir » les versions dépassant 22 % ; les dossiers déjà accordés ne bougent pas.
- Le refus affiche le TEG calculé, le plafond, sa date d'effet et le cas (montant, durée) qui dépasse.

#### FR-109 : La simulation montre l'échéancier, les frais et le TEG, sans rien enregistrer

Avant la demande, l'agent simule : montant, durée, produit, client (pour l'ajustement de FR-101). La simulation affiche mensualité, intérêts totaux, frais, coût total, **TEG** et échéancier. Elle ne crée aucun dossier. Réalise UJ-1.

**Conséquences (testables) :**
- Le résultat s'affiche en moins de 500 ms pour 36 échéances.
- La simulation est refusée avec le même motif que la demande si le montant, la durée ou le TEG sort des bornes (FR-101, FR-108).
- La simulation fonctionne **hors ligne** à partir du catalogue téléchargé sur l'appareil ; elle affiche la version de produit utilisée.
- Le TEG de la simulation et le TEG imprimé au contrat sont calculés par la même méthode.

#### FR-110 : Le code produit est commun avec le cœur ; les conditions figées lui sont renvoyées

Chaque produit porte le **code produit du cœur** (clé de correspondance). Au passage EN_GESTION d'un dossier, Prospera envoie au cœur le code produit et les conditions figées (version, taux, frais, méthode, TEG). Un produit sans code du cœur peut être publié, mais aucun dossier qui le porte ne peut être accordé : le dossier reste « en attente du code produit ». Les codes sont fournis par le cœur (ou par le cœur fictif) ; le contrat d'échange est en 6.5.

**Conséquences (testables) :**
- Un produit sans code cœur affiche « code du cœur manquant » ; la tentative d'octroi sur ce produit est refusée avec ce motif.
- Le message envoyé au cœur contient la version de produit du dossier, pas la version courante du catalogue.

#### FR-111 : Le jeu de démonstration prend des produits conformes à 24 %

Le jeu de démo de l'IMF fictive (partie 1) contient des produits dont le TEG est **inférieur ou égal à 24 %** pour tous leurs cas, vérifié par FR-108 à la mise en place. Le produit d'exemple de la démo (2,5 %/mois, TAEG 36,4 %) et le microcrédit à 28 % ne sont pas repris. Produit de référence : microcrédit individuel à 1,5 %/mois, 1 % de frais de dossier, de 50 000 à 2 000 000 FCFA, 3 à 12 mois, TEG d'environ 20 %. Les produits « 24 % pile » de la démo (crédit individuel, PME) sont ramenés à un taux nominal qui laisse la place aux frais. [ASSUMPTION : les taux exacts des autres produits du jeu de démo sont fixés à la rédaction du jeu, sous contrainte du test ci-dessous.]

**Conséquences (testables) :**
- Un test recalcule le TEG de chaque produit du jeu de démo et échoue si l'un dépasse 24 %.
- Aucun produit de démo n'a un taux nominal de 28 % ou de 2,5 %/mois.

#### FR-112 : Le module recommande un produit selon le profil du client

Quand un agent prépare une demande, l'IA commune propose au **CC, à l'agent terrain ou au commercial** les **un à trois produits** les mieux adaptés au client. **Entrées :** secteur d'activité (FR-117), activité, ancienneté, revenus et charges estimés, score (FR-124), historique de crédit lu du cœur, produits éligibles (FR-104). **Sortie :** une liste classée de produits, chacun avec la **raison** en une phrase (« activité saisonnière : remboursement hebdomadaire adapté ») et la provenance. Règles communes de l'IA de cette partie (section 6, introduction) : l'IA propose, l'agent choisit librement ; l'IA absente ne bloque rien. Réalise UJ-1.

**Conséquences (testables) :**
- Un produit dont le client n'est pas éligible (FR-104) n'est **jamais** recommandé.
- La liste affiche, pour chaque produit, la raison et « modèle ou règle, version, date ».
- L'agent qui choisit un autre produit que celui recommandé n'a **aucun motif à fournir** ; son choix est enregistré (recommandé suivi ou écarté) pour mesurer la pertinence.
- IA commune absente : la liste des produits éligibles s'affiche sans classement ni raison, et la demande se fait normalement.

#### FR-113 : La simulation propose les conditions optimales

À la simulation (FR-109), l'IA commune peut proposer au CC et à l'agent un **montant et une durée** qui tiennent dans la **capacité de remboursement estimée** du client : mensualité au plus égale à une part du revenu net estimé (paramètre ; défaut : 40 % [ASSUMPTION : valeur de départ ; à calibrer sur les données de l'IMF]). **Entrées :** revenus et charges de la fiche, saison de l'activité, produit, bornes de la version (FR-101), plafond du TEG (FR-108). **Sortie :** un couple montant-durée, la mensualité, le TEG, et la raison. L'agent peut accepter, modifier ou ignorer. Réalise UJ-1.

**Conséquences (testables) :**
- Une proposition respecte toujours les bornes de la version et un TEG inférieur ou égal au plafond d'usure ; sinon elle n'est pas affichée.
- Une proposition indique la capacité estimée et les données sur lesquelles elle repose, avec leur date.
- Modifier la proposition à la main ne demande aucun motif à ce stade ; le motif d'écart du CC à l'instruction relève de la partie 2.
- IA commune absente : la simulation manuelle reste complète.

### 6.2 Clients, KYC et LBC/FT (`microfinance`, M32) ★

**Dans la démo.** `/clients/nouveau` crée un client, mais se rabat sur le navigateur si l'appel échoue, avec un GPS écrit en dur ; « Nouveau emprunteur » est décoratif ; le hub KYC est en lecture seule (aucun bouton Valider ou Rejeter, ajout de pièce décoratif) ; les groupes sont en lecture seule. Le score, la PD, la perte attendue et leur « explication » sont des constantes. Aucun filtrage de sanctions, aucun PPE, aucune revue périodique n'existe.

**Ce que ça veut dire.** Le module `microfinance` (M32) tient la **fiche de relation** : qui est la personne, quelle est son activité, où elle est, quelles pièces elle a, quel niveau de vigilance lui est appliqué, à quel groupe elle appartient. Il ne tient **ni ses comptes ni ses soldes** : ils sont lus du cœur (décisions A8 et T4). Une personne = une fiche, qu'elle soit épargnante, emprunteuse ou les deux. La LBC/FT est **importante** (décision E3), surtout sa **mise à jour régulière** : listes de sanctions rafraîchies, revue périodique du KYC. La déclaration de soupçon à la CENTIF se fait **hors Prospera** ; Prospera produit l'export. Cadre : loi uniforme LBC/FT/FP du 31/03/2023 et instructions BCEAO du 18/03/2025 (n° 001-03-2025, n° 003-03-2025) [contenu détaillé non vérifié ; à confirmer par un juriste], lois nationales de protection des données.

#### FR-114 : Un prospect se crée en quelques champs, sur le terrain

Le commercial, l'agent terrain, le collecteur ou le CC crée un **prospect** : nom, prénom, téléphone, zone, activité, secteur d'activité (FR-117), GPS (si consenti, FR-118). Le prospect est rattaché à son créateur et à sa zone. Un prospect n'est pas un client : il ne reçoit ni demande de crédit ni dépôt. Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Créer un prospect hors ligne le met en file ; à la reconnexion il apparaît dans la liste de la zone (FR-134).
- Le doublon probable (même téléphone, ou même nom et même zone) est signalé avant l'enregistrement ; l'agent peut ouvrir la fiche existante.
- Le prospect est visible du créateur, de son RCC et de son RA, et d'eux seuls (FR-133).

#### FR-115 : Passer de prospect à client exige une fiche complète

La conversion demande : identité (nom, prénom, genre, date de naissance, nationalité, situation matrimoniale, personnes à charge), pièce d'identité (FR-118), adresse du domicile et de l'activité, contacts (téléphone, WhatsApp, e-mail facultatif), contact d'urgence, activité économique (secteur, ancienneté, lieu, effectif, chiffre d'affaires et charges mensuels estimés), photo et position (FR-118), et la case « **partie liée** » (dirigeant, administrateur ou membre du personnel de l'IMF, ou leur proche : décision C17). La conversion ne se termine qu'avec un KYC validé (FR-120). Réalise UJ-1.

**Conséquences (testables) :**
- Un champ obligatoire manquant empêche la conversion et est listé.
- Cocher « partie liée » marque la fiche ; tout dossier de crédit de cette personne est soumis à l'approbation du conseil et au plafond réglementaire de 10 % (règles du dossier, partie 2) ; la fiche porte un bandeau visible.
- Le statut passe de PROSPECT à CLIENT ; l'historique (qui, quand) est conservé.

#### FR-116 : Une personne, une fiche, un identifiant du cœur

Un client épargnant et emprunteur a **une seule fiche** (décision T4). Sa clé de correspondance est l'**identifiant du cœur** (numéro de client). À la conversion, Prospera demande au cœur de créer le client s'il n'existe pas, ou lie la fiche à celui qui existe ; en attendant la réponse, la fiche porte « en attente du cœur » et le client peut être instruit, mais **aucun décaissement ni dépôt** ne lui est destiné. La fiche affiche, de façon distincte, ce qui vient du cœur (identité légale, numéro, comptes, soldes) et ce que Prospera ajoute (activité, photos, GPS, score, KYC). [ASSUMPTION : la clé de correspondance est le numéro de client du cœur ; le détail du contrat est en 6.5.]

**Conséquences (testables) :**
- Une personne qui a un compte d'épargne au cœur et demande un crédit retrouve sa fiche (même identifiant), sans seconde fiche.
- Deux fiches avec la même pièce d'identité sont refusées à la création (ou fusionnées par un acte explicite du RA, journalisé).
- Un client « en attente du cœur » : la tentative de décaissement est refusée avec ce motif.

#### FR-117 : Le secteur d'activité est un champ structuré obligatoire, d'une nomenclature commune

Chaque fiche (et chaque prospect converti) porte un **secteur d'activité** (et un sous-secteur) choisi dans la **nomenclature commune** de la plateforme, jamais en texte libre. La démo en a quatre (commerce, artisanat, agriculture, services) ; la nomenclature commune est plus fine et fournie par la famille IA commune (décision F2). Ce champ est une dimension de pilotage partout (partie 4b) **et** une donnée qui remonte à l'IA commune, sous consentement (FR-132).

**Conséquences (testables) :**
- Une fiche sans secteur ne peut pas être convertie en client.
- Le secteur ne se saisit que par choix dans la nomenclature ; changer la nomenclature ne casse aucune fiche (correspondance d'anciens codes).
- Un filtre « secteur » existe sur la liste des clients et sur chaque tableau de pilotage, à côté de la descente géographique.
- Le changement de secteur d'un client est journalisé (qui, quand, ancien et nouveau).

#### FR-118 : Les photos, la position GPS et les pièces sont des preuves, avec consentement et expiration

La fiche porte la **photo du client**, la photo du lieu d'activité et la **position GPS** du domicile et du lieu d'activité, prises **par l'appareil sur place** (le repère n'est pas déplaçable à la main). Chaque photo est un JPEG ou PNG de 5 Mo au plus, compressée sur l'appareil. La position n'est prise qu'avec le **consentement de géolocalisation** du client (FR-132) ; sans consentement, la fiche accepte une adresse décrite et marque la position « non consentie ». Réalise UJ-1.

Les pièces de la fiche : pièce d'identité (CNI, passeport), justificatif de domicile, justificatif de revenu, photo, selon le niveau de KYC (FR-119). Chaque pièce a un type, un numéro, une date de délivrance, une **date d'expiration** et un statut (VALIDE, EN_ATTENTE, REJETE, EXPIRE, MANQUANT). Une alerte part au CC et à l'agent avant l'expiration (paramètre ; défaut : 30 jours) ; une pièce d'identité expirée met le KYC à « expiré » (FR-122).

**Conséquences (testables) :**
- Une position tirée à la main n'est pas acceptée comme position GPS de la fiche.
- Hors ligne, les photos sont compressées sous 500 Ko et envoyées à la synchronisation (FR-134).
- Une photo de plus de 5 Mo est refusée à l'envoi, avec la limite.
- Le retrait du consentement de géolocalisation efface la position de la fiche, pas la photo.
- Une CNI qui expire dans 25 jours déclenche l'alerte ; expirée, elle passe à EXPIRE et le KYC à « à renouveler ».
- Une pièce hors ligne est envoyée avec la fiche à la synchronisation ; l'ajout de pièce n'est plus un bouton décoratif.
- Le score de lecture OCR d'une pièce, s'il est affiché, porte la provenance (règle ou modèle, version, date) et n'est jamais une validation (FR-120).

#### FR-119 : Le KYC a trois niveaux, avec PPE et bénéficiaire effectif

Chaque client a un **niveau de KYC** : **simplifié**, **standard** ou **renforcé**, déterminé par des règles de l'IMF (paramètres) : produit demandé, montant, type de client (personne, groupe), notation de risque LBC (FR-124). Chaque niveau liste les pièces exigées. Le marquage **PPE** (personne politiquement exposée) et celui du **bénéficiaire effectif** (pour un groupe ou une personne morale) sont des champs de la fiche ; un PPE passe d'office en **renforcé**, avec approbation du ROC avant tout octroi. [ASSUMPTION : les pièces exigées par niveau et les seuils de montant sont des défauts à faire valider par l'IMF ; le texte des instructions du 18/03/2025 n'a pas été lu en détail.] Réalise UJ-1.

**Conséquences (testables) :**
- Un microcrédit sous le seuil de simplification (paramètre) avec un client non PPE demande le niveau simplifié ; un client marqué PPE demande « renforcé ».
- Un client en « renforcé » sans l'approbation du ROC ne peut pas voir son dossier passer à EN_COMITE_CREDIT.
- Aucun compte ni client anonyme : une fiche sans pièce d'identité valide ne se convertit pas.

#### FR-120 : Le KYC est validé par un autre que le créateur de la fiche

Le KYC est validé, ou rejeté avec un motif, par le **CC** ou par un utilisateur doté de l'**habilitation de conformité** de l'agence ; jamais par celui qui a créé ou complété la fiche (décision T3). Statuts : EN_VERIFICATION, COMPLET, INCOMPLET, REJETE, EXPIRE. La validation se fait en ligne (pas hors ligne). [ASSUMPTION : « agent conformité » n'est pas l'un des 16 rôles ; c'est une habilitation accordée par le DG (rôle sensible, F7) à un CC, un RA ou un comptable, pas un 17e rôle.] Réalise UJ-1.

**Conséquences (testables) :**
- Un CC qui a créé la fiche voit « valider » désactivé avec « vous êtes le créateur » ; un autre CC de l'agence peut valider.
- Un rejet sans motif est refusé ; le créateur est prévenu avec le motif.
- Un dossier de crédit ne passe pas à DOSSIER_COMPLET (partie 2) si le KYC du demandeur et celui de ses cautions ne sont pas COMPLET.
- Chaque validation est journalisée : qui, quand, niveau, pièces vues.

#### FR-121 : Les listes de sanctions sont rafraîchies, et tout le fichier est refiltré

Le filtrage contre les **listes de sanctions** (listes de l'IMF : ONU, UEMOA, nationales ; sources paramétrables) se fait à la création de la fiche, à tout changement d'identité, **et à chaque rafraîchissement d'une liste**, sur l'ensemble des clients, cautions et bénéficiaires effectifs. Le rafraîchissement est régulier (paramètre ; défaut : quotidien) ; chaque liste porte sa date de dernière mise à jour. Une correspondance possible **bloque** le client (ni octroi, ni décaissement ; remboursements et dépôts jamais refusés) et ouvre une revue par la conformité. La décision (faux positif ou vrai) est motivée et journalisée. Le gel éventuel de fonds est une décision de l'IMF, exécutée dans le cœur. [ASSUMPTION : sources de listes et fréquence : à valider ; Prospera n'en choisit pas pour l'IMF. Le filtrage est un calcul sur des listes fournies, sans modèle.]

**Conséquences (testables) :**
- Un client déjà actif dont le nom apparaît dans une liste mise à jour est signalé dans l'heure qui suit le rafraîchissement (paramètre), sans nouvelle saisie.
- Le tableau de conformité affiche, par liste, la date de dernier rafraîchissement ; une liste plus ancienne que sa fréquence par défaut passe en alerte.
- Un client « correspondance possible » ne peut pas être décaissé ; un remboursement le concernant est encaissé normalement.
- Un faux positif levé n'est pas re-signalé pour la même entrée de liste, mais l'est pour une nouvelle entrée.

#### FR-122 : Le KYC est revu périodiquement

Chaque fiche a une **date de prochaine revue** selon son niveau (paramètre ; défauts : renforcé 12 mois, standard 24 mois, simplifié 36 mois) [ASSUMPTION : durées à faire valider par la conformité de l'IMF]. À l'approche de l'échéance, la fiche entre dans la **file de revue** du CC ou de l'agent de conformité : pièces expirées à renouveler, identité, activité et contacts à reconfirmer, notation de risque recalculée. Une revue en retard met le KYC à « à renouveler ». Un KYC à renouveler **bloque un nouvel octroi et un nouveau décaissement**, jamais un remboursement ni un dépôt. Un client qui revient pour un nouveau cycle de crédit passe par la revue avant l'octroi.

**Conséquences (testables) :**
- Une fiche en « renforcé » validée il y a 12 mois entre dans la file de revue ; sans revue 30 jours après (paramètre), elle passe à « à renouveler ».
- Le tableau de bord de conformité (RA, DG, auditeur) montre le nombre de revues en retard par agence.
- Une revue terminée remet la date de prochaine revue ; l'historique des revues est conservé.
- Un client « à renouveler » peut encore déposer et rembourser.

#### FR-123 : Les seuils CENTIF alertent, l'IMF déclare hors Prospera

Prospera surveille les opérations qu'il voit (collecte espèces, dépôts, remboursements en espèces, et celles que le cœur lui remonte) par rapport à des **seuils paramétrables** : seuil de déclaration des transactions en espèces (défaut : 15 000 000 FCFA, loi uniforme LBC/FT/FP art. 72 selon une source secondaire ; Décision n° 021 du 21/12/2023/CM/UMOA ; **à confirmer par un juriste**) et seuil d'alerte interne sur le **cumul d'opérations fractionnées** par client sur une période (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 80 % du seuil sur 7 jours). Le dépassement crée une alerte pour l'agent de conformité ; Prospera produit un **export de déclaration** ; la déclaration à la CENTIF est faite par l'IMF, hors Prospera (décision E3).

**Conséquences (testables) :**
- Un client dont les collectes sur 7 jours atteignent 80 % du seuil crée une alerte ; une alerte traitée a un motif de clôture.
- L'export contient, pour chaque opération signalée : client, identifiant du cœur, montant, date, canal, collecteur.
- Aucun bouton ne prétend déclarer à la CENTIF : la déclaration est « hors Prospera ».

#### FR-124 : Le score du client et la notation de risque LBC sont explicables, avec leur provenance

Le score /100 est **dynamique** : il est recalculé quand le dossier devient complet et à chaque événement qui change ses facteurs (mouvement du cœur, collecte, visite). Chaque client a une **notation de risque LBC** (faible, moyen, élevé) calculée par règles lisibles (PPE, secteur, pays, niveau de KYC, volumes inhabituels), et un **score de crédit /100** fourni par le module Risque de l'IA commune ; tant que son modèle n'existe pas, un score par règles explicables (v0) le remplace. La fiche affiche, pour chaque note : la valeur, les facteurs avec leur poids, la **provenance** (règle ou modèle, version, date). Le moteur est l'IA commune (famille de modules à part). Sans elle, l'emplacement du score affiche la règle v0 ou « indisponible » ; rien d'autre ne casse. L'humain décide toujours. [ASSUMPTION : barème du score v0 = paiement 40, capacité 30, activité 20, terrain 10 (recommandation C11 du PO) ; il est défini et versionné par la partie 1 et le module Risque.]

**Conséquences (testables) :**
- Un client dont le score vient de la règle v0 affiche « règle, version, date » ; un client scoré par le modèle affiche « modèle, version, date ».
- Retirer le consentement à l'IA commune (FR-132) ou ne pas l'installer laisse la fiche fonctionnelle : le score est celui de la règle v0.
- Aucun octroi, rejet ou blocage n'est décidé par la note seule ; la note est une information et un motif de revue.

#### FR-125 : La probabilité de défaut et la classe BCEAO estimée se recalculent à chaque événement

Pour chaque client ayant un crédit en cours, la fiche affiche une **probabilité de défaut (PD)** en pourcentage et une **classe BCEAO estimée** (saine, à surveiller, en souffrance, selon les règles de classement : déclassement dès un impayé, provisions et seuils du module de risque, partie 3b). **Entrées :** score (FR-124), comportement de paiement et retards lus du cœur, mouvements d'épargne lus du cœur, secteur et saison, collectes du terrain. **Sortie :** PD, classe estimée, **facteurs** avec leur poids, date de calcul. Le calcul se refait dans les **15 minutes** (paramètre) qui suivent un événement (nouveau mouvement du cœur, collecte, retard). La classe **officielle** reste celle du cœur ; en cas d'écart, la classe du cœur gagne et l'écart est signalé au GP. Destinataires : GP, CC, RA, analyste risque, ROC. Réalise UJ-1.

**Conséquences (testables) :**
- Un paiement du cœur qui solde une échéance en retard met à jour la PD et la classe estimée sur la fiche dans le délai du paramètre.
- La classe estimée affiche « estimée » ; la classe officielle du cœur s'affiche à côté quand elle est disponible, et un écart crée un signal au GP.
- Tant que le modèle n'existe pas, PD et classe viennent de règles explicables et le libellé dit « règle », sans le mot « IA ».
- Aucune PD ni classe estimée ne bloque ni ne décide un octroi, un décaissement ou une provision comptabilisée.

#### FR-126 : L'IA alerte sur les signaux faibles d'un client

Pour les clients actifs, l'IA commune repère les **signaux faibles** avant l'impayé : paiements de plus en plus tardifs sans retard franc, baisse des dépôts d'épargne, collectes qui s'espacent, visites sans réponse, activité en difficulté à la saison, secteur en tension. **Entrées :** historique de paiement et d'épargne (cœur), visites et collectes (terrain), secteur et saison. **Sortie :** une **alerte** au GP du client (copie au CC et au RA) avec le ou les signaux, leur intensité, les dates, et une **action suggérée** (appel, visite). Le seuil d'alerte est un paramètre calibré sur les données de l'IMF (décision E5 ; défaut de démo : intensité ≥ 0,7 sur 1). Réalise UJ-4.

**Conséquences (testables) :**
- Un client dont les 3 derniers paiements sont à J+1, J+2, J+4 sans retard à 7 jours déclenche une alerte « glissement des paiements ».
- L'alerte est traitée par un humain (suivie, ou classée sans suite **avec un motif**) ; ce motif est renvoyé comme correction à l'IA commune.
- Une alerte ne change aucun statut du dossier et ne déclenche aucune relance seule.
- Sans IA commune, aucune alerte de signaux faibles : les alertes de retard ordinaires de la partie 4a continuent.

#### FR-127 : Chaque fiche porte une analyse par secteur, micro et macro-économique

La fiche d'un client (et l'analyse d'un dossier, partie 2) affiche une **analyse étendue** produite par l'IA commune, en **deux niveaux** : **micro** (flux et transactions du client, comportement de remboursement et d'épargne, activité, saisonnalité de son secteur, recouvrement passé) et **macro** (inflation, prix des produits de son secteur, conjoncture, saturation du secteur dans sa zone, **concentration du portefeuille de l'IMF par secteur**). Le **secteur d'activité** (FR-117) est la clé de ces analyses. **Sortie :** pour chaque indicateur, une valeur, une tendance, une phrase d'explication, la **source**, la date, la provenance (règle ou modèle, version). Destinataires : CC (instruction), ROC, comité, GP, RA, DG, analyste risque. Réalise UJ-1.

**Conséquences (testables) :**
- Pour un client du secteur « commerce de détail », l'analyse montre la saisonnalité du secteur et sa concentration dans le portefeuille (par exemple 38 % de l'encours).
- Chaque indicateur macro affiche sa source et sa date ; un indicateur plus ancien que sa fréquence (paramètre) est marqué « périmé ».
- Seules les données de clients ayant donné le consentement « IA commune » (FR-132) alimentent l'apprentissage ; l'analyse **du client lui-même** s'affiche sans ce consentement, car elle n'envoie rien hors de l'IMF.
- L'analyse étendue est une **information** : aucune décision n'en dépend sans un humain. Sans IA commune, la section affiche « analyse indisponible » et le dossier avance.

#### FR-128 : La carte montre les zones à risque et suggère où prospecter

Le RCC, le RA, le DG et le commercial voient une **carte de couverture** : clients cartographiés (positions consenties), zones colorées par **niveau de risque** (PAR, retards, signaux faibles : FR-126), zones **sous-couvertes** et **vierges**. L'IA commune **suggère des zones de prospection** : pour chaque zone proposée, le **secteur d'activité** dominant sans concurrent saturé, le nombre de prospects potentiels, la raison, la confiance. **Entrées :** positions et secteurs des clients, PAR par zone, zones du réseau, saturation du secteur, couverture de terrain. **Sortie :** carte et liste classée de zones. L'affectation d'un agent à une zone est une décision humaine, dans le réseau (module `reseau`). Réalise UJ-4.

**Conséquences (testables) :**
- Une zone avec 40 clients sur 100 attendus et aucun agent affecté est proposée comme « sous-couverte », avec la raison.
- Les clients sans consentement de géolocalisation (FR-132) n'apparaissent pas sur la carte.
- Cliquer sur une zone proposée ouvre la liste des prospects et propose d'affecter un agent ; l'affectation passe par la décision du RCC ou du RA.
- Sans IA commune, la carte affiche les clients et le PAR de la zone ; il n'y a ni suggestion ni confiance.

#### FR-129 : Un groupe solidaire est un client collectif, et sa vie est tracée

Un **groupe solidaire** est une fiche de client collectif (décision T1, groupes au jour 1) : nom, agence, agent, **5 à 30 membres** (paramètres, décision C14), un président et un trésorier, un calendrier de réunions, une **caution mutuelle** entre les membres. Chaque membre a sa **fiche individuelle** et son **KYC propre** : un groupe ne contourne pas la vérification d'une personne. Le **compte du groupe** (épargne et crédit) et son solde sont ceux du cœur (client collectif au cœur) ; Prospera tient la composition, les rôles, les réunions et la caution. Réalise UJ-2.

Ajouter, retirer ou exclure un membre, changer le président ou le trésorier, planifier et tenir une réunion (lieu, présents, décisions) sont des actes enregistrés. Retirer un membre qui a un crédit en cours **n'efface pas son engagement** : il reste redevable ; le retrait est refusé tant que son prêt n'est pas soldé ou repris par décision du comité. Les **tontines** (cotisation rotative, tirage au sort, redistribution) sont **« bientôt »** : aucun écran de tontine ne simule un effet.

**Conséquences (testables) :**
- Créer un groupe de 4 membres ou de 31 membres est refusé avec les bornes.
- Un groupe dont un membre a un KYC non COMPLET ne peut pas déposer de demande de crédit de groupe (partie 2) ; le membre en cause est listé.
- Un membre n'appartient pas à deux groupes à crédit actif en même temps (paramètre ; défaut : un seul).
- La fiche du groupe liste, par membre, rôle, cotisation, statut, retard, pour lecture ; la balance âgée du groupe est la somme de celles de ses membres (PRD-D §6.0).
- Un membre sorti d'un groupe avec un prêt actif reste lié à son prêt et à la caution mutuelle jusqu'au solde.
- Chaque réunion enregistre présents et décisions ; une décision de décaissement de groupe cite le dossier.
- Les boutons « Tirage au sort » et « Créer une tontine » portent « bientôt ».
- L'historique de composition est consultable (qui est entré, sorti, quand, par qui).

#### FR-130 : L'épargne se lit du cœur, sur la fiche, avec sa date

La fiche d'un client (et celle d'un groupe) affiche ses **comptes d'épargne lus du cœur** : numéro, produit, statut (actif, dormant, bloqué), solde, dernier mouvement, et la liste des mouvements (dépôts, retraits, intérêts, frais, avec canal). Chaque valeur porte **« à jour au »** (date et heure de la dernière lecture). Prospera n'écrit ni solde ni mouvement. Si le cœur est injoignable, la fiche affiche le dernier état connu, daté, avec « cœur injoignable » ; elle ne l'invente jamais. La **dormance** se constate sur le dernier mouvement du cœur, avec le délai du produit (FR-106) ; Prospera peut relancer le client dormant. Dans la démo, le cœur fictif sert ces lectures. Réalise UJ-1.

**Conséquences (testables) :**
- Un dépôt passé au cœur apparaît sur la fiche à la lecture suivante, avec le nouveau solde et « à jour au ».
- Cœur coupé : la fiche reste ouverte avec le dernier solde, la date de sa lecture et un bandeau.
- Aucun écran du module ne permet de corriger un solde ou un mouvement ; la page « Ouvrir compte » est une demande envoyée au cœur (FR-106) ou « bientôt ».
- Un client sans compte d'épargne n'affiche pas de zéro : il affiche « aucun compte ».

#### FR-131 : Les analyses d'épargne repèrent les dormants, recommandent un produit et notent la fidélité

À partir des comptes **lus du cœur** (FR-130), l'IA commune produit trois sorties pour le **GP, le RA, le collecteur et le DG** : (1) les **comptes dormants** (inactivité selon le délai du produit, FR-106) avec leur potentiel ; (2) une **recommandation de produit d'épargne** selon le profil (par exemple un dépôt à terme pour un client qui laisse un solde stable) ; (3) un **score de fidélité** 0-100 par client, avec ses facteurs (régularité des dépôts, ancienneté, usage de plusieurs produits). L'IA ne modifie aucun compte. Une relance de dormant est **proposée** ; un humain l'envoie.

**Conséquences (testables) :**
- Un compte à vue sans mouvement depuis le délai du produit apparaît dans la liste des dormants avec la date du dernier mouvement du cœur.
- Le score de fidélité affiche ses facteurs et « règle ou modèle, version, date ».
- Un client sans compte d'épargne n'apparaît dans aucune de ces trois sorties.
- Sans IA commune, la liste des dormants est calculée par la règle du délai (sans potentiel ni recommandation) ; le score de fidélité s'affiche « indisponible ».

#### FR-132 : Les consentements sont horodatés, par finalité, et retirables

La fiche porte des **consentements** distincts : **données personnelles** (traitement par l'IMF, obligatoire à la création), **géolocalisation** (position du client, de l'agent en visite de ce client), **IA commune** (envoi de données structurées, dont le secteur d'activité, à la famille IA commune), **marketing** (partie 4b), **consultation du bureau de crédit** (BIC, saisie manuelle au jour 1 : décision C18). Chaque consentement a sa date, son recueil (preuve : signature ou case cochée par l'agent avec photo/horodatage), sa version de texte, et son retrait. **Aucune donnée ne part vers l'IA commune sans le consentement de la finalité** (apprentissage fédéré du moteur d'installation). Le retrait d'un consentement arrête l'usage futur et n'efface pas ce que la loi impose de conserver. [ASSUMPTION : durées de conservation et texte des consentements à faire valider par l'IMF et un juriste ; hébergement local par pays : non établi.]

**Conséquences (testables) :**
- Une fiche sans consentement « données personnelles » ne se convertit pas.
- Un client sans consentement « IA commune » : aucune de ses données n'est dans le lot envoyé à l'IA commune (test sur le lot).
- Retirer la géolocalisation efface la position de la fiche (FR-118) et empêche de nouvelles positions pour ce client.
- Chaque consentement liste, sur la fiche : finalité, date, version du texte, état.

#### FR-133 : Qui voit quelle fiche, et ce qui est journalisé

Chaque rôle lit les fiches de son périmètre : le DG tout le réseau ; le RA son agence ; le CC ses dossiers en instruction et son agence ; le GP les clients de son portefeuille ; l'agent terrain, le commercial et le collecteur leur zone et leurs clients ; l'auditeur tout, en lecture seule. **ADMIN_IMF ne lit pas les données métier** (partie 1). Tout accès à une fiche, toute modification et toute consultation d'une pièce sont **journalisés** (qui, quand, quoi) ; l'auditeur lit le journal. Le masquage affiche une pièce ou un numéro seulement à qui en a besoin. La piste d'audit et les pièces sont conservées **au moins 10 ans** (Instruction n° 017-12-2010) ; l'effacement ne s'applique pas à ce qui doit être conservé. Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Un collecteur ne peut pas ouvrir, par l'URL, la fiche d'un client hors de sa zone.
- L'auditeur voit, pour une fiche, la liste des accès avec auteur et heure ; il ne peut rien modifier.
- ADMIN_IMF ne voit ni identité, ni pièce, ni solde d'un client.
- La demande d'un client d'accéder à ses données ou de les rectifier est une action tracée (qui l'a traitée, quand).

#### FR-134 : Hors ligne, la fiche, les visites et la demande en brouillon marchent ; jamais la décision

L'application terrain (Flutter, comme PRD-D FR-109) permet hors connexion : créer un prospect, compléter une fiche, prendre photos et position, saisir une visite, enregistrer une collecte (6.3), simuler un crédit (FR-109) et préparer une **demande en brouillon** (décision T2). Sont **interdits hors connexion** : valider le KYC, valider une pièce, lever une correspondance de sanctions, soumettre un dossier pour décision, toute décision de crédit. Chaque élément en file porte une **clé d'idempotence** et l'**heure de l'appareil** ; l'état de synchronisation est visible (à envoyer, envoyé, confirmé, refusé avec motif) ; le serveur seul juge, l'heure du serveur fait foi (PRD-D FR-101, FR-104, FR-109). Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Sans réseau, un agent crée trois prospects, une fiche avec photos et un brouillon de demande ; à la reconnexion les cinq arrivent, aucun en double si la synchronisation est relancée.
- Hors réseau, le bouton « soumettre pour décision » et le bouton « valider le KYC » sont désactivés avec « en ligne seulement ».
- Un brouillon en file depuis plus de 7 jours alerte l'agent (paramètre).
- Une fiche modifiée sur l'appareil et au bureau est signalée en conflit à la synchronisation : le serveur ne choisit pas en silence, la fiche passe dans la file du CC.

### 6.3 Collecte terrain (`collecte`, M16) ★

**Dans la démo.** Il n'y a **aucun écran de saisie d'un encaissement terrain** hors API : la visite n'a pas de champ « montant collecté ». La démo affiche des agrégats de collecte (jour, mois, objectif) et crédite « le solde client » à la validation, ce qui doublonne le cœur. Les chiffres de la file hors ligne se contredisent (165 000 contre 120 000). Rien n'est vraiment mis en file : le bouton « Synchroniser » attend 1,5 s.

**Ce que ça veut dire.** Le collecteur ramasse de l'argent chez des clients : remboursements d'échéances et dépôts d'épargne. Prospera **enregistre le geste** (qui, quoi, combien, où, quand, preuve), **remet un reçu**, **renvoie au cœur** ; le cœur fait foi pour l'imputation, le solde et l'écriture (décisions A1, A5, A8). La collecte reste « déclarée » tant que le cœur ne l'a pas confirmée. Les collectes de tontine (cotisation rotative) sont **« bientôt »**. Le noyau Terrain de PRD-D §6.1 fournit la visite, la tournée, la position et la remise d'espèces ; ce module y ajoute l'argent collecté du côté IMF.

#### FR-135 : Le collecteur enregistre un remboursement ou un dépôt d'épargne et remet un reçu

Le collecteur (COLL), ou l'agent terrain, enregistre pour un client de sa zone : le **type** (remboursement d'une échéance de prêt, dépôt d'épargne), le **montant**, le **canal** (espèces, Mobile Money : FR-140), la date et l'heure, la position (si consentie, FR-118) et le **compte ou l'échéance visés**. Un remboursement vise l'échéance due du prêt EN_GESTION du client (lue du cœur) ; un dépôt vise un compte d'épargne du client (lu du cœur). L'enregistrement est un geste de Prospera : il ne crée ni ne modifie aucun solde. Réalise UJ-4.

Le client reçoit un **reçu** à chaque collecte : papier et/ou SMS selon ses contacts, avec numéro, date, montant, type, agent, compte ou échéance. Le reçu est **numéroté sans trou par collecteur** ; il est marqué « provisoire » tant que le cœur n'a pas confirmé, puis le client peut recevoir la confirmation. Un reçu n'est jamais supprimé : une erreur se corrige par une collecte d'annulation justifiée (FR-139).

**Conséquences (testables) :**
- Un collecteur ne peut enregistrer une collecte que pour un client de sa zone et de ses clients de collecte.
- Un montant nul ou négatif est refusé ; un remboursement supérieur au restant dû est accepté (le surplus devient un crédit du client : règle de la partie 2) et signalé.
- Après l'enregistrement, le solde du client affiché reste celui du cœur jusqu'à la confirmation (FR-137).
- Un client dont le KYC est « à renouveler » ou en correspondance de sanctions peut rembourser et déposer ; la collecte est acceptée (FR-121, FR-122).
- Le numéro de reçu est continu pour un collecteur ; hors ligne, il est attribué sur l'appareil à partir d'une plage réservée (paramètre).
- Un reçu affiche « provisoire » tant que la collecte n'est pas confirmée.
- Le client qui conteste présente son reçu ; le GP retrouve la collecte par son numéro en moins de 3 clics.

#### FR-136 : La collecte marche hors ligne, sans doublon et sans changer de solde

Hors connexion, la collecte est une action de la file de l'appareil, avec une **clé d'idempotence** unique par encaissement et l'heure de l'appareil. À la reconnexion, le serveur la reçoit une fois, quel que soit le nombre de renvois, et juge : accepter ou **refuser avec motif**. **Les soldes ne changent pas tant que la collecte n'est pas confirmée par le cœur.** Les collectes de la file sont envoyées avant les visites ; un lot de 50 collectes se synchronise en moins de 30 secondes (paramètre de test). Réalise UJ-4.

**Conséquences (testables) :**
- Le renvoi de la même collecte (réseau instable) n'en crée pas une seconde, même si l'envoi est répété 5 fois.
- La file affiche, pour chaque collecte, l'état : à envoyer, envoyée, confirmée, refusée avec motif.
- Un collecteur dont l'appareil est perdu est déconnecté à distance ; la file est envoyée avant l'effacement (PRD-D FR-110).
- Une collecte de plus de 7 jours dans la file alerte le collecteur et le RA (paramètre).

#### FR-137 : La collecte est rattachée à une échéance et renvoyée au cœur

Prospera propose le rattachement : l'échéance due la plus ancienne, avec l'ordre d'imputation **pénalités, intérêts, capital** (paramétrable ; décisions A4, A5). Un paiement **anticipé** réduit la durée (règle de la partie 2) ; le **trop-perçu** devient un crédit du client. L'imputation **officielle** est celle du cœur ; en cas d'écart entre la proposition de Prospera et celle du cœur, **le cœur gagne** et l'écart est signalé au GP. Les pénalités et intérêts de retard sont calculés par le cœur (le cœur fictif dans la démo) ; Prospera les lit. Réalise UJ-4.

Chaque collecte suit les états : DECLAREE (enregistrée), ENVOYEE (transmise au cœur), CONFIRMEE (mouvement du cœur reçu), REFUSEE (le cœur la rejette, avec motif). Prospera tire toujours ; aucun port n'est ouvert chez l'IMF (décision A10). **Si le cœur sait recevoir** un remboursement ou un dépôt, Prospera l'envoie comme « paiement à comptabiliser » ; **sinon**, Prospera produit la liste **« à saisir dans le cœur »** (par agence et par jour, exportable) et attend le mouvement du cœur pour confirmer (décision A1, « si possible »). Le contrat d'échange est en 6.5.

**Conséquences (testables) :**
- Une collecte de 30 000 FCFA sur une échéance en retard avec pénalité 2 000, intérêts 8 000, capital 25 000 est proposée : pénalité 2 000, intérêts 8 000, capital 20 000.
- Quand le cœur répond une autre imputation, la collecte affiche l'imputation du cœur et un signal « écart d'imputation » au GP.
- Le restant dû affiché au collecteur est celui du cœur, avec « à jour au ».
- Un cœur en panne : les collectes restent DECLAREE ou ENVOYEE ; rien n'est perdu ; à son retour elles partent, sans doublon (clé d'idempotence).
- Un cœur qui ne sait pas recevoir : la liste « à saisir dans le cœur » du jour contient chaque collecte DECLAREE, avec client, identifiant du cœur, montant, canal, collecteur, numéro de reçu ; une collecte quitte la liste quand le mouvement du cœur la confirme.
- Une collecte confirmée n'est plus modifiable.
- Une collecte REFUSEE par le cœur apparaît dans la file du comptable et du GP avec le motif.

#### FR-138 : Le collecteur remet les espèces au guichet, contre une remise contresignée

Le collecteur **remet** au guichet de l'agence (comptable-caissier, CPT) les espèces collectées. La remise liste les collectes concernées (ou le total), est **comptée par le CPT** et **contresignée** : la remise a un montant déclaré par le collecteur, un montant compté par le CPT, et un écart (FR-145). Une collecte en espèces n'est « remise » que lorsque la remise qui la porte est contresignée. L'entrée d'argent au guichet (dépôt ou remboursement au guichet) est ensuite une opération du cœur, saisie par le CPT ; Prospera la lit (6.4). Réalise UJ-4.

**Conséquences (testables) :**
- Le collecteur ne peut pas contresigner sa propre remise.
- Une remise dont le montant compté diffère du montant déclaré crée un écart nommé, avec les deux montants.
- Une collecte en espèces non remise depuis plus de 1 jour (paramètre) apparaît dans la liste « espèces non remises » du RA.
- La remise est possible en ligne seulement (le CPT compte ; il n'y a pas de remise hors ligne).

#### FR-139 : La collecte est rapprochée du cœur et de la remise, et se corrige par contre-passation

Le **rapprochement** compare, pour chaque jour et chaque collecteur : les collectes enregistrées, les remises contresignées, et les mouvements du cœur. Les écarts : collecte sans mouvement du cœur (en attente), mouvement du cœur sans collecte, montants différents. Un paiement Mobile Money est rattaché à l'échéance **automatiquement** si |payé − échéance| ÷ échéance < 1 % ; sinon il entre dans la **file de rapprochement du comptable** ; **aucun paiement reçu n'est refusé** (décision A6). Les **doublons** (même client, même montant à ± 100 FCFA, fenêtre de 5 minutes : paramètres) sont signalés et bloquent la validation automatique. Réalise UJ-4.

Une collecte confirmée ne se modifie pas. Une erreur de montant ou de client se corrige par **annulation** (collecte inverse) et nouvelle collecte, avec **motif obligatoire**, validées par le RA ; l'annulation est envoyée au cœur selon l'état (FR-137). Avant la confirmation du cœur (état DECLAREE), le collecteur peut corriger avec un motif tant que la remise n'est pas contresignée.

**Conséquences (testables) :**
- Un paiement de 49 800 FCFA pour une échéance de 50 000 (écart 0,4 %) est rattaché sans intervention ; un paiement de 45 000 va dans la file du comptable.
- Deux collectes du même client, 30 000 FCFA et 30 050 FCFA, à 3 minutes d'écart sont signalées comme doublon possible ; la seconde n'est pas validée automatiquement.
- L'écran de rapprochement liste les écarts ouverts avec leur ancienneté ; l'écart résolu a un motif et un auteur.
- Une annulation sans motif est refusée.
- La collecte annulée et sa correction restent visibles toutes deux, reliées.
- Un collecteur ne peut pas annuler une collecte déjà remise ; le RA le peut.
- Le nombre d'annulations par collecteur et par semaine est visible du RA (signal, pas de blocage).

#### FR-140 : Un paiement Mobile Money collecté attend la validation du comptable

Un paiement Mobile Money d'un client, déclaré par l'agent ou rattaché à un lien de paiement, est **EN_ATTENTE** : le solde n'est pas touché et la collecte n'est pas confirmée tant que le CPT n'a pas validé (décision A7). Le CPT vérifie sur la console de l'opérateur (montant, numéro, référence), puis **valide** ou **rejette avec un motif choisi dans une liste et un texte**. Un paiement **PI-SPI** (irrévocable, confirmé par le fournisseur) **ne demande pas** de validation du comptable ; un virement sans référence, oui. Le déclarant ne valide jamais son propre paiement (PRD-D FR-104). L'opérateur est une donnée **par pays** (pas une énumération à deux valeurs) ; les banques passent par PI-SPI (PRD paiement). Les règles du fournisseur et du rapprochement relèvent de `paiement` (PRD-D §7.5). Réalise UJ-4.

Le CPT dispose d'une **file des paiements Mobile Money en attente** (FR-140) de son agence : par transaction, montant, numéro, référence, collecteur, client ; **Valider** ou **Rejeter** (motif choisi et texte). Un paiement en attente depuis plus de 24 heures (paramètre) apparaît en tête et alerte le RA. La file à zéro est une étape de la clôture de l'agence (côté cœur). Le CPT ne valide pas un paiement qu'il a lui-même déclaré.

**Conséquences (testables) :**
- Un paiement Mobile Money déclaré par le collecteur reste EN_ATTENTE ; après la validation du CPT, il passe à DECLAREE puis part au cœur.
- Un rejet sans motif est refusé ; l'agent est prévenu avec le motif.
- Un paiement PI-SPI confirmé par le fournisseur passe sans validation du comptable.
- Changer de pays ou d'opérateur dans la configuration ne demande aucun changement du module.
- Valider un paiement le fait passer DECLAREE et le met en route vers le cœur ; rejeter envoie le motif à l'agent.
- Un paiement en attente à 25 heures est en tête de file.
- La file d'un CPT ne contient que les paiements de son agence.

#### FR-141 : Le plan de collecte du jour est préchargé sur l'appareil

Chaque soir, la tournée du lendemain est préparée à partir de l'**échéancier** (lu du cœur) : échéances du jour et J-3, retards triés par priorité (retards, échéances J-3, prospects), promesses de paiement du jour, dépôts d'épargne attendus des clients de collecte (PRD-D FR-173 pour le patron). Le plan est **chargé sur l'appareil** avant le départ ; il se consulte et se complète hors ligne. Le collecteur voit pour chaque client : le dû du jour (avec « à jour au »), les retards, la dernière promesse, le canal préféré. Réalise UJ-4.

**Conséquences (testables) :**
- Un plan de 25 clients se charge avant le départ et reste lisible sans réseau.
- Un client dont la promesse est datée d'aujourd'hui est en tête avec la mention.
- Après la collecte, la ligne du plan passe à « collectée » avec l'état de synchronisation.
- Le plan n'affiche jamais un solde « en direct » : il affiche la dernière lecture du cœur avec sa date.

#### FR-142 : L'IA propose les priorités de la journée du collecteur

En préparant le plan du jour (FR-141), l'IA commune propose un **ordre de visite** avec le **motif de chaque priorité**. **Entrées :** échéances du jour et J-3, retards, promesses de paiement, score et PD (FR-125), signaux faibles (FR-126), secteur et saison, distance entre les clients. **Sortie :** liste ordonnée, motif court par client (« promesse du jour non confirmée »), gain de distance estimé. L'ordre est préchargé sur l'appareil avec le plan, utilisable hors ligne. Le collecteur peut **réordonner** ; il n'a aucun motif à donner. Réalise UJ-4.

**Conséquences (testables) :**
- Un client avec une promesse du jour et un retard de 10 jours passe avant un client à J-3 sans retard.
- L'ordre affiche « règle ou modèle, version, date » ; le collecteur qui réordonne enregistre le changement (pour mesurer, pas pour contrôler).
- IA commune absente : l'ordre est celui de la règle de base (retards, puis échéances J-3, puis prospects) ; la tournée n'est pas retardée.

### 6.4 Caisse des collecteurs (`caisse`, M14)

**Dans la démo.** `/caisse` est en lecture seule pour le DAF, le RA et le DG : position par agence, flux, clôtures, rapprochement Mobile Money, virements entre agences. Les statuts et écarts de clôture sont écrits en dur ; il n'y a aucun bouton de saisie du comptage physique ; le « Rejeter » d'un paiement Mobile Money envoie un motif fixe. Le glossaire parle de rapprochement avec « la comptabilité Prospera » alors que la comptabilité officielle est celle du cœur.

**Ce que ça veut dire.** Deux caisses existent, et elles n'ont pas le même maître (décision A8). La **caisse du guichet** de l'agence (espèces, banque, float Mobile Money, clôture comptable, écart) est **au cœur** : Prospera la **lit**. La **caisse des collecteurs** est à **Prospera** : l'argent ramassé sur le terrain, qui n'est dans la caisse du guichet qu'une fois remis. Ce module tient les fonds de caisse des agents, la clôture du jour et l'alerte d'écart. Dans la démo, le cœur fictif tient la caisse du guichet. PRD-D §6.0 écarte la caisse de guichet du noyau ; elle n'est donc couverte par aucun module partagé. L'argent compté, lui, reste celui du cœur dès qu'il entre au guichet.

#### FR-143 : Le collecteur a un fonds de caisse tracé et une position visible

Un collecteur peut recevoir un **fonds de caisse** (monnaie pour rendre, avance de déplacement) remis par le guichet : montant, date, remettant, bénéficiaire, contresignature. Un plafond de détention par collecteur (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 100 000 FCFA) limite ce qu'il porte. Alimenter ou prélever un fonds exige la trace du **DG ou du DAF** (cahier de la démo). Le fonds du collecteur n'est pas une caisse du guichet : le mouvement d'argent entre le guichet et le collecteur est aussi une opération du cœur, saisie par le CPT ; Prospera la lit. [ASSUMPTION : le plafond de détention et le montant de démo sont des valeurs de départ ; ils sont calibrés sur les données de l'IMF après la reprise.] Réalise UJ-4.

Pour chaque collecteur, la journée affiche : fonds de caisse, **espèces collectées**, **remises contresignées**, et le **détenu** (fonds + collecté − remis). Le détenu dépasse un plafond d'alerte (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 500 000 FCFA) : alerte au collecteur et à son RCC (ramener l'argent au guichet). La position se calcule sur les collectes enregistrées, y compris celles de la file hors ligne **une fois synchronisées** ; elle porte l'état de synchronisation.

**Conséquences (testables) :**
- Un fonds au-dessus du plafond est refusé à l'attribution.
- Le collecteur ne peut pas s'attribuer son propre fonds.
- L'historique d'un fonds liste les attributions, retours, auteur et date.
- Après 3 collectes de 200 000 FCFA sans remise, le détenu est de 600 000 FCFA + fonds ; l'alerte part.
- Hors ligne, le collecteur voit sa position locale avec « non synchronisée » ; le serveur la recalcule à la reconnexion.
- Une collecte Mobile Money n'entre pas dans les espèces détenues.

#### FR-144 : La clôture du jour est une étape obligatoire du collecteur

À la fin de sa journée, le collecteur **clôture** : toutes ses collectes sont synchronisées, les espèces collectées sont **remises** (FR-138) ou **justifiées** (conservées avec un motif et un accord du RA), le CPT a **compté et contresigné**. La clôture a un statut : OUVERTE, VALIDEE (écart nul ou accepté), ECART. La clôture d'une journée précédente **non faite** bloque l'ouverture de la journée suivante du collecteur (paramètre ; défaut : bloque après 1 jour). Un rapport du soir synthétise collecté, remis, détenu, écart (heure paramétrable ; défaut de démo : 18 h 00). Réalise UJ-4.

**Conséquences (testables) :**
- Un collecteur avec une collecte non synchronisée ne peut pas clôturer : l'écran liste celles qui manquent.
- Un collecteur sans remise et sans motif ne peut pas clôturer.
- Le lendemain, un collecteur avec une clôture ouverte la veille voit « clôture d'hier à faire » ; sa tournée ne s'ouvre pas avant (sauf dérogation du RA).
- Une clôture VALIDEE est verrouillée ; une correction passe par FR-139.

#### FR-145 : L'écart de caisse alerte, avec des seuils calibrés sur l'IMF, et les clôtures se pilotent

À la clôture, l'écart est **le montant déclaré par le collecteur (collecté − remis) moins le montant compté par le CPT**. Un écart non nul est enregistré avec les deux montants. Au-dessus d'un **seuil d'alerte** (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 5 000 FCFA, valeur du cahier pour la détection d'espèces), l'alerte part au **RA**, au **DAF** et à l'**auditeur** (AUD). Un écart est **résolu** avec un motif (erreur de comptage, perte, vol, ajustement) et un auteur (RA ou DAF) ; la perte ou le vol alimente l'historique du collecteur. Les seuils sont **proposés** à partir des données de l'IMF après la reprise, **validés par un humain** (DAF ou DG), et recalculés périodiquement (décision E5). Réalise UJ-4.

Un tableau liste, par agence et par collecteur : clôtures du jour (OUVERTE, VALIDEE, ECART), écarts ouverts et leur ancienneté, espèces détenues, espèces non remises depuis plus de 1 jour, nombre d'annulations de collecte. Le RA agit sur son agence ; le DAF et le DG voient le réseau ; l'auditeur lit en lecture seule avec le journal. Descente : réseau, région, agence, collecteur, collecte.

**Conséquences (testables) :**
- Collecté-remis déclaré 450 000, compté 441 000 : écart 9 000 > 5 000 : alerte au RA, au DAF et à AUD.
- Un écart de 2 000 est enregistré mais ne déclenche pas d'alerte à AUD.
- Trois écarts non résolus d'un même collecteur en 30 jours (paramètre) créent une alerte de récurrence au RCC.
- Un écart résolu garde son historique ; il n'est jamais effacé.
- Un seuil proposé par le recalcul ne s'applique qu'après validation du DAF ou du DG.
- Le tableau du DAF montre toutes les agences ; celui du RA, la sienne.
- Cliquer sur un écart ouvre les deux montants, le collecteur, le CPT, la date et le motif.
- Le tableau se recharge en moins de 5 secondes après une clôture.

#### FR-146 : La caisse du guichet se lit du cœur ; ce qui reste « bientôt »

Prospera affiche, pour chaque agence, la **caisse du guichet lue du cœur** : solde théorique de caisse du jour, flux du jour (dépôts, retraits, remboursements, décaissements), clôture et son écart, solde du compte de l'opérateur Mobile Money s'il est fourni. Chaque valeur porte « à jour au ». Le DAF voit la position du réseau, le RA son agence, le CPT son guichet, le DG et l'auditeur en lecture. **Prospera ne saisit ni ne corrige** une opération de guichet : le dépôt, le retrait, le décaissement espèces et la clôture comptable sont faits **dans le cœur**. Le **décaissement en espèces** est un ordre de Prospera, autorisé par le CPT ou le DAF, exécuté par le cœur (décision A3) ; son exécution se lit ici. Si le cœur est injoignable : dernière valeur, datée. Dans la démo, le cœur fictif sert ces lectures.

Les capacités suivantes ne sont **pas livrées** et s'affichent **« bientôt »**, sans date, jamais simulées : exécution des virements entre agences (seule leur suggestion est livrée, FR-149), rapprochement du float Mobile Money avec le relevé de l'opérateur, réserve obligatoire et statut de tension par agence (ratio de couverture ; le cœur fait foi pour la trésorerie), saisie du comptage physique en agence (côté cœur), caisse des tontines. L'inventaire des boutons (PRD-D FR-2) les liste.

**Conséquences (testables) :**
- Une clôture d'agence validée dans le cœur apparaît dans Prospera avec son écart, à la lecture suivante.
- Aucun écran de ce module ne propose « dépôt », « retrait » ou « clôturer l'agence » : ces actes sont « dans le cœur ».
- Cœur coupé : bandeau « cœur injoignable » avec la date de dernière lecture ; aucune valeur recalculée par Prospera.
- Un RA ne voit que la caisse de son agence.
- Chacun de ces boutons porte « bientôt » et explique ce qu'il fera.
- Aucun chiffre de position de tension ou de réserve ne s'affiche sans venir du cœur.
- Aucune de ces capacités n'apparaît dans la démo comme fonctionnelle.

#### FR-147 : L'IA aide le comptable à valider les paiements Mobile Money et à les rapprocher

Pour chaque paiement Mobile Money en attente (FR-140), l'IA commune affiche au **CPT** des **indicateurs** : montant différent de l'échéance, **doublon possible** (même client, même montant, fenêtre courte), numéro différent de celui du client, référence déjà vue, erreur de saisie probable. Elle **propose** valider ou rejeter, avec la raison. Pour la file de rapprochement (FR-139), elle **propose le rattachement** à une échéance ou à un autre paiement. **L'IA ne valide jamais un paiement et n'écrit jamais une écriture** : le CPT décide. **Entrées :** le paiement, l'historique du client, les échéances ouvertes, les paiements récents. **Sortie :** indicateurs, proposition, raison, provenance. Réalise UJ-4.

**Conséquences (testables) :**
- Deux paiements de 30 000 FCFA du même numéro à 2 minutes d'écart : le second porte « doublon possible » ; il n'est pas validé automatiquement.
- Un paiement dont le montant est à 0,4 % d'une échéance est proposé en rattachement (le rattachement automatique reste la règle de FR-139, sans IA).
- Valider contre la proposition de l'IA ne demande pas de motif ; rejeter exige le motif de FR-140 comme d'habitude.
- IA commune absente : les règles de FR-139 (écart < 1 %, doublon à ± 100 FCFA sur 5 minutes) s'appliquent seules.

#### FR-148 : L'IA détecte les anomalies et les risques de fraude de caisse

L'IA commune surveille la caisse des collecteurs et les lectures de la caisse du guichet, et alerte le **RA, le DAF et l'auditeur** sur des **anomalies à examiner** : écarts récurrents d'un même collecteur, remises systématiquement tardives, collectes juste sous un seuil de contrôle, annulations de collecte fréquentes, écart de caisse atypique d'une agence par rapport à son historique. **Entrées :** collectes, remises, clôtures, écarts, annulations, caisse du guichet lue du cœur (FR-146). **Sortie :** alerte avec le motif, les opérations concernées, un niveau, la provenance. Une alerte n'est **pas une accusation** : elle ne sanctionne ni ne suspend personne. Le seuil est calibré sur les données de l'IMF (décision E5) ; l'alerte traitée a un motif de clôture, renvoyé comme correction.

**Conséquences (testables) :**
- Un collecteur avec trois écarts non résolus en 30 jours et des remises à J+2 reçoit une alerte « pratique à examiner » adressée au RA, au DAF et à l'auditeur.
- L'alerte nomme les opérations ; elle ne nomme pas de faute.
- Classer une alerte sans suite exige un motif.
- IA commune absente : les seuils d'écart de FR-145 et la récurrence de FR-145 restent actifs.

#### FR-149 : La prévision de trésorerie à 7 jours et le rééquilibrage entre agences se lisent, ne s'exécutent pas

Le **DAF** (le DG et le RA en lecture) voit, pour chaque agence, une **prévision de trésorerie à 7 jours** et, quand une agence est en tension et une autre en excès, une **suggestion de rééquilibrage** (agence source, agence destinataire, montant). **Entrées lues du cœur :** caisse et banque par agence, décaissements prévus, échéances attendues, collecte des collecteurs (remises), historique. **Sortie :** projection quotidienne avec une fourchette, suggestion avec la raison, provenance. Prospera **ne déplace aucun fonds** : le virement entre agences est fait dans le cœur par l'IMF ; le bouton d'exécution est « bientôt ». Réalise UJ-1.

**Conséquences (testables) :**
- La prévision d'une agence affiche sept valeurs et la fourchette ; elle porte « à jour au » et la date des données du cœur.
- Une suggestion de rééquilibrage nomme les deux agences et un montant ; elle ne crée aucun mouvement.
- Cœur injoignable : la dernière prévision s'affiche datée, marquée périmée.
- Sans IA commune, la section affiche « prévision indisponible » ; la caisse du guichet lue reste visible (FR-146).

### 6.4bis Écarts avec les modules partagés et la démo

| Sujet | Module partagé (PRD-D) ou démo | Ce que fait l'IMF | Exigence |
|---|---|---|---|
| Produits | `catalogue` : articles, grilles de prix, conditionnements (PRD-D §7.3) | Module distinct `produits-financiers` : bornes, taux, frais, versions, éligibilité (décision T5) ; le `catalogue` reste celui des articles | FR-100 à FR-111 |
| Plafond d'usure | Démo : produit à 2,5 %/mois, microcrédit à 28 %, « 24 % pile » | Contrôle du TEG à la publication ; jeu de démo conforme | FR-108, FR-111 |
| Amortissement | Démo : capital constant ; cahier : mensualité constante | Méthode choisie par produit ; annuité constante par défaut | FR-102 |
| Éligibilité | Démo : non contrôlée | Score et ancienneté ; dérogation du ROC | FR-104 |
| Client | PRD-D : Tiers / point de vente (`pdv`) | Fiche de relation `microfinance` : KYC, LBC/FT, secteur, consentements, groupes ; une personne = une fiche | FR-114 à FR-134 |
| KYC | Démo : lecture seule | Niveaux, validation par un autre que le créateur, revue périodique, filtrage des listes rafraîchies | FR-119 à FR-122 |
| Groupe solidaire | PRD-D §6.0 : capacité du noyau « Tiers collectif » ; démo : lecture seule | Écrit, créé, tracé ; compte du groupe au cœur ; tontines « bientôt » | FR-129 |
| Épargne | Démo : comptes tenus par Prospera ; PRD-D §6.0 : encaissement sans créance | Épargne lue du cœur ; collecte renvoyée au cœur | FR-106, FR-130, FR-135 |
| Collecte | PRD-D §6.1 : encaissement de visite, remise d'espèces | Remboursements et épargne, reçu, renvoi au cœur, liste « à saisir dans le cœur », rapprochement | FR-135 à FR-142 |
| Hors ligne | PRD-D FR-109 ; démo : file simulée | Idem PRD-D ; ajout de la fiche et du brouillon de demande ; jamais de décision | FR-134, FR-136 |
| Preuve de présence | PRD-D FR-102 : 200 m, signalement | Rayon et blocage : voir partie 4a (visite d'instruction) | partie 4a |
| Caisse | PRD-D §6.0 : caisse de guichet hors périmètre ; démo : caisse complète tenue par Prospera | Guichet **lu du cœur** ; Prospera tient la caisse des collecteurs et la clôture du jour | FR-143 à FR-146 |
| Mobile Money | Démo : Flooz et Mixx ; cahier : un seul opérateur | Opérateur par pays, banques via PI-SPI ; validation du comptable avant crédit | FR-140 |
| IA | Démo : scores constants | Capacités d'IA servies par l'IA commune, provenance affichée, jamais bloquantes | FR-112, FR-113, FR-124 à FR-128, FR-131, FR-142, FR-147 à FR-149 |

---

Les sections 6.5 à 6.9 décrivent ce que Prospera échange avec le logiciel cœur de l'IMF, le cœur fictif livré pour la démonstration, le risque de portefeuille et le reporting BCEAO. Elle numérote FR-150 à FR-199 (FR-199 est rangée dans §6.5 ; FR-180, FR-181, FR-190 et FR-194 portent les capacités d'IA). Elle suit la partie 3a (§6.1 à §6.4). Les modules marqués ★ sont dans la démo de février (récit §5, décision B5).

Trois règles valent pour toute la partie.

- **Le cœur fait foi pour l'argent.** Soldes, encours officiel, échéancier officiel après décaissement, pénalités, écritures, épargne, caisse du guichet : Prospera les lit, il ne les recalcule pas et ne les corrige jamais en silence.
- **Aucun produit n'est nommé.** Le cœur est « le cœur ». L'échange est défini par un contrat neutre (annexe C), pas par une API de fournisseur. Le détail technique va dans l'addendum.
- **Tout seuil est un paramètre de l'IMF.** Les textes réglementaires sont des paramètres par pays, par date et par texte, à faire vérifier par un juriste (voir FR-195).

### 6.5 L'échange avec le cœur (`coeur-sfd`, M47 [proposition]) ★

**Ce que ça veut dire.** Le cœur garde les comptes et la comptabilité officielle de l'IMF (récit §2). Prospera se branche à côté, pour le crédit et le pilotage. Le module `coeur-sfd` porte le contrat d'échange (annexe C) : il reçoit du cœur ce que le cœur tient, il lui renvoie ce que Prospera décide, et il dit à chaque écran quelle est la fraîcheur de ce qu'il montre. Il ne dépend d'aucun produit : l'échange passe par une API si le cœur en offre une, sinon par des fichiers. Le vrai connecteur d'un produit précis est hors février (spine Connecteurs AD-32) ; le contrat d'échange et le cœur fictif (§6.6) sont, eux, dans février (décision A9).

Parcours : UJ-3 (le DG pilote le réseau : ses chiffres viennent du cœur, avec leur fraîcheur), UJ-5 (le rapport BCEAO du mois repose sur l'échange), UJ-6 (le prospect découvre la démo sur le cœur fictif).

#### FR-150 : Le cœur fait foi pour l'argent

Prospera tient : le dossier de crédit jusqu'au comité, l'échéancier **contractuel** décidé par le comité, l'ordre de décaissement, les relances, le recouvrement, le pilotage et la caisse des collecteurs. Le cœur tient : les soldes, l'encours officiel, l'échéancier officiel après décaissement, les pénalités et intérêts de retard, l'épargne et la caisse du guichet. Réalise UJ-3, UJ-5.

**Conséquences (testables) :**
- Aucun écran de Prospera ne permet de saisir ou de modifier un solde, un encours, un montant de pénalité ou un solde d'épargne.
- Tout montant d'argent affiché porte sa source (« cœur » ou « Prospera ») et sa date de dernière lecture.
- Un montant calculé par Prospera (provision proposée, PAR) porte la mention « calculé par Prospera sur les données du cœur du [date] », jamais « comptabilisé ».
- Une écriture comptable n'est jamais produite par Prospera dans le cœur ; l'export des écritures est un lot séparé, non prioritaire (partie 4b).

#### FR-151 : Prospera reçoit du cœur les objets de l'argent

Prospera reçoit du cœur : les clients (identité, agence, statut), les prêts (encours, taux, durée, jours de retard, garanties), les échéanciers officiels, les mouvements de paiement, les pénalités, les comptes d'épargne et leurs mouvements, la caisse du guichet, et, si le cœur la fournit, la balance au plan comptable SFD (décision E1). Chaque objet est défini à l'annexe C. Réalise UJ-3, UJ-5.

**Conséquences (testables) :**
- Chaque objet reçu garde l'identifiant stable que le cœur lui donne ; Prospera ne le remplace jamais.
- Un objet reçu qui ne respecte pas les champs minimaux de l'annexe C est refusé avec un motif en clair et placé dans la file des écarts (FR-159).
- La balance est facultative : son absence ne bloque aucun autre flux.
- L'épargne est montrée en lecture seule ; aucun écran de Prospera ne crée ni ne débite un compte d'épargne.

#### FR-152 : Prospera renvoie au cœur ce qu'il décide

Prospera renvoie au cœur : les dossiers accordés (avec l'échéancier contractuel du comité), les ordres de décaissement à exécuter, et, si le cœur sait les recevoir, les remboursements saisis dans Prospera (FR-155). Réalise UJ-3.

**Conséquences (testables) :**
- Un dossier n'est envoyé au cœur qu'à l'état EN_GESTION, jamais avant la décision du comité.
- Chaque envoi porte une clé d'origine unique et l'identité de l'auteur de la décision.
- Chaque envoi a un état visible : à envoyer, envoyé, accepté, refusé (avec le motif du cœur), jamais confirmé après un délai (paramètre ; défaut : 24 h).
- Un refus du cœur remonte au rôle concerné (CC ou ROC) dans sa file, avec le motif.

#### FR-153 : Le dossier accordé part avec l'échéancier contractuel

Le comité génère l'échéancier contractuel (partie 2). Le dossier accordé le porte au cœur avec les conditions figées : montant, taux, durée, mensualité, frais, TEG, date de la première échéance, agence, GP. L'accord du ROC seul ne produit aucun envoi. Réalise UJ-3.

**Conséquences (testables) :**
- Un dossier à l'état EN_ANALYSE_ROC ou EN_COMITE_CREDIT n'apparaît jamais dans les envois.
- L'envoi contient l'échéancier contractuel complet, ligne par ligne (date, capital, intérêts, frais, assurance).
- Un dossier dont le TEG dépasse le plafond d'usure en vigueur à son octroi n'est pas envoyé (FR-10, FR-36) et lève une alerte.
- Après acceptation par le cœur, le prêt reçoit l'identifiant du cœur ; il est lié au dossier de Prospera pour toujours.

#### FR-154 : L'ordre de décaissement est exécuté par le cœur, ou par `paiement`

Prospera émet un ordre de décaissement par dossier accordé. Les décaissements en espèces au guichet et par virement sont **exécutés par le cœur** sur cet ordre ; l'espèces est autorisé par le comptable-caissier (CPT) ou le DAF. Les décaissements par Mobile Money et PI-SPI sont exécutés par le module `paiement` (PRD paiement FR-P65 à FR-P69, deux personnes distinctes), puis **déclarés** au cœur (décision A3). Réalise UJ-3.

**Conséquences (testables) :**
- Un ordre a un des états : à exécuter, exécuté (avec date de valeur et référence du cœur ou du paiement), rejeté (avec motif), expiré.
- Un même ordre ne produit jamais deux décaissements : une clé unique par ordre est refusée à la seconde présentation (FR-160).
- Un décaissement Mobile Money ou PI-SPI exécuté par `paiement` est transmis au cœur comme « décaissement exécuté hors du cœur » ; tant que le cœur ne l'a pas enregistré, l'écran dit « en attente du cœur ».
- Un ordre en espèces refusé par le cœur ne bascule jamais seul sur un autre canal.
- Le décaissement n'est jamais présenté comme terminé tant que ni le cœur ni `paiement` ne l'a confirmé.

#### FR-155 : Les remboursements saisis dans Prospera sont renvoyés au cœur, si possible

Un remboursement saisi dans Prospera (collecte terrain, guichet, Mobile Money validé) est renvoyé au cœur comme « paiement à comptabiliser » **si le cœur sait le recevoir**. Ce n'est pas une obligation (décision A1). Le reste dû, l'échéancier officiel et l'encours sont toujours lus du cœur. Réalise UJ-3.

**Conséquences (testables) :**
- Un remboursement renvoyé reste « en attente du cœur » jusqu'à ce que le mouvement correspondant arrive du cœur ; il ne réduit alors l'encours officiel que par ce mouvement.
- Le rapprochement entre le paiement de Prospera et le mouvement du cœur suit la règle de la partie 2 (écart inférieur à 1 % : rattachement automatique ; sinon file du comptable ; jamais refusé).
- Un remboursement qui reste sans mouvement du cœur au-delà d'un délai (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 48 h) apparaît dans la file des écarts.

#### FR-156 : Quand le cœur ne sait pas recevoir, Prospera sort la liste « à saisir dans le cœur »

Si le cœur ne sait recevoir ni les remboursements ni les dossiers, Prospera produit chaque jour, par agence, la liste des éléments à saisir dans le cœur, et attend le mouvement du cœur pour confirmer. Réalise UJ-3.

**Conséquences (testables) :**
- La liste est un fichier lisible (tableur) et un écran, par agence, avec : référence, client, montant, date, canal, auteur.
- Un élément quitte la liste quand le cœur renvoie le mouvement correspondant, jamais sur déclaration d'un utilisateur de Prospera.
- Un élément resté dans la liste au-delà d'un délai (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 72 h) lève une alerte au RA de l'agence.
- La liste est la même, que le cœur reçoive ou non par la suite : elle sert aussi de preuve de ce qui a été demandé.

#### FR-157 : L'échange passe par une API si le cœur sait, sinon par des fichiers ; Prospera tire toujours

Le contrat d'échange (annexe C) est servi par deux transports interchangeables : une API que Prospera interroge, ou des fichiers que Prospera relève dans un emplacement partagé du réseau de l'IMF. Pour les envois de Prospera vers un cœur sans API d'écriture, Prospera dépose des fichiers que le cœur relève. **Prospera tire toujours ; aucun port n'est ouvert vers l'IMF** (décision A10, PRD moteur NFR-2). Réalise UJ-3, UJ-6.

**Conséquences (testables) :**
- Le cœur n'appelle jamais Prospera : un test d'installation vérifie qu'aucun port entrant n'est ouvert pour l'échange.
- Les deux transports portent le même contrat ; changer de transport ne change aucun écran ni aucune exigence.
- Un cœur sans API est limité à une fraîcheur horaire ou nocturne ; l'écran le dit (FR-159).
- Le détail des transports, des enveloppes et des formats est dans l'addendum (→ addendum).

#### FR-158 : Un relais Money Vibes reçoit les notifications entrantes

Les notifications que Prospera ne peut pas recevoir sans port entrant (PI-SPI, FedaPay, réponses WhatsApp) et le lien de paiement envoyé au client passent par un relais tenu par Money Vibes. Le serveur de l'IMF tire les événements du relais ; il n'est jamais joint directement (décision B1). Réalise UJ-3.

**Conséquences (testables) :**
- Un paiement du client via le lien arrive à Prospera au plus tard à la prochaine interrogation du relais (paramètre ; défaut : 1 minute).
- Le relais ne conserve que le strict nécessaire à la mise en file, et un événement tiré n'est plus servi à la même instance.
- Si le relais est injoignable, le crédit continue ; les paiements par lien sont affichés « en attente du relais ».

#### FR-159 : Chaque écran dit la fraîcheur, et les écarts vont dans une file

Chaque écran qui montre une donnée du cœur affiche la date et l'heure de la dernière lecture et le transport utilisé. Tout écart détecté (objet refusé, envoi sans confirmation, concordance rompue) va dans une **file des écarts** lisible par CPT, DAF et ROC. Prospera ne corrige jamais de l'argent en silence. Réalise UJ-3, UJ-5.

**Conséquences (testables) :**
- Fraîcheur par défaut : immédiate (au plus 5 minutes) avec une API ; à l'heure ou de nuit (avant 6 h) avec des fichiers (paramètre).
- Une donnée plus vieille que le double de sa fraîcheur par défaut est signalée « périmée » sur l'écran.
- Chaque ligne de la file porte : objet, clé d'origine, nature de l'écart, date, auteur de la résolution quand elle a lieu.
- Résoudre un écart n'efface pas la ligne : elle passe « résolue » avec l'auteur et le motif.

#### FR-160 : L'idempotence et le rejeu sont des capacités du contrat

Chaque objet échangé porte une clé d'origine. Présenter deux fois le même objet ne le crée pas deux fois. Un envoi échoué est rejoué sans perte. Réalise UJ-3.

**Conséquences (testables) :**
- Rejouer un lot déjà intégré ne change aucun compte ni aucun solde affiché.
- Une coupure du lien avec le cœur ne perd aucun envoi : les envois attendent dans une file et partent dans l'ordre à la reprise.
- Un doublon présenté par le cœur est reconnu et compté dans la file des écarts, pas appliqué.
- Les mécanismes (clés, séquences) sont dans l'addendum (→ addendum ; spine Connecteurs AD-5 et AD-8).

#### FR-161 : Prospera reçoit des mouvements, jamais des totaux

Pour les paiements, les pénalités et l'épargne, Prospera reçoit des **mouvements** (un fait, une date de valeur, un montant), pas des totaux à remplacer. Les soldes affichés se déduisent des mouvements reçus et sont comparés aux valeurs de contrôle que le cœur envoie. Réalise UJ-3.

**Conséquences (testables) :**
- Un solde de prêt de Prospera est recalculé à partir de l'encours officiel et des mouvements postérieurs ; il est égal au solde de contrôle du cœur au franc près, sinon une ligne naît dans la file des écarts.
- Un mouvement antidaté du cœur est intégré avec sa date de valeur et déclenche le recalcul des jours de retard.
- Un mouvement n'est jamais modifié ; une annulation du cœur arrive comme un mouvement inverse.

#### FR-162 : L'échéancier contractuel est comparé à l'échéancier officiel

Après le décaissement, l'échéancier du cœur est l'officiel. Prospera garde l'échéancier contractuel du comité et les compare. Tout écart (date, montant, nombre d'échéances, taux) lève une alerte (décision A2). Réalise UJ-3.

**Conséquences (testables) :**
- La comparaison se fait à chaque réception d'échéancier officiel, ligne par ligne.
- Un écart au-delà d'une tolérance (paramètre ; défaut : 0 FCFA sur les dates, 1 % sur les montants) va dans la file des écarts et alerte le GP et le ROC.
- Les relances, le PAR et le recouvrement utilisent toujours l'échéancier **officiel**.
- Un écart légitime (rééchelonnement décidé par le ROC ou le comité) est reconnu quand le nouvel échéancier contractuel a été envoyé au cœur ; il n'alerte pas.

#### FR-163 : Un rapprochement trimestriel compare le portefeuille de Prospera et celui du cœur

Chaque trimestre, Prospera produit un état de rapprochement : nombre de prêts, encours, jours de retard et provisions proposées, comparés à ceux du cœur à la même date d'arrêté (Instruction BCEAO n° 017-12-2010, rapprochement du portefeuille comptable et extra-comptable). Réalise UJ-5.

**Conséquences (testables) :**
- L'état liste, par agence, les prêts présents d'un seul côté et ceux dont l'encours diffère.
- Un écart non résolu sous 30 jours (paramètre ; texte : 30 jours) lève une alerte au DAF.
- L'état est conservé 10 ans et lisible par l'auditeur interne (AUD) et le DG.
- L'état est une lecture : il ne corrige rien.
- L'état est présenté au DAF avec ses écarts ouverts, leur ancienneté et leur motif, puis signé par lui ; il est un document du calendrier (FR-184) ; il ne peut pas être modifié par la personne qui a résolu les écarts.

#### FR-164 : Le code d'agence est celui du cœur s'il existe

Quand le cœur a des codes d'agence, Prospera les reprend et les range dans le module `reseau` ; sinon Prospera a ses propres codes (décision T6). Réalise UJ-3.

**Conséquences (testables) :**
- Un code d'agence repris du cœur n'est pas modifiable dans Prospera.
- Une agence créée dans Prospera (démo, FR-172) reçoit un code de Prospera, marqué « sans code du cœur ».
- Un prêt reçu du cœur dont l'agence est inconnue est placé « agence inconnue » et signalé dans la file des écarts ; il n'est jamais rattaché à une agence par défaut.

#### FR-165 : Prospera continue quand le cœur est indisponible

L'indisponibilité du cœur ne coupe jamais Prospera : les écrans continuent à servir la dernière donnée connue, marquée périmée (FR-159). Les décisions qui engagent de l'argent sont suspendues, pas les autres. Réalise UJ-3.

**Conséquences (testables) :**
- Le dossier se prépare, s'instruit et passe en comité même si le cœur est coupé ; l'envoi attend la reprise (FR-160).
- Le décaissement n'est ni lancé ni marqué exécuté tant que le cœur n'a pas répondu.
- Un bandeau « cœur indisponible depuis [heure] » apparaît sur les écrans des rôles concernés et se retire à la reprise.
- Les relances automatiques continuent sur la dernière échéance connue ; elles s'arrêtent pour un client dont un remboursement est « en attente du cœur » (paramètre).

#### FR-199 : L'IA détecte les écarts et les doublons entre Prospera et le cœur

Pour CPT, le DAF et le ROC, l'IA détecte, dans les échanges (FR-159), les **écarts** (solde différent, mouvement manquant d'un côté, échéancier dévié) et les **doublons** (même paiement ou même ordre présenté deux fois sous des identifiants différents), et propose pour chacun une cause probable et une action (rattacher, ignorer, saisir dans le cœur). Entrées : mouvements, soldes de contrôle, échéanciers, file des écarts. Sortie : des lignes de la file des écarts enrichies d'une cause probable et d'un niveau de confiance. Réalise UJ-3.

**Conséquences (testables) :**
- Une proposition de rapprochement n'est appliquée que par un humain ; l'IA ne corrige jamais de l'argent ni ne supprime un mouvement.
- Un doublon certain (même clé d'origine) est traité par la règle d'idempotence (FR-160) sans IA ; l'IA ne traite que les doublons probables (même client, même montant, dates voisines).
- Chaque proposition affiche sa confiance et les mouvements comparés.
- Sans IA commune, la file des écarts fonctionne par règles (FR-159) ; la cause probable affiche « non installé » ; l'échange n'est jamais bloqué.
- Règles de cette capacité : la provenance est affichée (règle ou modèle, version, date, données utilisées) ; **l'IA propose, un humain décide** ; un écart à une proposition exige un motif, renvoyé comme correction ; si l'IA est indisponible, rien ne bloque et le travail avance sur l'analyse humaine ; le mot « IA » n'est affiché que pour un modèle, une règle explicable sert tant que le modèle n'existe pas. Le moteur est l'IA commune (famille de modules à part) : ce PRD dit ce que l'IA fait pour l'IMF, pas comment. Aucune donnée n'y part sans le consentement de l'IMF (PRD moteur, apprentissage fédéré).

### 6.6 Le cœur fictif de démonstration ★

**Ce que ça veut dire.** Le logiciel cœur de l'IMF n'est pas connu. Pour que la démo soit crédible, Money Vibes livre un **cœur fictif** qui parle le contrat d'échange (annexe C). Il vit dans l'espace d'essai (PRD moteur) et sert la démo de l'IMF fictive : 3 agences, 10 agents, 1 000 prêts actifs (décision B4). Il est dans février malgré la spine Connecteurs AD-32 (décision A9) ; le vrai connecteur est hors février. Parcours : UJ-6 (le prospect découvre la démo).

#### FR-166 : Le cœur fictif tient ce que tient un vrai cœur

Le cœur fictif tient les clients, les agences, les produits, les prêts avec échéancier officiel, les pénalités, les comptes d'épargne et leurs mouvements, la caisse du guichet et une balance au plan comptable SFD. Il parle le contrat de l'annexe C dans les deux sens. Réalise UJ-6.

**Conséquences (testables) :**
- Chaque objet de l'annexe C marqué « cœur → Prospera » est produit par le cœur fictif avec ses champs minimaux.
- Chaque objet marqué « Prospera → cœur » est accepté, refusé ou ignoré (doublon) par le cœur fictif, avec un code de refus en clair.
- Le cœur fictif fournit la balance : les ratios prudentiels de la démo sont donc calculés (FR-187).

#### FR-167 : Le cœur fictif n'est jamais installé en production réelle

Le cœur fictif n'existe que dans l'espace d'essai et dans la démo. Une installation réelle chez l'IMF ne le contient pas et refuse de l'activer. Réalise UJ-6.

**Conséquences (testables) :**
- Le bilan d'installation d'un espace « réel » échoue (🔴) si le cœur fictif est présent ou activable.
- Chaque écran de la démo branché sur le cœur fictif affiche « données fictives ».
- Aucun identifiant du cœur fictif n'est accepté par un espace réel.
- Les données d'un espace d'essai ne passent jamais dans un espace réel.

#### FR-168 : Le cœur fictif exécute les décaissements, avec des cas simulés

Le cœur fictif reçoit les ordres de décaissement, les exécute après un délai simulé, et sait en rejeter selon des cas prévus. Réalise UJ-6.

**Conséquences (testables) :**
- Un ordre accepté passe « exécuté » avec une date de valeur et une référence du cœur fictif ; le prêt apparaît actif avec son échéancier officiel.
- Un rejet simulé (compte inactif, plafond de caisse) renvoie un motif en clair que Prospera affiche.
- Un doublon d'ordre est reconnu et compté.
- Les délais et les cas de rejet sont des paramètres de l'espace d'essai.

#### FR-169 : Le cœur fictif fait vivre les 1 000 prêts

Le cœur fictif produit, chaque jour de démo, des paiements, des pénalités et des retards sur les 1 000 prêts, de façon que le PAR, les relances et le recouvrement bougent. Réalise UJ-6.

**Conséquences (testables) :**
- Une proportion de prêts paie à l'heure, une proportion paie en retard, une proportion ne paie pas ; les proportions sont des paramètres de l'espace d'essai.
- Les prêts en retard reçoivent des pénalités calculées par le cœur fictif, selon l'ordre d'imputation pénalités, intérêts, capital (paramétrable).
- Le PAR1, PAR30 et PAR90 de la démo (FR-173) sont non nuls et varient d'un jour à l'autre sans intervention.
- Les produits du jeu de démo respectent le plafond d'usure (TEG actuariel de 24 % par an au plus ; FR-10).
- Le jeu est reproductible : un même réglage produit la même évolution.

#### FR-170 : Le cœur fictif offre l'API et les fichiers, et sait tomber en panne

Le cœur fictif offre les deux transports (FR-157), à deux fraîcheurs visibles. Il sait simuler une coupure, un doublon et un écart de concordance. Réalise UJ-6.

**Conséquences (testables) :**
- Un bouton d'espace d'essai coupe le lien : Prospera affiche « cœur indisponible » (FR-165) et rejoue ses envois à la reprise (FR-160).
- Un écart simulé (solde de contrôle différent) crée une ligne dans la file des écarts (FR-159).
- Le même contrat est servi en API et en fichiers : la démo montre les deux.

#### FR-171 : La démo se remet à zéro et un prospect la teste lui-même

Le cœur fictif se remet à zéro à la demande d'un administrateur de l'espace d'essai ; un prospect peut parcourir la démo seul. Réalise UJ-6.

**Conséquences (testables) :**
- La remise à zéro recharge le jeu de démonstration (3 agences, 10 agents, 1 000 prêts actifs) en moins de 10 minutes (paramètre) et vide les dossiers créés pendant la démo.
- Aucune action de la démo n'envoie de message réel : les sorties sont interceptées et comptées (PRD moteur).
- Un paiement saisi dans la démo est marqué « test ».

#### FR-172 : Dans la démo, un dossier créé va jusqu'à EN_GESTION

Dans la démo, un utilisateur peut créer une agence, un agent et un vrai dossier de prêt, et le mener jusqu'à EN_GESTION : le comité décide, le dossier part au cœur fictif, l'ordre de décaissement est exécuté, l'échéancier officiel revient (décision B4). Réalise UJ-6.

**Conséquences (testables) :**
- Une agence créée dans la démo reçoit un code de Prospera (FR-164) et est connue du cœur fictif.
- Le prêt créé figure dans l'encours, dans le PAR et dans la balance du cœur fictif.
- Le parcours complet, de la création du dossier à l'échéancier officiel, se fait sans intervention hors des écrans de Prospera et du cœur fictif.

### 6.7 Risque de portefeuille (`risque-par`, M18) ★

**Ce que ça veut dire.** Le module calcule, sur les prêts et les paiements reçus du cœur, le portefeuille à risque, le classement des créances, les provisions **proposées**, la concentration et les alertes. Il reprend les **règles** du paquet comptable SFD (`prospera-microfinance-service` : classement, provisions, PAR), mais jamais la tenue des crédits : ce paquet n'est pas installé chez l'IMF au jour 1 (décision A11). Prospera propose ; le cœur comptabilise (décision D6). Le module porte aussi les analyses de l'IA commune sur le risque : prévision du PAR, perte attendue, analyse des provisions, analyses par secteur d'activité et de conjoncture (FR-180, FR-181). Elles proposent ; le PAR, le classement et la provision proposée restent calculés par règle. Parcours : UJ-3 (le DG pilote le réseau), UJ-5 (le rapport BCEAO du mois).

#### FR-173 : Le PAR est calculé en encours, de façon cumulative

PAR1, PAR30 et PAR90 sont cumulatifs et se calculent sur l'**encours entier** des prêts en retard (pas sur les seuls montants échus, pas en nombre de dossiers). Le retard se mesure sur l'échéance impayée la plus ancienne (décision D5). Réalise UJ-3, UJ-5.

**Conséquences (testables) :**
- PAR30 = encours des prêts dont l'impayé le plus ancien dépasse 30 jours, divisé par l'encours total ; PAR90 est inclus dans PAR30, qui est inclus dans PAR1.
- Les seuils de jours (1, 30, 90) sont des paramètres ; un PAR180 s'ajoute sans changement de code.
- Chaque ratio affiche son numérateur, son dénominateur, sa date d'arrêté et la fraîcheur du cœur.
- Un prêt sans échéancier officiel n'est pas compté : il est listé « échéancier manquant » (renvoi : FR-197).

#### FR-174 : Le PAR se ventile par agence, agent, secteur d'activité et produit

Le DG et le ROC descendent du réseau à la région, l'agence, l'agent et le client. Le **secteur d'activité** est une dimension à part, présente partout (décision F2). Le PAR se ventile aussi par produit. Réalise UJ-3.

**Conséquences (testables) :**
- Le PAR du réseau est égal à la somme pondérée des PAR de ses agences, au franc près.
- Chaque ventilation est filtrée par le périmètre du rôle (le RA ne lit que son agence).
- Une ligne sans secteur d'activité renseigné est comptée « secteur non renseigné » et listée.
- Les ventilations alimentent le tableau de bord (partie 4b) sans recalcul.

#### FR-175 : Le classement suit le barème réglementaire SFD par défaut

Chaque prêt est classé selon l'ancienneté de son impayé le plus ancien. Dès **une échéance impayée**, la totalité de l'encours est déclassée (Référentiel comptable des SFD, compte 29, décision D6). La règle et ses bornes sont un jeu de paramètres versionné. Réalise UJ-5.

**Conséquences (testables) :**
- Un prêt avec une échéance impayée est classé « en souffrance » pour son encours entier, échu ou non.
- Les tranches par défaut sont : impayé de 6 mois au plus, de plus de 6 à 12 mois, de plus de 12 à 24 mois ; la perte à 24 mois.
- Un prêt rééchelonné est classé « rééchelonné » et reste en souffrance jusqu'à trois échéances honorées (partie 4a, plan d'étalement).
- L'option « déclassement facultatif jusqu'à 3 mois d'impayé » est un paramètre de l'IMF (défaut : déclassement dès un impayé).
- Une migration de classe est datée et conservée ; elle alimente le rapport BCEAO (FR-185).

#### FR-176 : Les provisions sont proposées, jamais comptabilisées

Prospera propose, pour chaque prêt, une provision : 40 % pour un impayé de 6 mois au plus, 80 % de plus de 6 à 12 mois, 100 % de plus de 12 à 24 mois, perte à 24 mois (décision D6, Référentiel comptable des SFD, comptes 2991 à 2993). Le DAF valide le montant proposé ; le **cœur comptabilise**. Réalise UJ-5.

**Conséquences (testables) :**
- La base de provision est l'encours moins le dépôt de garantie du débiteur et de sa caution, quand le cœur le fournit.
- Le barème (bornes en jours, taux) est un jeu de paramètres versionné et daté ; une provision est jugée au barème en vigueur à sa date d'arrêté.
- Un écran de provisions affiche : total proposé, total validé par le DAF, total comptabilisé lu de la balance du cœur quand elle est là ; il n'affiche jamais « proposé » comme « comptabilisé ».
- La perte à 24 mois est **proposée** au ROC et au DG (partie 4a) ; elle ne se produit jamais seule.
- Le barème de départ est celui du référentiel SFD ; il est à faire confirmer par un praticien SFD avant la mise en service (FR-195).

#### FR-177 : La concentration est mesurée et alertée

Le module mesure la concentration par secteur d'activité, par agence, par agent (part de dossiers approuvés), par produit, et par plus gros emprunteur. Réalise UJ-3.

**Conséquences (testables) :**
- Chaque mesure donne sa part (encours du segment sur encours du réseau), son seuil d'alerte et son seuil critique.
- Seuils de démo (paramètres ; calibrés sur les données de l'IMF) : secteur 28 % alerte, 35 % critique ; agence 25 % ; agent 50 % alerte, 60 % critique ; le plus gros emprunteur suit la norme prudentielle (FR-187).
- Un segment au-dessus de son seuil apparaît dans la file d'alertes avec la part, le seuil et la date.
- Les prêts aux dirigeants, au personnel et aux personnes liées sont mesurés à part (case « partie liée », FR-58).

#### FR-178 : Les seuils d'alerte sont calibrés sur les données de l'IMF

Les seuils d'alerte de risque ne sont pas ceux de la démo, qui n'en est que le point de départ. Après la reprise, Prospera calcule des seuils initiaux sur les données de l'IMF, les propose, un humain les valide, et ils sont recalculés périodiquement (décision E5). Réalise UJ-3.

**Conséquences (testables) :**
- Avant validation humaine, les seuils par défaut de la démo s'appliquent, marqués « non calibrés ».
- Un seuil proposé affiche la donnée qui le justifie (distribution observée, période) ; sa validation est faite par le DG ou le DAF, avec auteur et date.
- Le recalcul périodique (paramètre ; défaut : trimestriel) propose une nouvelle valeur ; il ne remplace jamais une valeur validée sans validation.
- Chaque version de seuil est conservée avec sa date d'effet.

[ASSUMPTION] Le calibrage statistique reste une règle explicable (percentiles de l'IMF, pas un modèle) tant que l'IA commune n'en fournit pas un (FR-181).

#### FR-179 : Une alerte est traitée dans un délai, puis remontée ; les migrations sont listées

Une alerte de risque est adressée au rôle du périmètre (RSQ, ROC, RA, DG selon la nature). Sans traitement, elle remonte au supérieur (décision F12). Réalise UJ-3.

**Conséquences (testables) :**
- Une alerte sans prise en charge après 48 h (paramètre) remonte au rôle supérieur et lève une notification.
- Une alerte se clôt avec un motif ou une action (décision, dérogation, plan) ; elle n'est jamais supprimée.
- Le PAR30 d'une agence au-dessus de 5 % passe « alerte » et au-dessus de 10 % passe « critique » (paramètres ; calibrés sur les données de l'IMF ; défaut de démo : 5 % et 10 %).
- Un PAR30 du réseau au-dessus de 12 % lève une alerte au DG avec un délai d'action de 15 jours (paramètres ; défaut de démo).
- Une liste mensuelle donne, par agence, les prêts qui ont changé de classe (ancienne classe, nouvelle classe, jours de retard, motif) ; une agence dont le PAR30 dépasse celui du réseau de plus de 0,8 point (paramètre ; défaut de démo) est listée « hausse anormale » ; plus de 15 % de l'encours qui migre vers la tranche de plus de 30 jours en un mois lève une alerte (paramètres ; défaut de démo).

#### FR-180 : L'IA analyse le risque par secteur d'activité et par conjoncture

Pour le DG, le ROC, l'analyste risque (RSQ) et le DAF, l'IA analyse le risque de portefeuille par **secteur d'activité**, à deux niveaux. Au niveau du secteur : concentration dans le réseau, dans chaque agence et chaque zone, **saturation d'un secteur dans une agence** (trop de clients de la même activité au même endroit), évolution du PAR du secteur. Au niveau de la conjoncture : effet attendu de l'inflation, des prix des produits du secteur, de la saison et de la conjoncture générale sur la capacité de remboursement. Entrées : encours, PAR et secteur d'activité (cœur et fiche client), agence et zone, historique de paiement, séries de prix et d'inflation fournies par l'IMF ou par l'IA commune. Sortie : par secteur, une note de risque, les agences et zones concernées, les facteurs qui la justifient, une proposition d'action (limiter l'octroi, rééquilibrer, surveiller). Réalise UJ-3.

**Conséquences (testables) :**
- Chaque analyse liste ses entrées, ses facteurs et sa fenêtre de temps ; un secteur sans donnée suffisante affiche « données insuffisantes », pas une note.
- La saturation d'un secteur dans une agence se compare à un seuil (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 28 % alerte, 35 % critique, FR-177).
- Une proposition d'action n'est jamais appliquée seule : l'octroi dans un secteur n'est limité que par une décision humaine (ROC ou DG) avec motif.
- Les analyses se ventilent par agence et par zone, dans le périmètre du rôle.
- Sans IA commune, la concentration et la saturation restent calculées par règles (FR-177) ; l'analyse de conjoncture affiche « non installé » ; rien ne bloque.
- Règles de cette capacité : la provenance est affichée (règle ou modèle, version, date, données utilisées) ; **l'IA propose, un humain décide** ; un écart à une proposition exige un motif, renvoyé comme correction ; si l'IA est indisponible, rien ne bloque et le travail avance sur l'analyse humaine ; le mot « IA » n'est affiché que pour un modèle, une règle explicable sert tant que le modèle n'existe pas. Le moteur est l'IA commune (famille de modules à part) : ce PRD dit ce que l'IA fait pour l'IMF, pas comment. Aucune donnée n'y part sans le consentement de l'IMF (PRD moteur, apprentissage fédéré).

#### FR-181 : L'IA prévoit le PAR, la perte attendue et analyse les provisions

Pour le DG, le DAF, le ROC et l'analyste risque (RSQ), l'IA propose : (a) la **prévision du PAR** (tendance et projection à 1, 3 et 6 mois, par réseau, agence et zone) ; (b) la **perte attendue** du portefeuille et le **coût du risque** ; (c) le **secteur moteur du risque** (celui qui explique la plus grande part de la hausse du PAR ou de la perte attendue) ; (d) l'**analyse des provisions** : écart entre la provision proposée par barème (FR-176), la provision comptabilisée lue de la balance du cœur et la provision requise. Entrées : prêts, échéanciers officiels, paiements et classes reçus du cœur, historique de PAR, secteur, garanties. Sortie : une valeur et un intervalle par prévision, la perte attendue par agence, le coût du risque en % de l'encours moyen, le secteur moteur, l'écart de provision en FCFA avec sa cause. Réalise UJ-3, UJ-5.

**Conséquences (testables) :**
- Chaque prévision affiche son intervalle, sa date de calcul, la période d'historique utilisée et l'écart entre la prévision précédente et le PAR réel.
- La perte attendue et le coût du risque sont rangés sous « estimation » ; aucun n'est présenté comme une provision ni comme une écriture (FR-176).
- L'écart de provision n'est calculé que si la balance du cœur est là ; sinon « en attente des données du cœur » (FR-187).
- Une prévision n'ouvre aucune décision de crédit, de blocage ou de provision : le DAF valide les provisions, le ROC et le DG décident le reste.
- Sans IA commune, la tendance du PAR est servie par une règle explicable (moyenne glissante, marquée « règle ») ; la perte attendue, le coût du risque et le secteur moteur affichent « non installé » ; rien ne bloque.
- Règles de cette capacité : la provenance est affichée (règle ou modèle, version, date, données utilisées) ; **l'IA propose, un humain décide** ; un écart à une proposition exige un motif, renvoyé comme correction ; si l'IA est indisponible, rien ne bloque et le travail avance sur l'analyse humaine ; le mot « IA » n'est affiché que pour un modèle, une règle explicable sert tant que le modèle n'existe pas. Le moteur est l'IA commune (famille de modules à part) : ce PRD dit ce que l'IA fait pour l'IMF, pas comment. Aucune donnée n'y part sans le consentement de l'IMF (PRD moteur, apprentissage fédéré).

[ASSUMPTION] Le score de risque de la version 0, par règles explicables, suit le barème de la partie 2 (paiement 40, capacité 30, activité 20, terrain 10) ; le PAR et la provision de ce module n'en dépendent pas.

#### FR-182 : Le module reprend les règles du paquet comptable SFD, sans sa tenue des crédits

Les règles de classement, de provision et de PAR de `prospera-microfinance-service` sont reprises par `risque-par` comme calculs sur les prêts reçus du cœur. Le paquet lui-même n'est pas installé chez l'IMF au jour 1 (décision A11). Réalise UJ-5.

**Conséquences (testables) :**
- Aucun prêt, aucun dépôt, aucun remboursement n'est enregistré par `risque-par` : il ne lit que ce que le cœur lui donne.
- Le PAR du module est identique, sur un jeu de contrôle, au PAR du paquet comptable SFD à la même date d'arrêté.
- L'installation du paquet comptable SFD, si l'IMF la demande plus tard, ne change aucun chiffre de `risque-par` ; la double tenue des crédits est refusée à l'installation.
- Le détail de la reprise des règles est dans l'addendum (→ addendum).

### 6.8 Conformité BCEAO (`conformite-bceao`, M20)

**Ce que ça veut dire.** Le module génère les états que l'IMF doit remettre à l'autorité, à partir du portefeuille reçu du cœur et, quand elle est là, de la balance du cœur. Prospera **génère** ; le DG **valide** ; l'IMF **signe et dépose** hors de Prospera (décision E4). Aucun format de fichier de dépôt n'est prescrit par la BCEAO dans les sources lues : produire le rapport, c'est produire un document conforme au gabarit, prêt à signer. La loi uniforme de microfinance adoptée le 21/12/2023 peut modifier ces règles : les textes sont donc des paramètres (FR-195). Parcours : UJ-5 (le rapport BCEAO du mois), UJ-3.

#### FR-183 : Le module génère les indicateurs périodiques

Le module génère les indicateurs périodiques de l'Instruction BCEAO n° 020-12-2010 : membres et clients, crédits en cours, répartition des crédits par objet, crédits en souffrance, et ceux de l'organisation (dont le comité de crédit). Réalise UJ-5.

**Conséquences (testables) :**
- Chaque indicateur est calculé à une date d'arrêté et porte sa source (« cœur », « Prospera »).
- Un indicateur qui ne peut pas être calculé (donnée absente du cœur) est marqué « en attente des données du cœur » avec la donnée manquante nommée.
- Le rapport ne contient aucune valeur par défaut silencieuse : un champ absent est vide et signalé, jamais zéro.
- Le gabarit du rapport est paramétrable (établissement, code, agrément, pays, période) ; la période ne peut pas être postérieure à la date de génération.

#### FR-184 : Le rapport suit la périodicité de la catégorie de supervision

La catégorie de supervision de l'IMF est un paramètre de l'installation (décision E2). Elle commande la périodicité : mensuelle pour une institution au-dessus du seuil de supervision de la Commission Bancaire (l'ancien « article 44 », encours de dépôts ou de crédits de 2 milliards de FCFA ou plus), trimestrielle pour les autres, avec un délai de 30 jours après la fin de la période. Réalise UJ-5.

**Conséquences (testables) :**
- La démo est réglée sur « grande IMF », reporting mensuel (décision E2).
- Un calendrier des échéances affiche, par état, la date limite et son statut : à produire, généré, validé, déposé.
- La catégorie et le seuil ne sont jamais codés en dur : la nouvelle loi remplace l'article 44 par un seuil fixé par la Banque Centrale (FR-195).
- Un état en retard de plus de 5 jours avant l'échéance lève une alerte au DG et au DAF (paramètre).

#### FR-185 : Le rapport mensuel de portefeuille et de provisions est produit par Prospera

Le rapport mensuel BCEAO comprend : la synthèse du portefeuille, les indicateurs PAR, la classification des créances, les provisions par agence, les migrations de classe du mois, le détail des dossiers. Il s'appuie sur `risque-par`. Réalise UJ-5.

**Conséquences (testables) :**
- Les totaux du rapport sont égaux à ceux de `risque-par` à la date d'arrêté.
- Le rapport affiche le nombre d'agences actives correct (celui du réseau à la date) et une colonne de taux contenant un pourcentage, jamais un montant.
- Un contrôle avant l'envoi donne : complétude des données du cœur, couverture des provisions, migrations détectées ; une donnée absente bloque la validation du DG, avec la raison.
- Les mentions de texte de référence du rapport (instruction, article) viennent d'un tableau de paramètres, pas du code.

#### FR-186 : Le DG valide, l'IMF signe et dépose hors de Prospera

Le rapport ne peut pas être marqué « validé » sans le DG. Il est exporté prêt à signer. La signature et le dépôt se font hors de Prospera (décision E4). Prospera trace le reste. Réalise UJ-5.

**Conséquences (testables) :**
- Le statut d'un rapport va : généré, validé par le DG, signé et déposé (déclaré par l'IMF, avec date et référence).
- Le statut « validé » exige le droit du DG ; le générateur du rapport ne peut pas être son valideur.
- Un rapport validé est figé : toute correction produit une nouvelle version, l'ancienne reste conservée.
- Prospera ne simule pas un dépôt à l'autorité : le bouton de dépôt n'existe pas ; seule la déclaration « signé et déposé » est enregistrée.

#### FR-187 : Les ratios prudentiels sont calculés si la balance du cœur est là

Les normes de l'Instruction BCEAO n° 010-08-2010 (limitation des risques 200 % au plus, couverture des emplois moyen et long terme 100 % au moins, prêts aux dirigeants et au personnel 10 % au plus, risque sur une seule signature 10 % au plus, liquidité 100/80/60 % au moins selon la catégorie, autres opérations 5 % au plus, réserve générale 15 % au moins, capitalisation 15 % au moins, participations 25 % au plus) sont calculées **si la balance du cœur est présente** (décision E1). Sans balance, chaque ratio dit **« en attente des données du cœur »**. Réalise UJ-5.

**Conséquences (testables) :**
- Avec la balance du cœur fictif (§6.6), les ratios sont calculés et comparés au seuil paramétré ; chaque ratio affiche numérateur, dénominateur, date d'arrêté et seuil.
- Sans balance, aucun ratio n'est inventé : le statut est « en attente des données du cœur », jamais « conforme ».
- Les numérateurs issus du crédit (plus gros emprunteur, prêts aux personnes liées) sont calculés par Prospera même sans balance ; leur dénominateur (fonds propres) reste « en attente ».
- Les seuils, la catégorie prudentielle et la liste des normes sont des paramètres versionnés ; les seuils de la démo (8 %, 80 %) qui contredisent ces textes ne sont pas repris.
- Un ratio calculé sur un seuil non vérifié par un praticien porte la mention « seuil à valider » (FR-195).

[ASSUMPTION] La balance est livrée par le cœur en postes au plan comptable SFD de l'installation ; la table de correspondance entre les comptes du cœur et ces postes est à la charge de l'IMF, avec l'aide de Money Vibes à l'installation.

#### FR-188 : Le rapport sort en PDF et en CSV

Chaque rapport s'exporte en PDF et en CSV. Le PDF est un document mis en page, daté, versionné, au texte sélectionnable, prêt à signer. Réalise UJ-5.

**Conséquences (testables) :**
- Le PDF d'un rapport mensuel complet se génère en moins de 15 secondes pour 50 000 prêts (paramètre).
- Le nom du fichier porte l'IMF (code), l'état, la période et la version.
- Le CSV contient les mêmes valeurs que le PDF, ligne à ligne.
- Le PDF porte les champs de signature du DG et de l'IMF, vides, et le numéro de version du gabarit.
- Un rapport reste lisible en PDF et en CSV pendant 10 ans.

#### FR-189 : Le plafond d'usure est contrôlé sur tout le portefeuille

À l'octroi, le TEG est calculé et le plafond est vérifié (FR-10, FR-36). Ici, le module contrôle **a posteriori** tout le portefeuille reçu du cœur : un prêt dont le TEG dépasse le plafond en vigueur à son octroi lève une alerte d'audit (décision C9). Réalise UJ-5.

**Conséquences (testables) :**
- Le plafond est une table datée par catégorie d'institution (24 % par an pour les IMF dès le 01/06/2026, Décision n° 19 du 29/12/2025/CM/UMOA) ; un prêt est jugé au plafond en vigueur à son octroi.
- Le TEG est actuariel, annualisé, frais et assurance inclus, pénalités exclues ; l'inclusion de chaque type de frais est un paramètre.
- Un prêt importé du cœur dont le TEG ne peut pas être calculé (frais manquants) est listé « TEG indéterminé » ; il n'est pas déclaré conforme.
- La liste des prêts au-dessus du plafond est transmise à l'auditeur interne et au DG ; elle ne modifie aucun prêt.
- Le détail du calcul du TEG est dans l'addendum (→ addendum).

#### FR-190 : L'IA calcule le score de conformité, alerte tôt et prépare le rapport BCEAO

Pour le DG, le DAF et l'auditeur interne (AUD), l'IA fournit trois capacités. (a) Un **score de conformité global de 0 à 100**, décomposé par dimension (PAR, provisions, liquidité, KYC, traçabilité), avec le poids de chaque dimension. (b) Des **alertes réglementaires proactives** : une non-conformité probable (ratio qui approche son seuil, échéance de rapport, liste de sanctions périmée, plafond d'usure) est signalée avec un **délai d'action recommandé**. (c) La **génération du rapport BCEAO** : l'IA remplit le gabarit (FR-185), repère les données manquantes et propose le texte de synthèse. Entrées : indicateurs, ratios, état du KYC et des listes, calendrier, paramètres réglementaires (FR-195). Sortie : un score, des alertes datées avec délai, un rapport prêt pour validation. Réalise UJ-5.

**Conséquences (testables) :**
- Le score affiche ses dimensions, leurs poids et leurs entrées ; il n'est jamais présenté comme une norme réglementaire.
- Une alerte proactive donne la règle visée, la valeur actuelle, le seuil et le délai d'action recommandé ; elle se clôt avec une action ou un motif.
- Le rapport généré n'est jamais validé, signé ni déposé par l'IA : le DG valide (FR-186), l'IMF signe et dépose hors de Prospera.
- Un champ que l'IA ne peut pas remplir reste vide et signalé ; elle n'invente aucune valeur.
- Sans IA commune, le score, les alertes sur seuils et le rapport sont servis par règles (calcul des ratios, calendrier) ; la synthèse rédigée affiche « non installé » ; la génération du rapport n'est jamais bloquée.
- Règles de cette capacité : la provenance est affichée (règle ou modèle, version, date, données utilisées) ; **l'IA propose, un humain décide** ; un écart à une proposition exige un motif, renvoyé comme correction ; si l'IA est indisponible, rien ne bloque et le travail avance sur l'analyse humaine ; le mot « IA » n'est affiché que pour un modèle, une règle explicable sert tant que le modèle n'existe pas. Le moteur est l'IA commune (famille de modules à part) : ce PRD dit ce que l'IA fait pour l'IMF, pas comment. Aucune donnée n'y part sans le consentement de l'IMF (PRD moteur, apprentissage fédéré).

#### FR-191 : La piste d'audit est ajoutée seulement et conservée 10 ans

Toute action sur un dossier, un paiement, un seuil, un paramètre réglementaire, un rapport ou un accès à une donnée sensible est inscrite dans un journal ajouté seulement : utilisateur, action, objet, valeur avant, valeur après, poste, horodatage. Conservation : 10 ans au moins (Instruction BCEAO n° 017-12-2010, décision E7). Réalise UJ-5.

**Conséquences (testables) :**
- Une ligne du journal ne se modifie ni ne se supprime ; une correction est une nouvelle ligne.
- Le journal permet de reconstituer, pour un prêt, toutes les décisions et tous les échanges avec le cœur dans l'ordre chronologique.
- Seuls l'auditeur interne (AUD) et le DG lisent le journal complet ; l'administrateur de l'IMF (ADMIN_IMF) ne le lit pas.
- La purge avant 10 ans est refusée, même par l'administrateur.
- Le mécanisme d'intégrité (chaînage ou scellement) est dans l'addendum (→ addendum) ; le mot « infalsifiable » n'est écrit nulle part dans l'interface tant qu'il n'est pas prouvé.

#### FR-192 : La séparation des tâches est contrôlée, et l'auditeur lit sans modifier

La séparation des tâches est définie par FR-6. Ce module la **contrôle** après coup : il détecte les cas où la règle a été contournée et les remonte à l'auditeur. Réalise UJ-5.

**Conséquences (testables) :**
- Sont détectés : un dossier validé par son instructeur, un paiement validé et une échéance modifiée par la même personne dans l'heure, un décaissement en espèces non autorisé par CPT ou DAF, une modification après décision du comité.
- Chaque cas détecté est une ligne du journal d'audit et une alerte à l'auditeur (AUD) ; l'auditeur ne peut pas corriger.
- Les règles détectées sont des paramètres de l'IMF (fenêtre d'une heure, seuil d'écart de caisse, nombre de crédits actifs simultanés).
- Les vues d'audit de l'auditeur interne (AUD) sont en lecture seule : crédit (dossiers incomplets, retards suspects), caisse (écarts), séparation des tâches, anomalies, journal d'accès ; aucune n'offre un bouton qui modifie une donnée (un bouton non branché affiche « bientôt », PRD-D FR-2) ; une consultation du journal par l'auditeur est elle-même inscrite au journal.

#### FR-193 : La LBC/FT est mise à jour régulièrement et exportée

Le contrôle LBC/FT est défini en §6.2 (FR-119 à FR-122 : KYC à niveaux, PPE, listes de sanctions, seuils CENTIF). Ce module en tient la **mise à jour régulière** : fraîcheur des listes de sanctions et revue périodique du KYC (décision E3). La déclaration à la CENTIF est un export hors Prospera. Réalise UJ-5.

**Conséquences (testables) :**
- Un écran donne la date de dernière mise à jour de chaque liste de sanctions et le nombre de fiches KYC dont la revue est en retard.
- Une liste plus vieille que sa périodicité (paramètre ; défaut : 7 jours) ou une revue en retard lève une alerte au rôle conformité.
- Les seuils de déclaration CENTIF et la périodicité de la revue sont des paramètres par pays.
- L'export CENTIF est un fichier ; Prospera ne transmet rien à la CENTIF.

#### FR-194 : L'IA détecte les anomalies et corrèle les événements suspects de la trace

Pour l'auditeur interne (AUD) et le DG, l'IA détecte les **anomalies et risques opérationnels** (collecte au-dessus de deux fois la moyenne, modification après comité, décaissement sans visite, connexion hors horaires, pic de transactions, suppression de pièce KYC) et **corrèle des événements suspects dans la piste d'audit** (FR-191) : plusieurs faits, ordinaires isolément, qui ensemble dessinent un contournement (même utilisateur, même client, fenêtre courte). Entrées : journal d'audit, paiements, caisse, dossiers, agences. Sortie : une liste d'anomalies avec gravité (critique, haute, moyenne), les lignes du journal qui les fondent et un motif. Réalise UJ-5.

**Conséquences (testables) :**
- Chaque anomalie renvoie aux lignes du journal qui la fondent ; l'auditeur peut les ouvrir.
- Une anomalie a un statut : ouverte, en examen, classée avec motif ; l'IA ne classe jamais seule.
- L'IA ne corrige, ne bloque et ne sanctionne rien ; aucune donnée ne se modifie à partir d'une anomalie.
- Les anomalies par règle (FR-192) fonctionnent sans IA ; la corrélation affiche « non installé » sans elle ; rien ne bloque.
- Règles de cette capacité : la provenance est affichée (règle ou modèle, version, date, données utilisées) ; **l'IA propose, un humain décide** ; un écart à une proposition exige un motif, renvoyé comme correction ; si l'IA est indisponible, rien ne bloque et le travail avance sur l'analyse humaine ; le mot « IA » n'est affiché que pour un modèle, une règle explicable sert tant que le modèle n'existe pas. Le moteur est l'IA commune (famille de modules à part) : ce PRD dit ce que l'IA fait pour l'IMF, pas comment. Aucune donnée n'y part sans le consentement de l'IMF (PRD moteur, apprentissage fédéré).

#### FR-195 : Les textes réglementaires sont des paramètres par pays, à faire vérifier

Tout ce qui vient d'un texte est un paramètre versionné par pays, par date d'effet et par texte : plafond d'usure, barème de classement et de provision, normes prudentielles, périodicité, seuil de supervision, durées de conservation, seuils CENTIF. La loi uniforme de microfinance du 21/12/2023 abroge la loi de 2007, mais maintient les instructions existantes tant qu'elles ne sont pas abrogées ; chaque État la transpose à sa date. Réalise UJ-5.

**Conséquences (testables) :**
- Chaque paramètre réglementaire affiche son texte source, sa date d'effet et son statut (« vérifié par un juriste » ou « à vérifier »).
- Un nouveau paramètre ou un changement de date d'effet est inscrit au journal d'audit et validé par le DG.
- Changer le pays de l'installation change les paramètres proposés, pas le code.
- Les points à faire vérifier par un juriste avant la mise en service sont listés dans l'écran des paramètres : statut de la nouvelle loi par pays, barème de provision (lecture d'un texte par reconnaissance de caractères), plafond de capitalisation, périodicité par ratio, base de comparaison du TEG, obligation de consultation du bureau d'information sur le crédit.

### 6.9 Reprise du portefeuille de prêts en cours

**Ce que ça veut dire.** La décision sur la reprise du portefeuille est reportée (récit §3) : le **format** n'est pas fixé et s'ajustera à la présentation. Le module Reprise (`reprise`, M44) porte la mécanique (PRD Reprise FR-9 : lot par étapes, simulation, validation par le DG, réconciliation au franc près, feu vert par module cible, répétition générale). Cette fiche dit seulement ce que la microfinance exige de lui. Parcours : UJ-3.

#### FR-196 : Le portefeuille de prêts en cours est importé par la Reprise

L'import du portefeuille existant est prévu. Il passe par le module Reprise, avec des fichiers pour février (PRD Reprise FR-1, spine Reprise AD-23), sur un format documenté et versionné **par objet**, reporté. Réalise UJ-3.

**Conséquences (testables) :**
- Le format d'import de chaque objet microfinance (client, prêt, échéance, garantie, groupe, épargne) est documenté et versionné ; sa forme finale est fixée à la présentation.
- Le format par défaut est le même que celui du contrat d'échange (annexe C), de sorte que le cœur fictif sait le produire.
- Le module Reprise ne peut pas livrer un objet microfinance dont le schéma d'objet n'est pas déclaré par le module cible (écart ouvert : le schéma des objets microfinance est à écrire, voir l'addendum).

#### FR-197 : Un prêt en cours sans échéancier complet n'entre pas

Un prêt en cours sans échéancier complet est une erreur de reprise (`ECHEANCIER_INCOMPLET`, PRD Reprise FR-9) : sans échéancier, pas de portefeuille à risque. Réalise UJ-3.

**Conséquences (testables) :**
- Un prêt sans échéancier complet est listé au rapport de simulation avec le motif ; il n'est ni importé, ni compté dans le PAR.
- Un prêt dont le capital restant dû, les jours de retard et le nombre d'échéances ne se réconcilient pas au franc près avec les valeurs de contrôle du cœur n'obtient pas le feu vert.
- L'import reprend l'échéancier et les montants du cœur **sans recalcul** de pénalités ni d'intérêts : le cœur fait foi.

#### FR-198 : La reprise prépare aussi les seuils et les identifiants

À la reprise, Prospera rattache chaque prêt à son agence et à son agent (module `reseau`, décision E6), garde l'identifiant stable du cœur pour les paiements ultérieurs, et calcule les seuils d'alerte initiaux proposés (FR-178). Réalise UJ-3.

**Conséquences (testables) :**
- Chaque prêt repris garde l'identifiant du cœur ; les mouvements postérieurs reçus du cœur s'y rattachent.
- Les agences et agents du portefeuille sont repris de `reseau` avant les prêts (ordre : `reseau`, puis les objets microfinance).
- Un prêt dont l'agence est inconnue est listé et n'est pas importé.
- Sans le connecteur du cœur (hors février), l'import est un instantané : les paiements postérieurs à l'import arrivent par les fichiers de l'échange (FR-157), ou le PAR et les relances sont marqués « données du [date] ».

[ASSUMPTION] Le point de coupure entre l'import et l'échange permanent est daté par l'IMF à la mise en service ; il n'est pas défini ailleurs pour la microfinance.

---

## 7. Partie 4 — Les modules partagés et cadrés

Cette partie ne réécrit pas les modules que le PRD distributeur a déjà écrits : elle les cite et dit seulement ce que l'IMF exige en plus. Les sections 7.1 (`terrain`) et 7.2 (`recouvrement`) sont ici ; les modules suivants (équipes, marketing, pilotage, installation chez l'IMF) sont écrits dans la suite de la partie 4.

### 7.1 ★ Terrain et application mobile (`terrain`, M12) — PRD-D §6.1

**Dans la démo.** L'écran terrain montre une carte de la zone de l'agent, un formulaire de visite, un historique et un panneau « hors ligne ». Presque tout est simulé : la bascule hors ligne ne change qu'un booléen d'affichage, « Synchroniser » attend 1,5 seconde puis remet les compteurs à zéro, le repère GPS se déplace à la main (la position n'est donc pas une preuve de présence), aucune photo n'est demandée, et l'« alerte de proximité » liste en réalité les adresses déjà visitées. Le chiffre de collecte en file se contredit (165 000 FCFA contre 120 000). Aucune de ces constantes n'est reprise.

**Ce que ça veut dire.** Le noyau Visite, Tournée, Remise d'espèces, Écart de caisse et Position du PRD distributeur convient à l'IMF. Le PRD distributeur lui propose déjà ses mots : agent de crédit ou de collecte, membre, visite de collecte, rendez-vous d'octroi, suivi de groupe, tournée de collecte, versement de caisse (PRD-D §6.1, tableau de vocabulaire). Ce que l'IMF change : la visite d'instruction est liée à un dossier de crédit et sert de **preuve** ; il n'y a ni commande ni stock ; et l'IA propose des **zones de prospection**.

**Ce qui s'applique tel quel.**
- Plan de journée, tournée ordonnée, report et annulation motivés, visite ajoutée en cours de journée (PRD-D FR-100), avec les motifs de l'IMF (FR-200).
- « Y aller » démarre la visite pour de vrai ; une seule visite `EN_COURS` par agent (PRD-D FR-101).
- Encaissement en visite (PRD-D FR-104), remise d'espèces et écart de caisse (PRD-D FR-105) : c'est le module `collecte` (§6.3) et le module `caisse` (§6.4) qui les portent chez l'IMF.
- Carte de l'équipe sur Google Maps, statuts d'agent, positions relevées pendant la tournée seulement, conservées 90 jours puis purgées (PRD-D FR-106).
- Indicateurs de tournée : couverture, conversion, kilomètres, avec « demande de crédit » à la place de « commande » (PRD-D FR-107) ; alertes de tournée (PRD-D FR-174), sauf le relevé d'exécution en magasin, propre au distributeur.
- Application mobile Flutter hors connexion, file d'envoi, clé d'idempotence, état de synchronisation visible, serveur seul juge (PRD-D FR-109) ; appareil perdu et session sûre (PRD-D FR-110).
- Génération du plan de journée chaque soir (PRD-D FR-173), avec la matière de l'IMF (FR-200).
- **Non installés chez l'IMF :** la commande depuis la visite (PRD-D FR-103) et la disponibilité des produits (PRD-D FR-108). Le bouton « Prendre une commande » est `NON_INSTALLE` ; la « commande » de l'IMF est une demande de crédit (§5.2).

#### Exigences propres à l'IMF (terrain)
#### FR-200 : Le plan de journée de l'agent se déduit de l'échéancier et du dossier

Le serveur propose chaque soir le plan du lendemain de l'agent terrain, du collecteur et du commercial (PRD-D FR-173). Chez l'IMF, la matière du plan n'est pas une créance de facture : ce sont les échéances de prêt lues du cœur, les retards, les promesses du jour, les missions de recouvrement (FR-203), les visites d'instruction à faire (FR-201), les prospects et les dépôts d'épargne attendus. Réalise UJ-4.

**Conséquences (testables) :**
- Les motifs de visite de l'IMF sont, par rang de priorité décroissant (paramétrable) : recouvrement, urgente (PAR élevé), instruction de dossier, collecte d'échéance, collecte d'épargne, suivi de groupe, prospection, routinière. Les motifs « réassort », « lancement de produit » et « réclamation » du noyau n'existent pas chez l'IMF.
- Le motif « recouvrement » est posé dès qu'une échéance du client est impayée depuis plus de 7 jours (paramètre ; défaut : 7 jours, cahier terrain et collecte). Une échéance due dans 3 jours (J-3) donne le motif « collecte d'échéance ».
- Une visite d'instruction attendue par un CC (FR-201) apparaît dans le plan de l'agent désigné, avec le dossier lié, à la prochaine synchronisation.
- Le plan n'affiche aucun solde « en direct » : il affiche la dernière lecture du cœur, avec sa date (§6.3, FR-141).
- Un test crée un plan avec un client à J-3, un client à J+10, une promesse du jour et une visite d'instruction : l'ordre suit les rangs ci-dessus.

#### FR-201 : Une visite d'instruction est une preuve : photo, GPS, 100 m, « hors zone » refusée mais jamais effacée

La visite d'instruction est un type de visite du module `terrain`, liée à un dossier de crédit (FR-45, FR-46). L'agent ou le CC la réalise sur le terrain avec au moins une photo et la position GPS ; le serveur juge la distance entre la position et l'adresse du client. Le rayon est un paramètre (défaut : **100 m**, décision T7). Hors rayon, la visite est marquée **« hors zone »** : elle est **refusée comme preuve** et **jamais effacée**. Réalise UJ-1.

**Conséquences (testables) :**
- Le rayon de 100 m ne vaut que pour la visite d'instruction. Les autres types de visite suivent le noyau : rayon de 200 m (paramètre), clôture possible hors rayon avec un motif obligatoire, visite signalée au superviseur (PRD-D FR-102).
- Une visite d'instruction à 150 m est conservée avec le statut « hors zone », visible du CC, de l'AUD et du RA ; elle ne compte pas dans le nombre de visites exigé par le dossier (FR-45) ; le CC peut en refaire une. Aucun rôle, pas même ADMIN_IMF, ne peut la supprimer.
- La clôture sans photo ou sans position est refusée. La photo est au format JPEG ou PNG, de 5 Mo au plus (paramètre). Une position absente (GPS refusé) donne « position non relevée » : la visite est refusée comme preuve.
- Le repère de la carte ne se déplace pas à la main : la position vient du capteur de l'appareil.
- Hors connexion, la visite est enregistrée sur l'appareil (photo, position, heure) ; le serveur rejoue le contrôle de rayon à la synchronisation, visite par visite, et accepte ou refuse avec le motif (FR-204).
- Dans l'essai (PRD-D FR-22), la position est simulée et la visite le dit à l'écran ; elle est acceptée comme preuve pour que UJ-1 aille jusqu'à EN_GESTION (FR-12), et reste marquée « position simulée ».

#### FR-202 : Les résultats d'une visite, la collecte d'épargne et le suivi de groupe

Les résultats d'une visite de l'IMF complètent ceux du noyau (commande, encaissement, promesse, sans suite, client absent) : « demande de crédit » (crée un prospect ou une demande en brouillon, FR-114, FR-37), « collecte d'épargne », « mise à jour de fiche ou photo KYC » (§6.2), « promesse de paiement » (FR-213) et « suivi de groupe ». Réalise UJ-4.

**Conséquences (testables) :**
- Un remboursement ou un dépôt d'épargne saisi en visite est un encaissement du module `collecte` (§6.3), rattaché à la visite ; l'épargne est un encaissement sans créance (PRD-D §6.0) et son solde reste celui du cœur.
- Le suivi de groupe (visite à un groupe solidaire) liste les membres, le statut de paiement de chacun et les présences ; il renvoie à la fiche du groupe (§6.2, FR-129) et au dossier de groupe (FR-72). Les cotisations de tontine sont « bientôt » (décision T1).
- « Sans suite » et « client absent » exigent un commentaire (PRD-D FR-102) ; un résultat « promesse » crée la promesse du recouvrement (FR-213).
- Un résultat « demande de crédit » ne décide rien : il crée un brouillon que le CC reprend (FR-31).

#### FR-203 : Les missions de recouvrement arrivent dans l'application et leur résultat revient

Un dossier de recouvrement peut créer une **mission** pour un agent : relance J+7 sans promesse, trois échecs de relance numérique (FR-212), demande du ROC, du RA ou du GP. Elle apparaît dans le plan de l'agent avec le motif « recouvrement » et le rang 0 (PRD-D FR-121). Le résultat revient dans le dossier sans ressaisie. Réalise UJ-7.

**Conséquences (testables) :**
- La mission porte : client, prêt, jours de retard, montant dû (valeur du cœur avec sa date), dernière promesse, historique des actions (FR-217). L'agent ne voit que les clients de son périmètre (FR-5).
- Les résultats possibles sont : paiement, paiement partiel, promesse (avec montant et date), refus, injoignable, plan demandé. Un résultat « promesse » crée la promesse (FR-213) ; un résultat « plan demandé » crée une proposition au ROC (FR-220).
- Une visite de recouvrement peut porter une photo et un compte rendu ; la position est relevée mais un écart de rayon signale la visite sans la refuser (noyau, PRD-D FR-102).
- Le RA peut créer une mission urgente dans son agence ; le ROC dans tout le réseau.
- Sans le module `recouvrement`, « mission de recouvrement » est `NON_INSTALLE`.

#### FR-204 : Hors ligne, ce qui marche et ce qui ne marche jamais

L'application `prospera-terrain` fonctionne sans réseau (PRD-D FR-109) ; elle est exigée, jamais « bientôt » (§4.1, FR-1). Réalise UJ-4.

**Conséquences (testables) :**
- Hors connexion, l'agent crée un prospect, complète une fiche, prend photos et position, saisit une visite (instruction, collecte, recouvrement), enregistre une collecte et prépare une demande en brouillon (décision T2 ; FR-134).
- Sont interdits hors connexion : valider le KYC, valider une pièce, lever une correspondance de sanctions, soumettre un dossier pour décision, toute décision de crédit, tout blocage ou déblocage (FR-218). Les boutons sont désactivés avec « en ligne seulement ».
- La synchronisation envoie les visites urgentes de recouvrement en premier ; 50 visites sont synchronisées en moins de 30 secondes (cahier terrain, paramètre).
- Un brouillon ou une visite en file depuis plus de 7 jours alerte l'agent (paramètre). Le stockage local est limité à 500 Mo (paramètre) ; une photo de KYC est compressée sur l'appareil avant envoi.
- Un solde ne change jamais tant que le serveur n'a pas validé la synchronisation : un encaissement hors ligne reste « à envoyer » puis « envoyé », jamais « confirmé » avant le mouvement du cœur (FR-137).

#### FR-205 : Rôles, périmètres, carte et ce que l'IMF n'a pas

Chez l'IMF, « agent de terrain » recouvre l'AT, le COLL et le COM ; le « superviseur » est le RA (son agence) ou le RCC (son agence ou sa région) ; le « comptable » est le CPT. Le CC réalise les visites d'instruction de ses dossiers ; le REC réalise les missions de recouvrement de ses zones (FR-216). Réalise UJ-4, UJ-8.

**Conséquences (testables) :**
- Chaque rôle ne voit que son périmètre (FR-5) : l'AT et le COLL leur zone, le RA son agence, le RCC son agence ou sa région, le ROC et le DG le réseau. Le repli « tout le réseau » quand le périmètre est vide n'existe pas : la liste est vide (PRD-D FR-106).
- La carte est Google Maps, comme le noyau (PRD-D FR-106) : la carte Leaflet de la démo n'est pas reprise. Les zones sont celles du module `reseau` (polygones). La carte de l'agence du RA montre agents, visites, clients cartographiés (avec consentement, FR-132) et « zones à renforcer ».
- Le conseil de visite par motif est une règle avec sa provenance, comme le noyau (PRD-D FR-100).
- Aucun écran du module n'affiche de catalogue, de prix, de stock ni de panier ; un test parcourt l'application avec chaque rôle IMF et n'en trouve aucun.

#### L'IA (terrain)
Règles communes (FR-8) : la **provenance** est affichée (règle ou modèle, version, date, données utilisées) ; **l'IA propose, l'humain décide** ; un écart exige un motif, renvoyé comme correction ; **rien ne bloque** si l'IA est indisponible, l'emplacement le dit ; le **moteur** est l'IA commune. Les positions GPS des agents ne servent qu'avec la finalité consentie et pendant le service (FR-15). Cette section dit ce que l'IA fait ; l'IA commune dit comment.

#### FR-206 : L'IA propose l'ordre de visite optimal et alerte quand un client en retard est proche

En préparant le plan (FR-200), l'IA commune propose à l'agent l'ordre de visite qui réduit la distance tout en tenant compte des priorités (retards, promesses du jour, échéances J-3, prospects), avec le motif de chaque rang. Pendant la tournée, elle l'**alerte** quand il passe à moins de **200 m** (paramètre) d'un client en retard de son périmètre et propose d'y passer. **Entrées :** plan du jour, positions des clients (avec consentement), jours de retard, promesses, score de recouvrement (FR-227), position de l'agent. **Sortie :** liste ordonnée avec gain estimé en distance, et alerte avec client, retard en jours, action proposée. Destinataire : l'agent. Réalise UJ-4.

**Conséquences (testables) :**
- Un client avec une promesse du jour et un retard de 10 jours passe avant un client à J-3 sans retard. L'agent qui réordonne enregistre le changement (pour mesurer, pas pour contrôler).
- L'alerte de proximité est calculée sur l'appareil à partir du plan préchargé : elle marche hors connexion. Elle ne montre que les clients du périmètre de l'agent.
- L'alerte de la démo, qui listait des adresses déjà visitées avec une distance tirée au hasard, n'est pas reprise.
- Une alerte ignorée n'a aucune conséquence pour l'agent ; l'IMF mesure le taux de suites données.
- IA commune absente : l'ordre est celui de la règle de base (FR-200) et l'alerte de proximité est calculée par règle (distance et retard) ; la tournée n'est pas retardée. Le routage routier réel est « bientôt » (PRD-D FR-100).

#### FR-207 : Saisie vocale vers la fiche et rapport du soir

À la fin d'une visite, l'agent peut **dicter** son compte rendu : l'IA le convertit en champs de la visite et de la fiche (revenus observés, stock, état de l'activité, promesse avec montant et date, prochaine action). Chaque soir à 18 h (paramètre), l'IA compose le **rapport du soir** : visites faites et prévues, collecte, promesses obtenues, retards restants dans la zone, anomalies, conseil du lendemain, et un conseil de coaching si l'objectif du jour est atteint à moins de 80 % (paramètre). **Destinataires :** le rapport va à l'agent et à son RA ou RCC. Réalise UJ-4.

**Conséquences (testables) :**
- L'agent relit et valide chaque champ rempli par la dictée avant l'enregistrement ; aucun champ n'est enregistré sans lui. Un champ qu'il corrige est renvoyé comme correction.
- L'enregistrement audio n'est pas conservé après la conversion en texte [ASSUMPTION : à confirmer avec l'avis juridique sur les données de voix, §12.3]. La dictée demande une connexion ; hors connexion, le champ se saisit au clavier.
- Le rapport du soir ne cite que des chiffres lus des visites et du cœur (avec leur date) ; chaque chiffre renvoie à sa source. Le rapport du RA agrège ceux de ses agents sans exposer la rémunération (PRD-D FR-8).
- IA commune absente : le rapport est un tableau des mêmes chiffres, sans texte rédigé ni conseil ; la dictée est « bientôt » à l'écran, sans simulation (PRD-D FR-2). Elle est « bientôt » dans le PRD distributeur ; chez l'IMF, elle est exigée dès que l'IA commune la sert.

#### FR-208 : L'IA suggère des zones de prospection et la réaffectation des agents

L'IA commune propose au RCC, au RA et au DG les **zones où prospecter** et les **réaffectations d'agents** qui en découlent. Pour chaque zone : nombre de **clients actifs au km²**, nombre de visites sur la période, couverture (clients cartographiés rapportés aux clients attendus), agents affectés et leur charge, PAR de la zone, secteur d'activité dominant et saturation (FR-97), prospects potentiels. Trois signaux la classent : **zone sous-couverte** (densité de clients actifs sous le seuil de l'IMF), **visites rares** (moins de visites que le seuil par client et par mois) et **agent sur-chargé** à côté d'une zone sans agent. Réalise UJ-1, UJ-3.

**Conséquences (testables) :**
- Une zone de 12 km² avec 40 clients actifs, aucune visite depuis 45 jours et aucun agent est proposée « sous-couverte » avec ses trois chiffres et la raison.
- Les seuils (densité minimale de clients actifs au km², nombre minimal de visites, charge maximale par agent) sont des paramètres calibrés sur les données de l'IMF, proposés puis validés par un humain (décision E5, FR-4) ; défaut de démo : « zone à renforcer » sous 70 % de couverture (démo, vue du RA).
- Une zone à PAR élevé est signalée « à risque » : elle n'est pas proposée à la prospection sans la mention du PAR, et le secteur saturé de la zone est affiché (FR-97).
- Une **réaffectation** proposée dit : l'agent, sa zone d'origine, sa zone cible, l'effet attendu (clients actifs au km², visites par client) et l'effet sur la zone d'origine. Le RA décide dans son agence, le RCC dans sa région, le DG entre agences ; l'affectation se fait dans le module `reseau`, jamais par le module `terrain`. Un refus écrit un motif.
- Les clients sans consentement de géolocalisation (FR-132) ne comptent pas dans la densité ; la zone affiche « données partielles » avec la part de clients concernés.
- Cette liste est **la même** que celle de la carte de la fiche client (FR-128) : une seule proposition par zone, deux vues. FR-128 la montre à la prospection commerciale ; FR-208 y ajoute les visites et les agents.
- IA commune absente : la carte affiche densité, visites, couverture et PAR par zone, sans suggestion ni confiance ; l'affectation se décide à la main.

#### Écarts tranchés (terrain)
| M12 (PRD-D §6.1) | IMF | Décision |
|---|---|---|
| Rayon de présence 200 m ; hors rayon : clôture permise avec motif, visite signalée | Visite d'instruction : 100 m, photo obligatoire, hors zone refusée comme preuve | 100 m pour l'instruction, 200 m pour les autres visites ; hors zone conservée, jamais effacée (T7, FR-201) |
| Motifs : relance, réclamation, réassort, lancement, fidélisation, prospection | Instruction, collecte d'échéance et d'épargne, recouvrement, urgente, suivi de groupe | Motifs IMF en donnée (FR-200) |
| Résultat « commande » | « Demande de crédit » ; collecte d'épargne ; photo KYC | Résultats IMF en donnée (FR-202) |
| Commande et disponibilité (PRD-D FR-103, FR-108) | Ni commande ni stock | `NON_INSTALLE` ; test d'absence d'écran (FR-205) |
| Google Maps (PRD-D FR-106) | La démo et le cahier utilisent Leaflet | Google Maps, comme le noyau |
| Voice-to-CRM « bientôt » (PRD-D, A.8 C11) | Exigé par le PO dans l'IA du terrain | Spécifié (FR-207) ; « bientôt » seulement sans IA commune |
| Rôles : agent, superviseur, comptable | AT, COLL, COM, CC, RA, RCC, REC, CPT | Équivalences (FR-205) |
| Plan de journée sur créances de facture | Plan sur échéances de prêt, retards, promesses, missions | FR-200 |
| Zones à plat, couverture non exigée | Agences, zones en polygones, zones à renforcer | Suggestion de zones (FR-208) |

### 7.2 ★ Relances et recouvrement (`recouvrement`, M19) — PRD-D §6.2

**Dans la démo.** Le recouvrement est une **lecture** : tableaux, fiches, scores constants. La vue du ROC trie les agences par impayés (pas par PAR), il n'y a pas de niveau « dossier », et aucun écran n'agit sur un statut : ni blocage, ni plan d'étalement, ni mise en demeure, ni saisie, ni contentieux, ni perte, ni affectation, ni clôture. Le bouton « Envoyer » des relances est décoratif ; le panneau du GP affiche « Paiement enregistré » sans rien écrire et son échéancier est figé sur deux lignes. Le score (28 à 35) est saisi à la main ; ses huit facteurs totalisent 105 %. Les « dossiers bloqués » de la démo sont des **demandes de crédit** bloquées en instruction depuis plus de 48 h : ce n'est pas un blocage de recouvrement, et l'objet est renommé (FR-218). Les statuts de recouvrement du récit du PO et le calendrier J-3 → J+90 ne sont pas dans le code de la démo : ils viennent du récit et du cahier de risque et conformité.

**Ce que ça veut dire.** Le module partagé `recouvrement` travaille sur une **créance** : ici, l'échéance de prêt (PRD-D §6.0, source `ECHEANCE_DE_PRET`). Le **cœur fait foi pour l'argent** : reste dû, pénalités, intérêts de retard, imputation (décisions A4, A5). Prospera tient ce qui est à lui : les relances, les promesses, les actions, les statuts de recouvrement, le blocage, la stratégie, la fiche du mauvais payeur. Le recouvrement est un **second axe de statuts** du prêt EN_GESTION : il n'ajoute aucun statut aux douze du dossier de crédit (FR-77, FR-78).

**Ce qui s'applique tel quel.**
- Créance à composantes (principal, intérêt, pénalité, frais) et ordre d'imputation paramétrable (PRD-D §6.0, PRD-D FR-111) ; l'IMF fournit les composantes lues du cœur.
- PAR sur l'encours entier, retard mesuré sur l'impayé le plus ancien (PRD-D §6.0, PRD-D FR-112) ; le PAR de l'IMF est calculé par `risque-par` (FR-173).
- Crédit du tiers : un paiement reçu n'est jamais refusé, l'excédent est un crédit (PRD-D FR-172).
- Dossier de recouvrement à journal non modifiable, seulement complété (PRD-D FR-113).
- Échelle d'escalade paramétrable : paliers, canaux, mode AUTO ou À VALIDER, gabarits, repli SMS, aucun délai dans le code (PRD-D FR-114) ; les valeurs de l'IMF sont en FR-212.
- Une relance part vraiment, par `notification`, avec un lien de paiement (PRD-D FR-115) ; la relance de recouvrement est un message transactionnel que le refus de la publicité n'éteint pas ; un paiement partiel suspend la relance, un paiement total l'arrête (PRD-D FR-116).
- Promesse de paiement : montant, date, canal, auteur ; rappel la veille ; délai de grâce de 24 h ; accord écrit après deux promesses rompues ; fiabilité = tenues ÷ faites (PRD-D FR-118).
- File du jour priorisée par valeur espérée, bornée par une capacité par agent (PRD-D FR-120) ; visite de recouvrement planifiée par `terrain` (PRD-D FR-121, FR-203).
- Le blocage du crédit est publié comme un fait et lu par le module d'engagement (PRD-D FR-119) : chez l'IMF, c'est le module `credit` qui le lit (FR-218).

#### Exigences propres à l'IMF (recouvrement)
#### FR-209 : Le remboursement est reçu du cœur ou saisi dans Prospera, et le cœur fait foi

Le recouvrement lit du cœur, via `coeur-sfd`, ce qui touche à l'argent d'un prêt : reste dû, échéances impayées, pénalités, intérêts de retard, et les mouvements de paiement. Les remboursements saisis dans Prospera (guichet, collecte terrain, Mobile Money validé) sont renvoyés au cœur **s'il sait les recevoir** ; sinon ils figurent sur la liste « à saisir dans le cœur » (décision A1 ; FR-155, FR-156). Le registre des créances de `paiement` n'est qu'un **miroir** alimenté par le cœur, pas un propriétaire (écart avec PRD-D FR-247). Réalise UJ-7.

**Conséquences (testables) :**
- Le cœur calcule les pénalités et les intérêts de retard (décision A4) ; le cœur fictif les calcule pour la démo. Prospera n'en calcule aucun et n'en affiche aucun sans la date de la dernière lecture du cœur (FR-2). La convention de la démo (pénalités = 15 % de la mensualité) n'est pas reprise.
- L'imputation est pénalités, puis intérêts, puis capital (paramétrable, décision A5). Un paiement anticipé réduit la durée ; un trop-perçu devient un crédit du client (FR-137). En cas d'écart entre l'imputation proposée par Prospera et celle du cœur, le cœur gagne et l'écart est signalé au GP.
- Un remboursement saisi reste « en attente du cœur » tant que le cœur n'a pas renvoyé le mouvement ; il n'est jamais compté deux fois (FR-2). Le dossier de recouvrement lit le reste dû du cœur, pas la somme des saisies de Prospera.
- Un remboursement saisi ou validé, en attente du mouvement du cœur, **suspend** la prochaine relance automatique de l'échéance concernée pendant 48 h (paramètre ; valeur du délai d'un remboursement sans mouvement du cœur, FR-159) [ASSUMPTION : suspension pendant l'attente, pour ne pas relancer un client qui a payé]. Passé le délai sans mouvement, la relance reprend et une alerte va au CPT.
- Un remboursement partiel suspend la relance sur le solde (PRD-D FR-116) ; le reste dû affiché est celui du cœur.

#### FR-210 : Le Mobile Money déclaré est validé par le comptable, et le rapprochement se fait à moins de 1 %

Un remboursement Mobile Money déclaré, et un virement sans référence, restent **EN_ATTENTE** jusqu'à la validation du CPT (décision A7 ; FR-140). Un paiement PI-SPI, irrévocable et confirmé par le fournisseur, ne demande pas cette validation. Le rapprochement rattache un paiement validé à son échéance quand |payé − échéance| ÷ échéance est inférieur à **1 %** (paramètre ; décision A6). Réalise UJ-7.

**Conséquences (testables) :**
- Un paiement de 52 300 FCFA sur une échéance de 52 000 FCFA (écart de 0,6 %) est rattaché automatiquement et l'échéance passe à « payée en attente du cœur ». Un paiement de 50 000 FCFA (écart de 3,8 %) va dans la **file de rapprochement du CPT**, qui le rattache, le scinde ou le range en crédit du client. **Il n'est jamais refusé** (PRD-D FR-172).
- Un paiement validé met fin aux relances ouvertes de l'échéance (statut de relance « clôturée ») ; un paiement rejeté, avec son motif, ne les arrête pas et l'agent est prévenu.
- Le déclarant ne valide jamais son propre paiement (FR-6). Les opérateurs et le pays sont une liste paramétrable ; changer d'opérateur ne demande aucun changement du module.
- L'IA aide le CPT à valider et à rapprocher (doublons, erreurs : FR-147) ; elle ne valide jamais seule.
- Un paiement Mobile Money en attente depuis plus de 24 h est en tête de la file du CPT et alerte le RA (FR-140).

#### FR-211 : Un dossier de recouvrement par prêt, ouvert à l'entrée en retard

Chez l'IMF, le dossier de recouvrement est ouvert **par prêt** (et non par client, défaut du noyau), car les statuts, le blocage et le plan d'étalement portent sur un dossier de crédit (écart tranché ci-dessous). La fiche du client regroupe ses dossiers. Le **jour de retard** se mesure sur l'échéance impayée la plus ancienne, à la date de lecture du cœur, en jours calendaires (décision D5). Réalise UJ-7.

**Conséquences (testables) :**
- Le dossier est ouvert au statut `EN_RETARD` quand une échéance est impayée depuis plus de 7 jours (paramètre ; défaut : 7 jours, cahier). Les relances préventives (J-3) et courtoises (J+1) ne demandent pas de dossier : elles partent du calendrier (FR-212).
- Le dossier affiche : prêt, client, GP, agence, zone, secteur d'activité, jours de retard, montants dus par composante (lus du cœur, avec la date de lecture), statut de recouvrement, prochaine action, agent assigné, score (FR-227).
- Un client avec deux prêts en retard a deux dossiers et une seule fiche ; une relance ne vise pas deux fois le même client le même jour : les messages sont regroupés en un seul (paramètre).
- Un prêt dont l'échéancier officiel manque n'ouvre pas de dossier et figure dans la liste « échéancier manquant » (FR-173).
- Les statuts sont dérivés du journal ou décidés par un rôle, selon FR-214 ; rien ne se saisit à côté.

#### FR-212 : Le calendrier de relances de l'IMF : J-3, J+1 à J+3, J+7, 3 échecs, J+90

L'IMF dispose d'une échelle d'escalade (PRD-D FR-114) dont les valeurs par défaut sont celles du cahier de terrain et collecte et du récit du PO. **Tout délai, canal et mode est un paramètre** (décision D11). Réalise UJ-7.

| Palier | Délai | Canal | Mode | Responsable |
|---|---|---|---|---|
| Préventif | J-3 | WhatsApp avec lien de paiement ; SMS en repli | AUTO | GP |
| Rappel courtois | J+1 | WhatsApp ; SMS en repli | AUTO | GP |
| Rappel par SMS | J+3, sans réponse sous 24 h | SMS | À VALIDER par le GP | GP |
| Relance ferme | J+7 | SMS puis appel | À VALIDER par le GP | GP |
| Mission terrain | J+7 | visite d'un agent (FR-203) | À VALIDER par le GP | GP, agent |
| Alerte au ROC | J+7 si le risque est élevé (score de recouvrement sous 50, paramètre) | cloche et e-mail | AUTO | ROC |
| Promesse non tenue | date promise dépassée | multicanal | AUTO ; GP notifié, ROC si récidive (FR-213) | GP, ROC |
| Proposition de contentieux | J+90, ou score sous 20 sans action | cloche | proposée au ROC (FR-219) | ROC |

**Conséquences (testables) :**
- Seuls J-3 et J+1 partent seuls ; **au-delà, le GP valide chaque envoi** avant qu'il parte (décision D11). Le SMS de J+3 est à valider [ASSUMPTION : lecture de D11, « au-delà de J+1 »]. L'IMF peut aussi couper l'envoi automatique : la relance est alors créée et attend le GP.
- Les envois automatiques partent à 6 h et à 14 h (paramètre) ; jamais en dehors de la fenêtre horaire de `notification`, ni vers un client qui a refusé le canal (FR-14, FR-88).
- Le canal par défaut est WhatsApp si le client répond à 60 % de ses messages ou plus (paramètre), sinon SMS ; après **trois échecs** de relance numérique (message non remis ou sans réponse), une mission terrain est créée (décision D11).
- Le ton monte avec le retard ; le gabarit est modifiable : « Bonjour {prénom}, votre échéance de {montant} FCFA du {date} est {statut}. Réglez maintenant : {lien de paiement}. Merci. » La mise en demeure n'est jamais envoyée sans validation humaine (FR-217).
- Un paiement total arrête les relances ; un paiement partiel les suspend sur le solde ; une promesse les suspend jusqu'à sa date (FR-213).
- Un test place des prêts à J-3, J+1, J+3, J+7 et J+10 : seuls J-3 et J+1 partent sans action du GP ; chaque autre palier attend son validateur.

#### FR-213 : Une promesse de paiement suspend les relances jusqu'à sa date

Le GP enregistre une promesse (montant, date, canal d'obtention) sur le dossier ; l'agent de terrain et le REC peuvent la saisir depuis la visite ou l'appel (PRD-D FR-118). Dès l'enregistrement, **les relances sont suspendues jusqu'à la date promise**. Réalise UJ-7.

**Conséquences (testables) :**
- Mawuli enregistre « Kodjo paiera 60 000 FCFA le 20 » : aucune relance ne part avant le 20, et la promesse figure dans le plan de l'agent et dans le dossier.
- À la date promise, la promesse devient `TENUE` si le paiement est reçu (mouvement du cœur ou paiement validé), `PARTIELLEMENT_TENUE` s'il est inférieur, `ROMPUE` sinon. Les statuts de la démo (`ACTIVE`, `NON_TENUE`, `PARTIELLE`) sont ramenés à ceux du noyau (`EN_ATTENTE`, `ROMPUE`, `PARTIELLEMENT_TENUE`) par une table de correspondance.
- Une promesse `ROMPUE`, après le délai de grâce de 24 h (PRD-D FR-118), déclenche une nouvelle relance et prévient le GP ; si la rupture dure 3 jours, ou si le client récidive, le ROC est prévenu (paramètre).
- Après deux promesses rompues, un accord écrit (pièce jointe) est exigé avant une nouvelle promesse ; la fiche du mauvais payeur s'ouvre (FR-222).
- Un paiement reçu pendant la suspension ne relance rien ; la suspension tombe à la date promise, que la promesse soit tenue ou rompue.

#### FR-214 : Les statuts de recouvrement, un second axe décidé par des rôles

Chaque prêt EN_GESTION en retard porte un **statut de recouvrement** : `EN_RETARD` → `EN_RECOUVREMENT` → `PLAN_ETALEMENT` / `REGULARISE` / `BLOQUE` → `CONTENTIEUX_JUDICIAIRE` / `PERTE_DEFINITIVE` (récit du PO). Contrairement à M19, où les statuts se dérivent du journal, ces transitions sont **décidées** par un rôle ou constatées par le système, et chacune est une entrée du journal (FR-9). Réalise UJ-7, UJ-8.

| Transition | Qui | Condition |
|---|---|---|
| → `EN_RETARD` | système | échéance impayée depuis plus de 7 jours (FR-211) |
| `EN_RETARD` → `EN_RECOUVREMENT` | ROC ou RA | un agent de recouvrement est assigné (FR-216) |
| → `PLAN_ETALEMENT` | ROC, avec l'accord signé du client | plan valide (FR-220) |
| → `REGULARISE` | système | le cœur confirme qu'aucune échéance n'est impayée ; pour un plan : trois échéances honorées |
| → `BLOQUE` | ROC seul, motif obligatoire | blocage manuel (FR-218) |
| `BLOQUE` → `EN_RECOUVREMENT` ou `REGULARISE` | ROC seul, motif obligatoire | déblocage (FR-218) |
| `BLOQUE` → `CONTENTIEUX_JUDICIAIRE` | ROC propose, **DG décide** | FR-219 |
| `BLOQUE` → `PERTE_DEFINITIVE` | ROC propose, **DG décide** | FR-221 |

**Conséquences (testables) :**
- Le statut de recouvrement s'affiche à côté du statut de crédit sur le dossier (FR-77) ; il n'ajoute aucun statut aux douze du dossier.
- Une transition hors du tableau est refusée par le serveur ; l'IA ne pose jamais un statut (FR-8).
- Un prêt `REGULARISE` qui retombe en retard rouvre un dossier `EN_RETARD` ; l'historique des cycles de retard est conservé (fiche du mauvais payeur, FR-222).
- Le jeu de démonstration contient au moins dix prêts dans chaque statut (FR-11).

#### FR-215 : Le ROC voit le réseau trié par PAR et descend jusqu'au dossier

Le ROC (et le DG) ouvre une vue du recouvrement du réseau : agences **triées par PAR décroissant**, avec PAR 1, 30 et 90 (cumulatifs, sur l'encours entier ; FR-173), encours en retard, taux de collecte du jour, promesses du jour et honorées, agents assignés. Il **descend** agence → agent → client → dossier, avec les mêmes filtres que le pilotage : région, agence, zone, agent, statut de recouvrement, score (sous 30, de 30 à 60, plus de 60), ancienneté du retard, **secteur d'activité** (FR-7). Réalise UJ-8.

**Conséquences (testables) :**
- Le tri est par PAR, pas par impayés comme dans la démo. Le PAR du réseau est la somme pondérée de celui des agences, au franc près (FR-174).
- Chaque niveau n'est lisible que dans le périmètre du rôle : le RA ne voit que son agence ; le REC que ses zones ; l'AUD lit sans modifier (FR-5).
- Une **alerte de concentration** signale une agence dont plus de 30 % du PAR tient à un agent ou à une zone (paramètre ; calibré sur les données de l'IMF ; défaut de démo : 30 %). Les seuils d'alerte de PAR sont ceux de FR-178.
- Une fiche d'agent de recouvrement montre ses dossiers, sa collecte du jour rapportée à l'objectif, ses promesses honorées et son statut (`BON`, `VIGILANCE`, `CRITIQUE`) selon des seuils paramétrables (calibrés sur les données de l'IMF ; défauts de démo : taux de collecte 55 % et 75 %).
- Les chiffres sont lus du cœur et des relances de Prospera, avec la date de lecture ; aucun n'est une constante.
- La carte des zones en retard utilise Google Maps (PRD-D FR-121) ; un client sans position figure dans la liste.

#### FR-216 : Le ROC définit la stratégie et affecte les agents de recouvrement par zone

Le ROC définit, par agence, une **stratégie de recouvrement** (priorités de la semaine, objectifs, ressources) et **affecte** des agents de recouvrement (REC) **par zone** (décision D9). Le RA peut réaffecter dans son agence. L'IA propose le projet de stratégie (FR-228) ; le ROC le modifie et le valide. Réalise UJ-8.

**Conséquences (testables) :**
- Une affectation lie un REC à une ou plusieurs zones du module `reseau` pour une période ; un REC ne voit que les dossiers de ses zones affectées (FR-5). Le ROC affecte dans tout le réseau ; le RA seulement dans son agence ; le REC ne s'affecte pas lui-même.
- Une zone sans REC affecté est listée ; un dossier qui passe `EN_RECOUVREMENT` sans agent assigné est refusé (FR-214).
- Une stratégie validée a un auteur, une date, un périmètre et un motif d'écart par rapport à la proposition de l'IA (FR-8). Une stratégie non validée n'engage rien.
- La capacité d'un REC est un paramètre (dossiers par jour) ; au-delà, les dossiers vont dans « reporté à demain » avec le motif « capacité » (PRD-D FR-120).
- La démo, où les « agents de recouvrement » sont des agents terrain et où la réaffectation n'est qu'un texte, n'est pas reprise.

#### FR-217 : Chaque action de recouvrement est tracée avec son résultat

Les actions possibles sont : appel, visite au domicile, visite sur l'activité, plan d'étalement (FR-220), mise en demeure, saisie de garantie (FR-223), transfert au contentieux (FR-219). **Chaque action est tracée avec son résultat** (récit du PO). Réalise UJ-7, UJ-8.

**Conséquences (testables) :**
- Une action porte : auteur, rôle, date, canal, compte rendu, résultat (paiement, paiement partiel, promesse, refus, injoignable, plan demandé), montant promis, pièce jointe. Une action sans résultat n'est pas clôturée ; un résultat « promesse » crée la promesse (FR-213).
- Une visite de recouvrement porte sa position et, si l'agent le veut, une photo ; un appel porte sa durée et son résultat (PRD-D FR-113 pour le journal).
- La **mise en demeure** est décidée par le ROC. Prospera produit le courrier sur un gabarit de l'IMF, signé par le DG [ASSUMPTION : signature du DG, d'après la ligne « rédigée, signature DG » de la démo] ; l'envoi en recommandé se fait hors Prospera et sa date est enregistrée. Elle n'est jamais partie sans validation humaine (PRD-D FR-114). Il n'y a pas de rôle « juriste » : un juriste de l'IMF peut rédiger hors Prospera, et le courrier est joint au dossier [ASSUMPTION].
- Une action non tracée n'existe pas ; le journal ne peut ni être modifié ni être supprimé (FR-9).
- Un résultat d'action qui ajoute une promesse réarme la surveillance de la date promise.

#### FR-218 : Le blocage d'un dossier, par le ROC seul, avec motif, suspend les demandes du client et de ses cautions

Le ROC **bloque** un dossier : le statut de recouvrement passe à `BLOQUE`, avec un **motif obligatoire**. Seul le ROC bloque ; seul le ROC **débloque**, aussi avec un motif (récit du PO). Un dossier `BLOQUE` **suspend toute nouvelle demande de crédit du client et de ses cautions** (décision D1). Il n'y a **pas de blocage d'agence**. Réalise UJ-8.

**Conséquences (testables) :**
- Le blocage est **manuel** : ni l'IA, ni la règle des 60 jours de M19 ne bloquent. L'interrupteur `blocage-automatique-au-seuil` du module est **éteint** chez l'IMF.
- Le blocage porte sur le **dossier de crédit** ; le module publie un fait `recouvrement.credit.bloque` portant le dossier, le client et ses cautions (écart avec M19, où le blocage porte sur le tiers). Le module `credit` le lit : une nouvelle demande du client ou d'une de ses cautions est refusée à la création (`CREDIT_BLOQUE`, FR-30), au serveur, quel que soit le canal. Une demande déjà en cours est suspendue : ni décision, ni décaissement tant que le blocage dure.
- Un client dont une caution est bloquée ne perd pas ses prêts en cours ; seules ses nouvelles demandes sont suspendues.
- Chaque blocage et déblocage est une entrée du journal : auteur (ROC), motif, date, dossier. Le GP, le RA, le client (par le message prévu au FR-88) et le DAF sont notifiés ; le DAF reçoit la proposition de provision calculée au barème du classement (FR-176), pas un taux fixé par ce module.
- Le motif ne peut ni être modifié ni supprimé. Un déblocage sans motif est refusé (`MOTIF_REQUIS`).
- Les « dossiers bloqués plus de 48 h » de la démo (demandes en instruction) sont renommés « demandes en attente depuis plus de 48 h » et relèvent du crédit (FR-83), pas du recouvrement.
- Hors connexion, aucun blocage ni déblocage n'est possible (FR-204).

#### FR-219 : À J+90, le passage au contentieux est proposé au ROC ; le judiciaire exige le DG

À J+90 (ou score de recouvrement sous 20 sans action ; paramètres, cahier), Prospera **propose** au ROC le transfert au contentieux ; il ne le décide jamais seul (décision D2). Le ROC accepte ou refuse ; s'il accepte, il pose `BLOQUE` (FR-218), rassemble le dossier complet, et le **DG** décide du passage au `CONTENTIEUX_JUDICIAIRE`. Réalise UJ-7.

**Conséquences (testables) :**
- La proposition s'affiche dans la file du ROC avec : jours de retard, montant dû (valeur du cœur), actions tentées et leur résultat, promesses, garanties, score. Un refus du ROC écrit un motif et la proposition revient à J+120 (paramètre) [ASSUMPTION : cadence de rappel].
- Le transfert enregistre : motif, dossier complet, garanties, mise en demeure et sa date (FR-217), jugement visé. Le DG ne peut pas décider sans la proposition du ROC ; le ROC ne peut pas transférer sans le DG (FR-6).
- Le transfert est envoyé au cœur (FR-152) ; la classe de créance est celle du barème (FR-175).
- Le contentieux judiciaire reste une décision humaine : un test vérifie qu'aucun chemin, même celui d'un modèle ou d'une règle, ne fait passer un dossier à ce statut sans les deux décisions.

#### FR-220 : Le plan d'étalement est limité, unique par prêt, et envoyé au cœur

Le ROC propose un **plan d'étalement** à un client en retard : un nouvel échéancier, de **12 mois au plus** de plus que le prêt (paramètre), **un plan par prêt** ; un second plan passe par le comité (décision D4). Le client donne son accord signé (pièce jointe). Réalise UJ-7.

**Conséquences (testables) :**
- Le nouvel échéancier reste cohérent avec le produit d'origine : taux, périodicité, TEG sous le plafond d'usure (FR-10, FR-36). Un plan dont le TEG dépasse le plafond est refusé.
- Le plan est **envoyé au cœur**, dont l'échéancier devient l'échéancier officiel (FR-152, FR-162). Tant que le cœur n'a pas confirmé, le dossier garde son statut et affiche « plan en attente du cœur ».
- Le prêt passe `PLAN_ETALEMENT` à la confirmation et est classé « rééchelonné » ; il reste « en souffrance » jusqu'à **trois échéances honorées** (FR-175). Il passe alors `REGULARISE`.
- Les pénalités pendant le plan sont calculées par le cœur ; Prospera n'en gèle aucune [ASSUMPTION : sort des pénalités laissé au cœur, non décidé].
- Un second plan sur le même prêt est refusé à la création ; le ROC peut saisir le comité, qui suit la procédure du comité (FR-56).
- Un plan non tenu (échéance impayée) rouvre le dossier `EN_RETARD` (FR-214).

#### FR-221 : La perte définitive est proposée à 24 mois, décidée par le DG, envoyée au cœur

À **24 mois d'impayé** (paramètre), Prospera **propose** la perte définitive. Le ROC la **propose** au DG, qui **décide** ; au-dessus d'un seuil, la décision passe devant le conseil (décision D3). Réalise UJ-8.

**Conséquences (testables) :**
- La perte ne se décide jamais seule : ni l'IA, ni la règle de 24 mois n'y suffisent (FR-176).
- Le seuil de passage au conseil est un paramètre de l'IMF [ASSUMPTION : aucune valeur par défaut, l'IMF la fixe avant la mise en service].
- La décision est **envoyée au cœur**, qui passe la créance en perte (FR-152) ; Prospera ne comptabilise rien (FR-2).
- Le statut devient `PERTE_DEFINITIVE` ; le client est **inéligible** à tout nouveau crédit ; une dérogation du DG, motivée et tracée, est la seule voie (FR-84).
- Un prêt radié ne se clôture pas par le chemin de la clôture ordinaire (FR-75). Un paiement reçu après la perte est enregistré normalement (le cœur fait foi) et la fiche l'indique.

#### FR-222 : La fiche du mauvais payeur est ouverte par règle, par client, et se ferme

Prospera ouvre une **fiche de mauvais payeur par client** (décision D7) : au premier retard de plus de **30 jours**, ou après **deux promesses non tenues** (paramètres). Elle se ferme après **6 mois sans retard** (paramètre). Elle contient : identité (nom, téléphone, adresse, position, photo, avec consentement), prêts et produits, situation (impayé, échéances impayées, ancienneté, dernière échéance payée), historique des paiements, retards antérieurs (cycles précédents compris), promesses et leur fiabilité, actions menées, score de recouvrement et ses facteurs (FR-227), garanties et cautions et leur état (FR-223), agents impliqués, rang dans le réseau. Réalise UJ-8.

**Conséquences (testables) :**
- Le ROC et le DG voient toutes les fiches ; le RA celles de son agence ; le GP celles de son portefeuille ; le REC celles de ses zones ; l'AUD en lecture. Chaque consultation est journalisée (FR-9).
- Un client à 31 jours de retard a une fiche ; à 30 jours, non. Un client avec deux promesses `ROMPUE` en a une, même à 10 jours de retard.
- Une fiche fermée reste consultable (historique) mais sort de la liste ; si un nouveau retard dépasse 30 jours, la même fiche se rouvre.
- Un client en retard sur un prêt a sa fiche même s'il est à jour sur un autre.
- La fiche remplace le booléen « mauvais payeur » de la démo, qui n'avait aucune règle.

#### FR-223 : L'appel des cautions et la saisie de garantie sont tracés

Le recouvrement peut **appeler une caution** et **saisir une garantie**. Le ROC décide ; chaque étape est tracée (FR-217). Cautions et garanties sont celles du dossier (FR-41, FR-42). Réalise UJ-8.

**Conséquences (testables) :**
- Une caution a un état : `ACTIF`, `APPELE`, `INJOIGNABLE`, `REALISE`, `REFUSE` ; une garantie : `ACTIF`, `REALISE`, `INSUFFISANT`, `MANQUANT` (démo). Un appel de caution enregistre la date, le moyen, la réponse ; une caution injoignable est signalée au ROC.
- Une saisie de garantie (stock, matériel, bien) enregistre : type, évaluation, accord du client, date, pièce. Le ROC décide ; l'exécution (huissier, enlèvement) se fait hors Prospera ; le produit de la réalisation est reçu par le cœur et lu (FR-2).
- La caution est elle-même un client dont les demandes sont suspendues quand le dossier est `BLOQUE` (FR-218) ; elle est informée de l'appel par un message (FR-88).
- Le dépôt de garantie est restitué ou imputé par le cœur ; Prospera ne manipule aucun solde de garantie.
- L'exemple de la démo (« caution restante 120 000 FCFA ») est recalculé depuis les valeurs du dossier, jamais saisi.

#### FR-224 : La relance du groupe solidaire vise d'abord la membre, puis le groupe

Quand une membre d'un groupe solidaire est en retard, la relance vise **d'abord la membre**, puis le **groupe** selon la règle de solidarité de l'IMF (paramètre ; FR-74). Le dossier de recouvrement s'ouvre sur le prêt de la membre ; il s'ouvre aussi au niveau du groupe quand la solidarité est invoquée (PRD-D §6.0, groupe solidaire). Réalise UJ-2.

**Conséquences (testables) :**
- À J+7 sans paiement ni promesse de la membre, les autres membres et la responsable du groupe reçoivent un message ; le statut de paiement de la membre passe à `RETARD` (ou `EXCLU` selon la règle, FR-74).
- La balance en retard d'un groupe est la somme de celles de ses membres (PRD-D §6.0). Le recouvrement ne répartit pas l'impayé : le cœur détient le solde de chaque membre (FR-74).
- Un blocage posé sur le dossier d'une membre suspend ses nouvelles demandes et celles de ses cautions, qui sont les autres membres du groupe (FR-218).
- Une promesse faite par le groupe pour une membre est une promesse de la membre, avec le nom de la personne qui l'a faite.

#### FR-225 : La clôture du prêt et le nouveau cycle, côté recouvrement

Un dossier de recouvrement se ferme quand le **cœur confirme un solde nul** (décision D10) : le prêt passe `REGULARISE`, puis le crédit le clôture (FR-75) ; le cœur restitue le dépôt de garantie et libère les cautions. Le recouvrement garde l'historique des retards pour la fiche (FR-222). Réalise UJ-1, UJ-7.

**Conséquences (testables) :**
- La fermeture a la source « cœur » dans le journal ; aucun rôle ne ferme un dossier à la main.
- Après une `PERTE_DEFINITIVE`, **aucun nouveau cycle** sans dérogation du DG (FR-76, FR-221).
- Un prêt passé par un plan d'étalement suit la règle de nouveau cycle du crédit (FR-76) : un retard de plus de 30 jours au cycle précédent exclut le renouvellement ; le recouvrement n'ajoute aucune règle.
- Un client dont un dossier est `BLOQUE` ne peut pas repartir sur un nouveau cycle (FR-30) ; au déblocage, la règle de FR-76 s'applique.
- Le recouvrement n'envoie rien au cœur à la clôture : le cœur la constate.

#### L'IA (recouvrement)
Règles communes (FR-8) : provenance affichée ; l'IA propose, l'humain décide ; un écart exige un motif ; rien ne bloque si l'IA est indisponible ; le moteur est l'IA commune. **Aucune IA ne bloque un dossier, ne décide un contentieux, une perte ni un étalement** (FR-218, FR-219, FR-220, FR-221). Tant qu'un modèle n'existe pas, la capacité est servie par des **règles explicables** et le dit à l'écran (décision F6).

#### FR-226 : L'IA règle le déclenchement, la priorité, le canal, le moment et le message des relances

L'IA commune propose au GP, au REC et au ROC, pour chaque dossier ou échéance : le **déclenchement** selon le **profil de retard** du client (payeur tardif habituel, première fois, saisonnier, en difficulté), l'**ordre de priorité** par risque, le **canal** (WhatsApp, SMS, appel, visite) et le **moment** de l'envoi, la **probabilité de succès par canal**, et un **message pré-rédigé**. **Entrées :** historique des paiements et des retards, promesses, réponses aux relances par canal, score de recouvrement (FR-227), saison et secteur d'activité (FR-8), consentements (FR-14). **Sortie :** liste de relances ordonnée avec motif, canal, moment, probabilité, texte. Réalise UJ-7.

**Conséquences (testables) :**
- La règle de base (v0) est : priorité = (1 − probabilité de paiement) × montant dû × log(jours de retard + 1) × (1 + nombre de promesses non tenues) (cahier) ; canal WhatsApp si le taux de réponse du client est de 60 % ou plus, sinon SMS ; trois échecs, mission terrain (FR-212). La proposition d'un modèle remplace la règle seulement avec sa provenance.
- **L'IA ne déclenche jamais un message hors du calendrier de l'IMF** (FR-212) : elle propose le canal, le moment et le texte ; le GP valide les paliers « à valider ». Pour J-3 et J+1, la règle du calendrier s'applique ; l'IMF peut activer « canal et moment choisis par la proposition de l'IA » pour ces paliers (paramètre ; défaut : éteint) [ASSUMPTION].
- Les probabilités de succès par canal sont calculées par client ; sans historique, elles affichent « pas assez de données », jamais les taux constants de la démo (WhatsApp 68 %, SMS 41 %).
- Le message pré-rédigé est modifiable avant l'envoi ; le ton croît avec le retard ; il est en français et ne contient aucune donnée que le client n'a pas consenti à recevoir (FR-15). Un changement de formulation n'exige aucun motif ; un changement de canal ou de moment par rapport à la proposition est enregistré avec son motif.
- IA commune absente : la liste est triée par la règle de base et le gabarit du palier sert de message ; les relances partent selon le calendrier.

#### FR-227 : Le score de recouvrement est la probabilité de récupérer, explicable, avec ses poids

Le **score de recouvrement** (0 à 100) et la **probabilité de récupérer** le dû sous 30 jours sont calculés pour tout dossier de retard de plus de 7 jours (cahier). Le score est une **somme pondérée de facteurs, dont les poids sont affichés** ; la probabilité suit la règle explicable du noyau (PRD-D FR-117), pas un modèle (décision D8). Chaque facteur est affiché avec sa valeur et sa contribution. Réalise UJ-8.

**Conséquences (testables) :**
- Facteurs et poids de départ, totalisant **100 %** : historique de paiement 25, ancienneté du retard 20, réactivité aux relances 15, capacité financière 15, flux Mobile Money 10, garanties 10, saisonnalité 5 [ASSUMPTION : poids de la démo, dont la ligne « capacité financière » était doublée pour un total de 105 % ; à calibrer sur les données de l'IMF]. Les poids sont des paramètres versionnés.
- Un test vérifie que le total des poids vaut 100 % et que le score se recalcule à la main à partir des facteurs affichés.
- Verdict : probabilité de 50 % ou plus, « probable » ; de 30 à 49 %, « incertain » ; sous 30 %, « peu probable sans mesure coercitive ». Le score est rouge sous 35, orange sous 50 (paramètres). **Récupérable estimé** = reste dû (valeur du cœur) × probabilité ÷ 100.
- Le score alimente : la priorité des relances (FR-226), l'alerte au ROC à J+7 (sous 50), la proposition J+90 (sous 20, FR-219), la fiche du mauvais payeur (FR-222), la file du jour (PRD-D FR-120). Il n'a **aucun effet automatique sur un statut**.
- Ce score est **distinct** du score du client à l'octroi (paiement 40, capacité 30, activité 20, terrain 10, FR-124). Les deux ne se mélangent jamais dans un affichage.
- Les scores sont gardés 5 ans (paramètre) ; l'analyse s'affiche en moins de 5 secondes.
- IA commune absente : la règle explicable v0 sert ; la mention « règle, version, date » remplace « modèle ».

#### FR-228 : L'IA propose la stratégie par agence et analyse le comportement de retard

L'IA commune prépare au ROC un **projet de stratégie par agence** : priorités de la semaine (missions de terrain, relances des promesses du jour, coaching d'agents, réaffectation de REC), gain attendu et raison. Elle analyse aussi le **comportement de retard** d'un client, d'un secteur d'activité et d'une zone : causes probables (saison, conjoncture, flux Mobile Money, pic de dépenses), tendance, clients dont le comportement change. **Entrées :** retards, promesses, collecte, flux, PAR par agence, zone et **secteur d'activité**, données macro et saisonnières datées et citées (FR-8). **Sortie :** stratégie modifiable et analyse rédigée. Destinataires : ROC, RA, GP. Réalise UJ-8.

**Conséquences (testables) :**
- La stratégie est un **projet** : elle n'engage rien avant la validation du ROC (FR-216). Le ROC qui s'écarte écrit un motif.
- Chaque priorité affiche son gain attendu en FCFA et sa raison ; les cartes « méthode actuelle », « rendement », « méthode suggérée » de la démo sont recalculées sur les données, jamais saisies.
- Une analyse de comportement cite ses sources et leur date ; une source de plus de 90 jours est signalée « ancienne » (FR-8).
- L'analyse par secteur lit le même PAR par secteur que `risque-par` (FR-174, FR-180) : un test compare les deux.
- Aucune proposition ne suspend l'octroi d'une agence : il n'y a pas de blocage d'agence (FR-218) ; l'IA peut seulement le signaler au ROC comme point à discuter.
- IA commune absente : la vue du ROC affiche les chiffres sans projet de stratégie ni analyse rédigée.

#### FR-229 : L'IA propose des scripts de relance et des conseils par rôle

L'IA commune propose, pour un dossier, des **scripts** d'appel et de visite adaptés au profil du client et à l'étape (premier retard, promesse rompue, caution à appeler), et des **conseils par rôle** (GP, REC, RA, ROC) dans un « Copilot recouvrement » en lecture seule : questions en langage courant, chiffres sourcés (décision F3). **Entrées :** dossier, historique d'échanges, score (FR-227), analyse (FR-228), règles de l'IMF (FR-212). **Sortie :** script, conseil, réponse avec ses sources. Réalise UJ-7, UJ-8.

**Conséquences (testables) :**
- Chaque chiffre du Copilot cite sa source (cœur avec sa date, journal, règle) ; le Copilot **n'agit pas** : il ne relance, ne bloque et ne modifie rien.
- Le script ne propose jamais un abandon de créance, un taux ou un plan que le rôle n'a pas le droit d'offrir : l'agent ne négocie pas d'abandon (PRD-D FR-114).
- Le conseil adressé au GP, au REC, au RA et au ROC diffère ; un rôle ne reçoit jamais un conseil fondé sur une donnée hors de son périmètre (FR-5).
- Les scripts et les gabarits sont modifiables par l'IMF ; un script modifié garde sa provenance (« modèle de l'IMF »).
- IA commune absente : les scripts de la bibliothèque de l'IMF (gabarits) s'affichent ; le Copilot est « bientôt » à l'écran, sans simulation (PRD-D FR-2).

#### Écarts tranchés (recouvrement)
| M19 (PRD-D §6.2) | IMF | Décision |
|---|---|---|
| Blocage sur le **tiers**, automatique à plus de 60 jours ou au plafond ; levé par le DAF seul | Blocage d'un **dossier**, manuel, par le ROC seul, avec motif ; levé par le ROC | Blocage de dossier par le ROC ; interrupteur automatique éteint ; effet sur les demandes du client et de ses cautions (FR-218, D1) |
| Statuts dérivés du journal | Statuts nommés `EN_RETARD` à `PERTE_DEFINITIVE`, décidés | Second axe, transitions décidées (FR-214) |
| Un dossier par tiers | Statuts, blocage et plan par prêt | Un dossier par prêt, regroupés sur la fiche client (FR-211) |
| Échelle J-3, J+1, J+7, J+15, J+30, blocage | J-3, J+1 à J+3, J+7, 3 échecs, J+90 | Échelle de l'IMF en donnée (FR-212, D11) |
| Visite à J+15, À VALIDER | Mission terrain à J+7 | Paramètre ; J+7 à valider par le GP |
| Mise en demeure à J+30, palier « direction » | Décision du ROC, courrier signé du DG, envoi hors Prospera | Action tracée (FR-217) |
| Contentieux proposé si probabilité sous 40 | J+90 ou score sous 20, proposé au ROC, DG pour le judiciaire | FR-219 (D2) |
| Reste dû : `paiement` propriétaire de la créance | Le cœur fait foi | Registre de `paiement` = miroir du cœur (FR-209) |
| Confirmation de PI-SPI sans action humaine | Mobile Money validé par le comptable | PI-SPI sans validation ; Mobile Money et virement sans référence validés (FR-210, A7) |
| Probabilité par règle sur le score du point de vente | Score de recouvrement à facteurs, poids affichés | FR-227 (D8) |
| PAR en tranches et PAR cumulatif (incohérence interne) | PAR 1, 30, 90 cumulatifs sur l'encours entier | Cumulatif seul (FR-173) |
| Pas de plan d'étalement, de perte, de caution, de clôture | Plan, perte, cautions, clôture | FR-220, FR-221, FR-223, FR-225 (D3, D4, D10) |
| Statuts de promesse `EN_ATTENTE`, `TENUE`, `PARTIELLEMENT_TENUE`, `ROMPUE` | `ACTIVE`, `NON_TENUE`, `PARTIELLE` en démo ; `PROMISE_*` au cahier | Statuts du noyau, table de correspondance (FR-213) |
| Rôles `RECOUVREMENT`, commercial | REC, GP, ROC, RA, DG | Rôles IMF (§2.1) |

---

### 7.3 ★ Tableau de bord, pilotage et équipes (`dashboard` M28, `equipe` M21)

**Ce qui s'applique tel quel.** Le noyau du tableau de bord (PRD-D §6.8) : un cockpit est un assemblage de lectures de modules, un élément dont le module manque affiche « non installé » et jamais 0 (PRD-D FR-165) ; la variation se calcule avec sa période de comparaison affichée (PRD-D FR-166) ; l'alerte et la décision à trancher sont des objets uniques que le tableau de bord liste sans les posséder (PRD-D FR-167, PRD-D FR-168) ; le rapport de direction est généré, conservé, envoyé par `notification` en PDF réel (PRD-D FR-169, PRD-D FR-170, PRD-D FR-171). Le noyau des équipes (PRD-D §6.3) : registre de KPI de poste, objectifs fixés par le supérieur, score borné à 100, plafond d'atteinte de 130 %, coaching enregistré, aucune fuite de périmètre (PRD-D FR-122, PRD-D FR-123, PRD-D FR-124, PRD-D FR-125). Les règles du §4 (périmètres FR-5, seuils FR-3 et FR-4, secteur FR-7, IA FR-8, trace FR-9) valent partout.

**Ce que la démo montre.** Un cockpit par rôle, dont les valeurs sortent de séries simulées sur six mois, des variations qui sont des multiplicateurs (revenus = collecte × 0,22 ; profit net = revenus × 0,33 ; épargne = encours × 0,283), un bouton « N alertes critiques » sans action, des exports simulés, un rapport « IA » pré-écrit, un Copilot qui répond sur des jeux fictifs, une descente dont l'échelon « région » n'est jamais alimenté, et un écran d'équipe où le DG n'a aucune saisie d'objectif. Rien de cela n'est repris tel quel ; chaque exigence ci-dessous dit ce qui le remplace. Les chiffres de la démo ne se recoupent pas d'un écran à l'autre (905 ou 188 emprunteurs selon l'écran) : le jeu de démonstration et le cœur fictif en sont l'unique source (FR-13).

#### FR-230 : Chacun des seize rôles a son tableau de bord, composé en données

Chaque rôle de l'IMF (§2.1) ouvre un tableau de bord composé pour lui, lu sur le serveur dans son périmètre (FR-5). La composition est une donnée de paramétrage, pas du code. Aucun écran ne s'intitule « Vue DG » pour un autre rôle : la « direction commerciale » et la « direction des engagements » sont des **vues** du DG (onglets Commercial et Crédit), pas des comptes (§2.1). Réalise UJ-3.

**Composition initiale** (valeurs de la démo ; éléments lus des modules, chacun avec sa date de lecture du cœur quand il porte de l'argent, FR-2) :

| Rôle | Éléments du tableau de bord |
|---|---|
| DG | les douze chiffres de FR-231 ; onglets Crédit, Commercial, Financier, Opérationnel, Terrain ; cartes d'agence ; alertes ; décisions à trancher ; synthèse du DG (FR-236) ; matrice des postes ; Copilot |
| DAF | trésorerie et liquidité (lues du cœur), résultat, coût du risque, coefficient d'exploitation ; tableau Budget et Rentabilité (FR-253) ; prévision de trésorerie à 7 jours (FR-254) ; rapports BCEAO à valider ; décisions « en attente de votre signature » |
| ROC | pipeline des dossiers ; file de validation ROC ; PAR 1, 7 et 30 jours ; impayés ; dossiers bloqués ; recouvrement du réseau trié par PAR ; performance des agents de recouvrement ; contrôle quotidien (§7.5) |
| RA | huit chiffres de l'agence (emprunteurs, encours, PAR 30, taux de remboursement, collecte du jour, couverture des agents, transactions, liquidité lue du cœur) ; classement des agents du jour ; écart à l'objectif (FR-241) ; équipe |
| CC | ma file de dossiers ; délais ; alertes d'instruction (FR-48) ; calendrier des visites ; moi contre l'équipe des CC |
| GP | mon portefeuille (clients, encours, PAR 30, recouvrement, retards) ; vieillissement des retards ; promesses du jour ; relances ; boîte des réponses WhatsApp (FR-247) |
| AT, COLL | ma journée (à visiter, à collecter, en retard, objectif, atteinte) ; tournée ; prospects ; caisse du jour pour COLL |
| COM, RCC | prospects, conversion, nouveaux clients contre objectif ; zones sous-couvertes ; calendrier des agents ; promesses et retards de la collecte |
| RSQ | PAR par agence, zone, secteur et produit ; signaux faibles ; concentration ; dossiers au-dessus du seuil d'avis |
| REC | file de recouvrement de ses zones affectées (§7.2) |
| AUD | anomalies, écarts de caisse, dossiers incomplets, opérations hors horaires, violations de procédure, conformité GPS ; piste d'audit et journal des accès |
| CPT | paiements à valider, file de rapprochement, listes « à saisir dans le cœur », écarts de caisse de son agence, décaissements en espèces à autoriser |
| COMM | campagnes, acquisition, conversion, budget (§7.4) |
| ADMIN_IMF | santé de l'installation, comptes et rôles à valider, mises à jour, sauvegardes (§7.9) ; **aucun chiffre métier** |

**Conséquences (testables) :**
- Un test ouvre le tableau de bord de chacun des seize rôles de la démonstration et vérifie qu'il ne contient que des éléments de son périmètre.
- Un test ouvre chaque élément métier avec ADMIN_IMF et obtient un refus sans donnée (FR-5).
- Un élément dont le module source est absent affiche « non installé » ; un cockpit sans aucun module installé affiche l'invitation à installer (PRD-D FR-171).
- Aucun chiffre n'est une constante : changer un paiement, une échéance ou une visite change le chiffre (FR-13).

#### FR-231 : Le DG lit douze chiffres qui engagent une décision

Le DG lit douze chiffres en trois familles, chacun avec sa valeur, sa variation calculée (période de comparaison affichée), son statut (SAIN, ATTENTION, CRITIQUE), son seuil et son bouton d'action vers l'écran concerné. Ils remplacent les huit chiffres du distributeur (PRD-D FR-166). Réalise UJ-3.

| Famille | Chiffre | Source |
|---|---|---|
| Portefeuille | encours des prêts | cœur (lu) |
| Portefeuille | clients actifs | cœur et `microfinance` |
| Portefeuille | PAR 30 et PAR 90, en encours | `risque-par` (FR-173) |
| Portefeuille | provisions proposées contre provisions comptabilisées, et écart | `risque-par` (FR-176), cœur |
| Activité | décaissements du mois | cœur, `credit` |
| Activité | collecte du mois, en % de l'objectif | `collecte`, cœur, `equipe` |
| Activité | encours d'épargne | cœur (lu) |
| Activité | encaissements numériques, en % des encaissements | `paiement`, `collecte` |
| Rentabilité | produits d'intérêts du mois | cœur (lu) |
| Rentabilité | résultat net du mois | balance du cœur, si elle est livrée |
| Rentabilité | coût du risque | `risque-par` |
| Rentabilité | liquidité disponible, en semaines d'autonomie | cœur (lu) |

**Conséquences (testables) :**
- Les formules de la démo (revenus = collecte × 0,22, profit net = revenus × 0,33, épargne = encours × 0,283, transactions = décaissements × 54,7) sont écartées. Un chiffre que le cœur ne fournit pas (résultat net sans balance, liquidité sans trésorerie) affiche « en attente des données du cœur » (FR-150), jamais une estimation déguisée.
- Chaque seuil de statut est un paramètre de l'IMF, calibré sur ses données (FR-4) ; défauts de la démo : PAR 30 d'agence rouge au-dessus de 10 % (seuil BCEAO), orange au-dessus de 8 % (seuil interne) ; collecte verte à 90 % de l'objectif, orange à 70 % ; score de santé d'agence vert à 80, orange à 65.
- Un chiffre CRITIQUE crée une alerte (FR-234). Un chiffre SAIN n'en crée pas.
- Chaque chiffre porte la date de la dernière lecture du cœur (FR-2). Le délai entre un événement et son effet sur le tableau de bord est mesuré (promesse « piloter en temps réel », §1) ; la cible est un rafraîchissement toutes les 5 minutes (paramètre).
- Export CSV du bandeau, dans le périmètre du lecteur (PRD-D FR-171).

#### FR-232 : Le DG descend du réseau jusqu'au client, par la géographie

Le DG (et tout rôle, dans son périmètre) descend **réseau → région → agence → agent → client → prêt ou transaction**, par un clic sur une carte, un chiffre ou une ligne de classement. Chaque échelon filtre tous les chiffres de l'écran ; un fil d'Ariane le dit. L'échelon « région » existe (il n'est jamais alimenté dans la démo) : il vient du module `reseau` (§7.7). Réalise UJ-3.

**Conséquences (testables) :**
- Sur le jeu de démonstration, le DG descend de « réseau » à « région », à l'agence de Kara, à un agent, à un client, puis à son prêt, et la somme des encours des enfants égale l'encours du parent (FR-13).
- Un RA ne descend que dans son agence ; un clic hors périmètre rend un refus sans donnée (FR-5).
- Une agence créée dans la démonstration (FR-12) apparaît dans la descente, sans autre manipulation.
- Un échelon sans enfant (région sans agence) affiche une liste vide, pas le réseau entier.

#### FR-233 : Le même pilotage se lit par secteur d'activité

Chaque chiffre de portefeuille (encours, PAR, décaissements, retards, provisions, collecte) se lit **aussi par secteur d'activité**, avec la même mécanique de descente que par géographie : **réseau → secteur → sous-secteur → agence → agent → client** (décision F2, FR-7). Les deux descentes se **croisent** : on filtre l'agriculture, puis on descend par agence, ou l'inverse. Le secteur est une donnée de premier rang, et c'est aussi ce que Prospera fournit à l'IA commune (FR-8). Réalise UJ-3.

**Conséquences (testables) :**
- Sur le jeu de démonstration, le DG filtre « Agriculture » et lit son PAR 30, son encours et sa part du portefeuille ; il descend à l'agence où le retard se concentre (UJ-3).
- La part d'un secteur dans le portefeuille est comparée à un seuil de concentration (paramètre ; défaut : 30 % dans la démo du DG, 25 % dans celle de l'audit : une seule valeur est retenue par l'IMF, FR-177).
- Un client sans secteur n'existe pas (FR-7) : la ligne « sans secteur » est vide, et un test la vérifie.
- La somme des secteurs égale le réseau, au franc près.

#### FR-234 : Une alerte a un destinataire, un délai et une remontée

Une alerte est l'objet unique de PRD-D FR-14 (domaine, sévérité, titre, détail, responsable, règle source, heure, statut OUVERTE, PRISE_EN_CHARGE, RESOLUE, lien vers l'objet). Elle est créée par une règle ; son **destinataire est le rôle du périmètre concerné** ; si personne ne la prend en charge sous **48 heures** (paramètre, décision F12), elle **remonte au supérieur** avec la mention « remontée ». Le bouton « N alertes critiques » du DG est le nombre réel d'alertes critiques ouvertes de son périmètre, et il ouvre la liste (PRD-D FR-167). Réalise UJ-3.

**Conséquences (testables) :**
- Une alerte d'agence va au RA de cette agence, pas au DG d'abord ; non prise en charge au bout de 48 h, elle apparaît chez le supérieur (chaîne : AT, COLL, COM, CC, GP, CPT vers RA ; RA vers ROC pour le crédit et le recouvrement, sinon DG ; ROC, RSQ, DAF vers DG) [ASSUMPTION : chaîne de remontée à valider par le PO].
- Chaque transition (prise en charge, résolution avec motif, réouverture, remontée) est tracée (FR-9).
- Un rôle ne voit que les alertes de son périmètre ; l'AUD les lit toutes, sans pouvoir les traiter.
- Les alertes de risque de `risque-par` (FR-179) et les écarts de caisse (FR-145) utilisent cet objet et cette remontée, sans mécanisme à part.

#### FR-235 : Les déclencheurs d'alerte sont des règles, aux seuils calibrés

Les déclencheurs ci-dessous sont des règles enregistrées. Leurs **seuils sont calibrés sur les données de l'IMF** après la reprise, proposés, validés par le rôle qui possède l'alerte, et recalculés chaque trimestre (FR-4, décision E5) ; la colonne « défaut » est la valeur de la démo, utilisée tant que le calibrage n'a pas eu lieu. Réalise UJ-3.

| Déclencheur | Défaut de démo (paramètre ; calibré sur les données de l'IMF) | Destinataire |
|---|---|---|
| PAR d'une agence au-dessus du seuil | 10 % (BCEAO) ; 8 % (interne) | RA, ROC, DG |
| PAR d'une agence en hausse | +2 points contre le mois précédent | RA, ROC, DG |
| PAR d'une zone | au-dessus du seuil, ou +2 points | RA, DG |
| Collecte d'une agence sous l'objectif | moins de 80 % | RA, DG |
| Dossier bloqué dans une étape | 48 heures | ROC, CC |
| Écart de performance d'un agent | moins de 25 % sous l'objectif projeté | RA (FR-241) |
| Concentration d'un secteur | 30 % du portefeuille | DG, RSQ, AUD |
| Écart de caisse | caisse physique différente de la caisse système | RA, DAF, AUD, CPT |
| Rapport BCEAO en retard | échéance de la catégorie de supervision dépassée | DAF, DG |
| Lead non assigné | plus de 24 heures | COMM, RCC |
| GPS incohérent ou coupé | trajet impossible, coupure prolongée | RA, AUD |
| Opération hors horaires | hors des heures de service | AUD |
| Échéancier contractuel différent de l'officiel | tolérance de FR-162 | ROC, GP |

**Conséquences (testables) :**
- Chaque seuil affiche sa source : « valeur de démonstration », « calculé sur vos données du … » ou « fixé par … le … » (FR-4).
- L'IMF règle chaque seuil pour le réseau, puis par agence.
- Un seuil calculé n'entre en vigueur qu'après validation (FR-4).
- Les retards d'échéance (J-3, J+1 à J+3, J+7, J+90) ne sont pas des alertes mais des règles de relance (§7.5, §7.2).

#### FR-236 : Décisions à trancher, synthèse du DG et rapport de direction

Le tableau de bord du DG et du DAF liste les **décisions à trancher** (décision du ROC, séance de comité, dérogation, perte définitive, rapport BCEAO à valider, rôles sensibles à valider, décaissement en espèces) ; trancher appelle le module propriétaire de la décision, qui l'enregistre (PRD-D FR-168). Le **rapport de direction**, qui porte la **synthèse du DG**, est généré chaque matin à une heure paramétrable (défaut : 06:00), conservé avec son historique, téléchargeable en PDF et envoyé par `notification` (PRD-D FR-169, PRD-D FR-170). Réalise UJ-3.

**Conséquences (testables) :**
- Sections du rapport (valeurs de la démo, reprises) : analyse de situation ; portefeuille et PAR ; activité (décaissements, collecte) ; rentabilité (lue du cœur) ; risque et concentration par secteur ; conformité ; équipes et agences ; alertes immédiates (les alertes réelles, FR-234) ; points forts et points d'attention ; recommandations priorisées 1 à 3 avec impact et délai ; prévisions et comparaison avec le mois précédent, calculée.
- Une section dont le module est absent dit « non installé » ; une rubrique de rentabilité sans balance du cœur dit « en attente des données du cœur ».
- Le rapport indique sa provenance : « règle et gabarit », version, date ; il ne se dit « IA » que si un modèle l'a rédigé, avec son nom, sa version et sa date (FR-8). La mention « économie estimée » de la démo est retirée tant qu'elle n'est pas mesurée.
- Le DG envoie le rapport au DAF ; le DAF le trouve dans son courrier ; le statut passe à LU avec l'heure (PRD-D FR-170).
- Le bouton « Exporter rapport DG » de la démo, qui n'exporte rien, est remplacé par un PDF réel.

**L'IA.** La rédaction narrative du rapport peut être servie par l'IA commune (module Pulse, finalité `rapport-de-direction`). Entrées : les chiffres du périmètre du DG, déjà calculés. Sortie : le texte de la synthèse. Destinataire : le DG. Sans modèle, le gabarit de règles produit le rapport (FR-8).

#### FR-237 : Le Copilot est réel dès le premier jour, en lecture seule, chiffres sourcés

Un **Copilot** par rôle répond en langage courant à des questions sur le périmètre de l'utilisateur, **dès le premier jour** (décision F3). Il est servi par `assistant-service` (moteur : l'IA commune, famille Agents métier). Il **lit seulement** : il n'exécute aucune action, ne décide rien et ne modifie aucune donnée. Chaque question reçoit en contexte le rôle, le périmètre, **la page ouverte et l'entité consultée** (le client, le dossier, l'agence, l'agent). Chaque réponse cite, pour **chaque chiffre**, sa source (module), sa date de calcul et son périmètre. Réalise UJ-3.

**Conséquences (testables) :**
- Cinq questions suggérées par profil de rôle, et la saisie libre. Questions types du DG : priorités du jour ; évolution du PAR du réseau ; agence en alerte ; liquidité et caisse ; actions recommandées de la semaine ; concentration par secteur. Équivalents pour RA, GP, AT, COM, RCC, COMM, DAF.
- Une réponse dont un chiffre n'a pas de source affichée est un défaut de recette : un test balaie un lot de questions et vérifie que chaque nombre cité porte source, date et périmètre.
- Si la donnée manque, le Copilot répond « Données non disponibles pour {entité} » ; il ne la devine jamais.
- Il ne donne jamais une donnée hors du périmètre du lecteur : un RA qui interroge une autre agence reçoit un refus, sans donnée (FR-5). ADMIN_IMF n'a pas de Copilot métier (FR-5) ; l'AUD en dispose en lecture seule de la piste d'audit [ASSUMPTION : la démo exclut l'auditeur du Copilot ; le PO tranche].
- Il propose des liens vers l'écran concerné (« Voir le dossier », « Ouvrir l'agence »), sous le contrôle de la table d'accès du rôle ; ces boutons n'agissent pas à la place de l'utilisateur.
- Aucune décision réglementaire ou financière n'est prise par le Copilot ; une proposition de décision porte la mention « proposition » (FR-8).
- Si le moteur de langage tourne hors des serveurs de l'IMF, le Copilot n'est actif qu'avec le consentement de l'IMF à la transmission de données à l'IA commune (FR-8, FR-15) ; sans lui, l'emplacement affiche « bientôt » et les questions suggérées restent servies par des règles [ASSUMPTION : lieu d'exécution du moteur de langage à trancher avec l'IA commune].
- L'indisponibilité du Copilot ne bloque aucun parcours (FR-8).

**L'IA.** Copilot (module Agents métier). Entrées : les lectures des modules dans le périmètre de l'utilisateur et le contexte de page. Sortie : un texte avec chiffres sourcés et liens. Destinataire : l'utilisateur qui pose la question.

#### FR-238 : Les priorités du jour et les anomalies d'agence sont proposées, avec leur provenance

Chaque matin, le tableau de bord propose à chaque rôle ses **priorités du jour** (les cinq actions qui comptent le plus dans son périmètre) et, au DG, au ROC et au RA, les **anomalies d'agence** (comportement d'une agence qui s'écarte de ses pairs : PAR, collecte, décaissements, retards, concentration). Réalise UJ-3.

**Conséquences (testables) :**
- Chaque priorité cite l'objet concerné (dossier, client, agent, agence) et la règle ou le modèle qui l'a levée, avec version et date (FR-8) ; elle s'ouvre sur l'écran concerné.
- Une anomalie d'agence compare l'agence à des agences de taille voisine (plus ou moins 20 % d'encours, paramètre) sur cinq chiffres : PAR, collecte en % de l'objectif, conversion des prospects, nouveaux clients, visites par agent.
- Un humain qui ignore une priorité ou une anomalie écrit un motif ; il est renvoyé comme correction à l'IA commune (FR-8).
- Sans modèle, des règles à seuil servent ces deux capacités et le disent (« règle »), jamais « IA ».

**L'IA.** Priorités du jour et anomalies d'agence (module Agents métier ; la comparaison entre agences s'appuie sur Pulse). Entrées : indicateurs d'agence, d'agent et de portefeuille. Sortie : liste ordonnée. Destinataires : DG, ROC, RA.

#### FR-239 : Une seule source de vérité pour les chiffres

Deux écrans qui montrent la même chose montrent le même nombre. Le tableau de bord ne possède aucune donnée d'argent : il lit le cœur par `coeur-sfd` et les modules de Prospera par leurs faits (§4.2 ; PRD-D FR-15).

**Conséquences (testables) :**
- Un test recalcule chaque chiffre de FR-231 depuis les données brutes du cœur fictif et trouve le même nombre (FR-13).
- Une valeur lue au cœur plus ancienne que la fraîcheur attendue affiche « données du … » en orange (FR-159).
- Le tableau de bord n'expose jamais ses propres calculs comme des soldes officiels (FR-2).

#### FR-240 : Un seul barème d'équipe : 90, 75, 60

Le **statut d'un score de poste** suit le barème unique du module partagé (décision F5) : EXCELLENT à 90 et plus, BON à 75 et plus, À SURVEILLER à 60 et plus, CRITIQUE en dessous (paramètres ; PRD-D FR-123). Les statuts de la démo de l'IMF (BON à 85, NORMAL à 70, DEGRADE) disparaissent ; le statut DEGRADE à moins de 60 % de recouvrement devient un KPI du poste, pas un second système. Le score est la moyenne des taux d'atteinte, pondérée par les poids, plafonnée à 130 % par KPI et bornée à 100. Réalise UJ-3.

**KPI de poste de l'IMF**, au registre de PRD-D FR-122 (poids à 100 par poste ; **valeurs initiales proposées, paramétrables par poste**, décision F5) [ASSUMPTION : la démo ne donne aucun poids ; les poids ci-dessous sont des propositions à valider par le PO] :

| Poste | KPI et poids |
|---|---|
| RA | PAR 30 de l'agence 25 (inversé) ; collecte contre objectif 25 ; recouvrement des échéances 20 ; couverture des visites 15 ; nouveaux clients 15 |
| CC | dossiers instruits dans le délai 30 ; qualité d'instruction (dossiers revenus du ROC ou du comité pour pièce manquante) 25 (inversé) ; taux de décisions du ROC conformes à l'avis 20 ; score moyen des dossiers 15 ; PAR 90 de ses dossiers à 12 mois 10 (inversé) |
| GP | PAR 30 du portefeuille 30 (inversé) ; recouvrement 25 ; promesses tenues 20 ; visites faites contre prévues 15 ; clients à risque traités 10 |
| AT | visites faites contre planifiées 25 ; nouveaux clients 25 ; prospects convertis en clients 20 ; qualité de saisie (compte rendu et photo) 15 ; couverture de sa zone 15 |
| COLL | collecte contre objectif 35 ; clients collectés contre prévus 20 ; écart de caisse 25 (inversé) ; remise au guichet le jour même 20 |
| COM | nouveaux clients 30 ; prospects actifs 20 ; conversion en dossier soumis 30 ; rapidité de première réponse 20 |
| RCC | nouveaux clients de l'équipe 25 ; collecte de l'équipe contre objectif 25 ; conversion des prospects 20 ; agents sous-performants 15 (inversé) ; prospects non assignés 15 (inversé) |
| ROC | PAR 30 du réseau 30 (inversé) ; délai de décision 25 (inversé) ; dossiers bloqués 20 (inversé) ; taux de récupération du recouvrement 25 |

**Conséquences (testables) :**
- Chaque KPI se calcule depuis les données de ses modules (PRD-D FR-122) ; sans objectif fixé, il affiche « objectif non fixé », pas 100 %.
- Les poids d'un poste doivent sommer à 100 : refus `POIDS_INVALIDES`.
- Le DG n'a pas de KPI de poste ; il lit la matrice de tous les postes (PRD-D FR-124). REC suit les KPI de recouvrement du module partagé (§7.2).
- Un poste CRITIQUE crée une alerte chez son supérieur (FR-234).
- Le score vu du RA, du ROC ou du DG ne contient aucun champ de rémunération (FR-242).

#### FR-241 : Objectifs par agence et par agent, écart à l'objectif

Le RA fixe, avant le 5 de chaque mois (paramètre), les objectifs de ses agents : visites, collecte, PAR maximal du GP (par exemple 8 %). Le RCC fixe ceux de ses commerciaux : nouveaux clients et conversion. Le DG et le ROC fixent ceux des agences. Un objectif est une donnée : `agent` ou `agence`, `kpi`, `période`, `valeur`, `fixé par`. Il se saisit à l'écran, ce que la démo ne permet pas. Réalise UJ-3.

**Conséquences (testables) :**
- Le RA ne fixe que les objectifs de son agence, le RCC ceux de son équipe : un RA qui fixe l'objectif d'un agent d'une autre agence est refusé (FR-5).
- Une valeur par défaut est proposée (moyenne du mois N-1 plus croissance, ou portefeuille multiplié par le taux de collecte) ; le supérieur la valide ou la change ; la proposition affiche sa provenance (FR-8).
- **Écart à l'objectif** : projection de fin de mois = réalisé ÷ jours écoulés × jours du mois ; écart prévisionnel en % de l'objectif. Niveaux : au-dessus de l'objectif, vert ; de 1 à 10 % sous l'objectif, jaune (affichage) ; de 11 à 25 %, orange (recommandation de coaching) ; au-delà de 25 %, rouge (alerte au RA, coaching obligatoire). Exemple : objectif 120 visites, 65 à J20, 97,5 projetées, écart de 22,5 soit 19 % : orange.
- Le statut d'un objectif (EN_AVANCE, DANS_LES_TEMPS, EN_RETARD, CRITIQUE) se calcule sur le même écart.
- Les objectifs d'une agence apparaissent, avec le réalisé, dans le tableau de bord du DG et du RA ; modifier un objectif en cours de mois est tracé et ne change pas les mois clos (FR-9).

#### FR-242 : Classement, fiche agent, rémunération privée, pas de paie

Un RA, un RCC, le ROC ou le DG classe et compare les agents de son périmètre (PRD-D FR-124). La **fiche agent** présente le portefeuille, les clients à risque (alerte au-delà d'un seuil), le PAR, le recouvrement, la conformité GPS, la dernière visite, les objectifs du mois contre le réalisé, l'évolution sur six mois, le journal d'activité terrain et l'historique des visites. Le classement d'agences par le DG et le **benchmark entre agences** (hebdomadaire, FR-238) complètent la vue. Réalise UJ-3.

**Conséquences (testables) :**
- Un RA sans agent rattaché voit une liste vide, jamais toute l'équipe (PRD-D FR-124).
- Il n'y a **pas de rôle PAIE** et pas de calcul de commission ni de masse salariale au jour 1 (décision F8, PRD-D FR-8). **Chaque agent voit sa seule prime d'objectifs** ; aucun autre rôle ne lit une rémunération individuelle (droit `equipe:remuneration:consulter`, par défaut réservé à l'agent pour lui-même). Un test d'un RA ne trouve aucun champ de rémunération dans la réponse du serveur.
- Les badges (or, argent, bronze) et le classement ne se montrent que sur la vue de l'agent et de son supérieur ; les défis, badges et séries de la démo (gamification) sont « bientôt » [ASSUMPTION : la gamification n'est pas dans les réponses du PO ; elle reste « bientôt »].
- Aucune « vue DG » n'apparaît chez un autre rôle (PRD-D FR-7) : un test ouvre `/equipe` avec chaque rôle.
- Chaque fiche affiche la provenance de ses points forts et de ses axes de progrès, calculés et jamais écrits à la main (PRD-D FR-123).

#### FR-243 : L'IA des équipes : prévision du PAR par zone, coaching, comparaison entre agences

L'IA commune propose aux responsables d'équipe : (1) la **prévision du PAR par zone**, à 30, 60 et 90 jours, avec sa confiance ; (2) des **recommandations de coaching** pour un agent sous-performant, après analyse des causes (zone difficile, portefeuille à risque, faible collecte) ; (3) la **comparaison entre agences** et le benchmark des pratiques ; (4) l'écart de performance visualisé (FR-241). Le RA décide. Réalise UJ-3.

**Conséquences (testables) :**
- Chaque recommandation de coaching affiche les points de la règle ou les facteurs du modèle qui ont joué, avec version et date (PRD-D FR-125, FR-8) ; planifier un coaching crée un plan lisible de l'agent (PRD-D FR-125).
- La prévision du PAR par zone est une lecture de `risque-par` (FR-181), pas un second calcul.
- Les zones prévues à risque sont signalées au RA et au DG (FR-234).
- Un agent n'est jamais classé ni jugé par l'IA seule : l'humain qui écarte une recommandation écrit un motif (FR-8).

**L'IA.** Prévision du PAR par zone (module Risque) ; recommandations de coaching et comparaison entre agences (modules Agents métier et Pulse). Entrées : indicateurs d'agent, de zone et d'agence, secteur d'activité (FR-7). Sortie : liste et courbe. Destinataires : RA, RCC, ROC, DG.

#### FR-244 : Comptes, droits et journal d'accès

L'écran « Utilisateurs » permet à ADMIN_IMF de créer les comptes, de changer rôle et agence, de suspendre, de réinitialiser le mot de passe et d'activer la double authentification ; le DG valide les rôles sensibles (DAF, AUD, ROC) ; il y a deux personnes à chaque création ou retrait de rôle (FR-5, décisions F7 et F9). La liste des rôles créables par rôle est un paramètre. Les comptes d'agents terrain naissent par une invitation SMS (voir §7.7). Réalise UJ-9.

**Conséquences (testables) :**
- La démo ne permet de créer ni DAF, ni AUD, ni COMM, ni RSQ : les seize rôles sont créables selon la règle de FR-5.
- Les indicateurs (comptes actifs, suspendus, sans double authentification, connexions du jour) sont calculés, jamais constants.
- Le **journal d'accès** (qui a consulté quoi) est complet, infalsifiable et lisible par l'AUD seul (FR-9) ; ADMIN_IMF lit le journal des **actions d'administration**, pas des données métier.
- Un changement de rôle ou de périmètre s'applique à la requête suivante (PRD-D FR-6).

---

### 7.4 Marketing et acquisition (`marketing` M23)

**Ce qui s'applique tel quel.** L'objet Campagne et son entonnoir compté sur des faits (PRD-D FR-142, PRD-D FR-143 pour les taux) ; l'envoi de masse par `notification` avec échantillon, fenêtre horaire, reprise et interruption (PRD-D FR-147) ; l'exclusion des membres en retard et le plafond de messages par destinataire (PRD-D FR-148, PRD notification FR-N33) ; le consentement et le désabonnement sont ceux de `notification` (« STOP » éteint tout envoi commercial). Les combos de stock, les promotions fournisseurs et le studio réseaux sociaux n'ont pas d'objet chez l'IMF.

**Périmètre retenu (décision F10).** Campagnes, prospects, acquisition, retour sur la marge d'intérêt nette attendue. Le NPS, la présence digitale (fiche Google, page sociale, site), la fidélisation (ambassadeurs, parrainage) et le budget marketing par poste sont « bientôt » ; leurs onglets de la démo n'agissent pas.

#### FR-245 : Les campagnes de l'IMF, créées, validées, lancées pour de vrai

COMM crée, planifie, lance, met en pause ou arrête une campagne ; le DG la valide au-dessus d'un seuil de budget (paramètre) ; l'envoi part pour de vrai (PRD-D FR-142, PRD-D FR-147). Les types de campagne de l'IMF : renouvellement de prêt, réactivation d'épargne, nouveau produit, parrainage, nurturing. Le message est composé pour un segment avec {prénom}, {produit}, {montant} ; un humain le valide avant l'envoi ; l'IA ne lance jamais seule. Réalise UJ-1.

**Conséquences (testables) :**
- Une campagne se crée à la main (nom, produit, segment, canal, dates, budget) ; les transitions suivent PRD-D FR-142 ; un budget dépassé met la campagne en pause et lève une alerte (FR-234).
- **Exclusions.** Un client est exclu de tout envoi commercial s'il a un retard au-delà du seuil d'alerte (défaut : J+30), un dossier BLOQUE par le ROC, ou le statut « à risque » ; les exclus restent visibles avec leur motif. Un message de recouvrement n'est pas un message commercial et n'est pas plafonné. Sans `recouvrement` ou sans lecture du cœur, l'exclusion est « non évaluée », jamais « aucun exclu » (PRD-D FR-148).
- **Plafond** : 2 messages commerciaux par client et par semaine, toutes campagnes et règles confondues (paramètre ; repris de PRD-D FR-148) [ASSUMPTION : le cahier de la démo ne fixe pas de plafond ; à valider par l'IMF].
- **Retour sur investissement** : (marge d'intérêt nette attendue des prêts décaissés attribués à la campagne − coût de la campagne) ÷ coût. La marge d'intérêt nette attendue = intérêts contractuels attendus − perte attendue du prêt (`risque-par`, FR-181) [ASSUMPTION : base du calcul à valider par le DAF ; la démo calcule revenu généré ÷ budget, qui n'est ni une marge ni un gain net et s'affiche sous le nom « retour brut »].
- **Attribution** : un décaissement, une ouverture de compte ou un dépôt d'épargne est attribué à la campagne si le client a reçu un message délivré, avec un produit de l'offre, pendant la campagne plus 7 jours (paramètre) ; en cas de chevauchement, la campagne la plus récente.
- Un client qui a dit « STOP » ne reçoit plus aucun envoi : aucun envoi vers un opt-out (critère bloquant). Les envois sont horodatés et archivés ; le droit à l'oubli s'applique à un prospect.
- Objectif de performance du module (cahier de la démo) : l'envoi à 500 prospects part en moins de 10 minutes, sans doublon.

#### FR-246 : Les prospects et l'acquisition appartiennent au réseau commercial

Le **prospect** est tenu par le réseau commercial (COM, AT, RCC), et `marketing` le lit ; il n'est pas un objet de la marque (décision F10). Un prospect a quatre statuts : NOUVEAU, QUALIFIE, CONVERTI, DISQUALIFIE (hors cible, ou injoignable après 3 tentatives, paramètre). Il vient du terrain, d'une campagne, d'un parrainage ou d'un portail. Convertir un prospect crée la fiche client (`microfinance`, FR-115), puis la demande (`credit`, FR-31) ; le prospect converti garde le lien vers le client. Réalise UJ-1.

**Conséquences (testables) :**
- Chaque prospect reçoit son score à la création ; le score est composé de cinq facteurs aux poids paramétrables, valeurs initiales : zone couverte 25 %, secteur porteur 25 %, montant cohérent 20 %, rapidité de réponse 15 %, source 15 % (cahier de la démo). Priorité : 80 à 100, appeler sous 24 h ; 60 à 79, sous 48 h ; 40 à 59, dans la semaine ; moins de 40, relance de fond.
- Un prospect non assigné au-delà de 24 heures lève une alerte à COMM et RCC (FR-235).
- Un commercial ne voit que les prospects de sa zone (FR-5) ; le DG voit l'entonnoir du réseau : messages reçus, prospects qualifiés, rendez-vous, dossiers soumis, clients gagnés, tous comptés sur des faits.
- Les chiffres constants de la démo (312 conversations, 47 prospects, CAC de 18 400 FCFA) sont écartés ; le coût d'acquisition d'un client se calcule (coût des campagnes ÷ clients gagnés).
- Le prospect ne devient pas un client sans KYC validé par un autre que le créateur (FR-120).

#### FR-247 : Le chatbot WhatsApp est « bientôt » ; au premier jour, des relances sortantes et une boîte de réponses

Le **chatbot WhatsApp** qui qualifie un prospect en cinq questions (prénom, activité, quartier, montant souhaité, téléphone) est « **bientôt** », sans date, et ne se simule pas (décision F4, PRD-D FR-2). Au premier jour, l'IMF dispose de : (1) des **relances sortantes** par WhatsApp (J-3 avec lien de paiement, rappels) par `notification` (§7.7) ; (2) des **réponses entrantes** des clients et prospects routées vers la **boîte du GP** (ou du COM pour un prospect) par le module `notification` (FR-N41 à FR-N45). Réalise UJ-7.

**Conséquences (testables) :**
- Le bouton et l'onglet « Chatbot » de la démo affichent « bientôt » ; aucun chiffre de conversation n'est affiché tant qu'aucune conversation n'a eu lieu.
- Une réponse WhatsApp d'un client en retard arrive dans la boîte de son GP avec le contexte de la relance (le message auquel il répond).
- Le premier message d'un prospect inconnu est routé vers la boîte d'un commercial de l'agence la plus proche [ASSUMPTION : règle d'affectation par la zone du numéro non connue ; à défaut, la boîte du RCC].
- Le numéro WhatsApp Business est celui de l'IMF ; ses modèles de message sont soumis à l'approbation avant la mise en service (§7.7, FR-258).

#### FR-248 : L'IA du marketing : segmentation, ciblage, notes de prospects, propositions de campagnes

L'IA commune (module Relation client) propose : (1) une **segmentation** comportementale des clients (clusters sur des données agrégées et anonymisées, sans donnée personnelle dans le cluster) ; (2) le **ciblage** d'une campagne (quels clients, quel canal, quel moment) ; (3) la **note de chaque prospect** (FR-246) ; (4) des **propositions de campagnes** (renouvellement pour les bons payeurs, réactivation pour les comptes dormants, nouveau produit) ; (5) les **zones de prospection** sous-couvertes, avec le potentiel (voir le terrain, §7.1, et FR-128). Réalise UJ-1.

**Conséquences (testables) :**
- Une proposition de campagne affiche segment, canal, message pré-rédigé, impact attendu et provenance ; COMM la valide, l'ajuste ou l'écarte avec un motif (FR-8).
- Le client en retard, au dossier BLOQUE ou ayant retiré son consentement n'est jamais dans une proposition (FR-245, FR-15).
- Une segmentation ne sort pas des serveurs de l'IMF sans le consentement de FR-15 ; sans consentement, elle tourne sur les seules données de l'IMF (FR-8).
- Sans modèle, des règles servent la note de prospect (FR-246) et le ciblage, et le disent.

**L'IA.** Segmentation, ciblage, notes de prospects, propositions de campagnes (module Relation client ; zones de prospection : Agents métier). Entrées : clients, prospects, historique de campagnes, carte de couverture, secteur d'activité. Sortie : segments, listes ordonnées, propositions. Destinataires : COMM, RCC, COM.

#### FR-249 : Ce qui reste « bientôt » dans le marketing

Le NPS, la **présence digitale** (fiche de géolocalisation, page sociale, site web), la **fidélisation** (rétention, ambassadeurs, parrainage suivi, clients à risque d'attrition), le **budget marketing par poste**, les **défis et badges** commerciaux et l'onglet « institutionnel » de la démo sont « **bientôt** », sans date (décision F10 ; PRD-D FR-2). Le coût et le budget d'une campagne, eux, sont réels (FR-245). Réalise UJ-1.

**Conséquences (testables) :**
- Le tableau de bord de COMM n'affiche, pour ces rubriques, qu'un emplacement « bientôt » ; aucun chiffre constant de la démo (NPS 72, rétention 87 %, 538 contacts) n'est repris.
- La **couverture du territoire** (pénétration, prospects non couverts, zones vierges) n'est pas « bientôt » : elle est servie par `reseau` et par les zones de prospection (FR-255, FR-248).
- Aucun bouton de ces rubriques ne simule une action.

---

### 7.5 Automatisations et support (`automatisations` M26, `support-client` M03)

**Ce qui s'applique tel quel.** Le moteur de règles d'automatisation : règle = objet enregistré, trois modes AUTO, A_VALIDER, SUGGESTION, garde-fous transverses, file d'arbitrage, exécutions réelles, journal (PRD-D FR-157 à FR-164). Les règles sont **définies par les modules métier** ; `automatisations` est le moteur.

#### FR-250 : Les règles de l'IMF sont des données, et le blocage d'un dossier reste humain

L'IMF ajoute à PRD-D FR-157 les règles suivantes, fournies par leur module (valeurs de démarrage, paramétrables) :

| Règle | Module propriétaire | Mode |
|---|---|---|
| rappel d'échéance à J-3, WhatsApp avec lien de paiement | `recouvrement` | AUTO |
| rappel courtois à J+1, puis SMS à J+3 | `recouvrement` | AUTO à J+1 ; A_VALIDER par le GP ensuite (décision D11) |
| relance ferme et mission terrain à J+7 ; alerte au ROC si le risque est élevé | `recouvrement` | A_VALIDER par le GP |
| promesse non tenue : nouvelle relance, escalade si le client récidive | `recouvrement` | A_VALIDER |
| passage au contentieux à J+90 | `recouvrement` | SUGGESTION au ROC (décision D2) |
| membre sans opération depuis un délai (paramètre) | `microfinance` | SUGGESTION au GP |
| bon payeur : rappel discret et offre de renouvellement | `credit` | A_VALIDER |
| suggestion de réduire le plafond d'octroi d'un client ou d'une agence | `credit` | SUGGESTION |
| paiement Mobile Money en attente de validation depuis plus de 24 h | `paiement` | alerte au CPT |

**Conséquences (testables) :**
- **Écart avec PRD-D FR-158 et PRD-D FR-119.** Le blocage automatique du crédit, seule exception AUTO du distributeur, **n'existe pas chez l'IMF** : **seul le ROC bloque ou débloque un dossier, avec un motif obligatoire** (§4, récit §4.7). La règle de retard prolongé est une SUGGESTION au ROC, jamais AUTO ; un test tente de passer cette règle en AUTO et reçoit `MODE_AUTO_INTERDIT`.
- Les relances du calendrier suivent les horaires d'envoi paramétrables (défaut : 6 h et 14 h, décision D11) et s'arrêtent à l'encaissement ou à une promesse enregistrée jusqu'à sa date.
- Une règle qui engage de l'argent (rééchelonnement, remise de pénalités), une remise ou une mise en demeure n'est jamais AUTO (PRD-D FR-158).
- Sans `notification`, une règle à canal apparaît « non installé » (PRD-D FR-157).
- Les règles de relance sont décrites dans le recouvrement (§7.2) ; ce module n'en est que le moteur.

#### FR-251 : Le support client est inscrit, sans écran au premier jour

Le module `support-client` (M03) est **inscrit pour la complétude**, comme chez le distributeur (PRD-D §6.9) : la démo de l'IMF n'a aucun écran de support. Les seules traces sont, dans le « contrôle quotidien » du ROC, les compteurs « tickets d'incident » et « disponibilité du système ». Ses écrans sont à concevoir et sont hors du premier jour ; ses boutons sont « bientôt », sans date.

**Conséquences (testables) :**
- Tant que le module n'est pas installé, le compteur « tickets d'incident » du ROC affiche « non installé », jamais 0.
- Le support que Money Vibes rend à l'IMF (incident, mise à jour) passe par le tunnel ouvert par le client (FR-269), pas par ce module.
- Aucune exigence propre à l'IMF n'est posée avant le cadrage du module ; aucun numéro n'est réservé.

---

### 7.6 Comptabilité : export des écritures (`finance-transactions` M22)

La comptabilité n'est pas une priorité de l'IMF (décision du PO, récit §3). Le cœur tient la comptabilité officielle et les écritures (FR-2). **Ce qui ne s'applique pas** de PRD-D §6.4 : les écritures de vente, de TVA, de factures d'achat, de run fournisseurs et les ordres de paiement aux fournisseurs (PRD-D FR-129 à FR-135, FR-138 à FR-141), qui ne concernent ni un prêt ni l'IMF ; le vocabulaire IMF du module (plan comptable des SFD de l'UEMOA, provision pour créances en souffrance, états réglementaires de la BCEAO) est celui du tableau de PRD-D §6.4. Ce qui reste : un export, et une lecture de trésorerie.

#### FR-252 : Au mieux, un export des écritures vers le cœur

Prospera n'est pas un grand livre : il ne tient ni écriture officielle, ni report à nouveau, ni clôture légale (PRD-D §6.4). **Au mieux**, il prépare, pour les faits que seul Prospera connaît, des **écritures proposées** exportées vers le cœur qui les comptabilise : provisions proposées (FR-176), remises d'espèces des collecteurs, frais de campagne. Le plan comptable du cœur est un paramètre de l'installation. Ce module n'est pas exigé au jour 1 : tant qu'il n'est pas livré, ses boutons sont « bientôt » (PRD-D FR-2). Réalise UJ-5.

**Conséquences (testables) :**
- Une écriture proposée est équilibrée (débit égal crédit) ou refusée `ECRITURE_DESEQUILIBREE` (PRD-D §6.4) ; elle n'est jamais présentée comme comptabilisée avant le retour du cœur.
- Les remboursements, décaissements et dépôts sont comptabilisés **par le cœur** (FR-2, FR-155) : Prospera n'en exporte aucune écriture, ce qui évite le doublon.
- Un export est un fichier ou un échange par `coeur-sfd` (FR-157) : Prospera tire, jamais de port entrant (§7.9).
- Sans `coeur-sfd`, l'export est « non installé » ; le téléchargement du fichier reste possible.

#### FR-253 : Pas de contrôle de gestion ; le DAF garde son tableau Budget et Rentabilité

Le module `controle-gestion` (M25) **n'est pas installé** chez l'IMF (décision F11) : il n'y a pas de rôle de contrôleur de gestion, et le DAF porte cette fonction. Le DAF lit, dans son tableau de bord (FR-230), un tableau **Budget et Rentabilité** : rentabilité par agence, coût par dossier, coût de collecte, coefficient d'exploitation, coût d'acquisition d'un client, et écart entre un budget saisi et le réalisé lu du cœur. Réalise UJ-3.

**Conséquences (testables) :**
- Le **budget** est saisi par le DAF, par agence et par poste, versionné, et ne change pas les périodes closes (FR-9) [ASSUMPTION : le budget est une donnée de `finance-transactions` ; la démo n'a aucun budget saisi].
- Le réalisé vient du cœur ; sans balance du cœur, la rentabilité affiche « en attente des données du cœur » (FR-150).
- Sans budget saisi, l'écart affiche « budget non saisi », jamais 0.
- Les prévisions glissantes, les budgets figés par comité et le rapport au comité du module `controle-gestion` (PRD-D FR-150 à FR-156) ne sont pas fournis ; ils sont « bientôt ».

#### FR-254 : L'IA du DAF : prévision de trésorerie à 7 jours et perte attendue, sur les données du cœur

Le DAF lit une **prévision de trésorerie à 7 jours** (entrées : échéances attendues, collecte attendue, décaissements prévus ; sorties : décaissements, remboursements d'épargne attendus) et la **perte attendue** du portefeuille, tout calculé sur les données lues du cœur. Réalise UJ-5.

**Conséquences (testables) :**
- Chaque prévision affiche sa provenance, sa version, sa date, la date de la dernière lecture du cœur et sa confiance (FR-8, PRD-D FR-137) ; le jour du pic de sortie est identifié.
- La perte attendue est celle de `risque-par` (FR-181) : un seul calcul, lu ici.
- Le DAF n'agit pas depuis la prévision : le rééquilibrage de caisse entre agences se lit et ne s'exécute pas (FR-149).
- Sans lecture récente du cœur, la prévision affiche « données du … » et n'est pas recalculée sur des données périmées (FR-165).

**L'IA.** Prévision de trésorerie à 7 jours et perte attendue (modules Risque et Pulse ; finalités `prevision-de-cash` et `perte-attendue`). Entrées : échéanciers officiels, historique de collecte, trésorerie du cœur. Sortie : courbe sur 7 jours et montant. Destinataire : DAF.

---

### 7.7 Modules cadrés : réseau, paiement, notification, connecteurs

**Règles de lecture.** Ces modules ont déjà leur PRD, leur spine et leur manifeste ; ce PRD n'en réécrit rien. Chaque fiche dit ce qui s'applique tel quel, puis les **écarts de l'IMF**, chacun devenu une exigence. Un écart est **à porter au PRD du module** : son propriétaire l'amende ou le refuse ; tant que ce n'est pas fait, l'exigence tient ici et se code dans le module qui la porte, jamais à sa place. Les identifiants `FR-Rnn`, `FR-Pnn`, `FR-Nnn` renvoient au PRD du module ; `PRD-D FR-n` au PRD distributeur ; `Reprise FR-n` et `Connecteurs FR-n` aux PRD Reprise et Connecteurs.

| Module | Code | Réf. M | PRD | Manifeste |
|---|---|---|---|---|
| Réseau, agences et zones | `reseau` | M01 | `prd-reseau-zones-2026-08-02` | `manifestes/reseau.manifest.ts` |
| ★ Encaissements et moyens de paiement | `paiement` | M33 | `prd-paiement-service-2026-08-02` + amendement 2026-09-21 | `manifestes/paiement.manifest.ts` |
| Canaux et notifications | `notification` | M34 | `prd-notification-service-2026-08-02` | `manifestes/notification.manifest.ts` |
| Reprise de données | `reprise` | M44 | `prd-reprise-donnees-2026-11-10` | `manifestes/reprise.manifest.ts` |
| Connecteurs | `connecteurs` | M43 | `prd-connecteurs-2026-11-10` | `manifestes/connecteurs.manifest.ts` |

`pdv`, `catalogue` et `stock` ne concernent pas l'IMF : le catalogue des **produits financiers** est le module `produits-financiers` (§6.1) ; le catalogue d'articles reste celui du distributeur.

#### FR-255 : Réseau : quatre échelons, code d'agence du cœur, zones en polygones

**Ce qui s'applique tel quel.** La zone et la hiérarchie à profondeur configurable (FR-R01, FR-R12), la portée en lecture et en écriture (FR-R24, FR-R24b, FR-R24c), la couverture et les zones blanches (FR-R31, FR-R32), les affectations datées (FR-R20 à FR-R22), l'attribution d'une portée (FR-R36), l'import (FR-R37), l'audit (FR-R40). Tous les écrans de `reseau` sont voulus (décision du PO du 2026-11-12, PRD-D §7.1).

**Écarts de l'IMF, à porter au PRD `reseau`.** Réalise UJ-3 et UJ-6.

**Conséquences (testables) :**
- **Quatre échelons**, à la différence du distributeur de février qui a des zones à plat (PRD-D FR-180) : **réseau → région → agence → zone**, plus le portefeuille (clients d'un GP, dossiers d'un CC) comme portée d'accès (FR-5). Un agent est rattaché à une agence et à une ou plusieurs zones ; un transfert d'agent est une opération datée et tracée. La portée « portefeuille » est tenue par `credit` et `microfinance` et lue par `reseau` [ASSUMPTION : à porter au PRD `reseau`].
- **Le code d'agence est celui du cœur s'il en a un ; sinon Prospera a ses propres codes d'agence** (décision T6, FR-164). `reseau`, rempli depuis le cœur à la reprise, donne l'agence d'origine d'un prêt (décision E6). Un code d'agence ne change pas après la reprise sans une opération tracée.
- Les **régions et les zones sont des polygones** sur une carte ; le RA dessine une zone, lui affecte des agents, la subdivise en sous-secteurs, y transfère un agent (cahier de la démo ; la démo montre une carte avec marqueurs, sans dessin). La carte est Google Maps (décision du PO, PRD-D FR-192).
- La liste des **zones blanches** (zones sous-couvertes : clients actifs au km², visites rares) est fournie par `reseau` et dessinée par la carte ; elle alimente les zones de prospection (FR-248, §7.1).
- **Créer une agence dans la démonstration** (FR-12) crée un nœud du réseau, sa première zone et son responsable ; elle apparaît dans les périmètres et les tableaux de bord sans autre manipulation (FR-232).
- Les comptes d'agents terrain se créent par **invitation par SMS** (STORY-900, `auth-service`) : l'agent reçoit l'invitation et choisit son mot de passe ; aucun mot de passe n'est envoyé.
- Un agent ne voit ni agence ni zone hors de sa portée (FR-5) ; une portée vide est vide, jamais « tout ».

#### FR-256 : Paiement : décaisser et encaisser par pays et par opérateur, banques par PI-SPI

**Ce qui s'applique tel quel.** Deux fournisseurs, PI-SPI et FedaPay, derrière un même contrat, routés par pays, devise et méthode (FR-P08, FR-P09, FR-P12 ; PRD-D FR-205) ; le lien de paiement et ses frais, politique du créancier (FR-P14 à FR-P18, FR-P23 ; PRD-D FR-207, PRD-D FR-208) ; l'encaissement déclaré hors Prospera, puis validé (FR-P31 à FR-P36) ; l'idempotence et le même `txId` rejoué (FR-P19 à FR-P22) ; le paiement sortant : un ordre est préparé, validé par une **autre** personne, part une fois, depuis le compte de l'organisation sous ses identifiants (FR-P65 à FR-P69, NFR-1d) ; l'essai : paiements de test seulement (PRD-D FR-24). « Mobile Money » s'affiche « paiement mobile » ou le mode précis (PRD-D FR-206).

**Écarts de l'IMF, à porter au PRD `paiement`.** Réalise UJ-1 et UJ-7.

**Conséquences (testables) :**
- **Décaisser.** Le décaissement par **Mobile Money** et par **PI-SPI** est exécuté par `paiement`, sur l'ordre de décaissement de `credit` (FR-69), puis **déclaré au cœur** (FR-154). Le décaissement en **espèces** et par **virement** est exécuté par le cœur (FR-68). Un ordre de décaissement ne part que par **un seul** canal : un test envoie deux fois le même ordre et vérifie que l'argent ne part qu'une fois.
- **Mobile Money par pays et par opérateur** (décision du PO) : le pays et les opérateurs sont des **paramètres de l'IMF** (FR-11). Le routage par opérateur est une exigence nouvelle pour `paiement`, qui ne pilote pas encore par opérateur (PRD-D FR-206). Tant qu'un opérateur n'a pas d'adaptateur sortant, son canal de décaissement est « bientôt » pour ce pays, le dossier propose un autre canal, et rien n'est simulé.
- **Les banques** sont jointes par **PI-SPI** : le bénéficiaire d'un virement vers une autre banque est une adresse du schéma ; le virement vers un compte que le schéma ne joint pas est exécuté par le cœur [ASSUMPTION : le bac à sable PI-SPI n'expose pas l'IBAN].
- **Encaisser.** Un remboursement par lien (J-3 : WhatsApp avec lien) ou déclaré par la collecte se rattache à l'échéance quand |payé − échéance| ÷ échéance < 1 % (décision A6) ; au-delà, il entre dans la **file de rapprochement** du CPT et n'est **jamais refusé**. La règle de 1 % remplace, pour les échéances de prêt, la tolérance d'un jour de FR-P38 [ASSUMPTION : à porter au PRD `paiement`]. L'ordre d'imputation (pénalités, intérêts, capital) est paramétrable (décision A5) ; un trop-perçu devient un crédit du client (PRD-D FR-248).
- **Validation du comptable.** Un paiement Mobile Money **déclaré** et un virement **sans référence** restent « en attente » jusqu'à la validation du **CPT** ; un paiement PI-SPI confirmé n'en a pas besoin (irrévocable, décision A7). Le droit de valider un encaissement et le droit de préparer ou valider un ordre de décaissement sont **distincts** : on ne valide pas l'encaissement et l'ordre qui lui correspond (FR-6, FR-P66).
- Un décaissement suit le **délai de coupure** de la banque (par exemple « valider avant 16 h » dans la démo ; paramètre).
- Le statut juridique d'une initiation de paiement et du décaissement Mobile Money par un SFD est **à faire confirmer** par un juriste (PRD paiement §10 ; §12.3).
- En espace d'essai, aucun ordre ni lien réel ne part ; les paiements sont marqués « test » (PRD-D FR-24).

#### FR-257 : Le registre de Créance : un miroir du cœur, pas un registre propriétaire

**Ce qui s'applique tel quel.** La Créance a un tiers, une source, un périmètre et des composantes (principal, intérêt, pénalité, frais) ; elle publie `paiement.creance.changed@1`, `…soldee`, `…cloturee` ; l'ordre d'imputation est paramétrable ; l'argent sans créance devient un crédit du tiers (PRD-D FR-247, PRD-D FR-248). La source `ECHEANCE_DE_PRET` y est « réservée aux verticales microfinance et assurance ».

**Écart de l'IMF, à porter au PRD `paiement` et à PRD-D FR-247.** PRD-D FR-247 pose un **propriétaire unique** de la Créance, `paiement`. Pour une échéance de prêt, **le cœur fait foi pour l'argent** (FR-2, FR-150) : le reste dû, l'échéancier officiel et les pénalités sont ceux du cœur. La Créance `ECHEANCE_DE_PRET` de `paiement` est donc un **miroir** des échéances du cœur, pas un registre propriétaire. Réalise UJ-7.

**Conséquences (testables) :**
- La Créance d'une échéance **s'ouvre et se met à jour sur les faits du cœur** (`coeur-sfd.echeancier.changed@1`, `coeur-sfd.paiement.recu@1`), jamais sur la création d'un dossier par `credit`. Le module `credit` ne possède aucune Créance.
- Quand `paiement` et le cœur divergent sur un reste dû, **le cœur l'emporte** ; la divergence est une ligne de la file des écarts (FR-159) et l'écran affiche « données du cœur du … ». Un test fait diverger un reste dû et vérifie l'affichage du montant du cœur.
- Un remboursement saisi dans Prospera (collecte, guichet, paiement mobile validé) est un mouvement « en attente du cœur » ; il ne réduit **pas** la Créance miroir avant la confirmation du cœur et n'est jamais compté deux fois (FR-2, FR-155).
- Les cinq capacités du noyau que PRD-D §6.0 demande de valider sont **validées ici** : composantes lues du cœur ; PAR sur l'encours entier (FR-173) ; groupe solidaire, tiers collectif (FR-129) ; blocage d'un dossier, décision du ROC seul (FR-250) ; épargne lue du cœur (FR-130).
- Tant que l'amendement n'est pas porté, la source `ECHEANCE_DE_PRET` reste « réservée » et la balance âgée de l'IMF se lit par `coeur-sfd` (FR-151) [ASSUMPTION : l'amendement du PRD `paiement` s'écrit avant la validation du lot ; ce PRD ne le rédige pas].

#### FR-258 : Notification : WhatsApp, SMS et lien de paiement, servis par le relais

**Ce qui s'applique tel quel.** Canaux e-mail, SMS, WhatsApp, in-app, repli « WhatsApp, sinon SMS » (FR-N17, FR-N18, FR-N21 ; PRD-D FR-249) ; modèles versionnés et approuvés par canal (FR-N09 à FR-N16) ; envoi de masse avec échantillon, reprise, plafond (FR-N28 à FR-N34) ; réponses entrantes routées par contexte vers le module qui a parlé (FR-N41 à FR-N45) ; consentement et désabonnement par personne, canal et nature (FR-N46 à FR-N50) ; journal et accusés (le « lu » n'existe pas pour un SMS) ; en essai, l'envoi est intercepté et compté (PRD-D FR-214).

**Écarts de l'IMF, à porter au PRD `notification`.** Réalise UJ-7.

**Conséquences (testables) :**
- **Personnel** : cloche et e-mail. **Client** : SMS et WhatsApp ; français d'abord (décision C16, FR-14).
- Les **modèles WhatsApp** de l'IMF (rappel J-3 avec lien de paiement, relance, promesse, annonce de décaissement) sont **soumis à l'approbation avant la mise en service** (FR-N11) : le délai est externe ; un modèle non approuvé n'est jamais choisi, le SMS part et le journal le dit (PRD-D FR-249).
- Le **numéro WhatsApp Business** et la **passerelle SMS** (identifiant d'expéditeur enregistré) sont **ceux de l'IMF et à sa charge** ; leurs identifiants sont chiffrés ; les coûts d'envoi sont mesurés (FR-N57 à FR-N63).
- Les **réponses entrantes** (accusés, réponses de clients) et le **lien de paiement** (page publique ouverte par le téléphone du client) passent par le **relais Money Vibes** (FR-263, FR-158) : le serveur de l'IMF les tire, il n'est jamais joint directement.
- Les relances automatiques du matin sur tout le portefeuille sont un **envoi en lots avec reprise** (FR-N30 à FR-N32) ; un rappel d'échéance est transactionnel (hors plafond) et la publicité est plafonnée (FR-245). Les messages aux **cautions** d'un prêt en retard demandent un cadre de consentement à faire vérifier [ASSUMPTION : cadre juridique des messages à un tiers ; §12.3].
- Un SMS en caractères non latins est limité à 70 caractères et coûte davantage : l'écran de modèle l'affiche (FR-N14).
- La matrice « qui est prévenu de quoi » est celle de FR-234 et de l'annexe B ; `notification` ne la porte pas.

#### FR-259 : Reprise et connecteurs : les fichiers d'abord, le vrai connecteur plus tard

**Ce qui s'applique tel quel.** La Reprise : provenance de chaque donnée, simulation par la cible sans rien écrire, correction des rejets, doublons, valeurs de contrôle à écart nul, feu vert par module cible, rejeu sans doublon ; libre-service prêt en février, y compris pour un prospect en essai (Reprise FR-2 à FR-19 ; PRD-D FR-215). Connecteurs : un propriétaire par domaine, objet en lecture seule quand le logiciel externe en est propriétaire (Connecteurs FR-14 ; PRD-D FR-218).

**Écarts de l'IMF.** Réalise UJ-6.

**Conséquences (testables) :**
- La **reprise du portefeuille de prêts en cours** (clients, prêts à échéancier complet, paiements, seuils, identifiants) est décrite en §6.9 (FR-196 à FR-198) ; elle passe par le module `reprise` (M44, requis en février, fichiers seulement). Le format et le logiciel de départ sont **non tranchés** (décision du PO reportée, récit §3).
- **Le vrai connecteur du cœur de l'IMF est hors février** (décision A9, spine Connecteurs AD-32) : le cœur est inconnu ; le **contrat d'échange neutre** est l'annexe C et le **cœur fictif** de la démonstration le parle (FR-166). Aucun bouton de la démo ne promet une intégration à un produit nommé : « bientôt », sans date (PRD-D FR-218).
- Le domaine d'échange d'argent déclare ses valeurs de contrôle dès le manifeste, pour que le passage au vrai connecteur n'oblige pas à reprendre du code (règle du point d'écriture unique par domaine ; PRD-D §7.8).
- L'état « lecture seule, propriété du logiciel externe » vaut pour tout objet dont le cœur est propriétaire (FR-150) ; la section « Intégrations » du menu n'apparaît que si `connecteurs` est installé.

---

### 7.8 L'IA commune

**Ce qui s'applique tel quel.** La note de vision `vision-ia-sectorielle-2026-11-10` : l'IA est une **famille de modules à part** (Risque, Agents métier, Relation client, Pulse), commune à toutes les verticales ; elle apprend de leurs angles, sous le consentement de chacune, par **apprentissage fédéré** (PRD moteur FR-26 à FR-31 ; les modèles de l'IMF sont intouchables, PRD moteur FR-24). Ce PRD ne crée **aucune IA propre** (décision du PO) : il **fournit les données**, **affiche les propositions** et **marche sans elle** (emplacement vide). Les règles communes (provenance, l'IA propose et l'humain décide, motif d'un écart, jamais bloquant, le mot « IA » réservé à un modèle) sont celles de FR-8 et ne sont pas répétées.

#### FR-260 : Ce que l'IMF fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement

L'IMF **fournit** à l'IA commune, sous son consentement écrit (FR-15), des données **par finalité** : clients (secteur d'activité, score, comportement de paiement, saison), prêts et retards (portefeuille, PAR, recouvrement), transactions et flux, visites et couverture, campagnes et conversion, trésorerie lue du cœur. Elle **reçoit** des propositions : score et décision suggérée, analyses micro et macro-économiques, prévisions, relances, priorités, recommandations (FR-8). Réalise UJ-3.

**Les finalités consommées** par les modules de ce PRD sont déclarées module par module à la clause C11 de l'annexe A. **Le tableau de FR-8 donne, pour chaque moment du processus, la capacité et la section qui la spécifie** : il n'est pas recopié ici. Les finalités de **cette partie** sont : `pilotage-assiste` (Copilot), `priorites-du-jour`, `anomalie-d-agence`, `rapport-de-direction`, `coaching-individuel`, `benchmark-bonnes-pratiques`, `prevision-du-risque-par-zone` (§7.3) ; `segmentation`, `ciblage-campagne`, `note-de-prospect`, `proposition-de-campagne`, `zone-de-prospection` (§7.4) ; `prevision-de-cash`, `perte-attendue` (§7.6).

**Conséquences (testables) :**
- **Sans consentement**, aucune donnée ne sort des serveurs de l'IMF vers l'IA commune ; l'IA tourne sur les seules données de l'IMF, sur ses serveurs ; un test sur une installation sans consentement le vérifie (FR-8).
- Le consentement est **par finalité** et **retirable** : le retirer arrête l'envoi des données qui servent cette finalité ; l'apprentissage déjà mis en commun l'a été « sans les données », et le retrait est tracé (FR-15).
- L'IMF choisit le **niveau d'apprentissage** parmi ceux que le PRD moteur ouvre (le niveau 2 y est fermé) ; le choix est affiché dans l'écran des consentements.
- Le **secteur d'activité** (FR-7) et les données micro et macro-économiques (FR-8) sont les entrées de premier rang ; les données macro citent leur source et leur date.
- Chaque emplacement d'IA est **vide sans l'IA commune** : un test coupe l'IA commune et vérifie qu'aucun parcours ne bloque et que les règles explicables restent servies, en le disant (FR-8).
- Un modèle affiné sur les données de l'IMF n'est jamais lu par Money Vibes (PRD moteur FR-24).

---

### 7.9 ★ L'installation chez l'IMF (moteur d'installation)

**Ce qui s'applique tel quel.** L'IMF s'installe **sur ses propres serveurs**, pas chez Money Vibes (récit §1) ; l'hébergement sur site est prévu et la microfinance y est déjà inscrite (PRD moteur, UJ-3). Le PRD moteur fixe : l'**agent tire**, le poste central ne pousse rien (spine moteur AD-1), avec un contact sortant unique (AD-9) ; **une instance = un serveur**, deux espaces, essai et réel (AD-10) ; l'**espace d'essai** où l'on essaie une mise à jour avant de la promouvoir, et le **retour arrière en un clic** (PRD moteur FR-17, FR-18) ; la **mise à jour par fichier signé** quand le serveur n'a pas internet (PRD moteur FR-22) ; l'installation scriptée et le refus d'un serveur sous la configuration minimale (PRD moteur FR-25, NFR-10) ; les **sauvegardes 3-2-1**, chiffrées, second support dans les locaux du client, clé de restauration détenue par le client, **RPO 1 heure, RTO 4 heures**, test de restauration mensuel (PRD moteur NFR-7) ; le **support à distance** par un tunnel **ouvert seulement par le client**, borné et journalisé (PRD moteur FR-23). **Ce PRD ne réécrit aucune de ces exigences** ; il dit ce que l'IMF change ou ajoute.

#### FR-261 : Licence à vie : jamais de coupure ni de gel pour impayé

L'IMF détient une **licence à vie** (décision B3). **Aucune coupure, aucun gel, aucune suspension** de son installation n'est possible pour un impayé : la licence signée, liée à l'instance, se vérifie hors ligne **sans date d'expiration d'usage** (PRD moteur FR-14), et les mécanismes du PRD moteur qui dégradent l'usage (alerte à J+7 et gel à J+30 sans contact : FR-15 ; fin de contrat : FR-32 ; **suspension à distance pour impayé : FR-41**) **ne s'appliquent pas** à cette installation. Réalise UJ-9.

**Conséquences (testables) :**
- Un test place l'horloge de l'instance 30, 90 et 360 jours après le dernier signal vers Money Vibes : l'installation reste en écriture complète, sans bandeau de gel.
- La suspension à distance d'une installation à licence à vie est **refusée** par le poste central avec un code nommé ; aucun écran de la console ne la propose pour l'IMF.
- Ne pas contacter Money Vibes n'arrête rien ; l'absence de signal ne produit qu'un voyant de supervision (PRD moteur FR-16).
- Les **mises à jour sont liées au contrat de maintenance** : sans contrat, l'IMF garde l'usage perpétuel de la version installée et ne reçoit plus de mises à jour [ASSUMPTION : lecture de la salle, séance 4 ; la licence ne couvre pas les évolutions]. La livraison des **correctifs de sécurité** sans contrat de maintenance n'est **pas tranchée** (§12.2).

#### FR-262 : Les mises à jour : essai, date choisie par l'IMF, retour arrière, fichier signé

Les mises à jour arrivent à distance, tirées par l'agent de l'instance (AD-1), sont **essayées dans l'espace d'essai**, puis **promues à la date que l'IMF choisit**, avec retour arrière en un clic ; un serveur sans internet les reçoit **par fichier signé** (lien à durée limitée ou support amovible ; PRD moteur FR-17, FR-18, FR-22). Réalise UJ-9.

**Conséquences (testables) :**
- L'administrateur reçoit une mise à jour, la teste dans l'espace d'essai (jeu de la démonstration, FR-11), choisit la date, l'applique et peut revenir en arrière en un clic (UJ-9) ; il ne voit aucune donnée métier à aucun moment (FR-265).
- Une mise à jour n'est **jamais appliquée sans la date choisie par l'IMF**, sauf un correctif de sécurité critique, que l'IMF peut accepter dans un délai fixé par le contrat [ASSUMPTION : délai à fixer au contrat de maintenance].
- La coupure de service d'une mise à jour est de **15 minutes au plus** (PRD moteur NFR-9).
- Une sauvegarde ne restaure jamais un état de confiance (PRD moteur NFR-11).
- Une mise à jour reçue **sans contrat de maintenance valide** est refusée avec un message qui dit pourquoi (FR-261).
- Les listes de sanctions LBC/FT ne passent pas par ce canal (FR-268).

#### FR-263 : Le relais Money Vibes, parce qu'aucun port n'est ouvert chez l'IMF

Le PRD moteur interdit tout port entrant d'internet sur une instance sur site (NFR-2 ; toutes les liaisons sont initiées par l'instance, FR-16). Or trois chemins de l'IMF viennent d'internet : les **notifications des fournisseurs de paiement** (PI-SPI, FedaPay), les **accusés et réponses WhatsApp**, et le **lien de paiement** que le téléphone du client ouvre. Cette contradiction est **levée** (décision B1) par un **relais** tenu par Money Vibes, qui reçoit ces trois flux, les met en file, et que **le serveur de l'IMF tire** (« l'agent tire »). Le relais **sert le lien de paiement**. Réalise UJ-7.

**Conséquences (testables) :**
- **Aucun port entrant** n'est ouvert sur le serveur de l'IMF : un balayage de l'extérieur n'en trouve aucun, et NFR-2 reste vrai.
- Un paiement du client par le lien arrive à Prospera au plus tard à la prochaine interrogation du relais (paramètre ; défaut : 1 minute) ; le relais ne garde que le strict nécessaire à la mise en file, et un événement tiré n'est plus servi à la même instance (FR-158).
- Si le relais est injoignable, le crédit et les relances continuent ; les paiements par lien s'affichent « en attente du relais » (FR-158) ; la file se vide au retour.
- L'interrogation du relais est un **contact sortant** de l'instance : le nom du relais s'ajoute au contact sortant de la plateforme (AD-9 : deux noms) [ASSUMPTION : à porter au spine moteur, AD-9].
- Les **sorties d'intégration** (ordres vers PI-SPI et FedaPay, passerelles WhatsApp et SMS) sont des **destinations déclarées** que l'IMF ouvre dans son pare-feu sortant, en plus du contact sortant de la plateforme ; la liste est remise à l'installation et suit les opérateurs de l'IMF (FR-256) [ASSUMPTION : AD-9 ne couvre que deux noms ; liste à fixer à l'installation].
- Chaque événement du relais porte sa signature, vérifiée par l'instance avant tout effet (FR-P19 à FR-P22) ; un événement rejoué est ignoré (FR-160).
- En espace d'essai, le relais n'envoie rien de réel ; le lien d'essai est marqué « test » (PRD-D FR-24).

#### FR-264 : L'accès des agences : navigateur, guichet en ligne, hors ligne seulement sur le téléphone

Les agences accèdent au serveur central **par navigateur, sur le réseau de l'IMF** (liaison privée virtuelle ou dédiée, **à la charge de l'IMF**, décision B2). Le **guichet** travaille **en ligne** ; le **hors ligne** n'existe que dans l'**application terrain** du téléphone (visites, fiche client, collecte, demande en brouillon ; jamais une décision, FR-134). Réalise UJ-1.

**Conséquences (testables) :**
- Le 443 du serveur est joignable depuis **le réseau interne de l'IMF et ses agences**, jamais depuis internet [ASSUMPTION : le 443 publié par le serveur est limité au réseau interne ; nom et adresse choisis par l'IMF].
- Quand la liaison d'une agence tombe, le guichet affiche « hors liaison » et ne simule rien ; le travail du guichet sur le cœur (caisse du guichet, FR-146) **continue dans le cœur**, sans Prospera ; au retour de la liaison, rien n'est perdu.
- L'application terrain fonctionne sans réseau et se synchronise au retour, sans doublon ni changement de solde avant validation (FR-134, FR-136) ; la synchronisation de 50 visites prend moins de 30 secondes (paramètre, cahier de la démo).
- Le point d'entrée est unique pour le navigateur et le téléphone, avec deux hôtes, essai et réel (spine `prospera-app`, AD-8).
- Aucune exigence de bande passante n'est posée avant la taille de l'IMF (FR-266).

#### FR-265 : L'exploitation est faite par l'équipe informatique de l'IMF, qui ne lit pas le métier

L'installation est **exploitée par l'équipe informatique de l'IMF**, qui n'est pas celle de Money Vibes (récit §1). Elle porte le rôle **ADMIN_IMF** (FR-5) : plusieurs personnes, pas une seule. ADMIN_IMF **crée les comptes, règle les paramètres, installe et promeut les mises à jour, surveille les sauvegardes** dans l'écran « Administration » de l'application (droits `instance:*`, PRD moteur FR-35, FR-36) ; elle **ne lit aucune donnée métier**. Le système d'exploitation, Docker et les correctifs de l'hôte restent à la charge de l'IMF, selon la liste du bilan d'instance (spine moteur AD-36). Réalise UJ-9.

**Conséquences (testables) :**
- Un test ouvre avec ADMIN_IMF chaque écran métier : refus sans donnée (FR-5). L'export et la restauration d'une installation passent par l'outil d'administration, sans ouvrir de table métier.
- La création d'un administrateur et l'attribution d'un droit `instance:*` demandent **deux personnes** (FR-5, décision F7).
- Le bilan d'instance (licence, premier signal, sauvegarde testée par restauration) est lu par ADMIN_IMF ; Money Vibes n'en voit que la **vue de supervision** (état, versions, voyants), sans donnée métier (PRD moteur FR-16).
- Un **manuel d'exploitation** (démarrage, arrêt, mise à jour, restauration, supervision, astreinte) est livré à l'installation ; la supervision **locale** est lisible sans internet [ASSUMPTION : la supervision du PRD moteur est surtout côté Money Vibes ; la lecture locale par l'équipe de l'IMF est à porter au PRD moteur].
- Un événement de l'installation (échec de mise à jour, sauvegarde en échec, relais injoignable) est une alerte à ADMIN_IMF (FR-234).

#### FR-266 : Le dimensionnement est celui de l'IMF ; la démonstration est testée à dix fois sa taille

**La taille** (nombre d'agences, d'utilisateurs, de prêts actifs) est **gérée par l'IMF** : elle dit sa taille, Money Vibes ne la fixe pas (décision B4, récit §7). Money Vibes livre une **démonstration** à la taille de FR-11 (3 agences, 10 agents, 1 000 prêts actifs) et la **teste à dix fois cette taille** (30 agences, 100 agents, 10 000 prêts actifs) ; ce test donne à l'IMF une **taille de référence** pour son serveur. Réalise UJ-6.

**Conséquences (testables) :**
- Un jeu à dix fois la démonstration est chargé sur une installation de référence ; les objectifs de performance tiennent (paramètres repris du cahier de la démo) : chargement du tableau de bord sous 3 secondes, liste en moins de 500 ms au 95e centile, export PDF du rapport BCEAO en moins de 10 secondes, synchronisation de 50 visites en moins de 30 secondes [ASSUMPTION : valeurs du cahier, à confirmer avec la taille réelle].
- Une installation sur un serveur **sous la configuration minimale** est refusée (PRD moteur NFR-10) ; les chiffres de cette configuration viennent de ce test à ×10.
- Au-delà de la taille testée, l'IMF est prévenue : une instance est un serveur, sans haute disponibilité en v1 (spine moteur, travaux différés) [ASSUMPTION : règle « au-delà d'un serveur » à fixer avec la taille réelle].
- Le **RPO de 1 heure et le RTO de 4 heures** (PRD moteur NFR-7) peuvent être jugés trop longs par une IMF qui décaisse chaque jour : **point non tranché** (§12.2), non corrigé ici.

#### FR-267 : Sauvegardes de l'IMF et conservation de dix ans

Les **sauvegardes 3-2-1** suivent PRD moteur NFR-7 (chiffrées, second support dans les locaux de l'IMF, clé de restauration détenue par l'IMF, test de restauration mensuel : un échec allume un voyant orange). La **rétention technique** des sauvegardes (7 quotidiennes, 4 hebdomadaires, 3 mensuelles : spine moteur AD-16) **n'est pas la conservation réglementaire** : la **piste d'audit, les dossiers de crédit et les pièces KYC sont conservés au moins dix ans** (FR-9, FR-191 ; instruction BCEAO n° 017-12-2010). Réalise UJ-9.

**Conséquences (testables) :**
- La **rotation** des sauvegardes n'efface jamais une donnée soumise à la conservation de dix ans : cette donnée vit dans la base de l'installation et ses archives, pas seulement dans des sauvegardes qui tournent.
- Un export d'archive d'un dossier, d'un client ou d'une période (FR-9) se fait sur un support de l'IMF, avec sa somme de contrôle.
- L'effacement d'une donnée **sous conservation** est refusé avec un code nommé ; l'effacement d'une donnée hors conservation (droit à l'oubli d'un prospect) est tracé avec un certificat (annexe A, conventions).
- Les règles de localisation, de transfert et de conservation de chaque pays sont des **paramètres à faire vérifier par un juriste** (FR-15, §12.3).

#### FR-268 : Les listes de sanctions LBC/FT se mettent à jour sans port entrant

Les **listes de sanctions** (ONU, UEMOA, nationales ; sources paramétrables, FR-121) se **rafraîchissent régulièrement** (défaut : tous les jours ; FR-193), mais l'instance de l'IMF n'ouvre aucun port entrant (décision E3). Chaque liste est donc **tirée par l'instance**, vers sa source ou vers un miroir tenu par Money Vibes, par un contact sortant déclaré (FR-263) ; si l'instance n'a pas d'accès, la liste arrive **par fichier** que ADMIN_IMF dépose, comme une mise à jour hors ligne. Réalise UJ-5.

**Conséquences (testables) :**
- Une liste porte sa **date de publication** et sa **date de rafraîchissement** ; une liste plus vieille que sa périodicité (défaut : 7 jours, FR-193) lève une alerte à la conformité (FR-234).
- Le dépôt d'une liste par fichier **ne contient aucune donnée client** : ADMIN_IMF peut le faire sans lire le métier (FR-265) ; le **refiltrage de tout le fichier** (clients, cautions, bénéficiaires effectifs) se fait **dans l'instance**, à chaque rafraîchissement (FR-121).
- Aucune donnée client ne sort pour filtrer : seule la liste entre.
- En espace d'essai, une liste d'essai est utilisée ; une correspondance d'essai n'est jamais présentée comme réelle.
- Les sources, miroirs et fréquences de départ sont à valider par la conformité de l'IMF (FR-121).

#### FR-269 : Le support à distance est ouvert par l'IMF seule

Le support de Money Vibes à une installation passe par le **tunnel de support** que **seule l'IMF ouvre**, borné dans le temps et journalisé ; les comptes de Money Vibes de la console sont **fermés par défaut** (PRD moteur FR-23). Réalise UJ-9.

**Conséquences (testables) :**
- Un test tente d'ouvrir le tunnel depuis Money Vibes : refus. L'ouverture par ADMIN_IMF le permet pour une durée fixée, journalisée dans le journal chaîné de l'installation (spine moteur AD-12).
- Pendant le tunnel, Money Vibes **ne lit aucune donnée métier** : l'accès est celui de l'administration de l'instance (FR-265) ; l'accès à un écran métier pendant le tunnel est refusé, comme pour ADMIN_IMF.
- Le journal du tunnel (qui, quand, combien de temps, quelles actions) est lisible par ADMIN_IMF et par l'AUD (FR-9).
- Le support d'usage (formation, questions) n'est pas dans ce PRD : il relève du module `support-client` (FR-251) et du contrat de maintenance.

---

## 8. Exigences transverses (non fonctionnelles)

Les exigences transverses du PRD distributeur (PRD-D §8) s'appliquent. Celles-ci s'y ajoutent ou les précisent pour une installation chez l'IMF.

| # | Domaine | Exigence | Mesure |
|---|---|---|---|
| NFR-1 | Performance | Le tableau de bord d'un rôle s'affiche en moins de 3 s sur une connexion 4G ; une liste en moins de 500 ms au 95ᵉ centile ; le rapport BCEAO s'exporte en PDF en moins de 10 s ; 50 visites hors ligne se synchronisent en moins de 30 s (cahier Prospera Web). | mesuré sur le jeu de démonstration, puis sur dix fois sa taille (décision B4) |
| NFR-2 | Fraîcheur | Un événement saisi dans Prospera apparaît dans les tableaux de bord des rôles concernés en moins de 5 s ; un mouvement du cœur, au plus tard une période d'échange après son arrivée (paramètre ; défaut : 15 min) [ASSUMPTION]. Chaque chiffre affiche la date de sa dernière lecture du cœur (FR-2). | horodatage affiché, test de bout en bout |
| NFR-3 | Disponibilité | Le serveur central est disponible 99,5 % du temps ouvré de l'IMF ; l'application terrain fonctionne sans réseau (UJ-4) ; une panne du lien avec le cœur ne bloque ni l'instruction ni le recouvrement, elle retarde seulement les mouvements (§6.5). | supervision chez l'IMF (§7.9) |
| NFR-4 | Sauvegarde | Sauvegardes 3-2-1, perte de données maximale d'une heure, reprise en quatre heures (PRD moteur NFR-7). Une restauration est essayée au moins une fois par trimestre. | rapport de restauration |
| NFR-5 | Sécurité | Chiffrement en transit et au repos ; double authentification pour les rôles sensibles (FR-5) ; aucun port entrant chez l'IMF (relais Money Vibes, décision B1) ; fichiers déposés vérifiés (type, antivirus) ; aucune donnée métier dans le navigateur (PRD-D FR-1). | test d'intrusion avant février |
| NFR-6 | Trace | Journal infalsifiable conservé au moins dix ans (FR-9). | contrôle de l'auditeur |
| NFR-7 | Données personnelles | Consentements par finalité (FR-15) ; données sur les serveurs de l'IMF ; règles de chaque pays en paramètres, à faire vérifier par un juriste. | revue juridique |
| NFR-8 | Hors ligne | Une saisie hors ligne porte un identifiant unique : la rejouer ne crée jamais de doublon ; elle ne change aucun solde avant validation par le serveur (cahier Prospera Web). | test de double synchronisation |
| NFR-9 | Appareils et langue | Navigateurs récents (Chrome, Firefox, Edge, Safari iOS) ; application terrain sur téléphone Android d'entrée de gamme [ASSUMPTION] ; interface en français. | recette sur appareils de référence |
| NFR-10 | Exactitude | Montants en FCFA entiers ; TEG calculé à 0,01 point près (FR-10) ; tout indicateur se recalcule depuis les données (FR-13). | tests de calcul |

---

## 9. Indicateurs de réussite

**Pour la démo de février** (ce qui prouve qu'elle est prête) :

| Indicateur | Cible |
|---|---|
| Parcours UJ-1 mené de bout en bout sur un dossier créé à la main, sans intervention de Money Vibes | 100 % des essais |
| Boutons des écrans de l'IMF branchés ou marqués « bientôt » | 100 % (aucun bouton qui simule) |
| Indicateurs du tableau de bord du DG recalculés depuis les données du cœur fictif | 100 % identiques |
| Rôles de démonstration qui voient exactement leur périmètre | 16 sur 16 |
| Propositions de l'IA affichées avec leur provenance | 100 % |

**Pour l'IMF en service** (les cinq promesses, mesurées depuis une valeur de départ prise au démarrage) :

| Promesse | Indicateur | Cible annoncée |
|---|---|---|
| Réduire le PAR | PAR 30 en % de l'encours, calculé sur les échéances du cœur | baisse relative de 15 à 25 % en un an [ASSUMPTION : horizon] |
| Productivité terrain | clients actifs par agent ; visites par jour | + 30 à 50 % de clients par agent |
| Encaissements numériques | part des encaissements par Mobile Money et PI-SPI | en hausse chaque trimestre ; la cible de 100 % est une ambition, pas une règle |
| Pilotage en temps réel | délai entre un événement et son apparition au tableau de bord ; alertes traitées sous 48 h | NFR-2 respecté ; plus de 90 % des alertes traitées à temps |
| Conformité BCEAO | indicateurs périodiques produits avant l'échéance réglementaire | 100 % à l'heure |

**Indicateurs de vigilance** (ce qui doit ne pas se dégrader quand les autres s'améliorent) :
- **Qualité de l'octroi** : le PAR 30 des prêts accordés depuis le démarrage, à six mois, ne doit pas dépasser celui des prêts antérieurs ; aller plus vite ne doit pas faire prêter plus mal.
- **Pression sur les clients** : nombre de messages de relance par client et par mois, et plaintes ; la relance ne doit pas devenir du harcèlement (PRD-D FR-114).
- **Écarts d'IA** : part des propositions de l'IA dont l'humain s'écarte ; une part qui monte signale un modèle qui se trompe, une part nulle signale qu'on ne lit plus.
- **Écarts avec le cœur** : nombre d'écarts ouverts entre Prospera et le cœur, et leur âge ; un chiffre qui monte veut dire que Prospera ne dit plus la vérité.
- **Charge des agents** : la productivité ne se gagne pas en allongeant les journées ; heures de service mesurées par l'application terrain.

---

## 10. Périmètre

### 10.1 Dans le périmètre

- Toute la plateforme de la démo `prospera-web`, en vrai, avec le crédit de bout en bout comme priorité absolue (partie 2).
- Les modules ★ dans la démo de février : `credit`, `produits-financiers`, `microfinance`, `collecte`, `coeur-sfd` et le cœur fictif, `risque-par`, `recouvrement`, `terrain`, plus le tableau de bord et le socle.
- Les autres modules au premier jour de l'IMF : `caisse` (collecteurs), `conformite-bceao`, équipes, marketing, automatisations, support, export des écritures.
- Les capacités d'IA du processus (FR-8), servies par l'IA commune.
- L'installation sur les serveurs de l'IMF et son exploitation par son équipe (§7.9).
- Le contrat d'échange avec le cœur, neutre de produit (annexe C), et le cœur fictif de démonstration.
- L'import du portefeuille de prêts en cours, au format à fixer (§6.9).

### 10.2 Hors périmètre pour l'instant

- Le **connecteur réel** vers le cœur de l'IMF : il sera fait pour l'IMF, plus tard, quand son logiciel sera connu (décision A9).
- La **tenue de comptes**, de l'épargne, de la caisse du guichet et de la comptabilité officielle : c'est le cœur (FR-2).
- `prospera-microfinance-service` (paquet comptable SFD) chez cette IMF (décision A11).
- Le chatbot WhatsApp d'acquisition, les tontines, la fidélisation (NPS), les langues locales : « bientôt ».
- Le branchement direct au Bureau d'information sur le crédit : « bientôt » ; au jour 1, saisie manuelle et export (décision C18).
- La déclaration à la CENTIF et le dépôt des rapports à la BCEAO : faits par l'IMF, hors Prospera (décisions E3, E4).
- Les commissions et la paie des agents (décision F8).

---

## 11. Non-objectifs

- **Prospera n'est pas un cœur bancaire.** Il ne tient aucun solde officiel et ne passe aucune écriture au grand livre de l'IMF.
- **L'IA ne décide pas.** Elle propose, avec sa provenance ; un humain décide et peut s'écarter en le justifiant.
- **Prospera ne prête pas.** C'est l'IMF qui accorde, décaisse et porte le risque ; Money Vibes fournit l'outil (note de vision : « Money Vibes note et relie, elle ne prête pas »).
- **Pas de produit hors du plafond d'usure**, même à la demande de l'IMF.
- **Pas de dimensionnement par Money Vibes** : l'IMF fournit ses volumes et dimensionne ses serveurs ; Money Vibes fournit une démo testée à dix fois sa taille (décision B4).
- **Pas de coupure de l'IMF** : sa licence est à vie (décision B3).

---

## 12. Décisions, actions restantes et risques assumés

### 12.1 Décisions prises

Toutes les décisions sont datées et motivées dans `.memlog.md` ; les 71 questions et leurs réponses sont dans `questions-po-2026-11-13.md`. Les décisions qui commandent le PRD :

| # | Décision du PO (2026-11-13) | Où |
|---|---|---|
| D-1 | Le client est une grande IMF multi-agences de la zone BCEAO, jamais nommée ; démarrage en février 2027, **sur ses serveurs**. | §0, §7.9 |
| D-2 | **Le cœur de l'IMF fait foi pour l'argent** ; Prospera se branche à côté. Un **cœur fictif** est livré pour la démo ; le vrai connecteur viendra plus tard. | FR-2, §6.5, §6.6 |
| D-3 | Le crédit est la priorité absolue ; toute la plateforme marche au jour 1 ; la comptabilité n'est pas prioritaire (export des écritures au mieux). | §5, §7.6 |
| D-4 | Le comité seul génère l'échéancier ; le dossier passe alors à EN_GESTION ; le décaissement se déroule dans EN_GESTION et le cœur le confirme. | FR-70 |
| D-5 | Décaissement : espèces et virement par le cœur, Mobile Money et PI-SPI par `paiement` ; remboursements renvoyés au cœur **si possible**. | FR-2, §5.8 |
| D-6 | Plafond d'usure paramétrable : 24 % par an, sur le TEG actuariel. | FR-10 |
| D-7 | Tous les seuils de la démo sont des paramètres ; les seuils d'alerte se calibrent sur les données de l'IMF. | FR-3, FR-4 |
| D-8 | Mobile Money par pays et par opérateur ; banques par PI-SPI. | §7.7 |
| D-9 | Seize rôles ; séparation des tâches ; double authentification pour les rôles sensibles. | FR-5, FR-6 |
| D-10 | **L'IA est spécifiée sur tout le processus**, servie par l'IA commune ; elle propose, l'humain décide ; secteur d'activité et analyses micro et macro-économiques au premier rang. | FR-7, FR-8 |
| D-11 | Produits financiers = module à part ; code d'agence du cœur, sinon le nôtre. | §6.1, §7.7 |
| D-12 | `prospera-microfinance-service` (paquet comptable SFD) n'est pas installé chez l'IMF. | FR-16 |
| D-13 | Licence à vie : jamais de coupure ni de gel. | §7.9 |
| D-14 | Démo : 3 agences, 10 agents, 1 000 prêts actifs ; on y crée une agence, un agent et un vrai dossier jusqu'à EN_GESTION. | FR-11, FR-12 |
| D-15 | LBC/FT au jour 1, avec sa mise à jour régulière. | §6.2 |
| D-16 | Copilot réel au jour 1 ; chatbot WhatsApp, tontines et BIC direct « bientôt ». | §7.3, §10.2 |

### 12.2 Actions qui restent au PO

Ces points ne bloquent pas l'écriture du brouillon, mais chacun doit être tranché avant l'architecture ou les épics. Ils sont rangés du plus lourd au plus léger.

| # | Question | Proposition du brouillon | Bloque |
|---|---|---|---|
| Q1 | **Le décaissement Mobile Money par opérateur** : `paiement` n'a aujourd'hui qu'un ordre sortant PI-SPI, sans adaptateur Mobile Money sortant ni IBAN (FR-256). D-5 suppose qu'il existe. | Février : décaissement Mobile Money par le cœur fictif dans la démo ; adaptateur sortant de `paiement` à chiffrer au plan. | architecture paiement |
| Q2 | **Le registre de Créance de `paiement`** se dit « propriétaire unique » (PRD-D FR-247), alors que le cœur fait foi. | La Créance `ECHEANCE_DE_PRET` est un **miroir** du cœur ; amendement du PRD paiement à écrire (FR-257). | PRD paiement |
| Q3 | **La spine Connecteurs** dit « rien pour février » (AD-32) ; D-2 met le contrat d'échange et le cœur fictif dans février. | Amender la spine : `coeur-sfd` est un module à part, hors `connecteurs-service`. | spine Connecteurs |
| Q4 | **La charge de février** : l'IMF est le troisième client de février et Dev B est déjà au-delà de sa capacité (17-20 semaines pour 10). | Le PRD marque ★ la démo de février ; l'arbitrage se fait au plan. | plan v3 |
| Q5 | Codes et numéros des nouveaux modules : `produits-financiers` (M46) et `coeur-sfd` (M47). Leurs tirets attendent l'élargissement du format de droits (amendement C7). | Codes et numéros proposés. | manifestes |
| Q6 | Le dossier de recouvrement est **par prêt** chez l'IMF, **par tiers** dans le module partagé (FR-211). | Par prêt, avec une vue par client. | module `recouvrement` |
| Q7 | Trois lectures de tes réponses : E5 (seuils calculés sur les données après la reprise, validés, recalculés chaque trimestre) ; B3 (mises à jour liées au contrat de maintenance) ; score v0 par règles, barème 40/30/20/10. | Ces trois lectures. | — |
| Q8 | Perte définitive : seuil de passage au conseil ; pénalités gelées ou non pendant un étalement. | Sans défaut ; le cœur décide des pénalités. | recette du recouvrement |
| Q9 | Le Copilot sans consentement à l'IA commune : où tourne le moteur de langage ? L'auditeur a-t-il un Copilot ? | Sur les serveurs de l'IMF ; Copilot de l'auditeur en lecture de la piste d'audit. | architecture IA |
| Q10 | Sources des données macro-économiques (prix, inflation, saison). | Sources publiques datées, puis Pulse quand il existe. | IA commune |
| Q11 | Seuil de l'avis du risque (2 000 000 FCFA, 48 h), nombre de retours pour garanties (2), délai d'un ordre non exécuté (24 h). | Ces défauts. | — |
| Q12 | Nom de l'IMF fictive, de ses agences et des protagonistes des parcours. | Lomé-Centre, Kpalimé, Kara ; noms des parcours. | jeu de démo |
| Q13 | Sauvegarde : perte maximale d'une heure et reprise en quatre heures conviennent-elles à une IMF qui décaisse chaque jour ? | Les garder, revoir avec la taille réelle. | PRD moteur |

### 12.3 Risques assumés

| Risque | Effet | Ce que le PRD fait |
|---|---|---|
| **Le cœur de l'IMF est inconnu.** | Le contrat d'échange peut ne pas convenir à son logiciel. | Contrat neutre, API ou fichiers, Prospera tire toujours ; le cœur fictif prouve le contrat ; le vrai connecteur est un travail à part (§6.5, annexe C). |
| **La réglementation bouge.** La loi uniforme sur la microfinance du 21/12/2023 remplace la loi SFD de 2007 ; ses instructions d'application, par pays, ne sont pas toutes connues. | Barèmes de provision, catégories, ratios et périodicités peuvent changer. | Tout texte est un paramètre daté, par pays et par texte (§6.8). **À faire vérifier par un juriste** : statut de la loi par pays ; provisions (40/80/100 %, perte à 24 mois) ; plafond de capitalisation ; TEG (décret, frais exclus, assurance) ; obligation de consulter le BIC ; adhésion à PI-SPI ; instructions LBC/FT du 18/03/2025 ; hébergement local et géolocalisation au Togo ; messages aux cautions ; données de voix. |
| **Les modèles de l'IA commune n'existent pas encore** (premier modèle commun au plus tôt au second semestre 2027, d'après la salle). | Au jour 1, l'IA est servie par des règles explicables. | Chaque capacité dit sa provenance ; « IA » n'est affiché que pour un modèle (FR-8). |
| **La promesse « zéro manipulation d'espèces »** n'est pas tenable : le guichet et la collecte manient des espèces. | Promesse commerciale trompeuse. | Elle devient un indicateur de part numérique, pas une règle (§1, §9). |
| **La démo n'enregistre rien** et ses chiffres sont des constantes. | Tout est à construire, y compris des écrans absents (visite, pièces, cautions, simulation, comité, décaissement). | Le PRD exige le vrai et liste les écrans à créer (§5.14). |
| **Le produit d'exemple de la démo est illégal** (TEG 36,4 %). | Montrer ce produit à l'IMF serait une faute. | Le jeu de démo n'a que des produits conformes (FR-10, FR-13). |
| **La charge de février** (Q4). | La démo de l'IMF peut glisser. | La démo de février est délimitée (★) ; le reste suit sans changer le PRD. |

---

## 13. Hypothèses

Index généré depuis le texte du PRD : chaque `[ASSUMPTION]` est une valeur ou une règle déduite sans décision du PO. Elle vaut **valeur par défaut modifiable** tant que le PO ne l'a pas tranchée. Les plus lourdes sont reprises au §12.2.

| # | Où | Hypothèse |
|---|---|---|
| H-1 | §1 | …30 en % de l'encours, mesuré depuis les échéances du cœur ; la baisse s'entend en **valeur relative** (un PAR de 12 % qui passe à 9-10 %) |
| H-2 | §2.3 | noms fictifs à valider par le PO |
| H-3 | FR-4 | méthode et fréquence de calcul |
| H-4 | FR-7 | nomenclature de départ inspirée de la classification des activités de l'UEMOA, à valider |
| H-5 | FR-8 | sources de départ — indices de prix et d'inflation publics, calendrier agricole, données agrégées de l'IA commune (Pulse) quand elles existent |
| H-6 | FR-11 | agences fictives Lomé-Centre, Kpalimé, Kara ; nom de l'IMF fictive à choisir par le PO |
| H-7 | FR-14 | langues locales « bientôt » |
| H-8 | FR-34 | …(IA commune non installée), le critère de score est marqué « non évalué » et ne bloque pas ; le critère d'ancienneté reste bloquant. |
| H-9 | FR-36 | …postérieure ; un dossier déjà décidé n'est pas rouvert, mais une alerte de conformité est émise si son TEG dépasse un nouveau plafond. |
| H-10 | FR-44 | …un paramètre par pays et par produit (défaut : non obligatoire), car l'obligation légale n'est pas confirmée (extrait réglementaire §5). |
| H-11 | FR-49 | …Ils sont fournis par l'IA commune (module Risque) ; **tant que son modèle n'existe pas, une règle explicable versionnée les sert** |
| H-12 | FR-52 | Au-dessus d'un **seuil de montant** (paramètre ; défaut : **2 000 000 FCFA** |
| H-13 | FR-55 | - Le nombre de retours pour garanties est limité (paramètre ; défaut : **2**) ; au-delà, le ROC doit refuser ou approuver. |
| H-14 | FR-58 | …des fonds propres : si le cœur ne les fournit pas, la mention « plafond non vérifiable » s'affiche et le contrôle est manuel (comité). |
| H-15 | FR-59 | - La date de la première échéance est saisie par le comité (défaut : un mois après la date prévue de décaissement |
| H-16 | FR-64 | - Un ordre non exécuté après un délai (paramètre ; défaut : **24 h** |
| H-17 | FR-73 | …cas de défaut et la règle de vote d'un groupe ne sont pas définies par les sources : le comité les enregistre dans les notes de séance. |
| H-18 | FR-86 | / Seuil de l'avis du risque ; délai / 2 000 000 FCFA |
| H-19 | FR-86 | / Retours pour garanties / 2 |
| H-20 | FR-86 | / Délai d'ordre non exécuté / 24 h |
| H-21 | FR-100 | la séparation auteur et publicateur est déduite de la séparation des tâches de l'instruction BCEAO n° 017-12-2010 ; le cahier de la démo dit seulement « administrateur ou DAF gèrent ». |
| H-22 | FR-102 | la démo montre deux méthodes contradictoires (capital constant dans l'exemple du cœur de la démo, mensualité constante dans le cahier) ; l'annuité constante est le défaut retenu par la recommandation C8 du PO. |
| H-23 | FR-111 | les taux exacts des autres produits du jeu de démo sont fixés à la rédaction du jeu, sous contrainte du test ci-dessous. |
| H-24 | FR-113 | valeur de départ ; à calibrer sur les données de l'IMF |
| H-25 | FR-116 | la clé de correspondance est le numéro de client du cœur ; le détail du contrat est en 6.5. |
| H-26 | FR-119 | les pièces exigées par niveau et les seuils de montant sont des défauts à faire valider par l'IMF ; le texte des instructions du 18/03/2025 n'a pas été lu en détail. |
| H-27 | FR-120 | « agent conformité » n'est pas l'un des 16 rôles ; c'est une habilitation accordée par le DG (rôle sensible, F7) à un CC, un RA ou un comptable, pas un 17e rôle. |
| H-28 | FR-121 | sources de listes et fréquence : à valider ; Prospera n'en choisit pas pour l'IMF. Le filtrage est un calcul sur des listes fournies, sans modèle. |
| H-29 | FR-122 | durées à faire valider par la conformité de l'IMF |
| H-30 | FR-124 | barème du score v0 = paiement 40, capacité 30, activité 20, terrain 10 (recommandation C11 du PO) ; il est défini et versionné par la partie 1 et le module Risque. |
| H-31 | FR-132 | durées de conservation et texte des consentements à faire valider par l'IMF et un juriste ; hébergement local par pays : non établi. |
| H-32 | FR-143 | le plafond de détention et le montant de démo sont des valeurs de départ ; ils sont calibrés sur les données de l'IMF après la reprise. |
| H-33 | FR-178 | Le calibrage statistique reste une règle explicable (percentiles de l'IMF, pas un modèle) tant que l'IA commune n'en fournit pas un (FR-181). |
| H-34 | FR-181 | Le score de risque de la version 0, par règles explicables, suit le barème de la partie 2 (paiement 40, capacité 30, activité 20, terrain 10) ; le PAR et la pr |
| H-35 | FR-187 | La balance est livrée par le cœur en postes au plan comptable SFD de l'installation ; la table de correspondance entre les comptes du cœur et ces postes est à |
| H-36 | FR-198 | Le point de coupure entre l'import et l'échange permanent est daté par l'IMF à la mise en service ; il n'est pas défini ailleurs pour la microfinance. |
| H-37 | FR-207 | à confirmer avec l'avis juridique sur les données de voix, §12.3 |
| H-38 | FR-209 | suspension pendant l'attente, pour ne pas relancer un client qui a payé |
| H-39 | FR-212 | lecture de D11, « au-delà de J+1 » |
| H-40 | FR-217 | signature du DG, d'après la ligne « rédigée, signature DG » de la démo |
| H-41 | FR-217 | …(PRD-D FR-114). Il n'y a pas de rôle « juriste » : un juriste de l'IMF peut rédiger hors Prospera, et le courrier est joint au dossier |
| H-42 | FR-219 | cadence de rappel |
| H-43 | FR-220 | sort des pénalités laissé au cœur, non décidé |
| H-44 | FR-221 | aucune valeur par défaut, l'IMF la fixe avant la mise en service |
| H-45 | FR-226 | …s'applique ; l'IMF peut activer « canal et moment choisis par la proposition de l'IA » pour ces paliers (paramètre ; défaut : éteint) |
| H-46 | FR-227 | poids de la démo, dont la ligne « capacité financière » était doublée pour un total de 105 % ; à calibrer sur les données de l'IMF |
| H-47 | FR-234 | chaîne de remontée à valider par le PO |
| H-48 | FR-237 | la démo exclut l'auditeur du Copilot ; le PO tranche |
| H-49 | FR-237 | lieu d'exécution du moteur de langage à trancher avec l'IA commune |
| H-50 | FR-240 | la démo ne donne aucun poids ; les poids ci-dessous sont des propositions à valider par le PO |
| H-51 | FR-242 | la gamification n'est pas dans les réponses du PO ; elle reste « bientôt » |
| H-52 | FR-245 | le cahier de la démo ne fixe pas de plafond ; à valider par l'IMF |
| H-53 | FR-245 | base du calcul à valider par le DAF ; la démo calcule revenu généré ÷ budget, qui n'est ni une marge ni un gain net et s'affiche sous le nom « retour brut » |
| H-54 | FR-247 | règle d'affectation par la zone du numéro non connue ; à défaut, la boîte du RCC |
| H-55 | FR-253 | le budget est une donnée de `finance-transactions` ; la démo n'a aucun budget saisi |
| H-56 | FR-255 | à porter au PRD `reseau` |
| H-57 | FR-256 | le bac à sable PI-SPI n'expose pas l'IBAN |
| H-58 | FR-256 | à porter au PRD `paiement` |
| H-59 | FR-257 | l'amendement du PRD `paiement` s'écrit avant la validation du lot ; ce PRD ne le rédige pas |
| H-60 | FR-258 | cadre juridique des messages à un tiers ; §12.3 |
| H-61 | FR-261 | lecture de la salle, séance 4 ; la licence ne couvre pas les évolutions |
| H-62 | FR-262 | délai à fixer au contrat de maintenance |
| H-63 | FR-263 | à porter au spine moteur, AD-9 |
| H-64 | FR-263 | AD-9 ne couvre que deux noms ; liste à fixer à l'installation |
| H-65 | FR-264 | le 443 publié par le serveur est limité au réseau interne ; nom et adresse choisis par l'IMF |
| H-66 | FR-265 | la supervision du PRD moteur est surtout côté Money Vibes ; la lecture locale par l'équipe de l'IMF est à porter au PRD moteur |
| H-67 | FR-266 | valeurs du cahier, à confirmer avec la taille réelle |
| H-68 | FR-266 | règle « au-delà d'un serveur » à fixer avec la taille réelle |
| H-69 | §8 | …concernés en moins de 5 s ; un mouvement du cœur, au plus tard une période d'échange après son arrivée (paramètre ; défaut : 15 min) |
| H-70 | §8 | …et langue / Navigateurs récents (Chrome, Firefox, Edge, Safari iOS) ; application terrain sur téléphone Android d'entrée de gamme |
| H-71 | §9 | horizon |

---

## Annexe A. Contrat de module (13 lignes par module)

Le contrat `CONTRAT-DE-MODULE-2026-11-09.md` (§6) demande à chaque PRD treize lignes par module, une par clause C1 à C13. **Les règles de lecture et les conventions communes sont celles du PRD distributeur (PRD-D annexe A)**, sans être recopiées : aucune cellule vide ; gate `<CODE>_NOT_ENTITLED` ; cloisonnement par `organisationId` et par portée ; profil compose `profiles: ["<code>"]` ; version `1.0.0` ; routes C13 de l'instance ; lecture seule, essai, export et effacement comme au PRD-D.

Ce qui change pour l'IMF :
- **Licence à vie** (D-13) : la lecture seule pour abonnement échu ne s'applique pas à cette IMF ; elle reste une capacité de la plateforme pour les autres clients.
- **Installation chez l'IMF** : chaque module tourne sur ses serveurs ; aucune route n'est ouverte vers l'extérieur ; les entrées passent par le relais (§7.9).
- **Codes à tiret** : `produits-financiers`, `coeur-sfd`, `risque-par` et `conformite-bceao` attendent l'élargissement du format de droits d'`auth-service` (amendement C7), comme les cinq codes à tiret du distributeur.
- **C11 IA** : chaque module déclare ses modèles et ses finalités ; le moteur est l'IA commune (FR-8). Les noms de modèles et de finalités sont des propositions.
- Les noms de services porteurs, de droits, de faits publiés et de modèles sont des **propositions**, modifiables avant le manifeste ; `[À CONFIRMER]` marque ce qui reste à lever.

### A.1 ★ Crédit (`credit`, M15)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'credit'`, `version: '1.0.0'`. `depends: [{produits-financiers, "Une demande vise un produit de crédit versionné ; ses bornes, son éligibilité, ses garanties et ses conditions sont figées par dossier."}, {microfinance, "Un dossier appartient à un client (personne ou groupe solidaire) dont la fiche, le KYC et la LBC/FT sont tenus par microfinance."}]` (dépendances **proposées**, à valider par le PO). `enrichiPar: [coeur-sfd (envoi du dossier accordé, exécution et confirmation du décaissement, échéancier officiel, clôture), paiement (décaissement Mobile Money et PI-SPI), notification (événements du processus), terrain (visites d'instruction, agenda, hors ligne), risque-par (part du secteur dans le portefeuille, classement), IA commune (score, décision suggérée, analyses), recouvrement (statuts de retard lus), reseau (agences, zones, portée)]`. Service porteur : un service `credit` [À CONFIRMER, M15 : à construire, le backend de démo ne compte pas]. |
| C2 Socle | Gate `CREDIT_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée lue dans `reseau.portee.changed@1` : DG réseau, RA son agence, CC les dossiers de son agence et sa file, ROC toutes les agences, GP son portefeuille, agent sa zone, RSQ et AUD en lecture, CPT son agence. Le serveur évalue seul les rôles et les gardes de chaque transition. |
| C3 Données possédées | Dossiers de crédit (12 statuts + ANNULE), dossiers de groupe et sous-dossiers, demandes et simulations retenues, pièces, cautions, garanties, visites d'instruction (preuves photo et GPS), checklists, grilles 5C, avis du CC et du risque, décisions du ROC, séances de comité (présents, votes, conditions figées), échéanciers contractuels, ordres de décaissement et leur sous-état, dérogations, délégations, résultats BIC saisis, journal infalsifiable des transitions. **Lues seulement** : produits (`produits-financiers`), clients et KYC (`microfinance`), soldes, encours, échéancier officiel, pénalités, caisse, dépôts (le cœur, via `coeur-sfd`), propositions de l'IA commune. **Aucun compte de prêt officiel, aucune caisse.** |
| C4 Emplacements vides | `produits-financiers` et `microfinance` sont des dépendances dures. `coeur-sfd` absent : l'envoi du dossier, l'ordre de décaissement et la confirmation sont `{etat: NON_INSTALLE, module: coeur-sfd}` ; la décision du comité reste possible, **le décaissement et le passage à EN_GESTION sont refusés** (`COEUR_NON_INSTALLE`). `paiement` absent : canaux Mobile Money et PI-SPI `NON_INSTALLE`, les canaux du cœur restent. `notification` absent : cloche interne seule, `NON_INSTALLE` pour SMS, WhatsApp, e-mail. `terrain` absent : visites saisies depuis le web, pas d'hors ligne (`NON_INSTALLE`). `risque-par` absent : part du secteur dans le portefeuille `NON_EVALUE`. **IA commune absente : tous les emplacements d'IA (score, décision suggérée, analyse narrative, analyse étendue, alertes IA, conditions optimales, étoiles, sentiment) = `NON_DISPONIBLE`, le dossier avance sur l'analyse humaine, jamais bloqué.** `recouvrement` absent : statut de retard `NON_INSTALLE`. `assurance` absent : garde « assurance souscrite » non remplie si le produit l'impose. Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `credit.dossier.changed@1`, `credit.dossier.soumis@1`, `credit.dossier.accorde@1` (conditions figées et échéancier contractuel, pour `coeur-sfd`), `credit.decaissement.ordonne@1`, `credit.decaissement.declare@1` (canaux `paiement`, déclaré au cœur), `credit.dossier.refuse@1`, `credit.dossier.cloture@1`, `credit.derogation.accordee@1`, `credit.alerte-audit.emise@1`. Consomme `produits-financiers.produit.publie@1`, `microfinance.client.changed@1`, `microfinance.kyc.changed@1`, `coeur-sfd.decaissement.confirme@1`, `coeur-sfd.pret.changed@1`, `coeur-sfd.pret.solde-nul@1`, `paiement.virement.execute@1`, `terrain.visite.terminee@1`, `recouvrement.dossier.changed@1`, `reseau.portee.changed@1`, `risque.proposition.emise@1` (IA commune), `etat-publie.changed.reel@1` et `.essai@1`. Les noms sont des propositions. |
| C6 Paramètres | Le tableau de FR-86 : plafond d'usure daté (24 %), éligibilité (45 ; 3 mois), cautions (2 au-dessus de 300 000 FCFA), garanties (10 / 15 % ; 30 / 50 %), visites (500 000 FCFA ; 100 m), taux d'effort 33 %, endettement 50 %, seuil de l'avis du risque et son délai, quorum et niveaux du comité (DG au-dessus de 5 000 000 FCFA), plafond des parties liées (10 %), méthode d'échéancier (annuité constante) et ses options, délai d'ordre non exécuté, taille d'un groupe (5 à 30), règle de renouvellement (30 jours ; 1,5 fois), conservation de la piste (10 ans), objectifs de délai (24 h ; 9 jours ; SLA 48 h), seuil de saturation sectorielle (35 %), canaux de décaissement par pays et par opérateur, gabarits de notification et de contrat. Données, jamais code. |
| C7 Droits | `credit:demande:saisir`, `credit:dossier:consulter`, `credit:dossier:instruire`, `credit:avis:rendre` (CC), `credit:avis:conseiller` (RSQ), `credit:decision:approuver` (ROC), `credit:comite:decider`, `credit:decaissement:ordonner`, `credit:decaissement:autoriser` (CPT, DAF), `credit:derogation:accorder`, `credit:delegation:gerer`, `credit:parametre:administrer`, `credit:journal:consulter` (AUD). Format conforme à `^[a-z]+:[a-z-]+:[a-z]+$`. Chaque droit demande une PR `auth-service` (catalogue fermé). |
| C8 Module d'écran | `src/modules/credit/` : `/credit` (tableaux RA, ROC, RSQ), `/credit/pipeline`, `/credit/dossiers` et `/credit/dossiers/[id]` (frise et onglets), `/credit/analyse`, `/credit/cycle`, `/credit/reseau` ; **à créer** : demande avec simulation, pièces, cautions et garanties, visites d'instruction, checklist, avis, décision du ROC, séance de comité, ordre de décaissement, dérogations et délégations, clôture et renouvellement, dossier de groupe. Entrées de menu par droit (`credit:dossier:consulter`, `credit:demande:saisir`, `credit:comite:decider`, `credit:decaissement:autoriser`). Boutons non branchés de la démo : « bientôt » (PRD-D FR-2). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : dossiers, journal, échéanciers contractuels restent stockés et masqués ; test aller-retour. Les ordres de décaissement déjà exécutés restent valides chez le cœur. Avertissement : « Plus aucun dossier de crédit ne sera saisissable ni décidé ; les prêts déjà décaissés restent tenus par le cœur. » |
| C10 Démarrer seul | `profiles: ["credit"]` ; socle + `produits-financiers` + `microfinance` + `reseau`. Avec le cœur fictif de la démo, le dossier va de SOUMIS à EN_GESTION sans autre module. |
| C11 IA | `ia: { modeles: ['score-dossier', 'decision-suggeree', 'analyse-dossier', 'analyse-macro-sectorielle', 'detection-fraude-dossier', 'recommandation-conditions'], finalites: ['aide-a-la-decision-credit', 'analyse-du-dossier', 'detection-des-alertes', 'analyse-sectorielle-et-macro', 'recommandation-de-produit'] }`. Le crédit **spécifie** ces capacités (FR-49, FR-95 à FR-99) ; le **moteur est l'IA commune** (module Risque et agents métier), qui apprend entre verticales sous consentement de l'IMF (PRD moteur). Le module n'embarque aucun modèle. Provenance affichée : règle ou modèle, version, date, données utilisées ; règle explicable (v0) tant que le modèle n'existe pas [ASSUMPTION]. L'IA propose, le CC, le ROC et le comité décident ; un écart exige un motif renvoyé comme correction ; aucune donnée ne sort sans consentement. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteurs : `analyse-etendue` (six volets, éteint tant que les sources macro d'un pays ne sont pas paramétrées), `avis-du-risque-obligatoire`, `echeancier-methode-par-produit`. La forme du journal et de l'échéancier contractuel ne change jamais dans la fenêtre de sept jours. Un statut ou un sous-état ajouté est lu comme inconnu par la version précédente. |
| C13 Installable sous contrôle | Prérequis : `produits-financiers` et `microfinance` en service ; plafond d'usure daté publié. Vérifications : `usure-bloquante` (🟢 si un produit d'essai au TEG supérieur au plafond est refusé aux trois points : simulation, comité, décaissement ; 🔴 sinon) ; `echeancier-concordant` (🟢 si l'échéancier d'un dossier d'essai somme à son capital, écart 0 FCFA, et si la simulation et l'échéancier du comité concordent ; 🔴 sinon) ; `statuts-et-transitions` (🟢 si les 12 statuts sont atteints dans l'ordre sur un dossier d'essai et si une transition interdite est refusée). Lecture seule : consultation, journal, export. **`objetsDeReprise: ['credit.pret-en-cours@1']** : les **prêts en cours** (montant décaissé, encours, intérêts courus, pénalités, dates, canal, échéancier, cautions), repris selon la **partie 3b** (import du portefeuille) ; valeur de contrôle : encours total (donnée, vérifié contre le cœur). `domainesEchange` : `credit.dossiers-accordes` (`MOUVEMENT`, `argent: true`, `controle: true`, publie `credit.dossier.accorde@1`), un seul point d'écriture, identifiant stable ; le propriétaire de l'argent reste le cœur [À CONFIRMER avec la partie 3b]. Essai : tout ordre de décaissement réel est intercepté et compté. |

*Conventions de lecture (celles de PRD-D annexe A) : une cellule n'est jamais vide ; gate `<CODE>_NOT_ENTITLED` (code en majuscules, tiret remplacé par `_`) ; `organisationId` sur chaque lecture et écriture ; `profiles: ["<code>"]` ; version `1.0.0` ; `retourArriere` à `SANS_PERTE` sauf mention. Les noms de codes, droits, topics, modèles et finalités sont des **propositions**. Le code `produits-financiers` a un **tiret** : ses droits ne passent le format de droit que depuis l'élargissement prévu par l'amendement C7 du 2026-11-11. L'IA est celle de l'IA commune : ces modules la **consomment** (C11 déclare les modèles et finalités demandés) et n'en ont aucune propre.*

### A.2 ★ Produits financiers (`produits-financiers`, M46 [proposition])

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'produits-financiers'`, `version: '1.0.0'`. `depends: []` (aucun module n'est requis pour tenir un catalogue). `enrichiPar: [coeur-sfd (code produit du cœur, FR-110), microfinance (score et ancienneté pour l'éligibilité, FR-104), credit (consomme les versions et fige les conditions, partie 2), risque-par (taux et frais pour la lecture du portefeuille), ia-commune (recommandation, conditions optimales)]`. Code de module et service porteur : proposition [À CONFIRMER, M46]. |
| C2 Socle | Gate `PRODUITS_FINANCIERS_NOT_ENTITLED`. Cloisonnement par `organisationId` ; le catalogue est celui de l'IMF, lu par tous les rôles du crédit, écrit par l'administrateur ou le DAF, publié par le DG ou le ROC (FR-100). ADMIN_IMF ne lit aucune donnée de client. |
| C3 Données possédées | Produits de crédit et d'épargne, **versions horodatées** (taux, bornes, périodicité, méthode d'amortissement, frais et drapeaux « inclus dans le TEG », assurance, éligibilité, cautions et garanties exigées), statut (brouillon, publié, retiré, à revoir), code produit du cœur, journal de publication. Lues seulement : plafond d'usure daté (partie 1), score (IA commune), identifiant et code du cœur. |
| C4 Emplacements vides | `coeur-sfd` absent : code produit du cœur = `{etat: NON_INSTALLE, module: coeur-sfd}` ; un produit se publie, **aucun dossier qui le porte ne peut être accordé** (FR-110). `microfinance` absent : éligibilité = `NON_INSTALLE`, la demande n'est pas contrôlée et est refusée par défaut (garde-fou non vérifiable). `ia-commune` absente : recommandation et conditions optimales = « indisponible » ; simulation manuelle complète. `credit` absent : le catalogue se tient seul. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `produits-financiers.produit.publie@1` (version figeable par `credit`), `produits-financiers.produit.retire@1`, `produits-financiers.produit.a-revoir@1` (plafond d'usure abaissé), `produits-financiers.produit.changed@1`. Consomme `etat-publie.changed.*@1`, `coeur-sfd.produit.code@1` (code du cœur), `microfinance.client.changed@1` (éligibilité), le plafond d'usure daté de la partie 1. |
| C6 Paramètres | Bornes par version ; pas de saisie du montant (10 000 FCFA) ; montant minimum de démo (50 000 FCFA) ; score minimum (45) et ancienneté minimum (3 mois) ; seuil d'ajustement de risque (score 60, +2 points, +1 à +5) ; cautions (2 au-dessus de 300 000), dépôt (10 %, 15 % au-dessus de 1 000 000), garantie réelle (30 %, 50 %) ; capacité de remboursement (40 % du revenu net estimé) ; durée de dormance par produit (6 mois) ; plafond d'usure (24 %, daté, partie 1). Données, jamais code. |
| C7 Droits | `produits-financiers:produit:consulter`, `produits-financiers:produit:gerer`, `produits-financiers:produit:publier`, `produits-financiers:derogation:accorder` (éligibilité, ROC), `produits-financiers:simulation:lancer`. Forme élargie (tiret dans le module). |
| C8 Module d'écran | `src/modules/produits-financiers/` : `/produits` (catalogue, fiche de version, historique, simulation). Entrées : « Produits » (`produits-financiers:produit:consulter`). Boutons : « Nouveau produit », « Publier », « Simuler » branchés ; famille tontine et assurance : « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien ; produits et versions restent stockés, masqués ; **les dossiers accordés gardent leurs conditions figées** (stockées dans `credit`). Avertissement : « Plus aucun produit ne sera proposé ; les dossiers en cours gardent leurs conditions. » |
| C10 Démarrer seul | `profiles: ["produits-financiers"]` ; socle + `reseau`. Le catalogue se tient sans le cœur. |
| C11 IA | `ia: { modeles: ['recommandation-produit', 'conditions-optimales'], finalites: ['recommandation-de-produit', 'proposition-de-conditions'] }` : capacités FR-112 et FR-113, servies par l'IA commune (module Relation client et module Risque). **Aucune IA propre à ce module.** Données fournies à l'IA commune : profil du client (secteur, ancienneté, revenus estimés), produits éligibles, uniquement **sous le consentement « IA commune »** du client. L'IA propose, l'agent choisit ; indisponible, rien ne bloque. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'` (une version publiée ne change jamais de forme). Interrupteurs : `controle-usure-publication` (allumé, jamais éteint en production), `recommandation-produit`. Un champ de produit ajouté est lu comme inconnu par la version précédente. |
| C13 Installable sous contrôle | Prérequis : plafond d'usure publié (partie 1). Vérifications : `produits-conformes` (🟢 si le TEG de tous les cas extrêmes de chaque version publiée est ≤ au plafond ; 🔴 si un seul le dépasse) ; `jeu-de-demo-conforme` (🟢 si les produits du jeu de démo sont tous ≤ 24 %) ; `code-cœur-present` (🟠 si un produit publié n'a pas de code du cœur). Lecture seule : catalogue, versions, export. Export, import, effacement par organisation ; `objetsDeReprise: ['produits-financiers.produit@1']` (produits en cours, si le cœur ne les fournit pas) [À CONFIRMER avec la Reprise] ; `domainesEchange: ['produits']` (propriétaire : le cœur pour le code et le plan comptable, Prospera pour le catalogue commercial). |

### A.3 ★ Clients, KYC et LBC/FT (`microfinance`, M32)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'microfinance'`, `version: '1.0.0'`. `depends: [{reseau, "Un client appartient à une agence et à une zone ; le périmètre de lecture vient de la portée du réseau."}]`. `enrichiPar: [coeur-sfd (identifiant du cœur, comptes d'épargne et mouvements lus, FR-116 et FR-130), produits-financiers (éligibilité), credit (dossiers, cautions, partie liée), terrain (visites, position), collecte, notification (alertes de revue et de sanctions), ia-commune (score, PD, signaux faibles, analyses, zones, épargne)]`. Le paquet comptable `prospera-microfinance-service` n'est pas installé chez cette IMF au jour 1 (A11) ; on en réutilise les règles seulement. Service porteur [À CONFIRMER, M32]. |
| C2 Socle | Gate `MICROFINANCE_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée (zone, agence, portefeuille, réseau) : DG réseau, RA agence, CC ses dossiers, GP son portefeuille, agent terrain, commercial et collecteur leur zone, auditeur lecture seule ; **ADMIN_IMF ne lit aucune donnée métier** (FR-133). Accès journalisé. |
| C3 Données possédées | Prospects, clients (personnes) et groupes solidaires (composition, rôles, caution mutuelle, réunions), fiche (identité, secteur d'activité, photos, position), pièces et expirations, niveaux et statuts de KYC, PPE et bénéficiaire effectif, listes de sanctions importées et leurs correspondances, files de revue, alertes CENTIF, consentements par finalité, notation de risque LBC, journal d'accès. Lues seulement : comptes, soldes, mouvements d'épargne et identifiant (cœur) ; score, PD, analyses (IA commune) ; produits (`produits-financiers`). |
| C4 Emplacements vides | `coeur-sfd` absent : comptes d'épargne et identifiant = `{etat: NON_INSTALLE, module: coeur-sfd}` ; la fiche s'ouvre, **aucun décaissement** n'est possible (client « en attente du cœur », FR-116) ; `ia-commune` absente : score = règle v0 ou « indisponible », PD, signaux faibles, analyse étendue, zones suggérées, épargne = « indisponible » (FR-124 à FR-131) ; `produits-financiers` absent : éligibilité = `NON_INSTALLE` ; `credit` absent : cautions et dossiers = `NON_INSTALLE` ; `terrain` absent : visites et position lues de la fiche seule ; `notification` absent : alertes dans l'écran seulement. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `microfinance.client.changed@1`, `microfinance.client.converti@1`, `microfinance.kyc.changed@1` (niveau, statut, expiration), `microfinance.groupe.changed@1`, `microfinance.sanctions.correspondance@1`, `microfinance.consentement.changed@1`, `microfinance.alerte-centif.creee@1`, `microfinance.revue.echue@1`. Consomme `coeur-sfd.client.changed@1`, `coeur-sfd.epargne.changed@1`, `coeur-sfd.mouvement.recu@1`, `credit.dossier.changed@1`, `collecte.collecte.changed@1`, `reseau.portee.changed@1`, `etat-publie.changed.*@1`. Émet vers l'IA commune, sous consentement, le lot de données structurées (secteur d'activité inclus). |
| C6 Paramètres | Pièces par niveau de KYC ; périodicité de revue (renforcé 12, standard 24, simplifié 36 mois) ; délai avant « à renouveler » (30 jours) ; alerte d'expiration (30 jours) ; seuil CENTIF (15 000 000 FCFA) et cumul fractionné (80 %, 7 jours) ; fréquence de rafraîchissement des listes (quotidien) ; sources de listes ; nombre de membres d'un groupe (5 à 30) ; un groupe actif par personne ; seuils d'alerte de signaux faibles (calibrés sur les données de l'IMF, défaut 0,7) ; délai de recalcul de la PD (15 minutes) ; nomenclature des secteurs ; durées de conservation (≥ 10 ans pour la piste d'audit). Données, jamais code. |
| C7 Droits | `microfinance:client:consulter`, `microfinance:client:creer`, `microfinance:client:convertir`, `microfinance:kyc:valider`, `microfinance:kyc:consulter`, `microfinance:sanctions:traiter`, `microfinance:groupe:gerer`, `microfinance:epargne:consulter`, `microfinance:analyse:consulter`, `microfinance:consentement:gerer`, `microfinance:journal:consulter` (auditeur). Format conforme. L'habilitation de conformité est le droit `microfinance:kyc:valider` + `microfinance:sanctions:traiter`, accordé par le DG (FR-120). |
| C8 Module d'écran | `src/modules/microfinance/` : `/clients` (liste, prospects), `/clients/nouveau`, `/clients/[id]` (fiche : identité, activité, KYC, groupe, épargne lue, analyse), `/groupes`, `/kyc` (file de validation, revues, sanctions), `/zones-risque` (carte). Entrées selon les droits. Boutons non branchés de la démo (« Nouveau emprunteur », « Ajouter un document ») sont **branchés** ; tontines, rapprochement BIC direct : « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien ; fiches, pièces, consentements et journal restent stockés et masqués (la piste d'audit se conserve ≥ 10 ans) ; test aller-retour. Avertissement : « Les fiches clients ne seront plus consultables ni vérifiables ; les dossiers en cours restent. » |
| C10 Démarrer seul | `profiles: ["microfinance"]` ; socle + `reseau`. |
| C11 IA | `ia: { modeles: ['score-client', 'probabilite-defaut', 'signaux-faibles-client', 'analyse-sectorielle-micro-macro', 'couverture-zones-prospection', 'comptes-dormants', 'recommandation-epargne', 'fidelite-epargne'], finalites: ['evaluation-du-risque-client', 'alerte-precoce', 'analyse-du-secteur', 'suggestion-de-zones', 'animation-de-l-epargne'] }` : capacités FR-124 à FR-128 et FR-131, servies par l'IA commune (module Risque, Agents métier, Pulse). **Aucune IA propre à ce module.** Données fournies à l'IA commune : fiche structurée (secteur et sous-secteur d'activité, ancienneté, revenus estimés, localisation si consentie), historique de paiement et d'épargne lu du cœur, uniquement **sous le consentement « IA commune »** (FR-132) ; retirer le consentement arrête l'envoi. Provenance affichée ; l'IA propose, l'humain décide ; absente, la règle v0 ou « indisponible » sert et rien ne bloque. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive (la nomenclature des secteurs évolue par correspondance d'anciens codes, FR-117). Interrupteurs : `filtrage-sanctions` (allumé, jamais éteint en production), `analyse-etendue`, `signaux-faibles`. Un champ de fiche ajouté est lu comme inconnu par la version précédente. |
| C13 Installable sous contrôle | Prérequis : `reseau` en service ; au moins une liste de sanctions chargée. Vérifications : `listes-a-jour` (🟢 si chaque liste est plus récente que sa fréquence ; 🔴 si une liste a plus de 3 fois sa fréquence) ; `kyc-par-niveau` (🟢 si chaque niveau a ses pièces définies) ; `consentements-lus` (🟢 si un client sans consentement « IA commune » n'est dans aucun lot, sur le jeu de contrôle) ; `identifiant-cœur` (🟠 si une fiche liée n'a pas d'identifiant du cœur). Lecture seule : consultation des fiches, export. Export, import, effacement par organisation (l'effacement respecte la conservation légale). `objetsDeReprise: ['microfinance.client@1', 'microfinance.groupe@1', 'microfinance.kyc@1']` [À CONFIRMER avec le PRD Reprise, M44] ; `domainesEchange: ['clients', 'comptes-epargne']` (propriétaire : le cœur pour l'identité légale, les comptes et les soldes ; Prospera pour l'activité, les photos, la position, le KYC et les groupes). |

### A.4 ★ Collecte (`collecte`, M16)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'collecte'`, `version: '1.0.0'`. `depends: [{microfinance, "Une collecte vise un client ou un groupe et son compte ou son échéance."}, {reseau, "Un collecteur travaille dans sa zone."}]`. `enrichiPar: [coeur-sfd (échéancier, comptes, renvoi et confirmation, FR-137), terrain (visite, position, application hors ligne), paiement (Mobile Money, PI-SPI, FR-140), caisse (remise et clôture), notification (reçu par SMS), ia-commune (priorités du jour)]`. Service porteur [À CONFIRMER, M16]. |
| C2 Socle | Gate `COLLECTE_NOT_ENTITLED`. `organisationId` et portée : le collecteur lit et enregistre pour sa zone et ses clients de collecte ; le RA son agence ; le RCC son agence ou sa région ; le CPT les remises de son agence ; l'auditeur lit. |
| C3 Données possédées | Collectes (type, montant, canal, client, compte ou échéance, collecteur, date serveur et date appareil, position, clé d'idempotence, état DECLAREE / ENVOYEE / CONFIRMEE / REFUSEE), reçus numérotés, remises d'espèces et leur contresignature, annulations avec motif, rapprochements et écarts, listes « à saisir dans le cœur », plans du jour. Lues seulement : échéances, soldes, mouvements (cœur) ; clients (`microfinance`). |
| C4 Emplacements vides | `coeur-sfd` absent : échéancier et confirmation = `{etat: NON_INSTALLE, module: coeur-sfd}` ; la collecte s'enregistre et reste DECLAREE ; la liste « à saisir dans le cœur » sert (FR-137) ; `paiement` absent : collecte Mobile Money = `NON_INSTALLE` (espèces seulement) ; `caisse` absente : la remise s'enregistre sans clôture du jour ; `terrain` absent : pas de plan préchargé ni de position ; `notification` absent : reçu papier seulement ; `ia-commune` absente : ordre des priorités = règle de base (retards, J-3, prospects). Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `collecte.collecte.changed@1`, `collecte.collecte.confirmee@1`, `collecte.collecte.refusee@1`, `collecte.remise.contresignee@1`, `collecte.ecart.detecte@1`, `collecte.liste-a-saisir.changed@1`. Consomme `coeur-sfd.echeancier.changed@1`, `coeur-sfd.mouvement.recu@1` (confirmation), `microfinance.client.changed@1`, `paiement.encaissement.changed@1`, `terrain.visite.changed@1`, `reseau.portee.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Ordre d'imputation (pénalités, intérêts, capital) ; écart de rattachement automatique (1 %) ; fenêtre et tolérance de doublon (5 minutes, ± 100 FCFA) ; plage de numéros de reçu par appareil ; âge maximum d'une collecte en file (7 jours) ; espèces non remises (1 jour) ; lot de synchronisation (50 collectes en 30 s) ; heures d'envoi du plan (veille au soir) ; priorités du plan. Données, jamais code. |
| C7 Droits | `collecte:collecte:saisir`, `collecte:collecte:consulter`, `collecte:collecte:annuler` (RA), `collecte:remise:contresigner` (CPT), `collecte:rapprochement:traiter`, `collecte:plan:consulter`, `collecte:agence:consulter`. Format conforme. |
| C8 Module d'écran | `src/modules/collecte/` : `/collecte` (plan du jour, saisie, reçus, file de synchronisation), `/collecte/remises`, `/collecte/rapprochement`, `/collecte/a-saisir`. Application terrain hors ligne (Flutter, PRD-D FR-109). Collecte de tontine : « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien ; collectes, reçus et remises restent stockés et masqués ; **la suite de numéros de reçu est conservée** (réinstaller reprend sans trou ni doublon). Avertissement : « La collecte terrain s'arrête ; les collectes non confirmées ne seront plus envoyées au cœur. » |
| C10 Démarrer seul | `profiles: ["collecte"]` ; socle + `reseau` + `microfinance`. |
| C11 IA | `ia: { modeles: ['priorites-du-jour'], finalites: ['ordre-de-visite-propose'] }` : capacité FR-142, servie par l'IA commune (module Agents métier). **Aucune IA propre à ce module.** Données fournies à l'IA commune : échéances et retards (lus du cœur), promesses, score, signaux faibles, secteur, distance, uniquement **sous le consentement « IA commune »** ; l'ordre est une proposition réordonnable. Absente, la règle de base sert. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'` (le compteur de reçus ne change jamais de forme dans la fenêtre de 7 jours). Interrupteurs : `renvoi-automatique-au-coeur` (éteint tant que le cœur ne sait pas recevoir : la liste « à saisir » sert), `priorites-ia`. |
| C13 Installable sous contrôle | Prérequis : `microfinance` et `reseau` en service. Vérifications : `recus-continus` (🟢 si la suite de reçus de chaque collecteur n'a ni trou ni doublon sur les 100 derniers ; 🔴 sinon) ; `idempotence` (🟢 si le renvoi de la même collecte 5 fois n'en crée qu'une, sur le jeu de contrôle) ; `collectes-concordantes` (🟢 si, sur le jeu de contrôle, chaque collecte CONFIRMEE a un mouvement du cœur de même montant ; 🔴 sinon). Lecture seule : consultation, liste « à saisir », export. `objetsDeReprise: []` (aucune collecte passée n'est reprise ; l'historique vient du cœur) [À CONFIRMER avec le PRD Reprise] ; `domainesEchange: ['paiements-collectes']` (propriétaire : le cœur pour l'imputation et les écritures ; Prospera pour l'enregistrement, le reçu et la remise). |

### A.5 Caisse des collecteurs (`caisse`, M14)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'caisse'`, `version: '1.0.0'`. `depends: [{collecte, "La caisse des collecteurs est faite des collectes remises et clôturées."}]`. `enrichiPar: [coeur-sfd (caisse du guichet lue, décaissement espèces exécuté, FR-146), paiement (paiements Mobile Money, PI-SPI), reseau (agences), notification (alertes d'écart), ia-commune (validation Mobile Money, anomalies, prévision de trésorerie, rééquilibrage)]`. Service porteur [À CONFIRMER, M14]. |
| C2 Socle | Gate `CAISSE_NOT_ENTITLED`. `organisationId` et portée : le collecteur sa position ; le CPT son guichet ; le RA son agence ; le DAF et le DG le réseau ; l'auditeur lit avec le journal. Le DAF ou le DG autorise un fonds de caisse (FR-143). |
| C3 Données possédées | Fonds de caisse des collecteurs, clôtures du jour (OUVERTE, VALIDEE, ECART), écarts (deux montants, motif de résolution), alertes d'écart et de récurrence, seuils proposés et validés. Lues seulement : caisse du guichet, flux, clôture, solde de l'opérateur (cœur) ; collectes et remises (`collecte`) ; paiements (`paiement`). **Aucun solde de caisse du guichet n'est tenu** : le cœur fait foi. |
| C4 Emplacements vides | `coeur-sfd` absent : caisse du guichet = `{etat: NON_INSTALLE, module: coeur-sfd}` (FR-146) ; la caisse des collecteurs se tient seule ; `paiement` absent : file Mobile Money = `NON_INSTALLE` ; `reseau` absent : pas de vue par agence ; `notification` absent : alertes dans l'écran seulement ; `ia-commune` absente : validation, anomalies, prévision, rééquilibrage = « indisponible », les seuils d'écart de FR-145 restent actifs. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `caisse.cloture.changed@1`, `caisse.ecart.detecte@1`, `caisse.ecart.resolu@1`, `caisse.fonds.changed@1`, `caisse.alerte.changed@1`. Consomme `collecte.remise.contresignee@1`, `collecte.collecte.changed@1`, `coeur-sfd.caisse.changed@1`, `paiement.encaissement.changed@1`, `reseau.portee.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Plafond de détention d'un collecteur (100 000 FCFA, calibré sur les données de l'IMF) ; plafond d'alerte de détention (500 000 FCFA) ; seuil d'alerte d'écart (5 000 FCFA, calibré sur les données de l'IMF, proposé puis validé par le DAF ou le DG, recalculé périodiquement) ; récurrence d'écarts (3 en 30 jours) ; blocage par clôture non faite (1 jour) ; heure du rapport du soir (18 h 00) ; âge d'un paiement Mobile Money en attente (24 h). Données, jamais code. |
| C7 Droits | `caisse:fonds:attribuer` (DG, DAF), `caisse:cloture:consulter`, `caisse:cloture:valider` (CPT), `caisse:ecart:resoudre` (RA, DAF), `caisse:guichet:consulter` (lecture du cœur), `caisse:alerte:consulter`, `caisse:prevision:consulter` (DAF, DG, RA), `caisse:seuil:valider` (DAF, DG). Format conforme. |
| C8 Module d'écran | `src/modules/caisse/` : `/caisse` (position, clôtures, écarts, vue du réseau), `/caisse/guichet` (lecture du cœur), `/caisse/previsions`. Entrées selon les droits. Boutons « bientôt » : exécution des virements entre agences, rapprochement du float Mobile Money avec le relevé de l'opérateur, réserve obligatoire et tension par agence, caisse des tontines. |
| C9 Installer/désinstaller | Désinstaller ne supprime rien ; clôtures, écarts et fonds restent stockés et masqués ; les écarts ouverts restent résolubles à la réinstallation. Avertissement : « Les clôtures du jour des collecteurs ne seront plus faites ; les écarts ouverts restent. » |
| C10 Démarrer seul | `profiles: ["caisse"]` ; socle + `reseau` + `collecte` + `microfinance`. |
| C11 IA | `ia: { modeles: ['validation-mobile-money', 'anomalies-caisse', 'prevision-tresorerie-7j', 'reequilibrage-agences'], finalites: ['aide-a-la-validation', 'detection-d-anomalies', 'prevision-de-tresorerie', 'suggestion-de-reequilibrage'] }` : capacités FR-147 à FR-149, servies par l'IA commune (module Agents métier, module Risque). **Aucune IA propre à ce module.** Données fournies à l'IA commune : paiements Mobile Money, collectes, remises, écarts, annulations, lectures de la caisse du guichet (cœur), sous consentement de l'IMF pour la mutualisation entre verticales (apprentissage fédéré). L'IA ne valide jamais un paiement, ne passe aucune écriture, ne déplace aucun fonds ; une alerte n'est pas une accusation. Absente, les seuils d'écart et les règles de doublon restent actifs. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Interrupteurs : `blocage-cloture-non-faite`, `alerte-recurrence`, `ia-caisse`. Les seuils proposés par recalcul ne s'appliquent jamais sans validation humaine. |
| C13 Installable sous contrôle | Prérequis : `collecte` en service. Vérifications : `cloture-complete` (🟢 si, sur le jeu de contrôle, une clôture refuse un collecteur avec une collecte non synchronisée ou sans remise ni motif) ; `ecart-calcule` (🟢 si le déclaré 450 000 et le compté 441 000 donnent un écart de 9 000 et une alerte au RA, au DAF et à l'auditeur ; 🔴 sinon) ; `lecture-guichet` (🟠 si la dernière lecture du cœur a plus de 24 h). Lecture seule : consultation, export. `objetsDeReprise: []` (la caisse du guichet est celle du cœur ; les clôtures passées de collecteurs ne sont pas reprises) [À CONFIRMER] ; `domainesEchange: ['caisse-guichet']` (propriétaire : le cœur ; Prospera lit seulement). |

### A.6 ★ Échange avec le cœur (`coeur-sfd`, M47 [proposition])

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'coeur-sfd'`, `version: '1.0.0'`. `depends: [{reseau, "Une agence du cœur se range dans le réseau ; son code est celui du cœur s'il existe (FR-164)."}, {produits-financiers, "Un prêt reçu du cœur se rattache à un produit versionné."}]`. `enrichiPar: [credit (dossier accordé, ordre de décaissement), microfinance (clients, épargne lue), collecte (remboursements saisis), caisse (caisse du guichet lue), recouvrement (échéancier officiel, pénalités), risque-par (prêts, paiements), conformite-bceao (balance), paiement (décaissement Mobile Money et PI-SPI déclaré au cœur), reprise (import du portefeuille), connecteurs (vrai connecteur, hors février)]`. Service porteur : à créer [À CONFIRMER] ; le cœur fictif est livré à côté (FR-166), jamais dans un espace réel (FR-167). |
| C2 Socle | Gate `COEUR_SFD_NOT_ENTITLED`. Cloisonnement par `organisationId`. Lecture de la file des écarts : CPT, DAF, ROC (agence pour CPT). Aucune porte entrante : Prospera tire toujours (FR-157). |
| C3 Données possédées | Journal des échanges, file d'envoi (dossiers accordés, ordres, remboursements à renvoyer), états d'envoi, file des écarts, listes « à saisir dans le cœur », état de fraîcheur par objet, état de rapprochement trimestriel, paramètres d'échange (transport, fraîcheur, délais). **Aucun solde** : l'argent reste au cœur ; les objets reçus sont publiés par fait, pas conservés comme vérité. Lues seulement : agences (`reseau`), produits (`produits-financiers`), dossiers (`credit`). |
| C4 Emplacements vides | `credit` absent : aucun dossier accordé ni ordre à envoyer, état `NON_INSTALLE` ; `paiement` absent : décaissement Mobile Money et PI-SPI = `NON_INSTALLE`, seuls espèces et virement par le cœur restent ; `microfinance` absent : clients lus seulement comme références de prêt ; `caisse` absente : caisse du guichet = `NON_INSTALLE` ; `risque-par` et `conformite-bceao` absents : aucune lecture dérivée. Cœur absent ou injoignable : tous les objets en `{etat: PERIME, depuis}` (FR-165). Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `coeur-sfd.pret.changed@1`, `coeur-sfd.echeancier.changed@1`, `coeur-sfd.paiement.recu@1`, `coeur-sfd.penalite.recue@1`, `coeur-sfd.epargne.changed@1`, `coeur-sfd.caisse-guichet.changed@1`, `coeur-sfd.balance.recue@1`, `coeur-sfd.ecart.ouvert@1`, `coeur-sfd.ordre-decaissement.etat@1`, `coeur-sfd.dossier-accorde.etat@1`, `coeur-sfd.fraicheur.changed@1`, `coeur-sfd.ecart.propose@1`. Consomme `credit.dossier.accorde@1`, `credit.ordre-decaissement.emis@1`, `collecte.remboursement.saisi@1`, `paiement.decaissement.execute@1`, `reseau.agence.changed@1`, `etat-publie.changed.reel@1` et `.essai@1`. Noms proposés. |
| C6 Paramètres | Transport (API ou fichiers) ; fraîcheur par objet (5 min, heure, nuit) ; délai de confirmation d'un envoi (24 h) ; délai d'un remboursement sans mouvement du cœur (48 h) ; délai d'un élément de la liste « à saisir dans le cœur » (72 h) ; tolérance d'écart d'échéancier (0 FCFA sur les dates, 1 % sur les montants) ; fréquence de l'interrogation du relais (1 min) ; trimestre du rapprochement et écart toléré (30 jours) ; code d'agence du cœur ou de Prospera. Données, jamais code. |
| C7 Droits | `coeur-sfd:echange:consulter`, `coeur-sfd:echange:configurer`, `coeur-sfd:ecart:consulter`, `coeur-sfd:ecart:resoudre`, `coeur-sfd:rapprochement:consulter`, `coeur-sfd:rapprochement:valider`, `coeur-sfd:liste-a-saisir:exporter`. Format conforme (module en lettres et tiret admis seulement après l'élargissement du format de droit ; le code `coeur-sfd` a un tiret : même condition que dans PRD-D annexe A, §« Format des droits »). |
| C8 Module d'écran | `src/modules/coeur-sfd/` : `/echange` (état par objet, fraîcheur), `/echange/ecarts` (file des écarts), `/echange/a-saisir` (liste par agence), `/echange/rapprochement` (trimestriel), `/echange/parametres`. Entrées : « Échange avec le cœur » (`coeur-sfd:echange:consulter`), « Écarts » (`coeur-sfd:ecart:consulter`). Boutons non branchés : « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : le journal, la file et les écarts restent stockés et masqués ; test aller-retour. Avertissement : « Plus aucun dossier accordé ni ordre ne partira vers le cœur ; ce qui est en file reste en file. » |
| C10 Démarrer seul | `profiles: ["coeur-sfd"]` ; socle + `reseau` + `produits-financiers`. Le cœur fictif s'y ajoute dans un espace d'essai seulement. |
| C11 IA | `ia: { modeles: ['detection-ecarts-doublons'], finalites: ['rapprochement-assiste'] }` : détection des écarts et des doublons probables entre Prospera et le cœur, avec cause probable et confiance (FR-199). Le moteur est l'IA commune ; sans elle, la file des écarts fonctionne par règles et rien ne bloque. L'IA propose, un humain rapproche ; l'IA ne corrige jamais de l'argent. Provenance affichée (règle ou modèle, version, date) ; données vers l'IA commune seulement avec le consentement de l'IMF. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Version du contrat d'échange portée par chaque objet ; un objet d'une version plus récente est refusé « version inconnue » et va dans la file des écarts. Interrupteur : `echange-par-fichiers` (transport seulement, jamais la forme des données). |
| C13 Installable sous contrôle | Prérequis : `reseau` et `produits-financiers` en service. Vérifications : `cœur-joignable` (🟢 si la dernière interrogation a réussi depuis moins de deux fois la fraîcheur par défaut ; 🟠 si périmée ; 🔴 si jamais) ; `aucun-port-entrant` (🟢 si aucun port n'est ouvert pour l'échange ; 🔴 sinon) ; `envoi-idempotent` (🟢 si un lot rejoué ne change aucun compte du jeu de contrôle) ; `solde-de-controle` (🟢 si 100 % des prêts du jeu de contrôle ont le solde du cœur au franc près) ; `coeur-fictif-absent-du-reel` (🔴 si le cœur fictif est actif dans un espace réel). Lecture seule : `GET` sur la file et l'état, export. Export, import, effacement par organisation ; `objetsDeReprise: ['client', 'pret', 'echeance', 'garantie', 'compte-epargne']` (schémas à déclarer, FR-196) ; `domainesEchange: ['clients', 'prets', 'echeances', 'paiements', 'penalites', 'epargne', 'caisse-guichet', 'balance', 'dossiers-accordes', 'ordres-decaissement', 'remboursements-saisis']`, propriétaire de l'argent = le cœur. |

### A.7 ★ Risque de portefeuille (`risque-par`, M18)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'risque-par'`, `version: '1.0.0'`. `depends: [{coeur-sfd, "Prêts, échéanciers officiels et paiements viennent du cœur ; sans eux il n'y a pas de portefeuille à mesurer."}, {reseau, "Le PAR se ventile par région, agence, zone."}]`. `enrichiPar: [produits-financiers (ventilation par produit), microfinance (secteur d'activité du client, garanties), recouvrement (statuts), dashboard (tableaux du DG et du ROC), conformite-bceao (états), notification (alertes), IA commune Risque (prévisions et analyses, FR-180, FR-181)]`. Service porteur : à créer [À CONFIRMER] ; règles reprises du paquet comptable SFD, sans sa tenue des crédits (FR-182). |
| C2 Socle | Gate `RISQUE_PAR_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée : DG et RSQ le réseau, ROC le réseau, RA son agence, GP son portefeuille, AT sa zone (ventilation limitée). L'analyste risque lit sans modifier. |
| C3 Données possédées | Classes de chaque prêt à chaque arrêté, migrations de classe, provisions proposées et validées par le DAF, alertes de risque et leur traitement, seuils d'alerte et leurs versions, jeux de paramètres de barème (versionnés). **Aucun prêt, aucun solde, aucun paiement** : lus du cœur. Lues seulement : prêts, échéanciers, paiements, garanties (`coeur-sfd`), agences (`reseau`), secteur (`microfinance`). |
| C4 Emplacements vides | `coeur-sfd` absent : n'est pas possible (dépendance dure) ; `produits-financiers` absent : ventilation par produit = `NON_INSTALLE` ; `microfinance` absent : secteur d'activité = « non renseigné » avec `{etat: NON_INSTALLE, module: microfinance}` ; `recouvrement` absent : statuts de recouvrement = `NON_INSTALLE` ; `notification` absent : alertes visibles à l'écran, aucun envoi ; IA commune absente : score = `NON_INSTALLE`, le PAR et la provision restent calculés. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `risque-par.par.calcule@1`, `risque-par.classe.changed@1`, `risque-par.provision.proposee@1`, `risque-par.provision.validee@1`, `risque-par.perte.proposee@1`, `risque-par.alerte.ouverte@1`, `risque-par.alerte.remontee@1`, `risque-par.seuil.propose@1`, `risque-par.seuil.valide@1`, `risque-par.prevision.calculee@1`, `risque-par.analyse-secteur.calculee@1`. Consomme `coeur-sfd.pret.changed@1`, `coeur-sfd.echeancier.changed@1`, `coeur-sfd.paiement.recu@1`, `reseau.agence.changed@1`, `recouvrement.dossier.changed@1`, `etat-publie.changed.*@1`. Noms proposés. |
| C6 Paramètres | Seuils de jours du PAR (1, 30, 90, 180) ; bornes de classement et taux de provision (40/80/100 %), seuil de perte (24 mois), déclassement facultatif jusqu'à 3 mois (non par défaut) ; seuils d'alerte de PAR (défaut de démo 5 % alerte, 10 % critique) ; seuils de concentration (secteur 28/35 %, agence 25 %, agent 50/60 %) ; seuils de hausse anormale (0,8 point) et de migration (15 %) ; délai de traitement d'une alerte (48 h) ; périodicité de recalcul des seuils (trimestre). Seuils d'alerte calibrés sur les données de l'IMF (E5). Données, jamais code. |
| C7 Droits | `risque-par:portefeuille:consulter`, `risque-par:reseau:consulter`, `risque-par:provision:valider`, `risque-par:seuil:valider`, `risque-par:alerte:traiter`, `risque-par:parametre:configurer`. Format conforme (code `risque-par` avec tiret : même condition que dans PRD-D annexe A, §« Format des droits »). |
| C8 Module d'écran | `src/modules/risque-par/` : `/risque` (vue DG : PAR, aging, concentration, hausse anormale), `/risque/provisions` (proposé, validé, comptabilisé), `/risque/alertes`, `/risque/seuils`. Entrées : « Risque » (`risque-par:portefeuille:consulter` ou `:reseau:consulter`). L'export d'analyse du risque est branché ou « bientôt », jamais décoratif. |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : classes, provisions proposées, alertes et seuils restent stockés et masqués ; test aller-retour. Avertissement : « Plus aucun PAR ni aucune alerte de risque ne sera calculé ; les rapports BCEAO perdent leurs indicateurs de portefeuille. » |
| C10 Démarrer seul | `profiles: ["risque-par"]` ; socle + `coeur-sfd` + `reseau` (dépendances dures installées par le moteur). |
| C11 IA | `ia: { modeles: ['prevision-par', 'perte-attendue', 'secteur-moteur-risque', 'analyse-provisions', 'analyse-risque-sectoriel', 'analyse-macro-conjoncture'], finalites: ['prevision-du-portefeuille-a-risque', 'estimation-de-la-perte-attendue-et-du-cout-du-risque', 'analyse-de-l-ecart-de-provisions', 'analyse-du-risque-par-secteur-d-activite', 'analyse-de-conjoncture'] }` (FR-180, FR-181). Le moteur est l'IA commune (module Risque) ; le module n'a pas d'IA propre. Tant que le modèle n'existe pas : la tendance du PAR est une règle explicable, la concentration est calculée par règle, le reste affiche `NON_INSTALLE`. L'IA propose, le DAF valide les provisions, le ROC et le DG décident ; un écart à une proposition exige un motif, renvoyé comme correction ; rien ne bloque si l'IA est absente. Provenance affichée (règle ou modèle, version, date, données utilisées) ; données vers l'IA commune seulement avec le consentement de l'IMF. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Un nouveau jeu de paramètres de barème est versionné ; la version précédente reste lisible et jugée à sa date d'effet. Interrupteur : `declassement-facultatif` (comportement seulement). |
| C13 Installable sous contrôle | Prérequis : `coeur-sfd` et `reseau` en service. Vérifications : `par-recalcul` (🟢 si le PAR30 du jeu de contrôle est égal à celui du paquet comptable SFD à l'unité de franc ; 🔴 sinon) ; `somme-agences` (🟢 si le PAR du réseau égale la somme pondérée des agences) ; `provision-non-comptabilisee` (🟢 si aucun écran n'affiche une provision proposée comme comptabilisée) ; `echeancier-manquant` (🟠 si des prêts du jeu n'ont pas d'échéancier officiel). Lecture seule : `GET` sur PAR, classes, provisions, export. Export, import, effacement par organisation ; `objetsDeReprise: []` (les classes sont recalculées après la reprise des prêts) ; `domainesEchange: []` (rien ne revient du module vers le cœur : le cœur comptabilise, FR-176). |

### A.8 Conformité BCEAO (`conformite-bceao`, M20)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'conformite-bceao'`, `version: '1.0.0'`. `depends: [{risque-par, "Les états de portefeuille et de provisions s'appuient sur le PAR et le classement."}, {coeur-sfd, "Les indicateurs, la balance et le rapprochement viennent du cœur."}]`. `enrichiPar: [microfinance (clients, KYC, LBC/FT), credit (comité, parties liées), caisse (écarts), reseau (agences actives), balance (ratios, balance canonique du cœur), bilan (états annuels), notification (échéances), dashboard (calendrier)]`. Service porteur : partiel, à étendre [À CONFIRMER, M20]. |
| C2 Socle | Gate `CONFORMITE_BCEAO_NOT_ENTITLED`. Cloisonnement par `organisationId`. Génération : DAF et AUD ; validation : DG ; lecture : DG, DAF, AUD, RSQ ; journal complet : AUD et DG seulement ; ADMIN_IMF ne lit pas les états. |
| C3 Données possédées | Rapports générés, versions, statuts (généré, validé par le DG, signé et déposé), calendrier des échéances, paramètres réglementaires versionnés par pays et par date (plafond d'usure, barème, normes, périodicité, seuil de supervision, conservation), résultats de ratios, listes d'anomalies d'audit, journal d'audit ajouté seulement, état de fraîcheur des listes LBC/FT. Lues seulement : PAR, classes, provisions (`risque-par`), prêts, balance, rapprochement (`coeur-sfd`), KYC (`microfinance`). |
| C4 Emplacements vides | `balance` du cœur absente : chaque ratio = « en attente des données du cœur » (FR-187), jamais « conforme » ; `microfinance` absent : LBC/FT et KYC = `NON_INSTALLE`, le rapport l'indique ; `credit` absent : comité et parties liées = `NON_INSTALLE` ; `caisse` absente : écarts de caisse = `NON_INSTALLE` ; `bilan` absent : états annuels non générés, `NON_INSTALLE` ; `notification` absent : échéances visibles à l'écran, aucun envoi. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `conformite-bceao.rapport.genere@1`, `conformite-bceao.rapport.valide@1`, `conformite-bceao.rapport.depose@1`, `conformite-bceao.ratio.calcule@1`, `conformite-bceao.usure.depassee@1`, `conformite-bceao.separation.contournee@1`, `conformite-bceao.parametre.changed@1`, `conformite-bceao.score.calcule@1`, `conformite-bceao.anomalie.detectee@1`. Consomme `risque-par.par.calcule@1`, `risque-par.classe.changed@1`, `risque-par.provision.validee@1`, `coeur-sfd.balance.recue@1`, `coeur-sfd.pret.changed@1`, `coeur-sfd.ecart.ouvert@1`, `microfinance.kyc.changed@1`, `etat-publie.changed.*@1`. Noms proposés. |
| C6 Paramètres | Catégorie de supervision et seuil (démo : grande IMF, mensuel) ; périodicité et délai (30 jours) par état ; plafond d'usure daté (24 % par an dès le 01/06/2026) et inclusion de chaque type de frais dans le TEG ; normes prudentielles et leur catégorie (liquidité 100/80/60 %) ; seuils de séparation des tâches (fenêtre 1 heure, écart de caisse, nombre de crédits actifs) ; périodicité des listes de sanctions (7 jours) et de la revue KYC ; durées de conservation (10 ans) ; délai d'alerte avant échéance (5 jours) ; mentions du texte de référence du rapport. Par pays et par texte, à faire vérifier par un juriste. Données, jamais code. |
| C7 Droits | `conformite-bceao:rapport:generer`, `conformite-bceao:rapport:valider`, `conformite-bceao:rapport:consulter`, `conformite-bceao:rapport:exporter`, `conformite-bceao:parametre:configurer`, `conformite-bceao:audit:consulter`, `conformite-bceao:journal:consulter`. Format conforme (code `conformite-bceao` avec tiret : même condition que dans PRD-D annexe A, §« Format des droits »). Valider et générer sont deux droits attribués à deux personnes. |
| C8 Module d'écran | `src/modules/conformite-bceao/` : `/conformite` (vue DG et vue DAF), `/conformite/rapports` (calendrier, génération, validation), `/conformite/ratios`, `/conformite/usure`, `/conformite/lbc-ft`, `/audit/*` (vues de l'auditeur, lecture seule), `/audit/tracabilite`. Entrées : « Conformité » (`conformite-bceao:rapport:consulter`), « Audit » (`conformite-bceao:audit:consulter`). Aucun bouton de dépôt à l'autorité ; « Investiguer » est branché ou « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : rapports, versions, paramètres et journal d'audit restent stockés (conservation 10 ans) et masqués ; test aller-retour. Avertissement : « Plus aucun état réglementaire ne sera généré ; les états déjà validés restent conservés. » |
| C10 Démarrer seul | `profiles: ["conformite-bceao"]` ; socle + `risque-par` + `coeur-sfd` + `reseau` (dépendances dures installées par le moteur). |
| C11 IA | `ia: { modeles: ['score-conformite', 'alertes-reglementaires', 'generation-rapport-bceao', 'detection-anomalies-operationnelles', 'correlation-evenements-trace'], finalites: ['score-de-conformite-global', 'alerte-reglementaire-proactive', 'preparation-du-rapport', 'detection-d-anomalies', 'correlation-d-evenements-suspects'] }` (FR-190, FR-194). Le moteur est l'IA commune. L'IA ne valide, ne signe et ne dépose jamais un rapport, et ne classe aucune anomalie seule. Sans elle : ratios, alertes sur seuils, anomalies par règle et rapport par gabarit fonctionnent ; la synthèse rédigée et la corrélation affichent `NON_INSTALLE` ; rien ne bloque. Provenance affichée (règle ou modèle, version, date, données utilisées) ; données vers l'IA commune seulement avec le consentement de l'IMF. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Un nouveau gabarit de rapport est un jeu de paramètres versionné ; un rapport validé reste figé dans la version de son gabarit. Interrupteur : `seuil-supervision-banque-centrale` (remplace l'article 44 par le seuil fixé par la Banque Centrale ; comportement seulement). |
| C13 Installable sous contrôle | Prérequis : `risque-par` et `coeur-sfd` en service. Vérifications : `rapport-sans-trou` (🟢 si le rapport du jeu de contrôle n'a aucun champ rempli par défaut silencieux ; 🔴 sinon) ; `total-egal-risque` (🟢 si les totaux du rapport égalent ceux de `risque-par`) ; `ratios-en-attente` (🟢 si, sans balance, chaque ratio dit « en attente » ; 🔴 si un ratio est calculé sans balance) ; `journal-ajout-seul` (🟢 si une écriture du journal ne peut ni être modifiée ni supprimée, 🔴 sinon) ; `usure-portefeuille` (🟢 si les prêts du jeu au-dessus du plafond sont tous listés). Lecture seule : `GET` sur rapports, ratios, journal, export. Export, import, effacement par organisation (effacement du journal refusé avant 10 ans) ; `objetsDeReprise: []` ; `domainesEchange: []` (le dépôt à l'autorité est hors Prospera). |

### A.9 ★ Terrain (`terrain`, M12) — écarts IMF

Le module est le même service que celui du PRD distributeur : le vocabulaire est une donnée (C6). Seules les valeurs qui changent ou s'ajoutent pour l'IMF sont écrites ; « comme PRD-D A.8 » renvoie à la ligne du même numéro de l'annexe du PRD distributeur.

| Clause | Valeur pour ce module chez l'IMF |
|---|---|
| C1 Manifeste | Comme PRD-D A.8 (`code: 'terrain'`, `1.0.0`, `depends: [reseau]`). `enrichiPar` ajoute : `credit` (visites d'instruction liées à un dossier, FR-201), `collecte` (remboursements et épargne saisis en visite, FR-202), `microfinance` (clients, prospects, groupes solidaires), `coeur-sfd` (échéances lues pour le plan du jour, FR-200), `recouvrement` (missions, FR-203), `risque-par` (PAR de zone, FR-208), IA commune. `pdv`, `commande`, `catalogue` et `stock` ne sont pas utilisés par l'IMF. |
| C2 Socle | Comme PRD-D A.8, avec les rôles de l'IMF : AT et COLL voient leur zone, COM ses prospects, CC ses visites d'instruction, REC ses missions, RA son agence, RCC son agence ou sa région, ROC et DG le réseau, AUD en lecture (FR-205). Gate `TERRAIN_NOT_ENTITLED`. |
| C3 Données possédées | Comme PRD-D A.8, plus : visites d'instruction (photo, position, distance au client, statut « hors zone » conservé, jamais effacé), missions de recouvrement et leurs résultats, comptes rendus dictés, rapports du soir, propositions de zones de prospection et de réaffectation avec les décisions prises. Pas de relevé de stock ni de panier. |
| C4 Emplacements vides | Comme PRD-D A.8 pour `pdv`, `commande`, `stock` et `paiement`, avec ces différences : « Prendre une commande » et « Relevé de stock » sont toujours `NON_INSTALLE` chez l'IMF ; `credit` absent : visite d'instruction = `NON_INSTALLE` ; `collecte` absent : collecte en visite = `NON_INSTALLE` ; `recouvrement` absent : mission de recouvrement = `NON_INSTALLE` ; IA commune absente : ordre de visite par règle, alerte de proximité par règle, rapport du soir en tableau, dictée « bientôt », zones sans suggestion. Un test par dépendance. |
| C5 Contrats nommés | Comme PRD-D A.8. Publie en plus (propositions) `terrain.visite-instruction.cloturee@1` (avec le statut de preuve ou « hors zone ») et `terrain.mission-recouvrement.cloturee@1`. Consomme en plus `credit.visite.planifiee@1`, `recouvrement.mission.creee@1`, `coeur-sfd.echeancier.changed@1`, `reseau.affectation.changed@1`. |
| C6 Paramètres | Comme PRD-D A.8 (vocabulaire par verticale, durée de visite, barème de caisse). Rayon de présence : 200 m pour les visites ordinaires, **100 m** pour la visite d'instruction (T7). S'ajoutent : photo (JPEG ou PNG, 5 Mo), rayon de l'alerte de proximité (200 m), heure du rapport du soir (18 h) et seuil de coaching (80 %), expiration d'une file hors ligne (7 jours), stockage local (500 Mo), seuils de zones de prospection (densité de clients actifs au km², visites minimales, charge maximale, calibrés sur les données de l'IMF, E5), rangs de priorité des motifs IMF. |
| C7 Droits | Comme PRD-D A.8. S'ajoutent : `terrain:instruction:realiser`, `terrain:mission:realiser`, `terrain:prospection:consulter`, `terrain:prospection:decider` (RA, RCC, DG). Format conforme. |
| C8 Module d'écran | Comme PRD-D A.8 (« Ma journée », « Tournées », « Équipe », carte Google Maps). S'ajoutent : « Mes visites d'instruction », « Missions de recouvrement », « Zones de prospection » (`terrain:prospection:consulter`), rapport du soir. « Y aller » et « Clôturer » aboutissent en février. **L'application `prospera-terrain`, hors connexion, est exigée** (UJ-4), jamais « bientôt ». |
| C9 Installer/désinstaller | Comme PRD-D A.8 : rien n'est supprimé ; visites, positions et preuves de visite conservées. Avertissement ajouté : « Les visites d'instruction exigées par les dossiers de crédit et les missions de recouvrement cesseront. » |
| C10 Démarrer seul | Comme PRD-D A.8 : `profiles: ["terrain"]` ; socle + `reseau`. |
| C11 IA | `ia: { modeles: ['optimisation-tournees', 'alerte-proximite', 'saisie-vocale', 'rapport-du-soir', 'zones-de-prospection', 'validation-geofencing'], finalites: ['planification-de-tournee', 'alerte-proximite-client-en-retard', 'saisie-vocale-de-visite', 'rapport-quotidien-agent', 'suggestion-de-zones-de-prospection', 'controle-de-presence'] }`. `recommandation-panier` et `aide-a-la-commande` ne sont pas déclarés (pas de commande). Moteur : IA commune. L'IA propose, l'humain décide ; provenance affichée ; rien ne bloque sans IA (FR-206, FR-207, FR-208). Données de position : consentement de niveau 0 par défaut, information de l'agent, conservation de 90 jours glissants ; la dictée ne conserve pas l'audio [ASSUMPTION, avis juridique]. |
| C12 Migrations | Comme PRD-D A.8 : `SANS_PERTE` ; l'appareil tolère un champ inconnu. Interrupteurs : `mode-hors-ligne`, `optimisation-automatique`, `saisie-vocale`, `zones-de-prospection`. |
| C13 Installable sous contrôle | Comme PRD-D A.8 (prérequis `reseau`, Google Maps ; vérifications `zones-lues`, `fond-de-carte`, `purge-positions`). S'ajoute la vérification `rayon-instruction` (🟢 si le rayon de la visite d'instruction est paramétré et inférieur ou égal à 200 m). Essai : position simulée et marquée « position simulée » ; elle est acceptée comme preuve d'instruction pour que le parcours UJ-1 aille à EN_GESTION (FR-201). `objetsDeReprise: []`, `domainesEchange: []`. |

### A.10 ★ Recouvrement (`recouvrement`, M19) — écarts IMF

Même service que celui du PRD distributeur, vocabulaire en donnée. « Comme PRD-D A.9 » renvoie à la ligne du même numéro de l'annexe du PRD distributeur.

| Clause | Valeur pour ce module chez l'IMF |
|---|---|
| C1 Manifeste | Comme PRD-D A.9 (`code: 'recouvrement'`, `1.0.0`, `depends: [paiement, notification]`). `enrichiPar` précise pour l'IMF : `credit` (source `ECHEANCE_DE_PRET`, prêt EN_GESTION, blocage lu, plan d'étalement, clôture), `coeur-sfd` (reste dû, pénalités, mouvements, échéancier officiel : **le cœur fait foi**, le registre des créances de `paiement` est un miroir, FR-209), `microfinance` (clients, groupes, cautions), `terrain` (missions, FR-203), `risque-par` (PAR, classes, provisions proposées), `reseau` (agences, zones, affectation des REC), IA commune. `pdv` et `facturation` ne sont pas utilisés. |
| C2 Socle | Comme PRD-D A.9, avec la portée de l'IMF : ROC et DG le réseau, RA son agence, GP son portefeuille, REC ses zones affectées, CPT la file de rapprochement de son agence, AUD en lecture. Gate `RECOUVREMENT_NOT_ENTITLED`. |
| C3 Données possédées | Comme PRD-D A.9, plus : dossiers de recouvrement **par prêt** (statut de recouvrement décidé, FR-211, FR-214), stratégies par agence et leur validation, affectations des REC par zone, actions et résultats (appel, visite, mise en demeure, saisie), plans d'étalement et leur accord signé, appels de caution, propositions de contentieux et de perte avec leurs décisions, fiches de mauvais payeur, scores de recouvrement et leurs facteurs, décisions de blocage et de déblocage avec motif. La balance âgée et les montants sont **lus** (cœur via `coeur-sfd`, puis `paiement`), jamais recopiés. |
| C4 Emplacements vides | Comme PRD-D A.9, avec : `credit` absent : source IMF `NON_INSTALLE` ; `coeur-sfd` absent : reste dû, pénalités et mouvements `NON_INSTALLE`, aucun montant affiché ; `terrain` absent : mission = `NON_INSTALLE` ; `risque-par` absent : PAR et classe `NON_INSTALLE` ; IA commune absente : relances par règle de base, score par règle explicable v0, stratégie et analyse sans texte, scripts en gabarits, Copilot « bientôt ». Un test par dépendance. |
| C5 Contrats nommés | Comme PRD-D A.9 : `recouvrement.dossier.changed@1` (porte le statut de recouvrement), `recouvrement.credit.bloque@1` et `recouvrement.credit.debloque@1` (**portent le dossier, le client et ses cautions**, niveau dossier, FR-218), `recouvrement.promesse.changed@1`, `recouvrement.alerte-direction.emise@1`. S'ajoutent (propositions) : `recouvrement.plan-etalement.valide@1`, `recouvrement.perte.decidee@1`, `recouvrement.contentieux.decide@1`, `recouvrement.mission.creee@1`. Consomme en plus `coeur-sfd.pret.changed@1`, `coeur-sfd.echeancier.changed@1`, `coeur-sfd.paiement.recu@1`, `coeur-sfd.penalite.recue@1`, `credit.dossier.changed@1`, `terrain.mission-recouvrement.cloturee@1`. |
| C6 Paramètres | Comme PRD-D A.9 (table de seuils, échelle, tranches, gabarits, vocabulaire). Valeurs IMF : entrée en retard à J+7 ; J-3 et J+1 automatiques, au-delà à valider ; envois à 6 h et 14 h ; 3 échecs avant mission terrain ; réponse WhatsApp de 60 % ; alerte ROC à J+7 sous un score de 50 ; proposition de contentieux à J+90 ou score sous 20 ; perte proposée à 24 mois d'impayé et seuil du conseil (sans défaut) ; plan d'étalement de 12 mois au plus, un par prêt ; fiche mauvais payeur à 30 jours ou 2 promesses rompues, fermée après 6 mois ; grâce de promesse de 24 h ; tolérance de rapprochement de 1 % ; ordre d'imputation pénalités, intérêts, capital ; poids du score de recouvrement ; seuils d'alerte de PAR et de concentration (calibrés, E5). |
| C7 Droits | Comme PRD-D A.9, avec ces changements : `recouvrement:credit:bloquer` et `recouvrement:credit:debloquer` sont attribués au **ROC seul** (le DAF seul de PRD-D A.9 ne s'applique pas à l'IMF). S'ajoutent : `recouvrement:affectation:definir` (ROC, RA), `recouvrement:strategie:valider` (ROC), `recouvrement:plan:proposer` (ROC), `recouvrement:contentieux:decider` et `recouvrement:perte:decider` (DG), `recouvrement:caution:appeler` (ROC), `recouvrement:fiche:consulter`. Format conforme. |
| C8 Module d'écran | Comme PRD-D A.9 (`/relances`, balance âgée), plus : vue réseau du ROC par PAR avec descente agence, agent, client, dossier ; fiche d'agent de recouvrement ; fiche mauvais payeur ; stratégie ; affectation des REC ; plan d'étalement ; file « propositions J+90 et perte ». Menus : « Mes dossiers » (`recouvrement:dossier:traiter`), « Recouvrement réseau » (ROC), « Mauvais payeurs » (`recouvrement:fiche:consulter`). « Relancer », « Bloquer » et « Débloquer » aboutissent en février ; les actions non encore livrées (mise en demeure, saisie) sont « bientôt », sans simulation. |
| C9 Installer/désinstaller | Comme PRD-D A.9 : rien n'est supprimé ; dossiers, promesses et décisions conservés. Avertissement : « Les dossiers bloqués le restent, et les demandes de leurs clients et de leurs cautions restent suspendues, jusqu'à déblocage par le ROC. » |
| C10 Démarrer seul | Comme PRD-D A.9 : `profiles: ["recouvrement"]` ; socle + `paiement` + `notification`. |
| C11 IA | `ia: { modeles: ['priorisation-par-probabilite', 'choix-du-canal', 'declenchement-par-profil', 'score-recouvrement', 'strategie-par-agence', 'analyse-comportement-retard', 'scripts-de-relance', 'copilot-recouvrement'], finalites: ['priorisation-des-dossiers', 'choix-du-canal-et-du-moment', 'declenchement-des-relances', 'score-de-recouvrement', 'strategie-de-recouvrement', 'analyse-du-comportement-de-retard', 'aide-a-la-relance', 'conseil-par-role'] }`. Moteur : IA commune. **Le blocage, le contentieux, la perte et le plan d'étalement ne sont jamais décidés par un modèle** : ils suivent des décisions humaines (FR-218 à FR-221). Score par règle explicable v0 tant qu'aucun modèle n'existe. |
| C12 Migrations | Comme PRD-D A.9 : `SANS_PERTE`. Interrupteurs : `blocage-automatique-au-seuil` (**éteint** chez l'IMF), `relance-automatique` (allumé pour J-3 et J+1 seulement), `canal-choisi-par-ia` (éteint). À la reprise du portefeuille (FR-196), les dossiers de recouvrement se recréent depuis les échéances impayées reprises. |
| C13 Installable sous contrôle | Comme PRD-D A.9 (prérequis `paiement`, `notification` ; vérifications `source-creances`, `canal-utilisable`). S'ajoutent : `lecture-du-coeur` (🟢 si `coeur-sfd` répond et que la dernière lecture date de moins de la fraîcheur paramétrée) et `affectation-des-rec` (🟠 si une zone en retard n'a aucun REC). Essai : aucune relance réelle partie. `objetsDeReprise: []`, `domainesEchange: []` (promesses, relances et décisions de recouvrement = Prospera ; reste dû, pénalités et mouvements = cœur). |

### A.11 ★ Tableau de bord et pilotage (`dashboard`, M28)

Les conventions de l'annexe A (gate, cloisonnement, profil, version, routes C13, essai, export, effacement) sont celles de PRD-D annexe A. Ne figure ci-dessous que ce que l'IMF change ; le reste est « comme PRD-D A.15 ». Les noms de droits, de topics, de modèles et de finalités sont des propositions.

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | Comme PRD-D A.15 (`code: 'dashboard'`, `depends: []`). `enrichiPar` propre à l'IMF : `credit`, `recouvrement`, `terrain`, `collecte`, `caisse`, `risque-par`, `conformite-bceao`, `microfinance`, `coeur-sfd`, `equipe`, `marketing`, `finance-transactions`, `paiement`, `reseau`, `notification`. Cinq verticales dont la microfinance. |
| C2 Socle | Gate `DASHBOARD_NOT_ENTITLED`. Portée : réseau, région, agence, zone, portefeuille (FR-5, FR-255) ; chaque rôle ne reçoit que les cartes que ses droits sur les modules sources autorisent. ADMIN_IMF ne reçoit aucune carte métier. |
| C3 Données possédées | Comme PRD-D A.15 (cartes et KPI par rôle, alertes du jour, rapports de direction). **En plus** : composition des seize cockpits, règles de déclenchement des alertes et leurs seuils calibrés (FR-235), historique des remontées à 48 h (FR-234). Pas de copie des données d'argent : le cœur les tient (FR-2). |
| C4 Emplacements vides | Comme PRD-D A.15. **En plus** : `coeur-sfd` absent, chaque chiffre d'argent = `NON_INSTALLE` ; balance du cœur absente, résultat et rentabilité = « en attente des données du cœur » ; `risque-par` absent, PAR = `NON_INSTALLE` ; `assistant-service` ou IA commune absents, Copilot = « bientôt » ; `finance-transactions` absent, budget = `NON_INSTALLE`. Un test par module de `enrichiPar`. |
| C5 Contrats nommés | Publie `dashboard.rapport.genere@1`, `dashboard.alerte.changed@1`, `dashboard.alerte.remontee@1`. Consomme les faits des modules sources, dont `risque-par.alerte.changed@1`, `coeur-sfd.fraicheur.changed@1`, `reseau.portee.changed@1`, leurs décisions (`<module>.decision.changed@1`) et `etat-publie.changed.*@1`. `dashboard.score-pdv.calcule@1` sans objet chez l'IMF (pas de point de vente). |
| C6 Paramètres | Composition par rôle ; douze chiffres du DG et leurs seuils de statut (FR-231) ; seuils d'alerte et leur source (démo, calculé, fixé : FR-4) ; délai de remontée (48 h) ; heure du rapport (06:00) ; fréquence de rafraîchissement (5 min) ; seuil de concentration d'un secteur ; voisinage d'agences pour la comparaison (± 20 % d'encours). Données, jamais code. |
| C7 Droits | `dashboard:tableau:consulter`, `dashboard:vue-direction:consulter` (DG, onglets Crédit et Commercial compris), `dashboard:rapport:envoyer`, `dashboard:alerte:configurer`, `dashboard:copilot:interroger`, `dashboard:secteur:consulter`. Trancher une décision exige le droit du module qui la possède. Format conforme. |
| C8 Module d'écran | `/dashboard` (seize cockpits par rôle), descente géographique et par secteur, tiroir Copilot, courrier des rapports. Entrées : « Tableau de bord » (`dashboard:tableau:consulter`), « Copilot » (`dashboard:copilot:interroger`). Boutons non branchés : « bientôt » (PRD-D FR-2) ; « N alertes critiques », « Exporter rapport DG », « PDF », « Envoyer » doivent aboutir. |
| C9 Installer/désinstaller | Comme PRD-D A.15 : rien supprimé, alertes et rapports conservés. Avertissement : « Les tableaux de bord disparaissent du menu ; aucune donnée métier n'est touchée. » |
| C10 Démarrer seul | `profiles: ["dashboard"]` ; socle seul. |
| C11 IA | `ia: { modeles: ['copilot-par-role', 'priorites-du-jour', 'anomalie-agence', 'synthese-narrative'], finalites: ['pilotage-assiste', 'priorites-du-jour', 'anomalie-d-agence', 'rapport-de-direction'] }`. Servi par l'IA commune (Agents métier pour le Copilot et les priorités, Pulse pour la synthèse et la comparaison d'agences) ; le module n'a pas de modèle propre (FR-8). Le Copilot est réel au premier jour, en lecture seule, chiffres sourcés (FR-237). Chaque proposition porte origine, version, date, données utilisées ; sans modèle, des règles servent et le disent. Données vers l'IA commune seulement avec consentement (FR-260). |
| C12 Migrations | `SANS_PERTE`. Interrupteurs : `rapport-quotidien-dg`, `copilot` (éteint sans consentement à l'IA commune). Le seuil d'une alerte n'est jamais changé en silence : il passe par la validation de FR-4. |
| C13 Installable sous contrôle | Prérequis : aucun module obligatoire. Vérifications : `cartes-resolues` (🟢 si ≥ 80 % des cartes d'un cockpit d'essai se résolvent, les autres `NON_INSTALLE`) ; `chiffres-recoupes` (🟢 si les douze chiffres du DG se recalculent depuis le cœur fictif à l'identique, FR-239). Lecture seule : tous les cockpits, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.12 Équipes et performance (`equipe`, M21)

Comme PRD-D A.10 pour tout ce qui n'est pas ci-dessous.

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | Comme PRD-D A.10 (`code: 'equipe'`, `depends: [{reseau, "Les équipes viennent du réseau : agences, zones, agents."}]`). `enrichiPar` propre à l'IMF : `credit`, `terrain`, `collecte`, `recouvrement`, `microfinance`, `marketing`, `coeur-sfd`. Deux verticales (distributeur, microfinance). |
| C2 Socle | Gate `EQUIPE_NOT_ENTITLED`. Portée : le RA lit son agence, le RCC son équipe, le ROC et le DG le réseau ; l'agent lit ses propres KPI. Aucune « vue DG » pour un autre rôle. |
| C3 Données possédées | Comme PRD-D A.10. **En plus** : objectifs par agence et par agent (FR-241), écarts projetés, statuts d'objectif, plans de coaching, benchmarks d'agences. **Pas de barème de commission** ni de rémunération calculée (FR-242, décision F8) ; seule la prime d'objectifs de l'agent lui est visible. |
| C4 Emplacements vides | Chaque KPI dont la source est absente = `NON_INSTALLE`, et le score devient « partiel » (PRD-D FR-123). `collecte` absent : KPI du collecteur `NON_INSTALLE` ; `credit` absent : KPI du CC et du ROC `NON_INSTALLE` ; `recouvrement` absent : KPI de recouvrement `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `equipe.coaching.changed@1`, `equipe.objectif.fixe@1`, `equipe.ecart.change@1`. Consomme `reseau.commercial.changed@1`, `reseau.portee.changed@1`, `credit.dossier.changed@1`, `terrain.visite.terminee@1`, `collecte.remboursement.saisi@1`, `recouvrement.dossier.change@1`, `coeur-sfd.pret.changed@1`. |
| C6 Paramètres | Barème de statut 90, 75, 60 (FR-240) ; plafond d'atteinte (130 %) ; poids des KPI de poste des huit postes (FR-240) ; date limite de fixation des objectifs (le 5 du mois) ; niveaux de l'écart (10 %, 25 %) ; voisinage d'agences (± 20 % d'encours). Données, jamais code. |
| C7 Droits | `equipe:indicateur:consulter`, `equipe:classement:consulter`, `equipe:coaching:gerer`, `equipe:objectif:fixer` (RA, RCC, ROC, DG), `equipe:remuneration:consulter` (l'agent pour lui seul par défaut). Format conforme. |
| C8 Module d'écran | `/equipe` (classement et fiches, tableau comparatif, objectifs, coaching), fiche agent, saisie des objectifs (à créer : la démo n'a aucun écran pour fixer un objectif). Entrées : « Équipe » (`equipe:indicateur:consulter`), « Objectifs » (`equipe:objectif:fixer`). Défis, badges et séries de la démo : « bientôt ». |
| C9 Installer/désinstaller | Comme PRD-D A.10 : rien supprimé, coachings et objectifs conservés. Avertissement : « Les classements et les écarts ne seront plus calculés. » |
| C10 Démarrer seul | `profiles: ["equipe"]` ; socle + `reseau`. |
| C11 IA | `ia: { modeles: ['ecart-de-performance', 'coaching-cible', 'prevision-par-zone', 'benchmark-agences'], finalites: ['coaching-individuel', 'benchmark-bonnes-pratiques', 'prevision-du-risque-par-zone'] }`. Prévision du PAR par zone : module Risque de l'IA commune, lue de `risque-par` (FR-243) ; coaching et comparaison d'agences : Agents métier et Pulse. Aucun agent n'est classé ni jugé par l'IA seule ; un écart à une recommandation exige un motif (FR-8). Sans modèle, la règle de coaching à points sert et le dit (PRD-D FR-125). |
| C12 Migrations | `SANS_PERTE`. Interrupteurs : `classement-public-equipe`, `projection-fin-de-mois`. Un nouveau KPI ajouté est lu comme inconnu par la version précédente. |
| C13 Installable sous contrôle | Prérequis : `reseau`. Vérifications : `agents-lus` (🟢 si ≥ 1 agent et une agence se lisent) ; `poids-valides` (🟢 si les poids de chaque poste du jeu d'essai somment à 100, sinon 🔴). Lecture seule : consultation, export. `objetsDeReprise: []` ; `domainesEchange: []`. |

### A.13 Marketing et acquisition (`marketing`, M23)

Comme PRD-D A.12 pour tout ce qui n'est pas ci-dessous. Sans objet chez l'IMF : combos de stock, promotions fournisseurs, studio réseaux sociaux.

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'marketing'`, `1.0.0`. `depends: [{notification, "Un envoi de campagne part par notification."}]` ; **la dépendance dure à `pdv` du distributeur est remplacée** : l'audience de l'IMF est une liste de clients et de prospects lue de `microfinance`, en `enrichiPar` (`pdv` ne s'installe pas chez l'IMF). `enrichiPar: [microfinance (clients, prospects), recouvrement (exclusion des retards), credit (décaissement attribué), risque-par (perte attendue du ROI), reseau (zones sous-couvertes), coeur-sfd (retard, dossier bloqué)]`. |
| C2 Socle | Gate `MARKETING_NOT_ENTITLED`. Portée : COMM voit le réseau ; le RCC son agence ou sa région ; un commercial voit les seuls prospects de sa zone (FR-246). |
| C3 Données possédées | Campagnes, segments (critères, jamais des personnes), résultats, ROI sur marge d'intérêt nette attendue (FR-245), attributions. **Le prospect n'est pas possédé** : il appartient au réseau commercial (décision F10) et se lit. |
| C4 Emplacements vides | Comme PRD-D A.12. **En plus** : lecture du cœur ou `recouvrement` absente, exclusion des retards = « non évaluée » (**jamais** « aucun exclu »), confirmation explicite avant envoi ; `notification` absent, « Lancer » = `NON_INSTALLE` et la campagne reste PLANIFIEE ; `risque-par` absent, ROI = « marge attendue non évaluée ». |
| C5 Contrats nommés | Publie `marketing.campagne.changed@1`, `marketing.attribution.etablie@1`. Consomme `microfinance.client.changed@1`, `microfinance.prospect.changed@1`, `recouvrement.dossier.change@1`, `credit.dossier.accorde@1`, `notification.envoi.delivre`, `notification.reponse.recue`, `reseau.zone-blanche.changed@1`. |
| C6 Paramètres | Plafond de messages par client (2 par semaine, porté par `notification`), seuil d'exclusion pour retard (J+30), seuil de budget exigeant la validation du DG, poids du score de prospect (25, 25, 20, 15, 15), délai d'attribution (campagne + 7 jours), nombre de tentatives avant disqualification (3). Données, jamais code. |
| C7 Droits | `marketing:campagne:gerer`, `marketing:campagne:valider`, `marketing:segment:gerer`, `marketing:audience:consulter`, `marketing:prospect:consulter`. Format conforme. |
| C8 Module d'écran | `/marketing` (campagnes, entonnoir des prospects, segments, couverture du territoire). Entrées : « Campagnes » (`marketing:campagne:gerer`), « Prospects » (`marketing:prospect:consulter`). **Chatbot WhatsApp, NPS, présence digitale, fidélisation, défis : « bientôt »** (décisions F4 et F10 ; FR-247, FR-249). |
| C9 Installer/désinstaller | Comme PRD-D A.12 : rien supprimé, campagnes conservées. Avertissement : « Les campagnes en cours ne seront plus envoyées. » |
| C10 Démarrer seul | `profiles: ["marketing"]` ; socle + `notification` + `reseau`. |
| C11 IA | `ia: { modeles: ['segmentation-comportementale', 'ciblage-campagne', 'note-de-prospect', 'proposition-de-campagne', 'zone-de-prospection'], finalites: ['segmentation', 'ciblage-campagne', 'note-de-prospect', 'proposition-de-campagne', 'zone-de-prospection'] }`. Servi par l'IA commune (Relation client ; Agents métier pour les zones). Segments agrégés et anonymisés ; aucune donnée ne sort sans consentement (FR-248, FR-260). Le chatbot WhatsApp de qualification est « bientôt » et n'a pas de modèle déclaré. |
| C12 Migrations | `SANS_PERTE`. Interrupteurs : `exclusion-clients-en-retard` (active par défaut, jamais éteinte en silence), `validation-dg-campagnes`. |
| C13 Installable sous contrôle | Prérequis : `notification` avec un canal utilisable ; modèles WhatsApp approuvés (FR-258). Vérifications : `audience-resolue` (🟢 si l'audience d'essai se résout, les exclusions sont comptées et un opt-out n'est jamais ciblé). Essai : aucun message réel. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.14 Comptabilité : export des écritures (`finance-transactions`, M22)

Comme PRD-D A.11 pour tout ce qui n'est pas ci-dessous. **Hors périmètre du premier jour** (comptabilité non prioritaire, récit §3).

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'finance-transactions'` (code à tiret : même contrainte de format de droit que PRD-D A.11), `1.0.0`. `depends: [{paiement, "Le rapprochement repose sur les encaissements."}]` ; `enrichiPar: [coeur-sfd (export des écritures, balance, trésorerie lue), risque-par (provisions proposées, perte attendue), caisse (remises des collecteurs), balance]`. **`controle-gestion` (M25) n'est pas installé** chez l'IMF (décision F11) : le budget du DAF est une donnée de ce module (FR-253). |
| C2 Socle | Gate `FINANCE_TRANSACTIONS_NOT_ENTITLED`. Droits financiers par rôle : DAF (réseau), CPT (son agence), DG (lecture). |
| C3 Données possédées | **Écritures proposées** à exporter vers le cœur (provisions, remises d'espèces des collecteurs, frais de campagne), jamais comptabilisées ici ; budget par agence et par poste, versionné ; prévision de trésorerie à 7 jours (provenance affichée). **Aucun grand livre**, aucune écriture de remboursement, de décaissement ni de dépôt : le cœur les comptabilise (FR-252). |
| C4 Emplacements vides | `coeur-sfd` absent : export = `NON_INSTALLE`, le fichier reste téléchargeable ; balance du cœur absente : résultat et rentabilité = « en attente des données du cœur » ; budget non saisi : écart = « budget non saisi », jamais 0. |
| C5 Contrats nommés | Publie `finance-transactions.ecriture.proposee@1`, `finance-transactions.budget.changed@1`, `finance-transactions.tresorerie.changed@1`. Consomme `coeur-sfd.balance.recue@1`, `coeur-sfd.caisse-guichet.changed@1`, `risque-par.provision.proposee@1`, `caisse.remise.constatee@1`. |
| C6 Paramètres | Plan comptable du cœur (correspondance des comptes), journal d'export, horizon de prévision (7 jours), plancher de liquidité, périodicité d'export. Données, jamais code. |
| C7 Droits | `finance-transactions:ecriture:exporter`, `finance-transactions:budget:saisir`, `finance-transactions:tresorerie:consulter`. Format conforme (code à tiret). |
| C8 Module d'écran | Tableau Budget et Rentabilité du DAF (dans le cockpit du DAF, FR-253), export des écritures proposées, prévision de trésorerie. Boutons non branchés : « bientôt », sans date ; en particulier l'export, tant que le module n'est pas livré. |
| C9 Installer/désinstaller | Comme PRD-D A.11 : rien supprimé, budgets et écritures proposées conservés. Avertissement : « L'export des écritures cesse ; la comptabilité reste dans le cœur. » |
| C10 Démarrer seul | `profiles: ["finance-transactions"]` ; socle + `paiement`. |
| C11 IA | `ia: { modeles: ['prevision-tresorerie', 'perte-attendue'], finalites: ['prevision-de-cash', 'perte-attendue'] }`. Prévision de trésorerie à 7 jours et perte attendue, sur des données lues du cœur (modules Risque et Pulse de l'IA commune ; la perte attendue est celle de `risque-par`, lue ici : FR-254). La réconciliation automatique et la détection d'anomalies comptables de PRD-D A.11 sont sans objet : l'IMF ne tient pas de lettrage. |
| C12 Migrations | `SANS_PERTE`. Interrupteur : `export-ecritures`. Un budget publié ne change pas les périodes closes. |
| C13 Installable sous contrôle | Prérequis : `paiement`. Vérification : `ecritures-equilibrees` (🟢 si chaque écriture proposée du jeu d'essai est équilibrée au franc près, sinon 🔴 `ECRITURE_DESEQUILIBREE`). Lecture seule : consultation, export. `objetsDeReprise: []` ; `domainesEchange: ['finance-transactions.ecritures']` déclaré pour plus tard (vrai connecteur hors février, décision A9). |

### A.15 Modules cadrés : renvoi aux manifestes

Les modules suivants ont déjà leurs treize clauses dans leur manifeste ou dans le PRD distributeur. Ce PRD **ne les répète pas** ; il renvoie, et reporte l'écart de l'IMF.

| Module | Manifeste ou annexe | Ce que l'IMF ajoute ou change | Point à reporter |
|---|---|---|---|
| `reseau` | `manifestes/reseau.manifest.ts` | quatre échelons (réseau, région, agence, zone) ; code d'agence du cœur sinon celui de Prospera ; zones et régions en polygones ; invitation SMS (STORY-900) ; zones blanches pour la prospection | FR-255 ; objets de reprise `reseau.zone@1`, `reseau.commercial@1` inchangés |
| `paiement` | `manifestes/paiement.manifest.ts` | décaissement Mobile Money et PI-SPI par pays et par opérateur, banques par PI-SPI ; rattachement à moins de 1 % ; validation du CPT ; Créance `ECHEANCE_DE_PRET` en **miroir du cœur** | FR-256, FR-257 ; amendement du PRD `paiement` et de PRD-D FR-247 |
| `notification` | `manifestes/notification.manifest.ts` | WhatsApp et SMS aux frais de l'IMF ; modèles approuvés avant la mise en service ; réponses et lien de paiement par le relais | FR-258 |
| `reprise` | `manifestes/reprise.manifest.ts` | portefeuille de prêts en cours ; format de départ non tranché | FR-259, FR-196 à FR-198 |
| `connecteurs` | `manifestes/connecteurs.manifest.ts` | le vrai connecteur du cœur est hors février ; contrat d'échange neutre en annexe C ; cœur fictif | FR-259, FR-166 |
| `automatisations` | PRD-D A.14 | règles de relance de l'IMF ; **aucune règle AUTO de blocage** : seul le ROC bloque (mode SUGGESTION) | FR-250 ; C11 : sans modèle propre, les capacités d'IA des relances relèvent de `recouvrement` |
| `support-client` | PRD-D A.16 | inscrit sans écran au premier jour ; compteur « tickets d'incident » du ROC = `NON_INSTALLE` | FR-251 ; C11 : sans objet, aucun modèle promis |
| `instance` (moteur d'installation) | PRD moteur d'installation | licence à vie sans gel ni coupure ; relais pour PI-SPI, FedaPay, WhatsApp et le lien de paiement ; accès des agences par navigateur ; exploitation par ADMIN_IMF ; sauvegardes et conservation de dix ans ; listes de sanctions sans port entrant | FR-261 à FR-269 ; écarts à porter au PRD moteur : FR-41 et FR-15 ne s'appliquent pas, AD-9 gagne le nom du relais |

---

## Annexe B. Matrice d'accès

Lecture : **D** décide ou valide ; **A** agit (crée, saisit, modifie) ; **L** lit son périmètre ; **—** aucun accès. Le périmètre de chaque rôle est celui du §2.1 (FR-5). Le serveur applique la matrice (PRD-D FR-5) ; la séparation des tâches (FR-6) s'ajoute à elle. ADMIN_IMF ne lit aucune donnée métier : il gère les comptes et les paramètres.

| Module / objet | DG | DAF | ROC | RA | CC | GP | AT | COLL | COM | RCC | RSQ | REC | AUD | CPT | COMM | ADMIN_IMF |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fiche client, KYC (`microfinance`) | L | L | L | L | D (KYC) | L | A | A | A | L | L | L | L | L | — | — |
| Listes de sanctions, revue KYC | L | L | L | L | A | — | — | — | — | — | L | — | L | — | — | A (sources) |
| Produits financiers | D (publication) | D (publication) | A | L | L | L | L | L | L | L | L | — | L | L | L | — |
| Demande de crédit, simulation | L | L | L | L | A | L | A | A | A | L | L | — | L | — | — | — |
| Pièces, cautions, visites | L | — | L | L | A | L | A | — | — | — | L | — | L | — | — | — |
| Avis du CC | L | — | L | L | D | — | — | — | — | — | L | — | L | — | — | — |
| Avis consultatif du risque | L | — | L | — | — | — | — | — | — | — | A | — | L | — | — | — |
| Décision du ROC | L | — | D | L | L | — | — | — | — | — | L | — | L | — | — | — |
| Comité de crédit | D | — | D | D | L | L | — | — | — | — | L | — | L | — | — | — |
| Ordre de décaissement (espèces) | L | D | L | L | L | L | — | — | — | — | — | — | L | D | — | — |
| Ordre de décaissement (Mobile Money, PI-SPI, virement) | L | L | A | L | L | L | — | — | — | — | — | — | L | A | — | — |
| Collecte terrain | L | L | — | L | — | L | A | A | — | L | — | — | L | L | — | — |
| Caisse des collecteurs, clôture du jour | L | L | — | L | — | — | A | A | — | L | — | — | L | D | — | — |
| Validation des paiements à valider | L | L | — | L | — | L | — | — | — | — | — | — | L | D | — | — |
| Relances, promesses | L | — | L | L | — | A | A | — | — | — | L | A | L | — | — | — |
| Recouvrement : actions | L | — | A | L | — | A | A | — | — | — | L | A | L | — | — | — |
| Recouvrement : blocage, déblocage | L | — | D | L | — | L | — | — | — | — | L | L | L | — | — | — |
| Contentieux judiciaire, perte définitive | D | L | A | L | — | L | — | — | — | — | L | — | L | — | — | — |
| Plan d'étalement | L | L | D | L | — | A | — | — | — | — | L | A | L | — | — | — |
| Risque de portefeuille (PAR, provisions proposées) | L | L | L | L | — | L | — | — | — | — | A | — | L | — | — | — |
| Rapport BCEAO | D | A | L | — | — | — | — | — | — | — | L | — | L | — | — | — |
| Tableau de bord, Copilot | L | L | L | L | L | L | L | L | L | L | L | L | L (piste d'audit) | L | L | — |
| Objectifs et performance | D | L | L | A | L | L | L | L | L | A | — | L | L | — | — | — |
| Campagnes, prospects | L | — | — | L | — | — | — | — | A | A | — | — | L | — | A | — |
| Export des écritures | L | D | — | — | — | — | — | — | — | — | — | — | L | A | — | — |
| Échange avec le cœur : écarts | L | L | L | L | — | — | — | — | — | — | — | — | L | A | — | A (technique) |
| Paramètres métier | D | D | D (crédit, recouvrement) | — | — | — | — | — | — | — | D (risque) | — | L | — | — | A |
| Comptes et rôles | D (rôles sensibles) | — | — | — | — | — | — | — | — | — | — | — | L | — | — | A |
| Piste d'audit, journal des accès | L (piste) | — | — | — | — | — | — | — | — | — | — | — | L | — | — | — |

Les écrans de chaque module, et le rôle qui y accède, sont listés dans chaque partie (§5.14 pour le crédit) ; un test parcourt la matrice et vérifie chaque cellule côté serveur.

---

## Annexe C. Contrat d'échange avec le cœur

Cette annexe définit l'échange entre Prospera et le logiciel cœur de l'IMF (§6.5), sans nom de produit. Elle fait foi pour le cœur fictif (§6.6) et pour tout futur connecteur. Elle décrit des **objets et des champs minimaux**, pas des routes ni des formats : le détail technique est dans l'addendum (→ addendum).

**Règles communes à tous les objets.**
- **Identifiant** : chaque objet porte l'identifiant stable donné par son propriétaire (clé d'origine). Il ne change jamais.
- **Montants** : en FCFA entiers (unité mineure), avec la devise. Dates avec date de valeur.
- **Mouvements** : les objets d'argent (paiement, pénalité, mouvement d'épargne) sont des mouvements datés, jamais des totaux (FR-161). Une annulation est un mouvement inverse.
- **Idempotence** : présenter deux fois le même objet ne le crée pas deux fois (FR-160).
- **Refus** : un objet refusé revient avec un code et un motif en clair (FR-152, FR-159).
- **Transport** : une API que Prospera interroge, ou des fichiers que Prospera relève ou dépose ; Prospera tire toujours, aucun port entrant (FR-157).
- **Fréquences par défaut** : « 5 min » (API seulement), « heure », « nuit » (avant 6 h). Ce sont des paramètres (FR-159). Un cœur sans API est limité à « heure » et « nuit ».
- **Champs minimaux** : un objet qui ne les respecte pas est refusé et va dans la file des écarts. Tout champ en plus est conservé s'il est connu, ignoré sinon.
- **Code d'agence** : celui du cœur s'il en a un, sinon celui de Prospera (FR-164).

| Objet | Sens | Qui fait foi | Champs minimaux | Fréquence par défaut | Ce que fait le cœur fictif |
|---|---|---|---|---|---|
| Client | cœur → Prospera | le cœur (identité, statut) ; Prospera pour le KYC terrain et la fiche enrichie (partie 3a) | identifiant du cœur, nom, type (personne, groupe), date de naissance ou de création, pièce d'identité (type, numéro), téléphone, agence, statut (actif, clos), date de création | heure | Tient les clients du jeu de démo ; crée un client à la demande de la démo ; produit le fichier d'export |
| Agence | cœur → Prospera | le cœur s'il a des codes d'agence ; sinon Prospera (FR-164) | code d'agence, nom, région, statut | nuit | Tient 3 agences ; accepte l'agence créée dans la démo avec le code de Prospera |
| Produit | cœur → Prospera (référence) ; Prospera → cœur (produit créé dans Prospera) | Prospera (produit de crédit et d'épargne versionné, partie 3a) ; le cœur pour le code de produit comptable | code produit du cœur, libellé, type (crédit, épargne), version, taux, durée, périodicité | nuit | Tient les produits du jeu de démo, tous conformes au plafond d'usure (TEG actuariel de 24 % par an au plus) |
| Prêt | cœur → Prospera | le cœur (encours, statut, jours de retard après décaissement) ; Prospera pour le dossier de crédit jusqu'au comité | identifiant du prêt, identifiant du client, agence, produit, montant décaissé, encours, taux, durée, date de décaissement, statut (actif, soldé, en souffrance, rééchelonné, perte), jours de retard, solde de contrôle, garanties (nature, valeur) | heure ; 5 min avec une API | Tient 1 000 prêts actifs ; fait vivre leur retard et leur solde (FR-169) ; accepte un prêt issu d'un dossier de la démo |
| Échéance (échéancier officiel) | cœur → Prospera | le cœur après décaissement ; avant, le comité de Prospera (échéancier contractuel) | identifiant du prêt, numéro d'échéance, date d'échéance, capital, intérêts, frais, assurance, montant payé, statut (à venir, payée, impayée) | heure | Génère l'échéancier officiel à l'acceptation d'un dossier ; peut dévier volontairement de l'échéancier contractuel pour montrer l'alerte d'écart (FR-162) |
| Mouvement de paiement | cœur → Prospera | le cœur (le paiement comptabilisé) | identifiant du mouvement, identifiant du prêt, identifiant du client, date de valeur, montant, canal (espèces, Mobile Money, virement, PI-SPI, collecte), imputation (pénalités, intérêts, capital), référence de la pièce, identifiant du paiement d'origine si renvoyé par Prospera | 5 min avec une API ; sinon heure | Génère des paiements quotidiens (à l'heure, en retard, absents) ; reconnaît un doublon ; renvoie le mouvement d'un paiement saisi dans Prospera (FR-155) |
| Pénalité | cœur → Prospera | le cœur (calcul des pénalités et des intérêts de retard) | identifiant de la pénalité, identifiant du prêt, identifiant de l'échéance, date de valeur, montant, base de calcul (jours, taux), statut (due, payée, annulée) | heure | Calcule les pénalités sur les prêts en retard et les paie par l'ordre d'imputation paramétré |
| Compte d'épargne | cœur → Prospera | le cœur | identifiant du compte, identifiant du client, produit, agence, date d'ouverture, solde de contrôle, statut | heure | Tient des comptes d'épargne pour une partie des clients ; certains clients sont épargnants et emprunteurs |
| Mouvement d'épargne | cœur → Prospera ; Prospera → cœur (collecte renvoyée, si le cœur sait recevoir) | le cœur | identifiant du mouvement, identifiant du compte, date de valeur, montant, sens (dépôt, retrait), canal, identifiant de la collecte d'origine si renvoyé | heure | Génère des dépôts et retraits ; reconnaît un doublon ; accepte une collecte renvoyée |
| Caisse du guichet | cœur → Prospera | le cœur | identifiant de la caisse, agence, date, solde d'ouverture, mouvements (entrées, sorties), solde de clôture, écart | heure ; à la clôture du jour | Tient une caisse par agence ; produit un écart de démo à la clôture |
| Balance | cœur → Prospera (facultatif) | le cœur | date d'arrêté, plan comptable (code du plan), postes (code, libellé, solde débiteur, solde créditeur), total débit et total crédit | nuit ; à la clôture du mois | Fournit une balance au plan comptable SFD, équilibrée, avec fonds propres, actif net, ressources stables, passif exigible (FR-166, FR-187) |
| Dossier accordé | Prospera → cœur | Prospera (décision du comité, conditions et échéancier contractuel) | identifiant de dossier (clé d'origine), identifiant du client, produit et version, agence, GP, montant, taux, durée, mensualité, frais, TEG, date de la première échéance, échéancier contractuel (lignes), garanties, date et participants de la décision du comité | à la décision du comité (5 min avec une API ; sinon heure) | Accepte ou refuse (avec motif) ; crée le prêt et l'échéancier officiel ; reconnaît un doublon |
| Ordre de décaissement | Prospera → cœur | Prospera (l'ordre) ; le cœur (l'exécution en espèces et par virement) | identifiant de l'ordre (clé unique), identifiant du dossier, identifiant du prêt, montant, canal (espèces, virement, Mobile Money, PI-SPI), bénéficiaire (nom, compte ou numéro), date prévue, autorisé par (CPT ou DAF pour les espèces) | à l'émission | Exécute espèces et virement après un délai simulé ; rejette selon des cas paramétrés ; reçoit en déclaration les décaissements Mobile Money et PI-SPI exécutés par `paiement` |
| Confirmation d'exécution | cœur → Prospera | le cœur | identifiant de l'ordre, état (exécuté, rejeté, expiré), date de valeur, référence d'exécution du cœur, motif de rejet | 5 min avec une API ; sinon heure | Renvoie l'état de chaque ordre ; simule un rejet et un doublon |
| Remboursement saisi dans Prospera | Prospera → cœur, si le cœur sait recevoir ; sinon liste « à saisir dans le cœur » | le cœur (le paiement comptabilisé) ; Prospera (la saisie) | identifiant du remboursement (clé d'origine), identifiant du prêt, montant, date de valeur, canal, collecteur ou caissier, référence de la pièce | à la validation (5 min avec une API ; sinon heure) ; liste quotidienne | Accepte et renvoie le mouvement correspondant ; une option de démo le met en mode « ne reçoit pas » pour montrer la liste à saisir (FR-156) |
