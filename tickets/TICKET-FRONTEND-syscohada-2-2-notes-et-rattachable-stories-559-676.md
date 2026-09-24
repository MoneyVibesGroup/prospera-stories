# TICKET FRONTEND — `syscohada-revise@2.2` : notes annexes (STORY-559) et postes rattachables (STORY-676)

**Service :** `bilan-service` · **Statut back :** livré (`prospera-bilan-service#137`, `#138`)
**Artefact :** `syscohada-revise@2.2` — servi aux organisations dès que STORY-677 l'octroie (packs).
**Régénérer les types** depuis `/api/docs` : trois champs changent de TYPE, un client généré
rejetterait sinon la première réponse `@2.2`.

---

## 1. Ce qui change de type (STORY-559) — à gérer même sans écran neuf

| Champ | Avant | Maintenant | Où |
|---|---|---|---|
| `note` d'un poste | `string \| null` | `string \| string[] \| null` | `PosteEtatDto` (référentiel), lignes et SIG du compte de résultat, lignes du TFT |
| `NoteAnnexe.totalN` | `number` | `number \| null` | notes annexes |
| `NoteAnnexe.mode` | `VENTILATION \| TRAME` | `+ MIXTE` | notes annexes |

- **`note` liste** : `RL` et `RN` renvoient à `["3C", "28"]`. À l'écran, l'afficher **comme le
  formulaire** : `3C&28` (jointure par `&`). Un lien de navigation par renvoi.
- **`totalN: null`** : la note mêle des familles de postes (actif/passif, produits/charges) — ex. note
  12 « ECARTS DE CONVERSION » — ou n'a aucun poste. Afficher une **case vide**, **jamais `0`** : le
  document est opposable, `0` affirmerait un montant.
- **`mode: MIXTE`** : une part calculée ET une part à saisir. Les postes portent leur `ventilation`
  (comme `VENTILATION`) **et** la note expose ses `colonnes` + accepte des `lignes` par
  `PUT …/complements` (comme `TRAME`). Tant que `detailACompleter` est `true`, l'écran réclame la
  saisie. `provenance` décrit la part **à compléter** (`A_COMPLETER` / `SAISIE`).

## 2. Ce que la liasse gagne (STORY-559)

- **43 notes** au lieu de 11, dans l'**ordre du formulaire** (`1, 3A, 3B, 3C, 3D, 3E, 4 … 34`) — la
  liste arrive triée, **ne pas la retrier** (`16B < 16Bbis`, `23` puis `24`).
- Une note **citée par aucun poste** sort quand même : `postes: []`. Ne pas la masquer — c'est une
  feuille du classeur de dépôt.
- `colonnes` = le tableau principal de la feuille officielle, **de gauche à droite, colonne de
  libellés comprise** ; un en-tête sur plusieurs niveaux est joint par « — »
  (`"AUGMENTATIONS B — Acquisitions Apports Créations"`). Les lignes saisies s'alignent dessus.
- Les notes `2` et `35` (feuilles narratives) ne sont **pas** déclarées.

## 3. Le sélecteur de surcharge (STORY-676)

`GET /api/v1/referentiel/postes` publie un nouveau booléen **requis** `rattachable` : le poste peut-il
recevoir un compte ? Les sous-totaux et intitulés (`AD`, `AI`, `AQ`, `AZ`, `BG`…) valent `false`.

- **Le sélecteur de cible d'une surcharge filtre sur `rattachable === true`.** Proposer un poste
  `false` renvoie désormais **422 `POSTE_INCONNU`** (auparavant accepté puis perdu en silence).
- ⚠️ Une surcharge déjà validée vers un poste devenu sous-total fait sortir le compte en
  **« comptes non mappés »** (contrôle `COMPTES_NON_AFFECTES`) : l'écran de mapping doit l'y montrer
  comme à reclasser.

## Critères de recette

- [ ] Types régénérés ; aucun `note` traité comme chaîne seule, aucun `totalN` affiché `0` quand il
      est `null`.
- [ ] `RL` affiche `3C&28` ; la note 12 affiche un total vide.
- [ ] Une note `MIXTE` (ex. `16A`) montre sa ventilation ET sa trame à saisir ; après saisie,
      `detailACompleter` passe à `false`.
- [ ] Le sélecteur de surcharge n'offre aucun poste `rattachable: false`.
