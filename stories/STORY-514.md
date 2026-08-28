# STORY-514 : Primes acquises ≠ primes émises — la provision pour primes non acquises

Status: ready-for-dev

**Épic :** EPIC-129 — Contrats, primes et quittances
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-513** (la période couverte est portée)
**Origine :** revue de l'artefact, 2026-08-27 — écart relevé dans `cima-assurances@1.0`.

---

## Le fait, mesuré dans l'artefact

`RP1` mappe le compte `70` — **primes ÉMISES**. Et `RT` (résultat technique) vaut, dans la table de
passage packagée :

```
RT = +RP1 +RP3 +RP5 −RC1 −RC5 −…
```

**Aucune variation de provision pour primes non acquises n'y figure.**

Or une prime annuelle émise le **1ᵉʳ octobre** couvre trois mois de l'exercice et neuf du suivant.
La comptabiliser entièrement en produit de l'exercice **surestime le résultat de 75 % de cette
prime**. Sur un portefeuille dont les échéances ne sont pas uniformément réparties dans l'année —
c'est-à-dire tous les portefeuilles — l'erreur est structurelle, pas marginale.

⚠️ **Et elle est invisible** : la balance reste équilibrée, `CAT = CPT`, tous les contrôles passent.

## Critères d'acceptation

- [ ] AC-1 — La **provision pour primes non acquises** est calculée **au prorata temporis** de la
      période couverte de chaque quittance, à la date d'arrêté. Méthode déclarée, pas supposée.
- [ ] AC-2 — Un poste de **variation** de cette provision entre au compte de résultat, et `RT`
      l'intègre. ⇒ La table de passage `cima-assurances` évolue — **nouvelle version du paquet**,
      avec son checksum et son statut.
- [ ] AC-3 — La provision est une **évaluation datée et versionnée** (AD-2, STORY-517) : elle porte sa
      méthode, sa date et son auteur.
- [ ] AC-4 — ⛔ **La prime acquise est publiée à côté de la prime émise, jamais à sa place.** Les deux
      chiffres existent, l'assureur les lit tous les deux, et confondre l'un pour l'autre est l'erreur
      que la story sert à empêcher.
- [ ] AC-5 — Test de non-régression sur un portefeuille dont **toutes** les échéances tombent au
      1ᵉʳ janvier : primes acquises = primes émises, variation nulle. Un cas où le nouveau calcul ne
      change rien prouve qu'il ne casse rien.

## Notes

- Voir [[STORY-513]], [[STORY-517]], [[STORY-518]] (les variations au CR), spine AD-1/AD-10.
