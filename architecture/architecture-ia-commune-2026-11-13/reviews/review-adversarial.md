# Relecture adversariale — spine « IA commune de Prospera » (40 AD)

Méthode : pour chaque trou, deux unités du niveau d'en dessous qui obéissent chacune à la lettre aux AD et se construisent pourtant de façon incompatible. Les AD proposées sont des ajouts ou des resserrements ; le texte de la Rule est prêt à coller.

## Verdict

La spine est solide sur la doctrine (proposition, double garde, registre, secteurs, gel), mais elle laisse **plusieurs objets sans propriétaire unique d'écriture** (statut de proposition, exécution, sélection, « qui avait raison », lot exporté) et **plusieurs chemins de mise à jour qui ne passent pas par le plan de promotion** : en l'état, deux équipes conformes peuvent produire deux IA qui ne s'accordent ni sur ce qui a été décidé, ni sur qui avait raison, ni sur ce qui sort de l'instance. **Non prête pour les épics tant que les 7 trous CRITIQUES ne sont pas fermés.**

Décompte : 7 CRITIQUES, 9 HAUTES, 7 MOYENNES (23).

---

## CRITIQUE

### C-1 — Deux propriétaires du statut d'une proposition (`ia` vs module consommateur) et une course avec `expireLe`

- **Paire :** le module `ia` (registre) et le module consommateur (ex. `credit-service`).
- **Scénario :** AD-2 dit que « événements de statut » sont à `ia`, « jamais écrits ailleurs » ; AD-5 dit que l'événement de statut `ia.proposition.decidee@1` est « publié par le module consommateur » ; AD-1 dit que la décision est écrite par le consommateur. Équipe A (ia) lit l'événement Kafka et écrit la ligne de statut. Équipe B (consommateur) appelle en plus une route REST d'`ia` pour « acquitter ». Ou : l'agent de crédit accepte à 17:59:58, le job `expireLe` passe à 18:00:00, l'événement Kafka n'arrive qu'à 18:00:03 : `ia` le refuse (« PROPOSEE seulement »), l'écart dit `EXPIREE`, la décision humaine est perdue, et le « qui avait raison » est faux. Deux horloges : le consommateur décide à son heure, `ia` juge à la sienne.
- **AD à créer : AD-5 bis — Un seul écrivain de statut, la décision porte son heure.**
- **Rule proposée :**
  - `ia` est le **seul écrivain** de la collection des statuts. Le consommateur ne publie qu'un **fait d'intention** `ia.proposition.decidee@1` ; `ia` en dérive la ligne de statut. Aucune route REST d'écriture de statut n'existe.
  - Le fait porte `decideLe` lu à `HorlogeDeReference` **du consommateur**, `propositionId` et `cleIdempotence`. `ia` l'accepte si `decideLe <= expireLe` même si le job d'expiration est déjà passé : l'expiration est alors **annulée par un événement de correction** (jamais une réécriture), sinon `DECISION_TARDIVE` (écart `EXPIREE`, motif codé, journalisée).
  - Le job d'expiration ne passe une proposition à `EXPIREE` qu'après un délai de grâce `ia.proposition.grace_decision_s` (paramètre) ; un test de contrat rejoue la course (décision, expiration, décision tardive, rejeu).

### C-2 — Une capacité servie en deux versions selon le chemin (synchrone / asynchrone) : propositions jumelles, écarts doubles

- **Paire :** deux modules consommateurs (ex. `pdv` et `credit`) qui appellent la même capacité, l'un en `POST` synchrone, l'autre en `202` + `GET`.
- **Scénario :** AD-4 réserve le synchrone à « règle et modèle classique » et l'asynchrone à « langage, lecture de pièces, calcul long », mais **la fiche (AD-7) ne dit pas quel chemin est autorisé** : c'est le consommateur qui choisit. Une capacité N1 (modèle) dont le timeout de `ia.reponse.delai_max_s` tombe rend sur le chemin synchrone la **règle N0 étiquetée** ; le consommateur B, en asynchrone, reçoit plus tard le **N1**. Même objet, même capacité, deux propositions, deux niveaux ; l'une « tardive jetée » mais **sa prédiction `ia.prediction.enregistree@1` a déjà été publiée** : deux paires prédiction/réalité pour un seul objet, deux écarts exportés. Rejeu avec la même `cleIdempotence` après un état `INDISPONIBLE` : renvoie-t-on la proposition tardive jetée, un `EXPIREE`, ou une nouvelle ?
- **AD à resserrer : AD-4 et AD-7 (fiche) ; nouvel AD-4 bis.**
- **Rule proposée :**
  - La fiche déclare **une seule forme d'appel par version majeure** (`appel: SYNC | ASYNC`) ; changer de forme = **version majeure** (coexistence AD-4). Le port refuse l'autre forme (`FORME_APPEL_INTERDITE`).
  - La **prédiction et l'écart ne naissent que d'une proposition remise** (statut `PROPOSEE` lue ou renvoyée au consommateur) ; une proposition jetée, expirée avant lecture ou rendue après le délai n'émet aucun fait `ia.prediction.enregistree@1`. La repli N0 sur délai est **une proposition distincte, d'origine `REGLE`**, avec sa propre clé.
  - **Une clé d'idempotence = une proposition** : le rejeu renvoie la **même** proposition (ou son état terminal), jamais une nouvelle ; `ia.proposition.rendue@1` est publié pour **les deux formes**.

