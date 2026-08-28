# STORY-518 : `RT` cesse d'être un résultat de trésorerie — les variations de provisions techniques entrent au compte de résultat

Status: ready-for-dev

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service` + référentiel `cima-assurances`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-514** (primes non acquises) · **STORY-517** (les provisions hébergées)
**Origine :** revue de l'artefact, 2026-08-27 — **AD-1** de la spine.

---

## Le fait, mesuré dans l'artefact

```
RT = +RP1 +RP3 +RP5 −RC1 −RC5 −…
```

`RP1` = primes **émises** (compte `70`). `RC1` = prestations **payées** (compte `60`). **Aucune
variation de provision technique.**

⇒ **`RT` est aujourd'hui un résultat d'encaissements et de décaissements, sous un libellé qui dit
« résultat technique ».** Un assureur dont les primes croissent verra un `RT` flatteur : les primes
entrent tout de suite, les sinistres se paient plus tard. **C'est structurellement le contraire de
ce qu'un compte technique doit montrer.**

À porter au crédit de l'auteur de l'amorce : le libellé du poste **le dit** — *« amorce, hors
variations de provisions techniques et séparation Vie/Non-Vie »*. Cette story est la levée de cette
réserve, et elle est **la raison d'être du palier 2**.

## Le résultat technique, tel qu'il doit se calculer

```
  primes acquises            = primes émises ± Δ provision pour primes non acquises
− charges de sinistres       = prestations payées ± Δ PSAP
− Δ autres provisions techniques (risques en cours, mathématiques vie)
± part des réassureurs (STORY-520)
− commissions et frais imputables au technique
= RÉSULTAT TECHNIQUE
```

## Critères d'acceptation

- [ ] AC-1 — De nouveaux postes de **variation** entrent au compte de résultat CIMA, et `RT` les
      intègre en `FORMULE` avec **opérandes signées** — la mécanique existe déjà (`EvaluateurFormule`,
      tech-spec B8), c'est la table de passage qui change.
- [ ] AC-2 — Nouvelle **version du paquet** `cima-assurances`, avec son checksum, byte-identique
      entre les deux services (règle AD-6 / STORY-368). ⚠️ `@1.0` reste packagé et **intact** : les
      versions coexistent, comme `sfd-bceao@1.0` et `@2.0`.
- [ ] AC-3 — ⛔ **Le libellé de `RT` perd sa mention « amorce » UNIQUEMENT quand les variations sont
      effectivement calculées.** Le retirer avant serait le mensonge le plus coûteux du programme.
- [ ] AC-4 — Un test compare `RT` **avec** et **sans** variations sur un jeu où les échéances ne sont
      pas uniformes : l'écart doit être significatif. ⚡ Un test où les deux donnent le même chiffre
      ne prouve rien — c'est ce que la version actuelle produit déjà.
- [ ] AC-5 — Les provisions consommées sont **celles retenues à la date d'arrêté** (STORY-517 AC-3),
      jamais les dernières connues.

## Notes

- Voir [[STORY-514]], [[STORY-517]], [[STORY-520]], [[STORY-521]], spine AD-1/AD-10.
