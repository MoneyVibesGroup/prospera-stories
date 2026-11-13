# Relecture adversariale du PRD Assurance (chaîne sinistres)

**Verdict : le circuit nominal est solide et très testable, mais il ne passerait ni une recette sérieuse ni un audit tel quel : on peut y payer pendant le délai de dénonciation, y payer deux fois (chèque annulé, issue de paiement inconnue, doublons), y créer deux numéros de sinistre dans le logiciel de la compagnie (LC), et l'accord qui déclenche l'argent est enregistré par celui qui instruit sans autre preuve qu'un fichier joint ; les règles sur les données de santé et sur l'IA se contredisent d'une section à l'autre, et la promesse « tout le circuit, avec l'IA, en février, à 2 développeurs » repose sur des inconnus présentés comme des paramètres.**

Périmètre lu : §0-§4, §5 en entier (FR-30 à FR-149, dont la table FR-135/136), §6.1, §6.4 à §6.8, §7.1, §7.2, §7.4, §7.5 (extraits), §8 (extraits), §9 à §13, annexes C et D, fiches A/B (survol). Les annexes A et B n'ont pas été relues ligne à ligne.

Barème : CRITIQUE = argent perdu, payé sans accord ou doublon de numéro non rattrapable ; HAUTE = contradiction ou trou qui fera échouer la recette ou l'audit, ou risque légal ; MOYENNE = ambiguïté qui produira un bug ou un litige d'interprétation ; BASSE = incohérence documentaire.

---

## CRITIQUE

