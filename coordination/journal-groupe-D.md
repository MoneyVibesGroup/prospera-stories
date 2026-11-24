# Journal du groupe D

> Écrit par le groupe D seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §6 (le frontend, jamais commencé). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5 (backend : `reseau-service`, puis le socle du distributeur).**

## État

### Lot 6 (ouvert le 2026-11-24)

- **Plan** : `PLAN-LOT-6-2026-11-23.md` §6 : **STORY-1065 → 1071** (le reste de la plage 1030 → 1079 de D), quatre stories
  d'assurance et trois de distributeur, au backend, les deux verticaux alternés : 1065 (la facture juste (3)), 1066
  (l'avoir), 1067 (la commande (3)), puis 1068 → 1071 (l'assurance : `sinistres` lit `provision.changed@1`,
  `sinistres.evaluation.arretee@1`, l'alerte bloquante, la mission d'expertise). Une sous-session neuve par story
  (`REGLES-DES-GROUPES.md` §1.2). **Dépôts** : ceux du distributeur (comme au lot 4), **plus `prospera-sinistres-service`
  et `prospera-assurance-service`** (D-L6-3 : repris de C, qui écrit sa passation avant 1068 ; la première story
  d'assurance de D la constate). **Même poste que B** (BFF de la console, recette, catalogue, auth, kyc, bilan, balance,
  dossier ; quatre stories sur sept avec une pile complète) : **même verrou Docker**. Avant le 04/12 : la passation à
  Dev A mise à jour (D-L3-6), par 1071.
