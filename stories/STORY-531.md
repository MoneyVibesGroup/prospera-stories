# STORY-531 : Ce que « consolidation » veut dire ici — et ce qu'on refuse de promettre

Status: ready-for-dev

**Épic :** EPIC-136 — Multi-société et périmètre de groupe
**Service :** `bilan-service`
**Points :** 13 *(le cadrage et l'agrégation ; les retraitements de consolidation sont chiffrés par EPIC-137→141)* · **Sprint :** S20
**Prérequis :** **STORY-530** (le périmètre daté)
**Origine :** §6.3 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

« Consolidation » recouvre trois choses très différentes, et un cabinet qui demande « la
consolidation » ne demande presque jamais la troisième :

| Niveau | Ce que c'est | Coût |
|---|---|---|
| **① Agrégation** | additionner les balances du périmètre, poste à poste | faible — c'est du calcul sur des soldes existants |
| **② Agrégation + éliminations** | retirer les comptes réciproques (créances/dettes intra-groupe, achats/ventes intra-groupe) | moyen — exige d'**identifier** les opérations intra-groupe |
| **③ Consolidation SYSCOHADA complète** | retraitements d'homogénéisation, écarts d'acquisition, intérêts minoritaires, impôts différés, mise en équivalence | **très élevé — c'est un métier** |

⚡ **Le piège commercial est exact et connu :** un cabinet à qui l'on dit « nous consolidons »
comprend ③. Ce qu'un produit de production comptable livre en pratique est ① ou ②. **L'écart se
découvre au premier groupe réel.**

⚠️ C'est le **même patron** que le palier 1 / palier 2 de l'assurance, et il appelle la même
conduite : découper, livrer honnêtement le niveau bas, **nommer** ce qui n'est pas fait.

## ✅ ARBITRAGE PO — 2026-08-28 : **NIVEAU ③ — consolidation SYSCOHADA complète**

> « Je veux la partie 3. » — PO, 2026-08-28.

**C'est le niveau le plus exigeant des trois, et c'est le seul qui corresponde à ce qu'un cabinet
entend par « consolidation ».** L'arbitrage est donc cohérent avec la promesse — mais il change la
nature du lot, et il faut le dire :

⛔ **Le niveau ③ n'est pas une story, c'est un module.** Il ajoute sept traitements dont aucun ne se
déduit des balances : homogénéisation des méthodes comptables, éliminations des résultats internes,
écart de première consolidation et écart d'acquisition, intérêts minoritaires, impôts différés, mise
en équivalence, conversion des comptes des filiales étrangères.

⇒ **Plage réservée le 2026-08-28 : EPIC-137 → EPIC-141**, découpée en
[[STORY-541]] → [[STORY-548]]. **Cette story-ci garde le socle** : le cadrage, l'agrégation et les
contrôles de recomposition, sur lesquels tous les retraitements viennent se poser.

### ✅ Q2 tranchée avec : les éliminations sont **déclarées puis proposées**

Le produit ne peut pas deviner que le compte client de A est le compte fournisseur de B. Il peut le
**proposer** quand les montants concordent, et laisser l'humain confirmer — même doctrine que le
rapprochement bancaire : *un proposé n'a aucun effet tant qu'il n'est pas confirmé*.

### ⚠️ Ce que le niveau ③ exige et que le produit n'a pas encore

| Prérequis | État |
|---|---|
| Plusieurs sociétés par organisation | [[STORY-529]] — S20 |
| Périmètre daté, méthodes, % contrôle et % intérêt | [[STORY-530]] — S20 |
| **Devise au contrat de balance** | [[STORY-489]] — S20 · ⛔ **bloquant pour [[STORY-548]]** |
| **Bornes et durée d'exercice** | [[STORY-532]] — S20 · une filiale peut clôturer à une autre date |

---

## Ce qui devait être tranché — RÉSOLU le 2026-08-28, conservé pour la traçabilité

**Q1 — Quel niveau promet-on ?** Recommandation : **② agrégation avec éliminations**, et le dire.
① seul n'a presque aucune valeur pour un cabinet (un tableur le fait) ; ③ est un projet à part
entière qui n'a ni PRD ni cadrage.

**Q2 — Les éliminations sont-elles automatiques ou déclarées ?** Recommandation : **déclarées puis
proposées** — le produit ne peut pas deviner qu'un compte client de A est le compte fournisseur de
B ; il peut le proposer quand les montants concordent, et laisser l'humain confirmer. Même doctrine
que le rapprochement bancaire : *un proposé n'a aucun effet tant qu'il n'est pas confirmé*.

## Critères d'acceptation — le socle (agrégation et recomposition)

- [ ] AC-1 — L'agrégation additionne les balances **validées** des sociétés du périmètre **à la date
      retenue** (STORY-530 AC-3), en respectant leur **méthode** (globale = 100 %, proportionnelle =
      pourcentage).
- [ ] AC-2 — ⛔ **Toutes les sociétés du périmètre doivent partager le même référentiel et la même
      devise.** Sinon : refus explicite, jamais une addition silencieuse. C'est le mode de panne de
      STORY-489 appliqué à un groupe.
- [ ] AC-3 — Les **éliminations** sont tracées ligne à ligne, avec leur justification, et
      réversibles. Un état consolidé sans le détail de ses éliminations n'est pas auditable.
- [ ] AC-4 — ⛔ **Ce qui n'est PAS fait est nommé à l'écran** : écarts d'acquisition, intérêts
      minoritaires, impôts différés, retraitements d'homogénéisation. Doctrine FE-073.
- [ ] AC-5 — L'état produit porte **« agrégé »** ou **« consolidé »** selon ce qui a réellement été
      fait, jamais le mot le plus vendeur.

## Notes

- Voir [[STORY-529]], [[STORY-530]], `epics-assurance-2026-08-27.md` (le patron des deux paliers).
