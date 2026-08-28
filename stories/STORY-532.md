# STORY-532 : La liasse ne connaît que le LIBELLÉ de son exercice — ni dates, ni durée, et la DSF exige les trois

Status: ready-for-dev

**Épic :** EPIC-011 — États financiers (liasse OHADA)
**Service :** `bilan-service` (`jeu-etats`)
**Points :** 8 · **Sprint :** S20
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

## Notes

- Voir [[STORY-468]] (le même manque côté prévisionnel), [[STORY-527]] (qui en dépend),
  [[STORY-303]] / [[FE-066]] (les bornes existent au dossier), [[STORY-454]].
