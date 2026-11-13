# Triage des 102 hypothèses du PRD Microfinance (2026-11-13)

Source : `prd.md` §13 (H-1 à H-102), texte des FR citées, décisions du PO (`questions-po-2026-11-13.md`, `corrections.md`, `.memlog.md`), §12.2 (Q5 à Q13), annexe D. `prd.md` n'est pas modifié ; la colonne « Action » dit quoi y changer.

Catégories : **DÉCIDÉE** (une décision du PO la tranche : retirer la balise, écrire la règle) ; **DÉFAUT** (valeur ou règle par défaut modifiable par l'IMF : retirer la balise, « défaut (annexe D) ») ; **JURISTE** (texte légal : garder, renvoi §12.3) ; **BLOQUANTE** (question au PO, §2) ; **OUVERTE** (balise gardée, responsable et condition de révision).

Trois constats de forme à corriger au passage :
- FR-49 renvoie le barème du score à « H-30 » ; l'hypothèse du barème est **H-41** (H-30 est l'annuité constante).
- H-23 à H-28 sont les lignes du tableau FR-86, qui répètent H-14, H-11 (règles d'alerte), H-15, H-16, H-19, H-21 : une seule source, l'annexe D ; retirer les balises du tableau FR-86 et le faire renvoyer à l'annexe D.
- NFR-2 dit 15 min pour la fraîcheur ; l'annexe D dit 5 min (API), heure ou nuit : aligner NFR-2 sur l'annexe D (H-98).

## 1. Tableau

| H | FR | Résumé | Catégorie | Justification | Action |
|---|---|---|---|---|---|
| H-1 | §1 | PAR 30 mesuré depuis le cœur, baisse en valeur relative | DÉFAUT | Définition de mesure sans enjeu d'architecture ; PAR 30 fixé par D5 | Retirer la balise : « baisse relative de 15 à 25 %, PAR 30 en % de l'encours (défaut ; cible confirmée à la présentation à l'IMF) » |
| H-2 | §2.3 | Noms fictifs des protagonistes | DÉFAUT | Cosmétique du jeu de démo ; Q12 propose les noms | Retirer la balise : « noms du jeu de démo (Q12, modifiables) » |
| H-3 | FR-4 | Méthode et fréquence de calcul des seuils d'alerte | DÉFAUT | E5 décide le principe (données de l'IMF, humain valide, recalcul périodique) ; trimestriel et percentiles = défaut (annexe D, FR-178) | « recalcul trimestriel par percentiles de l'IMF, validé par un humain (défaut, annexe D) » |
| H-4 | FR-5 | Clés de chiffrement hors du compte ADMIN_IMF | OUVERTE | Décision d'architecture (gestion des clés) ; pas une question au PO | Garder ; responsable Dev B (spine/addendum) ; révision à l'écriture de l'architecture du module `microfinance` |
| H-5 | FR-7 | Nomenclature de départ des secteurs d'activité | OUVERTE | Partagée entre verticales et remontée à l'IA commune ; décide d'une donnée obligatoire sur chaque client | Garder ; responsable PO ; à figer avant la reprise des données et avant le premier écran de saisie du secteur |
| H-6 | FR-8 | Sources macro-économiques de départ | OUVERTE | Q10 non répondue ; sans effet sur la structure (règle v0, source datée) | Garder ; responsable PO (Q10) ; révision au cadrage du module Risque de l'IA commune ou à l'arrivée de Pulse |
| H-7 | FR-11 | Togo, agences Lomé-Centre/Kpalimé/Kara, nom de l'IMF fictive | DÉFAUT | Q12 propose ces valeurs ; D-8 (opérateurs par pays) les rend paramètres | « démo au Togo (Flooz, Mixx, PI-SPI), agences Lomé-Centre, Kpalimé, Kara (défaut ; nom de l'IMF au jeu de démo) » |
| H-8 | FR-14 | Langues locales « bientôt » | DÉFAUT | C16 : français d'abord | « français ; langues locales : bientôt (hors v1) » |
| H-9 | FR-36 | Date d'effet d'un nouveau plafond d'usure | DÉFAUT | Règle interne (dossiers décidés non rouverts, alerte de conformité) | Retirer la balise ; règle par défaut |
| H-10 | FR-44 | Consultation du BIC obligatoire ou non | JURISTE | Obligation légale non confirmée ; C18 décide la saisie manuelle, pas l'obligation | Garder la balise ; déjà en §12.3 (« obligation de consulter le BIC ») |
| H-11 | FR-48 | Gravités et règles d'alerte d'instruction | DÉFAUT | Valeurs en annexe D, calibrées ensuite (E5) | « défauts de départ (annexe D) » |
| H-12 | FR-49 | Score 0-100, décomposition 40/30/20/10 | DÉCIDÉE | C11 (acceptée) | « barème fixé par la décision C11 » ; corriger le renvoi H-30 en H-41 |
| H-13 | FR-49 | Règle explicable versionnée tant que le modèle n'existe pas | DÉCIDÉE | C12 acceptée (règles explicables, provenance) ; F3/F6, P9 | « règle v0 explicable et versionnée (C12) » |
| H-14 | FR-49 | Alerte AUD si alignement > 95 % sur 50 décisions | DÉFAUT | A25 décide l'alerte ; seuil = paramètre (annexe D) | « défaut 95 % sur 50 décisions (annexe D) » |
| H-15 | FR-52 | Seuil de l'avis du risque 2 000 000 FCFA | DÉFAUT | Q11 propose ce défaut ; C5 décide l'avis | « défaut 2 000 000 FCFA (annexe D) » |
| H-16 | FR-55 | 2 retours pour garanties | DÉFAUT | Paramètre, Q11 | « défaut 2 (annexe D) » |
| H-17 | FR-58 | Plafond parties liées non vérifiable sans fonds propres | DÉFAUT | C17 décide le plafond ; repli manuel = règle par défaut | Retirer la balise ; garder la mention « plafond non vérifiable » |
| H-18 | FR-59 | Première échéance un mois après le décaissement prévu | DÉFAUT | Paramètre (annexe D) | « défaut un mois (annexe D) » |
| H-19 | FR-64 | Ordre sans réponse : INCONNU après 24 h | DÉFAUT | A4 décide INCONNU et le rapprochement ; délai = Q11 | « défaut 24 h (annexe D) » |
| H-20 | FR-73 | Répartition, solidarité et vote d'un groupe non définis | DÉCIDÉE | C14 (sous-dossier par membre, caution solidaire, une décision) ; P6 (vote enregistré) | « répartition par sous-dossier saisie par le comité ; solidarité = caution solidaire (C14) ; vote de chaque membre enregistré (P6) » |
| H-21 | FR-74 | Contagion : 2 membres ou 20 %, 7 jours | DÉFAUT | Paramètres (annexe D) | « défaut (annexe D) » |
| H-22 | FR-271 | Solde de l'ancien prêt retenu sur le net versé | BLOQUANTE | Flux d'argent : P4 dit « solde l'ancien prêt au décaissement confirmé », pas comment | Question B3 (§2) |
| H-23 | FR-86 | Tableau : alignement 95 % / 50 | DÉFAUT | Doublon de H-14 | Retirer la balise du tableau ; renvoyer à l'annexe D |
| H-24 | FR-86 | Tableau : règles d'alerte d'instruction | DÉFAUT | Doublon de H-11 | Idem |
| H-25 | FR-86 | Tableau : avis du risque 2 000 000 | DÉFAUT | Doublon de H-15 | Idem |
| H-26 | FR-86 | Tableau : retours pour garanties | DÉFAUT | Doublon de H-16 | Idem |
| H-27 | FR-86 | Tableau : ordre non exécuté 24 h ; fenêtre 1 h | DÉFAUT | Doublon de H-19 ; 1 h = RPO (Q13 : défauts gardés) | Idem |
| H-28 | FR-86 | Tableau : contagion de groupe | DÉFAUT | Doublon de H-21 | Idem |
| H-29 | FR-100 | Auteur et publicateur d'un produit = deux personnes | DÉFAUT | Aligné sur D-9/FR-6 (séparation des tâches) ; la démo dit seulement « administrateur ou DAF » | Retirer la balise ; supprimer la citation de l'instruction 017-12-2010 ou la renvoyer à la liste juriste (voir H-96) |
| H-30 | FR-102 | Annuité constante par défaut | DÉCIDÉE | C8 (acceptée) | « annuité constante par défaut (décision C8) » |
| H-31 | FR-111 | Taux des autres produits de démo fixés à la rédaction du jeu | DÉFAUT | Contrainte = test du pire cas (FR-111) | « taux fixés au jeu de démo sous contrainte du test » |
| H-32 | FR-111 | Valeurs du tableau de TEG à valider par un juriste | JURISTE | Méthode du TEG, §12.3 | Garder ; §12.3 (« TEG : décret, frais exclus, assurance ») |
| H-33 | FR-116 | Clé de correspondance = numéro de client du cœur | DÉCIDÉE | T4 (une personne, son identifiant du cœur) | « clé = identifiant du cœur (T4) » |
| H-34 | FR-119 | Pièces par niveau de KYC, seuils de montant | JURISTE | Dépend des instructions LBC/FT du 18/03/2025, non lues en détail | Garder ; §12.3 (instructions LBC/FT) |
| H-35 | FR-120 | « Agent conformité » = habilitation, pas un 17e rôle | DÉCIDÉE | T3 (CC ou agent conformité), F1 (16 rôles), F7 (DG valide les rôles sensibles) | « habilitation accordée par le DG (T3, F1, F7) » |
| H-36 | FR-121 | Sources et fréquence des listes de sanctions | JURISTE | Listes imposées par texte ; la fréquence quotidienne est un défaut (annexe D, E3) | Garder ; ajouter « listes de sanctions applicables » à §12.3 |
| H-37 | FR-121 | Délais de gel 24 h et de déclaration 72 h | JURISTE | Procédure légale | Garder ; §12.3 |
| H-38 | FR-121 | Aucun message au client sur la déclaration | JURISTE | Règle de secret de la déclaration | Garder ; §12.3 |
| H-39 | FR-122 | Revue du KYC 12/24/36 mois | DÉFAUT | E3 : revue périodique voulue ; durées paramétrables | « défauts 12/24/36 mois (annexe D), validés par la conformité de l'IMF » |
| H-40 | FR-123 | Liste des huit scénarios de soupçon | JURISTE | « à valider par un juriste » ; chaque scénario reste activable | Garder ; §12.3 |
| H-41 | FR-124 | Barème du score v0 | DÉCIDÉE | C11 (acceptée) | « barème fixé par C11 » |
| H-42 | FR-124 | Écart d'équité 10 points sur 30 demandes | DÉFAUT | Calibré (E5) | « défaut (annexe D), à calibrer » |
| H-43 | FR-132 | Conservation, texte des consentements, hébergement local | JURISTE | Texte légal par pays (§12.3 : hébergement, géolocalisation) | Garder ; §12.3 |
| H-44 | FR-139 | Tolérance d'arrondi 5 FCFA | DÉFAUT | A8 décide le paramètre distinct ; valeur = défaut | « défaut 5 FCFA (annexe D) » |
| H-45 | FR-143 | Plafond de détention du fonds de caisse | DÉFAUT | Calibré après la reprise (E5) | « défaut 100 000 FCFA, calibré (annexe D) » |
| H-46 | FR-272 | Définitions des taux (3) à (5) et de la couverture (7) | OUVERTE | Formules de pilotage à confirmer avec le DG de l'IMF | Garder ; responsable PO avec le DG de l'IMF ; révision avant la recette du module `risque-par` |
| H-47 | FR-178 | Calibrage par percentiles, sans modèle | DÉCIDÉE | E5 + C12 (règles explicables) | « percentiles de l'IMF, règle explicable (E5, C12) » |
| H-48 | FR-179 | Valeur de départ (hausse anormale du PAR 30) | DÉFAUT | Paramètre (annexe D) | « défaut 0,8 point (annexe D) » |
| H-49 | FR-181 | Décote des garanties à 0 % | DÉFAUT | Paramètre, calibré | « défaut 0 % (annexe D) » |
| H-50 | FR-181 | Score de risque v0 au barème de la partie 2 | DÉCIDÉE | C11 | Idem H-41 |
| H-51 | FR-187 | Balance au plan SFD ; table de correspondance à la charge de l'IMF | OUVERTE | E1 décide l'import ; qui paie le mapping est commercial ; format de départ reporté « à la présentation » | Garder ; responsable PO ; révision à la présentation à l'IMF |
| H-52 | FR-198 | Point de coupure import / échange permanent | OUVERTE | Reprise : format reporté à la présentation | Garder ; responsable PO ; révision à la présentation ; l'IMF date la coupure à la mise en service |
| H-53 | FR-204 | Verrouillage après 5 min | DÉFAUT | A27 décide le verrouillage ; durée paramétrable | « défaut 5 min (annexe D) » |
| H-54 | FR-204 | Effacement après 14 jours sans connexion | DÉFAUT | A27 décide l'effacement ; délai paramétrable | « défaut 14 jours (annexe D) » |
| H-55 | FR-204 | Éléments non envoyés gardés chiffrés | DÉFAUT | Règle de sûreté (ne pas perdre une collecte) | Retirer la balise ; règle par défaut |
| H-56 | FR-207 | Audio non conservé après conversion | JURISTE | Données de voix, §12.3 | Garder ; §12.3 |
| H-57 | FR-209 | Suspension de la relance 48 h en attente du cœur | DÉFAUT | Conséquence de A1 et P1 ; durée en annexe D | « défaut 48 h (annexe D) » |
| H-58 | FR-210 | « Quelques FCFA » de tolérance | DÉFAUT | Même valeur que H-44 | « défaut 5 FCFA (annexe D) » |
| H-59 | FR-212 | SMS de J+3 validé par le GP | DÉCIDÉE | D11 : J-3 et J+1 automatiques, au-delà validés | « J+3 validé par le GP (D11) » |
| H-60 | FR-212 | Âge maximal de la lecture du reste dû : 15 min | DÉFAUT | P1 décide le principe (relecture avant lien) ; valeur = défaut | « défaut 15 min API, 1 h fichiers (annexe D) » |
| H-61 | FR-217 | Mise en demeure signée du DG | DÉFAUT | Gabarit de l'IMF ; signataire paramétrable | Retirer la balise ; « signataire par défaut : DG » |
| H-62 | FR-217 | Pas de rôle « juriste » | DÉCIDÉE | F1 (16 rôles) | « pas de rôle juriste (F1) » |
| H-63 | FR-218 | Délai d'examen d'un recours : aucune valeur | OUVERTE | P7 décide le recours ; l'IMF fixe le délai | Garder ; responsable DG de l'IMF ; à fixer avant la mise en service (valeur fictive dans la démo) |
| H-64 | FR-219 | Rappel d'une proposition refusée à J+120 | DÉFAUT | Paramètre | « défaut J+120 (annexe D) » |
| H-65 | FR-220 | Pénalités pendant un plan laissées au cœur | DÉCIDÉE | A4 (le cœur calcule les pénalités) ; clôt la moitié de Q8 | « Prospera ne gèle aucune pénalité (A4) » |
| H-66 | FR-221 | Seuil de passage de la perte au conseil | OUVERTE | D3 décide le principe ; valeur sans défaut (Q8) | Garder ; responsable DG de l'IMF ; avant la recette du recouvrement (valeur fictive en démo) |
| H-67 | FR-226 | Canal choisi par l'IA pour J-3/J+1 | DÉFAUT | Éteint par défaut | « défaut : éteint (annexe D) » |
| H-68 | FR-227 | Poids du score de recouvrement (total 100) | DÉFAUT | D8 décide la règle ; poids paramétrables, calibrés | « défaut (annexe D), calibré » |
| H-69 | FR-228 | Relecture de l'analyse à 7 jours | DÉFAUT | Paramètre | « défaut 7 jours (annexe D) » |
| H-70 | FR-231 | Rafraîchissement du tableau de bord 5 min | DÉFAUT | Paramètre | « défaut 5 min (annexe D) » |
| H-71 | FR-234 | Chaîne de remontée des alertes | DÉFAUT | F12 décide 48 h puis supérieur ; la chaîne par défaut suit l'annexe B, paramétrable | « chaîne par défaut (annexe B), modifiable » |
| H-72 | FR-237 | Copilot de l'auditeur en lecture de la piste d'audit | OUVERTE | Q9 (reste ouvert) ; n'affecte pas la structure | Garder ; responsable PO (Q9) ; révision à l'épic Copilot ; en attendant : non fourni |
| H-73 | FR-240 | Poids des KPI de poste | DÉFAUT | F5 : poids paramétrables par rôle | « propositions par défaut, paramétrables (F5) » |
| H-74 | FR-242 | Gamification « bientôt » | DÉFAUT | Hors réponses du PO ; boutons « bientôt » | « bientôt (hors v1) » |
| H-75 | FR-273 | Coefficients de la carte de chaleur | DÉFAUT | Paramètre (annexe D) | « défaut ×1,3 / ×1 / ×0,7 » |
| H-76 | FR-245 | Plafond de 2 messages commerciaux par semaine | DÉFAUT | Repris de PRD-D FR-148 | « défaut 2 par semaine (annexe D) » |
| H-77 | FR-245 | Base du calcul du retour sur investissement | DÉCIDÉE | F10 : ROI sur marge d'intérêt nette attendue | « base : marge d'intérêt nette attendue (F10) » |
| H-78 | FR-247 | Affectation du premier message d'un prospect | DÉFAUT | Repli : boîte du RCC | « défaut : boîte du RCC » |
| H-79 | FR-253 | Budget = donnée de `finance-transactions` | OUVERTE | F11 décide le tableau du DAF ; l'emplacement du budget dépend de la partie 3 partagée | Garder ; responsable Dev B ; vérifier au PRD distributeur (partie 3) ; sinon budget tenu par `microfinance` |
| H-80 | FR-255 | Portée « portefeuille » tenue par credit/microfinance, lue par `reseau` | OUVERTE | Frontière avec le PRD `reseau` | Garder ; responsable Dev B ; à porter au PRD `reseau` (manifeste #414) |
| H-81 | FR-256 | Le bac à sable PI-SPI n'expose pas l'IBAN | DÉCIDÉE | D-5 / Q1 : virement par le cœur | « virement hors schéma exécuté par le cœur (D-5) » ; fait à revérifier à l'adhésion |
| H-82 | FR-256 | La règle de 1 % remplace la tolérance d'un jour de FR-P38 | BLOQUANTE | Change une règle du module `paiement` alors que Q2 refuse tout amendement | Question B1 (§2) |
| H-83 | FR-257 | Âge de la lecture avant lien : 15 min | DÉFAUT | Voir H-60 | « défaut (annexe D) » |
| H-84 | FR-258 | Messages aux cautions : cadre juridique | JURISTE | §12.3 (« messages aux cautions ») | Garder |
| H-85 | FR-260 | Tunnel sortant de plus, à porter au spine moteur AD-9 | BLOQUANTE | Le PO a décidé le tunnel (P9) ; reste l'amendement du spine moteur | Question B2 (§2) |
| H-86 | FR-260 | Dimensionnement de l'instance locale non chiffré | OUVERTE | Dépend de la taille réelle de l'IMF | Garder ; responsable Dev B ; avant le devis des serveurs |
| H-87 | FR-262 | Délai d'acceptation d'un correctif critique | OUVERTE | Clause du contrat de maintenance (P5) | Garder ; responsable PO ; à la signature du contrat |
| H-88 | FR-263 | Durée de vie d'un lien de paiement : 72 h | DÉFAUT | Paramètre | « défaut 72 h (annexe D) » |
| H-89 | FR-263 | Purge d'un événement du relais : 7 jours | DÉFAUT | Paramètre ; cadre juridique du sous-traitant déjà en §12.3 | « défaut 7 jours (annexe D) » |
| H-90 | FR-263 | Nom du relais ajouté au contact sortant, AD-9 | BLOQUANTE | Même amendement que H-85 | Question B2 |
| H-91 | FR-263 | AD-9 ne couvre que deux noms ; liste à fixer | BLOQUANTE | Même amendement que H-85 | Question B2 |
| H-92 | FR-264 | Le 443 limité au réseau interne | DÉCIDÉE | B1 (aucun port entrant) et B2 (réseau de l'IMF) | « 443 sur le réseau interne seulement (B1, B2) » |
| H-93 | FR-265 | Supervision locale lisible sans internet | OUVERTE | À porter au PRD moteur | Garder ; responsable Dev B ; révision à l'épic de supervision |
| H-94 | FR-266 | Valeurs de performance du cahier | DÉFAUT | Taille = affaire de l'IMF (B4) | « défauts, confirmés avec la taille réelle » |
| H-95 | FR-266 | Règle « au-delà d'un serveur » | OUVERTE | Dépend de la taille réelle ; pas de haute disponibilité en v1 | Garder ; responsable PO et Dev B ; à la présentation |
| H-96 | FR-267 | Citation de l'instruction 017-12-2010 | JURISTE | Citation légale | Garder ; §12.3 |
| H-97 | §8 | Valeurs de performance du cahier | DÉFAUT | Même que H-94 | « défauts » |
| H-98 | §8 | Fraîcheur : 15 min après l'arrivée du mouvement | DÉFAUT | Paramètre ; écart avec l'annexe D | Aligner NFR-2 sur l'annexe D, retirer la balise |
| H-99 | §8 | Disponibilité 99,5 % du temps ouvré | DÉFAUT | L'IMF exploite ses serveurs ; objectif, pas engagement | Écrire « objectif de conception, sans engagement » |
| H-100 | §8 | Test d'intrusion avant février | OUVERTE | Charge non chiffrée ; Q4 : rien n'est modifié | Garder ; responsable PO ; au plan de février |
| H-101 | §8 | Android d'entrée de gamme | DÉFAUT | Appareils de référence fixés à la recette | « appareil de référence fixé à la recette » |
| H-102 | §9 | Horizon de la baisse du PAR | OUVERTE | Cible commerciale sans décision | Garder ; responsable PO ; à la présentation à l'IMF |

## 2. Questions BLOQUANTES au PO

**B1. La règle de 1 % pour les échéances de prêt (H-82).**
Le PRD dit que, pour un prêt, un paiement à moins de 1 % de l'échéance se rattache à cette échéance (décision A6), alors que `paiement` tolère un jour (FR-P38) et que vous avez refusé d'amender son PRD (Q2).
Recommandation : oui, comme un réglage de `paiement` « écart de rattachement par type de créance » (1 % pour un prêt), sans toucher au PRD distributeur ; sinon le crédit doit pré-filtrer chaque paiement avant `paiement`, ce qui double la logique.

**B2. Amender le spine du moteur d'installation, AD-9 (H-85, H-90, H-91).**
AD-9 n'autorise que deux contacts sortants ; vous avez décidé le relais Money Vibes (B1) et le tunnel de l'IA commune (P9), et il faut aussi les destinations de paiement et de messagerie de chaque IMF.
Recommandation : oui, un seul amendement groupé : AD-9 devient « le contact de la plateforme, plus une liste de destinations déclarées à l'installation (relais, tunnel, opérateurs) » ; rien ne change pour les clients qui n'en déclarent pas. Sinon les épics du moteur (EPIC-142 à 160) ne peuvent pas porter ces trois flux.

**B3. Refinancement : l'ancien prêt est-il retenu sur le montant versé ? (H-22)**
P4 dit que le nouveau prêt « solde l'ancien au décaissement confirmé », sans dire si le client reçoit le net.
Recommandation : oui, retenu sur le net (montant accordé moins frais moins solde de l'ancien prêt) ; l'ordre au cœur porte le net et le solde de l'ancien prêt est une écriture du cœur ; le client ne touche pas d'argent pour le rendre aussitôt.

## 3. Décompte

Décompte vérifié par script sur le tableau.

| Catégorie | Nombre | Hypothèses |
|---|---|---|
| DÉCIDÉE | 15 | H-12, 13, 20, 30, 33, 35, 41, 47, 50, 59, 62, 65, 77, 81, 92 |
| DÉFAUT | 54 | H-1, 2, 3, 7, 8, 9, 11, 14 à 19, 21, 23 à 29, 31, 39, 42, 44, 45, 48, 49, 53 à 55, 57, 58, 60, 61, 64, 67 à 71, 73 à 76, 78, 83, 88, 89, 94, 97 à 99, 101 |
| JURISTE | 11 | H-10, 32, 34, 36, 37, 38, 40, 43, 56, 84, 96 |
| BLOQUANTE | 5 (en 3 questions) | H-22 (B3) ; H-82 (B1) ; H-85, 90, 91 (B2) |
| OUVERTE | 17 | H-4, 5, 6, 46, 51, 52, 63, 66, 72, 79, 80, 86, 87, 93, 95, 100, 102 |
| Total | 102 | |

Effet : 69 balises tombent (15 + 54) ; 28 restent (11 juriste + 17 ouvertes) ; 5 attendent une réponse du PO.
