# Addendum W1 : choix techniques écartés du PRD (parties 1 et 4)

Le PRD décrit des capacités. Ce qui suit est utile à la spine et aux épics ; rien n'engage l'architecture.

## Journal et trace (FR-13, FR-12)
- Chaînage du journal : chaque entrée scelle la précédente par une empreinte (hachage) ; l'empreinte du jour est déposée hors serveur (service de dépôt de Money Vibes, ou support de la compagnie). Le journal des changements et celui des consultations ont des **flux distincts** (volume des consultations bien plus élevé) mais le même chaînage ; le registre de l'IA est un troisième flux de même nature.
- Les consultations de données de santé sont marquées par une classe de sensibilité portée par la pièce (étiquette posée à l'indexation), pas déduite à la lecture.
- Horodatage : horloge du serveur seule ; la démo a une horloge figée au 12/09/2026, à ne pas reprendre. Numérotation par séquences atomiques côté serveur (références `DEC-`, `ARC-`, quittances), sans trou ni doublon ; une séquence par année et par volet pour `ARC-`.

## Partage avec le logiciel de la compagnie (FR-2, FR-3)
- Contrat d'échange en API **ou** en fichier (Excel, JSON), dans les deux sens (annexe C) ; adaptateur d'échange par domaine, un seul point d'écriture par domaine, valeurs de contrôle déclarées au manifeste. Rejeu idempotent par clé d'échange (référence `DEC-` + version).
- Le paramètre « qui attribue le numéro » est lu par le service qui crée la déclaration ; le basculement ne change que la source du numéro, pas le modèle du dossier.
- Projection des contrats : copie datée en lecture seule, rafraîchie par période (API) ou par dépôt de fichier ; aucun droit d'écriture du compte technique côté LC.

## Rôles, accès, séparation des tâches (FR-6, FR-7, FR-25)
- Table d'accès unique (rôles × écrans, rôles × droits) appliquée par le serveur ; la table `DROITS` de la démo est le point de départ, corrigée (ADMIN ne lit plus le métier, ACC ne voit pas le contenu médical, le comptable n'a aucun droit de décision).
- Les contrôles SEP sont des **gardes de transition** côté serveur, doublés d'un plan de contrôle périodique (les gardes peuvent être contournées par une écriture directe en base : le plan de contrôle les détecte). **Écart avec la démo** : dans la démo, `SEP-02` est « contrôle comptable avant décaissement » ; dans ce PRD, `SEP-02` est « celui qui décide ne paie pas » (plan D8) ; le contrôle comptable de la démo est couvert par le rapprochement et la validation d'un ordre par une autre personne.
- Authentification par l'`auth-service` de la plateforme ; double authentification par code temporaire ; comptes de cabinets externes dans un domaine d'identité séparé.
- Chiffrement des champs sensibles au niveau applicatif (identité, téléphone, santé), clés tenues dans un coffre de la compagnie ; à cadrer avec la spine (le modèle de la microfinance ouvre le coffre à deux personnes de rôles métier ; ici non tranché).

