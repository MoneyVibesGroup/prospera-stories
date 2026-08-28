# STORY-541 : Retraitements d'homogénéisation — additionner des balances qui n'appliquent pas les mêmes méthodes est faux

Status: ready-for-dev

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation` (nouveau)
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-530** (le périmètre daté) · **STORY-531** (le socle d'agrégation)
**Origine :** arbitrage PO du 2026-08-28 — **niveau ③, consolidation SYSCOHADA complète**.

---

## Le fait

C'est le premier retraitement, et **celui qu'on saute le plus souvent** parce qu'il ne se voit pas :
l'agrégation additionne des balances **produites selon des méthodes comptables différentes**.

Une filiale amortit ses véhicules en 4 ans, la mère en 5. Une valorise ses stocks au CUMP, l'autre au
FIFO. Une provisionne ses créances douteuses à 50 %, l'autre à 100 %. **Chacune est régulière dans
ses comptes individuels** — et leur somme ne décrit aucune entité réelle.

⇒ **Consolider, c'est d'abord ramener toutes les entités aux méthodes du groupe.** Sans cette étape,
les six retraitements suivants s'appliquent à une base déjà fausse.

## Critères d'acceptation

- [ ] AC-1 — Un **référentiel de méthodes du groupe** est déclaré : durées et modes d'amortissement
      par nature, méthode de valorisation des stocks, règles de provisionnement. Déclaré au **dossier
      de la mère**, versionné et daté.
- [ ] AC-2 — Chaque retraitement est **une écriture de consolidation identifiée**, réversible, avec
      son motif et son entité d'origine. ⛔ Un retraitement fondu dans les soldes n'est pas
      auditable — et la consolidation est **exactement** ce qu'un commissaire aux comptes déroule.
- [ ] AC-3 — Les écritures de consolidation vivent dans un **journal de consolidation séparé**, qui
      ne modifie **jamais** les comptes individuels. Les balances des filiales restent intactes à
      l'octet.
- [ ] AC-4 — ⚠️ **Un retraitement d'homogénéisation a un effet d'impôt** : il modifie le résultat
      consolidé sans modifier la base fiscale de l'entité. ⇒ Il **alimente** [[STORY-545]] (impôts
      différés), et un retraitement qui n'y contribue pas doit le dire explicitement.
- [ ] AC-5 — Le retraitement est **rejoué à l'identique** d'un exercice sur l'autre tant que les
      méthodes ne changent pas, et son **cumul** est reporté (un écart d'amortissement se cumule
      d'année en année, il ne se recalcule pas à zéro).
- [ ] AC-6 — Une entité **déjà conforme** aux méthodes du groupe produit **zéro écriture**. Test
      obligatoire : un groupe homogène doit donner une consolidation identique à l'agrégation.

## Notes

- Voir [[STORY-531]] (le socle), [[STORY-542]], [[STORY-545]], `epics-consolidation-2026-08-28.md`.
