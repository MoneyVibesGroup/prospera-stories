# STORY-539 : Le calendrier de dépôt — multi-pays, multi-état, et l'échéance se calcule depuis la clôture réelle

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-536** (le paquet porte le calendrier) · **STORY-532** (les bornes de l'exercice)
**Origine :** arbitrage PO du 2026-08-28 — voie A.

---

## Le fait

Une échéance de dépôt se calcule **depuis la date de clôture réelle**, par une règle du type
`clôture + N mois`. Deux choses manquent aujourd'hui pour la produire :

1. ⛔ **La liasse ne connaît pas sa date de clôture** — elle porte un **libellé libre de 1 à 64
   caractères** ([[STORY-532]]). Une échéance calculée depuis « 2025 » suppose un 31 décembre, ce qui
   est faux pour tout exercice décalé.
2. ⚠️ **Le paquet fiscal togolais annonce des « dates de dépôt DSF » qu'il ne porte pas** — relevé par
   **STORY-413**. L'information est promise et absente.

Et sous la voie A, l'échéance cesse d'être un affichage : **c'est ce qui déclenche le dépôt**.

⚡ **Multi-pays, multi-état, multi-périodicité.** Un même cabinet aura, la même semaine, une DSF
annuelle togolaise, une déclaration de TVA mensuelle, un état DIMF trimestriel d'IMF et une échéance
CIMA. **Le calendrier n'est pas une propriété du dossier : c'est un croisement (dossier × état ×
période).**

## Critères d'acceptation

- [ ] AC-1 — L'échéance est **calculée** depuis les **bornes réelles de l'exercice** (STORY-532) et
      la règle du paquet de dépôt (STORY-536), jamais depuis un libellé ni une constante.
- [ ] AC-2 — La **périodicité** est portée par l'état, pas par le dossier : annuel, trimestriel,
      mensuel. Un même dossier porte des échéances de périodicités différentes.
- [ ] AC-3 — Le **report au jour ouvré** est déclaré par le paquet, pays par pays. ⚠️ Le supposer
      universel est faux, et un jour d'écart sur une pénalité de 40 % n'est pas une nuance.
- [ ] AC-4 — Une échéance **non calculable** rend `INDETERMINABLE` **avec son motif** — bornes
      d'exercice absentes, paquet non packagé — **jamais une date par défaut**. ⛔ Une échéance
      inventée est pire qu'une échéance absente : elle rassure.
- [ ] AC-5 — Le **retard** est calculé et publié avec sa **pénalité chiffrée** depuis le paquet. Le
      produit est déjà précis sur ce qui se rattrape ; il doit l'être sur ce qui ne se rattrape pas.
- [ ] AC-6 — Les échéances d'un portefeuille sont restituables **par cabinet**, triées par urgence.
      ⚠️ `EcheanceChip` existe déjà au portefeuille avec sa garde « absente ≠ zéro » : **s'y brancher,
      ne pas en créer une seconde.**

## Notes

- Voir [[STORY-532]], [[STORY-413]], [[STORY-453]], [[STORY-536]], [[STORY-538]].
