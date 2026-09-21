# STORY-522 : La classe 8 CIMA se lit par liste explicite, jamais par racine — la base imposable exactement doublée

Status: in_progress

**Complexité :** high

**Épic :** EPIC-133 — Comptes de résultat technique Vie / Non-Vie et compte non technique
**Service :** `assurance-service` + `balance-service` (`modules/fiscal`) + référentiel
**Points :** 8 · **Sprint :** S20
**Origine :** revue de l'artefact, 2026-08-27 — **AD-9** de la spine ; consolide la garde de STORY-488 AC-5.

---

## Le fait, mesuré dans l'artefact

```
racinesDeGestion: ['6', '7', '80', '82', '83', '84', '85', '86']
```

La **classe 8 du plan CIMA mêle des comptes de gestion et des comptes de REGROUPEMENT**. Un compte
de regroupement reprend, par construction, des montants déjà portés par les comptes qu'il regroupe.

⇒ Un repli générique qui balaie ces racines **compte deux fois les mêmes montants**. Le repli a déjà
été **mesuré** sur ce référentiel : la base imposable ressortait **exactement doublée**, et **aucun
contrôle ne s'en apercevait** — le calcul était juste, sa source ne l'était pas.

⚡ **C'est le meilleur avertissement de tout ce vertical, et il se généralise :** sur un référentiel
sectoriel, **un traitement générique qui « marche » est le mode de panne le plus probable**, pas le
rassurant. Rien ne refuse, rien ne déséquilibre, et le nombre est faux d'un facteur deux.

---

## Cadrage mesuré avant de coder (2026-09-21)

### M1 — ⛔⛔ Le doublement n'est pas un risque théorique : il est dans les racines PUBLIÉES

STORY-369 avait supprimé le repli générique `[6, 7, 8]`. Le paquet publie depuis ses propres racines
— et **l'une d'elles est un compte de regroupement** :

```
cima-assurances@4.0 → racinesDeGestion: ['6', '7', '80', '82', '83', '84', '85', '86']
```

**Mesuré** en rejouant `calculerResultatComptable` (`balance-service/src/modules/fiscal/fiscal.regles.ts:432-444`)
sur une balance d'après inventaire — classes 6/7 encore soldées **et** compte 80 ayant reçu le
virement de clôture :

| ligne | débit | crédit | racine qui capte |
|---|---|---|---|
| `70` primes | — | 900 000 000 | `'7'` |
| `60` prestations | 760 000 000 | — | `'6'` |
| `80` exploitation générale | — | 140 000 000 | **`'80'`** |

```
résultat RÉEL de l'exercice      : 140 000 000
avec les racines PUBLIÉES (@4.0) : 280 000 000     ⇐ facteur 2
avec 80 retiré des racines       : 140 000 000
```

⚠️ Et la sélection se fait **par préfixe** (`startsWith`), jamais par égalité : la racine `'80'`
capte aussi `801`, `8012`, `8099`.

### M2 — ⚡ Le texte tranche en une phrase, et elle est déjà dans le Code

**Article 432**, verbatim :

> « **Le solde du compte 80 est viré, pour clôture des écritures, au compte 87.** »

La chaîne est donc `classes 6/7 → compte 80 → compte 87 → compte 88 → bilan (89)`. Le compte `80`
reprend **par construction** ce que les classes 6 et 7 portent déjà — c'est **exactement** la
définition de compte de regroupement que le dépôt applique déjà pour exclure `87`, `88` et `89`.

⛔ **Et l'artefact le prouve tout seul** : aucune des 65 lignes de sa table de passage ne rattache le
compte `80` à un poste, tandis que les deux états `COMPTE_80_*` livrés par STORY-521 sont alimentés
**exclusivement** par des comptes des classes 6 et 7. Le paquet décrit `80` comme une
récapitulation, et le déclare en même temps comme une source primaire.

### M3 — ⛔⛔ Un test EXIGE aujourd'hui que `80` soit capté — et l'appelle « la gestion réelle »

