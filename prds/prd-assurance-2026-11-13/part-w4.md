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