### F-01 — On peut payer pendant les 15 jours de dénonciation de la transaction (corporel) [CRITIQUE]
**FR-86, FR-90, FR-102, FR-135 (transitions 14, 17, 18, 20, 42), FR-96.**
La transition 14 crée l'ordre dès l'accord enregistré ; aucune condition des transitions 17, 18 ou 20 ne vérifie que les 15 jours de l'art. 235 sont écoulés. La seule garde est une `[ASSUMPTION: la compagnie n'émet pas avant la fin du délai]` (FR-102) : ce n'est ni une règle serveur ni un test. FR-96 écrit pourtant « le droit de dénonciation est déjà purgé » comme si la garde existait. La transition 42 n'existe que depuis `ORDRE_EMIS` et exige `AUCUN_REGLEMENT_REMIS` ; un virement ou un paiement mobile exécuté par `paiement` est irréversible, et depuis `REGLE` aucune transition ne ramène vers `EN_INSTRUCTION` sauf 23 (provisionnel).
**Scénario :** accord signé le lundi, ordre émis le lundi, virement parti le mardi. Le jeudi, la victime dénonce par lettre recommandée. Prospera ne sait plus annuler ; la compagnie a payé une transaction nulle et ne peut pas faire dire au dossier ce qui s'est passé.
**Correction :** condition serveur `DENONCIATION_ECOULEE` sur 17 et 18 (date d'éligibilité = conclusion + 15 jours, calculée, non modifiable) pour tout dossier corporel VTM ; l'ordre peut être créé à l'accord mais reste « différé » jusqu'à cette date. Ajouter le chemin de dénonciation depuis `CHEQUE_A_REMETTRE` et un test par moyen de paiement. Supprimer l'`[ASSUMPTION]`.

### F-02 — Paiement dont l'issue est inconnue : le PRD se contredit, et la relance après `ECHEC` peut payer deux fois [CRITIQUE]
**FR-92, FR-95, FR-99, FR-220.**
FR-220 introduit l'état `INCONNU` (« rapproché du relevé avant toute réémission »). FR-92, la matrice des états du règlement, n'a que `A_PAYER, EN_COURS, PARTIEL, PAYE, ECHEC`, et l'annexe A reprend ces cinq états. FR-95 permet à `CPT` de « relancer après correction des coordonnées, avec motif » un règlement en `ECHEC` sans dire si la référence unique est conservée. FR-99 dit que le rejet n'est possible que sur `A_PAYER` ou `ECHEC`, mais que « le rejet annule les règlements non payés du dossier », ce qui englobe un autre règlement `EN_COURS` (paiement lancé, pas confirmé).
**Scénario :** time-out du fournisseur ; Prospera marque `ECHEC` ; l'argent est en fait parti. `CPT` corrige un chiffre du numéro, relance avec une nouvelle référence : deuxième paiement. Variante : le rejet FR-99 d'un règlement `A_PAYER` annule dans Prospera un second règlement déjà lancé chez `paiement`.
**Correction :** un seul jeu d'états (ajouter `INCONNU`, interdit de relance et de rejet tant que le relevé du fournisseur n'a pas tranché, avec rapprochement obligatoire par une personne qui n'a pas lancé) ; `ECHEC` n'est posé que sur refus explicite du fournisseur ; toute relance reprend la clé d'idempotence d'origine ; FR-99 limité au règlement visé, jamais aux règlements `EN_COURS`/`PARTIEL`.

### F-03 — Un chèque « annulé » dans Prospera reste négociable : double paiement par chèque [CRITIQUE]
**FR-101, FR-135 (transition 21), FR-99, FR-125, FR-130, FR-94.**
Annuler et ré-émettre un chèque non retiré (21) ne demande aucune opposition bancaire, aucun retour du chèque physique, aucun contrôle que le chèque n'a pas été remis. FR-125 dit que la comptabilité « décide d'une opposition » et que la quittance passe `ANNULEE` « si l'opposition est faite » ; FR-130 dit « suspend la remise, **sans annuler le chèque** ». Les deux textes ne peuvent pas être vrais ensemble, et aucun ne rend l'opposition obligatoire avant ré-émission.
**Scénario :** chèque de 3 M émis, bénéficiaire injoignable 31 jours, `CPT` annule et ré-émet par virement. Le bénéficiaire retrouve le chèque et le dépose. Prospera affiche une seule dépense, la banque en voit deux.
**Correction :** état `CHEQUE_EN_OPPOSITION` ; la ré-émission est refusée tant que la comptabilité n'a pas saisi la référence de l'opposition ou la restitution physique du chèque ; contrôle mensuel des numéros de chèque annulés non rapprochés ; trancher FR-125 contre FR-130 (une seule règle).

### F-04 — Deux numéros de sinistre pour un même sinistre dans le LC [CRITIQUE]
**FR-37, FR-198, FR-199, FR-200, annexe C (C-11, C-13, C-18).**
FR-199 : « la liste est la même que le LC reçoive ou non par la suite » ; FR-200 : « une coupure ne perd aucun envoi, les envois attendent dans une file et partent à la reprise ». Si le LC est coupé, un agent saisit la déclaration à la main dans le LC (numéro N1) et le reporte ; à la reprise, la file d'envoi rejoue la déclaration : le LC crée N2. FR-198 : un numéro reçu pour un dossier déjà numéroté est « refusé comme écart » ; le LC, lui, a deux sinistres, et les évaluations, provisions et règlements de Prospera iront sur l'un ou l'autre (C-14, C-15 par « numéro de sinistre (ou `DEC-`) »). La clé d'origine `DEC-` n'est pas exigée dans le LC saisi à la main (« clé d'origine à recopier » : un champ que le LC n'a peut-être pas). Quand « Prospera attribue » (paramètre FR-37), le format `SIN-AAAA-NNNN` n'est ni cloisonné ni vérifié contre les numéros déjà attribués par le LC (C-9) : collision possible. Enfin C-11 renvoie un « indicateur de doublon + numéro existant » du LC que FR-37 refuserait (`NUMERO_OFFICIEL_DEJA_ATTRIBUE`) sans procédure de rattachement.
**Correction :** une déclaration a un seul chemin à la fois : dès qu'elle est marquée « saisie » dans la liste C-18, l'envoi automatique est annulé (état `SAISIE_MANUELLE`) et son rattachement ne se fait que par report du numéro ; le LC doit dédupliquer sur `DEC-` ou le PRD doit dire que l'envoi automatique est interdit après saisie manuelle ; espace de noms obligatoire pour les numéros attribués par Prospera (préfixe distinct) et contrôle d'unicité contre C-9 au basculement ; procédure explicite quand le LC renvoie un numéro existant (voir F-26).

### F-05 — L'accord qui libère l'argent est enregistré par l'instructeur, sur une pièce libre [CRITIQUE]
**FR-86, FR-90, FR-135 (transition 14), FR-96, FR-7.**
Le seul rempart « aucun ordre sans accord » est un enregistrement fait par `GEST` ou `RESP` avec « une pièce jointe » (`PIECE_ACCORD_ABSENTE` si absente). Rien n'exige : que la pièce soit l'offre signée de la version envoyée, que quelqu'un d'autre que l'instructeur la contrôle, qu'une signature soit comparée. FR-7 interdit instruire/valider, valider/émettre, émettre/remettre, mais **ne dit rien sur « enregistrer l'accord »** (FR-93 l'ajoute seulement à l'interdiction d'émettre). Même chose pour la quittance : FR-96 ne dit pas qui la marque `SIGNEE` avant un virement.
**Scénario :** le gestionnaire qui instruit (ou le responsable qui a validé) joint un scan quelconque, passe la transition 14 ; le comptable, qui ne contrôle que des champs, émet. Un instructeur complice et un bénéficiaire complice suffisent.
**Correction :** l'accord (et la quittance signée) est enregistré par un rôle distinct de l'instructeur et du validateur (ACC au guichet, ou second visa) ; empreinte de la version d'offre signée ; au-dessus d'un seuil paramétré, double enregistrement ; ligne ajoutée au tableau FR-7 et un test par cumul (instruit + accord, validé + accord).

---

## HAUTE

### F-06 — L'affectation : le PRD dit à la fois « jamais » et « le gestionnaire se l'attribue » [HAUTE]
**FR-50, FR-7 (ligne 7), FR-52, FR-135 (transition 5), FR-136 (`DOSSIER_AFFECTE`).**
FR-50 : un gestionnaire « qui fait avancer un dossier sans titulaire le prend lui-même (seule exception, tracée) » ; le test du même FR : prendre en instruction un dossier non affecté est refusé (`DOSSIER_AFFECTE`) ; FR-7 ligne 7 : « s'attribuer à soi-même un dossier » est interdit, l'attribution est un acte du RESP ; transition 5 : RESP est aussi instructeur. L'exception ouvre la sélection de dossiers (choisir les « bons » dossiers, fuir un dossier corporel) et fait échouer au moins un des tests.
**Correction :** supprimer l'exception ; un dossier non affecté depuis 1 jour ouvré va au RESP (déjà alerté) ; si le RESP instruit lui-même, il ne peut ni valider (SEP-01) ni siéger au comité pour ce dossier, à écrire.

### F-07 — Honoraires d'expert : hors délégation, visés et payés par le même rôle [HAUTE]
**FR-8, FR-78 (nature « honoraires »), FR-91, FR-90, FR-182, FR-220.**
FR-8/FR-78 mettent « honoraires » dans la matrice de délégation ; FR-91 dit que les honoraires « n'entrent pas dans le calcul de la délégation ». FR-90 : ils échappent à l'accord, naissent « du visa par `RESP` ou `CPT` », ne passent pas la transition 14. FR-182 : « le CPT qui a visé n'émet pas le règlement de la même note » : un CPT vise, un autre CPT paie ; or CPT « ne décide jamais d'un règlement » (§2.1, FR-7 ligne 2, FR-220). Aucun plafond, aucun comité, aucun lien avec le budget (le dépassement du budget est seulement « signalé »).
**Scénario :** un cabinet complice facture 4 M pour une expertise à 400 000 ; un CPT vise, un autre CPT émet ; aucune délégation n'est consultée.
**Correction :** visa des honoraires par RESP (jamais CPT), plafond d'honoraires par niveau de la matrice, comité au-dessus ; CPT émet seulement ; rapprochement facture/lettre de mission/rapport reçu (pas de visa sans rapport validé).

### F-08 — « Validé par une autre personne » dans `paiement` contre « CPT émet seul » dans `sinistres` [HAUTE]
**FR-93, FR-95, FR-220, FR-222.**
FR-220/222 (renvoi au PRD `paiement`) : l'ordre est préparé par CPT puis validé par **une autre** personne. FR-93/95 : CPT émet seul et déclenche seul le paiement. Le validateur du PRD `paiement` n'existe dans aucun des quatorze rôles de `sinistres` ; si c'est RESP/DG, il a déjà décidé (SEP-02). FR-222 admet en outre qu'un virement hors PI-SPI est « exécuté par la comptabilité, confirmation saisie » : `REGLE` peut donc être posé par une confirmation tapée à la main, sans fournisseur, par la même personne.
**Correction :** décider qui est ce second contrôle (un CPT distinct, avec règle « pas celui qui prépare » ; ou le DG au-dessus d'un seuil), l'écrire dans le circuit et la matrice B ; la confirmation manuelle d'un virement exige un justificatif bancaire joint et un second CPT.

### F-09 — Comité et visa du DT : le même homme décide deux fois, le quorum est fragile, aucun délai [HAUTE]
**FR-78, FR-79, D.1 (`DELEG_COMITE_COMPOSITION`).**
Le DT siège au comité (donc vote) puis donne le visa qui conditionne l'envoi : ce n'est pas un contrôle indépendant. Les « deux autres membres » ne sont nommés nulle part (« RESP, DT plus deux autres »). Quorum 3, majorité simple des présents, instructeur exclu du vote : à 3 présents dont un exclu, 2 votants, égalité possible ; la règle d'égalité n'existe pas. Le DT absent bloque tout dossier > 1 M (seule échappatoire : FR-7 « délégation explicite »), alors que le chronomètre légal du corporel court (FR-85, pénalité 5 %/mois) ; aucun délai maximal de convocation du comité.
**Correction :** visa du DT remplacé par le DG si le DT a voté ; règle d'égalité (voix du président ou renvoi) ; suppléant nommé par la matrice ; délai paramétré de tenue du comité avec alerte et repli (délibération par écrit) ; liste des membres obligatoire à la mise en service.

### F-10 — Le validateur peut lever le blocage fraude du dossier qu'il a validé [HAUTE]
**FR-129, FR-130, FR-133, FR-7.**
La conclusion `ECARTE` est ouverte à `RESP`, `DG`, `DT` ; la seule séparation est que le relecteur n'est pas le gestionnaire. Aucune règle n'interdit au RESP qui a affecté, validé ou siège au comité de lever le blocage de ce même dossier ; l'avis écrit de `AUD` n'est exigé que pour confirmer, pas pour écarter. Un seul rôle (RESP) attribue, instruit à l'occasion, valide ≤ 1 M, préside le comité, ordonne la contre-expertise et écarte la fraude : c'est le point de collusion unique que le PRD prétend supprimer.
**Correction :** écarter un blocage `BLOQUE` exige l'avis écrit d'AUD et un relecteur qui n'a ni validé ni affecté le dossier ; ligne ajoutée au tableau FR-7 ; indicateur « blocages levés par le validateur ».

### F-11 — L'IA propose de fait un ordre de grandeur sur le corporel, malgré FR-71 [HAUTE]
**FR-71, FR-65, FR-74, FR-77, FR-49, FR-80, FR-209.**
FR-71 interdit « une médiane de comparables » en corporel et son test dit que la comparaison au portefeuille « n'affiche pas de médiane de montant corporel ». Mais FR-65 et FR-74 définissent la comparaison pour tout dossier évalué (« comparables au moins 12 », « avec l'écart en pourcentage »), FR-77 met « cohérence avec les dossiers comparables » parmi les points forts de la fiche de décision de tout dossier, FR-80 affiche l'écart indemnité/provision (25 %) au signataire, et FR-49 pose la provision d'ouverture d'un dossier corporel au milieu d'une tranche par gravité : un montant machine qui sert ensuite de référence. Un signataire qui voit « +40 % vs comparables » ou « −25 % vs provision » est ancré, sans qu'aucune règle n'ait « proposé » quoi que ce soit.
**Correction :** filtre `volet = corporel` appliqué à toutes les comparaisons, écarts à la provision d'ouverture et fiches de décision (liste blanche des volets, pas liste noire des usages) ; provision d'ouverture corporelle saisie par l'humain avec motif ; un test par écran, pas par usage d'IA.

### F-12 — Les données de santé : le tableau des droits ne tient pas face aux écrans des autres sections [HAUTE]
**FR-9, FR-153, FR-10 (ligne 2), FR-164, FR-165, FR-154, FR-155, FR-211.**
FR-9 : `ACC`, `NUM`, `ARCH`, `CPT`, `AUD`, `ADMIN` « n'en voient que l'existence » (test par rôle). FR-10/FR-164 : l'IA affiche les « champs lus avec l'extrait de la pièce d'où ils viennent » à `ACC`, `NUM`, `GEST` (le déposant) ; FR-165 : `NUM` contrôle la lisibilité de chaque pièce avant archivage (il la regarde) ; FR-154 : le résumé « avec renvoi à la pièce » est servi à `RESP`, `DG`, `DT`, `GEST` (quel que soit le volet) sans qu'il y ait de « décision » en cours ; FR-155 : la recherche en langage naturel ne filtre que par rôle de dossier, pas par champ de santé (« dossiers avec incapacité > 30 % »). Le test de FR-9 est donc ou faux, ou impossible à passer en même temps que FR-164/165.
**Correction :** décider une règle simple et la porter dans les écrans : une pièce médicale est numérisée sous un type « médical » qui ne s'affiche jamais en aperçu ni extrait ; le contrôle qualité d'une pièce médicale est fait par ARCH/MED ou en aveugle (métadonnées seulement) ; les résumés IA excluent les champs de santé hors des rôles de FR-9 ; DG/DT « pour une décision » devient un accès par dossier ouvert à la validation, journalisé.

### F-13 — Le LC reçoit la gravité corporelle et des motifs libres ; la base légale « consentement de la victime » bloque le circuit [HAUTE]
**FR-196, annexe C (C-13, C-14, C-17), FR-9, FR-85.**
C-13 envoie au LC la « gravité (léger, modéré, grave, mortel) », le type de sinistre et le nom et téléphone de la victime ; C-14 et C-17 envoient un « motif » libre. Un accident corporel avec gravité est une donnée de santé ; un motif libre de provision peut citer un diagnostic. FR-196 dit pourtant « aucune donnée de santé vers le LC `[ASSUMPTION]` ». FR-9 : la base légale par défaut est le **consentement écrit** et « sans lui, la pièce médicale n'est pas versée au dossier » ; or la victime d'un accident causé par un assuré est un tiers adverse, qui n'a aucune raison de signer, pendant que le chronomètre de 12 mois et la pénalité de 5 %/mois courent (FR-85).
**Correction :** C-13/C-14/C-17 sans gravité ni type corporel (code de volet seulement) et motifs codés (liste), jamais libres ; base légale à trancher par le juriste avant la recette, avec défaut « obligation légale / exercice d'un droit » plutôt que consentement pour la victime ; le défaut du consentement ne doit pas arrêter le chronomètre par omission.

### F-14 — Fraude : silence imposé, refus « opposable » et blocages automatiques qui frappent les victimes [HAUTE]
**FR-125, FR-133, FR-121, FR-127, FR-128, FR-130, FR-135 (36-38).**
(a) FR-125/133 : l'assuré voit « dossier en cours d'instruction » et le refus qui suit une fraude confirmée « n'emploie pas le mot fraude ; il emploie le motif retenu par la direction » : un refus doit être motivé et opposable (FR-121) ; un motif de substitution est une fausse motivation devant un juge. (b) Le score additionne `CONTRAT_NON_ACTIF` (40) et `SINISTRE_PRECOCE` (30) = 70 = `BLOQUE` : un sinistre d'une police récente dont la prime est impayée bloque le paiement, y compris au corporel où l'art. 210 rend la suspension inopposable à la victime ; la revue n'a qu'une alerte à 3 jours ouvrés, pas de délai maximal, alors que le chronomètre légal continue. (c) Transition 31-36 : on ne peut signaler une fraude ni depuis `DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `REGLE`, `LITIGE`. (d) Argent déjà versé : « indu à examiner », récupération hors périmètre, et le chèque émis n'est pas annulé (F-03).
**Correction :** motif de refus de fraude écrit au vrai motif juridiquement exigé, ou procédure d'information prévue par le juriste ; au corporel, signal ≠ blocage sans décision humaine sous délai (revue sous N jours, sinon DG) ; étendre le signalement aux statuts d'avant l'instruction et à `REGLE` ; prévoir le recouvrement d'indu ou le dire hors périmètre avec un responsable.

