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
