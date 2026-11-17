# Journal du groupe D

> Écrit par le groupe D seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §6 (le frontend, jamais commencé). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5 (backend : `reseau-service`, puis le socle du distributeur).**

## État

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
- **Suivante : STORY-1056** 🚚 la commande (1), dans `prospera-ventes-service` (EPIC-228) : saisie, validation,
  numéro de bon de livraison par les séries (série `bons-livraison`, `NumerotationDesSeries`) ; dépend de 1049 et 1052,
  faites.

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
  `contrats/objets/reseau/` (module `reseau`, README ; **`objets-reseau-v1`** depuis STORY-1055).
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
- **→ Dev A (2026-11-16, D-L2-5, avant le 04/12) : le distributeur.** Ce que D laisse :
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
    montant dérogé pour l'évaluation du blocage (avec la story de `recouvrement`), et la correspondance avec les faits
    de B-963 et B-965 quand ils seront fixés.
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
    4f4aa89). Suite : 1057 (la recette de la démo ; y servir les routes de vérification C13 du manifeste).
  - **Les garde-fous de `commande`** (STORY-1049, `ventes` `dev` c8f5fd2), `src/modules/commande/garde-fous/` :
    - paramètres versionnés (`commande_parametres`, une version immuable par changement, la première écrite à la
      première lecture) ; changés par `TENANT_ADMIN` jusqu'à 1053 ; un acte garde sa `parametresVersion` ;
    - le crédit se lit par le port `SourcesDuCredit` dans des read-models **remplis par personne aujourd'hui** :
      `commande_plafonds` (projection future de `pdv.plafond.changed@1`, avec `suspendu` = crédit bloqué),
      `commande_creances`, `commande_credits_tiers` (à brancher par 1059 sur les faits de B-963, B-965) et
      `commande_sources_encours` : **sans document, la source est `ABSENTE` et toute commande à crédit est refusée**
      (`ENCOURS_NON_INSTALLE`) ; le consommateur de 1059 pose ce document quand `paiement` est en service ;
    - l'acte `POST /api/v1/commande/validations` reçoit la commande dans son corps (squelette, D-1049-9) : **1056** y
      branche la saisie, la bascule `EMIS` et le numéro `BL-` (série `bons-livraison`), la publication de
      `commande.engagement-tiers.changed@1` par une outbox et la copie de `contrats/distributeur/` ;
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
  - **Prochaine story du distributeur : 1056** (la commande (1), premier vrai numéro `BL-` par les séries hébergées ;
    y lire le nœud du point de vente au lieu du corps).

## Demandes aux autres groupes

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
  **ouverte**. Changer les paramètres de `commande` (seuil de remise, score de priorité, alertes, heure de l'allocation
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