### F-15 — La machine à états a des trous que le serveur, « qui fait foi », ne saura pas arbitrer [HAUTE]
**FR-92, FR-135, FR-88, FR-124, FR-90.**
(a) Statut dérivé : `ORDRE_EMIS` = au moins un règlement `A_PAYER`/`ECHEC` ; `CHEQUE_A_REMETTRE` = tous émis et un chèque en attente ; `REGLE` = tous `PAYE`. Un dossier dont le seul règlement est un paiement électronique `EN_COURS` ou `PARTIEL` n'a aucun statut. (b) L'ordre est égal au « montant accepté » (FR-90) alors que `REGLE` exige « reste à payer = validé − payé = 0 » (FR-92, FR-104) : si accepté < validé (acompte, accord partiel), le dossier ne peut jamais être `REGLE` ni clos. (c) FR-88/124 autorisent un acompte en `LITIGE` « sans changer le statut » : il n'existe aucune transition de `LITIGE` vers un ordre ; la table dit « une transition absente est interdite ». (d) Transition 42 n'existe que depuis `ORDRE_EMIS` (pas `CHEQUE_A_REMETTRE`, pas `REGLE`). (e) FR-99 renvoie en `EN_VALIDATION` avec « la nouvelle validation s'appuie sur l'accord tant que le montant validé ne dépasse pas le montant accepté » : un montant validé inférieur reste valable sans nouvelle offre, mais la transition 10 exige l'envoi d'une offre.
**Correction :** table de vérité complète des statuts dérivés (y compris `EN_COURS`/`PARTIEL`/`INCONNU`), `reste à payer` défini sur le montant accepté, transition explicite `LITIGE` → acompte ou acompte retiré, transition 42 étendue ; faire générer la table de test à partir de la table, pas à la main.

