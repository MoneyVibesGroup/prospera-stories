# STORY-712 : Un seul compteur de consommation

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F4
**Prérequis :** **STORY-596** (consommation par période), **STORY-597** (compteurs pré-agrégés), **STORY-639** (arrêté)
**Origine :** rail F.

---

## Le récit

En tant qu'**organisation cliente**, je veux que le chiffre de mon écran de consommation soit celui de
l'arrêté de fin de mois, afin de ne jamais avoir à demander lequel des deux est vrai.

## Le fait

⛔ **Deux lectures comptent les mêmes faits, par deux chemins.** L'écran de l'organisation
(`ConsommationService.parPeriode`, STORY-596) **agrège les `Envoi` à la lecture** ; l'arrêté
(STORY-639) et la vue plateforme (STORY-597) lisent les **compteurs pré-agrégés**
`compteurs_consommation`, tenus dans la transaction du fait. Deux règles de calcul pour un seul nombre :
une correction de coût, un fait tardif imputé à la période suivante (STORY-639, AC-2), ou une purge
d'`Envoi` (STORY-586) suffisent à les faire diverger — et le mois arrêté affiche alors deux totaux.

## Critères d'acceptation

- [x] AC-1 — ⚡ Le compteur pré-agrégé est **la** source du total d'une période, pour l'organisation
      comme pour la plateforme ; l'écran de l'organisation lit les compteurs, plus les `Envoi`.
- [x] AC-2 — Une période **close** se restitue depuis son **arrêté**, à l'identique.
- [x] AC-3 — ⚠️ La ventilation par module appelant et par rôle (FR-N58) garde sa lecture des `Envoi` si
      le compteur ne porte pas ces axes — c'est une **ventilation**, pas un total, et l'écran le dit.
- [x] AC-4 — Un test prouve l'égalité du total restitué à l'organisation et de l'arrêté, sur un jeu
      comprenant un fait tardif et une correction de coût.
- [x] AC-5 — ⛔ La devise reste dans la clé : aucune somme entre devises.

---

## Livré le 2026-10-23 — branche `MNV-712` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 449/3 449 (260 suites) · `npm run test:e2e` 248/248 · lint 0 · build vert.

- **`GET /consommation` lit le compteur** (`compteurs_consommation`), la même source que l'arrêté
  (STORY-639) et la vue plateforme (STORY-597). Il ne lit plus les `Envoi` pour un total — ce qui règle
  aussi un défaut que la fiche ne nommait pas : après la purge des `Envoi` à treize mois (STORY-586),
  l'écran de l'organisation tombait à zéro pour ces mois-là, alors que le compteur ne s'efface jamais.
- **AC-2 tient par construction** : l'arrêté est une copie figée du compteur, et le compteur d'une
  période close ne bouge plus (un fait tardif est imputé au mois suivant). La ligne le dit (`arretee`) et
  nomme les reports qu'elle contient (`periodesReportees`).
- **AC-3** : la ventilation par auteur, rôle et module reste lue des `Envoi` — le compteur ne désigne
  personne (STORY-597) ; la route le documente (« une ventilation, pas un total »).
- **AC-4** : test qui fait passer les **vrais** `CompteursService` et `ClotureService` par un double qui
  se comporte comme Mongo (filtres, `$inc`/`$addToSet` en `upsert`, valeurs par défaut à l'insertion,
  index unique de l'arrêté) — trois SMS en septembre, arrêté le 2 octobre, puis un accusé tardif et un
  coût réel : le total de l'écran pour septembre **égale** l'arrêté (3 envois, 75 F), et l'écart
  (+15 F, une délivrance) apparaît en octobre avec `periodesReportees: ['2026-09']`.
- Une seule définition de « parti / délivré / échoué » (`domain/consommation/volumes.ts`), employée par
  la restitution (depuis `parStatut`) et par la ventilation (dans son pipeline).
- ⚠️ Une case peut naître d'un **fait tardif seul** (une transition imputée au mois suivant) : le service
  lit `nombre`, `coutMineurTotal` et `segmentsTotal` avec `?? 0`, et un statut négatif dans `parStatut`
  s'additionne tel quel.

⛔ **Ouvert** : `agregats_envois` (STORY-586) reste un second agrégat, mais d'un autre objet (ce qui
reste d'un journal effacé) ; leur fusion éventuelle relève toujours des points ouverts de STORY-597.
