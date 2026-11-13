# Relecture adversariale — PRD Prospera Distributeur (brouillon du 2026-11-12)

Relecteur : cynique, sans complaisance. Document lu en entier (3 934 lignes) avec le `.memlog.md`. Les numéros de ligne sont ceux de `prd.md` à la date de la relecture. Aucune décision du PO n'est contestée pour elle-même : quand une décision est citée, c'est pour montrer ce qu'elle casse ailleurs.

**Verdict : ne pas valider en l'état.** Le document est riche et honnête sur ses incertitudes, mais il se contredit sur les trois sujets où l'argent circule (plafond de crédit, encaissement, freelance), il fait porter la Créance à trois modules à la fois, et ses deux parcours « ex aequo » du 15/01 ne peuvent pas passer avec les canaux et l'application que le PRD déclare disponibles. Trois décisions du PO du 12/11 (facture à la livraison, créance portée par `paiement`, freelance qui facture) ont des conséquences cachées que le brouillon n'a pas dépliées.

Décompte : **9 critiques, 17 élevées, 16 moyennes, 9 basses (51 findings).**

---

# CRITIQUE

## K1. Le plafond de crédit se contourne : l'encours ignore les commandes validées non facturées
- **Où** : FR-33 (l.430), FR-52 (l.723), FR-187 (l.3161), UJ-1 (l.91), décision PO n° 9 (facture à la livraison).
- **Problème** : `encours = Σ reste dû des factures` (FR-52) et le contrôle est `encours + TTC de la commande > plafond` (FR-33). Or la facture naît à la livraison, 2 à 3 jours après la validation. Entre les deux, la commande validée n'est dans aucun encours.
- **Scénario** : plafond 1 M, encours 0. Le bureau valide dix commandes de 900 000 le lundi : chacune passe (0 + 900 000 < 1 M). Mercredi, 9 M de marchandises sortent, la facture 1 crée 900 000 d'encours, la facture 2 fait « plafond dépassé » mais la marchandise est déjà partie. Le garde-fou « qui bloque » (FR-13) ne bloque rien. C'est exactement le risque que le grossiste veut couvrir en quittant Sage.
- **Correction (à insérer en FR-52 et FR-33)** :
  > `exposition = encours (Σ reste dû des Créances ouvertes) + engagements (Σ TTC des commandes VALIDEE, PREPARATION et LIVREE non encore facturées, quantités restant à servir comprises)`. Le contrôle de plafond de FR-33 se fait sur `exposition + TTC de la commande validée`, en excluant la commande elle-même lors d'une modification (FR-35). La fiche client et FR-187 affichent `plafond − exposition = disponible à crédit`. Test : deux validations simultanées de 600 000 sur un plafond de 1 M : une réussit, l'autre reçoit `PLAFOND_CREDIT_DEPASSE`.

## K2. Aucun objet pour l'argent qui n'a pas (encore) de facture : acompte, avance, trop-perçu, avoir sur facture payée
- **Où** : UJ-2 (l.94), FR-104 (l.1792-1795), FR-111 (l.1950), FR-49 (l.688), FR-48 (l.675), FR-79 (l.1257), FR-205/208.
- **Problème** : UJ-2 fait encaisser 35 000 F en espèces à la visite, avant que la commande soit validée, donc avant toute facture. FR-104 exige que l'encaissement soit « rattaché à une Créance » ; FR-111 dit que la Créance naît d'une Source (la facture) ; la facture naît à la livraison. L'argent n'a nulle part où atterrir. Même trou pour : l'acompte de 50 % de FR-79, l'avoir sur une facture déjà payée (FR-48 : « le crédit reste au solde du client », objet inexistant), le paiement Mobile Money en double (FR-49 « refusé » : on ne refuse pas un paiement déjà reçu par FedaPay ou PI-SPI).
- **Scénario** : Kodjo encaisse 35 000 en espèces le lundi. Le serveur rejette l'encaissement (aucune Créance) ou l'accepte « non affecté ». Le bordereau de remise du soir ne rapproche rien, `ECART_DE_CAISSE` critique, le superviseur appelle Kodjo. Mme Adjo paie deux fois le lien FedaPay : le second paiement est `PAIEMENT_SUPERIEUR_AU_RESTE_DU`, l'argent est chez le fournisseur de paiement, aucune écriture ne le porte.
- **Correction (à insérer en partie 3, après FR-111)** :
  > **FR-111b : Solde créditeur du Tiers.** Un Encaissement qui ne peut pas être imputé à une Créance ouverte (avance avant facture, acompte, excédent, avoir sur facture soldée) est accepté et crée un **solde créditeur** du Tiers, porté par `paiement`. Il n'est jamais refusé quand l'argent est déjà reçu. Il s'impute automatiquement, par ancienneté d'échéance, à la prochaine Créance du Tiers, ou se rembourse par un ordre de `paiement` (DAF). Le montant net du Tiers = Σ Créances − solde créditeur. Remplace `PAIEMENT_SUPERIEUR_AU_RESTE_DU` sauf pour la saisie manuelle d'un paiement non encore reçu. Test : encaisser 35 000 avant facture, facturer 507 400 : reste dû 472 400 au moment de l'émission.

## K3. Freelance : le modèle économique se contredit et ouvre une fuite de commission
- **Où** : §5.7 (l.1533), FR-96 (l.1592-1593), FR-98 (l.1617), FR-126 (l.2228), FR-128 (l.2248), notes l.1662-1664, KPI FREELANCE (l.2143).
- **Problème** :
  1. Le freelance **achète** à la société au prix société (FR-96 : « la société facture le freelance », « il doit le prix société même si son détaillant ne le paie pas »). C'est un achat-revente : sa marge est 15 000 − 14 000. Mais FR-98 lui verse **en plus** une commission calculée sur 14 000. Le prix société n'est donc plus un prix : le coût net réel du freelance est 14 000 × (1 − taux). L'écran « votre coût d'achat » (FR-93) lui ment, et sa marge affichée (FR-93) est sous-estimée.
  2. La société ne voit que ses ventes **au freelance** (FR-94 lui interdit de voir celles aux détaillants). La base « ce qu'il a vendu » (FR-98) est donc, pour la société, ce qu'il a **acheté**. Un freelance qui passe de grosses commandes à crédit « à lui-même » encaisse la commission sur des achats qu'il n'a pas revendus. Le plafond propre (FR-97) est le seul frein, réglé par le DAF.
  3. Aucune compensation entre la commission due au freelance et sa dette envers la société. FR-98 : la commission passe à `VERSEE` par un ordre de `paiement` même si le freelance a 2 M de factures impayées.
  4. Trois définitions de la rémunération du freelance coexistent : commission sur prix société (FR-98), « marge nette » (FR-126 : « sa rémunération est sa marge nette »), commission sur « l'encaissé » du barème (FR-128).
  5. Les notes ouvertes l.1662-1664 contredisent les décisions : « Question ouverte bloquante : qui facture le détaillant ? », « Une commission est-elle versée ? [ASSUMPTION : non] ». Le §13 les liste encore comme hypothèses.
- **Scénario** : freelance Yao, plafond 5 M, commission 3 %. Il commande 5 M, la société verse 150 000 de commission au freelance ; il ne paie pas la facture (créance de 5 M, bloqué à 60 jours). Il a perçu 150 000 sur de la marchandise qu'il ne paiera jamais.
- **Correction** : trancher avec le PO, puis écrire :
  > **FR-98 (révisé).** La commission du freelance est calculée sur le prix société des quantités **dont la société a été payée**, par période, et est **compensée d'office** avec toute Créance échue du freelance avant versement. Elle ne s'applique pas aux commandes passées pour le compte du freelance lui-même sans rattachement à un point de vente de son portefeuille. Le libellé « votre coût d'achat » (FR-93) devient « prix société (avant commission) » et l'écran du freelance affiche sa marge **et** sa commission estimée. Supprimer les trois « Question ouverte » de la fin du §5.7 et les lignes correspondantes du §13.