### F-16 — Resynchronisation : les paiements et la clôture faits dans le LC sont ignorés après « prise en main » [HAUTE]
**FR-217, annexe C (C-9, C-15), FR-194, FR-91.**
Un dossier devient « tenu par Prospera à sa première action de dossier » : « action » n'est pas définie (une consultation ? une note ? un dépôt de pièce par `NUM` ?). Ensuite, tout changement de la source sur un champ de dossier « n'est pas appliqué » et va en file d'écarts, y compris, par construction, un règlement saisi dans le LC par un agent de la compagnie qui continue à y travailler, et un statut « clos ». C-9 lit pourtant des « montants payés » du LC, alors que le payé fait foi dans Prospera. Prospera calcule le reste à payer sans ce paiement : double paiement ; ou à l'inverse, avant prise en main, la mise à jour nocturne peut écraser une provision revue à la main.
**Correction :** liste fermée de ce qui déclenche la prise en main (ex. affectation ou première transition) ; règlements, annulations et clôtures venant du LC sont des **faits** reçus (C-15 en sens inverse) qui bloquent les ordres et s'affichent en alerte rouge ; un dossier modifié par le LC après prise en main passe « litige de source » (aucun paiement tant que l'écart n'est pas résolu).

### F-17 — Doublons de dossier : le contrôle n'est qu'un avertissement et il n'y a aucune fusion [HAUTE]
**FR-38, FR-39, FR-198, FR-100, C-11, A.5/A.7.**
Le doublon « n'empêche jamais l'enregistrement » ; Prospera « ne fusionne jamais seul » ; le seul moyen est de « rattacher la déclaration au dossier existant », sans procédure quand les deux dossiers existent déjà (pièces, provisions, offres, règlements à réunir). Le contrôle de doublon de règlement (FR-100) compare bénéficiaire + montant : deux dossiers doublons évalués à des montants différents ne déclenchent rien. FR-224 écrit « même dossier » là où FR-100 écrit « même bénéficiaire, même montant ».
**Scénario :** le courtier déclare par e-mail, l'assuré par WhatsApp ; deux dossiers, deux évaluations (950 000 et 970 000), deux règlements au même assuré.
**Correction :** contrôle de doublon de règlement par bénéficiaire + sinistre (date, police, immatriculation), non par montant ; procédure « fusionner deux dossiers » (droit, motif, journal, un seul dossier survivant, un seul numéro LC) ; unifier FR-100/FR-224.

