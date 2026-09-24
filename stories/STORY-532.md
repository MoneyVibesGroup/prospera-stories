# STORY-532 : La liasse ne connaît que le LIBELLÉ de son exercice — ni dates, ni durée, et la DSF exige les trois

Status: in_progress

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
bornes capturées est **rattaché à la lecture** — par son `exerciceId` s'il le porte, sinon par son
libellé dans le dossier (la jointure de `refuserSiExerciceClos` et de la consultation). Introuvable ⇒
bornes `null`, `motifN: EXERCICE_NON_RATTACHE`. Jamais une date inventée à partir de « 2025 ». Les
bornes étant immuables, le rattachement rend celles qu'aurait données la capture.

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
