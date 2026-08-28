# STORY-545 : Impôts différés de consolidation — chaque retraitement déplace du résultat sans déplacer l'impôt

Status: ready-for-dev

**Épic :** EPIC-139 — Impôts différés et mise en équivalence
**Service :** `bilan-service` — module `consolidation`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-541** (homogénéisation) · **STORY-542** (éliminations) · **STORY-543** (écarts)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

Un retraitement de consolidation **modifie le résultat consolidé sans modifier la base fiscale** de
l'entité qui l'a subi. L'impôt payé, lui, reste celui des comptes individuels. **L'écart est une
différence temporelle**, et elle produit un impôt différé.

⇒ **Sans impôts différés, le résultat consolidé porte un taux d'impôt qui ne correspond à rien** —
et c'est un des premiers contrôles qu'un commissaire aux comptes fait sur des comptes consolidés :
*le taux effectif d'impôt est-il explicable ?*

**Ce qui génère un impôt différé, et ce qui n'en génère pas :**

| Origine | Impôt différé ? |
|---|---|
| Retraitement d'homogénéisation (durée d'amortissement, valorisation de stock) | ✅ oui |
| Élimination d'un **résultat interne** (marge sur stock, plus-value de cession) | ✅ oui |
| Élimination d'une **opération réciproque** (créance ↔ dette) | ⛔ **non** — le résultat n'a pas bougé |
| Écart d'évaluation affecté à un actif amortissable | ✅ oui |
| **Écart d'acquisition** | ⛔ **non** — pas de base fiscale en face |

⚠️ **Les deux « non » sont l'essentiel de la story** : c'est en calculant un impôt différé sur une
élimination réciproque ou sur un goodwill qu'on fabrique un impôt qui n'existe pas.

## Critères d'acceptation

- [ ] AC-1 — Chaque écriture de consolidation **déclare si elle génère une différence temporelle**,
      et laquelle. ⛔ Un retraitement muet sur ce point est **refusé** : c'est la seule garde qui
      empêche l'oubli silencieux.
- [ ] AC-2 — Le **taux d'impôt** appliqué est celui de **l'entité concernée**, pays par pays — jamais
      un taux groupe. ⚠️ Sur un groupe multi-pays, c'est structurant, et cela relie cette story au
      registre des pays ([[STORY-492]]) et aux paquets fiscaux ([[STORY-493]]).
- [ ] AC-3 — Actifs et passifs d'impôt différé sont publiés **séparément** et **ne se compensent pas**
      entre entités ni entre juridictions fiscales différentes.
- [ ] AC-4 — Un **actif** d'impôt différé n'est reconnu que si sa récupération est **probable** —
      c'est un **jugement**. ⇒ **Proposé, jamais appliqué d'office**, avec sa justification. Même
      doctrine que la provision pour perte de change et la dépréciation des stocks.
- [ ] AC-5 — Une **preuve d'impôt** (rapprochement entre l'impôt théorique au taux de la mère et
      l'impôt effectivement constaté) est publiée, ligne à ligne. ⚡ C'est le contrôle qui rend la
      story vérifiable : sans lui, personne ne peut dire si les impôts différés sont justes.
- [ ] AC-6 — Un groupe **mono-entité ou sans retraitement** produit **zéro impôt différé**. Test
      obligatoire — même garde de non-régression que STORY-541 AC-6.

## Notes

- Voir [[STORY-541]], [[STORY-542]], [[STORY-543]], [[STORY-492]], [[STORY-493]].
