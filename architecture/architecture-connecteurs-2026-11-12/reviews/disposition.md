# Disposition des constats de la porte de relecture (2026-11-12)

Chaque constat de chaque revue a une ligne. Numérotation de la revue : V- versions (lignes du tableau : chaque ligne « à corriger » ou « non vérifiable », puis une ligne pour les conformes), A- adversaire, R- rubric, P- reconcile PRD (lignes partielles, absentes, contredites, puis inventions I-n ; les « couvertes » sont regroupées), M- reconcile amont. Les consignes de Dev B (sections A à D) priment sur les corrections des relecteurs ; la section D est la réponse du PO du 2026-11-12. Règle : « rejeté » seulement si le constat contredit une décision du PO ; « différé » seulement si le point attend un fait qui n'existe pas, et la ligne est alors au Deferred de la spine. Les décisions D-20 → D-48 sont au `.memlog.md`.

## Versions

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| V-9 | BullMQ 6 : `repeat` supprimé, `ioredis` peer, `Queue#client` retiré | appliqué | AD-1 (job schedulers), Stack | Relevé, pouls et nuit sont des `upsertJobScheduler` ; `ioredis` à la Stack ; première majeure 6 dite. |
| V-10 | `@nestjs/bullmq` : peer `bullmq` 6 seulement dès 11.0.5 | appliqué | Stack, AD-31 (ligne Stack) | « 11.0.5 au moins ou 12.x », story de pointe, repli bullmq 5.x ; signalé au moteur (sa stack dit 11.x). |
| V-11 | Redis 7.0 hors support | appliqué | Stack, Déploiement, AD-31 (ligne Stack) | « 7.2 ou plus récent » ; minimum de BullMQ 6 contrôlé à la story de pointe ; signalé au moteur. |
| V-20 | `check_access_rights` déprécié dès 18, absent en 20 | appliqué | AD-18 (identifiants en lecture seule), manifeste (`verifications.lecture-seule`) | Contrôle selon le profil de version : `check_access_rights` jusqu'à 17, `has_access` dès 18. |
| V-21 | Création d'`ir.model.data` réservée au groupe « Droits d'accès » | appliqué | AD-23 (prérequis), AD-5 (repli), manifeste (`prerequis.droits-du-compte`) | Prérequis du compte d'écriture du réel ; repli : liaison chez Connecteurs seulement, `deduplication: false`. |
| V-25 | Multi-société : sans contexte, toutes les sociétés de l'utilisateur | appliqué | AD-23 (une société par connecteur) | `allowed_company_ids = [société du connecteur]` et filtre `company_id`. |
| V-26 | Transactions Mongo : jeu de réplicas exigé (non vérifiable) | appliqué | AD-1, Stack, Déploiement | Jeu de réplicas (patron `rs0`) au compose de développement et au gabarit d'instance. |
| V-conformes | Lignes 1-8, 12-19, 22-24 conformes (19) | appliqué | Stack, AD-7, AD-22, AD-23 | Précisions reprises : Node 24 en maintenance, NestJS 12 existe, Karapace 6.2.4, IV de 12 octets (AD-22), image 20.0 et images 12-13 figées (AD-23), dates de retrait JSON-RPC (AD-23), `/jsonrpc` de 8.0 à 19.0, `account.move` filtré par `move_type`, `database.uuid` illisible sans droit système (AD-18), `write_date` à la seconde et `active_test: false` (AD-7). |

