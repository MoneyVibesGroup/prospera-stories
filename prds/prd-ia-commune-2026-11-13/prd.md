---
title: "PRD — L'IA commune de Prospera"
status: draft
created: 2026-11-13
updated: 2026-11-13
project: prospera
mode: rapide
prd_lies: [prd-assistant-ia-2026-08-02 (étendu et remplacé sur le socle), prd-distributeur-2026-11-12, prd-microfinance-2026-11-13, prd-assurance-2026-11-13, prd-fiscalite-2026-07-31, prd-moteur-installation-2026-11-09]
---

# PRD — L'IA commune de Prospera

*Brouillon complet (2026-11-13), mode rapide, à partir du récit du PO et de ses ajouts (`.memlog.md`), du plan et de ses décisions D1-D14 (`plan-redaction.md`) et de quatre extraits (`extract-*.md`). Reste : fin du PRD et annexes, relectures, corrections, tri des hypothèses.*

---

## 0. Objet du document

Ce PRD décrit **l'IA commune de Prospera** : l'unique intelligence artificielle qui sert **tous les logiciels Prospera à la fois**. Il s'adresse au PO, à Dev A, à Dev B et à ceux qui écriront la spine, les épics et les manifestes.

**Une seule IA, quatre logiciels.** Prospera propose aujourd'hui quatre logiciels : le **cabinet d'expert-comptable**, le **distributeur**, la **microfinance** et l'**assurance**. Chacun avait écrit ses propres besoins d'IA, dans son propre PRD, avec ses propres tableaux. Décision du PO : **au lieu de plusieurs IA Prospera, une seule**, qui les sert tous et qui sert aussi les verticales à venir. Elle ne fabrique pas quatre produits : elle tient un **catalogue de capacités** (lire une pièce, noter un tiers, prévoir un impayé, rédiger une relance, répondre à une question…) que chaque logiciel consomme dans son propre vocabulaire.

**En ligne et en local, avec le même code.** L'IA commune tourne **en ligne**, dans le SaaS de Money Vibes, pour les clients hébergés (le cabinet, le distributeur) ; elle tourne **en local**, sur le serveur du client, pour les clients dont les données ne quittent pas les murs (la microfinance, l'assurance). Le code est le même, les contrats sont les mêmes ; ce qui change est l'endroit où elle tourne et ce qu'elle a le droit d'envoyer au dehors.

**Ce qu'elle apporte.** Dès l'installation, elle donne des **premières informations** utiles, sans attendre un historique. Ensuite elle **apprend toujours** et **se met à jour** pour atteindre des **objectifs mesurés**. Sa règle d'or, venue de la vision de Money Vibes : **on met en commun l'apprentissage, pas les données**.

**Ce que ce PRD remplace ou étend.**

| Ce qui existait | Ce que ce PRD en fait |
|---|---|
| Le **PRD assistant-ia** (2 août 2026, amendé le 16 août) et la spine `assistant-service` (AD-1 à AD-23, jamais codée) | **Étendu et repris** : `assistant-service` devient `prospera-ia-service` (port :3417), qui porte trois modules (`ia`, `assistant`, `automatisations`). La doctrine, le contrat de Proposition, le mandat, le catalogue des types d'action, le RAG et l'audit sont repris ; le contrat est unifié (FR-12). |
| Les **tableaux d'IA des PRD de verticale** (distributeur, microfinance, assurance, cabinet) | **Réunis** : chaque ligne devient une capacité de l'IA commune, rangée dans une famille (partie 3). Les PRD de verticale gardent ce que l'IA fait pour leur métier ; l'IA commune dit **comment**. En cas d'écart, **ce PRD fait foi pour le moteur et les garde-fous**, le PRD de verticale pour le métier. |
| La note de **vision** locale du 10 au 11 novembre 2026 | **Reprise** pour la doctrine et la feuille de route ; ses produits (Risque comme produit, Pulse, Météo des prix, etc.) ne sont **pas** du premier jour (partie 3, feuille de route). |
| La **spine de la microfinance** (PropositionPort) et le **registre de l'IA** de l'assurance | **Absorbés** dans le contrat unique de proposition et le registre de l'IA (FR-12, FR-17). |

**Le document se lit en quatre parties.**

| Partie | Contenu | Sections |
|---|---|---|
| **1. Le produit** | objet, vision, pour qui, vocabulaire, doctrine et garde-fous | §0 à §4 (FR-1 à FR-29) |
| **2. Une IA, deux façons de tourner, et comment elle apprend** | en ligne et en local ; premières informations ; apprendre et se mettre à jour ; données et consentement ; exploitation, licence, absence de contact | §5 à §9 |
| **3. Ce que l'IA fait pour chaque logiciel** | le catalogue des capacités par famille ; Copilot et agents ; lecture de pièces ; feuille de route | §10 à §13 |
| **4. Le reste** | exigences transverses, indicateurs, périmètre, non-objectifs, décisions, hypothèses | §14 et suivants |

Quatre **annexes** : **A** le contrat de module (`ia`, `assistant`, `automatisations`, et la centrale de Money Vibes) ; **B** le contrat de proposition ; **C** ce qui sort d'une instance et ce qui n'en sort jamais ; **D** la table des paramètres. Les choix techniques renvoyés hors du PRD sont dans l'addendum.