### C-3 — « Qui avait raison » calculé deux fois, avec deux horizons et deux sources de règle

- **Paire :** le module `ia` (instance) et `prospera-ia-centrale` ; ou fiche (AD-7) et pack (AD-28).
- **Scénario :**
  1. AD-7 place `horizon` et règle « qui avait raison » dans la **fiche** ; AD-28 les place aussi dans le **pack** (« objectifs et vérités terrain (horizon, règle) »). Deux sources : le pack dit 90 jours, la fiche 180.
  2. AD-15 : plusieurs échéances, « la plus longue fait foi », les courtes sont provisoires. AD-13 : un écart « mûrit quand la réalité est constatée à l'horizon » (un seul horizon). Le fait de réalité (AD-14) n'a **aucun champ `definitive`** : l'équipe du module crédit publie `impaye` à J+40 comme réalité ; `ia` marque l'écart mûr, l'exporte (AD-19 : « un seul envoi par écart ») ; à J+90 le prêt est soldé : la réalité finale contredit l'envoi, déjà parti.
  3. La centrale reçoit « prédiction, décision et réalité ensemble » : rien ne dit si le **classement** `IA_AVAIT_RAISON` part dans le lot (calculé sur l'instance) ou est **recalculé** à la centrale avec sa propre version de règle. Deux taux globaux.
  4. « ACCEPTEE alors qu'un autre niveau disait autre chose » : d'où vient cet autre niveau ? Rien n'impose que N0 tourne **en ombre en permanence**. Équipe A : N0 toujours calculé (coût). Équipe B : seulement pendant une promotion. Les populations de désaccord diffèrent.
- **AD à créer : AD-15 bis — Une règle, un horizon, un calcul, une version.**
- **Rule proposée :**
  - La fiche est la **seule source** de l'horizon, des échéances et de la règle ; le pack ne les déclare pas (il référence la fiche). Un doublon fiche/pack échoue en CI.
  - `<module>.realite.constatee@1` porte `definitive: bool` et `echeance`. Un écart ne **mûrit** que sur une réalité `definitive` à l'échéance la plus longue ; les réalités provisoires sont gardées et **jamais exportées**. Une réalité définitive postérieure à un classement ouvre une **correction versionnée** (jamais une réécriture) et, si l'écart est déjà parti, un **lot de rectification** par la même voie.
  - Le **classement est calculé une fois, sur l'instance**, et **voyage dans le lot** avec `versionRegle` ; la centrale **ne reclasse jamais**, elle agrège. Un test rejoue la règle des deux côtés et exige la même sortie.
  - Pour toute capacité qui déclare un désaccord confrontable, le **niveau de comparaison** est déclaré à la fiche (`comparaison: N0_PERMANENT_OMBRE | AUCUNE`) ; sans lui, pas de désaccord « autre niveau ». Les propositions d'ombre sont rangées avec `ombre: true` et ne produisent jamais de fait de prédiction exportable.

### C-4 — Un chemin de mise à jour qui contourne le gel et la date du DSI : packs, gabarits, jeux de référence, calibration, « correctif critique »

- **Paire :** le moteur de promotion (AD-22) et l'installateur de la ligne de modèles/packs (AD-21) ; ou le job de calibration (AD-17) et l'interrupteur de changement (AD-9).
- **Scénario :**
  1. AD-21 : gabarits de langage, jeux de référence **et packs** voyagent « sur la même ligne » que les modèles. AD-22 ne décrit l'essai/ombre/canari/date du DSI que pour **un modèle**. Un nouveau pack N0 change des barèmes de départ, donc des scores et des textes visibles : l'équipe qui installe les packs applique à l'installation (AD-21 : « mêmes vérification et promotion » est ambigu : mêmes que quoi ?), sans interrupteur.
  2. AD-33 : une « mise à jour de valeur réglementaire passe, même sur version figée » : un paquet **sans date DSI** qui change des propositions N0 en gel.
  3. AD-17 : la calibration sœur est **activée automatiquement dès qu'elle gagne** (hors personne). AD-9 : un changement qui change des scores visibles passe par un interrupteur et la date du DSI. Les deux obéissent à leur AD ; une calibration nocturne change les scores sans date. L'AD-22 dit « rien ne change sans l'accord du DSI » : la nuit, ça change.
  4. « En gel, seul un **correctif critique** passe par fichier » : qui dit « critique » ? Le manifeste signé par Money Vibes : un modèle neuf peut y être déclaré critique.
- **AD à créer : AD-22 bis — Tout ce qui change une proposition visible passe par le même plan.**
- **Rule proposée :**
  - **Tout artefact de la ligne** (modèle, pack, gabarit, jeu de référence, calibration d'origine centrale) a une **classe d'effet** déclarée au manifeste signé : `INVISIBLE` (aucune proposition ne change, vérifié par le jeu de dossiers figés AD-23, `ecart = 0`), `VISIBLE` (interrupteur de changement + date DSI + non-régression), `COUPE_OU_RETOUR` (seul admis en gel). Un artefact `VISIBLE` sans interrupteur est refusé à l'installation (`INTERRUPTEUR_MANQUANT`).
  - L'**agent vérifie lui-même** la classe `COUPE_OU_RETOUR` : l'artefact doit seulement désactiver une capacité ou rendre une version déjà installée ; sinon refus, quel que soit le drapeau du manifeste.
  - La **calibration nocturne** d'une capacité dont le niveau servi est visible à l'écran se range **sœur** et ne s'active qu'à la **fenêtre du DSI** (une fenêtre par semaine) ou sous l'interrupteur ; `ia.calibration.activation: AUTO | FENETRE`, le défaut est `FENETRE`. La valeur réglementaire passée par le chemin légal se range `VISIBLE` avec sa date d'effet légale.

### C-5 — Deux moteurs d'exécution (`assistant`, `automatisations`) sans import croisé : mandat, compteur, résultat, annulation

- **Paire :** les modules `assistant` et `automatisations`.
- **Scénario :** AD-2 interdit qu'ils s'importent. AD-29 donne à `assistant` le mandat, le compteur réservé/confirmé/libéré, l'`Execution` en ajout seul et la consommation de `<module>.action.executee@1` (table AD-32 : consommateur = `assistant`). AD-30 donne à `automatisations` des règles en `AUTO_SOUS_MANDAT` qui doivent **réserver ce compteur**, publier `automatisations.execution.demandee@1` (autre agrégat, autre `executionId`) et, via le topic unique `assistant.action.demandee`, le même ordre. Équipe A construit la réservation par appel HTTP à `assistant` ; équipe B par un compteur local dans `automatisations`. Le module exécutant répond `action.executee` : **seul `assistant` la lit** ; `automatisations` ne sait jamais si l'ordre est passé, ne compense pas, et son compteur de mandat n'est jamais confirmé ni libéré : deux plafonds distincts sur un seul mandat, donc **un plafond cumulé qui double**. En outre AD-30 : « sans `assistant`, règles en SUGGESTION et VALIDATION pour les types engageants » : mais `AUTO` non engageant sans mandat est permis : le texte ne dit pas qui journalise.
- **AD à créer : AD-29 bis — Une exécution, un propriétaire, un compteur.**
- **Rule proposée :**
  - Il n'existe **qu'un agrégat `Execution`**, un espace `executionId`, un compteur de mandat, une outbox sortante : ils appartiennent à `assistant`. `automatisations` **ne publie jamais** `assistant.action.demandee` ; il dépose, par le **contrat public d'`ia`** (la dépendance déclarée), une **demande d'exécution** `ia.execution.demandee@1` que le propriétaire unique consomme. Réponses `<module>.action.executee/annulee@1` portent `executionId` et `origine` (`COPILOT` | `REGLE:<id>`) et sont consommées **par le seul propriétaire**, qui republie `ia.execution.terminee@1` pour la règle.
  - Si `assistant` n'est pas installé : les règles sont `SUGGESTION` seulement, **y compris pour les types non engageants** ; aucun `AUTO` sans propriétaire d'exécution.
  - Le **compteur de mandat est unique par mandat**, quel que soit l'émetteur (Copilot ou règle) ; une CI vérifie qu'`automatisations` n'écrit pas de compteur.

### C-6 — Un agent qui agit sur un objet interdit par un détour : étiquette, tâche, et type d'action non relié à la liste des objets interdits

- **Paire :** `automatisations` (règle qui pose une étiquette) et un module exécutant dont une règle interne lit cette étiquette ; ou un module exécutant qui publie un type d'action `autonomisable: true`.
- **Scénario :**
  1. AD-6 interdit l'autonomie sur crédit, garantie, sinistre, paiement, refus, blocage, résiliation (une liste d'**objets/effets**). AD-29 gouverne des **types d'action** publiés par les modules, avec un drapeau `autonomisable` **posé par le module**. Rien ne relie les deux : un module exécutant publie `mettre-en-attente-dossier` (`autonomisable: true`, `engageant: false`) dont l'effet réel est de bloquer un décaissement. Les deux AD sont respectés.
  2. AD-30 : « une règle qui pose une étiquette ou crée une tâche interne est acceptée » en `AUTO`. Le module de crédit a une règle de base : « dossier étiqueté `A-REVOIR-FRAUDE` ⇒ décaissement suspendu ». L'IA n'a pas changé l'état ; elle a pourtant déclenché un blocage : AD-6 interdit « une règle de module qui change un état à partir d'une proposition de l'IA », mais ici la source est l'**étiquette posée par une automatisation**.
  3. Les « maxima par logiciel » d'AD-29 (assurance sans `AUTO`, etc.) sont des constantes de texte : ils peuvent être codés comme **branche par logiciel** (contre AD-3 : sept différences) ou dans le pack (qui ne peut qu'ajouter).
