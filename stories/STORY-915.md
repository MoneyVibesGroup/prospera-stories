# STORY-915 : Le portefeuille porte l'état des axes de chaque dossier

Status: in-progress

**Complexité :** petite (un champ dérivé dans une agrégation existante)

**Ticket :** `tickets/TICKET-BACKEND-portefeuille-ne-porte-plus-l-etat-des-axes.md` (ouvert par FE-061)
**Service :** `dossier-service`
**Plage :** groupe A, n° 11 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Sans dépendance.
Fiche écrite **avant** de coder.

---

## Ce qui est déjà là (STORY-359, après l'ouverture du ticket)

`GET /api/v1/dossiers` sert le portefeuille par **une seule** agrégation Mongo (exercice ouvert, décision d'axes en
vigueur, états d'amont, compteurs) ; chaque ligne porte un `avancement` dérivé (`A_CONFIGURER` d'abord) et le tri
`tri=etat` met « ce qui appelle un geste » en tête ; le compteur `aConfigurer` existe. Le test « une seule requête
Mongo » garde l'absence de N+1.

## Ce qui manque

`A_CONFIGURER` confond deux causes : **pas d'exercice ouvert** et **axes non décidés**. La puce « Axes à déterminer »
de FE-059a a besoin de la seconde seule. Et sans exercice ouvert, l'agrégation ne cherche aucune décision (garde
contre `$lte: [x, null]`) : un dossier aux axes décidés y passerait pour « axes à déterminer », alors que
`GET /dossiers/{id}/axes` résout à **aujourd'hui** et rend la décision en vigueur.

## Ce que la story livre

- `axesDetermines: boolean` sur chaque ligne du portefeuille, calculé **dans la même agrégation** : il existe une
  décision d'axes dont la date d'effet est ≤ la date de résolution de `GET /axes` — le début de l'exercice ouvert,
  sinon l'instant de la requête. Une décision **héritée** d'un exercice antérieur compte (elle vaut) ; une décision
  **future** ne compte pas (elle n'est pas encore applicable).
- L'instant vient du service (`maintenant`, passé à l'agrégation), pas de `$$NOW` : testable, et une seule horloge.

## Décisions

- **D-915-1 — Option 1 du ticket (booléen dérivé).** Le couple `systemeComptable`/`regimeFiscal` déjà servi par la
  ligne (STORY-359, daté par `exerciceOuvert`) reste tel quel ; `DossierResponseDto` (fiche d'un dossier) n'en
  reprend aucun.
- **D-915-2 — `avancement` inchangé.** Un dossier sans exercice ouvert reste `A_CONFIGURER` (il faut ouvrir un
  exercice) ; `axesDetermines` dit seulement si, en plus, les axes sont à décider.

## Critères d'acceptation

- **AC-1** : dossier sans aucune décision ⇒ `axesDetermines: false`.
- **AC-2** : décision héritée (date d'effet antérieure au début de l'exercice ouvert) ⇒ `true`.
- **AC-3** : sans exercice ouvert, décision déjà en vigueur ⇒ `true` ; décision future seule ⇒ `false`.
- **AC-4** : une page reste servie par **une** agrégation (aucune requête par dossier), quelle que soit sa taille.
- **AC-5** : `DossierResponseDto` ne réintroduit ni `systemeComptable` ni `regimeFiscal`.

## Definition of Done

- [ ] Unitaires (Node 24, étage `verification`), lint, `tsc` verts.
- [ ] Pile réelle : AC-1 → AC-3 prouvés sur MongoDB 8.0 par `GET /api/v1/dossiers`.
- [ ] Mutation : `$ifNull` retiré (sans exercice ⇒ jamais déterminé) ⇒ rouge sur la pile.
- [ ] PR code et docs fusionnées ; ticket fermé.
