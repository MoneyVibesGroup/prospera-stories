# STORY-440 : La batterie ne porte ni sévérité ni cible adressable, et son drapeau `valide` repose sur deux contrôles dont l'un est tautologique

Status: in_progress

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/controles-coherence.types.ts`, `etats/controles-coherence-production.service.ts`
**Points :** 3 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« Type de Contôles »*.

---

## ✅ Arbitrage (2026-08-27)

**AC-4 tranché : au contrat.** Voir l'AC lui-même. Le reste de la fiche est inchangé —
AC-1 (sévérité), AC-2 (cible adressable) et AC-6 (le verdict ne bouge pas) ne demandaient
pas d'arbitrage.

## Le fait — trois manques, une même conséquence

### ① Il n'y a pas de sévérité

L'AC-3 de **FE-033** demande « anomalies listées avec **cible, sévérité, bloquant** ».
`ControleArticulation` porte `categorie: 'BLOQUANT' | 'INFORMATIF'` et `elements[]`. **La
sévérité n'existe pas** — et ce n'est pas la catégorie : un écart de 905 000 sur le TFT et un
écart de 1 franc sur une note sont tous deux `INFORMATIF`.

### ② La « cible » n'est pas adressable

`ControleElement.ref` est une **chaîne libre** : `'totalActifN'`, `'note 7'`, `'variationTft'`,
`'BZ'`. Le front peut l'**afficher** ; il ne peut pas y **renvoyer** sans câbler sa propre table
de correspondance — c'est-à-dire sans devenir le **second arbitre** que FE-030 puis FE-031 ont
explicitement refusé.

### ③ `valide` repose sur deux contrôles, dont un qui ne peut pas échouer

`valide = tous les BLOQUANT sont OK`. Il y en a **deux** : `EQUILIBRE_BILAN` (vrai contrôle) et
`COHERENCE_RESULTAT` — dont le volet `CR = passif` est **nul par construction** (STORY-426).
En pratique : **un contrôle bloquant réellement faillible**. Sur un référentiel réduit
(SFD-BCEAO), les deux autres passent `NON_APPLICABLE` avec `coherent: true` — et le vert final
est **le même à l'écran** que celui d'une liasse SYSCOHADA complète.

Mesuré contre les **8 contrôles intermontants** que l'administration applique au dépôt
(feuille *« Type de Contôles »*) : **1 réellement calculé sur 8**.

## Critères d'acceptation

- [ ] AC-1 — `ControleArticulation` porte `severite: 'CRITIQUE' | 'MAJEURE' | 'MINEURE' | 'AUCUNE'`,
      dérivée de l'écart **relatif** à la grandeur contrôlée (seuils déclarés par le référentiel,
      pas codés en dur — patron `regles.toleranceTresorerie`).
- [ ] AC-2 — `ControleElement` devient adressable : `{etat, poste, ref, valeur}` — `etat`/`poste`
      `null` quand l'élément est un total global (`totalActifN`). Le champ `ref` reste, pour
      compatibilité.
- [ ] AC-3 — `ControlesCoherenceProduit` porte un **récapitulatif** : nombre de contrôles
      `CALCULE` / `NON_APPLICABLE` / `INDETERMINABLE`, pour qu'un `valide: true` obtenu sur deux
      contrôles applicables ne se lise pas comme un `valide: true` obtenu sur quatre.
- [ ] AC-4 — La **liste des contrôles non couverts** est publiée **au contrat** (comptes écartés,
      identité des exercices comparés, balance après clôture, articulation note ↔ poste,
      articulation comptable ↔ fiscal), chacun avec son ticket. ✅ **Arbitré le 2026-08-27 : le
      contrat, pas la documentation.** Devant un voyant vert, la première question d'un réviseur
      est « *qu'est-ce que vous n'avez pas vérifié ?* ». Une note d'`@ApiOperation` ne lui parvient
      jamais ; et laissée au front, la liste est **codée en dur** — c'est ce que fait la maquette
      FE-033 aujourd'hui, et elle périmera en silence au premier contrôle ajouté.
- [ ] AC-5 — Agnosticisme P7 : rien de tout ceci n'ajoute de structure OHADA au moteur.
- [ ] AC-6 — Non-régression : `valide` garde **exactement** sa sémantique actuelle. Cette story
      **décrit** mieux, elle ne change pas le verdict — le gate reste STORY-064.

## Conséquences ailleurs

- ⛔ **FE-033** ne peut pas servir son AC-3 à la lettre sans AC-1/AC-2 : la maquette affiche les
  `elements[]` bruts et le dit à l'écran.
- **FE-034** lit ce drapeau pour autoriser la validation : AC-3 est ce qui l'empêchera d'annoncer
  « tout est vert » sur une liasse où deux contrôles sur quatre n'ont pas eu lieu.
- **FE-078** porte la moitié « comptable ↔ fiscal » des 8 contrôles de l'administration.


## Progress Tracking

**Statut : `in_progress`** — branches `MNV-440` créées dans `docs/` et `bilan-service` **avant** la
première ligne de code.

```
docs             MNV-440
bilan-service    MNV-440
```

⚠️ **Un seul dépôt de module** : aucun artefact de référentiel n'est régénéré, donc pas de recopie
byte-identique vers `balance-service`.
