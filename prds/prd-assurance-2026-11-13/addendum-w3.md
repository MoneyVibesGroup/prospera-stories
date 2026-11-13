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
