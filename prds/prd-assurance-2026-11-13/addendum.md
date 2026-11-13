# Addendum — PRD Assurance (sinistres)

*Choix techniques et matière écartés du PRD, par partie. Ce n'est pas une exigence.*

## Partie 1 et partie 4

# Addendum W1 : choix techniques écartés du PRD (parties 1 et 4)

Le PRD décrit des capacités. Ce qui suit est utile à la spine et aux épics ; rien n'engage l'architecture.

## Journal et trace (FR-13, FR-12)
- Chaînage du journal : chaque entrée scelle la précédente par une empreinte (hachage) ; l'empreinte du jour est déposée hors serveur (service de dépôt de Money Vibes, ou support de la compagnie). Le journal des changements et celui des consultations ont des **flux distincts** (volume des consultations bien plus élevé) mais le même chaînage ; le registre de l'IA est un troisième flux de même nature.
- Les consultations de données de santé sont marquées par une classe de sensibilité portée par la pièce (étiquette posée à l'indexation), pas déduite à la lecture.
- Horodatage : horloge du serveur seule ; la démo a une horloge figée au 12/09/2026, à ne pas reprendre. Numérotation par séquences atomiques côté serveur (références `DEC-`, `ARC-`, quittances), sans trou ni doublon ; une séquence par année et par volet pour `ARC-`.

## Partage avec le logiciel de la compagnie (FR-2, FR-3)
- Contrat d'échange en API **ou** en fichier (Excel, JSON), dans les deux sens (annexe C) ; adaptateur d'échange par domaine, un seul point d'écriture par domaine, valeurs de contrôle déclarées au manifeste. Rejeu idempotent par clé d'échange (référence `DEC-` + version).
- Le paramètre « qui attribue le numéro » est lu par le service qui crée la déclaration ; le basculement ne change que la source du numéro, pas le modèle du dossier.
- Projection des contrats : copie datée en lecture seule, rafraîchie par période (API) ou par dépôt de fichier ; aucun droit d'écriture du compte technique côté LC.

## Rôles, accès, séparation des tâches (FR-6, FR-7, FR-25)
- Table d'accès unique (rôles × écrans, rôles × droits) appliquée par le serveur ; la table `DROITS` de la démo est le point de départ, corrigée (ADMIN ne lit plus le métier, ACC ne voit pas le contenu médical, le comptable n'a aucun droit de décision).
- Les contrôles SEP sont des **gardes de transition** côté serveur, doublés d'un plan de contrôle périodique (les gardes peuvent être contournées par une écriture directe en base : le plan de contrôle les détecte). **Écart avec la démo** : dans la démo, `SEP-02` est « contrôle comptable avant décaissement » ; dans ce PRD, `SEP-02` est « celui qui décide ne paie pas » (plan D8) ; le contrôle comptable de la démo est couvert par le rapprochement et la validation d'un ordre par une autre personne.
- Authentification par l'`auth-service` de la plateforme ; double authentification par code temporaire ; comptes de cabinets externes dans un domaine d'identité séparé.
- Chiffrement des champs sensibles au niveau applicatif (identité, téléphone, santé), clés tenues dans un coffre de la compagnie ; à cadrer avec la spine (le modèle de la microfinance ouvre le coffre à deux personnes de rôles métier ; ici non tranché).

