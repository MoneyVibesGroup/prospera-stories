---
title: "Revue adversariale — PRD Moteur d'installation"
cible: prd.md (status draft, mis à jour le 2026-11-10)
methode: bmad-review-adversarial-general (relecteur cynique)
date: 2026-11-10
references_lues: [prd.md, .memlog.md, ../../CONTRAT-DE-MODULE-2026-11-09.md, ../prd-reprise-donnees-2026-11-10/prd.md, ../prd-connecteurs-2026-11-10/prd.md]
---

# Revue adversariale — PRD Moteur d'installation

## Verdict

Le PRD décrit bien le **chemin heureux** et les décisions du PO sont fidèlement reprises, mais il n'a **pas
de modèle d'états** : les horloges (essai, préavis, grâce, gel, retour arrière, 72 h, vagues) et les états
(installé, en service, en attente, bloqué, suspendu, révoqué, gelé, figé) sont posés un par un sans jamais
être croisés. Plusieurs promesses se contredisent frontalement (retour arrière « sans perte » contre
migration irréversible ; « une seule date choisie par le DSI » contre une plateforme mutualisée ;
« on ne copie jamais l'essai vers le réel » contre « il garde son essai et sa calibration »), et deux
failles de sûreté sont ouvertes (horloge locale manipulable, licence rejouable). **Pas prêt pour la
validation du 13/11 sans une passe sur les constats critical et high.**

Décompte : **6 critical · 18 high · 15 medium · 4 low** (43 constats).
- critical : F-01, F-02, F-08, F-16, F-17, F-25
- high : F-03, F-04, F-05, F-06, F-07, F-09, F-10, F-11, F-18, F-19, F-20, F-21, F-22, F-26, F-30, F-31,
  F-36, F-37
- medium : F-12, F-13, F-14, F-15, F-23, F-24, F-27, F-28, F-29, F-32, F-33, F-34, F-35, F-38, F-39
- low : F-40, F-41, F-42, F-43

Les décisions tranchées dans `.memlog.md` ne sont pas contestées en elles-mêmes ; ce sont leurs
**conséquences non traitées** qui sont relevées.

---

## 1. Cycle de vie : installer, désinstaller, mettre à jour

### F-01 · critical · §3 « Ce qu'on fait à un module », FR-5, FR-7, FR-11, FR-15, FR-32 — aucun automate d'états
> « **En installation** tant qu'un voyant n'est pas vert ; **En service** quand tous le sont. »

**Pourquoi ça casse.** Le PRD empile au moins trois axes d'état indépendants (par module : installé en
essai / en service dans le réel / 🟠 / 🔴 / `SUSPENDED` / `REVOKED` ; par client : En installation / En
service ; par instance : normal / préavis / suspension / gel de silence / gel permanent) sans table de
transitions ni de combinaisons. Exemples non tranchés :
- un client **En service** à qui l'on ajoute un module (FR-11) dont le prérequis manque : la fiche
  repasse-t-elle **En installation** alors que tout le reste tourne ? (la définition dit oui, le bon sens
  dit non) ;
- un prérequis qui **disparaît après** la mise en service (clé PI-SPI révoquée par la banque) : le voyant
  redevient-il 🔴 ? le module sort-il du menu (FR-5, 4ᵉ puce) en pleine production ?
- un module 🟢 dans le bilan d'essai et 🔴 au rejeu dans le réel (FR-8) : quel état porte le client ?
- une instance à la fois en **préavis** (FR-32) et en **gel de silence** (FR-15).

**Correction.** Ajouter une section « États et transitions » : un diagramme par axe (module × espace,
client, instance), la liste des transitions autorisées avec leur déclencheur et leur trace (NFR-4), et une
matrice des combinaisons d'axes avec l'état résultant. Distinguer « client en service » d'« offre
complète » (un client peut être en service avec un module ajouté encore 🟠).

### F-02 · critical · FR-18 — « sans perte » contre migration irréversible
> « Les données saisies depuis la promotion sont conservées ; une mise à jour dont la migration de données
> n'est pas réversible ne peut pas être publiée sans sauvegarde restaurable. »

**Pourquoi ça casse.** Restaurer la sauvegarde d'avant promotion **efface** sept jours de saisie : c'est
exactement la perte que la phrase précédente interdit. Et même avec une migration réversible, la version
N doit savoir lire des données écrites par N+1 (nouveaux champs, nouveaux statuts, événements publiés
en `topic@2` alors que le consommateur revenu en N n'entend que `@1`, contrat de module C5). Le « retour
arrière en un clic, sans rien perdre » de la §1 est donc une promesse que le PRD ne sait pas tenir telle
qu'écrite.

**Correction.** Imposer une discipline de migration « étendre puis contracter » (N+1 n'écrit rien que N ne
sache ignorer pendant la fenêtre de 7 jours ; les suppressions de colonnes/champs attendent la version
suivante) et l'**écrire au contrat de module** comme clause testable (test : promouvoir, saisir, revenir,
tout est lisible). Pour les cas réellement irréversibles : soit la version **n'offre pas** de retour
arrière (affiché au DSI avant qu'il choisisse la date), soit le retour arrière est une restauration
**avec perte explicitement chiffrée** et acceptée. Supprimer « sans perte » partout où ce n'est pas
garanti.

### F-03 · high · FR-4, NFR-6, contrat §3.4 — échec à mi-chemin d'une installation
> « rejouer une installation, une promotion ou un « Réessayer » ne crée aucun doublon. »

**Pourquoi ça casse.** L'idempotence dit ce qui se passe quand on **rejoue** ; rien ne dit ce qui reste
quand une installation de 18 modules **meurt au 9ᵉ** (conteneur tué, coupure électrique fréquente sur
site, base pleine) : entitlements à moitié écrits, comptes créés pour certains modules, topics publiés,
bilan absent. Ni point de reprise, ni « annuler l'installation », ni état « interrompue » au bilan.
Même trou pour une **promotion** interrompue entre la sauvegarde et le contrôle de santé (FR-17).

**Correction.** Exiger que l'installation soit un **plan persistant** (liste ordonnée d'étapes avec statut
par étape), reprenable depuis la dernière étape réussie, et que le bilan affiche « interrompue à l'étape
X » plutôt qu'un état vide. Pour la promotion : préciser qu'une interruption déclenche le même retour
arrière automatique qu'un contrôle de santé en échec. Test : tuer le processus à chaque étape et vérifier
la reprise (test de chaos scripté).

