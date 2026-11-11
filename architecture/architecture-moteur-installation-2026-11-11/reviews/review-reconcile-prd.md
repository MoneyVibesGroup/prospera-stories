# Revue de réconciliation : PRD + addendum contre la spine du moteur d'installation

Relecteur : réconciliation des entrées. Date : 2026-11-11.
Lu en entier : `prd.md` (§0 → §8), `addendum.md` (§A-1 → §A-11), `.memlog.md` du PRD (survol des décisions PO), `ARCHITECTURE-SPINE.md` (AD-1 → AD-20, conventions, graine, carte) et son `.memlog.md` (D-1 → D-11).

Lecture de la gravité : **critique** = une exigence « jamais sacrifiée » ou un test du PRD ne peut pas être construit sans inventer l'architecture ; **haute** = un propriétaire, un flux ou un contrat manque, ou la spine contredit le PRD ; **moyenne** = règle discrète perdue, rattrapable en story ; **basse** = précision.

**Verdict.** La spine tient le découpage, l'ancrage, la signature, le journal et les sauvegardes, mais elle laisse tomber presque toute la partie « vie de l'instance » (correctif 72 h, version figée et N-1, essai prospect et son effacement, faits agent vers partie A, commandes du DSI vers l'agent), et elle contient quatre contradictions avec le PRD ou avec elle-même.

---

## 1. Écarts critiques

### E-01 — Le chemin rapide du correctif de sécurité (72 h) n'existe pas dans la spine
- **Source :** FR-19 (« 72 heures à partir du moment où le client est prévenu », « reporter une seule fois, de 7 jours au plus », « hors vagues », « ne porte jamais de migration », « publié pour chaque version majeure encore dans sa durée de maintenance », « Money Vibes prévient le DSI par téléphone et par e-mail ») ; FR-16 (« vérifie chaque jour s'il existe un correctif de sécurité ») ; A-1 (ligne « Correctif de sécurité (72 h) », horloge Money Vibes, départ « client prévenu », observé par Money Vibes) ; §3 (critique = CVSS ≥ 9 ou faille exploitée) ; A-3 (le fichier d'urgence « passe par le chemin rapide »).
- **État dans la spine :** absence. Aucun AD ne mentionne « correctif », « 72 h », le report unique, ni la distinction critique/non critique. AD-9 (vérification quotidienne) ne dit pas qu'elle cherche un correctif ; AD-2 donne à `centrale-service` « versions publiées et vagues » sans chemin rapide ; AD-11 ne distingue pas la promotion d'un correctif (sans essai long, sans migration, retour arrière toujours sans perte).
- **Gravité :** critique (FR-19 est « jamais sacrifiée »).
- **Correction :** ajouter un AD « correctif de sécurité » : publication d'un artefact `CORRECTIF` par version majeure maintenue, annonce dans la réponse quotidienne, horloge de 72 h tenue par la centrale (départ = prévenu), report unique ≤ 7 jours tracé au journal, promotion sans migration ni vague, et une règle d'éligibilité de la version figée (E-02).

### E-02 — VERSION_FIGEE, fin de maintenance, fenêtre N-1 et avertissement à 90 jours : aucun mécanisme
- **Source :** §3 (« Version figée », maintenance « datée par instance »), §3.1 axe 1, FR-14 (« `miseAJour: jusqu'au <date>` »), FR-19 (figée : correctifs critiques seulement, tant que la version majeure est dans sa durée de maintenance), FR-21 (3 ans publiés, « jamais plus d'une version majeure de retard (N-1) », « le DG est prévenu », « DG d'une instance figée prévenu 90 jours avant »), FR-32 (« ne peut pas ajouter de module sans revenir à la maintenance »), A-8 (« règle nouvelle, sur l'instance »).
- **État dans la spine :** AD-7 cite « la date de fin de maintenance » dans le manifeste ; AD-19 dit seulement que la plateforme n'entre jamais en `VERSION_FIGEE`. Rien ne dit qui calcule `VERSION_FIGEE` (licence `miseAJour` contre horloge scellée), qui le publie, ce qu'il bloque (ajout de module, mise à jour, nouveau modèle commun), quels correctifs il laisse passer, ni qui prévient le DG à 90 jours. La « fenêtre N-1 » n'apparaît que sous une autre acception : AD-3 dit que l'agent « sait opérer N et N-1 », ce qui n'est pas la règle de FR-21 (retard maximal d'une instance, fin du support contractuel, pas de promotion forcée).
- **Gravité :** critique (FR-21 outillage est sacrifiable, mais FR-32 et FR-19 ne le sont pas, et VERSION_FIGEE est un état d'instance publié).
- **Correction :** ajouter un AD « maintenance et version figée » : l'agent compare `miseAJour` à l'horloge scellée, émet le fait vers la partie A (E-03), applique le tri des correctifs critiques selon la durée publiée de la version majeure, et la centrale porte l'alerte DG à J-90 et la règle N-1 (sans promotion forcée) ; distinguer explicitement cette règle de la compatibilité d'agent d'AD-3.

### E-03 — Le flux « agent vers partie A » (faits de l'instance) et le flux « DSI vers agent » (commandes) n'ont aucun contrat nommé
- **Source :** FR-34 et A-2 (la lecture rend `instance` : espace, `NORMAL | GEL`, `VERSION_FIGEE`, version de plateforme, heure de référence, `retourArriereEnCours` avec étape et avancement, `miseAJourAnnoncee` avec `retourArriere` `SANS_PERTE | AVEC_PERTE` et date ; la partie A est « seul émetteur » de l'état publié) ; §3.1 (« le moteur de l'instance publie le gel ») ; FR-36 et A-5 (droits `instance:mise-a-jour:planifier`, `:revenir`, `:fichier:deposer`, `:support:ouvrir`, `:consentement:donner`, `:donnees:exporter`) ; FR-17 (le DSI choisit la date) ; FR-40 (avancement du retour arrière visible dans `prospera-app`).
- **État dans la spine :** AD-17 dit « Ces noms sont les seuls » et ne contient que `instance.licence.acceptee` et `GET /heure` entre agent et partie A. Le gel, la version figée, la mise à jour annoncée, l'avancement d'un retour arrière et la version de plateforme n'ont aucun canal vers la partie A, qui doit pourtant les publier. AD-6 range le « gel » parmi les tâches BullMQ de la partie A, alors que A-1 dit que c'est l'agent qui l'observe (départ = dernier contact vu par l'instance, que le port `HorlogeDeReference` ne transmet pas). Aucun contrat non plus par lequel `prospera-app` ordonne à l'agent de planifier, revenir, déposer un fichier, ouvrir un tunnel, consentir ou exporter ; l'agent n'a pas de port entrant, donc la commande passe forcément par un service de l'espace (laquelle ? la spine ne le dit pas) et l'agent doit y vérifier le droit.
- **Gravité :** haute (sans cela, ni la lecture de FR-34, ni l'écran de FR-36, ni le test en matrice ne se bâtissent).
- **Correction :** ajouter à AD-17 un événement `instance.etat.change` (agent vers partie A : gel, version figée, annonce, avancement) et un contrat de commandes (par exemple `POST /api/instance/v1/commandes`, porté par la partie A qui vérifie le droit `instance:*` et dépose une commande idempotente que l'agent tire) ; retirer « gel » de la liste d'AD-6 ou y préciser qu'il est dérivé du fait de l'agent.

---

## 2. Écarts hauts

### E-04 — Licence : plusieurs règles discrètes de FR-14 / A-3 ne sont pas posées
- **Source :** FR-14 (« refusée sur toute autre » instance : `LICENCE_AUTRE_INSTANCE` ; « toutes clés confondues, une licence dont l'heure de référence signée est antérieure à celle de la dernière licence acceptée : `LICENCE_ANTERIEURE` » avec le test de la licence de l'ancienne clé reçue par e-mail ; « une licence invalide est refusée entière et l'instance garde la précédente » ; validité d'un abonné = le plus tardif des `preavisJusquau`, jamais sur un module perpétuel ; payé en plusieurs fois : licence à échéance jusqu'au solde) ; A-3 (le fichier d'urgence « réinitialise le plus haut numéro retenu pour cette clé et l'heure de la dernière licence acceptée, révoque tout ce qu'elle a signé, ré-émet les licences sous une nouvelle clé ») ; A-4 (l'état de confiance contient « l'heure de référence de la dernière licence acceptée »).
- **État dans la spine :** AD-7 pose le numéro croissant par clé et la révocation, mais pas : la liaison à l'identifiant d'instance, la règle « toutes clés confondues » (la seule qui rende le test de FR-14 vrai), la réinitialisation du compteur par le fichier d'urgence (sans elle, une clé compromise qui a signé 2⁶³ bloque la clé de remplacement), la ré-émission, ni la règle de validité d'une licence d'abonné. AD-4 ne liste pas la composition de l'état de confiance ; « l'heure de référence de la dernière licence acceptée » n'apparaît nulle part.
- **Gravité :** haute (FR-14 est « jamais sacrifiée » ; NFR-11 et NFR-8 en dépendent).
- **Correction :** compléter AD-7/AD-8 : champs de la licence (`instanceId`, modules et droits, `miseAJour`, `clé`, `numéro`, `heureDeRéférence`), les deux refus `LICENCE_ANTERIEURE` (par clé et toutes clés confondues), le contenu exact de l'effet du fichier d'urgence, et la liste de l'état de confiance dans AD-4.

### E-05 — Rétablissement de l'état de confiance après perte du serveur : absent
- **Source :** A-4 (« Après la perte du serveur, il est rétabli depuis la dernière empreinte connue de Money Vibes, par un fichier signé ») ; NFR-7 (remise en route 4 h) ; NFR-11.
- **État dans la spine :** AD-4 décrit le refus quand l'empreinte recule, pas la sortie de ce refus. Une restauration sur une autre machine (cas de NFR-7, clé de secours) tombe donc dans « recul, tout refusé, ticket » sans chemin de retour.
- **Gravité :** haute.
- **Correction :** ajouter à AD-4 le « fichier de rétablissement » signé par la centrale (empreinte connue, tête du journal, plus haut numéro par clé, heure de référence), son usage unique, sa journalisation, et le RTO de 4 h qui en dépend.

### E-06 — Contradiction : `apprentissage-service` n'a « aucun lien vers `centrale-service` », mais le refus sur recul d'empreinte doit l'atteindre
- **Source :** NFR-11 et A-4 (« si elle a reculé, Money Vibes refuse toute licence et tout export de niveau 1 à 3 pour cette instance ») ; SM-4 (0 donnée sortie sans consentement valide).
- **État dans la spine :** AD-4 pose le refus d'export, AD-14 dit « aucun lien vers `centrale-service` », AD-2 donne la détention de l'empreinte à la centrale seule. Rien ne dit comment `apprentissage-service` apprend le recul.
- **Gravité :** haute (la contradiction rend la garde SM-4 invérifiable).
- **Correction :** faire émettre par la centrale, dans la réponse quotidienne, un jeton signé à courte durée (« export autorisé jusqu'à… ») que l'agent joint à tout export et qu'`apprentissage-service` vérifie hors ligne ; sans jeton valide, refus.

### E-07 — Essai prospect (FR-33) : l'orchestration de l'échéance, de l'avis et de l'effacement n'a pas de propriétaire ni de contrat
- **Source :** FR-33 (J0 → J+30, prolongation unique avant la fin, 60 jours au plus ; `ESSAI_TERMINE` puis 30 jours pour exporter ou signer ; « avis de fin d'essai » 7 jours avant chaque fin à l'administrateur du prospect **et** à son commercial Money Vibes ; effacement « données de chaque module, copies chez les modules voisins, calibration », chaque module efface les siennes (C13), Reprise comprise ; journaux pseudonymisés ; « certificat d'effacement » qui dit la date d'expiration de la dernière sauvegarde contenant les données ; signature pendant `ESSAI_TERMINE` rouvre l'essai sans perte) ; FR-32 (suppression des données d'un acheteur hébergé après 90 jours de lecture seule, avec certificat) ; A-1 (horloge Money Vibes) ; NFR-7 (paliers 7 quotidiennes, 4 hebdomadaires, 3 mensuelles sur la plateforme).
- **État dans la spine :** AD-6 cite « fin d'essai » et « effacement » comme tâches BullMQ de la partie A, et AD-12 la pseudonymisation du journal. Il manque : qui exécute l'effacement (plan enregistré de la partie A appelant la route d'effacement de chaque propriétaire, nommée nulle part dans AD-17), l'émission de l'avis (service de notification, destinataires), l'émission du certificat, le calcul de la date d'expiration de la dernière sauvegarde (AD-16 ne donne aucune rétention, donc le certificat ne peut pas dire de date), et la même mécanique pour l'acheteur hébergé de FR-32.
- **Gravité :** haute (FR-33 « jamais sacrifié » : l'outil de vente de février).
- **Correction :** ajouter un AD « effacement » : plan enregistré idempotent, contrat d'effacement par propriétaire (C13) dans AD-17, destinataires de l'avis, certificat signé portant la date d'expiration tirée de la politique de rétention de l'AD-16, et rétention de la plateforme (7/4/3) au même endroit.

### E-08 — FR-24 (IA du client intouchable) : la carte renvoie à une règle qu'AD-11 ne contient pas
- **Source :** FR-24 (empreinte de la calibration identique avant et après une mise à jour de code ; un nouveau modèle commun produit une **nouvelle** calibration à côté de la précédente, conservée pour un retour arrière ; calibration sauvegardée et restaurée avec les données) ; FR-31 ; NFR-7.
- **État dans la spine :** la carte dit « volumes des modules, hors promotion, AD-11 (une promotion ne touche pas les modèles calibrés) ». AD-11 ne dit rien de tel : « relancer les empreintes précédentes sur la même base » ne protège pas la calibration, et rien n'impose que les volumes de calibration soient hors de ce que la promotion migre. Pas de test d'empreinte dans les conventions de test.
- **Gravité :** haute (FR-24 « jamais sacrifiée », « ce que l'assureur achète »).
- **Correction :** écrire la règle dans AD-11 (volumes de calibration versionnés, la promotion ne les ouvre pas en écriture, un modèle commun crée une calibration sœur, le retour arrière repointe sur la précédente) et ajouter le test d'empreinte avant/après aux conventions de test.

### E-09 — Plateforme : la garde technique du registre (compte de service IA, `CONSENTEMENT_ABSENT`) et le journal des lectures d'exploitation sont absents
- **Source :** §4.C (plateforme : « l'IA lit par un compte de service dédié, dont toute lecture passe par la garde du registre ») ; FR-27 (« garde technique, partout », `CONSENTEMENT_ABSENT`, lectures d'exploitation AD-P16 journalisées à part, jamais pour l'apprentissage, entrent dans SM-4 ; clauses du contrat d'abonnement enregistrées à la signature, une ligne de niveau 3 par finalité) ; §8.4 (AD-P16) ; A-11 (C11 §5).
- **État dans la spine :** AD-13 et AD-14 ne traitent que de l'export d'une instance vers `apprentissage-service`. Sur la plateforme rien ne « sort », donc la garde porte sur la lecture par un compte IA, ce que la spine n'aborde pas ; l'alimentation du registre de la plateforme à la signature du contrat (par qui, depuis quel contrat) n'est pas dite ; AD-12 ne cite pas les lectures d'exploitation parmi les faits journalisés.
- **Gravité :** haute (SM-4 = 0 est une cible mesurable qui en dépend).
- **Correction :** ajouter à AD-13 le cas plateforme (qui tient le registre, l'ordre d'enregistrement à la signature, la garde à l'entrée du compte IA, le journal des lectures d'exploitation).

### E-10 — Export de niveau 1 : la double approbation et les autres règles de FR-28 / FR-30 sont perdues
- **Source :** FR-28 (« manifeste signé : champs, nombre de lignes, finalité », approuvé par le DG (ou désigné) **et** le responsable des données de Money Vibes, rangé au registre ; « pas d'approbation, pas d'export » ; la table de correspondance ne quitte jamais l'instance) ; FR-27 (« sans contrat client signé portant la clause, aucun consentement ne s'enregistre ») ; FR-30 (l'entraînement s'exécute sur l'instance ; contribution non transmise sous 30 jours purgée sur l'instance ; chez Money Vibes gardée jusqu'au tour d'entraînement puis supprimée ; un retrait exclut du prochain tour).
- **État dans la spine :** AD-14 donne le pseudonyme salé et le seuil de 5, pas l'approbation à deux, ni la purge de 30 jours, ni la suppression après entraînement, ni que la table de correspondance reste sur l'instance.
- **Gravité :** haute (discrets, et ce sont des gardes SM-4).
- **Correction :** ajouter à AD-14 le manifeste d'export signé à deux approbations (rangé au registre), la purge de 30 jours, la suppression après tour, la règle « table de correspondance non exportable » et la précondition « clause du contrat signée ».

### E-11 — Contradictions internes à la spine sur qui exécute les exceptions de NFR-3 et sur la différence plateforme / site
- **Source :** NFR-3 et FR-42 (naissance sur ordre de la console) ; FR-8 (rejeu du dossier par la partie A, chaque propriétaire importe) ; C3 ; FR-17 (deux variantes de mise à jour : fenêtre fixée par Money Vibes, annonce à 7 jours, interrupteurs allumés par l'administrateur de chaque organisation avec date limite, retour arrière global décidé par Money Vibes) ; FR-18 (`AVEC_PERTE` interdite sur la plateforme).
- **État dans la spine :** AD-15 dit que les trois exceptions sont « chacune exécutée par l'agent comme un plan enregistré et journalisé », puis que la naissance et le rejeu sont faits par la partie A. AD-2 donne les « plans d'installation » à la partie A et les « plans de promotion et de retour arrière » à l'agent : le dossier d'installation est un plan d'installation, pas une promotion. AD-19 affirme que la plateforme ne diffère que par « trois points seulement » (horloge, droits, jamais de gel ni de version figée), ce qui efface la variante de FR-17 (fenêtre, annonce, interrupteurs par organisation, retour arrière global) et l'interdiction d'`AVEC_PERTE`.
- **Gravité :** haute (deux lectures possibles d'un même flux ; les stories divergeront).
- **Correction :** dans AD-15, dire que la partie A orchestre naissance et rejeu et que l'agent ne transporte que le rafraîchissement (copie inter-espaces) ; dans AD-19, remplacer « trois points seulement » par la liste complète des écarts de FR-17 et FR-18.

---

## 3. Écarts moyens

### E-12 — Livraison de la licence et alerte de J-7 sur licence non reçue
- **Source :** FR-14 et FR-22 (licence « envoyée automatiquement par e-mail au DSI à chaque paiement » et « téléchargeable par un lien sécurisé à durée limitée », idem le paquet de mise à jour) ; FR-14 (« dérivée automatiquement du contrat », une modification du contrat produit la nouvelle licence) ; FR-41 (« Money Vibes est alertée 7 jours avant l'échéance d'une licence payée que l'instance n'a pas reçue ») ; FR-41 (acheteur entièrement payé jamais suspendu ; payé en plusieurs fois : licence à échéance).
- **État dans la spine :** AD-9 ne cite que l'alerte de J+7 du silence. Le flux `paiement-service` vers `centrale-service` (contrat modifié, paiement reçu) n'est pas dans AD-17, ni l'appel au service de notification, ni les liens à durée limitée, ni l'alerte de J-7, ni la règle de la centrale qui refuse de sanctionner un acheteur soldé.
- **Gravité :** moyenne (haute pour FR-41 « jamais sacrifiée »).
- **Correction :** ajouter à AD-8/AD-17 le consommateur `paiement.*` de la centrale, la demande d'envoi à `notification-service`, le lien signé à durée limitée (MinIO ou équivalent), l'alerte de J-7 de la centrale et la règle d'émission de la sanction.

### E-13 — Interrupteurs de changement : la date limite de 30 jours et la règle « une seule version ouverte » ne sont pas dans les échéances
- **Source :** FR-17 (date limite de 30 jours, allumage automatique ; « une seule version d'interrupteurs ouverte à la fois » ; « sur site, tous les interrupteurs passent à leur position finale à la promotion » ; « un interrupteur ne change jamais la forme des données » ; test de conformité éteint puis allumé) ; A-8 (les interrupteurs vivent dans le moteur et se lisent dans l'état publié).
- **État dans la spine :** AD-6 énumère « fin d'essai, préavis, lecture seule, effacement, gel » : la date limite d'interrupteur manque. Le test éteint/allumé par module n'est pas dans les conventions de test.
- **Gravité :** moyenne.
- **Correction :** ajouter la date limite d'interrupteur à la liste d'AD-6 (clé `<organisationId>:<module>:<interrupteur>:<date>`), la garde « une version ouverte » au catalogue des versions de la centrale, et le test aux conventions.

### E-14 — Vagues et incidents : aucune règle ni aucune remontée de l'incident
- **Source :** FR-20 (pilote d'abord, la plateforme compte comme une instance, 7 jours sans incident, plafond d'attente de 14 jours) ; §3 (incident = retour arrière demandé, anomalie grave ou bloquante imputée à la version, contrôle de santé en échec après promotion) ; A-1 (vague : horloge Money Vibes) ; FR-17 (pas deux promotions dans la même fenêtre de 7 jours, sauf correctif).
- **État dans la spine :** AD-2 attribue « vagues » à la centrale ; aucun AD ne porte la règle, et le signal hebdomadaire (schéma fermé, AD-9) ne contient pas les incidents que la centrale doit connaître. Qui applique « pas deux promotions en 7 jours » (la centrale pour la plateforme, l'agent sur site) n'est pas dit.
- **Gravité :** moyenne (FR-20 est la deuxième à sacrifier, mais la règle des 7 jours vaut aussi hors vagues).
- **Correction :** ajouter à AD-9 les champs d'incident (retour arrière, contrôle de santé en échec) dans le schéma fermé, et un AD de publication par vagues avec les 7/14 jours.

### E-15 — Un retour arrière par relance d'images retire le correctif de sécurité
- **Source :** FR-18 (« revenir en arrière ne retire jamais un correctif de sécurité… reste appliqué » `[ASSUMPTION]`) ; FR-19.
- **État dans la spine :** AD-11 « relancer les empreintes précédentes » ramène l'image d'avant, correctif compris. Sans règle de ciblage (« la dernière révision corrigée de la version précédente »), le comportement contredit FR-18.
- **Gravité :** moyenne.
- **Correction :** dire dans AD-11 que la cible du retour arrière est la version précédente **au niveau de correctif courant** (le manifeste de cette version corrigée).

### E-16 — NFR-9 : le plafond de 15 minutes d'interruption n'est pas traité
- **Source :** NFR-9 (« une promotion n'interrompt pas le travail plus de 15 minutes, annoncées »).
- **État dans la spine :** AD-11 liste ses références NFR-9 dans « Binds » mais le texte ne contient aucun moyen de la tenir (migrations hors coupure, bascule ordonnée par service, mesure) ni d'annonce.
- **Gravité :** moyenne (dégradable : « mesurée, non bloquante »).
- **Correction :** préciser que les migrations additives se font avant la bascule, que la bascule ne relance que les services dont l'image change, que la durée est journalisée par promotion, et que l'annonce part avec la date choisie.

### E-17 — NFR-5 (< 15 min) et SM-7 (deuxième distributeur ≤ 50 %) : rien dans la spine
- **Source :** NFR-5 (installation du pack distributeur en moins de 15 minutes, images déjà téléchargées, mesurée sur la plateforme) ; SM-7 (mesurée par le plan d'installation, FR-40).
- **État dans la spine :** NFR-5 n'est pas dans « binds ». Rien ne dit que l'agent précharge les images à la promotion dans l'essai, ni que le plan d'installation horodate chaque étape (c'est ce qui rend SM-7 mesurable). La spine ne distingue pas non plus « installer un module pour une organisation » (logique, plateforme partagée) de « lancer un profil Compose » (site), alors qu'AD-10 parle de « profil par module installé » seulement.
- **Gravité :** moyenne.
- **Correction :** ajouter une phrase à AD-2/AD-10 : installation logique sur la plateforme (profil déjà lancé), profil lancé sur site, images préchargées, étapes horodatées dans le plan.

### E-18 — SM-3 (sonde) et SM-6 (garde de balayage) : les mécanismes de mesure ne sont pas posés
- **Source :** SM-3 (« une sonde compare l'empreinte du code déployé dans chaque espace réel au journal des promotions ; un test d'intrusion de la sonde fait partie de la recette ») ; SM-6 (garde de balayage C6 posée au gabarit de chaque dépôt) ; SM-4 (journaux).
- **État dans la spine :** ni « sonde » ni garde C6 n'apparaissent ; les conventions de test ne listent ni l'un ni l'autre. L'agent ne lance que des images signées (AD-10), mais rien ne compare l'état réel au journal.
- **Gravité :** moyenne.
- **Correction :** ajouter à AD-10/AD-12 la sonde (l'agent liste périodiquement les empreintes lancées dans l'espace réel et les compare à la tête du journal ; écart = fait journalisé et ligne rouge en supervision) et aux tests la garde C6 du gabarit.

### E-19 — Supervision : le contenu de FR-16 est réduit à trois colonnes
- **Source :** FR-16 (version, santé de chaque module avec `DEGRADE` en rouge, voyant de santé de l'instance, dernier contact, état de confiance, mises à jour en attente, écarts nommés) ; FR-40 (avancement du retour arrière visible en supervision) ; FR-4 (écarts nommés des chemins 2 et 3) ; contre-indicateurs de §6.
- **État dans la spine :** AD-2 : « derniers contacts, empreintes, santé ». Manquent le voyant d'instance (échec du test de restauration, AD-16 le met à l'orange localement mais ne dit pas qu'il remonte), les écarts nommés, l'avancement, les mises à jour en attente, les contre-indicateurs.
- **Gravité :** moyenne (FR-16 dégradable : « la liste des instances et le dernier contact »).
- **Correction :** lister les champs du signal hebdomadaire correspondant (avec les écarts nommés en codes, sans contenu métier) dans AD-9.

### E-20 — Compteurs de Connecteurs : la spine les met dans le seul signal hebdomadaire, FR-26 les veut aussi dans la vérification quotidienne sur site
- **Source :** FR-26 (« Sur site, ils remontent aussi par la vérification quotidienne », décision du PO du 2026-11-11) ; A-4 (la vérification n'envoie que quatre champs : le PRD se contredit lui-même).
- **État dans la spine :** AD-9 reprend A-4 (quatre champs) et place les compteurs dans le signal hebdomadaire.
- **Gravité :** moyenne.
- **Correction :** ajouter les compteurs au contenu de la vérification quotidienne sur site, et demander l'alignement d'A-4 sur FR-26.

### E-21 — Ancrage : le gel à 7 jours au niveau `LOGICIEL` contredit le délai de silence de 30 jours, et « TPM exigé » contredit « sinon LOGICIEL »
- **Source :** §3 (« délai de silence : 30 jours », gel au-delà) ; FR-15 (« le silence ne punit pas », J+7 alerte, J+30 gel) ; NFR-10 (configuration minimale sans TPM) ; FR-25 (la procédure refuse un serveur en dessous).
- **État dans la spine :** AD-4 raccourcit le gel à 7 jours au niveau `LOGICIEL`, ce que le PRD ne prévoit pas (le PO a approuvé l'ensemble des recommandations le 2026-11-11, mais le PRD n'est pas amendé) ; le gel à J+7 se confond de plus avec l'alerte de J+7. La graine dit « TPM 2.0 physique (sinon niveau `LOGICIEL`) » et « la procédure refuse un serveur en dessous » : l'absence de TPM est-elle un refus ou un niveau ?
- **Gravité :** moyenne.
- **Correction :** consigner l'amendement au PRD (FR-15, NFR-10, NFR-11) et trancher dans AD-4 que le TPM n'est pas un critère de refus, seulement un niveau.

### E-22 — Journal chaîné par hachage et pseudonymisation : incompatibles tels qu'écrits
- **Source :** NFR-4 et FR-33 (journal en ajout seul ; « journaux nominatifs pseudonymisés, pas supprimés »).
- **État dans la spine :** AD-12 dit chaîné par hachage **et** « pseudonymisé, jamais supprimé ». Modifier une entrée casse la chaîne et la tête gardée dans l'état de confiance.
- **Gravité :** moyenne.
- **Correction :** préciser que le hachage porte sur des identifiants pseudonymes stables et que la table de correspondance nominative est hors chaîne et seule effaçable.

### E-23 — Rafraîchissement masqué (FR-10) : règles discrètes absentes
- **Source :** FR-10 (par organisation ; jamais l'essai d'une autre organisation ni un essai prospect ; refusé pendant une répétition générale de cette organisation ; obligatoire avant d'essayer une majeure ; champs personnels masqués avant écriture dans un bac à sable sans accord écrit, « même liste qu'au niveau 1 » ; règles d'accès du réel conservées ; n'écrit jamais dans le réel).
- **État dans la spine :** AD-15 nomme le rafraîchissement comme l'une des trois exceptions, « données masquées ». Ni le contrat d'export par module employé (C13) ni la liste de masquage partagée avec AD-14 ne sont dits, ni les refus.
- **Gravité :** moyenne (FR-10 dégradable en script).
- **Correction :** ajouter une ligne à AD-15 : mêmes routes d'export/import C13, même bibliothèque de masquage qu'AD-14, refus par organisation.

### E-24 — Essai : interception des sorties et séparation des identifiants d'écriture
- **Source :** FR-9 (liste blanche, intercepté et consultable dans un journal ; messages d'identité en exception nommée et journalisée ; l'essai n'a « jamais d'identifiant d'écriture du réel » ; `ECRITURE_REELLE_DEPUIS_ESSAI` ; « le serveur refuse toute destination déclarée pour l'espace réel ») ; A-7 (identifiants en lecture seule propres à l'essai, écriture de test refusée).
- **État dans la spine :** le code d'erreur est cité dans les conventions ; aucun AD ne dit qui détient la liste blanche, où elle est contrôlée (garde de chaque module ou point de sortie unique), ni que les secrets de l'espace réel ne sont pas montés dans le projet Compose de l'essai (AD-10 est le seul endroit où cela peut se garantir).
- **Gravité :** moyenne.
- **Correction :** ajouter à AD-10 la règle « aucun secret d'écriture du réel dans le projet de l'essai » et nommer le propriétaire de la liste blanche (partie A) et du journal des interceptions.

### E-25 — Point de décision unique et chemins 0 à 6 : pas d'AD
- **Source :** FR-4 et A-6 (« bibliothèque unique, embarquée telle quelle sur site, avec la même suite de conformité » ; preuve par mutation ; ordre des refus `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE`, sur site `MODULE_HORS_LICENCE` seul ; écarts nommés des chemins 2 et 3) ; FR-38 (`MANIFESTE_CYCLE`, `MANIFESTE_DEPENDANCE_MINEURE` refusés à la publication) ; FR-18 (`AVEC_PERTE_INTERDIT_PLATEFORME`).
- **État dans la spine :** la carte dit « Partie A : FR-1 → FR-13, FR-33 → FR-43 governed by AD-2, AD-6, AD-15, AD-17 » ; aucun de ces AD ne pose le point de décision, sa bibliothèque ou son emplacement dans le mono-dépôt (la graine ne montre que `packages/adaptateurs`). AD-8 dit que « la centrale et la partie A partagent le contrat » sans dire que c'est un même code. Les codes `MANIFESTE_DEPENDANCE_MINEURE`, `AVEC_PERTE_INTERDIT_PLATEFORME` et le tri des refus ne figurent pas aux conventions.
- **Gravité :** moyenne.
- **Correction :** ajouter un AD court « un point de décision » (paquet `packages/point-de-decision` dans la graine, embarqué par la partie A et par l'agent sur site) et compléter la liste des codes.

### E-26 — Gel : ce qu'il bloque et ce qu'il laisse passer
- **Source :** §3 (gel : « plus rien ne change, sauf un correctif de sécurité critique apporté par fichier ; il se lève au premier contact ») ; §3.1 (« Réessayer » refusé pendant un gel) ; FR-15 (bandeau pour les administrateurs, DG alerté une fois, ticket) ; « contact » = authentifié, daté, jamais déjà vu ; FR-35 (le DSI peut déposer un fichier en gel).
- **État dans la spine :** AD-4 et AD-9 donnent le seuil. La définition du contact (« un fichier déjà vu n'est pas un contact ») et l'exception du correctif critique par fichier ne sont écrites nulle part ; AD-5 en couvre la moitié pour l'horloge seulement.
- **Gravité :** moyenne.
- **Correction :** ajouter à AD-9 la définition du contact et à AD-1/AD-11 l'exception du correctif critique par fichier pendant le gel.

### E-27 — Bilan d'instance de FR-25 non défini
- **Source :** FR-25 (bilan : espaces actifs, licence valide, premier signal reçu par Money Vibes, sauvegarde testée par une restauration, état de confiance initialisé et rapporté ; refus d'un serveur sous NFR-10) ; C1 (vérifications du module `instance`).
- **État dans la spine :** la graine cite le refus de serveur ; le bilan et l'initialisation de l'état de confiance au montage (clé du TPM, première empreinte, certificat mTLS) ne sont pas définis, ni le « premier signal reçu » (confirmation de la centrale vers l'agent).
- **Gravité :** moyenne.
- **Correction :** ajouter à AD-10 la séquence de montage et les cinq contrôles du bilan.

### E-28 — Sauvegardes : RTO, rétention de la plateforme, clé d'exploitation
- **Source :** NFR-7 (remise en route 4 h sur site et plateforme ; plateforme : 7 quotidiennes, 4 hebdomadaires, 3 mensuelles ; clé d'exploitation scellée sur l'instance et clé de secours remise au client).
- **État dans la spine :** AD-16 donne RPO 1 h, 3-2-1, test mensuel, clé du client ; le RTO de 4 h, les paliers et la clé d'exploitation scellée manquent ; la copie « hors machine » de la plateforme (pas de « second support dans les locaux du client ») n'est pas située.
- **Gravité :** moyenne.
- **Correction :** compléter AD-16 de ces trois points et du lieu de la copie hors machine de la plateforme.

---

## 4. Écarts bas

- **E-29 — Support : comptes Money Vibes fermés par défaut.** FR-23 ouvre les comptes pour « une durée bornée, comme le tunnel » avec journal consultable par le client ; AD-20 les ferme « en dehors d'un tunnel ouvert », ce qui les lie au tunnel au lieu d'en faire une ouverture distincte. Correction : séparer les deux ouvertures dans AD-20.
- **E-30 — Ancrage logiciel.** AD-4 écrit l'état de confiance « sur le second support de sauvegarde » alors qu'AD-16 l'exclut « de tout jeu de sauvegarde » : préciser un volume dédié non couvert par les tâches de sauvegarde et de restauration. Le compteur NV « incrémenté à chaque changement de l'état de confiance » userait la NVRAM (l'horloge change en continu) : fixer la granularité (licence, consentement, tête du journal).
- **E-31 — AD-10 range l'agent dans le « socle de C10 » qui démarre dans chaque projet Compose, alors qu'AD-3 le place hors des deux projets.** Écrire l'exception.
- **E-32 — Tests oubliés des conventions.** Recul de 40 jours (échéance tombe), neuf états plus trois cas de la matrice (droit `ACTIVE` sans installation, recul, avance), « aucun identifiant de personne dans un indicateur » (FR-26), re-promouvoir et tout se relit (FR-18), `instance:*` hors intersection en gel (FR-35).
- **E-33 — Jalons.** La spine ne distingue pas la démo du 15/01 (partie A sur l'espace d'essai de la plateforme, SM-1) de février ; AD-10 dit que la plateforme est montée « en février » alors que la démo en dépend. Ni l'ordre de sacrifice (§8.4) n'est transposé en repli d'architecture (niveau 2 fermé est la seule reprise).
- **E-34 — Droit de consentir réservé au DG.** FR-35 (`CONSENTEMENT_RESERVE_AU_DG`, 403) et §8.4 (changement d'`auth-service`) : AD-13 cite le DG mais pas où le refus est appliqué ni que le « DG » est l'identité enregistrée par Money Vibes à la signature, transmise à l'agent par l'état voulu.
- **E-35 — Avenant automatique (FR-12) et installation de la dépendance par le plan de mise à jour (FR-17).** AD-11 liste les étapes d'une promotion sans l'installation d'un module ajouté par une majeure ni l'avenant préalable (flux `paiement-service`).
- **E-36 — Registre des consentements lu par la console (FR-36).** La seule copie côté Money Vibes est dans `apprentissage-service` (AD-2) ; la console n'a pas de chemin déclaré pour la lire.

---

## 5. Synthèse par exigence demandée

| Sujet de la mission | État |
|---|---|
| Découpage, propriétaires | couvert (AD-2), sauf plans d'installation contre plans de promotion (E-11) |
| Flux agent vers partie A, commandes du DSI | **absent** (E-03) |
| Horloges | AD-5/AD-6 couvrent la scellée et le port ; manquent la date limite d'interrupteur, le retour arrière 7 j, la vague (E-13, E-14, E-03) |
| Signature, clés | couvert ; règles discrètes de licence et d'urgence manquantes (E-04) |
| Sauvegardes | couvert ; RTO, paliers, clé d'exploitation manquants (E-28) |
| Liaison, supervision | couvert ; contenu réduit (E-19, E-20) |
| Journal | couvert ; chaîne contre pseudonymisation (E-22) |
| Consentements, partie C | partiel (E-06, E-09, E-10) |
| Espaces, rejeu, rafraîchissement | partiel (E-11, E-23, E-24) |
| Vagues | règle absente (E-14) |
| Correctifs 72 h | **absent** (E-01) |
| Fenêtre N-1, fin de maintenance 3 ans, VERSION_FIGEE | **absent** (E-02) |
| GEL | seuil couvert, effets non (E-26, E-03) |
| Essai prospect et effacement | **absent** (E-07) |
| Interrupteurs | partiel (E-13) |
| AVEC_PERTE | comportement de retour couvert ; interdiction plateforme et « jamais en vague » absents (E-11, E-25) |
| NFR-5, NFR-9 | non traités (E-17, E-16) |
| Support | couvert (E-29) |
| IA du client intouchable (FR-24) | référence pendante (E-08) |
| Montage (FR-25) | partiel (E-27) |
| Indicateurs SM-n mesurables | SM-3, SM-6, SM-7 sans mécanisme (E-17, E-18) |