`bilan-service/src/modules/bilan/referentiel/referentiels-additionnels-coherence.spec.ts:617-637` :

```ts
it('CIMA — les trois comptes de REGROUPEMENT (87/88/89) sont HORS gestion', () => {
  // …
  for (const gestion of ['80', '82', '83', '84', '85', '86']) {
    expect({ gestion, capte: racines.some((r) => gestion.startsWith(r)) })
      .toEqual({ gestion, capte: true });          // ⛔ exige que 80 soit capté
  }
});
```

C'est un **test qui verrouille le défaut** : appliquer la lecture juste de l'art. 432 le fait
rougir. ⚠️ Et son titre énumère **trois** comptes de regroupement là où le texte en fait **quatre**.

### M4 — ⚠️ La garde « permanente » de STORY-488 AC-5 ne lit PAS l'artefact

`balance-service/src/modules/fiscal/fiscal.regles.spec.ts:410-443` mesure bien « 140 M et non
280 M », mais sur une **constante locale** `GESTION_CIMA` (`:74`), pas sur les racines du paquet.
Idem `resultat-fiscal.service.spec.ts:1297-1358`, qui injecte les racines dans un mock.

⇒ **Aucune assertion métier ne garde les racines de `@4.0`**, la version que le pont sert réellement.
On pourrait y remettre `'8'` — la classe entière — sans faire rougir autre chose que les checksums.
C'est le trou que l'AC-3 doit fermer.

### M5 — ⚡ AC-4 : le défaut n'est PAS ailleurs, et c'est une réponse utile

Relevé sur les cinq paquets packagés :

| paquet | `racinesDeGestion` | compte de regroupement capté |
|---|---|---|
| `syscohada-revise@2.1` | `['6','7','8']` | **non** |
| `zone-franche-togo@1.0` | `['6','7','8']` | **non** |
| `smt-togo@1.0` | `['6','7','8']` | **non** |
| `sfd-bceao@2.0` | `['6','7']` | **non** |
| `cima-assurances@4.0` | `['6','7','80','82',…]` | ⛔ **oui — `80`** |

Les trois plans SYSCOHADA/SMT/zone franche portent la **même** classe 8, intégralement de la
gestion : `81` valeurs comptables des cessions, `82` produits des cessions, `83`→`86` HAO, `87`
participation des travailleurs, `88` subventions d'équilibre, `89` impôts sur le résultat. **Aucun
compte de regroupement**, donc `'8'` y est juste — et l'en retirer produirait un résultat *avant*
HAO et *avant* impôt (fausse réparation déjà documentée, **D-091-3**). `sfd-bceao` n'a pas de
classe 8.

⇒ **Le défaut est propre au plan CIMA**, seul plan sectoriel du dépôt et seul à mêler gestion et
regroupement dans une même classe. L'AC-4 est tenue par une mesure **négative** : elle dit où **ne
pas** aller corriger.

### M6 — ⛔ Aucun filet ne peut voir le doublement sur un dossier CIMA

`resoudreCompteResultatNet` (`fiscal.regles.ts:470-484`) rend **`null`** pour CIMA : le paquet ne
publie pas `regles.COMPTE_RESULTAT_NET`, et aucun compte de classe 1 n'a un libellé commençant par
« résultat net » (`13` = « Réserves réglementaires »). ⇒ `articulerResultat` rend
`{ applicable: false, motif: 'COMPTE_RESULTAT_NON_SOURCE' }` : **le contrôle d'écart ne s'exécute
jamais** sur un dossier CIMA. Le doublement est donc structurellement **silencieux**, ce qui est
précisément l'avertissement que la story porte.

### M7 — ⚠️ Un second défaut sur le même chemin, HORS périmètre et nommé

