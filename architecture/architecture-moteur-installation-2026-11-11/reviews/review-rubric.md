# Relecture « grille de la bonne spine » — Moteur d'installation

Objet relu : `ARCHITECTURE-SPINE.md` (draft, 2026-11-11) et `.memlog.md` (D-1 → D-11).

## Verdict

Le squelette est bon (paradigme tire/signe, quatre unités, un propriétaire par donnée, ancrage à deux niveaux, contrats nommés), mais la spine n'est pas prête pour deux développeurs : elle ne décide ni la sécurité des clés et des certificats, ni le comportement quand la centrale tombe, ni la reprise d'une instance dont le serveur est perdu, et elle ne fixe pas les formats des artefacts signés que la centrale et l'agent construiront en parallèle.

Les diagrammes mermaid sont syntaxiquement valides (deux `flowchart`, sous-graphes et cylindres corrects).

## Constats critiques

### C-1 — Garde des clés privées et de la clé racine non décidée (dimension sécurité)

- AD-7 dit « clé racine hors ligne, au coffre » et « clés de signature annuelles », rien d'autre. Non décidés : qui détient la racine (une personne ? deux ?), quel support (HSM, clé matérielle, papier), où se fait la signature (poste du dev, CI, machine dédiée), où vit la clé cosign et la clé Ed25519 de signature des licences, qui peut signer une licence ou une sanction.
- Aucun chemin si la racine est compromise ou perdue : le fichier d'urgence est signé par la racine, donc inutilisable dans ce cas ; la rotation de la racine (le certificat racine est embarqué dans l'agent) n'existe pas.
- Pas de séparation des clés entre dev, recette et production : un agent de recette ne doit jamais accepter une racine de test en production, et inversement.
- Le « rythme de rotation » est différé, mais la garde et la compromission ne le sont pas à bon droit : ce sont des invariants (une signature de licence frauduleuse ruine NFR-1).
- Correction : ajouter un AD « Gouvernance des clés » : (1) racine hors ligne sur matériel dédié, deux détenteurs, signature par cérémonie journalisée ; (2) clés de signature (cosign, JWS) dans un module matériel ou un service de signature à droits séparés, jamais dans l'intégration continue en clair ; (3) racine de secours : une seconde racine embarquée dans l'agent dès la v1, activable par la première ; (4) racines distinctes dev/recette/production, l'agent de production refuse une racine non production (test) ; (5) procédure de compromission d'une clé de signature (révocation par la racine) et de la racine (nouvelle version de l'agent signée par la racine de secours). Laisser seul le rythme exact en Deferred.

### C-2 — L'agent est root sur le serveur du client, sans durcissement décidé (sécurité)

- AD-10 fait de l'agent le seul détenteur du socket Docker, c'est-à-dire root sur l'hôte. Or l'agent parle à internet (contact), analyse des fichiers hors ligne arrivés par clé USB, prépare des exports et ouvre le tunnel de support. Une faille dans l'un de ces chemins vaut root sur le serveur de l'assureur.
- Rien sur : exécution de l'agent (utilisateur, capacités, système de fichiers en lecture seule), séparation en deux processus (un petit exécuteur privilégié qui ne fait que « lancer l'empreinte vérifiée X », et un processus réseau sans socket), liste blanche des commandes Compose, refus des options dangereuses (`privileged`, montages de l'hôte) dans les gabarits signés, durcissement de l'hôte (système, pare-feu, mises à jour du système, de Docker, de Traefik, des images de base), chiffrement au repos (disque, Mongo, MinIO, second support), secrets sur site (mots de passe de bases, clé privée mTLS, clé de chiffrement des sauvegardes, identifiants des connecteurs du client).
- La configuration minimale (NFR-10) donne la taille du serveur mais pas la posture de sécurité.
- Correction : AD « Posture de sécurité de l'hôte » : l'agent se compose d'un exécuteur privilégié minimal (seul au socket, n'accepte que des plans signés et vérifiés) et d'un processus de contact sans privilège ; les gabarits Compose signés interdisent `privileged`/montages hôte (test de conformité sur le manifeste) ; chiffrement du disque et des sauvegardes obligatoires au montage (FR-25 refuse sinon) ; secrets injectés par fichiers sous contrôle de l'agent, jamais dans l'environnement du compose versionné ; mises à jour de sécurité de l'hôte et des images de base dans la ligne de version.

