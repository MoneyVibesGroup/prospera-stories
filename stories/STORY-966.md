# STORY-966 : le grand livre

Status: done

**Complexité :** moyenne à élevée (soldes exacts par compte et par période, lus d'un seul instantané sous des
validations concurrentes ; sommes exactes ; pagination ; modèle qui doit servir la balance de STORY-967 sans refonte)

**Épic :** EPIC-114 (grand livre et balance dérivée : « consultation par compte et par période »),
d'`epics-comptabilite-2026-08-27.md` ; Q1 et Q2 (D-L3-4)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service`
**Plage :** groupe B, n° 11 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 966).
**Dépend de :** STORY-964 (la validation inaltérable, `dev` `92f8c53`).
**Débloque :** STORY-967 (la balance dérivée du grand livre, qui attend aussi A-921) et STORY-970 (la clôture : les
à-nouveaux dérivés du grand livre).

**Sources lues :** fiches STORY-958, 961, 962, 964 (« Pour la suite » : le grand livre ne lit que les écritures
`VALIDEE`) ; manifeste `comptabilite` (droits C7) ; épics de la comptabilité (« le grand livre devient la source, et
la balance en devient une projection ») ; `balance-service` `INTEGRATION.md` §1 et §1 ter sur `origin/dev` (`9dfd60e`,
A-921 : origine `comptabilite`, quatre colonnes, `checksum`, « n'envoyer que les mouvements de l'exercice ») ; journal
de A (« → B, l'origine `comptabilite` est disponible pour B-967 ») ; journal de B (pièges de 958 → 965).

---

## Pourquoi

Le grand livre est la première lecture comptable : pour un compte, sur une période, d'où l'on part, ce qui a bougé,
où l'on arrive. C'est aussi la source de tout ce qui suit : la balance publiée au hub (967), les à-nouveaux de la
clôture (970). Il ne lit que des écritures **validées** : un brouillard se corrige encore (Q2), il n'a rien à faire
dans un solde.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 966)

| Exigence | Fait |
|---|---|
| Consulter un compte sur une période | `GET …/grand-livre/comptes/{compte}?du=&au=` : solde d'ouverture de la période, mouvements datés (pièce, journal, numéro définitif, libellé, débit, crédit, solde progressif), totaux, solde de clôture (D-966-3, D-966-4) |
| Les comptes mouvementés et leurs totaux (pour 967) | `GET …/grand-livre?du=&au=` : par compte, solde d'ouverture, à-nouveaux, mouvements, solde de clôture ; totaux et équilibre ; brouillards de la période comptés (D-966-8) |
| Seules les écritures validées | statut `VALIDEE` seulement, contre-passations comprises ; un brouillard n'entre jamais (D-966-2) |
| Exact sous des validations concurrentes | une consultation se lit dans UN instantané MongoDB (`snapshot`) : ouverture, mouvements, totaux et clôture de la même page sont cohérents (D-966-1) |
| Sommes exactes | entiers en unité mineure, sommés en `Decimal128` dans la base et en `bigint` dans le service ; jamais un nombre arrondi (D-966-6) |
| Bornes | période dans l'exercice, pagination bornée (D-966-3, D-966-5) |
| Tenue exclusive | un exercice tenu aux cahiers n'a pas de grand livre : 409 `EXERCICE_TENU_AUX_CAHIERS` (D-966-10) |
| Droit | `comptabilite:dossier:consulter`, lu dans `droits ∪ droitsHorsJeton` par le cache de 962 (D-966-9) |
| Preuves | `test:socle` sur MongoDB 8.0 rs0 : brouillard exclu, contre-passation qui annule, soldes justes sur un jeu connu, bornes de période, sommes à la borne et au-delà, lectures pendant des validations concurrentes ; mutations ; `docker compose up` sain |

## Décisions (prises par défaut, contestables)