`85 Impôts sur les bénéfices` **est** dans `racinesDeGestion`, mais
`resoudreCompteImpotResultat` (`fiscal.regles.ts:518-530`) rend `null` pour CIMA ⇒
`chargeImpotComptabilisee = 0`. La charge d'impôt déjà comptabilisée **entre donc dans le résultat
comptable et n'est jamais reprise** avant l'assiette.

⛔ C'est un défaut **réel et distinct**, sur le même chemin que celui de cette story. Il n'est **pas**
corrigé ici — le périmètre de STORY-522 est la lecture de la classe 8, pas la reprise de l'impôt —
et il est consigné pour sa propre story.

---

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-522-1** | `cima-assurances@5.0` retire **`80`** de `racinesDeGestion`. `@1.0` à `@4.0` restent packagées et **intactes** | **Mesuré (M1/M2)**. Un chiffre déjà servi ne se réécrit pas — même faux : il se corrige par une version, comme `@2.0`, `@3.0` et `@4.0` avant elle |
| **D-522-2** | Le plan packagé gagne un marqueur **`nature: 'REGROUPEMENT'`** sur `80`, `87`, `88`, `89`, sourcé de l'art. 432 | **AC-2.** Le marqueur est **déclaré**, jamais déduit d'un numéro. Patron additif de `role?` / `tresorerie?` / `chiffreAffaires?` : spread conditionnel, vocabulaire fermé, vérifié au build ⇒ les quatre autres paquets gardent leurs octets |
| **D-522-3** | ⛔ **`build.mjs` REFUSE de packager** un paquet dont une racine de gestion capte un compte marqué `REGROUPEMENT`, **en le nommant** | **AC-1 + AC-5.** C'est la seule forme qui tienne : corriger `80` une fois laisse le défaut revenir. Une porte au build le rend **impossible à empaqueter**, et vaut pour tout référentiel futur |
| **D-522-4** | La garde permanente **lit l'artefact**, plus une constante locale | **Mesuré (M4)** : la garde de 488/AC-5 mesurait une constante du fichier de test. Une garde qui ne lit pas ce qu'elle prétend garder ne garde rien |
| **D-522-5** | Le test de `referentiels-additionnels-coherence.spec.ts:617` est **retourné**, avec sa justification | **Mesuré (M3)** : il verrouille le défaut et appelle `80` « la gestion réelle ». Son titre passe de trois à **quatre** comptes de regroupement |
| **D-522-6** | ⛔ **La reprise de l'impôt (M7) et l'absence de contrôle d'articulation (M6) ne sont PAS corrigées ici** — elles sont nommées et consignées | Périmètre. Les deux méritent leur story ; les traiter au passage mélangerait trois corrections dans une mesure |


## Critères d'acceptation

- [ ] AC-1 — Toute lecture de la classe 8 passe par une **liste explicite de comptes**, jamais par
      une racine. `racinesDeGestion` cesse de porter des racines de classe 8 en bloc.
- [ ] AC-2 — Les comptes de **regroupement** sont **identifiés et marqués** dans le plan packagé,
      depuis l'article 431 — pas déduits de leur numéro.
- [ ] AC-3 — ⛔ **Test de régression permanent, et c'est LE test :** un jeu de balance CIMA où la
      classe 8 est renseignée doit produire une base imposable **simple**. Remettre la racine `80`
      dans `racinesDeGestion` doit faire **doubler le résultat et virer le test au rouge** — sinon
      la garde ne garde rien.
- [ ] AC-4 — La même vérification est faite pour **les trois autres référentiels** : le repli
      générique est **partagé**, et le défaut est un défaut de repli, pas de CIMA. Le trouver
      ailleurs serait le résultat le plus utile de la story.
- [ ] AC-5 — Le repli, quand il ne sait pas décider, **refuse plutôt que de deviner** et nomme le
      compte en cause. Une base imposable calculée sur une source douteuse est pire qu'une erreur
      déclarée.

## Notes

- Consolide [[STORY-488]] AC-5, qui posait la garde ; celle-ci la rend explicite et la généralise.
- Voir spine AD-9, `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §3.