### F-18 — La provision est le point faible prudentiel [HAUTE]
**FR-76, FR-188, FR-105, FR-123, FR-189, extrait CIMA art. 334-8.**
(a) Le seuil de 2 M s'applique à **chaque révision**, sans cumul : cinq révisions de 1,9 M n'attendent jamais le RESP, alors que l'anti-fractionnement n'existe que pour la délégation. (b) À l'évaluation, « la provision s'aligne sur le montant évalué » : un alignement automatique qui contourne le seuil de 2 M. (c) FR-188 : le gestionnaire peut « reporter une revue de provision de X jours ». (d) `SANS_SUITE` et `REJETE` ramènent la provision à zéro (FR-123, FR-133), y compris au corporel où l'offre légale reste due (« les échéances légales restent affichées ») : l'état PSAP (FR-189) omet un sinistre non payé dont l'obligation court, contredisant la définition de l'art. 334-8 citée dans le dossier de recherche. (e) Aucune provision du risque de pénalité de 5 %/mois, que la recherche recommandait.
**Correction :** seuil sur le cumul glissant par dossier ; l'alignement à l'évaluation est soumis au même seuil ; interdire le report si un délai légal est actif ; au corporel, provision maintenue (non nulle) tant que l'obligation légale court ; poste « risque de pénalité » dans la provision.

### F-19 — `CONTRAT_VERIFIE` ferme l'ouverture alors que FR-41 dit « jamais bloquée » et que l'art. 210 protège la victime [HAUTE]
**FR-41, FR-45, FR-135 (1, 2, 4), FR-136, FR-201.**
Transitions 1 et 2 exigent `CONTRAT_VERIFIE` : « police en vigueur ... d'après la dernière lecture du LC ». FR-41 : la recevabilité n'est « jamais bloquée » si le LC est injoignable ; FR-45 : « un contrat non valide ferme l'ouverture ; le dossier reste `DECLARE` et la sortie ouverte est `REJETE` motivé ». Pour une victime corporelle VTM, FR-41 renvoie au juriste la question de l'opposabilité (art. 210). Résultat : une projection périmée ou une prime impayée côté LC arrête le dossier d'une victime avant même sa première pièce, ou impose un refus.
**Correction :** `CONTRAT_VERIFIE` produit une réserve, pas un blocage, pour le corporel VTM ; une police non valide en projection périmée (âge > seuil) est « à relire », jamais refus ; refus de garantie seulement par décision `REFUS_DE_GARANTIE` (FR-42), jamais par la condition d'ouverture.

### F-20 — Le portail du cabinet externe ne peut pas exister avec « aucun port entrant » [HAUTE]
**FR-180, FR-237, FR-239, FR-257.**
FR-237 : le serveur est joignable « du réseau interne et des guichets, jamais depuis internet » ; FR-239 : le relais ne porte que les accusés WhatsApp et les notifications de paiement. Un cabinet externe (compte `EXPE`) doit atteindre le portail depuis son propre bureau. Soit un port est ouvert (contredit FR-257 et le PRD moteur), soit le relais doit porter aussi le portail (donc héberger des pièces de mission, parfois médicales, chez Money Vibes, contredit « rien ne transite par le relais »), soit le portail est faux.
**Correction :** décider : portail hébergé chez Money Vibes avec pièces chiffrées à durée limitée (et le déclarer sous-traitant, FR-239), ou échange par courriel sécurisé/dossier papier seulement au premier jour (`TRANSMISE` existe déjà pour ça) ; retirer le portail de la liste « premier jour » tant que ce n'est pas tranché.