## IA (FR-10 à FR-12, §7.4)
- Une seule instance locale de l'IA commune, exposée par une interface interne ; le service métier appelle l'IA de façon asynchrone et n'attend jamais : un délai ou une panne rend un « emplacement vide », jamais une erreur (jamais bloquante).
- OCR : moteur local (Tesseract est le candidat de la démo du document-service) pour les scans ; la lecture de la couche texte reste le chemin rapide des PDF nés numériques. Moteur de classement et d'extraction : règles explicables au premier jour, modèle ensuite ; le choix du modèle de langage local (taille, matériel) dépend du devis des serveurs et n'est pas fixé ici.
- Le compte de service de l'IA n'a que des droits de lecture et d'écriture de propositions ; le **refus d'estimation en corporel** est une règle du service (aucun point d'entrée « montant » sur un dossier à volet corporel), pas seulement de l'écran.
- Les niveaux du registre (`EXTRACTION`, `ANALYSE`, `RECOMMANDATION`) et les statuts (`PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`) sont repris de la démo (`actionsIA`), niveau `DECISION` supprimé.
- Anonymisation des écarts : généralisation et suppression des identifiants, contrôle d'un lot par un filtre de sortie unique, à tester par un lot piégé contenant des identifiants connus.
- Écarts issus de données de santé : exclus à la source (les pièces et champs étiquetés « santé » ne sont jamais des entrées d'un calcul d'écart sortant).
- Tunnel sortant : connexion initiée par l'instance, chiffrée de bout en bout, authentification mutuelle ; aucun port entrant ; distinct du tunnel de support.

## Délais (FR-14)
- Référentiel versionné (date d'effet, source, validateur, statut) ; résolution `référentielÀLaDate(survenance)` ; les délais légaux sont des données du référentiel, pas des paramètres de tenant. Calcul de calendrier : jours ouvrés (calendrier de la compagnie, jours fériés togolais en paramètre) pour les délais internes ; mois civils pour les délais légaux.
- Suspensions et prorogations : événements portant un article, un motif et deux dates ; l'échéance affichée est un calcul sur l'historique des événements, jamais un champ écrasé.
- Pénalité de 5 % par mois : calculée par un composant de référence versionné ; sa base (indemnité totale, solde, montant offert) est une option, à fixer après l'avis du juriste.

## Paiement (FR-220 à FR-225)
- États du règlement (`A_PAYER`, `EN_COURS`, `PARTIEL`, `PAYE`, `ECHEC`, plus `INCONNU` pour l'issue incertaine) et de la quittance (`PRETE`, `EDITEE`, `SIGNEE`, `REMISE`, `ENCAISSEE`) ; clé d'idempotence par ordre, jamais régénérée.
- Le chèque est enregistré dans `paiement` comme un moyen « manuel » (banque, numéro, montant, remise) ; l'impression de la lettre-chèque est un gabarit paramétrable par banque, optionnel.
- Adaptateur Mobile Money sortant (T-Money, Flooz) : à chiffrer au plan comme pour l'IMF ; routage par opérateur à ajouter dans `paiement`, qui ne pilote aujourd'hui que par pays, devise et méthode.
- Acceptation électronique de la quittance par code à usage unique : n'existe qu'après validation juridique ; en attendant, la quittance est signée au guichet.
- Rapprochement : correspondance par numéro de chèque / référence de virement / identifiant d'opérateur, avec une file d'écarts datée ; export de l'état mensuel au format de la comptabilité (format fixé par l'annexe C).

## Installation, relais, support (§7.5 et §7.6)
- Moteur d'installation : agent qui tire, une instance par serveur, espace d'essai et espace réel, fichier de mise à jour signé ; installation sur un serveur applicatif et un NAS séparés, volumes de données et sauvegardes sur le NAS ; configuration minimale issue du test au volume de FR-23.
- Relais Money Vibes : file à écriture durable, accusé après écriture, tirage par l'instance, purge au bout de 7 jours (défaut) ; le relais ne sert que les flux entrants d'internet (réponses WhatsApp, notifications de paiement) ; aucun lien de paiement n'est servi pour l'assurance.
- Supervision locale sans internet (état des services, des sauvegardes, de l'échange avec le LC, du tunnel de l'IA, de la licence) ; événements d'installation envoyés comme alertes à ADMIN.
- Support : tickets avec compteur d'heures ouvrées (calendrier de la compagnie) ; classes bloquante, majeure, mineure ; la définition de « bloquante » est remise à l'installation.

## Démo (FR-15 à FR-17)
- Jeu généré de façon déterministe à partir d'une graine, avec les cinq montants recalculables ; les vérifications du rejeu 2 de la démo actuelle (104) deviennent des tests de recette sur le serveur, jouables par un robot de navigateur ; les parcours `SIN-2026-9001` à `9004` sont des jeux rejouables, remis à zéro par une opération serveur dans l'espace d'essai.
- Logiciel de compagnie fictif : service séparé qui parle le contrat d'échange ; il peut être coupé et rebranché pour tester la liste « à saisir ».

## Points relevés pendant l'écriture, hors périmètre de W1
- Les durées de conservation de 5 ans de la démo (matériel, risques divers, sans suite) sont **inférieures** aux 10 ans du Code CIMA art. 404 (« toutes pièces justificatives ») : par défaut, 10 ans partout ; à trancher avec le juriste (point de départ et nature des dossiers).
- Le « Règlement CIMA n° 002-26 » cité par le code de la démo n'est pas vérifié : non cité.
- Le seuil de délégation de 2 000 000 FCFA de la démo et de l'offre initiale n'est pas repris (le défaut est 1 000 000 FCFA, plan D8) ; l'écart est à confirmer avec les délégations réelles.
- La franchise est déduite du montant arrêté (plan D15) ; l'exemple chiffré de `SIN-2026-9002` dans les parcours (UJ-3) donne 395 500 FCFA (445 500 moins une franchise de 50 000, minimum de la police) à titre d'illustration : la valeur exacte est fixée par le jeu de démonstration.

## Partie 2a — déclaration à l'offre

# Addendum — partie W2 (§5.0 à §5.7, FR-30 à FR-89)

Ce document range ce que le PRD renvoie hors de lui : choix techniques, pistes de mécanisme, options écartées. **Il ne crée aucune exigence.** Les exigences sont dans la partie 2 du PRD ; l'architecture (spine du module `sinistres`) tranchera les mécanismes. Chaque entrée dit d'où vient le renvoi.

## 1. La machine d'états du dossier (FR-30, FR-31, FR-33)

- **Retenu comme piste :** une table de transitions en données (depuis, vers, droit, conditions, motif obligatoire), lue par un seul moteur côté serveur ; l'écran l'interroge pour afficher les actions fermées et leur raison. Le test « aucune impasse » parcourt la table.
- **Écarté :** règles écrites dans l'interface (la démo les avait dans le navigateur, contournables) ; une machine par écran.
- **Journal :** ajout seul (aucune mise à jour, aucune suppression), une ligne par transition et par action ; piste d'une chaîne de hachage pour détecter une altération. Écarté : journal modifiable par `ADMIN`.

## 2. Numéros et références (FR-36, FR-37, FR-38)

- **Référence `DEC-` :** séquence atomique par année, générée au serveur ; un trou doit être détectable (contrôle de séquence). Écarté : numéro généré côté client ou par l'agent.
- **Numéro officiel :** le logiciel de la compagnie (LC) l'attribue ; le dossier attend le retour. Pistes pour le retour : appel direct si une interface existe ; sinon dépôt d'un fichier de déclarations (Excel ou JSON) et lecture d'un fichier de retour, avec **idempotence par la référence `DEC-`**. Écarté au premier jour : numéro provisoire « officiel » généré par Prospera (risque de collision avec la séquence du LC), sauf basculement du paramètre.
- **Doublon :** clé de comparaison normalisée (immatriculation sans espaces ni tirets, police, date, victime) ; correspondance déterministe d'abord. Écarté : correspondance floue sur les noms au premier jour (trop de faux positifs sur des noms courts ou répandus) ; piste pour plus tard.

## 3. Le moteur de décompte et ses référentiels (FR-69 à FR-75)

- **Référentiel versionné à date d'effet** : barème, SMIG, grilles de vétusté, tables du corporel, catalogue de prix ; un dossier est calculé avec la version en vigueur à sa **date de survenance**. Une évaluation arrêtée stocke **une copie des valeurs utilisées** (et non une simple référence), pour que rien ne bouge si le référentiel change. Écarté : constantes dans le code ; référence seule à la version (fragile si la version est corrigée).
- **Tables du corporel :** saisie **double** (deux saisisseurs indépendants, comparaison automatique, arbitrage) à partir des images du PDF officiel, puis jeux d'essai chiffrés. Écarté : reconnaissance optique des tableaux comme voie de saisie (risque d'erreur silencieuse sur des chiffres réglementaires).
- **Arrondi :** appliqué en fin de chaîne, une seule fois ; les étapes intermédiaires gardent leur précision. À régler dans la spine.
- **Ordre franchise / règle proportionnelle :** à trancher avec la compagnie ; le moteur doit permettre de changer l'ordre sans nouvelle version (étapes déclarées en données).

## 4. Les délais et le chronomètre réglementaire (FR-85, FR-48)

- **Moteur d'échéances** : chaque échéance a un point de départ, un point d'arrêt, des **suspensions** (cause, début, fin) et une nature (`REGLEMENTAIRE`, `INTERNE`, `SUIVI`). Le calcul se refait à chaque événement du dossier. Calendrier des jours ouvrés du Togo (jours fériés) à saisir comme référentiel ; convention de calcul des mois (même quantième ; dernier jour du mois si le quantième manque) à faire valider.
- **Pénalité de 5 % par mois :** base de calcul (indemnité totale, montant de l'offre, partie en retard) à faire trancher par le juriste ; le moteur doit pouvoir changer la base sans nouvelle version. Piste : une provision de risque de pénalité mise à jour chaque mois.
- **Écarté :** délais légaux modifiables par l'administrateur (ils relèvent du Code, pas du paramétrage de la compagnie).

## 5. L'IA des sections 5.1 à 5.7 (FR-35, FR-47, FR-53, FR-56, FR-58, FR-60, FR-64, FR-65, FR-74, FR-83)

- **Instance locale** de l'IA commune chez la compagnie ; aucune donnée nominative ni médicale n'en sort ; seuls des écarts anonymisés remontent par le tunnel sécurisé.
- **Repli par règles explicables** pour chaque usage tant qu'un modèle n'est pas installé ; l'interface ne dit pas « IA » dans ce cas.
- **Stabilité :** l'analyse d'un dossier est mise en cache avec la version du dossier ; elle ne change pas tant que le dossier ne change pas (défaut de la démo : tirage au sort à chaque rendu, corrigé).
- **Empreinte de photo** (photo réutilisée) : empreinte perceptuelle calculée en local, comparée aux empreintes du portefeuille ; la démo la simule. Écarté : envoi des images à un service externe.
- **Registre de l'IA :** ajout seul ; une ligne par proposition et par décision de l'agent.
- **Voix :** écartée au premier jour (aucune transcription d'appel, aucune dictée, aucune synthèse). Piste future : reconnaissance vocale locale, hors de ce PRD.
- **Rédaction de l'offre :** contrôle automatique « tous les chiffres du texte existent dans le décompte » avant signature ; mentions légales en blocs verrouillés non modifiables par le modèle. Écarté : génération libre sans verrou sur les mentions.
- **Catalogue de prix des pièces :** à construire pendant la reprise des archives (devis historiques) ; les fourchettes de la démo ne sont pas des références.

## 6. Messageries et canaux de déclaration (FR-34, FR-35, FR-84)

- **WhatsApp :** compte professionnel officiel de la compagnie (interface officielle) ; la réception alimente la file de l'accueil. Écarté : passerelles non officielles (risque de coupure et de conformité).
- **E-mail :** boîte dédiée aux déclarations, lue par le service ; les pièces jointes sont proposées à l'accueil, jamais rattachées seules.
- **SMS :** avis de départ d'une offre ou d'un courrier ; jamais de donnée de santé dans un SMS.

## 7. Comité, délégations, séparation des tâches (FR-78 à FR-81)

- **Matrice de délégation** en données, avec date d'effet ; la décision d'un dossier garde la ligne de la matrice appliquée (copie), comme pour le référentiel.
- **Séparation des tâches :** contrôle sur la **personne**, pas sur le rôle (un utilisateur qui cumule deux rôles ne peut pas tenir deux fonctions incompatibles sur le même dossier).
- **Procès-verbal de séance :** généré, imprimé, signé à la main, **numérisé et rangé** au dossier. Écarté au premier jour : signature électronique du procès-verbal (la valeur probante de la copie et de la signature électroniques n'est pas vérifiée : loi 2017-007 non lue ; à faire examiner par le juriste).
- **Vote en séance :** saisi par le secrétaire de séance sur un poste, avec nom et vote de chaque membre ; écarté : vote à distance par lien (hors besoin exprimé).

## 8. Offre, accord, transaction (FR-82 à FR-89)

- **Courrier :** gabarit de la compagnie en publipostage, pièce PDF archivée ; la signature de l'agent est manuscrite et l'original est scanné, ou apposée selon le choix de la compagnie. Écarté : signature électronique avancée au premier jour (même raison que ci-dessus).
- **Mineurs et incapables :** pièce d'autorisation exigée avant l'ordre ; modèle de suivi de l'avis au juge à 15 jours à construire avec le juriste.
- **Offres successives :** chaque offre est un objet distinct, versionné ; la contre-proposition y est liée. Écarté : modification d'une offre envoyée.

## 9. Données de santé (FR-63, FR-70)

- **Cloisonnement :** les champs et pièces médicales dans un espace séparé, lisibles seulement des rôles autorisés, avec journal de lecture ; chiffrement dédié des champs de santé. Écarté : stockage dans le même espace que les données de gestion avec simple masquage à l'écran.
- La loi 2019-014 (consentement écrit, autorité de protection) est à faire revoir par le juriste avant la mise en service.

## 10. Expertise (FR-58 à FR-68)

- **Règles dures dans l'action** (contre-expertise jamais au cabinet initial ni au panel interne ; classement et règle sont deux choses) : le classement des experts est une aide, la règle est un refus du serveur.
- **Orientation :** règles déterministes explicables d'abord ; un modèle apprend ensuite sur l'historique, sans jamais créer de mission.
- **Complétude d'un rapport :** grille de points par domaine en données (un domaine ajouté sans nouvelle version) ; contrôle de forme seulement.
- **Honoraires :** les cinq montants d'une mission sont des objets distincts reliés aux règlements (§5.8) ; honoraires au prorata de l'indemnité écartés (indépendance de l'expert).

## Partie 2b — paiement à la clôture

# Addendum W3 — choix techniques écartés du PRD (§5.8 à §5.15)

Ces notes ne sont pas des exigences. Elles gardent les choix d'implémentation utiles que le PRD n'a pas à porter.

## §5.8 Payer

- **Statut du dossier dérivé, pas stocké en double.** Le statut `ORDRE_EMIS / CHEQUE_A_REMETTRE / REGLE` peut être calculé depuis l'agrégat des règlements ; mais le statut reste une colonne du dossier (pour les files et les index), mise à jour dans la même transaction que le règlement. Un test de cohérence rejoue le calcul et compare.
- **Idempotence du paiement électronique.** La référence du règlement sert de clé d'idempotence vers `paiement` (un seul paiement par clé) ; la confirmation de `paiement` arrive par événement, rejouable.
- **Numérotation des chèques.** Contrôle de séquence par banque et par chéquier : l'index unique (banque, numéro) refuse le doublon ; l'alerte de trou est un calcul périodique, non bloquant.
- **Montants.** Entiers en FCFA (pas de décimales), jamais de flottants ; arrondi du calcul de pénalité (5 % par mois) au franc supérieur `[à confirmer avec le juriste]`.
- **Gabarit de lettre-chèque.** Rendu côté serveur à partir d'un modèle administrable (PDF) ; aucune mise en page bancaire n'est figée dans le code. Alternative écartée : impression directe sur imprimante de chèques via pilote local (dépend du poste).
- **Signature de la quittance.** Alternative écartée : signature sur tablette au guichet (dépendance matérielle, valeur probante non établie) ; retenue : manuscrite scannée, puis option du code à usage unique après revue juridique.
- **Ordre de règlement comme objet à part.** La démo dérive l'ordre du numéro de quittance et le génère ; le serveur réel crée l'ordre par l'action d'accord (FR-90) et en dérive les quittances.
- **Export comptable.** Natures d'opération neutres (INDEMNITE, ACOMPTE, HONORAIRES, RECOURS_ENCAISSE) plutôt que comptes CIMA : la compagnie mappe vers son plan. Le plan de comptes de la démo (600100, 600200, 600500…) reste un exemple de paramétrage, pas une exigence.

## §5.9 Clore

- **Provision zéro à la clôture.** Alternative écartée : laisser la provision jusqu'au versement aux archives. Retenu : zéro à la clôture, car l'état des provisions (PSAP) ne doit compter que des dossiers vivants.
- **Réouverture = nouvelle période d'instruction.** Le dossier garde une liste de « périodes » (ouverture, clôture) plutôt qu'une date de clôture écrasée ; les indicateurs de délai se calculent sur la période courante.

## §5.10 Recours

- **Deux machines, deux tables.** Le recours a sa table de statuts et de transitions, le dossier la sienne ; elles ne partagent que la clé du dossier. Alternative écartée : sous-statut du dossier (mélange les droits, bloque la clôture).
- **Moteur de transitions unique et déclaratif.** Les deux machines (dossier, recours) sont décrites par une même forme de table (depuis, vers, rôles, conditions nommées, motif) lue par le même moteur ; les conditions sont des fonctions nommées enregistrées. Alternative écartée : un `switch` par machine (la démo, qui dupliquait les règles dans l'interface).
- **Calcul du terme de prescription.** Fonction pure paramétrée par fondement ; jamais de drapeau « prescrit » stocké.
- **Génération des lettres.** Modèles administrables avec variables ; le brouillon IA et la version finale sont deux versions du même courrier, pas deux courriers.
- **Rapprochement des encaissements.** À brancher sur l'import de relevé de `paiement` ; en attendant, saisie manuelle avec justificatif. Alternative écartée : rapprochement dans Prospera (duplique `paiement`, décision D16).

## §5.11 Les sorties

- **Courriers : un seul moteur de modèles.** Les 7 modèles de la démo et les modèles de refus, classement et accusé passent par le même moteur (variables, mentions obligatoires verrouillables) ; un modèle sans mention obligatoire ne se publie pas. Alternative écartée : texte libre produit par l'IA sans modèle.
- **Brouillon IA et version signée.** Deux versions du même courrier ; la signature fige la version envoyée (empreinte), le brouillon reste consultable.

## §5.12 La fraude

- **Signaux comme fonctions nommées.** Un signal est une règle explicable (entrée, calcul, détail chiffré, source) enregistrée dans un catalogue ; la compagnie ajoute un signal par paramétrage de règle, pas par code, dans la limite d'un jeu de gabarits (comptage par entité, délai, rapport à une moyenne).
- **Revue simulée dans la démo.** La démo tirait l'état de revue du score de façon déterministe ; le serveur réel le tient comme donnée avec conclusion écrite.
- **Graphe de liens.** Calcul par entité normalisée (téléphone, immatriculation, compte de paiement) en base relationnelle classique ; un moteur de graphe dédié est écarté tant que le volume (hypothèse : 50 000 dossiers archivés) ne l'exige pas. Empreinte de photo : calculée sur place, jamais envoyée hors de l'instance locale.
- **Blocage.** La condition `AUCUN_SIGNAL_BLOQUANT` est évaluée par le serveur au moment de chaque transition concernée, jamais mise en cache.

## §5.13 La machine à états

- **Table de données lue par un moteur.** Les 41 transitions sont une table (identifiant, depuis, vers, rôles, conditions nommées, motif) ; les conditions sont des fonctions nommées enregistrées auprès du moteur ; les droits viennent de la matrice d'accès (annexe B). Alternatives écartées : un `switch` par statut (la démo, dont les règles étaient dans le navigateur) ; une bibliothèque de machines à états générique avec gardes anonymes (les refus n'auraient pas de code stable).
- **Verrou optimiste.** Chaque dossier porte une version ; une transition envoie la version lue ; la base refuse l'écriture si elle a changé (`ETAT_PERIME`). Alternative écartée : verrou pessimiste par dossier (bloque les files).
- **Rejeu et idempotence.** Chaque demande porte un identifiant ; le journal d'audit stocke l'identifiant et renvoie le même résultat à un rejeu.
- **Audit append-only.** Table d'audit sans mise à jour ni suppression (droits de base, chaînage d'empreintes optionnel) ; alternative écartée : journal applicatif dans des fichiers (pas de requête, pas d'export fiable).
- **Statuts dérivés des règlements.** Voir §5.8 : la transition vers `ORDRE_EMIS`, `CHEQUE_A_REMETTRE` et `REGLE` est une conséquence des événements de règlement, appliquée dans la même transaction.
- **Texte des conditions.** Catalogue de textes versionné, administrable en français (la démo parlait aussi anglais pour l'assistant : l'anglais n'est pas exigé ici).

## §5.14 Délais et alertes

- **Moteur d'échéances.** Les échéances sont calculées à la demande depuis les événements datés du dossier et le référentiel versionné à la date de survenance ; elles ne sont pas stockées comme dates figées, sauf la date limite légale calculée à l'ouverture (pour la figer en cas de changement de référentiel). Alternative écartée : planificateur qui pose des alertes datées (désynchronisé dès qu'une suspension est saisie).
- **Calendrier.** Jours ouvrés selon un calendrier de la compagnie (jours fériés togolais en paramètre) ; les mois sont des mois civils. La règle de comptage reste un point juridique.
- **Alertes.** Un seul modèle d'alerte (règle, seuil, destinataire, canal, texte) pour les délais, les relances, les muets et les pièces bloquantes, comme le PRD distributeur (PRD-D FR-14). Le calcul des muets tourne chaque nuit ; les échéances proches à chaque ouverture de file.
- **Relances.** Le module `notification` envoie ; Prospera garde le journal métier (canal, résultat) et reçoit l'accusé de transmission ; alternative écartée : envoyer depuis l'application sans passer par le module.

## §5.15 Notifications et écrans

- **Événements métier, pas appels directs.** Le circuit publie des événements (déclaration enregistrée, offre envoyée, règlement émis, etc.) ; `notification` les traduit en messages selon un tableau événement, destinataire, canal, modèle. Alternative écartée : envois codés dans chaque action du circuit.
- **Files comme requêtes enregistrées.** Chaque file (corbeille, validation, comptabilité, guichet, recours, contrôle) est une requête filtrée par rôle et volet, avec tri et compteurs calculés côté serveur ; pas de logique de filtrage dans le navigateur (la démo filtrait côté client).
- **Aucun texte « fraude » dans les modèles sortants.** Garde-fou testable par balayage des modèles de messages ; alternative écartée : filtrer à l'envoi.

## Partie 3 — modules propres

# Addendum de la partie 3 (W4) — choix techniques écartés ou renvoyés hors du PRD

Ce fichier garde les choix techniques que le PRD ne décrit pas (le PRD décrit des capacités, pas une implémentation). Pour chaque point : ce qui est **proposé**, ce qui est **écarté**, et **pourquoi**. Tout est une proposition pour la spine ; rien n'engage l'architecture (plan, D18). Les points marqués `[À CADRER]` attendent les spines des modules `liaison-assureur` (M48 [proposition]), `assureur-fictif` et l'extension de `document-service`.

## A-1. Échange avec le logiciel de la compagnie (FR-194 à FR-201, annexe C)

- **Proposé.** Deux transports derrière un même contrat : (1) API interrogée par Prospera, (2) fichiers Excel ou JSON déposés ou relevés dans un emplacement partagé du réseau de la compagnie (dossier partagé ou transfert de fichiers sécurisé, au choix de la compagnie). Les fichiers sont des **lots** (identifiant, version du contrat, empreinte). Les envois sortants passent par une **file persistante** (principe d'une boîte d'envoi) : rien n'est perdu pendant une coupure, l'ordre est conservé, un envoi n'est marqué « accepté » que sur l'accusé du LC (C-12). L'idempotence repose sur la **clé d'origine** de chaque objet et sur l'identifiant de lot.
- **Écarté : un appel entrant du LC vers Prospera (webhook).** Il ouvre un port entrant chez la compagnie et oblige à exposer Prospera à un système inconnu. Prospera tire. `[ASSUMPTION: règle de la microfinance reprise ; si le LC futur pousse des événements, il les dépose dans l'emplacement partagé]`.
- **Écarté : lire ou écrire directement dans la base du LC.** Le PRD ne connaît ni sa base ni son schéma (il sera libre en janvier) ; une écriture directe contourne ses contrôles. Seule l'API ou le fichier est admise.
- **Écarté : un connecteur écrit pour un produit supposé.** Le PO a décidé de ne pas spéculer. Le connecteur du LC réel sera une **table de correspondance** de ses champs vers l'annexe C, écrite quand il sera connu.
- **Écarté : bloquer la déclaration tant que le LC n'a pas répondu.** Une coupure du LC arrêterait l'accueil. La référence `DEC-` est attribuée localement.
- **Écarté : attribuer le numéro de sinistre dans Prospera seul au premier jour.** Le PO a dit que le numéro est détenu par le LC « pour un début ». Le paramètre « qui attribue » garde la porte ouverte sans reprise du code.
- **À cadrer.** Authentification de l'API (jeton, certificat), format exact des fichiers Excel (une feuille par objet, types de colonnes), taille maximale d'un lot, encodage et séparateurs pour le CSV, durée de conservation des lots, supervision de la file d'envoi.

## A-2. Recherche unique (FR-150, FR-151, FR-155)

- **Proposé.** Un **index de recherche local** sur le serveur de la compagnie, alimenté à chaque écriture, avec normalisation (minuscules, sans accents ni ponctuation), repli par préfixe, et un champ par critère (nom, police, téléphone, immatriculation, numéro de sinistre, `DEC-`, numéro d'archivage). La recherche en langage naturel traduit la question en critères structurés puis interroge ce même index.
- **Écarté : un service de recherche hébergé hors du site.** Il ferait sortir des noms, téléphones et références de santé ; l'instance est locale (D1).
- **Écarté : une tolérance aux fautes par distance d'édition sur tout le mot au premier jour.** Elle ramène des faux résultats sur des noms proches. Le repli par préfixe de la démo suffit ; à revoir après les premières semaines `[ASSUMPTION]`.
- **Écarté : un moteur de recherche en langage naturel qui répond sans montrer ses critères.** Un résultat qu'on ne peut pas corriger n'est pas vérifiable (FR-155).
- **À cadrer.** Mise à jour de l'index pendant la reprise de masse (reconstruction par lots), mesure du 95e centile sur 50 000 dossiers et 1,5 million de pages, gestion des droits par volet dans l'index.

## A-3. Pièces, OCR, classement (FR-159 à FR-166)

- **Proposé.** L'OCR est un **service en file**, tourne dans l'instance de la compagnie, lit les images et les PDF scannés (rasterisation préalable des PDF sans couche texte), et range le texte lu **à côté** de la pièce. Le classement par l'IA commune est un autre traitement qui lit ce texte et l'image ; ses résultats arrivent comme **propositions** dans le registre de l'IA.
- **Rappel de la plateforme.** `document-service` est le service OCR existant ; il ne lit pas directement un PDF scanné et un consommateur peut mourir dans un conteneur « sain » (mémoire de la plateforme). Ces points se vérifient dans la spine de l'extension `[À CADRER]`.
- **Écarté : un OCR dans le navigateur.** C'est ce que fait la démo (couche texte des PDF, par un composant du navigateur) ; il ne lit pas un scan.
- **Écarté : un OCR ou un classement dans un service en nuage.** Les pièces de santé ne sortent pas de l'instance (D1, D13).
- **Écarté : un rattachement automatique sans confirmation humaine.** La démo rattache sur type reconnu ; le PRD exige le contrôle de FR-165 avant archivage.
- **À cadrer.** Moteur d'OCR retenu, langues (français ; noms locaux), temps par page, file d'attente en cas de lot de reprise, antivirus (fournisseur de la compagnie).

## A-4. Archives numériques et scellement (FR-167 à FR-176)

- **Proposé.** Numéro d'archivage par **séquence atomique** par année de clôture et par volet. Empreinte de scellement : empreinte d'un résumé ordonné (liste des empreintes de chaque pièce dans l'ordre du bordereau), par une fonction de hachage courante ; l'empreinte et la date sont enregistrées avec le dossier. Stockage des fichiers sur le **NAS** de la compagnie, monté par le serveur applicatif, un chemin dérivé de l'identifiant de pièce (jamais du nom du fichier).
- **Écarté : calculer le numéro en prenant le maximum existant plus un** (comme la démo). Deux versements simultanés peuvent recevoir le même numéro et la destruction rouvrirait un numéro.
- **Écarté au premier jour : l'horodatage par un prestataire qualifié et le stockage non réinscriptible matériel.** Ils sont des options pour les pièces à forte valeur probante. Le décret de 2018 sur les services de confiance (art. 3 : horodatage, archivage électronique) et ses référentiels existent ; leur application aux pièces de sinistre est à valider par le juriste (D21).
- **Écarté : un format propriétaire d'archive.** PDF/A pour la lisibilité sur 10 ans `[ASSUMPTION]`.
- **Écarté : un bouton de suppression de pièce.** La suppression passe par la décision visée de FR-175.
- **À cadrer.** Stratégie de sauvegarde du NAS (copie hors site de la compagnie, durée de rétention), restauration partielle, échelle de la vérification d'empreinte (une nuit par lots).

## A-5. Provisions, états, export comptable (FR-188 à FR-193)

- **Proposé.** La provision est un **journal de mouvements** ajoutés (jamais modifiés) ; l'état PSAP est une **vue calculée à la date d'arrêté** depuis les mouvements. Les cessions sont calculées au moment de chaque mouvement, avec le traité du millésime de survenance, et enregistrées avec lui. L'export comptable est produit par un modèle de correspondance nature vers compte.
- **Écarté : stocker un total de provision mis à jour.** Il perd l'historique que le Code CIMA suppose (dossier par dossier, avec révisions) et empêche l'état à une date passée.
- **Écarté : calculer l'IBNR dans Prospera.** Il relève d'une circulaire de la CRCA et de la direction technique ; Prospera fournit les données.
- **Écarté : produire l'état réglementaire officiel.** Le contenu des états est à préciser par le juriste (FR-192) ; Prospera fournit les données de base.
- **À cadrer.** Le plan de comptes de la compagnie, la périodicité des exports, le rapprochement avec `paiement`, les traités réels.

## A-6. Pilotage et contrôle interne (FR-206 à FR-213)

- **Proposé.** Des **projections** calculées à partir du journal et des tables du dossier, rafraîchies au plus toutes les 5 minutes `[ASSUMPTION]` ; l'affichage passe par `dashboard` (M28), qui ne contient aucune logique de calcul. Les règles du plan de contrôle sont des requêtes paramétrées, exécutées de nuit et à la demande.
- **Écarté : des chiffres générés par un tirage ou des constantes** (la démo en contient beaucoup) ; chaque test de FR-212 le vérifie.
- **Écarté : un modèle d'IA qui note un dossier sans règle visible.** La note distingue constats certains (règles) et probables (analyse).
- **À cadrer.** Granularité des tranches temporelles, droits par volet dans les projections, conservation des constats du contrôle.

## A-7. L'IA (FR-154, FR-155, FR-157, FR-164, FR-208, FR-209)

- **Proposé.** Chaque usage appelle l'**IA commune** (instance locale) par son contrat ; les 14 usages et les garde-fous sont ceux de D13. Le registre de l'IA reçoit une ligne par appel. Une capacité sans modèle installé retombe sur des règles explicables et l'affiche.
- **Écarté : un appel à un modèle externe.** Aucune donnée nominative ni médicale ne sort (D1) ; seuls des écarts anonymisés remontent par tunnel sécurisé.
- **Écarté : la voix.** Aucune dictée, transcription ni synthèse vocale ; le chatbot de l'assuré du deck est « bientôt » (D13).
- **Écarté : une décision automatique.** Aucune IA ne valide, refuse ni paie ; elle ne propose jamais de montant sur un préjudice corporel.

## A-8. Reprise et vie en parallèle (FR-214 à FR-219)

- **Proposé.** La reprise utilise le module M44 : adaptateur **fichiers** (Excel, CSV, JSON) au premier jour, adaptateur **API** avec le LC connu ; chaque cible expose un **point d'import idempotent** ; la resynchronisation nocturne rejoue le même chemin d'import avec les changements depuis la dernière nuit. Un dossier porte un indicateur « suivi » ou « tenu par Prospera » ; le passage à « tenu » se fait à la première action de dossier. Un écart sur un champ tenu par Prospera va dans la file des écarts du module `liaison-assureur`.
- **Écarté : le scan du stock papier comme voie de reprise.** Décision du PO ; le papier reste tenu avec sa cote.
- **Écarté : une écriture bidirectionnelle automatique entre Prospera et le LC pendant le parallèle.** Elle crée des conflits que personne ne voit. Le PRD choisit : le LC l'emporte sur les contrats, Prospera l'emporte sur le dossier qu'il tient, les écarts sont montrés.
- **Écarté : la règle « dernier écrit gagne ».** Elle écraserait en silence une décision motivée.
- **Écarté : une fusion automatique des doublons.** La fusion reste sous contrôle humain (PRD Reprise FR-12).
- **À cadrer.** Le chevauchement avec la marche en parallèle du PRD Reprise (FR-17) et avec le module Connecteurs (qui relève le logiciel du client en lecture seule) : une seule lecture nocturne du système de la compagnie doit nourrir à la fois la resynchronisation et le rapport d'écarts de la période `[À CADRER]` ; clés de rattachement fournies à la GED ; format de l'état « tenu par » dans le point d'import.

## A-9. Portail expert, droits et journal (FR-153, FR-158, FR-177 à FR-185)

- **Proposé.** Le portail est une **vue de la même application** pour le rôle `EXPE`, avec un périmètre **par mission** (la liste des pièces est choisie par le gestionnaire et liée à la mission) ; l'authentification à deux facteurs. Les droits par volet et par donnée de santé reposent sur des attributs du dossier, évalués côté serveur. Le journal est un **journal ajouté seulement**, avec une empreinte chaînée entre lignes pour détecter une altération `[ASSUMPTION]`.
- **Écarté : un portail séparé avec sa propre base.** Il dupliquerait les pièces et les décisions.
- **Écarté : l'envoi du dossier par e-mail ordinaire à un cabinet.** C'est le canal des fuites ; l'e-mail ne sert qu'à notifier qu'une mission attend.
- **Écarté : des droits contrôlés seulement dans le navigateur** (la démo) : tout contrôle d'accès est serveur (constat 1 de la démo).
- **À cadrer.** Comptes de cabinets (création, désactivation), expiration des liens, durée de visibilité d'une mission terminée.

## A-10. Le logiciel de compagnie fictif (FR-202 à FR-205)

- **Proposé.** Un service **séparé**, alimenté par des jeux de données **déterministes** (graine fixe, même résultat à chaque remise à zéro), qui parle le contrat de l'annexe C par API et par fichiers, avec des **réglages d'essai** (panne, refus, retard, changement de police). Il est déclaré dans le manifeste du module comme **réservé à l'espace d'essai** : le bilan d'installation d'un espace réel échoue s'il est présent.
- **Écarté : un mode « simulation » dans le code de Prospera.** Le fictif doit parler comme un vrai LC, par les mêmes transports, sinon la démonstration ne prouve rien.
- **Écarté : des données copiées d'un client réel.** Toutes les données du jeu sont fictives.
- **À cadrer.** Le poids du jeu de 25 000 contrats et 3 500 dossiers, les 104 vérifications du second rejeu de la démo à reprendre comme tests de recette sur le vrai serveur (D19), le moment où le jeu est livré par rapport au premier jour.