## IA (FR-10 à FR-12, §7.4)
- Une seule instance locale de l'IA commune, exposée par une interface interne ; le service métier appelle l'IA de façon asynchrone et n'attend jamais : un délai ou une panne rend un « emplacement vide », jamais une erreur (jamais bloquante).
- OCR : moteur local (Tesseract est le candidat de la démo du document-service) pour les scans ; la lecture de la couche texte reste le chemin rapide des PDF nés numériques. Moteur de classement et d'extraction : règles explicables au premier jour, modèle ensuite ; le choix du modèle de langage local (taille, matériel) dépend du devis des serveurs et n'est pas fixé ici.
- Le compte de service de l'IA n'a que des droits de lecture et d'écriture de propositions ; le **refus d'estimation en corporel** est une règle du service (aucun point d'entrée « montant » sur un dossier à volet corporel), pas seulement de l'écran.
- Les niveaux du registre (`EXTRACTION`, `ANALYSE`, `RECOMMANDATION`) et les statuts (`PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`) sont repris de la démo (`actionsIA`), niveau `DECISION` supprimé.
- Anonymisation des écarts : généralisation et suppression des identifiants, contrôle d'un lot par un filtre de sortie unique, à tester par un lot piégé contenant des identifiants connus.
- Écarts issus de données de santé : exclus à la source (les pièces et champs étiquetés « santé » ne sont jamais des entrées d'un calcul d'écart sortant).
- Tunnel sortant : connexion initiée par l'instance, chiffrée de bout en bout, authentification mutuelle ; aucun port entrant ; distinct du tunnel de support.

## Délais (FR-14)
- Référentiel versionné (date d'effet, source, validateur, statut) ; résolution `référentielÀLaDate(survenance)` ; les délais légaux sont des données du référentiel, pas des paramètres de tenant. Calcul de calendrier : jours ouvrés (calendrier de la compagnie, jours fériés togolais en paramètre) pour les délais internes ; mois civils pour les délais légaux.
- Suspensions et prorogations : événements portant un article, un motif et deux dates ; l'échéance affichée est un calcul sur l'historique des événements, jamais un champ écrasé.
- Pénalité de 5 % par mois : calculée par un composant de référence versionné ; sa base (indemnité totale, solde, montant offert) est une option, à fixer après l'avis du juriste.

## Paiement (FR-220 à FR-225)
- États du règlement (`A_PAYER`, `EN_COURS`, `PARTIEL`, `PAYE`, `ECHEC`, plus `INCONNU` pour l'issue incertaine) et de la quittance (`PRETE`, `EDITEE`, `SIGNEE`, `REMISE`, `ENCAISSEE`) ; clé d'idempotence par ordre, jamais régénérée.
- Le chèque est enregistré dans `paiement` comme un moyen « manuel » (banque, numéro, montant, remise) ; l'impression de la lettre-chèque est un gabarit paramétrable par banque, optionnel.
- Adaptateur Mobile Money sortant (T-Money, Flooz) : à chiffrer au plan comme pour l'IMF ; routage par opérateur à ajouter dans `paiement`, qui ne pilote aujourd'hui que par pays, devise et méthode.
- Acceptation électronique de la quittance par code à usage unique : n'existe qu'après validation juridique ; en attendant, la quittance est signée au guichet.
- Rapprochement : correspondance par numéro de chèque / référence de virement / identifiant d'opérateur, avec une file d'écarts datée ; export de l'état mensuel au format de la comptabilité (format fixé par l'annexe C).

## Installation, relais, support (§7.5 et §7.6)
- Moteur d'installation : agent qui tire, une instance par serveur, espace d'essai et espace réel, fichier de mise à jour signé ; installation sur un serveur applicatif et un NAS séparés, volumes de données et sauvegardes sur le NAS ; configuration minimale issue du test au volume de FR-23.
- Relais Money Vibes : file à écriture durable, accusé après écriture, tirage par l'instance, purge au bout de 7 jours (défaut) ; le relais ne sert que les flux entrants d'internet (réponses WhatsApp, notifications de paiement) ; aucun lien de paiement n'est servi pour l'assurance.
- Supervision locale sans internet (état des services, des sauvegardes, de l'échange avec le LC, du tunnel de l'IA, de la licence) ; événements d'installation envoyés comme alertes à ADMIN.
- Support : tickets avec compteur d'heures ouvrées (calendrier de la compagnie) ; classes bloquante, majeure, mineure ; la définition de « bloquante » est remise à l'installation.

## Démo (FR-15 à FR-17)
- Jeu généré de façon déterministe à partir d'une graine, avec les cinq montants recalculables ; les vérifications du rejeu 2 de la démo actuelle (104) deviennent des tests de recette sur le serveur, jouables par un robot de navigateur ; les parcours `SIN-2026-9001` à `9004` sont des jeux rejouables, remis à zéro par une opération serveur dans l'espace d'essai.
- Logiciel de compagnie fictif : service séparé qui parle le contrat d'échange ; il peut être coupé et rebranché pour tester la liste « à saisir ».

## Points relevés pendant l'écriture, hors périmètre de W1
- Les durées de conservation de 5 ans de la démo (matériel, risques divers, sans suite) sont **inférieures** aux 10 ans du Code CIMA art. 404 (« toutes pièces justificatives ») : par défaut, 10 ans partout ; à trancher avec le juriste (point de départ et nature des dossiers).
- Le « Règlement CIMA n° 002-26 » cité par le code de la démo n'est pas vérifié : non cité.
- Le seuil de délégation de 2 000 000 FCFA de la démo et de l'offre initiale n'est pas repris (le défaut est 1 000 000 FCFA, plan D8) ; l'écart est à confirmer avec les délégations réelles.
- La franchise est déduite du montant arrêté (plan D15) ; l'exemple chiffré de `SIN-2026-9002` dans les parcours (UJ-3) donne 395 500 FCFA (445 500 moins une franchise de 50 000, minimum de la police) à titre d'illustration : la valeur exacte est fixée par le jeu de démonstration.