- **D-966-1 : calculé à la volée, dans un instantané ; pas de projection.**
  - La source est la collection `ecritures`, dont toute écriture validée est inaltérable (D-964-3) : le grand livre
    n'a rien à recopier. Il se calcule à chaque consultation par une agrégation indexée sur les écritures `VALIDEE`.
  - **Exactitude sous la concurrence** : une validation pose `statut: VALIDEE`, `rang` et `numero` dans la même mise
    à jour, dans sa transaction (D-964-1). Une lecture ne voit donc jamais un mouvement sans son numéro définitif. Mais
    une consultation fait plusieurs lectures (ouverture, mouvements, totaux, brouillards) : elles se font toutes dans
    une session MongoDB **`snapshot`** (lecture à un même instant du jeu de répliques). Une validation qui s'engage
    pendant la consultation est vue par toutes ses lectures, ou par aucune.
  - **Pourquoi pas une projection** (soldes par compte tenus dans la transaction de la validation) : ce serait une
    seconde vérité à garder égale à la première (reconstruction, migration), et une écriture de plus par ligne sur le
    chemin chaud de la validation, déjà sérialisé par la tête de la piste (D-964-5). Le volume d'un dossier de cabinet
    (l'épic parle de 40 000 lignes par an) se lit en une agrégation indexée. Une projection (soldes par compte et par
    mois) pourra venir si une mesure la réclame, sans changer le contrat de lecture.
  - Index neuf `grand_livre_par_compte` : `(organisation, dossier, exercice, statut, lignes.compte, dateEcriture)`.
- **D-966-2 : ce qui entre dans le grand livre.**
  - Les écritures `VALIDEE` de l'exercice, et elles seules. Une contre-passation est une écriture validée comme une
    autre (D-964-4) : elle annule l'originale compte par compte, et les deux restent visibles (le mouvement de la
    contre-passation porte `contrePasse: { ecritureId, numero }`).
  - Un brouillard n'y entre jamais (Q2). La liste des comptes dit combien de brouillards restent datés dans la période
    (`brouillardsDansLaPeriode`) : 967 ne publiera pas de balance tant qu'il en reste (Q2, D-L3-4).
  - Les à-nouveaux de l'exercice sont des écritures du journal de nature `A_NOUVEAUX` (plan arrêté, D-961-1), datées
    dans l'exercice : ils entrent comme les autres. Rien n'est reporté d'un exercice antérieur par le grand livre :
    c'est la clôture (970) qui dérivera les à-nouveaux.
- **D-966-3 : la période.**
  - `du` et `au`, jours civils `AAAA-MM-JJ`, **inclusifs** ; absents, ce sont les bornes de l'exercice (lues chez
    dossier-service, comme la saisie).
  - Elle tient dans l'exercice : sinon 422 `PERIODE_HORS_EXERCICE` (`details.du`, `au`, `debut`, `fin`). Un jour qui
    n'existe pas, ou `du` après `au` : 422 `PERIODE_INVALIDE` (`details.du`, `au`).
  - **Solde d'ouverture de la période** = cumul des écritures validées de l'exercice datées AVANT `du`. **Solde de
    clôture** = ouverture + mouvements de la période. Soldes en deux colonnes, `soldeDebiteur` et `soldeCrediteur`
    (l'une des deux est nulle), comme le contrat canonique de balance.
- **D-966-4 : l'ordre des mouvements.** Date, puis code du journal, puis numéro définitif (`rang`), puis rang de la
  ligne dans la pièce. Les numéros sont continus PAR JOURNAL dans l'ordre des validations, pas des dates (D-964-1) :
  dans un même journal et un même jour, l'ordre est celui des numéros définitifs.
- **D-966-5 : la pagination et les bornes.**
  - **Mouvements d'un compte** : curseur opaque `apres` (la position du dernier mouvement rendu, liée au compte ;
    400 `CURSEUR_INVALIDE` sinon), `limite` de 1 à 1 000, 200 par défaut. Chaque page rend aussi `reporte` (le solde
    juste avant son premier mouvement), et l'ouverture, les totaux et la clôture de TOUTE la période, lus dans le même
    instantané que la page. `suivant` vaut le curseur de la page suivante, ou `null`.
  - **Comptes mouvementés** : triés par numéro de compte (ordre des points de code, celui du `checksum` de balance) ;
    curseur `apres` = le dernier compte rendu ; `limite` de 1 à 1 000, 500 par défaut. Les totaux de TOUS les comptes
    sont sur chaque page.
  - **Ce que garantit une page** : elle est exacte à l'instant de sa lecture. Deux pages lues à deux instants peuvent
    voir une validation intervenue entre-temps : un mouvement daté avant le curseur entre dans le `reporte` de la page
    suivante, un mouvement daté après y apparaît. Le solde progressif reste exact page par page ; il n'y a pas
    d'instantané tenu d'une requête à l'autre (`atClusterTime` expire au bout de 5 minutes : il casserait une
    lecture lente).
