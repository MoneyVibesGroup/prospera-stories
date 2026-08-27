# STORY-468 : La durée de l'exercice de base n'est publiée nulle part — une croissance annuelle appliquée à un exercice de 18 mois

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service · dossier-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé par la passe expert-comptable sur l'écran FE-035 fini, en cherchant ce qu'on lit avant de saisir un taux de croissance.

---

## Le fait

La DSF déposée porte une colonne **« Durée (en mois) »**, et ce n'est pas une décoration : un **premier
exercice** ou un **changement de date de clôture** donne couramment un exercice de **18** ou de **6**
mois. C'est un cas fréquent, pas une curiosité.

Le prévisionnel applique `produits × (1 + croissance)` à `produitsBase` **sans savoir sur combien de
mois** ce montant a été réalisé. Projeter « +8 % » sur un exercice de 18 mois surestime N+1 de moitié ;
sur 6 mois, le sous-estime du double.

Ni `AncresProjection` ni `HypothesesBase` ne portent la durée. `HypothesesBase.exercice` est un
**libellé** (`"2025"`) — au point que `millesime()` refuse de dater les exercices projetés dès que ce
libellé n'est pas une année sur quatre chiffres, et rend `null`. Le produit sait donc déjà que ce champ
n'est pas fiable ; il n'en tire aucune conséquence côté prévisionnel.

L'écran ne peut même pas **prévenir**.

## Critères d'acceptation

- [ ] AC-1 — `HypothesesBase` (et `AncresProjection`) portent `dureeMois` de l'exercice de base, lue du
      dossier (`dateDebut` / `dateCloture`), pas du libellé.
- [ ] AC-2 — Quand `dureeMois !== 12`, la réponse porte `baseAnnualisable: false` et **l'annualisation
      n'est pas faite en silence** : soit le moteur annualise et le **déclare**, soit il refuse — le PO
      tranche, mais le silence n'est pas une option.
- [ ] AC-3 — Le cas `dureeMois` inconnue (dossier sans dates) rend `null` signalé.
- [ ] AC-4 — L'écran des hypothèses affiche la durée à côté de l'assiette de croissance.

## Conséquences ailleurs

- Même famille que **STORY-453** (l'échéance de dépôt) : une donnée de calendrier que le métier lit en
  premier et que le produit ne publie pas.