**Sources et décisions.** Les sources sont le récit du PO, le plan de rédaction (décisions D1 à D14), le PRD assistant et sa spine, les PRD de verticale, la note de vision, les contraintes de plateforme déjà décidées (moteur d'installation, relais sortant, calibration) et une recherche sur les pratiques des grands éditeurs et sur la loi togolaise. Tout ce qui est tranché sans parole du PO porte `[ASSUMPTION: …]`. Un identifiant `FR-n` sans préfixe désigne une exigence de ce PRD ; les exigences des autres PRD portent toujours leur préfixe (`PRD-D FR-n`, `PRD-MF FR-n`, `PRD-A FR-n`).

**Textes légaux.** Seuls sont cités avec leur numéro les textes **lus** : la loi togolaise n° 2019-014 du 29 octobre 2019 (articles 20, 27, 28, 29, 30 et 31, texte du Journal officiel lu). Tout le reste (droit sénégalais, ivoirien, BCEAO, CIMA, règlement européen) est **« à vérifier par le juriste »**, y compris la référence au règlement européen sur l'IA, qui n'est qu'une **référence de bonne pratique** hors de l'Union.

#### FR-1 : Une seule IA Prospera, quatre logiciels, deux façons de tourner

L'IA commune est **un seul produit, avec un seul code**. Les quatre logiciels (cabinet, distributeur, microfinance, assurance) la **consomment**. Aucun d'eux ne fabrique, n'entraîne ni n'héberge sa propre IA. Elle sert aussi toute verticale future, sans modification du noyau. Elle tourne **en ligne** (service multi-organisations de Money Vibes) ou **en local** (instance sur le serveur du client), avec les **mêmes contrats** (D1, D10). Les clauses d'exploitation (où, comment, quel dimensionnement) sont en partie 2.

**Conséquences (testables) :**
- Un test déploie le même artefact en ligne et en local ; les mêmes jeux de requêtes rendent le même contrat de proposition (FR-12), aux valeurs près.
- Aucun des quatre logiciels ne contient de modèle, de règle d'IA ni d'appel direct à un fournisseur de langage : une analyse statique du code des modules métier ne trouve que des appels à l'IA commune.
- Ajouter une verticale ne demande **aucune modification du noyau** de l'IA : un test enregistre une verticale fictive (vocabulaire et capacités déclarés) et obtient une proposition sans toucher au code du noyau.

#### FR-2 : Ce que ce PRD remplace, étend ou laisse

Ce PRD **étend** le PRD assistant-ia (D2) et **remplace**, pour le moteur et les garde-fous de l'IA, les tableaux d'IA des PRD de verticale. Il ne réécrit **pas** le métier des verticales : la lecture d'une pièce de sinistre, le barème d'un score de crédit ou l'ordre de visite d'un commercial restent décrits dans leur PRD ; ce PRD les range dans une capacité et fixe ce qu'elles ont en commun. La note d'architecture du 20 juillet de l'assistant et sa règle « rien n'est appliqué sans validation humaine » sont **dépassées** : la doctrine est celle de FR-13 et FR-14.

**Conséquences (testables) :**
- Chaque ligne d'IA des PRD de verticale (distributeur, microfinance, assurance, cabinet) est reprise dans le catalogue des capacités avec sa FR d'origine : une table de correspondance (partie 3) n'a aucune ligne orpheline.
- Un contrôle de cohérence entre ce PRD et un PRD de verticale ne trouve aucun garde-fou plus faible dans la verticale que dans ce PRD ; s'il en trouve un, ce PRD l'emporte et le PRD de verticale est amendé.
- Le PRD assistant d'août n'est plus cité comme source de doctrine dans un épic ou une story postérieure à ce PRD.

#### FR-3 : Comment ce PRD se lit, se numérote et évolue

Les FR 1 à 29 sont de la partie 1 ; les plages suivantes appartiennent aux parties 2 et 3 (voir le plan de rédaction). Tout seuil, délai, liste ou borne de l'IA est un **paramètre** (annexe D, table `code | libellé | défaut | unité | source | FR`), jamais une valeur codée en dur. Tout choix technique (framework d'apprentissage, registre de modèles, passerelle, version d'un outil) est dans l'**addendum**, pas ici. `[ASSUMPTION : les valeurs par défaut des paramètres sont des recommandations ; le PO les confirme ou les change à la relecture et à la séance de calibrage avec chaque client]`

**Conséquences (testables) :**
- Une recherche de nombre dans le texte des FR ne trouve que des nombres qui sont soit des valeurs de loi citées, soit un renvoi à un paramètre de l'annexe D.
- Chaque paramètre de l'annexe D renvoie à au moins une FR, et chaque FR qui cite un paramètre figure dans la colonne « FR » de ce paramètre.

---

## 1. Vision

Les PME d'Afrique de l'Ouest et leurs partenaires (cabinets, distributeurs, institutions de microfinance, assureurs) ont de l'information partout et du jugement nulle part au bon moment. Le gestionnaire de sinistres ouvre un dossier de trente pièces ; la chargée de crédit décide d'un prêt sur un cahier ; le commercial visite les mêmes dix clients chaque semaine ; l'expert-comptable découvre l'anomalie d'une balance après la clôture. Un assistant de plus, avec ses propres règles et ses propres modèles dans chaque logiciel, ne règle rien : il coûte quatre fois plus, il apprend quatre fois moins, et il oblige chaque client à comprendre quatre IA.

**Une seule IA.** Prospera a **une** intelligence, qui se présente de la même façon dans les quatre logiciels : mêmes règles du jeu (elle propose, l'humain décide), même façon de dire d'où vient une information, même registre, mêmes garde-fous. Un utilisateur qui connaît l'IA du cabinet n'est pas dépaysé dans celle de la microfinance. Pour Money Vibes, c'est **une équipe, un code, un cycle de mise à jour**.

**Des premières informations dès le premier jour.** Une IA qui demande six mois d'historique avant de servir ne sert à rien à un client qui démarre. Chaque capacité livre donc, **dès l'installation**, des **règles expertes explicables** (niveau N0), paramétrées par pays et par verticale ; là où Money Vibes a déjà un **modèle commun** pré-entraîné (niveau N1), elle l'ajoute. L'écran dit toujours lequel des deux parle. Le client n'attend ni ses données, ni son modèle.

**Elle apprend toujours.** Chaque instance enregistre l'**écart** entre ce que l'IA a proposé et ce qui s'est passé (accepté, modifié, rejeté, réalité constatée). Elle recalibre ses capacités à partir de **ses seules données**, dans des bornes. Quand une capacité a assez de données, elle passe à un modèle ou à une calibration propre au client (niveau N2).

**Elle se met à jour pour atteindre ses objectifs.** Chaque capacité a des **objectifs mesurés** : qualité, usage, effet métier (par exemple la baisse du portefeuille à risque, le délai d'un sinistre, le taux de recouvrement, le temps gagné) et équité. Money Vibes améliore périodiquement le **modèle commun** ; une nouvelle version n'est promue que si elle **bat la version en place** sans régression d'équité ; elle descend chez le client en **essai, ombre et canari**, à la **date que le client choisit**, et se retire **en une action**. Si le client ne parle plus à Money Vibes pendant des mois (gel, licence à vie hors maintenance), **l'IA continue de servir**, avec son dernier modèle et sa calibration.

**On met en commun l'apprentissage, pas les données.** Les fiches clients, les pièces, les textes libres et les données de santé **restent chez leur propriétaire**. Ce qui voyage vers Money Vibes est un **niveau d'export « apprentissage »** : des agrégats et des écarts sans identité, sous un seuil d'effectif minimal, tirés sous une **finalité consentie** au contrat. Ce qui revient est un **modèle signé**, jamais une donnée. C'est aussi ce qu'un acteur à produit unique ne peut pas copier : l'avantage vient de la somme de ce que quatre métiers apprennent, pas de la somme de leurs données.

**Ce que ce PRD promet, et ne promet pas.** Il promet une IA **utile le premier jour**, **honnête** sur sa provenance et **jamais bloquante**. Il ne promet ni un modèle commun entraîné au premier jour (le premier modèle commun est annoncé au mieux au second semestre 2027, `[ASSUMPTION : date de la note de vision, à confirmer]`), ni la voix, ni les produits de la vision, qui sont la feuille de route (partie 3).

#### FR-4 : Une seule IA, une seule façon de se présenter

Les quatre logiciels présentent **la même IA** : même contrat de proposition (FR-12), même présentation de la provenance (FR-16), même registre (FR-17), mêmes droits de l'utilisateur (FR-21). Un composant d'interface commun affiche une proposition, sa provenance, son explication et les trois gestes (accepter, modifier, rejeter). Une capacité n'a pas de garde-fou propre à un logiciel : elle a les garde-fous de ce PRD, et un logiciel peut en ajouter, jamais en retirer.

**Conséquences (testables) :**
- Un test de rendu affiche la même proposition dans les quatre logiciels : provenance, explication et trois gestes sont présents et identiques à la mise en forme près.
- Un garde-fou de ce PRD (FR-12 à FR-29) ne peut pas être désactivé par la configuration d'un logiciel : un test tente de le désactiver dans chaque logiciel et obtient un refus nommé.

#### FR-5 : Les premières informations dès le premier jour

Chaque capacité livre, **dès l'installation, sans historique du client**, au moins une réponse utile : soit une **règle experte explicable** (N0, repli permanent), soit un **modèle commun** (N1) là où Money Vibes en a un. Le niveau est affiché (FR-24). Aucune capacité ne répond « pas de données » sans alternative : si ni règle ni modèle ne peut répondre, elle dit « je ne sais pas » et le parcours avance sur l'analyse humaine (FR-15).

**Conséquences (testables) :**
- Sur une instance neuve, sans aucune donnée du client, un test appelle chaque capacité déclarée par un module installé et obtient une proposition de niveau N0 ou N1, ou la réponse « je ne sais pas » avec son motif ; jamais une erreur.
- Aucune capacité n'est livrée sans sa règle de niveau N0 : un contrôle d'installation refuse une capacité dont la fiche n'a pas de règle de repli (sauf capacité de langage pure, qui se replie sur des gabarits et le dit).
- Le délai entre l'installation et la première proposition utile est mesuré et figure dans le rapport d'installation. `[ASSUMPTION : cible de ce délai à fixer par le PO avec le moteur d'installation]`

#### FR-6 : Apprendre toujours, se mettre à jour, atteindre ses objectifs

L'IA **apprend en continu** (boucle locale) et **se met à jour périodiquement** (boucle commune), mais **seulement pour atteindre ses objectifs** (la mécanique est décrite en partie 2). Chaque capacité porte ses objectifs mesurés (qualité, usage, effet métier, équité) ; une version nouvelle n'est promue que si elle bat la version en place sur ces objectifs sans régression d'équité ; un **rapport mensuel** par capacité et par client (en local) et un rapport global (chez Money Vibes) disent l'objectif et le réalisé. Les cibles chiffrées sont des paramètres.

**Conséquences (testables) :**
- Une capacité sans fiche d'objectifs (indicateurs, cible, seuil minimal, fenêtre) ne peut pas être déclarée : le contrôle d'installation la refuse.
- Un test promeut une version challenger qui dégrade un indicateur d'équité : la promotion est refusée avec le motif.
- Le rapport mensuel existe pour chaque capacité active, avec l'objectif, le réalisé et l'écart ; un test en génère un sur un jeu de données de démonstration.

#### FR-7 : On met en commun l'apprentissage, pas les données

Aucune donnée d'un client ne sert à l'IA d'un autre client. Ce qui est mis en commun est **l'apprentissage** : des écarts agrégés et anonymisés, au niveau d'export « apprentissage », sous la finalité « apprentissage commun » (FR-3 et partie 2). Une donnée n'entraîne jamais un modèle **hors de sa finalité** ; un client qui n'a pas consenti à la finalité ne remonte rien et reçoit tout de même les mises à jour du modèle commun. `[ASSUMPTION : recevoir le modèle commun sans y contribuer reste permis ; le PO peut en faire une contrepartie commerciale]` Money Vibes **ne promet jamais « vos données ne servent jamais à entraîner »** sans dire à quoi elles servent : les grands éditeurs ont tous des exceptions agrégées ou consenties, et ce PRD dit les siennes (FR-29).

**Conséquences (testables) :**
- Un test inspecte tout envoi sortant d'une instance : il ne contient ni identifiant, ni nom, ni téléphone, ni texte libre, ni donnée de santé, ni pièce ; il respecte le seuil d'effectif minimal (paramètre IA-P04).
- Sur une instance **sans** le consentement « apprentissage commun », un test ne trouve **aucun** envoi ; l'instance reçoit toujours les mises à jour.
- Un test de retrait du consentement arrête les envois suivants dans le délai paramétré ; le contrat dit qu'un modèle déjà publié n'est pas désentraîné (FR-29).

---

## 2. Pour qui

### 2.1 Les rôles

L'IA n'a pas d'écran à elle : elle se montre dans les écrans des quatre logiciels. Les rôles ci-dessous sont ceux qui **voient, décident ou administrent** ce qu'elle produit. Les rôles métier précis (gestionnaire, chargée de crédit, etc.) sont définis dans le PRD de chaque verticale ; l'IA n'en crée aucun et **n'a aucun droit propre** (FR-25).

| Code | Rôle | Ce qu'il fait avec l'IA |
|---|---|---|
| UM | **Utilisateur métier** des quatre logiciels (gestionnaire de sinistres, chargée de crédit, commercial, expert-comptable, comptable, caissier, etc.) | reçoit une proposition ; **accepte, modifie ou rejette** ; écrit un motif quand il s'écarte d'une recommandation ; voit la provenance et l'explication ; peut s'opposer au profilage (FR-21) |
| RM | **Responsable** de l'utilisateur métier (responsable sinistres, directeur de crédit, responsable commercial, associé du cabinet, DG) | lit les rapports d'usage et d'objectifs ; arbitre ; délivre ou révoque un **mandat** (FR-14) ; pose des questions au Copilot ; voit la chaîne de décision |
| AUD | **Auditeur** (contrôle interne, audit externe, commissaire aux comptes) | lit le **registre de l'IA** et le **journal des accès**, **en lecture seule** ; vérifie le taux de motifs identiques à la proposition ; ne décide jamais |
| DSI | **DSI du client** (administrateur informatique) | choisit la **date** de promotion d'une nouvelle version de modèle, la met en ombre, la retire ; règle les paramètres de l'instance ; **ne lit aucune donnée métier** par ce rôle |
| IA-MV | **Équipe IA de Money Vibes** | entraîne le modèle commun, l'évalue, le **signe** et le publie ; lit les rapports globaux ; **ne voit jamais** une donnée d'un client, seulement les agrégats |
| JUR | **Juriste** de Money Vibes et du client | tranche les points juridiques ouverts (§13 du PRD) ; relit les finalités, les clauses et la revue obligatoire avant la mise en service d'un score de crédit ou d'assurance (FR-28) |
| DPD | **Délégué à la protection des données** (ou personne qui en tient lieu) | tient le registre des finalités et des consentements ; répond aux demandes d'accès, d'opposition et d'observation des personnes concernées (FR-21, FR-22) ; lit le journal des accès |
| PC | **Personne concernée** (client d'une IMF, assuré, client final) | n'utilise pas l'IA ; peut présenter ses **observations** et s'opposer à un profilage (FR-22) |

Les droits viennent du rôle **métier** de l'utilisateur dans le logiciel concerné, jamais d'un rôle IA (FR-25). Les rôles IA-MV, JUR et DPD n'ont **aucun accès** aux données des clients : ils lisent des agrégats, des registres de finalités et des journaux.

### 2.2 Hors cible (v1)

- **La personne concernée n'a pas d'application d'IA à elle** : elle reçoit des messages et présente ses observations par le canal de l'institution (FR-22). Le **chatbot de l'assuré ou du client**, la **voix** et les **langues locales** sont « bientôt ».
- **L'IA ne remplace personne qui décide** : pas de crédit, de sinistre, de paiement, de refus ou de blocage décidés par l'IA seule (FR-13).
- **Les produits de la vision** (Risque comme produit, Pulse, Météo des prix, distribution en pilote automatique, facture certifiée qui vaut crédit, argent programmable, assurance embarquée, Relation client commune, passeport, modèle de fondation sectoriel) ne sont pas du premier jour (partie 3).
- **Le croisement d'une même PME entre verticales** (IMF, distributeur, cabinet) exige un consentement explicite et une identité partagée : horizon, pas jour 1.
- **Money Vibes ne prête ni n'assure** : elle propose, l'institution décide.
- La reconnaissance de caractères (OCR) reste dans `document-service` ; ce PRD ne la décrit pas (partie 3, lecture de pièces).

### 2.3 Parcours clés

Les noms sont fictifs et modifiables ; aucun client réel n'est nommé.

**UJ-1 — Un sinistre : la pièce lue, le résumé sourcé.** Edem est gestionnaire de sinistres dans une compagnie. Une assurée dépose le constat et la carte grise d'un véhicule ; l'IA lit les deux pièces (capacité de lecture, niveau extraction), classe chacune, relève la date, la plaque et le propriétaire, **avec l'extrait d'où chaque champ a été lu**. Edem corrige une plaque mal lue : sa correction est enregistrée comme écart. Il ouvre le dossier ; l'IA propose un **résumé sourcé** où chaque phrase renvoie à sa pièce ; une phrase qu'elle ne peut pas sourcer **n'est pas affichée**. Le propriétaire de la carte grise diffère de l'assuré : l'IA signale l'incohérence, sans la qualifier de fraude. Edem décide. Sur un dossier corporel, l'IA ne propose **aucun montant** (FR-20).

**UJ-2 — Un crédit : le score et sa décomposition.** Akouvi est chargée de crédit dans une institution de microfinance. Pour la demande d'une commerçante, l'IA affiche un **score** (par exemple 64 sur 100) avec ses **facteurs et leurs poids**, son **niveau** (« règle » le premier mois, « modèle de votre structure » plus tard) et les variables utilisées, toutes dans la liste autorisée (FR-18). Le score est **une information, jamais un refus**. Akouvi décide d'accorder avec un montant plus bas, écrit son motif, et enregistre les **observations** de la cliente (FR-22). Plus tard, le remboursement réel est rapproché du score : c'est un écart d'apprentissage. Si la structure coupe l'IA ce matin-là, Akouvi instruit sur ses propres analyses, sans message bloquant (FR-15).

**UJ-3 — Un commercial : l'ordre de visite et la relance rédigée.** Kodjo est commercial d'un distributeur. Chaque matin, l'IA lui propose l'**ordre de visite** de sa tournée (valeur espérée, risque d'impayé, ruptures prévues) et, pour un client en retard de paiement, une **relance rédigée** dans le canal qu'il choisit. Kodjo modifie un mot, accepte ; la relance part par le service de notification. Une relance de ton ferme est **soumise à son responsable** (action engageante, FR-14). Au bout d'un mois, le taux de modification des relances rédigées nourrit l'objectif « temps gagné ».

**UJ-4 — Un expert-comptable : l'anomalie et son explication.** Ama est expert-comptable d'un petit cabinet. En important la balance d'une PME, elle voit l'IA signaler une **anomalie** : un compte de charges a doublé par rapport à la moyenne de l'exercice précédent, sans écriture explicative. L'IA **explique** le calcul (le chiffre vient du moteur déterministe, pas d'elle : FR-26), cite les écritures concernées, et propose trois pistes. Ama en retient une, la rejette avec un motif pour les deux autres. L'IA ne modifie **aucun chiffre officiel**.

**UJ-5 — Un DG pose une question au Copilot.** Mawuena dirige un distributeur. Elle demande au Copilot, en texte : « Quels clients ont dépassé leur plafond ce mois-ci ? ». Le Copilot est en **lecture seule** : il répond par une liste, avec le **chiffre, la source et la date** de chaque ligne, et seulement sur ce que le rôle de Mawuena lui permet de voir (FR-25). Elle demande ensuite une donnée qu'un autre rôle seul peut lire : le Copilot répond qu'il n'y a pas accès, sans la deviner.

**UJ-6 — Le DSI d'une IMF reçoit une nouvelle version du modèle commun.** Koffi est DSI d'une institution de microfinance dont l'IA tourne sur ses serveurs. Money Vibes a publié une nouvelle version du modèle commun de score. L'instance l'a tirée par la liaison sortante, vérifié sa **signature** et l'a mise de côté ; **rien n'a changé** pour les utilisateurs. Koffi lit le rapport du challenger, le met **en ombre** une semaine : il compare, sur les dossiers réels, la version en place et la nouvelle, sans effet pour personne. Les portes écrites d'avance (qualité, équité, latence) sont franchies. Koffi **choisit la date** de la promotion, la fait passer en canari puis en général. Trois semaines plus tard, un indicateur d'équité dérive : il **revient en arrière en une action**, sans redéploiement. La version précédente était conservée.

**UJ-7 — L'équipe IA de Money Vibes publie une version après évaluation.** Yawovi, de l'équipe IA, reçoit chaque jour les écarts agrégés et anonymisés des instances consentantes. Elle entraîne un challenger du modèle de probabilité de paiement, l'**évalue** sur un jeu de référence stable, compare au champion capacité par capacité, vérifie l'équité par sous-groupe. Le challenger bat le champion sur la qualité mais régresse sur un sous-groupe : **la publication est refusée**. Une semaine plus tard, la version corrigée passe toutes les portes ; elle est **signée** et publiée sur la **ligne de modèles** commune ; le rapport global du mois l'enregistre.

**UJ-8 — Une instance sans contact pendant des mois.** Une compagnie d'assurance a gelé sa maintenance ; sa licence est à vie hors maintenance. Pendant des mois, son instance n'a **aucun contact** avec Money Vibes : aucun écart ne remonte, aucune mise à jour n'arrive. L'IA **continue de servir** chaque jour avec son dernier modèle et sa calibration locale, qui continue de se recalibrer dans ses bornes. Les utilisateurs ne voient aucune dégradation autre qu'un **bandeau d'information** (« modèle de telle date »). Quand le contact revient, l'instance rattrape : ses écarts remontent, ses mises à jour s'empilent, le DSI choisit la date.

#### FR-8 : Les rôles de l'IA et leur périmètre

Les huit rôles du §2.1 sont les seuls qui touchent l'IA. Chacun a un **périmètre** : l'utilisateur métier ne voit que les propositions de ses propres dossiers, le responsable celles de son périmètre, l'auditeur le registre en lecture seule, le DSI les versions et les dates, l'équipe IA de Money Vibes les agrégats, le juriste et le DPD les finalités et les journaux. Le DSI **ne lit aucune donnée métier** par ce rôle ; l'équipe IA de Money Vibes **ne voit jamais** de donnée d'un client.

**Conséquences (testables) :**
- Une matrice rôles × objets est testée : chaque case non prévue rend `404` (jamais `403`, pour ne pas révéler l'existence).
- Un compte du DSI ouvre le registre : il voit les comptes, les versions et les dates, mais ni entrée, ni sortie, ni texte d'une proposition.
- Un compte de l'équipe IA de Money Vibes interroge la centrale : il ne reçoit que des agrégats au-dessus du seuil d'effectif ; une requête qui descend sous le seuil est refusée.
- L'auditeur ne peut ni créer, ni modifier, ni supprimer aucune proposition : un test inspecte ses droits et n'y trouve que des lectures.

#### FR-9 : Ce que l'IA ne fait pas au premier jour

Ne sont **pas** du premier jour : la **voix** (dictée, transcription d'appel, synthèse vocale), le **chatbot** de l'assuré ou du client (WhatsApp), les **langues locales**, le **croisement d'une même PME entre verticales**, l'**apprentissage fédéré** et les produits de la vision (D14). Leur emplacement dans l'interface s'affiche « bientôt ». `[ASSUMPTION : le Copilot, en revanche, est du premier jour pour les quatre logiciels, en texte et en lecture seule (D12) ; le PRD distributeur le mettait « bientôt », la décision du PO sur l'IA commune le remonte]`

**Conséquences (testables) :**
- Aucun écran des quatre logiciels ne propose de dictée, de transcription d'appel ou de synthèse vocale ; l'emplacement du chatbot affiche « bientôt ».
- Un test cherche, dans le catalogue des capacités livrées au premier jour, une capacité à croisement inter-verticales : il n'en trouve aucune ; la demande d'une telle capacité est refusée avec un code nommé.
- Le Copilot est disponible dans les quatre logiciels dès l'installation ; un test l'appelle dans chacun, en lecture seule.

#### FR-10 : Les parcours UJ-1 à UJ-8 sont des cas de recette

Les huit parcours du §2.3 servent de **cas de recette** de bout en bout : chacun est rejoué sur un jeu de démonstration (fictif, sans donnée réelle) avant la mise en service. Ils couvrent les quatre logiciels, les deux façons de tourner (en ligne, en local) et les deux boucles d'apprentissage.

**Conséquences (testables) :**
- Un test de recette par parcours existe et passe, avec les mêmes assertions que le texte du parcours (proposition affichée, provenance, geste de l'utilisateur, écart enregistré).
- UJ-6 et UJ-8 sont rejoués sur une instance locale de démonstration ; UJ-8 coupe la liaison sortante pendant une période simulée et vérifie que l'IA sert et recalibre sans rupture.
- UJ-1 sur un dossier corporel ne rend aucun montant proposé (FR-20).

---

## 3. Vocabulaire

Le vocabulaire commun est celui des PRD de verticale et du PRD moteur d'installation. Les termes propres à ce PRD :

| Terme | Sens dans ce PRD |
|---|---|
| **IA commune** | L'unique IA de Prospera, un seul code, servie en ligne et en local à tous les logiciels (FR-1). Elle correspond au service `prospera-ia-service` et à la centrale de Money Vibes. |
| **Capacité** | Une fonction d'IA **versionnée et déclarée** (par exemple « lire une pièce », « noter un tiers », « prévoir un impayé »). Elle a une fiche : entrées, sorties, destinataire, garde-fou, niveau au premier jour, objectifs. Chaque module métier **déclare** les capacités qu'il consomme dans son manifeste. |
| **Famille** | Un regroupement de capacités de même nature (score d'un tiers, lecture de pièces, anomalie et fraude, prévision, rédaction, Copilot, etc.). Le catalogue en compte dix-neuf (partie 3). |
| **Proposition** | Ce que l'IA rend : une proposition **immuable**, avec origine, niveau, statut, provenance, confiance, sources et explication (FR-12). L'IA ne décide pas ; elle propose. |
| **Origine** | D'où vient une proposition : `REGLE` (règle experte), `MODELE` (modèle statistique ou appris), `LANGAGE` (modèle de langage). |
| **Niveau d'une proposition** | `EXTRACTION` (lire), `ANALYSE` (qualifier), `RECOMMANDATION` (conseiller). Il n'existe **pas** de niveau « décision ». |
| **Statut** | `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE` ou `EXPIREE`. |
| **Décideur** | Qui a tranché : `HUMAIN`, `REGLE` (règle déterministe approuvée) ou `MANDAT` (action sous mandat). Jamais « le système ». |
| **Niveaux N0, N1, N2** | **N0** : règle experte explicable, livrée avec la capacité et toujours présente comme repli. **N1** : modèle commun, pré-entraîné par Money Vibes. **N2** : calibration ou modèle propre au client, quand un seuil de données mesuré par capacité est atteint. Le mot « IA » ne s'affiche que pour N1 et N2 (FR-24). |
| **Calibration locale** | Le réglage, par une instance, de ses capacités sur **ses seules données**, dans des bornes, chaque nuit. Une calibration validée par le client n'est jamais modifiée sans contrôle. |
| **Modèle commun** | Le modèle que Money Vibes entraîne sur l'apprentissage agrégé et anonymisé des instances consentantes, évalue, signe et publie. |
| **Ligne de modèles** | La suite versionnée des modèles communs, **distincte** de la ligne de versions de la plateforme : le modèle se met à jour sans changer la plateforme, et inversement. |
| **Écart** | La différence entre une proposition et ce qui s'est passé : accepté, modifié, rejeté, ou réalité constatée plus tard (remboursement, sinistre réel, vente). C'est la matière de l'apprentissage. |
| **Objectif** | Une mesure cible d'une capacité : qualité, usage, effet métier ou équité, avec cible, seuil minimal et fenêtre. |
| **Champion / challenger** | Le champion est la version en service ; le challenger, la candidate. Le challenger ne remplace le champion que s'il le bat sur les objectifs sans régression d'équité. |
| **Ombre, canari, général** | Les trois étapes d'une promotion après l'essai : en **ombre**, la nouvelle version tourne en parallèle sans effet ; en **canari**, une petite part du trafic la voit ; en **général**, tout le trafic. Chaque étape a ses **portes** écrites d'avance. |
| **Finalité « apprentissage commun »** | La finalité consentie au contrat qui autorise l'envoi, vers Money Vibes, du niveau d'export « apprentissage ». Elle est inscrite au registre des consentements. |
| **Niveau d'export « apprentissage »** | Ce qui peut sortir d'une instance pour l'apprentissage : agrégats et écarts sans identité, sous un seuil d'effectif minimal, sans texte libre, sans donnée de santé, sans pièce. |
| **Passerelle** | Le point unique par lequel passe tout appel à un grand modèle de langage externe : masquage des données, journal de chaque envoi, aucune rétention chez le fournisseur par contrat. |
| **Registre de l'IA** | Le journal inaltérable de chaque proposition de l'IA et de la réponse humaine (FR-17). |
| **Mandat** | La délégation, par un responsable habilité, d'une action **non engageante et réversible** à l'IA, avec un périmètre, un plafond et une expiration (FR-14). |
| **Instance** | Une installation de l'IA commune : multi-organisations en ligne, ou unique chez un client en local. |
| **Centrale** | `prospera-ia-centrale`, qui tourne **seulement chez Money Vibes** : registre des modèles, agrégation des écarts, entraînement, évaluation, publication. |
| **Jour 1** | L'installation d'une instance, avant tout historique du client. |
| **Observation** | Ce que la personne concernée dit de sa situation avant une décision qui la concerne ; l'institution la **saisit** et la conserve (FR-22). |

#### FR-11 : Le vocabulaire est contractuel

Les termes du §3 sont ceux **de l'interface, des API, des manifestes et des tests**. Un module ne définit pas un synonyme : une « note » n'est pas un « score » ; une « IA » n'est pas une « règle ». Le vocabulaire **par verticale** (la même capacité s'appelle « note de crédit » en microfinance et « santé du point de vente » chez le distributeur) est déclaré par la verticale, **au-dessus** du noyau, qui reste neutre.

**Conséquences (testables) :**
- Un contrôle de manifeste refuse un module qui déclare une capacité avec un champ de statut, d'origine ou de niveau hors des listes du §3.
- Une capacité ne peut avoir qu'un seul vocabulaire par verticale ; l'ajout d'un second est refusé.
- Le glossaire de l'interface est généré depuis le §3 et n'en diffère pas : un test compare les deux.

---

## 4. Doctrine et garde-fous

Les garde-fous qui suivent s'appliquent à **toutes** les capacités de **tous** les logiciels, en ligne comme en local (D4, D5, D11). Ils étendent ceux que les verticales avaient écrits chacune de son côté. Chaque règle est une exigence testable.

#### FR-12 : Un seul contrat de proposition

Toute sortie de l'IA qui est présentée à un utilisateur est une **proposition** au sens d'un **contrat unique** (annexe B) : **origine** (`REGLE`, `MODELE`, `LANGAGE`), **niveau** (`EXTRACTION`, `ANALYSE`, `RECOMMANDATION`), **statut** (`PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`, `EXPIREE`), **décideur** (`HUMAIN`, `REGLE`, `MANDAT`), **provenance** (capacité, version de règle ou de modèle, date, données utilisées), **confiance**, **sources citées** et **explication**. La proposition est **immuable et chaînée** : elle ne change pas ; une nouvelle proposition cite la précédente qu'elle remplace. La **décision humaine et son motif** sont écrits par le **module consommateur** ; la proposition, par l'IA. La confiance est affichée mais **n'ouvre aucune autonomie**. L'unité de travail de la proposition est une **référence d'objet** neutre (dossier, client, police, point de vente), déclarée par la verticale. `[ASSUMPTION : le contrat unifie la Proposition de l'assistant et le PropositionPort de la microfinance, et ajoute l'origine MODELE que le PRD assistant n'avait pas]`

**Conséquences (testables) :**
- Un test inspecte toute sortie d'IA affichée dans les quatre logiciels : chacune est une proposition valide au schéma de l'annexe B ; une sortie hors contrat est refusée à l'affichage.
- Une proposition ne peut être modifiée : une tentative de mise à jour hors transition de statut est refusée ; ré-proposer crée une nouvelle proposition qui cite la précédente.
- Aucune valeur de décideur `SYSTEME` ni de niveau `DECISION` n'existe : un test les cherche dans le registre d'une installation de démonstration et n'en trouve aucune.
- Un test baisse la confiance d'une proposition à zéro puis la monte à cent : aucun comportement du système (autonomie, affichage, file) ne change à cause de la confiance seule.
- Une proposition `PROPOSEE` expire après la durée paramétrée (IA-P01) par un travail idempotent, pas par un calcul à la lecture.

#### FR-13 : L'IA propose, l'humain décide

Pour **toute décision qui produit un effet juridique ou financier sur une personne** (octroi ou refus d'un crédit, d'une garantie, d'un sinistre, d'un paiement, blocage, résiliation), la décision est **humaine**. L'IA extrait, analyse et recommande ; **valider, refuser ou payer reste un acte humain**. C'est la lecture de la loi togolaise n° 2019-014, **article 27** : aucune décision produisant des effets juridiques à l'égard d'une personne ne peut être prise sur le seul fondement d'un traitement automatisé destiné à définir son profil ou à évaluer certains aspects de sa personnalité ; ne sont pas prises sur le seul fondement d'un traitement automatisé les décisions prises dans le cadre de la conclusion ou de l'exécution d'un contrat, pour lesquelles la personne a été mise à même de présenter ses observations, ni celles qui satisfont sa demande. Lecture du PRD, **pas un avis juridique** : le juriste la confirme (FR-28). Ce PRD en tire deux règles : **une décision humaine éclairée par l'IA** est permise ; **le droit de présenter ses observations est outillé** (FR-22).

**Conséquences (testables) :**
- Un test inspecte les droits du compte de service de l'IA dans chacun des quatre logiciels : il n'a que la **lecture** et l'écriture de **propositions** ; aucune action de validation, de refus, de paiement ou de blocage ne lui est ouverte.
- Un test tente, par l'IA, de décider un crédit, un sinistre, un paiement et un blocage : chacun est refusé avec un code nommé.
- Une décision qui a un effet sur une personne et dont le décideur est `REGLE` ou `MANDAT` est **refusée** si la catégorie d'effet est `JURIDIQUE_OU_FINANCIER` (FR-14).
- Pour un crédit, un sinistre et un paiement, la **décision automatique** est désactivée et **non activable** par la configuration d'un client tant que le juriste n'a pas tranché (FR-28).

#### FR-14 : L'autonomie, seulement non engageante, seulement sous mandat

L'IA peut **agir seule** uniquement sur un **type d'action déclaré non engageant et réversible** au **catalogue des types d'action**, **sous un mandat explicite** (décideur `MANDAT`). Le catalogue est versionné ; **un type non déclaré est engageant et irréversible** (le défaut est le régime le plus strict). Un **mandat** est une délégation de signature bornée : délivreur habilité, périmètre, **plafond cumulé sur la période** et plafond unitaire optionnel (entiers d'unité mineure et devise ; le franc CFA n'a pas de décimale), **expiration**, **révocation immédiate**. Mandat expiré ou révoqué : les règles retombent en **validation humaine**, avec notification. Toute exécution autonome est **journalisée, notifiée au responsable, annulable** (moyen d'annulation déclaré) et soumise à un **quota de sollicitation** si elle contacte une personne. **On peut abaisser un mode, jamais l'élever** sans un droit plus restreint. L'**interrupteur général** par organisation est lu à chaque exécution. Une action **jamais** autonome : crédit, garantie, sinistre, paiement, refus, blocage.

**Conséquences (testables) :**
- Un test déclare un type d'action sans les champs `reversible` et `engageant` : le contrat le traite comme engageant et irréversible, donc jamais autonome.
- Une action autonome sur un type non déclaré, ou déclaré engageant, est refusée ; sur un type déclaré non engageant sans mandat valide, elle retombe en validation.
- Un mandat dont le plafond cumulé est atteint refuse l'exécution suivante ; le compteur est réservé avant l'action, confirmé au succès, libéré à l'échec.
- Un mandat révoqué à midi : l'exécution de 12 h 01 retombe en validation et le responsable est notifié.
- Une divergence entre la version du catalogue figée par la règle et celle de l'exécution **suspend** l'exécution (ni exécutée, ni rétrogradée en silence).
- Le taux d'actions autonomes annulées ou contestées est mesuré ; au-delà du seuil (IA-P09) une alerte est levée au responsable.

#### FR-15 : L'IA n'est jamais bloquante

Si l'IA est **coupée, lente, indisponible ou en panne** (instance arrêtée, passerelle coupée, modèle retiré), **chaque parcours des quatre logiciels avance** sur l'analyse humaine. L'emplacement de la proposition dit alors « IA indisponible » ; aucun message d'erreur bloquant, aucune étape qui dépend de l'IA pour continuer. Le délai de réponse maximal avant repli est un paramètre (IA-P07). Une capacité qui n'a **pas** de repli humain (par exemple une relance rédigée) cède la place à un champ libre.

**Conséquences (testables) :**
- Pour chaque parcours UJ-1 à UJ-8, un test **coupe l'instance de l'IA** en cours de parcours : le parcours va jusqu'à la fin sans erreur bloquante ; seule la proposition est remplacée par « IA indisponible ».
- Un test simule un délai supérieur à IA-P07 : l'écran repasse en saisie humaine sans bloquer ; la proposition tardive est jetée ou marquée expirée.
- Un test de démarrage dégradé : l'instance démarre avec le service de langage hors ligne ; les capacités de règles et de modèles classiques répondent, celles de langage déclarent leur indisponibilité.

#### FR-16 : Provenance et explication de chaque proposition

Toute proposition affiche sa **provenance** : **règle** ou **modèle**, sa **version**, la **date de calcul**, le **niveau** (N0 « règle », N1 « modèle commun », N2 « modèle de votre structure ») et les **données utilisées**. Elle affiche son **explication** : pour un score, les **facteurs principaux** avec leur poids ; pour un texte, les **sources citées** jusqu'à la pièce, au paragraphe ou au champ ; pour un calcul, la **règle appliquée**. L'explication restitue ce qui a **réellement pesé** dans le résultat, pas un modèle de substitution : un motif issu d'un second modèle qui « imite » le premier est interdit. Une information **sans source** n'est **pas affichée** (« rien n'est inventé ») ; sous le seuil de confiance minimal (IA-P12), l'IA dit « je ne sais pas » ou propose seulement.

**Conséquences (testables) :**
- Une proposition sans source est retirée de l'affichage : un test supprime la source d'une proposition de niveau analyse et vérifie qu'elle disparaît (état `NON_SOURCEE` visible dans le registre, non acceptable).
- Chaque score affiché porte ses facteurs avec leur poids ; un test en retire un et vérifie que la somme ne tient plus ; un test compare l'explication affichée à celle produite par le modèle lui-même.
- Une affirmation à portée légale sans citation vérifiable d'un texte du corpus versionné est **inapplicable** : un test pose une question légale hors corpus et obtient « non sourcé » à 100 %.
- Sous IA-P12, l'IA répond « je ne sais pas » ; elle n'affiche pas une valeur à faible confiance sans l'avertissement.

#### FR-17 : Le registre de l'IA

Chaque action de l'IA est inscrite au **registre de l'IA** : entrée (minimisée), sortie, confiance, sources, **origine**, **niveau**, **statut**, **décideur**, **version de règle ou de modèle**, **version du modèle de langage** s'il y en a un, date et auteur de la décision humaine, et son motif. Le registre est **inaltérable** (append-only, chaîné), **à deux horloges** : la **trace opposable** (identifiants, versions, décisions) est conservée longtemps (IA-P06) ; le **contexte brut** et le rendu sont purgés à une échéance courte (IA-P10). La fiche de l'objet montre la **chaîne de décision** : suggestion, modification, validation, exécution, par qui et quand. L'auditeur et le responsable lisent le registre ; **aucune invocation n'est anonyme** (organisation, capacité, auteur ou règle, taille, durée, version, figés à l'appel).

**Conséquences (testables) :**
- Aucune action de l'IA n'échappe au registre : un test compare le nombre de propositions affichées au nombre d'entrées du registre, par logiciel.
- Une entrée du registre ne peut être modifiée ni supprimée par aucun rôle : un test le tente avec les droits les plus élevés et échoue ; la chaîne de condensats se vérifie de bout en bout.
- La fiche d'un objet montre, pour chaque proposition, la chaîne suggestion-modification-validation-exécution avec auteur et heure de chaque maillon ; un test la compare au registre.
- À l'échéance IA-P10, le contexte brut est purgé et la trace opposable reste ; un test avance l'horloge et le vérifie.
- Une invocation sans organisation, capacité ou auteur est refusée.

#### FR-18 : L'équité des scores sur une personne

Pour **tout score ou toute recommandation qui porte sur une personne** (un client, un emprunteur, un assuré, un prospect), le client déclare une **liste fermée de variables autorisées** ; les **variables interdites** (par exemple l'origine, la religion, l'appartenance politique, la santé pour un crédit) et leurs **variables proxy** sont listées et **refusées** à l'entraînement et à l'inférence. Un **suivi d'équité mensuel** compare les taux de propositions favorables et les erreurs par sous-groupe (par exemple sexe, âge, zone, activité) ; un écart au-delà du seuil (IA-P11) ouvre une alerte au responsable et **bloque la promotion** d'un challenger (FR-6). Les **tests d'équité** se font **avant** la mise en service et à chaque promotion. `[ASSUMPTION : la liste des variables interdites et proxy est fixée par le juriste et le PO à la relecture ; la valeur par défaut IA-P11 est une recommandation]`

**Conséquences (testables) :**
- Une variable hors liste autorisée dans l'entrée d'un score est **refusée** par le serveur avec un code nommé ; un test en injecte une et obtient le refus.
- Un test introduit une variable proxy (un code de quartier fortement corrélé à une variable interdite) : le contrôle d'équité de l'entraînement la signale.
- Le rapport d'équité mensuel existe pour chaque capacité qui note une personne, par sous-groupe ; un test en génère un sur un jeu de démonstration.
- Un challenger qui dégrade l'équité d'un sous-groupe au-delà de IA-P11 n'est pas promu.

#### FR-19 : La classification des données de santé

Toute **donnée de santé** (pièces médicales, texte médical lu par l'OCR, antécédents, expertise médicale) est **classée sensible** à l'entrée dans le système, et cette classe **suit la donnée** dans l'IA : **aucune donnée de santé** n'est envoyée à un modèle hors de l'instance (y compris à une passerelle), **aucune** n'est dans le niveau d'export « apprentissage » (même anonymisée) ; la capacité de lecture d'une pièce médicale tourne **en instance** ; le rôle d'accueil ou de numérisation voit qu'une pièce médicale est reçue, **jamais son contenu**. Un texte lu par OCR est classé sensible dès que son type de pièce l'est.

**Conséquences (testables) :**
- Un test inspecte tout envoi sortant (passerelle, centrale, journal d'export) : aucune donnée de santé, même hachée ou agrégée sur moins de IA-P04 personnes.
- Un test dépose une pièce médicale : le rôle d'accueil voit « pièce médicale reçue » et ne peut pas en lire le contenu, l'extrait ni la miniature.
- Une capacité de langage dont l'entrée contient une donnée classée sensible est routée vers le **modèle local** ou refusée, jamais vers la passerelle externe.
- Un test de mutation retire la classification d'un type de pièce : la CI échoue.

#### FR-20 : Une capacité peut être interdite de proposer un montant sur un objet

Le principe « **jamais de montant corporel** » de l'assurance est **généralisé** : au catalogue, une capacité peut être **déclarée interdite de proposer un montant** (valeur, fourchette, médiane de comparables, offre suggérée, écart en pourcentage) sur un **objet déclaré** (par exemple un dossier d'assurance de volet corporel). Le serveur **refuse** la demande avec un code nommé ; un **filtre par volet** s'applique à **chaque écran** (fiche, comparaison, écart à la provision, fiche de décision, tableau de bord), pas seulement à chaque capacité. Le calcul reste **humain**, poste par poste ; l'IA peut **restituer le calcul saisi par l'humain** et l'expliquer. La déclaration d'interdiction est versionnée et portée par la verticale ; l'IA commune applique.

**Conséquences (testables) :**
- Sur un objet déclaré corporel, un test appelle **chaque** capacité d'estimation (comparables, « pourquoi ce montant », orientation, simulation) : aucune ne rend de montant, de fourchette ni de médiane ; le serveur rend le code nommé.
- Le filtre est testé **par écran** : la fiche, la comparaison, l'écart à la provision, la fiche de décision et le tableau de bord ouvrent chacun un objet corporel et n'y montrent ni médiane, ni comparable, ni écart en pourcentage.
- Une capacité nouvelle appelée sur un objet interdit sans que la verticale ait déclaré d'exception est **refusée par défaut** (le défaut est le régime le plus strict).
- Le Copilot, interrogé sur un montant d'un objet interdit, répond qu'il ne propose pas de montant et restitue le calcul de l'humain s'il existe.

#### FR-21 : Les droits de l'utilisateur sur ce que l'IA lui propose

Tout utilisateur dispose de quatre droits, dans tous les logiciels : **voir pourquoi** (provenance et explication, FR-16) ; **écarter** une proposition sans conséquence pour lui (le rejet d'une **extraction** peut être sans motif) ; **corriger** une proposition (statut `MODIFIEE`, écart enregistré) ; **couper** l'affichage de l'IA pour lui-même (le parcours avance, FR-15). Un **responsable** peut couper une capacité pour son périmètre, l'**interrupteur général** de l'organisation coupe tout. Un utilisateur qui s'écarte d'une **recommandation** écrit un **motif** ; l'écart et le motif sont renvoyés comme correction à l'apprentissage (FR-6).

**Conséquences (testables) :**
- Un test rejette une extraction sans motif : accepté ; rejette une recommandation sans motif : refusé.
- Un test coupe l'IA pour un utilisateur : ses écrans n'affichent plus de proposition et les autres utilisateurs ne sont pas touchés.
- Un test coupe une capacité pour un périmètre : les propositions de cette capacité n'apparaissent plus pour ce périmètre ; les autres capacités continuent.
- L'écart d'un rejet motivé apparaît dans le rapport de la capacité (FR-6).

#### FR-22 : Le droit d'observation et d'opposition de la personne concernée

Quand l'IA a **contribué** à une décision qui touche une personne (crédit, sinistre, garantie, recouvrement), l'institution outille le **droit de présenter ses observations** (loi n° 2019-014, art. 27, lecture du PRD) : l'utilisateur métier **saisit** les observations de la personne avant la décision, et elles sont **conservées avec le dossier** (IA-P13) et visibles de l'humain qui décide. Si la personne **s'oppose** à un profilage, l'institution l'enregistre : l'IA ne calcule plus de score sur elle à partir de cette date, l'humain instruit sans score. Le délégué à la protection des données (DPD) peut **retrouver** toutes les propositions qui portent sur une personne, avec leur provenance.

**Conséquences (testables) :**
- Une décision d'un type `JURIDIQUE_OU_FINANCIER` qui s'appuie sur une proposition de l'IA ne se **valide pas** si le champ « observations de la personne » n'a été ni saisi ni explicitement marqué « personne non joignable » (avec motif).
- Une opposition enregistrée : un test demande le score de cette personne : l'IA répond « profilage refusé » ; le parcours avance sur l'analyse humaine.
- Un test de recherche par le DPD sur une personne retrouve toutes les propositions la concernant et leur provenance, sans exposer d'autres personnes.
- Les observations sont conservées pendant IA-P13 ; une purge anticipée est refusée.

#### FR-23 : Le journal des accès

Chaque **consultation** d'une proposition, d'une entrée du registre ou d'un résultat de Copilot est inscrite au **journal des accès** : qui, quand, quoi, depuis quel rôle, pour quelle raison déclarée si l'accès est exceptionnel. Le journal est lisible par l'auditeur et le DPD, **inaltérable**, **conservé** pendant IA-P06. Un accès à une donnée classée sensible (FR-19) est journalisé **avec la raison**. Un accès exceptionnel (par exemple le DSI qui ouvre le contenu d'une proposition) demande une **ouverture tracée** et un motif.

**Conséquences (testables) :**
- Chaque lecture d'une proposition dans le registre produit une entrée du journal des accès ; un test compare le nombre de lectures au nombre d'entrées.
- Un accès à une donnée sensible sans raison est refusé.
- Le journal ne peut être modifié par aucun rôle ; un test le tente avec les droits du DSI et de l'auditeur et échoue.
- Un accès exceptionnel du DSI produit une entrée avec motif et déclenche une notification à l'auditeur.

#### FR-24 : Règle avant « IA » : le mot juste

Le mot **« IA »** ne s'affiche que pour une proposition de niveau **N1** (modèle commun) ou **N2** (modèle ou calibration propre au client) **ou** d'origine `LANGAGE`. Une proposition de niveau **N0** se présente comme **« règle »**. Tant qu'aucun modèle n'existe pour une capacité, **des règles explicables servent la capacité, et l'écran le dit**. Une bascule de N0 à N1 ou N2 se fait capacité par capacité, **quand l'évaluation la justifie** (FR-6), jamais en bloc. Le client voit à tout moment, par capacité, le niveau en service.

**Conséquences (testables) :**
- Un test scanne toutes les chaînes affichées d'une proposition de niveau N0 : aucune ne contient « IA », « intelligence artificielle » ni « modèle ».
- Chaque proposition affiche son niveau ; un test retire le niveau d'une proposition et vérifie qu'elle n'est pas affichée.
- Une bascule de capacité de N0 à N1 sans évaluation favorable est refusée avec le motif.
- La page « Mes capacités » liste, pour chaque capacité, son niveau, sa version et sa date de mise en service.

#### FR-25 : Les droits viennent de l'utilisateur, jamais de l'IA

L'IA **n'a aucun droit propre** : elle ne voit que ce que **l'utilisateur qui l'appelle** a le droit de voir, dans **son organisation** et dans **sa portée** (dossier, agence, point de vente). Il n'existe **aucun super-droit**. Un objet hors portée rend `404`, jamais `403`. L'**isolation par organisation** est stricte, en ligne comme en local ; une capacité automatique (travail planifié) s'exécute avec les droits du **responsable de la règle**, pas ceux d'un compte d'administration.

**Conséquences (testables) :**
- Un test interroge le Copilot avec deux comptes de portées différentes : chacun ne reçoit que ses données ; une question sur une donnée hors portée rend « je n'ai pas accès », sans fuite d'existence.
- Une requête avec un `organisationId` qui n'est pas celui du jeton est refusée ; un test en ligne vérifie l'étanchéité entre deux organisations de test.
- Un travail planifié sous le compte d'une règle dont le responsable a perdu son droit s'arrête et notifie.

#### FR-26 : Le déterministe fait foi, l'IA n'invente aucun chiffre officiel

L'IA **ne calcule aucun chiffre officiel** (bilan, impôt, provision réglementaire, solde, prime, intérêts) : c'est le moteur **déterministe** du logiciel concerné qui fait foi. Quand l'IA cite un tel chiffre, elle le **lit** dans le moteur et le **cite avec sa source** ; si l'IA propose un chiffre et que le moteur recalcule autrement, **l'écart est restitué** à celui qui a décidé et compté comme défaut de qualité de la capacité. Une prévision ou une estimation est présentée comme telle, jamais comme un chiffre officiel.

**Conséquences (testables) :**
- Un test demande au Copilot le solde d'un compte : la réponse porte le chiffre du moteur et sa source ; un test modifie le moteur et vérifie que la réponse suit.
- Un écart entre un impact annoncé et recalculé est restitué dans 100 % des cas et agrégé par capacité.
- Aucune capacité ne peut **écrire** dans une donnée officielle : un test inspecte les droits et n'y trouve que des écritures de propositions.

#### FR-27 : Pas de validation de façade

Une validation qui n'est qu'un clic est **pire qu'aucune validation**. L'IA mesure donc : le **taux d'acceptation** d'une capacité (au-delà de IA-P02 sur la fenêtre, une alerte « validation de façade » est levée au responsable et à l'auditeur) ; le **taux de motifs identiques à la proposition** (au-delà de IA-P08, signalé à l'auditeur). Un **motif proposé par l'IA** n'est jamais repris par un clic seul : c'est un texte que l'humain relit et modifie ; il est **interdit** pour les décisions au-dessus du seuil du responsable. Un **signal** (fraude, anomalie) n'est pas une accusation : il ouvre une **revue humaine**.

**Conséquences (testables) :**
- Un motif proposé par l'IA, validé par un clic seul, est refusé ; au-dessus du seuil du responsable, un motif proposé par l'IA est refusé.
- Une capacité dont le taux d'acceptation dépasse IA-P02 sur la fenêtre lève une alerte visible du responsable ; un test simule 95 % d'acceptation.
- Le rapport d'audit affiche, par capacité, le taux de motifs identiques à la proposition.
- Un signal de fraude ne bloque aucun paiement par lui-même : la décision de suspendre est une règle de garde-fou du logiciel, appliquée à la revue.

#### FR-28 : Revue juridique avant le score de crédit et d'assurance

Aucun **score de crédit** et aucune **évaluation de risque d'assurance sur une personne** n'est **mis en service** chez un client sans une **revue juridique obligatoire** : textes sur les décisions automatisées du pays du client (le texte togolais est lu ; les textes sénégalais et ivoirien ne le sont pas), régime des transferts de données personnelles (loi 2019-014, art. 28 à 31 : lu ; leur application à l'envoi d'une invite vers un modèle de langage hors de la zone est **un point ouvert** que le juriste tranche), exigences du régulateur de microfinance, de la banque centrale et de l'assurance. Par anticipation, ces scores sont traités comme « **à haut risque** » au sens de la référence européenne (évaluation de solvabilité, tarification d'assurance vie et santé) : test d'équité avant mise en service, documentation, analyse d'impact, supervision humaine. **Référence de bonne pratique, pas obligation hors de l'Union.** `[ASSUMPTION : le traitement « haut risque » par anticipation est une recommandation de ce PRD, à valider par le juriste]`

**Conséquences (testables) :**
- Le module de score de crédit d'une instance ne s'active que si un **dossier de revue juridique** est joint au contrat (date, juriste, périmètre) ; un test tente l'activation sans lui et échoue.
- La décision automatique (crédit, sinistre) est non activable tant que ce dossier ne l'autorise pas explicitement (FR-13).
- Un test vérifie que les tests d'équité ont été joués avant la mise en service et que leur rapport est archivé.

#### FR-29 : Ne jamais promettre plus que ce qui est vrai

Aucune communication, aucun contrat, aucun écran ne promet « **vos données ne servent jamais à entraîner** » sans le **qualifier** : ce que Money Vibes entraîne (le modèle commun, à partir d'écarts agrégés et anonymisés sous la finalité consentie), ce qu'elle n'entraîne **jamais** (le modèle d'un client avec les données d'un autre, un modèle de langage externe), et ce qui reste **vrai après un retrait de consentement** (un modèle déjà publié n'est pas « désentraîné » ; l'usage futur s'arrête). Un **envoi vers un modèle de langage externe** n'est **jamais un défaut** : activé par organisation, par la passerelle, avec masquage, journal de chaque envoi et aucune rétention contractuelle ; le **point ouvert** est de savoir si un tel envoi est un « transfert » au sens de la loi togolaise (art. 28 à 31 : lus), **à trancher par le juriste**. Le mot « **différentielle** » (confidentialité) n'est employé qu'avec un **budget de confidentialité tracé** ; il ne l'est pas au premier jour.

**Conséquences (testables) :**
- Un contrôle de contenu des écrans, contrats types et pages commerciales cherche « ne servent jamais » sans qualification et n'en trouve aucun.
- Une organisation sans activation explicite de la passerelle n'envoie rien vers un modèle externe ; un test le vérifie sur une instance neuve.
- Chaque envoi par la passerelle figure au journal avec sa date, sa capacité et sa taille ; un test compare le nombre d'envois aux entrées du journal.
- Aucun écran ni document n'emploie « différentielle » tant qu'aucun budget de confidentialité n'est tracé.

---

## 5. Une seule IA, en ligne et en local

Prospera n'a qu'une IA. Le cabinet d'expert-comptable, le distributeur, la microfinance et l'assurance la consomment ; aucun ne fabrique la sienne. Cette section dit **où elle tourne** et **ce qu'elle ne fait jamais**. Les chiffres cités sont des paramètres (annexe D, `params-w2.md`) ; les choix d'outils sont dans `addendum-w2.md`.

Deux mots à fixer. **En ligne** : l'organisation est hébergée par Money Vibes (cabinet, distributeur) et l'IA tourne sur la plateforme. **En local** : l'organisation a son instance sur ses propres serveurs (microfinance, assurance) et l'IA tourne **dans cette instance**. Le « service » est `prospera-ia-service` (port 3417), avec les modules `ia`, `assistant` et `automatisations` ; la « centrale de l'IA » est `prospera-ia-centrale`, qui tourne **seulement chez Money Vibes** (plan, D2).

#### FR-30 : Un seul code, deux façons de tourner

L'IA commune est **un seul code**, livré par la même ligne de version que le reste de la plateforme. En ligne, elle sert plusieurs organisations dans un même service ; en local, elle sert l'organisation de l'instance. Les deux profils ne diffèrent que par les points de la liste fermée ci-dessous ; tout autre écart de comportement est un défaut. Liste fermée : (1) l'isolation (FR-31 en ligne ; une seule organisation en local) ; (2) la source du modèle de langage (FR-33 en ligne ; FR-35 en local) ; (3) la source des droits et de l'échéance, qui est celle de la plateforme (moteur AD-19) ; (4) l'absence de gel en ligne (FR-85) ; (5) le transport des modèles (FR-84) ; (6) la garde du registre des consentements (FR-88 en ligne ; l'agent en local) ; (7) la copie hors machine de la calibration (FR-87).

**Conséquences (testables) :**
- Une même suite de tests de contrat (demande de proposition, réponse, refus nommés) est jouée **à l'identique** contre le profil en ligne et contre le profil en local ; un écart de réponse fait échouer la recette.
- Une recherche automatique dans le code ne trouve **aucune branche** « en ligne » ou « en local » en dehors des sept points ci-dessus.
- Il n'existe **aucune variante d'IA par client** : une différence entre deux clients passe par les **paramètres** et la **calibration** (FR-59), jamais par du code.
- La même image du service démarre dans les deux profils, la différence étant la configuration signée de l'état voulu.

#### FR-31 : En ligne, une organisation ne voit jamais l'IA d'une autre

En ligne, tout ce que l'IA tient (propositions, calibration, journal, files d'inférence, indicateurs) appartient à **une organisation** : la route porte l'`organisationId` du jeton, et une route dont le chemin porte une autre organisation est refusée (`ORGANISATION_HORS_JETON`). Aucun chemin de lecture ne regroupe deux organisations côté service ; **seule la centrale** (§7, §8) agrège, et seulement des écarts préparés au niveau « apprentissage » (FR-77). Un dossier hors de la portée de l'utilisateur rend 404, jamais 403.

**Conséquences (testables) :**
- Un test avec le jeton de l'organisation A sur une route de l'organisation B rend `ORGANISATION_HORS_JETON`, sans donnée ; un test sur un dossier hors portée rend 404.
- Un test de **fuite par le modèle** pose une phrase marqueur dans les données de A, demande à B une proposition proche : la phrase n'apparaît jamais dans la réponse, ni dans une explication, ni dans une source citée.
- Les files d'inférence (langage) répartissent le temps **à tour de rôle entre organisations** ; une organisation qui sature n'allonge pas le délai d'une autre de plus du paramètre `ia.iso_delai_max_pct`.
- Le quota d'inférence est **par organisation** et **ferme** : au-delà, `QUOTA_INFERENCE_DEPASSE` (429) et la capacité retombe sur la règle (FR-40).

#### FR-32 : En local, l'IA vit sous l'agent, sans port entrant

En local, l'IA tourne **sur le serveur de l'instance**, dans un projet démarré et surveillé par l'agent (moteur AD-10). Si le dimensionnement l'exige (FR-41), elle peut tourner sur une **machine à part, gérée par l'agent** : la machine à part n'est jamais livrée « hors agent » ; elle entre dans la sauvegarde, la supervision, l'horloge scellée et la chaîne de clés comme le reste de l'instance. L'IA n'ouvre **aucun port vers l'extérieur** et ne reçoit **rien en poussée** : elle ne parle qu'au reste de l'instance et, par l'agent, aux destinations déclarées de l'état voulu, dont le **tunnel de l'IA commune** (moteur AD-9, AD-44). L'IA **dépose** ses envois à l'agent ; elle n'a pas d'accès direct au canal.

**Conséquences (testables) :**
- Un balayage de ports sur le serveur de l'instance ne trouve **aucun port entrant** du service d'IA ouvert vers le réseau du client.
- Une tentative de connexion de l'IA vers un nom absent de `destinationsSortantes` est refusée et comptée comme anomalie.
- Le nom du tunnel de l'IA figure dans `destinationsSortantes` (nom, finalité, module) remise au DSI pour son pare-feu à l'installation ; le signal porte sa joignabilité (`OK` ou `INJOIGNABLE`, sans contenu).
- Sur une instance à deux machines, couper la machine de l'IA fait passer le voyant de l'instance à l'orange et **ne coupe aucun parcours** (FR-40) ; la restauration d'une sauvegarde la couvre (FR-87).
- `[ASSUMPTION : le placement « sur une machine à part » de la spine de l'assurance est retenu comme **dernier recours** de dimensionnement, géré par l'agent ; l'architecture dira comment l'agent opère un second hôte (trou T-02 du moteur, reste ouvert côté spine).]`

#### FR-33 : En ligne, une passerelle unique vers les grands modèles de langage

Pour les capacités de langage (Copilot, rédaction, résumé), l'IA en ligne appelle les grands modèles **uniquement** par une **passerelle unique** de Money Vibes. Aucune capacité, aucun module ne parle à un fournisseur de modèle en direct. La passerelle : (1) **masque** ce qui est nominatif avant l'envoi (FR-34) ; (2) **journalise** chaque envoi (FR-34) ; (3) n'envoie qu'à des fournisseurs liés par un **accord interdisant l'entraînement** sur les échanges et **excluant toute rétention** chez eux ; (4) **choisit le modèle par capacité**, par configuration ; (5) **fige** modèle et version de gabarit sur chaque proposition. Changer de fournisseur ne change aucun code des capacités. L'envoi vers un fournisseur est **activé explicitement par organisation** ; sans activation, la capacité de langage se replie (FR-35).

**Conséquences (testables) :**
- Un test intercepte tout le trafic sortant du service : **tout appel à un fournisseur de modèle** passe par la passerelle ; un appel direct est impossible (le nom du fournisseur n'est joignable que depuis la passerelle).
- Une organisation sans activation obtient, pour une capacité de langage, une proposition de repli et la mention « Rédigé sans modèle de langage ».
- Une proposition de langage porte le modèle et la version de gabarit figés ; rejouer la demande avec la configuration d'origine rend la **même** provenance.
- Changer le modèle d'une capacité par configuration (sans livraison de code) change la provenance des propositions suivantes et laisse les anciennes intactes.
- Le **pays ou la région d'hébergement** du fournisseur est une donnée de la configuration de chaque modèle et figure dans le journal de la passerelle (FR-80).

#### FR-34 : La passerelle masque, journalise, ne laisse rien

Avant tout envoi à un fournisseur, la passerelle applique la **bibliothèque de masquage** de la plateforme : identifiants, noms, téléphones, pièces d'identité, adresses, positions précises, photos ; les montants et les dates utiles à la réponse sont gardés ; ce qui est masqué est rendu à l'utilisateur **à la réponse**, sur le service, jamais chez le fournisseur. Chaque envoi laisse une ligne au journal de la passerelle : organisation, capacité, utilisateur ou règle à l'origine, modèle, version, **taille et durée**, **empreinte du contenu masqué**, liste des types de champs masqués, décision (envoyé, refusé). Le journal ne contient **pas** le contenu envoyé en clair ; le contenu masqué est conservé le temps nécessaire à l'audit demandé, puis purgé (`ia.retention_contenu_passerelle_jours`).

**Conséquences (testables) :**
- Un jeu de prompts contenant un nom, un téléphone, une pièce d'identité et un texte libre est envoyé : l'envoi capturé **ne contient aucun** de ces éléments ; la réponse rendue à l'écran les recompose.
- Un test d'absence de ligne : un envoi sans ligne de journal est impossible (la passerelle refuse d'envoyer si l'écriture du journal échoue).
- Le journal est **en ajout seul** ; un envoi refusé (donnée classée santé, FR-36 ; organisation sans activation) y figure avec son motif.
- La passerelle expose, par organisation et par mois, le nombre d'envois, les types de champs masqués et les refus ; ces chiffres entrent dans le rapport mensuel (FR-71).
- `[ASSUMPTION : la précision de la réponse peut baisser quand le masquage est fort (constat des grands éditeurs) ; la recette mesure l'écart masqué contre non masqué sur un jeu synthétique et le consigne au rapport.]`

#### FR-35 : En local, un modèle ouvert sur le serveur du client, dimensionné au contrat, et un repli dit à l'écran

En local, les capacités de langage utilisent un **modèle ouvert exécuté sur le serveur du client** (ou sur la machine à part de FR-32), **dimensionné au contrat** : la classe de modèle se choisit parmi les paliers publiés (FR-41). Aucun envoi vers un fournisseur extérieur ne part d'une instance locale. Quand le serveur ne permet pas le modèle (matériel absent, mémoire insuffisante, modèle absent ou arrêté), les capacités de langage se **replient** sur des **gabarits** et des **modèles plus simples** et **le disent à l'écran** (« Rédigé sans modèle de langage : version simplifiée »). **Le produit reste utile sans modèle de langage** : règles, modèles classiques, gabarits.

**Conséquences (testables) :**
- Un test coupe le modèle de langage local : le service reste démarré, la route `sante` rend `DEGRADE` pour la capacité de langage, la capacité rend un gabarit avec la mention de repli, aucune erreur n'est affichée à l'utilisateur.
- Aucune requête sortante vers un fournisseur de modèle ne part d'une instance locale (test d'inspection du trafic, comme FR-32).
- Le modèle ouvert est un artefact signé de la ligne de modèles (FR-83) ; sa licence est vérifiée **modèle par modèle** à son entrée dans le catalogue (`ia.licence_modele_verifiee`) ; un modèle sans licence vérifiée n'entre pas au catalogue.
- Une instance dont le matériel est sous le palier le plus bas démarre en repli complet et l'indique à l'installation (écran « ce que votre serveur permet »).
- `[ASSUMPTION : classes de modèles et besoins de mémoire retenus comme paliers de départ — 8 Go de mémoire graphique pour la classe 7-8 milliards de paramètres, 24 Go pour la classe 27-35 milliards en quantification — d'après la recherche du 2026-11-13 (PROBABLE) ; à mesurer sur le matériel réel en recette. Le « vocal » n'est pas servi (hors périmètre, §0).]`

#### FR-36 : Rien de médical ne sort de l'instance

Une donnée classée **santé** par le registre de classification (versionné, épinglé au build, par module ; champ absent = schéma refusé en CI) n'est **jamais** : envoyée à un modèle hors de l'instance (donc jamais par la passerelle de FR-33), placée dans un écart, un indicateur, un export, un événement du bus, un journal ou un message. L'OCR et le classement d'une pièce médicale se font **sur l'instance locale** ; le texte OCR d'une pièce médicale est lui-même une donnée classée. L'IA charge le registre de classification et **refuse** toute entrée classée dans un flux sortant. Une capacité de langage qui doit traiter un contenu classé santé n'a que deux issues : un modèle **local** de l'instance, ou le repli de FR-35.

**Conséquences (testables) :**
- Un test envoie à la passerelle, en ligne, une demande dont l'un des champs est classé santé : refus nommé (`DONNEE_SANTE_HORS_INSTANCE`), ligne au journal avec le motif, **aucun** octet vers le fournisseur.
- Un test pose un champ classé santé dans un écart d'apprentissage : le lot est refusé à la préparation (FR-77) ; un test du schéma d'indicateurs montre qu'aucun champ ne peut porter un contenu médical.
- Un test ajoute un champ non classé à un module : la CI échoue (champ absent du registre de classification).
- Aucun écart n'est construit sur une pièce médicale : un test compte les écarts issus d'une pièce médicale dans le lot d'export : zéro.

#### FR-37 : Les modules métier déclarent les capacités qu'ils consomment

Un module métier **déclare** dans son manifeste (clause C11) les **capacités** qu'il consomme : code, version minimale, verticale, vocabulaire, entrées qu'il fournit, droits requis, finalités d'apprentissage éventuelles, interdictions de sortie (par exemple « jamais de montant corporel »). Le module n'appelle **jamais** un modèle ni ne code de règle de score : il demande une proposition par le **port unique** (contrat de proposition, §4). La demande porte les **paramètres** de la capacité (barème, seuils, listes) avec leur version : l'IA **ne les stocke pas** ; une proposition dont la version de paramètres diffère de la demande est refusée par le consommateur. Le noyau reste neutre ; **chaque capacité a un vocabulaire par verticale**, déclaré avec elle.

**Conséquences (testables) :**
- Un module qui demande une capacité **non déclarée** à son manifeste reçoit `CAPACITE_NON_DECLAREE` ; un test l'établit pour chaque capacité du catalogue (§10).
- Une recherche dans le code d'un module métier ne trouve **aucun appel direct** à un fournisseur de modèle, ni constante de barème de score (garde de balayage C6).
- Une proposition rendue avec une version de paramètres différente de celle de la demande est **refusée** par le consommateur, qui garde sa règle de base.
- Retirer un module de l'instance retire ses capacités du catalogue de l'instance ; les propositions déjà rendues restent lisibles au registre.
- Le catalogue des capacités d'une instance (code, version, niveau N0/N1/N2 en service) est **lisible** par le DSI et par le DG.

#### FR-38 : L'IA ne lit pas les bases des modules

L'IA **ne se connecte à la base d'aucun module**. Elle reçoit, de chaque demande, les **faits et les données préparées** que le module consommateur a choisis (« données utilisées »), et elle apprend d'événements et de faits **publiés** par les modules (fait de réalité, FR-57). Pour l'entraînement, le Copilot et l'analyse sectorielle, qui lisent plus large, les lectures passent par un **compte de service dédié** et, sur la plateforme, par la **garde du registre des consentements** (FR-88). Le contexte envoyé à une capacité est **minimisé à la surface** : seul ce que la surface affiche ou utilise est transmis.

**Conséquences (testables) :**
- La liste des accès de l'IA (compte de service, droits, ports) ne comprend **aucune chaîne de connexion** à une base d'un module ; un test d'inspection de la configuration l'établit.
- Une demande dont les données utilisées contiennent un champ non déclaré par la capacité est refusée (`ENTREE_NON_DECLAREE`).
- Une lecture de l'IA sans consentement en vigueur sur la plateforme rend `CONSENTEMENT_ABSENT` (FR-88).
- Le **contexte brut** d'une demande de langage est purgé à l'échéance courte `ia.retention_contexte_brut_jours` ; la **trace opposable** (provenance, source, décision) est gardée plus longtemps (FR-89).
- `[ASSUMPTION : les noms des faits « prédiction » et « réalité » ne figurent dans aucun catalogue de faits aujourd'hui ; l'architecture doit les ajouter au catalogue des contrats nommés (trou T-12, partie contrat fermée en FR-57).]`

#### FR-39 : Chaque capacité tourne avec les droits de celui qui la demande

Une capacité servie à une personne ne lui fait voir **que ce qu'elle peut déjà voir** : le droit de l'utilisateur, le périmètre (agence, portefeuille, dossier, point de vente) et la portée de l'organisation s'appliquent à l'entrée **et** à la sortie. Il n'y a **aucun super-droit** de l'IA. Une exécution non interactive (rapport du soir, brief du matin, règle de l'automatisation) tourne avec les droits **du responsable de la règle** et le dit à la provenance. Le compte de service de l'IA ne peut que **lire** ce que l'organisation lui a ouvert et **écrire des propositions** ; il n'écrit rien dans un module.

**Conséquences (testables) :**
- Deux utilisateurs de droits différents posent la même question : les réponses diffèrent exactement des écarts de leurs droits ; aucune ligne hors périmètre n'apparaît, ni en chiffre, ni en source, ni en explication.
- Un test tente une écriture du compte de service vers un module : refusé ; le registre ne contient aucune écriture hors proposition.
- Le droit nécessaire pour demander une capacité est **déclaré** avec la capacité (FR-37) ; une demande sans ce droit est refusée par le serveur, même si l'écran ne montre pas le bouton.

#### FR-40 : L'IA n'est jamais bloquante

Si l'IA est absente, coupée ou en panne, **chaque parcours avance** sur la saisie humaine ou sur la règle de base du module. Un emplacement d'IA sans IA rend l'état `NON_INSTALLE` (module facultatif non installé) ou `INDISPONIBLE` (installé mais coupé) : un **état visible, jamais une erreur**, et distinct de « 0 » ou de « aucune alerte ». La panne d'une capacité est **contenue** par son emplacement : le reste de l'écran fonctionne. Une capacité dont le quota est épuisé, dont le modèle est absent ou dont la calibration est invalide retombe sur la **règle N0** (FR-53) et le dit.

**Conséquences (testables) :**
- Un test coupe l'IA (service arrêté, puis modèle seul arrêté) et rejoue **un parcours complet de chacun des quatre logiciels** : chaque parcours aboutit sur la saisie ou la règle de base.
- Les écrans montrent « indisponible » ou « non installé », distinctement ; un écran ne confond jamais l'indisponibilité avec un résultat vide.
- Aucun jeu de recette n'exige l'IA pour qu'un dossier, une facture, un crédit ou un sinistre puisse être clos.
- Le temps de réponse d'une capacité a un plafond (`ia.delai_reponse_max_s`) ; passé ce plafond, l'emplacement affiche « indisponible » et le parcours continue.

#### FR-41 : L'empreinte matérielle de l'IA est publiée et le dimensionnement est du devis

Money Vibes **publie** l'empreinte matérielle de l'IA commune par palier (calcul, mémoire, mémoire graphique éventuelle, disque, débit attendu, latence cible) pour que le **devis** puisse la chiffrer ; le client dimensionne et fournit ses serveurs (microfinance) ou les dimensionne au devis (assurance). Paliers : **P0** sans modèle de langage (règles, modèles classiques, gabarits) ; **P1** modèle de langage petit ; **P2** modèle de langage de classe intermédiaire. Chaque palier a un **budget de latence** et de débit par capacité, **tenu en recette** sur un jeu au volume représentatif.

**Conséquences (testables) :**
- Le catalogue de paliers (empreinte, capacités servies, capacités repliées) est publié et daté ; le devis d'une instance en cite un.
- La recette d'un palier prouve : latence p95 par capacité inférieure au plafond du palier, débit minimal tenu, **le service reste vivant** sous charge (le surplus attend ou se replie).
- Au démarrage, l'instance **mesure** le matériel et dit quel palier elle tient ; un écart entre le palier du contrat et le palier mesuré est un **écart nommé** du signal.
- `[ASSUMPTION : trois paliers P0-P1-P2 ; les valeurs d'empreinte sont des paramètres à fixer par mesure avant le premier devis (annexe D) ; le trou T-15 est fermé quant à l'obligation de publier, pas quant aux chiffres.]`

#### FR-42 : L'IA existe dans les deux espaces, une calibration par espace

Une organisation a un espace d'**essai** et un espace **réel** (moteur AD-15). L'IA existe dans les deux ; sa calibration est **par espace**. L'essai d'un prospect est cloisonné : il n'envoie **rien** vers la centrale de l'IA sans son consentement ; la calibration calculée dans l'essai est **recalculée** sur la reprise refaite à neuf s'il signe, et **effacée** s'il ne signe pas. Une calibration faite sur des données d'essai **masquées** n'est jamais promue dans le réel.

**Conséquences (testables) :**
- Aucun octet de l'essai d'un prospect ne part vers la centrale de l'IA sans consentement ; un test d'inspection du trafic l'établit.
- À la signature, la calibration d'essai n'est pas copiée vers l'espace réel : l'espace réel démarre en N0/N1 et recalibre sur ses propres écarts (FR-59).
- À l'abandon du prospect, la route d'effacement de l'IA (C13) supprime calibration, journal et propositions de l'essai ; la sauvegarde qui les contient expire à sa date (FR-87).
- Le **même** code d'IA répond dans l'essai et dans le réel ; seuls les secrets d'écriture du réel sont absents de l'essai.

#### FR-43 : L'IA est un module facultatif, installé par manifeste

L'IA est un **module facultatif** de l'installation : manifeste complet (C1 à C13) avec `ia: { modeles, finalites }`, droit `ia`, profil de déploiement, routes d'export, d'import, d'effacement et de vérification (C13), contrats nommés (C5), migrations additives (C12) et interrupteurs déclarés. Ne pas l'installer **ne casse rien** (FR-40). Un module qui a besoin d'une capacité sans que l'IA soit installée affiche l'état `NON_INSTALLE`. L'installation des trois modules `ia`, `assistant` et `automatisations` se décide séparément : `ia` est le socle, `assistant` et `automatisations` en dépendent.

**Conséquences (testables) :**
- Le test « installer sans l'IA, puis l'installer, puis la retirer » passe sur les quatre logiciels : aucune donnée d'un module n'est perdue, aucun parcours ne casse.
- Installer `assistant` sans `ia` est refusé (`MODULE_DEPENDANCE_MANQUANTE`).
- Les routes d'effacement et d'export de l'IA (C13) sont jouées par le test de conformité du contrat de module.
- La migration de l'IA est additive : « promouvoir, saisir, revenir » passe (moteur AD-33).

#### FR-44 : Aucune règle métier dans l'écran, l'IA se branche par emplacements

Les écrans n'embarquent **aucune logique** de score, d'explication ni de seuil : l'IA est servie par l'interface du service, et ses composants d'écran sont des **contributions d'emplacement** qui ne reçoivent que des identifiants et chargent leurs données par le service. Un emplacement a sa **frontière d'erreur** ; un emplacement vide est distinct de « 0 ».

**Conséquences (testables) :**
- Un balayage du code des fronts ne trouve aucun barème, seuil ou formule de score.
- Provoquer une erreur dans une contribution d'IA ne casse que son emplacement ; l'écran hôte reste utilisable (test d'erreur injectée).
- Le même composant d'IA fonctionne sur le web et sur le mobile sans règle dupliquée.

## 6. Les premières informations

Le PO veut que l'IA donne des informations utiles **dès le premier jour**, avant d'avoir appris quoi que ce soit chez le client. La réponse est une échelle à trois niveaux, **par capacité**, qui ne ment jamais sur ce qui répond.

| Niveau | Ce que c'est | Où il existe au jour 1 | Mot affiché |
|---|---|---|---|
| **N0** | **Règles expertes explicables**, livrées avec la capacité, paramétrées par pays et par verticale | **Partout**, pour toutes les capacités | « Règle » |
| **N1** | **Modèle commun** pré-entraîné par Money Vibes | **Là où il est prêt** (jamais avant son évaluation, FR-47) | « IA » |
| **N2** | **Calibration ou modèle propre au client**, appris sur ses propres écarts | **Nulle part** : il naît quand le seuil mesuré de la capacité est atteint (FR-48) | « IA (calibrée sur vos données) » |

#### FR-45 : Trois niveaux par capacité, jamais confondus

Chaque capacité du catalogue (§10) existe aux niveaux N0, N1 et N2, **chacun avec le même contrat de proposition** : l'origine rendue est `REGLE` pour N0 et `MODELE` pour N1 et N2 (ou `LANGAGE` pour un modèle de langage). Une capacité sert **un seul niveau à la fois** pour une même demande : le plus élevé que sa fiche autorise et que son évaluation justifie (FR-52). L'écran n'emploie le mot « IA » que pour N1, N2 et `LANGAGE` ; N0 se présente comme « règle ».

**Conséquences (testables) :**
- Pour chaque capacité, un test demande une proposition à chaque niveau et vérifie `origine`, `version` et `niveau` dans la réponse ; une capacité qui n'a pas de N0 n'entre pas au catalogue.
- Aucun écran n'affiche « IA » pour une origine `REGLE` (balayage des textes et test d'écran).
- Le niveau servi et la version de la règle ou du modèle sont **toujours** dans la provenance de la proposition.

#### FR-46 : N0, des règles expertes livrées et paramétrées par pays et par verticale

Le niveau N0 est un ensemble de **règles déterministes explicables** : score à facteurs, seuils, listes, tendances par moyenne glissante, gabarits de texte. Elles sont livrées avec la capacité, **toujours présentes**, et servent de **repli** et de **garde-fou** (FR-53). Leurs valeurs modifiables (barèmes, seuils, listes) sont des **paramètres** fournis par le module consommateur (FR-37), versionnés avec lui ; chaque verticale et chaque pays a son jeu de départ (le barème d'un score de microfinance, la santé d'un point de vente, les règles d'une pièce d'assurance). Une règle ne code **aucune valeur réglementaire** : plafond d'usure, seuils CIMA ou ratios légaux viennent des référentiels du module, jamais d'un modèle ni du code de l'IA.

**Conséquences (testables) :**
- Une règle N0 modifiée par paramètre (sans livraison de code) change la proposition suivante et sa `parametresVersion` ; l'ancienne proposition garde l'ancienne version.
- Un test de chaque capacité prouve que **chaque facteur** de la règle est restitué avec son poids et sa contribution (explication, §10).
- Un balayage du code de l'IA ne trouve aucune valeur réglementaire écrite en dur.
- Les jeux de départ par pays et par verticale sont **listés** à l'annexe D ; ajouter un pays n'exige pas de modifier le code d'une règle.

#### FR-47 : N1, un modèle commun pré-entraîné, jamais sur les données d'un client sans sa finalité

Un modèle N1 est entraîné par Money Vibes à partir de **sources publiques**, de **données synthétiques**, de **données de démonstration**, puis, à mesure qu'elles existent, de l'**apprentissage commun** consenti (§7, §8). **Jamais sur les données d'un client sans sa finalité consentie** (FR-76). Un N1 n'est servi que s'il a passé son **évaluation** : il bat le N0 de la même capacité sur le jeu d'évaluation de la capacité, sans régression d'équité (FR-69, FR-70). Une capacité sans N1 prêt reste servie au niveau N0 : **ce n'est pas un défaut**, c'est dit à l'écran.

**Conséquences (testables) :**
- La fiche de chaque capacité dit : N1 existant ou non, version, jeu d'évaluation, résultat contre N0 ; une capacité servie en N1 sans évaluation consignée est refusée à la publication.
- Le jour 1, la liste « niveau servi par capacité » d'une instance est lisible : N0 pour les unes, N1 pour les autres.
- Un test d'appartenance vérifie qu'aucun enregistrement d'un client sans finalité consentie ne figure dans la composition d'un N1 (FR-81).
- `[ASSUMPTION : le premier modèle commun réellement entraîné sur de l'apprentissage commun n'est pas attendu avant le deuxième semestre 2027 (réserve du moteur) ; au premier jour, un N1 éventuel vient de données publiques, synthétiques ou de démonstration.]`

#### FR-48 : N2, la calibration ou le modèle propre au client, au seuil mesuré par capacité

Une calibration ou un modèle **propre à l'organisation** (N2) n'est créé et servi que lorsque **trois conditions** sont réunies pour la capacité : (1) un **volume minimal d'écarts** consolidés (FR-57) ; (2) une **durée minimale** d'observation ; (3) le candidat N2 **bat le niveau en place** sur un jeu de validation **tiré des écarts de l'organisation** (FR-69). Ces valeurs sont **par capacité**, dans sa fiche, et non un seuil unique de plateforme. Tant que l'une manque, la capacité reste au niveau en place et l'écran affiche ce qui manque (« 12 sur 200 dossiers observés »).

**Conséquences (testables) :**
- Une capacité dont les trois conditions ne sont pas toutes vraies ne sert jamais N2 ; un test les fait varier condition par condition.
- Le seuil de chaque capacité est une **donnée** de sa fiche (annexe D), pas une constante de code ; une valeur non renseignée empêche la capacité d'entrer au catalogue.
- Un N2 qui perd contre le niveau en place à une évaluation ultérieure est **retiré** et la capacité retombe au niveau précédent (FR-53), avec une ligne au journal.
- `[ASSUMPTION : aucun seuil publié « règle vers modèle » n'existe ; les valeurs sont posées par capacité à l'écriture des fiches (§10) et mesurées à la recette.]`

#### FR-49 : Ce que chaque proposition dit de son niveau

Toute proposition affiche : le niveau (« règle », « modèle commun », « modèle calibré sur vos données »), la **version**, la **date**, les **facteurs** principaux, la **confiance** exposée et les **sources**. Sous le seuil de confiance de la capacité (`ia.confiance_min`, par capacité), l'IA **dit qu'elle ne sait pas** ou propose seulement (FR-54). L'indice de confiance est **exposé** ; il **n'entre dans aucune décision** et n'ouvre aucune autonomie.

**Conséquences (testables) :**
- Un test de chaque écran qui affiche une proposition retrouve niveau, version, date, facteurs, confiance et sources ; une proposition sans provenance n'est pas affichée comme un fait.
- Aucune règle de l'automatisation ne lit l'indice de confiance (balayage de la grammaire des règles).
- Une proposition sans source n'est pas affichée comme acceptable (`NON_SOURCEE` visible).

#### FR-50 : Ce que chaque logiciel voit au premier jour

| Logiciel | Au jour 1 | Ce qu'il ne voit pas encore |
|---|---|---|
| **Cabinet d'expert-comptable** | N0 sur toutes les capacités qu'il déclare (contrôles, rapprochements, explications, leviers fiscaux avec base légale citée) ; **Copilot en texte, lecture seule**, ancré sur le corpus légal ; lecture et classement de pièces par N0 et OCR | Modèle propre (N2) ; voix ; vision de documents |
| **Distributeur** | N0 sur les scores (santé d'un point de vente, fournisseur, relances), prévisions par règle (3 mois, saisonnalité à partir de 12 mois), brief et rapport par gabarit ; Copilot texte lecture seule | Modèle de demande ; routage réel ; voix |
| **Microfinance** | N0 sur le score de crédit (barème de la verticale), la probabilité de paiement et les relances, la détection d'anomalie par règles, la prévision du PAR par tendance ; Copilot texte lecture seule pour les 16 rôles | Modèle de risque N1 ou N2 ; reconnaissance vocale ; langues locales |
| **Assurance** | N0 sur l'orientation d'expertise, la fraude à neuf signaux, la qualité de dossier, le contrôle de cohérence ; lecture de pièces par OCR et classement sur l'instance ; Copilot texte lecture seule | Modèle de fraude N1 ou N2 ; chatbot de l'assuré ; voix |

`[ASSUMPTION : le Copilot est au premier jour pour les quatre logiciels, en texte et en lecture seule (décision D12 du plan) ; le PRD distributeur le mettait « bientôt », ce PRD l'amende.]`

**Conséquences (testables) :**
- Pour chaque logiciel, la liste « niveau servi par capacité » du jour 1 est produite par l'instance et correspond au tableau ci-dessus ; un écart est un défaut de recette.
- Un test **sans aucun historique** (instance neuve) obtient, pour chaque capacité installée, une proposition utile en N0 ; aucune capacité ne répond « données insuffisantes » faute d'historique alors qu'une règle N0 peut répondre.
- Les capacités marquées « pas encore » apparaissent comme **« bientôt »**, jamais comme un bouton simulé.

#### FR-51 : Les règles amorcent l'apprentissage

Les décisions de N0 servent d'**étiquette initiale** : l'écart entre ce que N0 propose et ce que l'humain décide (FR-56) est la première matière d'un N2, et les règles étiquettent les données synthétiques du N1. Un modèle appris ainsi ne remplace pas la règle qui l'a amorcé : la règle reste le repli (FR-53).

**Conséquences (testables) :**
- Tout modèle N1 ou N2 déclare dans sa fiche la source de ses étiquettes (humaines, règle, synthétiques) ; un modèle sans cette déclaration n'est pas publié.
- Un cas où règle et humain divergent est rejoué : la divergence entre dans les écarts avec les deux valeurs.

#### FR-52 : Qui décide le passage d'un niveau à l'autre, et comment il s'affiche

Le passage d'un niveau à l'autre se fait **capacité par capacité**, par **évaluation** et jamais par calendrier. **En local**, la décision de N2 est prise **par l'instance** sur ses propres écarts ; l'arrivée d'un N1 suit le plan de promotion (FR-64). **En ligne**, elle est prise **par Money Vibes** pour N1 (plan de promotion) et **par le service** pour le N2 de chaque organisation. Chaque passage laisse une ligne au journal (capacité, niveau avant et après, raison, résultat de l'évaluation) et un **message en langage simple** au responsable de la capacité (« Le score des relances est désormais calibré sur vos 1 250 dossiers : +8 points de rappel »). Le passage d'une capacité **qui touche une personne** (score de crédit, de sinistre) à un niveau supérieur est un **changement visible** : il suit un interrupteur (FR-66).

**Conséquences (testables) :**
- Le journal des passages de niveau est consultable par capacité et par date ; un passage sans ligne est impossible.
- Un passage de niveau sans évaluation consignée est refusé (test forcé).
- Un passage de niveau sur une capacité de score d'une personne n'est effectif qu'après l'allumage de l'interrupteur (en ligne) ou à la date du DSI (en local).

#### FR-53 : La règle N0 est toujours le repli

À tout moment, l'IA peut **retomber au niveau inférieur** : modèle absent, calibration invalide, quota épuisé, empreinte de calibration discordante, dérive jugée grave (FR-73), N2 qui perd son évaluation. Le repli est **automatique** et **visible** : l'écran dit « Règle de base : le modèle est indisponible ». La règle N0 reste exécutable à tout moment, **sans réseau et sans modèle**.

**Conséquences (testables) :**
- Un test supprime le modèle de chaque capacité à tour de rôle : la capacité répond en N0 ; un test supprime la calibration : même résultat.
- Le repli est inscrit au registre (niveau servi, raison) ; il apparaît dans le rapport mensuel (FR-71).
- Un test coupe le réseau d'une instance locale pendant 60 jours : toutes les capacités répondent, au dernier niveau valide connu.

#### FR-54 : Sous le seuil, l'IA dit qu'elle ne sait pas

Quand la confiance est sous le seuil de la capacité, quand l'entrée est hors du domaine d'apprentissage ou quand la source manque, l'IA répond « **je n'ai pas de réponse fiable** » et, si une règle N0 existe, la propose **étiquetée règle**. Elle n'invente jamais une explication, une source ou un chiffre.

**Conséquences (testables) :**
- Un jeu de questions **hors corpus** donne 100 % de réponses « sans réponse fiable » ou « non sourcée ».
- Un jeu d'entrées hors domaine (devise inconnue, secteur absent du référentiel) ne produit ni score ni prévision, mais l'état « non mesuré ».

#### FR-55 : Les jeux de référence datés voyagent avec l'IA

Certaines capacités ont besoin de **jeux de référence datés** (indices de prix, inflation, calendrier agricole, nomenclature des secteurs, corpus légal par pays et par année). Ces jeux sont **versionnés**, **signés** et **mis à jour sans mise à jour de code** : par le même chemin que les modèles, réseau ou fichier (FR-84). Chaque jeu porte sa **date** ; une source de plus de `ia.age_max_source_jours` jours est signalée « ancienne » à l'écran. Une instance coupée garde son dernier jeu et **le dit**.

**Conséquences (testables) :**
- Un jeu signé par une clé dont l'usage ne le couvre pas est refusé entier ; un jeu modifié après signature est refusé.
- Une analyse sectorielle appuyée sur un indice daté de plus de 90 jours porte la mention « source ancienne ».
- Une instance locale installe un jeu par fichier et par le tunnel : le contenu et la version installés sont **identiques**.
- `[ASSUMPTION : le canal des jeux de référence suit celui des modèles (FR-83, FR-84) ; la source de repli « données agrégées de Pulse » est de l'horizon (§13). Le trou T-13 est fermé quant au canal, pas quant au contenu des jeux.]`

## 7. Apprendre en continu et se mettre à jour

Le PO veut une IA qui **continue d'apprendre** et **se met à jour** pour atteindre ses objectifs. Deux boucles le font, qui ne se mélangent pas.

| | Boucle locale | Boucle commune |
|---|---|---|
| Rythme | **Continue** (chaque nuit) | **Périodique** (ligne de modèles, au plus hebdomadaire) |
| Où | Dans l'instance ou l'espace de l'organisation | Chez Money Vibes (`prospera-ia-centrale`) |
| Ce qu'elle lit | Les écarts de l'organisation, **sur place** | Des écarts **agrégés, anonymisés**, au niveau « apprentissage » (§8) |
| Ce qu'elle produit | Une **calibration** (donnée du client) | Un **modèle commun** signé (code de Money Vibes) |
| Qui peut l'arrêter | L'organisation (retour à la calibration précédente) | Money Vibes (retour arrière), le DSI (date) |
| Sans contact | **Continue** | S'arrête pour cette instance (rien ne remonte, rien ne descend) |

### 7.1 La boucle locale

#### FR-56 : Chaque proposition laisse un écart

Pour chaque proposition, l'IA enregistre, sur l'instance (ou dans l'espace de l'organisation en ligne), l'**écart** entre ce qu'elle a proposé et ce qui s'est passé : décision humaine (acceptée, modifiée, rejetée, expirée), valeur finalement retenue, et **réalité constatée** quand elle arrive (FR-57). L'écart cite la proposition (identifiant, capacité, niveau, version), la décision et son motif **codé** (FR-58), jamais la proposition elle-même en clair. Le **journal des prédictions et des corrections** ainsi tenu est une donnée de l'organisation, **hors de la migration** de promotion, sauvegardé avec les données (FR-87).

**Conséquences (testables) :**
- Pour chaque proposition acceptée, modifiée, rejetée ou expirée, il existe **exactement un** écart ; un test compare propositions et écarts.
- Un écart est **immuable** hors de l'ajout de la réalité constatée (une seule fois) ; une seconde écriture est refusée.
- Aucun écart ne contient de texte libre : le motif est codé (FR-58).
- Le journal est lisible par la version précédente du code (N et N-1, moteur AD-33) ; « promouvoir, saisir, revenir » passe.

#### FR-57 : Les faits de réalité viennent des modules, par des faits nommés

Pour qu'un écart ait une « réalité », le module qui sait ce qui s'est passé **publie un fait nommé** au catalogue des contrats (C5) : « le client a payé à l'échéance », « le dossier est devenu en retard de 30 jours », « le sinistre a été réglé pour tel montant », « la facture a été encaissée », « le point de vente a passé commande ». L'IA **s'abonne** à ces faits ; elle ne lit la base de personne (FR-38). Chaque capacité déclare **ses faits de réalité**, le **délai** après lequel la réalité est constatée (ex. 90 jours pour un impayé) et la **règle de rattachement** à la proposition. Le contrat des faits d'écart (prédiction, réalité) est un schéma versionné, testé **des deux côtés**.

**Conséquences (testables) :**
- Une capacité sans fait de réalité déclaré n'a pas de N2 possible : elle reste N0 ou N1 et la fiche le dit.
- Un fait de réalité rejoué (livraison au moins une fois) ne crée pas un second rattachement (idempotence par `eventId`).
- Un test de contrat joue le fait côté module et côté IA avec les mêmes vecteurs ; un champ non déclaré fait échouer le test.
- Le délai de constat est un paramètre de la capacité ; tant qu'il n'est pas échu, l'écart est « en attente de réalité » et **ne compte pas** dans l'évaluation.
- `[ASSUMPTION : les noms exacts des faits sont fixés par l'architecture ; le PRD fixe leur existence et leur propriétaire (le module qui sait). Ferme le trou T-12 pour la partie contrat.]`

#### FR-58 : Le motif d'un écart est codé, jamais libre

Quand un humain modifie ou rejette une proposition, le module lui demande un **motif** : une **valeur d'une liste fermée** propre à la capacité (par exemple « montant trop élevé », « information plus récente », « client connu », « autre »), plus, si le module le veut, un **commentaire libre pour l'humain** qui reste **dans le module** et n'est **jamais** lu par l'apprentissage ni exporté. La liste est **versionnée** avec la capacité. L'IA n'apprend que du code.

**Conséquences (testables) :**
- Un écart ne contient que le **code** du motif ; un test cherche du texte libre dans les écarts d'un jeu de 1 000 décisions : zéro.
- Un code hors liste est refusé par le module consommateur.
- Le commentaire libre est absent de tout lot d'export (FR-77) et de tout journal de la passerelle (FR-34).
- `[ASSUMPTION : ferme le trou T-06 sur le texte libre ; le motif libre « exigé » par certains PRD devient un commentaire gardé dans le module, le code étant exigé en plus.]`

#### FR-59 : Chaque nuit, une recalibration locale, bornée

Chaque nuit (heure paramétrée, hors des heures d'ouverture), l'IA **recalibre** chaque capacité qui a de nouveaux écarts échus : ajustement des pondérations, des seuils et des probabilités **à l'intérieur de bornes** fixées par la capacité (variation maximale par nuit, plage permise par paramètre, listes de variables autorisées inchangées). La recalibration n'utilise que les écarts **de l'organisation**, calculée **là où vivent les données**. Elle est **incrémentale** et reprend après une coupure ; elle ne consomme qu'une part bornée des ressources et **cède la place** à l'exploitation (`ia.recalibration_cpu_max_pct`). Elle **ne touche jamais** à la calibration **validée** de la capacité sans le contrôle de FR-60. Elle n'est pas une mise à jour : elle n'attend ni date du DSI ni fenêtre.

**Conséquences (testables) :**
- Après une nuit sans nouvel écart échu, la calibration est **inchangée** (même empreinte).
- Un test pousse un jeu d'écarts extrêmes : la calibration varie **au plus** de la borne ; une calibration qui sortirait des bornes est refusée et le motif est journalisé.
- Une coupure au milieu de la nuit ne laisse ni calibration à moitié écrite ni écart perdu (reprise).
- Un test mesure : en heures ouvrées, la recalibration n'ajoute pas plus de `ia.recalibration_cpu_max_pct` de charge, et le temps de réponse des capacités reste sous son plafond.
- Une capacité en N0 pur (pas assez d'écarts) ne recalibre rien et le journal le dit.
- `[ASSUMPTION : cadence nocturne, bornes et part de ressources posées par ce PRD ; ferme le trou T-08 (cadence, déclencheur, ressources). Le calibrage continu n'est pas une promotion.]`

#### FR-60 : La calibration validée est intouchable ; une nouvelle calibration naît à côté

La calibration **en service** (validée) est un volume **versionné et hors de la migration** : une promotion de plateforme ne l'ouvre pas en écriture (moteur AD-39). Chaque recalibration nocturne **n'écrit pas** dedans : elle produit une **calibration sœur**, **évaluée** contre la calibration en service sur le jeu de validation de l'organisation (FR-69). Elle ne devient la calibration **active** que si elle gagne, par une décision journalisée ; **la précédente est conservée** pour le retour arrière (FR-67), au moins `ia.calibrations_conservees` versions et au moins 7 jours. Un nouveau **modèle commun** (§7.2) crée de même une calibration sœur, calculée **dans l'essai d'abord**. Le format de la calibration reste **lisible par la version précédente du code** ; son **empreinte** se calcule de façon déterministe.

**Conséquences (testables) :**
- Le test d'empreinte du moteur : l'empreinte de la calibration active est **identique avant et après** une mise à jour de code.
- Une calibration sœur qui perd l'évaluation n'est jamais active ; un test la fait perdre et vérifie la conservation de la calibration en service.
- Un retour arrière de modèle repointe sur la calibration précédente ; **les propositions faites par la version abandonnée restent lisibles**.
- Une calibration sœur est conservée au moins 7 jours après son remplacement ; le volume d'espace disque occupé est borné par `ia.calibrations_conservees`.

### 7.2 La boucle commune

#### FR-61 : Chaque jour, des écarts agrégés remontent, si, et seulement si, tout est en règle

Chaque jour, l'IA dépose à l'agent les écarts de la veille **préparés au niveau « apprentissage »** (FR-77) ; l'agent les envoie par la liaison sortante, **sur le jeton du jour** (FR-78), si et seulement si la finalité est couverte et le consentement en vigueur (FR-76). En ligne, la centrale lit les écarts des organisations consentantes par le **compte de service** et la **garde du registre** (FR-88) et les prépare de la même façon. **Sans contact récent** (gel, coupure), rien ne remonte : l'IA locale **continue de servir**, sans en pâtir.

**Conséquences (testables) :**
- Sans consentement en vigueur, **aucun envoi** ; un test inspecte le trafic sortant : zéro octet vers la centrale de l'IA.
- Sans jeton valide, l'envoi est refusé par la centrale de l'IA ; l'écart reste en file jusqu'à sa péremption (FR-77) puis est purgé.
- Rejouer un envoi (même clé d'idempotence) ne double aucun écart.
- Une instance isolée 45 jours reste fonctionnelle (FR-53) ; à son retour, elle envoie à nouveau, **sans rattrapage de ce qui a péri**.
- `[ASSUMPTION : l'absence de remontée des instances isolées crée un biais de sélection (clients connectés surreprésentés) ; la centrale publie dans le rapport global (FR-72) la part des organisations dont les écarts ont été reçus, pour que ce biais soit lisible. Trou T-18.]`

#### FR-62 : Le modèle commun s'entraîne chez Money Vibes, à une cadence qui limite la rétention

La centrale de l'IA entraîne les modèles communs, **capacité par capacité**, à partir des écarts agrégés reçus (jamais de données brutes de personne), des jeux publics et synthétiques, et de tout jeu de départ du N1 (FR-47). L'entraînement est **cadencé** : une tournée par ligne de modèles au plus **toutes les `ia.cadence_entrainement_jours_min` jours**. La rétention du brut est **courte** : une contribution reçue n'est gardée que **jusqu'au tour d'entraînement qui l'emploie**, puis supprimée ; **seul le modèle** est conservé, avec sa fiche de composition (FR-81). Chaque tournée est inscrite : jeu d'entrée (empreinte), code d'entraînement (version), semence, métriques, qui a validé.

**Conséquences (testables) :**
- Aucun brut n'est conservé plus d'un tour : un test compte les écarts anciens dans le stock de la centrale après deux tournées : zéro.
- Une tournée sans les écarts d'une organisation dont le consentement a été retiré **ne contient aucune** de ses données (FR-79).
- Un entraînement rejoué avec la même fiche de composition et la même semence redonne le **même modèle** (empreinte identique) pour les familles où c'est possible, et la fiche dit lesquelles.
- La centrale refuse de lancer une tournée si moins de `k` organisations contribuent à un groupe (FR-77).
- `[ASSUMPTION : l'entraînement n'est pas fédéré (hors périmètre, §0) ; le premier modèle réel apparaît au plus tôt au deuxième semestre 2027 (réserve du moteur). Le fédéré et la confidentialité différentielle sont une option ultérieure ; le mot « différentielle » n'est employé qu'avec un budget tracé. Trou T-04 : cadence et rétention fermées, jeu de test et critère fermés en FR-65.]`

#### FR-63 : Une ligne de modèles, distincte de la ligne de la plateforme

Les modèles communs, les gabarits de langage et les jeux de référence (FR-55) voyagent sur une **ligne de modèles** à part de la ligne de version de la plateforme. **Pas de branche par client** : une seule ligne ; les différences passent par les paramètres et la calibration. La ligne a ses **propres versions**, signées et inscrites dans un **manifeste de modèles** signé (empreintes, capacités servies, compatibilité avec la version du service, date de fin de validité, `retourArriere`). Une publication a lieu **au plus une fois par semaine** (`ia.cadence_publication_jours_min`) sur une instance, sauf **correctif de sécurité** d'un modèle. La ligne suit la fenêtre N/N-1 du moteur : le service lit les modèles en N et en N-1 du contrat de modèle.

**Conséquences (testables) :**
- Le manifeste d'un modèle est vérifié hors ligne avant toute installation (FR-83) ; un modèle absent du manifeste n'est jamais servi.
- Deux publications de la ligne ne peuvent atteindre une même instance dans la même fenêtre de 7 jours (hors correctif de sécurité) ; un test envoie deux publications : la seconde attend.
- Un modèle qui exige une version du service que l'instance n'a pas est **refusé avec un message** (« ce modèle attend la version 3.2 ») et l'instance garde son modèle ; elle n'est pas arrêtée.
- Un test installe la version N-1 du contrat de modèle sur le service N : les capacités répondent.
- `[ASSUMPTION : la ligne de modèles est distincte de la ligne de la plateforme ; cela amende AD-3 et AD-32 du moteur de la même manière que l'agent (à porter dans l'architecture de l'IA). Ferme le trou T-10 pour la ligne ; le comportement visible est en FR-66.]`

#### FR-64 : Le plan de promotion d'un modèle : essai, ombre, canari, général

Un nouveau modèle n'atteint un client qu'en suivant un **plan enregistré**, dans cet ordre, **sans en sauter un** :
1. **Évaluation hors ligne** chez Money Vibes contre le champion en place (FR-69) ; un échec arrête la route.
2. **Essai** : le modèle est installé dans l'espace d'essai de l'organisation (images préchargées) ; la recalibration locale s'y exécute (FR-60) ; un candidat n'est jamais promu depuis un essai à données masquées (FR-42).
3. **Ombre** : le modèle répond **en parallèle** du modèle en place sur les mêmes demandes du réel ; ses réponses sont **comparées, jamais affichées ni suivies d'effet** ; durée `ia.duree_ombre_jours`. Le coût du double calcul est supporté ; il est borné par le quota (FR-31).
4. **Canari** : une **part** des demandes du réel (`ia.part_canari_pct`) est servie par le nouveau modèle, par organisation, avec les portes de FR-65 ; le retour arrière est **répété** pendant le canari.
5. **Général** : toutes les demandes, après passage de toutes les portes.

En local, les étapes 2 à 5 se jouent dans **l'instance**, à la **date que choisit le DSI** (FR-66). Les vagues du moteur s'appliquent : une organisation pilote d'abord (la plateforme compte), 7 jours sans incident, plafond d'attente de 14 jours.

**Conséquences (testables) :**
- Un test tente de passer en canari sans ombre, en général sans canari : refus nommé (`PROMOTION_ETAPE_MANQUANTE`).
- En ombre, **aucune** réponse du candidat n'atteint l'écran, ni ne produit de proposition acceptable ; un test les capture : zéro.
- Le plan de promotion est **inscrit** (étapes, dates, portes franchies, auteur) et consultable ; sans plan inscrit, aucune promotion.
- La promotion ne **touche** pas au volume de calibration en service (FR-60) : le test d'empreinte passe.
- L'interruption de service de l'IA lors de la bascule est inférieure à 15 minutes, journalisée (moteur AD-11).

#### FR-65 : Les portes sont écrites avant l'essai

Pour chaque capacité, la fiche écrit **avant** toute promotion les **portes** de chaque étape : métrique de qualité (précision, rappel, calibration) au moins égale au champion moins une tolérance écrite ; **latence** sous le plafond ; **dérive** sous le seuil (FR-73) ; **équité** sans dégradation (FR-70) ; **sous-groupes** (zone, secteur, genre quand la variable est observée) sans écart nouveau ; **coût** d'inférence sous le plafond. Sans toutes les portes franchies, la promotion s'arrête **et est inscrite comme refusée** avec la porte qui a échoué. Les portes se changent par une **décision tracée** d'une personne de l'équipe IA de Money Vibes, jamais par le plan lui-même.

**Conséquences (testables) :**
- Une capacité dont les portes ne sont pas toutes renseignées (valeur, tolérance, fenêtre) n'entre pas au catalogue.
- Un candidat qui échoue **une seule** porte n'est pas promu ; un test fait échouer chaque porte tour à tour.
- Une modification de portes est inscrite avec son auteur et sa date, et n'est effective que pour les plans **ouverts après** elle.
- `[ASSUMPTION : « qui valide » est l'équipe IA de Money Vibes (rôle défini en §2), avec double signature pour une capacité qui touche une personne ; ferme le trou T-04 sur le critère de publication et le jeu de test.]`

#### FR-66 : La date est celle du DSI en local, un interrupteur de changement en ligne

**En local**, un nouveau modèle ne passe dans le réel qu'à la **date que choisit le DSI**, informé en langage simple de ce qui change (capacités touchées, effet attendu mesuré à l'essai, ce qui est conservé) ; **rien ne change sans son accord**, sauf un correctif de sécurité (72 heures, reportable une fois de 7 jours au plus). **En ligne**, Money Vibes fixe la fenêtre avec annonce 7 jours avant. Tout modèle qui **change des scores ou des textes visibles** est un **interrupteur de changement** : éteint à la livraison, allumé par l'administrateur de l'organisation, avec **date limite de 30 jours** après laquelle il est allumé d'office ; une seule version d'interrupteurs est ouverte à la fois ; un interrupteur ne change jamais la forme des données. Un modèle qui ne change ni scores ni textes visibles (optimisation de latence) n'est pas un interrupteur.

**Conséquences (testables) :**
- Une instance en local ne change de modèle ni avant ni sans la date du DSI ; un test force la promotion sans date : refusé.
- Un modèle en interrupteur éteint **ne change pas** une seule proposition affichée ; allumé, il change ; éteint de nouveau, il revient. Les deux états sont jouables sans perte.
- Le message au DSI cite, par capacité, la mesure de l'essai (par exemple « rappel +4 points sur vos dossiers »).
- Un correctif de sécurité de modèle passe par le chemin rapide du moteur, **sans migration de calibration**.
- `[ASSUMPTION : un nouveau modèle qui change des scores affichés est un comportement visible à déclarer (interrupteur) ; ferme le trou T-10 pour le comportement visible.]`

#### FR-67 : Le retour arrière tient en une action

Le retour au modèle précédent se fait par **une action** (une commande de l'agent en local, une action de Money Vibes en ligne), **sans redéploiement ni perte** : il repointe sur le **modèle précédent et sa calibration précédente**, tous deux conservés au moins **7 jours** après la promotion. Il ne retire jamais un correctif de sécurité. Il est possible **par organisation** (en ligne comme en local) et **par capacité** : un modèle qui échoue sur une seule capacité n'oblige pas à revenir sur les autres. Il est répété pendant le canari. En ligne, le retour arrière global est décidé par Money Vibes. Un retour arrière demandé est un **incident** qui suspend la vague suivante.

**Conséquences (testables) :**
- Un test promeut un modèle puis revient : l'empreinte de la calibration d'origine est retrouvée, et les propositions faites pendant le passage restent lisibles.
- Le temps du retour arrière est mesuré en recette (cible `ia.retour_arriere_max_min`) et ne dépasse pas la coupure de 15 minutes.
- Un retour par capacité laisse les autres capacités au modèle nouveau ; un test le vérifie.
- Au-delà de 7 jours, le retour exige la restauration (hors cet article) ; l'écran le dit.
- Un retour arrière n'efface aucun écart et n'interrompt pas la recalibration locale.

### 7.3 Les objectifs, la mesure, la dérive

#### FR-68 : Chaque capacité a des objectifs mesurés

La fiche de chaque capacité fixe ses **objectifs** (métrique, cible, seuil minimal, fenêtre) dans **quatre familles**, qui sont **mesurées**, pas déclarées : (1) **qualité** (précision, rappel, calibration des probabilités) ; (2) **usage** (taux d'acceptation, de modification, de rejet, d'expiration) ; (3) **effet métier** (baisse du PAR, délai d'un sinistre, taux de recouvrement, temps gagné) ; (4) **équité** (FR-70). Les **indicateurs sont fixés par ce PRD** (annexe D) ; les **cibles chiffrées sont des paramètres**, fixées par capacité avec le client concerné. Une capacité **sans objectif mesurable** n'entre pas au catalogue. Un taux d'acceptation très élevé sur une durée (`ia.acceptation_facade_pct` sur 30 jours) est un signal de **validation de façade**, rapporté, pas un succès.

**Conséquences (testables) :**
- Pour chaque capacité, le rapport (FR-71) contient au moins un indicateur de chaque famille ; un test de complétude parcourt le catalogue.
- L'indicateur d'effet métier est calculable depuis les **données du module** (fait de réalité, FR-57), pas depuis une déclaration.
- Un taux d'acceptation supérieur au seuil de façade pendant 30 jours déclenche une alerte au responsable de la capacité.
- `[ASSUMPTION : les cibles par capacité (annexe D) sont à fixer avec chaque client ; le PRD ne promet aucun chiffre d'effet métier avant la première mesure.]`

#### FR-69 : Le champion et le challenger

Une version n'est **promue** que si elle **bat la version en place** (le champion) sur les objectifs de **qualité** et d'**équité**, sans régression des autres, sur le **jeu d'évaluation de la capacité**. Le jeu d'évaluation est **séparé** du jeu d'entraînement, **figé** par version de capacité et conservé avec elle. En local, le challenger N2 est évalué sur les écarts **de l'organisation** (jeu de validation tiré **dans le temps**, pas au hasard : les plus récents servent à valider). En ligne, le challenger N1 est évalué à la centrale puis en ombre. Les alias du registre (`champion`, `challenger`) sont des **pointeurs** : promouvoir ou revenir déplace un alias.

**Conséquences (testables) :**
- Un challenger identique au champion n'est pas promu (il doit **battre**, pas égaler) ; un test l'établit.
- Le jeu d'évaluation d'une capacité ne contient aucun enregistrement de l'entraînement (test d'intersection : vide).
- Le résultat de chaque comparaison (métriques, intervalle, jeu, date) est inscrit au registre des modèles avec la décision.
- Un candidat évalué sur moins de `ia.eval_min_exemples` exemples est refusé « échantillon insuffisant », jamais promu.

#### FR-70 : L'équité se mesure et bloque

Pour toute capacité qui **note une personne** (crédit, risque, fraude, tarif d'une police), les **variables d'entrée sont une liste fermée** : genre, situation matrimoniale, nationalité et religion n'y entrent jamais ; les variables qui peuvent s'y substituer (nom, quartier, prénom) sont **auditées**. L'IA calcule chaque mois, par genre, zone et secteur, les **taux d'acceptation, de refus et d'écart de score**, et les expose. Une **dégradation d'équité** au-delà du paramètre `ia.equite_ecart_max_pts` : (1) **bloque la promotion** du candidat ; (2) si elle apparaît sur le modèle en service, déclenche l'**alerte** de FR-73 et la **revue humaine**. Un test d'impact disparate est exécuté **avant** toute mise en service d'une capacité de score.

**Conséquences (testables) :**
- Une variable hors liste dans l'entrée d'une capacité de score est refusée (`VARIABLE_NON_AUTORISEE`) ; un test la tente pour chaque capacité de score.
- La liste de variables autorisées d'une capacité est versionnée ; la modifier produit une nouvelle version de capacité, donc une promotion.
- Le rapport mensuel contient, par capacité de score, les taux par sous-groupe observé ; un sous-groupe de moins de `k` personnes est **regroupé**, jamais affiché.
- Un candidat qui dégrade l'équité de plus de la borne ne passe pas la porte, même s'il gagne en précision.
- `[ASSUMPTION : les sous-groupes observés sont ceux que le module recueille déjà ; l'IA n'impose pas de nouvelle collecte. Le caractère « haut risque » des scores de crédit et d'assurance vie et santé est traité par anticipation (référence, pas obligation hors Union européenne).]`

#### FR-71 : Un rapport mensuel local, par capacité et par client

Chaque mois, l'IA produit **pour l'organisation**, par capacité : le **niveau servi** et ses changements, les **objectifs contre le réalisé** (quatre familles), la **dérive**, les **sous-groupes**, les **replis**, le **coût** d'inférence, les **propositions rejetées ou corrigées** par motif codé, le **nombre d'envois** de la passerelle et les types de champs masqués. Le rapport est **lisible par l'organisation** (DG, DSI, responsable de la capacité), généré à partir des données de l'instance, **sans** rien envoyer à Money Vibes. Il est **exportable** en document.

**Conséquences (testables) :**
- Le rapport d'un mois sans activité existe et dit « aucune proposition » plutôt que de manquer.
- Chaque chiffre du rapport se **recalcule** depuis le registre et les écarts (« tout indicateur se calcule depuis les données ») ; un test recalcule et compare.
- Le rapport est produit **sur l'instance coupée du réseau**.
- Aucun nom, identifiant de personne ou texte libre n'y figure ; les sous-groupes sous `k` sont regroupés.

#### FR-72 : Un rapport mensuel global, chez Money Vibes

Chaque mois, la centrale de l'IA produit le **rapport global** par capacité : niveau servi par organisation (en effectifs), objectifs réalisés agrégés, dérive, **part des organisations dont les écarts ont été reçus** (FR-61), modèles promus, refusés, retirés, retours arrière, incidents de modèle, **coût**. Il ne se construit qu'à partir des **indicateurs de niveau 0** et des **écarts du niveau « apprentissage »** ; il n'identifie **aucune** organisation en dessous de `k` ni aucune personne. Il est lu par l'équipe IA de Money Vibes et son responsable des données.

**Conséquences (testables) :**
- Le rapport global est reproductible depuis les seuls envois reçus (empreinte des entrées inscrite).
- Un groupe de moins de `k` organisations n'apparaît pas distinctement ; il est regroupé dans « autres ».
- La part de couverture (organisations ayant envoyé / organisations consentantes) est **en tête** du rapport.

#### FR-73 : La dérive est détectée, alertée, et peut arrêter une promotion

La **dérive** (des entrées, des sorties, de la qualité sur les écarts échus, de l'équité) est **calculée localement**, par capacité et **par segment**, avec seuils par capacité (`ia.derive_seuils`, annexe D) ; seules des **statistiques** remontent (indicateur de niveau 0 : taux d'erreur par modèle, nombre de corrections, dérive), jamais de donnée brute. Franchir un seuil : (1) **alerte** au responsable de la capacité et à l'équipe IA de Money Vibes ; (2) **suspend la vague suivante** si le modèle en cause est le modèle nouvellement promu ; (3) si la dérive est **grave** (seuil de gravité), **retombe** la capacité au niveau inférieur (FR-53) et propose le retour arrière (FR-67). Une régression de qualité ou d'équité d'un modèle est un **incident de modèle** au sens du moteur, au même titre qu'un retour arrière demandé. La dérive **pendant un canari** est comparée à celle du champion avant d'alerter (limiter les fausses alertes).

**Conséquences (testables) :**
- Un jeu d'entrées dérivant volontairement déclenche l'alerte dans le délai `ia.derive_delai_alerte_h` ; un jeu stable n'en déclenche aucune.
- Une dérive grave sur le modèle promu **suspend** la vague suivante ; un test le vérifie dans le plan de promotion.
- L'indicateur de dérive est remis à l'agent sur `instance.indicateurs` en **schéma fermé** ; un test échoue si un champ non déclaré ou un identifiant sort.
- Une alerte de dérive nomme la capacité, le segment, la métrique et le seuil, **sans** donnée de personne.
- `[ASSUMPTION : seuils de dérive et de gravité posés en paramètres, à régler sur les premières mesures ; ferme le trou T-11 en étendant la liste des incidents à la régression de qualité et d'équité (amendement d'AD-32 à porter dans l'architecture de l'IA).]`

### 7.4 Le désaccord, confronté à la réalité

Exigence forte du PO (« très important, surtout pour vendre ») : quand un humain s'écarte d'une proposition de l'IA, Prospera **garde ce désaccord** et, à l'horizon prévu, le **confronte à ce qui s'est réellement passé**. Exemple : l'IA juge un client de la microfinance non solvable ; la chargée de crédit le contredit et accorde le prêt ; douze mois plus tard, on regarde les retards d'échéance.

#### FR-74 : Chaque désaccord est gardé, puis tranché par la réalité à son horizon

Une proposition **modifiée ou rejetée** par un humain, ou **acceptée alors qu'un autre niveau** (la règle N0 contre le modèle) **disait autre chose**, est un **désaccord**. Le désaccord est enregistré avec l'**agent** qui a décidé, l'**agence** ou l'équipe, l'**organisation**, la **capacité**, le **niveau et la version** servis, la décision et le **motif codé** (FR-58). Chaque capacité déclare dans sa fiche : (1) l'**horizon** de confrontation (par exemple, pour le crédit, les retards d'échéance à 3, 6 et 12 mois ; pour la fraude, la confirmation ou l'écart de l'enquête ; pour une relance, le paiement reçu ou non ; pour une anomalie, sa confirmation ou son rejet) ; (2) la **règle « qui avait raison »**, écrite en clair, qui range chaque désaccord dans **`IA_AVAIT_RAISON`, `HUMAIN_AVAIT_RAISON` ou `INDECIDABLE`** (par exemple, crédit accordé contre l'avis de l'IA : l'humain a raison s'il n'y a pas de retard de plus de 30 jours à l'horizon, l'IA a raison s'il y en a ; indécidable si le prêt n'a pas été accordé, car la réalité n'est pas observable). **Aucun calcul n'a lieu avant l'horizon** : tant que la réalité n'est pas échue, le désaccord est « en attente » et ne compte nulle part. La réalité vient des faits nommés des modules (FR-57), jamais d'une saisie.

**Conséquences (testables) :**
- Une capacité dont la fiche n'a ni horizon ni règle « qui avait raison » ne peut pas enregistrer de désaccord confrontable ; elle n'entre pas au catalogue avec une fiche incomplète.
- L'horizon est un **paramètre par capacité** (annexe D), et peut avoir plusieurs échéances (3, 6, 12 mois) : chaque échéance donne son propre classement, l'**échéance la plus longue** fait foi pour le chiffre final et les échéances courtes sont publiées comme **provisoires**.
- Un test fige l'horloge **avant** l'horizon : aucun pourcentage ne contient le désaccord ; après l'horizon, il entre dans le calcul, **une seule fois** (rejouer le fait de réalité ne le double pas).
- Un désaccord dont la réalité n'est pas observable (prêt refusé, sinistre non déclaré) est classé `INDECIDABLE` et **n'est jamais** compté comme une raison pour l'IA ou pour l'humain.
- La règle « qui avait raison » d'une capacité est **versionnée** ; un changement de règle ne reclasse pas les désaccords déjà tranchés, il vaut pour les suivants (la version de règle est portée par chaque classement).
- `[ASSUMPTION : les valeurs d'horizon et les seuils de la règle (par exemple le retard de plus de 30 jours) sont des paramètres posés avec chaque capacité à l'écriture des fiches (§10) ; ils ne sont pas dans la parole du PO, qui cite les retards d'échéance (PAR 30) à 3, 6 et 12 mois pour le crédit.]`

#### FR-75 : Le taux « qui avait raison », sur une période glissante, par capacité, agent, agence, client et en global

Pour chaque capacité, l'IA calcule, sur une **période glissante** (paramètre, par défaut les 12 derniers mois), le **pourcentage** de désaccords tranchés où **l'IA avait raison**, où **l'humain avait raison** et où le cas est **indécidable**, **avec le nombre de cas** et un intervalle d'incertitude. Les coupes sont : **par capacité**, **par agent**, **par agence**, **par client (organisation)** ; **en global chez Money Vibes**, à partir des seuls **agrégats** du niveau d'export « apprentissage » (FR-77). Ces chiffres ont **trois usages** :
1. **Donnée de premier rang** : visibles par le **responsable** de la capacité ou de l'agence et par **l'agent lui-même** pour ses propres désaccords ; **jamais** présentés comme un reproche nominatif **aux pairs**. Un agent ne voit pas les chiffres d'un autre agent ; une agence ne voit que les siens.
2. **Entrée de l'apprentissage** : les désaccords où **l'humain avait raison** sont des écarts qui **corrigent le modèle** (FR-56, FR-59, FR-62), avec leur motif codé ; ceux où l'IA avait raison alimentent le suivi d'**usage** (FR-68), jamais une sanction.
3. **Preuve commerciale** : une phrase **exportable, agrégée et anonymisée** (« sur 12 mois, quand l'IA et l'humain étaient en désaccord, l'IA avait raison dans X % des cas, sur N cas, dans M organisations »). L'export ne contient **aucun nom** d'agent, d'agence, de client ni d'organisation ; il est produit **par la centrale** à partir des agrégats consentis, avec `k` organisations au minimum, ou, **pour un client seul**, par l'**instance du client** à partir de ses propres chiffres (document que le client peut montrer à qui il veut).

**Conséquences (testables) :**
- Un jeu de désaccords connus donne les pourcentages attendus **au chiffre près** pour chaque coupe ; la somme des trois classes fait 100 % pour chaque coupe ; la période glissante exclut un désaccord vieux de plus de la période.
- Un utilisateur qui n'est ni le responsable ni l'agent concerné ne peut pas lire le chiffre d'un agent (refus nommé, sans donnée) ; un collègue d'agence ne voit pas le chiffre d'un autre agent.
- Un test cherche, dans l'export commercial et dans tout lot d'agrégats remonté, **tout nom** d'agent, d'agence, de client ou d'organisation, tout identifiant et tout texte libre : zéro.
- Un groupe de moins de `k` cas ou de moins de `k` organisations **n'est pas publié** : la case est regroupée ou vide, jamais affichée avec un petit effectif.
- Aucun pourcentage n'est publié sans son **effectif** et la date de la dernière mise à jour ; un pourcentage sur moins de `ia.desaccord_min_cas` cas est affiché « non significatif ».
- Un désaccord confronté à la réalité alimente l'apprentissage **seulement** si la finalité est consentie (FR-76) ; sinon il reste dans le calcul **local** du client.
- Les chiffres sont recalculables depuis les écarts et les faits de réalité (« tout indicateur se calcule depuis les données ») ; un test recalcule et compare.
- Le chiffre ne **change aucune décision** : il n'entre ni dans un seuil de confiance, ni dans une règle d'automatisation, ni dans l'évaluation d'un agent par l'IA seule.
- `[ASSUMPTION : le chiffre par agent est visible du responsable et de l'agent seulement (décision du PO : « jamais un reproche nominatif affiché aux pairs ») ; l'usage de ce chiffre dans l'évaluation d'un employé relève du droit du travail et du contrat du client, et est ajouté à la revue du juriste (trou T-16).]`

## 8. Données, consentement, confidentialité

La règle de fond (vision validée par le PO) : **on met en commun l'apprentissage, pas les données**. Les modèles voyagent ; les fiches des clients restent chez leur propriétaire. Cette section dit ce qui peut quand même sortir, à quelles conditions, et ce qui ne sort jamais.

#### FR-76 : Une finalité « apprentissage commun », consentie au contrat

Il existe, au **vocabulaire fermé et versionné des finalités** du registre des consentements (moteur AD-13), une finalité **« apprentissage commun »**. Une **clause du contrat** du client la porte, **une ligne de registre par finalité** ; sans contrat portant la clause, aucun consentement ne s'enregistre. Seul le DG (ou son désigné par écrit) modifie le registre. Le registre **vit sur l'instance** (l'agent) ; Money Vibes n'en a qu'une copie signée, jointe au contact à chaque changement et sans valeur au-delà de 14 jours. Ajouter une finalité d'apprentissage est une **évolution de contrat**. Pour une organisation qui est elle-même un établissement (microfinance), le consentement de **ses clients finals** à ce que leurs écarts alimentent l'apprentissage est un consentement **distinct**, enregistré par l'établissement (finalité « IA commune » du client) ; un écart n'entre dans un lot que si **les deux** sont en vigueur.

**Conséquences (testables) :**
- Sans clause au contrat, l'enregistrement de la finalité est refusé ; sans consentement du client final, l'écart de ce client **n'entre pas** dans le lot.
- Un consentement modifié par un autre que le DG ou son désigné rend `CONSENTEMENT_RESERVE_AU_DG` (403).
- Une copie du registre de plus de 14 jours n'autorise **aucun** envoi.
- Une finalité absente du vocabulaire est refusée ; la liste des finalités d'apprentissage de l'IA est publiée avec le contrat.
- Une donnée n'entraîne **jamais** un modèle hors de sa finalité : un test pose une donnée consentie pour une finalité autre que l'apprentissage commun dans un lot : refusé.
- `[ASSUMPTION : la finalité est posée dans le vocabulaire fermé ; sa rédaction juridique relève de la revue du juriste (trou T-16).]`

#### FR-77 : Un niveau d'export « apprentissage » propre

L'envoi vers la centrale de l'IA se range dans un **niveau d'export propre**, « apprentissage », entre le niveau 0 (indicateurs) et le niveau 3 (contribution consentie du moteur) : seulement des **agrégats** et des **écarts sans identité**, avec un **effectif minimal `k`** par groupe, **sans texte libre**, **sans donnée de santé** (même anonymisée, FR-36), **sans pièce**, sans identifiant ni nom, sans coordonnée, sans position précise ; date de naissance ramenée à l'année ; montants conservés ; **prix et marges d'un freelance exclus** ; **sans variable interdite** d'un score (FR-70). Le lot est **préparé par l'agent sur l'instance** (pseudonyme salé propre à chaque envoi, table de correspondance **qui ne quitte jamais l'instance**, deux envois qui ne se joignent pas), et décrit par un **manifeste signé** (champs, effectifs, finalité). Le **niveau est un champ du registre de l'agent**, jamais un paramètre d'un module.

Un envoi quotidien d'écarts n'est **pas** soumis à une approbation humaine à chaque lot, qui rendrait l'apprentissage continu impossible : le **manifeste type** (liste des champs et des agrégats autorisés pour chaque capacité) est **approuvé une fois** par le DG de l'organisation et par le responsable des données de Money Vibes, **à la signature et à chaque changement du manifeste** ; chaque lot **conforme** au manifeste type part sans nouvelle approbation, et un lot qui s'en écarte est refusé. Les données qui seraient hors du manifeste type suivent le niveau 1 ou le niveau 3 du moteur, avec leurs approbations.

**Conséquences (testables) :**
- Un test inspecte un lot : aucun identifiant, nom, téléphone, pièce, adresse, position précise, photo ni texte libre ; aucune donnée classée santé ; aucune variable hors liste ; aucun prix de freelance.
- Un groupe de moins de `k` (par défaut 5) est **retiré** avant l'envoi ; deux lots ne se joignent pas (pseudonymes salés différents).
- Un lot qui contient un champ **absent** du manifeste type est refusé (`LOT_HORS_MANIFESTE`) ; modifier le manifeste type sans les deux approbations est refusé.
- Un test sans consentement ne trouve **aucun** envoi ; un test avec consentement retire du lot tout client dont le consentement final manque.
- `[ASSUMPTION : les écarts agrégés au niveau « apprentissage » sont des contributions de niveau 3 du moteur sous un manifeste type approuvé une fois ; cela évite l'approbation à chaque export du niveau 1. Ferme le trou T-06 sur le niveau ; à confirmer dans l'architecture et par le juriste.]`

#### FR-78 : Un jeton quotidien autorise l'envoi

L'agent ne joint un lot qu'avec le **jeton d'export** signé, à courte durée, remis par la centrale dans la réponse **quotidienne** du contact, et **refusé** en cas de recul ou de bifurcation de l'état de confiance. La centrale de l'IA le vérifie **hors ligne** par la chaîne de clés et **refuse sans jeton valide**. L'envoi se fait **par morceaux repris**, avec clé d'idempotence, sur la même identité mTLS que le contact. C'est le **seul lien** entre la centrale du moteur et la centrale de l'IA.

**Conséquences (testables) :**
- Sans jeton, ou avec un jeton expiré ou refusé après un recul d'état, l'envoi est refusé et le lot **reste en file** jusqu'à sa péremption.
- Une contribution non transmise sous `ia.contribution_purge_jours` (30) est **purgée** sur l'instance.
- Une coupure au milieu d'un envoi reprend au morceau suivant sans doublon.
- La centrale de l'IA n'a **aucune connexion** à un autre service du poste central ; un test d'inspection de sa configuration le confirme.

#### FR-79 : Le retrait du consentement arrête l'usage futur

Un **retrait** du consentement : (1) **vide** d'abord la file d'export de la finalité, avant d'écrire le retrait au registre ; (2) fait refuser par la centrale de l'IA toute donnée dont la finalité n'est pas couverte par la copie la plus récente du registre (par rang) ; (3) **met en quarantaine ou supprime**, avec journal, ce qui est reçu pour une finalité retirée ; (4) **exclut** l'organisation (ou le client final) du **tour d'entraînement suivant** ; (5) **retire** de l'**export commercial** (FR-75) les désaccords de l'organisation au prochain calcul. **Un retrait n'arrête pas** la calibration locale de l'organisation, qui est sa donnée (FR-59). Le retrait **tient après une restauration** de sauvegarde (le registre n'est jamais restauré).

**Conséquences (testables) :**
- Après un retrait, un test cherche dans la file, dans la centrale et dans le tour suivant : **aucune** donnée de l'organisation n'est utilisée.
- Un retrait suivi d'une restauration d'une sauvegarde antérieure : le retrait **tient** et la file reste vide.
- Un retrait ne coupe aucune capacité de l'organisation : les propositions et la recalibration locale continuent.

#### FR-80 : Les transferts hors du pays sont déclarés et informés

Quand l'IA fait sortir des données personnelles du pays, il y a **transfert** : (1) l'envoi d'une demande de langage à un fournisseur hébergé hors du pays (FR-33) ; (2) l'envoi d'écarts à la centrale de l'IA si elle est hors du pays du client. Pour le **Togo** (loi 2019-014 du 29 octobre 2019, art. 28 et 29, texte lu) : le transfert vers un pays tiers n'a lieu que si le pays assure un niveau de protection suffisant, **avec information préalable de l'IPDCP** qui rend un avis motivé ; les transferts **ponctuels et non massifs** peuvent se faire avec consentement exprès ou nécessité. L'IA **tient un registre des transferts** (organisation, destination, pays, finalité, sous-traitant, base juridique, date d'information de l'autorité), alimenté par la configuration de la passerelle et par le manifeste d'export, **affiché au DG et au délégué à la protection des données**. **Aucun envoi de données personnelles vers un fournisseur n'a lieu tant que le transfert correspondant n'est pas inscrit comme informé** pour le pays de l'organisation. Pour les autres pays (Côte d'Ivoire, Sénégal) le régime est **à lire** par le juriste avant mise en service ; l'IA applique par défaut la règle la plus stricte.

**Conséquences (testables) :**
- Un envoi vers un fournisseur dont le pays d'hébergement n'est pas inscrit « informé » pour l'organisation est **refusé** (`TRANSFERT_NON_DECLARE`), ligne au journal de la passerelle.
- Le registre des transferts est exportable pour l'autorité ; il liste, par organisation, tous les couples (destination, finalité) actifs.
- Un test change la région d'un fournisseur par configuration : les envois s'arrêtent jusqu'à la nouvelle inscription.
- `[ASSUMPTION : l'envoi d'une demande masquée à un LLM hors du pays est traité comme un transfert à déclarer, par prudence (le texte togolais le suggère ; aucune lecture ne l'établit). À trancher par le juriste, avec la localisation exigée ou non par les textes de la zone monétaire (aucun texte officiel trouvé, une tribune seulement).]`

#### FR-81 : Un modèle déjà publié n'est pas désentraîné, et sa composition est tracée

Le contrat dit en toutes lettres : **un retrait arrête l'usage futur, il ne désentraîne pas un modèle déjà publié**. Pour que cette limite soit outillée et non seulement affirmée, la centrale de l'IA tient pour **chaque modèle publié** une **fiche de composition** : jeux publics et synthétiques (identifiant, version), **organisations dont les écarts agrégés ont servi** (par identifiant de pseudonyme interne à la centrale, avec les finalités et le rang de registre en vigueur), plage de dates, empreinte du jeu, code d'entraînement et semence. Elle est **signée** avec le modèle et conservée tant que le modèle l'est. Elle répond à trois questions : « quel modèle a vu les données de cette organisation ? » (retrait, effacement, revue de l'autorité) ; « de quoi ce modèle est-il fait ? » ; « quelles instances le portent ? ». Sur demande de l'organisation, la centrale peut **réentraîner** la ligne sans elle et retirer le modèle ancien selon le plan de promotion (FR-64).

**Conséquences (testables) :**
- Aucun modèle n'est publié sans fiche de composition signée ; un test tente la publication : refusée.
- Pour une organisation donnée, une requête sur les fiches liste tous les modèles qui ont vu ses écarts ; après son retrait, **aucun modèle postérieur** ne la liste.
- La fiche **ne contient aucune donnée** de personne ni d'organisation en clair (identifiants de pseudonyme seulement).
- Le contrat client contient la phrase « le retrait n'efface pas ce qu'un modèle déjà publié a appris » ; un test de la liste des clauses la retrouve.
- `[ASSUMPTION : ferme le trou T-09 ; la forme exacte de la fiche (champs) est dans l'addendum.]`

#### FR-82 : Le croisement entre verticales est un horizon ; ce qu'un modèle n'apprend jamais

Le **croisement d'une même PME entre verticales** (microfinance, distributeur, cabinet), pour lui donner un score ou une alerte, est **de l'horizon** (§13). Il exige un **consentement explicite de la PME** et une **identité partagée** (passeport de la vision) ; **aucun** pseudonyme ne se joint d'un export à l'autre, et **aucune** donnée d'une instance ne sert à une autre. Au premier jour, **chaque capacité n'apprend que dans sa verticale**. Sont **exclus de tout apprentissage**, quelle que soit la finalité : les **données de santé** (FR-36), les **prix et marges d'un freelance**, les **chiffres réglementaires** (plafond d'usure, provisions, montants corporels) comme sortie d'un modèle, les **variables interdites** d'un score, et les **lectures d'exploitation** de la plateforme.

**Conséquences (testables) :**
- Deux lots envoyés par la même organisation à deux dates ne contiennent aucun identifiant commun ; un test de jointure échoue.
- Aucune fiche de composition ne montre un modèle entraîné avec les écarts de deux verticales sans la finalité de croisement ; au premier jour, la finalité n'existe pas.
- Un test qui pose un montant corporel, un prix de freelance ou une variable interdite dans un lot : refusé.
- Les lectures d'exploitation de la plateforme (journalisées à part) ne figurent dans aucun jeu d'entraînement ; un test de provenance le vérifie.

## 9. Exploitation, licence, sans contact

#### FR-83 : Tout modèle est signé, par une clé dont l'usage le couvre

Tout ce qui arrive de Money Vibes à l'IA (**modèles, gabarits de langage, jeux de référence, manifeste de modèles**) est **signé** et **vérifié hors ligne** avant installation. L'artefact est un **paquet versionné** (poids ou règles, fiche de capacité, fiche de composition, manifeste d'empreintes) signé par la **famille de clés `ci`**, comme les images et le manifeste de la ligne de version, **sous un `usage` distinct « modèle »** dans le certificat de clé : une clé qui ne couvre pas cet usage est refusée. La **période de validité** se lit sur l'**horloge scellée**. Un artefact invalide est refusé **entier**, sans dire quelle vérification a échoué à l'extérieur ; le détail va au journal. Le **poids maximal** d'un paquet est un paramètre (`ia.paquet_poids_max_go`) pour qu'il tienne sur le support de transport.

**Conséquences (testables) :**
- Un modèle signé par une clé `centrale`, un modèle modifié d'un octet, un modèle à clé révoquée et un modèle hors période de validité sont **tous refusés** ; le service garde son modèle courant.
- La vérification se fait **sans réseau** ; un test coupe le réseau et installe un paquet valide : accepté.
- Un modèle absent du manifeste de modèles signé n'est jamais servi, même présent sur le disque.
- `[ASSUMPTION : le modèle commun relève de la famille `ci` avec un usage « modèle » ajouté à la chaîne de clés (amendement d'AD-7 et d'AD-28 à porter dans l'architecture). Ferme le trou T-03.]`

#### FR-84 : Même contenu par le réseau et par le fichier

Un modèle, un gabarit ou un jeu de référence se livre **par le tunnel déclaré** (l'instance tire) **ou par fichier signé** (clé USB, lien), avec **exactement le même contenu**, la même vérification et la même promotion. Un fichier déjà vu n'est pas un contact. En **gel**, seul un correctif **critique** passe, **par fichier**. Une `versionCible` antérieure à l'installée est une **proposition** de retour arrière, jamais appliquée seule.

**Conséquences (testables) :**
- Un même modèle installé par le tunnel et par fichier donne la même empreinte installée et les mêmes propositions sur un jeu de référence.
- Un fichier de modèle redéposé après installation est ignoré avec un message.
- Un test installe un paquet par fichier sur une instance sans réseau, en gel : refusé sauf correctif critique.

#### FR-85 : Gel, version figée, licence à vie : l'IA sert indéfiniment

Après **30 jours sans contact** (gel), ou après la **fin de la maintenance** (version figée), ou **sans licence** perpétuelle active pour un module acheté, l'IA **continue de servir avec son dernier modèle et sa dernière calibration, sans limite de durée** : rien ne s'arrête, rien ne passe en lecture seule, rien n'est suspendu. Ce qui cesse est ce qui **vient de Money Vibes** : nouveaux modèles communs (un droit aux mises à jour), jeux de référence, et **remontée** des écarts. La **recalibration locale** continue (FR-59) : elle est la donnée du client. Seuls les **correctifs critiques** arrivent, tant que la version majeure est dans sa durée de maintenance, par fichier en gel. Revenir à la maintenance se paie, **avec rattrapage** des modèles manquants, promus un par un selon le plan (FR-64). **La licence à vie d'une institution** (microfinance) ne change rien : jamais de coupure pour impayé du contrat de maintenance, seules les livraisons s'arrêtent, avec un message. La **plateforme** n'entre jamais en gel ni en version figée.

**Conséquences (testables) :**
- Un test avance l'horloge de 10 ans sur une instance locale sans contact : chaque capacité répond, la recalibration nocturne tourne, aucun écran n'est en lecture seule du fait de l'IA.
- Aucune capacité ne se coupe pour une échéance de maintenance ; la route `sante` ne passe jamais à `DEGRADE` pour cette cause.
- Une instance figée ne reçoit pas un nouveau modèle commun ; elle en reçoit un après son retour à la maintenance, et l'**écran dit** le niveau et la date du modèle en service (« modèle du 12 mars »).
- Le DG est prévenu 90 jours avant la fin de la durée de maintenance de sa majeure (moteur AD-30), avec la phrase « votre IA continuera de servir, sans nouveau modèle ».

#### FR-86 : L'IA est supervisée comme le reste, par sa route de santé

L'IA expose la route `sante` du contrat de module (C13), avec l'état `OK` ou `DEGRADE` **par capacité** et par moteur (règles, modèles, langage, recalibration, tunnel). La **supervision de Money Vibes lit cette route** ; **un service muet** (qui ne répond plus à `sante`) part vers le ticket de Money Vibes, sans dépendre du service lui-même. Le signal hebdomadaire porte la santé de chaque module, la **joignabilité du tunnel**, les **écarts nommés** (par codes : modèle refusé à la signature, calibration discordante, palier insuffisant, transfert non déclaré) et les **indicateurs de niveau 0** (FR-73), en **schéma fermé** sans champ libre.

**Conséquences (testables) :**
- Un service d'IA arrêté provoque l'alerte « service muet » dans le délai du moteur, **sans** passer par lui.
- Un modèle de langage coupé met la capacité de langage en `DEGRADE`, les autres en `OK`.
- Un test remplit le signal d'une IA : aucun champ non déclaré, aucun identifiant de personne ou de dossier, aucun contenu métier.

#### FR-87 : Les modèles et les calibrations se sauvegardent et se restaurent avec les données

La **calibration**, le **journal des écarts**, le **registre de l'IA**, les **fiches de capacité** et les **versions de modèle en service et précédente** sont sauvegardés **avec les données** de l'organisation (copie quotidienne, incrément horaire, 3-2-1 ; copie hors machine chiffrée), et **restaurés avec elles** ; sur une machine d'IA à part (FR-32), la sauvegarde la couvre aussi. Une restauration **n'efface pas** la donnée du client ; elle **rejoue les effacements** (registre d'effacements) avant de rouvrir les gardes : une calibration construite sur des données effacées **ne revient pas**. **Le registre des consentements n'est jamais restauré** (état de confiance) : un retrait tient. Le **test de restauration mensuel** inclut l'IA : il vérifie l'empreinte de la calibration et qu'une proposition de référence est rendue à l'identique.

**Conséquences (testables) :**
- Restaurer une sauvegarde antérieure à un effacement d'organisation : la calibration et le journal de cette organisation sont **absents** après le rejeu de l'effacement.
- Restaurer une sauvegarde antérieure à un retrait de consentement : le retrait **tient** ; aucun envoi ne repart.
- Après restauration, un test de référence rend la **même** proposition et la **même** provenance ; l'empreinte de la calibration est celle de la sauvegarde.
- Un modèle absent après restauration est réinstallé depuis le paquet signé ; l'IA retombe sur N0 en attendant (FR-53).

#### FR-88 : Hébergé : la garde du registre se place entre l'IA et les données

Sur la plateforme, l'IA lit les données d'une organisation **uniquement par un compte de service dédié** dont **chaque lecture passe par la garde du registre des consentements** (bibliothèque de la plateforme commune à tous les services, appelée avant la lecture, qui interroge l'agent de la plateforme et rend `CONSENTEMENT_ABSENT`). L'accès **direct** à la base d'un autre module est **impossible** : l'IA n'a pas de chaîne de connexion (FR-38) ; elle lit par les **interfaces publiées** (C13 export, faits du bus) des modules, qui appliquent la garde. Les champs personnels sont retirés comme au niveau d'export. **Avoir les données sur nos serveurs ne donne pas le droit de les mettre en commun** : les lectures d'**exploitation** (support) sont journalisées à part, sans export en masse, **jamais pour l'apprentissage**.

**Conséquences (testables) :**
- Une lecture sans ligne de consentement en vigueur rend `CONSENTEMENT_ABSENT` ; un test l'applique à chaque module qui sert l'IA.
- Retirer une ligne du registre arrête la lecture **au prochain appel** (pas de cache de consentement plus long que `ia.cache_consentement_s`).
- Un test d'inspection ne trouve aucun accès de l'IA à une base de module.
- Un jeu d'entraînement construit en ligne ne contient aucune lecture d'exploitation (provenance, FR-82).
- `[ASSUMPTION : la garde est une bibliothèque commune de la plateforme appelée par les interfaces des modules, non un service à part ni un intergiciel dans l'IA ; à confirmer dans l'architecture. Ferme le trou T-17 pour le mécanisme.]`

#### FR-89 : Le registre de l'IA, sa durée et son effacement

Chaque action de l'IA est inscrite au **registre de l'IA** de l'instance : entrée (références), sortie, niveau, version, confiance, sources, statut, auteur de la décision, **sans** contenu médical ni texte libre. Le registre est **la trace opposable** ; le **contexte brut** d'une demande de langage est purgé à échéance courte (FR-38). **Propriétaire** : le module `ia`, **pour le compte de l'organisation** ; il est sa donnée, lisible par elle, exporté par la route C13. **Durée** : `ia.retention_registre_annees` (dix ans, comme le journal de l'assurance) ; une organisation qui demande l'**effacement** obtient celui du registre **sous réserve** de l'obligation de conservation du métier concerné, **dite** dans la réponse ; la **pseudonymisation** remplace l'identité d'un acteur sans casser la chaîne. Un test compare les propositions affichées et les entrées du registre.

**Conséquences (testables) :**
- Pour chaque proposition affichée, il existe une entrée de registre ; pour chaque entrée, une proposition (test de rapprochement).
- Le registre est **en ajout seul** ; le chaînage détecte une altération.
- Une demande d'effacement d'organisation supprime la calibration, le journal des écarts et les propositions, et rend la liste de ce qui est conservé, avec la durée et la raison.
- `[ASSUMPTION : dix ans partout, aligné sur le journal de l'assurance, faute de durée fixée ailleurs ; propriétaire = module `ia` pour le compte de l'organisation. Ferme le trou T-05 ; à valider par le juriste (trou T-16).]`

---

## 10. Le catalogue des capacités

Cette section décrit ce que l'IA commune **fait** pour les quatre logiciels : le cabinet d'expert-comptable, le distributeur, la microfinance et l'assurance. L'IA expose des **capacités**, versionnées et regroupées en **dix-neuf familles**. Une capacité est un service précis (« la probabilité qu'une facture soit payée », « la lecture d'une carte grise ») ; une famille réunit les capacités de même nature, demandées par plusieurs logiciels. Le noyau d'une famille est neutre ; chaque logiciel lui donne son **vocabulaire** (le « score de santé d'un point de vente » du distributeur et le « score du dossier » de la microfinance sont deux vocabulaires d'une même famille).

Pour chaque famille, la section donne : ce que la capacité prend, ce qu'elle rend, à qui, son garde-fou, son niveau au premier jour (voir FR-91), ses objectifs mesurés (voir FR-92) et un tableau « logiciel | usage | FR d'origine | vocabulaire ». Les « FR d'origine » sont les exigences des PRD des logiciels (distributeur, microfinance, assurance), du PRD de l'assistant d'août (« PRD-AIA ») ou du PRD de l'atelier de balance (« AB »), qui demandaient déjà la capacité. La section se termine par le tableau de contrôle (FR-130) qui relie chacune des 95 capacités recensées à son FR.

Les règles qui s'appliquent à toutes les capacités (l'IA propose et l'humain décide, la provenance, l'IA jamais bloquante, l'équité, la santé) sont posées au §4 ; elles sont rappelées ici seulement quand une famille les durcit.

#### FR-90 : Chaque capacité est déclarée, versionnée, et porte un vocabulaire par logiciel

Une capacité existe quand elle est **inscrite au catalogue de l'IA** avec : un code stable, une version, une famille, ses entrées (les faits qu'elle lit), sa sortie (le type de proposition qu'elle rend, voir le contrat du §4), le public qui la reçoit, son garde-fou, son niveau (FR-91), ses objectifs (FR-92), sa **vérité terrain** (l'événement qui tranche un désaccord entre l'IA et l'humain, et son horizon ; voir §7) et un **vocabulaire par logiciel** (libellés, unités, seuils affichés). Un module métier ne peut appeler que les capacités qu'il **déclare** dans la clause C11 de son manifeste ; il peut y déclarer une capacité servie par une « règle v0 » sans le mot « modèle » (cela lève la contradiction du distributeur, dont l'annexe A nommait des modèles alors que son PRD dit « règle, pas IA »). Les droits sont ceux de l'utilisateur qui demande : une capacité ne lit jamais plus que lui.

**Conséquences (testables) :**
- Un appel à une capacité que le module appelant n'a pas déclarée en C11 est refusé avec le code `CAPACITE_NON_DECLAREE`.
- Le catalogue expose, pour chaque capacité : code, version, famille, niveau courant, vocabulaire par logiciel ; une capacité sans famille ou sans objectif (FR-92) ne peut pas être publiée.
- Deux versions d'une même capacité peuvent coexister ; chaque proposition inscrit la version utilisée (provenance, §4).
- La clause C11 accepte la valeur de niveau `REGLE` (règle v0) ; un manifeste qui déclare `REGLE` n'est pas refusé faute de modèle.
- Une capacité sans vérité terrain déclarée (événement et horizon) ne peut pas être publiée.
- Une capacité appelée avec les droits d'un utilisateur ne rend aucun fait que cet utilisateur ne pourrait pas lire lui-même (test : même appel avec deux rôles, résultats différents).

#### FR-91 : Le niveau d'une capacité au premier jour : règle, modèle commun, modèle du client

Chaque capacité a trois niveaux possibles (décision D6) : **N0** une règle experte explicable, paramétrée par pays et par logiciel, toujours présente et qui sert aussi de repli ; **N1** un modèle commun pré-entraîné par Money Vibes (données publiques, synthétiques ou de démonstration), là où il existe ; **N2** une calibration ou un modèle propre au client, quand un seuil de données mesuré pour cette capacité est atteint. **Au premier jour, toutes les capacités sont servies au moins en N0.** Les capacités de langage (rédiger, résumer, lire une pièce, répondre à une question) sont servies dès le premier jour par un **modèle de langage** (N1, origine `LANGAGE`) ; pour les scores et les prévisions, le premier modèle commun n'est pas promis avant le second semestre 2027 [ASSUMPTION: calendrier de la note de vision du 10 novembre, « au mieux au deuxième semestre 2027 » ; aucun score ni aucune prévision n'est donc annoncé comme « IA » au premier jour]. Le mot « IA » ne s'affiche que pour N1 et N2 ; N0 se présente comme « règle », avec son nom et sa version.

**Conséquences (testables) :**
- Chaque proposition affiche son niveau : « règle », « modèle commun » ou « modèle de votre structure », avec version et date.
- Une capacité de score ou de prévision servie en N0 n'affiche jamais le mot « IA » (test d'interface sur les quatre logiciels).
- Le passage de N0 à N1, ou de N1 à N2, se fait capacité par capacité et seulement si la nouvelle version bat la version en place sur les objectifs de la capacité (FR-92) sans régression d'équité.
- Sous le seuil de données de la capacité (paramètre `ia.seuil.donnees.<capacite>`), la capacité reste en N0 et le dit (« non évalué » ou « règle v0 »).
- Si le niveau N1 ou N2 est indisponible (modèle coupé, serveur trop petit), l'appel retombe sur N0 et la réponse porte le niveau réellement servi.

#### FR-92 : Chaque capacité a des objectifs mesurés, et un rapport mensuel

Chaque capacité déclare ses **objectifs** selon quatre axes (décision D8) : la **qualité** (précision, rappel, calibration), l'**usage** (taux de propositions acceptées, modifiées, rejetées), l'**effet métier** (ce que le logiciel gagne : baisse du retard de paiement, délai d'un sinistre, taux de recouvrement, temps gagné) et l'**équité** (écart entre groupes). Le PRD fixe les indicateurs, famille par famille, dans les FR qui suivent ; les **cibles chiffrées sont des paramètres** (`params-w3.md`, codes `ia.objectif.*`) que Money Vibes et le client règlent. Un rapport est produit chaque mois par capacité et par client, et un rapport global par Money Vibes. Un taux d'acceptation très élevé n'est pas un succès : au-delà du seuil `ia.objectif.acceptation_facade_pct` sur 30 jours, la capacité est signalée « validation de façade » à l'auditeur du client.

**Conséquences (testables) :**
- Le rapport mensuel d'une capacité donne, pour la période : volume de propositions, taux accepté / modifié / rejeté / expiré, motifs d'écart les plus fréquents, indicateur de qualité, indicateur d'effet métier, indicateur d'équité, niveau servi.
- Une nouvelle version n'est promue que si, sur le jeu d'évaluation de la capacité, elle bat la version en place sur l'indicateur de qualité et ne dégrade aucun indicateur d'équité au-delà de `ia.objectif.equite_regression_max`.
- Le rapport d'un client (instance locale) ne contient que les données de ce client ; le rapport global ne contient que des agrégats (seuil d'effectif minimal du §8).
- Un taux d'acceptation supérieur à `ia.objectif.acceptation_facade_pct` pendant 30 jours déclenche une alerte à l'auditeur et la mention « à vérifier : validation de façade » dans le rapport.
- Pour chaque capacité, le rapport mensuel compare, quand l'humain s'est écarté de la proposition, la proposition de l'IA et la décision humaine à la **vérité terrain** constatée à l'horizon déclaré (détail et conservation au §7) ; ce rapport est une donnée vendable au client.
- Les cibles sont lues des paramètres : changer une cible ne demande aucun déploiement.

### 10.1 Famille 1 : le score de risque ou de santé d'un tiers

Un score sur un tiers (client, dossier de crédit, point de vente, prospect, fournisseur, groupe solidaire, épargnant). Il prend des faits que le module consommateur lui donne, il rend une note de 0 à 100 avec ses **facteurs** et leur poids, une classe et, quand le logiciel le prévoit, une décision suggérée. Il est reçu par le commercial, le directeur financier, le chargé de clientèle, le comité de crédit. Niveau au premier jour : **N0** (règle v0) pour toutes les capacités de la famille ; N1 plus tard.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : quand l'agent de crédit accorde un prêt que la règle ou l'IA jugeait non solvable (ou refuse un prêt qu'elle jugeait sûr), la réalité qui tranche est le **comportement de remboursement** : retards d'échéance et portefeuille à risque (PAR 30) du prêt à 3, 6 et 12 mois ; pour le distributeur, la facture payée ou non à l'échéance et le retard constaté ; pour un point de vente, l'évolution de ses achats à 90 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | aide à la décision de crédit client (signaux rouges) | FR-140 ; A.2 C11 | « signaux », « rendement », plafond de crédit |
| distributeur | note fournisseur explicable | FR-60, FR-65 ; A.3 C11 | note 0-100 avec poids |
| distributeur | score de santé d'un point de vente ; score de prospect | FR-177, FR-184, FR-77 ; A.15, A.5 C11 | « santé du point de vente », « score de prospect » |
| microfinance | score du dossier 0-100 (paiement 40, capacité 30, activité 20, terrain 10), classe, décision suggérée | FR-49, FR-34, FR-124 | « score du dossier », « classe de risque » |
| microfinance | score client dynamique ; notation de risque de blanchiment | FR-124, FR-8 | « score client », « note LBC » |
| microfinance | cohésion d'un groupe solidaire ; score de fidélité de l'épargnant | FR-74, FR-126 ; FR-131 | « cohésion », « fidélité » |
| assurance | aucun score de tiers (le score de fraude et la note de qualité de dossier sont dans les familles 5 et 4) | — | sans objet |
| cabinet | cibles scorées explicables des règles d'automatisation | FR-IA29 à FR-IA33 | « score de cible » |

#### FR-93 : Un score est une note expliquée, avec sa règle v0, puis un modèle sous le même contrat

La capacité « score d'un tiers » prend les faits du tiers et les paramètres de barème portés par la demande (le module consommateur refuse une proposition dont la version de paramètres diffère de la sienne). Elle rend : la note 0-100, **chaque facteur avec son poids et sa contribution**, la classe, la provenance (« règle v0 » ou modèle, version, date) et, pour le dossier de crédit, la décision suggérée parmi quatre valeurs. Les barèmes sont ceux des logiciels : le dossier de microfinance se décompose en paiement 40, capacité 30, activité 20, terrain 10 ; la santé d'un point de vente est plafonnée à 45 si une créance échue dépasse 30 jours ; la note d'un fournisseur pondère prix, délai réel, fiabilité, dette, franco. Le chiffre de barème n'est jamais en dur dans le code : il est un paramètre du logiciel. Un score sans provenance n'est pas affiché (« non évalué ») ; un score de plus de `ia.score.peremption_jours` jours est marqué « périmé ». Un premier emprunteur n'a pas de composante « paiement » : elle est absente et le dit. Le modèle, quand il viendra, ne changera ni la note de la règle ni ses facteurs : il propose sa note à côté, sous le même contrat.

**Conséquences (testables) :**
- Pour chaque score rendu, la somme des contributions des facteurs égale la note (à l'arrondi près) ; un score sans facteurs est refusé par le contrat.
- Un score dont la provenance (règle ou modèle, version, date) est absente est rendu « non évalué » et n'est pas affiché comme un chiffre.
- Un score plus ancien que `ia.score.peremption_jours` est affiché « périmé » et ne sert pas de critère de tri dans les files.
- Pour un emprunteur sans historique de paiement, la composante « paiement » est omise, la mention « absente » est rendue et la note est calculée sur les trois autres composantes renormalisées [ASSUMPTION: renormalisation des poids restants ; la règle du PRD microfinance dit seulement « composante paiement absente »].
- Deux appels identiques à la même version de règle rendent la même note (déterminisme du N0).
- Objectifs : qualité = calibration (écart entre la probabilité annoncée et la fréquence constatée, `ia.objectif.score.calibration_ecart_max`) ; usage = taux de décisions humaines conformes à la décision suggérée ; effet métier = variation du retard de paiement du portefeuille noté (`ia.objectif.score.effet_retard_pct`) ; équité = FR-94.

#### FR-94 : Tout score sur une personne a une liste fermée de variables et un suivi d'équité

Pour tout score qui note une **personne** (un emprunteur, un épargnant, un membre de groupe, un assuré, un gérant de point de vente), seules les variables d'une **liste fermée**, validée avec le logiciel, sont autorisées. Le genre, la situation matrimoniale, la nationalité et la religion sont **interdits** ; le nom et le quartier sont audités comme variables de substitution. Un indicateur d'équité est calculé chaque mois par groupe protégé et inscrit au rapport (FR-92). Cette règle, écrite au départ pour la microfinance et pour le score de fraude de l'assurance, est **généralisée aux quatre logiciels**, distributeur et cabinet compris, qui ne la portaient pas (décision D11).

**Conséquences (testables) :**
- Une règle ou un modèle qui lit une variable hors de la liste fermée est refusé à la publication (`VARIABLE_NON_AUTORISEE`) ; la liste est portée par le logiciel et versionnée.
- Les variables interdites n'apparaissent dans aucune entrée de score, y compris en substitut direct (test sur le jeu d'entrées d'un modèle).
- Le rapport mensuel d'équité de chaque score contient l'écart de note et de décision suggérée entre groupes, et le dépassement de `ia.objectif.equite_regression_max` bloque la promotion d'une version.
- Une personne notée peut obtenir, par le logiciel, le motif de la décision humaine qui l'a concernée et présenter ses observations (art. 27 de la loi 2019-014 ; le droit est outillé au §4).
- Le logiciel distributeur est refusé à la publication d'un score de personne sans liste fermée déclarée.

#### FR-95 : Un score est une information : il ne refuse pas, ne bloque pas et ne fixe pas de prix

Aucun score de la famille ne produit à lui seul un refus, un blocage ou un tarif. Le score du dossier de microfinance est une **information et une alerte**, jamais un blocage ni un levier de prix en version 1 ; le plafond de crédit d'un client du distributeur n'est pas négociable par l'IA ; l'aide à la décision de crédit n'accorde ni ne refuse. Le rapport du responsable des risques (perte attendue, conditions recommandées) reste dans les bornes du produit, de l'usure et du taux d'effort ; l'écart d'un humain avec la proposition est renvoyé comme **correction**, avec son motif ; un écart répété déclenche une alerte à l'auditeur. Le blocage, le contentieux et la perte ne sont jamais décidés par un modèle.

**Conséquences (testables) :**
- Aucun appel de la famille ne modifie le statut d'un dossier, d'un client ou d'une commande ; seules les décisions humaines (écrites par le module consommateur) le font.
- Un humain qui s'écarte de la décision suggérée est invité à saisir un motif ; sans motif la décision est refusée au-dessus du seuil `ia.ecart.motif_obligatoire` [ASSUMPTION: motif obligatoire dès le premier écart pour le crédit].
- Un motif proposé par l'IA n'est jamais repris d'un clic ; il est seulement affiché comme suggestion.
- Un écart répété (même acteur, même type, au-delà de `ia.ecart.alerte_audit_nb` en 30 jours) crée une alerte pour l'auditeur du client.
- Si la capacité est coupée, le dossier avance sur l'analyse humaine et l'emplacement du score affiche « non disponible ».

### 10.2 Famille 2 : probabilité de paiement et de recouvrement, relances

La probabilité qu'une créance ou une proforma soit payée, la priorité des relances et le canal. Elle prend le retard, les promesses, les paiements partiels, le score du tiers (famille 1) ; elle rend une probabilité 0-100 étiquetée « estimation », une valeur espérée, une file triée et une action recommandée. Elle est reçue par le responsable du recouvrement, le directeur financier, le gestionnaire de portefeuille. Niveau au premier jour : **N0** ; le modèle de langage rédige les messages (famille 8).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la facture ou l'échéance **payée ou non**, et le délai effectif de paiement, à 30 jours (recouvrement) ; pour la proforma, la commande passée ou non à 15 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | probabilité d'acceptation d'une proforma ; suggestion de relance | FR-55 ; A.2 C11 | « probabilité d'acceptation » |
| distributeur | probabilité de recouvrement, valeur espérée, prévision d'encaissement 30 jours | FR-117, FR-120 ; A.9 C11 | « probabilité de recouvrement », groupes « quasi certain » à « à provisionner » |
| distributeur | file du jour et choix du canal | FR-120, FR-114 | « file de recouvrement », « échelle d'escalade » |
| microfinance | probabilité de défaut et classe estimée | FR-125 | « probabilité de défaut » |
| microfinance | score de recouvrement et probabilité de récupérer sous 30 jours | FR-227 | « score de recouvrement » |
| microfinance | relances par profil de retard, canal, moment | FR-226 | « palier de relance » |
| assurance | recours : évaluation de l'offre adverse (voir famille 7) | FR-120 | sans objet pour cette famille |
| cabinet | sans objet | — | — |

#### FR-96 : La probabilité de paiement ou de recouvrement est une règle versionnée, puis un modèle sous le même contrat

La capacité rend une probabilité (5 à 98 pour le recouvrement) à partir du retard, de la provision, du paiement partiel et du **score du tiers** ; sans score du tiers, l'ajustement vaut 0 et la réponse le dit. La règle v0 du noyau (celle du PRD distributeur, `0,25 × (score − 60)` appliqué au score) sert aussi la microfinance ; un modèle viendra sous le même contrat sans changer le score ni les facteurs. Le résultat porte « règle, version, date ». La probabilité de défaut et la classe estimée de la microfinance ne bloquent ni n'accordent un octroi, un décaissement ou une provision comptabilisée. Deux scores de client existent aujourd'hui (celui du point de vente du distributeur, celui de la microfinance) : l'IA commune les sert comme **deux capacités distinctes**, sans définition commune au premier jour (le croisement entre logiciels est de l'horizon, §13).

**Conséquences (testables) :**
- Une probabilité est toujours entre les bornes de la règle (5 et 98 pour le recouvrement) et est libellée « estimation ».
- Sans score du tiers, l'ajustement vaut 0 et la mention « sans score du tiers » est rendue.
- Les coefficients et seuils (groupes, seuil de contentieux de 40) sont des paramètres du logiciel (`ia.recouvrement.*`).
- Aucun statut de crédit, de dossier ou de provision ne change du fait de l'appel.
- Objectifs : qualité = calibration (probabilité annoncée contre taux de recouvrement constaté à 30 jours) ; effet métier = taux de recouvrement à 30 jours (`ia.objectif.recouvrement.taux_30j_pct`) ; usage = taux de relances suivies.

#### FR-97 : La file de relances est triée par valeur espérée, avec action et canal, sans jamais décider du blocage

La capacité trie la file du jour par **valeur espérée** (montant × probabilité), choisit l'action (relance, promesse à obtenir, visite, contentieux proposé), le canal et le moment, dans la **capacité de traitement par jour** de l'équipe. Pour la microfinance elle ajoute le profil de retard, la probabilité de succès par canal et un message pré-rédigé ; les relances ne sortent **jamais hors du calendrier de l'IMF** et les paliers « à valider » sont validés par le gestionnaire de portefeuille. **Le blocage de crédit suit la règle chiffrée du logiciel, jamais le modèle seul.** Le distributeur s'arrête à la règle et à l'échelle d'escalade.

**Conséquences (testables) :**
- La file rendue est triée par valeur espérée décroissante, chaque ligne porte l'action, le canal et le motif en une phrase.
- Aucune relance ne part sans la validation que le logiciel exige pour son palier ; une relance hors calendrier est refusée (`HORS_CALENDRIER`).
- Le nombre de lignes d'une file ne dépasse pas la capacité de traitement paramétrée (`ia.recouvrement.capacite_jour`).
- Un blocage de crédit ne peut être déclenché que par la règle chiffrée du logiciel ; une proposition de la capacité ne contient jamais l'ordre de blocage.
- Sans l'IA (capacité coupée), la file est triée par l'ancienneté du retard et l'emplacement le dit.

#### FR-98 : La stratégie de recouvrement et les scripts de relance sont des projets modifiables

Pour la microfinance, la capacité prépare un **projet de stratégie de recouvrement par agence**, une analyse du comportement de retard et des **scripts de relance** (gabarits sans modèle de langage, ou rédigés par modèle de langage, famille 8). Le responsable valide, modifie ou écarte ; le blocage, le contentieux, la perte et l'étalement ne sont **jamais décidés par un modèle** ; aucun blocage d'agence n'est proposé.

**Conséquences (testables) :**
- Un projet de stratégie est créé au statut « proposée » ; il ne devient « appliquée » que par la décision d'un humain (décideur typé `HUMAIN`).
- Aucune proposition de la capacité ne contient les actions « bloquer », « passer en perte », « engager un contentieux » ou « étaler » comme décision ; elles peuvent y figurer comme options à examiner.
- Un script de relance sans modèle de langage vient de la bibliothèque de gabarits du palier ; avec modèle, il est étiqueté « rédigé par modèle ».
- Le Copilot de recouvrement (FR-115) ne peut pas envoyer de relance ; il rend un script et ses sources.

### 10.3 Famille 3 : lecture de pièces

Extraire, classer et pré-remplir à partir d'une pièce (scan, photo, PDF, e-mail, message). Le détail de la chaîne (reconnaissance de caractères, lecture, classement) est au §12 ; ici, la capacité telle que les logiciels l'appellent. Elle prend un fichier ; elle rend le type de la pièce, les champs lus avec **un extrait source et une confiance par champ**, le rattachement à la pièce attendue ; niveau de proposition **EXTRACTION**, jamais une validation. Reçue par l'accueil, le gestionnaire, le comptable, l'agent de crédit. Niveau au premier jour : **N1** (lecture par modèle de langage sur le texte reconnu) avec repli **N0** (reconnaissance de caractères et règles de classement).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : le champ **confirmé ou corrigé par l'humain** puis, pour une pièce utilisée dans un calcul, la valeur retenue en fin de dossier ; horizon : à la clôture du dossier.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| assurance | lecture et classement des pièces (OCR réel, PDF sans couche texte) | FR-164, FR-163, AD-23 | « usage n° 2 », « pièce attendue » |
| assurance | pré-remplissage de l'instruction | FR-56 | « formulaire technique » |
| assurance | déclaration assistée (message, e-mail, courrier numérisé ; jamais l'appel) | FR-35, FR-10 | « déclaration pré-remplie » |
| microfinance | score de lecture d'une pièce d'identité (KYC) | FR-120 | « score de lecture » |
| cabinet | OCR des statuts et de la carte d'immatriculation vers le profil de société | FR-A02 (AB) | « profil société » |
| cabinet | OCR de captures et de factures (cahiers de recettes et de dépenses) | FR-A08 à FR-A10, NFR-A05, FR-A16, FR-A27 (AB) | « recettes », « dépenses », « niveau de confiance » |
| cabinet | assistance à la revue KYC | note d'architecture §6 ; PRD EC | « synthèse déclaré / lu » |
| distributeur | lecture d'un message de commande reçu par messagerie : bientôt | FR-38 | « commande depuis un message » |

#### FR-99 : La lecture d'une pièce extrait, classe et pré-remplit, sans jamais valider ni rejeter

La capacité rend, pour une pièce : son **type**, les **champs** lus, pour chaque champ l'**extrait source** (la zone du document) et une **confiance**, le **rattachement** à la pièce attendue du dossier, et un score de lecture global. C'est une proposition de niveau EXTRACTION : l'humain relit et confirme ; la capacité **ne rejette aucune pièce** et ne valide aucune identité. Les champs que la lecture n'a pas extraits restent à saisir à la main ; la saisie reste toujours modifiable et n'est jamais figée sur la lecture seule. Pour la comptabilité, la hiérarchie de preuve s'applique (bancaire, puis facture, puis reçu ou lecture, puis estimation). L'assistance à la revue KYC du cabinet et le score de lecture de la microfinance sont des usages de la même capacité ; la revue KYC reste manuelle.

**Conséquences (testables) :**
- Un champ rendu sans extrait source est refusé par le contrat de proposition.
- La capacité ne change le statut d'aucune pièce ; la confirmation par un humain est écrite par le module consommateur avec le décideur `HUMAIN`.
- Une pièce non reconnue (type inconnu ou confiance sous `ia.lecture.confiance_minimale`) est rendue « à classer à la main », sans refus.
- Un champ dont la valeur est modifiée par l'humain est renvoyé à la capacité comme correction (écart, FR-92).
- Objectifs : qualité = taux de champs exacts par type de pièce (`ia.objectif.lecture.champs_exacts_pct`) ; usage = taux de champs conservés tels quels ; effet métier = temps de saisie gagné par dossier.

#### FR-100 : Un message entrant est lu comme une pièce : déclaration assistée, commande, lead

Un message reçu (message de messagerie, e-mail, courrier numérisé) est lu par la capacité : en assurance, pour **pré-remplir la déclaration** avec une confiance par champ et les questions à poser ; en distributeur, pour **proposer des lignes de commande** (bientôt) ; en microfinance et en distributeur, pour **qualifier un lead** par un chatbot (bientôt, §11). **L'appel téléphonique n'est jamais lu** : l'accueil saisit pendant l'appel, sans voix.

**Conséquences (testables) :**
- Une déclaration assistée est créée en brouillon ; elle ne devient un sinistre que par la validation d'un agent.
- La capacité n'accepte pas de fichier audio au premier jour (`FORMAT_NON_SUPPORTE`).
- La lecture des commandes par message et le chatbot de qualification de leads sont affichés comme « bientôt » avec le bouton prévu, sans appel réel.
- La lecture dépend du connecteur de réception du module de notification ; s'il est absent, la capacité rend « non installé ».

### 10.4 Famille 4 : contrôle de cohérence, de complétude et de saisie

Le contrôle d'un dossier, d'une pièce ou d'une saisie contre les règles et contre le portefeuille. Elle prend les pièces, le dossier, le panier habituel, les écritures ; elle rend des **incohérences** avec gravité et action proposée. Elle **signale sans bloquer** (sauf la règle déterministe du logiciel qui, elle, peut bloquer). Reçue par le gestionnaire, le saisisseur de commande, le comptable, le conformité. Niveau au premier jour : **N0** règles ; le volet « assistance » est N1.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'anomalie **confirmée ou écartée** par le gestionnaire ou, au cabinet, par l'expert-comptable ; horizon : à l'instruction du dossier, ou à la clôture de l'exercice pour la balance.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| assurance | cohérence des pièces et photo réutilisée | FR-53 | « incohérence », « photo déjà utilisée » |
| assurance | complétude d'un rapport d'expertise (forme, jamais le fond) | FR-64 | « points manquants » |
| assurance | note de qualité du dossier avec constats certains / probables | FR-209 | « qualité du dossier » |
| distributeur | détection d'erreur de commande | A.1 C11 (`detection-erreur-commande`) | « alerte de saisie » |
| microfinance | score de conformité, alertes réglementaires avec délai | FR-190 | « score de conformité » |
| cabinet | anomalies de balance (assistance aux contrôles déterministes) | note d'architecture §6 ; FR-A25, FR-A26 (AB) ; FR-F62 à FR-F66 | « incohérence », « compte suspect » |

#### FR-101 : Le contrôle de cohérence d'un dossier signale, avec gravité et action, et ne bloque pas

La capacité compare les pièces entre elles et avec le portefeuille (propriétaire de la carte grise, dates, photo déjà utilisée), contrôle la **forme** d'un rapport d'expertise (jamais le fond), note la **qualité** d'un dossier en distinguant les constats **certains** et **probables**, et assiste les contrôles d'intégrité de la balance. Elle rend une liste d'anomalies avec gravité, la pièce ou l'écriture concernée et l'action proposée. Un signalement n'est **pas une accusation** ; il intervient avant l'instruction et le paiement. La note de qualité n'est **jamais** un critère de décision automatique. Une anomalie bloquante de balance bloque la validation par la **règle déterministe** du logiciel, pas par l'IA.

**Conséquences (testables) :**
- Chaque anomalie rendue porte : code, gravité, objet concerné (pièce, écriture, ligne), action proposée, source.
- L'appel de la capacité ne bloque aucune transition du dossier ; seule une règle déterministe du logiciel peut le faire.
- Le contrôle de complétude d'un rapport d'expertise ne rend aucun jugement sur le fond (test : un rapport complet en forme et faux sur le fond n'est pas signalé).
- La note de qualité n'est lisible dans aucun critère d'affectation ou de décision automatique (test de non-usage dans les règles d'automatisation).
- Objectifs : qualité = part d'anomalies confirmées par l'humain ; effet métier = anomalies détectées avant paiement ; usage = taux de signalements classés « sans suite » avec motif.

#### FR-102 : Le contrôle de saisie et de conformité alerte, sans empêcher

Pour le distributeur, la capacité compare une commande saisie au panier habituel du point de vente et alerte sur une ligne atypique ; pour la microfinance, elle calcule un **score de conformité** 0-100 décomposé et des alertes réglementaires avec leur délai d'action, et propose un commentaire du rapport réglementaire. Les **chiffres** du rapport viennent des moteurs déterministes et du cœur du client, **jamais du modèle** ; la capacité n'invente aucune valeur, et ne valide, ne signe ni ne dépose jamais un rapport.

**Conséquences (testables) :**
- Une alerte de saisie ne bloque pas l'enregistrement de la commande ; le journal garde la prédiction et la correction.
- Le commentaire d'un rapport réglementaire ne contient que des chiffres présents dans les données d'entrée (test : tout nombre du texte se retrouve dans les entrées ; sinon refus `CHIFFRE_NON_SOURCE`).
- Le score de conformité affiche sa décomposition et les délais d'action des alertes.
- Aucune capacité de cette famille ne dépose ni ne signe de rapport.

### 10.5 Famille 5 : détection d'anomalie et de fraude

Un signal sur un comportement inhabituel : caisse, dossier, paiement, traces d'audit, client actif, groupe. Elle prend le journal, les mouvements, les dossiers, le portefeuille ; elle rend une alerte (code, gravité, règle ou modèle, lignes concernées). Reçue par l'auditeur, le responsable, le directeur financier. Niveau au premier jour : **N0** (règles à signaux) ; le graphe de liens est N1 (calcul sur le portefeuille).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la **fraude confirmée ou écartée** à l'issue de la revue humaine (assurance, caisse, piste d'audit) ; horizon : à la clôture de la revue, et à 12 mois pour les cas restés sans suite.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| microfinance | fraude, conformité et comportement de crédit | FR-98 | « alerte », « note de comportement » |
| microfinance | anomalies et fraude de caisse | FR-148 | « écart de caisse » |
| microfinance | anomalies opérationnelles et corrélation d'événements de la piste d'audit | FR-194 | « anomalie de la piste d'audit » |
| microfinance | signaux faibles d'un client actif | FR-126 | « signal faible » |
| assurance | graphe des liens entre dossiers ; score de fraude à 9 signaux | FR-132, FR-127, §5.12 | « graphe des liens », « revue de fraude » |
| distributeur | fraude sur espèces : bientôt | Hors-périmètre ; A.8 C11 | « bientôt » |
| cabinet | comptes suspects de la balance (famille 4) | note d'architecture §6 | sans objet ici |

#### FR-103 : Un signal n'est pas une accusation : il ouvre une revue humaine

La capacité rend des alertes avec code, gravité, règle ou modèle et lignes concernées. Elle **n'accuse, ne sanctionne ni ne suspend personne** ; elle **ne refuse jamais** un client ou un dossier. Une alerte critique prévient l'auditeur et le responsable, sans bloquer. La microfinance étend la famille à la caisse (« pas une accusation » : aucun agent n'est sanctionné ni suspendu), à la piste d'audit et aux **signaux faibles** d'un client actif (seuil calibré sur le client, défaut 0,7). Le **motif de clôture** d'une alerte (faux positif, confirmée, sans suite) est renvoyé à la capacité comme correction. Le distributeur n'a aucune détection de fraude au premier jour ; la fraude sur espèces est « bientôt ».

**Conséquences (testables) :**
- Aucune alerte ne change le statut d'une personne, d'un compte ou d'un dossier ; seul l'humain le fait.
- Une alerte classée sans suite exige un motif, renvoyé au journal de la capacité.
- Le seuil d'alerte des signaux faibles est un paramètre du client (`ia.alerte.signal_faible_seuil`, défaut 0,7).
- Une alerte critique crée une notification pour l'auditeur et le responsable et n'interrompt aucun circuit.
- Sans l'IA, aucune alerte de signaux faibles n'est produite et l'emplacement le dit ; les alertes par règle du logiciel restent.
- Objectifs : qualité = taux de faux positifs (motifs « faux positif » / alertes) ; effet métier = montant ou nombre de cas confirmés détectés avant paiement ; équité = FR-94 pour les alertes sur des personnes.

#### FR-104 : Le graphe des liens de l'assurance ouvre une revue, sans modifier le score

Pour l'assurance, la capacité construit à la demande un **graphe de dossiers liés** sur un portefeuille de douze mois : témoins, garages, photos, téléphones, véhicule, bénéficiaire, compte, avec l'entité commune et la source de chaque lien. Le **score de fraude** est un calcul de règles à neuf signaux, distinct du graphe ; **le graphe ne modifie pas le score**. Le score peut suspendre un ordre de règlement, par la règle de garde-fou du logiciel, jamais par l'IA. Aucun champ de santé n'entre dans le graphe ; la consultation est journalisée ; la liste de variables est fermée et exclut toute variable discriminante.

**Conséquences (testables) :**
- Pour un dossier, le graphe liste les dossiers liés avec l'entité commune et la source du lien ; un lien sans source est refusé.
- Le score du dossier est identique avec ou sans appel du graphe (test).
- Aucun champ classé santé n'est lu ni affiché par la capacité (test sur un dossier corporel).
- Chaque consultation du graphe écrit une ligne au journal des accès (utilisateur, dossier, date).
- Le graphe est affiché aux rôles autorisés (audit, responsable, direction, relecteur de la revue) et refusé aux autres (`ROLE_NON_AUTORISE`).

### 10.6 Famille 6 : prévision

Prévoir la trésorerie, le chiffre d'affaires, la demande, l'encours, le retard de portefeuille. Elle prend les historiques, les échéances, la saisonnalité ; elle rend une prévision avec **intervalle ou scénarios**, une précision mesurée et la provenance. Reçue par le directeur financier, la direction, le responsable de portefeuille. Niveau au premier jour : **N0** (moyenne glissante, saisonnalité, règle de trésorerie), libellée « règle ». Aucune prévision n'est un chiffre officiel.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la **valeur réalisée** (trésorerie, chiffre d'affaires, demande, PAR, encours) comparée à la prévision à son échéance ; horizon : 7 jours, 1, 3 et 6 mois selon la capacité.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | réapprovisionnement proposé (quantité, impact trésorerie) | FR-61, FR-63 à FR-66 ; A.3 C11 | « réapprovisionnement », plancher de trésorerie |
| distributeur | trésorerie à 7 jours, prévision glissante de chiffre d'affaires (3 mois, scénarios BASE / HAUT / BAS) | FR-137, FR-154 ; A.15 C11 | « prévision de trésorerie », « prévision de CA » |
| microfinance | trésorerie à 7 jours, rééquilibrage entre agences, perte attendue (Copilot du directeur financier) | FR-149, FR-254 | « prévision de trésorerie », « rééquilibrage » |
| microfinance | prévision du retard de paiement (PAR) à 1, 3, 6 mois, perte attendue, coût du risque | FR-181, FR-176, FR-173 | « prévision du PAR », « scénarios » |
| microfinance | prévision d'encours d'épargne ; PAR par zone à 30/60/90 jours | FR-131 ; FR-243 | « encours prévu » |
| assurance | simulation de charge (famille 17) | FR-209 | sans objet ici |
| cabinet | analyse financière (ratios, tendances) ; prévision de l'historique (plus tard) | note d'architecture §6 ; EPIC-013 ; PRD-AIA §5.3 | « points d'attention » |

#### FR-105 : La prévision de trésorerie et de chiffre d'affaires est une règle versionnée avec sa précision mesurée

La capacité prévoit la trésorerie à sept jours (échéances fournisseurs, encaissements attendus, historique) et le chiffre d'affaires glissant à trois mois, en trois scénarios (base, haut, bas), sur **règle de trésorerie ou de prévision, version, date**. Elle rend le pic de sortie, la précision mesurée sur l'historique et, **sans historique suffisant (douze mois pour la saisonnalité), la mention « précision non mesurée »** : aucune précision de repli n'est affichée. Le **plancher de trésorerie du logiciel est non contournable** par la prévision : une commande suggérée qui le franchirait n'est pas proposée. Pour la microfinance, la projection de trésorerie sur sept jours donne une fourchette et une suggestion de rééquilibrage (source, destinataire, montant) ; **Prospera ne déplace aucun fonds** (l'exécution est « bientôt ») et le calcul porte sur les données lues du cœur du client.

**Conséquences (testables) :**
- Chaque prévision porte sa provenance, un intervalle ou trois scénarios, et la date du calcul.
- Sans douze mois d'historique, la précision est rendue « non mesurée » et aucun pourcentage par défaut n'est affiché.
- Une proposition de réapprovisionnement qui ferait passer la trésorerie prévue sous le plancher paramétré du logiciel n'est pas rendue ; elle est rendue « bloquée par le plancher de trésorerie ».
- Aucun appel de la capacité ne crée de mouvement de fonds.
- Objectifs : qualité = erreur absolue moyenne en pourcentage mesurée à l'échéance (`ia.objectif.prevision.erreur_max_pct`) ; effet métier = jours de rupture ou de trésorerie négative évités ; usage = taux de commandes suggérées acceptées.

#### FR-106 : La prévision du retard de portefeuille et de l'épargne donne deux scénarios, « sans action » et « avec actions »

Pour la microfinance, la capacité prévoit le **PAR** (portefeuille à risque) à un, trois et six mois, par agence, par zone (30, 60, 90 jours) et par secteur, la **perte attendue**, le coût du risque, le secteur moteur, l'analyse des provisions, et l'**encours d'épargne** à un et trois mois. Elle rend **deux scénarios** (sans action, avec les actions proposées) et l'écart entre eux. Sans modèle, la tendance est une moyenne glissante marquée « règle ». Le calibrage est une règle explicable jusqu'au modèle. Aucun chiffre n'est un chiffre officiel ; le PAR officiel vient du moteur déterministe.

**Conséquences (testables) :**
- Toute prévision de PAR porte les deux scénarios et l'écart ; l'un sans l'autre est refusé par le contrat.
- La prévision est étiquetée « règle » tant que le niveau servi est N0.
- Le PAR affiché comme chiffre du jour est celui du moteur déterministe, jamais celui de la capacité.
- Objectifs : qualité = erreur de la prévision de PAR à trois mois ; effet métier = baisse du PAR sur les agences qui ont suivi les actions proposées (`ia.objectif.par.baisse_pts`).

#### FR-107 : La prévision et l'analyse financière du cabinet ne calculent aucun chiffre officiel

Pour le cabinet, les ratios, les tendances et les points d'attention d'un bilan, d'un compte de résultat et d'un prévisionnel sont une **lecture** (famille 9) ; le scoring et la prévision statistique (rotation de clientèle, défaut, demande, PAR, tournées) sont **servis par cette IA commune** et plus par un module « à venir » (la décision du PRD de l'assistant d'août qui les excluait est levée). **Aucun chiffre officiel n'est calculé par l'IA** : le moteur déterministe recalcule et l'écart est restitué. Au premier jour, la capacité d'analyse financière du cabinet est **plus tard** ; les contrôles de balance en règles sont servis (famille 4).

**Conséquences (testables) :**
- Aucun nombre de la liasse, du bilan ou d'un état n'est écrit par une proposition de la capacité ; un nombre rendu par l'IA est étiqueté « estimation » et séparé des états.
- La capacité d'analyse financière du cabinet est déclarée « plus tard » au catalogue et rend « non installé » au premier jour.
- Le catalogue contient les capacités de scoring et de prévision pour le cabinet comme « déclarables » sans qu'aucune ne soit active au premier jour.
- L'écart entre un chiffre annoncé par la capacité et le chiffre recalculé par le moteur est restitué à l'humain qui a tranché dans 100 % des cas.

### 10.7 Famille 7 : recommandation d'action, de produit, de conditions

Proposer une liste classée : produit, panier, conditions de crédit, fournisseur, expertise, levier fiscal, rattachement de compte. Elle prend le profil du client, l'historique, les contraintes dures du logiciel ; elle rend une liste classée avec la **raison en une phrase** et la source. L'humain choisit ; son écart est renvoyé avec motif. Reçue par l'agent, le commercial, le gestionnaire, le comptable. Niveau au premier jour : **N0**.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'**effet constaté** de la recommandation suivie ou écartée : panier et marge réalisés, prêt remboursé, surcoût confirmé, mission d'expertise utile ; horizon propre à chaque recommandation (90 jours en crédit).

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | recommandation de panier | A.1 C11 (`recommandation-panier`) ; FR-16 | « lignes suggérées » |
| distributeur | fournisseur alternatif, combos de stock lent, allocation de quotas | FR-60, FR-65 ; FR-144, FR-145 ; A.5 C11 | « combo », « allocation de quotas » |
| microfinance | recommandation de produit (1 à 3) | FR-99, FR-112 | « produit recommandé » |
| microfinance | conditions optimales (montant et durée dans la capacité de remboursement) | FR-99, FR-113, FR-47 | « conditions optimales » |
| microfinance | rapport du responsable des risques : perte attendue, conditions justifiées | FR-53 | « conditions recommandées » |
| assurance | orientation d'expertise ; contre-proposition indicative au recours ; analyse des devis ; comparaison au portefeuille | FR-58, FR-68 ; FR-120 ; FR-60 ; FR-65 | « besoin d'expertise », « surcoût », « écart à la médiane » |
| cabinet | rattachement d'un compte non reconnu à un poste (surface pilote) | FR-IA21 à FR-IA23 ; AD-22 | « mapping de comptes » |
| cabinet | scénarios d'optimisation légale avec base légale (plus tard) | FR-A22 à FR-A24 (AB) ; FR-IA17 à FR-IA19 | « levier », « retraitement » |

#### FR-108 : Une recommandation est une liste classée, chacune avec sa raison, dans les contraintes dures du logiciel

La capacité rend une **liste classée** de un à trois éléments (produit, conditions) ou de lignes (panier) avec, pour chacun, la raison en **une phrase** et la source. Les **contraintes dures** du logiciel sont des bornes que la capacité ne franchit jamais : en microfinance, les bornes du produit, le **plafond d'usure** (24 % par an par défaut, paramétrable) et le **taux d'effort bloquant** (40 %) ; en distributeur, le plancher de trésorerie et les plafonds de validation ; en assurance, l'interdiction de montant corporel (FR-110) ; au cabinet, la base légale citée. L'agent **choisit librement** : accepter, modifier, ignorer ; l'écart est renvoyé comme correction. Le score ne fixe jamais un prix. Sans l'IA, la liste existe sans classement.

**Conséquences (testables) :**
- Chaque élément rendu porte sa raison, sa source et sa provenance.
- Un couple montant-durée qui dépasserait le plafond d'usure ou le taux d'effort bloquant du client n'est jamais rendu (test aux bornes).
- Aucune recommandation ne contient d'action automatique ; l'accepter crée une décision `HUMAIN` écrite par le module consommateur.
- L'élément modifié ou ignoré par l'humain est écrit avec son motif dans le journal de la capacité.
- Sans l'IA, la liste de produits est rendue non classée avec la mention « sans classement ».
- Objectifs : usage = taux d'acceptation, de modification, de rejet ; effet métier = panier moyen, ou taux de décaissement dans les conditions proposées ; qualité = rang moyen de l'élément choisi.

#### FR-109 : Le réapprovisionnement, le fournisseur et les combos de stock lent sont proposés avec leurs garde-fous

Pour le distributeur, la capacité propose le **réapprovisionnement** (quantité, commandes suggérées, impact sur la trésorerie, « valider tout »), une **note de fournisseur explicable** avec poids paramétrables et un fournisseur alternatif, et les **combos de stock lent** (un produit lent et ses produits moteurs, six au plus, avec le stock à libérer, le coût évité, le chiffre d'affaires potentiel et la marge ; la validation de la direction est demandée au-dessus d'un seuil). Le **prix et la marge d'un revendeur indépendant** ne sont jamais une entrée de l'IA de la société. Le stock moribond n'est pas réapprovisionné. La valeur de fiabilité du fournisseur saisie en dur dans la démonstration n'est pas reprise.

**Conséquences (testables) :**
- Un combo comporte au plus `ia.combo.max_lignes` lignes (défaut 6) ; la capacité rend « données insuffisantes » ou « non installé » quand c'est le cas, jamais un combo vide présenté comme un résultat.
- Aucune proposition de réapprovisionnement ne contourne le plancher de trésorerie (FR-105) ni les plafonds de validation.
- Toute donnée de prix ou de marge d'un revendeur indépendant est absente des entrées d'une capacité de la société (test sur le jeu d'entrées).
- Les poids de la note de fournisseur sont des paramètres du logiciel, jamais en dur.

#### FR-110 : Assurance : orientation d'expertise, devis, comparaison, contre-proposition, sans jamais proposer de montant corporel

Pour l'assurance, la capacité propose une **orientation d'expertise** (besoin « nécessaire » ou « à confirmer », justification, confiance, budget indicatif, complexité ; elle ne crée jamais de mission), une **analyse de devis** ligne par ligne (surcoût contre catalogue de pièces, main-d'œuvre et historique du garage), une **comparaison au portefeuille** (écart à une médiane sur au moins cinq missions comparables, rendu comme question et non comme verdict) et, au recours, une **contre-proposition indicative** hors corporel. **Une capacité peut être interdite de proposer un montant sur un objet donné** (décision D11, généralisation de la règle « jamais de montant corporel ») : pour tout dossier du volet corporel, la liste blanche des volets (matériel, risques divers) filtre les capacités ; ni montant, ni médiane, ni fourchette, ni comparable, ni écart en pourcentage n'est rendu, et le serveur répond avec un code nommé.

**Conséquences (testables) :**
- Une demande de montant, de médiane, de fourchette ou d'écart sur un dossier du volet corporel est refusée avec le code `MONTANT_CORPOREL_INTERDIT`, testé écran par écran.
- Une comparaison au portefeuille avec moins de `ia.comparaison.min_missions` missions comparables (défaut 5) rend « pas assez de comparables ».
- Chaque ligne de surcoût d'un devis renvoie à la ligne du devis et à la ligne du catalogue ou de l'historique.
- Une orientation d'expertise ne crée aucune mission ; la création est une action humaine.
- Le catalogue porte, pour chaque capacité, la liste des « objets interdits de montant » du logiciel ; l'ajout d'un objet interdit s'applique sans redéploiement.

#### FR-111 : Le rattachement d'un compte et le conseil fiscal sont proposés dans un flux qui reste maître

Pour le cabinet, la capacité de **rattachement d'un compte non reconnu à un poste du bilan** (surface pilote) alimente le flux de surcharge existant de la balance sans le court-circuiter : une proposition refusée est le pire cas. Le **conseil fiscal** (scénarios d'optimisation légale, dossier de justification avec base légale et pièce par retraitement) est **plus tard** ; il est déjà vendu et déjà codé dans le module de balance : au premier jour il y reste, et l'IA commune ne rédige la justification qu'ensuite [ASSUMPTION: le conseil est codé dans le service de balance sans porte d'installation ; sa reprise par l'IA commune est à décider avec le PO après vérification du code]. Une citation légale qui ne se résout pas contre la version figée du corpus rend la proposition « non sourcée » et inapplicable ; le moteur déterministe recalcule toujours ; la liasse validée est immuable.

**Conséquences (testables) :**
- Une proposition de rattachement ne modifie le bilan qu'après acceptation par le comptable dans le flux de surcharge (test : refus, bilan inchangé).
- Une affirmation légale sans citation résoluble est rendue `NON_SOURCEE`, visible mais inacceptable.
- Un scénario de conseil ne minore aucune base réelle ; c'est un brouillon simulé distinct du réel (famille 17).
- Une liasse validée ne change pas du fait d'une proposition.

### 10.8 Famille 8 : rédaction de messages et de courriers

Rédiger un brouillon : relance, accroche, réponse à un client, courrier d'offre ou de refus, mise en demeure, note annexe. Elle prend le dossier, l'objectif, le canal, le gabarit ; elle rend un **brouillon relu, modifié et signé par un humain**, qui ne part jamais seul. Reçue par le gestionnaire, le marketing, le recouvrement, le comptable. Niveau au premier jour : **N0** (gabarits) et **N1** (modèle de langage via la passerelle).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la **réponse obtenue** : message lu, promesse tenue, paiement reçu, courrier accepté sans contestation ; horizon : 30 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | accroches de posts et réponse suggérée aux messages | FR-88, FR-91 ; A.6 C11 | « accroche », « réponse suggérée » |
| microfinance | relances pré-rédigées ; scripts ; messages de campagne | FR-226 ; FR-229 ; FR-248 | « message de relance », « script » |
| assurance | relances de pièces manquantes ; offre d'indemnité, refus motivé, réponse à une réclamation ; mise en demeure | FR-47 ; FR-83, FR-122, FR-157 ; FR-120 | « courrier », « relance de pièces » |
| cabinet | notes annexes : trames narratives | note d'architecture §6 | « note annexe » |

#### FR-112 : Un brouillon n'est jamais envoyé seul ; gabarit ou modèle de langage, il le dit

La capacité rend un **brouillon** avec ses sources, étiqueté « proposé par gabarit » ou « rédigé par modèle » (nom, version, date). **L'IA propose, l'humain relit, modifie, signe** ; aucun envoi automatique. Règles par logiciel : en assurance, les courriers à valeur juridique (offre d'indemnité, refus motivé, réclamation, mise en demeure) ne promettent aucun montant, ne contiennent aucun montant ni donnée de santé corporels, ne reprennent pas d'un clic un motif proposé par l'IA, et ne partent pas sans le responsable au-delà de son seuil ; en microfinance, les messages restent **dans le calendrier de l'IMF** ; en distributeur, la **réponse automatique est interdite** pour un client en impayé et la publication demande une validation humaine ; au cabinet, les notes annexes sont sourcées et validées. Les gabarits sont servis au premier jour ; le **modèle de langage** (passerelle ou modèle local, §5) rédige quand il est disponible et que le client a activé la capacité ; sinon le gabarit sert.

**Conséquences (testables) :**
- Aucune route de la capacité n'envoie un message ; l'envoi passe par le service de notification, sur action d'un humain.
- Chaque brouillon porte « gabarit » ou « modèle » avec version ; un brouillon de modèle dont des affirmations n'ont pas de source est refusé.
- Une réponse automatique à un message d'un client dont une créance est échue est refusée (`REPONSE_AUTO_INTERDITE`).
- Un brouillon d'assurance contenant un montant sur un objet interdit (FR-110) est refusé.
- Sans modèle de langage, le gabarit du palier ou du type de courrier est rendu et l'emplacement dit « gabarit ».
- Objectifs : usage = part du texte conservé après relecture ; effet métier = temps de rédaction gagné, taux de réponse aux relances ; qualité = taux de brouillons refusés par le relecteur.

### 10.9 Famille 9 : résumé et analyse narrative sourcée

Résumer un dossier, un portefeuille, une situation. Elle prend le dossier et les pièces lues, ou les chiffres déjà calculés ; elle rend un **résumé de cinq à six lignes dont chaque phrase renvoie à sa source**, une analyse narrative ou un rapport. Reçue par le gestionnaire, le comité, la direction. Niveau au premier jour : **N0** (gabarit) ; **N1** (modèle de langage) quand il est disponible.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la **fidélité du résumé** relevée à l'échantillon par un relecteur, et les corrections apportées par l'humain ; horizon : mensuel.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| assurance | résumé sourcé du dossier | FR-154 | « résumé du dossier » |
| microfinance | analyse narrative du dossier (étoiles, sentiment) | FR-95 | « analyse du dossier », « étoiles » |
| microfinance | rapport de direction rédigé ; commentaire du rapport réglementaire | FR-236 ; FR-190 | « rapport du directeur général » |
| distributeur | rapport de direction généré | FR-169 ; A.15 C11 | « rapport de direction » |
| cabinet | analyse financière, lecture et points d'attention | note d'architecture §6 | « points d'attention » |

#### FR-113 : Un résumé dit d'où vient chaque phrase, et omet ce que l'utilisateur ne peut pas voir

La capacité rend un résumé dont **chaque phrase renvoie à sa source** (pièce, ligne, calcul) ; une information sans source n'est pas affichée. Une **version sans champ de santé** est rendue aux rôles qui ne sont pas autorisés à lire la santé (§8 et FR-143). Aucun montant sur un préjudice corporel (FR-110). Pour la microfinance, l'analyse narrative rend synthèse, forces, faiblesses, questions et points à vérifier, avec une étoile de 1 à 3 et un sentiment **quand un modèle l'a rédigée** ; **sans modèle, ni étoile ni sentiment** (les textes figés de la démonstration sont remplacés).

**Conséquences (testables) :**
- Une phrase sans renvoi à une source est rejetée par le contrat de proposition (`PHRASE_SANS_SOURCE`).
- Le résumé rendu à un rôle non autorisé ne contient aucun champ classé santé (test : même dossier, deux rôles).
- Sans modèle de langage, l'analyse narrative rend « non disponible » et aucune étoile.
- Le résumé ne contient aucun nombre absent des données d'entrée.
- Objectifs : qualité = part de phrases dont la source confirme le contenu, à l'échantillon (`ia.objectif.resume.fidelite_pct`) ; effet métier = temps de lecture gagné.

#### FR-114 : Un rapport de direction est un gabarit tant qu'aucun modèle ne l'a rédigé

Le rapport de direction et le commentaire d'un rapport réglementaire sont d'abord des **gabarits** remplis avec des chiffres déjà calculés ; la provenance affiche « règle et gabarit ». Le rapport ne se dit « IA » que si un modèle l'a rédigé, avec son nom, sa version et sa date. **Les chiffres viennent des moteurs et du cœur, jamais du modèle.** L'économie de quatre heures par semaine de la démonstration est retirée de l'écran.

**Conséquences (testables) :**
- Le rapport conserve l'historique des versions générées avec leur provenance.
- Un rapport « rédigé par modèle » dont un chiffre diffère des données d'entrée est refusé.
- Aucune promesse chiffrée de gain de temps n'est affichée sans mesure (test d'interface : absence du libellé « 4 h/semaine »).
- Au premier jour, le rapport du distributeur et celui de la microfinance sont servis par gabarit.

### 10.10 Famille 10 : Copilot et recherche en langage naturel

Poser une question en langage naturel et obtenir une réponse sourcée, **en lecture seule**. Elle prend la question, le rôle, le périmètre, la page et l'entité consultées ; elle rend une réponse avec, pour chaque chiffre, la source, la date de calcul et le périmètre. Reçue par tous les rôles. Niveau au premier jour : **N1** (modèle de langage) avec repli **N0** (recherche par règles et gabarits de réponses) si le modèle ne tourne pas. Le détail est au §11.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'utilisateur qui **corrige, ou confirme par un clic, la réponse** et l'exactitude des chiffres retrouvés dans leur source à l'échantillon ; horizon : mensuel.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| microfinance | Copilot par rôle (seize rôles ; Copilot d'installation) ; Copilot de recouvrement, du directeur financier, du marketing | FR-237 ; FR-229 ; FR-149 ; FR-246 | « Copilot » |
| assurance | recherche en langage naturel (usage n° 6), en texte | FR-155 ; §7.4 | « recherche en langage naturel » |
| distributeur | Copilot conversationnel : « bientôt » sans date, remonté au premier jour | §6.8 ; FR-2 | « Copilot » |
| cabinet | Copilot conversationnel : « plus tard », remonté au premier jour | PRD-AIA §5.3, R3 | « Copilot » |

#### FR-115 : Le Copilot est une seule capacité, servie aux quatre logiciels au premier jour

La capacité « Copilot » est **une seule** pour les quatre logiciels (résolution de la contradiction X2) : elle remplace la « recherche en langage naturel » de l'assurance (même capacité, vocabulaire propre), le Copilot de la microfinance et ses Copilot de rôle (recouvrement, directeur financier, marketing, installation), et lève le « bientôt » du distributeur et le « plus tard » du cabinet [ASSUMPTION: le PRD distributeur mettait le Copilot « bientôt » et le PRD de l'assistant d'août l'excluait du socle ; la décision du PO sur l'IA commune le remonte au premier jour pour les quatre logiciels]. Ses règles complètes sont aux FR-131 à FR-139.

**Conséquences (testables) :**
- Le catalogue ne contient qu'une capacité « Copilot », avec quatre vocabulaires ; « recherche en langage naturel » est le libellé du vocabulaire de l'assurance.
- Les quatre logiciels peuvent appeler la capacité au premier jour ; un logiciel qui ne l'a pas déclarée en C11 la voit refusée (FR-90).
- Le libellé « Copilot : bientôt » disparaît des écrans du distributeur au premier jour.

### 10.11 Famille 11 : brief du matin, priorités du jour, veille

Un brief lu chaque matin et la liste des priorités. Elle prend les dossiers, le journal, les délais et les indicateurs du **périmètre du rôle** ; elle rend une liste où **une ligne égale un dossier** et des alertes par famille. Lecture seule. Reçue par le directeur, le responsable, chaque gestionnaire ou collecteur pour son périmètre. Niveau au premier jour : **N0** (règles à seuil) ; le modèle de langage rédige la phrase en N1.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la ligne du brief **traitée ou écartée avec motif**, et l'événement qu'elle annonçait (délai dépassé ou non) ; horizon : 7 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| assurance | brief du matin et veille (alertes par famille : délais, provision, pièces, règlement, recours, fraude, conformité) | FR-208 | « brief du matin » |
| microfinance | priorités de la journée et anomalies d'agence ; priorités du collecteur | FR-238 ; FR-142 | « priorités du jour » |
| distributeur | « cette nuit » du centre de règles ; rapport de direction | FR-160 à FR-164 ; FR-169 | « cette nuit », « file d'arbitrage » |
| cabinet | file d'arbitrage des règles (famille 19) | FR-IA40 à FR-IA43 | « file d'arbitrage » |

#### FR-116 : Le brief du matin est une lecture du périmètre du rôle, sans contact avec personne

La capacité compose, à l'heure paramétrée du client (`ia.brief.heure`, défaut 07:00), le brief de chaque rôle sur **son périmètre** : une ligne par dossier et les alertes par famille propres au logiciel (en assurance : délais, provision, pièces, règlement, recours, fraude, conformité ; en microfinance : agence, agent, portefeuille ; en distributeur : les faits de la nuit). Elle est en **lecture seule** et **ne contacte personne** ; ignorer une ligne exige un **motif**, renvoyé comme correction ; sans l'IA, les règles à seuil servent et le disent ; une famille sans objet rend « sans objet » avec motif.

**Conséquences (testables) :**
- Le brief d'un gestionnaire ne contient que les dossiers de son périmètre ; celui d'un directeur ceux du sien (test avec deux rôles).
- Écarter une ligne sans motif est refusé.
- Le brief est généré sans appel au modèle de langage si celui-ci est coupé, avec la mention « règle ».
- Aucun envoi de message ne découle de la génération du brief.
- Objectifs : usage = part des lignes traitées dans la journée ; effet métier = baisse des délais dépassés (`ia.objectif.brief.delais_depasses_pct`).

#### FR-117 : Les priorités d'agence et du collecteur sont des listes ordonnées avec motif

Pour la microfinance, la capacité rend les **priorités de la journée** et les anomalies d'agence (indicateurs d'agence, d'agent, de portefeuille) et, pour le collecteur, l'**ordre de visite avec motif** (échéances du jour et de J-3, retards, promesses, score, probabilité de défaut, signaux faibles, distance), préchargé hors ligne ; le collecteur peut réordonner sans motif. Le **rapport du soir** (visites du jour, conseil de coaching) est un résumé écrit, non vocal au premier jour (FR-138).

**Conséquences (testables) :**
- La liste du collecteur est disponible hors ligne après son chargement ; l'ordre rendu porte un motif par ligne.
- Réordonner la liste n'exige pas de motif ; ignorer une priorité d'agence en exige un.
- Les règles à seuil de repli sont nommées « règle » dans le libellé.

### 10.12 Famille 12 : le terrain, tournées, proximité et zones

Ordonner les visites, détecter la présence, suggérer les zones. Elle prend le plan, les positions **consenties**, les retards, la densité ; elle rend l'ordre proposé avec motif, le gain de distance, les zones. Reçue par l'agent, le superviseur, le responsable de couverture. Niveau au premier jour : **N0** (règle de base, calcul local).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : la visite **réalisée, la promesse obtenue** ou la zone effectivement couverte, comparées à la proposition ; horizon : la journée, puis 30 jours pour une zone.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | plan de journée et tournée ordonnée ; contrôle de présence | FR-100, FR-173 ; FR-102 | « plan de journée », « présence » |
| microfinance | ordre de visite optimal et alerte de proximité à 200 mètres | FR-206 | « alerte de proximité » |
| microfinance | carte de couverture, zones à risque, suggestion de prospection ; réaffectation d'agents | FR-128, FR-208 | « couverture », « zone » |
| assurance | sans objet | — | — |
| cabinet | sans objet | — | — |

#### FR-118 : La tournée est proposée par l'IA et validée par l'humain, avec calcul local

La capacité ordonne les visites selon le segment du client, la fréquence de passage, le motif, la proximité et les impayés, et propose l'ordre avec son motif ; **le serveur propose, l'humain valide ou retouche**. Le calcul est local ; le **routage routier réel est « bientôt »**. Pour la microfinance, une alerte de proximité signale un client en retard à moins de `ia.terrain.proximite_metres` (défaut 200) de la position consentie de l'agent, avec la promesse en cours.

**Conséquences (testables) :**
- La tournée rendue est une proposition ; elle n'écrit le plan qu'à la validation du superviseur.
- Le routage routier affiche « bientôt » et n'appelle aucun service externe.
- L'alerte de proximité n'existe que pour un agent dont la position est consentie ; sans consentement, la règle de base sert sans alerte.
- Une visite hors de la zone du client est signalée au superviseur, sans sanction automatique.

#### FR-119 : La position est consentie, les zones sont suggérées, l'affectation reste humaine

Le contrôle de présence (géofencing) et la carte de couverture lisent la **position consentie** de l'agent : consentement de niveau 0 par défaut (aucune position lue), information de l'agent, conservation de **90 jours glissants**, avis juridique à obtenir avant mise en service [ASSUMPTION: les 90 jours du PRD distributeur sont repris pour la microfinance]. La capacité suggère des **zones de prospection**, signale les zones sous-couvertes et les agents surchargés ; **l'affectation d'un agent reste une décision humaine**. Sans l'IA, la densité, les visites et le retard de paiement sont affichés sans suggestion.

**Conséquences (testables) :**
- Sans consentement, aucune position n'est lue ni stockée (test sur un agent au niveau 0).
- Les positions de plus de `ia.terrain.conservation_jours` jours sont supprimées.
- Une suggestion de zone ne modifie aucune affectation ; la décision est écrite par le module consommateur (décideur `HUMAIN`).
- Un agent n'est jamais classé ni jugé par la capacité seule (FR-123).

### 10.13 Famille 13 : l'explication d'un calcul, d'un score, d'un montant

Répondre à « pourquoi ce chiffre ? ». Elle prend le calcul ou le score ; elle rend les **facteurs, leurs poids et leur contribution** et le texte d'explication. Reçue par le gestionnaire, le responsable, le client final (pour le motif). Niveau au premier jour : **N0** (la règle expose ses facteurs) ; le texte est N1 quand un modèle est disponible.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'explication **consultée, contestée ou acceptée**, et la concordance entre les facteurs affichés et les facteurs réels (test automatique) ; horizon : mensuel.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| assurance | « Pourquoi ce montant ? » (n° 9) | FR-74 | « garantie, vétusté, franchise, plafonds » |
| microfinance | facteurs du score du dossier, du score de recouvrement, des prévisions | FR-49 ; FR-227 ; FR-181 | « facteurs » |
| distributeur | explication de la probabilité, du recouvrement, du coaching ; cause d'un écart de gestion | FR-55, FR-117, FR-125 ; FR-152 ; A.13 C11 | « cause », « AUTO / A_VALIDER / SUGGESTION » |
| cabinet | cibles scorées explicables ; justification d'un retraitement | FR-IA29 à FR-IA33 | « facteurs », « justification » |

#### FR-120 : Toute proposition s'explique, et la règle fait foi

La capacité d'explication affiche les facteurs d'un score, leur poids et leur contribution, et pour un montant d'assurance l'explication de la garantie, de la vétusté, de la franchise et des plafonds. **L'explication reflète ce qui a réellement pesé** (la règle ou le modèle décisionnaire lui-même), pas un modèle de substitution. Pour un dossier corporel, elle **restitue le calcul saisi par l'humain** et ne propose aucun montant. Pour le distributeur, elle propose la **cause d'un écart de gestion** (volume, prix, mix, coût) avec un niveau de confiance (`AUTO`, `A_VALIDER`, `SUGGESTION`) : « le contrôleur propose, le directeur financier arbitre ».

**Conséquences (testables) :**
- Pour tout score, l'explication énumère les facteurs et leur contribution, et leur somme égale la note (FR-93).
- Pour un dossier du volet corporel, l'explication rend le calcul de l'humain et aucun montant calculé par l'IA (`MONTANT_CORPOREL_INTERDIT`).
- Un écart de gestion sans cause reconnue rend « cause non identifiée », jamais une cause inventée.
- Les textes « IA » écrits à la main dans la démonstration du distributeur sont remplacés par la cause composée.
- Objectifs : usage = part des explications consultées ; effet métier = baisse des contestations d'un montant ou d'un score ; qualité = concordance entre les facteurs affichés et les facteurs réels (test automatique).

### 10.14 Famille 14 : segmentation, ciblage, packages de vente et mesure d'impact

Regrouper les clients, les prospects, les épargnants en segments, cibler une campagne et, pour le distributeur, **composer des packages de vente puis mesurer leur effet**. Elle prend les clients, les comportements, les ventes, le stock, les marges ; elle rend des **segments agrégés ou anonymes**, des campagnes et des packages proposés, puis des rapports d'impact. Reçue par le marketing, le responsable commercial, la direction. Niveau au premier jour : **N0** (segmentation et calculs par règles).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'**impact mesuré** d'un package ou d'une campagne (ventes, marge, panier, points de vente touchés, avant/après, contre groupe témoin) ; horizon : la durée du package puis 30 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | scoring de leads, segmentation comportementale (actifs, dormants, grands comptes) | A.12 C11 ; §6.5 (module marketing, M23) | « segment » |
| distributeur | campagnes : création, conduite, entonnoir, retour sur campagne, attribution des commandes | FR-142, FR-143, FR-146, FR-149 | « campagne », « retour brut », « marge incrémentale » |
| distributeur | studio social : calendrier, accroches, validation et programmation | FR-87, FR-88, FR-89 | « publication » |
| distributeur | combos d'écoulement du stock lent | FR-144, FR-145 | « combo » |
| microfinance | segmentation (dont épargnants), ciblage de campagne, note de prospect, propositions de campagne | FR-248, FR-246 | « segment », « campagne » |
| assurance, cabinet | sans objet au premier jour | — | — |

#### FR-121 : Les segments sont agrégés, les campagnes sont validées par un humain

La capacité rend des **segments sans donnée personnelle** (effectifs, caractéristiques) et des propositions de campagne (segment, canal, message pré-rédigé, famille 8). Le responsable marketing **valide, ajuste ou écarte avec un motif**. Un segment de moins de `ia.segment.effectif_minimal` personnes n'est pas rendu. Pour la microfinance, l'analyse est calculée **dans l'instance de l'IMF** et seules les personnes **consentantes** sont ciblées ; l'envoi passe par le service de notification, jamais par la capacité. Un client en défaut ou au crédit bloqué est exclu des campagnes du distributeur (règle de `marketing`, FR-211 du PRD distributeur).

**Conséquences (testables) :**
- Un segment dont l'effectif est inférieur à `ia.segment.effectif_minimal` n'est pas rendu.
- Une campagne n'est envoyée qu'à des personnes dont le consentement de communication est actif.
- Écarter une campagne sans motif est refusé ; le motif est renvoyé à la capacité.
- Aucun segment ne se fonde sur une variable interdite (FR-94).
- Un client en défaut ou au crédit bloqué n'apparaît dans aucune cible proposée par la capacité (distributeur).

#### FR-122 : Le distributeur : l'IA propose des packages de vente, l'humain les valide, l'IA mesure l'impact

Pour le distributeur, la capacité propose des **packages de vente** : un lot de produits, un prix de lot, une **cible** (segments de points de vente, zones, saison) et une durée. Elle les compose à partir des **ventes, du stock, des marges et des segments** (le stock lent est une source, FR-109 ; le prix du package ne descend jamais sous le plancher de marge du logiciel). Le **marketing ou la direction valide** (la direction au-dessus du seuil de remise, comme pour un combo, FR-145 du PRD distributeur) ; l'IA ne lance rien. Une fois le package ou la campagne en cours, la capacité **mesure l'impact** : ventes, marge, panier moyen, nombre de points de vente touchés, **avant et après**, et **contre un groupe témoin** de points de vente comparables non exposés. Sans groupe témoin, le rapport porte la mention « **sans témoin, impact estimé** ». Un **rapport par package et par campagne** est produit ; il s'ajoute au retour sur campagne du PRD distributeur (FR-143 : un seul retour, marge incrémentale attribuée moins coût, divisée par le coût ; « CA attribué » distinct de « CA incrémental ») sans le remplacer. La capacité **apprend ce qui marche** : les packages et campagnes dont l'impact mesuré est positif alimentent le classement des propositions suivantes (par segment, zone, saison), et les propositions écartées par l'humain avec motif aussi.

**Conséquences (testables) :**
- Un package rendu porte : lot, prix, cible, durée, marge attendue, source (ventes, stock, marge, segment) et provenance ; un package dont la marge attendue est sous le plancher paramétré (`ia.package.marge_plancher_pct`) n'est pas rendu.
- Un package n'existe pas dans le catalogue de vente tant qu'un humain ne l'a pas validé ; la création est écrite par le module consommateur (décideur `HUMAIN`).
- Le rapport d'impact donne, par package et par campagne : ventes, marge, panier moyen, points de vente touchés, avant/après, écart au groupe témoin ; chaque nombre est calculé sur des faits (FR-15 du PRD distributeur).
- Le groupe témoin est tiré parmi des points de vente comparables (segment, zone, historique) et non exposés, avec une taille minimale `ia.impact.temoin_minimal` ; en dessous, le rapport dit « sans témoin, impact estimé ».
- Un rapport sans témoin n'entre dans aucun indicateur d'apprentissage au même poids qu'un rapport avec témoin (poids paramétré `ia.impact.poids_sans_temoin`).
- Le package ou la campagne n'est jamais présenté comme « efficace » sans écart mesuré positif au seuil `ia.impact.seuil_succes_pct`.
- Vérité terrain : l'impact mesuré est la réalité qui tranche (§7) ; objectifs : effet métier = marge incrémentale par package ; qualité = part de packages proposés dont l'impact mesuré est positif ; usage = taux de validation.

### 10.15 Famille 15 : coaching et performance d'équipe

Préparer un entretien, repérer qui a besoin d'appui. Elle prend la couverture, les visites hors zone, le score de poste, les impayés, l'objectif ; elle rend une **priorité de coaching** et une phrase composée des points qui ont joué. Reçue par le superviseur, le responsable d'agence. Niveau au premier jour : **N0** (règle à points paramétrable avec provenance).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'évolution des indicateurs de l'agent **après l'entretien** de coaching ; horizon : 30 et 90 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| distributeur | coaching ciblé (agents « à coacher », seuil de 20 points) | FR-125 ; A.10 C11 | « à coacher » |
| microfinance | prévision du retard par zone, coaching, comparaison et référence entre agences | FR-243 | « comparaison d'agences » |
| assurance, cabinet | sans objet | — | — |

#### FR-123 : Le coaching est une règle à points, et un agent n'est jamais jugé par l'IA seule

La capacité calcule une **priorité de coaching** par une règle à points paramétrable (seuil de 20 points par défaut, `ia.coaching.seuil_points`), avec provenance, et rend une phrase composée des points qui ont joué. **Un agent n'est jamais classé ni jugé par l'IA seule** ; l'écart du responsable est un motif. La **recommandation de prix au revendeur indépendant est exclue** et aucune donnée de prix ou de marge d'un revendeur n'entre dans une IA de la société. Le « coaching IA » écrit à la main dans la démonstration disparaît.

**Conséquences (testables) :**
- Le résultat d'un coaching ne fait partie d'aucune décision d'affectation, de rémunération ou de sanction écrite par la capacité.
- Chaque priorité de coaching affiche les points et le seuil ; sans provenance, « non évalué ».
- Aucune entrée « prix » ou « marge » d'un revendeur indépendant n'est lue (test sur le jeu d'entrées).
- La comparaison d'agences affiche l'effectif et la période ; une agence de moins de `ia.segment.effectif_minimal` agents n'est pas comparée nominativement.

### 10.16 Famille 16 : rapprochement, réconciliation, écarts, doublons

Rapprocher des paiements, des écritures, des mouvements. Elle prend le paiement, l'historique, les échéances ouvertes, les relevés ; elle rend un **rattachement proposé** et une cause probable de l'écart. Reçue par le comptable, le directeur financier. Niveau au premier jour : **N0** (règles de rapprochement).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : le rattachement **confirmé ou rejeté** par le comptable, et l'écart effectivement résolu ; horizon : à la clôture du mois.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| microfinance | validation d'un paiement par téléphone mobile et rapprochement | FR-147 | « doublon, écart, numéro différent » |
| microfinance | écarts et doublons entre Prospera et le cœur du client | FR-199 | « écart avec le cœur » |
| distributeur | lettrage assisté, détection d'anomalies comptables, prévision de cash (module finance) | A.11 C11 | « lettrage » |
| assurance | rapprochement des encaissements de recours : règle, sans IA | — | sans objet pour l'IA |
| cabinet | sans objet | — | — |

#### FR-124 : L'IA propose un rattachement ; elle ne valide jamais et n'écrit jamais d'écriture

La capacité propose un rattachement, un lettrage ou une cause d'écart ; **elle ne valide jamais un paiement et n'écrit jamais d'écriture comptable** ; un rapprochement proposé est toujours confirmé par un humain en version 1. Un **doublon certain** relève de l'idempotence du système, sans IA. L'IA **ne corrige jamais de l'argent**. Sans l'IA, les règles de rapprochement existantes servent seules.

**Conséquences (testables) :**
- Aucune proposition de la capacité ne crée ni ne modifie d'écriture, de paiement ou de solde ; l'acceptation est écrite par le module consommateur.
- Un doublon exact (même clé d'idempotence) est refusé par le système avant tout appel de la capacité.
- Chaque proposition affiche les indicateurs qui l'ont fondée (doublon, écart de montant, numéro différent).
- Objectifs : qualité = taux de rattachements proposés confirmés ; effet métier = temps de rapprochement gagné ; usage = taux de propositions rejetées.

### 10.17 Famille 17 : simulation et scénarios « et si »

Tester une hypothèse sans toucher au réel. Elle prend le dossier et des hypothèses saisies ; elle rend un résultat **étiqueté « simulation »**, séparé du réel. Reçue par le responsable, la direction, le cabinet. Niveau au premier jour : **N0** (calcul déterministe sur hypothèses).

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'écart entre la **simulation et le réel** observé après la décision ; horizon : 3 mois.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| assurance | qualité du dossier et simulation « et si… » (charge avant-après, seuil de délégation) | FR-209 | « simulation » |
| microfinance | scénarios « sans action » / « avec actions » | FR-181 | « scénario » |
| distributeur | scénarios BASE / HAUT / BAS | FR-137, FR-154 | « scénario » |
| cabinet | brouillon simulé du conseil fiscal (plus tard) | FR-A22 à FR-A24 (AB) | « brouillon simulé » |

#### FR-125 : Une simulation n'entre dans aucun indicateur ni aucun état

La capacité rend un résultat marqué « simulation » : **jamais dans un indicateur, jamais dans un état financier, jamais dans une liasse**. En assurance, la simulation mesure l'impact d'une hypothèse sur la charge et sur le seuil de délégation, sans montant corporel individuel (FR-110). Au cabinet, un brouillon simulé de conseil est distinct du réel ; il ne minore aucune base réelle.

**Conséquences (testables) :**
- Aucun indicateur, tableau de bord ni état n'inclut un résultat de simulation (test de non-usage).
- Toute sortie de la capacité porte le marqueur « simulation » dans son contrat.
- Une simulation d'un dossier corporel ne contient aucun montant individuel.
- La suppression d'une simulation n'a aucun effet sur le réel.

### 10.18 Famille 18 : analyse sectorielle, macro et conjoncture

Situer un client, un secteur, un portefeuille dans son environnement. Elle prend les flux, l'historique, les séries de prix et d'inflation, le calendrier agricole ; elle rend un constat avec un niveau (favorable, neutre, défavorable), la tendance et la **source datée et citée**. Reçue par l'agent de crédit, le comité, la direction, le responsable des risques. Niveau au premier jour : **N0** (règles de concentration, séries publiques) ; seule la microfinance l'écrit en détail.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'**évolution constatée** du secteur (PAR du secteur, prix) comparée au constat ; horizon : 3 et 6 mois.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| microfinance | analyse étendue en six volets ; analyse sectorielle micro et macro sur la fiche client | FR-96, FR-127 ; §6 règle F2 | « analyse sectorielle » |
| microfinance | saturation d'un secteur (seuil 35 % par défaut) ; risque par secteur et par conjoncture | FR-97, FR-177 ; FR-180 | « saturation », « note de risque par secteur » |
| microfinance | stratégie de recouvrement (comportement de retard et macro, famille 2) | FR-228, FR-218 à FR-221 | « conjoncture » |
| distributeur, cabinet | non écrit au premier jour (observatoire sectoriel : §13) | — | sans objet |

#### FR-126 : L'analyse sectorielle cite des sources datées et n'est qu'une information

La capacité rend un constat par volet (transactions, comportement micro, macro, saison, recouvrement passé, saturation), le niveau et les données. Chaque série externe est **datée et citée** ; une source de plus de `ia.secteur.source_ancienne_jours` jours (défaut 90) est marquée « ancienne » ; une série absente rend « non installé », jamais une valeur de repli. **L'analyse est une information, pas une décision.** Pour la saturation, le seuil de 35 % est un paramètre calibré sur le portefeuille du client. **Seules les données des clients consentants alimentent l'apprentissage commun** (§8) ; l'analyse du client lui-même s'affiche sans ce consentement.

**Conséquences (testables) :**
- Chaque constat affiche source et date ; sans source, il n'est pas affiché.
- Une source plus ancienne que `ia.secteur.source_ancienne_jours` est étiquetée « ancienne ».
- La saturation d'un secteur déclenche une alerte quand la part dépasse `ia.secteur.saturation_pct`.
- L'analyse d'un client sans consentement à l'apprentissage s'affiche, mais ses données n'alimentent pas le niveau d'export « apprentissage » (§8).
- Objectifs : qualité = fraîcheur des sources ; usage = taux de consultation par dossier ; effet métier = écart entre la saturation détectée et l'évolution du retard de paiement du secteur.

### 10.19 Famille 19 : le moteur d'automatisation par règles

Faire exécuter, sous contrôle, des règles de gestion. Elle prend des faits datés du module détenteur ; elle rend des **cibles** (avec score et message prêt) selon un **mode** : `SUGGESTION`, `VALIDATION`, `AUTO` ou `AUTO_SOUS_MANDAT`, et une file d'arbitrage. Reçue par le responsable de la règle. Niveau au premier jour : **N0** (grammaire fermée). Les agents sont au §11.

**Vérité terrain** (qui avait raison, l'IA ou l'humain ? détail au §7) : l'exécution **annulée, contestée ou maintenue**, et la décision humaine de la file d'arbitrage ; horizon : 30 jours.

| logiciel | usage | FR d'origine | vocabulaire |
|---|---|---|---|
| cabinet | règles d'automatisation (rappel d'échéance, relance préventive) ; cibles scorées ; file d'arbitrage et décision groupée | FR-IA23b à FR-IA39, AD-4 à AD-6 ; FR-IA29 à FR-IA33 ; FR-IA40 à FR-IA43 | « règle », « cible », « mandat » |
| distributeur | centre de règles (AUTO / À VALIDER / SUGGESTION, file d'arbitrage, « cette nuit ») | FR-160 à FR-164 ; A.14 C11 | « centre de règles » |
| microfinance | règles à niveaux, sans règle AUTO de blocage | FR-250 | « règle d'automatisation » |
| assurance | aucune décision automatique ; règles de suggestion seulement | FR-11 | « règle de suggestion » |

#### FR-127 : Le moteur d'automatisation est un seul moteur, dont le mode le plus strict est le défaut

Un seul moteur, de grammaire fermée (aucune évaluation dynamique d'expression), sert les quatre logiciels (le mandat est au §11). Chaque règle porte un mode ; **le défaut est le régime le plus strict**. On peut abaisser un mode, jamais l'élever sans contrôle. Une règle qui contacte une personne porte un **quota de sollicitation**. La **file d'arbitrage** plafonne la décision groupée (25 par défaut, 100 au plus, motif au-delà du défaut) ; un taux d'acceptation de plus de 90 % sur 30 jours signale une validation de façade (FR-92). L'assurance n'active que `SUGGESTION` ; la microfinance n'a aucune règle `AUTO` de blocage ; le distributeur et le cabinet peuvent avoir `AUTO` pour les types d'action du catalogue qui le permettent (FR-134).

**Conséquences (testables) :**
- Une règle contenant une expression à évaluer est refusée à l'enregistrement (`GRAMMAIRE_FERMEE`).
- Une règle qui contacte une personne sans quota est refusée.
- Une décision groupée au-delà du plafond dur (`ia.arbitrage.plafond_lot`, 100) est refusée ; au-delà du défaut (25), elle exige un motif.
- Un logiciel assurance qui tente d'activer le mode `AUTO` est refusé (`MODE_NON_PERMIS_ASSURANCE`).
- Un mode ne peut pas être élevé (de `VALIDATION` à `AUTO`) sans passer par le contrôle de mode (FR-134).

### 10.20 Ce qui n'est pas du premier jour, contradictions résolues, contrôle de couverture

#### FR-128 : Ce qui est « bientôt », « plus tard » ou exclu est inscrit au catalogue, avec son bouton

Les capacités demandées qui ne sont pas du premier jour sont **inscrites au catalogue** avec le statut `BIENTOT`, `PLUS_TARD` ou `EXCLU` ; les écrans portent le bouton « bientôt » prévu (aucun appel réel). Sont **bientôt** : le chatbot de qualification de leads (distributeur, microfinance), la lecture d'une commande par message (distributeur), le chatbot de l'assuré, la dictée vocale de la microfinance, la fraude sur espèces du distributeur, la détection de départ d'un client, la comparaison avec d'autres distributeurs, le routage routier réel. Sont **plus tard** : le conseil fiscal, l'analyse financière, les notes annexes et l'assistance à la revue KYC du cabinet, la rédaction du rapport de direction par modèle tant qu'aucun modèle n'est branché. Sont **exclus** : la dictée, la transcription d'appel et la synthèse vocale de l'assurance au premier jour, la recommandation de prix au revendeur indépendant, l'OCR par modèle de vision (§12).

**Conséquences (testables) :**
- Le catalogue contient les statuts `BIENTOT`, `PLUS_TARD`, `EXCLU` ; une capacité de ces statuts rend `NON_INSTALLE` à tout appel.
- Aucun écran du premier jour n'appelle une capacité `BIENTOT` : seul le bouton « bientôt » s'affiche.
- Le statut d'une capacité se change par une publication du catalogue, sans déploiement du logiciel.

#### FR-129 : Les seize contradictions entre les PRD des logiciels sont résolues comme suit

Les PRD des logiciels se contredisaient sur seize points ; la décision du PO sur l'IA commune les tranche. Ce tableau est la référence pour tout logiciel.

| # | Contradiction | Résolution | Où |
|---|---|---|---|
| X1 | Où tourne l'IA | même code, même contrat, en ligne et en local | §5 |
| X2 | Copilot : quatre statuts différents | texte, lecture seule, au premier jour pour les quatre logiciels | FR-115, §11 |
| X3 | Agir seul ou jamais | action autonome seulement pour un type d'action non engageant et réversible, sous mandat ; jamais pour crédit, garantie, sinistre, paiement, refus, blocage | §11 |
| X4 | Scoring et prévision « autre métier, plus tard » | servis par l'IA commune, en règle v0 au premier jour | FR-93, FR-105 |
| X5 | Deux contrats de proposition | un seul contrat (origine, niveau, statut, décideur) | §4 |
| X6 | OCR : où et quoi | OCR dans le service de documents ; lecture et classement dans l'IA | §12 |
| X7 | Voix : réelle, exclue ou bientôt | bientôt pour tous ; la dictée vocale de la microfinance est reportée [ASSUMPTION: décision D12 ; le PRD microfinance la spécifiait au premier jour avec consentement propre ; à confirmer par le PO] | FR-138 |
| X8 | Chatbot | bientôt pour tous | FR-138 |
| X9 | Assurance : « tout au premier jour » contre un ordre de construction en trois phases | tout reste dû au premier jour ; l'ordre de construction place l'analyse des devis, la simulation et la comparaison en dernier [ASSUMPTION] | FR-110, FR-125 |
| X10 | Deux scores de client sans définition commune | deux capacités distinctes ; le croisement est de l'horizon (passeport) | FR-96, §13 |
| X11 | Équité écrite seulement chez la microfinance et le score de fraude | liste fermée et suivi mensuel pour tout score sur une personne, quatre logiciels | FR-94 |
| X12 | Consentement à l'IA | finalité « apprentissage commun » au contrat, registre des consentements | §8 |
| X13 | Rédaction : gabarit ou modèle de langage | gabarit au premier jour et en repli ; modèle quand il est branché ; la provenance le dit | FR-112 |
| X14 | Le conseil fiscal | reste dans le service de balance au premier jour ; la justification rédigée vient ensuite | FR-111 |
| X15 | Dénominations (« Copilot », « recherche », « assistant ») | un nom de capacité, un vocabulaire par logiciel | FR-115 |
| X16 | Distributeur : modèles déclarés en C11 alors que « règle » | le niveau `REGLE` est accepté en C11 | FR-90 |

**Conséquences (testables) :**
- Le catalogue ne contient aucune capacité dont le statut contredit ce tableau (contrôle automatique à la publication).
- Une modification d'une résolution passe par une décision du PO inscrite au registre des décisions du PRD.

#### FR-130 : Aucune des 95 capacités recensées n'est oubliée : tableau de contrôle

Toute capacité demandée par un PRD de logiciel a sa ligne dans le catalogue. Le tableau relie les 95 capacités recensées (distributeur D1-D24, microfinance M1-M38, assurance A1-A19, cabinet C1-C14) au FR de ce PRD qui la porte.

| capacité de l'extrait | FR de ce PRD |
|---|---|
| D1 recommandation de panier | FR-108 |
| D2 erreur de commande | FR-102 |
| D3 probabilité d'acceptation d'une proforma | FR-96 |
| D4 aide à la décision de crédit client | FR-93, FR-95 |
| D5 probabilité de recouvrement | FR-96 |
| D6 file du jour et canal | FR-97 |
| D7 réapprovisionnement | FR-105, FR-109 |
| D8 note fournisseur | FR-93, FR-109 |
| D9 santé d'un point de vente | FR-93 |
| D10 prospects et quotas | FR-93, FR-109 |
| D11 plan de journée et tournée | FR-118 |
| D12 contrôle de présence | FR-119 |
| D13 coaching ciblé | FR-123 |
| D14 combos de stock lent | FR-109, FR-122 |
| D15 accroches et réponses | FR-112 |
| D16 trésorerie et CA | FR-105, FR-125 |
| D17 cause d'un écart de gestion | FR-120 |
| D18 rapport de direction | FR-114 |
| D19 centre de règles | FR-127 |
| D20 lettrage, anomalies, cash | FR-124 |
| D21 leads et segmentation | FR-121, FR-122 |
| D22 Copilot | FR-115, FR-131 |
| D23 chatbot et commande par message | FR-100, FR-128 |
| D24 autres fonctions « IA » de l'offre | FR-128 |
| M1 score du dossier | FR-93 |
| M2 analyse narrative | FR-113 |
| M3 analyse en six volets | FR-126 |
| M4 saturation d'un secteur | FR-126 |
| M5 fraude, conformité, comportement | FR-103 |
| M6 recommandation de produit | FR-108 |
| M7 conditions optimales | FR-108 |
| M8 rapport du responsable des risques | FR-95, FR-108 |
| M9 cohésion de groupe | FR-93 |
| M10 score client, note LBC | FR-93, FR-94 |
| M11 probabilité de défaut | FR-96 |
| M12 signaux faibles | FR-103 |
| M13 analyse sectorielle sur la fiche | FR-126 |
| M14 couverture et zones | FR-119 |
| M15 épargne (dormants, fidélité, encours, segments) | FR-93, FR-106, FR-121 |
| M16 priorités du collecteur | FR-117 |
| M17 validation Mobile Money | FR-124 |
| M18 fraude de caisse | FR-103 |
| M19 trésorerie à 7 jours | FR-105 |
| M20 écarts et doublons avec le cœur | FR-124 |
| M21 risque par secteur | FR-126 |
| M22 prévision du PAR | FR-106, FR-125 |
| M23 conformité et rapport réglementaire | FR-102, FR-114 |
| M24 anomalies de la piste d'audit | FR-103 |
| M25 ordre de visite et proximité | FR-118 |
| M26 dictée vocale et rapport du soir | FR-117, FR-138 |
| M27 réaffectation d'agents | FR-119 |
| M28 relances | FR-97, FR-112 |
| M29 score de recouvrement | FR-96 |
| M30 stratégie de recouvrement | FR-98, FR-126 |
| M31 scripts et Copilot de recouvrement | FR-98, FR-115 |
| M32 Copilot par rôle | FR-115, FR-131 |
| M33 priorités et anomalies d'agence | FR-116, FR-117 |
| M34 rapport de direction rédigé | FR-114 |
| M35 équipes : prévision par zone, coaching | FR-106, FR-123 |
| M36 marketing : segmentation, campagnes | FR-121 |
| M37 chatbot WhatsApp de leads | FR-100, FR-138 |
| M38 score de lecture d'une pièce | FR-99 |
| A1 déclaration assistée | FR-100 |
| A2 lecture et classement des pièces | FR-99, FR-140 à FR-145 |
| A3 cohérence des pièces, photo réutilisée | FR-101 |
| A4 pièces manquantes et relances | FR-112 |
| A5 résumé sourcé | FR-113 |
| A6 recherche en langage naturel | FR-115, FR-131 |
| A7 pré-remplissage de l'instruction | FR-99 |
| A8 analyse des devis | FR-110 |
| A9 « pourquoi ce montant ? » | FR-120 |
| A10 graphe de liens, fraude | FR-104 |
| A11 courriers | FR-112 |
| A12 recours | FR-110, FR-112 |
| A13 brief du matin | FR-116 |
| A14 qualité et simulation | FR-101, FR-125 |
| A15 orientation d'expertise | FR-110 |
| A16 complétude d'un rapport d'expertise | FR-101 |
| A17 comparaison au portefeuille | FR-110 |
| A18 chatbot de l'assuré | FR-128, FR-138 |
| A19 dictée, transcription, voix | FR-128, FR-138 |
| C1 mapping de comptes | FR-111 |
| C2 conseil fiscal | FR-111, FR-125 |
| C3 analyse financière | FR-107, FR-113 |
| C4 anomalies de balance | FR-101, FR-103 |
| C5 notes annexes | FR-112 |
| C6 assistance à la revue KYC | FR-99 |
| C7 OCR des statuts et de la carte | FR-99, FR-144 |
| C8 OCR de captures et de factures | FR-99, FR-144 |
| C9 règles d'automatisation | FR-127 |
| C10 cibles scorées explicables | FR-93, FR-120 |
| C11 file d'arbitrage | FR-127 |
| C12 Copilot du cabinet | FR-115, FR-131 |
| C13 scoring et prévision (cabinet) | FR-107 |
| C14 OCR par modèle de vision | FR-145 |

**Conséquences (testables) :**
- Chacune des 95 lignes renvoie à au moins un FR existant de ce PRD ; un identifiant de capacité sans ligne est une anomalie du PRD (contrôle de couverture à l'assemblage).
- Toute capacité nouvelle demandée par un logiciel est ajoutée à ce tableau avant d'être publiée au catalogue.
- Les capacités de statut `BIENTOT`, `PLUS_TARD` ou `EXCLU` figurent dans le tableau avec le FR qui dit leur statut.

## 11. Copilot et agents

Cette section décrit les deux façons dont l'IA parle et agit pour l'utilisateur : le **Copilot**, qui répond à une question en lisant seulement, et les **agents sous mandat**, qui peuvent exécuter une action mais seulement si elle ne l'engage pas et qu'on peut la défaire. Elle reprend le contenu du PRD de l'assistant d'août, qui devient le module `assistant` de l'IA commune (§5). La doctrine (l'IA propose, l'humain décide) est au §4 ; elle n'est pas répétée.

#### FR-131 : Le Copilot est servi au premier jour aux quatre logiciels, en texte et en lecture seule

Le Copilot répond en texte, en français, à une question posée dans le logiciel (cabinet, distributeur, microfinance, assurance). Il est **en lecture seule** : il ne crée, ne modifie, n'envoie et ne supprime rien. Il est servi **au premier jour pour les quatre logiciels** (décision D12) [ASSUMPTION: le PRD distributeur le mettait « bientôt » et celui de l'assistant d'août « plus tard » ; la décision du PO le remonte]. Il n'y a **pas de voix** au premier jour (FR-138). Quand il ne sait pas, il le dit : « je n'ai pas encore de réponse fiable » ou « données non disponibles » plutôt que de deviner.

**Conséquences (testables) :**
- Une question dans chacun des quatre logiciels reçoit une réponse au premier jour, ou le message « je n'ai pas encore de réponse fiable » (test sur les quatre logiciels).
- Aucune route du Copilot n'écrit dans un module métier (test : le compte de service du Copilot n'a aucun droit d'écriture sur les données métier).
- Une question hors du périmètre de l'utilisateur reçoit « données non disponibles » et non une réponse partielle.
- Le Copilot n'accepte pas d'entrée audio au premier jour.

#### FR-132 : Le Copilot a les droits de l'utilisateur, cite ses sources et donne le périmètre de chaque chiffre

Le Copilot lit **ce que l'utilisateur peut lire**, rien de plus : il hérite de son rôle, de son organisation et de son périmètre, jamais d'un super-droit. Chaque chiffre de la réponse porte sa **source**, sa **date de calcul** et son **périmètre**. Les chiffres viennent des moteurs et des données du logiciel, **jamais du modèle de langage** (aucun chiffre officiel n'est calculé par l'IA). Une affirmation légale (fiscale, réglementaire) porte une citation qui se résout contre la version figée du corpus ; sinon la réponse est « non sourcée » et inapplicable. Le contexte envoyé au modèle est **minimisé** à ce que la question exige.

**Conséquences (testables) :**
- Deux utilisateurs de rôles différents posant la même question reçoivent des réponses qui ne contiennent que ce que chacun peut lire (test à deux rôles).
- Tout nombre de la réponse se retrouve dans une source citée ; un nombre sans source fait refuser la réponse (`CHIFFRE_NON_SOURCE`).
- Une affirmation légale sans citation résolvable est rendue `NON_SOURCEE`.
- Aucune invocation n'est anonyme : chaque question est journalisée avec organisation, rôle, utilisateur, taille, durée, modèle et version.
- Hors portée d'un dossier ou d'une organisation, la réponse est « introuvable » (`404`), jamais « interdit ».

#### FR-133 : Le Copilot a un vocabulaire et des rôles par logiciel, et marche sans modèle de langage

Le Copilot est une capacité unique (FR-115) avec un **vocabulaire par logiciel** et, pour la microfinance, une **liste de seize rôles**, plus un Copilot d'installation sans chiffre métier pour l'administrateur. Les questions de l'assurance en « recherche en langage naturel » rendent des **critères visibles et corrigeables**, une synthèse chiffrée et des listes, sans filtrer ni retourner de champ de santé hors des rôles autorisés. Le modèle de langage est servi, **en ligne**, par la passerelle unique de l'IA (masquage, journal de chaque envoi, aucune rétention chez le fournisseur) et, **en local**, par un modèle ouvert sur le serveur du client (§5). Si le modèle n'est pas disponible, le Copilot **se replie** sur la recherche par règles et sur des gabarits de réponse, et le dit ; le produit reste utile sans modèle de langage. **Aucune donnée de santé ne part vers un modèle hors de l'instance.**

**Conséquences (testables) :**
- Le catalogue du Copilot porte la liste des rôles de chaque logiciel ; un rôle sans entrée de vocabulaire est refusé à la publication.
- Avec le modèle de langage coupé, une question reçoit la réponse du repli, étiquetée « sans modèle de langage ».
- Un champ de santé n'est ni dans le contexte envoyé au modèle ni dans une réponse rendue à un rôle non autorisé (test sur un dossier corporel).
- Les envois à un modèle hébergé passent tous par la passerelle ; un appel direct du module au fournisseur est refusé.
- La recherche de l'assurance affiche les critères interprétés et permet de les corriger avant de relancer.

#### FR-134 : Les agents agissent sous un catalogue de types d'action ; seule une action non engageante et réversible peut être autonome

Un **agent** est une règle ou un rôle de l'assistant qui peut exécuter une action. Les actions possibles sont celles du **catalogue des types d'action**, référentiel versionné publié par le catalogue de la plateforme : pour chaque type, un code, s'il est **réversible** (oui, non, sous conditions), s'il est **engageant**, son **moyen d'annulation** et le service exécutant. **Un type non déclaré est traité comme engageant et irréversible.** Le contrôle de mode fige le couple (code, version du référentiel) dans la règle et le **rejoue à l'exécution** ; une divergence **suspend** l'exécution, elle ne la rétrograde pas en silence. On peut abaisser un mode, jamais l'élever ; une configuration incompatible est refusée. **L'indice de confiance est exposé et n'entre dans aucune décision** : aucun seuil de confiance n'ouvre l'autonomie. Un agent ne peut **jamais** exécuter seul un crédit, une garantie, un sinistre, un paiement, un refus ni un blocage (décision D5) [ASSUMPTION: ces types sont déclarés « engageant, non autonomisable » au catalogue au premier jour ; la propriété du catalogue (responsable de publication) reste à nommer].

**Conséquences (testables) :**
- Une règle dont le type d'action n'est pas au catalogue est traitée comme engageante et ne peut pas être en `AUTO` (test).
- Une règle de mode `AUTO` dont le type devient engageant dans une nouvelle version du référentiel est suspendue à l'exécution, avec notification du responsable (test).
- Les types « crédit », « garantie », « sinistre », « paiement », « refus », « blocage » sont refusés en `AUTO` et en `AUTO_SOUS_MANDAT` avec le code `TYPE_NON_AUTONOMISABLE`.
- Élever le mode d'une règle (par exemple de `VALIDATION` à `AUTO`) est refusé ; l'abaisser est accepté.
- Aucune valeur de confiance n'est lue par le contrôle de mode (test : confiance 0,99 et 0,01 donnent le même contrôle).

#### FR-135 : Un mandat est une délégation bornée, avec un plafond cumulé réservé puis confirmé

Un **mandat** est une délégation de signature bornée : le **délivreur**, le périmètre, le **plafond cumulé sur la période** (arbitrage du PO), un plafond unitaire optionnel, la **date d'expiration**, la **révocabilité immédiate**. Le plafond est un montant entier en unité mineure avec sa **devise** (le franc CFA n'a aucune décimale) ; un mandat sans devise est refusé. La consommation est un **compteur réservé avant l'exécution, confirmé au succès et libéré à l'échec**, de sorte que deux évaluations concurrentes ne dépassent pas ensemble le plafond. Le délivreur doit **détenir lui-même l'autorité** correspondante (un responsable de stock ne s'attribue pas le plafond d'un directeur financier) : la délivrance est refusée, pas signalée. Un mandat expiré ou révoqué fait **retomber les règles en `VALIDATION`**, avec notification, jamais en silence ; chaque exécution **cite le mandat** qui l'autorise, avec son plafond et son échéance. Un mandat ne couvre que des types d'action permis par FR-134.

**Conséquences (testables) :**
- Quarante exécutions de 1 unité sous un plafond cumulé de 30 unités : la trente et unième est refusée (test de plafond cumulé).
- Deux exécutions simultanées qui dépasseraient ensemble le plafond : l'une est refusée (test de concurrence sur la réservation).
- Une exécution en échec libère sa réservation ; le compteur revient à sa valeur d'avant.
- Un mandat délivré par un utilisateur sans l'autorité correspondante est refusé (`AUTORITE_INSUFFISANTE`).
- Un mandat expiré ou révoqué fait retomber les règles adossées en `VALIDATION` et crée une notification pour le responsable de la règle.
- Chaque ligne d'exécution contient l'identifiant du mandat, son plafond et son échéance.

#### FR-136 : Une exécution est une demande par événement, idempotente, annulable par compensation

L'assistant **décide, il n'exécute pas** : l'exécution est une **demande par événement** `assistant.action.demandee`, publiée par la boîte d'envoi (outbox) dans la **même transaction** que l'écriture de l'exécution, partitionnée par organisation et **idempotente** par identifiant d'exécution ; le module exécutant écrit. L'**annulation** est une compensation demandée au même module par le moyen d'annulation du catalogue. Toute exécution autonome est **notifiée** au responsable de la règle. L'exécution est un enregistrement distinct, en ajout seul, qui cite la proposition, le mandat éventuel, le module exécutant et le résultat. L'assistant ne conserve **aucune donnée métier** : le contexte vient de l'appelant ou d'un fournisseur de candidats interrogé à l'évaluation (faits datés, jamais un jugement).

**Conséquences (testables) :**
- Une exécution et son événement sont écrits ensemble ou pas du tout (test de crash entre les deux écritures).
- Un événement rejoué avec le même identifiant d'exécution n'est exécuté qu'une fois.
- Annuler une exécution crée un événement de compensation vers le module exécutant ; le statut de l'exécution d'origine ne change pas.
- Une exécution autonome crée une notification au responsable de la règle (test).
- L'assistant n'a aucun topic d'entrée de donnée métier (test sur la configuration des abonnements).

#### FR-137 : Ce que chaque logiciel permet à un agent

Le même mécanisme sert les quatre logiciels avec des plafonds différents. **Assurance** : aucune décision automatique ; le compte de service de l'IA ne lit que ce qu'il faut et n'écrit que des propositions ; seules des règles de `SUGGESTION` sont permises. **Microfinance** : aucune règle `AUTO` de blocage ; les relances sont validées par le gestionnaire de portefeuille et restent dans le calendrier de l'IMF ; aucun décaissement, aucune provision, aucun déplacement de fonds. **Distributeur** : le centre de règles a les niveaux `AUTO`, `A VALIDER`, `SUGGESTION` ; `AUTO` n'est permis que pour un type d'action réversible et non engageant ; tout ce qui touche argent, remise ou réputation est en `VALIDATION` par défaut. **Cabinet** : les trois modes et le mandat ; le cabinet ne délègue pas un dépôt ni une validation de liasse. Ce sont des **maxima** : un client peut toujours choisir plus strict.

**Conséquences (testables) :**
- Pour chaque logiciel, la liste des modes permis est lue de sa configuration ; un mode non permis est refusé (`MODE_NON_PERMIS_<LOGICIEL>`).
- Une règle de relance de microfinance en `AUTO` est refusée.
- Une règle de distributeur touchant une remise est créée en `VALIDATION` ; la passer en `AUTO` est refusé.
- L'interrupteur général d'un client coupe toutes les exécutions autonomes à la prochaine évaluation (fail-closed).

#### FR-138 : La voix, le chatbot de messagerie et les langues locales sont « bientôt »

Sont **bientôt**, sans date : la **voix** (dictée, transcription, synthèse vocale), le **chatbot de messagerie** de l'assuré, du client ou du prospect, et les **langues locales**. Ils sont inscrits au catalogue avec le statut `BIENTOT` (FR-128) et leurs écrans portent un bouton « bientôt ». La dictée vocale de la microfinance, spécifiée dans son PRD, est reportée par cette décision [ASSUMPTION: voir X7, FR-129]. Quand ils viendront, ils seront des surfaces sous mandat (FR-134, FR-135), avec un humain toujours joignable et une mesure de satisfaction, pas seulement du coût.

**Conséquences (testables) :**
- Aucun écran du premier jour n'enregistre de son ni ne propose de saisie vocale.
- Aucun chatbot ne répond à un message entrant au premier jour ; le message est lu seulement quand le logiciel le prévoit (FR-100).
- Les trois capacités répondent `NON_INSTALLE` à un appel.

#### FR-139 : Le Copilot et les agents ont leurs objectifs mesurés et leurs quotas

Le Copilot et les agents sont des capacités comme les autres (FR-92). Indicateurs du **Copilot** : part des réponses « sans réponse fiable » ; part des chiffres retrouvés dans leur source à l'échantillon ; taux d'acceptation des suggestions ; temps de réponse (`ia.objectif.copilot.temps_reponse_s`). Indicateurs des **agents** : exécutions autonomes annulées ou contestées (cible inférieure à 1 %, `ia.objectif.agent.annulees_pct`) ; propositions appliquées sans validation hors `AUTO` autorisé (cible 0) ; taux d'acceptation d'une file d'arbitrage. Un **quota d'inférence par organisation** est appliqué : au-delà, la réponse est `429` (`QUOTA_INFERENCE_DEPASSE`) ; deux files (interactive, différée) sont servies en tourniquet entre organisations.

**Conséquences (testables) :**
- Le rapport mensuel du Copilot donne les quatre indicateurs ci-dessus par logiciel.
- Le nombre de propositions appliquées sans validation hors `AUTO` autorisé est zéro (contrôle sur le décideur typé) ; une valeur non nulle déclenche une alerte à Money Vibes.
- Un client qui dépasse son quota reçoit `QUOTA_INFERENCE_DEPASSE` et les autres clients ne sont pas ralentis (test de charge à deux organisations).
- Vérité terrain : pour une exécution autonome, la réalité qui tranche est l'annulation ou la contestation constatée ; l'indicateur est calculé sur 30 jours (§7).

## 12. Lecture de pièces

La lecture d'une pièce se fait en deux étages. Le premier lit les caractères ; le second comprend la pièce. Cette section décrit les deux et leur frontière. La capacité vue par les logiciels est la famille 3 (§10.3, FR-99, FR-100).

#### FR-140 : La reconnaissance de caractères reste dans le service de documents ; la lecture et le classement sont dans l'IA

La **reconnaissance de caractères** (OCR : transformer une image en texte) reste dans le **service de documents** (moteur Tesseract, rastérisation des PDF), qui la rend derrière un port interchangeable. La **lecture et le classement** (type de pièce, champs, cohérence, rattachement) sont une **capacité de l'IA commune** (décision D13) qui reçoit le texte reconnu et l'image, et rend des propositions de niveau EXTRACTION. Le service de documents ne comprend pas la pièce ; l'IA ne lit pas les pixels au premier jour.

**Conséquences (testables) :**
- Le module d'IA n'importe aucune bibliothèque de reconnaissance de caractères ; il appelle le service de documents (test de dépendances).
- Remplacer le moteur de reconnaissance par un autre derrière le même port ne change aucun contrat de la capacité de lecture.
- Un fichier envoyé directement à la capacité de lecture sans passer par le service de documents est refusé.

#### FR-141 : Un PDF sans couche texte, un scan ou une photo sont lus de la même façon

Le service de documents lit un **PDF sans couche texte** en le rastérisant page par page ; un PDF qui contient du texte est lu sans reconnaissance. Une pièce corrompue ou illisible ne bloque pas la file : elle est mise de côté avec son motif (« poison pill » évité) et le dossier avance sur la saisie humaine. La lecture est **asynchrone** : le résultat arrive par événement ; la capacité est « non disponible » tant qu'il n'est pas là.

**Conséquences (testables) :**
- Un PDF composé uniquement d'images est lu et rend un texte non vide (test sur un PDF scanné).
- Un fichier corrompu n'arrête pas le traitement des fichiers suivants et reçoit le motif `PIECE_ILLISIBLE`.
- Un consommateur du service qui meurt est détecté par un contrôle de santé qui dit « non sain » (un conteneur « vivant » ne suffit pas).
- Le dossier peut être instruit sans attendre la lecture.

#### FR-142 : Chaque lecture a une confiance par champ, et l'humain confirme

Chaque champ lu porte une **confiance** et un **extrait source** ; chaque pièce porte un **type** et une confiance de classement. La confirmation par l'humain est obligatoire pour tout champ qui alimente un calcul ou un document officiel. Sous la confiance minimale `ia.lecture.confiance_minimale`, le champ est proposé vide, avec l'extrait, et la pièce part en « à classer à la main ». La lecture **ne rejette jamais** une pièce et ne valide jamais une identité ; le **score de lecture** de la microfinance est une information.

**Conséquences (testables) :**
- Aucun champ n'est écrit dans un formulaire officiel sans action de confirmation d'un humain.
- Un champ de confiance inférieure au minimum est rendu vide et signalé.
- Le score de lecture n'est pas un critère de validation d'une identité (test de non-usage).
- La correction d'un champ par l'humain est enregistrée et sert au calcul de la qualité par type de pièce (FR-99).

#### FR-143 : Les pièces médicales ne quittent jamais l'instance, et leur texte est une donnée de santé

Le **texte lu d'une pièce médicale** (certificat, rapport, ordonnance) est classé **donnée de santé** dès sa lecture, selon le registre unique de classification santé du logiciel d'assurance. Il n'est **jamais** montré à l'accueil ni à la numérisation ; il n'est jamais envoyé à un **modèle hébergé hors de l'instance** (§5) ; **aucun écart issu de la santé**, même anonymisé, ne remonte vers l'IA centrale (§8) ; aucune pièce ne sort. La lecture d'une pièce médicale est donc faite **dans l'instance**, par le service de documents et un modèle local. Si l'instance ne peut pas faire tourner un modèle de langage, la pièce médicale est classée par règles et la saisie reste humaine.

**Conséquences (testables) :**
- Le texte d'une pièce classée médicale n'apparaît dans aucune réponse rendue à un rôle non autorisé (test : accueil, numérisation).
- Un appel au modèle hébergé avec un contenu classé santé est refusé par la passerelle (`SANTE_HORS_INSTANCE`).
- Le niveau d'export « apprentissage » ne contient aucun champ issu de la santé (test sur le jeu exporté).
- Chaque lecture d'une pièce médicale écrit une ligne au journal des accès.

#### FR-144 : Au cabinet, la lecture alimente le profil de société et les cahiers, avec la hiérarchie de preuve

Pour le cabinet, la lecture extrait des **statuts et de la carte d'immatriculation** les champs du profil de société (formulaire pré-rempli, éditable, champs non extraits à saisir) et des **captures et factures** les montants, dates et tiers par mois, avec une confiance. La hiérarchie de preuve reste : bancaire, puis facture, puis reçu ou lecture, puis estimation ; une lecture n'écrase jamais une preuve de rang supérieur. La saisie reste toujours modifiable et n'est jamais figée sur la lecture seule.

**Conséquences (testables) :**
- Le profil de société pré-rempli reste éditable ; un champ non extrait est vide, jamais deviné.
- Une valeur issue de la lecture n'écrase pas une valeur d'un rang de preuve supérieur déjà saisie.
- Chaque montant lu d'une capture porte sa confiance et sa pièce source.
- La lecture n'est pas un prérequis de la clôture d'un mois.

#### FR-145 : Un modèle de vision viendra plus tard, sous le même contrat

Un **modèle de vision** (lire directement l'image : tampon, signature, tableau, écriture manuscrite) est **plus tard** (décision D13, niveaux N1 puis N2) ; il est exclu du premier jour. Quand il viendra, il sera une nouvelle version de la même capacité de lecture, sous le même contrat de proposition, évaluée contre la version en place (FR-92) ; le service de documents continuera de fournir le texte. Les pièces médicales resteront dans l'instance (FR-143).

**Conséquences (testables) :**
- Le catalogue contient la capacité « lecture par vision » au statut `PLUS_TARD` ; un appel rend `NON_INSTALLE`.
- Aucune dépendance à un service de vision n'est présente au premier jour.
- Une future version de vision ne peut être promue que si elle bat la version en place sur l'exactitude des champs (FR-99).

## 13. Feuille de route de la vision

La vision de Money Vibes (note du 10 au 11 novembre 2026) dépasse les quatre logiciels : elle décrit des produits bâtis sur l'IA commune. **Aucun n'est du premier jour** (décision D14). Cette section les liste, pour que chaque famille de capacités du §10 se lise aussi comme une brique de la suite, avec ce qui manque et la décision du PO. Elle ne spécifie aucun de ces produits : chacun aura son PRD.

#### FR-146 : La feuille de route classe chaque produit de la vision, avec son statut

Le tableau est la référence. Colonnes : ce que le produit fait ; les **familles de capacités** (§10) dont il dépend ; ce qui manque ; le statut donné par le PO.

| produit | ce qu'il fait | familles | ce qui manque | statut du PO |
|---|---|---|---|---|
| Risque | note la PME et le ménage en temps réel par interface pour institutions financières ; plafonds et explication | 1, 2, 13, 18 | données de plusieurs sources, consentement, juriste, institution décideuse | oui |
| Finance de la chaîne | crédit de stock, affacturage, financement fournisseur dans la commande du distributeur | 1, 2, 6, 7 | partenaire qui prête, contrôle du surendettement | à prendre vite |
| Assurance embarquée | souscription à l'achat ou au crédit, paiement sur indice | 1, 3, 5, 7 | assureur partenaire, agrément, données d'indice | oui |
| Agents IA métier | souscripteur, analyste crédit, recouvreur, comptable-fiscaliste, commercial | 8, 10, 19 | surfaces sous mandat, voix, mandat délivré par le client | adorés |
| Passeport financier | identité et données partagées par la PME elle-même | 1, 3 | identité partagée, consentement, registre | c'était un but |
| Pulse | indicateurs agrégés et prévision d'activité pour le secteur public | 6, 18 | seuil d'effectif, agrégation, accords | oui |
| Météo des prix et de la demande | prix et demande à 1 à 3 mois par produit, marché, pays | 6, 18 | séries de prix, historique multi-clients | retenu |
| Distribution en pilote automatique | commande suggérée, stock expédié avant la commande, financé et assuré | 6, 7, 11, 19 | Météo des prix, finance, assurance, mandat | le PO aime |
| Relation client commune | un moteur de ciblage, communication, service client, relance | 2, 8, 14, 19 | promesses de paiement, moment appris, lien paiement | validée |
| Facture certifiée qui vaut crédit | conformité automatique, impôt en temps réel, crédit sur factures certifiées | 3, 4, 7 | administration fiscale, secret fiscal, consentement | validé |
| Argent programmable sur PI-SPI | prélèvement intelligent, séquestre, crédit sur le rail | 2, 7 | mandats récurrents sur PI-SPI (à vérifier), participant agréé | validé |
| Modèle de fondation sectoriel | petit modèle entraîné par apprentissage fédéré, déployable sur site | toutes (langue, factures, sinistres) | données, entraînement fédéré, évaluation | non tranché |
| Transfrontalier | financement du commerce des PME entre pays (PI-SPI, PAPSS) | 1, 6, 18 | partenaires, cadre juridique ; horizon 2029 | non tranché |
| Point de quartier | boutique devenue point de service | — | — | refusé |
| Investir au pays | étude prédictive d'un projet | — | — | non retenu |
| Note de confiance | probabilité qu'une entreprise paie ou livre, badge | — | — | non retenu |

**Conséquences (testables) :**
- Chaque produit du tableau a au moins une famille ; une famille citée existe au §10.
- Aucune capacité d'un produit de ce tableau n'est active au catalogue du premier jour, sauf si elle est déjà une capacité du §10.
- Les produits « refusé » et « non retenu » n'ont aucune entrée de catalogue.
- Un produit passe de la feuille de route au développement par une décision du PO inscrite au registre des décisions.

#### FR-147 : Risque, le moteur de décision de risque, est une note et non une décision

Risque est la capacité de score (famille 1) offerte par interface à des institutions, qui rend une note de PME ou de ménage avec ses facteurs et un plafond suggéré. **La décision reste celle de l'institution** ; Money Vibes ne prête ni n'assure. Il demande : une identité partagée (FR-151), le consentement de la PME, un jeu d'évaluation, une revue juridique, un contrôle d'équité (FR-94) et le **contrôle du surendettement** avant tout crédit. Premier modèle commun : au mieux au second semestre 2027 (FR-91). La facturation par décision de risque est une hypothèse du PO.

**Conséquences (testables) :**
- Une note de Risque porte ses facteurs et sa provenance ; aucune réponse ne contient un ordre d'octroi.
- Sans consentement de la personne ou de la PME, aucune note n'est calculée ni exposée à un tiers.
- La note est refusée à la publication sans rapport d'équité (FR-94).

#### FR-148 : La finance de la chaîne dépend d'un partenaire qui prête, et d'un contrôle de surendettement

Elle offre crédit de stock, affacturage, financement de fournisseur dans l'écran de commande du distributeur ; **l'IMF ou la banque finance, la plateforme PI-SPI rembourse, Money Vibes ne prête pas**. Elle dépend des familles 1, 2, 6 et 7. Il manque : le partenaire financeur, le module de crédit avec le **contrôle du surendettement** (consultation d'un bureau d'information sur le crédit), le consentement du client, la facture certifiée (FR-156). Statut : « à prendre vite ».

**Conséquences (testables) :**
- Aucune proposition de financement n'est rendue sans le résultat d'un contrôle du surendettement.
- Aucun fonds ne passe par un compte de Money Vibes (test sur le flux).
- Un financement proposé est une proposition à l'institution qui décide.

#### FR-149 : L'assurance embarquée ne s'impose pas, et Money Vibes n'assure pas

Elle propose une assurance à l'achat ou au crédit et, plus tard, un paiement sur indice. Elle dépend des familles 1, 3, 5, 7. **Le prêteur ne peut pas imposer son assureur** : le client choisit. **L'assureur assure** ; Money Vibes met en relation. Le premier croisement annoncé est l'assurance emprunteur sur un crédit de microfinance. Il manque : l'assureur partenaire, l'agrément du courtage, le consentement du client, des indices fiables.

**Conséquences (testables) :**
- L'offre d'assurance est facultative et le refus n'a aucun effet sur l'octroi du crédit.
- Aucune donnée de santé du client n'est lue sans son consentement distinct.
- L'écran indique l'assureur, pas Money Vibes, comme porteur du risque.

#### FR-150 : Les agents métier sont des surfaces sous mandat, avec un humain toujours joignable

Souscripteur, analyste de crédit, recouvreur, comptable-fiscaliste, commercial par messagerie et voix : chacun est une **surface** (gabarit et configuration) du module `assistant`, avec le catalogue de types d'action (FR-134) et un mandat délivré par le client (FR-135). Il dépend des familles 8, 10 et 19. Il manque : la voix et les langues locales (FR-138), l'exécution des actions de crédit et d'assurance (engageantes par nature : jamais autonomes), les modules exécutants qui publient leurs types d'action.

**Conséquences (testables) :**
- Aucun agent métier n'a de type d'action engageant en `AUTO`.
- Chaque agent expose un chemin vers un humain joignable et une mesure de satisfaction.
- Un agent ne peut agir hors du périmètre de son mandat (test de périmètre).

#### FR-151 : Le passeport financier suppose une identité partagée et un consentement explicite

Le passeport permet à la PME de partager elle-même ses données vérifiées entre institutions. Il dépend des familles 1 et 3. Il manque : une **identité partagée** entre logiciels, un score commun entre logiciels (aujourd'hui deux scores distincts, FR-96), un **consentement explicite par finalité** et un registre qui le porte (§8). Le croisement d'une même PME entre le distributeur, l'IMF et le cabinet n'est **pas** du premier jour.

**Conséquences (testables) :**
- Aucune capacité du premier jour ne croise les données d'une même PME entre deux logiciels.
- Le croisement n'est possible que pour une PME qui a consenti à la finalité correspondante et dont l'identité est partagée.
- Un retrait de consentement arrête l'usage futur ; il ne « désentraîne » pas un modèle déjà publié (§8).

#### FR-152 : Pulse ne publie jamais une donnée individuelle ni un concurrent

Pulse publie des indicateurs agrégés et des prévisions d'activité pour les banques centrales, ministères et bailleurs. Il dépend des familles 6 et 18. Règles de la vision : **jamais les ventes d'un concurrent**, rien qui facilite une entente sur les prix, **seuil minimal d'entreprises par case**, aucune donnée individuelle, aucun indicateur public qui permette de reconnaître une entreprise. Il manque : l'agrégation sur un nombre suffisant de clients, les accords de données, le consentement de la finalité.

**Conséquences (testables) :**
- Une case d'effectif inférieur au seuil `ia.pulse.effectif_minimal` n'est pas publiée.
- Aucune sortie ne permet de reconnaître une entreprise individuelle (test de ré-identification sur un jeu d'essai).
- Les données d'un client sans consentement à la finalité ne sont pas agrégées.

#### FR-153 : La Météo des prix et de la demande est retenue, et dépend de données multi-clients

Elle prévoit le prix et la demande à un à trois mois par produit, marché et pays ; commerçants par messagerie ou voix, tableau de bord pour les distributeurs, interface pour banques, assureurs et États. Elle dépend des familles 6 et 18. Il manque : des séries de prix, un historique multi-clients (donc la finalité d'apprentissage commun, §8), et la voix. Statut : retenu. Elle est le « cerveau » de la distribution en pilote automatique.

**Conséquences (testables) :**
- La Météo n'est servie qu'à partir de données agrégées au seuil d'effectif minimal.
- Chaque prévision affiche sa provenance, son intervalle et sa date, comme FR-105.
- Elle est au statut `PLUS_TARD` au catalogue tant que son PRD n'est pas écrit.

#### FR-154 : La distribution en pilote automatique enchaîne voir, prévoir, agir, financer, assurer

Le produit que le PO aime : la Météo (FR-153) prévoit ; une **commande est suggérée** au point de vente ; le stock est expédié avant la commande ; elle est financée (FR-148) et assurée (FR-149) ; la robotisation vient en dernier. Il dépend des familles 6, 7, 11 et 19. Il manque : tous les produits qu'il enchaîne, un mandat du point de vente pour la commande automatique, la rampe de paiement. L'**action engageante** (commande, financement) reste **sous mandat plafonné et réversible** (FR-135).

**Conséquences (testables) :**
- Une commande suggérée n'est passée qu'après validation du point de vente ou sous un mandat plafonné.
- Chaque maillon (prévoir, commander, financer, assurer) peut être coupé sans empêcher les autres.
- Aucune commande n'est passée si le plafond de crédit du point de vente est dépassé.

#### FR-155 : La Relation client commune est un seul moteur de relance et de service client

Un moteur pour l'échéance de crédit, la facture, la prime d'assurance, la cotisation de tontine : ciblage, communication, service client, relance, promesses de paiement, lien de paiement par PI-SPI. Statut : **validée**. Elle dépend des familles 2, 8, 14 et 19, et réutilise le moteur d'automatisation et le service de notification. Il manque : l'endroit où vivent les promesses de paiement, le moment appris par zone, le service de relation client, la fusion avec les relances de chaque logiciel. Elle se place après la finance de la chaîne. La tontine ne garde jamais l'argent.

**Conséquences (testables) :**
- Un seul moteur déclenche les relances ; un logiciel qui garde son moteur propre est une exception documentée.
- Une relance reste sous mandat et dans les quotas de sollicitation (FR-127).
- Aucun fonds de tontine ne transite par Money Vibes.

#### FR-156 : La facture certifiée qui vaut crédit relie conformité fiscale et financement

Facture conforme automatiquement, impôt en temps réel, crédit sur factures certifiées, Pulse nourri par les factures. Statut : **validé**. Il dépend des familles 3, 4 et 7. Il manque : l'accord de l'administration fiscale (agrément éventuel), le **secret fiscal**, le consentement du client pour le crédit adossé, le partenaire de financement. L'optimisation d'impôt est **légale** et jamais de dissimulation.

**Conséquences (testables) :**
- Une facture certifiée n'est utilisée pour un crédit qu'avec le consentement du client.
- Aucune capacité ne propose de dissimulation ; toute proposition fiscale porte sa base légale (FR-111).
- Aucune donnée fiscale n'est visible d'un tiers sans consentement.

#### FR-157 : L'argent programmable sur PI-SPI respecte un plancher de vie et un consentement révocable

Prélèvement intelligent, séquestre et crédit sur le rail de paiement. Statut : **validé**, avec une vérification : PI-SPI propose-t-elle des mandats récurrents ? Il dépend des familles 2 et 7. Règles : **participant agréé**, **consentement révocable**, **plancher de vie jamais prélevé**, contrôle du surendettement. Il manque : la réponse sur les mandats récurrents, l'agrément du participant, le module de crédit.

**Conséquences (testables) :**
- Un prélèvement programmé ne peut jamais faire passer le solde sous le plancher de vie paramétré.
- Le retrait du consentement arrête les prélèvements futurs à la prochaine échéance.
- Aucun prélèvement programmé n'est créé sans l'identité d'un participant agréé.

#### FR-158 : Le modèle de fondation sectoriel et le transfrontalier ne sont pas tranchés

Le **modèle de fondation sectoriel** est un petit modèle entraîné par apprentissage fédéré sur le vocabulaire du métier (SYSCOHADA, CIMA, BCEAO, factures, sinistres, langues locales), déployable sur site. Le **transfrontalier** finance le commerce entre pays avec le module de transit (PI-SPI, PAPSS), horizon 2029. La note de vision n'a recueilli aucune décision du PO sur ces deux produits : ils sont listés **sans engagement**. Pour le modèle de fondation : il manque un entraînement fédéré spécifié (qui entraîne, qui agrège, quelle garantie contre la fuite par les poids), un jeu d'évaluation, un responsable ; le premier modèle commun n'est pas promis avant le second semestre 2027. L'apprentissage fédéré est une phase ultérieure (§7).

**Conséquences (testables) :**
- Aucune capacité ni aucun écran du premier jour ne nomme ces deux produits comme disponibles.
- Un modèle de fondation n'est jamais publié sans avoir battu la version en place (FR-92).
- Le terme « confidentialité différentielle » n'est employé qu'avec un budget de confidentialité tracé.

#### FR-159 : Les garde-fous de la vision s'appliquent à tous ces produits

Quatre garde-fous valent pour tout produit de la feuille de route. **Money Vibes note et relie ; elle ne prête ni n'assure** : l'institution prête, l'assureur assure. **Pas de crédit sans contrôle du surendettement**, et pas d'assurance imposée par le prêteur. **On met en commun l'apprentissage, pas les données** : les modèles voyagent, les fiches restent chez leur propriétaire, et chaque croisement entre logiciels a sa finalité consentie. **L'agrégation** ne montre jamais les ventes d'un concurrent, respecte un seuil d'effectif et n'expose jamais une donnée individuelle. Et la souveraineté : déploiement sur site possible, résidence des données par pays, notation des seules entreprises consentantes.

**Conséquences (testables) :**
- Aucun flux de fonds de prêt ou de prime ne transite par un compte de Money Vibes (test sur les flux).
- Aucune proposition de crédit n'est rendue sans le résultat du contrôle du surendettement.
- Aucune donnée d'une fiche cliente ne quitte l'instance de son propriétaire ; seuls des écarts agrégés au niveau « apprentissage » (§8) le font.
- Toute sortie agrégée respecte l'effectif minimal, sans donnée individuelle.

---

## 14. Ajouter un secteur sans rien perturber

Le PO l'a demandé ainsi : si l'on veut ajouter un **nouveau secteur** (ou un **nouveau pays**), cela doit être **facile**, et cela ne doit **rien perturber de ce qui est déjà présent**. La vision de la salle va dans le même sens : « chaque nouveau secteur ajoute surtout des référentiels et des données, pas un nouveau produit » ; « chaque pays ajoute un référentiel, jamais une version du code » (contrat de module, clause C6) ; « on ouvre le format, on garde l'IA ». Cette section pose les règles qui le rendent vrai pour l'IA commune : le **pack de secteur**, l'**isolation**, la **non-régression**, le **démarrage à froid**, les **pays**, le **kit public** et une **checklist d'ajout**.

Un **secteur** est ici un domaine d'activité servi par un ou plusieurs modules : les quatre logiciels d'aujourd'hui (cabinet, distributeur, microfinance, assurance) sont les **quatre premiers secteurs** ; l'eau, le transit, le solaire en paiement à l'usage, la mobilité, la santé, l'éducation, les tontines, la diaspora, le BTP et les collectivités sont ceux de l'horizon. `[ASSUMPTION : les quatre logiciels actuels sont traités comme les quatre premiers packs de secteur ; le PO ne l'a pas dit, mais c'est la seule façon de prouver que le format suffit]`

#### FR-160 : Un secteur s'ajoute, le socle ne se modifie pas

L'IA commune est **fermée à la modification, ouverte à l'ajout** : brancher un nouveau secteur ou un nouveau pays ne demande **aucune modification** du socle de l'IA (contrat de proposition, moteurs de règles et de modèles, registre, passerelle de langage, calibration locale, évaluation) ni d'**aucun secteur déjà en place**. Tout ce qu'un secteur apporte tient dans un **pack de secteur** (FR-161) et, au plus, dans une **extension du catalogue** (FR-169). Retirer un secteur est aussi simple : on désinstalle son pack, et rien d'autre ne bouge. C'est le principe du contrat de module : une plateforme, le même code pour tous, des variantes par déclaration et jamais par branche de code (clauses C6 et C11).

**Conséquences (testables) :**
- Un test ajoute un pack de secteur de démonstration à une installation qui porte les quatre secteurs actuels : le **code livré** du socle est identique avant et après (empreinte inchangée), et aucun fichier d'un autre secteur n'est modifié.
- Un test rejoue la **recette complète** des quatre secteurs (parcours UJ-1 à UJ-8, FR-10) avant et après l'ajout : les propositions rendues sur un jeu de dossiers figés sont **identiques**, hors horodatage.
- Un test désinstalle le pack ajouté : les quatre secteurs répondent comme avant, et les propositions déjà inscrites au registre de l'IA (FR-17) pour le secteur retiré restent lisibles, avec leur trace opposable.
- Une recherche dans le code du socle des noms de secteur (« assurance », « microfinance », « distributeur », « cabinet » et ceux du pack de démonstration) ne trouve **aucune branche conditionnelle** : un secteur n'est jamais un `if` dans le socle.

#### FR-161 : Le pack de secteur, déclaratif et versionné

Un secteur se déclare dans un **pack de secteur** : un ensemble de fichiers **déclaratifs** (pas de code exécutable de secteur dans le socle), **versionné**, **signé** par Money Vibes, livré comme une mise à jour de module (même mécanique que les manifestes). Un pack contient au moins : (1) le **vocabulaire** du secteur (FR-162) ; (2) les **capacités consommées** parmi les familles existantes, avec les **règles N0** (FR-163) ; (3) ses **objectifs** mesurés et ses **vérités terrain** (FR-164) ; (4) ses **paramètres par pays** (FR-171) ; (5) ses **garde-fous propres** (FR-165) ; (6) ses **exigences de résidence de données** (FR-172). Un pack a un identifiant, une version, une compatibilité déclarée avec la version du catalogue et du contrat de proposition, et un **état** (`BROUILLON`, `ESSAI`, `ACTIF`, `RETIRE`).

**Conséquences (testables) :**
- Un test charge un pack auquel il manque une des six sections : le chargement est refusé avec un code nommé qui dit laquelle manque.
- Un pack dont la signature est absente ou invalide n'est pas installé en `ACTIF` ; un pack dont la compatibilité de catalogue n'est pas satisfaite est refusé sans effet sur les autres packs.
- Un test installe deux versions du même pack en parallèle (essai chez une organisation, actif chez une autre) : chacune ne voit que la sienne.
- Un contrôle automatique rejette tout fichier d'un pack qui n'est pas une déclaration au schéma publié (FR-173) : aucun code exécutable.

#### FR-162 : Le vocabulaire du secteur se rattache à un noyau neutre

L'IA garde un **noyau neutre** : un petit nombre de notions qui ne portent le mot d'aucun secteur, par exemple **tiers** (la personne ou l'entreprise sur laquelle on raisonne), **créance** (une somme attendue à une date), **engagement** (un contrat qui lie), **objet** (ce sur quoi porte un dossier), **zone**, **événement**, **pièce**. Chaque capacité est écrite **contre ce noyau**. Le pack apporte la **correspondance** : l'emprunteuse d'une institution de microfinance, l'assurée, le point de vente, le ménage abonné à un kit solaire, la cotisante d'une tontine sont des **tiers** ; l'échéance, la prime, la facture, la mensualité d'un kit, la cotisation sont des **créances** ; il donne aussi les **mots affichés** à l'écran, par langue (FR-171). Un secteur nouveau n'invente jamais une capacité parce qu'il a un autre mot : il fait la correspondance (reprise du vocabulaire par verticale de FR-90).

**Conséquences (testables) :**
- Un test charge un pack dont le vocabulaire laisse sans correspondance une notion du noyau dont une capacité consommée a besoin : le chargement est refusé avec le nom de la notion manquante.
- Un test change un libellé du vocabulaire d'un secteur : seuls les écrans et les explications de ce secteur changent ; la sortie de la capacité (valeur, confiance, facteurs) est inchangée.
- Un test d'inventaire vérifie qu'**aucune** capacité du catalogue ne cite un mot propre à un secteur dans son contrat d'entrée ou de sortie.

#### FR-163 : Les capacités consommées et les règles N0 du secteur

Le pack déclare les **capacités qu'il consomme** parmi celles du catalogue (FR-37, FR-90), avec leur version minimale, et livre pour chacune ses **règles N0** : des règles expertes **explicables**, écrites pour le secteur (par exemple, pour un score de ménage, la régularité des paiements sur douze mois et le rapport mensualité-revenu), **paramétrées par pays** et rangées dans le pack. Les règles N0 d'un secteur sont **à lui** : elles ne partagent aucun paramètre avec celles d'un autre secteur, sauf **héritage déclaré** d'un jeu de règles d'une famille transverse (FR-170). Le jour 1, un secteur n'a donc **rien d'autre à fournir** pour que l'IA lui réponde : le N0 suffit (FR-91).

**Conséquences (testables) :**
- Une capacité consommée sans règle N0 ni modèle commun applicable est refusée au chargement du pack : « aucune réponse utile au jour 1 » est un défaut du pack, pas un état permis (FR-5).
- Un test modifie un paramètre d'une règle N0 d'un secteur : les propositions d'un autre secteur qui consomme la même capacité sont inchangées.
- Chaque règle N0 d'un pack porte son **explication** (facteurs et poids, ou règle appliquée) ; une règle sans explication est refusée (FR-16).
- Une règle N0 de pack ne peut ni décider, ni bloquer, ni écrire autre chose qu'une proposition : un test le tente et obtient un refus nommé (FR-13).

#### FR-164 : Les objectifs et les vérités terrain du secteur

Le pack déclare, pour chaque capacité consommée, ses **objectifs mesurés** (qualité, usage, effet métier, équité : FR-92) et ses **vérités terrain**, c'est-à-dire **ce qui tranche « qui avait raison »** et **à quel horizon**. Exemples : pour le score d'un ménage abonné à un kit solaire, la vérité terrain est le **retard de plus de 30 jours** observé à l'horizon de six mois (IA-P84) ; pour une probabilité de paiement de cotisation, la **cotisation reçue** à la date du tour ; pour un résumé, la **correction de l'utilisateur**. Quand l'humain et l'IA ne sont pas d'accord, le **désaccord est conservé** et, à l'horizon déclaré, confronté à la réalité : le pourcentage « l'IA avait raison / l'humain avait raison » se calcule **par capacité et par secteur**, comme pour les quatre logiciels (journal des désaccords, partie 2). Sans vérité terrain déclarée, une capacité d'un secteur reste **à N0** : elle ne peut pas être promue (FR-167).

**Conséquences (testables) :**
- Un test charge un pack dont une capacité n'a pas de vérité terrain : la capacité est acceptée **à N0 seulement**, avec le motif « non mesurable », et ne peut atteindre ni N1 ni N2.
- Le test de recette d'un secteur de démonstration crée un désaccord, avance l'horloge jusqu'à l'horizon déclaré, injecte la réalité et lit le pourcentage de raison : il est calculé par capacité et par secteur, sans mélange.
- Un test change une cible chiffrée d'un pack : les rapports mensuels des autres secteurs sont inchangés.
- Une vérité terrain qui dépend d'une donnée que le secteur ne produit pas encore déclare son **délai d'attente** ; avant ce délai, la capacité affiche « pas encore mesurée ».

#### FR-165 : Les garde-fous propres au secteur ne peuvent qu'ajouter

Un pack déclare ses **garde-fous propres** : les **variables interdites** pour tout score sur une personne dans ce secteur (au-delà de la liste fermée de FR-18), les **objets sur lesquels aucune capacité ne peut proposer de montant** (FR-20 : un dossier corporel en assurance, un traitement en santé), la **classification des données sensibles** du secteur (FR-19 : santé, localisation d'un ménage, données d'un mineur), les capacités **non activables** tant qu'une revue juridique n'a pas eu lieu (FR-28) et les **actions** qu'aucun mandat ne peut rendre autonomes (FR-14). Règle de fer : **un pack peut ajouter un garde-fou, jamais en retirer un du socle** (FR-4).

**Conséquences (testables) :**
- Un test charge un pack qui tente de retirer la classification santé, de rendre activable une décision automatique de crédit ou de lever une variable interdite du socle : le chargement est refusé avec un code nommé par garde-fou.
- Un test déclare un objet « sans montant » dans un pack : toute proposition de montant sur cet objet est refusée, dans ce secteur seulement.
- Une donnée classée sensible par un pack est traitée comme telle **dès le chargement** : un test vérifie qu'elle n'apparaît ni dans le niveau d'export « apprentissage », ni dans un envoi à la passerelle de langage.
- Un secteur qui touche à la santé hérite d'office de FR-19 et de FR-36 (rien de médical hors de l'instance) : un pack ne peut pas déclarer le contraire.

#### FR-166 : Les modèles et les calibrations d'un secteur sont versionnés à part

Chaque modèle et chaque calibration est rangé sous une **clé de secteur** : `secteur / capacité / version`. Une calibration N2 est la **donnée d'une organisation** (clause C11, point 3) **et** d'un secteur ; un modèle commun N1 a **une ligne par secteur** quand il est propre au secteur, ou une **ligne transverse** quand la famille est déclarée telle (FR-168). Le registre des modèles (partie 2) ne fait **jamais** d'alias partagé entre deux secteurs : un secteur promeut, retient ou **retire en une action** sa propre version sans que l'alias d'un autre secteur bouge. Une organisation qui porte deux secteurs (un distributeur qui active aussi un module de tontine, par exemple) a **deux calibrations séparées**.

**Conséquences (testables) :**
- Un test publie une nouvelle version du modèle d'un secteur : les alias `champion` et `challenger` des autres secteurs ne changent pas, et leurs propositions sur un jeu figé sont identiques.
- Un test retire en une action la version d'un secteur : seul ce secteur retombe sur sa version précédente ou sur N0 ; les propositions des autres sont inchangées.
- Une mise à jour du modèle d'un secteur n'écrase **jamais** la calibration d'une organisation (empreinte identique avant et après : clause C11), ni celle de la même organisation dans un autre secteur.
- Un test d'organisation à deux secteurs vérifie que les écarts d'un secteur n'alimentent **pas** la calibration de l'autre.

#### FR-167 : Non-régression obligatoire, champion et challenger par secteur

Aucune version (modèle, règle, pack, extension du catalogue) n'est promue sans deux preuves. **D'abord**, une **non-régression sur chaque secteur déjà en place** : un jeu de dossiers figés par secteur, rejoué à chaque candidat, doit donner les mêmes propositions pour tout secteur que le candidat **ne devait pas** toucher (IA-P80). **Ensuite**, un **champion/challenger par secteur** : un challenger n'est promu que s'il bat le champion **du même secteur** sur les objectifs de ce secteur (FR-164, FR-92), sans régression d'équité (FR-18). L'ordre de promotion (hors ligne, ombre, canari, général) est celui de la partie 2, imposé ici **secteur par secteur**, jamais globalement. Un secteur sans jeu de non-régression (IA-P81) ne peut pas être promu et ne peut pas être ajouté `ACTIF`.

**Conséquences (testables) :**
- Une promotion qui change la sortie d'un secteur non visé sur son jeu figé au-delà de IA-P80 est **refusée** par la chaîne de livraison, avec le nom du secteur et des dossiers qui ont bougé.
- Un test fait gagner un challenger sur le secteur A et le fait perdre sur le secteur B : il est promu pour A seulement ; B garde son champion.
- Un nouveau secteur ne passe pas de `ESSAI` à `ACTIF` sans un jeu de dossiers figés **et** la preuve que les jeux des autres secteurs sont inchangés.
- Le rapport de non-régression est un artefact signé, rattaché à la version publiée ; un test vérifie qu'une version sans rapport n'est pas publiable.

#### FR-168 : L'apprentissage commun ne mélange les secteurs que pour des familles déclarées transverses

Par défaut, **l'apprentissage ne franchit pas la frontière d'un secteur**. Une famille de capacités n'est **transverse** que si le catalogue la déclare telle, par exemple la **lecture de pièces**, le **contrôle de cohérence**, l'**anomalie sur une série de paiements**, la **rédaction d'une relance**, le **résumé sourcé** ; les familles qui évaluent un **risque sur une personne** (score d'un tiers, probabilité de paiement, tarification) restent **par secteur** jusqu'à décision écrite du PO. Un apprentissage transverse exige trois conditions : la famille est déclarée transverse, la **finalité « apprentissage commun » est consentie** par chaque organisation concernée (FR-7), et les écarts remontent au niveau d'export « apprentissage » (agrégats, effectif minimal IA-P04, aucun texte libre, aucune donnée de santé). Le **croisement d'une même PME entre secteurs** (identité partagée, passeport) reste l'horizon de la vision, avec **consentement explicite par croisement** ; il n'est pas du premier jour (FR-9). `[ASSUMPTION : le PO a dit « une finalité consentie pour chaque croisement » ; la liste des familles transverses et celle des familles « par secteur » sont une recommandation à valider]`

**Conséquences (testables) :**
- Un test tente de verser les écarts d'un secteur dans l'entraînement d'une famille « par secteur » d'un autre secteur : refus nommé, et rien n'est sorti.
- Un test retire la finalité « apprentissage commun » d'une organisation : ses écarts n'entrent plus dans l'entraînement transverse après le délai IA-P14 ; elle continue de **recevoir** le modèle transverse.
- Une famille ne passe de « par secteur » à « transverse » que par une **version du catalogue** signée, avec la preuve d'une non-régression sur chaque secteur concerné (FR-167) ; un test la déclare sans preuve et obtient un refus.
- Un test inspecte les envois d'une centrale de démonstration : aucun jeton d'export ne mélange les écarts de deux secteurs hors d'une famille transverse.

#### FR-169 : Une famille nouvelle est une extension versionnée du catalogue

Si un secteur demande une capacité qui n'existe dans **aucune** famille du catalogue, on n'ouvre pas d'exception dans le pack : on ajoute une **famille nouvelle** au catalogue, comme une **extension versionnée**, avec son contrat (entrées, sorties, vocabulaire neutre), son N0 par défaut, ses objectifs types, ses garde-fous et son niveau de risque. Elle s'**ajoute** sans modifier le contrat d'une famille existante ; elle est proposée par l'équipe IA de Money Vibes (un partenaire la **demande**, il ne la livre pas : FR-173), relue par le juriste et le délégué à la protection des données si elle touche une personne, puis publiée avec une **version du catalogue**. Un secteur qui ne la consomme pas ne la voit pas. Le catalogue maintient en parallèle IA-P85 versions.

**Conséquences (testables) :**
- Un test publie une famille nouvelle de démonstration : les contrats des 19 familles existantes sont identiques (empreinte) et leurs tests de recette passent sans modification.
- Un module qui ne déclare pas la nouvelle famille n'en reçoit aucune proposition : un test l'appelle et obtient un refus nommé (FR-37).
- Une famille nouvelle sans N0 par défaut est refusée à la publication (FR-5).
- Un test demande une version antérieure du catalogue (dans la limite IA-P85) et obtient le contrat tel qu'il était ; un pack compatible avec cette version continue de tourner.

#### FR-170 : Le démarrage à froid d'un secteur

Un secteur neuf n'a **ni historique ni modèle propre**. Il démarre ainsi (FR-5, FR-91) : **N0 au jour 1** (ses règles, FR-163) ; **N1 hérité** d'une famille **transverse** (FR-168) quand c'est pertinent, par **transfert** : le modèle transverse est utilisé tel quel, présenté comme « modèle commun », avec la **mesure de sa pertinence** sur le secteur (écart entre sa sortie et la vérité terrain du secteur, FR-164) ; si cette mesure est sous IA-P83, le secteur **reste à N0** et le dit ; **N2** (calibration ou modèle propre) s'ouvre quand le **seuil de données** de la capacité (IA-P86) est atteint **dans ce secteur**. L'**héritage est déclaré** dans le pack (famille transverse, version) et **réversible** : un secteur peut cesser d'hériter sans toucher aux autres.

**Conséquences (testables) :**
- Un test démarre un secteur de démonstration sans historique : chaque capacité consommée répond (N0), le niveau est affiché (FR-24), aucune réponse « pas de données ».
- Un test hérite un modèle transverse dont la pertinence mesurée est sous IA-P83 : la capacité reste à N0 et le motif est écrit au rapport.
- Le passage à N2 n'a lieu que lorsque le seuil de **ce** secteur est atteint : un test alimente un autre secteur au-delà de son seuil et vérifie que le secteur neuf ne passe pas à N2.
- Un test supprime l'héritage déclaré : le secteur retombe sur N0, sans changement chez aucun autre secteur.

#### FR-171 : Un pays est un référentiel, avec sa langue, sa devise et ses calendriers

Ajouter un **pays** ne demande **aucun code nouveau** (vision : « chaque pays ajoute un référentiel, jamais une version du code » ; clause C6). Le pack de secteur, ou un **pack de pays** qui s'y superpose, porte pour chaque pays : le **référentiel** (comptable, fiscal, réglementaire : le référentiel SYSCOHADA révisé, celui des assurances de la zone CIMA, celui des systèmes financiers décentralisés de la BCEAO sont déjà au catalogue), les **paramètres des règles N0** (taux, plafonds, seuils légaux comme le taux d'usure), la **langue** et les **gabarits de texte** (FR-90), la **devise** et ses décimales, les **calendriers, fériés et fuseaux**, et le **corpus légal** versionné d'où viennent les affirmations sourcées (FR-16). L'IA ne suppose **jamais** une devise : toute somme porte la sienne. `[ASSUMPTION : le contrat de balance n'a pas de devise déclarée aujourd'hui (convention implicite) ; la salle l'a nommé comme la dette à payer avant le deuxième pays. Cette exigence suppose que cette dette soit payée ailleurs ; ce PRD ne la règle pas]`

**Conséquences (testables) :**
- Un test ajoute un pays de démonstration (autre devise, autre langue, autre taux d'usure) à un secteur existant **sans changer le code livré** : les règles N0 utilisent les paramètres du nouveau pays pour ses organisations, et ceux de l'ancien pour les autres, inchangés.
- Une somme sans devise en entrée d'une capacité est refusée avec un code nommé ; une conversion implicite entre deux devises échoue.
- Une affirmation à portée légale dans un pays dont le corpus n'est pas chargé est rendue « non sourcée » (FR-16), jamais déduite d'un autre pays.
- Un test passe un utilisateur d'une langue à une autre : seuls les libellés, gabarits et explications changent ; valeur, confiance et facteurs sont identiques.

#### FR-172 : La résidence des données et le rail de paiement se déclarent, ils ne se recodent pas

Un pays peut **exiger que ses données restent chez lui**. Le pack de pays déclare une **règle de résidence** par classe de données : où elles peuvent être **traitées** (instance de l'organisation, région d'hébergement du pays, centrale de Money Vibes) et ce qui peut en sortir. Si la règle est « reste dans le pays », **rien** ne remonte à la centrale, **pas même un agrégat**, tant qu'une décision juridique du pays ne l'autorise pas ; l'organisation reçoit tout de même les mises à jour du modèle commun (descente seule, FR-7). Les envois à la **passerelle de langage** (FR-33, FR-34) suivent la même règle : un pays qui interdit la sortie ne peut utiliser que le modèle ouvert local (FR-35). Le **rail de paiement** (PI-SPI, un autre rail instantané, un portefeuille local) est une **interface unique** : l'IA propose par exemple un lien de paiement dans une relance sans connaître le rail ; le pack du pays nomme le rail à brancher. `[ASSUMPTION : « souveraineté des données pays par pays » est une parole de la salle (le prêteur doit être agréé dans le pays de l'emprunteur) ; le niveau « pas même un agrégat » est une recommandation]`

**Conséquences (testables) :**
- Un test déclare un pays à résidence stricte : aucun jeton d'export n'est émis pour ses organisations, aucun appel à la passerelle ne part, et les mises à jour de modèle arrivent quand même.
- Un test change le rail d'un pays (de PI-SPI à un rail de démonstration) : la capacité de relance produit le même message avec un autre lien ; aucun code de capacité n'est modifié.
- Un inventaire liste, par pays, les flux sortants autorisés : un flux sans règle de résidence est refusé.
- Un test change la règle d'un pays : les organisations des autres pays ne voient aucun changement de flux.

#### FR-173 : Le format est public, l'IA reste à Money Vibes

Le **format d'un pack de secteur**, le **contrat d'une capacité** et le **contrat de proposition** sont **publiés** : schémas, documentation, jeu de tests de conformité, **kit de développement** pour les **partenaires intégrateurs** et pour une **place de marché** de modules et de packs (vision, séance 17 : le contrat de module devient un kit public, une place de marché avec partage des revenus, un réseau de partenaires certifiés par pays). La limite est celle de la salle, validée par le PO : **on ouvre le format, on garde l'IA**. Un partenaire **déclare** un pack et **consomme** des capacités par le contrat ; il ne reçoit **ni** le code des modèles communs, **ni** leurs poids, **ni** les données d'entraînement, **ni** l'accès à la centrale. Il n'**entraîne pas** le modèle commun : un pack de partenaire apporte au plus ses règles N0 et sa calibration locale, qui reste une donnée de l'**organisation cliente**. Ses écarts ne remontent à l'apprentissage commun que dans les conditions de FR-168. Money Vibes **certifie** un pack avant sa mise à disposition (FR-174). `[ASSUMPTION : les modalités commerciales de la place de marché et le partage des revenus ne sont pas fixés ; ce PRD ne fixe que la frontière technique et de confiance]`

**Conséquences (testables) :**
- Un contrôle de publication cherche dans le kit tout modèle commun, tout jeu de données réel et tout identifiant de client, et n'en trouve aucun : le kit ne contient que schémas, documentation, tests et exemples synthétiques.
- Un pack de démonstration de partenaire appelle une capacité : il reçoit une proposition au contrat, et **aucune** route ne lui donne les poids, les écarts d'autres organisations ou la centrale.
- Un pack de partenaire qui demande un droit d'entraînement sur le modèle commun est refusé au chargement avec un code nommé.
- Un test retire la certification d'un pack : il repasse en `ESSAI` ou `RETIRE` et ses propositions ne s'affichent plus comme du N1 ; le reste de l'installation est inchangé.

#### FR-174 : La checklist d'ajout d'un secteur ou d'un pays, et un exemple

Ajouter un secteur ou un pays suit une **checklist** testable : ce qu'il faut **fournir**, ce qui est **vérifié automatiquement**, et **qui valide**.

| Étape | À fournir | Vérifié automatiquement | Qui valide |
|---|---|---|---|
| 1. Déclarer | pack complet (FR-161), vocabulaire et correspondance (FR-162) | schéma, six sections, signature, compatibilité de catalogue | équipe IA de Money Vibes |
| 2. Capacités et N0 | capacités consommées, règles N0 explicables par pays (FR-163) | réponse utile au jour 1, explication présente, aucune décision | équipe IA |
| 3. Mesure | objectifs et vérités terrain avec horizon (FR-164) | une vérité terrain par capacité, sinon N0 seulement | équipe IA et métier du secteur |
| 4. Garde-fous | variables interdites, objets sans montant, classes sensibles (FR-165) | aucun retrait d'un garde-fou du socle | juriste et délégué à la protection des données |
| 5. Pays | référentiel, langue, devise, calendriers, corpus légal, rail, résidence (FR-171, FR-172) | devise explicite, corpus chargé, chaque flux avec une règle | juriste du pays, partenaire local |
| 6. Isolation | clé de secteur, héritage déclaré (FR-166, FR-170) | aucun alias partagé, aucune écriture hors secteur | équipe IA |
| 7. Non-régression | jeu de dossiers figés du secteur (FR-167) | jeux des autres secteurs identiques, empreintes de calibration inchangées | équipe IA, rapport signé |
| 8. Essai | un client pilote en `ESSAI` (au moins IA-P82 jours), ombre puis canari | objectifs mesurés, équité, désaccords conservés | PO et client pilote |
| 9. Activation | passage à `ACTIF` | les huit contrôles précédents verts, registre de l'IA branché | PO |

Un secteur ou un pays n'est `ACTIF` que si **les neuf lignes sont vertes** ; une ligne rouge ne bloque que lui. `[ASSUMPTION : les validateurs par ligne sont une recommandation ; le PO fixera les noms une fois l'équipe IA constituée]`

**Exemple court : l'énergie solaire en paiement à l'usage** (secteur de l'horizon de la salle : kits payés par petites sommes en monnaie mobile, coupés à distance en cas d'impayé, possédés au bout du paiement).

| Ce qui est **réutilisé** sans rien changer | Ce qui est **ajouté** par le pack |
|---|---|
| Le contrat de proposition, le registre, la provenance, la doctrine « l'IA propose, l'humain décide » | Le **vocabulaire** : ménage abonné = tiers ; mensualité du kit = créance ; kit = objet ; zone de couverture |
| Les familles score d'un tiers, probabilité de paiement et relances, prévision, anomalie, terrain (tournée du technicien) | Les **règles N0** du score de ménage et de la relance (régularité sur douze mois, jour de marché, jour de paie) |
| La passerelle de langage, la lecture de pièces (pièce d'identité, contrat) | La **vérité terrain** : retard de plus de 30 jours à six mois ; le désaccord « l'IA dit risque, le technicien contredit » confronté à l'impayé réel |
| Le rail de paiement, les gabarits de relance (traduits) | Les **garde-fous propres** : **la coupure à distance n'est jamais une action autonome** (engageante, humaine) ; aucun montant proposé hors zone ; localisation du ménage classée sensible |
| Le démarrage à froid : N1 hérité de la famille transverse « relance » ; score à N0 jusqu'au seuil | Les **paramètres par pays** : taux, plafonds de crédit à la consommation, langue, devise |

Pour la **tontine** (cotisations, ordre de passage, pénalités), le schéma est le même : la cotisante est un **tiers**, la cotisation une **créance**, la vérité terrain la **cotisation reçue au tour**, et le garde-fou propre que **Money Vibes ne garde jamais l'argent** (garde-fou posé par la vision) : aucune capacité de la tontine ne propose de mouvement de fonds.

**Conséquences (testables) :**
- Un test rejoue la checklist sur le secteur de démonstration « solaire » : la chaîne de livraison produit les neuf lignes, chacune avec son artefact ; une ligne absente rend l'ajout impossible.
- Un test ajoute « solaire » puis « tontine », puis dans l'ordre inverse : l'état final des quatre secteurs d'origine est identique dans les deux cas (FR-167).
- La coupure à distance d'un kit, demandée par l'IA, est refusée avec un code nommé : seul un humain, avec un motif, peut la commander (FR-13, FR-14).
- Un pays de démonstration ajouté au secteur « solaire » n'altère ni un score, ni une explication, ni une alerte d'équité d'un secteur qui ne l'a pas.
