# STORY-463 : L'ancre des emplois durables peut devenir négative — un actif immobilisé net négatif que le contrôle d'équilibre ne peut pas voir

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en faisant varier le délai clients sur le jeu de démonstration de FE-035, contre le moteur réel.

---

## Le fait

Le bilan prévisionnel simplifié part d'un **solde d'ancrage** :

```
actifImmobiliseNet = totalActifBase − bfrNormatif(0) − tresorerieBase
```

assumé comme tel dans les types (« elle absorbe tout ce que le modèle simplifié ne ventile pas »).
Rien ne le borne. Or `bfrNormatif(0)` croît linéairement avec les délais saisis, qui sont bornés à
**3 650 jours** par le DTO.

Sur le dossier de démonstration (total actif 5 700 000, trésorerie 850 000, marge 18 %, stocks 75 j,
fournisseurs 60 j), l'ancre bascule **négative dès 95 jours** de délai clients — un délai parfaitement
banal en Afrique de l'Ouest. Le bilan prévisionnel affiche alors un **actif immobilisé net négatif**,
c'est-à-dire une ligne d'actif impossible.

⚠️ **Et `controle.ecart` ne rougit pas** : il est nul **par construction** (la trésorerie de clôture
absorbe exactement les flux). C'est exactement le défaut déjà relevé sur `coherenceResultat` dans la
liasse — un voyant qui ne peut pas s'allumer donne une fausse assurance.

## Critères d'acceptation

- [x] AC-1 — La réponse porte `ancrageEmploisDurables: { montant, coherent: boolean }` et le
      `coherent: false` est **explicite** quand le montant est négatif.
- [x] AC-2 — Un contrôle dédié apparaît à côté de `controle` : `ANCRAGE_EMPLOIS_DURABLES`, de nature
      **INFORMATIVE** (il ne doit pas empêcher de projeter), avec son écart.
- [x] AC-3 — Le test unitaire exerce le **seuil** : une projection au-delà du seuil produit
      `coherent: false`, une projection en-deçà `true` — la relation doit être mise à l'épreuve, pas
      seulement écrite (même argument que `controleEquilibre` exporté à dessein).
- [x] AC-4 — La borne des délais est ramenée à une valeur métier (proposition : **365 jours**) — 3 650
      jours n'a aucun sens et laisse passer les saisies fautives d'un facteur 10.

## Conséquences ailleurs

- Alimente l'écran FE-035, qui affiche aujourd'hui le seuil calculé au cas par cas.

---

## Progress Tracking

### Livrable

| AC | État | Où |
|---|---|---|
| AC-1 | ✅ | `ProjectionAnnuelle.ancrageEmploisDurables` — `{ code, categorie, montant, ecart, coherent }`, publié **une fois**, à côté de `bfrBase`. |
| AC-2 | ✅ | `BilanSimplifiePrevisionnel.controleAncrage`, **par exercice**, à côté de `controle`. Code `ANCRAGE_EMPLOIS_DURABLES`, catégorie `INFORMATIF`. |
| AC-3 | ✅ | Seuil éprouvé **par une vraie projection**, des deux côtés (96 j / 97 j sur la fixture calquée sur FE-035), plus la fonction pure isolée. |
| AC-4 | ✅ | `BORNE_DELAI_BFR_JOURS = 365` dans `HypothesesDto`, donc sur les **deux** chemins d'écriture (création et édition, qui composent tous deux ce DTO). |

**Une seule fonction, deux placements.** `controleAncrage(montant)` est exportée depuis
`projection-annuelle.service.ts`, **à côté de `controleEquilibre` et pour la même raison qu'elle** — la
story le demandait explicitement. Elle sert l'ancre de la base (la cause) et la ligne de chaque exercice
(le symptôme affiché) ; les deux divergent dès qu'un investissement est projeté.

**Vocabulaire réemployé, code non enrôlé.** `categorie` reprend `CategorieControle` de la batterie de la
liasse (import de **type** seul). Le code, lui, n'a **pas** été ajouté à `CODES_CONTROLE` : cette liste est
lue exhaustivement à plusieurs endroits, et un contrôle du prévisionnel y rendrait ces lectures incomplètes
en silence.

**`MODELE_PROJECTION_VERSION` non bumpée**, à dessein : elle documente le modèle **ayant produit les
montants**, et aucun montant ne bouge. C'est le précédent immédiat de STORY-461 et 462, qui ont l'une et
l'autre ajouté des champs de réponse sans la toucher.

### Mutations (un test qu'un code bugué franchit ne prouve rien)