- **D-966-6 : les montants.**
  - Entiers en unité mineure (D-962-3). Dans la base, les sommes se font en `Decimal128` (`$toLong` puis
    `$toDecimal` : un `$sum` de doubles perdrait l'unité au-delà de 2^53) ; dans le service, en `bigint`.
  - Rendus en nombres JSON entiers, comme le contrat canonique de balance et `paiement`. Un montant à rendre qui
    dépasserait 2^53 − 1 rend 422 `MONTANT_HORS_BORNE` (`details.quoi`, `details.valeur` en chaîne exacte) : jamais un
    nombre arrondi en silence. Le modèle interne (pour 967) reste en `bigint`.
- **D-966-7 : une devise par grand livre.** Une pièce porte sa devise (XOF ou XAF, D-962-3), et rien n'impose encore
  une seule devise par dossier. Le grand livre ne somme jamais deux devises : `devise` (facultative) choisit ; absente,
  c'est la seule devise des écritures validées de l'exercice ; s'il y en a plusieurs, 409 `DEVISE_A_PRECISER`
  (`details.devises`). Sans aucune écriture validée : `devise: null`, aucun compte.
- **D-966-8 : le modèle sert 967.**
  - Par compte : `soldeOuverture`, `aNouveaux { debit, credit }` (lignes de la période des journaux de nature
    `A_NOUVEAUX`), `mouvements { debit, credit }` (les autres journaux), `soldeCloture`, `nombreDeLignes`. Totaux de
    chaque colonne et `equilibre` (débits = crédits, soldes débiteurs = soldes créditeurs).
  - 967 trouvera là ce que demande le hub (A-921, `INTEGRATION.md` §1 ter) : une balance GÉNÉRALE aux quatre colonnes,
    dont les à-nouveaux sont séparés, puisque le hub chaîne lui-même le socle d'à-nouveaux de l'exercice. Le service
    expose à 967 le même calcul en `bigint`, sans pagination (`GrandLivreService.comptesMouvementes`).
- **D-966-9 : le droit.** `comptabilite:dossier:consulter`, **déjà déclaré** au manifeste depuis 958 pour « référentiel,
  journaux, écritures, grand livre, balance, tiers (lecture) » : pas de droit neuf. Lu par `/moi/droits`
  (`droits ∪ droitsHorsJeton`), derrière le cache `(membre, organisation, dv)` de 962.
  - Les lectures livrées par 958 → 964 restent ouvertes à la portée du dossier (D-958-9) : les fermer changerait leur
    contrat. Les aligner (ou ouvrir le grand livre à la portée) se tranchera avec l'attribution des droits
    `comptabilite:*` aux rôles du cabinet dans auth. Contestable.
- **D-966-10 : l'exercice.** Résolu par dossier-service (bornes, appartenance au dossier). Tenu aux cahiers : 409
  `EXERCICE_TENU_AUX_CAHIERS` ; non ouvert à la comptabilité : 404 `EXERCICE_NON_OUVERT`. Un exercice **clos** chez
  dossier-service se consulte (son grand livre est figé, il reste lisible).
- **D-966-11 : un compte, exactement.** `{compte}` suit le motif des lignes (classe 1 à 9 en tête, 2 à 20 chiffres ;
  400 `COMPTE_MALFORME` sinon) ; le grand livre d'un compte est celui de ce numéro exact, pas d'une racine. Le compte
  collectif et ses auxiliaires viendront avec 968. Un compte sans aucun mouvement rend 200 avec des soldes nuls.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Routes neuves**, droit `comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule` :
  - `GET /api/v1/dossiers/{d}/exercices/{e}/grand-livre?du=&au=&devise=&apres=&limite=` → `{ dossierId, exerciceId,
    exercice: { debut, fin }, periode: { du, au }, devise, brouillardsDansLaPeriode, comptes: [{ compte,
    soldeOuverture: { soldeDebiteur, soldeCrediteur }, aNouveaux: { debit, credit }, mouvements: { debit, credit },
    soldeCloture: { soldeDebiteur, soldeCrediteur }, nombreDeLignes }], totaux: { soldeOuverture, aNouveaux,
    mouvements, soldeCloture, equilibre }, nombreDeComptes, suivant }` ;
  - `GET /api/v1/dossiers/{d}/exercices/{e}/grand-livre/comptes/{compte}?du=&au=&devise=&apres=&limite=` →
    `{ dossierId, exerciceId, compte, exercice, periode, devise, soldeOuverture, totaux: { debit, credit },
    soldeCloture, nombreDeMouvements, reporte, mouvements: [{ ecritureId, numero, journal, dateEcriture, ligne,
    libelle, libelleEcriture, pieceId, debit, credit, soldeDebiteur, soldeCrediteur, contrePasse? }], suivant }`.
- **Refus nommés neufs** : 422 `PERIODE_HORS_EXERCICE`, `PERIODE_INVALIDE`, `MONTANT_HORS_BORNE` ; 409
  `DEVISE_A_PRECISER` ; 400 `COMPTE_MALFORME`, `CURSEUR_INVALIDE`.
- **Base** : index neuf `grand_livre_par_compte` sur `ecritures`.
- **Manifeste** : les deux routes en `routesLectureSeule` ; commentaire des droits (le grand livre exige
  `comptabilite:dossier:consulter`).
- Aucun topic, aucun schéma au registre, aucune variable.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 17/11, l'annonce d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #652 (fiche, tracker, manifeste amendé, annonce du contrat, AVANT le code) | `main` `5190872` |
| `prospera-comptabilite-service` | #6 | `dev` **`7fed6ce`** (rejoué de `5364b06` ; arbre identique) |

- `src/grand-livre/` :
  - `grand-livre.ts` : les règles pures (période, compte, devise, entiers exacts, soldes en deux colonnes, position
    et curseur, solde progressif, lignes et totaux, pages de comptes) ;
  - `grand-livre.service.ts` : la consultation (portée, tenue, période), puis toutes les lectures dans une session
    `snapshot` ; une agrégation `$facet` par compte (sommes, suite après le curseur, page) ; une agrégation par compte
    pour la liste ; `comptesMouvementes` exporté en `bigint` pour 967 ;
  - `vue.ts` : les nombres rendus, `MONTANT_HORS_BORNE` au-delà de 2^53 − 1 ;
  - `grand-livre.controller.ts`, `grand-livre.dto.ts`, `grand-livre.module.ts`.
- `src/common/refus.ts` : six refus nommés neufs. `src/ecritures/ecriture.schema.ts` : index `grand_livre_par_compte`.
  `src/module.manifest.ts` recopié à l'octet depuis `main`. README : section du grand livre.
- `test/socle/grand-livre.socle-spec.ts` : suite neuve (34 tests).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` du commit poussé) :
  **35 suites, 498 passés, 3 sautés** ; `npm run lint`, `tsc --noEmit` et `npm run build` verts dans l'image.
- **`npm run test:socle`** (vrai MongoDB 8.0 `rs0`, vrai Kafka, doublures HTTP d'auth, de dossier-service et de
  document-service) : **132/132**, dont 34 neufs.
  - **Jeu connu** (sept pièces, dont des à-nouveaux, une contre-passation et un brouillard) : 411100 sur l'exercice,
    six mouvements dans l'ordre date → journal → numéro, solde progressif juste, clôture nulle ; liste des cinq comptes
    exacte colonne par colonne, totaux 230 000 / 384 000 / 348 000 équilibrés ; mars : ouverture 148 000 D.
  - **Brouillard exclu** : ni mouvement ni montant ; compté à part (`brouillardsDansLaPeriode` 1 sur l'exercice, 0 en
    mars).
  - **Contre-passation** : 701100 et 443100 retombent à ce qu'ils seraient sans la pièce ; le mouvement cite
    l'originale (`contrePasse`).
  - **Bornes** : jour seul inclusif (le 20 mars contient P4), creux du 21 au 24, premier et dernier jour de
    l'exercice ; 422 `PERIODE_HORS_EXERCICE` (avec les bornes) et `PERIODE_INVALIDE` sur les deux routes ; 400 sur
    `du` mal formé, `limite` 0 ou 1 001, devise inconnue, paramètre inconnu ; `COMPTE_MALFORME` ; `CURSEUR_INVALIDE`.
  - **Exercice** : aux cahiers 409, non ouvert 404, clos consultable ; sans écriture validée : `devise: null`.
  - **Droit** : 403 `DROIT_INSUFFISANT` sans `comptabilite:dossier:consulter` ; 200 avec le droit seulement dans
    `droitsHorsJeton`.
  - **Devises** : XOF et XAF validées ⇒ 409 `DEVISE_A_PRECISER` ; `devise=XAF` ne rend que ses écritures.
  - **Sommes** : 2^53 − 2 et 1 rendent 2^53 − 1 exactement ; une unité de plus ⇒ 422 `MONTANT_HORS_BORNE`
    (`valeur` `"9007199254740992"`) ; débits internes de 2^53 + 1 (non représentable en double) contre-passés ⇒ solde
    d'ouverture **3** exactement (en double : 2).
  - **Pages** : 26 mouvements par pages de 7 (quatre pages) mises bout à bout = la lecture d'une traite, chaque
    `reporte` égal au solde du mouvement précédent ; une pièce qui mouvemente deux fois le compte : lignes 1 et 2.
  - **Concurrence** : 20 validations en même temps que 30 lectures. Chaque lecture d'un compte est cohérente (nombre,
    totaux, solde final = clôture, tous numérotés). Chaque liste est équilibrée, et brouillards + lignes validées = 20.
    15 lectures sur 15 ont vu une validation partielle : la course a bien eu lieu. La dernière lecture voit `VE-000001`
    → `000020`.
  - **Volume** (mesure) : 10 000 écritures validées (30 000 lignes) ; 411100 sur juin (833 mouvements, page de 200)
    en **317 ms** ; liste des 11 comptes en **567 ms**.
- **Mutations** (« rouge » = `Tests: … failed` et aucun `TS\d{4}`) :
  - **unitaires : 32**, 30 rouges sur une assertion. #22 est **équivalente** : si l'ouverture, les mouvements et la
    clôture s'équilibrent, les à-nouveaux s'équilibrent forcément. #28 (le filtre du curseur) n'est éprouvée que sur le
    socle (S5). Elles portent sur la période, le compte, la devise, les entiers exacts, la borne, l'ordre, le curseur,
    le solde progressif, les lignes et les totaux, le tri, les pages et la vue ;
  - **socle : 9/9 rouges** : brouillards admis, ouverture à borne incluse, `reporte` faux, ordre des journaux inversé,
    curseur qui reprend le même jour, à-nouveaux perdus, sommes en double, brouillards mal comptés, **lecture sans
    instantané** (vue par la course).
- **Pile `grp-b`** (compose du dépôt, image du commit, volumes neufs, verrou Docker pris de façon atomique) :
  `docker compose -p grp-b --profile comptabilite up -d --build` sain (quatre conteneurs `healthy`), `/api/v1/health`
  200 (`rs0`, primaire ; Kafka up). Les deux routes sont mappées et dans l'OpenAPI ; sans jeton : 401. Descendue avec
  ses volumes, images de preuve supprimées, verrou rendu.

## Pour la suite

- **STORY-967** (la balance dérivée) appelle `GrandLivreService.comptesMouvementes(portee, exercice, periode,
  codesDesANouveaux)` sans `limite` : tout, en `bigint`, dans un seul instantané. Elle refusera de publier tant que
  `brouillardsDansLaPeriode > 0` (Q2). Elle publiera les mouvements HORS à-nouveaux, puisque le hub chaîne lui-même le
  socle d'à-nouveaux (A-921, `INTEGRATION.md` §1 ter). Le libellé de chaque compte vient du plan du référentiel. Le
  `sourceSystem` est à faire ajouter par A à `INGESTION_SOURCE_SYSTEMS` avant la première publication.
- **Une devise par dossier** : 962 laisse chaque pièce choisir XOF ou XAF ; une règle « la devise du dossier » éviterait
  `DEVISE_A_PRECISER`. À poser avec la tenue (remplaçante, ou 970).
- **Les lectures ouvertes à la portée** (D-958-9) et le grand livre sous `comptabilite:dossier:consulter` : à aligner
  quand auth attribuera les droits `comptabilite:*` aux rôles du cabinet (avant B-967 : sinon tout rend 403 en réel).
- **Projection** : non retenue (D-966-1). Elle viendra si une mesure la réclame, sans changer le contrat de lecture.
  Mesuré ici : 30 000 lignes lues en moins de 0,6 s.