### C-3 — Panne de la centrale : aucun comportement ni enveloppe décidés (opérations)

- La spine ne dit rien sur la haute disponibilité, la sauvegarde ni la restauration de `centrale-service` elle-même, ni de son registre d'images, ni de l'autorité de certificats. Un hôte unique (structural seed) porte les licences émises, les empreintes de confiance et les certificats de tout le parc.
- Conséquence non traitée : si la centrale est indisponible plus de 30 jours (ou 7 au niveau `LOGICIEL`), tout le parc entre en GEL par la faute de Money Vibes. À l'inverse, si la centrale perd sa base (dernière empreinte de chaque instance), elle ne peut plus détecter un recul, et à la restauration partielle elle voit de faux reculs et refuse licences et exports à des clients honnêtes.
- Correction : AD « Continuité de la centrale » : RPO/RTO de la centrale (même niveau que NFR-7 ou supérieur), sauvegarde 3-2-1 de sa base, de la CA et du registre ; procédure « centrale restaurée » (les empreintes manquantes sont reprises à l'instance au contact suivant, avec une règle explicite qui distingue perte côté centrale et recul côté instance) ; règle de non-gel en cas de panne imputable à Money Vibes (par exemple prolongation signée d'une heure de référence « incident », ou gel suspendu tant que la plateforme publie un état « centrale dégradée ») ; haute disponibilité : décider en v1 un hôte de secours à chaud ou, à défaut, l'assumer en question ouverte avec son coût.

### C-4 — Reprise après sinistre d'une instance : le rétablissement de l'état de confiance est absent

- AD-4 et AD-16 interdisent la restauration de l'état de confiance, et la centrale refuse licences et exports à tout recul. Mais si le serveur est perdu (incendie, vol, disque mort), la nouvelle machine a un état de confiance vide : la centrale le voit comme un recul, le consentement retiré revient (le registre de consentements n'est pas dans les sauvegardes, ou l'est avec un état ancien), le journal est perdu et sa tête avec lui, le compteur NV du TPM est neuf.
- Il y a aussi une contradiction : AD-4 écrit l'état de confiance sur le second support au niveau `LOGICIEL` (donc au même endroit que les sauvegardes), alors qu'AD-16 l'exclut « de tout jeu de sauvegarde ». Si le second support est restauré avec une VM, la copie est ancienne.
- Correction : AD « Ré-ancrage après sinistre » : procédure unique, déclenchée par le DSI, validée par Money Vibes (ordre signé `REANCRAGE` portant un nouveau numéro d'époque, lié à l'identité de la nouvelle machine), qui reprend la dernière empreinte et le registre de consentements signé que la centrale détient (AD-13), marque un trou dans la chaîne du journal, journalise l'événement, et reste visible en supervision. Préciser dans AD-16 que « exclu » signifie « hors des jeux restaurables par le DSI » et distinguer la copie de l'état de confiance du second support (écrite par l'agent, avec numéro d'époque) des sauvegardes. Ajouter à la matrice de tests le scénario « serveur perdu, nouvelle machine ».

### C-5 — Les formats des artefacts signés et du protocole de contact ne sont pas fixés (point de divergence majeur)

