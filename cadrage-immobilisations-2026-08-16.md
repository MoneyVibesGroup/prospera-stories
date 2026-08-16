# Module 5 — Immobilisations & amortissements · **note de cadrage**

> **Date :** 2026-08-16 · **Statut :** cadrage — **pas un PRD**, pas une architecture
> **Position :** module **5** de `PROSPERA_SEQUENCE_MODULES_v2.md`, **vague 2**, verticales **ExpCo ·
> Dist · IMF · Assur** · charge estimée **2 sprints**
> **Pourquoi ce document :** l'audit de couverture du 2026-08-16 a trouvé ce module **entièrement
> absent de la documentation** — ni PRD, ni spine, ni épics, ni story. Il est le seul de la vague 2
> dans ce cas.

---

## 1. Le constat, vérifié

| Où on a cherché | Ce qu'on a trouvé |
| --- | --- |
| `prds/` — 8 PRD | ⛔ **zéro** occurrence d'« immobilisation » ou d'« amortissement » |
| `architecture/` — 9 spines | ⛔ **zéro** occurrence |
| `epics-*.md` — 7 découpages | ⛔ **zéro** occurrence |
| `stories/` | seulement `STORY-059` et `STORY-062` — et **pas au sens qu'on croit** *(§2)* |

## 2. ⚡ Ce qui existe déjà **restitue** l'amortissement sans que rien ne le **calcule**

C'est le vrai point de cette note, et il n'est pas confortable.

`STORY-059` produit le bilan **avec ses colonnes `Brut / Amort / Net`**. `STORY-062` produit les notes
annexes. **La liasse OHADA affiche donc des amortissements aujourd'hui, en production.**

> ⛔ **Or aucun composant du système ne les produit.** Ils ne peuvent venir que des **comptes 28xx de
> la balance** — c'est-à-dire de la comptabilité **que le client tient ailleurs**. Prospera **recopie
> un amortissement qu'il n'a ni calculé, ni justifié, ni contrôlé.**

⚠️ **Ce n'est pas un défaut : c'est le périmètre actuel, et il est cohérent.** `bilan-service` est un
**restituteur**, la balance est sa source de vérité. Mais cela veut dire que le module 5 **n'ajoute pas
une capacité neuve** — il **ferme une boucle que la liasse suppose déjà fermée**. La différence compte
pour l'arbitrage : ce n'est pas « une fonctionnalité de plus », c'est **la justification d'un chiffre
déjà affiché**.

## 3. Deux conséquences qui débordent du module

**① Le résultat fiscal est incomplet sans lui.** `prd-fiscalite` ne contient **aucune** occurrence de
« déductibilité », « réintégration » ou « charge non déductible » — vérifié le 2026-08-16, une seule
correspondance et c'est `reproductible` dans `NFR-F03`. Or l'amortissement est **la** charge dont la
déductibilité se discute (durées fiscales ≠ durées économiques, amortissements différés, biens
somptuaires). ⚡ **`EPIC-023` calcule un résultat fiscal sur un poste dont personne ne porte la règle.**

**② Le module 5 est le troisième « dérivé » du même patron.** `stock-service` a déjà tranché la
question de fond *(spine stock, `AD-1`)* : **un dérivé se reconstruit, il n'est jamais une seconde
source de vérité**, et il **contribue** à la balance comme **origine**, jamais comme **source**.

> ⚡ **Le patron d'architecture est donc déjà écrit.** Si le module 5 se fait, il devrait être une
> **quatrième `ORIGINE`** du hub balance — après `A_NOUVEAUX`, `PROVISIONS_FISCALES` et `stock`. C'est
> l'économie principale de ce cadrage : **il n'y a pas de décision d'architecture neuve à prendre sur
> le rattachement**, seulement à l'appliquer.

## 4. Ce que le module devrait couvrir — **liste à valider, non arbitrée**

| Bloc | Contenu pressenti | Remarque |
| --- | --- | --- |
| Fiche d'immobilisation | nature, date de mise en service, valeur d'entrée, durée, mode | l'unité de travail |
| Plan d'amortissement | linéaire · dégressif · dérogatoire | ⚠️ **familles bornées**, comme `FR-F11` en fiscal |
| Dotation périodique | calcul, écriture, rattachement au dossier et à l'exercice | c'est la contribution à la balance |
| Sorties | cession, mise au rebut, **VNC** et plus/moins-value | ⛔ le plus souvent oublié |
| Restitution | **tableau des immobilisations de la liasse** (note annexe) | ⚡ **le consommateur existe déjà** |
| Rapprochement | fiche ↔ comptes 2x et 28xx de la balance | même patron que `FR-F32` en social |

## 5. Les questions qui doivent être tranchées **avant** d'écrire un PRD

1. ⚡ **Registre ou moteur ?** Prospera **tient** le fichier des immobilisations, ou il se contente de
   **contrôler** ce que la balance porte déjà ? Les deux sont défendables ; ils n'ont ni le même coût
   ni le même risque. **Rien d'autre ne peut être décidé avant celle-ci.**
2. **Durées : économiques, fiscales, ou les deux ?** Les deux ⇒ l'écart devient une donnée, et il
   alimente la réintégration fiscale du §3-①. Une seule ⇒ on choisit laquelle, et on l'assume.
3. **D'où vient le référentiel de durées ?** ⛔ Si c'est du paquet fiscal, alors `NFR-F04` s'applique :
   **aucune durée codée en dur** — et le paquet togolais ne les porte pas aujourd'hui *(même famille de
   trou que `GAP-smig-togo-sans-valeur`)*.
4. **Quelles verticales en v1 ?** La séquence dit les quatre. L'IMF et l'assurance ont des règles
   prudentielles propres ; le distributeur, non.
5. **Rang réel.** Le module est classé **vague 2** — mais la vague 2 est déjà chargée *(Assistant IA,
   Stock)*, et le module 5 n'a **ni PRD ni spine** quand les autres en ont. **Le tenir au rang 5 est un
   choix, pas une évidence.**

## 6. Ce que cette note ne fait PAS

- ⛔ Elle **ne remplace pas un PRD** et ne vaut pas cadrage validé.
- ⛔ Elle **n'attribue aucune plage d'épics** — *une plage annoncée hors du registre n'est pas réservée ;
  seul `sprint-status.yaml` fait foi.*
- ⛔ Elle **ne crée aucune story** : la question 1 du §5 change le découpage du tout au tout.
- ⛔ Elle **ne modifie pas `bilan-service`**, dont le comportement actuel est correct pour son périmètre.

---

**Suite attendue :** arbitrage PO sur les cinq questions du §5 → PRD → spine → épics, dans cet ordre,
comme les huit modules précédents. Écart tracé : **`GAP-module-5-immobilisations-sans-cadrage`**.
