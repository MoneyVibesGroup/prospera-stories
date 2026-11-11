# Disposition des constats de relecture — Spine du moteur d'installation

Date : 2026-11-11. Spine : `ARCHITECTURE-SPINE.md` (AD-1 → AD-42). Décisions du PO prises en compte : D-1 → D-11, Q-1 → Q-11 (`.memlog.md`).

Légende du traitement : **appliqué** (corrigé dans la spine, avec l'AD ou la section) ; **fusionné** (même cause qu'un autre constat, traité là) ; **rejeté** (écarté, avec la raison) ; **renvoyé** (à changer dans un autre document, voir « Demandes ailleurs »).

**Totaux : 133 constats** (appliqués 115, fusionnés 14, rejetés 1, renvoyés 3).

| Rapport | Constats | Appliqués | Fusionnés | Rejetés | Renvoyés |
|---|---|---|---|---|---|
| prd (réconciliation PRD) | 36 | 36 | 0 | 0 | 0 |
| contrat-code (réconciliation contrat et code) | 35 | 19 | 13 | 1 | 2 |
| rubric (grille de la bonne spine) | 30 | 30 | 0 | 0 | 0 |
| versions (versions et réalité technique) | 12 | 11 | 0 | 0 | 1 |
| adversaire | 20 | 19 | 1 | 0 | 0 |

Les sections de synthèse des rapports (« Verdict », « Ce que la spine tient bien », « Réponses à la grille », « Synthèse par exigence ») ne contiennent pas de constat propre et ne sont pas comptées. Le rapport « contrat-code » compte ses 18 constats numérotés (E-01 → E-18), les 10 lignes du tableau « Partie 2 » (T-1 → T-10) et les 7 dépendances de la « Partie 3 » (P3-1 → P3-7). Le rapport « adversaire » compte ses 16 paires et ses 4 écarts transversaux (X-1 → X-4). Le rapport « versions » compte ses 7 corrections demandées (V-1 → V-7) et 5 constats des points détaillés (V-8 → V-12).

## Tableau des constats

