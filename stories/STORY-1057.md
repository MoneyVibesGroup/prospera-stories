# STORY-1057 : la recette de la démo assurance, jouable contre la compagnie fictive

Status: in-progress

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

*(à la fin)*

## Preuves

*(à la fin)*

## Ce qui reste

*(à la fin)*
