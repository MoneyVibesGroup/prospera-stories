# STORY-532 : La liasse ne connaît que le LIBELLÉ de son exercice — ni dates, ni durée, et la DSF exige les trois

Status: review

**Épic :** EPIC-011 — États financiers (liasse OHADA)
**Service :** `bilan-service` (`jeu-etats`, `export`) — un seul dépôt, aucun contrat d'événement touché
**Points :** 8 · **Sprint :** S20
**Complexité :** medium
**Origine :** §6.5 de `analyse-scalabilite-multireferentiel-2026-08-27.md` — **vérifié dans le code le 2026-08-27**, et le manque est plus large qu'annoncé.

---

## Le fait, lu dans le code

`CreerJeuEtatsDto` :

```ts
/**
 * à partir d'un libellé d'exercice et des soldes N (+ comparatif N-1 optionnel).
 * `exercice` est un libellé libre (ex. "2025") — la gestion réelle des exercices
 * [vit ailleurs]
 */
@ApiProperty({ description: 'Libellé/identifiant de l'exercice (1 à 64 caractères).' })
@Matches(/\S/, { message: 'exercice ne peut pas être vide' })
exercice!: string;
```

Et `JeuEtatsResponseDto` publie `exercice!: string` — `'2025'`.

⇒ **La liasse ne sait pas quelles dates elle couvre.** Elle porte une **étiquette de 1 à 64
caractères**, saisie à la main. Ni date de début, ni date de clôture, ni durée.

⚠️ **Ce n'est pas seulement la durée qui manque, ce sont les bornes** — le constat de départ était
donc en dessous de la réalité.

## ⚠️ Mise à jour du 2026-09-24 — le fait a bougé depuis la rédaction (mesuré dans le code)

- **M1 — Le libellé n'est plus saisi** (STORY-381) : `CreerJeuEtatsDto` reçoit `balanceId`, et le
  libellé est **résolu** depuis le read-model `exercices_dossier` par l'`exerciceId` de la balance ;
  le jeu porte `exerciceId`. ⇒ **Les bornes sont à portée de main** : `exigerBalancePortante` lit
  l'exercice (`parId`, qui rend `debut` et `fin`)… et n'en garde que le libellé.
- **M2 — La liasse d'un jeu d'états ne porte AUCUN champ de période.** Les cinq champs de STORY-430
  (`exerciceN`, `exerciceN1`, `dureeMoisN`, `dureeMoisN1`, `comparabiliteReduite`) ne sont posés que
  par les dry-run, depuis le corps de la requête (`resumerComparabilite`). Le contrat existe ; le jeu
  ne le remplit pas.
- **M3 — Le snapshot fige la liasse et la devise, ni bornes ni durée.** Son empreinte scelle sept
  champs fixes (`liasse`, `soldesN`, `soldesN1`, `referentiel`, `moteurVersion`, `exercice`,
  `version`) : y ajouter les bornes rendrait les nouvelles empreintes incomparables aux anciennes.
  La devise (STORY-490, D-490-4) est rangée **à côté** — le patron est là.
- **M4 — Le N-1 est ANONYME.** `soldesN1` arrive du corps, sans exercice désigné : aucun
  identifiant, libellé ni période N-1 n'existe nulle part. Doctrine de STORY-430 : *« le comparatif
  se désigne, il ne se devine pas »*.
- **M5 — La durée a UNE convention dans `bilan-service`** : `dureeEnMois` (STORY-430) — mois
  **révolus, tronqués** ; `dureeMoisExercice` (STORY-468) lui délègue, et un test interdit un second
  calcul. Le « 9,5 mois » de la maquette ne sort d'aucune convention du produit : du 15 mars au
  31 décembre, c'est **9** mois révolus (`balance-service` compte 286 jours 30/360 pour son prorata,
  `dossier-service` des jours réels).