### F-04 · high · FR-11, FR-14, SM-3 — la désinstallation et la licence contournent l'essai
> « Premier module, module ajouté plus tard, mise à jour de version : **toujours** essai, bilan, puis
> promotion dans le réel. » / « Une suspension (impayé, litige) ou un ajout de module arrive par une
> **nouvelle licence**, au contact suivant. »

**Pourquoi ça casse.** FR-11 ne liste que des ajouts. Retirer un module, suspendre, appliquer une licence
qui retire un droit : ce sont des **changements dans le réel** qui ne passent pas par l'essai. Soit
SM-3 (« 0 changement dans le réel sans essai ») est faux dès le premier impayé, soit une suspension
d'impayé attend une répétition générale, ce qui est absurde. Et une licence qui **ajoute** un module :
s'installe-t-elle d'office dans le réel au contact suivant (FR-14) ou dans l'essai (FR-11) ?

**Correction.** Classer explicitement les changements : (a) changements **de code ou de schéma** →
toujours essai puis promotion ; (b) changements **de droits** (suspension, révocation, licence) →
appliqués directement, journalisés, hors SM-3. Reformuler SM-3 en conséquence. Dire qu'une licence qui
ajoute un module ne fait que le rendre **installable**.

### F-05 · high · §3 « Désinstaller », FR-3, C9 — données orphelines et copies chez les voisins
> « **Désinstaller** : fermer l'accès sans rien supprimer ; réinstaller retrouve tout. »

**Pourquoi ça casse.** Le PRD ne parle que des données **du** module désinstallé. Or :
- les modules qui l'avaient en `enrichiPar` gardent des **read-models** (copies, C3) de ses données :
  restent-elles affichées, figées, purgées ? Le contrat C4 prévoit un emplacement vide, pas le sort des
  copies déjà prises ;
- l'**espace d'essai** garde sa propre copie : désinstaller dans le réel désinstalle-t-il dans l'essai ?
- la **calibration locale** d'un module IA désinstallé, son journal de prédictions (C11) ;
- sur site, un module retiré de la licence laisse ses données **pour toujours** sur le serveur du client
  (Q4 « sans limite jusqu'à une demande d'effacement ») : qui peut encore les **exporter** si le module
  qui sait les lire est révoqué ?
- réinstaller **après une montée de version** : « retrouve tout » suppose que la version N+3 relit les
  données laissées par N (ce qui contredit en plus la fenêtre N/N-1, FR-21).

**Correction.** Ajouter une exigence « Désinstallation » : sort des read-models voisins, de l'essai, de la
calibration ; export toujours possible des données d'un module révoqué ; règle de réinstallation après
plus d'une version majeure (migration rejouée à la réinstallation, ou refus nommé).

### F-06 · high · FR-8, FR-33, NFR-3 — « on ne copie jamais l'essai vers le réel » contre « il garde ses réglages »
> FR-8 : « on ne copie jamais l'essai vers le réel » ; NFR-3 : « l'espace d'essai ne lit ni n'écrit jamais
> l'espace réel, sauf le rafraîchissement (FR-10), qui va dans un seul sens » ; FR-33 : « il garde son
> espace d'essai et ses réglages (tables de correspondance, rôles, zones) » et sa calibration « gardée
> s'il signe ».

**Pourquoi ça casse.** Rejouer « les mêmes tables de correspondance » dans le réel, c'est **lire l'essai**
pour écrire le réel : NFR-3 l'interdit. Les rôles, zones, comptes réglés pendant la répétition (UJ-2 :
une journée avec Moussa et Awa) ne figurent pas dans la liste rejouée par FR-8 : sont-ils refaits à la
main ? Et la calibration du prospect, calculée dans l'essai, doit aller dans le réel : c'est une copie
essai → réel, interdite par FR-8, et de surcroît une calibration apprise sur des données **avant**
reprise fraîche, donc non validées.

**Correction.** Définir un objet explicite, versionné et journalisé — la **recette d'installation**
(offre, tables de correspondance, rôles, zones, réglages) — qui est **exportée de l'essai et rejouée**
dans le réel ; amender NFR-3 pour nommer ce seul flux essai → réel. Trancher la calibration du prospect :
recalculée sur la reprise fraîche (recommandé) ou copiée par exception nommée.

### F-07 · high · FR-10 — le rafraîchissement obligatoire écrase l'essai en cours
> « L'espace d'essai se **rafraîchit depuis l'espace réel** à la demande, et obligatoirement avant une
> mise à jour majeure. »