## Adversaire

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| A-1 | Propriétaire par défaut = Prospera si état inconnu | appliqué autrement | AD-3 (propriétaire inconnu : défaut fermé), AD-29 | Consigne A.1 : Prospera seulement si `connecteurs` est `NON_INSTALLE` ou `DESINSTALLE` ; sinon relecture par route de service et `PROPRIETAIRE_INCONNU` (503). |
| A-2 | `mouvementId` entrant dépend de `write_date` | appliqué autrement | AD-5 (entrant), AD-4, Conventions (Données) | Consigne A.3 : l'identité EST la `cleOrigine` ; une modification met à jour le même enregistrement ; pas d'opération `CORRIGER_MOUVEMENT`. |
| A-3 | Stock d'ouverture additionné chez Odoo | appliqué autrement | AD-20 (stock d'ouverture) | Consigne A.5 : ajustement d'inventaire en quantité comptée, jamais additionné ; pas de valeur de contrôle seule. |
| A-4 | Écart sur un mouvement encore dans la file ; double correction | appliqué autrement | AD-13 (mouvements en vol), AD-14 | Consigne A.6 : clé « en vol » jamais en écart ; décision refusée tant qu'un mouvement est en vol (`MOUVEMENTS_EN_ATTENTE`) ; pas d'annulation des mouvements. |
| A-5 | Changement de propriétaire non atomique | appliqué autrement | AD-33, AD-3 | Consigne A.2 : protocole en cinq étapes (BASCULE, accusés, concordance, aucun écart d'argent, publication), délai 1 h. |
| A-6 | Fait perdu : mouvement en attente orphelin | appliqué | AD-8 (orphelins), AD-10 (route `en-attente`), AD-29 | Consigne A.9 : balayage nocturne ; plus de 24 h signalé. |
| A-7 | Dépendances entre domaines ; attente sans fin | appliqué autrement | AD-6 | Consigne A.8 : dépendances résolues tous domaines confondus (pas déclarées) ; attente de plus de 24 h signalée, jamais refus. |
| A-8 | Rang attribué à la capture ; BullMQ sans ordre par groupe | appliqué | AD-6, AD-1 | Rang attribué par la cible dans la transaction de saisie ; verrou Mongo par objet. |
| A-9 | Rang et identifiant d'un mouvement corrigé | appliqué autrement | AD-9 (Corriger et renvoyer), AD-6 | Choix de la spine (D-43) : règle corrigée = même mouvement ; objet source corrigé = nouveau mouvement qui remplace et garde le rang. |
| A-10 | Transaction longue : enregistrements jamais relevés | appliqué | AD-7 (chevauchement, rattrapage), AD-13 | Consigne A.10 : chevauchement déclaré par l'adaptateur (Odoo 10 min) et relevé de rattrapage de 24 h ; la concordance rattrape le reste. |
| A-11 | Résolution à la seconde ; égalité de date | appliqué autrement | AD-4 (`OBJET_DATE`), AD-7 (décalage d'horloge) | Consigne A.10 : à date égale la dernière lecture s'applique, compteur `EFFET_EGAL` ; décalage mesuré. |
| A-12 | `MOUVEMENT` entre point de coupure et mise en service | appliqué | AD-20 (domaine `MOUVEMENT`), AD-5 | Consigne A.3 : démarre au point de coupure après cession (même clé d'origine), sinon à la mise en service. |
| A-13 | Cession ratée : fenêtre à deux écrivains | appliqué | AD-3 (propriétaire publié dès `PREPARE`), AD-20, AD-19 | Consigne A.1 : cession ratée = domaine rouge et alerte, passage `ACTIF` retardé. |
| A-14 | Restauration : mouvements à vérifier | appliqué | AD-25 (restauration) | Consigne A.12 : tous les non `CONFIRME` passent `A_VERIFIER` ; curseurs ramenés ; liste des saisies perdues. |
| A-15 | Envoi expiré puis renvoi classé refus | appliqué | AD-5 (protocole d'envoi), AD-8, Conventions (`DEJA_PRESENT`) | Chercher d'abord par identifiant externe ; violation d'unicité = succès. |
| A-16 | Le fencing ne protège pas Odoo | appliqué autrement | AD-1 (bail, fencing), AD-25 | Consigne A.12 : le fencing protège la base de Connecteurs, le client est protégé par l'identifiant externe ; un envoi ambigu sans dédoublonnage passe `A_VERIFIER`. |
| A-17 | `argent` sans `controle` | appliqué | AD-2 (règles de manifeste) | Consigne A.6 : catalogue refuse ; `lireValeurs` requis pour passer `ACTIF`. |
| A-18 | Concordance trop longue, rapport partiel | appliqué autrement | AD-13 (dimensionnement), AD-35, AD-15 | Consigne A.6 : 100 000 objets, 10 000 mouvements par jour, 00 h 30 → 05 h 30, rapport partiel `NON_COMPARE`, `complete` dans `nuit.terminee`. |
| A-19 | Valeurs lues en direct, ventes de nuit | appliqué | AD-13 | Valeur à la `dateDeValeur` si possible, sinon clés modifiées exclues ; clé relue avant d'ouvrir l'écart. |
| A-20 | Deux horloges ; changement d'heure | appliqué | AD-15, Conventions (Temps, Idempotence) | Source unique (état publié plus temps écoulé), date de nuit, clef `(organisationId, date de nuit)`, test de changement d'heure. |
| A-21 | Deux décideurs ; clé d'écart | appliqué | AD-13 (clé d'unicité), AD-14 (`versionEcart`, décision en bloc) | |
| A-22 | Résorption silencieuse d'un écart d'argent | appliqué autrement | AD-13 (`RESORBE`) | Consigne A.6 garde `RESORBE` à confirmer par le PO (D-44) ; résorption visible 30 jours, comptée (AD-30). |
| A-23 | Argent corrigé par un autre chemin que `CORRIGER` | appliqué autrement | AD-4 (argent), AD-13 (mutation), AD-10 | Consigne A.11 : `ARRONDI_REQUIS`, `DOMAINE_PROSPERA`, mutation à trois chemins, liste fermée des chemins ; le propriétaire écrasé par la synchronisation est la règle (AD-P18). |
| A-24 | Montants flottants, devise, décimales | appliqué | AD-23 (profil de version) | Champ source, devise, décimales lues de la devise ; rejet `ARRONDI_REQUIS`. |
| A-25 | Bac à sable recréé ou repointé ; droits natifs incomplets | appliqué autrement | AD-18 (bac à sable vérifié, droits natifs) | Consigne A.13 : empreinte revérifiée à chaque session et avant chaque lot ; uuid non exigé (illisible sans droit système, V-conformes). |
| A-26 | Cibles construites avant le kit d'échange | appliqué autrement | AD-11 (point d'écriture unique), AD-32, AD-31 | Consigne A.14 : un seul point d'écriture par domaine, faits avec identifiant stable et `rang` ; contrat chiffré avant signature ajouté à AD-32. |
| A-27 | Versions du kit, négociation | appliqué | AD-12 (versions du kit) | Consigne A.15 : semver, majeure alignée, deux majeures actives, un propriétaire unique relu par l'autre. |
| A-28 | Route d'échange ouverte en `LECTURE_SEULE` pour tout | appliqué | AD-10, AD-21 (matrice) | Consigne A.16 : quatre opérations passent, `CORRIGER` refusé ; âge de l'état publié : au-delà de 15 minutes sans confirmation (fait ou lecture), la garde relit l'état publié par la route de lecture ; si la relecture échoue, elle garde l'état courant, passe sa santé à `DEGRADE` et réessaie, sans rien fermer pour cette seule raison (AD-21) ; précision proposée au moteur AD-24 (AD-31). |
| A-29 | Effacement : Redis, Kafka, sauvegardes | appliqué | AD-26, AD-31 (moteur AD-16, AD-38) | Consigne A.18 : Redis par préfixe, faits sans contenu métier, effacement rejoué après restauration, délai automatique d'essai demandé au moteur. |
| A-30 | Clé AES unique ; authentification refusée retentée | appliqué | AD-22, AD-9 | `kid`, rotation, clé hors sauvegarde ; authentification refusée : arrêt après 3 essais, alerte « identifiants ». |
| A-31a | Service muet ; supervision extérieure | appliqué autrement | AD-17 (service muet), Déploiement | Consigne A.19 : la supervision du moteur lit `sante` ; pas de nouveau contrôle à 06 h 15 (`nuit.absente` couvre le service vivant). |
| A-31b | Sur site : Money Vibes après le client | rejeté | AD-17 (dernier point) | Contredit une décision du PO : le délai de Money Vibes sur site est celui du contrôle quotidien (PRD FR-13, QC-11, consigne A.19). |
| A-32 | Une seule requête par organisation ; synchronisation initiale | appliqué | AD-7 (canaux), AD-35 (priorités, synchronisation initiale), AD-16 | Consigne A.10 : un canal de lecture, un d'écriture, plafonds déclarés, priorités. |
| A-33 | Plafond de reprises ; pages mises de côté | appliqué | AD-8 (`EN_ECHEC_TECHNIQUE`), AD-35, AD-7 | Rejeu par objet dans l'ordre. |
| A-34 | Images Odoo Community seulement | appliqué | AD-23 (matrice de versions) | Édition testée ou non dite au bilan ; recette sur copie de la base avant le premier contrat. |
| A-35 | Prospect : minimisation des données lues | appliqué autrement | AD-18 (prospect, masquage) | Lecture limitée aux domaines configurés, champs personnels masqués, durée de l'essai ; accord sans masquage enregistré par un détenteur de `configuration:administrer`, tracé. |
| A-36 | Règles intestables | appliqué | AD-13 (liste fermée, balayage), Conventions (Tests) | Un test par chemin d'écriture d'argent ; deux travailleurs simulés. |
| A-37 | SM-3 mesuré à l'horloge d'Odoo | appliqué | AD-30, AD-7 | Mesure depuis la capture ou le relevé, corrigée du décalage. |
| A-38 | L'assureur enverra-t-il des exports répétés ? | différé | Deferred (assureur, export unique ou répété) | Dépend de QK-17 (logiciel de l'assureur non examiné) ; revoir à l'examen de ce logiciel. |

## Rubric

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| R-1 | Handshake de changement de propriétaire | appliqué | AD-33, AD-3 | Voir A-5. |
| R-2 | Concordance et mouvements en vol ; concordance à la demande | appliqué | AD-13, AD-33 | `POST /api/v1/domaines/{domaine}/concordances`, mêmes règles que la nuit. |
| R-3 | Correction d'une valeur `LECTURE` | appliqué autrement | AD-4 (`LECTURE`), AD-13, AD-14 | Consigne A.6 : les domaines `LECTURE` sortent de la concordance ; la question ne se pose plus. |
| R-4 | Rétention et capacité | appliqué | AD-35, AD-13 | Consignes A.6 et A.20. |
| R-5 | Valeurs de reprise, bail, observabilité | appliqué | AD-35, AD-1 | 8 reprises de 1 s à 15 min, bail 2 min, jeton par écriture conditionnelle, métriques. |
| R-6 | « Corriger et renvoyer » : identifiant gardé ou non | appliqué autrement | AD-9, AD-8 (`ABANDONNE`) | Choix de la spine (D-43) : remplaçant lié, remplacé `ABANDONNE`. |
| R-7 | Curseur pour un domaine `LECTURE` | appliqué | AD-7 (domaine `LECTURE`), AD-23 (`decrire`) | Curseur de l'objet porteur plus instantané nocturne ; méthode déclarée par l'adaptateur. |
| R-8 | Automate d'états du domaine et du connecteur | appliqué | AD-34, Conventions (États, avec `OMBRE` et les états d'un écart) | |
| R-9 | Écriture de test sur le réel | appliqué | AD-18 | Seulement sur un objet de test déclaré ; sinon « non démontrée » ; une réussite est un incident. |
| R-10 | Gravité d'écart ; `ARRONDI_APPLIQUE` | appliqué autrement | AD-13 (types), AD-4, AD-3 | `ARRONDI_APPLIQUE` disparaît (`ARRONDI_REQUIS`, rejet) ; tout écart d'argent ouvert bloque l'arrêt ; naissance de chaque type écrite ; pas de gravité en donnée. |
| R-11 | `mouvementId` entrant : ligne ou `write_date` | appliqué | AD-5 | Consigne A.3. |
| R-12 | Table opération × état de la route d'échange | appliqué | AD-10, AD-21 | Consigne A.16. |
| R-13 | `<code>` ambigu | appliqué autrement | Conventions (Nommage), AD-10 | Consigne C : `<code>` = code du module cible ; pas de domaine dans la route. |
| R-14 | C11, UJ-8, `mouvements-echange@1` | appliqué | AD-2 (historique de nuit), AD-27 (C11), AD-3, AD-31 (C5), AD-29 (`echange-enveloppe@1`) | |
| R-15 | `redis` du manifeste, catalogue de plateforme, routes en lecture seule | appliqué | AD-27, manifeste, AD-31 (`auth-service`, catalogue) | Mêmes listes dans AD-27 et le manifeste. |
| R-16 | Restauration : mouvements à vérifier | appliqué | AD-25 | Consigne A.12. |
| R-17 | Incident : 30 min de quoi ; anti-battement ; SM-2 | appliqué | AD-17, AD-30 | 30 min continues, fermeture après 10 min sans rouge ; SM-2 mesurable. |
| R-18 | Chiffrement : nonce, rotation, expiration | appliqué | AD-22 | |
| R-19 | Versions, `ajv-formats`, images | appliqué | Stack, AD-23 | `ajv-formats` 3.0.x ajouté. |
| R-20 | Flèche manquante ; routes d'écran absentes d'AD-29 | appliqué | Mermaid (flux), AD-29 | |
| R-21 | Redites (kit, codes, AD-31 ligne 1) | appliqué | AD-10, AD-12, Conventions, AD-31 | Kit défini en AD-12 seul, codes en Conventions. |
| R-22 | Nuit non terminée : que fait la Reprise ? | appliqué | AD-15 (`nuit.absente`, « non couverte »), AD-29 | |

