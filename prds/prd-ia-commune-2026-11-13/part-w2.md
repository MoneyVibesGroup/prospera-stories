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

