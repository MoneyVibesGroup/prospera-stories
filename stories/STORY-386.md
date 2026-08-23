# STORY-386 : La rupture de continuité ne franchit pas le contrat — un 422 en prose, et trois champs qui ne peuvent pas rougir

**Epic :** EPIC-021 — Import & migration Sage (reprise à-nouveaux)
**Réf. :** écart remonté par **FE-047** *(reprise d'à-nouveaux / continuité N-1)*, 2026-08-23 — prolonge **STORY-087**, même défaut que **STORY-375**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat — la seule chose que l'écran de reprise doit montrer est la seule qu'il ne peut pas lire

FE-047 existe pour **signaler une rupture de continuité, chiffrée, jamais masquée** (son AC-2). Elle
est aujourd'hui **inexploitable par un client**, pour deux raisons qui se renforcent.

### ① Le refus d'équilibre est un `422` nu : ni `code`, ni `details`

`BalanceValidator.validerEquilibre` lève un `UnprocessableEntityException` construit avec **une
chaîne** :

```ts
throw new UnprocessableEntityException(
  `Balance déséquilibrée (FR-A25) — équilibre ${grandeur} non satisfait : ` +
  `écart de ${controle.ecart} (unités mineures XOF) entre ${controle.totalDebit} ` +
  `au débit et ${controle.totalCredit} au crédit.`,
);
```

Les quatre grandeurs qui comptent — **la grandeur en cause, l'écart, les deux totaux** — sont donc
présentes… **dans une phrase française**. Un client qui veut rendre l'écart doit *parser du texte*,
c'est-à-dire traiter comme un contrat ce qui n'en est pas un : le jour où la formulation change, le
rendu casse sans qu'aucun type ne bouge.

⚠️ **C'est mot pour mot le défaut que STORY-375 vient de fermer sur les codes de refus** *(« un code
ajouté doit CASSER la compilation du client au lieu de tomber en silence »)*, resté ouvert sur le
refus le plus structurant du module. Et le module **sait déjà faire** : les dix exceptions de
`reprise.exceptions.ts` portent toutes un `code` stable, et deux d'entre elles publient un `details`
chiffré (`AffectationIncompleteException` → `{ resultat, total }`,
`ComptesRepriseNonSourcesException` → `{ referentiel, motif }`). Le patron existe ; seul ce refus-ci
l'ignore.

### ② `ANouveauxResponseDto` publie trois champs qui ne peuvent **jamais** valoir « déséquilibré »

Le DTO expose `estEquilibre`, `equilibreSoldes` et `equilibreMouvements` — chacun avec son `ecart`
signé et son verdict booléen. Un client les lit comme *le* contrôle de continuité. **Ils ne peuvent
pas l'être** : les deux chemins qui produisent cette réponse valident **avant** de la construire.

| chemin | appel | validation | conséquence |
|---|---|---|---|
| aperçu | `RepriseService.genererANouveaux` → `BalanceService.dryRun` | `validator.validate(...)` | un socle déséquilibré part en `422`, la réponse n'existe pas |
| écriture | `… → BalanceService.submit` | `validator.validate(...)` | idem |

⇒ sur **toute** réponse rendue, `estEquilibre === true` et les deux `ecart === 0`. Un indicateur
branché dessus est **vert pour toujours** — y compris le jour où la continuité casse. C'est la
« garde vraie par vacuité » de FE-063, cette fois inscrite dans le contrat lui-même.

**Conséquence livrée** : FE-047 a dû rendre la rupture **sur le refus** et non sur la réponse, et
afficher les chiffres du panneau en les présentant pour ce qu'ils sont — la *masse reprise*, pas un
verdict susceptible de rougir. C'est honnête, mais c'est un contournement : le champ prévu pour dire
la continuité ne la dit pas.

---

## Ce qu'il faut livrer

### A — Le refus d'équilibre devient exploitable

Une exception dédiée, sur le patron de `reprise.exceptions.ts` :

```ts
code:    'BALANCE_DESEQUILIBREE'
details: { grandeur: 'soldes' | 'mouvements', ecart, totalDebit, totalCredit }
```

- `code` **stable** et publié comme les autres (voir STORY-375 : enum OpenAPI, pas de la prose).
- `details` par **`details`**, jamais à la racine : `AllExceptionsFilter` construit le corps par
  liste blanche et jetterait silencieusement des champs posés au premier niveau — piège déjà payé une
  fois par `AffectationIncompleteException`, documenté dans son propre commentaire.
- Le message reste ce qu'il est aujourd'hui *(voir **STORY-387** pour ce qu'il devrait dire)*.
- `grandeur` est **discriminante** : le validateur teste les mouvements puis les soldes, et les deux
  ruptures n'ont pas la même cause. Les confondre côté écran annulerait ce travail.

### B — Trancher ce que les trois champs du DTO signifient

Deux voies possibles ; **la première est recommandée** :

1. **L'aperçu rend le déséquilibre au lieu de le refuser.** `dryRun` existe pour *montrer ce qui
   cloche avant d'écrire* — refuser l'aperçu prive le cabinet de la seule vue qui lui dirait où. La
   persistance, elle, continue de refuser. Les trois champs reprennent alors le sens que leur nom
   promet, et FE-047 branche son indicateur dessus sans rien parser.
2. À défaut, **documenter l'invariant** dans le DTO : « toujours équilibré sur une réponse rendue ;
   exposé pour la masse reprise, pas comme verdict » — pour qu'aucun client ne recommence.

⚠️ La voie 1 est un **changement de comportement de l'aperçu**, pas une correction de bug : elle se
tranche côté architecture avant d'être codée.

---

## Critères d'acceptation

1. Un socle déséquilibré refusé par la persistance porte `code: 'BALANCE_DESEQUILIBREE'` et un
   `details` chiffré `{ grandeur, ecart, totalDebit, totalCredit }` — vérifié **sur le corps HTTP**,
   pas seulement sur l'exception *(les tests unitaires de `AffectationIncompleteException` n'avaient
   rien vu, précisément parce qu'ils assertaient sur l'exception)*.
2. `grandeur` distingue `mouvements` de `soldes`, dans l'ordre où le validateur les teste.
3. Le code figure dans l'**enum OpenAPI** des refus (STORY-375), pas dans une `description`.
4. La voie retenue en **B** est tranchée, écrite dans le DTO, et couverte par un test : soit l'aperçu
   rend un socle déséquilibré avec `estEquilibre: false`, soit l'invariant « toujours vrai » est
   documenté et testé comme tel.
5. Aucun autre refus du module ne change de forme.

---

## Notes

- Relevé sur l'OpenAPI **vivant** de `:3007` le 2026-08-23, stack docker à `origin/dev`
  (`balance-service` 0/0 vs `origin/dev`).
- Le front n'attend pas cette story pour livrer : FE-047 rend le message du serveur **tel quel**, avec
  son statut et son code. Le contournement se retire quand cette story est livrée, **pas avant**.