| # | Mutation | Attendu | Constaté |
|---|---|---|---|
| M1 | `coherent: montant >= 0` → `coherent: true` | rouge | **6 tests rouges** |
| M2 | `ecart: montant < 0 ? montant : 0` → `ecart: 0` | rouge | **4 tests rouges** |
| M3 | contrôle d'exercice branché sur l'**ancre** au lieu de la ligne | rouge | **1 test rouge** — celui, et le seul, écrit pour ça |
| M4 | `BORNE_DELAI_BFR_JOURS` 365 → 3650 | rouge | **4 e2e rouges** (3 champs en création + l'édition) |
| M5 | champ retiré du mapper `ProjectionResponseDto.from()` | rouge | ⚠️ **rouge par ERREUR DE COMPILATION — ne prouve rien.** Le champ est requis sur le DTO : c'est le **typage** qui garde l'oubli, pas un test. |
| M5 bis | mapper branché sur la **mauvaise source** (`exercices[0].bilanSimplifie.controleAncrage`), donc compilant | rouge | **1 e2e rouge** |

M3 est le point à retenir. Avec `investissements: 0`, l'ancre et la ligne d'exercice sont **numériquement
confondues** : toute la batterie du seuil passait au vert sur un contrôle d'exercice qui n'en est pas un.
Il a fallu un cas où elles divergent — ancre négative, ligne redevenant positive en N+3 — pour que la
mutation morde.

### Vérification docker (stack réelle, `bilan_service`, jeton RS256 signé localement)

⚠️ **Le conteneur ne rechargeait pas le code monté** (inotify ne traverse pas le bind mount macOS) : la
première mesure a renvoyé une réponse **sans les nouveaux champs**, code de branche pourtant en place sur
le disque. `docker compose restart bilan-service` a recompilé. Une mesure prise avant ce redémarrage aurait
« prouvé » que le livrable n'était pas là.

**Dossier réel** : total actif 7 000 000, trésorerie de clôture 5 000 000, produits 16 375 000, marge 30 %,
stocks 30 j, fournisseurs 60 j.

| Mesure | Résultat |
|---|---|
| Jeu courant (45 j) | `ancrageEmploisDurables = { montant: 908 334, ecart: 0, coherent: true }` — et 7 000 000 − 1 091 666 − 5 000 000 = 908 334, à l'unité. |
| Seuil **réel** du dossier | **65 jours**, pas 95. À 64 j l'ancre vaut 44 098 ; à 65 j elle vaut **−1 388**. |
| À 65 j, les 3 exercices | `actifImmobiliseNet = −1 388`, `controle.equilibre = **true**`, `controleAncrage.coherent = **false**`. |
| AC-4, création, 366 j | **400** — `hypotheses.delaiBfrClientsJours must not be greater than 365`. **0 document écrit.** |
| AC-4, création, 365 j | **201**, et le `365` est **relu en base** sur le document du jeu. |
| AC-4, **édition**, 366 j | **400** ; à 365 j → **200**, jeu en version 2, **1** version historisée, paire jeu ↔ version intacte. |
| Fuite au-delà de la borne | `0` document porteur d'un délai > 365, `jeux_hypotheses` **et** `versions_hypotheses`. |
| Orphelins | `0` version sans jeu parent. |

⚡⚡ **Le seuil de la fiche était celui de la maquette, pas celui de la base.** La fiche annonce 95 jours,
mesurés sur le jeu de démonstration **de FE-035** (actif 5 700 000, trésorerie 850 000, marge 18 %). Sur le
dossier réellement persisté, la trésorerie pèse 5 000 000 d'un actif de 7 000 000 : il ne reste que
2 000 000 d'ancre, et **65 jours suffisent**. Le défaut est donc plus proche qu'annoncé, pas plus loin —
un délai clients de deux mois y suffit.

⚠️ **Le premier relevé de la borne était une non-mesure.** Une requête `mongosh` sur `jeuHypothesesId`
a d'abord renvoyé « 0 version » pour les trois jeux créés : le nom du champ était bon, mais la **v1 vit sur
le document du jeu**, pas dans `versions_hypotheses`, qui n'est alimentée qu'à l'**édition**. Compté sur la
mauvaise collection, « 0 » se lisait comme « rien écrit » alors que tout l'était.

### Portes

Lint 0 warning · build OK · **2 021** unitaires verts, seuils de couverture tenus (98,89 / 94,42 / 98,87 /
98,91) · **562** e2e verts.

### Hors périmètre, assumé

- **L'export prévisionnel** (`modele-previsionnel.ts`) imprime toujours `Actif immobilisé net` comme un
  nombre nu, sans reprendre le voyant. La story cadre la **réponse de projection** et l'écran FE-035 ;
  porter le contrôle dans le classeur Excel serait un débordement.
- **Les jeux historiques** portant un délai > 365 se **projettent** toujours : le schéma Mongoose ne borne
  rien et la migration de données est un souci de prod, différé. Leur prochaine **édition** est refusée.
  Aucun n'existe en base aujourd'hui (mesuré ci-dessus).
