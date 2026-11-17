# STORY-1057 : la recette de la démo assurance, jouable contre la compagnie fictive

Status: done

**Épic :** EPIC-204 (le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo) ·
**Dépôt :** `prospera-assureur-fictif` (tenu par D depuis STORY-1046) · **Plage :** groupe D, n° 13 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** STORY-1046 et STORY-1048, faites (`dev` 4f4aa89).

**Sources :** PRD assurance, **annexe E** (E.1 : 104 vérifications, 92 gardées et 12 réécrites ; E.2 : 21 refus ; règle
de recette FR-15, FR-264 : 104 sur 104 de la table réécrite), FR-15 → FR-17, FR-202 → FR-205, annexe A.6 (C13 du
LC fictif : cinq vérifications) ; EPIC-204 (« la recette de l'annexe E […] jouée au fur et à mesure que les épics du
chemin les rendent possibles ») ; contrat `verification-installation@1` (STORY-944, `platform-catalog-service/contrat/`) ;
fiches STORY-986, 987, 1046 (D-1046-8), 1048 (« Ce qui reste »).

## Où j'en suis (tenu à jour pendant la story)

- 16:50 — rituel fait, fiche écrite, annonce « ⚠ Contrats » en PR de docs ; code dans `prospera-assureur-fictif`
  (branche `MNV-1057`). Verrou Docker tenu par B (STORY-971) : code d'abord.
- 17:10 — verrou Docker libre (B l'avait rendu avant 17:00) : pris sans attente (`D STORY-1057 17:10`).
- 17:30 — code poussé sur `MNV-1057` (72b481d, puis le rejeu renforcé) ; Node 24 : tsc, lint, build verts, 44/44
  suites et 451 unitaires, 4/4 suites et 30 e2e ; mutations en cours ; puis la pile `grp-d`.
- 17:45 — fusionnée (#5, `dev` f9bbea5), recette verte sur l'image de `origin/dev` avec des volumes neufs, rejouée ;
  pile descendue, verrou rendu. Story finie.

## Pourquoi

L'annexe E est la recette de la démo : 104 vérifications et 21 refus, joués sur le parcours de `SIN-2026-9002`. Presque
toutes portent sur Prospera (le dossier dans `sinistres`, les écrans de `prospera-app`, la GED) ; aucune n'était
jouable. Ce que le LC fictif tient (le sinistre au statut déclaré, ses chiffres de référence, la police et ses
garanties, les réponses aux envois de Prospera, la remise à zéro) n'était vérifié que par des tests, jamais par une
recette qu'on rejoue contre un LC vivant. Et les cinq routes de vérification C13 du manifeste n'étaient pas servies :
le moteur ne peut pas installer le LC fictif (`NON_EXECUTEE`).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **La table de l'annexe E est une donnée** (`annexe-e.json`, extraite du PRD à l'octet près des libellés, empreinte du PRD notée) : 104 vérifications (92 gardées, 12 réécrites) et 21 refus, chacun classé : part jouée par le LC, ou non jouable par le LC seul avec sa destination (→ C, écran) | test de la table (comptes, numéros continus, classement complet) |
| AC-2 | **`npm run recette:demo`** joue, par HTTP, contre un LC fictif vivant (son API `/lc/echange`, son administration, ses routes C13) : remise à zéro, chiffres de référence servis, partie de la démo, remise à zéro, partie rejouée ; il rend la table (verdict par ligne) et sort en 0 seulement si toute part du LC est verte | e2e (la même fonction) ; pile `grp-d` |
| AC-3 | **Une vérification sabotée fait rougir la recette** (valeur attendue changée, LC fautif) | mutations |
| AC-4 | **Les cinq routes de vérification C13** du manifeste sont servies, sous l'identité `MOTEUR` seule, au contrat `verification-installation@1` (copie à l'octet), sans rien modifier de l'organisation | tests ; e2e ; pile |
| AC-5 | **Après un effacement C13, le LC ne relève plus la sortie de l'organisation effacée** (reste de 1048) ; un import C13 suivant ou une remise à zéro rouvrent l'organisation en écartant ce qui avait été déposé avant | tests sur un vrai disque |
| AC-6 | Déterministe (graine fixe), rejouable après une remise à zéro ; la compagnie n'est jamais nommée ; aucune donnée de santé | recette jouée deux fois ; relecture |
| AC-7 | Sur la pile `grp-d` : la recette verte de bout en bout, rejouée après une remise à zéro, puis rejouée sur l'image reconstruite depuis `origin/dev` avec des volumes neufs | journal de la pile |

