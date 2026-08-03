# PRD Quality Review — Points de vente & portefeuille (`pdv-service`)

**Date :** 2026-08-02 · **Enjeu :** lancement · **Forme :** capacité métier, chain-top

## Verdict d'ensemble

Le PRD tient sur son cœur — la propriété du portefeuille par l'entreprise, l'historique attaché au
point de vente plutôt qu'au commercial, et un pipeline dont les règles appartiennent au distributeur.
UJ-1 (le départ de Kofi) est le meilleur test du document : il traverse trois modules et chaque
exigence qu'il mobilise existe. **Le défaut principal est de position** : le module est en 2ᵉ place
de la séquence alors que sa vue 360° consomme des modules situés en 9, 11, 17 et 24. Une partie de
l'incrément 2 n'aura rien à afficher au moment où on le construira. Second point : le plafond de
crédit est un montant sans devise, alors que trois PRD voisins viennent d'acquérir cette contrainte.

---

## 1. Decision-readiness — **strong**

FR-C29d (la clause au contrat de l'indépendant) est remontée comme action produit plutôt qu'enterrée
dans une note. FR-V20 transforme la correction humaine en signal de réglage au lieu d'en faire une
exception — c'est une vraie décision de conception.

## 2. Substance over theater — **strong**

FR-V18 (la sortie de `à risque` aussi automatique que l'entrée) et CM-2 forment une paire cohérente :
l'exigence crée le mécanisme, la contre-métrique surveille son échec.

## 3. Strategic coherence — **adequate**

### Constats
- **high** — ⚡ **Le module est en position 2 ; sa vue 360° dépend des positions 9, 11, 17 et 24.**
  FR-V22 restitue « commandes, livraisons, créances, visites » — c'est-à-dire Commande (#11),
  Facturation (#17), Relance (#24) et Commercial terrain (#9). **Aucun n'existe quand ce module se
  construit.** L'incrément 2 (« le réseau se lit ») est donc largement vide à la livraison :
  restent les segments, la carte et le plafond. A2 l'effleure (« au v1 elle n'affiche que ce qui
  existe ») mais le découpage en incréments ne le reflète pas et laisse croire à une vue complète.
  *Fix :* soit annoncer l'incrément 2 comme partiel et dire ce qu'il contient réellement au v1, soit
  reconsidérer la position du module.

## 4. Done-ness clarity — **thin**

### Constats
- **high** — ⚡ **Le plafond de crédit (FR-V30) est un montant sans devise.** Le catalogue vient
  d'acquérir la devise sur la grille, le stock sur l'entrepôt, `paiement-service` couvre toute
  l'Afrique de l'Ouest avec des unités mineures différentes. Un plafond de crédit hors devise est le
  même défaut, au même endroit du raisonnement. *Fix :* devise + entier d'unité mineure.
- **medium** — **FR-V06 dédoublonne « sur le téléphone et la proximité géographique »**, alors que
  FR-V03 rend la géolocalisation **facultative**. Pour un point non localisé — c'est-à-dire
  précisément ceux saisis à la hâte, les plus susceptibles d'être des doublons — la moitié du
  contrôle ne s'applique pas. *Fix :* le téléphone est la clé primaire de dédoublonnage, la
  proximité un contrôle secondaire quand elle est disponible.
- **medium** — **SM-4 (« > 90 % de points géolocalisés ») suppose le module Commercial terrain (#9)**,
  qui n'existe pas à la construction (A4 le dit). La cible est donc inatteignable au v1 par
  construction. *Fix :* la rattacher à l'arrivée du module terrain.
- **low** — **Q4 (le départ d'un salarié)** est réellement ouverte : FR-V13 ne traite que
  l'indépendant. Correctement posée.

## 5. Scope honesty — **adequate**

### Constats
- **medium** — **Tension entre NFR-4 et FR-V25.** NFR-4 pose que le module « n'est pas une copie du
  système » ; FR-V25 exige un **cache local** du portefeuille pour le travail hors connexion. Un
  cache est une copie. La contradiction est résoluble — le cache est **sur l'appareil**, dérivé,
  daté, jamais une source — mais le PRD ne le dit pas et deux lecteurs concluront différemment.
  *Fix :* le formuler.
- **medium** — **Les données personnelles du contact ne sont pas traitées.** Un point de vente est un
  commerce, mais son contact est **une personne** : nom, numéro de téléphone. `notification-service`
  consacre une section entière à ce sujet (conservation, minimisation, droits) et ce module va
  alimenter ses listes d'envoi (FR-V29). *Fix :* renvoyer explicitement à cette politique plutôt que
  de laisser un vide.

## 6. Downstream usability — **strong**

Identifiants FR-V01→V43 contigus. Glossaire distinctif. Les renvois inter-PRD (`FR-C29b`, `FR-S05c`,
`FR-IA03b`) résolvent tous.

## 7. Shape fit — **strong**

UJ-1 est justifié : le départ d'un indépendant est le processus le plus délicat du module, il traverse
trois PRD, et le raconter est le seul moyen de vérifier que la chaîne tient.

---

## Notes mécaniques

- SM-4 dépend d'un module absent (repris en §4).
- A2 mentionne la limite de la vue 360° au v1 mais §9 ne la répercute pas (repris en §3).