### F-21 — Février : un périmètre inconnu présenté comme un jalon [HAUTE]
**§0, §10.1, FR-10, FR-214, FR-219, FR-223, A-10 à A-16, FR-24.**
Le PRD annonce « tout le circuit, avec l'IA, sauf la voix, en février » et dit lui-même (A-16) que le moteur d'installation chiffrait déjà 17-20 semaines pour 10 disponibles, avant d'ajouter 264 FR, 14 usages d'IA avec OCR réel, `expertises`, `ged`, `assurance`, un LC fictif, un adaptateur d'API de LC inconnu avant janvier, un adaptateur Mobile Money sortant qui n'existe pas (A-11), la saisie à la main de tables de barème corporel qui sont des **images** dans un PDF (A-12), l'approbation externe des modèles WhatsApp (FR-226), et une revue juridique obligatoire dont le PRD n'a ni propriétaire, ni date (A-15). FR-219 admet que « sans barèmes, le décompte et la provision d'ouverture ne sont pas utilisables en production » : le premier jour n'a donc de sens que si la compagnie livre ses données à temps, ce que le PRD place dans les risques mais pas dans le périmètre. Aucun critère de bascule (go/no-go) ni noyau minimal garanti n'est défini.
**Correction :** garder la décision du PO sur le périmètre, mais ajouter une définition du « jour 1 minimal » (fonctions sans lesquelles on ne met pas en service), des drapeaux de module avec go/no-go par module (le feu vert existe pour la reprise, pas pour le circuit), et la date limite de chaque entrée de la compagnie au-delà de laquelle la fonction part en « bientôt ».

### F-22 — Restauration d'une sauvegarde quotidienne : numéros réattribués, ordres réémis, chaîne rompue [HAUTE]
**FR-252, FR-236, FR-36, FR-94, FR-13.**
RPO non tranché (A-14), sauvegarde quotidienne : après une restauration, les `DEC-` déjà remis sur papier et envoyés au LC peuvent être réattribués (FR-36 : « jamais réattribuée »), les numéros de chèque déjà émis aussi, les virements déjà partis ne sont plus dans la base (FR-252 : « aucun règlement réémis avant rapprochement » : une phrase, pas un mécanisme), et l'empreinte du journal déposée hors du serveur chaque jour ne protège pas la dernière journée.
**Correction :** les compteurs (`DEC-`, numéros de chèque, numéros de quittance) se reprennent au **maximum entre la base restaurée et le LC / `paiement` / le relais** ; état « restauration en cours : aucune émission » bloquant l'émission tant que le rapprochement n'est pas fait ; fixer un RPO avant la mise en service.

### F-23 — Chèque rempli à la main : rien ne relie le papier à l'ordre [HAUTE]
**FR-94, FR-221, FR-97.**
Sans gabarit, le chèque est rempli à la main et « seul son numéro est saisi » : Prospera ne contrôle ni le bénéficiaire ni le montant réellement écrits, et la « lettre-chèque » n'existe pas. `ACC` remet contre quittance et pièce d'identité, sans comparer le chèque à l'ordre.
**Scénario :** `CPT` écrit 2 800 000 au lieu de 280 000, ou un autre bénéficiaire ; l'ordre est correct, le chèque ne l'est pas, personne ne le voit avant l'encaissement.
**Correction :** à la remise, `ACC` saisit nom et montant lus sur le chèque et le serveur les compare à l'ordre ; copie du chèque (photo) obligatoire au dossier ; gabarit imposé au corporel.

---

## MOYENNE

### F-24 — Les définitions de « celui qui a instruit » ne sont pas les mêmes d'un FR à l'autre [MOYENNE]
**FR-7, FR-81, FR-93.** FR-81 : « le gestionnaire qui a instruit » ; FR-93 : « instruit, évalué, validé ou enregistré l'accord » ; FR-7 : seulement instruit/valider. Un gestionnaire réaffecté en cours de route, un RESP qui a seulement affecté, un NUM qui a contrôlé une pièce : sont-ils « instructeur » ? **Correction :** une définition unique (liste des actes qui rendent « partie » au dossier) et un test par acte.

### F-25 — Délais de déclaration tardive : les défauts sont sous le plancher légal que le PRD s'impose [MOYENNE]
**FR-43.** Défauts 5 jours, 2 jours (vol), 3 jours (transport marchandises) ; plancher cité : 5 jours **ouvrés**, 48 h pour le vol, « que le paramétrage ne peut pas franchir ». 5 jours calendaires et 3 jours sont en dessous. **Correction :** défauts alignés sur le plancher (5 jours ouvrés, 48 h), ou précision que seule la valeur du LC est utilisée.

### F-26 — Comptes en bloc : transitions (41 ou 42), balises (176 ou 181), 104 vérifications [MOYENNE]
**§10.2 et D5 disent « 41 transitions » ; FR-135 en a 42 ; §13 annonce 176 balises `[ASSUMPTION]` dans le corps ; un décompte brut du mot avant §13 en donne 181 (écart à vérifier, le chiffre annoncé n'est pas reproductible).** Plus grave : FR-264/FR-15 et les indicateurs font des **104 vérifications du rejeu de la démo** des tests de recette « sur le serveur réel », alors que le PRD corrige précisément ce que la démo fait (seuil unique de 2 M, pas d'offre/accord, franchise manuelle, recours en statut). Les vérifications qui exercent ces comportements échoueront par construction ; « 104 sur 104 » est donc intestable. **Correction :** retraiter les 104 vérifications en un tableau « reprise telle quelle / réécrite / supprimée », et mettre à jour les comptes.

