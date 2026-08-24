# STORY-386 : La rupture de continuité ne franchit pas le contrat — un 422 en prose, et trois champs qui ne peuvent pas rougir

**Epic :** EPIC-021 — Import & migration Sage (reprise à-nouveaux)
**Réf. :** écart remonté par **FE-047** *(reprise d'à-nouveaux / continuité N-1)*, 2026-08-23 — prolonge **STORY-087**, même défaut que **STORY-375**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** review
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

---

## Progress Tracking

**Statut : `review`** — implémentée le 2026-08-24 sur `MNV-386` (`balance-service`), portes vertes,
vérification docker réelle faite.

### Décision d'architecture — volet B : **voie 1 retenue**

L'aperçu d'à-nouveaux **rend** le socle déséquilibré au lieu de le refuser ; la **persistance**
continue de refuser. Deux raisons, dans cet ordre :

1. `dryRun` existe pour montrer ce qui cloche **avant** d'écrire. Le `422` donne l'écart, il ne donne
   **pas les lignes** : refuser l'aperçu prive le cabinet de la seule vue où l'écart se localise.
2. C'est ce qui rend leur sens aux trois champs. La voie 2 (documenter l'invariant) aurait figé dans
   le contrat un indicateur incapable de rougir — la « garde vraie par vacuité » de FE-063.

⚠️ **Le déséquilibre est réellement atteignable**, ce n'est pas une branche de laboratoire : un compte
dont le numéro ne commence pas par un chiffre échappe **aux deux** filtres de la reprise
(`estCompteReporte` ne le reporte pas, `comptesGestionOuverts` ne le voit pas — `classeDuCompte` rend
`null`). Avant STORY-146, `BalanceValidator` jugeait les comptes sur `/^[0-9A-Za-z]{2,20}$/` : une
balance N-1 **validée** à cette époque peut en porter un. C'est le cas rejoué en docker ci-dessous.

⚠️ **Portée du `try/catch`** : seul `BalanceDesequilibreeException` est intercepté. Checksum faux,
compte hors plan, exercice clos restent des **refus** d'aperçu — on ne rend un socle que lorsqu'il est
intégralement valide **sauf** son équilibre.

### Ce qui a été livré

