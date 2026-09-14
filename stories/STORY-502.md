# STORY-502 : L'échéancier — la pièce contre laquelle le retard se calcule

Status: in-progress

**Complexité :** high

**Épic :** EPIC-123 — Portefeuille de crédits
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

**Le retard ne se calcule pas contre une date de fin, il se calcule contre un échéancier.** Un
crédit à 12 échéances mensuelles dont la 3ᵉ n'est pas payée est en retard **dès le 4ᵉ mois**, même
si sa date de fin est dans neuf mois. Sans échéancier, le classement (STORY-503) n'a rien à
interroger, et le provisionnement (STORY-504) n'a pas d'assiette.

C'est pour cela que l'échéancier est une story à part, avant le classement : **c'est la pièce
maîtresse du portefeuille**, pas un détail de présentation.

## Cadrage (2026-09-14)

Base : le module `credits` de STORY-501 (crédit à conditions immuables, événements append-only, situation dérivée).

### Décisions du 2026-09-14 (user, recueillies pendant le dev de STORY-501)

- **D-502-A — le mode d'amortissement est porté par le CRÉDIT**, obligatoire, sans défaut :
  `ANNUITES_CONSTANTES`, `AMORTISSEMENT_CONSTANT` ou `IN_FINE`.
- **D-502-B — l'intérêt d'une échéance se calcule au TAUX PÉRIODIQUE** (taux annuel ÷ nombre de périodes par
  an) sur le capital restant dû contractuel. La base 360/365 du crédit ne sert pas à l'échéancier.
- **D-502-C — le différé est PARTIEL** : les échéances du différé ne portent que les intérêts, le capital
  s'amortit sur les périodes restantes.
- **D-502-D — l'ordre d'imputation est une condition obligatoire et figée du PRODUIT**
  (`INTERETS_PUIS_CAPITAL` ou `CAPITAL_PUIS_INTERETS`), **copiée dans le crédit à l'octroi**. Pénalités :
  emplacement inerte. Un remboursement anticipé s'impute sur les échéances suivantes **sans recalcul** — le
  recalcul est un rééchelonnement.
- ⚡ **Conséquence sur D-501-C** : la ventilation saisie d'un remboursement est **remplacée** par l'imputation
  déclarée ; aucun contrat n'était publié.

### Hors périmètre, déclaré

Marqueur permanent et compteur de rééchelonnements, contagion (STORY-505) · classement (STORY-503) ·
pénalités de retard · publication en balance (STORY-507).

## Critères d'acceptation

- [ ] AC-1 — L'échéancier est **généré à l'octroi** depuis (montant, taux, durée, périodicité,
      différé), et **figé** : c'est le contrat. Il porte, par échéance, le capital, l'intérêt et le
      total dus, et leur date.
- [ ] AC-2 — Un remboursement s'**impute** sur les échéances selon un ordre **déclaré et non
      supposé** (intérêts, puis capital, puis pénalités — ou l'ordre que le produit de crédit
      déclare). ⚠️ L'ordre change le capital restant dû, donc le provisionnement : le laisser
      implicite rend deux IMF incomparables.
- [ ] AC-3 — Un **rééchelonnement** produit un **nouvel échéancier** et conserve l'ancien. Écraser
      l'échéancier d'origine effacerait la preuve du retard qui l'a motivé.
- [ ] AC-4 — L'**échéance la plus ancienne impayée** et le **nombre de jours de retard** sont
      dérivés à une date d'arrêté, et publiés. C'est l'unique entrée de STORY-503.
- [ ] AC-5 — Un remboursement **anticipé** et un remboursement **partiel** sont tous deux
      exprimables, et se distinguent dans la dérivation.

## Progress Tracking

**Statut : `in-progress` (2026-09-14).** Branches `MNV-502` ouvertes sur `docs` (base `main`) et
`microfinance-service` (base `dev`, qui contient STORY-501). Décisions D-502-A → D-502-D consignées ci-dessus.
PR `microfinance-service` **#6**.

### Développement — livré (sous-agent `opus`, rapport à vérifier en revue)

- Échéancier **généré et persisté à l'octroi** dans `echeanciers_credit` (append-only, index
  `unicite_version_echeancier_par_credit`), écrit dans la même transaction que le crédit ; fonctions pures de
  génération et d'imputation. Remboursement à montant unique imputé ; rééchelonnement versionné ; route
  `GET …/credits/:creditId/echeancier?dateArrete=` et `POST …/reechelonnements`.

### Décisions prises pendant le dev (2026-09-14)

- **D-502-E** — l'excédent d'un remboursement paie les échéances suivantes **en entier, intérêts compris**, dans
  l'ordre du produit ; refus au-delà de tout le restant dû. ⚠️ Écart au brief (qui proposait « capital restant +
  intérêts échus ») : sinon un emprunteur soldant son capital par avance paraîtrait en retard sur des intérêts
  futurs — soumis à la revue.
- **D-502-F** — taux périodique = points de base × mois de la période / 120 000 ; `A_ECHEANCE` = taux × durée
  en années.
- **D-502-G** — durée multiple du pas de périodicité, sinon `400 DUREE_INCOMPATIBLE_AVEC_PERIODICITE`.
- **D-502-H** — arrondi demi-unité vers le haut, une fois par intérêt et pour l'annuité ; capital constant en
  partie entière ; la dernière échéance absorbe l'écart ; capital d'annuité borné au restant dû.
- **D-502-I** — l'échéancier porte sur le montant **octroyé**, première échéance à l'octroi + 1 pas, même en
  décaissement partiel — soumis à la revue (effet sur 503/504).
- **D-502-J** — le jour est l'unité ; les flux d'un même jour se compensent.
- **D-502-K** — une annulation de remboursement retire les derniers montants imputés, à sa date.
- **D-502-L** — une échéance est échue dès son jour ; jours de retard = arrêté − échéance (0 le jour même).
- **D-502-M** — rééchelonnement au début, à une échéance ou après la dernière de la version en vigueur ; base
  capital restant dû > 0 sans intérêt payé d'avance ; intérêts échus impayés reportés sur la première échéance ;
  consolidation (aucun mouvement ni annulation antérieurs ensuite) ; non annulable.
- **D-502-N** — statut `REMPLACEE` ; le retard ne se lit que sur la version en vigueur.
- **D-502-O** — remboursement à montant unique, capital et intérêts dérivés (remplace D-501-C).

## Notes

- Voir [[STORY-501]], [[STORY-503]], [[STORY-505]] (rééchelonnements et contagion).
