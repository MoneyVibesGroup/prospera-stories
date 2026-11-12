# Disposition des constats de la porte de relecture (2026-11-11)

Chaque constat de chaque revue a une ligne. Numérotation de la revue, préfixée : V- versions (lignes du tableau, puis écarts de méthode 21 à 23), A- adversaire, R- rubric, P- reconcile PRD (lignes non « couverte » seulement), M- reconcile amont. Décisions du PO D-1 → D-33 : aucune n'est rouverte ; un constat qui les rouvrirait est rejeté.

## Versions

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| V-1 | @tus/server 2.4.x conforme | appliqué | Stack | Aucune correction. |
| V-2 | @tus/s3-store tire le SDK AWS v3 ; test réel contre MinIO | appliqué | Stack, AD-15 | Client S3 unique `@aws-sdk/client-s3` 3.x ; pas de client `minio` dans `reprise-service` ; test réel à la première story de téléversement. |
| V-3 | `partSize` du magasin à régler (≥ 5 MiB) | appliqué | AD-15 | `partSize` = 10 Mio. |
| V-4 | tus-js-client 4.3.x conforme | appliqué | Stack | Aucune correction. |
| V-5 | tus derrière Traefik : limite de corps, en-têtes, `Location` | appliqué | AD-15 | Limite relevée sur la route seule (12 Mio), en-têtes transmis et exposés en CORS, `respectForwardedHeaders` ; test réel. |
| V-6 | exceljs sans release stable, flux non éprouvé | appliqué | Stack, AD-18 | Maintenance quasi arrêtée dite ; `WorkbookReader` mesuré contre NFR-4 à la première story ; plan B SheetJS Community Edition (tarball officiel) dans le processus isolé. |
| V-7 | csv-parse 7.0.x conforme | appliqué | Stack | Aucune correction. |
| V-8 | stream-json 3.9.x conforme | appliqué | Stack | Aucune correction. |
| V-9 | draft JSON Schema non tranché (ajv 8) | appliqué | AD-2, Stack, AD-22 | draft-07 ; amendement d'AD-26 du moteur porté en AD-22. |
| V-10 | ajv-formats 3.0.x conforme | appliqué | Stack | Aucune correction. |
| V-11 | Karapace 6.2 : mots-clés non pris en charge, `$ref` | appliqué | AD-2, AD-22 | Mots-clés postérieurs à draft-07 et `$ref` entre fichiers interdits ; schémas d'objets dans le dépôt, schémas de topics enregistrés à « migrer » (test d'enregistrement en recette). |
| V-12 | libphonenumber-js 1.13.x conforme | appliqué | Stack | Aucune correction. |
| V-13 | pdfkit : 0.20 existe | appliqué | Stack | Ligne « 0.19.x aligné sur bilan-service et balance-service ; 0.20 disponible, montée décidée avec eux ». |
| V-14 | BullMQ 6.7 : aucun service existant n'est en 6 | appliqué autrement | Stack | Reste héritée de la spine du moteur (hors périmètre de cette spine) ; la ligne le dit. Le relevé des ruptures 5 → 6 relève du moteur. |
| V-15 | @nestjs/bullmq 11.x ou 12.x | appliqué autrement | Stack | Reste héritée de la spine du moteur, comme V-14. |
| V-16 | second client S3 à justifier | appliqué | Stack | Un seul client S3 (`@aws-sdk/client-s3`), voir V-2. |
| V-17 | kafka-javascript 1.11.x conforme | appliqué | Stack | Aucune correction. |
| V-18 | schemaregistry 1.11.x ; coexistence avec ajv 8.20 | appliqué | Stack | Noté par la ligne ajv (draft-07). |
| V-19 | NestJS 11.x conforme | appliqué | Stack | Aucune correction. |
| V-20 | Node 24, Mongoose 8, MongoDB 8, Redis 7, MinIO hérités non revérifiés | appliqué autrement | Inherited Invariants | Renvoi à la spine du moteur ; hors périmètre. |
| V-21 | Écart de méthode : versions reprises de mémoire | appliqué autrement | Stack | Les versions de la relecture sont vérifiées au registre ; pas d'action de spine. |
| V-22 | Écart de méthode : draft et prise en charge Karapace non écrits | appliqué | AD-2 | Voir V-9, V-11. |
| V-23 | Écart de méthode : en-têtes tus, CORS, tampon du corps non écrits | appliqué | AD-15 | Voir V-5. |

