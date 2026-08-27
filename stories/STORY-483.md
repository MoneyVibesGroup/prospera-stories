# STORY-483 : Le bilan prévisionnel ne sépare pas capitaux propres et dettes — donc aucun ratio bancaire

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en cherchant, dans le bilan prévisionnel simplifié, les trois chiffres qu'un banquier demande.

---

## Le fait

`BilanSimplifiePrevisionnel` publie trois ressources :

- `ressourcesStablesInitiales` — le **total actif de la base**, figé sur l'horizon. Ce n'est **pas** un
  montant de fonds propres : c'est un solde d'ancrage, posé là pour que la cascade boucle. Le contrat
  le documente honnêtement.
- `resultatsCumules` — les résultats projetés.
- `financementNetCumule` — la somme de `financement − remboursements`, qui **agrège apports en capital
  et emprunts** en une seule ligne.

Il est donc **impossible** de dériver :

| Indicateur | Pourquoi il est indérivable |
|---|---|
| Ratio d'endettement | on ne sait pas quelle part des ressources est de la dette |
| Autonomie financière | on n'a pas de capitaux propres |
| Capacité de remboursement (dette / CAF) | on n'a ni l'encours de dette, ni une CAF fiable (**STORY-459**) |

Ce sont les trois chiffres qu'une banque calcule devant un prévisionnel. Sur le dossier de
démonstration, `financementNetCumule` vaut **−1 800 000** en N+3 : trois années de remboursements sans
un apport — et **rien ne dit de quelle dette il s'agit, ni combien il en reste à devoir**.

Le bilan simplifié de FR-019 est délibérément simplifié, et c'est défendable **pour piloter**. Ce qui
ne l'est pas, c'est qu'il soit le **seul** bilan que le prévisionnel produise, alors que le document
qui en sort est celui qu'on pose sur le bureau d'un banquier.

## Critères d'acceptation

- [ ] AC-1 — Le jeu d'hypothèses distingue `apportsCapital` et `empruntsNouveaux` là où il ne connaît
      aujourd'hui qu'un `financement` — dépend d'un ajout au DTO de **STORY-068**.
- [ ] AC-2 — Le bilan prévisionnel publie `capitauxPropres` (ancre + résultats cumulés + apports) et
      `dettesFinancieres` (encours de départ + emprunts nouveaux − remboursements cumulés).
- [ ] AC-3 — L'**encours de dette de la base** est une nouvelle **ancre**, extraite par `ancrage.ts`
      dans le respect de l'invariant P7 (un agrégat, pas un code de poste) — à défaut, la réponse
      publie `dettesFinancieresAncrees: false` et les ratios sont **relatifs**, jamais silencieux.
- [ ] AC-4 — `ratios: { endettement, autonomieFinanciere, capaciteRemboursement }` par exercice, chacun
      `null` **motivé** quand une composante manque.
- [ ] AC-5 — Le contrôle d'équilibre est maintenu : `ecart === 0` après la ventilation.

## Conséquences ailleurs

- Sans **STORY-459** (dotations aux amortissements), la capacité de remboursement reste fausse : la
  CAF vaut le résultat net. Les deux stories se tiennent.