- La centrale et l'agent seront construits par deux personnes en parallèle autour de l'état voulu, du manifeste de version, de la licence, de l'heure de référence, de la sanction, du fichier d'urgence, de la liste de révocation, du signal hebdomadaire et de `/v1/contact`. AD-7 dit « JWS Ed25519 » et « manifeste signé », mais la spine ne fixe : l'enveloppe (JWS compact ou JSON détaché ? comment est signé le manifeste, JWS aussi ou cosign ?), la sérialisation canonique, les champs obligatoires (`kid`, `iat`, `numero`, `instanceId`, `audience`), le lieu et le versionnement du schéma, la compatibilité du protocole de contact entre un agent N-1 et la centrale.
- L'« état voulu », objet central du paradigme, n'a pas de nom dans AD-17.
- Correction : ajouter `packages/contrats-moteur` au Structural Seed (schémas JSON + exemples signés + vecteurs de test partagés par l'agent et la centrale) ; ajouter à AD-17 les lignes `etat-voulu`, `manifeste-version`, `licence`, `heure-de-reference`, `sanction`, `liste-revocation`, `fichier-urgence`, `signal-hebdomadaire` avec producteur, consommateur, format et règle de version ; règle : le protocole de contact porte `versionProtocole`, la centrale sert N et N-1, et un test croisé agent x centrale en CI rejoue les vecteurs signés.

### C-6 — Certificats mTLS : autorité, amorçage et révocation non décidés (sécurité)

- AD-9 : certificat client « émis au montage » et « renouvelé par contact ». AD-2 donne à la centrale les « certificats d'instance ». Non décidés : l'autorité (CA interne ? laquelle, avec quelle clé ?), l'amorçage de confiance (jeton d'enrôlement à usage unique ?), la durée de vie, la révocation (sanction, vol de serveur, instance supprimée), ce qui se passe quand le certificat expire sur une instance coupée, la rotation de la CA, le lien entre le certificat et l'identité de la machine (clé générée dans le TPM ?).
- Le test « un refus de signature ne dit jamais quelle vérification a échoué » est bon mais ne couvre pas ces cas.
- Correction : AD « Identité de l'instance » : CA dédiée distincte de la racine de signature ; enrôlement par jeton à usage unique émis par la console et consommé au montage (FR-25) ; clé privée générée sur place (dans le TPM si présent) ; durée de vie courte (par exemple 30 jours) avec renouvellement au contact et période de grâce explicite alignée sur le gel ; révocation par liste côté centrale (la centrale refuse), jamais côté instance ; renouvellement impossible après sanction.

## Constats hauts

### H-1 — Performance : NFR-5 (< 15 min) et NFR-9 (< 15 min d'interruption) sans décision

- NFR-9 est listé dans `binds` mais aucun AD ne tient le budget : AD-11 ne dit pas comment la migration, la bascule et le contrôle de santé tiennent dans 15 minutes d'interruption pour de gros volumes, ni qui mesure. NFR-5 (pack distributeur) n'est ni dans `binds` ni dans un AD.
- Correction : décider que les migrations sont exécutées en « étendre puis contracter », hors fenêtre d'interruption (lancées pendant que l'ancienne version sert), que l'interruption se réduit à la bascule d'empreintes, mesurée et journalisée par l'agent (durée d'interruption dans l'entrée de journal) ; ajouter un test de performance NFR-9 à la matrice de tests ; pour NFR-5, soit le rattacher à une unité et à un AD (le pack = le plan d'installation de la partie A, budget par étape), soit le déclarer en question ouverte avec le propriétaire.

### H-2 — Migrations et schémas de données : mécanisme d'exécution non fixé

- AD-11 attribue « migrer » à l'agent, mais l'agent ne connaît pas le schéma Mongo de chaque service. Non fixés : l'outil et la forme d'une migration (conteneur d'initialisation par service ? script versionné dans l'image ?), l'ordre entre services, l'idempotence, le verrou (deux migrations concurrentes), la compatibilité de schéma N et N-1 pendant la fenêtre où l'ancienne et la nouvelle version lisent la même base, la migration du propre état de l'agent (voir H-3).
- Chaque équipe de service inventerait sa solution : c'est un vrai point de divergence.
- Correction : AD « Migrations » : chaque service livre dans son image un point d'entrée `migrer` idempotent, additif, annoncé dans le manifeste avec son ordre ; l'agent le lance en conteneur dédié avant la bascule et enregistre le résultat ; règle de lecture-compatibilité N/N-1 par service, vérifiée par le test « promouvoir, saisir, revenir ».

