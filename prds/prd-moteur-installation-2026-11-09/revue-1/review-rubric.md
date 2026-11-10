# PRD Quality Review — Moteur d'installation (`platform-catalog-service`)

**Date :** 2026-11-10 · **Enjeu :** validation PO ven. 13/11, puis spine de la coque `prospera-app` ·
**Forme :** capacité plateforme interne, brownfield, chain-top (consommé par la spine de la coque, et
par les PRD Reprise de données et Connecteurs qui s'y raccordent)

## Verdict d'ensemble

La partie A (FR-1 → FR-7) est la meilleure partie que ce chantier ait produite : chaque exigence porte un
message d'écran, un code de refus et un test, et le journal du PO y est retranscrit fidèlement, valeurs
comprises (signal hebdomadaire, grâce 30 j, préavis 30 j, report unique de 7 j). Ce qui est en danger,
c'est son premier consommateur. Le PRD introduit « installé (essai) ≠ en service (réel) » sans dire
comment cela se lit dans l'entitlement `ACTIVE` du contrat de module, ni ce que le menu de la coque doit
montrer. Il ne réconcilie pas non plus ses règles avec ce qui tourne déjà sur `dev` : STORY-727 ouvre les
modules dès le paiement et donne le pack du vertical à toute organisation créée. Enfin, §8 déclare
« aucune question ouverte » alors que trois contradictions internes (retour arrière, connecteurs depuis
l'essai, sens de « pack ») et l'absence de découpage 15/01 / février / plus tard restent entières.

---

## 1. Decision-readiness — **adequate**

Les décisions sont écrites comme des décisions, pas comme des « considérations » : FR-15 assume que
« le silence ne punit pas » et en donne la raison ; FR-19 tranche « reporter une fois, jamais refuser » ;
FR-32 sépare proprement le droit d'utiliser et le droit aux mises à jour. Le §8 a en revanche le défaut
inverse : il clôt tout. Il ne contient aucun `[NOTE FOR PM]`, alors que les tensions ci-dessous sont
réelles et que le PO valide vendredi.

### Constats
- **high** — **Pas de découpage par échéance.** Le PRD a deux jalons (§1 : démo du 15/01, deux clients
  en février) mais ne dit nulle part quelles FR chaque jalon exige. FR-30/FR-31 (contribution, modèle
  commun) ne peuvent rien produire en février, puisque le contrat de module C11 constate qu'« aucun module
  IA n'existe en code ». FR-20 (vagues avec un client pilote) n'a pas de sens avec deux clients. SM-1
  (« bilan tout vert ») suppose que les modules du pack distributeur existent le 15/01 et passent leurs
  vérifications réelles (FR-6 : message WhatsApp reçu, lien PI-SPI généré). Sans découpage, Dev B ne peut
  ni chiffrer ni arbitrer. *Fix :* une table FR × {15/01, février, plus tard}, et un `[NOTE FOR PM]` sur
  la faisabilité de SM-1.
- **medium** — **« Il ne reste aucune question ouverte » (§8) est faux.** Les constats high de ce
  rapport (§4, §5, §6) sont des choix que le PO n'a pas encore rendus. *Fix :* rouvrir un §8 court
  (retour arrière et migrations, alignement sur STORY-727, connecteurs depuis l'essai, sens de
  « pack », AD-P16) et marquer chaque point en `[NOTE FOR PM]`.
- **medium** — **Le gel permanent bloque l'achat d'un module.** §3 définit le gel comme « ni installation,
  ni mise à jour », et FR-32 en fait l'état à vie d'un client qui a acheté le logiciel puis arrêté la
  maintenance. Ce client ne peut donc plus acheter de module, alors que son droit d'utiliser est
  perpétuel et que FR-14 fait arriver un ajout « par une nouvelle licence ». Est-ce voulu ? *Fix :*
  trancher (un ajout de module rouvre-t-il la maintenance, ou l'installation reste-t-elle permise en gel
  de fin de maintenance ?).

## 2. Substance over theater — **strong**

Rien ici n'est du décor. Les besoins du §2.1 sont tous repris dans une FR (DSI → FR-17/18/19 ;
direction MV → FR-14/16 ; équipes module → §7). La Vision ne pourrait pas servir à un autre produit :
« même ligne de version », « connexion sortante », « dix clients sans dix produits ». Les NFR sont
chiffrées (NFR-5 : 15 min) ou ont un mécanisme (NFR-3 : sens unique). Les contre-indicateurs du §6 sont
choisis pour empêcher la triche sur les cibles. Le seul soupçon de « théâtre » porte sur les parcours,
qui servent les trois PRD du lot plutôt que le moteur (voir §7 de ce rapport).

## 3. Strategic coherence — **adequate**

La thèse est nette : *un seul produit, installé par modules, aux deux hébergements, sous le contrôle du
client*. Les parties A, B et C en découlent. Les indicateurs ne mesurent pourtant que l'activité et les
interdits. Rien ne mesure le pari central.

### Constats
- **medium** — **Aucun indicateur ne valide « sans dix produits à maintenir » (§1).** SM-3 et SM-4
  comptent ce qui est interdit. Rien ne compte les exceptions client (C6) ni l'effort d'une installation
  après la première. *Fix :* SM « branches ou règles propres à un client = 0 » (la garde de balayage C6
  le mesure déjà), et durée d'installation du 2ᵉ client distributeur comparée au 1ᵉʳ.
- **low** — **La partie C n'a aucun indicateur**, alors que §1 promet un modèle « meilleur à chaque client
  signé ». Acceptable si C est explicitement « plus tard » (voir le constat sur le découpage), sinon
  ajouter le nombre d'organisations sous consentement de niveau 3.

## 4. Done-ness clarity — **thin**

FR-1 à FR-7 sont exemplaires : un message exact (FR-2 « ➕ Facturation ajoutée : … »), un code et un
statut (FR-3 `MODULE_REQUIS_PAR` 409), et même un test de mutation (FR-4). Les parties B et C n'ont pas
cette rigueur, et deux FR se contredisent elles-mêmes.

### Constats
- **high** — **FR-18 promet l'impossible tel qu'écrit.** On lit : « Les données saisies depuis la
  promotion sont conservées », puis « une mise à jour dont la migration de données n'est pas réversible
  ne peut pas être publiée sans sauvegarde restaurable ». Restaurer cette sauvegarde perd justement les
  données saisies depuis la promotion. Tenir « sans perte » pendant 7 jours suppose que chaque module
  écrive des migrations rétrocompatibles (étendre, puis contracter). C'est une **clause de module**, et le
  contrat ne l'a pas. *Fix :* imposer la rétrocompatibilité sur 7 jours (et l'ajouter au contrat de
  module, C1 ou une nouvelle clause), ou dire honnêtement qu'une migration irréversible ferme le retour
  arrière sans perte.