- **M6 — STORY-527 ne dépend plus de cette story** : son prorata vit dans `balance-service`, en jours
  30/360, sur SON read-model d'exercices (fiche 527, D-527-2). STORY-468 porte déjà la durée
  (`HypothesesBase.dureeMois`, lue au read-model par `exerciceId`). Restent consommateurs : l'export
  (qui ne lit aujourd'hui que le libellé), la DSF (STORY-537 AC-6), STORY-534.
- **M7 — L'existant.** Les jeux antérieurs à STORY-381 (sans `exerciceId`) n'ont jamais été repris ;
  le code les traite par replis (libellé, `null`), jamais par refus. Les bornes d'un exercice sont
  **immuables** une fois ouvert (`dossier-service` : ouvrir, clore, rouvrir — rien d'autre), minuit
  UTC, fin **incluse**.
- **M8 — L'export** (`modeleLiasse`) ne porte que le libellé (métadonnée « Exercice », titre) : aucune
  « Durée (en mois) ». Son empreinte se calcule sur le document produit.

## Pourquoi ça compte

1. **La DSF porte une colonne « Durée (en mois) ».** Un état déposé sans elle est incomplet.
2. **Un premier exercice de 18 mois ou une clôture décalée sont le cas NORMAL** d'une entreprise qui
   démarre — donc de la persona la plus nombreuse du produit. La maquette le sait déjà : *« le
   premier exercice est irrégulier (9,5 mois) »*.
3. **Le dossier, lui, porte des bornes** (`ExerciceAtelier.bornes`, exercices à bornes libres,
   STORY-303 / FE-066). L'information **existe** un service plus haut et ne descend pas.
4. ⚡ **STORY-527 en dépend** : une dotation aux amortissements au prorata temporis exige la durée
   réelle de l'exercice. Sans elle, tout plan d'amortissement d'un exercice irrégulier est faux.
5. **STORY-468** avait fiché le même manque côté prévisionnel (`AncresProjection` et
   `HypothesesBase` ne portent pas la durée). ⇒ **C'est le même trou, à deux endroits** : l'étiquette
   d'exercice n'a jamais porté ses bornes nulle part.

## Critères d'acceptation

- [ ] AC-1 — Le jeu d'états porte les **bornes de son exercice** (début, fin) et sa **durée en
      mois**, **héritées du dossier** — jamais saisies, jamais déduites du libellé.
- [ ] AC-2 — La durée est **calculée** depuis les bornes et publiée. Un exercice de 9,5 mois rend
      une durée, pas un arrondi à 12.
- [ ] AC-3 — ⚠️ **Les liasses existantes gardent leur libellé** et reçoivent leurs bornes par
      rattachement au dossier quand il est possible ; sinon, bornes `null` **et statut disant
      pourquoi**, jamais des dates inventées à partir de « 2025 ».
- [ ] AC-4 — Une **version figée** rend les bornes qui étaient les siennes, jamais celles du dossier
      à l'instant de la lecture — même règle que la devise (STORY-490 AC-1).
- [ ] AC-5 — Le comparatif **N-1** publie **ses propres** bornes et sa propre durée. ⛔ Comparer un
      exercice de 18 mois à un exercice de 12 sans le dire est un contresens que l'écran présenterait
      comme une évolution d'activité.
- [ ] AC-6 — La durée est **exposée au contrat** pour que l'export et la DSF la portent.

## Les décisions (cadrage du 2026-09-24)

**D-532-1 — Les bornes se CAPTURENT à la création**, depuis l'exercice que `exigerBalancePortante` lit
déjà — jamais saisies, jamais déduites du libellé (AC-1). Rangées sur le jeu, **recopiées dans le
snapshot à la validation, hors empreinte** (patron de la devise) : une version figée rend SES bornes
(AC-4). Le recalcul exige la même balance, donc le même exercice : les bornes d'un jeu ne bougent
plus après sa création.

**D-532-2 — La durée, c'est `dureeEnMois`** (mois révolus, tronqués), la convention unique de
`bilan-service`, **calculée à la publication** depuis les bornes, jamais stockée. Un exercice de
9,5 mois rend 9 — pas un arrondi à 12 (AC-2) — et les bornes exactes sont publiées pour qui compte
en jours.

**D-532-3 — Publication typée : `periode` sur le jeu ET sur la version figée** (AC-6). Le bloc de
STORY-430 (`ComparabiliteExercicesDto`, par héritage, calculé par `resumerComparabilite`), plus
`motifN` et `motifN1` quand une période manque. La liasse elle-même n'est pas touchée : son contenu
est scellé.

**D-532-4 — Le N-1 se DÉSIGNE, jamais deviné** (AC-5, doctrine 430) : `exerciceIdN1` optionnel à la
création et au recalcul — un exercice du MÊME dossier, lu dans `exercices_dossier` ; il exige
`soldesN1` ; il doit s'achever avant le début de N (`EXERCICES_NON_ORDONNES`, la garde de 430) ;
inconnu, ou d'un autre dossier ⇒ `404` générique. Ses bornes se capturent et se figent comme celles
de N. **Non-régression** : `soldesN1` sans désignation reste accepté — période N-1 `null`,
`motifN1: N1_NON_DESIGNE` ; sans comparatif, `motifN1: SANS_COMPARATIF`.

**D-532-5 — L'existant, sans reprise de données** (règle du projet, AC-3) : un jeu ou une version sans
bornes capturées est **rattaché à la lecture par son `exerciceId`**. Sans `exerciceId` (antérieur à
STORY-381), ou introuvable ⇒ bornes `null`, `motifN: EXERCICE_NON_RATTACHE`. Jamais une date inventée
à partir de « 2025 ». Les bornes étant immuables, le rattachement rend celles qu'aurait données la
capture. *(Amendée le 2026-09-24, en revue de code : le repli par LIBELLÉ initialement écrit ici n'est
pas retenu — le libellé n'est pas une clé : `libelleDepuisBornes` nomme « 2024 » deux exercices
distincts d'une même année civile, et un rattachement par libellé daterait une liasse avec les bornes
d'un autre exercice. STORY-381 notait d'ailleurs qu'aucune liasse n'était encore produite depuis un
écran.)*

**D-532-6 — L'export porte la période** (AC-6) : métadonnées « Début », « Clôture », « Durée (en
mois) » (et celles du N-1 quand il est daté), lues à la même source que la devise — le jeu pour un
brouillon, le snapshot pour une version figée. Une liasse non datée le dit, sans date inventée.

## Hors périmètre — hooks inertes documentés

- **La reprise des données existantes** (poser les bornes en base sur les jeux et versions
  antérieurs) : différée, comme toute migration (règle du projet) — le rattachement à la lecture
  (D-532-5) couvre l'affichage.
- **La comparaison inter-exercices** (`GET …/bilan/comparaison/exercices`, FR-024) : elle adresse
  encore les exercices par libellé, sans bornes ni drapeau de comparabilité — son hook (tri par date
  de début) est documenté dans son service.
- **STORY-468** pourra lire la durée sur la version figée plutôt qu'au read-model (le patron de sa
  devise) ; **STORY-537** lit `periode` au contrat.
