# Revue « reconcile inputs » : la spine Connecteurs face à son PRD

Périmètre : chaque conséquence testable de FR-1 → FR-21, NFR-1 → NFR-6, SM-1 → SM-5 et contre-indicateurs, chaque clause C1 → C13 du §7, QK-1 → QK-20 et A-1 → A-15 du PRD `prd-connecteurs-2026-11-10` (et son `.memlog.md`), contrôlés contre `ARCHITECTURE-SPINE.md` (AD-1 → AD-32, conventions, Seed, Deferred), le manifeste `connecteurs.manifest.ts` et le `.memlog.md` de la spine (D-1 → D-19, retenues par défaut).

Règle de lecture : une contradiction voulue doit être déclarée en AD-31 ET justifiée au `.memlog` (D-n). « contredite (déclarée) » = les deux. « contredite (NON déclarée) » = justifiée au `.memlog` mais absente d'AD-31 (ou absente des deux). Une ligne « couverte » peut regrouper plusieurs puces (colonne « Exigence »).

## Bilan chiffré

| Verdict | Puces |
|---|---|
| couverte | 154 |
| partielle | 24 |
| absente | 1 |
| contredite (déclarée) | 7 |
| contredite (NON déclarée) | 7 |
| **Total** | **193** |

Inventions (règles de la spine sans appui dans le PRD ni dans un D-n) : 11, détaillées en fin de rapport.