- **high** — **Les connecteurs écrivent depuis l'espace d'essai vers le système de référence du
  client.** FR-8 met « connecteurs » dans la répétition générale. Pour l'IMF, UJ-3 dit que ce qui est
  saisi dans Prospera « repart vers le logiciel, qui reste la référence ». FR-9 n'intercepte que « SMS,
  WhatsApp, e-mail et liens de paiement ». Une écriture d'essai peut donc arriver dans le core-banking
  réel, et le PRD Connecteurs ne parle jamais d'espace d'essai. *Fix :* ajouter à FR-9 que toute
  écriture sortante d'un connecteur depuis l'essai est interceptée, ou va vers un bac à sable du
  logiciel client, et le faire reprendre par le PRD Connecteurs.
- **high** — **Sauvegardes et clés de signature sans bornes.** FR-25 et FR-17 disent seulement
  « sauvegardes automatiques ». Il manque la fréquence, la rétention, le lieu (le NAS de UJ-1 ?) et la
  perte de données acceptable, pour un assureur dont les données ne quittent jamais ses locaux. NFR-1
  fait reposer toute la confiance sur la signature, sans rotation, révocation ni procédure en cas de clé
  compromise. Or une instance hors ligne ne peut apprendre une révocation que par fichier (FR-22). *Fix :*
  une NFR de sauvegarde chiffrée, et une NFR « cycle de vie des clés » qui dise ce que fait une instance
  quand elle reçoit une liste de révocation.
- **medium** — **UJ-1 met en service par étapes ; FR-7 et FR-8 ne le permettent pas.** UJ-1 étape 4 :
  « la recherche, les dossiers et la GED ; puis le circuit sinistre ; enfin l'IA locale ». FR-8 prévoit
  au contraire *une* date et *une* offre rejouée, et FR-7 laisse le client « En installation » tant qu'une
  ligne n'est pas verte, donc pendant des mois chez l'assureur. *Fix :* autoriser une mise en service par
  sous-ensemble de l'offre (FR-11 le permet presque) et définir « En service » pour un client
  partiellement en service.
