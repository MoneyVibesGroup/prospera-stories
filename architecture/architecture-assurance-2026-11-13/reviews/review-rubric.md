# Revue de la spine Assurance contre la grille (good-spine checklist)

Relue le 2026-11-13 : ARCHITECTURE-SPINE.md (21 AD), .memlog.md, PRD assurance (parties 1 à 4, annexes A, C), spine du moteur, spine microfinance (modèle), code mesuré de prospera-assurance-service et document-service.

**Verdict : solide sur le paradigme, la machine à états, les règlements, les numéros, la santé et le LC fictif, mais pas encore prête pour les épics : deux points de divergence de premier jour ne sont pas tranchés (collision du code `assurance` avec l'existant, recherche unique contre champs chiffrés), l'enveloppe opérationnelle tient en une phrase de renvoi au moteur, et le catalogue de faits qui se dit « complet » ne l'est pas.**

Décompte : CRITIQUE 2 · HAUTE 9 · MOYENNE 11 · BASSE 3.

## CRITIQUE

**K1. Le code de module `assurance` entre en collision avec l'existant, et la coexistence n'est pas décidée (AD-3, AD-21, Stack).**
Le service existant porte déjà un entitlement `assurance`, le gate `ASSURANCE_NOT_ENTITLED`, les read-models `org_assurance_entitlement` et `org_kyc_status`, et sept `APP_GUARD` globaux (Jwt, EmailVerified, Roles, DossierScope, `AssuranceAccessGuard` qui exige KYC approuvé et habilitation au référentiel `cima-assurances`, ReferentielDuDossier). AD-3 dit « gate `<CODE>_NOT_ENTITLED` » et « modules existants non touchés » : le nouveau module `assurance` produit donc le même code de refus que le module comptable, sous le même nom d'entitlement du catalogue. Rien ne dit quels guards globaux s'appliquent à `src/modules/assurance/`, ni comment le KYC (concept de la plateforme) se lit sur une instance sur site. Le service existant parle aussi kafkajs 2.2.4 : le client du nouveau module est indéterminé (AD-27 du moteur dit « les nouveaux services naissent sur Confluent », ici c'est un module dans un vieux service).
Correction : ajouter à AD-3 une règle : (a) le code d'entitlement du module M30/M31 est distinct de celui du module comptable (renommer l'un des deux, arbitrage du PO à inscrire) ; (b) le nouveau module porte son propre gate et n'hérite que de Jwt, Roles et Throttler, les guards KYC, référentiel et dossier étant posés par route et jamais globaux pour lui (test de lint sur le décorateur) ; (c) un seul client Kafka par processus : soit le module neuf utilise l'adaptateur existant jusqu'à la migration 1.0, soit la migration du service précède l'ajout du module (trancher et fermer Q-5). Mettre la collision dans AD-21.

**K2. La recherche unique (FR-150 à FR-152, FR-250 : 5 s au 95e centile sur 50 000 dossiers) n'a ni propriétaire ni index, et elle se heurte au chiffrement des téléphones et pièces d'identité (FR-253) (AD-2, AD-8, Capability Map).**
Trois services possèdent les données à chercher (dossiers, pièces et texte lu, projections de contrats) ; la coque interdit tout métier dans Next ; AD-2 interdit de lire la base d'un voisin. Les critères incluent nom, téléphone, police, immatriculation, numéro d'archivage, tolérance aux fautes et langage naturel. Or FR-253 chiffre téléphones et pièces d'identité, et AD-8 ne traite que le champ santé. La spine microfinance a déjà résolu l'équivalent (AD-18 : bibliothèque `prospera-plateforme/champs-sensibles`, enveloppe, index aveugle HMAC) ; l'assurance ne l'hérite pas.
Correction : nouvel AD « Recherche et champs sensibles » : (1) `sinistres` est seul propriétaire de l'index de recherche (collection `sinistres_recherche`, alimentée par des faits qui ne portent que des clés et des jetons de recherche) ; (2) hériter `champs-sensibles` et l'index aveugle pour téléphone et pièce d'identité, avec la liste des champs chiffrés de l'assurance ; (3) la tolérance aux fautes ne s'applique qu'aux champs non chiffrés (nom en clair ou jeton phonétique, à nommer) ; (4) la recherche dans le texte OCR est un index de `ged`, filtré par capacité santé ; (5) le test de volume de FR-23 est la recette de cet AD.

## HAUTE

**H1. Sauvegardes : le texte affaiblit le moteur et laisse trois choses ouvertes (AD-9 dernier point, AD-20, Déploiement).**
AD-9 écrit « sauvegardes quotidiennes du NAS … ceux du moteur (AD-16) » alors que le moteur AD-16 fixe copie quotidienne plus incrément horaire (perte 1 h, reprise 4 h), Mongo et MinIO au même instant. Le PRD (FR-236, H-192) dit RPO 24 h, RTO 8 h ouvrées : écart non arbitré. Le NAS est à la fois le volume vivant de MinIO (AD-9) et la cible de sauvegarde (FR-236 : NAS plus second support) : un seul exemplaire physique si le NAS tombe, ce qui casse le 3-2-1.
Correction : AD-9 reprend le moteur AD-16 (RPO 1 h, RTO 4 h) et déclare H-192 écarté (ou amende le moteur) ; dire que le MinIO de `ged` est dans le jeu « même instant » que Mongo ; poser que la sauvegarde du NAS est une copie distincte du volume vivant ; ajouter la clé de chiffrement des pièces (AD-8) à la clé de secours remise au client (perte de clé = perte des pièces).

**H2. Enveloppe opérationnelle : une phrase de renvoi, pas de décision (« Déploiement », AD-19, AD-12).**
Manquent, sans être dans Deferred ni dans les questions :
(a) Supervision (FR-238, FR-261) : route `sante` (C13) de chaque service, critères `DEGRADE` de `liaison-assureur` (fraîcheur périmée, file d'envoi bloquée plus de 24 h, écarts ouverts), alerte à ADMIN sans donnée métier, indicateur remonté à `instance.indicateurs` pour les consommateurs de l'OCR.
(b) `destinationsSortantes` (moteur AD-9) : l'API du LC, la boîte courriel entrante (FR-35), l'antivirus, le relais ne sont pas déclarés ; une sortie non déclarée est refusée. L'essai ne doit recevoir aucun secret ni destination du réel (moteur AD-10) : le LC réel n'existe pas dans l'essai, le LC fictif pas dans le réel.
(c) Essai et réel : deux projets Compose donc deux Mongo, deux MinIO, deux files OCR sur le même serveur ; dimensionnement et plafond de concurrence de l'OCR (50 pages en moins de 10 min, 1,5 million de pages) pour ne pas affamer le circuit ; volume du NAS par espace.
(d) Environnement de préparation Money Vibes (FR-234) : comment le paramétrage préparé arrive chez la compagnie (export signé des versions de paramètres ou ressaisie) ; propriétaire de l'échantillon anonymisé.
(e) Mises à jour : tables légales sur instance figée ou gelée (microfinance AD-28 prévoit un fichier et un bandeau de retard ; AD-12 assurance non) ; évolution de la version du contrat de l'annexe C (accepter N et N-1, sinon un LC en retard voit tous ses lots refusés).
Correction : un AD « Enveloppe opérationnelle de l'assurance » avec ces cinq sous-règles, ou chaque point en Deferred ou en question avec propriétaire et date.

**H3. `sinistres` dépend durement de `reseau`, contre le PRD (AD-3, diagramme).**
PRD A.1 C1 : `depends: [ged]` seul ; C4 : « `reseau` absent : un seul site, volet et pôle recours lus des affectations de `sinistres` » ; C10 : démarre avec socle + `ged` ; FR-20 : le circuit marche sans les modules facultatifs. La spine ajoute `S -->|depends| W` et « sans `reseau` est refusé à l'installation », sans trace au memlog ni dans AD-21. Cercle de faits en plus : `sinistres` tient le volet comme portée et `reseau` le lit.
Correction : retirer la dépendance dure (emplacement `reseau` vide, portée lue des affectations propres de `sinistres`) ; si le PO la veut, l'inscrire dans AD-21 comme amendement de A.1 C1, C4, C10 et FR-20.

**H4. Le catalogue d'AD-16 se dit « complet » et ne l'est pas.**
(a) PRD A.1 publiait `sinistres.reglement.changed@1` pour `liaison-assureur` et l'export ; la spine le retire et `liaison-assureur` ne consomme pas `paiement.reglement.changed@1` : rien n'alimente C-15 (règlement envoyé au LC avec référence de chèque ou de transaction, numéro de quittance, états payé, échec, annulé). (b) Aucun fait de quittance alors qu'AD-2 la fait écrire par `sinistres`. (c) Aucun fait d'export pour `paiement` (AD-11, C-19). (d) Rien pour C-4 produit. (e) Consommations avec jokers (`reseau.*`, `sinistres.dossier.*`) et faits de `notification` (`envoi.delivre`, `reponse.recue`) absents du tableau, contre la règle « un nom absent ne se consomme pas ».
Correction : ajouter `sinistres.quittance.changed@1`, `paiement.export-comptable.produit@1`, `liaison-assureur.produit.recu@1` ; faire consommer à `liaison-assureur` `paiement.reglement.changed@1`, `sinistres.reglement.ordonne@1`, `sinistres.quittance.changed@1` pour C-15 ; nommer chaque fait de `reseau` et `notification` consommé ; écrire la table nom PRD vers nom spine dans la spine.

**H5. Des données personnelles dans le bus, et des documents du LC sans chemin (AD-1, AD-2, AD-16, AD-8).**
`liaison-assureur.assure.recu@1` transporte (C-1) pièce d'identité, téléphone, date de naissance dans un topic Kafka (journal non chiffré, rétention du broker) : AD-8 n'interdit que le médical et FR-253 chiffre ces champs. `liaison-assureur.document.recu@1` (C-10, fichier ou lien) : `ged` est seul écrivain des pièces et `liaison-assureur` ne peut pas écrire dans son bucket ; le mécanisme n'est pas dit.
Correction : règle « un fait porte des clés et des empreintes ; les champs sensibles ne voyagent que par route de lecture ou enveloppe `champs-sensibles` » avec refus de schéma Karapace comme pour la santé. Pour C-10 : `liaison-assureur` remet les fichiers à une route d'import de `ged` (clé d'origine, comme le point d'import de la Reprise), jamais dans son bucket.

**H6. MinIO : pile héritée, mais technologie non maintenue (AD-9, Stack, Q-3).**
Vérifié sur le web le 2026-11-13 : l'édition communautaire de MinIO n'a plus d'images ni de binaires officiels depuis octobre 2025, est en maintenance depuis décembre 2025, et des sources la donnent archivée en 2026 (date non confirmée). Les pièces de `ged` se conservent 10 à 30 ans, définitivement pour le corporel. La spine pose un port S3 (bon) mais ne dit pas quel serveur S3 tourne en face ni qui le reconstruit et le corrige.
Correction : dire que le port S3 est le contrat, nommer le serveur retenu ou ouvrir une question avec la spine du moteur (AD-10 met MinIO dans le socle de chaque espace), exiger un test de contrat S3 en CI.

**H7. Capacités du PRD sans AD ni ligne de la Capability Map : échéances, pilotage, canaux entrants, réseau, installation.**
Absents de la carte : FR-140 à FR-145 (moteur d'échéances, relances, dossiers muets : quel ordonnanceur, quelle clé d'idempotence rejouable après restauration ; le moteur AD-6 clé les tâches par `epoque`), FR-146 à FR-149, FR-206 à FR-213 (tableau de bord, contrôle interne FR-210, prêt CRCA FR-211, « tout indicateur se recalcule » FR-212 : qui écrit, comment `dashboard` lit), FR-35 (déclaration reçue par WhatsApp ou courriel : le relais fournit `notification.reponse.recue` ; boîte courriel entrante non décidée), FR-244, FR-234 à FR-246, FR-250 à FR-264 (seul FR-250 est lié, en AD-9).
Correction : ajouter les lignes à la carte et un AD « Échéances, pilotage et canaux » : l'échéancier est un composant de `sinistres` sur BullMQ `upsertJobScheduler`, clé `(dossierId, échéance, epoque)` ; `dashboard` lit par faits d'état absolu et routes de lecture seulement ; WhatsApp passe par `notification.reponse.recue` vers une commande de brouillon de déclaration ; courriel entrant différé ou décidé.

**H8. L'état de règlement « un seul jeu » est incomplet (Conventions, AD-4, AD-5).**
La convention fixe six états (`A_PAYER` à `ECHEC`) ; C-15, AD-4 (« règlements non annulés ») et `sinistres.reglement.annule@1` supposent un état annulé. Deux unités le nommeront différemment.
Correction : ajouter `ANNULE` au jeu, dire qui le pose (`paiement`, sur `sinistres.reglement.annule@1`) et vérifier la table de vérité de FR-92.

**H9. L'« emplacement partagé » du transport par fichiers n'est pas défini (AD-13, AD-19).**
Où est le dépôt (SMB, SFTP, répertoire monté), qui le monte dans quel conteneur, droits, nommage des lots, verrouillage de lecture, et comment le LC fictif (application à part sans accès aux bases) y dépose et relève dans l'essai. C'est le premier point où le dev de `liaison-assureur` et celui du LC fictif divergent.
Correction : AD-13 fixe un contrat de dépôt (volume monté, entrée lecture seule et sortie écriture seule, nom `<objet>_<lotId>_<version>`, fichier visible après renommage atomique) ou l'envoie en question ouverte avec date.

## MOYENNE

**M1. AD-20 ne couvre que les compteurs et les règlements.** Après restauration, des déclarations et provisions déjà acceptées par le LC manquent chez Prospera (la nuit les ramène comme « sinistres existants » sans dossier : doublon ou écart). Les numéros `ARC-` n'ont pas d'autre source que la base : le « maximum avec le LC, `paiement` et le relais » ne les concerne pas. Correction : un `DEC-` du LC inconnu de Prospera après restauration devient un dossier « à reconstituer » suivi depuis la source ; source des `ARC-` = étiquettes du fonds et objets MinIO.

**M2. Chaînage de la piste d'audit sans portée (AD-17, AD-4).** Une chaîne par module écrite dans la transaction de la commande est un point de sérialisation à 60 utilisateurs. Correction : chaîne par dossier (ou partition fixe) plus tête agrégée remise à l'agent.

**M3. Garde « police à relire » : qui l'évalue ? (AD-1, AD-5).** « Émission d'un règlement refusée sans revérification » : `paiement` ne connaît pas les polices. La marque « libéré » liste `DELAI_DENONCIATION_ECOULE` « dont » d'autres gardes non énumérées. Correction : énumérer les gardes de `libere`, dont `POLICE_A_RELIRE` évaluée par `sinistres`, avec code FR-136.

**M4. Écart avec PRD A.1 C4 et points « À CONFIRMER par la spine » non clos.** AD-1 dit « à relire » quand `assurance` est absent ; le PRD dit `NON_INSTALLE` avec décision motivée (`GARANTIE_ACQUISE`…). « La provision est-elle une dépendance dure de `sinistres` ? » (FR-188) reste implicite. Correction : une ligne explicite dans AD-3 pour chaque À CONFIRMER de A.1 à A.5.

**M5. IA : variables interdites du score de fraude (AD-10).** La spine microfinance interdit genre, nationalité, situation matrimoniale, religion dans les scores ; FR-127 pèse des signaux de fraude. Ajouter la liste fermée de variables autorisées et son test.

**M6. Antivirus, rendu PDF : dans la table Stack, pas en Deferred (AD-9, FR-263).** « Interface à fixer » laisse deux dev choisir ; comportement antivirus indisponible non dit. Correction : `AntivirusPort`, dépôt « à scanner » si l'outil est coupé, jamais « sain » par défaut ; idem moteur PDF (courriers, quittances, offres sont produits par plusieurs modules).

**M7. États des questions incohérents avec le memlog.** Le memlog tranche Q-1, Q-3 et Q-5 (Node 24 et client Confluent pour `document-service`) ; la spine les garde ouvertes alors qu'AD-9, AD-3 et Deferred supposent déjà ces réponses. Aligner, et porter la décision Node 24 dans AD-9 (pdfjs-dist 6.x exige Node 22.13 ou 24).

**M8. Contrat d'appel de `notification` non fixé.** Le service expose `POST /api/v1/service/envois` avec clé par appelant ; la spine n'a qu'une flèche « messages ». Dire : route synchrone, clé d'idempotence `(dossierId, événement)`, repli « cloche interne » si le service est coupé, texte sans santé.

**M9. Citations héritées inexactes (Inherited Invariants).** (a) « AD-31 … correctif réglementaire » : absent de la spine du moteur (la microfinance AD-25 le liste comme amendement à porter) ; l'inscrire dans AD-21 ou retirer. (b) Ligne `paiement` : numéros 1, 2, 3, 4, 8, 11 pour cinq intitulés ; AD-2 de `paiement` est la créance projetée, l'idempotence est AD-4, le ledger AD-3, les montants AD-8, la séparation AD-11. (c) Citer le texte de l'amendement du relais.

**M10. `DEC-` : année et allocation (AD-6, Q-7).** « Année de la déclaration » est ambiguë en saisie différée autour du 31 décembre (double date). Le compteur doit être incrémenté dans la transaction qui insère la déclaration pour que « sans trou » ne dépende pas de l'appelant. Fixer les deux.

**M11. Garde « aucun montant corporel » à deux endroits (AD-10).** Le port refuse et le consommateur refuse : deux implémentations d'une même liste blanche par volet. Dire que la liste est une donnée versionnée unique lue par les deux.

## BASSE

**B1. Stack.** « Tesseract 5.5.4 » est le moteur C++ ; ce qui s'exécute est le WASM de `tesseract.js-core` : épingler `tesseract.js` et `tesseract.js-core` ensemble plus les `traineddata` français hors ligne (`src/ocr/assets/tessdata` existe). BullMQ de `document-service` est en 5.81 contre 6.7 au socle. La pile héritée (Mongoose 8, NestJS 11) est derrière les dernières (9.12 et 12.5 sur npm le 2026-11-13) : décision du moteur, à noter. Vérifiées exactes sur npm : tesseract.js 7.0.0, pdfjs-dist 6.5.438, @napi-rs/canvas 1.1.1, minio 8.0.7, BullMQ 6.7.6, client Confluent 1.11.0.
**B2. Noms.** Le paquet existant s'appelle `assurance-service` (client Kafka et groupes `assurance-*`) ; les groupes de consommateurs du module neuf doivent porter un préfixe distinct.
**B3. Seed.** Préciser le sous-chemin des schémas de faits d'AD-16 dans `prospera-plateforme/contrats/assurance/` et celui de `champs-sensibles` si K2 est retenu.

## Ce qui est bon (à ne pas défaire)
Ratification honnête de l'existant (modules comptables intacts, collections préfixées, service neuf pour le circuit), un propriétaire par objet avec tableau, règlements et numéros à règles vérifiables, santé hors bus, garde « aucun montant corporel », LC fictif interdit en réel, versions des bibliothèques d'OCR vérifiées, rastérisation sous 60 caractères de couche texte (Tesseract ne lit pas un PDF).
