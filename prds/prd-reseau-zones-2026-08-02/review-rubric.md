# PRD Quality Review — Réseau, agences & zones (`reseau-service`)

**Date :** 2026-08-02 · **Enjeu :** lancement · **Forme :** capacité de plateforme, chain-top

## Verdict d'ensemble

Le PRD identifie correctement que son apport principal n'est pas la carte mais la **portée d'accès** —
l'autre moitié du contrôle d'accès livré au sprint 18 — et NFR-1 (« une portée vide refuse, elle
n'ouvre pas ») est posée avec sa condition observable, ce qui est le bon niveau de rigueur pour un
défaut invisible en test fonctionnel. La séparation lieu/périmètre est justifiée par les deux
verticales et la tension résiduelle des « lieux » est assumée plutôt que masquée. **Un trou sérieux
cependant : le PRD ne dit jamais comment la portée parvient aux services qui doivent l'appliquer** —
et ses deux NFR sur le sujet se contredisent. Et un plafond monétaire sans devise, pour la quatrième
fois de la série.

---

## 1. Decision-readiness — **strong**

§1.3 expose une tension d'architecture, la tranche, et donne l'argument décisif (la règle des 4
positions) plutôt qu'une préférence. FR-R09 découpe agence/caisse au bon endroit. CM-2 traite les
portées totales comme des occurrences et non comme un seuil — c'est la bonne rigueur.

## 2. Substance over theater — **strong**

FR-R27 et FR-R33 nomment chacun un défaut réel plutôt qu'une bonne pratique générale. FR-R21 (un nœud
sans responsable est un trou, pas une neutralité) reprend un patron déjà éprouvé ailleurs dans la
série.

## 3. Strategic coherence — **strong**

L'ordre des incréments est justifié par le risque et non par la facilité : l'autorité avant la
lecture, parce que son erreur est silencieuse.

## 4. Done-ness clarity — **thin**

### Constats
- **high** — ⚡ **Le PRD ne dit pas comment la portée atteint les services, et ses deux NFR se
  contredisent.** NFR-2 pose que le module **publie** la portée et que chaque service filtre lui-même,
  précisément pour ne pas devenir un point de passage obligé. Mais NFR-6 fixe une cible de **200 ms**
  à la « résolution de la portée » en précisant qu'elle est **« sur le chemin de lecture de tous les
  autres services »** — ce qui décrit exactement un appel par lecture, donc le goulot que NFR-2
  voulait éviter. Trois mécanismes possibles, et le choix a des conséquences opposées :

  | Mécanisme | Avantage | Coût |
  |---|---|---|
  | Appel au module à chaque lecture | Toujours à jour | Le goulot que NFR-2 refuse |
  | **Portée dans le jeton** (extension de `perms[]`, STORY-140) | Aucun appel, cohérent avec l'existant | **Latence de révocation** : une portée retirée ne prend effet qu'au renouvellement du jeton |
  | Read-model répliqué par service | Rapide, autonome | Duplication et dérive |

  *Fix :* trancher, et si c'est le jeton, **écrire la latence de révocation comme une propriété
  connue** — pas la découvrir le jour où l'on retire une portée en urgence.
- **medium** — ⚡ **FR-R08 : les plafonds sont des montants sans devise.** Quatrième occurrence du
  même motif dans la série (catalogue, stock, PDV, ici). *Fix :* devise + entier d'unité mineure.
- **medium** — **FR-R18 promet une résolution « adresse → zone » que FR-R02 rend impossible dans le
  cas courant.** L'emprise géographique est facultative ; sans elle, la résolution ne peut se faire
  que par **correspondance de noms de localités**, ce qui est un tout autre mécanisme — et un tout
  autre taux d'échec. *Fix :* décrire les deux chemins et dire lequel s'applique quand.
- **medium** — **FR-R05 et NFR-3 promettent que l'ancien découpage reste consultable, sans mécanisme.**
  Versionne-t-on l'arbre entier, ou conserve-t-on l'affectation historique sur chaque objet
  rattaché ? Les deux marchent, ils ne coûtent pas la même chose. *Fix :* nommer le mécanisme,
  comme FR-C10b l'a fait pour les facteurs de conversion.

## 5. Scope honesty — **strong**

FR-R33 (la carte n'est pas exhaustive : une zone non déclarée est invisible, pas blanche) est
exactement le genre de limite qu'un PRD omet d'habitude.

### Constats
- **low** — **A4 (« l'agence est un objet IMF, le distributeur n'en a pas »)** est légèrement démentie
  par FR-R06, qui prévoit un type « point de service », et par le prototype distributeur qui connaît
  des dépôts régionaux. Sans conséquence, mais l'assumption est plus tranchée que la réalité.

## 6. Downstream usability — **strong**

Identifiants FR-R01→R40 contigus. Glossaire net — la distinction lieu/périmètre y est portée par les
définitions elles-mêmes (« elle n'a pas d'adresse : elle a des frontières »).

### Constats
- **low** — **SM-3 (« tous les services consommateurs appliquent la portée »)** n'est pas mesurable
  sans un inventaire de ce que « tous » désigne. *Fix :* la lier à une liste nommée.

## 7. Shape fit — **strong**

Spécification de capacité sans parcours utilisateur : justifié, le module n'a pas d'utilisateur final
et ses consommateurs sont des services.

---

## Notes mécaniques

- Quatrième occurrence du montant sans devise dans la série — le motif mérite d'être vérifié
  systématiquement à la revue croisée.
- NFR-6 et NFR-2 à réconcilier (repris en §4).
