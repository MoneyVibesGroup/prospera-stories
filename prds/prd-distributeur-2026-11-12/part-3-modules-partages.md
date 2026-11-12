## 6. Partie 3 — Les modules partagés avec la microfinance

Cette partie décrit huit modules que le distributeur partage avec la microfinance (IMF) et, pour certains, avec l'assurance : Terrain, Relances et recouvrement, Équipes, Comptabilité et finance, Marketing, Contrôle de gestion, Automatisations, Tableau de bord. Un neuvième, Support client, est hors de ce PRD (§6.9). Le front de démo `prospera-distributeur` définit le produit ; le PRD exige tout ce que la démo présente, mais en vrai (FR-1 : tout s'enregistre côté serveur et se relit par les autres rôles).

**Règle de la partie : une structure, plusieurs mots.** Comme le PRD réseau (« une agence est un lieu, une zone est un périmètre » : une structure, deux mots), chaque module est écrit UNE SEULE FOIS, neutre de verticale :
1. un **noyau commun** : objets, champs, statuts, règles, sans un mot propre à un métier ;
2. un **tableau de vocabulaire** par verticale (distributeur, IMF, assurance quand c'est pertinent) ;
3. ce qui est **propre au distributeur**, et seulement cela.

Le vocabulaire par verticale est une **donnée de paramétrage** de l'Organisation (libellés d'écran, de PDF, de message). Il n'est jamais une branche de code sur la verticale : aucun test « si distributeur » dans un module. Un test le vérifie : changer le tableau de vocabulaire d'une organisation change les libellés et rien d'autre.

