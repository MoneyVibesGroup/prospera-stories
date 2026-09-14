# STORY-501 : Un crédit est la somme de ses événements — jamais un encours qu'on corrige

Status: in-progress

**Complexité :** high

**Épic :** EPIC-123 — Portefeuille de crédits
**Service :** `microfinance-service`
**Points :** 13 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-1** de la spine.

---

## Le fait

Un encours restant dû n'est **pas un compteur**. C'est le résultat d'une suite d'événements :
octroi, décaissement (parfois en plusieurs tranches), remboursements, rééchelonnement,
passage en perte. Un module qui stocke l'encours et le met à jour ne sait pas répondre à
*« pourquoi 1 240 000 et pas 1 500 000 ? »* — et c'est la question que pose le premier contrôle.

⚡ **C'est le même invariant que `stock-service`** (AD-1/AD-2 de sa spine) : la propriété n'est pas
comptable, elle est structurelle, et tout le reste — le classement, le provisionnement, l'audit, le
portefeuille à une date passée — en découle.

## Cadrage mesuré avant de coder (2026-09-14)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Un **produit de crédit** existe | **FAUX** | aucun service, aucune collection, aucun read-model ne le définit |
| Une **agence** existe | **FAUX** | D-499-A : seule la spine de `reseau-service` la définit, service sans code |
| L'ordre d'imputation d'un remboursement est connu | **PRÉMATURÉ** | il est déclaré en STORY-502 (AC-2), avec l'échéancier |
| Le nantissement d'un dépôt est rapprochable | **VRAI** | STORY-500 livre le blocage daté, motivé, attribué ; le hook `CREDIT_NANTI_PAR_BLOCAGE` (D-500-D) désigne 501 |
| Un patron de points d'arrêt existe dans le code | **FAUX** | `stock-service` n'a que sa spine ; `depots` dérive par rejeu intégral |

### Décisions du 2026-09-14

- **D-501-A — l'agence d'un crédit est un emplacement inerte** (précédent user D-499-A) : un code libre
  deviendrait la clé d'agrégation de STORY-506. Débloqué par le read-model d'agences de `reseau-service`.
- **D-501-B — le produit de crédit est un référentiel local du dossier (décision user)** : collection
  `produits_credit` (code unique par dossier, charset fermé, libellé), créée par l'API ; le crédit porte un
  `produitId` **validé**. Les conditions du produit (ordre d'imputation) s'y ajoutent en STORY-502.
- **D-501-C — un remboursement porte sa ventilation SAISIE (décision user)** : capital et intérêts, entiers
  dans l'exposant de la devise. 501 dérive l'encours, le capital remboursé et les intérêts perçus ; en
  STORY-502, l'imputation déclarée remplace la saisie (aucun contrat n'est encore publié).
- **D-501-D — les garanties sont déclarées à l'octroi, figées, et le nantissement de dépôt est lié (décision
  user)** : type fermé, valeur, référence ; un nantissement de dépôt référence un **blocage validé** (même
  dossier, même membre, actif à la date d'octroi, jamais déjà affecté à un autre crédit). Le hook D-500-D est
  débloqué.
- **D-501-E — dérivation pure, aucun point d'arrêt persisté (décision user)** : la situation d'un crédit se
  recalcule par rejeu intégral de ses événements. La performance du portefeuille entier relève de STORY-503
  (AC-5) ; la linéarité est consignée comme dette.
- **D-501-F — une convention contractuelle n'est jamais supposée** (doctrine D-500-A / D-499-B) : taux,
  base de calcul, durée, périodicité et différé sont obligatoires à l'octroi, sans défaut ni constante.

### Hors périmètre, déclaré

Échéancier et imputation déclarée (STORY-502) · rééchelonnement (STORY-502/505) · passage en perte et
recouvrement (STORY-505) · classement (STORY-503) · publication en balance et hors bilan (STORY-507/508) ·
publication d'événements · scoring ou décision d'octroi (AD-12).

## Critères d'acceptation

- [ ] AC-1 — Les événements de crédit sont **append-only** : le schéma le refuse, pas seulement la
      convention. Une correction est un **événement de correction**, pas une mise à jour.
- [ ] AC-2 — L'encours restant dû, le capital remboursé et les intérêts perçus sont **dérivés** à
      une date d'arrêté. Points d'arrêt et rejeu, comme la dérivation de `stock-service`.
- [ ] AC-3 — Un crédit porte : montant octroyé, taux, durée, périodicité, différé éventuel,
      garanties, **agence** et **produit de crédit**.
- [ ] AC-4 — Le **décaissement en plusieurs tranches** est supporté : un crédit octroyé et non
      décaissé n'est **pas** un encours — c'est un **engagement hors bilan** (AD-9, STORY-508).
- [ ] AC-5 — ⛔ **Le module ne décide aucun octroi** (AD-12) : ni scoring, ni analyse de risque. Il
      enregistre une décision prise ailleurs, avec son auteur et sa date.
- [ ] AC-6 — Le portefeuille à une date passée se rejoue à l'identique, en désordre et après
      redémarrage. C'est ce test qui fait de la story « terminé », pas la recette fonctionnelle.

## Progress Tracking

**Statut : `in-progress` (2026-09-14).** Branches `MNV-501` ouvertes sur `docs` (base `main`) et
`microfinance-service` (base `dev`). Décisions D-501-A → D-501-F consignées ci-dessus.

## Notes

- Voir [[STORY-502]] (l'échéancier), [[STORY-503]] (le classement dérivé), spine AD-1.