- **STORY-1065** ✅ 🚚 — la facture juste (3) : les mentions légales, le PDF figé, le lien public d'envoi
  (prospera-ventes-service#13, `dev` 3242844, ca44566, 5929438 ; annonce « ⚠ Contrats » #763 avant le code, manifeste
  `facturation` amendé, C7). Rituel (2026-11-24) : aucune demande neuve à D pour le distributeur dans les journaux de A,
  B et C (la passation de C, D-L6-3, vise 1068).
  - **Les mentions légales** (FR-44, liste de travail jusqu'à A-1) : `facturation_parametres` versionnés (`GET|PUT
    /api/v1/facturation/parametres`, droit neuf `facturation:parametres:modifier`, servi par B : STORY-979) — la fiche de
    l'émetteur saisie par le DAF faute de propriétaire (Q-D-12), quatorze codes de mention (toutes exigées par défaut),
    pénalités, escompte, durée du lien (7 j), conservation (10 ans) ; client et articles lus dans
    `facturation_clients_lus` et `facturation_articles_lus` (futures projections de `pdv` et `catalogue`, remplies par
    personne) ; **`MENTION_OBLIGATOIRE_MANQUANTE` jugée dans la transaction du numéro, aucun numéro consommé** ; mentions
    figées sur la facture (`mentions`, `parametresVersion`).
  - **Le PDF figé** (FR-46, AD-6) : pdfkit 0.19.1 épinglé, Liberation Sans embarquée (OFL, empreintes figées),
    déterministe (dates du document = émission) ; `pdf.etat` `EN_ATTENTE` → `PRODUIT` (`ECHEC` après cinq essais),
    produit après la réponse et par un balayage (2 s) ; octets dans `facturation_pdfs` (écriture majoritaire) avant
    `PRODUIT` ; empreinte vérifiée à chaque lecture (`PDF_ALTERE`) ; `GET …/factures/{id}/pdf`.
  - **Le lien public** (AD-33) : jeton de 128 bits haché, adresse rendue une fois, expiration figée, révocation ; `GET
    /api/v1/facturation/liens-publics/{jeton}` sans compte (statut « route publique » neuf dans l'invariant des routes),
    30 ouvertures par minute et par adresse, chaque ouverture tracée dans la piste.
  - Node 24 : 634 unitaires (63/63 suites), 24 e2e, 171 d'intégration (21 neufs) ; mutations 11/11 (pures) et 9/9
    (MongoDB réel). Pile `grp-d` : `docker compose up` sain, pilote 27/27 (texte du PDF servi lu par `pdfjs-dist`), rejoué
    sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1065-1 → 15 (fiche ; D-1065-15 : la version du manifeste `facturation` monte avec 1066) ; recette
    versionnée `scripts/recette/1065/` ; Q-D-12 au PO. **Verrou Docker tenu par B (1080) de 02:00 à 03:27 ; attendu par
    boucles bornées, pris à 03:27, une seule prise, rendu à 04:09** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1066** 🚚 (l'avoir, `ventes` : `AV-`, `AVOIR_SUPERIEUR_A_LA_FACTURE`, `facturation.avoir.emis@1`, son
    PDF « Avoir » ; **monter le manifeste `facturation` à la source**, D-1065-15).
- **STORY-1066** 🚧 🚚 — l'avoir (`ventes`, module `facturation`) : fiche écrite, annonce « ⚠ Contrats » avant le code
  (cette PR) ; **manifeste `facturation` 1.1.0 à la source** (C7 : + `facturation:avoir:valider` ; D-1065-15). Rituel
  (2026-11-24) : aucune demande neuve à D pour le distributeur dans les journaux de A, B et C (la réponse de B à 1065,
  D-979-7, est celle que D-1065-15 sert ici).

### Lot 4 (ouvert le 2026-11-18)

- **Plan** : `PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4 : **STORY-1060 → 1064**, le distributeur au backend (cinq stories ;
  aucune pile prévue, §1.5 reste) ; une sous-session neuve par story (`REGLES-DES-GROUPES.md` §1.2). Même poste que B, qui
  tient ce lot aussi le backend du cabinet (dix stories, cinq avec pile) : même verrou Docker. **Lot 4 constaté au rituel
  de 1060** (le 2026-11-18) : aucune demande neuve à D dans les journaux de B et C ; celle de A (réponses de
  l'utilisateur à Q-D-1 → 10) est lue (« Réponses aux demandes reçues »).
- **STORY-1060** ✅ 🚚 — un calendrier propre à chaque organisation (prospera-plateforme#32, `dev` 8c61c48, étiquette
  **`calendrier-distributeur-v1`** ; prospera-terrain-service#4, `dev` fd5f4ee, d9b524f, 17bdba7 ; annonce « ⚠ Contrats »
  #681 avant le code, manifeste `terrain` amendé). **Q-D-9 renversée par l'utilisateur, appliquée.**
  - **La règle** (plateforme, `contrats/distributeur/src/calendrier.ts`, copiée à l'octet par `terrain`) : jours
    travaillés ; jours fériés `FIXE` (MM-JJ), `PAQUES` (décalage : lundi de Pâques, Ascension, Pentecôte) et `DATE` ;
    jour ouvré, n-ième jour ouvré (rang 0 = le jour même), jours ouvrés d'une période (pour FR-85). Défaut : lundi →
    samedi, dix jours fériés du Togo (Q-D-11).
  - **Le paramètre** : `terrain_parametres` (AD-12, patron de `commande_parametres`), `GET|PUT /api/v1/terrain/parametres`
    (droit propre `terrain:parametres:modifier`, « → B »), versions immuables, changement tracé.
  - **La résolution à l'import** : chaque plan de journée est daté par le calendrier de l'organisation, lu dans la
    transaction du lot, et garde `parametresVersion` (figé) ; `terrain_parametres` effacé par la route C13.
  - Node 24 : plateforme 634 tests (633 pass, 0 fail) ; `terrain` 348 unitaires, 29 e2e, 23 d'intégration sur MongoDB
    réel ; mutations 16/16 (règle) et 13/13 (`terrain`). Pile `grp-d` : `docker compose up` sain, **21/21** sur appels
    réels (deux organisations, deux calendriers, deux plans différents ; plan figé ; effacement ; témoin intact) ;
    rejouée sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs) : 349 unitaires, 29 e2e, 23 d'intégration, pilote 21/21.
  - Décisions D-1060-1 → 11 (fiche) ; Q-D-11 au PO ; → B (le droit). **Verrou Docker pris à 12:57 sans attente (libre au rituel), une seule prise, rendu à 13:18** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1061** 🚚 (la facture juste (2), `ventes`).
- **STORY-1061** ✅ 🚚 — la facture juste (2) (prospera-ventes-service#10, `dev` 33bd0e7, 29b55a7, 88d50d6, e1d370c,
  68b293c ; annonce « ⚠ Contrats » #689 avant le code). **Q-D-10 répondue, appliquée.** Rituel : aucune demande neuve à D
  dans les journaux de A, B et C.
  - **La suite de Sage, une fois, avant la première facture** : `PUT /api/v1/facturation/numerotation/factures`
    (`facturation:numerotation:administrer`, le DAF ; corps = champs de l'objet de Reprise `facturation.suite-numerotation@1`) ;
    amorçage du compteur, suite, tête `facturation.serie.changed@1` et piste dans une transaction `majority` ; plancher dans
    l'ancre après l'acquittement ; `SUITE_INVALIDE`, `SUITE_DEJA_REPRISE`, `NUMEROTATION_DEJA_ENGAGEE` ;
    `GET /api/v1/facturation/numerotation`.
  - **Le format du numéro** (préfixe, année, séparateur, largeur), lu dans la transaction de l'émission : `FAC-2026-8821`
    ⇒ `FAC-2026-8822` ; `FAC-2026-0412` émise le 01/02/2027 ⇒ `FAC-2027-0413` ; sans suite, rien ne change.
  - **Le règlement lu chez `paiement`** : `paiement.creance.changed@1` projeté (`facturation_creances_lues`, groupe
    `ventes-service.reglements`) ; `reglement` (`INCONNU`, `EMISE`, `PARTIELLE`, `PAYEE`, `CLOTUREE`, en retard) sur chaque
    facture rendue ; la facture ne tient toujours aucun solde.
  - **Deux défauts trouvés par la preuve, corrigés** (D-1061-13) : deux classes `@Schema` `CreanceLue` (commande,
    facturation) sur la même connexion ; la plus haute révision perdue sous concurrence (clé dupliquée de l'upsert).
    Invariant neuf : un nom de modèle par service.
  - Node 24 : 569 unitaires (55/55 suites), 24 e2e, 123 d'intégration ; 19/19 mutations ; Karapace : les deux schémas
    relâchés compatibles BACKWARD (témoin : un motif changé est refusé). Pile `grp-d` : `docker compose up` sain, pilote
    22/22, rejoué sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1061-1 → 13 (fiche) ; recette versionnée `scripts/recette/1061/`. **Verrou Docker pris à 13:47 sans attente (libre au rituel), une seule prise, rendu à 15:07** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1062** 🚚 (la commande (2), `ventes`).
- **STORY-1062** ✅ 🚚 — la commande (2) (prospera-ventes-service#11, `dev` 339a1ad → f49f3a6 ; annonce « ⚠ Contrats »
  #698 avant le code, manifeste `facturation` amendé). Rituel : aucune demande neuve à D dans les journaux de A, B et C.
  - **Le défaut de D-1061-13** (décision du groupe) : prouvé **rouge** sur MongoDB réel au commit du test (339a1ad, avant
    la correction), puis corrigé dans `ProjectionDuCredit.plusHauteRevision` et `CommandesChiffrees.appliquer` comme
    1061 (clé dupliquée rejouée, la révision tenue décide) ; deux tests déterministes le gardent.
  - **`CMD-AAAA-NNNNNN`** tiré dans la transaction de la commande (série `commandes`, tête sur `commande.serie.changed`).
  - **La commande terrain** : canal `TERRAIN` ⇒ `TRANSMISE` ; `PRIX_CHANGE` à la transmission et à la validation,
    confirmé par `prixConfirmes.revision` ; `COMMANDE_PROBABLEMENT_DOUBLE` (paramètre `fenetreCommandeDoubleMinutes`).
  - **L'annulation** : `POST /commande/commandes/{id}/annulation` ; bons `ANNULE` qui gardent leur `BL-` ; engagement
    rendu ; réservations rendues (port `liberer`) ; `commande.commande.annulee@1` ; `facturation` refuse
    `COMMANDE_ANNULEE`.
  - Node 24 : 599 unitaires, 24 e2e, 150 d'intégration ; mutations 5/5 (pures) et 17/17 (MongoDB réel) ; Karapace
    BACKWARD. Pile `grp-d` : `docker compose up` sain, pilote 24/24, rejoué sur les images reconstruites depuis
    `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1062-1 → 13 (fiche) ; recette versionnée `scripts/recette/1062/`. **Verrou Docker pris à 20:39 sans
    attente (libre au rituel), une seule prise, rendu à 21:43** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1063** 🚚 (les référentiels du distributeur côté réseau, `reseau`).
- **STORY-1063** ✅ 🚚 — les référentiels du distributeur côté réseau : le gabarit à zones à plat, les zones et les lieux
  rattachés du jeu « Grossiste du Golfe » (reseau-service#16, `dev` 25de958, c11d990, 4b55ac1 ; prospera-plateforme#36,
  `dev` 26977ca, étiquette **`jeu-grossiste-golfe-v1.1`** ; annonce « ⚠ Contrats » #712 avant le code). Rituel : aucune
  demande neuve à D dans les journaux de A, B et C (l'information de B sur 976, D-976-7, est lue).
  - **Le gabarit** (FR-180) : une donnée de la part du jeu (`hierarchie` : un niveau, libellé « Zone »), appliquée par la
    règle de `PUT /hierarchie/configuration` ; sous lui, une zone sous une zone est refusée `PROFONDEUR_MAX_ATTEINTE`, par
    la route **et par la Reprise** ; un réseau déjà plus profond refuse le gabarit.
  - **Les zones** par le moteur des zones, **sous l'identifiant du jeu** (celui que `commande` et `terrain` portent en
    `noeudId`) : la portée de `reseau` cadre désormais les points de vente du jeu chez `commande`, sans traduction.
  - **Les lieux rattachés** en nombre : chaque point de vente et chaque point de stock (Lomé Port ; Kara dans la taille de
    la démo), sous les identifiants de `commande` ; la résolution et la couverture les lisent ; le client comptoir ne l'est
    pas (FR-241). Rejouer ne double rien ; un lieu rattaché ailleurs voit l'ancien rattachement terminé.
  - **Les routes C13 de `reseau`** (import, effacement de fin d'essai), en essai seulement (`KAFKA_ESPACE=ESSAI`) ; le socle
    C13 copié de `ventes` (Ajv 8 : seul écart) ; un invariant rougit sur toute collection oubliée par le plan.
  - Node 24 : 50/50 suites unitaires (523 tests), e2e 17/17, intégration 16/16 suites (177 tests, 22 neufs) ; plateforme
    647 tests (646 pass, 0 fail), générateur 31/31, `jeu:verifier` 3/3 ; mutations 12/12 (`reseau`) et 6/6 (générateur).
    Pile `grp-d` : `docker compose up` sain, pilote 11/11 (essai) et 2/2 (réel), rejoué sur les images reconstruites
    depuis `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1063-1 → 12 (fiche) ; recette versionnée `scripts/recette/1063/` ; → B (information : `INSTALLATION_SERVICES`
    nommera `reseau` au passage à `v1.1`). **Verrou Docker pris à 22:10 sans attente (libéré par B au rituel), une seule
    prise, rendu à 22:55** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1064** 🚚 (les comptes du bureau dans le jeu « Grossiste du Golfe », plateforme et `ventes` ; le jeu
    est désormais en 1.1.0 : la version suivante sera 1.2.0, ses empreintes à refiger dans `generer.test.mjs`).
- **STORY-1064** ✅ 🚚 — les comptes du bureau dans le jeu « Grossiste du Golfe » (prospera-plateforme#37, `dev`
  50c12a6, étiquette **`jeu-grossiste-golfe-v1.2`** ; prospera-ventes-service#12, `dev` edb3f8f ; annonce « ⚠ Contrats »
  #715 avant le code). Rituel : aucune demande neuve à D dans les journaux de A, B et C (la réponse de l'utilisateur sur
  D-972-9, relayée par A, est celle que cette story sert).
  - **Le fichier des comptes** (`comptes.json`, dans chaque taille : 8, 16, 44 comptes) : le bureau (`compte` :
    `AKOSSIWA` Akossiwa ATTISSO `DIST_COMPTABLE`, `MENSAH` Mensah KPOGO `DIST_RECOUVREMENT`, `YAWA` Yawa AMEDOME
    `DIST_SUPERVISEUR`, `AYITE` Ayité GBADOE `DIST_DG`), puis un compte par agent (`commercial`, `COM-nn`, prénom et nom de
    `terrain`, `DIST_COMMERCIAL` | `DIST_FREELANCE` | `DIST_PROSPECTION`) ; chaque compte est **exactement** le corps de la
    pose d'auth (`{ objet, cle, prenom, nom, roleMetier }`).
  - **Hors des parts, pas encore déclaré** : `jeu-demonstration@1` est fermé, `comptes` est à B (D-1064-4) ; `jeu.json`
    1.2.0 en porte le nombre (`generateur.parametres.comptes`). Les neuf fichiers de données de 1.1.0 inchangés à l'octet.
  - **Une identité** : le compte d'un agent est son commercial de `terrain` (`identifiantDuJeu(org, 'commercial',
    COM-nn)`), dans une zone de `reseau` ; vecteurs figés dans le générateur et dans `ventes` (Kodjo
    `c6e2275ff50ddb28e5cf12c2`, celui d'auth).
  - Node 24 : plateforme `typecheck`, `npm test` **647 tests (646 pass, 1 sauté, 0 fail)**, `generer.test.mjs` **48/48**, `jeu:verifier` 3/3 ; `ventes`
    unitaires **58/58 suites, 602 tests** ; mutations 11/11 (générateur) et 3/3 (règle). Aucune pile (rien qui démarre ne change).
  - Décisions D-1064-1 → 9 (fiche) ; → B (`comptes` dans `jeu-demonstration@1`, la pose par le catalogue). **Verrou
    Docker attendu de 23:20 (B, 975) à 23:27, une seule prise, rendu à 23:32** ; aucun conteneur, volume ni
    réseau `grp-d` ne reste.
- **Le lot 4 de D est fini : 5 stories sur 5 (1060 → 1064)**, le 2026-11-18. Passation à Dev A mise à jour (« Passations »,
  « Ce qui reste », dans l'ordre conseillé). Aucune story de D n'est réservée au-delà ; la suivante viendra du plan
  suivant.

### Lot 3 (ouvert le 2026-11-17)

- **Plan** : `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4 : **STORY-1045 → 1059**, distributeur 🚚 et assurance 🛡 en
  alternance ; une sous-session neuve par story (`REGLES-DES-GROUPES.md` §1.2). Même poste que B, même verrou Docker.
- **STORY-1045** ✅ — `vocabulaires/` et `contrats/distributeur/` dans la plateforme (PR prospera-plateforme#21, `dev`
  baa38dd ; étiquettes `vocabulaires-v1` et `contrats-distributeur-v1`). **Solde D-1042-3.** Aucun fichier de B
  touché : le `test` et le `typecheck` racines lisaient déjà ces dossiers (STORY-941).
- **STORY-1046** ✅ 🛡 — la compagnie de démonstration (PR prospera-assureur-fictif#3, `dev` 626b93e et e265b0a ;
  PR prospera-plateforme#23, `dev` a938c38, étiquette `jeu-assurance-v1`). Le jeu de l'assurance au format
  `jeu-demonstration@1` : `assurance-compagnie-demo` (205 915 enregistrements, produit par `npm run jeu:ecrire`, non
  versionné) et `assurance-compagnie-demo-reduite` (5 180, dans `prospera-plateforme/jeux-demonstration/`) ;
  `jeu:verifier` conforme pour les deux (Node 24). Routes C13 d'import et d'effacement du LC fictif, sous l'identité
  `MOTEUR` seule ; effacement idempotent. Pile `grp-d` : jeu complet importé en 136 s, puis effacé.
  **Passation de `prospera-assureur-fictif` constatée** (voir « Passations »).
- **STORY-1047** ✅ 🚚 — la bibliothèque d'encours (PR prospera-plateforme#24, `dev` b061cec, étiquette
  `encours-v1`). Une seule règle (AD-9, FR-52) : `encours = créances ouvertes + engagement non facturé − crédit du
  tiers`, par `(tiers, périmètre)`, en deux lectures (certain, qui juge ; affiché, déclarés en moins) ; même résultat
  pour la même entrée (720 ordres d'arrivée prouvés) ; `ABSENTE` dite ; plafond jugé strictement. 38 tests, 10 vecteurs
  d'or, 16/16 mutations ; Node 24 : typecheck racine vert, `npm test` racine 550 pass, 0 fail. Contrat `encours@1`
  **annoncé avant la fusion du code** (prospera-stories #589). Aucun fichier de B touché. Décisions D-1047-1 → 12
  (fiche) ; Q-D-4 au PO. Verrou Docker attendu ~44 min (B, STORY-957), puis pris et rendu.
- **STORY-1048** ✅ 🛡 — le LC fictif refuse l'espace réel (PR prospera-assureur-fictif#4, `dev` 4f4aa89 ; annonce
  « ⚠ Contrats » #597 avant le code). L'espace de l'instance fait foi (`INSTANCE_ESPACE`, STORY-934) : `ESSAI` démarre,
  `REEL` ou toute autre valeur refusent même avec `FICTIF_ESPACE=essai`, qui seule démarre comme avant (piles de C).
  Refus avant le chargement des modules : une ligne `ASSUREUR_FICTIF_INTERDIT` (motif nommé), sortie 78. **Défaut
  corrigé** : la remise à zéro laissait relire la sortie de Prospera (anciennes clôtures rejouées, déclarations
  renumérotées) ; elle l'écarte et efface l'entrée. La partie des quatre scénarios `SIN-2026` rejouée après la remise à
  zéro rend les mêmes réponses, par fichiers et par l'API (pile `grp-d`, témoin d'`origin/dev`, rejouée depuis `dev`).
  Node 24 : 419 unitaires + 23 e2e ; 10/10 mutations. Décisions D-1048-1 → 7 (fiche). Verrou Docker pris sans attente,
  rendu.
- **STORY-1049** ✅ 🚚 — les garde-fous de la commande (PR prospera-ventes-service#3, `dev` c8f5fd2 ; annonce
  « ⚠ Contrats » #605 avant le code). **Premier consommateur d'`encours-v1`** : `src/socle/encours/` copié à l'octet
  (empreintes figées par un test, dix vecteurs d'or rejoués). Paramètres de `commande` versionnés par organisation
  (`commande_parametres`, AD-12), l'acte garde sa `parametresVersion` ; plafond jugé sur l'encours certain sous verrou
  par tiers (AD-9) ; échec fermé tant que la Créance n'est pas branchée (`ENCOURS_NON_INSTALLE`) ; squelette de la saga
  (AD-34 : transaction locale, puis `stock` par ligne de bon, reprise sans double réservation). Node 24 : 339
  unitaires, 11 e2e, 32 d'intégration sur MongoDB réel ; 12/12 mutations. Pile `grp-d` (puis rejouée depuis `dev`) :
  `PLAFOND_CREDIT_DEPASSE` sur appel réel, l'acte relu garde sa version 1 après le passage à la version 2. Décisions
  D-1049-1 → 11 (fiche). Verrou Docker pris sans attente (B l'avait rendu), rendu.
- **STORY-1050** ✅ 🚚 — les dettes de `reseau-service` (PR reseau-service#13, `dev` a3d2f59 ; PR #14, `dev` 49c4d01 ;
  annonce « ⚠ Contrats » #613 avant le code). **Soldées : D-1030-2, D-1032-2, D-1034-5.** La garde lit l'état publié
  seul (`etat-publie.changed.<espace>@1`, `garde-etat-publie-v1` copiée à l'octet) ; les droits viennent de
  `GET /moi/droits` (`droits ∪ droitsHorsJeton`, cache 60 s, 503 `DROITS_INDISPONIBLES`) ; la table rôle → droits est
  retirée ; `reseau.commercial.changed@1` est republié quand seul l'état du compte change, dans la transaction du fait
  `identity.*`. Node 24 : 463 unitaires, 17 e2e, 118 d'intégration sur MongoDB réel ; 17/17 mutations. Pile `grp-d`
  (rejouée depuis `dev`, témoin d'`origin/dev`) : refus sur appels réels, droits lus de `/moi/droits`, trois faits du
  commercial lus sur Kafka. Décisions D-1050-1 → 10 (fiche). Verrou Docker pris sans attente (B l'avait rendu), rendu.
  ⚠️ En réel, les routes de `reseau` qui exigent un droit répondent 403 jusqu'à B-960 (« → B »).
- **STORY-1051** ✅ 🛡 — prévenir l'assuré (1) (PR prospera-notification-service#90, `dev` 7d4b24d, cdbcd8a, b3d4388 ;
  annonce « ⚠ Contrats » #620 avant le code). **Premier travail de D dans `notification`** (passation de B constatée).
  Neuf modèles système de l'assurance (`assurance-*`, SMS et e-mail, `fr`/`en`, variables `reference` et
  `numeroOfficiel` seules). Le test des interdits parcourt les 36 textes et rougit sur une variable de santé (registre
  `classification-sante` copié à l'octet), un montant d'indemnité ou « fraude », casse et accents comprises ; une
  surcharge fautive est refusée `CONTENU_INTERDIT_A_L_ASSURE`. Déclenchement par `sinistres.dossier.changed@1` (matrice
  fermée, jamais la fraude), destinataire enregistré par `sinistres-service` (route de service ; sans lui
  `CANAL_ABSENT`). Relances de pièces : file BullMQ, J+5 de la demande puis J+5 de la relance envoyée, trois au plus,
  horloge de référence, identifiants déterministes. Node 24 : 281/281 suites unitaires, intégration Mongo+Redis 9/9,
  15/15 mutations ; e2e : 4 suites rouges **héritées** (identiques sur `dev` avant 1051, voir « Pièges »). Pile `grp-d`
  (rejouée depuis `dev`) : `/health` 200, deux messages sans interdit, relance trop tôt replacée, puis envoyée à J+5
  avec la suivante à J+10. Décisions D-1051-1 → 11 (fiche). Verrou Docker attendu ~1 min (B, STORY-961), rendu.
- **STORY-1052** ✅ 🚚 — les séries hébergées (PR prospera-plateforme#27, `dev` bb6d96c → 1fe8c5e, étiquette
  **`series-v1.1`** ; PR prospera-ventes-service#4, `dev` 32d8b5f, 4782467, dbe3fa6, e4a27c7 ; annonce « ⚠ Contrats »
  #632 avant le code). `series-v1.1` (compatible ; `series-v1` ne bouge pas) : écriture `majority` + `j`, lecture
  `linearizable` ; **ancre en écriture anticipée** hors de la base qu'on restaure (chaque numéro réservé avant d'être
  rendu, confirmé après l'acquittement) ; une base derrière l'ancre a été restaurée : relève au maximum connu, nouvelle
  époque, **trou déclaré** (série, piste d'audit, `SERIE_DERIVE` au journal), jamais comblé ni réémis — à l'émission
  et au démarrage. `ventes` : `NumerotationDesSeries` (émission dans une transaction `majority` avec sa pièce), jeu de
  répliques exigé au démarrage, `GET /api/v1/commande/series`, `docker-compose.heberge.yml` (trois membres porteurs,
  ancre à part). Node 24 : plateforme 574 pass / 0 fail, 12/12 mutations ; ventes 348 unitaires, 11 e2e, 44
  d'intégration sur MongoDB réel, 11/11 mutations. **Pile `grp-d` réelle** (rejouée depuis `dev`) : `mongodump`,
  émissions, `mongorestore --drop` service en marche puis service arrêté : **56 numéros rendus, 56 distincts, aucun
  réémis**, trous 21 → 35 et 41 → 45 déclarés et tracés ; un membre sur trois arrêté : émissions continues ; sans
  majorité : aucun numéro rendu. Décisions D-1052-1 → 14 (fiche). Verrou Docker pris sans attente (B l'avait rendu),
  rendu.
- **STORY-1053** ✅ 🚚 — les 15 rôles appliqués par le serveur, dans les cinq services (PR prospera-plateforme#28,
  `dev` e3727f8, étiquette **`acces-distributeur-v1`** ; ventes #5, `dev` 9e626fa ; terrain #2, `dev` 5b701a8 ;
  recouvrement #2, `dev` 2879924 ; pilotage #2, `dev` faa553a ; croissance #2, `dev` a035e61 ; annonce « ⚠ Contrats »
  #638 avant le code). La règle est une bibliothèque de D dans `contrats/distributeur/src/acces.ts` (dossier déjà lu
  par les scripts racines : **aucun fichier de B touché**), copiée à l'octet dans `src/socle/acces/`, dossier
  identique dans les cinq services. Chaque route d'un module exige un droit de la table d'accès, lu de
  `GET /moi/droits` (`droits ∪ droitsHorsJeton`, cache 60 s, `dv`, `identity.droits.changed@1`) : 403
  `DROIT_INSUFFISANT`, 503 `DROITS_INDISPONIBLES` ; `AUTH_SERVICE_URL` requise. Les cinq services projettent
  `reseau.portee.changed@1` (`socle_portees_reseau`, plus haute révision, échec fermé) et passent
  `conformite-portee-reseau-v1` sur MongoDB réel ; **inscrits au registre de `reseau`** pour leurs treize modules (sur
  la pile). `commande` lit et écrit ses actes dans la portée (`GET /commande/validations`, 404 hors lecture,
  `HORS_PORTEE`), et la marge est **absente** sans `catalogue:marge:consulter`. Paramètres : droit neuf
  `commande:parametres:modifier` (D-1053-7, **→ B**, Q-D-5). Node 24 : tout vert dans les cinq ; mutations 16/16
  (bibliothèque) et 14/14 (`ventes`). Pile `grp-d` (rejouée depuis `dev`, droits dérivés de la table d'auth) : 34/34
  appels conformes ; témoin d'`origin/dev` : `TENANT_ADMIN` sans rôle ouvrait tout. Décisions D-1053-1 → 12 (fiche).
  Verrou Docker pris à 11:05 sans attente (B l'avait rendu), rendu.
- **STORY-1054** ✅ 🛡 — prévenir l'assuré (2) (PR prospera-notification-service#91, `dev` d9de737, e0a50c0 ; annonce
  « ⚠ Contrats » #647 avant le code). **L'accusé de réception est l'accusé de transmission rendu au dossier**
  (D-1054-1 : les accusés que l'assuré reçoit, FR-36 et FR-48, partent depuis 1051) : `GET
  …/service/assurance/dossiers/{id}/messages` rend, par message, la voie, l'état (`EN_COURS`, `TRANSMIS`, `REMIS`, `LU`,
  `NON_REMIS`, `EN_CLOCHE`) et ses dates, jamais l'adresse. **Repli dans la cloche de l'assuré** (boîte du dossier
  tenue par `notification`) : consentement absent ou retiré, pas de destinataire, canal refusé, envoi en échec sans
  maillon restant (signalé par l'`Envoi` via `FinsDeChaine`, à la remise et à l'accusé « échoué ») ; texte SMS passé
  au contrôle des interdits de 1051 ; un dépôt par message. **Consentements par finalité** : `SUIVI_DU_SINISTRE`
  (obligatoire, sans décision possible) et `INFORMATION_DU_DOSSIER` (facultative, le numéro officiel, échec fermé),
  en ajout seul, tracés (qui, quand, version du texte, appelant). Une relance déposée compte comme donnée. Node 24 :
  287/287 suites unitaires ; e2e : les 4 suites rouges héritées identiques au témoin ; intégration Mongo+Redis 15/15 ;
  18/18 mutations. Pile `grp-d` (rejouée depuis `dev`) : `/health` 200, accusé `TRANSMIS`, numéro officiel en cloche
  sans accord et après retrait, SMS en échec déposé `ECHEC_DU_CANAL`, rejeu sans envoi ni dépôt de plus. Décisions
  D-1054-1 → 12 (fiche) ; Q-D-6 au PO ; → C. Verrou Docker pris à 12:38 sans attente, rendu à 13:35.
- **STORY-1055** ✅ 🚚 — l'import réseau par la Reprise (reseau-service#15, `dev` c62f586, 25d236c, 2d3db2a,
  d31f744 ; prospera-plateforme#29, `dev` a458b26, étiquette **`objets-reseau-v1`** ; annonce « ⚠ Contrats » #650 avant
  le code). **Solde D-1041-3.**
  - `reseau` reçoit `reseau.zone@1.0` (zones et hiérarchie par `parent`) et `reseau.commercial@1.0` (la personne à
    inviter, sa zone courante datée), par `kit-cible` 1.0.1 copié à l'octet. Ni agence, ni portée, ni responsable.
  - Routes `reprise/reseau/{org}/objets|controles/{objet}`. Jetons de service `REPRISE`, `CONNECTEURS` et `MOTEUR`,
    admis là seulement ; la garde est celle du kit (état publié, matrice).
  - **Un seul moteur des zones** pour l'import par fichier de 1041 et la Reprise : mêmes règles, mêmes codes, même
    écriture ; portées republiées une fois par transaction ; zone `HISTORIQUE` fermée en fin de transaction.
  - Node 24 : 502 unitaires, 17 e2e, 155 d'intégration sur MongoDB réel ; plateforme 615 pass, 0 fail.
  - **La suite de conformité du kit, telle que publiée : 16/16** (6 cas sans objet, nommés) ; 15/15 mutations.
  - Pile `grp-d`, rejouée depuis `dev` : `SIMULER` n'écrit rien ; un lot fautif est refusé nommé (422) sans trace ;
    `APPLIQUER` importe tout ; un second `APPLIQUER` est identique à l'octet ; le témoin reste intact ; les faits sont
    lus sur Kafka.
  - Décisions D-1055-1 → 13 (fiche) ; → B pour information (D6, la chaîne).
  - **Verrou Docker attendu 69 min** (B, STORY-965, de 13:47 à 14:56), puis pris et rendu à 15:21.
- **STORY-1056** ✅ 🚚 — la commande (1) (PR prospera-ventes-service#6, `dev` 10b8ba5, bf00355, 7221f4c ; annonce
  « ⚠ Contrats » #654 avant le code, avec le manifeste `commande` amendé, C5).
  - **Saisie** `POST /commande/commandes` : le point de vente (nœud, point de stock) et les prix (« ce client », puis
    société ; taux de TVA) sont lus chez `commande` (read-models remplis par personne aujourd'hui) ; portée d'écriture
    (`PDV_HORS_PERIMETRE`) ; HT, TVA par taux sur le total HT, TTC en entiers ; `BROUILLON` ; idempotente.
  - **Validation** `POST /commande/validations` reçoit `{ commandeId }` (forme définitive) : l'acte de 1049, construit
    depuis la commande, la lie dans sa transaction.
  - **Bon `EMIS`** et **`BL-AAAA-NNNNNN`** par `NumerotationDesSeries`, dans la transaction du bon (aucun numéro sans
    bon, aucun bon sans numéro ; numéro unique en base) ; la commande passe `VALIDEE` au dernier bon.
  - **Faits** par l'outbox (`socle_outbox`, patron de `reseau`) : `commande.engagement-tiers.changed`,
    `.bon-livraison.emis`, `.serie.changed`, `.commande.validee` ; schémas au registre (BACKWARD) ;
    `contrats-distributeur-v1` copié à l'octet (`verifierFaitsDuModule` sur les quatre manifestes).
  - Node 24 : 411 unitaires, 16 e2e, 75 d'intégration sur MongoDB réel (20 validations parallèles : 20 numéros
    continus ; trois émissions simultanées d'un bon : un numéro) ; 16/16 mutations.
  - Pile `grp-d`, rejouée depuis `dev` : 16/16 (saisie, validation, `BL-2026-000001`, 403, rejeu sans numéro, plafond,
    12 validations parallèles continues, outbox vidée, faits lus sur Kafka).
  - Décisions D-1056-1 → 13 (fiche). **Verrou Docker pris à 16:01 sans attente** (B l'avait rendu), rendu à 16:36.
- **STORY-1057** ✅ 🛡 — la recette de la démo assurance (PR prospera-assureur-fictif#5, `dev` 51f2639, 9e98f70,
  f9bbea5 ; annonce « ⚠ Contrats » #658 avant le code).
  - **`npm run recette:demo`** joue, par HTTP, contre un LC fictif vivant : la table de l'annexe E extraite du PRD
    (`recette/table-annexe-e.json`, 104 vérifications et 21 refus) et **classée** : **17 lignes dont le LC joue la
    part** (n° 3, 11, 25, 49, 64, 70, 71, 74, 78, 79, 80, 86, 90, 94, 95, 97, 104 : chiffres de référence de
    `SIN-2026-9002` recalculés au franc près — décompte 395 500, recours 276 850 —, réponses du LC à la partie de la
    démo, remise à zéro, partie rejouée), **108 lignes non jouables par le LC seul**, nommées avec leur destination
    (65 → C ; 22 → C et l'écran ; les 21 refus → C). Sortie 0 si la part du LC est verte. Profil compose `recette`.
  - **Les cinq routes de vérification C13** servies (`verification-installation@1`, `MOTEUR` seul, banc en mémoire,
    aucune ne modifie l'organisation) : **reste 1 de 1048 soldé**. **Après un effacement C13, l'organisation est fermée
    à la boîte aux lettres** jusqu'au premier import ou à une remise à zéro : **reste 2 de 1048 soldé** (D-1057-5).
  - Node 24 : 451 unitaires, 30 e2e ; 12/12 mutations (dont une vérification de l'annexe E sabotée). Pile `grp-d` :
    recette verte (17/17, C13 5/5), rejouée, jeu de la démo vert (244 s) ; puis image reconstruite depuis `origin/dev`,
    volumes neufs : verte, rejouée, tables identiques.
  - Décisions D-1057-1 → 9 (fiche) ; Q-D-7 et Q-D-8 au PO ; → C, → A, → B. **Verrou Docker pris à 17:10 sans attente**
    (B l'avait rendu avant 17:00), rendu à 17:45.
- **STORY-1058** ✅ 🚚 — le jeu « Grossiste du Golfe » (prospera-plateforme#30, `dev` d36623b, étiquette
  **`jeu-grossiste-golfe-v1`** ; prospera-ventes-service#7, `dev` 88ee146 → 7f674ef ; prospera-terrain-service#3, `dev`
  cefe9b9, 068e1c0 ; annonce « ⚠ Contrats » #662 avant le code).
  - **Le jeu**, `jeu-demonstration@1`, graine 20270115, trois tailles versionnées (FR-10) : `grossiste-golfe-petit`
    (476 enregistrements), `grossiste-golfe` (la démo de FR-9 : 2 120), `grossiste-golfe-grand` (6 937) ; deux parts,
    **`commande`** (point-de-vente, plafond, prix) puis **`terrain`** (commercial, point-de-vente, plan-de-journee) ;
    générateur sans dépendance dans `jeux-demonstration/grossiste-golfe/generateur/` ; `jeu:verifier` conforme.
  - **Les routes C13** d'import et d'effacement de `commande` et de `terrain` : `MOTEUR` seul, espace d'essai seul
    (`INSTANCE_ESPACE=ESSAI`), corps de `contrats-instance-v1` copiés à l'octet ; `IMPORTE` puis `DEJA_IMPORTE` ;
    `EFFACE` puis `DEJA_EFFACE` ; témoin intact. Un jeton de service ailleurs : 403 `IDENTITE_DE_SERVICE_REFUSEE`.
    Exemption de la table d'accès : `@RoutesDInstance` + `MOTEUR` seul + routes de `routesInstance`, gardée par
    `acces.invariant.spec.ts`.
  - **`reseau` n'a pas de route C13** (D-1058-2) ; ses nœuds et les comptes du jeu prendront les identifiants de
    `identifiantDuJeu` (D-1058-4). Les read-models `commande_points_de_vente`, `commande_plafonds`, `commande_prix`
    sont remplis par l'import ; les sources de l'encours ne le sont pas (une commande à crédit attend 1059).
  - Node 24 : plateforme 616 tests (615 pass, 1 sauté), générateur 25/25 ; ventes 444 unitaires, 24 e2e, 82
    d'intégration ; terrain 341, 24, 15 ; mutations 11/11, 16/16, 10/10.
  - Pile `grp-d` (branches) : ventes 25/25 (une vente du jeu saisie et validée `BL-2026-000001`), terrain 22/22 (Kodjo :
    14 visites au jour 0) ; espace réel 403. Rejeu sur images reconstruites depuis origin/dev (--no-cache, volumes neufs) : ventes 25/25 et espace réel 403 ; terrain
    rejoué depuis origin/dev (`068e1c0`, `--no-cache`, volumes neufs) par la session de 1059 : **22/22**, Kodjo 14 visites
    au jour 0, témoin intact, espace réel 403.
  - Décisions D-1058-1 → 14 (fiche) ; Q-D-9 au PO ; → B. Verrou Docker attendu ~30 min (B, 967), pris à 18:32 ; rendu à B par la session de groupe après le blocage du rejeu de terrain ; aucun conteneur, volume ni réseau grp-d ne reste.
- **STORY-1059** ✅ 🚚 — la facture juste (1) (PR prospera-ventes-service#8, `dev` 1c1e944, 101fbe8, bd8d211 ; annonce
  « ⚠ Contrats » #666 avant le code, avec les manifestes `commande` et `facturation` amendés, C5). **Dernière story du
  lot.**
  - **La facture** (module `facturation`) : `POST /facturation/factures { commandeId }` facture une commande `VALIDEE`
    (option « dès la validation », AD-29 ; la livraison n'existe pas encore) ; la commande est lue sur
    `commande.commande.chiffree@1` (publié par `commande` à la validation), jamais dans son code ; échéance figée par la
    condition de règlement du point de vente (`CONDITIONS_REGLEMENT_MANQUANTES` sinon) ; **`FAC-AAAA-NNNNNN` tiré dans
    la transaction de la facture** ; une facture par commande (clé d'origine `<commandeId>:facture`, index unique) ;
    faits `facturation.facture.emise` et `facturation.serie.changed` par l'outbox (BACKWARD au registre).
  - **La Créance** : `PUT /api/v1/creances/sources/FACTURE/{factureId}` chez `paiement` (B-963), jeton du membre, après
    la transaction ; `paiement` indisponible : la facture existe (`A_OUVRIR`), relance en mémoire tant que le jeton vit,
    rejeu, `POST …/factures/{id}/creance` — même clé, **jamais deux Créances**. La charge de `facturation.facture.emise@1`
    est celle que B attend pour son consommateur (« → B »).
  - **La Créance projetée dans `commande`** : `paiement.creance.changed@1` (plus haute révision, trop-perçu = crédit du
    tiers) ; **les sources de l'encours sont branchées au premier fait de l'organisation : fin d'`ENCOURS_NON_INSTALLE`**,
    la commande à crédit est jugée sur l'encours ; l'engagement baisse à la Créance de sa facture, une fois, dans les deux
    ordres (AD-9).
  - Node 24 : 506 unitaires (52/52 suites), 24 e2e, 98 d'intégration sur MongoDB réel (10 émissions concurrentes : une
    facture, un numéro) ; 16/16 mutations ; Karapace : 7 sujets BACKWARD.
  - **Pile `grp-d` avec le vrai `paiement` construit depuis `origin/dev` (`ad35786`)** : 30/30 (Créance relue par l'API de
    paiement, rejeu, 8 émissions concurrentes, paiement arrêté puis relancé : Créance ouverte 2 s après son retour, sans
    doublon ; projection, jugement sur l'encours, `PLAFOND_CREDIT_DEPASSE`) ; rejoué sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs) : 30/30, deux fois ; 16/16 mutations rejouées.
  - **Reste de 1058 joué** : `terrain` sur l'image d'`origin/dev` (`068e1c0`, `--no-cache`, volumes neufs) : 22/22, espace
    réel 403.
  - Décisions D-1059-1 → 12 (fiche) ; Q-D-10 au PO ; → B (consommateur de `facturation.facture.emise@1`). **Verrou Docker
    pris à 22:37 sans attente (B l'avait rendu), une seule prise, rendu à 23:29** ; aucun conteneur, volume ni réseau
    `grp-d` ne reste.
  - **Recette versionnée** (à la demande de l'utilisateur, le 2026-11-17) : `prospera-ventes-service/scripts/recette/1059/`
    (PR ventes#9, `dev` 2453485), avec la pile, l'émetteur de jetons, le pilote et le `README.md` qui explique comment la
    rejouer. Avant, ces scripts n'existaient que dans un dossier temporaire du poste.
- **Le lot 3 de D est fini : 15 stories sur 15 (1045 → 1059)**, le 2026-11-17. Passation à Dev A mise à jour en entier
  (« Passations »), avant le 04/12 (D-L3-6). Suivantes du distributeur, hors lot : la facture juste (2), la commande (2),
  les remplaçantes d'EPIC-227.

### Lots 1 et 2

- **2026-11-14** : journal ouvert, lot 1 pas encore commencé.
- **2026-11-16** : lot 2 lancé par l'utilisateur (« prends le lot 2 du groupe D et tu fais toutes les stories de ce
  lot »). La session tourne sur un poste à part (`C:\Users\USER\…`), pas sur le poste principal de A et C.
  - **STORY-1030** ✅ — le squelette de `reseau-service` (PR reseau-service#1, `dev` 80a4a29 ; `main` dc44bbf).
  - **STORY-1031** ✅ — gate complète (KYC), read-models KYC et identité, cloisonnement par le jeton, outbox
    transactionnelle (PR reseau-service#2, `dev` 64537b1).
  - **STORY-1032** ✅ — zones et agences, codes jamais réattribués, fermeture refusée et nommée, montants entiers,
    droits du module (PR reseau-service#3, `dev` e96d5da).
  - **STORY-1033** ✅ — hiérarchie récursive, 3 → 4 niveaux par configuration, anti-cycle, déplacement sur compte
    rendu (PR reseau-service#4, `dev` 2ddbebd).
  - **STORY-1034** ✅ — affectations datées, responsable unique, commerciaux et état de leur compte (PR
    reseau-service#5, `dev` 3ff9958).
  - **STORY-1035** ✅ — modèle de portée, héritage, gouvernance, journal avant/après (PR reseau-service#6, `dev`
    b12a988).
  - **STORY-1036** ✅ — `reseau.portee.changed@1` publié (PR reseau-service#7, `dev` 17dcf14) : **jalon du 27/11 tenu
    le 16/11**.
  - **STORY-1037** ✅ — suite de conformité (étiquette `conformite-portee-reseau-v1`) et registre des consommateurs
    (PR reseau-service#8, `dev` 91b7f63).
  - **STORY-1038** ✅ — redécoupage versionné, période passée restituée avec sa version (PR reseau-service#9, `dev`
    a8a047a).
  - **STORY-1039** ✅ — rattachements et résolution (PR reseau-service#10, `dev` 9117794).
  - **STORY-1040** ✅ — couverture, zones blanches, candidats (PR reseau-service#11, `dev` 98ed21c).
  - **STORY-1041** ✅ — import tout ou rien, journal lisible, vérifications du manifeste (PR reseau-service#12, `dev`
    5922180). **`reseau-service` : les douze stories du lot sont livrées.**
  - **STORY-1042** ✅ — socle de `prospera-ventes-service` (PR #1, `dev` 80c2cfb) ; **reste** : `vocabulaires/` et
    `contrats/distributeur/` dans la plateforme (D-1042-3).
  - **STORY-1043** ✅ — terrain, recouvrement, pilotage, croissance (PR #1 de chacun).
  - **STORY-1044** ✅ — bibliothèque `series` (plateforme #14, étiquette `series-v1`), copiée et éprouvée dans ventes.
  - **Le lot 2 de D est fini : 15 stories sur 15** (1030 → 1044), le 2026-11-16.

## Dépôts tenus

- Distributeur (lot 2) : `prospera-ventes-service` (3412), `prospera-terrain-service` (3413),
  `prospera-recouvrement-service` (3414), `prospera-pilotage-service` (3415), `prospera-croissance-service` (3416).
- `prospera-plateforme` : `series/` (`series-v1`, **`series-v1.1`** depuis STORY-1052), `vocabulaires/` (`vocabulaires-v1`), `contrats/distributeur/`
  (`contrats-distributeur-v1` ; **`acces-distributeur-v1`** depuis STORY-1053, `src/acces.ts`) ; **lot 3** : `encours/` (inscrit au README par B-956) ;
  `contrats/objets/reseau/` (module `reseau`, README ; **`objets-reseau-v1`** depuis STORY-1055) ;
  `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/` (avec son générateur), `grossiste-golfe-grand/`
  (**`jeu-grossiste-golfe-v1`** depuis STORY-1058) ; **lot 4** : `contrats/distributeur/src/calendrier.ts`
  (**`calendrier-distributeur-v1`** depuis STORY-1060).
- **`prospera-assureur-fictif`** (lot 3, reçu de C, passation constatée le 2026-11-17 au rituel de 1046) : port 3411,
  profil `assureur-fictif`, « Rebase and merge » seul ; dans `prospera-plateforme`, le jeu
  `jeux-demonstration/assurance-compagnie-demo-reduite/` (étiquette `jeu-assurance-v1`). Le générateur reste dans le
  dossier de C (`contrats/assurance/demo/generateur.ts`), copié à l'octet.
- **`prospera-notification-service`** (lot 3, reçu de B à la fusion de B-957, passation constatée le 2026-11-17 au
  rituel de 1051) : port 3008, compose racine du poste (`notification-service`, `mongo-notification`, `kafka`, `redis`,
  `mailhog`).

- `reseau-service` (lot 2) : `main` et `dev` posées le 2026-11-16 ; port de développement **3419** ; piles Docker
  `grp-d`.
- À venir : `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`,
  `prospera-pilotage-service`, `prospera-croissance-service` (à créer par l'utilisateur) ; dans `prospera-plateforme` :
  `series/`, `vocabulaires/`, `contrats/distributeur/`.
- Lot 1 (frontend) : rien n'a été écrit ; `frontend-admin-panel` n'est tenu par personne pendant le lot 2.

## Passations

- **← B, `prospera-notification-service`, constatée par D au rituel de 1051, `dev` 5e6c553** (2026-11-17, D-L3-3). Au
  rituel : aucune PR ouverte, dernier commit sur `dev` = celui de la passation (MNV-957), checkout propre. Repris de la
  passation : Node 24 (`verification`) seulement pour les tests du client de Confluent ; AC-5 refuse toute minuterie ;
  sonde `/api/v1/health` ; ouvert : la vérification des sorties d'essai avant envoi (STORY-951), la bascule de la garde
  sur l'état publié seul, les canaux sms, whatsapp et push sans adaptateur configuré sur la pile, le résidu de 957
  (7,5 s au redémarrage sans Kafka).
- **← C, `prospera-assureur-fictif`, constatée par D au rituel de 1046, `dev` 78ad10c** (2026-11-17, plan du lot 3
  §5). C n'avait pas écrit sa passation (« Passations : aucune ») ; au rituel : aucune PR ouverte, dernier commit sur
  `dev` du 2026-11-16 (MNV-987). C est actif ailleurs (sinistres, 1001 → 1002), pas sur ce dépôt.
- **→ Dev A (mise à jour complète le 2026-11-17, à la fin du lot 3 ; D-L2-5, D-L3-6 : avant le 04/12) : le distributeur,
  et ce que D tient d'autre.** La synthèse d'abord, puis le détail par sujet (les sous-points qui suivent).
  - **Dépôts tenus par D** : `reseau-service` (3419), `prospera-ventes-service` (3412 : `commande`, `facturation`,
    `approvisionnement`, `entrepot`), `prospera-terrain-service` (3413 : `terrain`, `conquete-objectifs`),
    `prospera-recouvrement-service` (3414), `prospera-pilotage-service` (3415), `prospera-croissance-service` (3416),
    `prospera-assureur-fictif` (3411, reçu de C), `prospera-notification-service` (3008, reçu de B) ; dans
    `prospera-plateforme` : `series/`, `vocabulaires/`, `contrats/distributeur/`, `encours/`, `contrats/objets/reseau/`,
    `jeux-demonstration/grossiste-golfe*/` et `assurance-compagnie-demo-reduite/`. Étiquettes : `series-v1`,
    `series-v1.1`, `vocabulaires-v1`, `contrats-distributeur-v1`, `acces-distributeur-v1`, `encours-v1`,
    `objets-reseau-v1`, `jeu-grossiste-golfe-v1`, `jeu-grossiste-golfe-v1.1`, `jeu-grossiste-golfe-v1.2`,
    `calendrier-distributeur-v1`, `jeu-assurance-v1`, `conformite-portee-reseau-v1`. Fusion en « Rebase
    and merge » seulement ; branches `MNV-<n>` depuis `origin/dev` ; Node 24 pour les tests du client Kafka de Confluent
    (étage `verification` des Dockerfile).
  - **Livré** : lot 2 (1030 → 1044 : `reseau-service` complet, les cinq squelettes, `series-v1`) ; lot 3 (1045 → 1059) :
    vocabulaires et catalogue des faits, encours, garde-fous et plafond, séries hébergées sans perte, les 15 rôles dans
    les cinq services, la Reprise réseau, la commande (1), le jeu « Grossiste du Golfe » et ses routes C13, **la facture
    juste (1)** ; côté assurance : compagnie de démonstration, LC fictif refusé en réel, sa recette, prévenir l'assuré (1)
    et (2). Détail et SHA : « État », plus haut.
  - **Mise en service d'un client qui quitte Sage** (réponse de l'utilisateur à Q-D-10, 2026-11-18) : la reprise du
    dernier numéro de facture (`facturation.suite-numerotation@1`, EPIC-244) se pose **avant sa première facture** ; à
    la liste de mise en service du distributeur de février.
  - **Le calendrier de l'organisation** (STORY-1060, lot 4 ; `terrain` `dev` 17bdba7, plateforme `8c61c48`) : la règle
    est `prospera-plateforme/contrats/distributeur/src/calendrier.ts` (`calendrier-distributeur-v1`), copiée à l'octet dans
    `terrain/src/socle/calendrier/` (empreinte dans `src/calendrier.invariant.spec.ts`) ; `pilotage` la copiera pour
    compter les jours ouvrés du mois (FR-85) et lira le calendrier de `terrain` (route ou fait à ajouter, D-1060-10). Le
    paramètre est `terrain_parametres` (`src/modules/terrain/parametres/`) : les distances et le géorepérage de `terrain`
    (AD-12) s'y ajoutent comme clés de plus (valeurs complètes à chaque version). Un plan de journée garde
    `parametresVersion` ; un plan créé ailleurs qu'à l'import (EPIC-233) se datera par `dateDuPlanDeJournee`.
  - **Ce qui reste, dans l'ordre conseillé** : (1) ~~la facture juste (2)~~ **livrée par 1061** (suite de Sage, format,
    `PARTIELLE`/`PAYEE`) ; ~~la facture juste (3)~~ **livrée par 1065** (mentions légales en paramètre, PDF figé, lien
    public d'AD-33 ; reste l'envoi par `notification`, D-1065-14) ; puis, dans l'ordre de D-1061-12 : l'avoir ; la facture par livraison et `SANS_BON` (après la commande (2)) ;
    la liste des factures et les balances ; (2) ~~la commande (2)~~ **livrée par 1062** (`CMD-`, `TRANSMISE`, annuler) ;
    **la commande (3)** et suivantes, dans l'ordre de D-1062-12 : modifier, livraison et reliquat (avec `entrepot`, puis la
    facture par livraison), allocation du matin, remise, dérogation ; détail plus bas, « La commande (2) » ; (3) ~~les remplaçantes d'EPIC-227~~
    **la tranche de `reseau` livrée par 1063** (gabarit à zones à plat, zones et lieux rattachés du jeu, routes C13) ;
    restent, dans `reseau`, les commerciaux du jeu, le consommateur de `pdv.point-de-vente.changed@1`, les faits
    d'entrepôt de `stock`, l'export et la santé C13 (D-1063-12) ; **(3 bis) avant que la démo se joue : les portées des
    comptes du jeu dans `reseau`** (D-1064-8 ; un objet de plus dans la part `reseau`, 1.3.0) : chaque agent → sa zone,
    Yawa → `LOME-CENTRE`, Ayité, Akossiwa, Mensah → `TOTALE` ; sans elles, un compte du jeu ne voit aucun point de vente
    (échec fermé) ; avec elles, les commerciaux du jeu dans `reseau` (même identité que leur compte) ; puis, quand B aura
    `comptes` dans `jeu-demonstration@1`, **déclarer `comptes.json` dans `jeu.json`** (D-1064-4) ; (4) les consommateurs qui
    rempliront les read-models aujourd'hui remplis par personne (`pdv`, `catalogue`, `stock`) ; (5) les routes C13 de
    `facturation`, `approvisionnement`, `entrepot`, `conquete-objectifs` ; (6) les dettes héritées de `notification`
    (4 suites e2e rouges). Les restes nommés par story, dans les fiches : D-1061-12 (la facture), D-1062-12 (la
    commande), D-1063-12 (`reseau`), D-1064-9 (les comptes du jeu).
  - **Demandes ouvertes chez les autres groupes** (détail dans « Demandes aux autres groupes ») : **chez B** — le jeu
    « Grossiste du Golfe » (README, `INSTALLATION_SERVICES` avec `commande` et `terrain`, comptes du jeu : STORY-972
    annoncée), **le consommateur de `facturation.facture.emise@1`** (charge fixée par 1059), le crédit du tiers (2)
    (`paiement.credit-tiers.changed@1`) ; **chez C** — la part Prospera de l'annexe E et trois écarts du générateur
    (documents C-10, noms, garantie de 9002), l'enregistrement du destinataire de l'assuré (1051), les consentements et
    l'accusé (1054), la suite de conformité de la portée pour `sinistres` (C-1004) ; **chez A** — assembler la recette de
    la démo assurance (information).
  - **Questions au PO, avec le choix retenu par défaut** (détail dans « Questions à l'utilisateur ou au PO ») : Q-D-4
    (encours certain pour le plafond), Q-D-5 (`commande:parametres:modifier`, DG et `DIST_ADMIN`), Q-D-6 (seul le numéro
    officiel est facultatif à l'assuré), Q-D-7 (la recette lit la personne par son rôle), Q-D-8 (`objets-de-l-annexe-c`
    vert sans documents), Q-D-9 (dimanche chômé, samedi travaillé), **Q-D-10** (la série `FAC-` démarre à 0 sans reprise
    de Sage).
  - **Pièges** : la section « Pièges rencontrés » (par story, la plus récente d'abord). À lire avant tout : le verrou
    Docker du poste et les commandes courtes (1058-5, 1055-2), les fins de ligne et `git archive` (§1.7), les mutations
    qui rougissent sur une compilation (1053-2, 1058-2, 1059-1), `--load` au `docker build` (1056-1), Karapace qui
    répond 500 juste après `healthy`, `pino-pretty` absent de l'image `runtime` (1052-2, 1058-1).
  - Le détail, sujet par sujet :
  - `reseau-service` complet pour le lot (EPIC-044 → 053) : `dev` 5922180 ; contrat `reseau.portee.changed@1` publié
    et au registre ; suite de conformité `conformite-portee-reseau-v1` ; C-1004 est le premier consommateur attendu.
  - Les cinq services du distributeur en squelette (garde par module, profil, manifestes, piste d'audit chaînée,
    aucun import croisé) : ventes 3412, terrain 3413, recouvrement 3414, pilotage 3415, croissance 3416.
  - `prospera-plateforme/series/` : `series-v1` (STORY-1044) et **`series-v1.1`** (STORY-1052, `dev` 1fe8c5e),
    copiée dans ventes (`src/socle/series/series.ts`, empreinte `68833b1a…` figée par `src/series.invariant.spec.ts`).
    **Les séries hébergées** (STORY-1052) :
    - **Émettre un numéro** = `NumerotationDesSeries.emettreDansUneTransaction(module, organisationId, serie,
      travail)` : la transaction (`majority`) porte le numéro ET la pièce que `travail` écrit avec la session ; le
      numéro est confirmé dans l'ancre après l'acquittement ; une transaction périmée (`SERIE_INSTABLE`) est rejouée.
      **1056** l'emploie pour `BL-` (série `bons-livraison`, déclarée par `SeriesDeCommande`) ; `facturation`
      déclarera ses séries de même (`declarer('facturation', { … })`). Ne jamais tirer un numéro hors d'elle.
    - **L'hébergé est une configuration** (AD-26) : `SERIES_ANCRE_URI` (l'ancre, une base **hors** de celle du
      service ; en production, celle de la plateforme Money Vibes), `MONGODB_MEMBRES_PORTEURS_MIN=3` ; sans elles, le
      service se comporte comme `series-v1` et le dit (`SERIES_SANS_ANCRE`). Profil de pile :
      `docker-compose.heberge.yml`.
    - **Une restauration se voit seule** : au démarrage (avant d'écouter) ou à l'émission, la série est relevée au
      maximum de l'ancre, le trou est déclaré (`GET /api/v1/commande/series`), tracé dans `commande_audit` et signalé
      `SERIE_DERIVE` au journal (l'alerte d'AD-32, à brancher sur la supervision). Le résidu (une panne entre
      l'acquittement et la confirmation, puis une restauration) est écrit dans la fiche (D-1052-6).
    - Reste : publier `commande.serie.changed@1` (1056, avec le manifeste), remettre chaque jour la tête à l'agent
      (EPIC-148, B), brancher l'alerte `SERIE_DERIVE` sur la supervision du moteur (AD-40) ; la route de recette
      (`SERIES_EMISSIONS_DE_RECETTE`, jamais en production) sert les recettes de restauration.
  - `prospera-plateforme/vocabulaires/` (`vocabulaires-v1`) et `contrats/distributeur/` (`contrats-distributeur-v1`),
    STORY-1045, `dev` baa38dd : le vocabulaire par verticale et la garde du catalogue des faits d'AD-20. **Aucun
    service ne les copie encore** : chacun les copie à l'octet (empreintes dans `stories/STORY-1045.md`) avec sa
    première story qui affiche un libellé ou publie un fait, et rejoue `verifierFaitsDuModule` sur la clause C5 de
    chacun de ses manifestes. Les 13 faits « nouveaux » d'AD-20 manquent encore aux manifestes (PR d'AD-27).
  - ~~`vocabulaires/` et `contrats/distributeur/` dans la plateforme (D-1042-3)~~ : **soldé par STORY-1045**.
  - `prospera-plateforme/encours/` (`encours-v1`, STORY-1047, `dev` b061cec) : **la seule règle de calcul de
    l'encours** (AD-9), pour `commande`, `pdv` et `recouvrement`. **`ventes` la copie depuis STORY-1049**
    (`src/socle/encours/`, empreintes figées par `src/encours.invariant.spec.ts`, vecteurs d'or rejoués) ; `pdv` et
    `recouvrement` la copieront de même. Ce qui en est exclu et pourquoi : D-1047-3. Reste à y ajouter, en `1.x`, l'exclusion du
    montant dérogé pour l'évaluation du blocage (avec la story de `recouvrement`). La correspondance avec les faits de
    B-963 et B-965 est **faite par 1059**, chez le consommateur (`src/modules/commande/credit/faits-lus.ts`).
  - ~~Le volet Reprise de l'import réseau (D-1041-3)~~ : **soldé par STORY-1055** (`dev` c62f586 → d31f744) :
    - **la cible** : `src/modules/reseau/reprise/`, sur `src/vendor/kit-cible/` (`kit-cible-v1.0.1`, empreintes dans
      `src/reprise.invariant.spec.ts`). Pour passer à une version suivante du kit, recopier toute la distribution à la
      nouvelle étiquette (`git -c core.autocrlf=false show`), refiger les empreintes, puis rejouer
      `test/integration/reprise-conformite.int-spec.ts` sans y toucher ;
    - **les schémas** : écrits dans `prospera-plateforme/contrats/objets/reseau/` (`objets-reseau-v1`, `a458b26`).
      Une mineure (`zone@1.1`) se publie là, s'étiquette, puis se recopie dans `reprise/objets/` avec `ORIGINE.json` ;
    - **le moteur des zones** (`import/moteur-des-zones.ts`, `regles-des-zones.ts`) est le seul chemin d'une zone en
      nombre. Un redécoupage ou un import futur passe par lui ;
    - restent hors de la reprise : agences (avec la microfinance), portées (AD-8), responsable, affectations antérieures
      (une mineure `commercial@1.1`), déplacement ou fermeture d'une zone existante (actes de Prospera) ;
    - pour la Reprise (`reprise-service`) : un lot par sorte d'objet, car la version vaut par `lotId` (D6 du kit). Les
      zones partent avant les commerciaux, le parent avant l'enfant.
    ~~D-1034-5, D-1032-2, D-1030-2~~ : **soldées par STORY-1050** (`dev` a3d2f59, 49c4d01) :
    - la garde de `reseau` lit l'état publié seul (`src/socle/etat-des-modules/`, projection `socle_etats_publies`,
      copie `src/vendor/garde-etat-publie/` à `garde-etat-publie-v1`) ; `socle_etat_des_modules` (ancienne projection
      d'`entitlement.changed`) n'est plus lue : la supprimer d'une base existante est sans risque ;
    - les droits viennent de `/moi/droits` (`src/socle/droits-du-membre/`, `AUTH_SERVICE_URL` requise) ; aucune table
      de rôles dans le service ; **1053** n'aura qu'à vérifier que la table d'accès de B-960 rend les cinq `reseau:*`
      aux bons rôles (rien à coder côté garde) ;
    - le commercial suit son compte (`personnes/comptes-des-commerciaux.ts`, suites inscrites dans
      `socle/identite/suites-de-l-identite.ts`) ; `comptePublie` retenu sur la fiche ;
    - la doublure de recette de `/moi/droits` est dans l'émetteur du profil `recette` (revendications
      `droitsDeRecette`, `droitsHorsJetonDeRecette`).
  - Outils : banc HTTP d'intégration sur MongoDB réel (`test/integration/application-http.ts`), émetteur de jetons de
    recette (profil compose `recette`), Karapace (profil `registre`).
  - **Assurance (lot 3), pour mémoire** : D tient aussi `prospera-assureur-fictif` (la démo, EPIC-204), qui n'est pas
    du distributeur ; le jeu de l'assurance et les routes C13 y sont depuis STORY-1046, le refus de l'espace réel
    (`INSTANCE_ESPACE`, sortie 78) et la remise à zéro qui rejoue les quatre scénarios depuis STORY-1048 (`dev`
    4f4aa89) ; la recette de la démo (`npm run recette:demo`, table de l'annexe E classée), les cinq routes de
    vérification C13 et la boîte aux lettres fermée après un effacement depuis STORY-1057 (`dev` f9bbea5). Ce qui
    reste à l'assurance de D : rien d'ouvert dans le dépôt ; les demandes à C (documents C-10, noms, garantie de 9002)
    changent le générateur de C, que D recopie alors à l'octet (empreinte du jeu à refiger).
  - **Les garde-fous de `commande`** (STORY-1049, `ventes` `dev` c8f5fd2), `src/modules/commande/garde-fous/` :
    - paramètres versionnés (`commande_parametres`, une version immuable par changement, la première écrite à la
      première lecture) ; changés par `TENANT_ADMIN` jusqu'à 1053 ; un acte garde sa `parametresVersion` ;
    - le crédit se lit par le port `SourcesDuCredit` dans des read-models **remplis par personne aujourd'hui** :
      `commande_plafonds` (projection future de `pdv.plafond.changed@1`, avec `suspendu` = crédit bloqué, **toujours
      remplie par personne** hors du jeu C13), `commande_creances`, `commande_credits_tiers` et
      `commande_sources_encours` : **remplis depuis 1059** par le consommateur de `paiement.creance.changed@1` (sans
      Créance projetée pour l'organisation, la source reste `ABSENTE` et la commande à crédit est refusée
      `ENCOURS_NON_INSTALLE`) ;
    - ~~l'acte reçoit la commande dans son corps (squelette, D-1049-9)~~ : **soldé par 1056** (voir « La commande (1) »
      plus bas) ;
    - l'adaptateur de `stock` est `ReservationStockNonBranchee` (motif `RESERVATION_NON_BRANCHEE`) tant que l'API de
      réservation de `stock` n'existe pas ; la projection des droits garde le voisin `stock` (`MODULES_VOISINS`).
  - **`prospera-notification-service` (reçu de B, lot 3), pour mémoire** : D y porte la communication de l'assurance
    (EPIC-220), pas du distributeur. Depuis STORY-1051 (`dev` b3d4388) : `src/domain/assurance/` (matrice statut →
    message, interdits, relances), `src/modules/assurance/` (consommateur de `sinistres.dossier.changed@1`, groupe
    `notification-assurance` ; route de service du destinataire, `sinistres-service` seul), file
    `notification:relances-pieces` (`adapters/bullmq/relances-pieces-*.ts`), neuf modèles `assurance-*` au socle,
    copie `src/vendor/classification-sante/` (à recopier et refiger si C change son registre). Depuis STORY-1054 (`dev`
    e0a50c0) : `assurance_messages` (journal des messages de l'assuré : voie, accusé calculé des `Envoi`, cloche),
    `assurance_consentements` (actes en ajout seul, deux finalités), `MessagesAssureService` (tout message de
    l'assurance y passe : relances comprises), `FinsDeChaine` dans `envois` (l'assurance s'y inscrit ; un autre module
    peut le faire), trois routes de la même porte de service (`sinistres-service` seul). Reste : WhatsApp et ses
    modèles approuvés (D-1054-12), le courrier avec preuve, un fait d'accusé poussé si C le demande, l'effacement des
    destinataires de l'assuré par les droits des personnes (dette de 1051, toujours ouverte).
    Dettes héritées : 4 suites e2e rouges (voir « Pièges ») ; ouvert de la passation de B (vérification des sorties
    d'essai, bascule de la garde sur l'état publié seul).
  - **L'accès des cinq services** (STORY-1053, EPIC-223) :
    - **la règle** : `prospera-plateforme/contrats/distributeur/src/acces.ts` (`acces-distributeur-v1`, e3727f8),
      copiée à l'octet dans `src/socle/acces/acces-distributeur.ts` de chaque service (empreinte dans
      `src/acces.invariant.spec.ts`) ; le dossier `src/socle/acces/` est **le même dans les cinq** : une évolution se
      fait dans `ventes`, puis se recopie dans les quatre autres (vérifier avec `diff -r`) ;
    - **une route neuve** déclare `@ExigeDroit('<droit du manifeste>', …)` (l'un suffit) ou `@ExigeUnDroitDuModule()` ;
      sinon `src/acces.invariant.spec.ts` rougit. Les droits viennent de `/moi/droits` ; jamais de `roles`,
      `perms[]` ou `roleMetier` ;
    - **la portée** : `PorteesDesMembres.portee(org, userId, 'LECTURE'|'ECRITURE')` (échec fermé), ou
      `.condition(org, userId, sorte, '<champ du nœud>')` à **ajouter** à la condition d'organisation ; lecture hors
      portée ⇒ 404, écriture ⇒ 403 `HORS_PORTEE` (patron : `commande`, `garde-fous.service.ts`) ; les douze autres
      modules l'appliqueront avec leur première route de données ;
    - **une donnée privée** : la déclarer dans les champs privés du module (`ChampsPrives`, patron
      `commande/garde-fous/donnees-privees.ts`) : elle est retirée de la réponse (clé absente) et sa consultation
      journalisée (`DONNEE_PRIVEE_SERVIE`) ;
    - **recette** : l'émetteur de jetons de 1053 dérive les droits de chaque rôle de
      `auth-service/src/modules/rbac/table-d-acces-distributeur.ts` (scripts décrits dans la fiche) ; un vrai
      auth-service se branche par `AUTH_SERVICE_URL` et `AUTH_JWKS_URI`.
  - **La commande (1)** (STORY-1056, `ventes` `dev` 10b8ba5 → 7221f4c), `src/modules/commande/commandes/` :
    - **la saisie** (`commandes.service.ts`) lit le point de vente dans `commande_points_de_vente` et les prix dans
      `commande_prix` : **personne ne les remplit encore**. Les consommateurs de `pdv.point-de-vente.changed@1` (nœud,
      point de stock source) et de `catalogue.grille.publiee@1` (prix « ce client » et société, unité, **taux de TVA du
      paquet fiscal**, version de grille) sont à écrire quand `pdv` et `catalogue` publieront ; sans document,
      `POINT_DE_VENTE_INCONNU` ou `ARTICLE_SANS_PRIX` (échec fermé) ;
    - **la validation** : `CommandesDuModule.valider` construit l'acte depuis la commande (`entreeDe`, déterministe) et
      appelle `GardeFousDeCommande.valider` avec `dansLaTransaction` (le lien de la commande) ; l'engagement part dans
      l'outbox de la même transaction ;
    - **l'émission** (`emission-des-bons.service.ts`) : seul chemin d'un numéro `BL-`. Elle tourne après la réservation
      (validation) et après la reprise ; un bon déjà émis annule la transaction (le numéro n'est pas engagé) ;
    - **les transitions** sont une donnée (`transitions.ts`, `transitions-commande@1`) : la commande (2) y ajoute ses
      routes sans changer la table (ou publie une v2 que les commandes neuves portent) ;
    - **l'outbox** est au socle (`src/kafka/outbox/`) : un module neuf (`facturation`) déclare son énumération de
      topics dans `topics.ts`, ses schémas dans `contrat/schemas/`, et l'invariant `contrats-distributeur.invariant`
      exige le manifeste et le catalogue ;
    - **recette** : `COMMANDE_RESERVATION_STOCK=recette` (refusé en production) réserve tout ; la surcouche de pile
      (émetteur de jetons, Karapace) et le script de recette sont décrits dans la fiche ;
    - **reste (la commande (2), remplaçante)** : `TRANSMISE` (terrain, WhatsApp transmis, `PRIX_CHANGE`,
      `COMMANDE_PROBABLEMENT_DOUBLE`) ; modifier, annuler (delta de réservation, bons `ANNULE` qui gardent leur numéro,
      historique) ; remise et décision ; dérogation au plafond et son fait ; numéro `CMD-` ; `commande.commande.chiffree@1`,
      `.changed@1`, `.annulee@1` ; marge (coût de `stock`) ; livraison et reliquat (`livre@1`) ; allocation du matin ; PDF
      du bon ; alertes à N jours ; les consommateurs qui remplissent les read-models ; la rétention sans expiration du
      topic `commande.serie.changed` (réglage du broker) ; l'API de réservation de `stock`.
  - **Le jeu « Grossiste du Golfe » et les routes C13** (STORY-1058, étiquette `jeu-grossiste-golfe-v1` ; ventes
    `dev` 7f674ef, terrain `dev` 068e1c0) :
    - **le jeu** : `prospera-plateforme/jeux-demonstration/grossiste-golfe*/` ; le régénérer :
      `node jeux-demonstration/grossiste-golfe/generateur/generer.mjs <dossier> PETIT|MOYEN|GRAND`, puis
      `node --test …/generer.test.mjs` (les empreintes des `jeu.json` y sont figées : une version neuve du jeu les
      refige et change `version`) ; une part de plus (pdv, catalogue, stock, facturation…) s'ajoute au générateur, dans
      l'ordre des dépendances ;
    - **la règle des identifiants** : `src/socle/instance/identifiant-du-jeu.ts` (24 hex de
      `sha256("jeu-demonstration|<org>|<objet>|<clef>")`) ; tout module qui reçoit une part l'applique ;
    - **le socle C13** : `src/socle/instance/` (identique dans ventes et terrain, `diff -r`) ; un module de plus sert ses
      routes avec un contrôleur `@RoutesDInstance('<code>')` + `@AdmetIdentitesDeService('MOTEUR')`, une `PartDuModule`
      (objets, `ouVivent`, plan d'effacement), un invariant d'inventaire du plan, et son code dans
      `MODULES_AVEC_ROUTES_C13` (`src/droits-des-modules.ts`) ;
    - **la recette** : pilote de la partie A et surcouche (émetteur RS256, `INSTANCE_ESPACE=ESSAI`) décrits dans la fiche ;
    - **reste** : les routes C13 de `facturation`, `approvisionnement`, `entrepot`, `conquete-objectifs` ; ~~la part
      `reseau`~~ (**livrée par 1063**) ; les routes de lecture des tournées (EPIC-233).
  - **La facture juste (1)** (STORY-1059, `ventes` `dev` 1c1e944 → bd8d211), `src/modules/facturation/` et
    `src/modules/commande/credit/` :
    - **l'émission** (`factures/factures.service.ts`) : `POST /facturation/factures { commandeId }` facture une commande
      `VALIDEE` (option « dès la validation », AD-29 : quantités commandées, prix figés) ; la commande est lue dans
      `facturation_commandes_chiffrees` (projection de `commande.commande.chiffree@1`, jamais le code de `commande`) ;
      l'échéance vient de `facturation_conditions_reglement` (**remplie par personne** : projection future de
      `pdv.point-de-vente.changed@1` ; sans elle, `CONDITIONS_REGLEMENT_MANQUANTES`) ; le numéro `FAC-` est tiré dans
      la transaction de la facture (série `factures`, `SERIES_DE_FACTURATION`) ; clé d'origine `<commandeId>:facture`
      (index unique) ;
    - **la Créance** (`creances/`) : port `OuvertureDeCreance` (adaptateur HTTP vers `PUT
      {PAIEMENT_SERVICE_URL}/api/v1/creances/sources/FACTURE/{factureId}`, jeton du membre) ; `OuverturesDesCreances`
      note l'issue (`A_OUVRIR`, `OUVERTE`, `REFUSEE`) et relance en mémoire tant que le jeton vit ; après un
      redémarrage, une facture `A_OUVRIR` se reprend par le rejeu ou `POST …/factures/{id}/creance` — **jusqu'au
      consommateur de `facturation.facture.emise@1` chez B**, qui la rendra durable (même clé) ;
    - **la projection du crédit** (`commande/credit/`) : groupe `ventes-service.creances` sur `paiement.creance.changed`
      et `facturation.facture.emise` ; plus haute révision par Créance ; crédit du tiers = trop-perçu (B-965) ; sources
      de l'encours posées au premier fait de l'organisation ; l'engagement baisse du TTC à la Créance de la facture,
      une fois (`commande_factures.engagementSolde`) ;
    - **pour la facture par livraison (2)** : une seconde clé d'origine (`<livraisonId>:facture`), la quantité facturée
      par ligne de bon, la lecture de `commande.bon-livraison.livre@1` ; le mode se fige par commande (AD-29) ;
    - **recette** : pile `grp-d` avec le vrai `paiement` d'`origin/dev` (Mongo `rs-paiement` provisionné par ses
      scripts, Redis, `NODE_ENV=production`, `/health/live` : il est `unhealthy` par construction), KYC et droit
      `paiement` publiés sur Kafka, jetons à double audience (`ventes-service`, `paiement-service`) avec
      `perms: ['paiement:demande:emettre']` ; pilote et surcouche décrits dans la fiche 1059.
  - **La facture juste (2)** (STORY-1061, `ventes` `dev` 33bd0e7 → 68b293c), `src/modules/facturation/numerotation/` et
    `reglements/` :
    - **la suite de Sage** : `SuitesDeNumerotation.poser` est **le** geste ; le point d'import de la Reprise
      (`facturation.suite-numerotation@1`, EPIC-244) l'appellera tel quel (même corps). Une série de plus qui reprend
      Sage (avoir, proforma) s'ajoute à `SERIES_REPRISES` et à l'énumération de la route ;
    - **le format** se lit par `SuitesDeNumerotation.formatDe(org, série, session)` **dans** la transaction du numéro ;
      `mettreEnForme` / `lireLeNumero` (`numerotation/format.ts`) sont la seule règle ;
    - **le socle** : `NumerotationDesSeries.amorcerDansUneTransaction` (le compteur amorcé et l'écrit dans une même
      transaction ; plancher posé dans l'ancre après) ;
    - **le règlement** : `ReglementsDesFactures.reglement(org, factureId, echeanceLe)` ; la balance clients et la balance
      âgée liront `facturation_creances_lues` ;
    - ~~défaut latent nommé~~ (`ProjectionDuCredit.plusHauteRevision`, `CommandesChiffrees.appliquer`) : **corrigé par
      1062** (`dev` b9a82a6), prouvé rouge puis vert sur MongoDB réel ;
    - **recette** : `scripts/recette/1061/` (pile sans `paiement`, son fait publié par le pilote ; mutations).
  - **La commande (2)** (STORY-1062, `ventes` `dev` 339a1ad → f49f3a6), `src/modules/commande/commandes/` :
    - **le numéro `CMD-`** : série `commandes` de `SeriesDeCommande`, tirée dans la transaction de la saisie
      (`emettreDansUneTransaction`) ; une commande d'avant 1062 n'a pas de numéro (`null`) ;
    - **la commande terrain** : `TRANSMISE` dès la saisie ; `jugerLePrix` (commandes.service) relit la grille à la
      validation et pose `ecartDePrix` ; la confirmation cite la révision ; le double se cherche par `empreinteDuContenu`
      **dans** la transaction du numéro (le compteur sérialise deux transmissions) ;
    - **l'annulation** : `AnnulationDesCommandes` ; le port `ReservationStock.liberer` est celui que l'API de `stock`
      devra servir (même clé `<bonId>:<ligne>`) ; une ligne `A_LIBERER` se rend au rejeu de l'annulation ;
    - **facturation** lit `commande.commande.annulee@1` (groupe `ventes-service.commandes-chiffrees`,
      `facturation_commandes_annulees`) ; la fenêtre résiduelle (facture émise avant que l'annulation soit lue) est
      tracée `FACTURE_D_UNE_COMMANDE_ANNULEE` et se corrigera par l'avoir ;
    - **recette** : `scripts/recette/1062/` (pile sans `stock` ni `paiement`, adaptateur de réservation de recette).
  - **Les référentiels côté réseau** (STORY-1063, `reseau` `dev` 25de958 → 4b55ac1 ; plateforme 26977ca,
    `jeu-grossiste-golfe-v1.1`), `src/modules/reseau/instance/` et `src/socle/instance/` :
    - **la part du jeu** (`part-reseau.ts`) : `hierarchie` (le gabarit, `HierarchieService.configurerDansLaSession`),
      `zone` (moteur des zones, identifiant imposé `identifiantDuJeu(org, 'zone', clé)` ; une zone déjà là est gardée),
      `rattachement` (`RattachementsService.rattacherEnNombreDansLaSession` ; la zone vérifiée dans la transaction, car
      l'identifiant d'un nœud est un ObjectId que la vérification des références du socle ne voit pas) ;
    - **un objet de plus** (les commerciaux du jeu : `commercial`) s'ajoute à `partDuReseau` et au générateur
      (`PARTS`, part `reseau`), dans l'ordre des références ; le jeu change de version et ses empreintes se refigent ;
    - **le plan d'effacement** (`PLAN_DE_RESEAU`, `EXCLUES_DU_PLAN`) : une collection neuve du service rougit
      `plan-d-effacement.invariant.spec.ts` tant qu'elle n'y est pas (les constantes `COLLECTION_* = '…'` sont lues) ;
    - **le socle C13** est la copie de `ventes` (Ajv 8 dans `contrats-instance.ts`) : une évolution du socle se fait dans
      `ventes`, puis se recopie ici et dans `terrain` ;
    - **l'espace** : `KAFKA_ESPACE` (pas `INSTANCE_ESPACE`) ; **recette** : `scripts/recette/1063/` (pilote de la pile,
      mutations).
  - **Les comptes du jeu** (STORY-1064, plateforme `50c12a6`, `jeu-grossiste-golfe-v1.2` ; `ventes` `edb3f8f`) :
    - **le fichier** : `jeux-demonstration/grossiste-golfe*/comptes.json`, produit par le générateur (`COMPTES_DU_BUREAU`,
      `ROLE_METIER_DES_AGENTS`, `compteDeLAgent`), sans tirer un nombre ; le corps exact de `PUT
      /api/v1/interne/organisations/{org}/comptes-du-jeu` d'auth (B, STORY-972) : un champ de plus y est refusé ;
    - **la déclaration** dans `jeu.json` attend `comptes` dans `jeu-demonstration@1` (B) : ajouter alors l'entrée au
      manifeste dans `jeu()` du générateur, version 1.3.0, et refiger les empreintes de `generer.test.mjs` ;
    - **l'identité** : un compte d'agent = son commercial de `terrain` ; un compte du bureau a l'objet `compte` ; vecteurs
      dans `generer.test.mjs` et `ventes` (`src/socle/instance/identifiant-du-jeu.spec.ts`) ;
    - **les portées** des comptes dans `reseau` sont la suite (D-1064-8, « Ce qui reste » (3 bis)).
  - **Le lot 3 de D est fini.** **Le lot 4 de D est fini** (1060 → 1064, le 2026-11-18) : ~~les remplaçantes
    d'EPIC-227 (1063)~~ **livrée**, ~~les comptes du jeu (1064)~~ **livrée**.

## Demandes aux autres groupes

- **→ B (2026-11-24, STORY-1066) : l'avoir — un droit, le manifeste `facturation` 1.1.0, le consommateur de
  `paiement`** — **ouverte**. (1) **`facturation:avoir:valider`** au catalogue de tenant d'`auth`, **hors du jeton**,
  rôle par défaut **`DIST_DAF` seul**, libellé proposé « Valider un avoir au-delà du seuil » (comme
  `facturation:parametres:modifier`, STORY-979) : émettre un avoir dont le TTC dépasse le seuil de validation (paramètre
  de la facture, 500 000 XOF par défaut ; FR-48, AD-6), avec `facturation:avoir:emettre`. Jusque-là, un avoir au-delà du
  seuil répond 403 `VALIDATION_DU_DAF_REQUISE` à tous (échec fermé) ; en deçà, rien ne change. (2) **Recopier le
  manifeste `facturation` 1.1.0 au catalogue** (`copies.json`) : la version monte à la source (D-1065-15, votre
  D-979-7), elle porte aussi `facturation:parametres:modifier` ; le SHA de `prospera-stories` à recopier est donné à
  la PR finale de 1066 (ci-dessous, à la fusion de cette annonce). (3) **Consommer `facturation.avoir.emis@1` dans
  `paiement`** (AD-7, FR-48 : « `paiement` réduit la Créance de la facture en le consommant, en moins de 5 secondes » ;
  au-delà du reste dû, un crédit du tiers) : topic `facturation.avoir.emis`, clé `<organisationId>:<factureId>`, schéma
  `facturation.avoir.emis-value` (BACKWARD) ; la Créance à réduire est `(FACTURE, factureId)` ; le montant est
  `montantTtcMineur` ; rejeu sur `avoirId` ; `cumulTtcMineur` est l'état absolu (TTC crédité sur la facture après cet
  avoir) si vous préférez garder le plus haut ; `soldeLaFacture` dit qu'il ne reste rien à créditer. Charge complète :
  « ⚠ Contrats » (STORY-1066). Sans ce consommateur, l'avoir est émis, numéroté, publié et imprimé, mais le reste dû lu
  chez vous ne baisse pas.

- **→ B (2026-11-24, STORY-1065) : `facturation:parametres:modifier` au catalogue de tenant d'`auth`, hors du jeton** —
  **servie par STORY-979 de B** (voir « Réponses aux demandes reçues ») ; reste, côté D, la version du manifeste
  (D-1065-15, avec 1066). Déclaré au manifeste `facturation` (C7, D-1065-13 ; absent de
  l'annexe B.2, comme `commande:parametres:modifier` et `terrain:parametres:modifier` : `AJOUTS_A_L_ANNEXE_B`). Libellé
  proposé : « Modifier les paramètres de la facture » (la fiche de l'émetteur, la liste des mentions légales, la durée
  du lien public). **Rôle par défaut proposé : `DAF`**, lui seul. Jusque-là, `PUT /api/v1/facturation/parametres`
  répond 403 `DROIT_INSUFFISANT` à tous (échec fermé), et l'émission d'une facture refuse
  `MENTION_OBLIGATOIRE_MANQUANTE` tant que la fiche de l'émetteur n'est pas posée. Au passage, le catalogue recopie le
  manifeste `facturation` (`copies.json`).

- **→ B (2026-11-18) : le fichier des comptes du jeu est prêt ; `comptes` dans `jeu-demonstration@1` et la pose par le
  catalogue (votre remplaçante, D-972-9 ; STORY-1064, D-1064-4)** — **ouverte**, sans urgence (le catalogue monte le jeu
  à `jeu-grossiste-golfe-v1`). Le jeu **1.2.0** (étiquette `jeu-grossiste-golfe-v1.2`, plateforme `dev` 50c12a6) porte dans chaque
  dossier `comptes.json` : un tableau `{ objet, cle, prenom, nom, roleMetier }`, **exactement** le `comptes` de votre
  `PUT /api/v1/interne/organisations/{org}/comptes-du-jeu` (aucun champ de plus ; 8, 16 et 44 comptes, un appel). Les
  clés et rôles sont les vôtres (D-972-9, confirmés par l'utilisateur) : `compte` `AKOSSIWA` `DIST_COMPTABLE`, `MENSAH`
  `DIST_RECOUVREMENT`, `YAWA` `DIST_SUPERVISEUR`, `AYITE` `DIST_DG` ; puis `commercial` `COM-nn`, `DIST_COMMERCIAL` |
  `DIST_FREELANCE` | `DIST_PROSPECTION`. Il n'est dans **aucune part** (aucune route C13) et **pas déclaré** dans
  `jeu.json` : le modèle est fermé. **Proposition** : un `comptes` facultatif à la racine du jeu, `{ fichier,
  enregistrements, sha256 }` (les champs d'un objet, sans `objet`), que `verifierJeu` vérifie comme un objet (présent,
  sous le dossier, empreinte, tableau d'objets, nombre) ; le catalogue pose les comptes **après** l'import des parts (un
  compte d'agent a l'identifiant de son commercial dans `terrain`). Dès que le contrat le permet, D déclare le fichier
  dans `jeu.json` (1.3.0, aucun fichier de données changé) ; dites ici si vous préférez un autre nom ou une autre forme.
  En attendant, `jeu.json` 1.2.0 en porte le nombre (`generateur.parametres.comptes`).

- **→ B (2026-11-18), information : le jeu « Grossiste du Golfe » 1.1.0 a une part `reseau`, la première (STORY-1063,
  D-1063-11)** — aucune action exigée tant que le catalogue monte le jeu à l'étiquette `jeu-grossiste-golfe-v1`. Le jour où
  il passe à **`jeu-grossiste-golfe-v1.1`** : ajouter `reseau=http://reseau-service:3419` à `INSTALLATION_SERVICES` (sinon
  l'import s'arrête à la première part, `SERVICE_NON_CONFIGURE`, et `commande` et `terrain` restent `A_IMPORTER`) ; le
  service `reseau` de l'essai tourne avec `KAFKA_ESPACE=ESSAI` (ses routes C13 refusent l'espace réel). La part pose le
  gabarit à zones à plat, deux à cinq zones et leurs lieux rattachés ; l'effacement de fin d'essai de `reseau` est servi.

- **→ B (2026-11-18), information : le numéro d'une facture suit désormais le format de la série (STORY-1061)** — aucune
  action exigée. Pour votre consommateur à venir de `facturation.facture.emise@1` : `numero` n'a plus de motif `FAC-` au
  registre (il suit la suite reprise de Sage, `FAC-2026-8822` ou `FA000124`) ; c'est un libellé, la clé reste
  `factureId`. `ventes` lit aussi `paiement.creance.changed` par un second groupe, `ventes-service.reglements` : si la
  charge change, le dire ici. La suite de Sage se pose par le DAF (`facturation:numerotation:administrer`, déjà dans votre
  table d'accès) : rien à ajouter chez vous.

- **→ B (2026-11-18) : un droit neuf, `terrain:parametres:modifier`, au catalogue de tenant (STORY-1060, D-1060-6)** —
  **ouverte**, sans urgence (aucun écran ne l'appelle ; l'essai prend le calendrier par défaut). Changer le calendrier de
  l'organisation (jours travaillés, jours fériés), paramètre versionné de `terrain` (AD-12 : réservé au DG et à
  `DIST_ADMIN`) ; l'annexe B ne nomme aucun droit pour ce geste. Demandé, comme `commande:parametres:modifier` (B-971) :
  le code au catalogue, **hors du jeton** (`droitsHorsJeton`), rôles par défaut **`DIST_DG` et `DIST_ADMIN`** ; il est
  déclaré au manifeste `terrain` (cette PR). Jusque-là, `PUT /api/v1/terrain/parametres` répond 403 à tous. Les rôles de
  l'IMF (le module `terrain` est partagé) viendront avec la story qui l'emploie. **Information** : `contrats/distributeur/`
  porte une troisième bibliothèque, `src/calendrier.ts` (`calendrier-distributeur-v1`) ; si vous tenez le README de la
  plateforme, la ligne `contrats/distributeur/` peut le dire.

- **→ B (2026-11-17) : consommer `facturation.facture.emise@1` dans `paiement` (STORY-1059 ; votre D-965-9)** —
  **ouverte**, sans urgence (la route reste le chemin de 1059). La charge est fixée et **publiée** (`ventes` `dev`
  1c1e944, schéma `facturation.facture.emise-value` en BACKWARD, topic `facturation.facture.emise`, clé
  `<organisationId>:<factureId>`, enveloppe `eventId`, `schemaVersion: 1`, `occurredAt`, `organisationId`) :
  `factureId` (votre `sourceId`), `numero` (le `libelle`), `commandeId`, `livraisonId` (`null` dans ce mode),
  `tiersId`, `perimetre`, `devise`, `montantHtMineur`, `montantTvaMineur`, **`montantTtcMineur`** (votre
  `montantOrigineMineur` ; graphie de `ventes`, pas `montantTTCMineur`), `echeanceLe`, `emiseLe`, `rang` (1). Une facture
  dont la Créance n'a pas pu s'ouvrir (paiement arrêté, puis `ventes` redémarré) reste `A_OUVRIR` jusqu'à un membre :
  votre consommateur la fermera sans membre, sur la même clé `(FACTURE, factureId)`. **Information** : `ventes` lit
  `paiement.creance.changed` (groupe `ventes-service.creances`, depuis le début) et garde la plus haute `revision` par
  `creanceId` ; si la charge change, le dire ici.

- **→ B (2026-11-17) : le jeu « Grossiste du Golfe » (STORY-1058)** — **ouverte**. (1) **README de la plateforme** :
  une ligne du tableau pour `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/`
  (groupe D, étiquette `jeu-grossiste-golfe-v1`) ; aucun fichier de B touché. (2) **Catalogue** : `INSTALLATION_SERVICES`
  doit nommer `commande` (prospera-ventes-service, 3412) et `terrain` (prospera-terrain-service, 3413) dans l'espace
  d'essai, et ces services y tournent avec `INSTANCE_ESPACE=ESSAI`. (3) **Auth (FR-21)** : les comptes du jeu (connexion
  « en tant que ») sous `identifiantDuJeu(organisationId, 'commercial', 'COM-nn')` pour les agents. (4) **Pour
  information** : `facturation`, `approvisionnement`, `entrepot` et `conquete-objectifs` déclarent des routes C13 qu'ils ne
  servent pas encore : installés dans un essai, ils laisseraient le plan d'effacement `EN_COURS` (D-953-4).

- **→ C (2026-11-17) : la part Prospera de l'annexe E (STORY-1057)** — **information, et trois demandes ouvertes**.
  La recette du LC fictif (`npm run recette:demo`, `prospera-assureur-fictif` `dev` f9bbea5) joue ce que le LC tient de
  l'annexe E ; **les 108 autres lignes sont à vous** (dossier, circuit, experts, GED, OCR ; 22 d'entre elles se voient
  aussi à l'écran) : la table classée est réutilisable telle quelle (`src/modules/assureur-fictif/recette/
  table-annexe-e.json` et `annexe-e.ts`, colonne `ou`). Trois écarts du **générateur** (votre dossier
  `contrats/assurance/demo/`), à trancher chez vous puis à me demander de recopier :
  (1) **C-10** : le jeu ne produit aucun document ; les « 7 documents » (n° 12) et le bordereau de 11 pièces (n° 101)
  en dépendent (Q-D-8) ; (2) **les noms** de l'annexe E (« Estelle Lawson », « Komlan », « SAREX ») ne sont pas ceux
  du jeu (Estelle Kpodar, Koffi Mensah, trois cabinets fictifs) : la part Prospera lira la personne par son rôle
  (Q-D-7) ; (3) **la garantie du sinistre existant `SIN-2026-9002`** est `RC_CIRCULATION` (franchise 0), qui donne
  445 500 et non le décompte de 395 500 ; la police porte la garantie `DOMMAGES_TOUS_ACCIDENTS` (10 %, 50 000), que la
  partie retient (D-1057-6). **Pour vos piles** : après un effacement C13 du LC, rejouer un parcours demande des lots
  neufs (comme après une remise à zéro) — **ouverte** pour (1) à (3).
- **→ A (2026-11-17) : assembler la recette de la démo sur vrai backend (`prospera-recette`)** — **information,
  ouverte** pour quand C aura le parcours de `SIN-2026-9002`. La part du LC se joue par l'image du LC fictif
  (`node dist/modules/assureur-fictif/recette/recette-demo.js`, variables `RECETTE_*`, sortie 0/1, rapport JSON par
  `RECETTE_RAPPORT`) ; la table des 104 + 21 et leur classement sont dans `table-annexe-e.json` et `annexe-e.ts`.
  Règle de recette (FR-15, FR-264) : 104 sur 104 de la table réécrite.
- **→ B (2026-11-17) : le LC fictif sert ses cinq vérifications C13 (STORY-1057)** — **information**. Votre demande
  du 16/11 (STORY-944, « servir les routes de vérification ») est **servie** pour `assureur-fictif` :
  `INSTALLATION_SERVICES=assureur-fictif=<url>` suffit ; chaque route répond `verification-installation@1` en moins de
  3 s sur le jeu de la démo (délai du moteur : 10 s). Dans un espace réel, le service ne démarre pas : le moteur verra
  `assureur-fictif-absent-du-reel` `NON_EXECUTEE`, jamais `VERT` ; c'est au bilan d'un espace réel de le lire comme
  un échec (FR-205). Le drapeau `assureurFictifAutorise` de l'état voulu reste à porter par l'agent (D-1048-4).

- **→ B (2026-11-17), information : `reseau` est le premier module cible sur `kit-cible` 1.0.1 (STORY-1055)** — aucune
  action exigée.
  - La suite publiée passe telle quelle sur MongoDB réel : 16 cas joués, 6 sans objet nommés.
  - **D6 compte** : la version d'un lot vaut par `lotId`, pas par objet. Un lot qui porte des zones puis des
    commerciaux sous le même `lotId` voit les commerciaux refusés `VERSION_ANTERIEURE`, dès qu'une version 2 des zones
    est passée. Si la Reprise ne tient pas un lot par sorte d'objet, D6 doit passer avant `reprise-service`.
  - La chaîne de 600 objets suppose une auto-référence sans borne de profondeur. `reseau` borne la sienne : son banc
    pose `profondeurMax` à 1 000 pour ses organisations de conformité. Une option du profil (`chaine.longueur`)
    éviterait ce réglage aux modules à hiérarchie bornée ; à vous de voir, sans urgence.
  - Les organisations de la suite (`org-conformite-a`, `org-conformite-b`) ne sont pas des `ObjectId`. Le banc de
    `reseau` les traduit par une bijection devant la cible ; un module dont l'organisation est un `ObjectId` fera de
    même.
  - `contrats/objets/reseau/` est écrit par D (README : « le module `<code>` ») ; si vous tenez le tableau « Qui écrit
    dans quel dossier », la ligne générique suffit.

- **→ C (2026-11-17) : consentements de l'assuré et accusé des messages (STORY-1054)** — **ouverte**, sans urgence
  (rien ne casse chez vous). (1) À la déclaration, quand l'assuré accepte d'être informé du numéro de sinistre
  officiel, appeler `POST {NOTIFICATION_URL}/api/v1/service/assurance/dossiers/{dossierId}/consentements` (jeton de
  service de `sinistres-service`) avec `{ organisationId, finalite: "INFORMATION_DU_DOSSIER", decision: "ACCORDE",
  versionTexte, recueilliLe, recueilliPar }` ; un retrait se pose de la même façon (`RETIRE`). Sans cela, le numéro
  officiel reste dans la cloche de l'assuré (échec fermé) ; les autres messages ne demandent rien. (2) Pour inscrire
  l'accusé de transmission au journal du dossier (FR-146) et la liste « à contacter autrement », lire `GET
  …/dossiers/{dossierId}/messages?organisationId=` ; si un fait poussé vous convient mieux, dites-le : D l'ajoutera.
  Le courrier `ACCUSE_RECEPTION` papier (votre STORY-1007) n'est pas un canal de `notification` : il reste hors
  de 1054.
- **→ B (2026-11-17) : un droit neuf, `commande:parametres:modifier`, au catalogue de tenant (STORY-1053, D-1053-7)** —
  **servie par B-971** (auth #43, `dev` `913bd92`, constaté au rituel de 1059). Changer les paramètres de `commande` (seuil de remise, score de priorité, alertes, heure de l'allocation
  du matin ; versionnés et figés à l'acte, STORY-1049) : AD-12 réserve ce geste au DG et à `DIST_ADMIN`, l'annexe B ne
  nomme aucun droit pour lui. Demandé : le code `commande:parametres:modifier` au catalogue, **hors du jeton**
  (`droitsHorsJeton`), rôles par défaut **`DIST_DG` et `DIST_ADMIN`** ; il est déclaré au manifeste `commande`
  (prospera-stories, PR de l'annonce de 1053). Jusque-là, `PUT /api/v1/commande/parametres` répond 403
  `DROIT_INSUFFISANT` à tous (échec fermé, sans urgence : aucun écran ne l'appelle). Q-D-5 au PO dans ce journal ; si
  le PO préfère un droit existant, D change une ligne de `ventes`.
- **→ B (2026-11-17), information : les cinq services du distributeur lisent `/moi/droits` (STORY-1053, livrée)** —
  aucune action. Aucun fichier de B touché dans la plateforme : la bibliothèque est dans `contrats/distributeur/`
  (`src/acces.ts`, étiquette `acces-distributeur-v1`), déjà jouée par les scripts racines ; si vous tenez le README,
  la ligne `contrats/distributeur/` peut dire « et la règle d'accès des cinq services (STORY-1053) ». Comme `reseau` : `droits ∪ droitsHorsJeton`, cache 60 s, `dv`, `identity.droits.changed@1` (cinq groupes de
  consommateurs neufs, `<service>.droits-membres`). Si le contrat `moi-droits` 1.x changeait de forme, le dire ici.

- **→ B (2026-11-17) : `series-v1.1` est publiée ; la comptabilité peut rester sur `series-v1` (STORY-1052)** —
  **information**, aucune action exigée. Votre copie (`src/vendor/series/`, `series-v1`, e0cb763) reste valide :
  `series-v1` ne bouge pas, et garder le majeur 1 évite qu'une organisation qui installe la comptabilité et `commande`
  soit refusée pour « majeurs différents ». Si vous recopiez `series-v1.1` (même appel `depotMongo(collection,
  { session })`, mêmes résultats) : (1) ouvrez vos transactions de numérotation en `writeConcern: majority` (le niveau
  ne se pose plus par opération dans une transaction ; hors transaction, l'adaptateur pose `majority` + `j` et lit en
  `linearizable`) ; (2) `tete()` lit désormais **dans** votre transaction quand une session est passée (en v1, elle
  lisait hors d'elle) ; (3) sans `ancre` dans les options du constructeur, rien d'autre ne change. Avec une ancre, une
  restauration de votre base se détecte seule et le trou se déclare au lieu de réémettre un numéro de pièce : à voir
  avec EPIC-120 (l'export du journal) si vous la voulez pour les journaux légaux.

- **→ C (2026-11-17) : enregistrer le destinataire de l'assuré dans `notification` (STORY-1051)** — **ouverte**, sans
  urgence (rien ne casse chez vous). `notification` prévient l'assuré à chaque étape tirée de
  `sinistres.dossier.changed@1` (déclaration, pièces attendues et trois relances espacées de 5 jours, ouverture, numéro
  officiel, offre, chèque, règlement, clôture ; jamais la fraude), mais **aucun fait ne porte d'adresse** (AD-16) : sans
  destinataire enregistré, rien ne part (`CANAL_ABSENT`). Demandé : à la déclaration (canal choisi par l'assuré, SMS à
  défaut, FR-146), `sinistres` appelle `PUT {NOTIFICATION_URL}/api/v1/service/assurance/dossiers/{dossierId}/destinataire`
  avec `Authorization: Bearer <jeton de service de sinistres-service>` et `{ organisationId, canal, destinataire,
  langue? }` (idempotent ; un nouvel appel remplace). Le jeton se pose des deux côtés (`JETONS_DE_SERVICE` de
  notification : `sinistres-service:<jeton>`). Facultatif ensuite : la route synchrone d'AD-27
  (`POST /api/v1/service/envois`, clé `(dossierId, événement)`) vous est ouverte pour les neuf modèles `assurance-*`.
  Les relances de `notification` sont automatiques (FR-47, H-040 : à confirmer en immersion) et ne remplacent pas les
  vôtres (STORY-999) ; l'arbitrage après trois relances reste chez vous.

- **→ B (2026-11-17) : attribuer les droits `reseau:*` par auth-service (STORY-1050, pour B-960)** — **servie par
  B-960** (auth #42, `dev` 8d48710 ; les cinq `reseau:*` sont dans la table des 15 rôles) ; **vérifié en 1053** (la table
  d'auth, lue ligne à ligne par l'émetteur de recette : les cinq `reseau:*` aux rôles de l'annexe ; un membre sans rôle
  `DIST_*` n'a aucun droit, D-960-12).
  Depuis STORY-1050, `reseau-service` lit ses droits par `GET /api/v1/moi/droits` et n'a plus de table rôle → droits :
  tant qu'aucun rôle de tenant ne porte un droit `reseau:*`, toutes les routes du module qui en exigent un répondent 403
  `DROIT_INSUFFISANT` (la garde du module et `/health` ne changent pas). Les cinq codes, tous vérifiés par une garde
  (règle d'or du catalogue de tenant), 40 caractères au plus : `reseau:noeud:consulter`, `reseau:noeud:modifier`,
  `reseau:decoupage:modifier`, `reseau:affectation:modifier`, `reseau:portee:attribuer`. Ce que la table retirée donnait
  (D-1032-2), à reprendre dans la table d'accès de l'annexe B : `TENANT_ADMIN` les cinq, `TENANT_USER`
  `reseau:noeud:consulter`. `reseau` ne lit pas `perms[]` : il lui suffit que `/moi/droits` rende ces codes, que la
  borne du jeton (44) les laisse entrer dans `perms[]` ou non. **Mis à jour après l'annonce de B-960** (`/moi/droits`
  1.1.0, champ `droitsHorsJeton`) : `reseau` lit `droits ∪ droitsHorsJeton` depuis reseau-service#14 ; les `reseau:*`
  peuvent donc rester hors du jeton. Reste à vérifier, à la fusion de B-960, qu'ils figurent bien dans la table
  d'accès des 15 rôles.
  **→ C (2026-11-17), information** : `reseau.commercial.changed@1` se republie quand seul l'état du compte change
  (« ⚠ Contrats ») ; `sinistres` n'en dépend pas.

- **→ B (2026-11-17) : `commande` refuse toute commande à crédit tant que la Créance n'y est pas projetée
  (STORY-1049)** — **information**, aucune action avant 965. Les sources `creances` et `creditsTiers` de l'encours
  sont `ABSENTE` dans `ventes` (refus `ENCOURS_NON_INSTALLE`) jusqu'au consommateur de D-1059, qui lira
  `paiement.creance.changed@1` et `paiement.credit-tiers.changed@1` tels que B-963 et B-965 les fixeront (forme
  attendue : « → B, ce que la bibliothèque d'encours lit », plus bas). Rien de neuf n'est demandé.

- **→ C (2026-11-17) : le LC fictif lit l'espace de l'instance (STORY-1048)** — **information**, aucune action exigée.
  Vos piles qui ne posent que `FICTIF_ESPACE=essai` démarrent comme avant. Si une pile pose `INSTANCE_ESPACE` pour un
  autre service et la passe aussi au LC fictif, elle doit valoir `ESSAI` (sinon refus, sortie 78,
  `ASSUREUR_FICTIF_INTERDIT`). Conseillé : poser `INSTANCE_ESPACE=ESSAI` au LC fictif. La remise à zéro du LC n'est plus
  suivie d'une relecture de votre `sortie` : rejouer un parcours après elle demande des lots neufs (ce que
  `liaison-assureur` fait de lui-même).

- **→ B (2026-11-17) : ce que la bibliothèque d'encours lit de la Créance (B-963, B-965)** — **information**, aucune
  action exigée avant 1059. `encours@1` (STORY-1047) prend en entrée l'**état absolu** de chaque Créance et de chaque
  crédit du tiers, par clé, avec une **révision croissante** (la plus haute l'emporte) : pour la Créance, `statut`
  (`OUVERTE` | `CLOTUREE`), les **deux restants** de STORY-259 (`restantCertain`, `restantAffiche` ; ou le montant
  déclaré à part, comme le dit l'amendement du 2026-11-13), `echeanceLe`, `perimetre`, `devise`, montants entiers en
  unité mineure ; pour le crédit du tiers, son `solde`. Si `paiement.creance.changed@1` ou
  `paiement.credit-tiers.changed@1` s'en écarte (pas de révision, un seul restant), le dire ici : D adapte la
  correspondance chez le consommateur, la règle ne change pas. Une Créance `CLOTUREE` sort de l'encours (D-1047-3).
- **→ C (2026-11-17) : passation de `prospera-assureur-fictif` constatée** — **pour information**. D tient le dépôt
  depuis STORY-1046 (`dev` 78ad10c au rituel, e265b0a après). C continue de jouer ses parcours contre le LC fictif et
  demande à D toute modification (ici). Ce qui change pour vous : deux routes neuves (C13, identité `MOTEUR` seule) ; un
  jeton de service présenté à toute autre route du LC fictif est refusé 403 `IDENTITE_DE_SERVICE_REFUSEE` ; vos jetons
  d'utilisateur, l'API du LC (`/lc/echange`) et l'administration ne changent pas. Le générateur reste dans votre dossier
  `contrats/assurance/demo/` : s'il change, D recopie et refige les empreintes du jeu (à demander ici).
- **→ B (2026-11-17) : le jeu de l'assurance est dans `jeux-demonstration/`** — **information**. D-1046-4 : D a ajouté
  `jeux-demonstration/assurance-compagnie-demo-reduite/` (données seules, plateforme #23), sur la phrase du README « les
  jeux des verticales viennent de leurs propriétaires ». Si vous tenez le tableau « Qui écrit dans quel dossier » à jour,
  la ligne est : `jeux-demonstration/assurance-compagnie-demo-reduite/` → groupe D. Le jeu à la taille de la démo
  (`assurance-compagnie-demo`, ~80 Mo) n'est pas versionné : `npm run jeu:ecrire -- <dossier> DEMO` dans
  `prospera-assureur-fictif` le produit à l'octet, pour `JEUX_DEMONSTRATION_DIR` du catalogue de l'espace d'essai. Le
  catalogue le joue avec `INSTALLATION_SERVICES` → `assureur-fictif` et un jeton de service `MOTEUR` ; prouvé avec des
  lots de 500 (416 appels, 136 s), sans limite de débit côté LC.
- **→ C (2026-11-16) : consommer `reseau.portee.changed@1` et passer la suite de conformité pour STORY-1004** — ouverte.
  Le contrat est publié (reseau-service#7, `dev` 17dcf14) et la suite étiquetée (`conformite-portee-reseau-v1`,
  sha256 `f27799758591688e283c10e7bee04ea8ca7f3edb8c37dcd135f59e2b0851a15c`). Mode d'emploi :
  `tickets/TICKET-BACKEND-conformite-portee-reseau-sinistres.md`. Inscription au registre :
  `PUT /api/v1/instance/reseau/conformite/consommateurs/sinistres` (`PLATFORM_ADMIN`). D-1036 tient le jalon du 27/11
  en avance : C-1004 n'attend plus rien de D.

## Réponses aux demandes reçues

- **← B (2026-11-24, STORY-979) : `facturation:parametres:modifier` servi** — **lue** (relayée par la session de groupe de
  D, à la PR finale de 1065). auth : prospera-auth-service **#48**, `dev` `c0f6243` — le droit est au catalogue de
  tenant, **hors du jeton** : servi par `GET /api/v1/moi/droits` dans `droitsHorsJeton`, jamais dans `perms[]` ; rôle par
  défaut **`DIST_DAF` seul** (« Modifier les paramètres de la facture ») ; jusqu'à 60 s de cache (pas d'avance de `dv`).
  Catalogue : prospera-platform-catalog-service **#68**, `dev` `d7e67f1`, `copies.json` recopié depuis
  prospera-stories@1561370, garde des manifestes verte (48). Annonce de B : prospera-stories **#777**. **D-979-7
  (information)** : le manifeste `facturation` est resté en 1.0.0 ; un catalogue déjà semé garde l'ancienne 1.0.0 sans le
  droit et la signale « divergente ». **Décision de D (D-1065-15)** : la version monte à la source dans **STORY-1066**
  (l'avoir touche `facturation`) ; si l'avoir n'ajoute rien au manifeste, 1066 la monte quand même en **1.0.1** ; B la
  recopie ensuite. Le code de 1065 n'est pas rouvert.

- **← A (2026-11-18) : réponses de l'utilisateur à Q-D-1 → Q-D-10** — **lue** au rituel de 1060. Q-D-9 **renversée** ⇒
  STORY-1060 (un calendrier propre à chaque organisation) ; les neuf autres **confirmées** (« Questions à l'utilisateur
  ou au PO ») ; la reprise du dernier numéro de facture avant la première facture d'un client qui quitte Sage est
  inscrite à la liste de mise en service (passation, « Ce qui reste », à la PR finale de 1060) ; D-972-9 (les comptes du
  bureau dans le jeu) : STORY-1064.

- **← B (2026-11-17) : D-1059 débloquée (STORY-963, 965)** — **appliquée par 1059** : la route `PUT
  …/creances/sources/FACTURE/{factureId}` est appelée avec le jeton du membre ; `paiement.creance.changed@1` est lu tel
  que publié (plus haute `revision` par `creanceId`, trop-perçu = crédit du tiers) ; prouvé sur une pile avec le vrai
  `paiement` d'`origin/dev` (`ad35786`). Rien n'a manqué chez vous ; aucun ticket.
- **← B (2026-11-17) : le jeu « Grossiste du Golfe » (votre réponse à D-1058)** — **lue** : les trois gestes sont placés
  avant STORY-969 ou en remplaçante ; les comptes du jeu viennent avec STORY-972 (annoncée, `main`
  9fad661). La demande reste **ouverte** jusqu'à leur fusion.

- **← B (2026-11-16) : servir les routes de vérification de vos modules (STORY-944)** — **servie pour
  `assureur-fictif`** par prospera-assureur-fictif#5 (STORY-1057, `dev` f9bbea5) : les cinq codes du manifeste, au contrat
  `verification-installation@1`. Les modules du distributeur (`reseau`, `ventes`…) n'en servent pas encore : à leur
  installation par le moteur.

- **← B (2026-11-17) : `commande:parametres:modifier` au catalogue de tenant (STORY-971, annoncée)** — **lue** au
  rituel de 1056. Hors du jeton, `DIST_DG` et `DIST_ADMIN` seulement, servi par `/moi/droits` (`droitsHorsJeton`) :
  rien à changer dans `ventes` (la route lit déjà ce droit depuis 1053). La demande D-1053-7 reste **ouverte** jusqu'à
  la fusion de 971 ; Q-D-5 au PO est tenue par ce choix.

- **← B (2026-11-17) : les 15 rôles du distributeur sont servis, D-1053 est débloquée (STORY-960)** — **lue** au
  rituel de 1052 ; **appliquée par 1053** (livrée le 17/11) (droits `droits ∪ droitsHorsJeton` de `/moi/droits`, `roleMetier` jamais
  pour décider d'un droit, aucun droit sans rôle `DIST_*`). Les paramètres de `commande` (D-1049-4) et la lecture des
  séries (D-1052-12) restent au `TENANT_ADMIN` jusqu'à 1053, qui choisira entre un droit neuf et `roleMetier`.
- **← B (2026-11-17) : comment ouvrir une Créance dans `paiement` (STORY-963, pour D-1059)** — **lue** ; servira
  **1059** (`PUT {PAIEMENT}/api/v1/creances/sources/FACTURE/{factureId}`, rejouable).

- **← A (2026-11-17) : `PATCH /api/v1/dossiers/{id}` relayé par le BFF (STORY-923)** — **lue**. Pour l'écran de la
  fiche dossier (onglet Identité) : frontend, hors du lot 3 de D (backend) ; reprise avec le lot frontend.

- **← B (2026-11-17) : le lot 3 de D** — `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4 : **STORY-1045 → 1059**, distributeur
  et assurance en alternance. D reçoit `prospera-assureur-fictif` (de C) et `prospera-notification-service` (de B, à la
  fusion de B-957), et le dossier `encours/` de la plateforme. Ce que D attend de B : 956 (README, kit 1.0.1) pour
  1047 et 1055 ; 957 pour 1051 ; 960 pour 1053 ; 963 et 965 pour 1059. Passation à Dev A à mettre à jour **avant
  le 04/12**.

- ← A (2026-11-15) : les deux demandes adressées à D au lot 1 (point de départ AP-38 ; motif KYC perdu, reste de
  STORY-176) portent sur le frontend. Le lot 2 fait passer D au backend : elles **restent ouvertes** et reviendront
  avec le lot frontend. D n'y touche pas pendant le lot 2.

## Demandes à l'utilisateur (gestes réservés)

- **`reseau-service` : poser « Rebase and merge » seul.** Au 2026-11-16, la fusion par squash et par commit de fusion
  est encore permise. La session ne fusionne qu'en `gh pr merge --rebase`.
- ~~Créer les cinq dépôts du distributeur~~ : **faits** ; D y a posé `main` et `dev`. **Poser « Rebase and merge »
  seul** sur chacun (squash et commit de fusion encore permis), comme sur `reseau-service`.

## ⚠ Contrats

- **ANNONCÉ (2026-11-24, STORY-1066), avant le code. — `prospera-ventes-service`, module `facturation` : l'avoir.**
  Fiche : `stories/STORY-1066.md` (D-1066-1 → 14). **Ajouts seuls** ; un fait neuf publié (déjà déclaré au manifeste) ;
  un schéma relâché ; **manifeste `facturation` 1.1.0** (C7 : + `facturation:avoir:valider` ; D-1065-15).
  - **Routes neuves** (préfixe `/api/v1/facturation`) : `POST /factures/{factureId}/avoirs` (`facturation:avoir:emettre`
    ; au-delà du seuil, + `facturation:avoir:valider` ; `Idempotency-Key`) corps `{ motif: RETOUR_DE_MARCHANDISE |
    ERREUR_DE_PRIX | REMISE_COMMERCIALE | LITIGE_DE_LIVRAISON | ERREUR_DE_FACTURATION, texte?, nature: TOTAL | LIGNES |
    MONTANT, lignes?: [{ ligne, quantite, prixUnitaireHtMineur? }], montant?: { montantHtMineur, tauxTvaPourDixMille } }`
    ⇒ 201 l'avoir (`avoirId`, `numero` `AV-…`, `factureId`, `factureNumero`, `motif`, `texte`, `nature`, `lignes`, `tva`,
    HT, TVA, TTC, `ordre`, `cumulTtcMineur`, `resteACrediterTtcMineur`, `soldeLaFacture`, `statut: EMIS`, `emisLe`,
    `emisPar`, `pdf`, `rejeu`), 200 au rejeu ; 400 `AVOIR_INVALIDE` (`details.erreurs`), `CLE_D_IDEMPOTENCE_MANQUANTE` ; 403
    `VALIDATION_DU_DAF_REQUISE` (`details` : `seuilMineur`, `montantTtcMineur`), `HORS_PORTEE` ; 404 `FACTURE_INCONNUE` ;
    409 `AVOIR_SUPERIEUR_A_LA_FACTURE` (`details` : ce qui dépasse, le reste à créditer ; aucun numéro consommé),
    `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`. `GET /factures/{factureId}/avoirs`, `GET /avoirs/{avoirId}` (404 `AVOIR_INCONNU`),
    `GET /avoirs/{avoirId}/pdf` (`application/pdf`, `ETag`, `X-Empreinte-Sha256` ; 409 `PDF_EN_ATTENTE`,
    `PDF_INDISPONIBLE` ; 500 `PDF_ALTERE`) : `facturation:facture:consulter`.
  - **Routes changées** (ajouts) : `PUT /numerotation/{serie}` accepte `avoirs` (la suite de Sage des avoirs, une fois) ;
    `GET /numerotation` rend aussi la série `avoirs` ; la facture rendue gagne `statut` (`EMISE | PARTIELLE | PAYEE |
    CLOTUREE | ANNULEE_PAR_AVOIR`) et `avoirs { nombre, montantHtMineur, montantTvaMineur, montantTtcMineur,
    resteACrediterTtcMineur }` ; les paramètres de la facture gagnent `seuilValidationAvoirMineur` (500 000 par défaut, de
    0 à 10¹², **facultatif au `PUT`**, rendu par toute version lue).
  - **Fait neuf publié** : `facturation.avoir.emis@1` (topic `facturation.avoir.emis`, clé `<organisationId>:<factureId>`,
    schéma fermé `facturation.avoir.emis-value` en BACKWARD) : `avoirId`, `numero`, `factureId`, `factureNumero`,
    `commandeId`, `livraisonId` (`null`), `tiersId`, `perimetre`, `devise`, `motif`, `nature`, `lignes` (`ligne`,
    `articleId`, `quantite`, `prixUnitaireHtMineur`, `tauxTvaPourDixMille`, `montantHtMineur` ; vide pour un montant libre),
    `tva` (par taux), `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur`, `ordre`, `cumulTtcMineur`,
    `resteACrediterTtcMineur`, `soldeLaFacture`, `emisLe`, `rang` (1). Ni désignation, ni nom, ni texte libre.
  - **Fait relâché** : `facturation.serie.changed@1` — l'énumération `["factures"]` de `serie` est **retirée**
    (BACKWARD, vérifié au registre avant la fusion) ; la série `avoirs` (`prefixe` `AV-`) y paraît. Un consommateur qui
    ne gardait que la tête des factures filtre `serie = factures`.
  - **Collections neuves** : `facturation_avoirs`, `facturation_credits_des_factures`, `facturation_pdfs_avoirs`.
  - **Pour B** : voir « Demandes aux autres groupes » (le droit, le manifeste 1.1.0, le consommateur de `paiement`).

- **PUBLIÉ (2026-11-24, STORY-1065, prospera-ventes-service#13, `dev` 3242844, ca44566, 5929438) ; ANNONCÉ avant la
  fusion du code (prospera-stories #763), sans écart. — `prospera-ventes-service`, module `facturation` : les
  mentions légales, le PDF figé, le lien public d'envoi.** Fiche : `stories/STORY-1065.md` (D-1065-1 → 15 ; la version
  du manifeste, restée en 1.0.0, monte avec 1066 : D-1065-15). **Ajouts
  seuls** ; **aucun fait ne change** (`facturation.facture.emise@1` ne porte ni mention ni PDF) ; **manifeste
  `facturation` amendé** (C7 : + `facturation:parametres:modifier`, recopié à l'octet dans `ventes`).
  - **Routes neuves** (préfixe `/api/v1/facturation`) : `GET /parametres` (un droit du module) et `PUT /parametres`
    (`facturation:parametres:modifier` ; corps `{ versionAttendue, valeurs, motif }` ; 400 `PARAMETRES_INVALIDES`
    `details.erreurs`, 409 `PARAMETRES_VERSION_PERIMEE`) : `valeurs = { emetteur: { raisonSociale, formeJuridique,
    capital, adresseDuSiege, nif, rccm, regimeFiscal, rib, mobileMoney }, mentionsExigees: [codes], penalitesDeRetard,
    escompte, dureeDuLienJours (7), conservationAnnees (10) }` ; `GET /factures/{factureId}/pdf`
    (`facturation:facture:consulter` ; `application/pdf`, `ETag`, `X-Empreinte-Sha256` ; 409 `PDF_EN_ATTENTE`,
    `PDF_INDISPONIBLE` ; 404 `FACTURE_INCONNUE` ; 500 `PDF_ALTERE`) ; `POST /factures/{factureId}/liens`
    (`facturation:facture:emettre`, `Idempotency-Key` ; 201 `{ lienId, factureId, numero, url, creeLe, expireLe, etat,
    ouvertures, rejeu }`, l'`url` rendue une seule fois, `null` au rejeu) ; `GET /factures/{factureId}/liens`
    (consulter ; jamais le jeton) ; `POST /factures/{factureId}/liens/{lienId}/revocation` (émettre ; 404 `LIEN_INCONNU`) ;
    **`GET /liens-publics/{jeton}`, publique** (sans compte : le PDF `inline` ; 404 `LIEN_INCONNU`, 410 `LIEN_EXPIRE`,
    `LIEN_REVOQUE`, 503 `PDF_EN_ATTENTE`, 429 au-delà de 30 ouvertures par minute et par adresse).
  - **Routes changées** (ajouts) : `POST /factures` peut refuser **409 `MENTION_OBLIGATOIRE_MANQUANTE`** (`details.manquantes
    : [{ code, fiche: ORGANISATION | POINT_DE_VENTE | ARTICLE | PARAMETRES, id }]`, aucun numéro consommé) ; la facture
    rendue gagne `parametresVersion`, `mentions` (émetteur, client, désignations, pénalités, escompte, conservation) et
    `pdf { etat: EN_ATTENTE | PRODUIT | ECHEC, empreinteSha256, octets, produitLe }`.
  - **Collections neuves** : `facturation_parametres`, `facturation_clients_lus` et `facturation_articles_lus` (futures
    projections de `pdv` et de `catalogue`, remplies par personne aujourd'hui), `facturation_pdfs`,
    `facturation_liens_publics`. **Configuration** : `FACTURATION_LIENS_BASE_URL`, `FACTURATION_PDF_INTERVALLE_MS`.
    **Dépendance** : `pdfkit` 0.19.1 (épinglée) ; polices Liberation Sans (SIL OFL 1.1) dans le dépôt.
  - **Pour B** : voir « Demandes aux autres groupes » (le droit au catalogue de tenant d'`auth`).

- **PUBLIÉ (2026-11-18, STORY-1064, prospera-plateforme#37, `dev` 50c12a6, étiquette `jeu-grossiste-golfe-v1.2` ;
  prospera-ventes-service#12, `dev` edb3f8f) ; ANNONCÉ avant la fusion du code (prospera-stories #715), sans écart. —
  `prospera-plateforme`, jeu « Grossiste du Golfe » 1.2.0 : le fichier des comptes.** Fiche : `stories/STORY-1064.md`
  (D-1064-1 → 9). Aucun manifeste, aucun fait, aucune route, aucun droit ne change ; `jeu-demonstration@1` n'est pas
  touché (il est à B).
  - **Fichier neuf** `comptes.json` à la racine de `grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/`
    (8, 16, 44 comptes) : `{ objet, cle, prenom, nom, roleMetier }`, le corps de la pose d'auth (STORY-972). Le bureau
    (`compte` : Akossiwa ATTISSO, Mensah KPOGO, Yawa AMEDOME, Ayité GBADOE), puis un compte par agent (`commercial`,
    `COM-nn`, prénom et nom de `terrain/commercial.json`).
  - **Le jeu 1.2.0** (étiquette `jeu-grossiste-golfe-v1.2` après la fusion) : les neuf fichiers de données de 1.1.0
    inchangés à l'octet ; `jeu.json` change de version, de `generateur.source` et ajoute `generateur.parametres.comptes`.
  - **Identités** : un compte a l'identifiant `identifiantDuJeu(org, objet, cle)` ; celui d'un agent est son commercial de
    `terrain` (et son `saisiePar` chez `commande`). Vecteurs (organisation `665f1c2a9b1e8a0012345678`), figés dans le
    générateur et dans `ventes` : `COM-01` `c6e2275ff50ddb28e5cf12c2`, `AKOSSIWA` `a4408f644e46aee756455091`, `MENSAH`
    `e47c3a156183ff30ed0ffc1a`, `YAWA` `df4829148668086cc8a39a72`, `AYITE` `d2d106c1f6f43af99764ba0c`.
  - **Pour B** : voir « Demandes aux autres groupes » (`comptes` dans `jeu-demonstration@1`, la pose par le catalogue).

- **PUBLIÉ (2026-11-18, STORY-1063, reseau-service#16, `dev` 25de958 → 4b55ac1 ; prospera-plateforme#36, `dev` 26977ca,
  étiquette `jeu-grossiste-golfe-v1.1`) ; ANNONCÉ avant la fusion du code (prospera-stories #712), sans écart. —
  `reseau-service`, routes C13 du module ; `prospera-plateforme`, jeu « Grossiste du Golfe » 1.1.0.** Fiche :
  `stories/STORY-1063.md` (D-1063-1 → 12). **Aucun manifeste amendé** (les routes sont déjà déclarées à
  `routesInstance`), aucun fait neuf, aucun droit neuf.
  - **Routes servies** (au moteur seul, limitées à son organisation, en essai seulement : `KAFKA_ESPACE=ESSAI`) : `POST
    /api/v1/instance/reseau/{organisationId}/import` (`import-c13-demande@1` → `import-c13-reponse@1`), objets
    **`hierarchie`** (`{ profondeurMax, libellesDeNiveaux }` : le gabarit), **`zone`** (`{ cle, nom, type, localites }`,
    sans parent), **`rattachement`** (`{ lieu: POINT_DE_VENTE|ENTREPOT, cle, zone, role: PRINCIPAL|SECOURS }`) ; `POST
    /api/v1/instance/reseau/{organisationId}/effacement` (`FIN_ESSAI` ; `effacement-c13-accuse@1`, `module: reseau`).
    Refus du socle C13 de 1058 (`ESPACE_REEL_REFUSE`, `ENREGISTREMENT_INVALIDE` avec le rang, `REFERENCE_INCONNUE`,
    `IDEMPOTENCE_REUTILISEE`, `IDENTITE_DE_SERVICE_REQUISE`, `ORGANISATION_HORS_JETON`…).
  - **Le jeu 1.1.0** (`jeux-demonstration/grossiste-golfe*/`, étiquette `jeu-grossiste-golfe-v1.1` après la fusion) :
    une part **`reseau`, la première**, avant `commande` et `terrain` ; leurs fichiers de 1.0.0 inchangés à l'octet.
  - **Identifiants** : une zone du jeu a l'identifiant `identifiantDuJeu(org, 'zone', clé)` (celui que `commande` et
    `terrain` portent déjà en `noeudId`) ; un lieu rattaché porte l'identifiant de `commande` (`point-de-vente`,
    `point-de-stock`). La zone d'un point de vente ou d'un point de stock se lit par `GET
    /api/v1/resolution?lieuType=POINT_DE_VENTE|ENTREPOT&lieuId=…` (route existante).
  - **Pour B** : voir « Demandes aux autres groupes » (le passage du catalogue à `v1.1`).

- **PUBLIÉ (2026-11-18, STORY-1062, prospera-ventes-service#11, `dev` 339a1ad → f49f3a6) ; ANNONCÉ avant la fusion du
  code (prospera-stories #698), sans écart ; schémas enregistrés en BACKWARD (Karapace, contre les versions
  d'`origin/dev`). — `prospera-ventes-service`, modules `commande` et `facturation` : le numéro `CMD-`, la commande
  transmise du terrain, l'annulation.** Fiche : `stories/STORY-1062.md`
  (D-1062-1 → 13). **Manifeste `facturation` amendé** (C5) : + consommé `commande.commande.annulee@1` (recopié à l'octet
  dans `ventes`). Le manifeste `commande` ne change pas (`commande.commande.annulee@1` et `commande:commande:annuler` y
  sont déjà).
  - **Fait neuf publié** : `commande.commande.annulee@1` (topic `commande.commande.annulee`, clé
    `<organisationId>:<commandeId>`, schéma `commande.commande.annulee-value` en BACKWARD) : `commandeId`, `numero`
    (`CMD-…` ou `null`), `pointDeVenteId`, `noeudId`, `canal`, `statutAvant`, `motif` (`CLIENT_ANNULE`,
    `ERREUR_DE_SAISIE`, `RUPTURE`, `PLAFOND_DE_CREDIT`, `AUTRE`), `bons` (`bonId`, `numero` `BL-` ou `null`,
    `pointDeStockId`), `annuleeLe`, `rang`. Ni prix, ni montant, ni texte libre. Consommé par `facturation` (même
    groupe `ventes-service.commandes-chiffrees`).
  - **Fait relâché** : `commande.serie.changed@1` porte aussi la série `commandes` (préfixe `CMD-`) : les
    énumérations de `serie` et de `prefixe` sont **retirées** (BACKWARD, vérifié au registre). Un consommateur qui
    gardait la tête des seuls bons filtre `serie = bons-livraison`.
  - **Routes** : `POST /api/v1/commande/commandes` sert le canal `TERRAIN` (la commande naît `TRANSMISE` ; corps
    `+ visiteId?`, `+ lignes[].grilleVersion`, exigée sur ce canal : 400 `GRILLE_VERSION_MANQUANTE` ; 409
    `COMMANDE_PROBABLEMENT_DOUBLE`) ; `CANAL_NON_SERVI` n'est plus rendu. **Neuve** : `POST
    /api/v1/commande/commandes/{commandeId}/annulation` (`commande:commande:annuler`, `Idempotency-Key`, corps `{ motif,
    texte? }`) ⇒ 201 la commande (+ `rejeu`, `liberations`) ; 400 `MOTIF_A_PRECISER` ; 404 ; 403 `HORS_PORTEE` ; 409
    `TRANSITION_INTERDITE`, `COMMANDE_FACTUREE`, `COMMANDE_DEJA_ANNULEE`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`. `POST
    /api/v1/commande/validations` : `+ prixConfirmes?: { revision }` ; 409 `PRIX_CHANGE` (`details` : `revision`,
    `montantTtcMineur`, `lignes` avant et après). `POST /api/v1/facturation/factures` : 409 `COMMANDE_ANNULEE`.
  - **Lectures** (ajouts) : la commande rend `numero`, `revision`, `visiteId`, `ecartDePrix`, `annulation`, `lignes[]
    .grilleVersionAffichee`, `bons[].annuleLe` ; un bon peut être `ANNULE`. Les paramètres de `commande` gagnent
    `fenetreCommandeDoubleMinutes` (30 par défaut, de 1 à 1 440), **facultatif au `PUT`** (la forme de 1049 reste
    valide) et rendu par toute version lue.
  - **Aucun droit neuf** ; `commande:commande:annuler` est déjà dans la table d'accès d'`auth` (DC, RESP_VENTES,
    COMPTABLE). Rien n'est demandé aux autres groupes.

- **PUBLIÉ (2026-11-18, STORY-1061, prospera-ventes-service#10, `dev` 33bd0e7 → 68b293c) ; ANNONCÉ avant la fusion du
  code (prospera-stories #689), sans écart ; schémas enregistrés en BACKWARD (Karapace, contre les versions d'`origin/dev`).
  — `prospera-ventes-service`, module `facturation` : la suite de Sage posée avant la première facture, le format du
  numéro, le règlement de la facture lu chez `paiement`.** Fiche : `stories/STORY-1061.md` (D-1061-1 → 13). Aucun manifeste amendé : le droit (`facturation:numerotation:administrer`), le
  fait publié (`facturation.serie.changed@1`) et le fait lu (`paiement.creance.changed@1`) y sont déjà.
  - **Routes neuves** (garde `FACTURATION_NOT_ENTITLED`, table d'accès) :
    - `PUT /api/v1/facturation/numerotation/factures` (**`facturation:numerotation:administrer`**, le `DAF`) corps
      `{ format: { prefixe, annee, separateur, largeur }, dernierNumero, gelLe }` ⇒ 201 `{ serie, format, reprise:
      { dernierNumero, rang, annee, gelLe, poseeLe, posePar }, dernier, epoque, prochainNumero, rejeu }` ; la même suite
      rejouée : 200 (`rejeu: true`). Refus : 400 `SUITE_INVALIDE` (`details.erreurs`) ; 409 `SUITE_DEJA_REPRISE`, 409
      `NUMEROTATION_DEJA_ENGAGEE` (une facture a déjà été émise par Prospera).
    - `GET /api/v1/facturation/numerotation` (`facturation:numerotation:administrer` ou `facturation:facture:consulter`)
      ⇒ `{ series: [{ serie, format, reprise | null, dernier, epoque, trous, prochainNumero }] }`.
  - **Champ neuf** dans toute facture rendue (`POST /facturation/factures`, `GET …/factures/{id}`, `POST …/creance`) :
    `reglement: { statut: INCONNU|EMISE|PARTIELLE|PAYEE|CLOTUREE, enRetard, joursDeRetard, resteDuMineur,
    resteDuAfficheMineur, encaisseMineur, declareMineur, tropPercuMineur, revision, lueLe }` (montants `null` tant que
    `INCONNU`) : lu de `paiement`, jamais tenu par `facturation`.
  - **Comportement qui change** : une organisation dont la suite est posée numérote ses factures dans le format de la
    suite, à partir du rang repris + 1 (`FAC-2026-8821` ⇒ `FAC-2026-8822`). **Sans suite, rien ne change** (`FAC-AAAA-NNNNNN`
    depuis 1, Q-D-10).
  - **Schémas relâchés (ajout de liberté, rien de renommé ; compatibilité BACKWARD vérifiée au registre avant la
    fusion)** : `facturation.facture.emise-value`, champ `numero` : le motif `^FAC-[0-9]{4}-[0-9]{6,}$` est retiré (le
    numéro suit le format de la série) ; `facturation.serie.changed-value`, champ `prefixe` : l'énumération `["FAC-"]` est
    retirée. **Pour B** (consommateur à venir de `facturation.facture.emise@1`) : ne pas valider le numéro sur `FAC-` ;
    c'est un libellé, la clé reste `factureId`.
  - **Fait publié de plus** : `facturation.serie.changed@1` part aussi à la pose de la suite (`dernier` = le rang repris).
  - **Fait lu de plus** : `paiement.creance.changed` par un groupe neuf, `ventes-service.reglements` (depuis le début),
    variable facultative `KAFKA_REGLEMENTS_GROUP_ID`. **Pour B** : rien à faire ; si la charge change, le dire ici.
  - **Collections neuves** : `facturation_suites_numerotation`, `facturation_creances_lues`.

- **PUBLIÉ (2026-11-18, STORY-1060, prospera-plateforme#32, `dev` 8c61c48, étiquette `calendrier-distributeur-v1` ;
  prospera-terrain-service#4, `dev` fd5f4ee → 17bdba7) ; ANNONCÉ avant la fusion du code (prospera-stories #681), sans
  écart. — `prospera-plateforme` (`contrats/distributeur/`) et
  `prospera-terrain-service` (module `terrain`) : le calendrier de l'organisation, paramètre versionné, lu à l'import.**
  Fiche : `stories/STORY-1060.md` (D-1060-1 → 11). Tout est AJOUT ; un comportement change (la date des plans importés).
  - **Bibliothèque neuve** : `contrats/distributeur/src/calendrier.ts`, étiquette **`calendrier-distributeur-v1`**
    (1.0.0), copiée à l'octet par `terrain` (puis `pilotage`, FR-85). Aucun fichier de B touché (dossier de D déjà lu par
    les scripts racines) ; `contrats/distributeur/package.json` exporte `./calendrier`.
  - **Routes neuves** de `terrain` (garde `TERRAIN_NOT_ENTITLED`, table d'accès) : `GET /api/v1/terrain/parametres`
    (l'un des droits du module) ; `GET /api/v1/terrain/parametres/versions/{version}` (idem ; 404
    `PARAMETRES_VERSION_INCONNUE`) ; `PUT /api/v1/terrain/parametres` (**`terrain:parametres:modifier`**) corps
    `{ versionAttendue, valeurs: { calendrier: { joursTravailles, joursFeries } }, motif }` ⇒ la version suivante ; 400
    `PARAMETRES_INVALIDES` (`details.erreurs`), 409 `PARAMETRES_VERSION_PERIMEE` (`details.versionCourante`). Réponse :
    `{ version, valeurs, effetLe, auteur, motif }`.
  - **Droit neuf** au manifeste `terrain` (amendé dans cette PR, C7) : `terrain:parametres:modifier` ⇒ **→ B** (catalogue
    des droits de tenant). Jusqu'à lui, `PUT` répond 403 `DROIT_INSUFFISANT` à tous (échec fermé).
  - **Comportement qui change** : la route C13 d'import de `terrain` (contrat inchangé) date les plans de journée par le
    calendrier de l'organisation, et non plus « hors dimanche » : un jour férié du calendrier par défaut (25 décembre,
    1er janvier…) est sauté. Chaque plan porte `parametresVersion` (champ neuf de `terrain_plans_de_journee`).
  - **Collection neuve** : `terrain_parametres` (une version par changement, la première posée à la première lecture ou
    au premier import), effacée par la route C13 d'effacement (plan de 1058). Aucun fait publié (D-1060-10).

- **PUBLIÉ (2026-11-17, STORY-1059, prospera-ventes-service#8, `dev` 1c1e944 → bd8d211) ; ANNONCÉ avant la fusion du
  code (prospera-stories #666). Un écart : `COMMANDE_INCONNUE` n'est pas émis (un `commandeId` mal formé rend la 400 de
  validation, une commande inconnue de `facturation` 409 `COMMANDE_NON_FACTURABLE`). Schémas enregistrés en BACKWARD
  (`commande.commande.chiffree-value`, `facturation.facture.emise-value`, `facturation.serie.changed-value`). —
  `prospera-ventes-service`, modules `facturation` et `commande` : la facture émise, sa Créance ouverte dans
  `paiement`, trois faits neufs publiés, la Créance projetée.**
  Fiche : `stories/STORY-1059.md` (D-1059-1 → 12). Tout est AJOUT : aucune route, aucun topic, aucun champ existants ne
  changent. Manifestes amendés dans cette PR (C5) : `commande` publie `commande.commande.chiffree@1` et consomme
  `facturation.facture.emise@1` ; `facturation` publie `facturation.serie.changed@1` et consomme
  `commande.commande.chiffree@1` (les trois noms sont au catalogue `contrats-distributeur-v1`).
  - **Routes neuves** (garde `FACTURATION_NOT_ENTITLED`, droits de la table d'accès, portée du nœud de la commande) :
    - `POST /api/v1/facturation/factures` (`facturation:facture:emettre` ; `Idempotency-Key` exigée) : corps
      `{ commandeId }` (une commande `VALIDEE`) ; 201 la facture `{ factureId, numero (FAC-AAAA-NNNNNN), commandeId,
      mode: DES_LA_VALIDATION, tiersId, perimetre, devise, lignes, montantHtMineur, tva, montantTvaMineur,
      montantTtcMineur, echeanceLe, emiseLe, bons, ouvertureDeLaCreance: { etat: OUVERTE|A_OUVRIR|REFUSEE, motif?,
      tentatives, ouverteLe?, cleRegistre? }, rejeu }`. Rejeu (même clé, ou même commande) : la même facture, aucun
      numéro de plus.
    - `GET /api/v1/facturation/factures/{factureId}` (`facturation:facture:consulter`) ; hors portée ou inconnue : 404
      `FACTURE_INCONNUE`.
    - `POST /api/v1/facturation/factures/{factureId}/creance` (`facturation:facture:emettre`) : relance l'ouverture de
      la Créance (même clé chez `paiement`) ; rend la facture.
  - **Codes neufs** : `CLE_D_IDEMPOTENCE_MANQUANTE`, `COMMANDE_INCONNUE` (400/404), `COMMANDE_NON_FACTURABLE`,
    `CONDITIONS_REGLEMENT_MANQUANTES`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` (409), `HORS_PORTEE` (403),
    `FACTURE_INCONNUE` (404).
  - **Appel sortant** : `PUT {PAIEMENT_SERVICE_URL}/api/v1/creances/sources/FACTURE/{factureId}` (B-963), jeton du
    membre qui émet, corps `{ tiersId, perimetre, montantOrigineMineur, devise, echeanceLe, libelle }`. **Pour B** :
    aucune action ; la route est rejouée sur la même clé (relance, rejeu), comme votre fiche le permet.
  - **Faits neufs** (outbox `socle_outbox`, topic sans `@1`, `schemaVersion: 1`, enveloppe `eventId`, `schemaVersion`,
    `occurredAt`, `organisationId` ; schémas dans `contrat/schemas/`, au registre en **BACKWARD**) :
    - `commande.commande.chiffree` (clé `<organisationId>:<commandeId>`), dans la transaction où la commande passe
      `VALIDEE` : `commandeId`, `pointDeVenteId`, `noeudId`, `canal`, `perimetre`, `devise`, `lignes[{ ligne,
      articleId, pointDeStockId, quantite, prixUnitaireHtMineur, tauxTvaPourDixMille, montantHtMineur }]`, `tva[]`,
      `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur`, `bons[{ bonId, numero, pointDeStockId }]`,
      `valideeLe`, `rang` — **jamais la marge** (donnée privée) ;
    - `facturation.facture.emise` (clé `<organisationId>:<factureId>`) : `factureId` (le `sourceId` de la Créance),
      `numero`, `commandeId`, `livraisonId` (`null`), `tiersId`, `perimetre`, `devise`, `montantHtMineur`,
      `montantTvaMineur`, `montantTtcMineur`, `echeanceLe`, `emiseLe`, `rang` — **la charge que B attend pour son
      consommateur** (D-965-9 ; écart à la proposition : `montantTtcMineur`) ;
    - `facturation.serie.changed` (clé `<organisationId>:factures`) : `serie`, `prefixe`, `dernier`, `epoque`.
  - **Faits lus** (groupes neufs, depuis le début, §1.9) : `ventes-service.creances` (`paiement.creance.changed`,
    `facturation.facture.emise`) ; `ventes-service.commandes-chiffrees` (`commande.commande.chiffree`).
  - **Comportement qui change pour `commande`** : dès que la Créance d'une organisation est projetée, une commande à
    crédit n'est plus refusée `ENCOURS_NON_INSTALLE` : elle est jugée sur l'encours (`PLAFOND_CREDIT_DEPASSE` au-delà) ;
    l'engagement baisse du TTC d'une facture à la réception de sa Créance (et publie son état absolu).
  - **Collections neuves** : `facturation_factures`, `facturation_commandes_chiffrees`,
    `facturation_conditions_reglement` (projection future de `pdv.point-de-vente.changed@1`, remplie par personne
    aujourd'hui), `facturation_series`, `commande_factures`. **Variables** (facultatives) : `PAIEMENT_SERVICE_URL`
    (absente : `A_OUVRIR`, motif `PAIEMENT_NON_CONFIGURE`), `PAIEMENT_DELAI_MS`, `FACTURATION_RELANCE_CREANCE_MS`,
    `KAFKA_CREANCES_GROUP_ID`, `KAFKA_COMMANDES_CHIFFREES_GROUP_ID`.

- **PUBLIÉ (2026-11-17, STORY-1058 ; prospera-ventes-service#7 `dev` 88ee146 → 7f674ef, prospera-terrain-service#3
  `dev` cefe9b9, 068e1c0, prospera-plateforme#30 `dev` d36623b) ; ANNONCÉ avant la fusion du code (prospera-stories
  #662). Aucun écart avec l'annonce ; le `commercial` du jeu porte aussi sa `commune`. — `prospera-ventes-service` (module `commande`),
  `prospera-terrain-service` (module `terrain`) : les routes C13 d'import et d'effacement ; `prospera-plateforme` : le
  jeu « Grossiste du Golfe ».** Fiche : `stories/STORY-1058.md` (D-1058-1 → 14). Tout est AJOUT : aucune route, aucun
  topic, aucun champ existants ne changent.
  - **Routes neuves** (déjà déclarées aux manifestes, `routesInstance`), aux corps exacts de `contrats-instance-v1`
    (copies à l'octet) : `POST /api/v1/instance/commande/{organisationId}/import` et `…/effacement`,
    `POST /api/v1/instance/terrain/{organisationId}/import` et `…/effacement`. Import : `IMPORTE`, puis `DEJA_IMPORTE` ;
    effacement : `EFFACE`, puis `DEJA_EFFACE`. **Seul le jeton de service du moteur** (`identite: MOTEUR`, limité à
    l'organisation du chemin) ; **seulement dans un espace d'essai** (`INSTANCE_ESPACE=ESSAI`, variable neuve des deux
    services, absente ⇒ réel). Refus : 401 `JETON_DE_SERVICE_INVALIDE` ; 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON`, `ESPACE_REEL_REFUSE` ; 400 `IMPORT_HORS_CONTRAT`, `EFFACEMENT_HORS_CONTRAT`,
    `ORGANISATION_INCOHERENTE` ; 409 `IDEMPOTENCE_REUTILISEE` ; 422 `SOURCE_NON_SERVIE` (`DOSSIER_INSTALLATION`),
    `MOTIF_NON_SERVI` (`FIN_CONTRAT`), `OBJET_NON_IMPORTABLE`, `ENREGISTREMENT_INVALIDE`, `REFERENCE_INCONNUE`.
  - **Un jeton de service sur toute autre route** de `ventes` ou de `terrain` : 403 **`IDENTITE_DE_SERVICE_REFUSEE`**
    (code de garde neuf dans les deux services, celui du catalogue et du LC fictif).
  - **Objets importés** : `commande` ← `point-de-vente`, `plafond`, `prix` (ils remplissent `commande_points_de_vente`,
    `commande_plafonds`, `commande_prix`) ; `terrain` ← `commercial`, `point-de-vente`, `plan-de-journee`. Les références
    sont des clefs du jeu, traduites par `identifiantDuJeu(organisationId, objet, clef)` (24 hex de
    `sha256("jeu-demonstration|<org>|<objet>|<clef>")`, D-1058-4) : **pour B** (comptes du jeu, `objet = commercial`), et
    pour les parts futures de `reseau`, `pdv`, `catalogue`, `stock`.
  - **Jeux** : `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/` (deux parts,
    `commande` puis `terrain`), étiquette `jeu-grossiste-golfe-v1`. **Pour B** : `INSTALLATION_SERVICES` doit nommer
    `commande` (ventes) et `terrain` ; une ligne du tableau du README de la plateforme (dossiers de D).

- **PUBLIÉ (2026-11-17, STORY-1057, prospera-assureur-fictif#5, `dev` 51f2639 → f9bbea5) ; ANNONCÉ avant la fusion
  du code (prospera-stories #658). Aucun écart avec l'annonce. — `prospera-assureur-fictif` : les cinq routes de
  vérification C13, la recette de la démo, la boîte aux lettres fermée après un effacement.** Ajouts au cycle
  d'administration (`POST /assureur-fictif/cycle`) : `fermee: true` quand l'organisation est effacée. Fiche :
  `stories/STORY-1057.md` (D-1057-1 → 9). Rien d'existant ne change de forme : ni l'API du LC (`/lc/echange`), ni le fil
  (lots, accusés, numéros), ni l'import et l'effacement C13, ni l'administration.
  - **Routes neuves** (déjà déclarées au manifeste, C13 points 2 et 8), sous le seul jeton de service du **moteur**
    (`identite: MOTEUR`, limité à l'organisation du chemin ; sinon 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON`), hors de la garde du module :
    `POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/<code>`, corps ignoré, `Idempotency-Key`
    acceptée (aucune ne modifie l'organisation). Réponse 200 au contrat **`verification-installation@1`**
    (`{ schemaVersion: 1, code, voyant: VERT|ORANGE|ROUGE, mesure, detail, action? }`, copie à l'octet de
    `platform-catalog-service/contrat/verification-installation.schema.json`). Codes : `assureur-fictif-absent-du-reel`,
    `objets-de-l-annexe-c`, `numero-sans-trou`, `jeu-sans-personne-reelle`, `remise-a-zero` ; tout autre : 404
    `VERIFICATION_INCONNUE`. **Pour B** : `INSTALLATION_SERVICES=assureur-fictif=<url>` suffit ; le LC fictif devient
    installable par un plan dans un espace d'essai. **Dans un espace réel**, le service ne démarre pas (STORY-1048) : la
    vérification `assureur-fictif-absent-du-reel` y est `NON_EXECUTEE` chez le moteur, jamais `VERT`.
  - **Boîte aux lettres** : après un **effacement C13**, le LC ne relève plus la `sortie` de l'organisation ni ne dépose
    rien dans son `entree`, jusqu'au **premier import C13 suivant** ou à une **remise à zéro**, qui écartent alors ce que
    Prospera y avait déposé avant (journal des reçus : `IGNORE`, code neuf **`ANTERIEUR_A_L_EFFACEMENT`**, ou
    `ANTERIEUR_A_LA_REMISE_A_ZERO`). Pour C : rejouer un parcours après un effacement demande des lots neufs, comme
    après une remise à zéro.
  - **La recette** : `npm run recette:demo` (dans l'image : `node dist/modules/assureur-fictif/recette/recette-demo.js`),
    variables `RECETTE_LC_URL`, `RECETTE_ORGANISATION`, `RECETTE_JETON_LC`, `RECETTE_JETON_ADMIN`,
    `RECETTE_JETON_MOTEUR` (ou `RECETTE_EMETTEUR_URL`, qui les fournit), `RECETTE_TAILLE` (`REDUITE` par défaut,
    `DEMO`) ; sortie 0 si la part du LC est verte, 1 sinon. Profil compose **`recette`** (neuf) :
    `emetteur-de-recette` (JWKS et jetons d'essai), `droit-de-recette` (le droit du module sur `entitlement.changed`),
    `recette-demo`. Aucun port publié de plus.

- **PUBLIÉ (2026-11-17, STORY-1056, prospera-ventes-service#6, `dev` 10b8ba5 → 7221f4c) ; ANNONCÉ avant la fusion
  du code (prospera-stories #654). Aucun écart avec l'annonce, sauf un code de plus : `MONTANT_HORS_BORNES` (400, une
  saisie dont un montant dépasse les entiers sûrs). — `prospera-ventes-service`, module `commande` : la saisie, la
  validation branchée sur elle, le bon `EMIS` et son numéro `BL-`, quatre faits publiés.** Fiche :
  `stories/STORY-1056.md` (D-1056-1 → 13). Aucun topic, aucune route existants ne sont renommés. Schémas enregistrés
  sur `commande.*-value` en BACKWARD (`npm run schemas:enregistrer`).
  - **Routes neuves** (garde `COMMANDE_NOT_ENTITLED`, droits de la table d'accès) :
    - `POST /api/v1/commande/commandes` (`commande:commande:saisir` ; `Idempotency-Key` exigée) : corps
      `{ commandeId (UUID né chez l'appelant), pointDeVenteId, canal: BUREAU|TELEPHONE|WHATSAPP|COMPTOIR,
      devise? (XOF), pointDeStockId?, dateLivraisonSouhaitee? (AAAA-MM-JJ), messageClient?, lignes: [{ articleId,
      quantite: { valeur, unite }, pointDeStockId? }] }` ; 201 la commande `BROUILLON` (lignes au prix figé, origine
      et version de grille, totaux HT, TVA par taux, TTC) ; rejeu : la même commande.
    - `GET /api/v1/commande/commandes?limite=` et `GET /api/v1/commande/commandes/{commandeId}`
      (`commande:reseau:consulter` ou `commande:portefeuille:consulter`) : la commande avec son acte et ses bons
      (numéros), dans la portée de lecture ; hors portée, 404 `COMMANDE_INCONNUE`. La marge reste une donnée privée
      (`catalogue:marge:consulter`), `null` tant que le coût de `stock` n'est pas branché.
  - **Route qui prend sa forme définitive** (annoncée « squelette » par 1049, D-1049-9 ; aucun consommateur) :
    `POST /api/v1/commande/validations` reçoit **`{ commandeId }`**, la commande saisie ; les champs du squelette
    (`tiersId`, `perimetre`, `devise`, `montantTtcMineur`, `noeudId`, `margeMineur`, `bons`) sont **refusés** (400).
    L'acte rendu gagne, par bon, `etat: EMIS`, `numero` (`BL-AAAA-NNNNNN`), `rangDansLaSerie`, `epoque`, `emisLe` ; et
    `commande: { statut }`. `POST …/validations/{commandeId}/reservations` (reprise) émet en plus les bons devenus
    complets.
  - **Codes neufs** : `COMMANDE_INCONNUE` (404), `COMMANDE_DEJA_SAISIE`, `POINT_DE_VENTE_INCONNU`,
    `ARTICLE_SANS_PRIX`, `UNITE_NON_VENDUE`, `TRANSITION_INTERDITE` (409), `PDV_HORS_PERIMETRE` (403),
    `COMMANDE_SANS_LIGNE`, `CANAL_NON_SERVI` (400).
  - **Faits publiés** (outbox transactionnelle `socle_outbox`, un seul relais ; topic sans `@1`, `schemaVersion: 1`,
    en-têtes `eventId` et `schemaVersion` ; enveloppe `eventId`, `schemaVersion`, `occurredAt`, `organisationId` ; un
    `rang` par objet ; schémas dans `contrat/schemas/` de `ventes`, au registre sur `<topic>-value` en **BACKWARD**) :
    - `commande.engagement-tiers.changed` (clé `<organisationId>:<tiersId>:<perimetre>`) : `revision`, `tiersId`,
      `perimetre`, `devise`, `restantAFacturerMineur`, `versionEncours` — la forme de l'entrée `engagement`
      d'`encours@1` ; écrit dans la transaction de l'acte ; pour `pdv` et `recouvrement` ;
    - `commande.bon-livraison.emis` (clé `<organisationId>:<commandeId>`) : `bonId`, `commandeId`, `numero`,
      `rangDansLaSerie`, `epoque`, `pointDeStockId`, `pointDeVenteId`, `lignes[{ ligne, articleId, quantite }]`,
      `emisLe` — **sans prix** ;
    - `commande.serie.changed` (clé `<organisationId>:bons-livraison`) : `serie`, `prefixe`, `dernier`, `epoque` ;
    - `commande.commande.validee` (clé `<organisationId>:<commandeId>`) : `commandeId`, `pointDeVenteId`, `noeudId`,
      `canal`, `bons[{ bonId, numero, pointDeStockId, lignes }]`, `valideeLe` — **sans prix ni identité de
      freelance**.
  - **Manifeste `commande`** (prospera-stories, C5) : `publie` gagne `commande.engagement-tiers.changed@1` et
    `commande.serie.changed@1` (faits « nouveaux » d'AD-20) ; recopié à l'octet dans `ventes`.
  - **Collections neuves** : `commande_commandes`, `commande_points_de_vente` et `commande_prix` (read-models,
    projections futures de `pdv.point-de-vente.changed@1` et `catalogue.grille.publiee@1`, **remplis par personne
    aujourd'hui** : sans document, `POINT_DE_VENTE_INCONNU` ou `ARTICLE_SANS_PRIX`), `commande_reservations_de_recette`,
    `socle_outbox`, `socle_verrous`. `commande_bons` gagne `numero`, `rangDansLaSerie`, `epoque`, `emisLe` ; l'état
    `EMIS`.
  - **Variables** (facultatives) : `COMMANDE_RESERVATION_STOCK` (`non-branchee` par défaut ; `recette` **refusée en
    production**), `OUTBOX_RELAIS_INTERVALLE_MS`, `OUTBOX_TAILLE_PAQUET`, `OUTBOX_VERROU_TTL_MS`.
  - **Copie neuve** : `contrats/distributeur/src/index.ts` et `catalogue-faits.json` à `contrats-distributeur-v1`, dans
    `src/socle/contrats-distributeur/` (la copie d'`acces.ts` ne change pas).

- **PUBLIÉ (2026-11-17, STORY-1055, reseau-service#15, `dev` c62f586 → d31f744 ; prospera-plateforme#29, `dev`
  a458b26, étiquette `objets-reseau-v1`) ; ANNONCÉ avant la fusion du code (prospera-stories #650). Aucun écart avec
  l'annonce.** `reseau-service` reçoit la Reprise : `reseau.zone@1.0` et
  `reseau.commercial@1.0`, par `kit-cible` 1.0.1.** Rien d'existant ne change de forme. Ce sont des **ajouts** :
  - **Deux routes neuves** (contrat `reprise-cible.openapi.json` de la plateforme, servi par `traiterRequete` du kit) :
    `POST /api/v1/reprise/reseau/{organisationId}/objets/{zone|commercial}` (`SIMULER`, `APPLIQUER`) et
    `POST /api/v1/reprise/reseau/{organisationId}/controles/{zone|commercial}`. Corps et refus : `enveloppe-reprise@1`,
    `reponse-reprise@1`, `refus-reprise@1`, `controles-*@1`.
    - L'organisation du chemin est celle du jeton (403 `ORGANISATION_HORS_JETON`).
    - L'état publié du module et la matrice décident seuls : 403 `RESEAU_NOT_ENTITLED` ou `ABONNEMENT_EXPIRE`.
    - Ni KYC ni droit de tenant sur ces routes.
  - **Jetons de service** (patron de STORY-948 et de STORY-1046) : `identite` `REPRISE`, `CONNECTEURS` ou `MOTEUR`,
    avec `organisationId`. Ils sont admis sur ces deux routes seulement ; ailleurs, 403
    `IDENTITE_DE_SERVICE_REFUSEE`. Un jeton d'utilisateur n'est jamais ouvert par la matrice sur ces routes.
  - **Deux schémas d'objets** écrits par D dans `prospera-plateforme/contrats/objets/reseau/` (`zone@1.0.json`,
    `commercial@1.0.json`, étiquette `objets-reseau-v1`) :
    - **zone** : `code`, `nom`, `type`, `parent` (référence vers une zone), `localites`, `statut` (`OUVERT`, `FERME`) ;
    - **commercial** : `prenom`, `nom`, `email`, `telephone`, `statutEmploi`, `etat` (`EN_POSTE`, `PARTI`), `zone`
      (référence vers une zone), `affecteDepuis`, `partiLe`.
    - Les deux admettent `VIVANT` et `HISTORIQUE`. Valeurs de contrôle : `statut` et `etat`, lues sur l'objet vivant.
  - **Manifeste `reseau`** : `objetsDeReprise` ne change pas (`reseau.zone@1`, `reseau.commercial@1`). Son
    commentaire dit ce qui est servi (prospera-stories `manifestes/reseau.manifest.ts`, recopié à l'octet dans le
    service).
  - **Faits** : aucun topic neuf, aucun champ neuf. Une reprise appliquée publie les faits existants, par l'outbox,
    dans sa transaction : `reseau.noeud.created@1`, `reseau.noeud.closed@1` (zone `HISTORIQUE`),
    `reseau.commercial.changed@1` et `reseau.portee.changed@1` quand la hiérarchie change une portée résolue. `SIMULER`
    ne publie rien.
  - **Collections neuves** : `reprise_fiches`, `reprise_cles`, `reprise_resultats`, `reprise_lots`, `reprise_traces`.
    Les collections métier ne gagnent aucun champ.
  - **Exploitation** : l'analyseur JSON du service passe de 100 Kio à 2 Mio (le kit répond 413 au-delà de 1 Mio) ;
    `ajv` passe en dépendance d'exécution.
  - **L'import par fichier de 1041** (`POST /api/v1/import/compte-rendu`, `POST /api/v1/import`) ne change pas de forme.
    Il juge et écrit par le même moteur des zones (D-1055-2).
  - Fiche : `stories/STORY-1055.md` (D-1055-1 → 13).

- **PUBLIÉ (2026-11-17, STORY-1054, prospera-notification-service#91, `dev` d9de737 → e0a50c0) ; ANNONCÉ avant la
  fusion du code (prospera-stories #647) — `prospera-notification-service` : prévenir l'assuré (2).** Écarts avec
  l'annonce : `DOSSIER_INVALIDE` répond 400 (comme 1051) ; le dépôt ne garde `code` que s'il est un code nommé ;
  `voie` est absente tant qu'un message est en cours de remise. Rien d'existant ne change de forme ; **ajouts** et **deux comportements** qui changent. Fiche :
  `stories/STORY-1054.md` (D-1054-1 → 12).
  - **Routes neuves, appel de service** (même porte que le destinataire, `sinistres-service` seul ; 401
    `JETON_DE_SERVICE_INVALIDE`, 403 `APPELANT_HORS_PERIMETRE`) :
    - `POST /api/v1/service/assurance/dossiers/{dossierId}/consentements`, corps `{ organisationId, finalite,
      decision: "ACCORDE"|"RETIRE", versionTexte? (exigée pour ACCORDE), recueilliLe (ISO), recueilliPar }` ;
      200 `{ dossierId, finalite, obligatoire, etat, decision? }` ; 422 `FINALITE_INCONNUE`, `FINALITE_OBLIGATOIRE`,
      `VERSION_DU_TEXTE_REQUISE`, `DATE_DE_DECISION_FUTURE`, `DOSSIER_INVALIDE`. En ajout seul ; le même acte rejoué
      n'ajoute rien.
    - `GET /api/v1/service/assurance/dossiers/{dossierId}/consentements?organisationId=` : par finalité,
      `{ finalite, obligatoire, etat: ACCORDE|RETIRE|INCONNU, historique[] }`.
    - `GET /api/v1/service/assurance/dossiers/{dossierId}/messages?organisationId=` : par message, `{ evenement, cle,
      finalite, demandeLe, voie: EXTERNE|CLOCHE, canal?, etat: EN_COURS|TRANSMIS|REMIS|LU|NON_REMIS|EN_CLOCHE,
      transmisLe?, remisLe?, luLe?, cloche?: { motif, deposeLe, objet?, corps } }` ; jamais l'adresse.
  - **Finalités** : `SUIVI_DU_SINISTRE` (obligatoire : huit messages, dont les relances) et `INFORMATION_DU_DOSSIER`
    (facultative : `assurance-numero-officiel`).
  - **Comportements qui changent** : (1) le numéro officiel **ne part plus par SMS ou e-mail sans `ACCORDE`** sur
    `INFORMATION_DU_DOSSIER` (échec fermé) : il tombe dans la cloche de l'assuré ; (2) un message qui ne peut pas
    partir (pas de destinataire, canal refusé, envoi en échec sans maillon restant) **tombe dans la cloche** au lieu
    de se perdre au journal, et une relance déposée compte comme donnée (la chaîne ne s'arrête plus faute de
    destinataire).
  - **Collections neuves** (effacées avec l'organisation) : `assurance_messages`, `assurance_consentements`.
  - **Aucun** topic, aucun consommateur, aucune variable d'environnement neufs.
  - **→ C** : voir « Demandes aux autres groupes » (consentements à la déclaration, lecture de l'accusé).
- **PUBLIÉ (2026-11-17, STORY-1053 : prospera-plateforme#28, `dev` e3727f8, étiquette `acces-distributeur-v1` ;
  ventes #5 `dev` 9e626fa ; terrain #2 5b701a8 ; recouvrement #2 2879924 ; pilotage #2 faa553a ; croissance #2
  a035e61) ; ANNONCÉ avant la fusion du code (prospera-stories #638) — les 15 rôles appliqués par les cinq services du
  distributeur** (`prospera-ventes-service`, `-terrain-`, `-recouvrement-`, `-pilotage-`, `-croissance-service`) et
  la bibliothèque `acces-distributeur` (`prospera-plateforme/contrats/distributeur/src/acces.ts`, étiquette
  `acces-distributeur-v1`, rien d'existant n'y change). Aucun topic, aucun champ n'est renommé ni retiré ; **ce qui
  change, ce sont des refus et une variable requise.** Fiche : `stories/STORY-1053.md` (D-1053-1 → 9).
  - **Écart avec l'annonce** : les deux réglages facultatifs s'appellent `DROITS_DELAI_MS` et `DROITS_CACHE_TTL_MS`,
    comme dans `reseau` (D-1053-10), au lieu des `AUTH_DROITS_*` annoncés. Rien d'autre.
  - **Variable neuve, REQUISE dans les cinq services** : `AUTH_SERVICE_URL` (auth-service, pour
    `GET /api/v1/moi/droits`) ; facultatives : `DROITS_DELAI_MS` (2 000), `DROITS_CACHE_TTL_MS` (60 000, 60 s
    au plus), `KAFKA_DROITS_MEMBRES_GROUP_ID`, `KAFKA_PORTEES_GROUP_ID`. Une pile sans `AUTH_SERVICE_URL` ne démarre
    plus.
  - **Refus neufs sur toute route d'un module** (après la garde du module) : **403 `DROIT_INSUFFISANT`** (le membre n'a
    pas le droit que la route déclare) et **503 `DROITS_INDISPONIBLES`** (auth injoignable, plus de 2 s, réponse
    illisible). ⚠ **Un membre sans rôle `DIST_*` n'a plus accès à aucun module des cinq services** (D-960-12), y compris
    `TENANT_ADMIN` : `GET /<module>/module` et `GET /<module>/piste` exigent l'un des droits du module (manifeste, C7).
    Le module `support-client` est fermé à tous tant que ses droits ne sont pas au catalogue.
  - **Faits consommés en plus par les cinq services** : `reseau.portee.changed@1` (groupe `<service>.portee-reseau`,
    projection `socle_portees_reseau`) et `identity.droits.changed@1` (groupe `<service>.droits-membres`, invalidation
    du cache). Chaque service passe `conformite-portee-reseau-v1` et s'inscrit au registre de `reseau` pour ses
    modules.
  - **`commande` (`ventes`)** : `PUT /api/v1/commande/parametres` exige le droit **neuf**
    `commande:parametres:modifier` (au lieu de `TENANT_ADMIN`) — **403 pour tous jusqu'à ce qu'auth l'attribue** (→ B
    plus bas) ; `GET /api/v1/commande/series` et les émissions de recette exigent `commande:bon-livraison:emettre` ;
    valider et reprendre la saga exigent `commande:commande:valider` ; lire un acte, `commande:reseau:consulter` ou
    `commande:portefeuille:consulter`. **Route neuve** : `GET /api/v1/commande/validations?limite=` (les actes du
    périmètre). **Corps de `POST /commande/validations`** : deux champs AJOUTÉS, facultatifs, `noeudId` (ObjectId hex)
    et `margeMineur` (entier). **Lecture filtrée par la portée** : un acte hors du périmètre rend 404
    `VALIDATION_INCONNUE` ; un acte sans nœud n'est visible que d'une portée totale. **Code neuf** : 403 `HORS_PORTEE`
    (créer ou reprendre hors de l'écriture). **Donnée privée** : `margeMineur` est **absent** de l'acte rendu à qui n'a
    pas `catalogue:marge:consulter`.
  - **Manifeste `commande`** (prospera-stories) : droit AJOUTÉ `commande:parametres:modifier` (D-1053-7, Q-D-5) ; copié
    à l'octet dans `ventes`.

- **PUBLIÉ (2026-11-17, STORY-1052, prospera-plateforme#27, `dev` 1fe8c5e, étiquette `series-v1.1` ;
  prospera-ventes-service#4, `dev` 32d8b5f → e4a27c7) ; ANNONCÉ avant la fusion du code (prospera-stories #632) —
  `series-v1.1` (plateforme) et les séries hébergées de `prospera-ventes-service`.** Rien d'existant ne change de
  forme ; `series-v1` ne bouge pas. Écart avec l'annonce : une variable de plus, `LOG_PRETTY` (facultative ; par
  défaut rien ne change), pour qu'une pile de recette démarre sur l'image runtime. sha256 de `series/src/index.ts` à
  `series-v1.1` : `68833b1af555ab70f50054f11f9bfddf37316d692082d11bd62b8a42f37a13a4`.
  - **`series-v1.1`** (`prospera-plateforme/series/src/index.ts`, version `1.1.0`, majeur 1, compatible avec
    `series-v1`) : ajouts seulement — `new Series(depot, prefixes, { ancre, horloge })` (sans ancre : comme v1),
    `confirmer`, `reconcilier`, `reconcilierTout`, `etat`, `lister`, `ancreMongo`, `ancreEnMemoire`, types
    `TrouDeclare`, `EtatDAncre`, `AncreDesSeries`, `Reconciliation`, `NiveauxMongo` ; méthodes **facultatives** du
    dépôt (`sauter`, `lister`, `enTransaction`, `assurer`, `lireEngage`) ; refus neufs `ANCRE_INDISPONIBLE`,
    `DEPOT_INCOMPLET`, `SERIE_INSTABLE` ; `NumeroEmis.trou` n'apparaît que lors d'un saut. `emettre`, `amorcer`,
    `tete`, `reprendreApresRestauration` gardent leur forme (la reprise déclare désormais son trou dans la série).
    **Changements de comportement de `depotMongo`** (plus stricts) : hors transaction, `w: majority`, `j: true`,
    `wtimeoutMS` 10 s et lecture `linearizable` (`maxTimeMS` 10 s) ; `lire` passe la session ; en transaction, la
    série est créée **hors** de la transaction avant l'incrément (`assurer`). Étiquette `series-v1.1` posée à la
    fusion ; empreinte dans la fiche.
  - **`ventes`** : variables neuves, facultatives — `SERIES_ANCRE_URI` (l'ancre, base à part ; absente :
    `SERIES_SANS_ANCRE` au journal), `MONGODB_MEMBRES_PORTEURS_MIN` (1 par défaut ; 3 en hébergé : sinon le service
    **ne démarre pas**, `JEU_DE_REPLIQUES_INSUFFISANT`), `SERIES_EMISSIONS_DE_RECETTE` (`actif` refusé en
    production). Collections neuves : `commande_series` (une série par organisation, `<organisationId>:bons-livraison`),
    `commande_numeros_de_recette` ; dans la base de l'ancre, `series_ancre`. Routes neuves (garde
    `COMMANDE_NOT_ENTITLED`, `TENANT_ADMIN` jusqu'à 1053) : `GET /api/v1/commande/series` (têtes, époques, trous
    déclarés) ; `POST /api/v1/commande/series/{serie}/emissions-de-recette` (fermée sauf recette). Codes neufs de
    `commande` : `SERIE_INCONNUE`, `ROUTE_DE_RECETTE_FERMEE`. Journal : `SERIE_DERIVE` (erreur, l'alerte d'AD-32) quand
    une restauration est constatée. Compose neuf : `docker-compose.heberge.yml` (trois membres, ancre). Aucun fait
    publié, aucun topic.
  - **→ B** : voir « Demandes aux autres groupes » (information).

- **PUBLIÉ (2026-11-17, STORY-1051, prospera-notification-service#90, `dev` 7d4b24d → b3d4388) ; ANNONCÉ avant la
  fusion du code (prospera-stories #620) — `prospera-notification-service` : prévenir l'assuré (1).** Rien d'existant
  ne change de forme ; ajouts seulement. Écart avec l'annonce : aucun.
  - **Fait consommé** : `sinistres.dossier.changed@1` (contrat de C, inchangé), groupe neuf `notification-assurance`
    (`KAFKA_ASSURANCE_GROUP_ID`). Un message part au **changement** d'état du dossier, côté assuré seulement
    (D-1051-3) ; `FRAUDE_SUSPECTEE`, `LITIGE`, `REJETE`, `SANS_SUITE` et les états internes ne produisent rien.
  - **Route neuve, appel de service** : `PUT /api/v1/service/assurance/dossiers/{dossierId}/destinataire` (jeton de
    service, appelant **`sinistres-service`** seul ; corps `{ organisationId, canal: "sms"|"email", destinataire,
    langue? }` ; 200 `{ dossierId, canal, langue, enregistreLe }`, l'adresse n'est jamais rendue ; 403
    `APPELANT_HORS_PERIMETRE`, 422 `IDENTIFIANT_NON_NORMALISABLE`, `CANAL_NON_SERVI_A_L_ASSURE`). Sans destinataire
    enregistré, aucun message ne part (`CANAL_ABSENT`, journalisé).
  - **Appelant de service neuf** : `sinistres-service` entre à `JETONS_DE_SERVICE` ; son périmètre sur
    `POST /api/v1/service/envois` (AD-27) est limité aux neuf modèles `assurance-*`.
  - **Neuf modèles système** (SMS et e-mail, `fr`/`en`) : `assurance-declaration-enregistree`,
    `assurance-pieces-attendues`, `assurance-relance-pieces`, `assurance-dossier-ouvert`, `assurance-numero-officiel`,
    `assurance-offre-envoyee`, `assurance-cheque-a-retirer`, `assurance-reglement-effectue`, `assurance-dossier-clos`.
    Variables : `reference` (et `numeroOfficiel` pour le numéro officiel), rien d'autre.
  - **Refus neuf** : `CONTENU_INTERDIT_A_L_ASSURE` (422) à la création ou à la nouvelle version d'une surcharge d'un
    modèle `assurance-*` qui porte une donnée de santé, un montant d'indemnité, le mot « fraude » ou une variable hors
    liste.
  - **Relances de pièces** : file BullMQ `notification:relances-pieces` (Redis déjà requis), trois au plus, espacées de
    5 jours sur l'horloge de référence (`RECETTE_HORLOGE_AVANCE_JOURS` en recette).
  - **→ C** : voir « Demandes aux autres groupes ».

- **PUBLIÉ (2026-11-17, STORY-1050, reseau-service#13, `dev` a3d2f59, et #14, `dev` 49c4d01) ; ANNONCÉ avant la
  fusion du code (prospera-stories #613) — `reseau-service` : la garde lit l'état publié, les
  droits viennent de `/moi/droits`, le commercial est republié quand son compte change.** Aucun topic, aucune route,
  aucun champ n'est renommé ni retiré du fil ; ce qui change, ce sont **trois comportements**.
  - **La garde du module** lit `etat-publie.changed.<espace>@1` (contrat figé `contrat-etat-publie-v1`, groupe neuf
    `reseau-service.etat-publie`, espace par `KAFKA_ESPACE`, `REEL` par défaut) et décide par la garde partagée
    `garde-etat-publie-v1` copiée à l'octet. **`entitlement.changed` n'est plus lu** (groupe `reseau-service.droits`
    arrêté). Mêmes codes : `RESEAU_NOT_ENTITLED` (aucun état reçu, état inconnu, `NON_INSTALLE`, `SUSPENDU`,
    `ESSAI_TERMINE`, `DESINSTALLE`, `EN_INSTALLATION`), `ABONNEMENT_EXPIRE` (écriture en `LECTURE_SEULE`).
    **Pour B (catalogue)** : une organisation dont le droit `reseau` date d'avant le moteur se lit `NON_INSTALLE` tant
    que `migrate:reamorcage-moteur` n'a pas été joué ; la couverture lit `pdv`, `stock`, `freelance` de la même façon
    (installé = lecture ouverte à l'utilisateur).
  - **Les droits du module** (`reseau:noeud:consulter`, `reseau:noeud:modifier`, `reseau:decoupage:modifier`,
    `reseau:affectation:modifier`, `reseau:portee:attribuer`) sont lus par `GET {AUTH_SERVICE_URL}/api/v1/moi/droits`
    (B-949), avec le jeton de l'appelant ; seuls les `droits` de tenant comptent. La table rôle → droits du service est
    retirée. Cache 60 s au plus, relu sur un `dv` plus récent, invalidé par `identity.droits.changed@1` (groupe
    `reseau-service.droits-membres`). Depuis #14 : les droits effectifs sont `droits ∪ droitsHorsJeton` (`/moi/droits`
    1.1.0 de B-960 ; absent = `[]`). **Code neuf** : 503 `DROITS_INDISPONIBLES` (auth injoignable, délai de 2 s,
    réponse illisible). **Variable neuve, requise** : `AUTH_SERVICE_URL`. ⚠️ **En réel, toute route du module qui exige
    un droit répond 403 `DROIT_INSUFFISANT` jusqu'à ce qu'auth-service attribue les droits `reseau:*`** (B-960 ; voir
    « → B » plus haut), comme la comptabilité (D-959-4).
  - **`reseau.commercial.changed@1`** est désormais **republié quand seul l'état du compte change** (`etatDuCompte` :
    invitation, acceptation, suspension, appartenance) **ou le compte lié** (`userId`), à la réception du fait
    `identity.*`. Même topic, même clé (`organisationId`), même charge, même `rang` (il suit les écritures du commercial,
    comme pour une affectation). Un consommateur reçoit donc des faits de plus, en état absolu ; il garde le plus
    récent par `commercialId` (`occurredAt`). Consommateur aujourd'hui : aucun (pdv, demain) ; **→ C pour
    information** : `sinistres` ne lit que `reseau.portee.changed@1`, qui ne change pas (la suite
    `conformite-portee-reseau-v1` passe toujours).

- **PUBLIÉ (2026-11-17, STORY-1049, prospera-ventes-service#3, `dev` c8f5fd2) ; ANNONCÉ avant la fusion du code
  (prospera-stories #605) — `prospera-ventes-service`, module `commande` : les garde-fous.** Aucun fait publié, aucun topic, aucun contrat existant ne change. Ajouts seulement, **sans consommateur
  aujourd'hui** (ni écran, ni service).
  - **Routes** (garde `COMMANDE_NOT_ENTITLED`) : `GET /api/v1/commande/parametres` (version courante),
    `GET /api/v1/commande/parametres/versions/{version}`, `PUT /api/v1/commande/parametres` (`TENANT_ADMIN` jusqu'à
    D-1053 ; corps `{ versionAttendue, valeurs, motif }`), `GET /api/v1/commande/tiers/{tiersId}/credit` (le
    disponible à crédit, FR-187), `POST /api/v1/commande/validations` (l'acte, `Idempotency-Key` exigée ; **squelette** :
    sa forme définitive vient avec la saisie, STORY-1056), `GET /api/v1/commande/validations/{commandeId}`,
    `POST /api/v1/commande/validations/{commandeId}/reservations` (reprise de la saga).
  - **Codes de refus neufs** : `PARAMETRES_INVALIDES`, `PARAMETRES_VERSION_PERIMEE`, `PARAMETRES_VERSION_INCONNUE`,
    `CLE_D_IDEMPOTENCE_MANQUANTE`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`, `COMMANDE_DEJA_VALIDEE`, `VALIDATION_INCONNUE`,
    `PLAFOND_INCONNU`, `CREDIT_BLOQUE`, `STOCK_NON_INSTALLE`, `ENCOURS_NON_INSTALLE`, `ENCOURS_INCALCULABLE`,
    `PLAFOND_CREDIT_DEPASSE` (ceux de la spine gardent son sens).
  - **Échec fermé, pour information de B et de qui construira `pdv`** : tant que la Créance (B-963, B-965) n'est pas
    projetée dans `commande`, ses sources sont `ABSENTE` et **toute commande à crédit est refusée**
    `ENCOURS_NON_INSTALLE` ; sans plafond connu du tiers, `PLAFOND_INCONNU`. Ce que `commande` attend de
    `pdv.plafond.changed@1` (fait du catalogue, schéma non fixé) : par `(tiersId, perimetre)`, un état absolu avec une
    `revision` croissante, `devise`, `statut` `FIXE` (avec le montant en unité mineure) ou `SANS_OBJET`, et `suspendu`
    (le crédit bloqué, FR-189). De la Créance : rien de neuf (voir « → B, ce que la bibliothèque d'encours lit »).

- **PUBLIÉ (2026-11-17, STORY-1048, prospera-assureur-fictif#4, `dev` 4f4aa89) ; ANNONCÉ avant la fusion du code
  (prospera-stories #597) — `prospera-assureur-fictif` : le démarrage et la remise à zéro.** Rien ne change sur le fil ni dans l'API du LC (`/lc/echange`).
  - **Démarrage** : le LC fictif lit désormais l'espace de l'instance, **`INSTANCE_ESPACE`** (STORY-934, `ESSAI` |
    `REEL`). `ESSAI` démarre ; `REEL`, toute autre valeur ou une chaîne vide **refusent**, même avec
    `FICTIF_ESPACE=essai`. `FICTIF_ESPACE=essai` seule (piles de C, STORY-986) **démarre comme avant** ; posées toutes
    deux, elles doivent s'accorder. Le refus arrête le processus avant tout chargement (aucune connexion, aucun port) :
    une ligne JSON sur la sortie d'erreur (`"code":"ASSUREUR_FICTIF_INTERDIT"`, `motif` parmi `ESPACE_REEL`,
    `ESPACE_INCONNU`, `ESPACES_EN_DESACCORD`, `AUCUNE_PREUVE_D_ESSAI`), puis le **code de sortie 78**. Le compose du
    dépôt pose `INSTANCE_ESPACE=ESSAI` et `FICTIF_ESPACE=essai`.
  - **Remise à zéro** (`POST /api/v1/assureur-fictif/remise-a-zero`) : elle efface aussi l'**entrée** que le LC a écrite
    et **écarte** ce que Prospera avait déposé dans `sortie` avant elle (inscrit au journal des reçus, `IGNORE`, code
    `ANTERIEUR_A_LA_REMISE_A_ZERO`, jamais relu ; rien n'est supprimé de `sortie`). Réponse : `{ lots }` devient
    `{ lots, sortieEcartee, entreeEffacee }` (ajouts). Ce que Prospera dépose après la remise à zéro est reçu
    normalement.

- **PUBLIÉ (2026-11-17, STORY-1047, prospera-plateforme#24, `dev` b061cec, étiquette `encours-v1`) ; ANNONCÉ avant la
  fusion du code (prospera-stories #589) — `encours@1`, bibliothèque neuve** (`prospera-plateforme/encours/` ; rien
  d'existant ne change). sha256 : `src/index.ts` `4b5c9bff…`, `vecteurs-or.json` `23e3c260…` (complets dans la fiche). Consommateurs : `commande`
  (STORY-1049, qui juge), `pdv` (le disponible à crédit), `recouvrement` (l'évaluation du blocage), chacun par **copie à
  l'octet** de `encours/src/index.ts` et de `encours/vecteurs-or.json`, vecteurs d'or rejoués dans ses tests (AD-2).
  - **La règle** (AD-9, FR-52), par `(tiers, périmètre)` : `encoursCertain = Σ restantCertain des Créances OUVERTE +
    restantAFacturer de l'engagement − Σ solde des crédits du tiers` ; `encoursAffiche`, la même avec `restantAffiche`
    (encaissements déclarés en moins). L'encours **certain** juge, dit « dépassé » et sert au blocage ; l'affiché se
    montre (D-1047-2, Q-D-4). Pas de champ `encours` nu (comme `restant` chez `paiement`).
  - **API** : `calculerEncours(entree, le)` (date `AAAA-MM-JJ` en paramètre, aucune horloge) ;
    `disponibleACredit(plafond, resultat)` (`CALCULE` | `NON_INSTALLE` | `SANS_OBJET`) ;
    `jugerPlafond(plafond, resultat, supplementMineur)` (`ACCEPTEE` | `REFUSEE` `PLAFOND_CREDIT_DEPASSE`, strict |
    `NON_INSTALLE` | `SANS_OBJET`) ; `VERSION_ENCOURS = '1.0.0'`, `MAJEUR_ENCOURS = 1`.
  - **Entrée** : trois sources `{ statut: 'ABSENTE' }` ou `{ statut: 'PRESENTE', faits }` — `creances` (états absolus de
    `paiement.creance.changed@1` : `creanceId` = `<source>:<sourceId>`, `revision`, `tiersId`, `perimetre`, `devise`,
    `statut` `OUVERTE`|`CLOTUREE`, `restantCertainMineur`, `restantAfficheMineur`, `echeanceLe`), `creditsTiers`
    (`paiement.credit-tiers.changed@1` : `creditId`, `revision`, …, `soldeMineur`), `engagement`
    (`commande.engagement-tiers.changed@1` : `revision`, …, `restantAFacturerMineur`, `versionEncours`). Par clé, la plus
    haute `revision` l'emporte, quel que soit l'ordre d'arrivée.
  - **Refus nommés** (`RefusEncours.code`) : `ENTREE_INVALIDE`, `DATE_INVALIDE`, `HORS_TIERS`, `HORS_PERIMETRE` (AD-31 :
    jamais filtré en silence), `DEVISE_DIFFERENTE`, `REVISION_INCOHERENTE`, `VERSION_ENCOURS_DIFFERENTE` (l'engagement
    porte la version de la fonction ; un autre majeur est refusé), `MONTANT_HORS_BORNES`.
  - **Hors de l'encours** (D-1047-3) : Créance `CLOTUREE` ; autre tiers, périmètre ou devise (refusés) ; commandes non
    validées ; le montant d'une dérogation **reste** dans l'encours (c'est `recouvrement` qui l'exclut de son évaluation,
    en `1.x` avec sa story).

- **PUBLIÉ (2026-11-17, STORY-1046, prospera-assureur-fictif#3, `dev` 626b93e ; plateforme #23, `jeu-assurance-v1`) —
  ajouts seulement** (annoncés ici avec la PR de docs, juste après la fusion du code : rien d'existant ne change de
  forme).
  - `POST /api/v1/instance/assureur-fictif/{organisationId}/import` et `…/effacement` (déjà déclarées au manifeste),
    aux corps exacts de `contrats/instance/` (`contrats-instance-v1`) ; refus 400 `IMPORT_HORS_CONTRAT`,
    `EFFACEMENT_HORS_CONTRAT`, `ORGANISATION_INCOHERENTE` ; 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON` ; 409 `IDEMPOTENCE_REUTILISEE` ; 422 `OBJET_NON_IMPORTABLE`, `ENREGISTREMENT_INVALIDE`.
  - Le LC fictif lit les jetons de service (STORY-948) : 403 `IDENTITE_DE_SERVICE_REFUSEE` hors des routes C13 ; 401
    `JETON_DE_SERVICE_INVALIDE` pour une identité inconnue.
  - Les jeux `assurance-compagnie-demo@1.0.0` (`jeu.json` sha256 `f58ddf1a…`) et
    `assurance-compagnie-demo-reduite@1.0.0` (`23602877…`) : une version publiée ne change plus.

- **PUBLIÉ (2026-11-17, STORY-1045, prospera-plateforme#21, `dev` baa38dd) — deux contrats neufs** (rien d'existant ne
  change ; aucun fichier hors des dossiers de D).
  - **`catalogue-faits@1`** (`contrats/distributeur/`, étiquette `contrats-distributeur-v1`) : le catalogue des faits
    d'AD-20 (129 noms) et la garde `verifierFaitsDuModule`. **Pour B** : les 18 faits déjà codés de `paiement` y sont,
    sans `@1`, avec les trois faits de l'amendement du 2026-11-13 ; un fait **neuf** de `paiement` (Créance, B-963 et
    B-965 : `paiement.creance.changed@1`, `.credit-tiers.changed@1` y sont déjà) qu'un module du distributeur lit doit
    y entrer avant d'être consommé : le demander ici. **Pour C et la microfinance** : les faits que vos spines ou PRD
    ajoutent aux modules du noyau (`recouvrement`, `equipe`, `dashboard`…) y entrent de la même façon, avec leur source.
  - **`vocabulaire@1`** (`vocabulaires/`, étiquette `vocabulaires-v1`) : un tableau par verticale (`distributeur`,
    `imf`, `assurance`), clés neutres, `null` = sans objet. Les colonnes IMF et assurance sont celles du PRD
    distributeur (propositions) : **une correction se demande à D** (écart connu : le PRD microfinance §3 met
    « client » avant « membre »).

- **PUBLIÉ (2026-11-16, STORY-1036, reseau-service#7, `dev` 17dcf14) — `reseau.portee.changed@1`, contrat neuf** (rien d'existant ne change). Producteur
  unique : `reseau-service`. Consommateurs attendus : **C-1004** (sinistres), puis pdv, stock et le distributeur.
  - **Topic** `reseau.portee.changed` (le `@1` est la version du contrat, pas du nom) ; **clé** `<organisationId>:<userId>` ;
    schéma `reseau-service/contrat/schemas/reseau.portee.changed.json`, enregistré dans Karapace sur
    `reseau.portee.changed-value` en **BACKWARD** (modèle fermé : ajouts facultatifs seulement, sinon un `@2`).
  - **Corps** : `schemaVersion: 1`, `eventId`, `occurredAt`, `organisationId`, `userId`, `statut` (`ATTRIBUEE` |
    `RETIREE`), `lecture` et `ecriture` (`{ totale: true }` **ou** `{ totale: false, noeuds: [ObjectId…] }`), `version`
    (portée déclarée), `revision` (publication, croissante par clé), `versionDecoupage`.
  - **État absolu et RÉSOLU** : la liste des nœuds est déjà calculée (héritage, exclusions) ; le consommateur n'a pas
    l'arbre. Il se republie quand l'arbre change la résolution (nœud créé sous un nœud hérité, déplacement).
  - ⛔ **Fail-closed, à appliquer chez le consommateur** (AD-6) : aucun fait pour l'utilisateur, un fait `RETIREE`, ou
    `noeuds: []` ⇒ **zéro** enregistrement. Seul `totale: true` ouvre tout. Garder par clé le fait de plus haute
    `revision`. L'écriture est toujours contenue dans la lecture.
  - Client de Confluent : créer le topic avant de s'abonner et `metadataMaxAge: 10_000` (règles §1.9).
  - La suite de conformité (six cas) et le registre des consommateurs arrivent avec **STORY-1037**, avec un ticket à C.

## Questions à l'utilisateur ou au PO

- **Q-D-12 (2026-11-24, STORY-1065) — Qui tient la fiche légale de l'organisation (raison sociale, forme juridique,
  capital, siège, NIF, RCCM, régime fiscal, RIB, compte Mobile Money) qu'imprime chaque facture ?** FR-44 la veut « lue
  de la fiche de l'Organisation », mais aucun service ne la porte : `auth` publie le nom, le pays et le logo
  (`identity.org.*`), `kyc` ne publie aucune donnée déclarée. **Choix par défaut (D-1065-2) : le DAF la saisit dans les
  paramètres versionnés de `facturation`** (`PUT /api/v1/facturation/parametres`, droit `facturation:parametres:modifier`),
  jamais en dur ; le jour où un propriétaire la publie (`auth`, ou une fiche de l'organisation du moteur), `facturation`
  la lit. **Et A-1 reste à faire** : la liste de travail des mentions (quatorze codes, toutes exigées par défaut) et la
  durée de conservation (10 ans) attendent l'expert-comptable du client avant la recette de la facture ; elles se
  corrigent par le même paramètre, sans développement.

- **Q-D-11 (2026-11-18, STORY-1060) — Quels jours fériés le calendrier par défaut déclare-t-il ?** Choix par défaut
  (D-1060-4) : du lundi au samedi travaillés ; dix jours fériés légaux du Togo que l'on sait dater : 1er janvier, lundi
  de Pâques, 27 avril, 1er mai, Ascension, lundi de Pentecôte, 21 juin, 15 août, 1er novembre, 25 décembre. Les fêtes
  musulmanes (Aïd el-Fitr, Tabaski, Maouloud s'il est chômé) se déclarent par l'organisation en `DATE`, chaque année.
  **À confirmer** : la liste, et le 13 janvier. Une organisation la change par `PUT /api/v1/terrain/parametres`.

- **Réponses de l'utilisateur (2026-11-18, journal de A, « → D »)** : Q-D-1 → Q-D-8 et Q-D-10 **confirmées** (les choix par
  défaut tiennent ; Q-D-7 : vérifier que « SAREX » est bien fictif ; Q-D-8 : l'utilisateur cherche des documents
  générables pour le jeu) ; **Q-D-9 renversée** ⇒ STORY-1060 ; Q-D-10 : la reprise du dernier numéro de facture
  (`facturation.suite-numerotation@1`) se pose avant la première facture d'un client qui quitte Sage.

- **Q-D-10 (2026-11-17, STORY-1059) — Une organisation qui n'a rien à reprendre de Sage émet-elle ses factures dès
  `FAC-AAAA-000001` ?** AD-5 veut que la série des factures reprenne le dernier numéro de Sage, posé une fois par la
  Reprise (`facturation.suite-numerotation@1`), et refuse l'émission tant qu'elle ne l'est pas
  (`NUMEROTATION_NON_INITIALISEE`). La Reprise de la facturation (EPIC-244) n'existe pas encore. **Choix par défaut : la
  série démarre à 0** (essai, démonstration, client sans Sage) ; la reprise devra se poser avant la première facture
  d'un client qui migre (EPIC-244 refusera une initialisation après elle). Alternative : refuser toute facture tant que
  la suite n'est pas posée, au prix de bloquer l'essai.

- **Q-D-9 (2026-11-17, STORY-1058) — Les jours d'un plan de journée du jeu sautent-ils le seul dimanche ?** **Renversée par l'utilisateur le 2026-11-18** :
  un calendrier propre à chaque organisation ⇒ STORY-1060. Le jeu dit
  « aujourd'hui et les dix jours ouvrés suivants » (FR-9). **Choix par défaut : le dimanche est chômé, le samedi
  travaillé** (commerce de gros au Togo) ; les jours fériés ne sont pas sautés. Alternative : un calendrier en
  paramètre de l'organisation (C6), qui changerait la résolution à l'import.

- **Q-D-8 (2026-11-17, STORY-1057) — La vérification C13 `objets-de-l-annexe-c` est-elle verte sans documents
  (C-10) ?** Le générateur du jeu n'en produit pas. **Choix par défaut : `VERT`**, C-10 nommé `SANS_OBJET` dans le
  détail (avec C-18 et C-19, exports tirés de Prospera, jamais déposés au LC) ; demande à C pour les documents.
  Alternative : `ORANGE` (le moteur n'installerait plus le LC fictif) tant que le jeu n'a pas de documents.
- **Q-D-7 (2026-11-17, STORY-1057) — Les noms de l'annexe E (« Estelle Lawson », « Komlan », « SAREX ») sont-ils à
  garder ?** Ce sont ceux de la démo d'origine ; le jeu fictif en a d'autres (Estelle Kpodar, Koffi Mensah, cabinets
  fictifs). **Choix par défaut : la recette lit la personne par son rôle dans le jeu**, la part du LC ne juge aucun nom
  (D-1057-8). Alternative : le générateur de C reprend les noms de l'annexe (s'ils sont fictifs, FR-202).

- **Q-D-6 (2026-11-17, STORY-1054) — Quels messages à l'assuré demandent son consentement ?** FR-19 veut un
  consentement par finalité ; FR-36, FR-48 et FR-18 font des étapes du dossier des messages dus. **Choix par défaut :
  seul le numéro officiel (« assuré (information) », FR-146) est facultatif** (`INFORMATION_DU_DOSSIER`, échec
  fermé) ; les relances de pièces restent du suivi obligatoire (D-1054-6). Alternative : rendre les relances
  facultatives aussi (une ligne de la table des finalités).
- **Q-D-5 (2026-11-17, STORY-1053) — Quel droit change les paramètres de `commande` ?** AD-12 nomme le DG et
  `DIST_ADMIN` ; l'annexe B n'a pas de droit pour ce geste. **Choix par défaut : un droit propre,
  `commande:parametres:modifier`, donné au DG et à `DIST_ADMIN`** (D-1053-7), comme `commande:plafond:deroger` l'a été le
  13/11. Alternative : se contenter d'un droit existant (`dashboard:alerte:configurer`, qui va déjà au DG et à
  `DIST_ADMIN`), au prix d'un sens détourné.

- **Q-D-4 (2026-11-17, STORY-1047) — La commande se juge-t-elle sur l'encours certain ou sur l'encours affiché ?** Le
  PRD dit qu'un encaissement déclaré (espèces, virement) « diminue l'encours affiché » et que le blocage « lit le reste
  dû confirmé », sans trancher pour le plafond. **Choix par défaut : l'encours certain** (D-1047-2) : un encaissement
  déclaré mais non confirmé ne libère pas de crédit ; celui qui déclare ne confirme pas (FR-P60).
- **Q-D-1 (2026-11-16, STORY-1031) — Le KYC dans la garde de `reseau` en mode « sur site ».** La spine (AD-10)
  exige le KYC Money Vibes de l'organisation ; une instance installée chez le client (EPIC-148) n'aura pas forcément
  de `kyc-service`. **Choix par défaut : KYC exigé partout** (D-1031-2), à revoir avec l'agent d'instance.
- **Q-D-2 (2026-11-16, STORY-1034) — Q3 du PRD réseau** : une personne peut-elle être affectée à des nœuds de branches
  différentes ? **Choix par défaut : oui** (avis du PRD, le superviseur itinérant ; D-1034-1).
- **Q-D-3 (2026-11-16, STORY-1035) — Qui est la racine de l'autorité sur les portées ?** Sans racine, personne ne peut
  attribuer la première portée (AD-8 : nul n'attribue plus que la sienne). **Choix par défaut : le `TENANT_ADMIN` de
  l'organisation**, qui détient par son rôle une portée totale pour la gouvernance, non publiée (D-1035-3). Les portées
  « totales » attribuées à quelqu'un d'autre lèvent l'alerte CM-2.

## Pièges rencontrés

- **STORY-1065** :
  - (1) **Un PDF à police embarquée n'a pas de texte lisible dans ses flux** (glyphes en hexadécimal) : un test qui
    cherche « FAC-2026-000001 » dans les octets ne trouve rien. Vérifier les mentions par un espion sur
    `PdfDocument.prototype.text` (unitaires) et lire le PDF servi avec un vrai lecteur (`pdfjs-dist` de
    `document-service`, hors des dépendances du service, `scripts/recette/1065/texte-du-pdf.mjs`) ; `pdfjs` rend l'espace
    insécable comme une espace : comparer sans elle. Les métadonnées (`/CreationDate`, `/Title`) sont des objets
    indirects : chercher `(D:…)`, pas `/CreationDate (D:…)`.
  - (2) **Le cache des droits est par membre (piège 1056-3) a resservi** dans un test HTTP : un membre lu d'abord avec
    d'autres droits garde ceux-là ; un refus (403) se prouve avec un membre neuf, et chaque jeu de droits a son membre.
  - (3) **Le verrou a été tenu 87 min par B (1080, recette complète)** : code, unitaires sous Node 25, mutations pures,
    lint, recette et fiche faits d'abord ; boucles bornées de 9 min ; une prise, toutes les preuves d'affilée (41 min).
  - (4) **Un `docker compose up` lancé pendant la construction `--no-cache` prend l'ancienne image du même nom** (la
    construction n'avait pas fini) : attendre « IMAGES OK », vérifier `docker images` (« Created ») et le contenu de
    l'image (les polices dans `dist`) avant de lever la pile du rejeu ; la pile levée trop tôt a été descendue sans
    preuve.
  - (5) Une mutation qui retire un décorateur rend son import inutile (`noUnusedLocals`) : la garder par
    `...[Public()].filter(() => false)`. Un heredoc Python long avec des apostrophes a encore échoué : script ou
    remplacements par l'outil d'édition.

- **STORY-1064** :
  - (1) **Le piège 1063-2 (CRLF du journal) a resservi**, aggravé : un script de remplacements corrigé par un second
    script **écrit par heredoc** a perdu ses antislashs (`\r\n` devenus de vraies fins de ligne), puis réécrit en mode
    texte sous Windows (chaque `\n` devenu `\r\n`, et `\r\n` devenu `\r\r\n`). Écrire ces scripts **avec l'outil
    d'écriture**, et y nommer les fins de ligne par `chr(13)` et `chr(10)`, jamais par un littéral (§1.7).
  - (2) **Sous Node 25, deux suites de `ventes` rougissent** (`app.module.invariant`, `app-cablage.invariant` : elles
    chargent l'`AppModule` et le client Kafka natif) : attendu ; la suite complète se juge sous Node 24 (étage
    `verification`).
  - (3) **Un contrat fermé** (`additionalProperties: false`) qu'on ne tient pas : ne rien y glisser (le jeu serait refusé
    par `jeu:verifier` et par le catalogue) ; poser le fichier à côté, le vérifier par son propre test (la règle de
    `verifierJeu` jouée par le test, plus les règles du consommateur), et demander le champ au groupe qui tient le
    contrat.
  - (4) Le verrou Docker était tenu par B (975, pris à 22:55) : tout ce qui ne demandait pas Docker (code, tests sous
    Node 25, mutations, PR, annonce fusionnée) a été fait d'abord ; attente par boucles bornées de 9 min ; une prise.

- **STORY-1063** :
  - (1) **Une mutation qui rend une variable « peut-être `undefined` »** (`if (!noeud && …) throw`, puis `noeud.nature`)
    ne compile pas (TS18048) : muter l'appel (`if (lignes.length < 0) await exigerLesZones(…)`). Retirer une constante
    d'un tableau rend son import inutile (`noUnusedLocals`) : la garder par `...[X].filter((c) => c.length < 0)`.
  - (2) **Le journal de D et le tracker sont en CRLF dans `_wt-d-stories`** (`core.autocrlf=true`) ; une fiche neuve écrite
    par l'outil est en LF : un remplacement Python sur `\n` ne trouve rien dans le journal. Normaliser à la lecture, rendre
    les fins de ligne d'origine à l'écriture (script de remplacements de la session).
  - (3) **Un pilote HTTP sur la pile, entre deux `docker compose exec`** : le serveur ferme la connexion gardée ouverte
    (5 s), `fetch` échoue « other side closed » au milieu d'un import ; et des organisations fixes rendent le pilote non
    rejouable après un passage partiel. Rejouer sur `UND_ERR_SOCKET` (la route est idempotente) ; deux organisations
    neuves à chaque passage.
  - (4) **Le kit des cibles assemble le nom de ses collections à l'exécution** (préfixe `reprise_`) : l'invariant du plan
    d'effacement ne les lit pas dans les sources ; elles sont nommées dans la part, et un test vérifie que le kit les crée.
  - (5) Le verrou Docker était libre au rituel suivant (B l'avait rendu) : tout ce qui ne demandait pas Docker (générateur,
    code, unitaires sous Node 25, lint) était fait avant ; une seule prise, toutes les preuves d'affilée.
  - (6) **Sous charge (une construction `--no-cache` en parallèle)**, une passe d'intégration a compté un échec que la sortie
    résumée ne nommait pas, et un `docker exec … mongosh` du pilote a échoué sans message (déjà vu en 1061-4). Rejouées
    seules : vertes (deux fois). Ne pas jouer une suite pendant une construction ; garder la sortie complète (`●`), pas
    seulement le résumé, pour pouvoir nommer un échec.

- **STORY-1062** :
  - (1) **Une course réelle ne prouve pas à chaque passage** : le test de dix états concurrents (même sur trente objets)
    n'a montré le défaut que deux fois sur trois ; une mutation a survécu. Rendre la course **déterministe** : un espion
    sur `updateOne` du modèle joue l'écrivain concurrent (la ligne d'un état plus ancien) puis lève l'erreur 11000.
  - (2) **Karapace refuse une contrainte ajoutée** : remplacer une énumération par `minLength: 1` est `INCOMPATIBLE` ;
    retirer l'énumération sans rien ajouter est BACKWARD. Vérifier la compatibilité **avant** d'enregistrer (le script
    s'arrête au premier refus, mais il avait déjà enregistré les sujets précédents).
  - (3) **L'invariant des modules isolés vaut aussi pour les tests** : un `*.spec.ts` de `commande` qui importe le
    lecteur de `facturation` le fait rougir. La lecture du fait se prouve dans `facturation`, sur un fait écrit à la main
    et validé contre le schéma publié.
  - (4) Une série de plus (`commandes`) change les lectures qui listent les séries (`GET /commande/series`) et un
    paramètre de plus change toute version lue (`parametres.valeurs`) : des tests HTTP de 1052 et 1049 les comparaient
    en `toEqual`. Les jouer tous sous Node 24 avant de pousser.
  - (5) Une commande Docker longue (`jest` complet) dépasse les 180 s de l'outil et part en arrière-plan : écrire sa
    sortie dans un fichier et attendre ce fichier, une suite par conteneur, en parallèle.
  - (6) La session a été coupée une fois par une erreur réseau pendant l'écriture de la recette ; le travail non commité
    était intact. Commiter par étapes (test rouge, correctif, la story) avant de longues écritures.

- **STORY-1061** :
  - (1) **Deux classes `@Schema` du même nom dans deux modules d'un même service** (`CreanceLue` de `commande` et de
    `facturation`) : le nom de la classe est celui du modèle Mongoose, et la connexion est partagée ; l'un écrivait dans la
    collection de l'autre, sans erreur de compilation ni de démarrage. Seuls les tests d'intégration de 1059 (rouges sur
    des montants) l'ont montré. Invariant `src/modeles-uniques.invariant.spec.ts` : nommer un modèle par son module.
  - (2) **Un upsert conditionnel sur une ligne absente perd le plus récent sous concurrence** (déjà vu en 1050) : un test
    de dix états simultanés passait deux fois sur trois. Jouer chaque test de concurrence **plusieurs fois** avant de
    conclure (cinq passages d'affilée ici).
  - (3) **Karapace juge un motif modifié incompatible, un motif retiré compatible** : un relâchement passe par le retrait
    (motif, énumération), jamais par un motif élargi ; témoin joué.
  - (4) Sous Git Bash, un `docker exec` (producteur et consommateur de console Kafka) échoue parfois sans message sur le
    poste chargé, et le consommateur sort sur son délai avec un code non nul : le pilote rejoue et lit la sortie, pas le
    code.
  - (5) Les commandes passent en arrière-plan après 180 s : attendre sur le **fichier de sortie** que la commande écrit,
    pas sur la sortie de la tâche (un `grep` sur le mauvais fichier n'aboutit jamais). Un heredoc avec des apostrophes et
    des antiquotes a encore échoué : script écrit par l'outil d'écriture.

- **STORY-1060** :
  - (1) **Un mutant « lu hors de la transaction » survit aux tests d'intégration de l'import C13** : les références se
    vérifient avant l'écriture, si bien qu'aucun lot refusé n'atteint `ecrire` ; et lire le calendrier hors de la session
    rend le même résultat sans concurrence. Le tuer par un test unitaire de `ecrire` sur une connexion factice qui note la
    session de chaque appel.
  - (2) **L'invariant du plan d'effacement lit `collection: '…'` en clair dans les sources** : un `@Schema({ collection:
    UNE_CONSTANTE })` lui échappe (la collection paraît inconnue, le plan « nomme une coquille »). Écrire le nom en clair
    dans le décorateur, et vérifier la constante par un test.
  - (3) **`python - <<'EOF'` avec des accents dans le script** : sous Git Bash, l'entrée standard n'arrive pas en UTF-8 et
    une assertion `s.count(…) == 1` échoue sur un motif accentué ; la commande suivante (après `;`) tourne quand même.
    Écrire le script au fichier (outil d'écriture), le lancer avec `python -X utf8`, et chaîner par `&&`.
  - (4) Le verrou Docker était libre au rituel ; tout ce qui ne demandait pas Docker (règle, tests locaux sous Node 25,
    mutations unitaires, annonce fusionnée, pile et pilote écrits) a été fait **avant** de le prendre : une seule prise.

- **STORY-1059** :
  - (1) **`eslint --fix` retire un `as string` devenu inutile après une garde** (`if (c.creanceId !== \`…\`)` rétrécit
    le type) : une mutation qui affaiblit la garde (`&& …`) casse alors la compilation (TS2322). Muter vers une garde
    qui garde le rétrécissement (`typeof c.creanceId !== 'string'`).
  - (2) **Une vérification redondante rend une mutation équivalente** : `FacturesDuModule` et `OuverturesDesCreances`
    vérifient tous deux « déjà `OUVERTE` » ; muter l'un survit. Éprouver le chemin intérieur directement (`tenter`), et
    la condition d'écriture (`$ne: 'OUVERTE'`) par une tentative qui finit **après** une ouverture concurrente.
  - (3) **Un état absolu rejoué à l'identique ne prouve pas « la plus haute révision »** : `updateOne` sur `$lte` rend
    `modifiedCount: 0` si le contenu ne change pas. Rejouer la même révision **avec un autre contenu**.
  - (4) **`paiement` met le `sourceId` en majuscules dans l'identifiant du registre** (`…|FACTURE:D079FA5B-…`), pas dans
    `creanceId` (`FACTURE:d079fa5b-…`) ni dans `referenceExterne` : ne jamais rapprocher par `cleRegistre`.
  - (5) **La pile avec le vrai `paiement`** : il est `unhealthy` par construction (fournisseurs déclarés sans
    raccordement) : `depends_on` en `service_started`, vivacité sur `/api/v1/health/live` ; son MongoDB exige les
    scripts de `mongo/` du dépôt en LF (`git -c core.autocrlf=false archive`), montés en lecture ; il lit le KYC
    (`kyc.status.changed`, `APPROVED`) et son droit (`entitlement.changed`, `moduleCode: paiement`) sur Kafka ; le jeton
    porte les deux audiences et `perms: ['paiement:demande:emettre']` (lu dans le jeton, pas dans `/moi/droits`).
  - (6) **Le rejeu de `terrain` laissé par 1058 a pris dix minutes** sous le verrou (image `--no-cache` en arrière-plan,
    pilote en commande courte) : le jouer dès la prise du verrou, avant les preuves de la story.

- **STORY-1058** :
  - (1) **`terrain-service` hors `NODE_ENV=production` ne démarre pas** dans l'image `runtime` : `pino-pretty` (dépendance
    de développement) y manque ; `ventes` lit `LOG_PRETTY`, `terrain` non. Une surcouche de recette de `terrain` garde
    `production` (à corriger avec une story du socle de terrain).
  - (2) **Une mutation qui laisse un import ou un paramètre inutilisé ne compile pas** (`noUnusedLocals`,
    `noUnusedParameters`) : muter la condition (`… && false`, `'REPRISE'` pour `'MOTEUR'`), jamais retirer la ligne.
  - (3) **Un banc qui lève « aucun refus »** fait rougir le test sur une exception, pas sur l'assertion : rendre un
    résultat sentinelle (`AUCUN_REFUS`) que l'`expect` compare.
  - (4) **Express plafonne un corps JSON à 100 Ko** : un lot C13 de 500 plans de journée le dépasse ;
    `app.useBodyParser('json', { limit: '10mb' })` dans `main.ts`.
  - (5) **Une suite longue (rejeu complet) lancée en arrière-plan avec une attente qui boucle** a bloqué la session :
    commandes courtes, une étape à la fois, et le verrou rendu aussitôt la pile descendue.

- **STORY-1057** :
  - (1) **Un `foo.ts` et un `foo.json` dans le même dossier** (`annexe-e.ts`, `annexe-e.json`) : `import … from
    './annexe-e'` charge le JSON sous `ts-node` et jest (« not iterable ») ; le `dist` compilé, lui, marche. Nommer le
    JSON autrement (`table-annexe-e.json`). Déjà vu en 1051 : à éviter d'emblée.
  - (2) **`cat > fichier` sans entrée en tête d'une commande** attend la console : la commande ne finit jamais (tâche
    d'arrière-plan à arrêter). Et un heredoc mange encore l'antislash d'un `'\n'` dans un script Python : écrire au
    fichier, ou par l'outil d'édition.
  - (3) **Les e2e chargent `AppModule`** (la chaîne de gardes) : elles tirent le client Kafka natif et ne tournent que
    sous Node 24, dans l'image `verification` ; les unitaires purs tournent sous Node 25 en local.
  - (4) Un `tsc --noEmit` local écrit `dist/tsconfig.tsbuildinfo` (incrémental) : supprimer `dist/` avant de rendre
    le checkout.
  - (5) Sous Git Bash, `docker compose run -e RECETTE_RAPPORT=/tmp/r.json` réécrit le chemin en chemin Windows :
    `MSYS_NO_PATHCONV=1`.
  - (6) Un message d'échec énorme (une expression régulière sur 46 000 lignes) dépasse le tampon de `spawnSync` : la
    mutation paraît survivre (« Tests: ? »). Écrire l'assertion sur une liste courte (`filter` puis `toEqual([])`).
  - (7) **Un contrôle de rejeu « mêmes réponses » survit à un état gardé** (deux parties identiques, mais fausses) :
    exiger aussi les réponses attendues au rejeu.
  - (8) `rm -rf "$S/…"` est refusé par la garde de l'outil : écrire `"${S:?}"/…`.

- **STORY-1056** :
  - (1) **`docker build` sur ce poste passe par le constructeur `desktop-linux` (pilote `docker-container`)** : sans
    `--load`, l'image reste dans le cache de build et `docker images` ne la voit jamais (« No output specified »). Une
    attente « jusqu'à ce que l'image existe » tourne alors sans fin : construire avec `--load`.
  - (2) Un tableau de promesses de refus créées d'avance (`[['CODE', service.saisir(…)], …]`) les lance toutes en
    parallèle ; leurs rejets sont pris en charge trop tard et jest compte un échec par rejet. Mettre des fonctions
    (`() => service.saisir(…)`) et les appeler une par une.
  - (3) Un test HTTP qui veut un 403 pour un membre « avec moins de droits » doit prendre un **membre neuf** : le cache
    des droits est par membre (60 s), un jeton réduit d'un membre déjà lu garde ses anciens droits.
  - (4) Karapace a encore répondu 500 au premier enregistrement juste après `healthy` (§1.9) : rejouer.
  - (5) Une mutation qui retire la seule lecture d'un paramètre (`empreinte`) casse la compilation
    (`noUnusedParameters`) : la tourner (`&& empreinte.length > 0`).
  - (6) Un heredoc Python de plus de ~180 lignes, ou qui porte des antiquotes, échoue (« unexpected EOF ») : script écrit
    par l'outil d'écriture, puis lancé.

- **STORY-1055** :
  - (1) **La version d'un lot du kit vaut par `lotId`** : un banc qui livre des zones puis des commerciaux sous le même
    lot voit `INCHANGE/VERSION_ANTERIEURE`. Il faut un lot par sorte d'objet.
  - (2) **Le verrou Docker a été tenu 80 min par B.** Coder et pousser d'abord tout ce qui ne demande pas Docker :
    tsc, lint, unitaires locaux. Ceux du client de Confluent échouent sous Node 25 (« Could not locate the bindings
    file »), c'est attendu. Puis tout jouer d'affilée sous le verrou.
  - (3) **La suite de conformité doit passer sans retouche** : le banc s'adapte au module (organisations traduites,
    profondeur posée), jamais la suite.
  - (4) **Un manifeste recopié change son empreinte** : mettre à jour `socle/manifestes/sources-des-manifestes.ts`
    (commit et sha256) dans le même commit, sinon `pile-du-moteur.invariant` rougit.
  - (5) **Un script Python passé par heredoc** qui écrit une séquence d'échappement de fin de ligne écrit de vrais
    retours chariot dans son propre source. Un heredoc d'une centaine de lignes avec des apostrophes échoue aussi.
    Écrire le script avec l'outil d'écriture (`chr(13)`).
  - (6) `python -I` ignore `PYTHONIOENCODING` : employer `python -X utf8 -I` pour afficher les émojis du tracker.

- **STORY-1054** : (1) **deux suites e2e de `notification` lancées en parallèle dans deux conteneurs ont fait tomber
  Docker Desktop** (API en 500, conteneurs orphelins) ; une à la fois, `--runInBand --forceExit`, sortie écrite dans
  un fichier du conteneur. Un `--memory 4g` sur la suite unitaire complète fait tomber six suites « failed to run »
  (aucun test rouge) : sans plafond, 287/287. (2) Une mutation `if (false && …)` ou une comparaison sans recouvrement
  casse la compilation (ts-jest) : écrire `… && x.length < 0`. (3) Le motif d'un `Envoi` échoué est le **texte** de
  l'adaptateur (« Le canal SMS n'est pas configuré… »), pas un code : ne le recopier que s'il a la forme d'un code
  nommé. (4) Un heredoc de plus de ~180 lignes échoue (« unexpected EOF ») : bloc écrit par l'outil d'écriture puis
  ajouté par un petit script.

- **STORY-1053** : (1) un émetteur de jetons de recette qui **régénère sa clé** à chaque démarrage, arrêté puis relancé
  (recette « auth arrêté »), fait répondre **401** à tous les services (même `kid`, clé changée, JWKS en cache) : garder
  la clé dans un fichier du conteneur. (2) Une mutation qui retire un appel laisse un import ou un paramètre inutilisé :
  ts-jest refuse de charger la suite (« Test suite failed to run ») ; tourner la mutation pour garder le symbole
  (`… && unParmi.length < 0`, `delaiMs * 1000`). (3) Sous Git Bash, `python` (Windows) ne lit pas `/tmp/…` : écrire
  les réponses de `curl` dans un chemin `cygpath -m`. (4) Le cache des droits compte son âge depuis l'**écriture** :
  une recette longue qui suppose qu'un membre lu au début est encore en cache après `stop` d'auth se trompe (60 s) ;
  prendre un membre jamais lu pour prouver le 503. (5) Un dossier racine neuf dans la plateforme fait rougir
  `test/scripts-racines.test.ts` tant que B ne l'a pas inscrit : mettre le code de D dans un dossier déjà lu
  (`contrats/distributeur/`).

- **STORY-1052** : (1) **deux transactions MongoDB qui créent le même document (upsert) ne se heurtent qu'à
  l'acquittement** : chacune voit son propre document neuf et tire le même numéro ; sur un document qui existe, le
  second incrément est refusé tout de suite (`WriteConflict`, rejoué par `withTransaction`). Une logique qui lit un
  état extérieur pendant la transaction (ici l'ancre) voit alors ce qu'a écrit la gagnante : créer le document hors
  de la transaction avant d'y entrer. Mesuré : rouge une fois sur trois, vert seul ; un diagnostic instrumenté (une
  ligne par appel) l'a montré, pas la relecture du code. (2) `NODE_ENV=staging` sur l'image runtime de `ventes` : pas
  de `pino-pretty`, le service ne démarre pas ; poser `LOG_PRETTY=false`. (3) `docker compose … down -v` lit les
  variables d'interpolation de la surcouche : sans elles, la descente échoue en silence (sortie redirigée) ;
  vérifier `docker ps -a` et `docker volume ls` après. (4) Un heredoc de plus de cent lignes avec des apostrophes et
  des antiquotes échoue au découpage (« unexpected EOF ») : script Python écrit par l'outil d'écriture. (5) Un mutant
  peut être équivalent sur le chemin employé (ancre « état d'après » au lieu d'« état d'avant » avec `$max`) : le
  dire, le remplacer par une mutation qui compte.

- **STORY-1051** : (1) **quatre suites e2e de `notification` sont rouges sur `dev` avant 1051** (témoin rejoué :
  `appel-de-service`, `envois`, `rail-notification` — le banc n'a pas `UtilisateurModel`, ajouté à `EnvoisService` par
  STORY-651 — et `health` — le faux client Kafka n'a pas `admin.listTopics`, depuis STORY-957) : 68 tests rouges des
  deux côtés ; à réparer dans une story de D (dette héritée), pas à confondre avec une régression. (2) Sous jest, un
  `foo.ts` et un `foo.json` dans le même dossier : `import … from './foo'` résout le JSON (ordre `js, json, ts`) ; d'où
  `garde.ts` pour la copie de C. (3) La garde « une seule porte de service » (`appel-de-service.invariant.spec.ts`), la
  garde de suppression complète (toute collection à `organizationId` dans `COLLECTIONS_A_SUPPRIMER`) et le relevé des
  consommateurs supervisés rougissent sur un ajout légitime : les inventorier, avec le motif. (4) L'image `runtime` pose
  `NODE_ENV=production`, qui refuse `RECETTE_HORLOGE_AVANCE_JOURS` : une pile de recette pose `NODE_ENV=staging`. (5)
  `docker run node … /chemin` sous Git Bash : `MSYS_NO_PATHCONV=1` aussi devant `docker create`. (6) `npm run
  test:conformite` complet sur la pile reste bloqué (les autres suites visent des hôtes par défaut `127.0.0.1`) :
  jouer la suite visée par chemin. (7) Un BullMQ `promote()` d'une relance trop tôt la replace à son échéance
  (`moveToDelayed`) : c'est la preuve que rien ne part avant l'intervalle.

- **STORY-1050** : (1) un `docker run … sh -c '… | grep …' | tail` ne montre rien tant que tout n'est pas fini : écrire
  la sortie dans un fichier et le lire ; une suite d'intégration qui casse au montage du module (dépendance Nest
  manquante dans le banc HTTP) ressemble alors à un blocage. (2) Le banc HTTP (`application-http.ts`) prend les
  fournisseurs de `ReseauModule` : tout fournisseur neuf du module dont la dépendance vient d'un module global du socle
  (ici `SuitesDeLIdentite`) doit y être fourni aussi. (3) Une mutation qui laisse une variable inutilisée échoue à la
  compilation (ts-jest) : la tourner pour garder le symbole employé. (4) `git checkout -- <fichier>` pour défaire une
  mutation jouée sur un fichier **non commité** défait aussi le vrai changement : muter seulement après le commit. (5)
  Deux écritures concurrentes sur une ligne absente : l'upsert conditionnel perd le plus récent sur la clé dupliquée ;
  rejouer une fois. (6) Dans une transaction MongoDB, pas de `Promise.all` de lectures sur la même session.

- **STORY-1049** : (1) un banc HTTP monté sur `monterSurMongo` se ferme **base d'abord** (`dropDatabase`, puis
  `app.close()`) : fermer l'application ferme la connexion, et un `dropDatabase` posé ensuite reste en attente pour
  toujours (la suite ne finit pas, `Test suite failed to run` au `afterAll`). (2) Sous MongoDB, deux transactions qui
  écrivent le même document se gênent d'elles-mêmes (conflit d'écriture, la seconde est rejouée par
  `withTransaction`) : une mutation qui retire seulement la condition de révision **survit** ; le verrou se prouve en
  sortant l'incrément de la transaction. (3) `MSYS_NO_PATHCONV=1` aussi devant `docker run -v …:/mutations`, sinon
  Git Bash réécrit le chemin du conteneur.
- **STORY-1048** : (1) un script de mutations qui compte les `✕` ne voit rien quand jest joue plusieurs suites (pas de
  détail par test) : lire `Tests: N failed` et l'absence de `Test suite failed to run`. (2) Les routes d'administration du
  LC fictif passent la garde du module : sur une pile sans catalogue, publier le droit sur `entitlement.changed` par
  `kafka-console-producer.sh` du conteneur Kafka (`orgId`, `moduleCode: assureur-fictif`, `status: ACTIVE`,
  `occurredAt`, `eventId`) ; deux services sur le même groupe de consommateurs se partagent le message. (3) Un pilote
  qui écrit dans le volume d'échange tourne sous l'uid du service (`--user 1000:1000`), sinon le LC ne peut plus créer
  `entree`. (4) `AUTH_ISSUER` et `AUTH_AUDIENCE` sont exigées par `validateEnv` (un `docker run` sans elles sort en 1).

- **Prettier réécrit une copie « à l'octet »** si on lui passe le dossier : STORY-1046 l'a fait sur les schémas C13
  copiés, aussitôt recopiés ; `.prettierignore` de `prospera-assureur-fictif` les exclut désormais
  (`src/modules/*/instance/contrat/*.schema.json`). Toujours revérifier les empreintes après un `prettier --write`.
- `node --test` sous Node 24 (plateforme) résume en `ℹ tests 513 / ℹ pass … / ℹ fail 0`, pas en `# tests` : un `grep`
  sur l'ancien format ne trouve rien et casse la chaîne de commandes.
- Une pile du LC fictif sans auth-service : un petit émetteur RS256 (JWKS + `/jeton?identite=MOTEUR&org=…`) sur le
  réseau `grp-d_default`, et `AUTH_JWKS_URI` pointé dessus ; `publicKey` de `generateKeyPairSync` est déjà un
  `KeyObject` (pas de `createPublicKey` dessus).
- **Verrou Docker du poste** (`MoneyVibes_Apps\.verrou-docker`, une ligne : groupe, story, heure) : B l'a adopté sur ce
  poste ; D le prend avant toute pile ou image et le rend après `down -v`. Une attente de B (STORY-942) a duré ~30 min :
  D a avancé 1033 → 1035 sur des branches empilées pendant ce temps, puis a tout prouvé et fusionné d'une traite.

- Le poste de D est **partagé avec B** (piles `grp-b`) : toujours `docker compose -p grp-d …`, jamais un `down` sans
  `-p` ; ne jamais écrire dans les copies de travail de B (`_wt-b-stories`, `prospera-plateforme`).
- Un JSON écrit par heredoc perd ses antislashs (`"^.+\.(t|j)s$"` de `jest-int.json`) : outil d'écriture seulement.

- Poste de D : Node 25 en local. Le client Kafka de Confluent est natif : les tests se jouent dans le stage
  `verification` du `Dockerfile` (Node 24), `npm ci --ignore-scripts` suffit en local pour `tsc` et le lint.
- Plateforme sous Node 24 sans toucher au `node_modules` du poste :
  `git -c core.autocrlf=false archive HEAD | docker run --rm -i node:24-slim sh -c 'mkdir /w && cd /w && tar -x && npm ci && npm run typecheck && npm test'`
  (sous le verrou ; un test de B y est ignoré : la matrice du catalogue n'est pas dans le conteneur).
- AD-20 ne nomme que quelques exceptions (« les faits que les spines fixent font foi ») : avant de déclarer un nom
  « hors catalogue », chercher sa source (spines, PRD des verticales, `git grep` dans `prospera-paiement-service`).
  STORY-1045 : 25 noms des manifestes en avaient tous une.