**Comment les autres PRD y renvoient.** Les PRD microfinance et assurance, écrits ensuite, ne réécrivent pas ces modules. Ils citent le noyau (« Terrain, noyau, FR-100 à FR-110 »), remplissent leur colonne du tableau de vocabulaire, et ne décrivent que ce qui leur est propre (le prêt, l'échéance de prêt, le PAR réglementé, la police, le sinistre). Les colonnes IMF et assurance des tableaux ci-dessous sont des propositions de cadrage : elles ne viennent pas du code de la démo, qui ne contient aucune trace IMF. [ASSUMPTION: toute cellule IMF ou assurance est à confirmer par le PRD de sa verticale.]

**Règles communes reprises de la partie 1 (non répétées).** FR-1 (tout s'enregistre), FR-2 (bouton « bientôt »), FR-3 (enchaînements entre rôles), FR-4 et FR-5 (rôles, table d'accès), FR-6 (périmètres côté serveur), FR-7 (chaque rôle sa vue), FR-8 (données privées), FR-13 (garde-fous qui bloquent), FR-14 (alerte et décision à trancher), FR-15 (indicateurs calculés), FR-16 (provenance d'une prédiction), FR-17 (PDF réels), FR-18 (exports), FR-19 (modules installables). Les patrons de la partie 2 s'appliquent aussi : **emplacement déclaré vide** (un module dont on dépend n'est pas installé : la donnée affiche « non installé », jamais 0) et **jeu de démonstration** (« Grossiste du Golfe », jus et boissons, XOF, TVA 18 %).

**Renvois aux modules déjà codés.** Moyens de paiement : le module `paiement` porte PI-SPI et FedaPay, plus espèces et virement déclarés (voir son PRD, `../prd-paiement-service-2026-08-02/prd.md`, §6 sections C à G, et F pour les encaissements hors Prospera). Messages : le module `notification` porte WhatsApp, SMS et e-mail, le consentement et le désabonnement (voir son PRD, `../prd-notification-service-2026-08-02/prd.md`, §5 sections C à H). Les modules de cette partie les appellent ; ils ne les réécrivent pas.

**Un objet qui traverse la partie : la Créance.** Ce que le distributeur appelle facture impayée et l'IMF échéance de prêt en retard sont deux **Sources de créance** d'un même objet. Le choix d'unification est posé en 6.2 (FR-111) ; les modules 6.3, 6.4, 6.6 et 6.8 le lisent.

---

### 6.1 Terrain et application mobile (`terrain`, M12)

**Dans la démo.** Cinq écrans : `/mon-activite` (agenda du commercial), `/disponibilite` (disponibilité des produits et panier), `/tournees` (« Tournées & Cash », superviseur), `/commercial` (pilotage commercial terrain, DG) et la clôture de visite (`ClotureVisiteModal`).
- **SIMULÉ, persisté dans le navigateur (`localStorage`) :** « Y aller » (passe la visite à `EN_COURS` et ouvre Google Maps), « Clôturer » (passe à `FAITE`, enregistre résultat et montants), « Ajouter » au panier, « Transmettre la commande ». Rien ne remonte vers le superviseur, ni vers les commandes, ni vers l'entrepôt.
- **Constantes ou tirages déterministes :** espèces encaissées = 55 % du chiffre d'affaires du jour ; écart de caisse = tirage pseudo-aléatoire par nom ; « exécution en magasin » = 5 pourcentages écrits en dur, sans écran de saisie ; position des commerciaux et statut `ALERTE_GPS` dérivés du score de performance, pas d'un GPS ; badge « Temps réel » et badge « Mode offline OK » = chaînes statiques.
- **Branché (calcul local) :** ordre de tournée par priorité de motif, comparaison « ordre priorité » / « plus proche voisin » (haversine, 22 km/h, 12 min d'arrêt), lancement de la navigation multi-arrêts, contrôle de présence à 200 m (mais facultatif, la trace n'est qu'une chaîne dans le commentaire).
- **Fuites :** `/commercial` n'est pas filtré par périmètre (22 commerciaux pour un superviseur) ; la fiche d'un point de vente s'ouvre hors portefeuille par l'URL (corrigé par FR-6).
- Rôles : COMMERCIAL, FREELANCE, PROSPECTION (agenda, disponibilité, commande) ; SUPERVISEUR, DC, DG (tournées, carte).

**Noyau commun.** L'Agent de terrain est la personne qui va chez un Tiers, saisit ce qui s'y passe, et encaisse. Objets :
- **Visite** : `agent`, `tiers`, `date_prevue`, `heure_prevue`, `duree_prevue`, `ordre`, `motif`, `statut`, `demarree_a` (heure serveur et heure appareil), `cloturee_a`, `resultat`, `commande` (liée), `encaissements` (liés), `distance_au_tiers_m`, `sur_place` (booléen), `commentaire`, `motif_report`, `origine_hors_connexion`.
  - Statuts : `PLANIFIEE`, `EN_COURS`, `FAITE`, `REPORTEE`, `ANNULEE`. `REPORTEE` et `ANNULEE` portent un motif obligatoire.
  - Motifs (paramétrables, avec un rang de priorité) : relance d'impayé (0), réclamation (1), réassort (2), lancement de produit (3), fidélisation (4), prospection (5).
  - Résultats : commande, encaissement, promesse, sans suite, client absent.
- **Tournée** : l'ensemble ordonné des visites d'un agent pour un jour. `statut` (`NON_DEMARREE`, `EN_COURS`, `TERMINEE`), `planifie`, `realise`, `km_parcourus` (mesuré).
- **Remise d'espèces** : `agent`, `tournee`, `montant_declare_encaisse`, `montant_remis`, `date`, `destinataire`, `bordereau` (pièce jointe), `statut` (`CONFORME`, `ECART`, `NON_REMISE`, `RAPPROCHEE`).
- **Écart de caisse** : `montant_remis − espèces_encaissées` de la tournée. Négatif = manquant.
- **Relevé d'exécution** : par visite, une liste de critères cochés (paramétrables par organisation).
- **Position** : points GPS de l'agent pendant une tournée ouverte, avec son consentement affiché dans l'application.

Règles du noyau :
- L'ordre d'une tournée suit le rang de priorité du motif, puis la proximité. Le motif d'une visite se déduit de l'état du Tiers (créance en retard : relance ; ouverture récente : prospection ; client à risque : réclamation ou fidélisation ; sinon réassort), selon des règles paramétrables.
- Une seule visite `EN_COURS` par agent.
- Le **serveur est seul juge** : l'application propose, le serveur valide et date. Une commande saisie hors connexion revient « en attente de confirmation du stock » (FR-103).
- Un encaissement est toujours relié à une visite ou à une Tournée.

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Agent de terrain | commercial, freelance, chargé de prospection | agent de crédit, agent de collecte | agent général, courtier [ASSUMPTION] |
| Tiers | point de vente | membre, client, groupe solidaire | assuré, souscripteur [ASSUMPTION] |
| Lieu | magasin, dépôt | agence, guichet | agence [ASSUMPTION] |
| Zone | zone commerciale | zone de collecte | zone de gestion [ASSUMPTION] |
| Visite | visite commerciale | visite de collecte, rendez-vous d'octroi, suivi de groupe | visite client |
| Tournée | tournée de vente (PJP) | tournée de collecte | tournée |
| Motif « relance » | relance d'impayé | relance de remboursement | relance de prime |
| Résultat « commande » | commande | demande de crédit [ASSUMPTION] | proposition d'assurance [ASSUMPTION] |
| Résultat « encaissement » | encaissement client | remboursement ou épargne collectés | prime encaissée [ASSUMPTION] |
| Remise d'espèces | remise de caisse du commercial | versement de caisse de l'agent | reversement de primes [ASSUMPTION] |
| Écart de caisse | écart de caisse | écart de caisse | écart de caisse |

[ASSUMPTION: chez l'IMF, la collecte d'épargne et le remboursement de prêt sont deux sortes d'Encaissement portées par `paiement` ; le noyau Terrain ne les distingue pas.]

**Propre au distributeur.** Le freelance voit les prix société comme son « coût » et garde sa marge privée (FR-8, FR-39). La disponibilité des produits (FR-108) et la commande depuis la visite (FR-103) n'existent que là où les modules `stock` et `commande` sont installés. Chez l'IMF, ni stock ni catalogue : ces deux exigences sont « non installé ».

---

#### FR-100 : Plan de journée et tournée ordonnée

Un agent de terrain peut ouvrir son plan de journée : la liste ordonnée de ses visites, avec heure, durée, motif, adresse et statut. Un superviseur peut planifier ou déplacer une visite d'un agent de son périmètre. Réalise UJ-2.

**Conséquences (testables) :**
- Le plan est lu sur le serveur, pas fabriqué sur l'appareil. Kodjo, commercial à Bè, ne voit que les visites de son portefeuille ; un appel direct sur la visite d'un autre agent est refusé (FR-6).
- L'ordre suit le rang de priorité du motif (relance d'impayé avant réclamation, avant réassort, avant lancement, avant fidélisation, avant prospection). Un test avec une visite de chaque motif vérifie l'ordre.
- Une vue semaine (lundi au samedi) et un historique des 40 dernières visites faites sont disponibles.
- Une visite peut être `REPORTEE` ou `ANNULEE` avec un motif obligatoire (la démo avait les statuts sans action).
- Une visite planifiée depuis un Dossier de recouvrement (FR-121) apparaît dans la tournée de l'agent avec le motif « relance d'impayé ».
- La durée estimée d'une tournée = distance à vol d'oiseau ÷ 22 km/h + 12 min par arrêt (valeurs paramétrables). La comparaison « ordre priorité » / « plus proche voisin » est affichée avec le gain en km. Le calcul se fait sur l'appareil, donc hors connexion.
- L'optimisation avec routage routier réel est un bouton « bientôt ».

**Hors périmètre :** routage routier réel (« bientôt »), géocodage des adresses.

#### FR-101 : « Y aller » démarre la visite, pour de vrai

Un agent peut démarrer une visite planifiée. Réalise UJ-2.

**Conséquences (testables) :**
- « Y aller » passe la visite à `EN_COURS`, enregistre `demarree_a` (heure du serveur à la synchronisation, heure de l'appareil à l'action) et ouvre la navigation vers le Tiers.
- Une seconde visite ne peut pas passer à `EN_COURS` tant que la première n'est pas clôturée, reportée ou annulée : refus `VISITE_DEJA_EN_COURS`.
- Le superviseur voit la visite `EN_COURS` dans la minute qui suit la synchronisation (SM-4).
- Hors connexion, l'action est mise dans la file d'envoi (FR-109) et l'agent voit « à envoyer » sur la visite.

#### FR-102 : Clôturer une visite avec contrôle de présence

Un agent peut clôturer une visite en choisissant un résultat. Réalise UJ-2.

**Conséquences (testables) :**
- Les résultats sont : commande, encaissement, promesse, sans suite, client absent. « Sans suite » et « client absent » exigent un commentaire.
- À la clôture, l'application lit la position et calcule la distance au Tiers. Elle enregistre `distance_au_tiers_m` (nombre) et `sur_place` (vrai si ≤ 200 m, valeur paramétrable, FR-13). La démo écrivait une chaîne dans le commentaire.
- Si `sur_place` est faux, la clôture reste possible mais la visite est **signalée** : une Alerte (FR-14) arrive chez le superviseur. Si la position est absente (GPS refusé ou indisponible), la visite est signalée « position non relevée ».
- Un résultat « promesse » crée une Promesse sur la Créance concernée (FR-118). Un résultat « encaissement » ou « commande » exige les objets liés (FR-103, FR-104) ; les montants ne sont plus saisis librement.
- Le serveur recalcule `sur_place` depuis la position reçue. Il ne croit pas le booléen de l'appareil.
- Une visite clôturée deux fois (deux appareils, ou un renvoi) reste clôturée une seule fois : le second envoi est ignoré et tracé.

#### FR-103 : Commande depuis la visite

Un agent peut prendre une commande depuis une visite : le Tiers est choisi dans son portefeuille, la commande est liée à la visite. Réalise UJ-2.

**Conséquences (testables) :**
- La commande est créée par le module `commande` (FR-37) ; ce module n'en redéfinit ni les lignes ni les prix. Le champ « Point de vente » n'est plus un texte libre.
- Le plafond de crédit et le blocage de crédit (FR-119) sont contrôlés à l'ouverture de la commande, hors connexion avec la dernière valeur connue, puis revérifiés par le serveur. Un Tiers dont le crédit est bloqué : la commande est refusée `CREDIT_BLOQUE`.
- Hors connexion, la commande reçoit le statut `EN_ATTENTE_CONFIRMATION_STOCK`. Le serveur confirme, confirme partiellement ou refuse selon le stock réel. L'agent voit le sort de sa commande à la synchronisation.
- La commande porte l'identifiant unique généré sur le téléphone. Un renvoi ne crée pas une seconde commande.
- La commande figure dans le taux de conversion de la visite (FR-107).
- Si le module `commande` n'est pas installé, le résultat « commande » n'est pas proposé.

#### FR-104 : Encaisser en visite

Un agent peut enregistrer un encaissement en visite : espèces, Mobile Money ou virement. Réalise UJ-2.

**Conséquences (testables) :**
- L'encaissement est créé dans le module `paiement`, rattaché à une Créance (FR-111) et à la visite. Moyens : PI-SPI et FedaPay par lien de paiement (voir le PRD paiement, sections C et D), espèces et virement déclarés (section F).
- Un encaissement en espèces ou en virement est « déclaré » : il diminue le solde affiché mais reste distingué d'un encaissement confirmé, jusqu'à la remise d'espèces (FR-105) ou la confirmation d'un rôle habilité.
- Chaque encaissement saisi hors connexion porte une **clé d'idempotence générée sur le téléphone**. Deux envois de la même clé créent un seul encaissement. Test : couper le réseau, saisir un encaissement, rétablir, renvoyer deux fois : un encaissement.
- Un montant supérieur au reste dû est refusé (`PAIEMENT_SUPERIEUR_AU_RESTE_DU`, FR-49).
- Le champ « encaissé » du KPI de l'agent est la somme des encaissements liés à ses visites, pas des montants libres.

#### FR-105 : Remise d'espèces et écart de caisse réels

Un agent peut déclarer la remise de ses espèces ; un superviseur ou un comptable peut la rapprocher. Réalise UJ-3.

**Conséquences (testables) :**
- L'agent saisit le montant remis, la date, le destinataire, et joint le bordereau. Les espèces à remettre = somme des encaissements en espèces de sa tournée, lus dans `paiement`. Ce n'est plus 55 % du chiffre d'affaires.
- `écart = montant_remis − espèces_encaissées`. Un écart non nul crée une Alerte `ECART_DE_CAISSE` (sévérité critique si manquant) chez le superviseur du périmètre. Une tournée sans remise après `N` jours (paramétrable, défaut 1) crée une Alerte « non remis ».
- Le rapprochement par le superviseur ou le comptable passe la remise à `RAPPROCHEE` et valide les encaissements déclarés correspondants dans `paiement` (voir son PRD, FR-P33).
- L'écart n'est jamais tiré au hasard ni estimé : s'il n'y a pas de remise saisie, l'écran affiche « remise non saisie », pas 0.
- Une remise est visible du comptable (FR-136) et du superviseur de la zone, pas d'un autre périmètre.

**Hors périmètre :** la caisse de guichet (module Caisse, voir le PRD paiement §1.1, objet B).

#### FR-106 : Carte de l'équipe

Un superviseur, un responsable des ventes, un DC ou un DG peut voir la carte de son équipe : positions, visites du jour, tiers à visiter. Réalise UJ-3.

**Conséquences (testables) :**
- La carte est Google Maps. Une position affichée est la dernière position reçue d'un agent dont la tournée est ouverte, avec son heure. Au-delà de 30 minutes sans position (paramétrable), l'agent passe à « position ancienne », jamais « en tournée ».
- Le statut d'un agent (`EN_TOURNEE`, `BUREAU`, `PAUSE`, `HORS_LIGNE`) est dérivé de sa tournée et de sa dernière activité. L'alerte GPS vient d'écarts de position réels (visite clôturée hors zone, FR-102), jamais du score de performance.
- Le badge « Temps réel » n'apparaît que si une position date de moins de 5 minutes.
- Chaque rôle ne voit que son périmètre : un superviseur ne voit que ses agents (FR-6). Il n'y a plus de repli « tout le réseau » quand le périmètre est vide : la liste est vide.
- Le rejeu de la journée d'un agent est calculé depuis ses visites et positions enregistrées.
- Les agents sont informés dans l'application que leur position est partagée pendant leur tournée. [ASSUMPTION: consentement et durée de conservation à valider avec la réglementation de protection des données.]

#### FR-107 : Conversion visite → commande et indicateurs de tournée

Un superviseur peut lire, pour une tournée ou une équipe, des indicateurs calculés sur les visites enregistrées. Réalise UJ-3.

**Conséquences (testables) :**
- Visites planifiées, réalisées, avec commande ; couverture de la tournée = réalisées ÷ planifiées ; taux de conversion = commandes issues de visites ÷ visites faites. Cible paramétrable (50 % dans la démo).
- Un test crée trois visites faites dont une avec commande : taux de 33 %. Il en clôture une quatrième sans commande : taux de 25 %. L'indicateur bouge (FR-15, SM-5).
- Les kilomètres parcourus viennent des positions enregistrées. Sans positions : « non mesuré ».
- L'**exécution en magasin** est un relevé saisi à la visite (cases à cocher, critères paramétrables). Un critère qu'aucun agent n'a saisi affiche « non saisi », pas un pourcentage.
- Les agrégats de zone et de superviseur additionnent les mêmes visites : la carte et les KPI ne peuvent plus diverger. Un test compare les deux.

#### FR-108 : Disponibilité des produits sans exposer les quantités

Un agent de terrain peut consulter la disponibilité des produits avant de promettre. Réalise UJ-2.

**Conséquences (testables) :**
- Trois états seulement : `DISPONIBLE`, `LIMITE` (stock sous le seuil, quantité confirmée à la validation par l'entrepôt), `RUPTURE`. La quantité exacte n'est jamais envoyée à l'application d'un agent. Test : la réponse du serveur à un agent ne contient aucun nombre de stock.
- L'état se calcule sur l'entrepôt source du Tiers, pas sur la somme de tous les entrepôts.
- Le prix affiché est le prix société ; pour un freelance, il est libellé « votre coût » (FR-39). La marge du freelance n'est pas visible de la société (FR-8).
- L'écran indique l'âge de la dernière synchronisation du catalogue et des états de stock.
- Sans module `stock` installé : « non installé », pas « disponible ».

#### FR-109 : Application mobile hors connexion

L'application `prospera-terrain`, en Flutter, doit servir un agent sans réseau. Réalise UJ-2.

**Conséquences (testables) :**
- Hors connexion, l'agent consulte son plan, ses Tiers, le catalogue et les états de disponibilité, et crée des visites clôturées, des commandes et des encaissements. Ils sont écrits dans une base locale et placés dans une **file d'envoi**.
- La file d'envoi est ordonnée et reprend après coupure sans perte ni doublon. Test (SM-4) : journée complète en 3G coupée, 5 visites, 2 commandes, 3 encaissements ; au retour du réseau, tout arrive une fois, dans l'ordre.
- Chaque objet porte un identifiant généré sur le téléphone ; chaque encaissement une clé d'idempotence (FR-104).
- Chaque visite, commande et encaissement affiche son état de synchronisation : à envoyer, envoyé, confirmé, refusé (avec le motif du serveur).
- Conflits : le serveur est seul juge. Visite clôturée deux fois : une seule retenue. Commande sur un stock devenu nul : `EN_ATTENTE_CONFIRMATION_STOCK` puis refus motivé. Les heures du serveur font foi pour l'ordre ; l'heure de l'appareil est gardée à titre de trace.
- L'application est testée sur un Android d'entrée de gamme à 2 Go de mémoire, en 3G coupée. Elle démarre en moins de 5 s (NFR-7).
- Le badge « Mode hors connexion » n'apparaît que si l'application détecte réellement l'absence de réseau.

#### FR-110 : Appareil perdu, session sûre

Un administrateur ou un superviseur peut déconnecter à distance l'appareil d'un agent. Réalise UJ-2.

**Conséquences (testables) :**
- Le jeton de session est gardé dans le stockage sécurisé du téléphone, jamais dans une base lisible.
- Une déconnexion à distance révoque le jeton ; au prochain contact avec le serveur, l'application efface sa base locale. Les objets de la file d'envoi non partis sont signalés au superviseur comme « perdus avec l'appareil », à rapprocher. [ASSUMPTION: la politique exacte (effacement, délai de grâce hors connexion) est à fixer avec le PO.]
- Un appareil sans contact depuis `N` jours (paramétrable, défaut 14) demande une nouvelle authentification. [ASSUMPTION]
- Le compte d'un agent ne peut être ouvert que sur un appareil à la fois, sauf décision de l'administrateur. [ASSUMPTION]

**Règles de calcul reprises de la démo.**
- Ordre de tournée par priorité de motif ; motif choisi selon l'état du Tiers (FR-100).
- Itinéraire : haversine, 22 km/h, 12 min d'arrêt par Tiers, plus proche voisin (FR-100).
- Contrôle de présence : 200 m (FR-102).
- Taux de transformation = commandes ÷ visites faites ; couverture de tournée = réalisées ÷ planifiées ; cible de conversion 50 % (FR-107).
- Disponibilité : `RUPTURE` si stock ≤ 0, `LIMITE` si stock < seuil, sinon `DISPONIBLE` (FR-108).
- **Non reprises :** espèces = 55 % du CA, écart de caisse tiré au hasard, statut `ALERTE_GPS` dérivé du score, pourcentages d'exécution en magasin en dur, `km_parcourus` aléatoire, « offline OK » statique, objectif d'un point de vente = CA × 1,1.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Y aller | simulé (navigateur) | FR-101 |
| Clôturer (et « Vérifier ma position ») | simulé ; contrôle facultatif | FR-102 |
| Ajouter au panier / Transmettre la commande | simulé | FR-103 |
| Optimiser le trajet / Lancer l'itinéraire | branché (calcul local) | repris (FR-100) ; routage réel « bientôt » |
| Rejeu de la journée | branché (données simulées) | FR-106 |
| Reporter, Annuler la visite, Ajouter une visite | absents | FR-100 |
| Enregistrer une remise de caisse, Valider l'écart, Rappeler l'agent | absents | FR-105 |
| Compte-rendu vocal | absent (promis par la documentation) | « bientôt » (date à fixer par le PO ; proposition : 31/03/2027) |
| Appeler, Réaffecter des PDV, Planifier un coaching | absents | « bientôt » ; la planification d'un coaching est FR-125 |

**Notes.**
- [ASSUMPTION: Google Maps pour la carte de l'équipe et la navigation, comme sur le PRD réseau ; l'OpenStreetMap de la démo n'est pas repris.]
- [ASSUMPTION: la prospection par pointage GPS (recensement) vit dans le module `conquete-objectifs` (FR-76) ; elle utilise la même application.]
- Question : conservation des positions GPS (durée, finalité) à valider avec le PO avant la mise en production.
- Question : un agent d'IMF encaisse de l'épargne ; le module `paiement` a-t-il un moyen distinct pour la collecte d'épargne ? À poser au PRD microfinance.

---

### 6.2 Relances et recouvrement (`recouvrement`, M19)

**Dans la démo.** `/relances` (`RelancesView`, 688 lignes) : 8 KPI, 6 règles d'automatisation, carte des débiteurs, tournée de recouvrement (jusqu'à 9 débiteurs), kanban à 8 colonnes (Détection, Planifiée, Envoyée, Réponse client, Visite terrain, Accord paiement, Résolue, Contentieux), balance âgée à 4 tranches, fiche dossier. Le cockpit RECOUVREMENT (`DashboardRecouvrement`) porte la file du jour, la prévision et les promesses.
- **SIMULÉ :** « Envoyer relance » (journalise, rien n'est envoyé), « Enregistrer paiement » (journalise, ne diminue ni le reste dû ni la facture), « Promesse » (pas de rappel, pas de bascule en « rompue »), « Escalader » (un seul cran), « Bloquer crédit » (aucune conséquence sur les commandes). Journal dans `localStorage`.
- **MORT :** « Envoyer maintenant », « Enregistrer une promesse », « Modifier », « Reporter » du cockpit (aucun gestionnaire).
- **Quatre modèles de créance sans pont :** `Facture`, `CreanceComptable`, `Relance` (dossier lié à UNE facture) et `DossierRecouvrement` (calculé). **Deux échelles d'escalade :** blocage à J+30 dans `/relances`, à plus de 60 jours dans les automatisations ; visite à J+14 contre 16-30. **Deux balances âgées :** 4 tranches (J+0-15, 16-30, 31-60, 60+) dans `/relances` ; 5 tranches (non échu, 1-30, 31-60, 61-90, plus de 90) dans un composant orphelin, `BalanceAgeeClientPanel`.
- Les transitions du kanban ne sont pas pilotées par les actions : le journal et le statut sont indépendants.
- Constantes : capacité de 12 dossiers par jour, objectif d'encaissement du mois 40 M, promesses du cockpit écrites en dur. « DSO » = retard moyen pondéré, pas un DSO.
- Rôles : DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, DAF, RECOUVREMENT.

**Noyau commun.** Ce qu'un Tiers doit à l'Organisation s'appelle une **Créance**. Elle naît d'une **Source de créance** et se solde par des Encaissements. Le recouvrement travaille sur la Créance, jamais sur la facture ni sur l'échéance de prêt.

- **Créance** : `numero`, `tiers`, `source` (`type`, `reference`), `montant_origine`, `devise`, `date_ouverture`, `date_echeance`, `montant_regle`, `reste_du`, `statut`, `perimetre` (zone, agent).
  - Statuts : `OUVERTE`, `PARTIELLE`, `SOLDEE`, `ANNULEE`. `EN_RETARD` n'est pas un statut : c'est un calcul (échéance dépassée et reste dû > 0), comme pour la facture (FR-49). `jours_retard` est calculé à la date de lecture.
- **Source de créance** : un type enregistré par un module. Il fournit les champs de la Créance et se reconnaît par sa `reference`. Aujourd'hui : `FACTURE` (module `facturation`). Prévu : `ECHEANCE_DE_PRET` (module crédit de l'IMF), `PRIME` (assurance). Une Source n'est pas une branche de code du noyau : elle s'inscrit par un événement de créance du contrat de la partie 4 (par exemple `facturation.creance.changed@1`).
- **Dossier de recouvrement** : `numero`, `tiers`, `creances` (une ou plusieurs), `montant_en_jeu`, `statut`, `priorite` (`CRITIQUE`, `HAUTE`, `NORMALE`, `BASSE`), `probabilite` (5 à 98), `valeur_esperee`, `palier_courant`, `prochaine_action` (et sa date), `assigne_a`, `credit_bloque`, `journal`.
  - Statuts : `DETECTE`, `EN_RELANCE`, `REPONDU`, `VISITE_PLANIFIEE`, `PROMESSE_EN_COURS`, `RESOLU`, `CONTENTIEUX`. Ils sont **dérivés du journal**, pas saisis à côté.
- **Événement de dossier** (journal, jamais modifié, seulement complété) : `RELANCE`, `PAIEMENT`, `PROMESSE`, `PROMESSE_TENUE`, `PROMESSE_ROMPUE`, `ESCALADE`, `VISITE_PLANIFIEE`, `BLOCAGE_CREDIT`, `DEBLOCAGE_CREDIT`, `CLOTURE`. Chacun porte auteur, date, canal, montant, note.
- **Promesse** : `dossier`, `montant`, `date_promise`, `statut` (`EN_ATTENTE`, `TENUE`, `PARTIELLEMENT_TENUE`, `ROMPUE`), `canal_obtention`, `auteur`.
- **Palier d'escalade** : `delai_jours` (négatif = avant l'échéance), `canal` (`WHATSAPP`, `SMS`, `APPEL`, `VISITE`, `EMAIL`, `DIRECTION`), `mode` (`AUTO`, `A_VALIDER`), `gabarit_message`, `garde_fous`. L'**échelle** est la liste ordonnée des paliers d'une Organisation.
- **Tranche d'âge** : `libelle`, `min_jours`, `max_jours`.

**Choix d'unification (en `[ASSUMPTION]`, à arbitrer par le PO).**
1. **Qui porte la Créance ?** Le registre des Créances est tenu par le module `paiement`. Il porte déjà une « créance projetée » (référence externe, montant d'origine, échéance, libellé) et maintient le solde encaissé (voir son PRD, FR-P13, FR-P27, FR-P37). La Créance de ce PRD est cette créance projetée, enrichie de `tiers`, `source`, `perimetre`. La source l'ouvre (`facturation` à l'émission d'une facture) ; les Encaissements de `paiement` la soldent ; `recouvrement` ne fait que la lire et y accrocher un Dossier. [ASSUMPTION: raisons : (a) `paiement` est déjà codé et calcule déjà le solde ; (b) `facturation` a besoin du reste dû même sans `recouvrement` (FR-49) ; (c) `recouvrement` sans `paiement` ne peut rien solder. Conséquence : un amendement du PRD `paiement` pour ajouter `tiers`, `source` et `perimetre` à la créance projetée ; sans `paiement` installé, le reste dû est « non installé » (FR-49).]
2. **Une seule balance âgée** : 5 tranches, comme la partie 2 (FR-51). Celle de 4 tranches disparaît.
3. **Une seule échelle d'escalade** : paramétrable par Organisation (FR-114). Les deux échelles de la démo deviennent deux jeux de valeurs initiales ; l'échelle retenue par défaut est celle de FR-114.
4. **Un seul Dossier par Tiers** qui regroupe ses créances en retard (la démo en avait un par facture). Un Tiers a au plus un Dossier ouvert. [ASSUMPTION: un dossier par tiers évite de relancer trois fois le même client pour trois factures ; le dossier par créance reste possible en paramètre.]

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Tiers | point de vente, client | membre, client, groupe solidaire | assuré |
| Créance | facture impayée, solde de facture | échéance de prêt en retard | prime impayée [ASSUMPTION] |
| Source de créance | `FACTURE` | `ECHEANCE_DE_PRET` | `PRIME` [ASSUMPTION] |
| Balance âgée | balance âgée clients (non échu, 1-30, 31-60, 61-90, +90) | portefeuille à risque : PAR 1-30, 31-60, 61-90, +90 (sans « non échu ») | primes impayées par ancienneté [ASSUMPTION] |
| Dossier de recouvrement | dossier de relance | dossier d'impayé | dossier de relance de prime |
| Promesse | promesse de paiement | promesse de remboursement | promesse de paiement |
| Blocage du crédit | blocage du crédit (plus de commande à crédit) | suspension de décaissement | suspension de nouvelle souscription [ASSUMPTION] |
| Escalade « direction » | alerte DG, mise en demeure | passage en contentieux, rééchelonnement | résiliation pour impayé [ASSUMPTION] |
| Plafond de crédit | plafond de crédit client | plafond d'octroi | sans objet |
| Agent de terrain | commercial | agent de collecte | agent |

[ASSUMPTION: chez l'IMF, le PAR et les pénalités de retard sont réglementés. Le noyau ne calcule ni pénalité ni intérêt de retard ni classement réglementaire : la Source `ECHEANCE_DE_PRET` les fournit comme champs de la Créance. Les tranches du PAR sont les tranches paramétrables du noyau.]

**Propre au distributeur.** La Source `FACTURE` et ses avoirs (FR-48) ; le blocage de crédit qui refuse une commande (FR-119) ; la probabilité de recouvrement calibrée sur le score du point de vente (FR-117) ; la mention « Mobile Money ou virement » des gabarits ; la visite du commercial assigné.

---

#### FR-111 : Une Créance, plusieurs Sources

Une Source de créance peut ouvrir une Créance ; les Encaissements la réduisent ; le recouvrement la lit. Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Une facture émise ouvre une Créance de source `FACTURE` (FR-49). Un avoir réduit son `montant_origine` ou son `reste_du` ; un Encaissement confirmé ou déclaré réduit `reste_du`.
- `reste_du = montant_origine − avoirs − encaissements`. Un test lie la même Créance à la facture (FR-49), au Dossier (FR-113) et à la balance (FR-112) : un encaissement de 200 000 sur 507 400 donne 307 400 partout, au même instant.
- Une Créance garde la clé de sa Source. Un Tiers peut avoir des Créances de Sources différentes ; la balance âgée les additionne.
- Un module Source non installé n'ouvre aucune Créance. Il n'y a pas de Créance « fantôme ».
- Les factures reprises de Sage (FR-58) ouvrent une Créance avec leur échéance d'origine.
- Sans le module `paiement`, `montant_regle` et `reste_du` affichent « non installé » (emplacement déclaré vide).
- Le périmètre s'applique par le serveur : un commercial ne lit que les Créances de ses Tiers (FR-6).

**Hors périmètre :** pénalités et intérêts de retard (portés par la Source), écritures comptables (6.4).

#### FR-112 : Balance âgée unique

Un DG, un DAF, un comptable, un responsable du recouvrement ou un commercial (pour son portefeuille) peut lire la balance âgée des Créances. Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Tranches par défaut, paramétrables par Organisation : non échu, 1 à 30 jours, 31 à 60 jours, 61 à 90 jours, plus de 90 jours. L'âge se calcule depuis l'échéance (FR-51). Une tranche vide s'affiche à 0, pas masquée.
- C'est la même balance que FR-51 et FR-50 : leur total égale la somme des restes dus. Test automatique à la même date.
- Vues : par Tiers, par agent de terrain, par zone, par Source. Une date passée recalcule la balance sur les pièces et Encaissements datés avant.
- Un clic sur une tranche ouvre la liste des Créances ; un clic sur un Tiers ouvre son Dossier s'il en a un.
- La balance âgée de l'IMF est la même structure avec la tranche « non échu » masquée par paramétrage (PAR).
- Export CSV et PDF réels (FR-17, FR-18).

#### FR-113 : Dossier de recouvrement

Un responsable du recouvrement peut ouvrir, suivre et clôturer le Dossier d'un Tiers. Réalise UJ-4.

**Conséquences (testables) :**
- Un Dossier s'ouvre tout seul quand une Créance d'un Tiers dépasse le premier palier de l'échelle (FR-114), ou à la main par le responsable. Un Tiers a au plus un Dossier ouvert ; ses nouvelles Créances en retard s'y ajoutent.
- Le Dossier liste ses Créances, leur reste dû et leur retard. Son `montant_en_jeu` est la somme des restes dus.
- Le statut est dérivé du journal : envoyer une relance passe à `EN_RELANCE`, enregistrer une promesse à `PROMESSE_EN_COURS`, planifier une visite à `VISITE_PLANIFIEE`, solder toutes les Créances à `RESOLU`. Test : chaque action change la colonne du kanban (la démo les découplait).
- Chaque action du Dossier est un événement du journal avec auteur et heure. Le journal n'est pas modifiable. « Annuler la dernière action » devient un événement `ANNULATION` qui renvoie à l'événement annulé.
- Un Dossier se clôture quand le reste dû est nul ou sur décision motivée (abandon de créance : décision du DAF seul, FR-13). Un commercial ne peut pas clôturer un Dossier.
- Le Dossier est lisible par l'agent de terrain du Tiers (sa dernière relance, sa promesse) pour sa visite, sans la probabilité ni la provision.

#### FR-114 : Échelle d'escalade paramétrable

Un administrateur ou un DAF peut définir l'échelle d'escalade de l'Organisation. Réalise UJ-4.

**Conséquences (testables) :**
- L'échelle est une liste de paliers : délai (en jours avant ou après l'échéance), canal, mode (AUTO ou À VALIDER), gabarit de message, garde-fous. Aucun délai n'est écrit dans le code.
- Valeurs initiales proposées, remplaçables [ASSUMPTION : fusion des deux échelles de la démo] :

  | Palier | Délai | Canal | Mode | Garde-fou |
  |---|---|---|---|---|
  | Rappel préventif | J−3 | WhatsApp | AUTO | un seul rappel par Créance, jamais si déjà payée |
  | Relance douce | J+1 | WhatsApp, relevé joint | AUTO | ton neutre |
  | Relance ferme | J+7 | SMS, puis appel programmé | AUTO | 2 appels par jour au plus, promesse enregistrée avec montant et date |
  | Visite | J+15 | Visite de l'agent (FR-121) | À VALIDER | l'agent ne négocie jamais un abandon de créance |
  | Direction | J+30 | Mise en demeure et Alerte direction | À VALIDER | jamais envoyée sans validation humaine (acte à portée juridique) |
  | Blocage du crédit | plus de 60 jours ou encours au-dessus du plafond | automatique | AUTO | déblocage jamais automatique (FR-119) |

- L'ordre de l'échelle est vérifié : deux paliers ne peuvent pas avoir le même délai et le même canal.
- Une promesse non tenue fait remonter d'un palier (FR-118). Un paiement partiel suspend la relance, il ne l'arrête pas ; un paiement total l'arrête.
- Un palier AUTO ne part jamais en dehors de la fenêtre horaire de `notification` (voir son PRD, FR-N33) ni vers un Tiers désabonné pour ce type de message.
- [ASSUMPTION: le blocage est à plus de 60 jours, pas à J+30. À J+30 on alerte la direction. La démo avait les deux ; 30 jours bloquerait tout client qui paie avec un mois de retard, ce qui est la norme à 30 ou 45 jours de délai. Le PO peut ramener le blocage à J+30 par paramétrage sans changer le code.]

#### FR-115 : Une relance part vraiment

Un responsable du recouvrement ou un agent peut envoyer une relance depuis un Dossier ; une relance AUTO part seule. Réalise UJ-4.

**Conséquences (testables) :**
- « Envoyer relance » appelle le module `notification` (WhatsApp, SMS, e-mail) avec le gabarit du palier, rempli du nom du Tiers, du montant, des références de Créance et des moyens de paiement de l'Organisation. L'envoi, son accusé et son échec sont lus dans le journal de `notification` (voir son PRD, section F) et recopiés dans le journal du Dossier.
- Le message propose un lien de paiement (PI-SPI, FedaPay) quand l'Organisation en a ouvert, sinon les coordonnées de virement.
- Sans module `notification` installé, le bouton est « non installé » ; aucune relance n'est journalisée comme envoyée.
- Un envoi refusé (désabonné, canal absent, hors fenêtre) est journalisé avec le motif ; le Dossier ne passe pas à `EN_RELANCE`.
- Le ton monte avec le retard : avant l'échéance, jusqu'à 7 jours, jusqu'à 15, jusqu'à 30, au-delà de 30 (mise en demeure, mode À VALIDER). Le texte est un gabarit modifiable de l'Organisation.
- Une relance de recouvrement est un message transactionnel : la désinscription de la publicité ne l'éteint pas (voir PRD notification, FR-N50). [ASSUMPTION: à confirmer par le juriste.]

#### FR-116 : Enregistrer un paiement depuis le Dossier

Un responsable du recouvrement peut enregistrer un paiement reçu ; un agent peut en saisir un sur le terrain (FR-104). Réalise UJ-4.

**Conséquences (testables) :**
- Le paiement est un Encaissement du module `paiement` rattaché à la Créance. PI-SPI et FedaPay arrivent par rapprochement du lien ; espèces et virement se déclarent (voir PRD paiement, sections D et F). Le formulaire n'a plus un champ libre « référence Mobile Money ».
- L'Encaissement réduit `reste_du` de la Créance, le montant du Dossier et la facture, en une seule opération (la démo ne touchait rien).
- Un paiement supérieur au reste dû est refusé. Un paiement partiel passe la Créance à `PARTIELLE` et suspend la relance.
- Quand toutes les Créances sont soldées, le Dossier passe à `RESOLU`, les relances planifiées s'arrêtent, et un blocage de crédit lié à ce seul Dossier est proposé au déblocage (FR-119).
- L'Encaissement figure au lettrage du comptable (FR-132). Il n'y a rien à lettrer à la main.

#### FR-117 : Probabilité, prévision d'encaissement, provision

Un responsable du recouvrement ou un DAF peut lire la probabilité de recouvrement de chaque Dossier et la prévision d'encaissement. Réalise UJ-4.

**Conséquences (testables) :**
- La probabilité est une **règle** (pas une « IA ») : base selon le retard du plus ancien retard (95 à zéro jour ou moins, 82 de 1 à 30, 65 de 31 à 60, 45 de 61 à 90, 30 au-delà de 90), moins 0,4 fois le pourcentage de provision, plus 0,25 fois (score du Tiers moins 60), plus 10 si un paiement partiel a déjà eu lieu, bornée entre 5 et 98. Chaque Dossier affiche « règle de recouvrement, version, date de calcul » (FR-16).
- `valeur_esperee = reste_du × probabilité ÷ 100`. `perte_attendue = encours − valeur_esperee`.
- Prévision à 30 jours en quatre groupes : quasi certain (probabilité ≥ 80), probable (55 à 79), incertain (35 à 54), à provisionner (< 35). Un Dossier de probabilité < 40 est proposé en contentieux. [ASSUMPTION: les seuils 35 et 40 sont ceux de la démo, deux seuils proches ; à unifier avec le PO.]
- Le pourcentage de provision est saisi par le comptable ou le DAF (FR-129) ; sans valeur, la formule affiche « provision non saisie » et l'ajustement vaut 0.
- Le score du Tiers vient du module `pdv` (ou de son équivalent) ; sans score, l'ajustement vaut 0 et la fiche le dit.
- Le « DSO » est le vrai délai moyen d'encaissement = créances ouvertes ÷ chiffre d'affaires de la période × nombre de jours. Le retard moyen pondéré de la démo s'appelle « retard moyen pondéré ».
- L'objectif d'encaissement du mois est saisi par le DAF ; il n'est plus 40 M en dur.

#### FR-118 : Promesse de paiement

Un responsable du recouvrement ou un agent peut enregistrer une promesse sur un Dossier. Réalise UJ-4.

**Conséquences (testables) :**
- La promesse porte un montant (facultatif : à défaut, le reste dû), une date, le canal d'obtention, l'auteur. Mensah enregistre « Kiosque du Port paiera 300 000 le 20 » ; la promesse apparaît dans le Dossier et dans la visite de l'agent.
- Un rappel part la veille de la date (palier AUTO, FR-114).
- À la date promise, la promesse devient `TENUE` si l'Encaissement est reçu, `PARTIELLEMENT_TENUE` s'il est inférieur, `ROMPUE` sinon, sans intervention (voir PRD paiement, FR-P29). Une promesse rompue fait remonter d'un palier.
- Une première promesse rompue bénéficie d'un délai de grâce de 24 h (paramétrable). Au-delà de deux promesses rompues, un accord écrit est exigé (une pièce jointe) avant toute nouvelle promesse.
- La fiabilité du Tiers = promesses tenues ÷ promesses faites, affichée avec leur nombre. Sans promesse : « aucune promesse », pas 0 %.
- Un résultat de visite « promesse » (FR-102) crée la même promesse.

#### FR-119 : Le blocage du crédit bloque la commande

Un responsable du recouvrement, un DAF ou un DG peut bloquer ou débloquer le crédit d'un Tiers ; le blocage est appliqué par le serveur à toute commande. Réalise UJ-4.

**Conséquences (testables) :**
- Le blocage est automatique quand un Tiers a une Créance de plus de 60 jours ou un encours supérieur au plafond (FR-52), selon l'échelle (FR-114). Il peut être posé à la main avec un motif.
- Un Tiers au crédit bloqué voit sa commande refusée `CREDIT_BLOQUE` par le module `commande` (FR-33), quel que soit le canal : bureau, terrain, WhatsApp. Test : Mensah bloque le Tiers à 75 jours ; la commande de Kodjo est refusée au serveur, même en URL directe.
- Le déblocage n'est jamais automatique. Il demande un acompte (Encaissement) ou un échéancier signé (promesse avec pièce) et une décision d'un DAF ou d'un DG. Un responsable du recouvrement le propose ; il ne le décide pas. La décision suit FR-14.
- Chaque blocage et déblocage est un événement du journal avec auteur, motif, date. L'agent du Tiers et le superviseur sont notifiés.
- Une commande déjà validée avant le blocage n'est pas annulée ; sa livraison suit le blocage de la règle de `commande`. [ASSUMPTION: pas de coupure de livraison déjà préparée sans décision du DG.]
- Sans module `commande`, le blocage est une information sur le Tiers, affichée « sans effet : commande non installé ».

#### FR-120 : La file du jour, priorisée par ce qu'elle rapporte

Un responsable du recouvrement peut ouvrir sa file du jour : les Dossiers à traiter, triés par valeur espérée. Réalise UJ-4.

**Conséquences (testables) :**
- Le tri est par `valeur_esperee` décroissante. Mensah voit d'abord le Dossier dont `reste_du × probabilité` est le plus grand, pas le plus ancien.
- La file est bornée par une capacité par jour et par responsable (12 dossiers dans la démo, paramétrable). Les Dossiers au-delà sont dans « reporté à demain », avec le motif « capacité ».
- Chaque ligne propose : Envoyer maintenant, Enregistrer une promesse, Modifier le message, Reporter. Chaque bouton agit (FR-115, FR-118) ; « Reporter » enregistre une date et un motif.
- L'action recommandée est une règle : probabilité < 40 : contentieux ou échéancier ; retard > 60 jours : visite ; retard > 30 jours : appel puis échéancier ; paiement partiel obtenu : relancer sur le solde ; sinon : WhatsApp. Elle porte sa provenance (règle, version).
- Une Alerte (FR-14) arrive pour tout Dossier critique non traité depuis `N` jours.
- Le bloc « Cette nuit, sans vous » (relances parties seules, en attente de validation) compte des envois réels de `notification`, pas des cibles calculées (FR-163).

#### FR-121 : Planifier une visite de recouvrement

Un responsable du recouvrement ou un superviseur peut planifier une visite d'un agent chez un Tiers en retard. Réalise UJ-4.

**Conséquences (testables) :**
- La visite est créée par le module `terrain` (FR-100), motif « relance d'impayé », rang 0 de la tournée, reliée au Dossier. Elle apparaît dans le plan de l'agent à la prochaine synchronisation.
- La planification est un événement du journal du Dossier (`VISITE_PLANIFIEE`).
- Le choix de l'agent suit le portefeuille du Tiers ; un superviseur peut le changer dans son périmètre.
- La tournée de recouvrement (jusqu'à 9 plus gros débiteurs, démo) devient une proposition de tournée dans `terrain` (FR-100), jamais une liste hors du plan de l'agent.
- Le résultat de la visite (promesse, encaissement, absent) revient dans le Dossier sans ressaisie.
- Sans module `terrain` installé, le bouton est « non installé » ; une relance par visite reste possible à la main (événement `RELANCE` canal `VISITE`).

**Règles de calcul reprises de la démo.**
- Probabilité de recouvrement : base 95 / 82 / 65 / 45 / 30 selon le retard ; moins `provision × 0,4` ; plus `(score − 60) × 0,25` ; plus 10 si paiement partiel ; bornée 5-98 (FR-117).
- Valeur espérée = reste × probabilité ; priorité par valeur espérée décroissante (FR-120).
- Prévision : quasi certain ≥ 80, probable 55-79, incertain 35-54, perdu < 35 (FR-117).
- Capacité du jour : 12 dossiers (paramétrable, FR-120).
- Taux de réponse = {répondu, accord, visite, résolu} ÷ {envoyé, répondu, visite, accord, résolu, échec} ; recouvré du mois = somme des Encaissements sur Dossiers (calculés, FR-15).
- **Non reprises :** balance à 4 tranches ; blocage à J+30 ; promesses écrites en dur ; objectif de 40 M ; « DSO » = retard pondéré.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Envoyer relance (par canal) | simulé | FR-115 |
| Enregistrer paiement | simulé | FR-116 |
| Promesse | simulé | FR-118 |
| Escalader | simulé (un cran) | FR-114 |
| Bloquer / Débloquer crédit | simulé (aucun effet) | FR-119 |
| Annuler la dernière action | local | FR-113 (événement d'annulation) |
| Lancer la tournée | lien externe (branché) | FR-121 |
| Envoyer maintenant, Enregistrer une promesse, Modifier, Reporter (cockpit) | mort | FR-120 |

**Notes.**
- [ASSUMPTION: la Créance est tenue par `paiement` ; amendement du PRD `paiement` à écrire (FR-P13). Alternative écartée : un registre propre à `recouvrement` obligerait `facturation` à dépendre de lui pour afficher un reste dû.]
- [ASSUMPTION: relances à la date d'échéance, pas à la date d'émission, comme la balance âgée.]
- Question pour la partie 4 (contrat) : le manifeste `recouvrement` consomme `facturation.creance.changed@1` et `paiement.creance.soldee` ; vérifier que `paiement` accepte `tiers`, `source` et `perimetre` sur la créance projetée.
- Question : pénalités de retard du distributeur (non modélisées par la démo ; le PRD facturation les place sur la facture, FR-44).

---

### 6.3 Équipes et performance (`equipe`, M21)

**Dans la démo.** `/equipe` (`EquipeView`) : 8 KPI, trois vues (Classement et fiches, Tableau comparatif, Coaching et retours IA), fiche de commercial, matrice des scores de poste (`MatricePostesPanel`). Chaque cockpit porte aussi un `PerformancePostePanel` (score /100, 4 à 5 KPI, tendance 6 mois).
- **Constantes :** tous les KPI de poste (période figée « Juin 2026 ») ; « Objectif CA » 87 % en dur ; synthèse du DG et 5 décisions recommandées écrites à la main, avec des noms ; statut de performance écrit en dur pour 4 commerciaux.
- **Deux systèmes de statut :** le score de poste (EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60) et un statut de performance à 5 niveaux (TOP, PERFORMANT, NORMAL, SOUS_PERF, DEGRADE) tiré du « score IA ». Une formule de performance globale `(visites% + vs équipe% + recouvrement% + 2 × transformation%) ÷ 4` est sans justification.
- **Rémunération inventée :** commission 2,8 à 3,8 % tirée au hasard, base 280 à 420 K tirée au hasard, rémunération du freelance = CA société + marge (formule incohérente). Aucun barème réel.
- **Fuites de périmètre :** « Vue DG » affichée au superviseur, au responsable des ventes et au contrôleur de gestion ; repli sur toute l'équipe si le périmètre est vide ; rémunération individuelle visible du superviseur et du contrôleur.
- **MORT :** « Valider » et « Refuser » des demandes de remise ; aucune action « Planifier un coaching », « Fixer un objectif », « Valider une prime ».
- Rôles : DG, DC, RESP_VENTES, SUPERVISEUR, CONTROLE_GESTION.

**Noyau commun.**
- **KPI de poste** : un registre, par Rôle, de 4 à 5 indicateurs : `code`, `libelle`, `poids` (la somme des poids d'un poste vaut 100), `objectif`, `sens` (plus haut ou plus bas est meilleur), `source` (module et requête qui le calcule), `plafond_atteinte` (130 % par défaut).
- **Objectif** : `agent` (ou poste), `kpi`, `periode`, `valeur`, `fixe_par`. Fixé par le supérieur, jamais en dur dans le code.
- **Score de poste** : moyenne des taux d'atteinte pondérée par les poids, bornée à 100. Taux d'atteinte = valeur ÷ objectif, plafonné ; pour un KPI « plus bas est meilleur », objectif ÷ valeur.
- **Statut de score** : EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60 (seuils paramétrables).
- **Plan de coaching** : `agent`, `motif`, `actions`, `echeance`, `fait_par`, `statut` (`PLANIFIE`, `FAIT`, `ABANDONNE`).
- **Barème de rémunération** : paramètres de commission et de prime par type de contrat (privé, FR-126).
- **Demande de dérogation** : `demandeur`, `objet` (une remise ; chez l'IMF, une dérogation de crédit), `montant` ou `pourcentage`, `statut`. C'est une Décision à trancher (FR-14).

Règles du noyau : un KPI se calcule depuis ses données (FR-15) ; un score dont un KPI n'a pas de source installée est un **score partiel**, annoncé « calculé sur N KPI sur M » ; une agrégation se limite au Périmètre du lecteur (FR-6).

**KPI de poste (valeurs initiales de la démo, objectifs paramétrables).**
| Poste | KPI et poids |
|---|---|
| COMMERCIAL | visites par jour 25 ; commandes prises 20 ; CA généré 25 ; transformation visite → commande 20 (cible 60 %) ; encaissement terrain 10 (cible 80 %) |
| FREELANCE | marge nette dégagée 30 ; CA société 20 ; points de vente du portefeuille 15 ; respect de la grille de prix 25 (marge minimale 12 %) ; nouveaux points de vente 10 |
| SUPERVISEUR | couverture des visites 25 ; commerciaux au quota 25 ; points de vente à risque de départ 20 (inversé) ; délai de litige 15 (inversé) ; CA de zone 15 |
| RESP_VENTES | CA de zone sur quota 30 ; commandes terrain par jour 20 ; panier moyen 20 ; points de vente actifs 20 ; taux de rupture à la commande 10 (inversé) |
| DC | CA réseau 30 ; couverture des tournées 20 ; marge brute 25 ; nouveaux points de vente 15 ; conversion des prospects 10 |
| PROSPECTION | survie à M+3 30 ; recensé → 1re commande 25 ; impayé sur 1re commande 20 (inversé) ; coût d'acquisition 15 (inversé) ; ouvertures transférées 10 (parties 2, FR-81 à FR-83) |
| RESP_STOCK, GEST_ENTREPOT | voir partie 2 (modules `stock`, `entrepot`) |
| DAF | solde de trésorerie 25 ; marge nette 25 ; dette fournisseurs échue 25 (inversé) ; DSO 15 (inversé) ; écart budget / réel 10 (inversé) |
| COMPTABLE | écritures saisies par jour 20 ; taux de rapprochement 25 ; suspens ouverts 25 (inversé) ; délai de clôture 15 (inversé) ; factures traitées par jour 15 |
| CONTROLE_GESTION | lignes de budget sous contrôle 25 ; écarts critiques ouverts 25 (inversé) ; précision de la prévision 20 ; délai du rapport au comité 15 (inversé) ; écart budget / réel 15 (inversé) |
| MARKETING | ROI des campagnes 30 ; points de vente touchés 20 ; conversion des promotions 20 ; coût par point de vente activé 15 (inversé) ; CA généré par combos 15 |
| RECOUVREMENT | montant encaissé 30 ; taux d'encaissement 25 ; DSO 20 (inversé) ; relances abouties 15 ; créances de plus de 60 jours 10 (inversé) |

Le DG n'a pas de KPI de poste ; il lit la matrice de tous les postes (FR-124).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Agent de terrain salarié | commercial salarié | agent de crédit salarié | agent salarié [ASSUMPTION] |
| Agent de terrain indépendant | commercial freelance (marge propre) | agent indépendant, démarcheur commissionné | courtier, apporteur [ASSUMPTION] |
| Demande de dérogation | demande de remise | demande de dérogation de crédit | dérogation de souscription [ASSUMPTION] |
| Superviseur | superviseur de zone | chef d'agence | chef d'agence |
| Zone | zone commerciale | agence | agence |
| KPI « conversion » | visite → commande | visite → décaissement [ASSUMPTION] | visite → proposition |
| KPI « recouvrement » | taux de recouvrement | PAR, taux de remboursement | taux d'encaissement des primes |
| Rémunération | commission, prime d'objectif | commission, prime de performance | commission |

**Propre au distributeur.** Le respect de la grille de prix et la marge nette du freelance (donnée privée, FR-8, FR-39) ; la remise de ligne ou globale à valider (FR-127) ; le quota par zone et le mix produits (partie 2, FR-76 et suivants).

---

#### FR-122 : Les KPI de poste se calculent

Un rôle peut lire ses KPI de poste, calculés depuis les données de ses modules. Réalise UJ-3.

**Conséquences (testables) :**
- Chaque KPI du tableau ci-dessus est calculé par une requête sur le module source. Aucune valeur n'est écrite dans le code (FR-15). Test (SM-5) : clôturer une visite avec commande change « commandes prises » et « transformation » de Kodjo.
- Les objectifs sont des **Objectifs** saisis par le supérieur, par période. Sans Objectif fixé, le KPI affiche « objectif non fixé », pas 100 %.
- Chaque KPI affiche valeur, objectif, tendance sur 6 mois (calculée sur les périodes passées) et poids.
- La période est celle de la date de lecture, pas « Juin 2026 ».
- Un KPI dont le module source n'est pas installé affiche « non installé » ; le score devient partiel (FR-123).
- Le registre des KPI (codes, poids, objectifs par défaut) est un paramétrage de l'Organisation, modifiable par le DG ou l'administrateur ; les poids d'un poste doivent sommer à 100 : refus `POIDS_INVALIDES`.

#### FR-123 : Score sur 100 et statut

Un rôle peut lire son score de poste et son statut. Réalise UJ-3.

**Conséquences (testables) :**
- Score = moyenne pondérée des taux d'atteinte, plafonnés à 130 % chacun, le tout borné à 100. Statut : EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60.
- Test : KPI à 100 % d'atteinte partout : 100, EXCELLENT. Un KPI de poids 25 à 0 % : 75, BON.
- Un KPI « plus bas est meilleur » (délai de litige) : taux = objectif ÷ valeur. Valeur 0 : taux plafonné (pas de division par zéro).
- Le statut de performance à 5 niveaux (TOP, PERFORMANT, NORMAL, SOUS_PERF, DEGRADE) et la formule de performance globale de la démo disparaissent : un seul score, quatre statuts.
- Un score partiel est marqué « partiel » et ne s'affiche pas comme comparable à un score complet dans les classements.
- Un poste CRITIQUE crée une Alerte (FR-14) chez son supérieur.

#### FR-124 : Classement, matrice des postes, périmètre

Un superviseur, un responsable des ventes, un DC ou un DG peut classer et comparer les agents de son Périmètre. Réalise UJ-3.

**Conséquences (testables) :**
- Le classement trie par score décroissant dans le Périmètre du lecteur. Un superviseur voit ses agents ; un responsable des ventes les agents de ses zones ; le DC et le DG tout le réseau.
- Un superviseur sans agent rattaché voit une liste **vide**. Le repli « toute l'équipe » de la démo est supprimé (FR-6).
- Le DG voit la matrice des postes (un score par poste, triée par score). Le DC voit celle des postes commerciaux. Aucun rôle ne voit un autre poste que ceux de son Périmètre.
- Les vues, filtres (Tous, Top performers, salarié, freelance, à surveiller) sont lus sur le serveur.
- L'écran porte le titre de son rôle (« Mon équipe », « Mes zones », « Périmètre commercial »), jamais « Vue DG » (FR-7).
- Le tableau comparatif n'expose pas la rémunération aux rôles qui n'y ont pas droit (FR-126).

#### FR-125 : Coaching enregistré

Un superviseur ou un responsable des ventes peut identifier les agents à coacher et planifier un coaching. Réalise UJ-3.

**Conséquences (testables) :**
- La priorité de coaching est une **règle** à points, paramétrable. Valeurs initiales de la démo : +50 si la part de visites hors zone dépasse un seuil (à la place de « alerte GPS », FR-106) ; +35 si la couverture est inférieure à 65 %, sinon +18 si inférieure à 72 % ; +28 si le score est inférieur à 72 [ASSUMPTION : score de poste], sinon +12 si inférieur à 75 ; +22 si des impayés sont à relancer ; +14 si les visites sont sous 85 % de l'objectif. Un agent à 20 points ou plus est « à coacher » ; quatre au plus, triés par priorité.
- La règle affiche sa provenance : « règle de coaching, version, date » (FR-16). Le texte « coaching IA » de la démo, écrit à la main pour 4 noms, disparaît ; une phrase de coaching est composée des points de la règle qui ont joué.
- « Planifier un coaching » crée un Plan de coaching (agent, motif, date, actions) lisible de l'agent.
- Un plan fait ou abandonné reste dans l'historique de l'agent. Le superviseur voit ceux de son Périmètre.
- Appeler et Réaffecter des points de vente sont des boutons « bientôt » (date à fixer).

#### FR-126 : Salariés, freelances et rémunération privée

Un DG ou un rôle habilité peut voir la rémunération d'un agent ; un agent voit la sienne. Réalise UJ-3.

**Conséquences (testables) :**
- Seuls l'agent lui-même, le DG et le rôle explicitement habilité lisent une rémunération individuelle (FR-8). Un superviseur, un responsable des ventes et un contrôleur de gestion ne la lisent pas, ni dans les encadrés « Top performers », ni dans le tableau comparatif. Test : l'appel serveur d'un superviseur ne contient aucun champ de rémunération.
- La marge propre d'un freelance n'est visible ni du superviseur ni de la société (FR-8). La société ne voit que son CA société.
- La rémunération vient du barème (FR-128) appliqué aux données réelles ; elle n'est plus tirée au hasard. Sans barème saisi, elle affiche « barème non saisi ».
- La rémunération d'un freelance est sa marge nette (écart entre son prix de vente et le prix société, FR-39). Elle n'est pas CA + marge (formule de la démo écartée).
- Le type de contrat (salarié, freelance) est une donnée de l'agent, utilisée par les KPI et les libellés.

#### FR-127 : Valider ou refuser une demande de remise

Un superviseur, un responsable des ventes ou un DG peut valider ou refuser une demande de remise dans son Périmètre. Réalise UJ-3.

**Conséquences (testables) :**
- Une remise demandée au-dessus du seuil de l'agent crée une Demande de dérogation, qui est une Décision à trancher (FR-14) : `A_TRANCHER` puis `VALIDEE`, `REFUSEE` ou `REPORTEE`, avec auteur, date et motif obligatoire pour un refus.
- Seuils par niveau, paramétrables (FR-13) : [ASSUMPTION : l'agent jusqu'à son seuil ; le superviseur jusqu'à un seuil intermédiaire ; au-delà de 12 % la validation revient au DG, comme pour les combos de stock]. Le serveur refuse une validation par un rôle dont le seuil est inférieur : `SEUIL_VALIDATION_INSUFFISANT`.
- « Valider » libère la remise sur la commande (FR-33) ou la proforma ; « Refuser » la rejette et l'agent est informé. L'effet est visible dans la commande.
- Une remise d'un freelance qui ramène sa marge sous le minimum (12 %) est refusée par la règle de la grille de prix.
- Toute décision est dans le journal des décisions (FR-14).

#### FR-128 : Barème de commission

Un DG ou un rôle habilité peut saisir le barème de commission et de prime. Réalise UJ-3.

**Conséquences (testables) :**
- Le barème est une donnée : taux de commission par type de contrat, prime d'objectif, base. Il est privé (FR-8).
- Une commission est calculée sur le CA facturé et encaissé de l'agent sur la période. [ASSUMPTION: la commission porte sur l'encaissé, pas sur le facturé ; à confirmer par le PO.]
- Une modification du barème est tracée (auteur, date, ancienne valeur) et ne change pas les périodes closes.
- Sans barème, aucune commission n'est affichée et le tableau dit « barème non saisi ».

**Règles de calcul reprises de la démo.**
- Score de poste, plafond 130 %, inversion des KPI « plus bas est meilleur », bornage à 100 (FR-123).
- Statuts EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60 (FR-123).
- Poids des KPI par poste (tableau du noyau).
- Priorité de coaching à points (FR-125).
- Clients récurrents = Tiers actifs ou fidèles du portefeuille ; à risque = en dégradation ou créance de plus de 20 jours (lues dans `pdv`).
- **Non reprises :** performance globale `(…) ÷ 4` ; statuts TOP à DEGRADE ; commission et base tirées au hasard ; rémunération du freelance = CA + marge ; repli sur toute l'équipe ; « Objectif CA 87 % » ; synthèse écrite à la main.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Filtres, onglets, ouverture d'une fiche | branché (local) | FR-124 (lu sur le serveur) |
| Valider / Refuser (demandes de remise) | mort | FR-127 |
| Planifier un coaching | absent | FR-125 |
| Fixer un objectif | absent | FR-122 |
| Valider une prime | absent | FR-128 ; la validation d'une prime est « bientôt » (date à fixer) |
| Réaffecter des points de vente | absent | « bientôt » |

**Notes.**
- [ASSUMPTION: les KPI de poste des rôles propres au distributeur (stock, entrepôt, prospection) sont définis dans leurs modules de la partie 2 ; ce module les agrège.]
- Question : la validation d'une prime et le versement de rémunération relèvent-ils d'un module de paie hors de ce PRD ? Le produit ne paie personne ; il calcule.

---

### 6.4 Comptabilité et finance (`finance-transactions`, M22)

Ce module regroupe le poste du comptable (`/comptabilite`) et le pilotage financier du DAF et du DG (`/pilotage-financier`).

**Dans la démo.** `/comptabilite` aiguille le COMPTABLE vers un poste de travail et les autres rôles vers une vue analytique en lecture seule ; `/pilotage-financier` aiguille le DAF vers `PilotageDAFView` et le DG et le DC vers `ComptabiliteDGView`.
- **Aucune écriture n'est générée.** Les écritures SYSCOHADA (journaux VT, BQ, AC, OD, CA, CH) sont des données statiques ; l'étiquette « Facturation auto » est une chaîne. Les numéros de pièce ont trois formats pour un même objet (`FAC-8840`, `FAC-2026-8821`, `FAC-8841`). La TVA de plusieurs écritures vaut 15 % du TTC, pas 18 %.
- **SIMULÉ :** « Lettrer », « Mettre en suspens », cases de la clôture (journalisées sans effet), « Saisir la facture d'achat » (état local perdu au rechargement), « Payer / Partiel / Reporter » du run (le recalcul de trésorerie est réel, localement), « Accorder / Sous condition / Refuser » (aucun plafond modifié), « Valider / Reporter » des décisions du DG (aucune écriture passée).
- **MORT :** « Télédéclarer sur le portail OTR », « Geler le run et générer les ordres de virement », « Relancer » les pièces manquantes. Les ordres de virement n'existent pas comme objet.
- **Constantes :** trésorerie sur 7 jours (7 lignes statiques), encaissements certains à 7 jours 32,4 M, plancher 40 M, jours avant clôture 19, BFR et marges de canal sur un registre saisi, 3 comptes de trésorerie (aucun compte Mobile Money).
- Rôles : COMPTABLE (poste), DAF (pilotage), DG et DC (vue DG), RECOUVREMENT (analytique).

**Ce que le module fait, et ce qu'il ne fait pas.** Le produit **ne passe pas d'écritures au sens grand livre** à ce jour : pas de grand livre légal, pas de report à nouveau, pas de clôture légale, pas d'états financiers certifiés. Le module exige trois choses : (1) **générer** des écritures équilibrées à partir des pièces (factures, avoirs, encaissements, factures d'achat) ; (2) **rapprocher** (lettrage, suspens, remises d'espèces) et **piloter** la trésorerie ; (3) **alimenter** le module amont `balance` : il lui **soumet** une balance par compte et par période, au contrat de balance canonique, que `balance` projette en bilan (partie 2 du produit : `balance` et ses adaptateurs). Le grand livre légal reste chez le client (Sage, ou son expert-comptable) tant que le PO ne l'a pas décidé autrement. L'export vers Sage vient après (« bientôt », FR-131). [ASSUMPTION: le contrat de balance canonique n'a pas de devise ; la devise de l'organisation (XOF) est une convention déclarée par l'Organisation, pas par la balance.]

**Noyau commun.**
- **Écriture** : `numero`, `journal`, `date`, `piece` (référence de la pièce source), `source` (type + référence), `lignes` (`compte`, `libelle`, `debit`, `credit`), `statut` (`BROUILLON`, `ATTENTE_VALIDATION`, `VALIDEE`, `CONTREPASSEE`), `auteur`, `valide_par`. Une écriture est équilibrée (débit = crédit) ou refusée `ECRITURE_DESEQUILIBREE`. Une écriture validée ne se modifie pas : elle se contre-passe.
- **Référentiel comptable** : un paramètre de l'Organisation (plan de comptes, journaux, taux). Le plan est une donnée, pas du code.
- **Compte de trésorerie** : `type` (`BANQUE`, `CAISSE`, `MOBILE`), `libelle`, `solde`, `entrepot_ou_lieu`. Les comptes Mobile Money sont des comptes à part entière.
- **Suspens** : `libelle`, `montant`, `anciennete_jours`, `sévérité` (`CRITIQUE`, `MODERE`), `action`, `statut`.
- **Tâche de clôture** : `libelle`, `categorie` (`SAISIE`, `RAPPROCHEMENT`, `CUT_OFF`, `PROVISIONS`, `DECLARATIF`), `fait`, `fait_par`, `bloquee_par`.
- **Échéance déclarative** : `nature` (TVA, cotisations sociales, impôt sur les sociétés), `periode`, `date_limite`, `montants`, `statut` (`A_PREPARER`, `PRETE`, `DECLAREE`, `PAYEE`), `bloquants`.
- **Prévision de trésorerie** : par jour, `entrees`, `sorties`, `solde_fin`, `alerte`. Elle porte sa provenance (FR-16).
- **Demande de crédit** : `tiers`, `type` (`DEBLOCAGE_COMMANDE`, `RELEVEMENT_PLAFOND`), `montant`, `risque`, `statut` (Décision à trancher, FR-14).
- **Ligne de run** : `fournisseur`, `montant_du`, `echeance`, `recommandation` (`PAYER`, `PARTIEL`, `REPORTER`), `montant_arbitre`. Le **run** est un état de préparation. L'**ordre de paiement** appartient à `paiement` (voir son PRD, FR-P65 à FR-P69).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Référentiel comptable | SYSCOHADA révisé | plan comptable des SFD de l'UEMOA [ASSUMPTION] | CIMA, une amorce [ASSUMPTION] |
| Pièce source d'une écriture | facture, avoir, encaissement, facture d'achat | échéance de prêt payée, décaissement, collecte d'épargne [ASSUMPTION] | prime, sinistre payé [ASSUMPTION] |
| Compte client (411) | clients | membres, encours de prêts [ASSUMPTION] | assurés, primes à recevoir [ASSUMPTION] |
| Provision | provision clients douteux | provision pour créances en souffrance [ASSUMPTION] | provisions techniques (hors module) |
| Déclaration | TVA 18 %, CNSS, impôt sur les sociétés | états réglementaires de la BCEAO [ASSUMPTION] | états de la CIMA [ASSUMPTION] |
| Factures d'achat | factures fournisseurs (marchandises) | charges d'exploitation [ASSUMPTION] | charges de gestion [ASSUMPTION] |
| Demande de crédit (client) | décision de crédit client | sans objet : l'octroi de prêt a son propre module | sans objet |
| Run fournisseurs | paiement des fournisseurs de la semaine | paiement des fournisseurs et refinancement [ASSUMPTION] | paiement des prestataires |
| Plancher de trésorerie | plancher de trésorerie | ratio de liquidité [ASSUMPTION] | marge de solvabilité (hors module) |

**Propre au distributeur.** La TVA de 18 % sur ventes et achats ; le BFR par stock, créances et dettes (FR-138) ; la marge nette par canal de distribution (FR-139) ; les décisions de crédit client sur la marge à 12 mois (FR-140) ; le run fournisseurs avec escompte et pénalité (FR-141) ; les ristournes fournisseurs et les lignes bancaires, écrits en `[ASSUMPTION]` comme extension (aucun bouton ne les porte dans la démo : « Réclamer » est absent).

---

#### FR-129 : Écritures de vente et provision générées

Un comptable peut lire, valider ou contre-passer les écritures générées par les factures, les avoirs et les provisions. Réalise UJ-1.

**Conséquences (testables) :**
- À l'émission d'une facture (FR-42), le module génère une écriture au journal VT : débit du compte client (411) du TTC, crédit des ventes (701100) du HT, crédit de la TVA collectée (443100). TVA = HT × 18 % (FR-45). Facture de 507 400 : TTC 507 400, HT 430 000, TVA 77 400. Test : débit = crédit, au franc près.
- Un avoir (FR-48) génère l'écriture inverse, rattachée à la facture d'origine.
- Une écriture porte la référence de sa pièce : un seul format de numéro, celui de la facture (FR-43). Les trois formats de la démo disparaissent.
- Une provision (débit 657100 pertes sur créances, crédit 491200 provision clients douteux) est proposée à partir du pourcentage de provision du Dossier (FR-117). Elle est `ATTENTE_VALIDATION` jusqu'à une Décision à trancher du DAF ou du DG (FR-14). Valider la décision passe l'écriture à `VALIDEE` et change la balance ; la refuser l'abandonne.
- Une écriture générée automatiquement n'est pas modifiable à la main ; on la contre-passe et on émet la correcte.
- Sans module `facturation` installé : « non installé », aucune écriture de vente.

#### FR-130 : Écritures d'encaissement et d'achat générées

Un comptable peut lire les écritures générées par les encaissements et les factures d'achat. Réalise UJ-1.

**Conséquences (testables) :**
- Un Encaissement confirmé par `paiement` génère : débit banque (512100), caisse (531100) ou compte Mobile Money, crédit du compte client (411). Un encaissement déclaré non validé (FR-104) génère une écriture `BROUILLON`, pas `VALIDEE`.
- Une facture d'achat (FR-134) génère : débit des achats (601100) du HT, débit de la TVA déductible (445200), crédit du compte fournisseur (401100) du TTC.
- Le journal indique pour chaque écriture sa source (« facture », « encaissement », « achat », « saisie manuelle »). Une saisie manuelle exige un motif et passe par ATTENTE_VALIDATION.
- Les journaux sont VT, BQ, AC, OD, CA, CH ; le plan et les comptes sont ceux du référentiel de l'Organisation.
- Un compte de trésorerie `MOBILE` existe : un encaissement par PI-SPI ou FedaPay y est inscrit.

#### FR-131 : La balance soumise, et l'export qui vient après

Un comptable ou un DAF peut soumettre la balance d'une période à `balance`. Réalise UJ-5.

**Conséquences (testables) :**
- Une balance par compte et par période (débit, crédit, solde, sens) est calculée à partir des seules écritures `VALIDEE`. Elle est **soumise** à `balance` (adaptateur de la source « distribution » du hub multi-sources), qui la projette en bilan.
- Une soumission est horodatée, signée de son auteur, et n'est jamais remplacée sur place : une rectification est une nouvelle soumission qui renvoie à la précédente.
- La somme des soldes débiteurs égale la somme des soldes créditeurs, sinon la soumission est refusée `BALANCE_DESEQUILIBREE`. Le solde du 411 égale le total de la balance clients (FR-50) : écart affiché en rouge.
- Sans module `balance` installé, le bouton est « non installé ».
- Le module ne tient pas de grand livre légal et ne clôture pas l'exercice au sens légal. Il le dit à l'écran.
- L'export des factures et des paiements dans un format importable par Sage est un bouton « bientôt » (décision du PO du 12/11/2026 : après le démarrage). [ASSUMPTION: date proposée : mars 2027, à confirmer.]

#### FR-132 : Lettrage et suspens

Un comptable peut rapprocher un encaissement à une Créance, ou le mettre en suspens. Réalise UJ-1.

**Conséquences (testables) :**
- Les encaissements non affectés (référence brute illisible, paiement groupé, paiement partiel) sont proposés avec une confiance de 0 à 100. À 70 ou plus, la proposition est « automatique » (paramétrable) ; en dessous, elle est « manuelle ». Une proposition est toujours confirmée par un humain en première version.
- « Lettrer » affecte l'encaissement à la Créance dans `paiement` : `reste_du` baisse partout (facture, Dossier, balance) et les relances du Dossier s'arrêtent si le solde est nul (FR-116). La démo ne changeait aucun solde.
- Un paiement groupé pour deux factures est ventilé ; un paiement partiel reste identifié comme partiel ; un virement Mobile Money au nom de l'agent plutôt que du client est signalé comme encaissement terrain non déclaré.
- « Mettre en suspens » crée un Suspens avec son ancienneté et son action, visible du DAF. Un suspens critique crée une Alerte (FR-14).
- Les montants sont comparés avec la tolérance d'arrondi de l'Organisation (paramétrable).
- Sans module `facturation` : « non installé », aucun lettrage.

#### FR-133 : Déclaration de TVA préparée, télédéclaration « bientôt »

Un comptable peut préparer la déclaration de TVA de la période. Réalise UJ-1.

**Conséquences (testables) :**
- TVA à payer = TVA collectée − TVA déductible − crédit reporté. Les deux premières sont des sommes d'écritures validées (FR-129, FR-130). Test : un jeu de 5 factures et 2 achats donne la TVA attendue au franc près.
- La déclaration affiche ses **bloquants** calculés : factures d'achat non saisies pour des réceptions de la période, avoirs clients à émettre pour un écart de livraison. Chaque bloquant porte son impact en francs. Un bloquant non levé empêche le statut `PRETE`.
- Les statuts sont `A_PREPARER`, `PRETE`, `DECLAREE`, `PAYEE`. « Déclarée » et « Payée » sont posés à la main avec la référence du justificatif ; le produit n'en est pas témoin.
- Une Alerte (FR-14) arrive à 7 jours de la date limite si la déclaration n'est pas prête.
- « Télédéclarer sur le portail OTR » est un bouton « bientôt » : il relèvera du module `declarations` (partie 4). Il ne simule rien. [ASSUMPTION: date proposée : à fixer avec le PO ; non demandé pour février.]
- Les majorations de retard (TVA, cotisations sociales, impôt sur les sociétés) sont des paramètres de l'Organisation, pas du texte libre.

#### FR-134 : Factures d'achat

Un comptable peut saisir la facture d'achat d'une commande fournisseur reçue. Réalise UJ-6.

**Conséquences (testables) :**
- Les candidates sont les commandes fournisseur `RECUE`, `RECUE_PARTIELLE` ou `LITIGE` (partie 2, FR-62, FR-72). La saisie est enregistrée côté serveur : un rechargement ne la perd pas.
- HT = TTC ÷ 1,18 arrondi ; TVA = TTC − HT ; écriture générée (FR-130). La dette fournisseur (FR-67) est alimentée.
- Un écart entre le bon de livraison et la réception : seules les quantités reçues sont facturées ; l'écart passe en avoir fournisseur (avertissement affiché).
- Statut de paiement : `NON_DUE`, `A_PAYER`, `PARTIEL`, `PAYEE`, `ECHUE`. Échéance = date de réception + délai de paiement du fournisseur (FR-59).
- Une facture d'achat saisie deux fois pour la même commande est refusée `FACTURE_ACHAT_EXISTANTE`.
- Sans module `approvisionnement` installé : « non installé ».

#### FR-135 : Clôture de période

Un comptable peut suivre et fermer les tâches de clôture de la période. Réalise UJ-5.

**Conséquences (testables) :**
- La checklist est enregistrée : cocher une tâche l'enregistre avec son auteur et sa date ; la décocher aussi. Les 12 tâches de la démo (saisie, rapprochement, cut-off, provisions, déclaratif) sont des valeurs initiales de l'Organisation.
- `avancement = tâches faites ÷ tâches`. Une tâche bloquée par un tiers (une pièce manquante, FR-136) est isolée et nommée.
- Les « jours avant clôture » = date de clôture prévue − aujourd'hui ; ce n'est plus 19 en dur.
- Une tâche « Déclaration TVA » devient faite quand la déclaration passe à `PRETE` (FR-133), pas en cochant à la main.
- Une période est « arrêtée » par le DAF une fois toutes les tâches faites ; une période arrêtée n'accepte plus d'écriture sans contre-passation. [ASSUMPTION: ce n'est pas la clôture légale de l'exercice.]
- L'arrêt d'une période est le déclencheur de la soumission de la balance (FR-131).

#### FR-136 : Remises de caisse et pièces manquantes

Un comptable peut contrôler les remises d'espèces des tournées et réclamer les pièces manquantes. Réalise UJ-3.

**Conséquences (testables) :**
- Le bloc « Remises de caisse » liste les remises saisies par les agents (FR-105) : encaissé théorique, remis, écart, date, jours sans remise, statut. Il ne contient rien de simulé : sans remise saisie, la ligne dit « non saisie ».
- Une remise sans bordereau est signalée. Un montant non remis depuis plus de 5 jours (paramétrable) crée une Alerte à escalader au superviseur.
- Rapprocher une remise valide les encaissements déclarés correspondants (FR-105) et crée l'écriture de caisse.
- « Relancer » une pièce manquante envoie un message réel au détenteur par `notification`, et journalise l'ancienneté et le nombre de relances. Sans `notification` : « non installé ».
- Une pièce manquante qui bloque une tâche de clôture le dit (FR-135).

#### FR-137 : Trésorerie à 7 jours

Un DAF ou un DG peut lire la trésorerie des 7 prochains jours, recalculée depuis les données. Réalise UJ-5.

**Conséquences (testables) :**
- Solde de départ = somme des soldes des comptes de trésorerie (banque, caisses, Mobile Money). Chaque jour : entrées prévues − sorties prévues, solde de fin.
- Entrées prévues = somme, par jour, des valeurs espérées des Créances échues ou promises ce jour-là (règle de FR-117). Sorties prévues = échéances fournisseurs (FR-67), échéances fiscales et sociales (FR-133), lignes du run gelé (FR-141). Aucun chiffre n'est une constante.
- Modifier une échéance fournisseur change la trésorerie prévue du jour (SM-5).
- Un jour sous le plancher de trésorerie (40 M par défaut, FR-13) crée une Alerte ; un pic de sortie (par exemple 28,6 M le jour d'un run) est signalé avec sa cause.
- La prévision porte sa provenance : « règle de trésorerie, version, date de calcul » (FR-16). Aucune « IA » n'est annoncée.
- Un compte sans solde saisi affiche « solde non saisi » ; les entrées d'un module non installé affichent « non installé ».

#### FR-138 : BFR

Un DAF ou un DG peut lire le besoin en fonds de roulement. Réalise UJ-5.

**Conséquences (testables) :**
- BFR = valeur du stock + créances clients − dettes fournisseurs. Le stock vient de `stock` (valorisation, partie 2), les créances de la balance (FR-112), les dettes de FR-67. Sans `stock` : « non installé », pas 0.
- DIO = stock ÷ (achats du mois ÷ 30) ; DPO = dettes fournisseurs ÷ (achats du mois ÷ 30) ; marge de manœuvre = DPO − DIO ; BFR en jours = BFR ÷ achats par jour ; variation = BFR − BFR du mois précédent (lu dans la période arrêtée précédente, FR-135).
- Le DSO affiché est le vrai DSO (FR-117), pas le retard moyen pondéré.
- Chaque chiffre porte sa période et sa date de calcul. Changer une facture d'achat change la dette, donc le BFR (test).
- [ASSUMPTION: le DPO de la démo rapporte le solde total de dette aux achats du mois, sans lien avec les délais réels de paiement ; cette formule est reprise telle quelle tant que le PO n'en a pas retenu une autre.]

#### FR-139 : Marge nette par canal

Un DAF, un DG ou un contrôleur de gestion peut lire la marge nette par canal. Réalise UJ-5.

**Conséquences (testables) :**
- Marge nette = marge brute − remises − commissions − transport − coût du crédit client − pertes sur créances. Marge nette % = marge nette ÷ CA du canal. Un canal sous 2 % est « destructeur de valeur » (seuil paramétrable).
- Chaque terme vient d'une donnée : marge brute des factures (FR-53), remises des lignes, commissions du barème (FR-128), transport des coûts de livraison saisis, pertes des provisions et abandons validés (FR-129), coût du crédit client = encours × taux paramétré [ASSUMPTION].
- Un terme sans source installée est affiché « non installé » ; la marge nette n'est alors pas calculée et le dit.
- Le canal est un attribut du Tiers (type) et de la commande. Les quatre canaux de la démo (boutiques de proximité, dépôts et supérettes, grossistes, enseigne B2B) sont des valeurs initiales du paramétrage.
- Cette marge est calculée **une seule fois**, ici, et lue par le contrôle de gestion (FR-151). La seconde implémentation de la démo disparaît.
- Une Alerte (FR-14) est créée pour un canal destructeur.

#### FR-140 : Décision de crédit client

Un DAF peut accorder, accorder sous condition ou refuser une demande de crédit ; l'effet est réel. Réalise UJ-4.

**Conséquences (testables) :**
- Une Demande de crédit est de type `DEBLOCAGE_COMMANDE` ou `RELEVEMENT_PLAFOND`. Elle affiche : encours, plafond, dépassement, exposition après décision, CA et marge sur 12 mois, nombre de retards sur 12 mois, délai de paiement moyen, ancienneté, risque.
- Rendement du crédit = marge sur 12 mois ÷ exposition après décision. Signal rouge si rendement < 100 %, retards > 5, délai moyen > 45 jours (seuils paramétrables).
- Accorder un relèvement de plafond modifie le plafond du Tiers dans `pdv` (FR-52). Accorder un déblocage de commande lève le blocage de crédit de FR-119. Refuser n'a aucun effet et motive. « Sous condition » enregistre la condition (acompte, échéancier) et la déclenche au moment où elle est remplie.
- La demande suit le modèle de décision (FR-14) : `A_TRANCHER` puis `VALIDEE`, `REFUSEE` ou `REPORTEE`, avec journal.
- Le DAF n'accorde pas au-delà de son plafond de validation ; au-delà, c'est le DG (FR-13).
- La décision est visible du recouvrement et de l'agent du Tiers.

#### FR-141 : Run fournisseurs et ordres de paiement

Un DAF peut préparer le run de paiement des fournisseurs de la semaine ; un second rôle valide les ordres ; ils partent par `paiement`. Réalise UJ-6.

**Conséquences (testables) :**
- Chaque ligne affiche : fournisseur, montant dû, retard, échéance, conséquence du non-paiement, couverture de stock, escompte, pénalité, recommandation (`PAYER`, `PARTIEL`, `REPORTER`). Le DAF peut changer le choix et saisir un montant partiel (60 % par défaut, paramétrable).
- Escompte capté = montant payé × escompte %, si payé avant l'échéance. Pénalité encourue = (dû − payé) × pénalité %, si le choix n'est pas `PAYER`. Rupture risquée = ligne reportée dont la couverture est inférieure à 10 jours.
- Trésorerie projetée après run = solde actuel + entrées prévues sur 7 jours (FR-137) − décaissé. Sous le plancher de trésorerie (FR-13), « Geler le run et générer les ordres de virement » est refusé `PLANCHER_TRESORERIE_FRANCHI`.
- « Geler le run » crée, pour chaque ligne, un **ordre de paiement préparé** dans `paiement` (voir son PRD, FR-P65). Un autre rôle que le préparateur le valide (FR-P66) ; il part sous le raccordement de l'organisation (FR-P67). L'issue vient du fournisseur de paiement (FR-P68). Le run n'est jamais un fichier à porter à la banque.
- Prospera ne détient jamais les fonds (NFR-1 de `paiement`) : aucun solde, aucun compte payeur Money Vibes.
- Le run lit un état, jamais l'ordre : l'ordre appartient à `paiement`. Sans `paiement`, « Geler le run » est « non installé ».
- Une facture d'achat payée passe à `PAYEE` quand l'issue de l'ordre est « exécuté » ; l'écriture de décaissement est générée (FR-130).

**Règles de calcul reprises de la démo.**
- TVA à payer = collectée − déductible − crédit reporté (FR-133).
- HT d'un achat = TTC ÷ 1,18 arrondi (FR-134).
- BFR, DIO, DPO, marge de manœuvre (FR-138).
- Marge nette par canal et seuil de 2 % (FR-139).
- Escompte, pénalité, 60 % du partiel (FR-141).
- Rendement du crédit et seuils rouges (FR-140).
- Lettrage automatique à 70 de confiance (FR-132).
- **Non reprises :** TVA à 15 % du TTC ; encaissements certains 32,4 M ; plancher en dur ; trésorerie statique sur 7 jours ; jours avant clôture 19 ; trois formats de pièce ; « Valider » sans écriture.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Télédéclarer sur le portail OTR | mort | « bientôt » (module `declarations`) |
| Lettrer / Mettre en suspens | simulé | FR-132 |
| Cases de la clôture | simulé | FR-135 |
| Saisir la facture d'achat | simulé (non persisté) | FR-134 |
| Relancer (pièces manquantes) | mort | FR-136 |
| Valider / Reporter (décisions du DG) | simulé | FR-129 (provision), FR-14 |
| Payer / Partiel / Reporter (run) | simulé (recalcul local réel) | FR-141 |
| Geler le run et générer les ordres de virement | mort | FR-141 |
| Accorder / Sous condition / Refuser | simulé | FR-140 |
| Réclamer une ristourne (absent) | absent | « bientôt » |

**Notes.**
- [ASSUMPTION: les ristournes fournisseurs, les lignes bancaires et les covenants (statuts et calculs de la démo) sont lus mais non modifiables en première version ; aucun bouton d'action n'existe dans la démo.]
- Question : le module `finance-transactions` couvre-t-il un jour le grand livre ? Le manifeste (partie 4, A.11) dit non « à ce jour » ; l'export Sage et la décision sur le grand livre sont à cadrer avec le PO.
- Question : `finance-transactions` « service à créer » (M22) ; les exigences FR-129 à FR-135 supposent ce service ou une extension de `balance`. À trancher dans la partie 4.

---

### 6.5 Marketing et campagnes (`marketing`, M23)

**Dans la démo.** `/marketing` a deux vues : l'opérateur (MARKETING, DC) et le DG (contrôle, pas de création). 8 KPI, bloc « Combos écoulement stock », promotions fournisseurs, 4 onglets (Campagnes, Pipeline leads, Segmentation IA, Zones blanches), analyses IA.
- **Seul circuit branché de bout en bout de la démo : les combos de stock.** Une machine à états persistée dans le navigateur (`EN_ATTENTE_DG` → `VALIDEE` → `CAMPAGNE_CREEE`, plus `AUTO_DISPONIBLE`) : détection par règles sur le stock, validation du DG si la remise est de 12 % ou plus (ou sévérité critique, ou « promo choc »), campagne `PLANIFIEE` de 14 jours créée une seule fois (idempotent), budget = cibles × 5 500 F. Mais aucun envoi réel : la campagne reste à 0 contacté, 0 CA.
- **MORT :** « Lancer », « Modifier », « Ignorer » du cockpit marketing ; aucun passage `EN_COURS`, `PAUSE` ou `TERMINEE` ; aucune création de campagne à la main. Les suggestions de campagnes et les 5 décisions du DG sont en lecture seule.
- **Chiffres :** les statuts de campagne viennent d'un registre ; 4 KPI d'en-tête sont en dur ; deux « ROI » différents (marge générée ÷ coût pour les campagnes ; marge incrémentale moins coût, ÷ coût, pour le studio social) et un ROI de poste figé à 214 %.
- Rôles : DG, DC, MARKETING.

**Noyau commun.**
- **Campagne** : `nom`, `objectif`, `offre`, `produits` (ou, chez d'autres verticales, `offres`), `canal` (`WHATSAPP`, `SMS`, `TERRAIN`, `MIXTE`), `segment`, `zone`, `dates`, `budget_max`, `cout`, `statut` (`BROUILLON`, `PLANIFIEE`, `EN_COURS`, `PAUSE`, `TERMINEE`, `ANNULEE`), `source` (manuelle, combo de stock, promotion fournisseur), `responsable`, `entonnoir`.
- **Entonnoir** : cibles, contactés, délivrés, ouverts, répondus, convertis. Chaque nombre est compté sur des faits (envois réels, réponses, commandes).
- **Cible de campagne** : un Tiers retenu ou écarté, avec le motif d'écart.
- **Attribution** : le lien entre une commande (ou, ailleurs, un contrat) et une campagne.
- **Combo** (offre issue du stock) : voir le noyau « offre d'écoulement » ci-dessous.

Règles du noyau : un envoi de masse passe par `notification` (voir son PRD, section E : liste, préparation, échantillon, reprise, interruption, validation) ; le consentement et le désabonnement sont ceux de `notification` (section H) ; une Campagne n'envoie rien à un Tiers exclu (FR-148).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Tiers | point de vente | membre, client, groupe solidaire | assuré, prospect |
| Campagne | campagne promo, combo d'écoulement | campagne d'épargne, de crédit, de renouvellement de prêt | campagne de souscription, de renouvellement |
| Offre | prix promo, combo | produit d'épargne ou de crédit [ASSUMPTION] | produit d'assurance [ASSUMPTION] |
| Segment d'exclusion | client en retard, crédit bloqué | membre en retard de remboursement [ASSUMPTION] | assuré en impayé de prime [ASSUMPTION] |
| Zone blanche | zone non couverte | village non couvert | zone non couverte |
| Combo de stock | combo d'écoulement | sans objet | sans objet |

**Propre au distributeur.** Les **combos de stock** : tout ce qui vient du stock lent, du produit moteur, de la remise et de la validation du DG (FR-144 à FR-146). Les promotions fournisseurs (remise volume croisée avec le surstock) sont une variante (FR-146). Les zones blanches et le pipeline de leads relèvent de `conquete-objectifs` (partie 2, FR-76 à FR-78) ; le studio social est la partie 2 (module `studio-social`).

---

#### FR-142 : Créer et conduire une campagne

Un opérateur marketing peut créer, planifier, lancer, mettre en pause, arrêter ou modifier une campagne. Un DG ou un DC voit les campagnes de son Périmètre. Réalise UJ-5.

**Conséquences (testables) :**
- Une campagne se crée à la main (nom, offre, segment, canal, dates, budget) ou depuis un combo (FR-146). Elle est enregistrée côté serveur dès la création (FR-1).
- Les transitions sont : `BROUILLON` → `PLANIFIEE` → `EN_COURS` → `PAUSE` ou `TERMINEE` ; `ANNULEE` avant le premier envoi. Une transition interdite est refusée `TRANSITION_INTERDITE`.
- « Lancer » passe la campagne à `EN_COURS` et déclenche l'envoi (FR-147) ; « Modifier » change l'offre, le message ou le budget d'une campagne non terminée et garde l'historique de la version.
- Un budget dépassé (`cout` > `budget_max`) met la campagne en `PAUSE` et crée une Alerte (FR-14).
- La vue DG est en contrôle : le DG voit, valide les combos soumis (FR-145), met en pause ; il ne rédige pas la campagne.
- Un MARKETING ne voit pas les marges individuelles d'un freelance (FR-8).

#### FR-143 : ROI et indicateurs de campagne calculés

Un opérateur marketing, un DC ou un DG peut lire les indicateurs de chaque campagne. Réalise UJ-5.

**Conséquences (testables) :**
- Taux de contact = contactés ÷ cibles ; taux d'ouverture ; taux de réponse ; taux de conversion = convertis ÷ contactés ; coût par conversion = coût ÷ convertis ; budget restant = budget − coût. Tous calculés sur les faits (FR-15).
- **Un seul ROI** : (marge incrémentale attribuée − coût) ÷ coût. La marge incrémentale = marge des commandes attribuées (FR-149) moins la marge habituelle de ces mêmes Tiers sur la même durée. [ASSUMPTION: la référence « habituelle » = moyenne des 3 mois précédents ; à valider avec le PO.] Le ratio « marge générée ÷ coût » de la démo est affiché sous un autre nom : « retour brut ».
- **CA attribué ≠ CA créé.** L'écran affiche les deux : CA attribué (commandes liées à la campagne) et CA incrémental (attribué − habituel). Seul le second entre dans le ROI.
- Un indicateur sans fait (campagne planifiée, rien envoyé) affiche « 0 contacté » ou « non commencée », jamais un ROI.
- Les KPI d'en-tête du cockpit sont des sommes sur les campagnes du Périmètre : plus de « 47 prospects / 34 % / 3 campagnes / 8 zones » écrits en dur.
- Une conclusion de campagne (« à reconduire, à arrêter ») est une règle, avec sa provenance (FR-16).

#### FR-144 : Détecter un combo de stock

Le système peut proposer un combo d'écoulement à partir du stock lent. Un responsable stock, un marketing ou un DG voit les propositions. Réalise UJ-5.

**Conséquences (testables) :**
- La détection est une **règle**, pas une « IA » (FR-16). Elle lit les alertes de stock lent de `stock` (partie 2). Un produit est « lent » s'il est déficitaire, en chute, de rotation ≥ 16 jours, ou de couverture ≥ 22 jours avec demande nulle ; jamais si tous les sites sont en rupture. Un produit « moteur » n'est pas en rupture et a un engouement fort, une rotation ≤ 8 jours ou des sorties ≥ 3 000 par mois. Deux moteurs au plus par produit lent. Seuils paramétrables.
- Remise proposée sur le produit lent : 20 % si déficitaire, 15 % si en chute, 18 % si rotation ≥ 25 jours, 12 % si ≥ 16 jours, sinon 8 %. Type : `PROMO_CHOC` si déficitaire ou rotation ≥ 28 jours, `BUNDLE_ADOPTION` si deux moteurs, sinon `COMBO_MOTEUR`.
- Un combo affiche : produit lent, moteurs, stock à libérer = min(stock − seuil, max(40, 35 % des sorties mensuelles)), coût évité par mois, CA potentiel, marge du combo, nombre de cibles. Six combos au plus, triés par coût du stock lent. Chaque combo porte « règle de combo, version, date ».
- Sans module `stock` : « non installé », aucun combo. Avec `stock` mais sans ventes historiques : « données insuffisantes », pas un combo vide.

#### FR-145 : Valider un combo, au DG au-dessus du seuil

Un DG peut valider ou refuser un combo ; un marketing peut transmettre un combo sous le seuil. Réalise UJ-5.

**Conséquences (testables) :**
- Un combo demande la validation du DG si sa remise est supérieure ou égale à 12 % (garde-fou paramétrable, FR-13), ou si sa sévérité est critique, ou s'il est de type `PROMO_CHOC`. Sinon, il est transmis automatiquement au marketing (« auto sous le seuil »).
- La validation est une Décision à trancher (FR-14) : `A_TRANCHER` puis `VALIDEE`, `REFUSEE` ou `REPORTEE`, avec auteur, date, motif. Le journal contient « validé par » : DG ou AUTO.
- Un combo `A_TRANCHER` n'apparaît pas chez l'opérateur marketing : il voit « validation du DG requise ». Une transmission par un marketing d'un combo qui exige le DG est refusée `VALIDATION_DG_REQUISE` par le serveur.
- Les 5 décisions marketing du DG de la démo (lecture seule, écrites à la main) sont remplacées par les combos et campagnes réellement `A_TRANCHER`.

#### FR-146 : De la validation à la campagne

Un opérateur marketing peut créer la campagne d'un combo validé, la modifier, la lancer ou l'ignorer. Réalise UJ-5.

**Conséquences (testables) :**
- « Créer la campagne » est idempotent : appelée deux fois, elle retourne la même campagne. Elle crée une campagne `PLANIFIEE` de 14 jours (paramétrable), canal WhatsApp, budget = cibles × 5 500 F (paramétrable), avec le produit lent, les moteurs, les prix promo, un responsable affecté selon la zone. Recommandation affichée : ne pas appliquer la remise sans le panier moteur.
- « Ignorer » un combo l'écarte avec un motif ; il ne revient pas sans changement du stock. « Modifier » change le message, la remise (qui peut re-déclencher FR-145 si elle dépasse le seuil) ou la cible.
- L'ensemble du circuit **détection → validation du DG → marketing → campagne → envoi → commandes** est enregistré côté serveur et visible de chaque rôle (FR-3). Test de bout en bout : un combo détecté arrive en `A_TRANCHER` chez le DG, passe `VALIDEE`, le marketing crée la campagne, la lance, les messages partent, une commande est attribuée.
- Une promotion fournisseur (remise volume croisée avec un surstock > 45 jours) suit le même circuit : campagne d'écoulement de 21 jours, budget = cibles × 4 500 F (paramétrable).
- Sans `notification`, « Lancer » est « non installé » (FR-147).

#### FR-147 : L'envoi part pour de vrai

Lancer une campagne envoie réellement les messages aux cibles retenues, par le module `notification`. Réalise UJ-5.

**Conséquences (testables) :**
- À « Lancer », la liste des cibles retenues est transmise à `notification` comme liste d'envoi de masse (voir son PRD, FR-N28 à FR-N34) : échantillon, fenêtre horaire, plafond d'envois, validation éventuelle par un rôle habilité, reprise après interruption.
- Avant l'envoi, la campagne affiche : destinataires retenus, **écartés et pourquoi** (désabonné, canal absent, exclu pour impayé, plafond de messages atteint), coût estimé (voir FR-N31).
- L'accusé de réception et les réponses reviennent dans l'entonnoir (contactés, délivrés, répondus). Un compteur ne bouge jamais sans envoi.
- Une campagne interrompue garde l'état exact au moment de l'arrêt (FR-N32).
- Un désabonnement intervenu pendant l'envoi est respecté immédiatement (FR-N48).
- Sans `notification` installé : « non installé » ; la campagne reste `PLANIFIEE`.

#### FR-148 : Exclusions et plafond de messages

Le serveur exclut des campagnes les Tiers en défaut ou au crédit bloqué, et limite le nombre de messages par Tiers. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Un Tiers est exclu de tout envoi commercial s'il a une Créance de plus de 30 jours de retard, un crédit bloqué (FR-119) ou le statut « à risque ». Seuil paramétrable (`SEUIL_EXCLUSION_JOURS`).
- Le plafond est de **2 messages commerciaux par Tiers et par semaine**, toutes campagnes et règles d'automatisation confondues (paramétrable). Un message de recouvrement (transactionnel) n'y compte pas.
- Les Tiers exclus **restent visibles** dans la campagne avec leur motif (« retard de 47 jours », « plafond atteint »). Une exclusion qui bloque en silence est une exclusion qu'on finit par ne plus croire.
- Test : un Tiers au crédit bloqué (FR-119) est retiré de la cible d'une campagne lancée après le blocage, et réapparaît au déblocage.
- Sans module `recouvrement` ni `facturation` : l'exclusion pour impayé est « non installé » et l'écran le dit ; le plafond de messages s'applique toujours.

#### FR-149 : Relier les commandes aux campagnes

Une commande peut être attribuée à une campagne ; le marketing peut lire le CA attribué. Réalise UJ-5.

**Conséquences (testables) :**
- Une commande est attribuée à une campagne si son Tiers a été contacté (message délivré) et si elle contient un produit de l'offre, dans la durée de la campagne plus 7 jours (paramétrable). [ASSUMPTION: règle d'attribution à valider avec le PO.]
- Une commande n'est attribuée qu'à une campagne ; en cas de chevauchement, c'est la plus récente.
- Le lien est visible dans la commande (« issue de la campagne X ») et dans la campagne (liste des commandes attribuées).
- Le CA attribué et le CA incrémental alimentent le ROI (FR-143) et le KPI de poste du marketing (FR-122).
- Une commande annulée ou un avoir retire son montant du CA attribué.
- Sans module `commande` : « non installé ».

**Règles de calcul reprises de la démo.**
- Détection et remise du combo (FR-144) ; seuil de validation du DG à 12 % (FR-145) ; budget = cibles × 5 500 F, durée 14 jours (FR-146).
- Taux de contact, d'ouverture, de réponse, de conversion ; coût par conversion (FR-143).
- Plafond de 2 messages par client et par semaine ; exclusion à 30 jours de retard (FR-148).
- **Non reprises :** statuts de campagne issus d'un registre ; ROI figé à 214 % ; KPI d'en-tête écrits en dur ; « 4 500 F » et « 5 500 F » comme constantes (ils deviennent paramètres).

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Valider et transmettre au marketing (DG) | branché (navigateur) | FR-145 |
| Transmettre au marketing (sous le seuil) | branché (navigateur) | FR-145 |
| Créer la campagne / Voir la campagne | branché (navigateur) | FR-146 |
| Lancer | mort | FR-142, FR-147 |
| Modifier (le message) | mort | FR-146 |
| Ignorer | mort | FR-146 |
| Monter la campagne (promo fournisseur) | branché (navigateur) | FR-146 |
| Créer une campagne à la main | absent | FR-142 |

**Notes.**
- [ASSUMPTION: le studio réseaux sociaux (calendrier de publications, inbox unique) est le module `studio-social` de la partie 2. Ses publications réelles (Facebook, TikTok, Instagram) ne sont pas dans ce module.]
- Question : le « chatbot » WhatsApp de qualification des leads (règle `mkt-qualif-leads`) est-il un module ? Il n'existe pas dans le catalogue ; bouton « bientôt », sans date.
- Question : « ROI incrémental » exige un témoin ; sans témoin, le ROI affiché est le retour brut. Décision du PO attendue.

---

### 6.6 Contrôle de gestion (`controle-gestion`, M25)

**Dans la démo.** `/controle-gestion` (CONTROLE_GESTION seul) a 6 onglets : Cockpit, Budgets, Écarts, P&L analytique, Forecast, Rapports.
- **Tout est statique.** 19 lignes de budget pour juin 2026, une ligne par axe × centre × poste. Les **écarts ne sont pas calculés** depuis les budgets : ce sont des lignes saisies à part (risque d'incohérence). Le compte de résultat par axe est une table. Les 9 lignes de prévision glissante (3 mois × 3 scénarios) sont statiques ; « précision de la prévision » compare la prévision au budget, pas au réel.
- **Aucune saisie ou modification de budget**, aucune version, aucun « Figer le budget juillet ».
- **SIMULÉ :** « Envoyer le rapport » écrit un rapport dans le navigateur ; le DG et le DAF le voient dans leur courrier et le marquent lu. Ni PDF, ni e-mail, ni notification. « Export fichier » : CSV côté client ; PDF = `window.print()`.
- **Constantes :** marge cible 16,5 %, bande de ±3 %, période « Juin 2026 », version `BUD-2026-06-V1`.
- **Duplication :** la marge nette par canal est calculée deux fois (DAF et contrôle de gestion).
- Les causes et actions des écarts sont des textes écrits à la main, étiquetés « IA ».

**Noyau commun.**
- **Axe** : une dimension d'analyse paramétrable (zone, canal, famille de produits ; chez d'autres verticales, agence, produit).
- **Ligne de budget** : `axe`, `centre`, `poste` (`CA`, `MARGE`, `CHARGES`, `STOCK`), `periode`, `montant`, `version`.
- **Version de budget** : `code`, `periode`, `statut` (`BROUILLON`, `FIGEE`), `figee_par`. Une version figée ne se modifie plus ; une révision est une nouvelle version.
- **Écart** : `axe`, `centre`, `poste`, `budget`, `reel`, `atterrissage`, `ecart_pct`, `ecart_montant`, `severite` (`CRITIQUE`, `HAUTE`, `MODEREE`, `FAIBLE`), `cause`, `action_suggeree`, `confiance` (`AUTO`, `A_VALIDER`, `SUGGESTION`).
- **Prévision glissante** : par mois (3 mois), par scénario (`BASE`, `HAUT`, `BAS`), CA, marge, charges, trésorerie indicative.
- **Rapport de gestion** : `modele`, `titre`, `resume`, `ecarts`, `destinataires`, `statut` (`BROUILLON`, `ENVOYE`, `LU`), `envoye_par`, `lu_par`.

Règles du noyau : « le DAF arbitre, le contrôleur contrôle » : le contrôle de gestion mesure, alerte et propose ; il ne décide pas. Une proposition à arbitrer est une Décision à trancher adressée au DAF (FR-14).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Axe « lieu » | zone | agence | agence [ASSUMPTION] |
| Axe « canal » | canal de distribution | canal de collecte [ASSUMPTION] | réseau de distribution [ASSUMPTION] |
| Axe « famille » | famille de produits | produit financier [ASSUMPTION] | branche, produit [ASSUMPTION] |
| Poste `CA` | chiffre d'affaires | encours, produit net bancaire [ASSUMPTION] | primes émises [ASSUMPTION] |
| Poste `STOCK` | stock | sans objet | sans objet |
| Poste `MARGE` | marge brute | marge d'intérêt [ASSUMPTION] | marge technique (hors module) |

[ASSUMPTION: le manifeste classe le contrôle de gestion « distributeur ; microfinance à confirmer » ; la colonne IMF est une proposition.]

**Propre au distributeur.** Le poste `STOCK` et le BFR ; les coûts de transport et le coût du crédit client dans la marge nette (FR-139) ; les trois axes zone, canal, famille.

---

#### FR-150 : Budgets saisis et versionnés

Un contrôleur de gestion peut saisir, modifier et figer un budget par axe, centre et poste. Réalise UJ-5.

**Conséquences (testables) :**
- Une ligne de budget se saisit à la main ou s'importe d'un fichier (FR-18 pour le format). Elle est enregistrée côté serveur avec son auteur et sa version.
- « Figer le budget de juillet » passe la version à `FIGEE` : plus de modification possible, refus `BUDGET_FIGE`. Une révision crée une nouvelle version rattachée à la précédente.
- La somme des centres d'un axe peut être comparée à la ligne « Réseau » ; un écart de cohérence entre axes est signalé (pas forcé).
- La période est celle de la date de lecture, plus la liste des périodes passées. Plus de « Juin 2026 » figé.
- Seul le contrôleur de gestion saisit un budget ; le DG et le DAF le lisent.

#### FR-151 : Budget, réel, projection

Un contrôleur de gestion, un DAF ou un DG peut comparer budget, réel et projection par axe. Réalise UJ-5.

**Conséquences (testables) :**
- Le **réel** vient des modules : CA des factures (`facturation`), marge (FR-53, FR-139), charges des écritures (FR-129, FR-130), stock de `stock`. Un poste dont la source n'est pas installée affiche « non installé ».
- Écart % = (réel − budget) ÷ |budget| × 100, arrondi à 0,1 ; budget nul : 0 si réel nul, sinon 100 (règle de la démo). Une ligne est « sous contrôle » si |écart %| ≤ 3 (bande paramétrable). Test : budget 1 000, réel 1 030 : 3,0 %, sous contrôle ; réel 1 031 : 3,1 %, hors bande.
- **Atterrissage** = projection du réel du mois à la fin du mois (réel à date + rythme restant). Calculé, jamais saisi. Il porte sa provenance « règle d'atterrissage, version ».
- Les écarts sont **calculés depuis les lignes de budget**, pas saisis à part : un seul tableau, deux lectures. Test : modifier le réel (une facture) change l'écart.
- Les KPI du cockpit : CA budget et réel, marge budget et réel, part des lignes sous contrôle, écarts critiques ouverts. Aucun n'est une constante.
- Marge cible, bande, période sont des paramètres de l'Organisation (16,5 % et 3 % sont des valeurs initiales).

#### FR-152 : Écarts avec cause et action proposée

Un contrôleur de gestion peut lire les écarts classés par sévérité, avec une cause et une action. Réalise UJ-5.

**Conséquences (testables) :**
- La sévérité est une règle sur l'écart (seuils paramétrables par poste). Un écart critique crée une Alerte (FR-14).
- La cause est composée par une règle à partir des données (écart de volume, de prix, de mix, de coût). Elle affiche « règle de cause, version » et un niveau de confiance : `AUTO`, `A_VALIDER` ou `SUGGESTION`. Le texte écrit à la main de la démo, étiqueté « IA », disparaît.
- Une action suggérée peut devenir une Décision à trancher adressée au DAF (FR-14) : « le DAF arbitre, le contrôleur contrôle ». Le contrôleur la propose ; il ne l'applique pas.
- Un écart a un état (`OUVERT`, `EN_TRAITEMENT`, `CLOS`) et un responsable.
- Les écarts d'un poste dont la source est « non installé » n'existent pas ; ils ne valent pas 0.

#### FR-153 : Compte de résultat par axe

Un contrôleur de gestion, un DAF ou un DG peut lire le compte de résultat par zone, canal ou famille. Réalise UJ-5.

**Conséquences (testables) :**
- Par centre : produits, charges, marge brute, marge brute %, résultat, résultat %. Calculés sur les factures et les écritures, ventilés par axe.
- La somme des centres d'un axe égale le compte de résultat de l'entreprise (FR-129 à FR-131). Un écart est affiché en rouge avec l'axe en cause.
- Les charges non ventilables sont dans une ligne « non réparti », jamais cachées.
- Changer la zone d'un Tiers (FR-6, module `reseau`) déplace ses ventes dans le compte de résultat : test.

#### FR-154 : Prévision glissante sur 3 mois

Un contrôleur de gestion, un DAF ou un DG peut lire la prévision des 3 prochains mois, en trois scénarios. Réalise UJ-5.

**Conséquences (testables) :**
- La prévision est calculée par une **règle** : réel à date + tendance des 3 derniers mois (et saisonnalité si ≥ 12 mois d'historique), scénarios BASE, HAUT, BAS = écarts paramétrables autour de la base. Aucun modèle d'« IA » n'est affiché ; la provenance est « règle de prévision, version, date » (FR-16).
- Chaque mois affiche CA, marge, charges, trésorerie indicative et l'écart au budget du mois.
- La **précision de la prévision** = 1 − |prévu − réel| ÷ réel, mesurée à la fermeture du mois sur la prévision émise un mois plus tôt. Sans historique : « non mesurée » (la valeur de repli de 91 % de la démo est supprimée). La démo comparait la prévision au budget.
- Une prévision de trésorerie en dessous du plancher (FR-13) crée une Alerte.
- Moins de 3 mois d'historique : la prévision l'indique (« historique insuffisant ») et ne se présente pas comme fiable.

#### FR-155 : Rapports au DG et au DAF

Un contrôleur de gestion peut préparer un rapport et l'envoyer au DG et au DAF ; ils le lisent et le marquent lu. Réalise UJ-5.

**Conséquences (testables) :**
- Trois modèles de rapport (valeurs initiales : pack du comité de direction, alerte de marge d'un canal, flash d'une zone) ; le contrôleur choisit les écarts et au moins un destinataire (DG, DAF).
- « Envoyer le rapport » génère un **PDF réel** (FR-17) et envoie un message par `notification` (e-mail ou WhatsApp) avec un lien ; il crée un `RapportEnvoye` `ENVOYE` visible dans le courrier du DG et du DAF. Le destinataire le marque `LU` ; l'horodatage de lecture est enregistré.
- Le délai « rapport au comité » du KPI du contrôleur (FR-122) se mesure entre la fin de période et l'envoi.
- Sans `notification` : le rapport est `ENVOYE` dans le courrier interne et le message est « non installé ».
- L'export CSV contient tout le tableau du rapport, pas une ligne « Titre, Résumé, Destinataires » (démo).

#### FR-156 : Périmètre du contrôle de gestion

Le rôle CONTROLE_GESTION a une vue de lecture et de proposition ; elle respecte les données privées. Réalise UJ-5.

**Conséquences (testables) :**
- Le contrôleur lit les budgets, écarts, comptes de résultat, prévisions de toute l'Organisation. Il **ne lit pas** les rémunérations individuelles (FR-126) ni la marge d'un freelance (FR-8) : l'appel serveur n'en contient aucune.
- Le contrôleur n'a pas d'action de décision sur la trésorerie, le crédit client ni les paiements : ce sont des droits du DAF.
- L'écran `/facturation` ne lui présente pas de page vide : s'il n'a pas d'onglet, la route ne s'ouvre pas (FR-5).
- Aucun libellé « Vue DG » (FR-7).

**Règles de calcul reprises de la démo.**
- Écart % = (réel − budget) ÷ |budget| × 100 ; sous contrôle si |écart| ≤ 3 % (FR-151).
- Marge nette par canal : calculée une fois (FR-139).
- Part des lignes sous contrôle = lignes dans la bande ÷ toutes (FR-151).
- **Non reprises :** écarts saisis hors budgets ; précision de la prévision comparée au budget ; valeur de repli 91 % ; textes « IA » écrits à la main ; rapport sans PDF ; marge nette calculée deux fois.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Onglets, filtres d'axe, scénario | local | FR-151, FR-154 |
| Cartes de décision (clic) | local | FR-152 |
| Choix du modèle de rapport et des destinataires | local | FR-155 |
| Envoyer le rapport | simulé | FR-155 |
| Export fichier (CSV, PDF) | CSV branché ; PDF = impression | FR-17, FR-18 |
| Saisir un budget, créer une version, Figer le budget | absents | FR-150 |

**Notes.**
- [ASSUMPTION: l'axe « famille » exige que `catalogue` porte la famille de produits (partie 2) ; sans `catalogue`, l'axe est « non installé ».]
- Question : le contrôleur de gestion accède-t-il à des marges par client ? Aucune source ne le dit ; non accordé par défaut.

---

### 6.7 Automatisations (`automatisations`, M26)

**Dans la démo.** `/automatisations` (DG, MARKETING, RECOUVREMENT) montre 6 tuiles (actions automatiques, en attente de vous, retenues, valeur en jeu, temps gagné, équivalent temps plein), un encart « Trois niveaux de confiance, jamais un seul », et une carte par règle, dépliable (explication, garde-fous, quota, jusqu'à 6 cibles avec message prêt). Le moteur évalue les règles sur les registres à chaque affichage. 7 règles marketing et 9 règles de recouvrement.
- **Le « journal de la nuit » n'est pas sur cette page** : il est dans les cockpits (marketing, recouvrement, stock).
- **SIMULÉ :** interrupteur d'une règle (la page le relit, mais pas le badge du menu ni les cockpits) ; « Valider » une cible (badge « Validée », **aucun message ne part**) ; « Ignorer ». **MORT :** les cibles des règles AUTO (« Départ automatique demain 08:00 » est un texte : rien n'est planifié) ; « Lancer », « Modifier le message », « Ignorer » des cockpits.
- **Écart de cohérence :** le badge du menu (`AUTO_A_VALIDER`) se calcule sur les règles brutes ; valider une cible ne le fait pas baisser.
- **Constantes :** statistiques sur 30 jours (exécutions, taux de succès, impact) et gains de temps déclarés dans chaque règle.
- **Garde-fou transverse déjà codé :** exclusion des clients en défaut, plafond de 2 messages par client et par semaine ; les cibles exclues restent visibles avec leur motif.

**Noyau commun.**
- **Règle d'automatisation** : `nom`, `poste` (le rôle qui la possède), `declencheur`, `action`, `canal`, `mode` (`AUTO`, `A_VALIDER`, `SUGGESTION`), `actif`, `garde_fous`, `quota`, `module_proprietaire` (le module qui la définit : `recouvrement`, `marketing`, `stock`…).
  - `AUTO` : part sans intervention ; réservé aux actions réversibles et sans risque relationnel (rappel d'échéance, accusé de réception).
  - `A_VALIDER` : tout est prêt, un humain clique ; dès qu'il y a de l'argent, une remise ou la réputation en jeu.
  - `SUGGESTION` : le système signale ; l'humain décide et fait (baisser un plafond de crédit).
- **Cible** : ce sur quoi la règle agit : `regle`, `tiers`, `libelle`, `canal`, `message` (prêt à envoyer), `valeur`, `confiance` (0-100), `moment`, `statut` (`EN_ATTENTE`, `VALIDEE`, `REPORTEE`, `IGNOREE`, `EXECUTEE`, `RETENUE`), `retenue_par` (le garde-fou qui l'a écartée), `execution` (lien vers l'envoi réel).
- **Exécution** : un fait enregistré : règle, cible, heure, résultat, mode, auteur (`SYSTEME` ou une personne).
- **Garde-fou** : un paramètre qui bloque (FR-13), propre à une règle ou transverse.

Règles du noyau : les règles sont **définies par les modules métier** (le recouvrement définit ses paliers, FR-114 ; le marketing ses règles) ; le module `automatisations` est le moteur, la file d'arbitrage et le journal. Une règle n'est jamais une case décorative : elle produit des cibles réelles, enregistrées. Aucune règle ne contient de branche par verticale (une règle est une donnée).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Tiers | point de vente | membre, client | assuré |
| Règle de relance préventive | rappel d'échéance de facture | rappel d'échéance de remboursement | rappel de prime |
| Règle « client silencieux » | client sans commande depuis 30 jours | membre sans opération [ASSUMPTION] | assuré sans contact [ASSUMPTION] |
| Règle de suggestion de plafond | réduire le plafond de crédit | réduire le plafond d'octroi | sans objet |
| Règle de surstock | combo d'écoulement | sans objet | sans objet |

**Propre au distributeur.** Les règles de stock, de combo et de proforma qui expire ; le mode « SUGGESTION » appliqué au plafond de crédit client. Les règles du module `stock` (réappro, transfert) sont dans la partie 2.

---

#### FR-157 : La règle est un objet enregistré

Un DG, un marketing ou un responsable du recouvrement peut voir et paramétrer les règles de son poste. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Une règle est enregistrée côté serveur avec son déclencheur, son action, son canal, son mode, ses garde-fous et son quota. Les 7 règles marketing et les 9 règles de recouvrement de la démo sont des valeurs initiales fournies par leur module.
- Un DG voit les règles de tous les postes ; un marketing, celles du marketing ; un responsable du recouvrement, celles du recouvrement (FR-7). Ils modifient leurs règles dans leur Périmètre.
- Une règle porte une explication lisible : ce qu'elle fait, ce qu'elle refuse (ses garde-fous), son quota. Cette explication est composée de ses paramètres, pas écrite à part.
- Les statistiques de 30 jours (exécutions, taux de succès, impact) sont calculées sur les Exécutions réelles. Sans exécution : « aucune exécution », pas un taux.
- Une règle dont le module propriétaire n'est pas installé n'apparaît pas ; une règle dont le canal (`notification`) n'est pas installé apparaît « non installé ».

#### FR-158 : Trois modes, et un mode AUTO qui reste sûr

Une règle a un mode ; le serveur interdit AUTO pour les actions risquées. Réalise UJ-4.

**Conséquences (testables) :**
- `AUTO` ne s'applique qu'aux actions réversibles et sans risque relationnel : rappel d'échéance, accusé, relance douce. Le serveur refuse `AUTO` pour une règle dont l'action engage de l'argent, une remise, un blocage de crédit, une mise en demeure ou une publication : `MODE_AUTO_INTERDIT`.
- Une règle `A_VALIDER` prépare tout (cible, message) et attend un clic. Une règle `SUGGESTION` signale ; l'humain agit hors règle.
- Les trois modes sont toujours visibles : une carte dit « Automatique », « À valider », ou « Suggestion », jamais un mode unique.
- Un changement de mode d'une règle est un événement du journal (auteur, date, ancien mode).
- Le blocage de crédit automatique de FR-119 est une règle `AUTO` de blocage dont le **déblocage n'est jamais automatique** ; elle porte l'interrupteur `blocage-automatique-au-seuil` du manifeste.

#### FR-159 : Garde-fous transverses

Le serveur applique à toute règle les garde-fous de l'Organisation. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- **Exclusion** : un Tiers en défaut (retard au-delà du seuil, crédit bloqué, statut à risque) est exclu de tout envoi commercial (FR-148). Les cibles exclues restent visibles avec leur motif.
- **Quota** : 2 messages commerciaux par Tiers et par semaine, toutes règles et campagnes confondues (FR-148).
- **Fenêtre horaire** : pas d'envoi hors de la fenêtre autorisée par `notification` (voir son PRD, FR-N33).
- **Un garde-fou propre à la règle** (« un seul rappel par facture », « 2 appels par jour au plus ») est un paramètre vérifié par le serveur.
- Les garde-fous financiers de FR-13 (plafond de crédit, plancher de trésorerie, remise maximale) s'appliquent aux actions des règles comme aux actions humaines.
- Une cible retenue par un garde-fou est `RETENUE` avec le nom du garde-fou ; ce n'est jamais un échec silencieux.

#### FR-160 : File d'arbitrage : Valider, Reporter, Ignorer

Un rôle peut traiter les cibles d'une règle `A_VALIDER` ou `SUGGESTION` de son Périmètre. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Chaque cible `EN_ATTENTE` affiche son message prêt, sa valeur, sa confiance et le garde-fou qui s'applique.
- **Valider** exécute l'action : pour une règle de message, le message part par `notification` (FR-161) et la cible passe `EXECUTEE` ; la validation est un événement du journal. **Reporter** enregistre une date ; la cible revient à cette date. **Ignorer** exige un motif ; la cible ne revient pas pour cette règle pendant une durée paramétrable.
- Valider, Reporter et Ignorer sont enregistrés : un rechargement ne les perd pas ; ils sont lus par les autres écrans.
- Une validation ne passe pas outre un garde-fou : valider une cible `RETENUE` est refusé `GARDE_FOU_ACTIF`.
- Valider un message de mise en demeure exige le rôle du palier (FR-114).
- « Annuler » une validation est possible tant que l'action n'est pas partie ; sinon l'action est réversible ou non selon l'Exécution (FR-161).
- Une décision de la file relève du modèle de FR-14 lorsqu'elle porte de l'argent ou un crédit.

#### FR-161 : L'exécution est réelle

Une règle `AUTO` ou une cible validée s'exécute réellement. Réalise UJ-4.

**Conséquences (testables) :**
- Une règle de message `AUTO` envoie par `notification` à l'heure prévue. Le libellé « Départ automatique demain 08:00 » correspond à un envoi réellement planifié, annulable avant l'heure.
- Chaque Exécution est un fait : règle, cible, heure, résultat (délivré, échoué, annulé). Les statistiques de 30 jours en sont calculées (FR-157).
- Une Exécution qui échoue n'est pas rejouée sans limite : un nombre de tentatives paramétrable, puis `ECHEC` visible.
- Un envoi refusé par `notification` (désabonné, canal absent) est une Exécution `RETENUE` avec le motif.
- Une règle `AUTO` désactivée (FR-162) n'envoie plus rien dès l'instant de la désactivation, y compris pour les envois déjà planifiés (ils sont annulés et journalisés).
- Le temps gagné affiché = nombre d'Exécutions × minutes par action (paramétrable). C'est une estimation et il est libellé « estimé » (FR-15).

#### FR-162 : Activer et désactiver une règle, pour de vrai

Un rôle habilité peut activer ou désactiver une règle de son poste. Réalise UJ-4.

**Conséquences (testables) :**
- L'interrupteur est enregistré côté serveur (événement `REGLE_ON` / `REGLE_OFF`, auteur, date). Un rechargement ou un autre navigateur le retrouvent.
- Une règle désactivée produit zéro cible et zéro envoi ; sa carte est grisée ; la synthèse, le badge du menu, les compteurs des cockpits et le journal de la nuit se recalculent. Test : désactiver une règle fait baisser le badge.
- Désactiver une règle `AUTO` de blocage de crédit n'enlève aucun blocage existant (FR-119).
- Réactiver ne rejoue pas les cibles manquées pendant la pause.

#### FR-163 : Le journal de la nuit

Chaque cockpit peut afficher « Cette nuit, sans vous » : ce que les règles ont fait pendant la période. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Le journal de la nuit est la liste des Exécutions de la période, regroupées par domaine : marketing (messages partis, leads qualifiés, clients protégés exclus des promotions, à valider), recouvrement (relances parties seules, en attente de vous, promesses à surveiller), stock (voir la partie 2).
- Chaque ligne renvoie à son Exécution. Aucune ligne n'est un compteur écrit en dur.
- Le journal indique pour chaque entrée : exécutée, proposée, ou escaladée (le poste qui aurait dû décider), réversible ou non.
- La période par défaut est « depuis ma dernière connexion » ; elle est modifiable.
- Un module non installé n'a pas de bloc ; il n'affiche pas « 0 ».

#### FR-164 : Un badge qui compte le travail réel

Le menu affiche un badge : le nombre de cibles en attente de l'utilisateur. Réalise UJ-4.

**Conséquences (testables) :**
- Badge = nombre de cibles `EN_ATTENTE` des règles `A_VALIDER` et `SUGGESTION` actives, dans le Périmètre de l'utilisateur.
- Valider, reporter ou ignorer une cible fait baisser le badge à l'instant (la démo ne le recalculait pas).
- Désactiver une règle fait baisser le badge (FR-162).
- Un badge à 0 disparaît ; il ne montre pas « 0 ».
- Le badge est le même nombre que celui de la file (FR-160) : un test compare les deux.

**Règles de calcul reprises de la démo.**
- Garde-fou transverse : exclusion si retard > 30 jours, crédit bloqué ou statut à risque ; quota de 2 messages par client et par semaine (FR-159).
- Modes AUTO, À VALIDER, SUGGESTION (FR-158).
- Trois niveaux de confiance toujours affichés (FR-158).
- Équivalent temps plein = heures ÷ 150 par mois [ASSUMPTION: la démo utilise 150 ; paramétrable].
- **Non reprises :** statistiques et gains de temps constants ; départ « demain 08:00 » en texte ; badge calculé sur les règles brutes.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Interrupteur d'une règle | simulé (page seule) | FR-162 |
| Valider une cible | simulé (aucun envoi) | FR-160, FR-161 |
| Ignorer une cible | simulé | FR-160 |
| Reporter | absent | FR-160 |
| Lancer / Modifier le message / Ignorer (cockpits) | mort | FR-160 |

**Notes.**
- [ASSUMPTION: une file d'arbitrage unique pour toutes les règles, au lieu d'une par cockpit ; chaque cockpit en affiche sa part.]
- Question : un Copilot conversationnel et le « chatbot » de qualification de leads sont promis par la documentation et absents de la démo ; boutons « bientôt », sans date.

---

### 6.8 Tableau de bord et pilotage (`dashboard`, M28)

**Dans la démo.** `/dashboard` affiche un cockpit par rôle (`DashboardDG`, `DC`, `RespVentes`, `Superviseur`, `Commercial`, `Freelance`, `Prospection`, `Stock`, `GestEntrepot`, `Finance`, `Comptable`, `ControleGestion`, `Marketing`, `Recouvrement`). Chaque rôle hors DG a un panneau de performance de poste (FR-122). Le DG voit : bandeau « Les chiffres qui engagent une décision » (8 chiffres), courrier des rapports de gestion, rapport de direction, 10 KPI 360°, carte des zones, alertes, prévisions, balance âgée, top impayés.
- **Les valeurs viennent des registres (« une seule source de vérité »)**, mais **les variations sont des constantes** (4,2 / −8,4 / 12 / 18,6 / 2,1 / 1,7 / 3,4 / 5,8 %) ; la « moyenne 30 jours » du CA journalier est égale au CA du jour ; le « CA annuel » est un cumul de 6 mois ; le « total commandes » est le nombre de commandes du jour.
- **MORT :** le bouton « N alertes critiques » (aucun gestionnaire) ; l'encart « Attention » (texte figé) ; les décisions recommandées de `/equipe` et les 5 décisions marketing (lecture seule).
- **SIMULÉ :** « Valider » / « Reporter » d'une décision du DG (journal local, aucune écriture passée, aucune notification) ; « PDF » (`window.print()`) et « Envoyer par e-mail » (`mailto:` avec un résumé).
- **Rapport de direction :** généré par des gabarits de texte sur les registres, sans modèle ; date figée « 11/06/2026 à 06:00 » ; badge « AUTO 06:00 » décoratif ; aucun historique ni destinataire configurable.
- **Les alertes** sont trois mécanismes sans objet : bouton, encart, anomalies en lecture seule. Aucun cycle de vie.

**Noyau commun.**
- **Tableau de bord par rôle** : une composition d'éléments (bandeau de chiffres, alertes, décisions à trancher, file de travail, KPI de poste) définie par Rôle. Les éléments sont des données ; le contenu d'un élément vient des modules.
- **Chiffre de décision** : `cle`, `libelle`, `valeur`, `format`, `famille`, `detail`, `variation` (calculée, avec sa période de référence), `sens` (une hausse est mauvaise ou non), `statut` (`SAIN`, `ATTENTION`, `CRITIQUE`), `seuils`, `action` (libellé + écran). Trois familles : « Argent disponible », « Ce qu'on me doit / ce que je dois », « Activité ».
- **Alerte** et **Décision à trancher** : l'objet unique de FR-14 (`A_TRANCHER` → `VALIDEE`, `REFUSEE`, `REPORTEE`, journal). Ce module les présente, il ne les redéfinit pas.
- **Rapport de direction** : `periode`, `destinataire`, `sections`, `genere_a`, `source` (règle ou modèle, version), `statut` (`GENERE`, `ENVOYE`, `LU`), `pdf`.
- **Courrier de rapports** : les rapports de gestion reçus (FR-155).

Règle du noyau : chaque cockpit est un **assemblage de lectures** de modules. Un élément dont le module est absent affiche « non installé », jamais 0.

**Vocabulaire par verticale.** Le noyau du tableau de bord est identique ; ce qui change est l'ensemble des chiffres de décision, qui est une donnée de paramétrage.
| Chiffre du noyau | Distributeur (8 chiffres du DG) | IMF [ASSUMPTION] | Assurance [ASSUMPTION] |
|---|---|---|---|
| Argent disponible | solde caisse et banque ; bénéfice net | trésorerie et liquidité ; résultat net | trésorerie ; résultat |
| Ce qu'on me doit | crédit client (encours) | encours de prêts et PAR | primes à recevoir |
| Ce que je dois | dette fournisseurs | épargne collectée, dettes | provisions et réserves (hors module) |
| Activité | CA du jour, du mois, cumulé ; total des commandes | décaissements, collecte du jour, du mois | primes émises ; sinistres |

**Propre au distributeur.** Les 8 chiffres du DG et leurs seuils (FR-166) ; les 10 KPI 360° ; la carte et le pilotage par zone et par entrepôt ; les cockpits de stock, d'entrepôt, de prospection (parties 2).

---

#### FR-165 : Un cockpit par rôle, relu des modules

Chaque rôle peut ouvrir son tableau de bord, composé pour lui. Réalise UJ-2, UJ-3, UJ-4, UJ-5.

**Conséquences (testables) :**
- Le DG, le DC, le responsable des ventes, le superviseur, le commercial, le freelance, le chargé de prospection, le responsable stock, le magasinier, le DAF, le comptable, le contrôleur de gestion, le marketing et le responsable du recouvrement ont chacun leur composition. Un rôle ne voit pas le cockpit d'un autre (FR-7) ; aucun écran ne s'intitule « Vue DG » pour un autre rôle.
- Un commercial voit « Bonjour {prénom} » : ses visites, ses commandes, son CA, sa prochaine visite, son encaissé (calculés sur ses visites, FR-107, FR-122). Un superviseur voit les tournées du jour de son périmètre (couverture, strike rate, écart de caisse réels, FR-105). Un recouvrement voit sa file (FR-120).
- Les éléments sont lus sur le serveur dans le Périmètre du rôle (FR-6). Aucun chiffre n'est une constante (FR-15) : changer une visite ou une facture change le cockpit (SM-5).
- Chaque rôle hors DG a son panneau de performance de poste (FR-122, FR-123) ; le DG n'a pas de KPI de poste et voit la matrice (FR-124).
- Un élément dont le module source n'est pas installé affiche « non installé ».
- Les 10 KPI 360° du DG suivent les mêmes règles.

#### FR-166 : Les 8 chiffres du DG

Un DG peut lire les 8 chiffres qui engagent une décision, chacun avec son statut et son action. Réalise UJ-5.

**Conséquences (testables) :**
- Les 8 chiffres, leur calcul et leur règle de statut (valeurs initiales de la démo, seuils paramétrables par Organisation) :

  | # | Chiffre | Calcul | Statut | Action |
  |---|---|---|---|---|
  | 1 | Solde caisse et banque | somme des comptes de trésorerie (FR-137) | SAIN ≥ 100 M ; ATTENTION ≥ 60 M ; sinon CRITIQUE | Voir la trésorerie |
  | 2 | Bénéfice net du mois | résultat du mois (FR-153) ; marge nette en % du CA | SAIN ≥ 5 % ; ATTENTION ≥ 3 % ; sinon CRITIQUE | Compte de résultat |
  | 3 | Crédit client | somme des restes dus (FR-112), dont plus de 30 jours | CRITIQUE si la part en retard > 40 % de l'encours | Voir les impayés |
  | 4 | Dette fournisseurs | dette totale, dont échue (FR-67) | CRITIQUE si échu > 40 M ; ATTENTION si > 15 M | Échéancier fournisseurs |
  | 5 | CA journalier | CA du jour, commandes du jour | SAIN [ASSUMPTION : seuil sur objectif quotidien] | Voir les commandes |
  | 6 | CA mensuel | CA du mois ; % de l'objectif du mois | SAIN ≥ 95 % ; ATTENTION ≥ 85 % | Pilotage par zone |
  | 7 | CA cumulé de l'exercice | somme des mois écoulés ; % de l'objectif cumulé | SAIN ≥ 95 % ; ATTENTION ≥ 85 % | Pilotage financier |
  | 8 | Total des commandes | commandes du jour et commandes terrain du mois | SAIN [ASSUMPTION : seuil sur objectif] | File de préparation |

- **Les variations sont calculées** : valeur de la période ÷ valeur de la période de comparaison (mois précédent, ou moyenne des 30 derniers jours) ; la période de comparaison est affichée. Plus de constantes. Test : changer une facture change la variation.
- La « moyenne sur 30 jours » du CA journalier est la moyenne des 30 derniers jours, pas le CA du jour. Le « CA annuel » s'appelle « CA cumulé de l'exercice » et couvre l'exercice courant.
- Un chiffre `CRITIQUE` remonte visuellement et crée une Alerte (FR-14). Un chiffre `SAIN` ne génère rien.
- Un chiffre dont la source n'est pas installée affiche « non installé » (par exemple, la dette fournisseurs sans `approvisionnement`).
- Chaque chiffre a son bouton d'action vers l'écran concerné, restreint par la table d'accès du rôle (FR-5).
- Les seuils sont des garde-fous paramétrables (FR-13), pas des constantes ; ceux de la démo dépendent de la taille de l'Organisation (FR-10).
- Export CSV du bandeau (FR-18).

#### FR-167 : Alertes du jour

Un rôle peut lire les alertes de son Périmètre ; un DG voit le nombre d'alertes critiques et les ouvre. Réalise UJ-5.

**Conséquences (testables) :**
- Une alerte est l'objet de FR-14 : `domaine`, `severite` (`CRITIQUE`, `HAUTE`, `MODEREE`), `titre`, `detail`, `responsable`, `source` (règle), `heure`, `statut` (`OUVERTE`, `PRISE_EN_CHARGE`, `RESOLUE`), lien vers l'objet concerné (la Créance, le Tiers, la visite, le combo).
- Le bouton « N alertes critiques » est le nombre réel d'alertes critiques ouvertes du Périmètre ; il ouvre la liste (la démo : aucun gestionnaire).
- Une alerte est créée par une règle. Exemples déjà posés : écart de caisse (FR-105), visite hors zone (FR-102), Dossier critique non traité (FR-120), chiffre critique (FR-166), plancher de trésorerie (FR-137), écart de budget critique (FR-152), campagne hors budget (FR-142).
- L'encart « Attention » du DG est la liste réelle des alertes critiques ; il n'est plus un texte figé.
- Une alerte se prend en charge (un rôle s'en charge), se résout (avec motif), ou se rouvre. Chaque transition est tracée.
- Un rôle ne voit que les alertes de son Périmètre (FR-6).

#### FR-168 : Décisions à trancher

Un DG peut valider, refuser ou reporter ses décisions à trancher, avec effet réel. Réalise UJ-5.

**Conséquences (testables) :**
- La liste est celle de FR-14 : les décisions réellement `A_TRANCHER` pour le rôle, dans l'ordre de priorité. Elle regroupe provision (FR-129), crédit client (FR-140), combo (FR-145), validation d'achat (partie 2, FR-63), remise (FR-127), blocage de crédit (FR-119). Les 5 décisions écrites à la main de la démo disparaissent.
- Chaque décision affiche : sujet, montant ou impact, décideur requis, échéance, options, auteur de la demande.
- **Valider**, **Refuser**, **Reporter** sont enregistrés (statut, auteur, heure, motif ; motif obligatoire pour refuser). Cliquer deux fois ne l'efface pas ; une correction est un nouvel événement du journal.
- La validation a un **effet réel** : une provision validée passe son écriture à `VALIDEE` ; un crédit accordé change le plafond (FR-140) ; un combo validé passe au marketing (FR-145) ; une remise validée libère la commande. Test sur UJ-5 : le DG valide la provision de Kiosque du Port ; l'écriture est validée et la balance change.
- Une décision reportée revient à sa date. Une décision hors du plafond de validation du rôle est renvoyée au niveau supérieur (FR-13) : DAF puis DG.
- Le DAF est averti d'une décision qui lui revient (« en attente de votre signature ») par `notification` ou par sa file.
- Le journal des décisions (qui, quand, choix, réversible) est consultable par le DG et le DAF, filtrable, exportable.

#### FR-169 : Le rapport de direction

Un DG peut lire le rapport de direction de la période, généré depuis les données. Réalise UJ-5.

**Conséquences (testables) :**
- Structure (reprise de la démo) : (1) en-tête avec date de génération, période et destinataire ; (2) analyse de situation ; (3) analyse par domaine (ventes terrain, facturation et encaissements, stock et entrepôts, réseau freelance et marges, objectifs et prévisions) ; (4) lecture opérationnelle par entrepôt, canal et famille ; (5) chiffres clés ; (6) alertes immédiates ; (7) points forts et points d'attention ; (8) recommandations priorisées 1 à 3 avec impact et délai ; (9) prévisions à 30 jours et comparaison avec le mois précédent ; (10) pied.
- Toute valeur vient des modules (FR-15). Une section dont le module est absent dit « non installé ».
- Les **alertes immédiates** sont les alertes réelles (FR-167), pas des chaînes préfixées ; les **recommandations** sont les décisions et actions réellement ouvertes.
- La comparaison avec le mois précédent est calculée, avec sa période ; le caractère favorable ou défavorable d'une variation vient du sens du chiffre (FR-166), pas d'une expression régulière sur son nom.
- **Provenance** : le rapport indique comment il a été produit (« règle et gabarit », version, date de génération) ; il ne se dit pas « IA » tant qu'aucun modèle ne l'a rédigé. S'il est un jour rédigé par un modèle, il porte son nom, sa version et sa date (FR-16).
- Chaque rapport généré est conservé (historique) avec son destinataire et sa période ; l'« AUTO 06:00 » est une génération réellement planifiée (heure paramétrable), pas un badge.
- La mention « économie estimée : 4 h/semaine » est retirée tant qu'elle n'est pas mesurée.

#### FR-170 : PDF et Envoyer, pour de vrai

Un DG peut télécharger le rapport de direction en PDF et l'envoyer. Réalise UJ-5.

**Conséquences (testables) :**
- « PDF » produit un fichier PDF réel (FR-17), mis en page, conservé avec le rapport ; ce n'est pas `window.print()`.
- « Envoyer » ouvre une sélection de destinataires (le DAF, d'autres rôles ou des adresses) et envoie le rapport par `notification` (e-mail ou WhatsApp) avec le PDF ou un lien. L'envoi est un événement du rapport (destinataire, heure, résultat). Il ne passe pas par le client de messagerie de l'utilisateur.
- Test UJ-5 : le DG envoie le rapport au DAF ; le DAF le trouve dans son courrier, l'ouvre ; le statut passe `LU` avec l'heure.
- Sans `notification` : « Envoyer » est « non installé » ; le téléchargement du PDF reste possible.
- Le DG peut programmer un envoi récurrent (hebdomadaire) à des destinataires choisis. [ASSUMPTION: récurrence hebdomadaire seulement en première version.]

#### FR-171 : Exports et courrier de gestion

Un rôle peut exporter les listes de son tableau de bord et lire le courrier des rapports de gestion. Réalise UJ-5.

**Conséquences (testables) :**
- Chaque bandeau, liste d'alertes, liste de décisions, balance âgée et liste d'impayés se télécharge en CSV, et en PDF quand c'est un rapport (FR-17, FR-18). Un export respecte le Périmètre du rôle.
- Le courrier du DG et du DAF liste les rapports de gestion reçus (FR-155) : titre, émetteur, date, statut `ENVOYE` ou `LU`, avec le PDF. Marquer `LU` est enregistré.
- Les 10 KPI 360° et la carte des zones suivent les mêmes règles : valeur calculée, période affichée, « non installé » si la source manque.
- Un tableau de bord vide (aucun module installé) affiche l'invitation à installer, pas des zéros.

**Règles de calcul reprises de la démo.**
- Statuts des 8 chiffres et seuils (FR-166).
- Statut de score de poste (FR-123).
- Boutons d'action des chiffres : liens vers les écrans (repris).
- Structure du rapport de direction : 10 sections (FR-169).
- **Non reprises :** variations constantes ; moyenne sur 30 jours égale au CA du jour ; « CA annuel » de 6 mois ; encart « Attention » figé ; date du rapport figée ; badge « AUTO 06:00 » décoratif ; « 4 h/semaine » non mesuré ; `mailto:` pour l'envoi.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| N alertes critiques (bandeau) | mort | FR-167 |
| Valider / Reporter (décision du DG) | simulé | FR-168 |
| Refuser (décision du DG) | absent | FR-168 |
| Exporter PDF (rapport de direction) | `window.print()` | FR-170 |
| Envoyer par e-mail | `mailto:` | FR-170 |
| Export CSV du bandeau | branché (navigateur) | FR-166, FR-171 |
| Copilot (questions en langage naturel) | absent (promis par la documentation) | « bientôt », sans date |

**Notes.**
- [ASSUMPTION: le code `dashboard` est « déprécié » au catalogue (M28) ; ce module est à réactiver. Les cockpits restent une composition de lectures et ne possèdent pas de données propres.]
- [ASSUMPTION: les seuils des 8 chiffres sont des garde-fous paramétrables (valeurs de la démo) ; en absolu, ils ne conviennent qu'à un grand grossiste.]
- Question : le « Copilot » est-il un module ? Hors de ce PRD.

---

### 6.9 Support client et CRM interne (`support-client`, M03)

Ce module est **hors de ce PRD, à cadrer au lot 4**. La démo `prospera-distributeur` ne contient aucun écran de support client ni de CRM interne : il n'y a aucune exigence à tirer d'elle, et ce PRD n'en invente pas. La console d'administration de Money Vibes devenue CRM interne (plan à deux développeurs) est une affaire de la plateforme, pas du produit du distributeur.

- Le code `support-client` est au catalogue, marqué « déprécié ».
- Aucune exigence FR n'est posée ici ; aucun numéro n'est réservé.
- Quand le lot 4 le cadrera, il suivra la même règle que cette partie : un noyau commun, un tableau de vocabulaire par verticale, ce qui est propre à chacune.

---