- **medium** — **Partie C peu vérifiable.** FR-28 ne dit pas ce que « pseudonymisé » recouvre (champs,
  méthode, qui détient la table de correspondance) ni *qui* approuve chaque export : le DG de FR-27, ou
  un autre rôle ? FR-29 n'a qu'une conséquence, « rien n'est copié hors de l'instance », qu'aucun test ne
  peut vérifier quand une personne analyse par tunnel. *Fix :* une liste minimale de champs retirés, le
  rôle qui approuve, et pour FR-29 une conséquence vérifiable (session journalisée, aucun transfert de
  fichier par le tunnel).
- **low** — **FR-20 : « sans incident » n'est pas défini**, et le PRD ne dit pas si le chemin rapide de
  FR-19 (72 h) contourne les vagues de 7 jours. Il doit les contourner, sinon les deux FR se
  contredisent.
- **low** — **FR-7 et C4 (§7).** Les lignes Reprise ou Connecteurs « non installé, jamais vertes »
  bloquent-elles le passage En service d'un client qui n'a pas acheté ces modules ? *Fix :* préciser que
  seules les lignes de l'offre comptent.

## 5. Scope honesty — **thin**

Le PRD décide beaucoup de choses en silence, sur des documents qu'il cite ou qu'il devrait citer.

### Constats
- **high** — **STORY-727 (déjà sur `dev`) contredit FR-8, FR-11 et SM-1, et le PRD ne le dit pas.**
  STORY-727 ouvre « tous les modules des packages » dès qu'une échéance est soldée (lot 2). Son lot 7
  donne à toute organisation `distributeur`, `imf-sfd` ou `assurance-cima`, dès sa création, le package
  de son vertical **sans terme**. Le PRD dit à l'inverse qu'« il n'existe aucune commande qui installe
  […] directement dans l'espace réel » (FR-11). SM-1 suppose une « organisation vierge », qui n'existe
  donc pas pour un distributeur. FR-4 cite bien « un abonnement payé » et « la propagation d'un pack »
  comme chemins, mais sans dire que leur effet change. *Fix :* une conséquence explicite. Soit le
  paiement et l'identité rendent un module *souscrit* (installable, FR-12) et plus `ACTIVE`, et 727 est à
  reprendre. Soit c'est une exception nommée.
- **high** — **Le feu vert de la Reprise n'est porté par aucune FR.** Le PRD Reprise (FR sur la
  réconciliation, §C5) dit que « le moteur d'installation ne peut pas mettre le client en service (PRD
  moteur FR-6, FR-8) » sans feu vert. Le journal le note aussi : « La mise en service lit son feu vert
  (écart nul) ». Côté moteur, seul le §3 le suggère (« reprise de données réconciliée »), avec UJ-3 en cas
  d'échec. FR-6 ne lit qu'un *comptage*, et FR-8 ne pose aucune condition. Le contrat entre les deux PRD
  est donc cassé du côté consommateur. *Fix :* dans FR-8, « la mise en service est refusée tant que la
  Reprise n'a pas publié son feu vert pour l'organisation » (code nommé, événement consommé).
- **high** — **D3 révisée et contrat de module §9 non cités.** Le contrat (§9) dit encore que
  l'installation chez le client « est renvoyée après les 8 semaines » par D3. Le journal enregistre la
  révision de D3 (« prête AVANT FÉVRIER 2027 »), mais le PRD ne cite ni D3 ni cette révision : toute la
  partie B annule en silence un document qu'il déclare appliquer (§0). *Fix :* une ligne au §0 qui acte la
  révision de D3, et une demande d'amendement du §9 du contrat.
- **medium** — **§0 contredit QA-3.** §0 : « Connecteurs (synchronisation permanente, plus tard) ».
  QA-3 : « Connecteurs doit être prêt en février ; son PRD entre au lot 1 ». Le journal montre que la
  première version (« hors lot 1 ») a été remplacée. Le §0 n'a pas été mis à jour. *Fix :* aligner le §0
  sur QA-3.
- **medium** — **FR-33 crée un effacement automatique sans propriétaire.** §3 : « Effacer : […] acte
  séparé, demandé, tracé, hors de ce PRD ». Le contrat de module (Q4) garde les données « sans limite
  jusqu'à une demande d'effacement ». FR-33 impose pourtant un effacement *non demandé* 30 jours après un
  essai non signé. La décision est légitime (journal, QE-4), mais aucun document ne dit qui exécute
  l'effacement dans chaque module. *Fix :* nommer l'exception à Q4 et le porteur (le moteur ordonne, chaque
  module efface par contrat C5 ?).

## 6. Downstream usability — **thin**

Le glossaire du §3 est l'un des meilleurs du dépôt, et le §7 tient bien les onze lignes que le contrat
exige (§6 du contrat). Mais le premier consommateur annoncé, la spine de la coque `prospera-app`, ne
trouve pas ce qu'il vient chercher.

