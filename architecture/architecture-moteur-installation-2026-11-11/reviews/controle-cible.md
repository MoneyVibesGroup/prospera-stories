# Contrôle ciblé de la spine réécrite — Moteur d'installation

Date : 2026-11-11. Spine : `ARCHITECTURE-SPINE.md` (AD-1 → AD-42). Entrées : `reviews/disposition.md`, les cinq rapports, `.memlog.md` (D-1 → D-11, Q-1 → Q-11). Aucun fichier modifié hors celui-ci.

**Bilan** : constats graves examinés 42 (prd E-01 → E-11 ; contrat-code E-01 → E-10 ; rubric C-1 → C-6 et H-1 → H-7 ; adversaire B des paires 1, 2, 3, 4, 5, 6, 9, 12), plus les 7 corrections des versions (V-1 → V-7, sans gravité chiffrée) : **36 fermés, 6 partiels, 0 non fermé** (les 7 corrections des versions sont fermées) ; **13 contradictions ou trous de contrat introduits ou laissés** ; **20 choix non validés** (choix de l'architecte).

## 1. Les constats graves sont-ils fermés ?

Fermé = la Rule empêche le défaut décrit. Les lignes « fermé » sont en bloc ; les écarts sont détaillés après le tableau.

| Rapport | Constats | AD cités | Verdict |
|---|---|---|---|
| prd | E-01 (correctif 72 h) | AD-31 | fermé |
| prd | E-02 (version figée, N-1, 90 j) | AD-30, AD-3 | fermé |
| prd | E-03 (contrats faits agent et commandes) | AD-17, AD-37, AD-6, AD-9 | fermé (voir contradiction C-9 sur le contenu des commandes) |
| prd | E-04 (règles de licence) | AD-8, AD-7, AD-4 | fermé |
| prd | E-05 (rétablissement) | AD-35 | **partiel** (P-2) |
| prd | E-06 (apprentissage et recul) | AD-14, AD-9 | fermé |
| prd | E-07 (essai prospect) | AD-38, AD-16 | fermé |
| prd | E-08 (IA intouchable) | AD-39 | fermé |
| prd | E-09 (garde du registre, plateforme) | AD-13, AD-12 | **partiel** (P-3) |
| prd | E-10 (export niveau 1) | AD-14, AD-13 | fermé |
| prd | E-11 (qui exécute les exceptions, plateforme) | AD-15, AD-19, AD-2 | **partiel** (P-5) |
| contrat-code | E-01 (source unique de la garde) | AD-24 | fermé |
| contrat-code | E-02 (chemins d'octroi, réamorçage) | AD-23 | fermé |
| contrat-code | E-03 (mono-repo faux) | AD-26, AD-42 | fermé |
| contrat-code | E-04 (registre de schémas) | AD-27 | fermé : le rejet est fondé sur Q-10 et le registre est dans le socle de chaque espace |
| contrat-code | E-05 (BullMQ, Redis, `terme.ts`) | AD-6, AD-42 | fermé |
| contrat-code | E-06 (route `auth-service`) | AD-15, AD-42 | fermé |
| contrat-code | E-07 (format de droit, `binds`) | AD-42, frontmatter | fermé |
| contrat-code | E-08 (état publié) | AD-24, AD-17 | fermé |
| contrat-code | E-09 (cinq services, impayé) | AD-17, AD-42, AD-23 | **partiel** (P-4) |
| contrat-code | E-10 (paiement vers licence) | AD-25, AD-17 | fermé |
| rubric | C-1 (garde des clés) | AD-28 | **partiel** (P-1) |
| rubric | C-2 (agent root) | AD-36 | fermé (voir contradiction C-5 sur la répartition des processus) |
| rubric | C-3 (panne de la centrale) | AD-35 | fermé |
| rubric | C-4 (sinistre, contradiction AD-4/AD-16) | AD-35, AD-4, AD-16 | **partiel** (P-2, même cause que prd E-05) |
| rubric | C-5 (formats signés) | AD-26, AD-22, AD-17 | fermé |
| rubric | C-6 (mTLS) | AD-29 | fermé |
| rubric | H-1 (NFR-5, NFR-9) | AD-11, AD-40 | fermé |
| rubric | H-2 (migrations) | AD-33 | fermé |
| rubric | H-3 (magasin de l'agent) | AD-34, AD-3 | fermé |
| rubric | H-4 (Kafka et espaces) | AD-34, AD-12 | fermé |
| rubric | H-5 (réseau d'entreprise) | AD-9, AD-10, Conventions | fermé |
| rubric | H-6 (marques `[ADOPTED]`) | AD-16, AD-9, AD-20 | fermé pour AD-16 (marque retirée), AD-9 et AD-20 (alignés) ; voir choix non validés N-1 pour AD-9 et AD-35 |
| rubric | H-7 (tranche de départ) | AD-41 | fermé |
| adversaire | 1 (horloge, deux espaces) | AD-6, AD-21 | fermé |
| adversaire | 2 (topic unique) | AD-24, AD-17 | fermé |
| adversaire | 3 (licence pendant installation ou gel) | AD-8 | fermé |
| adversaire | 4 (état voulu) | AD-22 | fermé |
| adversaire | 5 (hébergé, deux sources) | AD-19, AD-25 | **partiel** (P-4) |
| adversaire | 6 (migrations de A, verrou) | AD-33, AD-23 | fermé |
| adversaire | 9 (retrait de consentement) | AD-13 | fermé |
| adversaire | 12 (sauvegarde, `epoque`) | AD-16, AD-11 | fermé |
| versions | V-1 → V-7 | Stack, AD-42, AD-27, AD-10, AD-7, AD-4 | fermés (cosign sans `--offline`, `TPM2_Clear`, TPM « option payante », MongoDB 8.0, kafkajs, dockerode) |

### Écarts de la vérification 1

| Id | Constat | Ce que la Rule ne ferme pas | Correction |
|---|---|---|---|
| P-1 | rubric C-1 (AD-28) | AD-28 : « Clés de signature annuelles, **scellées dans la CI de publication** … Aucune signature de licence ou de sanction hors de la centrale. » La centrale doit signer en ligne (licence, état voulu, jeton d'export, sanction dans la minute, AD-25) ; une clé « scellée dans la CI » ne peut pas servir à cela, et le lieu de la clé d'exécution de la centrale n'est dit nulle part. | Séparer deux familles de clés dans AD-28 : clés de CI (images, manifeste, agent) et clé d'exécution de la centrale (licences, état voulu, heure de référence, jeton d'export), scellée sur l'hôte de la centrale, avec un `usage` distinct dans le certificat de clé (AD-7). |
| P-2 | prd E-05, rubric C-4 (AD-35) | « L'agent reprend l'état, marque un trou, incrémente l'époque » : rien ne dit comment le compteur d'empreinte (AD-4) continue sur une machine neuve (le compteur NV d'un TPM neuf repart de zéro, donc la centrale verrait un recul), ni comment la nouvelle machine obtient son certificat (AD-29 : renouvellement refusé après recul). | Dans AD-35, le fichier de rétablissement porte le dernier compteur et fixe le compteur de départ à `dernier + 1` ; il porte aussi un jeton d'enrôlement à usage unique (AD-29). |
| P-3 | prd E-09 (AD-13) | « Le registre de la plateforme est … alimenté à la signature du contrat d'abonnement » : aucun producteur ni contrat n'est nommé (AD-17 dit « Ces noms sont les seuls »). | Nommer dans AD-17 le contrat qui ordonne l'écriture d'une ligne de niveau 3 par finalité à l'agent de la plateforme (producteur : centrale ou paiement-service). |
| P-4 | contrat-code E-09, adversaire 5 (AD-42, AD-19, AD-8) | AD-42 : « Consommateur d'impayé … : il disparaît, **la sanction est portée par la licence** ». AD-19 : la centrale « n'émet aucune licence pour un hébergé ». Un client hébergé impayé n'a donc plus aucun chemin de suspension (décision 280 : impayé, suspendre). | AD-19 : la partie A de la plateforme consomme `paiement.abonnement.impayee` et `.regularise` (AD-17) et en déduit la suspension de l'hébergé ; corriger la ligne d'AD-42 en « pour un client sur site seulement ». |
| P-5 | prd E-11 (AD-15) | « Il annule les tâches d'échéance de l'essai cible avant d'écrire et les recrée après » : le rafraîchissement est exécuté par l'agent, qui « n'écrit jamais dans la base d'un service » ; les tâches vivent dans le Redis de la partie A. Aucun contrat ne permet à l'agent de les suspendre. | Faire de « suspendre et reprendre les échéances de l'essai » une commande de l'agent vers la partie A (fait `instance.etat.change`, AD-17) ou faire exécuter l'annulation par la partie A sur ordre. |

## 2. Contradictions et trous introduits par la réécriture

| Id | AD | Contradiction | Correction |
|---|---|---|---|
| C-1 | AD-4 contre D-4 | D-4 : « TPM 2.0 PHYSIQUE **exigé** dans NFR-10 » ; AD-4 et la configuration minimale : TPM « **recommandé** », jamais motif de refus. Aucune décision du memlog ne change D-4 ; le PRD NFR-10 dit encore « exigé » jusqu'à l'amendement demandé. | Faire valider « recommandé » par le PO (D-12) avant de l'écrire, ou revenir à « exigé, avec repli `LOGICIEL` » comme D-4 ; dans les deux cas, amender NFR-10. |
| C-2 | AD-4 (compteur, bifurcation) | Le compteur NV n'avance qu'« au plus une fois par heure pour la tête du journal et l'horloge », mais l'empreinte couvre le journal et l'horloge ; « deux empreintes différentes pour un même compteur = bifurcation » donne alors de fausses bifurcations entre deux contacts dans la même heure (signal puis fichier, par exemple). | Dire que l'empreinte envoyée est celle **scellée au dernier incrément** du compteur, ou que le compteur avance à chaque contact. Fixer aussi le compteur du niveau `LOGICIEL` (miroir). |
| C-3 | AD-7, AD-22, AD-1, AD-26 contre AD-8 | AD-8 : la sanction est « un fait porté par la licence ; elle n'a pas d'autre canal ». AD-22 liste `sanctions` comme champ distinct de l'état voulu, AD-1 et AD-7 comme élément ou type de JWS à part, AD-26 comme vecteur à part. | Retirer `sanctions` d'AD-22, AD-1, AD-7 et AD-26 (ou y écrire « portées par la licence »). |
| C-4 | AD-17 (nom absent du tableau) | Contrats utilisés dans des AD mais absents d'AD-17, qui dit « Ces noms sont les seuls » : route interne d'`auth-service` et `identity.org.created` (AD-15) ; ordre de la console vers la partie A (naissance, AD-15) ; avis de fin d'essai et e-mail de correctif de la partie A vers `notification-service` (AD-38, AD-31) ; approbation du manifeste d'export par Money Vibes (AD-14) ; jeton d'enrôlement (AD-29) ; fichier de rétablissement et fichier de prolongation (AD-35) ; résultat d'une commande (AD-37) ; état voulu, licence, manifeste et signal comme artefacts (AD-26 les schématise sans les nommer dans AD-17) ; ordre d'écriture du registre de la plateforme (P-3). | Ajouter ces lignes à AD-17 (producteur, consommateur) ; le document « état voulu » et le signal sont à nommer explicitement dans la ligne « contact ». |
| C-5 | AD-36 contre AD-4, AD-5, AD-34, AD-10 | AD-36 : l'exécuteur est « seul à avoir le socket Docker et le périphérique TPM » ; le processus de contact n'a ni l'un ni l'autre. Or le magasin SQLite scellé par le TPM, l'horloge scellée, `GET /heure`, les clients Kafka par espace et le tirage des images (diagramme : « CT tire REG ») sont attribués à « l'agent » sans dire quel processus les porte. Un processus sans socket ne peut pas charger une image dans le démon. | Ajouter à AD-36 la répartition : exécuteur = magasin, TPM, horloge, `GET /heure`, `docker compose` ; contact = réseau, téléchargement vers un volume de dépôt, que l'exécuteur vérifie puis charge. |
| C-6 | AD-3, AD-22 | « Une version de l'agent … `ETAT_VOULU_TROP_RECENT` déclenche une mise à jour de l'agent seul » : l'état voulu n'a aucun champ de version cible de l'agent, et un agent qui ne lit pas le document ne sait pas quoi tirer ; la livraison de l'agent n'est décrite nulle part. | Ajouter `agentCible` (manifeste signé de la ligne de version de l'agent) à un en-tête de l'état voulu lisible par toute version, ou un canal de contact distinct pour la ligne de version de l'agent. |
| C-7 | AD-2, AD-23 contre AD-37, AD-17 | AD-2 : sur site, installer = « le lancement de son profil Compose par l'agent » ; AD-23 : la partie A porte le plan d'installation. Aucun contrat ne fait passer l'ordre « lancer ou arrêter ce profil » de la partie A à l'agent : AD-37 ne liste que des commandes du DSI (mise à jour, fichier, tunnel, consentement, export), et le rafraîchissement (AD-15) n'en fait pas partie. | Étendre AD-37 : commandes `module.installer`, `module.retirer`, `espace.rafraichir`, déposées par la partie A (producteur) ; l'agent les exécute sous le verrou d'AD-33. |
| C-8 | AD-10 contre le diagramme 2 et D-5 | AD-10 range Traefik dans le « socle d'espace » (un par espace), puis écrit « un serveur avec Docker Compose et Traefik (route par nom d'hôte, un par espace) ». Le diagramme dessine un seul Traefik hors des trois projets ; D-5 dit « deux projets derrière un Traefik ». Deux Traefik ne peuvent pas publier le même 443. | Ôter Traefik du socle d'espace ; le placer dans le projet de l'agent ou dans un projet « bord » unique, dont la configuration est déduite par l'agent (déjà dit). |
| C-9 | Diagramme 1 et phrase sous le diagramme contre AD-25, AD-17 | « Les services des modules ne parlent jamais à la centrale » ; or `paiement-service` (service de la plateforme, qui est une instance) alimente la centrale par le bus (flèche `PAY` vers `CEN`), et le diagramme range `PAY` et `NOT` dans le « poste central ». Le transport (quel Kafka, quel hôte, sens de la connexion, la centrale étant sur un hôte distinct de la plateforme) n'est décidé nulle part. | Corriger le diagramme (paiement et notification sont sur la plateforme) et décider dans AD-25 : soit l'agent de la plateforme relaie `paiement.abonnement.*` à la centrale par le contact, soit la centrale consomme le Kafka de la plateforme par une identité de service nommée. |
| C-10 | AD-30 contre AD-31 | AD-30 : une instance figée « ne reçoit que les correctifs critiques ». AD-31 : « Pendant un gel **ou en version figée**, seul un correctif critique passe, **par fichier** » : une instance figée en contact reçoit pourtant par le réseau. | AD-31 : « en version figée, seul un correctif critique passe ; pendant un gel, par fichier seulement ». |
| C-11 | Conventions (nommage) contre AD-17 | Convention : topics « `domaine.objet.fait`, au passé » ; AD-17 nomme `instance.etat.change` (présent), `reprise.feu-vert`, `instance.journal`, `instance.indicateurs`, `instance.commande.deposee` (le seul au passé). | Renommer `instance.etat.change` en `instance.etat.modifie` et `reprise.feu-vert` en `reprise.feu-vert.donne`, ou élargir la tolérance de la convention à ces noms. |
| C-12 | AD-37 | « L'agent revérifie le droit signé avant d'agir » : aucun « droit signé » n'existe dans les artefacts d'AD-22 ni d'AD-26 ; l'agent ne peut pas savoir qui est l'appelant (DG pour le consentement, AD-13). | Dire que la commande porte le jeton d'appelant vérifié par la partie A et que l'agent revérifie l'identité du DG avec le DG enregistré de l'état voulu (AD-22) ; pour le reste, le droit `instance:*` du jeton. |
| C-13 | AD-14 contre le principe « aucun lien de la centrale vers l'instance » | Le manifeste d'export est approuvé par « le responsable des données de Money Vibes » : le canal par lequel cette approbation signée atteint l'agent n'existe pas (le poste central ne pousse rien, AD-1). | L'approbation passe dans l'état voulu (élément signé, tiré au contact) ou par le fichier ; l'ajouter à AD-22 et AD-17. |

Vérifications sans écart : TPM « recommandé » est cohérent partout dans la spine (AD-4, configuration minimale, Structural Seed). Gel 30 j au niveau `TPM`, 7 j au niveau `LOGICIEL` (Q-5) cohérent entre AD-4, AD-9, AD-22 et la configuration ; l'alerte `min(7 jours, moitié du seuil)` est cohérente avec ce gel. Délais : 72 h, report 7 j, 14 j, 90 j, 7 j de retour arrière, 30 j de certificat, 30 j de grâce cohérents entre AD-29, AD-30, AD-31, AD-32. Propriétaires : AD-2 et AD-19 concordent sur le journal, les consentements et la licence acceptée (agent) et sur l'état publié (partie A). Diagramme de séquence : cohérent avec AD-8, AD-11, AD-22.

## 3. Choix non validés (choix de l'architecte)

Non couverts par une décision D-n ou Q-n, ni par le PRD, le contrat ou le code. Le tableau « Demandes ailleurs » de la disposition prévoit d'enregistrer D-12 et suivantes au memlog : c'est à faire avant la relecture du PO.

| Id | AD | Choix |
|---|---|---|
| N-1 | AD-9, AD-35 (marque `[ADOPTED]`) | AD-9 et AD-35 portent `[ADOPTED]` en entier, alors que `min(7 jours, moitié du seuil)`, « 443 vers deux noms sans inspection TLS », `versionProtocole` N/N-1 (AD-9) et la prolongation au-delà de 3 jours de panne (AD-35) ne sont dans aucune décision. Lever la marque ou valider. |
| N-2 | AD-4 | TPM « recommandé » au lieu d'« exigé » (voir C-1) ; incrément du compteur NV une fois par heure au plus ; détection de `TPM2_Clear` par `reset_count`, `restart_count`, `safe` ; définitions de « recul » et de « bifurcation ». |
| N-3 | AD-3 | Bail exclusif dans le magasin de l'agent ; compatibilité d'agent N/N-1 définie comme « opère les plateformes N et N-1 ». |
| N-4 | AD-6 | Périmé au-delà de 5 minutes ; format de la clef des tâches `<org>:<module>:<transition>:<date>:<epoque>` ; objet de réponse de `GET /heure`. |
| N-5 | AD-10 | Troisième projet Compose `<instance>-agent` ; binaire `docker compose` en sous-processus ; socle d'espace avec Redis et MinIO par espace ; sonde SM-3 par comparaison périodique des empreintes. |
| N-6 | AD-12 | Enveloppe unique du journal, hachage sur JCS, pseudonyme stable avec table hors chaîne, tampon local et fait « trou ». |
| N-7 | AD-13 | Copie du registre de plus de 14 jours inopérante ; quarantaine ou suppression des données d'une finalité retirée. |
| N-8 | AD-14 | Jeton d'export signé à courte durée comme seul lien centrale vers apprentissage (proposé par la relecture, jamais validé par le PO). |
| N-9 | AD-16 | Rétention 7/4/3 étendue **au site** (le PRD la fixe pour la plateforme) ; choix de la sauvegarde « antérieure à l'étape migrer » ; copie hors machine croisée plateforme et poste central ; test de restauration mensuel en projet jetable. |
| N-10 | AD-20 | Tunnel de 2 heures par défaut, prolongeable par le même clic ; comptes Money Vibes de l'instance comme ouverture distincte. |
| N-11 | AD-21 | « Le réel fait foi, l'essai le reçoit » : un seul fait de contrat par instance. |
| N-12 | AD-22 | État voulu en document unique signé, avec `revision` ; retour arrière traité comme proposition au DSI. |
| N-13 | AD-26 | JWS compact Ed25519, JCS, champs obligatoires, vecteurs signés rejoués des deux côtés ; schémas dans `prospera-plateforme/contrats`. |
| N-14 | AD-27 | Karapace 6.2 (Q-10 laisse le choix de l'outil à l'architecte et le dit : « Choix de l'architecte ») ; graphie `organisationId` ; partition `instanceId` des topics sans organisation. |
| N-15 | AD-29 | CA dédiée, certificat de 30 jours renouvelé à chaque contact, grâce de 30 jours, jeton d'enrôlement à usage unique. |
| N-16 | AD-34 | SQLite chiffré en écriture anticipée comme magasin de l'agent (la clé « vient du scellement du niveau d'ancrage » : au niveau `LOGICIEL`, aucun scellement matériel n'existe) ; réseau Docker dédié pour l'agent. |
| N-17 | AD-36 | Séparation exécuteur et contact ; liste blanche de commandes ; SBOM et analyse de vulnérabilités bloquante ; gabarits interdisant `privileged`. |
| N-18 | AD-37 | Commandes déposées par la partie A (route `POST /api/instance/v1/commandes`), tirées par l'agent. |
| N-19 | AD-41 | Premier incrément « agent simulé, centrale simulée » ; démo du 15/01 avec port d'heure sur l'horloge système. |
| N-20 | AD-42 | BullMQ 6 partout, `@nestjs/bullmq` 11 ; verrou d'outbox ; gabarit MongoDB en jeu de réplicas à un nœud par espace ; ports de développement 3401 → 3405, 5001, 8081 ; autorité de certificats attribuée à `centrale-service` (AD-2, absente de D-2). |
