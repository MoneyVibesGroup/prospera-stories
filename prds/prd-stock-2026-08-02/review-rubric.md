# PRD Quality Review — Stock (`stock-service`)

**Date :** 2026-08-02 · **Enjeu :** lancement · **Forme :** capacité métier, chain-top

## Verdict d'ensemble

Le PRD est solide sur son socle : NFR-1 (le stock est une somme de mouvements, avec sa condition
observable) est la bonne fondation, et le groupe H traduit la thèse du dormant en quatre détections
chiffrées plutôt qu'en intentions. Le couplage comptable à sens unique est bien posé. **Deux défauts
de modélisation cependant** : le suivi par lot et la valorisation CUMP se contredisent sans que le
PRD s'en aperçoive, et le stock « réservé » suppose un module Commande qui n'apparaît nulle part dans
les dépendances.

---

## 1. Decision-readiness — **strong**

Les arbitrages du PO sont écrits comme des décisions avec leur motif : lot activable par article,
CUMP configurable mais figé par exercice, deux sources pour le stock réseau. Q3 est correctement
identifiée comme une question **comptable** et non technique.

## 2. Substance over theater — **strong**

Le groupe H ne recopie pas les quatre cas du prototype : il leur donne une détection distincte et un
coût de portage. FR-S45 (« une alerte sans montant ne déclenche aucune décision ») est une exigence,
pas une formule.

### Constats
- **low** — **SM-4 (« part du capital dormant, tendance décroissante »)** n'a pas de point de départ.
  À la mise en service, aucune tendance n'existe. *Fix :* mesurer d'abord, fixer le seuil ensuite.

## 3. Strategic coherence — **strong**

Les incréments suivent une logique défendable : tracer, valoriser, alerter. L'incrément 2 est
correctement identifié comme celui qui porte le gain pour un client possédant déjà le Bilan.

## 4. Done-ness clarity — **thin**

### Constats
- **high** — ⚡ **Le suivi par lot et la valorisation CUMP se contredisent, et le PRD ne le voit pas.**
  Un lot porte **son propre coût d'entrée** (FR-S18 + FR-S23) ; le CUMP **dissout** les coûts dans une
  moyenne pondérée recalculée à chaque entrée (FR-S24). Un client qui active les deux — ce que rien
  n'interdit — obtient un stock dont chaque lot a un coût connu et une valeur comptable qui l'ignore.
  Que vaut alors un lot ? *Fix :* trancher — soit le lot porte une valeur informative et le CUMP fait
  foi au bilan, soit l'activation du lot force une valorisation par lot. Le silence produira deux
  implémentations divergentes.
- **high** — ⚡ **FR-S08 (stock réservé) suppose le module Commande (#11), absent des dépendances.**
  « Réservé (engagé sur une commande non livrée) » ne peut venir que de là. §9 liste Catalogue,
  `bilan-service`, Réseau, Approvisionnement, Assistant IA et Terrain — **pas Commande**. Or Stock est
  en position 7 et Commande en 11 : à la construction, la réservation n'a **aucune source**. *Fix :*
  déclarer la dépendance et dire ce que fait le v1 sans elle.
- **medium** — **Q3 bloque une partie de la valorisation, sans que ce soit dit.** Le stock en transit
  « a une valeur » (FR-S52), mais tant qu'on ne sait pas à quel entrepôt il se rattache au bilan,
  FR-S28 (valeur par entrepôt) et FR-S30 (valeur d'arrêté) sont incomplètes. *Fix :* signaler la
  portée du blocage.
- **medium** — **Aucune devise déclarée sur l'entrepôt.** FR-S23 valorise « dans la devise de
  l'entrepôt », mais FR-S01 ne lui en donne pas. Incohérence directe, d'autant que le catalogue vient
  d'acquérir la devise sur la grille.
- **medium** — **FR-S16 : seuil de validation d'ajustement sans valeur par défaut.** Les PRD
  `notification-service` et `paiement-service` donnent leurs défauts ; celui-ci ne le fait ni ici, ni
  pour la période d'observation de la couverture (FR-S36), ni pour le délai de dormance (FR-S42).
- **medium** — **Les pertes ne sont pas distinguées dans la publication comptable.** FR-S29 les
  valorise et les restitue séparément, mais FR-S30 ne publie que « valeur » et « variation ». Or
  casse, péremption et écart d'inventaire n'ont pas le même traitement au compte de résultat.
- **medium** — **FR-S10 (stock à une date passée) n'a pas de cible de performance** alors que sa mise
  en œuvre naturelle — rejouer tous les mouvements — est la plus coûteuse du module. NFR-7 ne le
  couvre pas.

## 5. Scope honesty — **adequate**

Le hors-périmètre distingue proprement « fournir le signal » de « décider », comme le catalogue.

### Constats
- **medium** — **Une dépendance implicite au catalogue n'est pas énoncée** : toute la cohérence des
  quantités repose sur le fait que **l'unité de base d'un article ne change jamais**. Le PRD Catalogue
  laisse la question ouverte (sa Q1). Si elle changeait, tous les stocks historiques deviendraient
  faux. *Fix :* l'écrire comme dépendance dure.

## 6. Downstream usability — **strong**

Identifiants FR-S01→S65 contigus. Glossaire distinctif — la séparation « date limite » / « fin de vie
commerciale » évite une confusion coûteuse.

## 7. Shape fit — **adequate**

Spécification de capacité sans parcours utilisateur : défendable, les utilisateurs sont internes et
mono-rôle par écran. La thèse du dormant gagnerait une scène, mais ce n'est pas un défaut.

---

## Notes mécaniques

- Défauts manquants sur trois durées paramétrables (repris en §4).
- SM-4 sans référence initiale (repris en §2).