### F-27 — Annexe D : des paramètres, aucun propriétaire [MOYENNE]
**FR-4, annexe D, FR-8, FR-14.** Le tableau n'a que `code, libellé, défaut, unité, source, FR` : pas de colonne propriétaire/validateur, alors que FR-4 exige « la validation d'un rôle métier ». La matrice de délégation est modifiée par ADMIN « avec double contrôle du DG » : le DG approuve les seuils qui l'engagent. Le référentiel légal (D.5, délais, SMIG, barème) est « que la compagnie ne modifie pas » : qui le met à jour quand la loi change, et avec quel contrôle ? Même question pour la valeur du SMIG, dont dépend tout le corporel. **Correction :** colonne `propriétaire / validateur / périodicité de revue` pour chaque ligne, et une procédure de mise à jour du référentiel légal (fournisseur, relecture juriste, date d'effet).

### F-28 — Indicateurs qui ne se mesurent pas ou qui mesurent autre chose [MOYENNE]
**§9.** « Appels traités pendant l'appel » : aucun appel n'est enregistré ni relié à une consultation ; la mesure n'existe pas. « Règlements payés deux fois » : défini comme même bénéficiaire + même montant + 30 jours : rate les doublons à montant différent (F-17). « Dossiers sans numéro officiel : 0 hors coupure déclarée » : la coupure est déclarée par qui ? « Délai de réponse à l'assuré » : le message d'un assuré au guichet ou au téléphone n'est pas horodaté. « 100 % des dossiers corporels portent un chronomètre » est tautologique. « Dossier prêt pour la CRCA en une journée » est une `[ASSUMPTION]` non mesurée. **Correction :** pour chaque indicateur, une requête de calcul, une source de donnée et un propriétaire ; supprimer ceux qui n'ont pas de source.

### F-29 — Double authentification absente des rôles qui lisent la santé et arrêtent les montants [MOYENNE]
**FR-25, D.1 `MFA_ROLES`.** MFA pour DG, DT, RESP, CPT, AUD, ADMIN. Hors liste : GEST (arrête l'évaluation, enregistre l'accord), MED (lit tout le médical), GREC, ACC, NUM, ARCH. Seul EXPE a l'exigence (FR-180, `[ASSUMPTION]`). **Correction :** MFA obligatoire pour tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord.

### F-30 — LBC/FT : le « responsable LBC » n'est pas un rôle, et le contrôle de cumul est éteint [MOYENNE]
**FR-100, FR-225, FR-133.** Les alertes vont « au responsable LBC et au contrôle interne » ; le responsable LBC n'est pas l'un des quatorze rôles, n'a pas de droits dans la matrice, et les alertes qui lui sont destinées n'ont pas de destinataire dans Prospera. Le contrôle 6 (cumul > seuil national) est « inactif tant que le paramètre est vide » : il apparaît donc dans la liste des contrôles et ne contrôle rien. Les contrôles 1, 3, 5 « bloquent », mais seul le doublon prévoit une dérogation, ce qui bloque sans issue les cas 1 et 5 légitimes (expert, garage mandaté).
**Correction :** créer le rôle ou désigner AUD, écrire la liste de qui reçoit quoi ; marquer le contrôle 6 « non actif » dans l'écran ; prévoir la levée motivée des contrôles 1 et 5.

### F-31 — Deux machines d'états pour une mission d'expertise [MOYENNE]
**FR-61, FR-63.** Générale : `SUGGEREE → … → ACCEPTEE → … → VALIDEE`, avec `CONTESTEE → ARBITREE`. Médicale : `A_DESIGNER, EXPERT_DESIGNE, MISSION_ACCEPTEE, CONVOCATION_ENVOYEE, EXAMEN_REALISE, RAPPORT_ATTENDU, RAPPORT_RECU, EN_ANALYSE, VALIDEE, CONTESTEE`, sans `SUGGEREE`, `TRANSMISE`, `COMPLEMENT_DEMANDE` ni `ARBITREE`. La condition `EXPERTISE_VALIDEE` d'évaluation (« toutes les missions validées ou arbitrées ») ne peut pas s'évaluer sur la médicale (`CONTESTEE` sans `ARBITREE`). **Correction :** une seule machine avec sous-étapes médicales.

