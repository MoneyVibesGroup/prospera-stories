# TICKET frontend — une provision SAISIE et une provision CALCULÉE doivent se distinguer à l'écran

**Type :** affichage qui engage la responsabilité du produit
**Dépôt :** frontend du vertical assurance (écrans « provisions techniques » et « provision pour risques en cours »)
**Débloqué par :** **STORY-519** (`assurance-service`)
**Ouvert par :** STORY-519, 2026-09-21
**Priorité :** Must — l'AC-3 de STORY-519 est livrée **côté contrat** ; tant que l'écran ne la reprend
pas, la confusion que la story sert à empêcher reste entière pour l'utilisateur, qui ne lit pas le JSON.

---

## Le problème

`assurance-service` publie **deux** registres de provisions, et jusqu'à STORY-519 rien ne les
distinguait :

| Registre | Route | Qui produit le montant |
|---|---|---|
| **calculé** | `…/assurance/provisions-risques-en-cours` | le module, par la méthode de l'art. 334-10 |
| **hébergé** | `…/assurance/provisions-techniques` | **l'entreprise** — le module ne fait que stocker |

⛔ **Les confondre ferait porter au produit une responsabilité qu'il n'assume pas.** Un montant de
provision pour sinistres à payer affiché à côté d'un montant calculé, sans marque distinctive, se lit
comme un chiffre du produit. C'est une évaluation actuarielle de l'assureur.

## Ce que le backend sert désormais

### 1. `origine` — sur toute réponse porteuse d'un montant

Valeurs (`OrigineProvision`) : `CALCULEE_PAR_LE_MODULE` · `SAISIE`.

Présent sur : la réponse de création et de lecture des **deux** registres, chaque élément des listes,
**et l'enveloppe de l'agrégat** `GET …/provisions-techniques/en-vigueur` — celle qui porte
`totalBrut` et `totalPartDesReassureurs`.

⚠️ **Le total est le plus important à marquer.** Un total publié sans dire qu'il est saisi est
exactement le chiffre qu'un lecteur attribuera au produit.

### 2. `methodeServie` — bloc **toujours présent**, jamais optionnel

```jsonc
{
  "statut": "A_VALIDER_PAR_UN_EXPERT",   // ou TRANSCRITE_DU_TEXTE | VALIDEE_PAR_UN_EXPERT
  "fondement": "Code CIMA, art. 334-8 3°",
  "valideeParNom": "…",                  // présents seulement si une validation est déclarée
  "valideeParQualite": "…",
  "valideeLe": "2026-03-15",
  "miseEnGarde": "…"                     // sourcée sur l'article
}
```

| `statut` | Sens | Traitement attendu à l'écran |
|---|---|---|
| `TRANSCRITE_DU_TEXTE` | la méthode est **écrite dans le Code** (forfait de 36 %, prorata de l'art. 334-10) | neutre — mais **afficher la `miseEnGarde`**, qui porte les réserves du calcul |
| `VALIDEE_PAR_UN_EXPERT` | une personne **nommée** l'a validée | afficher **le nom, la qualité et la date**, à côté de la méthode |
| `A_VALIDER_PAR_UN_EXPERT` | **personne ne l'a validée** — c'est le défaut | **marque visible**, au même endroit que le montant |

⚠️ **`valideeParNom` n'est PAS `auteurNom`.** L'un a **validé la méthode**, l'autre **signe
l'évaluation** : deux actes, souvent deux personnes. Les afficher sous le même libellé attribuerait à
l'opérateur la caution d'une méthode qu'il n'a pas validée.

### 3. `GET …/assurance/provisions-techniques/methodes` — le catalogue

Quatorze lignes, une par couple (catégorie, type) des deux listes du Code. Chacune porte `origine`,
`fondement` (l'article), `raisons` (pourquoi le module ne calcule pas) et `miseEnGarde`.

C'est ce qui permet à un écran de saisie de dire, **avant** que l'utilisateur saisisse, que le module
ne proposera aucun montant pour ce type — et pourquoi.

Motifs possibles (`RaisonDeNonCalcul`) : `JUGEMENT_EXIGE_PAR_LE_TEXTE` ·
`RENVOI_A_UNE_CIRCULAIRE` · `ACCORD_DE_LA_COMMISSION_REQUIS` · `AUCUNE_METHODE_DANS_LE_TEXTE` ·
`DONNEE_ABSENTE_DE_CE_SERVICE`.

⚠️ **Aucun de ces motifs ne dit « il faut un actuaire », et c'est volontaire** : mesuré sur les
608 pages du Code CIMA, **aucun article n'exige qu'un actuaire valide une provision technique**. Le
certificateur que le Code nomme est un **mandataire social** (art. 425, sous sanction). Un libellé
d'écran qui invoquerait l'actuaire réintroduirait ce que le backend a retiré.

### 4. Nouveau champ de saisie, facultatif et **tout ou rien**

Sur le `POST …/provisions-techniques` : `methodeValideeParNom`, `methodeValideeParQualite`,
`methodeValideeLe`. Les trois ensemble, ou aucun.

| Refus | Statut | Quand |
|---|---|---|
| `VALIDATION_METHODE_INCOMPLETE` | `400` | un ou deux des trois champs seulement |
| `VALIDATION_METHODE_FUTURE` | `400` | date de validation à venir |
| `VALIDATION_METHODE_POSTERIEURE_A_L_EVALUATION` | `409` | validation **après** la date d'évaluation |

Le `409` mérite un message propre : le registre est **append-only**, donc la bonne conduite est
d'enregistrer une **nouvelle version** à partir de la date de validation, pas de corriger la
précédente.

## Ce qui est demandé

1. Afficher `origine` **partout où un montant de provision est rendu**, y compris **sur les totaux**.
2. Afficher `methodeServie.statut` **avec le montant**, jamais dans un panneau replié ni dans une
   info-bulle : une réserve que personne n'ouvre ne réserve rien.
3. Afficher `methodeServie.miseEnGarde` **avec la donnée**, sur le même patron que la `miseEnGarde`
   du référentiel (STORY-511) — elle voyage avec le chiffre, pas à côté.
4. Sur l'écran de saisie, consommer `…/provisions-techniques/methodes` pour dire, **avant** la
   saisie, que le module ne propose aucun montant pour ce type, et **pourquoi**.
5. Ajouter les trois champs de validation au formulaire, groupés, avec les trois refus traités.

## Ce qui n'est PAS demandé

- ⛔ Recalculer, estimer ou suggérer un montant côté front pour un type `SAISIE` : ce serait
  reconstituer au navigateur exactement ce que le backend refuse de faire.
- ⛔ Traduire les motifs en « il faut un actuaire » (voir ci-dessus).
- ⛔ Toucher au statut du référentiel `cima-assurances`, qui a sa propre route et sa propre story
  (STORY-540).
