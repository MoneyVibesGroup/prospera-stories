# STORY-1058 : le jeu « Grossiste du Golfe » — `jeu-demonstration@1` en trois tailles, routes C13 de `commande` et de `terrain`

Status: done

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
- [x] Annonce « ⚠ Contrats » fusionnée avant le code : prospera-stories #662 (`main` d707c71).
- [x] Plateforme : PR #30 fusionnée en rebase (`dev` **d36623b**), étiquette **`jeu-grossiste-golfe-v1`**.
- [x] `ventes` : PR #7 fusionnée en rebase (`dev` **88ee146 → 7f674ef**).
- [x] `terrain` : PR #3 fusionnée en rebase (`dev` **cefe9b9, 068e1c0**).
- [x] Verrou Docker : tenu par B (STORY-967) de 17:45 ; libre à 18:28 ; pris par D à 18:32 (attente ~30 min, passée à coder) ;
  Verrou Docker attendu ~30 min (B, 967), pris à 18:32 ; rendu à B par la session de groupe après le blocage du rejeu de terrain ; aucun conteneur, volume ni réseau grp-d ne reste.
- [x] **Rejeu de `terrain` sur l'image d'`origin/dev`** (`068e1c0`, `--no-cache`, volumes neufs) : joué par la session de
  STORY-1059 le 2026-11-17, sous son verrou (pris à 22:37) : **22/22, espace réel 403** (voir « Preuves »).
- [x] Pile `grp-d` (branches), puis rejouée sur les images reconstruites depuis `origin/dev`.
- [x] PR de docs finale.

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

## Ce qui a été livré

**2026-11-17** — trois PR fusionnées en « Rebase and merge », après l'annonce #662 :

- `prospera-plateforme` **#30** (`dev` `d36623b`, étiquette **`jeu-grossiste-golfe-v1`**) : `jeux-demonstration/grossiste-golfe-petit/`,
  `grossiste-golfe/` (avec `generateur/generer.mjs` et `generer.test.mjs`), `grossiste-golfe-grand/` (données seules,
  aucun fichier de B).
