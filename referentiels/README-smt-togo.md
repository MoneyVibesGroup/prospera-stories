# Référentiel `smt-togo@1.0` — Système Minimal de Trésorerie (SYSCOHADA révisé)

**Packagé le 2026-09-09 (STORY-494).** Il était **déclaré et non packagé** depuis la décision
**D-078-3** (« le packager reviendrait à inventer du comptable », STORY-078). Deux choses ont changé :
le produit a construit **toute une chaîne de saisie destinée à cette persona** — cahiers de recettes et
de dépenses, OCR, rattachement au plan, catégories — qui débouchait sur un `409` ; et il sait désormais
packager sans inventer, trois artefacts sourcés l'ayant prouvé.

**Nature :** le SMT n'est **pas un référentiel comptable distinct**. C'est un **régime de présentation
allégé** de l'AUDCIF, destiné aux très petites entités, **tenu sur le plan de comptes normalisé
SYSCOHADA révisé**. C'est exactement la situation de `zone-franche-togo@1.0`, qui réutilise lui aussi
les sources SYSCOHADA : ce qui change est la **liasse**, pas le plan.

## Sources

| Pièce du paquet | Source | Statut |
|---|---|---|
| **Plan de comptes** (174 comptes) | `plan-comptable-syscohada.json` — plan comptable normalisé AUDCIF 2017, **réutilisé sans modification** | hérité, à valider expert (comme SYSCOHADA) |
| **Postes** (28, 3 états) | `postes-smt-togo.json` — extraction du formulaire officiel `LIASSE SYSCOHADA REVISE- SMT-Réf 24-01-19.xlsx` (feuilles BILAN / COMPTE DE RESULTAT / TABLE DES CODES), fournie le 2026-07-19 | **amorce** — accents restaurés (l'extraction les avait perdus) |
| **Table de passage** (28 règles) | construite sur les **préfixes de comptes de `table-de-passage-syscohada.json`**, agrégés aux lignes plus grossières du formulaire SMT | **amorce** — à valider expert |
| **Notes annexes** | **non packagées** | le formulaire en prévoit 4 ; hors périmètre de STORY-494 |
| **Paquet fiscal** | **aucun** | résolu `pays × année`, orthogonal au plan |

⚠️ **Le classeur `.xlsx` n'est PAS au dépôt** — seule son extraction JSON l'est. La fiche de STORY-494
l'affirmait et c'était faux ; c'est corrigé là-bas.

## Ce qui n'est pas sourcé, et qui est donc déclaré absent

- **Les 4 notes annexes du formulaire** (immobilisations, stocks, clients/créances/dettes, détail des
  recettes et dépenses). L'état des notes rend `NON_APPLICABLE`, **onglet visible**.
- **Aucun marqueur de chiffre d'affaires.** Le formulaire sépare « Recettes sur ventes » et « Recettes
  sur prestations de services », et leur total (`CRA`) inclut les autres recettes : **aucune des trois
  lignes n'est le chiffre d'affaires**. En marquer une le publierait faux.
  ⇒ **Conséquence** : la liquidation TPU d'un dossier SMT répond `CA_NON_SOURCE` — un refus explicite,
  jamais un CA nul. À ouvrir en story, la persona SMT étant précisément la persona TPU.
- **Un seul préfixe ne vient pas de la table SYSCOHADA** : `622` (Locations et charges locatives), qui
  alimente « Dépenses sur loyers ». Il vient du **plan de comptes** SYSCOHADA révisé, pas de la table
  packagée — laquelle s'arrête à `62`. Le compte reste reconnu à la saisie.

## Le gabarit d'états, et ses trois cases vides

Le formulaire SMT est une comptabilité de **trésorerie** : `RÉSULTAT = Recettes − Dépenses ± variations
de stocks, de créances et de dettes − amortissements`.

⚠️ **Les trois lignes de variation (`CRD`/`CRE`/`CRF`) sont NOMMÉES et VIDES**, délibérément. Elles sont
**sans objet sur une balance SYSCOHADA**, qui est tenue en **engagements** : les variations y sont déjà
portées par les comptes `603x` (côté dépenses) et `73` (côté recettes). Les valoriser une seconde fois
les compterait **deux fois**. Les supprimer aurait **tronqué le formulaire officiel** ; on les nomme,
vides, plutôt que de les retirer ou de les remplir d'un chiffre faux.

## Ce que le SMT ne prévoit pas

Aucun **tableau des flux de trésorerie**, aucune note packagée. Ces états rendent `NON_APPLICABLE` avec
`coherent: true` et l'onglet **reste visible** — même mécanisme que `sfd-bceao`, sans une ligne de code
spécifique au SMT (invariant P7). Un onglet qui disparaît est pire qu'un onglet vide.

## Comptes hors formulaire

`50` (titres de placement) et `51` (valeurs à encaisser) n'ont pas de ligne propre au SMT et sont
rattachés à **`AC5` « Banque (+/‑) »**, la ligne de trésorerie du formulaire — classement conforme à
SYSCOHADA, qui range `BQ` et `BR` en trésorerie-actif.

⛔ **Ce rattachement est un correctif de revue de code, et il n'est pas cosmétique.** Laissés hors
table, ces deux comptes produisaient, sur une balance **parfaitement équilibrée**, une liasse
**non validable** : `balance-service` acceptait la balance (`51` est dans le plan packagé) et
`bilan-service` la refusait en aval (`EQUILIBRE_BILAN` en anomalie, écart égal au solde du compte). Un
chèque remis à l'encaissement suffisait — le cas le plus ordinaire d'une boutique.

## Statut

`meta.statut = 'a-valider-par-expert'` (vocabulaire de STORY-491), publié sur le tampon de référentiel
effectif des routes de production. La transcription du gabarit et surtout la **table de passage**
doivent être relues par un expert-comptable avant tout usage réglementaire.

Voir `stories/STORY-494.md` (décisions de sourcing, vérification docker), `stories/STORY-078.md`
(D-078-3) et `README.md` de ce dossier.