- **L'écran** (colonnes datées, « 18 mois comparés à 12 ») : une story frontale.
- **Aucune proratisation de montant** — la vigilance de STORY-430 tient : la période informe, elle ne
  corrige rien.

## Notes

- Voir [[STORY-468]] (le même manque côté prévisionnel), [[STORY-527]] (qui en dépend),
  [[STORY-303]] / [[FE-066]] (les bornes existent au dossier), [[STORY-454]].

## Progress Tracking

- 2026-09-24 — branche `MNV-532` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-24 — **cadrage fait avant tout code** : le fait de la story avait bougé (STORY-381, 430,
  468, 490, 527) — 8 constats mesurés, 6 décisions. Les bornes sont déjà LUES à la création et jetées
  (M1) ; le contrat de la période existe (STORY-430) mais le jeu ne le remplit pas (M2) ; le N-1 est
  anonyme et se désignera (M4) ; la durée garde LA convention de `bilan-service` (M5) ; STORY-527 ne
  dépend plus d'ici (M6).
- 2026-09-24 — **dev `bilan-service`** (commit `4e99613`, branche `MNV-532`) : bornes capturées à la
  création (celles que `exigerBalancePortante` lisait déjà), recopiées au gel hors empreinte ; N-1 désigné
  par `exerciceIdN1` (création et recalcul) avec ses trois refus ; `periode` sur les 7 routes qui rendent
  un jeu et sur la version figée — le bloc de STORY-430 par héritage (`resumerComparabilite`), plus
  `motifN`/`motifN1` ; rattachement à la lecture par `exerciceId` ; export : Début, Clôture, Durée (en
  mois), N-1 et comparabilité. Le compilateur impose la période à chaque appelant (paramètre requis).
  Portes : lint 0, build, `test:cov` 4 041 tests (99,12 / 95,49 / 99,4 / 99,21 ; `periode-liasse.ts`
  100 %), e2e 27 suites / 876 — dont 7 e2e STORY-532 (AC-4 discriminant : après le gel, le read-model
  répond une autre année, la version rend la sienne) et 4 gardes de contrat OpenAPI. **14 mutations,
  toutes rouges** (capture, gel, garde de chronologie, 404, pré-contrôle, rattachement, motifs, export,
  contrôleur). L'empreinte d'export figée par STORY-528 reste valide une fois les trois lignes de
  période retirées : STORY-532 n'ajoute rien d'autre au document.