### H-3 — Le stockage et la montée de version de l'agent lui-même

- Le journal, l'état de confiance, le registre de consentements et l'horloge sont dans un « magasin » de l'agent que la spine ne nomme pas (quelle base ? « une base par unité » dit P12 mais l'agent est hors des espaces, donc n'a pas le Mongo du socle). Format, chiffrement, intégrité, migration du format entre deux versions de l'agent et retour arrière de l'agent après migration du format ne sont pas décidés.
- AD-3 dit que la nouvelle image doit être saine avant l'arrêt de l'ancienne, mais pas qui arrête l'ancienne, ni ce qui arrive si la nouvelle écrit un format d'état que l'ancienne ne lit pas.
- Correction : décider le magasin de l'agent (par exemple SQLite chiffré avec journal à écriture anticipée, sur un volume dédié), la règle « le format d'état de la version N est lisible par N-1 en lecture/écriture ou l'agent N ne migre le format qu'après la validation de N », et ajouter ce cas aux tests (agent N puis retour à N-1).

### H-4 — Agent et Kafka/espaces : dépendances circulaires et cloisonnement

- L'agent est « hors des espaces » mais lit et écrit `instance.journal`, `instance.licence.acceptee` et `instance.indicateurs` dans le Kafka de chaque espace, et pilote les projets Compose qui contiennent ce Kafka. Non décidé : réseau et identifiants de l'agent dans chaque espace (NFR-3), comportement quand Kafka est arrêté pendant une promotion (perte ou retard du journal ? garantie au moins une fois et dédoublonnage par `eventId` ?), ordre de la chaîne de hachage sur plusieurs partitions et plusieurs espaces, et rattachement réseau du `GET /heure` (comment la partie A des deux espaces joint un agent hors des deux projets sans que les espaces se voient).
- Correction : AD « Raccordement de l'agent » : un réseau Docker dédié `agent` rattaché à chaque projet, avec seuls le port `/heure` et le Kafka d'espace exposés à l'agent ; livraison du journal au moins une fois avec `eventId` et ordre par `instanceId` ; en l'absence de Kafka l'agent met en tampon localement et écrit un événement « trou » ; la chaîne a un ordre total défini par l'agent à l'écriture (pas par Kafka).

### H-5 — Mises à jour et exécution derrière un réseau d'entreprise

- Aucune décision sur le proxy sortant du client, l'inspection TLS (casse le mTLS), les listes d'autorisation de pare-feu, ni sur l'authentification de l'agent auprès du registre d'images (« AG tire REG » sans mécanisme) ni sur le comportement si le registre est indisponible (le fichier hors ligne couvre-t-il ce cas pour tout le cycle ?).
- Correction : exigence de montage (FR-25) : sortant 443 vers deux noms (centrale et registre) sans inspection ; support d'un proxy explicite configuré ; accès au registre par le même mTLS ; test « registre indisponible » dans la recette.

### H-6 — Marque `[ADOPTED]` illégitime sur AD-16, et cinq AD qui devraient l'être ou être mis en question

- Légitimes (couvert par D-1 → D-11) : AD-1 (D-1), AD-2 (D-2), AD-3 (D-3), AD-4 (D-4), AD-6 (D-10), AD-7 (D-7), AD-10 (D-5), AD-11 (D-6), AD-12 (D-9), AD-18 (D-11).
- **AD-16 est marqué `[ADOPTED]` mais ne correspond à aucune décision D-n** : le memlog ne contient aucune validation du rythme (complet quotidien, incrément horaire), de l'orchestration par l'agent, du chiffrement ni du test mensuel dans un projet jetable. Ce sont des choix dérivés de NFR-7, pas des décisions validées. Retirer la marque (ou obtenir la décision).
- AD-9 (liaison mTLS) et AD-20 (tunnel inverse) découlent de D-8, validée, mais ne portent pas la marque ; AD-9 devrait la porter pour la partie mTLS/protocole (mais pas pour « trois rythmes » ni pour le gel à 30/7 jours qui est dans D-4). À aligner.
- AD-5, AD-8, AD-13, AD-14, AD-15, AD-19 : décisions non triviales non marquées, correct tant qu'elles ne sont pas validées. À l'inverse, AD-17 est un registre plus qu'une décision ; AD-19 est surtout une conséquence de AD-1/AD-10 (voir M-4).