**Pourquoi ça casse.** Sur la plateforme Money Vibes, l'essai est partagé : rafraîchir avant une majeure
**efface les prospects en essai** (FR-33, qui n'ont rien dans le réel) et les répétitions générales en
cours des autres clients. Sur site, il efface la recette d'installation d'un module en cours d'ajout. Le
rafraîchissement copie aussi des **données personnelles réelles** dans un espace aux contrôles d'accès
plus lâches (utilisateurs clés, liste blanche de test), sans que le PRD le traite au titre de la loi
2019-014. Aucune durée, aucun volume, aucune taille de disque prévue pour doubler la base sur le serveur
du client.

**Correction.** Rafraîchissement **par organisation**, jamais par instance ; exclure les organisations en
essai avant signature ; bloquer le rafraîchissement si une répétition est en cours (ou la sauvegarder) ;
dire qui peut accéder à l'essai et si un masquage s'applique ; ajouter un prérequis de capacité disque
au bilan d'instance (FR-25).

### F-08 · critical · FR-8, FR-9, UJ-3 — un connecteur dans l'essai écrit dans le vrai logiciel du client
> FR-8 : « Dans l'espace d'essai : offre installée, reprise de données, comptes, **connecteurs** » ;
> UJ-3 : « ce que l'agent saisit sur le terrain **repart vers le logiciel**, qui reste la référence ».

**Pourquoi ça casse.** FR-9 n'intercepte que SMS, WhatsApp, e-mail et liens de paiement. Un connecteur
**bidirectionnel** branché depuis l'essai écrira dans l'Odoo du distributeur ou dans le core-banking de
l'IMF — le système de **référence** — des décaissements et des remboursements **fictifs** saisis pendant
la formation. C'est l'incident le plus grave possible pour une IMF, et rien ne l'empêche.

**Correction.** Ajouter à FR-9 : depuis l'essai, tout connecteur est **en lecture seule** ou pointe vers un
**bac à sable** déclaré du logiciel du client ; une écriture vers un système externe depuis l'essai est
refusée côté serveur (code nommé) ; le PRD Connecteurs doit porter la même règle. Étendre la liste des
envois interceptés à « toute sortie vers un système tiers », pas à une liste de canaux.

### F-09 · high · FR-13, FR-17, FR-18 — « le DSI choisit la date » est impossible sur une plateforme mutualisée
> FR-13 : « La console, les voyants, le bilan et les refus sont **identiques** pour un distributeur hébergé
> chez Money Vibes et pour un assureur sur ses serveurs. » ; §4.B : « Pour un distributeur, tout cela se
> passe sur les serveurs de Money Vibes, avec les mêmes étapes. »

**Pourquoi ça casse.** La plateforme Money Vibes est **une** instance multi-organisations, avec **une**
ligne de version : on ne peut pas promouvoir la version N+1 pour un distributeur et laisser son voisin en
N, ni revenir en arrière pour un seul client. Les « mêmes étapes » (date choisie par le DSI, retour
arrière en un clic, vagues avec client pilote) n'ont pas de sens pour un distributeur hébergé. De même,
l'espace d'essai y est commun : une version déposée dans l'essai l'est pour tous.

**Correction.** Écrire deux variantes de FR-17/18/20 : **sur site** (date du DSI, retour arrière par
instance) et **plateforme** (fenêtre de maintenance fixée par Money Vibes, préavis aux organisations,
retour arrière global décidé par Money Vibes). Restreindre FR-13 à ce qui est vraiment identique
(installation de modules, voyants, bilan, refus).

---

## 2. Dépendances dures et optionnelles

### F-10 · high · FR-2, FR-12, FR-14 — une dépendance que le contrat ne couvre pas
> FR-2 : « la console l'ajoute aussitôt et dit pourquoi » ; FR-12 : « Installer un module que le contrat
> ne couvre pas est refusé : `MODULE_NON_SOUSCRIT` (422). »

**Pourquoi ça casse.** Le commercial vend « Relances » sans « Facturation » : FR-2 ajoute Facturation,
FR-12 la refuse. Rachid est bloqué devant deux règles qui se contredisent, et le PRD ne dit pas laquelle
gagne, ni où l'incohérence aurait dû être arrêtée (à la vente, dans `paiement-service`). Même cas sur site
avec une licence émise sans une dépendance : refus `MODULE_DEPENDANCE_MANQUANTE` hors ligne, sans recours
avant la prochaine licence.

**Correction.** Exiger que la **même résolution de dépendances** s'applique à la création du contrat
(STORY-727) et à l'émission de la licence (refus d'émettre une licence incohérente) ; dans la console,
afficher un refus nommé « dépendance non souscrite » avec l'action (« faire amender le contrat »).

### F-11 · high · FR-17, FR-21, contrat Q5 — une nouvelle version ajoute ou retire une dépendance
> Contrat §3.2 : « Par code, pas par version » ; PRD : rien.

**Pourquoi ça casse.** La version N+1 du module A déclare `depends: ['X']`, que le client n'a ni
installé ni souscrit. La mise à jour : bloquée (l'instance reste en N et sort de la fenêtre N/N-1) ?
installe X d'office (hors contrat, hors licence) ? Symétriquement, une dépendance **retirée** dans N+1
laisse X installé et facturé sans raison, ou rend X désinstallable alors qu'il ne l'était pas. Le PRD ne
traite la résolution des dépendances qu'**au moment du choix**, jamais au moment d'une mise à jour, ni
lorsqu'une **définition de pack** change (« propagation d'un pack », FR-4, jamais définie).

**Correction.** Ajouter une exigence « Dépendances à la mise à jour » : le moteur calcule, avant de
déposer une version dans l'essai, l'écart de dépendances par client et le présente (refus nommé
`MISE_A_JOUR_DEPENDANCE_NON_SOUSCRITE` ou ajout proposé) ; interdire à une version mineure d'ajouter une
dépendance dure ; définir ce qu'est la propagation d'un pack (un client existant reçoit-il le module
ajouté au pack ?).

### F-12 · medium · FR-1, FR-2 — comptage des raisons de sélection non défini
> FR-1 : « le retirer décoche ceux qu'aucun autre choix ne retient » ; FR-2 : « Annuler l'ajout de la
> dépendance décoche aussi le module qui l'a demandée. »

**Pourquoi ça casse.** Une dépendance ajoutée par FR-2 est-elle « retenue » ? Si Facturation a été
ajoutée à la fois par Relances et par Encaissements, annuler l'ajout décoche-t-il les deux ? Et un module
coché par un pack **et** à la main ? Sans règle de comptage, deux implémentations donneront deux
sélections différentes, et le test « décoche ceux qu'aucun autre choix ne retient » est inécrivable.

**Correction.** Définir la sélection comme un ensemble de **raisons** par module (pack P, ajout manuel,
requis par M) ; un module est décoché quand son ensemble de raisons devient vide ; annuler une dépendance
partagée liste **tous** les demandeurs avant de les décocher. Donner un cas de test avec dépendance
partagée.