- 2026-09-24 — **vérification docker sur stack NEUVE** (`down -v`), tout par les API réelles, **0 échec** :
  N-1 IRRÉGULIER (17 mars → 31 décembre, clos) désigné face à un N de 12 mois ⇒ `dureeMoisN1: 9`,
  `comparabiliteReduite: true` ; les trois refus (sans soldes 400, exercice d'un AUTRE cabinet 404, N
  désigné comme son N-1 400) n'écrivent aucun jeu ; bornes en base en **dates BSON** sur le jeu et sur le
  snapshot v1 ; `periode` identique à la création, sur le jeu figé et sur la version 1 ; l'export XLSX
  imprime début, clôture, durée, N-1 et comparabilité ; le cabinet B reçoit 404 sur la liasse de A.
  `docker compose stop` ensuite.
- 2026-09-24 — ⑥ **revue de code** (scan `opus`, lentille `ponytail-review` ; synthèse en session) :
  2 constats confirmés, 3 tests qui ne discriminaient rien (mutants survivants confirmés), 1 point à
  trancher. Corrigés dans un commit dédié (`e3e8466`) :
  - ⛔ **bloquant — `deposer` publiait la période du JEU** (celle de la dernière version) à côté de la
    liasse de la version DÉPOSÉE, qui peut être antérieure (v1 au N-1 désigné, v2 anonyme, dépôt de
    v1) : le service désigne la version servie (`versionServie`), la période se lit sur elle — e2e du
    scénario ajouté ;
  - Swagger : les périodes et durées de `PeriodeLiasseDto` redéclarées avec leur sens pour une liasse
    (les descriptions héritées de STORY-430 disaient « telle que fournie » par la requête) ;
  - gardes ajoutées : la période lue sur le BON document route par route, la re-désignation transmise
    au recalcul, un N-1 de même durée sans « comparabilité réduite » à l'export ;
  - **D-532-5 amendée** : rattachement par `exerciceId` seul — le libellé n'est pas une clé
    (`libelleDepuisBornes` nomme « 2024 » deux exercices distincts d'une même année) ;
  - `ponytail` : `PeriodeLiasseDto.depuis` réduit à un `Object.assign`.
  **6 mutations sur les correctifs, toutes rouges.** Portes : lint 0, build, `test:cov` 4 042, e2e 877.
  ⚠️ Un premier `test:cov` a échoué sur le test de coût de l'agrégat (STORY-531) : 3,8 s au lieu de
  ~0,6 s mesurés seul — la machine était à une charge de 138 sur 8 cœurs (conteneurs d'un autre
  projet). Seuil NON touché (il est dimensionné sur le mutant quadratique, 4,4 s) ; rejoué à charge
  normale : vert.
