# STORY-542 : Éliminations — les opérations réciproques ne touchent pas le résultat, les résultats internes si

Status: ready-for-dev

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-541** (les comptes sont homogènes avant d'être éliminés)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait, et la distinction qui commande toute la story

Il y a **deux familles d'éliminations**, elles n'ont rien à voir, et les confondre est l'erreur
classique :

| Famille | Exemples | Effet sur le résultat consolidé |
|---|---|---|
| **Opérations réciproques** | créance de A sur B ↔ dette de B envers A · vente de A à B ↔ achat de B à A | ⚪ **aucun** — on gonfle le bilan et le CR, pas le résultat |
| **Résultats internes** | marge de A sur un **stock encore détenu** par B · plus-value de cession interne d'une immobilisation | 🔴 **le résultat baisse** — le groupe ne peut pas faire de bénéfice avec lui-même |

⇒ **La première famille est un nettoyage de présentation. La seconde est un retraitement de
résultat.** Un module qui n'élimine que la première produit des états consolidés qui paraissent
propres et dont le **résultat est surévalué** — et rien ne le signale.

⚡ **Et le cas le plus fréquent est le plus subtil :** la marge interne ne s'élimine que sur la part
**encore en stock** à la clôture. Ce qui a été revendu hors groupe est un vrai bénéfice.

## Critères d'acceptation

- [ ] AC-1 — Les **opérations réciproques** sont appariées entre entités du périmètre, et éliminées
      **symétriquement** (créance ↔ dette, charge ↔ produit). Un appariement **déséquilibré** est
      **signalé, jamais forcé** : c'est presque toujours un décalage de date ou un litige réel.
- [ ] AC-2 — ⛔ **Les éliminations sont DÉCLARÉES puis PROPOSÉES** (Q2 de STORY-531). Le produit ne
      peut pas deviner que le compte client de A est le compte fournisseur de B ; il le **propose**
      quand les montants concordent, et **un proposé n'a aucun effet tant qu'il n'est pas confirmé**.
      Même doctrine que le rapprochement bancaire.
- [ ] AC-3 — Les **marges internes sur stocks** sont éliminées **sur la part encore détenue** à la
      clôture, en pourcentage de marge déclaré ou calculé — et la part revendue hors groupe est
      **conservée en résultat**.
- [ ] AC-4 — Les **plus-values de cession interne d'immobilisations** sont éliminées, et
      **l'amortissement excédentaire qu'elles ont généré est repris chaque exercice** jusqu'à la
      sortie du bien. ⚠️ C'est le retraitement qui **court sur plusieurs exercices** : l'oublier la
      2ᵉ année est plus fréquent que l'oublier la 1ʳᵉ.
- [ ] AC-5 — ⚠️ **Une élimination de résultat interne a un effet d'impôt différé** ⇒ elle alimente
      [[STORY-545]]. Une élimination réciproque n'en a **aucun**.
- [ ] AC-6 — Une élimination sur une entité en **intégration proportionnelle** se fait **à hauteur du
      pourcentage d'intégration**, pas à 100 %.
- [ ] AC-7 — Chaque élimination est **tracée, justifiée et réversible**, dans le journal de
      consolidation (STORY-541 AC-3).

## Notes

- Voir [[STORY-541]], [[STORY-544]] (la part des minoritaires dans les résultats internes),
  [[STORY-545]], [[STORY-531]].
