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