- **AD à resserrer : AD-6, AD-29, AD-30 ; AD-28 (pack).**
- **Rule proposée :**
  - La **liste des objets et effets interdits** (donnée versionnée unique d'AD-6) est **rapprochée de chaque type d'action** par un champ obligatoire `effets[]` du type ; un type dont `effets` rencontre la liste est `autonomisable: false` **forcé par le chargeur du catalogue** (le drapeau du module est ignoré), `TYPE_NON_AUTONOMISABLE`.
  - **Étiquettes et tâches** posées par une règle sont d'un **espace réservé** `ia:*` ; un module consommateur **ne peut référencer** une étiquette `ia:*` dans aucune règle qui change un état (balayage de la CI, liste d'états : suspension, blocage, refus, décaissement, résiliation, paiement).
  - Les **maxima par logiciel** sont une **donnée du pack** (`modesMax`) avec valeur plancher dans le socle ; le code lit la donnée, jamais le nom du logiciel (balayage CI).

### C-7 — Un modèle ou un jeu d'un secteur qui change les propositions d'un autre : la clé de capacité n'est pas la même partout

- **Paire :** deux packs (ex. distributeur et microfinance) qui déclarent une capacité de même `code` (`score-tiers`), ou la famille « transverse » héritée.
- **Scénario :**
  1. AD-7 : la fiche porte `code` et `famille`, avec nommage « `score-tiers` » dans les conventions ; AD-23 range les **modèles** sous `secteur/capacité/version` ; AD-9 `selection` est `(org, secteur, capacité)` ; mais le catalogue (AD-7), le cache `ModeleRuntime` (ONNX en processus), le fait `ia.prediction.enregistree@1` (charge : `capacite`, sans secteur), le registre d'écarts (AD-13) et la route `PropositionPort` portent `capacité{code,version}` **sans secteur**. L'équipe `ia` clé le cache ONNX par `code` : le modèle microfinance sert le distributeur d'une organisation à deux secteurs ; AD-23 « une organisation qui porte deux secteurs a deux calibrations » : la demande, elle, ne dit pas de quel secteur.
  2. Famille « transverse » (lecture de pièces) : un modèle N1 hérité par deux secteurs est **un seul artefact** avec **un alias unique**, contre « jamais d'alias partagé entre secteurs » : l'équipe de la centrale choisit un alias partagé « puisque transverse », l'équipe de l'instance un alias par secteur : deux promotions pour un même poids.
  3. Une promotion transverse change les propositions de **tous** les secteurs qui l'héritent : la non-régression (AD-23) dit « les secteurs que le candidat ne devait pas toucher » : un modèle transverse touche tous les secteurs, la porte ne sait pas quoi tester.
