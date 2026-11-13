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
