# STORY-1064 : les comptes du bureau dans le jeu « Grossiste du Golfe » — le fichier des comptes (Akossiwa, Mensah, Yawa, Ayité, et les agents `COM-nn`), jeu 1.2.0

Status: in-progress

**Épic :** EPIC-226 (le jeu « Grossiste du Golfe », l'essai du prospect : FR-9 → FR-12, **FR-21**, UJ-8) · **Dépôts :**
`prospera-plateforme` (`jeux-demonstration/grossiste-golfe*/` : le fichier des comptes, jeu 1.2.0), par `_wt-d-plateforme` ;
`prospera-ventes-service` (la règle des identifiants du jeu : vecteurs des comptes) · **Plage :** groupe D, n° 5 du lot 4
(`PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4), **dernière story du lot 4 de D**. **Dépend de :** STORY-1058 (le jeu,
`identifiantDuJeu`, D-1058-4), livrée ; STORY-1063 (jeu 1.1.0, part `reseau`), livrée ; STORY-972 de B (auth pose les
comptes du jeu, D-972-5, D-972-9), livrée. **Suivante :** aucune dans le lot 4 de D (fin du lot).

**Sources :** plan du lot 4 §4, ligne 5 (« le fichier des comptes (`AKOSSIWA`, `MENSAH`, `YAWA`, `AYITE` ; agents
`COM-nn`, rôles de D-972-9) est dans le jeu, vérifié par `jeu:verifier` ; la pose par le catalogue reste à B ») ; fiche
STORY-972 (D-972-5 : les comptes vivent dans auth sous `identifiantDuJeu(org, objet, cle)` ; D-972-9 : `comptes`
facultatif dans `jeu-demonstration@1`, fichier des comptes chez D, appel du catalogue après l'import) ; journal de B
(« → D (2026-11-17, STORY-972) » : clés et rôles par défaut) ; journal de A (« → B » et « → D » du 18/11 : réponse de
l'utilisateur, **D-972-9 : oui**, les clés et rôles par défaut de B) ; code d'auth sur `origin/dev` (`8661bbf` et
suivants : `PoseDesComptesDto`, `CompteAPoserDto`, `ValidationPipe` `whitelist` + `forbidNonWhitelisted`,
`COMPTES_PAR_APPEL_MAX = 200`, vecteur de Kodjo `c6e2275ff50ddb28e5cf12c2`) ; contrat `jeu-demonstration@1`
(`contrats/instance/jeu-demonstration.schema.json`, modèle fermé) et `scripts/jeu-demonstration.ts` (`verifierJeu`) ;
PRD distributeur UJ-1 → UJ-5, UJ-8, FR-21 ; fiches 1058 et 1063 (D-1063-12 : les commerciaux du jeu dans `reseau`).

## Le découpage : ce que cette story prend

1. **le fichier des comptes** du jeu, dans chacune des trois tailles : les quatre comptes du bureau et un compte par agent,
   au format exact de la pose d'auth, produit par le générateur sans tirer un nombre ;
2. **l'identité** d'un compte, cohérente avec `terrain` (le commercial du jeu) et `reseau` (sa zone), éprouvée et figée
   par des vecteurs, dans le générateur et dans `ventes` (la source de la règle) ;
3. **le jeu 1.2.0** : les fichiers de 1.1.0 gardés à l'octet, empreintes refigées, `jeu:verifier` conforme.

Reste à B (remplaçante de B, D-972-9) : `comptes` facultatif dans `jeu-demonstration@1`, sa vérification par
`verifierJeu`, la pose par le catalogue après l'import des parts. Reste à D : la déclaration du fichier dans `jeu.json`
le jour où le contrat la permet (D-1064-4), les commerciaux et les affectations du jeu dans `reseau` (D-1064-8).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 4, règles, journaux de A, B, C, D (aucune demande neuve à D ; la réponse de l'utilisateur sur
  D-972-9, relayée par A, est celle que cette story sert), fiches 972, 1058, 1063, code d'auth (`comptes-du-jeu`).
- [x] Code : `prospera-plateforme` `MNV-1064` (996b91b : générateur, trois tailles en 1.2.0, test) ;
  `prospera-ventes-service` `MNV-1064` (135c1ec : vecteurs). PR ouvertes : prospera-plateforme **#37**,
  prospera-ventes-service **#12**.
- [x] Preuves sans Docker (Node 25) : `generer.test.mjs` 48/48, `npm test` 647/647, `typecheck`, `jeu:verifier` 3/3 ;
  `ventes` : spec 3/3, lint, `tsc` ; mutations du générateur 11/11 et de la règle 3/3.
- [ ] Annonce « ⚠ Contrats » fusionnée avant le code.
- [ ] Sous le verrou : plateforme sous Node 24 (`typecheck`, `npm test`, `generer.test.mjs`, `jeu:verifier`).
- [ ] PR de code fusionnées en rebase ; étiquette `jeu-grossiste-golfe-v1.2` ; PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Chaque taille porte `comptes.json`** : les quatre comptes du bureau (`compte` : `AKOSSIWA` comptable, `MENSAH` recouvrement, `YAWA` superviseure, `AYITE` DG ; rôles `DIST_COMPTABLE`, `DIST_RECOUVREMENT`, `DIST_SUPERVISEUR`, `DIST_DG`), puis un compte par agent (`commercial`, `COM-nn`, `DIST_COMMERCIAL` \| `DIST_FREELANCE` \| `DIST_PROSPECTION` selon son `role`) : 8, 16 et 44 comptes | `generer.test.mjs` (valeurs écrites dans le test) |
| AC-2 | **Le fichier est le corps de la pose d'auth** : chaque compte a exactement `objet`, `cle`, `prenom`, `nom`, `roleMetier`, aux motifs de `CompteAPoserDto` ; au plus 200 comptes (un appel) ; aucun `(objet, cle)` en double | `generer.test.mjs` |
| AC-3 | **Une identité, trois dépôts** : chaque compte d'agent est un commercial de `terrain/commercial.json` (même clé, prénom, nom ; rôle traduit), et chaque commercial a son compte ; la zone de chaque agent est une zone de `reseau/zone.json` ; l'identifiant d'un compte d'agent est celui que `terrain` donne au commercial (`identifiantDuJeu(org, 'commercial', COM-nn)`) ; vecteurs figés : Kodjo `c6e2275ff50ddb28e5cf12c2` (celui d'auth), les quatre comptes du bureau | `generer.test.mjs` ; spec de `ventes` |
| AC-4 | **Le jeu 1.2.0** : les neuf fichiers de données de 1.1.0 gardés à l'octet (empreintes écrites), `comptes.json` hors de toute part (il ne passe par aucune route C13), son nombre dans `generateur.parametres.comptes` ; empreintes des `jeu.json` refigées ; `jeu:verifier` conforme pour les trois tailles, et `verifierJeu` joué par le test | `generer.test.mjs` ; `npm run jeu:verifier` |
| AC-5 | Node 24 (plateforme : `typecheck`, `npm test`, `generer.test.mjs`) ; `ventes` : unitaires, lint des fichiers touchés, `tsc` ; mutations rouges sur l'assertion | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1064-1 — Le fichier des comptes est le corps de la pose.** `comptes.json` à la racine de chaque dossier du jeu, un
  tableau `{ objet, cle, prenom, nom, roleMetier }` (un enregistrement par ligne, LF final, comme les données) : ce que
  `PUT /api/v1/interne/organisations/{org}/comptes-du-jeu` attend dans `comptes`, **et rien de plus** (auth refuse un
  champ de plus : `forbidNonWhitelisted`). Le catalogue l'enverra tel quel, en un appel (44 comptes au plus pour la
  grande taille, borne 200).
- **D-1064-2 — Les clés et les rôles de D-972-9**, confirmés par l'utilisateur le 18/11. Le bureau : `objet = compte`,
  `cle` = le prénom en majuscules sans accent ; **Akossiwa ATTISSO** (`DIST_COMPTABLE`), **Mensah KPOGO**
  (`DIST_RECOUVREMENT`), **Yawa AMEDOME** (`DIST_SUPERVISEUR`), **Ayité GBADOE** (`DIST_DG`) — le PRD ne donne que les
  prénoms (UJ-1 → UJ-5) : les noms sont inventés, pris dans la liste du générateur. Le même bureau dans les trois
  tailles. Les agents : `objet = commercial`, `cle = COM-nn`, prénom et nom de `terrain/commercial.json`, rôle par
  `role` (`COMMERCIAL` → `DIST_COMMERCIAL`, `FREELANCE` → `DIST_FREELANCE`, `PROSPECTION` → `DIST_PROSPECTION`). Ordre :
  le bureau, puis les agents par clé. Les sept rôles sont des rôles du socle d'auth (B-960).
- **D-1064-3 — Une identité, la même partout.** L'identifiant d'un compte est `identifiantDuJeu(org, objet, cle)`
  (D-1058-4, D-972-5) : le compte de Kodjo **est** le commercial `COM-01` de `terrain` (même objet `commercial`, même
  clé), et ce que Kodjo saisit chez `commande` porte cet identifiant (`saisiePar` = l'utilisateur du jeton). Sa zone
  (dans `terrain`, `noeudId`) est la zone de `reseau` (1063). Un compte du bureau (`compte`) ne peut pas prendre
  l'identité d'un objet d'une part. Les vecteurs (organisation `665f1c2a9b1e8a0012345678`) sont écrits dans le test du
  générateur **et** dans `ventes`, la source de la règle copiée dans `terrain`, `reseau` et auth : `COM-01` →
  `c6e2275ff50ddb28e5cf12c2` (le vecteur d'auth), `AKOSSIWA` → `a4408f644e46aee756455091`, `MENSAH` →
  `e47c3a156183ff30ed0ffc1a`, `YAWA` → `df4829148668086cc8a39a72`, `AYITE` → `d2d106c1f6f43af99764ba0c`.
- **D-1064-4 — Le fichier n'est pas encore déclaré dans `jeu.json`.** `jeu-demonstration@1` est un modèle fermé
  (`additionalProperties: false`) qui n'a pas de `comptes` : le déclarer ferait refuser le jeu par `jeu:verifier` et par
  le catalogue. Le contrat est à B (remplaçante de B, D-972-9). D'ici là : `comptes.json` n'est dans **aucune part** (il
  ne passe par aucune route C13 : le catalogue le pose chez auth) ; `jeu.json` en porte le nombre
  (`generateur.parametres.comptes`, ouvert par le contrat) ; `jeu:verifier` est conforme pour les trois tailles, et le
  test du générateur joue `verifierJeu` lui-même (la règle de `jeu:verifier`) sur chaque dossier, puis vérifie
  `comptes.json` par les mêmes règles qu'un objet (présent, empreinte figée, tableau d'objets, nombre) et par celles de la
  route d'auth. **Proposé à B** (« → B ») : `comptes` facultatif `{ fichier, enregistrements, sha256 }` à la racine du
  jeu, vérifié par `verifierJeu` comme un objet ; le catalogue pose les comptes après l'import des parts. Ce jour-là, D
  déclare le fichier dans `jeu.json` (1.3.0, aucun fichier de données changé).
- **D-1064-5 — Le jeu 1.2.0** (mineure : un fichier ajouté ; les neuf fichiers de données de 1.1.0 gardés à l'octet,
  empreintes écrites dans le test). Étiquette `jeu-grossiste-golfe-v1.2` posée après la fusion. Le catalogue monte le jeu
  à l'étiquette `v1` (1.0.0) : rien ne change pour lui tant qu'il n'y passe pas.
- **D-1064-6 — Aucun nombre tiré pour les comptes** : le bureau est une constante, les agents viennent des commerciaux
  déjà tirés ; les fichiers des parts ne bougent pas.
- **D-1064-7 — `ventes` : des vecteurs, aucun code exécuté.** `src/socle/instance/identifiant-du-jeu.ts` est la source
  de la règle (copiée dans `terrain`, `reseau`, auth) ; un spec à côté fige les identités des comptes du jeu. Ni module
  Nest, ni dépendance, ni Dockerfile ne changent : §1.5 n'exige pas de `docker compose up`.
- **D-1064-8 — Les commerciaux du jeu dans `reseau` (D-1063-12) : cette tranche ne les touche pas, mais elle fixe leur
  identité.** Quand `reseau` recevra sa part `commercial` (personnes, affectations), le membre d'une affectation sera
  l'utilisateur du compte, `identifiantDuJeu(org, 'commercial', COM-nn)`, sans traduction. **Conséquence pour la démo** :
  la portée est en échec fermé (`acces-distributeur` ; `reseau`, AD-6 : aucune portée ⇒ rien) ; tant que `reseau` ne
  pose pas les portées des comptes du jeu (chaque agent → sa zone ; Yawa → `LOME-CENTRE`, UJ-3 ; Ayité, Akossiwa, Mensah
  → `TOTALE`, valeur explicite), un compte du jeu connecté « en tant que » ne voit **aucun** point de vente chez
  `commande`. C'est la suite à jouer avant la démo, dans `reseau` (des objets de plus dans la part `reseau` du jeu,
  version 1.3.0 ou suivante).
- **D-1064-9 — Ce qui reste** : chez B, `comptes` dans `jeu-demonstration@1`, `verifierJeu`, la pose par le catalogue
  après l'import (remplaçante de B) ; chez D, la déclaration dans `jeu.json` (D-1064-4) et les affectations du jeu dans
  `reseau` (D-1064-8).