## K4. L'étanchéité du prix freelance est cassée par le PRD lui-même
- **Où** : FR-56 (l.773), FR-54 (l.746), FR-96 (l.1592), FR-94 (l.1566), FR-126 (l.2225-2228), FR-8 (l.222), FR-18 (l.336), FR-70/FR-36 (adresse du bon), A.7 C13.
- **Problème** (cinq fuites concrètes) :
  1. FR-54 : la proforma du freelance « prend les prix de la grille applicable (…) freelance » et FR-56 la **convertit en Commande** (module `commande`, que lisent le bureau, le magasinier, le DG) avec « les lignes et les prix de la proforma ». Le prix freelance entre dans la table des commandes de la société.
  2. FR-96 : la facture du freelance au détaillant « porte, ligne par ligne, le prix freelance (15 000) et le prix société (14 000) ». Le **détaillant** reçoit un PDF qui affiche le coût d'achat de son fournisseur. Et la facture vit dans le module `facturation` de la société (une table, une base).
  3. FR-126 : « le DG (…) lit une rémunération individuelle » alors que la rémunération du freelance **est** sa marge nette (même FR) ; FR-8 ajoute DC et DAF. Le DG lit donc la marge que FR-94 lui interdit de voir. Les KPI FREELANCE ont « marge nette dégagée » pour 30 points : le score de poste (FR-123), vu du DG dans la matrice (FR-124), révèle la marge par déduction.
  4. FR-18 : l'export de toute l'organisation (`instance:donnees:exporter`) inclut-il la collection des factures de freelance ? A.7 C13 ne protège que « les prix de revente » de `catalogue`. Les sauvegardes et le personnel Money Vibes (hébergeur) lisent la base.
  5. Le bon de livraison / la tournée (FR-36, FR-70) portent l'adresse de livraison : si on livre le détaillant, la société connaît la liste des détaillants du freelance (FR-95 la déclare « décision à trancher »).
- **Scénario** : le DG ouvre `/commandes`, filtre sur Yao : la commande née de la proforma affiche 15 000 par ligne. Le test « 0 occurrence » de FR-94 est rouge au premier essai.
- **Correction** :
  > FR-56 : la conversion d'une proforma de freelance ne crée **jamais** une Commande à son prix ; elle crée, pour le détaillant, un document appartenant au freelance (espace `freelance`), et, pour la société, une Commande du freelance au prix société (FR-96). FR-96 : la facture du freelance au détaillant ne porte que **son** prix ; le prix société et la marge sont sur un écran privé du freelance, jamais dans le PDF. FR-126 : « le DG et le DC ne lisent pas la rémunération d'un freelance (sa marge) ; ils lisent sa commission ». FR-123 : la marge nette du freelance n'entre pas dans le score visible de la société (score « société » distinct du score « freelance »). Annexe A.7 C13 : l'export de la société exclut aussi les factures émises par un freelance ; documenter le chiffrement par freelance ou le déclarer impossible en février.

## K5. La Créance a trois propriétaires et un test « au même instant » impossible
- **Où** : FR-111 (l.1951), FR-49/FR-52, §6.2 (l.1920), §12 Q8, A.2 C3 et C5 (l.3644-3646), A.9 C5 (l.3772), l.2113.
- **Problème** :
  - Décision du PO : la Créance est portée par `paiement` (registre unique). Mais A.2 C3 dit que `facturation` possède « créances ouvertes (reste dû par facture) », C5 que `facturation` publie `facturation.creance.changed@1`, et A.9 C5 que `recouvrement` consomme `facturation.creance.changed@1` **et** `paiement.creance.soldee`. L'objet `Facture` porte aussi `montant_encaisse` et `reste_du` (l.583). Trois copies du reste dû.
  - FR-111 exige qu'un encaissement de 200 000 donne 307 400 « partout, au même instant ». Les modules sont des services séparés (A.2 C1 : `paiement-service` + `facturation`), avec événements Kafka : l'instantané inter-services n'existe pas.
  - `facturation` ne déclare pas `paiement` en `depends` (A.2 C1, `enrichiPar`) mais sans lui le reste dû est « non installé » (FR-49) : la balance âgée du premier jour n'existe pas. « Installable seul » (FR-19) est faux pour les deux modules ★.
  - Le contrat A.2 C13 `balance-equilibree` calcule le reste dû de la facture lui-même.
  - L'amendement du PRD `paiement` (tiers, source, périmètre) est une condition bloquante d'un service déjà codé et en production partielle ; il n'est ni daté ni attribué (FR-P13).
- **Scénario** : le paiement FedaPay arrive, `paiement` solde la Créance, l'événement part ; `facturation` est en retard de 3 s ; le commercial ouvre la fiche : facture « EMISE » avec 507 400 de reste dû, alors que la balance âgée dit 307 400 ; `recouvrement` relance une facture déjà partiellement payée.
- **Correction** :
  > **Règle de propriété (à insérer §6.2 et A.2 C3).** `paiement` est la seule source de `reste_du` et de `montant_regle`. `facturation` ne stocke aucun champ dérivé (`montant_encaisse`, `reste_du`, `statut PARTIELLE/PAYEE`) : elle les lit dans `paiement` à l'affichage et les marque « à jour au <heure> ». `facturation.creance.changed@1` est supprimé ; l'ouverture de la Créance est `facturation.facture.emise@1` consommé par `paiement`. FR-111 : « partout, **en moins de 5 secondes** » ; le test lit le même registre. A.2 C1 : `paiement` passe en `depends` de `facturation` ou FR-49 dit que la facture sans `paiement` n'est pas utilisable. Écrire l'amendement du PRD `paiement` avant la validation du lot et dater sa livraison avant la première facture.

## K6. Les deux parcours « ex aequo » du 15/01 ne peuvent pas passer avec ce que le PRD déclare disponible
- **Où** : UJ-1 (l.91), UJ-2 (l.94), UJ-8, FR-47 (l.661), FR-91 (l.1470), A.8 C8 (l.3757), NFR-6, FR-109, SM-1, SM-4.
- **Problème** :
  1. **UJ-1** dit « Le PDF part sur le WhatsApp de Mme Adjo » et « la relance part par WhatsApp ». FR-47 : WhatsApp et SMS sont « bientôt » (« e-mail disponible en février ») ; FR-91 : WhatsApp « bientôt, février 2027 » ; FR-115 exige les gabarits WhatsApp approuvés (FR-N11).
  2. **UJ-2** (réseau coupé à la 9e visite, file d'envoi, clé d'idempotence) suppose l'application Flutter hors connexion. A.8 C8 : « l'application mobile hors ligne : **bientôt** ». NFR-6, FR-109 et SM-4 l'exigent pourtant.
  3. Un prospect du 15/01 joue UJ-2 « lui-même » : sur quel téléphone, quelle distribution (APK, Play Store, TestFlight) ? Il n'est pas à moins de 200 m des 600 points de vente fictifs de Lomé : chaque clôture sera « hors zone » (FR-102) et alertera un superviseur fictif. Rien ne prévoit un mode essai qui déplace le GPS.
  4. FedaPay en essai : FR-207 (4) intercepte l'envoi, et « payer le lien (bac à sable) » doit réduire le solde. Cela exige un faux fournisseur, non cadré.
  5. FR-12 : les comptes du jeu n'ont « aucun mot de passe dans le code » ; comment un prospect passe-t-il de Akossiwa à Kodjo à Mensah (UJ-1 à UJ-5) ? Aucun mécanisme de connexion par rôle n'est écrit.
