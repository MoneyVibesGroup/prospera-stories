# Relecture adversariale — PRD Prospera Microfinance (2026-11-13)

Fichier relu : `prd.md` (3 903 lignes, 256 FR). Décisions du PO prises comme acquises (`questions-po-2026-11-13.md`, `.memlog.md`) : je ne les rediscute pas, je signale seulement où le PRD les trahit ou où elles créent un danger concret. Les calculs de TEG ci-dessous sont les miens (flux actualisés, prêt à annuité constante, frais prélevés au décaissement, assurance sur le capital restant dû) ; ils sont à refaire dans les tests, mais l'ordre de grandeur est sans appel.

## Verdict

Le PRD est exhaustif et bien tenu sur la forme, mais il n'est pas utilisable tel quel pour l'architecture : sa règle d'argent centrale (« le cœur fait foi ») est contredite par ses propres modules (deux vérités sur le reste dû, remise des espèces sans contrepartie comptable), son produit de démonstration de référence échoue à son propre test d'usure, la machine à états du dossier se contredit autour d'EN_GESTION, le score IA est à la fois « information » et barrière automatique, et le périmètre ★ couvre 217 FR sur 256, donc ne délimite rien.

## Synthèse des constats

| Gravité | Nombre |
|---|---|
| Critique | 5 |
| Élevé | 11 |
| Moyen | 14 |
| Faible | 6 |

---

## CRITIQUE

### K1 — Deux vérités sur le reste dû : l'échéancier officiel du cœur contre la Créance de `paiement`
- **Emplacement** : FR-162 contre FR-209, FR-210, FR-257 ; FR-2, FR-150, FR-161 ; FR-212 (lien de paiement).
- **Citations** : FR-162 « Les relances, le PAR et le recouvrement utilisent toujours l'échéancier **officiel**. » ; FR-209 « Le dossier de recouvrement lit le reste dû de la Créance de `paiement`, pas la somme des saisies non confirmées. » ; FR-257 « la règle d'arbitrage sera fixée avec le connecteur réel » ; FR-2 « Prospera ne tient jamais un solde officiel » ; FR-161 « Un solde de prêt de Prospera est recalculé à partir de l'encours officiel et des mouvements postérieurs ».
- **Problème** : trois objets portent « le reste dû » (échéancier officiel du cœur, Créance de `paiement` ouverte sur l'échéancier **contractuel**, solde recalculé par Prospera) et le PRD dit tour à tour que chacun fait foi. La décision Q2 (paiement propriétaire des Créances) est respectée, mais son danger concret n'est pas traité : un client qui paie au guichet (cœur seul) laisse une Créance ouverte dans `paiement` ; le lien de paiement J-3 (servi par le relais, FR-212) affiche alors un montant périmé et le client paie deux fois ; inversement un paiement par lien « réduit la Créance » (FR-257) pendant que le cœur n'a rien reçu. L'arbitrage est renvoyé au « connecteur réel » : en février le cœur fictif masque le problème, en production il explose. Le test « jamais compté deux fois » (FR-2) n'a pas de définition de « deux fois ».
- **Correction** : écrire dès maintenant, sans amender PRD-D FR-247, une règle de valeur : la Créance est l'objet de `paiement`, mais son montant exigible est toujours la dernière lecture du cœur (valeur de contrôle) ; un lien de paiement n'est émis ou affiché qu'après relecture du reste dû (âge maximal en paramètre) ; tout mouvement du cœur sans paiement Prospera correspondant ferme ou réduit la Créance avant le prochain envoi ; en cas d'écart, le cœur gagne (déjà dit pour l'imputation en FR-137). Retirer « recalculé » de FR-161 ou le renommer « projection ».

### K2 — Le produit de démonstration de référence échoue au test d'usure du PRD
- **Emplacement** : FR-111, FR-108, FR-33, FR-65, FR-36, FR-10, NFR-10.
- **Citations** : FR-111 « microcrédit individuel à 1,5 %/mois, 1 % de frais de dossier, de 50 000 à 2 000 000 FCFA, 3 à 12 mois, TEG d'environ 20 % » ; FR-108 « calcule le TEG actuariel […] sur les cas extrêmes de la version : montant et durée minimum et maximum » ; FR-65 « frais de dossier (défaut de démo : 2 % […]), assurance décès-invalidité, obligatoire sur les microcrédits dans la démo (1,2 % par an) » ; FR-111 test « échoue si l'un dépasse 24 % ».
- **Problème** : mes calculs (annuité constante, TEG ramené à l'année par proportionnalité comme dit en FR-36) : 1,5 %/mois + 1 % de frais donne 19,9 % à 12 mois mais **24,2 % à 3 mois** (27,0 % en composé) ; avec les défauts de FR-65 (2 % de frais + 1,2 % d'assurance) : 23,1 % à 12 mois, 26,4 % à 6 mois, **31,7 % à 3 mois**. Le produit de référence est donc refusé à la publication par FR-108 (durée minimale 3 mois) et le test de FR-111 est rouge le premier jour. En composé (FR-10 dit « taux actuariel annuel », FR-36 dit « proportionnalité »), même le 12 mois avec 2 % de frais et assurance sort à 25,7 %. Les deux méthodes diffèrent de 2 points, soit toute la marge : NFR-10 (« 0,01 point près ») est inapplicable tant que la méthode n'est pas figée. Le PRD qualifie lui-même de « faute » le fait de montrer un produit hors plafond (§12.3).
- **Correction** : (1) figer la méthode dans le PRD (formule, base d'annualisation, traitement des frais au décaissement et de l'assurance) et la valider avec le juriste ou le praticien avant tout chiffre ; (2) livrer un tableau de TEG de référence (3, 6, 12 mois × frais × assurance) comme jeu d'essai d'or ; (3) rebâtir le produit de démo sous contrainte : durée minimale 6 mois ou taux 1,3 %/mois, frais 1 %, assurance incluse seulement si le TEG du cas extrême reste ≤ 24 % ; (4) aligner FR-65 (2 %, 1,2 %) et FR-111 (1 %, sans assurance) qui se contredisent.

### K3 — EN_GESTION : contradictions du cycle de vie du dossier et table de transitions incomplète
- **Emplacement** : FR-70, FR-78, FR-81, FR-38, FR-43, FR-40, FR-72, FR-87, FR-152, FR-165, annexe A.1 (C4, C10), FR-12, FR-93.
- **Citations** : annexe A.1 C4 « la décision du comité reste possible, **le décaissement et le passage à EN_GESTION sont refusés** (`COEUR_NON_INSTALLE`) » contre FR-78 « EN_COMITE_CREDIT → EN_GESTION | comité » et FR-165 « Le dossier se prépare, s'instruit et passe en comité même si le cœur est coupé ; l'envoi attend la reprise » ; FR-38 « depuis tout statut avant EN_GESTION » ; FR-87 « Passage à EN_GESTION | client, GP, agent […] | SMS, WhatsApp pour le client » contre FR-70 « prévenus à la confirmation du décaissement » ; FR-81 « Le **seul retour** autorisé est EN_ANALYSE_ROC vers EN_ATTENTE_DOCUMENTS […] plus le réexamen unique » ; FR-78 « Toute transition absente de la table est refusée ».
- **Problème** : (a) EN_GESTION est tantôt posé à la décision du comité (récit du PO), tantôt refusé sans cœur ; A.1 C10 dit que le dossier va de SOUMIS à EN_GESTION avec le cœur fictif « sans autre module », alors que C1 range `coeur-sfd` en `enrichiPar`, donc facultatif. (b) Entre la décision du comité et CONFIRME, le dossier est EN_GESTION donc **plus annulable** par FR-38 ; or le client peut renoncer (c'est le sens d'ANNULE) et le cœur a déjà reçu le « dossier accordé » (FR-63) : aucun message d'annulation n'existe dans l'annexe C. (c) Le client reçoit un SMS « en gestion » avant tout argent versé (FR-87). (d) FR-81 interdit les retours, mais FR-43 (DOSSIER_COMPLET → EN_ATTENTE_DOCUMENTS), FR-40 (pièce expirée), FR-72 (membre ajouté) et FR-51 (réexamen REFUSE → EN_ANALYSE) en exigent ; aucun n'est dans la table, donc les tests « transition absente refusée » et ces FR se contredisent. (e) La ligne « tout statut avant EN_GESTION → REFUSE ou ANNULE | rôle habilité » ne nomme aucun acteur : n'importe quel rôle « habilité » peut refuser à EN_COMITE_CREDIT, ce qui contredit FR-60 (le refus du comité est celui du comité). (f) FR-12 parle de « douze statuts du chemin nominal » (il y en a onze ; REFUSE n'est pas nominal) et FR-93 de « onze lignes d'acteurs » alors que le parcours Mobile Money d'UJ-1 ne fait intervenir ni CPT ni DAF.
- **Correction** : une seule table complète (statut de crédit **et** sous-état de décaissement), avec acteur par ligne, y compris REFUSE → EN_ANALYSE (réexamen), les retours automatiques, ANNULE tant que le sous-état n'est pas CONFIRME (et le message d'annulation vers le cœur) ; supprimer la phrase « le passage à EN_GESTION est refusé » de A.1 C4 (ou changer FR-78) ; dissocier deux événements de notification (« accordé » à la décision, « décaissé » à CONFIRME) ; recompter FR-12 et FR-93.