## Reconcile PRD

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| P-1 | Adaptateur `api` de l'IMF absent du Seed | appliqué | Structural Seed, Deferred (IMF) | Dossier `api/` marqué différé (QK-18). |
| P-6 | Configuration hors de la console, non déclarée | appliqué | AD-28, AD-31 (FR-2, UJ-8, C8) | D-10, D-46. |
| P-13 | Marche en parallèle après la mise en service (FR-3, UJ-8) | appliqué autrement | AD-15, AD-31 (FR-3, FR-9, UJ-8) | D-46, puis révisée par D-48 (voir « Révision D-9 »). |
| Révision D-9 | Contrôle des amendements (2026-11-12) : D-9 plaçait la marche en parallèle après la mise en service, contre PRD moteur UJ-3, PRD Reprise FR-17, PRD Connecteurs UJ-8 et FR-3 | appliqué | AD-4, AD-15, AD-31, AD-34, Deferred | D-48 : parallèle dans l'essai avant la mise en service, mode `OMBRE`, écart nul de la période exigé ; textes voisins remis en accord. |
| P-18 | Test des deux saisies simultanées | appliqué | AD-4, Conventions (Tests) | |
| P-21 | Table donnée → niveau ; trois cas absents | appliqué | AD-2 | Somme des `niveauParDefaut` ; blocage de crédit = `LECTURE` immédiate ; historique pour l'IA = domaine `NUIT`. |
| P-23 | Stock disponible sans lecture synchrone | appliqué | AD-4, AD-31 (FR-5) | D-46. |
| P-39 | Correction vers chaque logiciel (déclarée) | appliqué | AD-14, AD-31 (FR-8) | Plus M-2 : la décision humaine prime pour l'argent. |
| P-44 | Écart `RESORBE` non déclaré | appliqué | AD-13, AD-31 (FR-8, FR-9, §3) | À confirmer par le PO (D-44). |
| P-46 | L'arrêt de la synchro : file des écarts ou feu vert de la Reprise | appliqué autrement | AD-3, AD-15 | Consigne C : l'arrêt attend la file des écarts de Connecteurs ; feu vert et rapport de la période ne sont pas lus (PRD A-5 rejetée). |
| P-47 | Test de la panne simulée | appliqué | Conventions (Tests) | |
| P-52 | Seuils : contrat `seuils-fraicheur@1` (déclaré) | appliqué | AD-16, AD-31 (coque AD-7) | |
| P-53 | Message d'action dès l'orange | appliqué | AD-16 (`messageDes`) | |
| P-61 | `niveau` absent des compteurs sur site | appliqué | AD-17 (sur site), AD-29 | |
| P-63 | Compteurs au schéma de FR-26 | appliqué | AD-31 (PRD FR-13, QK-20, FR-26 ; moteur AD-9) | |
| P-68 | XML-RPC différé, QK-1 | appliqué | AD-23, AD-31 (FR-14, QK-1), Deferred (XML-RPC) | JSON-RPC présent de 8.0 à 19.0. |
| P-71 | Action du prérequis plan Custom | appliqué | manifeste (`prerequis.*.action`), AD-27 | |
| P-78 | Adaptateur `api` non dessiné | appliqué | Structural Seed, Deferred (IMF) | Voir P-1. |
| P-80 | FR-17 : requis en février (déclarée) | appliqué | AD-32, AD-31 (PRD Connecteurs, PRD moteur, plan v3) | |
| P-83 | Comptabilité d'Odoo vers Prospera | appliqué | Deferred (écritures comptables d'Odoo) | Revoir au premier besoin de la comptabilité d'Odoo dans Prospera ; dit aussi en AD-31 (PRD Reprise FR-17). |
| P-87 | Lecture seule par droit natif | appliqué | AD-18, AD-31 (FR-18, C13 point 2, A-7) | |
| P-94 | La Reprise ne lit pas le bac à sable | appliqué | AD-18 (prospect), AD-31 (PRD Reprise FR-23 ; renvoi A-10 du PRD Connecteurs) | |
| P-96 | Route d'échange en lecture seule (déclarée) | appliqué | AD-10, AD-21, AD-31 (C2, FR-43) | Précisé par opération. |
| P-103 | Point de relais scindé | appliqué | AD-20 (deux points), AD-31 (FR-20, A-11) | D-46. |
| P-106 | La Reprise retire ses identifiants | appliqué | AD-20 (dernier point), AD-31 (PRD Reprise FR-23) | Renvoi. |
| P-113 | NFR-2 : ordre par objet (déclarée) | appliqué | AD-6, AD-31 (NFR-2) | |
| P-119 | SM-2 : mouvement perdu | appliqué | AD-30 | Sans état terminal après 24 h ou absent à la concordance ; doublon compté au dédoublonnage. |
| P-122 | SM-5 (déclarée) | appliqué | AD-32, AD-31 | |
| P-126 | Raison de chaque `enrichiPar` | appliqué | manifeste (commentaire), AD-27 (une raison par entrée ou par groupe d'entrées) | |
| P-130 | C5 : contrats retirés (déclarée) | appliqué | AD-29, AD-31 (C5) | `etat-connecteur@1` justifié en D-46. |
| P-133 | C8 : configuration quitte la console | appliqué | AD-28, AD-31 | Voir P-6. |
| P-135 | Avertissement avant désinstallation (absente) | appliqué | AD-21, manifeste (`avertissementDesinstallation`), AD-31 (C9) | |
| P-137 | C11 sans objet | appliqué | AD-27, AD-2 | |
| P-140 | Critère `bac-a-sable` : écriture de test acceptée | appliqué autrement | AD-18 (aller-retour), manifeste (`verifications`) | Attribuée à `aller-retour`, dite explicitement. |
| P-147 | Prérequis en échec : connecteur rouge, dépendants orange | appliqué | AD-17 (santé) | Renvoi au moteur FR-34. |
| P-148 | QK-1 : toutes les versions d'Odoo | appliqué | AD-23, Deferred (XML-RPC) | Voir P-68. |
| P-154 | QK-7 : point de relais | appliqué | AD-20 | Voir P-103. |
| P-167 | QK-20 : compteurs | appliqué | AD-17, AD-31 | Voir P-63. |
| P-172 | A-5 : deux conditions confondues | appliqué | AD-3, AD-15 | Voir P-46. |
| P-177 | A-10 : bac à sable non lu par la Reprise | appliqué | AD-18 | Voir P-94. |
| P-178 | A-11 : identifiants et point de relais | appliqué | AD-20, AD-31 | Voir P-103, P-106. |
| P-couvertes | 154 puces couvertes, sans correction | appliqué | — | Aucune action ; AD-31 reste la table de référence. |
| I-1 | Changement refusé si file non vide ; identifiants effacés à l'arrêt | appliqué | AD-33, AD-3 | Gardée (D-45) ; remplacée par le protocole d'AD-33. |
| I-2 | Bail, fencing, reprises bornées | appliqué | AD-1, AD-35 | Gardée (D-45). |
| I-3 | Valeurs de rythme | appliqué | AD-7 (réglables par données), AD-35 | Gardées (D-45) ; 00 h 30 contestable dans la PR. |
| I-4 | Écart né hors de la nuit | appliqué autrement | AD-5 (« les écarts ne naissent que de la concordance »), AD-13 | Retirée (consigne A.3, D-24) ; remplacée par une règle de mise à jour. |
| I-5 | « Corriger et renvoyer » limité | appliqué | AD-9, AD-31 (PRD FR-7) | À confirmer par le PO (D-44). |
| I-6 | `DEGRADE` si Redis ; message de fermeture | appliqué | AD-17 | À confirmer par le PO (D-44). |
| I-7 | Rôle du DSI, délégation de `ecart:trancher` | appliqué | AD-27, AD-31 (C7) | Gardée (D-45). |
| I-8 | `numero`, outbox, `FIGE`, `A_VERIFIER` | appliqué | AD-3, AD-8 | Gardée (D-45). |
| I-9 | Écart rouvert par une correction refusée | appliqué | AD-14 | Gardée (D-45). |
| I-10 | AES-256-GCM, écriture seule, valeur témoin | appliqué | AD-22, AD-19, AD-26 | Gardée (D-45). |
| I-11 | Limites de l'enveloppe d'échange | appliqué | AD-10 | Gardée (D-45) ; source : spine de la Reprise. |

## Reconcile amont

| Id | Constat | Disposition | Où | Note |
|---|---|---|---|---|
| M-1 | Route des contrôles « seule Reprise » (C2, C13, §3.1) | appliqué | AD-10, AD-21 (matrice), AD-31 (C2, C13, §3.1, matrice-etats.json) | Consigne A.17 : deux identités selon l'état. |
| M-2 | « Le propriétaire a toujours raison » face à la décision humaine | appliqué | AD-14, Inherited (AD-P18), AD-31 (écosystème AD-P18) | Consigne A.7. |
| M-3 | Code de source `odoo:<connecteurId>` contre la Reprise AD-3 | appliqué | AD-5, AD-31 (Reprise AD-3, AD-7) | Consigne A.4. |
| M-4 | 43 manifestes et `reprise.manifest.ts` | appliqué | AD-31 (deux lignes `manifestes-a-produire.md`, `reprise.manifest.ts`) | |
| M-5 | Lecture seule : famille « échange entrant » | appliqué | AD-10, AD-21, AD-31 (FR-43, §3.1) | Consigne A.16. |
| M-6 | Configuration dans la console (FR-2, C8, FR-36) | appliqué | AD-28, AD-31 | |
| M-7 | `Adaptateur` et `AdaptateurEcriture` | appliqué | AD-23, AD-31 (Reprise AD-18) | Méthodes gardées et ajoutées nommées. |
| M-8 | Deux vocabulaires de résultat et d'écart | appliqué autrement | AD-10, AD-13, Conventions | Consigne C : résultats `APPLIQUE`/`INCHANGE`/`REJETE` gardés, différence dite ; écart `VALEUR_DE_CONTROLE_DIFFERENTE`. |
| M-9 | `domainesEchange.objets` et `objetsDeReprise` | appliqué | AD-2 (règles de manifeste), AD-31 (C1) | |
| M-10 | « Domaine » inconnu de la Reprise | appliqué | AD-31 (Reprise AD-20, AD-28 ; EPIC-143) | Association objet → domaine par le catalogue. |
| M-11 | `connecteurs.cession` contre `reprise.cession` | appliqué | AD-20, AD-29, AD-31 (moteur AD-12) | Retiré ; `reprise.cession` seul. |
| M-12 | Deux « écart nul » | appliqué | AD-3, AD-15, AD-31 (PRD Reprise FR-17) | Voir P-46. |
| M-13 | Ligne contrats d'AD-31 fausse | appliqué | AD-31 (C5) | Consigne C. |
| M-14 | Février : introduction, UJ-1, UJ-3, plan v3 | appliqué | AD-31 (deux lignes) | |
| M-15 | Lecture seule par droit natif | appliqué | AD-18, AD-31 | |
| M-16 | Alertes de Connecteurs et AD-40 ; modèles de notification | appliqué | AD-17, AD-31 (moteur AD-9, AD-40 ; `notification-service`) | |
| M-17 | Contenu de `prospera-plateforme` | appliqué | AD-31 (moteur AD-26, AD-15) | |
| M-18 | Correspondances au dossier : qui exporte | appliqué | AD-19 | |
| M-19 | Stock d'ouverture livré avant `EN_SERVICE` | appliqué autrement | AD-20, AD-31 (Reprise AD-11) | `stock` garde l'ajustement et le publie à la mise en service (D-26). |
| M-20 | Bibliothèque de masquage non placée | appliqué | AD-18, Structural Seed, AD-31 (moteur AD-26, AD-15) | Dans `prospera-plateforme`. |
| M-21 | Compteurs dans le signal | appliqué | Inherited (AD-9), AD-17, AD-31 (FR-26, EPIC-157) | |
| M-22 | EPIC-143 et EPIC-142 | appliqué | AD-31 | |
| M-23 | Adaptateurs `odoo` et `api` | appliqué | AD-31 (Reprise, Deferred) | `odoo` résolu ; `api` différé (QK-18), Deferred (IMF). |
| M-24 | Manifeste contre AD-27 | appliqué | AD-27, manifeste | Prérequis et routes alignés. |
| M-25 | `auth-service`, catalogue de plateforme | appliqué | AD-27, AD-31 | |
| M-26 | Coque AD-8, AD-14 | appliqué | AD-31 (deux lignes coque) | |
| M-27 | Précisions non listées (FR-2, 5, 9, 14, 20) | appliqué | AD-31 (ligne « précisions ») | |
| M-28 | Route de l'état publié ; interrupteur | appliqué | AD-25, AD-29, AD-31 (moteur AD-12, AD-17) | |
| M-29 | `LOT_TROP_GROS` pour l'échange | appliqué | AD-10, AD-12, Conventions (Erreurs) | `ECHANGE_TROP_GROS`. |
| M-30 | Héritages cités mais absents du tableau | appliqué | Inherited Invariants, `sources` | |