- **AD à créer : AD-23 bis — L'identité de capacité est `(secteur, code, versionMajeure)` partout.**
- **Rule proposée :**
  - La **clé d'identité d'une capacité** est **`secteur/code@majeure`** dans la demande, la proposition, la prédiction, l'écart, la calibration, le cache d'exécution, la route et l'événement. Une clé sans secteur est refusée (`SECTEUR_MANQUANT`). Le secteur est déduit **du module** qui demande (C11), jamais de l'organisation seule.
  - Un modèle hérité d'une famille transverse est **recopié par secteur** : un artefact par secteur, signé, promu **par alias de secteur** ; la centrale peut entraîner une fois mais **publie N artefacts** (même poids, N clés, N empreintes) : promotion, retour arrière et non-régression sont par secteur. Un cache de modèle est clé par `(secteur, code, majeure, empreinte)`.
  - La non-régression d'un candidat transverse rejoue **tous les secteurs qui l'héritent** ; elle bloque sur le pire secteur.

---

## HAUTE

### H-1 — Calibration et modèle : une calibration d'un modèle appliquée à un autre

- **Paire :** boucle locale (AD-17) et plan de promotion (AD-22).
- **Scénario :** la calibration (poids, seuils, probabilités) est fitée sur les sorties du modèle N1 courant. Le plan promeut un nouveau N1 (`refModele` change) ; AD-39 du moteur : « calibration intouchable par une promotion » ; `selection.refCalibration` reste. La calibration de l'ancien modèle recale les scores du nouveau : probabilités déformées, **sans alerte**. L'autre lecture : la promotion écrase la calibration (« retour arrière : modèle et calibration précédents » suppose qu'ils vont ensemble). Deux équipes, deux comportements.
- **AD à resserrer : AD-9, AD-17, AD-22.**
- **Rule proposée :** une calibration porte `modeleBase` (empreinte) ; elle n'est **activable** que si `modeleBase == refModele` de la `selection`. À la promotion d'un modèle, la calibration active est **mise en réserve** et une calibration sœur est **recalculée sur le nouveau modèle** (sur les écarts échus) et évaluée avant activation ; en attendant, le niveau servi est celui du modèle **sans calibration d'organisation**, dit à l'écran. Le retour arrière repointe `(modèle, calibration)` **comme une paire**.

### H-2 — La `selection` n'a pas la version majeure : deux majeures qui coexistent partagent un niveau

- **Paire :** deux consommateurs, l'un sur `score@1`, l'autre sur `score@2`.
- **Scénario :** AD-4 fait coexister deux majeures ; AD-9 clé la `selection` par `(org, secteur, capacité)` : une seule ligne, un seul `niveauServi`, un seul `refModele`. `score@2` promu en N1 fait servir à `score@1` un modèle dont le schéma d'entrée diffère, ou bloque `@1` en N0 sans le dire.
- **AD à resserrer : AD-9.** **Rule proposée :** `selection` est clé par `(organisationId, secteur, code, majeure)` ; la numérotation croissante est **par ligne** ; la promotion d'une majeure ne touche jamais l'autre ; écrire la ligne se fait par **compare-and-set sur le numéro** (un seul service applicatif, `src/application/selection`, écrit ; calibration, plan de promotion, retour arrière et coupe y passent tous).

### H-3 — « Qui avait raison » côté équité : les attributs de mesure n'ont aucun chemin

- **Paire :** l'instance (mesure TypeScript) et la centrale (Fairlearn).
- **Scénario :** AD-18 exige de mesurer l'équité « par genre, zone, secteur », avec genre et âge fournis par le module « pour la mesure » ; AD-13 dit que l'écart « ne contient jamais » autre chose que ses champs fermés ; AD-19 exclut les variables interdites des lots. Donc **soit** la centrale n'a aucun groupe pour Fairlearn (la porte d'équité de N1 est vide ou sans effet), **soit** une équipe ajoute genre/âge à l'écart exporté (contre AD-19). Et sur l'instance : où vivent genre et âge (AD-1 interdit de garder de la donnée métier) ?
- **AD à créer : AD-18 bis — Les groupes d'équité : un chemin, une conservation, un export.**
- **Rule proposée :** les attributs de mesure sont des **groupes grossiers à liste fermée** (`ia.equite.groupes`, tranche d'âge large, genre, zone régionale) fournis **au moment de la mesure** par une interface publiée du module (jamais stockés dans le journal) ; la mesure d'instance s'exécute **dans la même passe** que l'écart mûr et ne conserve que **des comptes agrégés par groupe, k-minimum**. Le lot exporte uniquement ces agrégats (jamais une ligne par personne) ; sans agrégat, la centrale **ne promeut pas** un N1 de score (`PROMOTION_REFUSEE`, porte équité).

### H-4 — Passerelle : « journaliser avant d'envoyer » n'est pas défini assez fin

- **Paire :** `ia/passerelle` et la file de fond BullMQ (réessais).
- **Scénario :** AD-24 : le journal doit réussir avant l'envoi ; mais pas dit **par tentative** ni **durable** : une équipe écrit le journal une fois par job (avec un `writeConcern` par défaut), puis laisse BullMQ réessayer l'envoi 3 fois : trois envois, une ligne ; ou écrit à `w:1`, le primaire tombe, la ligne est perdue, l'envoi est parti. Autre : le journal de la passerelle est « en ajout seul » mais le registre de l'IA est dans `ia_service_audit` : **deux journaux** pour le même envoi. Autre : en profil local, `ia.passerelle.modele.<capacite>` est une configuration : rien n'interdit de pointer un modèle de local vers un fournisseur hébergé (la passerelle de contrôle n'existe qu'en ligne, AD-3 liste « source du modèle de langage » comme différence).
- **AD à resserrer : AD-24.** **Rule proposée :** une ligne de journal **par tentative d'envoi**, acquittée en `w:majority, j:true` **avant** l'appel ; l'envoi porte l'identifiant de la ligne ; une réponse sans ligne correspondante est jetée ; le journal de la passerelle **est** une catégorie du registre (AD-10), pas un second journal ; le **résultat** (statut, durée, tokens) est une ligne **suivante** liée. En profil local, l'adaptateur `LlmProvider` n'accepte que une **adresse interne** (liste blanche du réseau Compose) : toute autre cible est refusée au démarrage (`FOURNISSEUR_HORS_PROFIL`). La table de correspondance du masquage **n'est jamais persistée** (en mémoire du job) ; une reprise après coupure ré-exécute le masquage.

### H-5 — Un lot d'export qui laisse sortir du texte libre, via « valeur retenue » et la correction

- **Paire :** `ia` (écart) et l'agent (préparation du lot).
- **Scénario :** AD-13 : l'écart garde « valeur retenue » ; pour `EXTRACTION` (lecture de pièces), l'humain **modifie** un champ lu (nom, numéro de pièce, adresse) : la valeur retenue est du texte libre identifiant. AD-19 liste ce qui est filtré (sans texte libre, sans santé) mais ne dit pas **comment le préparateur sait** qu'un champ de l'écart est libre : l'agent filtre par **nom de champ connu** ; une capacité nouvelle ajoute un champ `commentaire` ou `valeurCorrigee` que le manifeste type autorise « par capacité » : l'approbation DG porte sur le manifeste, pas sur le **type** du champ.
- **AD à resserrer : AD-13, AD-19.** **Rule proposée :** tout champ d'écart exportable est **typé fermé** à la fiche : `enum`, `entier d'unité mineure`, `booleen`, `tranche` ; **aucun type `string` libre n'est exportable** (le schéma de lot est `additionalProperties: false`, validé par l'agent **et** par la centrale à la réception, `LOT_HORS_MANIFESTE`). Pour une capacité d'extraction, l'écart exporte `corrige: bool` et le **motif codé**, **jamais la valeur lue ou retenue**. Une CI refuse une fiche dont un champ exportable est de type libre.

### H-6 — Deux préparateurs de lot (agent local, préparateur en ligne) : le même filtre implémenté deux fois

- **Paire :** l'agent d'instance (moteur AD-14) et le « préparateur » de plateforme en ligne (AD-19).
- **Scénario :** AD-19 « les prépare de la même façon » : deux bases de code. L'agent a le registre `classification-sante`, la liste des variables interdites ? AD-27 charge le registre **dans le service `ia`** ; le préparateur en ligne est « un service de plateforme » : version du registre ou de la liste **différente** (« épinglé au build » du service `ia`). Et AD-11 dit qu'**aucun chemin ne regroupe deux organisations** dans `ia`, alors que le préparateur lit les écarts de **toutes les organisations consentantes** : une route transversale dans `ia`.
- **AD à resserrer : AD-19, AD-27, AD-11.** **Rule proposée :** une **bibliothèque unique** `prospera-plateforme/preparation-lot` (même version épinglée dans l'agent et le préparateur) porte filtre, `k`, arrondis, salage ; le lot embarque `versionBibliotheque`, `versionRegistreSante`, `versionVariablesInterdites` ; la centrale **refuse** un lot dont ces versions ne sont pas les courantes (`LOT_VERSION_PERIMEE`). Le préparateur lit **par organisation**, par la route de lecture d'`ia` pour cette organisation seule (une organisation par appel, jamais de jointure), avec le jeton de la finalité ; le test de contrat joue le **même jeu** contre les deux.

### H-7 — Un pack de secteur qui embarque du code, en passant par des « gabarits » et des « formules »

- **Paire :** l'équipe qui écrit le pack microfinance et l'équipe qui écrit le chargeur de pack.
- **Scénario :** AD-28 : « fichiers déclaratifs JSON ». AD-8 : stratégies typées (score à facteurs, seuils, tendance glissante, gabarit, classement). Les **gabarits** (texte et langue) et les **tables de passage** ont une syntaxe non fixée : une équipe supporte `{{ #if montant > seuil }}` (donc un langage), une autre des champs `formule: "a*b+c"` « pour la tendance ». Le schéma du pack n'est pas dit fermé ; la signature `ci/modele` atteste l'origine, pas l'innocuité. Un pack de partenaire (AD-28 « public ») : qui le signe, selon quelle revue ?
- **AD à resserrer : AD-28, AD-8.** **Rule proposée :** le schéma du pack est **fermé** (`additionalProperties: false`, aucun champ `string` interprété) ; les gabarits ne connaissent que la **substitution de variables nommées** et la **pluralisation** (aucune condition, boucle, appel, ni expression) ; toute logique est dans une **stratégie typée du socle** ; un pack qui exige une stratégie absente demande **une version du socle**, pas un contournement. La CI rejoue un **linter de pack** (interdit : `eval`, `{{#`, `=>`, opérateurs dans les chaînes, code base64) ; un pack partenaire est signé **par Money Vibes seulement après passage du linter et revue** ; la signature d'un pack n'a **pas** d'autre usage que `pack`.

### H-8 — L'ombre : ce qui est calculé « en ombre » compte-t-il comme prédiction ?

- **Paire :** plan de promotion (AD-22) et journal des écarts (AD-13).
- **Scénario :** en ombre, N1 est calculé pour chaque demande mais « jamais affiché ni suivi d'effet ». L'équipe `ia` publie `ia.prediction.enregistree@1` aussi pour l'ombre (pour la comparer à la réalité) ; l'autre équipe (écarts) range tout fait de prédiction dans le journal d'écarts, avec décision absente : l'écart est « mûr » sans décision, exporté, et il **fausse le taux de désaccord** (décision nulle comptée comme rejet ou acceptation).
- **AD à resserrer : AD-13, AD-22.** **Rule proposée :** la prédiction d'ombre porte `ombre: true` et `niveauAffiche` ; le journal range les prédictions d'ombre dans une **collection séparée** `ecarts_ombre` qui ne contient **ni décision ni désaccord** et sert **seulement** à l'évaluation de la porte « qualité ≥ champion » ; elle n'est **jamais exportée**.

### H-9 — Auto-activation de la calibration vs échantillon aveugle et promotion de score de personne

- **Paire :** boucle locale (AD-17) et échantillon aveugle (AD-16).
- **Scénario :** AD-17 laisse la recalibration d'un score de personne s'activer sans validation si elle reste « dans les bornes cumulées », une fois par semaine. AD-16 exige l'échantillon aveugle ou l'inférence des refus pour **promouvoir en N1 ou N2** : mais la recalibration n'est pas une « promotion en N2 » au sens d'AD-16 : elle passe, entraînée **sur les seuls prêts accordés** (biais de sélection) : exactement ce qu'AD-16 voulait empêcher.
- **AD à resserrer : AD-16, AD-17.** **Rule proposée :** pour toute capacité qui note une personne, **toute activation de calibration** est une promotion au sens d'AD-16 : elle exige que le jeu d'évaluation vienne de l'échantillon aveugle ou de la méthode d'inférence des refus ; sinon `PROMOTION_REFUSEE` et la calibration reste sœur. La recalibration d'un score de personne n'utilise **que** les écarts à réalité observable pour tous (échantillon aveugle) ; aucun entraînement sur la seule population décidée.

---

## MOYENNE

### M-1 — `ia.contribution.recue@1` : événement du bus ou morceaux HTTP par le tunnel ?
Le tableau d'AD-32 nomme un événement avec outbox, partition `organisationId` et compatibilité BACKWARD, alors qu'AD-20 décrit la réception **par morceaux repris**, sur mTLS, et que le moteur autorise un seul protocole sortant. Une équipe publie sur Kafka (que la centrale ne lit pas, AD-20 : aucune connexion à un autre service), l'autre pose un `POST` par morceaux. **Rule :** `ia.contribution.recue@1` est le **nom du contrat de charge** du `POST` de réception, pas un topic ; seul le protocole du tunnel déclaré existe ; le topic n'est jamais créé (liste CI des topics).

### M-2 — `valeurPredite` et `objetRef` d'un score de personne sur le bus
`ia.prediction.enregistree@1` transporte la valeur d'un score ou d'une probabilité de sinistre sur Kafka, topic lisible par tout abonné d'organisation. **Rule :** les faits de prédiction sont **consommés par `ia` seul** (ACL de topic) ; la charge porte `objetRef` **pseudonyme d'instance** (AD-13) et jamais un identifiant de personne ; pour une capacité touchant la santé, aucune valeur sur le bus (AD-27).

### M-3 — L'échantillon aveugle sur la forme asynchrone et sur le repli
`masquee: true` est défini pour une réponse synchrone ; sur `202` + `GET`, le consommateur peut lire la proposition masquée avant de décider (route de lecture ouverte). Le repli N0 sur délai est-il tiré dans l'échantillon ? **Rule :** la lecture d'une proposition masquée renvoie `404` tant que le statut est `PROPOSEE` et non décidé ; l'échantillon se tire **à la demande acceptée**, avant le choix du niveau, et porte sur **le niveau servi**.

### M-4 — Désaccord par agent lisible par le Copilot
AD-15 diffère la vue par agent (J-IA-03) mais **enregistre** l'agent dès le jour 1 ; le Copilot, en lecture seule avec les droits de l'utilisateur, peut répondre à « quel agent me contredit le plus ? » dès qu'un responsable a `ia:desaccord:lire`. **Rule :** la coupe par agent est **hors des outils du Copilot** ; l'outil de lecture de désaccord ne sait que des agrégats par capacité et par équipe de taille ≥ `ia.desaccord.min_cas` ; la lecture par agent est un drapeau `ia.desaccord.vue_agent` éteint jusqu'à la décision tracée du juriste.

### M-5 — Registre unique ou trois journaux (`ia`, `assistant`, `automatisations`) ?
AD-10 décrit « le registre de l'IA » ; AD-29 dit l'`Execution` « en ajout seul » ; AD-30 « journal des déclenchements ». Trois bases, trois rétentions, aucune chaîne commune ; l'effacement d'organisation (AD-10 : destruction de clé) ne vise que `ia_service_audit`. **Rule :** les trois modules écrivent dans **le registre de `ia`** par son contrat public (catégories `INVOCATION`, `EXECUTION`, `DECLENCHEMENT`) ; l'effacement et la rétention s'appliquent à l'ensemble ; la clé par organisation est unique.

### M-6 — La date du DSI : qui la détient ?
AD-22 : en local, les étapes 2 à 5 se jouent « à la date du DSI » ; ni `selection`, ni l'agent, ni l'état voulu ne la déclare comme objet. Une équipe la range dans `selection`, une autre dans le registre de l'agent, avec un décalage au moment du retour arrière. **Rule :** `fenetreDSI` est un **champ de la configuration signée de l'état voulu**, lu par l'agent ; `ia` ne joue une étape que sur un **ordre de l'agent** portant la fenêtre ; la fenêtre manquée est reportée, jamais rattrapée.

### M-7 — Un code HTTP et un état qui disent deux choses
AD-5 : `404` public pour un objet caché ; AD-4 : les états en `200` ; AD-32 : `PROMOTION_REFUSEE` en `409`, `SANTE_HORS_INSTANCE` en `422`, `FORMAT_NON_SUPPORTE` en `415` : le consommateur doit distinguer « refus de politique » d'« état d'indisponibilité » ; deux clients générés peuvent classer `422` en exception, contre « jamais une exception ». **Rule :** une **table unique** (code, HTTP, catégorie `ETAT | REFUS | ERREUR`) dans le schéma de contrat ; le client généré mappe `ETAT` en retour valeur et `REFUS` en résultat typé, **jamais** en exception ; la santé (`SANTE_HORS_INSTANCE`) est un **refus rendu**, pas un `5xx`.

---

## Synthèse des AD à créer ou à resserrer

| AD | Action |
| --- | --- |
| AD-5 bis | écrivain unique de statut, `decideLe`, correction d'expiration (C-1) |
| AD-4 bis, AD-7 | forme d'appel déclarée à la fiche, prédiction seulement sur proposition remise, clé = une proposition (C-2) |
| AD-15 bis | source unique de l'horizon, `definitive`, classement calculé une fois, comparaison en ombre déclarée (C-3) |
| AD-22 bis, AD-9, AD-17 | classe d'effet de tout artefact, vérification par l'agent, calibration sous fenêtre (C-4, H-1) |
| AD-29 bis | une exécution, un propriétaire, un compteur (C-5) |
| AD-6, AD-29, AD-30, AD-28 | effets des types d'action reliés aux objets interdits, espace d'étiquettes `ia:*`, maxima en donnée (C-6) |
| AD-23 bis | identité de capacité `(secteur, code, majeure)` partout, un artefact par secteur (C-7, H-2) |
| AD-18 bis, AD-19, AD-13, AD-24, AD-28, AD-16 | équité, lots typés fermés, bibliothèque unique de préparation, journal de passerelle par tentative, pack fermé, aveugle (H-3 à H-9) |