### H-7 — Le travail des deux développeurs n'est pas découpé en séquence vérifiable

- Quatre services neufs plus un agent et des gabarits de déploiement, en février 2027, pour deux développeurs : la spine ne fixe aucun ordre de construction ni de squelette ambulant (par exemple « un agent simulé contacte une centrale simulée et échange un état voulu signé de bout en bout » avant le reste). C'est la meilleure garantie que les deux unités ne divergent pas ; elle doit venir de la spine (altitude feature).
- Correction : ajouter un AD ou une section « Tranche de départ » : premier incrément = contrats signés (C-5) + contact + vérification + application d'une licence, avec test croisé ; les autres FR s'ajoutent derrière.

## Constats moyens

- **M-1 — AD-5 est ambigu et peu vérifiable.** « Jamais de plus de 48 heures d'écart sans correction » : l'écart entre quoi et quoi ? Que fait l'horloge scellée quand le serveur a été éteint plus de 48 h et reste sans contact (elle s'arrête, donc les échéances ne tombent jamais, ce que A-1 accepte mais que la règle doit énoncer) ? La correction « en arrière » par heure de référence contredit « n'avance que » : borner par le numéro de l'heure signée et journaliser. Reformuler en deux règles testables.
- **M-2 — AD-13 : « finalité couverte » indéfinie.** La liste des finalités et le format de la copie signée du registre ne sont pas dans les contrats d'AD-17. Deux unités (agent, apprentissage) interpréteront « finalité » différemment. Ajouter le vocabulaire fermé des finalités à `packages/contrats-moteur`. Préciser aussi la fraîcheur : que fait `apprentissage-service` d'une copie vieille de N jours ?
- **M-3 — Observabilité non décidée.** Supervision de parc oui (AD-9), mais pas : journaux techniques et métriques de la centrale et de l'agent, qui reçoit les alertes (J+7, ticket), SLO de la centrale, traces de bout en bout, format des journaux. Fixer au moins : format de journal, identifiant de corrélation `instanceId`/`correlationId` dans les journaux et le contact, et une alerte « agent muet » distincte de « centrale muette ».
- **M-4 — AD-19 et AD-15 : règles composées de plusieurs choses.** AD-19 liste trois différences mais ne dit pas comment elles sont portées dans le code (un seul code, configuration ou port ?). Un test vérifiable : « aucune branche `if plateforme` hors du port `HorlogeDeReference` et de la source de droits ».
- **M-5 — Environnements.** Seul « dev / recette / prod » du côté centrale. Non décidé : environnement de pré-production de la centrale, version d'essai d'une nouvelle version d'agent avant vague, distribution canari des vagues (la « vague » est dans l'agrégat Instance mais pas de règle de sélection, d'arrêt automatique ni de taille).
- **M-6 — Stratégie de tests incomplète.** La ligne « Tests » est un bon début. Manquent : test de compatibilité croisée agent N/N-1 × plateforme N/N-1, test de contrat (producteur/consommateur) pour AD-17, test de charge NFR-5/9 (voir H-1), test d'attaque (certificat révoqué, clé révoquée, licence rejouée, fichier hors ligne modifié), test de non-sortie de champ du signal (cité en AD-9 mais pas relié à la matrice).
- **M-7 — Chaîne d'approvisionnement.** Signature des images oui ; pas de décision sur la reproductibilité des builds, la provenance, la liste des composants (SBOM), l'analyse de vulnérabilités avant promotion. Un assureur le demandera. Décider au moins : où se construit, qui signe, et quel contrôle bloque la signature.
- **M-8 — AD-14 : le niveau 1 « envoie à `apprentissage-service` » par quel chemin ?** Le contact AD-9 ne couvre que le signal ; l'export est un second flux vers un second service (flèche du diagramme) avec son propre mTLS, son idempotence et sa reprise. Préciser qu'il utilise la même identité et le même transport que le contact, avec reprise par morceaux.
- **M-9 — Droits de l'identité de service.** AD-15 fait agir « l'identité de service du moteur ou de la Reprise (contrat C2) » ; rien ne dit comment ces identités sont émises et limitées sur site (pas de secret partagé entre espaces).
- **M-10 — Données personnelles de l'instance.** Pseudonymisation du journal d'un prospect effacé « jamais supprimé » est dit ; le chiffrement des sauvegardes oui ; mais pas la rétention du journal ni de l'état de confiance à la fin d'un contrat (effacement, réversibilité).

