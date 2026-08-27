# STORY-480 : L'apurement de l'encours d'ouverture en parts égales fabrique un pic d'encaissement

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en rejouant `echeancierDelai()` mois par mois sur le dossier de démonstration et en regardant la série sortir.

---

## Le fait

`echeancierDelai()` apure l'encours d'ouverture (`bfrBase.creancesClients`) en **parts égales** sur
`⌊délai/30⌋ + 1` mois, puis y ajoute la production décalée.

Sur le scénario prudent (délai clients 60 jours), les **2 729 167 F** de créances d'ouverture sont donc
réglés en trois parts de ~909 722, et la production de janvier tombe au mois 3 — par-dessus la
troisième part :

| Mois | Encaissements clients |
|---|---|
| 01 | 909 723 |
| 02 | 909 722 |
| 03 | **2 342 535** |
| 04 à 12 | 1 432 813 (régime de croisière) |

Un **pic de 2,6 fois** le mois précédent, qui ne correspond à **aucun échéancier client**. Il ne vient
pas d'une prévision : il vient de la convention « on ne sait rien de l'antériorité des créances, donc
on les étale uniformément ».

C'est cette convention qui explique le balayage de **STORY-479** : les quatre premiers mois du plan
sont dominés par l'apurement, ce qui y confine tout creux de trésorerie.

Le produit **a** l'information : une balance âgée des comptes clients est dérivable de la balance
source, et l'antériorité réelle est ce qu'un cabinet regarde en premier.

## Critères d'acceptation

- [ ] AC-1 — L'apurement de l'encours d'ouverture accepte un **profil d'antériorité** optionnel
      (`ancienneteCreances: { moins30, de30a60, de60a90, plus90 }` en pourcentages). Absent ⇒
      répartition uniforme, **comme aujourd'hui**.
- [ ] AC-2 — La réponse publie l'origine de chaque mois d'encaissement :
      `{ apurementOuverture, productionPeriode }` — sans quoi le pic reste inexplicable pour qui lit
      le plan.
- [ ] AC-3 — Le bouclage sur l'encours de clôture normatif est **conservé** : l'identité
      `Σ règlements = ouverture + production − clôture` ne doit pas être perdue (c'est elle qui rend
      `ecartArticulation === 0` pour tout jeu d'hypothèses).
- [ ] AC-4 — Même traitement, et même AC, pour les **dettes fournisseurs**.

## Conséquences ailleurs

- Une balance âgée relève de `balance-service` : si elle n'est pas dérivable aujourd'hui, l'AC-1 se
  limite au profil **saisi**, et la dérivation automatique se trace à part.
