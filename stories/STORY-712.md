# STORY-712 : Un seul compteur de consommation

Status: ready-for-dev

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F4
**Prérequis :** **STORY-596** (consommation par période), **STORY-597** (compteurs pré-agrégés), **STORY-639** (arrêté)
**Origine :** rail F.

---

## Le récit

En tant qu'**organisation cliente**, je veux que le chiffre de mon écran de consommation soit celui de
l'arrêté de fin de mois, afin de ne jamais avoir à demander lequel des deux est vrai.

## Le fait

⛔ **Deux lectures comptent les mêmes faits, par deux chemins.** L'écran de l'organisation
(`ConsommationService.parPeriode`, STORY-596) **agrège les `Envoi` à la lecture** ; l'arrêté
(STORY-639) et la vue plateforme (STORY-597) lisent les **compteurs pré-agrégés**
`compteurs_consommation`, tenus dans la transaction du fait. Deux règles de calcul pour un seul nombre :
une correction de coût, un fait tardif imputé à la période suivante (STORY-639, AC-2), ou une purge
d'`Envoi` (STORY-586) suffisent à les faire diverger — et le mois arrêté affiche alors deux totaux.

## Critères d'acceptation

- [ ] AC-1 — ⚡ Le compteur pré-agrégé est **la** source du total d'une période, pour l'organisation
      comme pour la plateforme ; l'écran de l'organisation lit les compteurs, plus les `Envoi`.
- [ ] AC-2 — Une période **close** se restitue depuis son **arrêté**, à l'identique.
- [ ] AC-3 — ⚠️ La ventilation par module appelant et par rôle (FR-N58) garde sa lecture des `Envoi` si
      le compteur ne porte pas ces axes — c'est une **ventilation**, pas un total, et l'écran le dit.
- [ ] AC-4 — Un test prouve l'égalité du total restitué à l'organisation et de l'arrêté, sur un jeu
      comprenant un fait tardif et une correction de coût.
- [ ] AC-5 — ⛔ La devise reste dans la clé : aucune somme entre devises.
