# PRD Quality Review — Assistant IA socle (`assistant-service`)

**Date :** 2026-08-02 · **Enjeu :** lancement · **Forme :** capacité de plateforme, chain-top

## Verdict d'ensemble

Le PRD fait le travail que ni la note d'architecture ni l'offre commerciale ne faisaient : il nomme la
contradiction entre les deux et la tranche par un critère observable — *l'acte est-il réversible et
sans engagement ?*. CM-1 (le taux d'acceptation trop élevé comme signal d'alerte) est la meilleure
contre-métrique des trois PRD produits à ce jour. **Mais la doctrine n'a pas de porteur** : FR-IA27
interdit de placer en `AUTO` une action engageante sans dire d'où le service tire cette propriété.
Second angle mort : l'inférence coûte, et rien ne la mesure ni ne la borne — alors que les deux PRD
précédents traitent explicitement le coût de leur ressource rare.

---

## 1. Decision-readiness — **strong**

Le document tranche ce que ses sources laissaient ouvert, et le dit. §1.2 énumère les trois arbitrages
en tête de document plutôt que de les disséminer. R3 assume l'écart offre/produit sur le Copilot au
lieu de le dissoudre.

### Constats
- **medium** — **A1 est présentée comme une assumption alors que c'est la décision d'architecture la
  plus lourde du PRD** (évaluer des règles sans répliquer de read-model). Sa note le dit elle-même.
  Une assumption se confirme ; celle-ci se **tranche**. *Fix :* la doubler d'un risque et d'une
  question ouverte.

## 2. Substance over theater — **strong**

Aucune persona. Les garde-fous sont repris du prototype avec leur rationnel d'origine plutôt que
réécrits. FR-IA06 assume que le modèle de développement hallucine — c'est de l'honnêteté rare dans un
PRD d'IA.

### Constats
- **low** — **SM-3 (« entre 40 % et 85 % »)** : la borne basse est inventée. La borne haute est
  justifiée par CM-1, la basse ne l'est pas. *Fix :* la marquer comme proposée.

## 3. Strategic coherence — **strong**

La thèse — *un seul contrat de sortie pour deux moteurs* — est énoncée (§5.1), justifiée (« sans lui,
deux audits et deux façons de se tromper ») et tenue dans les FR. Les incréments suivent la thèse :
le contrat d'abord, l'ancrage ensuite, l'autonomie en dernier.

## 4. Done-ness clarity — **thin**

### Constats
- **critical** — **La doctrine n'a pas de mécanisme.** FR-IA27 dit que le mode est *« contraint par la
  nature de l'action »* et que le service *« refuse la configuration »*. Mais **rien dans le PRD ne
  dit d'où le service tire cette nature.** Réversible ? engageant ? Ce n'est ni déductible d'un
  libellé, ni devinable par un modèle. Sans un **catalogue des types d'action portant ces propriétés**,
  FR-IA27, FR-IA36, FR-IA38 et NFR-2 sont inapplicables — c'est-à-dire toute la doctrine du §2.
  *Fix :* créer le catalogue des types d'action comme objet de première classe, et en faire la source
  du contrôle.
- **high** — **Aucune exigence sur l'écart entre l'impact annoncé et l'impact recalculé.** FR-IA12
  prévoit qu'une Proposition acceptée soit appliquée par le flux déterministe, qui « recalcule
  l'impact réel ». Et si le recalcul contredit ce que la Proposition annonçait ? L'utilisateur a
  tranché sur un chiffre qui s'avère faux. C'est précisément le point où NFR-1 se prouve ou se perd.
  *Fix :* rendre l'écart visible et le mesurer.
- **medium** — **FR-IA41 (décision groupée) n'a pas de borne.** Accepter 500 cibles d'un clic *est*
  la validation de façade que CM-1 surveille. Le PRD crée le risque et le mesure sans le limiter.
  *Fix :* plafonner le lot, ou exiger un motif au-delà d'un seuil.
- **medium** — **§9 : incréments sans estimation.** Les deux PRD précédents chiffrent. Celui-ci non —
  or l'estimation de `notification-service` s'est révélée basse de 50 % au découpage réel.

## 5. Scope honesty — **strong**

§5.3 est le meilleur hors-périmètre des trois PRD : chaque exclusion porte son motif, et les deux
exclusions coûteuses (scoring, Copilot) sont remontées en risques plutôt qu'enterrées.

### Constats
- **high** — **Le coût d'inférence n'est ni mesuré ni borné.** `notification-service` mesure sa
  consommation (groupe J), `paiement-service` enregistre ses frais. Ici, chaque appel consomme du
  temps GPU sur un serveur que Q2 dit inexistant — et **aucune FR ne compte, ne plafonne, ni
  n'attribue**. Une organisation peut saturer le modèle partagé pour toutes les autres. *Fix :*
  quota d'invocation par organisation + mesure de consommation, au patron de FR-N57.

## 6. Downstream usability — **adequate**

Identifiants FR-IA01→IA48 contigus. Glossaire présent. Renvois résolvent.

### Constats
- **low** — Le glossaire ne définit pas **« corpus »**, terme utilisé dans six FR et une NFR.

## 7. Shape fit — **strong**

Spécification de capacité, sans parcours utilisateur : justifié — les surfaces consommatrices portent
l'expérience, le socle n'a pas d'utilisateur direct. Cohérent avec la position du module.

---

## Notes mécaniques

- SM-3 : borne basse non sourcée (repris en §2).
- Incréments non estimés (repris en §4).
- A1 mérite un statut plus fort que « assumption » (repris en §1).