## Constats bas

- **B-1** — Deferred : « Outil du tunnel de support » pose peu de risque pour le découpage, mais le choix détermine l'exigence réseau du client (ports, proxy) ; l'ajouter à l'exigence de montage (voir H-5) ou nommer la contrainte (sortant 443 uniquement) dans AD-20.
- **B-2** — Deferred : « Outil de sauvegarde » : conserver, mais ajouter que la cohérence entre Mongo et MinIO (même instant) est une exigence de l'AD-16, sinon deux implémentations divergeront.
- **B-3** — AD-1 : la parenthèse « façon GitOps ; Odoo vérifie… » est de la justification dans le paradigme ; à retirer de la section paradigme et laisser dans le memlog.
- **B-4** — AD-4 mélange trois niveaux (`TPM`, `LOGICIEL`, `PLATEFORME`) et un chiffre de gel : séparer le gel (AD-9/AD-4) dans une règle d'une ligne pour qu'on puisse la tester.
- **B-5** — Stack : `tpm2-tools` depuis un conteneur exige le passage du périphérique TPM et des droits ; à noter dans AD-10 (lié à C-2).
- **B-6** — Conventions : « un refus de signature ne dit jamais quelle vérification a échoué à l'extérieur » : préciser le contenu du message externe pour que les deux unités renvoient la même chose.
- **B-7** — Le diagramme 1 montre « docker compose : promouvoir, revenir » de l'agent vers les services, ce qui suggère un appel direct ; la flèche réelle est l'agent vers le moteur Docker. Corriger l'étiquette et ajouter le registre au diagramme.

## Réponses à la grille

1. Points de divergence : bien couverts pour la propriété des données et les noms de contrats ; manquent les formats signés (C-5), le magasin de l'agent (H-3), le mécanisme de migration (H-2), l'identité mTLS (C-6).
2. Rules vérifiables : AD-2, AD-6, AD-10, AD-12, AD-16, AD-20 le sont ; AD-5, AD-13, AD-19 insuffisamment (M-1, M-2, M-4) ; AD-17 n'a pas de test qui l'impose (« tout nouveau contrat s'ajoute ici »).
3. Deferred : n'ouvre pas de divergence critique, sauf que le choix de l'outil de tunnel et de sauvegarde porte des exigences réseau et de cohérence (B-1, B-2).
4. Dimensions : sécurité (C-1, C-2, C-6), enveloppe opérationnelle (C-3, M-3, M-5), performance (H-1), données (H-2, H-3), tests (M-6), montée de version de l'agent (H-3), reprise après sinistre d'une instance (C-4) ne sont ni décidées, ni différées, ni en question : la spine ne les nomme pas.
5. Rationale et diagrammes : AD concis, une seule parenthèse de justification (B-3) ; mermaid valide.
6. Marques : AD-16 non légitime ; AD-9 et AD-20 à aligner sur D-8 (H-6).

## Compte

5 critiques en tête (C-1 à C-6, soit 6), 7 hauts, 10 moyens, 7 bas.
