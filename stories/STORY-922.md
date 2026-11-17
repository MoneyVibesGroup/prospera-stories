# STORY-922 : retirer le code mort de la double lecture

Status: done

**Complexité :** faible (suppression de code sans appelant, trois copies identiques)

**Source :** `coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 ligne 922 ; dette 2 de STORY-918 (fin de la double
lecture : état publié seul, inconnu ⇒ refus).
**Dépôts :** `balance-service`, `bilan-service`, `prospera-fiscal-service` (tenus par A). Branche `MNV-922`, une PR par dépôt.
**Plage :** groupe A, n° 3 du lot 3. Fiche écrite juste avant de coder.

---

## Pourquoi

STORY-912 avait posé la double lecture de la garde d'accès : la décision de l'état publié, comparée à celle de l'ancienne
garde (droit `ACTIVE`, échéance). STORY-918 l'a close : l'état publié décide seul, inconnu ⇒ refus. Le fichier
`read-models/guards/double-lecture.ts` (copié à l'identique dans les trois services) garde pourtant les outils de la
comparaison, que plus aucun appelant n'utilise.

## Constat (recherche faite avant de coder, `src/` et `test/` des trois dépôts, plus dossier, kyc, BFF, plateforme, recette)

| Symbole (`double-lecture.ts`) | Appelants restants | Décision |
|---|---|---|
| `decisionAncienne` | aucun (ni code, ni test, ni autre dépôt) | **retiré** |
| `memeDecision` | aucun | **retiré** |
| `libelle` | aucun import. Les `libelle` des autres fichiers sont d'autres symboles (champ `libelle` des contrats et du paquet fiscal ; `libelle(…)` local de specs de référentiel/CIMA) | **retiré** (la fonction exportée seule ; aucun champ de contrat n'est touché, §1.8) |
| `DroitLu` (interface) | seulement `decisionAncienne` | **retiré** avec elle (orphelin) |
| `import { refuseeEnLectureSeule }` | seulement `decisionAncienne` | import retiré du fichier |

**Gardé :** `decisionPubliee`, `EtatPublieLu` (utilisés par les trois gardes d'accès) ; `lecture-seule.ts` et son spec.
`refuseeEnLectureSeule` n'a plus d'appelant hors de son propre spec : **dette nommée**, hors de cette story (le plan ne
nomme que trois symboles ; son retrait emporte un spec entier, à décider avec le prochain passage sur ces gardes).

## Décisions (recommandations appliquées, contestables)

- **D-922-1** — Le nom du fichier `double-lecture.ts` est **gardé** (renommer toucherait les trois gardes et la
  « copie à l'identique » annoncée ; aucun gain). Son en-tête est réécrit : il dit que la double lecture est close (918).
- **D-922-2** — Les trois copies restent identiques entre elles (comparées avant et après par `diff`).
- **D-922-3** — Aucun module Nest, aucune dépendance, aucun Dockerfile ne change ⇒ pas de Docker (§1.5).

## Critères d'acceptation

- **AC-1** : `decisionAncienne`, `memeDecision`, `libelle` et `DroitLu` n'existent plus dans les trois dépôts.
- **AC-2** : les trois copies de `double-lecture.ts` sont identiques.
- **AC-3** : `tsc`, lint des fichiers touchés, suites des gardes (unitaires + e2e concernés) verts ; ligne `Test Suites: … failed` lue.

## Definition of Done

- [x] `tsc` et lint verts dans les trois dépôts ; tests des gardes verts.
- [x] Trois PR code fusionnées en rebase ; PR de docs fusionnée.

## Livraison (2026-11-17)

🏁 **DONE** — balance #153 (dev `e67034a`), bilan #178 (dev `557d402`), fiscal #53 (dev `4ee8ed7`).

- Retirés : `decisionAncienne`, `memeDecision`, `libelle`, `DroitLu`, et l'import de `refuseeEnLectureSeule` du fichier. Trois
  copies identiques (`diff` sans sortie). En-tête réécrit (D-922-1).
- **Preuves (Node v25.2.1, sans Docker)** : `tsc --noEmit` vert ×3 ; lint du fichier touché vert (`endOfLine: auto`) ;
  `jest src/modules/read-models` : balance 26/26 suites, 336 tests ; fiscal (`-w 2`) 14/14, 179 tests ; bilan 32/34 suites.
  `git diff --stat` identique avec et sans `--ignore-cr-at-eol` (6 +, 41 −).
- **Échecs de bilan préexistants** : `read-models.module.graphe.spec.ts` (`Cannot find module 'bindings'`, client Kafka natif
  sous Node 25) et `dossier-scope.invariant.spec.ts` (un test, « le segment :dossierId est DÉCLARÉ à OpenAPI »). Les deux
  échouent à l'identique sur `origin/dev` : la seule modification mise de côté (`git stash`), mêmes fichiers relancés, mêmes
  résultats (2 suites en échec, 1 test). Dépendances non touchées.
- Les e2e ne sont pas relancés : aucun import du fichier hors des gardes ; `tsc` le prouve.
- **Dette nouvelle** : `refuseeEnLectureSeule` n'a plus d'appelant hors de son spec (trois dépôts).