### F-13 · medium · FR-5, contrat Q3 — 🟠 « en attente » contre « reste ouvert »
> FR-5 : « un prérequis absent bloque ce module et ceux qui en dépendent » ; contrat Q3 : une dépendance
> dure suspendue laisse le dépendant **ouvert**, ses lectures déclarées `SUSPENDU`.

**Pourquoi ça casse.** Deux règles pour le même graphe : à l'installation, un dépendant d'un module bloqué
est fermé ; en exploitation, un dépendant d'un module suspendu reste ouvert. Le PRD ne dit pas non plus
ce que deviennent les dépendants **optionnels** (`enrichiPar`) d'un module 🔴 : 🟢 avec emplacement vide
(C4) ou 🟠 ?

**Correction.** Écrire explicitement : dépendant dur d'un module 🔴 = 🟠 (installation seulement) ;
dépendant optionnel = 🟢 avec emplacement vide déclaré ; après mise en service, la règle Q3 s'applique.
Justifier la différence en une phrase.

### F-14 · medium · FR-4 — cycle introduit par une nouvelle version
> « Un manifeste qui crée un cycle de dépendances est refusé : `MANIFESTE_CYCLE` (422). »

**Pourquoi ça casse.** Les manifestes sont copiés au catalogue **par version** (Q1). Un cycle peut naître
de la version N+1 de B alors que A est déjà publié : la publication de B est refusée, donc la release
entière est bloquée au dernier moment. Les cycles via `enrichiPar` (autorisés ?) et l'ordre
d'installation qu'ils imposent ne sont pas traités.

**Correction.** Faire tourner la détection de cycle dans la CI de chaque dépôt de module (contre le
catalogue courant), pas seulement à l'enregistrement ; dire que `enrichiPar` peut être cyclique et
n'impose aucun ordre.

### F-15 · medium · FR-4 — « quatre chemins » mal énumérés
> « Retirer la vérification du point de décision fait échouer les tests des quatre chemins »

**Pourquoi ça casse.** Les chemins énumérés (console, abonnement payé, propagation de pack, licence
importée) oublient la **mise à jour** (F-11), la **réinstallation** après désinstallation, l'**offre
d'essai** (FR-33) et la **promotion** essai → réel. Sur site, le point de décision tourne **sur
l'instance** : c'est un second point de décision, à garder à l'octet près de celui du catalogue central.

**Correction.** Lister tous les chemins d'entrée et dire qu'il existe une seule implémentation, embarquée
à l'identique sur la plateforme et sur site (même bibliothèque, même suite de conformité).

---

## 3. Licence, essai, gel, effacement

### F-16 · critical · FR-15, FR-32, FR-33, FR-18, FR-19 — toutes les horloges lisent une horloge que le client contrôle
> « Débrancher internet n'arrête pas l'horloge du contrat : le droit d'utiliser d'un abonné expire à sa
> date, connecté ou non. »

**Pourquoi ça casse.** Sur site hors ligne, la seule horloge est celle du **serveur du client**. Reculer la
date système d'un an prolonge à l'infini le droit d'utiliser, le préavis, l'essai, le délai de grâce et la
fenêtre de retour arrière. Le PRD affirme l'inverse de ce qu'il peut garantir. Les points de départ sont
aussi flous : « J+30 sans signal » compte-t-il depuis le dernier signal **envoyé** par l'instance ou
**reçu** par Money Vibes ? (les deux horloges divergent dès qu'un signal se perd.)

**Correction.** Exiger une horloge **monotone** côté instance : plus grande date vue (licence `emiseLe`,
réponses signées de Money Vibes, dernier journal) persistée et signée ; toute date système antérieure
déclenche un état nommé (« horloge incohérente ») et le gel. Pour chaque délai, nommer l'horloge de
référence et l'événement de départ. Test : reculer la date du serveur et vérifier le refus.

### F-17 · critical · FR-14, NFR-1 — licence rejouable et clé de signature sans cycle de vie
> « Une licence altérée ou mal signée est refusée, et l'instance garde la précédente. » / « Une suspension
> (impayé, litige) ... arrive par une **nouvelle licence**. »

**Pourquoi ça casse.** Une licence **ancienne mais authentique** est bien signée. Le client qui reçoit une
licence de suspension n'a qu'à redéposer la licence précédente, gardée dans sa boîte e-mail (FR-22) :
elle passe la vérification de signature et lève la suspension. Rien n'impose un numéro de série croissant
ni un refus de rétrogradation. Par ailleurs : rotation, expiration et compromission de la clé de
signature ne sont pas traitées — or une licence **perpétuelle** (assureur) doit rester vérifiable hors
ligne **à vie**, même après rotation de la clé.

**Correction.** Licence avec `numero` strictement croissant par instance et `emiseLe` ; refus nommé
`LICENCE_ANTERIEURE` ; mémorisation du plus grand numéro accepté. Ajouter une NFR « clés » : chaîne de
confiance embarquée, rotation sans casser les licences perpétuelles, révocation d'une clé compromise par
paquet signé, procédure en cas de fuite.

### F-18 · high · §3 « Gel », FR-15, FR-32 — un même mot pour deux états aux sorties différentes
> « **Gel** : ... C'est aussi l'état permanent d'un logiciel acheté dont la maintenance a pris fin. »

**Pourquoi ça casse.** Gel de silence : levé au retour du signal. Gel de fin de maintenance : levé
seulement par un paiement et un rattrapage. Un client figé qui **cesse d'envoyer son signal** (plus de
maintenance, pourquoi payer la liaison ?) déclenche à vie les alertes J+7 au DSI et au DG, le ticket et
l'appel de Money Vibes (FR-15), et gonfle le contre-indicateur « instances au-delà du délai de grâce ».
Le retour du signal d'un client figé « lève le gel » d'après FR-15 : contradiction directe.