- **Scénario** : le prospect de 10 h clique « Facturer », le PDF est prêt, « Envoyer par WhatsApp : bientôt ». UJ-1 ne se termine pas. À 14 h il essaie l'app terrain : introuvable. SM-1 (100 % des essais) échoue avant le premier essai.
- **Correction** :
  > Réécrire UJ-1 et UJ-2 « version 15/01 » : envoi par e-mail et lien de téléchargement ; relance par e-mail/SMS simulé en essai (message réel non émis, journal visible). Définir un **mode essai** (FR-12b) : jeton de rôle à un clic (« Se connecter en tant que… »), GPS simulé calé sur le point de vente en cours, fournisseur de paiement bac à sable, distribution de l'app (lien de téléchargement ou PWA). Déplacer « application hors connexion » de « bientôt » vers « exigé » dans A.8 C8, ou retirer la coupure réseau de UJ-2 et NFR-6 pour le 15/01 et dire quand elle arrive.

## K7. Qui tient le grand livre d'un client qui « quitte Sage » ?
- **Où** : §6.4 (l.2287), FR-129 à FR-135, FR-131 (l.2350), A.11 C1 et C3 (l.3804-3806), §11 (l.3441), Q5 de §12, mémlog (option Sage gardé différée).
- **Problème** : le PO dit que le premier client quitte Sage. Le PRD répond : « le produit ne passe pas d'écritures au sens grand livre », « le grand livre légal reste chez le client (Sage) », l'export vers Sage vient « après » (mars 2027, proposé). Pourtant FR-129 à FR-135 génèrent des écritures `VALIDEE`, journalisent VT/BQ/AC/OD, contre-passent, « arrêtent » des périodes et soumettent des balances, et A.11 C3 ne liste pas les écritures parmi les données possédées. Le texte se contredit.
- **Scénario** : de février à mars, toutes les ventes et tous les encaissements du client sont dans Prospera et plus dans Sage. À la clôture de février l'expert-comptable n'a pas les factures dans Sage, la TVA collectée de février ne se retrouve que dans l'écran « TVA » de Prospera (FR-133 : `DECLAREE` « posé à la main »). Il ressaisit 1 000 factures, ou garde Sage en double saisie, ou déclare la TVA sans pièces.
- **Correction** : le PO doit trancher explicitement parmi (a) Prospera est le livre des ventes et encaissements à partir de la bascule, l'export comptable (journaux CSV importables) est ★ de février et non « bientôt » ; (b) Sage reste le livre, une double saisie est assumée jusqu'à l'export. Écrire alors :
  > **FR-131b : Journal des ventes et des encaissements exportable (février).** Fichier CSV des écritures VT, BQ, CA par période, avec numéro de pièce, compte, débit, crédit, au format de colonnes validé par l'expert-comptable du client. C'est le minimum pour que « quitter Sage » soit vrai en février. Corriger A.11 C3 (écritures possédées) et §6.4 (supprimer « ne passe pas d'écritures »).

## K8. RPO d'une heure et numérotation légale sans trou
- **Où** : NFR-1 (l.3391), NFR-3, FR-43 (l.611-612), FR-217 (l.3348), SM-3, NFR-9.
- **Problème** : NFR-1 accepte « une perte maximale d'une heure de données en cas de panne ». NFR-3 exige des numéros de facture et de bon de livraison sans trou ni doublon. Si la plateforme perd l'heure précédente, les factures déjà envoyées par PDF à des clients portent des numéros qui disparaissent, le compteur est reparti en arrière, les mêmes numéros seront réémis à d'autres clients. Idem pour les encaissements PI-SPI/FedaPay confirmés par le fournisseur et absents après restauration.
- **Scénario** : panne à 11 h, restauration à 10 h : trois factures `FAC-2027-0420 à 0422` envoyées à trois clients n'existent plus ; l'heure suivante, 0420 est attribué à un autre client. Deux documents fiscaux différents, même numéro, chez deux clients. L'argent encaissé par FedaPay a été notifié mais pas rejoué.
- **Correction** :
  > **NFR-1 (révisé).** Pour les compteurs de numérotation, les factures émises, les avoirs, les Encaissements et les mouvements de stock, perte maximale = 0 (écriture synchrone répliquée, journal d'événements rejouable). Le RPO d'une heure ne vaut que pour les autres données. À la restauration, l'émission est suspendue jusqu'à réconciliation du compteur avec les PDF envoyés (`notification`) et les webhooks du fournisseur de paiement.

## K9. Le graphe de dépendances est incompatible avec le plan : les deux modules ★ en entraînent une douzaine
- **Où** : §5 (l.359), §10.1 (l.3426), A (préambule, l.3617), A.17 problèmes 5 et 9, mémoire « 17-20 semaines pour 10 disponibles ».
- **Problème** : « Deux modules sont ★ ». Pour UJ-1 (commande → stock réservé → BL → facture → paiement → relance → balance âgée) et UJ-2, la fermeture est : `reseau`, `pdv`, `catalogue`, `stock` (réservation, absente du PRD stock : « `réservé = 0` en v1 », FR-203), `commande`, `entrepot` (BL, préparation, sortie), `facturation`, `paiement` (amendement Créance), `notification`, `recouvrement`, `terrain` (Flutter), `reprise`, plus l'amendement `pdv` (conditions de règlement, FR-188), l'amendement `catalogue` (grille par client, FR-193), l'élargissement du format de droit d'`auth-service` (« avant la semaine 5 »), une centaine de nouveaux droits par PR `auth-service`. §10.1 dit « aucun ordre ni aucune date » et SM-1 impose le 15/01. Le PRD ne contient pas de coupe de février.
- **Scénario** : le plan découvre en S3 qu'aucune story ne peut démarrer sans les amendements `paiement`/`pdv`/`catalogue`/`stock`, que le manifeste `facturation` n'existe pas (A.17 point 5) et que `terrain` hors ligne est « bientôt ». Dev A et Dev B sont dans le même dépôt la même semaine.
- **Correction** : ajouter §10.3 « Coupe du 15/01 et de février ».
  > Liste fermée de modules et de FR par date (15/01 : UJ-1, UJ-2 version §K6 ; février : modules ★ + dépendances strictes) ; tout le reste « bientôt ». Tableau des amendements bloquants (propriétaire, PRD cible, échéance) : `paiement` Créance, `pdv` conditions de règlement et suspension de plafond, `catalogue` grille par client, `stock` réservation active, `auth-service` format et droits. Chaque FR hors coupe porte un tag `[HORS-15/01]`.

---

# ÉLEVÉE

## E1. Rôles fantômes et table d'accès incompatible avec les droits
- **Où** : §2.1, FR-4/FR-5, FR-30 « chargé de bureau », FR-42/47/48 « chargé de facturation », FR-36/70 « chauffeur », FR-69 « préparateur », FR-71 « réceptionnaire », FR-58 « administrateur de l'organisation » ; A (préambule l.3616), C7 de chaque module.
- **Problème** : le PRD définit 15 rôles et en utilise au moins six autres. FR-5 érige `route-access.ts` (rôle → routes) en règle unique ; le contrat A est en **droits** `module:objet:action` à catalogue fermé de 13 codes, une PR `auth-service` par droit. Aucune table rôle → droits n'existe. « Chargé de facturation » peut être le DAF, le comptable ou personne.
- **Scénario** : à la recette, personne ne peut émettre une facture car aucun rôle de la table n'a `facturation:facture:emettre` ; ou le DG émet les factures, ce qui est contraire à son profil (« ne saisit rien »).
- **Correction** : ajouter §2.1b « Matrice rôle × droit » (15 lignes × ~90 droits, une table), supprimer « chargé de bureau/facturation » au profit du rôle réel (suggestion : `RESP_VENTES` ou un 16e rôle `BUREAU_VENTES`), déclarer le chauffeur comme un agent de terrain (`GEST_ENTREPOT`, ou compte limité), le préparateur comme donnée de l'organisation (FR-69) sans compte.

## E2. Quatre seuils de retard pour le même blocage, et deux circuits de déblocage
- **Où** : FR-13 (l.279-287, aucun seuil de retard), FR-33 (l.430 « 45 jours »), FR-119 (l.2059 « 60 jours ou plafond »), FR-114 (l.1999), FR-148 (« 30 jours »), UJ-4 (75 jours), FR-187 (l.3163 « blocage dur ou avertissement »), FR-189 (l.3170), FR-140 (l.2453).
- **Problème** : 30 (exclusion campagne), 45 (`CREANCE_ECHUE_BLOQUANTE` de la commande, valeur de la démo restée), 60 (blocage du recouvrement, décision PO). Le contrôle 45 jours dans `commande` bloque un client que `recouvrement` ne bloque pas encore (et sans dérogation prévue côté recouvrement). Le blocage automatique « encours > plafond » (FR-119) crée un blocage de **crédit du Tiers** pour un client à jour qui a seulement dépassé son plafond ; son déblocage exige acompte ou échéancier signé et décision DAF, alors que FR-33 donne au DAF une dérogation ponctuelle sur ce même plafond. FR-187 permet à `commande` de n'avertir que, FR-33 impose le refus. Le blocage passe par trois chemins (`recouvrement` → `pdv` → `commande` selon FR-189 ; `recouvrement` → `commande` direct selon FR-119/FR-33 ; DAF `finance-transactions` selon FR-140).
- **Scénario** : client à 50 jours de retard, plafond respecté : refusé par `commande` (45 j), non bloqué par `recouvrement` (60 j) : le recouvrement ne voit pas de blocage à débloquer, le client appelle le DG. Un client à jour dépasse son plafond de 1 000 F à la livraison : le crédit est bloqué, FR-68 gèle toutes ses commandes préparées.
- **Correction** :
  > **FR-13 (ajouter une ligne)** : « Seuil de retard bloquant : 60 jours (valeur unique, paramètre `SEUIL_BLOCAGE_JOURS`) ; seuil d'alerte direction : 30 ; seuil d'exclusion des campagnes : 30. » **FR-33** : supprimer `CREANCE_ECHUE_BLOQUANTE` (45 j) et ne garder que `CREDIT_BLOQUE` (état unique lu dans `pdv`, FR-189). Le dépassement de plafond **refuse la commande** (`PLAFOND_CREDIT_DEPASSE`) mais ne pose **pas** un blocage de Tiers. FR-189 est le seul chemin ; FR-140 passe par lui. FR-187 (3) : « blocage dur uniquement ».

## E3. Commande validée, puis crédit bloqué : réservation sans issue
- **Où** : FR-68 (l.1057 « Il ne réserve rien »), FR-119 (l.2063), FR-34, FR-36.
- **Problème** : FR-68 : un bon dont le client est bloqué passe `BLOQUER`, « il ne réserve rien ». Mais la réservation a été posée à la validation (FR-34). FR-119 dit que la commande validée « n'est pas annulée ; sa livraison suit le blocage de la règle de `commande` ». Qui libère la réservation ? Qui reprend la préparation au déblocage ? Un camion déjà chargé ?
- **Scénario** : lundi, validation, réservation de 500 caisses. Mardi 60e jour : blocage. Mercredi le magasinier voit `BLOQUER`. Les 500 caisses restent réservées 15 jours (reliquat), le stock disponible du produit baisse pour tout le monde.
- **Correction** :
  > **FR-34b.** Un blocage de crédit posé après validation place les commandes concernées en statut `SUSPENDUE_CREDIT` : la réservation est **conservée** pendant `N` jours (paramètre, 5 par défaut), puis libérée avec alerte ; le déblocage la rétablit si le disponible le permet. Un camion déjà `EXPEDIE` n'est jamais rappelé sans décision DG (FR-119). FR-68 : le bon est `SUSPENDU`, pas `BLOQUER`.

## E4. Aucune règle d'imputation des paiements ; l'agent maîtrise les deux côtés de la caisse
- **Où** : FR-104, FR-105, FR-111, FR-116, FR-132, FR-49.
- **Problème** : un encaissement est rattaché à « une Créance » (au singulier). Un détaillant qui doit cinq factures et paie 300 000 en espèces : laquelle ? Sans règle, l'agent choisit la plus récente, la plus vieille reste dans la tranche « plus de 60 jours » et déclenche le blocage (FR-119) à tort ou à raison. Autre faille : l'espèce déclarée « diminue le solde affiché » (FR-104) avant la remise ; `écart = remis − déclaré` (FR-105) compare l'agent à lui-même. Un agent qui déclare 20 000 sur 35 000 reçus et remet 20 000 a un écart de 0 ; le client croit avoir payé 35 000. Le client n'est jamais confronté à ce qu'il a payé.
- **Scénario** : Kodjo encaisse 35 000 pour Mme Adjo, déclare 20 000. Mme Adjo reste à 15 000 de dette, relancée à tort, bloquée à 60 jours, appelle le DG. Aucun contrôle n'avait relevé la différence.
- **Correction** :
  > **FR-104b.** Par défaut, un Encaissement sans imputation explicite s'impute **à la Créance d'échéance la plus ancienne** du Tiers (FIFO), l'agent peut cibler une autre Créance avec un motif. **FR-104c.** Tout encaissement en espèces génère un **reçu** (SMS ou WhatsApp, à défaut e-mail ou reçu papier numéroté) adressé au Tiers avec montant et agent ; le Tiers peut contester. Un encaissement déclaré réduit l'**encours affiché** mais pas `reste_du` de la Créance tant qu'il n'est pas rapproché (FR-105) ; le blocage de crédit lit le reste dû rapproché.

## E5. Arrondis, TVA et numérotation : plusieurs règles, un test impossible à écrire
- **Où** : NFR-2 (l.3392), FR-45 (l.635-636), FR-48 (l.673), FR-67/FR-134/FR-141 (1,18 en dur), FR-43 (l.610, 616), FR-35/FR-36 (BL), FR-58 (reprise sans lignes), FR-11, SM-3.
- **Problème** :
  1. NFR-2 : « la TVA se calcule sur le HT **ligne par ligne** ». FR-45 : `montant_tva = arrondi(montant_ht × 18 %)` sur le **total**. Pour trois lignes de 33,33 le résultat diffère de 1 ou 2 F. SM-3 (« 100 % TVA = 18 % du HT au franc près ») et FR-11 ont donc deux oracles.
  2. Mode d'arrondi (demi supérieur ? bancaire ?) jamais écrit, alors que NFR-2 le demande.
  3. Avoir partiel : TVA de l'avoir arrondie par ligne ; la somme des avoirs peut dépasser la TVA de la facture d'origine d'un franc ; `AVOIR_SUPERIEUR_A_LA_FACTURE` est testé sur quel montant (HT, TTC) ?
  4. Facture reprise de Sage « sans détail » : un avoir doit scinder HT et TVA sans lignes. Les écritures 701/4431 de FR-129 sont indéterminables.
  5. FR-67 « × 1,18 » et FR-134 « ÷ 1,18 » en dur, alors que NFR-2 et FR-45 disent « jamais codé en dur », « taux par article ».
  6. FR-43 : l'exemple « `FAC-2026-0412` → `FAC-2026-0413` » est daté de 2026 alors que la première facture est émise en février 2027 ; le jeton d'année du format vient-il de la date d'émission (alors `FAC-2027-0413`) ou est-il figé ? La suite « continue d'année en année » avec un millésime dans le numéro est un piège.
  7. NFR-3 impose une suite de **bons de livraison** sans trou ; FR-35 (modifier une commande `VALIDEE` annule et réserve de nouveau) et l'annulation (FR-34) suppriment-ils le bon ? Le statut `ANNULE` n'existe pas (l.385).
- **Correction** :
  > **NFR-2 (révisé)** : « TVA par ligne, `arrondi = demi supérieur à l'unité XOF`, TVA de la facture = Σ des TVA de ligne. FR-45 aligné. Un avoir calcule sa TVA par ligne sur la ligne facturée correspondante et le cumul des avoirs ne dépasse jamais ligne à ligne la facture. Le taux vient du paquet fiscal ou de l'article ; aucun `× 1,18` n'est écrit : FR-67, FR-134, FR-141 relisent `taux_tva`. » FR-43 : « le millésime est celui de la date d'émission ; la suite ne repart pas à 1 ; test : première facture émise le 01/02/2027 après `FAC-2026-0412` = `FAC-2027-0413`. » FR-36 : ajouter le statut `ANNULE` au bon ; un bon annulé garde son numéro.

## E6. La facture sur « quantités servies » facture ce qui a été préparé, pas ce qui a été livré
- **Où** : FR-36 (l.470-471), FR-42 (l.598), FR-41, FR-70 (l.1083-1085), FR-102, objet Commande (champ `facture` unique, l.382).
- **Problème** : `quantite_servie` est écrit par le magasinier au picking. Un détaillant qui refuse 10 caisses abîmées à la porte, ou une livraison retournée, n'a aucun flux : pas de `quantite_livree`, pas de retour en entrepôt, pas de refus. La facture reprend « les quantités servies ». Le seul remède est un avoir (FR-48, seuil de 500 000 pour validation DAF), qui laisse le stock hors entrepôt. Par ailleurs le chauffeur « confirme la livraison » mais n'a pas de rôle (E1) ni d'application hors connexion (FR-109 ne cite que visite, commande, encaissement). Enfin, une commande à deux bons (deux points de stock) a deux factures, alors que l'objet Commande a un champ `facture` unique.
- **Scénario** : le chauffeur à Adidogomé n'a pas de réseau ; le bon reste `EXPEDIE` ; le bureau ne peut pas facturer (FR-42 exige `LIVRE`) ; la créance n'existe pas, le recouvrement ne voit rien, le client paie « quand la facture arrive ».
- **Correction** : ajouter au bon `quantite_livree` et `quantite_refusee` avec motif ; la facture reprend les **quantités livrées** ; un refus crée une entrée de stock à confirmer. Autoriser la confirmation hors connexion par l'agent livreur (FR-109) ; remplacer `Commande.facture` par `factures` (liste). Délai de repli : facture automatique à J+2 de l'expédition si aucune confirmation (paramètre), signalée.

## E7. Circularité prospect → point de vente → première commande
- **Où** : FR-30 (l.393), FR-77 (l.1238), FR-79, FR-80 (l.1271-1277), FR-52 (l.724), FR-33.
- **Problème** : FR-30 refuse tout texte libre pour le point de vente. FR-80 crée le point de vente **à la validation de la première commande**. FR-77 passe le prospect à `PREMIERE_COMMANDE` à la **livraison** ; FR-80 dit encore « date de l'ouverture = première commande livrée ». Une commande ne peut donc pas être saisie pour un prospect, et un point de vente créé par `pdv` n'a ni condition de règlement (FR-52 refuse l'émission), ni plafond (FR-33 retombe sur `max(400 000, 0,6 × CA)` avec un CA de zéro ; le garde-fou de première commande est à 1,5 M et FR-13 dit « DC », FR-79 dit « DAF »), ni commercial affecté.
- **Scénario** : le chargé de prospection saisit une première commande à 1,2 M pour un prospect : `PDV_HORS_PERIMETRE` (le prospect n'est pas un point de vente). S'il crée d'abord le point de vente à la main, UJ-7 ne se mesure plus.
- **Correction** : définir `pdv` en deux états (`PROSPECT_CONVERTI` créé par `conquete-objectifs` avec conditions de règlement par défaut de l'organisation et plafond = garde-fou de première commande) et autoriser la saisie d'une commande dessus. Unifier la levée : « DAF avec motif ou acompte de 50 % (FR-111b) » partout, FR-13 aligné. Datation de l'ouverture : date de la première **livraison** partout.

## E8. Deux cycles de vie de commande hors ligne, et un validateur qui n'existe pas
- **Où** : UJ-2 (l.94), FR-103 (l.1782-1783), FR-37 (l.481), FR-33 (l.434), FR-109 (l.1854).
- **Problème** : FR-37 : transmettre → `TRANSMISE` ; seul le bureau valide (« un commercial ne peut pas valider sa propre commande »). FR-103 : hors connexion, statut `EN_ATTENTE_CONFIRMATION_STOCK`, « le serveur confirme, confirme partiellement ou refuse selon le stock réel », « l'agent voit le sort de sa commande à la synchronisation » : statut absent de la liste de 6 de la commande, et validation automatique contraire à FR-33. La réservation du stock (FR-34) n'a lieu qu'à la validation humaine : pendant ce délai le commercial a promis un produit que le bureau découvrira épuisé. FR-33 n'a pas de délai de validation ni de ré-offre.
- **Scénario** : Kodjo promet 40 caisses à 9 h, sa commande est `TRANSMISE`. Le bureau valide à 16 h : stock insuffisant. Mme Adjo a refusé d'autres fournisseurs à 9 h.
- **Correction** : un seul modèle : `TRANSMISE` couvre l'attente ; le champ `confirmation_stock` (`EN_ATTENTE|CONFIRMEE|PARTIELLE|REFUSEE`) est séparé du statut ; une règle de **validation automatique** est possible par organisation (paramètre) quand tous les contrôles de FR-33 sont verts ; sinon SLA et alerte au bureau (`TRANSMISE` > 2 h).

## E9. Appareil perdu : effacer la base locale détruit de l'argent non encore transmis
- **Où** : FR-110 (l.1864-1866), FR-109, NFR-6.
- **Problème** : à la déconnexion à distance, « l'application efface sa base locale » ; les objets non envoyés sont « signalés comme perdus avec l'appareil, à rapprocher ». Ces objets sont des encaissements en espèces (de l'argent physique chez l'agent), des commandes et des clôtures. Un jeton expire au bout de 14 jours hors contact (assumption). Un agent en brousse hors réseau 15 jours voit son jeton expirer, ses 15 jours d'encaissements sont dans la base locale.
- **Scénario** : l'agent est volé ; le superviseur déconnecte ; l'application s'efface au premier contact ; 120 000 F encaissés, la file contient les clés d'idempotence, tout est perdu. Impossible de prouver ce qui a été encaissé.
- **Correction** :
  > FR-110 (révisé) : la déconnexion à distance **verrouille** l'application (plus de saisie) mais n'efface qu'après réception de la file d'envoi par le serveur, ou après une action explicite du superviseur avec confirmation de perte. L'expiration du jeton n'interdit pas l'envoi d'une file déjà produite (un jeton d'« envoi seul » à durée longue). Les encaissements en espèces gardent un reçu papier numéroté (E4).

## E10. Le modèle « Décision à trancher » n'a pas de propriétaire et crée une dépendance dure cachée
- **Où** : FR-14 (l.298), FR-3, FR-127 (l.2236-2240), FR-140, FR-145, FR-168, A.1 C3 et C7, A.10 C7 (l.3792), A.15 C3 (l.3878), A.15 C1.
- **Problème** : FR-14 est un objet unique pour tous les modules. A.15 C3 (« décisions à trancher (état) ») le fait posséder par `dashboard`, dont A.15 C1 dit « aucun module n'en dépend en dur ». Pourtant la validation de remise (`commande`), la validation d'achat (`approvisionnement`), le blocage (`recouvrement`) en dépendent. La validation de remise a aussi deux propriétaires : `commande` (C3 : « demandes de remise et leur décision », droit `commande:remise:valider`) et `equipe` (FR-127, objet « Demande de dérogation » de son noyau).
- **Scénario** : on installe `commande` sans `dashboard` ; « Demande de remise » = `NON_INSTALLE`, personne ne peut accorder 15 % ; la commande est bloquée. Inversement, `equipe` installé sans `commande` ne sait que lire.
- **Correction** : créer un module (ou une bibliothèque du socle) `decisions` propriétaire de FR-14, dépendance dure commune ; retirer FR-127 de `equipe` (réduire à un écran « Validations » qui appelle `commande`). A.15 C3 : le dashboard **lit** l'état, ne le possède pas.

## E11. « Installable seul » (FR-19) et « non installé » (partout) contredits par les propres textes
- **Où** : FR-32 (l.422) vs A.1 C4 (l.3627) ; FR-64 (l.945) vs FR-13 ; FR-49 ; A.9 C1 (l.3768) ; A.2 C1.
- **Problème** : FR-32 : sans `stock`, la validation est refusée (`STOCK_NON_INSTALLE`) ; A.1 C4 : « la commande se valide sans contrôle de stock et le dit ». FR-64 : sans module financier, la validation de l'achat reste possible (« trésorerie non vérifiée ») alors que FR-13 dit que le plancher « bloque ». `recouvrement` dépend en dur de `notification` (A.9 C1), alors que le recouvrement sans envoi reste utile (appel, visite). `facturation` est inutilisable sans `paiement` (K5).
- **Correction** : tableau unique « comportement si le module manque » par module, et une règle générale : un garde-fou financier non vérifiable **bloque par défaut** (paramètre `si_inconnu = BLOQUE|AVERTIT`, `BLOQUE` par défaut pour le crédit et la trésorerie). Aligner FR-32, A.1 C4, FR-64.

## E12. Reprise de février : marche en parallèle, balance de contrôle et facture sans lignes
- **Où** : FR-43 (l.607-615), FR-58 (l.790-802), FR-216, FR-217, Q1 et Q5 de §12, Reprise FR-17.
- **Problème** :
  1. Si le client émet encore des factures dans Sage pendant la marche en parallèle (Reprise FR-17), la suite de numérotation initialisée à la bascule est déjà périmée. FR-217 (4) refuse une seconde initialisation. Aucune procédure de **gel de Sage** à une date et heure précises n'est écrite.
  2. La balance Sage fournie et les encaissements de la veille : une coupure à date (cut-off) n'est pas définie. L'égalité « Σ reste dû = balance Sage » (FR-58) n'a de sens qu'à une date précise, sinon l'écart nul est faux le lendemain.
  3. La facture reprise n'a pas de lignes (`marge « non calculable »`), pas de HT/TVA séparés (E5.4), pas d'échéance fiable si Sage a stocké la date de pièce seule.
  4. La taille du client est inconnue (Q1) alors que NFR-7 et FR-10 dimensionnent 2 000 points de vente ; aucune estimation du nombre de factures ouvertes.
  5. FR-216 : l'ordre `reseau` → `pdv`/`catalogue` → `stock` → `facturation`, et les prix négociés (~1 000 tarifs clients, peut-être 36 000 lignes `grille` pour 600 clients × 60 articles) ne sont pas dimensionnés.
- **Correction** : ajouter « FR-58b Bascule » : date et heure de gel de Sage, dernier numéro, balance à date, invariants rejoués après le dernier jour ouvré. Valeur de contrôle supplémentaire « HT et TVA des factures ouvertes » (à défaut, TVA = TTC − TTC/1,18 déclarée comme estimation et marquée). Obtenir un export Sage réel avant le 20/11 (Q5 est bloquant, pas ouvert).

## E13. Le PRD microfinance ne peut pas réutiliser la partie 3 tel quel
- **Où** : §6 (l.1674-1685), FR-104 (l.1792), FR-105, FR-111, FR-119, FR-189, FR-114, tableaux de vocabulaire de 6.1 à 6.8.
- **Problème** (le noyau est « neutre » dans les titres, pas dans les objets) :
  1. **Créance = un montant unique** (`montant_origine`, `reste_du`). Une échéance de prêt a capital, intérêts, pénalités, avec un **ordre d'imputation réglementé** (pénalités, intérêts, capital) ; le PAR se calcule sur l'**encours restant dû du prêt entier** dès qu'une échéance est en retard, pas sur l'échéance. Le noyau déclare ne calculer « ni pénalité ni intérêt » et la balance âgée IMF est « la même structure, tranche masquée » : fausse pour le PAR.
  2. **L'encaissement est toujours rattaché à une Créance** (FR-104). La **collecte d'épargne** n'en a aucune : c'est un dépôt. Le noyau Terrain dit pourtant « ne les distingue pas ». Même problème que K2 : le solde créditeur est le bon objet, et il manque.
  3. **Tiers** = un point de vente. Le **groupe solidaire** (caution mutuelle) est un tiers à plusieurs débiteurs ; le noyau a un Dossier par Tiers, aucun lien groupe ↔ membres ↔ caution.
  4. **Blocage du crédit** : FR-189 le fait écrire par `pdv`, propriétaire du plafond. L'IMF n'a pas de `pdv` ; le « plafond d'octroi » n'a pas de propriétaire. Le noyau Recouvrement ne peut pas être neutre si le blocage ne l'est pas.
  5. **Rôles et KPI** : les 15 rôles et la table des KPI (6.3) sont ceux du distributeur ; aucun mapping `AGENT_CREDIT`, `CHEF_AGENCE` ; le score de poste IMF n'a pas de source.
  6. **Vocabulaire** : « Vocabulaire = donnée, jamais une branche de code » (l.1679), mais les statuts et les codes de refus portent des mots de commande (`CREDIT_BLOQUE`, `EN_ATTENTE_CONFIRMATION_STOCK`), et FR-119 parle de « commande ». Le test « changer le tableau ne change que les libellés » est impossible à écrire pour les codes d'erreur.
  7. **Données personnelles de membres** (KYC, épargne, GPS de l'agent) : seul un `[ASSUMPTION]` à valider avec la réglementation.
  8. Aucun module de la partie 3 ne décrit un écran **d'agence** (guichet, caisse de guichet) ; FR-105 renvoie à « Caisse » (PRD paiement §1.1) hors périmètre.
- **Scénario** : le PRD microfinance cite « Terrain noyau FR-100 à FR-110 » et « Recouvrement noyau FR-111 à FR-121 » ; au premier atelier IMF on découvre que ni l'épargne ni le PAR ni le groupe solidaire ne tiennent dans le noyau, et que chaque FR du noyau doit être rouvert : le gain promis (« écrire une fois ») s'évapore.
- **Correction** : ajouter §6.0 « Ce que le noyau ne sait pas faire pour l'IMF et l'assurance » avec les cinq extensions minimales : (a) `Créance.composantes[]` (capital, intérêt, pénalité, ordre d'imputation configurable) et `encours_expose` ; (b) solde créditeur / dépôt (K2) ; (c) `Tiers.groupe` et `garants` ; (d) mécanisme de blocage porté par `recouvrement` en publiant un fait, `pdv` ou `credit` l'appliquant ; (e) codes de refus génériques (`BLOCAGE_ACTIF`, `DISPONIBILITE_INCONNUE`). Dire dans chaque FR si elle est « noyau » ou « distributeur » (balise `[NOYAU]` / `[DISTRIB]`).

## E14. Les « décisions du PO » apparaissent toujours comme hypothèses ou questions ouvertes, parfois inversées
- **Où** : §5.7 notes (l.1662-1665), FR-41 notes, FR-99 notes, §13 (l.3482-3541 et suivantes), FR-91 (« février 2027 »), FR-131 (« mars 2027 »), §12 (l.3450-3456).
- **Problème** : sur freelance, le §13 conserve « Question ouverte (bloquante) : qui facture le détaillant ? », « Commission versée ? [ASSUMPTION : non] ». Les rédacteurs de 2, 3 et 4 ont mal fusionné ; la décision du PO de faire facturer le détaillant par le freelance ne se retrouve que dans FR-96, tandis que l'objet « Commande du freelance » (l.1540) et les crédits de plafond de FR-97 reflètent l'ancien modèle. §13 compte ~200 hypothèses et ne signale pas lesquelles sont tranchées. Deux dates (« février 2027 », « mars 2027 ») restent dans le texte malgré FR-2 (« sans date »).
- **Scénario** : Dev B lit §13, code la commission à « non ».
- **Correction** : passe de nettoyage : chaque `[ASSUMPTION]` reçoit un statut `OUVERTE | TRANCHÉE (date, décision) | CADRE`, ordre de priorité par risque ; supprimer les questions closes ; retirer les deux dates. 

## E15. Les moteurs de notation (KPI, score de santé, rapport) peuvent révéler des données privées malgré FR-8
- **Où** : FR-122 à FR-124, KPI FREELANCE, FR-99, FR-8, FR-126, FR-156.
- **Problème** : FR-8 interdit à toute réponse d'API de rendre la marge du freelance. Mais le classement et la matrice des postes (FR-124) sont vus par DC et DG, le score de poste FREELANCE pondère « marge nette dégagée » à 30 (FR-122 : « chaque KPI est calculé par une requête sur le module source »). Le score est un canal latéral. FR-99 dit que la marge nette est « visible du freelance seul » tout en la faisant entrer dans un score comparé.
- **Correction** : voir K4 : deux scores (société, freelance). Test d'étanchéité : variation de la marge d'un freelance à CA société constant ne doit pas changer le score visible de la société.

## E16. Contradiction sur le droit de lire les rémunérations
- **Où** : FR-8 (l.222), FR-126 (l.2225), FR-124, FR-128, FR-156.
- **Problème** : FR-8 : visibles du freelance/agent, du DG, du DC, du DAF. FR-126 : l'agent, le DG, « le rôle explicitement habilité ». Le DC et le DAF figurent-ils ? A.10 C7 n'a pas de droit « rémunération ». Les droits de rémunération ne sont dans aucune matrice.
- **Correction** : un droit unique `equipe:remuneration:consulter`, attribué à DG par défaut, DAF si le DG le décide ; DC n'a pas le droit. FR-8 et FR-126 renvoient à lui.

## E17. Exigences non testables ou dont l'oracle manque
- **Où** : FR-1 (l.161 « dans la seconde »), FR-30 (« dans la minute »), SM-4, FR-15 (« après recalcul »), FR-16, FR-85, SM-1 (« 100 % des essais, aucun blocage »), SM-6, FR-10 (< 10 min « ASSUMPTION »), NFR-7, FR-111 (« au même instant »), FR-107 (« la carte et les KPI ne peuvent plus diverger »).
- **Problème** : trois latences différentes (seconde, minute, 5 s) pour des mises à jour qui traversent plusieurs services asynchrones. « Recalcul » sans cadence. « Aucun blocage » sans protocole d'observation. SM-6 (« chaque rôle contre chaque écran et chaque route ») sans matrice cible (E1).
- **Correction** : un seul objectif de fraîcheur (« visible chez un autre rôle en moins de 5 s au 95e centile, 30 s au maximum »), un tableau de fraîcheur par indicateur (temps réel / toutes les 5 min / nuit), SM-1 mesurée par un parcours scripté rejoué sur chaque essai avec journal des étapes.

---

# MOYENNE

## M1. Géofencing : FR-13 dit « bloque », FR-102 dit « signale »
FR-13 (l.286) : « 200 m, bloque la clôture hors rayon, superviseur peut passer outre ». FR-102 (l.1770) : « la clôture reste possible mais la visite est signalée ». Les deux ne peuvent pas être vraies. Choisir : FR-102 « signale » est plus réaliste (GPS indisponible, immeuble) ; corriger FR-13.

## M2. Le plafond par défaut `max(400 000, 0,6 × CA)` contredit les reprises
FR-33 applique un plafond par défaut aux clients qui n'en ont pas ; FR-52 refuse d'émettre sans conditions de règlement ; FR-187 (5) exige la valeur de contrôle `PLAFOND_SANS_OBJET`. Un client repris sans plafond reçoit-il 400 000 implicitement ? Un plafond implicite non affiché est un blocage surprise. Règle : pas de plafond par défaut caché ; « plafond non renseigné » = commande à crédit refusée ou avertissement selon `si_inconnu` (E11).

## M3. Ordre de recherche des prix : deux règles
FR-31 : prix négocié client, puis société ; freelance : grille freelance. FR-193 (2) : condition « point de vente » avant catégorie puis zone ; FR-93 : « Les prix négociés propres à un client ne s'appliquent jamais à un freelance » ; FR-96 : le freelance commande au prix société. FR-31 mêle prix de **revente** du freelance et prix d'**achat**. Séparer deux résolutions : `prix_achat_freelance` (toujours société) et `prix_revente_freelance` (jamais commande société, K4).

## M4. Remise : le seuil « 12 % » est celui des combos de stock réutilisé comme remise commerciale
FR-31, FR-127, FR-13, A.1 C6 : même 12 %, mais ce seuil de la démo valide une promotion sur stock lent, pas une remise négociée d'un commercial. Un prix négocié à −15 % par rapport à la grille (reprise de Sage, 1 000 tarifs) est-il une « remise » à valider ? Séparer remise de ligne (par agent) et remise promotionnelle (marketing).

## M5. Dette fournisseur créée deux fois
FR-67 : la réception crée la dette (`prix × reçu × 1,18`). FR-134 : la facture d'achat « alimente la dette ». Sans règle de rapprochement (3-way match), la dette est comptée deux fois dès qu'un comptable saisit la facture après réception ; le BFR (FR-138) et les 8 chiffres du DG (« dette fournisseurs échue ») sont gonflés. Règle : la réception crée un **engagement** ; la facture d'achat le transforme en **dette** (rapprochement, écart signalé).

## M6. Plancher de trésorerie : engagements incomplets
FR-64 : `solde_projete = solde − Σ commandes en validation + celle validée`. Les commandes `ENVOYEE` non payées, les échéances fiscales et les salaires échappent. Un plancher de 40 M n'est jamais franchi sur le papier. Utiliser la prévision FR-137 (sorties échues à 7 jours) pour le calcul de FR-64.

## M7. Inventaire : « pas de gel » contredit le test
FR-74 : `stock après = quantité comptée` (test 120 → 117) ; mais « l'écart tient compte des mouvements intermédiaires ». Si 5 caisses sortent entre le comptage et la validation, le stock correct est 112, pas 117. `ecart_pct = ecart / théorique` : division par zéro si théorique = 0. Ajouter la définition : `ajustement = compté − (théorique à l'instant du comptage)`, jamais `stock = compté`.

## M8. Le contrôle de réception est asymétrique
FR-71 : `ecart_pct = |reçu − commandé| / commandé` : un **surplus** de 4 % est `RESERVE`, un surplus de 20 % `LITIGE`. Que fait-on du surplus (mise en stock ? refus ? facture fournisseur) ? Pour un article commandé à une bouteille, 2 % de tolérance est un entier nul. Écrire : tolérance en valeur absolue minimale, règle de surplus.

## M9. FR-158 se contredit sur le blocage automatique
FR-158 (l.2831) : le serveur refuse `AUTO` pour toute règle qui engage « un blocage de crédit » (`MODE_AUTO_INTERDIT`). Dernier point du même FR : le blocage de crédit est une règle `AUTO`. FR-114 (l.1996) place aussi une « relance ferme » (SMS puis appel programmé, ton « ferme ») en `AUTO` alors que FR-158 limite `AUTO` à « rappel, accusé, relance douce ». Aligner : le blocage est la **seule** exception explicite, listée à la règle.

## M10. Deux jeux de règles de relance
FR-114 (échelle J−3, J+1, J+7, visite J+15, direction J+30, blocage > 60) et FR-120 (action recommandée : probabilité < 40 contentieux, > 60 j visite, > 30 j appel puis échéancier). Les deux disent quoi faire à J+20. Une seule source (l'échelle) et FR-120 la lit.

## M11. Dérogation et décision hors chaîne
FR-13 : plafond de crédit → DAF ; FR-33 : DG et DAF ; UJ-1 : DAF ; FR-79 : DAF ; FR-13 : première commande → DC. Un DAF qui accorde une dérogation sur un client bloqué (FR-119) contourne la procédure de déblocage. Une matrice « garde-fou × qui peut passer outre × plafond de montant × trace » unique, en annexe de FR-13.

## M12. La confirmation du consentement et la fenêtre WhatsApp
FR-115 : relances AUTO sur WhatsApp dès J−3. Hors fenêtre de 24 h il faut un gabarit approuvé ; FR-N11 l'exige. Le PRD fait dépendre le recouvrement d'un canal qu'il déclare « bientôt ». Si `notification` n'a que l'e-mail, les relances partent par e-mail au client d'un grossiste qui n'en lit pas. Prévoir SMS comme premier canal de repli et l'écrire dans l'échelle initiale.

## M13. Deux balances âgées contradictoires entre leurs définitions de l'âge
FR-51 : âge depuis l'échéance ; UJ-1 : « Le 30, la balance âgée la classe 31-60 jours » alors que l'échéance est à 30 jours (donc l'âge du jour 30 est 0, non échu). La chronologie du parcours-clé est fausse d'un mois. Corriger UJ-1 (« le 61 », ou changer de tranche).

## M14. Facturation : « Facturer » à la livraison suppose un pont `commande` → `facturation` non écrit
Entre `entrepot.expedition.livree@1` (consommé par `commande`, A.1 C5) et `facturation` (consomme `commande.commande.validee@1` seulement, A.2 C5) il n'y a pas de fait « livrée » pour facturer. Ajouter `commande.bon-livraison.livre@1` aux consommations de `facturation`.

## M15. Deux écrans de réception supprimés, trois owners de la remise d'espèces
`terrain` (FR-105), `paiement` (FR-P33) et `finance-transactions` (FR-136) rapprochent la même remise ; FR-105 dit « superviseur ou comptable », FR-136 « comptable ». Un seul propriétaire, `terrain` pour l'objet, `paiement` pour la validation des encaissements, `finance-transactions` ne fait que l'écriture de caisse.

## M16. Statut des commandes : `PREPARATION` écrit par un autre module
`commande` possède le statut ; `entrepot` change `PREPARATION` (« dès la première ligne servie », FR-68) et `LIVREE` (« quand tous les bons sont LIVRE », FR-36). Sans événement explicite de `entrepot` vers `commande`, le module `commande` n'a que `entrepot.expedition.livree@1` (A.1 C5), pas de fait « préparation commencée ». Statuts dérivés : à lire, pas à écrire.

---

# BASSE

## B1. Dates dans le texte malgré la règle « sans date » : FR-91 (« février 2027 »), FR-131 (« mars 2027 »).
## B2. FR-46 impose 10 ans de conservation et les routes C13 `effacement` : un effacement d'organisation à la résiliation efface-t-il des factures dont la loi exige la conservation ? Préciser l'exception légale.
## B3. Liens WhatsApp/SMS vers un PDF de facture (FR-47) : lien porteur (« bearer ») qui expose NIF et montants. Prévoir signature, expiration courte, journal de consultation.
## B4. FR-90 : la boîte du studio (`studio-social`, `depends: []`) lit le retard de paiement pour interdire la réponse automatique ; aucune dépendance déclarée vers `recouvrement` ou `facturation` en `enrichiPar` (A.6 C1).
## B5. FR-85 : `ca_realise = factures émises HT` sans déduire les avoirs ; l'atterrissage est surévalué en cas de retour massif.
## B6. FR-106/FR-110 : conservation du GPS « à valider » ; un test « 0 position réelle en essai » existe (A.8 C13) mais l'effacement des positions à J+N n'est pas écrit.
## B7. FR-12 : le jeu en essai « n'a aucun mot de passe dans le code » mais le mécanisme de création de comptes de démonstration par organisation d'essai n'est pas décrit (voir K6).
## B8. FR-193 : le catalogue de 36 000 grilles par client (600 × 60) n'est pas dimensionné pour la résolution de prix à la saisie (< 200 ms) ; ajouter une exigence de performance de `catalogue.resoudrePrix`.
## B9. FR-14 / FR-167 : l'identité « alerte » et « décision » partagent un objet mais deux listes de statuts (`À_TRANCHER…` et `OUVERTE…`) ; les écrans DG comptent « alertes critiques » et « décisions » ; préciser si une décision `REPORTEE` redevient alerte.

---

# Synthèse des corrections à faire avant validation (ordre de priorité)

1. Trancher avec le PO : K1 (exposition de crédit), K2 (solde créditeur), K3-K4 (modèle freelance), K7 (livre comptable de février) ; ce sont des décisions, pas du rédactionnel.
2. Réécrire K5 (propriété de la Créance) et lancer l'amendement du PRD `paiement` avec une date.
3. Fixer la coupe du 15/01 (K6, K9) : parcours réellement jouables, mode essai, dépendances.
4. Poser la matrice rôle × droit (E1) et les latences (E17) avant de découper en épics.
5. Nettoyage (E14) et ajout de §6.0 pour la microfinance (E13).
