# STORY-1058 : le jeu « Grossiste du Golfe » — `jeu-demonstration@1` en trois tailles, routes C13 de `commande` et de `terrain`

Status: in-progress

**Épic :** EPIC-226 (le jeu « Grossiste du Golfe », l'essai du prospect, la recette des deux parcours) · **Dépôts :**
`prospera-plateforme` (dossiers `jeux-demonstration/grossiste-golfe*/`, tenus par D), `prospera-ventes-service` (module
`commande`), `prospera-terrain-service` (module `terrain`) · **Plage :** groupe D, n° 14 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** STORY-1056 (la commande (1), `ventes` `dev` 7221f4c), faite.
**Suivante :** STORY-1059 🚚 (la facture juste (1)).

**Sources :** PRD distributeur FR-9 (le Grossiste du Golfe), FR-10 (trois tailles), FR-11 (cohérent au centime, dates
relatives au chargement), FR-12 (le jeu dans l'essai, cinq essais simultanés), UJ-1, UJ-2 ; spine distributeur AD-25 (jeu à
graine fixe, aucune sortie réelle, rien de l'essai ne passe au réel) ; spine du moteur C13 point 7, AD-15, AD-38 ;
STORY-953 (B : `jeu-demonstration@1`, `import-c13-*@1`, `effacement-c13-*@1`, étiquette `contrats-instance-v1`) ; patron
STORY-1046 (D : jeu de l'assurance, routes C13 sous `MOTEUR`) et STORY-927, 928 (A : jeu du cabinet, routes de balance et
bilan, garde d'espace) ; STORY-1056 (D-1056-2, D-1056-3 : `commande_points_de_vente` et `commande_prix` remplis par
personne) ; STORY-1053 (invariant : chaque route déclare son droit).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel, lecture (plan, règles, journaux de A, B, D, fiches 1046, 1057, 953, 927, 928, 1056), fiche.
- [ ] Annonce « ⚠ Contrats » (PR de docs courte) fusionnée avant le code.
- [ ] Plateforme `MNV-1058` : générateur et trois jeux, `jeu:verifier` ; PR, fusion, étiquette `jeu-grossiste-golfe-v1`.
- [ ] `ventes` `MNV-1058` : identité de service, espace, routes C13 de `commande` ; tests ; PR, fusion.
- [ ] `terrain` `MNV-1058` : identité de service, espace, routes C13 de `terrain` ; tests ; PR, fusion.
- [ ] Verrou Docker (tenu par B, STORY-967, à 18:03) ; preuves Node 24 et pile `grp-d`, rejouées depuis `origin/dev`.
- [ ] PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le jeu au format `jeu-demonstration@1`, en trois tailles** (`grossiste-golfe-petit`, `grossiste-golfe`, `grossiste-golfe-grand`), produit par un générateur à graine fixe qui se déclare dans `generateur` (nom, source à l'étiquette `jeu-grossiste-golfe-v1`, graine, paramètres) | `npm run jeu:verifier -- <dossier>` de la plateforme, Node 24, pour chaque taille |
| AC-2 | **Même graine, mêmes octets** : deux écritures successives identiques ; l'empreinte du `jeu.json` de chaque taille est figée dans un test | tests de la plateforme |
| AC-3 | **Cohérent** : chaque référence d'une part existe dans le jeu (point de vente, commercial, zone, point de stock, article) ; Kodjo, commercial à Bè, a 14 visites au jour 0 ; les nombres de FR-9 et FR-10 ; TVA 18 % ; prix des exemples du PRD (orange 1 L à 6 000, mangue 1 L à 7 500, cola 33 cl à 5 200) ; aucune date figée | tests de la plateforme |
| AC-4 | **Route C13 d'import de `commande`** `POST /api/v1/instance/commande/{organisationId}/import` et **de `terrain`** `POST /api/v1/instance/terrain/{organisationId}/import`, aux corps exacts d'`import-c13-demande@1` et d'`import-c13-reponse@1` (copies à l'octet) : `IMPORTE`, puis `DEJA_IMPORTE` ; même clef, autre lot : 409 ; une ligne fausse ou une référence absente refuse le lot entier, rien n'est écrit | unitaires ; MongoDB réel ; pile |
| AC-5 | **Routes C13 d'effacement** des deux modules, aux corps d'`effacement-c13-demande@1` et d'`effacement-c13-accuse@1` : tout ce que le module tient de l'organisation (plan nommé, gardé par un test d'inventaire), puis `EFFACE` ; rejouée, `DEJA_EFFACE` ; une organisation témoin reste intacte | MongoDB réel ; pile |
| AC-6 | **L'identité de service `MOTEUR` seule**, limitée à l'organisation du chemin ; un jeton de service sur toute autre route : 403 `IDENTITE_DE_SERVICE_REFUSEE` ; **seulement dans un espace d'essai** (403 `ESPACE_REEL_REFUSE` ailleurs) | e2e ; pile |
| AC-7 | **Chaque route déclare son droit ou son exemption** (invariant de 1053 étendu) : les routes C13 sont exemptées parce qu'elles sont celles du manifeste (`routesInstance`) et n'admettent que `MOTEUR` | unitaires |
| AC-8 | **Après l'import, une commande du jeu se saisit et se valide de bout en bout** (réservation de recette de 1056) : `BL-` émis, commande `VALIDEE` | MongoDB réel ; pile |
| AC-9 | Mutations rouges sur une assertion ; Node 24 ; `docker compose -p grp-d up` ; rejoué sur les images reconstruites depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1058-1 — Deux parts : `commande` puis `terrain`.** Ce sont les deux modules de D qui servent UJ-1 et UJ-2 et que le
  plan nomme (ventes, terrain). Une part dont le module ne sert pas sa route C13 arrêterait l'import (D-953-3) : le jeu ne
  porte donc **ni `reseau`, ni `pdv`, ni `catalogue`, ni `stock`** (les trois derniers n'existent pas ; `reseau` n'a pas
  de route C13). Les données de ces voisins entrent dans le jeu sous la forme où `commande` et `terrain` les **lisent**
  (leurs read-models, projections futures des faits de `pdv`, `catalogue`, `reseau`) : c'est le jeu qui les remplit
  aujourd'hui, comme le demandait 1056 (D-1056-2, D-1056-3). L'historique de trois mois (factures, encaissements,
  relances) et les camions, entrepôts et lots entreront avec `facturation`, `paiement`, `stock` et `entrepot` (version
  `1.x` du jeu, une part de plus par module).
- **D-1058-2 — `reseau` ne reçoit pas de routes C13 dans cette story ; ses zones et commerciaux ne passent pas non plus
  par la Reprise ici.** Lui ajouter l'import et l'effacement C13 serait un quatrième service et tout l'inventaire de
  `reseau` à effacer (EPIC-044 → 053) : c'est une story à part (remplaçante du lot : « les référentiels du distributeur
  côté réseau », EPIC-227). La Reprise de 1055 reste le chemin d'un **vrai** réseau (sources externes, `SIMULER` puis
  `APPLIQUER`) ; elle n'est pas celui d'un jeu de démonstration, que la partie A n'importe que par les routes C13. **Ce qui
  rend le jeu cohérent quand `reseau` le recevra** : la règle d'identifiant de D-1058-4. Sans `reseau`, aucune portée ne
  vise les zones du jeu : seul un membre à portée totale lit et écrit ses commandes (D-1056-2), ce qui suffit à UJ-1 au
  bureau (comptable, DC, DG).
- **D-1058-3 — Trois tailles, un générateur, une graine.** FR-10 : `PETIT` (1 point de stock, 2 zones, 4 agents,
  120 points de vente, 40 articles), `MOYEN` (FR-9, la démo : Lomé Port et Kara, 3 zones, 12 agents dont 3 freelances et
  1 chargé de prospection, 600 points de vente, 72 articles en 5 familles), `GRAND` (4 points de stock, 5 zones, 40 agents,
  2 000 points de vente, 80 articles). Codes `grossiste-golfe-petit`, `grossiste-golfe`, `grossiste-golfe-grand`, version
  `1.0.0`, verticale `DISTRIBUTEUR`. Graine **`20270115`** (le jour des essais). Les trois tailles pèsent quelques Mo : **les
  trois sont versionnées** dans la plateforme. Un client comptoir par point de stock (FR-221) s'ajoute aux points de vente.
- **D-1058-4 — Une référence du jeu est une clef du jeu ; le module qui importe la traduit par une seule règle.** Le jeu
  ne connaît pas l'organisation (la partie A la pose) : il désigne une zone, un point de vente, un article, un point de
  stock, un commercial ou un plan par sa **clef** (`LOME-CENTRE`, `PDV-0001`, `JUS-ORANGE-1L`, `LOME-PORT`, `COM-01`).
  L'identifiant stocké est `identifiantDuJeu(organisationId, objet, clef)` = les **24 premiers caractères hexadécimaux de
  `sha256("jeu-demonstration|<organisationId>|<objet>|<clef>")`** (forme d'un ObjectId) : déterministe (un rejeu retrouve le
  même), propre à chaque essai (cinq essais simultanés sans collision, FR-12), sans état à retenir. Patron de A (D-928-3).
  **Toute part future du jeu** (`reseau`, `pdv`, `catalogue`, `stock`, comptes d'`auth`) crée ses objets sous ces mêmes
  identifiants : les nœuds de `reseau` (`objet = zone`), les comptes des commerciaux (`objet = commercial`). Un vecteur de
  la règle est figé dans les tests des deux services.
- **D-1058-5 — Les objets de la part `commande`** (un fichier chacun, dans cet ordre) :
  - `point-de-vente` `{ cle, zone, pointDeStock }` → `commande_points_de_vente` (nœud = zone, point de stock source) ;
  - `plafond` `{ pointDeVente, devise, statut: FIXE|SANS_OBJET, montantMineur, suspendu }` → `commande_plafonds`
    (périmètre `SOCIETE`, révision 1). Un client au comptant et le client comptoir : `SANS_OBJET` ; un client à crédit :
    `FIXE` ; quelques crédits bloqués (`suspendu`) pour montrer `CREDIT_BLOQUE` ;
  - `prix` `{ grille: SOCIETE|CLIENT, pointDeVente?, article, devise, unite, prixUnitaireHtMineur, tauxTvaPourDixMille,
    grilleVersion }` → `commande_prix`. TVA 18 % (`1800`), donnée du jeu (jamais dans le code, AD-22) ; montants en francs
    (l'unité mineure du XOF dans `commande`).
  Les **sources de l'encours** (`commande_sources_encours`) et les Créances ne sont **pas** importées : elles disent que
  `paiement` est branché, ce qui n'est pas vrai (1059). Une commande à crédit d'un client `FIXE` reste donc refusée
  `ENCOURS_NON_INSTALLE` jusqu'à 1059 ; un client au comptant (`SANS_OBJET`) se valide.
- **D-1058-6 — Les objets de la part `terrain`** : `commercial` `{ cle, prenom, nom, role: COMMERCIAL|FREELANCE|PROSPECTION,
  statutEmploi, zone, telephone }` → `terrain_commerciaux` ; `point-de-vente` `{ cle, nom, categorie, commune, zone,
  position: { latitude, longitude }, telephone }` → `terrain_points_de_vente` ; `plan-de-journee` `{ cle, commercial,
  jourOuvre, visites: [{ ordre, pointDeVente, heurePrevue, motif: VENTE|PROSPECTION }] }` → `terrain_plans_de_journee`.
  Aucun écran ni route de lecture n'est servi ici (les tournées sont EPIC-233) : `terrain` tient les données, les routes
  viendront avec leur story.
- **D-1058-7 — Les dates sont relatives au chargement** (FR-11) : un plan porte `jourOuvre` (0 = le jour de l'import,
  puis les dix jours suivants hors dimanche) ; la route d'import le résout sur l'horloge du service et garde les deux
  (`jourOuvre`, `date`). Le jeu ne contient aucune année.
- **D-1058-8 — Cohérence vérifiée au chargement** (FR-11 : « le chargement échoue si l'une est fausse ») : un plafond ou
  un prix « ce client » qui vise un point de vente absent, un plan qui vise un commercial ou un point de vente absent :
  422 `REFERENCE_INCONNUE` (rang, champ, clef), lot refusé, rien d'écrit. L'ordre des objets du jeu garantit qu'une
  référence est importée avant celui qui la vise.
- **D-1058-9 — L'identité `MOTEUR` seule, dans un espace d'essai seulement** (patrons de 1046 et de A, D-928-1 et
  D-928-2). `ventes` et `terrain` lisent les jetons de service d'`auth-service` (STORY-948 : `identite`,
  `organisationId`) ; `EmailVerifiedGuard` n'ouvre un jeton de service que sur une route `@AdmetIdentitesDeService` :
  ailleurs 403 `IDENTITE_DE_SERVICE_REFUSEE`. Sur les routes C13 : jeton d'utilisateur 403 `IDENTITE_DE_SERVICE_REQUISE`,
  autre organisation 403 `ORGANISATION_HORS_JETON`, identité inconnue 401 `JETON_DE_SERVICE_INVALIDE`. **Espace** :
  `INSTANCE_ESPACE` (la variable de A et de 1048) ; absente ou autre que `ESSAI` ⇒ `REEL` ⇒ 403 `ESPACE_REEL_REFUSE`
  avant toute lecture du corps. `source` `DOSSIER_INSTALLATION` : 422 `SOURCE_NON_SERVIE` ; motif `FIN_CONTRAT` : 422
  `MOTIF_NON_SERVI` (D-953-9). Aucune limite de débit sur ces routes (la partie A envoie des dizaines de lots d'affilée).
- **D-1058-10 — Comment les routes C13 sont exemptées de la table d'accès** (invariant de 1053). Elles ne sont pas des
  routes d'un module (`@ExigeModule`) : un contrôleur d'instance porte `@RoutesDInstance('<module>')` et
  `@AdmetIdentitesDeService('MOTEUR')`. L'invariant `acces.invariant.spec.ts` exige désormais de **tout** contrôleur de
  `src/modules/` : soit `@ExigeModule` et un droit par route (règle de 1053), soit `@RoutesDInstance` avec la seule identité
  `MOTEUR` et des routes qui sont **exactement** celles de `routesInstance` du manifeste du module. Un contrôleur qui ne
  dit ni l'un ni l'autre rougit. Les gardes des modules et des droits ne s'y appliquent pas : l'effacement doit passer
  quel que soit l'état publié (fin d'essai), et le moteur n'a pas de droits de membre.
- **D-1058-11 — Idempotence** (patron de 1046 et D-928-6) : registre par module (`commande_imports_c13`,
  `terrain_imports_c13`, clef unique `(organisationId, idempotence)`), écrit **dans la transaction du lot** ; même clef et
  même lot ⇒ `DEJA_IMPORTE` sans rien réécrire ; même clef, autre lot ⇒ 409 `IDEMPOTENCE_REUTILISEE`. Un enregistrement
  déjà là (même identifiant) est remplacé : le jeu est l'état de référence.
- **D-1058-12 — L'effacement** efface **tout** ce que le module tient de l'organisation, par un plan nommé : pour
  `commande`, toutes les collections `commande_*` (paramètres, plafonds, Créances et crédits lus, sources, engagements,
  actes, bons, commandes, points de vente, prix, réservations et numéros de recette, piste, registre des imports), ses
  séries (`commande_series`, `<org>:…`) et ses faits de l'outbox (`socle_outbox`, topics `commande.*` de l'organisation) ;
  pour `terrain`, `terrain_*` (piste, commerciaux, points de vente, plans, registre). Un test lit les collections déclarées
  par le code du module et rougit sur une collection ni effacée ni exclue avec sa raison. **Exclues** : le registre des
  effacements (organisation, date, décompte, rien de personnel) ; l'**ancre des séries** (hors de la base du service : elle
  garantit qu'aucun numéro n'est réémis, AD-30) ; les **copies du socle** du service (`socle_*` : état publié, portées,
  évènements traités), partagées par ses modules et tenues par leurs propriétaires (moteur, `reseau`). Rejouée sur une
  organisation déjà effacée : `DEJA_EFFACE` avec le premier `effaceLe` ; si des données sont revenues, elles sont effacées
  et l'accusé est `EFFACE` à la nouvelle date. `effaceLe` est lu sur l'horloge du service.
- **D-1058-13 — Le générateur vit dans le dossier du jeu moyen** (`jeux-demonstration/grossiste-golfe/generateur/generer.mjs`,
  JavaScript sans dépendance, hors du typecheck et des tests racines : aucun fichier de B touché), patron de A (D-927-7).
  La spine nomme `prospera-plateforme/jeu-grossiste` : un dossier racine de plus aurait touché le README et les scripts de
  B pour rien. Ses tests sont dans `generateur/` et se jouent par `node --test` sur ce chemin.
- **D-1058-14 — Données fictives** : noms de personnes et de boutiques inventés, téléphones `+228 00 …` manifestement
  faux, positions tirées autour du centre de vraies communes du Togo (Bè, Adidogomé, Agoè-Nyivé, Atakpamé, Kpalimé, Kara,
  Sokodé…), jamais un client réel (FR-9). La gamme exacte reste à confirmer par le PO (A-5) : la taille du catalogue est
  un paramètre.

## Ce qui reste

- `reseau`, `pdv`, `catalogue`, `stock`, `facturation`, `paiement` : leur part du jeu et leurs routes C13 (D-1058-1,
  D-1058-2), sous les identifiants de D-1058-4.
- Les comptes du jeu (connexion « en tant que », FR-21) : **→ B** (auth), sous les identifiants `commercial` de D-1058-4.
- Les routes C13 de `facturation`, `approvisionnement`, `entrepot` (ventes) et `conquete-objectifs` (terrain), déclarées
  aux manifestes mais pas servies : un module installé qui ne sert pas sa route d'effacement laisserait le plan
  d'effacement de l'essai `EN_COURS` (D-953-4).
