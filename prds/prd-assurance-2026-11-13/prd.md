---
title: "PRD — Prospera Assurance (chaîne sinistres)"
status: final
created: 2026-11-13
updated: 2026-11-13
project: prospera
verticale: assurance IARD (zone CIMA, Togo)
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13)
prd_lies: [prd-distributeur-2026-11-12 (règles transverses), prd-microfinance-2026-11-13 (modèle : cœur fictif, IA commune locale, installation), prd-paiement-service-2026-08-02, prd-notification-service-2026-08-02, prd-reprise-donnees-2026-11-10, prd-connecteurs-2026-11-10, prd-moteur-installation-2026-11-09, prd-assistant-ia-2026-08-02, prd-reseau-zones-2026-08-02]
mode: rapide
---

# PRD — Prospera Assurance (chaîne sinistres)

*PRD final (2026-11-13), rédigé en mode rapide puis corrigé : passe de cohérence (`coherence.md`), cinq relectures (`reconcile-*.md`, `review-*.md`), arbitrages R1-R15 (`arbitrages-relectures.md`) et 160 corrections (`corrections.md`), tri des hypothèses, passe de style. Sources : récit du PO (`brain-dump-po-2026-11-13.md`), plan et décisions D1-D21 (`plan-redaction.md`), cinq extraits (`extract-*.md`) ; décisions et raisons dans `.memlog.md`. Les défauts retenus sur recommandation (H-nnn) se confirment à la séance d'immersion ; les points juridiques (J-nn) à la revue juridique obligatoire avant la mise en service (§13).*

---

## 0. Objet du document

Ce PRD décrit **Prospera Assurance** : l'outil qui sert une compagnie d'assurance IARD de la zone CIMA, au Togo, **de la déclaration d'un sinistre à l'archivage de son dossier**, recours compris. Il s'adresse au PO, à Dev A, à Dev B et à ceux qui écriront les épics.

**Le client visé** est une compagnie IARD togolaise, au stade du pré-contrat. Le PRD ne la nomme jamais, ni son groupe : il écrit « la compagnie ». Elle démarre en **février 2027**, en même temps que les autres clients Prospera, **sur ses propres serveurs** : un serveur applicatif et un NAS chez elle (§7.5).

**Prospera ne remplace pas le logiciel de la compagnie.** Ce logiciel, appelé ici **« le logiciel de la compagnie »** (LC), garde les assurés, les polices, les garanties, les primes et leur paiement, les intermédiaires (courtiers, agents), les coassureurs et, au départ, **le numéro de sinistre officiel**. **Il fait foi pour les contrats.** Prospera se branche à côté et tient le **dossier sinistre** : déclaration, pièces, instruction, expertise, évaluation, provision du dossier, décision, offre, règlement, recours, archives, journal (FR-2). Le LC est un nouveau logiciel que la compagnie met en place en parallèle ; il sera libre en janvier. **On ne spécule pas dessus** : le PRD définit un **contrat d'échange générique**, par interface (API) ou par fichier (Excel, JSON), dans les deux sens (annexe C). Pour la démonstration, Money Vibes livre un **logiciel de compagnie fictif** qui parle ce contrat, **pour que la compagnie voie** comment Prospera vit à côté de son logiciel.

**Tout le circuit fonctionne au premier jour, avec l'IA, sauf la voix.** Décision du PO : Prospera sert à **consulter et à déclarer**. Le circuit va **jusqu'au chèque** et à la clôture. Il compte huit phases (déclarer, ouvrir, attribuer, instruire, chiffrer, décider, payer, clore), onze statuts, quatre sorties (rejeté, sans suite, litige, fraude suspectée) et un **recours mené en parallèle** (partie 2). L'IA est spécifiée dans chaque section où elle sert (FR-10). Sont exclues la dictée, la transcription d'appel et la synthèse vocale ; le chatbot de l'assuré est « bientôt » (FR-22).

**La démo existante ne tourne que dans le navigateur.** Le front de démo `prospera-assurance` montre le circuit en entier, mais n'enregistre rien côté serveur. Le portefeuille d'environ 3 500 dossiers est généré à chaque chargement ; les actions restent dans le navigateur de chacun ; l'IA se réduit à des règles et à des expressions régulières ; rien n'est envoyé ni payé. **C'est le serveur qu'il faut construire.** Ce PRD exige en vrai ce que la démo montre et corrige ses écarts (franchise déduite, contrôle de garantie qui ne se saute pas, offre et accord de l'assuré comme étape, recours en parallèle, validation à plusieurs niveaux, lecture réelle des scans). **Le premier risque du projet est la reprise des données** : les archives de la compagnie, leur format, leur volume et le logiciel d'où elles partent ne sont pas connus à cette date (§12 ; module `reprise`).

**La compagnie a vu une vraie démonstration.** Elle a dit qu'**il manque des éléments, mais de débuter dessus**. Une **séance d'immersion** avec elle suivra, pour parfaire certaines étapes et faire des ajouts. Le but, dit le PO, est de **finaliser un vrai processus qui peut évoluer après, mais qui doit d'abord être présent, intégré et vraiment testé**. Ce PRD est donc écrit pour **évoluer par paramètres** : tout seuil, délai, liste ou règle de la compagnie est un paramètre (FR-4), et chaque décision prise sans parole de la compagnie porte la balise *(défaut H-001 : … ; à confirmer à la séance d'immersion)*. Le PO a demandé de trancher soi-même les points restants « pour qu'on finisse » : ces choix sont des recommandations, pas des engagements de la compagnie.

**Ce PRD réutilise le PRD distributeur et le PRD microfinance.** Les règles transverses du premier (PRD-D §4) s'appliquent ici (FR-1). La partie 4 reprend les modules partagés par renvoi et dit seulement ce que l'assurance exige en plus ; elle s'inspire de la partie 4 du PRD microfinance pour l'installation chez le client et l'IA commune.

Le document se lit en quatre parties :

| Partie | Contenu | Sections |
|---|---|---|
| **1. Le produit** | vision, rôles, parcours, vocabulaire, règles transverses (partage avec le logiciel de la compagnie, paramètres, rôles et séparation des tâches, données de santé, IA, trace, délais, jeu de démonstration) | §1 à §4 |
| **2. Le circuit sinistre** | le module `sinistres` : de la déclaration à l'offre (§5.0 à §5.7), puis du paiement à la clôture, le recours, les sorties et les états (§5.8 à §5.15) | §5 |
| **3. Les autres modules propres à l'assurance** | pièces et archives (`ged`), expertises, contrats lus et provisions (`assurance`), échange avec le logiciel de la compagnie, logiciel fictif, reprise, pilotage | §6 |
| **4. Les modules partagés et cadrés** | fiches de renvoi : paiement, notification, tableau de bord, IA commune, installation chez la compagnie, réseau, connecteurs, support | §7 |

Suivent les exigences transverses (§8), les indicateurs (§9), le périmètre (§10), les non-objectifs (§11), les décisions, actions et risques (§12), les hypothèses (§13), puis cinq annexes : **A** le contrat de module (13 lignes par module), **B** la matrice d'accès, **C** le contrat d'échange avec le logiciel de la compagnie, **D** la table des paramètres, **E** la reprise des 104 vérifications du rejeu de la démo et les 21 refus à provoquer. Les choix techniques renvoyés hors du PRD sont dans l'addendum.

**Sources et décisions.** Les sources sont le récit du PO (`brain-dump-po-2026-11-13.md`), le plan de rédaction et ses 21 décisions de cadrage (`plan-redaction.md`), le code et les parcours de la démo, la proposition commerciale v2 (la référence commerciale), la SPEC métier, et la recherche réglementaire (`extract-recherche-cima.md`). En cas d'écart, l'ordre de priorité est : le récit du PO, le plan, le code de la démo, les parcours validés, la proposition v2, la SPEC, puis les autres pièces ; **la réglementation l'emporte sur tout pour les obligations légales**. Le code de la démo l'emporte sur la SPEC, en retard sur lui : elle décrit 9 statuts et 2 sorties. Le PO a imaginé les questions du fichier de retour personnel de la démo (`99-retour-personnel.md`) : ce ne sont pas des propos de la compagnie. Les propos de la compagnie nous viennent de seconde main, par trois documents : l'atelier avec le service sinistres (dont il reste six constats), l'offre v4 et la proposition v2.

**Pièces de référence qui ne sont pas togolaises.** La convention d'expertise du dossier est tunisienne, les procédures reprises du mémoire de 2014 sont celles de la compagnie étudiée par le mémoire de 2014 (zone CIMA), et les formulaires du fonds de garantie viennent d'un autre pays : ce sont des modèles et des jeux de test, pas des règles du Togo. Les règles du Togo viennent du Code CIMA et de la loi togolaise sur les données personnelles. Seuls les textes que la recherche a lus (marqués SÛR) sont cités avec leur numéro ; le reste est « à vérifier par le juriste » (FR-24).

**Numéro attribué tout de suite.** Le récit du PO écrit « numéro attribué tout de suite ». Le PRD le réalise par la **référence `DEC-` immédiate** ; le numéro officiel vient du logiciel de la compagnie (FR-2, décision D3).

**Numéros créés ou réservés par la relecture.** FR-26 à FR-29 (principes transverses), FR-229 (vue finance et vue exploitation), FR-240 (mise en service) et FR-242 (réversibilité) sont créés par la relecture ; FR-243 et FR-247 à FR-249 restent réservés. Dans tout le PRD, un identifiant `FR-n` sans préfixe désigne une exigence de ce PRD ; les exigences des autres PRD portent toujours leur préfixe (`PRD-D FR-n`, `PRD moteur FR-n`).

---

## 1. Vision

Une compagnie d'assurance vit de la confiance de ses assurés au moment du sinistre. Aujourd'hui, quand un assuré appelle (« Où en est mon dossier ? », « Avez-vous reçu mon document ? », « Quel est le montant prévu ? », « Pourquoi mon dossier n'est-il toujours pas réglé ? »), le collaborateur cherche dans plusieurs dossiers et applications, interroge d'autres services, appelle un collègue, reconstitue le parcours. L'assuré attend, rappelle, finit par douter de la compagnie. Le collaborateur perd son temps. La direction ne voit pas ce qui se passe vraiment.

**La phrase à faire disparaître est : « Je vais vérifier et je vous rappelle. »**

Une décision n'est bonne que si elle est **défendable** : devant l'assuré, l'auditeur ou le juge, elle montre ses pièces, sa règle, son motif et son auteur, sans reconstitution (FR-26).

Prospera Assurance donne à chaque acteur du sinistre **une seule histoire du dossier**, enregistrée pas à pas : de l'agent d'accueil qui reçoit la déclaration au responsable qui valide, de la comptable qui émet le chèque à l'archiviste qui verse le dossier au fonds. Le gestionnaire répond à l'assuré **pendant l'appel**, depuis la fiche. Le responsable voit les dossiers bloqués, les délais qui expirent et la charge de chacun. Le contrôle interne et la CRCA trouvent le journal sans reconstitution. Prospera le fait **à côté du logiciel de la compagnie, sans le remplacer** : le logiciel tient le contrat, Prospera tient le sinistre.

**Les promesses de la proposition v2** (la référence commerciale, 15 septembre 2026), et ce que le PRD en fait :

| # | Promesse (proposition v2) | Ce que le PRD mesure (§9) |
|---|---|---|
| 1 | Une recherche unique par nom, numéro de police, téléphone, référence sinistre ou numéro d'archivage, « en quelques secondes » | résultat en moins de 5 secondes au 95e centile sur le volume repris ; moins de 1 seconde visé (défaut, annexe D) *(défaut H-002 : la v2 ne chiffre pas ; la cible de 5 s vient du deck du 12/09 et du PO ; 1 s est la cible du deck)* |
| 2 | Chaque étape tracée : qui, quand, pourquoi ; 100 % des actions horodatées et attribuées | part des actions du journal avec auteur et horodatage serveur (cible 100 %) ; part des refus et classements avec motif (cible 100 %) |
| 3 | Aucun règlement sans validation, aucun montant payé deux fois | nombre d'ordres sans validation (cible 0) ; nombre de doublons de règlement détectés avant émission |
| 4 | Délais du Code CIMA respectés ; audits et contrôles de la CRCA « préparés sans reconstitution » | part des dossiers corporels avec une échéance légale active et alertée ; temps pour produire le journal d'un dossier ou d'une période |
| 5 | Un tableau de bord de direction : dossiers ouverts par branche et par étape, bloqués et leur raison, sans action depuis 30 jours, charge et montants par gestionnaire, pièces attendues, règlements en attente | chiffres calculés depuis les dossiers, jamais saisis (FR-17) ; fraîcheur des chiffres |
| 6 | L'IA : quatorze usages, locale, qui propose et ne décide jamais, jamais de montant sur un préjudice corporel, chaque information sourcée, registre de chaque action | chaque proposition porte son origine, sa source et son statut ; part des propositions acceptées, modifiées, rejetées (rapport mensuel de performance, FR-10 et §7.4) |
| 7 | Les données personnelles et médicales ne sortent jamais de la compagnie | un test inspecte tout envoi sortant et n'y trouve ni donnée nominative ni donnée médicale (FR-12, FR-232) |
| 8 | Une sauvegarde quotidienne automatique et un journal d'accès | rapport de restauration testée (FR-236) ; journal des consultations (FR-13) |
| 9 | Une anomalie bloquante prise en charge sous 4 heures ouvrées | délai mesuré de prise en charge (FR-246) |

Les promesses du deck du 12/09 qui ne figurent ni dans la v2 ni dans l'offre v4 (assistant conversationnel en français et en anglais, 24 h sur 24, côté assuré) sont **« bientôt »** (FR-22).

**Promesses du deck et de la v2 non tenues ou transformées, par décision du PO.**

| # | Promesse du deck ou de la v2 | Ce que le PRD en fait |
|---|---|---|
| 1 | Blocage de l'ouverture tant que les pièces manquent | **Transformée** : on ouvre « en attente de pièces » ; l'ouverture n'est jamais bloquée (FR-39) |
| 2 | Reprise du stock papier par scan | **Non retenue** : le papier reste tenu (FR-21) |
| 3 | Numéro de sinistre immédiat | **Transformée** : la référence `DEC-` est immédiate ; le numéro officiel vient du logiciel de la compagnie (FR-2) |
| 4 | Import initial seulement | **Remplacée** par la resynchronisation nocturne (FR-2, §6.4) |
| 5 | Appel pris en compte dans la déclaration assistée | **Transformée** : l'accueil saisit pendant l'appel ; la déclaration assistée lit WhatsApp et l'e-mail, jamais la voix (FR-10) |
| 6 | Téléversement par l'assuré depuis son téléphone | **Non tenue** : il n'y a pas de portail assuré (§2.2, FR-22) |
| 7 | Prescription « art. 28 » | **Gardée comme terme à vérifier** par le juriste (FR-14) |

---

## 2. Pour qui

### 2.1 Les rôles

La compagnie travaille avec **quatorze rôles** (décision de cadrage D14 ; le plan de rédaction les fixe, la compagnie les confirmera à la séance d'immersion). Chacun ne voit que son périmètre (FR-6).

| Code | Rôle | Périmètre | Ce qu'il fait dans Prospera |
|---|---|---|---|
| DG | Direction générale | tous les dossiers | pilote ; valide seule les règlements à titre commercial ; siège au comité s'il le décide ; certifie une reconstitution ; lit une donnée de santé par un accès par dossier ouvert à la validation, journalisé (FR-9) |
| DT | Directeur technique (opérationnel) | tous les dossiers | donne son visa sur les montants qui passent au comité ; siège au comité sinistres ; lit une donnée de santé par un accès par dossier ouvert à la validation, journalisé (FR-9) |
| RESP | Responsable du service sinistres | tous les dossiers du service | attribue les dossiers, ordonne une contre-expertise (comme `DG` et `DT`), valide jusqu'au seuil de sa délégation, préside le comité, rend l'arbitrage ; réaffecte la charge |
| GEST | Gestionnaire sinistres | les dossiers de **son volet** (corporel, matériel ou risques divers) | instruit, demande les pièces, mène les expertises, arrête l'évaluation, prépare l'offre, clôt |
| GREC | Gestionnaire recours | les dossiers en recours | mène le recours contre le tiers ou son assureur : mise en cause, relances, mise en demeure, encaissement |
| MED | Médecin-conseil | les dossiers corporels qui lui sont confiés | lit les pièces médicales, rend un avis sur les lésions et la consolidation ; ne propose jamais de montant par l'IA |
| EXPI | Expert interne | ses missions | accepte la mission, rédige son rapport dans l'application |
| EXPE | Cabinet d'expertise externe | **ses seules missions**, par le portail expert | accepte la mission, dépose son rapport ; ne voit ni la provision ni le reste du dossier |
| ACC | Chargé d'accueil-guichet | recherche et guichet | reçoit la déclaration, constate les pièces, répond à l'assuré, remet le chèque contre quittance signée ; voit qu'une pièce médicale est reçue, **jamais son contenu** |
| NUM | Opérateur de numérisation | lots de scan, indexation | scanne, indexe, contrôle avant archivage |
| ARCH | Archiviste | fonds d'archives | verse au fonds, attribue le numéro d'archivage, tient la cote physique, reconstitue |
| CPT | Comptable règlements | ordres de règlement, paiements | émet le chèque ou le virement, saisit les références, rapproche ; **ne décide jamais** d'un règlement |
| AUD | Contrôle interne | tous les dossiers, **en lecture seule pour les décisions** | contrôle, lit le journal des changements et des consultations, prépare les contrôles de la CRCA ; **signale** une suspicion de fraude et rend un **avis écrit** (obligatoire avant la confirmation d'une fraude) ; ne décide jamais |
| ADMIN | Administrateur informatique de la compagnie | comptes et paramètres | crée les comptes, règle les paramètres, installe les mises à jour ; **ne lit aucune donnée métier** |

Le **comité sinistres** n'est pas un rôle : c'est une instance de décision, composée de personnes qui portent déjà un rôle (FR-8). Le **responsable LBC** n'est pas un quinzième rôle : c'est une désignation faite par `AUD`, jamais par `ADMIN` seul (FR-225). Dans l'espace d'essai, un **sélecteur de rôle de démonstration** change de profil sans déconnexion (FR-15). Le directeur administratif et financier de la compagnie (DAF) se sert de la vue finance, tenue pour `CPT` et `DG` (FR-229) ; le DSI porte le rôle `ADMIN`, qui **ne lit aucune donnée métier**. Les **quatorze gestionnaires** de la démo (trois en corporel, cinq en matériel, trois en risques divers, trois en recours) sont un chiffre de **démonstration**, pas l'effectif réel de la compagnie (FR-15). Il n'y a pas de rôle « assuré » : l'assuré n'a pas d'application (§2.2).

### 2.2 Hors cible (v1)

- **L'assuré n'a pas d'application à lui.** Il reçoit des messages : SMS, WhatsApp, e-mail (FR-18). Il se présente au guichet, il téléphone, il écrit. Le **chatbot de l'assuré** (assistant conversationnel, aide à la déclaration, état d'avancement) est **« bientôt »** (FR-22).
- **La CRCA ne se connecte pas.** Elle reçoit les états et les pièces que la compagnie produit et exporte ; le contrôle interne les prépare (UJ-7).
- Les courtiers, agents et coassureurs ne se connectent pas : ils sont **informés** par `notification` quand un sinistre touche leurs contrats (FR-18).
- La production (souscription, primes, encaissement des primes), la comptabilité officielle et la réassurance comptable restent dans le logiciel de la compagnie (FR-2).
- La banque, la microfinance et le distributeur ont leurs propres PRD.

### 2.3 Parcours clés

Les noms sont ceux du jeu de démonstration (FR-15) ; ils sont modifiables. Les montants du parcours UJ-3 sont ceux du dossier de référence `SIN-2026-9002`.

**UJ-1 — « Où en est mon dossier ? » : la réponse pendant l'appel.** Mawuli Dogbe appelle le guichet des sinistres : sa Nissan a été heurtée sur la route de Kpalimé et il n'a plus de nouvelles depuis plusieurs semaines. Afi, chargée d'accueil, tape son nom ; la fiche s'affiche en moins de 5 secondes. Elle lit : le dossier est **en validation** chez le responsable ; les cinq pièces obligatoires sont reçues ; le **montant évalué** est arrêté, **déjà payé** est zéro, le **reste à payer** est donc égal au montant validé à venir ; la dernière action est l'envoi en validation, hier, par Estelle, la gestionnaire. Afi répond tout de suite, sans « je vous rappelle ». Elle ajoute une note ; sa consultation est enregistrée à son nom. Elle ne voit rien du contenu médical d'autres dossiers et ne peut pas modifier le montant.

**UJ-2 — Un accident déclaré au guichet.** Dzifa Amouzou entre au guichet après un accrochage. Afi saisit la déclaration : police, date, lieu, véhicule, tiers. Le dossier reçoit **immédiatement** une référence de déclaration `DEC-` (exemple de format : `DEC-2027-00018`), imprimée sur l'accusé de réception remis à Dzifa. Prospera vérifie qu'il n'existe pas déjà une déclaration pour la même police, la même date, la même immatriculation et la même victime, dans Prospera **et** dans les sinistres reçus du logiciel de la compagnie. L'écran affiche **la liste exacte des pièces à fournir** pour ce type de sinistre ; Dzifa n'en a qu'une partie sur elle. Afi les scanne ; l'application lit chaque pièce, la reconnaît et la rattache à la pièce attendue. Le dossier passe en **pièces attendues** et Dzifa reçoit un SMS qui liste les pièces qui manquent. La déclaration part vers le logiciel de la compagnie. Après un délai variable selon le LC (FR-198), il renvoie le **numéro de sinistre officiel**, que Prospera rattache et affiche désormais partout. Dzifa est prévenue par SMS.

**UJ-3 — Le matériel de bout en bout, sur le modèle de `SIN-2026-9002`.** Collision à Lomé, véhicule de Mawuli Dogbe (police auto tous risques, franchise 10 %, minimum 50 000 FCFA), responsabilité partagée avec un tiers. Afi **déclare** et ouvre le dossier en attente de pièces ; le dépôt des sept pièces de l'assuré complète le dossier, qui passe **ouvert**. Komi, le responsable, **attribue** le dossier à Estelle, avec un motif. Estelle **instruit**. Le cabinet de l'expert initial remet son rapport par courrier ; Estelle le saisit, joint le PDF, le marque « saisi pour le cabinet ». Le rapport retient 445 500 FCFA contre un devis de garage de 1 273 000 : **l'écart** (65 %) est signalé avec la question à poser à l'expert. Estelle demande un complément ; Komi ordonne une **contre-expertise** (le gestionnaire ne peut pas), confiée à un autre cabinet que celui du premier rapport, qui dépose son rapport depuis le portail expert et confirme 445 500. Une lecture interne des circonstances, proposée par l'assistant et retenue par Estelle, fixe la part du tiers à 70 %. Estelle enregistre la **décision de garantie** (garantie acquise, motif écrit, déclaration tardive notée en réserve), puis **évalue** : le décompte part du chiffrage validé de 445 500 FCFA, passe par la vétusté, **déduit la franchise** (10 %, minimum 50 000 FCFA) et vérifie le plafond ; l'**évaluation** est le **montant arrêté par Estelle, au franc près** ; le décompte est son repère, et un écart avec lui exige un motif (395 500 FCFA *(défaut H-003 : exemple de calcul ; le jeu de démonstration fixe la valeur exacte)*) ; la provision est révisée. Le montant est sous le seuil de délégation du responsable : Komi **valide** avec un motif. Prospera envoie l'**offre** à Mawuli sous 48 heures ouvrées ; Mawuli l'**accepte** et signe ; l'accord est enregistré. Pascal, le comptable, qui n'a pas décidé, **émet** le règlement par chèque (numéro et banque saisis). Afi **remet** le chèque contre quittance signée et pièce d'identité du retirant : le dossier est **réglé**, reste à payer zéro. Estelle **clôt** avec un motif écrit. Mensah, l'archiviste, **verse** le dossier au fonds : le numéro d'archivage `ARC-…` est attribué, la cote physique de la chemise est notée. Le recours contre le tiers continue seul (UJ-5). *Ce parcours est le parcours n° 1 : il doit se mener **à la main, rôle après rôle**, dans la démo, sur un dossier créé à l'écran (FR-16).*

**UJ-4 — Un préjudice corporel grave.** Kokou, motard, est renversé par un véhicule dont l'assureur de responsabilité est la compagnie. Le dossier corporel est suivi par Edoh, gestionnaire corporel. Le **chronomètre légal** se déclenche à la date de l'accident : l'offre est due dans les **12 mois** suivant l'accident, ou dans les **8 mois** suivant le décès si la victime meurt (Code CIMA, art. 231) ; la pénalité de **5 % par mois** de retard est affichée (art. 233, 236). À six mois, la consolidation n'est pas connue : Prospera propose une **offre provisionnelle**, et suit le délai de l'offre définitive. Les pièces médicales vont au **médecin-conseil** ; Afi, à l'accueil, voit seulement qu'un certificat est reçu. **L'IA ne propose aucun montant** : l'évaluation est le calcul poste par poste du barème corporel, saisi par Edoh avec l'avis du médecin-conseil. Le dossier dépasse le seuil du responsable : il passe au **comité sinistres**, puis reçoit le **visa du directeur technique**. L'accord de la victime est enregistré par un **procès-verbal de transaction**, qui rappelle son droit de le dénoncer dans les 15 jours (art. 235). Le règlement est libellé au nom de la victime (art. 232).

**UJ-5 — Le recours mené en parallèle.** Dans `SIN-2026-9002`, le tiers est en cause. Dès l'ouverture, une lettre de **mise en cause** part vers le tiers ou son assureur ; Sélom, gestionnaire recours, la relance **tous les 15 jours**. Le dossier de Mawuli est réglé et **clos** pendant que le recours continue. Une fois Mawuli payé, Sélom réclame le remboursement de la part du tiers (70 % de responsabilité) par subrogation ; le calcul du montant réclamé est au §5.10. L'assureur adverse propose moins ; l'IA évalue l'offre et prépare la contre-proposition ; Sélom décide. Le recours a sa propre machine d'états : il se clôt seul, quand l'argent est récupéré ou le recours abandonné avec motif. La **prescription biennale** est affichée comme un terme à vérifier, avec alerte 90 jours avant.

**UJ-6 — Le responsable sinistres, un lundi matin.** Komi ouvre son **brief du matin** : dossiers à risque, délais légaux qui expirent cette semaine, anomalies de la nuit, dossiers sans action depuis 30 jours, pièces attendues, règlements en attente de validation. Il voit la **charge** de chacun des gestionnaires et un dossier **bloqué** depuis plusieurs jours en attente d'un complément d'expert. Il relance l'expert, puis **réaffecte** les dossiers de Yao, absent, à Sélom, en un geste, avec un motif. Les dossiers réaffectés gardent tout leur historique. Il pose une question au Copilot (« Quels dossiers auto sont bloqués ? ») : la réponse cite ses chiffres et leur source.

**UJ-7 — Le contrôle interne prépare un contrôle de la CRCA.** Yawa, du contrôle interne, apprend qu'un contrôle sur pièces est annoncé. Elle exporte, pour l'exercice demandé, la liste des dossiers corporels avec leurs échéances légales, les **états de sinistres** par exercice de survenance, la provision dossier par dossier, et le **journal chaîné** de quelques dossiers tirés au sort : changements **et consultations**, au nom des agents. Elle repère un dossier où l'instructeur a validé son propre règlement : le contrôle bloque ce cas, elle vérifie qu'il n'a pas eu lieu. Rien n'est reconstitué à la main : le dossier de contrôle est prêt en une journée *(défaut H-004 : durée non mesurée ; à confirmer à la séance d'immersion)*.

**UJ-8 — L'informaticien suit la reprise et la resynchronisation.** Kossi, de la DSI de la compagnie, suit la **reprise des archives** que l'équipe de Money Vibes a lancée sur les dossiers en cours, puis sur l'historique. Il lit le **rapport de reprise** : dossiers récupérés, dossiers rejetés avec leur raison, écarts. Chaque nuit, la **resynchronisation** avec le logiciel de la compagnie s'exécute ; le matin, il voit combien de sinistres elle a rattachés et quels enregistrements elle a rejetés, par exemple faute de police. Il corrige la table de correspondance et relance. À aucun moment il ne lit le contenu d'un dossier : il voit des comptes, des états et des motifs de rejet.

**UJ-9 — La compagnie essaie la démo.** Une équipe de la compagnie reçoit l'accès à la démonstration : une **compagnie fictive** de 14 gestionnaires et d'environ 3 500 dossiers, branchée sur le **logiciel de compagnie fictif**. Elle **crée un vrai dossier** : une déclaration, qui reçoit sa référence `DEC-` et, un instant plus tard, un numéro de sinistre renvoyé par le logiciel fictif ; elle le mène, rôle après rôle, jusqu'au chèque (UJ-3). Rien n'est simulé à l'écran : chaque action est enregistrée et relue par les autres rôles.

---

## 3. Vocabulaire

Le vocabulaire commun est celui du PRD distributeur (PRD-D §3). Les termes propres à ce PRD :

| Terme | Sens dans ce PRD |
|---|---|
| **Dossier sinistre** | L'histoire d'un sinistre, de sa déclaration à sa clôture et à son archivage, tenue par Prospera. |
| **Déclaration** | L'acte par lequel l'assuré ou son représentant informe la compagnie d'un sinistre. Elle crée le dossier. |
| **Référence de déclaration (`DEC-AAAA-NNNNN`)** | La référence que Prospera donne **immédiatement** à la déclaration, avant tout numéro officiel. Elle reste un critère de recherche. C'est le « numéro attribué tout de suite » du récit du PO ; le numéro officiel vient du logiciel de la compagnie. |
| **Numéro de sinistre** | Le numéro **officiel**, détenu par le logiciel de la compagnie. Il s'affiche partout dès sa réception (FR-2). Un paramètre permet de confier plus tard l'attribution à Prospera. |
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
| **Décompte** | Le calcul qui mène du dommage à l'indemnité : dommage, vétusté, règle proportionnelle, plafond, franchise. |
| **Évaluation** | Le montant arrêté par le gestionnaire, **au franc près** ; le décompte est son repère. Une évaluation arrêtée n'est **jamais recalculée** si un barème change. |
| **Provision** | La charge estimée du dossier, tenue **dossier par dossier**, posée à l'ouverture et revue à chaque événement, avec motif (FR-2). |
| **Délégation** | Le pouvoir de valider un montant. Une matrice paramétrable fixe qui valide quoi (FR-8). |
| **Comité sinistres** | L'instance qui décide au-delà du seuil du responsable. Ce n'est pas un rôle. |
| **Partie au dossier** | Toute personne qui a accompli l'un des actes de la liste fermée de FR-29 (affecter, instruire, évaluer, valider, contrôler, enregistrer l'accord, émettre, remettre, rapprocher). |
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
| **Évalué** | Le montant arrêté par le gestionnaire ; le décompte est son repère ; un écart avec le décompte exige un motif. |
| **Proposé** | Le montant de l'**offre** faite à l'assuré. |
| **Validé** | Le montant approuvé par la personne ou l'instance qui a la délégation. |
| **Payé** | Ce qui a été réglé, tous règlements confondus. |
| **Reste à payer** | Le validé moins le payé. Le dossier passe à `REGLE` quand il est zéro. |

**Arrondi.** L'arrondi à 5 000 FCFA ne vaut que pour les montants **calculés par le système** (provision d'ouverture, indemnité proposée par un formulaire d'instruction). Le montant **arrêté** par le gestionnaire est **au franc près** (395 500 FCFA pour `SIN-2026-9002`).

À côté de ces cinq montants, la **provision** est une charge estimée tenue pour l'exercice : elle n'est ni l'évalué, ni le proposé, ni le validé. Le dossier de référence `SIN-2026-9002` montre pourquoi : devis du garage 1 273 000, chiffrage de l'expert 445 500, évaluation arrêtée 395 500 (445 500 moins la franchise minimale de 50 000, D15), provision d'ouverture 780 000 puis réajustée à l'évaluation, estimation par comparables 555 000 : **aucun de ces chiffres n'est fondu avec un autre**.

---

## 4. Partie 1 — Les règles transverses

Ces exigences valent pour **tous** les modules des parties 2, 3 et 4.

### 4.1 Les règles du PRD distributeur s'appliquent

#### FR-1 : Les règles transverses du PRD distributeur valent ici

Les règles suivantes du PRD distributeur s'appliquent à tous les modules de ce PRD, sans être réécrites : tout s'enregistre côté serveur (PRD-D FR-1) ; les boutons pas encore branchés sont « bientôt », sans date, jamais simulés (PRD-D FR-2) ; les enchaînements entre rôles sont des étapes enregistrées (PRD-D FR-3) ; une seule table d'accès, appliquée par le serveur (PRD-D FR-5, PRD-D FR-6) ; chaque rôle a sa vue (PRD-D FR-7) ; les données privées restent privées (PRD-D FR-8) ; les garde-fous bloquent (PRD-D FR-13) ; un modèle unique d'alerte et de décision (PRD-D FR-14) ; tout indicateur se calcule depuis les données (PRD-D FR-15) ; une prédiction dit d'où elle vient (PRD-D FR-16) ; de vrais documents et des exports (PRD-D FR-17, PRD-D FR-18) ; chaque module est installable seul (PRD-D FR-19).

**Conséquences (testables) :**
- Chaque test de recette des FR cités du PRD distributeur est rejoué sur les écrans de la compagnie, avec le vocabulaire de la compagnie (§3). La démo actuelle garde ses données dans le navigateur de chacun : le test « recharger la page, changer d'appareil » (PRD-D FR-1) passe en premier.
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
| Traités de réassurance et clés de coassurance du référentiel | **Prospera** tient un référentiel daté, saisi ou importé de la compagnie *(défaut H-005 : les traités ne sont pas dans le LC ; à confirmer à la séance d'immersion)* | la cession et la coassurance sont calculées par Prospera sur le dossier |
| **Comptabilité officielle**, écritures, primes, réassurance comptable | **la compagnie** (hors de Prospera) | Prospera fournit un **état et un export** ; le rapprochement bancaire des chèques et du Mobile Money se fait dans `paiement` (FR-224) |
| Journal du dossier | **Prospera** | — |

Si le LC ne peut pas recevoir (interface absente ou en panne), Prospera produit une **liste « à saisir dans le logiciel de la compagnie »**. L'agent qui y saisit une déclaration **reporte** dans Prospera le numéro obtenu. Un dossier **sans numéro officiel depuis plus de 1 jour ouvré** est une alerte au responsable (paramètre). Le contrôle de doublon porte sur la police, la date de survenance, l'immatriculation et la victime, dans Prospera **et** dans les sinistres reçus du LC.

**Conséquences (testables) :**
- Aucun écran de Prospera n'affiche un contrat, une garantie ou une prime comme officiel sans dire de quand date la dernière lecture du LC.
- La déclaration reçoit sa référence `DEC-` à l'enregistrement, avant toute réponse du LC ; elle figure sur l'accusé remis à l'assuré ; elle reste un critère de recherche une fois le numéro officiel reçu.
- Une déclaration renvoyée par le LC avec un numéro officiel est **rattachée** sans doublon : rejouer le même échange ne crée ni un second dossier ni un second numéro.
- Un test met le LC fictif hors service : les dossiers se créent, la liste « à saisir » se remplit, puis se vide à mesure que les numéros sont reportés.
- Le paramètre « qui attribue le numéro » (LC ou Prospera) change l'attribution sans modification du code : un test le bascule sur le LC fictif.
- Dans la démonstration, le **logiciel de compagnie fictif** tient tout ce que le tableau attribue au LC (§6.5).
- Un dossier sans numéro officiel depuis plus d'1 jour ouvré apparaît dans le brief du responsable (UJ-6).

#### FR-3 : Les contrats sont lus, jamais modifiés

Prospera lit les polices et les garanties par une **projection datée** du LC. Le contrôle de recevabilité (police en vigueur, prime payée, garantie souscrite, délai de déclaration) s'appuie sur cette projection et **affiche la date de la dernière lecture** (D4). **Le contrôle de garantie ne peut pas être sauté** : si l'information manque, le gestionnaire enregistre une **décision motivée** (`GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, motif d'au moins 10 caractères), visible par le contrôle interne. Le détail du contrôle est au §5.2 (FR-41, FR-42) ; la projection et son échange sont au §6.4 et à l'annexe C.

**Conséquences (testables) :**
- Aucun appel de Prospera n'écrit dans les contrats du LC ; un test inspecte les échanges sortants vers le LC fictif et n'y trouve aucune écriture sur un contrat.
- La transition vers l'évaluation est **refusée** sans décision de garantie enregistrée ; un test tente de la sauter avec chaque rôle.
- La projection a un âge maximal paramétrable. Au-delà, le contrôle de recevabilité affiche « données du … » et demande une relecture (`liaison.age_max`, annexe D : **5 minutes** avec une interface, **24 heures** avec des fichiers *(défaut H-006 : valeurs de l'annexe D reprises du modèle de la microfinance ; à confirmer à la séance d'immersion)*).
- Une déclaration tardive n'entraîne **jamais** une déchéance automatique : la réserve et son motif sont enregistrés, le responsable décide (décision D15 ; Code CIMA art. 20, qui exige la preuve d'un préjudice).

### 4.3 Tout seuil est un paramètre de la compagnie

#### FR-4 : Les seuils de la démo sont des valeurs par défaut

Tout seuil, délai, montant, taux, tolérance ou liste métier (pièces obligatoires par type de sinistre, barèmes de vétusté, franchises, seuils de délégation, délais de relance, seuils d'expertise, listes d'experts) et tout **modèle de document** (lettres, quittances, lettre de mission, bordereaux, chèques) est un **paramètre de la compagnie**, versionné et daté, réglé par l'administrateur **sous la validation d'un rôle métier**. Les valeurs de la démo, du plan et des sources sont les **valeurs par défaut**. L'**annexe D** les rassemble toutes et fait foi en cas d'écart avec une FR. Ainsi le PRD évolue à la séance d'immersion sans reprise du code. Quand une FR et l'annexe D divergent, on corrige la FR pour qu'elle porte la valeur de l'annexe D (sauf sous un plancher légal : le plancher légal l'emporte partout). En cas de doute, une FR écrit « voir `paramètre`, annexe D ». Le **référentiel légal** (D.5), que la compagnie ne modifie pas, se met à jour par une procédure écrite : fournisseur du texte, relecture du juriste, **date d'effet**, double contrôle, journal.

**Conséquences (testables) :**
- Changer un paramètre ne modifie pas un dossier déjà engagé : un dossier garde les règles en vigueur à sa **date de survenance** pour ce qui est légal (FR-14), et à son **ouverture** pour ce qui est interne.
- Chaque changement de paramètre est enregistré : ancienne valeur, nouvelle valeur, auteur, validateur, date.
- Aucun seuil du PRD n'est écrit dans le code : un test change chaque paramètre listé à l'annexe D et vérifie l'effet.
- Les **délais légaux** (FR-14) ne sont pas des paramètres de la compagnie : ils sont un référentiel versionné qu'elle ne modifie pas.
- Chaque mise à jour du référentiel légal est journalisée : fournisseur du texte, relecteur juriste, date d'effet, auteur du double contrôle.
- Un modèle de document modifié crée une **nouvelle version** ; les documents déjà émis gardent la version d'origine.
- Test de recette : aucune valeur d'un paramètre de l'annexe D n'est écrite en dur dans le code ; une valeur citée dans une FR est la valeur par défaut de son paramètre (annexe D).

#### FR-5 : Les seuils d'alerte se calibrent sur les données reprises

Les **seuils d'alerte** (retard, provision, charge, silence d'un dossier, écart d'expertise, concentration d'émission, signaux de fraude) ne sont pas figés sur les valeurs de la démo, qui sont des chiffres de jeu. À la reprise des données, Prospera calcule une **proposition de seuil** par alerte à partir de l'historique repris de la compagnie. Un humain la valide. Prospera la recalcule ensuite à intervalle régulier, par percentiles de la compagnie (défaut, annexe D *(défaut H-007 : chaque trimestre ; modèle de la microfinance)*). Les **grilles de provision** se calibrent par des paramètres propres : marge de fiabilité, amplitude, occupation, concentration, ancienneté, tranches mortes *(défaut H-008 : valeurs de la démo comme défauts ; à confirmer à la séance d'immersion)*. Une **alerte de grille périmée** prévient le rôle qui possède la grille quand celle-ci n'a pas été revue dans le délai fixé.

**Conséquences (testables) :**
- Chaque seuil d'alerte affiche sa source : « valeur de démonstration », « calculé sur vos données du … », ou « fixé par … le … ».
- Un seuil calculé n'entre en vigueur qu'après validation par le rôle qui possède l'alerte.
- Les valeurs de la démo (par exemple l'écart d'expertise de 15 % et 35 %, le silence d'un dossier à 8, 15 et 30 jours) ne sont reprises qu'en l'**absence** de données reprises.
- Un test change chaque paramètre de calibration d'une grille de provision et vérifie l'effet sur la provision proposée ; une grille non revue depuis son délai lève l'alerte « grille périmée ».

### 4.4 Rôles, périmètres et séparation des tâches

#### FR-6 : Quatorze rôles, un périmètre par rôle

Les quatorze rôles du §2.1 existent dès l'installation. Le serveur applique le périmètre de chacun : tous les dossiers (DG, DT, RESP, AUD en lecture seule pour les décisions : il signale une suspicion de fraude et rend un avis écrit) ; **son volet** (GEST : corporel, matériel ou risques divers) ; **les dossiers en recours** (GREC) ; **ses missions** (EXPI, EXPE) ; les recherches, le guichet et le statut des dossiers sans le contenu médical (ACC) ; les lots de numérisation (NUM) ; le fonds (ARCH) ; les ordres de règlement et les paiements (CPT). La table d'accès par écran et par droit est à l'annexe B. Une personne peut cumuler des rôles, sauf si la séparation des tâches l'interdit (FR-7).

**Conséquences (testables) :**
- Un GEST du volet matériel qui interroge un dossier corporel reçoit « introuvable », sans donnée.
- EXPE ne voit que ses missions : ni la provision, ni les autres missions, ni le reste du dossier ; un test ouvre le portail avec un cabinet et vérifie chaque écran.
- Un filtre vide ne retombe jamais sur « tous les dossiers ».
- Les comptes sont créés par ADMIN ; les rôles qui instruisent, décident ou autorisent de l'argent (GEST, GREC, MED, RESP, DT, DG, CPT) ne sont actifs qu'après la validation d'un **rôle métier** (DG), jamais d'un second administrateur *(défaut H-009 : règle reprise de la microfinance ; à confirmer à la séance d'immersion)* ; AUD lit le journal des créations et des retraits.
- **ADMIN ne lit aucune donnée métier par l'application** : un test ouvre chaque écran métier avec ce rôle et vérifie le refus. L'accès direct à la base sur un serveur que la compagnie administre elle-même reste un **risque résiduel assumé** : il est réduit par le chiffrement des champs sensibles (pièces d'identité, téléphones, données de santé) et par le journal chaîné (FR-13).
- Les écrans d'administration de `ADMIN` comprennent, en plus des comptes et des paramètres, le **simulateur et l'impression des grilles** et la **liste des courriers sortants avec impression groupée** ; ils ne donnent aucune lecture métier.
- Les rôles s'attribuent par les droits du contrat de module, sans déploiement (PRD-D FR-4).

#### FR-7 : Séparation des tâches

Une même personne ne peut pas cumuler, **sur un même dossier**, les actes suivants. Le serveur refuse chaque cumul interdit avec le code `SEPARATION_DES_TACHES` et un libellé clair. Les actes qui rendent une personne **partie au dossier** sont ceux de la liste fermée de FR-29.

- **SEP-01 : l'instructeur ne valide pas.** Une personne qui a instruit le dossier (acte de partie, FR-29) ne valide pas son évaluation ni son règlement, et ne siège pas pour le valider au comité.
- **SEP-02 : celui qui décide ne paie pas.** Celui qui valide un règlement ne l'émet pas, ne saisit pas son chèque et ne le remet pas ; le comptable n'a aucun droit de décision sur un règlement.
- **SEP-03 : délégation et anti-fractionnement.** Un montant se valide au niveau que la matrice de délégation lui fixe (FR-8). Le cumul qui décide du niveau est la somme des montants **acceptés et ordonnés non annulés** du dossier, plus le montant **en cours de validation** ; une offre remplacée et jamais payée ne compte pas. Fractionner un montant ne contourne donc pas un seuil. Le même cumul s'applique à la **provision totale** du dossier (FR-78) : fractionner une révision de provision ne contourne pas non plus un seuil.
- **SEP-04 : l'ordre de règlement a un second contrôle.** L'ordre préparé par un `CPT` est **validé par une autre personne** : un **second `CPT`**, distinct de celui qui prépare ; au-dessus d'un seuil paramétré (`reglement.second_controle_seuil`, défaut *(défaut H-010 : 5 000 000 FCFA)*), le `DG` le valide aussi. Ce second contrôle n'est pas une décision de règlement.

La liste complète des **16 cumuls interdits**, valable pour **tous** les moyens de paiement :

| # | Cumul interdit sur un même dossier | Règle |
|---|---|---|
| 1 | Instruire et valider | SEP-01 |
| 2 | Décider (valider) et émettre le règlement | SEP-02 |
| 3 | Émettre le règlement et le remettre au bénéficiaire | chaîne **ordre, chèque, remise** assurée par trois personnes différentes ; `ACC` remet, `CPT` ne remet que ce qu'il n'a pas émis |
| 4 | Décider et remettre le chèque | SEP-02 |
| 5 | Émettre un règlement et en rapprocher le paiement | deux personnes *(défaut H-011 : règle de contrôle interne ; à confirmer)* |
| 6 | Modifier les coordonnées bancaires d'un bénéficiaire et émettre le règlement à son profit | deux personnes *(défaut H-012 : règle de contrôle interne, liée à l'alerte de changement de coordonnées avant paiement ; à confirmer)* |
| 7 | S'attribuer à soi-même un dossier | l'attribution est un acte du `RESP`, **sans exception** ; un dossier non affecté depuis 1 jour ouvré va au `RESP` ; si le `RESP` instruit lui-même, il ne valide pas et ne siège pas au comité pour ce dossier |
| 8 | Ordonner une contre-expertise sans en avoir le droit | seuls RESP, DG et DT l'ordonnent ; le gestionnaire ne peut pas |
| 9 | Juger la contestation d'un rapport en étant son auteur | le cabinet ou l'expert **auteur du rapport contesté** ne fait pas la contre-expertise ; l'expert interne ne reçoit pas une contre-expertise |
| 10 | Reconstituer un dossier et certifier sa reconstitution | la certifient DG, RESP ou AUD, **jamais celui qui l'a reconstitué** |
| 11 | Valider un dossier dont on est l'assuré, la victime ou le bénéficiaire | conflit d'intérêts *(défaut H-013 : règle de prudence ; à confirmer)* |
| 12 | Verser au fonds sans être archiviste | seul ARCH verse au fonds |
| 13 | Instruire et enregistrer l'accord de l'assuré | l'accord est enregistré par `ACC` ou par un agent qui n'est pas partie au dossier (FR-29), sur la pièce originale signée |
| 14 | Valider et enregistrer l'accord de l'assuré | même règle que la ligne 13 |
| 15 | Émettre le règlement et faire signer la quittance | la quittance est marquée `SIGNEE` par un agent distinct de celui qui a émis |
| 16 | Lever un blocage fraude `BLOQUE` après avoir affecté, instruit, validé ou siégé au comité de ce dossier | le relecteur n'est pas partie au dossier ; l'avis écrit d'`AUD` est obligatoire |

**Conséquences (testables) :**
- Chaque ligne du tableau (les **16** cumuls) est un test : le serveur refuse l'acte du second rôle, avec le code `SEPARATION_DES_TACHES`.
- Un dossier dont le cumul (montants acceptés et ordonnés non annulés, plus le montant en cours de validation) dépasse le seuil du niveau qui a validé les premiers est **remonté** au niveau supérieur ; un test fractionne un règlement en tranches chacune sous le seuil et vérifie la remontée.
- Une offre remplacée jamais payée ne compte pas dans le cumul : un test remplace une offre de 800 000 FCFA par une autre de 800 000 FCFA et ne voit aucune remontée ; avec la première offre payée, la remontée a lieu.
- Un ordre dont le second contrôle est fait par la personne qui l'a préparé est refusé ; au-dessus du seuil `reglement.second_controle_seuil`, un ordre sans validation du `DG` est refusé.
- Un dossier non affecté depuis 1 jour ouvré apparaît dans la file du `RESP` ; un `GEST` ne peut pas se l'attribuer ; un `RESP` qui a instruit ne peut ni valider ni siéger au comité pour ce dossier.
- Un contrôle d'anomalie (plan de contrôle du contrôle interne, §6.7) recherche les cumuls qui auraient échappé : la tolérance est **zéro**, la gravité est **critique** pour SEP-01 et SEP-02.
- La personne qui s'absente peut **déléguer** (le DG pour le responsable, par exemple) par une **délégation explicite**, datée, motivée et tracée ; hors de ses dates, elle n'agit plus ; AUD la voit dans le journal. La règle de cette **suppléance** (durée, limite du délégant, personne nommée) est à FR-78 : elle ne dépasse jamais la limite du délégant et ne lève aucun cumul interdit.

#### FR-8 : La matrice de délégation est un paramètre

Qui valide quoi se lit dans une **matrice paramétrable** : niveau, rôles signataires, quorum, plage de montant, volet, nature (indemnité, honoraires, acompte, règlement à titre commercial). Les défauts, *(défaut H-014 : délégations réelles à obtenir de la compagnie ; défauts repris de la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer à la séance d'immersion)*, sont :

- **Niveau 1, jusqu'à 1 000 000 FCFA** (1 000 000 inclus) : proposition de l'instructeur, **contrôle** par un second agent du volet (un autre `GEST` désigné contrôleur, ou le `RESP`), **validation** par le `RESP`. Le contrôleur et le validateur sont deux personnes distinctes de l'instructeur *(défaut H-015 : procédure décrite dans le récit du PO ; tout est paramétrable)*.
- **Au-delà de 1 000 000 FCFA** : le **comité sinistres** (quatre membres dont le responsable sinistres et le directeur technique ; quorum de trois), puis le **visa du directeur technique**.
- **Règlement à titre commercial** (hors garantie) : décidé par le **DG seul**, quel que soit le montant.
- **Honoraires** : un **plafond d'honoraires par niveau** ; au-dessus, le comité. Le visa des honoraires est donné par le `RESP`, **jamais par le `CPT`**.

**Limites distinctes.** Comme les profils de limites d'autorité des éditeurs de sinistres, la matrice porte, pour chaque rôle, une **limite de provision** et une **limite de paiement** séparées, avec un cumul anti-fractionnement sur chacune. Une **suppléance** est une délégation temporaire datée, tracée, qui ne dépasse jamais la limite du délégant. Le détail et les valeurs par défaut sont à FR-78.

Le **comité** a une composition et des règles écrites. Ses **membres sont nommés à la mise en service** (liste obligatoire, un suppléant par siège, nommé par la matrice) ; en cas d'**égalité**, la voix du président l'emporte ; son **délai de tenue** est paramétré (défaut 5 jours ouvrés), avec une alerte et un repli par délibération écrite. Si le `DT` a voté au comité, le `DG` donne le **visa**.

**Frontière.** 1 000 000 FCFA exactement relève du niveau 1 (« jusqu'à »). Le mémoire de 2014 écrit « à partir de 1 000 000 = collégial » : l'écart est signalé *(défaut H-016 : frontière retenue par le PRD ; à confirmer à la séance d'immersion)*. Le seuil unique de 2 000 000 FCFA de la démo n'est pas repris. Le détail du circuit de décision est au §5.7 (FR-77 à FR-81).

**Conséquences (testables) :**
- Changer le seuil, le quorum ou les membres du comité prend effet sur les **nouvelles** validations, pas sur celles déjà prises ; chaque changement est tracé (FR-4).
- Un montant au-dessus du seuil du responsable ne peut pas être validé par lui : le serveur refuse, la fiche part au comité.
- Un montant de 1 000 000 FCFA exactement suit le niveau 1.
- Le niveau 1 refuse une validation sans contrôle fait par une troisième personne : le contrôleur et le validateur sont deux personnes distinctes de l'instructeur.
- Un visa d'honoraires donné par `CPT` est refusé ; un honoraire au-dessus du plafond de son niveau part au comité.
- Un règlement à titre commercial refuse toute validation autre que celle du DG.
- Le quorum non atteint empêche la décision du comité ; un test valide avec deux membres sur quatre et vérifie le refus.
- Une mise en service sans liste de membres du comité (titulaires et suppléants) est refusée.
- La matrice porte une limite de provision et une limite de paiement par rôle ; un test change l'une sans changer l'autre (FR-78).

### 4.5 Les données de santé

#### FR-9 : Les données de santé sont des données sensibles

Un dossier corporel contient des **données de santé** : certificats médicaux, taux d'incapacité, rapports d'expertise médicale, pièces du médecin-conseil. Elles sont des **données sensibles** au sens de la loi togolaise n° 2019-014 (art. 21 : le traitement est interdit en principe, sauf les exceptions de l'art. 22, dont le consentement écrit, la défense d'un droit en justice, l'exécution du contrat ou une obligation légale). Prospera **étiquette** chaque champ et chaque pièce de santé et en restreint l'accès :

- elles sont **lisibles par MED, par le GEST corporel affecté au dossier et par RESP** ;
- **DG et DT** les lisent par un **accès par dossier ouvert à la validation**, journalisé ;
- **ACC et NUM voient le type et l'existence** d'une pièce médicale, **jamais son contenu** : ni aperçu, ni extrait de l'IA, ni résumé ;
- le **contrôle de qualité** d'une pièce médicale se limite à la **lisibilité de l'image** (ou est fait par MED, ou par ARCH pour cette seule lisibilité) ;
- **chaque lecture est journalisée** (art. 52 : traçabilité des personnes qui accèdent aux données lues) ;
- aucune donnée de santé ne sort de la compagnie (FR-12, FR-232).

**Base légale.** Le traitement des données de santé pour indemniser relève de l'**obligation légale** d'offre et de l'**exécution du contrat**. Le consentement est recueilli à la déclaration, mais **son absence ne bloque jamais** une obligation légale (offre, délais) ni le chronomètre *(point juridique J-01 : base légale retenue ; à valider par le juriste, §13.2)*.

**Conséquences (testables) :**
- Un test ouvre une pièce médicale avec chaque rôle : MED, GEST corporel affecté et RESP la lisent ; DG et DT la lisent par un accès par dossier ouvert à la validation, journalisé ; ACC et NUM n'en voient que le **type et l'existence** (ni aperçu, ni extrait de l'IA, ni résumé) ; CPT, AUD, ADMIN n'en voient que l'existence et la date ; ARCH aussi, plus la seule image quand il contrôle la lisibilité ; un GEST d'un autre dossier n'y a aucun accès.
- Le contrôle de qualité d'une pièce médicale par `ACC` ou `NUM` ne montre que la lisibilité de l'image : un test vérifie qu'aucun texte lu n'est affiché.
- Chaque lecture d'une donnée de santé crée une entrée du journal : qui, quand, quel dossier, quelle pièce (FR-13) ; AUD la lit.
- Le **consentement écrit** est tracé **par dossier**. Son absence ne bloque pas le dossier : une offre due, un délai légal et le chronomètre continuent ; l'absence est notée au dossier.
- Les champs et pièces de santé sont **chiffrés** au repos ; leur durée de conservation est une règle par catégorie (annexe D).
- Un cabinet d'expertise médicale externe ne reçoit que les pièces **nécessaires à sa mission** *(défaut H-017 : règle de minimisation ; à confirmer à la séance d'immersion)*.
- Ce que le gestionnaire lit des travaux du médecin-conseil est limité par défaut aux **conclusions** nécessaires à l'évaluation, pas au dossier médical complet *(point juridique J-02 : règle du secret médical à confirmer par le médecin-conseil et le juriste)*.
- Le régime exact de formalité auprès de l'instance de protection des données (déclaration ou autorisation) pour les dossiers corporels est **à vérifier par le juriste** (FR-24).

### 4.6 L'IA dans le processus

#### FR-10 : L'IA est spécifiée ici, servie par l'IA commune

Les capacités d'IA font partie du produit de la compagnie, **sur tout le circuit, dès le premier jour** (décision du PO), **sauf la voix**. Chaque section de ce PRD les écrit comme des exigences : entrée, sortie, destinataire, garde-fou. Le **moteur** qui les sert est l'**IA commune**, une famille de modules à part, partagée par toutes les verticales (§7.4). Ce PRD dit **ce que l'IA fait pour la compagnie** ; l'IA commune dit **comment**. Les quatorze usages sont ceux de la proposition v2 ; trois capacités de la démo s'y ajoutent.

**Où est l'IA, et où elle est spécifiée :**

| # | Usage | Ce que l'IA fait (entrée, sortie, destinataire) | Spécifié en |
|---|---|---|---|
| 1 | **Déclaration assistée** | message **WhatsApp** ou **e-mail** de l'assuré (jamais l'appel) → fiche de déclaration pré-remplie, chaque champ avec sa confiance, questions à poser ; destinataire : ACC | §5.1 |
| 2 | **Lecture et classement des pièces** | pièce scannée ou téléversée, par **OCR réel** → type reconnu, données relevées avec l'extrait d'où chacune a été lue (**jamais montré à `ACC` ni à `NUM` pour une pièce médicale**, FR-9), rattachement à la pièce attendue ; destinataire : le déposant (ACC, NUM, GEST) | §6.2 |
| 3 | **Contrôle des pièces** | pièces du dossier → incohérences (propriétaire de la carte grise, dates, photo déjà utilisée ailleurs), signalées avant l'instruction ; destinataire : GEST | §5.4 |
| 4 | **Pièces manquantes et relances** | dossier → liste des pièces manquantes, relance rédigée pour le canal (SMS, WhatsApp, e-mail) ; destinataire : ACC, GEST | §5.2 |
| 5 | **Résumé sourcé du dossier** | dossier → résumé où chaque information renvoie à sa pièce d'origine ; destinataire : GEST, RESP | §6.1 |
| 6 | **Recherche en langage naturel** (texte) | question libre en français → réponse chiffrée et dossiers, sources citées ; lecture seule | §6.1 |
| 7 | **Pré-remplissage de l'instruction** | pièces reçues → valeurs du formulaire technique, avec la pièce source de chaque champ ; destinataire : GEST, qui relit | §5.4 |
| 8 | **Analyse des devis** | devis → surcoûts ligne par ligne (catalogue de pièces, main-d'œuvre, historique du garage) ; destinataire : GEST, RESP | §5.5 |
| 9 | **« Pourquoi ce montant ? »** | décompte → explication de la garantie, de la vétusté, de la franchise et des plafonds ; destinataire : GEST, RESP ; **en corporel, il restitue le calcul saisi par l'humain** (FR-11) | §5.6 |
| 10 | **Détection de fraude** | portefeuille → liens entre dossiers (témoins, garages, photos, téléphones), graphe affiché sur le dossier, avant paiement ; destinataire : le contrôle (revue humaine) | §5.12 |
| 11 | **Rédaction des courriers** | dossier → offre d'indemnité, refus motivé, réponse à une réclamation, relus puis signés par l'agent | §5.7 (offre), §5.11 (refus), §6.1 (réclamations) |
| 12 | **Recours** | offre de l'assureur adverse → appréciation et contre-proposition ; mise en demeure rédigée ; destinataire : GREC | §5.10 |
| 13 | **Brief du matin et veille** | portefeuille du rôle → dossiers à risque, délais qui expirent, anomalies de la nuit ; destinataire : DG, RESP | §6.7 |
| 14 | **Qualité du dossier et simulation « et si… »** | dossier → note de qualité ; paramètres → effet d'une décision sur la charge ; destinataire : direction, contrôle | §6.7 |
| + | **Orientation d'expertise assistée**, **complétude d'un rapport d'expert**, **comparaison au portefeuille** | dossier ou rapport → besoin d'expertise proposé (« à confirmer »), points manquants du rapport, écart au portefeuille ; destinataire : GEST | §5.5 |

**Ce que l'IA ne fait pas au premier jour (FR-22).** Toute **dictée, transcription d'appel ou synthèse vocale** : la « déclaration assistée » prend le texte de WhatsApp et de l'e-mail, pas la voix. Le **chatbot de l'assuré** est « bientôt » *(défaut H-018 : la proposition v2 ne le prévoit pas, le deck du 12/09 oui ; à confirmer à la séance d'immersion)*.

**Règles communes à toutes ces capacités :**
- **Provenance** affichée sur chaque proposition : règle ou modèle, version, date de calcul, **source jusqu'à la pièce** (PRD-D FR-16). Le mot « IA » ne s'affiche que pour un **modèle** ; **tant qu'aucun modèle n'existe, des règles explicables servent la capacité, et l'écran le dit**.
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
- **Aucune proposition de montant sur un préjudice corporel.** Ni le gestionnaire ni le médecin-conseil ne reçoivent de l'IA un montant, une fourchette, une médiane de comparables ou une offre suggérée sur un dossier corporel. Le calcul du barème corporel est un calcul poste par poste fait par un humain (§5.6). Un **filtre par volet** s'applique à toutes les comparaisons, aux écarts à la provision d'ouverture et aux fiches de décision : liste blanche des volets (matériel, risques divers) ; jamais de médiane, de comparable ni d'écart en pourcentage sur un dossier `corporel`. La provision d'ouverture corporelle est **saisie par l'humain**, avec motif (FR-49).
- **Chaque information est sourcée** jusqu'à la pièce, au paragraphe ou au champ d'où elle vient ; une information sans source n'est pas affichée (« rien n'est inventé »).
- **L'IA n'est jamais bloquante** : si elle est coupée ou lente, son emplacement le dit et le circuit avance sur l'analyse humaine.
- **Un signal n'est pas une accusation** : un signal de fraude ouvre une **revue humaine** ; ce n'est pas l'IA qui bloque un paiement, c'est la règle de garde-fou (PRD-D FR-13) appliquée à la revue.
- **Un humain qui s'écarte d'une recommandation écrit un motif** ; l'écart et le motif sont enregistrés et renvoyés comme correction à l'apprentissage (FR-12).
- **Un motif proposé par l'IA n'est jamais repris par un clic seul** : c'est un texte que l'humain relit et modifie. Le **taux de motifs identiques à la proposition** est mesuré et signalé à `AUD`. Un motif proposé par l'IA est **interdit** pour les validations au-dessus du seuil du `RESP` (FR-8).
- **Toute décision reste défendable** (FR-26) : l'IA explique et cite ses sources ; elle ne remplace ni la pièce, ni la règle, ni le motif, ni l'auteur.

**Conséquences (testables) :**
- Sur un dossier corporel, un test appelle chaque capacité d'estimation (comparables, « pourquoi ce montant », orientation, simulation) : aucune ne rend de montant proposé, de fourchette ni de médiane ; le serveur refuse la demande avec un code nommé.
- Aucune action de validation, de refus ou de paiement ne peut être déclenchée par l'IA : un test inspecte les droits du compte de service de l'IA et n'y trouve que la lecture et l'écriture de **propositions**.
- Une proposition sans source n'est pas affichée : un test supprime la source d'une proposition et vérifie qu'elle disparaît.
- Un test coupe l'IA en pleine instruction : le gestionnaire finit l'évaluation à la main, sans message d'erreur bloquant.
- Un refus de proposition (rejet) sans motif est refusé quand la proposition est une **recommandation** ; il peut être sans motif pour une **extraction**.
- Le filtre par volet est testé **par écran**, pas par usage : la fiche, la comparaison, l'écart à la provision d'ouverture, la fiche de décision et le tableau de bord ouvrent chacun un dossier `corporel` et n'y montrent ni médiane, ni comparable, ni écart en pourcentage.
- Un motif de validation proposé par l'IA, validé par un clic seul, est refusé ; au-dessus du seuil du `RESP`, un motif proposé par l'IA est refusé ; le taux de motifs identiques à la proposition figure dans le rapport d'`AUD`.

#### FR-12 : Le registre de l'IA et l'instance locale

Chaque action de l'IA est inscrite au **registre de l'IA** : **entrée, sortie, niveau de confiance, sources, niveau** (`EXTRACTION`, `ANALYSE` ou `RECOMMANDATION` ; le niveau « décision » n'existe pas), **statut** (`PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`) et **auteur de la décision**. L'agent accepte, modifie ou rejette ; le registre garde sa réponse. La fiche d'un dossier montre la **chaîne de décision**, lue dans le registre : suggestion de l'IA, modifiée, validée, émise, par qui et quand. AUD et RESP lisent le registre. Chez la compagnie tourne une **instance locale** de l'IA commune, sur son serveur (§7.4). Elle prédit à partir des seules données de la compagnie, **enregistre l'écart** entre ses prédictions et ce qui arrive, **anonymise** ces écarts et **reçoit ses mises à jour** par un tunnel sécurisé sortant. **Aucune donnée nominative et aucune donnée médicale ne sort de la compagnie.** L'IA **ne se met pas à jour seule** : une mise à jour est versionnée, essayée, retirable.

**Conséquences (testables) :**
- Aucune action de l'IA n'échappe au registre : un test compare le nombre de propositions affichées au nombre d'entrées du registre.
- Le niveau `DECISION` n'est jamais produit : un test le cherche dans le registre d'une installation de démonstration.
- La fiche d'un dossier montre, pour chaque proposition de l'IA, la chaîne suggestion, modification, validation, émission, avec l'auteur et l'heure de chaque maillon ; un test la compare au registre.
- Un test inspecte un envoi sortant vers l'IA commune et n'y trouve **aucun identifiant, aucun nom, aucun téléphone, aucune donnée de santé** ; un test sur une installation sans consentement (FR-19) ne trouve **aucun envoi**.
- Une mise à jour de modèle reçue est **versionnée**, essayée dans l'espace d'essai, puis promue à la date que la compagnie choisit, et **retirable** ; le modèle d'avant est conservé.
- Le registre est conservé **dix ans** comme le journal (FR-13).

### 4.7 La trace

#### FR-13 : Qui a fait quoi, qui a lu quoi, et quand

Chaque **changement** d'état d'un dossier, d'un règlement, d'un paramètre ou d'un droit, et **chaque consultation** d'un dossier ou d'une pièce, est inscrit au **journal**, **horodaté par le serveur** (une **horloge unique et croissante**, côté serveur), **au nom de l'agent** (jamais un compte partagé), avec son rôle, l'état d'avant et d'après, et le **motif** quand il en faut un (tout refus, tout classement, toute décision sensible). L'application ne peut pas modifier le journal. Il est **chaîné** (chaque entrée scelle la précédente) et conservé **au moins dix ans** (Code CIMA art. 404 : conservation de dix ans au moins des pièces justificatives et de la correspondance ; art. 406-407 : impossibilité d'insertions ou de suppressions ultérieures pour une comptabilité informatisée). Le journal des **consultations** est celui que la loi exige pour les données lues (loi n° 2019-014, art. 52).

**Conséquences (testables) :**
- L'historique d'un dossier se lit de bout en bout, dans l'ordre, sur une seule page, avec pour chaque ligne : le profil, le geste, l'avant et l'après, le motif.
- **100 %** des actions portent un auteur et un horodatage serveur ; **100 %** des refus et classements portent un motif : un test parcourt le journal d'une installation de démonstration.
- Aucune entrée du journal ne peut être modifiée ni supprimée par l'application, même par ADMIN ; une tentative est elle-même tracée. Le chaînage rend une modification directe en base **détectable** ; l'empreinte du journal est déposée régulièrement **hors du serveur** de la compagnie (défaut, annexe D *(défaut H-019 : chaque jour ; modèle de la microfinance)*).
- La **consultation** d'un dossier et d'une pièce crée une entrée : qui, quand, quoi ; une consultation d'une donnée de santé est marquée comme telle (FR-9).
- AUD exporte le journal d'un dossier, d'un agent ou d'une période, sans reconstitution (UJ-7) ; **la piste d'audit** (qui a changé quoi) est lisible par AUD, RESP et DG ; le **journal des consultations** par AUD seul.
- Les versions successives d'un document sont conservées ; une pièce remplacée n'est jamais écrasée.
- L'horloge du serveur ne recule jamais ; une séquence de numéros (`DEC-`, chèques, quittances) est **sans réutilisation** et les **trous dus à une annulation sont consignés** avec leur motif.
- Un agent sans aucune trace depuis un nombre de jours paramétrable est signalé à AUD (défaut, annexe D, valeur de la démo).

### 4.8 Les délais

#### FR-14 : Délais légaux et délais internes, séparés

Prospera tient **deux familles de délais, jamais mélangées**. Chacune a son **point de départ** et son **point d'arrêt** explicites.

**Les délais légaux** du corporel automobile (véhicule terrestre à moteur, VTM), issus du Code CIMA (art. 231, 233, 235 et 236, lus et sûrs) :

- L'offre d'indemnité est présentée dans les **12 mois** suivant l'accident ; en cas de décès, dans les **8 mois** suivant le décès.
- L'offre peut être **provisionnelle** quand l'assureur n'a pas été informé de la consolidation dans les 6 mois de l'accident ; l'offre définitive doit alors suivre dans les 6 mois de l'information.
- La victime peut saisir l'assureur d'une demande motivée, qui a 30 jours pour y répondre.
- Une offre ou un paiement tardif produit de plein droit un intérêt de **5 % par mois de retard**.
- Au corporel VTM, **aucun règlement issu d'une transaction n'est émis avant la fin du délai de dénonciation de 15 jours** (art. 235) : la condition `DELAI_DENONCIATION_ECOULE` garde les transitions d'émission (FR-220). Le délai de paiement d'un mois (art. 236) court **depuis la fin de la dénonciation**.
- Ces délais s'appliquent à l'atteinte à la personne causée par un véhicule terrestre à moteur ; **ils ne s'appliquent pas aux dommages aux biens** (art. 231, dernier alinéa).
- Ces délais sont des **alertes réglementaires**, **jamais modifiables par la compagnie**.
- Leurs **suspensions et prorogations** (assureur non avisé dans le mois, décès tardif, pièces demandées non reçues dans les 6 semaines, expertise médicale contestée, victime à l'étranger ; art. 247 à 253) sont **tracées** dans le dossier.
- La **base de calcul de la pénalité** s'écrit d'**une seule façon** : le paramètre `penalite.base` (offre, indemnité ou solde ; défaut : le montant de l'offre *(point juridique J-03 : base d'interprétation ; à valider par le juriste, FR-24)*). Tant que le juriste n'a pas tranché, la pénalité s'affiche comme « **estimation, base non validée** » et n'entre dans aucun état.

**Les délais internes** du matériel et des autres branches ne sont **pas fixés par le Code** : ils sont **contractuels ou internes**, paramétrés par produit.

- Les délais internes de la démo (accusé de réception du dossier complet, en dernier recours, l'accusé de déclaration étant immédiat (FR-36) ; offre depuis le dossier complet ; règlement après accord ; délai de traitement par volet) et les délais de la procédure de référence sont les **valeurs par défaut** de ces délais internes (annexe D *(défaut H-020 : délais de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer pour la compagnie)*).
- Offre validée envoyée sous **48 heures ouvrées** ; rapport d'expert sous **7 jours** (le bas de la fourchette de 7 à 10 jours du mémoire ; voir FR-184) ; paiement sous **72 heures ouvrées** après l'accord enregistré (au corporel automobile, après la fin du délai de dénonciation de 15 jours) ; relance du recours tous les 15 jours.
- Les « heures ouvrées » suivent le calendrier ouvré de la compagnie *(défaut H-021 : calendrier ouvré de la compagnie, A-18 ; à confirmer à la séance d'immersion)*.
- **Délai de déclaration** par l'assuré : **au moins 5 jours ouvrés, 48 heures pour le vol** (art. 12-4°). Le plancher légal l'emporte sur toute valeur de l'annexe D.
- Les délais du **fonds de garantie automobile** (par exemple la déclaration au fonds dans les 3 mois de la réclamation, art. 608) ne s'appliquent que **si un fonds existe au Togo** *(point juridique J-04 : existence non confirmée ; le paramètre « fonds actif » est désactivé par défaut ; à vérifier par le juriste)*.

Un dossier est **jugé selon le référentiel en vigueur à sa date de survenance**. Le référentiel des délais légaux est **versionné** (date d'effet, source, validateur, statut) : un sinistre d'avant une nouvelle version garde l'ancienne.

**Conséquences (testables) :**
- Un dossier corporel porte un **chronomètre légal** : date d'accident, date de réception de l'avis, date du décès, date d'information de consolidation ; les échéances sont calculées (accident plus 12 mois, décès plus 8 mois, consolidation plus 6 mois, réponse à la demande motivée plus 30 jours) ; chaque échéance affiche son point de départ, son point d'arrêt et les jours restants.
- Une suspension ou une prorogation est **saisie avec son article et son motif**. Elle déplace l'échéance ; le déplacement est inscrit **au journal**, jamais en silence.
- Une échéance légale **proche** (défaut : 45 jours, seuil d'alerte de la démo) alerte le gestionnaire et le responsable ; une échéance **dépassée** montre une **estimation de pénalité** (5 % par mois, base `penalite.base`, « estimation, base non validée »), avec la saisie du motif de réduction ou d'annulation « circonstances non imputables à l'assureur ».
- Un dossier corporel VTM dont l'accord est une transaction : l'émission du règlement est refusée jusqu'au 15e jour inclus après la conclusion (`DELAI_DENONCIATION_ECOULE`), acceptée à partir du 16e jour.
- Au corporel, le délai interne de paiement (72 heures ouvrées) court depuis la fin de la dénonciation ; le délai légal d'un mois (art. 236) reste l'échéance réglementaire, affichée comme telle.
- Un test change la valeur d'un délai interne (par exemple 60 à 40 jours) : l'alerte suit ; un test tente de changer le délai de 12 mois : le serveur refuse.
- Un test configure un délai de déclaration sous le plancher (moins de 5 jours ouvrés, ou moins de 48 heures pour le vol) : la configuration est refusée.
- Un test charge un sinistre de survenance ancienne : il est jugé selon la version de référentiel en vigueur **à sa date de survenance**, même si une version plus récente existe.
- Une **évaluation arrêtée n'est jamais recalculée** quand un barème change (le dossier garde les règles de son ouverture, FR-4).
- Le **dommage matériel** n'a aucun délai légal affiché ; son échéance est interne et s'affiche comme telle.
- La **prescription** (action dérivant du contrat : 2 ans, art. 28 ; action en responsabilité civile extra-contractuelle : 5 ans, art. 256) est suivie comme un **terme à vérifier par le juriste**, avec alerte avant l'échéance, jamais comme une conclusion juridique.
- Les valeurs de délais du code de la démo ne sont reprises comme délais **légaux** que si elles sont lues dans le Code CIMA ; les autres sont des délais **internes**, ou **à vérifier par le juriste**.

### 4.9 Le jeu de démonstration

#### FR-15 : La compagnie de démonstration

La démo tourne sur une **compagnie fictive** branchée sur le **logiciel de compagnie fictif** (§6.6), comme l'IMF de la microfinance est branchée sur son cœur fictif (décision de cadrage D19). Elle compte **14 gestionnaires** (3 en corporel, 5 en matériel, 3 en risques divers, 3 en recours), un portefeuille d'environ **3 500 dossiers** sur **tous les statuts** (ordre de grandeur de la démo actuelle), les polices et garanties des **sept produits** de la démo, des experts (un expert interne en automobile, un médecin-conseil, des cabinets externes) et un personnel pour chacun des quatorze rôles. Les quatre scénarios `SIN-2026-9001` à `SIN-2026-9004` (accident avec blessé et deux expertises ; matériel avec contre-expertise ; gros incendie et règle de délégation ; accident mortel, archive et reconstitution) sont **rejouables**. Les noms, les chiffres et les dates sont **fictifs** : le jeu ne reprend aucun assuré réel, et les noms sont modifiables.

**Conséquences (testables) :**
- Le jeu couvre chacun des onze statuts et chacune des quatre sorties au moins dix fois *(défaut H-022 : seuil de couverture repris de la microfinance)*, chaque volet, et chacun des sept produits ; les quatre scénarios repartent de l'état « déclaré » à chaque remise à zéro.
- Chacun des quatorze rôles a un compte de démonstration et ne voit que son périmètre (FR-6) ; l'effectif de 14 gestionnaires est un paramètre du jeu, pas une règle (§2.1).
- Les **104 vérifications** du second rejeu de la démo actuelle sont reprises dans une **table de reprise** (annexe E) qui dit, pour chacune, si elle est **gardée**, **réécrite** (nouvelle valeur attendue) ou **retirée** (décision citée). La recette du vrai serveur exige **104 sur 104 de la table réécrite**.
- Un **sélecteur de profil de démonstration** permet de changer de profil sans se déconnecter ; il n'existe que dans l'espace d'essai.
- La remise à zéro du jeu est une opération du **serveur**, propre à l'espace d'essai (la démo actuelle la fait navigateur par navigateur) *(défaut H-023 : opération réservée à ADMIN dans l'espace d'essai ; à confirmer)*. Seul `ADMIN` la lance, **en espace d'essai seulement**.

#### FR-16 : Dans la démo, on crée pour de vrai, rôle après rôle

Dans la démonstration, on peut **créer un vrai dossier** : déclarer un sinistre, recevoir sa référence `DEC-`, le numéro de sinistre renvoyé par le logiciel de compagnie fictif, puis le mener **à la main, rôle après rôle**, de la déclaration à l'archive, sur le modèle de `SIN-2026-9002` (UJ-3, UJ-9) : accueil, responsable, gestionnaire, experts, responsable ou comité, comptable, accueil pour la remise, archiviste. Le recours naît en parallèle (UJ-5).

**Conséquences (testables) :**
- Un dossier créé à la main traverse les huit phases et les onze statuts du chemin nominal, jusqu'à `CLOTURE` puis au versement au fonds, **sans intervention de Money Vibes**.
- Les **refus** du circuit se provoquent à la main : les **21 refus** de la démo, dont la liste est à l'annexe E ; chacun est refusé par le serveur (FR-7) avec son libellé.
- Un dossier créé apparaît sans autre manipulation dans les corbeilles des rôles concernés, dans le tableau de bord de la direction et dans le journal (FR-13).
- Aucun écran du parcours n'est simulé : un test rejoue le parcours avec le logiciel de compagnie fictif **coupé** pour la liste « à saisir » (FR-2), puis **rebranché** pour le rattachement du numéro.

#### FR-17 : Un jeu cohérent au franc près

Les chiffres du jeu se recoupent. La somme des provisions des dossiers donne l'état des provisions ; pour un dossier, le **validé** moins le **payé** donne le **reste à payer** ; chaque décompte se recalcule depuis ses conditions ; **un même chiffre est le même sur tous les écrans** ; l'analyse d'un dossier **ne change pas entre deux consultations**. Les chiffres de la démo actuelle ne concordent pas toujours (un nombre de devis comparables qui change d'un écran à l'autre, un poste critiqué tiré au sort à chaque affichage) : ils ne sont pas repris.

**Conséquences (testables) :**
- Un test recalcule chaque indicateur du tableau de bord de la direction depuis les données brutes et trouve le même nombre.
- Pour chaque dossier du jeu, évalué, proposé, validé, payé et reste à payer vérifient leurs relations (le reste à payer est le validé moins le payé ; il est zéro au statut `REGLE`) ; **la provision n'est confondue avec aucun des cinq** (§3).
- L'état des provisions respecte brut égal cédé plus net, pour chaque dossier et pour le total, au franc près.
- Aucun indicateur du jeu n'est une constante (PRD-D FR-15) ; la fraîcheur de chaque chiffre est affichée.
- L'arrondi à 5 000 FCFA ne vaut que pour les montants **calculés par le système** ; le montant **arrêté** par le gestionnaire est **au franc près** (395 500 FCFA pour `SIN-2026-9002`, voir FR-73).
- Deux consultations successives de la même analyse d'un dossier rendent le même résultat tant que le dossier n'a pas changé.

### 4.10 Messages, données personnelles et consentements

#### FR-18 : Les messages passent par `notification`

Tout message (cloche et e-mail pour le personnel ; **SMS, WhatsApp et e-mail pour l'assuré et les tiers**) passe par le module `notification` ; aucun module n'envoie lui-même (§7.2). **L'assuré est prévenu à chaque étape qui le concerne** : accusé de déclaration (avec la référence `DEC-`), liste des pièces manquantes, dossier ouvert, numéro de sinistre officiel reçu, convocation à une expertise, offre envoyée, accord enregistré, chèque prêt à retirer et rappel s'il n'est pas retiré, règlement effectué, clôture. Le **courtier** et les **coassureurs** sont informés à l'ouverture. Le français est la langue par défaut ; l'anglais est « bientôt » (FR-22). Le courrier et le SMS ont un **suivi de distribution** (remis, retourné, non remis) : `notification` rend cet état lisible par le dossier.

**Conséquences (testables) :**
- Chaque message envoyé est consultable : destinataire, canal, contenu, date, statut de remise ; le message d'une étape est rattaché à l'étape du dossier.
- Un courrier retourné ou un SMS non remis apparaît sur le dossier avec son état de distribution ; un test simule un pli retourné et un SMS non remis.
- Un test fait passer un dossier du statut « déclaré » à « clôturé » et vérifie, étape par étape, le message de l'assuré prévu à la matrice « qui est prévenu de quoi » (annexe B).
- Un assuré qui refuse un canal ne reçoit plus de message sur ce canal ; un message de service n'est jamais une prospection (loi n° 2019-014, art. 26 : la prospection directe exige un consentement préalable) ; Prospera n'envoie **aucune prospection**.
- Les comptes SMS et le numéro WhatsApp Business sont **ceux de la compagnie** et à sa charge *(défaut H-024 : la proposition v2 prévoit des comptes SMS fournis par la compagnie ; la v4 prévoit WhatsApp « si retenu » ; à confirmer à la séance d'immersion)*.

#### FR-19 : Données personnelles et consentements

Les données du sinistre sont des données personnelles. La compagnie est **responsable du traitement** ; Money Vibes n'est sous-traitant que pour ce qui passe par ses relais (§7.5). On recueille le consentement **par finalité** et on le trace **par dossier** : traitement du sinistre, **données de santé** (consentement écrit, FR-9), messages à l'assuré par canal, **envoi à l'IA commune d'écarts anonymisés** (consentement de la compagnie, §7.4). Les données restent sur les serveurs de la compagnie (§7.5) ; **tout transfert hors de la compagnie** (relais, tunnel de l'IA commune, support) est inscrit à un **registre des transferts**. La loi lue ne contient pas d'obligation de localiser les dossiers au Togo ; elle encadre les transferts vers un pays tiers (art. 28 à 31). Les **transferts hors Togo** et la **notification des violations de données** sont **à faire vérifier par le juriste** (FR-24).

**Conséquences (testables) :**
- Une donnée n'est utilisée que pour une finalité consentie ; un test retire un consentement (canal de messages, par exemple) et vérifie l'arrêt de l'usage.
- Le registre des transferts liste chaque destination sortante (relais, tunnel de l'IA commune, support), son contenu, son sous-traitant et sa date de mise en service.
- L'**effacement** d'une donnée sous **conservation** (FR-21, FR-236) est refusé avec un code nommé ; l'effacement d'une donnée hors conservation est tracé avec un certificat.
- La **durée de conservation** de dix ans (Code CIMA art. 404) et le principe de conservation limitée de la loi sur les données personnelles (art. 53) doivent être conciliés ; le **point de départ** de la durée (la clôture du dossier ?) est **à faire préciser par le juriste** (FR-24).
- Les droits des personnes (accès, rectification, opposition) sont servis par un écran du responsable ; leur régime exact est **à vérifier par le juriste** *(point juridique J-05 : les articles de droits de la loi n'ont pas été relus ; à vérifier)*.

### 4.11 Modules installables

#### FR-20 : Les modules de la compagnie s'installent un par un

Chaque module de ce PRD respecte le contrat de module (C1 à C13 ; annexe A) : il s'installe seul, déclare ses dépendances et affiche un emplacement vide quand une dépendance facultative manque. Les modules propres à l'assurance sont : `sinistres` (M05), `ged` (M07), `expertises` (M29), `assurance` (M30, M31), `liaison-assureur` (M48 *(défaut H-025 : code et numéro proposés ; à valider avec le contrat de module)*), `assureur-fictif` (démo seulement) et `reprise` (M44). Les modules partagés sont : `paiement` (M33), `notification` (M34), `dashboard` (M28), `reseau` (M01), l'IA commune et `connecteurs` (M43) (§7). Le paquet de la compagnie installe au moins `sinistres`, `ged`, `expertises`, `assurance`, `liaison-assureur`, `paiement`, `notification` et leurs dépendances. Un **feu vert** décide la **mise en service de chaque module**, comme pour la reprise (FR-218). Il liste les entrées nécessaires de la compagnie et leur **date limite de livraison**. Une entrée manquante est un **risque tracé**, pas un retrait de périmètre. Aucune fonction ne passe en « bientôt » sans décision du PO.

**Conséquences (testables) :**
- Le parcours UJ-3 marche avec ces seuls modules et le socle ; sans `reprise`, sans `dashboard` et sans IA commune, le circuit va quand même jusqu'à l'archive.
- Chaque emplacement vide a un test ; l'emplacement d'un module absent le dit.
- `assureur-fictif` n'est jamais installé en production réelle (annexe A).
- Le contrat de module est **la seule façon** d'installer ou de retirer un module (PRD moteur d'installation).
- Chaque module a son feu vert de mise en service, avec la liste de ses entrées et leur date limite ; une entrée en retard apparaît au registre des risques, et aucune fonction n'est passée en « bientôt » à cause d'elle.

### 4.12 Le double support, et ce qui n'est pas encore là

#### FR-21 : Le papier reste tenu, le numérique sert

Le dossier existe **en deux supports** : le **numérique**, qui sert au travail, et le **papier**, qui reste tenu. Décision du PO : le scan du stock papier n'est pas la voie de reprise ; le dossier papier se tient en parallèle. Chaque dossier porte sa **cote physique** (boîte, rang, chemise de couleur par branche), sa **sortie** et sa **restitution** (défaut : 15 jours). Les nouvelles pièces sont **scannées ou téléversées** au guichet ou par NUM, avec un **contrôle avant archivage**. La **valeur juridique de chaque pièce** est notée (original irremplaçable, original rééditable, copie) ; **les originaux irremplaçables** (acte de décès, jugement d'hérédité, procès-verbal) **restent conservés en papier** tant que le juriste n'a pas confirmé la valeur probante de la copie numérisée (FR-24). **Le papier fait foi tant que le juriste n'a pas validé la valeur probante de la copie numérisée** ; le scellement (FR-169) ne change pas le support de référence. Le dossier est conservé **dix ans au moins** (Code CIMA art. 404) ; les durées par nature de dossier sont des paramètres (annexe D) ; **la destruction est une décision visée et tracée, jamais un défaut**.

**Conséquences (testables) :**
- Un dossier versé au fonds porte son numéro d'archivage `ARC-…` et sa cote physique ; chaque sortie du papier est datée, attribuée et suivie d'une restitution ; une chemise sortie depuis plus de 15 jours est signalée.
- Une pièce porte sa valeur juridique ; un test tente de marquer « destructible » une pièce irremplaçable : refusé.
- Tant que le juriste n'a pas validé la valeur probante de la copie numérisée, le support de référence d'une pièce reste le papier, scellement compris : un test scelle une pièce et vérifie que son support de référence n'a pas changé.
- Aucune destruction n'est lancée sans visa : un test cherche une destruction automatique dans le journal.
- Un dossier versé au fonds n'est plus versable ; un dossier **non clos** ne se verse pas.
- Un export d'archive se fait sur un support de la compagnie, avec une somme de contrôle (§7.5).
- Le détail de la numérisation, de l'OCR et du fonds est au §6.2.

#### FR-22 : « Bientôt » n'est jamais simulé

Une capacité non livrée au premier jour s'affiche **« bientôt »**, sans date (PRD-D FR-2), et n'imite jamais un effet. Sont « bientôt » : le **chatbot de l'assuré** (assistant conversationnel, aide à la déclaration, état d'avancement, téléversement depuis la conversation) ; **toute fonction vocale** (dictée, transcription d'appel, synthèse vocale) ; l'**anglais** ; la **signature électronique** des offres et des transactions (à n'activer qu'après la validation du juriste, FR-24 ; la signature manuscrite scannée ou la remise en main propre avec décharge restent possibles) ; le **connecteur nommé** du logiciel de la compagnie et le module `connecteurs` (§7.6).

**Conséquences (testables) :**
- Chaque emplacement « bientôt » de la liste est un bouton qui explique, sans date, ce qu'il fera ; un test parcourt les écrans et n'en trouve aucun qui promette une date ou simule un effet.
- Aucun écran n'affiche une transcription d'appel ni une réponse d'assistant d'assuré : la transcription factice de la démo actuelle (un texte fixe dont seul le nom du fichier change) n'est pas reprise.
- Ne sont jamais « bientôt » : la déclaration, tout le circuit jusqu'au chèque, l'OCR des scans, et les quatorze usages de l'IA sauf la voix (FR-10).

### 4.13 Volumes et performance

#### FR-23 : Une hypothèse de dimensionnement, à remplacer par les vrais volumes

Les volumes de la compagnie sont **inconnus** : ni la proposition v2, ni le deck, ni l'offre v4 n'en donnent un seul. Le PRD pose une **hypothèse de dimensionnement**, à remplacer par les vrais volumes dès qu'on les connaît : *(défaut H-026 : 5 000 sinistres par an, 50 000 dossiers archivés, 1,5 million de pages, 60 utilisateurs simultanés, un site central et des guichets ; à remplacer par les volumes réels de la compagnie (stock en cours, archives, dossiers par an), à demander avant la séance d'immersion)*. **La recherche d'un dossier rend son résultat en moins de 5 secondes au 95e centile** sur le volume repris ; moins de 1 seconde est visé *(défaut H-027 : cible de 1 s reprise du deck du 12/09 ; la v2 dit « quelques secondes »)*. La compagnie **livre ses volumes réels avant la date limite** fixée au feu vert de FR-20 ; sans eux, l'hypothèse de dimensionnement reste valable et le risque est tracé.

**Conséquences (testables) :**
- Un jeu au volume de l'hypothèse (50 000 dossiers archivés, 1,5 million de pages) est chargé sur une installation de référence ; la recherche par nom, par police, par numéro de sinistre, par immatriculation ou par numéro d'archivage rend son résultat en moins de 5 secondes au 95e centile ; un test mesure chaque critère.
- Les chiffres de la configuration minimale du serveur viennent de ce test ; une installation sous la configuration minimale est refusée (PRD moteur d'installation).
- Les volumes réels remplacent l'hypothèse **sans changer le code** : ils sont dans l'annexe D.
- Au-delà du volume testé, la compagnie est prévenue ; une instance est un serveur applicatif et un NAS, sans haute disponibilité en v1 (PRD moteur d'installation).

### 4.14 La revue juridique

#### FR-24 : Revue juridique obligatoire avant la mise en service

Comme pour l'IMF, une **revue juridique est obligatoire avant la mise en service** (décision de cadrage D21). Elle porte sur : les **délais CIMA** (version à jour du Code, suspensions, base de la pénalité de 5 % par mois) ; le **barème corporel** (art. 257 à 266 ; SMIG, sens du SMIG « annuel ») ; l'existence et le régime du **fonds de garantie automobile** au Togo ; les **conventions inter-compagnies** et le recours (existence d'une convention d'indemnisation directe, rôle de l'association des assureurs, constat amiable, règles sur les experts automobiles) ; les **données de santé** (loi n° 2019-014 : consentement écrit, formalité auprès de l'instance de protection des données, transferts hors Togo, notification des violations de données) ; la **valeur probante de la copie numérisée** et la signature électronique (loi sur les transactions électroniques de 2017, **non lue** à cette date) ; la **LBC/FT** (loi uniforme et loi nationale, seuils, traitement du Mobile Money) ; la **conservation** (point de départ de la durée de dix ans) ; les circulaires de la CRCA sur les provisions et les états. Les **tables du barème corporel** (valeur du point d'incapacité permanente, capitalisation, barème médical, barème de responsabilité) sont des **images** dans le PDF officiel : leur **saisie** est une **tâche du plan**, pas une hypothèse.

La revue a un **propriétaire** et une **date cible** *(défaut H-028 : le PO désigne le propriétaire ; date cible = 4 semaines avant la mise en service)*. Un **mode dégradé** est prévu : si les tables du barème corporel ne sont pas validées à la mise en service, le volet corporel fonctionne en **saisie manuelle motivée** (montant arrêté par le gestionnaire, avec motif), les échéances légales restent actives et l'écart est tracé.

**Conséquences (testables) :**
- Chaque point de cette revue est une ligne du registre des points juridiques (§12) avec son propriétaire, sa date et son issue ; la mise en service est **bloquée** tant qu'une ligne obligatoire est ouverte.
- Tout texte réglementaire cité dans le PRD est soit **lu et sûr** (numéro d'article donné), soit marqué **à vérifier par le juriste** ; aucun texte non vérifié n'est cité avec un numéro.
- Un référentiel (délais, barèmes) ne devient « en vigueur » qu'après un **validateur** nommé (FR-14).
- Les tables du barème corporel saisies sont relues une à une par un second agent avant mise en service.
- La revue a un propriétaire nommé et une date cible visibles au registre des points juridiques.
- Un dossier corporel s'ouvre avec des tables non validées (état `TABLE_NON_VALIDEE`, FR-70) : le montant se saisit à la main avec motif, les échéances légales courent, l'écart est tracé.

### 4.15 L'accès

#### FR-25 : Authentification, sessions et double authentification

Le **serveur** authentifie les comptes (la démo actuelle a un mot de passe unique et un cookie contenant l'identifiant). La **double authentification est obligatoire** pour **tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord** (donc aussi `GEST`, `MED`, `ACC`, `NUM`, `GREC` dès qu'ils ont ces accès), en plus de DG, DT, RESP, CPT, AUD, ADMIN et EXPE : la règle se pose **par capacité**, pas par liste figée ; une session dure 8 heures au plus et se ferme après 30 minutes d'inactivité (paramètres) *(défaut H-029 : valeurs reprises de la microfinance ; à confirmer à la séance d'immersion)*. Les comptes des cabinets d'expertise externes sont **séparés** et n'ouvrent que le portail expert.

**Conséquences (testables) :**
- Aucun compte de démonstration n'a de mot de passe commun ; l'espace d'essai a ses propres comptes (FR-15).
- Un test ouvre une session de 8 heures et une session inactive : elles se ferment ; l'écran est perdu et aucune donnée métier ne reste dans le navigateur.
- Un compte d'un rôle soumis à la double authentification, sans second facteur, ne peut pas ouvrir de session ; la remise à zéro d'un second facteur est tracée et visible d'AUD.
- Un test donne à un `ACC` ou à un `GREC` un accès à une donnée de santé ou à l'enregistrement d'un accord : la double authentification lui devient obligatoire.
- Le compte d'un cabinet ne peut ouvrir aucun écran hors du portail expert (FR-6).
- Les comptes de Money Vibes sont **fermés par défaut** sur l'installation de la compagnie (§7.5).

### 4.16 Défendabilité, évolution, concurrence, partie au dossier

#### FR-26 : Toute décision est défendable

Toute décision (évaluation, offre, refus, classement, provision, règlement) porte ses **pièces, sa règle, son motif et son auteur**, lisibles par un tiers (l'assuré, l'auditeur, le juge) **sans reconstitution**. C'est aussi le principe de l'IA (elle explique et cite ses sources, FR-11) et du journal (FR-13).

**Conséquences (testables) :**
- Un auditeur ouvre un dossier clos et retrouve, pour chaque décision, les quatre éléments : les pièces, la règle, le motif, l'auteur.
- Une décision sans l'un des quatre éléments est refusée à l'enregistrement, avec le nom de l'élément manquant.
- Un tiers lit la décision seule, sans ouvrir un autre écran ni demander une explication à l'agent.

#### FR-27 : Le processus évolue par paramètres, puis par version

Les **11 statuts et 42 transitions** sont ceux du premier jour. La compagnie fait évoluer le processus **par paramètres** (délais, seuils, délégations, pièces, modèles), sans développement. Un changement de statut ou de transition passe par un **amendement versionné**, décidé à la séance d'immersion, avec rejeu des tests de FR-139.

**Conséquences (testables) :**
- Un paramètre de processus (délai, seuil, délégation, liste de pièces, modèle) se change sans développement ; l'effet se vérifie sur un nouveau dossier (FR-4).
- Un statut ou une transition ne s'ajoute, ne se retire et ne se modifie que par un amendement versionné ; la livraison est refusée si les tests de FR-139 ne sont pas rejoués et verts.
- La table des 42 transitions porte sa version ; un dossier garde la version de son ouverture.

#### FR-28 : Deux agents, un dossier

Deux agents peuvent ouvrir le même dossier en même temps.

- Le dossier porte un **numéro de version**. Un enregistrement fait sur une version périmée est **refusé**, avec le message « modifié par X à hh:mm » ; la saisie de l'agent n'est pas perdue.
- Un geste met à jour l'écran des rôles concernés **sans rechargement**.

**Conséquences (testables) :**
- Deux agents ouvrent le même dossier ; le premier enregistre ; le second enregistre sur la version périmée : refus nommé, message « modifié par X à hh:mm », saisie du second conservée à l'écran.
- Un agent exécute un geste (par exemple une validation) ; l'écran de l'autre rôle concerné se met à jour sans rechargement ; la recette le vérifie dans un navigateur réel, rôle après rôle.

#### FR-29 : Partie au dossier

Une personne est **partie au dossier** quand elle accomplit l'un des actes de la liste **fermée** suivante : **affecter**, **instruire**, **évaluer**, **valider** (siéger au comité pour décider est valider), **contrôler** (le contrôle du niveau 1 de FR-8), **enregistrer l'accord**, **émettre**, **remettre**, **rapprocher**. **Contrôler la qualité d'une pièce n'est pas un acte de partie.** Un gestionnaire **réaffecté** en cours de route reste partie pour ses actes passés. FR-7, FR-81 et FR-93 renvoient à cette liste.

**Conséquences (testables) :**
- Un test par acte de la liste : la personne qui l'a accompli est partie ; le serveur lui refuse les cumuls interdits de FR-7 qui en découlent.
- Le contrôle de qualité d'une pièce ne rend pas partie : un `NUM` qui a contrôlé une pièce peut enregistrer l'accord sur ce dossier.
- Un gestionnaire réaffecté reste partie : il ne peut pas valider le dossier après l'avoir instruit, même s'il n'en est plus le titulaire.

---


---

## 5. Partie 2 — Le circuit sinistre de bout en bout (`sinistres`, M05) ★

Cette partie décrit le circuit du dossier sinistre, **de la déclaration à l'offre** (§5.0 à §5.7). Elle est la pièce centrale du PRD : tout le reste (pièces, expertises, états, paiement) s'y accroche. La suite du circuit (paiement, clôture, recours, sorties, états) est en §5.8 à §5.15.

Un mot sur les sources. Le **récit du PO** fait foi pour la forme du circuit (8 phases, 11 statuts, 4 sorties, recours en parallèle). Le **code de la démo** fait foi pour les règles fines (il est en avance sur sa propre spécification). La **réglementation** (Code CIMA, édition 2019) l'emporte sur tout pour les obligations légales ; seuls les articles lus sont cités. Les valeurs de la démo (seuils, délais, grilles) sont reprises comme **valeurs par défaut paramétrables** : la compagnie les confirmera à la séance d'immersion.

### 5.0 Vue d'ensemble

#### FR-30 : Le dossier avance par 8 phases et 11 statuts, et chaque pas est gardé

Un dossier sinistre n'a qu'un statut à la fois, parmi onze. Il passe d'un statut à l'autre par une **transition** nommée. Chaque transition porte : le **droit** qu'il faut détenir, les **conditions** à remplir, et un **motif écrit** quand elle refuse, classe ou renvoie. L'écran affiche aussi les actions **fermées**, avec la raison du blocage dite en clair (« vous ne pouvez pas évaluer : il manque le rapport de police »). Rien ne s'enregistre contre ces règles : le serveur revérifie droit, conditions et motif, quel que soit l'écran qui appelle. Un statut non terminal n'est jamais une impasse : toute transition de sortie existe, et un test le vérifie. La table complète des **42 transitions** est en §5.13 (FR-135) ; ce paragraphe fixe le cadre.

| Phase | Statut(s) | Qui | Ce qui se passe | Ce qui bloque |
|---|---|---|---|---|
| 1. Déclarer | `DECLARE` | `ACC`, `GEST`, `RESP` ; l'assuré ou le courtier par le canal ouvert | La déclaration est enregistrée, la référence `DEC-` est remise, le numéro officiel est demandé au logiciel de la compagnie (LC) | Rien : une déclaration s'enregistre toujours (FR-39) |
| 2. Ouvrir | `PIECES_ATTENDUES`, `OUVERT` | `ACC`, `GEST`, `RESP` | Recevabilité en 4 questions ; pièces ; accusé de réception ; provision d'ouverture | Contrat non valide ; garantie non décidée ; pièces obligatoires manquantes (le dossier s'ouvre alors « en attente de pièces ») |
| 3. Attribuer | `OUVERT` + gestionnaire | `RESP` seul | Le responsable désigne qui instruit | Dossier non affecté : l'instruction ne démarre pas |
| 4. Instruire | `EN_INSTRUCTION` | `GEST` du volet | Pièces, responsabilité, expertises ou accord sur devis, recours détecté | Pièces complémentaires demandées ; signal de fraude bloquant (§5.12) |
| 5. Chiffrer | `EVALUE` | `GEST` | Le décompte, poste par poste ; la provision est revue | Pièces incomplètes ; expertise non close ; garantie non décidée ; montant nul |
| 6. Décider | `EN_VALIDATION`, `OFFRE_ENVOYEE` | Selon la délégation ; l'agent signe l'offre | Validation par la délégation, dans `EN_VALIDATION` ; puis offre envoyée à l'assuré sous 48 h ouvrées (transition 10) ; puis accord enregistré (transition 14) | Validation de la délégation incomplète ; séparation des tâches ; accord non enregistré |
| 7. Payer | `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE` | `CPT` émet ; `ACC` remet | Ordre de règlement, quittance, remise contre pièce d'identité (§5.8) ; les trois statuts sont dérivés des règlements (FR-92) | Aucun ordre sans accord enregistré |
| 8. Clore | `CLOTURE` | `GEST`, `RESP` | Solde à zéro, motif écrit, versement aux archives (§5.9) | Reste à payer non nul ; motif absent |

**Conséquences (testables) :**
- Un dossier n'a jamais deux statuts ; l'historique de ses statuts est conservé avec auteur, date et heure, et motif.
- Une transition tentée sans le droit requis est refusée avec le code `DROIT_INSUFFISANT` ; sans une condition, avec le code de la condition (par exemple `PIECES_COMPLETES`) ; sans motif exigé, avec `MOTIF_ECRIT`.
- L'écran d'un dossier liste les actions fermées avec leur raison ; la raison affichée est celle que le serveur renverrait si l'action était tentée.
- Un appel direct au serveur qui contourne l'écran reçoit le même refus que l'écran (test de recette sur chaque transition).
- Aucun statut non terminal (hors statuts de sortie) ne reste sans transition sortante.

#### FR-31 : Quatre sorties du circuit, chacune avec un motif

Le circuit a quatre sorties latérales : `REJETE` (refus de prise en charge notifié), `SANS_SUITE` (classement, par exemple assuré injoignable), `LITIGE` (offre refusée, contre-expertise, contentieux) et `FRAUDE_SUSPECTEE` (revue humaine ouverte). Toute sortie exige un **motif écrit**. `REJETE`, `SANS_SUITE` et `CLOTURE` se rouvrent par une décision motivée du `RESP`, du `DG` ou du `DT` (transitions 39 à 41, §5.13). Le détail de `LITIGE` et de `FRAUDE_SUSPECTEE` est en §5.11 (FR-124, FR-125) et §5.12 ; celui du refus de prise en charge en FR-121.

**Conséquences (testables) :**
- Passer en `REJETE`, `SANS_SUITE`, `LITIGE` ou `FRAUDE_SUSPECTEE` sans motif est refusé (`MOTIF_ECRIT`).
- Un dossier rouvert garde tout son historique, la réouverture est une ligne du journal avec son motif, et la date de clôture est effacée.
- Un dossier `REJETE` ou `SANS_SUITE` ne porte aucun ordre de règlement en cours : le reste à payer passe à zéro.
- Les quatre sorties se retrouvent dans les états de pilotage avec leur motif (§6.7, FR-213).

#### FR-32 : Le recours est un suivi parallèle, pas un statut du dossier

Le **recours** contre un tiers responsable suit son propre chemin, en parallèle du dossier, de l'ouverture jusqu'au remboursement. Il ne fait plus sortir le dossier du circuit (écart avec la démo, où « passer en recours » sortait le dossier). Le dossier peut être clos pendant que son recours continue. Le recours a sa propre machine d'états et se clôt seul : tout est en §5.10. Dans ce chapitre, le circuit fait trois choses seulement : détecter le recours à l'ouverture (FR-54), exiger la preuve de la faute du tiers, et transmettre au pôle recours.

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

Ces règles incluent celle-ci : **l'argent n'est libéré qu'après un accord enregistré par un tiers** (FR-86) **et, au corporel, après la fin du délai de dénonciation** (`DELAI_DENONCIATION_ECOULE`, FR-136).

**Conséquences (testables) :**
- Pour chaque règle, un test tente de la violer par chaque rôle et par appel direct, et obtient le refus attendu.
- Les quatre règles se retrouvent dans la matrice d'accès (annexe B) et dans les contrôles du contrôle interne (`AUD`, §6.7).

### 5.1 Déclarer (`DECLARE`)

#### FR-34 : Le sinistre se déclare par quatre canaux, avec un mode de saisie commun

Un sinistre se déclare **au guichet**, **au téléphone**, **par WhatsApp ou par e-mail**, ou **par un courtier**. Les quatre canaux aboutissent au même formulaire de déclaration. Quand le système est indisponible, un **formulaire papier de secours numéroté** reçoit la déclaration ; l'agent la saisit ensuite en **saisie différée**, avec les deux dates (réception réelle et saisie), et le numéro du formulaire papier est reporté au dossier. Un canal « agence » s'ajoute si la compagnie a des agences *(défaut H-030 : canal « agence » à ajouter si la compagnie a des agences ; à confirmer à la séance d'immersion)*. Au téléphone, l'agent de l'accueil saisit la déclaration pendant l'appel : **aucun appel n'est enregistré ni transcrit** (la voix est hors périmètre, FR-35). Le canal d'origine est conservé sur le dossier. La déclaration d'un courtier est reçue comme celle de l'assuré, avec le courtier identifié. Prospera sert **à consulter et à déclarer** dès le premier jour : l'assuré voit l'avancement par la compagnie, il ne modifie jamais son dossier directement *(défaut H-031 : pas de portail assuré en libre-service au premier jour ; le chatbot de l'assuré est « bientôt » ; à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Le formulaire de déclaration contient au minimum : police, assuré, victime, téléphone, type de sinistre, date et heure de survenance, lieu, circonstances, tiers impliqué, estimation du déclarant (facultative), canal.
- Le canal prend les valeurs `GUICHET`, `TELEPHONE`, `WHATSAPP`, `EMAIL`, `COURTIER` (et `COURRIER` pour une déclaration reçue sur papier) ; il est obligatoire.
- Une déclaration par courtier porte l'identifiant du courtier, repris du logiciel de la compagnie ; un courtier inconnu est enregistré « à rattacher » sans bloquer la saisie.
- La **confirmation écrite** d'une déclaration verbale est demandée à l'assuré (pièce « déclaration signée ») ; son absence ne bloque pas la déclaration mais bloque l'évaluation (FR-44).
- Un formulaire papier de secours porte un numéro unique ; sa saisie différée le reporte sur le dossier, avec les deux dates, et un numéro de formulaire saisi deux fois est refusé (`FORMULAIRE_SECOURS_DEJA_SAISI`).
- Une déclaration saisie après coup porte deux dates : celle de la réception réelle et celle de la saisie ; un écart de plus de 1 jour ouvré est signalé au `RESP` *(défaut H-032 : seuil de 1 jour ouvré)* (le mémoire de 2014 relève des enregistrements faits 3 à 4 jours après réception).

#### FR-35 : Déclaration assistée par l'IA depuis un message WhatsApp ou un e-mail (usage n°1)

Quand un assuré ou un courtier écrit sa déclaration (message WhatsApp, e-mail, courrier numérisé), l'agent d'accueil peut demander à l'IA commune de **pré-remplir la fiche de déclaration**. La v2 promettait la déclaration depuis l'appel ; elle est retirée : **l'accueil saisit pendant l'appel**, sans voix (D13).

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

À l'enregistrement, la déclaration reçoit **tout de suite** une **référence de déclaration** `DEC-AAAA-NNNNN` (année de la déclaration, séquence **sans réutilisation** ; un trou dû à une annulation est **consigné** avec son motif). Cette référence est remise à l'assuré sur un **accusé de déclaration** (papier au guichet, message ou e-mail sinon), qui rappelle : le canal, la date et l'heure, un résumé de ce qui a été déclaré, la liste des pièces à fournir (FR-46) et le contact du service. L'accusé de déclaration est **immédiat et automatique** : il est remis ou envoyé **à l'enregistrement**, sans attendre l'ouverture du dossier ni l'action d'un agent *(défaut H-282 : accusé immédiat, pratique du marché numérique ; à confirmer à la séance d'immersion)*. Le délai de 10 jours de FR-48 ne vaut que pour l'accusé de réception du dossier complet. La référence `DEC-` est le numéro « attribué tout de suite » du récit du PO ; le numéro officiel vient du LC (D3). Elle reste un critère de recherche une fois le numéro officiel connu (FR-37). Elle est aussi l'**identifiant d'idempotence** envoyé au LC (champ obligatoire de l'annexe C) : le LC renvoie le numéro existant pour une `DEC-` déjà reçue *(défaut H-033 : capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement ; à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Deux déclarations enregistrées au même instant reçoivent deux références différentes ; une référence n'est jamais réattribuée, même après rejet ou annulation d'une saisie.
- L'accusé de déclaration est généré à l'enregistrement et classé au dossier ; son envoi (canal, date, heure) est journalisé. Il part sans action d'agent, à l'instant où la référence est attribuée ; un canal en échec est repris sans bloquer l'enregistrement, et au guichet l'accusé s'imprime.
- Rechercher `DEC-…` retrouve le dossier en moins de 5 secondes (recherche, §6.1).
- Un trou dans la séquence des références est détectable par le contrôle interne (contrôle de séquence recommandé par l'audit de 2014) ; le contrôle ne signale que les trous **non consignés** : un trou dû à une annulation, consigné avec son motif, ne produit pas de faux positif. Le test de séquence figure au plan de contrôle (FR-210).
- Une `DEC-` envoyée deux fois au LC ne crée pas deux sinistres : le LC renvoie le numéro existant, ou Prospera détecte le doublon avant tout rattachement.

#### FR-37 : Le numéro de sinistre officiel vient du logiciel de la compagnie

La déclaration part vers le **logiciel de la compagnie** (LC) par le contrat d'échange (annexe C), qui renvoie le **numéro de sinistre officiel**. Prospera rattache ce numéro au dossier, et **c'est lui qui s'affiche partout** ensuite ; la référence `DEC-` reste cherchable. Si le LC ne sait pas recevoir une déclaration (pas d'interface, interface en panne), le dossier entre dans une liste **« à saisir dans le logiciel de la compagnie »** : un agent y saisit la déclaration, puis **reporte le numéro obtenu** dans Prospera. Une déclaration est dans **une seule voie** : l'envoi automatique **ou** la liste « à saisir ». Le passage à la liste **annule d'abord l'envoi en attente** (état de déclaration `SAISIE_MANUELLE`) ; une déclaration de la liste n'est **jamais renvoyée automatiquement** ; son rattachement se fait par report du numéro. Un dossier sans numéro officiel depuis plus de **1 jour ouvré** est une **alerte** au `RESP`. Un paramètre **« qui attribue le numéro »** (LC ou Prospera) existe pour permettre un basculement plus tard, sans reprise du code *(défaut H-034 : le LC attribue le numéro au démarrage, comme l'a dit le PO « pour un début » ; Prospera ne génère un numéro officiel que si la compagnie bascule le paramètre)*. Si la compagnie bascule la numérotation dans Prospera, le numéro porte un **préfixe distinct** (`PRO-`) de ceux du LC, et un **contrôle d'unicité** contre les numéros déjà reçus du LC (C-9) s'exécute au basculement.

**Conséquences (testables) :**
- Avec un LC joignable, le numéro officiel reçu apparaît sur le dossier et dans les listes ; la référence `DEC-` n'y figure plus qu'en second.
- Avec un LC injoignable, le dossier figure dans la liste « à saisir », sans numéro officiel, et n'est pas bloqué dans le circuit ; le report du numéro retire le dossier de la liste et journalise qui l'a reporté et quand.
- Un numéro reporté déjà porté par un autre dossier est refusé (`NUMERO_OFFICIEL_DEJA_ATTRIBUE`).
- Un numéro reçu du LC pour une `DEC-` déjà numérotée est un **écart** : il entre dans la file des écarts et n'est **jamais** un second rattachement. La procédure de traitement est écrite : qui traite (le `RESP`), sous quel délai (2 jours ouvrés *(défaut H-035 : 2 jours ouvrés ; à confirmer à la séance d'immersion)*), et la décision (garder le numéro existant ou corriger) est enregistrée avec son motif.
- Le passage d'une déclaration à la liste « à saisir » annule l'envoi en attente et pose l'état `SAISIE_MANUELLE` ; une déclaration `SAISIE_MANUELLE` n'est jamais renvoyée automatiquement (un test tente le renvoi : il est refusé).
- Un dossier sans numéro officiel depuis plus de 1 jour ouvré (paramètre `delai_alerte_numero_officiel_jours_ouvres`) apparaît dans les alertes du `RESP` avec son ancienneté.
- Le basculement du paramètre « qui attribue le numéro » à « Prospera » n'exige aucune modification des dossiers existants ; les numéros générés portent le préfixe `PRO-`, et le basculement est refusé tant que le contrôle d'unicité contre les numéros du LC signale un conflit.

#### FR-38 : Le doublon se contrôle à la déclaration, dans Prospera et dans le LC

À l'enregistrement, Prospera cherche une déclaration déjà faite pour le même sinistre : même **police**, même **date de survenance**, même **immatriculation** (si véhicule) et même **victime**, parmi les dossiers de Prospera **et** parmi les sinistres reçus du LC. Un doublon probable est **signalé** à l'agent avec le dossier trouvé ; l'agent choisit : rattacher la déclaration au dossier existant, ou la garder comme nouvelle avec un motif.

**Conséquences (testables) :**
- Une seconde déclaration avec les quatre mêmes valeurs affiche le dossier existant avant l'enregistrement.
- Garder la déclaration comme nouvelle sans motif est refusé (`MOTIF_ECRIT`) ; le motif est conservé.
- Un sinistre déjà connu du LC mais absent de Prospera est trouvé par le contrôle (test avec un sinistre fourni par le logiciel de compagnie fictif).
- Un doublon n'empêche jamais l'enregistrement : il oblige seulement l'agent à choisir en connaissance de cause (FR-39).

**Sous-règle : fusion de deux dossiers et doublon de règlement.**
- La **fusion** de deux dossiers est réservée au `RESP`, avec motif obligatoire et ligne de journal. Un seul dossier survit, avec un seul numéro LC ; les pièces, provisions, offres et règlements des deux dossiers sont réunis. La fusion est refusée si un règlement `EN_COURS` existe sur l'un des deux (`REGLEMENT_EN_COURS`).
- Le contrôle de doublon de **règlement** porte sur le **même bénéficiaire et le même sinistre** (date, police, immatriculation), non sur le montant (FR-100).
- Test : fusionner sans motif est refusé (`MOTIF_ECRIT`) ; fusionner par un `GEST` est refusé (`DROIT_INSUFFISANT`) ; fusionner avec un règlement `EN_COURS` est refusé.

#### FR-39 : Une déclaration s'enregistre toujours ; les contrôles donnent des réserves

La déclaration ne se refuse **jamais** pour une raison de contrôle : police inconnue, police suspendue, garantie non souscrite, déclaration tardive, doublon, estimation incohérente. Chaque contrôle produit une **réserve** ou une **alerte** visible sur le dossier, jamais un blocage de la saisie. Cette règle corrige un défaut du mémoire de 2014 (déclarations enregistrées 3 à 4 jours après réception) et vient du code de la démo, qui avait corrigé un dossier déclaré le soir et resté sans gestionnaire, sans provision et sans délai. Le dossier né de la déclaration reçoit tout de suite : une référence, le statut `DECLARE`, des échéances calculées, et son entrée dans la file de l'accueil.

**Conséquences (testables) :**
- Une déclaration sur une police absente de la projection du LC s'enregistre avec la réserve « police non retrouvée » et la date de dernière lecture des contrats.
- Une déclaration sur une police suspendue, résiliée ou expirée s'enregistre ; la réserve est portée au dossier et traitée à l'ouverture (FR-41).
- Aucun des contrôles de ce paragraphe ne refuse l'enregistrement ni ne change le statut `DECLARE`.
- Le dossier `DECLARE` apparaît dans la file de l'accueil dès l'enregistrement, avec son âge.

#### FR-40 : Urgence corporelle et responsabilité initiale

À la déclaration, le dossier reçoit deux marques provisoires. L'**urgence corporelle** est posée quand le sinistre est un accident corporel automobile ou un accident du travail de gravité **grave** ou **mortelle** : le dossier monte en tête des files et prévient le `RESP` et le gestionnaire du volet corporel. La **responsabilité initiale** vaut `INDETERMINEE` si un tiers est saisi, `ASSURE_FAUTIF` sinon ; elle est requalifiée à l'instruction (FR-54). Une gravité mortelle déclenche, côté expertise, la proposition d'une mission post-mortem (FR-58). Au-delà de la marque, l'urgence corporelle ouvre un **parcours d'urgence** saisi par l'agent : signalé, secours, orientation, admission, évaluation, soins, hospitalisation, suivi. Deux alertes le surveillent : « admission non confirmée » et « accord assureur non transmis » *(défaut H-036 : aucune interface avec les hôpitaux ; données saisies par l'agent ; à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Un accident corporel auto de gravité grave ou mortelle est marqué « urgence corporelle » dès l'enregistrement et prévient `RESP` et le `GEST` corporel (module `notification`).
- Une déclaration avec un tiers saisi a la responsabilité `INDETERMINEE` ; sans tiers, `ASSURE_FAUTIF`.
- La responsabilité initiale ne déclenche aucune décision et ne ferme aucune transition à elle seule.
- Le parcours d'urgence se saisit étape par étape par l'agent ; une admission non confirmée au-delà du délai paramétré lève l'alerte « admission non confirmée » au `RESP`, et un accord de l'assureur non transmis lève « accord assureur non transmis ». Aucune donnée ne vient d'une interface hospitalière.
- L'urgence corporelle ne saute aucun contrôle : elle ne change que le rang dans les files et les délais d'alerte.

### 5.2 Ouvrir (`PIECES_ATTENDUES`, `OUVERT`)

#### FR-41 : La recevabilité répond à quatre questions, sur les contrats lus

L'ouverture s'appuie sur un contrôle de **recevabilité** en quatre questions distinctes, calculées sur la **projection des contrats lue dans le LC** (polices, garanties, primes ; jamais modifiés par Prospera) : (1) le **contrat** est-il valide (police en vigueur, sinistre entre la date d'effet et l'échéance, prime payée) ? (2) la **garantie** est-elle souscrite et applicable au type de sinistre ? (3) la **déclaration** est-elle dans le délai contractuel de la garantie ? (4) que reste-t-il à écarter : **exclusions**, **plafond**, **franchise** ? L'écran affiche la **date de la dernière lecture** du LC. Le résultat est `RECEVABLE`, `A_EXAMINER` (réserves) ou `IRRECEVABLE` (au moins un point bloquant). Pour le **corporel VTM**, la condition `CONTRAT_VERIFIE` produit une **réserve**, jamais un blocage (art. 210 : suspension inopposable à la victime *(point juridique J-06 : à valider par le juriste, §13.2)*). Une **projection de police périmée** (âge supérieur au seuil) est « à relire », jamais un refus. Le refus de garantie n'arrive que par la décision `REFUS_DE_GARANTIE` (FR-42). Si l'assuré produit une **attestation valable à la date du sinistre** (art. 215-216 ; attestation provisoire de 1 mois), la réserve « police non retrouvée » n'est pas un refus. Une police suspendue, résiliée ou expirée suspend toutes les garanties dans la projection, la RC obligatoire comprise ; pour une **victime de dommage corporel causé par un véhicule terrestre à moteur**, le juriste doit confirmer ce qui reste opposable (le Code CIMA, art. 210 et son interprétation du 11/04/2011, rend inopposables à la victime la plupart des suspensions de garantie, sauf la suspension régulière pour non-paiement de prime). Le **type de garantie qui répond** à chaque type de sinistre est un paramètre (table type de sinistre → garanties, valeurs de la démo reprises).

**Conséquences (testables) :**
- Chacune des quatre questions a son propre résultat, sa raison et ses sources (police, garantie, date) affichés.
- Une garantie « non souscrite » (réponse normale pour une garantie facultative) est distinguée d'une garantie « hors branche » (déclaration probablement mal orientée, par exemple un dégât des eaux sur une police auto).
- La date de dernière lecture du LC est affichée à côté du résultat ; au-delà d'un âge paramétré (`age_max_lecture_contrats_heures`), l'écran avertit que la lecture est ancienne.
- Au corporel VTM, une police non valide dans la projection produit une réserve `CONTRAT_VERIFIE` et laisse l'ouverture possible ; une projection plus ancienne que le seuil est marquée « à relire » et ne produit aucun refus.
- Un dossier dont la police est introuvable mais dont l'assuré produit une attestation valable à la date du sinistre ne reçoit pas de refus : la réserve est levée sur décision motivée.
- Si le LC est injoignable, la recevabilité reste calculable sur la dernière projection, avec cet avertissement ; elle n'est jamais bloquée.
- Le résultat de recevabilité est conservé avec le dossier à la date de calcul ; une relecture ultérieure en crée un nouveau sans effacer l'ancien.

#### FR-42 : Le contrôle de garantie ne se saute pas

Avant d'**évaluer** un dossier, il existe sur le dossier une **décision de garantie** enregistrée par un agent habilité (`GEST`, `RESP`, `DG`, `DT`) : `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, avec un **motif de 10 caractères au moins**, visible par `AUD`. « Garantie acquise » est interdite tant qu'un point bloquant de la recevabilité subsiste. Si l'information manque (police introuvable, projection ancienne), l'agent enregistre quand même une décision motivée : il ne peut pas passer outre sans décision. Un `REFUS_DE_GARANTIE` prononcé ferme l'évaluation et mène à `REJETE` avec un **courrier de refus motivé** (rédaction, usage n°11, §5.11). **Prospera ne refuse jamais la garantie seule** : il propose, l'agent décide. Cet écart corrige la démo, où la décision de garantie pouvait être sautée.

**Conséquences (testables) :**
- Passer en `EVALUE` sans décision de garantie est refusé (`GARANTIE_ENGAGEABLE`).
- Enregistrer « garantie acquise » avec un blocage non levé est refusé (`GARANTIE_ACQUISE_AVEC_BLOCAGE`) ; un motif de moins de 10 caractères est refusé (`MOTIF_ECRIT`).
- Un rôle sans droit de décision de garantie (`ACC`, `CPT`, `NUM`) voit l'action fermée avec sa raison.
- Après `REFUS_DE_GARANTIE`, l'action « Enregistrer l'évaluation » est fermée et la seule sortie ouverte est `REJETE` ou le renvoi motivé.
- La décision (auteur, date, motif, résultat de recevabilité du moment) figure dans le journal et dans la vue `AUD`.

#### FR-43 : Une déclaration tardive donne une réserve et un motif, jamais une déchéance automatique

Quand la déclaration dépasse le délai de déclaration de la garantie (défaut : **au moins 5 jours ouvrés, 48 heures pour le vol**, planchers de l'art. 12-4° ; la valeur de 3 jours de la démo pour le transport de marchandises est sous le plancher et est relevée à 5 jours ouvrés *(défaut H-037 : valeurs des conditions générales de la compagnie à confirmer à la séance d'immersion ; le plancher légal l'emporte)*), le dossier reçoit une **réserve « déclaration tardive »** avec le motif du retard saisi. **La déchéance n'est jamais automatique** : le Code CIMA (art. 12-4° et 20) fixe un délai contractuel qui ne peut être inférieur à 5 jours ouvrés (48 heures en cas de vol) et n'autorise la déchéance pour retard que si l'assureur **prouve un préjudice**. Le `RESP` décide si la réserve est levée, maintenue ou transformée en refus motivé. La réserve apparaît dans la fiche de décision (FR-77).

**Conséquences (testables) :**
- Une déclaration au-delà du délai de la garantie enregistre la réserve, sans changer le statut ni refuser l'ouverture.
- Un refus de garantie fondé sur le retard exige un motif qui consigne le préjudice subi par la compagnie ; sans ce texte le refus est refusé (`PREJUDICE_NON_ETABLI`).
- Une valeur de délai sous le plancher (moins de 5 jours ouvrés, moins de 48 heures pour le vol) est refusée à la configuration (`DELAI_SOUS_PLANCHER_LEGAL`) ; le plancher l'emporte sur l'annexe D.
- Les délais de déclaration sont lus par garantie dans la projection du LC ; le minimum légal (5 jours ouvrés ; 48 h pour le vol) est un plancher que le paramétrage ne peut pas franchir.
- La réserve et sa décision sont lisibles de `AUD`.

#### FR-44 : Les pièces obligatoires et complémentaires dépendent du type de sinistre

Pour chaque **type de sinistre** (automobile corporel, automobile matériel, automobile collision, incendie, dégât des eaux, multirisque habitation, vol, transport, responsabilité civile générale, accident du travail, décès, divers), la compagnie paramètre une liste de **pièces obligatoires** et une liste de **pièces complémentaires**. Les listes de la démo sont reprises par défaut (annexe D). Les pièces obligatoires bloquent l'**évaluation** et conditionnent l'ouverture directe (FR-45) ; les complémentaires ne bloquent rien. Le rapport d'expertise n'est **pas** une pièce obligatoire : c'est un document que la procédure produit, non une pièce apportée par l'assuré. Le **volet par défaut** découle du type : corporel, accident du travail et décès vont au volet corporel ; matériel et collision au volet matériel ; les autres au volet risques divers. Pour les dossiers de dommage corporel, la liste intègre les pièces que le Code CIMA demande à la victime ou aux ayants droit (art. 240 et 241 : pièce d'identité, extrait d'acte de naissance, acte de mariage, certificat médical initial ; certificat de décès, jugement d'hérédité, certificat de vie, certificat de genre de mort) *(point juridique J-07 : liste de la démo complétée par les art. 240-241 ; à valider par le juriste avant mise en service)*.

**Conséquences (testables) :**
- Chaque type de sinistre a une liste de pièces obligatoires et une liste de pièces complémentaires lisibles et modifiables par `ADMIN` sans nouvelle version du produit ; une modification vaut pour les dossiers ouverts après elle.
- La liste par défaut du type automobile corporel est : constat amiable, déclaration signée, certificat médical initial, rapport de police, pièce d'identité, attestation d'assurance (valeurs de la démo).
- Le volet d'un dossier est dérivé de son type à l'enregistrement et visible ; il n'est pas modifiable par l'accueil.
- Une pièce « rapport d'expertise » ne figure dans aucune liste de pièces obligatoires.
- Chaque pièce porte l'état `ATTENDUE`, `RECUE`, `EN_CONTROLE`, `VALIDEE` ou `REJETEE`, et sa source (`SCAN_LOT`, `SCANNER`, `TELEVERSEMENT`, `MOBILE`, `WHATSAPP`, `COURRIER`).

#### FR-45 : Ouvrir « en attente de pièces », puis reprendre le circuit

La phase d'ouverture a deux issues. Si toutes les pièces obligatoires sont reçues, l'agent **ouvre** le dossier (`DECLARE → OUVERT`, transition 1). Sinon, il l'**ouvre en attente de pièces** (`DECLARE → PIECES_ATTENDUES`, transition 2) : le dossier reçoit son numéro, sa provision et ses échéances **sans attendre les pièces** (faute corrigée dans la démo : un dossier déclaré le soir sans constat restait « déclaré », sans gestionnaire ni provision). Quand les pièces obligatoires sont reçues, l'action « Reprendre le circuit » (`PIECES_ATTENDUES → OUVERT`, transition 3) devient possible. Si l'assuré reste injoignable, le dossier peut être classé `SANS_SUITE` avec motif (FR-31). La vérification du **contrat** (FR-41, question 1) produit une **réserve**, jamais un blocage de l'ouverture ; l'ouverture n'exige pas non plus que la garantie soit acquise.

**Conséquences (testables) :**
- Ouvrir directement sans toutes les pièces obligatoires est refusé (`PIECES_COMPLETES`) et le refus nomme les pièces manquantes ; l'action « ouvrir en attente de pièces » reste ouverte.
- L'ouverture en attente de pièces donne une provision d'ouverture (FR-49) et fait courir l'accusé de réception (FR-48).
- « Reprendre le circuit » est fermée tant qu'une pièce obligatoire est à l'état `ATTENDUE`, avec la liste des pièces manquantes comme raison.
- Un contrat non valide (police hors période ou non en vigueur) ne ferme pas l'ouverture : il porte la réserve `CONTRAT_VERIFIE` au dossier (FR-41). Le refus de garantie n'arrive que par la décision `REFUS_DE_GARANTIE` (FR-42), puis `REJETE` motivé.
- L'accueil peut ouvrir et reprendre ; il ne peut pas affecter (FR-50).

#### FR-46 : La liste exacte des pièces est remise à l'assuré, avec un courrier de demande

À l'ouverture, Prospera produit pour l'assuré la **liste exacte des pièces à fournir**, tirée du type de sinistre, avec pour chaque pièce **qui doit la fournir** : l'assuré, l'expert, l'administration (police, gendarmerie, état civil) ou un tiers. Il prépare le **courrier de demande de pièces** (modèle `DEMANDE_PIECES`) adressé au bon interlocuteur, et le range au dossier. Les pièces demandées à l'assuré sont aussi remises sur l'accusé de déclaration (FR-36). Pour les dommages corporels, la correspondance rappelle : l'assuré peut obtenir copie du procès-verbal et se faire assister d'un conseil à ses frais (art. 232), le nom du gestionnaire du dossier et les conséquences d'un défaut de réponse (art. 242). La **copie** de chaque courrier envoyé est **archivée automatiquement** au dossier. Un lot de courriers `A_IMPRIMER` s'imprime en **impression groupée**, avec un **bordereau de départ** : chaque courrier passe `ENVOYE` à la remise au courrier, avec l'agent et l'heure. Un **registre unique des courriers sortants** les rassemble. Le catalogue des 7 modèles est listé en D.3, avec leurs mentions légales ; il comprend un modèle de **courrier FGA / exception de garantie** (avis à la victime avec le numéro du contrat, actif si `FGA_ACTIF`) et un modèle de **convocation d'expertise matérielle** (date, lieu, documents à apporter, préavis de 48 h). Tous les courriers sont des **modèles de la compagnie** : leur texte est à obtenir à la séance d'immersion *(défaut H-038 : modèles de la démo à remplacer par ceux de la compagnie)*.

**Conséquences (testables) :**
- La liste remise ne contient que les pièces obligatoires et complémentaires du type de sinistre, sans une de plus ni de moins, chacune avec son destinataire.
- Le courrier de demande est classé au dossier avec son canal, sa date de départ et son statut (`BROUILLON`, `A_IMPRIMER`, `ENVOYE`, `REMIS`, `RETOURNE`).
- Le courrier d'un dossier corporel contient les mentions des art. 232 et 242 ; un modèle corporel sans ces mentions est refusé à l'enregistrement du modèle (`MENTION_LEGALE_ABSENTE`).
- Un courrier envoyé est archivé en copie sans action de l'agent ; un lot `A_IMPRIMER` produit un bordereau de départ, et chaque courrier passe `ENVOYE` avec l'agent et l'heure de la remise au courrier. Le registre unique des courriers sortants contient chaque courrier une seule fois.
- Un modèle de convocation d'expertise matérielle sans date, lieu, documents ou préavis de 48 h est refusé à l'enregistrement du modèle (`MENTION_LEGALE_ABSENTE`) ; le modèle FGA n'est proposé que si `FGA_ACTIF`.
- La date de présentation de la demande est horodatée : elle sert de point de départ au calcul des suspensions du délai d'offre (FR-85).

#### FR-47 : Pièces manquantes et relances rédigées par l'IA (usage n°4)

Pour un dossier `PIECES_ATTENDUES`, l'IA commune **identifie les pièces manquantes** et **rédige la relance** adaptée au canal.

- **Entrée :** le dossier (type, pièces attendues et reçues, nombre et dates des relances, canal préféré, gravité).
- **Sortie :** le message de relance (SMS, WhatsApp, e-mail ou script d'appel), la liste des pièces manquantes, le **moment conseillé** (appel à midi si l'assuré a déjà été relancé deux fois ou si le dossier est corporel ; WhatsApp sinon), et au troisième message un délai explicite *(défaut H-039 : « sous 15 jours » comme dans la démo)*.
- **Destinataire :** le gestionnaire ou l'accueil. La relance est **rédigée par l'IA et envoyée en un clic** par l'agent, qui la trace ; elle peut aussi être **envoyée automatiquement à l'échéance** (5 jours entre deux relances, 3 sans effet) *(défaut H-040 : envoi automatique à confirmer à la séance d'immersion)* ; sans ce paramètre, rien ne part seul.
- **Garde-fou :** les pièces citées sont celles du type de sinistre ; le message ne contient ni diagnostic ni donnée médicale ; **après 3 relances sans effet**, le système propose un arbitrage (classement sans suite, appel, visite) au lieu d'une relance de plus ; l'intervalle minimal entre deux relances d'un même interlocuteur est de 5 jours (paramètres).
- Servi par l'**IA commune** ; sans modèle, des modèles de messages à variables remplissent la même fonction.

**Conséquences (testables) :**
- La relance proposée liste exactement les pièces obligatoires à l'état `ATTENDUE` ; aucune pièce reçue n'y figure.
- Envoyer une relance avant l'intervalle minimal est refusé avec une alerte (`RELANCE_TROP_PROCHE`), levable par un motif.
- À la troisième relance sans effet, l'écran propose l'arbitrage et n'ajoute pas de relance par défaut.
- Chaque relance est journalisée (canal, date, auteur) et son texte est conservé au dossier ; l'usage est inscrit au registre de l'IA (niveau `RECOMMANDATION`).
- Le texte d'une relance corporelle ne contient aucune information médicale du dossier.
- Un clic sur « envoyer » envoie la relance rédigée et la journalise ; avec l'envoi automatique activé, la relance part à l'échéance avec la même trace (canal, date, texte), et jamais avant l'intervalle minimal de 5 jours.

#### FR-48 : Accusé de réception du dossier complet (10 jours au plus), courtier et coassureurs informés

À l'ouverture, Prospera produit l'**accusé de réception du dossier** (modèle `ACCUSE_RECEPTION`) à envoyer à l'assuré, **au plus tard 10 jours** après la déclaration, en **dernier recours** (l'accusé de déclaration portant la référence `DEC-` est déjà parti à l'enregistrement, FR-36) (**délai interne**, paramétrable : le Code CIMA n'en fixe pas pour les sinistres non VTM *(défaut H-041 : 10 jours, valeur de la démo)*). Le **courtier** qui a apporté le contrat est informé de l'ouverture. Si la police est en **coassurance**, les **coassureurs** sont informés selon la clé de répartition lue dans le LC ; si la compagnie est apériteur, elle instruit pour tous et les coassureurs remboursent leur quote-part (module `assurance`, §6.4). Le mémoire de 2014 relève des accusés de réception « jamais envoyés » : l'échéance est donc un indicateur de contrôle.

**Conséquences (testables) :**
- À l'ouverture, un accusé de réception est généré ; l'échéance de 10 jours court depuis la date de déclaration et s'arrête à l'envoi journalisé de l'accusé.
- Un accusé non envoyé au 8e jour *(défaut H-042 : alerte au 8e jour)* apparaît dans les alertes de l'agent ; au-delà de 10 jours, dans celles du `RESP`.
- L'ouverture d'un dossier avec courtier crée une information au courtier (notification) avec la référence du dossier ; elle ne contient aucune donnée de santé.
- Pour une police en coassurance, la liste des coassureurs et leurs parts apparaît sur le dossier, lue dans le LC, non modifiable dans Prospera.
- Le délai d'accusé est un paramètre par volet ; sa modification ne change pas les dossiers déjà ouverts.

#### FR-49 : La provision d'ouverture est posée à l'ouverture

À l'ouverture (y compris en attente de pièces), le dossier reçoit une **provision d'ouverture** : la charge estimée du sinistre, posée **sans attendre les pièces**. Au **corporel**, la provision d'ouverture est **saisie par l'humain avec un motif** : la machine ne calcule pas de milieu de tranche pour un préjudice corporel (FR-71). Pour les autres volets, elle est le **milieu de la tranche** de la grille d'ouverture qui correspond à la **gravité** (grilles par volet de la démo, reprises en paramètres), arrondi à 5 000 FCFA, ou l'**estimation du déclarant** si elle est saisie *(défaut H-043 : grilles en tranches de la démo reprises pour la provision d'ouverture seulement ; à remplacer par les règles de provisionnement de la compagnie)*. Elle est revue à chaque événement (FR-76). L'état des provisions du dossier est produit pour la comptabilité et le LC (module `assurance`, §6.4).

**Conséquences (testables) :**
- Un dossier ouvert sans estimation reçoit la provision du milieu de la tranche de sa gravité, arrondie au multiple de 5 000 FCFA.
- Sur un dossier du volet corporel, aucune provision d'ouverture n'est calculée par la machine : le gestionnaire la saisit avec un motif, et l'enregistrement sans motif est refusé (`MOTIF_ECRIT`).
- Une estimation du déclarant saisie remplace le milieu de tranche et est conservée comme source (« estimation du déclarant »).
- Le mouvement d'ouverture figure dans l'historique des provisions du dossier (jamais écrasé : une ligne ajoutée à chaque révision).
- Un dossier ouvert « en attente de pièces » a une provision ; un dossier sans provision depuis l'ouverture est une anomalie remontée au `RESP`.

### 5.3 Attribuer

#### FR-50 : Le responsable affecte le dossier ; l'accueil oriente, il n'affecte jamais

Un dossier `OUVERT` n'a pas de gestionnaire tant que le **responsable du service sinistres** (`RESP`) ne l'a pas **affecté** à un `GEST` du bon volet. L'**accueil oriente** (il vérifie le volet déduit du type de sinistre, ouvre, reprend le circuit) mais **n'affecte jamais** : le choix de qui instruit n'est pas un acte de guichet. Aucun gestionnaire ne **se prend** un dossier lui-même : un dossier non affecté depuis 1 jour ouvré est **remonté au `RESP`** (alerte existante). L'attribution se fait depuis la file « à affecter » du `RESP`, qui propose les gestionnaires du volet avec leur charge (FR-51). Le **motif** d'une affectation est facultatif à la première attribution et **obligatoire à toute réaffectation** (FR-51).

**Conséquences (testables) :**
- Une tentative de « prendre en instruction » (`OUVERT → EN_INSTRUCTION`) sur un dossier non affecté est refusée (`DOSSIER_AFFECTE`) ; la raison affichée est « le dossier doit avoir été attribué par l'encadrement ».
- Un `ACC` qui tente d'affecter reçoit `DROIT_INSUFFISANT` ; l'action n'est pas proposée à son écran.
- Un `GEST` ou `GREC` qui tente de prendre en instruction un dossier non affecté est refusé (`DOSSIER_AFFECTE`) : il n'existe plus d'exception « il le prend lui-même ».
- Le gestionnaire affecté ne figure que dans la liste de son volet : un `GEST` du volet matériel ne peut pas être affecté à un dossier du volet corporel (`VOLET_INCOMPATIBLE`).
- Le journal porte « affectation : non affecté → [nom] », l'auteur, la date et l'heure.
- Un dossier `OUVERT` non affecté depuis plus de 1 jour ouvré apparaît dans les alertes du `RESP` *(défaut H-044 : 1 jour ouvré)*.

#### FR-51 : La charge pondérée guide l'affectation ; la réaffectation exige un motif

La file « à affecter » affiche, pour chaque gestionnaire du volet, sa **charge pondérée** : le poids de ses dossiers actifs rapporté à sa capacité. Le poids d'un dossier dépend du type de sinistre et de la gravité (grille paramétrable) ; un gestionnaire est **surchargé** au-delà de 1,2 de sa capacité et **disponible** sous 0,8 (valeurs de la démo en paramètres). Le `RESP` peut **réaffecter** un dossier à un autre gestionnaire (absence, surcharge, conflit d'intérêts) avec un **motif obligatoire** ; la cible doit différer du titulaire actuel. Les **gestionnaires de la démo** (14 dont 3 corporel, 5 matériel, 3 risques divers, 3 recours) sont le jeu de démonstration, non l'effectif réel de la compagnie.

**Conséquences (testables) :**
- La charge d'un gestionnaire est recalculée à chaque affectation et réaffectation et affichée dans la liste de choix, avec le signal « surchargé » ou « disponible ».
- Réaffecter sans motif est refusé (`MOTIF_ECRIT`) ; réaffecter à la même personne est refusé (`CIBLE_IDENTIQUE`).
- Affecter un dossier à un gestionnaire surchargé est permis, avec un avertissement que le `RESP` doit accepter par un motif.
- Un gestionnaire absent (congé enregistré) apparaît dans la liste avec la mention d'absence ; sa corbeille est visible du `RESP` pour reprise (corbeille de service du volet).
- Chaque réaffectation est journalisée avec l'ancien titulaire, le nouveau, l'auteur et le motif.

### 5.4 Instruire (`EN_INSTRUCTION`)

#### FR-52 : Prendre le dossier en instruction

Le gestionnaire affecté **prend le dossier en instruction** (`OUVERT → EN_INSTRUCTION`, transition 5). Pendant l'instruction, il rassemble les pièces, requalifie la responsabilité, oriente et suit les expertises, prépare l'évaluation. Un dossier en instruction n'a qu'un titulaire. Le gestionnaire ne peut jamais valider son propre dossier ni émettre son règlement (FR-33, FR-81). Si le `RESP` instruit lui-même (transition 5), il **ne valide pas** ce dossier (SEP-01) et **ne siège pas au comité** pour lui.

**Conséquences (testables) :**
- `OUVERT → EN_INSTRUCTION` (transition 5) exige : droit `GEST`, `GREC` ou `RESP` ; dossier affecté ; sinon refus `DOSSIER_AFFECTE`.
- Un `RESP` qui a pris le dossier en instruction se voit refuser la validation du même dossier (`SEPARATION_DES_TACHES`, SEP-01) et ne figure pas parmi les votants du comité pour ce dossier.
- Le passage fixe la date de début d'instruction, qui sert aux indicateurs de délai (§6.7, FR-213).
- Un `GEST` ne voit et n'instruit que les dossiers de son volet ; un dossier d'un autre volet lui est refusé avec `VOLET_INCOMPATIBLE`.
- Le dossier `EN_INSTRUCTION` affiche en permanence : étape, pièces reçues et manquantes, montant évalué, déjà payé, reste à payer, dernière action.

#### FR-53 : Contrôle des pièces par l'IA : cohérence et photo réutilisée (usage n°3)

Quand une pièce est versée, l'IA commune **contrôle sa cohérence** avec le dossier et avec le portefeuille, **avant l'instruction** et avant tout paiement.

- **Entrée :** la pièce (texte lu, champs extraits par la lecture des pièces §6.2) et le dossier (police, immatriculation, dates, noms).
- **Sortie :** des **constats** de deux sortes : `CERTAIN` (calculés par règle : date hors période de la police, police non en vigueur, déclaration antérieure au sinistre, propriétaire de la carte grise différent de l'assuré, immatriculation différente de celle de la police) et `PROBABLE` (jugés par l'IA : incohérence de dates ou de noms, signature absente d'un constat, **photo déjà utilisée** dans un autre dossier). Chaque constat nomme sa source (pièce, extrait, police) et se termine par une **question à poser**, jamais par un verdict.
- **Destinataire :** le gestionnaire du dossier ; les constats `PROBABLE` à fort enjeu sont aussi visibles de `AUD` et alimentent le graphe de liens (§5.12).
- **Garde-fou :** un signal n'est pas une accusation ; **aucun rejet ni blocage automatique** d'une pièce ; seule la décision humaine passe la pièce à `VALIDEE` ou `REJETEE` ; la réutilisation de photo se mesure par empreinte d'image calculée en local *(défaut H-045 : comparaison d'empreintes d'images à construire ; la démo la simule)* ; le contenu médical des pièces n'est jamais affiché hors des rôles autorisés (FR-9, FR-153). Pour une **pièce médicale**, `ACC` et `NUM` ne voient **aucun extrait ni contenu** : le contrôle de qualité porte sur la **lisibilité de l'image seulement**, et la pièce est numérisée sous un type « médical », sans aperçu.
- Servi par l'**IA commune** (local). Tant qu'un modèle de vision n'est pas installé, les constats `CERTAIN` seuls sont servis, par règles ; l'écran dit que la photo n'est pas contrôlée.

**Conséquences (testables) :**
- Une carte grise dont l'immatriculation diffère de celle de la police produit un constat `CERTAIN` avec les deux valeurs et leurs sources.
- Une photo déjà versée dans un autre dossier produit un constat `PROBABLE` qui nomme l'autre dossier à `AUD` et au `RESP` seulement ; le gestionnaire voit le constat sans le contenu de l'autre dossier.
- Aucune pièce ne change d'état sans l'action d'un agent ; un constat sans suite reste visible et ne bloque rien.
- Chaque constat accepté, ignoré ou rejeté va au registre de l'IA avec son auteur.
- Pour une pièce médicale, `ACC` et `NUM` voient le type et l'existence de la pièce, jamais un extrait, un aperçu ni un constat qui en reprend le contenu ; le contrôle de qualité ne retourne que la lisibilité de l'image.
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

L'instruction technique se fait dans un **formulaire propre à chaque famille de sinistre** : véhicule (automobile matériel, collision, corporel), biens (incendie, dégât des eaux, multirisque habitation), vol, transport, responsabilité civile, divers. Chaque formulaire porte ses champs, ses calculs (FR-69, FR-72, FR-73) et ses alertes (`BLOQUANT`, `ALERTE`, `INFO`). L'accident du travail et le décès ne passent pas par un formulaire de calcul : ils relèvent du barème corporel (FR-70). Les alertes levées par défaut, reprises de la démo, sont : assuré fautif sur une garantie RC seule (indemnité nulle, bloquant) ; sinistre moins de 30 jours après la souscription ; autres sinistres sur la même immatriculation ; véhicule de plus de 15 ans ; usage taxi, moto-taxi ou marchandises (vérifier la couverture) ; origine criminelle d'un incendie (plainte et enquête) ; vol sans plainte (bloquant) ; plainte déposée plus de 2 jours après les faits ; transport sans réserve à la livraison (analyser le recours) ; prescription du recours contre le transporteur à 1 an après la livraison (2 ans en aérien), affichée comme terme à vérifier *(défaut H-046 : alertes et seuils de la démo ; chaque seuil est un paramètre de la compagnie)*. Les enregistrements du formulaire sont versionnés : chaque mise à jour est une ligne du journal.

**Conséquences (testables) :**
- Chaque type de sinistre ouvre son formulaire ; un type sans formulaire de calcul (accident du travail, décès) renvoie vers le décompte corporel.
- Une alerte `BLOQUANT` (par exemple vol sans plainte) empêche l'enregistrement de l'évaluation tant qu'elle n'est pas levée par le gestionnaire avec un motif ; la raison s'affiche (`ALERTE_BLOQUANTE_NON_LEVEE`).
- Les valeurs de seuil de chaque alerte sont paramétrables sans nouvelle version.
- Modifier le formulaire après évaluation arrêtée n'altère pas l'évaluation (FR-75).
- Les champs de santé d'un formulaire corporel sont masqués aux rôles non autorisés (FR-70).

#### FR-56 : Pré-remplissage de l'instruction par l'IA (usage n°7)

L'IA commune **reporte dans le formulaire d'instruction** ce que disent les pièces reçues.

- **Entrée :** les pièces reçues (texte lu, OCR inclus) et le formulaire en cours.
- **Sortie :** les valeurs de champs tirées des pièces (carte grise : immatriculation, marque, année ; permis ; devis ou facture : pièces et main-d'œuvre ; rapport d'expert : valeur vénale, valeur d'épave ; constat amiable : parties, assureur et numéro de police de chaque partie, circonstances, croquis, signatures ; procès-verbal ou plainte : circonstances d'un vol), avec **la pièce source de chaque champ** ; à défaut de valeur vénale, un repère « cote du marché local de l'occasion » signalé comme tel.
- **Destinataire :** le gestionnaire, qui relit, modifie et enregistre. L'« assureur et le numéro de police du tiers » lus du constat sont la **source du débiteur du recours** (FR-108). Le constat reste un paramètre : le Code CIMA n'en parle pas.
- **Garde-fou :** rien n'est enregistré sans l'action du gestionnaire ; chaque champ affiche sa source ; pour une pièce médicale, les données extraites d'un rapport médical sont **validées champ par champ par `MED`** avant tout usage (FR-64) ; la valeur issue d'une pièce non lue ou d'un champ de confiance basse est marquée « à confirmer » ; le pré-remplissage est journalisé (« instruction pré-remplie depuis la pièce X »). Il ne remplit **aucun champ de montant corporel** (FR-71).
- Servi par l'**IA commune** ; sans modèle, des règles de correspondance par type de pièce font le même travail sur les champs structurés.

**Conséquences (testables) :**
- Après versement d'une carte grise, le formulaire véhicule propose immatriculation, marque et année avec la mention de la pièce source ; sans pièce, aucun champ n'est proposé.
- Accepter, modifier ou rejeter un champ est journalisé au registre de l'IA (niveau `EXTRACTION`).
- Aucun champ n'est écrit tant que le gestionnaire n'a pas enregistré le formulaire.
- Un formulaire de dommage corporel n'est jamais pré-rempli sur un champ de montant.
- Après versement d'un constat amiable, l'assureur et le numéro de police de chaque partie sont proposés avec la pièce source, et alimentent le débiteur du recours (FR-108) après acceptation par le gestionnaire.
- Avec l'IA coupée, le formulaire se remplit à la main sans autre changement.

#### FR-57 : Demander des pièces complémentaires pendant l'instruction

Pendant l'instruction, le gestionnaire peut **demander des pièces complémentaires** (`EN_INSTRUCTION → PIECES_ATTENDUES`, transition 6) : le dossier revient « en attente de pièces » avec la liste de ce qui manque, un courrier de demande et la relance de FR-47. Il en va de même quand le `RESP` demande des pièces avant validation (FR-80). Les délais légaux du dommage corporel sont **suspendus** à partir de la présentation de la demande, selon les règles de FR-85, et le suivi horodate la demande et la réponse.

**Conséquences (testables) :**
- La transition est ouverte au gestionnaire ou au responsable ; elle liste les pièces demandées ; sans pièce nommée elle est refusée (`PIECES_NON_NOMMEES`).
- Le courrier de demande (FR-46) est préparé, et le dossier réapparaît dans la file des dossiers en attente.
- La reprise (`PIECES_ATTENDUES → OUVERT`) conserve le gestionnaire déjà affecté : il reprend l'instruction sans nouvelle affectation *(défaut H-047 : le titulaire est conservé pendant l'attente de pièces ; à confirmer)*.
- Les pièces demandées et leur date de présentation sont conservées pour le calcul des suspensions (FR-85).

#### FR-57a : Les sinistres majeurs

Un dossier dont l'enjeu atteint le **seuil de sinistre majeur** (paramètre `sinistre_majeur.seuil_fcfa`, défaut *(défaut H-048 : 20 000 000 FCFA ; à confirmer à la séance d'immersion)*) passe en **suivi renforcé**. Au franchissement du seuil, trois choses se déclenchent : l'**avis au réassureur selon le traité** (FR-190), la convocation d'un **comité de suivi**, et des **rapports périodiques** (quotidien ou hebdomadaire, au choix du `RESP`). Le dossier porte un **niveau de criticité** et un **contrôle de sous-assurance**. Une **vue dédiée** « sinistres majeurs » existe dans la corbeille de pilotage (FR-147). Le suivi renforcé ne change ni le circuit, ni les droits, ni les seuils de délégation (FR-78).

**Conséquences (testables) :**
- Le scénario `SIN-2026-9003` franchit le seuil et déclenche le suivi renforcé : avis au réassureur préparé, comité de suivi convoqué, premier rapport périodique planifié.
- Un dossier sous le seuil ne déclenche rien ; le franchissement par une révision de provision ou d'évaluation le déclenche une seule fois.
- Le niveau de criticité et le résultat du contrôle de sous-assurance sont visibles sur le dossier et dans la vue « sinistres majeurs ».
- Un rapport périodique non produit à son échéance remonte au `RESP` (alerte « rapport de sinistre majeur en retard »).
- Le seuil se modifie sans nouvelle version ; la modification ne change pas les dossiers déjà en suivi.

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
- Écarter un besoin sans motif est refusé (`MOTIF_ECRIT`) ; le besoin écarté est conservé en mission `ANNULEE` avec le motif de l'agent.
- Chaque orientation, retenue ou écartée, est inscrite au registre de l'IA (niveau `RECOMMANDATION`) avec la décision de l'agent.
- Avec l'IA coupée, le gestionnaire crée la mission à la main sans autre changement.

#### FR-59 : Les seuils d'expertise et la voie « accord sur devis »

Les règles suivantes sont des **paramètres** (valeurs de la démo, sauf accord sur devis, tiré du mémoire de 2014 et du PO). **Aucune expertise n'est requise** sous **250 000 FCFA**. L'expertise **externe** est **obligatoire** au-dessus de **3 000 000 FCFA**. L'expertise externe est aussi **impérative** pour une contre-expertise ou une expertise contradictoire, une fraude suspectée, un dossier contentieux, et un domaine que le panel interne ne couvre pas (la démo couvre en interne l'automobile matériel, le médical et la responsabilité, dans les zones de Lomé, Tsévié et Aného). Elle est **conseillée** si la zone n'est pas desservie ou si le panel interne est saturé. La **voie « accord sur devis »** permet de **retenir un devis de garage sans mission d'expertise** quand le sinistre est un **dommage matériel automobile** dont le **dossier est inférieur ou égal à 300 000 FCFA** et le **devis inférieur ou égal à 200 000 FCFA**, après le **contrôle du devis** (FR-60) *(défaut H-049 : 300 000 et 200 000 FCFA tirés du mémoire de 2014 sur la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer pour la compagnie)*. La voie est **fermée** dès qu'**une** des conditions cumulatives suivantes manque *(défaut H-277 : liste de six conditions ; aucune ne se désactive sans décision du `DT` ; à confirmer à la séance d'immersion)* : (1) le sinistre est un **dommage matériel automobile** ; (2) **aucun dommage corporel** n'est déclaré ni signalé sur le dossier ; (3) la **garantie est acquise**, sans réserve ouverte (FR-42) ; (4) **aucun signal de fraude** : score sous le seuil, aucun lien suspect, aucune revue ouverte (§5.12) ; (5) les **pièces obligatoires sont complètes** (FR-44) ; (6) **aucun tiers ne conteste** la responsabilité. Un tiers identifié qui ne conteste pas **n'exclut pas** la voie : le recours se prépare en parallèle (§5.10). Deux garde-fous complètent la voie. Le **cumul anti-fractionnement** : le total des accords sur devis d'une même **police** et d'un même **véhicule**, sur une **période glissante**, ne dépasse pas un plafond ; au-delà, la voie est fermée et l'expertise normale s'applique *(défaut H-278 : période de 90 jours)* *(défaut H-279 : plafond cumulé de 500 000 FCFA par police et par véhicule)*. L'**audit mensuel par échantillon** : chaque mois, le serveur tire au hasard une part des dossiers passés par la voie ; `AUD` les revoit et inscrit sa conclusion au registre *(défaut H-280 : 10 % des dossiers du mois, 5 au moins, ou tous s'il y en a moins de 5)*. Les montants de 300 000 et 200 000 FCFA restent **plus prudents** que ceux que le marché CIMA affiche (500 000 FCFA pour la convention camerounaise ; moins de 1 000 000 FCFA pour un assureur du marché ivoirien) : ce sont des paramètres, que la compagnie peut relever. Deux paramètres complètent la voie : un **inspecteur technique présent à l'expertise** si le devis dépasse 1 000 000 FCFA *(défaut H-050 : valeur de la compagnie étudiée par le mémoire de 2014 (zone CIMA), défaut vide, à confirmer à la séance d'immersion)*, et des **photos après réparation** *(défaut H-051 : défaut vide ; à confirmer à la séance d'immersion)*. L'accord sur devis est une **décision du gestionnaire**, avec motif, tracée comme l'équivalent d'une expertise close.

**Conséquences (testables) :**
- Un dossier de 120 000 FCFA n'exige aucune mission ; un dossier de 3 500 000 FCFA impose une mission externe et l'écran dit pourquoi.
- Un dossier matériel de 280 000 FCFA avec un devis de 190 000 FCFA ouvre l'action « retenir le devis » ; avec un devis de 210 000 FCFA, elle est fermée (`SEUIL_ACCORD_SUR_DEVIS_DEPASSE`).
- « Retenir le devis » sans contrôle de devis préalable est refusé (`CONTROLE_DEVIS_ABSENT`) ; le contrôle est une action, pas un automatisme.
- Un dossier dont un tiers conteste la responsabilité ne passe pas par l'accord sur devis : l'action est fermée (`TIERS_CONTESTANT`). Un tiers identifié qui ne conteste pas ne ferme pas la voie ; le recours s'ouvre en parallèle.
- Un test retire une condition à la fois (corporel signalé, garantie sous réserve, signal de fraude, pièce obligatoire manquante, tiers contestant) : à chaque fois, l'action « retenir le devis » est fermée (`VOIE_RAPIDE_FERMEE`) et le message nomme la condition qui manque.
- Une police et un véhicule ayant déjà deux accords sur devis de 200 000 FCFA dans les 90 jours : un troisième porte le cumul à 600 000 FCFA, au-dessus du plafond de 500 000 FCFA, la voie est fermée (`CUMUL_ACCORD_DEVIS_DEPASSE`) et l'expertise normale s'applique ; une fois le premier accord sorti de la période de 90 jours, la voie se rouvre.
- Chaque mois, le serveur tire l'échantillon de la voie rapide et le dépose dans la file de `AUD` ; l'audit enregistre une conclusion écrite par dossier au registre ; un mois sans audit est signalé au `DT`. `AUD` ne valide aucun de ces dossiers (SEP-01).
- Avec le paramètre « inspecteur technique » renseigné à 1 000 000 FCFA, un devis de 1 200 000 FCFA exige la présence de l'inspecteur à l'expertise ; avec le paramètre vide, aucune exigence ne s'applique ; il en va de même du paramètre « photos après réparation ».
- L'accord sur devis exige un motif ; il vaut « expertise validée » pour l'évaluation (FR-61) ; il est visible dans le dossier et dans les états.
- Les seuils sont modifiables sans nouvelle version ; la modification ne change pas les dossiers déjà évalués.

#### FR-60 : Analyse des devis par l'IA (usage n°8)

Quand un devis de réparation est versé, l'IA commune l'**analyse** poste par poste.

- **Entrée :** le devis (pièces, main-d'œuvre, zones endommagées, marque, usage du véhicule), le catalogue de références de prix de pièces, et l'**historique interne** des devis comparables (au moins 5 observations) et du garage.
- **Sortie :** pour chaque poste, la **fourchette de référence** (catalogue de pièces du marché local, coefficients par catégorie de véhicule), la **main-d'œuvre attendue** (heures x taux horaire) et le **surcoût** éventuel ; une alerte quand le surcoût dépasse 10 % du devis ; la **distribution** des prix observés dans le portefeuille (quartiles, rang du devis) avec la phrase « une comparaison n'est pas une règle » ; l'historique du garage (devis qui dépassent le marché).
- **Destinataire :** le gestionnaire, et la direction pour les statistiques.
- **Garde-fou :** **jamais de refus automatique** d'un devis ; le gestionnaire négocie avec le garage ou demande un second devis ; la fourchette cite sa source (catalogue ou historique) ; l'analyse d'un dossier **ne change pas entre deux consultations** (pas de tirage au sort : défaut corrigé dans la démo) ; le catalogue de prix est un paramètre de la compagnie *(défaut H-052 : catalogue de pièces et taux horaire à obtenir de la compagnie ou construits pendant la reprise des archives ; valeurs de la démo (par exemple pare-chocs 60 000 à 150 000 FCFA, taux horaire 8 000 FCFA) non retenues comme référence)*.
- Servi par l'**IA commune** ; sans historique suffisant (moins de 5 comparables), seule la fourchette du catalogue est servie, avec la mention « historique insuffisant ».

**Conséquences (testables) :**
- Un devis dont un poste dépasse la fourchette de plus de 10 % du devis total produit une alerte qui nomme le poste, la fourchette et la source.
- Deux consultations successives de la même analyse donnent le même résultat.
- Aucune action « refuser le devis » n'est proposée par l'analyse ; la demande de second devis est une action du gestionnaire.
- Avec moins de 5 comparables, l'écran affiche « historique insuffisant » et n'affiche pas de quartiles.
- Chaque analyse va au registre de l'IA (niveau `ANALYSE`) avec ses sources.

#### FR-61 : La mission d'expertise a sa propre machine d'états

Une **mission** a un **domaine** (automobile matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation), un **type** (`INITIALE`, `COMPLEMENTAIRE`, `CONTRADICTOIRE`, `CONTRE_EXPERTISE`), une **priorité** (`URGENTE`, `NORMALE`, `DIFFEREE`), un objet, des **points à traiter** et des **éléments à examiner**. Elle a **une seule machine d'états**, réécrite à partir de celle de la démo : `SUGGEREE → A_DESIGNER → EXPERT_DESIGNE → ACCEPTEE → [TRANSMISE] → EN_COURS → RAPPORT_ATTENDU → RAPPORT_RECU → [COMPLEMENT_DEMANDE] → VALIDEE`, avec les sorties `CONTESTEE`, puis `ARBITREE` (la contestation est tranchée par une contre-expertise), et `ANNULEE`. Pour une mission médicale, la même machine porte des **sous-étapes médicales** (`A_DESIGNER`, `CONVOCATION_ENVOYEE`, `EXAMEN_REALISE`, `RAPPORT_ATTENDU`, `RAPPORT_RECU`, `EN_ANALYSE`), insérées entre `ACCEPTEE` et `VALIDEE` (FR-63) ; il n'existe pas de seconde machine pour le médical. `TRANSMISE` n'existe que pour un expert externe : les pièces sortent de la compagnie, par le portail, un courriel sécurisé ou un dossier papier, avec lettre de mission et accusé de réception. Pour un expert interne, `ACCEPTEE` est un geste simple de prise en charge. **Toute décision sur un rapport est humaine** : accepter, demander un complément, demander une expertise complémentaire, contester, escalader, avec motif. Le gestionnaire ne peut évaluer (`EVALUE`) que si **toutes les missions non annulées sont `VALIDEE` ou `ARBITREE`**.

**Conséquences (testables) :**
- La condition `EXPERTISE_VALIDEE` (« toutes les missions non annulées sont `VALIDEE` ou `ARBITREE` ») s'évalue sur cette machine unique, y compris pour les missions médicales.
- Les transitions de la mission sont gardées par rôle, comme celles du dossier (§5.0) ; une transition hors graphe est refusée (`TRANSITION_MISSION_INTERDITE`).
- L'évaluation d'un dossier avec une mission ouverte (ni `VALIDEE`, ni `ARBITREE`, ni `ANNULEE`) est refusée (`EXPERTISE_VALIDEE`) ; la raison affichée nomme la mission en attente.
- Un dossier sans mission n'est pas bloqué : toutes les affaires n'ont pas d'expertise.
- Une mission `ARBITREE` ne bloque plus rien ; une mission `CONTESTEE` sans contre-expertise ouverte est une anomalie signalée au `RESP`.
- Un rapport d'expertise ne se dépose jamais parmi les pièces du dossier : il se dépose depuis sa mission et rejoint alors les pièces.
- Une décision humaine sur un rapport (accepter, compléter, contester, escalader) est enregistrée avec son auteur et son motif ; l'IA ne la prend jamais.

#### FR-62 : Désigner l'expert, interne ou externe

Le gestionnaire ou le responsable **désigne** l'expert de la mission parmi le référentiel (§6.3), avec un **classement** qui tient compte du domaine, de la zone, de la charge pondérée, du délai annoncé, du coût estimé et de l'indépendance. L'expert est **interne** (salarié ou vacataire, sans honoraires supplémentaires) ou **externe** (cabinet agréé). Le choix d'un expert interne quand l'externe est classé premier est une **décision motivée** (« expert interne : aucun honoraire à engager »). Au-delà d'un **seuil d'honoraires ou d'enjeu** (paramètres), la **désignation est validée par `RESP`** ; un choix **hors classement** exige un motif, lu par `AUD`. Le délai de rapport ne court qu'à l'**acceptation** de la mission par l'expert (il peut aussi la décliner : la mission retourne à `A_DESIGNER`). Les règles dures sont dans l'action, pas seulement dans la liste : un expert hors agrément, hors domaine ou en conflit est refusé (`EXPERT_NON_ELIGIBLE`), la contre-expertise a ses propres interdits (FR-66).

**Conséquences (testables) :**
- Désigner un expert dont l'agrément a expiré ou qui ne couvre pas le domaine est refusé (`EXPERT_NON_ELIGIBLE`).
- Désigner un expert externe quand le seuil impose l'externe est autorisé ; désigner un interne quand l'externe est imposé est refusé (`EXPERTISE_EXTERNE_IMPOSEE`).
- Un expert décline : la mission revient à `A_DESIGNER` avec le refus et son motif conservés ; l'expert décliné n'est plus proposé pour cette mission.
- Le délai de rapport attendu est calculé à l'acceptation ; avant elle, la mission affiche « délai non commencé ».
- La charge d'un expert (missions actives, en retard, taux d'occupation) est affichée avant désignation.
- Au-delà du seuil d'honoraires ou d'enjeu, la désignation n'est effective qu'après validation du `RESP` (`VALIDATION_DESIGNATION_REQUISE`) ; un choix hors classement sans motif est refusé (`MOTIF_ECRIT`) et, avec motif, apparaît dans la vue d'`AUD`.

#### FR-63 : L'expertise médicale : convocation, examen, rapport, médecin-conseil

Pour un dommage corporel, la mission médicale suit la **machine unique** des missions (FR-61), avec ses sous-étapes : `A_DESIGNER`, `EXPERT_DESIGNE`, `ACCEPTEE`, `CONVOCATION_ENVOYEE`, `EXAMEN_REALISE`, `RAPPORT_ATTENDU`, `RAPPORT_RECU`, `EN_ANALYSE`, `VALIDEE`, `CONTESTEE`, puis `ARBITREE`. Les **types** sont : initiale, contradictoire, contre-expertise, consolidation, aggravation. La **convocation** de la victime se fait **au moins 15 jours avant l'examen** et mentionne l'identité et les titres du médecin, l'objet, la date, le lieu, le nom de l'assureur, et le droit pour la victime de se faire assister d'un médecin de son choix à ses frais (art. 244 du Code CIMA, SÛR). Le rapport est transmis à la compagnie, à la victime et à son médecin **dans les 20 jours de l'examen** (art. 245). Le **médecin-conseil** (`MED`) lit, analyse et valide le fond médical (lésions, séquelles, taux d'incapacité permanente proposé, incapacité temporaire, consolidation, soins futurs, aggravation possible), mais **ne chiffre pas** de montant à la place du gestionnaire (FR-71). Les **certificats médicaux** ont un suivi : demandé, relancé, reçu, vérifié, non conforme, avec des **délais d'attente** par type (initial 8 jours, prolongation 8, arrêt de travail 8, reprise 10, guérison 12, consolidation 15, descriptif des séquelles 12, aggravation 12, rechute 10, complémentaire 8 ; valeurs de la démo en paramètres). La **qualification de l'expert** (expert judiciaire inscrit, diplômes appropriés ou 5 ans d'activité ininterrompue : art. 272) est vérifiée à sa désignation. Si la victime refuse l'examen ou conteste les conclusions, l'**expert commun** de l'art. 252 est proposé ; le délai d'offre est prorogé d'un mois (FR-85).

**Conséquences (testables) :**
- La convocation d'un examen daté moins de 15 jours après son envoi est refusée (`CONVOCATION_TROP_TARDIVE`) ; elle contient les mentions de l'art. 244.
- Le rapport reçu plus de 20 jours après l'examen est signalé à `RESP` et à `MED` (délai de l'art. 245).
- Le contenu médical d'une mission (certificats, rapports, conclusions) n'est lisible que de `MED`, du `GEST` corporel affecté, du `RESP`, et de `DG` ou `DT` pour une décision ; `ACC` voit seulement qu'une pièce médicale est reçue ; chaque lecture est journalisée.
- Un certificat non reçu dans son délai passe à « relance nécessaire » puis « en retard », avec relance (FR-47).
- Une désignation d'expert médical sans vérification de sa qualification (art. 272) est refusée (`QUALIFICATION_NON_VERIFIEE`).
- Une mission médicale n'a qu'un seul statut à la fois, pris dans la machine unique de FR-61 ; aucun statut propre au médical n'existe en dehors de ses sous-étapes.

#### FR-63a : Le suivi médical du dossier corporel

Le suivi médical d'un dossier corporel complète FR-63. Il comprend huit sous-règles *(défaut H-053 : motifs, jalons et types repris de la démo ; à confirmer avec le médecin-conseil)*.

1. **Certificats.** Chaque certificat passe un **contrôle de conformité** : date, médecin, signature, cachet, original ou copie, durée d'arrêt. Le verdict est `COMPLET` ou `NON_CONFORME`, avec motif. Chaque type de certificat a ses destinataires, son niveau d'impact (bloquant, limité, aucun) et son canal de relance.
2. **Chronologie médicale.** Le dossier porte une chronologie dont les natures d'événement sont : accident, soins, hospitalisation, consolidation, rechute, et les autres natures paramétrées.
3. **Convocation.** L'envoi est tracé (SMS et e-mail) ; la victime confirme ; son **absence** déclenche une **nouvelle convocation**, au moins 15 jours avant le nouvel examen (FR-63).
4. **Compte rendu d'examen.** Il consigne la présence, les documents présentés, les antécédents, les lésions et les examens réalisés ; les **séquelles** sont codées, avec leur taux.
5. **Suivi après consolidation.** Il porte le prochain examen, l'IPP initiale contre la nouvelle, l'écart, l'aggravation et la rechute.
6. **Missions médicales.** Les motifs de mission et un planning à jalons avec échéances sont paramétrés.
7. **Contestation médicale.** Elle est structurée : auteur, point contesté, valeur initiale et valeur revendiquée, statut.
8. **Statut d'évaluation de chaque expertise** : `RETENUE`, `ECARTEE`, `CONTESTEE` ou `ANCIENNE`.

Le contenu médical reste lisible des seuls rôles de FR-63 ; `ACC` et `NUM` voient le type et l'existence d'une pièce (FR-53). Le **médecin-conseil** (`MED`) valide chaque donnée extraite d'un rapport médical, champ par champ, avant usage (FR-64).

**Conséquences (testables) :**
- Un certificat sans cachet ni durée d'arrêt est `NON_CONFORME` avec ce motif ; un certificat complet est `COMPLET`.
- Une victime absente à l'examen ouvre une nouvelle convocation ; l'envoi (canal, date, heure) et la confirmation sont journalisés.
- Un dossier en suivi après consolidation affiche le prochain examen et l'écart entre l'IPP initiale et la nouvelle ; une aggravation ou une rechute y est consignée.
- Une contestation médicale sans auteur ou sans point contesté est refusée (`CONTESTATION_INCOMPLETE`).
- Deux expertises d'un même dossier ne peuvent pas être toutes deux `RETENUE` pour le même point ; une expertise supplantée passe à `ANCIENNE`.

#### FR-64 : Contrôle de complétude d'un rapport d'expertise, assisté par l'IA

Quand un rapport est reçu, l'IA commune contrôle sa **complétude** : la **forme**, pas le fond.

- **Entrée :** le rapport (rubriques saisies ou texte lu) et le domaine de la mission.
- **Sortie :** une grille de **points attendus par domaine**, chacun `PRESENT`, `INSUFFISANT` ou `ABSENT`, un **verdict** `EXPLOITABLE`, `EXPLOITABLE_SOUS_RESERVE` ou `NON_EXPLOITABLE`, un score, et des **demandes de complément** rédigées à cocher. Points types : automobile (méthode d'évaluation, valeur vénale, caractère économiquement réparable, **dommages préexistants distingués**, **photo du point de choc et de l'immatriculation**), médical (lésions, incapacité temporaire et permanente, consolidation, taux et barème retenu, souffrance, préjudice esthétique, tierce personne, réserves), responsabilité (séquence reconstituée, imputation motivée, **part du tiers chiffrée**), incendie (origine, tiers, inventaire chiffré, adéquation du capital), transport (quantités, réserves au déchargement), fraude (faisceau d'indices, position de l'assuré), bâtiment (cause, chiffrage), perte d'exploitation (période, marge brute), post-mortem (genre de mort, causalité, délai, examen, état antérieur).
- **Destinataire :** le gestionnaire, qui décide.
- **Garde-fou :** un rapport sans signature, sans chiffrage, sans conclusion ou sans identification du bien est **inexploitable quel que soit son score** ; le contrôle **lit les rubriques présentes mais vides** (« non précisée », « non renseignée ») ; il ne produit **jamais d'estimation concurrente** de celle de l'expert ; les données extraites d'un **rapport médical** sont **validées champ par champ par `MED`** avant tout usage.
- Servi par l'**IA commune** ; sans modèle, une grille de règles par domaine sert le contrôle et le dit.

**Conséquences (testables) :**
- Un rapport dont la rubrique « valeur vénale » contient « non renseignée » est classé « sous réserve » avec ce point en rouge, même s'il est présent.
- Un rapport sans signature est `NON_EXPLOITABLE` quel que soit le score.
- Un rapport de responsabilité dont la part du tiers n'est pas chiffrée est refusé au dépôt (`PART_TIERS_NON_CHIFFREE`).
- Un rapport automobile sans distinction des dommages préexistants, ou sans photo du point de choc et de l'immatriculation, est `EXPLOITABLE_SOUS_RESERVE` avec ces points en rouge.
- Une donnée extraite d'un rapport médical ne sert à aucun calcul ni écran tant que `MED` ne l'a pas validée champ par champ.
- Le verdict ne change pas le statut de la mission : la décision du gestionnaire (accepter, compléter, contester, escalader) le fait.
- Chaque contrôle va au registre de l'IA (niveau `ANALYSE`) avec ses sources.

#### FR-65 : L'écart entre le rapport et le dossier : 15 % d'attention, 35 % bloquant

À la réception d'un rapport, Prospera le **confronte à des contreparties nommées et sourcées** : devis versé, provision, médiane d'au moins 5 missions comparables, pièce absente. Prospera ne fabrique **jamais** sa propre estimation du dommage. L'écart se termine par une **question, jamais par un verdict** *(défaut H-054 : à trancher avec le PO ; recommandation de la rédaction)*. Le filtre `volet = corporel` s'applique : sur un dossier corporel, aucune médiane, aucun comparable et aucun écart en pourcentage n'est affiché (liste blanche des volets : matériel, risques divers ; FR-71). Un **écart** a une nature (`MONTANT`, `PIECE_ABSENTE`, `CONTRADICTION`, `DELAI`, `PERIMETRE`), un niveau (`INFO`, `ATTENTION`, `BLOQUANT`), la valeur du rapport, la valeur de référence, sa source, et une **question** à poser ; il ne conclut jamais par un verdict. Pour le montant, l'écart est **ATTENTION au-delà de 15 %** et **BLOQUANT au-delà de 35 %** (valeurs de la démo, paramètres). Un écart **BLOQUANT** n'interdit rien en soi : il oblige le gestionnaire à **prendre une décision motivée** sur le rapport (accepter avec motif, demander un complément, contester) avant de valider la mission. L'écart du dossier d'exemple (chiffrage de l'expert inférieur de 65 % au devis du garage) est le cas type. La **médiane des dossiers comparables** (au moins 12 comparables, écart significatif 25 %) est affichée comme repère, à côté de l'instruction technique et du montant validé, **sans jamais fondre les trois chiffres**.

**Conséquences (testables) :**
- Un rapport à 445 500 FCFA face à un devis de 1 273 000 FCFA produit un écart de 65 %, de niveau `BLOQUANT`, avec la question « quels postes du devis avez-vous écartés, et pour quel motif ? ».
- Valider une mission avec un écart `BLOQUANT` sans motif est refusé (`MOTIF_ECRIT`).
- Un rapport remis après la date attendue produit un écart `DELAI` qui nomme le nombre de jours.
- Chaque écart nomme sa contrepartie et sa source ; aucun texte d'écart ne contient de verdict de fraude, ni une estimation propre à Prospera.
- Sur un dossier du volet corporel, l'écran du rapport n'affiche ni médiane, ni comparable, ni écart en pourcentage ; sur un dossier matériel ou risques divers, la médiane s'affiche avec sa source.
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

Quand le gestionnaire demande un **complément** à l'expert (`COMPLEMENT_DEMANDE`), le rapport complété doit revenir avant la validation de la mission. Si le complément n'est **pas revenu**, la validation est **bloquée** (`COMPLEMENT_EXPERT_RECU`), **sauf passage outre du `RESP` avec un motif** : le `RESP` accepte alors le rapport en l'état, et ce passage outre est tracé et visible de `AUD`. Quand un cabinet n'a **pas de compte** sur le portail expert, le gestionnaire **saisit** le rapport reçu par courrier ou par courriel (pièce jointe obligatoire, rapport marqué **« saisi pour le cabinet »**) et reste responsable de l'exactitude de la saisie ; les cabinets qui ont un compte déposent eux-mêmes (§6.3).

**Conséquences (testables) :**
- Valider une mission `COMPLEMENT_DEMANDE` sans rapport complété est refusé (`COMPLEMENT_EXPERT_RECU`) ; le `RESP` seul peut passer outre, avec un motif, et le passage outre figure au journal.
- Un `GEST` qui tente de passer outre reçoit `DROIT_INSUFFISANT`.
- Saisir un rapport pour un cabinet sans compte sans pièce jointe est refusé (`PIECE_JOINTE_OBLIGATOIRE`) ; le rapport saisi porte la marque « saisi pour le cabinet » et le nom du saisissant.
- Chaque version du rapport est conservée (versions successives), l'ancienne n'est pas écrasée.
- Les décisions sur un rapport (accepter, compléter, contester) créent une ligne de journal avec motif.

#### FR-68 : Délais de rapport par domaine et honoraires d'expert

À l'acceptation, la mission reçoit une **date de rapport attendue**, selon le domaine (valeurs de la démo, paramètres) : automobile matériel 7 jours, médical 21, responsabilité 14, fraude 30, incendie 21, transport 14, bâtiment 21, perte d'exploitation 30. Le mémoire de 2014 donne 7 jours pour les dommages et 10 jours pour la responsabilité civile à compter de la réception de tous les éléments *(défaut H-055 : valeurs de la démo retenues ; à confirmer avec la liste des experts agréés et leurs conventions)*. Trois paramètres complètent les délais : une **information écrite du retard à l'expert à 45 jours**, un **procès-verbal de carence à 75 jours** et un **délai de validation du rapport de 72 heures ouvrées** *(défaut H-056 : défauts de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer à la séance d'immersion)*. Les **honoraires** suivent **cinq montants** : budget prévisionnel, honoraires convenus, facturés, visés, payés. Le **budget indicatif** est calculé : (socle du domaine + le moindre de 2 % de l'enjeu et du plafond moins le socle) x coefficient de type (initiale 1, complémentaire 0,5, contradictoire 1,5, contre-expertise 1,5), arrondi à 5 000 FCFA, puis confirmé ou ajusté par le gestionnaire. **Viser** au-delà du convenu exige un **motif** ; le visa est donné par `RESP` (jamais par `CPT`), seulement si le **rapport est validé** et la facture rapprochée de la lettre de mission ; un **budget dépassé** est **bloquant** au-delà d'une tolérance paramétrée *(défaut H-057 : 10 % ; à confirmer à la séance d'immersion)*, et non plus seulement signalé ; les honoraires ne sont jamais calculés au prorata de l'indemnité (écart relevé par l'audit de 2014). Un expert interne ne génère aucun honoraire. Les honoraires s'ajoutent à l'état des règlements (§5.8, règlement vers un tiers).

**Conséquences (testables) :**
- La date de rapport attendue est calculée à l'acceptation, selon le domaine ; un rapport non reçu à cette date apparaît dans les alertes du gestionnaire et du `RESP` (« rapport en retard »).
- Viser des honoraires supérieurs aux honoraires convenus sans motif est refusé (`MOTIF_ECRIT`).
- Un `GEST` ne vise pas des honoraires (`DROIT_INSUFFISANT`) ; `RESP` et `CPT` le peuvent.
- Les cinq montants d'une mission sont affichés ensemble et jamais fondus.
- Les valeurs de socle, de coefficient, de plafond et de pourcentage du budget indicatif sont des paramètres ; les calculs les relisent à chaque mission.

### 5.6 Chiffrer (`EVALUE`)

Chiffrer, c'est établir le **décompte** : de quoi est fait le montant que la compagnie doit. Le décompte est un calcul explicable, poste par poste, jamais un chiffre tombé d'une grille. Les grilles en tranches de la démo (une par volet) ne servent **que** pour la provision d'ouverture et le pilotage (FR-49) ; elles ne font pas l'indemnité.

#### FR-69 : Le décompte suit un ordre fixe : dommage, vétusté, règle proportionnelle, plafond, franchise

Pour les sinistres qui ne sont pas du dommage corporel, le **décompte** enchaîne, dans cet ordre : le **dommage** constaté, la **vétusté**, la **règle proportionnelle** si elle s'applique, le **plafond** de la garantie, puis la **franchise** (ordre du code de la démo). Chaque étape est affichée avec sa valeur et sa source. La **franchise est déduite** du montant arrêté (écart avec la démo, où la déduction était une décision manuelle) : franchise retenue = le moindre du dommage et du plus grand de (dommage x taux de franchise) et (franchise minimale), le taux et le minimum étant lus sur la garantie souscrite. Le **plafond** est celui de la garantie ; la part au-dessus du plafond reste à la charge de l'assuré et est affichée. La **règle proportionnelle** (sous-assurance : capital assuré inférieur à la valeur réelle) multiplie par le rapport capital sur valeur et déclenche une alerte de sous-assurance *(défaut H-058 : ordre de la démo ; à confirmer par la compagnie, ses conditions générales pouvant prévoir un autre ordre)*. Les plafonds, taux de franchise, minimums et délais viennent de la projection des contrats lue dans le LC (D4) ; Prospera ne les modifie pas.

**Conséquences (testables) :**
- Pour un dommage de 780 000 FCFA avec une franchise de 10 % et un minimum de 50 000 FCFA, la franchise retenue est 78 000 FCFA et l'indemnité 702 000 FCFA ; avec un dommage de 300 000 FCFA, la franchise est 50 000 FCFA (le minimum).
- Une franchise supérieure au dommage est ramenée au dommage ; l'indemnité n'est jamais négative.
- Un dommage supérieur au plafond donne un montant au plafond ; l'excédent à la charge de l'assuré est affiché sur l'écran et dans l'offre.
- Un capital assuré inférieur à la valeur réelle applique la règle proportionnelle et lève l'alerte « sous-assurance ».
- Chaque ligne du décompte (dommage, vétusté, proportionnelle, plafond, franchise) est stockée avec sa source et sa valeur ; elles se retrouvent à l'identique dans l'offre et dans « Pourquoi ce montant ? » (FR-74).

#### FR-70 : Le corporel se calcule poste par poste, selon le Code CIMA (art. 257 à 266)

Pour les dommages corporels (accident corporel de la circulation, accident du travail, décès), le décompte est un **calcul poste par poste** : « les seuls préjudices susceptibles d'être indemnisés sont ceux mentionnés aux articles 258 à 266 » (art. 257, SÛR), et le moteur n'en connaît **pas d'autres**. Chaque poste porte son état **retenu** ou **contesté** ; pour l'incapacité, il porte aussi la **période datée** (incapacité temporaire totale ou partielle, ITT ou ITP). La **consolidation enregistrée** ouvre l'échéance de l'**offre définitive** (FR-141). Les postes sont, article par article :

- **Art. 258, frais.** Plafonnés à 2 fois le tarif le plus élevé des hôpitaux publics du pays de l'accident, 1 fois en cas d'évacuation sanitaire. Sur demande, une **lettre de garantie de frais médicaux** est émise : son modèle est au catalogue des courriers (FR-46).
- **Art. 259, incapacité temporaire.** Indemnité mensuelle plafonnée à 6 fois le SMIG annuel.
- **Art. 260, incapacité permanente, en trois postes.** Physiologique : taux de 0 à 100 % selon le barème médical annexé, multiplié par la valeur du point, elle-même exprimée en pourcentage du SMIG annuel selon le taux et l'âge. Économique : seulement si le taux est de 50 % au moins, plafond 10 fois le SMIG annuel. Moral : seulement si le taux est de 80 % au moins, 2 fois le SMIG annuel.
- **Art. 261, tierce personne.** Si le taux est de 80 % au moins, sur prescription médicale confirmée par expertise, plafonnée à 50 % de l'indemnité d'incapacité.
- **Art. 262, souffrance physique et préjudice esthétique.** Indemnisés séparément, échelle en pourcentage du SMIG annuel.
- **Art. 263, pertes de gains professionnels futurs.**
- **Art. 263-1, préjudice scolaire.** 12 mois de bourse officielle.
- **Art. 264, frais funéraires** (décès). Plafond 2 fois le SMIG annuel.
- **Art. 265, préjudice économique de chaque ayant droit** (décès). Capital de rente, revenu fictif d'un SMIG annuel à défaut de revenus justifiés, plafond global 85 fois le SMIG annuel.
- **Art. 266, préjudice moral par bénéficiaire** (décès).
- **Art. 229, personne à la charge effective.** Une catégorie « personne à la charge effective » est prévue, ou la question est renvoyée au §13.2 *(point juridique J-08 : catégorie à valider par le juriste, §13.2)*.
- **SMIG.** Le SMIG est un **paramètre daté** : celui du pays de l'accident ou, s'il est plus élevé, celui du pays de résidence de la victime (art. 259 et suivants) ; il n'est jamais codé en dur. Les **plafonds** sont des multiples du SMIG, paramétrés.
- **Tables.** La valeur du point d'incapacité permanente par taux et par âge, les clés de répartition entre ayants droit, la table de conversion des rentes et le barème médical d'incapacité sont des **images** du PDF officiel : leur **saisie** (double saisie et relecture, puis jeux d'essai chiffrés validés par un actuaire ou un juriste) est une **tâche du plan**, et la revue juridique précède la mise en service.
- **Mode dégradé.** Si les tables sont `TABLE_NON_VALIDEE` à la mise en service, le volet corporel s'ouvre en **saisie manuelle motivée** : les échéances légales restent actives et l'écart avec le barème est tracé (§1, A-12).
- **Plancher et tiers payeurs.** Une offre **ne peut pas être inférieure** au barème (art. 231, al. 2) ; un écart sous le plancher est une alerte `OFFRE_SOUS_BAREME`. L'offre affiche chaque chef de préjudice (art. 243) et les créances des tiers payeurs (art. 246, 254-255).

*(point juridique J-09 : SMIG du Togo 52 500 FCFA par mois depuis le 1er janvier 2023 (sources secondaires, texte officiel non trouvé), SMIG annuel = 12 fois le mensuel ; tout est paramètre daté, à confirmer par le juriste ; la lecture du plafond de l'art. 263 (« six mois de revenus plafonnés à trente-six fois ») est ambiguë et à faire valider)* *(action A-12 au §12.2)*.

**Conséquences (testables) :**
- Le décompte corporel affiche un poste par chef de préjudice de la liste de l'art. 257 à 266 et aucun autre ; ajouter un poste hors liste est refusé (`POSTE_HORS_BAREME`).
- Le préjudice économique de l'incapacité permanente est refusé sous 50 % de taux (`CONDITION_POSTE_NON_REMPLIE`) ; le préjudice moral et la tierce personne le sont sous 80 %.
- Changer la valeur du SMIG daté change les nouveaux décomptes ; il ne change pas ceux qui sont arrêtés (FR-75).
- Les tables saisies (valeur du point, répartition, conversion des rentes, barème médical) portent leur version, leur date, et deux saisies concordantes ; une table sans double saisie bloque l'utilisation du poste en production (`TABLE_NON_VALIDEE`), sauf en mode dégradé : le volet s'ouvre alors en saisie manuelle motivée, les échéances légales courent et l'écart au barème est tracé.
- Chaque poste porte `RETENU` ou `CONTESTE` ; un poste d'incapacité sans période datée est refusé (`PERIODE_NON_DATEE`) ; l'enregistrement de la consolidation ouvre l'échéance de l'offre définitive.
- Une lettre de garantie de frais médicaux se génère sur demande depuis le catalogue des courriers.
- Une offre inférieure au barème est signalée et ne part pas sans motif du responsable (FR-77).
- Les créances de tiers payeurs sont saisies par poste ; un tiers payeur qui n'a pas produit sa créance dans les 6 mois de la demande est déchu (art. 254-255) : l'échéance est suivie.
- Les pièces et champs médicaux du dossier ne sont lisibles que des rôles de FR-63.

#### FR-70a : Le registre des décès et des ayants droit

Pour un dossier **mortel**, Prospera tient un **registre des ayants droit**. Chaque ligne porte : la qualité, le fondement du droit, la vérification, la part successorale, et, pour un **mineur**, le représentant légal et l'autorisation du juge. Elle porte aussi le RIB vérifié et les documents : acte de naissance, hérédité, non-remariage, tutelle. Un règlement à un ayant droit exige sa ligne **vérifiée**. Pour un mineur, la transaction est soumise aux parents ou au juge des tutelles (art. 234 *(point juridique J-10 : à valider par le juriste, §13.2)*). Le registre s'appuie sur les postes de décès de FR-70 et alimente les contrôles de règlement (FR-86, FR-91, FR-100).

**Conséquences (testables) :**
- Un règlement à un ayant droit dont la ligne n'est pas vérifiée est refusé (`AYANT_DROIT_NON_VERIFIE`).
- Une ligne d'ayant droit mineur sans représentant légal ni autorisation du juge ne peut pas être vérifiée ; la transaction n'est pas enregistrée tant qu'elle manque.
- Un RIB d'ayant droit non vérifié ferme le règlement par virement pour cet ayant droit.
- La somme des parts successorales vérifiées ne dépasse pas 100 % (`PARTS_SUPERIEURES_A_100`).
- Le registre est lisible des seuls rôles de FR-63 pour les données de santé ; il ne contient aucune donnée médicale.

#### FR-71 : L'IA ne propose jamais de montant sur un préjudice corporel

**Aucune capacité de l'IA** (pré-remplissage, comparaison, explication, simulation, rédaction) ne **propose, suggère, devine ou pré-remplit un montant** sur un préjudice corporel. Ce montant est du ressort du **gestionnaire**, au vu de l'avis du **médecin-conseil** (qui dit le taux, jamais l'argent) et du barème. L'IA peut **expliquer** un décompte déjà calculé (FR-74) ; elle ne le **produit** pas. Cette règle est un garde-fou de la fiche IA (§7.4) : elle est testée comme telle.

**Conséquences (testables) :**
- Aucune réponse de l'IA sur un dossier corporel ne contient de montant qui ne vienne du décompte du gestionnaire ; un test soumet chaque usage de l'IA à un dossier corporel et n'obtient aucun montant produit par l'IA.
- Le pré-remplissage de l'instruction (FR-56) ne remplit aucun champ de montant corporel ; la comparaison au portefeuille (FR-65) n'affiche pas de médiane de montant corporel.
- Le registre de l'IA ne contient jamais d'entrée de niveau `RECOMMANDATION` ou `EXTRACTION` portant un montant corporel.
- Le `MED` n'a pas de champ de montant dans son écran ; il saisit des taux, des durées, des qualifications.

#### FR-72 : Le matériel automobile : vétusté sur pièces selon l'âge, et épave

Pour un dommage matériel automobile, la **vétusté s'applique aux pièces seulement**, selon l'**âge du véhicule** (grille indicative de la démo, en paramètre : jusqu'à 1 an 0 % ; jusqu'à 2 ans 10 % ; jusqu'à 3 ans 20 % ; jusqu'à 5 ans 30 % ; jusqu'à 8 ans 40 % ; au-delà 50 %). **Réparation retenue** = pièces x (1 moins la vétusté) + main-d'œuvre. Si le coût de remise en état (pièces plus main-d'œuvre) **dépasse la valeur vénale**, le véhicule est une **épave** : indemnité brute = valeur vénale moins valeur de l'épave ; la **décision de véhicule** (`A_DECIDER`, `REPARATION`, `EPAVE`) est validée, puis la **cession de l'épave** est préparée et son produit enregistré comme récupération. La franchise s'applique ensuite (FR-69), nulle en garantie RC seule *(défaut H-059 : grille de vétusté indicative de la démo ; à remplacer par la grille de la compagnie)*. La **réparation** est suivie (véhicule entré, travaux, facture reçue, contrôle avant règlement) ; le montant que le garage peut facturer est le **montant autorisé**, tout supplément exigeant une demande motivée.

**Conséquences (testables) :**
- Les postes d'un dossier matériel (réparation, vétusté, immobilisation, remorquage, valeur de remplacement) portent chacun leur état (FR-73).
- Un véhicule de 4 ans a une vétusté de 30 % sur les pièces et de 0 % sur la main-d'œuvre.
- Un véhicule dont pièces plus main-d'œuvre dépassent la valeur vénale passe en décision « épave » ; l'indemnité brute est la valeur vénale moins la valeur d'épave.
- Un montant facturé par le garage au-delà du montant autorisé sans demande motivée est refusé au contrôle avant règlement (`SUPPLEMENT_NON_AUTORISE`).
- Une garantie RC seule avec assuré fautif donne un montant de zéro et une alerte `BLOQUANT` (pas d'indemnité pour son propre véhicule).
- La grille de vétusté et le choix de la valeur vénale (cote du marché local, expertise) sont tracés dans l'évaluation.

#### FR-73 : Les autres types de sinistre, et l'arrondi

Les autres formulaires d'instruction calculent comme suit (valeurs de la démo, paramètres) : **biens** (incendie, dégât des eaux, habitation) : (dommage du bâtiment plus du contenu) x (1 moins la vétusté), plus un supplément éventuel (recherche de fuite), règle proportionnelle, plafond du capital, moins la franchise (25 000 FCFA par défaut) ; **vol** : valeur des objets x (1 moins la vétusté), plafonnée au capital, moins la franchise ; **transport** : valeur assurée x taux d'avarie, moins la franchise ; **responsabilité civile** : montant réclamé x part de responsabilité de l'assuré, plafonné à la garantie, moins la franchise, un dommage corporel renvoyant au décompte de FR-70 ; **divers** : montant réclamé x (1 moins l'abattement de 10 % par défaut), moins la franchise. L'**arrondi à 5 000 FCFA** (multiple le plus proche) ne vaut que pour les montants **calculés par le système** : la provision d'ouverture et l'indemnité proposée par un formulaire d'instruction. Le **montant arrêté** par le gestionnaire est au **franc près** (395 500 FCFA pour `SIN-2026-9002`), et les montants du **corporel** ne sont jamais arrondis : le barème légal n'est pas arrondi *(défaut H-060 : arrondi à 5 000 FCFA pour les montants calculés non corporels comme dans la démo, au franc pour le montant arrêté et le corporel ; à confirmer)*. Les délais de règlement et d'offre des autres branches ne sont **pas fixés par le Code CIMA** (pas de délai légal d'offre pour les seuls dommages aux biens, art. 231, dernier alinéa) : ils sont **contractuels ou internes**, paramétrés par produit (FR-85).

**Postes hors corporel.** Chaque poste d'indemnisation hors corporel porte un **état** : `A_EVALUER`, `EVALUE`, `A_VERIFIER` ou `JUSTIFICATIFS_ATTENDUS`. Les postes du **matériel** sont : réparation, vétusté, immobilisation, remorquage, valeur de remplacement (FR-72). Ceux des **risques divers** sont : bâtiment, contenu, perte d'exploitation, sauvetage. L'alerte « **évaluation incomplète** » reste levée tant qu'un poste est `A_EVALUER` (FR-136, FR-145).

**Conséquences (testables) :**
- Pour un vol de 400 000 FCFA d'objets avec 20 % de vétusté et une franchise de 25 000 FCFA, l'indemnité calculée est 295 000 FCFA, arrondie au multiple de 5 000.
- Un montant corporel n'est pas arrondi à 5 000 : le décompte du poste est au franc.
- Le montant arrêté par le gestionnaire est enregistré au franc près : pour `SIN-2026-9002`, 395 500 FCFA est conservé tel quel, alors que l'indemnité calculée par le formulaire d'instruction (702 000 FCFA dans le cas de FR-69) est un repère déjà arrondi au multiple de 5 000 ; un montant calculé de 297 400 FCFA par le système s'affiche arrondi à 295 000 FCFA, et un montant arrêté de 297 400 FCFA reste 297 400 FCFA.
- Un dossier matériel dont le poste « remorquage » est `A_EVALUER` affiche l'alerte « évaluation incomplète » ; elle disparaît quand tous les postes sont `EVALUE` ou `A_VERIFIER` explicitement.
- Chaque formulaire affiche l'indemnité calculée comme **repère** et ne l'écrit pas d'office dans le montant arrêté (FR-75).
- Les abattements, franchises par défaut et taux d'avarie sont des paramètres ; leur modification ne change pas les évaluations arrêtées.

#### FR-74 : « Pourquoi ce montant ? » : l'explication assistée par l'IA (usage n°9)

Sur un dossier évalué, l'IA commune **explique le montant** : d'où il vient, poste par poste.

- **Entrée :** le décompte arrêté (FR-69 à FR-73), la garantie souscrite (plafond, franchise, exclusions), les expertises validées et le dossier.
- **Sortie :** une explication en langage clair : la garantie qui répond, le dommage retenu et sa source, la vétusté et son calcul, la franchise, le plafond, la règle proportionnelle, le barème et la tranche pour le pilotage, la part du tiers, la comparaison au portefeuille (comparables du même type, du même volet et de la même gravité, au moins 12) avec l'écart en pourcentage, **réservée aux volets de la liste blanche (matériel, risques divers)** ; **chaque phrase renvoie à sa source** (pièce, police, barème, mission). Pour un dossier corporel, l'IA explique le **calcul** déjà établi par le gestionnaire (postes, SMIG, taux) sans le refaire.
- **Destinataire :** le gestionnaire, le responsable qui valide, l'assuré qui demande, l'auditeur, le juge : le montant doit être « défendable devant l'assuré, l'auditeur ou le juge ».
- **Garde-fou :** lecture seule ; **le texte ne contient aucun chiffre qui ne soit dans le décompte** ; il ne change pas entre deux consultations ; une comparaison n'est pas une règle ; aucun montant corporel n'est produit (FR-71).
- Servi par l'**IA commune** ; sans modèle, un gabarit de texte alimenté par le décompte fait le même travail et le dit.

**Conséquences (testables) :**
- Pour chaque dossier évalué, l'explication reprend, dans l'ordre, les lignes du décompte avec les mêmes valeurs ; un test compare les chiffres du texte à ceux du décompte.
- Chaque phrase de l'explication a un lien vers sa source ; une phrase sans source n'est pas produite.
- L'explication d'un dossier corporel ne contient aucun montant absent du décompte du gestionnaire, aucune médiane, aucun comparable et aucun écart en pourcentage (filtre `volet = corporel`) ; un test le vérifie sur chaque écran : fiche, comparaison, décision, tableau de bord.
- Deux consultations successives donnent le même texte tant que le dossier n'a pas changé.
- L'usage va au registre de l'IA (niveau `ANALYSE`).

#### FR-75 : Une évaluation arrêtée n'est jamais recalculée ; les cinq montants ne se confondent pas

Le gestionnaire **enregistre l'évaluation** (`EN_INSTRUCTION → EVALUE`, transition 7) en **arrêtant un montant**. Le champ est **pré-rempli avec le chiffrage validé par l'expertise** quand il existe ; le calcul d'instruction technique est affiché comme **repère**, jamais écrit d'office ; **s'il diffère** du chiffrage validé, un **motif est obligatoire**. Il faut : toutes les pièces obligatoires, toutes les expertises closes (FR-61), la garantie décidée (FR-42), un montant supérieur à zéro, et aucune alerte bloquante non levée. L'évaluation **mémorise** le barème, la tranche, la valeur du SMIG, les grilles et les paramètres du moment. **Une évaluation arrêtée n'est jamais recalculée** quand le barème, le SMIG ou une grille change : un changement ne s'applique qu'aux dossiers évalués après lui. Le dossier est jugé selon le **référentiel en vigueur à sa date de survenance**. Si le gestionnaire doit corriger, il **arrête une nouvelle évaluation** (nouvelle version, avec motif) ; l'ancienne reste consultable. Cinq montants sont toujours affichés séparément : **évalué** (le montant arrêté par le gestionnaire au terme du décompte), **proposé** (le montant de l'offre faite à l'assuré), **validé** (le montant approuvé par la personne ou l'instance qui a la délégation), **payé**, **reste à payer** ; plus la **provision**. Le **montant validé** est un **champ saisi par le signataire**, au plus égal au montant évalué ; un **motif** est obligatoire s'il diffère de l'évalué ; **la délégation s'applique à ce montant** (FR-78). Le **reste à payer** se calcule sur le montant **accepté** par l'assuré une fois l'accord enregistré (FR-86), et sur le montant validé avant cet accord.

**Conséquences (testables) :**
- Passer en `EVALUE` sans montant ou avec un montant nul est refusé (`MONTANT_EVALUE`) ; avec une pièce obligatoire manquante, `PIECES_COMPLETES` ; avec une expertise ouverte, `EXPERTISE_VALIDEE` ; sans décision de garantie, `GARANTIE_ENGAGEABLE`.
- Un montant différent du chiffrage validé par l'expertise sans motif est refusé (`MOTIF_ECRIT`).
- Après changement du barème ou du SMIG, un dossier déjà évalué garde le montant, les références et les valeurs du moment ; un test change la grille et vérifie que l'évaluation ne bouge pas.
- Une nouvelle évaluation crée une version avec motif ; l'ancienne reste lisible ; l'historique des versions est visible.
- Les cinq montants s'affichent côte à côte sur la fiche ; aucun écran ne les fond ; le reste à payer = montant accepté moins payé (avant l'accord : validé moins payé).
- Un montant validé supérieur au montant évalué est refusé (`MONTANT_VALIDE_SUPERIEUR_A_EVALUE`) ; un montant validé inférieur à l'évalué sans motif est refusé (`MOTIF_ECRIT`) ; la délégation (FR-78) se calcule sur le montant validé, et les cinq montants restent affichés.
- Un dossier est calculé selon la version du référentiel en vigueur à sa date de survenance, pas à sa date d'évaluation.

#### FR-76 : La provision est revue à chaque événement, avec un motif

La **provision du dossier** (la charge estimée) est **revue à chaque événement** : rapport d'expertise, devis, certificat médical, rapport de police, application du barème, validation hiérarchique, régularisation, clôture. À l'**évaluation**, la provision s'aligne sur le montant évalué, avec une **ligne distincte** « provision réajustée à l'évaluation » (avant, après, motif). Chaque mouvement est **ajouté**, **jamais écrasé** : numéro d'ordre, date, montant avant et après, motif, auteur, pièce justificative. Le **motif est obligatoire** et le nouveau montant doit différer de l'actuel. Un **écart supérieur ou égal à 2 000 000 FCFA** entre ancienne et nouvelle provision **attend le responsable** quand c'est un gestionnaire qui le propose *(défaut H-061 : 2 000 000 FCFA, valeur de la démo ; à confirmer avec la matrice de délégation)*. Ce seuil s'applique au **cumul glissant par dossier**, et non à chaque révision prise isolément ; l'**alignement à l'évaluation** de la provision est soumis au même seuil. La **limite de provision par rôle** et le cumul sur la provision totale du dossier sont posés à FR-78. Une **revue de provision ne se reporte pas** quand un délai légal est actif. La provision porte un poste **« risque de pénalité »**, motif et ligne séparée de la provision du dossier, alimenté par l'échéance légale dépassée (art. 334-12, FR-85). Une provision **sans mouvement depuis 90 jours** et une provision **de plus de 15 % d'écart** avec l'estimation sont signalées « à revoir ». Prospera produit l'**état** de ces provisions par dossier, par exercice de survenance, brut, cédé et net selon les traités de réassurance et les clés de coassurance (D12) : la comptabilité officielle reste hors de Prospera.

**Conséquences (testables) :**
- Réviser sans motif est refusé (`MOTIF_ECRIT`) ; réviser au même montant est refusé (`MONTANT_INCHANGE`).
- Chaque révision ajoute une ligne à l'historique ; la dernière provision est la dernière ligne ; aucune ligne n'est modifiée ni supprimée.
- Une révision de 2 500 000 FCFA proposée par un gestionnaire passe `EN_ATTENTE_RESP` et ne change pas la provision courante tant que le `RESP` ne l'a pas acceptée ; sous le seuil, elle est immédiate.
- Une requalification de la responsabilité ou un rapport d'expertise déclenche une alerte « provision à revoir » si l'écart avec le dernier chiffrage dépasse 15 %.
- Une provision sans mouvement depuis 90 jours apparaît dans la liste « à revoir » du `RESP`.
- Trois révisions successives de 800 000 FCFA proposées par un gestionnaire sur le même dossier : la troisième, qui porte le cumul glissant à 2 400 000 FCFA, passe `EN_ATTENTE_RESP` ; l'alignement à l'évaluation d'un écart de 2 500 000 FCFA attend aussi le `RESP`.
- Reporter la revue d'une provision d'un dossier dont un délai légal est actif est refusé (`REPORT_REVUE_INTERDIT`).
- Un dépassement de l'échéance légale d'offre crée une ligne « risque de pénalité », distincte de la provision du dossier, avec son motif.

### 5.7 Décider et offrir (`EN_VALIDATION`, `OFFRE_ENVOYEE`)

Dans la démo, le circuit passe de la validation à l'ordre de règlement ; l'offre n'existe que comme modèle de courrier. Ici, **l'offre et l'accord de l'assuré sont une étape** : on ne prépare le paiement qu'après l'accord enregistré. C'est la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) (offre validée envoyée sous 48 h ouvrées, paiement préparé après accord) et le Code CIMA pour le corporel. Conventions de la table du §5.13 (FR-135), qui fait foi : la validation par la délégation (`RESP`, comité, visa du `DT`, `DG`) se fait **dans** `EN_VALIDATION` ; l'envoi de l'offre porte la transition 10 ; l'accord enregistré porte la transition 14 ; `ORDRE_EMIS`, `CHEQUE_A_REMETTRE` et `REGLE` sont dérivés des règlements (FR-92).

#### FR-77 : Envoyer en validation avec une fiche de décision préparée

Quand le montant est arrêté (`EVALUE`), le gestionnaire **envoie le dossier en validation** (`EVALUE → EN_VALIDATION`, transition 8). Prospera prépare une **fiche de décision** pour le signataire : points forts (pièces complètes, expertises closes, cohérence avec les dossiers comparables (volets matériel et risques divers seulement ; au corporel, aucun comparable ni écart en pourcentage n'est affiché), aucun signal de fraude significatif, part du tiers arrêtée et montant du recours à engager) et **points de vigilance** (dossier hors délai et de combien de jours, déclaration tardive, franchise, plafond, exclusions à écarter, sous-assurance, offre sous le barème au corporel, écart au chiffrage de l'expert, prescription de deux ans de l'action dérivant du contrat : art. 28 du Code CIMA, SÛR, à vérifier par le juriste pour chaque cas). Le signataire peut demander à l'IA commune de **proposer un texte de motif** ; **le motif reste obligatoire et humain** : le signataire le relit, le modifie et le confirme. Un motif proposé par l'IA n'est **jamais validé par un simple clic** : le texte est modifiable, le **taux de motifs identiques** par signataire est signalé à `AUD`, et la proposition de motif est **interdite** pour les validations au-dessus du seuil du `RESP`.

**Conséquences (testables) :**
- `EVALUE → EN_VALIDATION` exige un montant arrêté ; sans montant, refus `MONTANT_EVALUE`.
- La fiche de décision liste les points forts et les vigilances avec leur source (pièce, police, mission, comparable) ; elle ne contient aucun montant corporel produit par l'IA (FR-71).
- Confirmer une décision sans motif est refusé (`MOTIF_ECRIT`) ; un motif proposé par l'IA n'est pas enregistré tant que le signataire ne l'a pas confirmé, et son auteur final est le signataire.
- Le gestionnaire qui a instruit voit la décision en lecture ; l'action « valider » lui est fermée avec la raison (FR-81).
- Un motif proposé par l'IA ne se confirme pas par un clic seul : le signataire doit modifier ou saisir le texte ; la proposition n'est pas offerte pour une validation au-dessus du seuil du `RESP` ; le taux de motifs identiques d'un signataire apparaît dans la vue de `AUD`.
- La fiche d'un dossier corporel n'affiche aucune médiane, aucun comparable ni écart en pourcentage ; celle d'un dossier matériel les affiche avec leur source.
- La fiche est conservée avec la décision et lisible de `AUD`.

#### FR-78 : Une matrice de délégation à plusieurs niveaux, paramétrable

La validation se fait selon une **matrice de délégation** paramétrable. Une ligne de la matrice porte : un **niveau**, les **rôles signataires**, le **quorum**, la **plage de montant**, le **volet** et la **nature** (indemnité, honoraires, acompte, règlement à titre commercial). Les défauts, **à remplacer par les délégations réelles de la compagnie** *(défaut H-062 : défauts tirés de la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) et du récit du PO ; délégations réelles à obtenir à la séance d'immersion)*, sont : **jusqu'à 1 000 000 FCFA** : la **validation à trois** : la proposition de l'instructeur, le **contrôle** par un second agent du volet (un autre `GEST` désigné contrôleur, ou le `RESP`), puis la **validation** par le `RESP` ; le contrôleur et le validateur sont deux personnes distinctes de l'instructeur et distinctes entre elles *(défaut H-063 : procédure décrite dans le récit du PO ; tout est paramétrable)* ; **au-dessus de 1 000 000 FCFA** : le **comité sinistres** (FR-79), puis le **visa du directeur technique** ; **règlement à titre commercial** (hors garantie, motivé par la compagnie) : le **DG seul**, quel que soit le montant. Les **honoraires** entrent dans la matrice : ils sont soumis à leur **plafond par niveau** ; au-delà, comité. Le **cumul anti-fractionnement** d'un même dossier est la somme des montants **acceptés et ordonnés non annulés**, plus le montant en cours de validation : il décide du niveau (un dossier en tranches chacune sous le seuil mais dont le cumul le dépasse relève du niveau supérieur). Une **contre-proposition** remplace l'offre précédente : l'offre n°1 jamais payée ne compte plus. Un montant qui dépasse la délégation du signataire est refusé, avec le niveau requis nommé.

**Limites de provision et limites de paiement, séparées par rôle.** Chaque rôle porte deux limites distinctes, comme les profils de limites d'autorité des éditeurs de sinistres : une **limite de paiement** (le montant qu'il valide) et une **limite de provision** (la provision qu'il pose ou révise sans escalade) *(défaut H-272 : limite de provision : un `GEST` propose, sans le `RESP`, un écart cumulé glissant de moins de 2 000 000 FCFA (valeur de H-061) ; le `RESP` valide seul une provision totale de dossier jusqu'à 5 000 000 FCFA ; au-delà, le `DT` ; valeurs à confirmer par les délégations réelles, A-2)* *(défaut H-273 : limite de paiement : celles de la matrice ci-dessus, soit 1 000 000 FCFA pour le `RESP` ; elles ne se confondent jamais avec les limites de provision)*. Le **cumul anti-fractionnement** porte sur les deux : les **paiements validés** (somme définie ci-dessus) **et** la **provision totale** du dossier, toutes révisions comprises *(défaut H-274 : cumul actif sur les deux ; paramètre)*. Le serveur contrôle chaque limite à la validation, non à la saisie.

**Suppléance.** Une personne qui s'absente confie sa délégation à une **personne nommée**, jamais à un groupe ni à « tout le monde ». La suppléance est une **délégation temporaire** : **date de début**, **date de fin**, **motif** obligatoire, saisie tracée (auteur, date, délégant, suppléant). Hors de ses dates, elle n'a plus aucun effet. Elle ne peut **jamais dépasser la limite du délégant**, ni en paiement ni en provision, et ne lève aucun cumul interdit (FR-7) : un suppléant partie au dossier (FR-29) ne le valide pas. `AUD` la voit dès sa création, dans le journal et dans l'état des délégations exercées *(défaut H-275 : durée maximale de 30 jours, renouvelable avec un nouveau motif ; paramètre)* *(défaut H-276 : suppléant nommé, motif obligatoire, alerte à `AUD` à la création ; règle de contrôle interne, à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Une indemnité de 900 000 FCFA est validée par `RESP` seul ; elle est refusée au `GEST` (`DROIT_INSUFFISANT`).
- Une indemnité de 1 500 000 FCFA ne se valide pas par `RESP` seul : la validation exige la décision du comité et le visa du `DT` ; sinon `VALIDATION_ACQUISE`, avec « niveau requis : comité sinistres ».
- Un règlement à titre commercial n'est validé que par le `DG`, même pour 50 000 FCFA ; un autre rôle reçoit `VALIDATION_ACQUISE`.
- Deux validations de 800 000 FCFA sur le même dossier déclenchent le niveau du cumul de 1 600 000 FCFA ; la seconde est refusée au niveau `RESP` seul (`VALIDATION_ACQUISE`).
- Un montant de 800 000 FCFA remplacé par une contre-proposition de 800 000 FCFA ne monte pas au comité ; un montant de 800 000 FCFA payé, suivi d'un nouveau de 800 000 FCFA, y monte.
- Au niveau 1 (jusqu'à 1 000 000 FCFA), la validation est refusée sans le contrôle d'une troisième personne, distincte de l'instructeur et du validateur (`CONTROLE_ABSENT`) ; au-delà, comité de 4 et visa du `DT`.
- Des honoraires d'expert au-dessus du plafond de leur niveau montent au comité ; la matrice porte une ligne « honoraires » par niveau.
- La matrice est modifiable par `ADMIN` avec double contrôle du `DG` ; une modification ne change pas les décisions déjà prises et est journalisée avec auteur et date.
- L'état des délégations exercées (dossiers validés par niveau sur 30 jours) est visible du `DG` et de `AUD`.
- Un `GEST` qui propose une provision dont le cumul glissant atteint 2 000 000 FCFA attend le `RESP` ; une provision totale de 5 500 000 FCFA validée par le `RESP` seul est refusée (`DROIT_INSUFFISANT`, « niveau requis : `DT` ») ; un paiement de 900 000 FCFA reste validé par le `RESP` seul quelle que soit la provision.
- Un test modifie la limite de provision d'un rôle sans toucher à sa limite de paiement, et inversement : chaque limite est lue séparément.
- Un dossier dont la provision totale, par révisions successives chacune sous la limite, dépasse la limite du `RESP` remonte au `DT` (cumul sur la provision) ; il remonte aussi quand ce sont les paiements validés qui dépassent leur propre limite.
- Une suppléance sans date de fin ou sans motif est refusée (`SUPPLEANCE_NON_DATEE`) ; une suppléance donnée à plusieurs personnes ou à un groupe est refusée ; hors de ses dates, le suppléant reçoit `SUPPLEANCE_HORS_DATES`.
- Un suppléant ne valide pas au-dessus de la limite du délégant : un suppléant du `RESP` qui tente de valider 1 500 000 FCFA reçoit `SUPPLEANCE_AU_DELA_DU_DELEGANT` ; un suppléant partie au dossier reçoit `SEPARATION_DES_TACHES`.
- Une suppléance créée apparaît dans la file de `AUD` le jour même ; au-delà de la durée maximale, elle s'arrête sans renouvellement motivé.

#### FR-79 : Le comité sinistres : quorum, votes, procès-verbal de séance

Le **comité sinistres** est une **instance** (non un rôle). Défauts : **4 membres** dont le responsable des sinistres et le directeur technique, **quorum de 3** *(défaut H-064 : composition et quorum du comité de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer)*. La **liste des membres** est obligatoire à la mise en service : au moins un **titulaire et un suppléant** par siège. Le **président** est le `RESP`, sinon le `DG` ; en cas d'égalité, sa **voix prépondérante** tranche. Le comité se tient dans un **délai paramétré** (défaut 5 jours ouvrés), avec une alerte au 3e jour et un repli par **délibération écrite**. L'**instructeur est exclu du vote**. Si le `DT` a voté au comité, le **visa est donné par le `DG`**. Le comité se réunit sur une **liste de dossiers** préparée par le `RESP` ; chaque dossier est présenté avec sa fiche de décision. **Chaque membre présent vote** (`POUR`, `CONTRE`, `ABSTENTION`) avec son nom ; la décision est prise à la **majorité des membres présents** *(défaut H-065 : majorité simple des présents ; à confirmer)*. Un membre ne vote pas sur un dossier qu'il a instruit lui-même (FR-29). À la fin de la séance, Prospera produit le **procès-verbal de séance** : date, membres convoqués et présents, quorum, dossiers examinés, vote de chacun, décision et motifs ; il est signé et rangé au dossier de chaque sinistre examiné et aux archives du comité. Après la décision du comité, le **visa du directeur technique** est demandé ; il est refusé ou accordé avec motif.

**Conséquences (testables) :**
- Une séance avec 2 membres présents sur 4 ne peut pas statuer : `QUORUM_NON_ATTEINT` ; aucune décision n'est enregistrée.
- Le vote de chaque membre est enregistré avec son nom ; un membre qui a instruit le dossier est exclu du vote de ce dossier (`SEPARATION_DES_TACHES`).
- Trois membres présents dont l'instructeur donnent deux votants ; en cas d'égalité, la décision est prise par la voix du président.
- Une mise en service sans liste de membres complète (un titulaire et un suppléant par siège) est refusée (`COMITE_INCOMPLET`) ; un comité non tenu au 3e jour ouvré lève une alerte, puis bascule en délibération écrite à l'échéance.
- Un `DT` qui a voté au comité ne peut pas donner le visa : le `DG` le donne (`VISA_DT_INTERDIT`).
- Le procès-verbal de séance est généré avec tous les dossiers examinés et reste lisible de `AUD` ; il ne se modifie pas après signature.
- Sans visa du `DT` après la décision du comité, le dossier ne passe pas à `OFFRE_ENVOYEE` (`VALIDATION_ACQUISE`).
- Une décision « refus du comité » exige un motif et renvoie le dossier selon FR-80.
- Le comité ne se réunit pas pour un dossier à signal de fraude bloquant non écarté (`AUCUN_SIGNAL_BLOQUANT`).

#### FR-80 : Tolérances affichées au signataire, et renvoi motivé

Au moment de décider, l'écran affiche des **tolérances**, sous forme de **réserves non bloquantes** : écart entre le **montant arrêté** et la **proposition de l'expert** (10 % par défaut) ; écart entre l'**indemnité** et la **provision** (25 % par défaut), cet écart en pourcentage n'étant affiché que pour les volets de la liste blanche (matériel, risques divers) : au corporel, aucun écart en pourcentage n'est calculé ni affiché. Elles informent le signataire, elles n'interdisent rien ; **seul un signal de fraude bloquant** non écarté ferme la décision. Le signataire peut aussi : **renvoyer en instruction** pour réévaluation (`EN_VALIDATION → EN_INSTRUCTION`, transition 11), **demander des pièces avant validation** (`EN_VALIDATION → PIECES_ATTENDUES`, transition 12), ou **refuser la prise en charge** (`EN_VALIDATION → REJETE`, transition 13, refus motivé, courrier de refus §5.11). Chacune de ces issues exige un **motif écrit**.

**Conséquences (testables) :**
- Un montant arrêté s'écartant de 12 % de la proposition de l'expert affiche la réserve « écart au chiffrage de l'expert » ; la décision reste possible.
- Un dossier dont le signal de fraude est bloquant et non écarté ne peut pas être validé (`AUCUN_SIGNAL_BLOQUANT`).
- Renvoyer en instruction sans motif est refusé (`MOTIF_ECRIT`) ; le motif est affiché au gestionnaire dans sa file.
- Un refus de prise en charge à ce stade met le reste à payer à zéro, et le dossier devient `REJETE`.
- Sur un dossier corporel, l'écran de décision n'affiche pas l'écart entre indemnité et provision ; sur un dossier matériel, il l'affiche.
- Les seuils de 10 % et 25 % sont des paramètres ; leur modification ne change pas les décisions déjà prises.

#### FR-81 : Séparation des tâches : celui qui décide ne paie pas

Trois règles de séparation sont gardées côté serveur, quel que soit l'écran : **(1)** celui qui est **partie** au dossier au sens de FR-29 (liste des actes qui rendent partie) **ne valide pas** son propre règlement ni sa propre indemnité ; l'**accord** de l'assuré est enregistré par un agent qui n'a ni instruit, ni validé le dossier (FR-86) ; **(2)** **celui qui décide ne paie pas** : le signataire de la validation n'émet pas l'ordre de règlement (la comptabilité émet) ; **(3)** le **seuil de délégation** est respecté (FR-78). Chaque règle a un contrôle permanent du contrôle interne : un constat est `CONFORME`, `ALERTE` ou `VIOLATION`, avec la règle et le détail. Le défaut relevé par l'audit de 2014 (le même rédacteur qui instruit et ordonnance l'indemnité) est ainsi fermé.

**Conséquences (testables) :**
- Un `GEST` qui a instruit un dossier ne peut pas le valider, quel que soit son niveau de délégation : refus `SEPARATION_DES_TACHES`. Un test existe **par acte** de la liste de FR-29.
- Instruire **et** enregistrer l'accord est refusé ; valider **et** enregistrer l'accord est refusé ; émettre **et** faire signer la quittance est refusé (`SEPARATION_DES_TACHES`, lignes 13 à 15 de FR-7).
- Un `RESP` qui a validé l'indemnité ne peut pas émettre le règlement ; seul `CPT` émet (§5.8).
- Un utilisateur qui cumule deux rôles ne peut pas tenir les deux fonctions incompatibles sur un même dossier (le contrôle regarde la personne, pas le rôle).
- Chaque refus pour séparation des tâches crée un constat visible de `AUD`, avec la règle et le détail.
- Tenter d'ordonner le règlement d'un dossier fractionné sous le seuil est un constat `VIOLATION`, pas seulement un refus.

#### FR-82 : L'offre est préparée, définitive ou provisionnelle

Après validation, Prospera **prépare l'offre** (modèle `OFFRE_INDEMNISATION`) à partir du décompte : bénéficiaire, montant **proposé**, détail du décompte (dommage, vétusté, règle proportionnelle, plafond, franchise ; ou, au corporel, **chaque chef de préjudice** de l'art. 243 avec les sommes revenant au bénéficiaire, les limitations et exclusions retenues et leurs motifs, et les **créances de chaque tiers payeur** avec copie des décomptes : art. 246), l'excédent éventuel à la charge de l'assuré, le **délai pour répondre**, le nom du gestionnaire du dossier (art. 242) et les **mentions légales** du corporel : possibilité d'obtenir la copie du procès-verbal et de se faire assister d'un conseil à ses frais (art. 232), **droit de dénoncer la transaction par lettre recommandée dans les 15 jours, en caractères très apparents, à peine de nullité relative** (art. 235) ; le paiement est libellé **au nom de la victime ou des ayants droit** (art. 232). L'offre est **provisionnelle** au corporel quand la consolidation n'est pas connue 6 mois après l'accident (FR-85) : elle couvre alors ce qui est déjà établi (frais, incapacité temporaire) et l'offre **définitive** suit après la consolidation. Au corporel, l'accord prend la forme d'un **procès-verbal de transaction**. Les états de l'offre, alignés sur la démo, sont : `A_PREPARER`, `EN_VALIDATION`, `PRETE`, `ENVOYEE`, `ACCEPTEE`, `REFUSEE`, `EN_NEGOCIATION`, auxquels s'ajoutent `EXPIREE` (offre sans réponse au terme) et `RETOURNEE` (pli non distribué).

**Corporel à plusieurs véhicules.** Le dossier saisit les **véhicules et assureurs impliqués**. Il désigne l'**assureur qui présente l'offre pour compte commun** (art. 231 al. 6, 267 à 270 *(point juridique J-11 : à valider par le juriste, §13.2)*) ; les **intérêts de retard sont à sa charge**, et la **répartition entre assureurs** est tracée. Le dossier bascule en « mandat pour compte d'autrui ». Le **barème de responsabilité** est un paramètre, à numériser (D21).

**Conséquences (testables) :**
- L'offre n'existe qu'à partir d'une validation selon la délégation ; sans validation, la préparation est refusée (`VALIDATION_ACQUISE`).
- Le montant proposé de l'offre est celui du montant validé ; un écart entre le montant proposé et le montant validé est refusé sans motif (`MOTIF_ECRIT`).
- Un dossier corporel à deux véhicules désigne un seul assureur meneur ; les intérêts de retard sont imputés à lui, et la répartition entre assureurs est enregistrée ; une seconde désignation sur le même dossier est refusée (`ASSUREUR_MENEUR_DEJA_DESIGNE`).
- Une offre sans réponse au terme passe `EXPIREE` ; un pli non distribué la passe `RETOURNEE` et lève l'alerte « offre retournée » ; une offre `RETOURNEE` ou `EXPIREE` ne laisse jamais courir le délai légal sans alerte.
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

#### FR-84 : L'offre validée part sous 48 heures ouvrées

Une fois la décision prise (visa du `DT` compris), l'offre doit être **envoyée sous 48 heures ouvrées** (paramètre, valeur du mémoire *(défaut H-066 : 48 heures ouvrées, comme dans la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA))*). L'envoi (`EN_VALIDATION → OFFRE_ENVOYEE`, transition 10 ; la validation par la délégation a eu lieu avant, dans `EN_VALIDATION`) est un acte qui enregistre : le **canal** (remise en main propre, courrier, e-mail, SMS pour l'avis, WhatsApp), la **date et l'heure**, la **personne** qui envoie et la **preuve** d'envoi (accusé, décharge, récépissé). Un dossier validé et non envoyé après 48 heures ouvrées est une **alerte** au `RESP`. Au corporel, le **procès-verbal de transaction** est communiqué aux bénéficiaires ou à leur avocat **sous 24 heures ouvrées** après sa soumission au directeur technique *(défaut H-067 : 24 heures, valeur du mémoire de 2014)*.

**Conséquences (testables) :**
- `EN_VALIDATION → OFFRE_ENVOYEE` (transition 10) exige : une décision validée selon la délégation, la signature de l'agent, un canal et une preuve ; sinon refus `VALIDATION_ACQUISE` ou `PREUVE_ENVOI_ABSENTE`.
- Un dossier validé depuis plus de 48 heures ouvrées sans envoi apparaît dans les alertes du `RESP`, avec le retard en heures.
- La date et l'heure d'envoi servent de point de départ aux relances (FR-89) et au délai de réponse de l'assuré.
- Le courrier d'offre porte le statut `REMIS` (avec preuve) ou `RETOURNE` (pli non distribué, FR-122) ; `RETOURNE` passe l'offre à `RETOURNEE` et lève l'alerte « offre retournée ».
- Un envoi sur un canal inconnu du dossier (téléphone ou adresse absents) est refusé (`CANAL_INJOIGNABLE`).
- L'offre envoyée est classée au dossier, non modifiable ; une correction passe par une nouvelle offre (FR-87).

#### FR-85 : Les délais légaux du corporel et la pénalité de 5 % par mois, séparés des délais internes

Pour les victimes d'une **atteinte à la personne causée par un véhicule terrestre à moteur** (art. 225 et 231 du Code CIMA, SÛR), le dossier corporel porte un **chronomètre réglementaire** :

- **Offre** dans les **12 mois** de l'accident.
- **Décès** : offre aux ayants droit **dans les 8 mois du décès**.
- **Consolidation** : **offre provisionnelle** quand l'assureur n'a pas été informé de la consolidation dans les 6 mois de l'accident ; l'**offre définitive** est alors due **dans les 6 mois de l'information de consolidation**.
- **Réponse** à une demande motivée de la victime **sous 30 jours** (art. 231).

Les délais sont **prorogés ou suspendus**, et chaque suspension est tracée avec sa cause et ses dates :

- assureur non avisé dans le mois (art. 247) ;
- décès plus d'un mois après l'accident (art. 248) ;
- pièces demandées non reçues ou incomplètes dans les **6 semaines** de la présentation de la demande (art. 249 et 250) ;
- nouvelle demande dans le mois suivant une réponse incomplète (art. 251) ;
- refus d'examen ou contestation médicale et expert commun, **+1 mois** (art. 252 et 252 bis) ;
- victime résidant à l'étranger (art. 253).

**Pénalité.** Passé le délai, **l'indemnité produit de plein droit un intérêt de retard de 5 % par mois de retard** (art. 233), que Prospera **calcule et affiche**. La pénalité est **réduite ou annulée** pour circonstances non imputables à l'assureur, avec un motif saisi. La **base de calcul** est le paramètre `penalite.base`, défaut « montant de l'offre » *(point juridique J-12 : base à faire valider par le juriste)* ; l'affichage porte le libellé « estimation, base non validée ». Le **risque de pénalité** est provisionné sur une ligne séparée de la provision (FR-76), alimentée par l'échéance légale dépassée (art. 334-12).

**Délais réglementaires et délais internes.** Les délais légaux sont **réglementaires et non modifiables** par la compagnie. Les délais du **matériel et des autres branches** ne sont pas fixés par le Code CIMA : ils sont **contractuels ou internes**, paramétrés par produit. Les délais internes de la démo sont repris en défauts, comme **alertes internes**, avec leur point de départ et d'arrêt :

- accusé de réception du dossier complet **10 jours** au plus depuis la déclaration (dernier recours ; l'accusé de déclaration est immédiat, FR-36), arrêté à l'ouverture ;
- offre **90 jours** (corporel), **60** (matériel), **75** (autre) depuis la réception du dossier complet, arrêtée à l'envoi de l'offre ;
- délai de traitement du volet **45**, **21**, **30** et **90 jours** (recours) depuis la déclaration.

Un dossier est jugé selon le référentiel en vigueur à sa **date de survenance**. Quand le dossier corporel implique **plusieurs véhicules**, l'assureur qui présente l'offre pour compte commun supporte les intérêts de retard (FR-82).

**Conséquences (testables) :**
- Un dossier corporel VTM avec accident au 1er mars affiche l'échéance d'offre au 1er mars de l'année suivante ; un décès au 10 avril sur un accident du 1er avril affiche 8 mois à compter du décès.
- Une demande de pièces présentée le 1er mai et non satisfaite suspend le délai à partir de la 6e semaine, avec la cause (art. 249) ; la reprise de réponse lève la suspension.
- Une réponse incomplète reçue dans les 6 semaines, suivie d'une nouvelle demande dans les 15 jours, suspend le délai ; sans nouvelle demande dans les 15 jours après cette réponse, il n'y a pas de suspension.
- Le calcul de la pénalité lit le paramètre `penalite.base` ; l'affichage porte le libellé « estimation, base non validée » tant que le juriste n'a pas validé la base.
- Un dossier corporel sans offre au-delà de l'échéance calcule et affiche la pénalité de 5 % par mois ; saisir « circonstances non imputables » avec un motif réduit ou annule la pénalité et journalise l'auteur.
- Les délais légaux ne figurent pas dans la liste des paramètres modifiables de la compagnie ; un `ADMIN` ne peut pas les changer (`PARAMETRE_REGLEMENTAIRE`).
- Un dossier matériel affiche des échéances **internes** (offre à 60 jours après dossier complet) et non une pénalité légale ; l'alerte dit « délai interne ».
- L'échéance d'une alerte interne a un point de départ et un point d'arrêt visibles ; modifier le paramètre ne déplace pas les échéances des dossiers déjà ouverts.
- Un dossier est calculé selon le référentiel en vigueur à sa date de survenance (test avec deux versions du référentiel).

#### FR-86 : L'accord est enregistré ; aucun ordre sans accord

L'accord de l'assuré ou de la victime est **enregistré** dans le dossier : l'**offre signée**, ou, au corporel, le **procès-verbal de transaction** signé (même accord sous deux noms), avec la date. L'enregistrement est fait par l'**accueil (`ACC`)** ou par un agent **qui n'a ni instruit, ni validé le dossier** (FR-29), sur la **pièce originale signée**, scannée et rattachée, avec **contrôle d'identité du signataire** ; l'**empreinte** de la version d'offre signée est conservée. Au-dessus d'un seuil paramétré, l'accord est **enregistré deux fois** par deux agents *(défaut H-068 : 3 000 000 FCFA ; à confirmer à la séance d'immersion)*. Seul cet enregistrement fait passer le dossier de `OFFRE_ENVOYEE` à `ORDRE_EMIS` (transition 14, rôle `ACC` ou agent non partie, jamais `GEST` ni `RESP`) : **aucun ordre de règlement sans accord enregistré**. Au corporel, la victime peut **dénoncer** la transaction par lettre recommandée dans les 15 jours de sa conclusion (art. 235). La dénonciation n'est reçue qu'avec une **preuve de réception** par un moyen listé en paramètre ; le recommandé électronique n'est pas accepté tant que le juriste n'a pas tranché. Pour tout dossier corporel VTM dont l'accord est une **transaction** (offre définitive ou provisionnelle acceptée), la **date d'éligibilité à l'émission** est la date de conclusion plus 15 jours, **calculée et non modifiable**. L'ordre est créé à l'accord, mais il reste **« différé »** (non émis) jusqu'à cette date : la condition `DELAI_DENONCIATION_ECOULE` garde les transitions d'émission (FR-135, FR-136). La transition 42 (dénonciation) part de `ORDRE_EMIS`, puisque rien n'est émis avant. Pour un **mineur** ou un **incapable**, la transaction est soumise aux parents vivants ou au juge des tutelles ou au conseil de famille, avec avis au juge au moins 15 jours avant le paiement d'une somme ou du premier arrérage de rente ; sans cela, transaction et paiement sont annulables (art. 234) *(point juridique J-13 : workflow mineurs et incapables : pièce d'autorisation exigée avant l'ordre ; à valider par le juriste)*.

**Conséquences (testables) :**
- `OFFRE_ENVOYEE → ORDRE_EMIS` (transition 14) exige un accord enregistré (offre signée ou procès-verbal de transaction) ; sans lui, refus `ACCORD_ENREGISTRE`.
- Un accord enregistré sans pièce signée jointe est refusé (`PIECE_ACCORD_ABSENTE`) ; l'enregistrement sans contrôle d'identité du signataire est refusé (`IDENTITE_SIGNATAIRE_NON_CONTROLEE`).
- Un `GEST` ou un `RESP` qui tente d'enregistrer l'accord reçoit `DROIT_INSUFFISANT` ; un agent qui a instruit ou validé le dossier reçoit `SEPARATION_DES_TACHES` (FR-29, FR-81) ; l'empreinte de la version d'offre signée figure au dossier.
- Au-dessus du seuil de double enregistrement, un accord enregistré une seule fois ne libère aucun ordre (`DOUBLE_ENREGISTREMENT_REQUIS`).
- Un accord de transaction corporel VTM crée un ordre « différé » : l'émission est refusée (`DELAI_DENONCIATION_ECOULE`) du jour 1 au jour 14, et acceptée au jour 16 ; le test est répété pour chaque moyen de paiement (chèque, virement, paiement mobile) ; la date d'éligibilité n'est modifiable par aucun rôle.
- Une dénonciation reçue sans preuve de réception par un moyen listé est refusée (`PREUVE_RECEPTION_ABSENTE`).
- Au corporel, une transaction enregistrée affiche la date limite de dénonciation (15 jours) ; si la victime dénonce dans ce délai, le dossier repasse en `EN_INSTRUCTION` (transition 42, depuis `ORDRE_EMIS`, motif obligatoire, ordres différés ou règlements non remis `ANNULE`) et une nouvelle offre repart de `EN_INSTRUCTION`, avec sa nouvelle échéance.
- Pour un bénéficiaire mineur ou incapable sans pièce d'autorisation, l'ordre est refusé (`AUTORISATION_REPRESENTANT_ABSENTE`).
- L'accord est horodaté avec le nom de l'agent qui l'a enregistré.

#### FR-87 : Une contre-proposition rouvre l'instruction avec un motif

Si l'assuré ou la victime **répond par une contre-proposition** (un montant différent), l'agent l'**enregistre** avec le **montant demandé** (obligatoire) et le **motif** : le dossier **retourne en instruction** (`OFFRE_ENVOYEE → EN_INSTRUCTION`, transition 15). Le gestionnaire reprend l'évaluation (nouvelle évaluation versionnée, FR-75), éventuellement avec une expertise ou un complément ; une **nouvelle offre** est ensuite validée et envoyée selon FR-77 à FR-84. L'ancienne offre reste consultable. La contre-proposition suspend les relances de FR-89.

**Conséquences (testables) :**
- Enregistrer une contre-proposition sans montant est refusé (`MONTANT_CONTRE_PROPOSITION_ABSENT`) ; sans motif, `MOTIF_ECRIT`.
- Le dossier repasse `EN_INSTRUCTION` avec son titulaire ; les offres successives sont toutes conservées avec leur date et leur auteur.
- La nouvelle offre exige une nouvelle validation selon la délégation, calculée sur le nouveau montant et le cumul.
- Le dossier garde l'historique : offre n°1, contre-proposition, offre n°2.

#### FR-88 : Un refus de l'offre mène au litige et à la contre-expertise

Si l'assuré ou la victime **refuse l'offre** (sans contre-proposition chiffrée, ou après plusieurs échanges), l'agent enregistre le **refus** avec un **motif obligatoire** et le dossier passe à `LITIGE` (`OFFRE_ENVOYEE → LITIGE`, transition 16). La victime ou l'assuré peut **demander une contre-expertise** (FR-66, ordonnée par `RESP`, `DG` ou `DT`). Le litige est géré par `RESP`, `DG` ou `DT` (§5.11, FR-124) ; il se résout par un accord (retour à `EN_INSTRUCTION`), une décision définitive ou un contentieux. Pour le **corporel VTM**, l'action en justice ne peut être portée qu'à l'**expiration du délai d'offre** (art. 239) : la saisine anticipée est signalée. Le délai d'offre légal continue de courir ; la pénalité de 5 % par mois reste affichée (FR-85).

**Conséquences (testables) :**
- Enregistrer un refus sans motif est refusé (`MOTIF_ECRIT`) ; le dossier passe `LITIGE` et le motif est conservé.
- Un `GEST` ne peut pas constater un litige (`DROIT_INSUFFISANT`) ; `RESP`, `DG` ou `DT` le peuvent (transition 16).
- Un refus avec demande de contre-expertise ouvre l'action d'ordonner la contre-expertise aux seuls `RESP`, `DG`, `DT`.
- Pendant le `LITIGE`, aucun ordre de règlement ne peut être émis, acompte compris, et aucune nouvelle offre globale n'est préparée : la table des 42 transitions n'a pas de passage de `LITIGE` vers `ORDRE_EMIS`. Hors corporel, la part non contestée se règle par le retour à `EN_INSTRUCTION` (transition 30) avec le motif « offre partielle sur la part non contestée », puis par une offre limitée à cette part (FR-124). Au corporel, la voie légale reste l'offre provisionnelle.
- Un litige résolu rouvre `EN_INSTRUCTION` avec motif.

#### FR-89 : Une offre sans réponse déclenche des relances et une alerte

Une offre envoyée sans réponse est **relancée** : première **relance à 15 jours** après l'envoi, **alerte au responsable à 30 jours** (paramètres `delai_relance_offre_jours` et `delai_alerte_offre_jours`) *(défaut H-069 : J+15 et J+30 comme dans la décision de cadrage ; à confirmer)*. Le texte de la relance est rédigé comme en FR-47 (envoi en un clic par l'agent, ou envoi automatique à l'échéance si le paramètre l'autorise). Une offre sans réponse au terme passe `EXPIREE` ; un pli non distribué la passe `RETOURNEE` avec l'alerte « offre retournée ». À la **troisième relance sans effet**, le système propose un arbitrage : classement `SANS_SUITE` motivé (transition 27), appel, visite. Au corporel, le silence ne dispense pas la compagnie de son **délai légal** : le chronomètre de FR-85 continue de courir, et une pénalité peut s'afficher.

**Conséquences (testables) :**
- Une offre envoyée depuis 15 jours sans réponse produit une relance proposée ; à 30 jours, une alerte au `RESP` avec l'ancienneté.
- La relance est journalisée (canal, date, auteur) ; elle part par un clic de l'agent, ou automatiquement seulement si le paramètre d'envoi automatique de FR-47 est activé.
- Une offre sans réponse au terme passe à l'état `EXPIREE` ; une offre dont le pli revient passe à `RETOURNEE` avec l'alerte « offre retournée » ; aucune des deux n'arrête le chronomètre légal du corporel.
- À la troisième relance sans effet, l'écran propose l'arbitrage et n'ajoute pas de relance par défaut.
- Classer `SANS_SUITE` exige un motif et la trace des relances effectuées (`RELANCES_EPUISEES` sinon).
- Un dossier corporel avec offre sans réponse continue d'afficher son chronomètre légal.

### Écarts avec la démo relevés

Ce que ce chapitre change par rapport au code de la démo, aux scénarios joués et à la spécification (le code fait foi sur la spécification, le récit du PO fait foi sur le code) :

- **Statuts :** `PIECES_INCOMPLETES` devient `PIECES_ATTENDUES`, `EN_ETUDE` devient `EN_INSTRUCTION`, `VALIDATION` devient `EN_VALIDATION`, **`OFFRE_ENVOYEE` est ajouté**, `RECOURS` cesse d'être un statut (15 statuts de la démo ; ici 11 statuts du circuit nominal et 4 sorties, soit 15, FR-134).
- **L'offre et l'accord sont une étape** : la démo va de la validation à l'ordre de règlement ; ici, aucun ordre sans accord enregistré (FR-82 à FR-86).
- **La validation se fait à plusieurs niveaux** (matrice, comité, visa du `DT`, `DG` pour le commercial, anti-fractionnement) ; la démo n'a qu'un seuil unique de 2 000 000 FCFA, valeur de la démo qui ne vaut plus comme seuil de délégation (FR-78, FR-79).
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
- **Ce que le PRD n'a pas pu vérifier** : les barèmes de vétusté, la valeur du SMIG, les tables d'incapacité, les seuils de délégation de la compagnie, ses modèles de courriers et sa liste d'experts agréés sont tous à obtenir (récit du PO §6) ; aucune pièce de référence n'est togolaise (convention d'expertise tunisienne, mémoire et formulaires d'un fonds de garantie étranger).

### 5.8 Payer : de l'ordre de règlement à la remise

Cette section couvre la phase 7 du circuit : `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE`. Elle suit la règle du PO : **celui qui décide ne paie pas**. Le service sinistres décide et émet l'ordre de règlement ; la comptabilité (`CPT`) émet le règlement ; le guichet (`ACC` ; `CPT` seulement pour un règlement qu'il n'a pas émis) le remet contre quittance signée. La comptabilité officielle reste hors de Prospera (§5.8, FR-103). Les moyens électroniques passent par le module partagé `paiement` (§7.1). La validation et l'offre sont décrites au §5.7 ; ici, on part d'un montant validé et d'une offre envoyée.

Deux mots à ne pas confondre dans cette section : l'**ordre de règlement** est la décision écrite de payer (il est « émis » par le service sinistres, statut `ORDRE_EMIS`) ; le **règlement** est le paiement lui-même (chèque, virement, Mobile Money), exécuté par la comptabilité ou par `paiement`.

#### FR-90 : L'ordre de règlement naît de l'accord enregistré, jamais sans

Le serveur ne crée un ordre de règlement d'indemnité qu'à l'enregistrement de l'**accord** de l'assuré ou de la victime (décision D6). L'accord est enregistré par l'**accueil (`ACC`)** ou par un agent qui n'a ni instruit ni validé le dossier (FR-86, FR-29), avec la pièce originale signée qui le prouve : offre signée, ou procès-verbal de transaction au corporel. Cet enregistrement déclenche la transition `OFFRE_ENVOYEE → ORDRE_EMIS` (§5.13, transition 14). Au corporel VTM, quand l'accord est une transaction (offre définitive ou provisionnelle acceptée), l'ordre est créé à l'accord mais reste **« différé »** (non émis) jusqu'à la **date d'éligibilité** (date de conclusion plus 15 jours, calculée et non modifiable) : la condition `DELAI_DENONCIATION_ECOULE` garde l'émission (FR-86, FR-136). Les **honoraires d'expert** échappent à l'accord de l'assuré, car leur bénéficiaire n'est pas l'assuré : ce sont des règlements de nature `HONORAIRES`, nés du **visa des honoraires par `RESP`** (jamais par `CPT`), donné seulement si le **rapport est validé** et la facture rapprochée de la lettre de mission (FR-182, FR-91, FR-68) ; `CPT` émet seulement. Ils **ne changent pas le statut du dossier** et ne passent pas par la transition 14. Le règlement **à titre commercial** est décidé par le `DG` seul (§5.7, D8), mais **l'accord du bénéficiaire reste exigé** : il passe par l'offre et par la transition 14 comme les autres. Un acompte et une offre provisionnelle suivent la règle de l'indemnité : ils sont proposés par une offre, et leur accord est enregistré *(défaut H-070 : un acompte passe par une offre d'acompte avec accord enregistré ; à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Créer un ordre de règlement d'indemnité sur un dossier dont l'accord n'est pas enregistré est refusé avec le code `ACCORD_ENREGISTRE`.
- L'accord enregistré porte : la pièce jointe (obligatoire), la date de l'accord, l'auteur de l'enregistrement, le montant accepté. Sans pièce, l'enregistrement est refusé (`ACCORD_ENREGISTRE`).
- Le montant de l'ordre est égal au montant accepté ; il ne peut pas dépasser le montant validé (§5.7). Un ordre de montant supérieur est refusé (`MONTANT_VALIDE`).
- Un ordre d'accord de transaction corporel VTM est créé « différé » ; son émission est refusée tant que `DELAI_DENONCIATION_ECOULE` n'est pas vrai (jours 1 à 14), et acceptée au jour 16.
- Un accord enregistré par un `GEST` ou un `RESP` est refusé (`DROIT_INSUFFISANT`) ; par un agent qui a instruit ou validé, il est refusé (`SEPARATION_DES_TACHES`).
- Un ordre d'honoraires visé par `CPT` est refusé (`DROIT_INSUFFISANT`) ; un visa sans rapport validé ou sans facture rapprochée de la lettre de mission est refusé (`HONORAIRES_NON_VISES`).
- Un accord partiel ou un acompte permet au dossier de passer `REGLE` quand le reste à payer, calculé sur le montant **accepté**, est zéro.
- Au corporel, une dénonciation de la transaction reçue dans les 15 jours qui suivent sa conclusion (Code CIMA, art. 235, SÛR) est enregistrée sur le dossier (lettre de dénonciation versée comme pièce) ; tant qu'aucun règlement n'est remis, elle annule les ordres différés et les règlements non remis (statut `ANNULE`, motif tracé) et le dossier repasse en `EN_INSTRUCTION` (transition 42) ; une nouvelle offre repart de `EN_INSTRUCTION`.
- Un ordre d'honoraires sans visa des honoraires est refusé (`HONORAIRES_NON_VISES`) ; le visa ne peut pas dépasser le montant facturé, et exige un motif au-delà de la lettre de mission (démo, §5.5).
- Le règlement à titre commercial sans décision du `DG` enregistrée est refusé (`VALIDATION_ACQUISE`) ; sans accord enregistré du bénéficiaire, il est refusé comme tout ordre (`ACCORD_ENREGISTRE`).
- Un règlement d'honoraires créé ou payé ne change ni le statut du dossier ni le reste à payer de l'indemnité.
- Chaque création d'ordre écrit une ligne d'audit : auteur, rôle, date et heure, montant, pièce d'accord, version des paramètres.

#### FR-91 : Un dossier peut porter plusieurs règlements

Un dossier peut avoir **plusieurs règlements** (décision D11) : un acompte, une offre provisionnelle puis une offre définitive, plusieurs bénéficiaires (victime, ayants droit, garage, représentant), les honoraires d'expert. Chaque règlement a sa nature (`INDEMNITE`, `ACOMPTE`, `PROVISIONNEL`, `HONORAIRES`, `COMMERCIAL`), son bénéficiaire, son montant, son moyen, son **état** (FR-92) et sa **quittance**. Le serveur tient en permanence trois montants du dossier : le montant **validé**, le montant **payé** (somme des règlements `PAYE`), le **reste à payer** (montant **accepté** moins payé ; jamais négatif). Ces montants ne se confondent jamais avec l'évalué, le proposé (l'offre) ni la provision (vocabulaire du PRD, §3).

**Conséquences (testables) :**
- La somme des règlements d'indemnité non annulés d'un dossier ne dépasse jamais le montant validé : un règlement qui le ferait dépasser est refusé (`MONTANT_VALIDE`).
- Les honoraires se suivent à part : ils n'entrent pas dans le reste à payer de l'indemnité, mais ils sont soumis à leur **plafond par niveau** de la matrice de délégation (au-delà, comité, FR-78) et figurent dans le coût du dossier.
- Un règlement à un ayant droit exige sa ligne vérifiée au registre de FR-70a (`AYANT_DROIT_NON_VERIFIE`).
- Une quittance par règlement ; un règlement annulé garde sa quittance en état `ANNULEE` (jamais supprimée).
- Au corporel, le règlement est libellé exclusivement au nom de la victime ou des ayants droit, même en présence d'un conseil (Code CIMA, art. 232, SÛR) : un règlement corporel dont le bénéficiaire n'est ni la victime ni un ayant droit enregistré est refusé (`BENEFICIAIRE_CONFORME`).
- Quand le bénéficiaire est un mineur ou un incapable, le serveur exige l'enregistrement de l'avis au juge des tutelles ou au conseil de famille au moins 15 jours avant le paiement (Code CIMA, art. 234, SÛR), faute de quoi l'émission est refusée (`AVIS_TUTELLE`).
- Un dossier avec acompte payé et reste à payer positif garde son statut `ORDRE_EMIS` ou `CHEQUE_A_REMETTRE` selon FR-92 ; il n'est jamais `REGLE` tant que le reste à payer n'est pas zéro.

#### FR-92 : États du règlement, états de la quittance, statut du dossier

Chaque règlement suit une machine à états, et sa quittance une autre (décision D11). Le statut du dossier en découle : il n'est jamais saisi à la main. Il n'existe qu'**un seul jeu d'états du règlement** : `A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`. Chaque règlement porte une **clé d'idempotence** unique, transmise à `paiement` et **conservée à chaque nouvelle tentative**.

| État du règlement | Sens | Ce qui le fait naître |
|---|---|---|
| `A_PAYER` | l'ordre est émis, la comptabilité ne l'a pas encore pris | création de l'ordre |
| `EN_COURS` | chèque émis non remis, ou paiement électronique lancé | émission par `CPT` |
| `PARTIEL` | une partie de la somme est payée (paiement électronique partiel, ou remise en plusieurs fois) | confirmation partielle |
| `INCONNU` | l'issue du paiement électronique n'est pas confirmée par `paiement` (délai dépassé, réponse perdue) | absence de confirmation |
| `PAYE` | remis au bénéficiaire (chèque, espèces) ou confirmé par `paiement` (virement, Mobile Money) | remise ou confirmation |
| `ECHEC` | le paiement électronique est refusé explicitement par le fournisseur, ou une anomalie est signalée | refus explicite ou signalement |

**Règles de l'état `INCONNU` et de l'état `ECHEC`.** Un règlement `INCONNU` ne se relance pas et ne s'annule pas tant que le **rapprochement** n'a pas posé `PAYE` ou `ECHEC` ; le rapprochement est fait par une personne qui n'a pas lancé le paiement. `ECHEC` n'est posé que sur refus explicite du fournisseur ; il ne se relance qu'avec la **même clé d'idempotence**, après confirmation de `paiement`. Un règlement `EN_COURS` ou `INCONNU` se résout d'abord : il ne s'annule pas.

| État de la quittance | Sens |
|---|---|
| `PRETE` | générée avec l'ordre, prête à éditer |
| `EDITEE` | imprimée ou mise à disposition du bénéficiaire |
| `SIGNEE` | signée par le bénéficiaire (FR-96) |
| `REMISE` | le règlement a été remis ou confirmé contre cette quittance |
| `ENCAISSEE` | l'encaissement est confirmé (rapprochement bancaire, `paiement`) |
| `ANNULEE` | annulée avant remise *(défaut H-071 : état repris de la démo, à ajouter aux cinq états de D11)* |

Statut du dossier dérivé (les règlements d'honoraires sont exclus de ce calcul, FR-90). Le **reste à payer** est le montant **accepté** moins le payé. La **table de vérité** couvre tous les cas des règlements d'indemnité non annulés, évalués dans cet ordre :

| Règlements d'indemnité non annulés | Statut du dossier |
|---|---|
| au moins un `A_PAYER` ou `ECHEC` | `ORDRE_EMIS` |
| aucun `A_PAYER` ni `ECHEC` ; au moins un paiement électronique `EN_COURS`, ou un règlement `PARTIEL` ou `INCONNU` | `ORDRE_EMIS` (le dossier garde `ORDRE_EMIS` : le seul règlement `EN_COURS`, `PARTIEL` ou `INCONNU` ne fait pas avancer le statut) |
| aucun des cas précédents ; au moins un chèque `EN_COURS` (émis, non remis) | `CHEQUE_A_REMETTRE` |
| tous `PAYE` et reste à payer **zéro** | `REGLE` |
| tous `PAYE` et reste à payer supérieur à zéro | `ORDRE_EMIS` (reste à ordonner) |

La table de test est **générée à partir de ce tableau**, non écrite à la main. La **transition 42** (dénonciation) part de `ORDRE_EMIS`, et, tant que `DELAI_DENONCIATION_ECOULE` est faux, aussi de `CHEQUE_A_REMETTRE` et de `REGLE` (règlement non encaissé) : aucune nouvelle transition n'est créée, la ligne 42 du tableau de FR-135 couvre ces trois départs.

**Conséquences (testables) :**
- Un dossier avec deux règlements dont un seul est `PAYE` n'est pas `REGLE`.
- Une remise sur un dossier déjà plus avancé (acompte, règlement partiel) ne change que la quittance et l'état du règlement, pas le statut du dossier.
- Le passage `ORDRE_EMIS → REGLE` sans chèque (virement, Mobile Money) n'a lieu qu'à la confirmation de `paiement` (transition 18) ; il est refusé tant que la quittance n'est pas `SIGNEE` (`QUITTANCE_SIGNEE`).
- Un règlement `ECHEC` reste visible dans la file de la comptabilité avec la cause du refus ; le dossier ne passe pas en `REGLE`.
- Deux envois du même ordre à `paiement` avec la même clé d'idempotence ne produisent qu'un paiement ; une nouvelle tentative après `ECHEC` reprend la même clé et exige la confirmation de `paiement` (`CONFIRMATION_PAIEMENT_REQUISE`).
- Un règlement `INCONNU` refuse toute relance et toute annulation (`ETAT_REGLEMENT`) tant que le rapprochement n'a pas posé `PAYE` ou `ECHEC` ; le rapprochement est refusé à la personne qui a lancé le paiement (`SEPARATION_DES_TACHES`).
- Un dossier dont le seul règlement est `EN_COURS` (paiement électronique), `PARTIEL` ou `INCONNU` garde `ORDRE_EMIS` ; un test par ligne de la table de vérité, générée du tableau, vérifie le statut dérivé.
- Un acompte payé avec un reste à payer positif sur le montant accepté garde `ORDRE_EMIS` ; quand le reste à payer de l'accepté est zéro, le dossier passe `REGLE`, y compris après un accord partiel.
- Après un règlement provisionnel payé et un reste à payer nul sur le montant validé, le dossier passe en `REGLE` ; il peut ensuite repasser en `EN_INSTRUCTION` pour l'offre définitive (transition 23).
- Aucun écran ne permet de changer à la main l'état d'un règlement ou le statut du dossier ; seuls les gestes de ce chapitre les font évoluer.
- Une quittance n'est marquée `SIGNEE` que par un agent distinct de celui qui a émis le règlement (`SEPARATION_DES_TACHES`).

#### FR-93 : La comptabilité émet le règlement, et seule la comptabilité

L'émission du règlement (le chèque, l'ordre de virement, l'ordre Mobile Money) est faite par `CPT` seul. La comptabilité **prépare** l'ordre ; un **second `CPT`, distinct** de celui qui l'a préparé, le **valide** avant exécution ; au-dessus d'un seuil paramétré, le `DG` le valide aussi *(défaut H-072 : 5 000 000 FCFA ; à confirmer à la séance d'immersion)*. Le service sinistres, le responsable, la direction et le contrôle interne **voient** les ordres et les règlements, ils ne les émettent pas (séparation SEP-02 de la démo : aucune sortie de trésorerie sans l'intervention d'un comptable qui n'a pas décidé). Un gestionnaire qui a instruit ou validé le dossier ne peut pas non plus enregistrer l'émission, même s'il détient aussi le rôle `CPT` (cumul de rôles, SEP-01 et SEP-02).

**Conséquences (testables) :**
- Une demande d'émission par un autre rôle que `CPT` est refusée (`DROIT_INSUFFISANT`).
- Une demande d'émission par un utilisateur qui est partie au dossier au sens de FR-29 (instruit, évalué, validé, contrôlé, enregistré l'accord) est refusée (`SEPARATION_DES_TACHES`) ; la tentative est tracée.
- Un ordre préparé par un `CPT` et exécuté sans validation d'un second `CPT` distinct est refusé (`VALIDATION_ORDRE_REQUISE`) ; au-dessus du seuil, l'absence de validation du `DG` le refuse aussi.
- Au corporel VTM, l'émission est refusée tant que `DELAI_DENONCIATION_ECOULE` n'est pas vrai (transitions 17, 18 et 20).
- L'émission est refusée si un signal de fraude `BLOQUE` n'est pas écarté (`AUCUN_SIGNAL_BLOQUANT`, §5.12).
- L'émission est refusée si l'un des contrôles de FR-100 est en alerte non levée (`CONTROLE_LBC_FT`).
- Le `CPT` qui a émis un règlement ne peut pas le remettre au bénéficiaire (`SEPARATION_DES_TACHES`, FR-7 ligne 3, FR-97).
- L'écran de la comptabilité présente les ordres à traiter par ancienneté et par échéance de FR-102 ; chaque ligne montre le bénéficiaire, le montant, le moyen demandé et les alertes.
- Chaque émission écrit une ligne d'audit : auteur, date et heure, moyen, montant, référence du chèque ou de l'ordre électronique.

#### FR-94 : Le règlement par chèque

Pour un chèque, `CPT` saisit la **banque**, le **numéro du chèque** et le **montant**. Si la compagnie utilise un gabarit, Prospera **imprime la lettre-chèque** sur ce gabarit (nom du bénéficiaire, montant en chiffres et en lettres, référence du dossier) ; sinon le chèque est rempli à la main et seul son numéro est saisi ; au **corporel**, le gabarit de lettre-chèque est **imposé**, et un chèque rempli à la main sans gabarit est contrôlé à la remise (FR-97). Le chèque passe alors `CHEQUE_A_REMETTRE` (transition 17) et attend la remise du FR-97. Le gabarit est un paramètre de la compagnie ; Prospera n'en invente aucun *(défaut H-073 : la compagnie fournit son gabarit de lettre-chèque ; à défaut, remplissage manuel)*.

**Conséquences (testables) :**
- Une émission de chèque sans numéro, sans banque ou sans montant est refusée avec le code `ORDRE_COMPLET`, et le message nomme le champ manquant.
- Un numéro de chèque déjà utilisé pour la même banque est refusé (`NUMERO_DEJA_UTILISE`) ; Prospera signale tout trou dans la suite des numéros saisis pour une banque (alerte à la comptabilité, non bloquante).
- Le nom imprimé est celui du bénéficiaire enregistré sur le règlement ; il n'est pas modifiable à l'impression.
- Le montant du chèque est égal au montant du règlement ; un écart est refusé (`MONTANT_VALIDE`).
- La lettre-chèque imprimée est versée au dossier comme pièce, avec son numéro.
- Aucun chèque n'est émis à l'ordre d'un garage ou d'un conseil au corporel (art. 232, FR-91).
- Un contrôle **mensuel** relève les numéros de chèque annulés non rapprochés et les présente à la comptabilité et à `AUD`.
- Au corporel, l'émission d'un chèque sans gabarit de lettre-chèque est refusée (`GABARIT_IMPOSE_AU_CORPOREL`).

#### FR-95 : Le règlement par virement, PI-SPI ou Mobile Money

Les moyens électroniques sont **exécutés par le module `paiement`** (§7.1) : virement bancaire, PI-SPI, et Mobile Money (T-Money, Flooz ; les opérateurs sont paramétrables par pays). `CPT` déclenche le paiement depuis l'ordre ; `paiement` l'exécute, le rapproche et renvoie sa confirmation à Prospera. Sur confirmation, le règlement passe `PAYE` et, s'il est le dernier, le dossier passe `REGLE` (transition 18). Il n'y a pas de remise au guichet pour ces moyens : la quittance est signée **avant** le paiement (FR-96). La **confirmation manuelle** d'un virement hors PI-SPI exige un **justificatif bancaire joint** et un **second `CPT`** ; elle ne peut pas être faite par celui qui a lancé le virement. L'ordre est préparé, puis validé par un second `CPT` avant exécution (FR-93).

**Conséquences (testables) :**
- Le lancement d'un paiement électronique est refusé tant que la quittance n'est pas `SIGNEE` (`QUITTANCE_SIGNEE`).
- Le lancement est refusé si les coordonnées du bénéficiaire (RIB, numéro Mobile Money) ne sont pas **vérifiées** : numéro de compte au nom du bénéficiaire, ou numéro Mobile Money dont l'identité du porteur correspond au bénéficiaire (`COORDONNEES_VERIFIEES`).
- Chaque demande à `paiement` porte une **clé d'idempotence** unique (celle du règlement, FR-92), conservée à chaque tentative : un même règlement relancé deux fois ne paie qu'une fois.
- Un refus **explicite** de `paiement` passe le règlement `ECHEC` avec le motif reçu ; `CPT` peut relancer après correction des coordonnées, avec motif et **avec la même clé**, après confirmation de `paiement`. Une issue non confirmée passe le règlement `INCONNU`, sans relance.
- La confirmation manuelle d'un virement hors PI-SPI sans justificatif bancaire est refusée (`JUSTIFICATIF_BANCAIRE_ABSENT`) ; par celui qui a lancé le virement, elle est refusée (`SEPARATION_DES_TACHES`) ; sans second `CPT`, elle est refusée (`VALIDATION_ORDRE_REQUISE`).
- Le rapprochement bancaire des virements et du Mobile Money se fait dans `paiement` ; un écart de rapprochement de plus de 60 jours alerte la comptabilité (paramètre ; décision D16).
- Si `paiement` est indisponible, l'ordre reste `A_PAYER` ; aucun statut n'est avancé sans confirmation.

#### FR-96 : La quittance, signée avant tout paiement électronique

Chaque règlement a sa **quittance**, numérotée. Elle porte : le numéro, le dossier, le bénéficiaire, son téléphone, le montant en chiffres et en lettres, le moyen, la banque et le numéro de chèque s'il y a lieu, les dates d'édition et de signature, la référence de la transaction pour un paiement électronique, l'auteur de l'émission. Au corporel, le texte rappelle que le règlement vaut exécution de la transaction (le droit de dénonciation est déjà purgé **par construction** : l'émission n'a lieu qu'après `DELAI_DENONCIATION_ECOULE`, FR-86, FR-90). La signature est **manuscrite** : au guichet, ou sur la quittance imprimée, signée puis scannée ou photographiée et retournée par l'assuré. L'**acceptation électronique par code à usage unique** est une option, activable seulement après validation juridique de la valeur de la signature électronique (loi 2017-007 non lue ; revue juridique obligatoire, D21).

**Conséquences (testables) :**
- Une quittance `SIGNEE` sans pièce de signature jointe (scan ou photo) est refusée (`QUITTANCE_SIGNEE`).
- L'acceptation électronique est indisponible tant que le paramètre n'est pas activé par l'administrateur sur décision du `DG` ; si elle est activée, le code à usage unique est envoyé au numéro enregistré du bénéficiaire, valable 10 minutes *(défaut H-074 : durée de validité du code)*, et la preuve (date, numéro, résultat) est versée à la quittance.
- Une quittance ne passe `REMISE` qu'avec le geste de remise (FR-97) ou la confirmation de `paiement` (FR-95).
- Une quittance `SIGNEE` par l'agent qui a émis le règlement est refusée (`SEPARATION_DES_TACHES`, ligne 15 de FR-7) : la signature est marquée par un agent distinct.
- Une quittance `ANNULEE` ne peut plus être signée ni remise ; sa ré-émission crée une nouvelle quittance, numérotée.
- La quittance signée est versée au dossier et figure au bordereau de versement aux archives (§6.2).

#### FR-97 : La remise du chèque au guichet

À la remise, `ACC` enregistre (`CPT` seulement pour un règlement qu'il n'a pas lui-même émis, FR-7, FR-93) : l'**identité** de la personne qui retire et le **numéro de sa pièce d'identité**, et la **quittance signée** (FR-96). Pour un chèque rempli à la main, `ACC` saisit aussi le **nom et le montant lus sur le chèque** : le serveur les compare à l'ordre, et la **photo du chèque** est obligatoire au dossier. Le champ « retiré par » n'est jamais pré-rempli (constat de la démo). Si le retirant n'est pas le bénéficiaire (procuration, représentant légal, avocat), la pièce de pouvoir est jointe et le lien est saisi. La remise fait passer le règlement `PAYE` et, s'il est le dernier, le dossier `REGLE` (transition 20).

**Conséquences (testables) :**
- Une remise sans identité du retirant est refusée (`IDENTITE_RETIRANT`) ; une remise avec un nom mais sans numéro de pièce d'identité l'est aussi.
- Une remise sans quittance signée est refusée (`QUITTANCE_SIGNEE`).
- Un chèque dont le nom ou le montant lus diffère de l'ordre est refusé (`CHEQUE_NON_CONFORME_A_L_ORDRE`) ; une remise sans photo du chèque est refusée (`PHOTO_CHEQUE_ABSENTE`).
- Une remise à une personne autre que le bénéficiaire sans pièce de pouvoir est refusée (`POUVOIR_REQUIS`) ; au corporel, le chèque reste libellé au nom de la victime ou des ayants droit (art. 232).
- La remise est refusée si un signal de fraude `BLOQUE` n'est pas écarté (`AUCUN_SIGNAL_BLOQUANT`) ; le chèque est alors mis en attente et `CPT` est alerté.
- La remise est tracée : retirant, numéro de pièce, accusé signé (oui ou non), observation, auteur, date et heure. La copie de la pièce d'identité est conservée 10 ans au moins (LBC/FT, règlement CIMA n° 0004/CIMA/PCMA/PCE/SG/08, art. 13, SÛR).
- Un gestionnaire du dossier qui n'a pas le rôle `ACC` ou `CPT` ne peut pas enregistrer la remise (`DROIT_INSUFFISANT`) ; un `CPT` qui a émis ce règlement ne peut pas le remettre (`SEPARATION_DES_TACHES`).

#### FR-98 : Les espèces sont plafonnées

Le règlement en espèces est un moyen exceptionnel, plafonné à **500 000 FCFA** par règlement et par bénéficiaire (paramètre ; valeur de la démo) *(point juridique J-14 : la loi togolaise ne fixe aucun plafond trouvé pour les assureurs ; à valider par le juriste, D21)*. Au-delà, le moyen doit être traçable (chèque, virement, Mobile Money).

**Conséquences (testables) :**
- Un règlement en espèces supérieur au plafond est refusé avec le code `PLAFOND_ESPECES`.
- Plusieurs règlements en espèces au même bénéficiaire dont le cumul sur 30 jours dépasse le plafond sont refusés au même code (anti-fractionnement).
- Chaque règlement en espèces demande le consentement écrit du bénéficiaire sur la quittance, l'identité et le numéro de pièce d'identité ; l'opération est inscrite au journal des paiements de sinistres de FR-100.
- Le plafond est un paramètre versionné ; changer sa valeur n'affecte pas les règlements déjà émis.

#### FR-99 : La comptabilité peut rejeter l'ordre

Quand `CPT` constate une anomalie comptable (bénéficiaire mal orthographié, montant incohérent avec la décision, coordonnées manifestement fausses, doublon), il **rejette l'ordre** avec un motif écrit. Le rejet n'agit que sur le règlement visé. Le dossier repasse en `EN_VALIDATION` (transition 19), et la décision de payer doit être reprise par le circuit de validation (§5.7).

**Conséquences (testables) :**
- Un rejet sans motif d'au moins 10 caractères est refusé (`MOTIF_ECRIT`).
- Un rejet n'est possible que sur un règlement `A_PAYER` ou `ECHEC` ; sur un règlement `PAYE`, `EN_COURS`, `INCONNU` ou `PARTIEL`, il est refusé (`ETAT_REGLEMENT`).
- Le rejet annule le règlement visé et sa quittance (`ANNULEE`), sans toucher aux règlements déjà `PAYE` ni à un règlement `EN_COURS`, `INCONNU` ou `PARTIEL`.
- L'accord de l'assuré n'est pas perdu : la nouvelle validation s'appuie sur l'accord enregistré tant que le montant validé ne dépasse pas le montant accepté ; si la nouvelle validation fixe un montant **supérieur** au montant accepté, une nouvelle offre est requise et le dossier suit `EN_VALIDATION → OFFRE_ENVOYEE` ; un montant validé **inférieur** au montant accepté reste valable sans nouvelle offre : la transition 10 est alors dispensée de l'envoi (ligne 10a, validation, sans ligne 10b).
- Le gestionnaire et le responsable reçoivent une notification avec le motif (§5.15).

#### FR-100 : Les contrôles LBC/FT avant paiement

Avant toute émission (FR-93), le serveur exécute les contrôles de lutte contre le blanchiment et le financement du terrorisme issus de la démo et du cadre CIMA : (1) **bénéficiaire vérifié** : identité et pièce d'identité du bénéficiaire en dossier ; (2) **coordonnées bancaires modifiées** dans les 5 jours qui précèdent le paiement : alerte ; (3) **doublon de règlement** : même bénéficiaire et même **sinistre** (date, police, immatriculation), le montant n'entrant pas dans la définition (FR-38, FR-224) ; (4) **concentration d'émission** : un même utilisateur `CPT` émet plus de 60 % du volume sur la période ; (5) **bénéficiaire différent de la victime** sans mandat enregistré ; (6) **cumul par bénéficiaire** supérieur au seuil national LBC/FT *(défaut H-075 : seuil national non lu, paramètre vide donc alerte inactive tant qu'il n'est pas saisi ; D21)*. Les contrôles 1, 3 et 5 **bloquent**, mais une **levée motivée par `AUD`** est possible (comme pour le doublon), de sorte qu'un expert ou un garage mandaté ne reste jamais dans un blocage sans issue ; les contrôles 2, 4 et 6 **alertent** le **responsable LBC** (FR-225, et non un rôle inexistant) et le contrôle interne, et exigent une levée motivée avant l'émission (sauf 4, qui alerte seulement). Le contrôle 6 est marqué **« non actif »** à l'écran tant que son paramètre est vide. Un journal des **paiements de sinistres** (bénéficiaire réel, moyen, origine, destination, cumul par client) est tenu et exportable pour le responsable LBC, conservé 10 ans au moins (règlement CIMA n° 0004, art. 4.5 et 13, SÛR). Le mécanisme de déclaration de soupçon relève du responsable LBC de la compagnie ; Prospera conserve l'alerte et la trace de sa suite *(défaut H-076 : la déclaration de soupçon se fait hors Prospera ; à confirmer)*.

**Conséquences (testables) :**
- Une émission vers un bénéficiaire dont l'identité n'est pas vérifiée est refusée (`BENEFICIAIRE_VERIFIE`).
- Une émission qui reproduit un règlement du même bénéficiaire pour le même sinistre (date, police, immatriculation) est refusée (`DOUBLON_REGLEMENT`), quel que soit le montant ; une dérogation motivée du responsable est possible et tracée.
- Un blocage de contrôle 1 ou 5 sur un expert ou un garage mandaté est levé par une levée motivée de `AUD` ; sans levée, l'émission est refusée (`CONTROLE_LBC_FT`).
- Les alertes 2, 4 et 6 arrivent au responsable LBC ; le contrôle 6 s'affiche « non actif » tant que le seuil national n'est pas saisi.
- Un changement de RIB ou de numéro Mobile Money enregistré dans les 5 jours avant l'émission déclenche une alerte au contrôle interne et exige la levée motivée de `RESP` ; sans levée, l'émission est refusée (`COORDONNEES_VERIFIEES`).
- Une émission dont le bénéficiaire n'est ni l'assuré, ni la victime, ni l'ayant droit, ni un expert, ni un garage mandaté, sans mandat enregistré, est refusée (`BENEFICIAIRE_CONFORME`).
- La part de volume de `CPT` en émissions est calculée par semaine ; au-dessus de 60 %, l'alerte apparaît dans la file du contrôle interne (`AUD`).
- Le journal des paiements de sinistres s'exporte (bénéficiaire, moyen, montant, date, cumul) pour une période, sans donner accès aux données médicales.

#### FR-101 : Le chèque non retiré se relance puis s'expose

Un chèque `CHEQUE_A_REMETTRE` non retiré se suit par son ancienneté depuis l'émission : au-delà de **7 jours**, c'est un oubli à relancer (liste d'appels du guichet) ; au-delà de **21 jours**, c'est une circulation longue signalée à la comptabilité ; au-delà de **30 jours**, c'est une **exposition** (somme due, non retirée) montrée au responsable et au contrôle interne. `ACC` relance l'assuré par appel, SMS, e-mail ou WhatsApp, avec trace du canal et du résultat (§5.14, FR-143).

**Conséquences (testables) :**
- Au 8e jour sans remise, le chèque entre dans la liste d'appels du guichet avec le nom du bénéficiaire et son téléphone ; au 22e, il entre dans l'alerte de circulation longue ; au 31e, il entre dans l'état des expositions.
- `CPT` peut **annuler** un chèque non retiré et **ré-émettre**, mais seulement après l'**opposition bancaire enregistrée** (référence et date) : le chèque passe d'abord à l'état `CHEQUE_EN_OPPOSITION`. L'annulation-réémission sans opposition enregistrée est refusée (`OPPOSITION_NON_ENREGISTREE`). Une fois l'opposition enregistrée, la quittance passe `ANNULEE`, une nouvelle quittance est créée, le dossier repasse `ORDRE_EMIS` (transition 21), avec motif obligatoire (`MOTIF_ECRIT`) ; aucun chèque de remplacement n'est émis avant l'opposition.
- Un chèque annulé ne peut plus être remis ; le numéro annulé reste visible dans la série de la banque. Un **contrôle mensuel** relève les numéros de chèque annulés non rapprochés (FR-94).
- L'exposition apparaît dans l'état pour la comptabilité (FR-103) avec le compte d'attente concerné, sans écriture passée par Prospera.
- Le bénéficiaire qui ne retire jamais son chèque n'est pas relancé indéfiniment : après 3 relances sans effet, une proposition d'arbitrage (annulation, versement par un autre moyen, classement) est faite au responsable (§5.14, FR-143).

#### FR-102 : Le paiement sous 72 heures après l'accord

La cible interne de la compagnie est de payer **dans les 72 heures ouvrées qui suivent l'accord** (procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA), reprise comme valeur par défaut ; paramètre ; calendrier de la compagnie, A-18). Le point de départ est l'accord enregistré ; le point d'arrêt est le dernier règlement `PAYE`. Au **corporel automobile**, la loi ajoute ses propres délais : le paiement des sommes convenues se fait dans le mois qui suit l'expiration du délai de dénonciation de 15 jours (Code CIMA, art. 235 et 236, SÛR), et le retard produit de plein droit un intérêt de **5 % par mois** de retard (art. 236, SÛR ; base de calcul : paramètre `penalite.base`, défaut « montant de l'offre », libellé « estimation, base non validée », à faire valider par le juriste, D21, FR-85). Pour ce régime, le **délai de paiement court depuis la fin du délai de dénonciation** : l'émission n'a lieu qu'après `DELAI_DENONCIATION_ECOULE`, par construction (FR-86).

**Conséquences (testables) :**
- Le dossier affiche, pour chaque règlement : la date limite interne, la date limite légale s'il y a lieu, le temps restant (négatif si dépassé), et la nature (légale, interne) de l'échéance (§5.14).
- Une alerte jaune apparaît à 48 heures de la cible interne, une alerte rouge au dépassement, dans la file de `CPT` et celle de `RESP`.
- Au corporel automobile, le dépassement du délai légal affiche la pénalité cumulée (5 % de l'indemnité par mois de retard, base paramétrable) et exige, pour la réduire ou l'annuler, un motif « circonstances non imputables à l'assureur » enregistré par `RESP` (art. 233, SÛR).
- Un dossier dont la dénonciation est ouverte n'a pas d'échéance légale de paiement avant sa fin ; la date de fin est calculée depuis la date de conclusion de la transaction.
- Les échéances légales ne sont pas modifiables par la compagnie ; la cible de 72 heures ouvrées l'est.
- Au corporel VTM, le délai de paiement d'un mois et la cible interne de 72 heures ouvrées partent de la fin du délai de dénonciation, et non de la date de l'accord ; un test le vérifie.

#### FR-103 : L'état et l'export pour la comptabilité

La comptabilité officielle reste hors de Prospera (décision D16). Prospera produit un **état** et un **export** des règlements émis et remis, des honoraires d'expert, des provisions du dossier (§6.4, module `assurance`), des recours encaissés (FR-117) et des cessions. Le format suit le contrat d'échange (annexe C). L'état distingue : les règlements remis, les chèques émis non retirés (comptes d'attente), les règlements annulés à ré-émettre, les honoraires visés. Une **prévision hebdomadaire des règlements** (ordres `A_PAYER`, chèques à remettre, honoraires visés) est remise à la comptabilité chaque semaine. Les **engagements de décaissement** sont présentés en **deux colonnes séparées**, « exigible » et « à confirmer », **jamais sommées** ; ils sont alimentés par l'indemnité arrêtée, les missions confiées et les chèques non retirés. La **fraîcheur** de l'état est continue pour la file `CPT` et quotidienne pour l'export. La démo mettait en regard un plan de comptes CIMA ; ce plan est celui de la compagnie, il n'est jamais fixé dans Prospera *(défaut H-077 : les comptes sont saisis par la compagnie ; Prospera exporte des natures d'opération, la compagnie les affecte à ses comptes)*.

**Conséquences (testables) :**
- L'export d'une période liste, pour chaque mouvement : date, dossier, numéro de sinistre officiel, nature (indemnité, acompte, honoraires, recours encaissé), bénéficiaire, moyen, montant, référence du chèque ou de la transaction, statut, auteur.
- Un règlement remis apparaît une seule fois dans l'export de sa période ; un règlement annulé apparaît avec son annulation en mouvement inverse.
- Le total de l'export d'une période est égal à la somme des règlements `PAYE` de cette période ; un test de recette le vérifie sur le jeu de démonstration.
- L'export est disponible en fichier (Excel, JSON) ou par échange avec le logiciel de la compagnie (annexe C), dans les deux cas avec la date et l'heure de génération.
- L'état et l'export sont réservés à `CPT`, `RESP`, `DG`, `DT` et `AUD` ; `ACC` n'y a pas accès.
- La prévision hebdomadaire est remise chaque semaine à la comptabilité ; les engagements s'affichent en deux colonnes, « exigible » et « à confirmer » ; un test vérifie qu'aucun total n'additionne les deux colonnes.
- La file `CPT` se met à jour en continu ; l'export est rafraîchi chaque jour.
- Prospera n'affiche aucun solde bancaire : la position en banque appartient à la comptabilité de la compagnie.

### 5.9 Clore : solde à zéro, motif écrit, archives

Cette section couvre la phase 8 : `CLOTURE`. La clôture ferme le dossier sinistre ; elle ne ferme pas le recours, qui continue seul (§5.10). Le dossier clos reste consultable ; il se rouvre par un geste tracé.

#### FR-104 : Les conditions de clôture

Le gestionnaire (`GEST`, `GREC`) ou le responsable (`RESP`) clôture un dossier `REGLE` avec un **motif écrit**. Le serveur vérifie que : le reste à payer de l'indemnité validée est **zéro** (`SOLDE_APURE`) ; tous les règlements, honoraires compris, sont `PAYE` ou annulés (`REGLEMENT_REMIS`) ; aucune mission d'expertise n'est ouverte ; aucune offre définitive n'est attendue (cas du règlement provisionnel, FR-92) ; la question du **recours** est tranchée : un recours est ouvert, ou une décision écrite « aucun tiers en cause » est enregistrée (FR-108).

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
- La clôture ajoute au dossier la mention « réouverture tracée » (FR-107, inchangé) ; un dossier clos se retrouve par la référence `DEC-` **et** par le numéro de sinistre officiel : les deux restent des critères de recherche.

#### FR-106 : Le recours continue seul quand le dossier est clos

Un dossier clos peut avoir un recours **encore actif** (décision D10). Le dossier montre alors un bandeau « Dossier clos, recours en cours » avec le statut du recours. Le recours a sa propre machine et sa propre clôture (FR-112) ; il reste suivi par `GREC` ; il n'empêche ni la clôture du dossier ni son versement aux archives.

**Conséquences (testables) :**
- Un dossier `CLOTURE` avec un recours `NEGOCIATION` affiche les deux états côte à côte, et la corbeille de `GREC` continue de le montrer.
- Clôturer le dossier ne modifie ni les échéances du recours, ni ses relances, ni sa prescription.
- Les pièces ajoutées au recours après le versement du dossier aux archives sont conservées dans un **bordereau complémentaire** rattaché au même numéro d'archivage *(défaut H-078 : bordereau complémentaire pour les pièces tardives du recours ; à confirmer avec l'archiviste)*.
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

À l'ouverture du dossier (§5.2), si un **tiers est en cause** (un autre véhicule, un autre assuré, un responsable identifié), le serveur crée le **recours** dans le statut `A_QUALIFIER`, le rattache au dossier et l'attribue au pôle recours (`GREC`). Un dossier peut porter **plusieurs recours**, un par tiers ou assureur débiteur *(défaut H-079 : la démo n'en porte qu'un par dossier ; un accident à plusieurs véhicules en demande plusieurs)*. Un gestionnaire peut aussi le créer plus tard, dès qu'un tiers apparaît (rapport de police, rapport de responsabilité). Au **corporel à plusieurs véhicules**, le dossier est en « mandat pour compte d'autrui » (FR-82) : le recours se calcule après la répartition entre assureurs, et l'assureur meneur désigné porte les intérêts de retard. Si l'instruction conclut qu'aucun tiers n'est en cause, le gestionnaire enregistre la décision « aucun tiers en cause » avec motif ; elle lève la condition de clôture du FR-104.

**Conséquences (testables) :**
- À l'ouverture d'un dossier avec un tiers déclaré, un recours `A_QUALIFIER` existe sans aucun geste du gestionnaire, avec la date de naissance, le débiteur présumé et la responsabilité déclarée.
- Sur un dossier corporel à deux véhicules, le recours porte sur la part répartie à l'assureur du tiers, après désignation de l'assureur meneur (FR-82).
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
- Une lettre non envoyée dans les 5 jours ouvrés après l'ouverture est signalée au responsable *(défaut H-080 : 5 jours ouvrés ; la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) dit « dès l'ouverture » sans chiffre)*.

#### FR-110 : Le recours se relance tous les 15 jours

Tant que le débiteur n'a pas répondu, puis jusqu'au recouvrement, le recours est **relancé tous les 15 jours** (paramètre ; procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA)). Le point de départ est l'envoi de la lettre de mise en cause, puis de chaque relance ; le point d'arrêt est la réponse du débiteur, puis, pour le second cycle, l'encaissement complet.

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
- Quand le débiteur est inconnu ou non assuré, la qualification enregistre « auteur inconnu » ou « auteur non assuré » : si un fonds de garantie automobile existe et est activé (paramètre par pays), le serveur ouvre l'échéancier du fonds : transaction dans le mois (art. 605) et procès-verbal transmis dans les 60 jours de l'accident (art. 606, SÛR) ; la **déclaration au fonds dans les 3 mois** (art. 608, SÛR) ne vaut que pour l'« **exception de garantie invoquée** » (FR-121) et ne s'applique pas à « auteur inconnu ou non assuré » ; le paramètre s'appelle `legal.fga_declaration_mois` ; sinon la règle de l'art. 274 s'applique (part supportée par les autres assureurs à parts égales). Au Togo, l'existence du fonds n'est pas confirmée *(défaut H-081 : fonds de garantie automobile désactivé par défaut ; D21)*.

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

`RECUPERE` et `ABANDONNE` sont terminaux. L'état `EN_ARBITRAGE` (R12, R13) et la possibilité d'abandonner depuis les premiers états (R15 élargie) sont des ajouts à la démo *(défaut H-082 : la démo n'abandonne que depuis RECLAMATION_ENVOYEE, NEGOCIATION et CONTENTIEUX, et n'a pas d'arbitrage)*.

**Conséquences (testables) :**
- Toute transition hors de ce tableau est refusée (`TRANSITION_INCONNUE`) ; toute transition dont une condition n'est pas remplie est refusée avec le nom de la condition.
- `GREC` ne valide pas sa propre créance : R5 par le même utilisateur que R4 est refusée (`SEPARATION_DES_TACHES`).
- Chaque clôture de recours (R14, R15) porte une **issue** parmi `RECUPERATION_INTEGRALE`, `ACCORD_EXECUTE`, `DECISION_DEFINITIVE`, `POURSUITE_IMPOSSIBLE`, `AUTRE`, un motif, et les pièces de clôture.
- Un abandon (R15) est proposé par `GREC` et décidé par `RESP` ; l'abandon décidé par la personne qui l'a proposée est refusé (`SEPARATION_DES_TACHES`).
- Aucun recours non terminal n'est sans issue : un test de recette parcourt la table et prouve que chaque statut non terminal a au moins une sortie.
- Chaque transition est tracée (auteur, rôle, date et heure, avant, après, motif).

#### FR-113 : La créance et ses trois montants

Chaque recours porte une **créance**, numérotée, avec trois montants qui ne se confondent jamais : le montant **réclamé** (ce que la compagnie demande), le montant **accepté** (ce que le débiteur reconnaît), le montant **encaissé** (ce qui est reçu et rapproché). La créance a ses états : `A_ETABLIR`, `ETABLIE`, `RECLAMEE`, `CONTESTEE`, `PARTIELLEMENT_RECUPEREE`, `SOLDEE`, `ABANDONNEE`. Le montant réclamé se calcule ainsi : somme des règlements d'indemnité `PAYE` du dossier, multipliée par la **part du tiers** arrêtée (responsabilité du dossier, requalifiée sur rapport d'expertise). Pour les accidents entre véhicules assurés, la part est celle du **barème de responsabilité** annexé au Livre II du Code CIMA (art. 274, SÛR), dont les tables sont à saisir (D21) ; quand la responsabilité est indéterminable, le partage par parts égales ou la règle de l'art. 275 s'applique `[à vérifier par le juriste]`. Les honoraires d'expert sont ajoutés à la base seulement si le paramètre l'autorise *(défaut H-083 : honoraires non inclus par défaut)*.

**Conséquences (testables) :**
- Une part du tiers égale à 70 % sur 395 500 FCFA payés (l'évaluation arrêtée de `SIN-2026-9002`, franchise déduite, comme en UJ-3) donne un montant réclamé de 276 850 FCFA (chiffre recalculé sur le dossier de la démo, rejoué en recette) *(défaut H-084 : règlement égal à l'évaluation arrêtée, 395 500 FCFA ; le jeu de démonstration fixe la valeur exacte)*.
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
- Une mise en demeure ou une dénonciation n'est reçue qu'avec une **preuve de réception** par un moyen listé en paramètre ; le recommandé électronique n'est pas accepté tant que le juriste n'a pas tranché (`PREUVE_RECEPTION_ABSENTE`).
- À l'échéance du délai accordé sans paiement, la mise en demeure passe `SANS_REPONSE` et le recours entre dans la liste d'arbitrage de `RESP` (négociation, contentieux, arbitrage, abandon).
- Le texte généré par l'IA n'est jamais envoyé sans la relecture et la signature d'un humain ; le brouillon est conservé avec la version finale.
- Un paiement partiel reçu avant l'échéance est enregistré sur la mise en demeure (montant payé) et sur la créance.

#### FR-115 : La négociation

La **négociation** consigne les offres et contre-offres (émetteur `TIERS` ou `COMPAGNIE`, montant, commentaire, date). Elle a ses états : `EN_COURS`, `ACCORD_TROUVE`, `ECHEC`, `SUSPENDUE`. Elle s'appuie sur l'analyse de l'offre adverse du FR-120. L'accord conclu (R9) fixe le montant accepté de la créance.

**Conséquences (testables) :**
- Une offre du tiers saisie fait apparaître l'écart à la somme réclamée, en pourcentage et en FCFA.
- Un accord ne peut être enregistré (`ACCORD_CONCLU`) qu'avec la pièce de l'accord jointe et le montant accepté ; il est refusé sinon.
- `ECHEC` ouvre une proposition d'arbitrage à `RESP` ; `SUSPENDUE` demande un motif et une date de reprise.
- Un accord qui abandonne une partie de la créance au-delà d'un seuil de perte exige la validation de `DG` ou `DT` *(défaut H-085 : seuil de perte à obtenir de la compagnie ; paramètre vide, validation de RESP seule tant qu'il n'est pas saisi)*.
- L'historique complet des offres reste lisible sur la fiche, jamais écrasé.

#### FR-116 : Le contentieux

Le **contentieux** a sa machine : `A_ENGAGER → ENGAGE → EN_ATTENTE_DECISION → DECISION_RENDUE → TRANSACTION_A_EXECUTER → CLOS`. Il porte la nature du litige (responsabilité, montant, refus de garantie, tiers non assuré, autre), le conseil, la juridiction, la référence de la procédure et une **provision pour risque**. Il s'engage par la transition R10, décidée par `RESP` avec motif. Les honoraires du conseil sont des règlements de nature `HONORAIRES` (FR-91).

**Conséquences (testables) :**
- Engager un contentieux sans motif est refusé (`MOTIF_ECRIT`).
- Chaque étape enregistre sa date, son auteur et la pièce correspondante (assignation, jugement, transaction).
- La provision pour risque est tracée dans l'historique de provision du recours (catégorie `CONTENTIEUX`, §6.4).
- Un jugement enregistré avec un montant propose le montant accepté de la créance, à valider par `GREC`.
- Un contentieux clos sans exécution de la décision garde le recours ouvert jusqu'à encaissement ou abandon motivé.

#### FR-117 : Les encaissements se rapprochent avant d'être imputés

Un **encaissement de recours** est reçu (virement, chèque, espèces, compensation entre assureurs), déclaré par `CPT` avec sa référence bancaire et son justificatif, puis **rapproché** (`A_RAPPROCHER → RAPPROCHE | ECART`). Il n'est **imputé** à une créance qu'après la validation de son rapprochement ; il peut en solder plusieurs. Le rapprochement passe par `paiement` quand le relevé y est disponible, sinon il est confirmé à la main avec justificatif *(défaut H-086 : rapprochement des encaissements de recours dans `paiement` quand le relevé est importé, sinon confirmation manuelle ; à préciser avec le module)*. Les recours encaissés alimentent l'export de la comptabilité (FR-103).

**Conséquences (testables) :**
- Un encaissement non rapproché n'augmente pas le montant encaissé de la créance.
- Un encaissement imputé à plusieurs créances garde ses affectations (créance, montant, recours) ; la somme des affectations est égale au montant de l'encaissement (`AFFECTATION_EQUILIBREE`).
- Un encaissement en `ECART` bloque le passage `ACCORD → RECUPERE` (`TOUT_RAPPROCHE`).
- La validation d'un encaissement est faite par un utilisateur qui ne l'a pas déclaré (`SEPARATION_DES_TACHES`).
- L'export comptable d'une période contient les recours encaissés (nature `RECOURS_ENCAISSE`), avec le numéro de sinistre officiel et la référence bancaire.
- Un encaissement de recours ne modifie ni le reste à payer ni la provision du dossier sinistre : la provision se tient brute, les recours à recevoir faisant l'objet d'une évaluation distincte (Code CIMA art. 334-12, SÛR).

#### FR-118 : La prescription, un terme à vérifier

Le recours affiche un **terme de prescription indicatif** : la date du sinistre plus 730 jours (« prescription biennale », paramètre), avec la mention « à vérifier » et une **alerte à 90 jours** du terme. Le serveur ne déclare jamais un recours « prescrit » ni « non prescrit » : il affiche le terme et les actes enregistrés (mise en demeure, reconnaissance de dette). Les textes lus du Code CIMA donnent une prescription de 2 ans pour l'action dérivant du contrat d'assurance (art. 28, SÛR) et de 5 ans pour l'action en responsabilité extra-contractuelle du Livre II (art. 256, SÛR) ; le recours d'un assureur subrogé relève de l'un ou de l'autre selon son fondement. Le terme applicable à chaque fondement est donc **un point de revue juridique** (D21), et le paramètre garde la valeur prudente la plus courte *(défaut H-087 : 730 jours par défaut, valeur de la démo et la plus prudente)*.

**Conséquences (testables) :**
- Un recours dont le sinistre date de plus de 640 jours, sans réclamation envoyée, figure en alerte rouge (90 jours avant le terme indicatif).
- Le terme se calcule sur la date de survenance du dossier ; il se recalcule si le fondement du recours change (contractuel, légal, conventionnel, autre) quand une valeur est paramétrée par fondement.
- Une mise en demeure `RECEPTION_CONFIRMEE` est enregistrée comme acte, avec sa date ; elle ne modifie pas le terme affiché tant que le juriste n'a pas validé son effet.
- L'écran affiche toujours « terme indicatif, à vérifier » à côté de la date.
- La liste des recours dont le terme approche s'exporte (référence, débiteur, créance, terme, jours restants).

#### FR-119 : L'arbitrage entre assureurs et les conventions, en paramètre

Les conflits nés des recours entre assureurs sont, selon le Code CIMA (art. 276, SÛR), **obligatoirement soumis à la Commission nationale d'arbitrage** : trois assureurs étrangers au litige, sentence dans le mois de la saisine ; les intérêts courent au taux de l'escompte à compter du mois qui suit la demande (art. 277, SÛR). Le champ de ces articles est l'indemnisation des victimes d'un véhicule terrestre à moteur ; la mise en place de la commission au Togo n'est pas confirmée *(défaut H-088 : arbitrage activé pour les recours entre assureurs automobiles, par un paramètre ; à vérifier auprès de l'association des assureurs ; D21)*. Les **conventions de place** (indemnisation directe de type IDA, forfait inter-compagnies) ne sont pas supposées : aucune convention togolaise n'a été trouvée. Elles sont des **paramètres** : convention active ou non, forfait, délai de règlement entre compagnies, bordereau de recours. Le forfait de la démo (350 000 FCFA) est une valeur d'exemple, inactive par défaut.

**Modèle de convention d'indemnisation directe, désactivé par défaut.** Le PRD prépare un modèle prêt, que la compagnie active par paramètre quand une convention existe, sans reprise du code *(défaut H-283 : modèle désactivé ; activable par le paramètre `recours.ida_active` ; à confirmer par l'association des assureurs du Togo, A-23)*. Le modèle porte : le **périmètre** (deux véhicules assurés, dommages matériels), un **seuil** d'indemnisation, le **constat amiable** signé par les deux parties, un **barème forfaitaire** et le **délai de règlement entre assureurs** (`recours.convention_delai_reglement_jours`) *(défaut H-284 : seuil, barème et délai vides ; constat amiable obligatoire ; l'exemple camerounais de 500 000 FCFA et 15 jours n'est pas togolais et n'est pas repris)*. Activé, le modèle ne change ni les règlements de l'assuré ni la machine du dossier : la compagnie indemnise son assuré, puis réclame le forfait du barème à l'assureur adverse dans le délai convenu, par le recours parallèle.

**Conséquences (testables) :**
- Avec la convention désactivée (défaut), aucun forfait n'est appliqué au montant réclamé ; avec elle activée, le forfait s'applique aux dossiers éligibles selon la règle d'éligibilité saisie par la compagnie.
- La saisine de l'arbitrage (R12) enregistre la date de saisine, le motif et les pièces ; une alerte à un mois de la saisine rappelle la sentence attendue.
- Si l'arbitrage n'est pas activé, R12 est refusée (`ARBITRAGE_APPLICABLE`).
- Le mode d'**indemnisation directe** (la compagnie paie son propre assuré puis recourt contre l'adverse) est un réglage de convention : il ne change ni les règlements de l'assuré ni la machine du dossier.
- Un changement de paramètre de convention est tracé (ancienne valeur, nouvelle valeur, auteur, validateur, date) et n'affecte que les recours créés après lui.
- Avec `recours.ida_active` à NON (défaut), aucun dossier n'est traité en indemnisation directe, même avec deux véhicules assurés et un constat ; l'activer sans seuil, sans barème ou sans délai renseignés est refusé.
- Avec le modèle activé et renseigné, un dossier de deux véhicules assurés, en dommages matériels, sous le seuil et avec un constat amiable signé est proposé à l'indemnisation directe ; sans constat, ou avec un dommage corporel, il suit le recours ordinaire.

#### FR-120 : L'IA du recours (usage n° 12)

L'IA commune (instance locale, §7.4) assiste le pôle recours sur deux tâches : (1) **évaluer l'offre de l'assureur adverse** ; (2) **rédiger la mise en demeure**. Pour (1), l'entrée est la créance, l'offre reçue, la responsabilité arrêtée et les pièces du dossier ; la sortie est l'écart au réclamé, une appréciation (accord rapide, négociable, à maintenir), les arguments tirés du dossier (responsabilité, expertise, vétusté) et, pour un recours qui ne se rattache pas à un dommage corporel, une **contre-proposition indicative** avec la chance d'accord. Pour (2), l'entrée est la créance et les pièces à joindre ; la sortie est le texte de la mise en demeure, avec la subrogation, le montant, le délai et les pièces. Le destinataire est `GREC`, qui édite, valide et envoie. Garde-fous : l'IA ne décide ni n'envoie rien ; chaque affirmation renvoie à sa pièce ; l'acceptation, la modification ou le rejet de la suggestion sont inscrits au **registre de l'IA** (niveau `ANALYSE` ou `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`) ; si l'IA est coupée, tout le circuit passe ; tant qu'aucun modèle n'existe, la capacité est servie par les règles explicables de la démo et le dit. Elle est servie par l'IA commune.

Les règles de la démo sont les valeurs par défaut : écart à l'offre de 15 % ou moins, accord rapide ; de 15 à 35 %, négociable ; au-delà, maintenir et préparer le contentieux ; contre-proposition égale au plus grand de trois nombres (offre augmentée de 15 %, moyenne de l'offre et du réclamé, 80 % du réclamé). Ces seuils sont des paramètres.

**Conséquences (testables) :**
- Pour une créance de 276 850 FCFA (celle de `SIN-2026-9002`) et une offre de 200 000 FCFA, l'écart affiché est de 76 850 FCFA (environ 27,8 %), l'appréciation est « négociable », et la contre-proposition suit la formule des trois nombres, sans dépasser le montant réclamé.
- Sur un recours rattaché à un dossier corporel, aucune contre-proposition chiffrée n'est proposée ; l'analyse et les arguments restent fournis *(défaut H-089 : garde-fou du PO sur le corporel étendu au recours ; à confirmer)*.
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
- Au passage `REJETE`, le reste à payer passe à zéro. **Au corporel VTM**, un refus de garantie, un classement sans suite ou un rejet **ne remet pas la provision à zéro** tant que l'obligation légale d'offre demeure (art. 237 : « pour le compte de qui il appartiendra *(point juridique J-15 : à valider par le juriste, §13.2)*) : elle est maintenue ou ramenée à l'estimation de l'offre légale, avec motif et visa. **Ailleurs**, la provision est ramenée à zéro, avec motif « refus » et visa, et une ligne d'historique de provision.
- Test : le refus d'un dossier corporel VTM laisse une provision non nulle ; le refus d'un dossier matériel la ramène à zéro. L'état des provisions à payer (FR-189) reprend la provision maintenue.
- La décision de refus par un utilisateur qui a instruit le dossier est refusée (`SEPARATION_DES_TACHES`) : le gestionnaire propose, le responsable décide.
- Un dossier `REJETE` sans courrier de refus envoyé après 2 jours ouvrés est signalé au responsable *(défaut H-090 : 2 jours ouvrés ; la procédure du mémoire de 2014 (zone CIMA) parle de 48 heures pour la décision et 72 heures pour l'information de l'assuré)*. Deux échéances internes s'y ajoutent : la **décision d'exclusion soumise** sous 48 heures ouvrées, et le **courrier de refus sous 72 heures ouvrées**, ou justifier 2 jours ouvrés *(défaut H-091 : procédure du mémoire ; à confirmer à la séance d'immersion)*.
- Un refus de garantie sur un dossier **corporel automobile** ne supprime pas les obligations légales : l'assureur qui invoque une exception de garantie doit tout de même respecter les art. 231 à 236 « pour le compte de qui il appartiendra » (Code CIMA, art. 237, SÛR) ; le dossier garde donc ses échéances d'offre en alerte (§5.14), et, si un fonds de garantie automobile est activé, l'alerte « déclaration au fonds sous 3 mois » (art. 608, SÛR, valable pour l'exception de garantie invoquée ; paramètre `legal.fga_declaration_mois`) `[à vérifier par le juriste : traitement du dossier refusé au corporel]`.
- Un recours ouvert sur un dossier refusé, sans aucun règlement `PAYE`, est proposé à l'abandon au responsable (FR-112, R15) ; il n'est jamais abandonné automatiquement.

#### FR-122 : Le courrier de refus est rédigé par l'IA, relu et signé (usage n° 11)

Le courrier de refus est un **brouillon rédigé par l'IA commune** (usage n° 11), relu et signé par un humain avant tout envoi. L'entrée est la décision de refus, son motif, la garantie visée et la clause de la police opposée ; la sortie est un projet de courrier : exposé des faits, motif, clause, voie de contestation (« une réclamation écrite accompagnée de tout élément nouveau », texte de la démo), nom du gestionnaire et référence du dossier. Le destinataire du brouillon est le signataire (`RESP`, ou `DG` ou `DT` pour un enjeu supérieur au seuil de délégation du responsable, §5.7). Garde-fous : l'IA ne signe ni n'envoie ; chaque motif cité renvoie à sa pièce ou à sa clause ; le brouillon et la version signée sont conservés tous deux ; la suggestion est inscrite au registre de l'IA (niveau `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`) ; si l'IA est coupée, un modèle de courrier à compléter prend sa place. Elle est servie par l'IA commune. Aucun article de loi n'est cité dans le courrier sans qu'il figure au référentiel juridique validé de la compagnie (D21).

**Conséquences (testables) :**
- Un courrier de refus passe `A_IMPRIMER` ou `ENVOYE` seulement après la signature de `RESP`, `DG` ou `DT` ; un courrier non signé reste `BROUILLON`.
- Le courrier mentionne la voie de contestation ; un modèle sans cette mention est refusé à la validation du modèle (`MENTION_OBLIGATOIRE`).
- Sur un dossier corporel automobile, le courrier porte le nom du gestionnaire du dossier (art. 242, SÛR).
- Le registre de l'IA contient l'entrée, la sortie, la confiance, les sources, le niveau, le statut et l'auteur de la décision ; un test de recette rejoue un refus avec chaque statut.
- Aucune donnée médicale n'est lue par la fonction de rédaction ; si le refus s'appuie sur une pièce médicale, le motif est écrit par un humain habilité (`MED`, `RESP`, `DG`, `DT`).
- Le courrier part par un canal qui laisse une preuve (courrier avec accusé, remise en main propre, e-mail avec accusé) ; le canal et la preuve sont enregistrés. Le statut du courrier prend `REMIS` ou `RETOURNE` **avec preuve** ; un courrier `RETOURNE` lève une alerte et n'est pas tenu pour notifié.
- La copie du courrier de refus signé est archivée automatiquement au dossier et au registre unique des courriers sortants (FR-46).

#### FR-123 : Le classement sans suite quand l'assuré est injoignable

Un dossier est classé **sans suite** (`SANS_SUITE`) quand l'assuré (ou la victime) est injoignable après les relances réglementées du FR-143 : au moins 3 relances sans effet, par au moins deux canaux, et 15 jours sans réponse après la dernière *(défaut H-092 : 15 jours après la dernière relance, d'après le texte de la 3e relance de la démo)*. Le classement se fait depuis `PIECES_ATTENDUES`, `EN_INSTRUCTION` ou `OFFRE_ENVOYEE`, par `GEST` ou `RESP`, avec motif. Les relances sont **tracées par le serveur** : l'envoi réel passe par `notification`, et le gestionnaire ne les déclare pas à la main. Au-delà d'un seuil de provision, un **second contrôle du `RESP`** est exigé *(défaut H-093 : 500 000 FCFA ; à confirmer à la séance d'immersion)*. Le classement est visible dans la file du responsable. Un dernier courrier de classement est envoyé à la dernière adresse connue. Au corporel automobile, où l'offre est due « indépendamment de la réclamation de la victime » (Code CIMA, art. 231, SÛR), le classement sans suite exige la décision de `DG` ou `DT` et n'efface pas les échéances légales *(point juridique J-16 : classement sans suite d'un dossier corporel réservé à la direction ; à valider par le juriste)*.

**Conséquences (testables) :**
- Un classement avec moins de 3 relances enregistrées, ou avec 3 relances sur un seul canal, est refusé (`RELANCES_EPUISEES`).
- Un classement sans motif est refusé (`MOTIF_ECRIT`).
- Des relances seulement déclarées par le gestionnaire, sans envoi réel tracé par `notification`, ne comptent pas : le classement est refusé (`RELANCES_EPUISEES`).
- Un classement d'un dossier dont la provision dépasse le seuil est refusé sans second contrôle du `RESP` (`SECOND_CONTROLE_RESP`) ; tout classement apparaît dans la file du responsable.
- Au **corporel VTM**, un classement sans suite ne remet pas la provision à zéro tant que l'obligation légale d'offre demeure (FR-121).
- Un classement sans suite d'un dossier corporel automobile par `GEST` ou `RESP` est refusé (`DECISION_DIRECTION`).
- Au classement (hors corporel VTM, FR-121), la provision du dossier passe à zéro avec motif ; les échéances internes s'arrêtent ; les échéances légales du corporel restent affichées en alerte au responsable.
- Un dossier classé sans suite n'entre pas dans la file « à verser aux archives » avant 30 jours *(défaut H-094 : délai de grâce de 30 jours avant versement, pour laisser l'assuré se manifester)*.
- Le classement est tracé : relances enregistrées (canal, date, résultat), motif, signataire, courrier de classement.

#### FR-124 : Le litige quand l'offre est refusée ou contestée

Un dossier passe en **litige** (`LITIGE`) quand l'assuré refuse l'offre (avec contre-expertise demandée), quand il conteste l'évaluation, ou quand un désaccord de fond oppose les parties. Le passage est décidé par `RESP`, `DG` ou `DT`, depuis `EVALUE`, `EN_VALIDATION` ou `OFFRE_ENVOYEE`, avec motif. En litige, le responsable ou la direction peut **ordonner une contre-expertise** (au sens interne de la compagnie, §5.5) ; le litige se **résout** par un retour à `EN_INSTRUCTION` avec un motif de résolution (rapport retenu, accord trouvé sur le principe, nouvelle évaluation). Une **contre-proposition** de l'assuré à l'offre n'est pas un litige : le dossier revient en `EN_INSTRUCTION` avec motif (§5.7).

**Offre partielle sur la part non contestée (hors corporel).** Quand l'assuré ne conteste qu'une partie de l'évaluation, le `RESP` (ou le `DG`, le `DT`, comme pour la transition 30) peut décider une **offre partielle sur la part non contestée** *(défaut H-281 : voie ouverte hors corporel ; à confirmer à la séance d'immersion et par le juriste)*. Le dossier revient de `LITIGE` à `EN_INSTRUCTION` par la transition 30 existante, avec le motif « offre partielle sur la part non contestée ». La **part contestée** reste inscrite au dossier comme **part contestée** (montant, motif du désaccord) : elle n'est ni payée ni abandonnée. L'offre partielle suit le circuit normal (évaluation, validation, offre « sous réserve de tous droits », accord, ordre). L'**offre définitive** couvre ensuite la part contestée, une fois le désaccord résolu. **Au corporel**, la voie légale reste l'**offre provisionnelle** (art. 233 et suivants). Aucune transition n'est ajoutée : le circuit garde ses **42 transitions**.

**Conséquences (testables) :**
- Un passage en litige sans motif est refusé (`MOTIF_ECRIT`) ; par un rôle autre que `RESP`, `DG` ou `DT`, il est refusé (`DROIT_INSUFFISANT`).
- Un litige est résolu par une transition `LITIGE → EN_INSTRUCTION` avec motif ; sans motif, elle est refusée.
- En litige, aucune nouvelle offre globale ni aucun ordre, acompte compris, n'est possible tant que le dossier reste en `LITIGE` (`ACCORD_ENREGISTRE`, `TRANSITION_INCONNUE`) : la table de FR-135 ne connaît pas de passage de `LITIGE` vers `ORDRE_EMIS` (FR-88).
- Hors corporel, le `RESP` peut décider une offre partielle sur la part non contestée : le dossier repasse `EN_INSTRUCTION` par la transition 30, le motif enregistré est « offre partielle sur la part non contestée », et la part contestée reste inscrite au dossier avec son montant. Au corporel, la même décision est refusée et l'offre provisionnelle est proposée à la place.
- Un `GEST` ne peut pas décider cette offre partielle (`DROIT_INSUFFISANT`) ; une décision sans motif est refusée (`MOTIF_ECRIT`) ; une offre partielle supérieure au montant non contesté est refusée (`MONTANT_VALIDE`).
- Une offre définitive ultérieure couvre la part contestée ; un test vérifie qu'elle porte le montant de la part contestée inscrite.
- Un test compte les transitions de la table : il y en a toujours 42, aucune n'a été ajoutée pour cette offre.
- À l'entrée en litige, la provision est revue avec motif ; un écart de 2 000 000 FCFA ou plus attend le responsable (paramètre, §6.4, FR-188).
- Les échéances légales du corporel continuent de courir pendant le litige ; les suspensions et prorogations légales (expert commun, +1 mois, art. 252 et 252 bis, SÛR) se saisissent à la main et se tracent (§5.14).
- Au corporel automobile, le litige ne peut être porté en justice avant l'expiration du délai d'offre de l'art. 231 (art. 239, SÛR) : le dossier l'affiche.
- Les honoraires d'un conseil mandaté par la compagnie pour le litige sont des règlements de nature `HONORAIRES` (FR-91).

#### FR-125 : La fraude suspectée suspend le paiement sans le dire à l'assuré

Un dossier passe `FRAUDE_SUSPECTEE` quand un humain **signale** une suspicion de fraude : `GEST`, `GREC`, `RESP`, `DG`, `DT` ou `AUD`, avec motif, depuis `DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `EN_INSTRUCTION`, `EVALUE`, `EN_VALIDATION`, `OFFRE_ENVOYEE`, `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `LITIGE` ou `REGLE` (la démo n'offrait que les deux premiers *(défaut H-095 : extension à tous les états non terminaux et à `REGLE`, car une suspicion peut naître à tout moment)*). Les transitions 31 à 36 portent ces départs (FR-135). Dans cet état, aucun geste de paiement n'est possible. Le dossier sort par l'écartement de la suspicion (retour `EN_INSTRUCTION`) ou par la confirmation (passage `REJETE`), décrits aux FR-129 et FR-133. La suspicion n'est **jamais révélée** à l'assuré ni au courtier : les écrans et les messages qui leur sont destinés disent « dossier en cours d'instruction ».

**Conséquences (testables) :**
- Un signalement sans motif est refusé (`MOTIF_ECRIT`).
- Depuis `CHEQUE_A_REMETTRE`, le signalement **suspend la remise** ; un chèque déjà émis d'un dossier devenu `FRAUDE_SUSPECTEE` est **mis en opposition** (état `CHEQUE_EN_OPPOSITION`, FR-101), la comptabilité reçoit l'alerte, et la quittance passe `ANNULEE` quand l'opposition est enregistrée (`OPPOSITION_NON_ENREGISTREE` tant qu'elle ne l'est pas).
- Un signalement est possible depuis `DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `LITIGE` et `REGLE` ; un dossier `REGLE` avec un règlement non encaissé met ce règlement en opposition.
- Dans l'état `FRAUDE_SUSPECTEE`, une demande d'émission, de remise ou de paiement est refusée (`AUCUN_SIGNAL_BLOQUANT`) ; l'accord de l'assuré, s'il est reçu, est enregistré mais ne crée pas d'ordre.
- La vue de l'assuré, le message de suivi, et toute notification externe n'emploient aucun mot qui évoque la fraude ; un test lit chaque modèle de message sortant.
- Les échéances légales du corporel continuent de courir ; elles sont affichées en alerte au responsable et à `AUD`.
- L'accès au contenu de la revue est réservé à `RESP`, `DG`, `DT` et `AUD` ; les autres rôles voient seulement « suspendu ».

#### FR-126 : La réouverture des sorties

Les dossiers `REJETE` et `SANS_SUITE` peuvent être **rouverts** par `RESP`, `DG` ou `DT`, avec motif écrit : sur contestation de l'assuré après un refus (transition 40), ou parce que l'assuré se manifeste après un classement sans suite (transition 41, ajout à la démo *(défaut H-096 : la démo ne rouvre pas SANS_SUITE)*). Le dossier repasse `EN_INSTRUCTION`. Les contestations sont des réclamations (§6.1) rattachées au dossier.

**Conséquences (testables) :**
- Une réouverture sans motif est refusée (`MOTIF_ECRIT`) ; par un autre rôle, elle est refusée (`DROIT_INSUFFISANT`).
- Une réouverture d'un dossier refusé pour garantie exige une nouvelle décision de garantie motivée avant toute évaluation (`GARANTIE_ENGAGEABLE`).
- À la réouverture, la provision est reposée par le gestionnaire avec motif ; le délai interne d'instruction repart d'un nouveau point de départ daté.
- Le courrier de refus initial reste au dossier ; la réouverture crée un courrier d'accusé à l'assuré (§5.15).
- Si le dossier avait été versé aux archives, la sortie de la chemise suit les mêmes règles qu'à FR-107.
- Chaque réouverture figure dans le journal avec son motif ; un dossier rouvert plus de deux fois est signalé à `AUD` *(défaut H-097 : alerte à la 3e ouverture)*.

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

Le **score** d'un dossier est la somme des poids des signaux présents, **plafonnée à 100**. Il se lit en quatre niveaux : `NORMAL` (moins de 20), `ATTENTION` (20 et plus), `SUSPECT` (45 et plus), `BLOQUE` (70 et plus). Les seuils sont des paramètres. À partir de `SUSPECT`, une **revue** est ouverte (FR-129) ; à `BLOQUE`, l'ordre et le paiement sont suspendus (FR-130) *(défaut H-098 : la démo ne dit pas à partir de quel niveau la revue s'ouvre ; SUSPECT par recommandation)*.

**Conséquences (testables) :**
- Des signaux de poids 40, 30 et 30 donnent un score de 100, pas 100 plus 0 : le plafond s'applique ; un test le vérifie.
- Un score de 44 est `ATTENTION`, un score de 45 est `SUSPECT`, un score de 69 est `SUSPECT`, un score de 70 est `BLOQUE`.
- Le niveau et le score sont visibles du gestionnaire, du responsable, de la direction et du contrôle interne ; l'assuré et le courtier ne les voient jamais.
- L'écran explique le score : la contribution de chaque signal, la date du calcul, l'historique des scores du dossier.
- Un dossier `NORMAL` ou `ATTENTION` n'ouvre pas de revue ; le niveau `ATTENTION` s'affiche en bandeau discret sur la fiche.

#### FR-129 : La revue humaine est obligatoire et motivée

La revue de fraude suit `NON_REVU → EN_REVUE → ECARTE | CONFIRME`. Un dossier `SUSPECT` ou `BLOQUE` entre en `NON_REVU` dans la file du contrôle interne. Un relecteur (`AUD`, `RESP`, `DG` ou `DT`) **prend** la revue (`EN_REVUE`). `AUD` rend un **avis écrit**, visible et **obligatoire avant toute confirmation** ; il ne conclut pas. La revue conclut : **écarter** (`RESP`, `DG`, `DT`) ou **confirmer** (`DG`, `DT`, FR-133), avec une **conclusion écrite**. **Écarter un blocage `BLOQUE`** exige l'**avis écrit d'`AUD`** et un relecteur qui n'a **ni validé, ni affecté, ni siégé au comité** du dossier (ligne 16 de FR-7). Le relecteur n'est jamais le gestionnaire du dossier *(défaut H-099 : séparation du relecteur et du gestionnaire)*.

**Conséquences (testables) :**
- Une conclusion sans texte est refusée (`MOTIF_ECRIT`).
- Une conclusion par le gestionnaire ou le gestionnaire recours du dossier est refusée (`SEPARATION_DES_TACHES`).
- Écarter un dossier `BLOQUE` sans avis écrit d'`AUD` est refusé (`AVIS_AUD_REQUIS`) ; par un relecteur qui a validé, affecté ou siégé au comité de ce dossier, il est refusé (`SEPARATION_DES_TACHES`, ligne 16 de FR-7).
- Un indicateur « blocages levés par le validateur » figure au journal ; sa valeur attendue est zéro.
- Une confirmation par `RESP` ou `AUD` est refusée (`DROIT_INSUFFISANT`) ; un écartement par `GEST` ou `AUD` l'est aussi.
- Un dossier `BLOQUE` non revu depuis plus de 3 jours ouvrés est signalé au responsable et à `AUD` *(défaut H-100 : 3 jours ouvrés)*.
- Une revue `ECARTE` garde ses signaux visibles, avec la conclusion et l'auteur ; elle ne les supprime pas. Un nouvel événement qui change le score d'un niveau ouvre une nouvelle revue.
- Chaque changement d'état de la revue est tracé (auteur, rôle, date et heure, conclusion).

#### FR-130 : Un dossier BLOQUE non écarté suspend l'ordre et le paiement

Tant qu'un dossier `BLOQUE` n'a pas une revue `ECARTE`, le serveur refuse : la validation et l'envoi de l'offre (transition 10), l'enregistrement de l'accord qui crée l'ordre (14), l'émission du règlement (17, 18) et la remise ou la confirmation du paiement (20). L'instruction (pièces, expertise, évaluation) continue. Le blocage ne se contourne ni par un écran ni par un cumul de rôles. **Au corporel VTM**, un signal n'est pas un blocage sans **décision humaine sous délai** : la revue est menée sous N jours ouvrés (défaut 3 *(défaut H-101 : 3 jours ouvrés ; à confirmer à la séance d'immersion)*), sinon le dossier est **escaladé au `DG` et à `AUD`**. Un blocage de plus de N jours avant l'échéance légale d'offre est escaladé de la même façon, et la **décision** (laisser courir la pénalité, adresser une offre motivée, ou une offre sous réserve) est **enregistrée** avec son motif.

**Conséquences (testables) :**
- Chacune des transitions 10, 14, 17, 18 et 20 d'un dossier `BLOQUE` non écarté est refusée avec le code `AUCUN_SIGNAL_BLOQUANT` et le message « Dossier suspendu par le contrôle interne ».
- La levée du blocage n'est possible que par une revue `ECARTE`, rendue avec l'avis écrit d'`AUD` (FR-129) ; ni `RESP`, ni `DG` ne peuvent forcer une transition sans elle.
- Au corporel VTM, un dossier dont la revue n'est pas conclue au bout de 3 jours ouvrés est escaladé au `DG` et à `AUD` ; un blocage de plus de 3 jours ouvrés avant l'échéance légale d'offre est escaladé de même, et la décision prise (pénalité qui court, offre motivée, offre sous réserve) est enregistrée.
- Le gestionnaire voit « dossier suspendu » sans voir le détail de la revue ; la comptabilité voit l'ordre suspendu et sa raison générique.
- Un dossier devenu `BLOQUE` après l'émission d'un chèque **suspend la remise** et met le chèque en opposition (état `CHEQUE_EN_OPPOSITION`, FR-125, FR-101) ; la quittance passe `ANNULEE` quand l'opposition est enregistrée.
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

L'IA commune (instance locale) construit pour chaque dossier un **graphe de liens** avec les autres dossiers du portefeuille sur une fenêtre de 12 mois (paramètre). Les entités rapprochées sont : **mêmes témoins**, **mêmes garages** (dont les devis dépassent de plus de 20 % la moyenne du marché, paramètre), **mêmes photos** (empreinte visuelle identique ou proche), **mêmes téléphones**, ainsi que le même véhicule, la même victime sur plusieurs contrats, et le même bénéficiaire ou le même compte de paiement *(défaut H-102 : bénéficiaire et compte de paiement ajoutés aux entités de la démo)*. La sortie est un graphe de dossiers liés avec, pour chaque lien, l'entité commune, un score de lien et la **source** (pièces, journal, portefeuille). Le destinataire est le contrôle interne et le relecteur. Garde-fous : un lien n'est qu'un indice ; le graphe ne modifie pas le score (FR-128) tant que la compagnie n'a pas fixé de poids *(défaut H-103 : les liens nourrissent la revue, pas le score)* ; l'IA ne décide rien ; chaque lien est inscrit au registre de l'IA (niveau `ANALYSE`) ; aucune donnée nominative ni médicale ne sort de l'instance locale ; si l'IA est coupée, les liens exacts (téléphone, immatriculation, compte de paiement) restent servis par des règles explicables, et la comparaison de photos est « indisponible » *(défaut H-104 : la démo simulait l'empreinte de photo ; sans modèle de vision, seule l'identité exacte du fichier est comparée)*.

**Conséquences (testables) :**
- Deux dossiers qui partagent un numéro de téléphone, une immatriculation ou un compte de paiement sont reliés dans le graphe, avec l'entité commune et un lien vers chaque dossier.
- Un lien sans source (pièce ou donnée) n'est pas affiché.
- Un garage dont les devis dépassent de plus de 20 % la moyenne du marché sur au moins 5 dossiers est signalé comme entité partagée *(défaut H-105 : 5 dossiers minimum ; la démo fixe 20 % mais pas le nombre minimum)*.
- Un test rejoue un réseau de trois dossiers (même téléphone, même garage, même photo) et vérifie que le graphe les relie, que le score n'est pas modifié, et que le registre de l'IA contient les trois liens.
- Le graphe n'est lisible que par `AUD`, `RESP`, `DG`, `DT` et le relecteur de la revue en cours ; chaque consultation est journalisée.
- Le graphe ne contient aucun champ de santé.

#### FR-133 : La confirmation de la fraude par la direction ou le contrôle interne

La **confirmation** de la fraude est réservée à `DG` et `DT`, avec une conclusion écrite, après l'**avis écrit de `AUD`** (visible, obligatoire : `AVIS_AUD_REQUIS`). Elle fait passer le dossier de `FRAUDE_SUSPECTEE` à `REJETE` (transition 38), avec un courrier de refus rédigé et signé comme au FR-122. L'écartement (transition 37) renvoie le dossier en `EN_INSTRUCTION`. La fraude confirmée est un motif de conservation longue du dossier (§6.2, décision D17).

**Conséquences (testables) :**
- Une confirmation par `RESP`, `GEST`, `GREC` ou `AUD` est refusée (`DROIT_INSUFFISANT`) ; une confirmation sans avis écrit de `AUD` au dossier est refusée (`AVIS_AUD_REQUIS`).
- Une confirmation sans conclusion écrite est refusée (`MOTIF_ECRIT`).
- À la confirmation, le dossier est conservé comme dossier de fraude (conservation longue), sa provision passe à zéro (sauf au corporel VTM tant que l'obligation légale d'offre demeure, FR-121), et le responsable de la lutte contre le blanchiment est alerté pour décider d'une déclaration de soupçon (règlement CIMA n° 0004, art. 14 et 15, SÛR) ; Prospera n'envoie aucune déclaration lui-même.
- Si de l'argent a déjà été versé, le dossier porte une alerte « indu à examiner » pour `RESP` et `DG` ; Prospera n'ouvre pas de créance sur l'assuré *(défaut H-106 : la récupération d'un indu est **hors périmètre**, dite au §10.2 avec un **responsable désigné** ; à traiter à la séance d'immersion)*. Un chèque déjà émis est mis en opposition (FR-101, FR-125).
- Le refus qui suit la confirmation est écrit avec le **vrai motif juridiquement exigé**, ou suit une procédure d'information définie par le juriste ; il n'est plus écrit sans le mot fraude par défaut *(point juridique J-17 : à valider par le juriste, §13.2)*. Les messages de la **suspicion** (FR-125) restent sans le mot fraude.
- Un écartement garde la conclusion et ne supprime ni le score ni les signaux ; un nouveau signal du même type n'ouvre pas de revue tant que le score n'a pas changé de niveau.

### 5.13 La machine à états complète du dossier

Cette section rassemble la **machine à états du dossier sinistre** : les 11 statuts, les 4 sorties, les 42 transitions, les conditions qui les gardent et les rôles qui les déclenchent. Elle réécrit les 31 transitions de la démo sur les 11 statuts du circuit de référence (décision D5), avec les changements de l'offre et de l'accord (D6), du recours en parallèle (D10) et des règlements multiples (D11). Les sections 5.2 à 5.12 décrivent le contenu de chaque geste ; cette section est la **table de vérité** que le serveur applique. En cas d'écart entre une phrase d'une autre section et cette table, la table fait foi.

#### FR-134 : Les statuts du dossier

Le dossier est toujours dans **un seul** statut. Onze statuts forment le circuit nominal, quatre sorties s'y ajoutent. Un statut est dit **terminal** quand il n'a pas d'autre sortie que la réouverture.

| Statut | Phase | Sens | Terminal |
|---|---|---|---|
| `DECLARE` | 1 Déclarer | la déclaration est enregistrée, la référence de déclaration est attribuée, le doublon est contrôlé | non |
| `PIECES_ATTENDUES` | 2 Ouvrir | le dossier existe, il manque au moins une pièce obligatoire ; l'assuré est relancé | non |
| `OUVERT` | 2 Ouvrir, 3 Attribuer | recevabilité contrôlée, pièces complètes ; le responsable désigne qui instruit | non |
| `EN_INSTRUCTION` | 4 Instruire | un gestionnaire instruit : pièces, responsabilité, missions d'expertise ou accord sur devis | non |
| `EVALUE` | 5 Chiffrer | le décompte est arrêté (dommage, vétusté, règle proportionnelle, plafond, franchise) | non |
| `EN_VALIDATION` | 6 Décider | la décision attend les signatures de la délégation | non |
| `OFFRE_ENVOYEE` | 6 Décider | l'offre validée est partie chez l'assuré ; on attend son accord | non |
| `ORDRE_EMIS` | 7 Payer | l'accord est enregistré, l'ordre de règlement est créé (« différé » jusqu'à la fin du délai de dénonciation au corporel VTM), la comptabilité n'a pas fini | non |
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

Voici **les 42 transitions** autorisées, et toutes. La transition 10 est présentée sur **deux lignes** (10a, la validation selon la délégation ; 10b, l'envoi de l'offre) pour que la séparation soit testable : elle reste **une** transition, et le nombre de transitions reste 42. Les rôles sont ceux du PRD (§2) ; « comité » est l'instance de la matrice de délégation, pas un rôle (§5.7). Une transition absente du tableau est interdite.

| # | Depuis → vers | Libellé | Rôle(s) | Conditions | Motif obligatoire |
|---|---|---|---|---|---|
| 1 | `DECLARE → OUVERT` | Ouvrir et orienter vers le volet | ACC, GEST, GREC, RESP | `PIECES_COMPLETES` ; `CONTRAT_VERIFIE` produit une réserve, jamais un blocage (FR-41) | non |
| 2 | `DECLARE → PIECES_ATTENDUES` | Ouvrir en attente de pièces | ACC, GEST, GREC, RESP | aucune ; `CONTRAT_VERIFIE` produit une réserve, jamais un blocage (FR-41) | non |
| 3 | `PIECES_ATTENDUES → OUVERT` | Reprendre le circuit : pièces reçues | ACC, GEST, GREC, RESP | `PIECES_COMPLETES` | non |
| 4 | `DECLARE → REJETE` | Refuser : sinistre non garanti (seule la décision `REFUS_DE_GARANTIE` refuse, FR-42) | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 5 | `OUVERT → EN_INSTRUCTION` | Prendre le dossier en instruction (aucune exception : personne ne se l'attribue) | GEST, GREC, RESP | `DOSSIER_AFFECTE` ; si le `RESP` instruit, il ne valide pas et ne siège pas au comité pour ce dossier | non |
| 6 | `EN_INSTRUCTION → PIECES_ATTENDUES` | Demander des pièces complémentaires | GEST, GREC, RESP | — | non |
| 7 | `EN_INSTRUCTION → EVALUE` | Enregistrer l'évaluation au décompte | GEST, GREC, RESP | `PIECES_COMPLETES`, `EXPERTISE_VALIDEE`, `GARANTIE_ENGAGEABLE`, `MONTANT_EVALUE` | non (oui si le montant diffère du chiffrage validé) |
| 8 | `EVALUE → EN_VALIDATION` | Envoyer en validation | GEST, GREC, RESP | `MONTANT_EVALUE` | non |
| 9 | `EVALUE → EN_INSTRUCTION` | Reprendre l'instruction avant validation | GEST, GREC, RESP | — | oui |
| 10a | `EN_VALIDATION` (sans changement de statut) | Valider selon la délégation | RESP, comité, DT, DG selon §5.7 | `VALIDATION_ACQUISE`, `SEPARATION_DES_TACHES`, `CONTROLE_ABSENT` (niveau 1 : contrôle par un second agent fait), `COMPLEMENT_EXPERT_RECU`, `AUCUN_SIGNAL_BLOQUANT` | oui |
| 10b | `EN_VALIDATION → OFFRE_ENVOYEE` | Envoyer l'offre (dispensée si le montant validé est inférieur au montant accepté, FR-99) | GEST, RESP | validation 10a acquise (`VALIDATION_ACQUISE`), `PREUVE_ENVOI_ABSENTE`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 11 | `EN_VALIDATION → EN_INSTRUCTION` | Renvoyer en instruction : réévaluation demandée | RESP, comité, DT, DG | — | oui |
| 12 | `EN_VALIDATION → PIECES_ATTENDUES` | Demander des pièces avant validation | RESP, comité, DT, DG | — | oui |
| 13 | `EN_VALIDATION → REJETE` | Refuser la prise en charge | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 14 | `OFFRE_ENVOYEE → ORDRE_EMIS` | Enregistrer l'accord et créer l'ordre de règlement (« différé » au corporel VTM jusqu'à la date d'éligibilité) | ACC, ou un agent qui n'a ni instruit ni validé (jamais GEST ni RESP, FR-29) | `ACCORD_ENREGISTRE` (pièce originale signée, identité contrôlée), `MONTANT_VALIDE`, `SEPARATION_DES_TACHES`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 15 | `OFFRE_ENVOYEE → EN_INSTRUCTION` | Reprendre : contre-proposition de l'assuré | GEST, RESP | contre-proposition enregistrée | oui |
| 16 | `OFFRE_ENVOYEE → LITIGE` | Constater le refus de l'offre | RESP, DG, DT | refus enregistré | oui |
| 17 | `ORDRE_EMIS → CHEQUE_A_REMETTRE` | Émettre le règlement : chèque | CPT | `DELAI_DENONCIATION_ECOULE` (corporel VTM, transaction), `ORDRE_COMPLET`, `CONTROLE_LBC_FT`, `AUCUN_SIGNAL_BLOQUANT`, `SEPARATION_DES_TACHES` | non |
| 18 | `ORDRE_EMIS → REGLE` | Constater le paiement électronique | CPT lance, `paiement` confirme | `DELAI_DENONCIATION_ECOULE` (corporel VTM, transaction), `QUITTANCE_SIGNEE`, `COORDONNEES_VERIFIEES`, `CONTROLE_LBC_FT`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 19 | `ORDRE_EMIS → EN_VALIDATION` | Rejeter l'ordre : anomalie comptable | CPT | — | oui |
| 20 | `CHEQUE_A_REMETTRE → REGLE` | Constater la remise au bénéficiaire | ACC ; CPT seulement s'il n'a pas émis ce règlement | `DELAI_DENONCIATION_ECOULE` (corporel VTM, transaction), `REGLEMENT_EMIS`, `IDENTITE_RETIRANT`, `QUITTANCE_SIGNEE`, `AUCUN_SIGNAL_BLOQUANT`, `SEPARATION_DES_TACHES` | non |
| 21 | `CHEQUE_A_REMETTRE → ORDRE_EMIS` | Annuler le chèque non retiré et ré-émettre | CPT | `OPPOSITION_NON_ENREGISTREE` (opposition bancaire enregistrée : référence, date ; état `CHEQUE_EN_OPPOSITION`) | oui |
| 22 | `REGLE → CLOTURE` | Clôturer après règlement | GEST, GREC, RESP | `REGLEMENT_REMIS`, `SOLDE_APURE`, `EXPERTISE_VALIDEE`, `RECOURS_QUALIFIE` | oui |
| 23 | `REGLE → EN_INSTRUCTION` | Reprendre après règlement provisionnel | GEST, RESP | règlement provisionnel remis, consolidation attendue | oui |
| 24 | `EN_INSTRUCTION → REJETE` | Notifier un refus de prise en charge | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 25 | `EN_INSTRUCTION → SANS_SUITE` | Classer sans suite | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` (relances tracées par le serveur), `SECOND_CONTROLE_RESP` au-delà du seuil de provision | oui |
| 26 | `PIECES_ATTENDUES → SANS_SUITE` | Classer sans suite : assuré injoignable | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` (relances tracées par le serveur), `SECOND_CONTROLE_RESP` au-delà du seuil de provision | oui |
| 27 | `OFFRE_ENVOYEE → SANS_SUITE` | Classer sans suite : offre sans réponse | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` (relances tracées par le serveur), `SECOND_CONTROLE_RESP` au-delà du seuil de provision, offre sans réponse depuis 30 jours | oui |
| 28 | `EVALUE → LITIGE` | Constater un litige | RESP, DG, DT | — | oui |
| 29 | `EN_VALIDATION → LITIGE` | Constater un litige | RESP, DG, DT | — | oui |
| 30 | `LITIGE → EN_INSTRUCTION` | Litige résolu : reprendre l'instruction | RESP, DG, DT | — | oui |
| 31 | `DECLARE`, `PIECES_ATTENDUES`, `OUVERT` ou `EN_INSTRUCTION → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | GEST, GREC, RESP, DG, DT, AUD | — | oui |
| 32 | `EVALUE` ou `LITIGE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 33 | `EN_VALIDATION → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 34 | `OFFRE_ENVOYEE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 35 | `ORDRE_EMIS → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 36 | `CHEQUE_A_REMETTRE` ou `REGLE` (règlement non encaissé) `→ FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude ; un chèque déjà émis est mis en opposition | idem | — | oui |
| 37 | `FRAUDE_SUSPECTEE → EN_INSTRUCTION` | Écarter la suspicion et reprendre | RESP, DG, DT | revue `ECARTE` ; pour un blocage `BLOQUE`, `AVIS_AUD_REQUIS` et relecteur sans acte sur le dossier (ligne 16 de FR-7) | oui |
| 38 | `FRAUDE_SUSPECTEE → REJETE` | Confirmer la fraude et refuser (le refus porte le vrai motif juridiquement exigé, FR-133) | DG, DT | revue `CONFIRME`, `AVIS_AUD_REQUIS` (avis écrit de `AUD` au dossier) | oui |
| 39 | `CLOTURE → EN_INSTRUCTION` | Rouvrir le dossier | RESP, DG, DT | — | oui |
| 40 | `REJETE → EN_INSTRUCTION` | Rouvrir sur contestation | RESP, DG, DT | — | oui |
| 41 | `SANS_SUITE → EN_INSTRUCTION` | Rouvrir : l'assuré se manifeste | RESP, DG, DT | — | oui |
| 42 | `ORDRE_EMIS`, `CHEQUE_A_REMETTRE` ou `REGLE` (règlement non encaissé) `→ EN_INSTRUCTION` | Transaction dénoncée par la victime dans les 15 jours (départs depuis `CHEQUE_A_REMETTRE` et `REGLE` tant que `DELAI_DENONCIATION_ECOULE` est faux) | GEST, RESP | `DENONCIATION_RECUE` (lettre de dénonciation reçue, versée comme pièce, avec preuve de réception), `AUCUN_REGLEMENT_REMIS` (ou règlement non encaissé) ; les ordres différés et les règlements non remis passent `ANNULE` | oui |

**Correspondance avec les 31 transitions de la démo.** Reprises à l'identique, sur les nouveaux noms de statuts : 1 à 8 de la démo (devenues 1 à 8), 10 à 12 (devenues 11, 12, 13), 15 (devenue 20), 17 à 19 (devenues 24, 25, 26), 22 et 23 (devenues 28, 29), 24 et 25 (devenues 31, 32), 26 à 28 (devenues 37, 38, 30), 30 et 31 (devenues 39, 40). Remaniées : la transition 9 de la démo (valider et émettre l'ordre) est **scindée** en deux, valider et envoyer l'offre (10), puis enregistrer l'accord et émettre l'ordre (14), sur la décision D6 ; la 13 de la démo (émettre quittance et chèque) devient 17 ; la 14 (rejet de l'ordre) devient 19 ; la 16 (clôture) devient 22 avec la condition `RECOURS_QUALIFIE`. **Supprimées** : les 20, 21 et 29 de la démo (passage au recours), le recours étant désormais un suivi parallèle (D10). **Nouvelles** : 9, 15, 16, 18, 21, 23, 27, 33 à 36, 41 et 42 ; la transition 10 est scindée en deux lignes, 10a et 10b *(défaut H-107 : 9, 21, 23, 27, 33 à 36, 41 et 42 sont des ajouts de rédaction pour qu'aucun état n'ait de cul-de-sac et que le paiement puisse être arrêté ; 15, 16 et 18 découlent de D6 et D11)*.

**Conséquences (testables) :**
- Le tableau contient 42 transitions, soit 43 lignes parce que la transition 10 est écrite sur deux lignes (10a et 10b) ; un test de recette les énumère et vérifie, pour chacune, un cas réussi et un cas refusé par condition, la table de test étant **générée à partir du tableau**.
- Toute transition demandée hors du tableau est refusée avec le code `TRANSITION_INCONNUE` ; la réponse nomme le statut courant et les transitions possibles pour le rôle.
- Une transition demandée par un rôle absent de sa ligne est refusée (`DROIT_INSUFFISANT`), même si le même utilisateur a un autre rôle qui y serait autorisé et qu'il n'agit pas sous celui-ci.
- Une transition marquée « motif obligatoire » sans motif de 10 caractères au moins est refusée (`MOTIF_ECRIT`).
- Un dossier `OUVERT` jugé non garanti passe par `EN_INSTRUCTION` avant d'être refusé : le refus depuis `OUVERT` n'existe pas, car personne n'a encore la charge du dossier *(défaut H-108 : refus d'un dossier non attribué non prévu ; à confirmer à la séance d'immersion)*.
- Les transitions 14, 17, 18 et 20 sont refusées si le montant de l'ordre n'est pas celui de l'accord (`MONTANT_VALIDE`).
- Les transitions 17, 18 et 20 sont refusées pour tout dossier corporel VTM dont l'accord est une transaction tant que `DELAI_DENONCIATION_ECOULE` est faux ; un test par moyen de paiement (chèque, virement, paiement mobile) vérifie le refus du jour 1 au jour 14 et l'acceptation au jour 16.
- Les lignes 10a et 10b sont testées séparément : la validation sans l'envoi ne change pas le statut ; l'envoi sans validation acquise est refusé (`VALIDATION_ACQUISE`) ; au niveau 1, la validation sans contrôle par une troisième personne est refusée (`CONTROLE_ABSENT`).
- La transition 14 par `GEST` ou `RESP` est refusée (`DROIT_INSUFFISANT`) ; par un agent qui a instruit ou validé, elle est refusée (`SEPARATION_DES_TACHES`).
- Aucun acompte n'est émis depuis `LITIGE` : il n'existe pas de transition de `LITIGE` vers `ORDRE_EMIS`. La part non contestée, hors corporel, suit la voie de FR-124 : retour `EN_INSTRUCTION` (transition 30) avec le motif « offre partielle sur la part non contestée ». Le circuit garde ses 42 transitions.

#### FR-136 : Les conditions nommées et leur texte

Chaque condition a un **code** et un **texte** que le serveur renvoie tel quel à l'utilisateur ; le **code de refus** est le nom de la condition non remplie. Le texte reprend ceux de la démo et les complète. Les écrans affichent aussi les actions **fermées** avec ce texte (« vous ne pouvez pas évaluer parce qu'il manque le rapport de police »).

| Code | Texte opposé à l'utilisateur | Définition |
|---|---|---|
| `PIECES_COMPLETES` | Toutes les pièces obligatoires doivent être reçues. | aucune pièce obligatoire au statut « attendue » ; une pièce « en contrôle » est « attendue » tant que le contrôle humain n'a pas rendu la pièce « reçue » (FR-145) |
| `CONTRAT_VERIFIE` | La police doit être en vigueur à la date du sinistre. | police en vigueur et date du sinistre entre prise d'effet et échéance, d'après la dernière lecture du logiciel de la compagnie (date affichée) ; **produit une réserve, jamais un blocage** (au corporel VTM : art. 210, FR-41) ; une projection périmée est « à relire », jamais un refus |
| `GARANTIE_ENGAGEABLE` | La garantie doit être acquise, ou une décision motivée enregistrée. | garantie acquise, ou décision `GARANTIE_ACQUISE`, `SOUS_RESERVE` ; un `REFUS_DE_GARANTIE` la ferme (jamais sautée, D4) |
| `DECISION_GARANTIE` | Une décision de garantie motivée est requise. | décision `REFUS_DE_GARANTIE` enregistrée avec motif |
| `DOSSIER_AFFECTE` | Le dossier doit avoir été attribué à un gestionnaire par l'encadrement. | gestionnaire désigné par `RESP` ; l'accueil n'attribue jamais ; aucun gestionnaire ne se l'attribue (aucune exception) |
| `EXPERTISE_VALIDEE` | Toute expertise ouverte doit avoir rendu son rapport et être validée. | toutes les missions non annulées sont validées ou arbitrées, évalué sur la machine unique des missions (FR-61) |
| `COMPLEMENT_EXPERT_RECU` | Un complément demandé à l'expert n'est pas revenu. | aucun complément en attente, sauf passage outre du `RESP` avec motif (D15) |
| `MONTANT_EVALUE` | Saisissez le montant arrêté au décompte. | montant évalué supérieur à zéro |
| `VALIDATION_ACQUISE` | La validation exigée par la délégation n'est pas complète. | signatures du niveau requis par le cumul anti-fractionnement : montants acceptés et ordonnés non annulés, plus le montant en cours de validation (§5.7) |
| `CONTROLE_ABSENT` | Le contrôle par un second agent n'est pas fait. | au niveau 1, un contrôleur distinct de l'instructeur et du validateur a enregistré son contrôle (FR-78) |
| `MONTANT_VALIDE` | Le montant dépasse le montant validé. | montant du règlement ou de l'ordre inférieur ou égal au validé |
| `SEPARATION_DES_TACHES` | Celui qui instruit ne valide pas ; celui qui décide ne paie pas. | l'utilisateur n'est pas « partie » par une fonction incompatible sur ce dossier (SEP-01, SEP-02 ; FR-7, FR-29), y compris : instruire et enregistrer l'accord, valider et enregistrer l'accord, émettre et faire signer la quittance |
| `AUCUN_SIGNAL_BLOQUANT` | Dossier suspendu par le contrôle interne. | aucun dossier de fraude `BLOQUE` sans revue `ECARTE` |
| `ACCORD_ENREGISTRE` | L'accord de l'assuré n'est pas enregistré. | accord enregistré par un tiers (`ACC` ou agent non partie), rattaché avec sa pièce originale signée, son contrôle d'identité et son montant (§5.8, FR-86, FR-90) |
| `DELAI_DENONCIATION_ECOULE` | Le délai de dénonciation de 15 jours n'est pas écoulé. | date d'éligibilité atteinte : date de conclusion de la transaction plus 15 jours, calculée et non modifiable ; garde l'émission (transitions 17, 18, 20) pour tout dossier corporel VTM dont l'accord est une transaction (FR-86) |
| `OPPOSITION_NON_ENREGISTREE` | L'opposition bancaire doit être enregistrée avant d'annuler ou de remplacer ce chèque. | opposition enregistrée (référence, date) ; chèque à l'état `CHEQUE_EN_OPPOSITION` (transition 21, FR-101) |
| `SECOND_CONTROLE_RESP` | Un second contrôle du responsable est exigé pour ce classement. | au-delà du seuil de provision (500 000 FCFA, paramètre), second contrôle du `RESP` enregistré (FR-123) |
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

**Codes de refus propres à une fonction.** Les codes suivants sont cités par les sections du circuit et des modules ; ils s'ajoutent à la liste ci-dessus, avec les mêmes règles (le serveur renvoie le code et le texte tels quels ; un code ne change jamais de sens ; la FR indiquée porte la règle).

| Code | Texte opposé à l'utilisateur | Défini en |
|---|---|---|
| `STATUT_INCONNU` | Ce statut n'existe pas. | FR-134 |
| `NUMERO_OFFICIEL_DEJA_ATTRIBUE` | Ce numéro de sinistre est déjà porté par un autre dossier. | FR-37, FR-199 |
| `PREJUDICE_NON_ETABLI` | Un refus fondé sur le retard exige de consigner le préjudice subi. | FR-43 |
| `GARANTIE_ACQUISE_AVEC_BLOCAGE` | La garantie ne peut pas être déclarée acquise tant qu'un blocage n'est pas levé. | FR-42 |
| `MENTION_LEGALE_ABSENTE` | Le modèle corporel doit porter les mentions légales exigées. | FR-46, FR-82 |
| `MENTION_OBLIGATOIRE` | Le modèle de courrier doit porter la mention de la voie de contestation. | FR-122 |
| `RELANCE_TROP_PROCHE` | Une relance a déjà été faite à cet interlocuteur sur ce sujet depuis moins de 5 jours. | FR-47, FR-143 |
| `RELANCE_INCOMPLETE` | Une relance exige un canal, un destinataire et une date. | FR-143 |
| `VOLET_INCOMPATIBLE` | Ce dossier n'est pas du volet de ce gestionnaire. | FR-50, FR-52 |
| `CIBLE_IDENTIQUE` | Le dossier est déjà affecté à cette personne. | FR-51 |
| `ALERTE_BLOQUANTE_NON_LEVEE` | Une alerte bloquante doit être levée, avec un motif, avant l'évaluation. | FR-55 |
| `PIECES_NON_NOMMEES` | Nommez les pièces demandées. | FR-57 |
| `MISSION_DEJA_OUVERTE` | Une mission couvre déjà ce besoin. | FR-58 |
| `SEUIL_ACCORD_SUR_DEVIS_DEPASSE` | Le montant dépasse le seuil de l'accord sur devis. | FR-59 |
| `CONTROLE_DEVIS_ABSENT` | Le devis doit être contrôlé avant d'être retenu. | FR-59 |
| `VOIE_RAPIDE_FERMEE` | Une condition de la voie « accord sur devis » manque (nommée dans le message). | FR-59 |
| `CUMUL_ACCORD_DEVIS_DEPASSE` | Le cumul des accords sur devis de cette police et de ce véhicule dépasse le plafond de la période. | FR-59 |
| `SUPPLEANCE_NON_DATEE` | Une suppléance exige une date de début, une date de fin, un motif et une personne nommée. | FR-78 |
| `SUPPLEANCE_HORS_DATES` | Cette suppléance n'est pas en cours. | FR-78 |
| `SUPPLEANCE_AU_DELA_DU_DELEGANT` | Une suppléance ne dépasse pas la limite du délégant. | FR-78 |
| `TRANSITION_MISSION_INTERDITE` | Cette étape n'est pas possible depuis l'état actuel de la mission. | FR-61 |
| `EXPERT_NON_ELIGIBLE` | Cet expert n'est pas désignable : agrément échu ou domaine non couvert. | FR-62, FR-178 |
| `EXPERTISE_EXTERNE_IMPOSEE` | Ce dossier impose un expert externe. | FR-62 |
| `CONVOCATION_TROP_TARDIVE` | La convocation à l'examen doit être envoyée au moins 15 jours avant. | FR-63 |
| `QUALIFICATION_NON_VERIFIEE` | La qualification de l'expert médical doit être vérifiée. | FR-63 |
| `PART_TIERS_NON_CHIFFREE` | La part du tiers doit être chiffrée (en pourcentage) pour une responsabilité partagée. | FR-54, FR-64 |
| `CONTRE_EXPERTISE_NON_AUTORISEE` | Une contre-expertise ne peut être confiée ni au cabinet du rapport contesté ni au panel interne. | FR-66 |
| `PIECE_JOINTE_OBLIGATOIRE` | Joignez le rapport reçu du cabinet. | FR-67 |
| `POSTE_HORS_BAREME` | Ce poste ne figure pas dans la liste des préjudices indemnisables. | FR-70 |
| `CONDITION_POSTE_NON_REMPLIE` | La condition de taux de ce poste n'est pas remplie. | FR-70 |
| `TABLE_NON_VALIDEE` | La table du barème n'a pas ses deux saisies concordantes. | FR-70 |
| `SUPPLEMENT_NON_AUTORISE` | Le montant facturé dépasse le montant autorisé sans demande motivée. | FR-72 |
| `MONTANT_INCHANGE` | Le montant révisé est identique au montant actuel. | FR-76 |
| `QUORUM_NON_ATTEINT` | Le comité ne peut pas statuer : quorum non atteint. | FR-79 |
| `TEXTE_ECART_DECOMPTE` | Un montant du texte diffère du décompte. | FR-83 |
| `MENTION_LEGALE_VERROUILLEE` | Les mentions légales du modèle ne se modifient pas. | FR-83 |
| `PREUVE_ENVOI_ABSENTE` | L'envoi de l'offre exige un canal et une preuve. | FR-84 |
| `CANAL_INJOIGNABLE` | Le canal choisi n'a ni numéro ni adresse au dossier. | FR-84 |
| `PARAMETRE_REGLEMENTAIRE` | Un délai légal ne se modifie pas. | FR-85 |
| `DENONCIATION_RECUE` | Joignez la lettre de dénonciation de la transaction. | FR-86, FR-90, FR-135 |
| `AUCUN_REGLEMENT_REMIS` | Un règlement a déjà été remis : la transaction ne peut plus être annulée. | FR-90, FR-135 |
| `AVIS_AUD_REQUIS` | L'avis écrit du contrôle interne est requis avant de confirmer une fraude ou d'écarter un blocage. | FR-129, FR-133, FR-135 |
| `PIECE_ACCORD_ABSENTE` | Joignez la pièce signée qui prouve l'accord. | FR-86 |
| `AUTORISATION_REPRESENTANT_ABSENTE` | Joignez la pièce d'autorisation du représentant du mineur ou de l'incapable. | FR-86 |
| `MONTANT_CONTRE_PROPOSITION_ABSENT` | Indiquez le montant demandé par l'assuré. | FR-87 |
| `HONORAIRES_NON_VISES` | Les honoraires doivent être visés avant l'ordre. | FR-90 |
| `AVIS_TUTELLE` | L'avis au juge des tutelles ou au conseil de famille doit être enregistré au moins 15 jours avant. | FR-91 |
| `BENEFICIAIRE_CONFORME` | Le bénéficiaire n'est ni l'assuré, ni la victime, ni un ayant droit, ni un tiers mandaté. | FR-91, FR-100 |
| `NUMERO_DEJA_UTILISE` | Ce numéro de chèque est déjà utilisé pour cette banque. | FR-94 |
| `POUVOIR_REQUIS` | Joignez la pièce de pouvoir de la personne qui retire le chèque. | FR-97 |
| `PLAFOND_ESPECES` | Le montant dépasse le plafond des règlements en espèces. | FR-98 |
| `ETAT_REGLEMENT` | Cet état du règlement ne permet pas cette action. | FR-99 |
| `BENEFICIAIRE_VERIFIE` | L'identité du bénéficiaire n'est pas vérifiée. | FR-100 |
| `DOUBLON_REGLEMENT` | Un règlement identique existe déjà pour ce bénéficiaire. | FR-100 |
| `MONTANT_RECLAME` | Le montant réclamé dépasse l'indemnité payée multipliée par la part du tiers. | FR-111 |
| `MONTANT_ENCAISSE` | Le montant encaissé dépasse le montant accepté. | FR-113 |
| `AFFECTATION_EQUILIBREE` | La somme des affectations doit égaler le montant encaissé. | FR-117 |
| `ECHEANCE_INCOMPLETE` | Une échéance exige un point de départ et un point d'arrêt. | FR-140 |
| `ECHEANCE_REGLEMENTAIRE` | Une échéance réglementaire ne se modifie pas. | FR-140 |
| `SUSPENSION_NON_MOTIVEE` | Une suspension exige son article, ses dates et son motif. | FR-141 |
| `CANAL_ABSENT` | Aucun canal ni numéro n'est enregistré pour ce destinataire. | FR-146 |
| `FORMULAIRE_SECOURS_DEJA_SAISI` | Ce numéro de formulaire papier de secours est déjà saisi. | FR-34 |
| `REGLEMENT_EN_COURS` | Un règlement est en cours : la fusion des dossiers est refusée. | FR-38 |
| `DELAI_SOUS_PLANCHER_LEGAL` | Ce délai est inférieur au plancher légal (5 jours ouvrés ; 48 heures pour le vol). | FR-43 |
| `TIERS_CONTESTANT` | Un tiers conteste la responsabilité : l'accord sur devis est fermé. | FR-59 |
| `VALIDATION_DESIGNATION_REQUISE` | La désignation de cet expert exige la validation du responsable. | FR-62 |
| `CONTESTATION_INCOMPLETE` | Une contestation médicale exige son auteur et le point contesté. | FR-63a |
| `PERIODE_NON_DATEE` | Un poste d'incapacité exige sa période datée. | FR-70 |
| `AYANT_DROIT_NON_VERIFIE` | La ligne de cet ayant droit n'est pas vérifiée. | FR-70a, FR-91 |
| `PARTS_SUPERIEURES_A_100` | La somme des parts successorales dépasse 100 %. | FR-70a |
| `MONTANT_VALIDE_SUPERIEUR_A_EVALUE` | Le montant validé ne peut pas dépasser le montant évalué. | FR-75 |
| `REPORT_REVUE_INTERDIT` | La revue de provision ne se reporte pas : un délai légal est actif. | FR-76 |
| `COMITE_INCOMPLET` | La liste des membres du comité n'est pas complète (un titulaire et un suppléant par siège). | FR-79 |
| `VISA_DT_INTERDIT` | Le `DT` a voté au comité : le visa est donné par le `DG`. | FR-79 |
| `ASSUREUR_MENEUR_DEJA_DESIGNE` | Un assureur meneur est déjà désigné pour ce dossier. | FR-82 |
| `IDENTITE_SIGNATAIRE_NON_CONTROLEE` | L'identité du signataire de l'accord n'est pas contrôlée. | FR-86 |
| `DOUBLE_ENREGISTREMENT_REQUIS` | Au-dessus du seuil, l'accord se double d'un second enregistrement. | FR-86 |
| `PREUVE_RECEPTION_ABSENTE` | Joignez la preuve de réception par un moyen autorisé. | FR-86, FR-114 |
| `CONFIRMATION_PAIEMENT_REQUISE` | Une nouvelle tentative exige la confirmation de `paiement` et reprend la même clé. | FR-92 |
| `VALIDATION_ORDRE_REQUISE` | L'ordre doit être validé par un second `CPT` (et le `DG` au-dessus du seuil) avant exécution. | FR-93, FR-95 |
| `GABARIT_IMPOSE_AU_CORPOREL` | Le gabarit de lettre-chèque est imposé au corporel. | FR-94 |
| `JUSTIFICATIF_BANCAIRE_ABSENT` | Joignez le justificatif bancaire de ce virement. | FR-95 |
| `CHEQUE_NON_CONFORME_A_L_ORDRE` | Le nom ou le montant du chèque ne correspond pas à l'ordre. | FR-97 |
| `PHOTO_CHEQUE_ABSENTE` | La photo du chèque est obligatoire. | FR-97 |

Les synonymes sont abandonnés au profit des codes du premier tableau : `MOTIF_ECRIT` (et non `MOTIF_OBLIGATOIRE`), `PIECES_COMPLETES`, `DOSSIER_AFFECTE`, `GARANTIE_ENGAGEABLE`, `MONTANT_EVALUE`, `VALIDATION_ACQUISE` (délégation insuffisante, visa du `DT` manquant, fractionnement, décision du `DG` absente, offre sans validation), `AUCUN_SIGNAL_BLOQUANT`, `ACCORD_ENREGISTRE`, `CONTRAT_VERIFIE`, `EXPERTISE_VALIDEE`, `COMPLEMENT_EXPERT_RECU`, `RELANCES_EPUISEES`.

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

Le graphe des transitions est **vérifié automatiquement** : chaque statut non terminal a au moins une sortie, chaque statut est atteignable depuis `DECLARE`, et il existe un chemin nominal de `DECLARE` à `CLOTURE`. Les statuts et les transitions sont **fixes** ; la compagnie règle les seuils, les délégations, les délais et les droits par rôle, dans la limite des séparations de fonctions, mais ne crée pas de statut *(défaut H-109 : statuts et transitions non paramétrables par la compagnie au premier jour ; à confirmer à la séance d'immersion)*.

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
| Dénonciation de la transaction | conclusion de la transaction | expiration du délai | 15 jours | art. 235 (SÛR) | la victime peut dénoncer ; aucun règlement n'est émis avant la fin (`DELAI_DENONCIATION_ECOULE`) |
| Paiement des sommes convenues | fin du délai de dénonciation | dernier règlement `PAYE` | 1 mois | art. 235 (SÛR) | intérêt de 5 % par mois (art. 236, SÛR) |
| Pénalité d'offre tardive | échéance de l'offre dépassée | offre envoyée | 5 % par mois de retard | art. 233 (SÛR) | calcul affiché, libellé « estimation, base non validée » ; réduction motivée par `RESP` |
| Procès-verbal d'accident corporel | date de l'accident | procès-verbal reçu | 3 mois | art. 230 (SÛR) | nature « suivi » : ce n'est pas un délai réglementaire opposable à la compagnie ; alerte au gestionnaire |

À ces échéances s'ajoutent les **suspensions et prorogations** que le dossier doit pouvoir tracer : assureur non avisé de l'accident dans le mois (art. 247) ; décès de la victime plus d'un mois après l'accident (art. 248, délai prorogé du temps écoulé) ; pièces demandées non reçues dans les 6 semaines (art. 249 et 250) ; réponse incomplète, nouvelle demande dans le mois (art. 251) ; refus d'examen médical ou contestation du médecin, expert commun, un mois de plus (art. 252 et 252 bis) ; victime résidant à l'étranger, un mois de plus (art. 253) ; tous SÛR. Quand un **fonds de garantie automobile** est activé pour le pays (FR-111), s'ajoutent : transmission du procès-verbal dans les 60 jours (art. 606), notification d'une transaction avec un responsable non assuré dans le mois (art. 605), tous SÛR. La déclaration au fonds dans les 3 mois (art. 608, SÛR) ne vaut que pour l'**exception de garantie invoquée** (FR-121) ; le paramètre s'appelle `legal.fga_declaration_mois`. L'arbitrage entre assureurs (sentence dans le mois de la saisine, art. 276, SÛR) suit les recours (FR-119). La **base de calcul** de la pénalité de 5 % (indemnité totale, solde ou montant offert) est le paramètre `penalite.base`, défaut « montant de l'offre » ; elle est un point de revue du juriste, et l'affichage porte le libellé « estimation, base non validée » (FR-85).

**Conséquences (testables) :**
- Un dossier corporel automobile ouvert affiche, dès l'ouverture, la date limite de l'offre : accident plus 12 mois, ou décès plus 8 mois pour un décès.
- Un dossier corporel dont la consolidation n'est pas connue à 6 mois de l'accident reçoit une alerte « offre provisionnelle possible » ; l'information de consolidation enregistrée ouvre l'échéance de l'offre définitive à 6 mois.
- Un dossier dont l'offre légale est dépassée affiche la pénalité cumulée (5 % de l'indemnité par mois de retard) et le motif de réduction éventuel saisi par `RESP`.
- Une suspension saisie avec son article, ses dates et son motif décale l'échéance ; sans article, elle est refusée (`SUSPENSION_NON_MOTIVEE`).
- Pas de suspension si aucune nouvelle demande n'est faite dans les 15 jours après une réponse incomplète reçue dans les 6 semaines (art. 251) ; avec une nouvelle demande dans ce délai, le délai est suspendu.
- Le suivi du procès-verbal d'accident corporel (3 mois, art. 230) part de la date de l'accident et s'arrête à la réception du procès-verbal ; sa nature est « suivi », il n'apparaît pas comme échéance réglementaire opposable.
- Les échéances de paiement légales (un mois) et internes (72 heures ouvrées) partent de la fin du délai de dénonciation au corporel VTM.
- Les échéances ne s'appliquent pas à un dossier matériel ou de risques divers ; un test vérifie qu'un dossier de dommages aux biens n'affiche aucune échéance de ce tableau.
- Un dossier jugé sous une version antérieure du référentiel garde ses échéances d'origine (sinistre survenu avant la date d'effet de la nouvelle version).

#### FR-142 : Les échéances internes, le matériel et les autres branches

Les échéances **internes** de la compagnie sont des paramètres : leurs valeurs par défaut viennent de la démo et du mémoire d'audit de 2014 (procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA), à confirmer pour le Togo). Les délais d'**offre** et de **règlement** par volet de la démo sont conservés comme délais internes ; au corporel automobile, la loi (FR-141) prime.

| Échéance | Point de départ | Point d'arrêt | Défaut | Conséquence |
|---|---|---|---|---|
| Accusé de réception du dossier complet (dernier recours ; l'accusé de déclaration est immédiat, FR-36) | déclaration enregistrée | dossier ouvert (transition 1 ou 2) | 10 jours | alerte au responsable |
| Numéro de sinistre officiel | déclaration envoyée au logiciel de la compagnie | numéro reçu ou saisi | 1 jour ouvré | alerte au responsable (D3) |
| Offre (interne, par volet) | dossier complet (dernière pièce obligatoire reçue) | offre envoyée (transition 10) | corporel 90 j, matériel 60 j, autres 75 j | alerte jaune à 85 %, rouge au dépassement |
| Offre validée envoyée | dernière signature de la délégation | offre envoyée | 48 heures ouvrées | alerte au gestionnaire et au responsable |
| Offre sans réponse (relance) | offre envoyée | réponse enregistrée | 15 jours | relance de l'assuré |
| Offre sans réponse (alerte) | offre envoyée | réponse enregistrée | 30 jours | alerte au responsable ; proposition de classement sans suite |
| Paiement (cible) | accord enregistré ; au corporel automobile, fin du délai de dénonciation de 15 jours | dernier règlement `PAYE` | 72 heures ouvrées | alerte comptabilité et responsable (§5.8, FR-102) |
| Clôture après le dernier règlement | dernier règlement `PAYE` | dossier clos (transition 22) | 15 jours | indicateur « clôture en retard » *(défaut H-110 : 15 jours ; à confirmer à la séance d'immersion)* |
| Honoraires d'expert payés | rapport reçu | règlement d'honoraires `PAYE` | 30 jours (un mois) | alerte à la comptabilité *(défaut H-111 : 30 jours ; à confirmer à la séance d'immersion)* |
| Décision d'exclusion soumise | refus envisagé | décision soumise au `RESP` | 48 heures ouvrées | alerte au responsable (FR-121) *(défaut H-112 : procédure du mémoire)* |
| Courrier de refus | décision de refus | courrier de refus envoyé | 72 heures ouvrées, ou justifier 2 jours ouvrés | alerte au responsable (FR-121) |
| Règlement (limite interne) | accord enregistré | dernier règlement `PAYE` | corporel 45 j, matériel 30 j, autres 30 j | alerte rouge |
| Délai de traitement (SLA) par volet | déclaration enregistrée | statut `REGLE`, `REJETE` ou `SANS_SUITE` | corporel 45 j, matériel 21 j, risques divers 30 j, recours 90 j | indicateur et alerte |
| Chèque non retiré | émission du chèque | remise ou annulation | relance 7 j, circulation longue 21 j, exposition 30 j | liste d'appels, alerte, état (§5.8, FR-101) |
| Versement aux archives | clôture | versement | 75 jours | alerte au responsable (§5.9) |
| Relance du recours | envoi de la lettre ou de la dernière relance | réponse du débiteur | 15 jours | liste « à relancer » (§5.10) |
| Prescription du recours | date du sinistre | recours terminé | 730 jours, alerte à 90 j | alerte, terme à vérifier (FR-118) |
| Rapport d'expert | mission acceptée, éléments transmis | rapport reçu | selon le domaine (§5.5) | alerte au gestionnaire |

**Conséquences (testables) :**
- Le délai de traitement du volet recours (90 jours) se compte depuis la déclaration, comme les autres volets *(défaut H-113 : la SPEC ne définit ni départ ni arrêt du délai cible ; départ à la déclaration, arrêt à REGLE, REJETE ou SANS_SUITE)*.
- Chaque ligne du tableau est un paramètre de la compagnie, versionné et daté ; un test change chaque valeur et vérifie les jours restants d'un dossier ouvert après le changement.
- L'échéance « offre (interne) » s'arrête à l'envoi de l'offre, non à l'évaluation comme dans la démo ; un test le vérifie.
- Une échéance interne dépassée change la couleur du dossier dans les files et alimente l'indicateur « hors délai » du pilotage.
- Au matériel, un dossier ne montre aucune échéance réglementaire ; il montre ses échéances internes et, si le produit le fixe, son délai contractuel (paramétré par produit).
- La cible de 10 jours entre évaluation et paiement de la démo n'est plus reprise : elle est remplacée par la cible de 72 heures ouvrées après l'accord enregistré (au corporel automobile, après la fin du délai de dénonciation de 15 jours).
- Un dossier `REGLE` dont le dernier règlement `PAYE` date de plus de 15 jours sans clôture entre dans l'indicateur « clôture en retard » ; des honoraires d'expert non payés 30 jours après la réception du rapport lèvent l'alerte « honoraires en retard ».
- Les durées de 48 heures, 72 heures et 24 heures des échéances de ce tableau et de FR-84, FR-102 s'écrivent « heures **ouvrées** » partout, selon le calendrier de la compagnie (A-18).

#### FR-143 : Les relances : 5 jours entre deux, 3 sans effet, puis un arbitrage

Une **relance** est un message à un interlocuteur qui doit agir : l'assuré (pièces, accord), un cabinet d'expertise (rapport), un tiers (recours), la comptabilité (paiement). Elle est enregistrée avec son **canal** (appel, SMS, e-mail, WhatsApp, courrier), son destinataire, sa date, son texte, son résultat. **Cinq jours** séparent deux relances d'un même interlocuteur sur le même sujet ; au bout de **trois relances sans effet** (ni réponse, ni pièce reçue), le serveur ne propose plus une relance de plus : il propose un **arbitrage** au responsable (classement sans suite, appel du responsable, courrier recommandé, désignation d'un autre cabinet, mise en demeure). Le recours suit son propre rythme de 15 jours (FR-110). La rédaction des relances est assistée par l'IA commune (usage n° 4, §5.2) ; la relance est **rédigée par l'IA et envoyée en un clic**, ou **envoyée automatiquement à l'échéance** (5 jours entre deux relances, 3 sans effet) *(défaut H-114 : envoi automatique à confirmer à la séance d'immersion)*, et dans les deux cas tracée.

**Conséquences (testables) :**
- Une deuxième relance au même interlocuteur sur le même sujet avant 5 jours est refusée (`RELANCE_TROP_PROCHE`) ; une dérogation motivée de `RESP` est possible.
- Après 3 relances sans effet, le dossier affiche « arbitrage proposé » avec les choix ; il n'offre plus le bouton « relancer ».
- Une relance sans canal, sans destinataire ou sans date est refusée (`RELANCE_INCOMPLETE`).
- Au corporel automobile, la relance de l'assuré porte les mentions de la correspondance exigées par le Code (nom du gestionnaire, rappel des conséquences d'un défaut de réponse, art. 242, SÛR) ; un modèle qui les omet est refusé à sa validation.
- Le compte des relances et leur résultat alimentent la condition `RELANCES_EPUISEES` du classement sans suite (§5.11).
- L'envoi réel de la relance passe par le module `notification` ; une relance « envoyée » sans accusé de transmission du module est marquée « à confirmer ».

#### FR-144 : Les dossiers muets se détectent à 8, 15 et 30 jours

Un dossier non terminal **sans action** depuis 8 jours est « à surveiller », depuis 15 jours « à relancer », depuis 30 jours « muet ». Le point de départ est la dernière **action d'écriture** du dossier (transition, pièce reçue, relance, note, décision) ; une simple **consultation** ne compte pas *(défaut H-115 : la consultation n'interrompt pas le silence, pour qu'elle ne masque pas l'inactivité)*. Le point d'arrêt est l'action suivante. Un agent sans trace d'écriture depuis 10 jours est signalé à son responsable et à `AUD`.

**Conséquences (testables) :**
- Un dossier `EN_INSTRUCTION` sans action pendant 8 jours entre dans la liste « à surveiller » du gestionnaire ; à 15 jours, dans la file du responsable ; à 30 jours, il est « muet » et notifié à `RESP`, `DT` et `AUD`.
- Un dossier `CLOTURE`, `REJETE` ou `SANS_SUITE` n'est jamais muet ; un dossier en attente d'un tiers (assuré, cabinet) est compté muet seulement si la relance de 5 jours (FR-143) n'a pas été faite.
- Les seuils 8, 15 et 30 sont des paramètres ; un test les change.
- La liste des dossiers muets s'exporte avec le gestionnaire, le statut, la date de la dernière action et le tiers attendu.
- Un agent dont aucune action d'écriture n'est tracée depuis 10 jours ouvrés apparaît dans la liste de `AUD` avec son nombre de dossiers en charge.

#### FR-145 : Les pièces bloquantes, et les vues des échéances

La condition `PIECES_COMPLETES` (FR-136) tient une pièce « **en contrôle** » pour **attendue** tant que le contrôle humain de FR-165 n'a pas rendu la pièce « reçue ». Une **pièce bloquante** est une pièce obligatoire qui empêche une transition (l'évaluation, l'envoi de l'offre, l'émission du règlement : un relevé d'identité bancaire illisible bloque le virement, le certificat médical final bloque l'offre au corporel, le procès-verbal fonde le montant). Une pièce bloquante en attente depuis plus de **30 jours** est une alerte au gestionnaire et au responsable, avec proposition de classement sans suite après les relances du FR-143. Le gestionnaire dispose de deux vues : **mes délais** (dossiers groupés par ce qu'il reste avant le terme, la cause, le porteur, le geste à faire) et **mes attentes** (dossiers groupés par tiers attendu : assuré, cabinet d'expertise, comptabilité, responsable).

**Conséquences (testables) :**
- Une pièce obligatoire en attente depuis 31 jours, sur un dossier non terminal, figure dans l'alerte « pièces bloquantes » avec le nom de la pièce, la transition qu'elle bloque et le nombre de relances faites.
- Une pièce obligatoire à l'état « en contrôle » compte comme attendue : `PIECES_COMPLETES` refuse la transition tant que le contrôle humain n'est pas rendu.
- L'alerte « **évaluation incomplète** » (au moins un poste hors corporel à l'état `A_EVALUER`, FR-73) apparaît sur le dossier et dans la corbeille du gestionnaire ; elle ne bloque pas `EVALUE` seule, mais elle est visible du signataire.
- La vue « mes délais » classe un dossier selon son échéance la plus proche, réglementaire ou interne, et affiche la cause du retard et la personne qui détient le geste suivant.
- La vue « mes attentes » regroupe par tiers attendu ; un dossier attendu de deux tiers apparaît dans deux groupes.
- Les deux vues sont filtrées par rôle : `GEST` voit ses dossiers, `RESP` ceux de son service, `GREC` ceux de son pôle ; aucune donnée médicale n'y est lisible par `ACC`.
- Une pièce bloquante > 30 jours est comptée dans l'indicateur de pilotage (§6.7) ; le seuil de 30 jours est un paramètre.

### 5.15 Les notifications et les écrans du circuit

Les notifications sont envoyées par le module partagé `notification` (§7.2) ; les écrans sont ceux de chaque rôle. Les deux obéissent à une règle : **chacun voit ce qu'il doit faire maintenant**, et rien de ce que son rôle n'a pas le droit de lire.

#### FR-146 : Les notifications du circuit

Le circuit émet les notifications suivantes. Le canal par défaut est indiqué ; il se règle par événement dans le module `notification`. Les canaux sont : **cloche** (dans l'application), **e-mail**, **SMS**, **WhatsApp**, **courrier** (papier, avec preuve). Le canal choisi par l'assuré à la déclaration est le canal de ses notifications ; à défaut, le SMS *(défaut H-116 : canal par défaut de l'assuré = SMS)*. Les messages à l'assuré sont en **langage clair, sans jargon CIMA** ; un délai de **première réponse** à l'assuré est suivi, et la **distribution** de chaque message est suivie (accusé de transmission, pli remis ou retourné).

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
| Validation complète, offre à envoyer sous 48 h ouvrées | gestionnaire ; `RESP` en alerte à 24 h *(défaut H-117 : alerte à mi-délai des 48 h ouvrées)* | cloche |
| Offre envoyée | assuré | courrier, e-mail |
| Offre sans réponse à 15 jours | assuré | SMS, e-mail, WhatsApp |
| Offre sans réponse à 30 jours | `RESP` | cloche, e-mail |
| Offre retournée (pli non distribué) ou expirée | gestionnaire ; `RESP` | cloche |
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
- Les modèles de message à l'assuré ne contiennent pas de jargon CIMA (liste de termes interdits, paramétrable) ; un test lit chaque modèle. Le délai de première réponse à l'assuré est mesuré et affiché ; un pli retourné ou un message non distribué lève une alerte au gestionnaire.
- Une notification externe n'est jamais envoyée sans le canal et le numéro enregistrés pour l'assuré ; sinon elle est refusée (`CANAL_ABSENT`) et le dossier entre dans la liste « à contacter autrement ».
- Une notification de relance suit l'intervalle de 5 jours (FR-143) ; une notification de courrier garde sa preuve d'envoi.
- Le module `notification` renvoie l'accusé de transmission ; Prospera l'inscrit au journal du dossier.
- Un destinataire désactivé (rôle retiré) ne reçoit plus la notification ; elle bascule vers `RESP`.

#### FR-147 : La corbeille du gestionnaire et la file du responsable

**Corbeille du gestionnaire (`GEST`).** Le gestionnaire, rattaché à un volet (corporel, matériel, risques divers), voit : **mes dossiers en charge** (corbeille personnelle) ; la **corbeille de service** de son volet (tous les dossiers actifs, sans distinction d'agent : absence, reprise) ; **mes délais** et **mes attentes** (FR-145) ; les dossiers à instruire, les pièces à réclamer, les expertises à suivre, les devis à contrôler, les évaluations à arrêter, les offres sans réponse, les règlements en échec. Chaque ligne montre : numéro de sinistre officiel (ou référence de déclaration), assuré, statut, échéance la plus proche, dernière action. Sur chaque dossier, les gestes **ouverts** s'affichent, et les gestes **fermés** s'affichent aussi avec leur motif de blocage (FR-136).

**Vues complémentaires.** La corbeille offre aussi la **vue par étape** (les 11 statuts), et les vues « **tiers externes** », « **sinistres majeurs** » (FR-57a), « **dommages lourds** » et « **réparations** » (FR-72), chacune filtrée par rôle.

**File du responsable (`RESP`).** Le responsable voit : les dossiers **à attribuer** (statut `OUVERT` sans gestionnaire) et la charge de chaque gestionnaire ; les dossiers **à valider** à son niveau de délégation ; les **blocages** et les **litiges** ; les dossiers **hors délai** ; les dossiers **muets** ; les **offres sans réponse** à 30 jours ; les **honoraires à viser** ; les **provisions** à revoir ; les **recours** à arbitrer ; les **règlements** qui dépassent leur échéance ; les dossiers sans numéro officiel. Il réattribue un dossier avec motif.

**Conséquences (testables) :**
- La vue par étape regroupe les dossiers par chacun des 11 statuts ; la vue « sinistres majeurs » liste les dossiers qui ont franchi le seuil de FR-57a ; les vues « tiers externes », « dommages lourds » et « réparations » ne montrent aucune donnée de santé.
- Un gestionnaire ne voit dans sa corbeille personnelle que ses dossiers ; dans la corbeille de service, que les dossiers actifs de son volet ; il n'ouvre pas un dossier d'un autre volet (`DROIT_INSUFFISANT`).
- Un gestionnaire corporel est le seul, avec `MED`, `RESP`, `DG` et `DT` pour une décision, à lire les pièces de santé ; chaque lecture est journalisée.
- Une action fermée s'affiche avec son motif en clair, « réservée à : responsable, direction » ou « le dossier doit avoir été attribué à un gestionnaire » ; elle n'est pas masquée.
- Le responsable attribue un dossier `OUVERT` à un gestionnaire avec un motif obligatoire ; une réattribution sans motif est refusée (`MOTIF_ECRIT`) ; un responsable ne s'attribue pas un dossier qu'il doit valider seul.
- La file du responsable trie par échéance la plus proche, puis par ancienneté ; un test vérifie l'ordre sur le jeu de démonstration.
- La recherche d'un dossier depuis ces files donne un résultat en moins de 5 secondes au 95e centile (§4.13, FR-23) *(défaut H-118 : volume de dimensionnement de D20)*.

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

**Écarts de source.** Une **file des écarts de source** (numéro reçu du LC pour une `DEC-` déjà numérotée, FR-37 ; autres écarts entre Prospera et le LC) est lisible du `RESP` et de `AUD`.

**Contrôle interne (`AUD`).** Le contrôle interne voit : la **file de revue de fraude** (FR-129, FR-131) ; le **graphe des liens** (FR-132) ; le **plan de contrôle** : séparation des fonctions (SEP-01, SEP-02, SEP-03), décaissements, traçabilité, dossier ; la **piste d'audit** (FR-138) ; les **modifications sensibles** ; les paiements sur dossier `SUSPECT` ou `BLOQUE` non revu ; les concentrations d'émission (FR-100). Il lit presque tout, n'écrit que ses conclusions de revue et ses constats.

**Conséquences (testables) :**
- La file des écarts de source liste chaque écart avec sa nature, sa date, le dossier et le traitement attendu (qui, délai, décision) ; un écart traité en sort avec sa décision au journal.
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
19. **Des transitions ajoutées pour fermer les culs-de-sac** : 9, 21, 23, 27, 33 à 36, 41 et 42 (FR-135).
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
- Sur le jeu de démonstration (environ 3 500 dossiers) et sur le volume de dimensionnement (50 000 dossiers archivés, *(défaut H-119 : volumes de D20, à remplacer par les vrais volumes)*), 95 % des recherches rendent leur résultat en moins de 5 secondes ; la mesure est faite à la recette sur un poste d'accueil. Une cible de moins de 1 seconde est visée *(défaut H-120 : cible du deck, non contractuelle)*.
- Chaque ligne de résultat dit d'où elle vient : « dossier Prospera », « dossier repris », « police du LC seulement » (aucun sinistre encore).
- Une valeur qui correspond à plusieurs objets (une police avec trois sinistres) renvoie les trois, groupés sous la police.
- La **cote physique** s'affiche sur le résultat mais n'est pas un critère de recherche : on retrouve le dossier, puis on lit sa cote.
- On retrouve un dossier archivé par ses **références métier** (nom, sinistre, police, immatriculation) ; **jamais par la cote**, qui sert seulement à localiser le papier.
- Une recherche sans résultat affiche « aucun résultat pour [critère saisi] » et ne propose jamais un dossier au hasard.

#### FR-151 : La recherche tolère les fautes et respecte les droits

La recherche ignore les accents, les majuscules et la ponctuation, et tolère une faute en fin de mot. Elle se restreint par des filtres cumulables. Elle ne montre jamais un dossier que le rôle de l'agent n'a pas le droit de voir.

**Conséquences (testables) :**
- « agbeko », « AGBÉKO » et « Agbéko » renvoient le même dossier ; « agbek » le renvoie aussi (repli par préfixe sur un mot de plus de 3 lettres).
- Chaque mot saisi doit figurer dans le dossier (les mots se cumulent) : « agbéko lomé » ne renvoie que les dossiers qui portent les deux.
- Les filtres sont : volet, étape (11 statuts), gestionnaire, pièces manquantes, hors délai, chèque à remettre, sans gestionnaire.
- Un `GEST` rattaché au volet matériel ne voit pas dans les résultats un dossier du volet corporel, sauf droit de lecture de volet accordé par le `RESP` ; `ACC`, `RESP`, `DG`, `DT`, `AUD` voient tous les volets ; `EXPE` n'a pas la recherche générale : il ne voit que ses missions (§6.3) ; `ADMIN` ne lit aucune donnée métier (D14).
- Une ligne de résultat montre l'étape et la dernière action **sans ouvrir** le dossier.
- Un terme de moins de 3 caractères n'est pas cherché *(défaut H-121 : longueur minimale de saisie = 3, paramètre)*.

#### FR-152 : La fiche « répondre pendant l'appel »

Le dossier a une fiche qui répond, en un écran, aux quatre questions de l'assuré : « Où en est mon dossier ? », « Avez-vous reçu mon document ? », « Quel est le montant prévu ? », « Pourquoi n'est-il pas réglé ? ». La fiche affiche : l'identité (assuré, police, numéro de sinistre officiel, référence de déclaration, numéro d'archivage), **l'étape** (statut et phase), les **pièces reçues et manquantes** (x sur y, avec la liste), les montants **évalué, proposé, validé, payé et reste à payer**, la **dernière action** et la **prochaine** (qui, quoi, pour quand), le gestionnaire et son contact, la **date de dernière lecture du LC**, le téléphone masqué, l'**origine du dossier** (repris par API ou par fichier, ou né dans Prospera) et l'**historique des échanges et des relances** envoyés (relance SMS comprise). La **provision** n'y figure que pour les rôles autorisés (`GEST`, `RESP`, `DG`, `DT`, `CPT`, `AUD`).

**Conséquences (testables) :**
- Les cinq montants sont des champs distincts, jamais additionnés ni confondus ; un montant non encore connu affiche « non encore évalué », jamais zéro.
- Un règlement non émis affiche la raison (« en attente de validation par [niveau] »), lue de l'état du dossier.
- La prochaine action nomme un rôle et une échéance ; un dossier sans prochaine action est signalé en rouge sur la fiche.
- La date de dernière lecture du LC s'affiche sur la fiche ; plus vieille que le double de la fraîcheur par défaut (§6.5), elle est marquée « périmée ».
- `ACC` voit une fiche à lecture limitée (sans provision, sans instruction, sans contenu de pièce médicale) ; la fiche se lit sans changer de page.
- Les valeurs de la fiche sont recalculées à chaque ouverture depuis les données : modifier un montant dans le dossier change la fiche sans autre geste.
- La fiche s'imprime (« Imprimer la fiche »), avec la mention de l'heure d'impression et de l'auteur.
- La fiche dit si le dossier est **repris** (API ou fichier, avec son lot) ou **né dans Prospera** ; l'historique des échanges liste chaque courrier, SMS ou relance envoyé, avec sa date, son canal et son auteur.

#### FR-153 : Téléphone masqué et données de santé protégées

Le téléphone et la pièce d'identité s'affichent masqués. Les données de santé d'une victime (certificat, taux d'incapacité, rapport médical) ne sont lisibles que par les rôles de D14 : `MED`, le `GEST` corporel affecté, `RESP`, et `DG` ou `DT` par un **accès par dossier ouvert à la validation**, journalisé (FR-9). `ACC` et `NUM` voient seulement le **type** et l'**existence** d'une pièce médicale, jamais son contenu. Ces données sont sensibles : la loi togolaise n° 2019-014 les met dans une catégorie à protection renforcée (art. 21 et 22, texte lu).

**Conséquences (testables) :**
- Le téléphone s'affiche avec ses deux derniers chiffres seulement *(défaut H-122 : 2 chiffres visibles, paramètre)* ; le révéler est un geste explicite, qui écrit une ligne au journal (FR-158) ; `ACC` peut le révéler pour rappeler l'assuré.
- `ACC` et `NUM` voient « une pièce médicale est reçue » (type et existence), jamais son contenu ni son nom de fichier : ni aperçu, ni extrait de l'IA, ni résumé.
- Une pièce médicale est classée sous un type « médical » qui ne s'affiche **jamais en aperçu**.
- Un test par rôle sur chaque écran qui touche une pièce médicale (fiche, liste de pièces, lot, résumé, recherche) vérifie que `ACC` et `NUM` ne reçoivent aucun contenu.
- Un `GEST` du volet matériel qui ouvre un dossier corporel voit la fiche sans le contenu médical.
- Chaque lecture d'une pièce ou d'un champ de santé écrit une ligne distincte au journal, avec son auteur (art. 52 de la loi 2019-014 : traçabilité de l'identité des accédants et des données lues).
- Le consentement écrit à l'examen médical et à la communication du rapport est une pièce du dossier (type dédié) ; sa base légale exacte est renvoyée au juriste (D21).
- Base légale : le traitement des données de santé pour indemniser relève de l'**obligation légale** d'offre et de l'**exécution du contrat** ; le consentement est recueilli à la déclaration, mais **son absence ne bloque jamais** une obligation légale (offre, délais) ni le chronomètre *(point juridique J-18 : à valider par le juriste, §13.2)*.

#### FR-154 : Le résumé sourcé du dossier (IA, usage n° 5)

À la demande, l'IA commune résume un dossier en 5 à 6 lignes : survenance, lieu, canal, victime ; étape et ancienneté contre le délai cible ; pièces reçues et manquantes ; montants ; dates limites ; prochaine action. **Chaque phrase renvoie à sa source** : la pièce, la ligne du journal, la règle ou le calcul d'où elle vient. **Entrée** : le dossier et ses pièces lues (§6.2). **Sortie** : le résumé et ses renvois. **Destinataire** : `GEST`, `RESP`, `DG`, `DT` ; une version **sans aucun champ de santé** pour `ACC`, `NUM` et tout rôle hors FR-9. **Garde-fou** : lecture seule ; aucun montant n'est proposé sur un préjudice corporel (D13) ; aucune information sans source ; le résumé est journalisé au registre de l'IA.

**Conséquences (testables) :**
- Un clic sur une phrase du résumé ouvre la pièce, la ligne du journal ou la règle citée ; une phrase sans source n'est pas affichée.
- Le résumé d'un dossier de 40 pages est rendu en moins de 5 minutes *(défaut H-123 : « quelques minutes » de la proposition v2 chiffré à 5 minutes, paramètre)*.
- Le résumé d'un dossier corporel ne contient aucun montant d'indemnité proposé ; les montants qu'il cite sont ceux que le gestionnaire ou le médecin-conseil ont déjà enregistrés, avec leur auteur.
- Le registre de l'IA reçoit une ligne (entrée, sortie, confiance, sources, niveau `ANALYSE`, statut, auteur de la décision) ; l'agent peut marquer le résumé « rejeté » avec un motif.
- IA commune coupée : la fiche (FR-152) reste complète ; le résumé affiche « non installé » ou est remplacé par un résumé par règles, qui le dit.
- Le résumé **exclut les champs de santé** (gravité, lésions, taux d'incapacité, texte médical) pour les rôles hors FR-9 ; `DG` et `DT` n'y accèdent que par dossier ouvert à la validation, journalisé.

#### FR-155 : La recherche en langage naturel (IA, usage n° 6)

Un agent peut poser sa question en français, **par écrit** : « Où en est le dossier de M. Agbéko ? », « Quels dossiers auto sont bloqués ? », « Les règlements de plus de 10 millions en attente ». L'IA commune traduit la question en critères visibles (montant, période, ancienneté, volet, branche, étape, gravité, moyen de paiement, indicateur de retard ou de fraude, référence), les affiche pour correction, puis répond par une synthèse chiffrée et des groupes de résultats. **Entrée** : le texte de la question. **Sortie** : critères, synthèse, listes avec renvoi à l'écran qui fait foi. **Destinataire** : tout agent, dans son périmètre. **Garde-fou** : lecture seule ; périmètre du rôle ; si la question n'est pas comprise, la réponse est « je n'ai pas encore de réponse fiable ».

**Conséquences (testables) :**
- Les critères compris s'affichent avant les résultats et se corrigent à la main ; aucun résultat ne dépend d'un critère caché.
- La réponse chiffre ce qu'elle liste : « 23 dossiers, 41 200 000 FCFA » ; le chiffre est identique à celui de l'écran du dossier (une seule source).
- Les catégories cherchées sont : dossiers, assurés, contrats, règlements, recours, pièces, agents, journal ; « agents » et « journal » sont réservés à `RESP`, `DG`, `DT`, `AUD`.
- Chaque groupe de résultats s'exporte en tableur.
- Une question qui dépasse le périmètre du rôle (un `GEST` qui demande les dossiers d'un autre volet) ne renvoie que les dossiers qu'il a le droit de voir, et le dit.
- La saisie vocale n'existe pas ; aucune question n'est transcrite d'un appel (D13).
- La recherche **ne filtre ni ne retourne** aucun champ de santé hors des rôles de FR-9 : « dossiers avec incapacité > 30 % » est refusée à ces rôles, avec le motif.
- Seize questions types de comité de direction, en quatre familles (argent, risque, délais, exploitation), sont proposées comme suggestions *(défaut H-124 : liste de la démo, modifiable)*.

#### FR-156 : Les réclamations des assurés

Une réclamation d'un assuré (ou d'une victime) est une demande enregistrée, rattachée à son dossier. Elle a un accusé de réception, une réponse et une escalade, chacun avec son délai. Une réclamation est **fondée** quand le fait invoqué se vérifie dans le dossier. Les réclamations récurrentes alimentent un plan d'action de la qualité.

**Conséquences (testables) :**
- L'accusé part sous **5 jours**, la réponse sous **30 jours**, l'escalade au-delà de **60 jours** (paramètres, valeurs de la démo, annexe D).
- Une réclamation sans accusé à J+5, sans réponse à J+30, ou encore ouverte à J+60, lève une alerte au `RESP` ; à J+60, l'alerte monte au `DG` *(défaut H-125 : l'escalade monte au DG, à confirmer)*.
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
- Le journal des consultations est conservé 10 ans *(point juridique J-19 : aligné sur le plancher de l'art. 404, à confirmer par le juriste)*.

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
- Un fichier est analysé par un antivirus de la compagnie avant enregistrement *(défaut H-126 : antivirus fourni par la compagnie, à confirmer en séance d'immersion)* ; un fichier détecté est mis en quarantaine, jamais ouvert.
- La liste des types de pièces (constat amiable, déclaration signée, certificat médical initial et final, rapport de police, carte grise, permis, devis, facture, RIB, certificat de décès, photos…) est un paramètre ; ajouter un type n'exige aucune livraison.

#### FR-161 : Une pièce a des versions, jamais écrasées

Une pièce remplacée (meilleur scan, document corrigé, rapport complémentaire) devient une **nouvelle version**. L'ancienne reste conservée et lisible. La version courante est signalée.

**Conséquences (testables) :**
- Déposer un second scan d'une pièce crée la version 2 ; la version 1 reste ouverte par le lien « historique des versions ».
- Chaque version porte son auteur, sa date et le motif du remplacement (obligatoire).
- Une pièce déjà citée par une décision (évaluation, offre, règlement) ne peut pas être supprimée : seule une nouvelle version peut la remplacer.
- Un document officiel complémentaire (procès-verbal, rapport d'autorité) remplace le précédent comme « version actuelle » et conserve la chaîne `document précédent`.
- **Registre des documents officiels** : les procès-verbaux de police et de gendarmerie et les rapports d'autorité sont tenus dans un registre qui porte, pour chacun : le type, l'autorité émettrice, le **statut de vérification** (`RECU`, `A_VERIFIER`, `VERIFIE`, `SOUS_RESERVE`, `REJETE`, `OBSOLETE`), « original » ou « copie », et le **document attendu**, relancé avec une échéance.
- Les **informations clés** d'un document officiel sont affichées comme « **déclarées dans le PV** » ; le registre ne porte **jamais une conclusion de responsabilité**.
- Ces documents servent la preuve du recours (§5.10) et le vol ou l'incendie ; un document attendu non reçu à son échéance remonte dans la file de relance.

#### FR-162 : Les lots de numérisation

L'opérateur de numérisation (`NUM`) numérise par lots : arrivée du lot, numérisation, indexation, contrôle de qualité, archivage. Chaque lot a une référence, une origine, un nombre de documents et de pages, un opérateur et une date. Un lot qui a un problème passe en anomalie, avec son motif.

**Conséquences (testables) :**
- Un lot a un des états `EN_ATTENTE`, `SCAN_EN_COURS`, `INDEXATION`, `CONTROLE_QUALITE`, `ARCHIVE`, `ANOMALIE` ; le passage d'un état à un autre écrit une ligne au journal avec l'opérateur.
- Un lot distingue le **flux courant** (pièces des dossiers vivants) du **flux de reprise** (pièces historiques, §6.8).
- Chaque pièce d'un lot porte son statut OCR (FR-163) ; les pièces à refaire (OCR raté, extraction partielle, pièce rejetée) sont listées sous l'onglet « à refaire » de l'opérateur.
- Les pièces arrivées depuis moins de 48 heures sont mises en avant avec ce qu'elles bloquent (un RIB illisible bloque le virement, un certificat médical final bloque l'offre, un procès-verbal d'expertise fonde le montant).
- Le taux de numérisation du fonds (pièces numérisées sur pièces attendues) est calculé depuis les données (FR-213).
- Un lot n'est jamais fermé tant que l'une de ses pièces n'a pas passé le contrôle de FR-165 ou n'a pas été placée en anomalie.
- Le suivi du lot affiche un compteur « **N lus sur M** » : N pièces lues par l'OCR sur M pièces du lot (FR-165 : le bouton « verser » en dépend).

#### FR-163 : L'OCR est réel, y compris sur les pièces scannées

Toute pièce image ou PDF scanné est lue par un OCR installé chez la compagnie. Une pièce dont la couche texte compte moins de 60 caractères par page est traitée comme une image. Le résultat de la lecture est stocké avec la pièce, jamais à sa place.

**Conséquences (testables) :**
- Une photo ou un scan de constat, de carte grise ou de facture est lu : son texte est cherchable et alimente la lecture de FR-164.
- Une pièce porte un statut de lecture `NON_TRAITE`, `EN_COURS`, `OK`, `PARTIEL` ou `ECHEC` ; une pièce en `PARTIEL` ou `ECHEC` va dans « à refaire » avec la consigne (relancer l'OCR, numériser à nouveau à 300 dpi, saisir à la main).
- La saisie manuelle d'une pièce illisible est possible ; elle est marquée « saisie à la main » et garde sa pièce d'origine.
- L'OCR ne modifie jamais l'image d'origine ; le texte lu est en plus.
- Le seuil de 60 caractères par page est un paramètre (annexe D).
- L'OCR tourne sur le serveur de la compagnie : aucune image ni texte ne sort de l'instance, en particulier aucune pièce de santé (D1).
- Le temps de lecture d'une page est mesuré et affiché dans le suivi du lot ; une page non lue après un délai *(défaut H-127 : 2 minutes par page, paramètre)* passe en `ECHEC`.

#### FR-164 : L'IA lit et classe les pièces (usage n° 2)

L'IA commune lit chaque pièce reçue, en propose le **type**, en extrait les champs utiles (n° de police, immatriculation, n° de sinistre, dates, montants, noms), et propose le dossier et la pièce attendue auxquels elle se rattache. **Entrée** : l'image ou le PDF et le texte lu (FR-163). **Sortie** : type, confiance, champs lus avec leur extrait source, rattachement proposé. **Destinataire** : `ACC`, `NUM`, `GEST`. **Garde-fou** : l'IA propose, l'agent confirme au contrôle de FR-165 ; sous le seuil de confiance, l'agent choisit lui-même ; l'IA ne rejette aucune pièce ; chaque lecture est journalisée au registre de l'IA (niveau `EXTRACTION`).

**Conséquences (testables) :**
- Chaque proposition affiche sa confiance et, pour chaque champ lu, l'extrait de la pièce d'où il vient ; un champ sans extrait n'est pas proposé.
- Une proposition dont la confiance est inférieure au seuil bas (0,60 par défaut *(défaut H-128 : seuils 0,60 et 0,90, paramètres)*) n'est pas pré-sélectionnée ; au-dessus du seuil haut (0,90), elle est pré-sélectionnée et attend quand même la confirmation de FR-165.
- Un type, un rattachement ou un champ corrigé par l'agent est conservé avec la version corrigée ; le registre reçoit le statut `MODIFIEE` et la valeur finale.
- Une pièce médicale est lue et classée dans l'instance ; son contenu, ses champs lus et ses extraits ne sont **jamais affichés** à `ACC` ni à `NUM` (FR-153) : ils voient le type et l'existence seulement.
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
- Le **contrôle de qualité d'une pièce médicale** porte sur la **lisibilité de l'image seulement** (ou il est fait par `ARCH` ou `MED`) : le contrôleur `ACC` ou `NUM` ne reçoit aucun extrait de son contenu (FR-153).
- Le bouton « **verser** » reste **grisé tant qu'une lecture est en cours** sur une pièce du dossier ou du lot ; il affiche « N lus sur M » (FR-162).

#### FR-166 : Les pièces non rattachées ont une file

Une pièce dont la clé de rattachement (numéro de police, numéro de sinistre, référence de déclaration, immatriculation) est illisible, inconnue ou ambiguë va dans la file « à rattacher ». Elle ne bloque rien et n'est jamais perdue.

**Conséquences (testables) :**
- Chaque pièce de la file a un âge, un auteur, une proposition de rattachement (FR-164) et un état.
- Une pièce de la file de plus de 3 jours ouvrés lève une alerte à `NUM` et au `RESP` *(défaut H-129 : 3 jours ouvrés, paramètre)*.
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
- Le **format de chaque numéro** de Prospera est fixé en D.3 (« Formats de numéros ») : `QUI-` (quittance), `ORD-` (ordre de règlement), `REC-` (recours), `CRE-` (créance), `MED-` (mise en demeure), `CTX-` (contentieux), `ENC-` (encaissement de recours), `CRR-` (courrier) et `LM-` (lettre de mission). Chaque préfixe et chaque longueur de séquence sont **paramétrables** *(défaut H-130 : formats de la démo comme défauts ; à confirmer à la séance d'immersion)*.

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

Quand **toutes** les pièces du bordereau sont numérisées, contrôlées et indexées, l'image du dossier est **scellée** : Prospera calcule une empreinte de l'ensemble et l'enregistre avec la date. Le **support de référence** du dossier **ne change pas** : le scellement garantit l'intégrité de l'image ; il ne remplace pas le papier.

**Conséquences (testables) :**
- Une image incomplète n'est pas scellée : le bouton est refusé tant qu'une pièce manque ou est en contrôle.
- Après scellement, toute modification d'une pièce du dossier fait échouer la vérification d'empreinte et le signale ; un ajout se fait par une nouvelle version, qui ouvre un nouveau scellement lié à l'ancien.
- Le support de référence est visible sur la fiche d'archive, à côté de l'état du scellement ; **après scellement, il ne change pas** : le papier fait foi tant que le juriste n'a pas validé la valeur probante de la copie numérisée (FR-172).
- La **valeur probante** de la copie numérisée, l'**horodatage qualifié** et le **recommandé électronique** sont des lignes du §13.2 (revue du juriste).
- La vérification de l'empreinte peut être lancée à tout moment par `ARCH` et `AUD` ; une vérification en échec lève une alerte.
- Les originaux irremplaçables (acte de décès, jugement d'hérédité, procès-verbal, constat signé, quittance acquittée) restent en papier tant que la valeur probante de la copie numérisée n'est pas confirmée par le juriste (D21).
- L'horodatage de scellement par un prestataire qualifié est une option, à valider par le juriste ; elle est décrite à l'addendum.

#### FR-170 : L'archive physique a une cote, une boîte et une chemise de couleur

Le dossier papier a une **cote physique** : local, travée, tablette, boîte, rang. Il est rangé dans une **chemise de la couleur de sa branche**. La cote est portée par la fiche d'archive et par l'étiquette de la chemise.

**Conséquences (testables) :**
- Chaque dossier versé porte l'état de son papier : `EN_RAYONNAGE`, `COMMUNIQUE`, `TRANSFERE_EXTERNE`, `INTROUVABLE`, `DETRUIT`, `JAMAIS_CONSTITUE` ; un changement d'état est tracé.
- Une boîte contient au plus 2 500 pages (paramètre) ; l'archiviste est alerté à l'approche de la limite.
- Les couleurs de chemise par branche sont un paramètre de la compagnie ; Prospera n'en invente aucune *(défaut H-131 : couleurs à fournir par la compagnie)*.
- La dernière vérification physique de chaque boîte est datée ; une boîte non vérifiée depuis plus d'un an *(défaut H-132 : 12 mois, paramètre)* est listée.
- La cote se lit sur la fiche et l'étiquette s'imprime ; la cote ne sert jamais à retrouver un dossier (FR-150).
- L'**étiquette** de la chemise et celle de la boîte portent un **code de lecture** (code-barres ou QR) qui ouvre la fiche d'archive ; la lecture du code à la sortie et à la restitution écrit la ligne de FR-171.
- Les **sous-chemises** (déclaration et correspondances, police, dommages, devis et rapport, règlement) sont un paramètre *(défaut H-133 : si la compagnie les garde ; à confirmer à la séance d'immersion)*.
- Le **coût de numérisation** (45 FCFA la page) est un paramètre de pilotage (D.3), pas une règle du circuit.

#### FR-171 : La sortie et la restitution du papier

Un dossier papier qui sort du local est une **sortie d'archive**, avec un demandeur, un motif et une date de retour attendue. Il est restitué sous 15 jours.

**Conséquences (testables) :**
- Les motifs de sortie sont : instruction, expertise, contentieux, contrôle interne, réclamation, contrôle de la CRCA.
- Une sortie sans demandeur ni motif est refusée ; elle écrit au journal.
- Une chemise non rendue après 15 jours (paramètre) lève une alerte au demandeur et à `ARCH`, puis au `RESP` à 30 jours *(défaut H-134 : 30 jours, paramètre)*.
- Une chemise transmise à un expert externe est une sortie d'archive tracée avec la mission (§6.3) ; c'est la première cause de chemise non restituée.
- La restitution se constate à la remise sur l'étagère ; elle remet l'état du papier à `EN_RAYONNAGE`.
- Un papier sorti n'empêche jamais de lire l'image numérique du dossier.
- La sortie et la restitution se constatent par **lecture du code de l'étiquette** de la chemise (FR-170) ; une lecture sans motif de sortie est refusée.

#### FR-172 : Le papier reste obligatoire (double support)

Le dossier papier est tenu en parallèle du numérique ; le numérique **ne le remplace pas**. **Le papier fait foi tant que le juriste n'a pas validé la valeur probante de la copie numérisée.** Chaque dossier sait à tout moment où est son papier et quel support fait foi.

**Conséquences (testables) :**
- Un dossier n'est pas déclaré « sans papier » : l'état `JAMAIS_CONSTITUE` n'est posé que par décision motivée de `ARCH`.
- La fiche d'archive affiche les deux supports : état papier et état numérique (`ABSENT`, `PARTIEL`, `COMPLET`, `SCELLE`).
- Le papier d'un dossier dont l'image est complète peut sortir du local ; il n'est détruit que dans le cadre de FR-175.
- Les nouvelles pièces reçues sur papier sont scannées par `ACC` ou `NUM` ; les pièces nées numériques (e-mail, rapport d'expert déposé) sont imprimées au dossier papier à la clôture *(défaut H-135 : impression à la clôture, à confirmer en séance d'immersion)*.
- Le stock papier historique n'est pas scanné pour la reprise (D17) ; sa cote est reprise, ses pièces ne sont numérisées que si le dossier est rouvert ou consulté *(défaut H-136 : numérisation à la demande, paramètre)*.

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
- Les durées par nature, valeurs de la démo : sinistre mortel 30 ans, conservation définitive ; corporel 10 ans, conservation définitive ; contentieux, recours ou litige 10 ans, conservation définitive ; fraude suspectée 10 ans, conservation définitive ; pièces comptables (quittances, ordres, chèques) 10 ans. Pour le matériel, les risques divers, le classé sans suite et le refusé, la démo met 5 ans ; **ce défaut est inférieur au plancher** : la valeur de départ de Prospera est 10 ans *(point juridique J-20 : plancher de l'art. 404 appliqué ; les 5 ans de la démo ne s'appliquent que si le juriste le confirme (D21))*.
- Le point de départ de la durée est la date de clôture ; le point de départ exact est confirmé par le juriste *(défaut H-137 : date de clôture)*.
- L'échéance d'un dossier est affichée sur sa fiche d'archive (« à examiner à partir du [date] ») ; un dossier en conservation définitive n'a pas d'échéance.
- La durée de conservation des données personnelles n'excède pas ce qui est nécessaire (art. 53 de la loi 2019-014) : la justification de chaque durée est écrite dans la table des paramètres.

#### FR-175 : Détruire est une décision visée et tracée, jamais un défaut

Aucun dossier, aucune pièce n'est détruit par défaut ni par un automatisme. La destruction d'un papier ou d'un fichier est une **décision visée**, par des personnes nommées, et **tracée**.

**Conséquences (testables) :**
- Un dossier est « destructible » seulement si sa durée de conservation est écoulée **et** que sa nature n'est pas en conservation définitive **et** que son image est scellée ; la liste est proposée par `ARCH`.
- La destruction exige un bordereau de destruction, visé par le `RESP` puis par le `DG` *(défaut H-138 : double visa, à confirmer en séance d'immersion)*, avec la liste des dossiers et la date.
- Aucun bouton « supprimer » n'existe sur une pièce ou un dossier pour aucun rôle, y compris `ADMIN`.
- Un dossier détruit garde son numéro d'archivage, son état `DETRUIT`, la date, les visas et le bordereau ; son numéro n'est jamais réutilisé.
- Une destruction demandée sur un dossier sous contrôle, litige ou sortie d'archive est refusée.

#### FR-176 : Les pièces vivent sur le NAS de la compagnie, sauvegardées chaque jour

Les fichiers sont stockés sur le **NAS** de la compagnie, à côté du serveur applicatif (D1). Aucun fichier n'est stocké ni lu hors du site. Une sauvegarde quotidienne est faite, et la restauration est testée.

**Conséquences (testables) :**
- Une pièce déposée se retrouve après une panne du serveur applicatif (le NAS conserve les fichiers) ; elle se retrouve après la restauration d'une sauvegarde.
- La sauvegarde quotidienne est vérifiée chaque jour ; un échec lève une alerte à `ADMIN`.
- Une restauration est testée au moins une fois avant la mise en service, puis **chaque mois**, comme au FR-236 *(défaut H-139 : test mensuel, paramètre)* ; le compte rendu est conservé. Les compteurs (`DEC-`, numéros de chèque et de quittance) et l'état « restauration en cours : aucune émission » sont ceux de FR-236.
- L'espace disque du NAS est surveillé ; à 80 % d'occupation *(défaut H-140 : 80 %, paramètre)* une alerte part à `ADMIN`.
- Le dimensionnement de départ est de 50 000 dossiers archivés et 1,5 million de pages *(défaut H-141 : hypothèse de D20, à remplacer par les vrais volumes)*.
- Le format d'archive est un format pérenne (PDF/A) *(défaut H-142 : PDF/A, à confirmer)* ; l'image d'origine reste conservée.

---

### 6.3 Experts et intervenants (`expertises`, M29)

**Ce que ça veut dire.** Le circuit des missions d'expertise (suggérer, désigner, transmettre, recevoir, valider, contester) est au §5.5. Cette section décrit **les personnes et les cabinets** qui rendent ces missions possibles : le référentiel des experts, leur agrément, le panel interne, le médecin-conseil, le portail du cabinet externe, la saisie pour un cabinet sans compte, les honoraires, la charge et les délais. Un sinistre appelle autant de missions que de questions distinctes (véhicule, blessures, responsabilité) : chaque mission est autonome, rattachée au même dossier.

#### FR-177 : Le référentiel des experts

Prospera tient la liste des experts et des cabinets que la compagnie peut mandater. Chaque fiche porte : nom, nature (**interne** ou **externe**), cabinet, domaines couverts, zones couvertes, téléphone, e-mail, numéro d'agrément et sa date de fin, mode d'honoraires (salarié, forfait, barème, vacation), tarif de référence, délai de rapport annoncé, capacité, état actif ou inactif avec motif. La liste de départ est celle que la compagnie fournit (liste des experts agréés, §6.8). Prospera tient aussi le **référentiel des garages et prestataires** (agrément, historique de devis) et celui des **assureurs adverses** : l'analyse de devis (FR-60) et le graphe de fraude (FR-132) en dépendent.

**Conséquences (testables) :**
- Un expert se crée, se modifie et se désactive avec un motif ; il ne se supprime pas : ses missions passées restent liées à sa fiche.
- Les domaines sont ceux des missions : auto-matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation ; la liste est un paramètre.
- Le référentiel enregistre la qualification de l'expert ou du médecin (diplôme, inscription, années d'activité), en rapport avec l'art. 272 du Code CIMA (qualification du médecin ou de l'expert technique mandaté ; répertoire tenu par chaque État, texte lu) ; le contrôle exact est renvoyé au juriste (D21).
- Seuls `RESP` et `DT` créent ou désactivent un expert ; `GEST` ne voit que les experts désignables pour son volet.
- Un expert désactivé n'apparaît plus dans la liste de désignation (§5.5) et reste visible dans l'historique.
- Le référentiel des **garages et prestataires** porte : nom, zone, numéro d'agrément et sa date de fin, **historique des devis** (date, dossier, montant, écart à l'expertise) ; le référentiel des **assureurs adverses** porte : nom, contact, délai moyen de réponse. Les deux se créent, se modifient et se désactivent sans suppression, comme un expert.
- Un garage ou un assureur adverse du référentiel est choisi dans la liste de l'analyse de devis (FR-60) et du recours (§5.10) ; le graphe de fraude (FR-132) s'appuie sur eux.

#### FR-178 : Un agrément échu rend l'expert non désignable

L'agrément d'un expert externe a une date de fin. Un agrément échu rend l'expert **non désignable** : le système refuse la désignation, il ne se contente pas de la déconseiller.

**Conséquences (testables) :**
- Une désignation d'un expert dont la date de fin d'agrément est dépassée est refusée avec le motif « agrément échu le [date] ».
- Une alerte part au `RESP` 60 jours avant la fin de l'agrément *(défaut H-143 : 60 jours, paramètre)*.
- Un expert dont l'agrément échoit entre la désignation et le rapport garde sa mission en cours ; une nouvelle mission lui est refusée.
- Prolonger un agrément exige la nouvelle date et la pièce justificative (copie de l'agrément) ; l'action est tracée.
- Prospera ne fixe pas qui est agréé : il applique la liste et les dates de la compagnie ; la réglementation des experts automobiles (agrément, tarifs) n'a pas été trouvée et est renvoyée au juriste (D21).
- Le **contrôle des qualifications** d'un médecin ou d'un expert technique mandaté (art. 272 du Code CIMA) est fait à la désignation et à chaque renouvellement d'agrément ; les **conventions de place** entre assureurs sont une ligne du §13.2 (revue du juriste).
- Une désignation **hors classement** de la liste de désignation (§5.5) exige un motif, lu par `AUD` (FR-62).

#### FR-179 : Le panel interne et le médecin-conseil

La compagnie a des **experts internes** (`EXPI`), avec leurs domaines et leurs zones, et un **médecin-conseil** (`MED`). Ils accèdent au dossier de leurs missions **dans l'application** : il n'y a pas de transmission hors de la compagnie. Ils rédigent leur rapport rubrique par rubrique.

**Conséquences (testables) :**
- Un `EXPI` ouvre seulement les missions qui lui sont confiées et les dossiers de ces missions ; il n'a pas la recherche générale.
- Le `MED` lit les données de santé des dossiers dont il a une mission (D14) ; chaque lecture est journalisée (FR-153).
- Un expert interne ne facture pas d'honoraires (FR-182).
- Le référentiel dit quels domaines et quelles zones le panel interne couvre ; dans le jeu de démonstration : auto-matériel, médical, responsabilité, en zones de Lomé, Tsévié et Aného *(défaut H-144 : jeu de démonstration seulement)*.
- Les règles qui imposent un expert externe (au-dessus d'un seuil, contre-expertise, fraude, contentieux, domaine non couvert) sont au §5.5 ; le référentiel leur fournit les domaines et les zones.
- Un expert interne qui change de rôle perd l'accès à ses missions ouvertes ; elles sont réaffectées avec motif.
- L'expert interne a un écran « **mes visites** » : l'agenda de ses visites (date, lieu, dossier, mission), avec la date de rapport attendue.
- L'expert interne **lit les grilles** (grille de complétude du rapport, FR-64 ; barèmes de référence) depuis l'écran de la mission, sans quitter le rapport.

#### FR-180 : Le portail du cabinet externe

Un cabinet externe qui a un compte (`EXPE`) travaille dans un **portail** qui ne montre **que ses missions**. Il accepte ou décline une mission (le refus a un motif), accuse réception des pièces transmises, programme sa visite, dépose son rapport et enregistre sa note d'honoraires. Il ne voit jamais le portefeuille ni un autre dossier.

**Conséquences (testables) :**
- Le portail liste les missions à accepter, les rapports à déposer, les honoraires et le suivi ; aucune recherche générale n'existe pour `EXPE`.
- Décliner exige un motif ; la mission retourne « à désigner » (§5.5) et le cabinet est exclu de la liste de cette mission, avec son refus conservé.
- Les pièces transmises sont **une liste choisie** par le gestionnaire pour cette mission ; le cabinet n'en voit pas d'autres ; il accuse réception, et la date d'accusé est tracée.
- Le rapport se dépose de deux façons : **rédigé en ligne par rubriques** (le portail génère le PDF, versé comme pièce de la mission) ou **téléversé** (fichier du cabinet) ; les conclusions sont obligatoires dans les deux cas.
- Le **PDF du rapport rédigé en ligne** contient au minimum : l'identification (dossier, mission, expert, cabinet), les rubriques, l'imputation, les conclusions, la signature et la version ; il est versé comme pièce de la mission et **figure au bordereau de versement** du dossier (FR-168).
- La **lettre de mission** (référence `LM-`) est **générée par le serveur**, avec sa référence ; elle est visible de l'expert dans le portail et versée au dossier.
- Chaque dépôt crée une version du rapport (FR-161) ; les versions antérieures restent lisibles par le gestionnaire.
- Les accès du cabinet sont tracés comme ceux d'un agent (FR-158) ; une mission terminée est en lecture seule pour lui après le délai de FR-184.
- Le compte d'un cabinet exige une authentification renforcée (identifiant et second facteur) *(défaut H-145 : second facteur obligatoire pour EXPE, à confirmer)*.
- Le portail ne donne accès ni aux montants de l'évaluation de la compagnie, ni à la provision, ni à l'instruction : le cabinet ne voit que ses missions et **jamais la provision**.
- Le portail est **hébergé par le relais Money Vibes** (FR-239), les pièces de mission sont **chiffrées et à durée limitée** *(point juridique J-21 : voir FR-239 ; Money Vibes déclaré sous-traitant ; à confirmer à la séance d'immersion et par le juriste)* ; la voie `TRANSMISE` (courriel sécurisé ou papier, FR-181) reste le repli.
- **Aucune pièce médicale n'y transite**, sauf nécessité de la mission (FR-9) ; quand elle transite, la transmission est journalisée.

#### FR-181 : Un cabinet sans compte : le gestionnaire saisit

Un cabinet n'a pas obligatoirement de compte. Quand son rapport arrive par courrier ou par e-mail, le **gestionnaire le saisit pour lui** (D15). Le portail sert les cabinets qui ont un compte.

**Conséquences (testables) :**
- La saisie d'un rapport pour un cabinet sans compte exige la **pièce jointe** (le rapport reçu, numérisé) ; sans elle, l'enregistrement est refusé.
- Le rapport saisi est marqué « saisi pour le cabinet » avec le nom du gestionnaire et la date de réception réelle.
- Les mêmes contrôles que pour un rapport déposé sur le portail s'appliquent (§5.5) ; il n'y a pas deux circuits.
- La désignation, l'acceptation (par téléphone ou courrier) et l'accusé de réception sont saisis par le gestionnaire avec leur date et leur moyen.
- Un cabinet sans compte peut recevoir un compte plus tard sans perdre l'historique de ses missions.
- La lettre de mission (`LM-`) d'un cabinet sans compte est générée par le serveur comme les autres, puis imprimée ou envoyée par la voie `TRANSMISE` ; sa date et son moyen d'envoi sont saisis.

#### FR-182 : Les honoraires de l'expert : note, visa, jamais au-delà du facturé

L'expert externe enregistre sa **note d'honoraires** (ou le gestionnaire la saisit pour lui). Un **visa** par le `RESP` — **jamais** par le `CPT` — la valide, dans la limite du **plafond d'honoraires** du niveau de la matrice de délégation (FR-91) ; au-dessus du plafond, le comité décide. Le montant visé ne dépasse **jamais** le montant facturé. Le paiement se fait par le circuit des règlements (§5.8), comme une nature « honoraires » (D8, D11).

**Conséquences (testables) :**
- Cinq montants suivent la mission, distincts : **budget prévisionnel**, **honoraires convenus** (lettre de mission), **facturés**, **visés**, **payés**.
- Viser un montant supérieur au facturé est refusé.
- Viser au-delà du convenu exige un motif ; un dépassement du budget prévisionnel est signalé au `RESP` avec le motif du dépassement, et il est **bloquant** au-delà de la tolérance de FR-185.
- Le visa suppose un **rapport validé** : pas de visa tant que le rapport de la mission n'est pas validé (FR-68).
- Le visa suppose le **rapprochement de trois pièces** : la **facture**, la **lettre de mission** (`LM-`) et le **rapport reçu** ; un écart entre la facture et la lettre de mission est affiché avant le visa.
- Le **plafond d'honoraires par niveau** de la matrice est un paramètre (`deleg.honoraires.plafond.niveau1..n`, annexe D) ; un honoraire au-dessus du plafond de son niveau passe au comité.
- Une note sans pièce jointe (facture) est refusée ; sa date et son numéro de facture sont enregistrés.
- `CPT` **émet seulement** : il ne vise jamais une note d'honoraires (règle du circuit, D8, FR-7) ; le règlement d'honoraires naît du visa du `RESP`.
- Les règlements d'honoraires se rapprochent comme les autres règlements, avec l'état comptable (FR-224).
- Un expert interne n'a pas de note ; un expert à vacation ou à forfait applique son mode d'honoraires du référentiel.
- Les honoraires visés et payés alimentent l'export comptable (FR-193) et le pilotage (FR-207).

#### FR-183 : La charge et la capacité des experts

Le responsable voit, pour chaque expert, **combien il a de missions**, **ce qu'elles pèsent** et **quand ses rapports sont dus**, pour choisir « celui qui est le moins chargé à la date où j'ai besoin du rapport ».

**Conséquences (testables) :**
- Trois lectures sont disponibles par expert : nombre de missions (actives, en attente d'acceptation, rapports attendus, en retard, terminées), **charge pondérée** contre capacité, échéancier des rapports dus à 7 et 15 jours.
- Le poids d'une mission est : poids du domaine × coefficient de type de mission × coefficient de gravité du sinistre (léger ou modéré 1, grave 1,3, mortel 1,6), arrondi au demi-point ; le poids par domaine et les coefficients sont des paramètres (annexe D) *(défaut H-146 : poids par domaine à fournir par la compagnie)*.
- Un expert à plus de 1,2 fois sa capacité est « surchargé » ; à moins de 0,8, « disponible » (paramètres de la démo).
- Le taux d'occupation, le délai moyen de rapport, le taux de respect du délai, le taux de rapports avec complément demandé et le taux de contestation sont calculés depuis les missions, jamais saisis.
- La liste de désignation (§5.5) classe les experts désignables avec leur charge, leur délai estimé, leur coût estimé et les raisons du classement ; elle ne désigne pas toute seule.

#### FR-184 : Les délais de rapport, par domaine

Chaque mission a un **délai de rapport attendu**, qui dépend de son domaine. Un rapport en retard est relancé, puis arbitré.

**Conséquences (testables) :**
- Les délais par défaut, en jours, sont ceux de la démo : auto-matériel 7 (c'est le **bas de la fourchette de 7 à 10 jours** du mémoire de 2014), médical 21, responsabilité 14, fraude 30, incendie 21, transport 14, bâtiment 21, perte d'exploitation 30 ; ce sont des paramètres de la compagnie, par domaine.
- La date de rapport attendu est calculée depuis la visite (ou depuis l'acceptation s'il n'y a pas de visite) ; un point de départ et un point d'arrêt sont visibles sur la mission.
- Un rapport en retard est relancé (jours entre deux relances : 5 par défaut) ; après 3 relances sans effet, le système propose un arbitrage (changer d'expert, escalader) plutôt qu'une relance de plus.
- Pour une expertise **médicale** après un accident corporel de la circulation, le rapport est transmis à l'assureur, à la victime et à son médecin dans les **20 jours** de l'examen (art. 245 du Code CIMA, texte lu) : cette échéance **réglementaire** est affichée en plus du délai interne, et la compagnie ne la modifie pas ; l'avis à la victime d'au moins 15 jours avant l'examen (art. 244) est géré au §5.5.
- Un rapport rendu hors délai reste exploitable ; le retard est enregistré dans les indicateurs de l'expert (FR-183).
- La **validation du rapport** par le gestionnaire se fait sous **72 heures** (`rapport.validation_delai`, annexe D ; FR-68) *(défaut H-147 : défaut de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer à la séance d'immersion)*.

#### FR-185 : Le budget indicatif d'une mission

À la suggestion d'une mission, Prospera calcule un **budget indicatif** pour aider le gestionnaire à choisir et à annoncer. Il ne remplace ni la lettre de mission ni le tarif de l'expert.

**Conséquences (testables) :**
- Le budget est : (socle du domaine + le plus petit de 2 % de l'enjeu et du plafond moins le socle) × coefficient du type de mission, arrondi à 5 000 FCFA ; plafond 1 200 000 FCFA ; coefficients de type : initiale 1, complémentaire 0,5, contradictoire 1,5, contre-expertise 1,5.
- Les socles par domaine sont ceux de la démo : auto-matériel 45 000, médical 120 000, responsabilité 75 000, fraude 250 000, incendie 200 000, transport 120 000, bâtiment 150 000, perte d'exploitation 300 000 FCFA ; ces valeurs sont **à remplacer** par le tarif des experts de la compagnie.
- Le budget affiché porte la mention « indicatif » ; il n'est jamais envoyé comme engagement à un cabinet.
- Une mission dont les honoraires convenus dépassent le budget indicatif demande un motif au visa (FR-182) ; un dépassement **au-delà de la tolérance** (`honoraires.tolerance_budget`, annexe D, défaut 10 % *(défaut H-148 : 10 % ; à confirmer à la séance d'immersion)*, FR-90) est **bloquant** : le visa est refusé tant que le `RESP` ou le comité (selon le plafond du niveau) n'a pas décidé.
- Tous les montants du calcul sont des paramètres modifiables et datés ; un budget déjà calculé n'est pas recalculé quand les paramètres changent.

#### FR-185a : Les intervenants tiers des risques divers

Un sinistre de risques divers appelle d'autres personnes que l'assuré et l'expert : un syndic, un transporteur, une partie adverse, une administration, un prestataire, un avocat, un courtier, une compagnie adverse. Chacune est un **intervenant** du dossier. Prospera le suit comme une attente : ce qu'on attend de lui, quand, et ce que coûte son retard.

**Conséquences (testables) :**
- Un intervenant porte : son **type** (syndic, transporteur, partie adverse, administration, prestataire, avocat, courtier, compagnie adverse), son **rôle** dans le dossier, l'**action attendue**, la **date cible**, l'**impact du retard** (ce que le retard bloque), et la **relance** (canal, date, auteur).
- Un intervenant a un statut : `EN_ATTENTE`, `RELANCE`, `RECU` ou `SANS_SUITE` ; chaque changement écrit une ligne au journal avec son auteur.
- Un intervenant alimente la vue « mes attentes » du gestionnaire et la file « tiers externes » (FR-145, FR-147).
- Un intervenant **sans réponse à l'échéance** remonte dans la file du gestionnaire puis du `RESP` ; la relance est tracée.
- Un intervenant classé `SANS_SUITE` exige un motif ; il reste visible sur le dossier.
- Un intervenant ne reçoit aucun accès à Prospera : ses échanges passent par courrier, SMS ou e-mail du dossier (FR-146).

---

### 6.4 Contrats, provisions et états (`assurance`, M30/M31)

**Ce que ça veut dire.** Le module `assurance` fait deux choses. Il **lit** les contrats du LC (polices, garanties, produits, primes payées, intermédiaires, coassureurs) pour que le circuit puisse contrôler la recevabilité et chiffrer l'indemnité (D4). Et il **tient** la provision de chaque dossier, puis en produit les états : l'état des provisions pour sinistres à payer (PSAP), les parts cédées en réassurance et en coassurance, les données des états de contrôle, et l'export pour la comptabilité (D12, D16). **La comptabilité officielle reste hors de Prospera** : Prospera ne passe aucune écriture au sens du grand livre. Il fournit des états et des exports.

#### FR-186 : Les polices sont lues du LC, datées, jamais modifiées

Prospera garde une **projection** de ce que le LC tient : assurés, polices (numéro, souscripteur, branche, produit, dates d'effet et d'échéance, statut en vigueur, suspendue, résiliée ou expirée, immatriculation, intermédiaire, capitaux garantis), garanties souscrites (code, libellé, statut acquise, non souscrite ou suspendue, plafond, franchise en taux et en minimum, délai de déclaration, exclusions), produits, **état de paiement de la prime** (payée ou non, à quelle date), intermédiaires (courtiers, agents) et coassureurs avec leurs parts. La projection est **datée** et **en lecture seule**.

**Conséquences (testables) :**
- Aucun écran de Prospera ne permet de créer, modifier ou supprimer une police, une garantie, une prime, un intermédiaire ou un coassureur ; les montants et les statuts viennent du LC.
- Chaque donnée affichée porte la date de sa dernière lecture du LC ; plus vieille que le double de la fraîcheur par défaut (§6.5), elle est marquée « périmée ».
- Chaque objet reçu garde l'identifiant stable du LC ; Prospera ne le remplace jamais.
- Prospera ne tient ni primes ni production : il ne lit que ce qu'il faut au circuit (l'état de paiement de la prime, pas son montant d'émission) ; aucun indicateur de Prospera n'utilise la prime *(défaut H-149 : la prime n'entre dans aucun indicateur sinistre, comme dans la démo)*.
- Un objet reçu qui ne respecte pas les champs minimaux de l'annexe C est refusé avec un motif en clair et placé dans la file des écarts (§6.5).
- La projection est amorcée par la reprise (§6.8, fichier de polices) puis tenue à jour par l'échange (§6.5) *(défaut H-150 : la reprise amorce la projection ; à confirmer avec le plan de la reprise)*.
- Une police absente de la projection est signalée « police inconnue du LC » ; le dossier peut se déclarer (§5.1) mais l'ouverture exige la décision motivée de FR-187.
- Une projection **périmée** (plus vieille que l'âge maximal de lecture) donne un état « **à relire** » du contrôle de recevabilité, **jamais un refus** (FR-41, FR-201).

#### FR-187 : Les garanties qui répondent d'un type de sinistre

Une **table de correspondance** dit, pour chaque type de sinistre, **quelles garanties répondent**. Le contrôle de recevabilité (§5.2) l'utilise avec la projection de FR-186 : police en vigueur, prime payée, garantie souscrite, délai de déclaration. La table de la démo est le point de départ ; la compagnie la modifie.

**Conséquences (testables) :**
- Pour chaque type de sinistre, la table nomme les garanties qui répondent (par exemple, un accident corporel appelle la responsabilité civile de circulation) ; un type sans garantie nommée est signalé à `RESP` à la sauvegarde.
- Le contrôle donne un verdict par point (police, période, prime, garantie, plafond et franchise, délai de déclaration) avec la valeur lue et sa date de lecture.
- **Le contrôle de garantie ne peut pas être sauté** (écart corrigé de la démo, D4) : si une information manque, le gestionnaire enregistre une **décision motivée** `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, avec un motif d'au moins 10 caractères ; elle est visible de `AUD`.
- Une déclaration hors du délai contractuel donne une **réserve et un motif**, jamais une déchéance automatique : la déchéance suppose un préjudice établi, et le `RESP` décide (D15 ; art. 20 du Code CIMA, texte lu : le retard n'est opposable que si l'assureur prouve qu'il lui a causé un préjudice).
- Pour un accident de la circulation, l'état de la police (suspendue, prime impayée) est affiché avec l'alerte « opposabilité à la victime à vérifier » ; cette alerte est affichée sur **toute réserve `CONTRAT_VERIFIE`** du corporel VTM ; le Code limite l'opposabilité des suspensions de garantie aux victimes (art. 210 et son interprétation, texte lu) ; la décision revient au `RESP` et la règle exacte au juriste (D21).
- Les plafonds, franchises et délais de déclaration viennent de la garantie souscrite lue du LC, jamais d'une saisie du gestionnaire.

#### FR-188 : La provision, dossier par dossier

Prospera tient, pour chaque dossier, la **provision** : la charge estimée du sinistre. Elle est posée à l'**ouverture** (milieu de tranche selon la gravité, ou estimation du gestionnaire), puis **revue à chaque événement** : rapport d'expertise, devis, certificat médical, rapport de police, évaluation, validation, offre, règlement. Chaque révision porte un motif. La provision comprend l'**indemnité estimée et les frais individualisables** (honoraires convenus, frais de justice ; art. 334-8 et 334-12 du Code CIMA). La provision est calculée **en brut** ; les recours à exercer sont évalués à part (art. 334-12 du Code CIMA, texte lu : provision exercice par exercice, dossier par dossier, sans tenir compte des recours à exercer).

**Conséquences (testables) :**
- Un mouvement de provision n'est **jamais écrasé** : il s'ajoute, avec séquence, date, montant avant et après, motif, auteur et pièce justificative.
- Les motifs sont : ouverture, rapport d'expertise, devis de réparation, certificat médical, rapport de police, barème appliqué, validation hiérarchique, régularisation, clôture.
- Un nouveau montant égal à l'ancien, ou sans motif, est refusé.
- Une révision dont l'écart, **cumulé de façon glissante par dossier**, atteint ou dépasse 2 000 000 FCFA (paramètre) attend le `RESP` avant d'être effective (D12, FR-76) ; le `GEST` ne la valide pas lui-même.
- Un dossier dont la provision s'écarte de plus de 15 % de l'estimation de référence (expert, devis, médiane des comparables) est signalé « à revoir » ; un dossier sans mouvement de provision depuis 90 jours est signalé, et une provision de plus de 365 jours est « ancienne » (paramètres de la démo).
- La provision d'ouverture vient d'une **grille par volet et par gravité**, paramétrée par la compagnie ; elle sert à l'ouverture et au pilotage, pas au barème d'indemnisation, qui est un calcul poste par poste (D15).
- Le `GEST` peut reporter une revue de provision de X jours avec motif ; le dossier sort de la file « à revoir » jusqu'au terme ; l'`AUD` voit les reports. **Aucun report** n'est permis tant qu'un délai légal est actif sur le dossier.
- La provision a un poste distinct « **risque de pénalité** » (motif et ligne séparés de la provision d'indemnité, FR-76), alimenté quand une échéance légale est dépassée ou menacée (art. 334-12, FR-85).
- Clôturer un dossier ramène sa provision à zéro avec le motif « clôture » ; le reste à payer d'un dossier clos doit être nul (§5.9).
- Au corporel VTM, un **refus de garantie** ou un **classement** ne remet **pas** la provision à zéro tant que l'obligation légale d'offre demeure (art. 237) ; ailleurs, la provision est ramenée à zéro avec motif et visa (FR-121, FR-123).

#### FR-189 : L'état des provisions (PSAP), par exercice de survenance, brut, cédé, net

Prospera produit l'**état des provisions** : dossier par dossier, regroupé par **exercice de survenance**, avec le **brut**, la part **cédée** en réassurance (FR-190), la part des coassureurs (FR-191) et le **net**. Il est daté et rejouable.

**Conséquences (testables) :**
- L'état liste, pour chaque dossier ouvert à la date d'arrêté : numéro de sinistre, exercice de survenance, sous-catégorie, provision brute, part cédée, part des coassureurs, net, date du dernier mouvement.
- Le total de l'état est égal à la somme des provisions des dossiers, au franc près ; un écart est un défaut.
- Un dossier est classé selon l'exercice de sa **date de survenance**, jamais celle de sa déclaration ou de son import (§6.8).
- La date d'arrêté se choisit ; l'état d'une date passée est reconstruit depuis les mouvements, sans recalcul avec les paramètres du jour.
- Les sinistres survenus mais non déclarés (IBNR) sont estimés selon des modalités fixées par une circulaire de la CRCA (art. 334-12) : Prospera **ne calcule pas l'IBNR officiel** ; l'état a une colonne que la compagnie renseigne ou importe *(point juridique J-22 : l'IBNR est estimé hors de Prospera au premier jour ; à confirmer avec le juriste et la direction technique)*.
- L'état s'exporte en tableur ; `DT`, `DG`, `CPT`, `AUD` le lisent.
- Un sinistre **non payé dont l'obligation légale court** (corporel VTM) reste **provisionné, non nul**, même après un refus de garantie ou un classement (art. 237 ; FR-188). Le motif « **risque de pénalité 5 %** » est un motif de provision de l'état.
- **États techniques de la direction**, tous recalculés depuis les données : le **triangle de liquidation** ; le **taux de liquidation** ; le **coût moyen** ; l'état **par branche et par exercice de survenance** ; le **boni et le mali de liquidation** (écart entre la provision et le payé final des dossiers soldés), avec un seuil significatif *(défaut H-151 : 250 000 FCFA, paramètre boni_mali.seuil ; à confirmer avec la direction technique)* ; la **charge nette** après coassurance et réassurance (FR-190, FR-191).
- Une **note de synthèse** de direction est **générée depuis les données** et **rejouable** à une date d'arrêté : analyse, lecture par domaine, position au regard des règles CIMA, décisions à prendre classées par priorité, **projection à 30 jours**.
- Une **revue mensuelle** de direction est **imprimable** ; elle reprend ces états et la note de synthèse.
- Le **parapheur** de direction s'exporte avec : l'engagement, la charge nette et les réserves de chaque dossier soumis.

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
- À l'atteinte du **seuil de sinistre majeur** (`majeur.seuil`, FR-57a), Prospera **avise le réassureur selon le traité** applicable : l'avis part au contact du traité, avec le dossier, la provision brute et la part du réassureur ; l'envoi et son accusé sont tracés.

#### FR-191 : La coassurance, par clé de répartition

Une police en coassurance a une **clé de répartition** : les parts de chaque compagnie, dont le rôle d'**apériteur** ou de **coassureur** (la somme des parts est 100 %). La clé s'applique à la provision, à l'indemnité, au règlement, au recours et à la cession. L'apériteur instruit et règle la victime ; les coassureurs remboursent leur quote-part.

**Conséquences (testables) :**
- La clé est lue du LC avec la police (FR-186) ; si le LC ne la fournit pas, `RESP` ou `DT` la saisit avec la pièce justificative, et elle est marquée « saisie ».
- Une clé dont la somme n'est pas 100 % est refusée.
- Quand la compagnie est apériteur, la part des coassureurs est calculée sur chaque règlement et produit une ligne « à réclamer aux coassureurs » ; quand elle est coassureur, Prospera n'instruit pas : il tient la quote-part qu'elle doit.
- L'état de FR-189 sépare la part de la compagnie et celle des coassureurs.
- Les coassureurs sont informés à l'ouverture du dossier (§5.2).
- Le **rapport périodique** d'un sinistre majeur (FR-57a) donne la **charge nette après clé de coassurance** : part de la compagnie, part des coassureurs, puis part cédée.

#### FR-192 : Les données des états pour le contrôle de la CRCA

La CRCA contrôle sur pièces et sur place, et peut demander à la compagnie toutes les informations qu'elle juge nécessaires (art. 310 et 405 du Code CIMA, texte lu). Les états annuels que la compagnie remet comprennent notamment les états par exercice de survenance, de paiements et de provisions, et le suivi des sinistres de grande ampleur non clôturés, notamment C10, C10a, C10b et C10d (art. 422, liste lue) ; ils sont remis au plus tard le 1er juin (art. 405). **Le contenu exact et le format de ces états sont à préciser par le juriste (D21, circulaires de la CRCA).** Prospera ne prétend pas produire l'état officiel : il **fournit, pour chaque dossier, les données dont ces états se nourrissent**.

**Conséquences (testables) :**
- Chaque dossier sait produire, à une date d'arrêté : exercice de survenance, catégorie ou sous-catégorie, nombre de sinistres, paiements cumulés, provision, recours encaissés et prévus, coût moyen, et un drapeau « grande ampleur non clôturé » ; le seuil du drapeau est un paramètre *(défaut H-152 : seuil à fixer avec la compagnie)*.
- L'export s'obtient en tableur, par exercice et par catégorie, daté, avec le nom de celui qui l'a demandé.
- Les colonnes de l'export sont versionnées ; une colonne ajoutée par le juriste ne change pas les exports passés.
- Un **registre chronologique exportable** liste les déclarations **dans l'ordre d'arrivée** : exercice de survenance, date de l'opération, date de réception, catégorie, bénéficiaire, référence de règlement, recours, observation. Le registre coté et paraphé du mémoire de 2014 devient le **journal chaîné** de FR-13 ; le contenu exact des états C10 reste « à vérifier par le juriste » (§13.2).
- Aucun état n'est présenté comme « officiel » : il porte la mention « données de base pour l'état réglementaire ».
- L'export est lisible par `DT`, `DG`, `AUD` ; la production d'un dossier de contrôle complet est décrite en FR-211.

#### FR-193 : L'export pour la comptabilité

Prospera produit, pour la comptabilité de la compagnie, un **état et un export**, qui sont une **proposition de mouvements pour la comptabilité** (jamais une écriture passée au grand livre), de ce que le circuit a fait : règlements émis et remis, honoraires visés et payés, provisions (dotations et reprises), recours encaissés, cessions (D16). Le format suit le contrat d'échange (annexe C). La comptabilité garde la comptabilité : Prospera ne passe pas d'écriture au grand livre.

**Conséquences (testables) :**
- Chaque ligne de l'export porte : date, journal, compte, libellé, débit, crédit, pièce justificative ; le compte vient d'une **table de correspondance** nature de l'opération vers compte, paramétrée par la compagnie : **le plan de comptes de la compagnie fait foi** ; la table de la démo est remplacée à la mise en service.
- Un export a un numéro, une période et un auteur ; en demander un second pour la même période ne duplique aucune ligne chez la comptabilité (idempotence par clé d'origine).
- La somme des débits égale la somme des crédits de chaque export : c'est le **contrôle de l'export**, non une écriture de grand livre.
- L'export comporte l'**état de liquidation** : provision à l'ouverture, provision au bilan, réglé, reprise, charge nette, écart d'évaluation, soldé.
- Un règlement émis, remis, rejeté ou annulé produit la ligne correspondante ; un règlement bloqué par un contrôle (fraude, séparation des fonctions) n'en produit aucune.
- Le rapprochement bancaire des chèques et du Mobile Money se fait dans le module `paiement` ; un écart de rapprochement de plus de 60 jours est une alerte (D16, démo).
- Prospera fournit aussi un état mensuel : règlements émis, remis, en attente, en circulation, comptes d'attente à justifier, honoraires, dotations et reprises de provision.
- Les provisions et les règlements sont aussi envoyés au LC par l'échange (§6.5, flux « évaluation et provision », « règlement ») : l'export de comptabilité est un autre canal, jamais le seul.

---

### 6.5 L'échange avec le logiciel de la compagnie (`liaison-assureur` [proposition], M48 [proposition])

**Ce que ça veut dire.** Le LC tient les contrats de la compagnie et, pour un début, le **numéro de sinistre officiel** (récit du PO, §1). Prospera se branche **à côté**, pour le dossier sinistre. Le module `liaison-assureur` porte le **contrat d'échange** (annexe C) : il reçoit du LC ce que le LC tient, il lui renvoie ce que Prospera décide, et il dit à chaque écran quelle est la fraîcheur de ce qu'il montre. **Le PRD ne dit rien du LC réel** : son nom, son API et son format ne seront connus qu'en janvier. Le contrat ne dépend d'aucun produit. L'échange passe par une API si le LC en offre une, sinon par des fichiers Excel ou JSON, dans les deux sens. Le connecteur d'un produit précis se fera quand le LC sera connu ; le contrat d'échange et le LC fictif (§6.6) sont, eux, au premier jour *(défaut H-153 : transposition de la décision de la microfinance (PRD-MF §6.5, décision A9) ; à confirmer)*.

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
- Chaque envoi porte une clé d'origine unique et l'identité de l'auteur de la décision ; l'envoi d'une déclaration porte la référence `DEC-`, **champ obligatoire** (annexe C, C-13).
- Tout **motif** d'un message vers le LC est un **motif codé**, pris dans une liste fermée (D.3) ; **jamais un texte libre**.
- Chaque envoi a un état visible : à envoyer, envoyé, accepté, refusé (avec le motif du LC), jamais confirmé après un délai (24 heures par défaut, paramètre).
- Un refus du LC remonte au rôle concerné (`GEST`, `GREC` ou `RESP`) dans sa file, avec le motif.
- Chaque message sortant du corps du PRD (« envoyé au LC ») a une ligne dans l'annexe C avec son sens, sa clé d'origine et ses états ; un test parcourt l'annexe et le corps pour vérifier qu'aucun message n'a été oublié.
- Le LC ne reçoit **aucune donnée médicale** : ni gravité, ni nature des lésions, ni texte libre ; seulement le **volet**, les **montants** et des **motifs codés** *(point juridique J-23 : aucune donnée de santé vers le LC ; base légale à valider par le juriste, §13.2)*. Un envoi d'évaluation ou de clôture ne contient que le montant, la garantie, le statut, le code de volet et les références.
- Test sur le LC fictif : parmi tous les échanges sortants d'un dossier corporel, aucun champ ne porte une donnée de santé (gravité, type de sinistre corporel, nom de la victime si le LC n'en a pas strictement besoin, texte libre).

#### FR-197 : API ou fichier, dans les deux sens

Le contrat d'échange est servi par deux transports interchangeables : une **API** que Prospera interroge, ou des **fichiers Excel ou JSON** que Prospera relève ou dépose dans un emplacement partagé du réseau de la compagnie. Les deux transports valent dans les deux sens. **Prospera tire et dépose ; il n'ouvre aucun port entrant pour cet échange** *(défaut H-154 : règle de la microfinance reprise, décision A10 ; à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Les deux transports portent le même contrat ; changer de transport ne change aucun écran ni aucune exigence.
- Un LC sans API est limité à une fraîcheur horaire ou nocturne ; l'écran le dit (FR-201).
- Un fichier est identifié (numéro de lot, date, version du contrat, objet) ; un fichier relevé deux fois n'est intégré qu'une fois.
- Le fichier est lisible par un humain : un onglet ou un tableau par objet, une ligne par objet, une colonne par champ de l'annexe C ; le même contenu existe en JSON.
- Le détail des transports, des enveloppes et des formats est dans l'addendum.

#### FR-198 : Le numéro de sinistre : référence immédiate, numéro officiel ensuite

À la déclaration dans Prospera, le dossier reçoit **immédiatement** une **référence de déclaration** `DEC-AAAA-NNNNN`, remise à l'assuré sur l'accusé de déclaration (FR-36) ; la déclaration part vers le LC (FR-196). Le LC renvoie le **numéro de sinistre officiel** ; Prospera le rattache. **C'est ce numéro qui s'affiche partout ensuite** ; la référence de déclaration reste un critère de recherche (FR-150).

**Conséquences (testables) :**
- La référence `DEC-` est attribuée sans attendre le LC, sans trou ni doublon, même si le LC est coupé.
- Un dossier sans numéro officiel depuis plus de **1 jour ouvré** lève une alerte au `RESP` (paramètre).
- Le **paramètre « qui attribue le numéro de sinistre »** vaut « le LC » par défaut ou « Prospera » : basculer ne demande pas de reprise du code ; quand Prospera attribue, le numéro porte un **préfixe distinct** de ceux du LC (`PRO-`) et suit un format paramétré (défaut `SIN-AAAA-NNNN`, soit `PRO-SIN-AAAA-NNNN`) *(défaut H-155 : format de la démo ; préfixe PRO- à confirmer)* ; un **contrôle d'unicité** contre les numéros reçus du LC (C-9) est fait au basculement.
- Prospera n'impose aucun format au numéro officiel du LC : il accepte le texte reçu, dans une limite de longueur paramétrée.
- Le **contrôle de doublon** porte sur la police, la date de survenance, l'immatriculation et la victime ; il cherche dans les dossiers de Prospera **et** dans les sinistres reçus du LC ; un doublon probable est signalé au gestionnaire, qui décide ; Prospera ne fusionne jamais seul.
- Un dossier déclaré au LC avant Prospera (par un autre canal) se rattache à son numéro officiel ; il n'a pas de référence `DEC-` tant qu'il n'a pas été déclaré dans Prospera.
- Un numéro reçu pour une `DEC-` **déjà numérotée** est un **écart** (file des écarts, FR-200), **jamais un second rattachement** ; le dossier garde son premier numéro, et le rattachement d'un numéro n'a lieu que si le dossier n'avait pas de numéro.
- La référence `DEC-` est l'**identifiant d'idempotence** envoyé au LC : le LC renvoie le numéro existant pour une `DEC-` déjà reçue *(défaut H-156 : capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement)*.
- Une déclaration est dans **une seule voie** à la fois : envoi automatique **ou** liste « à saisir » (FR-199) ; elle n'a jamais deux numéros.

#### FR-199 : Quand le LC ne sait pas recevoir, Prospera sort la liste « à saisir dans le logiciel de la compagnie »

Si le LC ne sait pas recevoir un flux (ni API, ni fichier), Prospera produit chaque jour la **liste de ce qu'il faut saisir** dans le LC : déclarations (pour obtenir un numéro), évaluations et provisions, règlements, recours encaissés, clôtures. L'agent qui saisit dans le LC **reporte le numéro obtenu** dans Prospera.

**Conséquences (testables) :**
- La liste est un fichier lisible (tableur) et un écran ; chaque ligne porte : référence (`DEC-` ou numéro officiel), nature, montant, date, auteur, clé d'origine à recopier.
- Une déclaration quitte la liste quand le numéro officiel est reporté dans Prospera ; une autre ligne quitte la liste quand le LC renvoie sa trace (flux de FR-195) ; si le LC ne peut rien renvoyer, l'agent la marque « saisie » avec son nom et la date, et la ligne reste visible « saisie, non confirmée » *(défaut H-157 : confirmation par marquage de l'agent quand le LC ne renvoie rien)*.
- Une ligne qui reste dans la liste plus d'un jour ouvré (déclaration) ou plus de 72 heures (autre nature) lève une alerte au `RESP` (paramètres ; le second est transposé de la microfinance *(défaut H-158)*).
- La **liste** est la même que le LC reçoive ou non par la suite : elle sert aussi de preuve de ce qui a été demandé. Cette règle ne vaut que pour la liste : une déclaration est dans **une seule voie** à la fois, envoi automatique **ou** liste « à saisir ».
- Le passage d'une déclaration à la liste **annule d'abord l'envoi en attente** : la déclaration prend l'état `SAISIE_MANUELLE` ; elle n'est **jamais renvoyée automatiquement** ensuite.
- Le report du numéro obtenu dans le LC **clôt la voie `SAISIE_MANUELLE`** (annexe C, C-18) ; le numéro reporté suit la règle de FR-198 (écart s'il existe déjà).
- Reporter un numéro déjà attribué à un autre dossier est refusé et va dans la file des écarts.

#### FR-200 : L'idempotence, le rejet motivé et la file des écarts sont des capacités du contrat

Chaque objet échangé porte une **clé d'origine**. Présenter deux fois le même objet ne le crée pas deux fois. Un envoi échoué est rejoué sans perte. Un objet refusé est **daté et motivé**. Tout écart détecté va dans une **file des écarts**. Prospera ne corrige jamais en silence.

**Conséquences (testables) :**
- Rejouer un lot déjà intégré ne change aucun dossier, aucune provision, aucun règlement affiché.
- Une coupure du lien ne perd aucun envoi : les envois attendent dans une file et partent dans l'ordre à la reprise, **sauf** les déclarations passées à la liste « à saisir », dont l'envoi en attente est **annulé** (état `SAISIE_MANUELLE`, FR-199) ; une déclaration de la liste n'est jamais renvoyée automatiquement.
- Un refus porte un **code** et un **motif en clair**, la date, l'objet et sa clé ; il est visible du rôle concerné (FR-196).
- Un doublon présenté par le LC (même clé d'origine) est reconnu et compté dans la file, pas appliqué.
- Une annulation arrive comme un fait inverse daté ; Prospera n'efface aucun fait envoyé ou reçu.
- Chaque ligne de la file porte : objet, clé d'origine, nature de l'écart, date, auteur de la résolution quand elle a lieu ; résoudre un écart ne l'efface pas : la ligne passe « résolue » avec l'auteur et le motif.
- La file est lisible par `RESP`, `GEST` concerné, `CPT` (écarts de règlement), `AUD`.

#### FR-201 : Chaque écran dit la fraîcheur, et Prospera continue quand le LC est coupé

Chaque écran qui montre une donnée du LC affiche la date et l'heure de la **dernière lecture** et le transport utilisé. Quand le LC est indisponible, Prospera continue de servir la dernière donnée connue, marquée **périmée**, et met en file ce qu'il doit envoyer.

**Conséquences (testables) :**
- Fraîcheur par défaut : au plus **5 minutes** avec une API (interface) ; au plus **24 heures** avec des fichiers, lus à l'heure ou de nuit (avant 6 h) (paramètres de l'annexe D ; FR-3 et FR-41 s'alignent sur ces valeurs).
- Une donnée plus vieille que le double de sa fraîcheur par défaut est signalée « périmée ».
- Un bandeau « LC indisponible depuis [heure] » apparaît sur les écrans des rôles concernés et se retire à la reprise.
- LC coupé : on peut déclarer (référence `DEC-`), joindre des pièces, instruire, évaluer, valider, payer ; **payer revérifie la police** sur la dernière projection datée (âge inférieur ou égal à l'âge maximal) avant d'émettre ; sinon l'émission est bloquée « à relire » ; les envois attendent la reprise ; l'ouverture d'un dossier sur une police lue depuis plus de l'âge maximal (24 heures par défaut *(défaut H-159 : âge maximal de lecture pour l'ouverture, paramètre)*) exige la décision motivée de FR-187.
- Le numéro officiel d'un dossier déclaré pendant la coupure arrive à la reprise ; l'alerte de FR-198 ne compte pas les jours de coupure déclarée *(défaut H-160 : horloge de l'alerte suspendue pendant une coupure déclarée)*.
- La date de dernière lecture est celle de la dernière réponse **valide** du LC, pas celle de la dernière tentative.

---

### 6.6 Le logiciel de compagnie fictif (`assureur-fictif`)

**Ce que ça veut dire.** Le LC réel n'est pas connu. Money Vibes livre un **logiciel de compagnie fictif**, qui parle le contrat d'échange (annexe C), **pour que la compagnie voie** comment Prospera vit à côté de son logiciel, sans y toucher. Il sert la démonstration (une compagnie fictive, ses polices, ses gestionnaires, D19) et la recette. Il n'est **jamais installé en production**. Le connecteur du vrai LC se fera quand ce logiciel sera connu, pas maintenant.

#### FR-202 : Le LC fictif tient ce que tient un vrai LC

Le LC fictif tient les assurés, les polices, les garanties, les produits, l'état de paiement des primes, les intermédiaires, les coassureurs et leurs clés, et des sinistres existants, pour une compagnie fictive. Il parle le contrat de l'annexe C **dans les deux sens**.

**Conséquences (testables) :**
- Chaque objet de l'annexe C marqué « LC → Prospera » est produit par le LC fictif avec ses champs minimaux.
- Chaque objet marqué « Prospera → LC » est accepté, refusé ou ignoré (doublon) par le LC fictif, avec un code de refus en clair.
- Le jeu porte les polices et les garanties des **7 produits de la démo**, en nombre suffisant pour les 3 500 dossiers du portefeuille de démonstration (environ 25 000 contrats d'après la démo *(défaut H-161 : ordre de grandeur de la démo)*), tous statuts de police représentés (en vigueur, suspendue, résiliée, expirée), dont des primes impayées et des polices en coassurance.
- Les données sont fictives de bout en bout (noms, immatriculations, téléphones) ; un test vérifie qu'aucune ne provient d'une personne réelle.
- Le LC fictif peut produire un jeu de sinistres existants avec leurs documents, pour tester la reprise (§6.8).

#### FR-203 : Le LC fictif attribue les numéros de sinistre

Le LC fictif reçoit les déclarations de Prospera et **renvoie un numéro de sinistre officiel**, après un délai paramétré. Il applique le paramètre « qui attribue le numéro » : quand c'est Prospera qui attribue, il se contente d'enregistrer le numéro reçu.

**Conséquences (testables) :**
- Une déclaration envoyée reçoit un numéro officiel au plus tard après le délai simulé ; Prospera le rattache au dossier et l'affiche partout (FR-198).
- Le même `DEC-` présenté deux fois reçoit le même numéro : un doublon est reconnu, pas attribué deux fois.
- Les numéros attribués sont sans trou ni doublon et suivent un format propre au LC fictif, différent de celui de Prospera (pour montrer que Prospera n'impose pas le sien).
- Le LC fictif détecte un doublon probable (même police, même date de survenance, même immatriculation) et le signale dans sa réponse, sans le refuser *(défaut H-162 : signal de doublon côté LC fictif, pour la démonstration du contrôle)*.

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
- L'onglet « **technique et réglementaire** » a des indicateurs fixés : la **charge après coassurance et réassurance** (FR-189), les **engagements restants** à décaisser (FR-207) et la **conformité aux délais CIMA** (part des délais légaux tenus, FR-213) ; il renvoie aux états techniques de FR-189 (triangle, boni et mali, note de synthèse, revue mensuelle).
- L'**état hebdomadaire des déclarations** est généré au **jour et à l'heure paramétrés** (`etat_hebdo.jour_heure`), **visé par `RESP`**, remis au `DT` puis au `DG`, avec la trace du visa.
- L'**état hebdomadaire des recours par débiteur** (FR-110) est généré ici, au même rythme.
- Les chiffres illustratifs de la proposition (214 ouverts, 23 bloqués…) ne sont pas des cibles : la valeur affichée est celle des données.

#### FR-207 : La charge, les pièces attendues, les règlements en attente, les délais qui expirent

Le tableau de bord montre aussi : la **charge et les montants par gestionnaire**, les **pièces attendues et les relances par canal**, les **règlements en attente et le valideur attendu**, les **délais qui expirent**.

**Conséquences (testables) :**
- La charge d'un gestionnaire est le nombre de dossiers en charge, la charge pondérée et les montants (évalué, validé, payé, reste à payer) ; la réaffectation en un clic est permise au `RESP`, avec motif (§5.3).
- Les pièces attendues sont comptées par canal de relance (appel, SMS, e-mail, WhatsApp) et par ancienneté ; une pièce bloquante attendue depuis plus de 30 jours est signalée (paramètre).
- Chaque règlement en attente nomme le **valideur attendu** (le niveau de délégation et le rôle) et l'ancienneté de l'attente ; les règlements à valider au-dessus du seuil du comité apparaissent dans une vue de signature.
- Les délais qui expirent regroupent les délais **légaux** du corporel (alertes réglementaires, non modifiables par la compagnie) et les délais **internes** ; chacun a son point de départ, son point d'arrêt et le jour restant (§5.14).
- Les honoraires d'expert à viser (FR-182) et les experts surchargés (FR-183) figurent sur la même vue.
- Chaque ligne indique l'âge de la donnée.
- La vue **engagements à décaisser** donne, par bénéficiaire, le **validé moins le payé**, et les **honoraires à décaisser** ; elle a **deux colonnes séparées, « exigible » et « à confirmer », jamais sommées** : le total n'additionne jamais les deux colonnes (test).
- **Fraîcheur** : la charge de chaque gestionnaire et les retards sont **recalculés à la lecture** ; les états de quittances et de chèques sont **continus** pour la file `CPT` et **quotidiens** pour l'export (le « J+1 » du deck devient « quotidien »).

#### FR-208 : Le brief du matin et la veille (IA, usage n° 13)

Chaque matin, l'IA commune prépare un **brief** : dossiers à risque, **délais qui expirent**, **anomalies de la nuit**, activité de la veille (traités, clôtures, déclarations, règlements), anomalie dominante, suggestion. En continu, une **veille** signale les dossiers qui méritent attention. **Entrée** : les dossiers, le journal et les délais du périmètre du lecteur. **Sortie** : le brief et des alertes, chacune avec sa suggestion et sa source. **Destinataire** : `DG`, `RESP` ; chaque `GEST` reçoit le sien sur son périmètre. **Garde-fou** : lecture seule ; périmètre du rôle ; chaque alerte renvoie à ses dossiers ; l'IA ne contacte personne et ne modifie rien.

**Conséquences (testables) :**
- Le brief est disponible à une heure paramétrée (07:00 par défaut *(défaut H-163 : 07:00, paramètre)*) et se relit dans la journée.
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
- **Trou ou doublon** : un test cherche un **trou** ou un **doublon** dans la série des `DEC-` et dans les numéros officiels reçus du LC ; **tolérance zéro**, gravité **majeure**, responsable `AUD` ; les trous consignés avec motif (FR-36) sont exclus.
- **Revue mensuelle** de **tous les dossiers vivants** (statut, provision, dernière action, échéance), **visée par `RESP`** avec trace (qui, quand) ; une alerte part si elle n'est pas faite à **M+5 jours** (`revue_mensuelle.delai`).
- **Veille de 3 jours** avant le règlement d'un dossier sensible : le règlement d'un dossier du registre de surveillance est rappelé à `RESP` et `AUD` trois jours avant son échéance.

#### FR-211 : Un dossier prêt pour un contrôle de la CRCA, sans reconstitution

La CRCA peut contrôler sur pièces et sur place, et exiger les documents et le personnel qualifié pour répondre (art. 310 du Code CIMA, texte lu). Prospera permet de produire, **sans reconstitution**, le dossier complet de chaque sinistre demandé : la fiche, les pièces, les décisions et leurs motifs, les délégations, l'historique de la provision, les preuves de délai, le journal complet.

**Conséquences (testables) :**
- À partir d'un numéro de sinistre ou d'un lot (exercice, branche, période), `AUD` ou `DT` obtient un **dossier de contrôle** en un seul export (document et tableur), avec l'horodatage et l'auteur de la demande.
- Le dossier de contrôle contient : la fiche (FR-152), la liste des pièces avec leur version, leur empreinte et leur cote papier, les décisions avec auteur et motif, la délégation appliquée, les mouvements de provision, les règlements et leurs quittances, le journal (FR-158), le numéro d'archivage, les sorties d'archive.
- Un contrôle de **complétude** s'exécute avant l'export : il liste ce qui manque (pièce attendue absente, décision sans motif, quittance non signée, empreinte en échec) pour que la compagnie le voie avant la CRCA.
- Un lot de 100 dossiers est produit en moins de 30 minutes *(défaut H-164 : cible de temps, paramètre)*.
- Le journal produit est celui du serveur : sans insertion ni suppression ultérieure ; le Code CIMA demande, pour la comptabilité informatisée, des états datés, l'impossibilité d'insertions ou suppressions ultérieures et un droit d'accès du contrôleur (art. 406 et 407, texte lu) ; **l'application de ces articles à un dossier de sinistre est à confirmer par le juriste (D21)**.
- La CRCA n'a pas de compte dans Prospera : la compagnie lui remet l'export *(défaut H-165 : pas de compte pour la CRCA)*.
- Les chemises papier sorties pour un contrôle de la CRCA suivent FR-171.
- Les **pièces médicales** du dossier de contrôle ne figurent que par leur **type** et leur **existence** pour les rôles hors FR-9 ; leur contenu n'est remis que par un rôle de FR-9, par dossier ouvert à la validation, journalisé ; un test par rôle le vérifie.
- Un dossier « prêt pour la CRCA en **une journée** » est une intention *(défaut H-166 : non mesurée ; à mesurer à la première revue)* : ce n'est pas une cible de recette.

#### FR-212 : Tout indicateur se recalcule depuis les données

Aucun chiffre de pilotage n'est une constante, un tirage ou une saisie. Chaque indicateur a une **définition écrite** (ce qu'il compte, point de départ, point d'arrêt, périmètre) et se **recalcule depuis les données** du dossier, du journal et des contrats lus.

**Conséquences (testables) :**
- Modifier un dossier de test (montant, étape, date) change l'indicateur qui l'utilise, sans autre geste ; un test le vérifie pour chaque indicateur de FR-206, FR-207 et FR-213.
- Le même indicateur affiche le même chiffre sur tous les écrans, au même instant (une seule source).
- Chaque indicateur affiche l'heure du calcul ; l'actualisation est d'au plus 5 minutes *(défaut H-167 : 5 minutes, paramètre)*.
- Chaque indicateur est décomposable : un nombre mène à la liste des dossiers, un montant à la liste des lignes.
- Les délais se calculent depuis les horodatages du journal ; une étape sans horodatage n'entre pas dans une moyenne et est comptée à part.
- Les chiffres d'une simulation (FR-209) ne rentrent dans aucun indicateur.
- Un indicateur dont la source est le LC affiche la date de dernière lecture (FR-201).
- Chaque indicateur du §9 a une **fiche** qui porte : sa **requête de calcul**, sa **source de donnée** et son **propriétaire** (rôle) ; un indicateur **sans source** est supprimé (par exemple « appels traités pendant l'appel » : aucun appel n'est enregistré dans Prospera).

#### FR-213 : Les indicateurs de délai et de qualité du circuit

Le pilotage fournit les indicateurs que le service attend, tous calculés depuis les horodatages (FR-212).

**Conséquences (testables) :**
- Délais moyens : déclaration à ouverture, ouverture à évaluation, évaluation à règlement ; **taux de dossiers dans le délai cible**, par volet.
- Ancienneté du stock actif (aging), par tranche : 7 jours ou moins, 8 à 30, 31 à 90, plus de 90.
- Taux de numérisation du fonds, temps moyen entre réception d'une pièce et contrôle (FR-165), pièces à rattacher (FR-166).
- Écarts de règlement ouverts, chèques à remettre et ancienneté, règlements en attente de valideur.
- Part d'accusés de réception envoyés dans le délai et d'offres envoyées dans le délai interne (§5.7) : ce sont les défauts relevés par l'audit de la procédure d'indemnisation de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; ils sont mesurés ici pour être traités *(défaut H-168 : transposition à confirmer pour le Togo)*.
- Chaque délai cible est un paramètre par volet ; la valeur de la démo (SLA par volet) est reprise comme défaut interne (§5.14).
- **Compteurs du mémoire** : délai déclaration à enregistrement, ouverture à validation, rapport à offre, offre à paiement ; une **alerte** part sur l'**écart anormal entre le rapport et la quittance** (délai rapport-quittance au-delà de la norme du volet).
- Le **doublon de règlement** se définit comme dans FR-224 : même bénéficiaire et même sinistre (date, police, immatriculation), **jamais le montant** ; l'indicateur « règlements payés deux fois » compte ces doublons.
- Les indicateurs s'exportent en tableur.

---

### 6.8 La reprise des archives et la vie en parallèle (`reprise`, M44)

**Ce que ça veut dire.** La compagnie a déjà des assurés, des polices, des sinistres ouverts et des archives. Le module `reprise` (M44, PRD Reprise de données) les fait entrer dans Prospera, **sans ressaisie**, et il fait vivre ensemble l'ancien et le nouveau pendant la période où les deux systèmes coexistent. La mécanique générale (lot par étapes, simulation, rapport, validation par le DG, réconciliation, feu vert par module cible, répétition générale) est celle du PRD Reprise ; cette section dit **ce que l'assurance exige de lui**. **La reprise est le premier risque du projet** (FR-219).

La source de la reprise n'est pas connue : le PRD ne spécule pas dessus (récit du PO, §1). Le PO a retenu **l'API ou un fichier Excel ou JSON**. Le scan du stock papier n'est **pas** une voie de reprise (D17).

#### FR-214 : La reprise lit une API ou un fichier Excel ou JSON, et traduit sans trahir

*(action A-10 au §12.2)*

La reprise lit les données de la compagnie par **API**, ou par **fichier Excel ou JSON** déposé chez la compagnie ; elle les traduit vers le format commun de Prospera. Elle reprend : les **métadonnées** (assuré, police, sinistre, date, type de pièce), les **fichiers** des pièces, et, pour chaque objet, sa trace d'origine. Pour les contrats, la reprise **amorce** la projection du LC (§6.4).

**Conséquences (testables) :**
- Au premier jour, **les deux voies** existent (décision du PO) : les **fichiers** (Excel, JSON ; CSV accepté) sans condition, et l'**API** du LC, dont l'adaptateur est écrit dès que le LC est connu (janvier) et livré avant la mise en service. Si le LC n'expose pas d'API, les fichiers suffisent et rien ne bloque *(défaut H-169 : le PRD Reprise (FR-1, spine AD-23) ne requiert que les fichiers en février ; un amendement est demandé pour l'adaptateur API de l'assurance (§12.2))*.
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
- Un historique de moins de 3 ans est signalé au rapport (« l'IA démarrera avec moins de recul ») sans bloquer ; **aucune borne haute** ne limite l'historique repris (PRD Reprise FR-9 ; objectif de 3 à 5 ans pour l'IA *(défaut H-170 : 3 à 5 ans de la proposition v2)*).
- Les nouvelles pièces **postérieures** à la reprise sont scannées ou téléversées au guichet ou par `NUM`, avec le contrôle de FR-165.

#### FR-216 : Le rapport de reprise, validé avant que rien n'entre

*(action A-10 au §12.2)*

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

Pendant la période où les deux systèmes vivent ensemble, la reprise **resynchronise** chaque nuit (paramètre) ce que la source a fait depuis la dernière fois. La resynchronisation est **idempotente**. Un dossier est **suivi** depuis la source tant que personne ne l'a pris en main dans Prospera ; il devient **tenu par Prospera** à sa **prise en main**, définie par une **liste fermée** : l'**affectation** du dossier à un gestionnaire, ou sa **première transition** de statut. Une consultation, une note ou un dépôt de pièce ne déclenchent **pas** la prise en main.

**Conséquences (testables) :**
- Rejouer la même resynchronisation ne crée ni doublon ni changement (clé d'origine et empreinte de ligne) ; une ligne supprimée côté source est marquée « retirée de la source », jamais supprimée de Prospera.
- Un dossier **suivi** est mis à jour chaque nuit depuis la source, sans écraser aucun champ saisi dans Prospera ; l'écran dit « suivi depuis le système de la compagnie ».
- À la **prise en main** (affectation ou première transition, jamais une simple consultation, note ou dépôt de pièce), le dossier est **tenu par Prospera** pour tous les champs du dossier : instruction, pièces, expertise, évaluation, provision, décision, règlement, journal ; les contrats et le numéro de sinistre restent ceux du LC *(défaut H-171 : bascule par dossier à la première action ; à confirmer à la séance d'immersion)*.
- Si la source change, après la prise en main, un champ du dossier tenu par Prospera, le changement **n'est pas appliqué** : il va dans la file des écarts (FR-200) avec les deux valeurs ; le `GEST` le reporte à la main avec motif, ou le rejette avec motif.
- Si la source change un **contrat** (police, garantie, prime) d'un dossier tenu par Prospera, le LC l'emporte : la projection est mise à jour, le gestionnaire est averti, et la recevabilité est ré-affichée avec la nouvelle donnée ; la décision déjà prise n'est pas modifiée toute seule.
- Un dossier modifié des deux côtés **sur le même champ** garde la valeur de Prospera ; l'écart montre les deux valeurs et sa résolution (qui, quand, motif) est tracée.
- Un **règlement**, une **annulation** ou une **clôture** venant du LC sur un dossier tenu par Prospera est un **fait reçu** : il **bloque les ordres** du dossier et s'affiche en **alerte rouge** (annexe C, C-15 dans le sens inverse).
- Un dossier modifié par le LC **après la prise en main** passe en **« litige de source »** : **aucun paiement** tant que l'écart n'est pas résolu (qui, quand, motif).
- Les « **montants payés** » lus du LC (annexe C, C-9) ne remplacent pas le payé de Prospera : **le payé fait foi dans Prospera** ; la mise à jour nocturne n'écrase **jamais** une provision revue à la main.
- La resynchronisation nocturne produit un **rapport d'écarts de la période** ; la date de fin du parallèle est fixée par la compagnie à la mise en service *(défaut H-172 : date de fin fixée à la mise en service ; la nuit continue tant qu'aucune date n'est posée)*.
- L'heure de la resynchronisation est un paramètre (avant 6 h par défaut *(défaut H-173)*) ; une nuit non couverte est signalée « non couverte » dans le rapport.

#### FR-218 : Le feu vert de la reprise, module par module

Le **feu vert** de la reprise est donné **par module cible**. Tant qu'un écart reste ouvert sur les données vivantes d'un module, la reprise ne donne **pas** son feu vert, et la mise en service du module est refusée.

**Conséquences (testables) :**
- Le feu vert de `sinistres`, de `ged` et de `assurance` est rattaché aux **lots rejoués dans l'espace réel**, jamais à un lot de l'essai.
- Un écart ouvert, c'est : un objet vivant resté en erreur, un objet en trop, ou une valeur de contrôle différente ; les valeurs de contrôle de départ sont : nombre de sinistres ouverts, somme des provisions des sinistres ouverts, nombre de polices en vigueur, nombre de pièces rattachées *(défaut H-174 : valeurs de contrôle de départ, à fixer avec la compagnie)*.
- Les écarts de l'**historique** figurent au rapport et ne bloquent jamais le feu vert.
- Un feu vert se **retire** avant la mise en service par une action journalisée d'un détenteur du droit de valider, avec un motif ; le module repasse à « attendu ».
- Un lot se joue d'abord dans l'**espace d'essai** (répétition générale) ; le jour de la mise en service, le dossier d'installation (adaptateurs réglés, tables de correspondance, règles de traduction) est **rejoué** sur une source **fraîche**, et le lot est rejoué sans créer de doublon.
- La ligne de chaque module au bilan de mise en service ne passe au vert qu'à son feu vert (PRD moteur d'installation, §7).
- Le LC fictif sert à répéter la reprise dans l'espace d'essai (FR-202).
- Le **feu vert module par module** s'étend au **circuit `sinistres`**, comme à la reprise : une **liste de contrôle de mise en service** (entrées de la compagnie livrées, tests de recette passés, formation de FR-240 faite) précède le feu vert ; le feu vert est donné **par le PO et par la compagnie**, **jamais par défaut** ; **aucun module n'est retiré** du périmètre.

#### FR-219 : Ce que la compagnie doit fournir, et le premier risque

La reprise ne peut commencer que si la compagnie fournit certains éléments. **Si la reprise est en retard, incomplète ou mal rattachée, la promesse « retrouver un dossier en moins de 5 secondes » et « répondre pendant l'appel » ne tient pas le premier jour**, quelle que soit la qualité du reste : c'est le premier risque du projet *(défaut H-175 : premier risque désigné par l'équipe de rédaction ; à reporter au §12 et à confirmer à la séance d'immersion)*.

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
- Le bilan de préparation de la reprise liste ces éléments avec leur état (reçu, à recevoir, sans objet) et leur date ; le `DG` et `ADMIN` le lisent *(défaut H-176 : le bilan s'appuie sur le bilan du moteur d'installation ; à confirmer avec le PRD §7)*.
- Un élément absent à la date fixée à la séance d'immersion est signalé comme **décalant le premier jour** ; le PRD ne fixe pas de remplacement. Chaque entrée a une **date limite de livraison** et une **conséquence** précises (tableau ci-dessous) ; aucune fonction ne part en « bientôt » à cause d'une entrée manquante : le risque est **tracé**, pas un retrait de périmètre (FR-20).
- Sans les barèmes, le corporel fonctionne en **mode dégradé** (FR-24) : saisie manuelle motivée du montant arrêté, échéances légales actives, écart tracé *(action A-12 au §12.2)*.

| Entrée de la compagnie | Date limite de livraison | Conséquence si elle manque |
|---|---|---|
| Barèmes saisis (grilles de vétusté, barème corporel, grille de provision d'ouverture) | *(défaut H-177 : date fixée à la séance d'immersion ; sinon 4 semaines avant la mise en service)* | Le corporel fonctionne en **mode dégradé** (FR-24) ; la provision d'ouverture est saisie à la main avec motif. |
| Délégations réelles (matrice, seuils) | idem | Les défauts de D8 s'appliquent et sont marqués « non confirmés ». |
| Liste des experts agréés | idem | La désignation d'un cabinet est impossible (FR-178) ; le panel interne de la démonstration n'est jamais utilisé en réel. |
| Documentation du LC (API, formats) | idem | L'échange passe par les fichiers (FR-197) ; le connecteur du LC réel est livré après sa connaissance. |
| Volumes (dossiers par an, stock en cours, archives) | idem | Le dimensionnement de D20 reste une hypothèse balisée (FR-23). |

- Sans la liste des experts agréés, la désignation d'un cabinet est impossible (FR-178) ; le panel interne de la démonstration n'est jamais utilisé en réel.
- Chaque élément reçu est daté et rattaché au dossier d'installation ; il ne contient aucune donnée personnelle sans nécessité.
- Un test de la **répétition générale** (FR-218) est exécuté sur les éléments réellement reçus ; son résultat est lu au comité de pilotage *(défaut H-178 : comité de pilotage, proposé par la proposition v2)*.

---

## 7. Partie 4 — Les modules partagés et cadrés

**Règles de lecture.** Ces modules ont déjà leur PRD, leur spine et leur manifeste, ou sont cadrés par le PRD distributeur et le PRD microfinance ; ce PRD n'en réécrit rien. Chaque fiche dit ce qui s'applique tel quel, puis les **écarts de l'assurance**, chacun devenu une exigence. Un écart est **à porter au PRD du module** : son propriétaire l'amende ou le refuse ; tant que ce n'est pas fait, l'exigence tient ici et se code dans le module qui la porte, jamais à sa place. Les identifiants `FR-Pnn`, `FR-Nnn`, `FR-Rnn` renvoient au PRD du module ; `PRD-D FR-n` au PRD distributeur ; `PRD moteur FR-n` au PRD du moteur d'installation ; `Reprise FR-n` et `Connecteurs FR-n` aux PRD Reprise et Connecteurs. Un identifiant `FR-n` sans préfixe désigne une exigence de ce PRD.

| Module | Code | Réf. M | PRD | Manifeste |
|---|---|---|---|---|
| Encaissements et moyens de paiement | `paiement` | M33 | `prd-paiement-service-2026-08-02` + amendement 2026-09-21 | `manifestes/paiement.manifest.ts` |
| Canaux et notifications | `notification` | M34 | `prd-notification-service-2026-08-02` | `manifestes/notification.manifest.ts` |
| Tableau de bord et pilotage | `dashboard` | M28 | PRD-D §6.8 ; spécifié pour l'assurance au §6.7 | `manifestes/dashboard.manifest.ts` |
| IA commune | — | — | `prd-assistant-ia-2026-08-02`, note de vision `vision-ia-sectorielle-2026-11-10`, PRD moteur FR-24 à FR-31 | — |
| Installation chez le client | moteur d'installation | — | `prd-moteur-installation-2026-11-09` | — |
| Réseau, sites et guichets | `reseau` | M01 | `prd-reseau-zones-2026-08-02` | `manifestes/reseau.manifest.ts` |
| Connecteurs | `connecteurs` | M43 | `prd-connecteurs-2026-11-10` | `manifestes/connecteurs.manifest.ts` |

`pdv`, `catalogue` et `stock` ne concernent pas l'assurance. La reprise des archives est le module `reprise` (M44), cadré au §6.8.

### 7.1 `paiement` : exécuter les règlements

#### FR-220 : Paiement : `sinistres` ordonne, `paiement` exécute

**Ce qui s'applique tel quel.** Deux fournisseurs, PI-SPI et FedaPay, derrière un même contrat, routés par pays, devise et méthode (FR-P08, FR-P09, FR-P12 ; PRD-D FR-205) ; le paiement sortant : un ordre est préparé, validé par une **autre** personne (un second `CPT`, et au-dessus du seuil `reglement.second_controle_seuil`, le `DG` : FR-7), part une fois, depuis le compte de l'organisation sous ses identifiants (FR-P65 à FR-P69, NFR-1d) ; l'idempotence et le même `txId` rejoué (FR-P19 à FR-P22) ; l'essai : paiements de test seulement (PRD-D FR-24). « Mobile Money » s'affiche « paiement mobile » ou le mode précis (PRD-D FR-206).

**Écarts de l'assurance, à porter au PRD `paiement`.** Réalise UJ-3 et UJ-4.

**Conséquences (testables) :**
- **`sinistres` émet l'ordre de règlement** après décision et accord enregistré ; **`paiement` l'exécute** (virement, PI-SPI, paiement mobile) ou **l'enregistre** (chèque). Aucun ordre ne part sans accord enregistré de l'assuré (§5.8, FR-90) et, **au corporel VTM, aucun règlement n'est émis avant la fin du délai de dénonciation de 15 jours** (art. 235) : la condition `DELAI_DENONCIATION_ECOULE` garde les transitions d'émission (FR-14).
- Un dossier peut avoir **plusieurs règlements** (acompte, offre provisionnelle, plusieurs bénéficiaires, honoraires d'expert). Chaque règlement a **son état** (`A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`) et **sa quittance** (`PRETE`, `EDITEE`, `SIGNEE`, `REMISE`, `ENCAISSEE`).
- Le dossier passe à `REGLE` quand le **reste à payer** de l'indemnité validée est **zéro** (§3).
- Un ordre ne part que par **un seul** moyen. Chaque règlement porte une **clé d'idempotence** unique, transmise à `paiement` et **gardée à chaque nouvelle tentative** : un test envoie deux fois le même ordre et vérifie que l'argent ne part qu'une fois.
- Un règlement dont l'issue n'est pas confirmée par `paiement` passe à l'état `INCONNU`. Il **ne se relance pas et ne s'annule pas** tant que le rapprochement ne l'a pas tranché (`PAYE` ou `ECHEC` confirmé), et il est **rapproché du relevé du fournisseur avant toute réémission**.
- `ECHEC` n'est posé que sur **refus explicite** du fournisseur ; il ne se relance qu'avec la **même clé**, après confirmation de `paiement`. Un règlement `EN_COURS` ou `INCONNU` se résout d'abord : il ne s'annule pas.
- Le droit de **décider** d'un règlement et le droit de **l'exécuter** sont **distincts** : le comptable n'a aucun droit de décision (FR-7).
- Les **honoraires d'expert** sont un règlement comme un autre : visés par `RESP` (jamais par `CPT`, qui émet seulement), et jamais pour un expert interne (aucun honoraire à engager).
- En espace d'essai, aucun ordre réel ne part ; les paiements sont marqués « test » (PRD-D FR-24).

#### FR-221 : Le chèque est enregistré, pas exécuté

Le **chèque** est le moyen de règlement du premier jour dans la proposition v2 (« de la déclaration au chèque »). **CPT saisit** la banque, le numéro et le montant ; sans numéro, l'émission est refusée. Prospera **imprime la lettre-chèque** sur un gabarit si la compagnie l'utilise ; sinon le chèque est rempli à la main et son **numéro saisi** *(défaut H-179 : la compagnie a ou non un gabarit bancaire d'impression ; à confirmer)*. **Au corporel, le gabarit de lettre-chèque est imposé.** Pour un chèque rempli à la main, `ACC` saisit à la remise le **nom et le montant lus sur le chèque** ; le serveur les compare à l'ordre ; une **copie du chèque (photo)** est obligatoire au dossier. `CHEQUE_A_REMETTRE` ne vaut que pour le chèque. La **remise** se fait au guichet contre la **quittance signée** et l'**identité du retirant** (nom et numéro de pièce d'identité), tous deux obligatoires. Réalise UJ-3.

**Conséquences (testables) :**
- Un test tente d'émettre sans numéro de chèque : refus « Indiquez le numéro du chèque émis ». Un test tente la remise sans identité ou sans numéro de pièce d'identité : refus, avec le champ nommé.
- **Au corporel**, le chèque est libellé **exclusivement au nom de la victime ou des ayants droit**, même en présence d'un conseil (Code CIMA art. 232) ; un libellé à un tiers (garage, conseil) est **bloqué** sans mandat enregistré.
- Un règlement à un **mineur ou à un incapable** exige la procédure de l'art. 234 (avis préalable au juge des tutelles ou au conseil de famille) avant paiement ; l'émission est bloquée tant qu'elle n'est pas tracée (§5.8, FR-91).
- Un chèque non retiré **depuis plus de 7 jours** est relancé (liste d'appels du matin) ; **depuis plus de 30 jours**, il est signalé comme exposition ; une circulation de chèque de plus de 21 jours est signalée (valeurs de la démo, annexe D ; calibrées selon FR-5).
- L'état **mensuel** des chèques émis, remis et en attente est produit pour la comptabilité, avec détection des écarts **avant** clôture (FR-224).
- Le **numéro** de chèque et sa **banque** ne sont jamais posés d'office : un test vérifie qu'ils viennent d'une saisie de CPT.
- Un chèque rempli à la main dont le nom ou le montant lu à la remise diffère de l'ordre est refusé (`CHEQUE_NON_CONFORME_A_L_ORDRE`) ; une remise sans photo du chèque est refusée ; au corporel, un chèque hors gabarit est refusé.
- Un **chèque annulé** exige l'**opposition bancaire enregistrée** (référence, date) ou la restitution physique du chèque avant tout chèque de remplacement : le chèque passe à l'état `CHEQUE_EN_OPPOSITION` ; sans cette opposition, l'émission du chèque de remplacement est refusée (`OPPOSITION_NON_ENREGISTREE`).

#### FR-222 : Virement bancaire et PI-SPI

Le **virement bancaire** et le règlement par **PI-SPI** sont exécutés par `paiement`. L'ordre est préparé par CPT après la décision, validé par **une autre** personne (un second `CPT`, distinct de celui qui prépare, et au-dessus du seuil `reglement.second_controle_seuil` le `DG`, FR-7), et part une seule fois. `ORDRE_EMIS` passe à `REGLE` à la **confirmation de `paiement`** ; la **quittance est signée avant**, au guichet ou par acceptation électronique avec code à usage unique *(point juridique J-24 : l'acceptation électronique n'est offerte qu'après validation juridique, FR-24 ; sinon la quittance se signe au guichet)*. Les **banques** sont jointes par PI-SPI : le bénéficiaire d'un virement vers une autre banque est une adresse du schéma ; un virement vers un compte que le schéma ne joint pas est préparé par `paiement` et **exécuté par la comptabilité de la compagnie** auprès de sa banque, sa confirmation étant saisie *(défaut H-180 : la compagnie n'a pas de cœur bancaire ; à revérifier à l'adhésion à PI-SPI)*. Réalise UJ-3.

**Conséquences (testables) :**
- Une **modification des coordonnées bancaires** du bénéficiaire dans les 5 jours qui précèdent un paiement est une **alerte** au responsable et bloque l'ordre jusqu'à sa vérification (valeur de la démo, annexe D) ; celui qui a modifié les coordonnées n'émet pas l'ordre (FR-7).
- Un virement suit le **délai de coupure** de la banque (paramètre).
- La **confirmation manuelle** d'un virement hors PI-SPI exige un **justificatif bancaire joint** et un second `CPT` ; elle ne peut pas être faite par celui qui a lancé le virement.
- Un virement n'est jamais payé deux fois : le contrôle de doublon porte sur le **bénéficiaire et le sinistre** (date, police, immatriculation), non sur le montant, sur 30 jours (valeur de la démo, annexe D ; définition de FR-224).
- Le statut juridique d'une initiation de paiement par une compagnie d'assurance est **à faire confirmer par un juriste** (FR-24).

#### FR-223 : Mobile Money sortant : T-Money et Flooz

Les règlements par **Mobile Money** (T-Money, Flooz ; opérateurs paramétrables par pays) sont exécutés par `paiement`, avec les mêmes règles que le virement (FR-222). `paiement` **n'a pas encore d'adaptateur Mobile Money sortant** : cet adaptateur est **à chiffrer au plan**, comme pour l'IMF. Réalise UJ-3.

**Conséquences (testables) :**
- **Février.** Tant qu'un opérateur n'a pas d'adaptateur sortant, son canal est **« bientôt »** pour ce pays, le dossier propose un autre moyen (chèque, virement), et **rien n'est simulé** (FR-22). Dans l'essai, un paiement mobile est **de test**, marqué « test » (PRD-D FR-24).
- Le Mobile Money est un moyen à **vérification renforcée** : le numéro et l'identité du porteur sont saisis et rapprochés du bénéficiaire du dossier *(point juridique J-25 : le Règlement CIMA sur la LBC/FT ne cite pas le Mobile Money ; traitement par analogie aux moyens à vérification minutieuse, à valider par le juriste)*.
- Un règlement Mobile Money au corporel est libellé au nom de la victime ou des ayants droit (art. 232) ; un numéro dont le porteur n'est pas le bénéficiaire est bloqué.
- Le statut juridique du règlement par Mobile Money par une compagnie d'assurance est **à faire confirmer par un juriste** (FR-24).

#### FR-224 : Rapprochement des règlements

Le **rapprochement** des chèques, des virements et des paiements mobiles se fait dans `paiement`, par CPT, **pas par la comptabilité officielle** (qui est hors de Prospera, FR-2). Les paiements **non rapprochés** forment une file ; un écart de rapprochement ancien de **60 jours** est une alerte (valeur de la démo, annexe D). Le rapprochement fournit l'**état mensuel consolidé** (chèques émis, remis, en attente ; paiements mobiles ; détection des écarts avant clôture) et son export au format de la comptabilité de la compagnie. Une **période comptable ne se clôt pas** tant qu'il reste un règlement non rapproché, une remise sans accusé signé ou un chèque émis non retiré au-delà de 7 jours. Les règlements de nature `HONORAIRES` se rapprochent comme les autres. Le **doublon de règlement** a une **définition unique** (la même que FR-100) : même bénéficiaire et même **sinistre** (date, police, immatriculation), **non le montant**. Réalise UJ-7.

**Conséquences (testables) :**
- Chaque règlement émis finit **rapproché ou en écart** : un test émet un lot de règlements, en rapproche une partie et vérifie que le reste est dans la file, avec son âge.
- Un écart de plus de 60 jours lève une alerte à CPT et à RESP (§6.7).
- Le **doublon** de règlement (même bénéficiaire et même sinistre, non le montant) sur 30 jours est détecté avant émission ; **une concentration d'émission** sur une seule personne au-delà d'une part du volume (défaut : 60 %, valeur de la démo) est signalée à AUD.
- Celui qui rapproche n'est pas celui qui a émis le règlement (FR-7).
- La clôture d'une période comptable est refusée s'il reste un règlement non rapproché, une remise sans accusé signé ou un chèque émis non retiré depuis plus de 7 jours ; un règlement `HONORAIRES` non rapproché bloque la clôture comme les autres.
- Un contrôle **mensuel** recherche les numéros de chèque annulés non rapprochés ; chaque écart est une alerte à `CPT`, `RESP` et `AUD`.
- L'état mensuel et l'export sont produits sans ressaisie (FR-2) ; leur format suit le contrat d'échange (annexe C).

#### FR-225 : Plafond d'espèces et LBC/FT

Un règlement en **espèces** est plafonné à **500 000 FCFA** (paramètre) ; au-delà, le règlement passe par un moyen traçable. La **lutte contre le blanchiment et le financement du terrorisme** s'applique aux règlements de sinistres. Le Règlement CIMA n° 0004/CIMA/PCMA/PCE/SG/08, lu et sûr, **recommande** que le système permette (le texte dit « devrait permettre ») de suivre les **règlements de sinistres** par date, montant, origine, destination et cumul par client, de recenser les clients qui dépassent le minimum cumulé fixé par la réglementation, et de **détecter les opérations suspectes** (art. 4.5). L'art. 11 liste les moyens à vérification minutieuse (espèces, virements, chèques de banque, chèques endossés…) ; son application aux règlements de sinistres est une **transposition, à confirmer par le juriste** (FR-24). Le texte impose la **conservation dix ans au moins** de l'identité, de la forme du versement ou du retrait, des dates et montants, de l'origine et de la destination des fonds et de la piste d'audit (art. 13). Réalise UJ-3 et UJ-7.

Le **responsable LBC** est une désignation faite par `AUD` (un rôle ou une personne), **jamais par `ADMIN` seul**. Chaque alerte a son destinataire écrit *(défaut H-181 : répartition proposée ; à confirmer à la séance d'immersion)* :

| Alerte | Reçoit |
|---|---|
| Bénéficiaire différent de la victime | responsable LBC ; `AUD` en copie |
| Espèces élevées | responsable LBC ; `AUD` en copie |
| Fractionnement de règlements sous un seuil | responsable LBC ; `RESP` du dossier |
| Ayant droit douteux | responsable LBC ; `RESP` du dossier |
| Changement de coordonnées avant paiement | `RESP` (vérification, FR-222) ; responsable LBC en copie |
| Cumul par client au-dessus du seuil national | responsable LBC ; `AUD` |

**Conséquences (testables) :**
- Le journal des **règlements de sinistres** donne, par bénéficiaire réel (avec sa pièce d'identité archivée), le moyen de paiement, l'origine, la destination et le **cumul par client** ; il s'exporte pour le responsable LBC/FT.
- Un test émet un règlement en espèces au-dessus du plafond : refusé avec un code nommé.
- **Alertes** : bénéficiaire différent de la victime, espèces élevées, fractionnement de règlements pour passer sous un seuil, ayant droit douteux, changement de coordonnées avant paiement. Chacune ouvre un dossier de contrôle et va à son destinataire du tableau.
- Le **seuil cumulé** de la réglementation nationale est un paramètre **à saisir** quand le texte national aura été obtenu (annexe D) ; il n'est pas écrit en dur *(défaut H-182 : la valeur nationale n'est pas trouvée ; le paramètre est vide par défaut et l'alerte de cumul est inactive tant qu'il l'est)*. Tant qu'il est vide, le contrôle de cumul (contrôle n° 6 de FR-100) s'affiche « **non actif** » à l'écran.
- Un test désigne un responsable LBC avec le compte `ADMIN` seul : refusé ; avec `AUD` : accepté.
- Un **export annuel** des alertes et de leurs suites est produit pour le responsable LBC et `AUD`.
- Un **dossier de soupçon** (alerte interne, responsable LBC, déclaration à la cellule nationale de renseignements financiers) est **préparé et tracé** par Prospera avec horodatage ; **la déclaration est faite par le responsable interne**, pas par Prospera ; la conservation est de dix ans. La règle de non-information du client est **à confirmer par le juriste** (FR-24).
- Le **plafond d'espèces national** des assureurs n'a pas été trouvé : 500 000 FCFA est la valeur de la démo *(point juridique J-26 : à confirmer par le juriste)*.

### 7.2 `notification` : prévenir l'assuré

#### FR-226 : Notification : SMS, WhatsApp, e-mail et cloche, servis par le relais

**Ce qui s'applique tel quel.** Canaux e-mail, SMS, WhatsApp, in-app, repli « WhatsApp, sinon SMS » (FR-N17, FR-N18, FR-N21 ; PRD-D FR-249) ; modèles versionnés et approuvés par canal (FR-N09 à FR-N16) ; envoi de masse avec échantillon, reprise, plafond (FR-N28 à FR-N34) ; réponses entrantes routées par contexte vers le module qui a parlé (FR-N41 à FR-N45) ; consentement et désabonnement par personne, canal et nature (FR-N46 à FR-N50) ; journal et accusés (le « lu » n'existe pas pour un SMS) ; en essai, l'envoi est intercepté et compté (PRD-D FR-214).

**Écarts de l'assurance, à porter au PRD `notification`.** Réalise UJ-2.

**Conséquences (testables) :**
- **Personnel** : cloche et e-mail. **Assuré, victime, ayants droit** : SMS, WhatsApp et e-mail ; **courtier, coassureurs, assureur du tiers** : e-mail. Français d'abord (FR-18).
- **Suivi de distribution** : `notification` rend, pour le courrier et le SMS, un **état de distribution** (remis, retourné, non remis) lisible par le dossier ; un test simule un pli retourné et un SMS non remis et les retrouve sur le dossier.
- Les **modèles WhatsApp** de la compagnie (accusé de déclaration, pièces manquantes, offre envoyée, chèque à retirer, règlement effectué) sont **soumis à l'approbation avant la mise en service** (FR-N11) : le délai est externe ; un modèle non approuvé n'est jamais choisi, le SMS part, et le journal le dit.
- Le **numéro WhatsApp Business** et la **passerelle SMS** (identifiant d'expéditeur enregistré) sont **ceux de la compagnie et à sa charge** ; leurs identifiants sont chiffrés ; les coûts d'envoi sont mesurés (FR-N57 à FR-N63).
- Les **relances de pièces** sont espacées d'un intervalle paramétrable (valeur de la démo : 5 jours) ; après trois relances sans effet, Prospera propose au gestionnaire un **arbitrage** plutôt qu'une relance de plus (valeur de la démo, annexe D).
- Les **réponses entrantes** (accusés, réponses des assurés) passent par le **relais Money Vibes** (FR-239) : le serveur de la compagnie les tire, il n'est jamais joint directement.
- La matrice « qui est prévenu de quoi » est à l'annexe B ; `notification` ne la porte pas.

#### FR-227 : Aucune donnée de santé dans un message

Un message à l'assuré ne contient **jamais** de donnée de santé : un SMS ou un message WhatsApp passe par un opérateur tiers. Le message dit qu'**une pièce est attendue** ou **reçue**, jamais sa nature médicale, ni un taux, ni un diagnostic. Réalise UJ-4.

**Conséquences (testables) :**
- Un test déclenche chaque modèle de message du volet corporel et n'y trouve aucune donnée de santé : ni libellé de certificat, ni taux d'incapacité, ni lésion.
- Aucun message (SMS, WhatsApp, e-mail) ne cite la **gravité**, la **nature des lésions** ni un **texte libre** : un message ne contient que des contenus autorisés (statut, référence, pièce attendue ou reçue, date, lieu, montant) et des **motifs codés seulement** (liste fermée, jamais libre).
- Les modèles sont revus par RESP et le juriste avant approbation (FR-24).
- Un message qui demande une pièce médicale dit « un document médical » sans plus ; le détail est donné **au guichet** ou **par courrier** à l'assuré *(défaut H-183 : règle de minimisation ; à confirmer à la séance d'immersion)*.

### 7.3 `dashboard` : le pilotage

#### FR-228 : Tableau de bord : un cockpit par rôle, spécifié au §6.7

**Ce qui s'applique tel quel.** Le module `dashboard` (M28) ne possède aucune donnée : un **cockpit par rôle relu des modules** (PRD-D FR-165), les **alertes du jour** (PRD-D FR-167), les **décisions à trancher** (PRD-D FR-168), le **rapport de direction** (PRD-D FR-169), les **PDF et envois** (PRD-D FR-170), les **exports** (PRD-D FR-171). **Le pilotage de l'assurance (brief du matin, charge, délais légaux qui expirent, dossiers bloqués, sans action depuis 30 jours, pièces attendues, règlements en attente, qualité du dossier, simulation « et si… », plan de contrôle) est spécifié au §6.7** : cette fiche n'en réécrit rien.

**Écarts de l'assurance.** Réalise UJ-6 et UJ-7. La vue finance et la vue exploitation sont spécifiées en FR-229.

**Conséquences (testables) :**
- Chaque chiffre d'un cockpit est calculé depuis les dossiers (FR-17) et affiche la date de sa dernière lecture du LC quand il en dépend (FR-2).
- Chaque rôle a **son** cockpit : la direction, le responsable, le gestionnaire (sa corbeille), le recours, le contrôle interne, l'accueil, la comptabilité ; aucun rôle ne voit le cockpit d'un autre (FR-6, PRD-D FR-7).
- Le **tableau de bord n'affiche pas de primes** ni de ratio sinistres sur primes : les primes relèvent du logiciel de la compagnie (FR-2) ; un reliquat de la démo qui en affiche est retiré *(défaut H-184 : confirmé par le README de la démo ; à confirmer à la séance d'immersion)*.
- Sans `dashboard` installé, les écrans métier fonctionnent et l'emplacement du cockpit s'affiche vide (FR-20).

#### FR-229 : Vue finance et vue exploitation

Le cockpit offre deux vues propres à ceux qui pilotent l'argent et la machine. Réalise UJ-6 et UJ-8.

- La vue **finance** (`CPT`, `DG`) montre : les **engagements à décaisser** en deux colonnes séparées, **exigible** et **à confirmer**, jamais sommées ; les provisions ; les honoraires à payer ; les chèques en circulation ; les rapprochements en retard. Le DAF de la compagnie s'en sert par ces deux rôles.
- La vue **exploitation** (`ADMIN`, DSI) montre l'**état technique seulement** : sauvegardes, versions, alertes de service, espace disque. Elle ne montre **aucune donnée métier**.
- Une vue **réseau** (courtiers, réclamations) est **hors du périmètre du premier jour** *(défaut H-185 : vue réseau hors périmètre du premier jour, dite au §10.2 ; à confirmer à la séance d'immersion)*.

**Conséquences (testables) :**
- Un test ouvre la vue finance avec `CPT` et `DG` : les engagements s'affichent en deux colonnes ; le total n'additionne jamais l'exigible et le « à confirmer ».
- Un test ouvre la vue finance avec chaque autre rôle : refus sans donnée.
- Un test ouvre la vue exploitation avec `ADMIN` : il n'y trouve ni nom d'assuré, ni montant de dossier, ni pièce ; avec un rôle métier : refus.
- Chaque chiffre de la vue finance se recalcule depuis les données (FR-17) et affiche sa fraîcheur (FR-207).

### 7.4 L'IA commune

**Ce qui s'applique tel quel.** La note de vision `vision-ia-sectorielle-2026-11-10` : l'IA est une **famille de modules à part**, commune à toutes les verticales ; elle apprend de leurs angles, sous le consentement de chacune, par **apprentissage fédéré** (PRD moteur FR-26 à FR-31 ; les modèles de la compagnie sont intouchables, PRD moteur FR-24). Ce PRD **n'écrit pas les modèles** : il **fournit les données**, **affiche les propositions**, **héberge l'instance locale** de l'IA commune et **marche sans elle** (emplacement vide). Les règles communes (provenance, l'IA propose et l'humain décide, jamais bloquante, jamais de montant en corporel, le mot « IA » réservé à un modèle) sont celles de FR-10 à FR-12 et ne sont pas répétées.

**Où elle tourne (décision du PO).** Chez la compagnie tourne une **instance locale** de l'IA commune, sur son serveur. Cette instance : (1) **prédit** à partir des seules données de la compagnie ; (2) **enregistre l'écart** entre ses prédictions et ce qui arrive ; (3) **anonymise** ces écarts ; (4) les **renvoie** à l'IA commune pour l'apprentissage, sous le consentement de la compagnie ; (5) **reçoit ses mises à jour** par un **tunnel sécurisé sortant**. Le Copilot et la recherche en langage naturel (§6.1) tournent dans cette instance.

#### FR-230 : Ce que la compagnie fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement

La compagnie **fournit** à l'IA commune, sous son consentement écrit (FR-19), des données **par finalité** : dossiers et pièces (par lecture sur place), devis et garages, expertises, règlements, recours, liens entre dossiers, délais ; elle **reçoit** des propositions : lecture de pièces, contrôles, relances, résumés, analyses de devis, explications de montant, signaux de fraude, brief du matin, simulation (FR-10). Réalise UJ-6.

Les **finalités** consommées par les modules de ce PRD sont déclarées module par module à la clause C11 de l'annexe A. Les finalités de **cette partie** sont proposées *(défaut H-186 : noms de finalités proposés ; à valider avec le contrat de module)* : `declaration-assistee`, `lecture-pieces`, `controle-pieces`, `relance-pieces`, `resume-dossier`, `recherche-langage-naturel`, `preremplissage-instruction`, `analyse-devis`, `explication-montant`, `detection-fraude`, `redaction-courriers`, `recours-assiste`, `brief-du-matin`, `qualite-et-simulation`, `orientation-expertise`, `completude-rapport`, `comparaison-portefeuille`.

**Conséquences (testables) :**
- **Sans consentement**, rien ne sort des serveurs de la compagnie vers l'IA commune : l'instance locale prédit, enregistre ses écarts et sert le Copilot sur les seules données de la compagnie, sans rien renvoyer ; un test sur une installation sans consentement le vérifie (FR-12).
- Le consentement est **par finalité** et **retirable** : le retirer arrête l'envoi des écarts qui servent cette finalité ; le retrait est tracé (FR-19).
- La compagnie choisit le **niveau d'apprentissage** parmi ceux que le PRD moteur ouvre ; le choix est affiché dans l'écran des consentements.
- Chaque emplacement d'IA est **vide sans l'IA commune** (instance locale arrêtée) : un test coupe l'instance et vérifie qu'aucun parcours ne bloque et que les règles explicables restent servies, en le disant (FR-10).
- Un modèle affiné sur les données de la compagnie n'est jamais lu par Money Vibes (PRD moteur FR-24).

#### FR-231 : L'apprentissage sur l'historique repris, le réentraînement mensuel, le rapport mensuel

L'IA commune est **calibrée sur 3 à 5 années d'historique** de la compagnie, **repris par `reprise`** (§6.8), pour apprendre ses coûts, ses garages, ses pièces et ses schémas de fraude ; l'apprentissage commence pendant la reprise des archives. Les **résultats sont vérifiés par les gestionnaires** (accepter, modifier, rejeter : FR-12). Le **réentraînement est mensuel**, et un **rapport mensuel de performance** est remis au responsable et à la direction : par usage, part des propositions acceptées, modifiées, rejetées, écarts de calibrage. **L'IA ne se met pas à jour seule.** Réalise UJ-6 et UJ-8.

**Conséquences (testables) :**
- Le calibrage prend un **historique de 3 à 5 ans** (paramètres, annexe D) ; avant calibrage, les capacités servent des **règles explicables** et le disent (FR-10).
- Le réentraînement a lieu **une fois par mois** ; un test le déclenche, vérifie que le modèle d'avant est conservé et que le nouveau est **essayé** avant promotion (FR-233).
- Le **rapport mensuel** est produit sans saisie : un test le génère sur le jeu de démonstration et y retrouve, pour chaque usage de FR-10, les trois parts.
- La **configuration du serveur** inclut l'instance locale : elle tourne sur une machine ou une machine virtuelle à part, dont le dimensionnement est **chiffré au devis des serveurs avec la compagnie** *(défaut H-187 : modèle de la microfinance ; la v4 parle d'un serveur « capable d'héberger à terme le calcul de l'IA locale »)*.
- Le calibrage ne lit pas les données de santé (FR-232).

#### FR-232 : Rien de nominatif ni de médical ne sort

Ce qui sort, avec consentement, est un **écart anonymisé** : finalité, version du modèle, valeur prédite, valeur observée, caractéristiques agrégées ou généralisées. **Aucun nom, téléphone, identifiant ni montant individuel identifiant, et aucune donnée de santé, n'en fait partie.** Rien de nominatif ni de médical ne part vers l'IA commune ; le relais ne porte aucune donnée médicale (FR-239). **Aucun écart construit à partir d'une donnée de santé ne sort**, même anonymisé *(défaut H-188 : lecture stricte de « aucune donnée médicale ne sort » ; à confirmer)*. Le **tunnel sortant** n'est ouvert que par l'instance : **aucun port entrant** n'est ouvert chez la compagnie.

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
- Une mise à jour n'est **jamais appliquée sans la date choisie** par la compagnie, sauf un **correctif de sécurité critique**, que la compagnie peut accepter dans un délai fixé par le contrat (défaut : 72 heures ; un correctif réglementaire est livré avant la date d'effet du texte) *(défaut H-189 : valeurs reprises de la microfinance ; à confirmer)*.
- La coupure de service d'une mise à jour est de **15 minutes au plus** (PRD moteur NFR-9).
- Un **correctif de délai légal** (nouvelle version du référentiel, FR-14) est livré comme une mise à jour de référentiel : le dossier jugé selon sa date de survenance garde l'ancienne version.
- Le **régime de licence** (usage perpétuel ou non) et le contrat de maintenance sont des clauses du **contrat commercial**, **hors de ce PRD** ; ce PRD n'engage ni prix ni durée *(défaut H-190 : gel après 30 jours sans contact et version figée comme les autres installations sur site (PRD moteur FR-15, FR-32) ; à confirmer au contrat)*.

#### FR-236 : Sauvegarde quotidienne, restauration testée, conservation

La **sauvegarde est automatique et quotidienne** (proposition v2), sur le NAS et sur un second support dans les locaux de la compagnie (3-2-1, PRD moteur NFR-7). La **restauration est testée** avant la mise en service, puis à intervalle régulier (défaut : **une fois par mois**, *(défaut H-191 : modèle de la microfinance)*) et l'échec allume un voyant. Les valeurs de perte maximale (RPO) et de reprise (RTO) sont celles du PRD moteur (NFR-7) ; la proposition v2 n'en chiffre aucune. Valeurs retenues : **RPO 1 h, RTO 4 h** (spine du moteur, AD-16 ; spine assurance, AD-25) *(défaut H-192 : RPO 1 h, RTO 4 h, alignés sur la spine du moteur AD-16)* (§12). La **rétention technique** des sauvegardes n'est **pas** la conservation réglementaire : le **journal, les dossiers et les pièces** sont conservés **dix ans au moins** (Code CIMA art. 404) dans la base de l'installation et ses archives, pas seulement dans des sauvegardes qui tournent. **Après une restauration**, les **compteurs** (références `DEC-`, numéros de chèque, numéros de quittance) se reprennent au **maximum** entre la base restaurée et ce que détiennent le LC, `paiement` et le relais. L'instance passe en état « **restauration en cours : aucune émission** », qui bloque toute émission de règlement, de chèque et de quittance jusqu'au rapprochement ; les déclarations ne se refusent pas (FR-39) : une déclaration saisie pendant cet état reçoit sa référence `DEC-` dès que le compteur est repris. Réalise UJ-8.

**Conséquences (testables) :**
- Une sauvegarde automatique a lieu chaque jour ; un test arrête le serveur, restaure la sauvegarde la plus récente sur un serveur de référence et vérifie le retour de l'état du dernier jour, **y compris les chaînages du journal** (FR-13).
- Après une restauration, avant de reprendre tout règlement, l'instance **rapproche les règlements de la période perdue** du relevé du fournisseur ; un règlement dont l'issue est inconnue passe à `INCONNU` et n'est pas réémis avant ce rapprochement (FR-220).
- Après une restauration, un test crée un règlement, un chèque et une quittance : leurs numéros reprennent au maximum entre la base restaurée et le LC, `paiement` et le relais ; aucun numéro n'est réutilisé.
- Pendant l'état « restauration en cours : aucune émission », toute émission de règlement, de chèque ou de quittance est refusée ; elle redevient possible après le rapprochement.
- La rotation des sauvegardes n'efface jamais une donnée soumise à la conservation de dix ans.
- L'effacement d'une donnée **sous conservation** est refusé avec un code nommé (FR-19).
- Un export d'archive d'un dossier, d'un assuré ou d'une période se fait sur un support de la compagnie, avec une somme de contrôle.

#### FR-237 : L'accès des guichets au serveur central

Les guichets et les sites accèdent au serveur central **par navigateur, sur le réseau de la compagnie** (liaison privée ou dédiée, **à la charge de la compagnie**). Le guichet travaille **en ligne**. Les **hypothèses** de dimensionnement retiennent **un site central et des guichets** (FR-23). Quand la liaison d'un guichet tombe, le repli est un **formulaire papier de secours numéroté** : la déclaration est saisie plus tard, avec une **double date** (FR-34), et sa référence `DEC-` est attribuée à la saisie différée et rappelée sur l'accusé (FR-39 : une déclaration ne se refuse jamais). Le **portail du cabinet d'expertise externe** n'est pas servi par ce serveur : il est hébergé par le relais (FR-239). Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le port du serveur est joignable depuis **le réseau interne de la compagnie et ses guichets**, jamais depuis internet ; le cabinet d'expertise externe n'atteint que son portail, hébergé par le relais (FR-239), jamais ce serveur.
- Quand la liaison d'un guichet tombe, l'écran affiche « hors liaison » et ne simule rien ; la saisie de la déclaration n'est pas faussement acceptée ; au retour de la liaison, rien n'est perdu.
- Un guichet hors liaison remet un **formulaire papier numéroté** ; à la saisie différée, la déclaration porte sa **double date** (survenance, saisie), reçoit sa référence `DEC-` et l'accusé la rappelle ; un test saisit le formulaire n° N après la coupure et vérifie qu'aucune référence n'a été attribuée avant.
- Le scan de pièces au guichet passe par le **poste de numérisation** (§6.2) ; une pièce déposée sans liaison n'est pas rattachée à un dossier avant le retour de la liaison.
- La plateforme est accessible **depuis les postes existants** de la compagnie (navigateurs récents ; appareils de référence fixés à la recette).
- Aucune exigence de bande passante n'est posée avant la taille réelle de la compagnie (FR-23).

#### FR-238 : L'exploitation est faite par l'équipe informatique de la compagnie, qui ne lit pas le métier

L'installation est **exploitée par l'équipe informatique de la compagnie** (sa DSI), pas par celle de Money Vibes. Elle porte le rôle **ADMIN** (FR-6) : plusieurs personnes, pas une seule. ADMIN **crée les comptes, règle les paramètres, installe et promeut les mises à jour, surveille les sauvegardes** ; elle **ne lit aucune donnée métier**. Le système d'exploitation et les correctifs de l'hôte restent à la charge de la compagnie. Réalise UJ-8.

**Conséquences (testables) :**
- Un test ouvre avec ADMIN chaque écran métier : refus sans donnée (FR-6). L'export et la restauration passent par l'outil d'administration, sans ouvrir de table métier.
- La création d'un administrateur et l'attribution d'un droit d'instance demandent **deux personnes** *(défaut H-193 : règle reprise de la microfinance ; à confirmer)*.
- ADMIN voit des **comptes, des états, des motifs de rejet** (par exemple le rapport de reprise), pas le contenu d'un dossier (UJ-8).
- Un **manuel d'exploitation** (démarrage, arrêt, mise à jour, restauration, supervision, astreinte) est livré à l'installation ; la supervision locale est lisible sans internet : l'état des services, des sauvegardes, de l'échange avec le LC, du tunnel de l'IA commune.
- Un événement de l'installation (échec de mise à jour, sauvegarde en échec, relais injoignable) est une alerte à ADMIN.

#### FR-239 : Le relais Money Vibes, parce qu'aucun port n'est ouvert chez la compagnie

Le PRD moteur interdit tout port entrant d'internet sur une instance sur site. Or trois chemins de la compagnie viennent d'internet : les **réponses et accusés WhatsApp** des assurés, les **notifications des fournisseurs de paiement** (PI-SPI) qui confirment un virement, et le **portail du cabinet d'expertise externe**. Comme pour l'IMF, ces flux passent par un **relais** tenu par Money Vibes, qui les reçoit, les met en file, et que **le serveur de la compagnie tire** (« l'agent tire »). Réalise UJ-3. *(défaut H-194 : relais repris du modèle de la microfinance ; à confirmer à l'installation)* *(point juridique J-27 : le portail du cabinet externe est hébergé par le relais Money Vibes, pièces de mission chiffrées et à durée limitée, Money Vibes déclaré sous-traitant ; aucune pièce médicale n'y transite sauf nécessité de la mission ; à confirmer à la séance d'immersion et par le juriste)*

**Conséquences (testables) :**
- **Accusé de réception après écriture** : le relais n'accuse réception d'un événement au fournisseur qu'après l'avoir écrit durablement ; l'instance n'acquitte un événement tiré qu'après l'avoir écrit chez elle ; un événement non acquitté est rejoué sans doublon d'effet.
- **Rapprochement quotidien** : chaque jour, l'instance rapproche les paiements reçus par le relais du relevé du fournisseur ; un écart entre dans la file de rapprochement (FR-224).
- **Money Vibes est déclaré sous-traitant** de la compagnie pour le traitement des flux du relais (finalité, contenu, durée de conservation, localisation), dans le registre des traitements (FR-19) ; le relais purge un événement tiré après un délai (défaut : 7 jours, annexe D *(défaut H-195 : modèle de la microfinance)*).
- L'interrogation du relais est un **contact sortant** de l'instance, ajouté à la liste des destinations sortantes déclarées (FR-19) ; la fréquence est un paramètre (défaut : 1 minute *(défaut H-196 : modèle de la microfinance)*).
- Un balayage de l'extérieur ne trouve aucun port entrant.
- Si le relais est injoignable, le circuit continue ; les confirmations de virement s'affichent « en attente du relais » ; la file se vide au retour.
- **Portail du cabinet externe** : le relais porte aussi ce portail (FR-180). Les pièces de mission y sont **chiffrées et à durée limitée** ; le cabinet ne voit que ses missions ; Money Vibes est déclaré sous-traitant pour ce flux. La voie `TRANSMISE` (courriel sécurisé ou papier) reste le repli.
- Aucune donnée de santé ne transite par le relais pour les messages (FR-227) ni pour les paiements ; sur le portail du cabinet, **aucune pièce médicale n'y transite sauf nécessité de la mission** (FR-9).
- En espace d'essai, le relais n'envoie rien de réel.

#### FR-240 : Mise en service

La mise en service comprend, pour chaque profil de la compagnie : une **formation par profil** (accueil, gestionnaires, responsable, direction, administrateurs, comptabilité, numérisation, archives, contrôle interne), une **documentation d'usage** par rôle, une **aide en ligne** et un **accompagnement sur site** pendant les premières semaines. Les durées et le nombre de sessions sont à fixer *(défaut H-197 : durées et nombre de sessions à confirmer avec la compagnie)*. Réalise UJ-1 et UJ-8.

**Conséquences (testables) :**
- Test de recette **par rôle** : chaque profil exécute son parcours de FR-16 sans aide.
- La documentation d'usage existe pour chacun des quatorze rôles (§2.1) ; l'aide en ligne s'ouvre depuis chaque écran.
- La formation est une ligne de la liste de contrôle du feu vert de mise en service (FR-20, FR-218) : sans elle, le feu vert n'est pas donné.

#### FR-241 : Le support à distance est ouvert par la compagnie seule

Le support de Money Vibes à une installation passe par le **tunnel de support** que **seule la compagnie ouvre**, borné dans le temps et journalisé ; les comptes de Money Vibes sont **fermés par défaut** (PRD moteur FR-23). Réalise UJ-8.

**Conséquences (testables) :**
- Un test tente d'ouvrir le tunnel depuis Money Vibes : refus. L'ouverture par ADMIN le permet pour une durée fixée, journalisée dans le journal chaîné de l'installation.
- Pendant le tunnel, Money Vibes **ne lit aucune donnée métier** : l'accès est celui de l'administration de l'instance (FR-238) ; l'accès à un écran métier est refusé.
- Le journal du tunnel (qui, quand, combien de temps, quelles actions) est lisible par ADMIN et par AUD.
- Le support d'usage (formation, questions) relève de FR-246 et du contrat de maintenance.

#### FR-242 : Réversibilité et remise d'exploitation

À la réception de l'installation et sur demande, la compagnie reçoit : un **export complet** des dossiers, des pièces, du journal et des paramètres, en **format ouvert** (JSON, CSV et fichiers d'origine) ; la **documentation d'exploitation** ; l'**accès administrateur remis** à l'équipe informatique de la compagnie. Réalise UJ-8.

**Conséquences (testables) :**
- L'export complet est rejoué dans un environnement vide et les compteurs concordent : nombre de dossiers, de pièces, d'entrées du journal, sommes de contrôle, chaînage du journal vérifiable.
- L'export passe par l'outil d'administration, sans ouvrir de table métier à `ADMIN` (FR-238).
- Après la remise, les comptes administrateur de la compagnie ouvrent l'administration de l'instance ; la documentation d'exploitation couvre démarrage, arrêt, mise à jour, restauration, supervision, astreinte (FR-238).

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
- Le domaine d'échange déclare ses **valeurs de contrôle** dès le manifeste (nombre d'objets, sommes), pour que le passage au connecteur nommé n'oblige pas à reprendre du code *(défaut H-198 : règle du point d'écriture unique par domaine reprise des PRD distributeur et microfinance)*.

#### FR-246 : Support : une anomalie bloquante prise en charge en 4 heures ouvrées

Le **seul engagement de support chiffré** des sources est la **prise en charge d'une anomalie bloquante sous 4 heures ouvrées** (proposition v2 et offre v4). Les anomalies sont classées **bloquante, majeure, mineure** (offre initiale). La maintenance comprend les correctifs, la sécurité, le contrôle des sauvegardes, les **mises à jour des barèmes, des règles et des évolutions CIMA**, une **visite mensuelle sur site**, le réentraînement mensuel de l'IA et son rapport mensuel (FR-231) *(défaut H-199 : contenu de la maintenance repris de la proposition v2 ; prix et durée au contrat, hors PRD)*. Les **heures ouvrées** sont celles de la compagnie, fixées au contrat. Réalise UJ-8.

**Conséquences (testables) :**
- Un ticket d'anomalie **bloquante** a un délai de **prise en charge** mesuré à l'heure ouvrée ; un test simule une anomalie bloquante et vérifie que le compteur démarre à la création du ticket et s'arrête à la prise en charge.
- Une anomalie **bloquante** est définie par ce qu'elle empêche : un parcours **jamais « bientôt »** (FR-22) devenu impossible, un règlement bloqué à tort, une perte de données ; la définition est remise à la compagnie à l'installation.
- Aucun engagement de **disponibilité** chiffré n'existe dans les sources *(défaut H-200 : objectif de conception de 99,5 % du temps ouvré, sans engagement, repris de la microfinance ; à confirmer à la séance d'immersion)*.
- Le support à distance suit FR-241 ; le support d'usage suit le contrat de maintenance.

---

## 8. Exigences transverses (non fonctionnelles)

Les exigences transverses du PRD distributeur (PRD-D §8) et celles du PRD microfinance s'appliquent (FR-1). Celles-ci s'y ajoutent ou les précisent pour une installation chez la compagnie. Elles **ne répètent pas** une FR déjà écrite : elles la **renvoient** (« voir FR-n »). Tout chiffre est un paramètre de la compagnie (FR-4, annexe D).

**Tableau de renvois : exigence transverse, puis l'exigence qui la porte.** Les numéros de cette section restent réservés.

| Exigence transverse | Numéro réservé | Exigence porteuse |
|---|---|---|
| Sauvegarde quotidienne et restauration testée | FR-252 | FR-236 |
| Double authentification et sessions | FR-254 | FR-25 |
| Journal, trace et lecture des consultations | FR-255 | FR-13 |
| Conservation de dix ans au moins | FR-256 | FR-174 |
| Données personnelles, hébergement et aucun port entrant | FR-257 | FR-232 et FR-234 |

#### FR-250 : Performance de la recherche et des écrans de travail

La recherche d'un dossier rend son résultat **en moins de 5 secondes au 95e centile**, sur le volume repris (voir FR-23, FR-150, §4.13). Les autres écrans de travail ont des **cibles provisoires**, mesurées sur le jeu au volume de l'hypothèse de FR-23 : la **fiche du dossier** s'ouvre en moins de **3 secondes** (95e centile) ; l'**OCR d'un lot de 50 pages** rend son résultat en moins de **10 minutes** ; la **resynchronisation nocturne** avec le LC est terminée avant **6 h** pour le volume de FR-23 ; l'**export de FR-193** est produit en moins de **2 minutes** *(défaut H-201 : valeurs provisoires ; à confirmer avec le test de FR-23)*.

**Conséquences (testables) :**
- Le test de FR-23 mesure la recherche par chaque critère (nom, police, numéro de sinistre, immatriculation, numéro d'archivage) ; un résultat au-dessus de 5 secondes au 95e centile fait échouer la recette.
- Le même jeu mesure l'ouverture de la fiche (moins de 3 secondes au 95e centile), l'OCR d'un lot de 50 pages (moins de 10 minutes), la resynchronisation nocturne (terminée avant 6 h) et l'export de FR-193 (moins de 2 minutes) ; chaque dépassement fait échouer la recette tant que la compagnie n'a pas fixé d'autre valeur.
- Les corbeilles et les files sont mesurées sur le même jeu, avec la cible de la fiche (moins de 3 secondes) ; le compte rendu de mesure est remis à la compagnie avec la configuration minimale du serveur (voir FR-234).
- Un indicateur de pilotage se recalcule à la demande depuis les données ; son actualisation est celle de FR-212.

#### FR-251 : Disponibilité pendant les heures d'ouverture

Le serveur central est disponible pendant les **heures d'ouverture** de la compagnie, fixées au contrat. Le chiffre de 99,5 % du temps ouvré est un **objectif de conception, sans engagement** (voir FR-246). La panne d'un élément voisin ne bloque pas le circuit : le LC coupé (voir FR-201), l'IA coupée (voir FR-11), le relais injoignable (voir FR-239), une liaison de guichet tombée (voir FR-237).

**Conséquences (testables) :**
- Un test coupe tour à tour le LC, l'IA commune, le relais et la liaison d'un guichet : le travail continue comme le disent FR-201, FR-11, FR-239 et FR-237, sans message d'erreur bloquant ni effet simulé.
- Une indisponibilité est mesurée sur les heures d'ouverture, pas sur 24 heures ; le calcul est écrit dans le manuel d'exploitation (voir FR-238).
- Aucun engagement chiffré de disponibilité n'est promis à la compagnie avant la séance d'immersion.

#### FR-252 : Sauvegarde quotidienne et restauration testée

Numéro réservé. Voir **FR-236** (sauvegarde, restauration testée avant la mise en service puis chaque mois, RPO 1 h et RTO 4 h (moteur AD-16), compteurs repris au maximum après restauration, état « restauration en cours : aucune émission »).

#### FR-253 : Chiffrement des pièces et des données sensibles

Les **pièces** du dossier, les **données de santé**, les **pièces d'identité** et les **téléphones** sont **chiffrés au repos** ; toute communication est **chiffrée en transit**. Les clés ne sont détenues ni par Money Vibes ni par ADMIN seul. Le chiffrement réduit le risque résiduel d'un accès direct à la base sur un serveur que la compagnie administre elle-même (voir FR-6).

**Conséquences (testables) :**
- Un test lit le stockage sans passer par l'application : les champs de santé, les pièces d'identité, les téléphones et les fichiers de pièces y sont illisibles.
- Un test intercepte une communication entre un poste et le serveur : le contenu n'est pas lisible.
- Les champs de santé suivent la règle de FR-9 ; une sauvegarde les garde chiffrés (voir FR-236).
- Le coffre des clés et ses détenteurs sont décrits dans le manuel d'exploitation (voir FR-238).

#### FR-254 : Double authentification et sessions

Numéro réservé. Voir **FR-25** (double authentification obligatoire pour tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord, par capacité ; sessions) et **FR-180** (comptes des cabinets externes).

#### FR-255 : Journal, trace et lecture des consultations

Numéro réservé. Voir **FR-13**.

#### FR-256 : Conservation de dix ans au moins

Numéro réservé. Voir **FR-174** (durées de conservation), FR-21 et FR-236.

#### FR-257 : Données personnelles, hébergement et aucun port entrant

Numéro réservé. Voir **FR-232** et **FR-234** (aucun port entrant ; relais, FR-239).

#### FR-258 : Accessibilité depuis les postes existants

La plateforme s'utilise **depuis un navigateur récent**, sur les **postes existants** de la compagnie et de ses guichets, sans logiciel à installer sur le poste de travail (voir FR-237). Les appareils de référence sont fixés à la recette. Le poste de numérisation du guichet est le seul poste qui porte un périphérique (voir §6.2).

**Conséquences (testables) :**
- La recette passe sur les navigateurs et les postes de référence que la compagnie désigne ; un écran qui ne s'affiche pas sur l'un d'eux fait échouer la recette.
- Aucune installation n'est exigée sur un poste de travail ordinaire.
- Les écrans d'administration de `ADMIN` (comptes, paramètres, simulateur et impression des grilles, liste des courriers sortants avec impression groupée) ne donnent aucune lecture métier (FR-6) ; la recette les parcourt.
- Aucune donnée métier n'est gardée dans le navigateur après la fermeture de la session (voir FR-1).

#### FR-259 : Le travail se fait en ligne ; le hors connexion n'est pas requis

Le travail se fait **en ligne**, sur le réseau de la compagnie (voir FR-237). Aucun mode hors connexion n'est exigé au premier jour : un guichet dont la liaison tombe affiche « hors liaison », ne simule rien et n'accepte pas faussement une déclaration ; rien n'est perdu au retour de la liaison.

**Conséquences (testables) :**
- Un test coupe la liaison d'un guichet en pleine saisie : l'écran le dit, la saisie n'est pas déclarée enregistrée, et la reprise ne crée aucun doublon (voir FR-38).
- Aucun écran ne promet un travail « hors ligne » ; la fonction, si elle vient, s'affiche « bientôt » (voir FR-22).

#### FR-260 : Langue française, montants en FCFA, dates

L'interface, les courriers, les messages et les états sont **en français**. L'**anglais** et les **langues locales** sont « bientôt » (voir FR-22). Les montants sont en **FCFA entiers**, sans décimale cachée ; les dates et heures sont celles du serveur, au fuseau de la compagnie.

**Conséquences (testables) :**
- Un test parcourt les écrans d'un rôle et ne trouve aucun libellé en anglais ni aucune clé de traduction brute.
- Un montant affiché, exporté et imprimé est le même entier (voir FR-262).
- Un emplacement « anglais » ou « langue locale » est un bouton « bientôt », sans date (voir FR-22).

#### FR-261 : Exploitation par l'équipe informatique de la compagnie

L'installation est exploitée par l'**équipe informatique de la compagnie** (rôle ADMIN), qui ne lit aucune donnée métier (voir FR-238). Elle dispose d'un manuel d'exploitation, d'une supervision lisible sans internet et d'un support de Money Vibes que la compagnie ouvre seule (voir FR-241, FR-246). La formation, la documentation d'usage et l'accompagnement sur site sont en FR-240 ; l'export complet et la remise d'exploitation sont en FR-242.

**Conséquences (testables) :**
- Un test ouvre chaque écran métier avec ADMIN : refus, sans donnée (voir FR-6).
- Le manuel d'exploitation est livré à l'installation et couvre démarrage, arrêt, mise à jour, restauration, supervision, astreinte (voir FR-238).
- Le tunnel de support ne s'ouvre pas depuis Money Vibes (voir FR-241).

#### FR-262 : Exactitude des montants et des indicateurs

Un montant se calcule **sans arrondi caché** : l'arrondi à 5 000 FCFA ne vaut que pour les montants **calculés par le système**, et le montant **arrêté** par le gestionnaire est **au franc près** (la règle d'arrondi est celle de FR-73) et se retrouve à l'identique à l'écran, dans l'offre, dans l'ordre et dans l'export. Les **cinq montants** (évalué, proposé, validé, payé, reste à payer) ne se confondent jamais (voir FR-75). Tout indicateur se **recalcule depuis les données** (voir FR-212).

**Conséquences (testables) :**
- Un test compare, pour un dossier du jeu de démonstration, le montant évalué, proposé, validé, payé et le reste à payer à l'écran, dans l'offre, dans l'ordre de règlement et dans l'export : ils sont identiques (voir FR-103).
- Le jeu de démonstration est cohérent au franc près (voir FR-17).
- Une évaluation arrêtée n'est pas recalculée quand un barème change (voir FR-75).

#### FR-263 : Fichiers déposés contrôlés

Tout fichier déposé est vérifié avant enregistrement : type, taille, correspondance entre extension et contenu, antivirus de la compagnie (voir FR-160). Un fichier refusé n'enregistre rien et dit pourquoi. Le contrôle humain avant archivage reste obligatoire (voir FR-165).

**Conséquences (testables) :**
- Un fichier d'un type non accepté, trop lourd, ou dont l'extension ne correspond pas au contenu est refusé avec son motif (voir FR-160).
- Un fichier détecté par l'antivirus est mis en quarantaine, jamais ouvert.
- Aucun fichier refusé n'apparaît dans le dossier ni dans le fonds.

#### FR-264 : Évolution par paramètres, et recette sur le vrai serveur

Le PRD évolue **sans reprise du code** : tout seuil, délai ou liste est un paramètre versionné (voir FR-4). Le processus lui-même évolue par paramètres, puis par amendement versionné (voir FR-27). La recette se joue **sur le vrai serveur**, sur le jeu de démonstration, en rejouant les 104 vérifications du second rejeu de la démo actuelle **telles que la table de reprise les réécrit** (annexe E ; voir FR-15, FR-16) : elle exige **104 sur 104 de la table réécrite** et échoue si une seule échoue.

**Conséquences (testables) :**
- Un test change chaque paramètre de l'annexe D et vérifie l'effet sur un nouveau dossier, pas sur un dossier engagé (voir FR-4).
- Le parcours de `SIN-2026-9002` se joue à la main, rôle après rôle, de la déclaration à l'archive, sur le vrai serveur (voir FR-16).
- La répétition générale de la reprise est jouée avant la mise en service (voir FR-218).
- Un test de **parcours d'écran**, dans un navigateur réel et rôle après rôle, est rejoué à chaque livraison, en plus des tests de logique : les tests de logique ne voient pas l'écran (voir FR-28).

---

## 9. Indicateurs de réussite

La phrase à faire disparaître est : **« Je vais vérifier et je vous rappelle. »** Tout indicateur se **recalcule depuis les données** (FR-212) ; aucun n'est saisi. Chaque indicateur porte un identifiant **SM-n**, une **requête de calcul**, une **source de donnée** et un **propriétaire**, consignés dans sa fiche (FR-212, FR-213). Un indicateur sans source de donnée n'existe pas : il n'est pas dans cette liste.

Les **valeurs de départ** se mesurent au démarrage, sur les dossiers repris et sur les quatre premières semaines de travail. Le `DT` de la compagnie les mesure, avec l'aide de l'équipe Money Vibes de mise en service (FR-240) ; il les présente à la séance d'immersion suivante. Les cibles ci-dessous sont des **propositions de la rédaction**, à fixer avec la compagnie à la séance d'immersion. Les chiffres illustratifs des documents commerciaux (dossiers ouverts, bloqués, heures gagnées) ne sont pas des cibles.

**Pour la démonstration** (ce qui prouve qu'elle est prête) :

| Id | Indicateur | Mesure | Cible | Source et propriétaire |
|---|---|---|---|---|
| SM-1 | Parcours de `SIN-2026-9002` mené à la main, rôle après rôle, de la déclaration à l'archive | essais menés sans intervention de Money Vibes | 100 % des essais | FR-16, UJ-3 ; compte rendu d'essai ; équipe Money Vibes |
| SM-2 | Vérifications du second rejeu de la démo actuelle | vérifications de la table de reprise réécrite (annexe E), réussies sur le vrai serveur | 104 sur 104 | FR-15, FR-264, annexe E ; rapport de rejeu ; équipe Money Vibes |
| SM-3 | Rôles de démonstration qui voient exactement leur périmètre | rôles conformes à l'annexe B | 14 sur 14 | FR-6, annexe B ; test d'accès ; équipe Money Vibes |
| SM-4 | Boutons « bientôt » honnêtes | boutons qui promettent une date ou simulent un effet | 0 | FR-22 ; revue des écrans ; équipe Money Vibes |
| SM-5 | Chiffres du tableau de bord égaux aux données | indicateurs recalculés, identiques aux listes | 100 % | FR-212 ; test de recalcul ; équipe Money Vibes |

**Pour la compagnie en service** (cibles provisoires ; chacune se fixe à la séance d'immersion) :

| Id | Indicateur | Mesure (requête de calcul) | Cible provisoire | Source et propriétaire |
|---|---|---|---|---|
| SM-6 | « Je vous rappelle » disparu | part des échanges avec l'assuré (appel ou passage au guichet, saisis par l'agent, FR-146) qui reçoivent leur réponse **le jour même**, fiche ouverte ; aucun appel n'est enregistré, la mesure part de la saisie de l'agent | 70 % à 3 mois, 90 % à 6 mois | journal des échanges (FR-146), journal de consultation (FR-158) ; `RESP` |
| SM-7 | Retrouver un dossier | recherche rendue en moins de 5 secondes, au 95e centile, sur le volume repris | 95 % des recherches sous 5 secondes ; moins de 1 seconde visée | FR-23, FR-150 ; journal de performance ; `ADMIN` (état technique seulement) |
| SM-8 | Délai de première réponse à l'assuré (la confiance de l'assuré) | temps entre le message de l'assuré et la première réponse de la compagnie ; un message reçu au guichet part de l'heure de saisie par l'agent, il n'a pas d'horodatage propre | 90 % des premières réponses sous 1 jour ouvré à 3 mois | FR-146, FR-156 ; journal des échanges ; `RESP` |
| SM-9 | Déclarations enregistrées sans retard | part des déclarations saisies le jour de leur réception (le mémoire de 2014 relève 3 à 4 jours de retard) | 90 % à 3 mois, 98 % à 6 mois | FR-39, FR-213 ; registre des déclarations (FR-192) ; `RESP` |
| SM-10 | Dossiers sans numéro officiel | dossiers sans numéro de sinistre du LC depuis plus de 1 jour ouvré | 0 dossier au-delà du délai, hors **coupure déclarée** par `ADMIN` avec motif et durée (FR-201) | FR-37, FR-198 ; file des écarts ; `RESP` |
| SM-11 | Accusés de réception envoyés | part des accusés envoyés dans le délai interne (10 jours par défaut) | 100 % | FR-48, FR-213 ; journal d'envoi ; `RESP` |
| SM-12 | Offres envoyées dans le délai | part des offres validées envoyées sous 48 heures ouvrées | 90 % à 3 mois, 98 % à 6 mois | FR-84, FR-213 ; horodatage de la validation et de l'envoi ; `RESP` |
| SM-13 | Offres dans les délais légaux CIMA | part des dossiers corporels dont l'offre part avant l'échéance légale (12 mois après l'accident, 8 mois après le décès ; Code CIMA art. 231, texte lu) | 100 % ; tout dépassement est expliqué et sa pénalité affichée | FR-85, FR-141 ; chronomètre légal du dossier ; `DT` |
| SM-14 | Dossiers sans action depuis plus de 30 jours | nombre et part du stock actif | baisse de moitié à 6 mois par rapport à la valeur de départ | FR-144, FR-206 ; tableau de bord ; `RESP` |
| SM-15 | Règlements payés deux fois | règlements au même bénéficiaire et pour le même sinistre, non expliqués (définition unique du doublon, FR-224) | 0 | FR-100, FR-222, FR-224 ; rapprochement ; `CPT`, contrôle par `AUD` |
| SM-16 | Règlements sans validation ni accord | ordres émis sans validation ou sans accord enregistré | 0 | FR-86, FR-90 ; journal chaîné ; `AUD` |
| SM-17 | Séparation des tâches | cumuls interdits constatés par le contrôle interne | 0 | FR-7, FR-210 ; revue mensuelle ; `AUD` |
| SM-18 | Actions tracées | part des actions du journal avec auteur et horodatage ; part des refus et classements avec motif | 100 % | FR-13 ; journal chaîné ; `AUD` |
| SM-19 | Décisions défendables | part des décisions (évaluation, offre, refus, classement, provision, règlement) d'un échantillon de dossiers clos qui portent leurs **pièces, leur règle, leur motif et leur auteur** | 100 % de l'échantillon ; échantillon mensuel de 20 dossiers (proposition) | FR-26 ; journal chaîné ; `AUD` |
| SM-20 | Dossiers introuvables à la relance | dossiers listés par une relance ou un dossier muet (FR-143, FR-144) dont la fiche ou la chemise physique est introuvable | 0 | FR-144, FR-166 ; registre des chemises ; `ARCH` |
| SM-21 | Fraîcheur des états | âge de la dernière mise à jour de chaque état publié (provisions, engagements, brief du matin) | aucun état plus ancien que sa cadence annoncée ; l'écran dit son âge | FR-201, FR-207, FR-212 ; en-tête des états ; `DT` |
| SM-22 | Blocages levés par le validateur | part des blocages (signal, contrôle, alerte) levés par la personne qui valide, avec leur motif | suivi mensuel, sans cible ; une part qui monte est lue avec `AUD` | FR-129, FR-130, FR-133 ; journal des blocages ; `AUD` |
| SM-23 | Motifs identiques à la proposition de l'IA | part des motifs de décision qui reprennent mot pour mot la proposition de l'IA | suivi mensuel, sans cible ; un motif jamais validé par un clic seul (FR-77) | FR-12, FR-77 ; journal des propositions ; `DT` |
| SM-24 | Pièces lues par l'OCR | part des pièces reçues dont le texte est lu, scans compris | 85 % à 3 mois sur le jeu repris ; le motif de chaque échec est conservé | FR-163 ; journal de l'OCR ; `ARCH` |
| SM-25 | Pièces classées sans correction | part des types proposés par l'IA et gardés par l'agent | 70 % 3 mois après la calibration du modèle ; suivi mensuel avant | FR-164, FR-231 ; journal des propositions ; `ARCH` |
| SM-26 | Propositions de l'IA | par usage, part acceptée, modifiée, rejetée (rapport mensuel de performance) | suivi mensuel, sans cible ; lecture : voir les contre-indicateurs | FR-12, FR-231 ; rapport mensuel ; `DT` |
| SM-27 | Dossiers prêts pour un contrôle de la CRCA | temps pour produire le dossier de contrôle, journal compris | une journée, sans reconstitution | FR-211, UJ-7 ; mesure à la première revue ; `AUD` |
| SM-28 | Reprise des dossiers en cours | part des dossiers en cours repris sans écart ouvert, avant le feu vert | 100 % avant la mise en service du module | FR-216, FR-218 ; rapport de reprise ; `ADMIN` et `DT` |
| SM-29 | Anomalie bloquante prise en charge | délai de prise en charge, en heures ouvrées | sous 4 heures ouvrées | FR-246 ; registre du support ; Money Vibes |
| SM-30 | Restauration testée | restaurations réussies sur le nombre prévu | 100 % | FR-236 ; rapport de test ; `ADMIN` |

**Contre-indicateurs** (ce qui ne doit **pas** se dégrader quand les autres s'améliorent) :
- **Qualité de l'instruction** : la part de dossiers rouverts après clôture ne doit pas monter ; aller plus vite ne doit pas faire clore plus mal (FR-107, FR-213).
- **Équité du règlement** : la part de refus, de classements sans suite et de litiges ne doit pas monter sans cause ; un refus reste motivé et opposable (FR-121, FR-123, FR-124).
- **Écarts d'IA** : la part des propositions dont l'humain s'écarte. Une part qui monte signale un modèle qui se trompe ; une part nulle signale qu'on ne lit plus (FR-12, FR-231, SM-23).
- **Pression sur les assurés** : le nombre de messages et de relances par assuré, et le nombre de réclamations ; la relance ne doit pas devenir du harcèlement (FR-143, FR-156).
- **Fraude non détectée ou accusée à tort** : le nombre de revues écartées après coup et de fraudes confirmées ; le score n'accuse jamais (FR-128, FR-129).
- **Écarts avec le LC** : le nombre et l'âge des écarts ouverts entre Prospera et le logiciel de la compagnie ; un chiffre qui monte veut dire que Prospera ne dit plus la vérité (FR-200).
- **Charge des gestionnaires** : la charge pondérée par gestionnaire ; la productivité ne se gagne pas en surchargeant quelques-uns (FR-51).
- **Papier et numérique** : les chemises sorties et non restituées au-delà de 15 jours, et les pièces à rattacher ; le numérique ne doit pas faire perdre le papier (FR-166, FR-171).
- **Données de santé** : le nombre de lectures de données de santé hors des rôles autorisés doit rester à zéro ; toute lecture reste journalisée (FR-9, FR-153).

---

## 10. Périmètre

### 10.1 Dans le périmètre au premier jour

Décision du PO : **le premier jour, tout le circuit, avec l'IA, sauf la voix.** Le phasage progressif de la proposition v2 est écarté. Le périmètre est celui du démarrage de **février 2027**, sur les serveurs de la compagnie. Le PRD ne coupe aucune fonction ; il propose seulement un ordre de construction (§10.3). La charge de février reste une question au PO (action A-16, §12.2).

- **Le circuit sinistre complet** (`sinistres`, M05) : déclarer, ouvrir, attribuer, instruire, chiffrer, décider, payer, clore ; 11 statuts, 4 sorties, le recours en suivi parallèle, la machine à 42 transitions (§5, FR-30 à FR-149).
- **Consulter et déclarer** : la recherche unique, la fiche « répondre pendant l'appel », la déclaration par quatre canaux, les réclamations (§5.1, §6.1).
- **Les expertises** (`expertises`, M29) : référentiel des experts, missions, médecin-conseil, honoraires ; le portail du cabinet externe, hébergé par le relais Money Vibes, avec la voie `TRANSMISE` (courriel sécurisé ou papier) en repli (§5.5, §6.3, FR-239). Le suivi médical complet du dossier corporel (FR-63a) et les intervenants tiers des risques divers (FR-185a) en font partie.
- **Les pièces, la numérisation et les archives** (`ged`, M07) : OCR réel, contrôle avant archivage, fonds numérique et physique, conservation, destruction visée, reconstitution (§6.2). Les courriers sont archivés en copie et s'impriment par lots (FR-46).
- **Les contrats lus, les provisions et les états** (`assurance`, M30/M31) : projection des polices et garanties lue du LC, provision dossier par dossier, état des provisions, réassurance et coassurance, états techniques de la direction (liquidation, boni/mali, note de synthèse, revue mensuelle), export pour la comptabilité (§6.4).
- **Les cas particuliers du corporel et des gros sinistres** : le registre des décès et des ayants droit (FR-70a), les sinistres majeurs avec avis au réassureur, comité de suivi et rapports périodiques (FR-57a).
- **L'échange avec le logiciel de la compagnie** (`liaison-assureur` [proposition], M48 [proposition]) : contrat d'échange générique, par API ou par fichier (Excel, JSON), dans les deux sens ; liste « à saisir dans le logiciel de la compagnie » (§6.5, annexe C). Le **logiciel de compagnie fictif** (`assureur-fictif`) pour la démonstration (§6.6).
- **Le pilotage et le contrôle interne** : tableaux de bord, brief du matin, plan de contrôle, dossier prêt pour la CRCA (§6.7) ; la **vue finance et exploitation** pour le DAF et le DSI (FR-229).
- **La reprise** (`reprise`, M44) : fichiers Excel ou JSON dès le premier jour, adaptateur d'API écrit quand le LC est connu en janvier ; dossiers en cours d'abord ; resynchronisation nocturne ; rapport de reprise (§6.8, FR-214).
- **Les modules partagés** : `paiement` (chèque, virement, PI-SPI, Mobile Money), `notification`, `dashboard`, `reseau`, l'IA commune en instance locale (§7).
- **La mise en service et la réversibilité** : formation par profil, documentation d'usage, accompagnement sur site (FR-240) ; export complet en format ouvert, documentation d'exploitation, accès administrateur remis (FR-242).
- **Les quatorze usages de l'IA de la proposition v2, plus ceux de la démo, tous au premier jour**, sauf la voix : déclaration assistée (WhatsApp et e-mail), lecture et classement des pièces, contrôle des pièces, pièces manquantes et relances, résumé sourcé, recherche en langage naturel, pré-remplissage de l'instruction, analyse des devis, « pourquoi ce montant ? », fraude, courriers, recours, brief du matin, qualité du dossier et simulation (FR-10). S'y ajoutent l'orientation d'expertise assistée, la complétude d'un rapport et la comparaison au portefeuille. Tant qu'aucun modèle n'existe, des règles explicables servent ces capacités et l'annoncent (FR-10).
- **Les quatorze rôles**, la matrice d'accès, la séparation des tâches, la double authentification (annexe B, FR-6, FR-7, FR-25).
- **L'installation chez la compagnie** : un serveur applicatif et un NAS, sauvegarde quotidienne, mises à jour, support (§7.5, FR-246).
- **Le jeu de démonstration** : une compagnie fictive de 14 gestionnaires et d'environ 3 500 dossiers, quatre scénarios rejouables (FR-15).

### 10.2 Hors périmètre pour l'instant

- **L'IA vocale** : dictée, transcription d'appel, synthèse vocale. La déclaration assistée passe par WhatsApp et l'e-mail, pas par l'appel ; aucun appel n'est enregistré (FR-34, FR-35).
- **Le chatbot de l'assuré** (assistant conversationnel, aide à la déclaration, état d'avancement) : « bientôt » (FR-22). Aucun portail assuré en libre-service au premier jour (FR-34).
- **La comptabilité officielle** : elle reste hors de Prospera ; Prospera produit un état et un export (FR-193).
- **La gestion des polices et des primes** : souscription, avenants, encaissement des primes, intermédiaires et coassureurs restent dans le LC (FR-2).
- **Le connecteur nommé** vers le logiciel de la compagnie et le module `connecteurs` : hors février (FR-245). L'échange générique, lui, est du premier jour.
- **La signature électronique** des offres et des transactions : « bientôt », à n'activer qu'après la validation du juriste (FR-22, FR-24).
- **L'anglais et les langues locales** : « bientôt » (FR-22, FR-260).
- **Le portail ou la connexion de la CRCA, des courtiers, des agents et des coassureurs** : ils reçoivent des états et des messages, sans se connecter (§2.2). Le portail du cabinet d'expertise externe est un cas à part, dans le périmètre (§10.1).
- **La vue « réseau »** (courtiers, réclamations par intermédiaire) : hors du premier jour (FR-229, action A-21).
- **La récupération d'un indu** après fraude confirmée : hors périmètre ; le `DG` désigne un responsable du recouvrement, hors de Prospera, qui reçoit l'alerte « indu à examiner » (FR-133, action A-22).
- **La pluralité d'experts et la contre-expertise contradictoire entre assureurs** : attendent la convention de place de la compagnie (FR-68, FR-109, action A-23).
- **Le reversement des sommes prescrites** (art. 28) : hors du premier jour ; l'état des sommes en attente de reversement reste produit hors Prospera (FR-189).
- **L'estimation de la provision pour sinistres survenus non déclarés (IBNR)** : estimée hors de Prospera au premier jour (FR-189).
- **Le fonds de garantie automobile** : désactivé par défaut tant que son existence au Togo n'est pas confirmée (FR-111, FR-14).
- **Le scan du stock papier comme voie de reprise** : non retenu ; le papier reste tenu en parallèle (FR-21, FR-215).
- **Changer un statut ou une transition par simple réglage** : le processus évolue **par paramètres** (délais, seuils, délégations, pièces, modèles), sans développement. Un changement de statut ou de transition exige un amendement versionné, décidé à la séance d'immersion, avec rejeu des tests (FR-27, FR-139, FR-4).
- **La haute disponibilité** : une instance, un serveur applicatif et un NAS, sans reprise automatique sur un second serveur (FR-23).

### 10.3 Ordre de construction recommandé et critère de mise en service

Cet ordre **ne change pas le périmètre** : tout le §10.1 reste dû au premier jour. Il dit seulement par où commencer, pour que la compagnie voie tôt un circuit qui tourne.

| Ordre | Contenu |
|---|---|
| 1 | Le **chemin de la démonstration** : déclarer, ouvrir, instruire, chiffrer, décider, offrir, accord, payer, clore, archiver. |
| 2 | Le recours, la fraude, les états techniques, les expertises et les échanges avec le LC. |
| 3 | L'IA avancée (analyse des devis, comparaison au portefeuille, simulation) et la reprise par API. |

Le « **jour 1 minimal** » est un **critère de mise en service**, pas une réduction. Pour chaque module, un **feu vert** (comme la reprise, FR-218, FR-20) constate deux choses : le chemin de la démonstration tourne, et la compagnie a livré les entrées nécessaires (FR-219). Une entrée manquante est un **risque tracé**. Aucune fonction ne passe en « bientôt » sans décision du PO. L'action A-16 porte sur la charge réelle de février.

---

## 11. Non-objectifs

- **Prospera ne remplace pas le logiciel de la compagnie.** Il ne tient ni les polices, ni les primes, ni les assurés, ni les garanties : il les **lit** sans jamais les modifier (FR-2, FR-3).
- **Prospera n'est pas une comptabilité.** Il ne passe aucune écriture au grand livre. Il tient la provision du dossier et produit un état et un export (FR-193, FR-189).
- **L'IA ne décide pas.** Elle extrait, analyse et propose, source à l'appui. Valider, refuser et payer restent des actes humains. Elle ne propose **jamais de montant sur un préjudice corporel** (FR-11).
- **Prospera ne refuse pas la garantie seul, ne déclare pas une fraude seul, ne paie pas seul.** Un score de fraude ouvre une revue humaine et n'accuse personne (FR-42, FR-129).
- **Prospera n'est pas un conseil juridique.** Il affiche les délais et pénalités du Code CIMA tels qu'il les a lus. Ce qui n'est pas vérifié porte la mention « à vérifier par le juriste » (FR-24).
- **Pas de déchéance automatique** pour déclaration tardive : une réserve et un motif, la décision revient au responsable (FR-43).
- **Pas d'ordre de règlement sans accord enregistré**, pas de validation de son propre dossier, pas de règlement par celui qui a décidé (FR-86, FR-7).
- **Pas de bouton qui simule.** Une capacité absente s'affiche « bientôt » ; elle ne simule jamais un effet (FR-22).
- **Pas de donnée nominative ni de donnée de santé hors de la compagnie** : ni vers l'IA commune, ni par un message à l'assuré, ni vers le relais, **sauf** les pièces de mission chiffrées et à durée limitée du portail du cabinet externe, sans pièce médicale hors nécessité de la mission (FR-232, FR-227, FR-239).
- **Pas de lecture du métier par l'administrateur** : l'équipe informatique de la compagnie et Money Vibes (support) ne lisent aucune donnée de dossier (FR-238, FR-241).
- **Pas de suppression par défaut** : aucune destruction de dossier ou de pièce sans décision visée et tracée ; aucun bouton « supprimer », même pour ADMIN (FR-175).
- **Pas de dimensionnement par Money Vibes à la place de la compagnie** : la compagnie fournit ses volumes et achète son serveur ; Money Vibes fournit une configuration minimale issue d'un test (FR-23, FR-234).
- **Pas de règle du Togo tirée d'une pièce étrangère.** La convention d'expertise tunisienne, le mémoire de 2014 sur une compagnie de la zone CIMA et les formulaires d'un fonds de garantie étranger sont des modèles et des jeux de test (§0).

Ces non-objectifs ne retirent ni la mise en service (FR-240), ni la réversibilité (FR-242), ni la vue finance et exploitation (FR-229), ni le suivi médical (FR-63a), ni le registre des décès (FR-70a), ni les sinistres majeurs (FR-57a), ni le portail du cabinet externe (FR-239) : tous restent dans le périmètre du premier jour.

---

## 12. Décisions, actions restantes et risques assumés

### 12.1 Décisions prises

`.memlog.md` date les décisions du PO ; le plan de rédaction fixe les décisions de cadrage D1 à D21 et leur répartition. Le 2026-11-13, le PO a demandé : « analyse toi-même et complète pour qu'on finisse ». Les décisions D1 à D48 sont donc des **recommandations de la rédaction**, pas des engagements de la compagnie ; D49 consigne la décision du PO qui les retient pour démarrer. Chacune porte ses défauts paramétrables, repérés dans le texte par un identifiant H-nnn ou J-nn (§13). La séance d'immersion ou la revue juridique les confirmera.

**Ce qui reste réellement à faire.** Le PRD est complet sur le papier. Restent : la **séance d'immersion** avec la compagnie (hypothèses H du §13.1) ; la **revue juridique** avant la mise en service (points J du §13.2) ; les **entrées de la compagnie** à obtenir (A-1 à A-8, volumes compris) ; deux **amendements** à demander (A-10, A-19) ; la réponse du PO sur la **charge de février** (A-16).

**Décisions du PO (2026-11-13).**

| # | Décision du PO | Où |
|---|---|---|
| P-1 | Le client est une compagnie IARD de la zone CIMA, au Togo, au stade du pré-contrat ; **jamais nommée** dans le PRD (« la compagnie »), même si la proposition v2 la nomme. Démarrage en **février 2027**, comme les autres clients Prospera. | §0 |
| P-2 | Les 14 gestionnaires de la démo (3 corporel, 5 matériel, 3 risques divers, 3 recours) sont un chiffre de **démonstration**, pas l'effectif réel. | FR-15 |
| P-3 | **Premier jour : tout le circuit** (retrouver, déclarer, pièces, traçabilité, évaluation au barème, validation, règlement, chèques, recours, missions d'expertise) **et l'IA, sauf la voix**. Le phasage progressif de la proposition v2 n'est pas retenu pour le périmètre. | §10, FR-10 |
| P-4 | Reprise des archives **par API, ou par fichier Excel ou JSON**. Le scan du stock papier n'est pas la voie de reprise ; le dossier papier reste tenu en parallèle. | FR-214, FR-215, FR-21 |
| P-5 | Le logiciel de la compagnie (polices, primes, clients) sera **libre en janvier** : on ne spécule pas dessus ; le PRD décrit un contrat d'entrée générique, sans connecteur nommé. | FR-194, FR-197, annexe C |
| P-6 | L'IA commune tourne en **instance locale** chez la compagnie : seuls des écarts anonymisés remontent par un tunnel sécurisé ; **aucune donnée médicale ne sort**. | FR-12, FR-232 |
| P-7 | Mode d'écriture **rapide** : brouillon complet avec des balises d'hypothèse, puis réconciliation, relectures, triage, polish. | — |
| P-8 | Une vraie démonstration a eu lieu devant la compagnie : elle a dit qu'**il manque des éléments, mais de débuter dessus**. Une **séance d'immersion** suivra. Le PRD est donc un processus réel, intégré, testé, et **évolutif par paramètres** (FR-27). | §0, FR-4, FR-27 |
| P-9 | Circuit de référence : **8 phases, 11 statuts, 4 sorties**, recours en suivi parallèle ; règles : celui qui décide ne paie pas, motif écrit sur tout refus ou classement, tout horodaté, une évaluation arrêtée n'est pas recalculée. | FR-30 à FR-33 |
| P-10 | Écarts à la démo : offre et accord de l'assuré en une étape ; recours en parallèle ; validation à plusieurs niveaux ; voie « accord sur devis » ; le **code de la démo fait foi sur la SPEC**. | FR-84 à FR-89, FR-59, FR-78 |
| P-11 | Premier jour, Prospera sert à **consulter et à déclarer** ; le **numéro de sinistre est détenu par le logiciel de la compagnie**, « pour un début ». | FR-34, FR-37, FR-198 |
| P-12 | Les points restants sont tranchés **par recommandation**, consignés en défauts paramétrables, à confirmer à la séance d'immersion ; chacun porte un identifiant au §13. | §13 |
| P-13 | Sources lues en plus : commentaires de `workflow.ts`, `rejeu-2/README.md`, doc « Espace expert », chapitres V et VI du mémoire de 2014 (procédure réelle et défauts relevés d'une compagnie de la zone CIMA ; à confirmer pour le Togo). | §0 |

**Décisions de cadrage D1 à D21, par recommandation** (à confirmer à la séance d'immersion).

| # | Décision | Où |
|---|---|---|
| D1 | Le client : compagnie IARD togolaise jamais nommée ; serveur applicatif et NAS chez elle ; IA commune en instance locale ; écarts anonymisés sortants par tunnel sécurisé. | §0, FR-234, FR-232 |
| D2 | **Le logiciel de la compagnie fait foi pour les contrats** (assurés, polices, garanties, primes, intermédiaires, coassureurs) et pour le numéro de sinistre officiel ; Prospera tient le dossier sinistre. Un **contrat d'échange générique** (API ou fichier). | FR-2, annexe C |
| D3 | Le numéro de sinistre : **référence de déclaration `DEC-`** immédiate, numéro officiel renvoyé par le LC ensuite ; liste « à saisir dans le logiciel de la compagnie » si le LC ne reçoit pas ; contrôle de doublon dans Prospera et dans le LC ; paramètre « qui attribue le numéro » (précisé par D24). | FR-36 à FR-38, FR-198, FR-199 |
| D4 | Contrats **lus, jamais modifiés** ; la **décision de garantie ne se saute pas**. | FR-3, FR-41, FR-42 |
| D5 | 8 phases, 11 statuts, 4 sorties, recours parallèle ; correspondance avec la démo (`PIECES_INCOMPLETES` devient `PIECES_ATTENDUES`, `EN_ETUDE` devient `EN_INSTRUCTION`, `VALIDATION` devient `EN_VALIDATION`, `OFFRE_ENVOYEE` ajouté) ; 42 transitions ; le processus évolue par paramètres, puis par amendement versionné (FR-27). | FR-30, FR-134, FR-135, FR-27 |
| D6 | L'offre et l'accord deviennent une étape ; offre sous 48 heures ouvrées ; **aucun ordre de règlement sans accord enregistré**. | FR-84 à FR-90 |
| D7 | Délais **légaux** du corporel (art. 231, 233, 236, texte lu) séparés des délais **internes** paramétrables ; un dossier jugé selon le référentiel de sa date de survenance. | FR-14, FR-85, FR-140 à FR-142 |
| D8 | Matrice de délégation à plusieurs niveaux, paramétrable : 1 000 000 FCFA au responsable avec contrôle d'un second agent, comité au-delà puis visa du directeur technique, DG seul à titre commercial ; anti-fractionnement. | FR-8, FR-78, FR-79 |
| D9 | Voie « accord sur devis » : dossier de 300 000 FCFA et devis de 200 000 FCFA au plus (paramètres). | FR-59 |
| D10 | Le recours est un **suivi parallèle** ; relance tous les 15 jours ; réclamation après paiement de l'assuré ; prescription biennale à vérifier ; convention inter-compagnies en paramètre. | FR-32, FR-108 à FR-119 |
| D11 | Plusieurs règlements par dossier ; chèque, virement ou PI-SPI, Mobile Money par `paiement` ; espèces plafonnées ; quittance signée avant le paiement électronique ; LBC/FT. | FR-91 à FR-100 |
| D12 | **Provision dossier par dossier**, revue à chaque événement ; état des provisions et export ; comptabilité hors de Prospera. | FR-76, FR-188, FR-189 |
| D13 | **Quatorze usages de l'IA au premier jour, sauf la voix** ; chatbot de l'assuré « bientôt » ; OCR réel ; garde-fous de la proposition v2. | FR-10 à FR-12, FR-22 |
| D14 | Quatorze rôles ; le comité est une instance ; données de santé lisibles par MED, GEST corporel affecté, RESP, et DG ou DT pour une décision ; ACC et NUM voient le type et l'existence d'une pièce médicale, jamais son contenu. | FR-6, FR-9, annexe B |
| D15 | Écarts de la démo tranchés : franchise déduite (ordre du décompte : dommage, vétusté, règle proportionnelle, plafond, franchise) ; déclaration tardive = réserve, jamais déchéance ; complément non revenu bloque la validation ; cabinet sans compte ; évaluation jamais recalculée ; barème corporel poste par poste. | FR-43, FR-67, FR-69, FR-70, FR-75 |
| D16 | Comptabilité hors de Prospera : état et export. | FR-103, FR-193 |
| D17 | Reprise par `reprise` (M44), dossiers en cours d'abord, resynchronisation nocturne ; papier tenu avec cote physique ; conservation 10 ans au moins ; destruction visée. | FR-21, FR-168 à FR-175, FR-214 à FR-217 |
| D18 | Modules : `sinistres` (M05), `ged` (M07), `expertises` (M29), `assurance` (M30/M31), `liaison-assureur` (M48 [proposition]), `assureur-fictif`, `reprise` (M44), et les modules partagés. | FR-20, annexe A |
| D19 | Jeu de démonstration : compagnie fictive, environ 3 500 dossiers, quatre scénarios rejouables, 104 vérifications reprises en recette (table de reprise, annexe E). | FR-15 à FR-17, annexe E |
| D20 | Performance : recherche sous 5 secondes au 95e centile ; hypothèse de dimensionnement à remplacer par les vrais volumes ; sauvegarde quotidienne ; anomalie bloquante prise en charge en 4 heures ouvrées. | FR-23, FR-246, FR-250 |
| D21 | **Revue juridique obligatoire avant la mise en service**, avec un propriétaire et une date cible ; saisie des tables du barème corporel au plan ; mode dégradé en saisie manuelle motivée. | FR-24 |

**Décisions D22 à D36 : arbitrages sur les relectures du 13/11** (pris sur délégation du PO ; chacun touchant une pratique de la compagnie est à confirmer à la séance d'immersion).

| # | Arbitrage | Décision | Où |
|---|---|---|---|
| D22 | R1 | **Rien n'est payé pendant le délai de dénonciation.** Au corporel, aucun règlement issu d'une transaction (offre définitive ou provisionnelle acceptée) n'est émis avant la fin des 15 jours de l'art. 235 : condition bloquante `DELAI_DENONCIATION_ECOULE`. La dénonciation (transition 42) part de `ORDRE_EMIS`, car rien n'est émis avant ; le délai de paiement court depuis la fin de la dénonciation. | FR-86, FR-102, FR-135, FR-136 |
| D23 | R2 | **Jamais deux fois le même paiement.** Clé d'idempotence unique par règlement, gardée à chaque tentative ; état `INCONNU` sans nouvelle tentative avant rapprochement ; un règlement `EN_COURS` ou `INCONNU` ne s'annule pas ; un chèque annulé exige l'**opposition bancaire enregistrée** avant tout chèque de remplacement. | FR-92 à FR-95, FR-99, FR-101, FR-220 à FR-222 |
| D24 | R3 | **Un seul numéro de sinistre par déclaration.** La référence `DEC-` est l'identifiant d'idempotence envoyé au LC ; une seule voie à la fois (envoi automatique ou liste « à saisir ») ; un second numéro pour une `DEC-` déjà numérotée est un écart, jamais un second rattachement ; préfixe distinct si Prospera numérote un jour (à confirmer : capacité du LC, §13.1). | FR-36, FR-37, FR-198, FR-199, annexe C |
| D25 | R4 | **L'accord qui libère l'argent n'est pas enregistré par l'instructeur** : il l'est par l'accueil ou un agent étranger au dossier, sur la pièce originale signée, avec contrôle d'identité. Cumuls interdits ajoutés : instruire et enregistrer l'accord ; valider et enregistrer l'accord ; émettre et faire signer la quittance. | FR-7, FR-81, FR-86, FR-90, FR-96 |
| D26 | R5 | **Les données de santé ne fuient pas.** ACC et NUM voient le type et l'existence d'une pièce médicale, jamais son contenu ; le LC ne reçoit aucune donnée médicale, seulement le volet, les montants et des motifs codés ; l'absence de consentement ne bloque jamais une obligation légale (base légale à valider par le juriste, J-01). | FR-9, FR-53, FR-56, FR-196, FR-19 |
| D27 | R6 | **Validation à trois sous 1 000 000 FCFA** : proposition de l'instructeur, contrôle d'un second agent du volet, validation du `RESP` ; au-delà, comité de quatre et visa du `DT` (D8 inchangé). Tout est paramétrable. | FR-8, FR-78 |
| D28 | R7 | **Pas de réduction du périmètre** : le PRD recommande un ordre de construction (§10.3), sans valeur de périmètre. A-16 reste une question au PO. | §10.3, A-16 |
| D29 | R8 | **Arrondi** à 5 000 FCFA pour les seuls montants calculés par le système ; le montant arrêté par le gestionnaire est au franc près (395 500 FCFA pour `SIN-2026-9002`). | FR-73, FR-75 |
| D30 | R9 | **Les 104 vérifications du rejeu** passent par une table de reprise : chaque vérification est gardée, réécrite ou retirée (décision citée) ; la recette exige 104 sur 104 de la table réécrite. | FR-15, FR-16, FR-264, annexe E |
| D31 | R10 | **Annexe D et corps** : quand une FR et l'annexe D divergent, la FR suit l'annexe D, sauf plancher légal (délai de déclaration : au moins 5 jours ouvrés, 48 heures pour le vol, art. 12-4°). « 42 transitions » partout. | FR-14, FR-43, annexe D |
| D32 | R11 | **Provision au refus** : au corporel VTM, un refus ou un classement ne remet pas la provision à zéro tant que l'obligation légale d'offre demeure (art. 237) ; ailleurs, elle est ramenée à zéro avec motif et visa. | FR-121, FR-123, FR-133, FR-189 |
| D33 | R12 | **Corporel à plusieurs véhicules** : désignation de l'assureur qui présente l'offre pour compte commun, intérêts de retard à sa charge, répartition entre assureurs (art. 231 al. 6, 267 à 270, si sûr). | FR-82, FR-85, FR-108 |
| D34 | R13 | **Ajouts demandés par les réconciliations**, retenus : mise en service ; réversibilité ; registre des décès et ayants droit ; suivi médical complet ; sinistres majeurs ; états techniques de la direction ; contrôles du mémoire (séquence des numéros, revue mensuelle, état hebdomadaire, prévisions de règlement) ; engagements en deux colonnes jamais sommées ; courriers archivés en copie et impression groupée ; boucle offre expirée ou retournée ; vues DAF et DSI ; « défendable devant l'assuré, l'auditeur ou le juge » (FR-26) ; processus qui évolue par paramètres (FR-27). | FR-26, FR-27, FR-46, FR-57a, FR-63a, FR-70a, FR-189, FR-206, FR-207, FR-210, FR-229, FR-240, FR-242 |
| D35 | R14 | **Anonymat** : la compagnie du mémoire de 2014 s'écrit « la compagnie étudiée par le mémoire de 2014 (zone CIMA) » ; aucune pièce de référence n'identifie un pays ni une compagnie. | §0, §11 |
| D36 | R15 | **Non retenu sans avis du PO** : toute réduction de périmètre ; tout changement de D1 à D3 (numéro du LC, contrats lus). | §10 |

**Décisions D37 à D46 : arbitrages de la passe de cohérence.**

| # | Décision | Où |
|---|---|---|
| D37 | La transition 42 (transaction dénoncée sous 15 jours) renvoie vers `EN_INSTRUCTION` ; le circuit compte 42 transitions. | FR-135, FR-136 |
| D38 | Les honoraires sont des règlements `HONORAIRES`, hors de la machine du dossier ; visa du `RESP`, jamais du `CPT`. | FR-68, FR-91, FR-220 |
| D39 | Le règlement commercial relève du `DG`, mais l'accord du bénéficiaire reste exigé. | FR-78, FR-79 |
| D40 | `AUD` signale et rend un avis ; il n'écarte ni ne confirme une fraude : écarter relève du `RESP`, du `DG` ou du `DT` ; confirmer, du `DG` ou du `DT`. | FR-129, FR-130, FR-133 |
| D41 | La contre-expertise est décidée par le `RESP`, le `DG` ou le `DT`. | FR-68, FR-135 |
| D42 | La remise du chèque est faite par `ACC` ; `CPT` seulement s'il n'a pas émis. | FR-94, FR-96 |
| D43 | La clôture exige : reste à payer nul, règlements remis ou annulés, aucune mission ouverte, motif écrit. | FR-102, FR-105 |
| D44 | L'offre part sous 48 heures **ouvrées** ; le paiement suit l'accord sous 72 heures (au corporel, après les 15 jours de dénonciation). | FR-84, FR-85, FR-102 |
| D45 | Un cumul interdit ne tolère aucune exception ; le cumul se compte sur les acceptés et ordonnés non annulés et sur les dossiers en validation. | FR-7, FR-50, FR-78 |
| D46 | Le gabarit de lettre-chèque et les quittances sont ceux de la compagnie ; à défaut, remplissage manuel. | FR-94, FR-221 |

**Décisions D47 et D48 : révisions du 13/11.**

| # | Décision | Où |
|---|---|---|
| D47 | **Révision de l'arbitrage sur le litige** : pas d'acompte en `LITIGE` ; aucune transition de `LITIGE` vers `ORDRE_EMIS`, le circuit garde ses 42 transitions. Au corporel, l'offre provisionnelle reste la voie légale. À confirmer à la séance d'immersion. | FR-88, FR-92, FR-99, FR-124, FR-135 |
| D48 | **Portail expert via le relais** : les pièces de mission d'un médecin expert externe passent par le relais Money Vibes, chiffrées de bout en bout, sans copie gardée ; à valider par le juriste (J-27). | FR-180, FR-239 |

**Décision D49 : décision du PO du 13/11.**

| # | Décision | Où |
|---|---|---|
| D49 | Le PO retient les recommandations (défauts H, points juridiques J prudents, actions A) le 2026-11-13, vérifiées contre la pratique des éditeurs et du marché CIMA (pratiques-du-metier.md) ; cinq ajustements appliqués : limites de provision et de paiement séparées avec suppléance (FR-7, FR-8, FR-78, H-272 à H-276) ; voie rapide à conditions explicites, cumul et audit (FR-59, H-277 à H-280) ; offre partielle sur la part non contestée (FR-88, FR-124, H-281) ; accusé de déclaration immédiat (FR-14, FR-36, FR-48, H-282) ; modèle de convention d'indemnisation directe désactivé (FR-119, A-23, H-283, H-284). | §12.2, §13, annexe D |

### 12.2 Actions qui restent au PO

Ces points ne bloquent pas l'écriture, mais chacun doit être tranché avant l'architecture ou les épics. Les huit premières lignes sont les éléments à obtenir de la compagnie, **dans l'ordre du PO**. Chacune porte une **date limite de livraison** à fixer avec la compagnie (FR-219). Une entrée manquante est un **risque tracé**, pas un retrait de périmètre.

| # | Action | Ce que le PRD fait en attendant | Bloque | Recommandation retenue (PO, 2026-11-13) |
|---|---|---|---|---|
| A-1 | Obtenir de la compagnie le **manuel de procédures sinistres**. | La procédure étudiée par le mémoire de 2014 (compagnie de la zone CIMA) sert de modèle, à confirmer. | séance d'immersion | GARDER : le manuel sert de base à la mise en place ; à demander en premier. |
| A-2 | Obtenir les **délégations et seuils de validation**. | Défauts de D8 et D27, marqués « non confirmés » (FR-78). | matrice de délégation | GARDER, avec deux ajouts : demander aussi les limites de provision par rôle et les suppléances (FR-78). |
| A-3 | Obtenir le **nom et l'API du logiciel** actuel et du futur (connu en janvier) et la **forme des fichiers** de reprise (Excel ou JSON, le récit du PO fait foi). | Contrat d'échange générique, API ou fichier Excel ou JSON (annexe C) ; aucun connecteur nommé. | adaptateur d'API, reprise | GARDER : raccordement par API ou fichier quotidien, comme sur le marché. |
| A-4 | Obtenir la liste des **experts agréés**. | Sans elle, aucun cabinet n'est désignable en réel (FR-178) ; le panel de la démo n'est jamais utilisé en réel. | missions d'expertise | GARDER ; demander aussi les tarifs et les conventions des experts. |
| A-5 | Obtenir les **barèmes et les grilles de vétusté**. | Grilles indicatives de la démo, jamais utilisées en production (FR-72, FR-219). | provision d'ouverture, décompte | GARDER : grilles propres à la compagnie ; aucune grille publique de la zone. |
| A-6 | Obtenir les **modèles de courriers et de quittances**. | Modèles de la démo (FR-46). | offre, refus, quittance | GARDER : gabarits de la compagnie. |
| A-7 | Obtenir les **volumes** : dossiers par an, stock en cours, archives. | Hypothèse de dimensionnement de FR-23. | dimensionnement du serveur | GARDER : à obtenir avant le dimensionnement. |
| A-8 | Obtenir le **compte rendu de l'atelier** avec le service sinistres (il n'est pas dans le dépôt ; il en reste six constats). | Les six constats de la SPEC. | séance d'immersion | GARDER : source de procédure. |
| A-9 | **Préparer la séance d'immersion** : ordre du jour tiré des défauts H du §13.1 (les bloquants d'abord), jeu de démonstration prêt, liste des décisions à valider en séance. | — | §13.1 | GARDER ; mettre en tête les cinq ajustements (délégations, voie rapide, litige, accusé, convention d'indemnisation directe). |
| A-10 | **Demander l'amendement du PRD Reprise** : l'adaptateur API de l'assurance (FR-214) est au premier jour, alors que le PRD Reprise ne requiert que les fichiers en février. | Fichiers sans condition ; adaptateur d'API écrit dès que le LC est connu. | reprise par API | GARDER : fichiers d'abord, API ensuite. |
| A-11 | **Chiffrer l'adaptateur Mobile Money sortant de `paiement`** (T-Money, Flooz) ; `paiement` n'a aujourd'hui que le virement et PI-SPI (FR-223). | Tant qu'un opérateur n'a pas d'adaptateur sortant, son canal est « bientôt » et le dossier propose le chèque ou le virement, sans rien simuler (FR-223). | règlements Mobile Money | GARDER ; canal « bientôt » sans simulation (le Mobile Money règle déjà des sinistres sur le marché ivoirien). |
| A-12 | **Saisir les tables du barème corporel** : valeur du point d'incapacité permanente, capitalisation, barème médical, barème de responsabilité. Ce sont des **images** dans le PDF officiel : leur saisie est une tâche du plan, relue une à une par un second agent, puis validée par un actuaire ou un juriste (FR-24, FR-70, J-33). **Option de repli, le mode dégradé** : si les tables ne sont pas validées à la mise en service, le volet corporel fonctionne en **saisie manuelle motivée** (le gestionnaire arrête le montant avec un motif), échéances légales actives, écart tracé (`TABLE_NON_VALIDEE`). | Calcul corporel impossible sans elles ; le mode dégradé reste disponible. | évaluation du corporel | GARDER : saisie relue par un second agent, mode dégradé inclus. |
| A-13 | **Confirmer l'existence d'un fonds de garantie automobile au Togo** (FR-14, FR-111). | Paramètre « fonds actif » désactivé par défaut. | alertes du FGA | GARDER : paramètre désactivé tant que le fonds n'est pas confirmé. |
| A-14 | **Perte maximale et temps de reprise** (RPO, RTO) : alignés sur la spine du moteur, AD-16 (FR-236, FR-252). | Valeurs du PRD moteur, sans engagement (perte maximale 1 h, reprise en 4 h : spine du moteur, AD-16). | contrat, PRD moteur | GARDER : 24 h et 8 heures ouvrées, sans engagement. |
| A-15 | **Organiser la revue juridique** avant la mise en service : une ligne par point du §13.2, avec son **propriétaire** (désigné par le PO), sa date et son issue ; **date cible : 4 semaines avant la mise en service** (FR-24). | Défauts prudents du §13.2. | **mise en service** | GARDER : revue obligatoire avant la mise en service. |
| A-16 | **Charge de février : dire si elle tient.** La revue du PRD moteur d'installation chiffrait déjà 17 à 20 semaines de charge pour 10 disponibles ; ce PRD ajoute un module d'envergure (circuit complet, `ged` avec OCR réel, `expertises`, `assurance`, liaison et LC fictif). | **Le PRD ne coupe rien** : le PO a dit tout le circuit au premier jour. Il recommande un ordre de construction (§10.3), sans valeur de périmètre. | plan de février | Aucune réduction de périmètre ; ordre de construction du §10.3. |
| A-17 | **Faire valider les codes et numéros des modules** : `liaison-assureur` et M48 sont des propositions ; le code `assureur-fictif` n'a pas de numéro (FR-20). | Codes proposés. | manifestes | GARDER : convention interne. |
| A-18 | **Choisir les heures ouvrées** de la compagnie, base du délai de 4 heures et de la disponibilité (FR-246, FR-251). | À fixer au contrat. | contrat | GARDER : à fixer au contrat. |
| A-19 | **Amender les manifestes et spines touchés** (annexe A) : `reprise` ajoute `ged` et `expertises` à `enrichiPar` et fixe la charge de `reprise.cles-rattachement.publiees@1` (spine de la reprise) ; `paiement` publie les faits de paiement sortant (`paiement.reglement.*@1`) qu'il n'a pas encore ; la resynchronisation nocturne passe par `liaison-assureur` (`connecteurs` est hors février) ; les droits des codes à tiret attendent l'élargissement du format de droits d'`auth-service`. | Noms proposés dans l'annexe A. | manifestes, spines | GARDER : convention interne. |
| A-20 | **Trancher le portail du cabinet d'expertise externe** : hébergé par le relais Money Vibes (FR-239), pièces de mission chiffrées et à durée limitée, Money Vibes déclaré sous-traitant, aucune pièce médicale sauf nécessité de la mission ; repli par la voie `TRANSMISE`. Valider aussi le cas du médecin expert externe (D48). | Portail par le relais, repli `TRANSMISE` ; à confirmer à la séance d'immersion et par le juriste (J-27). | expertises externes | GARDER : repli `TRANSMISE` conservé. |
| A-21 | **Dire si la vue « réseau »** (courtiers, réclamations par intermédiaire) est utile au premier jour (FR-229). | Hors périmètre du premier jour (§10.2). | vue réseau | GARDER : hors du premier jour. |
| A-22 | **Désigner le responsable du recouvrement d'indu** après fraude confirmée, hors de Prospera (FR-133). | Alerte « indu à examiner » pour `RESP` et `DG` ; aucune créance ouverte sur l'assuré. | traitement de la fraude | GARDER : en général le juridique ou la direction. |
| A-23 | **Demander à l'association des assureurs du Togo si une convention d'indemnisation directe existe**, et obtenir les autres conventions de place de la compagnie (constat amiable, experts automobiles, pluralité d'experts, contre-expertise entre assureurs) (FR-68, FR-109, FR-119, FR-178). | Modèle d'indemnisation directe désactivé (FR-119) ; autres paramètres vides ; pas de contre-expertise contradictoire entre assureurs. | recours automobile, expertise | AJUSTER : demander à l'association des assureurs du Togo si une convention d'indemnisation directe existe ; modèle désactivé prêt (FR-119). |
| A-24 | **Faire confirmer par le LC (en janvier)** qu'il renvoie le numéro existant pour une référence `DEC-` déjà reçue (D24, FR-36, annexe C). | Sinon, contrôle de doublon par Prospera avant tout rattachement. | numéro de sinistre | GARDER ; repli : doublon contrôlé par Prospera. |

### 12.3 Risques assumés

| Risque | Effet | Ce que le PRD fait |
|---|---|---|
| **Premier risque : la reprise des données.** Les archives de la compagnie, leur format, leur volume et le logiciel d'où elles partent sont inconnus ; la compagnie peut tarder à fournir les éléments de FR-219. | Si la reprise est en retard, incomplète ou mal rattachée, « retrouver un dossier en moins de 5 secondes » et « répondre pendant l'appel » ne tiennent pas le premier jour, quelle que soit la qualité du reste. | Reprise par fichier sans condition ; dossiers en cours d'abord ; rapport de reprise validé avant que rien n'entre ; feu vert module par module ; un élément absent est signalé comme **décalant le premier jour** (FR-214 à FR-219). |
| **Les entrées de la compagnie arrivent en retard** (manuel de procédures, délégations, barèmes, experts agréés, modèles, volumes). | Le jour 1 se décale ou tourne avec des défauts de la démo. | Chaque entrée porte une date limite (FR-219, A-1 à A-8) ; une entrée manquante est un risque tracé, jamais un retrait de périmètre ; le feu vert par module (FR-20). |
| **Le logiciel de la compagnie est inconnu jusqu'en janvier.** | Le contrat d'échange peut ne pas convenir ; l'adaptateur d'API ne peut pas être écrit avant ; le LC peut ne pas dédoublonner sur `DEC-`. | Contrat générique par API ou fichier, dans les deux sens ; le LC fictif prouve le contrat ; la liste « à saisir » couvre un LC qui ne reçoit pas ; contrôle de doublon par Prospera en repli (FR-194 à FR-205, A-24). |
| **Les pièces de référence ne sont pas togolaises** (convention d'expertise tunisienne, mémoire de 2014 sur une compagnie de la zone CIMA, formulaires d'un fonds de garantie étranger). | Un délai, un seuil ou une procédure transposés peuvent ne pas valoir au Togo. | Tout est un paramètre ; chaque valeur transposée porte son identifiant de défaut ; les règles du Togo viennent du Code CIMA et de la loi sur les données personnelles (§0, §13). |
| **Les volumes sont inconnus.** | Le serveur peut être sous-dimensionné ou la recherche sous 5 secondes manquée. | Hypothèse de dimensionnement testée sur un jeu au volume ; configuration minimale issue du test ; avertissement au-delà du volume testé (FR-23). |
| **Aucun juriste n'a relu le PRD.** | Délais, barème corporel, données de santé, valeur probante de la copie numérisée, LBC/FT et fonds de garantie peuvent différer des défauts retenus. | **Revue juridique obligatoire avant la mise en service**, avec propriétaire et date cible ; défauts prudents du §13.2 ; aucun texte non vérifié n'est cité avec un numéro (FR-24, A-15). |
| **La base légale du traitement des données de santé n'est pas validée.** | Le traitement pour indemniser (obligation légale d'offre, exécution du contrat) pourrait être jugé insuffisant sans consentement. | Le consentement est recueilli à la déclaration, mais son absence ne bloque jamais une obligation légale ; minimisation stricte (ACC et NUM sans contenu, rien vers le LC, rien hors de la compagnie) ; point J-01 au §13.2 (FR-9, FR-19). |
| **Le portail du cabinet d'expertise externe passe par le relais Money Vibes.** | Une pièce de mission sort de la compagnie ; Money Vibes devient sous-traitant. | Pièces chiffrées, à durée limitée, sans pièce médicale hors nécessité ; repli `TRANSMISE` ; validation du juriste (FR-239, A-20, J-27). |
| **Les tables du barème corporel ne sont pas validées à la mise en service.** | Le calcul corporel est impossible ou faux. | Mode dégradé : saisie manuelle motivée, échéances légales actives, écart tracé (A-12, FR-70). |
| **La perte maximale et le temps de reprise reposent sur la spine du moteur** (RPO 1 h, RTO 4 h). | Une panne du serveur peut perdre des données ou durer plus que prévu. | Valeurs du PRD moteur sans engagement (perte maximale 1 h, reprise en 4 h : spine du moteur, AD-16) ; compteurs au maximum après restauration ; test de restauration (FR-236, A-14). |
| **Les modèles de l'IA commune n'existent pas encore.** | Au premier jour, les capacités sont servies par des règles explicables. | Chaque capacité dit sa provenance ; le mot « IA » n'est affiché que pour un modèle (FR-10). |
| **La démo n'enregistre rien** : le portefeuille est généré à chaque chargement, l'IA est faite de règles, rien n'est envoyé ni payé. | Tout est à construire, du serveur aux écrans. | Le PRD exige en vrai ce que la démo montre, et corrige ses écarts (§0, FR-15, FR-16). |
| **La charge de février.** | Charge très élevée pour deux développeurs. | Le périmètre est maintenu ; l'ordre de construction recommandé (§10.3) guide le plan ; l'action A-16 demande au PO de dire si la charge tient. |
| **L'accès direct à la base sur un serveur administré par la compagnie.** | ADMIN ou un tiers pourrait lire les données hors de l'application. | Risque résiduel assumé ; réduit par le chiffrement et le journal chaîné (FR-6, FR-253). |
| **La compagnie a dit qu'il manque des éléments.** | Des étapes seront à ajouter ou à parfaire à la séance d'immersion. | Tout seuil, délai et liste est un paramètre ; les défauts sont indexés au §13 pour être tranchés en séance ; un changement de statut ou de transition passe par un amendement versionné (FR-27). |

---

## 13. Hypothèses

Dans le brouillon, chaque choix incertain portait une balise d'hypothèse. Le PO a délégué ces choix à la rédaction : les balises sont devenues des **défauts retenus sur recommandation**. Chacun porte un identifiant dans le texte du PRD, sous la forme *(défaut H-nnn : …)* ou *(point juridique J-nn : …)*, et se retrouve ci-dessous. Les défauts H et les défauts prudents J sont **retenus par le PO le 2026-11-13** pour démarrer (D49). La séance d'immersion peut encore les changer, par l'annexe D, sans reprise du code. La revue juridique reste obligatoire avant la mise en service (FR-24, A-15).

- Les défauts **H-nnn** (284) sont des choix de gestion : valeur, délai, règle de travail. Ils se **confirment à la séance d'immersion**, propriétaire : le PO avec la compagnie. Les défauts qui changent le plus un dossier se traitent en premier : délégations et seuils de validation (H-014, H-062), base de la pénalité (paramètre `penalite.base`, annexe D), numéro de sinistre et capacité du logiciel de la compagnie à dédoublonner sur `DEC-` (H-033, H-034, H-156, H-202), portail du cabinet externe (H-194 à H-196), volumes (H-026, H-118, H-119).
- Les points **J-nn** (46) sont des points de droit : SMIG, base légale des données de santé, fonds de garantie, valeur probante de la copie numérisée, LBC/FT, conservation, sous-traitance. Ils se **tranchent à la revue juridique obligatoire avant la mise en service** (FR-24, action A-15) ; un défaut prudent s'applique en attendant. Les points J-30 à J-46 n'ont pas de balise dans le corps : ils sont listés ici parce que le texte les renvoie à la revue du juriste.
- Un défaut **confirmé ou changé** se met à jour dans l'annexe D (table des paramètres), **sans reprise du code**.

**Synthèse par thème** (les 284 défauts H, rangés par le thème de la FR ou du paramètre qui les porte) :

| Thème | Défauts H | Contenu |
|---|---|---|
| Circuit | 110 | machine à états, délais internes, validation et délégations, recours, fraude, expertises, provisions (FR-30 à FR-149, FR-177 à FR-193) |
| Paiement | 17 | règlements, chèques, quittance, LBC/FT, Mobile Money, rapprochement (FR-91 à FR-103, FR-220 à FR-225) |
| Pièces et archives | 30 | numérisation, OCR, classement, conservation, destruction, papier tenu en parallèle (FR-160 à FR-176) |
| IA | 21 | usages, seuils, garde-fous, fraude, instance locale (FR-10 à FR-12, FR-128 à FR-132, FR-154, FR-164, FR-231, FR-232) |
| Échange et reprise | 38 | contrat avec le logiciel de la compagnie, numéro de sinistre, reprise, feu vert, entrées de la compagnie (FR-36, FR-37, FR-194 à FR-205, FR-214 à FR-219, annexe C) |
| Volumes et exploitation | 19 | volumes, performance, sauvegarde, restauration, relais, support, maintenance (FR-23, FR-147, FR-150, FR-233 à FR-252) |
| Autres | 49 | rôles, accès, contrats lus, recherche et consultation, tableaux de bord, indicateurs, cadrage et annexes |
| **Total** | **284** | |

L'index complet suit. Sa colonne « Où » donne la FR ou la section du PRD qui porte le défaut ; un défaut de l'annexe D est aussi repris dans le tableau de sa table.

### 13.1 Défauts retenus sur recommandation, à confirmer à la séance d'immersion

| Id | Où | Défaut retenu |
|---|---|---|
| H-001 | §0. | … ; à confirmer à la séance d'immersion |
| H-002 | §1. | la v2 ne chiffre pas ; la cible de 5 s vient du deck du 12/09 et du PO ; 1 s est la cible du deck |
| H-003 | §2.3 | exemple de calcul ; le jeu de démonstration fixe la valeur exacte |
| H-004 | §2.3 | durée non mesurée ; à confirmer à la séance d'immersion |
| H-005 | FR-2 | les traités ne sont pas dans le LC ; à confirmer à la séance d'immersion |
| H-006 | FR-3 | valeurs de l'annexe D reprises du modèle de la microfinance ; à confirmer à la séance d'immersion |
| H-007 | FR-5 | chaque trimestre ; modèle de la microfinance |
| H-008 | FR-5 | valeurs de la démo comme défauts ; à confirmer à la séance d'immersion |
| H-009 | FR-6 | règle reprise de la microfinance ; à confirmer à la séance d'immersion |
| H-010 | FR-7 | 5 000 000 FCFA |
| H-011 | FR-7 | règle de contrôle interne ; à confirmer |
| H-012 | FR-7 | règle de contrôle interne, liée à l'alerte de changement de coordonnées avant paiement ; à confirmer |
| H-013 | FR-7 | règle de prudence ; à confirmer |
| H-014 | FR-8 | délégations réelles à obtenir de la compagnie ; défauts repris de la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer à la séance d'immersion |
| H-015 | FR-8 | procédure décrite dans le récit du PO ; tout est paramétrable |
| H-016 | FR-8 | frontière retenue par le PRD ; à confirmer à la séance d'immersion |
| H-017 | FR-9 | règle de minimisation ; à confirmer à la séance d'immersion |
| H-018 | FR-10 | la proposition v2 ne le prévoit pas, le deck du 12/09 oui ; à confirmer à la séance d'immersion |
| H-019 | FR-13 | chaque jour ; modèle de la microfinance |
| H-020 | FR-14 | délais de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer pour la compagnie |
| H-021 | FR-14 | calendrier ouvré de la compagnie, A-18 ; à confirmer à la séance d'immersion |
| H-022 | FR-15 | seuil de couverture repris de la microfinance |
| H-023 | FR-15 | opération réservée à ADMIN dans l'espace d'essai ; à confirmer |
| H-024 | FR-18 | la proposition v2 prévoit des comptes SMS fournis par la compagnie ; la v4 prévoit WhatsApp « si retenu » ; à confirmer à la séance d'immersion |
| H-025 | FR-20 | code et numéro proposés ; à valider avec le contrat de module |
| H-026 | FR-23 | 5 000 sinistres par an, 50 000 dossiers archivés, 1,5 million de pages, 60 utilisateurs simultanés, un site central et des guichets ; à remplacer par les volumes réels de la compagnie (stock en cours, archives, dossiers par an), à demander avant la séance d'immersion |
| H-027 | FR-23 | cible de 1 s reprise du deck du 12/09 ; la v2 dit « quelques secondes » |
| H-028 | FR-24 | le PO désigne le propriétaire ; date cible = 4 semaines avant la mise en service |
| H-029 | FR-25 | valeurs reprises de la microfinance ; à confirmer à la séance d'immersion |
| H-030 | FR-34 | canal « agence » à ajouter si la compagnie a des agences ; à confirmer à la séance d'immersion |
| H-031 | FR-34 | pas de portail assuré en libre-service au premier jour ; le chatbot de l'assuré est « bientôt » ; à confirmer à la séance d'immersion |
| H-032 | FR-34 | seuil de 1 jour ouvré |
| H-033 | FR-36 | capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement ; à confirmer à la séance d'immersion |
| H-034 | FR-37 | le LC attribue le numéro au démarrage, comme l'a dit le PO « pour un début » ; Prospera ne génère un numéro officiel que si la compagnie bascule le paramètre |
| H-035 | FR-37 | 2 jours ouvrés ; à confirmer à la séance d'immersion |
| H-036 | FR-40 | aucune interface avec les hôpitaux ; données saisies par l'agent ; à confirmer à la séance d'immersion |
| H-037 | FR-43 | valeurs des conditions générales de la compagnie à confirmer à la séance d'immersion ; le plancher légal l'emporte |
| H-038 | FR-46 | modèles de la démo à remplacer par ceux de la compagnie |
| H-039 | FR-47 | « sous 15 jours » comme dans la démo |
| H-040 | FR-47 | envoi automatique à confirmer à la séance d'immersion |
| H-041 | FR-48 | 10 jours, valeur de la démo |
| H-042 | FR-48 | alerte au 8e jour |
| H-043 | FR-49 | grilles en tranches de la démo reprises pour la provision d'ouverture seulement ; à remplacer par les règles de provisionnement de la compagnie |
| H-044 | FR-50 | 1 jour ouvré |
| H-045 | FR-53 | comparaison d'empreintes d'images à construire ; la démo la simule |
| H-046 | FR-55 | alertes et seuils de la démo ; chaque seuil est un paramètre de la compagnie |
| H-047 | FR-57 | le titulaire est conservé pendant l'attente de pièces ; à confirmer |
| H-048 | FR-57a | 20 000 000 FCFA ; à confirmer à la séance d'immersion |
| H-049 | FR-59 | 300 000 et 200 000 FCFA tirés du mémoire de 2014 sur la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer pour la compagnie |
| H-050 | FR-59 | valeur de la compagnie étudiée par le mémoire de 2014 (zone CIMA), défaut vide, à confirmer à la séance d'immersion |
| H-051 | FR-59 | défaut vide ; à confirmer à la séance d'immersion |
| H-052 | FR-60 | catalogue de pièces et taux horaire à obtenir de la compagnie ou construits pendant la reprise des archives ; valeurs de la démo (par exemple pare-chocs 60 000 à 150 000 FCFA, taux horaire 8 000 FCFA) non retenues comme référence |
| H-053 | FR-63a | motifs, jalons et types repris de la démo ; à confirmer avec le médecin-conseil |
| H-054 | FR-65 | à trancher avec le PO ; recommandation de la rédaction |
| H-055 | FR-68 | valeurs de la démo retenues ; à confirmer avec la liste des experts agréés et leurs conventions |
| H-056 | FR-68 | défauts de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer à la séance d'immersion |
| H-057 | FR-68 | 10 % ; à confirmer à la séance d'immersion |
| H-058 | FR-69 | ordre de la démo ; à confirmer par la compagnie, ses conditions générales pouvant prévoir un autre ordre |
| H-059 | FR-72 | grille de vétusté indicative de la démo ; à remplacer par la grille de la compagnie |
| H-060 | FR-73 | arrondi à 5 000 FCFA pour les montants calculés non corporels comme dans la démo, au franc pour le montant arrêté et le corporel ; à confirmer |
| H-061 | FR-76 | 2 000 000 FCFA, valeur de la démo ; à confirmer avec la matrice de délégation |
| H-062 | FR-78 | défauts tirés de la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) et du récit du PO ; délégations réelles à obtenir à la séance d'immersion |
| H-063 | FR-78 | procédure décrite dans le récit du PO ; tout est paramétrable |
| H-064 | FR-79 | composition et quorum du comité de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer |
| H-065 | FR-79 | majorité simple des présents ; à confirmer |
| H-066 | FR-84 | 48 heures ouvrées, comme dans la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) |
| H-067 | FR-84 | 24 heures, valeur du mémoire de 2014 |
| H-068 | FR-86 | 3 000 000 FCFA ; à confirmer à la séance d'immersion |
| H-069 | FR-89 | J+15 et J+30 comme dans la décision de cadrage ; à confirmer |
| H-070 | FR-90 | un acompte passe par une offre d'acompte avec accord enregistré ; à confirmer à la séance d'immersion |
| H-071 | FR-92 | état repris de la démo, à ajouter aux cinq états de D11 |
| H-072 | FR-93 | 5 000 000 FCFA ; à confirmer à la séance d'immersion |
| H-073 | FR-94 | la compagnie fournit son gabarit de lettre-chèque ; à défaut, remplissage manuel |
| H-074 | FR-96 | durée de validité du code |
| H-075 | FR-100 | seuil national non lu, paramètre vide donc alerte inactive tant qu'il n'est pas saisi ; D21 |
| H-076 | FR-100 | la déclaration de soupçon se fait hors Prospera ; à confirmer |
| H-077 | FR-103 | les comptes sont saisis par la compagnie ; Prospera exporte des natures d'opération, la compagnie les affecte à ses comptes |
| H-078 | FR-106 | bordereau complémentaire pour les pièces tardives du recours ; à confirmer avec l'archiviste |
| H-079 | FR-108 | la démo n'en porte qu'un par dossier ; un accident à plusieurs véhicules en demande plusieurs |
| H-080 | FR-109 | 5 jours ouvrés ; la procédure de la compagnie étudiée par le mémoire de 2014 (zone CIMA) dit « dès l'ouverture » sans chiffre |
| H-081 | FR-111 | fonds de garantie automobile désactivé par défaut ; D21 |
| H-082 | FR-112 | la démo n'abandonne que depuis RECLAMATION_ENVOYEE, NEGOCIATION et CONTENTIEUX, et n'a pas d'arbitrage |
| H-083 | FR-113 | honoraires non inclus par défaut |
| H-084 | FR-113 | règlement égal à l'évaluation arrêtée, 395 500 FCFA ; le jeu de démonstration fixe la valeur exacte |
| H-085 | FR-115 | seuil de perte à obtenir de la compagnie ; paramètre vide, validation de RESP seule tant qu'il n'est pas saisi |
| H-086 | FR-117 | rapprochement des encaissements de recours dans `paiement` quand le relevé est importé, sinon confirmation manuelle ; à préciser avec le module |
| H-087 | FR-118 | 730 jours par défaut, valeur de la démo et la plus prudente |
| H-088 | FR-119 | arbitrage activé pour les recours entre assureurs automobiles, par un paramètre ; à vérifier auprès de l'association des assureurs ; D21 |
| H-089 | FR-120 | garde-fou du PO sur le corporel étendu au recours ; à confirmer |
| H-090 | FR-121 | 2 jours ouvrés ; la procédure du mémoire de 2014 (zone CIMA) parle de 48 heures pour la décision et 72 heures pour l'information de l'assuré |
| H-091 | FR-121 | procédure du mémoire ; à confirmer à la séance d'immersion |
| H-092 | FR-123 | 15 jours après la dernière relance, d'après le texte de la 3e relance de la démo |
| H-093 | FR-123 | 500 000 FCFA ; à confirmer à la séance d'immersion |
| H-094 | FR-123 | délai de grâce de 30 jours avant versement, pour laisser l'assuré se manifester |
| H-095 | FR-125 | extension à tous les états non terminaux et à `REGLE`, car une suspicion peut naître à tout moment |
| H-096 | FR-126 | la démo ne rouvre pas SANS_SUITE |
| H-097 | FR-126 | alerte à la 3e ouverture |
| H-098 | FR-128 | la démo ne dit pas à partir de quel niveau la revue s'ouvre ; SUSPECT par recommandation |
| H-099 | FR-129 | séparation du relecteur et du gestionnaire |
| H-100 | FR-129 | 3 jours ouvrés |
| H-101 | FR-130 | 3 jours ouvrés ; à confirmer à la séance d'immersion |
| H-102 | FR-132 | bénéficiaire et compte de paiement ajoutés aux entités de la démo |
| H-103 | FR-132 | les liens nourrissent la revue, pas le score |
| H-104 | FR-132 | la démo simulait l'empreinte de photo ; sans modèle de vision, seule l'identité exacte du fichier est comparée |
| H-105 | FR-132 | 5 dossiers minimum ; la démo fixe 20 % mais pas le nombre minimum |
| H-106 | FR-133 | la récupération d'un indu est **hors périmètre**, dite au §10.2 avec un **responsable désigné** ; à traiter à la séance d'immersion |
| H-107 | FR-135 | 9, 21, 23, 27, 33 à 36, 41 et 42 sont des ajouts de rédaction pour qu'aucun état n'ait de cul-de-sac et que le paiement puisse être arrêté ; 15, 16 et 18 découlent de D6 et D11 |
| H-108 | FR-135 | refus d'un dossier non attribué non prévu ; à confirmer à la séance d'immersion |
| H-109 | FR-139 | statuts et transitions modifiés par amendement versionné, non par paramètre (FR-27) ; à confirmer à la séance d'immersion |
| H-110 | FR-142 | 15 jours ; à confirmer à la séance d'immersion |
| H-111 | FR-142 | 30 jours ; à confirmer à la séance d'immersion |
| H-112 | FR-142 | procédure du mémoire |
| H-113 | FR-142 | la SPEC ne définit ni départ ni arrêt du délai cible ; départ à la déclaration, arrêt à REGLE, REJETE ou SANS_SUITE |
| H-114 | FR-143 | envoi automatique à confirmer à la séance d'immersion |
| H-115 | FR-144 | la consultation n'interrompt pas le silence, pour qu'elle ne masque pas l'inactivité |
| H-116 | FR-146 | canal par défaut de l'assuré = SMS |
| H-117 | FR-146 | alerte à mi-délai des 48 h ouvrées |
| H-118 | FR-147 | volume de dimensionnement de D20 |
| H-119 | FR-150 | volumes de D20, à remplacer par les vrais volumes |
| H-120 | FR-150 | cible du deck, non contractuelle |
| H-121 | FR-151 | longueur minimale de saisie = 3, paramètre |
| H-122 | FR-153 | 2 chiffres visibles, paramètre |
| H-123 | FR-154 | « quelques minutes » de la proposition v2 chiffré à 5 minutes, paramètre |
| H-124 | FR-155 | liste de la démo, modifiable |
| H-125 | FR-156 | l'escalade monte au DG, à confirmer |
| H-126 | FR-160 | antivirus fourni par la compagnie, à confirmer en séance d'immersion |
| H-127 | FR-163 | 2 minutes par page, paramètre |
| H-128 | FR-164 | seuils 0,60 et 0,90, paramètres |
| H-129 | FR-166 | 3 jours ouvrés, paramètre |
| H-130 | FR-167 | formats de la démo comme défauts ; à confirmer à la séance d'immersion |
| H-131 | FR-170 | couleurs à fournir par la compagnie |
| H-132 | FR-170 | 12 mois, paramètre |
| H-133 | FR-170 | si la compagnie les garde ; à confirmer à la séance d'immersion |
| H-134 | FR-171 | 30 jours, paramètre |
| H-135 | FR-172 | impression à la clôture, à confirmer en séance d'immersion |
| H-136 | FR-172 | numérisation à la demande, paramètre |
| H-137 | FR-174 | date de clôture |
| H-138 | FR-175 | double visa, à confirmer en séance d'immersion |
| H-139 | FR-176 | test mensuel, paramètre |
| H-140 | FR-176 | 80 %, paramètre |
| H-141 | FR-176 | hypothèse de D20, à remplacer par les vrais volumes |
| H-142 | FR-176 | PDF/A, à confirmer |
| H-143 | FR-178 | 60 jours, paramètre |
| H-144 | FR-179 | jeu de démonstration seulement |
| H-145 | FR-180 | second facteur obligatoire pour EXPE, à confirmer |
| H-146 | FR-183 | poids par domaine à fournir par la compagnie |
| H-147 | FR-184 | défaut de la compagnie étudiée par le mémoire de 2014 (zone CIMA) ; à confirmer à la séance d'immersion |
| H-148 | FR-185 | 10 % ; à confirmer à la séance d'immersion |
| H-149 | FR-186 | la prime n'entre dans aucun indicateur sinistre, comme dans la démo |
| H-150 | FR-186 | la reprise amorce la projection ; à confirmer avec le plan de la reprise |
| H-151 | FR-189 | 250 000 FCFA, paramètre boni_mali.seuil ; à confirmer avec la direction technique |
| H-152 | FR-192 | seuil à fixer avec la compagnie |
| H-153 | FR-193 | transposition de la décision de la microfinance (PRD-MF §6.5, décision A9) ; à confirmer |
| H-154 | FR-197 | règle de la microfinance reprise, décision A10 ; à confirmer à la séance d'immersion |
| H-155 | FR-198 | format de la démo ; préfixe PRO- à confirmer |
| H-156 | FR-198 | capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement |
| H-157 | FR-199 | confirmation par marquage de l'agent quand le LC ne renvoie rien |
| H-158 | FR-199 | (valeur posée sans commentaire) |
| H-159 | FR-201 | âge maximal de lecture pour l'ouverture, paramètre |
| H-160 | FR-201 | horloge de l'alerte suspendue pendant une coupure déclarée |
| H-161 | FR-202 | ordre de grandeur de la démo |
| H-162 | FR-203 | signal de doublon côté LC fictif, pour la démonstration du contrôle |
| H-163 | FR-208 | 07:00, paramètre |
| H-164 | FR-211 | cible de temps, paramètre |
| H-165 | FR-211 | pas de compte pour la CRCA |
| H-166 | FR-211 | non mesurée ; à mesurer à la première revue |
| H-167 | FR-212 | 5 minutes, paramètre |
| H-168 | FR-213 | transposition à confirmer pour le Togo |
| H-169 | FR-214 | le PRD Reprise (FR-1, spine AD-23) ne requiert que les fichiers en février ; un amendement est demandé pour l'adaptateur API de l'assurance (§12.2) |
| H-170 | FR-215 | 3 à 5 ans de la proposition v2 |
| H-171 | FR-217 | bascule par dossier à la première action ; à confirmer à la séance d'immersion |
| H-172 | FR-217 | date de fin fixée à la mise en service ; la nuit continue tant qu'aucune date n'est posée |
| H-173 | FR-217 | (valeur posée sans commentaire) |
| H-174 | FR-218 | valeurs de contrôle de départ, à fixer avec la compagnie |
| H-175 | FR-219 | premier risque désigné par l'équipe de rédaction ; à reporter au §12 et à confirmer à la séance d'immersion |
| H-176 | FR-219 | le bilan s'appuie sur le bilan du moteur d'installation ; à confirmer avec le PRD §7 |
| H-177 | FR-219 | date fixée à la séance d'immersion ; sinon 4 semaines avant la mise en service |
| H-178 | FR-219 | comité de pilotage, proposé par la proposition v2 |
| H-179 | FR-221 | la compagnie a ou non un gabarit bancaire d'impression ; à confirmer |
| H-180 | FR-222 | la compagnie n'a pas de cœur bancaire ; à revérifier à l'adhésion à PI-SPI |
| H-181 | FR-225 | répartition proposée ; à confirmer à la séance d'immersion |
| H-182 | FR-225 | la valeur nationale n'est pas trouvée ; le paramètre est vide par défaut et l'alerte de cumul est inactive tant qu'il l'est |
| H-183 | FR-227 | règle de minimisation ; à confirmer à la séance d'immersion |
| H-184 | FR-228 | confirmé par le README de la démo ; à confirmer à la séance d'immersion |
| H-185 | FR-229 | vue réseau hors périmètre du premier jour, dite au §10.2 ; à confirmer à la séance d'immersion |
| H-186 | FR-230 | noms de finalités proposés ; à valider avec le contrat de module |
| H-187 | FR-231 | modèle de la microfinance ; la v4 parle d'un serveur « capable d'héberger à terme le calcul de l'IA locale » |
| H-188 | FR-232 | lecture stricte de « aucune donnée médicale ne sort » ; à confirmer |
| H-189 | FR-235 | valeurs reprises de la microfinance ; à confirmer |
| H-190 | FR-235 | gel après 30 jours sans contact et version non mise à jour comme les autres installations sur site (PRD moteur FR-15, FR-32) ; à confirmer au contrat |
| H-191 | FR-236 | modèle de la microfinance |
| H-192 | FR-236 | RPO 1 h, RTO 4 h, alignés sur la spine du moteur (AD-16) |
| H-193 | FR-238 | règle reprise de la microfinance ; à confirmer |
| H-194 | FR-239 | relais repris du modèle de la microfinance ; à confirmer à l'installation |
| H-195 | FR-239 | modèle de la microfinance |
| H-196 | FR-239 | modèle de la microfinance |
| H-197 | FR-240 | durées et nombre de sessions à confirmer avec la compagnie |
| H-198 | FR-245 | règle du point d'écriture unique par domaine reprise des PRD distributeur et microfinance |
| H-199 | FR-246 | contenu de la maintenance repris de la proposition v2 ; prix et durée au contrat, hors PRD |
| H-200 | FR-246 | objectif de conception de 99,5 % du temps ouvré, sans engagement, repris de la microfinance ; à confirmer à la séance d'immersion |
| H-201 | FR-250 | valeurs provisoires ; à confirmer avec le test de FR-23 |
| H-202 | §C.1 | capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement |
| H-203 | §C.2 | état « partielle » à confirmer |
| H-204 | §Annexe D. | (valeur posée sans commentaire) |
| H-205 | §D.1 | (valeur posée sans commentaire) |
| H-206 | §D.2 | (valeur posée sans commentaire) |
| H-207 | §D.2 | (valeur posée sans commentaire) |
| H-208 | §D.2 | (valeur posée sans commentaire) |
| H-209 | §D.2 | (valeur posée sans commentaire) |
| H-210 | §D.2 | (valeur posée sans commentaire) |
| H-211 | §D.2 | (valeur posée sans commentaire) |
| H-212 | §D.2 | (valeur posée sans commentaire) |
| H-213 | §D.2 | (valeur posée sans commentaire) |
| H-214 | §D.2 | (valeur posée sans commentaire) |
| H-215 | §D.2 | (valeur posée sans commentaire) |
| H-216 | §D.2 | (valeur posée sans commentaire) |
| H-217 | §D.2 | (valeur posée sans commentaire) |
| H-218 | §D.2 | (valeur posée sans commentaire) |
| H-219 | §D.2 | (valeur posée sans commentaire) |
| H-220 | §D.2 | (valeur posée sans commentaire) |
| H-221 | §D.2 | (valeur posée sans commentaire) |
| H-222 | §D.2 | (valeur posée sans commentaire) |
| H-223 | §D.2 | (valeur posée sans commentaire) |
| H-224 | §D.2 | (valeur posée sans commentaire) |
| H-225 | §D.2 | (valeur posée sans commentaire) |
| H-226 | §D.2 | (valeur posée sans commentaire) |
| H-227 | §D.2 | (valeur posée sans commentaire) |
| H-228 | §D.3 | (valeur posée sans commentaire) |
| H-229 | §D.3 | (valeur posée sans commentaire) |
| H-230 | §D.3 | (valeur posée sans commentaire) |
| H-231 | §D.3 | (valeur posée sans commentaire) |
| H-232 | §D.3 | (valeur posée sans commentaire) |
| H-233 | §D.3 | (valeur posée sans commentaire) |
| H-234 | §D.3 | (valeur posée sans commentaire) |
| H-235 | §D.3 | (valeur posée sans commentaire) |
| H-236 | §D.3 | (valeur posée sans commentaire) |
| H-237 | §D.3 | (valeur posée sans commentaire) |
| H-238 | §D.3 | (valeur posée sans commentaire) |
| H-239 | §D.3 | (valeur posée sans commentaire) |
| H-240 | §D.3 | (valeur posée sans commentaire) |
| H-241 | §D.3 | (valeur posée sans commentaire) |
| H-242 | §D.3 | (valeur posée sans commentaire) |
| H-243 | §D.3 | (valeur posée sans commentaire) |
| H-244 | §D.3 | (valeur posée sans commentaire) |
| H-245 | §D.3 | (valeur posée sans commentaire) |
| H-246 | §D.3 | (valeur posée sans commentaire) |
| H-247 | §D.3 | (valeur posée sans commentaire) |
| H-248 | §D.3 | (valeur posée sans commentaire) |
| H-249 | §D.3 | (valeur posée sans commentaire) |
| H-250 | §D.3 | (valeur posée sans commentaire) |
| H-251 | §D.3 | (valeur posée sans commentaire) |
| H-252 | §D.3 | (valeur posée sans commentaire) |
| H-253 | §D.3 | (valeur posée sans commentaire) |
| H-254 | §D.3 | (valeur posée sans commentaire) |
| H-255 | §D.3 | (valeur posée sans commentaire) |
| H-256 | §D.3 | (valeur posée sans commentaire) |
| H-257 | §D.3 | (valeur posée sans commentaire) |
| H-258 | §D.3 | (valeur posée sans commentaire) |
| H-259 | §D.3 | (valeur posée sans commentaire) |
| H-260 | §D.3 | (valeur posée sans commentaire) |
| H-261 | §D.3 | (valeur posée sans commentaire) |
| H-262 | §D.3 | (valeur posée sans commentaire) |
| H-263 | §D.3 | (valeur posée sans commentaire) |
| H-264 | §D.3 | (valeur posée sans commentaire) |
| H-265 | §D.3 | (valeur posée sans commentaire) |
| H-266 | §D.3 | (valeur posée sans commentaire) |
| H-267 | §D.3 | (valeur posée sans commentaire) |
| H-268 | §D.3 | (valeur posée sans commentaire) |
| H-269 | §D.3 | à confirmer à la séance d'immersion |
| H-270 | §D.4 | (valeur posée sans commentaire) |
| H-271 | §D.5 | (valeur posée sans commentaire) |
| H-272 | FR-78, §D.1 | limite de provision par rôle : `GEST` écart cumulé glissant de 2 000 000 FCFA, `RESP` provision totale de 5 000 000 FCFA, `DT` au-delà ; à confirmer par les délégations réelles (A-2) |
| H-273 | FR-78, §D.1 | limite de paiement par rôle : celles de la matrice (1 000 000 FCFA pour le `RESP`), distinctes des limites de provision |
| H-274 | FR-78, §D.1 | cumul anti-fractionnement sur les paiements validés et sur la provision totale du dossier |
| H-275 | FR-78, §D.1 | suppléance : durée maximale de 30 jours, renouvelable avec un nouveau motif |
| H-276 | FR-78, §D.1 | suppléance : personne nommée, motif obligatoire, alerte à `AUD` à la création, jamais au-delà de la limite du délégant ; à confirmer à la séance d'immersion |
| H-277 | FR-59, §D.2 | voie « accord sur devis » : six conditions cumulatives (matériel automobile, aucun corporel, garantie acquise sans réserve, aucun signal de fraude, pièces obligatoires complètes, aucun tiers contestant) |
| H-278 | FR-59, §D.2 | voie « accord sur devis » : période du cumul anti-fractionnement par police et par véhicule, 90 jours |
| H-279 | FR-59, §D.2 | voie « accord sur devis » : plafond cumulé de 500 000 FCFA par police et par véhicule sur la période |
| H-280 | FR-59, §D.2 | voie « accord sur devis » : audit mensuel par échantillon par `AUD`, 10 % des dossiers du mois, 5 au moins |
| H-281 | FR-88, FR-124, §D.2 | offre partielle sur la part non contestée, hors corporel, par retour à `EN_INSTRUCTION` ; à confirmer à la séance d'immersion et par le juriste |
| H-282 | FR-36, FR-48, §D.2 | accusé de déclaration (référence `DEC-`) immédiat et automatique ; le délai de 10 jours reste le dernier recours pour l'accusé de réception du dossier complet |
| H-283 | FR-119, §D.2 | modèle de convention d'indemnisation directe désactivé par défaut, activable par paramètre ; à confirmer par l'association des assureurs du Togo (A-23) |
| H-284 | FR-119, §D.2 | indemnisation directe : seuil, barème forfaitaire et délai de règlement vides ; constat amiable obligatoire ; périmètre deux véhicules assurés, dommages matériels |

### 13.2 Points juridiques : défauts prudents en attendant le juriste

| Id | Où | Défaut prudent |
|---|---|---|
| J-01 | FR-9 | base légale retenue ; à valider par le juriste, §13.2 |
| J-02 | FR-9 | règle du secret médical à confirmer par le médecin-conseil et le juriste |
| J-03 | FR-14 | base d'interprétation ; à valider par le juriste, FR-24 |
| J-04 | FR-14 | existence non confirmée ; le paramètre « fonds actif » est désactivé par défaut ; à vérifier par le juriste |
| J-05 | FR-19 | les articles de droits de la loi n'ont pas été relus ; à vérifier |
| J-06 | FR-41 | à valider par le juriste, §13.2 |
| J-07 | FR-44 | liste de la démo complétée par les art. 240-241 ; à valider par le juriste avant mise en service |
| J-08 | FR-70 | catégorie à valider par le juriste, §13.2 |
| J-09 | FR-70 | SMIG du Togo 52 500 FCFA par mois depuis le 1er janvier 2023 (sources secondaires, texte officiel non trouvé), SMIG annuel = 12 fois le mensuel ; tout est paramètre daté, à confirmer par le juriste ; la lecture du plafond de l'art. 263 (« six mois de revenus plafonnés à trente-six fois ») est ambiguë et à faire valider |
| J-10 | FR-70a | à valider par le juriste, §13.2 |
| J-11 | FR-82 | à valider par le juriste, §13.2 |
| J-12 | FR-85 | base à faire valider par le juriste |
| J-13 | FR-86 | workflow mineurs et incapables : pièce d'autorisation exigée avant l'ordre ; à valider par le juriste |
| J-14 | FR-98 | la loi togolaise ne fixe aucun plafond trouvé pour les assureurs ; à valider par le juriste, D21 |
| J-15 | FR-121 | à valider par le juriste, §13.2 |
| J-16 | FR-123 | classement sans suite d'un dossier corporel réservé à la direction ; à valider par le juriste |
| J-17 | FR-133 | à valider par le juriste, §13.2 |
| J-18 | FR-153 | à valider par le juriste, §13.2 |
| J-19 | FR-158 | aligné sur le plancher de l'art. 404, à confirmer par le juriste |
| J-20 | FR-174 | plancher de l'art. 404 appliqué ; les 5 ans de la démo ne s'appliquent que si le juriste le confirme (D21) |
| J-21 | FR-180 | voir FR-239 ; Money Vibes déclaré sous-traitant ; à confirmer à la séance d'immersion et par le juriste |
| J-22 | FR-189 | l'IBNR est estimé hors de Prospera au premier jour ; à confirmer avec le juriste et la direction technique |
| J-23 | FR-196 | aucune donnée de santé vers le LC ; base légale à valider par le juriste, §13.2 |
| J-24 | FR-222 | l'acceptation électronique n'est offerte qu'après validation juridique, FR-24 ; sinon la quittance se signe au guichet |
| J-25 | FR-223 | le Règlement CIMA sur la LBC/FT ne cite pas le Mobile Money ; traitement par analogie aux moyens à vérification minutieuse, à valider par le juriste |
| J-26 | FR-225 | à confirmer par le juriste |
| J-27 | FR-239 | le portail du cabinet externe est hébergé par le relais Money Vibes, pièces de mission chiffrées et à durée limitée, Money Vibes déclaré sous-traitant ; aucune pièce médicale n'y transite sauf nécessité de la mission ; à confirmer à la séance d'immersion et par le juriste |
| J-28 | §C.1 | à confirmer à la séance d'immersion ; base légale à valider par le juriste, §13.2 |
| J-29 | §D.3 | à valider par le juriste, §13.2 |
| J-30 | FR-14, FR-24 | version consolidée du Code CIMA : les articles cités sont lus dans un texte de travail ; le juriste confirme la version officielle en vigueur et les modifications récentes |
| J-31 | FR-140 | règle de comptage des mois (mois commencé ou révolu, jour férié) : défaut prudent = mois de date à date, échéance reportée au jour ouvré suivant ; à valider par le juriste |
| J-32 | FR-85, FR-124 | articulation entre la suspension des délais et la saisine du juge : les échéances restent affichées et alertées ; à valider par le juriste |
| J-33 | FR-70, A-12 | art. 263 et validation des tables du barème corporel (valeur du point, capitalisation, barème médical, barème de responsabilité) par un actuaire ou un juriste avant usage en production |
| J-34 | FR-68, FR-109, FR-178 | conventions de place : indemnisation directe, constat amiable, experts automobiles, art. 275 (partage de responsabilité), qualifications des experts (art. 272) ; paramètres vides en attendant |
| J-35 | FR-19, FR-232 | transferts hors Togo (art. 28 à 31 de la loi sur les données personnelles) et notification des violations de données : aucune donnée ne sort ; procédure de notification à valider |
| J-36 | FR-100, FR-225 | non-information du client en matière de LBC/FT (ne pas révéler la déclaration de soupçon) : règle d'affichage et de courrier à valider (voir J-11) |
| J-37 | FR-169, FR-172 | valeur probante de la copie numérisée : le papier fait foi tant que le juriste n'a pas validé ; le numérique ne le remplace pas |
| J-38 | FR-13, FR-172 | horodatage qualifié : l'horodatage du journal chaîné n'est pas qualifié ; le juriste dit s'il l'exige pour la preuve |
| J-39 | FR-86, FR-111, FR-114 | recommandé électronique, notamment pour la dénonciation de la transaction et les mises en cause : non accepté tant que le juriste n'a pas tranché ; preuve de réception par un moyen listé en paramètre |
| J-40 | FR-192 | contenu exact des états C10 (art. 422) et du registre chronologique : à vérifier par le juriste |
| J-41 | FR-14, FR-142 | délais contractuels des autres branches IARD (matériel, risques divers) : non fixés par le Code CIMA ; défauts internes à confirmer avec les conditions générales de la compagnie |
| J-42 | FR-41, FR-187 | opposabilité de l'art. 210 et de son interprétation du 11/04/2011 : ce qui reste opposable à la victime (réserve et non refus) ; à confirmer par le juriste |
| J-43 | FR-118 | effet d'une mise en demeure sur la prescription biennale du recours : défaut prudent = la mise en demeure n'interrompt rien ; à valider par le juriste |
| J-44 | FR-121, FR-123 | dossier refusé au corporel (art. 237, « pour le compte de qui il appartiendra ») : la provision n'est pas remise à zéro tant que l'obligation d'offre demeure ; à valider par le juriste |
| J-45 | FR-13, FR-192 | transposition des art. 406 et 407 (pas d'insertion ni de suppression ultérieure, droit d'accès du contrôleur) à un dossier de sinistre : application par analogie, à valider par le juriste |
| J-46 | FR-22, FR-24 | signature électronique des offres et des transactions : « bientôt », à n'activer qu'après la validation du juriste |

---

## Annexe A. Contrat de module (13 lignes par module)

Le contrat `CONTRAT-DE-MODULE-2026-11-09.md` (§6) demande à chaque PRD treize lignes par module, une par clause C1 à C13. **Les règles de lecture et les conventions communes sont celles du PRD distributeur (PRD-D annexe A)**, sans être recopiées : aucune cellule vide ; gate `<CODE>_NOT_ENTITLED` ; cloisonnement par `organisationId` et par portée ; profil compose `profiles: ["<code>"]` ; version `1.0.0` ; routes C13 de l'instance ; lecture seule, essai, export et effacement comme au PRD-D. Cette annexe suit la forme de l'annexe A du PRD microfinance.

Ce qui change pour l'assurance :
- **Licence et installation chez la compagnie** (FR-234, FR-235) : chaque module tourne sur le serveur applicatif et le NAS de la compagnie ; aucune route n'est ouverte vers l'extérieur ; les entrées d'internet (réponses WhatsApp, notifications de paiement) passent par le relais (FR-239). Le régime de licence et le contrat de maintenance sont des clauses du contrat commercial, hors de ce PRD (FR-235). La lecture seule pour abonnement échu reste une capacité de la plateforme ; elle n'est pas un parcours de cette installation.
- **Codes à tiret** : `liaison-assureur` et `assureur-fictif` ont un tiret ; leurs droits ne passent le format `^[a-z]+:[a-z-]+:[a-z]+$` que depuis l'élargissement du format de droits d'`auth-service` (amendement C7 du 2026-11-11), comme les codes à tiret du distributeur et de la microfinance. Tant qu'il n'est pas fait, leurs droits sont **déclarés mais non attribuables**, et le tableau de la clause C7 le dit.
- **C11 IA** : chaque module déclare ses modèles et ses finalités ; **le moteur est l'IA commune** (FR-10, §7.4), en instance locale chez la compagnie. Les modules la consomment, ils n'embarquent aucun modèle. Les noms de modèles et de finalités sont des **propositions** (FR-230). Une capacité d'IA absente affiche `NON_DISPONIBLE` : ce n'est jamais bloquant, une règle explicable prend le relais et l'écran le dit (FR-10, FR-11). Aucune voix : aucun modèle de dictée, de transcription ni de synthèse vocale n'est déclaré (D13, FR-22).
- **Les noms** de services porteurs, de droits, de faits publiés (`module.objet.evenement@1`), de modèles et de finalités sont des **propositions**, modifiables avant le manifeste ; `[À CONFIRMER]` marque ce qui reste à lever, notamment tout ce que la spine d'assurance doit trancher (découpage en services, propriétaire des mouvements de provision).
- **Ce que la compagnie ne fait pas dans Prospera** : elle n'y tient ni ses contrats ni sa comptabilité (FR-2, FR-3). Aucun module de cette annexe n'écrit une police, une garantie, une prime ni une écriture au grand livre.
- Les rôles cités à la clause C7 sont ceux du §2.1 (quatorze rôles) ; le comité sinistres est une **instance** de la matrice de délégation (FR-8), pas un rôle ; `ADMIN` ne lit aucune donnée métier (FR-6, FR-238) et `CPT` n'a aucun droit de décision (FR-7).

### A.1 ★ Sinistres (`sinistres`, M05)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'sinistres'`, `version: '1.0.0'`. `depends: [{ged, "Chaque pièce d'un dossier vit dans la GED ; sinistres n'en tient aucune copie et lit les pièces par leur référence (§6.2)."}]` (dépendance **proposée**, à valider par le PO et par la spine). `enrichiPar: [assurance (projection des contrats lus, grille et mouvements de la provision, cession, états), expertises (missions, experts, médecin-conseil, portail expert, honoraires), liaison-assureur (numéro de sinistre officiel, contrats, envois au logiciel de la compagnie), paiement (exécution des règlements, rapprochement), notification (cloche, SMS, WhatsApp, e-mail), dashboard (cockpits par rôle), reseau (site central, guichets, rattachement des agents), reprise (dossiers en cours et historique), IA commune (les 14 usages du FR-10), connecteurs (hors février)]`. Service porteur : à cadrer par la spine d'assurance [À CONFIRMER, D18] ; le backend de la démo (`prospera-assurance`) ne compte pas comme service. Contient le **recours** (suivi parallèle, FR-32, FR-108 à FR-120), la fraude (FR-125 à FR-133) et la recherche et la fiche du dossier (FR-150 à FR-158). |
| C2 Socle | Gate `SINISTRES_NOT_ENTITLED`. Cloisonnement par `organisationId` et par **portée** : le **volet** (corporel, matériel, risques divers) est une portée de `GEST`, le **pôle recours** une autre, tenues par `sinistres` et **lues** par `reseau` (FR-244) ; une portée vide est vide, jamais « tout ». `DG`, `DT`, `RESP`, `AUD` voient tous les dossiers (`AUD` en lecture seule) ; `GEST` son volet ; `GREC` ses recours ; `MED` et `EXPI` leurs missions ; `ACC` la recherche et la réception, sans le contenu médical (FR-153) ; `CPT` les ordres et les règlements, sans donnée de santé (FR-148) ; `ADMIN` aucune donnée métier. **Le serveur évalue seul** le rôle, la table des 42 transitions, les conditions nommées et le motif obligatoire ; un écran ne peut pas forcer ce que le serveur refuse (FR-137). Données de santé : lisibles de `MED`, du `GEST` corporel affecté, de `RESP`, et de `DG`/`DT` par **dossier ouvert à la validation** ; `ACC` et `NUM` voient le **type** et l'**existence** d'une pièce médicale, jamais son contenu ; chaque lecture est journalisée (FR-9, FR-158). Double authentification pour tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord (FR-25, `MFA_ROLES`, annexe D). |
| C3 Données possédées | Dossiers sinistres (8 phases, **11 statuts** : `DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `EN_INSTRUCTION`, `EVALUE`, `EN_VALIDATION`, `OFFRE_ENVOYEE`, `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE`, `CLOTURE`, et les 4 sorties `REJETE`, `SANS_SUITE`, `LITIGE`, `FRAUDE_SUSPECTEE`, FR-30, FR-31, FR-134), déclarations et leur référence `DEC-AAAA-NNNNN`, numéro de sinistre officiel rattaché, formulaires d'instruction par type, recevabilité et décisions de garantie motivées, qualification de la responsabilité, évaluations arrêtées et leur décompte ligne à ligne (ordre : dommage, vétusté, règle proportionnelle, plafond, franchise, FR-69 ; poste par poste au corporel, FR-70), les cinq montants distincts (évalué, proposé, validé, payé, reste à payer, FR-75), matrice de délégation, séances et procès-verbaux du comité, fiches de décision, offres (provisionnelle, définitive), accords et procès-verbaux de transaction, **ordres de règlement** (décision, bénéficiaire, montant, nature, marque « libéré ») — les **règlements** eux-mêmes et leurs états (`A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC` : six états, clé d'idempotence ; un règlement `EN_COURS` ou `INCONNU` ne s'annule pas) et les états de chèque (dont `CHEQUE_EN_OPPOSITION`) sont tenus par **`paiement`, seul registre des règlements sortants**, et lus ici par ses faits (amendement du PRD paiement du 2026-11-13 ; spine assurance) —, condition d'émission `DELAI_DENONCIATION_ECOULE`, état de déclaration `SAISIE_MANUELLE`, quittances (`PRETE`, `EDITEE`, `SIGNEE`, `REMISE`, `ENCAISSEE`), remises de chèque, clôtures et réouvertures, recours et leur machine (`A_QUALIFIER` à `RECUPERE` ou `ABANDONNE`), créances à trois montants, mises en demeure, signaux et scores de fraude, revues, réclamations, files et corbeilles, échéances légales et internes, notifications émises, plan de contrôle et constats de `AUD`, **registre de l'IA** (entrée, sortie, confiance, sources, niveau, statut, auteur de la décision, FR-12), **journal horodaté et chaîné** de chaque transition et de chaque lecture sensible (FR-13, FR-138). **Lues seulement** : polices, garanties, primes, intermédiaires, coassureurs, traités (projection d'`assurance`, source : le logiciel de la compagnie), pièces (`ged`), missions, experts et rapports (`expertises`), état des moyens de paiement (`paiement`), nœuds et portées (`reseau`), propositions de l'IA commune. **Aucun contrat, aucune comptabilité.** |
| C4 Emplacements vides | `ged` est une dépendance dure. `assurance` absent : la projection des contrats est `{etat: NON_INSTALLE, module: assurance}` ; le contrôle de garantie **ne se saute pas** (FR-42) : le gestionnaire enregistre la décision motivée `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE` (motif de 10 caractères au moins), visible de `AUD` ; la provision du dossier est `NON_INSTALLE` (le dossier avance, l'écran dit « provision non tenue ») [À CONFIRMER par la spine : si la provision doit rester une dépendance dure de `sinistres`, FR-188]. `liaison-assureur` absent : numéro officiel `{etat: NON_INSTALLE}` ; la référence `DEC-` est attribuée quand même, la déclaration apparaît dans la liste « à saisir dans le logiciel de la compagnie » (FR-199) et l'agent reporte le numéro obtenu. `expertises` absent : missions et portail `NON_INSTALLE` ; la voie « accord sur devis » (FR-59) et les types sans expertise obligatoire avancent, un dossier qui exige une expertise attend (le motif est affiché) [À CONFIRMER avec le PO]. `paiement` absent : chèque enregistré à la main (FR-221), virement, PI-SPI et Mobile Money `NON_INSTALLE` (FR-222, FR-223), le dossier propose un autre moyen. `notification` absent : cloche interne seule, SMS, WhatsApp et e-mail `NON_INSTALLE` ; le courrier papier reste possible (FR-146). `dashboard` absent : l'emplacement du cockpit est vide, les files de FR-147 à FR-149 restent (FR-228). `reseau` absent : un seul site, volet et pôle recours lus des affectations de `sinistres` (FR-244) [À CONFIRMER]. `reprise` absent : pas de dossier repris, le circuit va quand même jusqu'à l'archive (FR-20). **IA commune absente : les usages d'IA du circuit (FR-10) = `NON_DISPONIBLE`, une règle explicable ou la saisie à la main prend le relais, aucun parcours n'est bloqué** (FR-10, FR-11, FR-230). Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `sinistres.declaration.enregistree@1` (référence `DEC-`, police, date de survenance, volet ; pour `liaison-assureur`), `sinistres.dossier.changed@1` (état absolu du dossier : statut, volet, gestionnaire, montants, échéances), `sinistres.dossier.ouvert@1`, `sinistres.dossier.attribue@1`, `sinistres.garantie.decidee@1`, `sinistres.evaluation.arretee@1` (pour `liaison-assureur`), `sinistres.provision.revisee@1` (montant, motif, pièce ; pour `assurance`), `sinistres.decision.validee@1`, `sinistres.offre.envoyee@1`, `sinistres.accord.enregistre@1`, `sinistres.reglement.ordonne@1` (pour `paiement`, un par règlement), `sinistres.reglement.changed@1` (états du règlement et de sa quittance ; pour `liaison-assureur` et l'export comptable), `sinistres.dossier.cloture@1`, `sinistres.dossier.rouvert@1`, `sinistres.sortie.decidee@1` (rejet, sans suite, litige), `sinistres.fraude.signalee@1` (jamais vers l'assuré ni le courtier), `sinistres.recours.changed@1`, `sinistres.recours.encaisse@1`, `sinistres.echeance.alerte@1` (délai légal ou interne, pour `notification` et `dashboard`), `sinistres.portee.volet.changed@1` (pour `reseau`), `sinistres.reclamation.changed@1`, `sinistres.ia.proposition.enregistree@1`. Consomme `ged.piece.recue@1`, `ged.piece.controlee@1`, `ged.dossier.verse@1`, `assurance.police.changed@1`, `assurance.garantie.changed@1`, `liaison-assureur.numero-sinistre.attribue@1`, `liaison-assureur.envoi.etat@1`, `liaison-assureur.ecart.ouvert@1`, `expertises.mission.changed@1`, `expertises.rapport.depose@1`, `expertises.honoraires.vises@1`, `paiement.reglement.execute@1`, `paiement.reglement.echoue@1`, `paiement.reglement.inconnu@1`, `paiement.reglement.rapproche@1` (noms **proposés** ; `paiement` n'a pas encore d'adaptateur sortant, FR-223), `notification.envoi.delivre@1`, `reseau.portee.changed@1`, `reseau.noeud.changed@1`, `reprise.feu-vert.changed@1`, `etat-publie.changed.reel@1` et `.essai@1`. Les noms sont des propositions. |
| C6 Paramètres | Tout seuil, délai, montant, taux ou liste est un paramètre de la compagnie (FR-4) : voir l'**annexe D** (D.1 règles transverses, D.2 circuit, D.5 référentiel légal). Les principaux : qui attribue le numéro de sinistre (LC ou Prospera) et le délai d'alerte du numéro (1 jour ouvré) ; matrice de délégation (≤ 1 000 000 FCFA responsable ; au-delà, comité de 4 membres, quorum 3, puis visa du directeur technique ; règlement à titre commercial : direction générale seule ; cumul des montants du dossier, FR-8) ; voie « accord sur devis » (dossier ≤ 300 000, devis ≤ 200 000 FCFA, FR-59) ; seuils d'expertise (aucune sous 250 000, externe obligatoire au-dessus de 3 000 000) ; seuil d'écart de rapport (15 % attention, 35 % bloquant, FR-65) ; grille de provision d'ouverture par volet et gravité, seuil d'écart de provision (2 000 000 FCFA, FR-188) ; offre sous 48 h, relances d'offre à J+15 et J+30 ; paiement sous 72 h après l'accord ; plafond d'espèces 500 000 FCFA ; fenêtres LBC/FT (5 jours, 30 jours, 60 %) ; relance de recours tous les 15 jours, alerte de prescription à 90 jours ; poids et seuils des signaux de fraude (FR-127, FR-128) ; délais internes par produit ; relances (5 jours entre deux, 3 sans effet, 8/15/30 jours de silence) ; réclamations (5, 30, 60 jours) ; délais de recherche (5 s au 95e centile). Les **délais légaux du corporel** (art. 231, 233, 236, pénalité de 5 % par mois) sont un **référentiel daté, non modifiable** par la compagnie (FR-14, annexe D.5). Données, jamais code. |
| C7 Droits | `sinistres:declaration:saisir`, `sinistres:dossier:consulter`, `sinistres:dossier:attribuer` (`RESP`), `sinistres:dossier:instruire` (`GEST`), `sinistres:garantie:decider`, `sinistres:evaluation:arreter`, `sinistres:decision:valider` (`RESP`, `DT`, `DG` selon la délégation), `sinistres:comite:decider`, `sinistres:offre:envoyer`, `sinistres:accord:enregistrer`, `sinistres:reglement:ordonner` (**jamais** attribué à `CPT`, FR-7), `sinistres:reglement:emettre` (`CPT`), `sinistres:cheque:remettre` (`ACC`, `CPT`), `sinistres:dossier:clore`, `sinistres:dossier:rouvrir`, `sinistres:recours:gerer` (`GREC`), `sinistres:fraude:revoir` (`AUD`), `sinistres:sante:consulter` (`MED`, `GEST` corporel, `RESP`, `DG`, `DT`), `sinistres:reclamation:traiter`, `sinistres:delegation:gerer` (`DG`), `sinistres:parametre:administrer`, `sinistres:journal:consulter` (`AUD`), `sinistres:ia:decider`. Format conforme à `^[a-z]+:[a-z-]+:[a-z]+$`. Chaque droit demande une PR `auth-service` (catalogue fermé) ; le détail rôle par droit est à l'annexe B. |
| C8 Module d'écran | `src/modules/sinistres/` : `/sinistres` (corbeilles `GEST`, file `RESP`, FR-147), `/sinistres/recherche` (recherche unique, FR-150), `/sinistres/declarer` (déclaration à quatre canaux, FR-34), `/sinistres/dossiers/[id]` (fiche « répondre pendant l'appel », frise des 11 statuts, instruction, évaluation, décompte, offre, règlements, journal), `/sinistres/validation` (file de validation, comité, FR-148), `/sinistres/comptabilite` (ordres, chèques, rapprochements), `/sinistres/guichet` (remise, pièces à réclamer), `/sinistres/recours` (pôle recours, FR-149), `/sinistres/controle` (fraude, plan de contrôle, FR-149), `/sinistres/reclamations`, `/sinistres/echeances`, `/sinistres/parametres`. Entrées de menu par droit (`sinistres:dossier:consulter`, `sinistres:declaration:saisir`, `sinistres:decision:valider`, `sinistres:reglement:emettre`, `sinistres:recours:gerer`, `sinistres:fraude:revoir`). Boutons non branchés de la démo : « bientôt », sans date, jamais simulés (FR-22) ; l'emplacement du chatbot de l'assuré affiche « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : dossiers, journal, registre de l'IA, règlements, recours, quittances restent stockés et masqués ; aucun bouton « supprimer » n'existe (FR-175) ; test aller-retour. Les règlements déjà exécutés restent valides chez `paiement`. Avertissement : « Plus aucun dossier ne sera déclaré, instruit, validé ni payé ; les règlements déjà exécutés restent valides, les recours en cours ne seront plus relancés, les délais légaux ne seront plus surveillés. » La conservation de 10 ans au moins (art. 404, FR-174) vaut après désinstallation. |
| C10 Démarrer seul | `profiles: ["sinistres"]` ; socle + `ged`. Sans autre module, un dossier va de `DECLARE` à `CLOTURE` : le contrôle de garantie par décision motivée, la saisie à la main des experts, le chèque rempli à la main et la liste « à saisir dans le logiciel de la compagnie » tiennent lieu des modules absents. Avec `assurance`, `liaison-assureur` et `assureur-fictif` (espace d'essai seulement), le parcours de `SIN-2026-9002` se mène rôle après rôle, de la déclaration à l'archive (FR-205). Sans `reprise`, sans `dashboard` et sans IA commune, le circuit va jusqu'à l'archive (FR-20). |
| C11 IA | `ia: { modeles: ['declaration-assistee', 'controle-pieces', 'relance-pieces', 'pre-remplissage-instruction', 'analyse-devis', 'explication-montant', 'detection-fraude-liens', 'redaction-courrier', 'appreciation-recours', 'resume-dossier', 'recherche-langage-naturel', 'brief-du-matin', 'qualite-dossier-simulation'], finalites: ['declaration-assistee', 'controle-pieces', 'relance-pieces', 'preremplissage-instruction', 'analyse-devis', 'explication-montant', 'detection-fraude', 'redaction-courrier', 'recours', 'resume-dossier', 'recherche-langage-naturel', 'brief-du-matin-et-veille', 'qualite-et-simulation'] }`. L'orientation d'expertise assistée, la complétude d'un rapport d'expert et la comparaison au portefeuille (FR-58, FR-64) sont déclarées par `expertises` (A.3). Le module **spécifie** ces capacités (FR-35, FR-47, FR-53, FR-56, FR-60, FR-74, FR-83, FR-120, FR-122, FR-132, FR-154, FR-155, FR-157, FR-208, FR-209) ; le **moteur est l'IA commune**, en instance locale chez la compagnie (FR-10, FR-230). Le module définit entrées, sorties, destinataire et affichage, et **ne calcule aucun score lui-même**. Garde-fous : **aucune décision automatique** ; **jamais de montant proposé sur un préjudice corporel**, ni à `GEST` ni à `MED` (FR-71) : c'est une règle du service, pas seulement de l'écran ; chaque information est **sourcée** jusqu'à la pièce ; chaque proposition va au **registre de l'IA** (niveau `EXTRACTION`, `ANALYSE` ou `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`) ; le score de fraude n'est qu'un signal, la revue humaine est obligatoire et motivée (FR-129) ; aucune dictée ni transcription d'appel (déclaration assistée = WhatsApp et e-mail) ; aucune donnée de santé ne sort de l'instance (FR-232). Tant qu'un modèle n'existe pas : règle explicable, et l'écran n'écrit pas « IA » (FR-10). |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteurs : `declaration-assistee-ia`, `analyse-devis-ia`, `graphe-des-liens-ia`, `numero-attribue-par-prospera` (bascule du paramètre « qui attribue le numéro » sans reprise de code, FR-198). La forme du journal, du registre de l'IA, des états du règlement et de la quittance ne change jamais dans la fenêtre de sept jours ; un statut, un état ou un motif ajouté est lu comme **inconnu** par la version précédente, qui refuse la transition plutôt que de la deviner. Un dossier est jugé selon le référentiel en vigueur à sa **date de survenance** (FR-14, FR-235). |
| C13 Installable sous contrôle | Prérequis : `ged` en service ; (recommandés) `assurance` et `liaison-assureur` en service. Vérifications : `transitions-gardees` (🟢 si, sur un dossier d'essai, le chemin nominal atteint les 11 statuts dans l'ordre, si une transition absente de la table des 42 est refusée par le serveur et si aucun statut non terminal n'est sans issue, FR-135, FR-139 ; 🔴 sinon) ; `garantie-non-sautable` (🟢 si l'ouverture d'un dossier sans contrôle de garantie ni décision motivée est refusée ; 🔴 sinon, FR-42) ; `aucun-ordre-sans-accord` (🟢 si un ordre de règlement est refusé tant que l'accord n'est pas enregistré, FR-90 ; 🔴 sinon) ; `separation-des-taches` (🟢 si l'instructeur ne valide pas son propre dossier, si celui qui décide n'émet ni ne paie, et si le cumul des montants du dossier décide du niveau de validation, FR-7, FR-81 ; 🔴 sinon) ; `delegation-parametree` (🟢 si ≤ 1 000 000 FCFA est signé par le responsable, un montant au-dessus est refusé au responsable seul et passe au comité puis au visa du directeur technique, un règlement à titre commercial n'est signé que par la direction générale ; 🔴 sinon, FR-8, FR-78) ; `decompte-dans-l-ordre` (🟢 si un dossier d'essai donne 702 000 FCFA pour un dommage de 780 000, franchise 10 % et minimum 50 000 ; 🔴 sinon, FR-69) ; `corporel-sans-montant-ia` (🟢 si aucun point d'entrée n'accepte un montant proposé par l'IA sur un dossier corporel ; 🔴 sinon, FR-71) ; `plafond-especes` (🟢 si un règlement en espèces au-dessus du plafond est refusé avec un code nommé ; 🔴 sinon, FR-98). Lecture seule : consultation, journal, export. **`objetsDeReprise: ['sinistres.dossier@1']** : les **dossiers sinistres** en cours d'abord, l'historique ensuite (état traduit, dates d'origine, montants, provisions, expert désigné, trace de la source), repris selon FR-214 et FR-215 ; valeurs de contrôle : nombre de sinistres ouverts, somme des provisions des sinistres ouverts (FR-218). `domainesEchange: ['sinistres.dossiers']` (`MOUVEMENT`, `argent: true`, `controle: true`), servi par `liaison-assureur` et décrit à l'annexe C [À CONFIRMER avec le contrat de Connecteurs]. Essai : aucun message réel n'est envoyé, aucun ordre réel ne part, les sorties sont interceptées et comptées (FR-205). |

### A.2 ★ Pièces, numérisation et archives (`ged`, M07)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'ged'`, `version: '1.0.0'`. `depends: []` (aucune dépendance dure : la GED reçoit, lit, classe, conserve et retrouve des pièces sans autre module ; une pièce enregistrée sans dossier va dans la file « à rattacher », FR-159, FR-166). `enrichiPar: [sinistres (dossiers, pièces attendues, clés de rattachement), expertises (rapports et pièces transmises à une mission), assurance (polices, pièces contractuelles), liaison-assureur (documents de sinistre existants, numéro d'archivage d'origine), reprise (pièces historiques, clés de rattachement, numéro d'archivage conservé), notification (alertes de file et de chemise), reseau (postes de numérisation des guichets), IA commune (lecture et classement des pièces)]`. Service porteur : `document-service` étendu (D18), qui est déjà `prospera-ocr-service` [À CONFIRMER par la spine : quelle part du service existant sert l'OCR réel des scans et la gestion du fonds papier]. |
| C2 Socle | Gate `GED_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée du dossier auquel la pièce appartient (volet, FR-6). `ACC` reçoit une pièce et ne la lit pas si elle est médicale (FR-153, FR-159) ; `NUM` ses lots (type et existence d'une pièce médicale, jamais son contenu) ; `ARCH` le fonds, les versements, la cote, les sorties ; `GEST` corporel, `MED`, `RESP`, `DG`/`DT` par dossier ouvert à la validation lisent les pièces de santé, chaque lecture étant journalisée (FR-9) ; `EXPE` ne voit que la **liste de pièces choisie** pour sa mission (FR-180) ; `AUD` lit sans modifier ; `ADMIN` ne lit aucune pièce. **Aucun bouton « supprimer »** pour aucun rôle, `ADMIN` compris (FR-175). Les fichiers ne sortent pas du site : stockage sur le NAS de la compagnie (FR-176). |
| C3 Données possédées | Pièces et leurs **versions** (jamais écrasées, FR-161), source, date de réception réelle, auteur, pages, responsable de fourniture, empreinte, statut de lecture (`NON_TRAITE`, `EN_COURS`, `OK`, `PARTIEL`, `ECHEC`) et texte lu stocké **en plus** de l'image (FR-163), types de pièces, lots de numérisation (`EN_ATTENTE`, `SCAN_EN_COURS`, `INDEXATION`, `CONTROLE_QUALITE`, `ARCHIVE`, `ANOMALIE`, FR-162), contrôles avant archivage et leur auteur (FR-165), file « à rattacher » (FR-166), numéros d'archivage `ARC-AAAA-CCCC-NNNNN` jamais réutilisés (FR-167), bordereaux de versement avec la valeur de chaque pièce (`ORIGINAL_IRREMPLACABLE`, `ORIGINAL_REEDITABLE`, `COPIE`, FR-168), scellements par empreinte et support de référence (FR-169), cotes physiques (local, travée, tablette, boîte, rang), chemises de couleur par branche, état du papier (`EN_RAYONNAGE`, `COMMUNIQUE`, `TRANSFERE_EXTERNE`, `INTROUVABLE`, `DETRUIT`, `JAMAIS_CONSTITUE`, FR-170), sorties et restitutions d'archive (FR-171), reconstitutions et constats de carence (FR-173), durées de conservation par nature (FR-174), bordereaux de destruction et leurs visas (FR-175), journal des lectures et registre de l'IA du classement. **Lues seulement** : dossiers, statuts et pièces attendues (`sinistres`), polices (`assurance`), missions (`expertises`), clés de rattachement (`reprise`), propositions de classement de l'IA commune. |
| C4 Emplacements vides | Aucune dépendance dure. `sinistres` absent : les pièces se reçoivent et se rangent mais ne se rattachent à aucun dossier, elles vont dans la file « à rattacher » ; `{etat: NON_INSTALLE, module: sinistres}` pour les pièces attendues. `reprise` absent : pas de pièce historique, numéros d'archivage attribués par la GED seule. `expertises` absent : aucune liste de pièces transmises. `assurance` absent : pas de rattachement par police. `notification` absent : alertes en cloche interne seule. `reseau` absent : un seul poste de numérisation, pas de guichet. **IA commune absente : lecture et classement des pièces = `NON_DISPONIBLE`, le classement est manuel, l'OCR continue (il n'est pas de l'IA, il tourne sur le serveur de la compagnie), le circuit n'est pas retardé** (FR-164). Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `ged.piece.recue@1` (pièce reçue, « reçue, en contrôle »), `ged.piece.controlee@1` (« reçue » au sens de l'ouverture du dossier, FR-165), `ged.piece.versionnee@1`, `ged.piece.rattachee@1`, `ged.piece.a-rattacher@1` (alerte à 3 jours ouvrés), `ged.lot.changed@1`, `ged.dossier.verse@1` (numéro d'archivage, bordereau), `ged.dossier.scelle@1` (support de référence), `ged.empreinte.echec@1`, `ged.sortie-archive.changed@1` (alerte à 15 et 30 jours), `ged.dossier.reconstitue@1`, `ged.destruction.decidee@1`, `ged.stockage.alerte@1` (sauvegarde en échec, NAS à 80 %). Consomme `sinistres.dossier.changed@1` (statut, clôture : le dossier clos à verser), `sinistres.dossier.cloture@1`, `sinistres.dossier.rouvert@1` (sortie de chemise), `expertises.rapport.depose@1` (pièce de la mission), `reprise.cles-rattachement.publiees@1` (numéro de police, numéro de sinistre, FR-215), `reprise.historique.livre@1`, `liaison-assureur.document.recu@1` (documents de sinistres existants), `notification.envoi.delivre@1`, `etat-publie.changed.reel@1` et `.essai@1`. Les noms sont des propositions. |
| C6 Paramètres | Voir l'**annexe D** (D.3, modules propres). Les principaux : formats et taille maximale d'un fichier (`image/jpeg`, `image/png`, `image/webp`, `application/pdf` ; 8 Mo, FR-160), antivirus, liste des types de pièces, seuil de couche texte (60 caractères par page, FR-163), délai d'une page non lue (2 minutes), seuils de confiance de l'IA (0,60 et 0,90, FR-164), délai d'alerte de la file « à rattacher » (3 jours ouvrés), alerte de versement (75 jours), capacité d'une boîte (2 500 pages), vérification physique (12 mois), restitution d'une chemise (15 jours, puis 30), couleurs de chemise par branche (à fournir par la compagnie), durées de conservation par nature (**10 ans au moins**, **30 ans pour le sinistre mortel**, conservation définitive du corporel, du contentieux et de la fraude, FR-174), visas de destruction, test de restauration, seuil d'occupation du NAS (80 %). La durée de conservation est un **plancher réglementaire** (art. 404, annexe D.5) : le formulaire refuse une durée plus courte. Données, jamais code. |
| C7 Droits | `ged:piece:recevoir` (`ACC`, `NUM`), `ged:piece:consulter`, `ged:piece:controler` (`NUM`, agent récepteur), `ged:piece:rattacher`, `ged:lot:numeriser` (`NUM`), `ged:fonds:verser` (`ARCH`), `ged:fonds:sceller` (`ARCH`), `ged:fonds:verifier` (`ARCH`, `AUD`), `ged:papier:sortir` (`ARCH`), `ged:dossier:reconstituer`, `ged:destruction:proposer` (`ARCH`), `ged:destruction:viser` (`RESP`, `DG`), `ged:sante:consulter`, `ged:parametre:administrer`, `ged:journal:consulter` (`AUD`). **Aucun droit « supprimer »** n'existe dans le catalogue. Format conforme à `^[a-z]+:[a-z-]+:[a-z]+$`. Une PR `auth-service` par droit. |
| C8 Module d'écran | `src/modules/ged/` : `/ged` (réception et pièces du jour), `/ged/lots` (numérisation, contrôle de qualité, « à refaire »), `/ged/a-rattacher` (file des pièces non rattachées), `/ged/fonds` (fonds, versements, numéros d'archivage, bordereaux), `/ged/fonds/[arc]` (fiche d'archive : état papier et état numérique, cote, scellement, versions), `/ged/chemises` (sorties et restitutions), `/ged/reconstitution`, `/ged/destruction` (liste destructible, bordereau, visas), `/ged/parametres`. L'écran d'une pièce s'affiche aussi dans le dossier (`sinistres`). Entrées de menu par droit (`ged:piece:recevoir`, `ged:lot:numeriser`, `ged:fonds:verser`). Aucune dictée ; boutons non branchés : « bientôt » (FR-22). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : pièces, versions, lots, empreintes, numéros d'archivage, cotes et bordereaux restent sur le NAS, masqués ; test aller-retour ; **la suite des numéros d'archivage est conservée** (réinstaller reprend sans trou ni doublon, FR-167). Avertissement : « Plus aucune pièce ne sera reçue, classée ni archivée ; les dossiers ne pourront plus joindre de pièces ; les pièces déjà conservées restent sur le NAS, sous conservation de dix ans au moins. » |
| C10 Démarrer seul | `profiles: ["ged"]` ; socle seul. Sans autre module, une pièce est reçue, lue par l'OCR, classée à la main, contrôlée, archivée, versée au fonds avec son numéro d'archivage et sa cote, et retrouvée dans la recherche de la GED. |
| C11 IA | `ia: { modeles: ['lecture-classement-pieces'], finalites: ['lecture-pieces'] }` : capacité du FR-164 (type, champs lus avec leur extrait source, rattachement proposé, confiance), servie par l'IA commune en instance locale. L'**OCR** (FR-163) n'est pas de l'IA et tourne sur le serveur de la compagnie. Destinataire : `ACC`, `NUM`, `GEST`. Garde-fous : l'IA propose, la personne confirme au contrôle avant archivage (FR-165) ; l'IA ne rejette aucune pièce ; sous le seuil bas, rien n'est pré-sélectionné ; un champ sans extrait n'est pas proposé ; niveau `EXTRACTION` au registre ; une pièce médicale est lue dans l'instance et n'est jamais affichée à `ACC` ; aucune pièce de santé ne sort (FR-232). Le contrôle de cohérence des pièces (usage n° 3) est déclaré par `sinistres`. Absente, le classement est manuel. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteurs : `lecture-ia-des-pieces`, `horodatage-qualifie` (option du scellement, à valider par le juriste, D21), `format-archive-pdfa` [À CONFIRMER, FR-176]. Le format d'une version de pièce, de l'empreinte, du numéro d'archivage et de la cote ne change jamais dans la fenêtre de sept jours ; l'image d'origine n'est jamais modifiée par une migration. |
| C13 Installable sous contrôle | Prérequis : le NAS de la compagnie joignable et la sauvegarde configurée. Vérifications : `ocr-lit-un-scan` (🟢 si un PDF scanné sans couche texte, déposé sur le jeu de contrôle, est lu, classé et ses champs extraits ; 🔴 s'il est déclaré illisible, FR-163) ; `versions-intactes` (🟢 si le second scan d'une pièce crée la version 2 et laisse la version 1 lisible ; 🔴 sinon, FR-161) ; `archivage-controle` (🟢 si une pièce non contrôlée reste « reçue, en contrôle » et n'est pas comptée reçue ; 🔴 sinon, FR-165) ; `numero-archivage-unique` (🟢 si deux versements concurrents ne reçoivent jamais le même numéro et si un numéro détruit n'est pas réattribué ; 🔴 sinon, FR-167) ; `empreinte-fiable` (🟢 si la modification d'une pièce après scellement fait échouer la vérification et lève l'alerte ; 🔴 sinon, FR-169) ; `rien-ne-se-supprime` (🟢 si aucune route ni aucun écran ne supprime une pièce ou un dossier pour aucun rôle ; 🔴 sinon, FR-175) ; `conservation-plancher` (🟢 si une durée inférieure à 10 ans est refusée par le formulaire ; 🔴 sinon, FR-174) ; `restauration-testee` (🟢 si une pièce déposée se retrouve après la restauration de la sauvegarde la plus récente ; 🔴 sinon, FR-176). Lecture seule : consultation, journal, export. **`objetsDeReprise: ['ged.piece@1', 'ged.archive@1']`** : les **pièces** (fichier et métadonnées : assuré, police, sinistre, date, type de pièce) et les **fiches d'archive** (numéro d'archivage d'origine conservé, cote physique, chemise, état du papier), repris selon FR-215 ; le papier historique **n'est pas numérisé** pour la reprise (FR-172) ; valeur de contrôle : nombre de pièces rattachées (FR-218). `domainesEchange: ['ged.documents-sinistres']` (`MOUVEMENT`, `argent: false`, `controle: true`), alimenté par `liaison-assureur` (annexe C, C-10) [À CONFIRMER avec le contrat de Connecteurs]. |

### A.3 ★ Experts et intervenants (`expertises`, M29)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'expertises'`, `version: '1.0.0'`. `depends: [{sinistres, "Une mission d'expertise est rattachée à un dossier sinistre et à une question distincte (véhicule, blessures, responsabilité) ; sans dossier, pas de mission (§5.5)."}, {ged, "Le rapport d'expertise, les photos et les pièces transmises à un expert sont des pièces du dossier ; expertises n'en tient aucune copie (FR-180)."}]` (dépendances **proposées**, à valider par le PO et par la spine). `enrichiPar: [assurance (provision et estimation de référence), paiement (honoraires d'expert réglés par le circuit des règlements), notification (désignation, rapport reçu, complément demandé), reseau (zones des experts), dashboard (charge et délais des experts), IA commune (orientation, complétude, comparaison)]`. Service porteur : `prospera-assurance-service` étendu (D18) [À CONFIRMER par la spine : la machine des missions est écrite en §5.5, les personnes et les cabinets en §6.3]. |
| C2 Socle | Gate `EXPERTISES_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée de la **mission** : `EXPE` (cabinet externe avec compte) ne voit **que ses missions**, via le portail, sans recherche générale, sans montant d'évaluation, sans provision, sans instruction (FR-180) ; `EXPI` ses missions et leurs dossiers (FR-179) ; `MED` les missions médicales ; `GEST` désigne pour son volet et ne voit que les experts désignables ; `RESP` et `DT` créent et désactivent un expert (FR-177) ; `CPT` ou `RESP` visent les honoraires (FR-182) ; `AUD` lit. Second facteur obligatoire pour `EXPE` (défaut du PRD, FR-180). Les accès d'un cabinet sont tracés comme ceux d'un agent (FR-158). |
| C3 Données possédées | Référentiel des experts et des cabinets (nature interne ou externe, domaines, zones, agrément et sa date de fin, mode d'honoraires, tarif de référence, délai annoncé, capacité, état avec motif, qualification, FR-177), missions et leur machine d'états propre (FR-61), désignations et refus motivés, convocations et examens médicaux (FR-63), rapports et leurs versions (FR-161), compléments demandés, contre-expertises et expertises contradictoires (deux sens distincts), notes d'honoraires, visas, les **cinq montants** de la mission (budget prévisionnel, convenu, facturé, visé, payé, FR-182), budget indicatif (FR-185), charge pondérée et capacité (FR-183), relances de rapport (FR-184), journal des accès des cabinets, registre de l'IA des propositions d'expertise. **Lues seulement** : dossiers, volet, gravité, enjeu (`sinistres`), pièces et rapports déposés (`ged`), provision et estimation de référence (`assurance`), propositions de l'IA commune. |
| C4 Emplacements vides | `sinistres` et `ged` sont des dépendances dures. `paiement` absent : les honoraires visés restent « à payer » ; moyen de paiement `NON_INSTALLE`, chèque enregistré à la main. `notification` absent : désignation et relance en cloche interne et courrier ; le portail se consulte. `reseau` absent : zones d'expert en texte libre. `assurance` absent : estimation de référence `NON_INSTALLE`, le budget indicatif se calcule sur l'enjeu du dossier. `dashboard` absent : charge visible dans la liste des experts seulement. **IA commune absente : orientation d'expertise assistée, complétude du rapport, comparaison au portefeuille = `NON_DISPONIBLE` ; le gestionnaire désigne et contrôle le rapport à la main, une liste de contrôle fixe tient lieu de complétude, rien n'est bloqué** (FR-58, FR-64). Cabinet sans compte : le gestionnaire saisit la désignation, l'acceptation, l'accusé et le rapport reçu (pièce jointe obligatoire, FR-181). Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `expertises.mission.changed@1` (état absolu : domaine, expert, état, échéance du rapport), `expertises.mission.designee@1`, `expertises.mission.refusee@1`, `expertises.rapport.depose@1` (rapport en ligne ou téléversé ou saisi pour le cabinet ; pour `sinistres` et `ged`), `expertises.complement.demande@1`, `expertises.complement.revenu@1`, `expertises.rapport.retard@1`, `expertises.honoraires.notes@1`, `expertises.honoraires.vises@1` (pour `paiement` et l'export comptable), `expertises.agrement.echu@1` (alerte 60 jours avant), `expertises.expert.changed@1`, `expertises.charge.changed@1` (pour `dashboard`), `expertises.ia.proposition.enregistree@1`. Consomme `sinistres.dossier.changed@1`, `sinistres.evaluation.arretee@1`, `sinistres.sortie.decidee@1` (litige : contre-expertise), `ged.piece.controlee@1`, `assurance.provision.changed@1`, `paiement.reglement.execute@1` (honoraires payés), `reseau.noeud.changed@1`, `etat-publie.changed.reel@1` et `.essai@1`. Les noms sont des propositions. |
| C6 Paramètres | Voir l'**annexe D** (D.2 circuit, D.3 modules propres). Les principaux : seuils d'expertise (aucune sous 250 000 FCFA, externe obligatoire au-dessus de 3 000 000, externe impératif en contre-expertise, fraude et contentieux, FR-59) ; **accord sur devis** (dossier ≤ 300 000 FCFA, devis ≤ 200 000 FCFA) ; seuils d'écart rapport-dossier (15 % attention, 35 % bloquant, FR-65) ; domaines des missions ; délais de rapport par domaine en jours (auto-matériel 7, médical 21, responsabilité 14, fraude 30, incendie 21, transport 14, bâtiment 21, perte d'exploitation 30, FR-184) ; relances de rapport (5 jours entre deux, 3 sans effet) ; préavis d'agrément (60 jours) ; poids par domaine, coefficients de type de mission et de gravité (1 ; 1,3 ; 1,6), seuils de surcharge (1,2) et de disponibilité (0,8), FR-183 ; budget indicatif (socles par domaine, 2 % de l'enjeu, plafond 1 200 000 FCFA, coefficients 1 ; 0,5 ; 1,5 ; 1,5, arrondi à 5 000 FCFA, FR-185) ; second facteur du portail ; durée de lecture seule d'une mission terminée pour le cabinet. Les délais **réglementaires** de l'expertise médicale (avis à la victime d'au moins 15 jours avant l'examen, art. 244 ; rapport dans les 20 jours de l'examen, art. 245) sont un référentiel non modifiable (annexe D.5). Données, jamais code. |
| C7 Droits | `expertises:expert:gerer` (`RESP`, `DT`), `expertises:expert:consulter`, `expertises:mission:suggerer`, `expertises:mission:designer` (`GEST`), `expertises:mission:accepter` (`EXPE`, `EXPI`, `MED`), `expertises:rapport:deposer` (`EXPE`, `EXPI`, `MED`), `expertises:rapport:saisir` (`GEST`, pour un cabinet sans compte), `expertises:rapport:valider` (`GEST`), `expertises:complement:demander`, `expertises:contreexpertise:ordonner` (`RESP`), `expertises:honoraires:noter` (`EXPE`), `expertises:honoraires:viser` (`RESP`, `CPT` : **celui qui vise n'émet pas**, FR-182), `expertises:agrement:prolonger` (`RESP`, `DT`), `expertises:parametre:administrer`, `expertises:sante:consulter` (`MED`). Format conforme (l'objet `contreexpertise` est écrit sans tiret pour tenir le format). Une PR `auth-service` par droit. |
| C8 Module d'écran | `src/modules/expertises/` : `/expertises` (missions du gestionnaire et du responsable), `/expertises/experts` (référentiel, agrément, charge, FR-177, FR-183), `/expertises/missions/[id]` (machine d'états, rapport, complétude, compléments, honoraires), `/expertises/honoraires` (notes à viser), `/expertises/panel` (experts internes et médecin-conseil), `/expertises/parametres`. **Portail du cabinet** : `/expertises/portail` (missions à accepter, rapports à déposer, honoraires, suivi), vue de la même application restreinte à `EXPE` (FR-180). Entrées de menu par droit (`expertises:mission:designer`, `expertises:mission:accepter`, `expertises:honoraires:viser`). Boutons non branchés : « bientôt » (FR-22). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : référentiel, missions, rapports, notes d'honoraires et journal des accès restent stockés et masqués ; test aller-retour. Avertissement : « Plus aucune mission d'expertise ne sera désignée ni suivie ; le portail des cabinets est fermé ; les rapports et les honoraires déjà enregistrés restent dans les dossiers. » Les missions ouvertes sont listées avant la désinstallation, avec le cabinet concerné. |
| C10 Démarrer seul | `profiles: ["expertises"]` ; socle + `sinistres` + `ged`. Avec ces seuls modules, un dossier d'essai reçoit une mission : suggérée, désignée, acceptée, rapport rédigé en ligne par un cabinet d'essai, validé par le gestionnaire ; la note d'honoraires est visée par `RESP` (le paiement attend `paiement`). |
| C11 IA | `ia: { modeles: ['orientation-expertise', 'completude-rapport-expert', 'comparaison-portefeuille'], finalites: ['orientation-expertise', 'completude-rapport-expert', 'comparaison-portefeuille'] }` : trois capacités de FR-58 et FR-64 servies par l'IA commune en instance locale. **Orientation** : dossier → besoin d'expertise proposé, marqué « à confirmer », qui **ne crée rien** ; **complétude** : rapport → points manquants (la liste fixe tient lieu sans modèle) ; **comparaison au portefeuille** : dossier ou rapport → écart à des dossiers comparables. Destinataire : `GEST`. Garde-fous : l'IA propose, le gestionnaire décide, désigne et valide ; aucune désignation, aucun rejet de rapport par l'IA ; **jamais de montant proposé sur un préjudice corporel** (FR-71) ; aucun contenu médical ne sort de l'instance (FR-232) ; niveau `RECOMMANDATION` ou `ANALYSE` au registre. Absente, la désignation et le contrôle du rapport sont manuels. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteurs : `portail-cabinet` (éteint tant qu'aucun cabinet n'a de compte : le gestionnaire saisit, FR-181), `orientation-ia`. La forme d'une mission, d'un rapport versionné et d'une note d'honoraires ne change jamais dans la fenêtre de sept jours ; un état de mission ajouté est lu comme inconnu par la version précédente. Un budget déjà calculé n'est jamais recalculé quand les paramètres changent (FR-185). |
| C13 Installable sous contrôle | Prérequis : `sinistres` et `ged` en service ; au moins un expert (panel interne de démonstration en essai seulement : jamais utilisé en réel, FR-219). Vérifications : `agrement-bloque-la-designation` (🟢 si la désignation d'un expert à agrément échu est refusée avec « agrément échu le [date] » ; 🔴 sinon, FR-178) ; `contre-expertise-exclusive` (🟢 si la contre-expertise ne peut revenir ni au cabinet initial ni au panel interne ; 🔴 sinon, FR-66) ; `portail-cloisonne` (🟢 si un compte `EXPE` d'essai ne voit que ses missions, aucun montant d'évaluation ni provision, et aucune recherche générale ; 🔴 sinon, FR-180) ; `honoraires-bornes` (🟢 si viser plus que le facturé est refusé, si viser au-delà du convenu exige un motif et si celui qui vise ne peut émettre le même règlement ; 🔴 sinon, FR-182) ; `rapport-saisi-avec-piece` (🟢 si la saisie d'un rapport pour un cabinet sans compte est refusée sans pièce jointe ; 🔴 sinon, FR-181) ; `complement-bloque-la-validation` (🟢 si un complément demandé et non revenu bloque la validation sauf passage outre motivé de `RESP` ; 🔴 sinon, FR-67). Lecture seule : consultation, journal, export. **`objetsDeReprise: ['expertises.expert@1']`** : le **référentiel des experts et cabinets** (liste fournie par la compagnie, FR-177, FR-219) ; les missions passées d'un dossier repris suivent `sinistres.dossier@1` [À CONFIRMER avec le PRD Reprise]. `domainesEchange: []` (aucun domaine d'échange : l'expert n'est tenu par aucun logiciel externe). |

### A.4 ★ Contrats, provisions et états (`assurance`, M30/M31)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'assurance'`, `version: '1.0.0'`. `depends: []` (le module tient la **projection des contrats lus** et se consulte sans le circuit ; la provision et les états portent sur des dossiers lus de `sinistres`, qui est une entrée de `enrichiPar`, pas une dépendance dure : aucun cycle avec `sinistres`) [à valider par la spine]. `enrichiPar: [sinistres (dossiers : provision d'ouverture, révisions, règlements, recours encaissés), liaison-assureur (polices, garanties, primes, intermédiaires, coassureurs, traités reçus du logiciel de la compagnie), reprise (amorçage de la projection par fichier de polices, FR-186), expertises (estimation de référence et honoraires), paiement (règlements exécutés), dashboard (états et indicateurs), IA commune (calibrage sur l'historique repris, FR-231)]`. Service porteur : `prospera-assurance-service` (D18), qui porte déjà les comptes techniques CIMA [À CONFIRMER par la spine : les deux numéros M30 (contrats lus) et M31 (provisions et états) restent-ils un seul module ?]. Le code `assurance` est celui du manifeste de reprise (`polices` n'existe pas comme code, décision du PO du 2026-11-12). |
| C2 Socle | Gate `ASSURANCE_NOT_ENTITLED`. Cloisonnement par `organisationId`. Lecture des polices et garanties : tous les rôles de `sinistres` pour leur périmètre ; **aucune écriture sur un contrat** pour aucun rôle (FR-186). Provision : le `GEST` propose, le `RESP` valide une révision dont l'écart dépasse 2 000 000 FCFA, `AUD` lit les reports (FR-188). Traités de réassurance : saisis par `DT` ou `DG`, lus par `GEST` et `CPT` (FR-190). Clé de coassurance saisie par `RESP` ou `DT` avec pièce, seulement si le LC ne la fournit pas (FR-191). États (PSAP, CRCA, export comptable) : `DT`, `DG`, `CPT`, `AUD` (FR-189, FR-192, FR-193). `ADMIN` ne lit aucune donnée métier. |
| C3 Données possédées | **Projection datée en lecture seule** des contrats du logiciel de la compagnie (identifiant stable du LC conservé) : assurés, polices (branche, produit, effet, échéance, statut, immatriculation, intermédiaire, capitaux), garanties souscrites (plafond, franchise en taux et en minimum, délai de déclaration, exclusions), produits, état de paiement des primes, intermédiaires, coassureurs et parts, date de dernière lecture de chaque objet (FR-186) ; table de correspondance **type de sinistre vers garanties qui répondent** (FR-187) ; **mouvements de provision** par dossier, jamais écrasés (séquence, date, avant, après, motif, auteur, pièce, FR-188) et grille de provision d'ouverture par volet et gravité ; traités de réassurance versionnés par millésime (quote-part, excédent de sinistre, FR-190) ; clés de coassurance et lignes « à réclamer aux coassureurs » (FR-191) ; états de provisions reconstruits depuis les mouvements (FR-189), données de base des états CRCA versionnées (FR-192), exports comptables numérotés avec leur table de correspondance nature vers compte (FR-193). **Lues seulement** : dossiers, statuts, règlements, recours encaissés (`sinistres`), polices reçues (`liaison-assureur`, `reprise`). **Aucune écriture au grand livre, aucune prime calculée** : le calcul des primes et l'IBNR officiel restent hors de Prospera (FR-189, FR-228). |
| C4 Emplacements vides | Aucune dépendance dure. `liaison-assureur` absent : la projection n'est alimentée que par la reprise ou par un fichier déposé à la main ; chaque donnée porte « source : reprise » et sa date, ou `{etat: NON_INSTALLE, module: liaison-assureur}` ; la clé de coassurance se saisit. `sinistres` absent : polices et traités se consultent, provisions, états et export = `NON_INSTALLE`. `reprise` absent : projection vide au départ, « police inconnue du LC » (FR-186). `expertises` absent : estimation de référence `NON_INSTALLE`. `paiement` absent : règlements lus du seul `sinistres`. `dashboard` absent : états lus dans les écrans du module. **IA commune absente : aucun emplacement d'IA propre à ce module ; le calibrage de l'IA sur l'historique est son affaire et les états se calculent sans elle** (FR-231). Donnée du LC plus vieille que le double de la fraîcheur par défaut : marquée « périmée » (FR-186, FR-201). Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `assurance.police.changed@1` (état absolu de la projection d'une police, avec la date de lecture), `assurance.garantie.changed@1`, `assurance.coassurance.changed@1`, `assurance.traite.changed@1`, `assurance.provision.changed@1` (mouvement : dossier, avant, après, motif ; pour `sinistres`, `expertises`, `liaison-assureur` et `dashboard`), `assurance.provision.a-valider@1` (écart au-dessus du seuil), `assurance.cession.changed@1` (brut, rétention, part du réassureur, net), `assurance.etat-provisions.produit@1`, `assurance.etat-crca.produit@1`, `assurance.export-comptable.produit@1` (pour le dépôt dans l'emplacement partagé, FR-193), `assurance.sans-traite.constate@1`. Consomme `liaison-assureur.assure.recu@1`, `liaison-assureur.police.recue@1`, `liaison-assureur.garantie.recue@1`, `liaison-assureur.prime.recue@1`, `liaison-assureur.intermediaire.recu@1`, `liaison-assureur.coassurance.recue@1`, `liaison-assureur.traite.recu@1`, `liaison-assureur.fraicheur.changed@1`, `sinistres.dossier.changed@1`, `sinistres.provision.revisee@1`, `sinistres.reglement.changed@1`, `sinistres.recours.encaisse@1`, `sinistres.dossier.cloture@1` (provision ramenée à zéro, motif « clôture »), `reprise.feu-vert.changed@1`, `etat-publie.changed.reel@1` et `.essai@1`. Les noms sont des propositions ; `reprise` livre les polices par son point d'import, pas par un fait. |
| C6 Paramètres | Voir l'**annexe D** (D.3, D.5). Les principaux : grille de provision d'ouverture par volet et gravité (milieu de tranche) ; seuil d'écart de révision soumis au responsable (2 000 000 FCFA) ; écart à l'estimation de référence qui fait signaler « à revoir » (15 %) ; jours sans mouvement de provision avant signalement (90) et provision « ancienne » (365) ; motifs de provision ; table type de sinistre vers garanties qui répondent ; fraîcheur de la projection (5 minutes avec une API, à l'heure ou de nuit avec des fichiers, périmée au double) ; âge maximal de lecture pour ouvrir un dossier (24 heures, FR-201) ; traités et millésimes (jeu de démonstration seulement jusqu'à la saisie des traités réels) ; table de correspondance nature de l'opération vers compte (le plan de comptes de la compagnie fait foi) ; seuil du drapeau « grande ampleur non clôturé » (à fixer avec la compagnie) ; colonne IBNR renseignée hors Prospera ; périodicité de l'état mensuel. Données, jamais code. |
| C7 Droits | `assurance:police:consulter`, `assurance:garantie:consulter`, `assurance:correspondance:gerer` (`RESP`, `DT`), `assurance:provision:consulter`, `assurance:provision:reviser` (`GEST`), `assurance:provision:valider` (`RESP`), `assurance:provision:reporter` (`GEST`, motif), `assurance:traite:gerer` (`DT`, `DG`), `assurance:coassurance:saisir` (`RESP`, `DT`), `assurance:etat:consulter` (`DT`, `DG`, `CPT`, `AUD`), `assurance:etat:exporter`, `assurance:export:produire` (`CPT`), `assurance:parametre:administrer`. **Aucun droit d'écriture sur une police, une garantie, une prime, un intermédiaire ou un coassureur n'existe** (FR-186). Format conforme à `^[a-z]+:[a-z-]+:[a-z]+$`. Une PR `auth-service` par droit. |
| C8 Module d'écran | `src/modules/assurance/` : `/assurance/polices` et `/assurance/polices/[id]` (projection avec source et date de lecture, garanties, primes), `/assurance/provisions` (mouvements, dossiers « à revoir », valeur à valider), `/assurance/etats/psap` (par exercice de survenance, brut, cédé, net, date d'arrêté choisie), `/assurance/etats/crca` (données de base, export), `/assurance/reassurance` (traités et millésimes), `/assurance/coassurance`, `/assurance/export-comptable`, `/assurance/correspondances` (garanties par type de sinistre, nature vers compte), `/assurance/parametres`. Entrées de menu par droit (`assurance:police:consulter`, `assurance:etat:consulter`, `assurance:traite:gerer`). Aucun écran de création ou de modification de contrat. Mention « données de base pour l'état réglementaire » sur chaque état (FR-192). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : projection, mouvements de provision, traités, clés de coassurance, états et exports restent stockés et masqués ; test aller-retour ; la séquence des mouvements de provision est conservée (jamais écrasée). Avertissement : « La provision des dossiers ne sera plus tenue ni les états produits ; la projection des contrats ne sera plus mise à jour ; les exports déjà remis restent valides. » Les contrats restent au logiciel de la compagnie, qui n'est jamais touché. |
| C10 Démarrer seul | `profiles: ["assurance"]` ; socle seul. Avec `liaison-assureur` et `assureur-fictif` (espace d'essai), la projection se remplit des polices et garanties des 7 produits de la démo et se consulte avec sa date de lecture ; sans eux, avec un fichier de polices de la reprise ; la grille, les traités et l'état des provisions se paramètrent et se produisent sur un jeu de dossiers d'essai. |
| C11 IA | `ia: { modeles: [], finalites: [] }` : **sans objet, aucun modèle promis par ce module** (aucun des 14 usages du FR-10 ne relève de lui). Il fournit à l'IA commune, sous le consentement de la compagnie, les données qu'elle calibre (provisions, coûts, délais, FR-230, FR-231) ; **l'IA ne pose, ne révise ni ne valide jamais une provision**, et ne propose aucun montant de provision sur un préjudice corporel (FR-71, D13). La capacité « Pourquoi ce montant ? » (FR-74) et la comparaison au portefeuille sont déclarées par `sinistres` et `expertises`. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteurs : `colonne-ibnr` (éteint tant que la compagnie n'a pas fixé qui renseigne l'IBNR, FR-189), `traites-recus-du-lc` (éteint tant que le logiciel de la compagnie ne fournit pas les traités, FR-190). Les colonnes des exports CRCA et comptable sont **versionnées** : une colonne ajoutée ne change aucun export passé (FR-192) ; la forme d'un mouvement de provision et de la projection ne change jamais dans la fenêtre de sept jours. |
| C13 Installable sous contrôle | Prérequis : le transport du LC configuré (API ou fichiers) ou un fichier de polices de la reprise. Vérifications : `projection-en-lecture-seule` (🟢 si aucune route ni aucun écran ne crée, modifie ou supprime une police, une garantie, une prime, un intermédiaire ou un coassureur ; 🔴 sinon, FR-186) ; `provision-jamais-ecrasee` (🟢 si deux révisions successives d'un dossier d'essai laissent deux mouvements, si un montant égal à l'ancien ou sans motif est refusé ; 🔴 sinon, FR-188) ; `psap-au-franc-pres` (🟢 si le total de l'état des provisions d'un jeu de dossiers d'essai égale la somme des provisions au franc près et si un dossier est classé selon l'exercice de sa date de survenance ; 🔴 sinon, FR-189) ; `cession-par-millesime` (🟢 si un sinistre de 2025 est cédé selon le traité 2025 et un sinistre de 2026 selon le traité 2026, et si un dossier sans traité s'affiche « sans traité » au lieu d'une cession à zéro ; 🔴 sinon, FR-190) ; `coassurance-a-cent` (🟢 si une clé dont la somme n'est pas 100 % est refusée ; 🔴 sinon, FR-191) ; `export-equilibre` (🟢 si la somme des débits égale celle des crédits de chaque export et si en demander un second pour la même période ne duplique aucune ligne ; 🔴 sinon, FR-193) ; `peremption-signalee` (🟢 si une donnée plus vieille que le double de sa fraîcheur est marquée « périmée » ; 🔴 sinon, FR-186). Lecture seule : consultation, états, export. **`objetsDeReprise: ['assurance.assure@1', 'assurance.police@1', 'assurance.provision-ouverte@1']`** : les **assurés**, les **polices** avec leurs garanties, produits, intermédiaires et clés de coassurance (reçues par `assurance`, il n'existe pas de module `polices`), et la **provision ouverte** des sinistres repris [À CONFIRMER avec le PRD Reprise : la provision de reprise est-elle un mouvement d'ouverture daté dans `assurance` ?] ; valeurs de contrôle : nombre de polices en vigueur, somme des provisions des sinistres ouverts (FR-218). `domainesEchange: ['assurance.contrats']` (`REFERENTIEL`, `argent: false`, `controle: true` ; propriétaire : **le logiciel de la compagnie**, Prospera en lecture seule), servi par `liaison-assureur` (annexe C, C-1 à C-8) [À CONFIRMER avec le contrat de Connecteurs]. |

### A.5 ★ Échange avec le logiciel de la compagnie (`liaison-assureur`, M48 [proposition])

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'liaison-assureur'`, `version: '1.0.0'` (code et numéro M48 **proposés**, FR-20 ; à valider avec le contrat de module). `depends: []` (le module porte le contrat d'échange générique de l'annexe C et marche sans autre module : file des écarts, liste « à saisir », fraîcheur). `enrichiPar: [sinistres (déclarations, évaluations, règlements, recours encaissés, clôtures envoyés ; numéro officiel reçu), assurance (réception des objets de contrat, envoi des provisions, export comptable), ged (documents de sinistres existants), reprise (sinistres et polices existants), notification (alerte « sans numéro officiel », écarts), dashboard (fraîcheur), reseau (nœuds), connecteurs (le connecteur nommé du vrai LC, hors février), assureur-fictif (essai et démonstration)]`. Service porteur : à cadrer par la spine [À CONFIRMER, D18] ; un service d'échange **commun** avec la microfinance (`coeur-sfd`) est une option que la spine peut retenir, le contrat d'assurance en restant distinct. **Aucun nom de logiciel** dans le manifeste (FR-194). |
| C2 Socle | Gate `LIAISON_ASSUREUR_NOT_ENTITLED`. Cloisonnement par `organisationId`. File des écarts lisible par `RESP`, le `GEST` concerné, `CPT` (écarts de règlement), `AUD` (FR-200) ; configuration du transport par `ADMIN` (sans lire de donnée métier). **Prospera tire et dépose : aucun port entrant n'est ouvert pour l'échange** (FR-197). Aucune écriture sur un contrat du LC, aucun compte technique d'écriture (addendum). Le serveur seul évalue les droits. |
| C3 Données possédées | Journal des échanges (chaque lot, chaque fichier : identifiant de lot, version du contrat, objet, empreinte), **file d'envoi** (déclarations, évaluations et provisions, règlements, recours encaissés, clôtures, rejets, classements sans suite, réouvertures) et leurs états (`à envoyer`, `envoyé`, `accepté`, `refusé`, jamais confirmé après 24 heures, FR-196), **file des écarts** (objet, clé d'origine, nature, date, auteur de la résolution, FR-200), **liste « à saisir dans le logiciel de la compagnie »** (FR-199), état de **fraîcheur** par objet et transport utilisé (FR-201), numéros de sinistre attribués rattachés à leur référence `DEC-` (FR-198), paramètres d'échange (transport, fréquences, délais), table de correspondance des états du LC. **Aucun contrat n'est tenu comme vérité** : les objets reçus sont publiés par fait vers `assurance` et `sinistres`. **Lues seulement** : faits de `sinistres` et d'`assurance` à envoyer. **Aucune donnée de santé n'est envoyée au LC** (défaut du PRD, FR-196). **Idempotence et voie unique** : la référence `DEC-` est la **clé d'idempotence** de la déclaration (champ obligatoire de C-13) ; une déclaration est dans **une seule voie** à la fois, envoi automatique ou liste « à saisir » ; le passage à la liste annule d'abord l'envoi en attente (état `SAISIE_MANUELLE`) ; un numéro reçu pour une `DEC-` déjà numérotée est un **écart**, jamais un second rattachement ; les motifs envoyés au LC sont des **motifs codés** (D.3), jamais un texte libre ; les numéros attribués par Prospera portent un préfixe distinct (`PRO-`). |
| C4 Emplacements vides | Aucune dépendance dure. `sinistres` absent : rien à envoyer, les objets reçus se rangent dans le journal ; état `NON_INSTALLE`. `assurance` absent : les objets de contrat reçus sont conservés au journal et ne sont lus par personne. `ged` absent : documents reçus conservés au journal, non rattachés. `notification` absent : alertes en cloche interne seule. `reprise` absent : pas de sinistre existant livré. `connecteurs` absent : le contrat générique par interface ou par fichier suffit (le connecteur nommé est hors février, FR-245). **LC absent ou injoignable : tous les objets en `{etat: PERIME, depuis}` ; Prospera continue de servir la dernière donnée connue et met les envois en file, qui partent dans l'ordre à la reprise, sans perte** (FR-201). **IA commune absente : sans objet, ce module n'embarque aucun emplacement d'IA ; la détection de doublon probable est une règle** (FR-198). Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `liaison-assureur.assure.recu@1`, `liaison-assureur.police.recue@1`, `liaison-assureur.garantie.recue@1`, `liaison-assureur.prime.recue@1`, `liaison-assureur.intermediaire.recu@1`, `liaison-assureur.coassurance.recue@1`, `liaison-assureur.traite.recu@1` (facultatif), `liaison-assureur.sinistre-existant.recu@1`, `liaison-assureur.document.recu@1`, `liaison-assureur.numero-sinistre.attribue@1` (référence `DEC-` et numéro officiel, avec l'indicateur de doublon), `liaison-assureur.envoi.etat@1` (état absolu d'un envoi : accepté, refusé avec code et motif, jamais confirmé), `liaison-assureur.ecart.ouvert@1`, `liaison-assureur.ecart.resolu@1`, `liaison-assureur.fraicheur.changed@1`, `liaison-assureur.liste-a-saisir.changed@1`, `liaison-assureur.sans-numero.alerte@1` (plus de 1 jour ouvré, horloge suspendue pendant une coupure déclarée, FR-198, FR-201). Consomme `sinistres.declaration.enregistree@1`, `sinistres.evaluation.arretee@1`, `sinistres.reglement.changed@1`, `sinistres.recours.encaisse@1`, `sinistres.dossier.cloture@1`, `sinistres.dossier.rouvert@1`, `sinistres.sortie.decidee@1`, `assurance.provision.changed@1`, `assurance.export-comptable.produit@1`, `reprise.feu-vert.changed@1`, `etat-publie.changed.reel@1` et `.essai@1`. Chaque message sortant du corps du PRD a sa ligne à l'annexe C (C-13 à C-19) ; les noms sont des propositions. |
| C6 Paramètres | Voir l'**annexe D** (D.3). Les principaux : qui attribue le numéro de sinistre (LC ou Prospera, FR-198) et le format de Prospera (`SIN-AAAA-NNNN`), longueur maximale du numéro du LC ; transport (API ou fichiers) et emplacement partagé ; fraîcheur par objet (5 minutes avec une API ; heure ou nuit avant 6 h avec des fichiers) et seuil « périmé » (le double) ; délai avant « jamais confirmé » (24 heures) ; alerte « sans numéro officiel » (1 jour ouvré) ; ancienneté d'une ligne de la liste « à saisir » (1 jour ouvré pour une déclaration, 72 heures pour une autre nature) ; âge maximal de lecture pour ouvrir un dossier (24 heures) ; fuseau de la compagnie ; version du contrat acceptée. Données, jamais code. |
| C7 Droits | `liaison-assureur:echange:consulter`, `liaison-assureur:echange:configurer` (`ADMIN`), `liaison-assureur:ecart:consulter`, `liaison-assureur:ecart:resoudre` (`RESP`, `GEST` concerné, `CPT` pour les règlements), `liaison-assureur:liste-a-saisir:exporter`, `liaison-assureur:numero:reporter` (l'agent qui saisit dans le LC). Format conforme à `^[a-z]+:[a-z-]+:[a-z]+$` **seulement après l'élargissement du format de droits d'`auth-service`** (le code `liaison-assureur` a un tiret, amendement C7 du 2026-11-11) : tant qu'il n'est pas fait, ces droits sont déclarés et **non attribuables**. |
| C8 Module d'écran | `src/modules/liaison-assureur/` : `/echange` (état par objet, fraîcheur, transport, bandeau « LC indisponible depuis [heure] »), `/echange/ecarts` (file des écarts, FR-200), `/echange/a-saisir` (liste « à saisir dans le logiciel de la compagnie » et report du numéro obtenu, FR-199), `/echange/envois` (états des envois, refus motivés), `/echange/parametres`. Entrées : « Échange avec le LC » (`liaison-assureur:echange:consulter`), « Écarts » (`liaison-assureur:ecart:consulter`). Les écrans des autres modules affichent la date de dernière lecture sans passer par celui-ci (FR-201). Boutons non branchés : « bientôt » (FR-22) ; aucun bouton ne promet une intégration à un produit nommé (FR-245). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : journal, files d'envoi, écarts et liste « à saisir » restent stockés et masqués ; test aller-retour. Avertissement : « Plus aucune déclaration, évaluation, provision, règlement ni clôture ne partira vers le logiciel de la compagnie ; plus aucun numéro de sinistre officiel ni aucun contrat ne sera reçu ; ce qui est en file reste en file. » Le logiciel de la compagnie n'est jamais modifié par l'installation ni la désinstallation. |
| C10 Démarrer seul | `profiles: ["liaison-assureur"]` ; socle seul. Avec `assureur-fictif` (espace d'essai seulement), le module reçoit les objets de l'annexe C, envoie une déclaration d'essai et en reçoit le numéro officiel, en API et en fichiers. |
| C11 IA | `ia: { modeles: [], finalites: [] }` : **sans objet, aucun modèle promis** (le contrôle de doublon de FR-198 porte sur la police, la date de survenance, l'immatriculation et la victime ; c'est une règle, signalée au gestionnaire qui décide, Prospera ne fusionne jamais seul). Aucune donnée ne passe par l'IA commune depuis ce module ; l'IA ne corrige jamais un écart ni un montant. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. **Version du contrat d'échange portée par chaque objet et chaque fichier** : une version inconnue est refusée en entier avec le code `VERSION_CONTRAT_INCONNUE` et va dans la file des écarts (annexe C). Interrupteurs : `echange-par-fichiers` (le transport seulement, jamais la forme des données), `numero-attribue-par-prospera` (bascule du paramètre sans reprise de code, FR-198). La forme du journal et des files ne change jamais dans la fenêtre de sept jours. |
| C13 Installable sous contrôle | Prérequis : un transport configuré (API ou emplacement partagé du réseau de la compagnie). Vérifications : `lc-joignable` (🟢 si la dernière lecture valide date de moins de deux fois la fraîcheur par défaut ; 🟠 si périmée ; 🔴 si jamais, FR-201) ; `aucun-port-entrant` (🟢 si aucun port n'est ouvert pour l'échange ; 🔴 sinon, FR-197) ; `envoi-idempotent` (🟢 si rejouer un lot déjà intégré ne change aucun dossier, aucune provision, aucun règlement affiché ; 🔴 sinon, FR-200) ; `reference-sans-trou` (🟢 si la référence `DEC-` est attribuée sans trou ni doublon, même avec le LC coupé ; 🔴 sinon, FR-198) ; `aucune-donnee-de-sante-vers-le-lc` (🟢 si un lot sortant d'un dossier corporel d'essai ne contient que références, montants, garanties, états et motifs ; 🔴 sinon, FR-196) ; `lc-fictif-absent-du-reel` (🔴 si le LC fictif est présent ou activable dans un espace réel, FR-205) ; `annexe-c-complete` (🟢 si un test parcourt l'annexe C et le corps du PRD et ne trouve aucun message sortant sans ligne ; 🔴 sinon, FR-196). Lecture seule : `GET` sur la file, l'état et la liste « à saisir », export. **`objetsDeReprise: []`** (le module ne possède aucun objet métier à reprendre ; les sinistres et les polices existants du LC passent par `sinistres` et `assurance`, FR-195). `domainesEchange: ['sinistres.dossiers', 'assurance.contrats', 'ged.documents-sinistres']` (point d'échange unique de chacun ; ce module porte le **contrat générique** de l'annexe C ; les valeurs de contrôle sont déclarées dès le manifeste pour que le passage au connecteur nommé n'oblige pas à reprendre du code, FR-245) [À CONFIRMER avec le contrat de Connecteurs]. |

### A.6 `assureur-fictif` (démonstration et essai seulement, jamais en production)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'assureur-fictif'`, `version: '1.0.0'`. `depends: []` (il n'a besoin que du socle pour servir l'API et les fichiers du contrat d'échange). `enrichiPar: [liaison-assureur (sa seule contrepartie : il parle le contrat de l'annexe C dans les deux sens), sinistres (parcours de démonstration), assurance (polices et garanties des 7 produits), ged (documents de sinistres existants), reprise (répétition de la reprise dans l'espace d'essai, FR-218)]`. Service porteur : à cadrer [À CONFIRMER, D18], comme le cœur fictif de la microfinance (`coeur-sfd`, FR-166). **Jamais installé dans un espace réel** : l'installation réelle ne le contient pas et **refuse de l'activer** (FR-205). Il n'est pas un produit : c'est un outil de démonstration et de recette. |
| C2 Socle | Gate `ASSUREUR_FICTIF_NOT_ENTITLED`, accordée **aux espaces d'essai seulement** ; le moteur d'installation refuse de l'activer dans un espace réel, quelle que soit la licence. Cloisonnement par `organisationId` : aucun identifiant du LC fictif n'est accepté par un espace réel, aucune donnée d'essai ne passe dans un espace réel (FR-205). Réglages de panne réservés au compte d'essai de démonstration ; aucun rôle métier de la compagnie n'y accède. |
| C3 Données possédées | Jeu **fictif de bout en bout** (noms, immatriculations, téléphones : aucune donnée d'une personne réelle, FR-202) : assurés, polices et garanties des **7 produits de la démo** (environ 25 000 contrats d'après la démo (défaut du PRD)), tous statuts de police (en vigueur, suspendue, résiliée, expirée), primes impayées, polices en coassurance, intermédiaires, coassureurs et clés, sinistres existants et leurs documents, **numéros de sinistre attribués** (format propre au LC fictif, différent de celui de Prospera, FR-203), journal des envois reçus, **réglages d'essai** (coupure, refus motivé, doublon, écart, retard, mode « ne reçoit pas », changement d'une police après l'ouverture d'un dossier, FR-204). **Lues seulement** : rien (il ne lit aucune donnée réelle). |
| C4 Emplacements vides | Aucune dépendance. `liaison-assureur` absent : le LC fictif tourne et sert son API et ses fichiers, mais personne ne les lit. `sinistres` et `assurance` absents : le jeu se charge et se consulte seul. `reprise` absent : pas de répétition de reprise. **IA commune absente : sans objet, aucun emplacement d'IA.** Chaque écran branché sur lui affiche « données fictives » (FR-205). Un test par entrée de `enrichiPar`. |
| C5 Contrats nommés | Publie `assureur-fictif.jeu.charge@1`, `assureur-fictif.jeu.remis-a-zero@1`, `assureur-fictif.reglage.changed@1` (coupure, refus, retard, mode « ne reçoit pas »). Il parle le contrat de l'annexe C par son **transport** (API et fichiers), pas par des faits : les objets C-1 à C-12 sortent par l'API et les fichiers, les messages C-13 à C-19 y entrent. Consomme `etat-publie.changed.essai@1` (il n'écoute jamais `.reel`). Les noms sont des propositions. |
| C6 Paramètres | Voir l'**annexe D** (D.4). Les principaux : délai simulé d'attribution du numéro, format du numéro du LC fictif, taille du jeu (environ 3 500 dossiers du portefeuille de démonstration, polices pour les couvrir), part de polices suspendues, impayées ou en coassurance, réglages de panne (par défaut aucun). Données, jamais code ; aucune de ces valeurs n'entre dans un espace réel. |
| C7 Droits | `assureur-fictif:jeu:consulter`, `assureur-fictif:jeu:reinitialiser`, `assureur-fictif:reglage:modifier`. Format conforme **seulement après l'élargissement du format de droits d'`auth-service`** (le code `assureur-fictif` a un tiret) : tant qu'il n'est pas fait, ces droits sont déclarés et non attribuables ; le compte d'essai de démonstration les porte. |
| C8 Module d'écran | `src/modules/assureur-fictif/` : `/assureur-fictif` (état du logiciel fictif, bandeau « données fictives »), `/assureur-fictif/reglages` (coupure, refus, doublon, écart, retard, mode « ne reçoit pas », changement de police), `/assureur-fictif/jeu` (consultation du jeu et remise à zéro). Entrée de menu visible dans l'espace d'essai seulement. Boutons non branchés : « bientôt » (FR-22). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien dans un espace d'essai : le jeu et les réglages restent stockés et masqués ; test aller-retour. La **remise à zéro** (action explicite, pas une désinstallation) recharge le jeu de démonstration et vide les dossiers créés pendant la démonstration (FR-205). Avertissement : « Le logiciel de compagnie fictif disparaît de l'espace d'essai : aucune police, aucune garantie ni aucun numéro de sinistre fictif ne sera servi ; aucune donnée réelle n'est concernée. » |
| C10 Démarrer seul | `profiles: ["assureur-fictif"]` ; socle seul, espace d'essai. Il charge son jeu (14 gestionnaires de la compagnie fictive, environ 3 500 dossiers côté `sinistres` quand il est installé, polices et garanties des 7 produits), sert l'API et les fichiers du contrat, attribue un numéro à une déclaration reçue, et sait tomber en panne et refuser (FR-203, FR-204). |
| C11 IA | `ia: { modeles: [], finalites: [] }` : **sans objet, aucun modèle promis**. Le jeu de démonstration n'entraîne aucun modèle ; ses données fictives ne sortent jamais de l'espace d'essai, ni vers l'IA commune ni ailleurs. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive, sur un espace d'essai. Le jeu se recharge depuis sa source de démonstration : il n'est pas migré. Une version du contrat d'échange plus récente que celle du LC fictif est refusée par lui comme par un vrai LC (`VERSION_CONTRAT_INCONNUE`). |
| C13 Installable sous contrôle | Prérequis : un **espace d'essai** (jamais un espace réel). Vérifications : `assureur-fictif-absent-du-reel` (🔴 si le LC fictif est présent ou activable dans un espace réel ; 🟢 sinon ; **le bilan d'installation d'un espace réel échoue au rouge**, FR-205) ; `objets-de-l-annexe-c` (🟢 si chaque objet « LC → Prospera » de l'annexe C est produit avec ses champs minimaux et si chaque objet « Prospera → LC » est accepté, refusé avec un code ou reconnu comme doublon ; 🔴 sinon, FR-202) ; `numero-sans-trou` (🟢 si les numéros attribués sont sans trou ni doublon et si le même `DEC-` présenté deux fois reçoit le même numéro ; 🔴 sinon, FR-203) ; `jeu-sans-personne-reelle` (🟢 si aucune donnée du jeu ne provient d'une personne réelle ; 🔴 sinon, FR-202) ; `remise-a-zero` (🟢 si la remise à zéro recharge 14 gestionnaires, environ 3 500 dossiers, polices et garanties des 7 produits et experts, et rejoue les quatre scénarios `SIN-2026-9001` à `9004` ; 🔴 sinon, FR-205). Lecture seule : consultation du jeu. **`objetsDeReprise: []`** (aucune donnée fictive n'est reprise dans un espace réel). `domainesEchange: []` (il tient la place du propriétaire des domaines de `liaison-assureur` en essai, il n'en déclare aucun lui-même). Essai : aucune action n'envoie de message réel, les sorties sont interceptées et comptées. |

### A.7 Reprise de données (`reprise`, M44) : écarts pour l'assurance seulement

Le manifeste `manifestes/reprise.manifest.ts` et le PRD Reprise de données portent les treize clauses. Ce tableau **ne les répète pas** ; il donne, clause par clause, **ce que l'assurance change ou ajoute**. Une cellule « inchangé » renvoie au manifeste.

| Clause | Écart pour l'assurance |
|---|---|
| C1 Manifeste | `code: 'reprise'`, `version: '1.0.0'`, `depends: []` : inchangé. `enrichiPar` du manifeste contient déjà `assurance` et `sinistres` (« les polices sont reçues par `assurance` : pas de code `polices` », décision du PO du 2026-11-12). **À ajouter : `ged` et `expertises`**, qui déclarent des objets de reprise (FR-215, FR-177), et à noter que `liaison-assureur` n'en fait pas partie (il ne possède aucun objet métier). Cibles de l'assurance : `sinistres`, `ged`, `assurance`, `expertises`. [À porter au manifeste de `reprise` : action du §12.] |
| C2 Socle | Gate `REPRISE_NOT_ENTITLED` : inchangé. Le **feu vert est donné par module cible** : `sinistres`, `ged`, `assurance` (FR-218), rattaché aux lots rejoués dans l'**espace réel**, jamais à un lot d'essai. La validation du lot avant import est faite par le **DG** ou la personne qu'il désigne par écrit (`reprise:lot:valider`, FR-216). `ADMIN` voit le rapport de reprise (comptes, états, motifs de rejet) et **jamais le contenu d'un dossier** (FR-238). |
| C3 Données possédées | Inchangé : lots, rapports, règles de traduction, tables de correspondance, doublons, feu vert. **Pour l'assurance**, les tables de correspondance traduisent les états du LC vers les 11 statuts du circuit (un « ouvert » sans pièces devient `PIECES_ATTENDUES`, FR-214), les types de sinistre, les codes d'agent, les garanties et les types de pièces ; une valeur sans équivalent est un **écart**, jamais une invention. La reprise **n'écrit jamais dans un module** : elle livre par son point d'import (FR-214). |
| C4 Emplacements vides | Inchangé : une cible absente donne des lignes « non installé » au rapport. **Source de reprise inconnue au premier jour** : le PRD ne spécule pas sur le LC (D2) ; les **fichiers** (Excel, JSON ; CSV accepté) marchent sans condition, l'**API** du LC a son adaptateur écrit dès que le LC est connu (janvier) (FR-214) ; si le LC n'expose pas d'API, les fichiers suffisent et rien ne bloque. |
| C5 Contrats nommés | Publie `reprise.feu-vert.changed@1` (état absolu par module cible : `sinistres`, `ged`, `assurance`), `reprise.historique.livre@1`, `reprise.cles-rattachement.publiees@1`. **Charge de `reprise.cles-rattachement.publiees@1` décidée** : numéro de police, numéro de sinistre, référence de déclaration, numéro d'archivage d'origine, qui `ged` consomme (FR-215). Consomme : inchangé. **Resynchronisation nocturne** (FR-217) : le manifeste la reçoit de `connecteurs.nuit.terminee@1` et `.absente@1`, or `connecteurs` est hors février pour l'assurance (FR-245) ; l'échange nocturne passe ici par `liaison-assureur` (`liaison-assureur.sinistre-existant.recu@1`) [À CONFIRMER : amendement du manifeste ou fait équivalent]. |
| C6 Paramètres | Heure de la resynchronisation nocturne (avant 6 h, FR-217) ; durée de conservation des fichiers déposés (30 jours après l'import réussi, FR-214) ; seuil d'historique repris qui déclenche l'avertissement « l'IA démarrera avec moins de recul » (3 ans, **aucune borne haute**, FR-215) ; valeurs de contrôle de départ (nombre de sinistres ouverts, somme des provisions des sinistres ouverts, nombre de polices en vigueur, nombre de pièces rattachées, FR-218) ; date de fin du parallèle (fixée à la mise en service). Annexe D.3. |
| C7 Droits | Inchangé : `reprise:lot:importer`, `reprise:lot:valider`, `reprise:doublon:fusionner`, `reprise:rapport:consulter`, `reprise:regle:modifier`, `reprise:comptage:saisir` ; `reprise:lot:valider` n'est attribué que par le DG ; l'export reste réservé à `instance:donnees:exporter`. **Doublons d'assurance** : même police et même date de survenance, même téléphone, même nom et date de naissance (FR-216) ; la fusion reste sous contrôle humain. |
| C8 Module d'écran | Inchangé (`src/modules/reprise/`). **À ajouter** : une ligne par module cible de l'assurance au rapport (`sinistres`, `ged`, `assurance` : repris, manquants, écarts par type, requalifications, montants « à saisir », FR-216) ; le **bilan de préparation** des éléments que la compagnie doit fournir (manuel de procédures, délégations, liste des experts agréés, barèmes, modèles, volumes, export des assurés, polices et sinistres, règle de numérotation, FR-219) [À CONFIRMER : écran de `reprise` ou du moteur d'installation]. |
| C9 Installer/désinstaller | Inchangé : désinstaller ne supprime ni rapport ni lot. Les dossiers déjà repris restent dans `sinistres`, `ged` et `assurance` avec leur marqueur « historique » (non modifiable depuis l'application, FR-215) ; la désinstallation arrête la resynchronisation nocturne, et les dossiers « suivis » depuis la source ne sont plus mis à jour (FR-217). |
| C10 Démarrer seul | Inchangé : sans aucune cible, rapport seul. Pour l'assurance, avec `assureur-fictif` dans l'espace d'essai, la répétition générale joue un lot complet (polices avant sinistres, sinistres avant pièces, FR-214, FR-218) sans autre module de la compagnie. |
| C11 IA | Inchangé : `reprise` ne déclare aucun modèle. **Ce que l'assurance ajoute** : l'historique repris (3 à 5 ans) est la matière de **calibrage de l'IA commune** (FR-231) ; il n'est lu par l'IA qu'avec le consentement de la compagnie, et **aucune donnée de santé** n'entre dans le calibrage (FR-232). L'IA est absente pendant la reprise sans conséquence : le rapport se produit sans elle. |
| C12 Migrations | Inchangé : `retourArriere: 'SANS_PERTE'`. La version du format de traduction d'un lot est portée par le lot ; un lot est rejouable sans doublon (clé d'origine et empreinte de ligne, FR-217). |
| C13 Installable sous contrôle | Vérifications inchangées ; **à ajouter pour l'assurance** : `ordre-polices-avant-sinistres` (🟢 si, sur le jeu de contrôle, les polices sont livrées avant les sinistres et les sinistres avant les pièces ; 🔴 sinon, FR-214) ; `montant-absent-jamais-zero` (🟢 si un sinistre dont le montant validé manque est marqué « montant à saisir » au lieu de zéro ; 🔴 sinon, FR-214) ; `numero-archivage-conserve` (🟢 si un numéro d'archivage repris garde son format d'origine, si un doublon est refusé avec motif et si les séquences de la GED sautent les numéros repris ; 🔴 sinon, FR-215) ; `rejeu-sans-doublon` (🟢 si la même resynchronisation rejouée ne crée ni doublon ni changement ; 🔴 sinon, FR-217). **`objetsDeReprise` des cibles de l'assurance** : `sinistres.dossier@1` (A.1), `ged.piece@1` et `ged.archive@1` (A.2), `assurance.assure@1`, `assurance.police@1` et `assurance.provision-ouverte@1` (A.4), `expertises.expert@1` (A.3) ; valeurs de contrôle de départ : nombre de sinistres ouverts, somme de leurs provisions, nombre de polices en vigueur, nombre de pièces rattachées ; **écart nul sur les données vivantes**, l'historique entre protégé et ses écarts figurent au rapport sans bloquer (FR-214, FR-218). **Écarts à porter au PRD Reprise** : (1) le PRD ne requiert que les fichiers en février alors que le PO retient « API ou fichier » au premier jour (FR-214) ; (2) le **papier** reste tenu et sa cote est reprise sans numérisation du stock (FR-172, FR-215) ; (3) la bascule « suivi puis tenu par Prospera » à la première action d'un agent, par dossier (FR-217) (défaut du PRD). |

### A.8 Modules cadrés : renvoi aux manifestes

Les modules suivants ont déjà leurs treize clauses dans leur manifeste ou dans le PRD distributeur. Ce PRD **ne les répète pas** ; il renvoie, et reporte l'écart de l'assurance. **C11** : `paiement`, `notification`, `reseau` et `connecteurs` ne portent aucun modèle d'IA pour l'assurance ; `dashboard` porte l'**affichage** de capacités déclarées par `sinistres` (FR-208, FR-209), le moteur restant l'IA commune.

| Module | Manifeste ou annexe | Ce que l'assurance exige en plus | Point à reporter |
|---|---|---|---|
| `paiement` (M33) | `manifestes/paiement.manifest.ts` | **`sinistres` ordonne, `paiement` exécute** (virement, PI-SPI, Mobile Money T-Money et Flooz) ou **enregistre** (chèque : banque, numéro, montant saisis par `CPT`) ; plusieurs règlements par dossier, chacun avec son état (`A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`) ; un règlement d'issue inconnue (`INCONNU`) est rapproché du relevé avant toute réémission, avec sa clé d'idempotence gardée à chaque tentative ; **aucun adaptateur Mobile Money sortant** : « bientôt » en février, **à chiffrer au plan** ; rapprochement des chèques, virements et paiements mobiles par `CPT`, alerte à 60 jours ; honoraires d'expert réglés comme un règlement ; plafond d'espèces 500 000 FCFA ; changement de coordonnées bancaires dans les 5 jours = alerte et blocage ; confirmations de virement tirées par le relais (FR-239). Faits proposés `paiement.reglement.execute@1`, `.echoue@1`, `.inconnu@1`, `.rapproche@1` (le manifeste actuel ne publie que des faits d'encaissement) | FR-220 à FR-225 ; écarts **à porter au PRD `paiement`** (paiement sortant, chèque, Mobile Money sortant) |
| `notification` (M34) | `manifestes/notification.manifest.ts` | SMS, WhatsApp, e-mail, cloche et courrier avec preuve ; **modèles WhatsApp de la compagnie** (accusé de déclaration, pièces manquantes, offre envoyée, chèque à retirer, règlement effectué) approuvés avant la mise en service ; numéro WhatsApp Business et passerelle SMS **à la charge de la compagnie** ; relances de pièces espacées de 5 jours, arbitrage après trois sans effet ; **aucune donnée de santé dans un message** (« un document médical » sans plus) ; aucun message à l'assuré ne contient « fraude » ni un montant d'indemnité ; réponses entrantes par le relais | FR-18, FR-146, FR-226, FR-227 ; matrice « qui est prévenu de quoi » à l'annexe B |
| `dashboard` (M28) | `manifestes/dashboard.manifest.ts` | Un **cockpit par rôle**, spécifié au §6.7 : dossiers par statut, bloqués et pourquoi, sans action depuis 30 jours, charge, pièces attendues, règlements en attente et valideur attendu, délais qui expirent (légaux et internes séparés), indicateurs **recalculés depuis les données**, jamais constants ; **aucune prime ni ratio sinistres sur primes** (les primes relèvent du LC) ; sans `dashboard`, l'emplacement du cockpit est vide et les files de `sinistres` restent | FR-206 à FR-213, FR-228 |
| `reseau` (M01) | `manifestes/reseau.manifest.ts` | Un **site central** et des **guichets** ; le **volet** (corporel, matériel, risques divers) et le pôle recours sont des **portées tenues par `sinistres`** et lues par `reseau` (`sinistres.portee.volet.changed@1`) ; intermédiaires et coassureurs **non tenus** par `reseau` (objets du LC) ; transfert d'un agent d'un guichet à un autre daté et tracé ; une portée vide est vide, jamais « tout » | FR-244 ; amendement à porter au PRD `reseau` (portée par volet, action du §12) ; objets de reprise `reseau.zone@1` et `reseau.commercial@1` inchangés |
| `connecteurs` (M43) | `manifestes/connecteurs.manifest.ts` | Le **connecteur nommé** du logiciel de la compagnie est **hors février** (le logiciel est libre en janvier) ; le **contrat d'échange générique** (annexe C) est du **premier jour**, porté par `liaison-assureur` ; objet en **lecture seule** quand le LC en est propriétaire (assurés, polices, garanties, primes, intermédiaires, coassureurs, numéro de sinistre) ; la section « Intégrations » n'apparaît que si `connecteurs` est installé ; valeurs de contrôle des domaines d'échange déclarées dès le manifeste | FR-245 ; domaines `sinistres.dossiers`, `assurance.contrats`, `ged.documents-sinistres` [À CONFIRMER] |
| IA commune | `prd-assistant-ia-2026-08-02`, note de vision `vision-ia-sectorielle-2026-11-10`, PRD moteur FR-24 à FR-31 | **Instance locale chez la compagnie** : prédit sur ses seules données, enregistre l'écart, anonymise, renvoie par tunnel sécurisé sortant sous consentement par finalité ; **aucune donnée nominative ni de santé ne sort** ; calibrée sur 3 à 5 ans d'historique repris ; réentraînement mensuel et rapport mensuel de performance (acceptées, modifiées, rejetées par usage) ; mises à jour signées, essayées dans l'espace d'essai, retirables ; tunnel distinct du tunnel de support | FR-10, FR-12, FR-230 à FR-233 ; finalités et modèles déclarés module par module à la clause C11 |
| `instance` (moteur d'installation) | PRD moteur d'installation | **Serveur applicatif et NAS distincts chez la compagnie**, sans nuage étranger ; mises à jour essayées, promues à la date choisie, retour arrière en un clic, fichier signé hors ligne ; sauvegarde quotidienne, restauration testée ; guichets par navigateur sur le réseau de la compagnie ; exploitation par la DSI de la compagnie (`ADMIN` ne lit pas le métier) ; **relais Money Vibes** pour les réponses WhatsApp et les notifications PI-SPI, sans port entrant ; support à distance ouvert par la compagnie seule ; une anomalie bloquante prise en charge en 4 heures ouvrées | FR-234 à FR-241, FR-246 ; régime de licence et contrat de maintenance : contrat commercial, hors de ce PRD (FR-235) |

### A.9 Ordre de construction recommandé (sans valeur de périmètre)

Cette table ajoute à chaque fiche A.1 à A.8 une colonne **« Ordre de construction recommandé »** : **1** = le chemin de la démo (déclarer, ouvrir, instruire, chiffrer, décider, offrir, accord, payer, clore, archiver) ; **2** = recours, fraude, états techniques ; **3** = IA avancée. **Cet ordre n'a aucune valeur de périmètre** : le périmètre du premier jour reste complet (tout le circuit au premier jour, §10 ordre de construction recommandé), et aucune fonction ne passe en « bientôt » à cause de cet ordre. Il aide à planifier ; il ne retire rien.

| Fiche | Ordre de construction recommandé : 1 (chemin de la démo) | 2 (recours, fraude, états techniques) | 3 (IA avancée) |
|---|---|---|---|
| A.1 `sinistres` | déclarer, ouvrir, instruire, chiffrer, décider, offrir, accord, payer, clore (FR-30 à FR-107, FR-134 à FR-149) | recours (FR-108 à FR-120), fraude (FR-125 à FR-133) | usages d'IA du circuit, résumé, recherche en langage naturel, brief (FR-154, FR-155, FR-208, FR-209) |
| A.2 `ged` | recevoir, contrôler, archiver, verser (FR-159, FR-161 à FR-168) | scellement, reconstitution, destruction (FR-169, FR-173 à FR-175) | lecture et classement par l'IA (FR-164) |
| A.3 `expertises` | référentiel, désignation, rapport, honoraires (FR-177, FR-178, FR-181, FR-182) | portail du cabinet, charge et délais (FR-180, FR-183 à FR-185a) | orientation assistée, complétude du rapport (FR-58, FR-64) |
| A.4 `assurance` | projection des contrats, garanties, provision (FR-186 à FR-188) | PSAP, réassurance, coassurance, états, export (FR-189 à FR-193) | — |
| A.5 `liaison-assureur` | numéro de sinistre, envois, liste « à saisir » (FR-194 à FR-199) | file des écarts, fraîcheur et coupure (FR-200, FR-201) | connecteur du LC nommé (hors février) |
| A.6 `assureur-fictif` | contrats et numéros de sinistre (FR-202, FR-203) | pannes et refus simulés (FR-204, FR-205) | — |
| A.7 `reprise` | fichiers, dossiers en cours (FR-214, FR-215) | rapport, resynchronisation, feu vert (FR-216 à FR-218) | adaptateur API (si le LC en expose une) |
| A.8 modules cadrés | ordre de leurs manifestes | — | — |

## Annexe B. Matrice d'accès

Lecture : **D** décide ou valide ; **É** écrit (crée, saisit, modifie, exécute) ; **L** lit son périmètre ; **—** aucun accès. Les quatorze rôles et leur périmètre sont ceux du §2.1 (FR-6). **Le serveur applique la matrice** à chaque demande, indépendamment de l'écran (FR-137) ; la séparation des tâches (FR-7) s'ajoute à elle, et se mesure sur la **personne**, pas sur le rôle. Un utilisateur qui porte deux rôles agit sous l'un ou l'autre, nommé à chaque demande. **ADMIN ne lit aucune donnée métier** par l'application : il gère les comptes et les paramètres. Un rôle qui instruit, décide ou autorise de l'argent (GEST, GREC, MED, RESP, DT, DG, CPT) n'est actif qu'après la validation d'un rôle métier (FR-6). Le **comité sinistres** est une instance, pas un rôle ; ses membres votent sous leur rôle (FR-8, FR-79).

Rôles : DG direction générale ; DT directeur technique ; RESP responsable du service sinistres ; GEST gestionnaire sinistres (un volet : corporel, matériel ou risques divers) ; GREC gestionnaire recours ; MED médecin-conseil ; EXPI expert interne ; EXPE cabinet d'expertise externe (portail, ses seules missions) ; ACC chargé d'accueil-guichet ; NUM opérateur de numérisation ; ARCH archiviste ; CPT comptable règlements ; AUD contrôle interne ; ADMIN administrateur.

| Action | DG | DT | RESP | GEST | GREC | MED | EXPI | EXPE | ACC | NUM | ARCH | CPT | AUD | ADMIN | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Circuit : de la déclaration à l'offre** | | | | | | | | | | | | | | | |
| Rechercher et lire un dossier (hors donnée de santé) | L | L | L | L | L | L | L | L | L | L | L | L | L | — | 1 |
| Déclarer un sinistre | — | — | É | É | É | — | — | — | É | — | — | — | — | — | 2 |
| Ouvrir : recevabilité, attente de pièces, reprise du circuit | — | — | É | É | É | — | — | — | É | — | — | — | — | — | 3 |
| Affecter ou réaffecter un dossier | — | — | D | É | É | — | — | — | — | — | — | — | — | — | 4 |
| Instruire : prendre en charge, pièces, responsabilité | — | — | É | É | É | — | — | — | — | — | — | — | — | — | 5 |
| Décider de la garantie | D | D | D | D | — | — | — | — | — | — | — | — | L | — | 6 |
| Missions d'expertise : orienter, désigner, suivre | — | — | É | É | — | L | L | L | — | — | — | — | L | — | 7 |
| Mission : accepter, déposer ou saisir le rapport | — | — | — | É | — | É | É | É | — | — | — | — | — | — | 8 |
| Ordonner une contre-expertise | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 9 |
| Passer outre un complément d'expert non revenu | — | — | D | — | — | — | — | — | — | — | — | — | L | — | 10 |
| Évaluer : arrêter le montant (décompte, barème) | — | — | É | É | É | L | — | — | — | — | — | — | L | — | 11 |
| Réviser la provision du dossier | L | L | D | É | — | — | — | — | — | — | — | — | L | — | 12 |
| **Circuit : décider et offrir** | | | | | | | | | | | | | | | |
| Contrôler la proposition (niveau 1, sous 1 000 000 FCFA) | — | — | D | É | — | — | — | — | — | — | — | — | L | — | 42 |
| Valider selon la délégation | D | D | D | — | — | — | — | — | — | — | — | — | L | — | 13 |
| Siéger et voter au comité sinistres (instance) | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 14 |
| Envoyer l'offre | — | — | É | É | — | — | — | — | — | — | — | — | — | — | 15 |
| Enregistrer l'accord de l'assuré ou de la victime (sur la pièce originale signée) | — | — | É | É | — | — | — | — | É | — | — | — | — | — | 16 |
| **Circuit : payer, clore, rouvrir** | | | | | | | | | | | | | | | |
| Émettre le règlement (chèque, virement, PI-SPI, Mobile Money) | L | L | L | L | L | — | — | — | — | — | — | É | L | — | 17 |
| Remettre le chèque contre quittance signée | — | — | — | — | — | — | — | — | É | — | — | É | — | — | 18 |
| Signer la quittance (la marquer `SIGNEE`) : agent distinct de l'émetteur | — | — | — | — | — | — | — | — | É | — | — | É | — | — | 43 |
| Valider l'ordre de règlement : second `CPT`, distinct de celui qui prépare (`DG` au-dessus du seuil) | D | — | — | — | — | — | — | — | — | — | — | D | L | — | 44 |
| Viser la note d'honoraires d'un expert | — | — | D | — | — | — | — | É | — | — | — | — | — | — | 19 |
| Clore un dossier réglé | — | — | É | É | É | — | — | — | — | — | — | — | — | — | 20 |
| Rouvrir un dossier clos, rejeté ou classé sans suite | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 21 |
| **Sorties, recours, fraude** | | | | | | | | | | | | | | | |
| Refuser la prise en charge (`REJETE`) | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 22 |
| Classer sans suite | D | D | É | É | — | — | — | — | — | — | — | — | — | — | 23 |
| Constater un litige, le résoudre | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 24 |
| Recours : qualifier, établir la créance, mettre en demeure, négocier | L | L | D | É | É | — | — | — | — | — | — | — | L | — | 25 |
| Fraude : signaler une suspicion | É | É | É | É | É | — | — | — | — | — | — | — | É | — | 26 |
| Fraude : écarter un blocage ou une suspicion (avis d'AUD, relecteur non partie) | D | D | D | — | — | — | — | — | — | — | — | — | É | — | 27 |
| Fraude : confirmer | D | D | — | — | — | — | — | — | — | — | — | — | D | — | 28 |
| **Données de santé, pièces, archives** | | | | | | | | | | | | | | | |
| Lire une donnée de santé (pièce médicale, taux, rapport) | L | L | L | L | — | L | — | L | — | — | — | — | — | — | 29 |
| Voir le type et l'existence d'une pièce médicale (jamais son contenu) | — | — | — | — | — | — | — | — | L | L | L | L | L | L | 41 |
| Scanner, téléverser, rattacher une pièce | — | — | É | É | É | — | — | — | É | É | — | — | — | — | 30 |
| Contrôler une pièce avant archivage | — | — | — | É | É | — | — | — | É | É | — | — | — | — | 31 |
| Verser un dossier clos au fonds (numéro d'archivage, cote physique) | — | — | — | É | — | — | — | — | — | — | É | — | — | — | 32 |
| Reconstituer un dossier perdu, puis certifier la reconstitution | D | — | D | — | — | — | — | — | — | — | É | — | D | — | 33 |
| Détruire : proposer la liste, viser le bordereau | D | — | D | — | — | — | — | — | — | — | É | — | — | — | 34 |
| **Paramètres, comptes, contrôle** | | | | | | | | | | | | | | | |
| Paramétrer (seuils, délais, listes, matrice de délégation) | D | — | — | — | — | — | — | — | — | — | — | — | L | É | 35 |
| Créer les comptes, attribuer les rôles | D | — | — | — | — | — | — | — | — | — | — | — | L | É | 36 |
| Désigner le responsable LBC et la liste « qui reçoit quelle alerte » | L | — | — | — | — | — | — | — | — | — | — | — | D | — | 45 |
| Lire le journal des accès (consultations) | — | — | — | — | — | — | — | — | — | — | — | — | L | — | 37 |
| Lire la piste d'audit (qui a changé quoi) | L | — | L | — | — | — | — | — | — | — | — | — | L | — | 38 |
| Lire le registre de l'IA | — | — | L | — | — | — | — | — | — | — | — | — | L | — | 39 |
| Lire le rapport et le bilan de la reprise | L | — | — | — | — | — | — | — | — | — | — | — | — | L | 40 |

**Notes** (chaque case délicate cite sa FR ; en cas d'écart avec une FR, la FR fait foi).

1. **Périmètre de la lecture** (FR-6) : DG, DT, RESP, AUD lisent tous les dossiers (AUD en lecture seule) ; GEST son volet ; GREC les dossiers en recours, même clos (FR-149) ; MED les dossiers corporels qui lui sont confiés ; EXPI et EXPE leurs seules missions (EXPE ne voit ni la provision, ni le reste du dossier) ; ACC les recherches, le guichet et le statut, **sans contenu médical** ; NUM les lots de numérisation ; ARCH le fonds ; CPT les ordres de règlement et les paiements, sans donnée de santé (FR-148). Un GEST d'un autre volet reçoit « introuvable ». Le téléphone et la pièce d'identité s'affichent masqués (FR-153). ADMIN voit des comptes, des états et des motifs de rejet, jamais le contenu d'un dossier.
2. **Déclarer** : la FR-34 décrit les quatre canaux (guichet, téléphone, WhatsApp ou e-mail, courtier) sans nommer de rôle ; la saisie est faite par l'accueil, le gestionnaire, le gestionnaire recours ou le responsable. Une déclaration s'enregistre toujours, les contrôles donnent des réserves (FR-39). L'assuré n'a pas de rôle ni d'application (§2.2).
3. **Ouvrir** : transitions 1 à 3 de FR-135 (ACC, GEST, GREC, RESP). L'accueil oriente vers le volet, il n'affecte jamais (FR-50).
4. **Affecter** : seul RESP affecte et réaffecte (motif obligatoire à la réaffectation, FR-51) ; s'attribuer un dossier à soi-même est interdit (séparation n° 7). **Seule exception, tracée** : un GEST ou un GREC qui fait avancer un dossier sans titulaire le prend lui-même (FR-50).
5. **Instruire** : transitions 5 à 9 de FR-135 (GEST, GREC, RESP). DG et DT n'instruisent pas.
6. **Garantie** (FR-42) : la décision `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE` est prise par GEST, RESP, DG ou DT, avec un motif de 10 caractères au moins ; elle ne se saute pas ; AUD la lit. Prospera propose, l'agent décide.
7. **Missions** (FR-61, FR-62) : le gestionnaire ou le responsable désigne l'expert ; un expert hors agrément, hors domaine ou en conflit est refusé (`EXPERT_NON_ELIGIBLE`) ; EXPI et EXPE ne voient que leurs missions (FR-180).
8. **Rapport** : l'expert interne le rédige dans l'application, le cabinet avec compte le dépose par le portail (EXPE) ; pour un cabinet **sans compte**, GEST **saisit** le rapport reçu, pièce jointe obligatoire, marqué « saisi pour le cabinet » (FR-67, FR-181). MED valide le **fond médical** (FR-63) ; il ne reçoit jamais de montant de l'IA (FR-11).
9. **Contre-expertise** (FR-66) : ordonnée par RESP, DG ou DT ; un gestionnaire ne l'ordonne pas (`DROIT_INSUFFISANT`). Elle ne revient ni au cabinet auteur du rapport contesté, ni au panel interne (`CONTRE_EXPERTISE_NON_AUTORISEE`) ; séparation n° 8 et n° 9.
10. **Complément non revenu** (FR-67) : la validation est bloquée (`COMPLEMENT_NON_REVENU`) sauf passage outre de RESP avec motif, visible d'AUD.
11. **Évaluer** (FR-75, FR-7) : transition 7 de FR-135 (GEST, GREC, RESP). Au corporel, le calcul est poste par poste, **sans montant proposé par l'IA** (FR-70, FR-71) ; MED rend son avis, le gestionnaire arrête le montant. Une évaluation arrêtée n'est jamais recalculée.
12. **Provision** (FR-76) : GEST la propose et la révise avec un motif ; un écart supérieur ou égal à 2 000 000 FCFA (défaut) **attend RESP** ; DG et DT lisent. Chaque mouvement s'ajoute, jamais écrasé.
13. **Validation** (FR-78, FR-8) : défauts : jusqu'à 1 000 000 FCFA, **proposition de l'instructeur, contrôle d'un second agent du volet et validation du RESP** (trois personnes distinctes) ; au-dessus, le comité puis le **visa de DT** ; un règlement **à titre commercial**, DG seul, quel que soit le montant. Le **cumul des montants validés** du dossier décide du niveau (SEP-03). **GEST et GREC ne valident jamais** (SEP-01) ; un dossier dont on est l'assuré, la victime ou le bénéficiaire ne se valide pas (séparation n° 11). Les délégations réelles sont à obtenir (§12.2, A-2).
14. **Comité** (FR-79) : par défaut 4 membres dont RESP et DT, quorum de 3 ; chaque membre présent vote avec son nom ; un membre ne vote pas sur un dossier qu'il a instruit ; DG siège s'il le décide (§2.1). Le quorum non atteint empêche la décision.
15. **Offre** (FR-84) : l'envoi est fait par GEST ou RESP ; le signataire de la validation est celui de la ligne « Valider selon la délégation » (transition 10 de FR-135). L'offre part sous 48 heures (défaut) ; l'IA la rédige, l'agent la relit et la signe (FR-83).
16. **Accord** (FR-86, FR-90) : seul l'enregistrement de l'accord (offre signée, ou procès-verbal de transaction au corporel) fait passer le dossier à `ORDRE_EMIS` ; il est fait par `ACC`, ou par un agent (GEST ou RESP) qui **n'a ni instruit ni validé** le dossier, sur la **pièce originale signée**, scannée et rattachée, avec contrôle d'identité du signataire (R4, FR-86, FR-90) ; **aucun ordre sans accord enregistré**. Font exception les honoraires d'expert et le règlement à titre commercial (FR-90).
17. **Émission** (FR-93) : **CPT seul** émet ; service sinistres, responsable, direction et contrôle interne **voient** les ordres et les règlements, ils ne les émettent pas. CPT peut **rejeter l'ordre** avec motif (FR-99). Un GEST qui a instruit ou validé ne peut pas enregistrer l'émission, même s'il porte aussi le rôle CPT (SEP-01, SEP-02). Si le dossier est `BLOQUE` et non écarté, l'émission est refusée (FR-130).
18. **Remise** (FR-97) : ACC ou CPT enregistre l'identité et le numéro de pièce du retirant et la quittance signée ; le champ « retiré par » n'est jamais pré-rempli. **Celui qui émet ne remet pas** : la chaîne ordre, chèque, remise est assurée par trois personnes différentes (séparation n° 3) ; celui qui décide ne remet pas (n° 4).
19. **Honoraires** (FR-182) : l'expert dépose (ou le gestionnaire saisit) la note ; **RESP seul** la vise, jamais CPT (CPT émet seulement) ; le visa suppose un rapport validé et le rapprochement facture, lettre de mission et rapport ; le montant visé ne dépasse jamais le montant facturé. Le paiement suit le circuit des règlements.
20. **Clôture** (FR-104) : GEST, GREC ou RESP, avec un motif écrit, si le reste à payer est zéro, les règlements sont remis, aucune mission n'est ouverte et la question du recours est tranchée.
21. **Réouverture** (FR-107, FR-126) : RESP, DG ou DT, avec un motif écrit (transitions 39, 40, 41).
22. **Refus** (FR-121) : RESP, DG ou DT, sur la base d'une décision de garantie ; courrier motivé rédigé par l'IA, relu et signé (FR-122).
23. **Sans suite** (FR-123) : GEST ou RESP, avec motif, après les relances épuisées. **Au corporel automobile**, seuls DG ou DT classent sans suite, et les échéances légales continuent de courir.
24. **Litige** (FR-124) : RESP, DG ou DT, avec motif ; le litige se résout par un retour à `EN_INSTRUCTION`.
25. **Recours** (FR-108, FR-112) : GREC mène le recours ; GEST peut le **créer** quand un tiers apparaît ; RESP valide la créance, engage le contentieux, saisit l'arbitrage et décide de l'abandon. **GREC ne valide pas sa propre créance** ; l'abandon n'est pas décidé par qui l'a proposé (`SEPARATION_DES_TACHES`).
26. **Signaler une fraude** (FR-125) : GEST, GREC, RESP, DG, DT ou AUD, avec motif. La suspicion n'est jamais révélée à l'assuré ni au courtier.
27. **Écarter** (FR-129) : RESP, DG ou DT décident, avec une conclusion écrite et l'**avis d'AUD** ; **le relecteur n'est jamais une partie du dossier** (ni le gestionnaire, ni celui qui l'a instruit, validé ou affecté).
28. **Confirmer** (FR-133) : DG, DT ou AUD seulement, avec une conclusion écrite ; elle mène à `REJETE`. Un dossier `BLOQUE` non écarté suspend la validation, l'accord, l'émission et la remise (FR-130).
29. **Données de santé** (FR-9, FR-153) : lisibles par MED, par le GEST corporel affecté au dossier et par RESP, et par DG et DT par **dossier ouvert à la validation** ; **chaque lecture est journalisée**. ACC et NUM voient le **type** et l'**existence** d'une pièce médicale, jamais son contenu ; ARCH, CPT, AUD et ADMIN voient qu'elle existe et sa date, jamais son contenu. EXPE ne reçoit que les pièces nécessaires à sa mission médicale. Aucune donnée de santé dans un message (FR-227) ni vers le LC (FR-196).
30. **Pièces** (FR-159) : six sources (scanner de guichet, téléversement, photo, lot de NUM, courrier numérisé, message reçu) ; l'agent rattache la pièce. La FR ne nomme pas les rôles : défaut ACC, NUM, GEST, GREC, RESP. Les experts déposent leur rapport par la ligne 8, pas ici.
31. **Contrôle avant archivage** (FR-165) : NUM pour un lot ; l'agent qui a reçu la pièce pour un dépôt au guichet.
32. **Versement** (FR-168) : GEST **propose** à la clôture, ARCH **exécute** ; le fonds ne reçoit que du terminé ; séparation n° 12 : seul ARCH verse.
33. **Reconstitution** (FR-173) : ARCH reconstitue ; DG, RESP ou AUD **certifie**, jamais celui qui a reconstitué (séparation n° 10).
34. **Destruction** (FR-175) : ARCH propose la liste ; le bordereau est visé par RESP puis par DG (défaut). **Aucun bouton « supprimer » n'existe, pour aucun rôle, ADMIN compris.** Elle est refusée sur un dossier sous contrôle, en litige ou sorti de l'archive.
35. **Paramétrage** (FR-4) : ADMIN règle, **sous la validation d'un rôle métier**, versionné et daté ; qui valide quel paramètre est fixé à l'annexe D (le DG au minimum pour les droits, FR-6) ; **la matrice de délégation n'est pas approuvée par le seul DG qu'elle engage** : double contrôle du DG et d'AUD. Les **délais légaux** ne sont pas des paramètres de la compagnie (FR-14). AUD lit le journal des changements.
36. **Comptes** (FR-6) : ADMIN crée les comptes ; un rôle sensible n'est actif qu'après validation par DG ; AUD lit les créations et les retraits. La création d'un administrateur demande deux personnes (FR-238). Double authentification obligatoire pour tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord (FR-25, `MFA_ROLES`, annexe D).
37. **Journal des accès** (FR-13) : le journal des consultations est lu par **AUD seul**. Nul ne peut le modifier, ADMIN compris ; la tentative est tracée.
38. **Piste d'audit** (FR-13, FR-138) : lisible par AUD, RESP et DG.
39. **Registre de l'IA** (FR-12) : lu par AUD et RESP.
40. **Reprise** (FR-219, §6.8) : le bilan de préparation est lu par DG et ADMIN ; ADMIN voit les comptes, les états et les motifs de rejet du rapport de reprise, pas le contenu des dossiers (UJ-8).
41. **Type et existence d'une pièce médicale** (FR-9, FR-153) : ACC, NUM, ARCH, CPT, AUD et ADMIN la voient exister (type, date), jamais son contenu ni un extrait de l'IA ; DG et DT par dossier ouvert à la validation.
42. **Contrôle de niveau 1** (FR-8) : sous 1 000 000 FCFA, un second agent du volet (un autre GEST désigné contrôleur) ou RESP contrôle la proposition ; le contrôleur est distinct de l'instructeur et du validateur.
43. **Quittance signée** (FR-97, FR-7, séparation n° 15) : la quittance est marquée `SIGNEE` par un agent distinct de celui qui a émis le règlement.
44. **Second CPT** (FR-222, FR-7) : l'ordre est validé par un second CPT distinct de celui qui prépare ; au-dessus du seuil `reglement.second_controle_seuil`, DG.
45. **Responsable LBC** (FR-225) : désigné par AUD (jamais par ADMIN seul) ; la liste « qui reçoit quelle alerte » est lue par DG.

**Séparation des tâches** (FR-7, FR-137). Chaque ligne est un test : le serveur refuse l'acte du second rôle avec le code `SEPARATION_DES_TACHES`.

| # | Cumul interdit, sur un même dossier | Règle |
|---|---|---|
| 1 | Instruire et valider | SEP-01 |
| 2 | Décider (valider) et émettre le règlement | SEP-02 |
| 3 | Émettre le règlement et le remettre | chaîne ordre, chèque, remise par trois personnes |
| 4 | Décider et remettre le chèque | SEP-02 |
| 5 | Émettre un règlement et en rapprocher le paiement | deux personnes (FR-7) |
| 6 | Modifier les coordonnées bancaires d'un bénéficiaire et émettre le règlement à son profit | deux personnes (FR-7, FR-100) |
| 7 | S'attribuer un dossier à soi-même | l'attribution est un acte de RESP (FR-50) |
| 8 | Ordonner une contre-expertise sans en avoir le droit | RESP, DG, DT seuls (FR-66) |
| 9 | Juger la contestation d'un rapport en étant son auteur | FR-66 |
| 10 | Reconstituer un dossier et certifier sa reconstitution | FR-173 |
| 11 | Valider un dossier dont on est l'assuré, la victime ou le bénéficiaire | conflit d'intérêts (FR-7) |
| 12 | Verser au fonds sans être archiviste | FR-168 |
| 13 | Instruire et enregistrer l'accord de l'assuré | FR-86, FR-90 (R4) |
| 14 | Valider et enregistrer l'accord de l'assuré | FR-86, FR-90 (R4) |
| 15 | Émettre le règlement et faire signer la quittance | FR-97 (R4) |
| 16 | Lever un blocage fraude `BLOQUE` après avoir affecté, instruit, validé ou siégé au comité du même dossier | FR-129, FR-130 |

Règles complémentaires :
- **SEP-03 : anti-fractionnement.** Le cumul des montants validés d'un même dossier décide du niveau de délégation ; un règlement fractionné en tranches sous le seuil est remonté au niveau supérieur (FR-7, FR-78).
- **Délégation d'absence.** Une personne qui s'absente peut déléguer (le DG pour le responsable, par exemple) par une délégation explicite, datée, motivée et tracée ; hors de ses dates, elle n'agit plus (FR-7). Elle ne lève aucune des séparations ci-dessus.
- **Un dossier `BLOQUE` non écarté** n'accepte ni validation, ni accord, ni émission, ni remise : le blocage ne se contourne ni par un écran ni par un cumul de rôles (FR-130).
- **Un contrôle d'anomalie après coup** (AUD, FR-210) cherche les cumuls échappés ; tolérance zéro, gravité critique pour SEP-01 et SEP-02.
- **Le test de la matrice** : un test parcourt chaque case de ce tableau, pour chacun des quatorze comptes de démonstration, côté serveur ; une case « — » doit refuser, une case « L » ne doit rien permettre d'écrire (FR-15, FR-264).

## Annexe C. Contrat d'échange avec le logiciel de la compagnie

Cette annexe définit l'échange entre Prospera et le logiciel de la compagnie (LC, §6.5), **sans nom de produit**. Elle fait foi pour le LC fictif (§6.6) et pour tout futur connecteur. Elle décrit des **objets et des champs minimaux**, pas des routes ni des formats : le détail technique est dans l'addendum. Elle recense **tout ce que le corps du PRD envoie au LC ou en lit** : un message du corps (« envoyé au LC », « lu du LC ») qui n'a pas de ligne ici est un oubli (test de FR-196). Aucune ligne ne suppose un produit, une base de données ou un format propre à un éditeur.

### C.1 Règles communes à tous les objets

- **Identifiant.** Chaque objet porte l'identifiant stable donné par son propriétaire (la clé d'origine). Il ne change jamais.
- **Sens.** « LC → Prospera » (Prospera lit) ou « Prospera → LC » (Prospera envoie, en appelant le LC ou en déposant un fichier). Prospera tire et dépose ; il n'ouvre aucun port entrant (FR-197).
- **États.** Chaque objet a ses états. Un objet envoyé par Prospera passe par : à envoyer, envoyé, accepté, refusé (avec le motif du LC), jamais confirmé après un délai (24 heures par défaut, FR-196). Un objet reçu qui ne respecte pas ses champs minimaux est refusé et va dans la file des écarts (FR-200).
- **Montants.** En FCFA, entiers, avec la devise. Un « montant » est le montant brut ; une franchise, des honoraires, une part de coassureur ou de réassureur sont des champs à part. Un champ ne mélange jamais le brut et le net.
- **Dates.** Date et heure du fuseau de la compagnie (paramètre) ; chaque fait porte sa **date de valeur** (la date où il est vrai) en plus de sa date d'envoi. Une date d'origine n'est jamais remplacée par la date d'import (PRD Reprise FR-6).
- **Faits, pas totaux.** Les objets d'argent (évaluation et provision, règlement, recours encaissé) sont des faits datés ajoutés, jamais un total à remplacer. Une annulation est un fait inverse. Aucun fait envoyé ou reçu n'est effacé.
- **Idempotence.** Présenter deux fois le même objet (même clé d'origine, même contenu) ne le crée pas deux fois (FR-200). Même clé avec un contenu différent : écart, pas écrasement.
- **Refus.** Un objet refusé revient avec un **code**, un **motif en clair**, la **date**, l'objet et sa clé (FR-196, FR-200).
- **Transport.** Une API que Prospera interroge, ou des fichiers Excel ou JSON que Prospera relève ou dépose (FR-197). Le contrat est le même.
- **Fréquences par défaut.** « 5 min » (API seulement), « heure », « nuit » (avant 6 h) ; ce sont des paramètres. Un LC sans API est limité à « heure » et « nuit » (FR-201). « À l'événement » veut dire : dès que le fait est validé dans Prospera (5 minutes avec une API, à l'heure avec des fichiers).
- **Version.** Chaque fichier et chaque réponse portent la **version du contrat** ; une version inconnue est refusée en entier avec le code `VERSION_CONTRAT_INCONNUE`.
- **Lot.** Un fichier est un **lot** : identifiant de lot, date de génération, objet, nombre de lignes, empreinte. Un lot déjà intégré (même identifiant) n'est pas intégré deux fois.
- **Ordre de dépendance à la lecture.** assurés et produits, puis polices, puis garanties, primes, intermédiaires, coassureurs, puis sinistres existants, puis documents. Une ligne dont le parent est inconnu est refusée avec `IDENTIFIANT_INCONNU` et rejouée quand le parent arrive.
- **Champs minimaux.** Un objet qui ne les respecte pas est refusé. Tout champ en plus est conservé s'il est connu, ignoré sinon.
- **Données de santé.** Le LC ne reçoit **aucune donnée médicale** : ni gravité, ni nature des lésions, ni texte libre ; un envoi ne contient que références, **code de volet**, montants, garanties, états et **motifs codés** (FR-196) *(point juridique J-28 : à confirmer à la séance d'immersion ; base légale à valider par le juriste, §13.2)*.
- **Motif codé.** Tout motif d'un message vers le LC est un **motif codé**, pris dans une liste fermée (D.3), jamais un texte libre.
- **Faits reçus du LC sur un dossier tenu par Prospera.** Un règlement, une annulation ou une clôture reçu du LC (le sens inverse de C-15 et de C-17, lu par C-9) est un **fait reçu** : il bloque les ordres du dossier et s'affiche en alerte rouge ; un dossier modifié par le LC après la prise en main passe en « litige de source » (FR-217).
- **Numéro de sinistre.** La référence de déclaration `DEC-AAAA-NNNNN` est la clé d'origine de la déclaration ; le numéro officiel renvoyé est le numéro du LC, dans son format (FR-198). Le paramètre « qui attribue le numéro » se lit dans la déclaration envoyée (C-13). La `DEC-` est le **champ obligatoire** et l'**identifiant d'idempotence** de la déclaration : le LC renvoie le numéro existant pour une `DEC-` déjà reçue *(défaut H-202 : capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement)*. Quand Prospera attribue le numéro, il porte le préfixe distinct `PRO-` et un **contrôle d'unicité** contre C-9 est fait au basculement ; le format `SIN-AAAA-NNNN` ne vaut que dans ce cas (FR-198).
- **Gabarit de fichier.** Excel : un onglet par objet, première ligne = nom des champs de cette annexe, une ligne par objet, un onglet `lot` (version du contrat, identifiant de lot, date, objet, nombre de lignes, empreinte). JSON : le même contenu, un tableau par objet.

### C.2 Ce que Prospera reçoit du LC

| Ref | Objet | Sens | Clé d'origine | États | Qui fait foi | Champs minimaux | Fréquence | Mode | Règles de rejet | Ce que fait le LC fictif |
|---|---|---|---|---|---|---|---|---|---|---|
| C-1 | Assuré | LC → Prospera | identifiant de l'assuré du LC | actif, clos | le LC | identifiant, nom ou raison sociale, type (personne, société), date de naissance ou de création, pièce d'identité (type, numéro), téléphone, ville, statut | heure (5 min avec API) ; nuit pour la reprise | API ou fichier | `CHAMP_MINIMAL_ABSENT` ; `DOUBLON` si même identifiant avec contenu différent (écart) | Tient les assurés du jeu de démonstration ; produit le fichier |
| C-2 | Police | LC → Prospera | numéro de police | en vigueur, suspendue, résiliée, expirée | le LC | numéro, identifiant de l'assuré, souscripteur, branche, produit, date d'effet, date d'échéance, statut, immatriculation (si automobile), intermédiaire, capitaux garantis, coassurance (oui, non), date de dernière mise à jour | heure ; 5 min avec API | API ou fichier | `IDENTIFIANT_INCONNU` (assuré ou produit inconnu) ; `FORMAT_INVALIDE` (échéance avant effet) | Tient les polices des 7 produits, tous statuts ; peut suspendre ou résilier une police après l'ouverture d'un dossier (FR-204) |
| C-3 | Garantie souscrite | LC → Prospera | numéro de police + code de garantie | acquise, non souscrite, suspendue | le LC | numéro de police, code, libellé, statut, plafond (FCFA), franchise en taux (%), franchise minimale (FCFA), délai de déclaration (jours), exclusions | heure | API ou fichier | `IDENTIFIANT_INCONNU` (police inconnue) ; `MONTANT_INCOHERENT` (taux hors 0-100) | Porte les garanties de chaque produit avec plafonds et franchises |
| C-4 | Produit | LC → Prospera | code produit du LC | publié, retiré | le LC | code, libellé, branche, liste des codes de garantie | nuit | API ou fichier | `CHAMP_MINIMAL_ABSENT` | Tient les 7 produits de la démo |
| C-5 | État de paiement de la prime | LC → Prospera | numéro de police + période | payée, impayée, partielle *(défaut H-203 : état « partielle » à confirmer)* | le LC | numéro de police, début et fin de période, état, date de paiement, date de lecture | heure ; 5 min avec API | API ou fichier | `IDENTIFIANT_INCONNU` ; `FORMAT_INVALIDE` (période incohérente) | Génère des primes payées et impayées ; peut basculer une prime en impayée |
| C-6 | Intermédiaire | LC → Prospera | identifiant de l'intermédiaire | actif, inactif | le LC | identifiant, nom, type (courtier, agent), statut, coordonnées de contact | nuit | API ou fichier | `CHAMP_MINIMAL_ABSENT` | Tient des courtiers et agents rattachés aux polices |
| C-7 | Coassureur et clé de coassurance | LC → Prospera | numéro de police | en vigueur, close | le LC | numéro de police, liste des parts (compagnie, rôle apériteur ou coassureur, taux), part de la compagnie, apériteur | heure | API ou fichier | `MONTANT_INCOHERENT` (somme des taux différente de 100) ; `IDENTIFIANT_INCONNU` | Porte des polices en coassurance avec deux clés différentes |
| C-8 | Traité de réassurance (facultatif) | LC → Prospera | identifiant du traité + millésime | en vigueur, échu | le LC s'il le tient, sinon Prospera (FR-190) | millésime, type (quote-part, excédent de sinistre), branche, taux de cession ou rétention et portée, réassureur | nuit | API ou fichier | `CHAMP_MINIMAL_ABSENT` ; `MONTANT_INCOHERENT` (taux hors 0-100, rétention supérieure à la portée) | Fournit un jeu de traités de démonstration, marqués « démo » |
| C-9 | Sinistre existant | LC → Prospera | numéro de sinistre du LC | états du LC (traduits par une table de correspondance, PRD Reprise FR-4) | le LC pour son numéro et ses montants lus ; Prospera pour le dossier qu'il tient (FR-217) ; **les « montants payés » lus du LC ne remplacent pas le payé de Prospera** (le payé fait foi dans Prospera) et **la mise à jour nocturne n'écrase jamais une provision revue à la main** | numéro, numéro de police, date de survenance, date de déclaration, type, garantie, état, montant évalué et provision lus, montants payés, assuré, victime, immatriculation, date de clôture | nuit (reprise et resynchronisation) ; heure | API ou fichier | `IDENTIFIANT_INCONNU` (police inconnue) ; `ETAT_INCOMPATIBLE` (état sans correspondance) ; `DOUBLON` | Tient des sinistres existants à tous les états, pour tester la reprise et le contrôle de doublon |
| C-10 | Document de sinistre existant | LC → Prospera | identifiant du document | reçu, rattaché, à rattacher | le LC pour la source ; Prospera ensuite | identifiant, numéro de sinistre ou de police, type de pièce, date du document, fichier ou lien, pages, **numéro d'archivage d'origine** (s'il existe), nature (original, copie) | nuit | API (fichier par lien) ou fichier avec dossier de pièces | `IDENTIFIANT_INCONNU` (clé illisible : va à « à rattacher », FR-166) ; `FORMAT_INVALIDE` (type de fichier refusé, FR-160) | Fournit des documents de démonstration (PDF né numérique et scans) |
| C-11 | Numéro de sinistre attribué | LC → Prospera | référence de déclaration `DEC-` | attribué, refusé | le LC | référence de déclaration, numéro de sinistre officiel, date d'attribution, indicateur de doublon (et numéro existant s'il y en a un) : la réponse « doublon + numéro existant » est traitée comme un **écart** (FR-37), jamais comme un second rattachement | 5 min avec API ; heure | API ou fichier | `DOUBLON` (numéro déjà attribué à un autre dossier) ; `NUMERO_OFFICIEL_DEJA_ATTRIBUE` (numéro reçu pour une `DEC-` déjà numérotée : écart) ; `IDENTIFIANT_INCONNU` (référence `DEC-` inconnue) | Attribue les numéros après un délai paramétré, sans trou ni doublon (FR-203) |
| C-12 | Accusé du LC | LC → Prospera | clé d'origine de l'envoi accusé | accepté, refusé, doublon | le LC | clé d'origine, état, code de refus, motif en clair, date, référence du LC | 5 min avec API ; heure | API ou fichier | `IDENTIFIANT_INCONNU` (clé non envoyée par Prospera) | Accepte, refuse avec un code, ou reconnaît un doublon, pour chaque envoi (FR-202, FR-204) |

### C.3 Ce que Prospera envoie au LC

| Ref | Objet | Sens | Clé d'origine | États | Qui fait foi | Champs minimaux | Fréquence | Mode | Règles de rejet | Ce que fait le LC fictif |
|---|---|---|---|---|---|---|---|---|---|---|
| C-13 | Déclaration (pour obtenir un numéro) | Prospera → LC | référence de déclaration `DEC-AAAA-NNNNN` (**champ obligatoire**, clé d'idempotence) | à envoyer, envoyée, acceptée (numéro renvoyé en C-11), refusée, annulée, `SAISIE_MANUELLE` (passée à la liste « à saisir » : l'envoi en attente est annulé) | Prospera (la déclaration) ; le LC (le numéro) | référence `DEC-`, numéro de police, date de survenance, date de déclaration, lieu, **code de volet** (corporel, matériel, risques divers), type de sinistre et gravité (léger, modéré, grave, mortel) **sauf pour un dossier corporel**, nom et téléphone du déclarant (pour un dossier corporel : **ni la gravité, ni le type de sinistre corporel, ni le nom de la victime**, si le LC n'en a pas strictement besoin ; aucune donnée médicale), immatriculation, tiers éventuel, canal de déclaration, auteur, **paramètre « qui attribue le numéro »** | à l'événement (à la déclaration) | API ou fichier | `IDENTIFIANT_INCONNU` (police inconnue : le LC refuse, le dossier se déclare quand même) ; `DOUBLON` (même police, date, immatriculation, victime) ; `FORMAT_INVALIDE` | Renvoie le numéro officiel ; reconnaît un doublon ; refuse avec un code ; peut retarder (FR-204) |
| C-14 | Évaluation et provision | Prospera → LC | numéro de sinistre (ou `DEC-`) + séquence du mouvement | à envoyer, envoyé, accepté, refusé | Prospera (le dossier) | numéro de sinistre ou `DEC-`, séquence, date de valeur, montant évalué, montant validé, provision avant et après, **motif codé** (liste fermée, D.3), garantie retenue, franchise appliquée, auteur | à l'événement (à chaque changement validé) | API ou fichier | `IDENTIFIANT_INCONNU` (numéro inconnu) ; `MONTANT_INCOHERENT` (montant négatif) ; `ETAT_INCOMPATIBLE` (dossier clos au LC) | Enregistre le fait ; refuse un fait sur un sinistre clos |
| C-15 | Règlement | Prospera → LC | identifiant du règlement (**clé d'idempotence**, gardée à chaque nouvelle tentative) | à payer, en cours, inconnu, partiel, payé, échec, annulé | Prospera (la décision et l'ordre) ; le moyen de paiement (l'exécution, FR-193) | numéro de sinistre, identifiant du règlement, bénéficiaire (nom), nature (indemnité, acompte, honoraires d'expert, à titre commercial), montant brut, moyen (chèque, virement, Mobile Money, espèces), référence (numéro de chèque ou de transaction), date, numéro de quittance, niveau de validation | à l'événement (émission, remise, échec, annulation) | API ou fichier | `IDENTIFIANT_INCONNU` ; `MONTANT_INCOHERENT` (règlement supérieur au reste à payer validé) ; `DOUBLON` (même règlement envoyé sous une autre clé : écart, jamais payé deux fois) | Enregistre le règlement ; reconnaît un doublon ; peut refuser |
| C-16 | Recours encaissé | Prospera → LC | identifiant de l'encaissement | à rapprocher, rapproché, écart | Prospera (le recours) ; le LC (la comptabilisation) | numéro de sinistre, identifiant du recours, débiteur (nom, type : assureur ou tiers), montant encaissé, mode, date de valeur, référence | à l'événement (au rapprochement) | API ou fichier | `IDENTIFIANT_INCONNU` ; `MONTANT_INCOHERENT` | Enregistre l'encaissement ; reconnaît un doublon |
| C-17 | Clôture, rejet, sans suite, réouverture | Prospera → LC | identifiant de la décision | à envoyer, envoyée, acceptée, refusée | Prospera (la décision) | numéro de sinistre, nature (clôture, rejet, classement sans suite, réouverture), date, **motif codé** (liste fermée, D.3), total payé, reste à payer, provision finale, auteur | à l'événement | API ou fichier | `ETAT_INCOMPATIBLE` (réouverture d'un dossier non clos, clôture avec reste à payer non nul) ; `IDENTIFIANT_INCONNU` | Clôt ou rouvre le sinistre ; refuse une clôture avec reste à payer |
| C-18 | Liste « à saisir dans le LC » | Prospera → opérateur du LC (fichier) | numéro de ligne + clé d'origine de l'objet | à saisir, saisie, confirmée ; le report du numéro obtenu **clôt la voie `SAISIE_MANUELLE`** | Prospera (la liste) ; le LC (la saisie) | référence (`DEC-` ou numéro de sinistre), nature (déclaration, évaluation et provision, règlement, recours encaissé, clôture), montant, date, auteur, clé d'origine à recopier | chaque jour, avant l'ouverture des bureaux (paramètre) ; seulement si le LC ne sait pas recevoir | fichier (tableur) et écran | sans objet : c'est une sortie ; le retour est le numéro reporté dans Prospera ou la trace renvoyée par C-9, C-11, C-12 | Propose un mode « ne reçoit pas » pour montrer la liste (FR-204) |
| C-19 | Export pour la comptabilité | Prospera → comptabilité de la compagnie | numéro d'export + numéro de ligne | produit, remis, rejoué | la comptabilité (les écritures) ; Prospera (l'état) | numéro d'export, période, date, journal, compte, libellé, débit, crédit, pièce justificative | mensuel et à la demande | fichier (tableur) | sans objet côté Prospera ; un export dont débits et crédits diffèrent n'est pas produit (FR-193) | Reçoit l'export et accuse réception |

### C.4 Codes de rejet (liste de départ)

| Code | Quand |
|---|---|
| `CHAMP_MINIMAL_ABSENT` | un champ minimal de la ligne est absent ou vide |
| `FORMAT_INVALIDE` | date illisible, montant non entier, valeur hors liste, fichier d'un type refusé |
| `IDENTIFIANT_INCONNU` | l'objet parent (police, assuré, sinistre, référence `DEC-`) n'est pas connu du destinataire |
| `DOUBLON` | la clé d'origine existe déjà : ignoré si le contenu est identique, écart si le contenu diffère |
| `ETAT_INCOMPATIBLE` | le changement demandé est interdit à l'état actuel (clôture avec reste à payer, réouverture d'un dossier non clos) |
| `MONTANT_INCOHERENT` | montant négatif, somme des parts différente de 100, règlement supérieur au reste à payer validé |
| `VERSION_CONTRAT_INCONNUE` | la version du contrat n'est pas connue du destinataire : le lot entier est refusé |
| `LOT_DEJA_INTEGRE` | l'identifiant du lot a déjà été intégré : rien n'est ré-intégré |
| `NUMERO_OFFICIEL_DEJA_ATTRIBUE` | un numéro officiel est reçu pour une référence `DEC-` déjà numérotée : écart, jamais un second rattachement (FR-37, FR-198) |

Chaque refus porte en plus un **motif en clair** et la **date** ; un lot partiel intègre ses lignes valides et refuse les autres, ligne par ligne ; rien n'est ignoré en silence (FR-195). Les codes sont une liste de départ : un LC peut en ajouter, la table de correspondance les rattache à ceux-ci.

### C.5 Ce que cette annexe ne dit pas

- Elle ne dit rien du logiciel réel de la compagnie, de son API, de ses formats ni de ses noms de champs : un connecteur se fait quand ce logiciel est connu, par une table de correspondance de ses champs vers ceux de cette annexe.
- Elle ne dit pas si le LC sait recevoir les flux C-13 à C-17 : si non, la liste C-18 s'applique.
- Elle ne fixe ni route, ni schéma technique, ni mécanisme d'authentification : voir l'addendum.
- Elle ne couvre pas l'échange avec l'opérateur de paiement (module `paiement`), avec l'IA commune ni avec la notification : ceux-ci ont leur propre contrat.

## Annexe D. Table des paramètres

**Cette annexe fait foi en cas d'écart avec une FR.** Tous les seuils du PRD sont des **paramètres de la compagnie** (FR-4), versionnés et datés ; un dossier garde les valeurs en vigueur à sa décision. Toutes les valeurs sont des **valeurs par défaut** modifiables, **sauf** celles de D.5, qui sont un référentiel légal. Les seuils d'**alerte** sont calibrés sur les données de la compagnie après la reprise (FR-5). Une valeur marquée `[A]` est une *(défaut H-204)* à confirmer à la séance d'immersion. Une ligne par paramètre : quand deux FR donnaient le même seuil sous deux codes, l'autre code est noté en **alias** ; les écarts de valeur sont listés dans « Conflits résolus ».

Sources : PO = récit du PO ; D3, D8, D9… = décision de cadrage du plan ; DEMO ou démo = code de la démo (valeur reprise comme défaut, à confirmer) ; MEM ou mémoire 2014 = mémoire de 2014 sur la compagnie étudiée (zone CIMA) (à confirmer pour le Togo) ; `[A]` = défaut posé par ce PRD, à confirmer ; CIMA = Code CIMA 2019, article lu (SÛR).

**Gouvernance des paramètres.** Chaque ligne de chaque table de cette annexe porte trois colonnes en plus : le **propriétaire** (le rôle qui tient la valeur), le **validateur** (le rôle qui l'approuve) et la **périodicité de revue**. `ADMIN` règle sous la validation d'un rôle métier (FR-4). **La matrice de délégation n'est pas approuvée par le seul `DG` qu'elle engage** : elle exige le **double contrôle du `DG` et d'`AUD`**. Une valeur de D.5 (référentiel légal que la compagnie ne modifie pas) suit la procédure de mise à jour de la ligne `referentiel.mise_a_jour`.

### D.1 Règles transverses (partie 1)

Rôles, sessions, délégations, données de santé, trace, jeu de démonstration. La matrice de délégation (FR-8, FR-78) est un paramètre de la compagnie ; ses défauts sont des *(défaut H-205)* à confirmer par les délégations réelles.

| code | libellé | défaut | unité | source | FR | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|---|---|
| `CALIB_PERIODE` | Période de recalcul des propositions de seuils d'alerte | 3 | mois | [A] modèle microfinance | FR-5 | `RESP` | `DT` | après la reprise, puis tous les 3 mois |
| `ACTIVATION_ROLES_SENSIBLES` | Rôles activés seulement après validation d'un rôle métier | GEST, GREC, MED, RESP, DT, DG, CPT | liste | [A] modèle microfinance | FR-6 | `ADMIN` | `DG` | annuelle |
| `SEP_TOLERANCE` | Tolérance sur les cumuls interdits (SEP-01, SEP-02) | 0 | cumul | extrait démo (plan de contrôle) | FR-7 | `ADMIN` | `RESP` | à chaque mise en service |
| `DELEG_COMITE_COMPOSITION` | Rôles obligatoires au comité | RESP, DT (plus deux autres membres) | liste | plan D8 [A] | FR-8 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `DELEG_VISA_DT` | Visa du directeur technique après le comité | oui | oui/non | plan D8 [A] | FR-8 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `SANTE_CONSENTEMENT_BASE` | Base légale par défaut du traitement des données de santé | consentement écrit | liste | [A] loi 2019-014 art. 22 | FR-9 | `ADMIN` | `DG` | annuelle |
| `SANTE_LECTURE_GEST` | Étendue de ce que le gestionnaire lit du médecin-conseil | conclusions seulement | liste | [A] | FR-9 | `ADMIN` | `DG` | annuelle |
| `TRACE_CONSERVATION` (alias : `journal.consultation_conservation`) | Durée de conservation du journal, du registre de l'IA et des pièces justificatives | 10 | ans (au moins) | Code CIMA art. 404 (SÛR) | FR-12, FR-13, FR-158 | `ADMIN` | `DG` | annuelle |
| `TRACE_ANCRAGE_PERIODE` | Période de dépôt de l'empreinte du journal hors du serveur | 1 | jour | [A] modèle microfinance | FR-13 | `ADMIN` | `DG` | annuelle |
| `DEMO_COUVERTURE_MIN` | Dossiers minimum par statut et par sortie dans le jeu | 10 | dossiers | [A] modèle microfinance | FR-15 | `ADMIN` | `RESP` | à chaque mise en service |
| `DEMO_NB_DOSSIERS` | Dossiers du portefeuille de démonstration | 3 500 | dossiers | code de la démo, plan D19 | FR-15 | `ADMIN` | `RESP` | à chaque mise en service |
| `DEMO_NB_GESTIONNAIRES` (alias : `fictif.jeu_demo`) | Gestionnaires de la compagnie fictive : corporel / matériel / risques divers / recours | 3 / 5 / 3 / 3 (total 14) | personnes | récit du PO (chiffre de démo) | FR-15, FR-202, FR-205 | `ADMIN` | `RESP` | à chaque mise en service |
| `DEMO_NB_PRODUITS` | Produits du jeu de démonstration | 7 | produits | code de la démo, plan D19 | FR-15 | `ADMIN` | `RESP` | à chaque mise en service |
| `DEMO_VERIFICATIONS_RECETTE` | Vérifications du rejeu de la démo devenues tests de recette | 104 | vérifications | extrait parcours démo (rejeu 2) | FR-15 | `ADMIN` | `RESP` | à chaque mise en service |
| `NOTIF_LANGUE` | Langue par défaut des messages | français | langue | récit PO, v2 | FR-18 | `ADMIN` | `RESP` | à chaque mise en service |
| `DIM_DOSSIERS_ARCHIVES` (alias : `ged.dimensionnement`) | Hypothèse : dossiers archivés [ged.dimensionnement regroupe les cinq lignes DIM_*] | 50 000 | dossiers | plan D20 [A] | FR-23, FR-176 | `ADMIN` | `RESP` | à chaque mise en service |
| `DIM_PAGES` | Hypothèse : pages archivées | 1 500 000 | pages | plan D20 [A] | FR-23 | `ADMIN` | `RESP` | à chaque mise en service |
| `DIM_SINISTRES_AN` | Hypothèse : sinistres par an | 5 000 | sinistres | plan D20 [A] | FR-23 | `ADMIN` | `RESP` | à chaque mise en service |
| `DIM_SITES` | Hypothèse : sites | 1 central + guichets | sites | plan D20 [A] | FR-23, FR-237 | `ADMIN` | `RESP` | à chaque mise en service |
| `DIM_UTILISATEURS_SIMULTANES` | Hypothèse : utilisateurs simultanés | 60 | utilisateurs | plan D20 [A] | FR-23 | `ADMIN` | `RESP` | à chaque mise en service |
| `MFA_ROLES` | Rôles à double authentification obligatoire : **tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord** (règle par capacité, pas liste figée) | DG, DT, RESP, CPT, AUD, ADMIN, EXPE, GEST, MED, GREC, ACC, NUM | liste | [A] ; ADV F-29 | FR-25, FR-254 | `ADMIN` | `DG` | annuelle |
| `SESSION_DUREE_MAX` | Durée maximale d'une session | 8 | heures | [A] modèle microfinance | FR-25 | `ADMIN` | `DG` | annuelle |
| `SESSION_INACTIVITE` | Fermeture après inactivité | 30 | minutes | [A] modèle microfinance | FR-25 | `ADMIN` | `DG` | annuelle |
| `delegation_commercial` (alias : `DELEG_COMMERCIAL`) | Règlement à titre commercial : DG seul | oui, tout montant | règle | D8 | FR-8, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `delegation_cumul_par_dossier` (alias : `DELEG_CUMUL_DOSSIER`) | Le cumul des montants validés d'un dossier décide du niveau | oui | règle | D8 (SEP-03 démo) | FR-7, FR-8, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `delegation_niveau_comite` | Au-delà du plafond : comité sinistres puis visa du DT | oui | règle | D8 | FR-78, FR-79 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `delegation_responsable_max_fcfa` (alias : `DELEG_SEUIL_RESP`) | Plafond de validation du responsable des sinistres seul | 1 000 000 | FCFA | D8, MEM | FR-8, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `comite_membres` (alias : `DELEG_COMITE_MEMBRES`) | Membres du comité sinistres | 4 (dont le responsable et le DT) | membres | D8, MEM | FR-8, FR-79 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `comite_quorum` (alias : `DELEG_COMITE_QUORUM`) | Quorum du comité | 3 | membres | D8 | FR-8, FR-79 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `comite_regle_majorite` | Règle de décision du comité | majorité simple des présents | règle | [A] | FR-79 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.niveau1.controle` | Contrôle de niveau 1 par un second agent du volet, sous le seuil du responsable (un autre `GEST` désigné contrôleur, ou le `RESP`) | oui | oui/non | [A] récit du PO (validation à trois) ; R6 | FR-8, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.comite.delai_tenue` | Délai de tenue du comité sinistres (alerte au 3e jour, repli : délibération écrite) | 5 | jour ouvré | [A] | FR-78, FR-79 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.honoraires.plafond.niveau1..n` | Plafond d'honoraires d'expert par niveau de la matrice de délégation (au-delà, comité) | à fixer avec la compagnie | FCFA par niveau | [A] | FR-78, FR-91, FR-182 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.provision.limite.<role>` | Limite de provision par rôle (distincte de la limite de paiement) : écart cumulé glissant qu'un `GEST` propose sans le `RESP` ; provision totale du dossier que le `RESP` valide seul (au-delà : `DT`) | `GEST` 2 000 000 (écart cumulé glissant) ; `RESP` 5 000 000 (provision totale) | FCFA par rôle | pratiques-du-metier.md (point 2) ; *(défaut H-272)* | FR-8, FR-76, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.paiement.limite.<role>` | Limite de paiement par rôle (distincte de la limite de provision) | `RESP` 1 000 000 ; au-delà comité puis visa du `DT` ; règlement à titre commercial : `DG` seul | FCFA par rôle | pratiques-du-metier.md (point 2) ; D8 ; *(défaut H-273)* | FR-8, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.cumul_provision_dossier` | Le cumul anti-fractionnement porte aussi sur la provision totale du dossier (en plus des paiements validés) | oui | règle | pratiques-du-metier.md (point 2) ; *(défaut H-274)* | FR-7, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.suppleance.duree_max_jours` | Durée maximale d'une suppléance (délégation temporaire datée), renouvelable avec un nouveau motif | 30 | jours | pratiques-du-metier.md (point 2) ; *(défaut H-275)* | FR-7, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `deleg.suppleance.regles` | Suppléance : personne nommée, motif obligatoire, alerte à `AUD` à la création, jamais au-delà de la limite du délégant | oui | règle | pratiques-du-metier.md (point 2) ; *(défaut H-276)* | FR-7, FR-78 | `DG` | `DG` et `AUD` (double contrôle) | annuelle et à chaque changement d'organisation |
| `calibration.*` | Calibration des grilles de provision : marge de fiabilité, amplitude, occupation, concentration, ancienneté, tranches mortes ; alerte de grille périmée | valeurs de la démo | — | [A] démo | FR-4, FR-5 | `RESP` | `DT` | après la reprise, puis tous les 3 mois |

### D.2 Circuit sinistre (partie 2, §5)

Valeurs du circuit : déclaration et numéro de sinistre, ouverture, instruction, expertise (seuils), chiffrage, provision, offre, règlement, clôture, recours, sorties, fraude, délais internes et relances. Les délais internes sont modifiables par produit ; les délais légaux sont en D.5.

| code | libellé | défaut | unité | source | FR | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|---|---|
| `ecart_alerte_reception_saisie_jours_ouvres` | Écart réception réelle / saisie qui alerte le responsable | 1 | jour ouvré | [A] (défaut relevé par MEM) | FR-34 | `DT` | `DG` | annuelle |
| `delai_alerte_numero_officiel_jours_ouvres` (alias : `NUM_DELAI_ALERTE`, `delais.numero_officiel_jours_ouvres`, `sinistre.delai_numero`) | Délai avant alerte « dossier sans numéro officiel » | 1 | jour ouvré | D3 | FR-2, FR-37, FR-142, FR-198 | `RESP` | `DT` | annuelle |
| `qui_attribue_numero_sinistre` (alias : `NUM_ATTRIBUTION`, `sinistre.qui_attribue`) | Qui attribue le numéro de sinistre officiel | LC (logiciel de la compagnie) | LC ou Prospera | D3, PO | FR-2, FR-37, FR-198 | `RESP` | `DT` | annuelle |
| `delai_declaration_jours_defaut` | Délai de déclaration d'une garantie (lu dans le LC par garantie) ; **jamais sous le plancher légal de D.5** : une valeur sous le plancher est refusée à la configuration (test) | 5 | jour ouvré | DEMO ; plancher légal (art. 12-4°) | FR-43 | `RESP` | `DT` | annuelle |
| `delai_declaration_transport_jours` | Délai de déclaration, transport de marchandises (valeur gardée) | 3 | jour | DEMO | FR-43 | `RESP` | `DT` | annuelle |
| `delai_declaration_vol_heures` (alias : `delai_declaration_vol_jours`) | Délai de déclaration en cas de vol ; **jamais sous le plancher légal de 48 heures** (art. 12-4°) | 48 | heure | DEMO (2 jours) ; plancher légal | FR-43 | `RESP` | `DT` | annuelle |
| `pieces_complementaires_par_type` | Liste des pièces complémentaires par type | listes de la démo | liste | DEMO | FR-44 | `RESP` | `DT` | annuelle |
| `pieces_corporel_cima` | Pièces à demander à la victime et aux ayants droit (art. 240, 241) | pièce d'identité, acte de naissance, acte de mariage, certificat médical initial ; certificat de décès, jugement d'hérédité, certificat de vie, certificat de genre de mort | liste | CIMA, [A] (à valider par le juriste) | FR-44 | `RESP` | `DT` | annuelle |
| `pieces_obligatoires_par_type` | Liste des pièces obligatoires par type de sinistre (12 types) | listes de la démo (annexe D) | liste | DEMO | FR-44 | `RESP` | `DT` | annuelle |
| `volet_par_type` | Volet par défaut de chaque type de sinistre | corporel : auto corporel, accident du travail, décès ; matériel : auto matériel, collision ; risques divers : les autres | table | DEMO | FR-44 | `RESP` | `DT` | annuelle |
| `delai_troisieme_relance_jours` | Délai écrit dans le troisième message | 15 | jour | DEMO | FR-47 | `RESP` | `DT` | annuelle |
| `alerte_accuse_gestionnaire_jours` | Jour où l'accusé non envoyé alerte l'agent | 8 | jour | [A] | FR-48 | `RESP` | `DT` | annuelle |
| `delai_accuse_reception_jours` (alias : `DELAI_ACCUSE_RECEPTION`, `delais.accuse_reception_jours`) | Accusé de réception du dossier complet (délai interne, dernier recours) | 10 | jour | DEMO | FR-14, FR-48, FR-142 | `RESP` | `DT` | annuelle |
| `accuse_declaration.delai` | Accusé de déclaration portant la référence `DEC-` : immédiat et automatique, à l'enregistrement | immédiat | délai | pratiques-du-metier.md (point 11) ; *(défaut H-282)* | FR-14, FR-36 | `RESP` | `DT` | annuelle |
| `arrondi_provision_fcfa` | Arrondi de la provision d'ouverture | 5 000 | FCFA | DEMO | FR-49 | `DT` | `DG` | annuelle |
| `alerte_dossier_non_affecte_jours_ouvres` | Délai avant alerte « dossier ouvert non affecté » | 1 | jour ouvré | [A] | FR-50 | `RESP` | `DT` | annuelle |
| `poids_charge_domaine_type` | Poids de charge par domaine et par type de mission | à saisir (grille de la démo non extraite) | poids | DEMO, à compléter | FR-51 | `RESP` | `DT` | annuelle |
| `poids_charge_gravite` | Coefficient de gravité du poids de charge | léger et modéré 1 ; grave 1,3 ; mortel 1,6 | coefficient | DEMO | FR-51 | `RESP` | `DT` | annuelle |
| `seuil_disponible_gestionnaire` | Charge pondérée / capacité sous laquelle un gestionnaire est disponible | 0,8 | ratio | DEMO | FR-51 | `RESP` | `DT` | annuelle |
| `seuil_surcharge_gestionnaire` | Charge pondérée / capacité au-delà de laquelle un gestionnaire est surchargé | 1,2 | ratio | DEMO | FR-51 | `RESP` | `DT` | annuelle |
| `alertes_instruction` | Seuils des alertes d'instruction : sinistre moins de 30 jours après souscription ; véhicule de plus de 15 ans ; montant de plus de 5 000 000 FCFA (contre-expertise recommandée) ; plainte de vol déposée plus de 2 jours après les faits ; réserves de transport plus de 3 jours après livraison ; prescription du recours transporteur 1 an (2 ans en aérien) | valeurs de la démo | seuils | DEMO | FR-55 | `RESP` | `DT` | annuelle |
| `franchise_defaut_biens_fcfa` | Franchise par défaut du formulaire biens et divers | 25 000 | FCFA | DEMO | FR-55, FR-73 | `RESP` | `DT` | annuelle |
| `orientation_declaration_tardive_jours` | Déclaration tardive qui déclenche l'orientation « fraude » | 15 | jour | DEMO | FR-58 | `RESP` | `DT` | annuelle |
| `orientation_souscription_recente_jours` | Souscription récente qui déclenche l'orientation « fraude » | 60 | jour | DEMO | FR-58 | `RESP` | `DT` | annuelle |
| `accord_devis_dossier_max_fcfa` | Voie accord sur devis : montant maximal du dossier | 300 000 | FCFA | D9, MEM | FR-59 | `CPT` | `RESP` | annuelle |
| `accord_devis_montant_max_fcfa` | Voie accord sur devis : montant maximal du devis | 200 000 | FCFA | D9, MEM | FR-59 | `CPT` | `RESP` | annuelle |
| `accord_devis.conditions` | Conditions cumulatives de la voie : matériel automobile, aucun corporel, garantie acquise sans réserve, aucun signal de fraude, pièces obligatoires complètes, aucun tiers contestant | les six | liste | pratiques-du-metier.md (point 4) ; *(défaut H-277)* | FR-59 | `RESP` | `DT` | annuelle |
| `accord_devis.cumul_periode_jours` | Période glissante du cumul anti-fractionnement de la voie (par police et par véhicule) | 90 | jours | pratiques-du-metier.md (point 4) ; *(défaut H-278)* | FR-59 | `RESP` | `DT` | annuelle |
| `accord_devis.cumul_max_fcfa` | Plafond cumulé des accords sur devis par police et par véhicule sur la période | 500 000 | FCFA | pratiques-du-metier.md (point 4) ; *(défaut H-279)* | FR-59 | `RESP` | `DT` | annuelle |
| `accord_devis.audit_taux_pct` | Audit mensuel par échantillon des dossiers de la voie par `AUD` : part tirée au hasard (5 dossiers au moins, ou tous s'il y en a moins de 5) | 10 | % | pratiques-du-metier.md (point 4) ; *(défaut H-280)* | FR-59 | `DT` | `DG` | annuelle |
| `panel_interne_domaines` (alias : `expert.panel_interne_demo`) | Domaines couverts par le panel interne [l'alias expert.panel_interne_demo couvre aussi panel_interne_zones] | automobile matériel, médical, responsabilité | liste | DEMO | FR-59, FR-179 | `RESP` | `DT` | annuelle |
| `panel_interne_zones` | Zones desservies par le panel interne | Lomé, Tsévié, Aného | liste | DEMO | FR-59 | `RESP` | `DT` | annuelle |
| `seuil_expertise_externe_fcfa` | Expertise externe obligatoire au-dessus | 3 000 000 | FCFA | DEMO | FR-59 | `RESP` | `DT` | annuelle |
| `seuil_expertise_requise_fcfa` | Aucune expertise requise sous ce montant | 250 000 | FCFA | DEMO | FR-59 | `RESP` | `DT` | annuelle |
| `catalogue_prix_pieces` | Catalogue de fourchettes de prix des pièces, taux horaire, coefficients de catégorie | à constituer (valeurs de la démo non retenues) | table | [A] | FR-60 | `RESP` | `DT` | annuelle |
| `comparables_devis_min` | Observations minimales pour l'historique des devis | 5 | observations | DEMO | FR-60 | `RESP` | `DT` | annuelle |
| `devis_surcout_alerte_pct` | Surcoût d'un poste qui alerte, en pourcentage du devis | 10 | % | DEMO | FR-60 | `RESP` | `DT` | annuelle |
| `delai_certificat_medical_jours` | Délai d'attente par type de certificat | initial 8 ; prolongation 8 ; arrêt de travail 8 ; reprise 10 ; guérison 12 ; consolidation 15 ; descriptif des séquelles 12 ; aggravation 12 ; rechute 10 ; complémentaire 8 | jour | DEMO | FR-63 | `RESP` | `DT` | annuelle |
| `comparables_dossiers_min` | Dossiers comparables minimaux pour la médiane | 12 | dossiers | DEMO | FR-65, FR-74 | `RESP` | `DT` | annuelle |
| `comparables_missions_min` | Missions comparables minimales pour la médiane | 5 | missions | DEMO | FR-65 | `RESP` | `DT` | annuelle |
| `ecart_comparables_significatif_pct` | Écart significatif à la médiane des comparables | 25 | % | DEMO | FR-65 | `DT` | `DG` | annuelle |
| `ecart_expert_attention_pct` | Écart expert / dossier : niveau attention | 15 | % | DEMO | FR-65 | `DT` | `DG` | annuelle |
| `ecart_expert_bloquant_pct` | Écart expert / dossier : niveau bloquant | 35 | % | DEMO | FR-65 | `DT` | `DG` | annuelle |
| `decompte.ordre` | Ordre du décompte des sinistres non corporels (la franchise est déduite du montant arrêté, jamais avant la règle proportionnelle) | dommage, vétusté, règle proportionnelle, plafond, franchise | ordre | code de la démo, corrigé le 2026-11-13 (plan D15) | FR-69, FR-75 | `RESP` | `DT` | annuelle |
| `grille_vetuste_auto` | Vétusté sur pièces selon l'âge du véhicule | jusqu'à 1 an 0 % ; 2 ans 10 % ; 3 ans 20 % ; 5 ans 30 % ; 8 ans 40 % ; au-delà 50 % | % | DEMO (« indicative ») | FR-72 | `RESP` | `DT` | annuelle |
| `abattement_divers_pct` | Abattement du formulaire divers | 10 | % | DEMO | FR-73 | `RESP` | `DT` | annuelle |
| `arrondi_indemnite_fcfa` | Arrondi des montants non corporels | 5 000 (corporel : au franc) | FCFA | DEMO, [A] | FR-73 | `RESP` | `DT` | annuelle |
| `tolerance_expert_pct` | Tolérance affichée : montant arrêté / proposition de l'expert | 10 | % | DEMO | FR-80 | `RESP` | `DT` | annuelle |
| `tolerance_provision_pct` | Tolérance affichée : indemnité / provision | 25 | % | DEMO | FR-80 | `DT` | `DG` | annuelle |
| `delai_communication_pv_transaction_heures` | Communication du procès-verbal de transaction aux bénéficiaires | 24 | heure | MEM, [A] | FR-84 | `RESP` | `DT` | annuelle |
| `delai_envoi_offre_heures` (alias : `DELAI_OFFRE_VALIDEE_ENVOI`, `delais.offre_envoi_heures`) | Délai d'envoi de l'offre validée | 48 | heure | D6, MEM | FR-14, FR-84, FR-142 | `RESP` | `DT` | annuelle |
| `delai_alerte_offre_jours` (alias : `delais.offre_alerte_jours`) | Alerte au responsable d'une offre sans réponse | 30 | jour | D6 | FR-89, FR-142 | `RESP` | `DT` | annuelle |
| `delai_relance_offre_jours` (alias : `delais.offre_relance_jours`) | Première relance d'une offre sans réponse | 15 | jour | D6 | FR-89, FR-142 | `RESP` | `DT` | annuelle |
| `reglement.honoraires_motif_au_dela_lettre` | Visa d'honoraires : motif exigé au-delà de la lettre de mission | OUI | oui/non | démo | FR-90 | `RESP` | `DT` | annuelle |
| `reglement.gabarit_lettre_cheque` | Gabarit de lettre-chèque de la compagnie | aucun (remplissage manuel) | fichier | *(défaut H-206)* | FR-94 | `CPT` | `RESP` | annuelle |
| `reglement.ecart_rapprochement_jours` (alias : `RAPPROCHEMENT_ECART_ANCIEN`, `compta.rapprochement_ancien`) | Écart de rapprochement ancien = alerte (dans `paiement`) | 60 | jours | démo, D16 | FR-95, FR-193, FR-224 | `DT` | `DG` | annuelle |
| `reglement.operateurs_mobile_money` (alias : `MOBILE_MONEY_OPERATEURS`) | Opérateurs Mobile Money autorisés | T-Money, Flooz | liste | D11 | FR-95, FR-223 | `RESP` | `DT` | annuelle |
| `reglement.code_usage_unique_minutes` | Validité du code à usage unique | 10 | minutes | *(défaut H-207)* | FR-96 | `RESP` | `DT` | annuelle |
| `reglement.signature_electronique_quittance` | Acceptation électronique de la quittance par code à usage unique | désactivée | oui/non | D11, D21 | FR-96 | `CPT` | `RESP` | annuelle |
| `reglement.fenetre_cumul_especes_jours` | Fenêtre de cumul du plafond espèces | 30 | jours | *(défaut H-208)* | FR-98 | `AUD` | `DG` | semestrielle |
| `reglement.plafond_especes` (alias : `PLAFOND_ESPECES`) | Plafond d'un règlement en espèces (par règlement et par bénéficiaire, cumul sur 30 j) | 500000 | FCFA | démo PLAFOND_ESPECES, D11 | FR-98, FR-225 | `AUD` | `DG` | semestrielle |
| `dossier.motif_min_caracteres` (alias : `GARANTIE_MOTIF_LONGUEUR_MIN`, `garantie.motif_min`) | Longueur minimale d un motif écrit | 10 | caractères | démo (décision de garantie) | FR-3, FR-99, FR-104, FR-187 | `RESP` | `DT` | annuelle |
| `reglement.fenetre_coordonnees_jours` (alias : `FENETRE_COORDONNEES`, `controle.coordonnees_bancaires`) | Changement de coordonnées avant paiement = alerte | 5 | jours | démo FENETRE_COORDONNEES_JOURS | FR-100, FR-210, FR-222 | `AUD` | `DG` | semestrielle |
| `reglement.fenetre_doublon_jours` (alias : `DOUBLON_REGLEMENT_FENETRE`, `controle.doublon_reglement`) | Fenêtre de détection du doublon de règlement | 30 | jours | démo | FR-100, FR-210, FR-222, FR-224 | `AUD` | `DG` | semestrielle |
| `reglement.part_concentration_pct` (alias : `CONCENTRATION_EMISSION`, `controle.concentration`) | Part du volume émis par un même comptable déclenchant l'alerte | 60 | % | démo PART_CONCENTRATION | FR-100, FR-210, FR-224 | `RESP` | `DT` | annuelle |
| `reglement.seuil_cumul_lbc` (alias : `LBC_SEUIL_CUMUL_CLIENT`) | Cumul par bénéficiaire déclenchant l'alerte LBC/FT | (vide, alerte inactive) | FCFA | *(défaut H-209)* valeur nationale non lue | FR-100, FR-225 | `AUD` | `DG` | semestrielle |
| `reglement.cheque_circulation_longue_jours` (alias : `CHEQUE_CIRCULATION_LONGUE`) | Chèque non retiré : circulation longue | 21 | jours | démo | FR-101, FR-221 | `CPT` | `RESP` | annuelle |
| `reglement.cheque_exposition_jours` (alias : `CHEQUE_EXPOSITION`) | Chèque non retiré : exposition | 30 | jours | démo DELAI_GUICHET_JOURS | FR-101, FR-221 | `CPT` | `RESP` | annuelle |
| `reglement.cheque_relance_jours` (alias : `CHEQUE_RELANCE_GUICHET`) | Chèque non retiré : relance | 7 | jours | démo RELANCE_GUICHET_JOURS | FR-101, FR-221 | `CPT` | `RESP` | annuelle |
| `reglement.alerte_avant_echeance_heures` | Alerte jaune avant la cible de paiement | 48 | heures | *(défaut H-210)* | FR-102 | `RESP` | `DT` | annuelle |
| `reglement.attendre_fin_denonciation` | Au corporel automobile, ne pas émettre avant la fin du délai de dénonciation | OUI | oui/non | *(défaut H-211)* | FR-102 | `RESP` | `DT` | annuelle |
| `reglement.delai_paiement_heures` (alias : `DELAI_PAIEMENT_APRES_ACCORD`) | Paiement après accord (cible interne) | 72 | heures | mémoire 2014 (D7) | FR-14, FR-102 | `CPT` | `RESP` | annuelle |
| `recours.nouveau_non_traite_jours` | Nouveau recours non traité = alerte | 60 | jours | démo | FR-108 | `RESP` | `DT` | annuelle |
| `recours.sans_action_jours` | Recours sans action = alerte | 30 | jours | démo | FR-108 | `RESP` | `DT` | annuelle |
| `recours.delai_lettre_mise_en_cause_jours_ouvres` | Envoi de la lettre de mise en cause après ouverture | 5 | jours ouvrés | *(défaut H-212)* | FR-109 | `RESP` | `DT` | annuelle |
| `recours.relance_jours` (alias : `DELAI_RELANCE_RECOURS`, `delai_relance_recours_jours`) | Relance du recours tant que sans réponse puis jusqu au recouvrement | 15 | jours | mémoire 2014, D10 | FR-14, FR-54, FR-110 | `RESP` | `DT` | annuelle |
| `recours.delai_reclamation_apres_paiement_jours` | Réclamation du remboursement après paiement de l assuré | 30 | jours | démo (délai de transmission) | FR-111 | `RESP` | `DT` | annuelle |
| `recours.creance_ancienne_jours` | Créance non soldée ancienne = alerte | 90 | jours | démo | FR-113 | `RESP` | `DT` | annuelle |
| `recours.inclure_honoraires_base` | Honoraires d expert inclus dans la base du montant réclamé | NON | oui/non | *(défaut H-213)* | FR-113 | `RESP` | `DT` | annuelle |
| `recours.delai_mise_en_demeure_jours` | Délai accordé au débiteur par la mise en demeure | 30 | jours | démo | FR-114 | `RESP` | `DT` | annuelle |
| `recours.seuil_perte_validation_direction` | Perte sur créance exigeant la validation DG ou DT | (vide) | FCFA | *(défaut H-214)* | FR-115 | `RESP` | `DT` | annuelle |
| `recours.alerte_prescription_jours` | Alerte avant le terme indicatif | 90 | jours | démo | FR-118 | `RESP` | `DT` | annuelle |
| `recours.arbitrage_obligatoire` | Arbitrage inter-assureurs activé (art. 276) | OUI (à vérifier) | oui/non | Code CIMA art. 276 (SÛR), *(défaut H-215)* | FR-119 | `RESP` | `DT` | annuelle |
| `recours.convention_active` | Convention de place active (indemnisation directe, forfait) | NON | oui/non | *(défaut H-216)* | FR-119 | `RESP` | `DT` | annuelle |
| `recours.convention_delai_reglement_jours` | Délai de règlement entre compagnies sous convention | (vide) | jours | recherche (exemple 30 j, non togolais) | FR-119 | `RESP` | `DT` | annuelle |
| `recours.convention_forfait` | Forfait inter-compagnies (valeur d exemple) | 350000 | FCFA | démo R1 | FR-119 | `RESP` | `DT` | annuelle |
| `recours.ida_active` | Modèle de convention d'indemnisation directe activé | NON | oui/non | pratiques-du-metier.md (A-23) ; *(défaut H-283)* | FR-119 | `RESP` | `DT` | annuelle |
| `recours.ida_perimetre` | Périmètre du modèle d'indemnisation directe | deux véhicules assurés, dommages matériels | règle | pratiques-du-metier.md (A-23) ; *(défaut H-284)* | FR-119 | `RESP` | `DT` | annuelle |
| `recours.ida_seuil_fcfa` | Seuil d'indemnisation directe par dossier | (vide) | FCFA | pratiques-du-metier.md (exemple camerounais de 500 000 FCFA, non togolais) ; *(défaut H-284)* | FR-119 | `RESP` | `DT` | annuelle |
| `recours.ida_constat_obligatoire` | Constat amiable signé par les deux parties exigé | oui | oui/non | pratiques-du-metier.md (A-23) ; *(défaut H-284)* | FR-119 | `RESP` | `DT` | annuelle |
| `recours.ida_bareme_forfaitaire` | Barème forfaitaire de l'indemnisation directe | (vide) | table | pratiques-du-metier.md (A-23) ; *(défaut H-284)* | FR-119 | `RESP` | `DT` | annuelle |
| `litige.offre_partielle_active` | Offre partielle sur la part non contestée, hors corporel (retour `LITIGE` vers `EN_INSTRUCTION`, motif « offre partielle sur la part non contestée ») | oui | oui/non | pratiques-du-metier.md (point 8) ; *(défaut H-281)* | FR-88, FR-124 | `RESP` | `DT` | annuelle |
| `recours.contre_proposition_formule` | Contre-proposition : max(offre x 1,15 ; moyenne offre et réclamé ; 80 % du réclamé) | formule démo | formule | démo | FR-120 | `RESP` | `DT` | annuelle |
| `recours.ecart_accord_rapide_pct` | Écart à l offre : accord rapide jusqu à | 15 | % | démo | FR-120 | `DT` | `DG` | annuelle |
| `recours.ecart_negociable_pct` | Écart à l offre : négociable jusqu à | 35 | % | démo | FR-120 | `DT` | `DG` | annuelle |
| `sortie.delai_decision_refus_heures` | Décision de refus soumise au responsable ou à la direction | 48 | heures | mémoire 2014 (D7) | FR-121 | `RESP` | `DT` | annuelle |
| `sortie.delai_information_refus_jours_ouvres` | Courrier de refus envoyé après la décision | 2 | jours ouvrés | mémoire 2014 (72 h), *(défaut H-217)* | FR-121 | `RESP` | `DT` | annuelle |
| `sortie.attente_apres_derniere_relance_jours` | Attente après la dernière relance avant classement | 15 | jours | démo (3e relance) , *(défaut H-218)* | FR-123 | `RESP` | `DT` | annuelle |
| `sortie.canaux_min_sans_suite` | Canaux de relance distincts avant classement | 2 | canaux | *(défaut H-219)* | FR-123 | `RESP` | `DT` | annuelle |
| `sortie.delai_grace_versement_sans_suite_jours` | Délai avant versement aux archives d un dossier sans suite | 30 | jours | *(défaut H-220)* | FR-123 | `RESP` | `DT` | annuelle |
| `sortie.relances_avant_sans_suite` | Relances sans effet avant classement sans suite | 3 | relances | démo RELANCES_SANS_EFFET | FR-123 | `RESP` | `DT` | annuelle |
| `sortie.sans_suite_corporel_decision_direction` | Classement sans suite d un corporel automobile réservé à la direction | OUI | oui/non | Code CIMA art. 231 (SÛR), *(défaut H-221)* | FR-123 | `RESP` | `DT` | annuelle |
| `sortie.reouvertures_alerte` | Nombre de réouvertures déclenchant l alerte au contrôle interne | 3 | réouvertures | *(défaut H-222)* | FR-126 | `RESP` | `DT` | annuelle |
| `fraude.poids.beneficiaire_multiple` | Poids du signal BENEFICIAIRE_MULTIPLE | 15 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.contrat_non_actif` | Poids du signal CONTRAT_NON_ACTIF | 40 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.declaration_tardive` | Poids du signal DECLARATION_TARDIVE | 10 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.incoherence_dates` | Poids du signal INCOHERENCE_DATES | 30 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.montant_atypique` | Poids du signal MONTANT_ATYPIQUE | 20 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.sinistre_precoce` | Poids du signal SINISTRE_PRECOCE | 30 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.sinistres_repetes` | Poids du signal SINISTRES_REPETES | 25 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.telephone_partage` | Poids du signal TELEPHONE_PARTAGE | 15 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.poids.vehicule_recurrent` | Poids du signal VEHICULE_RECURRENT | 20 | points | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.beneficiaire_multiple` | Dossiers pour le même bénéficiaire | 3 | dossiers | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.declaration_tardive_jours` | Déclaration tardive | 45 | jours | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.montant_atypique_coefficient` | Évaluation / coût moyen de la branche | 4 | x | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.sinistre_precoce_jours` | Sinistre précoce après la prise d effet | 30 | jours | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.sinistres_repetes` | Nombre de sinistres sur la police | 3 | sinistres | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.telephone_partage` | Assurés sur le même téléphone | 3 | assurés | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.seuil.vehicule_recurrent` | Dossiers sur la même immatriculation | 3 | dossiers | démo | FR-127 | `AUD` | `DG` | semestrielle |
| `fraude.niveau.attention` | Seuil du niveau ATTENTION | 20 | points | démo | FR-128 | `AUD` | `DG` | semestrielle |
| `fraude.niveau.bloque` | Seuil du niveau BLOQUE (suspend ordre et paiement) | 70 | points | démo | FR-128 | `AUD` | `DG` | semestrielle |
| `fraude.niveau.suspect` | Seuil du niveau SUSPECT (ouvre la revue) | 45 | points | démo, *(défaut H-223)* pour l ouverture de revue | FR-128 | `AUD` | `DG` | semestrielle |
| `fraude.plafond_score` | Plafond du score | 100 | points | démo | FR-128 | `AUD` | `DG` | semestrielle |
| `fraude.delai_revue_bloque_jours_ouvres` | Dossier BLOQUE non revu = alerte | 3 | jours ouvrés | *(défaut H-224)* | FR-129 | `AUD` | `DG` | semestrielle |
| `fraude.tranches_anciennete_jours` | Tranches d ancienneté des revues | 7 / 30 / 90 | jours | démo | FR-131 | `AUD` | `DG` | semestrielle |
| `fraude.fenetre_graphe_mois` | Fenêtre du graphe de liens | 12 | mois | démo (portefeuille 12 mois) | FR-132 | `AUD` | `DG` | semestrielle |
| `fraude.garage_dossiers_min` | Dossiers minimum pour signaler un garage | 5 | dossiers | *(défaut H-225)* | FR-132 | `AUD` | `DG` | semestrielle |
| `fraude.garage_ecart_marche_pct` | Devis de garage au-dessus de la moyenne du marché | 20 | % | démo | FR-132 | `AUD` | `DG` | semestrielle |
| `delais.alerte_interne_pct` | Alerte à la part du délai interne écoulée | 85 | % | démo (seuil d alerte délai) | FR-140 | `RESP` | `DT` | annuelle |
| `delais.alerte_legale_jours` (alias : `ALERTE_ECHEANCE_LEGALE`, `veille.offre_corporelle`) | Alerte avant une échéance réglementaire | 45 | jours | démo (veille : offre corporelle à présenter dans 45 j) | FR-14, FR-140, FR-208 | `RESP` | `DT` | annuelle |
| `delais.offre_autres_jours` | Offre interne, autres branches | 75 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `delais.offre_corporel_jours` (alias : `DELAI_OFFRE_DOSSIER_COMPLET`, `delai_interne_offre_jours`) | Offre interne, corporel (départ : dossier complet) [les alias combinés couvrent aussi delais.offre_materiel_jours et delais.offre_autres_jours] | 90 | jours | démo (§3.7) | FR-14, FR-85, FR-142 | `RESP` | `DT` | annuelle |
| `delais.offre_materiel_jours` | Offre interne, matériel | 60 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `delais.reglement_autres_jours` | Règlement après accord, limite interne, autres | 30 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `delais.reglement_corporel_jours` (alias : `DELAI_REGLEMENT_APRES_ACCORD`, `delai_interne_reglement_jours`) | Règlement après accord, limite interne, corporel [les alias combinés couvrent aussi delais.reglement_materiel_jours et delais.reglement_autres_jours] | 45 | jours | démo | FR-14, FR-85, FR-142 | `CPT` | `RESP` | annuelle |
| `delais.reglement_materiel_jours` | Règlement après accord, limite interne, matériel | 30 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `delais.sla_corporel_jours` (alias : `SLA_VOLET`, `delai_interne_traitement_jours`, `pilotage.delai_cible_volet`) | Délai de traitement du volet corporel [les alias combinés couvrent aussi les trois autres volets (delais.sla_*)] | 45 | jours | démo SLA_PAR_VOLET | FR-14, FR-85, FR-142, FR-213 | `RESP` | `DT` | annuelle |
| `delais.sla_materiel_jours` | Délai de traitement du volet matériel | 21 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `delais.sla_recours_jours` | Délai de traitement du volet recours | 90 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `delais.sla_risques_divers_jours` | Délai de traitement du volet risques divers | 30 | jours | démo | FR-142 | `RESP` | `DT` | annuelle |
| `relance.canaux` | Canaux de relance | appel, SMS, e-mail, WhatsApp, courrier | liste | démo CanalRelance | FR-143 | `RESP` | `DT` | annuelle |
| `relance.intervalle_jours` (alias : `NOTIF_INTERVALLE_RELANCE_PIECES`, `intervalle_relance_min_jours`, `relance.intervalle`) | Intervalle entre deux relances d un même interlocuteur | 5 | jours | démo DELAI_ENTRE_RELANCES | FR-47, FR-143, FR-184, FR-226 | `RESP` | `DT` | annuelle |
| `relance.sans_effet_max` (alias : `NOTIF_RELANCES_AVANT_ARBITRAGE`, `relances_sans_effet_max`, `relance.sans_effet`) | Relances sans effet avant proposition d arbitrage | 3 | relances | démo RELANCES_SANS_EFFET | FR-47, FR-143, FR-184, FR-226 | `RESP` | `DT` | annuelle |
| `muet.a_relancer_jours` | Dossier sans action : à relancer | 15 | jours | démo | FR-144 | `RESP` | `DT` | annuelle |
| `muet.a_surveiller_jours` (alias : `controle.silences`) | Dossier sans action : à surveiller [controle.silences couvre aussi muet.a_relancer_jours et muet.muet_jours] | 8 | jours | démo | FR-144, FR-210 | `RESP` | `DT` | annuelle |
| `muet.agent_sans_trace_jours` (alias : `TRACE_AGENT_SANS_TRACE`, `controle.agent_sans_trace`) | Agent sans trace d écriture | 10 | jours | démo | FR-13, FR-144, FR-210 | `RESP` | `DT` | annuelle |
| `muet.muet_jours` (alias : `pilotage.sans_action`) | Dossier sans action : muet | 30 | jours | démo | FR-144, FR-206 | `RESP` | `DT` | annuelle |
| `pieces.bloquante_jours` (alias : `pilotage.pieces_bloquantes`) | Pièce bloquante en attente = alerte | 30 | jours | démo JOURS_PIECES_BLOQUANTES | FR-145, FR-207 | `RESP` | `DT` | annuelle |
| `notif.alerte_offre_a_envoyer_heures` | Alerte au responsable avant la fin des 48 h d envoi de l offre | 24 | heures | *(défaut H-226)* | FR-146 | `RESP` | `DT` | annuelle |
| `notif.canal_defaut_assure` | Canal de notification par défaut de l assuré | SMS | canal | *(défaut H-227)* | FR-146 | `RESP` | `DT` | annuelle |
| `reglement.second_controle_seuil` | Seuil au-dessus duquel le `DG` est le second contrôle de l'ordre de règlement (en dessous : un second `CPT`) | 5 000 000 | FCFA | [A] | FR-7, FR-220, FR-222 | `CPT` | `RESP` | annuelle |
| `accord.double_enregistrement_seuil` | Seuil au-dessus duquel l'accord de l'assuré est enregistré par deux personnes | 3 000 000 | FCFA | [A] | FR-86, FR-90 | `CPT` | `RESP` | annuelle |
| `penalite.base` | Base de calcul de la pénalité de retard (offre, indemnité ou solde) ; libellé « estimation, base non validée » | montant de l'offre | liste | [A] à valider par le juriste | FR-14, FR-85, FR-102, FR-141 | `RESP` | `DT` | annuelle |
| `fraude.revue_delai` | Délai de revue d'un signal de fraude avant escalade au `DG` et à `AUD` | 3 | jour ouvré | [A] | FR-127, FR-130 | `AUD` | `DG` | semestrielle |
| `sans_suite.seuil_second_controle` | Seuil de provision au-dessus duquel un classement sans suite exige le second contrôle du `RESP` | 500 000 | FCFA | [A] | FR-123 | `CPT` | `RESP` | annuelle |
| `majeur.seuil` | Seuil de sinistre majeur (avis au réassureur, comité de suivi, rapports) | 20 000 000 | FCFA | [A] | FR-57a, FR-190 | `RESP` | `DT` | annuelle |
| `majeur.rapport_frequence` | Fréquence du rapport périodique d'un sinistre majeur | hebdomadaire | liste (quotidien, hebdomadaire) | [A] | FR-57a, FR-191 | `RESP` | `DT` | annuelle |
| `expertise.inspecteur_seuil_devis` | Devis au-dessus duquel un inspecteur technique est présent à l'expertise | vide (aucun seuil) | FCFA | [A] valeur de la compagnie étudiée par le mémoire de 2014, à confirmer | FR-59 | `RESP` | `DT` | annuelle |
| `expertise.photos_apres_reparation` | Photos après réparation exigées pour l'accord sur devis | vide (non exigées) | oui/non | [A] | FR-59 | `RESP` | `DT` | annuelle |
| `cloture.apres_dernier_reglement` | Clôture du dossier après le dernier règlement `PAYE` | 15 | jour | [A] mémoire de 2014 | FR-104, FR-142 | `RESP` | `DT` | annuelle |
| `pv.suivi_mois` | Suivi du procès-verbal d'accident corporel (nature « suivi », non réglementaire contre la compagnie) | 3 | mois | Code CIMA art. 230 | FR-141 | `RESP` | `DT` | annuelle |
| `exclusion.decision_soumise` | Décision d'exclusion soumise (le courrier de refus part sous 72 heures ouvrées, ou le retard est justifié 2 jours ouvrés) | 48 | heure ouvrée | [A] procédure du mémoire de 2014 | FR-121, FR-84, FR-102 | `RESP` | `DT` | annuelle |

### D.3 Modules propres à l'assurance (partie 3, §6)

Recherche, réclamations, pièces et archives (conservation par nature : jamais en dessous du plancher de D.5), experts et leurs budgets, contrats lus et provisions, échange avec le logiciel de la compagnie, pilotage et contrôle interne, reprise.

| code | libellé | défaut | unité | source | FR | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|---|---|
| `recherche.delai_max` (alias : `RECHERCHE_DELAI_P95`) | Délai maximal d'un résultat de recherche (95e centile) | 5 | secondes | plan D20 (v2, PO) | FR-23, FR-150 | `RESP` | `DT` | annuelle |
| `recherche.delai_vise` (alias : `RECHERCHE_DELAI_VISE`) | Délai visé d'un résultat de recherche | 1 | seconde | deck (cible non contractuelle) | FR-23, FR-150 | `RESP` | `DT` | annuelle |
| `recherche.longueur_min` | Longueur minimale d'un terme cherché | 3 | caractères | *(défaut H-228)* | FR-151 | `RESP` | `DT` | annuelle |
| `recherche.prefixe_min` | Longueur de mot à partir de laquelle la tolérance de fin de mot s'applique | 3 (mot de plus de 3 lettres) | lettres | démo (`rechercherDossiers`) | FR-151 | `RESP` | `DT` | annuelle |
| `fiche.telephone_visible` | Nombre de chiffres du téléphone visibles quand il est masqué | 2 | chiffres | *(défaut H-229)* | FR-153 | `RESP` | `DT` | annuelle |
| `ia.resume_delai_max` | Délai maximal du résumé d'un dossier de 40 pages | 5 | minutes | v2 « quelques minutes » *(défaut H-230)* | FR-154 | `RESP` | `DT` | annuelle |
| `reclamation.accuse_delai` | Délai d'accusé de réception d'une réclamation | 5 | jours | démo (`qualite-reclamations`) | FR-156 | `RESP` | `DT` | annuelle |
| `reclamation.escalade_delai` | Délai d'escalade d'une réclamation | 60 | jours | démo | FR-156 | `RESP` | `DT` | annuelle |
| `reclamation.fenetre_analyse` | Fenêtre d'analyse des réclamations récurrentes | 365 | jours | démo | FR-156 | `RESP` | `DT` | annuelle |
| `reclamation.recurrence_seuil` | Nombre de réclamations sur un même motif qui ouvre une ligne au plan d'action | 3 | réclamations | démo | FR-156 | `RESP` | `DT` | annuelle |
| `reclamation.reponse_delai` | Délai de réponse à une réclamation | 30 | jours | démo | FR-156 | `RESP` | `DT` | annuelle |
| `ged.antivirus` | Analyse antivirus avant enregistrement | oui (fournie par la compagnie) | oui/non | *(défaut H-231)* | FR-160 | `ARCH` | `RESP` | annuelle |
| `ged.formats_acceptes` | Types de fichiers acceptés | image/jpeg, image/png, image/webp, application/pdf | liste | démo (`fichiers-store`) | FR-160 | `ARCH` | `RESP` | annuelle |
| `ged.taille_max` | Taille maximale d'un fichier | 8 | Mo | démo | FR-160 | `ARCH` | `RESP` | annuelle |
| `ged.types_pieces` | Liste des types de pièces | 20 types de la démo (constat amiable, déclaration signée, certificats médicaux, rapport de police, carte grise, permis, devis, facture, RIB, certificat de décès, photos…) | liste | démo (`PieceType`) | FR-160 | `ARCH` | `RESP` | annuelle |
| `ged.pieces_recentes` | Fenêtre « arrivé aujourd'hui » de l'opérateur | 48 | heures | démo | FR-162 | `ARCH` | `RESP` | annuelle |
| `ocr.couche_texte_min` | Caractères par page en dessous desquels une page est traitée comme image | 60 | caractères | démo (`lecture-documents`) | FR-163 | `ARCH` | `RESP` | annuelle |
| `ocr.delai_page` | Délai maximal de lecture d'une page avant `ECHEC` | 2 | minutes | *(défaut H-232)* | FR-163 | `ARCH` | `RESP` | annuelle |
| `ocr.numerisation_dpi` | Résolution de numérisation conseillée | 300 | dpi | démo (consigne GED) | FR-163 | `ARCH` | `RESP` | annuelle |
| `ia.classement_seuil_bas` | Confiance en dessous de laquelle la proposition de classement n'est pas pré-sélectionnée | 0,60 | confiance (0-1) | *(défaut H-233)* | FR-164 | `RESP` | `DT` | annuelle |
| `ia.classement_seuil_haut` | Confiance au-dessus de laquelle la proposition est pré-sélectionnée (confirmation humaine quand même) | 0,90 | confiance (0-1) | *(défaut H-234)* | FR-164 | `RESP` | `DT` | annuelle |
| `ged.a_rattacher_delai` | Âge d'une pièce « à rattacher » qui lève une alerte | 3 | jours ouvrés | *(défaut H-235)* | FR-166 | `ARCH` | `RESP` | annuelle |
| `archive.format_numero` | Format du numéro d'archivage (AAAA = année de clôture ; CCCC = CORP, MATL, DIVR, RECS) | ARC-AAAA-CCCC-NNNNN | format | plan D17 ; démo | FR-167 | `ARCH` | `RESP` | annuelle |
| `archive.delai_versement` (alias : `dossier.delai_versement_jours`) | Délai de versement au fonds après clôture avant alerte | 75 | jours | démo (`DELAI_VERSEMENT_JOURS`) | FR-105, FR-168 | `ARCH` | `RESP` | annuelle |
| `archive.cm_par_boite` | Épaisseur d'une boîte | 10 | cm | démo | FR-170 | `ARCH` | `RESP` | annuelle |
| `archive.couleurs_chemise` | Couleur de chemise par branche | à fournir par la compagnie | liste | *(défaut H-236)* (mémoire, chap. V) | FR-170 | `ARCH` | `RESP` | annuelle |
| `archive.pages_par_boite` | Pages maximales par boîte | 2 500 | pages | démo (`archives-hub`) | FR-170 | `ARCH` | `RESP` | annuelle |
| `archive.verification_boite` | Périodicité de vérification physique d'une boîte | 12 | mois | *(défaut H-237)* | FR-170 | `ARCH` | `RESP` | annuelle |
| `archive.motifs_sortie` | Motifs de sortie d'archive | instruction, expertise, contentieux, contrôle interne, réclamation, contrôle de la CRCA | liste | démo (`MotifSortie`) | FR-171 | `ARCH` | `RESP` | annuelle |
| `archive.restitution_delai` (alias : `ARCH_RESTITUTION_JOURS`, `dossier.restitution_chemise_jours`) | Délai de restitution d'une chemise sortie | 15 | jours | démo (`JOURS_RESTITUTION`) ; plan D17 | FR-21, FR-107, FR-171 | `ARCH` | `RESP` | annuelle |
| `archive.restitution_escalade` | Âge d'une sortie non restituée qui alerte le RESP | 30 | jours | *(défaut H-238)* | FR-171 | `ARCH` | `RESP` | annuelle |
| `archive.papier_numerise_a_la_demande` | Numérisation du papier historique | à la demande (réouverture ou consultation) | règle | *(défaut H-239)* | FR-172 | `ARCH` | `RESP` | annuelle |
| `conservation.contentieux_recours` | Durée, contentieux, recours, litige | 10, conservation définitive | ans | démo | FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.corporel` | Durée, corporel | 10, conservation définitive | ans | démo | FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.fraude` | Durée, fraude suspectée | 10, conservation définitive | ans | démo | FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.materiel` | Durée, matériel (la démo met 5) | 10 | ans | plancher art. 404 ; *(défaut H-240)* | FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.mortel` (alias : `CONSERV_MORTEL`) | Durée, sinistre mortel | 30, conservation définitive | ans | démo (`referentiel-archives`) | FR-21, FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.pieces_comptables` | Durée, quittances, ordres, chèques | 10 | ans | démo | FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.risques_divers` | Durée, risques divers (la démo met 5) | 10 | ans | plancher art. 404 ; *(défaut H-241)* | FR-174 | `ARCH` | `RESP` | annuelle |
| `conservation.sans_suite_refuse` | Durée, classé sans suite ou refusé (la démo met 5) | 10 | ans | plancher art. 404 ; *(défaut H-242)* | FR-174 | `ARCH` | `RESP` | annuelle |
| `destruction.visas` (alias : `CONSERV_DESTRUCTION_VISA`) | Visas d'un bordereau de destruction | RESP puis DG | rôles | *(défaut H-243)* | FR-21, FR-175 | `ARCH` | `RESP` | annuelle |
| `ged.format_archive` | Format d'archive | PDF/A (l'image d'origine reste conservée) | format | *(défaut H-244)* | FR-176 | `ARCH` | `RESP` | annuelle |
| `nas.seuil_occupation` | Taux d'occupation du NAS qui alerte ADMIN | 80 | % | *(défaut H-245)* | FR-176 | `ARCH` | `RESP` | annuelle |
| `expert.domaines` | Domaines d'expertise | auto-matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation | liste | démo (`DomaineMission`) | FR-177 | `RESP` | `DT` | annuelle |
| `expert.agrement_alerte` | Alerte avant la fin d'agrément d'un expert | 60 | jours | *(défaut H-246)* | FR-178 | `RESP` | `DT` | annuelle |
| `expert.second_facteur` | Second facteur obligatoire pour le compte d'un cabinet externe (EXPE) | oui | oui/non | *(défaut H-247)* | FR-180 | `RESP` | `DT` | annuelle |
| `expert.visa_honoraires` | Rôles qui visent une note d'honoraires | RESP ou CPT | rôles | plan D8, démo | FR-182 | `RESP` | `DT` | annuelle |
| `expert.arrondi_poids` | Arrondi du poids d'une mission | 0,5 | point | démo | FR-183 | `RESP` | `DT` | annuelle |
| `expert.coef_gravite` | Coefficient de gravité du sinistre dans le poids de charge | léger 1 ; modéré 1 ; grave 1,3 ; mortel 1,6 | facteur | démo (`responsable-hub`) | FR-183 | `RESP` | `DT` | annuelle |
| `expert.disponible` | Taux de charge sous lequel un expert est « disponible » | 0,8 | × capacité | démo | FR-183 | `RESP` | `DT` | annuelle |
| `expert.echeances_rapports` | Fenêtres de l'échéancier des rapports dus | 7 et 15 | jours | démo | FR-183 | `RESP` | `DT` | annuelle |
| `expert.poids_domaine` | Poids d'une mission par domaine (grille de charge) | à fournir par la compagnie | points | démo (grille paramétrable) *(défaut H-248)* | FR-183 | `RESP` | `DT` | annuelle |
| `expert.surcharge` | Taux de charge qui rend un expert « surchargé » | 1,2 | × capacité | démo | FR-183 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.auto_materiel` (alias : `DELAI_RAPPORT_EXPERT`, `delai_rapport_expert_jours`) | Délai de rapport attendu, auto-matériel [l'alias delai_rapport_expert_jours couvre les huit domaines (expert.delai_rapport.*)] | 7 | jours | démo ; mémoire (7 à 10 j) | FR-14, FR-68, FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.batiment` | Délai de rapport attendu, bâtiment | 21 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.fraude` | Délai de rapport attendu, fraude | 30 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.incendie` | Délai de rapport attendu, incendie | 21 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.medical` | Délai de rapport attendu, médical | 21 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.perte_exploitation` | Délai de rapport attendu, perte d'exploitation | 30 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.responsabilite` | Délai de rapport attendu, responsabilité | 14 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.delai_rapport.transport` | Délai de rapport attendu, transport | 14 | jours | démo | FR-184 | `RESP` | `DT` | annuelle |
| `expert.budget_arrondi` (alias : `arrondi_budget_fcfa`) | Arrondi du budget indicatif | 5 000 | FCFA | démo | FR-68, FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_coef_type` (alias : `budget_coefficient_type`) | Coefficient du budget par type de mission | initiale 1 ; complémentaire 0,5 ; contradictoire 1,5 ; contre-expertise 1,5 | facteur | démo | FR-66, FR-68, FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_part_enjeu` (alias : `budget_part_enjeu_pct`) | Part de l'enjeu ajoutée au socle du domaine | 2 | % | démo | FR-68, FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_plafond` (alias : `budget_plafond_fcfa`) | Plafond du budget indicatif d'une mission | 1 200 000 | FCFA | démo | FR-68, FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.auto_materiel` (alias : `budget_socle_domaine_fcfa`) | Socle du budget, auto-matériel (à remplacer par le tarif de la compagnie) [l'alias budget_socle_domaine_fcfa couvre les huit domaines (expert.budget_socle.*)] | 45 000 | FCFA | démo | FR-68, FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.batiment` | Socle du budget, bâtiment | 150 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.fraude` | Socle du budget, fraude | 250 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.incendie` | Socle du budget, incendie | 200 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.medical` | Socle du budget, médical | 120 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.perte_exploitation` | Socle du budget, perte d'exploitation | 300 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.responsabilite` | Socle du budget, responsabilité | 75 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `expert.budget_socle.transport` | Socle du budget, transport | 120 000 | FCFA | démo | FR-185 | `RESP` | `DT` | annuelle |
| `assurance.table_garanties` (alias : `table_type_sinistre_garanties`) | Table type de sinistre vers garanties qui répondent | table de la démo (16 codes de garantie) | table | démo (`garanties-hub`) ; plan (table en paramètre) | FR-41, FR-187 | `RESP` | `DT` | annuelle |
| `garantie.decisions` | Décisions de garantie possibles | GARANTIE_ACQUISE, SOUS_RESERVE, REFUS_DE_GARANTIE | liste | plan D4 | FR-187 | `RESP` | `DT` | annuelle |
| `provision.ancienne` | Ancienneté d'une provision dite « ancienne » | 365 | jours | démo | FR-188 | `RESP` | `DT` | annuelle |
| `provision.ecart_estimation` (alias : `provision_ecart_estimation_pct`) | Écart provision / estimation qui classe « à revoir » | 15 | % | démo (`ECART_PROVISION`) | FR-76, FR-188 | `RESP` | `DT` | annuelle |
| `provision.ecart_validation` (alias : `revision_provision_attente_resp_fcfa`, `sortie.ecart_provision_attente_responsable`) | Écart de révision de provision qui attend le RESP | 2 000 000 | FCFA | plan D12 ; démo | FR-76, FR-124, FR-188 | `RESP` | `DT` | annuelle |
| `provision.grille_ouverture` (alias : `grille_provision_ouverture`) | Grille de provision d'ouverture par volet et gravité (milieu de tranche) | grilles de la démo (4 barèmes en tranches) | table | démo (`BAREMES`) ; plan D15 | FR-49, FR-188 | `RESP` | `DT` | annuelle |
| `provision.motifs` | Motifs de mouvement de provision | ouverture, rapport d'expertise, devis de réparation, certificat médical, rapport de police, barème appliqué, validation hiérarchique, régularisation, clôture | liste | démo (`MotifProvision`) | FR-188 | `RESP` | `DT` | annuelle |
| `provision.sans_mouvement` (alias : `provision_sans_mouvement_jours`) | Ancienneté sans mouvement de provision qui alerte | 90 | jours | démo (`exercices-hub`) | FR-76, FR-188 | `RESP` | `DT` | annuelle |
| `ibnr.source` | Estimation des sinistres survenus non déclarés | hors Prospera (colonne renseignée ou importée) | règle | art. 334-12 (SÛR) ; *(défaut H-249)* | FR-189 | `RESP` | `DT` | annuelle |
| `reassurance.traites_demo` | Traités du jeu de démonstration, millésime 2026 | excédent automobile 12 M xs 3 M ; quote-part incendie/MRH 40 % ; quote-part transport 55 % ; excédent RC 20 M xs 2 M ; quote-part accident individuel 30 % ; excédent risques divers 10 M xs 2,5 M | FCFA ; % | démo (jeu de démonstration seulement) | FR-190 | `RESP` | `DT` | annuelle |
| `reassurance.traites_demo_2025` | Traités du jeu de démonstration, millésime 2025 | excédent automobile 10 M xs 2,5 M ; quote-part incendie/MRH 35 % ; quote-part transport 50 % | FCFA ; % | démo (jeu de démonstration seulement) | FR-190 | `RESP` | `DT` | annuelle |
| `coassurance.somme_parts` | Somme des parts d'une clé de coassurance | 100 | % | démo | FR-191 | `RESP` | `DT` | annuelle |
| `etat_crca.seuil_grande_ampleur` | Seuil du drapeau « grande ampleur non clôturé » | à fixer avec la compagnie | FCFA | art. 422 (C10d) ; *(défaut H-250)* | FR-192 | `RESP` | `DT` | annuelle |
| `compta.table_comptes` | Table nature d'opération vers compte | table de la démo, à remplacer par le plan de comptes de la compagnie | table | démo (`arrete-comptable`) | FR-193 | `RESP` | `DT` | annuelle |
| `echange.sans_confirmation` | Délai au-delà duquel un envoi sans confirmation du LC alerte | 24 | heures | transposé de la microfinance *(défaut H-251)* | FR-196 | `ADMIN` | `RESP` | à chaque changement de LC |
| `declaration.format_reference` | Format de la référence de déclaration | DEC-AAAA-NNNNN | format | plan D3 | FR-198 | `RESP` | `DT` | annuelle |
| `sinistre.format_numero` | Format du numéro quand Prospera l'attribue | SIN-AAAA-NNNN | format | démo *(défaut H-252)* | FR-198 | `RESP` | `DT` | annuelle |
| `sinistre.longueur_numero_max` | Longueur maximale d'un numéro officiel reçu du LC | 40 | caractères | *(défaut H-253)* | FR-198 | `RESP` | `DT` | annuelle |
| `echange.saisie_delai` | Âge d'une ligne « à saisir » (hors déclaration) qui alerte | 72 | heures | transposé de la microfinance *(défaut H-254)* | FR-199 | `ADMIN` | `RESP` | à chaque changement de LC |
| `echange.age_max_ouverture` (alias : `liaison.age_max`, `age_max_lecture_contrats`, `LC_AGE_MAX_LECTURE_INTERFACE`, `LC_AGE_MAX_LECTURE_FICHIER`) | Âge maximal de la lecture d'une police pour ouvrir sans décision motivée (au-delà : « à relire », jamais un refus) | 5 minutes (interface) ; 24 heures (fichiers) | minutes ; heures | *(défaut H-255)* | FR-3, FR-41, FR-201 | `ADMIN` | `RESP` | à chaque changement de LC |
| `echange.fraicheur_api` (alias : `assurance.fraicheur_lecture`) | Fraîcheur par défaut avec une API [l'alias assurance.fraicheur_lecture couvre aussi echange.fraicheur_fichier] | 5 | minutes | transposé de la microfinance *(défaut H-256)* | FR-186, FR-201 | `ADMIN` | `RESP` | à chaque changement de LC |
| `echange.fraicheur_fichier` | Fraîcheur par défaut avec des fichiers | à l'heure ou de nuit (avant 6 h) | — | transposé de la microfinance *(défaut H-257)* | FR-201 | `ADMIN` | `RESP` | à chaque changement de LC |
| `echange.perime_facteur` | Facteur de fraîcheur au-delà duquel une donnée est « périmée » | 2 | × fraîcheur | transposé de la microfinance *(défaut H-258)* | FR-201 | `ADMIN` | `RESP` | à chaque changement de LC |
| `fictif.delai_numero` | Délai simulé d'attribution du numéro par le LC fictif | 5 | secondes | *(défaut H-259)* | FR-203 | `ADMIN` | `RESP` | à chaque changement de LC |
| `brief.heure` | Heure de production du brief du matin | 07:00 | heure | *(défaut H-260)* | FR-208 | `RESP` | `DT` | annuelle |
| `veille.cheque_non_retire` | Ancienneté d'un chèque non retiré qui alerte | 14 | jours | démo | FR-208 | `RESP` | `DT` | annuelle |
| `veille.delai_restant` | Délai restant en dessous duquel un dossier inactif est critique | 2 | jours | démo (`surveillerPortefeuille`) | FR-208 | `RESP` | `DT` | annuelle |
| `veille.ecart_provision` | Écart provision / estimation d'expert qui lève une alerte | 30 | % | démo | FR-208, FR-209 | `RESP` | `DT` | annuelle |
| `veille.inactivite` | Inactivité qui rend critique un dossier à délai proche | 5 | jours | démo | FR-208 | `RESP` | `DT` | annuelle |
| `qualite.declaration_tardive` | Retard de déclaration qui lève un constat certain | 30 | jours | démo (`analyserCoherence`) | FR-209 | `RESP` | `DT` | annuelle |
| `qualite.provision_haute` | Provision supérieure à l'estimation avant expertise qui lève un constat | 150 | % | démo | FR-209 | `RESP` | `DT` | annuelle |
| `controle.amplitude` | Amplitude forte d'un dossier | 25 % ou 1 000 000 | % ; FCFA | démo | FR-210 | `RESP` | `DT` | annuelle |
| `controle.echantillon` | Taille de l'échantillon de revue par période | 12 | dossiers | démo (`audit-sensibles`) | FR-210 | `RESP` | `DT` | annuelle |
| `controle.sensible_ecart` | Écart évaluation / provision d'un dossier sensible | 500 000 et 1,5 fois | FCFA ; facteur | démo (`dossiers-sensibles`) | FR-210 | `RESP` | `DT` | annuelle |
| `crca.lot_delai` | Temps de production d'un dossier de contrôle de 100 dossiers | 30 | minutes | *(défaut H-261)* | FR-211 | `RESP` | `DT` | annuelle |
| `pilotage.actualisation` | Actualisation maximale des indicateurs | 5 | minutes | *(défaut H-262)* | FR-212 | `RESP` | `DT` | annuelle |
| `pilotage.aging_tranches` | Tranches d'ancienneté du stock actif | 7 ; 8-30 ; 31-90 ; plus de 90 | jours | démo (`controle-responsable`) | FR-213 | `RESP` | `DT` | annuelle |
| `reprise.fichiers_conservation` | Conservation des fichiers d'un lot courant après import réussi | 30 | jours | PRD Reprise FR-3 | FR-214 | `ARCH` | `RESP` | annuelle |
| `reprise.sources_jour1` | Sources lues au premier jour | fichiers Excel, CSV, JSON ; API quand la source en offre une | liste | PRD Reprise FR-1 ; plan D17 *(défaut H-263)* | FR-214 | `ADMIN` | `DG` | à chaque lot |
| `reprise.historique_cible` (alias : `IA_HISTORIQUE_MAX`) | Objectif de profondeur d'historique pour l'IA | 3 à 5 | ans | v2 *(défaut H-264)* | FR-215, FR-231 | `ADMIN` | `DG` | à chaque lot |
| `reprise.historique_min` (alias : `IA_HISTORIQUE_MIN`) | Profondeur d'historique en dessous de laquelle le rapport avertit | 3 | ans | PRD Reprise FR-9 | FR-215, FR-231 | `ADMIN` | `DG` | à chaque lot |
| `reprise.bascule_dossier` | Moment où un dossier devient « tenu par Prospera » | première action de dossier dans Prospera | règle | *(défaut H-265)* | FR-217 | `ADMIN` | `DG` | à chaque lot |
| `reprise.fin_parallele` | Date de fin du parallèle | fixée par la compagnie à la mise en service | date | PRD Reprise FR-17 *(défaut H-266)* | FR-217 | `ADMIN` | `DG` | à chaque lot |
| `reprise.resync_frequence` | Fréquence de la resynchronisation pendant le parallèle | chaque nuit | — | plan D17 | FR-217 | `ADMIN` | `DG` | à chaque lot |
| `reprise.resync_heure` | Heure limite de la resynchronisation nocturne | avant 6 h | heure | transposé de la microfinance *(défaut H-267)* | FR-217 | `ADMIN` | `DG` | à chaque lot |
| `reprise.valeurs_controle` | Valeurs de contrôle du feu vert | nombre de sinistres ouverts ; somme des provisions des sinistres ouverts ; nombre de polices en vigueur ; nombre de pièces rattachées | liste | *(défaut H-268)* | FR-218 | `ADMIN` | `DG` | à chaque lot |
| `honoraires.tolerance_budget` | Tolérance de dépassement du budget d'une mission : au-delà, le visa est bloqué | 10 | % | [A] | FR-90, FR-182, FR-185 | `RESP` | `DT` | annuelle |
| `rapport.validation_delai` | Délai de validation du rapport d'expert par le gestionnaire | 72 | heure | [A] mémoire de 2014, à confirmer | FR-68, FR-184 | `RESP` | `DT` | annuelle |
| `expert.carence_info` | Information écrite du retard d'un expert | 45 | jour | [A] mémoire de 2014, à confirmer | FR-68 | `RESP` | `DT` | annuelle |
| `expert.carence_pv` | Procès-verbal de carence d'un expert | 75 | jour | [A] mémoire de 2014, à confirmer | FR-68 | `RESP` | `DT` | annuelle |
| `honoraires.paiement_delai` | Paiement des honoraires après réception du rapport | 30 | jour | [A] mémoire de 2014 | FR-142, FR-182 | `RESP` | `DT` | annuelle |
| `boni_mali.seuil` | Seuil significatif du boni et du mali de liquidation | 250 000 | FCFA | [A] | FR-189 | `RESP` | `DT` | annuelle |
| `numerisation.cout_page` | Coût de numérisation d'une page (paramètre de pilotage, pas une règle du circuit) | 45 | FCFA par page | [A] démo | FR-170 | `ARCH` | `RESP` | annuelle |
| `revue_mensuelle.delai` | Délai d'alerte quand la revue mensuelle des dossiers vivants n'est pas faite | M+5 | jour | [A] mémoire de 2014 | FR-210 | `RESP` | `DT` | annuelle |
| `etat_hebdo.jour_heure` | Jour et heure de génération de l'état hebdomadaire des déclarations | à fixer avec la compagnie | jour, heure | [A] | FR-206 | `RESP` | `DT` | annuelle |

#### D.3.1 Formats de numéros

Chaque préfixe, chaque année et chaque longueur de séquence sont **paramétrables** (FR-167). Un numéro n'est jamais réutilisé.

| préfixe | objet | format par défaut | source | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|
| `DEC-` | référence de déclaration | `DEC-AAAA-NNNNN` | PO ; FR-198 | `ADMIN` | `RESP` | annuelle |
| `ARC-` | numéro d'archivage | `ARC-AAAA-CCCC-NNNNN` | FR-167 | `ARCH` | `RESP` | annuelle |
| `PRO-` | numéro de sinistre attribué par Prospera (quand il attribue) | `PRO-SIN-AAAA-NNNN` `[A]` | FR-198 | `ADMIN` | `RESP` | à chaque basculement |
| `QUI-` | quittance | `QUI-AAAA-Dnnnn` | démo | `CPT` | `RESP` | annuelle |
| `ORD-` | ordre de règlement | `ORD-AAAA-NNNNN` `[A]` | démo (à confirmer) | `CPT` | `RESP` | annuelle |
| `REC-` | recours | `REC-AAAA-NNNN` | démo | `RESP` | `DT` | annuelle |
| `CRE-` | créance | `CRE-AAAA-NNNNN` | démo | `RESP` | `DT` | annuelle |
| `MED-` | mise en demeure | `MED-AAAA-NNNN` | démo | `RESP` | `DT` | annuelle |
| `CTX-` | contentieux | `CTX-AAAA-NNNN` | démo | `RESP` | `DT` | annuelle |
| `ENC-` | encaissement de recours | `ENC-AAAA-NNNN` | démo | `CPT` | `RESP` | annuelle |
| `CRR-` | courrier | `CRR-AAAA-NNNN` | démo | `RESP` | `DT` | annuelle |
| `LM-` | lettre de mission d'un expert | `LM-AAAA-NNNN` `[A]` | démo (à confirmer) | `RESP` | `DT` | annuelle |

#### D.3.2 Catalogue des modèles de courrier

Chaque modèle est paramétrable et versionné (FR-4). Les mentions légales du corporel sont une **liste de départ** *(point juridique J-29 : à valider par le juriste, §13.2)*. Les paramètres du sinistre majeur (`majeur.seuil`, `majeur.rapport_frequence`), de l'expertise (`expertise.inspecteur_seuil_devis`, `expertise.photos_apres_reparation`) et du rapport (`rapport.validation_delai`, `expert.carence_info`, `expert.carence_pv`) sont dans D.2 et D.3.

| code | modèle | FR | mentions légales obligatoires au corporel | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|
| `COURRIER_ACCUSE` | accusé de déclaration | FR-36 | référence `DEC-`, date de réception | `RESP` | `DT` | annuelle |
| `COURRIER_PIECES` | demande de pièces | §5.2 | liste des pièces ; effet de la réponse incomplète sur les délais (art. 249 à 251) | `RESP` | `DT` | annuelle |
| `COURRIER_OFFRE` | offre (provisionnelle ou définitive) | FR-84 | montants poste par poste ; délai de dénonciation de 15 jours (art. 235) ; délai de paiement ; pénalité de retard (art. 233, 236) | `RESP` | `DT` | annuelle |
| `COURRIER_REFUS` | refus de garantie ou de prise en charge | FR-121, FR-122 | motif légalement exigé (procédure d'information à fixer par le juriste, FR-125) | `RESP` | `DT` | annuelle |
| `COURRIER_RELANCE` | relance (pièces, accord, retrait du chèque) | FR-146 | sans objet | `RESP` | `DT` | annuelle |
| `COURRIER_CONVOCATION_MEDICALE` | convocation d'expertise médicale | FR-63 | préavis d'au moins 15 jours avant l'examen (art. 244) | `RESP` | `DT` | annuelle |
| `COURRIER_CONVOCATION_MATERIELLE` | convocation d'expertise matérielle | FR-61 | sans objet | `RESP` | `DT` | annuelle |
| `COURRIER_MISE_EN_DEMEURE` | mise en demeure (recours) | FR-114 | preuve de réception par un moyen listé en paramètre | `RESP` | `DT` | annuelle |
| `COURRIER_GARANTIE_FRAIS_MEDICAUX` | lettre de garantie de frais médicaux | FR-70 | dans les tarifs (art. 258) | `RESP` | `DT` | annuelle |
| `COURRIER_FGA` | courrier au fonds de garantie automobile (si `FGA_ACTIF`) | FR-111 | délais des art. 605, 606 et 608 | `RESP` | `DT` | annuelle |
| `COURRIER_LETTRE_MISSION` | lettre de mission d'un expert (`LM-`) | FR-180 | sans objet | `RESP` | `DT` | annuelle |

#### D.3.3 Motifs codés vers le LC (liste fermée)

Tout message vers le LC porte un motif de cette liste, jamais un texte libre (FR-196, annexe C). Aucun motif ne porte de donnée de santé. La liste est une **liste de départ fermée** *(défaut H-269 : à confirmer à la séance d'immersion)* ; un ajout est une modification de paramètre, validée par `RESP` et `DT`.

| message (annexe C) | motifs codés | propriétaire | validateur | revue |
|---|---|---|---|---|
| C-14 évaluation et provision | `OUVERTURE`, `RAPPORT_EXPERTISE`, `DEVIS_REPARATION`, `CERTIFICAT_MEDICAL`, `RAPPORT_POLICE`, `BAREME_APPLIQUE`, `VALIDATION`, `REGULARISATION`, `CLOTURE` | `RESP` | `DT` | annuelle |
| C-17 rejet | `GARANTIE_NON_ACQUISE`, `POLICE_NON_EN_VIGUEUR`, `HORS_DELAI_DECLARATION`, `EXCLUSION_CONTRAT`, `DECISION_RESPONSABLE` | `RESP` | `DT` | annuelle |
| C-17 classement sans suite | `PIECES_NON_FOURNIES`, `ASSURE_SANS_REPONSE` | `RESP` | `DT` | annuelle |
| C-17 clôture | `REGLE_SOLDE`, `ABANDON` | `RESP` | `DT` | annuelle |
| C-17 réouverture | `ELEMENT_NOUVEAU`, `RECOURS_ENGAGE` | `RESP` | `DT` | annuelle |

### D.4 Modules partagés, IA et installation (partie 4, §7)

Paiement, notification, IA commune, installation, relais, support. Les valeurs reprises du PRD microfinance sont des *(défaut H-270)*.

| code | libellé | défaut | unité | source | FR | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|---|---|
| `PAIEMENT_DELAI_COUPURE` | Heure limite de validation d'un virement selon la banque | à saisir par banque | heure | [A] | FR-222 | `ADMIN` | `DG` | annuelle |
| `IA_CONSENTEMENT_ECARTS` | Envoi d'écarts anonymisés à l'IA commune | non (tant que la compagnie n'a pas consenti) | oui/non | décision PO, plan D1 | FR-230, FR-232 | `ADMIN` | `DG` | annuelle |
| `IA_NIVEAU_APPRENTISSAGE` | Niveau d'apprentissage choisi par la compagnie | celui que le PRD moteur ouvre | liste | PRD moteur | FR-230 | `ADMIN` | `DG` | annuelle |
| `IA_RAPPORT_PERIODE` | Période du rapport de performance de l'IA | 1 | mois | proposition v2 | FR-231 | `ADMIN` | `DG` | annuelle |
| `IA_REENTRAINEMENT_PERIODE` | Période de réentraînement | 1 | mois | proposition v2 | FR-231 | `ADMIN` | `DG` | annuelle |
| `IA_ECARTS_SANTE` | Envoi d'écarts issus d'une donnée de santé | jamais | — | décision PO (aucune donnée médicale ne sort) | FR-232 | `ADMIN` | `DG` | annuelle |
| `CORRECTIF_SECURITE_DELAI` | Délai d'acceptation d'un correctif de sécurité critique | 72 | heures | [A] modèle microfinance | FR-235 | `ADMIN` | `DG` | annuelle |
| `COUPURE_MAJ_MAX` | Coupure maximale d'une mise à jour | 15 | minutes | PRD moteur NFR-9 | FR-235 | `ADMIN` | `DG` | annuelle |
| `GEL_SANS_CONTACT` | Gel après absence de contact avec Money Vibes | 30 | jours | PRD moteur FR-15 [A] | FR-235 | `ADMIN` | `DG` | annuelle |
| `RESTAURATION_TEST_PERIODE` (alias : `nas.test_restauration`) | Période du test de restauration | 1 | mois | [A] modèle microfinance | FR-176, FR-236 | `ADMIN` | `DG` | annuelle |
| `rpo` (alias : `RPO`) | Perte maximale de données | 1 | heure | spine du moteur AD-16 | FR-23, FR-236 | `ADMIN` | `DG` | annuelle |
| `rto` (alias : `RTO`) | Durée maximale de reprise | 4 | heure | spine du moteur AD-16 | FR-23, FR-236 | `ADMIN` | `DG` | annuelle |
| `SAUVEGARDE_FREQUENCE` (alias : `nas.sauvegarde`) | Fréquence de la sauvegarde automatique | 1 | jour | proposition v2 | FR-176, FR-236 | `ADMIN` | `DG` | annuelle |
| `ADMIN_DEUX_PERSONNES` | Création d'un administrateur ou d'un droit d'instance par deux personnes | oui | oui/non | [A] modèle microfinance | FR-238 | `ADMIN` | `DG` | annuelle |
| `RELAIS_INTERROGATION` | Fréquence d'interrogation du relais | 1 | minute | [A] modèle microfinance | FR-239 | `ADMIN` | `DG` | annuelle |
| `RELAIS_PURGE` | Purge d'un événement du relais après tirage | 7 | jours | [A] modèle microfinance | FR-239 | `ADMIN` | `DG` | annuelle |
| `DISPONIBILITE_CIBLE` | Objectif de disponibilité en temps ouvré (sans engagement) | 99,5 | % | [A] modèle microfinance | FR-246 | `ADMIN` | `DG` | annuelle |
| `SUPPORT_PRISE_EN_CHARGE_BLOQUANTE` | Prise en charge d'une anomalie bloquante | 4 | heures ouvrées | proposition v2, offre v4 | FR-246 | `ADMIN` | `DG` | annuelle |
| `fiche.ouverture_p95` | Ouverture de la fiche du dossier (95e centile) | 3 | seconde | [A] valeur provisoire, à confirmer avec le test de FR-23 | FR-250 | `ADMIN` | `DG` | annuelle |
| `ocr.lot50` | Lecture par l'OCR d'un lot de 50 pages | 10 | minute | [A] valeur provisoire, à confirmer avec le test de FR-23 | FR-250, FR-163 | `ADMIN` | `DG` | annuelle |
| `resync.fin` | Fin de la resynchronisation nocturne, au volume de FR-23 | avant 6 | heure | [A] valeur provisoire, à confirmer avec le test de FR-23 | FR-250, FR-217 | `ADMIN` | `DG` | annuelle |
| `formation.*` | Formation par profil (sessions, durées), documentation d'usage par rôle, aide en ligne, accompagnement sur site | à confirmer avec la compagnie | sessions ; heures | [A] | FR-240 | `ADMIN` | `DG` | annuelle |

### D.5 Référentiel légal (non modifiable par la compagnie)

Valeurs du Code CIMA (texte lu, SÛR) et de la réglementation. La compagnie **ne les modifie pas** : un correctif est livré comme mise à jour de référentiel, versionné avec date d'effet (FR-14, FR-235) ; un dossier est jugé selon la version en vigueur à sa date de survenance. Seules la valeur du SMIG daté et les tables du barème corporel se saisissent, avec leur source et une double saisie (FR-70). Plancher de conservation : art. 404 du Code CIMA.

| code | libellé | défaut | unité | source | FR | propriétaire | validateur | revue |
|---|---|---|---|---|---|---|---|---|
| `FGA_ACTIF` (alias : `recours.fga_active`) | Un fonds de garantie automobile existe-t-il au Togo | non | oui/non | [A] existence non confirmée | FR-14, FR-111 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `REF_PRESCRIPTION_CONTRAT` (alias : `recours.prescription_jours`) | Prescription de l'action dérivant du contrat (terme à vérifier) | 2 | ans | Code CIMA art. 28 (SÛR), non modifiable | FR-14, FR-118 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `REF_PRESCRIPTION_RC` | Prescription de l'action en responsabilité civile (terme à vérifier) | 5 | ans | Code CIMA art. 256 (SÛR), non modifiable | FR-14 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `plancher_delai_declaration` | Plancher légal du délai de déclaration : 5 jours ouvrés ; 48 heures pour le vol (RÈGLEMENTAIRE, art. 12-4° et 20) | 5 ; 48 h | jour ouvré ; heure | CIMA | FR-43 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `delai_rapport_medical_jours` | Transmission du rapport médical après l'examen (RÈGLEMENTAIRE, art. 245) | 20 | jour | CIMA | FR-63 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `preavis_convocation_examen_jours` | Préavis minimal de convocation à l'examen médical (RÈGLEMENTAIRE, art. 244) | 15 | jour | CIMA | FR-63 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `qualification_expert` | Qualification exigée (RÈGLEMENTAIRE, art. 272) : expert judiciaire inscrit, ou diplômes appropriés, ou 5 ans d'activité | 5 | ans | CIMA | FR-63 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `delai_creance_tiers_payeur_mois` | Délai de production de la créance d'un tiers payeur avant déchéance (RÈGLEMENTAIRE, art. 254-255) | 6 | mois | CIMA | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `avis_juge_tutelles_jours` (alias : `reglement.avis_tutelle_jours`) | Avis au juge des tutelles avant paiement à un représentant légal (RÈGLEMENTAIRE, art. 234) | 15 | jour | CIMA | FR-86, FR-91 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.arbitrage_sentence_mois` | Arbitrage entre assureurs : sentence dans | 1 | mois | Code CIMA art. 276 (SÛR) | FR-119, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.demande_motivee_jours` (alias : `REF_DELAI_DEMANDE_MOTIVEE`, `delai_reponse_demande_motivee_jours`) | Réponse à la demande motivée de la victime (RÉGLEMENTAIRE) | 30 | jours | Code CIMA art. 231 al. 7 (SÛR) | FR-14, FR-85, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.denonciation_jours` (alias : `REF_DELAI_DENONCIATION`, `delai_denonciation_transaction_jours`) | Dénonciation de la transaction (RÉGLEMENTAIRE) | 15 | jours | Code CIMA art. 235 (SÛR) | FR-14, FR-82, FR-86, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.etranger_mois` | Victime résidant à l étranger : prorogation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 253 (SÛR) | FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.expert_commun_mois` | Expert commun : prorogation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 252, 252 bis (SÛR) | FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.fga_exception_garantie_mois` (alias : `legal.fga_declaration_mois`, `FGA_DELAI_DECLARATION`) | FGA : déclaration au fonds dans les 3 mois, **seulement quand une exception de garantie est invoquée** (si FGA activé ; « auteur inconnu ou non assuré » relève des art. 605 et 606) | 3 | mois | Code CIMA art. 608 (SÛR) | FR-14, FR-111, FR-121, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.fga_pv_jours` | FGA : procès-verbal transmis dans (si FGA activé) | 60 | jours | Code CIMA art. 606 (SÛR) | FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.fga_transaction_mois` | FGA : notification d une transaction avec un responsable non assuré | 1 | mois | Code CIMA art. 605 (SÛR) | FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.nouvelle_demande_mois` | Réponse incomplète : nouvelle demande dans (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 251 (SÛR) | FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.offre_corporel_mois` (alias : `REF_DELAI_OFFRE_ACCIDENT`, `delai_offre_corporel_mois`) | Offre corporel automobile depuis l accident (RÉGLEMENTAIRE, non modifiable) | 12 | mois | Code CIMA art. 231 (SÛR) | FR-14, FR-85, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.offre_deces_mois` (alias : `REF_DELAI_OFFRE_DECES`, `delai_offre_deces_mois`) | Offre aux ayants droit depuis le décès (RÉGLEMENTAIRE) | 8 | mois | Code CIMA art. 231, 265-266 (SÛR) | FR-14, FR-85, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.offre_definitive_mois` (alias : `REF_DELAI_OFFRE_APRES_CONSOLIDATION`) | Offre définitive après information de consolidation (RÉGLEMENTAIRE) | 6 | mois | Code CIMA art. 231 al. 5 (SÛR) | FR-14, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.paiement_apres_denonciation_mois` (alias : `REF_DELAI_PAIEMENT_APRES_DENONCIATION`) | Paiement des sommes convenues après la fin de la dénonciation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 235 (SÛR) | FR-14, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.penalite_pct_par_mois` (alias : `REF_PENALITE_RETARD`, `penalite_retard_pct_mois`) | Intérêt de retard (offre tardive, paiement tardif) (RÉGLEMENTAIRE) | 5 | % par mois | Code CIMA art. 233, 236 (SÛR) | FR-14, FR-85, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.provisionnelle_mois` (alias : `REF_CONSOLIDATION_INFO`, `delai_consolidation_mois`) | Consolidation non connue : offre provisionnelle possible à partir de (RÉGLEMENTAIRE) | 6 | mois | Code CIMA art. 231 al. 5 (SÛR) | FR-14, FR-85, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.suspension_avis_mois` (alias : `suspensions_delai_offre`) | Assureur non avisé : suspension à l expiration d un mois (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 247 (SÛR) | FR-85, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `legal.suspension_pieces_semaines` (alias : `REF_SUSPENSION_PIECES`) | Pièces non reçues : suspension après (RÉGLEMENTAIRE) | 6 | semaines | Code CIMA art. 249-250 (SÛR) | FR-14, FR-141 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `bareme_medical_ip` | Barème médical d'incapacité permanente (annexe du Livre II) | à numériser | table | CIMA (D21) | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `echelle_souffrance_esthetique` | Échelle de souffrance et de préjudice esthétique en % du SMIG annuel (art. 262) : très léger 5 ; léger 10 ; modéré 20 ; moyen 40 ; assez important 60 ; important 100 ; très important 150 ; exceptionnel 300 | valeurs du Code | % du SMIG annuel | CIMA | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `moral_deces_pct_smig` | Préjudice moral par bénéficiaire du décès (art. 266) : conjoint 150 ; enfant mineur 100 ; enfant majeur 75 ; ascendant 75 ; frère ou sœur 50 | valeurs du Code | % du SMIG annuel | CIMA | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `plafonds_corporel_multiples_smig` | Plafonds en multiples du SMIG annuel (RÈGLEMENTAIRES, art. 259 à 266) : incapacité temporaire mensuelle 6 ; préjudice économique d'incapacité permanente 10 (si taux ≥ 50 %) ; préjudice moral 2 (si taux ≥ 80 %) ; gains futurs 36 ; frais funéraires 2 ; ayants droit du décédé 85 au total ; moral des bénéficiaires du décès 20 au total ; tierce personne 50 % de l'incapacité (si taux ≥ 80 %) | valeurs du Code | multiple | CIMA | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `smig_annuel_multiplicateur` | SMIG annuel = mensuel x | 12 | mois | [A] | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `smig_togo_mensuel` | SMIG du Togo, paramètre daté (pays de l'accident) ; **SMIG du pays de résidence s'il est plus élevé** (question au §13.2) | 52 500 depuis le 01/01/2023 (PROBABLE, sources secondaires) | FCFA par mois | CIMA (principe), [A] (valeur) | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `table_conversion_rentes` | Table de conversion des rentes | à saisir | table | CIMA (D21) | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `table_repartition_ayants_droit` | Clés de répartition entre ayants droit (art. 265) | à saisir (valeurs lisibles partiellement, à valider) | table | CIMA (D21) | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `table_valeur_point_ipp` | Valeur du point d'incapacité permanente par taux et par âge (art. 260) | à saisir depuis l'image du PDF officiel, double saisie | table | CIMA (D21) | FR-70 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `conservation.depart` | Point de départ de la durée | date de clôture | règle | démo ; *(défaut H-271)* (juriste, point 11) | FR-174 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `conservation.plancher` (alias : `CONSERV_DOSSIER_DEFAUT`, `dossier.conservation_ans`) | Durée minimale de conservation | 10 | ans | art. 404 (SÛR) ; plan D17 | FR-21, FR-105, FR-174 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |
| `referentiel.mise_a_jour` | Mise à jour du référentiel légal (que la compagnie ne modifie pas) : fournisseur du texte, relecture du juriste, date d'effet, double contrôle, journal | fournisseur : Money Vibes ; relecture : juriste ; date d'effet datée | procédure | [A] | FR-4, FR-14, FR-235 | juriste (par le `DG`) | juriste | à chaque publication ; au moins annuelle |

### Conflits résolus

Chaque ligne donne la valeur **gardée** (celle de la FR qui définit le paramètre), la valeur **écartée** et la raison.

| paramètre | valeur gardée | valeur écartée | pourquoi |
|---|---|---|---|
| `echange.age_max_ouverture` (alias `LC_AGE_MAX_LECTURE_INTERFACE`, `LC_AGE_MAX_LECTURE_FICHIER`, `age_max_lecture_contrats`) | 5 minutes avec une interface, 24 heures avec des fichiers (FR-201 ; FR-3 et FR-41 s'alignent, FR-198) | 15 minutes avec une interface et 1 jour avec des fichiers (FR-3 avant alignement, `[A]` modèle microfinance) ; « à définir, aucun défaut chiffré » (FR-41) | FR-201 définit l'âge maximal de la lecture d'une police pour ouvrir un dossier. L'avertissement « données du … » est déjà porté par la fraîcheur (5 minutes avec une API, heure ou nuit avec des fichiers) et par le seuil « périmé » (le double, `echange.perime_facteur`) : trois seuils pour le même sens se contrediraient. |
| `RESTAURATION_TEST_PERIODE` (alias `nas.test_restauration`) | 1 mois (FR-236, installation) | annuelle, plus un test avant la mise en service (FR-176 avant alignement, NAS de la GED) | FR-236 fixe la politique de sauvegarde et de restauration de toute l'installation. FR-176 est alignée sur FR-236 (test mensuel) ; le test avant la mise en service reste exigé. |
| `expert.delai_rapport.auto_materiel` (alias `DELAI_RAPPORT_EXPERT`, `delai_rapport_expert_jours`) | 7 jours (FR-184, une valeur par domaine) | 7 à 10 jours (mémoire 2014, FR-14) | FR-184 est la FR qui définit les délais par domaine ; 7 jours est le **bas** de la fourchette de 7 à 10 jours du mémoire de 2014, qui décrit la pratique de la compagnie étudiée par le mémoire de 2014 (zone CIMA), à confirmer pour le Togo ; FR-14 s'aligne sur FR-184. |
| `delegation_responsable_max_fcfa` (alias `DELEG_SEUIL_RESP`) | 1 000 000 FCFA pour le responsable sinistres ; comité sinistres au-delà, puis visa du directeur technique ; direction générale seule pour un règlement à titre commercial (D8, FR-8, FR-78) | 2 000 000 FCFA, seuil unique de validation de la démo | La démo n'a qu'un seuil ; D8 le remplace par une matrice à plusieurs niveaux (FR-78, écarts relevés). Le chiffre 2 000 000 FCFA survit ailleurs, comme **autre** paramètre : l'écart de provision qui attend le responsable (`provision.ecart_validation`, FR-188). |
| `conservation.materiel`, `conservation.risques_divers`, `conservation.sans_suite_refuse` | 10 ans, point de départ la clôture (FR-174, art. 404 du Code CIMA, plancher de `conservation.plancher`) | 5 ans (code de la démo) | Une durée inférieure au plancher légal n'est pas acceptée par le formulaire (FR-174) ; les 5 ans de la démo ne s'appliquent que si le juriste le confirme (D21). Le sinistre mortel garde 30 ans, définitifs. |
| `decompte.ordre` | dommage, vétusté, règle proportionnelle, plafond, franchise ; la franchise est déduite du montant arrêté (FR-69, code de la démo) | franchise appliquée avant la règle proportionnelle (rédaction initiale de D15 dans le plan) | D15 a été corrigé le 2026-11-13 d'après le code de la démo et la pratique ; FR-69, FR-75, FR-134 et le vocabulaire (§3) portent l'ordre retenu. |
| `delai_declaration_*` (alias `plancher_delai_declaration`) | au moins 5 jours ouvrés ; 48 heures pour le vol (art. 12-4°) ; 3 jours pour le transport de marchandises (valeur gardée) (FR-43, FR-14) | 5 jours et 2 jours de la démo, comptés en jours sans distinction d'unité | Le plancher légal l'emporte partout (R10) : la valeur de la démo pour le vol (2 jours) est ramenée à 48 heures, et le défaut général est compté en jours ouvrés ; une valeur sous le plancher est refusée à la configuration. |

## Annexe E. Table de reprise des vérifications de la démo

La démo a rejoué le parcours de `SIN-2026-9002` deux fois ; le second rejeu (`rejeu-2/verifications.txt`) compte **104 vérifications**, réparties en 19 blocs (0 à 18). Le PRD décide de plusieurs écarts avec la démo (franchise déduite, offre et accord avant l'ordre, recours parallèle, statuts renommés, remise à zéro réservée à `ADMIN`, sélecteur de profil). Une vérification qui contredit une décision du PRD ne peut pas rester telle quelle : cette annexe dit, **pour chacune**, si elle est **gardée**, **réécrite** (nouvelle valeur attendue) ou **retirée** (décision citée).

**Règle de recette (FR-15, FR-264).** La recette exige **104 sur 104 de la table réécrite**, c'est-à-dire des vérifications gardées et des vérifications dans leur forme réécrite. Elle n'exige pas « 104 sur 104 » du rejeu d'origine.

### E.1 Les 104 vérifications du rejeu 2

Bilan : **92 gardées, 12 réécrites, 0 retirées.** Les vérifications gardées sont rejouées telles quelles ; les réécrites portent la nouvelle valeur attendue. Aucune vérification n'est retirée : chaque contradiction a une forme réécrite. Les quatre vérifications « sans rechargement » restent valides au titre de FR-28.

| n° | bloc du rejeu | vérification de la démo | sort | nouvelle valeur attendue ou précision | FR du PRD |
|---|---|---|---|---|---|
| 1 | 0. Préparation | Le bouton « Réinitialiser la démo » est toujours visible | **réécrite** | Le bouton est visible pour `ADMIN` seulement, et seulement dans l'espace d'essai ; un autre rôle ne le voit pas (FR-15). | FR-15 |
| 2 | 0. Préparation | Bouton de remise à zéro grisé quand la démo est vierge | **gardée** | pour `ADMIN`, en espace d'essai (FR-15) | FR-15 |
| 3 | 0. Préparation | Le dossier est DÉCLARÉ | **gardée** | — | FR-15 |
| 4 | 0. Préparation | « Changer de profil » est dans la barre latérale | **réécrite** | Un **sélecteur de profil de démonstration** (changer de profil sans se déconnecter) est dans la barre latérale, dans l'espace d'essai seulement (FR-15). | FR-15 |
| 5 | 1. Accueil | « Ouvrir et orienter » est fermée avec son motif | **gardée** | — | FR-39, FR-45, FR-134 |
| 6 | 1. Accueil | « Ouvrir en attente de pièces » est ouverte | **gardée** | — | FR-39, FR-45, FR-134 |
| 7 | 1. Accueil | Le dossier passe à PIÈCES INCOMPLÈTES | **réécrite** | Le dossier passe à `PIECES_ATTENDUES` (statut renommé, FR-134). | FR-39, FR-45, FR-134 |
| 8 | 1. Accueil | « Reprendre le circuit » est fermée tant que les pièces manquent | **gardée** | — | FR-39, FR-45, FR-134 |
| 9 | 2. Accueil | La zone de dépôt multiple est proposée à l’Accueil | **gardée** | — | FR-159 à FR-165 |
| 10 | 2. Accueil | Le devis renommé est reconnu comme devis de réparation | **gardée** | — | FR-159 à FR-165 |
| 11 | 2. Accueil | Le total du devis est lu (1 273 000 FCFA) | **gardée** | — | FR-159 à FR-165 |
| 12 | 2. Accueil | 7 documents lus, prêts à verser | **gardée** | — | FR-159 à FR-165 |
| 13 | 2. Accueil | Complétude 100 % après versement | **gardée** | — | FR-159 à FR-165 |
| 14 | 2. Accueil | OCR « Texte extrait » sur les 7 pièces | **gardée** | l'OCR est réel, y compris sur les scans (FR-163) | FR-159 à FR-165 |
| 15 | 3. Accueil | Le dossier est OUVERT | **gardée** | — | FR-45, FR-50 |
| 16 | 3. Accueil | Aucun gestionnaire désigné | **gardée** | — | FR-45, FR-50 |
| 17 | 4. Responsable | Instruction fermée : le dossier doit avoir été attribué | **gardée** | — | FR-50, FR-51 |
| 18 | 4. Responsable | Aucun gestionnaire présélectionné | **gardée** | — | FR-50, FR-51 |
| 19 | 4. Responsable | Attribuer sans motif : bouton grisé | **gardée** | — | FR-50, FR-51 |
| 20 | 4. Responsable | Le dossier porte Estelle Lawson | **gardée** | — | FR-50, FR-51 |
| 21 | 4. Responsable | Le journal dit « Affectation du dossier » | **gardée** | — | FR-50, FR-51 |
| 22 | 5. Estelle | Le dossier est EN ÉTUDE | **réécrite** | Le dossier est `EN_INSTRUCTION` (statut renommé, FR-134). | FR-135, FR-75 |
| 23 | 5. Estelle | L’évaluation est fermée : expertise ouverte | **gardée** | — | FR-135, FR-75 |
| 24 | 6. Estelle | Complétude 88 %, sous réserve | **gardée** | — | FR-54, FR-61 à FR-68 |
| 25 | 6. Estelle | Montant pré-rempli 445 500 | **gardée** | montant retenu par l'expert, avant franchise (bloc 6) | FR-54, FR-61 à FR-68 |
| 26 | 6. Estelle | Bandeau « Rapport enregistré » | **gardée** | — | FR-54, FR-61 à FR-68 |
| 27 | 6. Estelle | La fiche se met à jour sans rechargement : « Décider » visible | **gardée** | gardée au titre de FR-28 (mise à jour de l'écran sans rechargement) | FR-54, FR-61 à FR-68 |
| 28 | 6. Estelle | Statut affiché « Rapport à analyser » | **gardée** | — | FR-54, FR-61 à FR-68 |
| 29 | 7. Estelle | Écart de 65 % affiché | **gardée** | — | FR-54, FR-61 à FR-68 |
| 30 | 7. Estelle | La puce nomme la pièce et son effectif | **gardée** | — | FR-54, FR-61 à FR-68 |
| 31 | 7. Estelle | L’histogramme dessine des barres | **gardée** | — | FR-54, FR-61 à FR-68 |
| 32 | 7. Estelle | Trois demandes pré-rédigées | **gardée** | — | FR-54, FR-61 à FR-68 |
| 33 | 7. Estelle | Complément demandé | **gardée** | — | FR-54, FR-61 à FR-68 |
| 34 | 7. Estelle | Sans rechargement, le statut affiché est « Complément demandé » | **gardée** | gardée au titre de FR-28 (mise à jour de l'écran sans rechargement) | FR-54, FR-61 à FR-68 |
| 35 | 8. La contestation | Avertissement : le complément n’a pas été reçu | **gardée** | — | FR-66 |
| 36 | 8. La contestation | Estelle ne peut pas ordonner la contre-expertise | **gardée** | — | FR-66 |
| 37 | 8. La contestation | Le responsable conteste : 9201 CONTESTÉE | **gardée** | — | FR-66 |
| 38 | 8. La contestation | Le bouton « Arbitrer la contestation » lui est proposé | **gardée** | — | FR-66 |
| 39 | 8. La contestation | Une contre-expertise est ouverte | **gardée** | — | FR-66 |
| 40 | 8. La contestation | Le cabinet initial est affiché écarté, avec le motif | **gardée** | — | FR-66 |
| 41 | 8. La contestation | Le panel interne est refusé | **gardée** | — | FR-66 |
| 42 | 8. La contestation | SAREX désigné | **gardée** | — | FR-66 |
| 43 | 8. La contestation | Sans rechargement, la fiche affiche « Expert désigné » | **gardée** | gardée au titre de FR-28 (mise à jour de l'écran sans rechargement) | FR-66 |
| 44 | 9. SAREX | La contre-expertise est en tête de « Missions à accepter » | **gardée** | — | FR-61 à FR-68, FR-180 |
| 45 | 9. SAREX | Le portail ouvre sa propre mission | **gardée** | — | FR-61 à FR-68, FR-180 |
| 46 | 9. SAREX | Mission acceptée | **gardée** | — | FR-61 à FR-68, FR-180 |
| 47 | 9. SAREX | Le rapport est reconnu comme contre-expertise | **gardée** | — | FR-61 à FR-68, FR-180 |
| 48 | 9. SAREX | Complétude 100 % | **gardée** | — | FR-61 à FR-68, FR-180 |
| 49 | 9. SAREX | 445 500 FCFA lus | **gardée** | montant retenu par l'expert, avant franchise (bloc 9) | FR-61 à FR-68, FR-180 |
| 50 | 9. SAREX | Rapport de contre-expertise déposé | **gardée** | — | FR-61 à FR-68, FR-180 |
| 51 | 9. SAREX | Le cabinet ne voit pas la provision | **gardée** | — | FR-61 à FR-68, FR-180 |
| 52 | 10. Estelle | Contre-expertise validée | **gardée** | — | FR-66, FR-68 |
| 53 | 10. Estelle | 9201 est ARBITRÉE | **gardée** | — | FR-66, FR-68 |
| 54 | 10. Estelle | La fiche 9201 dit « Contestation tranchée » | **gardée** | — | FR-66, FR-68 |
| 55 | 11. Estelle | Le libellé de responsabilité est un libellé | **gardée** | — | FR-61, FR-62 |
| 56 | 11. Estelle | Un seul besoin à retenir : responsabilité | **gardée** | — | FR-61, FR-62 |
| 57 | 11. Estelle | EXP-2026-D0001 créée | **gardée** | — | FR-61, FR-62 |
| 58 | 11. Estelle | Retenir deux fois est impossible | **gardée** | — | FR-61, FR-62 |
| 59 | 12. Komlan | Komlan désigné | **gardée** | — | FR-67, FR-179, FR-180 |
| 60 | 12. Komlan | Sans rechargement, « Rédiger mon rapport » apparaît | **gardée** | gardée au titre de FR-28 (mise à jour de l'écran sans rechargement) | FR-67, FR-179, FR-180 |
| 61 | 12. Komlan | La grille de responsabilité ne demande pas de méthode d’évaluation | **gardée** | — | FR-67, FR-179, FR-180 |
| 62 | 12. Komlan | Complétude 100 % à mesure de la saisie | **gardée** | — | FR-67, FR-179, FR-180 |
| 63 | 12. Komlan | Sans la part du tiers, le dépôt est bloqué | **gardée** | — | FR-67, FR-179, FR-180 |
| 64 | 12. Komlan | La part saisie annonce le recours fondé à 70 % | **gardée** | — | FR-67, FR-179, FR-180 |
| 65 | 12. Komlan | Rapport déposé | **gardée** | — | FR-67, FR-179, FR-180 |
| 66 | 12. Komlan | Le message annonce le PDF dans les pièces | **gardée** | — | FR-67, FR-179, FR-180 |
| 67 | 12. Komlan | Le PDF du rapport rédigé est stocké sous la pièce | **gardée** | — | FR-67, FR-179, FR-180 |
| 68 | 12. Komlan | La pièce « Rapport d’expertise | **gardée** | — | FR-67, FR-179, FR-180 |
| 69 | 12. Komlan | D0001 validée | **gardée** | — | FR-67, FR-179, FR-180 |
| 70 | 12. Komlan | La responsabilité du dossier est requalifiée : 70 % au tiers | **gardée** | — | FR-67, FR-179, FR-180 |
| 71 | 12. Komlan | Le badge du dossier porte « 70 % au tiers » | **gardée** | — | FR-67, FR-179, FR-180 |
| 72 | 13. Estelle | Décision de garantie enregistrée | **gardée** | — | FR-69 à FR-76 |
| 73 | 13. Estelle | L’évaluation est ouverte (3 missions closes) | **gardée** | — | FR-69 à FR-76 |
| 74 | 13. Estelle | Le montant pré-rempli est le chiffrage validé : 445 500 | **réécrite** | Le montant pré-rempli est le **montant du décompte** : chiffrage validé 445 500, moins la franchise de 50 000 (minimum), soit **395 500** (D15, FR-69 ; arrêté au franc près, R8). | FR-69 à FR-76 |
| 75 | 13. Estelle | Le calcul d’instruction est affiché en repère | **gardée** | — | FR-69 à FR-76 |
| 76 | 13. Estelle | Évaluer sans montant est refusé | **gardée** | — | FR-69 à FR-76 |
| 77 | 13. Estelle | Un autre montant exige un motif (bouton grisé) | **gardée** | — | FR-69 à FR-76 |
| 78 | 13. Estelle | L’écart avec le chiffrage validé est signalé | **réécrite** | L'écart avec le montant du décompte (395 500) est signalé ; la franchise déduite n'est pas un écart (D15). | FR-69 à FR-76 |
| 79 | 13. Estelle | Dossier ÉVALUÉ à 445 500, barème BAR-MAT | **réécrite** | Dossier `EVALUE` à **395 500**, barème BAR-MAT (franchise déduite, D15, FR-69). | FR-69 à FR-76 |
| 80 | 13. Estelle | Provision réajustée à 445 500 | **réécrite** | Provision réajustée à **395 500** (D15, FR-76). | FR-69 à FR-76 |
| 81 | 13. Estelle | Envoyé en validation | **gardée** | — | FR-69 à FR-76 |
| 82 | 13. Estelle | Pour Estelle, la validation est fermée | **gardée** | — | FR-69 à FR-76 |
| 83 | 14. Responsable | Fiche : 3 expertises closes, 2 validées, 1 arbitrée | **gardée** | — | FR-78, FR-82, FR-86, FR-90 |
| 84 | 14. Responsable | Fiche : pièces 5/5, tranche M2, comparables | **gardée** | — | FR-78, FR-82, FR-86, FR-90 |
| 85 | 14. Responsable | Fiche : déclaration tardive et franchise en vigilance | **gardée** | — | FR-78, FR-82, FR-86, FR-90 |
| 86 | 14. Responsable | Fiche : part du tiers et recours à engager | **réécrite** | Fiche : part du tiers de 70 % et recours **déjà ouvert** depuis l'ouverture du dossier (D10, FR-32). | FR-78, FR-82, FR-86, FR-90 |
| 87 | 14. Responsable | Confirmer grisé sans motif | **réécrite** | La validation par le `RESP` est grisée sans motif ; elle suit le **contrôle de niveau 1** d'un second agent du volet, sous 1 000 000 FCFA (R6, FR-8). | FR-78, FR-82, FR-86, FR-90 |
| 88 | 14. Responsable | Ordre de règlement émis | **réécrite** | Après la validation, l'**offre est envoyée** (`OFFRE_ENVOYEE`) et l'**accord de l'assuré est enregistré** par `ACC` sur la pièce originale signée ; l'ordre n'est émis qu'ensuite (D6 ; R4 ; FR-82, FR-86, FR-90). Au corporel, rien n'est émis avant `DELAI_DENONCIATION_ECOULE` (R1). | FR-78, FR-82, FR-86, FR-90 |
| 89 | 15. Comptable | Émettre sans numéro de chèque est refusé | **gardée** | — | FR-93, FR-94 |
| 90 | 15. Comptable | Quittance créée avec le chèque saisi | **gardée** | — | FR-93, FR-94 |
| 91 | 16. La remise et la clôture | « Retiré par » n’est pas pré-rempli | **gardée** | — | FR-97, FR-104 |
| 92 | 16. La remise et la clôture | Remise sans identité refusée | **gardée** | — | FR-97, FR-104 |
| 93 | 16. La remise et la clôture | Remise sans pièce d’identité refusée | **gardée** | — | FR-97, FR-104 |
| 94 | 16. La remise et la clôture | Dossier RÉGLÉ | **gardée** | la quittance est marquée `SIGNEE` par un agent distinct de l'émetteur (FR-97, R4) | FR-97, FR-104 |
| 95 | 16. La remise et la clôture | Le recours est ouvert : « Transmettre au pôle recours » n’est plus fermée | **réécrite** | Le recours existe depuis l'ouverture du dossier (suivi parallèle, FR-32, FR-108) ; sa créance est de **276 850** sur 395 500 (70 %) (D10). Il n'y a plus de bouton « Transmettre au pôle recours » après le règlement. | FR-97, FR-104 |
| 96 | 16. La remise et la clôture | Clôturer sans motif : bouton grisé | **gardée** | — | FR-97, FR-104 |
| 97 | 16. La remise et la clôture | Dossier CLÔTURÉ | **gardée** | — | FR-97, FR-104 |
| 98 | 16. La remise et la clôture | Pour Estelle, le versement relève de l’archiviste | **gardée** | — | FR-97, FR-104 |
| 99 | 17. GED | Numéro d’archivage attribué | **gardée** | — | FR-167 à FR-170 |
| 100 | 17. GED | L’archive est datée après la clôture | **gardée** | — | FR-167 à FR-170 |
| 101 | 17. GED | Bordereau de 11 pièces (dont les trois rapports), image scellée | **gardée** | la valeur de chaque pièce figure au bordereau (FR-168) | FR-167 à FR-170 |
| 102 | 17. GED | Le rapport rédigé en ligne est au bordereau | **gardée** | — | FR-167 à FR-170 |
| 103 | 17. GED | Verser deux fois est impossible : le dossier n’est plus proposé | **gardée** | — | FR-167 à FR-170 |
| 104 | 18. Remise à zéro | Après remise à zéro : DÉCLARÉ, démo vierge | **gardée** | remise à zéro par `ADMIN` en espace d'essai (FR-15) | FR-15 |

### E.2 Les 21 refus à provoquer

Le guide de la démo liste **21 refus** à provoquer pendant le parcours (le corps du PRD, FR-16, n'en cite que 7). La recette les provoque tous.

| n° | refus à provoquer | message ou état attendu | FR du PRD |
|---|---|---|---|
| 1 | Ouvrir sans les pièces | action fermée, avec le motif « pièces manquantes » | FR-45, FR-135 (transition 2) |
| 2 | Verser pendant la lecture | bouton « verser » grisé tant qu'une lecture est en cours ; compteur « N lus sur M » | FR-165, FR-162 |
| 3 | Un gestionnaire s'attribue le dossier | carte d'attribution non proposée ; refus `SEPARATION_DES_TACHES` (séparation n° 7) | FR-50, FR-7 |
| 4 | Instruire avant attribution | action fermée : « le dossier doit avoir été attribué » | FR-50, FR-135 |
| 5 | Attribuer sans motif | bouton grisé (motif obligatoire à la réaffectation) | FR-51 |
| 6 | Évaluer avec une expertise ouverte | action fermée : une mission est ouverte | FR-75, FR-135 |
| 7 | Un gestionnaire ordonne la contre-expertise | refus `DROIT_INSUFFISANT` (RESP, DG ou DT seuls) | FR-66 |
| 8 | Contre-expertise confiée au panel interne | refus `CONTRE_EXPERTISE_NON_AUTORISEE` | FR-66 |
| 9 | Contre-expertise confiée au cabinet initial | cabinet non proposé : « écarté : a produit le rapport contesté » | FR-66 |
| 10 | Deux fois le même besoin d'expertise | « Mission déjà ouverte » | FR-61 |
| 11 | Évaluer sans montant | « Saisissez le montant arrêté au barème » | FR-75 |
| 12 | Un autre montant que celui du décompte | motif obligatoire ; bouton grisé sans motif (le décompte arrête 395 500, D15) | FR-69, FR-75 |
| 13 | Le gestionnaire valide l'indemnisation | action fermée ; refus `SEPARATION_DES_TACHES` (SEP-01) | FR-7, FR-78 |
| 14 | Valider sans motif | bouton grisé | FR-78 |
| 15 | Le gestionnaire émet le règlement | action fermée ; `CPT` seul émet (SEP-02) | FR-7, FR-93 |
| 16 | Émettre sans numéro de chèque | « Indiquez le numéro du chèque émis » | FR-93, FR-221 |
| 17 | Remise sans identité | refus avec le champ nommé ; « retiré par » n'est jamais pré-rempli | FR-97 |
| 18 | Remise sans pièce d'identité | refus avec le champ nommé | FR-97 |
| 19 | Clôturer sans motif | bouton grisé | FR-104 |
| 20 | Le gestionnaire verse au fonds | « Le versement relève de l'archiviste » (séparation n° 12) | FR-168, FR-7 |
| 21 | Verser deux fois | le dossier n'est plus proposé au versement | FR-168 |

Les refus nouveaux décidés par le PRD (cumuls 13 à 16 de FR-7, condition `DELAI_DENONCIATION_ECOULE`, code `OPPOSITION_NON_ENREGISTREE`, état de règlement `INCONNU`, numéro reçu pour une `DEC-` déjà numérotée) s'ajoutent à cette liste dans la recette de FR-16.