Constat d'ensemble : la spine couvre l'essentiel et ses cinq écarts voulus au PRD sont déclarés (février, ordre par objet, correction vers chaque logiciel, contrats renommés, route d'échange en lecture seule). Quatre autres écarts sont justifiés au `.memlog` mais ne figurent pas en AD-31 : la configuration hors de la console (D-10), le stock disponible sans lecture synchrone (D-5), la lecture seule prouvée par le droit natif (D-12) et l'écart « résorbé » (D-18). Deux écarts ne sont dans aucun D-n : la marche en parallèle après la mise en service pour FR-3 / UJ-8 (D-9 ne cite que le PRD Reprise) et le point de relais scindé en deux (FR-20). Une seule exigence est absente : l'avertissement de désinstallation de C9.

## Tableau de réconciliation

| # | Source (FR-n, puce) | Exigence | Verdict | Où dans la spine | Correction proposée |
|---|---|---|---|---|---|
| P-1 | FR-1, puce 1 | Le connecteur parle à Odoo, à l'API du logiciel d'une IMF et, sans API, à un export du logiciel du client | partielle | AD-23 (Odoo), AD-24 (export), Deferred (IMF) | L'adaptateur `api` de l'IMF n'a aucune règle ni ligne du Structural Seed (seuls `odoo` et `export` y sont). Ajouter `src/adaptateurs/api/` au Seed, marqué « différé (QK-18) », avec l'interface `AdaptateurEcriture` comme seul contrat. |
| P-2 | FR-1, puce 2 | Paquet d'adaptateurs commun à la Reprise et à Connecteurs ; l'export est un adaptateur déclaré partagé des deux côtés | couverte | Inherited (AD-18 du moteur), AD-23, AD-24, Seed | — |
| P-3 | FR-1, puce 3 | Identifiants propres à chaque module ; rien ne se recopie sans acte tracé | couverte | AD-22 (« ceux de la Reprise sont les siens ») | — |
| P-4 | FR-1, puce 4 | Identifiants chiffrés, restent sur l'instance | couverte | AD-22 | — |
| P-5 | FR-1, puce 5 | Interrogation sortante seulement ; aucun événement poussé ; webhook renvoyé à la spine | couverte | AD-P18 hérité, Déploiement, Deferred (webhook), AD-7 | — |
| P-6 | FR-2, puce 1 (où) | L'intégrateur fixe les propriétaires « dans la console », domaine par domaine, dans l'espace d'essai | contredite (NON déclarée) | AD-28, D-10 | AD-28 met la configuration dans le module d'écran `connecteurs` (plateforme et site) et ne laisse à la console que la vue du parc. D-10 le justifie, mais AD-31 ne le dit pas, alors que le PRD (FR-2, UJ-8, C8) dit « console ». Ajouter une ligne à AD-31 : « PRD FR-2, UJ-8, C8 : la configuration vit dans le module d'écran, la console garde la vue du parc (D-10) ». |
| P-7 | FR-2, puce 1 (dossier) | Réglages dans le dossier d'installation, rejoués dans le réel à la mise en service | couverte | AD-19 | — |
| P-8 | FR-2, puce 2 | Le propriétaire a toujours raison ; l'autre ne fait que recevoir | couverte | AD-3, AD-10 (la cible reçoit, ne refuse que référence ou schéma) | — |
| P-9 | FR-2, puce 3 | Donnée d'un domaine extérieur non modifiable directement : un mouvement « en attente de confirmation » | couverte | AD-11, AD-P18 | — |
| P-10 | FR-2, puce 4 | Changer le propriétaire : acte tracé, concordance avant, aucun écart ouvert pour l'argent (A-2) | couverte | AD-3 (ajoute une règle non demandée : voir Inventions I-1) | — |
| P-11 | FR-3, puce 1 | Construit comme s'il était permanent | couverte | AD-3 (mode = attribut sans effet sur les règles d'échange) | — |
| P-12 | FR-3, puce 2 | Module commercial : ligne au catalogue, ajouté d'office, inclus dans la plateforme complète | couverte | AD-27 | — |
| P-13 | FR-3, puce 3 | Mode temporaire : marche en parallèle, écart nul, mise en service, puis arrêt de la synchro domaine par domaine | contredite (NON déclarée) | AD-15, AD-3, D-9 | La spine place la marche en parallèle APRÈS la mise en service (D-9). AD-31 ne déclare que PRD Reprise FR-17 ; or le PRD Connecteurs FR-3 (ordre « parallèle, écart nul, mise en service »), UJ-8 et §1 disent le contraire. Ajouter FR-3, UJ-8 et FR-9 (« prolonge la marche en parallèle ») à la ligne « PRD Connecteurs » d'AD-31. |
| P-14 | FR-3, puce 4 | Arrêt de la synchro d'un domaine d'argent refusé tant qu'un écart est ouvert ; concordance sans écart juste avant | couverte | AD-3 (`ECART_OUVERT`) | — |
| P-15 | FR-3, puce 5 | Mode permanent : le client garde son logiciel pour ce que Prospera ne couvre pas | couverte | AD-3 (mode), AD-2 | — |
| P-16 | FR-3, puce 6 | Le mode découle de l'offre ; la console le propose, l'intégrateur le confirme | couverte | AD-3 (« proposé depuis l'offre et confirmé ») | — |
| P-17 | FR-4, puce 1 | Mouvements, jamais un total | couverte | AD-4 | — |
| P-18 | FR-4, puce 2 | Deux saisies simultanées dans les deux logiciels s'additionnent | partielle | AD-4 (MOUVEMENT additif), Conventions Tests | La règle est posée, mais la ligne Tests n'a pas le test « deux saisies simultanées s'additionnent ». L'ajouter (suite de conformité de l'échange). |
| P-19 | FR-4, puce 3 | Identifiant unique par mouvement ; idempotence | couverte | AD-5, NFR-1 | — |
| P-20 | FR-4, puce 4 | Prix et attributs : dernier effet daté ; stock disponible calculé par le propriétaire et lu | couverte | AD-4 (OBJET_DATE, LECTURE) | — |
| P-21 | FR-5, tableau | Trois niveaux, chacun avec ses données : immédiat (remboursements, encaissements, blocage de crédit, stock disponible), heure (clients, produits, prix), nuit (écritures, historique pour l'IA, concordance, états BCEAO) | partielle | AD-2 (`niveauParDefaut` par domaine), AD-7 | L'affectation donnée → niveau n'est écrite nulle part (elle est laissée aux manifestes des cibles). « Blocage de crédit », « historique pour l'IA » et « préparation des états BCEAO » ne sont nulle part. Ajouter la table d'affectation par défaut dans `repartitions/*.json` et citer ces trois cas. |
| P-22 | FR-5, tableau | Immédiat : 5 minutes au plus avec API | couverte | AD-7 (60 s), SM-3 | — |
| P-23 | FR-5, tableau | Immédiat : « stock disponible au moment de valider une commande, lu chez le propriétaire du stock » | contredite (NON déclarée) | AD-4 dernière puce, Deferred, D-5 | La spine refuse toute lecture synchrone chez le propriétaire à la validation (D-5) et lit une valeur `LECTURE` relevée toutes les 60 s. C'est voulu et justifié (D-5, Deferred), mais AD-31 ne le déclare pas. Ajouter une ligne « PRD FR-5 : le stock disponible se lit sur la valeur relevée à 60 s, pas chez le propriétaire à la validation ». |
| P-24 | FR-5, puce 1 | Chaque domaine porte son niveau | couverte | AD-2 | — |
| P-25 | FR-5, puce 2 | Données de nuit avant 6 h, sur l'heure de référence et dans le fuseau de l'organisation (A-3) | couverte | AD-7, AD-15 | — |
| P-26 | FR-5, puce 3 | Prix sans date d'effet refusé avec son motif (A-4) | couverte | AD-4 (`DATE_EFFET_ABSENTE`), AD-9 | — |
| P-27 | FR-5, puce 4 | Dernier effet daté, sans addition | couverte | AD-4 (`INCHANGE` / `EFFET_ANTERIEUR`) | — |
| P-28 | FR-6, puce 1 | Tout mouvement saisi pour un domaine extérieur entre dans la file d'envoi | couverte | AD-8, AD-11 | — |
| P-29 | FR-6, puce 2 | Au retour de la connexion, départ dans l'ordre, sans doublon | couverte | AD-6, AD-8, AD-5 (ordre par objet : XD, voir NFR-2) | — |
| P-30 | FR-6, puce 3 | La file survit à un redémarrage | couverte | AD-1, AD-8 (Mongo) | — |
| P-31 | FR-6, puce 4 | État d'envoi par mouvement (en attente, envoyé, confirmé, refusé), relu par la version précédente | couverte | AD-8, AD-25 | — |
| P-32 | FR-6, puce 5 | Lecture seule : file figée ; essai : interceptée | couverte | AD-8 (`FIGE`, `INTERCEPTE`), AD-18, AD-21 | — |
| P-33 | FR-7, puce 1 | Chaque refus avec sa raison en clair | couverte | AD-9 | — |
| P-34 | FR-7, puce 2 | « Corriger et renvoyer » dans `<Ecriture>` ; fermé en lecture seule, consultation ouverte | couverte | AD-9, AD-21, AD-28 (restreint la correction : voir Inventions I-5) | — |
| P-35 | FR-7, puce 3 | Un refus n'est jamais ignoré, visible tant qu'il n'est pas traité | couverte | AD-9 | — |
| P-36 | FR-8, puce 1 | Solde ou encaissement différent : correction automatique interdite | couverte | AD-13 | — |
| P-37 | FR-8, puce 2 | Écart en file, deux valeurs côte à côte, sources | couverte | AD-13, AD-28 | — |
| P-38 | FR-8, puce 3 | Une personne habilitée tranche ; droit de tenant (C7) | couverte | AD-14, AD-27 | — |
| P-39 | FR-8, puce 4 | Décision tracée (qui, quand, valeur retenue, motif) ; « la correction part vers le propriétaire » | contredite (déclarée) | AD-14, D-17, AD-31 (ligne FR-8) | Déclarée : la correction part vers chaque logiciel dont la valeur diffère. Rien à corriger. |
| P-40 | FR-8, puce 5 | Trancher dans `<Ecriture>` ; en lecture seule, consultables non tranchables | couverte | AD-14 | — |
| P-41 | FR-8, puce 6 | Un écart ouvert bloque l'arrêt de la synchro d'un domaine d'argent | couverte | AD-3 | — |
| P-42 | FR-9, puce 1 | Chaque nuit avant 6 h, comparaison globale des totaux (stock par entrepôt, encours par agence) | couverte | AD-13, AD-15 (la spine compare objet par objet et agrège dans le rapport : plus fin que le PRD, compatible) | — |
| P-43 | FR-9, puce 2 | Toute discordance entre dans la file des écarts | couverte | AD-13 (mais un écart peut se fermer `RESORBE` : voir ligne suivante) | — |
| P-44 | FR-9 / vocabulaire « écart » | Un écart attend « une décision humaine » (§3) ; il se ferme par décision | contredite (NON déclarée) | AD-13, D-18 | D-18 : un écart dont les valeurs se rejoignent se ferme `RESORBE`, sans décision. Ce n'est pas une correction, donc NFR-3 tient, mais c'est un écart au vocabulaire et à FR-8. AD-31 ne le déclare pas. Ajouter une ligne à AD-31 et exiger la trace `connecteurs.ecart.resorbe` visible dans la file (déjà au journal). |
| P-45 | FR-9, puce 3 | Prolonge sans intervention humaine la marche en parallèle de la Reprise | couverte | AD-15 | — |
| P-46 | FR-9, puce 4 | La file des écarts fait foi pour l'arrêt ; le feu vert de la Reprise est une AUTRE condition, non lue dans cette file (A-5 rejetée) | partielle | AD-15 dernière puce, AD-3 | AD-15 écrit « l'écart nul de la période conditionne l'arrêt de la synchro » en construisant le rapport de la période sur la concordance de Connecteurs : les deux conditions se confondent. Écrire en AD-3 ou AD-15 : « l'arrêt exige (a) aucun écart ouvert dans la file de Connecteurs ET (b) le feu vert de la Reprise, lu par son propre fait ; (b) ne se lit pas dans la file ». |
| P-47 | FR-10, puce 1 | Une panne ne bloque aucun écran ni saisie ; test : panne simulée puis commande, encaissement, visite sans erreur bloquante | partielle | AD-4 dernière puce, AD-11 dernière puce | La règle est là (aucune lecture synchrone sur le chemin d'une saisie), le test exigé par le PRD n'est pas dans la ligne Tests. L'ajouter. |
| P-48 | FR-10, puce 2 | `DEGRADE` dès qu'un domaine est rouge ou le logiciel injoignable plus de 30 min (A-6) ; jamais de fermeture | couverte | AD-17 (ajoute « ou Redis indisponible » : Inventions I-6) | — |
| P-49 | FR-10, puce 3 | La mention de Kodjo vient de la fraîcheur de la donnée, pas de la santé | couverte | AD-16 (par domaine), AD-17 | — |
| P-50 | FR-11, puce 1 | Mention d'une ligne, ne masque ni ne bloque, ne repose pas sur la seule couleur | couverte | AD-16, coque AD-7 (rendu par la coque) | — |
| P-51 | FR-11, puce 2 | Le module publie date du dernier échange, niveau, source ; la coque rend avec `<Fraicheur>` ; le module ne rend rien | couverte | AD-16, AD-8 | — |
| P-52 | FR-11, puce 3 | Seuils : table unique de la coque (immédiat 5/15 min ; heure 1/3 h ; nuit rouge à 6 h) | contredite (déclarée) | AD-16, D-11, AD-31 (ligne coque) | Les valeurs sont reprises à l'identique ; la « table unique de la coque » devient un contrat `seuils-fraicheur@1` lu aussi par Connecteurs. Déclaré. Rien à corriger. |
| P-53 | FR-11, puce 3 (message d'action) | Message d'action dès l'orange (immédiat, heure) et dès 6 h (nuit) | partielle | AD-16 (« message dès 06 h » seulement) | Le message dès l'orange n'est pas écrit. Ajouter au contrat `seuils-fraicheur@1` un champ `messageDes` par niveau. |
| P-54 | FR-11, puce 4 | Pour l'argent, la mention dit quoi faire ; clef de libellé d'action par domaine | couverte | AD-2 (`cleLibelleAction`), AD-16 | — |
| P-55 | FR-11, puce 5 | Sans API : niveau immédiat impossible, affiché `EXPORT` | couverte | AD-16 (`NIVEAU_IMPOSSIBLE_SANS_API`), AD-24 | — |
| P-56 | FR-11, puce 6 | Lecture seule : l'entrant continue, la mention reste | couverte | AD-21, AD-16 | — |
| P-57 | FR-12, puces 1 à 3 | Bandeau « N commandes en attente d'envoi vers Odoo », rendu par la coque ; le module publie la longueur de file et le domaine ; visible des détenteurs de `connecteurs:file:consulter` (A-7) | couverte | AD-8, AD-16 (amende la coque AD-7, déclaré en AD-31) | — |
| P-58 | FR-13, puce 1 | Plateforme : la console montre l'état de chaque connecteur ; l'alerte de Money Vibes part au plus tard à 30 min, avant le client | couverte | AD-17, AD-28 (vue du parc) | — |
| P-59 | FR-13, puce 2 | Ensuite l'administrateur du client, par WhatsApp ou e-mail, après plus de 30 min | couverte | AD-17, `notification-service` | — |
| P-60 | FR-13, puce 3 | Données de nuit absentes à 6 h : l'administrateur est prévenu | couverte | AD-15, AD-17 (`connecteurs.nuit.absente`) | — |
| P-61 | FR-13, puce 4 | Sur site : seuls des compteurs remontent par le contrôle quotidien (état, niveau de fraîcheur, file, refus, écarts) ; schéma fermé sans donnée métier | partielle | AD-17 dernière puce | La liste d'AD-17 (envoyés, refusés, écarts ouverts, file, dernier échange, santé) suit QK-20 mais oublie le « niveau de fraîcheur » de FR-13. Ajouter `niveau` par domaine à la liste et au schéma fermé. |
| P-62 | FR-13, puce 5 | Sur site : alerte à l'administrateur sur l'instance à 30 min ; la console ne montre ni refus ni écarts au contenu métier | couverte | AD-17, AD-28 | — |
| P-63 | FR-13, puce 6 / QK-20 | Les champs du connecteur s'ajoutent au schéma de FR-26 du moteur | partielle | AD-17, AD-31 (ligne moteur AD-12, AD-17) | AD-31 liste le `type` du journal mais pas l'ajout des compteurs au schéma fermé (moteur AD-9, FR-26). Ajouter la ligne. |
| P-64 | FR-14, tableau | Répartition par défaut du distributeur avec Odoo ; propriétaire pour chaque domaine | couverte | AD-2 (`repartitions/distributeur-odoo.json`), D-4 | — |
| P-65 | FR-14, puce 1 | La répartition est une proposition ajustable par l'intégrateur | couverte | AD-2 | — |
| P-66 | FR-14, puce 2 | La console refuse de mettre en service un domaine sans propriétaire | couverte | AD-2 (`DOMAINE_SANS_PROPRIETAIRE`) | — |
| P-67 | FR-14, Odoo, puce 1 | Détecte version et édition, les affiche au bilan | couverte | AD-23 | — |
| P-68 | FR-14, Odoo, puce 2 | Deux API : XML-RPC / JSON-RPC présente dans toutes les versions, et JSON-2 dès qu'elle existe | partielle | AD-23, D-16, Deferred | XML-RPC est différé : une version d'Odoo sans `/jsonrpc` n'est donc pas servie, alors que QK-1 dit « TOUTES les versions ». Le report est justifié (D-16) mais absent d'AD-31. Ajouter une ligne à AD-31 (« QK-1 : XML-RPC différé jusqu'à la première version qui en a besoin »). |
| P-69 | FR-14, Odoo, puce 3 | Générations de modèles (`account.invoice` ≤ 12, `account.move` ≥ 13) | couverte | AD-23 (profils de version en données) | — |
| P-70 | FR-14, Odoo, puce 4 | Odoo personnalisé : tables de correspondance créées par la Reprise, copiées à la cession | couverte | AD-5, AD-20 | — |
| P-71 | FR-14, Odoo, puce 5 | Odoo Online : plan Custom en prérequis du manifeste, vérifié, avec l'action à faire | partielle | AD-23, AD-27, manifeste (`prerequis`) | Le prérequis est déclaré ; l'« action à faire si le client n'y est pas » ne l'est pas (le manifeste n'a que `description`). Ajouter un champ `action` au prérequis du manifeste. |
| P-72 | FR-14, Odoo, puce 6 | Version détectée et droits du compte vérifiés (C13) | couverte | AD-23, manifeste | — |
| P-73 | FR-14, Odoo, puce 7 | Matrice de tests par version rencontrée ; version jamais testée signalée sans refus (A-9) | couverte | AD-23 | — |
| P-74 | FR-15, puce 1 | Le logiciel de l'IMF est propriétaire de l'argent (prêts, soldes, épargne) | couverte | AD-2 (`repartitions/imf.json`), AD-4 | — |
| P-75 | FR-15, puce 2 | Prospera propriétaire de ce qu'il crée sur le terrain (visites, promesses, comptes-rendus, GPS) | couverte | AD-2 (`imf.json`) | — |
| P-76 | FR-15, puce 3 | Remboursement saisi sur le terrain « en attente de confirmation », ne modifie aucun solde avant | couverte | AD-11 | — |
| P-77 | FR-15, puce 4 | Autres domaines par défaut (clients, garanties, KYC) (A-8) | couverte | AD-2 (`imf.json`) | — |
| P-78 | FR-15, puce 5 | Séquence : la Reprise amorce, Connecteurs prend le relais ; pas de date (A-1) | partielle | AD-20, Deferred (IMF) | Le relais est décrit, mais l'adaptateur `api` de l'IMF n'est pas dessiné (voir FR-1, puce 1). Aucune autre correction. |
| P-79 | FR-16, puce 1 | Assureur : même règle ; répartition fixée après examen de son logiciel ; non requis en février | couverte | Deferred, AD-32 | — |
| P-80 | FR-17, tête | Requis en février pour l'Odoo du distributeur ; SM-5 « étapes 1 à 3 en service » | contredite (déclarée) | AD-32, D-1, AD-31 (ligne 1) | Déclarée : aucun client de février ne garde son logiciel. Rien à corriger. |
| P-81 | FR-17, étapes 1 et 2 | Étape 1 clients et produits avec prix (relais à un point daté) ; étape 2 stock en lecture | couverte | AD-32, AD-20 | — |
| P-82 | FR-17, étape 3 | Factures et encaissements vers la comptabilité Odoo, livrés avec la file des écarts et l'écran de santé | couverte | AD-32 | — |
| P-83 | FR-17, dernière puce | La comptabilité dans l'autre sens (Odoo vers Prospera) attend | partielle | AD-32 (rien), Deferred (rien) | Ni AD-32 ni Deferred ne le disent. Ajouter une ligne à Deferred : « écritures comptables d'Odoo vers Prospera : Odoo en est propriétaire, rien à recevoir avant un besoin ». |
| P-84 | FR-18, liste blanche | Écriture vers le logiciel du client en essai : destination déclarée, sinon interceptée ; journal des interceptions en ajout seul, consultable | couverte | AD-18 | — |
| P-85 | FR-18, bac à sable | Vérifié : confirmation écrite du client ET base distincte constatée ; vérification tracée ; rien reçu avant | couverte | AD-18, manifeste (`bac-a-sable`) | — |
| P-86 | FR-18, cascade | Bac à sable vérifié, sinon interception ; interception forcée possible ; le réel, jamais | couverte | AD-18 | — |
| P-87 | FR-18, identifiants lecture seule | À leur déclaration « une écriture de test est tentée » ; refusée sinon rejetés | contredite (NON déclarée) | AD-18, D-12 | La spine remplace l'écriture de test par le contrôle de droits natif quand il existe (D-12 : « précise FR-18 »). L'écriture de test ne reste qu'en repli. Ce n'est pas dans AD-31. Ajouter la ligne : « PRD FR-18 : contrôle de droits natif d'abord, écriture de test seulement sans contrôle natif ». |
| P-88 | FR-18, jamais d'écriture du réel | `ECRITURE_REELLE_DEPUIS_ESSAI` rendu côté serveur, quel que soit l'écran | couverte | AD-18, Conventions Tests | — |
| P-89 | FR-18, aller-retour | Vérification aller-retour : 1 objet écrit puis relu à l'identique, clef d'idempotence propre, identité du moteur ; 🟠 en essai si intercepté | couverte | AD-18, manifeste (`aller-retour`) | — |
| P-90 | FR-18, masquage | Aucune donnée personnelle réelle dans un bac à sable sans accord écrit ; champs masqués | couverte | AD-18 | — |
| P-91 | FR-18, prospect | Prospect : lecture seule, identifiants dédiés, écritures toujours interceptées, pas de bac à sable sans Money Vibes | couverte | AD-18 | — |
| P-92 | FR-18, isolation | Seul flux essai vers réel : le dossier (réglages, tables) ; jamais identifiants, files, écarts, journal | couverte | AD-19 | — |
| P-93 | FR-18, effacement | Effacement : identifiants, files, écarts, copies, tables ; journal pseudonymisé ; certificat | couverte | AD-26 | — |
| P-94 | FR-18, qui lit quoi (A-10) | La Reprise lit le vrai logiciel en lecture seule avec ses identifiants ; aucun bac à sable lu par la Reprise | partielle | AD-22 (jeux distincts) | La spine sépare les jeux d'identifiants mais n'écrit pas que la Reprise ne lit jamais le bac à sable. Ajouter une phrase à AD-18 (ou renvoyer à la spine de la Reprise). |
| P-95 | FR-19, matrice (9 états) | Un attendu par état et par sens : NON_INSTALLE, EN_INSTALLATION, EN_SERVICE, ESSAI_PROSPECT, PREAVIS, LECTURE_SEULE, SUSPENDU, ESSAI_TERMINE, DESINSTALLE ; export | couverte | AD-21, AD-10 (garde de la cible) | — |
| P-96 | FR-19, puce 1 | En lecture seule : GET/HEAD/OPTIONS passent ; écriture refusée `ABONNEMENT_EXPIRE` sauf routes déclarées ; entrant continue | contredite (déclarée) | AD-21, AD-10, D-19, AD-31 (ligne C2) | Déclarée : la route d'échange de la cible reste ouverte en lecture seule pour l'entrant. Rien à corriger. |
| P-97 | FR-19, puce 2 | Au paiement, la file figée reprend dans l'ordre sans doublon | couverte | AD-21 | — |
| P-98 | FR-19, puce 3 | SUSPENDU et ESSAI_TERMINE : tout fermé sauf l'export | couverte | AD-21 | — |
| P-99 | FR-19, puce 4 | GEL et VERSION_FIGEE ne changent rien | couverte | AD-21 | — |
| P-100 | FR-19, puce 5 | Prérequis perdu : état publié gardé, santé `DEGRADE` | couverte | AD-21 | — |
| P-101 | FR-19, puce 6 | Test : la matrice des neuf états sur `CONNECTEURS_NOT_ENTITLED`, chaque sens | couverte | AD-21, Conventions Tests | — |
| P-102 | FR-20, puce 1 | Tables de correspondance créées par la Reprise, copiées au démarrage, Connecteurs seul propriétaire ; sans Reprise : tables vides, dit au bilan | couverte | AD-20, Reprise AD-20 | — |
| P-103 | FR-20, puce 2 | Produits, prix, stock : relais à un point daté ; les mouvements antérieurs ne sont pas rejoués ; pas de doublon avec le lot | contredite (NON déclarée) | AD-20 (point de coupure = début de l'extraction) | Le PRD a UN point de relais (= mise en service, A-11 modifiée). La spine en a deux : le domaine passe `ACTIF` à la mise en service, mais le premier relevé repart du début de l'extraction (point de coupure). Les changements faits chez le client entre l'extraction et la mise en service SONT donc rejoués (reconnus par clé d'origine). Choix défendable, issu de la Reprise (P-47), non déclaré. Ajouter à AD-31 : « PRD FR-20 : le point de relais se scinde en point de coupure (début de l'extraction, curseur) et mise en service (démarrage) ». |
| P-104 | FR-20, puce 3 | La synchro démarre à la mise en service du sous-ensemble, pas à la réception définitive (A-11 modifiée) | couverte | AD-20 | — |
| P-105 | FR-20, puce 4 | Stock d'ouverture : comptage saisi dans la Reprise, livré à Stock, part vers Odoo comme ajustement « en attente » | couverte | AD-20 | — |
| P-106 | FR-20, puce 5 | Le connecteur ne reprend pas les identifiants de la Reprise ; la Reprise retire les siens à la réception définitive | partielle | AD-22 | Le premier point est couvert ; le retrait par la Reprise n'est écrit nulle part ici. Renvoyer à la spine de la Reprise ou l'ajouter à AD-20. |
| P-107 | FR-21, puces 1 et 2 | Un retour arrière ne défait rien chez le client ; `SANS_PERTE` côté Prospera ; état d'envoi relu par la version précédente | couverte | AD-25, AD-8 | — |
| P-108 | FR-21, puce 3 | Mouvements inverses proposés, jamais automatiques | couverte | AD-25 | — |
| P-109 | FR-21, puce 4 | Déduplication déclarée par adaptateur, vérifiée par le test de conformité | couverte | AD-5, AD-23, AD-25 | — |
| P-110 | FR-21, puce 5 | File suspendue pendant la fenêtre de 7 jours tant que le DSI n'a pas confirmé | couverte | AD-25 (`connecteurs:file:reprendre`, D-14) | — |
| P-111 | FR-21, puce 6 | Interrupteurs (JSON-2, comportement des adaptateurs) ; jamais de changement de forme | couverte | AD-25, manifeste | — |
| P-112 | NFR-1 | Un mouvement reçu ou envoyé deux fois ne s'applique qu'une fois | couverte | AD-1, AD-5, AD-8, AD-10 | — |
| P-113 | NFR-2 | Au sein d'un domaine, les mouvements s'appliquent dans l'ordre de leur création | contredite (déclarée) | AD-6, D-6, AD-31 (ligne 2) | Déclarée : ordre par objet et dépendances. Rien à corriger. |
| P-114 | NFR-3 | Aucun chemin de code ne corrige automatiquement un solde ou un encaissement ; test de mutation | couverte | AD-13 (test de mutation), AD-30 | — |
| P-115 | NFR-4 | File d'envoi et file des écarts survivent à un redémarrage | couverte | AD-1, AD-8, AD-13 (Mongo), Conventions Tests | — |
| P-116 | NFR-5 | Sur site, rien de métier chez Money Vibes ; compteurs à schéma fermé | couverte | AD-17 | — |
| P-117 | NFR-6 | Propriétaires, arrêts, refus, décisions, écritures interceptées journalisés en ajout seul | couverte | AD-29 (liste des `type`), AD-18 | — |
| P-118 | SM-1 | Corrections d'argent automatiques : 0 | couverte | AD-30, AD-13 | — |
| P-119 | SM-2 | Mouvements perdus ou doublés : 0 | partielle | AD-30 (« concordance et dédoublonnage ») | Comment compte-t-on un mouvement PERDU ? La concordance voit une valeur différente, pas un mouvement manquant. Ajouter : rapprochement des `mouvementId` émis par la cible et confirmés par le propriétaire, compté chaque nuit. |
| P-120 | SM-3 | ≥ 95 % des mouvements immédiats dans le délai (A-12) | couverte | AD-30 | — |
| P-121 | SM-4 | 100 % des concordances finies avant 6 h | couverte | AD-30, AD-15 | — |
| P-122 | SM-5 | Connecteur Odoo de février en service, étapes 1 à 3 | contredite (déclarée) | AD-32, D-1, AD-31 | Déclarée (aucun client de février ne garde son logiciel). Rien à corriger. |
| P-123 | Contre-indicateur 1 | Écarts restés plus de 48 h sans décision (A-13) | couverte | AD-30 | — |
| P-124 | Contre-indicateur 2 | Refus non traités depuis plus de 24 h (A-13) | couverte | AD-30 | — |
| P-125 | Contre-indicateur 3 | Pannes découvertes par le client avant Money Vibes (sur site : délai du contrôle quotidien) | couverte | AD-30, AD-17 | — |
| P-126 | C1 | Manifeste commercial, `depends: []`, `enrichiPar`, prérequis, vérifications, `retourArriere`, interrupteurs, `routesLectureSeule`, routes d'export, droits | couverte | AD-27, `connecteurs.manifest.ts` | Détail : le PRD demande une « raison » pour chaque `enrichiPar` ; le manifeste ne la porte qu'en commentaire. Ajouter la raison par entrée si le format C1 l'exige. |
| P-127 | C2 | Garde, cloisonnement, `CONNECTEURS_NOT_ENTITLED`, état publié poussé, `LECTURE_SEULE`, export ouvert, identité du moteur sur les vérifications | couverte | AD-21, AD-10, AD-18 | — |
| P-128 | C3 | Service distinct ; possède ses données ; contrat de mouvements nommé ; n'écrit chez aucun module ; l'import de masse reste à la Reprise | couverte | AD-1, AD-10 (route de la cible), AD-20 | — |
| P-129 | C4 | Module cible absent : domaine « non installé », jamais synchronisé ailleurs | couverte | AD-2 (`NON_INSTALLE`) | — |
| P-130 | C5 | Contrats `mouvements-echange@1`, `fraicheur-domaine@1`, `etat-connecteur@1` | contredite (déclarée) | AD-29, AD-31 (ligne 2), D-7, D-11 | Déclarée : renommés `etat-synchro` et `domainesEchange`, deux contrats retirés. Seul le retrait d'`etat-connecteur@1` (santé, refus, écarts) n'a pas de D-n propre : le justifier au `.memlog` (remplacé par la route de santé et `instance.indicateurs`). |
| P-131 | C6 | Propriétaires, niveaux, correspondances = données par client ; schéma identique pour toutes | couverte | AD-2 | — |
| P-132 | C7 | Droits `connecteurs:<objet>:<action>` : administrer (plateforme), trancher, renvoyer, consulter (tenant) | couverte | AD-27, manifeste (ajoute `file:reprendre`, déclaré D-14 et AD-31) | — |
| P-133 | C8 | Écrans client dans `prospera-app` ; mentions et bandeaux par la coque ; écrans MV (configuration, santé, vue par client) dans la console | contredite (NON déclarée) | AD-28, D-10 | Même contradiction que FR-2, puce 1 : la configuration quitte la console. Non déclarée en AD-31 (voir P ligne FR-2). |
| P-134 | C9, désinstallation | Désinstaller coupe les échanges sans rien supprimer ; file et écarts figés ; à la réinstallation la file figée est présentée à l'intégrateur (A-14) | couverte | AD-21 | — |
| P-135 | C9, avertissement | Avertissement avant désinstallation : « le logiciel du client cessera de recevoir les mouvements de Prospera » | absente | — | Aucun texte d'avertissement. L'ajouter à AD-21 (ou à `etat-synchro`) comme donnée du manifeste lue par la partie A. |
| P-136 | C10 | Profil compose `connecteurs` | couverte | AD-27, Déploiement, manifeste | — |
| P-137 | C11 | Sans objet pour le module (pas de champ `ia`) ; il achemine l'historique de nuit vers les cibles ; rien ne sort sans consentement | partielle | AD-27 (`pas d'ia` implicite), AD-15 | Ni « sans objet C11 », ni l'acheminement de l'historique de nuit pour l'IA ne sont écrits. Ajouter une ligne à AD-27. |
| P-138 | C12 | `SANS_PERTE` ; migrations additives 7 jours ; état d'envoi relu ; inverses proposés ; déduplication ; file suspendue ; interrupteurs | couverte | AD-25 | — |
| P-139 | C13, point 1 | Prérequis : logiciel joignable (< 30 s, A-15), version, droits, plan Custom | couverte | AD-23, manifeste | — |
| P-140 | C13, point 2 | Vérifications chiffrées : version, objets lus, écriture de test acceptée sur bac à sable ou refusée en lecture seule, aller-retour | partielle | AD-18, manifeste (`verifications`) | La vérification `bac-a-sable` du manifeste contrôle la base distincte, pas « une écriture de test acceptée sur bac à sable » (seul l'aller-retour écrit). Ajouter ce critère ou l'attribuer explicitement à `aller-retour`. |
| P-141 | C13, point 3 | Santé `OK | DEGRADE` selon FR-10 | couverte | AD-17 | — |
| P-142 | C13, point 4 | État publié lu | couverte | AD-21 | — |
| P-143 | C13, point 5 | Routes en lecture seule : export, consultation des écarts et refus | couverte | manifeste (`routesLectureSeule`) | — |
| P-144 | C13, point 6 | Interception en essai et `ECRITURE_REELLE_DEPUIS_ESSAI` | couverte | AD-18 | — |
| P-145 | C13, point 7 | Export CSV/JSON, import des réglages, effacement par organisation | couverte | AD-26, AD-19 | — |
| P-146 | C13, point 8 | Clef d'idempotence par vérification | couverte | Conventions (Idempotence) | — |
| P-147 | C13, point 9 | Un prérequis en échec : connecteur rouge, dépendants orange, sans bloquer le reste | partielle | AD-21 dernière puce (santé `DEGRADE` seulement) | Le « rouge et dépendants orange » n'est pas écrit. Renvoyer à la règle du moteur (FR-34) ou la répéter en AD-17. |
| P-148 | QK-1 | Toutes les versions d'Odoo | partielle | AD-23, Deferred (XML-RPC) | Voir FR-14, Odoo, puce 2. |
| P-149 | QK-2 | Propositions du récit gardées + trois améliorations (écarts avec l'étape 3, alerte 6 h, seuils) | couverte | AD-32, AD-15, AD-17, AD-16 | — |
| P-150 | QK-3 | 5 min ; orange au délai, rouge à 3 fois ; 6 h fixe | couverte | AD-16 | — |
| P-151 | QK-4 | Module commercial, ajouté d'office, inclus dans la plateforme complète | couverte | AD-27 | — |
| P-152 | QK-5 | Tables créées par la Reprise, copiées, un seul propriétaire | couverte | AD-20 | — |
| P-153 | QK-6 | Paquet commun, identifiants propres | couverte | AD-22, AD-23 | — |
| P-154 | QK-7 | La Reprise charge, Connecteurs relaie à un point daté | partielle | AD-20 | Voir FR-20, puce 2 (point de relais scindé). |
| P-155 | QK-8 | Retour arrière : écritures laissées, `SANS_PERTE`, inverses proposés, file suspendue | couverte | AD-25 | — |
| P-156 | QK-9 | Écart ouvert bloque l'arrêt d'un domaine d'argent | couverte | AD-3 | — |
| P-157 | QK-10 | Prospect : lecture seule, identifiants dédiés, interception | couverte | AD-18 | — |
| P-158 | QK-11 | Sur site : compteurs seuls ; alerte admin sur l'instance | couverte | AD-17 | — |
| P-159 | QK-12 | Fraîcheur et bandeaux rendus par la coque | couverte | AD-16, AD-31 (coque) | — |
| P-160 | QK-13 | Comportement en `LECTURE_SEULE`, `SUSPENDU`, `ESSAI_TERMINE` | couverte | AD-21 | — |
| P-161 | QK-14 | Stock d'ouverture : comptage saisi, ajustement en attente | couverte | AD-20 | — |
| P-162 | QK-15 | Deux services + bibliothèque d'adaptateurs | couverte | Inherited AD-18, Seed | — |
| P-163 | QK-16 | AD-P18 : autorité métier extérieure, mouvements en attente, coque affiche « en attente » | couverte | AD-11 (`<ProtectionObjet>`), Inherited AD-P18 | — |
| P-164 | QK-17 | Assureur : répartition ouverte | couverte | Deferred, AD-32 | — |
| P-165 | QK-18 | Date du connecteur IMF : ouverte | couverte | Deferred, AD-32 | — |
| P-166 | QK-19 | Pas de webhook en v1 ; interrogation sortante | couverte | Deferred, AD-7 (60 s) | — |
| P-167 | QK-20 | Compteurs ajoutés au schéma de FR-26 du moteur | partielle | AD-17, AD-31 | Voir FR-13, puce 6. |
| P-168 | A-1 | Connecteur IMF sans date | couverte | Deferred | — |
| P-169 | A-2 | Aucun écart ouvert pour changer le propriétaire d'un domaine d'argent | couverte | AD-3 | — |
| P-170 | A-3 | 6 h = heure de référence, fuseau de l'organisation | couverte | AD-7, AD-15 | — |
| P-171 | A-4 | Prix sans date d'effet refusé | couverte | AD-4 | — |
| P-172 | A-5 (rejetée) | Le feu vert de la Reprise ne se lit pas dans la file des écarts | partielle | AD-15 | Voir FR-9, puce 4. |
| P-173 | A-6 | `DEGRADE` : domaine rouge ou injoignable plus de 30 min | couverte | AD-17 | — |
| P-174 | A-7 | Noms des droits ; bandeau pour `connecteurs:file:consulter` | couverte | AD-27, AD-16 | — |
| P-175 | A-8 | Propriétaires par défaut des domaines ajoutés | couverte | AD-2 (données `repartitions/`) | — |
| P-176 | A-9 | Version d'Odoo jamais testée signalée sans refus | couverte | AD-23 | — |
| P-177 | A-10 | La Reprise ne lit pas le bac à sable | partielle | AD-22 | Voir FR-18, qui lit quoi. |
| P-178 | A-11 (modifiée) | La synchro démarre au point de relais = mise en service ; la Reprise retire ses identifiants à la réception définitive | partielle | AD-20 | Démarrage couvert ; retrait des identifiants non écrit (voir FR-20, puce 5) ; point de relais scindé (voir FR-20, puce 2). |
| P-179 | A-12 | SM-3 ≥ 95 % | couverte | AD-30 | — |
| P-180 | A-13 | 48 h pour les écarts, 24 h pour les refus | couverte | AD-30 | — |
| P-181 | A-14 | Réinstallation : la file figée est présentée, rejouée ou écartée | couverte | AD-21 | — |
| P-182 | A-15 | « Joignable » = lecture de test en moins de 30 s | couverte | AD-23, manifeste | — |

## Inventions

Règles écrites par la spine, sans appui dans le PRD ni dans une décision D-n. Aucune n'est dangereuse ; chacune doit soit être consignée au `.memlog`, soit être retirée.

| # | Où | Règle | Pourquoi c'est une invention | Correction proposée |
|---|---|---|---|---|
| I-1 | AD-3 | Changer le propriétaire est refusé si la file d'envoi du domaine n'est pas vide (`MOUVEMENTS_EN_ATTENTE`) ; le connecteur passe `TERMINE` et ses identifiants sont effacés au dernier domaine arrêté (aussi AD-22). | Aucun appui dans le PRD (FR-2 ne demande que concordance et écart nul) ni dans un D-n. Règle de sécurité plausible, mais elle bloque un changement légitime tant qu'un mouvement attend. | Garder, ajouter D-20 « file vide exigée avant changement de propriétaire ; identifiants effacés à l'arrêt du dernier domaine », contestable dans la PR. |
| I-2 | AD-1 | Bail par (organisation, connecteur, domaine, sens) avec jeton de fencing croissant ; reprises bornées à attente croissante. | Aucun appui dans le PRD ni dans D-3 (qui cite queue_job et l'acquittement dans Mongo, pas le bail). | Garder comme détail technique ; l'ajouter à D-3 pour qu'il ne soit pas découvert en revue de code. |
| I-3 | AD-7, AD-15 | Valeurs de rythme : relevé `HEURE` toutes les 10 minutes, chevauchement de 2 minutes, pages de 200, une seule requête à la fois, pouls toutes les 5 minutes, passe de nuit à partir de 00 h 30. | Seul le 60 s de `IMMEDIAT` a un appui (QK-19). Les autres valeurs sont des choix de cette spine sans D-n. | Les déclarer « réglables par données » et les consigner en D-20 ; confirmer 00 h 30 avec le PO (4 h 30 de marge avant 6 h). |
| I-4 | AD-13 | Un écart naît aussi hors de la nuit quand une réponse du propriétaire contredit un mouvement confirmé (même `mouvementId`, montant différent). | FR-8 ne prévoit que la file alimentée par la concordance de nuit (FR-9) ; ce second déclencheur n'est dans aucun D-n. | Garder (il ferme un trou réel) et le consigner en D-n ; le compter dans SM-1. |
| I-5 | AD-9 | « Corriger et renvoyer » ne corrige que une règle de Connecteurs ou l'objet source dans son module ; Connecteurs ne modifie jamais le contenu d'un mouvement de la cible. Un refus n'est jamais retenté seul. | FR-7 dit « corriger puis renvoyer le mouvement » sans cette limite. Pas de D-n. Contredit presque FR-7, puce 2, si le PO imagine un champ modifiable dans la fenêtre du refus. | Consigner en D-n et le déclarer en AD-31 (ligne FR-7). |
| I-6 | AD-17, manifeste | `DEGRADE` aussi quand Redis est indisponible ; Redis est un prérequis du manifeste. Une seule alerte à l'ouverture et une à la fermeture de l'incident, avec un modèle de message `connecteurs.panne.fin`. | FR-10 (A-6) ne cite que le domaine rouge et le logiciel injoignable ; C13 ne liste pas Redis ; FR-13 ne prévoit pas de message de retour à la normale. | Consigner en D-n ; confirmer au PO le message de fermeture (un message de plus à l'administrateur). |
| I-7 | AD-27 | Le rôle du DSI contient dès l'installation `file:consulter`, `refus:renvoyer`, `ecart:trancher`, `file:reprendre` ; la comptable et le chef d'agence reçoivent `ecart:trancher` de l'administrateur. | D-14 ne couvre que `file:reprendre`. Le reste (rôle du DSI, délégation) n'est ni au PRD (FR-8 : « droit de tenant ») ni dans un D-n. | Consigner en D-n ; vérifier avec le catalogue de rôles du moteur. |
| I-8 | AD-3, AD-11 | Le topic `connecteurs.domaine.changed` avec compteur `numero`, outbox ordonnée et republication au changement d'époque ; état `FIGE` / `A_VERIFIER` des mouvements. | Appui indirect : D-4 (domaines) et D-8 (kit lit l'état), FR-21 pour `A_VERIFIER`. Le mécanisme d'ordre n'a pas de D-n. | Rattacher à D-8 ; aucune action de fond. |
| I-9 | AD-14 | Un écart reste ouvert jusqu'à la confirmation des corrections ; une correction refusée le rouvre. | D-17 couvre « une correction vers chaque logiciel » mais pas la réouverture. | Ajouter à D-17. |
| I-10 | AD-22, AD-19, AD-26 | AES-256-GCM avec contexte authentifié, champs en écriture seule, test de valeur témoin à l'export, refus des valeurs hors domaine de valeurs. | Le PRD dit seulement « chiffrés ». Détail technique cohérent avec la spine du moteur (AD-36, AD-38). | Garder ; aucun besoin de décision. |
| I-11 | AD-10 | Limites de l'enveloppe d'échange : 200 opérations, corps ≤ 1 Mio. | Alignement sur la Reprise ; aucun appui PRD. | Garder ; citer la source (spine de la Reprise). |

## Corrections à faire, par ordre

1. AD-31 : ajouter les quatre écarts justifiés mais non déclarés (D-10 configuration hors console, D-5 stock sans lecture synchrone, D-12 lecture seule par droit natif, D-18 écart résorbé), plus deux écarts à justifier au `.memlog` (FR-3 / UJ-8 / FR-9 sur l'ordre parallèle et mise en service ; FR-20 point de relais scindé).
2. Écrire l'avertissement de désinstallation (C9), seule exigence absente.
3. AD-15 / AD-3 : séparer clairement les deux conditions d'arrêt de la synchro (file des écarts vide, feu vert de la Reprise), pour tenir A-5.
4. Compléter les lignes « partielle » : adaptateur `api` de l'IMF au Seed, table des niveaux par défaut, message d'action dès l'orange, `niveau` dans les compteurs sur site, ajout au schéma de FR-26, XML-RPC dans AD-31, action du prérequis Odoo Online, mesure des mouvements perdus (SM-2), C11, critère `bac-a-sable` de C13, dépendants orange.
5. Ajouter à la ligne Tests : deux saisies simultanées qui s'additionnent ; panne simulée sans erreur bloquante (FR-10).
6. Consigner les inventions I-1 à I-9 en D-20 et suivantes.