## Adversaire

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| A-1 | Deux écrivains d'un même objet (Reprise, Connecteurs) | rejeté | AD-28, AD-20 | Rejeté : `versionSource` et dernier-écrivain-gagne, remplacés par un seul écrivain par domaine (D-30), 409 `DOMAINE_CEDE`. |
| A-2 | Même objet dans deux lots ou versions ; objet absent de la version suivante | appliqué autrement | AD-25, AD-4, AD-24 | Version livrée gelée (nouveau lot de même sorte), `APPLIQUER` d'une version plus ancienne ignoré (`INCHANGE`/`VERSION_ANTERIEURE`), objet « en trop » = écart qui bloque `VERT` (D-25) ; pas d'`ordreLivraison`. |
| A-3 | SIMULER contre APPLIQUER : références intra-type entre morceaux | appliqué | AD-4, AD-1, AD-2 | Tri topologique par objet, cycle intra-type `CYCLE_REFERENCES`, `REFERENCE_INCONNUE` en `APPLIQUER`, simulation découpée comme la livraison, lot de 600 objets chaînés à la conformité. |
| A-4 | Verdict de simulation périmé (`jetonEtatCible`) | rejeté | AD-4, AD-5, AD-30 | Rejeté : `jetonEtatCible` et re-simulation, remplacés par le contrôle du verdict validé (A-11), `ECART_DE_LIVRAISON` et nouvelle validation. |
| A-5 | Forme canonique des empreintes | appliqué | AD-32 | Champs inclus et exclus, clé de tri, entiers sûrs ≤ 2^53, JCS, vecteurs d'or ; les montants restent des entiers d'unité mineure (pas des chaînes décimales). |
| A-6 | `numero` du feu vert : qui l'attribue | appliqué | AD-12 | Compteur dans la même transaction Mongo, outbox ordonnée, ordre (`epoque`, `numero`), relecture par la vérification C13 sur trou et avant mise en service. |
| A-7 | Absence de fait contre `ATTENDU` | appliqué | AD-12, AD-7 | Liste des modules attendus portée par le dossier ; absence de fait = `ATTENDU`. |
| A-8 | Gel `FEU_VERT_DONNE` sans sortie | appliqué autrement | AD-25 | Réouverture D-24 par un détenteur de `reprise:lot:valider` (pas de droit dédié) ; pas de fait `mise-en-service.annulee` : relève du moteur. |
| A-9 | Mêmes noms de topics en essai et en réel | appliqué autrement | AD-12, AD-19 | `espace` dans la charge et `epoque` dans l'`eventId` ; un feu vert d'essai échoue à la conformité ; le nom du topic reste celui de D-6 (un topic par espace côté moteur, AD-24). |
| A-10 | Jeton de service sans lien avec l'organisation | appliqué | AD-27 | D-29 : claim `organisationId`, 403 `ORGANISATION_HORS_JETON`, appel croisé joué à la conformité. |
| A-11 | `acteur` sans preuve de validation | appliqué autrement | AD-4, AD-8 | `validationId`, `empreinteLivrable` et verdict validé par objet ; `VALIDATION_ABSENTE` ; `VERDICT_DIFFERENT` sans écriture. HMAC par morceau rejeté : jeton limité à l'organisation et `validationId` suffisent. |
| A-12 | Alias et fusion : collisions | appliqué autrement | AD-9, Deferred | Alias = clé complète, `ALIAS_DEJA_UTILISE`, `FUSION_APRES_LIVRAISON` côté Reprise ; la fusion de deux objets livrés est différée (pas d'opération `fusion` en v1). |
| A-13 | Comptage et `stock` : double propriété | appliqué | AD-11, AD-13 | Ouverture remplaçante par (entrepôt, article), `OUVERTURE_CLOSE`, valeur de contrôle = quantité comptée, un lot, une feuille par entrepôt, brouillon figé à « comptage clos », attente des lots référencés. |
| A-14 | Verrou et relances de morceaux | appliqué | AD-30 | Acquittement dans la même transaction, bail Mongo avec fencing, morceau de version n jamais rejoué après n+1, renouvellement. |
| A-15 | Pause en `LECTURE_SEULE` à mi-livraison | appliqué | AD-30, AD-4 | Refus de garde jamais verdict d'objet ; `LIVRAISON_PARTIELLE`, reprise automatique ; `LIVRE` exige tous les morceaux acquittés. |
| A-16 | Version de schéma épinglée et champs facultatifs | appliqué | AD-2 | `schema` `<code>.<objet>@<majeure>.<mineure>`, `SCHEMA_NON_CONFORME`, mineure ≤ la sienne, épingles alignées par version de plateforme (CI). |
| A-17 | Valeurs de contrôle sans forme commune | appliqué | AD-13 | Types fermés, `dateDeValeur` fixée par le lot, fonction de comparaison unique avec vecteurs. |
| A-18 | Argent : conversion et devise | appliqué | AD-32 | Décimal exact, unités mineures uniques, `HALF_EVEN`, `ARRONDI_APPLIQUE`, `DEVISE_HORS_ORGANISATION`. |
| A-19 | Dates : 1900/1904, formats texte | appliqué | AD-14 | `format` par colonne, système lu dans le classeur, `DATE_AMBIGUE`, fuseau de l'organisation. |
| A-20 | Fichier malveillant en libre-service | appliqué | AD-29 | D-31 : limites, processus isolé, signature, neutralisation CSV ; la taille maximale n'est plus différée. |
| A-21 | tus : autorisation et expiration | appliqué | AD-29 | D-31 : envoi lié à l'utilisateur et au lot, 24 h, SHA-256 serveur, `FICHIER_DEJA_DEPOSE`. |
| A-22 | Suppression, réception multi-modules, sauvegardes | appliqué autrement | AD-15, AD-33 | `modulesAlimentes ⊆ modulesRecus` ; les sauvegardes suivent la rétention du moteur (AD-16), dite au certificat, sans borne chiffrée propre. |
| A-23 | Effacement : accusé non vérifiable, courses | appliqué | AD-33 | Transition `EFFACEMENT_EN_COURS`, balayage et vérification, empreinte du JCS trié, buckets et envois tus. |
| A-24 | Cession : fenêtre autour du point de coupure | appliqué | AD-20 | Atomique, `versionCession`, hachage des tables, point de coupure immuable une fois `LIVRE`, mouvements ≤ point ignorés. |
| A-25 | Séparation des tâches | différé | Deferred | Arbitrage de gouvernance : le DG peut valider son propre rapport ; à trancher par le PO. |
| A-26 | Journal et dossier : fuite de données | appliqué | AD-21, AD-7 | Charge sans contenu, l'agent seul inscrit, domaine de valeurs au dossier, valeur témoin cherchée dans le dossier et à l'effacement. |
| A-27 | Import du dossier : versions successives | appliqué autrement | AD-7, Deferred | Refus `DOSSIER_VERSION_DIFFERENTE` après une validation ; la commande `reprise:dossier:reimporter` est différée. |
| A-28 | Forme canonique de `identifiant` | appliqué | AD-32, AD-3 | NFC, bords rognés, zéros de tête, une fonction, vecteurs. |
| A-29 | Read-model de l'état publié | appliqué | AD-17, AD-8 | `numero` porté, resynchronisation avant chaque rapport, instant et `numero` versés à la validation, hors empreinte. |
| A-30 | Limites d'octets et délais | appliqué autrement | AD-4, Deferred | 1 Mio et 500 objets, 413 `LOT_TROP_GROS`, 30 s à la conformité ; la réponse 202 avec `jobId` est différée. |

## Rubric

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| R-1 | « États égaux » contre requalification ; qui calcule la source | appliqué | AD-13 | Comparaison sur `etatRetenu` validé, `montantASaisir` exclu et listé, valeurs de la source calculées à l'étape 2 par la bibliothèque. |
| R-2 | Pas de retrait ni de sortie de `VERT` | appliqué | AD-25, AD-12 | D-24 et D-25. |
| R-3 | Rétention de la zone de transit | appliqué | AD-15 | Lignes et objets purgés avec les fichiers ; rapports sans contenu ; contenus des versions remplacées purgés. |
| R-4 | Aucune politique d'échec ni d'observabilité | appliqué | AD-30 | AD « Exploitation des lots ». |
| R-5 | Types du journal et NFR-2 incomplets | appliqué | AD-21, AD-22 | Liste complète, amendement d'AD-12 du moteur. |
| R-6 | Contrats de la Reprise absents de la table du moteur | appliqué | AD-22 | Ligne sur AD-17 du moteur. |
| R-7 | Fusion absorbant une clé déjà livrée | appliqué | AD-9 | `FUSION_APRES_LIVRAISON` côté Reprise ; opération de fusion différée. |
| R-8 | Désignation du valideur par écrit | appliqué | AD-26, AD-17 | D-27. |
| R-9 | Taxonomie de gravité, « écart ouvert » non défini | appliqué | AD-24 | D-26. |
| R-10 | États du lot : exécution, échec, pause, abandon | appliqué | AD-1, AD-30 | Statut d'exécution orthogonal ; abandon permis tant que non `LIVRE`. |
| R-11 | Morceaux et étapes globales | appliqué | AD-1 | Passes globales = travaux à part, idempotents. |
| R-12 | Règles du lot : instantané par version | appliqué | AD-1, ER | Instantané haché avec le rapport ; ER corrigé (`VERSION_LOT`, `REGLES`). |
| R-13 | « Correspondance » désigne deux choses | appliqué | AD-6, AD-7, AD-20 | Table de valeurs de référence seulement. |
| R-14 | `ATTENDU` pour un module jamais alimenté dans l'essai | appliqué | AD-12 | Aussi à la création du premier lot du réel. |
| R-15 | Suppression : lot abandonné, tus inachevé, fichier remplacé | appliqué | AD-15, AD-29 | Trois cas ajoutés ; envoi incomplet expire en 24 h. |
| R-16 | Taille maximale différée | appliqué autrement | AD-29, AD-15 | Valeurs de D-31 (100 Mo, pas 500 Mo) ; limite de proxy 12 Mio. |
| R-17 | `.xls` binaire, système 1904 | appliqué | AD-18, AD-14 | `.xls` refusé lisiblement ; 1904 lu dans le classeur. |
| R-18 | Numéros de version à vérifier | appliqué autrement | Stack | Vérifiés par la relecture « versions » (V-). |
| R-19 | « API REST des lots » sans contrat | appliqué | Conventions (Écrans et API) | Ressources, 202, progression, curseur, OpenAPI. |
| R-20 | Droits manquants | appliqué | AD-17, Conventions | `reprise:regle:modifier`, `reprise:comptage:saisir` ; écran → droit. |
| R-21 | Capacité et persistance de Redis | appliqué autrement | AD-30, Déploiement | Concurrence et mémoire réglées à la mesure ; Redis perdable (acquittement dans Mongo), donc pas d'AOF exigé. |
| R-22 | Sobriété : tableau seed, justifications | appliqué autrement | AD-10, Design Paradigm | Justifications retirées (Odoo, SAP, Dynamics) ; le tableau d'AD-23 est gardé (seed demandé). |
| R-23 | Noms flottants dans le catalogue d'erreurs | appliqué autrement | Conventions, AD-4 | `SOLDE_DIFFERENT` → `VALEUR_DE_CONTROLE_DIFFERENTE`, codes cités dans leur AD, diagramme corrigé ; `FEU_VERT_DONNE` gardé (nom de D-6). |
| R-24 | ER incomplet | appliqué | ER | `VERSION_LOT`, `MORCEAU`, `REGLES`, `CESSION`, `BAIL` ajoutés ; validation rattachée à la version. |
| R-25 | Garde et nature `ESSAI_CLIENT` | appliqué autrement | AD-4 | La garde suit la matrice des neuf états ; l'essai « client » est dit nature, pas état (vérifié dans le moteur AD-15). |
| R-26 | Verrous croisés et impasse | appliqué | AD-30 | Ordre alphabétique du code de module. |
| R-27 | `INCHANGE` et empreinte de contenu | appliqué | AD-3 | Comparaison par empreinte de contenu. |
| R-28 | Deux lecteurs d'exports Sage | appliqué | AD-18, Deferred | Corpus partagé joué par les deux lecteurs ; migration différée. |
| R-29 | Comptage : brouillon mutable | appliqué | AD-11, AD-1 | « Comptage clos » fige une version. |

## Reconcile PRD (lignes non « couverte »)

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| P-2 | Politique de version du paquet d'adaptateurs | appliqué | AD-18 | Semver, majeure alignée, jamais deux majeures actives. |
| P-3 | Prérequis du manifeste absents | appliqué autrement | AD-17 | `prerequis` déclarés ; la matrice des versions d'Odoo relève de la spine de Connecteurs. |
| P-7 | Lot abandonné ou module jamais mis en service : fichiers jamais supprimés | appliqué | AD-15 | 30 jours après abandon ; modules du sous-ensemble dans la charge de réception. |
| P-11 | Types d'écart manquants | appliqué | AD-6, Conventions | `CORRESPONDANCE_ABSENTE`, `CHAMP_OBLIGATOIRE_ABSENT`, `ECHEANCIER_INCOMPLET`. |
| P-13 | `enrichiPar` côté Connecteurs | appliqué | AD-20, AD-22 | Manifeste de Connecteurs déclare `reprise`. |
| P-16 | Motif et trace de la saisie d'un montant | appliqué | AD-4, AD-2 | Cible : motif exigé et journalisé ; dans la suite de conformité. |
| P-18 | Aucune borne haute ; échéancier incomplet | appliqué | AD-19, AD-24, Deferred | Règle reportée à la ligne microfinance. |
| P-22 | Stock multi-entrepôts : `VERT` trop tôt | appliqué | AD-11, AD-12 | Un lot `COMPTAGE`, une feuille par entrepôt ; `VERT` à la validation et livraison du lot. |
| P-26 | Doublons avec des objets déjà dans la cible (UJ-5) | appliqué | AD-5, AD-9 | D-28 : `doublonsProbables` en `SIMULER`, `rattacherA`. |
| P-27 | Gouvernance de la validation (FR-13) | appliqué | AD-26, AD-22 | D-27 ; « DG ou désigné » = droit attribué par le DG avec désignation tracée. |
| P-32 | `ATTENDU` sans essai, sans dossier | appliqué | AD-12 | Aussi à la création du premier lot du réel ; test « réel sans essai ». |
| P-33 | `VERT` irréversible (contredite) | appliqué | AD-25, AD-22 | D-24 ; FR-15 amendé. |
| P-37 | FR-17 : rapport de la période | appliqué autrement | Deferred | Ajouté à la ligne de la comparaison de nuit. |
| P-38 | Clés de rattachement : ordre et clé | appliqué autrement | Deferred | Clés = `identifiant` des objets `polices` et `sinistres`, `VIVANT` d'abord ; entité d'ER non ajoutée (nom réservé seulement). |
| P-39 | Rôle du DSI, attribution par l'administrateur | appliqué | AD-17 | Droits portés par le rôle du DSI, attribués par l'administrateur (moteur FR-35). |
| P-40 | La mise en service reste un acte de Money Vibes | appliqué | AD-17 | Aucune action de mise en service dans le module d'écran. |
| P-42 | `reprise` ouvert d'office dans l'essai du prospect | appliqué | AD-17 | Renvoi à moteur FR-33 et test. |
| P-44 | Route d'export : service ou utilisateur | appliqué | AD-16, AD-17, AD-21 | Une route, deux publics (chemin public et identité de service). |
| P-47 | Point de coupure : début de lecture | appliqué autrement | AD-20 | « Instant de début de l'extraction » précise D-19 sans le rouvrir. |
| P-49 | Liste du journal (NFR-2) incomplète | appliqué | AD-21 | Types complets. |
| P-53 | Limite de corps non fixée | appliqué | AD-15, AD-29 | 12 Mio ; expiration 24 h. |
| P-54 | SM-1 → SM-4 et contre-indicateurs non mesurés | appliqué | AD-34 | Compteurs du rapport lus par la console. |
| P-56 | C4 : fonctionne sans module cible | appliqué | binds, AD-2, Conventions | C4 ajoutée aux `binds` ; test « aucun module cible ». |
| P-57 | C8 : écran → droit | appliqué | Conventions (Écrans et API) | Liste écran → droit. |
| P-58 | C9 : désinstaller ne supprime rien | appliqué | AD-17 | Base gardée jusqu'à l'effacement ou l'export. |
| P-59 | C12 sans contenu | appliqué | AD-31 | AD « Rétrocompatibilité ». |
| P-60 | Route de santé, rafraîchissement de l'essai | appliqué | AD-16, AD-7 | `sante` nommée ; lots, rapports, fichiers de l'essai supprimés au rafraîchissement, dossier gardé. |
| P-62 | OQ-6 : pas de reprise pour le cabinet | appliqué | AD-17 | Une phrase (le cabinet ne déclare aucun `objetsDeReprise`). |

## Reconcile amont

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| M-1 | Exception de C2 : les contrôles et `SIMULER` ne sont pas des « routes d'import » | appliqué | AD-22, AD-4 | Élargie à « routes de reprise déclarées » + route C13 `import` ; ligne dans la matrice des neuf états. |
| M-2 | Endroits amont qui supposent un feu vert par lot | appliqué | AD-22 | Glossaire, FR-8, FR-11, ligne C5, voisins, A-2, AD-23, conventions d'erreurs, EPIC-146. |
| M-3 | AD-16 casse sous la réécriture du proxy ; export pour deux publics | appliqué | AD-16, AD-22 | D-33 : code dans le chemin du service ; export des deux publics ; test « deux modules, cinq routes ». |
| M-4 | Ordre de mise en service : la Reprise d'abord | appliqué | AD-17, AD-7, AD-22 | Plan de la partie A, sans feu vert, avant les cibles ; PRD moteur FR-8 et AD-23 amendés. |
| M-5 | `epoque` absente de `numero` et des `eventId` | appliqué | AD-12, AD-19, Conventions | Ordre (`epoque`, `numero`), republication au démarrage, test « restaurer puis rejouer ». |
| M-6 | C12 : `migrer`, lecture N et N-1, manifeste incomplet | appliqué | AD-31, AD-17 | Manifeste complet (`prerequis`, `interrupteurs`, `publie`, `consomme`, `migrer`). |
| M-7 | C13 : prérequis, santé, interception, ne bloque pas les autres | appliqué | AD-17 | Une ligne par point. |
| M-8 | Export contre import ; rafraîchissement ; export du dossier | appliqué | AD-16, AD-7, AD-17 | `perimetre=dossier` ; la Reprise ne participe pas au rafraîchissement ; preuve restreinte au dossier. |
| M-9 | Registre parallèle de contrats ; schémas de topics ; draft | appliqué | AD-21, AD-22, AD-2 | Lignes ajoutées à AD-17 du moteur ; schémas de topics dans `prospera-plateforme/contrats/`. |
| M-10 | Types du journal fermés | appliqué | AD-21, AD-22 | Types listés ; charge sans contenu. |
| M-11 | 43 manifestes, `ModuleVersion`, §6 du contrat | appliqué | AD-22 | EPIC-143, `manifestes-a-produire.md`, contrat §6. |
| M-12 | Exception de C2 limitée au « rejeu » | appliqué | AD-22, AD-10 | Fenêtre : tant que le module est `EN_INSTALLATION` dans le réel ; AD-10 recadré sur la garde de la cible. |
| M-13 | Historique livré d'un lot `COURANTE` : calibration en production | appliqué | AD-19 | Fait limité à la sorte `INITIALE`. |
| M-14 | Qui construit, quand ; charge | appliqué autrement | AD-23, Deferred | Minimum de la démo (`pdv`) et écrans par Dev B écrits ; le reste relève des épics de la Reprise (risque de charge ouvert). |
| M-15 | tus contourne `creerClient` de la coque | appliqué | AD-22 | `creerTeleversement(code)` et `tus-js-client` à la stack de la coque. |
| M-16 | Part de la Reprise au dossier hors A-7 | appliqué | AD-22, AD-7 | A-7 amendé ; test de valeur témoin. |
| M-17 | Minuteurs de suppression sur l'horloge système | appliqué | AD-15, Conventions | Lecture sur `HorlogeDeReference`. |
| M-18 | Read-model sans amorçage | appliqué | AD-17 | Lecture de la route de l'état publié au démarrage, garde fermée d'ici là. |
| M-19 | `.changed` en convention ; `FEU_VERT_DONNE` | appliqué autrement | Conventions | `.changed` « toléré comme l'amont » ; le renommage du code est rejeté : le nom vient de D-6. |
| M-20 | Effacement : travaux, verrous, tus, read-model, idempotence | appliqué | AD-33 | Liste complète, accusé idempotent, effacement de Connecteurs, acheteur hébergé. |