- `prospera-ventes-service` **#7** (`dev` `88ee146`, `e35ad1a`, `1e60091`, `3cf9ffc`, `7f674ef`) :
  - `src/socle/instance/` : contrats C13 copiés à l'octet (`ORIGINE.json`, invariant), `identifiantDuJeu`, `ServiceC13`
    (import et effacement), `lignes.ts` (format fermé d'une ligne), refus, `@RoutesDInstance` et `exigerLeMoteur` ;
  - identité de service (`JwtStrategy`, `EmailVerifiedGuard`, `@AdmetIdentitesDeService`), `INSTANCE_ESPACE` ;
  - `src/modules/commande/instance/` : contrôleur, part `commande` (objets, plan d'effacement), invariant d'inventaire ;
  - `acces.invariant.spec.ts` (exemption des routes C13), `ajv` en dépendance d'exécution, corps JSON de 10 Mo.
- `prospera-terrain-service` **#3** (`dev` `cefe9b9`, `068e1c0`) : le même `src/socle/instance/` (identique, `diff -r`),
  la même identité de service et le même `acces.invariant.spec.ts` ; `src/modules/terrain/jeu/` (trois collections) et
  `instance/` (contrôleur, part `terrain`, jours relatifs, plan d'effacement).

| Jeu | `commande` (point-de-vente, plafond, prix) | `terrain` (commercial, point-de-vente, plan-de-journee) | Total | `jeu.json` (sha256) |
|---|---|---|---:|---|
| `grossiste-golfe-petit@1.0.0` | 121, 121, 66 | 4, 120, 44 | 476 | `175e1928…5fbd` |
| `grossiste-golfe@1.0.0` (la démo) | 602, 602, 172 | 12, 600, 132 | 2 120 | `98d7b1a8…a3f1` |
| `grossiste-golfe-grand@1.0.0` | 2 004, 2 004, 449 | 40, 2 000, 440 | 6 937 | `7af61d26…b406` |

Points de vente : 120 / 600 / 2 000, plus un client comptoir par point de stock (1 / 2 / 4). Articles : 40 / 72 / 80
en 5 familles. Kodjo (COM-01, commercial à Bè) a 14 visites au jour 0. Mme Adjo (PDV-0001, Adidogomé) : plafond
1 000 000, prix « ce client » du jus d'orange 1 L à 5 800.

## Preuves

- **Plateforme, Node 24** (`node:24-slim`, export `git archive`) : `typecheck` vert ; `npm test` **616 tests, 615 pass,
  0 fail, 1 sauté** (la matrice du catalogue) ; `node --test …/generer.test.mjs` **25/25** ; `jeu:verifier` conforme pour
  les trois tailles (et les jeux existants) ; deux écritures successives identiques et égales aux fichiers versionnés ;
  empreintes figées. **Mutations du générateur : 11/11 rouges** (graine ignorée, Kodjo à 13 visites, TVA 15 %, comptoir
  à crédit, prix « ce client » vers un point de vente absent, dix jours, positions hors commune, prix du PRD changé,
  visites hors zone, une année figée, …).
- **`ventes`, Node 24** (étage `verification`, export `git archive`) : `tsc` ; lint des 30 fichiers touchés (`endOfLine
  auto`) ; build (les schémas JSON copiés dans `dist`) ; unitaires **Test Suites: 48 passed, 48 total ; Tests: 444
  passed** (411 avant) ; e2e **2/2 suites, 24 tests** (16 avant) ; intégration sur MongoDB 8 en jeu de répliques **9/9
  suites, 82 tests** (75 avant), dont `instance-c13.int-spec.ts` (7) : jeu réduit importé lot par lot, rejeu, 409,
  référence absente et ligne fausse sans écriture, vente au comptoir validée `BL-2026-000001`, Mme Adjo
  `ENCOURS_NON_INSTALLE`, effacement complet (commandes, bons, séries, faits), `DEJA_EFFACE`, réimport puis `EFFACE`,
  témoin intact. **Mutations : 16/16 rouges sur une assertion** (espace réel admis, même clef autre lot, ligne non
  validée, référence absente, `DEJA_EFFACE` sur des données, organisation sous une seule forme, identifiant décalé, bons
  non effacés, outbox des autres organisations effacée, plafond sans montant, prix client sans tiers, jeton de service
  partout, moteur d'une autre organisation, identité inconnue, contrôleur sans exemption, copie du contrat retouchée).
- **`terrain`, Node 24** : `tsc`, lint, build ; unitaires **36/36 suites, 341 tests** ; e2e **2/2, 24** ; intégration
  **3/3, 15**. **Mutations : 10/10** (dimanche non sauté, doublon de visite, ordre non vérifié, visites hors références,
  jour relatif ignoré, piste non effacée, plans non effacés, latitude non bornée, zone du commercial perdue, routes C13
  sans `MOTEUR`).
- **Pile `grp-d`, branches** (export `git archive`, image `runtime`, MongoDB 8 en jeu de répliques, Kafka ; surcouche
  hors dépôt : émetteur RS256 de recette qui tient le JWKS et `/moi/droits`, `INSTANCE_ESPACE=ESSAI`,
  `COMMANDE_RESERVATION_STOCK=recette`). Un pilote joue la partie A (lots de 500, clef
  `jeu|<org>|<code>@<version>|<module>|<objet>|<n>`, chaque réponse lue au contrat) :
  - **`ventes`, 25/25** : jeu réduit 308 enregistrements en 1,0 s (3 appels), rejoué `DEJA_IMPORTE`, 409 ; refus
    (utilisateur `IDENTITE_DE_SERVICE_REQUISE`, autre organisation, Reprise et moteur sur `/commande/module`
    `IDENTITE_DE_SERVICE_REFUSEE`, `SOURCE_NON_SERVIE`, `REFERENCE_INCONNUE` sans écriture) ; **vente au comptoir de
    Lomé Port saisie (172 000 HT, 202 960 TTC) et validée : `BL-2026-000001`, `VALIDEE`** ; Mme Adjo 5 800 « ce
    client », 198 240 TTC, validation `ENCOURS_NON_INSTALLE` ; **jeu complet 1 376 enregistrements en 1,5 s, grande
    taille 4 457 en 7,6 s** ; effacements `EFFACE` (330, 1 381, 4 468 : le décompte est celui des documents de
    l'organisation, commandes, bons, séries et faits compris), rejoués `DEJA_EFFACE` au même `effaceLe` ; **témoin
    intact** ; registre des effacements sans donnée personnelle. Service relancé avec `INSTANCE_ESPACE=REEL` : **403
    `ESPACE_REEL_REFUSE`**, rien d'écrit.
  - **`terrain`, 22/22** : jeu réduit 168 enregistrements, complet 744 en 1,6 s, grand 2 480 en 3,2 s ; mêmes rejeux et
    refus ; **Kodjo (Bè) a 14 visites au jour 0 (2026-11-17), toutes vers des points de vente importés** ;
    effacements (171, 748, 2 486), `DEJA_EFFACE`, témoin intact ; espace réel 403.
- **Rejeu sur images reconstruites depuis origin/dev (--no-cache, volumes neufs) : ventes 25/25 et espace réel 403.**
  `terrain` n'avait pas été rejoué (session bloquée, verrou rendu à B pour 968) ; **rejoué le 2026-11-17 à 22:47 par
  la session de STORY-1059** : export `git archive 068e1c0`, image `runtime` construite `--no-cache`, volumes neufs,
  même pilote et même surcouche (émetteur RS256, `INSTANCE_ESPACE=ESSAI`, `NODE_ENV=production`) : **22/22** — jeu
  réduit 168 enregistrements (3 appels), rejoué `DEJA_IMPORTE`, 409 `IDEMPOTENCE_REUTILISEE`, les six refus,
  jeu complet 744 et grande taille 2 480, **Kodjo (Bè) : 14 visites au jour 0 (2026-11-17)**, effacements 171, 748,
  2 486 puis `DEJA_EFFACE` au même `effaceLe`, **organisation témoin intacte**, registre sans donnée personnelle ;
  service relancé avec `INSTANCE_ESPACE=REEL` : **403 `ESPACE_REEL_REFUSE`**, rien d'écrit. Pile descendue (`down -v`).
- `git diff --stat` = `--ignore-cr-at-eol` dans les trois dépôts ; aucun `index.ts` non suivi.
- **Piège payé** : la surcouche de recette de `terrain` en `NODE_ENV=staging` fait tomber le service (`pino-pretty`
  absent de l'image `runtime`) ; `ventes` lit `LOG_PRETTY`, `terrain` non. Sans rapport avec 1058 : la recette de
  `terrain` garde `production`.

## Ce qui reste

- `reseau`, `pdv`, `catalogue`, `stock`, `facturation`, `paiement` : leur part du jeu et leurs routes C13 (D-1058-1,
  D-1058-2), sous les identifiants de D-1058-4.
- Les comptes du jeu (connexion « en tant que », FR-21) : **→ B** (auth), sous les identifiants `commercial` de D-1058-4.
- Les routes de lecture des tournées (EPIC-233) ; l'historique de trois mois (factures, encaissements, relances) avec
  `facturation` et `paiement` ; les camions, entrepôts et lots avec `stock` et `entrepot` (version `1.x` du jeu).
- Le jour chômé (dimanche) est une règle de la route d'import ; les jours fériés du Togo n'y sont pas (Q-D-9).
- Les copies du socle (portées, état publié) d'une organisation effacée restent dans `ventes` et `terrain` : à purger
  par le socle quand tous les modules sont `DESINSTALLE` (D-1058-12).
- Les routes C13 de `facturation`, `approvisionnement`, `entrepot` (ventes) et `conquete-objectifs` (terrain), déclarées
  aux manifestes mais pas servies : un module installé qui ne sert pas sa route d'effacement laisserait le plan
  d'effacement de l'essai `EN_COURS` (D-953-4).
