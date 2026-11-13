---
title: "PRD — Prospera Assurance (chaîne sinistres)"
status: draft
created: 2026-11-13
updated: 2026-11-13
project: prospera
verticale: assurance IARD (zone CIMA, Togo)
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13)
prd_lies: [prd-distributeur-2026-11-12 (règles transverses), prd-microfinance-2026-11-13 (modèle : cœur fictif, IA commune locale, installation), prd-paiement-service-2026-08-02, prd-notification-service-2026-08-02, prd-reprise-donnees-2026-11-10, prd-connecteurs-2026-11-10, prd-moteur-installation-2026-11-09, prd-assistant-ia-2026-08-02, prd-reseau-zones-2026-08-02]
mode: rapide
---

# PRD — Prospera Assurance (chaîne sinistres)

*Brouillon complet (2026-11-13), rédigé en mode rapide à partir du récit du PO (`brain-dump-po-2026-11-13.md`), du plan de rédaction et de ses décisions D1-D21 prises par recommandation (`plan-redaction.md`), et de cinq extraits (`extract-*.md`). Décisions et raisons dans `.memlog.md`. Reste à faire : fin du PRD et annexes, réconciliation avec les sources, relectures, tri des hypothèses, passe de style.*

---

## 0. Objet du document

Ce PRD décrit **Prospera Assurance** : l'outil qui sert une compagnie d'assurance IARD de la zone CIMA, au Togo, **de la déclaration d'un sinistre à l'archivage de son dossier**, recours compris. Il s'adresse au PO, à Dev A, à Dev B et à ceux qui écriront les épics.

**Le client visé** est une compagnie IARD togolaise, au stade du pré-contrat. Le PRD ne la nomme jamais, ni son groupe : il écrit « la compagnie ». Elle démarre en **février 2027**, en même temps que les autres clients Prospera, **sur ses propres serveurs** : un serveur applicatif et un NAS chez elle (§7.5).

**Prospera ne remplace pas le logiciel de la compagnie.** Ce logiciel, appelé ici **« le logiciel de la compagnie »** (LC), garde les assurés, les polices, les garanties, les primes et leur paiement, les intermédiaires (courtiers, agents), les coassureurs et, pour un début, **le numéro de sinistre officiel**. **Il fait foi pour les contrats.** Prospera se branche à côté et tient le **dossier sinistre** : déclaration, pièces, instruction, expertise, évaluation, provision du dossier, décision, offre, règlement, recours, archives, journal (FR-2). Le LC est un nouveau logiciel que la compagnie met en place en parallèle ; il sera libre en janvier. **On ne spécule pas dessus** : le PRD définit un **contrat d'échange générique**, par interface (API) ou par fichier (Excel, JSON), dans les deux sens (annexe C). Pour la démonstration, Money Vibes livre un **logiciel de compagnie fictif** qui parle ce contrat, **pour que la compagnie voie** comment Prospera vit à côté de son logiciel.

**Tout le circuit fonctionne au premier jour, avec l'IA, sauf la voix.** Décision du PO : Prospera sert à **consulter et à déclarer**, et le circuit va **jusqu'au chèque** et à la clôture. Ce circuit a huit phases (déclarer, ouvrir, attribuer, instruire, chiffrer, décider, payer, clore), onze statuts, quatre sorties (rejeté, sans suite, litige, fraude suspectée) et un **recours mené en parallèle** (partie 2). L'IA est spécifiée dans chaque section où elle sert (FR-10) ; seules la dictée, la transcription d'appel et la synthèse vocale sont exclues, et le chatbot de l'assuré est « bientôt » (FR-22).

**La démo existante ne tourne que dans le navigateur.** Le front de démo `prospera-assurance` montre le circuit en entier, mais il n'enregistre rien côté serveur : le portefeuille d'environ 3 500 dossiers est généré à chaque chargement, les actions sont gardées dans le navigateur de chacun, l'IA est faite de règles et d'expressions régulières, et rien n'est envoyé ni payé. **C'est le serveur qu'il faut construire.** Ce PRD exige en vrai ce que la démo montre, et corrige ses écarts (franchise déduite, contrôle de garantie qui ne se saute pas, offre et accord de l'assuré comme étape, recours en parallèle, validation à plusieurs niveaux, lecture réelle des scans). **Le premier risque du projet est la reprise des données** : les archives de la compagnie, leur format, leur volume et le logiciel d'où elles partent ne sont pas connus à cette date (§12 ; module `reprise`).

**La compagnie a vu une vraie démonstration.** Elle a dit qu'**il manque des éléments, mais de débuter dessus**. Une **séance d'immersion** avec elle suivra, pour parfaire certaines étapes et faire des ajouts. Le but, dit le PO, est de **finaliser un vrai processus qui peut évoluer après, mais qui doit d'abord être présent, intégré et vraiment testé**. Ce PRD est donc écrit pour **évoluer par paramètres** : tout seuil, délai, liste ou règle de la compagnie est un paramètre (FR-4), et chaque décision prise sans parole de la compagnie porte la balise `[ASSUMPTION: … ; à confirmer à la séance d'immersion]`. Le PO a demandé de trancher soi-même les points restants « pour qu'on finisse » : ces choix sont des recommandations, pas des engagements de la compagnie.

**Ce PRD réutilise le PRD distributeur et le PRD microfinance.** Les règles transverses du premier (PRD-D §4) s'appliquent ici (FR-1). La partie 4 reprend les modules partagés par renvoi et dit seulement ce que l'assurance exige en plus ; elle s'inspire de la partie 4 du PRD microfinance pour l'installation chez le client et l'IA commune.

Le document se lit en quatre parties :

| Partie | Contenu | Sections |
|---|---|---|
| **1. Le produit** | vision, rôles, parcours, vocabulaire, règles transverses (partage avec le logiciel de la compagnie, paramètres, rôles et séparation des tâches, données de santé, IA, trace, délais, jeu de démonstration) | §1 à §4 |
| **2. Le circuit sinistre** | le module `sinistres` : de la déclaration à l'offre (§5.0 à §5.7), puis du paiement à la clôture, le recours, les sorties et les états (§5.8 à §5.15) | §5 |
| **3. Les autres modules propres à l'assurance** | pièces et archives (`ged`), expertises, contrats lus et provisions (`assurance`), échange avec le logiciel de la compagnie, logiciel fictif, reprise, pilotage | §6 |
| **4. Les modules partagés et cadrés** | fiches de renvoi : paiement, notification, tableau de bord, IA commune, installation chez la compagnie, réseau, connecteurs, support | §7 |

Suivent les exigences transverses (§8), les indicateurs (§9), le périmètre (§10), les non-objectifs (§11), les décisions, actions et risques (§12), les hypothèses (§13), puis quatre annexes : **A** le contrat de module (13 lignes par module), **B** la matrice d'accès, **C** le contrat d'échange avec le logiciel de la compagnie, **D** la table des paramètres. Les choix techniques renvoyés hors du PRD sont dans l'addendum.

**Sources et décisions.** Le récit du PO (`brain-dump-po-2026-11-13.md`), le plan de rédaction et ses 21 décisions de cadrage (`plan-redaction.md`), le code et les parcours de la démo, la proposition commerciale v2 (la référence commerciale), la SPEC métier, et la recherche réglementaire (`extract-recherche-cima.md`). En cas d'écart, l'ordre de priorité est : le récit du PO, le plan, le code de la démo, les parcours validés, la proposition v2, la SPEC, puis les autres pièces ; **la réglementation l'emporte sur tout pour les obligations légales**. Le code de la démo l'emporte sur la SPEC, qui est en retard sur lui (elle décrit 9 statuts et 2 sorties). Les questions du fichier de retour personnel de la démo (`99-retour-personnel.md`) sont imaginées par le PO : elles ne sont pas des propos de la compagnie. Ce que la compagnie a dit est connu de seconde main, par trois documents : l'atelier avec le service sinistres (dont il reste six constats), l'offre v4 et la proposition v2.

**Pièces de référence qui ne sont pas togolaises.** La convention d'expertise du dossier est tunisienne, le mémoire de 2014 porte sur une compagnie du même groupe au Sénégal, et les formulaires du fonds de garantie sont sénégalais : ce sont des modèles et des jeux de test, pas des règles du Togo. Les règles du Togo viennent du Code CIMA et de la loi togolaise sur les données personnelles. Seuls les textes que la recherche a lus (marqués SÛR) sont cités avec leur numéro ; le reste est « à vérifier par le juriste » (FR-24).

---

## 1. Vision

Une compagnie d'assurance vit de la confiance de ses assurés au moment du sinistre. Aujourd'hui, quand un assuré appelle (« Où en est mon dossier ? », « Avez-vous reçu mon document ? », « Quel est le montant prévu ? », « Pourquoi mon dossier n'est-il toujours pas réglé ? »), le collaborateur cherche dans plusieurs dossiers et plusieurs applications, demande à d'autres services, appelle un collègue, reconstitue le parcours. L'assuré attend, rappelle, finit par douter de la compagnie. Le collaborateur perd son temps. La direction ne voit pas ce qui se passe vraiment.

**La phrase à faire disparaître est : « Je vais vérifier et je vous rappelle. »**

Prospera Assurance donne à chaque acteur du sinistre **une seule histoire du dossier**, enregistrée pas à pas : de l'agent d'accueil qui reçoit la déclaration au responsable qui valide, de la comptable qui émet le chèque à l'archiviste qui verse le dossier au fonds. Le gestionnaire répond à l'assuré **pendant l'appel**, depuis la fiche. Le responsable voit les dossiers bloqués, les délais qui expirent et la charge de chacun. Le contrôle interne et la CRCA trouvent le journal sans reconstitution. Il le fait **à côté du logiciel de la compagnie, sans le remplacer** : le logiciel tient le contrat, Prospera tient le sinistre.

**Les promesses de la proposition v2** (la référence commerciale, 15 septembre 2026), et ce que le PRD en fait :

| # | Promesse (proposition v2) | Ce que le PRD mesure (§9) |
|---|---|---|
| 1 | Une recherche unique par nom, numéro de police, téléphone, référence sinistre ou numéro d'archivage, « en quelques secondes » | résultat en moins de 5 secondes au 95e centile sur le volume repris ; moins de 1 seconde visé (défaut, annexe D) `[ASSUMPTION: la v2 ne chiffre pas ; la cible de 5 s vient du deck du 12/09 et du PO ; 1 s est la cible du deck]` |
| 2 | Chaque étape tracée : qui, quand, pourquoi ; 100 % des actions horodatées et attribuées | part des actions du journal avec auteur et horodatage serveur (cible 100 %) ; part des refus et classements avec motif (cible 100 %) |
| 3 | Aucun règlement sans validation, aucun montant payé deux fois | nombre d'ordres sans validation (cible 0) ; nombre de doublons de règlement détectés avant émission |
| 4 | Délais du Code CIMA respectés ; audits et contrôles de la CRCA « préparés sans reconstitution » | part des dossiers corporels avec une échéance légale active et alertée ; temps pour produire le journal d'un dossier ou d'une période |
| 5 | Un tableau de bord de direction : dossiers ouverts par branche et par étape, bloqués et leur raison, sans action depuis 30 jours, charge et montants par gestionnaire, pièces attendues, règlements en attente | chiffres calculés depuis les dossiers, jamais saisis (FR-17) ; fraîcheur des chiffres |
| 6 | L'IA : quatorze usages, locale, qui propose et ne décide jamais, jamais de montant sur un préjudice corporel, chaque information sourcée, registre de chaque action | chaque proposition porte son origine, sa source et son statut ; part des propositions acceptées, modifiées, rejetées (rapport mensuel de performance, FR-10 et §7.4) |
| 7 | Les données personnelles et médicales ne sortent jamais de la compagnie | un test inspecte tout envoi sortant et n'y trouve ni donnée nominative ni donnée médicale (FR-12, FR-232) |
| 8 | Une sauvegarde quotidienne automatique et un journal d'accès | rapport de restauration testée (FR-236) ; journal des consultations (FR-13) |
| 9 | Une anomalie bloquante prise en charge sous 4 heures ouvrées | délai mesuré de prise en charge (FR-246) |

Les promesses du deck du 12/09 qui ne figurent ni dans la v2 ni dans l'offre v4 (assistant conversationnel en français et en anglais, 24 h sur 24, côté assuré) sont **« bientôt »** (FR-22).

---

## 2. Pour qui

### 2.1 Les rôles

La compagnie travaille avec **quatorze rôles** (décision de cadrage D14 ; le plan de rédaction les fixe, la compagnie les confirmera à la séance d'immersion). Chacun ne voit que son périmètre (FR-6).

| Code | Rôle | Périmètre | Ce qu'il fait dans Prospera |
|---|---|---|---|
| DG | Direction générale | tous les dossiers | pilote ; valide seule les règlements à titre commercial ; siège au comité s'il le décide ; certifie une reconstitution ; lit les données de santé pour une décision |
| DT | Directeur technique (opérationnel) | tous les dossiers | donne son visa sur les montants qui passent au comité ; siège au comité sinistres ; lit les données de santé pour une décision |
| RESP | Responsable du service sinistres | tous les dossiers du service | attribue les dossiers, ordonne une contre-expertise, valide jusqu'au seuil de sa délégation, préside le comité, rend l'arbitrage ; réaffecte la charge |
| GEST | Gestionnaire sinistres | les dossiers de **son volet** (corporel, matériel ou risques divers) | instruit, demande les pièces, mène les expertises, arrête l'évaluation, prépare l'offre, clôt |
| GREC | Gestionnaire recours | les dossiers en recours | mène le recours contre le tiers ou son assureur : mise en cause, relances, mise en demeure, encaissement |
| MED | Médecin-conseil | les dossiers corporels qui lui sont confiés | lit les pièces médicales, rend un avis sur les lésions et la consolidation ; ne propose jamais de montant par l'IA |
| EXPI | Expert interne | ses missions | accepte la mission, rédige son rapport dans l'application |
| EXPE | Cabinet d'expertise externe | **ses seules missions**, par le portail expert | accepte la mission, dépose son rapport ; ne voit ni la provision ni le reste du dossier |
| ACC | Chargé d'accueil-guichet | recherche et guichet | reçoit la déclaration, constate les pièces, répond à l'assuré, remet le chèque contre quittance signée ; voit qu'une pièce médicale est reçue, **jamais son contenu** |
| NUM | Opérateur de numérisation | lots de scan, indexation | scanne, indexe, contrôle avant archivage |
| ARCH | Archiviste | fonds d'archives | verse au fonds, attribue le numéro d'archivage, tient la cote physique, reconstitue |
| CPT | Comptable règlements | ordres de règlement, paiements | émet le chèque ou le virement, saisit les références, rapproche ; **ne décide jamais** d'un règlement |
| AUD | Contrôle interne | tous les dossiers, **en lecture seule** | contrôle, lit le journal des changements et des consultations, prépare les contrôles de la CRCA |
| ADMIN | Administrateur informatique de la compagnie | comptes et paramètres | crée les comptes, règle les paramètres, installe les mises à jour ; **ne lit aucune donnée métier** |

Le **comité sinistres** n'est pas un rôle : c'est une instance de décision, composée de personnes qui portent déjà un rôle (FR-8). Les **quatorze gestionnaires** de la démo (trois en corporel, cinq en matériel, trois en risques divers, trois en recours) sont un chiffre de **démonstration**, pas l'effectif réel de la compagnie (FR-15). Il n'y a pas de rôle « assuré » : l'assuré n'a pas d'application (§2.2).

### 2.2 Hors cible (v1)

- **L'assuré n'a pas d'application à lui.** Il reçoit des messages : SMS, WhatsApp, e-mail (FR-18). Il se présente au guichet, il téléphone, il écrit. Le **chatbot de l'assuré** (assistant conversationnel, aide à la déclaration, état d'avancement) est **« bientôt »** (FR-22).
- **La CRCA ne se connecte pas.** Elle reçoit les états et les pièces que la compagnie produit et exporte ; le contrôle interne les prépare (UJ-7).
- Les courtiers, agents et coassureurs ne se connectent pas : ils sont **informés** par `notification` quand un sinistre touche leurs contrats (FR-18).
- La production (souscription, primes, encaissement des primes), la comptabilité officielle et la réassurance comptable restent dans le logiciel de la compagnie (FR-2).
- La banque, la microfinance et le distributeur ont leurs propres PRD.

### 2.3 Parcours clés

Les noms sont ceux du jeu de démonstration (FR-15) ; ils sont modifiables. Les montants du parcours UJ-3 sont ceux du dossier de référence `SIN-2026-9002`.

**UJ-1 — « Où en est mon dossier ? » : la réponse pendant l'appel.** Mawuli Dogbe appelle le guichet des sinistres : sa Nissan a été heurtée sur la route de Kpalimé et il n'a plus de nouvelles depuis plusieurs semaines. Afi, chargée d'accueil, tape son nom ; la fiche s'affiche en moins de 5 secondes. Elle lit : le dossier est **en validation** chez le responsable ; les cinq pièces obligatoires sont reçues ; le **montant évalué** est arrêté, **déjà payé** est zéro, le **reste à payer** est donc égal au montant validé à venir ; la dernière action est l'envoi en validation, hier, par Estelle, la gestionnaire. Afi répond tout de suite, sans « je vous rappelle ». Elle ajoute une note ; sa consultation est enregistrée à son nom. Elle ne voit rien du contenu médical d'autres dossiers et ne peut pas modifier le montant.

**UJ-2 — Un accident déclaré au guichet.** Dzifa Amouzou entre au guichet après un accrochage. Afi saisit la déclaration : police, date, lieu, véhicule, tiers. Le dossier reçoit **immédiatement** une référence de déclaration `DEC-` (exemple de format : `DEC-2027-00018`), imprimée sur l'accusé de réception remis à Dzifa. Prospera vérifie qu'il n'existe pas déjà une déclaration pour la même police, la même date, la même immatriculation et la même victime, dans Prospera **et** dans les sinistres reçus du logiciel de la compagnie. L'écran affiche **la liste exacte des pièces à fournir** pour ce type de sinistre ; Dzifa n'en a qu'une partie sur elle. Afi les scanne ; l'application lit chacune, la reconnaît, la rattache à la pièce attendue. Le dossier passe en **pièces attendues** et Dzifa reçoit un SMS qui liste les pièces qui manquent. La déclaration part vers le logiciel de la compagnie ; le lendemain matin, il renvoie le **numéro de sinistre officiel**, que Prospera rattache et affiche désormais partout. Dzifa est prévenue par SMS.

**UJ-3 — Le matériel de bout en bout, sur le modèle de `SIN-2026-9002`.** Collision à Lomé, véhicule de Mawuli Dogbe (police auto tous risques, franchise 10 %, minimum 50 000 FCFA), responsabilité partagée avec un tiers. Afi **déclare** et ouvre le dossier en attente de pièces ; le dépôt des sept pièces de l'assuré complète le dossier, qui passe **ouvert**. Komi, le responsable, **attribue** le dossier à Estelle, avec un motif. Estelle **instruit**. Le cabinet de l'expert initial remet son rapport par courrier ; Estelle le saisit, joint le PDF, le marque « saisi pour le cabinet ». Le rapport retient 445 500 FCFA contre un devis de garage de 1 273 000 : **l'écart** (65 %) est signalé avec la question à poser à l'expert. Estelle demande un complément ; Komi ordonne une **contre-expertise** (le gestionnaire ne peut pas), confiée à un autre cabinet que celui du premier rapport, qui dépose son rapport depuis le portail expert et confirme 445 500. Une lecture interne des circonstances, proposée par l'assistant et retenue par Estelle, fixe la part du tiers à 70 %. Estelle enregistre la **décision de garantie** (garantie acquise, motif écrit, déclaration tardive notée en réserve), puis **évalue** : le décompte part du chiffrage validé de 445 500 FCFA, passe par la vétusté, **déduit la franchise** (10 %, minimum 50 000 FCFA) et vérifie le plafond ; l'**évaluation** arrêtée est le résultat de ce décompte (395 500 FCFA `[ASSUMPTION: exemple de calcul ; le jeu de démonstration fixe la valeur exacte]`) et la provision est révisée. Le montant est sous le seuil de délégation du responsable : Komi **valide** avec un motif. Prospera envoie l'**offre** à Mawuli sous 48 heures ; Mawuli l'**accepte** et signe ; l'accord est enregistré. Pascal, le comptable, qui n'a pas décidé, **émet** le règlement par chèque (numéro et banque saisis). Afi **remet** le chèque contre quittance signée et pièce d'identité du retirant : le dossier est **réglé**, reste à payer zéro. Estelle **clôt** avec un motif écrit. Mensah, l'archiviste, **verse** le dossier au fonds : le numéro d'archivage `ARC-…` est attribué, la cote physique de la chemise est notée. Le recours contre le tiers continue seul (UJ-5). *Ce parcours est le parcours n° 1 : il doit se mener **à la main, rôle après rôle**, dans la démo, sur un dossier créé à l'écran (FR-16).*

**UJ-4 — Un préjudice corporel grave.** Kokou, motard, est renversé par un véhicule dont l'assureur de responsabilité est la compagnie. Le dossier corporel est suivi par Edoh, gestionnaire corporel. Le **chronomètre légal** se déclenche à la date de l'accident : l'offre est due dans les **12 mois** suivant l'accident, ou dans les **8 mois** suivant le décès si la victime meurt (Code CIMA, art. 231) ; la pénalité de **5 % par mois** de retard est affichée (art. 233, 236). À six mois, la consolidation n'est pas connue : Prospera propose une **offre provisionnelle**, et suit le délai de l'offre définitive. Les pièces médicales vont au **médecin-conseil** ; Afi, à l'accueil, voit seulement qu'un certificat est reçu. **L'IA ne propose aucun montant** : l'évaluation est le calcul poste par poste du barème corporel, saisi par Edoh avec l'avis du médecin-conseil. Le dossier dépasse le seuil du responsable : il passe au **comité sinistres**, puis reçoit le **visa du directeur technique**. L'accord de la victime est enregistré par un **procès-verbal de transaction**, qui rappelle son droit de le dénoncer dans les 15 jours (art. 235). Le règlement est libellé au nom de la victime (art. 232).

**UJ-5 — Le recours mené en parallèle.** Dans `SIN-2026-9002`, le tiers est en cause. Dès l'ouverture, une lettre de **mise en cause** part vers le tiers ou son assureur ; Sélom, gestionnaire recours, la relance **tous les 15 jours**. Le dossier de Mawuli est réglé et **clos** pendant que le recours continue. Une fois Mawuli payé, Sélom réclame le remboursement de la part du tiers (70 % de responsabilité) par subrogation ; le calcul du montant réclamé est au §5.10. L'assureur adverse propose moins ; l'IA évalue l'offre et prépare la contre-proposition ; Sélom décide. Le recours a sa propre machine d'états : il se clôt seul, quand l'argent est récupéré ou le recours abandonné avec motif. La **prescription biennale** est affichée comme un terme à vérifier, avec alerte 90 jours avant.

**UJ-6 — Le responsable sinistres, un lundi matin.** Komi ouvre son **brief du matin** : dossiers à risque, délais légaux qui expirent cette semaine, anomalies de la nuit, dossiers sans action depuis 30 jours, pièces attendues, règlements en attente de validation. Il voit la **charge** de chacun des gestionnaires et un dossier **bloqué** depuis plusieurs jours en attente d'un complément d'expert. Il relance l'expert, puis **réaffecte** les dossiers de Yao, absent, à Sélom, en un geste, avec un motif. Les dossiers réaffectés gardent tout leur historique. Il pose une question au Copilot (« Quels dossiers auto sont bloqués ? ») : la réponse cite ses chiffres et leur source.

**UJ-7 — Le contrôle interne prépare un contrôle de la CRCA.** Yawa, du contrôle interne, apprend qu'un contrôle sur pièces est annoncé. Elle exporte, pour l'exercice demandé, la liste des dossiers corporels avec leurs échéances légales, les **états de sinistres** par exercice de survenance, la provision dossier par dossier, et le **journal chaîné** de quelques dossiers tirés au sort : changements **et consultations**, au nom des agents. Elle repère un dossier où l'instructeur a validé son propre règlement : le contrôle bloque ce cas, elle vérifie qu'il n'a pas eu lieu. Rien n'est reconstitué à la main ; le dossier de contrôle est prêt en une journée `[ASSUMPTION: durée non mesurée ; à confirmer à la séance d'immersion]`.

**UJ-8 — L'informaticien suit la reprise et la resynchronisation.** Kossi, de la DSI de la compagnie, suit la **reprise des archives** que l'équipe de Money Vibes a lancée sur les dossiers en cours, puis sur l'historique. Il lit le **rapport de reprise** : dossiers récupérés, rejetés avec leur raison, écarts. Chaque nuit, la **resynchronisation** avec le logiciel de la compagnie s'exécute ; le matin, il voit combien de sinistres elle a rattachés et quels enregistrements elle a rejetés, par exemple faute de police. Il corrige la table de correspondance et relance. À aucun moment il ne lit le contenu d'un dossier : il voit des comptes, des états et des motifs de rejet.

**UJ-9 — La compagnie essaie la démo.** Une équipe de la compagnie reçoit l'accès à la démonstration : une **compagnie fictive** de 14 gestionnaires et d'environ 3 500 dossiers, branchée sur le **logiciel de compagnie fictif**. Elle **crée un vrai dossier** : une déclaration, qui reçoit sa référence `DEC-` et, un instant plus tard, un numéro de sinistre renvoyé par le logiciel fictif ; elle le mène, rôle après rôle, jusqu'au chèque (UJ-3). Rien n'est simulé à l'écran : chaque action est enregistrée et relue par les autres rôles.

---

## 3. Vocabulaire

Le vocabulaire commun est celui du PRD distributeur (PRD-D §3). Les termes propres à ce PRD :

| Terme | Sens dans ce PRD |
|---|---|
| **Dossier sinistre** | L'histoire d'un sinistre, de sa déclaration à sa clôture et à son archivage, tenue par Prospera. |
| **Déclaration** | L'acte par lequel l'assuré ou son représentant informe la compagnie d'un sinistre. Elle crée le dossier. |
| **Référence de déclaration (`DEC-AAAA-NNNNN`)** | La référence que Prospera donne **immédiatement** à la déclaration, avant tout numéro officiel. Elle reste un critère de recherche. |
| **Numéro de sinistre** | Le numéro **officiel**, détenu par le logiciel de la compagnie. Il s'affiche partout une fois reçu (FR-2). Un paramètre permet de basculer l'attribution vers Prospera plus tard. |
| **Numéro d'archivage (`ARC-AAAA-CCCC-NNNNN`)** | Le numéro attribué à un dossier **clos** quand il est versé au fonds ; il n'est jamais réattribué. Il est conservé tel quel à la reprise s'il existe. |
| **Cote physique** | L'emplacement du dossier papier : boîte, rang, chemise de couleur par branche. Le papier reste tenu (FR-21). |
| **Volet** | Le classement d'un dossier : **corporel**, **matériel** ou **risques divers**. Un gestionnaire est rattaché à un volet. |
| **Pôle recours** | Le service qui mène les recours contre les tiers ; ses gestionnaires portent le rôle GREC. |
| **Pièce** | Un document du dossier : **obligatoire** (sa liste dépend du type de sinistre) ou **complémentaire**. |
| **Recevabilité** | Le contrôle que le sinistre peut être pris en charge : police en vigueur, prime payée, garantie souscrite, délai de déclaration. Il s'appuie sur la projection datée des contrats lue du logiciel de la compagnie (FR-3). |
| **Garantie** | La couverture d'un risque prévue par la police. La **décision de garantie** est un acte du gestionnaire : `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, avec motif. |
| **Mission d'expertise** | La demande faite à un expert (interne ou cabinet externe) d'examiner un point du dossier. |
| **Rapport d'expertise** | Le rapport que l'expert remet à l'issue de la mission. |
| **Contre-expertise** | Une **expertise demandée par la compagnie pour contrôler le rapport d'une première expertise**, confiée à un autre expert. Interne à la compagnie. |
| **Expertise contradictoire** | Une expertise **menée entre assureurs** (ou avec la partie adverse), dans le cadre d'un recours. **Ne pas confondre avec la contre-expertise** : ce sont deux sens distincts. |
| **Décompte** | Le calcul qui mène du dommage à l'indemnité : dommage, vétusté, franchise, plafond, règle proportionnelle. |
| **Évaluation** | Le montant arrêté par le gestionnaire au terme du décompte. Une évaluation arrêtée n'est **jamais recalculée** si un barème change. |
| **Provision** | La charge estimée du dossier, tenue **dossier par dossier**, posée à l'ouverture et revue à chaque événement, avec motif (FR-2). |
| **Délégation** | Le pouvoir de valider un montant. Une matrice paramétrable fixe qui valide quoi (FR-8). |
| **Comité sinistres** | L'instance qui décide au-delà du seuil du responsable. Ce n'est pas un rôle. |
| **Offre** | La proposition d'indemnité faite à l'assuré : **provisionnelle** (consolidation inconnue) ou **définitive**. |
| **Accord** | La réponse favorable de l'assuré à l'offre, **enregistrée** (offre signée, ou procès-verbal de transaction au corporel). Aucun ordre de règlement sans accord enregistré. |
| **Procès-verbal de transaction** | L'acte qui constate l'accord de la victime sur l'indemnité d'un dommage corporel. |
| **Ordre de règlement** | La demande, émise après décision, de payer. Celui qui décide ne paie pas (FR-7). |
| **Quittance** | La pièce signée par le bénéficiaire qui reconnaît avoir reçu le paiement ; elle a son propre état. |
| **Règlement** | Un paiement d'un dossier. Un dossier peut en avoir **plusieurs** (acompte, offre provisionnelle, plusieurs bénéficiaires, honoraires d'expert). |
| **Recours** | Le suivi, mené en **parallèle** du dossier, de la récupération auprès du tiers ou de son assureur. |
| **Mise en cause** | La lettre qui prévient le tiers ou son assureur qu'il est tenu pour responsable, dès l'ouverture. |
| **Mise en demeure** | La lettre qui somme le tiers ou son assureur de payer. |
| **Le logiciel de la compagnie (LC)** | Le logiciel métier de la compagnie. Il fait foi pour les contrats et détient le numéro de sinistre officiel. |
| **Le logiciel de compagnie fictif** | Le logiciel de démonstration livré par Money Vibes, qui parle le contrat d'échange (annexe C). Il n'est jamais installé en production réelle. |
| **IA commune** | La famille de modules d'IA de Prospera, commune à toutes les verticales ; chez la compagnie, elle tourne en **instance locale** (§7.4). |
| **Registre de l'IA** | Le journal de chaque action de l'IA : entrée, sortie, confiance, sources, niveau, statut, auteur de la décision (FR-12). |

**Les cinq montants, jamais confondus** (le PRD les nomme toujours par leur nom ; chacun s'affiche à part sur l'écran du dossier) :

| Montant | Sens |
|---|---|
| **Évalué** | Le montant arrêté par le gestionnaire au terme du décompte. |
| **Proposé** | Le montant de l'**offre** faite à l'assuré. |
| **Validé** | Le montant approuvé par la personne ou l'instance qui a la délégation. |
| **Payé** | Ce qui a été réglé, tous règlements confondus. |
| **Reste à payer** | Le validé moins le payé. Le dossier passe à `REGLE` quand il est zéro. |

À côté de ces cinq montants, la **provision** est une charge estimée tenue pour l'exercice : elle n'est ni l'évalué, ni le proposé, ni le validé. Le dossier de référence `SIN-2026-9002` montre pourquoi : devis du garage 1 273 000, chiffrage de l'expert 445 500, provision d'ouverture 780 000 puis réajustée à l'évaluation, estimation par comparables 555 000 : **aucun de ces chiffres n'est fondu avec un autre**.

---

## 4. Partie 1 — Les règles transverses

Ces exigences valent pour **tous** les modules des parties 2, 3 et 4.

### 4.1 Les règles du PRD distributeur s'appliquent

#### FR-1 : Les règles transverses du PRD distributeur valent ici

Les règles suivantes du PRD distributeur s'appliquent à tous les modules de ce PRD, sans être réécrites : tout s'enregistre côté serveur (PRD-D FR-1) ; les boutons pas encore branchés sont « bientôt », sans date, jamais simulés (PRD-D FR-2) ; les enchaînements entre rôles sont des étapes enregistrées (PRD-D FR-3) ; une seule table d'accès, appliquée par le serveur (PRD-D FR-5, PRD-D FR-6) ; chaque rôle a sa vue (PRD-D FR-7) ; les données privées restent privées (PRD-D FR-8) ; les garde-fous bloquent (PRD-D FR-13) ; un modèle unique d'alerte et de décision (PRD-D FR-14) ; tout indicateur se calcule depuis les données (PRD-D FR-15) ; une prédiction dit d'où elle vient (PRD-D FR-16) ; de vrais documents et des exports (PRD-D FR-17, PRD-D FR-18) ; chaque module est installable seul (PRD-D FR-19).

**Conséquences (testables) :**
- Chaque test de recette des FR cités du PRD distributeur est rejoué sur les écrans de la compagnie, avec le vocabulaire de la compagnie (§3). La démo actuelle garde ses données dans le navigateur de chacun : le test « recharger la page, changer d'appareil » (PRD-D FR-1) est le premier à passer.
- Le test « aucun bouton ni branché ni bientôt » (PRD-D FR-2) couvre tous les écrans de ce PRD.
- Ne sont jamais « bientôt » : tout ce qu'exige le parcours UJ-3 (de la déclaration à l'archive, rôle après rôle) et le parcours UJ-1 (la réponse à l'assuré pendant l'appel).
- Une action refusée par la table d'accès l'est par le **serveur** : un appel direct hors droits rend un refus nommé, sans donnée (la démo ne contrôle les droits que dans le navigateur).

### 4.2 Le logiciel de la compagnie fait foi pour les contrats

#### FR-2 : Ce que Prospera tient, ce que le logiciel de la compagnie tient

Le logiciel de la compagnie (LC) fait foi pour les contrats (décision de cadrage D2). Prospera ne modifie jamais un assuré, une police, une garantie ou une prime. Le partage est le suivant :

| Objet | Qui le tient | Ce que fait l'autre |
|---|---|---|
| Assurés, polices, garanties, primes et leur paiement, intermédiaires (courtiers, agents), coassureurs | **le LC** | Prospera les **lit** et en garde une projection datée (FR-3) |
| **Numéro de sinistre officiel** | **le LC** (par défaut, pour un début ; un paramètre permet de basculer l'attribution vers Prospera) | Prospera donne tout de suite une **référence de déclaration `DEC-`**, envoie la déclaration, reçoit le numéro officiel et le rattache |
| Dossier sinistre : déclaration, pièces, instruction, expertise, évaluation, décision, offre, accord | **Prospera** | le LC reçoit la déclaration et les événements prévus au contrat d'échange (annexe C) |
| **Provision du dossier**, posée à l'ouverture et revue à chaque événement, avec motif | **Prospera** | Prospera produit l'**état des provisions** (dossier par dossier, par exercice de survenance, brut, cédé, net) et l'**export** vers la comptabilité et le LC |
| Règlements : ordre, quittance, chèque émis, remis, paiement | **Prospera** (l'exécution passe par `paiement`, §7.1) | le LC reçoit les règlements pour sa comptabilité, par le contrat d'échange |
| Recours contre les tiers | **Prospera** | le LC reçoit les encaissements de recours |
| Archives : pièces, numéro d'archivage, cote physique | **Prospera** (`ged`) | le LC reçoit les références utiles |
| Traités de réassurance et clés de coassurance du référentiel | **Prospera** tient un référentiel daté, saisi ou importé de la compagnie `[ASSUMPTION: les traités ne sont pas dans le LC ; à confirmer à la séance d'immersion]` | la cession et la coassurance sont calculées par Prospera sur le dossier |
| **Comptabilité officielle**, écritures, primes, réassurance comptable | **la compagnie** (hors de Prospera) | Prospera fournit un **état et un export** ; le rapprochement bancaire des chèques et du Mobile Money se fait dans `paiement` (FR-224) |
| Journal du dossier | **Prospera** | — |

Si le LC ne sait pas recevoir (interface absente ou en panne), Prospera produit une **liste « à saisir dans le logiciel de la compagnie »** ; l'agent qui y saisit une déclaration **reporte** dans Prospera le numéro obtenu. Un dossier **sans numéro officiel depuis plus de 1 jour ouvré** est une alerte au responsable (paramètre). Le contrôle de doublon porte sur la police, la date de survenance, l'immatriculation et la victime, dans Prospera **et** dans les sinistres reçus du LC.

**Conséquences (testables) :**
- Aucun écran de Prospera n'affiche un contrat, une garantie ou une prime comme officiel sans dire de quand date la dernière lecture du LC.
- La déclaration reçoit sa référence `DEC-` à l'enregistrement, avant toute réponse du LC ; elle figure sur l'accusé remis à l'assuré ; elle reste un critère de recherche une fois le numéro officiel reçu.
- Une déclaration renvoyée par le LC avec un numéro officiel est **rattachée** sans doublon : rejouer le même échange ne crée ni un second dossier ni un second numéro.
- Un test met le LC fictif hors service : les dossiers se créent, la liste « à saisir » se remplit, et se vide à mesure que les numéros sont reportés.
- Le paramètre « qui attribue le numéro » (LC ou Prospera) change l'attribution sans modification du code : un test le bascule sur le LC fictif.
- Dans la démonstration, le **logiciel de compagnie fictif** tient tout ce que le tableau attribue au LC (§6.5).
- Un dossier sans numéro officiel depuis plus d'1 jour ouvré apparaît dans le brief du responsable (UJ-6).

#### FR-3 : Les contrats sont lus, jamais modifiés

Prospera lit les polices et les garanties par une **projection datée** du LC. Le contrôle de recevabilité (police en vigueur, prime payée, garantie souscrite, délai de déclaration) s'appuie sur cette projection et **affiche la date de la dernière lecture** (D4). **Le contrôle de garantie ne peut pas être sauté** : si l'information manque, le gestionnaire enregistre une **décision motivée** (`GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, motif d'au moins 10 caractères), visible par le contrôle interne. Le détail du contrôle est au §5 ; la projection et son échange sont au §6.4 et à l'annexe C.

**Conséquences (testables) :**
- Aucun appel de Prospera n'écrit dans les contrats du LC ; un test inspecte les échanges sortants vers le LC fictif et n'y trouve aucune écriture sur un contrat.
- La transition vers l'évaluation est **refusée** sans décision de garantie enregistrée ; un test tente de la sauter avec chaque rôle.
- La projection a un âge maximal paramétrable ; au-delà, le contrôle de recevabilité affiche « données du … » et demande une relecture (défaut, annexe D `[ASSUMPTION: 15 minutes avec une interface, 1 jour avec des fichiers ; valeurs reprises du modèle de la microfinance]`).
- Une déclaration tardive n'entraîne **jamais** une déchéance automatique : la réserve et son motif sont enregistrés, le responsable décide (décision D15 ; Code CIMA art. 20, qui exige la preuve d'un préjudice).

### 4.3 Tout seuil est un paramètre de la compagnie

#### FR-4 : Les seuils de la démo sont des valeurs par défaut

Tout seuil, délai, montant, taux, tolérance ou liste métier (pièces obligatoires par type de sinistre, barèmes de vétusté, franchises, seuils de délégation, délais de relance, seuils d'expertise, listes d'experts, modèles de courriers) est un **paramètre de la compagnie**, réglé par l'administrateur **sous la validation d'un rôle métier**, versionné et daté. Les valeurs de la démo, du plan et des sources sont les **valeurs par défaut**. Toutes les valeurs par défaut sont rassemblées dans **l'annexe D**, qui fait foi en cas d'écart avec une FR. C'est ce qui permet au PRD d'évoluer à la séance d'immersion sans reprise du code.

**Conséquences (testables) :**
- Changer un paramètre ne modifie pas un dossier déjà engagé : un dossier garde les règles en vigueur à sa **date de survenance** pour ce qui est légal (FR-14), et à son **ouverture** pour ce qui est interne.
- Chaque changement de paramètre est enregistré : ancienne valeur, nouvelle valeur, auteur, validateur, date.
- Aucun seuil du PRD n'est écrit dans le code : un test change chaque paramètre listé à l'annexe D et vérifie l'effet.
- Les **délais légaux** (FR-14) ne sont pas des paramètres de la compagnie : ils sont un référentiel versionné qu'elle ne modifie pas.

#### FR-5 : Les seuils d'alerte se calibrent sur les données reprises

Les **seuils d'alerte** (retard, provision, charge, silence d'un dossier, écart d'expertise, concentration d'émission, signaux de fraude) ne sont pas figés sur les valeurs de la démo, qui sont des chiffres de jeu. À la reprise des données, Prospera calcule une **proposition de seuil** par alerte à partir de l'historique repris de la compagnie, un humain la valide, et la proposition est recalculée à intervalle régulier, par percentiles de la compagnie (défaut, annexe D `[ASSUMPTION: chaque trimestre ; modèle de la microfinance]`).

**Conséquences (testables) :**
- Chaque seuil d'alerte affiche sa source : « valeur de démonstration », « calculé sur vos données du … », ou « fixé par … le … ».
- Un seuil calculé n'entre en vigueur qu'après validation par le rôle qui possède l'alerte.
- Les valeurs de la démo (par exemple l'écart d'expertise de 15 % et 35 %, le silence d'un dossier à 8, 15 et 30 jours) ne sont reprises qu'en l'**absence** de données reprises.

### 4.4 Rôles, périmètres et séparation des tâches

#### FR-6 : Quatorze rôles, un périmètre par rôle

Les quatorze rôles du §2.1 existent dès l'installation. Chacun voit son périmètre, **appliqué par le serveur** : tous les dossiers (DG, DT, RESP, AUD en lecture seule) ; **son volet** (GEST : corporel, matériel ou risques divers) ; **les dossiers en recours** (GREC) ; **ses missions** (EXPI, EXPE) ; les recherches, le guichet et le statut des dossiers sans le contenu médical (ACC) ; les lots de numérisation (NUM) ; le fonds (ARCH) ; les ordres de règlement et les paiements (CPT). La table d'accès par écran et par droit est à l'annexe B. Une personne peut cumuler des rôles, sauf ceux que la séparation des tâches interdit (FR-7).

**Conséquences (testables) :**
- Un GEST du volet matériel qui interroge un dossier corporel reçoit « introuvable », sans donnée.
- EXPE ne voit que ses missions : ni la provision, ni les autres missions, ni le reste du dossier ; un test ouvre le portail avec un cabinet et vérifie chaque écran.
- Un filtre vide ne retombe jamais sur « tous les dossiers ».
- Les comptes sont créés par ADMIN ; les rôles qui instruisent, décident ou autorisent de l'argent (GEST, GREC, MED, RESP, DT, DG, CPT) ne sont actifs qu'après la validation d'un **rôle métier** (DG), jamais d'un second administrateur `[ASSUMPTION: règle reprise de la microfinance ; à confirmer à la séance d'immersion]` ; AUD lit le journal des créations et des retraits.
- **ADMIN ne lit aucune donnée métier par l'application** : un test ouvre chaque écran métier avec ce rôle et vérifie le refus. L'accès direct à la base sur un serveur que la compagnie administre elle-même reste un **risque résiduel assumé** : il est réduit par le chiffrement des champs sensibles (pièces d'identité, téléphones, données de santé) et par le journal chaîné (FR-13).
- Les rôles s'attribuent par les droits du contrat de module, sans déploiement (PRD-D FR-4).

#### FR-7 : Séparation des tâches

Une même personne ne peut pas cumuler, **sur un même dossier**, les actes suivants. Chaque cumul interdit est refusé par le serveur avec le code `SEPARATION_DES_TACHES` et un libellé clair.

- **SEP-01 : l'instructeur ne valide pas.** Le gestionnaire qui a instruit le dossier ne valide pas son évaluation ni son règlement, et ne siège pas pour le valider au comité.
- **SEP-02 : celui qui décide ne paie pas.** Celui qui valide un règlement ne l'émet pas, ne saisit pas son chèque et ne le remet pas ; le comptable n'a aucun droit de décision sur un règlement.
- **SEP-03 : délégation et anti-fractionnement.** Un montant se valide au niveau que la matrice de délégation lui fixe (FR-8) ; **le cumul des montants validés d'un même dossier décide du niveau**, de sorte qu'on ne contourne pas un seuil en fractionnant.

La liste complète des cumuls interdits, valable pour **tous** les moyens de paiement :

| # | Cumul interdit sur un même dossier | Règle |
|---|---|---|
| 1 | Instruire et valider | SEP-01 |
| 2 | Décider (valider) et émettre le règlement | SEP-02 |
| 3 | Émettre le règlement et le remettre au bénéficiaire | chaîne **ordre, chèque, remise** assurée par trois personnes différentes |
| 4 | Décider et remettre le chèque | SEP-02 |
| 5 | Émettre un règlement et en rapprocher le paiement | deux personnes `[ASSUMPTION: règle de contrôle interne ; à confirmer]` |
| 6 | Modifier les coordonnées bancaires d'un bénéficiaire et émettre le règlement à son profit | deux personnes `[ASSUMPTION: règle de contrôle interne, liée à l'alerte de changement de coordonnées avant paiement ; à confirmer]` |
| 7 | S'attribuer à soi-même un dossier | l'attribution est un acte du RESP |
| 8 | Ordonner une contre-expertise sans en avoir le droit | seuls RESP et DG l'ordonnent ; le gestionnaire ne peut pas |
| 9 | Juger la contestation d'un rapport en étant son auteur | le cabinet ou l'expert **auteur du rapport contesté** ne fait pas la contre-expertise ; l'expert interne ne reçoit pas une contre-expertise |
| 10 | Reconstituer un dossier et certifier sa reconstitution | la certifient DG, RESP ou AUD, **jamais celui qui l'a reconstitué** |
| 11 | Valider un dossier dont on est l'assuré, la victime ou le bénéficiaire | conflit d'intérêts `[ASSUMPTION: règle de prudence ; à confirmer]` |
| 12 | Verser au fonds sans être archiviste | seul ARCH verse au fonds |

**Conséquences (testables) :**
- Chaque ligne du tableau est un test : le serveur refuse l'acte du second rôle, avec le code `SEPARATION_DES_TACHES`.
- Un dossier dont le cumul des montants validés dépasse le seuil du niveau qui a validé les premiers est **remonté** au niveau supérieur ; un test fractionne un règlement en tranches chacune sous le seuil et vérifie la remontée.
- Un contrôle d'anomalie (plan de contrôle du contrôle interne, §6.7) recherche les cumuls qui auraient échappé : la tolérance est **zéro**, la gravité est **critique** pour SEP-01 et SEP-02.
- La personne qui s'absente peut **déléguer** (le DG pour le responsable, par exemple) par une **délégation explicite**, datée, motivée et tracée ; hors de ses dates, elle n'agit plus ; AUD la voit dans le journal.

#### FR-8 : La matrice de délégation est un paramètre

Qui valide quoi se lit dans une **matrice paramétrable** : niveau, rôles signataires, quorum, plage de montant, volet, nature (indemnité, honoraires, acompte, règlement à titre commercial). Les défauts, `[ASSUMPTION: délégations réelles à obtenir de la compagnie ; défauts repris de la procédure d'une compagnie du même groupe au Sénégal ; à confirmer à la séance d'immersion]`, sont : **jusqu'à 1 000 000 FCFA**, le responsable sinistres ; **au-delà de 1 000 000 FCFA**, le **comité sinistres** (quatre membres dont le responsable sinistres et le directeur technique ; quorum de trois), puis le **visa du directeur technique** ; un **règlement à titre commercial** (hors garantie) est décidé par le **DG seul**, quel que soit le montant. Le seuil unique de 2 000 000 FCFA de la démo n'est pas repris. Le détail du circuit de décision est au §5.

**Conséquences (testables) :**
- Changer le seuil, le quorum ou les membres du comité prend effet sur les **nouvelles** validations, pas sur celles déjà prises ; chaque changement est tracé (FR-4).
- Un montant au-dessus du seuil du responsable ne peut pas être validé par lui : le serveur refuse, la fiche part au comité.
- Un règlement à titre commercial refuse toute validation autre que celle du DG.
- Le quorum non atteint empêche la décision du comité ; un test valide avec deux membres sur quatre et vérifie le refus.

### 4.5 Les données de santé

#### FR-9 : Les données de santé sont des données sensibles

Un dossier corporel contient des **données de santé** : certificats médicaux, taux d'incapacité, rapports d'expertise médicale, pièces du médecin-conseil. Elles sont des **données sensibles** au sens de la loi togolaise n° 2019-014 (art. 21 : le traitement est interdit en principe, sauf les exceptions de l'art. 22, dont le consentement écrit, la défense d'un droit en justice, l'exécution du contrat ou une obligation légale). Prospera **étiquette** chaque champ et chaque pièce de santé et en restreint l'accès : elles sont **lisibles par MED, par le GEST corporel affecté au dossier et par RESP**, et par DG et DT **pour une décision** ; ACC **voit qu'une pièce médicale est reçue, jamais son contenu** ; **chaque lecture est journalisée** (art. 52 : traçabilité des personnes qui accèdent aux données lues). Aucune donnée de santé ne sort de la compagnie (FR-12, FR-232).

**Conséquences (testables) :**
- Un test ouvre une pièce médicale avec chaque rôle : MED, GEST corporel affecté, RESP, DG et DT (pour une décision) la lisent ; ACC, NUM, CPT, ARCH, AUD, ADMIN n'en voient que l'existence et la date ; un GEST d'un autre dossier n'y a aucun accès.
- Chaque lecture d'une donnée de santé crée une entrée du journal : qui, quand, quel dossier, quelle pièce (FR-13) ; AUD la lit.
- Le **consentement écrit** (ou l'autre base légale retenue) est tracé **par dossier** ; sans lui, la pièce médicale n'est pas versée au dossier et le motif est écrit `[ASSUMPTION: la base légale retenue par défaut est le consentement écrit ; à valider par le juriste, FR-24]`.
- Les champs et pièces de santé sont **chiffrés** au repos ; leur durée de conservation est une règle par catégorie (annexe D).
- Un cabinet d'expertise médicale externe ne reçoit que les pièces **nécessaires à sa mission** `[ASSUMPTION: règle de minimisation ; à confirmer à la séance d'immersion]`.
- Ce que le gestionnaire lit des travaux du médecin-conseil est limité par défaut aux **conclusions** nécessaires à l'évaluation, pas au dossier médical complet `[ASSUMPTION: règle du secret médical à confirmer par le médecin-conseil et le juriste]`.
- Le régime exact de formalité auprès de l'instance de protection des données (déclaration ou autorisation) pour les dossiers corporels est **à vérifier par le juriste** (FR-24).

### 4.6 L'IA dans le processus

#### FR-10 : L'IA est spécifiée ici, servie par l'IA commune

Les capacités d'IA font partie du produit de la compagnie, **sur tout le circuit, dès le premier jour** (décision du PO), **sauf la voix**. Chaque section de ce PRD les écrit comme des exigences : entrée, sortie, destinataire, garde-fou. Le **moteur** qui les sert est l'**IA commune**, une famille de modules à part, partagée par toutes les verticales (§7.4). Ce PRD dit **ce que l'IA fait pour la compagnie** ; l'IA commune dit **comment**. Les quatorze usages sont ceux de la proposition v2 ; trois capacités de la démo s'y ajoutent.

**Où est l'IA, et où elle est spécifiée :**

| # | Usage | Ce que l'IA fait (entrée, sortie, destinataire) | Spécifié en |
|---|---|---|---|
| 1 | **Déclaration assistée** | message **WhatsApp** ou **e-mail** de l'assuré (jamais l'appel) → fiche de déclaration pré-remplie, chaque champ avec sa confiance, questions à poser ; destinataire : ACC | §5.1 |
| 2 | **Lecture et classement des pièces** | pièce scannée ou téléversée, par **OCR réel** → type reconnu, données relevées avec l'extrait d'où chacune a été lue, rattachement à la pièce attendue ; destinataire : le déposant (ACC, NUM, GEST) | §6.2 |
| 3 | **Contrôle des pièces** | pièces du dossier → incohérences (propriétaire de la carte grise, dates, photo déjà utilisée ailleurs), signalées avant l'instruction ; destinataire : GEST | §5.4 |
| 4 | **Pièces manquantes et relances** | dossier → liste des pièces manquantes, relance rédigée pour le canal (SMS, WhatsApp, e-mail) ; destinataire : ACC, GEST | §5.2 |
| 5 | **Résumé sourcé du dossier** | dossier → résumé où chaque information renvoie à sa pièce d'origine ; destinataire : GEST, RESP | §6.1 |
| 6 | **Recherche en langage naturel** (texte) | question libre en français → réponse chiffrée et dossiers, sources citées ; lecture seule | §6.1 |
| 7 | **Pré-remplissage de l'instruction** | pièces reçues → valeurs du formulaire technique, avec la pièce source de chaque champ ; destinataire : GEST, qui relit | §5.4 |
| 8 | **Analyse des devis** | devis → surcoûts ligne par ligne (catalogue de pièces, main-d'œuvre, historique du garage) ; destinataire : GEST, DAF/RESP | §5.5 |
| 9 | **« Pourquoi ce montant ? »** | décompte → explication de la garantie, de la vétusté, de la franchise et des plafonds ; destinataire : GEST, RESP ; **en corporel, il restitue le calcul saisi par l'humain** (FR-11) | §5.6 |
| 10 | **Détection de fraude** | portefeuille → liens entre dossiers (témoins, garages, photos, téléphones), graphe affiché sur le dossier, avant paiement ; destinataire : le contrôle (revue humaine) | §5.12 |
| 11 | **Rédaction des courriers** | dossier → offre d'indemnité, refus motivé, réponse à une réclamation, relus puis signés par l'agent | §5.7 (offre), §5.12 (refus), §6.1 (réclamations) |
| 12 | **Recours** | offre de l'assureur adverse → appréciation et contre-proposition ; mise en demeure rédigée ; destinataire : GREC | §5.10 |
| 13 | **Brief du matin et veille** | portefeuille du rôle → dossiers à risque, délais qui expirent, anomalies de la nuit ; destinataire : DG, RESP | §6.7 |
| 14 | **Qualité du dossier et simulation « et si… »** | dossier → note de qualité ; paramètres → effet d'une décision sur la charge ; destinataire : direction, contrôle | §6.7 |
| + | **Orientation d'expertise assistée**, **complétude d'un rapport d'expert**, **comparaison au portefeuille** | dossier ou rapport → besoin d'expertise proposé (« à confirmer »), points manquants du rapport, écart au portefeuille ; destinataire : GEST | §5.5 |

**Ce que l'IA ne fait pas au premier jour (FR-22).** Toute **dictée, transcription d'appel ou synthèse vocale** : la « déclaration assistée » prend le texte de WhatsApp et de l'e-mail, pas la voix. Le **chatbot de l'assuré** est « bientôt » `[ASSUMPTION: la proposition v2 ne le prévoit pas, le deck du 12/09 oui ; à confirmer à la séance d'immersion]`.

**Règles communes à toutes ces capacités :**
- **Provenance** affichée sur chaque proposition : règle ou modèle, version, date de calcul, **source jusqu'à la pièce** (PRD-D FR-16). Le mot « IA » ne s'affiche que pour un **modèle** ; **tant qu'un modèle n'existe pas, la capacité est servie par des règles explicables et le dit**.
- **L'OCR des pièces scannées est réel au premier jour** : la démo ne lit que la couche texte des PDF et déclare « sans texte » un scan ; le produit lit le scan.
- Chaque capacité est **calibrée sur l'historique repris** de la compagnie (§7.4) ; avant calibrage, elle sert des règles et des valeurs par défaut.
- **L'IA propose, un humain décide** (FR-11).

**Conséquences (testables) :**
- Chaque ligne du tableau a au moins une exigence dans la section indiquée, avec ses entrées, sa sortie et son rôle destinataire.
- Chaque proposition affichée porte origine, version, date et source ; un test vérifie qu'aucune n'en manque.
- **Couper l'IA commune ne bloque aucun parcours** : UJ-3 va jusqu'à l'archive sans lecture, sans recommandation ni brief ; un test coupe l'instance locale et le vérifie (FR-12).
- Un test dépose un PDF scanné **sans couche texte** : l'application le lit, le classe et en extrait les données, au lieu de le déclarer illisible.
- Aucun écran de la compagnie ne propose de dictée, de transcription d'appel ni de synthèse vocale ; l'emplacement du chatbot de l'assuré s'affiche « bientôt ».
- Le rapport mensuel de performance de l'IA (§7.4) donne, par usage, la part des propositions acceptées, modifiées et rejetées.

#### FR-11 : Les garde-fous de l'IA

Les garde-fous de la proposition v2 sont tous exigés.

- **Aucune décision automatique.** L'IA extrait, analyse et recommande ; **valider, refuser ou payer reste toujours un acte humain** (loi n° 2019-014, art. 27 : aucune décision à effet juridique ne repose sur le seul traitement automatisé).
- **Aucune proposition de montant sur un préjudice corporel.** Ni le gestionnaire ni le médecin-conseil ne reçoivent de l'IA un montant, une fourchette, une médiane de comparables ou une offre suggérée sur un dossier corporel. Le calcul du barème corporel est un calcul poste par poste fait par un humain (§5.6).
- **Chaque information est sourcée** jusqu'à la pièce, au paragraphe ou au champ d'où elle vient ; une information sans source n'est pas affichée (« rien n'est inventé »).
- **L'IA n'est jamais bloquante** : si elle est coupée ou lente, son emplacement le dit et le circuit avance sur l'analyse humaine.
- **Un signal n'est pas une accusation** : un signal de fraude ouvre une **revue humaine** ; ce n'est pas l'IA qui bloque un paiement, c'est la règle de garde-fou (PRD-D FR-13) appliquée à la revue.
- **Un humain qui s'écarte d'une recommandation écrit un motif** ; l'écart et le motif sont enregistrés et renvoyés comme correction à l'apprentissage (FR-12).

**Conséquences (testables) :**
- Sur un dossier corporel, un test appelle chaque capacité d'estimation (comparables, « pourquoi ce montant », orientation, simulation) : aucune ne rend de montant proposé, de fourchette ni de médiane ; le serveur refuse la demande avec un code nommé.
- Aucune action de validation, de refus ou de paiement ne peut être déclenchée par l'IA : un test inspecte les droits du compte de service de l'IA et n'y trouve que la lecture et l'écriture de **propositions**.
- Une proposition sans source n'est pas affichée : un test supprime la source d'une proposition et vérifie qu'elle disparaît.
- Un test coupe l'IA en pleine instruction : le gestionnaire finit l'évaluation à la main, sans message d'erreur bloquant.
- Un refus de proposition (rejet) sans motif est refusé quand la proposition est une **recommandation** ; il peut être sans motif pour une **extraction**.

#### FR-12 : Le registre de l'IA et l'instance locale

Chaque action de l'IA est inscrite au **registre de l'IA** : **entrée, sortie, niveau de confiance, sources, niveau** (`EXTRACTION`, `ANALYSE` ou `RECOMMANDATION` ; le niveau « décision » n'existe pas), **statut** (`PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`) et **auteur de la décision**. L'agent accepte, modifie ou rejette ; le registre le garde. Le registre est lu par AUD et RESP. Chez la compagnie tourne une **instance locale** de l'IA commune, sur son serveur (§7.4) : elle prédit à partir des seules données de la compagnie, **enregistre l'écart** entre ses prédictions et ce qui arrive, **anonymise** ces écarts, et **reçoit ses mises à jour** par un tunnel sécurisé sortant. **Aucune donnée nominative et aucune donnée médicale ne sort de la compagnie.** L'IA **ne se met pas à jour seule** : une mise à jour est versionnée, essayée, retirable.

**Conséquences (testables) :**
- Aucune action de l'IA n'échappe au registre : un test compare le nombre de propositions affichées au nombre d'entrées du registre.
- Le niveau `DECISION` n'est jamais produit : un test le cherche dans le registre d'une installation de démonstration.
- Un test inspecte un envoi sortant vers l'IA commune et n'y trouve **aucun identifiant, aucun nom, aucun téléphone, aucune donnée de santé** ; un test sur une installation sans consentement (FR-19) ne trouve **aucun envoi**.
- Une mise à jour de modèle reçue est **versionnée**, essayée dans l'espace d'essai, puis promue à la date que la compagnie choisit, et **retirable** ; le modèle d'avant est conservé.
- Le registre est conservé **dix ans** comme le journal (FR-13).

### 4.7 La trace

#### FR-13 : Qui a fait quoi, qui a lu quoi, et quand

Chaque **changement** d'état d'un dossier, d'un règlement, d'un paramètre ou d'un droit, et **chaque consultation** d'un dossier ou d'une pièce, est inscrit au **journal**, **horodaté par le serveur**, **au nom de l'agent** (jamais un compte partagé), avec son rôle, l'état d'avant et d'après, et le **motif** quand il en faut un (tout refus, tout classement, toute décision sensible). Le journal ne peut pas être modifié par l'application ; il est **chaîné** (chaque entrée scelle la précédente) et conservé **au moins dix ans** (Code CIMA art. 404 : conservation de dix ans au moins des pièces justificatives et de la correspondance ; art. 406-407 : impossibilité d'insertions ou de suppressions ultérieures pour une comptabilité informatisée). Le journal des **consultations** est celui que la loi exige pour les données lues (loi n° 2019-014, art. 52).

**Conséquences (testables) :**
- L'historique d'un dossier se lit de bout en bout, dans l'ordre, sur une seule page, avec pour chaque ligne : le profil, le geste, l'avant et l'après, le motif.
- **100 %** des actions portent un auteur et un horodatage serveur ; **100 %** des refus et classements portent un motif : un test parcourt le journal d'une installation de démonstration.
- Aucune entrée du journal ne peut être modifiée ni supprimée par l'application, même par ADMIN ; une tentative est elle-même tracée. Le chaînage rend une modification directe en base **détectable** ; l'empreinte du journal est déposée régulièrement **hors du serveur** de la compagnie (défaut, annexe D `[ASSUMPTION: chaque jour ; modèle de la microfinance]`).
- La **consultation** d'un dossier et d'une pièce crée une entrée : qui, quand, quoi ; une consultation d'une donnée de santé est marquée comme telle (FR-9).
- AUD exporte le journal d'un dossier, d'un agent ou d'une période, sans reconstitution (UJ-7) ; **la piste d'audit** (qui a changé quoi) est lisible par AUD, RESP et DG ; le **journal des consultations** par AUD seul.
- Les versions successives d'un document sont conservées ; une pièce remplacée n'est jamais écrasée.
- Un agent sans aucune trace depuis un nombre de jours paramétrable est signalé à AUD (défaut, annexe D, valeur de la démo).

### 4.8 Les délais

#### FR-14 : Délais légaux et délais internes, séparés

Prospera tient **deux familles de délais, jamais mélangées**, chacune avec son **point de départ** et son **point d'arrêt** explicites.

**Les délais légaux** du corporel automobile, issus du Code CIMA (art. 231, 233 et 236, lus et sûrs) : l'offre d'indemnité est présentée dans les **12 mois** suivant l'accident ; en cas de décès, dans les **8 mois** suivant le décès ; l'offre peut être **provisionnelle** quand l'assureur n'a pas été informé de la consolidation dans les 6 mois de l'accident, et l'offre définitive doit alors suivre dans les 6 mois de l'information ; la victime peut saisir l'assureur d'une demande motivée, qui a 30 jours pour y répondre ; l'offre tardive ou le paiement tardif produit de plein droit un intérêt de **5 % par mois de retard**. Ces délais s'appliquent à l'atteinte à la personne causée par un véhicule terrestre à moteur ; **ils ne s'appliquent pas aux dommages aux biens** (art. 231, dernier alinéa). Ils sont des **alertes réglementaires**, **jamais modifiables par la compagnie**. Leurs **suspensions et prorogations** (assureur non avisé dans le mois, décès tardif, pièces demandées non reçues dans les 6 semaines, expertise médicale contestée, victime à l'étranger ; art. 247 à 253) sont **tracées** dans le dossier. La **base de calcul de la pénalité** (l'indemnité, le solde ou le montant offert) est un point d'interprétation **à faire valider par le juriste** (FR-24).

**Les délais internes** du matériel et des autres branches ne sont **pas fixés par le Code** : ils sont **contractuels ou internes**, paramétrés par produit. Les délais internes de la démo (accusé de réception ; offre depuis le dossier complet ; règlement après accord ; délai de traitement par volet) et les délais de la procédure de référence (offre validée envoyée sous 48 heures ; rapport d'expert sous 7 à 10 jours ; paiement sous 72 heures après accord ; relance du recours tous les 15 jours) sont les **valeurs par défaut** de ces délais internes (annexe D `[ASSUMPTION: délais d'une compagnie du même groupe au Sénégal en 2014 ; à confirmer pour la compagnie]`). Les délais du **fonds de garantie automobile** (par exemple la déclaration au fonds dans les 3 mois de la réclamation, art. 608) ne s'appliquent que **si un fonds existe au Togo** `[ASSUMPTION: existence non confirmée ; le paramètre « fonds actif » est désactivé par défaut ; à vérifier par le juriste]`.

Un dossier est **jugé selon le référentiel en vigueur à sa date de survenance** : le référentiel des délais légaux est **versionné** (date d'effet, source, validateur, statut), et un sinistre d'avant une nouvelle version garde l'ancienne.

**Conséquences (testables) :**
- Un dossier corporel porte un **chronomètre légal** : date d'accident, date de réception de l'avis, date du décès, date d'information de consolidation ; les échéances sont calculées (accident plus 12 mois, décès plus 8 mois, consolidation plus 6 mois, réponse à la demande motivée plus 30 jours) ; chaque échéance affiche son point de départ, son point d'arrêt et les jours restants.
- Une suspension ou une prorogation est **saisie avec son article et son motif** ; elle déplace l'échéance, et le déplacement est inscrit **au journal**, jamais silencieusement.
- Une échéance légale **proche** (défaut : 45 jours, valeur de la veille de la démo) alerte le gestionnaire et le responsable ; une échéance **dépassée** calcule la **pénalité de 5 % par mois** et la montre, avec la saisie du motif de réduction ou d'annulation « circonstances non imputables à l'assureur ».
- Un test change la valeur d'un délai interne (par exemple 60 à 40 jours) : l'alerte suit ; un test tente de changer le délai de 12 mois : le serveur refuse.
- Un test charge un sinistre de survenance ancienne : il est jugé selon la version de référentiel en vigueur **à sa date de survenance**, même si une version plus récente existe.
- Une **évaluation arrêtée n'est jamais recalculée** quand un barème change (le dossier garde les règles de son ouverture, FR-4).
- Le **dommage matériel** n'a aucun délai légal affiché ; son échéance est interne et s'affiche comme telle.
- La **prescription** (action dérivant du contrat : 2 ans, art. 28 ; action en responsabilité civile extra-contractuelle : 5 ans, art. 256) est suivie comme un **terme à vérifier**, avec alerte avant l'échéance, jamais comme une conclusion juridique.
- Les valeurs de délais du code de la démo ne sont reprises comme délais **légaux** que si elles sont lues dans le Code CIMA ; les autres sont des délais **internes**, ou **à vérifier par le juriste**.

### 4.9 Le jeu de démonstration

#### FR-15 : La compagnie de démonstration

La démo tourne sur une **compagnie fictive** branchée sur le **logiciel de compagnie fictif** (§6.6), comme l'IMF de la microfinance est branchée sur son cœur fictif (décision de cadrage D19). Elle compte **14 gestionnaires** (3 en corporel, 5 en matériel, 3 en risques divers, 3 en recours), un portefeuille d'environ **3 500 dossiers** sur **tous les statuts** (ordre de grandeur de la démo actuelle), les polices et garanties des **sept produits** de la démo, des experts (un expert interne en automobile, un médecin-conseil, des cabinets externes) et un personnel pour chacun des quatorze rôles. Les quatre scénarios `SIN-2026-9001` à `SIN-2026-9004` (accident avec blessé et deux expertises ; matériel avec contre-expertise ; gros incendie et règle de délégation ; accident mortel, archive et reconstitution) sont **rejouables**. Les noms, les chiffres et les dates sont **fictifs** : le jeu ne reprend aucun assuré réel, et les noms sont modifiables.

**Conséquences (testables) :**
- Le jeu couvre chacun des onze statuts et chacune des quatre sorties au moins dix fois `[ASSUMPTION: seuil de couverture repris de la microfinance]`, chaque volet, et chacun des sept produits ; les quatre scénarios repartent de l'état « déclaré » à chaque remise à zéro.
- Chacun des quatorze rôles a un compte de démonstration et ne voit que son périmètre (FR-6) ; l'effectif de 14 gestionnaires est un paramètre du jeu, pas une règle (§2.1).
- Les **104 vérifications** du second rejeu de la démo actuelle deviennent des **tests de recette** du vrai serveur ; la recette échoue si une seule d'entre elles échoue.
- La remise à zéro du jeu est une opération du **serveur**, propre à l'espace d'essai (la démo actuelle la fait navigateur par navigateur) `[ASSUMPTION: opération réservée à ADMIN dans l'espace d'essai ; à confirmer]`.

#### FR-16 : Dans la démo, on crée pour de vrai, rôle après rôle

Dans la démonstration, on peut **créer un vrai dossier** : déclarer un sinistre, recevoir sa référence `DEC-`, le numéro de sinistre renvoyé par le logiciel de compagnie fictif, puis le mener **à la main, rôle après rôle**, de la déclaration à l'archive, sur le modèle de `SIN-2026-9002` (UJ-3, UJ-9) : accueil, responsable, gestionnaire, experts, responsable ou comité, comptable, accueil pour la remise, archiviste. Le recours naît en parallèle (UJ-5).

**Conséquences (testables) :**
- Un dossier créé à la main traverse les huit phases et les onze statuts du chemin nominal, jusqu'à `CLOTURE` puis au versement au fonds, **sans intervention de Money Vibes**.
- Les **refus** du circuit se provoquent à la main : ouvrir sans les pièces, s'attribuer un dossier, ordonner une contre-expertise sans en avoir le droit, valider son propre dossier, émettre un règlement sans l'avoir décidé, remettre un chèque sans pièce d'identité, verser au fonds sans être archiviste ; chacun est refusé par le serveur (FR-7) avec son libellé.
- Un dossier créé apparaît sans autre manipulation dans les corbeilles des rôles concernés, dans le tableau de bord de la direction et dans le journal (FR-13).
- Aucun écran du parcours n'est simulé : un test rejoue le parcours avec le logiciel de compagnie fictif **coupé** pour la liste « à saisir » (FR-2), puis **rebranché** pour le rattachement du numéro.

#### FR-17 : Un jeu cohérent au franc près

Les chiffres du jeu se recoupent. La somme des provisions des dossiers donne l'état des provisions ; pour un dossier, le **validé** moins le **payé** donne le **reste à payer** ; chaque décompte se recalcule depuis ses conditions ; **un même chiffre est le même sur tous les écrans** ; l'analyse d'un dossier **ne change pas entre deux consultations**. Les chiffres de la démo actuelle ne concordent pas toujours (un nombre de devis comparables différent d'un écran à l'autre, un poste critiqué tiré au sort à chaque affichage) : ils ne sont pas repris.

**Conséquences (testables) :**
- Un test recalcule chaque indicateur du tableau de bord de la direction depuis les données brutes et trouve le même nombre.
- Pour chaque dossier du jeu, évalué, proposé, validé, payé et reste à payer vérifient leurs relations (le reste à payer est le validé moins le payé ; il est zéro au statut `REGLE`) ; **la provision n'est confondue avec aucun des cinq** (§3).
- L'état des provisions respecte brut égal cédé plus net, pour chaque dossier et pour le total, au franc près.
- Aucun indicateur du jeu n'est une constante (PRD-D FR-15) ; la fraîcheur de chaque chiffre est affichée.
- Deux consultations successives de la même analyse d'un dossier rendent le même résultat tant que le dossier n'a pas changé.

### 4.10 Messages, données personnelles et consentements

#### FR-18 : Les messages passent par `notification`

Tout message (cloche et e-mail pour le personnel ; **SMS, WhatsApp et e-mail pour l'assuré et les tiers**) passe par le module `notification` ; aucun module n'envoie lui-même (§7.2). **L'assuré est prévenu à chaque étape qui le concerne** : accusé de déclaration (avec la référence `DEC-`), liste des pièces manquantes, dossier ouvert, numéro de sinistre officiel reçu, convocation à une expertise, offre envoyée, accord enregistré, chèque prêt à retirer et rappel s'il n'est pas retiré, règlement effectué, clôture. Le **courtier** et les **coassureurs** sont informés à l'ouverture. Le français est la langue par défaut ; l'anglais est « bientôt » (FR-22).

**Conséquences (testables) :**
- Chaque message envoyé est consultable : destinataire, canal, contenu, date, statut de remise ; le message d'une étape est rattaché à l'étape du dossier.
- Un test fait passer un dossier du statut « déclaré » à « clôturé » et vérifie, étape par étape, le message de l'assuré prévu à la matrice « qui est prévenu de quoi » (annexe B).
- Un assuré qui refuse un canal ne reçoit plus de message sur ce canal ; un message de service n'est jamais une prospection (loi n° 2019-014, art. 26 : la prospection directe exige un consentement préalable) ; Prospera n'envoie **aucune prospection**.
- Les comptes SMS et le numéro WhatsApp Business sont **ceux de la compagnie** et à sa charge `[ASSUMPTION: la proposition v2 prévoit des comptes SMS fournis par la compagnie ; la v4 prévoit WhatsApp « si retenu » ; à confirmer à la séance d'immersion]`.

#### FR-19 : Données personnelles et consentements

Les données du sinistre sont des données personnelles. La compagnie est **responsable du traitement** ; Money Vibes n'est sous-traitant que pour ce qui passe par ses relais (§7.5). Le consentement est recueilli **par finalité**, tracé **par dossier** : traitement du sinistre, **données de santé** (consentement écrit, FR-9), messages à l'assuré par canal, **envoi à l'IA commune d'écarts anonymisés** (consentement de la compagnie, §7.4). Les données restent sur les serveurs de la compagnie (§7.5) ; **tout transfert hors de la compagnie** (relais, tunnel de l'IA commune, support) est inscrit à un **registre des transferts**. La loi lue ne contient pas d'obligation de localiser les dossiers au Togo ; elle encadre les transferts vers un pays tiers (art. 28 à 31), ce qui est **à faire vérifier par le juriste** (FR-24).

**Conséquences (testables) :**
- Une donnée n'est utilisée que pour une finalité consentie ; un test retire un consentement (canal de messages, par exemple) et vérifie l'arrêt de l'usage.
- Le registre des transferts liste chaque destination sortante (relais, tunnel de l'IA commune, support), son contenu, son sous-traitant et sa date de mise en service.
- L'**effacement** d'une donnée sous **conservation** (FR-21, FR-236) est refusé avec un code nommé ; l'effacement d'une donnée hors conservation est tracé avec un certificat.
- La **durée de conservation** de dix ans (Code CIMA art. 404) et le principe de conservation limitée de la loi sur les données personnelles (art. 53) doivent être conciliés ; le **point de départ** de la durée (la clôture du dossier ?) est **à faire préciser par le juriste** (FR-24).
- Les droits des personnes (accès, rectification, opposition) sont servis par un écran du responsable ; leur régime exact est **à vérifier par le juriste** `[ASSUMPTION: les articles de droits de la loi n'ont pas été relus ; à vérifier]`.

### 4.11 Modules installables

#### FR-20 : Les modules de la compagnie s'installent un par un

Chaque module de ce PRD respecte le contrat de module (C1 à C13 ; annexe A) : il s'installe seul, déclare ses dépendances, et affiche un emplacement vide quand une dépendance facultative manque. Les modules propres à l'assurance sont : `sinistres` (M05), `ged` (M07), `expertises` (M29), `assurance` (M30, M31), `liaison-assureur` (M48 `[ASSUMPTION: code et numéro proposés ; à valider avec le contrat de module]`), `assureur-fictif` (démo seulement) et `reprise` (M44). Les modules partagés sont : `paiement` (M33), `notification` (M34), `dashboard` (M28), `reseau` (M01), l'IA commune et `connecteurs` (M43) (§7). Le paquet de la compagnie installe au moins `sinistres`, `ged`, `expertises`, `assurance`, `liaison-assureur`, `paiement`, `notification` et leurs dépendances.

**Conséquences (testables) :**
- Le parcours UJ-3 marche avec ces seuls modules et le socle ; sans `reprise`, sans `dashboard` et sans IA commune, le circuit va quand même jusqu'à l'archive.
- Chaque emplacement vide a un test ; l'emplacement d'un module absent le dit.
- `assureur-fictif` n'est jamais installé en production réelle (annexe A).
- Le contrat de module est **la seule façon** d'installer ou de retirer un module (PRD moteur d'installation).

### 4.12 Le double support, et ce qui n'est pas encore là

#### FR-21 : Le papier reste tenu, le numérique sert

Le dossier existe **en deux supports** : le **numérique**, qui sert au travail, et le **papier**, qui reste tenu (décision du PO : le scan du stock papier n'est pas la voie de reprise, le dossier papier se tient en parallèle). Chaque dossier porte sa **cote physique** (boîte, rang, chemise de couleur par branche), sa **sortie** et sa **restitution** (défaut : 15 jours). Les nouvelles pièces sont **scannées ou téléversées** au guichet ou par NUM, avec un **contrôle avant archivage**. La **valeur juridique de chaque pièce** est notée (original irremplaçable, original rééditable, copie) ; **les originaux irremplaçables** (acte de décès, jugement d'hérédité, procès-verbal) **restent conservés en papier** tant que le juriste n'a pas confirmé la valeur probante de la copie numérisée (FR-24). Le dossier est conservé **dix ans au moins** (Code CIMA art. 404) ; les durées par nature de dossier sont des paramètres (annexe D) ; **la destruction est une décision visée et tracée, jamais un défaut**.

**Conséquences (testables) :**
- Un dossier versé au fonds porte son numéro d'archivage `ARC-…` et sa cote physique ; chaque sortie du papier est datée, attribuée et suivie d'une restitution ; une chemise sortie depuis plus de 15 jours est signalée.
- Une pièce porte sa valeur juridique ; un test tente de marquer « destructible » une pièce irremplaçable : refusé.
- Aucune destruction n'est lancée sans visa : un test cherche une destruction automatique dans le journal.
- Un dossier versé au fonds n'est plus versable ; un dossier **non clos** ne se verse pas.
- Un export d'archive se fait sur un support de la compagnie, avec une somme de contrôle (§7.5).
- Le détail de la numérisation, de l'OCR et du fonds est au §6.2.

#### FR-22 : « Bientôt » n'est jamais simulé

Une capacité qui n'est pas livrée au premier jour s'affiche **« bientôt »**, sans date (PRD-D FR-2) ; elle n'imite jamais un effet. Sont « bientôt » : le **chatbot de l'assuré** (assistant conversationnel, aide à la déclaration, état d'avancement, téléversement depuis la conversation) ; **toute fonction vocale** (dictée, transcription d'appel, synthèse vocale) ; l'**anglais** ; la **signature électronique** des offres et des transactions (à n'activer qu'après la validation du juriste, FR-24 ; la signature manuscrite scannée ou la remise en main propre avec décharge restent possibles) ; le **connecteur nommé** du logiciel de la compagnie et le module `connecteurs` (§7.6).

**Conséquences (testables) :**
- Chaque emplacement « bientôt » de la liste est un bouton qui explique, sans date, ce qu'il fera ; un test parcourt les écrans et n'en trouve aucun qui promette une date ou simule un effet.
- Aucun écran n'affiche une transcription d'appel ni une réponse d'assistant d'assuré : la transcription factice de la démo actuelle (un texte fixe dont seul le nom du fichier change) n'est pas reprise.
- Ne sont jamais « bientôt » : la déclaration, tout le circuit jusqu'au chèque, l'OCR des scans, et les quatorze usages de l'IA sauf la voix (FR-10).

### 4.13 Volumes et performance

#### FR-23 : Une hypothèse de dimensionnement, à remplacer par les vrais volumes

Les volumes de la compagnie sont **inconnus** : ni la proposition v2, ni le deck, ni l'offre v4 n'en donnent un seul. Le PRD pose une **hypothèse de dimensionnement**, à remplacer par les vrais volumes dès qu'ils sont connus : `[ASSUMPTION: 5 000 sinistres par an, 50 000 dossiers archivés, 1,5 million de pages, 60 utilisateurs simultanés, un site central et des guichets ; à remplacer par les volumes réels de la compagnie (stock en cours, archives, dossiers par an), à demander avant la séance d'immersion]`. **La recherche d'un dossier rend son résultat en moins de 5 secondes au 95e centile** sur le volume repris ; moins de 1 seconde est visé `[ASSUMPTION: cible de 1 s reprise du deck du 12/09 ; la v2 dit « quelques secondes »]`.

**Conséquences (testables) :**
- Un jeu au volume de l'hypothèse (50 000 dossiers archivés, 1,5 million de pages) est chargé sur une installation de référence ; la recherche par nom, par police, par numéro de sinistre, par immatriculation ou par numéro d'archivage rend son résultat en moins de 5 secondes au 95e centile ; un test mesure chaque critère.
- Les chiffres de la configuration minimale du serveur viennent de ce test ; une installation sous la configuration minimale est refusée (PRD moteur d'installation).
- Les volumes réels remplacent l'hypothèse **sans changer le code** : ils sont dans l'annexe D.
- Au-delà du volume testé, la compagnie est prévenue ; une instance est un serveur applicatif et un NAS, sans haute disponibilité en v1 (PRD moteur d'installation).

### 4.14 La revue juridique

#### FR-24 : Revue juridique obligatoire avant la mise en service

Comme pour l'IMF, une **revue juridique est obligatoire avant la mise en service** (décision de cadrage D21). Elle porte sur : les **délais CIMA** (version à jour du Code, suspensions, base de la pénalité de 5 % par mois) ; le **barème corporel** (art. 257 à 266 ; SMIG, sens du SMIG « annuel ») ; l'existence et le régime du **fonds de garantie automobile** au Togo ; les **conventions inter-compagnies** et le recours (existence d'une convention d'indemnisation directe, rôle de l'association des assureurs, constat amiable, règles sur les experts automobiles) ; les **données de santé** (loi n° 2019-014 : consentement écrit, formalité auprès de l'instance de protection des données, transferts) ; la **valeur probante de la copie numérisée** et la signature électronique (loi sur les transactions électroniques de 2017, **non lue** à cette date) ; la **LBC/FT** (loi uniforme et loi nationale, seuils, traitement du Mobile Money) ; la **conservation** (point de départ de la durée de dix ans) ; les circulaires de la CRCA sur les provisions et les états. Les **tables du barème corporel** (valeur du point d'incapacité permanente, capitalisation, barème médical, barème de responsabilité) sont des **images** dans le PDF officiel : leur **saisie** est une **tâche du plan**, pas une hypothèse.

**Conséquences (testables) :**
- Chaque point de cette revue est une ligne du registre des points juridiques (§12) avec son propriétaire, sa date et son issue ; la mise en service est **bloquée** tant qu'une ligne obligatoire est ouverte.
- Tout texte réglementaire cité dans le PRD est soit **lu et sûr** (numéro d'article donné), soit marqué **à vérifier par le juriste** ; aucun texte non vérifié n'est cité avec un numéro.
- Un référentiel (délais, barèmes) ne devient « en vigueur » qu'après un **validateur** nommé (FR-14).
- Les tables du barème corporel saisies sont relues une à une par un second agent avant mise en service.

### 4.15 L'accès

#### FR-25 : Authentification, sessions et double authentification

Les comptes sont authentifiés par le **serveur** (la démo actuelle a un mot de passe unique et un cookie contenant l'identifiant). La **double authentification est obligatoire** pour DG, DT, RESP, CPT, AUD et ADMIN ; une session dure 8 heures au plus et se ferme après 30 minutes d'inactivité (paramètres) `[ASSUMPTION: valeurs reprises de la microfinance ; à confirmer à la séance d'immersion]`. Les comptes des cabinets d'expertise externes sont **séparés** et n'ouvrent que le portail expert.

**Conséquences (testables) :**
- Aucun compte de démonstration n'a de mot de passe commun ; l'espace d'essai a ses propres comptes (FR-15).
- Un test ouvre une session de 8 heures et une session inactive : elles se ferment.
- Le compte d'un cabinet ne peut ouvrir aucun écran hors du portail expert (FR-6).
- Les comptes de Money Vibes sont **fermés par défaut** sur l'installation de la compagnie (§7.5).

---


---

## 5. Partie 2 — Le circuit sinistre de bout en bout (`sinistres`, M05) ★

Cette partie décrit le circuit du dossier sinistre, **de la déclaration à l'offre** (§5.0 à §5.7). Elle est la pièce centrale du PRD : tout le reste (pièces, expertises, états, paiement) s'y accroche. La suite du circuit (paiement, clôture, recours, sorties, états) est en §5.8 à §5.15.

Un mot sur les sources. Le **récit du PO** fait foi pour la forme du circuit (8 phases, 11 statuts, 4 sorties, recours en parallèle). Le **code de la démo** fait foi pour les règles fines (il est en avance sur sa propre spécification). La **réglementation** (Code CIMA, édition 2019) l'emporte sur tout pour les obligations légales ; seuls les articles lus sont cités. Les valeurs de la démo (seuils, délais, grilles) sont reprises comme **valeurs par défaut paramétrables** : la compagnie les confirmera à la séance d'immersion.

### 5.0 Vue d'ensemble

#### FR-30 : Le dossier avance par 8 phases et 11 statuts, et chaque pas est gardé

Un dossier sinistre n'a qu'un statut à la fois, parmi onze. Il passe d'un statut à l'autre par une **transition** nommée. Chaque transition porte : le **droit** qu'il faut détenir, les **conditions** à remplir, et un **motif écrit** quand elle refuse, classe ou renvoie. L'écran affiche aussi les actions **fermées**, avec la raison du blocage dite en clair (« vous ne pouvez pas évaluer : il manque le rapport de police »). Rien ne s'enregistre contre ces règles : le serveur revérifie droit, conditions et motif, quel que soit l'écran qui appelle. Un statut non terminal n'est jamais une impasse : toute transition de sortie existe, et un test le vérifie. La table complète des transitions est en §5.8 (W3) ; ce paragraphe fixe le cadre.

| Phase | Statut(s) | Qui | Ce qui se passe | Ce qui bloque |
|---|---|---|---|---|
| 1. Déclarer | `DECLARE` | `ACC`, `GEST`, `RESP` ; l'assuré ou le courtier par le canal ouvert | La déclaration est enregistrée, la référence `DEC-` est remise, le numéro officiel est demandé au logiciel de la compagnie (LC) | Rien : une déclaration s'enregistre toujours (FR-39) |
| 2. Ouvrir | `PIECES_ATTENDUES`, `OUVERT` | `ACC`, `GEST`, `RESP` | Recevabilité en 4 questions ; pièces ; accusé de réception ; provision d'ouverture | Contrat non valide ; garantie non décidée ; pièces obligatoires manquantes (le dossier s'ouvre alors « en attente de pièces ») |
| 3. Attribuer | `OUVERT` + gestionnaire | `RESP` seul | Le responsable désigne qui instruit | Dossier non affecté : l'instruction ne démarre pas |
| 4. Instruire | `EN_INSTRUCTION` | `GEST` du volet | Pièces, responsabilité, expertises ou accord sur devis, recours détecté | Pièces complémentaires demandées ; signal de fraude bloquant (§5.12) |
| 5. Chiffrer | `EVALUE` | `GEST` | Le décompte, poste par poste ; la provision est revue | Pièces incomplètes ; expertise non close ; garantie non décidée ; montant nul |
| 6. Décider | `EN_VALIDATION`, `OFFRE_ENVOYEE` | Selon la délégation ; l'agent signe l'offre | Validation, puis offre envoyée à l'assuré sous 48 h, puis accord enregistré | Délégation insuffisante ; séparation des tâches ; accord non enregistré |
| 7. Payer | `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE` | `CPT` émet ; `ACC` remet | Ordre de règlement, quittance, remise contre pièce d'identité (§5.8) | Aucun ordre sans accord enregistré |
| 8. Clore | `CLOTURE` | `GEST`, `RESP` | Solde à zéro, motif écrit, versement aux archives (§5.9) | Reste à payer non nul ; motif absent |

**Conséquences (testables) :**
- Un dossier n'a jamais deux statuts ; l'historique de ses statuts est conservé avec auteur, date et heure, et motif.
- Une transition tentée sans le droit requis est refusée avec le code `DROIT_INSUFFISANT` ; sans une condition, avec le code de la condition (par exemple `PIECES_OBLIGATOIRES_MANQUANTES`) ; sans motif exigé, avec `MOTIF_OBLIGATOIRE`.
- L'écran d'un dossier liste les actions fermées avec leur raison ; la raison affichée est celle que le serveur renverrait si l'action était tentée.
- Un appel direct au serveur qui contourne l'écran reçoit le même refus que l'écran (test de recette sur chaque transition).
- Aucun statut non terminal (hors statuts de sortie) ne reste sans transition sortante.

#### FR-31 : Quatre sorties du circuit, chacune avec un motif

Le circuit a quatre sorties latérales : `REJETE` (refus de prise en charge notifié), `SANS_SUITE` (classement, par exemple assuré injoignable), `LITIGE` (offre refusée, contre-expertise, contentieux) et `FRAUDE_SUSPECTEE` (revue humaine ouverte). Toute sortie exige un **motif écrit**. `REJETE` et `CLOTURE` se rouvrent par une décision motivée du `RESP` ou du `DG`. Le détail de `LITIGE` et de `FRAUDE_SUSPECTEE` est en §5.12 (W3) ; celui du refus de prise en charge en FR-42.

**Conséquences (testables) :**
- Passer en `REJETE`, `SANS_SUITE`, `LITIGE` ou `FRAUDE_SUSPECTEE` sans motif est refusé (`MOTIF_OBLIGATOIRE`).
- Un dossier rouvert garde tout son historique, la réouverture est une ligne du journal avec son motif, et la date de clôture est effacée.
- Un dossier `REJETE` ou `SANS_SUITE` ne porte aucun ordre de règlement en cours : le reste à payer passe à zéro.
- Les quatre sorties se retrouvent dans les états de pilotage avec leur motif (§5.14).

#### FR-32 : Le recours est un suivi parallèle, pas un statut du dossier

Le **recours** contre un tiers responsable suit son propre chemin, en parallèle du dossier, de l'ouverture jusqu'au remboursement. Il ne fait plus sortir le dossier du circuit (écart avec la démo, où « passer en recours » sortait le dossier). Le dossier peut être clos pendant que son recours continue. Le recours a sa propre machine d'états et se clôt seul : tout est en §5.10 (W3). Dans ce chapitre, le circuit fait trois choses seulement : détecter le recours à l'ouverture (FR-54), exiger la preuve de la faute du tiers, et transmettre au pôle recours.

**Conséquences (testables) :**
- Le statut d'un dossier ne contient jamais « recours » ; le recours est visible sur le dossier par un indicateur et un lien.
- Clore le dossier n'est pas bloqué par un recours en cours ; clore le recours ne rouvre pas le dossier.
- La création du recours depuis le dossier ne change ni son statut, ni son gestionnaire, ni son volet.

#### FR-33 : Quatre règles tiennent tout le circuit

Quatre règles valent partout, sans exception ni écran qui les contourne. Elles sont chacune testée.

1. **Celui qui décide ne paie pas.** Qui instruit ne valide pas son propre dossier ; qui valide l'indemnité n'émet pas le règlement (codes `SEPARATION_DES_TACHES`, FR-81).
2. **Chaque refus ou classement porte un motif.** Refus de garantie, rejet, classement sans suite, renvoi en instruction, contre-proposition, passage outre : le motif est écrit et conservé.
3. **Chaque action est horodatée** et attribuée à un utilisateur identifié, avec son rôle (qui, quoi, quand, sur quelle pièce). Le journal ne s'efface pas et ne se modifie pas.
4. **Une évaluation déjà arrêtée n'est pas recalculée** quand le barème change (FR-75).

**Conséquences (testables) :**
- Pour chaque règle, un test tente de la violer par chaque rôle et par appel direct, et obtient le refus attendu.
- Les quatre règles se retrouvent dans la matrice d'accès (annexe B) et dans les contrôles du contrôle interne (`AUD`, §5.12).

### 5.1 Déclarer (`DECLARE`)

#### FR-34 : Le sinistre se déclare par quatre canaux, avec un mode de saisie commun

Un sinistre se déclare **au guichet**, **au téléphone**, **par WhatsApp ou par e-mail**, ou **par un courtier**. Les quatre canaux aboutissent au même formulaire de déclaration. Au téléphone, l'agent de l'accueil saisit la déclaration pendant l'appel : **aucun appel n'est enregistré ni transcrit** (la voix est hors périmètre, FR-35). Le canal d'origine est conservé sur le dossier. La déclaration d'un courtier est reçue comme celle de l'assuré, avec le courtier identifié. Prospera sert **à consulter et à déclarer** dès le premier jour : l'assuré voit l'avancement par la compagnie, il ne modifie jamais son dossier directement `[ASSUMPTION: pas de portail assuré en libre-service au premier jour ; le chatbot de l'assuré est « bientôt » ; à confirmer à la séance d'immersion]`.

**Conséquences (testables) :**
- Le formulaire de déclaration contient au minimum : police, assuré, victime, téléphone, type de sinistre, date et heure de survenance, lieu, circonstances, tiers impliqué, estimation du déclarant (facultative), canal.
- Le canal prend les valeurs `GUICHET`, `TELEPHONE`, `WHATSAPP`, `EMAIL`, `COURTIER` (et `COURRIER` pour une déclaration reçue sur papier) ; il est obligatoire.
- Une déclaration par courtier porte l'identifiant du courtier, repris du logiciel de la compagnie ; un courtier inconnu est enregistré « à rattacher » sans bloquer la saisie.
- La **confirmation écrite** d'une déclaration verbale est demandée à l'assuré (pièce « déclaration signée ») ; son absence ne bloque pas la déclaration mais bloque l'évaluation (FR-44).
- Une déclaration saisie après coup porte deux dates : celle de la réception réelle et celle de la saisie ; un écart de plus de 1 jour ouvré est signalé au `RESP` `[ASSUMPTION: seuil de 1 jour ouvré]` (le mémoire de 2014 relève des enregistrements faits 3 à 4 jours après réception).

#### FR-35 : Déclaration assistée par l'IA depuis un message WhatsApp ou un e-mail (usage n°1)

Quand un assuré ou un courtier écrit sa déclaration (message WhatsApp, e-mail, courrier numérisé), l'agent d'accueil peut demander à l'IA commune de **pré-remplir la fiche de déclaration**.

- **Entrée :** le texte du message (et le numéro ou l'adresse d'origine). **Texte seulement** : aucun fichier audio, aucune transcription d'appel, aucune dictée ; un vocal reçu est rangé comme pièce, non lu.
- **Sortie :** les champs de la fiche proposés, **chacun avec sa confiance** et l'extrait du message d'où il vient ; la police retrouvée par numéro de police, immatriculation ou téléphone ; le type et la gravité probables ; la date (y compris « hier », « avant-hier ») ; une liste de **questions à poser** à l'assuré et d'**alertes** (police inconnue, type incertain).
- **Destinataire :** l'agent d'accueil, qui relit et applique.
- **Garde-fou :** **rien n'est enregistré sans l'action de l'agent** ; la police inconnue ou le type incertain génèrent des questions, jamais une valeur inventée ; chaque champ renvoie à sa source ; la proposition, son acceptation, sa modification ou son rejet vont au registre de l'IA. Si l'IA est coupée ou indisponible, la déclaration se saisit à la main sans autre changement.
- Servi par l'**IA commune** (instance locale chez la compagnie : aucune donnée nominative ne sort). Tant qu'aucun modèle n'est installé, la capacité est servie par des **règles explicables** (mots-clés, formats de numéros) et l'écran le dit : il n'affiche pas le mot « IA ».

**Conséquences (testables) :**
- Un message contenant un numéro de police valide donne la police avec une confiance affichée et l'extrait source ; un numéro inconnu donne une question, pas une police.
- Appliquer la proposition crée un brouillon de déclaration ; sans clic d'application, aucun dossier n'est créé.
- Un message audio ou un appel n'est jamais envoyé à l'IA ; l'écran propose de le ranger comme pièce.
- Chaque usage laisse une ligne au registre de l'IA : entrée, sortie, confiance, sources, niveau `EXTRACTION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`, auteur de la décision.
- Avec l'IA coupée, la même déclaration se saisit et se valide sans erreur.

#### FR-36 : Une référence de déclaration immédiate et un accusé de déclaration

À l'enregistrement, la déclaration reçoit **tout de suite** une **référence de déclaration** `DEC-AAAA-NNNNN` (année de la déclaration, séquence sans trou ni réutilisation). Cette référence est remise à l'assuré sur un **accusé de déclaration** (papier au guichet, message ou e-mail sinon), qui rappelle : le canal, la date et l'heure, un résumé de ce qui a été déclaré, la liste des pièces à fournir (FR-46) et le contact du service. La référence reste un critère de recherche une fois le numéro officiel connu (FR-37).

**Conséquences (testables) :**
- Deux déclarations enregistrées au même instant reçoivent deux références différentes ; une référence n'est jamais réattribuée, même après rejet ou annulation d'une saisie.
- L'accusé de déclaration est généré à l'enregistrement et classé au dossier ; son envoi (canal, date, heure) est journalisé.
- Rechercher `DEC-…` retrouve le dossier en moins de 5 secondes (recherche, §6.1).
- Un trou dans la séquence des références est détectable par le contrôle interne (contrôle de séquence recommandé par l'audit de 2014).

#### FR-37 : Le numéro de sinistre officiel vient du logiciel de la compagnie

La déclaration part vers le **logiciel de la compagnie** (LC) par le contrat d'échange (annexe C), qui renvoie le **numéro de sinistre officiel**. Prospera rattache ce numéro au dossier, et **c'est lui qui s'affiche partout** ensuite ; la référence `DEC-` reste cherchable. Si le LC ne sait pas recevoir une déclaration (pas d'interface, interface en panne), le dossier entre dans une liste **« à saisir dans le logiciel de la compagnie »** : un agent y saisit la déclaration, puis **reporte le numéro obtenu** dans Prospera. Un dossier sans numéro officiel depuis plus de **1 jour ouvré** est une **alerte** au `RESP`. Un paramètre **« qui attribue le numéro »** (LC ou Prospera) existe pour permettre un basculement plus tard, sans reprise du code `[ASSUMPTION: le LC attribue le numéro au démarrage, comme l'a dit le PO « pour un début » ; Prospera ne génère un numéro officiel que si la compagnie bascule le paramètre]`.

**Conséquences (testables) :**
- Avec un LC joignable, le numéro officiel reçu apparaît sur le dossier et dans les listes ; la référence `DEC-` n'y figure plus qu'en second.
- Avec un LC injoignable, le dossier figure dans la liste « à saisir », sans numéro officiel, et n'est pas bloqué dans le circuit ; le report du numéro retire le dossier de la liste et journalise qui l'a reporté et quand.
- Un numéro reporté déjà porté par un autre dossier est refusé (`NUMERO_OFFICIEL_DEJA_ATTRIBUE`).
- Un dossier sans numéro officiel depuis plus de 1 jour ouvré (paramètre `delai_alerte_numero_officiel_jours_ouvres`) apparaît dans les alertes du `RESP` avec son ancienneté.
- Le basculement du paramètre « qui attribue le numéro » à « Prospera » n'exige aucune modification des dossiers existants.

#### FR-38 : Le doublon se contrôle à la déclaration, dans Prospera et dans le LC

À l'enregistrement, Prospera cherche une déclaration déjà faite pour le même sinistre : même **police**, même **date de survenance**, même **immatriculation** (si véhicule) et même **victime**, parmi les dossiers de Prospera **et** parmi les sinistres reçus du LC. Un doublon probable est **signalé** à l'agent avec le dossier trouvé ; l'agent choisit : rattacher la déclaration au dossier existant, ou la garder comme nouvelle avec un motif.

**Conséquences (testables) :**
- Une seconde déclaration avec les quatre mêmes valeurs affiche le dossier existant avant l'enregistrement.
- Garder la déclaration comme nouvelle sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; le motif est conservé.
- Un sinistre déjà connu du LC mais absent de Prospera est trouvé par le contrôle (test avec un sinistre fourni par le logiciel de compagnie fictif).
- Un doublon n'empêche jamais l'enregistrement : il oblige seulement l'agent à choisir en connaissance de cause (FR-39).

#### FR-39 : Une déclaration s'enregistre toujours ; les contrôles donnent des réserves

La déclaration ne se refuse **jamais** pour une raison de contrôle : police inconnue, police suspendue, garantie non souscrite, déclaration tardive, doublon, estimation incohérente. Chaque contrôle produit une **réserve** ou une **alerte** visible sur le dossier, jamais un blocage de la saisie. Cette règle corrige un défaut du mémoire de 2014 (déclarations enregistrées 3 à 4 jours après réception) et vient du code de la démo, qui avait corrigé un dossier déclaré le soir et resté sans gestionnaire, sans provision et sans délai. Le dossier né de la déclaration reçoit tout de suite : une référence, le statut `DECLARE`, des échéances calculées, et son entrée dans la file de l'accueil.

**Conséquences (testables) :**
- Une déclaration sur une police absente de la projection du LC s'enregistre avec la réserve « police non retrouvée » et la date de dernière lecture des contrats.
- Une déclaration sur une police suspendue, résiliée ou expirée s'enregistre ; la réserve est portée au dossier et traitée à l'ouverture (FR-41).
- Aucun des contrôles de ce paragraphe ne refuse l'enregistrement ni ne change le statut `DECLARE`.
- Le dossier `DECLARE` apparaît dans la file de l'accueil dès l'enregistrement, avec son âge.

#### FR-40 : Urgence corporelle et responsabilité initiale

À la déclaration, le dossier reçoit deux marques provisoires. L'**urgence corporelle** est posée quand le sinistre est un accident corporel automobile ou un accident du travail de gravité **grave** ou **mortelle** : le dossier monte en tête des files et prévient le `RESP` et le gestionnaire du volet corporel. La **responsabilité initiale** vaut `INDETERMINEE` si un tiers est saisi, `ASSURE_FAUTIF` sinon ; elle est requalifiée à l'instruction (FR-54). Une gravité mortelle déclenche, côté expertise, la proposition d'une mission post-mortem (FR-58).

**Conséquences (testables) :**
- Un accident corporel auto de gravité grave ou mortelle est marqué « urgence corporelle » dès l'enregistrement et prévient `RESP` et le `GEST` corporel (module `notification`).
- Une déclaration avec un tiers saisi a la responsabilité `INDETERMINEE` ; sans tiers, `ASSURE_FAUTIF`.
- La responsabilité initiale ne déclenche aucune décision et ne ferme aucune transition à elle seule.
- L'urgence corporelle ne saute aucun contrôle : elle ne change que le rang dans les files et les délais d'alerte.

### 5.2 Ouvrir (`PIECES_ATTENDUES`, `OUVERT`)

#### FR-41 : La recevabilité répond à quatre questions, sur les contrats lus

L'ouverture s'appuie sur un contrôle de **recevabilité** en quatre questions distinctes, calculées sur la **projection des contrats lue dans le LC** (polices, garanties, primes ; jamais modifiés par Prospera) : (1) le **contrat** est-il valide (police en vigueur, sinistre entre la date d'effet et l'échéance, prime payée) ? (2) la **garantie** est-elle souscrite et applicable au type de sinistre ? (3) la **déclaration** est-elle dans le délai contractuel de la garantie ? (4) que reste-t-il à écarter : **exclusions**, **plafond**, **franchise** ? L'écran affiche la **date de la dernière lecture** du LC. Le résultat est `RECEVABLE`, `A_EXAMINER` (réserves) ou `IRRECEVABLE` (au moins un point bloquant). Une police suspendue, résiliée ou expirée suspend toutes les garanties dans la projection, la RC obligatoire comprise ; pour une **victime de dommage corporel causé par un véhicule terrestre à moteur**, le juriste doit confirmer ce qui reste opposable (le Code CIMA, art. 210 et son interprétation du 11/04/2011, rend inopposables à la victime la plupart des suspensions de garantie, sauf la suspension régulière pour non-paiement de prime). Le **type de garantie qui répond** à chaque type de sinistre est un paramètre (table type de sinistre → garanties, valeurs de la démo reprises).

**Conséquences (testables) :**
- Chacune des quatre questions a son propre résultat, sa raison et ses sources (police, garantie, date) affichés.
- Une garantie « non souscrite » (réponse normale pour une garantie facultative) est distinguée d'une garantie « hors branche » (déclaration probablement mal orientée, par exemple un dégât des eaux sur une police auto).
- La date de dernière lecture du LC est affichée à côté du résultat ; au-delà d'un âge paramétré (`age_max_lecture_contrats_heures`), l'écran avertit que la lecture est ancienne.
- Si le LC est injoignable, la recevabilité reste calculable sur la dernière projection, avec cet avertissement ; elle n'est jamais bloquée.
- Le résultat de recevabilité est conservé avec le dossier à la date de calcul ; une relecture ultérieure en crée un nouveau sans effacer l'ancien.

#### FR-42 : Le contrôle de garantie ne se saute pas

Avant d'**évaluer** un dossier, il existe sur le dossier une **décision de garantie** enregistrée par un agent habilité (`GEST`, `RESP`, `DG`, `DT`) : `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, avec un **motif de 10 caractères au moins**, visible par `AUD`. « Garantie acquise » est interdite tant qu'un point bloquant de la recevabilité subsiste. Si l'information manque (police introuvable, projection ancienne), l'agent enregistre quand même une décision motivée : il ne peut pas passer outre sans décision. Un `REFUS_DE_GARANTIE` prononcé ferme l'évaluation et mène à `REJETE` avec un **courrier de refus motivé** (rédaction, usage n°11, §5.12). **Prospera ne refuse jamais la garantie seule** : il propose, l'agent décide. Cet écart corrige la démo, où la décision de garantie pouvait être sautée.

**Conséquences (testables) :**
- Passer en `EVALUE` sans décision de garantie est refusé (`GARANTIE_NON_DECIDEE`).
- Enregistrer « garantie acquise » avec un blocage non levé est refusé (`GARANTIE_ACQUISE_AVEC_BLOCAGE`) ; un motif de moins de 10 caractères est refusé (`MOTIF_OBLIGATOIRE`).
- Un rôle sans droit de décision de garantie (`ACC`, `CPT`, `NUM`) voit l'action fermée avec sa raison.
- Après `REFUS_DE_GARANTIE`, l'action « Enregistrer l'évaluation » est fermée et la seule sortie ouverte est `REJETE` ou le renvoi motivé.
- La décision (auteur, date, motif, résultat de recevabilité du moment) figure dans le journal et dans la vue `AUD`.

#### FR-43 : Une déclaration tardive donne une réserve et un motif, jamais une déchéance automatique

Quand la déclaration dépasse le délai de déclaration de la garantie (défaut de la démo : 5 jours ; 2 jours pour le vol ; 3 jours pour le transport de marchandises `[ASSUMPTION: valeurs de la démo, à confirmer dans les conditions générales de la compagnie]`), le dossier reçoit une **réserve « déclaration tardive »** avec le motif du retard saisi. **La déchéance n'est jamais automatique** : le Code CIMA (art. 12-4° et 20) fixe un délai contractuel qui ne peut être inférieur à 5 jours ouvrés (48 heures en cas de vol) et n'autorise la déchéance pour retard que si l'assureur **prouve un préjudice**. Le `RESP` décide si la réserve est levée, maintenue ou transformée en refus motivé. La réserve apparaît dans la fiche de décision (FR-77).

**Conséquences (testables) :**
- Une déclaration au-delà du délai de la garantie enregistre la réserve, sans changer le statut ni refuser l'ouverture.
- Un refus de garantie fondé sur le retard exige un motif qui consigne le préjudice subi par la compagnie ; sans ce texte le refus est refusé (`PREJUDICE_NON_ETABLI`).
- Les délais de déclaration sont lus par garantie dans la projection du LC ; le minimum légal (5 jours ouvrés ; 48 h pour le vol) est un plancher que le paramétrage ne peut pas franchir.
- La réserve et sa décision sont lisibles de `AUD`.

#### FR-44 : Les pièces obligatoires et complémentaires dépendent du type de sinistre

Pour chaque **type de sinistre** (automobile corporel, automobile matériel, automobile collision, incendie, dégât des eaux, multirisque habitation, vol, transport, responsabilité civile générale, accident du travail, décès, divers), la compagnie paramètre une liste de **pièces obligatoires** et une liste de **pièces complémentaires**. Les listes de la démo sont reprises par défaut (annexe D). Les pièces obligatoires bloquent l'**évaluation** et conditionnent l'ouverture directe (FR-45) ; les complémentaires ne bloquent rien. Le rapport d'expertise n'est **pas** une pièce obligatoire : c'est un document que la procédure produit, non une pièce apportée par l'assuré. Le **volet par défaut** découle du type : corporel, accident du travail et décès vont au volet corporel ; matériel et collision au volet matériel ; les autres au volet risques divers. Pour les dossiers de dommage corporel, la liste intègre les pièces que le Code CIMA demande à la victime ou aux ayants droit (art. 240 et 241 : pièce d'identité, extrait d'acte de naissance, acte de mariage, certificat médical initial ; certificat de décès, jugement d'hérédité, certificat de vie, certificat de genre de mort) `[ASSUMPTION: liste de la démo complétée par les art. 240-241 ; à valider par le juriste avant mise en service]`.

**Conséquences (testables) :**
- Chaque type de sinistre a une liste de pièces obligatoires et une liste de pièces complémentaires lisibles et modifiables par `ADMIN` sans nouvelle version du produit ; une modification vaut pour les dossiers ouverts après elle.
- La liste par défaut du type automobile corporel est : constat amiable, déclaration signée, certificat médical initial, rapport de police, pièce d'identité, attestation d'assurance (valeurs de la démo).
- Le volet d'un dossier est dérivé de son type à l'enregistrement et visible ; il n'est pas modifiable par l'accueil.
- Une pièce « rapport d'expertise » ne figure dans aucune liste de pièces obligatoires.
- Chaque pièce porte l'état `ATTENDUE`, `RECUE`, `EN_CONTROLE`, `VALIDEE` ou `REJETEE`, et sa source (`SCAN_LOT`, `SCANNER`, `TELEVERSEMENT`, `MOBILE`, `WHATSAPP`, `COURRIER`).

#### FR-45 : Ouvrir « en attente de pièces », puis reprendre le circuit

La phase d'ouverture a deux issues. Si toutes les pièces obligatoires sont reçues, l'agent **ouvre** le dossier (`DECLARE → OUVERT`). Sinon, il l'**ouvre en attente de pièces** (`DECLARE → PIECES_ATTENDUES`) : le dossier reçoit son numéro, sa provision et ses échéances **sans attendre les pièces** (faute corrigée dans la démo : un dossier déclaré le soir sans constat restait « déclaré », sans gestionnaire ni provision). Quand les pièces obligatoires sont reçues, l'action « Reprendre le circuit » (`PIECES_ATTENDUES → OUVERT`) devient possible. Si l'assuré reste injoignable, le dossier peut être classé `SANS_SUITE` avec motif (FR-31). L'ouverture exige que le **contrat soit vérifié** (FR-41, question 1) ; elle n'exige pas que la garantie soit acquise.

**Conséquences (testables) :**
- Ouvrir directement sans toutes les pièces obligatoires est refusé (`PIECES_OBLIGATOIRES_MANQUANTES`) et le refus nomme les pièces manquantes ; l'action « ouvrir en attente de pièces » reste ouverte.
- L'ouverture en attente de pièces donne une provision d'ouverture (FR-49) et fait courir l'accusé de réception (FR-48).
- « Reprendre le circuit » est fermée tant qu'une pièce obligatoire est à l'état `ATTENDUE`, avec la liste des pièces manquantes comme raison.
- Un contrat non valide (police hors période ou non en vigueur) ferme l'ouverture avec le code `CONTRAT_NON_VALIDE` ; le dossier reste `DECLARE` et la sortie ouverte est `REJETE` motivé.
- L'accueil peut ouvrir et reprendre ; il ne peut pas affecter (FR-50).

#### FR-46 : La liste exacte des pièces est remise à l'assuré, avec un courrier de demande

À l'ouverture, Prospera produit pour l'assuré la **liste exacte des pièces à fournir**, tirée du type de sinistre, avec pour chaque pièce **qui doit la fournir** : l'assuré, l'expert, l'administration (police, gendarmerie, état civil) ou un tiers. Il prépare le **courrier de demande de pièces** (modèle `DEMANDE_PIECES`) adressé au bon interlocuteur, et le range au dossier. Les pièces demandées à l'assuré sont aussi remises sur l'accusé de déclaration (FR-36). Pour les dommages corporels, la correspondance rappelle : l'assuré peut obtenir copie du procès-verbal et se faire assister d'un conseil à ses frais (art. 232), le nom du gestionnaire du dossier et les conséquences d'un défaut de réponse (art. 242). Tous les courriers sont des **modèles de la compagnie** : leur texte est à obtenir à la séance d'immersion `[ASSUMPTION: modèles de la démo à remplacer par ceux de la compagnie]`.

**Conséquences (testables) :**
- La liste remise ne contient que les pièces obligatoires et complémentaires du type de sinistre, sans une de plus ni de moins, chacune avec son destinataire.
- Le courrier de demande est classé au dossier avec son canal, sa date de départ et son statut (`BROUILLON`, `A_IMPRIMER`, `ENVOYE`, `REMIS`, `RETOURNE`).
- Le courrier d'un dossier corporel contient les mentions des art. 232 et 242 ; un modèle corporel sans ces mentions est refusé à l'enregistrement du modèle (`MENTION_LEGALE_ABSENTE`).
- La date de présentation de la demande est horodatée : elle sert de point de départ au calcul des suspensions du délai d'offre (FR-85).

#### FR-47 : Pièces manquantes et relances rédigées par l'IA (usage n°4)

Pour un dossier `PIECES_ATTENDUES`, l'IA commune **identifie les pièces manquantes** et **rédige la relance** adaptée au canal.

- **Entrée :** le dossier (type, pièces attendues et reçues, nombre et dates des relances, canal préféré, gravité).
- **Sortie :** le message de relance (SMS, WhatsApp, e-mail ou script d'appel), la liste des pièces manquantes, le **moment conseillé** (appel à midi si l'assuré a déjà été relancé deux fois ou si le dossier est corporel ; WhatsApp sinon), et au troisième message un délai explicite `[ASSUMPTION: « sous 15 jours » comme dans la démo]`.
- **Destinataire :** le gestionnaire ou l'accueil, qui **envoie lui-même** et trace la relance ; rien ne part seul.
- **Garde-fou :** les pièces citées sont celles du type de sinistre ; le message ne contient ni diagnostic ni donnée médicale ; **après 3 relances sans effet**, le système propose un arbitrage (classement sans suite, appel, visite) au lieu d'une relance de plus ; l'intervalle minimal entre deux relances d'un même interlocuteur est de 5 jours (paramètres).
- Servi par l'**IA commune** ; sans modèle, des modèles de messages à variables remplissent la même fonction.

**Conséquences (testables) :**
- La relance proposée liste exactement les pièces obligatoires à l'état `ATTENDUE` ; aucune pièce reçue n'y figure.
- Envoyer une relance avant l'intervalle minimal est refusé avec une alerte (`RELANCE_TROP_PROCHE`), levable par un motif.
- À la troisième relance sans effet, l'écran propose l'arbitrage et n'ajoute pas de relance par défaut.
- Chaque relance est journalisée (canal, date, auteur) et son texte est conservé au dossier ; l'usage est inscrit au registre de l'IA (niveau `RECOMMANDATION`).
- Le texte d'une relance corporelle ne contient aucune information médicale du dossier.

#### FR-48 : Accusé de réception sous 10 jours, courtier et coassureurs informés

À l'ouverture, Prospera produit l'**accusé de réception du dossier** (modèle `ACCUSE_RECEPTION`) à envoyer à l'assuré, **sous 10 jours** après la déclaration (**délai interne**, paramétrable : le Code CIMA n'en fixe pas pour les sinistres non VTM `[ASSUMPTION: 10 jours, valeur de la démo]`). Le **courtier** qui a apporté le contrat est informé de l'ouverture. Si la police est en **coassurance**, les **coassureurs** sont informés selon la clé de répartition lue dans le LC ; si la compagnie est apériteur, elle instruit pour tous et les coassureurs remboursent leur quote-part (module `assurance`, partie 3). Le mémoire de 2014 relève des accusés de réception « jamais envoyés » : l'échéance est donc un indicateur de contrôle.

**Conséquences (testables) :**
- À l'ouverture, un accusé de réception est généré ; l'échéance de 10 jours court depuis la date de déclaration et s'arrête à l'envoi journalisé de l'accusé.
- Un accusé non envoyé au 8e jour `[ASSUMPTION: alerte au 8e jour]` apparaît dans les alertes de l'agent ; au-delà de 10 jours, dans celles du `RESP`.
- L'ouverture d'un dossier avec courtier crée une information au courtier (notification) avec la référence du dossier ; elle ne contient aucune donnée de santé.
- Pour une police en coassurance, la liste des coassureurs et leurs parts apparaît sur le dossier, lue dans le LC, non modifiable dans Prospera.
- Le délai d'accusé est un paramètre par volet ; sa modification ne change pas les dossiers déjà ouverts.

#### FR-49 : La provision d'ouverture est posée à l'ouverture

À l'ouverture (y compris en attente de pièces), le dossier reçoit une **provision d'ouverture** : la charge estimée du sinistre, posée **sans attendre les pièces**. Elle est le **milieu de la tranche** de la grille d'ouverture qui correspond à la **gravité** (grilles par volet de la démo, reprises en paramètres), arrondi à 5 000 FCFA, ou l'**estimation du déclarant** si elle est saisie `[ASSUMPTION: grilles en tranches de la démo reprises pour la provision d'ouverture seulement ; à remplacer par les règles de provisionnement de la compagnie]`. Elle est revue à chaque événement (FR-76). L'état des provisions du dossier est produit pour la comptabilité et le LC (module `assurance`, partie 3).

**Conséquences (testables) :**
- Un dossier ouvert sans estimation reçoit la provision du milieu de la tranche de sa gravité, arrondie au multiple de 5 000 FCFA.
- Une estimation du déclarant saisie remplace le milieu de tranche et est conservée comme source (« estimation du déclarant »).
- Le mouvement d'ouverture figure dans l'historique des provisions du dossier (jamais écrasé : une ligne ajoutée à chaque révision).
- Un dossier ouvert « en attente de pièces » a une provision ; un dossier sans provision depuis l'ouverture est une anomalie remontée au `RESP`.

### 5.3 Attribuer

#### FR-50 : Le responsable affecte le dossier ; l'accueil oriente, il n'affecte jamais

Un dossier `OUVERT` n'a pas de gestionnaire tant que le **responsable du service sinistres** (`RESP`) ne l'a pas **affecté** à un `GEST` du bon volet. L'**accueil oriente** (il vérifie le volet déduit du type de sinistre, ouvre, reprend le circuit) mais **n'affecte jamais** : le choix de qui instruit n'est pas un acte de guichet. Un gestionnaire ou un gestionnaire recours qui fait avancer un dossier sans titulaire le **prend lui-même** (seule exception, tracée). L'attribution se fait depuis la file « à affecter » du `RESP`, qui propose les gestionnaires du volet avec leur charge (FR-51). Le **motif** d'une affectation est facultatif à la première attribution et **obligatoire à toute réaffectation** (FR-51).

**Conséquences (testables) :**
- Une tentative de « prendre en instruction » (`OUVERT → EN_INSTRUCTION`) sur un dossier non affecté est refusée (`DOSSIER_NON_AFFECTE`) ; la raison affichée est « le dossier doit avoir été attribué par l'encadrement ».
- Un `ACC` qui tente d'affecter reçoit `DROIT_INSUFFISANT` ; l'action n'est pas proposée à son écran.
- Le gestionnaire affecté ne figure que dans la liste de son volet : un `GEST` du volet matériel ne peut pas être affecté à un dossier du volet corporel (`VOLET_INCOMPATIBLE`).
- Le journal porte « affectation : non affecté → [nom] », l'auteur, la date et l'heure.
- Un dossier `OUVERT` non affecté depuis plus de 1 jour ouvré apparaît dans les alertes du `RESP` `[ASSUMPTION: 1 jour ouvré]`.

#### FR-51 : La charge pondérée guide l'affectation ; la réaffectation exige un motif

La file « à affecter » affiche, pour chaque gestionnaire du volet, sa **charge pondérée** : le poids de ses dossiers actifs rapporté à sa capacité. Le poids d'un dossier dépend du type de sinistre et de la gravité (grille paramétrable) ; un gestionnaire est **surchargé** au-delà de 1,2 de sa capacité et **disponible** sous 0,8 (valeurs de la démo en paramètres). Le `RESP` peut **réaffecter** un dossier à un autre gestionnaire (absence, surcharge, conflit d'intérêts) avec un **motif obligatoire** ; la cible doit différer du titulaire actuel. Les **gestionnaires de la démo** (14 dont 3 corporel, 5 matériel, 3 risques divers, 3 recours) sont le jeu de démonstration, non l'effectif réel de la compagnie.

**Conséquences (testables) :**
- La charge d'un gestionnaire est recalculée à chaque affectation et réaffectation et affichée dans la liste de choix, avec le signal « surchargé » ou « disponible ».
- Réaffecter sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; réaffecter à la même personne est refusé (`CIBLE_IDENTIQUE`).
- Affecter un dossier à un gestionnaire surchargé est permis, avec un avertissement que le `RESP` doit accepter par un motif.
- Un gestionnaire absent (congé enregistré) apparaît dans la liste avec la mention d'absence ; sa corbeille est visible du `RESP` pour reprise (corbeille de service du volet).
- Chaque réaffectation est journalisée avec l'ancien titulaire, le nouveau, l'auteur et le motif.

### 5.4 Instruire (`EN_INSTRUCTION`)

#### FR-52 : Prendre le dossier en instruction

Le gestionnaire affecté **prend le dossier en instruction** (`OUVERT → EN_INSTRUCTION`). Pendant l'instruction, il rassemble les pièces, requalifie la responsabilité, oriente et suit les expertises, prépare l'évaluation. Un dossier en instruction n'a qu'un titulaire. Le gestionnaire ne peut jamais valider son propre dossier ni émettre son règlement (FR-33, FR-81).

**Conséquences (testables) :**
- `OUVERT → EN_INSTRUCTION` exige : droit `GEST` ou `RESP` ; dossier affecté ; sinon refus `DOSSIER_NON_AFFECTE`.
- Le passage fixe la date de début d'instruction, qui sert aux indicateurs de délai (§5.14).
- Un `GEST` ne voit et n'instruit que les dossiers de son volet ; un dossier d'un autre volet lui est refusé avec `VOLET_INCOMPATIBLE`.
- Le dossier `EN_INSTRUCTION` affiche en permanence : étape, pièces reçues et manquantes, montant évalué, déjà payé, reste à payer, dernière action.

#### FR-53 : Contrôle des pièces par l'IA : cohérence et photo réutilisée (usage n°3)

Quand une pièce est versée, l'IA commune **contrôle sa cohérence** avec le dossier et avec le portefeuille, **avant l'instruction** et avant tout paiement.

- **Entrée :** la pièce (texte lu, champs extraits par la lecture des pièces §6.2) et le dossier (police, immatriculation, dates, noms).
- **Sortie :** des **constats** de deux sortes : `CERTAIN` (calculés par règle : date hors période de la police, police non en vigueur, déclaration antérieure au sinistre, propriétaire de la carte grise différent de l'assuré, immatriculation différente de celle de la police) et `PROBABLE` (jugés par l'IA : incohérence de dates ou de noms, signature absente d'un constat, **photo déjà utilisée** dans un autre dossier). Chaque constat nomme sa source (pièce, extrait, police) et se termine par une **question à poser**, jamais par un verdict.
- **Destinataire :** le gestionnaire du dossier ; les constats `PROBABLE` à fort enjeu sont aussi visibles de `AUD` et alimentent le graphe de liens (§5.12).
- **Garde-fou :** un signal n'est pas une accusation ; **aucun rejet ni blocage automatique** d'une pièce ; seule la décision humaine passe la pièce à `VALIDEE` ou `REJETEE` ; la réutilisation de photo se mesure par empreinte d'image calculée en local `[ASSUMPTION: comparaison d'empreintes d'images à construire ; la démo la simule]` ; le contenu médical des pièces n'est jamais affiché hors des rôles autorisés (FR-70).
- Servi par l'**IA commune** (local). Tant qu'un modèle de vision n'est pas installé, les constats `CERTAIN` seuls sont servis, par règles ; l'écran dit que la photo n'est pas contrôlée.

**Conséquences (testables) :**
- Une carte grise dont l'immatriculation diffère de celle de la police produit un constat `CERTAIN` avec les deux valeurs et leurs sources.
- Une photo déjà versée dans un autre dossier produit un constat `PROBABLE` qui nomme l'autre dossier à `AUD` et au `RESP` seulement ; le gestionnaire voit le constat sans le contenu de l'autre dossier.
- Aucune pièce ne change d'état sans l'action d'un agent ; un constat sans suite reste visible et ne bloque rien.
- Chaque constat accepté, ignoré ou rejeté va au registre de l'IA avec son auteur.
- Avec l'IA coupée, les constats `CERTAIN` sont toujours calculés et la pièce se valide comme avant.

#### FR-54 : La responsabilité se qualifie à l'instruction, et ouvre le recours

Le gestionnaire **requalifie la responsabilité** : `ASSURE_FAUTIF`, `TIERS_FAUTIF`, `PARTAGEE` (avec la **part du tiers chiffrée**, en pourcentage) ou `INDETERMINEE`. La qualification s'appuie sur le constat amiable, le rapport de police, les témoignages et, si besoin, une mission d'expertise de responsabilité (FR-61). **Une part partagée sans chiffre ne se réclame pas** : le recours n'est ouvert qu'avec une part de tiers arrêtée. Quand un **tiers est en cause** (dès l'ouverture, pas après le paiement), le **recours** est créé en suivi parallèle (FR-32) : la lettre de mise en cause part au tiers ou à son assureur, avec une **relance tous les 15 jours** (paramètre `delai_relance_recours_jours`). Une requalification de la responsabilité est un événement du journal, avec son motif et sa source (pièce ou rapport), et déclenche la revue de la provision (FR-76). Pour le dommage corporel causé par un véhicule terrestre à moteur, les victimes non conductrices sont indemnisées sans que leur faute leur soit opposée, sauf recherche volontaire du dommage (art. 228 du Code CIMA) ; la qualification ne réduit donc pas leur offre (FR-70).

**Conséquences (testables) :**
- Qualifier `PARTAGEE` sans part de tiers chiffrée est refusé (`PART_TIERS_NON_CHIFFREE`) ; la part est comprise entre 1 et 99.
- Une requalification porte un motif et sa source ; elle crée une ligne de journal « responsabilité requalifiée : avant → après ».
- Quand un tiers est saisi, le recours est créé en `A_QUALIFIER` et la lettre de mise en cause est préparée ; la relance est programmée à 15 jours.
- Le recours créé n'empêche ni l'évaluation, ni la validation, ni le paiement de l'assuré (FR-32).
- Le montant du recours au prorata (part du tiers x montant payé) est calculé et affiché sur le dossier ; son suivi est en §5.10.

#### FR-55 : Un formulaire d'instruction par type de sinistre

L'instruction technique se fait dans un **formulaire propre à chaque famille de sinistre** : véhicule (automobile matériel, collision, corporel), biens (incendie, dégât des eaux, multirisque habitation), vol, transport, responsabilité civile, divers. Chaque formulaire porte ses champs, ses calculs (FR-69, FR-72, FR-73) et ses alertes (`BLOQUANT`, `ALERTE`, `INFO`). L'accident du travail et le décès ne passent pas par un formulaire de calcul : ils relèvent du barème corporel (FR-70). Les alertes levées par défaut, reprises de la démo, sont : assuré fautif sur une garantie RC seule (indemnité nulle, bloquant) ; sinistre moins de 30 jours après la souscription ; autres sinistres sur la même immatriculation ; véhicule de plus de 15 ans ; usage taxi, moto-taxi ou marchandises (vérifier la couverture) ; origine criminelle d'un incendie (plainte et enquête) ; vol sans plainte (bloquant) ; plainte déposée plus de 2 jours après les faits ; transport sans réserve à la livraison (analyser le recours) ; prescription du recours contre le transporteur à 1 an après la livraison (2 ans en aérien), affichée comme terme à vérifier `[ASSUMPTION: alertes et seuils de la démo ; chaque seuil est un paramètre de la compagnie]`. Les enregistrements du formulaire sont versionnés : chaque mise à jour est une ligne du journal.

**Conséquences (testables) :**
- Chaque type de sinistre ouvre son formulaire ; un type sans formulaire de calcul (accident du travail, décès) renvoie vers le décompte corporel.
- Une alerte `BLOQUANT` (par exemple vol sans plainte) empêche l'enregistrement de l'évaluation tant qu'elle n'est pas levée par le gestionnaire avec un motif ; la raison s'affiche (`ALERTE_BLOQUANTE_NON_LEVEE`).
- Les valeurs de seuil de chaque alerte sont paramétrables sans nouvelle version.
- Modifier le formulaire après évaluation arrêtée n'altère pas l'évaluation (FR-75).
- Les champs de santé d'un formulaire corporel sont masqués aux rôles non autorisés (FR-70).

#### FR-56 : Pré-remplissage de l'instruction par l'IA (usage n°7)

L'IA commune **reporte dans le formulaire d'instruction** ce que disent les pièces reçues.

- **Entrée :** les pièces reçues (texte lu, OCR inclus) et le formulaire en cours.
- **Sortie :** les valeurs de champs tirées des pièces (carte grise : immatriculation, marque, année ; permis ; devis ou facture : pièces et main-d'œuvre ; rapport d'expert : valeur vénale, valeur d'épave ; procès-verbal ou plainte : circonstances d'un vol), avec **la pièce source de chaque champ** ; à défaut de valeur vénale, un repère « cote du marché local de l'occasion » signalé comme tel.
- **Destinataire :** le gestionnaire, qui relit, modifie et enregistre.
- **Garde-fou :** rien n'est enregistré sans l'action du gestionnaire ; chaque champ affiche sa source ; la valeur issue d'une pièce non lue ou d'un champ de confiance basse est marquée « à confirmer » ; le pré-remplissage est journalisé (« instruction pré-remplie depuis la pièce X »). Il ne remplit **aucun champ de montant corporel** (FR-71).
- Servi par l'**IA commune** ; sans modèle, des règles de correspondance par type de pièce font le même travail sur les champs structurés.

**Conséquences (testables) :**
- Après versement d'une carte grise, le formulaire véhicule propose immatriculation, marque et année avec la mention de la pièce source ; sans pièce, aucun champ n'est proposé.
- Accepter, modifier ou rejeter un champ est journalisé au registre de l'IA (niveau `EXTRACTION`).
- Aucun champ n'est écrit tant que le gestionnaire n'a pas enregistré le formulaire.
- Un formulaire de dommage corporel n'est jamais pré-rempli sur un champ de montant.
- Avec l'IA coupée, le formulaire se remplit à la main sans autre changement.

#### FR-57 : Demander des pièces complémentaires pendant l'instruction

Pendant l'instruction, le gestionnaire peut **demander des pièces complémentaires** (`EN_INSTRUCTION → PIECES_ATTENDUES`) : le dossier revient « en attente de pièces » avec la liste de ce qui manque, un courrier de demande et la relance de FR-47. Il en va de même quand le `RESP` demande des pièces avant validation (FR-80). Les délais légaux du dommage corporel sont **suspendus** à partir de la présentation de la demande, selon les règles de FR-85, et le suivi horodate la demande et la réponse.

**Conséquences (testables) :**
- La transition est ouverte au gestionnaire ou au responsable ; elle liste les pièces demandées ; sans pièce nommée elle est refusée (`PIECES_NON_NOMMEES`).
- Le courrier de demande (FR-46) est préparé, et le dossier réapparaît dans la file des dossiers en attente.
- La reprise (`PIECES_ATTENDUES → OUVERT`) conserve le gestionnaire déjà affecté : il reprend l'instruction sans nouvelle affectation `[ASSUMPTION: le titulaire est conservé pendant l'attente de pièces ; à confirmer]`.
- Les pièces demandées et leur date de présentation sont conservées pour le calcul des suspensions (FR-85).

### 5.5 Expertise et accord sur devis

Un sinistre appelle autant d'expertises que de questions distinctes : un accident corporel automobile en appelle couramment deux ou trois (véhicule, blessures, responsabilité). Chacune est une **mission d'expertise** autonome, rattachée au dossier. Le **référentiel des experts** (agréments, domaines, zones, charge) et le **portail expert** (les missions d'un cabinet, le dépôt de rapport) sont au §6.3 ; ce chapitre décrit ce qui se passe **dans le dossier**. Ce module est le module `expertises` (M29) pour la machine des missions.

#### FR-58 : L'orientation d'expertise assistée propose, elle ne crée rien

Sur un dossier en instruction, l'IA commune propose une **orientation d'expertise** : les besoins d'expertise du dossier.

- **Entrée :** le dossier (type, gravité, responsabilité, pièces, devis, délai de déclaration, ancienneté du contrat, signaux de fraude, missions déjà ouvertes).
- **Sortie :** une liste de **besoins** par domaine (automobile et matériel, médical, responsabilité et circonstances, fraude, incendie, transport, bâtiment, perte d'exploitation), chacun avec une recommandation `NECESSAIRE`, `A_CONFIRMER` ou `NON_IDENTIFIE`, une **justification**, ses **sources**, une **confiance**, une **priorité** proposée, un **budget indicatif** (FR-68), si le besoin est déjà **couvert** par une mission ouverte, et la **complexité** du dossier (faible, moyenne, élevée) avec les informations manquantes. Règles de la démo reprises en défauts : automobile sous le seuil d'expertise avec devis → arbitrage sur pièces ; corporel sans certificat médical initial → à demander ; responsabilité indéterminée ou partagée avec constat ou rapport de police → lecture contradictoire des circonstances (parfois sans mission extérieure) ; fraude : au moins deux signaux parmi déclaration tardive de plus de 15 jours, souscription de moins de 60 jours, plus de 2 pièces manquantes, présentés comme « éléments à vérifier, en aucun cas une preuve » ; domaine médical avec gravité mortelle → mission post-mortem proposée.
- **Destinataire :** le gestionnaire, qui **retient** le besoin (la mission naît alors) ou l'**écarte** avec un motif obligatoire, conservé comme une décision.
- **Garde-fou :** l'IA **ne crée jamais de mission** ; retenir deux fois le même besoin est refusé (« mission déjà ouverte ») ; un besoin écarté est conservé avec son motif ; une expertise externe imposée par un seuil (FR-59) est affichée avec son motif, non proposée comme un choix.
- Servi par l'**IA commune** ; sans modèle, les règles ci-dessus (déterministes, explicables) servent seules et l'écran le dit.

**Conséquences (testables) :**
- Après « retenir », une mission `SUGGEREE` est créée, avec l'origine « suggérée », la justification de l'orientation et la confiance ; l'orientation seule ne crée aucune mission.
- Retenir un besoin déjà couvert est refusé (`MISSION_DEJA_OUVERTE`).
- Écarter un besoin sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; le besoin écarté est conservé en mission `ANNULEE` avec le motif de l'agent.
- Chaque orientation, retenue ou écartée, est inscrite au registre de l'IA (niveau `RECOMMANDATION`) avec la décision de l'agent.
- Avec l'IA coupée, le gestionnaire crée la mission à la main sans autre changement.

#### FR-59 : Les seuils d'expertise et la voie « accord sur devis »

Les règles suivantes sont des **paramètres** (valeurs de la démo, sauf accord sur devis, tiré du mémoire de 2014 et du PO). **Aucune expertise n'est requise** sous **250 000 FCFA**. L'expertise **externe** est **obligatoire** au-dessus de **3 000 000 FCFA**. L'expertise externe est aussi **impérative** pour une contre-expertise ou une expertise contradictoire, une fraude suspectée, un dossier contentieux, et un domaine que le panel interne ne couvre pas (la démo couvre en interne l'automobile matériel, le médical et la responsabilité, dans les zones de Lomé, Tsévié et Aného). Elle est **conseillée** si la zone n'est pas desservie ou si le panel interne est saturé. La **voie « accord sur devis »** permet de **retenir un devis de garage sans mission d'expertise** quand le sinistre est un **dommage matériel automobile** dont le **dossier est inférieur ou égal à 300 000 FCFA** et le **devis inférieur ou égal à 200 000 FCFA**, après le **contrôle du devis** (FR-60) `[ASSUMPTION: 300 000 et 200 000 FCFA tirés du mémoire de 2014 sur une compagnie du même groupe au Sénégal ; à confirmer pour la compagnie]`. L'accord sur devis est une **décision du gestionnaire**, avec motif, tracée comme l'équivalent d'une expertise close.

**Conséquences (testables) :**
- Un dossier de 120 000 FCFA n'exige aucune mission ; un dossier de 3 500 000 FCFA impose une mission externe et l'écran dit pourquoi.
- Un dossier matériel de 280 000 FCFA avec un devis de 190 000 FCFA ouvre l'action « retenir le devis » ; avec un devis de 210 000 FCFA, elle est fermée (`SEUIL_ACCORD_SUR_DEVIS_DEPASSE`).
- « Retenir le devis » sans contrôle de devis préalable est refusé (`CONTROLE_DEVIS_ABSENT`) ; le contrôle est une action, pas un automatisme.
- L'accord sur devis exige un motif ; il vaut « expertise validée » pour l'évaluation (FR-61) ; il est visible dans le dossier et dans les états.
- Les seuils sont modifiables sans nouvelle version ; la modification ne change pas les dossiers déjà évalués.

#### FR-60 : Analyse des devis par l'IA (usage n°8)

Quand un devis de réparation est versé, l'IA commune l'**analyse** poste par poste.

- **Entrée :** le devis (pièces, main-d'œuvre, zones endommagées, marque, usage du véhicule), le catalogue de références de prix de pièces, et l'**historique interne** des devis comparables (au moins 5 observations) et du garage.
- **Sortie :** pour chaque poste, la **fourchette de référence** (catalogue de pièces du marché local, coefficients par catégorie de véhicule), la **main-d'œuvre attendue** (heures x taux horaire) et le **surcoût** éventuel ; une alerte quand le surcoût dépasse 10 % du devis ; la **distribution** des prix observés dans le portefeuille (quartiles, rang du devis) avec la phrase « une comparaison n'est pas une règle » ; l'historique du garage (devis qui dépassent le marché).
- **Destinataire :** le gestionnaire, et la direction pour les statistiques.
- **Garde-fou :** **jamais de refus automatique** d'un devis ; le gestionnaire négocie avec le garage ou demande un second devis ; la fourchette cite sa source (catalogue ou historique) ; l'analyse d'un dossier **ne change pas entre deux consultations** (pas de tirage au sort : défaut corrigé dans la démo) ; le catalogue de prix est un paramètre de la compagnie `[ASSUMPTION: catalogue de pièces et taux horaire à obtenir de la compagnie ou construits pendant la reprise des archives ; valeurs de la démo (par exemple pare-chocs 60 000 à 150 000 FCFA, taux horaire 8 000 FCFA) non retenues comme référence]`.
- Servi par l'**IA commune** ; sans historique suffisant (moins de 5 comparables), seule la fourchette du catalogue est servie, avec la mention « historique insuffisant ».

**Conséquences (testables) :**
- Un devis dont un poste dépasse la fourchette de plus de 10 % du devis total produit une alerte qui nomme le poste, la fourchette et la source.
- Deux consultations successives de la même analyse donnent le même résultat.
- Aucune action « refuser le devis » n'est proposée par l'analyse ; la demande de second devis est une action du gestionnaire.
- Avec moins de 5 comparables, l'écran affiche « historique insuffisant » et n'affiche pas de quartiles.
- Chaque analyse va au registre de l'IA (niveau `ANALYSE`) avec ses sources.

#### FR-61 : La mission d'expertise a sa propre machine d'états

Une **mission** a un **domaine** (automobile matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation), un **type** (`INITIALE`, `COMPLEMENTAIRE`, `CONTRADICTOIRE`, `CONTRE_EXPERTISE`), une **priorité** (`URGENTE`, `NORMALE`, `DIFFEREE`), un objet, des **points à traiter** et des **éléments à examiner**. Sa machine, réécrite à partir de celle de la démo, est : `SUGGEREE → A_DESIGNER → EXPERT_DESIGNE → ACCEPTEE → [TRANSMISE] → EN_COURS → RAPPORT_ATTENDU → RAPPORT_RECU → [COMPLEMENT_DEMANDE] → VALIDEE`, avec les sorties `CONTESTEE`, puis `ARBITREE` (la contestation est tranchée par une contre-expertise), et `ANNULEE`. `TRANSMISE` n'existe que pour un expert externe : les pièces sortent de la compagnie, par le portail, un courriel sécurisé ou un dossier papier, avec lettre de mission et accusé de réception. Pour un expert interne, `ACCEPTEE` est un geste simple de prise en charge. **Toute décision sur un rapport est humaine** : accepter, demander un complément, demander une expertise complémentaire, contester, escalader, avec motif. Le gestionnaire ne peut évaluer (`EVALUE`) que si **toutes les missions non annulées sont `VALIDEE` ou `ARBITREE`**.

**Conséquences (testables) :**
- Les transitions de la mission sont gardées par rôle, comme celles du dossier (§5.0) ; une transition hors graphe est refusée (`TRANSITION_MISSION_INTERDITE`).
- L'évaluation d'un dossier avec une mission ouverte (ni `VALIDEE`, ni `ARBITREE`, ni `ANNULEE`) est refusée (`EXPERTISE_NON_CLOSE`) ; la raison affichée nomme la mission en attente.
- Un dossier sans mission n'est pas bloqué : toutes les affaires n'ont pas d'expertise.
- Une mission `ARBITREE` ne bloque plus rien ; une mission `CONTESTEE` sans contre-expertise ouverte est une anomalie signalée au `RESP`.
- Un rapport d'expertise ne se dépose jamais parmi les pièces du dossier : il se dépose depuis sa mission et rejoint alors les pièces.
- Une décision humaine sur un rapport (accepter, compléter, contester, escalader) est enregistrée avec son auteur et son motif ; l'IA ne la prend jamais.

#### FR-62 : Désigner l'expert, interne ou externe

Le gestionnaire ou le responsable **désigne** l'expert de la mission parmi le référentiel (§6.3), avec un **classement** qui tient compte du domaine, de la zone, de la charge pondérée, du délai annoncé, du coût estimé et de l'indépendance. L'expert est **interne** (salarié ou vacataire, sans honoraires supplémentaires) ou **externe** (cabinet agréé). Le choix d'un expert interne quand l'externe est classé premier est une **décision motivée** (« expert interne : aucun honoraire à engager »). Le délai de rapport ne court qu'à l'**acceptation** de la mission par l'expert (il peut aussi la décliner : la mission retourne à `A_DESIGNER`). Les règles dures sont dans l'action, pas seulement dans la liste : un expert hors agrément, hors domaine ou en conflit est refusé (`EXPERT_NON_ELIGIBLE`), la contre-expertise a ses propres interdits (FR-66).

**Conséquences (testables) :**
- Désigner un expert dont l'agrément a expiré ou qui ne couvre pas le domaine est refusé (`EXPERT_NON_ELIGIBLE`).
- Désigner un expert externe quand le seuil impose l'externe est autorisé ; désigner un interne quand l'externe est imposé est refusé (`EXPERTISE_EXTERNE_IMPOSEE`).
- Un expert décline : la mission revient à `A_DESIGNER` avec le refus et son motif conservés ; l'expert décliné n'est plus proposé pour cette mission.
- Le délai de rapport attendu est calculé à l'acceptation ; avant elle, la mission affiche « délai non commencé ».
- La charge d'un expert (missions actives, en retard, taux d'occupation) est affichée avant désignation.

#### FR-63 : L'expertise médicale : convocation, examen, rapport, médecin-conseil

Pour un dommage corporel, la mission médicale suit sa propre chronologie : `A_DESIGNER`, `EXPERT_DESIGNE`, `MISSION_ACCEPTEE`, `CONVOCATION_ENVOYEE`, `EXAMEN_REALISE`, `RAPPORT_ATTENDU`, `RAPPORT_RECU`, `EN_ANALYSE`, `VALIDEE`, `CONTESTEE`. Les **types** sont : initiale, contradictoire, contre-expertise, consolidation, aggravation. La **convocation** de la victime se fait **au moins 15 jours avant l'examen** et mentionne l'identité et les titres du médecin, l'objet, la date, le lieu, le nom de l'assureur, et le droit pour la victime de se faire assister d'un médecin de son choix à ses frais (art. 244 du Code CIMA, SÛR). Le rapport est transmis à la compagnie, à la victime et à son médecin **dans les 20 jours de l'examen** (art. 245). Le **médecin-conseil** (`MED`) lit, analyse et valide le fond médical (lésions, séquelles, taux d'incapacité permanente proposé, incapacité temporaire, consolidation, soins futurs, aggravation possible), mais **ne chiffre pas** de montant à la place du gestionnaire (FR-71). Les **certificats médicaux** ont un suivi : demandé, relancé, reçu, vérifié, non conforme, avec des **délais d'attente** par type (initial 8 jours, prolongation 8, arrêt de travail 8, reprise 10, guérison 12, consolidation 15, descriptif des séquelles 12, aggravation 12, rechute 10, complémentaire 8 ; valeurs de la démo en paramètres). La **qualification de l'expert** (expert judiciaire inscrit, diplômes appropriés ou 5 ans d'activité ininterrompue : art. 272) est vérifiée à sa désignation. Si la victime refuse l'examen ou conteste les conclusions, l'**expert commun** de l'art. 252 est proposé ; le délai d'offre est prorogé d'un mois (FR-85).

**Conséquences (testables) :**
- La convocation d'un examen daté moins de 15 jours après son envoi est refusée (`CONVOCATION_TROP_TARDIVE`) ; elle contient les mentions de l'art. 244.
- Le rapport reçu plus de 20 jours après l'examen est signalé à `RESP` et à `MED` (délai de l'art. 245).
- Le contenu médical d'une mission (certificats, rapports, conclusions) n'est lisible que de `MED`, du `GEST` corporel affecté, du `RESP`, et de `DG` ou `DT` pour une décision ; `ACC` voit seulement qu'une pièce médicale est reçue ; chaque lecture est journalisée.
- Un certificat non reçu dans son délai passe à « relance nécessaire » puis « en retard », avec relance (FR-47).
- Une désignation d'expert médical sans vérification de sa qualification (art. 272) est refusée (`QUALIFICATION_NON_VERIFIEE`).

#### FR-64 : Contrôle de complétude d'un rapport d'expertise, assisté par l'IA

Quand un rapport est reçu, l'IA commune contrôle sa **complétude** : la **forme**, pas le fond.

- **Entrée :** le rapport (rubriques saisies ou texte lu) et le domaine de la mission.
- **Sortie :** une grille de **points attendus par domaine**, chacun `PRESENT`, `INSUFFISANT` ou `ABSENT`, un **verdict** `EXPLOITABLE`, `EXPLOITABLE_SOUS_RESERVE` ou `NON_EXPLOITABLE`, un score, et des **demandes de complément** rédigées à cocher. Points types : automobile (méthode d'évaluation, valeur vénale, caractère économiquement réparable), médical (lésions, incapacité temporaire et permanente, consolidation, taux et barème retenu, souffrance, préjudice esthétique, tierce personne, réserves), responsabilité (séquence reconstituée, imputation motivée, **part du tiers chiffrée**), incendie (origine, tiers, inventaire chiffré, adéquation du capital), transport (quantités, réserves au déchargement), fraude (faisceau d'indices, position de l'assuré), bâtiment (cause, chiffrage), perte d'exploitation (période, marge brute), post-mortem (genre de mort, causalité, délai, examen, état antérieur).
- **Destinataire :** le gestionnaire, qui décide.
- **Garde-fou :** un rapport sans signature, sans chiffrage, sans conclusion ou sans identification du bien est **inexploitable quel que soit son score** ; le contrôle **lit les rubriques présentes mais vides** (« non précisée », « non renseignée ») ; il ne produit **jamais d'estimation concurrente** de celle de l'expert.
- Servi par l'**IA commune** ; sans modèle, une grille de règles par domaine sert le contrôle et le dit.

**Conséquences (testables) :**
- Un rapport dont la rubrique « valeur vénale » contient « non renseignée » est classé « sous réserve » avec ce point en rouge, même s'il est présent.
- Un rapport sans signature est `NON_EXPLOITABLE` quel que soit le score.
- Un rapport de responsabilité dont la part du tiers n'est pas chiffrée est refusé au dépôt (`PART_TIERS_NON_CHIFFREE`).
- Le verdict ne change pas le statut de la mission : la décision du gestionnaire (accepter, compléter, contester, escalader) le fait.
- Chaque contrôle va au registre de l'IA (niveau `ANALYSE`) avec ses sources.

#### FR-65 : L'écart entre le rapport et le dossier : 15 % d'attention, 35 % bloquant

À la réception d'un rapport, Prospera le **confronte aux pièces et aux référentiels du dossier**, jamais à une estimation concurrente : devis versé, provision, médiane des missions comparables (au moins 5), pièce absente. Un **écart** a une nature (`MONTANT`, `PIECE_ABSENTE`, `CONTRADICTION`, `DELAI`, `PERIMETRE`), un niveau (`INFO`, `ATTENTION`, `BLOQUANT`), la valeur du rapport, la valeur de référence, sa source, et une **question** à poser ; il ne conclut jamais par un verdict. Pour le montant, l'écart est **ATTENTION au-delà de 15 %** et **BLOQUANT au-delà de 35 %** (valeurs de la démo, paramètres). Un écart **BLOQUANT** n'interdit rien en soi : il oblige le gestionnaire à **prendre une décision motivée** sur le rapport (accepter avec motif, demander un complément, contester) avant de valider la mission. L'écart du dossier d'exemple (chiffrage de l'expert inférieur de 65 % au devis du garage) est le cas type. La **médiane des dossiers comparables** (au moins 12 comparables, écart significatif 25 %) est affichée comme repère, à côté de l'instruction technique et du montant validé, **sans jamais fondre les trois chiffres**.

**Conséquences (testables) :**
- Un rapport à 445 500 FCFA face à un devis de 1 273 000 FCFA produit un écart de 65 %, de niveau `BLOQUANT`, avec la question « quels postes du devis avez-vous écartés, et pour quel motif ? ».
- Valider une mission avec un écart `BLOQUANT` sans motif est refusé (`DECISION_MOTIVEE_REQUISE`).
- Un rapport remis après la date attendue produit un écart `DELAI` qui nomme le nombre de jours.
- Chaque écart nomme sa contrepartie et sa source ; aucun texte d'écart ne contient de verdict de fraude.
- Les seuils de 15 % et 35 % sont des paramètres ; leur modification ne change pas les écarts déjà décidés.

#### FR-66 : La contre-expertise ne revient ni au cabinet initial ni au panel interne

La **contre-expertise** (interne à la compagnie : on conteste le rapport d'un expert) est **ordonnée par le `RESP` ou par le `DG` ou le `DT`** ; un gestionnaire ne l'ordonne pas (`DROIT_INSUFFISANT`). Elle ne peut **jamais** être confiée **au cabinet qui a produit le rapport contesté** ni **au panel interne** : c'est un refus du système dans l'action, pas un simple avertissement (`CONTRE_EXPERTISE_NON_AUTORISEE`). Elle est **externe** par construction et **prioritaire** par défaut. Quand elle rend son rapport, la mission contestée passe à **`ARBITREE`** (« contestation tranchée par la contre-expertise ») ; la décision est `CONFIRME_EXPERT_INITIAL`, `CONFIRME_CONTRE_EXPERT` ou `TRANSACTION`. Un rapport n'est jamais tranché par son auteur. La **contre-expertise** de ce paragraphe est à distinguer de l'**expertise contradictoire entre assureurs**, qui relève de la convention entre compagnies et se mène avec l'assureur du tiers (§5.10).

**Conséquences (testables) :**
- Un `GEST` qui tente d'ordonner une contre-expertise reçoit `DROIT_INSUFFISANT` ; le `RESP` et le `DG` ou `DT` l'obtiennent.
- Désigner un expert du panel interne pour une contre-expertise est refusé (`CONTRE_EXPERTISE_NON_AUTORISEE`) ; désigner le cabinet du rapport contesté est refusé avec le même code, et ce cabinet apparaît « écarté : a produit le rapport contesté » dans le classement.
- La contre-expertise crée une mission de type `CONTRE_EXPERTISE`, priorité urgente, poids 1,5 (coefficient de type), avec un budget indicatif.
- À la validation de la contre-expertise, la mission contestée passe à `ARBITREE` ; une mission `CONTESTEE` ne reste jamais sans sortie.
- Le `RESP` peut aussi retenir les conclusions initiales (`CONFIRME_EXPERT_INITIAL`) avec motif, sans nouvelle mission.

#### FR-67 : Un complément demandé et non revenu bloque la validation ; le cabinet sans compte

Quand le gestionnaire demande un **complément** à l'expert (`COMPLEMENT_DEMANDE`), le rapport complété doit revenir avant la validation de la mission. Si le complément n'est **pas revenu**, la validation est **bloquée** (`COMPLEMENT_NON_REVENU`), **sauf passage outre du `RESP` avec un motif** : le `RESP` accepte alors le rapport en l'état, et ce passage outre est tracé et visible de `AUD`. Quand un cabinet n'a **pas de compte** sur le portail expert, le gestionnaire **saisit** le rapport reçu par courrier ou par courriel (pièce jointe obligatoire, rapport marqué **« saisi pour le cabinet »**) et reste responsable de l'exactitude de la saisie ; les cabinets qui ont un compte déposent eux-mêmes (§6.3).

**Conséquences (testables) :**
- Valider une mission `COMPLEMENT_DEMANDE` sans rapport complété est refusé (`COMPLEMENT_NON_REVENU`) ; le `RESP` seul peut passer outre, avec un motif, et le passage outre figure au journal.
- Un `GEST` qui tente de passer outre reçoit `DROIT_INSUFFISANT`.
- Saisir un rapport pour un cabinet sans compte sans pièce jointe est refusé (`PIECE_JOINTE_OBLIGATOIRE`) ; le rapport saisi porte la marque « saisi pour le cabinet » et le nom du saisissant.
- Chaque version du rapport est conservée (versions successives), l'ancienne n'est pas écrasée.
- Les décisions sur un rapport (accepter, compléter, contester) créent une ligne de journal avec motif.

#### FR-68 : Délais de rapport par domaine et honoraires d'expert

À l'acceptation, la mission reçoit une **date de rapport attendue**, selon le domaine (valeurs de la démo, paramètres) : automobile matériel 7 jours, médical 21, responsabilité 14, fraude 30, incendie 21, transport 14, bâtiment 21, perte d'exploitation 30. Le mémoire de 2014 donne 7 jours pour les dommages et 10 jours pour la responsabilité civile à compter de la réception de tous les éléments `[ASSUMPTION: valeurs de la démo retenues ; à confirmer avec la liste des experts agréés et leurs conventions]`. Les **honoraires** suivent **cinq montants** : budget prévisionnel, honoraires convenus, facturés, visés, payés. Le **budget indicatif** est calculé : (socle du domaine + le moindre de 2 % de l'enjeu et du plafond moins le socle) x coefficient de type (initiale 1, complémentaire 0,5, contradictoire 1,5, contre-expertise 1,5), arrondi à 5 000 FCFA, puis confirmé ou ajusté par le gestionnaire. **Viser** au-delà du convenu exige un **motif** ; le visa est donné par `RESP` ou `CPT` ; les honoraires ne sont jamais calculés au prorata de l'indemnité (écart relevé par l'audit de 2014). Un expert interne ne génère aucun honoraire. Les honoraires s'ajoutent à l'état des règlements (§5.8, règlement vers un tiers).

**Conséquences (testables) :**
- La date de rapport attendue est calculée à l'acceptation, selon le domaine ; un rapport non reçu à cette date apparaît dans les alertes du gestionnaire et du `RESP` (« rapport en retard »).
- Viser des honoraires supérieurs aux honoraires convenus sans motif est refusé (`MOTIF_OBLIGATOIRE`).
- Un `GEST` ne vise pas des honoraires (`DROIT_INSUFFISANT`) ; `RESP` et `CPT` le peuvent.
- Les cinq montants d'une mission sont affichés ensemble et jamais fondus.
- Les valeurs de socle, de coefficient, de plafond et de pourcentage du budget indicatif sont des paramètres ; les calculs les relisent à chaque mission.

### 5.6 Chiffrer (`EVALUE`)

Chiffrer, c'est établir le **décompte** : de quoi est fait le montant que la compagnie doit. Le décompte est un calcul explicable, poste par poste, jamais un chiffre tombé d'une grille. Les grilles en tranches de la démo (une par volet) ne servent **que** pour la provision d'ouverture et le pilotage (FR-49) ; elles ne font pas l'indemnité.

#### FR-69 : Le décompte suit un ordre fixe : dommage, vétusté, règle proportionnelle, plafond, franchise

Pour les sinistres qui ne sont pas du dommage corporel, le **décompte** enchaîne, dans cet ordre : le **dommage** constaté, la **vétusté**, la **règle proportionnelle** si elle s'applique, le **plafond** de la garantie, puis la **franchise** (ordre du code de la démo). Chaque étape est affichée avec sa valeur et sa source. La **franchise est déduite** du montant arrêté (écart avec la démo, où la déduction était une décision manuelle) : franchise retenue = le moindre du dommage et du plus grand de (dommage x taux de franchise) et (franchise minimale), le taux et le minimum étant lus sur la garantie souscrite. Le **plafond** est celui de la garantie ; la part au-dessus du plafond reste à la charge de l'assuré et est affichée. La **règle proportionnelle** (sous-assurance : capital assuré inférieur à la valeur réelle) multiplie par le rapport capital sur valeur et déclenche une alerte de sous-assurance `[ASSUMPTION: ordre de la démo ; à confirmer par la compagnie, ses conditions générales pouvant prévoir un autre ordre]`. Les plafonds, taux de franchise, minimums et délais viennent de la projection des contrats lue dans le LC (D4) ; Prospera ne les modifie pas.

**Conséquences (testables) :**
- Pour un dommage de 780 000 FCFA avec une franchise de 10 % et un minimum de 50 000 FCFA, la franchise retenue est 78 000 FCFA et l'indemnité 702 000 FCFA ; avec un dommage de 300 000 FCFA, la franchise est 50 000 FCFA (le minimum).
- Une franchise supérieure au dommage est ramenée au dommage ; l'indemnité n'est jamais négative.
- Un dommage supérieur au plafond donne un montant au plafond ; l'excédent à la charge de l'assuré est affiché sur l'écran et dans l'offre.
- Un capital assuré inférieur à la valeur réelle applique la règle proportionnelle et lève l'alerte « sous-assurance ».
- Chaque ligne du décompte (dommage, vétusté, proportionnelle, plafond, franchise) est stockée avec sa source et sa valeur ; elles se retrouvent à l'identique dans l'offre et dans « Pourquoi ce montant ? » (FR-74).

#### FR-70 : Le corporel se calcule poste par poste, selon le Code CIMA (art. 257 à 266)

Pour les dommages corporels (accident corporel de la circulation, accident du travail, décès), le décompte est un **calcul poste par poste** : « les seuls préjudices susceptibles d'être indemnisés sont ceux mentionnés aux articles 258 à 266 » (art. 257, SÛR), et le moteur n'en connaît **pas d'autres**. Les **postes** sont : frais (art. 258, plafonnés à 2 fois le tarif le plus élevé des hôpitaux publics du pays de l'accident, 1 fois en cas d'évacuation sanitaire) ; incapacité temporaire (art. 259, indemnité mensuelle plafonnée à 6 fois le SMIG annuel) ; incapacité permanente, en **trois postes** : physiologique (taux de 0 à 100 % selon le barème médical annexé, multiplié par la valeur du point, elle-même exprimée en pourcentage du SMIG annuel selon le taux et l'âge), économique (seulement si le taux est de 50 % au moins, plafond 10 fois le SMIG annuel), moral (seulement si le taux est de 80 % au moins, 2 fois le SMIG annuel) (art. 260) ; tierce personne (art. 261, si le taux est de 80 % au moins, sur prescription médicale confirmée par expertise, plafonnée à 50 % de l'indemnité d'incapacité) ; souffrance physique et préjudice esthétique, **indemnisés séparément** (art. 262, échelle en pourcentage du SMIG annuel) ; pertes de gains professionnels futurs (art. 263) ; préjudice scolaire (art. 263-1, 12 mois de bourse officielle) ; en cas de **décès** : frais funéraires (art. 264, plafond 2 fois le SMIG annuel), préjudice économique de chaque ayant droit (art. 265, capital de rente, revenu fictif d'un SMIG annuel à défaut de revenus justifiés, plafond global 85 fois le SMIG annuel), préjudice moral par bénéficiaire (art. 266). Le **SMIG** est un **paramètre daté** : celui du pays de l'accident ou, s'il est plus élevé, celui du pays de résidence de la victime (art. 259 et suivants) ; il n'est jamais codé en dur. Les **plafonds** sont des multiples du SMIG, paramétrés. Les **tables** (valeur du point d'incapacité permanente par taux et par âge, clés de répartition entre ayants droit, table de conversion des rentes, barème médical d'incapacité) sont des **images** du PDF officiel : leur **saisie** (double saisie et relecture, puis jeux d'essai chiffrés validés par un actuaire ou un juriste) est une **tâche du plan**, et la revue juridique précède la mise en service. Une offre **ne peut pas être inférieure** au barème (art. 231, al. 2) ; un écart sous le plancher est une alerte `OFFRE_SOUS_BAREME`. L'offre affiche chaque chef de préjudice (art. 243) et les créances des tiers payeurs (art. 246, 254-255). `[ASSUMPTION: SMIG du Togo 52 500 FCFA par mois depuis le 1er janvier 2023 (sources secondaires, texte officiel non trouvé), SMIG annuel = 12 fois le mensuel ; tout est paramètre daté, à confirmer par le juriste ; la lecture du plafond de l'art. 263 (« six mois de revenus plafonnés à trente-six fois ») est ambiguë et à faire valider]`.

**Conséquences (testables) :**
- Le décompte corporel affiche un poste par chef de préjudice de la liste de l'art. 257 à 266 et aucun autre ; ajouter un poste hors liste est refusé (`POSTE_HORS_BAREME`).
- Le préjudice économique de l'incapacité permanente est refusé sous 50 % de taux (`CONDITION_POSTE_NON_REMPLIE`) ; le préjudice moral et la tierce personne le sont sous 80 %.
- Changer la valeur du SMIG daté change les nouveaux décomptes ; il ne change pas ceux qui sont arrêtés (FR-75).
- Les tables saisies (valeur du point, répartition, conversion des rentes, barème médical) portent leur version, leur date, et deux saisies concordantes ; une table sans double saisie bloque l'utilisation du poste en production (`TABLE_NON_VALIDEE`).
- Une offre inférieure au barème est signalée et ne part pas sans motif du responsable (FR-77).
- Les créances de tiers payeurs sont saisies par poste ; un tiers payeur qui n'a pas produit sa créance dans les 6 mois de la demande est déchu (art. 254-255) : l'échéance est suivie.
- Les pièces et champs médicaux du dossier ne sont lisibles que des rôles de FR-63.

#### FR-71 : L'IA ne propose jamais de montant sur un préjudice corporel

**Aucune capacité de l'IA** (pré-remplissage, comparaison, explication, simulation, rédaction) ne **propose, suggère, devine ou pré-remplit un montant** sur un préjudice corporel. Ce montant est du ressort du **gestionnaire**, au vu de l'avis du **médecin-conseil** (qui dit le taux, jamais l'argent) et du barème. L'IA peut **expliquer** un décompte déjà calculé (FR-74) ; elle ne le **produit** pas. Cette règle est un garde-fou de la fiche IA (partie 4) : elle est testée comme telle.

**Conséquences (testables) :**
- Aucune réponse de l'IA sur un dossier corporel ne contient de montant qui ne vienne du décompte du gestionnaire ; un test soumet chaque usage de l'IA à un dossier corporel et n'obtient aucun montant produit par l'IA.
- Le pré-remplissage de l'instruction (FR-56) ne remplit aucun champ de montant corporel ; la comparaison au portefeuille (FR-65) n'affiche pas de médiane de montant corporel.
- Le registre de l'IA ne contient jamais d'entrée de niveau `RECOMMANDATION` ou `EXTRACTION` portant un montant corporel.
- Le `MED` n'a pas de champ de montant dans son écran ; il saisit des taux, des durées, des qualifications.

#### FR-72 : Le matériel automobile : vétusté sur pièces selon l'âge, et épave

Pour un dommage matériel automobile, la **vétusté s'applique aux pièces seulement**, selon l'**âge du véhicule** (grille indicative de la démo, en paramètre : jusqu'à 1 an 0 % ; jusqu'à 2 ans 10 % ; jusqu'à 3 ans 20 % ; jusqu'à 5 ans 30 % ; jusqu'à 8 ans 40 % ; au-delà 50 %). **Réparation retenue** = pièces x (1 moins la vétusté) + main-d'œuvre. Si le coût de remise en état (pièces plus main-d'œuvre) **dépasse la valeur vénale**, le véhicule est une **épave** : indemnité brute = valeur vénale moins valeur de l'épave ; la **décision de véhicule** (`A_DECIDER`, `REPARATION`, `EPAVE`) est validée, puis la **cession de l'épave** est préparée et son produit enregistré comme récupération. La franchise s'applique ensuite (FR-69), nulle en garantie RC seule `[ASSUMPTION: grille de vétusté indicative de la démo ; à remplacer par la grille de la compagnie]`. La **réparation** est suivie (véhicule entré, travaux, facture reçue, contrôle avant règlement) ; le montant que le garage peut facturer est le **montant autorisé**, tout supplément exigeant une demande motivée.

**Conséquences (testables) :**
- Un véhicule de 4 ans a une vétusté de 30 % sur les pièces et de 0 % sur la main-d'œuvre.
- Un véhicule dont pièces plus main-d'œuvre dépassent la valeur vénale passe en décision « épave » ; l'indemnité brute est la valeur vénale moins la valeur d'épave.
- Un montant facturé par le garage au-delà du montant autorisé sans demande motivée est refusé au contrôle avant règlement (`SUPPLEMENT_NON_AUTORISE`).
- Une garantie RC seule avec assuré fautif donne un montant de zéro et une alerte `BLOQUANT` (pas d'indemnité pour son propre véhicule).
- La grille de vétusté et le choix de la valeur vénale (cote du marché local, expertise) sont tracés dans l'évaluation.

#### FR-73 : Les autres types de sinistre, et l'arrondi

Les autres formulaires d'instruction calculent comme suit (valeurs de la démo, paramètres) : **biens** (incendie, dégât des eaux, habitation) : (dommage du bâtiment plus du contenu) x (1 moins la vétusté), plus un supplément éventuel (recherche de fuite), règle proportionnelle, plafond du capital, moins la franchise (25 000 FCFA par défaut) ; **vol** : valeur des objets x (1 moins la vétusté), plafonnée au capital, moins la franchise ; **transport** : valeur assurée x taux d'avarie, moins la franchise ; **responsabilité civile** : montant réclamé x part de responsabilité de l'assuré, plafonné à la garantie, moins la franchise, un dommage corporel renvoyant au décompte de FR-70 ; **divers** : montant réclamé x (1 moins l'abattement de 10 % par défaut), moins la franchise. Les montants sont **arrondis au multiple de 5 000 FCFA le plus proche** ; les montants du **corporel** sont arrondis **au franc** : le barème légal n'est pas arrondi `[ASSUMPTION: arrondi à 5 000 FCFA pour les non-corporels comme dans la démo, au franc pour le corporel ; à confirmer]`. Les délais de règlement et d'offre des autres branches ne sont **pas fixés par le Code CIMA** (pas de délai légal d'offre pour les seuls dommages aux biens, art. 231, dernier alinéa) : ils sont **contractuels ou internes**, paramétrés par produit (FR-85).

**Conséquences (testables) :**
- Pour un vol de 400 000 FCFA d'objets avec 20 % de vétusté et une franchise de 25 000 FCFA, l'indemnité calculée est 295 000 FCFA, arrondie au multiple de 5 000.
- Un montant corporel n'est pas arrondi à 5 000 : le décompte du poste est au franc.
- Chaque formulaire affiche l'indemnité calculée comme **repère** et ne l'écrit pas d'office dans le montant arrêté (FR-75).
- Les abattements, franchises par défaut et taux d'avarie sont des paramètres ; leur modification ne change pas les évaluations arrêtées.

#### FR-74 : « Pourquoi ce montant ? » : l'explication assistée par l'IA (usage n°9)

Sur un dossier évalué, l'IA commune **explique le montant** : d'où il vient, poste par poste.

- **Entrée :** le décompte arrêté (FR-69 à FR-73), la garantie souscrite (plafond, franchise, exclusions), les expertises validées et le dossier.
- **Sortie :** une explication en langage clair : la garantie qui répond, le dommage retenu et sa source, la vétusté et son calcul, la franchise, le plafond, la règle proportionnelle, le barème et la tranche pour le pilotage, la part du tiers, la comparaison au portefeuille (comparables du même type, du même volet et de la même gravité, au moins 12) avec l'écart en pourcentage ; **chaque phrase renvoie à sa source** (pièce, police, barème, mission). Pour un dossier corporel, l'IA explique le **calcul** déjà établi par le gestionnaire (postes, SMIG, taux) sans le refaire.
- **Destinataire :** le gestionnaire, le responsable qui valide, l'assuré qui demande, l'auditeur, le juge : le montant doit être « défendable devant l'assuré, l'auditeur ou le juge ».
- **Garde-fou :** lecture seule ; **le texte ne contient aucun chiffre qui ne soit dans le décompte** ; il ne change pas entre deux consultations ; une comparaison n'est pas une règle ; aucun montant corporel n'est produit (FR-71).
- Servi par l'**IA commune** ; sans modèle, un gabarit de texte alimenté par le décompte fait le même travail et le dit.

**Conséquences (testables) :**
- Pour chaque dossier évalué, l'explication reprend, dans l'ordre, les lignes du décompte avec les mêmes valeurs ; un test compare les chiffres du texte à ceux du décompte.
- Chaque phrase de l'explication a un lien vers sa source ; une phrase sans source n'est pas produite.
- L'explication d'un dossier corporel ne contient aucun montant absent du décompte du gestionnaire.
- Deux consultations successives donnent le même texte tant que le dossier n'a pas changé.
- L'usage va au registre de l'IA (niveau `ANALYSE`).

#### FR-75 : Une évaluation arrêtée n'est jamais recalculée ; les cinq montants ne se confondent pas

Le gestionnaire **enregistre l'évaluation** (`EN_INSTRUCTION → EVALUE`) en **arrêtant un montant**. Le champ est **pré-rempli avec le chiffrage validé par l'expertise** quand il existe ; le calcul d'instruction technique est affiché comme **repère**, jamais écrit d'office ; **s'il diffère** du chiffrage validé, un **motif est obligatoire**. Il faut : toutes les pièces obligatoires, toutes les expertises closes (FR-61), la garantie décidée (FR-42), un montant supérieur à zéro, et aucune alerte bloquante non levée. L'évaluation **mémorise** le barème, la tranche, la valeur du SMIG, les grilles et les paramètres du moment. **Une évaluation arrêtée n'est jamais recalculée** quand le barème, le SMIG ou une grille change : un changement ne s'applique qu'aux dossiers évalués après lui. Le dossier est jugé selon le **référentiel en vigueur à sa date de survenance**. Si le gestionnaire doit corriger, il **arrête une nouvelle évaluation** (nouvelle version, avec motif) ; l'ancienne reste consultable. Cinq montants sont toujours affichés séparément : **évalué** (le décompte), **proposé** (l'offre faite à l'assuré), **validé** (la décision selon la délégation), **payé**, **reste à payer** ; plus la **provision**.

**Conséquences (testables) :**
- Passer en `EVALUE` sans montant ou avec un montant nul est refusé (`MONTANT_NUL`) ; avec une pièce obligatoire manquante, `PIECES_OBLIGATOIRES_MANQUANTES` ; avec une expertise ouverte, `EXPERTISE_NON_CLOSE` ; sans décision de garantie, `GARANTIE_NON_DECIDEE`.
- Un montant différent du chiffrage validé par l'expertise sans motif est refusé (`MOTIF_OBLIGATOIRE`).
- Après changement du barème ou du SMIG, un dossier déjà évalué garde le montant, les références et les valeurs du moment ; un test change la grille et vérifie que l'évaluation ne bouge pas.
- Une nouvelle évaluation crée une version avec motif ; l'ancienne reste lisible ; l'historique des versions est visible.
- Les cinq montants s'affichent côte à côte sur la fiche ; aucun écran ne les fond ; le reste à payer = validé moins payé.
- Un dossier est calculé selon la version du référentiel en vigueur à sa date de survenance, pas à sa date d'évaluation.

#### FR-76 : La provision est revue à chaque événement, avec un motif

La **provision du dossier** (la charge estimée) est **revue à chaque événement** : rapport d'expertise, devis, certificat médical, rapport de police, application du barème, validation hiérarchique, régularisation, clôture. À l'**évaluation**, la provision s'aligne sur le montant évalué, avec une **ligne distincte** « provision réajustée à l'évaluation » (avant, après, motif). Chaque mouvement est **ajouté**, **jamais écrasé** : numéro d'ordre, date, montant avant et après, motif, auteur, pièce justificative. Le **motif est obligatoire** et le nouveau montant doit différer de l'actuel. Un **écart supérieur ou égal à 2 000 000 FCFA** entre ancienne et nouvelle provision **attend le responsable** quand c'est un gestionnaire qui le propose `[ASSUMPTION: 2 000 000 FCFA, valeur de la démo ; à confirmer avec la matrice de délégation]`. Une provision **sans mouvement depuis 90 jours** et une provision **de plus de 15 % d'écart** avec l'estimation sont signalées « à revoir ». Prospera produit l'**état** de ces provisions par dossier, par exercice de survenance, brut, cédé et net selon les traités de réassurance et les clés de coassurance (D12) : la comptabilité officielle reste hors de Prospera.

**Conséquences (testables) :**
- Réviser sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; réviser au même montant est refusé (`MONTANT_INCHANGE`).
- Chaque révision ajoute une ligne à l'historique ; la dernière provision est la dernière ligne ; aucune ligne n'est modifiée ni supprimée.
- Une révision de 2 500 000 FCFA proposée par un gestionnaire passe `EN_ATTENTE_RESP` et ne change pas la provision courante tant que le `RESP` ne l'a pas acceptée ; sous le seuil, elle est immédiate.
- Une requalification de la responsabilité ou un rapport d'expertise déclenche une alerte « provision à revoir » si l'écart avec le dernier chiffrage dépasse 15 %.
- Une provision sans mouvement depuis 90 jours apparaît dans la liste « à revoir » du `RESP`.

### 5.7 Décider et offrir (`EN_VALIDATION`, `OFFRE_ENVOYEE`)

Dans la démo, le circuit passe de la validation à l'ordre de règlement ; l'offre n'existe que comme modèle de courrier. Ici, **l'offre et l'accord de l'assuré sont une étape** : on ne prépare le paiement qu'après l'accord enregistré. C'est la procédure du groupe (offre validée envoyée sous 48 h, paiement préparé après accord) et le Code CIMA pour le corporel.

#### FR-77 : Envoyer en validation avec une fiche de décision préparée

Quand le montant est arrêté (`EVALUE`), le gestionnaire **envoie le dossier en validation** (`EVALUE → EN_VALIDATION`). Prospera prépare une **fiche de décision** pour le signataire : points forts (pièces complètes, expertises closes, cohérence avec les dossiers comparables, aucun signal de fraude significatif, part du tiers arrêtée et montant du recours à engager) et **points de vigilance** (dossier hors délai et de combien de jours, déclaration tardive, franchise, plafond, exclusions à écarter, sous-assurance, offre sous le barème au corporel, écart au chiffrage de l'expert, prescription de deux ans de l'action dérivant du contrat : art. 28 du Code CIMA, SÛR, à vérifier par le juriste pour chaque cas). Le signataire peut demander à l'IA commune de **proposer un texte de motif** ; **le motif reste obligatoire et humain** : le signataire le relit, le modifie et le confirme.

**Conséquences (testables) :**
- `EVALUE → EN_VALIDATION` exige un montant arrêté ; sans montant, refus `MONTANT_NUL`.
- La fiche de décision liste les points forts et les vigilances avec leur source (pièce, police, mission, comparable) ; elle ne contient aucun montant corporel produit par l'IA (FR-71).
- Confirmer une décision sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; un motif proposé par l'IA n'est pas enregistré tant que le signataire ne l'a pas confirmé, et son auteur final est le signataire.
- Le gestionnaire qui a instruit voit la décision en lecture ; l'action « valider » lui est fermée avec la raison (FR-81).
- La fiche est conservée avec la décision et lisible de `AUD`.

#### FR-78 : Une matrice de délégation à plusieurs niveaux, paramétrable

La validation se fait selon une **matrice de délégation** paramétrable. Une ligne de la matrice porte : un **niveau**, les **rôles signataires**, le **quorum**, la **plage de montant**, le **volet** et la **nature** (indemnité, honoraires, acompte, règlement à titre commercial). Les défauts, **à remplacer par les délégations réelles de la compagnie** `[ASSUMPTION: défauts tirés de la procédure de la compagnie du même groupe au Sénégal (mémoire de 2014 et récit du PO) ; délégations réelles à obtenir à la séance d'immersion]`, sont : **jusqu'à 1 000 000 FCFA** : le responsable des sinistres ; **au-dessus de 1 000 000 FCFA** : le **comité sinistres** (FR-79), puis le **visa du directeur technique** ; **règlement à titre commercial** (hors garantie, motivé par la compagnie) : le **DG seul**, quel que soit le montant. Le **cumul des montants validés d'un même dossier** décide du niveau : c'est la règle **anti-fractionnement** (un dossier en tranches chacune sous le seuil mais dont le cumul le dépasse relève du niveau supérieur). Un montant qui dépasse la délégation du signataire est refusé, avec le niveau requis nommé.

**Conséquences (testables) :**
- Une indemnité de 900 000 FCFA est validée par `RESP` seul ; elle est refusée au `GEST` (`DROIT_INSUFFISANT`).
- Une indemnité de 1 500 000 FCFA ne se valide pas par `RESP` seul : la validation exige la décision du comité et le visa du `DT` ; sinon `DELEGATION_INSUFFISANTE`, avec « niveau requis : comité sinistres ».
- Un règlement à titre commercial n'est validé que par le `DG`, même pour 50 000 FCFA ; un autre rôle reçoit `DELEGATION_INSUFFISANTE`.
- Deux validations de 800 000 FCFA sur le même dossier déclenchent le niveau du cumul de 1 600 000 FCFA ; la seconde est refusée au niveau `RESP` seul (`FRACTIONNEMENT_DETECTE`).
- La matrice est modifiable par `ADMIN` avec double contrôle du `DG` ; une modification ne change pas les décisions déjà prises et est journalisée avec auteur et date.
- L'état des délégations exercées (dossiers validés par niveau sur 30 jours) est visible du `DG` et de `AUD`.

#### FR-79 : Le comité sinistres : quorum, votes, procès-verbal de séance

Le **comité sinistres** est une **instance** (non un rôle). Défauts : **4 membres** dont le responsable des sinistres et le directeur technique, **quorum de 3** `[ASSUMPTION: composition et quorum du comité du groupe au Sénégal ; à confirmer]`. Le comité se réunit sur une **liste de dossiers** préparée par le `RESP` ; chaque dossier est présenté avec sa fiche de décision. **Chaque membre présent vote** (`POUR`, `CONTRE`, `ABSTENTION`) avec son nom ; la décision est prise à la **majorité des membres présents** `[ASSUMPTION: majorité simple des présents ; à confirmer]`. Un membre ne vote pas sur un dossier qu'il a instruit lui-même. À la fin de la séance, Prospera produit le **procès-verbal de séance** : date, membres convoqués et présents, quorum, dossiers examinés, vote de chacun, décision et motifs ; il est signé et rangé au dossier de chaque sinistre examiné et aux archives du comité. Après la décision du comité, le **visa du directeur technique** est demandé ; il est refusé ou accordé avec motif.

**Conséquences (testables) :**
- Une séance avec 2 membres présents sur 4 ne peut pas statuer : `QUORUM_NON_ATTEINT` ; aucune décision n'est enregistrée.
- Le vote de chaque membre est enregistré avec son nom ; un membre qui a instruit le dossier est exclu du vote de ce dossier (`SEPARATION_DES_TACHES`).
- Le procès-verbal de séance est généré avec tous les dossiers examinés et reste lisible de `AUD` ; il ne se modifie pas après signature.
- Sans visa du `DT` après la décision du comité, le dossier ne passe pas à `OFFRE_ENVOYEE` (`VISA_DT_MANQUANT`).
- Une décision « refus du comité » exige un motif et renvoie le dossier selon FR-80.
- Le comité ne se réunit pas pour un dossier à signal de fraude bloquant non écarté (`SIGNAL_FRAUDE_BLOQUANT`).

#### FR-80 : Tolérances affichées au signataire, et renvoi motivé

Au moment de décider, l'écran affiche des **tolérances**, sous forme de **réserves non bloquantes** : écart entre le **montant arrêté** et la **proposition de l'expert** (10 % par défaut) ; écart entre l'**indemnité** et la **provision** (25 % par défaut). Elles informent le signataire, elles n'interdisent rien ; **seul un signal de fraude bloquant** non écarté ferme la décision. Le signataire peut aussi : **renvoyer en instruction** pour réévaluation (`EN_VALIDATION → EN_INSTRUCTION`), **demander des pièces avant validation** (`EN_VALIDATION → PIECES_ATTENDUES`), ou **refuser la prise en charge** (`EN_VALIDATION → REJETE`, refus motivé, courrier de refus §5.12). Chacune de ces issues exige un **motif écrit**.

**Conséquences (testables) :**
- Un montant arrêté s'écartant de 12 % de la proposition de l'expert affiche la réserve « écart au chiffrage de l'expert » ; la décision reste possible.
- Un dossier dont le signal de fraude est bloquant et non écarté ne peut pas être validé (`SIGNAL_FRAUDE_BLOQUANT`).
- Renvoyer en instruction sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; le motif est affiché au gestionnaire dans sa file.
- Un refus de prise en charge à ce stade met le reste à payer à zéro, et le dossier devient `REJETE`.
- Les seuils de 10 % et 25 % sont des paramètres ; leur modification ne change pas les décisions déjà prises.

#### FR-81 : Séparation des tâches : celui qui décide ne paie pas

Trois règles de séparation sont gardées côté serveur, quel que soit l'écran : **(1)** le gestionnaire qui a instruit le dossier **ne valide pas** son propre règlement ni sa propre indemnité ; **(2)** **celui qui décide ne paie pas** : le signataire de la validation n'émet pas l'ordre de règlement (la comptabilité émet) ; **(3)** le **seuil de délégation** est respecté (FR-78). Chaque règle a un contrôle permanent du contrôle interne : un constat est `CONFORME`, `ALERTE` ou `VIOLATION`, avec la règle et le détail. Le défaut relevé par l'audit de 2014 (le même rédacteur qui instruit et ordonnance l'indemnité) est ainsi fermé.

**Conséquences (testables) :**
- Un `GEST` qui a instruit un dossier ne peut pas le valider, quel que soit son niveau de délégation : refus `SEPARATION_DES_TACHES`.
- Un `RESP` qui a validé l'indemnité ne peut pas émettre le règlement ; seul `CPT` émet (§5.8).
- Un utilisateur qui cumule deux rôles ne peut pas tenir les deux fonctions incompatibles sur un même dossier (le contrôle regarde la personne, pas le rôle).
- Chaque refus pour séparation des tâches crée un constat visible de `AUD`, avec la règle et le détail.
- Tenter d'ordonner le règlement d'un dossier fractionné sous le seuil est un constat `VIOLATION`, pas seulement un refus.

#### FR-82 : L'offre est préparée, définitive ou provisionnelle

Après validation, Prospera **prépare l'offre** (modèle `OFFRE_INDEMNISATION`) à partir du décompte : bénéficiaire, montant **proposé**, détail du décompte (dommage, vétusté, franchise, plafond, règle proportionnelle ; ou, au corporel, **chaque chef de préjudice** de l'art. 243 avec les sommes revenant au bénéficiaire, les limitations et exclusions retenues et leurs motifs, et les **créances de chaque tiers payeur** avec copie des décomptes : art. 246), l'excédent éventuel à la charge de l'assuré, le **délai pour répondre**, le nom du gestionnaire du dossier (art. 242) et les **mentions légales** du corporel : possibilité d'obtenir la copie du procès-verbal et de se faire assister d'un conseil à ses frais (art. 232), **droit de dénoncer la transaction par lettre recommandée dans les 15 jours, en caractères très apparents, à peine de nullité relative** (art. 235) ; le paiement est libellé **au nom de la victime ou des ayants droit** (art. 232). L'offre est **provisionnelle** au corporel quand la consolidation n'est pas connue 6 mois après l'accident (FR-85) : elle couvre alors ce qui est déjà établi (frais, incapacité temporaire) et l'offre **définitive** suit après la consolidation. Au corporel, l'accord prend la forme d'un **procès-verbal de transaction**.

**Conséquences (testables) :**
- L'offre n'existe qu'à partir d'une validation selon la délégation ; sans validation, la préparation est refusée (`OFFRE_NON_VALIDEE`).
- Le montant proposé de l'offre est celui du montant validé ; un écart entre le montant proposé et le montant validé est refusé.
- L'offre corporelle contient les mentions de l'art. 232, le nom du gestionnaire, le droit de dénonciation de l'art. 235 en caractères très apparents ; un modèle d'offre corporelle sans l'une de ces mentions est refusé (`MENTION_LEGALE_ABSENTE`).
- L'offre provisionnelle est marquée comme telle, ne couvre que les postes établis, et est suivie d'une offre définitive dans le délai de FR-85.
- Un bénéficiaire de paiement différent de la victime ou des ayants droit sur un dossier corporel est refusé au moment de l'ordre (§5.8).

#### FR-83 : L'offre est rédigée par l'IA, relue et signée par l'agent (usage n°11)

Le courrier d'offre est **rédigé par l'IA commune** à partir du modèle de la compagnie et du décompte.

- **Entrée :** le décompte arrêté, la décision, le modèle de courrier de la compagnie, les mentions légales du type de dossier, l'historique des échanges.
- **Sortie :** un **brouillon** d'offre complet, avec les chiffres exactement repris du décompte et les mentions légales ; un ton adapté au destinataire (assuré, victime, avocat).
- **Destinataire :** l'agent qui **relit, modifie et signe** ; seul son geste fait passer l'offre de `BROUILLON` à `A_IMPRIMER` ou `ENVOYE`.
- **Garde-fou :** l'IA **ne signe pas**, **n'envoie pas** ; tout chiffre du texte est celui du décompte (un contrôle automatique compare le texte au décompte avant la signature et refuse l'écart) ; les mentions légales ne sont **pas modifiables** par l'IA ; aucune donnée médicale du dossier n'est répétée dans le texte au-delà de ce que le modèle exige ; l'usage va au registre de l'IA.
- Servi par l'**IA commune** ; sans modèle, le courrier se produit par publipostage du modèle et du décompte (aucune rédaction libre).

**Conséquences (testables) :**
- Le brouillon reprend chaque montant du décompte à l'identique ; un montant du texte qui diffère du décompte bloque la signature (`TEXTE_ECART_DECOMPTE`).
- Signer sans relecture (sans action de l'agent) est impossible : l'offre reste `BROUILLON`.
- Les mentions légales d'un brouillon corporel sont celles du modèle verrouillé ; une modification par l'agent de ces mentions est refusée (`MENTION_LEGALE_VERROUILLEE`).
- Avec l'IA coupée, l'offre se génère par publipostage et se signe de la même façon.
- Chaque brouillon et sa version finale sont conservés au dossier avec l'auteur de la signature.

#### FR-84 : L'offre validée part sous 48 heures

Une fois la décision prise (visa du `DT` compris), l'offre doit être **envoyée sous 48 heures** (paramètre, valeur du mémoire `[ASSUMPTION: 48 heures ouvrées, comme dans la procédure du groupe]`). L'envoi (`EN_VALIDATION → OFFRE_ENVOYEE`) est un acte qui enregistre : le **canal** (remise en main propre, courrier, e-mail, SMS pour l'avis, WhatsApp), la **date et l'heure**, la **personne** qui envoie et la **preuve** d'envoi (accusé, décharge, récépissé). Un dossier validé et non envoyé après 48 heures est une **alerte** au `RESP`. Au corporel, le **procès-verbal de transaction** est communiqué aux bénéficiaires ou à leur avocat **sous 24 heures** après sa soumission au directeur technique `[ASSUMPTION: 24 heures, valeur du mémoire de 2014]`.

**Conséquences (testables) :**
- `EN_VALIDATION → OFFRE_ENVOYEE` exige : une décision validée selon la délégation, la signature de l'agent, un canal et une preuve ; sinon refus `OFFRE_NON_VALIDEE` ou `PREUVE_ENVOI_ABSENTE`.
- Un dossier validé depuis plus de 48 heures sans envoi apparaît dans les alertes du `RESP`, avec le retard en heures.
- La date et l'heure d'envoi servent de point de départ aux relances (FR-89) et au délai de réponse de l'assuré.
- Un envoi sur un canal inconnu du dossier (téléphone ou adresse absents) est refusé (`CANAL_INJOIGNABLE`).
- L'offre envoyée est classée au dossier, non modifiable ; une correction passe par une nouvelle offre (FR-87).

#### FR-85 : Les délais légaux du corporel et la pénalité de 5 % par mois, séparés des délais internes

Pour les victimes d'une **atteinte à la personne causée par un véhicule terrestre à moteur** (art. 225 et 231 du Code CIMA, SÛR), le dossier corporel porte un **chronomètre réglementaire** : **offre dans les 12 mois de l'accident** ; en cas de **décès**, offre aux ayants droit **dans les 8 mois du décès** ; **offre provisionnelle** quand l'assureur n'a pas été informé de la consolidation dans les 6 mois de l'accident, l'**offre définitive** devant alors être faite **dans les 6 mois de l'information de consolidation** ; **réponse** à une demande motivée de la victime **sous 30 jours** (art. 231). Les délais sont **prorogés ou suspendus**, et chaque suspension est tracée avec sa cause et ses dates : assureur non avisé dans le mois (art. 247) ; décès plus d'un mois après l'accident (art. 248) ; pièces demandées non reçues ou incomplètes dans les **6 semaines** de la présentation de la demande (art. 249 et 250) ; nouvelle demande dans le mois suivant une réponse incomplète (art. 251) ; refus d'examen ou contestation médicale et expert commun, **+1 mois** (art. 252 et 252 bis) ; victime résidant à l'étranger (art. 253). Passé le délai, **l'indemnité produit de plein droit un intérêt de retard de 5 % par mois de retard** (art. 233), que Prospera **calcule et affiche** ; la pénalité est **réduite ou annulée** pour circonstances non imputables à l'assureur, avec un motif saisi ; la **base de calcul** (l'indemnité) est un point d'interprétation à faire valider `[ASSUMPTION: pénalité calculée sur le montant de l'offre ; provision du risque de pénalité tenue dans le dossier ; à faire valider par le juriste]`. Ces délais sont **réglementaires et non modifiables** par la compagnie. Les délais du **matériel et des autres branches** ne sont pas fixés par le Code CIMA : ils sont **contractuels ou internes**, paramétrés par produit. Les délais internes de la démo sont repris en défauts, comme **alertes internes**, avec leur point de départ et d'arrêt : accusé de réception 10 jours depuis la déclaration, arrêté à l'ouverture ; offre **90 jours** (corporel), **60** (matériel), **75** (autre) depuis la réception du dossier complet, arrêtée à l'envoi de l'offre ; délai de traitement du volet **45**, **21**, **30** et **90 jours** (recours) depuis la déclaration. Un dossier est jugé selon le référentiel en vigueur à sa **date de survenance**.

**Conséquences (testables) :**
- Un dossier corporel VTM avec accident au 1er mars affiche l'échéance d'offre au 1er mars de l'année suivante ; un décès au 10 avril sur un accident du 1er avril affiche 8 mois à compter du décès.
- Une demande de pièces présentée le 1er mai et non satisfaite suspend le délai à partir de la 6e semaine, avec la cause (art. 249) ; la reprise de réponse lève la suspension.
- Un dossier corporel sans offre au-delà de l'échéance calcule et affiche la pénalité de 5 % par mois ; saisir « circonstances non imputables » avec un motif réduit ou annule la pénalité et journalise l'auteur.
- Les délais légaux ne figurent pas dans la liste des paramètres modifiables de la compagnie ; un `ADMIN` ne peut pas les changer (`PARAMETRE_REGLEMENTAIRE`).
- Un dossier matériel affiche des échéances **internes** (offre à 60 jours après dossier complet) et non une pénalité légale ; l'alerte dit « délai interne ».
- L'échéance d'une alerte interne a un point de départ et un point d'arrêt visibles ; modifier le paramètre ne déplace pas les échéances des dossiers déjà ouverts.
- Un dossier est calculé selon le référentiel en vigueur à sa date de survenance (test avec deux versions du référentiel).

#### FR-86 : L'accord est enregistré ; aucun ordre sans accord

L'accord de l'assuré ou de la victime est **enregistré** dans le dossier : l'**offre signée**, ou, au corporel, le **procès-verbal de transaction** signé, avec la date. Seul cet enregistrement fait passer le dossier de `OFFRE_ENVOYEE` à `ORDRE_EMIS` : **aucun ordre de règlement sans accord enregistré**. Au corporel, la victime peut **dénoncer** la transaction par lettre recommandée dans les 15 jours de sa conclusion (art. 235) : le paiement n'est dû qu'après ce délai et son échéance est calculée (§5.8). Pour un **mineur** ou un **incapable**, la transaction est soumise aux parents vivants ou au juge des tutelles ou au conseil de famille, avec avis au juge au moins 15 jours avant le paiement d'une somme ou du premier arrérage de rente ; sans cela, transaction et paiement sont annulables (art. 234) `[ASSUMPTION: workflow mineurs et incapables : pièce d'autorisation exigée avant l'ordre ; à valider par le juriste]`.

**Conséquences (testables) :**
- `OFFRE_ENVOYEE → ORDRE_EMIS` exige un accord enregistré (offre signée ou procès-verbal de transaction) ; sans lui, refus `ACCORD_NON_ENREGISTRE`.
- Un accord enregistré sans pièce signée jointe est refusé (`PIECE_ACCORD_ABSENTE`).
- Au corporel, une transaction enregistrée affiche la date limite de dénonciation (15 jours) ; si la victime dénonce dans ce délai, le dossier revient à `OFFRE_ENVOYEE` avec un motif et la nouvelle échéance.
- Pour un bénéficiaire mineur ou incapable sans pièce d'autorisation, l'ordre est refusé (`AUTORISATION_REPRESENTANT_ABSENTE`).
- L'accord est horodaté avec le nom de l'agent qui l'a enregistré.

#### FR-87 : Une contre-proposition rouvre l'instruction avec un motif

Si l'assuré ou la victime **répond par une contre-proposition** (un montant différent), l'agent l'**enregistre** avec le **montant demandé** (obligatoire) et le **motif** : le dossier **retourne en instruction** (`OFFRE_ENVOYEE → EN_INSTRUCTION`). Le gestionnaire reprend l'évaluation (nouvelle évaluation versionnée, FR-75), éventuellement avec une expertise ou un complément ; une **nouvelle offre** est ensuite validée et envoyée selon FR-77 à FR-84. L'ancienne offre reste consultable. La contre-proposition suspend les relances de FR-89.

**Conséquences (testables) :**
- Enregistrer une contre-proposition sans montant est refusé (`MONTANT_CONTRE_PROPOSITION_ABSENT`) ; sans motif, `MOTIF_OBLIGATOIRE`.
- Le dossier repasse `EN_INSTRUCTION` avec son titulaire ; les offres successives sont toutes conservées avec leur date et leur auteur.
- La nouvelle offre exige une nouvelle validation selon la délégation, calculée sur le nouveau montant et le cumul.
- Le dossier garde l'historique : offre n°1, contre-proposition, offre n°2.

#### FR-88 : Un refus de l'offre mène au litige et à la contre-expertise

Si l'assuré ou la victime **refuse l'offre** (sans contre-proposition chiffrée, ou après plusieurs échanges), l'agent enregistre le **refus** avec un **motif obligatoire** et le dossier passe à `LITIGE` (`OFFRE_ENVOYEE → LITIGE`). La victime ou l'assuré peut **demander une contre-expertise** (FR-66, ordonnée par `RESP`, `DG` ou `DT`). Le litige est géré par `RESP` ou `DG` (§5.12) ; il se résout par un accord (retour à `EN_INSTRUCTION`), une décision définitive ou un contentieux. Pour le **corporel VTM**, l'action en justice ne peut être portée qu'à l'**expiration du délai d'offre** (art. 239) : la saisine anticipée est signalée. Le délai d'offre légal continue de courir ; la pénalité de 5 % par mois reste affichée (FR-85).

**Conséquences (testables) :**
- Enregistrer un refus sans motif est refusé (`MOTIF_OBLIGATOIRE`) ; le dossier passe `LITIGE` et le motif est conservé.
- Un `GEST` ne peut pas constater un litige (`DROIT_INSUFFISANT`) ; `RESP` ou `DG` le peuvent.
- Un refus avec demande de contre-expertise ouvre l'action d'ordonner la contre-expertise aux seuls `RESP`, `DG`, `DT`.
- Pendant le `LITIGE`, aucun ordre de règlement ne peut être émis sur le montant refusé ; seul un règlement de la part non contestée, avec accord enregistré, est possible.
- Un litige résolu rouvre `EN_INSTRUCTION` avec motif.

#### FR-89 : Une offre sans réponse déclenche des relances et une alerte

Une offre envoyée sans réponse est **relancée** : première **relance à 15 jours** après l'envoi, **alerte au responsable à 30 jours** (paramètres `delai_relance_offre_jours` et `delai_alerte_offre_jours`) `[ASSUMPTION: J+15 et J+30 comme dans la décision de cadrage ; à confirmer]`. Le texte de la relance est rédigé comme en FR-47 (envoi par l'agent, jamais seul). À la **troisième relance sans effet**, le système propose un arbitrage : classement `SANS_SUITE` motivé, appel, visite. Au corporel, le silence ne dispense pas la compagnie de son **délai légal** : le chronomètre de FR-85 continue de courir, et une pénalité peut s'afficher.

**Conséquences (testables) :**
- Une offre envoyée depuis 15 jours sans réponse produit une relance proposée ; à 30 jours, une alerte au `RESP` avec l'ancienneté.
- La relance est journalisée (canal, date, auteur) ; aucun envoi automatique.
- À la troisième relance sans effet, l'écran propose l'arbitrage et n'ajoute pas de relance par défaut.
- Classer `SANS_SUITE` exige un motif et la trace des relances effectuées (`RELANCES_NON_TRACEES` sinon).
- Un dossier corporel avec offre sans réponse continue d'afficher son chronomètre légal.

### Écarts avec la démo relevés

Ce que ce chapitre change par rapport au code de la démo, aux scénarios joués et à la spécification (le code fait foi sur la spécification, le récit du PO fait foi sur le code) :

- **Statuts :** `PIECES_INCOMPLETES` devient `PIECES_ATTENDUES`, `EN_ETUDE` devient `EN_INSTRUCTION`, `VALIDATION` devient `EN_VALIDATION`, **`OFFRE_ENVOYEE` est ajouté**, `RECOURS` cesse d'être un statut (15 statuts de la démo, 11 ici).
- **L'offre et l'accord sont une étape** : la démo va de la validation à l'ordre de règlement ; ici, aucun ordre sans accord enregistré (FR-82 à FR-86).
- **La validation se fait à plusieurs niveaux** (matrice, comité, visa du `DT`, `DG` pour le commercial, anti-fractionnement) ; la démo n'a qu'un seuil de 2 000 000 FCFA (FR-78, FR-79).
- **Une voie « accord sur devis »** sans expert sous 300 000 et 200 000 FCFA ; la démo envoie tout en expertise (FR-59).
- **Le contrôle de garantie ne se saute plus** ; dans la démo, une garantie « engageable » calculée suffisait (FR-42).
- **La franchise est déduite du montant arrêté** ; dans la démo, sa déduction était une décision manuelle (FR-69).
- **La déclaration tardive** donne une réserve et un motif, jamais une déchéance automatique, et la décision revient au `RESP` (FR-43).
- **Le corporel est un calcul poste par poste** du Code CIMA (art. 257 à 266) ; la démo le traitait par tranches et par une interpolation simplifiée de l'incapacité permanente, sans valeur de point ni table de capitalisation (FR-70). Les grilles en tranches ne servent plus qu'à la provision d'ouverture.
- **Un complément d'expert non revenu bloque la validation** sauf passage outre motivé du `RESP` ; la démo l'avertissait seulement (FR-67).
- **Un cabinet sans compte** voit son rapport saisi par le gestionnaire avec pièce jointe et marque (FR-67).
- **Les délais légaux et internes sont séparés** : la démo présentait comme « réglementaires » des délais d'offre de 90, 60 et 75 jours qui sont des délais internes ; le Code CIMA fixe 12 mois à compter de l'accident et 8 mois à compter du décès pour le corporel VTM, avec une pénalité de 5 % par mois (FR-85). La démo citait aussi « 365 jours, art. 231 » dans un résumé et « art. 28 » pour 730 jours : ces rapprochements sont remplacés par FR-85 et le rappel de prescription de FR-77.
- **Le référentiel de délais cité par la démo** (un règlement CIMA daté de juillet 2026 selon son code) n'est **pas vérifié** : ce PRD ne le cite pas.
- **Le recours naît à l'ouverture** si un tiers est en cause (relance tous les 15 jours) et se poursuit en parallèle ; la démo le créait à la sortie du dossier (FR-32, FR-54).
- **La provision d'ouverture est posée à l'ouverture**, même en attente de pièces ; sa révision exige un motif et se garde en historique (FR-49, FR-76).
- **L'IA est réelle** (usages 1, 3, 4, 7, 8, 9, 11 et orientation, complétude, comparaison) et servie par l'IA commune ; la démo simulait tout par des règles et des tirages. **La lecture par OCR est réelle** ; la démo ne lisait que la couche texte des PDF. Le **vocal** de la démo (transcription factice) est supprimé (FR-35). L'analyse d'un dossier ne change plus entre deux consultations (FR-60, FR-74).
- **Le numéro de sinistre** vient du logiciel de la compagnie ; la démo l'attribuait elle-même sous la forme `SIN-AAAA-NNNN`. La référence de déclaration `DEC-` est ajoutée (FR-36, FR-37).
- **Le contrôle de doublon** couvre aussi les sinistres reçus du logiciel de la compagnie (FR-38).
- **Les rôles** passent de 11 à 14 (`DT`, `MED` et `ARCH` sont ajoutés ; `GED` devient `NUM`) ; le **comité sinistres** est une instance, pas un rôle.
- **Les experts et missions** : la machine de la démo est conservée et réécrite (FR-61) ; la **contre-expertise** par `RESP`, `DG` ou `DT` seulement (la démo : `RESP` et `DIRECTION`) (FR-66).
- **Les valeurs de la démo** (seuils, délais, grilles, barèmes, catalogue de prix, poids de fraude) sont des **paramètres de la compagnie**, pas des règles du produit ; plusieurs sont des repères « indicatifs » qui devront être remplacés après la séance d'immersion.
- **Ce que le PRD n'a pas pu vérifier** : les barèmes de vétusté, la valeur du SMIG, les tables d'incapacité, les seuils de délégation de la compagnie, ses modèles de courriers et sa liste d'experts agréés sont tous à obtenir (récit du PO §6) ; aucune pièce de référence n'est togolaise (convention d'expertise tunisienne, mémoire et formulaires du Fonds de garantie sénégalais).

### 5.8 Payer : de l'ordre de règlement à la remise

Cette section couvre la phase 7 du circuit : `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE`. Elle suit la règle du PO : **celui qui décide ne paie pas**. Le service sinistres décide et émet l'ordre de règlement ; la comptabilité (`CPT`) émet le règlement ; le guichet (`ACC` ou `CPT`) le remet contre quittance signée. La comptabilité officielle reste hors de Prospera (§5.8, FR-103). Les moyens électroniques passent par le module partagé `paiement` (§7). La validation et l'offre sont décrites au §5.7 ; ici, on part d'un montant validé et d'une offre envoyée.

Deux mots à ne pas confondre dans cette section : l'**ordre de règlement** est la décision écrite de payer (il est « émis » par le service sinistres, statut `ORDRE_EMIS`) ; le **règlement** est le paiement lui-même (chèque, virement, Mobile Money), exécuté par la comptabilité ou par `paiement`.

#### FR-90 : L'ordre de règlement naît de l'accord enregistré, jamais sans

Le serveur ne crée un ordre de règlement d'indemnité qu'à l'enregistrement de l'**accord** de l'assuré ou de la victime (décision D6). L'accord est enregistré par le gestionnaire (`GEST`) ou le responsable (`RESP`), avec la pièce qui le prouve : offre signée, ou procès-verbal de transaction au corporel. Cet enregistrement déclenche la transition `OFFRE_ENVOYEE → ORDRE_EMIS` (§5.13, transition 14). Deux natures de règlement échappent à l'accord de l'assuré, car leur bénéficiaire n'est pas l'assuré : les **honoraires d'expert** (ils naissent du visa des honoraires, par `RESP` ou `CPT`, FR-91) et le règlement **à titre commercial** (il naît de la décision du `DG`, §5.7). Un acompte et une offre provisionnelle suivent la règle de l'indemnité : ils sont proposés par une offre, et leur accord est enregistré [ASSUMPTION: un acompte passe par une offre d'acompte avec accord enregistré ; à confirmer à la séance d'immersion].

**Conséquences (testables) :**
- Créer un ordre de règlement d'indemnité sur un dossier dont l'accord n'est pas enregistré est refusé avec le code `ACCORD_ENREGISTRE`.
- L'accord enregistré porte : la pièce jointe (obligatoire), la date de l'accord, l'auteur de l'enregistrement, le montant accepté. Sans pièce, l'enregistrement est refusé (`ACCORD_ENREGISTRE`).
- Le montant de l'ordre est égal au montant accepté ; il ne peut pas dépasser le montant validé (§5.7). Un ordre de montant supérieur est refusé (`MONTANT_VALIDE`).
- Au corporel, une dénonciation de la transaction reçue dans les 15 jours qui suivent sa conclusion (Code CIMA, art. 235, SÛR) est enregistrée sur le dossier ; tant que l'ordre n'est pas exécuté, elle l'annule (statut `ANNULE`, motif tracé) et le dossier repasse en `EN_INSTRUCTION`.
- Un ordre d'honoraires sans visa des honoraires est refusé (`HONORAIRES_NON_VISES`) ; le visa ne peut pas dépasser le montant facturé, et exige un motif au-delà de la lettre de mission (démo, §5.5).
- Le règlement à titre commercial sans décision du `DG` enregistrée est refusé (`DELEGATION_DG`).
- Chaque création d'ordre écrit une ligne d'audit : auteur, rôle, date et heure, montant, pièce d'accord, version des paramètres.

#### FR-91 : Un dossier peut porter plusieurs règlements

Un dossier peut avoir **plusieurs règlements** (décision D11) : un acompte, une offre provisionnelle puis une offre définitive, plusieurs bénéficiaires (victime, ayants droit, garage, représentant), les honoraires d'expert. Chaque règlement a sa nature (`INDEMNITE`, `ACOMPTE`, `PROVISIONNEL`, `HONORAIRES`, `COMMERCIAL`), son bénéficiaire, son montant, son moyen, son **état** (FR-92) et sa **quittance**. Le serveur tient en permanence trois montants du dossier : le montant **validé**, le montant **payé** (somme des règlements `PAYE`), le **reste à payer** (validé moins payé ; jamais négatif). Ces montants ne se confondent jamais avec l'évalué, le proposé (l'offre) ni la provision (vocabulaire du PRD, §3).

**Conséquences (testables) :**
- La somme des règlements d'indemnité non annulés d'un dossier ne dépasse jamais le montant validé : un règlement qui le ferait dépasser est refusé (`MONTANT_VALIDE`).
- Les honoraires se suivent à part : ils n'entrent ni dans le reste à payer de l'indemnité ni dans le calcul de la délégation de l'assuré, mais figurent dans le coût du dossier.
- Une quittance par règlement ; un règlement annulé garde sa quittance en état `ANNULEE` (jamais supprimée).
- Au corporel, le règlement est libellé exclusivement au nom de la victime ou des ayants droit, même en présence d'un conseil (Code CIMA, art. 232, SÛR) : un règlement corporel dont le bénéficiaire n'est ni la victime ni un ayant droit enregistré est refusé (`BENEFICIAIRE_CONFORME`).
- Quand le bénéficiaire est un mineur ou un incapable, le serveur exige l'enregistrement de l'avis au juge des tutelles ou au conseil de famille au moins 15 jours avant le paiement (Code CIMA, art. 234, SÛR), faute de quoi l'émission est refusée (`AVIS_TUTELLE`).
- Un dossier avec acompte payé et reste à payer positif garde son statut `ORDRE_EMIS` ou `CHEQUE_A_REMETTRE` selon FR-92 ; il n'est jamais `REGLE` tant que le reste à payer n'est pas zéro.

#### FR-92 : États du règlement, états de la quittance, statut du dossier

Chaque règlement suit une machine à états, et sa quittance une autre (décision D11). Le statut du dossier en découle : il n'est jamais saisi à la main.

| État du règlement | Sens | Ce qui le fait naître |
|---|---|---|
| `A_PAYER` | l'ordre est émis, la comptabilité ne l'a pas encore pris | création de l'ordre |
| `EN_COURS` | chèque émis non remis, ou paiement électronique lancé | émission par `CPT` |
| `PARTIEL` | une partie de la somme est payée (paiement électronique partiel, ou remise en plusieurs fois) | confirmation partielle |
| `PAYE` | remis au bénéficiaire (chèque, espèces) ou confirmé par `paiement` (virement, Mobile Money) | remise ou confirmation |
| `ECHEC` | le paiement électronique est refusé, ou une anomalie est signalée | rejet ou signalement |

| État de la quittance | Sens |
|---|---|
| `PRETE` | générée avec l'ordre, prête à éditer |
| `EDITEE` | imprimée ou mise à disposition du bénéficiaire |
| `SIGNEE` | signée par le bénéficiaire (FR-96) |
| `REMISE` | le règlement a été remis ou confirmé contre cette quittance |
| `ENCAISSEE` | l'encaissement est confirmé (rapprochement bancaire, `paiement`) |
| `ANNULEE` | annulée avant remise [ASSUMPTION: état repris de la démo, à ajouter aux cinq états de D11] |

Statut du dossier dérivé : `ORDRE_EMIS` tant qu'au moins un règlement est `A_PAYER` ou `ECHEC` ; `CHEQUE_A_REMETTRE` quand tous les règlements sont émis et qu'au moins un chèque attend sa remise ; `REGLE` quand tous les règlements sont `PAYE` et que le reste à payer de l'indemnité validée est **zéro**.

**Conséquences (testables) :**
- Un dossier avec deux règlements dont un seul est `PAYE` n'est pas `REGLE`.
- Une remise sur un dossier déjà plus avancé (acompte, règlement partiel) ne change que la quittance et l'état du règlement, pas le statut du dossier.
- Le passage `ORDRE_EMIS → REGLE` sans chèque (virement, Mobile Money) n'a lieu qu'à la confirmation de `paiement` (transition 18) ; il est refusé tant que la quittance n'est pas `SIGNEE` (`QUITTANCE_SIGNEE`).
- Un règlement `ECHEC` reste visible dans la file de la comptabilité avec la cause du refus ; le dossier ne passe pas en `REGLE`.
- Après un règlement provisionnel payé et un reste à payer nul sur le montant validé, le dossier passe en `REGLE` ; il peut ensuite repasser en `EN_INSTRUCTION` pour l'offre définitive (transition 23).
- Aucun écran ne permet de changer à la main l'état d'un règlement ou le statut du dossier ; seuls les gestes de ce chapitre les font évoluer.

#### FR-93 : La comptabilité émet le règlement, et seule la comptabilité

L'émission du règlement (le chèque, l'ordre de virement, l'ordre Mobile Money) est faite par `CPT` seul. Le service sinistres, le responsable, la direction et le contrôle interne **voient** les ordres et les règlements, ils ne les émettent pas (séparation SEP-02 de la démo : aucune sortie de trésorerie sans l'intervention d'un comptable qui n'a pas décidé). Un gestionnaire qui a instruit ou validé le dossier ne peut pas non plus enregistrer l'émission, même s'il détient aussi le rôle `CPT` (cumul de rôles, SEP-01 et SEP-02).

**Conséquences (testables) :**
- Une demande d'émission par un autre rôle que `CPT` est refusée (`DROIT_INSUFFISANT`).
- Une demande d'émission par un utilisateur qui a instruit, évalué, validé ou enregistré l'accord du dossier est refusée (`SEPARATION_DES_TACHES`) ; la tentative est tracée.
- L'émission est refusée si un signal de fraude `BLOQUE` n'est pas écarté (`AUCUN_SIGNAL_BLOQUANT`, §5.12).
- L'émission est refusée si l'un des contrôles de FR-100 est en alerte non levée (`CONTROLE_LBC_FT`).
- L'écran de la comptabilité présente les ordres à traiter par ancienneté et par échéance de FR-102 ; chaque ligne montre le bénéficiaire, le montant, le moyen demandé et les alertes.
- Chaque émission écrit une ligne d'audit : auteur, date et heure, moyen, montant, référence du chèque ou de l'ordre électronique.

#### FR-94 : Le règlement par chèque

Pour un chèque, `CPT` saisit la **banque**, le **numéro du chèque** et le **montant**. Si la compagnie utilise un gabarit, Prospera **imprime la lettre-chèque** sur ce gabarit (nom du bénéficiaire, montant en chiffres et en lettres, référence du dossier) ; sinon le chèque est rempli à la main et seul son numéro est saisi. Le chèque passe alors `CHEQUE_A_REMETTRE` (transition 17) et attend la remise du FR-97. Le gabarit est un paramètre de la compagnie ; Prospera n'en invente aucun [ASSUMPTION: la compagnie fournit son gabarit de lettre-chèque ; à défaut, remplissage manuel].

**Conséquences (testables) :**
- Une émission de chèque sans numéro, sans banque ou sans montant est refusée avec le code `ORDRE_COMPLET`, et le message nomme le champ manquant.
- Un numéro de chèque déjà utilisé pour la même banque est refusé (`NUMERO_DEJA_UTILISE`) ; Prospera signale tout trou dans la suite des numéros saisis pour une banque (alerte à la comptabilité, non bloquante).
- Le nom imprimé est celui du bénéficiaire enregistré sur le règlement ; il n'est pas modifiable à l'impression.
- Le montant du chèque est égal au montant du règlement ; un écart est refusé (`MONTANT_VALIDE`).
- La lettre-chèque imprimée est versée au dossier comme pièce, avec son numéro.
- Aucun chèque n'est émis à l'ordre d'un garage ou d'un conseil au corporel (art. 232, FR-91).

#### FR-95 : Le règlement par virement, PI-SPI ou Mobile Money

Les moyens électroniques sont **exécutés par le module `paiement`** (§7) : virement bancaire, PI-SPI, et Mobile Money (T-Money, Flooz ; les opérateurs sont paramétrables par pays). `CPT` déclenche le paiement depuis l'ordre ; `paiement` l'exécute, le rapproche et renvoie sa confirmation à Prospera. Sur confirmation, le règlement passe `PAYE` et, s'il est le dernier, le dossier passe `REGLE` (transition 18). Il n'y a pas de remise au guichet pour ces moyens : la quittance est signée **avant** le paiement (FR-96).

**Conséquences (testables) :**
- Le lancement d'un paiement électronique est refusé tant que la quittance n'est pas `SIGNEE` (`QUITTANCE_SIGNEE`).
- Le lancement est refusé si les coordonnées du bénéficiaire (RIB, numéro Mobile Money) ne sont pas **vérifiées** : numéro de compte au nom du bénéficiaire, ou numéro Mobile Money dont l'identité du porteur correspond au bénéficiaire (`COORDONNEES_VERIFIEES`).
- Chaque demande à `paiement` porte une référence unique (la référence du règlement) : un même règlement relancé deux fois ne paie qu'une fois.
- Un refus de `paiement` passe le règlement `ECHEC` avec le motif reçu ; `CPT` peut relancer après correction des coordonnées, avec motif.
- Le rapprochement bancaire des virements et du Mobile Money se fait dans `paiement` ; un écart de rapprochement de plus de 60 jours alerte la comptabilité (paramètre ; décision D16).
- Si `paiement` est indisponible, l'ordre reste `A_PAYER` ; aucun statut n'est avancé sans confirmation.

#### FR-96 : La quittance, signée avant tout paiement électronique

Chaque règlement a sa **quittance**, numérotée. Elle porte : le numéro, le dossier, le bénéficiaire, son téléphone, le montant en chiffres et en lettres, le moyen, la banque et le numéro de chèque s'il y a lieu, les dates d'édition et de signature, la référence de la transaction pour un paiement électronique, l'auteur de l'émission. Au corporel, le texte rappelle que le règlement vaut exécution de la transaction (le droit de dénonciation est déjà purgé, FR-90). La signature est **manuscrite** : au guichet, ou sur la quittance imprimée, signée puis scannée ou photographiée et retournée par l'assuré. L'**acceptation électronique par code à usage unique** est une option, activable seulement après validation juridique de la valeur de la signature électronique (loi 2017-007 non lue ; revue juridique obligatoire, D21).

**Conséquences (testables) :**
- Une quittance `SIGNEE` sans pièce de signature jointe (scan ou photo) est refusée (`QUITTANCE_SIGNEE`).
- L'acceptation électronique est indisponible tant que le paramètre n'est pas activé par l'administrateur sur décision du `DG` ; si elle est activée, le code à usage unique est envoyé au numéro enregistré du bénéficiaire, valable 10 minutes [ASSUMPTION: durée de validité du code], et la preuve (date, numéro, résultat) est versée à la quittance.
- Une quittance ne passe `REMISE` qu'avec le geste de remise (FR-97) ou la confirmation de `paiement` (FR-95).
- Une quittance `ANNULEE` ne peut plus être signée ni remise ; sa ré-émission crée une nouvelle quittance, numérotée.
- La quittance signée est versée au dossier et figure au bordereau de versement aux archives (§6.2).

#### FR-97 : La remise du chèque au guichet

À la remise, `ACC` (ou `CPT`) enregistre : l'**identité** de la personne qui retire et le **numéro de sa pièce d'identité**, et la **quittance signée** (FR-96). Le champ « retiré par » n'est jamais pré-rempli (constat de la démo). Si le retirant n'est pas le bénéficiaire (procuration, représentant légal, avocat), la pièce de pouvoir est jointe et le lien est saisi. La remise fait passer le règlement `PAYE` et, s'il est le dernier, le dossier `REGLE` (transition 20).

**Conséquences (testables) :**
- Une remise sans identité du retirant est refusée (`IDENTITE_RETIRANT`) ; une remise avec un nom mais sans numéro de pièce d'identité l'est aussi.
- Une remise sans quittance signée est refusée (`QUITTANCE_SIGNEE`).
- Une remise à une personne autre que le bénéficiaire sans pièce de pouvoir est refusée (`POUVOIR_REQUIS`) ; au corporel, le chèque reste libellé au nom de la victime ou des ayants droit (art. 232).
- La remise est refusée si un signal de fraude `BLOQUE` n'est pas écarté (`AUCUN_SIGNAL_BLOQUANT`) ; le chèque est alors mis en attente et `CPT` est alerté.
- La remise est tracée : retirant, numéro de pièce, accusé signé (oui ou non), observation, auteur, date et heure. La copie de la pièce d'identité est conservée 10 ans au moins (LBC/FT, règlement CIMA n° 0004/CIMA/PCMA/PCE/SG/08, art. 13, SÛR).
- Un gestionnaire du dossier qui n'a pas le rôle `ACC` ou `CPT` ne peut pas enregistrer la remise (`DROIT_INSUFFISANT`).

#### FR-98 : Les espèces sont plafonnées

Le règlement en espèces est un moyen exceptionnel, plafonné à **500 000 FCFA** par règlement et par bénéficiaire (paramètre ; valeur de la démo) [ASSUMPTION: la loi togolaise ne fixe aucun plafond trouvé pour les assureurs ; à valider par le juriste, D21]. Au-delà, le moyen doit être traçable (chèque, virement, Mobile Money).

**Conséquences (testables) :**
- Un règlement en espèces supérieur au plafond est refusé avec le code `PLAFOND_ESPECES`.
- Plusieurs règlements en espèces au même bénéficiaire dont le cumul sur 30 jours dépasse le plafond sont refusés au même code (anti-fractionnement).
- Chaque règlement en espèces demande le consentement écrit du bénéficiaire sur la quittance, l'identité et le numéro de pièce d'identité ; l'opération est inscrite au journal des paiements de sinistres de FR-100.
- Le plafond est un paramètre versionné ; changer sa valeur n'affecte pas les règlements déjà émis.

#### FR-99 : La comptabilité peut rejeter l'ordre

Quand `CPT` constate une anomalie comptable (bénéficiaire mal orthographié, montant incohérent avec la décision, coordonnées manifestement fausses, doublon), il **rejette l'ordre** avec un motif écrit. Le dossier repasse en `EN_VALIDATION` (transition 19), et la décision de payer doit être reprise par le circuit de validation (§5.7).

**Conséquences (testables) :**
- Un rejet sans motif d'au moins 10 caractères est refusé (`MOTIF_ECRIT`).
- Un rejet n'est possible que sur un règlement `A_PAYER` ou `ECHEC` ; sur un règlement `PAYE`, il est refusé (`ETAT_REGLEMENT`).
- Le rejet annule les règlements non payés du dossier et leurs quittances (`ANNULEE`), sans toucher aux règlements déjà `PAYE`.
- L'accord de l'assuré n'est pas perdu : la nouvelle validation s'appuie sur l'accord enregistré tant que le montant validé ne dépasse pas le montant accepté ; si la nouvelle validation fixe un montant différent, une nouvelle offre est requise et le dossier suit `EN_VALIDATION → OFFRE_ENVOYEE`.
- Le gestionnaire et le responsable reçoivent une notification avec le motif (§5.15).

#### FR-100 : Les contrôles LBC/FT avant paiement

Avant toute émission (FR-93), le serveur exécute les contrôles de lutte contre le blanchiment et le financement du terrorisme issus de la démo et du cadre CIMA : (1) **bénéficiaire vérifié** : identité et pièce d'identité du bénéficiaire en dossier ; (2) **coordonnées bancaires modifiées** dans les 5 jours qui précèdent le paiement : alerte ; (3) **doublon de règlement** : même bénéficiaire, même montant, sur 30 jours ; (4) **concentration d'émission** : un même utilisateur `CPT` émet plus de 60 % du volume sur la période ; (5) **bénéficiaire différent de la victime** sans mandat enregistré ; (6) **cumul par bénéficiaire** supérieur au seuil national LBC/FT [ASSUMPTION: seuil national non lu, paramètre vide donc alerte inactive tant qu'il n'est pas saisi ; D21]. Les contrôles 1, 3 et 5 **bloquent** ; les contrôles 2, 4 et 6 **alertent** le responsable LBC et le contrôle interne, et exigent une levée motivée avant l'émission (sauf 4, qui alerte seulement). Un journal des **paiements de sinistres** (bénéficiaire réel, moyen, origine, destination, cumul par client) est tenu et exportable pour le responsable LBC, conservé 10 ans au moins (règlement CIMA n° 0004, art. 4.5 et 13, SÛR). Le mécanisme de déclaration de soupçon relève du responsable LBC de la compagnie ; Prospera conserve l'alerte et la trace de sa suite [ASSUMPTION: la déclaration de soupçon se fait hors Prospera ; à confirmer].

**Conséquences (testables) :**
- Une émission vers un bénéficiaire dont l'identité n'est pas vérifiée est refusée (`BENEFICIAIRE_VERIFIE`).
- Une émission qui reproduit un règlement du même bénéficiaire, au même montant, dans les 30 jours est refusée (`DOUBLON_REGLEMENT`) ; une dérogation motivée du responsable est possible et tracée.
- Un changement de RIB ou de numéro Mobile Money enregistré dans les 5 jours avant l'émission déclenche une alerte au contrôle interne et exige la levée motivée de `RESP` ; sans levée, l'émission est refusée (`COORDONNEES_VERIFIEES`).
- Une émission dont le bénéficiaire n'est ni l'assuré, ni la victime, ni l'ayant droit, ni un expert, ni un garage mandaté, sans mandat enregistré, est refusée (`BENEFICIAIRE_CONFORME`).
- La part de volume de `CPT` en émissions est calculée par semaine ; au-dessus de 60 %, l'alerte apparaît dans la file du contrôle interne (`AUD`).
- Le journal des paiements de sinistres s'exporte (bénéficiaire, moyen, montant, date, cumul) pour une période, sans donner accès aux données médicales.

#### FR-101 : Le chèque non retiré se relance puis s'expose

Un chèque `CHEQUE_A_REMETTRE` non retiré se suit par son ancienneté depuis l'émission : au-delà de **7 jours**, c'est un oubli à relancer (liste d'appels du guichet) ; au-delà de **21 jours**, c'est une circulation longue signalée à la comptabilité ; au-delà de **30 jours**, c'est une **exposition** (somme due, non retirée) montrée au responsable et au contrôle interne. `ACC` relance l'assuré par appel, SMS, e-mail ou WhatsApp, avec trace du canal et du résultat (§5.14, FR-143).

**Conséquences (testables) :**
- Au 8e jour sans remise, le chèque entre dans la liste d'appels du guichet avec le nom du bénéficiaire et son téléphone ; au 22e, il entre dans l'alerte de circulation longue ; au 31e, il entre dans l'état des expositions.
- `CPT` peut **annuler** un chèque non retiré et **ré-émettre** : la quittance passe `ANNULEE`, une nouvelle quittance est créée, le dossier repasse `ORDRE_EMIS` (transition 21), avec motif obligatoire (`MOTIF_ECRIT`).
- Un chèque annulé ne peut plus être remis ; le numéro annulé reste visible dans la série de la banque.
- L'exposition apparaît dans l'état pour la comptabilité (FR-103) avec le compte d'attente concerné, sans écriture passée par Prospera.
- Le bénéficiaire qui ne retire jamais son chèque n'est pas relancé indéfiniment : après 3 relances sans effet, une proposition d'arbitrage (annulation, versement par un autre moyen, classement) est faite au responsable (§5.14, FR-143).

#### FR-102 : Le paiement sous 72 heures après l'accord

La cible interne de la compagnie est de payer **dans les 72 heures qui suivent l'accord** (procédure du groupe, mémoire de 2014, reprise comme valeur par défaut ; paramètre). Le point de départ est l'accord enregistré ; le point d'arrêt est le dernier règlement `PAYE`. Au **corporel automobile**, la loi ajoute ses propres délais : le paiement des sommes convenues se fait dans le mois qui suit l'expiration du délai de dénonciation de 15 jours (Code CIMA, art. 235 et 236, SÛR), et le retard produit de plein droit un intérêt de **5 % par mois** de retard sur le montant de l'indemnité (art. 236, SÛR ; la base de calcul est à faire valider par le juriste, D21). Pour ce régime, le point de départ de la cible interne est la fin du délai de dénonciation [ASSUMPTION: la compagnie n'émet pas avant la fin du délai de dénonciation de 15 jours au corporel ; à valider par le juriste].

**Conséquences (testables) :**
- Le dossier affiche, pour chaque règlement : la date limite interne, la date limite légale s'il y a lieu, le temps restant (négatif si dépassé), et la nature (légale, interne) de l'échéance (§5.14).
- Une alerte jaune apparaît à 48 heures de la cible interne, une alerte rouge au dépassement, dans la file de `CPT` et celle de `RESP`.
- Au corporel automobile, le dépassement du délai légal affiche la pénalité cumulée (5 % de l'indemnité par mois de retard, base paramétrable) et exige, pour la réduire ou l'annuler, un motif « circonstances non imputables à l'assureur » enregistré par `RESP` (art. 233, SÛR).
- Un dossier dont la dénonciation est ouverte n'a pas d'échéance légale de paiement avant sa fin ; la date de fin est calculée depuis la date de conclusion de la transaction.
- Les échéances légales ne sont pas modifiables par la compagnie ; la cible de 72 heures l'est.

#### FR-103 : L'état et l'export pour la comptabilité

La comptabilité officielle reste hors de Prospera (décision D16). Prospera produit un **état** et un **export** des règlements émis et remis, des honoraires d'expert, des provisions du dossier (partie 3, module `assurance`), des recours encaissés (FR-117) et des cessions. Le format suit le contrat d'échange (annexe C). L'état distingue : les règlements remis, les chèques émis non retirés (comptes d'attente), les règlements annulés à ré-émettre, les honoraires visés. La démo mettait en regard un plan de comptes CIMA ; ce plan est celui de la compagnie, il n'est jamais fixé dans Prospera [ASSUMPTION: les comptes sont saisis par la compagnie ; Prospera exporte des natures d'opération, la compagnie les affecte à ses comptes].

**Conséquences (testables) :**
- L'export d'une période liste, pour chaque mouvement : date, dossier, numéro de sinistre officiel, nature (indemnité, acompte, honoraires, recours encaissé), bénéficiaire, moyen, montant, référence du chèque ou de la transaction, statut, auteur.
- Un règlement remis apparaît une seule fois dans l'export de sa période ; un règlement annulé apparaît avec son annulation en mouvement inverse.
- Le total de l'export d'une période est égal à la somme des règlements `PAYE` de cette période ; un test de recette le vérifie sur le jeu de démonstration.
- L'export est disponible en fichier (Excel, JSON) ou par échange avec le logiciel de la compagnie (annexe C), dans les deux cas avec la date et l'heure de génération.
- L'état et l'export sont réservés à `CPT`, `RESP`, `DG`, `DT` et `AUD` ; `ACC` n'y a pas accès.
- Prospera n'affiche aucun solde bancaire : la position en banque appartient à la comptabilité de la compagnie.

### 5.9 Clore : solde à zéro, motif écrit, archives

Cette section couvre la phase 8 : `CLOTURE`. La clôture ferme le dossier sinistre ; elle ne ferme pas le recours, qui continue seul (§5.10). Le dossier clos reste consultable ; il se rouvre par un geste tracé.

#### FR-104 : Les conditions de clôture

Le gestionnaire (`GEST`) ou le responsable (`RESP`) clôture un dossier `REGLE` avec un **motif écrit**. Le serveur vérifie que : le reste à payer de l'indemnité validée est **zéro** (`SOLDE_APURE`) ; tous les règlements, honoraires compris, sont `PAYE` ou annulés (`REGLEMENT_REMIS`) ; aucune mission d'expertise n'est ouverte ; aucune offre définitive n'est attendue (cas du règlement provisionnel, FR-92) ; la question du **recours** est tranchée : un recours est ouvert, ou une décision écrite « aucun tiers en cause » est enregistrée (FR-108).

**Conséquences (testables) :**
- Une clôture avec un reste à payer supérieur à zéro est refusée (`SOLDE_APURE`).
- Une clôture avec un règlement non remis, ou une quittance `PRETE`, `EDITEE` ou `SIGNEE` non remise, est refusée (`REGLEMENT_REMIS`).
- Une clôture sans motif d'au moins 10 caractères est refusée (`MOTIF_ECRIT`).
- Une clôture avec une mission d'expertise ouverte est refusée (`EXPERTISE_VALIDEE`) ; une mission `ANNULEE` ne bloque pas.
- Une clôture d'un dossier dont la question du recours n'est pas tranchée est refusée (`RECOURS_QUALIFIE`).
- Une clôture par un utilisateur qui n'est ni `GEST`, `GREC` ni `RESP` est refusée (`DROIT_INSUFFISANT`).
- Un dossier `REJETE` ou `SANS_SUITE` n'a pas de transition vers `CLOTURE` : ce sont des sorties à part entière (§5.11).

#### FR-105 : Les effets de la clôture

À la clôture, le serveur : fixe la **date de clôture** ; ramène la **provision du dossier** à zéro, avec une ligne d'historique de provision (avant, après, motif « dossier clos ») ; inscrit le dossier dans la file « à verser aux archives » de l'archiviste (`ARCH`), avec une date limite de versement de **75 jours** après la clôture (paramètre, démo) ; démarre l'horloge de **conservation** (décision D17 : durées par nature en paramètres, 10 ans au moins, Code CIMA art. 404, SÛR) ; envoie au logiciel de la compagnie (LC) le statut « clos » et les montants définitifs, selon le contrat d'échange (annexe C) ; informe l'assuré, et le courtier le cas échéant (§5.15). Le **versement aux archives** (numéro d'archivage, bordereau, scellement) est décrit au §6.2 : il relève de `ARCH`, jamais du gestionnaire.

**Conséquences (testables) :**
- Après la clôture, la provision du dossier est zéro et l'état des provisions ne compte plus le dossier au titre des sinistres à payer ; l'historique de provision garde toutes les lignes.
- Le dossier clos apparaît dans la file de `ARCH` le jour même ; sa date limite de versement est affichée, et un dépassement alerte `RESP`.
- Un gestionnaire qui tente de verser le dossier aux archives obtient le refus `DROIT_INSUFFISANT` avec le message « Le versement relève de l'archiviste ».
- Le dossier clos reste consultable en lecture par tous les rôles qui y avaient accès, et toute lecture est journalisée.
- La date de clôture ne se modifie pas ; seule une réouverture (FR-107) la remplace, l'ancienne date restant dans l'historique.

#### FR-106 : Le recours continue seul quand le dossier est clos

Un dossier clos peut avoir un recours **encore actif** (décision D10). Le dossier montre alors un bandeau « Dossier clos, recours en cours » avec le statut du recours. Le recours a sa propre machine et sa propre clôture (FR-112) ; il reste suivi par `GREC` ; il n'empêche ni la clôture du dossier ni son versement aux archives.

**Conséquences (testables) :**
- Un dossier `CLOTURE` avec un recours `NEGOCIATION` affiche les deux états côte à côte, et la corbeille de `GREC` continue de le montrer.
- Clôturer le dossier ne modifie ni les échéances du recours, ni ses relances, ni sa prescription.
- Les pièces ajoutées au recours après le versement du dossier aux archives sont conservées dans un **bordereau complémentaire** rattaché au même numéro d'archivage [ASSUMPTION: bordereau complémentaire pour les pièces tardives du recours ; à confirmer avec l'archiviste].
- Un encaissement de recours sur un dossier clos est possible ; il n'altère pas le solde du dossier sinistre (reste à payer, provision).
- Un recours `RECUPERE` ou `ABANDONNE` ne rouvre pas le dossier.

#### FR-107 : La réouverture d'un dossier clos

Le responsable (`RESP`), le directeur général (`DG`) ou le directeur technique (`DT`) peut **rouvrir** un dossier `CLOTURE` avec un motif écrit (nouvelle pièce, aggravation, contestation, erreur). Le dossier repasse `EN_INSTRUCTION` (transition 39). La réouverture est un type d'action du journal, `REOUVERTURE`.

**Conséquences (testables) :**
- Une réouverture par un autre rôle est refusée (`DROIT_INSUFFISANT`) ; sans motif, elle est refusée (`MOTIF_ECRIT`).
- À la réouverture : la date de clôture est effacée et conservée dans l'historique ; le dossier retrouve son gestionnaire s'il est encore en fonction, sinon il est à réattribuer ; la **provision** est reposée par le gestionnaire avec motif (la provision zéro ne reste pas) ; le délai interne d'instruction repart d'un nouveau point de départ daté, sans effacer l'ancien.
- Les échéances légales du corporel (§5.14) ne repartent pas de zéro : le calcul reste celui du dossier initial, avec une alerte au responsable si l'échéance est dépassée.
- Si le dossier a été versé aux archives, la réouverture crée une demande de sortie de la chemise papier à `ARCH`, avec restitution sous 15 jours (§6.2) ; l'image numérique scellée reste consultable.
- Les règlements `PAYE` restent intacts ; un nouveau règlement suit tout le chapitre §5.8.

### 5.10 Le recours : un suivi parallèle

Dans la démo, passer en recours faisait sortir le dossier du circuit. Désormais (décision D10), le recours est un **suivi parallèle** : il naît dès l'ouverture si un tiers est en cause, vit sa propre vie et se clôt seul. Le dossier sinistre et le recours ont chacun leur machine. Le rôle `GREC` (gestionnaire recours) mène le recours ; `RESP` peut tout ce que `GREC` peut ; `DG`, `DT` et `AUD` lisent.

#### FR-108 : Le recours naît dès l'ouverture quand un tiers est en cause

À l'ouverture du dossier (§5.2), si un **tiers est en cause** (un autre véhicule, un autre assuré, un responsable identifié), le serveur crée le **recours** dans le statut `A_QUALIFIER`, le rattache au dossier et l'attribue au pôle recours (`GREC`). Un dossier peut porter **plusieurs recours**, un par tiers ou assureur débiteur [ASSUMPTION: la démo n'en porte qu'un par dossier ; un accident à plusieurs véhicules en demande plusieurs]. Un gestionnaire peut aussi le créer plus tard, dès qu'un tiers apparaît (rapport de police, rapport de responsabilité). Si l'instruction conclut qu'aucun tiers n'est en cause, le gestionnaire enregistre la décision « aucun tiers en cause » avec motif ; elle lève la condition de clôture du FR-104.

**Conséquences (testables) :**
- À l'ouverture d'un dossier avec un tiers déclaré, un recours `A_QUALIFIER` existe sans aucun geste du gestionnaire, avec la date de naissance, le débiteur présumé et la responsabilité déclarée.
- Un recours sans action depuis plus de 30 jours est signalé à `GREC` et à `RESP` (paramètre).
- Un recours `A_QUALIFIER` depuis plus de 60 jours est signalé comme « nouveau recours non traité » (paramètre, démo).
- Créer un recours ne change ni le statut du dossier ni son volet : le dossier reste sur son volet (corporel, matériel, risques divers), et la lettre du FR-109 part en parallèle.
- La décision « aucun tiers en cause » sans motif est refusée (`MOTIF_ECRIT`) ; elle est visible de `AUD`.
- Un dossier dont la responsabilité est requalifiée sur rapport d'expertise (§5.5) met à jour le recours : part du tiers, fondement.

#### FR-109 : La lettre de mise en cause part dès l'ouverture

Dès l'ouverture, une **lettre de mise en cause** est préparée pour le tiers ou son assureur : elle l'informe du sinistre, de la référence du dossier, de la mise en cause de sa responsabilité et de la réserve des droits de la compagnie. Le courrier est rédigé sur un modèle, relu, signé par `GREC` et envoyé ; sa preuve d'envoi est versée au dossier. Les pièces probantes (procès-verbal, constat, rapport de police) sont transmises progressivement, avec une copie conservée avant tout envoi (recommandation de l'audit de 2014).

**Conséquences (testables) :**
- Un recours créé avec un débiteur identifié génère une lettre de mise en cause en statut `A_PREPARER` dans la file de `GREC`, le jour de sa création.
- La lettre ne peut pas partir sans relecture et signature d'un humain ; un envoi automatique est impossible.
- Si le débiteur n'est pas encore identifié, la lettre reste `A_PREPARER` et la ligne « identifier le tiers » de la checklist (FR-112) est ouverte.
- Chaque envoi enregistre : canal (courrier avec accusé, e-mail, huissier, remise en main propre), preuve d'envoi, preuve de réception quand elle existe.
- La lettre porte la référence de déclaration, le numéro de sinistre officiel s'il est connu, et le nom de `GREC` (art. 242 : nom du gestionnaire en correspondance, SÛR, pour le corporel automobile).
- Une lettre non envoyée dans les 5 jours ouvrés après l'ouverture est signalée au responsable [ASSUMPTION: 5 jours ouvrés ; la procédure du groupe dit « dès l'ouverture » sans chiffre].

#### FR-110 : Le recours se relance tous les 15 jours

Tant que le débiteur n'a pas répondu, puis jusqu'au recouvrement, le recours est **relancé tous les 15 jours** (paramètre ; procédure du groupe, mémoire de 2014). Le point de départ est l'envoi de la lettre de mise en cause, puis de chaque relance ; le point d'arrêt est la réponse du débiteur, puis, pour le second cycle, l'encaissement complet.

**Conséquences (testables) :**
- Quinze jours après l'envoi d'une lettre sans réponse, le recours entre dans la liste « à relancer » de `GREC`.
- Une relance enregistrée (canal, date, texte) remet le compteur à zéro ; un recours non relancé depuis plus de 15 jours reste dans la liste.
- Après 3 relances sans effet, le serveur propose un arbitrage (mise en demeure, négociation, abandon) plutôt qu'une relance de plus (§5.14, FR-143).
- Le compteur de relances et la date de la dernière relance figurent sur la fiche du recours et dans l'état hebdomadaire des recours par débiteur.
- L'intervalle de 15 jours est un paramètre de la compagnie ; changer sa valeur recalcule les échéances en cours sans en effacer l'historique.

#### FR-111 : La réclamation du remboursement part après le paiement de l'assuré (subrogation)

La réclamation du **remboursement** ne part qu'**après le paiement de l'assuré** : la compagnie est alors subrogée dans les droits de la personne qu'elle a indemnisée (Code CIMA, art. 271, SÛR). Le recours passe de `PRET_A_ENGAGER` à `RECLAMATION_ENVOYEE` quand la condition `PAIEMENT_ASSURE` est remplie : au moins un règlement d'indemnité du dossier est `PAYE`. La réclamation porte sur la somme effectivement payée, pas sur la somme validée. Le délai interne de réclamation est de **30 jours** après le paiement de l'assuré (paramètre, démo).

**Conséquences (testables) :**
- Une réclamation de remboursement avant tout paiement est refusée avec le code `PAIEMENT_ASSURE`.
- Le montant réclamé ne dépasse pas la somme des règlements `PAYE` de l'indemnité multipliée par la part du tiers (FR-113) ; un montant supérieur est refusé (`MONTANT_RECLAME`).
- Trente jours après le dernier règlement `PAYE`, un recours encore sans réclamation envoyée est signalé à `GREC` et `RESP`.
- Quand l'assuré est payé en plusieurs fois, une réclamation complémentaire peut suivre chaque règlement, sur la même créance.
- Quand le débiteur est inconnu ou non assuré, la qualification enregistre « auteur inconnu » ou « auteur non assuré » : si un fonds de garantie automobile existe et est activé (paramètre par pays), le serveur ouvre l'échéancier du fonds (procès-verbal transmis dans les 60 jours de l'accident, déclaration dans les 3 mois de la réclamation, Code CIMA art. 606 et 608, SÛR) ; sinon la règle de l'art. 274 s'applique (part supportée par les autres assureurs à parts égales). Au Togo, l'existence du fonds n'est pas confirmée [ASSUMPTION: fonds de garantie automobile désactivé par défaut ; D21].

#### FR-112 : La machine du recours

Le recours a sa propre machine, reprise de la démo et complétée. Un recours porte une **checklist** (identifier le tiers, identifier son assureur, vérifier les garanties, réunir les pièces, calculer le montant, préparer la demande, programmer la relance) où chaque ligne indique fait ou non fait, date, auteur et origine.

| # | Depuis → vers | Libellé | Rôle(s) | Conditions | Motif |
|---|---|---|---|---|---|
| R1 | `A_QUALIFIER → PIECES_A_REUNIR` | Le tiers est connu, il manque des pièces | GREC, RESP | `TIERS_IDENTIFIE` | non |
| R2 | `A_QUALIFIER → MONTANT_A_CALCULER` | Tiers connu et pièce probante au dossier | GREC, RESP | `TIERS_IDENTIFIE`, `PIECE_PROBANTE` | non |
| R3 | `PIECES_A_REUNIR → MONTANT_A_CALCULER` | Pièce probante reçue | GREC, RESP | `PIECE_PROBANTE` | non |
| R4 | `MONTANT_A_CALCULER → A_VALIDER` | Créance établie | GREC | `CREANCE_ETABLIE` | non |
| R5 | `A_VALIDER → PRET_A_ENGAGER` | Montant validé | RESP | `MONTANT_VALIDE`, `SEPARATION_DES_TACHES` | non |
| R6 | `A_VALIDER → MONTANT_A_CALCULER` | Renvoi pour recalcul | RESP | — | oui |
| R7 | `PRET_A_ENGAGER → RECLAMATION_ENVOYEE` | Envoi de la réclamation (mise en demeure) | GREC | `PAIEMENT_ASSURE`, mise en demeure `A_ENVOYER` | non |
| R8 | `RECLAMATION_ENVOYEE → NEGOCIATION` | Le débiteur répond, on négocie | GREC | réponse enregistrée | non |
| R9 | `NEGOCIATION → ACCORD` | Accord conclu | GREC, RESP | `ACCORD_CONCLU` | non |
| R10 | `RECLAMATION_ENVOYEE`, `NEGOCIATION → CONTENTIEUX` | Engager le contentieux | RESP | — | oui |
| R11 | `CONTENTIEUX → ACCORD` | Transaction ou décision exécutoire | GREC, RESP | `ACCORD_CONCLU` | non |
| R12 | `NEGOCIATION → EN_ARBITRAGE` | Saisir l'arbitrage entre assureurs | RESP | débiteur de type assureur, `ARBITRAGE_APPLICABLE` | oui |
| R13 | `EN_ARBITRAGE → ACCORD` | Sentence rendue et acceptée | GREC, RESP | sentence versée | non |
| R14 | `ACCORD → RECUPERE` | Tout est encaissé | GREC | `TOUT_RAPPROCHE` | non |
| R15 | tout statut non terminal `→ ABANDONNE` | Abandonner le recours | RESP, sur proposition de GREC | issue de clôture choisie | oui |

`RECUPERE` et `ABANDONNE` sont terminaux. L'état `EN_ARBITRAGE` (R12, R13) et la possibilité d'abandonner depuis les premiers états (R15 élargie) sont des ajouts à la démo [ASSUMPTION: la démo n'abandonne que depuis RECLAMATION_ENVOYEE, NEGOCIATION et CONTENTIEUX, et n'a pas d'arbitrage].

**Conséquences (testables) :**
- Toute transition hors de ce tableau est refusée (`TRANSITION_INCONNUE`) ; toute transition dont une condition n'est pas remplie est refusée avec le nom de la condition.
- `GREC` ne valide pas sa propre créance : R5 par le même utilisateur que R4 est refusée (`SEPARATION_DES_TACHES`).
- Chaque clôture de recours (R14, R15) porte une **issue** parmi `RECUPERATION_INTEGRALE`, `ACCORD_EXECUTE`, `DECISION_DEFINITIVE`, `POURSUITE_IMPOSSIBLE`, `AUTRE`, un motif, et les pièces de clôture.
- Un abandon (R15) est proposé par `GREC` et décidé par `RESP` ; l'abandon décidé par la personne qui l'a proposée est refusé (`SEPARATION_DES_TACHES`).
- Aucun recours non terminal n'est sans issue : un test de recette parcourt la table et prouve que chaque statut non terminal a au moins une sortie.
- Chaque transition est tracée (auteur, rôle, date et heure, avant, après, motif).

#### FR-113 : La créance et ses trois montants

Chaque recours porte une **créance**, numérotée, avec trois montants qui ne se confondent jamais : le montant **réclamé** (ce que la compagnie demande), le montant **accepté** (ce que le débiteur reconnaît), le montant **encaissé** (ce qui est reçu et rapproché). La créance a ses états : `A_ETABLIR`, `ETABLIE`, `RECLAMEE`, `CONTESTEE`, `PARTIELLEMENT_RECUPEREE`, `SOLDEE`, `ABANDONNEE`. Le montant réclamé se calcule ainsi : somme des règlements d'indemnité `PAYE` du dossier, multipliée par la **part du tiers** arrêtée (responsabilité du dossier, requalifiée sur rapport d'expertise). Pour les accidents entre véhicules assurés, la part est celle du **barème de responsabilité** annexé au Livre II du Code CIMA (art. 274, SÛR), dont les tables sont à saisir (D21) ; quand la responsabilité est indéterminable, le partage par parts égales ou la règle de l'art. 275 s'applique `[à vérifier par le juriste]`. Les honoraires d'expert sont ajoutés à la base seulement si le paramètre l'autorise [ASSUMPTION: honoraires non inclus par défaut].

**Conséquences (testables) :**
- Une part du tiers égale à 70 % sur 445 500 FCFA payés donne un montant réclamé de 311 850 FCFA (chiffre de la démo, rejoué en recette).
- Une responsabilité `PARTAGEE` sans part chiffrée du tiers ne se réclame pas : la condition `RESPONSABILITE_TIERS` refuse le passage en `MONTANT_A_CALCULER` tant que la part n'est pas saisie.
- Le montant accepté ne peut pas dépasser le montant réclamé sans motif ; le montant encaissé ne peut pas dépasser le montant accepté (`MONTANT_ENCAISSE`).
- Les intérêts entre assureurs (taux de l'escompte à compter du mois qui suit la demande, art. 277, SÛR) sont affichés à part, avec la date de la demande comme point de départ ; ils ne sont jamais fondus dans le montant réclamé.
- La créance garde l'historique de ses montants (avant, après, motif, auteur).
- Une créance de plus de 90 jours non soldée est signalée comme « créance ancienne » (paramètre).

#### FR-114 : La mise en demeure

La **mise en demeure** a sa propre machine : `A_PREPARER → A_VALIDER → A_ENVOYER → ENVOYEE → RECEPTION_CONFIRMEE → REPONSE_RECUE | SANS_REPONSE`. Elle cite la subrogation, le montant réclamé, le délai accordé (30 jours par défaut), les pièces jointes (procès-verbal, rapport d'expertise, quittance d'indemnisation) et la voie contentieuse à défaut. Elle est rédigée avec l'aide de l'IA commune (FR-120), validée par `RESP`, signée, puis envoyée par un mode qui laisse une preuve : courrier avec accusé, e-mail, huissier, remise en main propre. Les effets d'une mise en demeure ou d'une reconnaissance de dette sur le cours de la prescription sont affichés comme **à vérifier** par le juriste (FR-118).

**Conséquences (testables) :**
- Une mise en demeure `A_ENVOYER` ne peut passer `ENVOYEE` sans mode d'envoi ni preuve d'envoi ; sans preuve de réception, elle ne passe pas `RECEPTION_CONFIRMEE`.
- La validation par l'utilisateur qui l'a rédigée est refusée (`SEPARATION_DES_TACHES`) : `GREC` rédige, `RESP` valide.
- À l'échéance du délai accordé sans paiement, la mise en demeure passe `SANS_REPONSE` et le recours entre dans la liste d'arbitrage de `RESP` (négociation, contentieux, arbitrage, abandon).
- Le texte généré par l'IA n'est jamais envoyé sans la relecture et la signature d'un humain ; le brouillon est conservé avec la version finale.
- Un paiement partiel reçu avant l'échéance est enregistré sur la mise en demeure (montant payé) et sur la créance.

#### FR-115 : La négociation

La **négociation** consigne les offres et contre-offres (émetteur `TIERS` ou `COMPAGNIE`, montant, commentaire, date). Elle a ses états : `EN_COURS`, `ACCORD_TROUVE`, `ECHEC`, `SUSPENDUE`. Elle s'appuie sur l'analyse de l'offre adverse du FR-120. L'accord conclu (R9) fixe le montant accepté de la créance.

**Conséquences (testables) :**
- Une offre du tiers saisie fait apparaître l'écart à la somme réclamée, en pourcentage et en FCFA.
- Un accord ne peut être enregistré (`ACCORD_CONCLU`) qu'avec la pièce de l'accord jointe et le montant accepté ; il est refusé sinon.
- `ECHEC` ouvre une proposition d'arbitrage à `RESP` ; `SUSPENDUE` demande un motif et une date de reprise.
- Un accord qui abandonne une partie de la créance au-delà d'un seuil de perte exige la validation de `DG` ou `DT` [ASSUMPTION: seuil de perte à obtenir de la compagnie ; paramètre vide, validation de RESP seule tant qu'il n'est pas saisi].
- L'historique complet des offres reste lisible sur la fiche, jamais écrasé.

#### FR-116 : Le contentieux

Le **contentieux** a sa machine : `A_ENGAGER → ENGAGE → EN_ATTENTE_DECISION → DECISION_RENDUE → TRANSACTION_A_EXECUTER → CLOS`. Il porte la nature du litige (responsabilité, montant, refus de garantie, tiers non assuré, autre), le conseil, la juridiction, la référence de la procédure et une **provision pour risque**. Il s'engage par la transition R10, décidée par `RESP` avec motif. Les honoraires du conseil sont des règlements de nature `HONORAIRES` (FR-91).

**Conséquences (testables) :**
- Engager un contentieux sans motif est refusé (`MOTIF_ECRIT`).
- Chaque étape enregistre sa date, son auteur et la pièce correspondante (assignation, jugement, transaction).
- La provision pour risque est tracée dans l'historique de provision du recours (catégorie `CONTENTIEUX`, partie 3).
- Un jugement enregistré avec un montant propose le montant accepté de la créance, à valider par `GREC`.
- Un contentieux clos sans exécution de la décision garde le recours ouvert jusqu'à encaissement ou abandon motivé.

#### FR-117 : Les encaissements se rapprochent avant d'être imputés

Un **encaissement de recours** est reçu (virement, chèque, espèces, compensation entre assureurs), déclaré par `CPT` avec sa référence bancaire et son justificatif, puis **rapproché** (`A_RAPPROCHER → RAPPROCHE | ECART`). Il n'est **imputé** à une créance qu'après la validation de son rapprochement ; il peut en solder plusieurs. Le rapprochement passe par `paiement` quand le relevé y est disponible, sinon il est confirmé à la main avec justificatif [ASSUMPTION: rapprochement des encaissements de recours dans `paiement` quand le relevé est importé, sinon confirmation manuelle ; à préciser avec le module]. Les recours encaissés alimentent l'export de la comptabilité (FR-103).

**Conséquences (testables) :**
- Un encaissement non rapproché n'augmente pas le montant encaissé de la créance.
- Un encaissement imputé à plusieurs créances garde ses affectations (créance, montant, recours) ; la somme des affectations est égale au montant de l'encaissement (`AFFECTATION_EQUILIBREE`).
- Un encaissement en `ECART` bloque le passage `ACCORD → RECUPERE` (`TOUT_RAPPROCHE`).
- La validation d'un encaissement est faite par un utilisateur qui ne l'a pas déclaré (`SEPARATION_DES_TACHES`).
- L'export comptable d'une période contient les recours encaissés (nature `RECOURS_ENCAISSE`), avec le numéro de sinistre officiel et la référence bancaire.
- Un encaissement de recours ne modifie ni le reste à payer ni la provision du dossier sinistre : la provision se tient brute, les recours à recevoir faisant l'objet d'une évaluation distincte (Code CIMA art. 334-12, SÛR).

#### FR-118 : La prescription, un terme à vérifier

Le recours affiche un **terme de prescription indicatif** : la date du sinistre plus 730 jours (« prescription biennale », paramètre), avec la mention « à vérifier » et une **alerte à 90 jours** du terme. Le serveur ne déclare jamais un recours « prescrit » ni « non prescrit » : il affiche le terme et les actes enregistrés (mise en demeure, reconnaissance de dette). Les textes lus du Code CIMA donnent une prescription de 2 ans pour l'action dérivant du contrat d'assurance (art. 28, SÛR) et de 5 ans pour l'action en responsabilité extra-contractuelle du Livre II (art. 256, SÛR) ; le recours d'un assureur subrogé relève de l'un ou de l'autre selon son fondement. Le terme applicable à chaque fondement est donc **un point de revue juridique** (D21), et le paramètre garde la valeur prudente la plus courte [ASSUMPTION: 730 jours par défaut, valeur de la démo et la plus prudente].

**Conséquences (testables) :**
- Un recours dont le sinistre date de plus de 640 jours, sans réclamation envoyée, figure en alerte rouge (90 jours avant le terme indicatif).
- Le terme se calcule sur la date de survenance du dossier ; il se recalcule si le fondement du recours change (contractuel, légal, conventionnel, autre) quand une valeur est paramétrée par fondement.
- Une mise en demeure `RECEPTION_CONFIRMEE` est enregistrée comme acte, avec sa date ; elle ne modifie pas le terme affiché tant que le juriste n'a pas validé son effet.
- L'écran affiche toujours « terme indicatif, à vérifier » à côté de la date.
- La liste des recours dont le terme approche s'exporte (référence, débiteur, créance, terme, jours restants).

#### FR-119 : L'arbitrage entre assureurs et les conventions, en paramètre

Les conflits nés des recours entre assureurs sont, selon le Code CIMA (art. 276, SÛR), **obligatoirement soumis à la Commission nationale d'arbitrage** : trois assureurs étrangers au litige, sentence dans le mois de la saisine ; les intérêts courent au taux de l'escompte à compter du mois qui suit la demande (art. 277, SÛR). Le champ de ces articles est l'indemnisation des victimes d'un véhicule terrestre à moteur ; la mise en place de la commission au Togo n'est pas confirmée [ASSUMPTION: arbitrage activé pour les recours entre assureurs automobiles, par un paramètre ; à vérifier auprès de l'association des assureurs ; D21]. Les **conventions de place** (indemnisation directe de type IDA, forfait inter-compagnies) ne sont pas supposées : aucune convention togolaise n'a été trouvée. Elles sont des **paramètres** : convention active ou non, forfait, délai de règlement entre compagnies, bordereau de recours. Le forfait de la démo (350 000 FCFA) est une valeur d'exemple, inactive par défaut.

**Conséquences (testables) :**
- Avec la convention désactivée (défaut), aucun forfait n'est appliqué au montant réclamé ; avec elle activée, le forfait s'applique aux dossiers éligibles selon la règle d'éligibilité saisie par la compagnie.
- La saisine de l'arbitrage (R12) enregistre la date de saisine, le motif et les pièces ; une alerte à un mois de la saisine rappelle la sentence attendue.
- Si l'arbitrage n'est pas activé, R12 est refusée (`ARBITRAGE_APPLICABLE`).
- Le mode d'**indemnisation directe** (la compagnie paie son propre assuré puis recourt contre l'adverse) est un réglage de convention : il ne change ni les règlements de l'assuré ni la machine du dossier.
- Un changement de paramètre de convention est tracé (ancienne valeur, nouvelle valeur, auteur, validateur, date) et n'affecte que les recours créés après lui.

#### FR-120 : L'IA du recours (usage n° 12)

L'IA commune (instance locale, partie 4) assiste le pôle recours sur deux tâches : (1) **évaluer l'offre de l'assureur adverse** ; (2) **rédiger la mise en demeure**. Pour (1), l'entrée est la créance, l'offre reçue, la responsabilité arrêtée et les pièces du dossier ; la sortie est l'écart au réclamé, une appréciation (accord rapide, négociable, à maintenir), les arguments tirés du dossier (responsabilité, expertise, vétusté) et, pour un recours qui ne se rattache pas à un dommage corporel, une **contre-proposition indicative** avec la chance d'accord. Pour (2), l'entrée est la créance et les pièces à joindre ; la sortie est le texte de la mise en demeure, avec la subrogation, le montant, le délai et les pièces. Le destinataire est `GREC`, qui édite, valide et envoie. Garde-fous : l'IA ne décide ni n'envoie rien ; chaque affirmation renvoie à sa pièce ; l'acceptation, la modification ou le rejet de la suggestion sont inscrits au **registre de l'IA** (niveau `ANALYSE` ou `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`) ; si l'IA est coupée, tout le circuit passe ; tant qu'aucun modèle n'existe, la capacité est servie par les règles explicables de la démo et le dit. Elle est servie par l'IA commune.

Les règles de la démo sont les valeurs par défaut : écart à l'offre de 15 % ou moins, accord rapide ; de 15 à 35 %, négociable ; au-delà, maintenir et préparer le contentieux ; contre-proposition égale au plus grand de trois nombres (offre augmentée de 15 %, moyenne de l'offre et du réclamé, 80 % du réclamé). Ces seuils sont des paramètres.

**Conséquences (testables) :**
- Pour une créance de 311 850 FCFA et une offre de 250 000 FCFA, l'écart affiché est de 61 850 FCFA (environ 19,8 %), l'appréciation est « négociable », et la contre-proposition suit la formule des trois nombres, sans dépasser le montant réclamé.
- Sur un recours rattaché à un dossier corporel, aucune contre-proposition chiffrée n'est proposée ; l'analyse et les arguments restent fournis [ASSUMPTION: garde-fou du PO sur le corporel étendu au recours ; à confirmer].
- Un brouillon de mise en demeure généré n'est jamais envoyé : l'envoi demande la relecture, la validation de `RESP` et la signature.
- Chaque suggestion porte ses sources (pièce, créance, offre), consultables ; une suggestion sans source n'est pas affichée.
- Le registre de l'IA contient, pour chaque suggestion : entrée, sortie, confiance, sources, niveau, statut, auteur de la décision.
- Aucune donnée nominative ni médicale ne sort de l'instance locale ; les pièces médicales d'un dossier corporel ne sont pas lues par cette fonction.

### 5.11 Les sorties : refus, sans suite, litige, fraude suspectée

Le circuit nominal a quatre sorties : `REJETE`, `SANS_SUITE`, `LITIGE`, `FRAUDE_SUSPECTEE`. Chacune porte un **motif écrit** (règle du PO : chaque refus ou classement a un motif). `REJETE` et `SANS_SUITE` sont terminales mais se rouvrent (FR-126) ; `LITIGE` et `FRAUDE_SUSPECTEE` ont une issue qui renvoie le dossier à l'instruction ou au refus.

#### FR-121 : Le refus de prise en charge (`REJETE`) est motivé et opposable

Un dossier est refusé quand la garantie ne couvre pas le sinistre, que le contrat n'est pas valable, que l'assuré est déchu, ou qu'une fraude est confirmée. La décision de refus est prise par le responsable (`RESP`), le directeur général (`DG`) ou le directeur technique (`DT`), depuis `DECLARE`, `EN_INSTRUCTION`, `EN_VALIDATION`, ou depuis `FRAUDE_SUSPECTEE` (FR-133). Elle s'appuie sur une **décision de garantie** `REFUS_DE_GARANTIE` enregistrée (décision D4) quand le refus est un refus de garantie, avec son motif et la clause ou la condition de la police opposée (lue dans la projection du logiciel de la compagnie). Le refus est **opposable** : il est notifié par un courrier motivé (FR-122) dont la date d'envoi et la preuve sont conservées. La déchéance n'est jamais automatique : une déclaration tardive donne une réserve et un motif, le responsable décide (décision D15).

**Conséquences (testables) :**
- Un refus sans motif d'au moins 10 caractères est refusé (`MOTIF_ECRIT`) ; un refus par un rôle autre que `RESP`, `DG` ou `DT` est refusé (`DROIT_INSUFFISANT`).
- Un refus de garantie sans décision de garantie `REFUS_DE_GARANTIE` enregistrée est refusé (`DECISION_GARANTIE`).
- Au passage `REJETE`, le reste à payer et la provision du dossier passent à zéro, avec une ligne d'historique de provision (motif « refus »).
- La décision de refus par un utilisateur qui a instruit le dossier est refusée (`SEPARATION_DES_TACHES`) : le gestionnaire propose, le responsable décide.
- Un dossier `REJETE` sans courrier de refus envoyé après 2 jours ouvrés est signalé au responsable [ASSUMPTION: 2 jours ouvrés ; la procédure du groupe parle de 48 heures pour la décision et 72 heures pour l'information de l'assuré].
- Un refus de garantie sur un dossier **corporel automobile** ne supprime pas les obligations légales : l'assureur qui invoque une exception de garantie doit tout de même respecter les art. 231 à 236 « pour le compte de qui il appartiendra » (Code CIMA, art. 237, SÛR) ; le dossier garde donc ses échéances d'offre en alerte (§5.14), et, si un fonds de garantie automobile est activé, l'alerte « déclaration au fonds sous 3 mois de la réclamation » (art. 608, SÛR) `[à vérifier par le juriste : traitement du dossier refusé au corporel]`.
- Un recours ouvert sur un dossier refusé, sans aucun règlement `PAYE`, est proposé à l'abandon au responsable (FR-112, R15) ; il n'est jamais abandonné automatiquement.

#### FR-122 : Le courrier de refus est rédigé par l'IA, relu et signé (usage n° 11)

Le courrier de refus est un **brouillon rédigé par l'IA commune** (usage n° 11), relu et signé par un humain avant tout envoi. L'entrée est la décision de refus, son motif, la garantie visée et la clause de la police opposée ; la sortie est un projet de courrier : exposé des faits, motif, clause, voie de contestation (« une réclamation écrite accompagnée de tout élément nouveau », texte de la démo), nom du gestionnaire et référence du dossier. Le destinataire du brouillon est le signataire (`RESP`, ou `DG` ou `DT` pour un enjeu supérieur au seuil de délégation du responsable, §5.7). Garde-fous : l'IA ne signe ni n'envoie ; chaque motif cité renvoie à sa pièce ou à sa clause ; le brouillon et la version signée sont conservés tous deux ; la suggestion est inscrite au registre de l'IA (niveau `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`) ; si l'IA est coupée, un modèle de courrier à compléter prend sa place. Elle est servie par l'IA commune. Aucun article de loi n'est cité dans le courrier sans qu'il figure au référentiel juridique validé de la compagnie (D21).

**Conséquences (testables) :**
- Un courrier de refus passe `A_IMPRIMER` ou `ENVOYE` seulement après la signature de `RESP`, `DG` ou `DT` ; un courrier non signé reste `BROUILLON`.
- Le courrier mentionne la voie de contestation ; un modèle sans cette mention est refusé à la validation du modèle (`MENTION_OBLIGATOIRE`).
- Sur un dossier corporel automobile, le courrier porte le nom du gestionnaire du dossier (art. 242, SÛR).
- Le registre de l'IA contient l'entrée, la sortie, la confiance, les sources, le niveau, le statut et l'auteur de la décision ; un test de recette rejoue un refus avec chaque statut.
- Aucune donnée médicale n'est lue par la fonction de rédaction ; si le refus s'appuie sur une pièce médicale, le motif est écrit par un humain habilité (`MED`, `RESP`, `DG`, `DT`).
- Le courrier part par un canal qui laisse une preuve (courrier avec accusé, remise en main propre, e-mail avec accusé) ; le canal et la preuve sont enregistrés.

#### FR-123 : Le classement sans suite quand l'assuré est injoignable

Un dossier est classé **sans suite** (`SANS_SUITE`) quand l'assuré (ou la victime) est injoignable après les relances réglementées du FR-143 : au moins 3 relances sans effet, par au moins deux canaux, et 15 jours sans réponse après la dernière [ASSUMPTION: 15 jours après la dernière relance, d'après le texte de la 3e relance de la démo]. Le classement se fait depuis `PIECES_ATTENDUES`, `EN_INSTRUCTION` ou `OFFRE_ENVOYEE`, par `GEST` ou `RESP`, avec motif. Un dernier courrier de classement est envoyé à la dernière adresse connue. Au corporel automobile, où l'offre est due « indépendamment de la réclamation de la victime » (Code CIMA, art. 231, SÛR), le classement sans suite exige la décision de `DG` ou `DT` et n'efface pas les échéances légales [ASSUMPTION: classement sans suite d'un dossier corporel réservé à la direction ; à valider par le juriste].

**Conséquences (testables) :**
- Un classement avec moins de 3 relances enregistrées, ou avec 3 relances sur un seul canal, est refusé (`RELANCES_EPUISEES`).
- Un classement sans motif est refusé (`MOTIF_ECRIT`).
- Un classement sans suite d'un dossier corporel automobile par `GEST` ou `RESP` est refusé (`DECISION_DIRECTION`).
- Au classement, la provision du dossier passe à zéro avec motif ; les échéances internes s'arrêtent ; les échéances légales du corporel restent affichées en alerte au responsable.
- Un dossier classé sans suite n'entre pas dans la file « à verser aux archives » avant 30 jours [ASSUMPTION: délai de grâce de 30 jours avant versement, pour laisser l'assuré se manifester].
- Le classement est tracé : relances enregistrées (canal, date, résultat), motif, signataire, courrier de classement.

#### FR-124 : Le litige quand l'offre est refusée ou contestée

Un dossier passe en **litige** (`LITIGE`) quand l'assuré refuse l'offre (avec contre-expertise demandée), quand il conteste l'évaluation, ou quand un désaccord de fond oppose les parties. Le passage est décidé par `RESP`, `DG` ou `DT`, depuis `EVALUE`, `EN_VALIDATION` ou `OFFRE_ENVOYEE`, avec motif. En litige, le responsable ou la direction peut **ordonner une contre-expertise** (au sens interne de la compagnie, §5.5) ; le litige se **résout** par un retour à `EN_INSTRUCTION` avec un motif de résolution (rapport retenu, accord trouvé sur le principe, nouvelle évaluation). Une **contre-proposition** de l'assuré à l'offre n'est pas un litige : le dossier revient en `EN_INSTRUCTION` avec motif (§5.7).

**Conséquences (testables) :**
- Un passage en litige sans motif est refusé (`MOTIF_ECRIT`) ; par un rôle autre que `RESP`, `DG` ou `DT`, il est refusé (`DROIT_INSUFFISANT`).
- Un litige est résolu par une transition `LITIGE → EN_INSTRUCTION` avec motif ; sans motif, elle est refusée.
- Un dossier en litige ne peut pas recevoir d'ordre de règlement ni de nouvelle offre tant qu'il n'est pas revenu en `EN_INSTRUCTION` (`ACCORD_ENREGISTRE`, `TRANSITION_INCONNUE`).
- À l'entrée en litige, la provision est revue avec motif ; un écart de 2 000 000 FCFA ou plus attend le responsable (paramètre, §6).
- Les échéances légales du corporel continuent de courir pendant le litige ; les suspensions et prorogations légales (expert commun, +1 mois, art. 252 et 252 bis, SÛR) se saisissent à la main et se tracent (§5.14).
- Au corporel automobile, le litige ne peut être porté en justice avant l'expiration du délai d'offre de l'art. 231 (art. 239, SÛR) : le dossier l'affiche.
- Les honoraires d'un conseil mandaté par la compagnie pour le litige sont des règlements de nature `HONORAIRES` (FR-91).

#### FR-125 : La fraude suspectée suspend le paiement sans le dire à l'assuré

Un dossier passe `FRAUDE_SUSPECTEE` quand un humain **signale** une suspicion de fraude : `GEST`, `GREC`, `RESP`, `DG`, `DT` ou `AUD`, avec motif, depuis `EN_INSTRUCTION`, `EVALUE`, `EN_VALIDATION`, `OFFRE_ENVOYEE`, `ORDRE_EMIS` ou `CHEQUE_A_REMETTRE` (la démo n'offrait que les deux premiers [ASSUMPTION: extension aux états de paiement, car une suspicion peut naître à tout moment]). Dans cet état, aucun geste de paiement n'est possible. Le dossier sort par l'écartement de la suspicion (retour `EN_INSTRUCTION`) ou par la confirmation (passage `REJETE`), décrits aux FR-129 et FR-133. La suspicion n'est **jamais révélée** à l'assuré ni au courtier : les écrans et les messages qui leur sont destinés disent « dossier en cours d'instruction ».

**Conséquences (testables) :**
- Un signalement sans motif est refusé (`MOTIF_ECRIT`).
- Depuis `CHEQUE_A_REMETTRE`, le signalement suspend la remise ; la comptabilité reçoit une alerte pour décider d'une opposition sur le chèque, et la quittance passe `ANNULEE` si l'opposition est faite.
- Dans l'état `FRAUDE_SUSPECTEE`, une demande d'émission, de remise ou de paiement est refusée (`AUCUN_SIGNAL_BLOQUANT`) ; l'accord de l'assuré, s'il est reçu, est enregistré mais ne crée pas d'ordre.
- La vue de l'assuré, le message de suivi, et toute notification externe n'emploient aucun mot qui évoque la fraude ; un test lit chaque modèle de message sortant.
- Les échéances légales du corporel continuent de courir ; elles sont affichées en alerte au responsable et à `AUD`.
- L'accès au contenu de la revue est réservé à `RESP`, `DG`, `DT` et `AUD` ; les autres rôles voient seulement « suspendu ».

#### FR-126 : La réouverture des sorties

Les dossiers `REJETE` et `SANS_SUITE` peuvent être **rouverts** par `RESP`, `DG` ou `DT`, avec motif écrit : sur contestation de l'assuré après un refus (transition 40), ou parce que l'assuré se manifeste après un classement sans suite (transition 41, ajout à la démo [ASSUMPTION: la démo ne rouvre pas SANS_SUITE]). Le dossier repasse `EN_INSTRUCTION`. Les contestations sont des réclamations (§6.1) rattachées au dossier.

**Conséquences (testables) :**
- Une réouverture sans motif est refusée (`MOTIF_ECRIT`) ; par un autre rôle, elle est refusée (`DROIT_INSUFFISANT`).
- Une réouverture d'un dossier refusé pour garantie exige une nouvelle décision de garantie motivée avant toute évaluation (`GARANTIE_ENGAGEABLE`).
- À la réouverture, la provision est reposée par le gestionnaire avec motif ; le délai interne d'instruction repart d'un nouveau point de départ daté.
- Le courrier de refus initial reste au dossier ; la réouverture crée un courrier d'accusé à l'assuré (§5.15).
- Si le dossier avait été versé aux archives, la sortie de la chemise suit les mêmes règles qu'à FR-107.
- Chaque réouverture figure dans le journal avec son motif ; un dossier rouvert plus de deux fois est signalé à `AUD` [ASSUMPTION: alerte à la 3e ouverture].

### 5.12 La fraude : un score qui ouvre une revue humaine

La détection de fraude est un **filet**, pas un juge. Le serveur calcule un score à partir de signaux ; le score **ouvre une revue humaine** et, à son niveau le plus haut, **suspend** l'ordre et le paiement ; aucune décision n'est automatique (« un signal n'est pas une accusation »).

#### FR-127 : Les signaux et leurs poids

Neuf signaux sont calculés sur chaque dossier, avec les poids de la démo comme valeurs par défaut. Chaque signal et chaque poids est un **paramètre** de la compagnie ; la compagnie peut en ajouter ou en retirer.

| Signal | Se déclenche quand | Poids |
|---|---|---|
| `CONTRAT_NON_ACTIF` | la police n'est pas en vigueur à la date du sinistre | 40 |
| `SINISTRE_PRECOCE` | le sinistre survient 0 à 30 jours après la prise d'effet | 30 |
| `INCOHERENCE_DATES` | la déclaration précède le sinistre, ou le sinistre précède la prise d'effet | 30 |
| `SINISTRES_REPETES` | 3 sinistres ou plus sur la même police | 25 |
| `MONTANT_ATYPIQUE` | l'évaluation dépasse 4 fois le coût moyen de la branche | 20 |
| `VEHICULE_RECURRENT` | 3 dossiers ou plus sur la même immatriculation | 20 |
| `BENEFICIAIRE_MULTIPLE` | 3 dossiers ou plus pour le même nom de bénéficiaire | 15 |
| `TELEPHONE_PARTAGE` | 3 assurés ou plus sur le même numéro de téléphone | 15 |
| `DECLARATION_TARDIVE` | déclaration plus de 45 jours après le sinistre | 10 |

**Conséquences (testables) :**
- Chaque signal a un code, un libellé, un détail chiffré (« 4 sinistres sur la police en 18 mois »), un poids et la source qui le fonde (police, journal, portefeuille).
- Les signaux sont recalculés à la déclaration, à chaque événement qui les touche (évaluation, nouveau bénéficiaire, nouvelle pièce) et chaque nuit sur les dossiers vivants ; chaque calcul garde sa date.
- Un test de recette change chaque poids et chaque seuil de signal (3 sinistres, 4 fois, 45 jours) et vérifie l'effet sur le score.
- Un signal ajouté par la compagnie apparaît dans le score, la revue et l'explication sans changement de code.
- Un signal calculé à partir d'un contrat non lisible (logiciel de la compagnie indisponible) est marqué « non calculé » et non « absent ».

#### FR-128 : Le score est plafonné à 100 et se lit en quatre niveaux

Le **score** d'un dossier est la somme des poids des signaux présents, **plafonnée à 100**. Il se lit en quatre niveaux : `NORMAL` (moins de 20), `ATTENTION` (20 et plus), `SUSPECT` (45 et plus), `BLOQUE` (70 et plus). Les seuils sont des paramètres. À partir de `SUSPECT`, une **revue** est ouverte (FR-129) ; à `BLOQUE`, l'ordre et le paiement sont suspendus (FR-130) [ASSUMPTION: la démo ne dit pas à partir de quel niveau la revue s'ouvre ; SUSPECT par recommandation].

**Conséquences (testables) :**
- Des signaux de poids 40, 30 et 30 donnent un score de 100, pas 100 plus 0 : le plafond s'applique ; un test le vérifie.
- Un score de 44 est `ATTENTION`, un score de 45 est `SUSPECT`, un score de 69 est `SUSPECT`, un score de 70 est `BLOQUE`.
- Le niveau et le score sont visibles du gestionnaire, du responsable, de la direction et du contrôle interne ; l'assuré et le courtier ne les voient jamais.
- L'écran explique le score : la contribution de chaque signal, la date du calcul, l'historique des scores du dossier.
- Un dossier `NORMAL` ou `ATTENTION` n'ouvre pas de revue ; le niveau `ATTENTION` s'affiche en bandeau discret sur la fiche.

#### FR-129 : La revue humaine est obligatoire et motivée

La revue de fraude suit `NON_REVU → EN_REVUE → ECARTE | CONFIRME`. Un dossier `SUSPECT` ou `BLOQUE` entre en `NON_REVU` dans la file du contrôle interne. Un relecteur (`AUD`, `RESP`, `DG` ou `DT`) **prend** la revue (`EN_REVUE`), puis conclut : **écarter** (`RESP`, `DG`, `DT`, `AUD`) ou **confirmer** (`DG`, `DT`, `AUD`, FR-133), avec une **conclusion écrite**. Le relecteur n'est jamais le gestionnaire du dossier [ASSUMPTION: séparation du relecteur et du gestionnaire].

**Conséquences (testables) :**
- Une conclusion sans texte est refusée (`MOTIF_ECRIT`).
- Une conclusion par le gestionnaire ou le gestionnaire recours du dossier est refusée (`SEPARATION_DES_TACHES`).
- Une confirmation par `RESP` est refusée (`DROIT_INSUFFISANT`) ; un écartement par `GEST` l'est aussi.
- Un dossier `BLOQUE` non revu depuis plus de 3 jours ouvrés est signalé au responsable et à `AUD` [ASSUMPTION: 3 jours ouvrés].
- Une revue `ECARTE` garde ses signaux visibles, avec la conclusion et l'auteur ; elle ne les supprime pas. Un nouvel événement qui change le score d'un niveau ouvre une nouvelle revue.
- Chaque changement d'état de la revue est tracé (auteur, rôle, date et heure, conclusion).

#### FR-130 : Un dossier BLOQUE non écarté suspend l'ordre et le paiement

Tant qu'un dossier `BLOQUE` n'a pas une revue `ECARTE`, le serveur refuse : la validation et l'envoi de l'offre (transition 10), l'enregistrement de l'accord qui crée l'ordre (14), l'émission du règlement (17, 18) et la remise ou la confirmation du paiement (20). L'instruction (pièces, expertise, évaluation) continue. Le blocage ne se contourne ni par un écran ni par un cumul de rôles.

**Conséquences (testables) :**
- Chacune des transitions 10, 14, 17, 18 et 20 d'un dossier `BLOQUE` non écarté est refusée avec le code `AUCUN_SIGNAL_BLOQUANT` et le message « Dossier suspendu par le contrôle interne ».
- La levée du blocage n'est possible que par une revue `ECARTE` ; ni `RESP`, ni `DG` ne peuvent forcer une transition sans elle.
- Le gestionnaire voit « dossier suspendu » sans voir le détail de la revue ; la comptabilité voit l'ordre suspendu et sa raison générique.
- Un dossier devenu `BLOQUE` après l'émission d'un chèque suspend la remise, sans annuler le chèque (FR-125).
- Un indicateur « paiements faits sur un dossier `SUSPECT` ou `BLOQUE` non revu » est calculé pour `AUD` (FR-131) ; sa valeur cible est zéro.

#### FR-131 : La priorisation des revues

Le contrôle interne ne peut pas tout revoir : la file de revue est **ordonnée**. Les dossiers où de l'**argent a déjà été versé** passent d'abord ; puis l'**exposition** (montant évalué, validé ou à payer) ; puis le **score**. La file se lit aussi par **ancienneté** de la revue ouverte : jusqu'à 7 jours, 8 à 30 jours, 31 à 90 jours, plus de 90 jours (paramètres). Deux indicateurs sont affichés : les « paiements sans revue » et le taux de prise en charge des revues.

**Conséquences (testables) :**
- Un dossier avec un règlement `PAYE` et un score de 50 passe avant un dossier sans paiement et un score de 90.
- À argent versé égal, le dossier de plus forte exposition passe avant ; à exposition égale, le plus fort score passe avant.
- Les tranches d'ancienneté sont des paramètres ; un test les change et vérifie le classement.
- Le taux de prise en charge est le nombre de revues `EN_REVUE`, `ECARTE` ou `CONFIRME` divisé par le nombre de revues ouvertes ; il se calcule sur une période choisie.
- `AUD` et `RESP` voient la file ; `GEST` ne voit que le signalement « suspendu » de ses dossiers.

#### FR-132 : Le graphe des liens par l'IA (usage n° 10)

L'IA commune (instance locale) construit pour chaque dossier un **graphe de liens** avec les autres dossiers du portefeuille sur une fenêtre de 12 mois (paramètre). Les entités rapprochées sont : **mêmes témoins**, **mêmes garages** (dont les devis dépassent de plus de 20 % la moyenne du marché, paramètre), **mêmes photos** (empreinte visuelle identique ou proche), **mêmes téléphones**, ainsi que le même véhicule, la même victime sur plusieurs contrats, et le même bénéficiaire ou le même compte de paiement [ASSUMPTION: bénéficiaire et compte de paiement ajoutés aux entités de la démo]. La sortie est un graphe de dossiers liés avec, pour chaque lien, l'entité commune, un score de lien et la **source** (pièces, journal, portefeuille). Le destinataire est le contrôle interne et le relecteur. Garde-fous : un lien n'est qu'un indice ; le graphe ne modifie pas le score (FR-128) tant que la compagnie n'a pas fixé de poids [ASSUMPTION: les liens nourrissent la revue, pas le score] ; l'IA ne décide rien ; chaque lien est inscrit au registre de l'IA (niveau `ANALYSE`) ; aucune donnée nominative ni médicale ne sort de l'instance locale ; si l'IA est coupée, les liens exacts (téléphone, immatriculation, compte de paiement) restent servis par des règles explicables, et la comparaison de photos est « indisponible » [ASSUMPTION: la démo simulait l'empreinte de photo ; sans modèle de vision, seule l'identité exacte du fichier est comparée].

**Conséquences (testables) :**
- Deux dossiers qui partagent un numéro de téléphone, une immatriculation ou un compte de paiement sont reliés dans le graphe, avec l'entité commune et un lien vers chaque dossier.
- Un lien sans source (pièce ou donnée) n'est pas affiché.
- Un garage dont les devis dépassent de plus de 20 % la moyenne du marché sur au moins 5 dossiers est signalé comme entité partagée [ASSUMPTION: 5 dossiers minimum ; la démo fixe 20 % mais pas le nombre minimum].
- Un test rejoue un réseau de trois dossiers (même téléphone, même garage, même photo) et vérifie que le graphe les relie, que le score n'est pas modifié, et que le registre de l'IA contient les trois liens.
- Le graphe n'est lisible que par `AUD`, `RESP`, `DG`, `DT` et le relecteur de la revue en cours ; chaque consultation est journalisée.
- Le graphe ne contient aucun champ de santé.

#### FR-133 : La confirmation de la fraude par la direction ou le contrôle interne

La **confirmation** de la fraude est réservée à `DG`, `DT` et `AUD`, avec une conclusion écrite. Elle fait passer le dossier de `FRAUDE_SUSPECTEE` à `REJETE` (transition 38), avec un courrier de refus rédigé et signé comme au FR-122. L'écartement (transition 37) renvoie le dossier en `EN_INSTRUCTION`. La fraude confirmée est un motif de conservation longue du dossier (§6.2, décision D17).

**Conséquences (testables) :**
- Une confirmation par `RESP`, `GEST` ou `GREC` est refusée (`DROIT_INSUFFISANT`).
- Une confirmation sans conclusion écrite est refusée (`MOTIF_ECRIT`).
- À la confirmation, le dossier est conservé comme dossier de fraude (conservation longue), sa provision passe à zéro, et le responsable de la lutte contre le blanchiment est alerté pour décider d'une déclaration de soupçon (règlement CIMA n° 0004, art. 14 et 15, SÛR) ; Prospera n'envoie aucune déclaration lui-même.
- Si de l'argent a déjà été versé, le dossier porte une alerte « indu à examiner » pour `RESP` et `DG` ; Prospera n'ouvre pas de créance sur l'assuré [ASSUMPTION: la récupération d'un indu est hors périmètre du premier jour ; à traiter à la séance d'immersion].
- Le refus qui suit la confirmation ne mentionne pas la fraude ; il emploie le motif retenu par la direction, dans les termes du FR-125.
- Un écartement garde la conclusion et ne supprime ni le score ni les signaux ; un nouveau signal du même type n'ouvre pas de revue tant que le score n'a pas changé de niveau.

### 5.13 La machine à états complète du dossier

Cette section rassemble la **machine à états du dossier sinistre** : les 11 statuts, les 4 sorties, toutes les transitions, les conditions qui les gardent et les rôles qui les déclenchent. Elle réécrit les 31 transitions de la démo sur les 11 statuts du circuit de référence (décision D5), avec les changements de l'offre et de l'accord (D6), du recours en parallèle (D10) et des règlements multiples (D11). Les sections 5.2 à 5.12 décrivent le contenu de chaque geste ; cette section est la **table de vérité** que le serveur applique. En cas d'écart entre une phrase d'une autre section et cette table, la table fait foi.

#### FR-134 : Les statuts du dossier

Le dossier est toujours dans **un seul** statut. Onze statuts forment le circuit nominal, quatre sorties s'y ajoutent. Un statut est dit **terminal** quand il n'a pas d'autre sortie que la réouverture.

| Statut | Phase | Sens | Terminal |
|---|---|---|---|
| `DECLARE` | 1 Déclarer | la déclaration est enregistrée, la référence de déclaration est attribuée, le doublon est contrôlé | non |
| `PIECES_ATTENDUES` | 2 Ouvrir | le dossier existe, il manque au moins une pièce obligatoire ; l'assuré est relancé | non |
| `OUVERT` | 2 Ouvrir, 3 Attribuer | recevabilité contrôlée, pièces complètes ; le responsable désigne qui instruit | non |
| `EN_INSTRUCTION` | 4 Instruire | un gestionnaire instruit : pièces, responsabilité, missions d'expertise ou accord sur devis | non |
| `EVALUE` | 5 Chiffrer | le décompte est arrêté (dommage, vétusté, franchise, plafond, règle proportionnelle) | non |
| `EN_VALIDATION` | 6 Décider | la décision attend les signatures de la délégation | non |
| `OFFRE_ENVOYEE` | 6 Décider | l'offre validée est partie chez l'assuré ; on attend son accord | non |
| `ORDRE_EMIS` | 7 Payer | l'accord est enregistré, l'ordre de règlement est émis, la comptabilité n'a pas fini | non |
| `CHEQUE_A_REMETTRE` | 7 Payer | le chèque est émis et attend sa remise au guichet | non |
| `REGLE` | 7 Payer | tous les règlements sont remis ou confirmés, le reste à payer est zéro | non |
| `CLOTURE` | 8 Clore | le dossier est clos, le recours éventuel continue seul | oui (rouvrable) |
| `REJETE` | sortie | refus de prise en charge motivé et notifié | oui (rouvrable) |
| `SANS_SUITE` | sortie | classé : assuré injoignable après relances | oui (rouvrable) |
| `LITIGE` | sortie | offre refusée, contre-expertise, désaccord de fond | non |
| `FRAUDE_SUSPECTEE` | sortie | suspicion signalée par un humain, paiement suspendu | non |

La phase 3 « Attribuer » n'est pas un statut : c'est `OUVERT` avec un gestionnaire désigné (§5.3). Le recours n'est plus un statut du dossier (§5.10).

**Conséquences (testables) :**
- Un dossier a toujours un et un seul statut parmi les quinze ; une valeur inconnue est refusée (`STATUT_INCONNU`).
- Le statut du dossier ne se modifie jamais par une écriture directe : seules les transitions du FR-135 le changent.
- Les statuts `ORDRE_EMIS`, `CHEQUE_A_REMETTRE` et `REGLE` sont dérivés des règlements (§5.8, FR-92) ; une transition vers l'un d'eux est refusée si l'état des règlements ne le justifie pas.
- Les anciens statuts de la démo se retrouvent par correspondance : `PIECES_INCOMPLETES` devient `PIECES_ATTENDUES`, `EN_ETUDE` devient `EN_INSTRUCTION`, `VALIDATION` devient `EN_VALIDATION`, `OFFRE_ENVOYEE` est nouveau, `RECOURS` disparaît.
- Un test de recette vérifie la correspondance sur le jeu de démonstration repris (~3 500 dossiers) : aucun dossier sans statut valide.

#### FR-135 : Les transitions

Voici **toutes** les transitions autorisées. Les rôles sont ceux du PRD (§2) ; « comité » est l'instance de la matrice de délégation, pas un rôle (§5.7). Une transition absente du tableau est interdite.

| # | Depuis → vers | Libellé | Rôle(s) | Conditions | Motif obligatoire |
|---|---|---|---|---|---|
| 1 | `DECLARE → OUVERT` | Ouvrir et orienter vers le volet | ACC, GEST, GREC, RESP | `CONTRAT_VERIFIE`, `PIECES_COMPLETES` | non |
| 2 | `DECLARE → PIECES_ATTENDUES` | Ouvrir en attente de pièces | ACC, GEST, GREC, RESP | `CONTRAT_VERIFIE` | non |
| 3 | `PIECES_ATTENDUES → OUVERT` | Reprendre le circuit : pièces reçues | ACC, GEST, GREC, RESP | `PIECES_COMPLETES` | non |
| 4 | `DECLARE → REJETE` | Refuser : sinistre non garanti | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 5 | `OUVERT → EN_INSTRUCTION` | Prendre le dossier en instruction | GEST, GREC, RESP | `DOSSIER_AFFECTE` | non |
| 6 | `EN_INSTRUCTION → PIECES_ATTENDUES` | Demander des pièces complémentaires | GEST, GREC, RESP | — | non |
| 7 | `EN_INSTRUCTION → EVALUE` | Enregistrer l'évaluation au décompte | GEST, GREC, RESP | `PIECES_COMPLETES`, `EXPERTISE_VALIDEE`, `GARANTIE_ENGAGEABLE`, `MONTANT_EVALUE` | non (oui si le montant diffère du chiffrage validé) |
| 8 | `EVALUE → EN_VALIDATION` | Envoyer en validation | GEST, GREC, RESP | `MONTANT_EVALUE` | non |
| 9 | `EVALUE → EN_INSTRUCTION` | Reprendre l'instruction avant validation | GEST, GREC, RESP | — | oui |
| 10 | `EN_VALIDATION → OFFRE_ENVOYEE` | Valider selon la délégation et envoyer l'offre | validation : RESP, comité, DT, DG selon §5.7 ; envoi : GEST, RESP | `VALIDATION_ACQUISE`, `SEPARATION_DES_TACHES`, `COMPLEMENT_EXPERT_RECU`, `AUCUN_SIGNAL_BLOQUANT` | oui |
| 11 | `EN_VALIDATION → EN_INSTRUCTION` | Renvoyer en instruction : réévaluation demandée | RESP, comité, DT, DG | — | oui |
| 12 | `EN_VALIDATION → PIECES_ATTENDUES` | Demander des pièces avant validation | RESP, comité, DT, DG | — | oui |
| 13 | `EN_VALIDATION → REJETE` | Refuser la prise en charge | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 14 | `OFFRE_ENVOYEE → ORDRE_EMIS` | Enregistrer l'accord et émettre l'ordre de règlement | GEST, RESP | `ACCORD_ENREGISTRE`, `MONTANT_VALIDE`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 15 | `OFFRE_ENVOYEE → EN_INSTRUCTION` | Reprendre : contre-proposition de l'assuré | GEST, RESP | contre-proposition enregistrée | oui |
| 16 | `OFFRE_ENVOYEE → LITIGE` | Constater le refus de l'offre | RESP, DG, DT | refus enregistré | oui |
| 17 | `ORDRE_EMIS → CHEQUE_A_REMETTRE` | Émettre le règlement : chèque | CPT | `ORDRE_COMPLET`, `CONTROLE_LBC_FT`, `AUCUN_SIGNAL_BLOQUANT`, `SEPARATION_DES_TACHES` | non |
| 18 | `ORDRE_EMIS → REGLE` | Constater le paiement électronique | CPT lance, `paiement` confirme | `QUITTANCE_SIGNEE`, `COORDONNEES_VERIFIEES`, `CONTROLE_LBC_FT`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 19 | `ORDRE_EMIS → EN_VALIDATION` | Rejeter l'ordre : anomalie comptable | CPT | — | oui |
| 20 | `CHEQUE_A_REMETTRE → REGLE` | Constater la remise au bénéficiaire | ACC, CPT | `REGLEMENT_EMIS`, `IDENTITE_RETIRANT`, `QUITTANCE_SIGNEE`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 21 | `CHEQUE_A_REMETTRE → ORDRE_EMIS` | Annuler le chèque non retiré et ré-émettre | CPT | — | oui |
| 22 | `REGLE → CLOTURE` | Clôturer après règlement | GEST, GREC, RESP | `REGLEMENT_REMIS`, `SOLDE_APURE`, `RECOURS_QUALIFIE` | oui |
| 23 | `REGLE → EN_INSTRUCTION` | Reprendre après règlement provisionnel | GEST, RESP | règlement provisionnel remis, consolidation attendue | oui |
| 24 | `EN_INSTRUCTION → REJETE` | Notifier un refus de prise en charge | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 25 | `EN_INSTRUCTION → SANS_SUITE` | Classer sans suite | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` | oui |
| 26 | `PIECES_ATTENDUES → SANS_SUITE` | Classer sans suite : assuré injoignable | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` | oui |
| 27 | `OFFRE_ENVOYEE → SANS_SUITE` | Classer sans suite : offre sans réponse | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES`, offre sans réponse depuis 30 jours | oui |
| 28 | `EVALUE → LITIGE` | Constater un litige | RESP, DG, DT | — | oui |
| 29 | `EN_VALIDATION → LITIGE` | Constater un litige | RESP, DG, DT | — | oui |
| 30 | `LITIGE → EN_INSTRUCTION` | Litige résolu : reprendre l'instruction | RESP, DG, DT | — | oui |
| 31 | `EN_INSTRUCTION → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | GEST, GREC, RESP, DG, DT, AUD | — | oui |
| 32 | `EVALUE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 33 | `EN_VALIDATION → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 34 | `OFFRE_ENVOYEE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 35 | `ORDRE_EMIS → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 36 | `CHEQUE_A_REMETTRE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 37 | `FRAUDE_SUSPECTEE → EN_INSTRUCTION` | Écarter la suspicion et reprendre | RESP, DG, DT, AUD | revue `ECARTE` | oui |
| 38 | `FRAUDE_SUSPECTEE → REJETE` | Confirmer la fraude et refuser | DG, DT, AUD | revue `CONFIRME` | oui |
| 39 | `CLOTURE → EN_INSTRUCTION` | Rouvrir le dossier | RESP, DG, DT | — | oui |
| 40 | `REJETE → EN_INSTRUCTION` | Rouvrir sur contestation | RESP, DG, DT | — | oui |
| 41 | `SANS_SUITE → EN_INSTRUCTION` | Rouvrir : l'assuré se manifeste | RESP, DG, DT | — | oui |

**Correspondance avec les 31 transitions de la démo.** Reprises à l'identique, sur les nouveaux noms de statuts : 1 à 8 de la démo (devenues 1 à 8), 10 à 12 (devenues 11, 12, 13), 15 (devenue 20), 17 à 19 (devenues 24, 25, 26), 22 et 23 (devenues 28, 29), 24 et 25 (devenues 31, 32), 26 à 28 (devenues 37, 38, 30), 30 et 31 (devenues 39, 40). Remaniées : la transition 9 de la démo (valider et émettre l'ordre) est **scindée** en deux, valider et envoyer l'offre (10), puis enregistrer l'accord et émettre l'ordre (14), sur la décision D6 ; la 13 de la démo (émettre quittance et chèque) devient 17 ; la 14 (rejet de l'ordre) devient 19 ; la 16 (clôture) devient 22 avec la condition `RECOURS_QUALIFIE`. **Supprimées** : les 20, 21 et 29 de la démo (passage au recours), le recours étant désormais un suivi parallèle (D10). **Nouvelles** : 9, 15, 16, 18, 21, 23, 27, 33 à 36 et 41 [ASSUMPTION: 9, 21, 23, 27, 33 à 36 et 41 sont des ajouts de rédaction pour qu'aucun état n'ait de cul-de-sac et que le paiement puisse être arrêté ; 15, 16 et 18 découlent de D6 et D11].

**Conséquences (testables) :**
- Le tableau contient 41 lignes ; un test de recette les énumère et vérifie, pour chacune, un cas réussi et un cas refusé par condition.
- Toute transition demandée hors du tableau est refusée avec le code `TRANSITION_INCONNUE` ; la réponse nomme le statut courant et les transitions possibles pour le rôle.
- Une transition demandée par un rôle absent de sa ligne est refusée (`DROIT_INSUFFISANT`), même si le même utilisateur a un autre rôle qui y serait autorisé et qu'il n'agit pas sous celui-ci.
- Une transition marquée « motif obligatoire » sans motif de 10 caractères au moins est refusée (`MOTIF_ECRIT`).
- Un dossier `OUVERT` jugé non garanti passe par `EN_INSTRUCTION` avant d'être refusé : le refus depuis `OUVERT` n'existe pas, car personne n'a encore la charge du dossier [ASSUMPTION: refus d'un dossier non attribué non prévu ; à confirmer à la séance d'immersion].
- Les transitions 14, 17, 18 et 20 sont refusées si le montant de l'ordre n'est pas celui de l'accord (`MONTANT_VALIDE`).

#### FR-136 : Les conditions nommées et leur texte

Chaque condition a un **code** et un **texte** que le serveur renvoie tel quel à l'utilisateur ; le **code de refus** est le nom de la condition non remplie. Le texte reprend ceux de la démo et les complète. Les écrans affichent aussi les actions **fermées** avec ce texte (« vous ne pouvez pas évaluer parce qu'il manque le rapport de police »).

| Code | Texte opposé à l'utilisateur | Définition |
|---|---|---|
| `PIECES_COMPLETES` | Toutes les pièces obligatoires doivent être reçues. | aucune pièce obligatoire au statut « attendue » |
| `CONTRAT_VERIFIE` | La police doit être en vigueur à la date du sinistre. | police en vigueur et date du sinistre entre prise d'effet et échéance, d'après la dernière lecture du logiciel de la compagnie (date affichée) |
| `GARANTIE_ENGAGEABLE` | La garantie doit être acquise, ou une décision motivée enregistrée. | garantie acquise, ou décision `GARANTIE_ACQUISE`, `SOUS_RESERVE` ; un `REFUS_DE_GARANTIE` la ferme (jamais sautée, D4) |
| `DECISION_GARANTIE` | Une décision de garantie motivée est requise. | décision `REFUS_DE_GARANTIE` enregistrée avec motif |
| `DOSSIER_AFFECTE` | Le dossier doit avoir été attribué à un gestionnaire par l'encadrement. | gestionnaire désigné par `RESP` ; l'accueil n'attribue jamais |
| `EXPERTISE_VALIDEE` | Toute expertise ouverte doit avoir rendu son rapport et être validée. | toutes les missions non annulées sont validées ou arbitrées |
| `COMPLEMENT_EXPERT_RECU` | Un complément demandé à l'expert n'est pas revenu. | aucun complément en attente, sauf passage outre du `RESP` avec motif (D15) |
| `MONTANT_EVALUE` | Saisissez le montant arrêté au décompte. | montant évalué supérieur à zéro |
| `VALIDATION_ACQUISE` | La validation exigée par la délégation n'est pas complète. | signatures du niveau requis par le cumul des montants validés du dossier (§5.7) |
| `MONTANT_VALIDE` | Le montant dépasse le montant validé. | montant du règlement ou de l'ordre inférieur ou égal au validé |
| `SEPARATION_DES_TACHES` | Celui qui instruit ne valide pas ; celui qui décide ne paie pas. | l'utilisateur n'a pas exercé une fonction incompatible sur ce dossier (SEP-01, SEP-02) |
| `AUCUN_SIGNAL_BLOQUANT` | Dossier suspendu par le contrôle interne. | aucun dossier de fraude `BLOQUE` sans revue `ECARTE` |
| `ACCORD_ENREGISTRE` | L'accord de l'assuré n'est pas enregistré. | accord rattaché avec sa pièce et son montant (§5.8, FR-90) |
| `ORDRE_COMPLET` | Indiquez la banque, le numéro du chèque et le montant. | champs obligatoires du moyen de règlement saisis |
| `QUITTANCE_SIGNEE` | La quittance doit être signée. | quittance `SIGNEE` avec pièce de signature |
| `COORDONNEES_VERIFIEES` | Les coordonnées de paiement ne sont pas vérifiées. | compte ou numéro Mobile Money vérifié au nom du bénéficiaire, sans changement récent non levé |
| `CONTROLE_LBC_FT` | Un contrôle de lutte contre le blanchiment est en alerte. | aucune alerte du FR-100 non levée |
| `IDENTITE_RETIRANT` | Indiquez l'identité et le numéro de pièce d'identité de la personne qui retire le chèque. | identité et numéro de pièce saisis |
| `REGLEMENT_EMIS` | Le règlement doit avoir été émis. | au moins une quittance émise |
| `REGLEMENT_REMIS` | Le règlement doit avoir été remis. | tous les règlements remis ou annulés |
| `SOLDE_APURE` | Il reste une somme à payer. | reste à payer inférieur ou égal à zéro |
| `RECOURS_QUALIFIE` | La question du recours doit être tranchée. | un recours ouvert, ou la décision « aucun tiers en cause » enregistrée |
| `RELANCES_EPUISEES` | Les relances prévues n'ont pas toutes été faites. | au moins 3 relances sans effet, sur 2 canaux, puis 15 jours (§5.11) |
| `DECISION_DIRECTION` | Cette décision relève de la direction. | décision de `DG` ou `DT` |
| `MOTIF_ECRIT` | Un motif écrit d'au moins 10 caractères est obligatoire. | motif présent, 10 caractères au moins |
| `DROIT_INSUFFISANT` | Cette action est réservée à d'autres rôles. | le rôle exercé n'est pas dans la ligne de la table |
| `TRANSITION_INCONNUE` | Cette étape n'est pas possible depuis le statut actuel. | transition absente de la table |
| `ETAT_PERIME` | Le dossier a changé depuis votre lecture ; rechargez. | la version lue n'est plus la version courante |

Les conditions du recours (`TIERS_IDENTIFIE`, `PIECE_PROBANTE`, `CREANCE_ETABLIE`, `PAIEMENT_ASSURE`, `RESPONSABILITE_TIERS`, `ACCORD_CONCLU`, `TOUT_RAPPROCHE`, `ARBITRAGE_APPLICABLE`) ont leur définition au §5.10.

**Conséquences (testables) :**
- Chaque refus renvoie le code de la condition, son texte, et le nom du champ ou de la pièce qui manque quand il y en a un.
- Les textes se règlent par l'administrateur et se valident par le responsable ; un code ne change jamais de sens.
- Un test de recette provoque chaque refus du tableau sur le dossier de démonstration `SIN-2026-9002` et vérifie le code et le texte.
- Les codes sont stables d'une version à l'autre ; ils ne contiennent aucun nom de personne ni de compagnie.

#### FR-137 : Un écran ne peut pas forcer ce que le serveur refuse

Toutes les règles de la table sont appliquées **par le serveur**, à chaque demande, indépendamment de ce que l'écran propose. Le serveur revérifie le rôle, la table, les conditions, le motif et la version du dossier au moment de l'application (« un écran ne doit pas pouvoir forcer ce que le circuit refuse »). Les droits viennent de la **matrice d'accès** de l'annexe B, lue par le serveur et par les écrans. Les trois **séparations de fonctions** de la démo sont reprises : **SEP-01** (l'instructeur ne valide pas son propre dossier), **SEP-02** (aucune sortie de trésorerie sans comptable distinct du décideur), **SEP-03** (la délégation se mesure sur le cumul des montants validés du dossier, anti-fractionnement, §5.7). Le rôle `ADMIN` ne lit aucune donnée métier et ne déclenche aucune transition.

**Conséquences (testables) :**
- Un appel direct à l'interface du serveur pour une transition interdite est refusé avec le même code que l'écran.
- Deux demandes simultanées sur le même dossier : la seconde, lue avant la première, est refusée (`ETAT_PERIME`) ; aucune n'est appliquée deux fois.
- Une demande rejouée (même identifiant de demande) n'applique la transition qu'une fois.
- Un utilisateur avec deux rôles agit sous l'un ou l'autre, nommé à chaque demande ; la séparation des fonctions se mesure sur la personne, pas sur le rôle.
- La tentative de violation d'une séparation est refusée et inscrite au journal, visible de `AUD` (`SEPARATION_DES_TACHES`).
- Un montant cumulé validé qui franchit un seuil de délégation par fractionnement est refusé au niveau inférieur, avec le code `VALIDATION_ACQUISE`.

#### FR-138 : La piste d'audit de chaque transition

Chaque transition réussie **et chaque refus** écrit une ligne d'audit, non modifiable : dossier, statut avant, statut après, numéro de transition, utilisateur, rôle exercé, **date et heure** du serveur, motif, liste des conditions évaluées et leur résultat, version des paramètres appliqués, numéro de sinistre officiel et référence de déclaration. Les valeurs avant et après de tout champ sensible (montant, provision, bénéficiaire, gestionnaire) sont conservées. Les lectures de données de santé sont journalisées (D14). Le journal est conservé au moins 10 ans (Code CIMA, art. 404, SÛR) ; il ne peut ni être supprimé ni recevoir d'insertion rétroactive (principe de l'art. 407, SÛR pour la comptabilité informatisée, transposé `[à valider par le juriste]`).

**Conséquences (testables) :**
- Chaque transition du tableau, jouée dans un test, écrit exactement une ligne d'audit de succès ; chaque refus écrit une ligne de refus avec son code.
- Aucun écran, API ni administrateur ne supprime ni ne modifie une ligne d'audit ; un test tente les deux et échoue.
- Le journal d'un dossier se consulte par ordre de temps, se filtre par type d'action et par utilisateur, et s'exporte pour `AUD` (périmètre, période).
- La date et l'heure sont celles du serveur, jamais celles du poste.
- Une transition faite pour le compte d'une délégation (le comité, le visa) porte la liste des signataires et leur rôle.

#### FR-139 : Aucun état non terminal sans issue

Le graphe des transitions est **vérifié automatiquement** : chaque statut non terminal a au moins une sortie, chaque statut est atteignable depuis `DECLARE`, et il existe un chemin nominal de `DECLARE` à `CLOTURE`. Les statuts et les transitions sont **fixes** ; la compagnie règle les seuils, les délégations, les délais et les droits par rôle, dans la limite des séparations de fonctions, mais ne crée pas de statut [ASSUMPTION: statuts et transitions non paramétrables par la compagnie au premier jour ; à confirmer à la séance d'immersion].

**Conséquences (testables) :**
- Un test calcule, pour chaque statut non terminal (`DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `EN_INSTRUCTION`, `EVALUE`, `EN_VALIDATION`, `OFFRE_ENVOYEE`, `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE`, `LITIGE`, `FRAUDE_SUSPECTEE`), ses transitions de sortie et échoue s'il y en a zéro.
- Un test calcule l'ensemble des statuts atteignables depuis `DECLARE` et échoue s'il manque l'un des quinze.
- Le chemin nominal `DECLARE → PIECES_ATTENDUES → OUVERT → EN_INSTRUCTION → EVALUE → EN_VALIDATION → OFFRE_ENVOYEE → ORDRE_EMIS → CHEQUE_A_REMETTRE → REGLE → CLOTURE` (transitions 2, 3, 5, 7, 8, 10, 14, 17, 20, 22) est rejoué par la recette sur le dossier de démonstration `SIN-2026-9002`, rôle après rôle, de la déclaration à l'archive (D19).
- Les trois autres scénarios de démonstration (`SIN-2026-9001`, `9003`, `9004`) sont rejoués de même ; les 104 vérifications du second rejeu de la démo sont reprises comme tests de recette sur le serveur réel.
- Un statut ne peut pas être ajouté ou retiré sans changer le tableau et ses tests ; une modification de table passe la revue du PO.

### 5.14 Délais, échéances, alertes et relances

Les délais de la démo n'avaient ni point de départ ni point d'arrêt écrits (constat de la SPEC). Cette section les écrit. Elle sépare trois natures d'échéance : **réglementaire** (le Code CIMA, non modifiable par la compagnie), **interne** (paramètre de la compagnie), **suivi** (surveillance d'une attente). Une échéance qui n'a pas ses deux bornes n'existe pas dans Prospera.

#### FR-140 : Toute échéance a une nature, un départ, un arrêt, une valeur de paramètre

Chaque échéance affichée sur un dossier porte : son **nom**, sa **nature** (réglementaire, interne, suivi), son **point de départ** (un événement daté du dossier), son **point d'arrêt** (un événement daté), sa **durée**, les **jours restants** (négatifs si dépassés), sa **source** (article du Code, paramètre de la compagnie, procédure) et sa **conséquence** au dépassement. Un dossier est jugé selon le **référentiel en vigueur à sa date de survenance** (décision D7) : un changement de paramètre ou de texte ne modifie pas les échéances d'un dossier déjà ouvert. Les délais du matériel et des autres branches ne sont pas fixés par le Code CIMA : ils sont contractuels ou internes, **paramétrés par produit**. Les échéances réglementaires sont des alertes, jamais modifiables par la compagnie ; une alerte est émise **45 jours** avant l'échéance réglementaire et à **85 %** du délai écoulé pour les échéances internes (valeurs de la démo, paramètres).

**Conséquences (testables) :**
- Une échéance sans point de départ ou sans point d'arrêt est refusée à la création du référentiel (`ECHEANCE_INCOMPLETE`) ; un test parcourt le référentiel et vérifie les deux bornes.
- Un dossier ouvert garde ses échéances quand l'administrateur change un paramètre ; un dossier ouvert après le changement applique la nouvelle valeur ; le paramètre et sa version sont visibles sur l'échéance.
- Une échéance réglementaire ne peut pas être modifiée par l'écran de paramétrage ; la tentative est refusée (`ECHEANCE_REGLEMENTAIRE`).
- Une échéance dépassée affiche son retard en jours et sa conséquence ; une échéance arrêtée affiche la date d'arrêt et reste lisible dans l'historique.
- Le délai en mois se calcule en mois civils à partir de la date de départ ; la règle de comptage (mois commencé ou révolu, jour férié) est un point de revue du juriste `[à vérifier par le juriste]`.
- Les suspensions et prorogations légales sont des événements saisis avec leur article, leur date de début, leur date de fin et le motif ; elles décalent l'échéance concernée sans l'effacer.

#### FR-141 : Les échéances réglementaires du corporel automobile

Le Code CIMA fixe des délais pour **l'indemnisation des victimes d'atteintes à la personne causées par un véhicule terrestre à moteur** ; il n'en fixe pas pour les dommages aux seuls biens (art. 231, dernier alinéa, SÛR). Ces échéances s'appliquent au volet corporel automobile ; leur texte à jour est un point de revue juridique (D21).

| Échéance | Point de départ | Point d'arrêt | Durée | Source | Conséquence |
|---|---|---|---|---|---|
| Offre d'indemnité | date de l'accident | offre envoyée (transition 10) | 12 mois | Code CIMA art. 231 (SÛR) | sanction administrative possible ; pénalité 5 % par mois |
| Offre en cas de décès | date du décès | offre aux ayants droit envoyée | 8 mois | art. 231 et 265-266 (SÛR) | idem |
| Offre provisionnelle | date de l'accident | offre provisionnelle envoyée | si la consolidation n'est pas connue à 6 mois | art. 231 al. 5 (SÛR) | l'offre définitive suit |
| Offre définitive après consolidation | date où l'assureur est informé de la consolidation | offre définitive envoyée | 6 mois | art. 231 al. 5 (SÛR) | idem |
| Réponse à la demande motivée de la victime | réception de la demande | réponse envoyée | 30 jours | art. 231 al. 7 (SÛR) | alerte au responsable |
| Dénonciation de la transaction | conclusion de la transaction | expiration du délai | 15 jours | art. 235 (SÛR) | la victime peut dénoncer ; paiement attendu après |
| Paiement des sommes convenues | fin du délai de dénonciation | dernier règlement `PAYE` | 1 mois | art. 235 (SÛR) | intérêt de 5 % par mois (art. 236, SÛR) |
| Pénalité d'offre tardive | échéance de l'offre dépassée | offre envoyée | 5 % par mois de retard | art. 233 (SÛR) | calcul affiché ; réduction motivée par `RESP` |

À ces échéances s'ajoutent les **suspensions et prorogations** que le dossier doit pouvoir tracer : assureur non avisé de l'accident dans le mois (art. 247) ; décès de la victime plus d'un mois après l'accident (art. 248, délai prorogé du temps écoulé) ; pièces demandées non reçues dans les 6 semaines (art. 249 et 250) ; réponse incomplète, nouvelle demande dans le mois (art. 251) ; refus d'examen médical ou contestation du médecin, expert commun, un mois de plus (art. 252 et 252 bis) ; victime résidant à l'étranger, un mois de plus (art. 253) ; tous SÛR. Quand un **fonds de garantie automobile** est activé pour le pays (FR-111), s'ajoutent : transmission du procès-verbal dans les 60 jours (art. 606), déclaration au fonds dans les 3 mois de la réclamation (art. 608), notification d'une transaction avec un responsable non assuré dans le mois (art. 605), tous SÛR. L'arbitrage entre assureurs (sentence dans le mois de la saisine, art. 276, SÛR) suit les recours (FR-119). La **base de calcul** de la pénalité de 5 % (indemnité totale, solde ou montant offert) est un point de revue du juriste.

**Conséquences (testables) :**
- Un dossier corporel automobile ouvert affiche, dès l'ouverture, la date limite de l'offre : accident plus 12 mois, ou décès plus 8 mois pour un décès.
- Un dossier corporel dont la consolidation n'est pas connue à 6 mois de l'accident reçoit une alerte « offre provisionnelle possible » ; l'information de consolidation enregistrée ouvre l'échéance de l'offre définitive à 6 mois.
- Un dossier dont l'offre légale est dépassée affiche la pénalité cumulée (5 % de l'indemnité par mois de retard) et le motif de réduction éventuel saisi par `RESP`.
- Une suspension saisie avec son article, ses dates et son motif décale l'échéance ; sans article, elle est refusée (`SUSPENSION_NON_MOTIVEE`).
- Les échéances ne s'appliquent pas à un dossier matériel ou de risques divers ; un test vérifie qu'un dossier de dommages aux biens n'affiche aucune échéance de ce tableau.
- Un dossier jugé sous une version antérieure du référentiel garde ses échéances d'origine (sinistre survenu avant la date d'effet de la nouvelle version).

#### FR-142 : Les échéances internes, le matériel et les autres branches

Les échéances **internes** de la compagnie sont des paramètres : leurs valeurs par défaut viennent de la démo et du mémoire d'audit de 2014 (procédure d'une compagnie du groupe au Sénégal, à confirmer pour le Togo). Les délais d'**offre** et de **règlement** par volet de la démo sont conservés comme délais internes ; au corporel automobile, la loi (FR-141) prime.

| Échéance | Point de départ | Point d'arrêt | Défaut | Conséquence |
|---|---|---|---|---|
| Accusé de réception | déclaration enregistrée | dossier ouvert (transition 1 ou 2) | 10 jours | alerte au responsable |
| Numéro de sinistre officiel | déclaration envoyée au logiciel de la compagnie | numéro reçu ou saisi | 1 jour ouvré | alerte au responsable (D3) |
| Offre (interne, par volet) | dossier complet (dernière pièce obligatoire reçue) | offre envoyée (transition 10) | corporel 90 j, matériel 60 j, autres 75 j | alerte jaune à 85 %, rouge au dépassement |
| Offre validée envoyée | dernière signature de la délégation | offre envoyée | 48 heures | alerte au gestionnaire et au responsable |
| Offre sans réponse (relance) | offre envoyée | réponse enregistrée | 15 jours | relance de l'assuré |
| Offre sans réponse (alerte) | offre envoyée | réponse enregistrée | 30 jours | alerte au responsable ; proposition de classement sans suite |
| Paiement (cible) | accord enregistré | dernier règlement `PAYE` | 72 heures | alerte comptabilité et responsable (§5.8, FR-102) |
| Règlement (limite interne) | accord enregistré | dernier règlement `PAYE` | corporel 45 j, matériel 30 j, autres 30 j | alerte rouge |
| Délai de traitement (SLA) par volet | déclaration enregistrée | statut `REGLE`, `REJETE` ou `SANS_SUITE` | corporel 45 j, matériel 21 j, risques divers 30 j, recours 90 j | indicateur et alerte |
| Chèque non retiré | émission du chèque | remise ou annulation | relance 7 j, circulation longue 21 j, exposition 30 j | liste d'appels, alerte, état (§5.8, FR-101) |
| Versement aux archives | clôture | versement | 75 jours | alerte au responsable (§5.9) |
| Relance du recours | envoi de la lettre ou de la dernière relance | réponse du débiteur | 15 jours | liste « à relancer » (§5.10) |
| Prescription du recours | date du sinistre | recours terminé | 730 jours, alerte à 90 j | alerte, terme à vérifier (FR-118) |
| Rapport d'expert | mission acceptée, éléments transmis | rapport reçu | selon le domaine (§5.5) | alerte au gestionnaire |

**Conséquences (testables) :**
- Le délai de traitement du volet recours (90 jours) se compte depuis la déclaration, comme les autres volets [ASSUMPTION: la SPEC ne définit ni départ ni arrêt du délai cible ; départ à la déclaration, arrêt à REGLE, REJETE ou SANS_SUITE].
- Chaque ligne du tableau est un paramètre de la compagnie, versionné et daté ; un test change chaque valeur et vérifie les jours restants d'un dossier ouvert après le changement.
- L'échéance « offre (interne) » s'arrête à l'envoi de l'offre, non à l'évaluation comme dans la démo ; un test le vérifie.
- Une échéance interne dépassée change la couleur du dossier dans les files et alimente l'indicateur « hors délai » du pilotage.
- Au matériel, un dossier ne montre aucune échéance réglementaire ; il montre ses échéances internes et, si le produit le fixe, son délai contractuel (paramétré par produit).
- La cible de 10 jours entre évaluation et paiement de la démo n'est plus reprise : elle est remplacée par la cible de 72 heures après accord.

#### FR-143 : Les relances : 5 jours entre deux, 3 sans effet, puis un arbitrage

Une **relance** est un message à un interlocuteur qui doit agir : l'assuré (pièces, accord), un cabinet d'expertise (rapport), un tiers (recours), la comptabilité (paiement). Elle est enregistrée avec son **canal** (appel, SMS, e-mail, WhatsApp, courrier), son destinataire, sa date, son texte, son résultat. **Cinq jours** séparent deux relances d'un même interlocuteur sur le même sujet ; au bout de **trois relances sans effet** (ni réponse, ni pièce reçue), le serveur ne propose plus une relance de plus : il propose un **arbitrage** au responsable (classement sans suite, appel du responsable, courrier recommandé, désignation d'un autre cabinet, mise en demeure). Le recours suit son propre rythme de 15 jours (FR-110). La rédaction des relances est assistée par l'IA commune (usage n° 4, §5.2) ; l'agent envoie lui-même et trace.

**Conséquences (testables) :**
- Une deuxième relance au même interlocuteur sur le même sujet avant 5 jours est refusée (`RELANCE_TROP_PROCHE`) ; une dérogation motivée de `RESP` est possible.
- Après 3 relances sans effet, le dossier affiche « arbitrage proposé » avec les choix ; il n'offre plus le bouton « relancer ».
- Une relance sans canal, sans destinataire ou sans date est refusée (`RELANCE_INCOMPLETE`).
- Au corporel automobile, la relance de l'assuré porte les mentions de la correspondance exigées par le Code (nom du gestionnaire, rappel des conséquences d'un défaut de réponse, art. 242, SÛR) ; un modèle qui les omet est refusé à sa validation.
- Le compte des relances et leur résultat alimentent la condition `RELANCES_EPUISEES` du classement sans suite (§5.11).
- L'envoi réel de la relance passe par le module `notification` ; une relance « envoyée » sans accusé de transmission du module est marquée « à confirmer ».

#### FR-144 : Les dossiers muets se détectent à 8, 15 et 30 jours

Un dossier non terminal **sans action** depuis 8 jours est « à surveiller », depuis 15 jours « à relancer », depuis 30 jours « muet ». Le point de départ est la dernière **action d'écriture** du dossier (transition, pièce reçue, relance, note, décision) ; une simple **consultation** ne compte pas [ASSUMPTION: la consultation n'interrompt pas le silence, pour qu'elle ne masque pas l'inactivité]. Le point d'arrêt est l'action suivante. Un agent sans trace d'écriture depuis 10 jours est signalé à son responsable et à `AUD`.

**Conséquences (testables) :**
- Un dossier `EN_INSTRUCTION` sans action pendant 8 jours entre dans la liste « à surveiller » du gestionnaire ; à 15 jours, dans la file du responsable ; à 30 jours, il est « muet » et notifié à `RESP`, `DT` et `AUD`.
- Un dossier `CLOTURE`, `REJETE` ou `SANS_SUITE` n'est jamais muet ; un dossier en attente d'un tiers (assuré, cabinet) est compté muet seulement si la relance de 5 jours (FR-143) n'a pas été faite.
- Les seuils 8, 15 et 30 sont des paramètres ; un test les change.
- La liste des dossiers muets s'exporte avec le gestionnaire, le statut, la date de la dernière action et le tiers attendu.
- Un agent dont aucune action d'écriture n'est tracée depuis 10 jours ouvrés apparaît dans la liste de `AUD` avec son nombre de dossiers en charge.

#### FR-145 : Les pièces bloquantes, et les vues des échéances

Une **pièce bloquante** est une pièce obligatoire qui empêche une transition (l'évaluation, l'envoi de l'offre, l'émission du règlement : un relevé d'identité bancaire illisible bloque le virement, le certificat médical final bloque l'offre au corporel, le procès-verbal fonde le montant). Une pièce bloquante en attente depuis plus de **30 jours** est une alerte au gestionnaire et au responsable, avec proposition de classement sans suite après les relances du FR-143. Le gestionnaire dispose de deux vues : **mes délais** (dossiers groupés par ce qu'il reste avant le terme, la cause, le porteur, le geste à faire) et **mes attentes** (dossiers groupés par tiers attendu : assuré, cabinet d'expertise, comptabilité, responsable).

**Conséquences (testables) :**
- Une pièce obligatoire en attente depuis 31 jours, sur un dossier non terminal, figure dans l'alerte « pièces bloquantes » avec le nom de la pièce, la transition qu'elle bloque et le nombre de relances faites.
- La vue « mes délais » classe un dossier selon son échéance la plus proche, réglementaire ou interne, et affiche la cause du retard et la personne qui détient le geste suivant.
- La vue « mes attentes » regroupe par tiers attendu ; un dossier attendu de deux tiers apparaît dans deux groupes.
- Les deux vues sont filtrées par rôle : `GEST` voit ses dossiers, `RESP` ceux de son service, `GREC` ceux de son pôle ; aucune donnée médicale n'y est lisible par `ACC`.
- Une pièce bloquante > 30 jours est comptée dans l'indicateur de pilotage (§6) ; le seuil de 30 jours est un paramètre.

### 5.15 Les notifications et les écrans du circuit

Les notifications sont envoyées par le module partagé `notification` (partie 4) ; les écrans sont ceux de chaque rôle. Les deux obéissent à une règle : **chacun voit ce qu'il doit faire maintenant**, et rien de ce que son rôle n'a pas le droit de lire.

#### FR-146 : Les notifications du circuit

Le circuit émet les notifications suivantes. Le canal par défaut est indiqué ; il se règle par événement dans le module `notification`. Les canaux sont : **cloche** (dans l'application), **e-mail**, **SMS**, **WhatsApp**, **courrier** (papier, avec preuve). Le canal choisi par l'assuré à la déclaration est le canal de ses notifications ; à défaut, le SMS [ASSUMPTION: canal par défaut de l'assuré = SMS].

| Événement | Destinataire | Canal |
|---|---|---|
| Déclaration enregistrée (référence `DEC-`) | assuré ; courtier | SMS, e-mail ou WhatsApp |
| Numéro de sinistre officiel reçu | gestionnaire ; assuré (information) | cloche ; SMS |
| Dossier sans numéro officiel depuis plus de 1 jour ouvré | `RESP` | cloche, e-mail |
| Pièces attendues (relance) | assuré | SMS, e-mail, WhatsApp, courrier |
| Dossier ouvert (accusé de réception) | assuré ; courtier ; coassureurs | e-mail, courrier |
| Dossier attribué à un gestionnaire | gestionnaire | cloche |
| Mission d'expertise désignée | cabinet d'expertise (portail) ou expert interne | portail, e-mail |
| Rapport d'expertise reçu ou complément demandé | gestionnaire | cloche |
| Dossier envoyé en validation | signataires de la délégation | cloche, file de validation |
| Validation complète, offre à envoyer sous 48 h | gestionnaire ; `RESP` en alerte à 24 h [ASSUMPTION: alerte à mi-délai des 48 h] | cloche |
| Offre envoyée | assuré | courrier, e-mail |
| Offre sans réponse à 15 jours | assuré | SMS, e-mail, WhatsApp |
| Offre sans réponse à 30 jours | `RESP` | cloche, e-mail |
| Accord enregistré, ordre de règlement émis | `CPT` ; gestionnaire | cloche, file de la comptabilité |
| Ordre rejeté par la comptabilité | gestionnaire ; `RESP` | cloche, e-mail |
| Chèque prêt à remettre | assuré ; `ACC` (liste d'appels) | SMS, WhatsApp |
| Quittance à signer (virement, Mobile Money) | assuré | SMS, e-mail, WhatsApp |
| Paiement confirmé | assuré ; gestionnaire | SMS ; cloche |
| Paiement en échec | `CPT` ; gestionnaire | cloche, e-mail |
| Chèque non retiré à 7, 21, 30 jours | `ACC` ; `CPT` ; `RESP` et `AUD` à 30 jours | cloche |
| Dossier clos | assuré ; courtier ; `ARCH` (dossier à verser) | e-mail, courrier ; cloche |
| Refus de prise en charge | assuré ; gestionnaire | courrier signé |
| Classement sans suite | assuré (dernier courrier) ; gestionnaire | courrier |
| Litige constaté | `RESP` ; `DG` ; `DT` ; assuré (accusé) | cloche ; courrier |
| Suspicion de fraude signalée, revue ouverte, dossier bloqué | `AUD` ; `RESP` ; `DG` ; `DT` (jamais l'assuré ni le courtier) | cloche |
| Recours créé, relance due, prescription à 90 jours | `GREC` ; `RESP` | cloche |
| Mise en demeure sans réponse, encaissement à rapprocher | `RESP` ; `CPT` | cloche |
| Échéance réglementaire à 45 jours, ou dépassée | gestionnaire ; `RESP` ; `DT` | cloche, e-mail |
| Dossier à surveiller (8 jours), à relancer (15 jours), muet (30 jours) | gestionnaire ; `RESP` ; `RESP`, `DT` et `AUD` | cloche |
| Dossier rouvert | gestionnaire ; `ARCH` (sortie de chemise) | cloche |

**Conséquences (testables) :**
- Chaque ligne du tableau est jouée en recette sur un dossier de démonstration : l'événement se produit, la notification part, au bon destinataire, par le bon canal.
- Aucune notification à l'assuré ou au courtier ne contient le mot « fraude », une donnée médicale ni un montant d'indemnité ; un test lit tous les modèles sortants. Un message d'offre dit qu'un courrier est disponible.
- Une notification externe n'est jamais envoyée sans le canal et le numéro enregistrés pour l'assuré ; sinon elle est refusée (`CANAL_ABSENT`) et le dossier entre dans la liste « à contacter autrement ».
- Une notification de relance suit l'intervalle de 5 jours (FR-143) ; une notification de courrier garde sa preuve d'envoi.
- Le module `notification` renvoie l'accusé de transmission ; Prospera l'inscrit au journal du dossier.
- Un destinataire désactivé (rôle retiré) ne reçoit plus la notification ; elle bascule vers `RESP`.

#### FR-147 : La corbeille du gestionnaire et la file du responsable

**Corbeille du gestionnaire (`GEST`).** Le gestionnaire, rattaché à un volet (corporel, matériel, risques divers), voit : **mes dossiers en charge** (corbeille personnelle) ; la **corbeille de service** de son volet (tous les dossiers actifs, sans distinction d'agent : absence, reprise) ; **mes délais** et **mes attentes** (FR-145) ; les dossiers à instruire, les pièces à réclamer, les expertises à suivre, les devis à contrôler, les évaluations à arrêter, les offres sans réponse, les règlements en échec. Chaque ligne montre : numéro de sinistre officiel (ou référence de déclaration), assuré, statut, échéance la plus proche, dernière action. Sur chaque dossier, les gestes **ouverts** s'affichent, et les gestes **fermés** s'affichent aussi avec leur motif de blocage (FR-136).

**File du responsable (`RESP`).** Le responsable voit : les dossiers **à attribuer** (statut `OUVERT` sans gestionnaire) et la charge de chaque gestionnaire ; les dossiers **à valider** à son niveau de délégation ; les **blocages** et les **litiges** ; les dossiers **hors délai** ; les dossiers **muets** ; les **offres sans réponse** à 30 jours ; les **honoraires à viser** ; les **provisions** à revoir ; les **recours** à arbitrer ; les **règlements** qui dépassent leur échéance ; les dossiers sans numéro officiel. Il réattribue un dossier avec motif.

**Conséquences (testables) :**
- Un gestionnaire ne voit dans sa corbeille personnelle que ses dossiers ; dans la corbeille de service, que les dossiers actifs de son volet ; il n'ouvre pas un dossier d'un autre volet (`DROIT_INSUFFISANT`).
- Un gestionnaire corporel est le seul, avec `MED`, `RESP`, `DG` et `DT` pour une décision, à lire les pièces de santé ; chaque lecture est journalisée.
- Une action fermée s'affiche avec son motif en clair, « réservée à : responsable, direction » ou « le dossier doit avoir été attribué à un gestionnaire » ; elle n'est pas masquée.
- Le responsable attribue un dossier `OUVERT` à un gestionnaire avec un motif obligatoire ; une réattribution sans motif est refusée (`MOTIF_ECRIT`) ; un responsable ne s'attribue pas un dossier qu'il doit valider seul.
- La file du responsable trie par échéance la plus proche, puis par ancienneté ; un test vérifie l'ordre sur le jeu de démonstration.
- La recherche d'un dossier depuis ces files donne un résultat en moins de 5 secondes au 95e centile (§8, décision D20) [ASSUMPTION: volume de dimensionnement de D20].

#### FR-148 : La file de validation, la file de la comptabilité, le guichet de remise

**File de validation (`RESP`, comité, `DT`, `DG`).** Elle liste les dossiers `EN_VALIDATION` selon la délégation du signataire : à son niveau (≤ 1 000 000 FCFA pour `RESP`, comité pour les montants supérieurs, visa de `DT`, règlements à titre commercial pour `DG`, §5.7). Pour chaque dossier, une **fiche de décision** préparée résume : pièces, expertises, décompte, comparables, délai, déclaration tardive, franchise, signaux de fraude, part du tiers et recours à engager ; le motif de la décision est obligatoire. Le cumul des montants validés du dossier est visible (anti-fractionnement).

**File de la comptabilité (`CPT`).** Elle liste : les **ordres à traiter** (`A_PAYER`), les **chèques à remettre** et leur ancienneté, les **règlements en échec**, les **rapprochements** à faire (chèques, virements, Mobile Money, encaissements de recours), les **honoraires à payer**, les écarts de rapprochement de plus de 60 jours, les alertes de contrôle LBC/FT (FR-100) et l'**état et l'export** du FR-103. Chaque ligne montre le bénéficiaire, le montant, le moyen, l'échéance (FR-102).

**Guichet de remise (`ACC`, `CPT`).** Le guichet offre une **recherche permanente** (nom, téléphone, numéro de sinistre, numéro de police, immatriculation, numéro d'archivage) et quatre files : **à traiter**, **pièces à réclamer**, **chèques à retirer**, **mes déclarations**. Les gestes sur la ligne : recevoir une pièce, tracer un appel (canal et commentaire), remettre le chèque (identité du retirant, numéro de pièce, quittance signée), faire signer une quittance. Un compte de la journée résume : déclarations, pièces prises, appels tracés, chèques remis. L'accueil voit qu'une pièce médicale est reçue, jamais son contenu (D14).

**Conséquences (testables) :**
- Un signataire ne voit dans sa file de validation que les dossiers de son niveau de délégation ; il ne signe pas au-delà (`VALIDATION_ACQUISE`).
- La fiche de décision affiche un point de vigilance pour chacune des règles suivantes quand elle s'applique : hors délai, déclaration tardive, franchise, plafond, exclusions à écarter, complément d'expert non revenu.
- Une validation sans motif est refusée (`MOTIF_ECRIT`) ; le bouton de confirmation est inactif tant que le motif est vide.
- La file de la comptabilité n'affiche aucune donnée de santé ; le bénéficiaire, le montant et le moyen suffisent.
- Le guichet ne propose le geste « remettre le chèque » que pour un chèque `CHEQUE_A_REMETTRE` ; il l'indique fermé, avec le motif, pour un virement ou un paiement mobile.
- Le champ « retiré par » du guichet est vide à l'ouverture du geste (FR-97) ; un test le vérifie.
- Le compte de la journée se calcule depuis le journal, sans ressaisie.

#### FR-149 : Les files du pôle recours et du contrôle interne

**Pôle recours (`GREC`).** Le gestionnaire recours voit : **mes recours** ; les **nouveaux recours** (`A_QUALIFIER`) ; les recours **à relancer** (15 jours) ; les **mises en demeure** à préparer, à envoyer, sans réponse ; les **créances** (anciennes, contestées) ; les **négociations** (offres et contre-offres) ; les **contentieux** ; les **encaissements** à rapprocher ; les recours dont la **prescription** approche ; les recours à ouvrir (avec export de la sélection). Il lit les dossiers sinistres liés à ses recours, même clos.

**Contrôle interne (`AUD`).** Le contrôle interne voit : la **file de revue de fraude** (FR-129, FR-131) ; le **graphe des liens** (FR-132) ; le **plan de contrôle** : séparation des fonctions (SEP-01, SEP-02, SEP-03), décaissements, traçabilité, dossier ; la **piste d'audit** (FR-138) ; les **modifications sensibles** ; les paiements sur dossier `SUSPECT` ou `BLOQUE` non revu ; les concentrations d'émission (FR-100). Il lit presque tout, n'écrit que ses conclusions de revue et ses constats.

**Conséquences (testables) :**
- Un `GREC` ne voit pas les pièces de santé ; il voit la créance, les pièces probantes (procès-verbal, constat, rapport de police) et les règlements.
- `AUD` ne peut déclencher aucune transition du circuit autre que le signalement, l'écartement ou la confirmation de fraude ; toute autre tentative est refusée (`DROIT_INSUFFISANT`).
- La file de revue de fraude est ordonnée comme au FR-131 ; un test le vérifie.
- Le plan de contrôle affiche, pour chaque séparation de fonctions, la population testée, les écarts constatés et leur gravité (critique, majeure) ; un écart peut être justifié ou corrigé avec un texte, jamais supprimé.
- Un export de la piste d'audit est produit (périmètre, période, utilisateur) ; le bouton « export » de la démo, sans effet, est remplacé par un traitement réel.
- Les files du pôle recours se vident à mesure que les recours se terminent ; un recours `RECUPERE` ou `ABANDONNE` quitte les files actives et reste consultable.

### Écarts avec la démo relevés

Cette liste réunit les écarts entre le code de la démo et le PRD, pour les sections 5.8 à 5.15. Elle sert de liste de reprise pour l'équipe de réalisation.

1. **L'offre et l'accord deviennent une étape** (D6) : la démo passait de la validation à l'ordre de règlement ; le PRD ajoute `OFFRE_ENVOYEE` et exige l'accord enregistré avant tout ordre (FR-90, transitions 10 et 14).
2. **Le recours devient un suivi parallèle** (D10) : trois transitions de la démo (vers `RECOURS`, et la clôture du recours par le dossier) disparaissent ; le recours naît à l'ouverture et a sa machine (FR-108, FR-112).
3. **La validation a plusieurs niveaux** (D8) : le seuil unique de 2 000 000 FCFA de la démo est remplacé par une matrice de délégation (§5.7) ; l'ordre de règlement n'est plus une chaîne INSTRUCTION, RESPONSABLE, COMPTABILITE, DIRECTION générée : il naît de l'accord.
4. **Un dossier a plusieurs règlements** (D11) : la démo n'avait qu'une quittance par ordre et un statut lié au chèque (`CHEQUE_A_REMETTRE`) ; le PRD donne un état au règlement, un état à la quittance, et le dossier devient `REGLE` à reste à payer zéro (FR-91, FR-92).
5. **Le paiement électronique est réel et passe par `paiement`** : la démo ne faisait aucun paiement (virement, T-Money, Flooz n'étaient que des valeurs) ; la quittance est signée avant le paiement électronique (FR-95, FR-96).
6. **Les gabarits manquent dans la démo** : ni gabarit de chèque ni de quittance ; la banque était pré-remplie et le comptable ne saisissait rien. Le PRD fait saisir banque, numéro et montant (FR-94).
7. **Contrôles de paiement** : repris de la démo (5 jours, 30 jours, 60 %, plafond d'espèces) et complétés du libellé au nom de la victime au corporel (art. 232), de l'avis de tutelle pour les mineurs (art. 234) et du blocage du bénéficiaire non conforme (FR-100).
8. **La fraude étend son blocage** : la démo bloquait la validation et l'émission ; le PRD bloque aussi l'envoi de l'offre, l'accord, la remise et le paiement, et étend le signalement aux états de paiement (FR-125, FR-130, transitions 33 à 36).
9. **La revue de fraude et l'empreinte de photo étaient simulées** : le PRD les rend réelles ; sans modèle de vision, la comparaison de photos est « indisponible » (FR-132).
10. **`SANS_SUITE` se rouvre** : la démo le tenait pour terminal sans issue ; le PRD ajoute la réouverture (transition 41) et exige la décision de la direction au corporel automobile (FR-123).
11. **La clôture exige la qualification du recours et une provision à zéro** : nouveauté (FR-104, FR-105) ; le dossier clos peut avoir un recours actif (FR-106).
12. **Les délais sont séparés** (D7) : la démo mélangeait un délai d'offre corporelle de 90 jours depuis le dossier complet et « 365 jours depuis la survenance » ; le PRD sépare la loi (12 mois, 8 mois, 6 mois, 30 jours, 15 jours, 5 % par mois) et le délai interne, et note que l'offre s'arrête à son envoi (non à l'évaluation) et que le règlement se compte depuis l'accord.
13. **La source des délais de la démo** (un règlement daté de 2026, versionné « 2026.2 ») n'est pas vérifiée : elle n'est pas citée ; le PRD cite le Code CIMA aux seuls articles lus.
14. **La prescription du recours est un terme à vérifier** : la démo affichait 730 jours (« art. 28 ») ; le PRD garde ce terme comme valeur prudente et signale que l'action de l'assureur subrogé peut relever d'un délai de 5 ans (art. 256) selon son fondement (FR-118).
15. **Le recours gagne un arbitrage et plusieurs débiteurs** : `EN_ARBITRAGE` est ajouté (art. 276), un dossier peut avoir plusieurs recours, l'abandon est possible depuis les premiers états (FR-108, FR-112, FR-119).
16. **La contre-proposition de recours par règles** garde la formule de la démo mais n'est jamais chiffrée sur un dossier corporel (FR-120).
17. **Les courriers** : la démo les générait sans en créer ; le PRD crée un courrier avec statut, preuve, signature, version du brouillon (FR-122).
18. **L'export d'audit** : le bouton « Export piste d'audit » de la démo n'avait pas de traitement ; le PRD exige un export réel (FR-138, FR-149).
19. **Des transitions ajoutées pour fermer les culs-de-sac** : 9, 21, 23, 27, 33 à 36 et 41 (FR-135).
20. **Les chiffres non repris** : la cible de 10 jours entre évaluation et paiement, remplacée par 72 heures après l'accord ; le forfait de convention de 350 000 FCFA, désormais inactif par défaut ; le tableau de pilotage de direction (§6.7).

---

## 6. Partie 3 — Les autres modules propres à l'assurance

Le circuit sinistre est décrit en partie 2 (§5, module `sinistres`). Cette partie décrit **les autres modules propres à l'assurance** : la recherche et la fiche du dossier, les pièces et les archives, les experts, les contrats et les provisions, l'échange avec le logiciel de la compagnie, son double fictif, le pilotage et le contrôle interne, et la reprise des archives. Ils fonctionnent tous au premier jour (février 2027), **avec l'IA, sauf la voix** (D13).

Quatre règles valent pour toute cette partie.
- **Le logiciel de la compagnie (LC) fait foi pour les contrats et pour le numéro de sinistre officiel.** Prospera tient le dossier sinistre. Il lit les contrats, il ne les modifie jamais (§6.4, §6.5).
- **Tout seuil, délai, montant, taux ou liste métier est un paramètre de la compagnie**, avec une valeur par défaut. Les défauts de la démo servent de point de départ ; ils sont à confirmer à la séance d'immersion. Ils sont indexés dans l'annexe D.
- **Une capacité d'IA dit toujours** son entrée, sa sortie, son destinataire, son garde-fou et qu'elle est **servie par l'IA commune**, en instance locale chez la compagnie. Elle propose ; un humain décide. Elle n'est jamais bloquante : si l'IA est coupée, tout le circuit passe. Tant qu'aucun modèle n'est installé, la capacité est servie par des **règles explicables** et l'écran le dit (il n'écrit pas « IA »). Aucune dictée ni transcription d'appel n'existe (D13).
- **Les textes réglementaires cités sont ceux que la recherche du 2026-11-13 a lus** (Code CIMA, édition 2019 ; loi togolaise 2019-014). Tout ce qui est incertain est renvoyé à la revue du juriste (D21).

---

### 6.1 Accueil, recherche et fiche du dossier (`sinistres`)

**Ce que ça veut dire.** C'est la scène que le PRD veut faire disparaître : un assuré appelle (« Où en est mon dossier ? »), l'agent cherche dans plusieurs dossiers et applications, puis dit « Je vais vérifier et je vous rappelle ». Ici, une seule recherche retrouve le dossier en moins de 5 secondes, et une seule fiche permet de répondre pendant l'appel. Ce que la fiche affiche vient des données du dossier et du LC, jamais d'une constante. Chaque consultation est tracée, au nom de l'agent.

#### FR-150 : Une seule recherche pour tout retrouver

Un champ de recherche unique, présent sur tous les écrans de travail, retrouve un dossier par : le **nom** (assuré, souscripteur, victime), le **numéro de police**, le **téléphone**, l'**immatriculation**, le **numéro de sinistre** officiel, la **référence de déclaration** (`DEC-AAAA-NNNNN`) et le **numéro d'archivage** (`ARC-AAAA-CCCC-NNNNN`). Il cherche dans les dossiers de Prospera, dans les dossiers et archives repris (§6.8) et dans la projection des polices lue du LC (§6.4). Le résultat arrive **en moins de 5 secondes** au 95e centile (D20), sur le volume repris.

**Conséquences (testables) :**
- Pour chacun des 7 critères, la saisie d'une valeur exacte d'un dossier de test le renvoie en tête de liste.
- Sur le jeu de démonstration (environ 3 500 dossiers) et sur le volume de dimensionnement (50 000 dossiers archivés, `[ASSUMPTION: volumes de D20, à remplacer par les vrais volumes]`), 95 % des recherches rendent leur résultat en moins de 5 secondes ; la mesure est faite à la recette sur un poste d'accueil. Une cible de moins de 1 seconde est visée `[ASSUMPTION: cible du deck, non contractuelle]`.
- Chaque ligne de résultat dit d'où elle vient : « dossier Prospera », « dossier repris », « police du LC seulement » (aucun sinistre encore).
- Une valeur qui correspond à plusieurs objets (une police avec trois sinistres) renvoie les trois, groupés sous la police.
- La **cote physique** s'affiche sur le résultat mais n'est pas un critère de recherche : on retrouve le dossier, puis on lit sa cote.
- Une recherche sans résultat affiche « aucun résultat pour [critère saisi] » et ne propose jamais un dossier au hasard.

#### FR-151 : La recherche tolère les fautes et respecte les droits

La recherche ignore les accents, les majuscules et la ponctuation, et tolère une faute en fin de mot. Elle se restreint par des filtres cumulables. Elle ne montre jamais un dossier que le rôle de l'agent n'a pas le droit de voir.

**Conséquences (testables) :**
- « agbeko », « AGBÉKO » et « Agbéko » renvoient le même dossier ; « agbek » le renvoie aussi (repli par préfixe sur un mot de plus de 3 lettres).
- Chaque mot saisi doit figurer dans le dossier (les mots se cumulent) : « agbéko lomé » ne renvoie que les dossiers qui portent les deux.
- Les filtres sont : volet, étape (11 statuts), gestionnaire, pièces manquantes, hors délai, chèque à remettre, sans gestionnaire.
- Un `GEST` rattaché au volet matériel ne voit pas dans les résultats un dossier du volet corporel, sauf droit de lecture de volet accordé par le `RESP` ; `ACC`, `RESP`, `DG`, `DT`, `AUD` voient tous les volets ; `EXPE` n'a pas la recherche générale : il ne voit que ses missions (§6.3) ; `ADMIN` ne lit aucune donnée métier (D14).
- Une ligne de résultat montre l'étape et la dernière action **sans ouvrir** le dossier.
- Un terme de moins de 3 caractères n'est pas cherché `[ASSUMPTION: longueur minimale de saisie = 3, paramètre]`.

#### FR-152 : La fiche « répondre pendant l'appel »

Le dossier a une fiche qui répond, en un écran, aux quatre questions de l'assuré : « Où en est mon dossier ? », « Avez-vous reçu mon document ? », « Quel est le montant prévu ? », « Pourquoi n'est-il pas réglé ? ». La fiche affiche : l'identité (assuré, police, numéro de sinistre officiel, référence de déclaration, numéro d'archivage), **l'étape** (statut et phase), les **pièces reçues et manquantes** (x sur y, avec la liste), les montants **évalué, proposé, validé, payé et reste à payer**, la **dernière action** et la **prochaine** (qui, quoi, pour quand), le gestionnaire et son contact, la **date de dernière lecture du LC**, le téléphone masqué. La **provision** n'y figure que pour les rôles autorisés (`GEST`, `RESP`, `DG`, `DT`, `CPT`, `AUD`).

**Conséquences (testables) :**
- Les cinq montants sont des champs distincts, jamais additionnés ni confondus ; un montant non encore connu affiche « non encore évalué », jamais zéro.
- Un règlement non émis affiche la raison (« en attente de validation par [niveau] »), lue de l'état du dossier.
- La prochaine action nomme un rôle et une échéance ; un dossier sans prochaine action est signalé en rouge sur la fiche.
- La date de dernière lecture du LC s'affiche sur la fiche ; plus vieille que le double de la fraîcheur par défaut (§6.5), elle est marquée « périmée ».
- `ACC` voit une fiche à lecture limitée (sans provision, sans instruction, sans contenu de pièce médicale) ; la fiche se lit sans changer de page.
- Les valeurs de la fiche sont recalculées à chaque ouverture depuis les données : modifier un montant dans le dossier change la fiche sans autre geste.
- La fiche s'imprime (« Imprimer la fiche »), avec la mention de l'heure d'impression et de l'auteur.

#### FR-153 : Téléphone masqué et données de santé protégées

Le téléphone et la pièce d'identité s'affichent masqués. Les données de santé d'une victime (certificat, taux d'incapacité, rapport médical) ne sont lisibles que par les rôles de D14 : `MED`, le `GEST` corporel affecté, `RESP`, et `DG` ou `DT` pour une décision. Ces données sont sensibles : la loi togolaise n° 2019-014 les met dans une catégorie à protection renforcée (art. 21 et 22, texte lu).

**Conséquences (testables) :**
- Le téléphone s'affiche avec ses deux derniers chiffres seulement `[ASSUMPTION: 2 chiffres visibles, paramètre]` ; le révéler est un geste explicite, qui écrit une ligne au journal (FR-158) ; `ACC` peut le révéler pour rappeler l'assuré.
- `ACC` voit « une pièce médicale est reçue », jamais son contenu ni son nom de fichier.
- Un `GEST` du volet matériel qui ouvre un dossier corporel voit la fiche sans le contenu médical.
- Chaque lecture d'une pièce ou d'un champ de santé écrit une ligne distincte au journal, avec son auteur (art. 52 de la loi 2019-014 : traçabilité de l'identité des accédants et des données lues).
- Le consentement écrit à l'examen médical et à la communication du rapport est une pièce du dossier (type dédié) ; sa base légale exacte est renvoyée au juriste (D21).

#### FR-154 : Le résumé sourcé du dossier (IA, usage n° 5)

À la demande, l'IA commune résume un dossier en 5 à 6 lignes : survenance, lieu, canal, victime ; étape et ancienneté contre le délai cible ; pièces reçues et manquantes ; montants ; dates limites ; prochaine action. **Chaque phrase renvoie à sa source** : la pièce, la ligne du journal, la règle ou le calcul d'où elle vient. **Entrée** : le dossier et ses pièces lues (§6.2). **Sortie** : le résumé et ses renvois. **Destinataire** : `GEST`, `RESP`, `DG`, `DT` ; une version sans donnée de santé pour `ACC`. **Garde-fou** : lecture seule ; aucun montant n'est proposé sur un préjudice corporel (D13) ; aucune information sans source ; le résumé est journalisé au registre de l'IA.

**Conséquences (testables) :**
- Un clic sur une phrase du résumé ouvre la pièce, la ligne du journal ou la règle citée ; une phrase sans source n'est pas affichée.
- Le résumé d'un dossier de 40 pages est rendu en moins de 5 minutes `[ASSUMPTION: « quelques minutes » de la proposition v2 chiffré à 5 minutes, paramètre]`.
- Le résumé d'un dossier corporel ne contient aucun montant d'indemnité proposé ; les montants qu'il cite sont ceux que le gestionnaire ou le médecin-conseil ont déjà enregistrés, avec leur auteur.
- Le registre de l'IA reçoit une ligne (entrée, sortie, confiance, sources, niveau `ANALYSE`, statut, auteur de la décision) ; l'agent peut marquer le résumé « rejeté » avec un motif.
- IA commune coupée : la fiche (FR-152) reste complète ; le résumé affiche « non installé » ou est remplacé par un résumé par règles, qui le dit.

#### FR-155 : La recherche en langage naturel (IA, usage n° 6)

Un agent peut poser sa question en français, **par écrit** : « Où en est le dossier de M. Agbéko ? », « Quels dossiers auto sont bloqués ? », « Les règlements de plus de 10 millions en attente ». L'IA commune traduit la question en critères visibles (montant, période, ancienneté, volet, branche, étape, gravité, moyen de paiement, indicateur de retard ou de fraude, référence), les affiche pour correction, puis répond par une synthèse chiffrée et des groupes de résultats. **Entrée** : le texte de la question. **Sortie** : critères, synthèse, listes avec renvoi à l'écran qui fait foi. **Destinataire** : tout agent, dans son périmètre. **Garde-fou** : lecture seule ; périmètre du rôle ; si la question n'est pas comprise, la réponse est « je n'ai pas encore de réponse fiable ».

**Conséquences (testables) :**
- Les critères compris s'affichent avant les résultats et se corrigent à la main ; aucun résultat ne dépend d'un critère caché.
- La réponse chiffre ce qu'elle liste : « 23 dossiers, 41 200 000 FCFA » ; le chiffre est identique à celui de l'écran du dossier (une seule source).
- Les catégories cherchées sont : dossiers, assurés, contrats, règlements, recours, pièces, agents, journal ; « agents » et « journal » sont réservés à `RESP`, `DG`, `DT`, `AUD`.
- Chaque groupe de résultats s'exporte en tableur.
- Une question qui dépasse le périmètre du rôle (un `GEST` qui demande les dossiers d'un autre volet) ne renvoie que les dossiers qu'il a le droit de voir, et le dit.
- La saisie vocale n'existe pas ; aucune question n'est transcrite d'un appel (D13).
- Seize questions types de comité de direction, en quatre familles (argent, risque, délais, exploitation), sont proposées comme suggestions `[ASSUMPTION: liste de la démo, modifiable]`.

#### FR-156 : Les réclamations des assurés

Une réclamation d'un assuré (ou d'une victime) est une demande enregistrée, rattachée à son dossier. Elle a un accusé de réception, une réponse et une escalade, chacun avec son délai. Une réclamation est **fondée** quand le fait invoqué se vérifie dans le dossier. Les réclamations récurrentes alimentent un plan d'action de la qualité.

**Conséquences (testables) :**
- L'accusé part sous **5 jours**, la réponse sous **30 jours**, l'escalade au-delà de **60 jours** (paramètres, valeurs de la démo, annexe D).
- Une réclamation sans accusé à J+5, sans réponse à J+30, ou encore ouverte à J+60, lève une alerte au `RESP` ; à J+60, l'alerte monte au `DG` `[ASSUMPTION: l'escalade monte au DG, à confirmer]`.
- Chaque réclamation porte : canal d'arrivée, date de réception, motif, dossier concerné, agent traitant, verdict « fondée / non fondée » avec la preuve citée du dossier.
- Au moins 3 réclamations sur un même motif, dans la fenêtre d'analyse de 365 jours (paramètres), créent une ligne au plan d'action de la qualité, lisible par `RESP`, `DG`, `AUD`.
- La date de réception est celle de l'arrivée du courrier ou du message, pas celle de sa saisie ; un écart entre les deux exige un motif.
- Répondre à une réclamation ne modifie jamais le dossier : une décision contestée repasse par le circuit (§5.7, §5.13).

#### FR-157 : La réponse à une réclamation, rédigée par l'IA (usage n° 11)

L'IA commune rédige le **projet de réponse** à une réclamation. **Entrée** : la réclamation et le dossier. **Sortie** : un courrier brouillon qui cite les faits du dossier, avec leurs sources. **Destinataire** : l'agent traitant, qui relit, corrige et signe. **Garde-fou** : le courrier ne part jamais seul ; il ne promet aucun montant ; il ne contient aucun montant sur un préjudice corporel ; il ne contient aucune donnée de santé que le destinataire ne connaisse déjà.

**Conséquences (testables) :**
- Aucun envoi n'est possible sans l'action « signer et envoyer » d'un agent nommé ; l'envoi est journalisé.
- Chaque fait du brouillon (date, montant, pièce) renvoie à sa source au clic.
- Le brouillon est enregistré au registre de l'IA, avec le statut `ACCEPTEE`, `MODIFIEE` ou `REJETEE` selon ce que l'agent en fait.
- Sans IA, le modèle de courrier de réclamation de la compagnie (modèle paramétré) se remplit par règles ; l'écran le dit.
- Le courrier archivé est la version signée, liée à la réclamation.

#### FR-158 : Chaque consultation est tracée

Chaque ouverture d'un dossier, d'une fiche ou d'une pièce, et chaque résultat de recherche ouvert, écrit une ligne au journal : qui, quand, quel dossier, quel écran, quelle donnée sensible lue. La trace ne se modifie ni ne se supprime.

**Conséquences (testables) :**
- Dix dossiers ouverts par un agent donnent dix lignes à son nom, dans l'ordre, avec l'heure du serveur.
- Une lecture de pièce de santé donne une ligne distincte, marquée « donnée de santé ».
- Un `AUD` lit le journal des consultations d'un dossier ou d'un agent ; un agent lit « mon historique » ; personne ne peut supprimer ou modifier une ligne, y compris `ADMIN`.
- Une tentative d'accès refusée (droit manquant) écrit aussi une ligne.
- Le journal est exportable pour le contrôle interne (§6.7) et pour un contrôle de la CRCA (FR-211).
- Le journal des consultations est conservé 10 ans `[ASSUMPTION: aligné sur le plancher de l'art. 404, à confirmer par le juriste]`.

---

### 6.2 Pièces, numérisation et archives (`ged`, M07)

**Ce que ça veut dire.** Le module `ged` reçoit, lit, classe, conserve et retrouve les pièces. Il est l'unique magasin des pièces du dossier : le circuit (§5) y lit ses pièces, il n'en tient aucune copie. Il tient **deux supports ensemble** : le dossier numérique et le dossier papier, qui reste obligatoire (D17). Il lit **vraiment** les pièces scannées : l'OCR est réel au premier jour, alors que la démo ne lit que la couche texte des PDF. Il tourne sur le serveur et le NAS de la compagnie.

Les pièces **obligatoires** de chaque type de sinistre, leur relance et leur contrôle de cohérence sont au §5.2 et §5.4. Les pièces historiques entrent par la reprise (§6.8).

#### FR-159 : Une pièce se reçoit au guichet, par téléversement ou par l'opérateur de numérisation

Une pièce entre dans un dossier par six sources : scanner de guichet, téléversement depuis un poste, photo depuis un téléphone, lot de numérisation (`NUM`), courrier numérisé, message reçu (WhatsApp, e-mail, selon §5.1). L'agent la rattache au bon dossier, choisit son type (ou accepte celui qu'on lui propose, FR-164), et l'enregistre. Elle porte sa **source**, sa **date de réception** réelle, son **auteur**, son nombre de pages, son **responsable de fourniture** (assuré, expert, administration, tiers).

**Conséquences (testables) :**
- Une pièce enregistrée sans dossier est refusée ; elle ne peut être déposée que dans la file « à rattacher » (FR-166).
- La date de réception est celle de l'arrivée au guichet ou du message, pas celle de la saisie ; un écart exige un motif.
- Chaque pièce reçue écrit une ligne au journal (qui, quand, quelle pièce, quel dossier) ; la pièce passe à l'état « reçue » dans la liste des pièces attendues (§5.2).
- Un agent `ACC` peut recevoir une pièce ; il ne la voit pas après coup si elle est médicale (FR-153).
- La pièce reçue est lisible sur l'écran du dossier dès son enregistrement, sans autre action.
- Deux pièces de même empreinte déposées dans un même dossier sont signalées comme doublon ; l'agent choisit de garder les deux ou une seule, avec un motif.

#### FR-160 : Les types et la taille des fichiers sont des paramètres

La compagnie fixe les formats acceptés et la taille maximale d'un fichier. Un fichier qui ne les respecte pas est refusé **avec le motif en clair**, avant tout enregistrement.

**Conséquences (testables) :**
- Défauts de la démo : `image/jpeg`, `image/png`, `image/webp`, `application/pdf` ; taille maximale 8 Mo par fichier ; ils sont modifiables par `ADMIN` (annexe D).
- Un fichier d'un autre type, ou trop lourd, est refusé avec « format non accepté » ou « fichier trop lourd (limite : X Mo) » ; rien n'est enregistré.
- Un fichier dont l'extension ne correspond pas à son contenu est refusé.
- Un fichier est analysé par un antivirus de la compagnie avant enregistrement `[ASSUMPTION: antivirus fourni par la compagnie, à confirmer en séance d'immersion]` ; un fichier détecté est mis en quarantaine, jamais ouvert.
- La liste des types de pièces (constat amiable, déclaration signée, certificat médical initial et final, rapport de police, carte grise, permis, devis, facture, RIB, certificat de décès, photos…) est un paramètre ; ajouter un type n'exige aucune livraison.

#### FR-161 : Une pièce a des versions, jamais écrasées

Une pièce remplacée (meilleur scan, document corrigé, rapport complémentaire) devient une **nouvelle version**. L'ancienne reste conservée et lisible. La version courante est signalée.

**Conséquences (testables) :**
- Déposer un second scan d'une pièce crée la version 2 ; la version 1 reste ouverte par le lien « historique des versions ».
- Chaque version porte son auteur, sa date et le motif du remplacement (obligatoire).
- Une pièce déjà citée par une décision (évaluation, offre, règlement) ne peut pas être supprimée : seule une nouvelle version peut la remplacer.
- Un document officiel complémentaire (procès-verbal, rapport d'autorité) remplace le précédent comme « version actuelle » et conserve la chaîne `document précédent`.

#### FR-162 : Les lots de numérisation

L'opérateur de numérisation (`NUM`) numérise par lots : arrivée du lot, numérisation, indexation, contrôle de qualité, archivage. Chaque lot a une référence, une origine, un nombre de documents et de pages, un opérateur et une date. Un lot qui a un problème passe en anomalie, avec son motif.

**Conséquences (testables) :**
- Un lot a un des états `EN_ATTENTE`, `SCAN_EN_COURS`, `INDEXATION`, `CONTROLE_QUALITE`, `ARCHIVE`, `ANOMALIE` ; le passage d'un état à un autre écrit une ligne au journal avec l'opérateur.
- Un lot distingue le **flux courant** (pièces des dossiers vivants) du **flux de reprise** (pièces historiques, §6.8).
- Chaque pièce d'un lot porte son statut OCR (FR-163) ; les pièces à refaire (OCR raté, extraction partielle, pièce rejetée) sont listées sous l'onglet « à refaire » de l'opérateur.
- Les pièces arrivées depuis moins de 48 heures sont mises en avant avec ce qu'elles bloquent (un RIB illisible bloque le virement, un certificat médical final bloque l'offre, un procès-verbal d'expertise fonde le montant).
- Le taux de numérisation du fonds (pièces numérisées sur pièces attendues) est calculé depuis les données (FR-213).
- Un lot n'est jamais fermé tant que l'une de ses pièces n'a pas passé le contrôle de FR-165 ou n'a pas été placée en anomalie.

#### FR-163 : L'OCR est réel, y compris sur les pièces scannées

Toute pièce image ou PDF scanné est lue par un OCR installé chez la compagnie. Une pièce dont la couche texte compte moins de 60 caractères par page est traitée comme une image. Le résultat de la lecture est stocké avec la pièce, jamais à sa place.

**Conséquences (testables) :**
- Une photo ou un scan de constat, de carte grise ou de facture est lu : son texte est cherchable et alimente la lecture de FR-164.
- Une pièce porte un statut de lecture `NON_TRAITE`, `EN_COURS`, `OK`, `PARTIEL` ou `ECHEC` ; une pièce en `PARTIEL` ou `ECHEC` va dans « à refaire » avec la consigne (relancer l'OCR, numériser à nouveau à 300 dpi, saisir à la main).
- La saisie manuelle d'une pièce illisible est possible ; elle est marquée « saisie à la main » et garde sa pièce d'origine.
- L'OCR ne modifie jamais l'image d'origine ; le texte lu est en plus.
- Le seuil de 60 caractères par page est un paramètre (annexe D).
- L'OCR tourne sur le serveur de la compagnie : aucune image ni texte ne sort de l'instance, en particulier aucune pièce de santé (D1).
- Le temps de lecture d'une page est mesuré et affiché dans le suivi du lot ; une page non lue après un délai `[ASSUMPTION: 2 minutes par page, paramètre]` passe en `ECHEC`.

#### FR-164 : L'IA lit et classe les pièces (usage n° 2)

L'IA commune lit chaque pièce reçue, en propose le **type**, en extrait les champs utiles (n° de police, immatriculation, n° de sinistre, dates, montants, noms), et propose le dossier et la pièce attendue auxquels elle se rattache. **Entrée** : l'image ou le PDF et le texte lu (FR-163). **Sortie** : type, confiance, champs lus avec leur extrait source, rattachement proposé. **Destinataire** : `ACC`, `NUM`, `GEST`. **Garde-fou** : l'IA propose, l'agent confirme au contrôle de FR-165 ; sous le seuil de confiance, l'agent choisit lui-même ; l'IA ne rejette aucune pièce ; chaque lecture est journalisée au registre de l'IA (niveau `EXTRACTION`).

**Conséquences (testables) :**
- Chaque proposition affiche sa confiance et, pour chaque champ lu, l'extrait de la pièce d'où il vient ; un champ sans extrait n'est pas proposé.
- Une proposition dont la confiance est inférieure au seuil bas (0,60 par défaut `[ASSUMPTION: seuils 0,60 et 0,90, paramètres]`) n'est pas pré-sélectionnée ; au-dessus du seuil haut (0,90), elle est pré-sélectionnée et attend quand même la confirmation de FR-165.
- Un type, un rattachement ou un champ corrigé par l'agent est conservé avec la version corrigée ; le registre reçoit le statut `MODIFIEE` et la valeur finale.
- Une pièce médicale est lue et classée dans l'instance ; son contenu n'est jamais affiché à `ACC` (FR-153).
- L'IA commune est coupée : le classement est manuel, la lecture OCR continue (FR-163), le circuit n'est pas retardé.
- Le contrôle de cohérence des pièces (propriétaire de la carte grise, photo déjà utilisée ailleurs, usage n° 3) n'est pas ici : il est au §5.4.

#### FR-165 : Un contrôle humain avant tout archivage

Aucune pièce n'est archivée sans un contrôle avant archivage par une personne : qualité de l'image, lisibilité, type, indexation, rattachement. Le contrôle est fait par `NUM` pour un lot, par l'agent qui a reçu la pièce pour un dépôt au guichet.

**Conséquences (testables) :**
- Une pièce non contrôlée porte l'état « en contrôle » et reste visible du dossier, marquée « non contrôlée ».
- Le contrôleur valide, corrige ou rejette (motif obligatoire) ; un rejet crée une ligne « à refaire » et, si la pièce vient d'un assuré, déclenche la demande de pièce du §5.2.
- Le contrôleur de la pièce est tracé ; l'IA ne contrôle ni ne valide jamais seule.
- Une pièce n'est comptée comme « reçue » pour l'ouverture du dossier (§5.2) qu'après le contrôle ; avant, elle est « reçue, en contrôle ».
- Le temps moyen entre réception et contrôle est un indicateur du pilotage (FR-213).

#### FR-166 : Les pièces non rattachées ont une file

Une pièce dont la clé de rattachement (numéro de police, numéro de sinistre, référence de déclaration, immatriculation) est illisible, inconnue ou ambiguë va dans la file « à rattacher ». Elle ne bloque rien et n'est jamais perdue.

**Conséquences (testables) :**
- Chaque pièce de la file a un âge, un auteur, une proposition de rattachement (FR-164) et un état.
- Une pièce de la file de plus de 3 jours ouvrés lève une alerte à `NUM` et au `RESP` `[ASSUMPTION: 3 jours ouvrés, paramètre]`.
- Rattacher une pièce écrit le rattachement, l'auteur et la date au journal ; la pièce ne change pas.
- La reprise (§6.8) y dépose les documents dont la clé est illisible ou inconnue ; la mise en service n'attend pas qu'elle soit vide.

#### FR-167 : Le numéro d'archivage

Chaque dossier versé au fonds reçoit un **numéro d'archivage** `ARC-AAAA-CCCC-NNNNN` : `AAAA` est l'année de **clôture**, `CCCC` le volet (`CORP`, `MATL`, `DIVR`) ou le recours (`RECS`), `NNNNN` une séquence par année et par volet. Il est attribué par Prospera au versement. Il est porté sur l'étiquette de la chemise et sur l'enregistrement numérique : c'est leur jointure.

**Conséquences (testables) :**
- Un numéro ne se calcule pas, il s'attribue ; deux versements ne reçoivent jamais le même numéro, même en concurrence.
- Un numéro n'est **jamais réutilisé**, même si le dossier est détruit (FR-175) ou si le versement est annulé.
- Un numéro d'archivage repris d'un autre système est **conservé tel quel**, dans son format d'origine, et sert de critère de recherche (§6.8) ; les nouveaux numéros de Prospera sautent ceux qui existent déjà.
- Le numéro se cherche dans la recherche unique (FR-150).
- La reconstitution d'un dossier garde son numéro suffixé `/R1`, `/R2` : un fonds ne se renumérote pas (FR-173).

#### FR-168 : Verser un dossier clos au fonds

Un dossier terminé est **versé au fonds** : un bordereau fixe le contenu pièce par pièce, le dossier reçoit son numéro d'archivage. Le fonds ne reçoit que du terminé.

**Conséquences (testables) :**
- Verser est refusé pour un dossier en instruction (« le fonds ne reçoit que du terminé ») ; il est permis pour `CLOTURE`, `REJETE`, `SANS_SUITE` et pour un dossier dont la fermeture est datée ; un dossier déjà versé ne se verse pas deux fois.
- Le bordereau liste, dans l'ordre : pièce, libellé, nature, pages, présence papier, présence numérique, **valeur** (`ORIGINAL_IRREMPLACABLE`, `ORIGINAL_REEDITABLE`, `COPIE`), émetteur ; les pièces manquantes au versement y sont déclarées.
- Le versement est proposé par `GEST` à la clôture et exécuté par `ARCH` ; il est tracé.
- Un dossier clos non versé depuis plus de 75 jours lève une alerte à `ARCH` (paramètre, valeur de la démo).
- Un dossier versé dont le recours continue n'est pas figé : le recours a son propre numéro (volet `RECS`) et se verse lorsqu'il se clôt (§5.10).
- Le versement n'efface rien : il ajoute le numéro, le bordereau et la cote.

#### FR-169 : Le scellement par empreinte, et le support de référence

Quand **toutes** les pièces du bordereau sont numérisées, contrôlées et indexées, l'image du dossier est **scellée** : Prospera calcule une empreinte de l'ensemble et l'enregistre avec la date. Le **support de référence** du dossier passe alors du papier au numérique ; la bascule est une décision tracée.

**Conséquences (testables) :**
- Une image incomplète n'est pas scellée : le bouton est refusé tant qu'une pièce manque ou est en contrôle.
- Après scellement, toute modification d'une pièce du dossier fait échouer la vérification d'empreinte et le signale ; un ajout se fait par une nouvelle version, qui ouvre un nouveau scellement lié à l'ancien.
- Le support de référence est visible sur la fiche d'archive : « papier » (tant que l'image n'est pas scellée) ou « numérique » (après) ; un seul support fait foi à la fois.
- La vérification de l'empreinte peut être lancée à tout moment par `ARCH` et `AUD` ; une vérification en échec lève une alerte.
- Les originaux irremplaçables (acte de décès, jugement d'hérédité, procès-verbal, constat signé, quittance acquittée) restent en papier tant que la valeur probante de la copie numérisée n'est pas confirmée par le juriste (D21).
- L'horodatage de scellement par un prestataire qualifié est une option, à valider par le juriste ; elle est décrite à l'addendum.

#### FR-170 : L'archive physique a une cote, une boîte et une chemise de couleur

Le dossier papier a une **cote physique** : local, travée, tablette, boîte, rang. Il est rangé dans une **chemise de la couleur de sa branche**. La cote est portée par la fiche d'archive et par l'étiquette de la chemise.

**Conséquences (testables) :**
- Chaque dossier versé porte l'état de son papier : `EN_RAYONNAGE`, `COMMUNIQUE`, `TRANSFERE_EXTERNE`, `INTROUVABLE`, `DETRUIT`, `JAMAIS_CONSTITUE` ; un changement d'état est tracé.
- Une boîte contient au plus 2 500 pages (paramètre) ; l'archiviste est alerté à l'approche de la limite.
- Les couleurs de chemise par branche sont un paramètre de la compagnie ; Prospera n'en invente aucune `[ASSUMPTION: couleurs à fournir par la compagnie]`.
- La dernière vérification physique de chaque boîte est datée ; une boîte non vérifiée depuis plus d'un an `[ASSUMPTION: 12 mois, paramètre]` est listée.
- La cote se lit sur la fiche et l'étiquette s'imprime ; la cote ne sert jamais à retrouver un dossier (FR-150).

#### FR-171 : La sortie et la restitution du papier

Un dossier papier qui sort du local est une **sortie d'archive**, avec un demandeur, un motif et une date de retour attendue. Il est restitué sous 15 jours.

**Conséquences (testables) :**
- Les motifs de sortie sont : instruction, expertise, contentieux, contrôle interne, réclamation, contrôle de la CRCA.
- Une sortie sans demandeur ni motif est refusée ; elle écrit au journal.
- Une chemise non rendue après 15 jours (paramètre) lève une alerte au demandeur et à `ARCH`, puis au `RESP` à 30 jours `[ASSUMPTION: 30 jours, paramètre]`.
- Une chemise transmise à un expert externe est une sortie d'archive tracée avec la mission (§6.3) ; c'est la première cause de chemise non restituée.
- La restitution se constate à la remise sur l'étagère ; elle remet l'état du papier à `EN_RAYONNAGE`.
- Un papier sorti n'empêche jamais de lire l'image numérique du dossier.

#### FR-172 : Le papier reste obligatoire (double support)

Le dossier papier est tenu en parallèle du numérique ; le numérique **ne le remplace pas** pour l'instant. Chaque dossier sait à tout moment où est son papier et quel support fait foi.

**Conséquences (testables) :**
- Un dossier n'est pas déclaré « sans papier » : l'état `JAMAIS_CONSTITUE` n'est posé que par décision motivée de `ARCH`.
- La fiche d'archive affiche les deux supports : état papier et état numérique (`ABSENT`, `PARTIEL`, `COMPLET`, `SCELLE`).
- Le papier d'un dossier dont l'image est complète peut sortir du local ; il n'est détruit que dans le cadre de FR-175.
- Les nouvelles pièces reçues sur papier sont scannées par `ACC` ou `NUM` ; les pièces nées numériques (e-mail, rapport d'expert déposé) sont imprimées au dossier papier à la clôture `[ASSUMPTION: impression à la clôture, à confirmer en séance d'immersion]`.
- Le stock papier historique n'est pas scanné pour la reprise (D17) ; sa cote est reprise, ses pièces ne sont numérisées que si le dossier est rouvert ou consulté `[ASSUMPTION: numérisation à la demande, paramètre]`.

#### FR-173 : Reconstituer un dossier perdu

Un dossier papier introuvable ou non restitué se **reconstitue** à partir de l'archive numérique et des émetteurs, avec un constat de carence et une certification par une autre personne.

**Conséquences (testables) :**
- Le constat de carence nomme qui a cherché, où et quand ; sans lieux cherchés, la reconstitution est refusée.
- La reconstitution assemble les pièces depuis l'archive numérique, dans l'ordre du bordereau ; elle calcule un taux de complétude et marque chaque pièce : rétablie, copie seule, absente.
- Les originaux irremplaçables ne sont rétablis qu'en copie ; le dossier reconstitué l'affiche (« non opposable en justice sans original ou duplicata ») et reste exploitable pour l'instruction, la relation client et le contrôle interne.
- La certification est faite par une personne qui n'a pas reconstitué ; la même personne ne fait jamais les deux.
- Le dossier garde son numéro d'archivage suffixé `/R1`, `/R2`.

#### FR-174 : La conservation dure au moins 10 ans, plus selon la nature

Le dossier et ses pièces sont conservés **au moins 10 ans** : les entreprises conservent pendant 10 ans au moins leurs livres de comptabilité, les lettres reçues, les copies des lettres envoyées et toutes les pièces justificatives de leurs opérations (art. 404 du Code CIMA, texte lu). Au-delà de ce plancher, la durée dépend de la nature du dossier. La durée s'écoule depuis la clôture.

**Conséquences (testables) :**
- La durée effective d'un dossier est la **plus longue** entre le plancher de 10 ans et la durée de sa nature ; une durée paramétrée plus courte que le plancher n'est pas acceptée par le formulaire.
- Les durées par nature, valeurs de la démo : sinistre mortel 30 ans, conservation définitive ; corporel 10 ans, conservation définitive ; contentieux, recours ou litige 10 ans, conservation définitive ; fraude suspectée 10 ans, conservation définitive ; pièces comptables (quittances, ordres, chèques) 10 ans. Pour le matériel, les risques divers, le classé sans suite et le refusé, la démo met 5 ans ; **ce défaut est inférieur au plancher** : la valeur de départ de Prospera est 10 ans `[ASSUMPTION: plancher de l'art. 404 appliqué ; les 5 ans de la démo ne s'appliquent que si le juriste le confirme (D21)]`.
- Le point de départ de la durée est la date de clôture ; le point de départ exact est confirmé par le juriste `[ASSUMPTION: date de clôture]`.
- L'échéance d'un dossier est affichée sur sa fiche d'archive (« à examiner à partir du [date] ») ; un dossier en conservation définitive n'a pas d'échéance.
- La durée de conservation des données personnelles n'excède pas ce qui est nécessaire (art. 53 de la loi 2019-014) : la justification de chaque durée est écrite dans la table des paramètres.

#### FR-175 : Détruire est une décision visée et tracée, jamais un défaut

Aucun dossier, aucune pièce n'est détruit par défaut ni par un automatisme. La destruction d'un papier ou d'un fichier est une **décision visée**, par des personnes nommées, et **tracée**.

**Conséquences (testables) :**
- Un dossier est « destructible » seulement si sa durée de conservation est écoulée **et** que sa nature n'est pas en conservation définitive **et** que son image est scellée ; la liste est proposée par `ARCH`.
- La destruction exige un bordereau de destruction, visé par le `RESP` puis par le `DG` `[ASSUMPTION: double visa, à confirmer en séance d'immersion]`, avec la liste des dossiers et la date.
- Aucun bouton « supprimer » n'existe sur une pièce ou un dossier pour aucun rôle, y compris `ADMIN`.
- Un dossier détruit garde son numéro d'archivage, son état `DETRUIT`, la date, les visas et le bordereau ; son numéro n'est jamais réutilisé.
- Une destruction demandée sur un dossier sous contrôle, litige ou sortie d'archive est refusée.

#### FR-176 : Les pièces vivent sur le NAS de la compagnie, sauvegardées chaque jour

Les fichiers sont stockés sur le **NAS** de la compagnie, à côté du serveur applicatif (D1). Aucun fichier n'est stocké ni lu hors du site. Une sauvegarde quotidienne est faite, et la restauration est testée.

**Conséquences (testables) :**
- Une pièce déposée se retrouve après une panne du serveur applicatif (le NAS conserve les fichiers) ; elle se retrouve après la restauration d'une sauvegarde.
- La sauvegarde quotidienne est vérifiée chaque jour ; un échec lève une alerte à `ADMIN`.
- Une restauration est testée au moins une fois avant la mise en service, puis au moins une fois par an `[ASSUMPTION: test annuel, paramètre]` ; le compte rendu est conservé.
- L'espace disque du NAS est surveillé ; à 80 % d'occupation `[ASSUMPTION: 80 %, paramètre]` une alerte part à `ADMIN`.
- Le dimensionnement de départ est de 50 000 dossiers archivés et 1,5 million de pages `[ASSUMPTION: hypothèse de D20, à remplacer par les vrais volumes]`.
- Le format d'archive est un format pérenne (PDF/A) `[ASSUMPTION: PDF/A, à confirmer]` ; l'image d'origine reste conservée.

---

### 6.3 Experts et intervenants (`expertises`, M29)

**Ce que ça veut dire.** Le circuit des missions d'expertise (suggérer, désigner, transmettre, recevoir, valider, contester) est au §5.5. Cette section décrit **les personnes et les cabinets** qui rendent ces missions possibles : le référentiel des experts, leur agrément, le panel interne, le médecin-conseil, le portail du cabinet externe, la saisie pour un cabinet sans compte, les honoraires, la charge et les délais. Un sinistre appelle autant de missions que de questions distinctes (véhicule, blessures, responsabilité) : chaque mission est autonome, rattachée au même dossier.

#### FR-177 : Le référentiel des experts

Prospera tient la liste des experts et des cabinets que la compagnie peut mandater. Chaque fiche porte : nom, nature (**interne** ou **externe**), cabinet, domaines couverts, zones couvertes, téléphone, e-mail, numéro d'agrément et sa date de fin, mode d'honoraires (salarié, forfait, barème, vacation), tarif de référence, délai de rapport annoncé, capacité, état actif ou inactif avec motif. La liste de départ est celle que la compagnie fournit (liste des experts agréés, §6.8).

**Conséquences (testables) :**
- Un expert se crée, se modifie et se désactive avec un motif ; il ne se supprime pas : ses missions passées restent liées à sa fiche.
- Les domaines sont ceux des missions : auto-matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation ; la liste est un paramètre.
- Le référentiel enregistre la qualification de l'expert ou du médecin (diplôme, inscription, années d'activité), en rapport avec l'art. 272 du Code CIMA (qualification du médecin ou de l'expert technique mandaté ; répertoire tenu par chaque État, texte lu) ; le contrôle exact est renvoyé au juriste (D21).
- Seuls `RESP` et `DT` créent ou désactivent un expert ; `GEST` ne voit que les experts désignables pour son volet.
- Un expert désactivé n'apparaît plus dans la liste de désignation (§5.5) et reste visible dans l'historique.

#### FR-178 : Un agrément échu rend l'expert non désignable

L'agrément d'un expert externe a une date de fin. Un agrément échu rend l'expert **non désignable** : le système refuse la désignation, il ne se contente pas de la déconseiller.

**Conséquences (testables) :**
- Une désignation d'un expert dont la date de fin d'agrément est dépassée est refusée avec le motif « agrément échu le [date] ».
- Une alerte part au `RESP` 60 jours avant la fin de l'agrément `[ASSUMPTION: 60 jours, paramètre]`.
- Un expert dont l'agrément échoit entre la désignation et le rapport garde sa mission en cours ; une nouvelle mission lui est refusée.
- Prolonger un agrément exige la nouvelle date et la pièce justificative (copie de l'agrément) ; l'action est tracée.
- Prospera ne fixe pas qui est agréé : il applique la liste et les dates de la compagnie ; la réglementation des experts automobiles (agrément, tarifs) n'a pas été trouvée et est renvoyée au juriste (D21).

#### FR-179 : Le panel interne et le médecin-conseil

La compagnie a des **experts internes** (`EXPI`), avec leurs domaines et leurs zones, et un **médecin-conseil** (`MED`). Ils accèdent au dossier de leurs missions **dans l'application** : il n'y a pas de transmission hors de la compagnie. Ils rédigent leur rapport rubrique par rubrique.

**Conséquences (testables) :**
- Un `EXPI` ouvre seulement les missions qui lui sont confiées et les dossiers de ces missions ; il n'a pas la recherche générale.
- Le `MED` lit les données de santé des dossiers dont il a une mission (D14) ; chaque lecture est journalisée (FR-153).
- Un expert interne ne facture pas d'honoraires (FR-182).
- Le référentiel dit quels domaines et quelles zones le panel interne couvre ; dans le jeu de démonstration : auto-matériel, médical, responsabilité, en zones de Lomé, Tsévié et Aného `[ASSUMPTION: jeu de démonstration seulement]`.
- Les règles qui imposent un expert externe (au-dessus d'un seuil, contre-expertise, fraude, contentieux, domaine non couvert) sont au §5.5 ; le référentiel leur fournit les domaines et les zones.
- Un expert interne qui change de rôle perd l'accès à ses missions ouvertes ; elles sont réaffectées avec motif.

#### FR-180 : Le portail du cabinet externe

Un cabinet externe qui a un compte (`EXPE`) travaille dans un **portail** qui ne montre **que ses missions**. Il accepte ou décline une mission (le refus a un motif), accuse réception des pièces transmises, programme sa visite, dépose son rapport et enregistre sa note d'honoraires. Il ne voit jamais le portefeuille ni un autre dossier.

**Conséquences (testables) :**
- Le portail liste les missions à accepter, les rapports à déposer, les honoraires et le suivi ; aucune recherche générale n'existe pour `EXPE`.
- Décliner exige un motif ; la mission retourne « à désigner » (§5.5) et le cabinet est exclu de la liste de cette mission, avec son refus conservé.
- Les pièces transmises sont **une liste choisie** par le gestionnaire pour cette mission ; le cabinet n'en voit pas d'autres ; il accuse réception, et la date d'accusé est tracée.
- Le rapport se dépose de deux façons : **rédigé en ligne par rubriques** (le portail génère le PDF, versé comme pièce de la mission) ou **téléversé** (fichier du cabinet) ; les conclusions sont obligatoires dans les deux cas.
- Chaque dépôt crée une version du rapport (FR-161) ; les versions antérieures restent lisibles par le gestionnaire.
- Les accès du cabinet sont tracés comme ceux d'un agent (FR-158) ; une mission terminée est en lecture seule pour lui après le délai de FR-184.
- Le compte d'un cabinet exige une authentification renforcée (identifiant et second facteur) `[ASSUMPTION: second facteur obligatoire pour EXPE, à confirmer]`.
- Le portail ne donne accès ni aux montants de l'évaluation de la compagnie, ni à la provision, ni à l'instruction.

#### FR-181 : Un cabinet sans compte : le gestionnaire saisit

Un cabinet n'a pas obligatoirement de compte. Quand son rapport arrive par courrier ou par e-mail, le **gestionnaire le saisit pour lui** (D15). Le portail sert les cabinets qui ont un compte.

**Conséquences (testables) :**
- La saisie d'un rapport pour un cabinet sans compte exige la **pièce jointe** (le rapport reçu, numérisé) ; sans elle, l'enregistrement est refusé.
- Le rapport saisi est marqué « saisi pour le cabinet » avec le nom du gestionnaire et la date de réception réelle.
- Les mêmes contrôles que pour un rapport déposé sur le portail s'appliquent (§5.5) ; il n'y a pas deux circuits.
- La désignation, l'acceptation (par téléphone ou courrier) et l'accusé de réception sont saisis par le gestionnaire avec leur date et leur moyen.
- Un cabinet sans compte peut recevoir un compte plus tard sans perdre l'historique de ses missions.

#### FR-182 : Les honoraires de l'expert : note, visa, jamais au-delà du facturé

L'expert externe enregistre sa **note d'honoraires** (ou le gestionnaire la saisit pour lui). Un **visa** par le `RESP` ou le `CPT` la valide. Le montant visé ne dépasse **jamais** le montant facturé. Le paiement se fait par le circuit des règlements (§5.8), comme une nature « honoraires » (D8, D11).

**Conséquences (testables) :**
- Cinq montants suivent la mission, distincts : **budget prévisionnel**, **honoraires convenus** (lettre de mission), **facturés**, **visés**, **payés**.
- Viser un montant supérieur au facturé est refusé.
- Viser au-delà du convenu exige un motif ; un dépassement du budget prévisionnel est signalé au `RESP` avec le motif du dépassement.
- Une note sans pièce jointe (facture) est refusée ; sa date et son numéro de facture sont enregistrés.
- Celui qui vise ne paie pas (règle du circuit, D8) : le `CPT` qui a visé n'émet pas le règlement de la même note.
- Un expert interne n'a pas de note ; un expert à vacation ou à forfait applique son mode d'honoraires du référentiel.
- Les honoraires visés et payés alimentent l'export comptable (FR-193) et le pilotage (FR-207).

#### FR-183 : La charge et la capacité des experts

Le responsable voit, pour chaque expert, **combien il a de missions**, **ce qu'elles pèsent** et **quand ses rapports sont dus**, pour choisir « celui qui est le moins chargé à la date où j'ai besoin du rapport ».

**Conséquences (testables) :**
- Trois lectures sont disponibles par expert : nombre de missions (actives, en attente d'acceptation, rapports attendus, en retard, terminées), **charge pondérée** contre capacité, échéancier des rapports dus à 7 et 15 jours.
- Le poids d'une mission est : poids du domaine × coefficient de type de mission × coefficient de gravité du sinistre (léger ou modéré 1, grave 1,3, mortel 1,6), arrondi au demi-point ; le poids par domaine et les coefficients sont des paramètres (annexe D) `[ASSUMPTION: poids par domaine à fournir par la compagnie]`.
- Un expert à plus de 1,2 fois sa capacité est « surchargé » ; à moins de 0,8, « disponible » (paramètres de la démo).
- Le taux d'occupation, le délai moyen de rapport, le taux de respect du délai, le taux de rapports avec complément demandé et le taux de contestation sont calculés depuis les missions, jamais saisis.
- La liste de désignation (§5.5) classe les experts désignables avec leur charge, leur délai estimé, leur coût estimé et les raisons du classement ; elle ne désigne pas toute seule.

#### FR-184 : Les délais de rapport, par domaine

Chaque mission a un **délai de rapport attendu**, qui dépend de son domaine. Un rapport en retard est relancé, puis arbitré.

**Conséquences (testables) :**
- Les délais par défaut, en jours, sont ceux de la démo : auto-matériel 7, médical 21, responsabilité 14, fraude 30, incendie 21, transport 14, bâtiment 21, perte d'exploitation 30 ; ce sont des paramètres de la compagnie, par domaine.
- La date de rapport attendu est calculée depuis la visite (ou depuis l'acceptation s'il n'y a pas de visite) ; un point de départ et un point d'arrêt sont visibles sur la mission.
- Un rapport en retard est relancé (jours entre deux relances : 5 par défaut) ; après 3 relances sans effet, le système propose un arbitrage (changer d'expert, escalader) plutôt qu'une relance de plus.
- Pour une expertise **médicale** après un accident corporel de la circulation, le rapport est transmis à l'assureur, à la victime et à son médecin dans les **20 jours** de l'examen (art. 245 du Code CIMA, texte lu) : cette échéance **réglementaire** est affichée en plus du délai interne, et la compagnie ne la modifie pas ; l'avis à la victime d'au moins 15 jours avant l'examen (art. 244) est géré au §5.5.
- Un rapport rendu hors délai reste exploitable ; le retard est enregistré dans les indicateurs de l'expert (FR-183).

#### FR-185 : Le budget indicatif d'une mission

À la suggestion d'une mission, Prospera calcule un **budget indicatif** pour aider le gestionnaire à choisir et à annoncer. Il ne remplace ni la lettre de mission ni le tarif de l'expert.

**Conséquences (testables) :**
- Le budget est : (socle du domaine + le plus petit de 2 % de l'enjeu et du plafond moins le socle) × coefficient du type de mission, arrondi à 5 000 FCFA ; plafond 1 200 000 FCFA ; coefficients de type : initiale 1, complémentaire 0,5, contradictoire 1,5, contre-expertise 1,5.
- Les socles par domaine sont ceux de la démo : auto-matériel 45 000, médical 120 000, responsabilité 75 000, fraude 250 000, incendie 200 000, transport 120 000, bâtiment 150 000, perte d'exploitation 300 000 FCFA ; ces valeurs sont **à remplacer** par le tarif des experts de la compagnie.
- Le budget affiché porte la mention « indicatif » ; il n'est jamais envoyé comme engagement à un cabinet.
- Une mission dont les honoraires convenus dépassent le budget indicatif demande un motif au visa (FR-182).
- Tous les montants du calcul sont des paramètres modifiables et datés ; un budget déjà calculé n'est pas recalculé quand les paramètres changent.

---

### 6.4 Contrats, provisions et états (`assurance`, M30/M31)

**Ce que ça veut dire.** Le module `assurance` fait deux choses. Il **lit** les contrats du LC (polices, garanties, produits, primes payées, intermédiaires, coassureurs) pour que le circuit puisse contrôler la recevabilité et chiffrer l'indemnité (D4). Et il **tient** la provision de chaque dossier, puis en produit les états : l'état des provisions pour sinistres à payer (PSAP), les parts cédées en réassurance et en coassurance, les données des états de contrôle, et l'export pour la comptabilité (D12, D16). **La comptabilité officielle reste hors de Prospera** : Prospera ne passe aucune écriture au sens du grand livre. Il fournit des états et des exports.

#### FR-186 : Les polices sont lues du LC, datées, jamais modifiées

Prospera garde une **projection** de ce que le LC tient : assurés, polices (numéro, souscripteur, branche, produit, dates d'effet et d'échéance, statut en vigueur, suspendue, résiliée ou expirée, immatriculation, intermédiaire, capitaux garantis), garanties souscrites (code, libellé, statut acquise, non souscrite ou suspendue, plafond, franchise en taux et en minimum, délai de déclaration, exclusions), produits, **état de paiement de la prime** (payée ou non, à quelle date), intermédiaires (courtiers, agents) et coassureurs avec leurs parts. La projection est **datée** et **en lecture seule**.

**Conséquences (testables) :**
- Aucun écran de Prospera ne permet de créer, modifier ou supprimer une police, une garantie, une prime, un intermédiaire ou un coassureur ; les montants et les statuts viennent du LC.
- Chaque donnée affichée porte la date de sa dernière lecture du LC ; plus vieille que le double de la fraîcheur par défaut (§6.5), elle est marquée « périmée ».
- Chaque objet reçu garde l'identifiant stable du LC ; Prospera ne le remplace jamais.
- Prospera ne tient ni primes ni production : il ne lit que ce qu'il faut au circuit (l'état de paiement de la prime, pas son montant d'émission) ; aucun indicateur de Prospera n'utilise la prime `[ASSUMPTION: la prime n'entre dans aucun indicateur sinistre, comme dans la démo]`.
- Un objet reçu qui ne respecte pas les champs minimaux de l'annexe C est refusé avec un motif en clair et placé dans la file des écarts (§6.5).
- La projection est amorcée par la reprise (§6.8, fichier de polices) puis tenue à jour par l'échange (§6.5) `[ASSUMPTION: la reprise amorce la projection ; à confirmer avec le plan de la reprise]`.
- Une police absente de la projection est signalée « police inconnue du LC » ; le dossier peut se déclarer (§5.1) mais l'ouverture exige la décision motivée de FR-187.

#### FR-187 : Les garanties qui répondent d'un type de sinistre

Une **table de correspondance** dit, pour chaque type de sinistre, **quelles garanties répondent**. Le contrôle de recevabilité (§5.2) l'utilise avec la projection de FR-186 : police en vigueur, prime payée, garantie souscrite, délai de déclaration. La table de la démo est le point de départ ; la compagnie la modifie.

**Conséquences (testables) :**
- Pour chaque type de sinistre, la table nomme les garanties qui répondent (par exemple, un accident corporel appelle la responsabilité civile de circulation) ; un type sans garantie nommée est signalé à `RESP` à la sauvegarde.
- Le contrôle donne un verdict par point (police, période, prime, garantie, plafond et franchise, délai de déclaration) avec la valeur lue et sa date de lecture.
- **Le contrôle de garantie ne peut pas être sauté** (écart corrigé de la démo, D4) : si une information manque, le gestionnaire enregistre une **décision motivée** `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, avec un motif d'au moins 10 caractères ; elle est visible de `AUD`.
- Une déclaration hors du délai contractuel donne une **réserve et un motif**, jamais une déchéance automatique : la déchéance suppose un préjudice établi, et le `RESP` décide (D15 ; art. 20 du Code CIMA, texte lu : le retard n'est opposable que si l'assureur prouve qu'il lui a causé un préjudice).
- Pour un accident de la circulation, l'état de la police (suspendue, prime impayée) est affiché avec l'alerte « opposabilité à la victime à vérifier » ; le Code limite l'opposabilité des suspensions de garantie aux victimes (art. 210 et son interprétation, texte lu) ; la décision revient au `RESP` et la règle exacte au juriste (D21).
- Les plafonds, franchises et délais de déclaration viennent de la garantie souscrite lue du LC, jamais d'une saisie du gestionnaire.

#### FR-188 : La provision, dossier par dossier

Prospera tient, pour chaque dossier, la **provision** : la charge estimée du sinistre. Elle est posée à l'**ouverture** (milieu de tranche selon la gravité, ou estimation du gestionnaire), puis **revue à chaque événement** : rapport d'expertise, devis, certificat médical, rapport de police, évaluation, validation, offre, règlement. Chaque révision porte un motif. La provision est calculée **en brut** ; les recours à exercer sont évalués à part (art. 334-12 du Code CIMA, texte lu : provision exercice par exercice, dossier par dossier, sans tenir compte des recours à exercer).

**Conséquences (testables) :**
- Un mouvement de provision n'est **jamais écrasé** : il s'ajoute, avec séquence, date, montant avant et après, motif, auteur et pièce justificative.
- Les motifs sont : ouverture, rapport d'expertise, devis de réparation, certificat médical, rapport de police, barème appliqué, validation hiérarchique, régularisation, clôture.
- Un nouveau montant égal à l'ancien, ou sans motif, est refusé.
- Une révision dont l'écart dépasse 2 000 000 FCFA attend le `RESP` avant d'être effective (D12) ; le `GEST` ne la valide pas lui-même.
- Un dossier dont la provision s'écarte de plus de 15 % de l'estimation de référence (expert, devis, médiane des comparables) est signalé « à revoir » ; un dossier sans mouvement de provision depuis 90 jours est signalé, et une provision de plus de 365 jours est « ancienne » (paramètres de la démo).
- La provision d'ouverture vient d'une **grille par volet et par gravité**, paramétrée par la compagnie ; elle sert à l'ouverture et au pilotage, pas au barème d'indemnisation, qui est un calcul poste par poste (D15).
- Le `GEST` peut reporter une revue de provision de X jours avec motif ; le dossier sort de la file « à revoir » jusqu'au terme ; l'`AUD` voit les reports.
- Clôturer un dossier ramène sa provision à zéro avec le motif « clôture » ; le reste à payer d'un dossier clos doit être nul (§5.9).

#### FR-189 : L'état des provisions (PSAP), par exercice de survenance, brut, cédé, net

Prospera produit l'**état des provisions** : dossier par dossier, regroupé par **exercice de survenance**, avec le **brut**, la part **cédée** en réassurance (FR-190), la part des coassureurs (FR-191) et le **net**. Il est daté et rejouable.

**Conséquences (testables) :**
- L'état liste, pour chaque dossier ouvert à la date d'arrêté : numéro de sinistre, exercice de survenance, sous-catégorie, provision brute, part cédée, part des coassureurs, net, date du dernier mouvement.
- Le total de l'état est égal à la somme des provisions des dossiers, au franc près ; un écart est un défaut.
- Un dossier est classé selon l'exercice de sa **date de survenance**, jamais celle de sa déclaration ou de son import (§6.8).
- La date d'arrêté se choisit ; l'état d'une date passée est reconstruit depuis les mouvements, sans recalcul avec les paramètres du jour.
- Les sinistres survenus mais non déclarés (IBNR) sont estimés selon des modalités fixées par une circulaire de la CRCA (art. 334-12) : Prospera **ne calcule pas l'IBNR officiel** ; l'état a une colonne que la compagnie renseigne ou importe `[ASSUMPTION: l'IBNR est estimé hors de Prospera au premier jour ; à confirmer avec le juriste et la direction technique]`.
- L'état s'exporte en tableur ; `DT`, `DG`, `CPT`, `AUD` le lisent.

#### FR-190 : La réassurance, par traité et par millésime

La **cession** de chaque sinistre suit le **traité en vigueur à sa date de survenance**. Les traités sont versionnés par **millésime**. Deux types existent : la **quote-part** (taux de cession) et l'**excédent de sinistre** (rétention et portée). Prospera affiche, pour chaque dossier, la décomposition brut, rétention, part du réassureur, net.

**Conséquences (testables) :**
- Un traité a un millésime, un type, une branche, un taux ou une rétention et une portée, un réassureur ; un traité se crée sans livraison (paramètre) et se versionne sans écraser le précédent.
- Un sinistre de 2025 est cédé selon le traité 2025, un sinistre de 2026 selon le traité 2026, quelle que soit la date de règlement.
- Les traités de la démo (structures par branche : excédent automobile, quotes-parts incendie et transport, excédent de responsabilité, quote-part accident, excédent risques divers) sont un **jeu de démonstration seulement** ; la compagnie saisit ses traités réels avant la mise en service.
- Un dossier sans traité applicable est affiché « sans traité » dans l'état, jamais cédé à zéro en silence.
- Une cession recalculée à une nouvelle provision ou à un règlement est enregistrée comme un mouvement, avec le traité utilisé.
- Les traités sont saisis par `DT` ou `DG` ; `GEST` et `CPT` les lisent.
- Les traités peuvent aussi être reçus du LC s'il les tient (annexe C, flux facultatif).

#### FR-191 : La coassurance, par clé de répartition

Une police en coassurance a une **clé de répartition** : les parts de chaque compagnie, dont le rôle d'**apériteur** ou de **coassureur** (la somme des parts est 100 %). La clé s'applique à la provision, à l'indemnité, au règlement, au recours et à la cession. L'apériteur instruit et règle la victime ; les coassureurs remboursent leur quote-part.

**Conséquences (testables) :**
- La clé est lue du LC avec la police (FR-186) ; si le LC ne la fournit pas, `RESP` ou `DT` la saisit avec la pièce justificative, et elle est marquée « saisie ».
- Une clé dont la somme n'est pas 100 % est refusée.
- Quand la compagnie est apériteur, la part des coassureurs est calculée sur chaque règlement et produit une ligne « à réclamer aux coassureurs » ; quand elle est coassureur, Prospera n'instruit pas : il tient la quote-part qu'elle doit.
- L'état de FR-189 sépare la part de la compagnie et celle des coassureurs.
- Les coassureurs sont informés à l'ouverture du dossier (§5.2).

#### FR-192 : Les données des états pour le contrôle de la CRCA

La CRCA contrôle sur pièces et sur place, et peut demander à la compagnie toutes les informations qu'elle juge nécessaires (art. 310 et 405 du Code CIMA, texte lu). Les états annuels que la compagnie remet comprennent notamment les états par exercice de survenance, de paiements et de provisions, et le suivi des sinistres de grande ampleur non clôturés, notamment C10, C10a, C10b et C10d (art. 422, liste lue) ; ils sont remis au plus tard le 1er juin (art. 405). **Le contenu exact et le format de ces états sont à préciser par le juriste (D21, circulaires de la CRCA).** Prospera ne prétend pas produire l'état officiel : il **fournit, pour chaque dossier, les données dont ces états se nourrissent**.

**Conséquences (testables) :**
- Chaque dossier sait produire, à une date d'arrêté : exercice de survenance, catégorie ou sous-catégorie, nombre de sinistres, paiements cumulés, provision, recours encaissés et prévus, coût moyen, et un drapeau « grande ampleur non clôturé » ; le seuil du drapeau est un paramètre `[ASSUMPTION: seuil à fixer avec la compagnie]`.
- L'export s'obtient en tableur, par exercice et par catégorie, daté, avec le nom de celui qui l'a demandé.
- Les colonnes de l'export sont versionnées ; une colonne ajoutée par le juriste ne change pas les exports passés.
- Aucun état n'est présenté comme « officiel » : il porte la mention « données de base pour l'état réglementaire ».
- L'export est lisible par `DT`, `DG`, `AUD` ; la production d'un dossier de contrôle complet est décrite en FR-211.

#### FR-193 : L'export pour la comptabilité

Prospera produit, pour la comptabilité de la compagnie, un **état et un export** de ce que le circuit a fait : règlements émis et remis, honoraires visés et payés, provisions (dotations et reprises), recours encaissés, cessions (D16). Le format suit le contrat d'échange (annexe C). La comptabilité garde la comptabilité : Prospera ne passe pas d'écriture au grand livre.

**Conséquences (testables) :**
- Chaque ligne de l'export porte : date, journal, compte, libellé, débit, crédit, pièce justificative ; le compte vient d'une **table de correspondance** nature de l'opération vers compte, paramétrée par la compagnie : **le plan de comptes de la compagnie fait foi** ; la table de la démo est remplacée à la mise en service.
- Un export a un numéro, une période et un auteur ; en demander un second pour la même période ne duplique aucune ligne chez la comptabilité (idempotence par clé d'origine).
- La somme des débits égale la somme des crédits de chaque export.
- Un règlement émis, remis, rejeté ou annulé produit la ligne correspondante ; un règlement bloqué par un contrôle (fraude, séparation des fonctions) n'en produit aucune.
- Le rapprochement bancaire des chèques et du Mobile Money se fait dans le module `paiement` ; un écart de rapprochement de plus de 60 jours est une alerte (D16, démo).
- Prospera fournit aussi un état mensuel : règlements émis, remis, en attente, en circulation, comptes d'attente à justifier, honoraires, dotations et reprises de provision.
- Les provisions et les règlements sont aussi envoyés au LC par l'échange (§6.5, flux « évaluation et provision », « règlement ») : l'export de comptabilité est un autre canal, jamais le seul.

---

### 6.5 L'échange avec le logiciel de la compagnie (`liaison-assureur` [proposition], M48 [proposition])

**Ce que ça veut dire.** Le LC tient les contrats de la compagnie et, pour un début, le **numéro de sinistre officiel** (récit du PO, §1). Prospera se branche **à côté**, pour le dossier sinistre. Le module `liaison-assureur` porte le **contrat d'échange** (annexe C) : il reçoit du LC ce que le LC tient, il lui renvoie ce que Prospera décide, et il dit à chaque écran quelle est la fraîcheur de ce qu'il montre. **Le PRD ne dit rien du LC réel** : son nom, son API et son format ne seront connus qu'en janvier. Le contrat ne dépend d'aucun produit. L'échange passe par une API si le LC en offre une, sinon par des fichiers Excel ou JSON, dans les deux sens. Le connecteur d'un produit précis se fera quand le LC sera connu ; le contrat d'échange et le LC fictif (§6.6) sont, eux, au premier jour `[ASSUMPTION: transposition de la décision de la microfinance (PRD-MF §6.5, décision A9) ; à confirmer]`.

#### FR-194 : Le LC fait foi pour les contrats et le numéro de sinistre ; Prospera tient le dossier

Le LC tient : les assurés, les polices, les garanties, les primes et leur paiement, les intermédiaires, les coassureurs et le **numéro de sinistre officiel**. Prospera tient : la déclaration, les pièces, l'instruction, l'expertise, l'évaluation, la **provision du dossier**, la décision, l'offre, le règlement, le recours, les archives et le journal.

**Conséquences (testables) :**
- Aucun écran de Prospera ne permet de modifier un contrat du LC ni d'en créer un.
- Tout montant ou statut de contrat affiché porte sa source (« LC » ou « Prospera ») et la date de sa dernière lecture.
- En cas d'écart sur un contrat, le LC l'emporte ; l'écart va dans la file des écarts (FR-200). En cas d'écart sur un champ du dossier (instruction, pièces, décision), Prospera l'emporte pour tout dossier qu'il tient (§6.8).
- Le contrat d'échange est le même quel que soit le LC : changer de LC (le logiciel actuel, puis le nouveau logiciel métier de la compagnie) ne change ni écran ni exigence, seulement le transport et la table de correspondance.
- Le PRD ne nomme aucun logiciel : un test lit le texte du contrat et de la liste des flux et n'y trouve aucun nom de produit.

#### FR-195 : Prospera reçoit du LC les objets des contrats

Prospera reçoit du LC : les **assurés**, les **polices**, les **garanties souscrites**, les **produits**, l'**état de paiement des primes**, les **intermédiaires**, les **coassureurs** et leurs parts, les **numéros de sinistre attribués**, les **sinistres existants** et leurs **documents**. Les traités de réassurance sont reçus si le LC les tient (facultatif). Chaque objet est défini à l'annexe C.

**Conséquences (testables) :**
- Chaque objet reçu garde l'identifiant stable que le LC lui donne ; Prospera ne le remplace jamais.
- Un objet reçu qui ne respecte pas les champs minimaux de l'annexe C est refusé avec un motif en clair et placé dans la file des écarts (FR-200).
- Les sinistres déjà existants dans le LC (déclarés par d'autres canaux avant Prospera) sont reçus avec leurs documents ; ils servent à la reprise (§6.8) et au contrôle de doublon (FR-198).
- Un fichier ou une réponse partielle (un lot dont une partie des lignes est refusée) intègre les lignes valides et refuse les autres avec le motif ; rien n'est ignoré en silence.
- L'absence d'un objet facultatif (traités, documents) ne bloque aucun autre flux.

#### FR-196 : Prospera renvoie au LC ce qu'il décide

Prospera envoie au LC, chacun avec sa **clé d'origine** et son **état** : les **déclarations** (pour obtenir un numéro de sinistre), les **évaluations et provisions**, les **règlements**, les **recours encaissés** et les **clôtures** (ainsi que les rejets, les classements sans suite et les réouvertures).

**Conséquences (testables) :**
- Une déclaration part dès sa création (§5.1) ; une évaluation ou une provision part à chaque changement validé (§6.4) ; un règlement part à l'émission puis à la remise (§5.8) ; un recours encaissé part à son rapprochement (§5.10) ; une clôture part à la clôture (§5.9).
- Chaque envoi porte une clé d'origine unique et l'identité de l'auteur de la décision.
- Chaque envoi a un état visible : à envoyer, envoyé, accepté, refusé (avec le motif du LC), jamais confirmé après un délai (24 heures par défaut, paramètre).
- Un refus du LC remonte au rôle concerné (`GEST`, `GREC` ou `RESP`) dans sa file, avec le motif.
- Chaque message sortant du corps du PRD (« envoyé au LC ») a une ligne dans l'annexe C avec son sens, sa clé d'origine et ses états ; un test parcourt l'annexe et le corps pour vérifier qu'aucun message n'a été oublié.
- Prospera n'envoie jamais de donnée de santé au LC : un envoi d'évaluation ou de clôture ne contient que le montant, la garantie, le statut et les références, pas le contenu des pièces médicales `[ASSUMPTION: aucune donnée de santé vers le LC ; à confirmer]`.

#### FR-197 : API ou fichier, dans les deux sens

Le contrat d'échange est servi par deux transports interchangeables : une **API** que Prospera interroge, ou des **fichiers Excel ou JSON** que Prospera relève ou dépose dans un emplacement partagé du réseau de la compagnie. Les deux transports valent dans les deux sens. **Prospera tire et dépose ; il n'ouvre aucun port entrant pour cet échange** `[ASSUMPTION: règle de la microfinance reprise, décision A10 ; à confirmer à la séance d'immersion]`.

**Conséquences (testables) :**
- Les deux transports portent le même contrat ; changer de transport ne change aucun écran ni aucune exigence.
- Un LC sans API est limité à une fraîcheur horaire ou nocturne ; l'écran le dit (FR-201).
- Un fichier est identifié (numéro de lot, date, version du contrat, objet) ; un fichier relevé deux fois n'est intégré qu'une fois.
- Le fichier est lisible par un humain : un onglet ou un tableau par objet, une ligne par objet, une colonne par champ de l'annexe C ; le même contenu existe en JSON.
- Le détail des transports, des enveloppes et des formats est dans l'addendum.

#### FR-198 : Le numéro de sinistre : référence immédiate, numéro officiel ensuite

À la déclaration dans Prospera, le dossier reçoit **immédiatement** une **référence de déclaration** `DEC-AAAA-NNNNN`, remise à l'assuré sur l'accusé de réception ; la déclaration part vers le LC (FR-196). Le LC renvoie le **numéro de sinistre officiel** ; Prospera le rattache. **C'est ce numéro qui s'affiche partout ensuite** ; la référence de déclaration reste un critère de recherche (FR-150).

**Conséquences (testables) :**
- La référence `DEC-` est attribuée sans attendre le LC, sans trou ni doublon, même si le LC est coupé.
- Un dossier sans numéro officiel depuis plus de **1 jour ouvré** lève une alerte au `RESP` (paramètre).
- Le **paramètre « qui attribue le numéro de sinistre »** vaut « le LC » par défaut ou « Prospera » : basculer ne demande pas de reprise du code ; quand Prospera attribue, le numéro suit un format paramétré (défaut `SIN-AAAA-NNNN`) `[ASSUMPTION: format de la démo]`.
- Prospera n'impose aucun format au numéro officiel du LC : il accepte le texte reçu, dans une limite de longueur paramétrée.
- Le **contrôle de doublon** porte sur la police, la date de survenance, l'immatriculation et la victime ; il cherche dans les dossiers de Prospera **et** dans les sinistres reçus du LC ; un doublon probable est signalé au gestionnaire, qui décide ; Prospera ne fusionne jamais seul.
- Un dossier déclaré au LC avant Prospera (par un autre canal) se rattache à son numéro officiel ; il n'a pas de référence `DEC-` tant qu'il n'a pas été déclaré dans Prospera.
- Le numéro officiel reçu du LC pour un dossier déjà numéroté est refusé comme écart, sauf si le dossier n'avait pas de numéro.

#### FR-199 : Quand le LC ne sait pas recevoir, Prospera sort la liste « à saisir dans le logiciel de la compagnie »

Si le LC ne sait pas recevoir un flux (ni API, ni fichier), Prospera produit chaque jour la **liste de ce qu'il faut saisir** dans le LC : déclarations (pour obtenir un numéro), évaluations et provisions, règlements, recours encaissés, clôtures. L'agent qui saisit dans le LC **reporte le numéro obtenu** dans Prospera.

**Conséquences (testables) :**
- La liste est un fichier lisible (tableur) et un écran ; chaque ligne porte : référence (`DEC-` ou numéro officiel), nature, montant, date, auteur, clé d'origine à recopier.
- Une déclaration quitte la liste quand le numéro officiel est reporté dans Prospera ; une autre ligne quitte la liste quand le LC renvoie sa trace (flux de FR-195) ; si le LC ne peut rien renvoyer, l'agent la marque « saisie » avec son nom et la date, et la ligne reste visible « saisie, non confirmée » `[ASSUMPTION: confirmation par marquage de l'agent quand le LC ne renvoie rien]`.
- Une ligne qui reste dans la liste plus d'un jour ouvré (déclaration) ou plus de 72 heures (autre nature) lève une alerte au `RESP` (paramètres ; le second est transposé de la microfinance `[ASSUMPTION]`).
- La liste est la même que le LC reçoive ou non par la suite : elle sert aussi de preuve de ce qui a été demandé.
- Reporter un numéro déjà attribué à un autre dossier est refusé et va dans la file des écarts.

#### FR-200 : L'idempotence, le rejet motivé et la file des écarts sont des capacités du contrat

Chaque objet échangé porte une **clé d'origine**. Présenter deux fois le même objet ne le crée pas deux fois. Un envoi échoué est rejoué sans perte. Un objet refusé est **daté et motivé**. Tout écart détecté va dans une **file des écarts**. Prospera ne corrige jamais en silence.

**Conséquences (testables) :**
- Rejouer un lot déjà intégré ne change aucun dossier, aucune provision, aucun règlement affiché.
- Une coupure du lien ne perd aucun envoi : les envois attendent dans une file et partent dans l'ordre à la reprise.
- Un refus porte un **code** et un **motif en clair**, la date, l'objet et sa clé ; il est visible du rôle concerné (FR-196).
- Un doublon présenté par le LC (même clé d'origine) est reconnu et compté dans la file, pas appliqué.
- Une annulation arrive comme un fait inverse daté ; Prospera n'efface aucun fait envoyé ou reçu.
- Chaque ligne de la file porte : objet, clé d'origine, nature de l'écart, date, auteur de la résolution quand elle a lieu ; résoudre un écart ne l'efface pas : la ligne passe « résolue » avec l'auteur et le motif.
- La file est lisible par `RESP`, `GEST` concerné, `CPT` (écarts de règlement), `AUD`.

#### FR-201 : Chaque écran dit la fraîcheur, et Prospera continue quand le LC est coupé

Chaque écran qui montre une donnée du LC affiche la date et l'heure de la **dernière lecture** et le transport utilisé. Quand le LC est indisponible, Prospera continue de servir la dernière donnée connue, marquée **périmée**, et met en file ce qu'il doit envoyer.

**Conséquences (testables) :**
- Fraîcheur par défaut : au plus 5 minutes avec une API ; à l'heure ou de nuit (avant 6 h) avec des fichiers (paramètres).
- Une donnée plus vieille que le double de sa fraîcheur par défaut est signalée « périmée ».
- Un bandeau « LC indisponible depuis [heure] » apparaît sur les écrans des rôles concernés et se retire à la reprise.
- LC coupé : on peut déclarer (référence `DEC-`), joindre des pièces, instruire, évaluer, valider, payer ; les envois attendent la reprise ; l'ouverture d'un dossier sur une police lue depuis plus de l'âge maximal (24 heures par défaut `[ASSUMPTION: âge maximal de lecture pour l'ouverture, paramètre]`) exige la décision motivée de FR-187.
- Le numéro officiel d'un dossier déclaré pendant la coupure arrive à la reprise ; l'alerte de FR-198 ne compte pas les jours de coupure déclarée `[ASSUMPTION: horloge de l'alerte suspendue pendant une coupure déclarée]`.
- La date de dernière lecture est celle de la dernière réponse **valide** du LC, pas celle de la dernière tentative.

---

### 6.6 Le logiciel de compagnie fictif (`assureur-fictif`)

**Ce que ça veut dire.** Le LC réel n'est pas connu. Money Vibes livre un **logiciel de compagnie fictif**, qui parle le contrat d'échange (annexe C), **pour que la compagnie voie** comment Prospera vit à côté de son logiciel, sans y toucher. Il sert la démonstration (une compagnie fictive, ses polices, ses gestionnaires, D19) et la recette. Il n'est **jamais installé en production**. Le connecteur du vrai LC se fera quand ce logiciel sera connu, pas maintenant.

#### FR-202 : Le LC fictif tient ce que tient un vrai LC

Le LC fictif tient les assurés, les polices, les garanties, les produits, l'état de paiement des primes, les intermédiaires, les coassureurs et leurs clés, et des sinistres existants, pour une compagnie fictive. Il parle le contrat de l'annexe C **dans les deux sens**.

**Conséquences (testables) :**
- Chaque objet de l'annexe C marqué « LC → Prospera » est produit par le LC fictif avec ses champs minimaux.
- Chaque objet marqué « Prospera → LC » est accepté, refusé ou ignoré (doublon) par le LC fictif, avec un code de refus en clair.
- Le jeu porte les polices et les garanties des **7 produits de la démo**, en nombre suffisant pour les 3 500 dossiers du portefeuille de démonstration (environ 25 000 contrats d'après la démo `[ASSUMPTION: ordre de grandeur de la démo]`), tous statuts de police représentés (en vigueur, suspendue, résiliée, expirée), dont des primes impayées et des polices en coassurance.
- Les données sont fictives de bout en bout (noms, immatriculations, téléphones) ; un test vérifie qu'aucune ne provient d'une personne réelle.
- Le LC fictif peut produire un jeu de sinistres existants avec leurs documents, pour tester la reprise (§6.8).

#### FR-203 : Le LC fictif attribue les numéros de sinistre

Le LC fictif reçoit les déclarations de Prospera et **renvoie un numéro de sinistre officiel**, après un délai paramétré. Il applique le paramètre « qui attribue le numéro » : quand c'est Prospera qui attribue, il se contente d'enregistrer le numéro reçu.

**Conséquences (testables) :**
- Une déclaration envoyée reçoit un numéro officiel au plus tard après le délai simulé ; Prospera le rattache au dossier et l'affiche partout (FR-198).
- Le même `DEC-` présenté deux fois reçoit le même numéro : un doublon est reconnu, pas attribué deux fois.
- Les numéros attribués sont sans trou ni doublon et suivent un format propre au LC fictif, différent de celui de Prospera (pour montrer que Prospera n'impose pas le sien).
- Le LC fictif détecte un doublon probable (même police, même date de survenance, même immatriculation) et le signale dans sa réponse, sans le refuser `[ASSUMPTION: signal de doublon côté LC fictif, pour la démonstration du contrôle]`.

#### FR-204 : Le LC fictif sait tomber en panne et refuser

Le LC fictif offre l'API et les fichiers (FR-197) et sait **simuler** une coupure, un refus motivé, un doublon, un écart et un retard. Ces comportements se déclenchent par un réglage de l'espace d'essai.

**Conséquences (testables) :**
- Un réglage coupe le lien : Prospera affiche « LC indisponible » (FR-201), met ses envois en file et les rejoue à la reprise sans perte (FR-200).
- Un réglage fait refuser les envois d'un type donné (par exemple les règlements) avec un code et un motif en clair ; le refus remonte au `GEST` ou au `RESP` (FR-196).
- Un réglage met le LC fictif en mode « ne reçoit pas » : Prospera produit alors la liste « à saisir dans le logiciel de la compagnie » (FR-199).
- Un réglage fait retarder le numéro officiel au-delà de 1 jour ouvré pour déclencher l'alerte de FR-198.
- Un réglage fait changer une police après l'ouverture d'un dossier (suspension, résiliation) pour montrer l'écart de contrat dans la file (FR-200).
- Le même contrat est servi en API et en fichiers : la démonstration montre les deux, avec leurs deux fraîcheurs.

#### FR-205 : Il n'est jamais installé en production ; la démo se remet à zéro

Le LC fictif n'existe que dans l'espace d'essai et dans la démonstration. Une installation réelle ne le contient pas et refuse de l'activer. La démonstration se remet à zéro à la demande et se rejoue.

**Conséquences (testables) :**
- Le bilan d'installation d'un espace « réel » échoue si le LC fictif est présent ou activable.
- Chaque écran branché sur le LC fictif affiche « données fictives ».
- Aucun identifiant du LC fictif n'est accepté par un espace réel ; aucune donnée d'essai ne passe dans un espace réel.
- La remise à zéro recharge le jeu de démonstration (14 gestionnaires, environ 3 500 dossiers, polices et garanties des 7 produits, experts) et vide les dossiers créés pendant la démonstration.
- Les **quatre scénarios** (`SIN-2026-9001` à `9004`) sont rejouables sur le LC fictif, et le parcours de `SIN-2026-9002` se mène à la main, rôle après rôle, **de la déclaration à l'archive**, avec le numéro officiel du LC fictif.
- Aucune action de la démonstration n'envoie de message réel ; les sorties sont interceptées et comptées.

---

### 6.7 Pilotage, contrôle interne et veille (`dashboard` M28 pour l'affichage)

**Ce que ça veut dire.** La direction ne doit plus « ne pas voir ce qui se passe réellement ». Le tableau de bord montre où en sont les dossiers, ce qui bloque et pourquoi, qui est chargé, ce qui expire. Le module `dashboard` (M28) fournit l'affichage ; **les chiffres viennent des données de Prospera**, jamais d'une constante : la démo montrait beaucoup de chiffres tirés au hasard, ce PRD exige qu'ils se **recalculent** (FR-212). Le contrôle interne dispose d'un plan de contrôle exécuté sur les données. L'IA prépare un brief chaque matin et note la qualité des dossiers.

#### FR-206 : Le tableau de bord du responsable et de la direction : où en sont les dossiers

Le `RESP`, le `DT` et le `DG` ont un tableau de bord qui montre : les **dossiers ouverts par branche et par étape** (les 11 statuts), les **dossiers bloqués et pourquoi**, les **dossiers sans action depuis 30 jours**, par gestionnaire et par étape. Chaque nombre mène à la liste des dossiers qu'il compte.

**Conséquences (testables) :**
- Un dossier est « bloqué » quand une condition nommée l'empêche d'avancer (pièce attendue, expertise non rendue, validation attendue, garantie à décider, signal de fraude non écarté) ; le tableau de bord donne la cause, pas seulement le nombre.
- Un dossier est « sans action » quand son journal n'a aucune action d'agent depuis 30 jours (paramètre) ; l'alerte part au gestionnaire puis au `RESP`.
- Cliquer sur un nombre ouvre la liste des dossiers ; le nombre de la liste égale le nombre cliqué.
- Les vues par volet (corporel, matériel, risques divers) et pour le pôle recours sont disponibles ; le `GEST` voit son volet, le `GREC` ses recours.
- La vue de la direction regroupe : vue d'ensemble, exploitation, recours, technique et réglementaire.
- Les chiffres illustratifs de la proposition (214 ouverts, 23 bloqués…) ne sont pas des cibles : la valeur affichée est celle des données.

#### FR-207 : La charge, les pièces attendues, les règlements en attente, les délais qui expirent

Le tableau de bord montre aussi : la **charge et les montants par gestionnaire**, les **pièces attendues et les relances par canal**, les **règlements en attente et le valideur attendu**, les **délais qui expirent**.

**Conséquences (testables) :**
- La charge d'un gestionnaire est le nombre de dossiers en charge, la charge pondérée et les montants (évalué, validé, payé, reste à payer) ; la réaffectation en un clic est permise au `RESP`, avec motif (§5.3).
- Les pièces attendues sont comptées par canal de relance (appel, SMS, e-mail, WhatsApp) et par ancienneté ; une pièce bloquante attendue depuis plus de 30 jours est signalée (paramètre).
- Chaque règlement en attente nomme le **valideur attendu** (le niveau de délégation et le rôle) et l'ancienneté de l'attente ; les règlements à valider au-dessus du seuil du comité apparaissent dans une vue de signature.
- Les délais qui expirent regroupent les délais **légaux** du corporel (alertes réglementaires, non modifiables par la compagnie) et les délais **internes** ; chacun a son point de départ, son point d'arrêt et le jour restant (§5).
- Les honoraires d'expert à viser (FR-182) et les experts surchargés (FR-183) figurent sur la même vue.
- Chaque ligne indique l'âge de la donnée.

#### FR-208 : Le brief du matin et la veille (IA, usage n° 13)

Chaque matin, l'IA commune prépare un **brief** : dossiers à risque, **délais qui expirent**, **anomalies de la nuit**, activité de la veille (traités, clôtures, déclarations, règlements), anomalie dominante, suggestion. En continu, une **veille** signale les dossiers qui méritent attention. **Entrée** : les dossiers, le journal et les délais du périmètre du lecteur. **Sortie** : le brief et des alertes, chacune avec sa suggestion et sa source. **Destinataire** : `DG`, `RESP` ; chaque `GEST` reçoit le sien sur son périmètre. **Garde-fou** : lecture seule ; périmètre du rôle ; chaque alerte renvoie à ses dossiers ; l'IA ne contacte personne et ne modifie rien.

**Conséquences (testables) :**
- Le brief est disponible à une heure paramétrée (07:00 par défaut `[ASSUMPTION: 07:00, paramètre]`) et se relit dans la journée.
- Les familles d'alertes sont : délais, provision, pièces, règlement, recours, fraude, conformité.
- Règles de départ de la veille (valeurs de la démo, paramètres) : délai à moins de 2 jours sans action depuis au moins 5 jours (critique) ; provision inférieure de plus de 30 % à l'estimation de l'expert ; chèque non retiré depuis 14 jours ou plus ; mise en demeure sans réponse ; offre corporelle à présenter dans 45 jours ou moins avant son terme légal ; fraude bloquante non revue.
- Chaque ligne du brief renvoie au dossier concerné ; un chiffre du brief égale celui du tableau de bord au même instant.
- La mise au registre de l'IA se fait par brief (niveau `ANALYSE`) ; un lecteur peut marquer une alerte « sans objet » avec un motif, conservé.
- IA commune coupée : le brief est produit par des règles explicables (mêmes familles d'alertes) et l'écran le dit.

#### FR-209 : La note de qualité du dossier et la simulation « et si… » (IA, usage n° 14)

L'IA commune note la **qualité d'un dossier** (cohérence, complétude, respect des délais et des règles) et permet à la direction de **simuler** l'effet d'une décision. **Entrée** : le dossier ; pour la simulation, des hypothèses saisies. **Sortie** : un score et ses constats ; un résultat chiffré de simulation. **Destinataire** : `GEST` et `RESP` pour la note ; `DG`, `DT`, `RESP`, `AUD` pour la simulation. **Garde-fou** : lecture seule ; aucun dossier n'est modifié ; chaque constat porte sa source ; la distinction **certain** (règle) et **probable** (à vérifier) est affichée.

**Conséquences (testables) :**
- Les constats **certains** viennent de règles : police hors période ou non en vigueur, garantie absente, déclaration antérieure au sinistre, déclaration de plus de 30 jours, pièces obligatoires absentes, alerte bloquante d'instruction, provision inférieure de plus de 30 % à l'estimation ou supérieure à 150 % avant expertise, montant au-dessus du seuil de délégation, hors délai.
- Les constats **probables** viennent de l'analyse : incohérence de pièces, devis anormal, liens avec d'autres dossiers, gravité grave sans dommage corporel ; ils portent la mention « à vérifier ».
- Chaque constat a un niveau (critique, alerte, information) et une source cliquable.
- La simulation prend : la part de dossiers corporels concernée, une hausse du coût corporel, une hausse du coût de réparation, une hausse du recouvrement ; elle rend : la charge avant et après, l'impact corporel et réparation, le gain de recours, la charge nette, le nombre de dossiers qui franchiraient le seuil de délégation, la répartition par volet.
- Une simulation est étiquetée « simulation » sur chaque écran et chaque export ; aucun de ses chiffres ne se retrouve dans un indicateur ni dans un état.
- Une simulation n'affiche aucun montant d'indemnité proposé sur un préjudice corporel individuel (D13).
- La note de qualité n'est jamais un critère de décision automatique : elle ne bloque aucune transition.

#### FR-210 : Le contrôle interne : le plan de contrôle exécuté sur les données

Le contrôle interne (`AUD`) dispose d'un **plan de contrôle** exécuté sur les données, qui qualifie chaque écart : `CONFORME`, `ALERTE`, `VIOLATION`. Il complète les blocages du circuit : le circuit empêche, le contrôle vérifie après coup.

**Conséquences (testables) :**
- **Séparation des fonctions** : `SEP-01` l'instructeur ne valide jamais son propre dossier ; `SEP-02` celui qui décide ne paie pas ; `SEP-03` le cumul des montants validés d'un même dossier décide du niveau de validation (anti-fractionnement) ; chaque violation donne un constat daté avec sa référence.
- **Fractionnement** : plusieurs règlements d'un même dossier ou bénéficiaire, juste sous un seuil de délégation, sont signalés.
- **Échantillon de revue** : un échantillon de 12 dossiers par période (paramètre) est tiré au sort par le système ; le `GEST` concerné ne peut pas le modifier.
- **Dossiers sensibles** : un dossier est sensible quand l'écart entre l'évaluation et la provision atteint 500 000 FCFA et 1,5 fois, ou quand son amplitude dépasse 25 % ou 1 000 000 FCFA ; un registre de surveillance les liste avec les actes sensibles associés.
- **Silences** : un dossier sans action depuis 8, 15, 30 jours est « à surveiller », « à relancer », « muet ».
- **Agents sans trace** : un agent sans aucune trace depuis 10 jours ouvrés est signalé.
- **Décaissements** : concentration de plus de 60 % du volume d'émission sur une seule main, coordonnées bancaires modifiées dans les 5 jours avant le règlement, doublon de règlement sur 30 jours (règles du §5.8 contrôlées ici).
- Le plan est organisé en familles : séparation, décaissement, traçabilité, dossier ; chaque test a sa population, sa tolérance, sa gravité (critique ou majeure) ; un écart est **qualifié** puis **justifié ou corrigé**, avec l'auteur.
- `AUD` lit le journal de tout (FR-158) et lit les règlements ; `AUD` ne modifie aucun dossier.
- Les seuils sont des paramètres (annexe D).

#### FR-211 : Un dossier prêt pour un contrôle de la CRCA, sans reconstitution

La CRCA peut contrôler sur pièces et sur place, et exiger les documents et le personnel qualifié pour répondre (art. 310 du Code CIMA, texte lu). Prospera permet de produire, **sans reconstitution**, le dossier complet de chaque sinistre demandé : la fiche, les pièces, les décisions et leurs motifs, les délégations, l'historique de la provision, les preuves de délai, le journal complet.

**Conséquences (testables) :**
- À partir d'un numéro de sinistre ou d'un lot (exercice, branche, période), `AUD` ou `DT` obtient un **dossier de contrôle** en un seul export (document et tableur), avec l'horodatage et l'auteur de la demande.
- Le dossier de contrôle contient : la fiche (FR-152), la liste des pièces avec leur version, leur empreinte et leur cote papier, les décisions avec auteur et motif, la délégation appliquée, les mouvements de provision, les règlements et leurs quittances, le journal (FR-158), le numéro d'archivage, les sorties d'archive.
- Un contrôle de **complétude** s'exécute avant l'export : il liste ce qui manque (pièce attendue absente, décision sans motif, quittance non signée, empreinte en échec) pour que la compagnie le voie avant la CRCA.
- Un lot de 100 dossiers est produit en moins de 30 minutes `[ASSUMPTION: cible de temps, paramètre]`.
- Le journal produit est celui du serveur : sans insertion ni suppression ultérieure ; le Code CIMA demande, pour la comptabilité informatisée, des états datés, l'impossibilité d'insertions ou suppressions ultérieures et un droit d'accès du contrôleur (art. 406 et 407, texte lu) ; **l'application de ces articles à un dossier de sinistre est à confirmer par le juriste (D21)**.
- La CRCA n'a pas de compte dans Prospera : la compagnie lui remet l'export `[ASSUMPTION: pas de compte pour la CRCA]`.
- Les chemises papier sorties pour un contrôle de la CRCA suivent FR-171.

#### FR-212 : Tout indicateur se recalcule depuis les données

Aucun chiffre de pilotage n'est une constante, un tirage ou une saisie. Chaque indicateur a une **définition écrite** (ce qu'il compte, point de départ, point d'arrêt, périmètre) et se **recalcule depuis les données** du dossier, du journal et des contrats lus.

**Conséquences (testables) :**
- Modifier un dossier de test (montant, étape, date) change l'indicateur qui l'utilise, sans autre geste ; un test le vérifie pour chaque indicateur de FR-206, FR-207 et FR-213.
- Le même indicateur affiche le même chiffre sur tous les écrans, au même instant (une seule source).
- Chaque indicateur affiche l'heure du calcul ; l'actualisation est d'au plus 5 minutes `[ASSUMPTION: 5 minutes, paramètre]`.
- Chaque indicateur est décomposable : un nombre mène à la liste des dossiers, un montant à la liste des lignes.
- Les délais se calculent depuis les horodatages du journal ; une étape sans horodatage n'entre pas dans une moyenne et est comptée à part.
- Les chiffres d'une simulation (FR-209) ne rentrent dans aucun indicateur.
- Un indicateur dont la source est le LC affiche la date de dernière lecture (FR-201).

#### FR-213 : Les indicateurs de délai et de qualité du circuit

Le pilotage fournit les indicateurs que le service attend, tous calculés depuis les horodatages (FR-212).

**Conséquences (testables) :**
- Délais moyens : déclaration à ouverture, ouverture à évaluation, évaluation à règlement ; **taux de dossiers dans le délai cible**, par volet.
- Ancienneté du stock actif (aging), par tranche : 7 jours ou moins, 8 à 30, 31 à 90, plus de 90.
- Taux de numérisation du fonds, temps moyen entre réception d'une pièce et contrôle (FR-165), pièces à rattacher (FR-166).
- Écarts de règlement ouverts, chèques à remettre et ancienneté, règlements en attente de valideur.
- Part d'accusés de réception envoyés dans le délai et d'offres envoyées dans le délai interne (§5.7) : ce sont les défauts relevés par l'audit de la procédure d'indemnisation d'une compagnie du même groupe au Sénégal (mémoire de 2014) ; ils sont mesurés ici pour être traités `[ASSUMPTION: transposition à confirmer pour le Togo]`.
- Chaque délai cible est un paramètre par volet ; la valeur de la démo (SLA par volet) est reprise comme défaut interne (§5).
- Les indicateurs s'exportent en tableur.

---

### 6.8 La reprise des archives et la vie en parallèle (`reprise`, M44)

**Ce que ça veut dire.** La compagnie a déjà des assurés, des polices, des sinistres ouverts et des archives. Le module `reprise` (M44, PRD Reprise de données) les fait entrer dans Prospera, **sans ressaisie**, et il fait vivre ensemble l'ancien et le nouveau pendant la période où les deux systèmes coexistent. La mécanique générale (lot par étapes, simulation, rapport, validation par le DG, réconciliation, feu vert par module cible, répétition générale) est celle du PRD Reprise ; cette section dit **ce que l'assurance exige de lui**. **La reprise est le premier risque du projet** (FR-219).

La source de la reprise n'est pas connue : le PRD ne spécule pas dessus (récit du PO, §1). Le PO a retenu **l'API ou un fichier Excel ou JSON**. Le scan du stock papier n'est **pas** une voie de reprise (D17).

#### FR-214 : La reprise lit une API ou un fichier Excel ou JSON, et traduit sans trahir

La reprise lit les données de la compagnie par **API**, ou par **fichier Excel ou JSON** déposé chez la compagnie ; elle les traduit vers le format commun de Prospera. Elle reprend : les **métadonnées** (assuré, police, sinistre, date, type de pièce), les **fichiers** des pièces, et, pour chaque objet, sa trace d'origine. Pour les contrats, la reprise **amorce** la projection du LC (§6.4).

**Conséquences (testables) :**
- Au premier jour, **les deux voies** existent (décision du PO) : les **fichiers** (Excel, JSON ; CSV accepté) sans condition, et l'**API** du LC, dont l'adaptateur est écrit dès que le LC est connu (janvier) et livré avant la mise en service. Si le LC n'expose pas d'API, les fichiers suffisent et rien ne bloque `[ASSUMPTION: le PRD Reprise (FR-1, spine AD-23) ne requiert que les fichiers en février ; un amendement est demandé pour l'adaptateur API de l'assurance (§12.2)]`.
- Chaque objet repris garde sa **source**, son **lot**, sa **ligne ou son identifiant d'origine** ; depuis un dossier repris, on retrouve la ligne de la source dont il vient (PRD Reprise FR-2).
- Chaque état de la source est **traduit** vers un état valide du circuit ; un objet qui ne satisfait pas les conditions de l'état traduit est **requalifié** (un sinistre « ouvert » sans pièces devient « pièces attendues ») et le rapport le liste (PRD Reprise FR-5).
- Les **dates d'origine** sont reprises : déclaration, survenance, expertise, décision, règlement ; un délai calculé sur un dossier repris est identique à celui de la source (PRD Reprise FR-6) ; un dossier est jugé selon le référentiel en vigueur à sa **date de survenance** (D7).
- Un **montant requis absent** de la source (le montant validé d'un sinistre) n'est **jamais** remplacé par zéro : le dossier est marqué « montant à saisir » et le gestionnaire le saisit avec un motif (PRD Reprise FR-7).
- Les **données vivantes** (assurés, polices en vigueur, sinistres ouverts avec leur état, leurs montants chiffrés, leurs réserves, leurs pièces reçues, l'expert désigné) obéissent à la règle d'**écart nul** ; l'**historique** (sinistres clos, polices résiliées ou échues liées) entre **protégé** : ses écarts figurent au rapport sans bloquer la mise en service (PRD Reprise FR-8 et FR-9).
- La reprise **n'écrit jamais** dans un module : elle livre par son point d'import, dans l'ordre des dépendances : polices avant sinistres, sinistres avant pièces (PRD Reprise FR-14).
- Les fichiers déposés restent **chez la compagnie** et sont supprimés après la réception définitive (ceux d'un import courant, 30 jours après l'import réussi), avec une trace (PRD Reprise FR-3).
- Les valeurs de la source qui ne correspondent à rien dans Prospera (type de sinistre, code d'agent, garantie) sont des **écarts**, jamais des inventions ; les tables de correspondance sont créées avec la compagnie et rejouées telles quelles à la mise en service.

#### FR-215 : Les dossiers en cours d'abord, le numéro d'archivage conservé, le papier tenu

L'ordre de reprise est : **les dossiers en cours d'abord**, l'**historique ensuite** (en arrière-plan, lot après lot, si le volume l'exige). Le **numéro d'archivage** de la source est **conservé** ; à défaut, Prospera en attribue un. Chaque dossier repris reçoit son **rattachement** (assuré, police, sinistre). Le **papier reste tenu** : chaque dossier porte sa **cote physique** et son état papier.

**Conséquences (testables) :**
- Un dossier en cours est retrouvable en moins de 5 secondes (FR-150) **avant** que l'historique soit repris ; la mise en service n'attend pas l'historique.
- Un numéro d'archivage repris garde son **format d'origine** ; il est cherchable (FR-150) ; un numéro de la source en doublon est refusé avec le motif, jamais écrasé ; les séquences de Prospera sautent les numéros repris (FR-167).
- La reprise **fournit** à la GED les clés de rattachement (numéro de police, numéro de sinistre) ; la GED les consomme ; un document dont la clé est illisible ou inconnue va dans la file « à rattacher » (FR-166) et ne bloque pas la mise en service.
- Le papier historique n'est pas numérisé pour la reprise : sa **cote** (local, travée, tablette, boîte, rang) et sa chemise sont reprises ; il se numérise s'il est rouvert ou consulté (FR-172).
- L'historique repris porte un marqueur « historique » : il ne se modifie pas depuis l'application ; il se consulte, se cherche et s'archive.
- Un historique de moins de 3 ans est signalé au rapport (« l'IA démarrera avec moins de recul ») sans bloquer ; **aucune borne haute** ne limite l'historique repris (PRD Reprise FR-9 ; objectif de 3 à 5 ans pour l'IA `[ASSUMPTION: 3 à 5 ans de la proposition v2]`).
- Les nouvelles pièces **postérieures** à la reprise sont scannées ou téléversées au guichet ou par `NUM`, avec le contrôle de FR-165.

#### FR-216 : Le rapport de reprise, validé avant que rien n'entre

Pour chaque lot, un **rapport de reprise** dit ce qui est **récupéré**, ce qui est **rejeté avec sa raison**, et les **écarts**. Rien n'entre dans Prospera tant que la liste finale n'a pas été validée par la compagnie.

**Conséquences (testables) :**
- Le rapport donne, par module cible (`sinistres`, `ged`, `assurance`) : nombre repris, manquants, écarts par type, requalifications, montants à saisir ; chaque écart pointe vers les lignes de la source.
- Chaque écart a une **gravité fixée par le produit** : **erreur** (l'objet n'entre pas), **avertissement** (il entre, signalé), **information** ; le client ne la change pas.
- Les lignes en erreur se téléchargent dans un fichier pour corriger la source et livrer de nouveau ; on n'écarte pas une ligne à la main (PRD Reprise FR-11).
- La validation avant import est faite par le **DG** ou une personne qu'il désigne par écrit ; elle enregistre qui, quand, et la version exacte du rapport validé ; toute modification exige une nouvelle validation (PRD Reprise FR-13).
- Les doublons probables (même identifiant, même téléphone, même nom et date de naissance, même police et même date de survenance) sont présentés regroupés ; la fusion reste sous contrôle humain et est tracée (PRD Reprise FR-12).
- Le rapport se télécharge en PDF et se conserve ; il est un livrable.
- Aucun rapport ni validation de l'espace d'essai ne passe dans le réel : le lot du réel a son propre rapport.

#### FR-217 : La resynchronisation nocturne, et le dossier qui change des deux côtés

Pendant la période où les deux systèmes vivent ensemble, la reprise **resynchronise** chaque nuit (paramètre) ce que la source a fait depuis la dernière fois. La resynchronisation est **idempotente**. Un dossier est **suivi** depuis la source tant que personne ne l'a pris en main dans Prospera ; il devient **tenu par Prospera** à sa première action de dossier.

**Conséquences (testables) :**
- Rejouer la même resynchronisation ne crée ni doublon ni changement (clé d'origine et empreinte de ligne) ; une ligne supprimée côté source est marquée « retirée de la source », jamais supprimée de Prospera.
- Un dossier **suivi** est mis à jour chaque nuit depuis la source, sans écraser aucun champ saisi dans Prospera ; l'écran dit « suivi depuis le système de la compagnie ».
- À la **première action** d'un agent sur un dossier dans Prospera (prise en main), le dossier est **tenu par Prospera** pour tous les champs du dossier : instruction, pièces, expertise, évaluation, provision, décision, règlement, journal ; les contrats et le numéro de sinistre restent ceux du LC `[ASSUMPTION: bascule par dossier à la première action ; à confirmer à la séance d'immersion]`.
- Si la source change, après la prise en main, un champ du dossier tenu par Prospera, le changement **n'est pas appliqué** : il va dans la file des écarts (FR-200) avec les deux valeurs ; le `GEST` le reporte à la main avec motif, ou le rejette avec motif.
- Si la source change un **contrat** (police, garantie, prime) d'un dossier tenu par Prospera, le LC l'emporte : la projection est mise à jour, le gestionnaire est averti, et la recevabilité est ré-affichée avec la nouvelle donnée ; la décision déjà prise n'est pas modifiée toute seule.
- Un dossier modifié des deux côtés **sur le même champ** garde la valeur de Prospera ; l'écart montre les deux valeurs et sa résolution (qui, quand, motif) est tracée.
- La resynchronisation nocturne produit un **rapport d'écarts de la période** ; la date de fin du parallèle est fixée par la compagnie à la mise en service `[ASSUMPTION: date de fin fixée à la mise en service ; la nuit continue tant qu'aucune date n'est posée]`.
- L'heure de la resynchronisation est un paramètre (avant 6 h par défaut `[ASSUMPTION]`) ; une nuit non couverte est signalée « non couverte » dans le rapport.

#### FR-218 : Le feu vert de la reprise, module par module

Le **feu vert** de la reprise est donné **par module cible**. Tant qu'un écart reste ouvert sur les données vivantes d'un module, la reprise ne donne **pas** son feu vert, et la mise en service du module est refusée.

**Conséquences (testables) :**
- Le feu vert de `sinistres`, de `ged` et de `assurance` est rattaché aux **lots rejoués dans l'espace réel**, jamais à un lot de l'essai.
- Un écart ouvert, c'est : un objet vivant resté en erreur, un objet en trop, ou une valeur de contrôle différente ; les valeurs de contrôle de départ sont : nombre de sinistres ouverts, somme des provisions des sinistres ouverts, nombre de polices en vigueur, nombre de pièces rattachées `[ASSUMPTION: valeurs de contrôle de départ, à fixer avec la compagnie]`.
- Les écarts de l'**historique** figurent au rapport et ne bloquent jamais le feu vert.
- Un feu vert se **retire** avant la mise en service par une action journalisée d'un détenteur du droit de valider, avec un motif ; le module repasse à « attendu ».
- Un lot se joue d'abord dans l'**espace d'essai** (répétition générale) ; le jour de la mise en service, le dossier d'installation (adaptateurs réglés, tables de correspondance, règles de traduction) est **rejoué** sur une source **fraîche**, et le lot est rejoué sans créer de doublon.
- La ligne de chaque module au bilan de mise en service ne passe au vert qu'à son feu vert (PRD moteur d'installation, §7).
- Le LC fictif sert à répéter la reprise dans l'espace d'essai (FR-202).

#### FR-219 : Ce que la compagnie doit fournir, et le premier risque

La reprise ne peut commencer que si la compagnie fournit certains éléments. **Si la reprise est en retard, incomplète ou mal rattachée, la promesse « retrouver un dossier en moins de 5 secondes » et « répondre pendant l'appel » ne tient pas le premier jour**, quelle que soit la qualité du reste : c'est le premier risque du projet `[ASSUMPTION: premier risque désigné par l'équipe de rédaction ; à reporter au §12 et à confirmer à la séance d'immersion]`.

La compagnie fournit, dans l'ordre du PO :
1. le **manuel de procédures sinistres** ;
2. les **délégations et seuils de validation** ;
3. le **nom et l'API du logiciel métier actuel et du futur logiciel** ;
4. la **liste des experts agréés** ;
5. les **barèmes et les grilles de vétusté** ;
6. les **modèles de courriers et de quittances** ;
7. les **volumes** : dossiers par an, stock en cours, archives ;
8. le **compte rendu de l'atelier** avec le service sinistres.

Pour la reprise elle-même : l'**export** des assurés, des polices et des sinistres ouverts (Excel, CSV ou JSON), les **documents** avec leurs **métadonnées**, la **règle de numérotation actuelle** des sinistres et des archives, un **interlocuteur technique** (DSI ou éditeur), et des **accès de test** si une API existe.

**Conséquences (testables) :**
- Le bilan de préparation de la reprise liste ces éléments avec leur état (reçu, à recevoir, sans objet) et leur date ; le `DG` et `ADMIN` le lisent `[ASSUMPTION: le bilan s'appuie sur le bilan du moteur d'installation ; à confirmer avec le PRD §7]`.
- Un élément absent à la date fixée à la séance d'immersion est signalé comme **décalant le premier jour** ; le PRD ne fixe pas de remplacement : sans les délégations, les défauts de D8 s'appliquent et sont marqués « non confirmés » ; sans les barèmes, la provision d'ouverture et le décompte ne sont pas utilisables en production.
- Sans la liste des experts agréés, la désignation d'un cabinet est impossible (FR-178) ; le panel interne de la démonstration n'est jamais utilisé en réel.
- Chaque élément reçu est daté et rattaché au dossier d'installation ; il ne contient aucune donnée personnelle sans nécessité.
- Un test de la **répétition générale** (FR-218) est exécuté sur les éléments réellement reçus ; son résultat est lu au comité de pilotage `[ASSUMPTION: comité de pilotage, proposé par la proposition v2]`.

---

## 7. Partie 4 — Les modules partagés et cadrés

**Règles de lecture.** Ces modules ont déjà leur PRD, leur spine et leur manifeste, ou sont cadrés par le PRD distributeur et le PRD microfinance ; ce PRD n'en réécrit rien. Chaque fiche dit ce qui s'applique tel quel, puis les **écarts de l'assurance**, chacun devenu une exigence. Un écart est **à porter au PRD du module** : son propriétaire l'amende ou le refuse ; tant que ce n'est pas fait, l'exigence tient ici et se code dans le module qui la porte, jamais à sa place. Les identifiants `FR-Pnn`, `FR-Nnn`, `FR-Rnn` renvoient au PRD du module ; `PRD-D FR-n` au PRD distributeur ; `PRD moteur FR-n` au PRD du moteur d'installation ; `Reprise FR-n` et `Connecteurs FR-n` aux PRD Reprise et Connecteurs.

| Module | Code | Réf. M | PRD | Manifeste |
|---|---|---|---|---|
| Encaissements et moyens de paiement | `paiement` | M33 | `prd-paiement-service-2026-08-02` + amendement 2026-09-21 | `manifestes/paiement.manifest.ts` |
| Canaux et notifications | `notification` | M34 | `prd-notification-service-2026-08-02` | `manifestes/notification.manifest.ts` |
| Tableau de bord et pilotage | `dashboard` | M28 | PRD-D §6.8 ; spécifié pour l'assurance au §6.7 | `manifestes/dashboard.manifest.ts` |
| IA commune | — | — | `prd-assistant-ia-2026-08-02`, note de vision `vision-ia-sectorielle-2026-11-10`, PRD moteur FR-24 à FR-31 | — |
| Installation chez le client | moteur d'installation | — | `prd-moteur-installation-2026-11-09` | — |
| Réseau, sites et guichets | `reseau` | M01 | `prd-reseau-zones-2026-08-02` | `manifestes/reseau.manifest.ts` |
| Connecteurs | `connecteurs` | M43 | `prd-connecteurs-2026-11-10` | `manifestes/connecteurs.manifest.ts` |

`pdv`, `catalogue` et `stock` ne concernent pas l'assurance. La reprise des archives est le module `reprise` (M44), cadré au §6.

### 7.1 `paiement` : exécuter les règlements

#### FR-220 : Paiement : `sinistres` ordonne, `paiement` exécute

**Ce qui s'applique tel quel.** Deux fournisseurs, PI-SPI et FedaPay, derrière un même contrat, routés par pays, devise et méthode (FR-P08, FR-P09, FR-P12 ; PRD-D FR-205) ; le paiement sortant : un ordre est préparé, validé par une **autre** personne, part une fois, depuis le compte de l'organisation sous ses identifiants (FR-P65 à FR-P69, NFR-1d) ; l'idempotence et le même `txId` rejoué (FR-P19 à FR-P22) ; l'essai : paiements de test seulement (PRD-D FR-24). « Mobile Money » s'affiche « paiement mobile » ou le mode précis (PRD-D FR-206).

**Écarts de l'assurance, à porter au PRD `paiement`.** Réalise UJ-3 et UJ-4.

**Conséquences (testables) :**
- **`sinistres` émet l'ordre de règlement** après décision et accord enregistré ; **`paiement` l'exécute** (virement, PI-SPI, paiement mobile) ou **l'enregistre** (chèque). Aucun ordre ne part sans accord enregistré de l'assuré (§5).
- Un dossier peut avoir **plusieurs règlements** (acompte, offre provisionnelle, plusieurs bénéficiaires, honoraires d'expert). Chaque règlement a **son état** (`A_PAYER`, `EN_COURS`, `PARTIEL`, `PAYE`, `ECHEC`) et **sa quittance** (`PRETE`, `EDITEE`, `SIGNEE`, `REMISE`, `ENCAISSEE`).
- Le dossier passe à `REGLE` quand le **reste à payer** de l'indemnité validée est **zéro** (§3).
- Un ordre ne part que par **un seul** moyen : un test envoie deux fois le même ordre et vérifie que l'argent ne part qu'une fois. Un ordre dont l'issue est **inconnue** passe à l'état `INCONNU` ; il est **rapproché du relevé du fournisseur avant toute réémission**, avec sa clé d'idempotence d'origine (un ordre déjà parti n'est jamais réémis par erreur).
- Le droit de **décider** d'un règlement et le droit de **l'exécuter** sont **distincts** : le comptable n'a aucun droit de décision (FR-7).
- Les **honoraires d'expert** sont un règlement comme un autre : visés par RESP ou CPT, jamais pour un expert interne (aucun honoraire à engager).
- En espace d'essai, aucun ordre réel ne part ; les paiements sont marqués « test » (PRD-D FR-24).

#### FR-221 : Le chèque est enregistré, pas exécuté

Le **chèque** est le moyen de règlement du premier jour dans la proposition v2 (« de la déclaration au chèque »). **CPT saisit** la banque, le numéro et le montant ; sans numéro, l'émission est refusée. Prospera **imprime la lettre-chèque** sur un gabarit si la compagnie l'utilise ; sinon le chèque est rempli à la main et son **numéro saisi** `[ASSUMPTION: la compagnie a ou non un gabarit bancaire d'impression ; à confirmer]`. `CHEQUE_A_REMETTRE` ne vaut que pour le chèque. La **remise** se fait au guichet contre la **quittance signée** et l'**identité du retirant** (nom et numéro de pièce d'identité), tous deux obligatoires. Réalise UJ-3.

**Conséquences (testables) :**
- Un test tente d'émettre sans numéro de chèque : refus « Indiquez le numéro du chèque émis ». Un test tente la remise sans identité ou sans numéro de pièce d'identité : refus, avec le champ nommé.
- **Au corporel**, le chèque est libellé **exclusivement au nom de la victime ou des ayants droit**, même en présence d'un conseil (Code CIMA art. 232) ; un libellé à un tiers (garage, conseil) est **bloqué** sans mandat enregistré.
- Un règlement à un **mineur ou à un incapable** exige la procédure de l'art. 234 (avis préalable au juge des tutelles ou au conseil de famille) avant paiement ; l'émission est bloquée tant qu'elle n'est pas tracée (§5).
- Un chèque non retiré **depuis plus de 7 jours** est relancé (liste d'appels du matin) ; **depuis plus de 30 jours**, il est signalé comme exposition ; une circulation de chèque de plus de 21 jours est signalée (valeurs de la démo, annexe D ; calibrées selon FR-5).
- L'état **mensuel** des chèques émis, remis et en attente est produit pour la comptabilité, avec détection des écarts **avant** clôture (FR-224).
- Le **numéro** de chèque et sa **banque** ne sont jamais posés d'office : un test vérifie qu'ils viennent d'une saisie de CPT.

#### FR-222 : Virement bancaire et PI-SPI

Le **virement bancaire** et le règlement par **PI-SPI** sont exécutés par `paiement`. L'ordre est préparé par CPT après la décision, validé par **une autre** personne, et part une seule fois. `ORDRE_EMIS` passe à `REGLE` à la **confirmation de `paiement`** ; la **quittance est signée avant**, au guichet ou par acceptation électronique avec code à usage unique `[ASSUMPTION: l'acceptation électronique n'est offerte qu'après validation juridique, FR-24 ; sinon la quittance se signe au guichet]`. Les **banques** sont jointes par PI-SPI : le bénéficiaire d'un virement vers une autre banque est une adresse du schéma ; un virement vers un compte que le schéma ne joint pas est préparé par `paiement` et **exécuté par la comptabilité de la compagnie** auprès de sa banque, sa confirmation étant saisie `[ASSUMPTION: la compagnie n'a pas de cœur bancaire ; à revérifier à l'adhésion à PI-SPI]`. Réalise UJ-3.

**Conséquences (testables) :**
- Une **modification des coordonnées bancaires** du bénéficiaire dans les 5 jours qui précèdent un paiement est une **alerte** au responsable et bloque l'ordre jusqu'à sa vérification (valeur de la démo, annexe D) ; celui qui a modifié les coordonnées n'émet pas l'ordre (FR-7).
- Un virement suit le **délai de coupure** de la banque (paramètre).
- Un virement n'est jamais payé deux fois : le contrôle de doublon porte sur le bénéficiaire, le montant et le dossier, sur 30 jours (valeur de la démo, annexe D).
- Le statut juridique d'une initiation de paiement par une compagnie d'assurance est **à faire confirmer par un juriste** (FR-24).

#### FR-223 : Mobile Money sortant : T-Money et Flooz

Les règlements par **Mobile Money** (T-Money, Flooz ; opérateurs paramétrables par pays) sont exécutés par `paiement`, avec les mêmes règles que le virement (FR-222). `paiement` **n'a pas encore d'adaptateur Mobile Money sortant** : cet adaptateur est **à chiffrer au plan**, comme pour l'IMF. Réalise UJ-3.

**Conséquences (testables) :**
- **Février.** Tant qu'un opérateur n'a pas d'adaptateur sortant, son canal est **« bientôt »** pour ce pays, le dossier propose un autre moyen (chèque, virement), et **rien n'est simulé** (FR-22). Dans l'essai, un paiement mobile est **de test**, marqué « test » (PRD-D FR-24).
- Le Mobile Money est un moyen à **vérification renforcée** : le numéro et l'identité du porteur sont saisis et rapprochés du bénéficiaire du dossier `[ASSUMPTION: le Règlement CIMA sur la LBC/FT ne cite pas le Mobile Money ; traitement par analogie aux moyens à vérification minutieuse, à valider par le juriste]`.
- Un règlement Mobile Money au corporel est libellé au nom de la victime ou des ayants droit (art. 232) ; un numéro dont le porteur n'est pas le bénéficiaire est bloqué.
- Le statut juridique du règlement par Mobile Money par une compagnie d'assurance est **à faire confirmer par un juriste** (FR-24).

#### FR-224 : Rapprochement des règlements

Le **rapprochement** des chèques, des virements et des paiements mobiles se fait dans `paiement`, par CPT, **pas par la comptabilité officielle** (qui est hors de Prospera, FR-2). Les paiements **non rapprochés** forment une file ; un écart de rapprochement ancien de **60 jours** est une alerte (valeur de la démo, annexe D). Le rapprochement fournit l'**état mensuel consolidé** (chèques émis, remis, en attente ; paiements mobiles ; détection des écarts avant clôture) et son export au format de la comptabilité de la compagnie. Réalise UJ-7.

**Conséquences (testables) :**
- Chaque règlement émis finit **rapproché ou en écart** : un test émet un lot de règlements, en rapproche une partie et vérifie que le reste est dans la file, avec son âge.
- Un écart de plus de 60 jours lève une alerte à CPT et à RESP (§6.7).
- Le **doublon** de règlement (même bénéficiaire, même montant, même dossier) sur 30 jours est détecté avant émission ; **une concentration d'émission** sur une seule personne au-delà d'une part du volume (défaut : 60 %, valeur de la démo) est signalée à AUD.
- Celui qui rapproche n'est pas celui qui a émis le règlement (FR-7).
- L'état mensuel et l'export sont produits sans ressaisie (FR-2) ; leur format suit le contrat d'échange (annexe C).

#### FR-225 : Plafond d'espèces et LBC/FT

Un règlement en **espèces** est plafonné à **500 000 FCFA** (paramètre) ; au-delà, le règlement passe par un moyen traçable. La **lutte contre le blanchiment et le financement du terrorisme** s'applique aux règlements de sinistres. Le Règlement CIMA n° 0004/CIMA/PCMA/PCE/SG/08, lu et sûr, demande que le système permette de suivre les **règlements de sinistres** par date, montant, origine, destination et cumul par client, de recenser les clients qui dépassent le minimum cumulé fixé par la réglementation, et de **détecter les opérations suspectes** (art. 4.5) ; il impose une **vérification minutieuse de l'identité** pour les espèces, les virements et les chèques (art. 11) et la **conservation dix ans au moins** de l'identité, de la forme du versement ou du retrait, des dates et montants, de l'origine et de la destination des fonds et de la piste d'audit (art. 13). Réalise UJ-3 et UJ-7.

**Conséquences (testables) :**
- Le journal des **règlements de sinistres** donne, par bénéficiaire réel (avec sa pièce d'identité archivée), le moyen de paiement, l'origine, la destination et le **cumul par client** ; il s'exporte pour le responsable LBC/FT.
- Un test émet un règlement en espèces au-dessus du plafond : refusé avec un code nommé.
- **Alertes** : bénéficiaire différent de la victime, espèces élevées, fractionnement de règlements pour passer sous un seuil, ayant droit douteux, changement de coordonnées avant paiement. Chacune ouvre un dossier de contrôle.
- Le **seuil cumulé** de la réglementation nationale est un paramètre **à saisir** quand le texte national aura été obtenu (annexe D) ; il n'est pas écrit en dur `[ASSUMPTION: la valeur nationale n'est pas trouvée ; le paramètre est vide par défaut et l'alerte de cumul est inactive tant qu'il l'est]`.
- Un **dossier de soupçon** (alerte interne, responsable LBC, déclaration à la cellule nationale de renseignements financiers) est **préparé et tracé** par Prospera avec horodatage ; **la déclaration est faite par le responsable interne**, pas par Prospera ; la conservation est de dix ans. La règle de non-information du client est **à confirmer par le juriste** (FR-24).
- Le **plafond d'espèces national** des assureurs n'a pas été trouvé : 500 000 FCFA est la valeur de la démo `[ASSUMPTION: à confirmer par le juriste]`.

### 7.2 `notification` : prévenir l'assuré

#### FR-226 : Notification : SMS, WhatsApp, e-mail et cloche, servis par le relais

**Ce qui s'applique tel quel.** Canaux e-mail, SMS, WhatsApp, in-app, repli « WhatsApp, sinon SMS » (FR-N17, FR-N18, FR-N21 ; PRD-D FR-249) ; modèles versionnés et approuvés par canal (FR-N09 à FR-N16) ; envoi de masse avec échantillon, reprise, plafond (FR-N28 à FR-N34) ; réponses entrantes routées par contexte vers le module qui a parlé (FR-N41 à FR-N45) ; consentement et désabonnement par personne, canal et nature (FR-N46 à FR-N50) ; journal et accusés (le « lu » n'existe pas pour un SMS) ; en essai, l'envoi est intercepté et compté (PRD-D FR-214).

**Écarts de l'assurance, à porter au PRD `notification`.** Réalise UJ-2.

**Conséquences (testables) :**
- **Personnel** : cloche et e-mail. **Assuré, victime, ayants droit** : SMS, WhatsApp et e-mail ; **courtier, coassureurs, assureur du tiers** : e-mail. Français d'abord (FR-18).
- Les **modèles WhatsApp** de la compagnie (accusé de déclaration, pièces manquantes, offre envoyée, chèque à retirer, règlement effectué) sont **soumis à l'approbation avant la mise en service** (FR-N11) : le délai est externe ; un modèle non approuvé n'est jamais choisi, le SMS part, et le journal le dit.
- Le **numéro WhatsApp Business** et la **passerelle SMS** (identifiant d'expéditeur enregistré) sont **ceux de la compagnie et à sa charge** ; leurs identifiants sont chiffrés ; les coûts d'envoi sont mesurés (FR-N57 à FR-N63).
- Les **relances de pièces** sont espacées d'un intervalle paramétrable (valeur de la démo : 5 jours) ; après trois relances sans effet, Prospera propose au gestionnaire un **arbitrage** plutôt qu'une relance de plus (valeur de la démo, annexe D).
- Les **réponses entrantes** (accusés, réponses des assurés) passent par le **relais Money Vibes** (FR-239) : le serveur de la compagnie les tire, il n'est jamais joint directement.
- La matrice « qui est prévenu de quoi » est à l'annexe B ; `notification` ne la porte pas.

#### FR-227 : Aucune donnée de santé dans un message

Un message à l'assuré ne contient **jamais** de donnée de santé : un SMS ou un message WhatsApp passe par un opérateur tiers. Le message dit qu'**une pièce est attendue** ou **reçue**, jamais sa nature médicale, ni un taux, ni un diagnostic. Réalise UJ-4.

**Conséquences (testables) :**
- Un test déclenche chaque modèle de message du volet corporel et n'y trouve aucune donnée de santé : ni libellé de certificat, ni taux d'incapacité, ni lésion.
- Les modèles sont revus par RESP et le juriste avant approbation (FR-24).
- Un message qui demande une pièce médicale dit « un document médical » sans plus ; le détail est donné **au guichet** ou **par courrier** à l'assuré `[ASSUMPTION: règle de minimisation ; à confirmer à la séance d'immersion]`.

### 7.3 `dashboard` : le pilotage

#### FR-228 : Tableau de bord : un cockpit par rôle, spécifié au §6.7

**Ce qui s'applique tel quel.** Le module `dashboard` (M28) ne possède aucune donnée : un **cockpit par rôle relu des modules** (PRD-D FR-165), les **alertes du jour** (PRD-D FR-167), les **décisions à trancher** (PRD-D FR-168), le **rapport de direction** (PRD-D FR-169), les **PDF et envois** (PRD-D FR-170), les **exports** (PRD-D FR-171). **Le pilotage de l'assurance (brief du matin, charge, délais légaux qui expirent, dossiers bloqués, sans action depuis 30 jours, pièces attendues, règlements en attente, qualité du dossier, simulation « et si… », plan de contrôle) est spécifié au §6.7** : cette fiche n'en réécrit rien.

**Écarts de l'assurance.** Réalise UJ-6 et UJ-7.

**Conséquences (testables) :**
- Chaque chiffre d'un cockpit est calculé depuis les dossiers (FR-17) et affiche la date de sa dernière lecture du LC quand il en dépend (FR-2).
- Chaque rôle a **son** cockpit : la direction, le responsable, le gestionnaire (sa corbeille), le recours, le contrôle interne, l'accueil, la comptabilité ; aucun rôle ne voit le cockpit d'un autre (FR-6, PRD-D FR-7).
- Le **tableau de bord n'affiche pas de primes** ni de ratio sinistres sur primes : les primes relèvent du logiciel de la compagnie (FR-2) ; un reliquat de la démo qui en affiche est retiré `[ASSUMPTION: confirmé par le README de la démo ; à confirmer à la séance d'immersion]`.
- Sans `dashboard` installé, les écrans métier fonctionnent et l'emplacement du cockpit s'affiche vide (FR-20).

### 7.4 L'IA commune

**Ce qui s'applique tel quel.** La note de vision `vision-ia-sectorielle-2026-11-10` : l'IA est une **famille de modules à part**, commune à toutes les verticales ; elle apprend de leurs angles, sous le consentement de chacune, par **apprentissage fédéré** (PRD moteur FR-26 à FR-31 ; les modèles de la compagnie sont intouchables, PRD moteur FR-24). Ce PRD **n'écrit pas les modèles** : il **fournit les données**, **affiche les propositions**, **héberge l'instance locale** de l'IA commune et **marche sans elle** (emplacement vide). Les règles communes (provenance, l'IA propose et l'humain décide, jamais bloquante, jamais de montant en corporel, le mot « IA » réservé à un modèle) sont celles de FR-10 à FR-12 et ne sont pas répétées.

**Où elle tourne (décision du PO).** Chez la compagnie tourne une **instance locale** de l'IA commune, sur son serveur. Cette instance : (1) **prédit** à partir des seules données de la compagnie ; (2) **enregistre l'écart** entre ses prédictions et ce qui arrive ; (3) **anonymise** ces écarts ; (4) les **renvoie** à l'IA commune pour l'apprentissage, sous le consentement de la compagnie ; (5) **reçoit ses mises à jour** par un **tunnel sécurisé sortant**. Le Copilot et la recherche en langage naturel (§6.1) tournent dans cette instance.

#### FR-230 : Ce que la compagnie fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement

La compagnie **fournit** à l'IA commune, sous son consentement écrit (FR-19), des données **par finalité** : dossiers et pièces (par lecture sur place), devis et garages, expertises, règlements, recours, liens entre dossiers, délais ; elle **reçoit** des propositions : lecture de pièces, contrôles, relances, résumés, analyses de devis, explications de montant, signaux de fraude, brief du matin, simulation (FR-10). Réalise UJ-6.

Les **finalités** consommées par les modules de ce PRD sont déclarées module par module à la clause C11 de l'annexe A. Les finalités de **cette partie** sont proposées `[ASSUMPTION: noms de finalités proposés ; à valider avec le contrat de module]` : `declaration-assistee`, `lecture-pieces`, `controle-pieces`, `relance-pieces`, `resume-dossier`, `recherche-langage-naturel`, `preremplissage-instruction`, `analyse-devis`, `explication-montant`, `detection-fraude`, `redaction-courriers`, `recours-assiste`, `brief-du-matin`, `qualite-et-simulation`, `orientation-expertise`, `completude-rapport`, `comparaison-portefeuille`.

**Conséquences (testables) :**
- **Sans consentement**, rien ne sort des serveurs de la compagnie vers l'IA commune : l'instance locale prédit, enregistre ses écarts et sert le Copilot sur les seules données de la compagnie, sans rien renvoyer ; un test sur une installation sans consentement le vérifie (FR-12).
- Le consentement est **par finalité** et **retirable** : le retirer arrête l'envoi des écarts qui servent cette finalité ; le retrait est tracé (FR-19).
- La compagnie choisit le **niveau d'apprentissage** parmi ceux que le PRD moteur ouvre ; le choix est affiché dans l'écran des consentements.
- Chaque emplacement d'IA est **vide sans l'IA commune** (instance locale arrêtée) : un test coupe l'instance et vérifie qu'aucun parcours ne bloque et que les règles explicables restent servies, en le disant (FR-10).
- Un modèle affiné sur les données de la compagnie n'est jamais lu par Money Vibes (PRD moteur FR-24).

#### FR-231 : L'apprentissage sur l'historique repris, le réentraînement mensuel, le rapport mensuel

L'IA commune est **calibrée sur 3 à 5 années d'historique** de la compagnie, **repris par `reprise`** (§6), pour apprendre ses coûts, ses garages, ses pièces et ses schémas de fraude ; l'apprentissage commence pendant la reprise des archives. Les **résultats sont vérifiés par les gestionnaires** (accepter, modifier, rejeter : FR-12). Le **réentraînement est mensuel**, et un **rapport mensuel de performance** est remis au responsable et à la direction : par usage, part des propositions acceptées, modifiées, rejetées, écarts de calibrage. **L'IA ne se met pas à jour seule.** Réalise UJ-6 et UJ-8.

**Conséquences (testables) :**
- Le calibrage prend un **historique de 3 à 5 ans** (paramètres, annexe D) ; avant calibrage, les capacités servent des **règles explicables** et le disent (FR-10).
- Le réentraînement a lieu **une fois par mois** ; un test le déclenche, vérifie que le modèle d'avant est conservé et que le nouveau est **essayé** avant promotion (FR-233).
- Le **rapport mensuel** est produit sans saisie : un test le génère sur le jeu de démonstration et y retrouve, pour chaque usage de FR-10, les trois parts.
- La **configuration du serveur** inclut l'instance locale : elle tourne sur une machine ou une machine virtuelle à part, dont le dimensionnement est **chiffré au devis des serveurs avec la compagnie** `[ASSUMPTION: modèle de la microfinance ; la v4 parle d'un serveur « capable d'héberger à terme le calcul de l'IA locale »]`.
- Le calibrage ne lit pas les données de santé (FR-232).

#### FR-232 : Rien de nominatif ni de médical ne sort

Ce qui sort, avec consentement, est un **écart anonymisé** : finalité, version du modèle, valeur prédite, valeur observée, caractéristiques agrégées ou généralisées. **Aucun nom, téléphone, identifiant ni montant individuel identifiant, et aucune donnée de santé, n'en fait partie.** **Aucun écart construit à partir d'une donnée de santé ne sort**, même anonymisé `[ASSUMPTION: lecture stricte de « aucune donnée médicale ne sort » ; à confirmer]`. Le **tunnel sortant** n'est ouvert que par l'instance : **aucun port entrant** n'est ouvert chez la compagnie.

**Conséquences (testables) :**
- Un test inspecte un lot sortant sur le jeu de démonstration et n'y trouve **aucun identifiant, aucun nom, aucun téléphone, aucune donnée de santé** ; il inspecte aussi le lot d'un dossier corporel et n'y trouve aucun écart issu de pièces médicales.
- Un balayage de l'extérieur ne trouve **aucun port entrant** ouvert (§7.5).
- Le registre des transferts (FR-19) liste le tunnel comme destination sortante déclarée.
- Un test coupe le tunnel : l'instance locale **continue de servir** ; les écarts s'accumulent et partent au retour du tunnel, **ou ne partent pas** si le consentement a été retiré.

#### FR-233 : Les mises à jour de l'IA sont versionnées et retirables

Une mise à jour de modèle est **reçue** par le tunnel sortant, **signée**, **versionnée**, **appliquée dans l'espace d'essai** avant d'être **promue** à la date que la compagnie choisit, et **retirable**. Elle suit le contrat de maintenance (§7.5). Ce tunnel est **distinct du tunnel de support** (FR-241). Réalise UJ-8.

**Conséquences (testables) :**
- Un test applique une mise à jour dans l'espace d'essai, mesure sur le jeu de démonstration l'effet sur les propositions, puis la promeut ; un second test la **retire** : le modèle d'avant revient, et les propositions faites par le modèle retiré restent inscrites au registre avec sa version (FR-12).
- Une mise à jour **jamais appliquée sans la date choisie** par la compagnie, sauf un correctif de sécurité critique (FR-235).
- Couper l'IA ne bloque aucun parcours (FR-10, FR-11).

### 7.5 L'installation chez la compagnie (moteur d'installation)

**Ce qui s'applique tel quel.** La compagnie s'installe **sur ses propres serveurs**, pas chez Money Vibes (décision du PO). Le PRD moteur fixe : l'**agent tire**, le poste central ne pousse rien (spine moteur AD-1), avec un contact sortant unique (AD-9) ; **une instance, un serveur**, deux espaces, **essai** et **réel** (AD-10) ; l'**espace d'essai** où l'on essaie une mise à jour avant de la promouvoir, et le **retour arrière en un clic** (PRD moteur FR-17, FR-18) ; la **mise à jour par fichier signé** quand le serveur n'a pas internet (PRD moteur FR-22) ; l'installation scriptée et le refus d'un serveur sous la configuration minimale (PRD moteur FR-25, NFR-10) ; les **sauvegardes 3-2-1**, chiffrées, second support dans les locaux du client, clé de restauration détenue par le client (PRD moteur NFR-7) ; le **support à distance** par un tunnel **ouvert seulement par le client** (PRD moteur FR-23). **Ce PRD ne réécrit aucune de ces exigences** ; il dit ce que la compagnie change ou ajoute.

#### FR-234 : Un serveur applicatif et un NAS chez la compagnie

L'installation tient sur un **serveur applicatif et un NAS distincts** (un NAS seul ne suffit pas), **achetés par la compagnie** et placés dans un **local sécurisé** (onduleur, climatisation), **sans dépendance à un nuage étranger** (proposition v2 et offre v4). La **préparation** (paramétrage, jeu de démonstration, calibrage des règles) se fait sur l'environnement de Money Vibes avec un **échantillon anonymisé** ; les **données réelles ne sont reprises que chez la compagnie**. Les spécifications du serveur sont remises à la compagnie avant sa commande ; elles viennent du test de FR-23. Réalise UJ-8.

**Conséquences (testables) :**
- Un test installe Prospera sur un serveur de référence avec un NAS : l'installation refuse un serveur sous la configuration minimale (PRD moteur NFR-10).
- Aucune donnée réelle de la compagnie ne figure dans l'environnement de préparation de Money Vibes : un test inspecte le jeu et n'y trouve que des données fictives ou anonymisées.
- Un balayage de l'extérieur ne trouve **aucun port entrant** (FR-239).
- Les données restent sur le NAS et le serveur de la compagnie ; aucun stockage en nuage n'est utilisé (FR-19).

#### FR-235 : Les mises à jour : essai, date choisie, retour arrière, fichier signé

Les mises à jour arrivent à distance, tirées par l'agent de l'instance (AD-1), sont **essayées dans l'espace d'essai**, puis **promues à la date que la compagnie choisit**, avec **retour arrière en un clic** ; un serveur sans internet les reçoit **par fichier signé** (PRD moteur FR-17, FR-18, FR-22). Elles comprennent les **mises à jour des barèmes, des règles et des évolutions CIMA**, que la proposition v2 inclut dans la maintenance. Réalise UJ-8.

**Conséquences (testables) :**
- L'administrateur reçoit une mise à jour, la teste dans l'espace d'essai (jeu de la démonstration, FR-15), choisit la date, l'applique et peut revenir en arrière en un clic ; il ne voit **aucune donnée métier** à aucun moment (FR-238).
- Une mise à jour n'est **jamais appliquée sans la date choisie** par la compagnie, sauf un **correctif de sécurité critique**, que la compagnie peut accepter dans un délai fixé par le contrat (défaut : 72 heures ; un correctif réglementaire est livré avant la date d'effet du texte) `[ASSUMPTION: valeurs reprises de la microfinance ; à confirmer]`.
- La coupure de service d'une mise à jour est de **15 minutes au plus** (PRD moteur NFR-9).
- Un **correctif de délai légal** (nouvelle version du référentiel, FR-14) est livré comme une mise à jour de référentiel : le dossier jugé selon sa date de survenance garde l'ancienne version.
- Le **régime de licence** (usage perpétuel ou non) et le contrat de maintenance sont des clauses du **contrat commercial**, **hors de ce PRD** ; ce PRD n'engage ni prix ni durée `[ASSUMPTION: gel après 30 jours sans contact et version figée comme les autres installations sur site (PRD moteur FR-15, FR-32) ; à confirmer au contrat]`.

#### FR-236 : Sauvegarde quotidienne, restauration testée, conservation

La **sauvegarde est automatique et quotidienne** (proposition v2), sur le NAS et sur un second support dans les locaux de la compagnie (3-2-1, PRD moteur NFR-7). La **restauration est testée** à intervalle régulier (défaut : une fois par mois, `[ASSUMPTION: modèle de la microfinance]`) et l'échec allume un voyant. Les valeurs de perte maximale (RPO) et de reprise (RTO) sont celles du PRD moteur (NFR-7), **sans engagement de la proposition v2, qui n'en chiffre aucun** : **point non tranché** (§12). La **rétention technique** des sauvegardes n'est **pas** la conservation réglementaire : le **journal, les dossiers et les pièces** sont conservés **dix ans au moins** (Code CIMA art. 404) dans la base de l'installation et ses archives, pas seulement dans des sauvegardes qui tournent. Réalise UJ-8.

**Conséquences (testables) :**
- Une sauvegarde automatique a lieu chaque jour ; un test arrête le serveur, restaure la sauvegarde la plus récente sur un serveur de référence et vérifie le retour de l'état du dernier jour, **y compris les chaînages du journal** (FR-13).
- Après une restauration, avant de reprendre tout règlement, l'instance **rapproche les règlements de la période perdue** du relevé du fournisseur ; un règlement dont l'issue est inconnue passe à `INCONNU` et n'est pas réémis avant ce rapprochement (FR-220).
- La rotation des sauvegardes n'efface jamais une donnée soumise à la conservation de dix ans.
- L'effacement d'une donnée **sous conservation** est refusé avec un code nommé (FR-19).
- Un export d'archive d'un dossier, d'un assuré ou d'une période se fait sur un support de la compagnie, avec une somme de contrôle.

#### FR-237 : L'accès des guichets au serveur central

Les guichets et les sites accèdent au serveur central **par navigateur, sur le réseau de la compagnie** (liaison privée ou dédiée, **à la charge de la compagnie**). Le guichet travaille **en ligne**. Les **hypothèses** de dimensionnement retiennent **un site central et des guichets** (FR-23). Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le port du serveur est joignable depuis **le réseau interne de la compagnie et ses guichets**, jamais depuis internet.
- Quand la liaison d'un guichet tombe, l'écran affiche « hors liaison » et ne simule rien ; la saisie de la déclaration n'est pas faussement acceptée ; au retour de la liaison, rien n'est perdu.
- Le scan de pièces au guichet passe par le **poste de numérisation** (§6.2) ; une pièce déposée sans liaison n'est pas rattachée à un dossier avant le retour de la liaison.
- La plateforme est accessible **depuis les postes existants** de la compagnie (navigateurs récents ; appareils de référence fixés à la recette).
- Aucune exigence de bande passante n'est posée avant la taille réelle de la compagnie (FR-23).

#### FR-238 : L'exploitation est faite par l'équipe informatique de la compagnie, qui ne lit pas le métier

L'installation est **exploitée par l'équipe informatique de la compagnie** (sa DSI), pas par celle de Money Vibes. Elle porte le rôle **ADMIN** (FR-6) : plusieurs personnes, pas une seule. ADMIN **crée les comptes, règle les paramètres, installe et promeut les mises à jour, surveille les sauvegardes** ; elle **ne lit aucune donnée métier**. Le système d'exploitation et les correctifs de l'hôte restent à la charge de la compagnie. Réalise UJ-8.

**Conséquences (testables) :**
- Un test ouvre avec ADMIN chaque écran métier : refus sans donnée (FR-6). L'export et la restauration passent par l'outil d'administration, sans ouvrir de table métier.
- La création d'un administrateur et l'attribution d'un droit d'instance demandent **deux personnes** `[ASSUMPTION: règle reprise de la microfinance ; à confirmer]`.
- ADMIN voit des **comptes, des états, des motifs de rejet** (par exemple le rapport de reprise), pas le contenu d'un dossier (UJ-8).
- Un **manuel d'exploitation** (démarrage, arrêt, mise à jour, restauration, supervision, astreinte) est livré à l'installation ; la supervision locale est lisible sans internet : l'état des services, des sauvegardes, de l'échange avec le LC, du tunnel de l'IA commune.
- Un événement de l'installation (échec de mise à jour, sauvegarde en échec, relais injoignable) est une alerte à ADMIN.

#### FR-239 : Le relais Money Vibes, parce qu'aucun port n'est ouvert chez la compagnie

Le PRD moteur interdit tout port entrant d'internet sur une instance sur site. Or deux chemins de la compagnie viennent d'internet : les **réponses et accusés WhatsApp** des assurés, et les **notifications des fournisseurs de paiement** (PI-SPI) qui confirment un virement. Comme pour l'IMF, ces flux passent par un **relais** tenu par Money Vibes, qui les reçoit, les met en file, et que **le serveur de la compagnie tire** (« l'agent tire »). Réalise UJ-3. `[ASSUMPTION: relais repris du modèle de la microfinance ; à confirmer à l'installation]`

**Conséquences (testables) :**
- **Accusé de réception après écriture** : le relais n'accuse réception d'un événement au fournisseur qu'après l'avoir écrit durablement ; l'instance n'acquitte un événement tiré qu'après l'avoir écrit chez elle ; un événement non acquitté est rejoué sans doublon d'effet.
- **Rapprochement quotidien** : chaque jour, l'instance rapproche les paiements reçus par le relais du relevé du fournisseur ; un écart entre dans la file de rapprochement (FR-224).
- **Money Vibes est déclaré sous-traitant** de la compagnie pour le traitement des flux du relais (finalité, contenu, durée de conservation, localisation), dans le registre des traitements (FR-19) ; le relais purge un événement tiré après un délai (défaut : 7 jours, annexe D `[ASSUMPTION: modèle de la microfinance]`).
- L'interrogation du relais est un **contact sortant** de l'instance, ajouté à la liste des destinations sortantes déclarées (FR-19) ; la fréquence est un paramètre (défaut : 1 minute `[ASSUMPTION: modèle de la microfinance]`).
- Un balayage de l'extérieur ne trouve aucun port entrant.
- Si le relais est injoignable, le circuit continue ; les confirmations de virement s'affichent « en attente du relais » ; la file se vide au retour.
- Aucune donnée de santé ne transite par le relais (FR-227).
- En espace d'essai, le relais n'envoie rien de réel.

#### FR-241 : Le support à distance est ouvert par la compagnie seule

Le support de Money Vibes à une installation passe par le **tunnel de support** que **seule la compagnie ouvre**, borné dans le temps et journalisé ; les comptes de Money Vibes sont **fermés par défaut** (PRD moteur FR-23). Réalise UJ-8.

**Conséquences (testables) :**
- Un test tente d'ouvrir le tunnel depuis Money Vibes : refus. L'ouverture par ADMIN le permet pour une durée fixée, journalisée dans le journal chaîné de l'installation.
- Pendant le tunnel, Money Vibes **ne lit aucune donnée métier** : l'accès est celui de l'administration de l'instance (FR-238) ; l'accès à un écran métier est refusé.
- Le journal du tunnel (qui, quand, combien de temps, quelles actions) est lisible par ADMIN et par AUD.
- Le support d'usage (formation, questions) relève de FR-246 et du contrat de maintenance.

### 7.6 Réseau, connecteurs, support

#### FR-244 : Réseau : le site central, les guichets, les volets

**Ce qui s'applique tel quel.** La zone et la hiérarchie à profondeur configurable (FR-R01, FR-R12), la portée en lecture et en écriture (FR-R24, FR-R24b, FR-R24c), les affectations datées (FR-R20 à FR-R22), l'attribution d'une portée (FR-R36), l'import (FR-R37), l'audit (FR-R40).

**Écarts de l'assurance, à porter au PRD `reseau`.** Réalise UJ-1 et UJ-6.

**Conséquences (testables) :**
- Le réseau d'une compagnie se compose d'un **site central** et de **guichets** (hypothèse FR-23) ; un guichet est un nœud du réseau auquel sont rattachés les ACC.
- Le **volet** (corporel, matériel, risques divers) est une **portée** de GEST, tenue par `sinistres` et **lue** par `reseau` ; le pôle recours en est une autre (à porter au PRD `reseau` : action du §12).
- Les **intermédiaires** (courtiers, agents) et les **coassureurs** sont des objets du **LC** : `reseau` ne les tient pas (FR-2).
- Un transfert d'un agent d'un guichet à un autre est une opération **datée et tracée**.
- Un agent ne voit ni guichet ni volet hors de sa portée (FR-6) ; une portée vide est vide, jamais « tout ».
- Créer un guichet dans la démonstration crée un nœud du réseau et apparaît dans les périmètres et les tableaux de bord sans autre manipulation.

#### FR-245 : Connecteurs : hors février ; l'échange générique, lui, est du premier jour

**Ce qui s'applique tel quel.** Connecteurs : un propriétaire par domaine, objet en **lecture seule** quand le logiciel externe en est propriétaire (Connecteurs FR-14 ; PRD-D FR-218). **Écarts de l'assurance.** Réalise UJ-9.

**Conséquences (testables) :**
- Le **connecteur nommé** du logiciel de la compagnie est **hors février** : le logiciel est inconnu et libre en janvier ; le **contrat d'échange générique** (annexe C), par interface ou par fichier, est du **premier jour** (§6.5, `liaison-assureur`) ; le **logiciel de compagnie fictif** le parle (§6.5).
- Aucun bouton de la démo ne promet une intégration à un produit nommé : « bientôt », sans date (FR-22).
- L'état « lecture seule, propriété du logiciel externe » vaut pour tout objet que le LC possède : assurés, polices, garanties, primes, intermédiaires, coassureurs, numéro de sinistre (FR-2) ; la section « Intégrations » du menu n'apparaît que si `connecteurs` est installé.
- Le domaine d'échange déclare ses **valeurs de contrôle** dès le manifeste (nombre d'objets, sommes), pour que le passage au connecteur nommé n'oblige pas à reprendre du code `[ASSUMPTION: règle du point d'écriture unique par domaine reprise des PRD distributeur et microfinance]`.

#### FR-246 : Support : une anomalie bloquante prise en charge en 4 heures ouvrées

Le **seul engagement de support chiffré** des sources est la **prise en charge d'une anomalie bloquante sous 4 heures ouvrées** (proposition v2 et offre v4). Les anomalies sont classées **bloquante, majeure, mineure** (offre initiale). La maintenance comprend les correctifs, la sécurité, le contrôle des sauvegardes, les **mises à jour des barèmes, des règles et des évolutions CIMA**, une **visite mensuelle sur site**, le réentraînement mensuel de l'IA et son rapport mensuel (FR-231) `[ASSUMPTION: contenu de la maintenance repris de la proposition v2 ; prix et durée au contrat, hors PRD]`. Les **heures ouvrées** sont celles de la compagnie, fixées au contrat. Réalise UJ-8.

**Conséquences (testables) :**
- Un ticket d'anomalie **bloquante** a un délai de **prise en charge** mesuré à l'heure ouvrée ; un test simule une anomalie bloquante et vérifie que le compteur démarre à la création du ticket et s'arrête à la prise en charge.
- Une anomalie **bloquante** est définie par ce qu'elle empêche : un parcours **jamais « bientôt »** (FR-22) devenu impossible, un règlement bloqué à tort, une perte de données ; la définition est remise à la compagnie à l'installation.
- Aucun engagement de **disponibilité** chiffré n'existe dans les sources `[ASSUMPTION: objectif de conception de 99,5 % du temps ouvré, sans engagement, repris de la microfinance ; à confirmer à la séance d'immersion]`.
- Le support à distance suit FR-241 ; le support d'usage suit le contrat de maintenance.