### F-32 — Quel support fait foi : papier ou numérique ? [MOYENNE]
**FR-169, FR-172.** FR-169 : après scellement, le « support de référence passe du papier au numérique » ; FR-172 : le papier reste obligatoire, le numérique « ne le remplace pas ». Un auditeur CRCA ou un juge demandera lequel des deux est opposable. **Correction :** un seul principe (« le papier fait foi tant que le juriste n'a pas validé la valeur probante de la copie »), le scellement ne change pas le support de référence.

### F-33 — `SANS_SUITE` : le gestionnaire seul, sur des relances qu'il déclare lui-même [MOYENNE]
**FR-123, FR-135 (25-27), FR-143.** Hors corporel automobile, `GEST` classe sans suite avec « 3 relances, 2 canaux, 15 jours » dont la trace est écrite par lui-même ; la provision tombe à zéro ; le dossier quitte les files. Le classement n'est visible que dans les états. **Correction :** relances tracées par le serveur (envoi réel via `notification`) et second contrôle (RESP) au-delà d'un seuil de provision.

### F-34 — Cumul anti-fractionnement : que compte-t-on quand une offre est remplacée ? [MOYENNE]
**FR-78, FR-87, FR-136.** « Le cumul des montants validés d'un même dossier décide du niveau » : après une contre-proposition, la nouvelle validation « sur le nouveau montant et le cumul » ; l'offre n°1 (jamais payée) compte-t-elle ? Si oui, un dossier de 800 000 + 800 000 remplacés est routé au comité sans raison ; si non, on revient au fractionnement. **Correction :** cumul = montants **acceptés et ordonnés non annulés** + montant en cours de validation.

### F-35 — Le « montant validé » est indéfini : le signataire peut-il le modifier ? [MOYENNE]
**FR-75, FR-80, FR-82.** L'évaluation arrêtée (`EVALUE`) est un montant du gestionnaire ; la validation est une signature ; FR-82 : « un écart entre montant proposé et montant validé est refusé ». Rien ne dit si le signataire peut valider un montant inférieur, ni où il est écrit, ni comment il se distingue de l'évalué (cinq montants affichés, mais un seul champ de saisie). Les tolérances (FR-80) sont « non bloquantes ». **Correction :** un champ « montant validé » saisi par le signataire (≤ évalué), motif obligatoire s'il diffère, validation par la délégation sur ce montant.

### F-36 — L'IA propose le motif du signataire [MOYENNE]
**FR-77.** « Le signataire peut demander à l'IA de proposer un texte de motif ; le motif reste obligatoire et humain ». Un motif pré-écrit confirmé par clic est le mécanisme de validation de complaisance classique ; le motif de 10 caractères minimum (`MOTIF_ECRIT`) est trivial à satisfaire. **Correction :** mesure du taux de motifs identiques à la proposition IA, signalée à AUD ; motif IA interdit pour les validations au-dessus du seuil du responsable.

### F-37 — Pénalité de 5 % : base et cumul non définis, mais affichés comme un chiffre [MOYENNE]
**FR-85, FR-102, FR-141.** Art. 233 (offre tardive) et art. 236 (paiement tardif) sont deux intérêts ; FR-102 affiche « la pénalité cumulée (5 % de l'indemnité par mois de retard, base paramétrable) ». Base (indemnité, solde, montant offert) et cumul des deux régimes sont « à valider par le juriste ». Un chiffre qui s'affiche au responsable et à l'auditeur est lu comme une dette. **Correction :** libellé « estimation, base non validée » tant que le juriste n'a pas tranché ; ne pas intégrer ce chiffre aux états tant que la base est ouverte.

### F-38 — Trois âges maximum de lecture du LC dans le corps du PRD [MOYENNE]
**FR-3 (15 min / 1 jour), FR-41 (« aucun défaut »), FR-201 (5 min, 24 h).** L'annexe « Conflits résolus » tranche en faveur de FR-201, mais FR-3 et FR-41 portent encore leurs chiffres ; le testeur lit les FR avant l'annexe. **Correction :** corriger FR-3 et FR-41. De plus, FR-201 autorise « payer » LC coupé sans revérifier l'état de la police.

### F-39 — « Une déclaration s'enregistre toujours » contre le guichet hors liaison [MOYENNE]
**FR-39, FR-237, FR-36.** FR-237 : la déclaration au guichet « n'est pas faussement acceptée » hors liaison ; FR-39 : une déclaration ne se refuse jamais ; FR-36 : la référence `DEC-` est remise immédiatement (papier au guichet). Hors liaison, pas de référence, pas d'accusé : le défaut corrigé du mémoire (déclaration enregistrée avec retard) revient. **Correction :** formulaire papier numéroté de secours, saisie différée avec double date (déjà prévue en FR-34).

---

## BASSE

### F-40 — FR-3 dit encore « 15 minutes / 1 jour » (voir F-38). [BASSE]
### F-41 — FR-136 : `PIECES_COMPLETES` est définie sur « aucune pièce obligatoire attendue », mais FR-165 compte une pièce « reçue » seulement après contrôle ; une pièce « en contrôle » est-elle « attendue » ? [BASSE]
### F-42 — FR-36 : « séquence sans trou ni réutilisation » et « une référence n'est jamais réattribuée, même après annulation » : sans trou et jamais réattribuée sont incompatibles dès la première annulation ; le contrôle de séquence « un trou est détectable » voit des faux positifs. [BASSE]
### F-43 — FR-135, transition 10 : « validation : RESP, comité, DT, DG ; envoi : GEST, RESP » dans une seule ligne ; la validation n'est pas une transition mais la ligne l'exige comme condition ; l'envoi par un GEST qui a instruit est permis. Éclater en deux lignes (validation, envoi) pour que la séparation soit testable. [BASSE]
### F-44 — FR-100 contre FR-224 : la définition du doublon de règlement diffère (« même bénéficiaire, même montant, 30 jours » contre « même bénéficiaire, même montant, même dossier, 30 jours »). [BASSE]

---

## Décompte

| Gravité | Nombre |
|---|---|
| CRITIQUE | 5 |
| HAUTE | 18 |
| MOYENNE | 16 |
| BASSE | 5 |
| **Total** | **44** |

## Ce que le PRD fait bien (pour ne pas casser en corrigeant)

- La règle « aucun ordre sans accord enregistré » et le principe de l'état dérivé des règlements sont les bons ; il faut les compléter (F-01, F-05, F-15), pas les défaire.
- Le garde-fou « aucun montant IA sur le corporel » est écrit comme règle de serveur avec un test ; il lui manque le filtre par volet sur les écrans voisins (F-11).
- La séparation journal/consultations, le code de refus nommé par condition et la table FR-135 « qui fait foi » sont une vraie base de recette.
