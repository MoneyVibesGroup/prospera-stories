# Revue adverse de la spine Microfinance (IMF)

Date : 2026-11-13. Cible : `ARCHITECTURE-SPINE.md` (AD-1 → AD-25) et `.memlog.md`. Source de contrôle : PRD final (annexes C et D). Méthode : pour chaque trou, deux épics qui obéissent chacun à la lettre à toutes les AD et qui pourtant se construisent de façon incompatible.

## Verdict

La spine fixe bien les propriétaires de dossiers et la frontière avec le cœur, mais elle laisse **sept trous critiques** sur le chemin de l'argent (clé d'un ordre rejeté, clé et appariement des reçus, propriétaire du passage EN_ATTENTE_COEUR → confirmé, reste dû d'une Créance, identité d'une échéance, PAR à l'arrêté) et **un trou critique de conformité** (des faits de soupçon publiés sur le bus, contraire à AD-22) : tant qu'ils ne sont pas fermés par des AD, deux épics honnêtes produiront des doubles paiements, des écarts permanents ou un PAR réglementaire faux.

Bilan : **8 critiques, 11 élevés, 6 moyens** (25 paires).

---

## CRITIQUE

### K1. Un ordre rejeté revient À_ORDONNER, mais sa clé « n'est jamais régénérée »
- **Unités** : épic `credit` (machine à états, sous-état de décaissement) et épic `coeur-sfd` (file d'envoi, journal).
- **Obéissance** : AD-5 dit que la clé naît une fois à À_ORDONNER → ORDONNE, jamais régénérée ; qu'un ordre rejeté revient À_ORDONNER avec son motif. `credit` réutilise la clé au deuxième ORDONNE (lettre de « jamais régénérée »). `coeur-sfd` déduplique par `messageId` / clé d'origine et rejoue la réponse mise en cache : « rejeté » (lettre d'AD-7, rejouer sans effet).
- **Divergence** : le deuxième essai (après correction du bénéficiaire, du canal ou du compte) est rejoué comme le même ordre, le rejet est renvoyé sans que le cœur ait revu l'ordre : dossier bloqué en boucle. Variante : `credit` régénère « parce que l'ordre est neuf » et le cœur, qui avait peut-être exécuté un rejet « expiré », paie deux fois.
- **AD à ajouter (remplace la 3e puce d'AD-5)** : « Un ordre est identifié par `ordreId` (créé à À_ORDONNER → ORDONNE) et par un `numeroEssai` (entier, 1 au départ). La clé d'idempotence transmise est `ordreId` seul tant que l'ordre est non terminal (EN_ATTENTE, INCONNU) et **ne change jamais**. Un ordre REJETE ou EXPIRE est **terminal** : le retour À_ORDONNER crée un **nouvel `ordreId`** qui référence `ordreIdPrecedent`. Un ordre INCONNU n'est jamais terminal : il ne devient REJETE ou EXECUTE que sur confirmation du cœur ou du fournisseur. `credit` est seul à créer un `ordreId` ; `coeur-sfd` et `paiement` ne le dérivent jamais. »

### K2. La clé d'appariement « numéro de reçu » ne désigne pas un mouvement
- **Unités** : épic `collecte` (reçus numérotés) et épic `coeur-sfd` (objets Remboursement, Mouvement d'épargne, Remise, Annulation de collecte).
- **Obéissance** : AD-8 : la clé d'origine Prospera est le numéro de reçu ; `coeur-sfd` apparie « par cette clé seule ». `collecte` émet un reçu par visite ; `coeur-sfd` envoie un objet par ligne.
- **Divergence** : un reçu couvre plusieurs lignes (remboursement de 2 prêts, épargne + remboursement, annulation partielle). `coeur-sfd` envoie N objets avec la même clé ; le cœur crée N mouvements recopiant le même reçu ; l'appariement « par la clé seule » est ambigu (un fait, N mouvements, ou l'inverse). Le fictif, lui, ne génère qu'un mouvement par reçu : la démo passe, le vrai cœur non.
- **AD à ajouter (précise AD-8)** : « La clé d'appariement est le couple `(numeroRecu, numeroLigne)`. `collecte` est seul à numéroter les lignes ; un reçu a au plus une ligne par (prêt ou compte, nature). Tout objet de l'annexe C portant de l'argent saisi dans Prospera porte ce couple, et le cœur fictif refuse de recopier un reçu sans numéro de ligne. Une annulation référence la ligne, jamais le reçu entier. `coeur-sfd` n'apparie jamais un mouvement à plusieurs lignes ; il ouvre un écart. »

### K3. Qui fait passer un fait de EN_ATTENTE_COEUR à confirmé ?
- **Unités** : épic `collecte` (ou `credit` pour un ordre) et épic `coeur-sfd`.
- **Obéissance** : AD-1 : le fait reste EN_ATTENTE_COEUR jusqu'au mouvement du cœur ; AD-8 : `coeur-sfd` apparie. AD-2 : `collecte` est seul écrivain de ses collectes ; `coeur-sfd` n'écrit pas dans `collecte_*`.
- **Divergence** : `coeur-sfd` apparie, mais il n'a aucun moyen d'écrire le statut de la collecte. `collecte` s'abonne à `coeur-sfd.mouvement.recu@1` et refait l'appariement par le numéro de reçu (cas 1), ou attend un fait « apparié » qui n'existe pas dans AD-9 (cas 2). Si l'appariement échoue chez `coeur-sfd` (écart ouvert), `collecte` a peut-être confirmé de son côté : deux vérités.
- **AD à ajouter** : « L'appariement est fait **une fois**, par `coeur-sfd`, qui publie `coeur-sfd.apparie@1` `{cleOrigine, numeroLigne, mouvementCoeurId, resultat: CONFIRME | ECART}` (à ajouter à AD-9). Le module propriétaire du fait saisi (`collecte`, `credit`, `paiement`) change son statut **uniquement** sur ce fait ; il ne lit jamais `mouvement.recu` pour apparier. Un fait EN_ATTENTE_COEUR plus vieux que son délai (annexe D) passe en écart par `coeur-sfd`, jamais par le module propriétaire. »

### K4. Le reste dû d'une Créance a deux chemins de mutation
- **Unités** : épic `paiement` (amendement `ECHEANCE_DE_PRET`) et épic `coeur-sfd` (échéancier officiel, mouvements) ; `recouvrement` lit le résultat.
- **Obéissance** : AD-6 : `paiement` est seul propriétaire de la Créance ; il applique les composantes et réductions du cœur ; `coeur-sfd` n'écrit pas la Créance ; l'encaissement électronique est dans le ledger de `paiement`.
- **Divergence** : `paiement` peut réduire le reste dû (a) à l'encaissement électronique, immédiatement, (b) à la lecture de `coeur-sfd.echeancier.changed@1` (valeur de contrôle), (c) à un `mouvement.recu` « sans paiement Prospera correspondant ». Un paiement Mobile Money encaissé à 10:00 puis déclaré au cœur, qui le comptabilise à 11:00 : `paiement` réduit à 10:00, relit à 10:30 un reste dû non encore réduit et **remonte** la Créance (le client revoit un lien pour une dette payée), ou réduit deux fois à 11:00. La formule du montant exigible n'est écrite nulle part ; `recouvrement` lit « le reste dû » et calcule des jours de retard sur l'un ou l'autre.
- **AD à ajouter (nouvelle AD-6bis)** : « Le montant exigible d'une Créance `ECHEANCE_DE_PRET` = `resteDuCoeur(lueLe)` − Σ des encaissements de `paiement` **postérieurs à `lueLe`** et pas encore vus par le cœur (identifiés par leur clé d'origine, AD-8). Une relecture du cœur remplace `resteDuCoeur` et recalcule la somme : elle ne s'ajoute jamais. Seul `paiement` calcule cette formule ; `recouvrement`, `credit` et `risque-par` lisent `montantExigible` et `lueLe` dans `paiement.creance.changed@1`, sans jamais recalculer. Un mouvement du cœur sans encaissement Prospera ferme ou réduit la Créance et ouvre une ligne d'information, jamais un doublon. »

### K5. L'identité d'une échéance : échéancier contractuel, officiel, plan d'étalement
- **Unités** : épic `credit` (échéancier contractuel, par dossier) et épic `paiement` (Créances) ; `coeur-sfd` et `recouvrement` (par prêt) au milieu.
- **Obéissance** : AD-6 : `paiement` ouvre les Créances sur `credit.dossier.accorde@1` (clé : `dossierId` + numéro) et les rend exigibles sur `ordre-decaissement.confirme@1`. `coeur-sfd` publie l'échéancier officiel clé `pretId` + numéro (annexe C). `recouvrement` est « par prêt ».
- **Divergence** : aucun fait ne relie `dossierId` à `pretId` hors du message de confirmation, et rien ne dit ce qui se passe quand l'échéancier officiel a un nombre de lignes différent (différé, ajustement de dernière échéance, **plan d'étalement** qui remplace tout l'échéancier). `paiement` garde ses Créances `dossierId:n` ; `recouvrement` ouvre ses dossiers `pretId` et lit des Créances qu'il ne trouve pas ; les lignes en trop ou manquantes sont ni fermées ni créées.
- **AD à ajouter** : « Une échéance a une identité unique `(organisationId, pretIdCoeur, numeroEcheance, versionEcheancier)`. `coeur-sfd.ordre-decaissement.confirme@1` porte `dossierId` **et** `pretIdCoeur` et est le seul fait qui les lie (consommé par `paiement`, `recouvrement`, `risque-par`, `credit`). Tant qu'il n'est pas reçu, les Créances `dossierId:n` sont dites « à venir » et inexigibles. À chaque nouvel échéancier officiel (`versionEcheancier` + 1, y compris plan d'étalement), `paiement` **ferme** les Créances de l'ancienne version non soldées (soldées en reportant les encaissements) et ouvre celles de la nouvelle, dans une seule commande idempotente. Le prêt est la clé de `recouvrement` ; `dossierId` n'y apparaît plus après confirmation. »

### K6. Le PAR à l'arrêté : trois sources de « jours de retard », aucun cadre temporel
- **Unités** : épic `risque-par` (classes, PAR) et épic `conformite-bceao` (rapports figés), avec `recouvrement` (statut EN_RETARD).
- **Obéissance** : AD-21 : les indicateurs viennent des faits de `risque-par` « à l'arrêté » ; les ratios, de la balance du cœur. AD-1 : le cœur fait foi (annexe C : jours de retard, classe officielle, provision comptabilisée, tous « cœur fait foi »). AD-12 : versions figées.
- **Divergence** : (1) `risque-par` calcule les jours de retard depuis l'échéancier officiel et la date du jour, `recouvrement` depuis les Créances de `paiement`, le cœur envoie les siens. (2) `risque-par` publie des faits d'**état courant** (`par.calcule@1`) ; `conformite-bceao` doit retrouver l'état à l'arrêté 31 décembre et reconstitue d'un flux : le fait de 00:05 le 1er janvier est lu avant la synchronisation de nuit du cœur (fréquence « nuit »), donc **sans** les paiements du 31. (3) Un fait EN_ATTENTE_COEUR est compté « payé » par `risque-par` et « impayé » par `conformite-bceao`. (4) La classe du rapport est celle de `risque-par` ou la classe officielle du cœur ?
- **AD à ajouter (précise AD-21)** : « Les jours de retard et le PAR sont calculés **par `risque-par` seul**, sur les mouvements et échéanciers **du cœur** (`coeur-sfd.*`) : un fait EN_ATTENTE_COEUR n'entre jamais dans le PAR (il est affiché à part). Un **arrêté** est un objet `risque-par_arrete {date, filigraneLueLe, version, empreinte}` : il n'est calculé que lorsque `coeur-sfd.fraicheur` atteste que **toutes** les familles d'objets d'argent ont un `lueLe ≥ date + 1 jour` ; sinon il reste « en attente des données du cœur ». `conformite-bceao` ne consomme que des arrêtés figés, par `risque-par.arrete.fige@1` (à ajouter à AD-9), jamais le flux `par.calcule`. La classe réglementaire du rapport est la classe officielle du cœur quand elle existe ; la classe proposée par `risque-par` n'y figure qu'à titre de comparaison. `recouvrement` et `paiement` lisent les jours de retard de `risque-par` ou du cœur, ne les calculent pas. »

### K7. Des faits de soupçon publiés sur le bus, contre AD-22
- **Unités** : épic `microfinance` (LBC/FT) et épics consommateurs (`credit`, `notification`, `dashboard`, `reseau`).
- **Obéissance** : `microfinance` publie exactement les noms d'AD-9 : `microfinance.sanctions.correspondance@1`, `microfinance.alerte-centif.creee@1`, `microfinance.kyc.changed@1`. `credit` consomme `kyc.changed` pour le blocage LBC/FT du décaissement ; `notification` s'abonne à toute alerte.
- **Divergence** : AD-22 dit « aucune route ni aucun fait ne les expose à un autre rôle (pas même un compteur) ». La spine publie pourtant ces faits dans Kafka, lus par n'importe quel consommateur du topic. Le statut KYC bloqué révèle le soupçon dans le dossier de crédit que voit l'agent (risque d'avertissement du client, « tipping off »). Les épics n'ont aucune règle pour trancher.
- **AD à ajouter (corrige AD-9 et AD-22)** : « Les faits `sanctions.correspondance` et `alerte-centif.creee` sont **retirés** de AD-9. `microfinance` ne publie pour le crédit qu'un état neutre `microfinance.kyc.changed@1 {statut ∈ COMPLET | INCOMPLET | EXPIRE | EN_VERIFICATION, valideJusquau}`, où EN_VERIFICATION est utilisé pour **tout** blocage, soupçon compris ; aucun consommateur ne sait distinguer. Le refus de décaissement porte le motif générique `KYC_NON_VALIDE`. Les notifications de conformité sont émises par `microfinance` seul, vers les habilitations de conformité, DG, AUD, sans passer par le bus partagé. »

### K8. Le chemin du décaissement électronique n'a aucun fait dans AD-9
- **Unités** : épic `credit` (sous-état EXECUTE, INCONNU) et épic `paiement` (amendement) ; `coeur-sfd` (déclaration).
- **Obéissance** : AD-5 : Mobile Money et PI-SPI → `paiement` exécute, puis `coeur-sfd` le déclare. AD-9 : « un nom absent ne se publie ni ne se consomme » ; la liste n'a aucun fait de `paiement` pour un décaissement. `credit` écrit seul le sous-état ; `paiement` seul ses ordres électroniques.
- **Divergence** : `credit` publie `credit.ordre-decaissement.emis@1` ; `paiement` doit le consommer pour créer un ordre électronique, mais l'AD ne dit pas que `paiement` consomme ce fait ; rien ne remonte vers `credit` ni `coeur-sfd` (`paiement.encaissement.changed@1` concerne les entrées). Variante : `paiement` ajoute un fait `paiement.ordre.changed@1` hors catalogue et `credit` l'ignore, ou `credit` interroge la base de `paiement` (interdit) ; INCONNU n'est jamais levé. De plus, la clé `<code>:<objet>:<id>` d'AD-conventions est envoyée comme `txId` : l'épic `paiement` la reformate pour le fournisseur (format restreint, le participant PI-SPI rejette déjà un `txId` inattendu) et la clé « jamais régénérée » devient deux clés.
- **AD à ajouter (complète AD-5 et AD-9)** : « `paiement` consomme `credit.ordre-decaissement.emis@1` (canal Mobile Money ou PI-SPI) et publie `paiement.ordre-decaissement.changed@1 {ordreId, etat ∈ EN_COURS | EXECUTE | REJETE | INCONNU, referenceFournisseur}` ; `credit` fait évoluer le sous-état **seulement** sur ce fait (canal électronique) ou sur `coeur-sfd.ordre-decaissement.*` (canal cœur) ; `coeur-sfd` déclare au cœur sur `paiement.ordre-decaissement.changed@1` à l'état EXECUTE. Le `txId` fournisseur est **dérivé de façon déterministe et réversible** de `ordreId` (`txId = base32(ordreId)`, 26 car. alphanumériques) : la table de correspondance est celle de `paiement` ; aucune clé n'est générée côté fournisseur. »

---

## ÉLEVÉ

### E1. La visite d'instruction a deux propriétaires
- **Unités** : épic `credit` (« visites d'instruction » : AD-2) et épic terrain / module partagé `terrain` (`terrain.visite.changed@1`, application hors ligne qui parle à `prospera-imf-service` dans le schéma).
- **Obéissance** : l'application enregistre une visite avec un identifiant d'appareil (AD-19) vers un point d'entrée du service ; `credit` reste seul écrivain de ses visites d'instruction (AD-2) ; `terrain` reste seul écrivain de ses visites.
- **Divergence** : deux collections `visites`, deux formats (rayon de tolérance de 100 m, preuve photo, durée), deux checklists. La règle « visite validée » du décaissement lit l'une ou l'autre. L'application synchronise une visite par POST dans `credit` (le schéma montre `TER → IMF`) qui la copie dans `terrain` ou l'inverse.
- **AD à ajouter** : « Une visite est un objet de `terrain` ; `credit` ne possède que le **lien** `(dossierId, visiteId, role = INSTRUCTION)` et une règle « visite valide » calculée sur `terrain.visite.changed@1 {valide, lat, lon, distanceAdresse}`. `prospera-terrain` synchronise **vers un seul** point d'entrée de lot (`POST /sync` du module `terrain`) qui range chaque objet chez son propriétaire par fait, jamais par écriture croisée. »

### E2. Le « remboursement saisi » et le « mouvement d'épargne renvoyé » n'ont aucun propriétaire
- **Unités** : épic `collecte` (collectes) et épic `coeur-sfd` (objet Remboursement saisi, Annulation de collecte, liste « à saisir »).
- **Obéissance** : AD-2 donne `collectes, reçus, remises, annulations, listes « à saisir »` à `collecte`, et `coeur-sfd` lit « remboursements saisis », mais le tableau ne dit pas qui les écrit. Un remboursement saisi au guichet (hors collecte) n'est dans aucune ligne.
- **Divergence** : `collecte` crée `collecte_remboursements` pour tous les encaissements, guichet inclus ; `credit` crée `credit_remboursements` pour les saisies au guichet ; `coeur-sfd` fusionne les deux dans le contrat d'échange.
- **AD à ajouter (complète AD-2)** : « Tout encaissement d'espèces saisi dans Prospera (collecte terrain **ou** guichet) est une ligne de `collecte` (`collecte_lignes`), seul propriétaire ; `credit`, `caisse` et `coeur-sfd` la lisent par `collecte.collecte.changed@1`. Un remboursement électronique est un encaissement de `paiement`. Les listes « à saisir dans le cœur » sont une vue de `collecte` ; `coeur-sfd` n'en tient aucune. »

### E3. Fonds de caisse du collecteur : une vérité Prospera contre un compte d'attente du cœur
- **Unités** : épic `caisse` (« fonds de caisse des collecteurs, clôtures, écarts ») et épic `collecte` (remises, écarts).
- **Obéissance** : AD-1 : aucun module ne tient de solde comme vérité, mais `caisse` tient des « fonds de caisse » ; annexe C : le cœur tient un **compte d'attente du collecteur** (aucun objet d'échange ne le porte : pas dans les 29 objets). `collecte` détecte un écart à la remise, `caisse` à la clôture : deux faits `ecart.detecte`.
- **Divergence** : `caisse` compte `fonds = Σ collectes − Σ remises contresignées` ; `collecte` annule une collecte après une remise (RA) : le fonds est-il corrigé par `caisse` (qui lit l'annulation) ou jamais (une remise est faite) ? Le même écart de 5 000 FCFA est ouvert deux fois (`collecte.ecart.detecte`, `caisse.ecart.detecte`) avec deux numéros de dossier.
- **AD à ajouter** : « Le fonds d'un collecteur est une **projection de `caisse` calculée uniquement** à partir de `collecte` (collectes, annulations, remises contresignées) et marquée `calculeLe`; elle ne se présente jamais comme le compte d'attente du cœur, qui est un objet de l'annexe C à ajouter (`Compte d'attente du collecteur`, cœur → Prospera, mouvements). Un **écart de remise** appartient à `collecte` (comptage ≠ déclaré, au contresigné) ; un **écart de clôture** appartient à `caisse` (fonds ≠ compte d'attente du cœur). Les deux faits portent un champ `nature` distinct et ne se fusionnent jamais. »

### E4. L'identité du client : `microfinance` et `coeur-sfd` publient tous deux `client.changed`
- **Unités** : épic `microfinance` (fiches, KYC) et épic `coeur-sfd` (projection du client du cœur).
- **Obéissance** : AD-2 : `microfinance` écrit prospects, clients, fiches ; `coeur-sfd` n'écrit que son journal ; AD-1 : le cœur fait foi pour l'identité (annexe C). Les deux publient `*.client.changed@1`.
- **Divergence** : après la reprise, le nom du client diffère (cœur : « KOFFI Ama » ; fiche : « Ama Koffi »). `credit` affiche le nom de l'un ou de l'autre, et la correspondance de sanctions filtre sur l'un ou l'autre. Personne n'écrit `cleOrigineCoeur` dans la fiche : `microfinance` n'est pas dit consommer `coeur-sfd.client.changed@1`.
- **AD à ajouter** : « Champ par champ : **identité** (nom, date de naissance, pièce, statut) = cœur, projeté par `coeur-sfd` ; **KYC, fiche enrichie, consentements, rattachements** = `microfinance`. `microfinance` consomme `coeur-sfd.client.changed@1`, écrit `cleOrigineCoeur` sur la fiche (seul écrivain de ce champ) et marque les écarts d'identité `A_RAPPROCHER` ; elle ne les corrige jamais seule. Tout consommateur lit l'identité de `microfinance.client.changed@1` (qui porte la valeur du cœur et sa `lueLe`), jamais directement du fait `coeur-sfd.client.changed@1`. »

### E5. Protocole de tirage : curseur, snapshot ou delta, suppressions
- **Unités** : épic `coeur-sfd` (client `TransportCoeur`) et épic `prospera-coeur-fictif`.
- **Obéissance** : AD-7 : deux transports, même objet, message avec `messageId`, clé d'origine, version, empreinte ; Prospera tire. Annexe C : fréquences (5 min, heure, nuit) mais rien sur la façon de tirer.
- **Divergence** : le fictif expose `GET /prets?modifieDepuis=` (delta) et dépose des fichiers « nuit » complets (snapshot) ; `coeur-sfd` suppose des deltas et ne voit pas une suppression (prêt disparu du snapshot, mouvement annulé sans mouvement inverse). Aucune des deux ne viole l'AD, aucun test ne fait échouer la différence.
- **AD à ajouter (précise AD-7)** : « Chaque objet a un **mode de tirage déclaré** dans son schéma : `DELTA` (curseur monotone `curseur` rendu par le cœur, conservé par `coeur-sfd` par organisation et par objet, rejouable) ou `SNAPSHOT` (fichier complet avec `genereLe` et `nbLignes` ; l'absence d'une clé vaut suppression **seulement** pour les objets déclarés `SUPPRESSION_PAR_ABSENCE`). Un fichier sans `genereLe`, `nbLignes` et empreinte est refusé et va en écart. Le fictif et les tests de contrat exercent les deux modes pour chaque objet. »

### E6. Ordre des envois vers le cœur : client, dossier, ordre, remboursement, annulation
- **Unités** : épic `credit` (publie dossier accordé, ordre, annulation) et épic `coeur-sfd` (file d'envoi acquittée).
- **Obéissance** : AD-7 : file d'envoi acquittée (spine Connecteurs AD-8) ; un envoi non acquitté en délai passe en écart. AD-5 : un ordre n'a qu'un canal.
- **Divergence** : un dossier accordé suppose un client déjà créé (identifiant cœur renvoyé) ; une annulation peut dépasser l'ordre en file. `coeur-sfd` envoie en parallèle par type (client, dossier, ordre) ; le cœur refuse l'ordre d'un dossier inconnu. Les deux suivent AD-7.
- **AD à ajouter** : « La file d'envoi est **ordonnée par entité racine** (`clientId`, puis `dossierId`/`pretId`) : un message n'est envoyé qu'après l'**acceptation** du message précédent de la chaîne (client → dossier accordé → ordre → annulation → remboursement). Une annulation qui rattrape un message encore en file **le remplace** (le message annulé est marqué ANNULE_AVANT_ENVOI, jamais envoyé). Le délai d'acquittement d'une chaîne se compte depuis l'envoi, pas depuis la mise en file. »

### E7. `messageId` : unique à l'envoi, dérivé de quoi ?
- **Unités** : épic `coeur-sfd` (envoi) et épic `prospera-coeur-fictif` (réception), puis le futur connecteur réel.
- **Obéissance** : AD-7 : « Rejouer un `messageId` est sans effet » ; AD-27 : `eventId` pour Kafka ; AD-8 : clé d'origine pour l'appariement.
- **Divergence** : `coeur-sfd` génère un UUID par **tentative** d'envoi (le journal garde les tentatives) ; le cœur fictif déduplique sur `messageId` ; un renvoi après timeout (cœur ayant reçu mais pas acquitté) crée un doublon. Un vrai cœur déduplique sur la clé d'origine. Résultat : la démo double un paiement qu'un vrai cœur n'aurait pas doublé, ou l'inverse.
- **AD à ajouter** : « `messageId = SHA-256(organisationId | objet | cleOrigine | versionObjet)` : **déterministe**, identique à chaque tentative. Le cœur (fictif ou réel) déduplique sur `cleOrigine + versionObjet` ; `messageId` n'est qu'un témoin. Une nouvelle version d'un objet (correction) a `versionObjet` + 1 et un nouveau `messageId`. »

### E8. Score et barème : une règle dans l'IA commune, des paramètres dans `credit`
- **Unités** : épic « IA commune v0 » (stratégies typées 40/30/20/10, classe 75/55/35/15, seuil 45) et épic `credit` (`credit_parametres`, annexe D.2, figés au dossier par AD-12).
- **Obéissance** : AD-14 : aucune règle de score dans les modules ; les règles v0 vivent dans l'IA commune. AD-12 : les paramètres du module sont versionnés et figés au dossier. Annexe D : le barème de départ est un **paramètre de l'IMF**, modifiable par le DG.
- **Divergence** : le DG change le barème dans l'écran de `credit` ; l'IA commune ne le connaît pas (ses stratégies codent les défauts) ou l'IA le lit dans `credit_parametres` (couplage de base interdit par AD-2). Le dossier fige `parametresVersion` de `credit` mais pas la version de la **stratégie** de l'IA. La part d'alignement avec la suggestion (95 % sur 50 décisions) est calculée par `credit` (il a les décisions) ou par l'IA (elle a les propositions).
- **AD à ajouter** : « Les paramètres d'un score sont des **entrées de la demande** de Proposition (`parametres: {version, valeurs}` lus par `credit` dans `credit_parametres` et transmis) ; la stratégie ne code aucune valeur modifiable. La Proposition rend `strategieVersion` et `parametresVersion` ; `credit` fige les deux au dossier (AD-12 étendue). `credit` stocke l'identifiant de la **Proposition présentée au comité** (celle affichée après le premier avis, FR-49) ; un recalcul ultérieur crée une nouvelle Proposition sans remplacer celle présentée. L'alignement avec la suggestion est calculé par `credit` seul, sur ces identifiants. »

### E9. Collecte hors ligne synchronisée après la clôture de caisse
- **Unités** : épic `collecte` / application `prospera-terrain` (AD-19) et épic `caisse` (clôtures).
- **Obéissance** : AD-19 : l'appareil propose, le serveur juge ; plage de reçus attribuée ; synchro rejouable. `caisse` clôture à une date et compte ce qu'il connaît.
- **Divergence** : une collecte faite le 12 à 17 h, synchronisée le 13 à 09 h. `collecte` la date du 12 (date de valeur), `caisse` a déjà clôturé le 12 avec un écart ; la remise du 12 ne porte pas ce reçu. L'écart est « résolu » en rouvrant la clôture (nouvelle version ?) ou en comptant le 13 : les deux épics choisissent différemment ; en plus la date d'effet pour le cœur diffère de celle de la saisie.
- **AD à ajouter (complète AD-19)** : « Chaque collecte porte `dateValeur` (jour de la collecte, du terrain, fuseau de l'agence) et `dateSynchro` (serveur). `caisse` clôture un jour **J** avec un `filigraneSynchro` ; une collecte synchronisée après la clôture de sa `dateValeur` ne rouvre jamais la clôture : elle crée un **rattrapage** daté de J+n, rattaché à J, présenté comme tel. Un appareil non synchronisé plus de `delaiSynchroMax` (annexe D) lève `collecte.ecart.detecte@1 {nature: NON_SYNCHRONISE}` et bloque la clôture du collecteur. »

### E10. Lien de paiement et fraîcheur : un âge de 15 minutes pour un cœur qui se tire « la nuit »
- **Unités** : épic `paiement` (émission du lien) et épic `coeur-sfd` (tirage).
- **Obéissance** : AD-6 : lien émis seulement après une relecture plus récente que l'âge maximal (15 min). Annexe C : fréquences 5 min (API) ou « heure », « nuit » (fichiers) ; `coeur-sfd` tire à la fréquence déclarée.
- **Divergence** : `paiement` attend `coeur-sfd.echeancier.changed@1` plus récent que 15 min : avec un cœur à fichiers « nuit », **aucun lien n'est jamais émis** ; ou `paiement` demande une relecture et il n'existe ni fait ni route pour la provoquer.
- **AD à ajouter** : « Chaque objet a un **âge maximal par type de transport** ; si la fréquence déclarée du transport est supérieure à l'âge maximal d'un usage, l'usage est **dégradé par défaut** (lien de paiement désactivé, message « paiement en ligne indisponible pour ce prêt » ; jamais un lien émis sur donnée ancienne). `paiement` demande une relecture ciblée par le fait `paiement.relecture.demandee@1 {pretId}` ; `coeur-sfd` y répond par `echeancier.changed@1` ou `fraicheur.changed@1 {indisponible}` en moins de 30 s (API) ; sans API, la demande n'a aucun effet immédiat et le lien est dégradé. »

### E11. Reçus hors ligne : qui attribue les plages ?
- **Unités** : épic `collecte` (reçus numérotés) et application `prospera-terrain`.
- **Obéissance** : AD-19 : plage attribuée par le serveur à l'appareil ; un trou de plage est déclaré. `collecte` possède les reçus (AD-2). Le module `terrain` a ses appareils.
- **Divergence** : la plage est attribuée par appareil (`terrain`) ou par collecteur (`collecte`) ; un collecteur avec deux appareils ou un appareil remplacé laisse des trous différents ; format du numéro (`agence-collecteur-n`, séquence nationale…) non fixé, alors que la clé d'origine Prospera `<code>:<objet>:<id>` et le « numéro de reçu » de l'annexe C sont recopiés tels quels par le cœur.
- **AD à ajouter** : « Les plages de reçus sont attribuées par `collecte` seul, **par collecteur** (jamais par appareil), au format `RC-<agence>-<collecteur>-<n>` (entier à 8 chiffres, sans réutilisation). Un appareil remplacé reprend la plage non consommée du collecteur ; une plage perdue est déclarée `collecte.ecart.detecte@1 {nature: TROU_DE_PLAGE}`. »

---

## MOYEN

### M1. Le KYC « COMPLET et non expiré » calculé deux fois
- **Unités** : épic `credit` (DOSSIER_COMPLET automatique, ordre refusé) et épic `microfinance` (KYC, revues échues).
- **Obéissance** : `credit` lit `microfinance.kyc.changed@1` ; `microfinance` publie `revue.echue@1`.
- **Divergence** : `credit` calcule COMPLET à partir des champs du fait et de sa propre horloge pour l'expiration ; `microfinance` calcule autrement (type de pièce, renforcé / simplifié). Au jour de l'ordre, un KYC expiré à minuit est vu COMPLET par `credit` (fait non encore émis).
- **AD à ajouter** : « `microfinance` calcule seule le statut KYC et sa validité (`valideJusquau`). `credit` ne recalcule jamais ; à la transition vers DOSSIER_COMPLET et à ORDONNE il **relit par la route de `microfinance`** (`GET /kyc/{clientId}`) la valeur du moment, jamais le dernier fait reçu, et enregistre `(statut, version, luLe)` dans l'audit. »

### M2. Portefeuille d'un GP : deux écrivains, deux définitions
- **Unités** : épic `credit` (GP désigné au comité) et épic `microfinance` (clients rattachés), `reseau` reprend.
- **Obéissance** : AD-16 : la portée « portefeuille » est écrite par `credit` et `microfinance`, reprise par `reseau`.
- **Divergence** : GP du client (microfinance) ≠ GP du prêt (credit) ; le portefeuille est l'union ou l'un des deux ; un prêt désigné à un GP d'une autre agence est visible ou non.
- **AD à ajouter** : « Le rattachement est à **deux niveaux** : `microfinance` possède `gpClient` ; `credit` possède `gpPret` (avec `gpClient` pour défaut). `reseau.portee.changed@1` publie les deux, et la portée « portefeuille » d'un acteur = `gpClient = lui ∪ gpPret = lui`, filtrée par l'agence. Un conflit d'agence ouvre une alerte au RA, sans élargir la portée. »

### M3. La bibliothèque `finance` : version épinglée, mais pas figée au dossier
- **Unités** : épic `credit` (échéancier, TEG) et épic `prospera-coeur-fictif` (échéancier officiel du fictif), `produits-financiers`.
- **Obéissance** : AD-11 : même version épinglée ; AD-12 : produits et paramètres versionnés.
- **Divergence** : `credit` pin `finance@1.2`, le fictif `finance@1.3` (dépôts distincts, trains de livraison distincts) ; un arrondi change ; l'alerte « écart contractuel / officiel » de FR-61 (tolérance 5 FCFA) se déclenche sur 1 000 prêts. Aucune AD n'exige de figer la version de la bibliothèque dans le dossier.
- **AD à ajouter** : « Le dossier fige `financeVersion` avec `parametresVersion` ; un plan d'étalement ou un refinancement recalcule avec cette même version. Le fictif et les modules ne livrent que sur une **même version majeure.mineure** de `finance` (contrôle au build). L'alerte d'écart d'échéancier ignore les différences ≤ tolérance d'arrondi cumulée (n × 1 FCFA). »

### M4. Une horloge, une date de valeur, un fuseau pour tout l'essai
- **Unités** : épic `prospera-coeur-fictif` (pénalités, retards, « cœur coupé 3 jours ») et épics `risque-par` / `recouvrement`.
- **Obéissance** : AD-10 : graine fixe ; AD-23 : essai intercepté. Conventions « temps » du moteur.
- **Divergence** : le fictif avance une date simulée pour fabriquer des retards (PAR visé 5 à 15 %) ; `risque-par` calcule sur l'horloge système : le PAR affiché diffère de la cible de démo et de la balance du fictif.
- **AD à ajouter** : « Tout module lit le temps par un **port `Horloge`** (fuseau `Africa/Lome` ou celui de l'IMF) ; dans l'espace d'essai, l'horloge est **pilotée** par l'agent et partagée avec le fictif (`dateDuJour` publiée sur `essai.horloge.changed@1`). Aucun calcul de retard, d'arrêté ou d'âge n'utilise l'horloge système en essai. »

### M5. Les ordres d'exécution d'un plan d'étalement et d'une perte : deux circuits
- **Unités** : épic `recouvrement` IMF (décision du ROC / DG) et épic `coeur-sfd` (envoi) ; `credit` (clôture après radiation).
- **Obéissance** : AD-20 : le plan et la perte passent au cœur par `coeur-sfd` ; AD-2 : `recouvrement` écrit ses dossiers.
- **Divergence** : AD-9 ne liste aucun fait de décision de `recouvrement` consommé par `coeur-sfd` (il ne publie que `recouvrement.dossier.changed@1`, un état). `coeur-sfd` déduit l'envoi d'un changement de statut (PLAN_ETALEMENT) ; l'épic recouvrement émet un fait spécifique hors catalogue.
- **AD à ajouter** : « `recouvrement` publie des faits de **décision** distincts : `recouvrement.plan-etalement.decide@1`, `recouvrement.contentieux.decide@1`, `recouvrement.perte.decidee@1` (avec décideur et nouvel échéancier contractuel) ; `coeur-sfd` ne consomme que ceux-là, jamais `dossier.changed`. Le nouvel échéancier contractuel est une donnée de la décision, jamais recalculée par `coeur-sfd`. »

### M6. Un seul « arrêté » du cœur : classes officielles et provisions proposées
- **Unités** : épic `risque-par` (provisions proposées, validées) et épic `conformite-bceao` (rapports).
- **Obéissance** : AD-1 : provision comptabilisée = cœur ; `risque-par` « propose ». AD-21 : classes du référentiel du pays.
- **Divergence** : le rapport affiche la provision proposée validée par le DG, le cœur a comptabilisé autre chose ; la différence n'a ni nom ni seuil d'alerte.
- **AD à ajouter** : « Tout rapport présente côte à côte `provisionComptabilisee` (cœur, `lueLe`) et `provisionProposee` ; l'écart `|proposée − comptabilisée| > seuil` (annexe D) ouvre `conformite-bceao.anomalie.detectee@1`. Aucun chiffre du rapport ne résulte d'une substitution de l'un par l'autre. »

---

## Synthèse des AD à ouvrir

| N° proposé | Objet | Pairs |
|---|---|---|
| AD-5 (révisée) | `ordreId`, essais, `txId` dérivé, faits `paiement.ordre-decaissement.changed@1` | K1, K8 |
| AD-8 (révisée) | clé `(reçu, ligne)`, fait `coeur-sfd.apparie@1` | K2, K3 |
| AD-6bis | formule du montant exigible, identité d'une échéance, versions d'échéancier | K4, K5, E10 |
| AD-21 (révisée) | arrêté figé avec filigrane `lueLe`, source unique des jours de retard | K6, M6 |
| AD-9 / AD-22 (corrigées) | retrait des faits de soupçon, KYC neutre | K7, M1 |
| AD-2 (complétée) | visite, encaissement d'espèces, fonds / écarts, identité champ par champ, portefeuille | E1, E2, E3, E4, M2 |
| AD-7 (précisée) | mode de tirage, ordre de la file, `messageId` déterministe | E5, E6, E7 |
| AD-14 / AD-12 (complétées) | paramètres de score en entrée, Proposition présentée, versions figées | E8, M3 |
| AD-19 (complétée) | dates de valeur / synchro, plages par collecteur | E9, E11 |
| AD-26 (nouvelle) | horloge pilotée en essai | M4 |
| AD-9 (complétée) | faits de décision du recouvrement | M5 |
