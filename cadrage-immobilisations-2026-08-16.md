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

**① Le résultat fiscal — ⚠️ CORRECTION DE LA PREMIÈRE RÉDACTION.**

> Cette note affirmait d'abord : *« `EPIC-023` calcule un résultat fiscal sur un poste dont personne ne
> porte la règle. »* **C'est faux, et il faut le dire net.** La vérification de `STORY-091` — **livrée**,
> S19 soldé le 2026-08-04 — montre que le cas est traité **explicitement** :
>
> *« Les retraitements de clôture que **rien ne peut déduire d'une ligne de dépense** : **amortissements
> excédentaires**, provisions non déductibles, déficits reportables… → **saisis explicitement** par le
> comptable, avec un **code DSF** et une **justification**. »*
>
> Avec `justification` **et** `baseLegale` **obligatoires** — `400` sinon. **Rien n'est fabriqué, rien
> n'est silencieux.** Le nombre est juste ; c'est le comptable qui l'a calculé, ailleurs. ⚡ **Cela
> affaiblit l'urgence du module 5** et rend le statu quo défendable — c'est ce qui a fondé l'arbitrage 1.

Ce qui reste vrai, et qui est plus précis : **la RÈGLE d'amortissement vit dans la tête du comptable, pas
dans le système.** Le paquet fiscal porte le **régime** — *« linéaire, dégressif ou accéléré (Art. 100) ;
petit outillage HT ≤ 100 000 FCFA déductible immédiatement → LEVIER conseil fiscal »* — mais **aucune
durée par nature de bien**. Le système sait donc **quels modes existent** et **pas combien d'années**.

⚡ **Et la ligne existe déjà, numérotée.** L'état `RESULTAT_FISCAL` de la GUIDEF compte **23 postes**,
dont **quatre** portent sur l'amortissement : `11` *(excédentaires et autres non déductibles)*, `12` et
`155` *(réputés différés)*, `145`. Les codes sont **validés contre le paquet** par `STORY-091`.

> ⚠️ **Nit relevé au passage, dans une story livrée :** l'exemple de `STORY-091` écrit *« code `40` —
> Amortissements excédentaires »*. Le `40`, c'est **charges et dépenses somptuaires** ; l'amortissement
> excédentaire, c'est le **`11`**. Le code étant validé au runtime contre le paquet, **seul l'exemple
> est faux** — mais il est dans un document livré, et un exemple faux s'imite. À corriger à la prochaine
> ouverture du fichier.

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

## 5. ✅ Arbitrages PO du **2026-08-16**

| # | Question | Décision |
| --- | --- | --- |
| **1** | Registre ou moteur ? | ✅ **CONTRÔLEUR D'ABORD** — Prospera ne tient **aucune fiche** |
| **2** | Durées | ✅ **LES DEUX** — économique **et** fiscale |
| **3** | Placement | ✅ **`balance-service`** — pas de nouveau service |
| **4** | Rang | ✅ **REPOUSSÉ** — derrière Stock et Assistant IA, rang formel 5 conservé |
| 5 | Verticales v1 | ⏳ **ouverte, mais plus bloquante** — le contrôleur vaut pour les quatre |

### ⚡ Ce que la combinaison ① + ② implique, et qu'il faut écrire avant de coder

**« Contrôleur » et « les deux durées » ne se contredisent pas — mais leur assemblage n'est évident pour
personne, et c'est lui qui définit le module :**

> Le module **détient un tableau d'immobilisations** (importé ou saisi) portant **les deux durées par
> bien**. Il n'en tire **aucune écriture** et **aucune dotation** : il **recalcule l'écart** durée
> économique ↔ durée fiscale, et **le confronte** au montant que le comptable a saisi en `code 11`
> *(STORY-091)*. ⛔ **Il propose, il ne remplace pas** — la saisie justifiée reste le chemin qui fait foi.

**Conséquences directes, toutes vérifiables :**

- ⛔ **Aucune contribution à la balance.** Le module ne devient **pas** une quatrième `ORIGINE` — c'était
  l'hypothèse du §3-②, **elle tombe avec l'arbitrage ①**. `balance-service` reste inchangé côté hub.
- ⚡ **Le levier fiscal du paquet devient exploitable** : *« petit outillage de valeur unitaire HT
  ≤ 100 000 FCFA déductible immédiatement »* est déjà déclaré comme **LEVIER conseil fiscal**. Un
  contrôleur qui voit les valeurs unitaires peut le signaler. **C'est du conseil, pas du calcul** — donc
  dans le périmètre retenu.
- ⚠️ **Le contrôle a besoin d'un barème fiscal que le référentiel n'a pas.** Le paquet porte les trois
  **modes** (linéaire, dégressif, accéléré — Art. 100) mais **aucune durée par nature de bien**. ⇒ même
  famille de trou que `GAP-smig-togo-sans-valeur`, **troisième du jour**. Demandé en même temps que le
  SMIG, en priorité 2 : une seule sollicitation de l'expert-comptable, deux données.
- ⛔ **Sans ce barème, le contrôleur ne contrôle rien** — il afficherait le tableau sans pouvoir
  recalculer l'écart. **C'est le vrai préalable du module, avant même son PRD.**

### Ce qui reste ouvert

**La verticale.** Le contrôleur fonctionne pour les quatre, mais il **ne ferme pas la boucle** pour le
distributeur et l'IMF, qui alimentent la balance en direct et **n'ont personne** pour calculer leurs
amortissements. ⚠️ **L'arbitrage ① les laisse volontairement sans solution** — c'est un choix assumé,
pas un oubli, et il devra être rouvert le jour où l'un de ces verticaux produit une liasse.

---

## 6. Les questions d'origine *(conservées — elles documentent l'arbitrage)*

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

## 7. Ce que cette note ne fait PAS

- ⛔ Elle **ne remplace pas un PRD** et ne vaut pas cadrage validé.
- ⛔ Elle **n'attribue aucune plage d'épics** — *une plage annoncée hors du registre n'est pas réservée ;
  seul `sprint-status.yaml` fait foi.*
- ⛔ Elle **ne crée aucune story** : la question 1 du §5 change le découpage du tout au tout.
- ⛔ Elle **ne modifie pas `bilan-service`**, dont le comportement actuel est correct pour son périmètre.

---

**Suite attendue :** arbitrage PO sur les cinq questions du §5 → PRD → spine → épics, dans cet ordre,
comme les huit modules précédents. Écart tracé : **`GAP-module-5-immobilisations-sans-cadrage`**.
