# Normes prudentielles des SFD de l'UMOA — provenance (STORY-510)

Artefact servi : `bilan-service/src/modules/bilan/referentiel/assets/ratios-prudentiels-sfd-bceao-1.0.json`
(`ratios-prudentiels-sfd-bceao@1.0`, statut **`a-valider-par-expert`**, sha256
`ea097779…bbe49f76f`) : les **assiettes** des 11 normes de l'Instruction n°010-08-2010, leurs seuils, leurs
conditions d'applicabilité, et les **lacunes du texte** nommées une par une.

⚠️ **Ne pas confondre avec `prudentiel-sfd-bceao@1.2`** (packagé dans `microfinance-service`), qui transcrit
le **provisionnement** des crédits en souffrance du RCSFD (compte 29). Deux textes, deux artefacts, deux
rythmes de révision — même doctrine que `etats-dimf-sfd-bceao@1.0`. Les 11 seuils figurent dans les deux :
**c'est celui-ci qui fait foi pour un ratio**, et ceux de `prudentiel-sfd-bceao` ne sont lus par aucun code.

## Source — relevée le 2026-09-19

| Texte | Où | Empreinte sha256 du PDF téléchargé |
|---|---|---|
| **Instruction n°010-08-2010 du 30 août 2010** relative aux règles prudentielles applicables aux SFD de l'UMOA, **annexes I à IX** — dans le *Recueil des textes légaux et réglementaires régissant les SFD de l'UMOA* (BCEAO, 176 p., édition de décembre 2011) | [bceao.int — PDF](https://www.bceao.int/sites/default/files/2017-11/-recueil-des-textes-legaux-et-reglementaires-regissant-les-sfd-de-lumoa.pdf), pages imprimées **95-112** | `23ac4caa4fe5255753fae8d5ed3db5a5fec9a97b679621453f163f63a8fba844` |

**Décalage de pagination : page PDF = page imprimée + 2.** Le texte est extractible (`pdftotext -layout`) —
le piège de la police sans table Unicode ne vaut que pour le fascicule du RCSFD. Les pages sensibles
(PDF 97, 98, 106-111, 117) ont tout de même été **rendues en image** (`pdftoppm -r 150/220`) et relues :
sur toutes, le texte extrait est conforme au rendu.

Entrée en vigueur, verbatim (article 6) : « *Elle entre en vigueur le 30 août 2010* ». C'est la valeur de
`_meta.applicableDepuis`, et le chargeur exige qu'elle coïncide avec celle du manifeste.

## Ce que dit le texte — et ce qu'il ne dit pas

Les assiettes sont écrites en **postes du RCSFD** (`A12`, `B2D`, `L01`, `G10`, `D1E`), jamais en comptes.
Sur les **79 postes cités**, **69 existent** dans `etats-dimf-sfd-bceao@1.0` et les **10 absents sont
exactement les postes hors bilan** (`N1A`, `N1H`, `N1J`, `N1K`, `N2A`, `N2H`, `N2J`, `N2M`, `N3A`, `Q1A`).
Le générateur **confronte** chaque poste à l'artefact d'états : un poste mal recopié ne « vaut pas zéro », il
n'existe pas.

⛔ **Aucune des 11 normes n'est intégralement calculable depuis une balance, et c'est le texte qui le veut.**
Sept lacunes, chacune portée par l'artefact et publiée avec son motif :

| Motif | Où | Ce que le texte écrit |
|---|---|---|
| `ASSIETTE_DECLARATIVE_HORS_BALANCE` | numérateurs des annexes III, IV, VI | « *obtenu à partir des tableaux annexés aux états financiers* » — aucun compte, aucun poste |
| `TOTAL_ACTIF_SANS_FORMULE` | dénominateur de l'annexe VIII | « **Total actif de fin de période en montants nets (B)** », puis le texte s'arrête. Et `E90 TOTAL DE L'ACTIF` porte lui-même 0 terme de concordance |
| `VENTILATION_PAR_DUREE_RESIDUELLE_ABSENTE` | annexes II et V | « *la notion de durée résiduelle ou durée restant à courir* » — qu'aucune balance ne ventile |
| `POSTE_HORS_ARTEFACT_D_ETATS` | annexes I, V, VI | les 10 postes hors bilan, transcrits dans aucun artefact d'états |
| `CATEGORIE_PRUDENTIELLE_NON_DECLAREE` | annexe V | **une** assiette, **trois** seuils (100 / 80 / 60 %) selon la catégorie du SFD, que le produit ne déclare nulle part |
| `DOTATION_CONSTATEE_ABSENTE` | annexe VII | ce n'est pas un ratio : une **base** et un **taux**, et le verdict exigerait la dotation réellement constatée |
| `CONVENTION_DE_SIGNE_NON_ECRITE` | annexe VII | voir D-510-G ci-dessous |

## Décisions de transcription (à relire par le praticien)

- **D-510-D — deux assiettes pour « risques portés par une institution ».** Le texte donne **le même
  intitulé** — « risques portés par une institution … Montants nets des provisions et des dépôts de
  garantie » — à **deux compositions** : **13 postes** à l'annexe I (dont `A2A`), **12** à l'annexe VI (sans
  `A2A`). Vérifié en image page PDF 109. Les mutualiser élargirait un dénominateur réglementaire et rendrait
  **conforme à tort** un SFD qui dépasse la norme.
- **D-510-E — `L70` et `L80` sont cités des DEUX côtés des fonds propres.** « Report à nouveau positif » et
  « Résultat positif » en ajout, « Report à nouveau négatif » et « Résultat déficitaire » en déduction, sous
  le même numéro de poste. C'est le **signe du solde** qui décide du côté ; les sommer des deux côtés
  compterait deux fois un report déficitaire.
- **D-510-G — la convention de signe de l'annexe VII n'est PAS tranchée.** Le chapeau écrit « *après
  imputation de tout report à nouveau déficitaire éventuel* » ; la formule encadrée écrit « **Base :
  Résultat (L80) + Report à nouveau déficitaire (L70)** ». Les deux ne se réconcilient que si le report
  déficitaire est porté **négatif** — convention que l'instruction n'écrit nulle part. Écart mesuré : **400
  sur une base de 1 000** pour un report de −200, dans le sens qui **gonfle une dotation obligatoire**. Le
  moteur publie donc les termes et **refuse le total**.
- **D-510-H — la catégorie prudentielle ne se dérive pas et ne se choisit pas.** Un SFD sans dépôt
  enregistré n'est pas un « SFD qui ne collecte pas de dépôts » ; et laisser l'appelant désigner sa catégorie
  reviendrait à le laisser choisir son seuil. Le ratio de liquidité est **calculé et publié** avec ses deux
  termes, sans verdict, et sa déclaration reste un hook inerte.
- **L75 et E05 sont réservés à l'infra-annuel**, note de bas de page verbatim : « *Ces comptes ne seront
  utilisés que dans le cadre de la production des états financiers infra annuels.* » Un arrêté au
  31 décembre ne les retient pas — les retenir compterait le résultat deux fois.

## Réserves du texte lui-même, consignées sans être corrigées

- **Annexe V — engagements donnés au numérateur, reçus au dénominateur.** Économiquement contre-intuitif
  (un engagement donné est une sortie potentielle) ; vérifié **en image** pages PDF 107 et 108 : le texte
  officiel dit bien cela. Transcrit tel quel, jamais inversé d'autorité. À faire confirmer.
- **Annexe V — `B30`/`B40`** (crédits à moyen et long terme) figurent au numérateur d'un ratio à horizon de
  trois mois, sans qualificatif de durée sur ces deux lignes.
- **Annexe I — `G30` absent**, alors qu'il figure aux annexes II et V. Ni ajouté, ni commenté par le texte.
- **Annexe III — périmètre ambigu** : le titre vise les dirigeants, le personnel **et** les personnes liées ;
  le corps du numérateur n'écrit que « donnés **aux dirigeants** ». L'article 35 de la loi et l'article 20 du
  décret ne se réconcilient pas dans le recueil.
- **Annexe IX — base légale** : l'annexe cite l'article 36 de la loi, dont le texte imprimé ne mentionne ni
  les 25 %, ni les fonds propres.
- **Deux déductions de fonds propres sans poste** : le complément de provisions exigé par les Autorités de
  contrôle (donnée de supervision exogène) et les participations dans d'autres SFD ou établissements de
  crédit (exige le détail du sous-portefeuille).
- **Le plan de comptes du RCSFD n'est pas reproduit dans le recueil** : les codes de postes y sont cités
  sans être définis. Leur définition vient de `etats-dimf-sfd-bceao@1.0`.

## Hors de cet artefact

- Le **12ᵉ ratio** de l'Instruction n°016-12-2010 (financement des immobilisations et participations,
  ≤ 100 %) : autre texte, même définition de fonds propres — à packager séparément s'il est requis.
- La **périodicité de production** (mensuelle / trimestrielle selon que le SFD relève ou non de l'article 44)
  est dans le texte mais n'entre pas dans le calcul d'un ratio : elle relèvera de la story qui exposera les
  états.

## Ce qui reste avant `certifie`

1. Relecture de chaque assiette contre les pages citées par un **praticien SFD** nommé.
2. Confirmation des deux points contre-intuitifs de l'annexe V (sens des engagements, `B30`/`B40`).
3. Arbitrage de la convention de signe de l'annexe VII (D-510-G) — par une source, jamais par une supposition.
4. Décision sur la déclaration de la **catégorie prudentielle** du SFD, sans laquelle aucun ratio de
   liquidité n'a de verdict.