### K4 — Remise des espèces : double comptage possible et appariement non défini
- **Emplacement** : FR-135, FR-137, FR-138, FR-139, FR-143, FR-156, FR-252, annexe C (« Mouvement de paiement »).
- **Citations** : FR-137 « Prospera l'envoie comme « paiement à comptabiliser » » ; FR-138 « L'entrée d'argent au guichet (dépôt ou remboursement au guichet) est ensuite une opération du cœur, saisie par le CPT » ; FR-252 « écritures proposées […] remises d'espèces des collecteurs » ; annexe C « identifiant du paiement d'origine si renvoyé par Prospera » ; FR-156 « quitte la liste quand le cœur renvoie le mouvement correspondant ».
- **Problème** : un remboursement collecté en espèces est comptabilisé au cœur une première fois (paiement à comptabiliser, imputation sur le prêt), puis le CPT saisit « l'entrée au guichet » (remise), potentiellement une seconde fois comme remboursement ou dépôt ; FR-252 propose en plus une écriture de remise. Rien ne dit quelle est la contrepartie comptable de l'argent détenu par le collecteur avant la remise (compte d'attente ?), ni que la remise est un simple transfert interne sans crédit client. En mode « liste à saisir dans le cœur », c'est un opérateur du cœur qui retape le paiement : le mouvement revenu n'a pas d'identifiant d'origine, donc la règle « n'est confirmé que par le mouvement correspondant » n'a pas de clé (montant + client + date ? ambiguë, et FR-139 déclare « doublon » deux collectes à ±100 FCFA en 5 min). Le client tient un reçu « provisoire » : si le cœur refuse (REFUSEE) ou si le collecteur disparaît avant la remise, qui assume ? La date de valeur manque : les pénalités sont calculées par le cœur à la date de saisie, pas de paiement, donc un client qui a payé le jour J est pénalisé pour le délai de saisie.
- **Correction** : définir (i) la collecte comme encaissement pour compte de l'IMF à la date de valeur = date de la collecte ; (ii) la remise comme transfert caisse collecteur → caisse guichet, jamais un crédit client, avec le compte d'attente du cœur nommé dans l'annexe C ; (iii) un champ obligatoire « numéro de reçu Prospera » à recopier par l'opérateur du cœur (clé d'appariement) ; (iv) le reçu validé comme opposable à l'IMF dès signature du collecteur ; (v) retirer les remises de FR-252 ou les spécifier sans doublon.

### K5 — Le score est « une information » et en même temps une barrière et un levier de prix ; premier prêt impossible
- **Emplacement** : FR-34, FR-104, FR-124, FR-101, FR-99, FR-49, A.2 (C4), UJ-1.
- **Citations** : FR-34 « Si le score est absent (IA commune non installée), le critère de score est marqué « non évalué » et ne bloque pas » ; FR-104 « Sans score disponible […], la demande est refusée avec « score indisponible » ; elle n'est jamais acceptée par défaut. » ; FR-124 « Aucun octroi, rejet ou blocage n'est décidé par la note seule » ; FR-34 « Un client inéligible est **bloqué** » (score minimum 45) ; FR-101 « si le score du client est sous un seuil (défaut : 60), le taux monte de N points ».
- **Problème** : (1) FR-34 et FR-104 se contredisent frontalement (la H-8 de l'index ne retient que FR-34). (2) Un score minimum de 45 qui bloque la demande, et un score < 60 qui majore le taux, sont des décisions automatiques à effet financier, prises par un score fourni par une IA ou une règle v0 : FR-124 et §11 (« L'IA ne décide pas ») sont violés ; le seul recours est une dérogation du ROC. (3) Le barème v0 est « paiement 40, capacité 30, activité 20, terrain 10 » : pour un primo-emprunteur (Afi, UJ-1) la composante « paiement » (40 %) n'a pas de données, et « terrain » est l'appréciation du propre agent qui touche une prime sur les nouveaux clients. Rien ne définit la valeur initiale ; avec « jamais acceptée par défaut » le parcours phare UJ-1 échoue pour un nouveau client. (4) FR-99 dit que l'« ajustement du taux par le score » de la démo est supprimé s'il fait dépasser l'usure, FR-101 le crée.
- **Correction** : trancher : soit le score est une information (supprimer le blocage à 45 et la majoration de taux, ou les transformer en alerte), soit c'est une barrière documentée avec dérogation et droit du client à connaître le motif ; définir la valeur de départ sans historique (prior neutre, composante absente renormalisée) ; réécrire FR-34, FR-104 et A.2 C4 en une seule règle « score absent » ; retirer la tarification par score ou la confier à une grille de produit décidée par des humains, hors score IA.

---

## ÉLEVÉ

### H1 — Un paiement à moins de 1 % de l'échéance la solde ; la différence reste due, sans relance
- **Emplacement** : FR-139, FR-210, FR-256, FR-71 (décision A6).
- **Citations** : FR-139 « Un paiement de 49 800 FCFA pour une échéance de 50 000 (écart 0,4 %) est rattaché sans intervention » ; FR-210 « l'échéance passe à « payée en attente du cœur » » ; « Un paiement validé met fin aux relances ouvertes de l'échéance ».
- **Problème** : A6 dit « rattachement automatique » ; le PRD en fait « échéance payée ». Le cœur impute strictement : il reste 200 FCFA impayés, la pénalité court, le PAR compte le prêt (via le cœur), mais Prospera a clos les relances. Sur 1 000 prêts à 1 % de tolérance, c'est un trou systématique ; la tolérance de 1 % en trop-perçu (52 300 sur 52 000) accepte aussi 300 FCFA de trop sans les créditer.
- **Correction** : le rattachement automatique choisit l'échéance, il ne la solde pas ; tout écart non nul est un paiement partiel ou un trop-perçu (crédit du client) ; la relance ne s'arrête que quand le cœur confirme un reste dû nul ; une tolérance d'arrondi (quelques FCFA) est un paramètre distinct, aligné sur celle du cœur.

### H2 — Décaissement Mobile Money / PI-SPI : l'argent part, le cœur l'ignore ; RPO d'une heure
- **Emplacement** : FR-69, FR-154, FR-168, FR-266 (RPO/RTO), FR-267, Q13.
- **Citations** : FR-69 « un refus ou un délai de l'opérateur laisse le dossier à ORDONNE » ; FR-69 « Un décaissement PI-SPI confirmé est irrévocable » ; FR-154 « transmis au cœur comme « décaissement exécuté hors du cœur » » ; FR-266 « RPO de 1 heure et RTO de 4 heures […] point non tranché ».
- **Problème** : (a) il n'existe pas d'état « envoyé à l'opérateur, résultat inconnu » : un délai d'expiration laisse ORDONNE, d'où ré-émission possible d'un paiement déjà parti. (b) Après restauration (RPO 1 h), une instance peut avoir perdu l'ordre ou l'état d'un virement PI-SPI irrévocable déjà exécuté, puis le ré-émettre : double décaissement. FR-154 exige l'idempotence « par clé unique » mais la clé vit dans la base restaurée. (c) Le cœur enregistre un prêt financé par un mouvement qu'il n'a pas exécuté : aucune contrepartie (compte de l'opérateur) n'est définie dans l'annexe C. Q13 est traitée « à revoir avec la taille réelle » alors que ce risque est indépendant de la taille.
- **Correction** : ajouter l'état INCONNU avec réconciliation obligatoire contre le relevé du fournisseur avant toute ré-émission ; clé d'idempotence transmise au fournisseur (txId) et jamais régénérée ; au redémarrage ou à la restauration, tâche de rapprochement des ordres de la dernière heure avec le fournisseur ; écriture synchrone (outbox transactionnelle) pour tout acte qui déplace de l'argent ; compte d'attente du cœur nommé dans l'annexe C.

### H3 — Le relais Money Vibes : événements servis une seule fois, et données client chez Money Vibes
- **Emplacement** : FR-158, FR-263, FR-15, FR-258.
- **Citations** : « un événement tiré n'est plus servi à la même instance » ; « Les données de l'IMF restent sur ses serveurs » (FR-15) ; « Le relais […] sert le lien de paiement ».
- **Problème** : (a) livraison « au plus une fois » : si l'instance plante entre le tirage et l'écriture durable, la notification de paiement PI-SPI ou FedaPay est perdue et l'argent reçu n'est jamais rapproché (le relais « ne conserve que le strict nécessaire »). (b) La page publique du lien affiche forcément un montant et un nom : le relais détient donc des données personnelles et financières de clients de l'IMF, ce qui contredit FR-15, §7.9 et la promesse « Money Vibes ne lit aucune donnée métier » ; ni jeton (entropie, expiration, usage unique), ni contenu affiché, ni statut de sous-traitant ne sont spécifiés.
- **Correction** : livraison avec accusé (bail + ack après écriture durable, rejeu dans une fenêtre) et rapprochement périodique contre le relevé du fournisseur ; spécifier le contenu minimal du relais (jeton opaque, prénom + montant, TTL, usage unique), la durée de conservation, et inscrire Money Vibes comme sous-traitant dans les consentements.

### H4 — Fraude à l'octroi : visite non indépendante, bénéficiaire libre, séparation des tâches limitée aux espèces
- **Emplacement** : FR-45, FR-46, FR-118, FR-64, FR-66, FR-6, FR-59, annexe B (lignes « Ordre de décaissement »), FR-256.
- **Citations** : FR-45 « La visite peut être faite par le CC ou par un agent terrain désigné » ; FR-46 « distance entre la position de la visite et l'adresse du client » ; FR-118 position « prise par l'appareil sur place » à la création de la fiche ; FR-64 « compte ou numéro de destination » ; annexe B « Ordre de décaissement (Mobile Money, PI-SPI, virement) | ROC A | CPT A » ; FR-256 « validé par une **autre** personne ».
- **Problème** : (a) la position du domicile est capturée par l'agent qui crée la fiche, puis la visite est comparée à elle : une fiche fictive ou un faux client visité par le même agent passe le contrôle des 100 m ; rien n'impose que le visiteur soit différent de l'agent qui a créé la fiche ou la demande et touche la prime « nouveaux clients » (FR-240, FR-242). (b) Le numéro de destination est libre : rien ne le lie au client KYC (titulaire du portefeuille, IBAN) ni ne bloque son changement après le comité (FR-59 ne cite que pièce, garantie, montant). (c) FR-6 ne sépare « décider » et « autoriser » que pour les **espèces** ; pour Mobile Money, PI-SPI et virement le ROC qui a approuvé peut émettre l'ordre, et `paiement` exige une seconde personne qui n'est mappée à aucun rôle (aucune colonne « D » dans la matrice).
- **Correction** : visiteur ≠ créateur de la fiche ≠ auteur de la demande ; bénéficiaire pré-enregistré au KYC (nom du titulaire contrôlé, numéro vérifié), tout changement exigeant double contrôle et délai ; étendre FR-6 à tous les canaux (préparateur ≠ valideur ≠ décideur ROC) et nommer dans la matrice le rôle de second valideur de `paiement`.

### H5 — « ADMIN_IMF ne lit aucune donnée métier » et « journal infalsifiable » : non réalisables ni testables sur le serveur de l'IMF
- **Emplacement** : FR-5, FR-9, FR-80, FR-191, FR-265, FR-269, FR-86, annexe B, NFR-5, NFR-6.
- **Citations** : FR-5 « un test ouvre chaque écran métier avec ce rôle et vérifie le refus » ; FR-9 « Aucune entrée du journal ne peut être modifiée ni supprimée, même par ADMIN_IMF » ; FR-191 « le mot « infalsifiable » n'est écrit nulle part dans l'interface tant qu'il n'est pas prouvé » ; FR-265 « Le système d'exploitation, Docker et les correctifs de l'hôte restent à la charge de l'IMF » ; annexe B ADMIN_IMF « A (technique) » sur les écarts du cœur, « A » sur les paramètres métier ; FR-86 « ne lit pas les valeurs métier mais applique la configuration ».
- **Problème** : l'équipe informatique de l'IMF (ou son prestataire) possède l'hôte, la base, la clé de restauration et les sauvegardes. Refuser des écrans ne protège pas contre une lecture ou une modification directe de la base ; le test proposé ne vérifie que l'interface. NFR-6 et FR-9 exigent l'« infalsifiable » alors que FR-191 interdit d'écrire le mot. L'ADMIN agit sur la file des écarts du cœur (montants, clients) et saisit des paramètres métier, donc lit de la donnée métier.
- **Correction** : écrire le modèle de menace : ce qui est garanti (pas d'accès par l'application) et le risque résiduel assumé ; si la garantie est voulue, chiffrement des champs sensibles avec clés détenues par DG ou DAF, journal chaîné avec ancrage externe périodique (empreintes hors de l'hôte) ; définir « donnée métier » (contenu client, montants) contre « configuration », et retirer de l'ADMIN l'accès aux écarts ; remplacer « infalsifiable » par « détectable à l'altération » partout, ou le prouver.

### H6 — Pas de correctifs de sécurité sans contrat de maintenance
- **Emplacement** : FR-261, FR-262, §12.2.
- **Citations** : « La livraison des **correctifs de sécurité** sans contrat de maintenance n'est **pas tranchée** » ; « Une mise à jour reçue **sans contrat de maintenance valide** est refusée ».
- **Problème** : la décision B3 (licence à vie, jamais de coupure) est respectée, mais sa lecture « mises à jour liées au contrat » (ASSUMPTION non confirmée) crée un danger : une IMF qui détient des pièces d'identité, GPS et données financières sur un serveur qui ne reçoit plus de correctifs ; en cas de faille, la responsabilité retombe sur Money Vibes et sur la réputation du produit. FR-262 refuse même l'application d'un correctif.
- **Correction** : décider avant la signature que les correctifs de sécurité et de conformité réglementaire (plafond d'usure, listes de sanctions, textes BCEAO) sont livrés indépendamment du contrat de maintenance, pendant une période de support définie ; sinon écrire noir sur blanc la clause de décharge.

### H7 — Le contrat d'échange (annexe C) ne couvre pas ce que le corps du PRD envoie ou lit
- **Emplacement** : annexe C, FR-152, FR-166, FR-116, FR-106, FR-12, FR-38, FR-64, FR-75, FR-139, FR-219, FR-220, FR-221, FR-125.
- **Citations** : FR-152 « Prospera renvoie au cœur : les dossiers accordés […], les ordres de décaissement à exécuter, et […] les remboursements » ; FR-166 « Chaque objet de l'annexe C marqué « cœur → Prospera » est produit par le cœur fictif » ; FR-220 « Le plan est **envoyé au cœur** » ; FR-221 « La décision est **envoyée au cœur** ».
- **Problème** : n'existent pas dans les 15 objets : création du client côté cœur (FR-116 dit « Prospera demande au cœur de créer le client »), création de l'agence (FR-12 dit que le cœur fictif « accepte l'agence créée » alors que l'objet Agence est cœur → Prospera), annulation d'un dossier ou d'un ordre, nouvel échéancier d'étalement, perte définitive, transfert au contentieux, annulation de collecte, blocage et restitution du dépôt de garantie, ouverture de compte d'épargne, classe de risque et provisions officielles (FR-125 compare à « la classe du cœur »). L'objet Prêt ne dit pas si « montant décaissé » est brut ou net des frais (FR-64 : ordre net). Un cœur fictif fidèle au contrat ne peut donc pas jouer UJ-1, UJ-7 ni la clôture.
- **Correction** : dresser la table des messages sortants et entrants à partir des FR (chercher « envoyé au cœur ») et compléter l'annexe C avant l'addendum ; ajouter la direction, la clé d'origine et l'état de chaque objet ; lever l'ambiguïté brut/net.

### H8 — Le marquage ★ ne délimite rien : 217 FR sur 256 pour deux développeurs
- **Emplacement** : §0, §10.1, §12.2 (Q4), FR-1, FR-94, FR-169, FR-170, tout le PRD.
- **Citations** : FR-1 « Ne sont jamais « bientôt » : tout ce qu'exige le parcours UJ-1 […], et l'application terrain hors connexion » ; §12.3 « La démo de février est délimitée (★) ».
- **Problème** : (décision Q4 respectée ; je ne parle pas de la charge totale mais de ce que le PRD prétend en faire.) Comptage par section : parties 1 et 2 (15 + 71), 6.1 (14), 6.2 (21), 6.3 (8), 6.5 (17), 6.6 (7), 6.7 (10), 7.1 (9), 7.2 (21), 7.3 (15), 7.9 (9) = **217 FR ★**, plus 15 contrats de module, 16 comptes de démo, un cœur fictif qui fait vivre 1 000 prêts en continu avec deux transports (API et fichiers) et injection de pannes (FR-169, FR-170), la double voie A1 (envoi au cœur **et** liste à saisir), le parcours groupe en démo (FR-94) et une trentaine de FR d'IA. Si février glisse, rien n'indique quoi couper.
- **Correction** : trois niveaux dans le ★ avec la liste des FR de chacun (T1 : UJ-1 de bout en bout + cœur fictif minimal + 5 rôles ; T2 : recouvrement et pilotage du DG ; T3 : IA en emplacement vide, groupes, caisse collecteur, bascule de transports, fabrication continue des 1 000 prêts), et pour chaque FR T3 une version « emplacement vide » qui passe la recette.

### H9 — IA : pas de moteur avant fin 2027, repli v0 non spécifié, et deux « décisions » présentées comme acquises
- **Emplacement** : FR-8, §12.3, D-16 (§12.1), FR-237, Q9, FR-95, FR-207, FR-228, FR-229, FR-190.
- **Citations** : §12.3 « premier modèle commun au plus tôt au second semestre 2027 » ; D-16 « Copilot réel au jour 1 » ; FR-237 « sans lui, l'emplacement affiche « bientôt » » et « lieu d'exécution du moteur de langage à trancher » ; FR-207 « La dictée demande une connexion ».
- **Problème** : (a) une trentaine de FR décrivent des capacités d'IA ; en février elles sont toutes « règle explicable v0 », mais le PRD ne spécifie une règle v0 que pour le score, la tendance du PAR, l'ordre des visites et la priorité des relances ; l'analyse narrative (FR-95), le rapport du soir rédigé, la stratégie (FR-228), les scripts (FR-229), la synthèse du DG ne peuvent pas être des règles : ce sont des emplacements vides, donc non testables. (b) D-16 « Copilot réel au jour 1 » est conditionné par Q9 (où tourne le moteur de langage) et par un consentement : par défaut, « bientôt ». La décision du PO est ainsi contredite en silence par FR-237. (c) La dictée vocale envoie de l'audio à un moteur de reconnaissance externe : les données quittent l'IMF hors du cadre « consentement IA commune ». (d) FR-190 laisse l'IA « remplir le gabarit » d'un état réglementaire.
- **Correction** : un tableau « capacité | règle v0 spécifiée (oui/non) | livré en février ou emplacement vide | test possible » ; reformuler D-16 en « Copilot réel si Q9 tranchée, sinon emplacement » ; décider Q9 avant l'architecture ; reconnaissance vocale hébergée chez l'IMF ou désactivée sans consentement spécifique ; pour tout état réglementaire, chiffres calculés par règle, texte seul rédigé par modèle.

### H10 — Dépendances sur des modules, droits et adaptateurs qui n'existent pas
- **Emplacement** : FR-65, FR-66, annexe A (en-tête, A.1 C7), FR-256, FR-255, FR-237, §7.7.
- **Citations** : FR-65 « souscrite par le crédit auprès du module `assurance` si installé » ; FR-66 « assurance décès-invalidité souscrite si le produit l'impose » ; annexe A « Chaque droit demande une PR `auth-service` (catalogue fermé) » ; « Codes à tiret : `produits-financiers`, `coeur-sfd`, `risque-par` et `conformite-bceao` attendent l'élargissement du format de droits » ; FR-256 « `paiement` n'a pas encore d'adaptateur Mobile Money sortant ».
- **Problème** : (a) le PRD assurance n'est pas écrit (§0) mais le produit de démo impose l'assurance (FR-65) : sans module `assurance`, la garde de FR-66 bloque UJ-1 ; la souscription d'une assurance emprunteur par un SFD (intermédiation d'assurance) n'est examinée nulle part. (b) Trois des quatre modules à tiret sont ★ ; l'amendement de format de droits d'`auth-service` n'est pas fait (Q5 ouverte) et les droits (13 pour le seul `credit`) exigent chacun une PR de catalogue : chemin critique caché. (c) Adaptateur Mobile Money sortant, `assistant-service`, invitation SMS (STORY-900) : non livrés.
- **Correction** : ajouter en §12.2 une liste de **préalables bloquants** (propriétaire, date) distincte des questions ; pour chaque UJ, indiquer ce qui s'exécute si le préalable manque ; trancher dès maintenant le produit de démo sans assurance obligatoire.

### H11 — IA et équité : aucune liste d'attributs interdits, zones comme proxy, pas de suivi d'effet disparate
- **Emplacement** : FR-115, FR-124, FR-128, FR-208, FR-96, FR-88, §9.
- **Citations** : FR-115 collecte « genre, date de naissance, nationalité, situation matrimoniale, personnes à charge » ; FR-124 score « paiement 40, capacité 30, activité 20, terrain 10 » ; FR-208 « Une zone à PAR élevé est signalée « à risque » : elle n'est pas proposée à la prospection sans la mention du PAR » ; FR-88 « Le contenu ne révèle jamais le motif détaillé d'un refus ni de score ».
- **Problème** : le PRD fournit au score et aux analyses micro et macro tout ce qu'il faut pour discriminer (genre, situation familiale, zone géographique, nom) sans interdire quoi que ce soit ; l'IA oriente la prospection en évitant les zones à PAR élevé (cercle vicieux de sous-couverture) ; les indicateurs de vigilance (§9) mesurent la part d'écarts à l'IA mais jamais le taux d'acceptation par genre ou zone ; le client ne peut pas connaître le motif de sa décision. Pour une IMF dont le public est majoritairement féminin et rural, c'est un risque réglementaire et réputationnel.
- **Correction** : liste fermée des variables autorisées dans le score v0 et dans tout modèle (sans genre, situation matrimoniale, nationalité), audit des variables substitutives (zone, nom), indicateur d'équité (taux d'acceptation, taux de refus par genre, zone, secteur) lu par AUD et RSQ, droit du client à un motif communicable.

---

## MOYEN

### M1 — Seuils contradictoires entre sections (les « seuils par défaut » ne sont pas un jeu unique)
- **Emplacement** : FR-179, FR-231, FR-235, FR-97, FR-177, FR-233, FR-215, FR-113, FR-47, NFR-2, NFR-3, NFR-4, FR-9, FR-191, FR-244, FR-3, FR-86, FR-10.
- **Citations** : FR-179 « PAR30 d'une agence au-dessus de 5 % passe « alerte » et au-dessus de 10 % « critique » » contre FR-235 « 10 % (BCEAO) ; 8 % (interne) » et FR-231 « rouge au-dessus de 10 %, orange au-dessus de 8 % » ; concentration sectorielle : 28/35 % (FR-177), 35 % (FR-97), 30 % (FR-233, FR-235), 25 % (audit) ; FR-113 « mensualité au plus égale à […] 40 % » contre FR-47 « taux d'effort critique au-dessus de **33 %** » ; NFR-2 « moins de 5 s » contre FR-231 « rafraîchissement toutes les 5 minutes » ; NFR-3 « 99,5 % » contre RTO de 4 h sans haute disponibilité ; NFR-4 « une fois par trimestre » contre FR-267 « test de restauration mensuel » ; FR-9 « lisible par l'AUD seul » contre FR-191 « AUD et DG ».
- **Problème** : un test qui change « chaque paramètre listé » (FR-3) ne sait pas quelle valeur est la référence. Le PAR 30 défini par le PO (D5 : alerte 5 %, critique 10 %) est contredit par les écrans du DG (8 %/10 %). L'IA propose une mensualité à 40 % du revenu, déjà « critique » à 33 % pour le CC. Les dates de référence des paramètres divergent : soumission (FR-3), décision (FR-86), comité (FR-10), publication (FR-108).
- **Correction** : une table unique des paramètres (valeur, unité, date de référence, FR propriétaire) en annexe ; chaque FR la cite au lieu de redéfinir ; aligner les NFR.

### M2 — Provisions : 40 % sur l'encours entier dès un jour de retard
- **Emplacement** : FR-175, FR-176, FR-231, FR-181.
- **Citations** : FR-175 « Dès **une échéance impayée**, la totalité de l'encours est déclassée » ; FR-176 « 40 % pour un impayé de 6 mois au plus ».
- **Problème** : (barème accepté par le PO en D6 ; je signale le danger.) Appliqué à la lettre, un prêt en retard d'un jour porte 40 % de provision proposée sur l'encours entier ; avec un PAR1 de 15 à 25 % dans la démo, le « provisions proposées contre comptabilisées » du DG (FR-231) montre un écart colossal et un coût du risque absurde, qui discréditerait la démo devant un praticien SFD. Le PRD dit lui-même (FR-176, §12.3) que le barème est « à faire confirmer ».
- **Correction** : afficher la provision par tranche de jours avec le libellé « proposition au barème X, non validée », ajouter un test de plausibilité sur le jeu de démo (provision proposée / encours) et obtenir la confirmation du praticien avant la démo.

### M3 — Sur-endettement et incitations : rien ne bloque, tout pousse au volume
- **Emplacement** : FR-47, FR-48, FR-44, FR-113, FR-240, FR-242, FR-76.
- **Citations** : FR-48 « Une alerte ne refuse jamais seule : elle informe » ; FR-44 consultation du BIC « non obligatoire » par défaut ; FR-240 AT : « nouveaux clients 25 ; prospects convertis en clients 20 » ; CC : « taux de décisions du ROC conformes à l'avis 20 » ; FR-242 « Chaque agent voit sa seule prime d'objectifs ».
- **Problème** : taux d'effort excessif et endettement externe ne sont que des alertes ; l'endettement externe n'est connu que par déclaration (BIC facultatif). Les KPI d'agent récompensent le volume sans terme de qualité (PAR à 12 mois seulement pour le CC, 10 points) et le renouvellement est automatique si le retard précédent est ≤ 30 jours (FR-76). Danger classique de protection des clients.
- **Correction** : plafond bloquant de taux d'effort (paramètre, dérogation du ROC), PAR 90 de ses dossiers dans les KPI de l'AT, BIC obligatoire pour les montants élevés, suppression du KPI « conformité à l'avis ».

### M4 — LBC/FT : seuils calés sur la déclaration d'espèces, accueil des fonds d'une personne sanctionnée
- **Emplacement** : FR-121, FR-123, FR-135, FR-119.
- **Citations** : FR-123 « seuil de déclaration des transactions en espèces (défaut : 15 000 000 FCFA […] selon une source secondaire […] **à confirmer par un juriste**) » et alerte à « 80 % du seuil sur 7 jours » ; FR-121 « remboursements et dépôts jamais refusés » ; FR-135 « un client […] en correspondance de sanctions peut rembourser et déposer ».
- **Problème** : la décision E3 (LBC/FT important, mise à jour régulière) est respectée, mais avec des tickets de quelques dizaines de milliers de FCFA une alerte à 12 millions sur 7 jours ne déclenchera presque jamais : le contrôle est cosmétique, aucun scénario de fractionnement ou de comportement atypique n'est listé. Pour une vraie correspondance de sanctions, encaisser sans geler peut constituer une faute ; le PRD renvoie le gel à une « décision de l'IMF » sans procédure ni délai ni déclaration de soupçon. Le rôle d'« agent de conformité » est une habilitation (H-27), donc un dix-septième rôle de fait sans matrice d'accès.
- **Correction** : liste de scénarios de soupçon avec seuils propres à la microfinance, procédure « correspondance confirmée » (gel, déclaration, délai) validée par un juriste, et ligne de matrice pour l'habilitation conformité.

### M5 — Le comité : le ROC compte pour deux, l'autre membre vient de la même chaîne
- **Emplacement** : FR-56, FR-57, FR-6, annexe B.
- **Citations** : « quorum du ROC plus un membre de la direction (DG ou RA) » ; FR-6 ne lie pas la décision du ROC à son vote au comité.
- **Problème** : (décision C6 acceptée.) Le ROC approuve seul, puis siège au comité dont le quorum est lui-même plus le RA de l'agence d'origine (hiérarchiquement lié à l'agent et au CC) : sous 5 M FCFA, aucune voix véritablement indépendante. FR-82 ne couvre pas ce cas.
- **Correction** : enregistrer le vote de chacun et interdire que le seul « autre » membre soit le RA de l'agence qui a instruit ; ou exiger le DG ou le RA d'une autre agence au-dessus d'un seuil bas ; ajouter la combinaison à FR-6.

### M6 — Blocage collectif : un dossier bloqué suspend les demandes de toutes les cautions
- **Emplacement** : FR-218, FR-224, FR-30.
- **Citations** : « suspend toute nouvelle demande de crédit du client et de ses cautions » ; FR-224 « les autres membres du groupe » sont les cautions.
- **Problème** : (D1 accepté.) Dans un groupe solidaire (5 à 30 membres), chacun est caution des autres : bloquer un membre suspend la demande de crédit de tout le groupe, y compris les membres à jour ; un garant d'un seul prêt est pénalisé pour tous ses propres besoins, sans limite de durée ni recours.
- **Correction** : distinguer client (blocage plein) et caution (blocage seulement si la caution a été « APPELEE »), recours du client bloqué, durée maximale avant réexamen, test sur un groupe de 5.

### M7 — Asymétrie du motif face à l'IA : suivre la proposition est gratuit, s'en écarter coûte
- **Emplacement** : FR-49, FR-51, FR-54, FR-95, FR-112, §9.
- **Citations** : « Un écart du CC, du ROC ou du comité avec la décision suggérée exige un **motif** » ; FR-95 « priorité (1 à 3 étoiles) […] sentiment (positif, neutre, négatif, critique) affichés sur la carte du pipeline ».
- **Problème** : le coût administratif pousse à entériner ; la décision suggérée « REFUSER » et le « sentiment critique » ancrent les décideurs avant lecture du dossier ; le seul garde-fou est un indicateur de vigilance (§9) sans seuil. Au regard du principe « l'humain décide », c'est une décision automatique par inertie.
- **Correction** : même exigence de motif pour suivre ou s'écarter (ou pour aucun des deux pour les décisions favorables), affichage de la proposition après la saisie du premier avis du CC, suppression du « sentiment » sur les cartes, seuil et alerte AUD sur la part d'alignement.

### M8 — Création de rôles : « deux personnes » peut être deux informaticiens
- **Emplacement** : FR-5, FR-244, FR-265, FR-120.
- **Citations** : « chaque création ou retrait de rôle fait intervenir deux personnes (décision F7) » ; « La création d'un administrateur et l'attribution d'un droit `instance:*` demandent **deux personnes** » ; seuls DAF, AUD, ROC sont « sensibles ».
- **Problème** : le second intervenant n'est pas nommé ; deux ADMIN_IMF (équipe informatique) peuvent créer un CC et un CPT complices (instruire et autoriser un décaissement en espèces) sans aucune validation métier ; FR-6 ne s'applique qu'à une personne, pas à des comptes créés par la même chaîne.
- **Correction** : tout rôle d'instruction, de décision ou d'autorisation d'argent (CC, ROC, RA, CPT, DAF, DG, COLL) exige la validation d'un rôle métier (DG ou RA), pas seulement d'un autre administrateur ; journal des créations lu par l'AUD.

### M9 — Application hors ligne : données client sur le téléphone sans exigence de chiffrement local
- **Emplacement** : FR-204, FR-136, NFR-5, FR-118.
- **Citations** : « Le stockage local est limité à 500 Mo » ; « Un collecteur dont l'appareil est perdu est déconnecté à distance ; la file est envoyée avant l'effacement ».
- **Problème** : photos de CNI, GPS, collectes et reçus sur des Android d'entrée de gamme (NFR-9) ; l'effacement à distance n'agit que si le téléphone se reconnecte ; « la file est envoyée avant l'effacement » est impossible sur un téléphone volé hors réseau ; ni PIN ou biométrie, ni chiffrement local, ni purge automatique après N jours de non-connexion ne sont exigés ; la double authentification (FR-5) ne couvre pas AT et COLL.
- **Correction** : chiffrement local obligatoire avec clé liée à la session, verrouillage et auto-effacement après délai hors connexion, effacement au prochain contact, et l'état « appareil perdu » visible dans la file du CPT.

### M10 — Messages aux cautions, WhatsApp et contenu des relances : cadre juridique ouvert, volumétrie non traitée
- **Emplacement** : FR-258, FR-212, FR-223, FR-224, FR-15.
- **Citations** : « Les messages aux **cautions** d'un prêt en retard demandent un cadre de consentement à faire vérifier » ; gabarit « votre échéance de {montant} FCFA du {date} est {statut} ».
- **Problème** : informer des tiers (cautions, autres membres du groupe) du retard d'un client est une divulgation de données personnelles ; le PRD l'automatise à J+7 pour les groupes (FR-224) avec une mention « à faire vérifier ». Par ailleurs, J+3 et au-delà sont à valider « par le GP, chaque envoi » (FR-212) : sur un portefeuille réel c'est une file ingérable, donc contournée (activation automatique de fait).
- **Correction** : base légale écrite dans le contrat de prêt et consentement de la caution au moment de la garantie ; validation par lots avec échantillonnage pour les paliers sans risque ; plafond de messages par client et par semaine pour les messages de recouvrement aussi.

### M11 — FR-190 : l'IA « remplit » un état réglementaire
- **Emplacement** : FR-190, FR-185, FR-186.
- **Citations** : « l'IA remplit le gabarit (FR-185), repère les données manquantes et propose le texte de synthèse ».
- **Problème** : même validé par le DG, un état envoyé à l'autorité dont des cellules sont générées par un modèle est un risque d'erreur factuelle ; « Un champ que l'IA ne peut pas remplir reste vide » ne couvre pas un champ rempli à tort.
- **Correction** : les valeurs viennent exclusivement de `risque-par` et du cœur (FR-185) ; le modèle ne produit que le texte libre, jamais un chiffre ; rapprochement automatique texte-chiffres avant validation.

### M12 — Machine à états du recouvrement : trous et impasses
- **Emplacement** : FR-214, FR-219, FR-221, FR-220, FR-75, FR-225.
- **Citations** : « `BLOQUE` → `CONTENTIEUX_JUDICIAIRE` | ROC propose, **DG décide** » ; « `BLOQUE` → `PERTE_DEFINITIVE` » ; FR-221 « Un paiement reçu après la perte est enregistré normalement (le cœur fait foi) ».
- **Problème** : contentieux et perte ne s'atteignent que depuis BLOQUE ; le prêt doit donc être d'abord bloqué (avec ses effets sur les demandes de toutes les cautions) ; absents : EN_RECOUVREMENT → REGULARISE, PLAN_ETALEMENT → EN_RETARD (échec du plan, cité en FR-220 mais pas dans la table), CONTENTIEUX → REGULARISE, recouvrement après radiation (le prêt radié « ne se clôture pas par ce chemin » et aucun autre chemin n'existe : il restera ouvert à jamais).
- **Correction** : table complète avec acteur et garde, état « RADIE_RECOUVRE » ou clôture par solde nul même après perte, et justification du passage obligé par BLOQUE.

### M13 — Décisions en attente traitées comme acquises, amendements de modules voisins non acceptés
- **Emplacement** : §12.2 (Q5 à Q13), FR-255 à FR-258, FR-263, FR-211, H-56, H-58, H-62.
- **Citations** : §7.7 « Un écart est **à porter au PRD du module** : son propriétaire l'amende ou le refuse ; tant que ce n'est pas fait, l'exigence tient ici » ; FR-221 « aucune valeur par défaut, l'IMF la fixe avant la mise en service » ; FR-211 « dossier de recouvrement ouvert **par prêt** (et non par client, défaut du noyau) ».
- **Problème** : FR-255 à FR-263 sont comptés comme exigences testables alors qu'elles reposent sur des amendements à `reseau`, `paiement`, `notification` et au spine moteur (AD-9) que leurs propriétaires n'ont pas acceptés ; Q6 change le modèle d'un module partagé ; Q8 (seuil de perte au conseil) n'a pas de valeur, donc FR-221 n'est pas testable ; Q9 est ouverte alors que FR-237 la présuppose.
- **Correction** : marquer ces FR « sous réserve d'amendement » avec la date limite et le repli (comportement sans l'amendement) ; donner une valeur par défaut à Q8.

### M14 — Éligibilité : « ancienneté d'activité ou de relation » et premier parcours
- **Emplacement** : FR-34, FR-104, UJ-1.
- **Citations** : « **ancienneté minimum** d'activité ou de relation (paramètre ; défaut : 3 mois) » ; UJ-1 : la fiche d'Afi est créée le jour de la rencontre.
- **Problème** : si l'ancienneté est celle de la relation, Afi (créée le jour même) est inéligible et doit attendre trois mois ; si c'est celle de l'activité, la donnée est déclarative, non vérifiée (la visite ne la prouve pas). Le parcours n° 1 n'a pas de réponse.
- **Correction** : choisir une seule définition (activité, déclarée et confirmée par la visite), la mettre dans la checklist, et corriger UJ-1 en conséquence.

---

## FAIBLE

### F1 — Comptes qui ne se recoupent pas
- **Citations** : le PRD annonce « réponses aux 71 questions » (en-tête, §12.1) ; `questions-po-2026-11-13.md` en annonce 68 ; l'index §13 s'arrête à H-70 alors que le texte parle de 71 hypothèses ; FR-12 « douze statuts du chemin nominal ».
- **Correction** : régénérer les comptes depuis le texte.

### F2 — Numérotation et ordre
- **Emplacement** : §6.5 (FR-199 rangé après FR-165, avant FR-166 à FR-198) ; FR-257 cité avant sa section.
- **Problème** : FR-199 apparaît dans le corps de la section 6.5 alors que 166 à 198 suivent : les renvois et les épics risquent de se tromper.
- **Correction** : renuméroter ou noter la règle « 199 = IA du cœur » en tête de section.

### F3 — Surspécification et précision de façade
- **Emplacement** : FR-8 (répété), FR-180, FR-181, FR-190, FR-194, FR-199, FR-109 (« moins de 500 ms pour 36 échéances »), FR-188 (« 15 secondes pour 50 000 prêts »), FR-171 (« 10 minutes »), FR-179 (« plus de 0,8 point »), 72 occurrences de `[ASSUMPTION]`.
- **Problème** : le même paragraphe « Règles de cette capacité » est recopié mot pour mot dans au moins six FR, et des dizaines de chiffres précis ne reposent sur aucune source ; pour une démo de deux développeurs cela noie les exigences réellement critiques (usure, EN_GESTION, cœur fictif) et donne une fausse précision.
- **Correction** : un renvoi à FR-8 au lieu de la copie ; ne garder en seuils chiffrés que ceux que la démo doit montrer, le reste en « paramètre à définir ».

### F4 — Étiquette « Réalise UJ-1 » sur 88 FR
- **Problème** : une étiquette présente sur 88 exigences ne trace plus rien ; elle ne permet pas de dire quelles FR sont nécessaires au premier parcours.
- **Correction** : distinguer « nécessaire à UJ-1 » (chemin critique) de « touché par UJ-1 ».

### F5 — « Seize rôles » et habilitations
- **Emplacement** : FR-5, FR-120, H-27.
- **Problème** : la décision F1 fixe seize rôles ; l'habilitation de conformité, le délégué du ROC (FR-85), le second valideur de `paiement` en font de fait plus, sans ligne dans l'annexe B.
- **Correction** : ajouter les habilitations à la matrice.

### F6 — Reçus et numérotation hors ligne
- **Emplacement** : FR-135.
- **Citations** : « Le numéro de reçu est continu pour un collecteur ; hors ligne, il est attribué sur l'appareil à partir d'une plage réservée ».
- **Problème** : « sans trou » et « plage réservée » sont incompatibles quand un appareil est perdu ou réinitialisé (la plage non consommée crée des trous) ; l'AUD verra des alertes légitimes.
- **Correction** : dire que les trous sont déclarés (plage restituée, annulée) et non des anomalies.

---

## Ce que le PRD fait bien (pour ne pas le casser en corrigeant)

Le cadrage « le cœur fait foi », la distinction dossier de crédit / prêt, le « jamais bloquant » pour l'IA, la règle « jamais de zéro pour une donnée absente », le refus de simuler les boutons, l'idempotence partout, le refus d'un cœur fictif en production et les ASSUMPTION étiquetées sont de vraies qualités ; les corrections ci-dessus visent à les rendre cohérentes entre elles, pas à les remettre en cause.