### Constats
- **critical** — **Aucun modèle d'état du module par organisation et par espace, donc pas de règle de
  menu.** Le contrat définit « Installer = poser l'entitlement `(organisation × module)` en `ACTIVE` »,
  avec un index unique `{organizationId, moduleCode}`, et C8 dit : « une entrée est visible si et
  seulement si l'entitlement effectif est `ACTIVE` ». Le PRD redéfinit Installer comme « dans l'espace
  d'essai » et ajoute 🟢/🟠/🔴, En installation / En service, gel, préavis et suspension de licence. Il ne
  dit jamais comment ces états se projettent sur l'entitlement, ce que porte `entitlement.changed`, ni
  quels états rendent une entrée visible dans quel espace. La seule règle de menu est FR-5 (« en attente
  ou bloqué n'apparaît pas »). Le cas central reste ouvert : un module 🟢 en essai, pas encore en service,
  apparaît-il dans le menu du réel ? *Fix :* une table d'états (module × organisation × espace) → statut
  d'entitlement → visibilité au menu → refus API, plus une conséquence de FR-9 qui dise comment la coque
  sait dans quel espace elle tourne (bandeau, titre d'onglet).
- **high** — **« Pack » a deux sens.** Le §3 reprend la définition du contrat (« vendus ensemble pour un
  métier », soit `VerticalPack` : `distributeur`, `imf-sfd`…). Le §4.A donne au contraire *quatre* packs
  au seul distributeur (« Terrain & Ventes, Finance & Recouvrement… »), et QA-1 parle de « 18 modules,
  4 packs ». SM-1 et NFR-5 reviennent au singulier (« le pack distributeur »). Le modèle de données du
  catalogue (un `VerticalPack` par vertical, et les `packs` de l'abonnement 727) dépend de la réponse.
  *Fix :* deux termes, par exemple **pack de vertical** et **pack commercial**, et dire lequel le
  catalogue stocke.
- **high** — **Les écrans du client ne sont situés nulle part, et leurs droits manquent.** Le DSI choisit
  la date (FR-17), revient en arrière (FR-18), reporte un correctif (FR-19), dépose un fichier
  (FR-22 : « la console de l'instance ») et ouvre le tunnel (FR-23). Le DG consent (FR-27). Où sont ces
  écrans : dans la console Money Vibes, qui tourne « sur l'instance du client » (§3), ou dans
  `prospera-app` (C8, D1) ? Le §7 C8 ne liste que des écrans de console, et le §7 C7 ne crée qu'un seul
  droit client (consentement). *Fix :* lister les surfaces client et leurs droits
  `<module>:<objet>:<action>`.
- **high** — **AD-P16 et la recette dans l'essai court-circuitent les niveaux de consentement.** Le
  journal a relevé que AD-P16 (route de lecture plateforme inter-organisations) permet à Money Vibes de
  lire les données métier, et l'a noté « à trancher ». Le PRD ne cite jamais AD-P16. Pour un distributeur
  hébergé, Money Vibes est donc toujours « sur place », et le niveau 2 (FR-29) n'a pas de sens. Sur site,
  FR-17 dit que « Money Vibes y joue la recette » dans un espace d'essai rafraîchi depuis le réel
  (FR-10), donc sur des données réelles, sans connexion entrante : par quel accès, et sous quel niveau ?
  SM-4 (= 0) est en jeu. *Fix :* dire si la recette est automatique (sans accès humain) ou passe par le
  tunnel de niveau 2, et réconcilier explicitement 4.C avec AD-P16.
- **medium** — **Le §7 range tout dans `platform-catalog-service`.** La partie B décrit au moins deux
  acteurs : côté Money Vibes (émission de licences, distribution des paquets, supervision de toutes les
  instances, FR-16) et côté instance (agent de mise à jour, sauvegarde, retour arrière, signal,
  vérification hors ligne). Le §7 C3 fait en plus « posséder » les consentements, qui vivent chez le
  client, à un service dont la copie Money Vibes émet les licences. Le contrat (§4) pose qu'« un agrégat
  distinct, c'est un service distinct ». *Fix :* laisser le découpage à la spine, mais retirer
  l'affirmation du §7 ou la marquer `[ASSUMPTION]`.

## 7. Shape fit — **adequate**

Le PRD est bien taillé pour une capacité plateforme chain-top : un glossaire fort, des FR avec leurs
conséquences, et la table du contrat de module. Deux défauts de forme : des références brownfield
inexactes, et des parcours qui racontent le produit plutôt que le moteur.

### Constats
- **medium** — **FR-21 cite mal l'existant.** `fenetre-de-support.ts` est une règle **par module** :
  « au plus `MAX_ACTIVE_MAJORS` majeures `ACTIVE` par module », appliquée quand Money Vibes *publie*. Ce
  n'est pas une limite au retard d'une *instance*. « Plus de deux versions majeures en retard » ne dit
  d'ailleurs pas N/N-1, qui en tolère une. Et « une seule ligne de version pour la plateforme » (§3)
  laisse sans réponse le lien avec les versions semver par module (`ModuleVersion`). Rien ne dit non plus
  ce qui arrive à une instance hors fenêtre. *Fix :* définir la version de plateforme (ensemble de
  versions de modules), la règle de retard admissible, et sa conséquence.
- **medium** — **FR-32 cite STORY-280, mais c'est STORY-727 qui s'applique.** STORY-280 *suspend* les
  accès : le contrat (C2) parle de « 403 nommé, aucune donnée ». C'est le lot 4 de STORY-727 qui donne
  « échu ⇒ lecture seule ». Le mot « préavis » est aussi déjà pris : `paiement.abonnement.preavis.emis`
  part 7 jours *avant* l'échéance, alors que le préavis du PRD dure 30 jours *après*. *Fix :* citer
  727 lot 4 et renommer l'un des deux préavis.
- **medium** — **Les parcours racontent les verticales, pas le moteur.** Les trois « moments gagnés »
  (Fatou retrouve un dossier, Ibrahim n'a rien ressaisi, Mariam ouvre le PAR) appartiennent aux modules
  métier, à la Reprise et aux Connecteurs. UJ-3 (IMF) ne concerne aucun client de février. Les vrais
  protagonistes du moteur, Rachid (installation) et Koffi (mise à jour), ne sont racontés que dans les
  descriptions du §4.A et du §4.B. *Fix :* garder les trois UJ en contexte partagé du lot et promouvoir
  en UJ-4 et UJ-5 les récits de Rachid et de Koffi, qui sont déjà écrits.

---

## Mechanical notes

- **Bandeau périmé (ligne 16) :** « Brouillon. Sections rédigées : §0, §1, §2, §3. À venir : §4 […] »
  alors que tout est rédigé. À corriger avant la lecture du PO, car c'est la première chose qu'il lira.
- **Ambiguïté :** FR-33, « la reprise est **rejouée à frais** ». « À frais » se lit comme « aux frais du
  client » ; le sens voulu est « fraîche » (FR-8). Le journal porte la même tournure.
- **Dérive de vocabulaire :** UJ-1 étapes 1 et 3 emploient « environnement de test » et « la production »,
  que le §3 bannit (« Aucun synonyme »). Le §3 donne à **Suspendre** et **Désinstaller** la même
  définition (« fermer l'accès sans rien supprimer »). « Suspension » a deux comportements : 403 pour un
  module (contrat C2) et « consulter et exporter » pour une licence (FR-32).
- **Termes absents du glossaire :** offre d'essai, prospect, bilan d'essai, bilan de mise en service,
  bilan d'instance (FR-25), recette, module commercial (QA-1).
- **Identifiants :** FR-1 → FR-33 sont uniques et sans trou, mais pas dans l'ordre (FR-33 entre FR-13 et
  FR-14, FR-32 après FR-25). On peut le garder pour la traçabilité, à condition de le signaler. SM-1 →
  SM-5 et NFR-1 → NFR-6 sont contigus. QA-1 → QA-4 et QB/QC se résolvent bien.
- **Niveau de titre :** « ## 2.3 Parcours clés » devrait être `###` sous « ## 2 ».
- **Codes de refus voisins :** `MODULE_NON_SOUSCRIT` (FR-12) et `MODULE_HORS_LICENCE` (FR-14) sont deux
  422 pour « le droit ne couvre pas ce module ». Sur site, lequel prime ? (low)
- **FR-14 :** une suspension par litige arrive « par une nouvelle licence, au contact suivant ». Un client
  à licence perpétuelle peut donc l'éviter en coupant la liaison, puisque FR-15 ne sanctionne que par le
  gel. (low, à acter)
- **Frontmatter :** `verticales` liste Cabinet, que le corps ne traite jamais.
- **Index des hypothèses :** une seule `[ASSUMPTION]` en ligne (§2.2), reprise au §8 : l'aller-retour
  tient. Aucun `[NOTE FOR PM]` (voir §1 de ce rapport).
- **Contrat de module :** il est bien cité (§0, §3, §7), et le §7 respecte les onze lignes exigées par le
  §6 du contrat.