| | |
|---|---|
| `balance-desequilibree.exception.ts` | `code: BALANCE_DESEQUILIBREE` + `details: { grandeur, ecart, totalDebit, totalCredit }`, par **`details`** (liste blanche du filtre) et `error` posé explicitement. **Message inchangé au caractère près** (STORY-387 pour ce qu'il devrait dire). |
| `GRANDEURS_EQUILIBRE` | `['mouvements','soldes']` — `validerEquilibre` **itère dessus** et `sommaire` porte exactement ces clés : l'ordre testé, l'ordre publié et `details.grandeur` ne peuvent plus diverger. |
| `BalanceDesequilibreeResponseDto` | `code` en `enum`, `grandeur` en `enum` **nommé** (`GrandeurEquilibre`, donc union de littéraux côté client). Référencé par les **7** routes d'écriture qui traversent `BalanceValidator` — 2 ne le documentaient qu'en prose, 5 pas du tout. |
| `ANouveauxResponseDto` | la voie retenue est **écrite dans le DTO**, champ par champ. |
| `RepriseService` | l'aperçu rend le déséquilibre ; l'avertissement de rupture est **dérivé de `sommaire.estEquilibre`**, jamais d'un drapeau d'appelant — il ne peut donc pas contredire le chiffre rendu. |

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **2 958 / 2 958**, couverture
**98,98 st / 91,81 br / 98,16 fn / 99,06 li** (seuils 65/90/90/90 ; `balance.validator.ts` et
`exceptions/` à 100 %) · `test:e2e` **678 / 678**.

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| `details` retiré de l'exception | validator ×3 + e2e reprise ×1 | 🔴 4 rouges |
| `GRANDEURS_EQUILIBRE` inversé (`soldes` d'abord) | AC-2 + contrat OpenAPI | 🔴 2 rouges |
| `error: 'Unprocessable Entity'` retiré | « ne change ni le message ni la casse » | 🔴 1 rouge |
| le `catch` relaie au lieu de rendre le socle | volet B ×2 | 🔴 2 rouges |
| avertissement de rupture non poussé | « avertit que le socle est DÉSÉQUILIBRÉ » | 🔴 1 rouge |
| `type:` du 422 remplacé par un autre DTO | « le référence depuis TOUTE route » | 🔴 1 rouge |

🪤 **Une septième mutation a d'abord rougi POUR LA MAUVAISE RAISON** : neutraliser l'`instanceof` rendait
l'import inutilisé ⇒ `TS6133`, donc « rouge » sans qu'aucune assertion n'ait jugé quoi que ce soit.
Rejouée en gardant l'`instanceof` et en relayant depuis le corps du `catch` — rouge, cette fois sur les
deux tests du volet B, `tsc --noEmit` muet. *(Même piège qu'en STORY-179 et STORY-385.)*

### Vérification docker réelle — stack neuve (`down -v`), 2026-08-24

`mongo` + `kafka` + `redis` + `auth-service` + `balance-service` reconstruits ; `/api/v1/health` →
`{"mongodb":"up","kafka":"up"}` ; logs `Found 0 errors. Watching for file changes.`
Amorçage : compte `verif386@…` (org `6a8cc540…2059`), `emailVerifiedAt` posé en base, read-models
`orgkycstatuses` `APPROVED`, `orgbalanceentitlements` `ACTIVE` + `referentiel: syscohada-revise@2.1`,
`dossiers_dossier` `ACTIF`.

| # | Appel | HTTP | Ce qui est prouvé |
|---|---|---|---|
| 1 | `POST /dossiers/{d}/balances` — soldes rompus (5 000 / 3 000), mouvements équilibrés | **422** | corps = `code: BALANCE_DESEQUILIBREE` **et** `details: { grandeur: "soldes", ecart: 2000, totalDebit: 5000, totalCredit: 3000 }` ⇒ **`details` franchit la liste blanche d'`AllExceptionsFilter`** — le seul niveau où le piège d'`AffectationIncompleteException` est visible |
| 2 | idem, mouvements rompus (9 000 / 5 000), soldes équilibrés | **422** | `details.grandeur: "mouvements"`, `ecart: 4000` ⇒ la grandeur **discrimine** |
| 3 | après 1 et 2 | — | `balances=0`, `outbox_events=0`, `balance_ingestions=0` ⇒ **aucun document orphelin** |
| 4 | `POST /balance/a-nouveaux` (aperçu) sur la clôture N-1 portant `AB12` | **201** | `estEquilibre: false`, `equilibreSoldes: { totalDebit: 320 000 000, totalCredit: 640 000 000, ecart: -320 000 000 }`, `equilibreMouvements` satisfait, lignes rendues `['211','101','13']`, **3ᵉ avertissement** = rupture de continuité ⇒ **voie 1 opérante** |
| 5 | idem avec `dryRun: false` | **422** | même corps structuré (`ecart: -320 000 000`) ⇒ la **persistance refuse toujours** |
| 6 | après 5 | — | `socles A_NOUVEAUX=0`, `outbox_events=0`, `exercices_atelier=0` ⇒ **rien d'écrit sur le refus** |
| 7 | non-régression : clôture N-1 **équilibrée**, aperçu puis `dryRun: false` | **201** / **201** | aperçu `estEquilibre: true`, **2** avertissements (pas de rupture) ; socle persisté `origine: A_NOUVEAUX`, `balanceSourceId` chaîné à sa source, `outbox_events=1` |

### Observation hors périmètre (non corrigée, délibérément)

`comptesSoldes` compte **tout compte non reporté**, pas seulement les classes 6/7 que sa description
annonce : sur le cas #4 il vaut `1` en désignant `AB12`, qui n'est pas un compte de gestion. Écart
**préexistant** à cette story et atteignable seulement sur ce même cas historique ; le corriger ici
déborderait le périmètre (aucun AC ne le porte). Noté pour qu'il ne se redécouvre pas deux fois.