| Rapport | Id | Résumé | Traitement |
|---|---|---|---|
| prd | E-01 | Chemin rapide du correctif de sécurité (72 h) absent | appliqué → AD-31 |
| prd | E-02 | VERSION_FIGEE, fin de maintenance 3 ans, fenêtre N-1, alerte DG à 90 j sans mécanisme | appliqué → AD-30 ; distinction avec la compatibilité d'agent dans AD-3 |
| prd | E-03 | Aucun contrat nommé pour les faits agent → partie A ni pour les commandes DSI → agent ; gel rangé à tort parmi les tâches de la partie A | appliqué → AD-17 (`instance.etat.change`, commandes), AD-37, AD-6 et AD-9 (le gel est un fait de l'agent) |
| prd | E-04 | Règles discrètes de licence perdues (autre instance, toutes clés confondues, fichier d'urgence, validité d'un abonné, composition de l'état de confiance) | appliqué → AD-8, AD-7, AD-4 (composition) |
| prd | E-05 | Rétablissement de l'état de confiance après perte du serveur absent | appliqué → AD-35 (fichier de rétablissement, Q-4) |
| prd | E-06 | `apprentissage-service` sans lien vers la centrale, mais le refus sur recul doit l'atteindre | appliqué → AD-14 (jeton d'export signé, vérifié hors ligne), AD-9 |
| prd | E-07 | Essai prospect FR-33 : propriétaire, avis, effacement, certificat, rétention sans contrat | appliqué → AD-38, AD-16 (rétention), AD-6 |
| prd | E-08 | FR-24 : la carte renvoie à une règle absente d'AD-11 | appliqué → AD-39, AD-11, Conventions (test d'empreinte) |
| prd | E-09 | Plateforme : garde du registre, compte de service IA, journal des lectures d'exploitation absents | appliqué → AD-13, AD-12 |
| prd | E-10 | Export de niveau 1 : double approbation, purge de 30 jours, table de correspondance, clause du contrat | appliqué → AD-14, AD-13 |
| prd | E-11 | Contradictions sur qui exécute les exceptions de NFR-3 et sur ce qui diffère pour la plateforme | appliqué → AD-15, AD-19 (sept points), AD-2 |
| prd | E-12 | Livraison de la licence par e-mail et alerte J-7 absentes | appliqué → AD-25, AD-17 |
| prd | E-13 | Date limite d'interrupteur et « une seule version ouverte » absentes | appliqué → AD-6, AD-32, Conventions (test éteint/allumé) |
| prd | E-14 | Vagues et incidents sans règle ni remontée | appliqué → AD-32, AD-9 (incidents au signal) |
| prd | E-15 | Le retour arrière par relance retire le correctif de sécurité | appliqué → AD-11 (niveau de correctif courant), AD-31 |
| prd | E-16 | NFR-9 (15 min d'interruption) non traité | appliqué → AD-11, AD-40 |
| prd | E-17 | NFR-5 et SM-7 sans mécanisme ; installation logique contre profil Compose | appliqué → AD-2, AD-11 (préchargement), AD-23 (étapes horodatées), AD-40 |
| prd | E-18 | SM-3 (sonde) et SM-6 (garde C6) sans mécanisme | appliqué → AD-10 (sonde), AD-40, Conventions (tests) |
| prd | E-19 | Supervision réduite à trois colonnes | appliqué → AD-9 (contenu du signal) |
| prd | E-20 | Compteurs de Connecteurs dans la vérification quotidienne sur site (FR-26 contre A-4) | appliqué → AD-9 ; alignement d'A-4 renvoyé (voir Demandes ailleurs) |
| prd | E-21 | Gel à 7 jours au niveau `LOGICIEL` non amendé au PRD ; TPM exigé contre « sinon `LOGICIEL` » | appliqué → AD-4 (le TPM est un niveau, pas un refus), AD-9 ; amendement du PRD renvoyé (Q-5) |
| prd | E-22 | Journal chaîné contre pseudonymisation | appliqué → AD-12 (pseudonyme stable, table hors chaîne) |
| prd | E-23 | Règles discrètes du rafraîchissement masqué (FR-10) | appliqué → AD-15 |
| prd | E-24 | Essai : liste blanche des sorties, aucun identifiant d'écriture du réel | appliqué → AD-10, AD-2 (liste blanche à la partie A) |
| prd | E-25 | Point de décision unique et chemins 0 à 6 sans AD ; codes d'erreur manquants | appliqué → AD-23, Conventions (codes) |
| prd | E-26 | Gel : ce qu'il bloque et laisse passer ; définition du contact | appliqué → AD-9 (contact, gel), AD-1 (correctif critique par fichier) |
| prd | E-27 | Bilan d'instance de FR-25 non défini | appliqué → AD-10 (montage et bilan) |
| prd | E-28 | Sauvegardes : RTO, paliers, clé d'exploitation, copie hors machine de la plateforme | appliqué → AD-16 |
| prd | E-29 | Support : comptes Money Vibes liés au tunnel | appliqué → AD-20 (ouverture distincte) |
| prd | E-30 | Ancrage logiciel : second support contre « exclu des sauvegardes » ; usure du compteur NV | appliqué → AD-4 (volume dédié, miroir, granularité), AD-16 |
| prd | E-31 | Agent dans le socle de chaque projet contre hors des projets | appliqué → AD-10 (projet `<instance>-agent`), AD-3, AD-34 |
| prd | E-32 | Tests oubliés des conventions | appliqué → Conventions (Tests) |
| prd | E-33 | Jalons : démo du 15/01 contre février ; ordre de sacrifice | appliqué → AD-41 |
| prd | E-34 | Droit de consentir réservé au DG : lieu du refus, identité du DG | appliqué → AD-13, AD-22 (DG enregistré dans l'état voulu) |
| prd | E-35 | Avenant automatique et installation de la dépendance par le plan de mise à jour | appliqué → AD-11 (plan), AD-23 |
| prd | E-36 | Registre des consentements lu par la console : pas de chemin | appliqué → AD-13, AD-17 |
| contrat-code | E-01 | Les gardes lisent `entitlement.changed` et ferment à l'échéance ; le contrat veut un préavis ouvert | appliqué → AD-24 (source unique, double lecture) |
| contrat-code | E-02 | Suppression des chemins d'octroi et réamorçage non dits | appliqué → AD-23 (bascule) |
| contrat-code | E-03 | P10 « mono-repo » fausse : 19 dépôts, pas de CI, `packages/` inexistant | appliqué → AD-26 (Q-1), AD-42 |
| contrat-code | E-04 | Registre de schémas invoqué sans fournisseur ; correction proposée : schémas JSON au build, sans registre en instance | rejeté : Q-10 du PO impose un registre dans le socle de chaque espace (Karapace) ; la compatibilité en CI est tenue (AD-27) |
| contrat-code | E-05 | BullMQ et Redis absents du catalogue ; `terme.ts` calcule à la lecture ; périmètre des échéances | appliqué → AD-6 (Q-6), AD-42 |
| contrat-code | E-06 | `auth-service` sans route d'organisation à identifiant imposé ; identité des utilisateurs entre espaces | appliqué → AD-15 (Q-7), AD-42 (story avant la semaine 5) |
| contrat-code | E-07 | Format de droit sans tiret ; `binds` sans C1, C2, C7, C9, C11 | appliqué → AD-42, frontmatter `binds` |
| contrat-code | E-08 | État publié de la coque ni défini ni attribué (champs, propriétaire des deux fichiers, `droitsEffectifs`, route, date) | appliqué → AD-24, AD-17 |
| contrat-code | E-09 | Cinq services ajustés ; consommateur d'impayé dans le catalogue ; topics `paiement.abonnement.*` | appliqué → AD-17, AD-42, AD-23 ; liste par service renvoyée au plan (Demandes ailleurs) |
| contrat-code | E-10 | Paiement vers licence : aucun contrat nommé | appliqué → AD-25, AD-17 |
| contrat-code | E-11 | AD-P16 citée à contre-emploi | appliqué → AD-13, AD-14 (compte de service du contrat C11) |
| contrat-code | E-12 | Agent et socle : écart interne | fusionné avec prd E-31 → AD-10, AD-34 |
| contrat-code | E-13 | Trois graphies de l'identifiant ; convention de topics non tenue | appliqué → AD-27 (graphie), Conventions (Nommage) |
| contrat-code | E-14 | Node 24 contre Node 20 partout | appliqué → AD-42 (Q-8) ; l'alternative « rester sur Node 20 » est écartée par Q-8 |
| contrat-code | E-15 | Ordre de sacrifice : éléments dégradables rangés en « jamais » | appliqué → AD-41 |
| contrat-code | E-16 | Compose de dev : pas de Traefik, ports publiés, `TRUSTED_PROXIES`, trois Mongo, ports non assignés | appliqué → AD-10, Conventions (ports de dev), AD-42 |
| contrat-code | E-17 | `binds` incomplet ; aucun AD pour la partie A | appliqué → AD-23, frontmatter `binds` |
| contrat-code | E-18 | « NestJS 12 d'un coup » contredit par `@nestjs/bullmq` 12 déjà dans paiement | appliqué → Deferred (ligne reformulée), AD-42 |
| contrat-code | T-1 | Partie 2 n°1 : outbox à `setInterval`, BullMQ absent (5 à 8 points) | fusionné avec E-05 → AD-42 |
| contrat-code | T-2 | Partie 2 n°2 : Mongo en réplica à un nœud déjà en place | fusionné avec E-16 → AD-10 (gabarit) |
| contrat-code | T-3 | Partie 2 n°3 : statuts et `echeanceLe` fermant, migration des gardes de cinq services | fusionné avec E-01 → AD-24 |
| contrat-code | T-4 | Partie 2 n°4 : topics existants, sémantique de `echeanceLe` | fusionné avec E-01 et E-09 → AD-24, AD-17 |
| contrat-code | T-5 | Partie 2 n°5 : `auth-service`, 8 à 13 points, semaine 5 | fusionné avec E-06 → AD-42 |
| contrat-code | T-6 | Partie 2 n°6 : format de droit sans tiret | fusionné avec E-07 → AD-42 |
| contrat-code | T-7 | Partie 2 n°7 : paiement n'appelle pas le catalogue ; read-model de manifestes dans la vente | fusionné avec E-10 → AD-25 ; read-model de manifestes dans `paiement-service` renvoyé (Demandes ailleurs) |
| contrat-code | T-8 | Partie 2 n°8 : 19 dépôts, pas de CI, cosign et registre sans lieu | fusionné avec E-03 et E-04 → AD-26, AD-36 |
| contrat-code | T-9 | Partie 2 n°9 : Node 20 contre Node 24 | fusionné avec E-14 → AD-42 |
| contrat-code | T-10 | Partie 2 n°10 : Compose sans Traefik, ports publiés, NFR-5 | fusionné avec E-16 → AD-10, AD-40 |
| contrat-code | P3-1 | Partie 3 n°1 : route de naissance et format de droit à placer en semaine 5 | fusionné avec E-06 et E-07 → AD-42 ; déplacement dans le plan renvoyé |
| contrat-code | P3-2 | Partie 3 n°2 : doublure de la coque sans date côté moteur | fusionné avec E-08 → AD-24 (dates) |
| contrat-code | P3-3 | Partie 3 n°3 : manifeste au nouveau format dès la semaine 1, sans schéma ni garde | appliqué → AD-23 (schéma de C1 amendé, garde de comparaison) |
| contrat-code | P3-4 | Partie 3 n°4 : charge des services neufs (~39 points) non isolée dans le plan | renvoyé : amendement du plan v3 §5 |
| contrat-code | P3-5 | Partie 3 n°5 : infrastructures sans propriétaire (registre d'images, cérémonie, CA, second hôte, TPM, pipeline) | appliqué → AD-28, AD-29, AD-26, AD-36 (propriétaires et lieux) ; approvisionnement et dates renvoyés au plan |
| contrat-code | P3-6 | Partie 3 n°6 : validation juridique ; questions au PO du 13/11 (Q3 du contrat, FR-42/43, NFR-11, C12/C13, couverture de la charge) | renvoyé : PO / PRD moteur ; la validation juridique reste au Deferred |
| contrat-code | P3-7 | Partie 3 n°7 : recette croisée des deux modes d'hébergement sans story | appliqué → AD-41 (squelette ambulant) ; story de recette renvoyée au plan |
| rubric | C-1 | Garde des clés privées et de la clé racine non décidée | appliqué → AD-28 (Q-2) |
| rubric | C-2 | Agent root sans durcissement décidé | appliqué → AD-36 |
| rubric | C-3 | Panne de la centrale : aucune enveloppe, ni sauvegarde, ni règle de non-gel | appliqué → AD-35 (Q-3) ; l'hôte de secours à chaud est écarté par Q-3 et mis au Deferred |
| rubric | C-4 | Rétablissement de l'état de confiance après sinistre ; contradiction AD-4 / AD-16 | appliqué → AD-35 (Q-4), AD-4, AD-16 |
| rubric | C-5 | Formats des artefacts signés et du protocole de contact non fixés ; `packages/contrats-moteur` proposé | appliqué → AD-26, AD-22, AD-17 ; le lieu est `prospera-plateforme/contrats` (Q-1) et non un paquet de mono-dépôt |
| rubric | C-6 | Certificats mTLS : autorité, amorçage, révocation | appliqué → AD-29 |
| rubric | H-1 | NFR-5 et NFR-9 sans décision | appliqué → AD-11, AD-40 |
| rubric | H-2 | Migrations : mécanisme d'exécution non fixé | appliqué → AD-33 |
| rubric | H-3 | Magasin de l'agent et montée de version de l'agent | appliqué → AD-34, AD-3 |
| rubric | H-4 | Agent et Kafka des espaces : raccordement, tampon, ordre de la chaîne | appliqué → AD-34, AD-12 |
| rubric | H-5 | Réseau d'entreprise : proxy, inspection TLS, accès au registre | appliqué → AD-9, AD-10, Conventions (test registre indisponible) |
| rubric | H-6 | Marque `[ADOPTED]` illégitime sur AD-16 ; AD-9 et AD-20 à aligner | appliqué → marque retirée d'AD-16 ; AD-9 et AD-20 marquées (D-8) ; AD-5, AD-8, AD-13, AD-14, AD-15, AD-19 non marquées |
| rubric | H-7 | Pas de tranche de départ vérifiable | appliqué → AD-41 |
| rubric | M-1 | AD-5 ambigu | appliqué → AD-5 (trois règles testables) |
| rubric | M-2 | « Finalité » indéfinie ; fraîcheur de la copie | appliqué → AD-13, AD-26 |
| rubric | M-3 | Observabilité non décidée | appliqué → AD-40 ; SLO chiffrés et traces au Deferred |
| rubric | M-4 | AD-19 et AD-15 : règles composées, non vérifiables | appliqué → AD-19 (test), AD-15 |
| rubric | M-5 | Environnements, canari, pré-production | appliqué → AD-32, spine « Environnements » (clés par environnement, AD-28) |
| rubric | M-6 | Stratégie de tests incomplète | appliqué → Conventions (Tests) |
| rubric | M-7 | Chaîne d'approvisionnement : builds reproductibles, SBOM, analyse | appliqué → AD-36 (SBOM, analyse bloquante) ; builds reproductibles au Deferred |
| rubric | M-8 | Chemin du niveau 1 vers `apprentissage-service` | appliqué → AD-14 |
| rubric | M-9 | Droits de l'identité de service | appliqué → AD-15 |
| rubric | M-10 | Rétention du journal et de l'état à la fin du contrat | appliqué → AD-12 (rétention), AD-38 |
| rubric | B-1 | Outil du tunnel : exigence réseau | appliqué → AD-20, AD-9 (443 sortant) |
| rubric | B-2 | Cohérence Mongo et MinIO | appliqué → AD-16 |
| rubric | B-3 | Justification dans le paradigme (GitOps, Odoo) | appliqué → paradigme et frontmatter épurés ; la raison reste au memlog |
| rubric | B-4 | Gel mêlé à AD-4 | appliqué → AD-9 (règle du gel en une place), AD-4 |
| rubric | B-5 | `tpm2-tools` en conteneur : périphérique et droits | appliqué → AD-36 |
| rubric | B-6 | Message externe d'un refus de signature | appliqué → Conventions (Erreurs), AD-22 |
| rubric | B-7 | Diagramme 1 : flèche vers les services et registre absent | appliqué → diagramme de dépendances (moteur Docker, registre) |
| versions | V-1 | Stack : ajouter Redis, Kafka, MinIO ; Node 24 et BullMQ 6 au-dessus du socle | appliqué → Stack, AD-42 |
| versions | V-2 | MongoDB 7.0 : fin de vie 31/08/2027, décider 8.0 | appliqué → AD-42 (Q-11), Stack |
| versions | V-3 | kafkajs non maintenu | appliqué → AD-27 (Q-9), AD-42 |
| versions | V-4 | dockerode contre Compose : binaire `docker compose` | appliqué → AD-10, Stack |
| versions | V-5 | cosign v3 : pas de `--offline`, bundle, `--insecure-ignore-tlog`, chaîne = code de l'agent | appliqué → AD-7 |
| versions | V-6 | `TPM2_Clear` : `reset_count`, `restart_count`, `safe` | appliqué → AD-4 |
| versions | V-7 | Ne pas écrire que le TPM physique est courant (HPE le vend en option) | appliqué → AD-4, Structural Seed (« recommandé ») |
| versions | V-8 | Node : 24 plus récent que le socle ; Node 26 LTS depuis le 28/10/2026 | appliqué → AD-42 (Q-8), Stack, Deferred |
| versions | V-9 | BullMQ : montée 5 → 6 non mentionnée | appliqué → AD-42, Stack |
| versions | V-10 | jose / Ed25519 non rejoué par un test | appliqué → AD-26 (vecteurs signés) |
| versions | V-11 | Oplog : taille de la fenêtre, outil PIT | appliqué → AD-16 (dimensionnement) ; outil au Deferred |
| versions | V-12 | Le memlog écrit « vérifié » pour le vTPM : trop fort | renvoyé : `.memlog.md` (ligne `(version)` du 2026-11-11) |
| adversaire | 1 | Horloge des deux espaces, échéances locales à un Redis, `GET /heure` sans identifiant | appliqué → AD-6, AD-21 |
| adversaire | 2 | Deux parties A sur un topic `etat-publie.changed` unique | appliqué → AD-24, AD-17 (un topic par espace) |
| adversaire | 3 | Licence reçue pendant une installation ou un gel : ni accusé, ni rejeu, ni ordre | appliqué → AD-8 |
| adversaire | 4 | État voulu sans schéma, sans révision, retour arrière imposé | appliqué → AD-22 |
| adversaire | 5 | Deux sources d'échéance pour un client hébergé | appliqué → AD-19, AD-25 |
| adversaire | 6 | Migrations de la partie A au démarrage ; module installé pendant une promotion | appliqué → AD-33, AD-23 |
| adversaire | 7 | Auto-mise à jour de l'agent pendant une promotion : deux agents | appliqué → AD-3 |
| adversaire | 8 | Deux formes d'entrée sur `instance.journal` | appliqué → AD-12 (enveloppe, JCS) |
| adversaire | 9 | Retrait de consentement entre deux contacts | appliqué → AD-13 |
| adversaire | 10 | Rafraîchissement et essai prospect : deux chemins de mutation | appliqué → AD-15 |
| adversaire | 11 | Gel à 7 jours contre alerte à 7 jours ; changement de niveau en cours de silence | appliqué → AD-4, AD-9 ; l'alerte vaut `min(7 jours, moitié du seuil)` au lieu de toujours la moitié, pour garder le J+7 du PRD au niveau `TPM` |
| adversaire | 12 | Sauvegarde, `AVEC_PERTE` et `eventId` réutilisés | appliqué → AD-16 (`epoque`, choix de la sauvegarde), AD-11 |
| adversaire | 13 | `GET /heure` injoignable : une équipe suspend, l'autre prend l'horloge système | appliqué → AD-6 (`HORLOGE_INDISPONIBLE`) |
| adversaire | 14 | Jumeau de VM : bifurcation non détectée | appliqué → AD-4 (chaîne d'empreintes, bifurcation), AD-29 |
| adversaire | 15 | Partition `instanceId` des topics `instance.*` | appliqué → AD-27, Conventions (Événements) |
| adversaire | 16 | Sanction portée par la licence suivante qui n'arrive pas | appliqué → AD-8, AD-25 (licence dans la minute) |
| adversaire | X-1 | Propriétaire de la configuration Traefik par espace | fusionné avec n°6 → AD-10 (liste tenue par la partie A, routage déduit par l'agent) |
| adversaire | X-2 | « Chaque unité a sa base » alors que la partie A existe deux fois | appliqué → AD-2 (une base par espace) |
| adversaire | X-3 | Garde : `entitlement.changed` et `etat-publie` dans l'ordre inverse | appliqué → AD-24 (état publié seul) |
| adversaire | X-4 | Contrat d'erreur partagé pour l'état voulu refusé | appliqué → AD-22, Conventions (Erreurs) |

## Demandes ailleurs

Une ligne par changement hors de la spine. Rien de ce qui suit n'a été modifié par ce travail.

| Fichier | Changement exact |
|---|---|
| `prds/prd-moteur-installation-2026-11-09/prd.md`, FR-15 et §3 (délai de silence, gel) | Écrire : gel à 30 jours de silence au niveau `TPM`, à 7 jours au niveau `LOGICIEL` (décision Q-5) ; alerte au DSI et à Money Vibes à `min(7 jours, moitié du seuil)` |
| `prd.md`, NFR-10 | Le TPM 2.0 physique est recommandé, son absence donne le niveau `LOGICIEL` et n'est pas un motif de refus du montage ; noter qu'il est une option payante chez certains constructeurs |
| `prd.md`, NFR-11 et §3 (état de confiance) | Ajouter la détection de `TPM2_Clear`, le compteur d'empreinte (recul, bifurcation, lacune) et l'époque ; le ré-ancrage par fichier de rétablissement (Q-4) |
| `prd.md`, NFR-7 | Ajouter : remise en route 4 h de la centrale, copie hors machine croisée entre l'hôte de la plateforme et celui du poste central, rétention par défaut 7 quotidiennes, 4 hebdomadaires, 3 mensuelles aussi sur site |
| `prd.md`, FR-19 | Préciser : après 72 heures le correctif s'applique seul (un report unique de 7 jours au plus) ; le « téléphone » est un ticket d'appel de Money Vibes |
| `prd.md`, FR-35 | Préciser que le DG de l'organisation est l'identité enregistrée à la signature et transmise à l'agent dans l'état voulu |
| `prd.md`, FR-33 et FR-32 | Le certificat d'effacement porte la date d'expiration de la dernière sauvegarde contenant les données, calculée sur la rétention de NFR-7 |
| `prd.md`, §8.2 (NOTE FOR PM) | Marquer l'ancrage et le découpage comme tranchés par la spine (AD-2, AD-4) |
| `prds/prd-moteur-installation-2026-11-09/addendum.md`, A-4 | Aligner la vérification quotidienne sur FR-26 : ajouter les compteurs de Connecteurs sur site, le compteur et l'empreinte précédente, `versionProtocole` et le niveau d'ancrage |
| `addendum.md`, A-1 | Ligne du gel : 30 jours au niveau `TPM`, 7 jours au niveau `LOGICIEL` ; ligne du correctif : départ de l'horloge de 72 h = client prévenu |
| `prds/prd-reprise-donnees-2026-11-10` (OQ-1) | Dépôt de la bibliothèque : `prospera-adaptateurs` (paquet npm privé), non `packages/adaptateurs` ; routes d'export, d'import et d'effacement C13 consommées par la partie A |
| `prds/prd-connecteurs-2026-11-10` (QK-15, QK-16, QK-19) | Même dépôt `prospera-adaptateurs` ; compteurs remontés aussi par la vérification quotidienne sur site |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C1 | Ajouter au schéma de `ModuleVersion` les champs du manifeste (dépendances, droits, événements, vérifications, `retourArriere`, interrupteurs, routes de lecture seule, migrations, schémas d'événements) |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C2 | Écrire que la garde lit l'état publié seul ; `entitlement.changed` ne sert plus à fermer et `echeanceLe` n'est plus lu pour décider ; un état publié par espace |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C5 | Une seule graphie `organisationId` pour les nouveaux contrats ; l'existant garde la sienne, un renommage passe par un topic `@2` |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C7 | Élargir le format de droit aux codes de module à tiret |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C10 | Le socle d'espace inclut le registre de schémas, Redis et MinIO ; l'agent est dans son propre projet `<instance>-agent`, hors profils |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C11 §5 | Compte de service IA de la plateforme, garde du registre (`CONSENTEMENT_ABSENT`), journal des lectures d'exploitation ; remplace la référence à AD-P16 pour l'apprentissage |
| `CONTRAT-DE-MODULE-2026-11-09.md`, C13 | Nommer les routes d'export, d'import, d'effacement et de vérification ; un point d'entrée `migrer` idempotent déclaré au manifeste (C12) |
| `architecture-prospera-ecosystem-2026-07-04.md`, P9 | Le registre est Karapace 6.2, dans le socle de chaque espace, compatibilité BACKWARD en CI (Q-10) |
| `architecture-prospera-ecosystem-2026-07-04.md`, P10 | Corriger : 19 dépôts git, pas de mono-dépôt ; ajouter `prospera-plateforme` et `prospera-adaptateurs` (Q-1) |
| `architecture-prospera-ecosystem-2026-07-04.md`, nouvelle AD-P18 | « Autorité métier extérieure » (D-11) |
| `architecture-prospera-ecosystem-2026-07-04.md`, client Kafka et versions | `@confluentinc/kafka-javascript` à la place de `kafkajs` (Q-9) ; Node 24 (Q-8) ; MongoDB 8.0 (Q-11) |
| `architecture-prospera-ecosystem-2026-07-04.md`, AD-P16 | Préciser : routes de lecture inaccessibles sur site hors tunnel ouvert, jamais utilisées pour l'apprentissage |
| `amendement-plan-v3-2026-11-10.md`, §5 (charge) | Ajouter ≈ 39 points de socle (centrale, agent, apprentissage) plus l'infrastructure (registre d'images, CA, cérémonie des clés, second hôte, TPM, second support) et les stories d'alignement ; l'écart de 7 à 10 semaines s'aggrave |
| `amendement-plan-v3-2026-11-10.md`, §4 | Placer la story `auth-service` (route de naissance à identifiant imposé, format de droit élargi) **avant la semaine 5**, pas « avant le premier module à tiret » ; ajouter les ajustements par service (catalogue, paiement, microfinance, bilan, notification, balance) avec leur semaine |
| `amendement-plan-v3-2026-11-10.md`, §6 | Ajouter la tranche de départ (AD-41) et la recette croisée des deux modes d'hébergement |
| `architecture/architecture-prospera-app-2026-11-10/ARCHITECTURE-SPINE.md`, AD-5, AD-15, AD-23 | Les fichiers `contrat/etat-publie.openapi.json` et `contrat/matrice-etats.json` appartiennent à `platform-catalog-service` ; un état publié et un topic par espace ; vraie route avant le 15/01/2027, doublure éteinte au premier gate |
| `architecture/architecture-prospera-app-2026-11-10/ARCHITECTURE-SPINE.md`, AD-6 | `droitsEffectifs` est calculé par intersection des droits du jeton de l'appelant avec l'état des modules |
| `.memlog.md` de ce dossier | Consigner les raisons des AD-21 → AD-42 (SQLite pour l'agent, un Mongo par espace, deux dépôts neufs, alerte `min(7 j, moitié)`, copie hors machine croisée) ; corriger la ligne « vérifié » sur le vTPM (V-12) ; ajouter D-12 et suivantes pour les choix de l'architecte non validés |
| Stories à créer avant S5 (backlog `prospera-stories`) | `auth-service` : route de naissance à identifiant imposé et format de droit élargi ; catalogue : Redis et BullMQ, verrou de l'outbox, champs de manifeste de `ModuleVersion`, retrait des quatre chemins d'octroi et réamorçage ; double lecture de l'état publié dans les gardes de paiement, microfinance, bilan, notification et balance ; `prospera-plateforme` : dépôt, CI de publication, contrats et vecteurs signés ; socle d'espace : Karapace, MongoDB 8.0, Node 24 ; migration de `kafkajs` vers `@confluentinc/kafka-javascript` dans la version 1.0 ; `paiement-service` : contrat consommé par la centrale et read-model de manifestes pour la vente |

## Contrôle ciblé du 2026-11-11

Entrées : `reviews/controle-cible.md` (6 constats partiels P-1 → P-5 au total, 13 contradictions C-1 → C-13, 20 choix N-1 → N-20) et les décisions du PO **D-12 → D-15** (`.memlog.md`), qui priment sur le reste. Spine passée à `status: final`. Aucun TPM en v1 : les lignes de « Demandes ailleurs » qui parlent d'un gel à 7 jours au niveau `LOGICIEL`, d'une alerte `min(7 jours, moitié du seuil)` ou d'un TPM « recommandé » sont remplacées par : gel à **30 jours pour toutes les instances**, alerte à **J+7**, aucun TPM exigé ni utilisé en v1 (niveau `TPM` et gel différencié au Deferred).

**Décisions** : D-12 (pas de TPM en v1, un niveau `LOGICIEL`, gel unique à 30 jours, clé du SQLite sur le second support) → AD-4, AD-5, AD-9, AD-10, AD-29, AD-34, AD-35, AD-36, Stack, Structural Seed, Deferred. D-13 (faits de paiement par l'agent de la plateforme) → diagramme 1, AD-25, AD-17, AD-19. D-14 (clé d'exécution de la centrale, clés de CI) → AD-28, AD-7, AD-25. D-15 (N-1 → N-20 validés) → marque `[ADOPTED]` ajoutée à AD-16, AD-21, AD-22, AD-29, AD-34, AD-36, AD-37, AD-41, gardée sur AD-9 et AD-35.

| Id | Traitement |
|---|---|
| P-1 | appliqué → AD-28 (deux familles de clés, usage dans le certificat), AD-7 |
| P-2 | appliqué → AD-35 (compteur à `dernier + 1`, jeton d'enrôlement), AD-17 |
| P-3 | appliqué → AD-17 (`abonnement.contrat.signe`), AD-13 |
| P-4 | appliqué → AD-19 (partie A consomme `.impayee` et `.regularise` pour un hébergé), AD-42 (ligne limitée au site), AD-17 |
| P-5 | appliqué → AD-15, AD-17 (`instance.espace.ordre.donne` et `.execute`) |
| C-1 | appliqué par D-12 → AD-4 (plus de TPM en v1), config minimale ; amendement de NFR-10 renvoyé au PRD |
| C-2 | appliqué → AD-4 (compteur logiciel incrémenté à chaque contact préparé, empreinte calculée à cet incrément, reprise du même couple) |
| C-3 | appliqué → AD-1, AD-7, AD-22, AD-26 (la sanction n'a que la licence), Design Paradigm, Structural Seed |
| C-4 | appliqué → AD-17 (route interne et `identity.org.created`, ordre de naissance, envois de notification, approbation d'export, jeton d'enrôlement, fichiers de rétablissement et de prolongation, résultat de commande, état voulu et signal, relais de paiement, registre, ordres) |
| C-5 | appliqué → AD-36 (répartition exécuteur et contact), AD-6, AD-17 |
| C-6 | appliqué → AD-22 (`agentCible` dans l'en-tête protégé), AD-26, AD-3 |
| C-7 | appliqué → AD-37 (`module.installer`, `module.retirer`, `espace.rafraichir`), AD-2, AD-15, AD-17 |
| C-8 | appliqué → AD-10 (un Traefik par instance, projet de l'agent), diagramme 2 |
| C-9 | appliqué par D-13 → diagramme 1 et sa phrase, AD-25, AD-17 |
| C-10 | appliqué → AD-31 (figée : critique ; gel : par fichier) |
| C-11 | appliqué → `instance.etat.modifie`, `reprise.feu-vert.donne`, tolérance explicite des flux (`instance.journal`, `instance.indicateurs`) dans Conventions ; AD-17 à jour |
| C-12 | appliqué → AD-37 (jeton de l'appelant, DG de l'état voulu) |
| C-13 | appliqué → AD-14, AD-22 (`approbationsExport`), AD-17 |
| N-1 | validé (D-15) → AD-9, AD-35 gardent `[ADOPTED]` ; alerte ramenée à J+7 par D-12 |
| N-2 | validé en partie, remplacé par D-12 → AD-4 (TPM, `TPM2_Clear` et incrément NV retirés ; recul et bifurcation gardés) |
| N-3 | validé → AD-3 (`[ADOPTED]` gardé) |
| N-4 | validé → AD-6 (`[ADOPTED]` gardé) |
| N-5 | validé → AD-10 (`[ADOPTED]` gardé) |
| N-6 | validé → AD-12 (`[ADOPTED]` gardé) |
| N-7 | validé → AD-13 |
| N-8 | validé → AD-14 |
| N-9 | validé → AD-16 (`[ADOPTED]` ajouté) |
| N-10 | validé → AD-20 (`[ADOPTED]` gardé) |
| N-11 | validé → AD-21 (`[ADOPTED]` ajouté) |
| N-12 | validé → AD-22 (`[ADOPTED]` ajouté) |
| N-13 | validé → AD-26 (`[ADOPTED]` gardé) |
| N-14 | validé → AD-27 (`[ADOPTED]` gardé) |
| N-15 | validé → AD-29 (`[ADOPTED]` ajouté) |
| N-16 | validé → AD-34 (`[ADOPTED]` ajouté ; clé du SQLite sur le second support, niveau plus faible dit dans la supervision) |
| N-17 | validé → AD-36 (`[ADOPTED]` ajouté) |
| N-18 | validé → AD-37 (`[ADOPTED]` ajouté) |
| N-19 | validé → AD-41 (`[ADOPTED]` ajouté) |
| N-20 | validé → AD-42 (`[ADOPTED]` gardé) |