**Correction.** Deux termes distincts (ex. **gel** pour le silence, **version figée** pour la fin de
maintenance), chacun avec sa condition d'entrée, de sortie et ses alertes ; dire si une instance figée
envoie encore un signal et si son silence alerte quelqu'un.

### F-19 · high · FR-21, FR-32, FR-17 — N/N-1 contre « figé à vie » et contre « le DSI choisit »
> FR-21 : « Une instance ne peut pas rester plus de **deux versions majeures** en retard : c'est la
> fenêtre de support N/N-1 » ; FR-32 : « le logiciel **continue à vie**, figé à sa dernière version ».

**Pourquoi ça casse.** (1) N/N-1 autorise **une** version de retard, « plus de deux » en autorise deux :
le chiffre est faux d'un côté ou de l'autre. (2) Une instance figée sortira forcément de la fenêtre :
« ne peut pas rester » est donc faux pour elle. (3) Pour une instance sous maintenance, qu'est-ce qui
**empêche** de rester en retard si le DSI ne choisit jamais de date ? Une promotion forcée contredit
FR-17 (« sans son accord, rien ne change »), et aucun mécanisme n'est écrit.

**Correction.** Fixer le chiffre (N/N-1 = une version majeure de retard au plus). Dire ce qui arrive en
sortie de fenêtre : fin du support **contractuel** (pas de blocage technique) pour une instance
maintenue, avec escalade au DG ; exemption explicite pour les instances figées. Si une promotion forcée
existe, la nommer comme seconde exception à FR-17.

### F-20 · high · FR-19, FR-20, FR-15 — 72 heures incompatibles avec les vagues et le gel
> FR-19 : « en **72 heures** à partir du moment où le client est prévenu » ; FR-20 : « Une version ne
> passe à la vague suivante qu'après **7 jours** de santé sans incident » ; FR-15 : en gel, « aucune
> installation ni mise à jour ne s'applique ».

**Pourquoi ça casse.** Un correctif soumis aux vagues met au moins 7 jours à atteindre la deuxième vague ;
FR-19 n'en dispense pas. Une instance gelée ne peut pas l'appliquer : les 72 h sont violées sans faute de
personne. Le report de 7 jours rend le délai réel 72 h + 7 j, ce que les indicateurs ignorent. Enfin, le
DSI peut-il faire un **retour arrière** (FR-18) d'un correctif de sécurité qu'il n'avait pas le droit de
refuser ?

**Correction.** Exempter explicitement les correctifs de sécurité des vagues (ou définir une vague
accélérée en heures) ; dire que le gel n'empêche pas un correctif apporté **par fichier** ; écrire
l'échéance comme « 72 h, ou 72 h + report si reporté » ; interdire ou encadrer le retour arrière d'un
correctif de sécurité.

### F-21 · high · FR-33 — essai : fin, prolongation, signature tardive
> « À son terme, l'accès se ferme, sans rien effacer immédiatement. » / « il peut **exporter** ses données
> avant. »

