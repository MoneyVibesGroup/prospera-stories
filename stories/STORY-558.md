# STORY-558 : Le gabarit de dépôt est une donnée du paquet pays — le classeur GUDEF Togo en est la première instance, pas le modèle en dur

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — canal · **fournisseur de contenu :** `bilan-service`
**Points :** 13 · **Sprint :** S29
**Origine :** **arbitrage PO du 2026-08-28** — *« vu que c'est ainsi qu'on fait au Togo, il faut
enregistrer cela selon les normes du Togo… mais précise que c'est pour le Togo, avec la
possibilité d'en avoir pour chaque pays »*.
**Pièce de référence :** `1000745307_2025_Definitif (1).xlsx` — DSF définitive, dossier PARVIS DE
LA MAISON SAINTE, NIF 1000745307, exercice 2025. **92 feuilles.**
**Prérequis :** **STORY-331** (format de canal décrit comme donnée du paquet) · **STORY-361**
(socle `fiscal-service`) · **STORY-559** (les 33 notes manquantes du référentiel)
**Réf. :** **AD-11** (le contenu vient de `bilan-service`, jamais reproduit ici) · **AD-12** (le
canal est un adaptateur)

---

## Ce que l'arbitrage tranche

Le classeur de dépôt togolais devient une **donnée versionnée du paquet pays**, pas un modèle
écrit dans le code. C'est exactement ce que **STORY-331** a déjà posé — *« décrire un nouveau canal
sans livrer de code, afin qu'un second pays ne coûte que de la donnée »* — appliqué au cas le plus
lourd de la zone.

⇒ **Togo est la première instance, pas le cas particulier.** Le Bénin, le Burkina et la Côte
d'Ivoire déposeront des classeurs différents ; aucun ne doit coûter une ligne de code.

⚡ **Et c'est aussi ce qui protège la loi de finances** : un gabarit en donnée change avec
l'exercice sans redéploiement. Un gabarit en dur imposerait une livraison à chaque millésime.

## Ce que le gabarit doit décrire

Le classeur de référence porte **92 feuilles** ; leur nature diffère, et le descripteur doit le
refléter :

| Nature | Exemples | Source du contenu |
|---|---|---|
| **États calculés** | Bilan actif, Bilan passif, Compte de résultat, TFT, Résultat fiscal, Liquidation IS_IR_MP, Liquidation DP | `bilan-service` (AD-11) |
| **Notes annexes** | Notes 1 → 35, soit **44 feuilles** avec les A/B/C/bis | `bilan-service`, selon **STORY-559** |
| **Identification** | Page de garde, Fiche identification 1 & 2, Fiche dirigeants, NAEMA | `dossier-service` |
| **Dépôt** | Fiche conditions, Fiche dépôt | saisie / paquet |
| **Détails** | P64 → P86 (charges, produits, TVA, TVM, provisions, amortissements) | balance ventilée |
| **Listes** | Principaux clients, principaux fournisseurs | balance ventilée |
| **Pièce jointe** | **Balance (Optionnel)** | **STORY-555** |
| **Contrôles** | Contrôle de cohérence, Type de contrôles | **calculées par le classeur** |
| **Nomenclature** | Table des codes | paquet |

⛔⛔ **Les deux feuilles de contrôle sont un juge, et il faut le viser avant de déposer.** Elles
rendent `VRAI`/`FAUX` sur **huit contrôles intermontants** et une cotation des valeurs numériques.
Sur la pièce de référence, le premier est **`FAUX`** — *Total Actif 3 060 000 / Total Passif 0*.
Un produit qui remplit ce classeur **hérite de son barème** : il doit rendre le verdict **avant**
la remise, pas le découvrir au rejet.

⚠️ `bilan-service` produit **quatre** contrôles (`EQUILIBRE_BILAN`, `COHERENCE_RESULTAT`,
`VARIATION_TRESORERIE`, `ARTICULATION_NOTES`). Le classeur en attend **huit**. **L'écart se
publie, il ne se comble pas en silence.**

## Périmètre

**Inclus**

- Un **descripteur de gabarit** dans le paquet pays : liste ordonnée de feuilles, et pour chacune
  son nom exact, sa nature, sa source, et — pour les cellules — l'**adressage par code de poste**,
  jamais par coordonnée en dur dans le code.
- **La première instance : `depot-dsf-togo`**, adossée au classeur de référence, versionnée par
  millésime (`@2025`), couverte par un `checksum` comme les référentiels comptables.
- La **production du classeur** à partir du descripteur, par le port de canal de **STORY-330**.
- Le **visa des huit contrôles** avant remise : les quatre produits sont mis en regard, et les
  quatre non couverts sont **nommés**.
- Le **décompte de complétude** : quelles feuilles sont produites, déclarées vides, non modélisées.

**Hors périmètre**

- Écrire les 33 notes manquantes du référentiel : **STORY-559**, prérequis.
- Le dépôt lui-même — assisté (STORY-332/333) ou automatisé (**STORY-561**).
- Un second pays. Le mécanisme le permet ; l'instancier demande le classeur officiel de ce pays,
  qu'on n'a pas. ⚠️ **Ne pas inventer un gabarit béninois « probablement similaire »** : c'est
  précisément ce que le descripteur en donnée existe pour éviter.

## Critères d'acceptation

1. Le gabarit Togo est **entièrement décrit en donnée** : aucun nom de feuille, aucune coordonnée
   de cellule, aucun code de poste n'apparaît dans le code du service.
2. Le classeur produit pour la pièce de référence est **comparable feuille à feuille** avec elle :
   mêmes noms d'onglets, même ordre, mêmes emplacements de valeurs.
3. Une feuille dont la source n'est pas modélisée est **nommée comme non modélisée**. ⛔ Jamais
   produite vide : une note vide **affirme** que l'entreprise n'a rien à y déclarer.
4. Le visa des contrôles rend les huit verdicts ; les quatre non couverts sortent avec le motif
   « non produit par le moteur », pas avec `VRAI`.
5. **Étant donné** un descripteur incomplet **quand** un classeur est demandé **alors** le refus
   **nomme la feuille et le champ manquants** (patron STORY-331).
6. Le contenu des états vient de `bilan-service` par le port ; **aucun montant n'est recalculé ici**
   (AD-11).
7. Changer de millésime de gabarit ne demande **aucun déploiement** : témoin exécutable avec deux
   versions du descripteur.

## Notes

- ⚠️ **Nomenclature.** Le guichet togolais est **GUDEF** (`gudef.otr.tg`), pas « GUIDEF ». Le PRD
  fiscalité le signale : *« à corriger partout »*. Le dépôt porte encore l'ancienne graphie, y
  compris dans des noms de fichiers de référentiels — à traiter dans cette story pour ce qui la
  concerne, sans y engloutir le reste.
- ⚡ **Le classeur porte une feuille « Balance (Optionnel) »** : le dépôt accepte la balance en
  pièce jointe. C'est **STORY-555** qui la produit, et **STORY-557** qui lui donne ses colonnes.
- ⛔ **Ne pas confondre le gabarit et le canal.** Le gabarit dit *à quoi ressemble le fichier* ; le
  canal dit *comment on le remet*. Un pays peut changer de gabarit sans changer de canal, et
  l'inverse.
