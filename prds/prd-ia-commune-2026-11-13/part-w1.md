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