**Pourquoi ça casse.** Entre la fin de l'essai et l'effacement (30 jours) : le prospect peut-il encore
exporter ? (« avant » est ambigu : avant la fin, ou avant l'effacement ?) La prolongation peut-elle être
accordée **après** la fermeture ? Un prospect qui signe à J+45 (pendant la fenêtre d'effacement)
retrouve-t-il ses données ? Qui reçoit les rappels avant fermeture et avant effacement ? Les 60 jours
comptent-ils à partir de l'ouverture du compte ou du premier import ?

**Correction.** Ajouter une chronologie de l'essai : J0 (événement nommé), rappels J-7/J-1, fin, fenêtre
d'export (avec ou sans accès en lecture), signature tardive (données réactivées), effacement, preuve.

### F-22 · high · FR-33, §3 « Effacer », C9/Q4 — l'effacement est « hors de ce PRD » mais le PRD en fixe l'échéance
> §3 : « **Effacer** : ... acte séparé, demandé, tracé, **hors de ce PRD** » ; FR-33 : « tout est
> **effacé 30 jours après la fin de l'essai**, et l'effacement est tracé ».

**Pourquoi ça casse.** Le PRD exige un effacement automatique et daté sans dire qui le construit, ce qu'il
couvre (sauvegardes de la plateforme ? journal des envois interceptés de FR-9 ? journal en ajout seul de
NFR-4, qui contient des noms ? calibration ? copies dans les read-models voisins ?) ni ce que veut dire
« tracé » (quelle preuve, opposable à qui). Un effacement qui laisse les données dans les sauvegardes
n'est pas un effacement au sens de la loi 2019-014.

**Correction.** Soit porter l'effacement dans ce PRD (exigence dédiée : périmètre exhaustif, sort des
sauvegardes — expiration naturelle bornée —, certificat d'effacement), soit le renvoyer vers un PRD
nommé **qui doit exister avant février**, et retirer « hors de ce PRD » du vocabulaire.

### F-23 · medium · FR-32 — la suspension « consulter et exporter » n'est pas spécifiée
> « on ne peut plus que **consulter et exporter**. Jamais d'écran noir, jamais d'effacement. »

**Pourquoi ça casse.** Exporter quoi, dans quel format, par qui, tous modules confondus ? Une IMF suspendue
doit-elle pouvoir encore **encaisser** un remboursement qu'un client vient payer (consulter seulement =
refuser l'argent) ? Les connecteurs continuent-ils de synchroniser ? Les correctifs de sécurité
s'appliquent-ils pendant la suspension ? Les tâches réglementaires (états BCEAO) sont-elles produites ?

**Correction.** Une exigence « Mode suspendu » qui liste, par catégorie d'action (lecture, export, saisie,
envois, connecteurs, tâches planifiées, mises à jour), ce qui est permis ; un format d'export minimal
commun garanti par le contrat de module.

### F-24 · medium · FR-12, FR-14, FR-13 — deux sources de droits, aucune règle de cohérence
> FR-12 : « Un module ajouté au contrat devient installable **sans autre action**. » ; §3 : « Sur une
> instance sur site, [la licence] est la source des droits. »

**Pourquoi ça casse.** Sur site, ajouter un module au contrat ne change rien tant qu'une **nouvelle
licence** n'a pas été émise et reçue (FR-14, « au contact suivant ») : « sans autre action » est faux. Qui
émet la licence quand le contrat change ? Automatiquement ? Avec quel délai ? Et si contrat et licence
divergent (licence émise à la main), lequel fait foi ?

**Correction.** Dire que la licence est **dérivée** du contrat par une émission automatique déclenchée par
tout changement de contrat (événement nommé) ; que le contrat fait foi sur la plateforme, la licence sur
site ; ajouter un contrôle de supervision « licence en retard sur le contrat ».

---

## 4. Données et apprentissage

### F-25 · critical · §4.C, FR-26 → FR-30, AD-P16 (`.memlog.md` l. 16) — le canal de données ne s'applique pas à la plateforme Money Vibes
> §4.C : « avoir leurs données sur nos serveurs ne donne pas le droit de les mettre en commun » ;
> mémoire : « AD-P16 permet à Money Vibes de lire la donnée métier de toute organisation ».

**Pourquoi ça casse.** Toutes les exigences de 4.C sont écrites comme ce qui **sort d'une instance**. Pour
un distributeur hébergé, rien ne « sort » : Money Vibes lit déjà la base, et AD-P16 l'y autorise. Le
registre des consentements ne garde donc aucune porte réelle sur la plateforme, et SM-4 y est
invérifiable. La tension relevée dans la mémoire (données « exclusivement dans vos locaux », AD-P16) n'a
reçu ni décision ni exigence.

**Correction.** Ajouter une exigence qui fait du registre des consentements une **garde technique** sur la
plateforme aussi : tout traitement d'apprentissage ou toute extraction vers l'équipe IA passe par le même
point de contrôle, journalisé ; amender ou borner AD-P16 (lecture d'exploitation ≠ usage pour
l'apprentissage). Ouvrir une question au PO si la tension n'est pas tranchée — et retirer « il ne reste
aucune question ouverte » (§8).

### F-26 · high · FR-28, FR-30 — « pseudonymisé » n'est ni défini ni suffisant
> « l'échantillon est pseudonymisé avant de sortir »

**Pourquoi ça casse.** Une donnée pseudonymisée reste une donnée personnelle (réidentifiable par celui
qui tient la table de correspondance ou par recoupement : montant + date + agence suffisent dans une
petite IMF). Le PRD ne dit pas quelle technique, qui garde la clé, comment sont traités les champs libres
(commentaires de sinistre, pièces jointes GED), ni le test qui prouve la pseudonymisation. Les dossiers
« où l'IA s'est trompée » sont précisément les cas atypiques, donc les plus réidentifiables.

**Correction.** Définir la transformation (liste des champs supprimés, hachés avec sel gardé **sur
l'instance**, généralisés), exclure les champs libres et les fichiers par défaut, exiger un seuil de
k-anonymat sur les quasi-identifiants, et un test qui échoue si un champ non déclaré sort. Mettre la
validation juridique en prérequis daté, pas en note.

### F-27 · medium · FR-26 — « un test le vérifie sur chaque envoi » est irréalisable tel qu'écrit
> « Aucun indicateur ne contient un identifiant de personne ou de dossier ; un test le vérifie sur chaque
> envoi. »

**Pourquoi ça casse.** On ne détecte pas un identifiant arbitraire dans un flux libre. Et un agrégat sur
une population minuscule (une agence, un agent, trois dossiers) **est** une donnée personnelle.

**Correction.** Remplacer par un **schéma fermé** du signal (liste blanche de champs typés, rien d'autre
ne passe ; refus si un champ inconnu apparaît) et un seuil minimal d'effectif pour tout agrégat.

### F-28 · medium · FR-27 — où vit le registre, et qui le falsifie
> « Il est donné par le **dirigeant (DG)** ... ou par une personne qu'il **désigne par écrit** »

**Pourquoi ça casse.** Le registre est-il sur l'instance (qui garde la porte de sortie) ou chez Money
Vibes ? Sur site, un administrateur local peut-il insérer un consentement ? « Désigne par écrit » : comment
le système le sait-il ? Le droit client « donner un consentement » (C7) est attribuable par
l'administrateur du client, donc pas réservé au DG.

**Correction.** Consentement = document signé (comme la licence) contresigné par Money Vibes, stocké des
deux côtés ; le droit de consentir n'est attribuable que par le DG ; la porte de sortie n'accepte que des
consentements dont la signature est vérifiée.

### F-29 · medium · FR-30 — retrait de consentement et contributions déjà envoyées
> « Un consentement retiré exclut l'organisation du **prochain** tour d'entraînement »

**Pourquoi ça casse.** Les contributions déjà reçues par Money Vibes mais pas encore utilisées : purgées ou
utilisées au prochain tour ? Combien de temps Money Vibes garde-t-il une contribution ? Rien sur la
durée de conservation ni la suppression côté Money Vibes.

**Correction.** Exiger la purge des contributions non encore consommées au retrait, une durée de
conservation maximale des contributions, et la trace de leur suppression dans le journal visible du
client.

### F-30 · high · FR-24, FR-31 — « empreinte identique » contre « recalibré localement »
> FR-24 : « Une mise à jour ne modifie jamais une **calibration locale** : son empreinte est identique avant
> et après » ; FR-31 : « Le modèle commun est livré ... par le chemin de FR-17. Chaque instance le
> **recalibre localement**. »

**Pourquoi ça casse.** Une mise à jour du modèle commun est une mise à jour (FR-31 le dit) et produit une
nouvelle calibration : le test d'empreinte de FR-24 échoue par construction. Le retour arrière d'une
version de code (FR-18) doit-il aussi revenir au modèle commun précédent ? Une calibration de l'étage
local reste-t-elle compatible avec un nouveau modèle commun ?

**Correction.** Distinguer **mise à jour de code** (calibration intacte, empreinte identique) et **mise à
jour de modèle** (nouvelle calibration **ajoutée**, la précédente conservée et réactivable) ; définir
l'appariement modèle commun ↔ calibration et le retour arrière conjoint.

---

## 5. Exigences non testables et indicateurs sans mesure

### F-31 · high · SM-1, FR-6, FR-8, C4 — « en une action, bilan tout vert » est impossible par construction
> SM-1 : « le pack distributeur installé **en une action** sur une organisation vierge, bilan tout
> vert » ; §7 C4 : « Sans Reprise ni Connecteurs, le bilan déclare leurs lignes « non installé », jamais
> vertes » ; FR-6 : données importées, message WhatsApp reçu, lien PI-SPI généré.

**Pourquoi ça casse.** Une organisation **vierge** n'a ni données à reprendre, ni numéro WhatsApp vérifié,
ni clé PI-SPI : FR-5/FR-6 la mettent en 🔴. Et FR-8 impose essai **puis** rejeu : deux actions minimum. La
démo du 15/01 ne peut donc être « atteinte » qu'en trichant sur les vérifications — exactement ce que
FR-6 interdit.

**Correction.** Réécrire SM-1 : « en une action **dans l'espace d'essai**, bilan sans 🔴 hors prérequis
externes, avec des prérequis de démonstration déclarés (clé PI-SPI de bac à sable, numéro WhatsApp de
test) », et lister les lignes attendues avec leur voyant attendu.

### F-32 · medium · NFR-5 — « moins de 15 minutes » sans conditions de mesure
> « le pack distributeur complet s'installe dans l'espace d'essai en moins de **15 minutes**, hors reprise
> de données. »

**Pourquoi ça casse.** Sur quelle machine, avec quelles images déjà présentes ou non, avec quel réseau
(démarrage à froid sur le serveur d'un client en Afrique de l'Ouest = téléchargement de plusieurs Go),
« complet » = 18 modules ou les 4 modules du pack ? Les vérifications (attente de réception WhatsApp)
comptent-elles ? Un test qui ne fixe aucun de ces paramètres passera ou échouera au hasard.

**Correction.** Fixer la configuration de référence, l'état de départ (images en cache ou non), le
périmètre exact et le point de départ/fin du chronomètre ; ajouter une cible séparée pour l'instance sur
site (FR-25), qui n'en a aucune.

### F-33 · medium · SM-3, SM-4 — indicateurs sans source de mesure
> SM-3 : « Changements arrivés dans un espace réel **sans** passer par l'essai : 0 » ; SM-4 : « Données
> sorties d'une instance **sans** consentement valide : 0 ».

**Pourquoi ça casse.** Zéro est la valeur qu'affiche toute mesure qui n'existe pas. Rien ne dit quel
journal compte les changements (voir aussi F-04) ni quel point d'observation voit une sortie non
consentie. SM-2 et SM-5 n'ont pas de date de mesure ni de définition (« installé » = en service ?).

**Correction.** Pour chaque SM : source (journal NFR-4, sonde sur la porte de sortie), fréquence, date de
mesure, et pour les « 0 » un **test d'intrusion** qui prouve que la sonde verrait l'événement.

### F-34 · medium · FR-6 — « vérifié » sans critère de réussite
> « **Données importées** : le nombre d'objets repris par module (« 1 240 points de vente ... ») »

**Pourquoi ça casse.** Un nombre n'est pas une vérification : 0 point de vente importé est-il 🟢 ? Le PRD
dit « Vérifié ne veut jamais dire pas d'erreur », mais ne dit pas non plus ce qu'il veut dire. En outre,
FR-6 exige « l'invitation envoyée » alors que FR-9 **intercepte** tous les e-mails de l'essai : dans le
bilan d'essai, la vérification ne peut être que fausse ou interceptée.

**Correction.** Exiger que chaque vérification déclarée au manifeste porte son **critère** (attendu,
seuil, source de l'attendu — ex. comptes de la Reprise validés par le client) ; pour l'essai, dire
qu'une invitation interceptée vaut 🟢 « intercepté » et qu'elle est réellement envoyée au rejeu.

### F-35 · medium · FR-5, NFR-6 — « Réessayer sans effet de bord » contre des vérifications qui envoient
> « « Réessayer » ne rejoue que les vérifications en échec, et peut être relancé sans effet de bord. »

**Pourquoi ça casse.** Une vérification réelle **envoie** un WhatsApp, **génère** un lien de paiement,
**crée** un compte : la rejouer a un effet de bord par nature. Quand une vérification échoue après avoir
envoyé (délai de réception dépassé), le rejeu envoie un deuxième message.

**Correction.** Remplacer par « sans **doublon** » et exiger une clef d'idempotence par vérification
(rejouer réutilise le lien ou le message déjà émis et se contente de recontrôler la réception).

---

## 6. Promesses contradictoires et trous de cadrage

### F-36 · high · §2.2, FR-33, §0, §8, en-tête — le document se contredit sur son propre périmètre
> §2.2 : « Le client qui voudrait **installer lui-même** ... l'installation reste faite par Money
> Vibes » ; FR-33 : « tester **sans Money Vibes** » ; PRD Reprise QR-3 : libre-service « **Prêt en
> février** pour le distributeur, y compris pour un prospect en essai » ; §0 : « **Connecteurs**
> (synchronisation permanente, **plus tard**) » contre QA-3 : « Connecteurs doit être prêt en
> février » ; en-tête l. 16 : « Sections rédigées : §0, §1, §2, §3. À venir : §4 » ; §8 : « Il ne reste
> aucune question ouverte ».

**Pourquoi ça casse.** Qui ouvre l'offre d'essai d'un prospect, crée son organisation, installe ses
modules — si ce n'est pas Money Vibes, c'est du libre-service, que §2.2 exclut. Le §0 dit l'inverse de
QA-3. L'en-tête dit que §4 n'existe pas. Et des questions restent ouvertes (tension AD-P16, validation
juridique 2019-014, contrat client prérequis de FR-27, horloge, clés) : déclarer le contraire au PO qui
valide le 13/11 est la pire des erreurs de forme.

**Correction.** Aligner §0 et §2.2 sur QA-3 et FR-33 (le libre-service **d'essai** est dans le périmètre,
l'installation d'une offre signée ne l'est pas) ; supprimer l'en-tête périmé ; remplacer §8 par une liste
honnête de questions ouvertes et de prérequis datés avec propriétaire.

### F-37 · high · FR-13, FR-23, §3 « Console Money Vibes » — l'accès de l'équipe Money Vibes à une console sur site
> « Sur une instance sur site, elle tourne **sur l'instance du client**. » ; FR-23 : « Aucun accès
> permanent de Money Vibes à une instance sur site. »

**Pourquoi ça casse.** Rachid et Yao doivent se connecter à la console de l'instance pour installer,
superviser une répétition, déposer une licence. Avec quel compte, géré par quel fournisseur d'identité
(celui du client, celui de Money Vibes inaccessible sans entrée) ? Un compte Money Vibes permanent sur
l'instance **est** un accès permanent ; un compte créé à chaque visite suppose une procédure absente du
PRD. Qui, sur site, a le droit de déposer une licence ou un paquet (FR-22) : le DSI seul, n'importe quel
administrateur ?

**Correction.** Ajouter une exigence « Identités sur site » : comptes Money Vibes désactivés par défaut,
activés par le client pour une durée bornée (même mécanique que le tunnel FR-23), journalisés ; rôle
nommé côté client pour déposer licence et paquets.

### F-38 · medium · §5 — exigences transverses absentes
> NFR-1 → NFR-6.

**Pourquoi ça casse.** Rien sur : sauvegarde (fréquence, rétention, RPO/RTO, où elle vit — le NAS du
client tombe avec le serveur) alors que retour arrière et calibration en dépendent ; disponibilité de
l'instance pendant une promotion (durée d'interruption tolérée, coupure de l'application mobile hors
ligne) ; capacité minimale du serveur client ; journalisation de la plateforme Money Vibes pour la
supervision ; taille et rétention du journal en ajout seul ; chiffrement des paquets transportés sur clé
USB.

**Correction.** Ajouter au moins NFR-7 sauvegarde (RPO/RTO, emplacement hors serveur, test de restauration
périodique), NFR-8 interruption de service maximale par promotion, NFR-9 configuration minimale d'un
serveur client (prérequis du bilan d'instance).

### F-39 · medium · §1, §4 — aucun ordre de priorité pour février
> D3 révisée : « l'installation complète chez le client (licence, mise à jour, retour arrière) doit être
> prête AVANT FÉVRIER 2027 ».

**Pourquoi ça casse.** 33 FR, trois parties, deux modes d'hébergement, deux PRD voisins requis en
février, et aucune distinction entre ce qui doit tourner le 15/01, en février, ou plus tard (vagues avec
deux clients ? niveau 3 du canal de données sans contrat client signé ?). Les épics ne pourront pas
arbitrer quand le calendrier glissera.

**Correction.** Étiqueter chaque FR : démo 15/01 / février / après février. Exemples évidents de report :
FR-20 (vagues, sans objet à deux clients), FR-30/31 (niveau 3), FR-29.

### F-40 · low · §3 — « Suspendre » et « Désinstaller » ont la même définition
> « **Suspendre** : fermer l'accès sans rien supprimer » / « **Désinstaller** : fermer l'accès sans rien
> supprimer »

**Pourquoi ça casse.** Le contrat distingue `SUSPENDED` et `REVOKED`, et Q2/Q3 leur donnent des effets
opposés sur les dépendants ; le vocabulaire « sans synonyme » les rend indiscernables.

**Correction.** Ajouter la différence : qui décide (opérateur / client), effet sur les dépendants (Q3 vs
Q2), réversibilité (levée vs réinstallation), présence au menu.

### F-41 · low · FR-16 — la vérification quotidienne « n'envoie aucune donnée »
> « cette requête n'envoie aucune donnée »

**Pourquoi ça casse.** Pour savoir s'il existe un correctif « pour elle », l'instance doit au moins
s'authentifier et dire sa version — ou télécharger la liste complète. Et cette requête quotidienne
compte-t-elle comme un contact pour le délai de grâce ? Si oui, le signal hebdomadaire est inutile pour le
gel ; si non, une instance qui interroge tous les jours peut être déclarée silencieuse.

**Correction.** Préciser ce qui est transmis (identifiant d'instance et version, rien d'autre) et définir
« contact » pour FR-15 (toute requête authentifiée réussie, ou seulement le signal).

### F-42 · low · FR-15, FR-16 — J+7 avec un signal hebdomadaire
> « **J+7 sans signal** : alerte au DSI et à Money Vibes. »

**Pourquoi ça casse.** Avec un battement exactement hebdomadaire, un seul signal retardé de quelques
minutes déclenche l'alerte : faux positifs garantis, alertes ignorées ensuite.

**Correction.** Mesurer « deux signaux manqués » (ou J+8 avec tolérance) et dire que l'instance retente
le signal en cas d'échec.

### F-43 · low · FR-7, FR-12, FR-14, FR-4 — ordre des refus non défini
> `MODULE_DEPENDANCE_MANQUANTE` (422), `MODULE_NON_SOUSCRIT` (422), `MODULE_HORS_LICENCE` (422)

**Pourquoi ça casse.** Un même appel peut cumuler les trois causes ; sans ordre, deux implémentations
renverront deux codes et les tests de conformité divergeront. « PDF reçu par le dirigeant » (FR-7) n'est
pas vérifiable par le système (« envoyé », oui).

**Correction.** Fixer l'ordre d'évaluation (licence/contrat, puis dépendances) ou renvoyer **toutes** les
causes dans un seul refus ; remplacer « reçu » par « envoyé et journalisé ».

