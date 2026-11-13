## 8. Exigences transverses (non fonctionnelles)

Les exigences transverses du PRD distributeur (PRD-D §8) et celles du PRD microfinance s'appliquent (FR-1). Celles-ci s'y ajoutent ou les précisent pour une installation chez la compagnie. Elles **ne répètent pas** une FR déjà écrite : elles la **renvoient** (« voir FR-n »). Tout chiffre est un paramètre de la compagnie (FR-4, annexe D).

#### FR-250 : Performance de la recherche et des écrans de travail

La recherche d'un dossier rend son résultat **en moins de 5 secondes au 95e centile**, sur le volume repris (voir FR-23, FR-150, §4.13). Les sources ne chiffrent aucune autre durée d'écran : les écrans de travail (corbeilles, fiche du dossier, files) sont mesurés **sur le jeu au volume de l'hypothèse de FR-23**, et la valeur mesurée devient la cible de recette de chaque écran. Aucune cible n'est inventée avant cette mesure.

**Conséquences (testables) :**
- Le test de FR-23 mesure la recherche par chaque critère (nom, police, numéro de sinistre, immatriculation, numéro d'archivage) ; un résultat au-dessus de 5 secondes au 95e centile fait échouer la recette.
- Le même jeu mesure l'ouverture de la fiche, de chaque corbeille et de chaque file ; le compte rendu de mesure est remis à la compagnie avec la configuration minimale du serveur (voir FR-234).
- Un indicateur de pilotage se recalcule à la demande depuis les données ; son actualisation est celle de FR-212.

#### FR-251 : Disponibilité pendant les heures d'ouverture

Le serveur central est disponible pendant les **heures d'ouverture** de la compagnie, fixées au contrat. Le chiffre de 99,5 % du temps ouvré est un **objectif de conception, sans engagement** (voir FR-246). La panne d'un élément voisin ne bloque pas le circuit : le LC coupé (voir FR-201), l'IA coupée (voir FR-11), le relais injoignable (voir FR-239), une liaison de guichet tombée (voir FR-237).

**Conséquences (testables) :**
- Un test coupe tour à tour le LC, l'IA commune, le relais et la liaison d'un guichet : le travail continue comme le disent FR-201, FR-11, FR-239 et FR-237, sans message d'erreur bloquant ni effet simulé.
- Une indisponibilité est mesurée sur les heures d'ouverture, pas sur 24 heures ; le calcul est écrit dans le manuel d'exploitation (voir FR-238).
- Aucun engagement chiffré de disponibilité n'est promis à la compagnie avant la séance d'immersion.

#### FR-252 : Sauvegarde quotidienne et restauration testée

La sauvegarde est **automatique et quotidienne**, sur le NAS et sur un second support dans les locaux de la compagnie ; la **restauration est testée** avant la mise en service, puis à intervalle régulier (voir FR-236, FR-176). La perte maximale (RPO) et le temps de reprise (RTO) ne sont **pas tranchés** : le PRD moteur en fixe des valeurs, la proposition commerciale v2 n'en chiffre aucune (§12.2).

**Conséquences (testables) :**
- Un test restaure la sauvegarde la plus récente sur un serveur de référence et retrouve l'état du dernier jour, chaînage du journal compris (voir FR-236).
- Un échec de sauvegarde ou de restauration lève une alerte à ADMIN (voir FR-176).
- Après une restauration, aucun règlement n'est réémis avant son rapprochement avec le relevé du fournisseur (voir FR-236, FR-220).

#### FR-253 : Chiffrement des pièces et des données sensibles

Les **pièces** du dossier, les **données de santé**, les **pièces d'identité** et les **téléphones** sont **chiffrés au repos** ; toute communication est **chiffrée en transit**. Les clés ne sont détenues ni par Money Vibes ni par ADMIN seul. Le chiffrement réduit le risque résiduel d'un accès direct à la base sur un serveur que la compagnie administre elle-même (voir FR-6).

**Conséquences (testables) :**
- Un test lit le stockage sans passer par l'application : les champs de santé, les pièces d'identité, les téléphones et les fichiers de pièces y sont illisibles.
- Un test intercepte une communication entre un poste et le serveur : le contenu n'est pas lisible.
- Les champs de santé suivent la règle de FR-9 ; une sauvegarde les garde chiffrés (voir FR-236).
- Le coffre des clés et ses détenteurs sont décrits dans le manuel d'exploitation (voir FR-238).

#### FR-254 : Double authentification et sessions

La **double authentification** est obligatoire pour les rôles sensibles : DG, DT, RESP, CPT, AUD et ADMIN ; une session dure 8 heures au plus et se ferme après 30 minutes d'inactivité (voir FR-25). Les comptes des cabinets externes sont séparés et n'ouvrent que le portail expert (voir FR-180).

**Conséquences (testables) :**
- Un compte d'un rôle sensible sans second facteur ne peut pas ouvrir de session ; la remise à zéro d'un second facteur est tracée et visible d'AUD.
- Aucun compte partagé n'existe ; aucun compte de démonstration n'a de mot de passe commun (voir FR-25).
- Un test vérifie que la fermeture de session après 30 minutes d'inactivité fait perdre l'écran, sans donnée métier gardée dans le navigateur.

#### FR-255 : Journal, trace et lecture des consultations

Toute modification et **toute consultation** est inscrite au **journal chaîné**, au nom de l'agent, horodaté par le serveur, non modifiable par l'application (voir FR-13, FR-138). Le journal des consultations est lu par AUD seul ; la piste d'audit par AUD, RESP et DG (voir annexe B).

**Conséquences (testables) :**
- Une tentative de modifier ou de supprimer une entrée du journal est refusée et tracée, même par ADMIN (voir FR-13).
- L'empreinte du journal est déposée régulièrement hors du serveur de la compagnie ; une altération directe en base est détectée au contrôle suivant.
- L'export du journal d'un dossier, d'un agent ou d'une période se fait sans reconstitution (voir UJ-7).

#### FR-256 : Conservation de dix ans au moins

Les dossiers, les pièces, le journal, le registre de l'IA et les ordres de règlement sont conservés **dix ans au moins** (Code CIMA, art. 404, texte lu). La durée d'un dossier est la plus longue entre ce plancher et la durée de sa nature (voir FR-174, FR-21, FR-236). La rotation des sauvegardes n'efface jamais une donnée sous conservation. Le point de départ de la durée est à confirmer par le juriste (voir FR-24).

**Conséquences (testables) :**
- Un test tente d'effacer une donnée sous conservation : refus avec un code nommé (voir FR-19).
- Une durée paramétrée sous le plancher est refusée par le formulaire (voir FR-174).
- Le journal et le registre de l'IA se lisent encore dix ans après leur écriture, sur une installation de référence (voir FR-12).

#### FR-257 : Données personnelles, hébergement et aucun port entrant

Les données restent sur le serveur et le NAS de la compagnie ; aucune donnée nominative et aucune donnée médicale ne sort (voir FR-19, FR-232). Aucun port n'est ouvert vers l'extérieur ; les flux venus d'internet passent par le relais que le serveur interroge (voir FR-239). Chaque destination sortante est inscrite au registre des transferts.

**Conséquences (testables) :**
- Un balayage de l'extérieur ne trouve aucun port entrant (voir FR-234, FR-239).
- Un test inspecte chaque envoi sortant : aucun nom, téléphone, identifiant ni donnée de santé (voir FR-12).
- Le registre des transferts liste le relais, le tunnel de l'IA commune et le support, chacun avec son contenu (voir FR-19).

#### FR-258 : Accessibilité depuis les postes existants

La plateforme s'utilise **depuis un navigateur récent**, sur les **postes existants** de la compagnie et de ses guichets, sans logiciel à installer sur le poste de travail (voir FR-237). Les appareils de référence sont fixés à la recette. Le poste de numérisation du guichet est le seul poste qui porte un périphérique (voir §6.2).

**Conséquences (testables) :**
- La recette passe sur les navigateurs et les postes de référence que la compagnie désigne ; un écran qui ne s'affiche pas sur l'un d'eux fait échouer la recette.
- Aucune installation n'est exigée sur un poste de travail ordinaire.
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

L'installation est exploitée par l'**équipe informatique de la compagnie** (rôle ADMIN), qui ne lit aucune donnée métier (voir FR-238). Elle dispose d'un manuel d'exploitation, d'une supervision lisible sans internet et d'un support de Money Vibes que la compagnie ouvre seule (voir FR-241, FR-246).

**Conséquences (testables) :**
- Un test ouvre chaque écran métier avec ADMIN : refus, sans donnée (voir FR-6).
- Le manuel d'exploitation est livré à l'installation et couvre démarrage, arrêt, mise à jour, restauration, supervision, astreinte (voir FR-238).
- Le tunnel de support ne s'ouvre pas depuis Money Vibes (voir FR-241).

#### FR-262 : Exactitude des montants et des indicateurs

Un montant se calcule **sans arrondi caché** (la règle d'arrondi est celle de FR-73) et se retrouve à l'identique à l'écran, dans l'offre, dans l'ordre et dans l'export. Les **cinq montants** (évalué, proposé, validé, payé, reste à payer) ne se confondent jamais (voir FR-75). Tout indicateur se **recalcule depuis les données** (voir FR-212).

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

Le PRD évolue **sans reprise du code** : tout seuil, délai ou liste est un paramètre versionné (voir FR-4). La recette se joue **sur le vrai serveur**, sur le jeu de démonstration, en reprenant les vérifications du second rejeu de la démo actuelle (voir FR-15, FR-16) ; elle échoue si une seule échoue.

**Conséquences (testables) :**
- Un test change chaque paramètre de l'annexe D et vérifie l'effet sur un nouveau dossier, pas sur un dossier engagé (voir FR-4).
- Le parcours de `SIN-2026-9002` se joue à la main, rôle après rôle, de la déclaration à l'archive, sur le vrai serveur (voir FR-16).
- La répétition générale de la reprise est jouée avant la mise en service (voir FR-218).

---

## 9. Indicateurs de réussite

La phrase à faire disparaître est : **« Je vais vérifier et je vous rappelle. »** Tout indicateur se **recalcule depuis les données** (FR-212) ; aucun n'est saisi. Les **valeurs de départ** se mesurent au démarrage, sur les dossiers repris et sur les premières semaines de travail ; les cibles ci-dessous sont des **propositions**, à fixer avec la compagnie à la séance d'immersion. Les chiffres illustratifs des documents commerciaux (dossiers ouverts, bloqués, heures gagnées) ne sont pas des cibles.

**Pour la démonstration** (ce qui prouve qu'elle est prête) :

| Indicateur | Mesure | Cible | Source |
|---|---|---|---|
| Parcours de `SIN-2026-9002` mené à la main, rôle après rôle, de la déclaration à l'archive | essais menés sans intervention de Money Vibes | 100 % des essais | FR-16, UJ-3 |
| Vérifications du second rejeu de la démo actuelle | vérifications réussies sur le vrai serveur | 104 sur 104 | FR-15, FR-264 |
| Rôles de démonstration qui voient exactement leur périmètre | rôles conformes à l'annexe B | 14 sur 14 | FR-6, annexe B |
| Boutons « bientôt » honnêtes | boutons qui promettent une date ou simulent un effet | 0 | FR-22 |
| Chiffres du tableau de bord égaux aux données | indicateurs recalculés, identiques aux listes | 100 % | FR-212 |

**Pour la compagnie en service** :

| Indicateur | Mesure | Cible | Source |
|---|---|---|---|
| « Je vous rappelle » disparu | part des appels d'assurés traités **pendant l'appel**, depuis la fiche (la fiche donne étape, pièces, montants, dernière action) | en hausse ; valeur de départ prise au démarrage, cible à fixer à la séance d'immersion | FR-152, journal de consultation |
| Retrouver un dossier | recherche rendue en moins de 5 secondes, au 95e centile, sur le volume repris | 95 % des recherches sous 5 secondes ; moins de 1 seconde visée | FR-23, FR-150 |
| Délai de réponse à l'assuré | temps entre le message de l'assuré et la première réponse de la compagnie | en baisse ; valeur de départ au démarrage | FR-146, FR-156 |
| Déclarations enregistrées sans retard | part des déclarations saisies le jour de leur réception (le mémoire de 2014 relève 3 à 4 jours de retard) | en hausse ; cible à fixer à la séance d'immersion | FR-39, FR-213 |
| Dossiers sans numéro officiel | dossiers sans numéro de sinistre du LC depuis plus de 1 jour ouvré | 0 dossier au-delà du délai, hors coupure déclarée | FR-37, FR-198 |
| Accusés de réception envoyés | part des accusés envoyés dans le délai interne (10 jours par défaut) | 100 % | FR-48, FR-213 |
| Offres envoyées dans le délai | part des offres validées envoyées sous 48 heures | en hausse ; cible à fixer à la séance d'immersion | FR-84, FR-213 |
| Offres dans les délais légaux CIMA | part des dossiers corporels dont l'offre part avant l'échéance légale (12 mois après l'accident, 8 mois après le décès ; Code CIMA art. 231, texte lu) | 100 % ; tout dépassement est expliqué et sa pénalité affichée | FR-85, FR-141 |
| Dossiers corporels avec une échéance légale active et alertée | part des dossiers corporels qui portent leur chronomètre légal | 100 % | FR-141 |
| Dossiers sans action depuis plus de 30 jours | nombre et part du stock actif | en baisse ; valeur de départ au démarrage | FR-144, FR-206 |
| Règlements payés deux fois | règlements au même bénéficiaire, même montant, sur 30 jours, non expliqués | 0 | FR-100 |
| Règlements sans validation ni accord | ordres émis sans validation ou sans accord enregistré | 0 | FR-86, FR-90 |
| Séparation des tâches | cumuls interdits constatés par le contrôle interne | 0 | FR-7, FR-210 |
| Actions tracées | part des actions du journal avec auteur et horodatage ; part des refus et classements avec motif | 100 % | FR-13 |
| Pièces lues par l'OCR | part des pièces reçues dont le texte est lu, scans compris | à fixer sur le jeu repris ; le motif de chaque échec est conservé | FR-163 |
| Pièces classées sans correction | part des types proposés par l'IA et gardés par l'agent | suivi mensuel, sans cible tant que le modèle n'est pas calibré | FR-164, FR-231 |
| Propositions de l'IA | par usage, part acceptée, modifiée, rejetée (rapport mensuel de performance) | suivi mensuel ; lecture : voir les contre-indicateurs | FR-12, FR-231 |
| Dossiers prêts pour un contrôle de la CRCA | temps pour produire le dossier de contrôle, journal compris | une journée, sans reconstitution (proposition) | FR-211, UJ-7 |
| Reprise des dossiers en cours | part des dossiers en cours repris sans écart ouvert, avant le feu vert | 100 % avant la mise en service du module | FR-216, FR-218 |
| Anomalie bloquante prise en charge | délai de prise en charge, en heures ouvrées | sous 4 heures ouvrées | FR-246 |
| Restauration testée | restaurations réussies sur le nombre prévu | 100 % | FR-236 |

**Contre-indicateurs** (ce qui ne doit **pas** se dégrader quand les autres s'améliorent) :
- **Qualité de l'instruction** : la part de dossiers rouverts après clôture ne doit pas monter ; aller plus vite ne doit pas faire clore plus mal (FR-107, FR-213).
- **Équité du règlement** : la part de refus, de classements sans suite et de litiges ne doit pas monter sans cause ; un refus reste motivé et opposable (FR-121, FR-123, FR-124).
- **Écarts d'IA** : la part des propositions dont l'humain s'écarte. Une part qui monte signale un modèle qui se trompe ; une part nulle signale qu'on ne lit plus (FR-12, FR-231).
- **Pression sur les assurés** : le nombre de messages et de relances par assuré, et le nombre de réclamations ; la relance ne doit pas devenir du harcèlement (FR-143, FR-156).
- **Fraude non détectée ou accusée à tort** : le nombre de revues écartées après coup et de fraudes confirmées ; le score n'accuse jamais (FR-128, FR-129).
- **Écarts avec le LC** : le nombre et l'âge des écarts ouverts entre Prospera et le logiciel de la compagnie ; un chiffre qui monte veut dire que Prospera ne dit plus la vérité (FR-200).
- **Charge des gestionnaires** : la charge pondérée par gestionnaire ; la productivité ne se gagne pas en surchargeant quelques-uns (FR-51).
- **Papier et numérique** : les chemises sorties et non restituées au-delà de 15 jours, et les pièces à rattacher ; le numérique ne doit pas faire perdre le papier (FR-166, FR-171).
- **Données de santé** : le nombre de lectures de données de santé hors des rôles autorisés doit rester à zéro ; toute lecture reste journalisée (FR-9, FR-153).

---

## 10. Périmètre

### 10.1 Dans le périmètre au premier jour

Décision du PO : **le premier jour, tout le circuit, avec l'IA, sauf la voix.** Le phasage progressif de la proposition v2 n'est pas retenu pour le périmètre. Le périmètre est celui du démarrage de **février 2027**, sur les serveurs de la compagnie.

- **Le circuit sinistre complet** (`sinistres`, M05) : déclarer, ouvrir, attribuer, instruire, chiffrer, décider, payer, clore ; 11 statuts, 4 sorties, le recours en suivi parallèle, la machine à états complète (§5, FR-30 à FR-149).
- **Consulter et déclarer** : la recherche unique, la fiche « répondre pendant l'appel », la déclaration par quatre canaux, les réclamations (§5.1, §6.1).
- **Les expertises** (`expertises`, M29) : référentiel des experts, missions, médecin-conseil, portail du cabinet externe, honoraires (§5.5, §6.3).
- **Les pièces, la numérisation et les archives** (`ged`, M07) : OCR réel, contrôle avant archivage, fonds numérique et physique, conservation, destruction visée, reconstitution (§6.2).
- **Les contrats lus, les provisions et les états** (`assurance`, M30/M31) : projection des polices et garanties lue du LC, provision dossier par dossier, état des provisions, réassurance et coassurance, export pour la comptabilité (§6.4).
- **L'échange avec le logiciel de la compagnie** (`liaison-assureur` [proposition], M48 [proposition]) : contrat d'échange générique, par API ou par fichier (Excel, JSON), dans les deux sens ; liste « à saisir dans le logiciel de la compagnie » (§6.5, annexe C). Le **logiciel de compagnie fictif** (`assureur-fictif`) pour la démonstration (§6.6).
- **Le pilotage et le contrôle interne** : tableaux de bord, brief du matin, plan de contrôle, dossier prêt pour la CRCA (§6.7).
- **La reprise** (`reprise`, M44) : fichiers Excel ou JSON dès le premier jour, adaptateur d'API écrit quand le LC est connu en janvier ; dossiers en cours d'abord ; resynchronisation nocturne ; rapport de reprise (§6.8, FR-214).
- **Les modules partagés** : `paiement` (chèque, virement, PI-SPI, Mobile Money), `notification`, `dashboard`, `reseau`, l'IA commune en instance locale (§7).
- **Les quatorze usages de l'IA, tous au premier jour**, sauf la voix : déclaration assistée (WhatsApp et e-mail), lecture et classement des pièces, contrôle des pièces, pièces manquantes et relances, résumé sourcé, recherche en langage naturel, pré-remplissage de l'instruction, analyse des devis, « pourquoi ce montant ? », fraude, courriers, recours, brief du matin, qualité du dossier et simulation (FR-10). S'y ajoutent l'orientation d'expertise assistée, la complétude d'un rapport et la comparaison au portefeuille. Tant qu'un modèle n'existe pas, ces capacités sont servies par des règles explicables et le disent (FR-10).
- **Les quatorze rôles**, la matrice d'accès, la séparation des tâches, la double authentification (annexe B, FR-6, FR-7, FR-25).
- **L'installation chez la compagnie** : un serveur applicatif et un NAS, sauvegarde quotidienne, mises à jour, support (§7.5, FR-246).
- **Le jeu de démonstration** : une compagnie fictive de 14 gestionnaires et d'environ 3 500 dossiers, quatre scénarios rejouables (FR-15).

### 10.2 Hors périmètre pour l'instant

- **L'IA vocale** : dictée, transcription d'appel, synthèse vocale. La déclaration assistée prend WhatsApp et l'e-mail, pas l'appel ; aucun appel n'est enregistré (FR-34, FR-35).
- **Le chatbot de l'assuré** (assistant conversationnel, aide à la déclaration, état d'avancement) : « bientôt » (FR-22). Il n'y a pas de portail assuré en libre-service au premier jour (FR-34).
- **La comptabilité officielle** : elle reste hors de Prospera ; Prospera produit un état et un export (FR-193).
- **La gestion des polices et des primes** : souscription, avenants, encaissement des primes, intermédiaires et coassureurs restent dans le LC (FR-2).
- **Le connecteur nommé** vers le logiciel de la compagnie et le module `connecteurs` : hors février (FR-245). L'échange générique, lui, est du premier jour.
- **La signature électronique** des offres et des transactions : « bientôt », à n'activer qu'après la validation du juriste (FR-22, FR-24).
- **L'anglais et les langues locales** : « bientôt » (FR-22, FR-260).
- **Le portail ou la connexion de la CRCA, des courtiers, des agents et des coassureurs** : ils reçoivent des états et des messages, ils ne se connectent pas (§2.2).
- **La récupération d'un indu** après fraude confirmée : à traiter à la séance d'immersion (FR-133).
- **L'estimation de la provision pour sinistres survenus non déclarés (IBNR)** : estimée hors de Prospera au premier jour (FR-189).
- **Le fonds de garantie automobile** : désactivé par défaut tant que son existence au Togo n'est pas confirmée (FR-111, FR-14).
- **Le scan du stock papier comme voie de reprise** : non retenu ; le papier reste tenu en parallèle (FR-21, FR-215).
- **Les statuts et transitions paramétrables par la compagnie** : au premier jour, les 11 statuts et les 41 transitions sont fixes ; les seuils, délais et listes, eux, sont des paramètres (FR-139, FR-4).
- **La haute disponibilité** : une instance, un serveur applicatif et un NAS, sans reprise automatique sur un second serveur (FR-23).

---

## 11. Non-objectifs

- **Prospera ne remplace pas le logiciel de la compagnie.** Il ne tient ni les polices, ni les primes, ni les assurés, ni les garanties ; il les **lit** et ne les modifie jamais (FR-2, FR-3).
- **Prospera n'est pas une comptabilité.** Il ne passe aucune écriture au grand livre ; il tient la provision du dossier et produit un état et un export (FR-193, FR-189).
- **L'IA ne décide pas.** Elle extrait, analyse et propose, avec sa source ; valider, refuser et payer restent des actes humains. Elle ne propose **jamais de montant sur un préjudice corporel** (FR-11).
- **Prospera ne refuse pas la garantie seul, ne déclare pas une fraude seul, ne paie pas seul.** Un score de fraude ouvre une revue humaine ; il n'accuse personne (FR-42, FR-129).
- **Prospera n'est pas un conseil juridique.** Il affiche les délais et pénalités du Code CIMA tels qu'ils ont été lus ; ce qui n'est pas vérifié est « à vérifier par le juriste » (FR-24).
- **Pas de déchéance automatique** pour déclaration tardive : une réserve et un motif, la décision revient au responsable (FR-43).
- **Pas d'ordre de règlement sans accord enregistré**, pas de validation de son propre dossier, pas de règlement par celui qui a décidé (FR-86, FR-7).
- **Pas de bouton qui simule.** Une capacité absente s'affiche « bientôt » ; elle n'imite jamais un effet (FR-22).
- **Pas de donnée nominative ni de donnée de santé hors de la compagnie** : ni vers l'IA commune, ni par un message à l'assuré, ni vers le relais (FR-232, FR-227).
- **Pas de lecture du métier par l'administrateur** : l'équipe informatique de la compagnie et Money Vibes (support) ne lisent aucune donnée de dossier (FR-238, FR-241).
- **Pas de suppression par défaut** : aucune destruction de dossier ou de pièce sans décision visée et tracée ; aucun bouton « supprimer », même pour ADMIN (FR-175).
- **Pas de dimensionnement par Money Vibes à la place de la compagnie** : la compagnie fournit ses volumes et achète son serveur ; Money Vibes fournit une configuration minimale issue d'un test (FR-23, FR-234).
- **Pas de règle du Togo tirée d'une pièce étrangère.** La convention d'expertise tunisienne, le mémoire de 2014 sur une compagnie du même groupe au Sénégal et les formulaires sénégalais du fonds de garantie sont des modèles et des jeux de test (§0).

---

## 12. Décisions, actions restantes et risques assumés

### 12.1 Décisions prises

Les décisions du PO sont datées dans `.memlog.md` ; le plan de rédaction fixe les décisions de cadrage D1 à D21 et leur répartition. Le 2026-11-13, le PO a demandé : « analyse toi-même et complète pour qu'on finisse ». Les décisions D1 à D21 sont donc des **recommandations de la rédaction**, pas des engagements de la compagnie : chacune est écrite avec ses défauts paramétrables et sa balise `[ASSUMPTION: … ; à confirmer à la séance d'immersion]`.

**Décisions du PO (2026-11-13).**

| # | Décision du PO | Où |
|---|---|---|
| P-1 | Le client est une compagnie IARD de la zone CIMA, au Togo, au stade du pré-contrat ; **jamais nommée** dans le PRD (« la compagnie »), même si la proposition v2 la nomme. Démarrage en **février 2027**, comme les autres clients Prospera. | §0 |
| P-2 | Les 14 gestionnaires de la démo (3 corporel, 5 matériel, 3 risques divers, 3 recours) sont un chiffre de **démonstration**, pas l'effectif réel. | FR-15 |
| P-3 | **Premier jour : tout le circuit** (retrouver, déclarer, pièces, traçabilité, évaluation au barème, validation, règlement, chèques, recours, missions d'expertise) **et l'IA, sauf la voix**. Le phasage progressif de la proposition v2 n'est pas retenu pour le périmètre. | §10, FR-10 |
| P-4 | Reprise des archives **par API, ou par fichier Excel ou JSON**. Le scan du stock papier n'est pas la voie de reprise ; le dossier papier reste tenu en parallèle. | FR-214, FR-215, FR-21 |
| P-5 | Le logiciel de la compagnie (polices, primes, clients) sera **libre en janvier** : on ne spécule pas dessus ; le PRD décrit un contrat d'entrée générique, sans connecteur nommé. | FR-194, FR-197, annexe C |
| P-6 | L'IA commune tourne en **instance locale** chez la compagnie : seuls des écarts anonymisés remontent par un tunnel sécurisé ; **aucune donnée médicale ne sort**. | FR-12, FR-232 |
| P-7 | Mode d'écriture **rapide** : brouillon complet avec `[ASSUMPTION]`, puis réconciliation, relectures, triage, polish. | — |
| P-8 | Une vraie démonstration a eu lieu devant la compagnie : elle a dit qu'**il manque des éléments, mais de débuter dessus**. Une **séance d'immersion** suivra. Le PRD est donc un processus réel, intégré, testé, et **évolutif par paramètres**. | §0, FR-4 |
| P-9 | Circuit de référence : **8 phases, 11 statuts, 4 sorties**, recours en suivi parallèle ; règles : celui qui décide ne paie pas, motif écrit sur tout refus ou classement, tout horodaté, une évaluation arrêtée n'est pas recalculée. | FR-30 à FR-33 |
| P-10 | Écarts à la démo : offre et accord de l'assuré en une étape ; recours en parallèle ; validation à plusieurs niveaux ; voie « accord sur devis » ; le **code de la démo fait foi sur la SPEC**. | FR-84 à FR-89, FR-59, FR-78 |
| P-11 | Premier jour, Prospera sert à **consulter et à déclarer** ; le **numéro de sinistre est détenu par le logiciel de la compagnie**, « pour un début ». | FR-34, FR-37, FR-198 |
| P-12 | Les points restants sont tranchés **par recommandation**, consignés en `[ASSUMPTION]` et en défauts paramétrables, à confirmer à la séance d'immersion. | §13 |
| P-13 | Sources lues en plus : commentaires de `workflow.ts`, `rejeu-2/README.md`, doc « Espace expert », chapitres V et VI du mémoire de 2014 (procédure réelle et défauts relevés ; Sénégal, à confirmer pour le Togo). | §0 |

**Décisions de cadrage D1 à D21, par recommandation** (à confirmer à la séance d'immersion).

| # | Décision | Où |
|---|---|---|
| D1 | Le client : compagnie IARD togolaise jamais nommée ; serveur applicatif et NAS chez elle ; IA commune en instance locale ; écarts anonymisés sortants par tunnel sécurisé. | §0, FR-234, FR-232 |
| D2 | **Le logiciel de la compagnie fait foi pour les contrats** (assurés, polices, garanties, primes, intermédiaires, coassureurs) et pour le numéro de sinistre officiel ; Prospera tient le dossier sinistre. Un **contrat d'échange générique** (API ou fichier). | FR-2, annexe C |
| D3 | Le numéro de sinistre : **référence de déclaration `DEC-`** immédiate, numéro officiel renvoyé par le LC ensuite ; liste « à saisir dans le logiciel de la compagnie » si le LC ne reçoit pas ; contrôle de doublon dans Prospera et dans le LC ; paramètre « qui attribue le numéro ». | FR-36 à FR-38, FR-198, FR-199 |
| D4 | Contrats **lus, jamais modifiés** ; la **décision de garantie ne se saute pas**. | FR-3, FR-41, FR-42 |
| D5 | 8 phases, 11 statuts, 4 sorties, recours parallèle ; correspondance avec la démo (`PIECES_INCOMPLETES` devient `PIECES_ATTENDUES`, `EN_ETUDE` devient `EN_INSTRUCTION`, `VALIDATION` devient `EN_VALIDATION`, `OFFRE_ENVOYEE` ajouté) ; 41 transitions. | FR-30, FR-134, FR-135 |
| D6 | L'offre et l'accord deviennent une étape ; offre sous 48 heures ; **aucun ordre de règlement sans accord enregistré**. | FR-84 à FR-90 |
| D7 | Délais **légaux** du corporel (art. 231, 233, 236, texte lu) séparés des délais **internes** paramétrables ; un dossier jugé selon le référentiel de sa date de survenance. | FR-14, FR-85, FR-140 à FR-142 |
| D8 | Matrice de délégation à plusieurs niveaux, paramétrable : 1 000 000 FCFA au responsable, comité au-delà puis visa du directeur technique, DG seul à titre commercial ; anti-fractionnement. | FR-8, FR-78, FR-79 |
| D9 | Voie « accord sur devis » : dossier de 300 000 FCFA et devis de 200 000 FCFA au plus (paramètres). | FR-59 |
| D10 | Le recours est un **suivi parallèle** ; relance tous les 15 jours ; réclamation après paiement de l'assuré ; prescription biennale à vérifier ; convention inter-compagnies en paramètre. | FR-32, FR-108 à FR-119 |
| D11 | Plusieurs règlements par dossier ; chèque, virement ou PI-SPI, Mobile Money par `paiement` ; espèces plafonnées ; quittance signée avant le paiement électronique ; LBC/FT. | FR-91 à FR-100 |
| D12 | **Provision dossier par dossier**, revue à chaque événement ; état des provisions et export ; comptabilité hors de Prospera. | FR-76, FR-188, FR-189 |
| D13 | **Quatorze usages de l'IA au premier jour, sauf la voix** ; chatbot de l'assuré « bientôt » ; OCR réel ; garde-fous de la proposition v2. | FR-10 à FR-12, FR-22 |
| D14 | Quatorze rôles ; le comité est une instance ; données de santé lisibles par MED, GEST corporel affecté, RESP, et DG ou DT pour une décision. | FR-6, FR-9, annexe B |
| D15 | Écarts de la démo tranchés : franchise déduite (ordre : dommage, vétusté, règle proportionnelle, plafond, franchise, corrigé le 2026-11-13) ; déclaration tardive = réserve, jamais déchéance ; complément non revenu bloque la validation ; cabinet sans compte ; évaluation jamais recalculée ; barème corporel poste par poste. | FR-43, FR-67, FR-69, FR-70, FR-75 |
| D16 | Comptabilité hors de Prospera : état et export. | FR-103, FR-193 |
| D17 | Reprise par `reprise` (M44), dossiers en cours d'abord, resynchronisation nocturne ; papier tenu avec cote physique ; conservation 10 ans au moins ; destruction visée. | FR-21, FR-168 à FR-175, FR-214 à FR-217 |
| D18 | Modules : `sinistres` (M05), `ged` (M07), `expertises` (M29), `assurance` (M30/M31), `liaison-assureur` (M48 [proposition]), `assureur-fictif`, `reprise` (M44), et les modules partagés. | FR-20, annexe A |
| D19 | Jeu de démonstration : compagnie fictive, environ 3 500 dossiers, quatre scénarios rejouables, 104 vérifications reprises en recette. | FR-15 à FR-17 |
| D20 | Performance : recherche sous 5 secondes au 95e centile ; hypothèse de dimensionnement à remplacer par les vrais volumes ; sauvegarde quotidienne ; anomalie bloquante prise en charge en 4 heures ouvrées. | FR-23, FR-246, FR-250 |
| D21 | **Revue juridique obligatoire avant la mise en service** ; saisie des tables du barème corporel au plan. | FR-24 |

### 12.2 Actions qui restent au PO

Ces points ne bloquent pas l'écriture, mais chacun doit être tranché avant l'architecture ou les épics. Les huit premières lignes sont les éléments à obtenir de la compagnie, **dans l'ordre du PO** (FR-219).

| # | Action | Ce que le PRD fait en attendant | Bloque |
|---|---|---|---|
| A-1 | Obtenir de la compagnie le **manuel de procédures sinistres**. | Procédure du groupe au Sénégal (mémoire de 2014) comme modèle, à confirmer. | séance d'immersion |
| A-2 | Obtenir les **délégations et seuils de validation**. | Défauts de D8, marqués « non confirmés » (FR-78). | matrice de délégation |
| A-3 | Obtenir le **nom et l'API du logiciel** actuel et du futur (connu en janvier). | Contrat d'échange générique, API ou fichier (annexe C) ; aucun connecteur nommé. | adaptateur d'API, reprise |
| A-4 | Obtenir la liste des **experts agréés**. | Sans elle, aucun cabinet n'est désignable en réel (FR-178) ; le panel de la démo n'est jamais utilisé en réel. | missions d'expertise |
| A-5 | Obtenir les **barèmes et les grilles de vétusté**. | Grilles indicatives de la démo, jamais utilisées en production (FR-72, FR-219). | provision d'ouverture, décompte |
| A-6 | Obtenir les **modèles de courriers et de quittances**. | Modèles de la démo (FR-46). | offre, refus, quittance |
| A-7 | Obtenir les **volumes** : dossiers par an, stock en cours, archives. | Hypothèse de dimensionnement de FR-23. | dimensionnement du serveur |
| A-8 | Obtenir le **compte rendu de l'atelier** avec le service sinistres (il n'est pas dans le dépôt ; il en reste six constats). | Les six constats de la SPEC. | séance d'immersion |
| A-9 | **Préparer la séance d'immersion** : ordre du jour tiré des hypothèses du §13.1, jeu de démonstration prêt, liste des décisions à valider en séance. | — | §13.1 |
| A-10 | **Demander l'amendement du PRD Reprise** : l'adaptateur API de l'assurance (FR-214) est au premier jour, alors que le PRD Reprise ne requiert que les fichiers en février. | Fichiers sans condition ; adaptateur d'API écrit dès que le LC est connu. | reprise par API |
| A-11 | **Chiffrer l'adaptateur Mobile Money sortant de `paiement`** (T-Money, Flooz) ; `paiement` n'a aujourd'hui que le virement et PI-SPI (FR-223). | Tant qu'un opérateur n'a pas d'adaptateur sortant, son canal est « bientôt » et le dossier propose le chèque ou le virement, sans rien simuler (FR-223). | règlements Mobile Money |
| A-12 | **Saisir les tables du barème corporel** : valeur du point d'incapacité permanente, capitalisation, barème médical, barème de responsabilité. Ce sont des **images** dans le PDF officiel : leur saisie est une tâche du plan, relue une à une par un second agent (FR-24, FR-70). | Calcul corporel impossible sans elles. | évaluation du corporel |
| A-13 | **Confirmer l'existence d'un fonds de garantie automobile au Togo** (FR-14, FR-111). | Paramètre « fonds actif » désactivé par défaut. | alertes du FGA |
| A-14 | **Fixer la perte maximale et le temps de reprise** (RPO, RTO) : le PRD moteur en donne, la proposition v2 n'en chiffre aucun (FR-236, FR-252). | Valeurs du PRD moteur, sans engagement. | contrat, PRD moteur |
| A-15 | **Organiser la revue juridique** avant la mise en service : une ligne par point du §13.2, avec son propriétaire, sa date et son issue (FR-24). | Défauts prudents du §13.2. | **mise en service** |
| A-16 | **Charge de février : dire si elle tient.** La revue du PRD moteur d'installation chiffrait déjà 17 à 20 semaines de charge pour 10 disponibles ; ce PRD ajoute un module d'envergure (circuit complet, `ged` avec OCR réel, `expertises`, `assurance`, liaison et LC fictif). | Aucune réduction de périmètre : le PO a dit tout le circuit au premier jour. | plan de février |
| A-17 | **Faire valider les codes et numéros des modules** : `liaison-assureur` et M48 sont des propositions ; le code `assureur-fictif` n'a pas de numéro (FR-20). | Codes proposés. | manifestes |
| A-18 | **Choisir les heures ouvrées** de la compagnie, base du délai de 4 heures et de la disponibilité (FR-246, FR-251). | À fixer au contrat. | contrat |

### 12.3 Risques assumés

| Risque | Effet | Ce que le PRD fait |
|---|---|---|
| **Premier risque : la reprise des données.** Les archives de la compagnie, leur format, leur volume et le logiciel d'où elles partent sont inconnus ; la compagnie peut tarder à fournir les éléments de FR-219. | Si la reprise est en retard, incomplète ou mal rattachée, « retrouver un dossier en moins de 5 secondes » et « répondre pendant l'appel » ne tiennent pas le premier jour, quelle que soit la qualité du reste. | Reprise par fichier sans condition ; dossiers en cours d'abord ; rapport de reprise validé avant que rien n'entre ; feu vert module par module ; un élément absent est signalé comme **décalant le premier jour** (FR-214 à FR-219). |
| **Le logiciel de la compagnie est inconnu jusqu'en janvier.** | Le contrat d'échange peut ne pas convenir ; l'adaptateur d'API ne peut pas être écrit avant. | Contrat générique par API ou fichier, dans les deux sens ; le LC fictif prouve le contrat ; la liste « à saisir » couvre un LC qui ne reçoit pas (FR-194 à FR-205). |
| **Les pièces de référence ne sont pas togolaises** (convention d'expertise tunisienne, mémoire de 2014 sur le Sénégal, formulaires sénégalais du fonds de garantie). | Un délai, un seuil ou une procédure transposés peuvent ne pas valoir au Togo. | Tout est un paramètre ; chaque valeur transposée porte sa balise ; les règles du Togo viennent du Code CIMA et de la loi sur les données personnelles (§0, §13.1). |
| **Les volumes sont inconnus.** | Le serveur peut être sous-dimensionné ou la recherche sous 5 secondes manquée. | Hypothèse de dimensionnement testée sur un jeu au volume ; configuration minimale issue du test ; avertissement au-delà du volume testé (FR-23). |
| **Aucun juriste n'a relu le PRD.** | Délais, barème corporel, données de santé, valeur probante de la copie numérisée, LBC/FT et fonds de garantie peuvent différer des défauts retenus. | **Revue juridique obligatoire avant la mise en service** ; défauts prudents du §13.2 ; aucun texte non vérifié n'est cité avec un numéro (FR-24). |
| **Les modèles de l'IA commune n'existent pas encore.** | Au premier jour, les capacités sont servies par des règles explicables. | Chaque capacité dit sa provenance ; le mot « IA » n'est affiché que pour un modèle (FR-10). |
| **La démo n'enregistre rien** : le portefeuille est généré à chaque chargement, l'IA est faite de règles, rien n'est envoyé ni payé. | Tout est à construire, du serveur aux écrans. | Le PRD exige en vrai ce que la démo montre, et corrige ses écarts (§0, FR-15, FR-16). |
| **La charge de février.** | Charge très élevée pour deux développeurs. | Le périmètre est maintenu ; l'action A-16 demande au PO de dire si la charge tient. |
| **L'accès direct à la base sur un serveur administré par la compagnie.** | ADMIN ou un tiers pourrait lire les données hors de l'application. | Risque résiduel assumé ; réduit par le chiffrement et le journal chaîné (FR-6, FR-253). |
| **La compagnie a dit qu'il manque des éléments.** | Des étapes seront à ajouter ou à parfaire à la séance d'immersion. | Tout seuil, délai et liste est un paramètre ; les hypothèses sont indexées au §13 pour être tranchées en séance. |

---

## 13. Hypothèses

Ce PRD porte **176 balises `[ASSUMPTION: …]`** dans son corps (§0 à §7). Aucune n'est un engagement de la compagnie : ce sont des **recommandations de la rédaction** (le PO a demandé de trancher pour finir), reprises en **valeurs par défaut paramétrables** (annexe D). Cet index les regroupe par thème, avec la FR où chacune se trouve ; il résume, il ne recopie pas. La colonne « Nb » donne le nombre de balises de la ligne.

**Lecture.** Les hypothèses du **§13.1** sont à confirmer à la séance d'immersion avec la compagnie. Celles du **§13.2** sont des points juridiques : un défaut prudent s'applique en attendant la revue du juriste, obligatoire avant la mise en service (FR-24, action A-15). Une correction change un paramètre, pas le code.

### 13.1 À confirmer à la séance d'immersion

**A. Cadrage, volumes et performance**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| §1 | La cible de 5 secondes vient du deck du 12/09 et du PO ; 1 seconde est la cible du deck ; la v2 ne chiffre pas | 1 |
| §2.3 | Montant du parcours UJ-3 (395 500 FCFA) = exemple ; durée de préparation d'un contrôle de la CRCA (une journée) non mesurée | 2 |
| FR-2 | Les traités de réassurance ne sont pas dans le LC | 1 |
| FR-23 | Volumes de dimensionnement (5 000 sinistres par an, 50 000 dossiers archivés, 1,5 million de pages, 60 utilisateurs) ; cible de 1 s | 2 |
| FR-147 | Volume de dimensionnement des files, repris de D20 | 1 |
| FR-150 | Volumes de D20 ; cible de 1 s du deck, non contractuelle | 2 |

**B. Rôles, délégations, séparation des tâches, accès**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-6 | Activation des rôles sensibles par un rôle métier (DG), reprise de la microfinance | 1 |
| FR-7 | Trois cumuls interdits ajoutés : émettre et rapprocher ; changer les coordonnées et émettre ; valider un dossier dont on est partie | 3 |
| FR-8 | Délégations par défaut (1 000 000 FCFA, comité, visa DT, DG seul) tirées de la procédure du groupe au Sénégal | 1 |
| FR-78 | Mêmes défauts de délégation, à obtenir à la séance d'immersion | 1 |
| FR-79 | Composition du comité (4 membres, quorum de 3) ; majorité simple des présents | 2 |
| FR-9 | Minimisation : un cabinet médical externe ne reçoit que les pièces nécessaires | 1 |
| FR-25 | Double authentification, session de 8 heures, inactivité de 30 minutes : valeurs de la microfinance | 1 |
| FR-180 | Second facteur obligatoire pour le cabinet externe | 1 |
| FR-238 | Création d'un administrateur par deux personnes : règle de la microfinance | 1 |

**C. Délais, seuils, paramètres et écrans du circuit**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-3 | Fraîcheur de la lecture du LC : 15 minutes avec une interface, 1 jour avec des fichiers | 1 |
| FR-5 | Seuils d'alerte recalculés chaque trimestre : modèle de la microfinance | 1 |
| FR-13 | Empreinte du journal déposée chaque jour hors du serveur | 1 |
| FR-14 | Délais internes repris du mémoire de 2014 (Sénégal), à confirmer pour la compagnie | 1 |
| FR-18 | Canaux de messages : comptes SMS de la compagnie (v2) ou WhatsApp si retenu (v4) | 1 |
| FR-20 | Code et numéro du module proposés | 1 |
| FR-34 | Pas de portail assuré en libre-service ; alerte au-delà de 1 jour ouvré sans numéro officiel | 2 |
| FR-37 | Le LC attribue le numéro au démarrage ; bascule possible par paramètre | 1 |
| FR-43 | Délais de déclaration de la démo, à confirmer dans les conditions générales | 1 |
| FR-46 | Modèles de courriers de la démo, à remplacer par ceux de la compagnie | 1 |
| FR-47 | Relance des pièces « sous 15 jours », comme dans la démo | 1 |
| FR-48 | Accusé de réception sous 10 jours ; alerte au 8e jour | 2 |
| FR-50 | Alerte de l'affectation au bout de 1 jour ouvré | 1 |
| FR-55 | Alertes et seuils d'instruction de la démo | 1 |
| FR-57 | Le titulaire est conservé pendant l'attente de pièces | 1 |
| FR-76 | Écart de provision de 2 000 000 FCFA qui attend le responsable | 1 |
| FR-89 | Relances de l'offre à J+15 et J+30 | 1 |
| FR-135 | Transitions ajoutées par la rédaction ; refus d'un dossier non attribué non prévu | 2 |
| FR-139 | Statuts et transitions non paramétrables au premier jour | 1 |
| FR-142 | Délai cible interne : départ à la déclaration, arrêt à `REGLE`, `REJETE` ou `SANS_SUITE` | 1 |
| FR-144 | La consultation n'interrompt pas le silence d'un dossier | 1 |
| FR-146 | Canal par défaut de l'assuré = SMS ; alerte à mi-délai des 48 heures | 2 |
| FR-151 | Longueur minimale de saisie de la recherche : 3 | 1 |
| FR-153 | Téléphone masqué : 2 chiffres visibles | 1 |
| FR-154 | Résumé du dossier en 5 minutes | 1 |
| FR-155 | Liste des questions de la recherche en langage naturel, modifiable | 1 |
| FR-156 | Escalade des réclamations jusqu'au DG | 1 |
| FR-208 | Brief du matin à 07:00 | 1 |
| FR-211 | Lot de 100 dossiers de contrôle en moins de 30 minutes ; pas de compte pour la CRCA | 2 |
| FR-212 | Actualisation des indicateurs : 5 minutes | 1 |
| FR-213 | Mesure des accusés et offres dans les délais : transposition du mémoire de 2014 à confirmer pour le Togo | 1 |
| FR-228 | Un cockpit par rôle, confirmé par le README de la démo | 1 |

**D. Pièces, expertise, évaluation et provision**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-49 | Grilles de provision d'ouverture de la démo, à remplacer par les règles de la compagnie | 1 |
| FR-53 | Comparaison d'empreintes d'images à construire (la démo la simule) | 1 |
| FR-59 | Seuils de l'accord sur devis (300 000 et 200 000 FCFA) tirés du mémoire de 2014 | 1 |
| FR-60 | Catalogue de pièces et taux horaire à obtenir ; valeurs de la démo | 1 |
| FR-68 | Délais de rapport et honoraires de la démo, à confirmer avec les experts agréés | 1 |
| FR-69 | Ordre du décompte de la démo, à confirmer avec les conditions générales | 1 |
| FR-72 | Grille de vétusté indicative de la démo | 1 |
| FR-73 | Arrondi à 5 000 FCFA hors corporel, au franc au corporel | 1 |
| FR-160 | Antivirus fourni par la compagnie | 1 |
| FR-163 | Une page non lue après 2 minutes est signalée (paramètre) | 1 |
| FR-164 | Seuils de confiance 0,60 et 0,90 | 1 |
| FR-166 | Pièce non rattachée : 3 jours ouvrés | 1 |
| FR-178 | Alerte d'agrément : 60 jours | 1 |
| FR-179 | Panel interne et médecin-conseil : jeu de démonstration seulement | 1 |
| FR-183 | Poids de charge par domaine à fournir par la compagnie | 1 |

**E. Offre, règlement et comptabilité**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-84 | Offre sous 48 heures ouvrées ; procès-verbal de transaction communiqué sous 24 heures | 2 |
| FR-90 | Un acompte passe par une offre d'acompte avec accord enregistré | 1 |
| FR-92 | État de règlement repris de la démo, ajouté aux cinq états de D11 | 1 |
| FR-94 | Gabarit de lettre-chèque fourni par la compagnie, sinon remplissage manuel | 1 |
| FR-96 | Durée de validité du code de l'acceptation électronique | 1 |
| FR-103 | Les comptes sont saisis par la compagnie ; Prospera exporte des natures d'opération | 1 |
| FR-192 | Seuil du drapeau « grande ampleur non clôturé » à fixer avec la compagnie | 1 |
| FR-221 | La compagnie a ou non un gabarit bancaire d'impression | 1 |
| FR-222 | Pas de cœur bancaire, à revérifier à l'adhésion à PI-SPI | 1 |

**F. Recours, sorties et fraude**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-106 | Bordereau complémentaire pour les pièces tardives du recours | 1 |
| FR-108 | Plusieurs recours par dossier (un par tiers) | 1 |
| FR-109 | Lettre de mise en cause sous 5 jours ouvrés | 1 |
| FR-112 | Arbitrage et abandon depuis les premiers états ajoutés à la démo | 1 |
| FR-113 | Honoraires non inclus dans la créance | 1 |
| FR-115 | Seuil de perte à obtenir ; validation du RESP seul tant qu'il est vide | 1 |
| FR-117 | Rapprochement des encaissements de recours dans `paiement` à préciser | 1 |
| FR-118 | Prescription à 730 jours par défaut | 1 |
| FR-120 | Garde-fou « jamais de montant au corporel » étendu au recours | 1 |
| FR-121 | Décision de refus sous 2 jours ouvrés | 1 |
| FR-123 | Sans suite : 15 jours après la dernière relance ; délai de grâce de 30 jours avant versement | 2 |
| FR-125 | Suspicion possible aux états de paiement | 1 |
| FR-126 | Réouverture de `SANS_SUITE` ajoutée ; alerte à la 3e ouverture | 2 |
| FR-128 | Revue de fraude ouverte dès le niveau `SUSPECT` | 1 |
| FR-129 | Relecteur distinct du gestionnaire ; revue sous 3 jours ouvrés | 2 |
| FR-132 | Bénéficiaire et compte de paiement dans le graphe ; liens hors score ; seule l'identité exacte du fichier comparée ; 5 dossiers minimum | 4 |
| FR-133 | Récupération d'un indu hors périmètre du premier jour | 1 |

**G. Archives et conservation**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-170 | Couleurs de chemise à fournir ; boîte non vérifiée depuis 12 mois signalée | 2 |
| FR-171 | Chemise non rendue : escalade au RESP à 30 jours | 1 |
| FR-172 | Impression à la clôture ; numérisation à la demande | 2 |
| FR-175 | Double visa de destruction (RESP puis DG) | 1 |
| FR-176 | Test de restauration annuel ; alerte du NAS à 80 % ; volumes de D20 ; format PDF/A | 4 |

**H. Logiciel de la compagnie, reprise et démonstration**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-15 | Seuil de couverture du jeu de démonstration ; remise à zéro réservée à ADMIN | 2 |
| FR-186 | La prime n'entre dans aucun indicateur sinistre ; la reprise amorce la projection | 2 |
| §6.5 | Échange avec le LC : transposition de la microfinance | 1 |
| FR-196 | Aucune donnée de santé vers le LC | 1 |
| FR-197 | Règle d'échange API ou fichier reprise de la microfinance | 1 |
| FR-198 | Format de la référence de déclaration, de la démo | 1 |
| FR-199 | Confirmation par marquage de l'agent ; alerte d'une ligne restée 1 jour ouvré ou 72 heures | 2 |
| FR-201 | Âge maximal de lecture pour l'ouverture ; horloge suspendue pendant une coupure déclarée | 2 |
| FR-202 | Taille du LC fictif : ordre de grandeur de la démo (environ 25 000 contrats) | 1 |
| FR-203 | Signal de doublon côté LC fictif | 1 |
| FR-214 | Reprise par API au premier jour ; amendement du PRD Reprise à demander | 1 |
| FR-215 | Historique repris sur 3 à 5 ans (proposition v2) | 1 |
| FR-217 | Bascule par dossier à la première action ; fin du parallèle fixée à la mise en service ; heure de la resynchronisation | 3 |
| FR-218 | Valeurs de contrôle de départ de la reprise | 1 |
| FR-219 | La reprise est le premier risque ; bilan de préparation appuyé sur le PRD moteur ; comité de pilotage | 3 |
| FR-245 | Règle du point d écriture unique par domaine, reprise des PRD distributeur et microfinance | 1 |

**I. IA, messages, installation et support**

| Où | Hypothèse (résumé) | Nb |
|---|---|---|
| FR-10 | Le chatbot de l'assuré : absent de la v2, présent dans le deck | 1 |
| FR-227 | Un message ne dit que « un document médical » ; détail au guichet ou par courrier | 1 |
| FR-230 | Noms des finalités de l'IA commune proposés | 1 |
| FR-231 | Calibrage de l'IA locale : modèle de la microfinance ; serveur « capable d'héberger à terme » le calcul | 1 |
| FR-232 | Lecture stricte : aucun écart issu d'une donnée de santé ne sort | 1 |
| FR-235 | Correctif de sécurité sous 72 heures ; gel après 30 jours sans contact et version figée | 2 |
| FR-236 | Test de restauration chaque mois, modèle de la microfinance | 1 |
| FR-239 | Relais Money Vibes repris de la microfinance ; purge à 7 jours ; interrogation chaque minute | 3 |
| FR-246 | Contenu de la maintenance repris de la v2 ; objectif de 99,5 % sans engagement | 2 |

### 13.2 Points juridiques : défauts prudents en attendant le juriste

| # | Où | Défaut prudent retenu | Nb |
|---|---|---|---|
| J-1 | FR-9 | Base légale des données de santé : consentement écrit par dossier ; formalité auprès de l'instance de protection des données à vérifier | 1 |
| J-2 | FR-9 | Secret médical : le gestionnaire lit les conclusions du médecin-conseil, pas le dossier médical complet | 1 |
| J-3 | FR-14 | Fonds de garantie automobile : existence non confirmée, paramètre « fonds actif » désactivé | 1 |
| J-4 | FR-19 | Droits des personnes (accès, rectification, opposition) : articles de la loi non relus | 1 |
| J-5 | FR-44 | Liste des pièces de la démo complétée par les art. 240-241 du Code CIMA, à valider | 1 |
| J-6 | FR-70 | SMIG du Togo : 52 500 FCFA par mois depuis 2023, sources secondaires, texte officiel non trouvé ; SMIG annuel = 12 fois le mensuel ; paramètre daté | 1 |
| J-7 | FR-85 | Pénalité de 5 % par mois calculée sur le montant de l'offre ; provision du risque de pénalité tenue au dossier | 1 |
| J-8 | FR-86 | Mineurs et incapables : pièce d'autorisation exigée avant l'ordre de règlement | 1 |
| J-9 | FR-98 | Plafond d'espèces : aucun plafond trouvé pour les assureurs ; 500 000 FCFA, valeur de la démo | 1 |
| J-10 | FR-100 | Seuil national de cumul LBC/FT non lu : paramètre vide, alerte inactive tant qu'il n'est pas saisi | 1 |
| J-11 | FR-100 | La déclaration de soupçon se fait hors Prospera | 1 |
| J-12 | FR-102 | Pas d'émission avant la fin du délai de dénonciation de 15 jours au corporel | 1 |
| J-13 | FR-111 | Fonds de garantie automobile désactivé par défaut | 1 |
| J-14 | FR-119 | Arbitrage entre assureurs activé pour les recours automobiles, à vérifier auprès de l'association des assureurs | 1 |
| J-15 | FR-123 | Classement sans suite d'un dossier corporel réservé à la direction (l'offre est due sans réclamation) | 1 |
| J-16 | FR-158 | Durée de conservation du journal des consultations alignée sur le plancher de l'art. 404 | 1 |
| J-17 | FR-174 | Plancher de 10 ans appliqué ; les 5 ans de la démo ne valent que si le juriste le confirme | 1 |
| J-18 | FR-174 | Point de départ de la durée : la date de clôture | 1 |
| J-19 | FR-189 | Provision des sinistres survenus non déclarés estimée hors de Prospera | 1 |
| J-20 | FR-222 | Acceptation électronique de la quittance offerte seulement après validation juridique ; sinon signature au guichet | 1 |
| J-21 | FR-223 | Mobile Money : le Règlement CIMA sur la LBC/FT ne le cite pas ; traité par analogie aux moyens à vérification minutieuse | 1 |
| J-22 | FR-225 | Seuil national de cumul de la valeur nationale non trouvé : paramètre vide, alerte inactive | 1 |
| J-23 | FR-225 | Règle de plafond et de LBC/FT du Mobile Money à confirmer par le juriste | 1 |
| J-24 | FR-24 | Revue obligatoire avant la mise en service : délais CIMA, barème corporel, fonds de garantie, conventions inter-compagnies, données de santé, valeur probante de la copie numérisée, LBC/FT, conservation, circulaires de la CRCA (cadre des points ci-dessus, sans balise propre) | 0 |

Chacun de ces défauts est confirmé ou corrigé par la **revue juridique obligatoire avant la mise en service** ; une correction change un paramètre, pas le code.

---

