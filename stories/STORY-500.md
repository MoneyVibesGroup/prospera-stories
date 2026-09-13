# STORY-500 : Dépôts de la clientèle — à vue, à terme, et les intérêts que l'institution DOIT

Status: in_progress

**Complexité :** high

**Épic :** EPIC-122 — Membres et comptes de dépôts
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Les dépôts sont **au passif** d'une IMF : ce sont des dettes envers les membres. C'est le point où
un module conçu pour une entreprise commerciale se trompe le plus vite — l'argent qui entre à la
caisse d'une IMF n'est pas un produit, c'est une **dette**.

Et les dépôts à terme portent **des intérêts que l'institution doit** : ils se rattachent à
l'exercice qui les a courus, pas à celui qui les paie.

## Cadrage mesuré avant de coder (2026-09-13)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Les dépôts sont au **passif** | **VRAI** | `sfd-bceao@2.0` : `2511` Comptes ordinaires, `2512` Comptes ordinaires sur livret, `252`/`2521` Dépôts à terme reçus |
| Les intérêts courus sont une **charge à payer** | **VRAI** | `2526` et `25116` Dettes rattachées ; charges `60252` Intérêts sur dépôts à terme reçus, `60251` sur comptes ordinaires créditeurs |
| Un précédent de calcul d'intérêts existe | **FAUX** | aucun calcul d'intérêt de dépôt dans le produit ; la base 360 de `bilan-service` sert aux délais de BFR, pas à un contrat |
| Le nantissement vise un **crédit** | **PRÉMATURÉ** | le crédit n'existe pas avant STORY-501 |

### Décisions du 2026-09-13

- **D-500-A — la base de calcul est portée par CHAQUE dépôt à terme (décision user)** : `EXACT_360` ou
  `EXACT_365`, obligatoire à l'ouverture. Aucune constante, aucun défaut — même doctrine que la devise
  (D-499-B) : une convention contractuelle n'est jamais supposée.
- **D-500-B — un compte à vue n'est pas rémunéré dans 500 (décision user).** Emplacement inerte documenté
  pour la rémunération de l'épargne (livret `2512`, charge `60251`).
- **D-500-C — intérêts SIMPLES sur le capital, payés à chaque période (décision user).** Les échéances
  découpent l'ouverture → l'échéance selon la périodicité ; un mouvement de paiement règle des intérêts
  échus. À une date d'arrêté sont publiés les **intérêts courus non échus** (AC-3) **et** les **intérêts
  échus non payés** — deux dettes rattachées. Aucun intérêt ne court après l'échéance ; pas de capitalisation.
- **D-500-D — le blocage est livré dès 500 (décision user)** : blocage et levée, append-only, datés, motivés,
  attribués ; `disponible = solde − bloqué`. La référence au crédit nanti est un **emplacement inerte**
  pour STORY-501.
- **D-500-E — aucun compte comptable n'est choisi ici** (patron D-499-D) : le choix appartient à
  l'adaptateur de balance (STORY-507).

### Hors périmètre, déclaré

Rupture anticipée d'un dépôt à terme, renouvellement, capitalisation, rémunération des comptes à vue,
clôture d'un compte, publication d'événement, production de balance.

## Critères d'acceptation

- [ ] AC-1 — Comptes de dépôt à vue et à terme, par membre. Les mouvements sont **append-only**
      (AD-1) : le solde d'un compte est la somme de ses opérations, à une **date d'arrêté**.
- [ ] AC-2 — Un dépôt à terme porte son **taux**, sa **date d'échéance** et sa **périodicité**
      d'intérêts.
- [ ] AC-3 — ⚡ **Les intérêts courus non échus sont calculés à la date d'arrêté** et constatés en
      charge à payer. Les ignorer sous-évalue les charges de l'exercice — et le déficit qui en
      résulterait n'apparaîtrait qu'au paiement, dans l'exercice suivant.
- [ ] AC-4 — Un blocage de compte (nantissement d'un dépôt en garantie d'un crédit) est **tracé et
      visible** : c'est une information de portefeuille autant que de dépôt.
- [ ] AC-5 — Le solde d'un compte à une **date passée** se recalcule à l'identique. Test de rejeu.

## Progress Tracking

**Statut : `in_progress` (2026-09-13).** Branches `MNV-500` ouvertes sur `docs` (base `main`) et
`microfinance-service` (base `dev`). Décisions D-500-A → D-500-E consignées ci-dessus.

## Notes

- Voir [[STORY-499]], [[STORY-507]] (publication en balance), spine AD-1.