## Décisions retenues par défaut (contestables)

- **D-1057-1 — La recette côté LC est un script, `npm run recette:demo`, joué par HTTP contre un LC vivant**
  (`src/modules/assureur-fictif/recette/`). La même fonction (`jouerLaRecette`) est jouée par l'e2e contre
  l'application en mémoire : ce que l'e2e prouve est ce que la pile joue. Pas de route qui « se recette » elle-même :
  la recette regarde le LC du dehors, comme `liaison-assureur` (son API) et le moteur (ses routes C13).
- **D-1057-2 — La table de l'annexe E est une donnée versionnée** (`annexe-e.json`, 104 + 21 lignes extraites du PRD
  par script, `sha256` du PRD noté). Chaque ligne porte **où elle se joue** :
  - `LC_ET_C` : une part est jouée par le LC (un chiffre de référence qu'il sert, une réponse qu'il rend), la part
    Prospera reste à `sinistres` (→ C) ;
  - `C` : le fait est dans Prospera (dossier, circuit, GED, OCR) : **non jouable par le LC seul** (→ C) ;
  - `C_ET_ECRAN` : le fait est dans Prospera et se voit à l'écran (bouton, grisé, « sans rechargement », FR-28) : → C
    pour le fait, `prospera-app` pour l'écran (la coque n'existe pas encore).
  Le rapport rend chaque ligne : `VERTE`, `ROUGE` (avec la valeur mesurée et l'attendue) ou `NON_JOUABLE_PAR_LE_LC`
  (avec sa destination). La sortie est 0 si et seulement si toute part du LC est verte, si les 104 + 21 lignes sont
  rendues et si les cinq vérifications C13 sont `VERT`.
- **D-1057-3 — Ce que la part du LC vérifie** (table de la fiche, « Ce qui a été livré ») : (a) les **chiffres de
  référence servis** par le LC (lots C-9 et C-3 lus par son API) et **recalculés au franc près** : franchise = max(taux
  × chiffrage, minimum) de la garantie acquise de la police de `SIN-2026-9002` ⇒ 445 500 − 50 000 = **395 500** ;
  recours 70 % de 395 500 = **276 850** ; (b) les **réponses du LC** à la partie de la démo (D-1048-7) : numéro
  attribué, évaluation, règlement par chèque et recours `ACCEPTE`, clôture `ACCEPTE` puis une évaluation `REFUSE`
  `ETAT_INCOMPATIBLE` ; (c) la **remise à zéro** (n° 104) : les quatre scénarios servis à l'octet du générateur, aucun
  numéro ni reçu restant, et la même partie rejouée rend les mêmes réponses.
- **D-1057-4 — Les cinq routes de vérification C13** (`POST /api/v1/instance/assureur-fictif/{org}/verifications/<code>`,
  réponse `verification-installation@1` copiée à l'octet de `platform-catalog-service`), sous l'identité `MOTEUR`
  limitée à l'organisation du chemin, hors de la garde du module (comme l'import et l'effacement) ; **aucune ne modifie
  l'organisation** : `Idempotency-Key` est acceptée, pas exigée (rejouer rend la même mesure). Code inconnu : 404
  `VERIFICATION_INCONNUE`. Chaque critère, chiffré :
  - `assureur-fictif-absent-du-reel` : l'espace est jugé par la règle du démarrage (D-1048-2) ; prouvé d'essai ⇒ `VERT`,
    mesure 0 ; sinon `ROUGE` (défense en profondeur : hors essai, le service ne démarre pas, et le moteur voit la
    vérification `NON_EXECUTEE`, ce que B lit comme un échec du bilan d'un espace réel) ;
  - `objets-de-l-annexe-c` : sur un **banc en mémoire** (jamais l'organisation) : le jeu réduit (C-1 → C-9) validé
    ligne à ligne, la partie de la démo reçue (C-13 → C-17 : `ACCEPTE`, `REFUSE` nommé ou `DOUBLON`), le numéro (C-11) et
    les accusés (C-12) produits valides, une ligne fautive refusée avec un code de C.4, un renvoi reconnu doublon ;
    mesure = objets en défaut. **C-10 (document) est `SANS_OBJET`** : le générateur n'en produit pas (→ C) ; **C-18 et
    C-19 sont `SANS_OBJET`** : exports que la compagnie tire de Prospera (liste à saisir, écritures), jamais déposés au
    LC. Nommés dans `detail` (Q-D-8) ;
  - `numero-sans-trou` : sur les numéros **de l'organisation** (lecture) : par année, 1 → n sans trou ni doublon, un
    numéro par `DEC-` ; et sur le banc : la même `DEC-` deux fois ⇒ le même numéro, deux `DEC-` ⇒ n et n + 1 ; mesure =
    trous + doublons + écarts du banc ;
  - `jeu-sans-personne-reelle` : les objets **de l'organisation** qui portent une personne (assuré, police, sinistre
    existant, intermédiaire) et le personnel du jeu : chaque nom vient du référentiel fictif du générateur, chaque
    téléphone, pièce et immatriculation a sa forme fabriquée ; mesure = objets hors référentiel. Le référentiel est
    recopié et un test prouve qu'il est **exactement** celui que le générateur tire (jeu de la démo entier) ;
  - `remise-a-zero` : le jeu rechargé par la remise à zéro a 14 gestionnaires, 3 500 dossiers, les 7 produits et des
    experts ; sur un banc en mémoire (répertoire temporaire), la partie jouée, la remise à zéro, les quatre scénarios
    servis à l'octet et la partie rejouée aux mêmes réponses ; mesure = scénarios en cause + comptes en écart.
- **D-1057-5 — Après un effacement C13, l'organisation est fermée à la boîte aux lettres** (reste de 1048) : le
  registre C13 la marque effacée (le fait seul, aucune donnée) ; le cycle ne relève plus sa `sortie` et ne dépose plus
  rien. La marque se lève au **premier import C13 suivant** ou à une **remise à zéro**, qui écartent alors ce que
  Prospera avait déposé avant (`IGNORE`, `ANTERIEUR_A_L_EFFACEMENT` ou `ANTERIEUR_A_LA_REMISE_A_ZERO`). L'effacement
  passe dans la file de la boîte aux lettres : jamais en même temps qu'un cycle. Rien n'est supprimé de `sortie`
  (à `liaison-assureur`).
- **D-1057-6 — La garantie retenue de `SIN-2026-9002`** dans la partie est la garantie **acquise de la police** dont la
  franchise arrête le décompte de l'annexe E (`DOMMAGES_TOUS_ACCIDENTS`, 10 %, minimum 50 000). Le sinistre existant
  du jeu porte `garantie: RC_CIRCULATION` (franchise 0), qui donnerait 445 500 : **écart du générateur, → C**
  (information ; le générateur est dans `contrats/assurance/demo/`, dossier de C).
- **D-1057-7 — Jouer sur la pile** : profil compose `recette` : `emetteur-de-recette` (JWKS et jetons d'essai, image du
  service), `droit-de-recette` (le droit du module publié sur `entitlement.changed`), `recette-demo` (joue la recette,
  sort en 0 ou 1). Le LC lit les jetons de l'émetteur quand `AUTH_JWKS_URI` le désigne. Essai seulement.
- **D-1057-8 — Les noms de l'annexe E ne sont pas ceux du jeu** (« Estelle Lawson », « Komlan », « SAREX », `9201`,
  `EXP-2026-D0001` ; le jeu a Estelle Kpodar, Koffi Mensah, trois cabinets fictifs). La part du LC ne juge **aucun
  nom** ; la part Prospera lira la personne **par son rôle** dans le jeu (Q-D-7, → C).
- **D-1057-9 — Taille** : la recette se joue sur le jeu réduit par défaut (mêmes quatre scénarios, rapide) ;
  `RECETTE_TAILLE=DEMO` la joue sur le jeu de la démo.

## Ce qui a été livré

**2026-11-17** — `prospera-assureur-fictif` **#5**, fusionnée en « Rebase and merge » sur `dev` : **`51f2639`**,
**`9e98f70`**, **`f9bbea5`** (branche `72b481d`, `78564a1`, `001002a` ; `head.sha` vérifié avant la fusion). Annonce
« ⚠ Contrats » fusionnée **avant** le code (prospera-stories **#658**, `main` 3768852).

- `src/modules/assureur-fictif/recette/` :
  - `table-annexe-e.json` : l'annexe E extraite du PRD par script (`prospera-stories@e631c2a`, sha256 du PRD
    `263a6f3f…`), empreinte de la table figée par un test (`164e1acf…`) ;
  - `annexe-e.ts` : le classement (D-1057-2), les 14 contrôles du LC et leurs valeurs attendues écrites ;
  - `recette.ts` (`jouerLaRecette`, `rapportEnTexte`), `client-du-lc.ts`, `recette-demo.ts` (`npm run recette:demo`,
    sortie 0/1/2), `emetteur-de-recette.ts` (JWKS et jetons d'essai), `partie-des-scenarios.ts` (déplacée de
    `test/utils`, garantie du décompte, D-1057-6).
- `src/modules/assureur-fictif/instance/verification/` : `VerificationsC13` et sa route (cinq codes du manifeste,
  `MOTEUR` seul, 404 `VERIFICATION_INCONNUE`), `verification-installation.schema.json` copié à l'octet
  (`platform-catalog-service@c3c63c8`, sha256 `8e7d29a2…`, invariant de copie).
- `demo/referentiel-fictif.ts` : le référentiel du générateur, prouvé exact sur le jeu de la démo entier.
- D-1057-5 : `RegistreC13.rouvrir`, `estFermee`, `EffacementFait.rouverteLe` ; `BoiteAuxLettres` : cycle fermé,
  `rouvrirApresEffacement` (`ANTERIEUR_A_L_EFFACEMENT`), `exclusif` (l'effacement dans la file), remise à zéro qui rouvre ;
  `DepotCompagnie.numerosAttribues`, `parcourirObjets` (mémoire et MongoDB, curseur).
- `docker-compose.yml` : profil `recette` (`emetteur-de-recette`, `droit-de-recette`, `recette-demo`) ; README.

### La table de l'annexe E : où chaque vérification se joue

| Lignes de l'annexe E | Où | Comment elle se joue | Résultat attendu (pile) |
|---|---|---|---|
| n° 3 (dossier DÉCLARÉ) | LC + C | le LC sert `SIN-2026-9002` au statut `DECLARE` (lot C-9 lu par son API) | `DECLARE` — vert |
| n° 11 (devis 1 273 000) | LC + C | chiffre de référence servi par le LC (`GET /assureur-fictif/jeu`) ; l'OCR est à C | 1 273 000 — vert |
| n° 25, 49 (445 500) | LC + C | chiffrage de l'expert servi | 445 500 — vert |
| n° 64, 70, 71, 86 (70 % au tiers) | LC + C | part du tiers servie | 70 — vert |
| n° 74, 78 (décompte) | LC + C | recalcul : 445 500 − max(10 % × 445 500, 50 000) avec la garantie acquise de la police servie (C-3) = évaluation arrêtée du jeu | 395 500 — vert |
| n° 79, 80 (ÉVALUÉ, provision 395 500) | LC + C | décompte + évaluation C-14 envoyée par l'API du LC | 395 500 ; `ACCEPTE` — vert |
| n° 90, 94 (quittance, RÉGLÉ) | LC + C | règlement par chèque C-15 | `ACCEPTE` — vert |
| n° 95 (créance de recours 276 850) | LC + C | 70 % × 395 500 = montant réclamé du jeu ; encaissement C-16 | 276 850 ; `ACCEPTE` — vert |
| n° 97 (CLÔTURÉ) | LC + C | décision de clôture C-17, puis une évaluation refusée (clos au LC) | `ACCEPTE` puis `REFUSE ETAT_INCOMPATIBLE` — vert |
| n° 104 (remise à zéro : DÉCLARÉ, démo vierge) | LC + C | remise à zéro ; les quatre scénarios et leurs polices servis comme au premier chargement ; aucun envoi ni numéro ; la même partie rejouée rend les mêmes réponses, celles de la démo | 0 écart — vert |
| 65 autres vérifications de E.1 (n° 5–8, 10, 12–18, 20–24, 32–33, 35–37, 39, 41–42, 44–48, 50–59, 61–63, 65, 67–69, 72–73, 76, 81–85, 88–89, 91–93, 98–102) | **C** | non jouables par le LC seul : le dossier, le circuit, les experts, la GED et l'OCR sont dans `sinistres` et `document-service` | `NON_JOUABLE_PAR_LE_LC` → C |
| 22 vérifications d'écran de E.1 (n° 1, 2, 4, 9, 19, 26–31, 34, 38, 40, 43, 60, 66, 75, 77, 87, 96, 103) | **C + écran** | bouton, grisé, « sans rechargement » (FR-28) : le fait à C, l'écran à `prospera-app` (pas de coque) | `NON_JOUABLE_PAR_LE_LC` → C, écran |
| Les 21 refus de E.2 | **C** (n° 2, 3, 5, 9, 12, 14, 19, 21 : + écran) | refus du circuit de Prospera (séparation des tâches, droits, champs) : aucun n'est un refus du LC | `NON_JOUABLE_PAR_LE_LC` → C |
| Les cinq vérifications C13 | LC | `POST …/verifications/<code>` sous `MOTEUR`, au contrat | 5/5 `VERT`, mesure 0 |

La recette rend les 125 lignes (104 + 21) ; la part du LC est **17/17 verte** ; 108 lignes sont nommées non jouables par
le LC seul, avec leur destination.

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive HEAD`) : `tsc` vert ;
  lint du dépôt entier 0 (`--max-warnings 0`) ; build ; **44/44 suites, 451 tests** unitaires (419 avant) ; **e2e 4/4
  suites, 30 tests** (23 avant ; la suite neuve `recette-demo.e2e-spec.ts` joue `jouerLaRecette` par HTTP contre
  l'application montée avec la vraie chaîne de gardes et les jetons de l'émetteur de recette).
- **Mutations, 12 sur 12 rouges sur une assertion** (aucune à la compilation ; M9 et M10 rejouées après avoir rendu
  leur mutation compilable et leur message court) : franchise au minimum (2 rouges) ; **décompte attendu saboté à
  445 500** (2) ; évaluation acceptée après clôture (3) ; remise à zéro qui ne vide plus (3) ; cycle qui relève une
  organisation effacée (2) ; réouverture qui n'écarte plus la sortie (1) ; trous non comptés (1) ; personne hors
  référentiel non comptée (1) ; `absent-du-reel` toujours vert (1) ; un prénom de trop au référentiel (1) ; route de
  vérification sans le moteur (1) ; rejeu sans les réponses de la démo (1). Une première version de n° 104 survivait à
  une remise à zéro qui gardait un sinistre clos (deux parties identiques, mais fausses) : le contrôle exige désormais les
  réponses de la démo au rejeu.
- **Pile `grp-d`** (`AUTH_JWKS_URI=http://emetteur-de-recette:3499/.well-known/jwks.json docker compose -p grp-d
  --profile assureur-fictif --profile recette run --rm recette-demo` ; MongoDB 8 en jeu de répliques, Kafka, le droit
  du module publié sur `entitlement.changed`, l'émetteur de recette) :
  - branche : **recette verte de bout en bout** (17/17, C13 5/5, 12 s), **rejouée** (elle commence par une remise à
    zéro) : verte, table identique ; **jeu de la démo** (`RECETTE_TAILLE=DEMO`, 205 915 enregistrements) : verte, 244 s ;
  - les cinq vérifications sur l'organisation chargée au jeu de la démo : 27, 234, 123, **2 370** (46 540 objets
    relus) et 509 ms, sous le délai de 10 s du moteur ;
  - D-1057-5 sur la pile : effacement C13 (`EFFACE`, 206 049 enregistrements), cycle `fermee: true`, effacement rejoué
    `DEJA_EFFACE` au même décompte, remise à zéro, cycle rouvert ;
  - **image reconstruite depuis `origin/dev` (`f9bbea5`)**, `build --no-cache`, volumes neufs (code neuf vérifié dans
    l'image) : recette **verte**, rejouée **verte**, tables identiques entre elles et à celle de la branche ; refus de
    l'espace réel intact (`INSTANCE_ESPACE=REEL` ⇒ sortie 78, `ESPACE_REEL`) ;
  - `down -v` : aucun conteneur, volume ni réseau `grp-d` restant.
- **Verrou Docker** : libre à 17:00 (B l'avait rendu), pris à 17:10 sans attente, rendu à 17:45.

## Ce qui reste

- **La part Prospera des 104 + 21** (→ C) : jouer le parcours de `SIN-2026-9002` dans `sinistres` contre le LC
  fictif ; la table classée et la recette du LC sont réutilisables (`table-annexe-e.json`, `CONTROLES_DU_LC`).
- **L'assemblage de la recette complète sur vrai backend** (→ A, `prospera-recette`) quand C aura le parcours : la
  suite peut appeler `recette-demo.js` (image du LC fictif) pour la part du LC.
- **C-10 (documents)** n'est pas dans le jeu : le générateur (dossier de C) ne les produit pas (Q-D-8, → C). Les
  « 7 documents » et le bordereau de 11 pièces (n° 12, 101) en dépendent.
- **Les noms de l'annexe E** ne sont pas ceux du jeu (Q-D-7, → C).
- **La garantie du sinistre existant `SIN-2026-9002`** (`RC_CIRCULATION`, franchise 0) contredit le décompte de
  l'annexe E (D-1057-6, → C).
- Le drapeau `assureurFictifAutorise` de l'état voulu (D-1048-4) : toujours au moteur.
