# STORY-510 : Ratios prudentiels — capitalisation, liquidité, limitation des risques

Status: in_progress

**Complexité :** high
**Épic :** EPIC-127 — États périodiques et ratios prudentiels BCEAO
**Service :** `bilan-service` — ⚠️ **et non `microfinance-service`** (D-510-A, arbitrage user du 2026-09-19)
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-498** (le paquet prudentiel) · **STORY-508** (les engagements) · **STORY-659** (les
seuils transcrits) · **STORY-509** (les états DIMF et leur mécanique de concordance)
**Assigné :** `vivianMoneyVibesGroupes`
**Origine :** découpage `epics-microfinance-2026-08-27.md`, spine AD-10.

---

## Le fait

Les ratios prudentiels ne sont **pas** les indicateurs de portefeuille de STORY-506. Le PAR est un
outil de **pilotage** ; un ratio prudentiel est une **norme opposable** : le franchir met
l'institution en situation d'infraction, et la Commission Bancaire le constate.

L'ébauche d'épic disait qu'ils se calculent « à partir de trois matières que le module possède
déjà ». **La mesure du 2026-09-19 dit le contraire, et c'est la décision structurante de cette
story** : les assiettes que l'Instruction n°010-08-2010 écrit ne sont pas faites de crédits, elles
sont faites de **postes de balance** — `A12`, `B2D`, `L01`, `G10`, `D1E`. Le portefeuille n'en
fournit qu'une part.

## Cadrage mesuré avant de coder (2026-09-19)

Texte source relu intégralement : *Recueil des textes légaux et réglementaires régissant les SFD de
l'UMOA* (BCEAO, 176 p., sha256 `23ac4caa…a8fba844` **vérifié**), annexes I à IX de l'Instruction
n°010-08-2010, pages imprimées 95-112. Pages contrôlées **en image** là où l'extraction pouvait
mentir.

| Mesure | État constaté | Conséquence pour STORY-510 |
|---|---|---|
| Nature des assiettes | Listes de **postes du RCSFD** avec leur libellé verbatim, jamais des comptes du plan ni des crédits | Une assiette est une liste de termes `{poste, signe}`, résolue comme la concordance DIMF |
| Où vivent ces postes | 17 des 20 postes témoins figurent dans `etats-dimf-sfd-bceao@1.0` (382 postes distincts), packagé dans `bilan-service` | Le moteur se chaîne sur STORY-509, dans `bilan-service` |
| Ce que `microfinance-service` détient | Portefeuille, dépôts, parts sociales, membres, engagements, arrêtés de provision. **Aucun grand livre** ; sa contribution canonique est partielle par décision D-507-D (« ni parts sociales, ni dépôts, ni décaissements, ni trésorerie ») | Le service du sprint ne peut pas porter le calcul sans ingérer une balance qu'il ne possède pas |
| Seuils | Les 11 seuils sont déjà transcrits et sourcés dans `prudentiel-sfd-bceao@1.1` et `@1.2` (STORY-659) | Rien à retranscrire : seules les **assiettes** manquent |
| Fonds propres | Le texte donne **cinq fois la même liste**, mot pour mot : 15 postes ajoutés, 7 déduits. Sert aux annexes III, IV, VIII, IX | Une assiette nommée, définie une fois, citée par quatre ratios |
| `L70` / `L80` | Cités **des deux côtés** de cette liste : ajoutés si positifs, déduits si négatifs | Le **signe du solde** décide du côté — jamais le code, sous peine de double comptage |
| Agrégat « risques portés par une institution » | Même intitulé, **deux compositions** : annexe I = 13 postes (dont `A2A`), annexe VI = 12 (sans `A2A`). Confirmé en image, l. 200 et 636 du texte brut | Deux assiettes distinctes, jamais mutualisées |
| Annexes III, IV, VI (numérateurs) | « *obtenu à partir des tableaux annexés aux états financiers* » — **aucun compte, aucun poste** | Donnée déclarative : non dérivable d'une balance |
| Annexe VIII (dénominateur) | « **Total actif de fin de période en montants nets (B)** », puis le texte s'arrête. Et `E90 TOTAL DE L'ACTIF` porte **0 terme de concordance** dans l'artefact DIMF (STORY-509 : aucun total supposé) | Le dénominateur de la capitalisation n'existe nulle part — il ne sera pas fabriqué |
| Annexes II et V | L'assiette est la **fraction de durée résiduelle** (> 12 mois ; ≤ 3 mois), pas le solde du poste — et certaines lignes sont écrites **sans** qualificatif de durée | Aucune balance ne porte de ventilation par durée résiduelle |
| Postes hors bilan | Les annexes I, V et VI citent `N1A`, `N1J`, `N2A`, `N2J`, `N3A`, `Q1A`, `N1H`, `N1K`, `N2H`, `N2M`. L'artefact DIMF n'en porte **aucun** (préfixes présents : A…H, K, L, R, S, T, V, W, X) | La part hors bilan des trois ratios est hors d'atteinte ici |
| Annexe VII | Ni « Numérateur », ni « Dénominateur », ni `A/B x 100` : une **base** (`L80` + report déficitaire `L70`) et un **taux** (15 % minimum) | Ce n'est pas un ratio, et le produit ne le présentera pas comme tel |
| Liquidité | **Un seul** numérateur, **un seul** dénominateur, **trois** normes selon la catégorie du SFD (100 / 80 / 60 %) | Une assiette, trois seuils — et la catégorie n'est déclarée nulle part dans le produit |
| Entrée en vigueur | « *Elle entre en vigueur le 30 août 2010* » (art. 6, verbatim) | La date d'applicabilité du paquet est écrite, pas supposée |

## Décisions de cadrage du 2026-09-19 — à relire en revue

- **D-510-A — le moteur vit dans `bilan-service`.** Décision user du 2026-09-19, sur mesure et non
  sur intuition : les assiettes sont des postes de balance, et `microfinance-service` ne tient aucun
  grand livre. C'est le **même arbitrage que STORY-509**, dans le **même épic** — l'y placer aurait
  obligé à ingérer une balance étrangère (contre l'invariant « une base Mongo par service ») ou à
  publier presque tout en `INDETERMINABLE`. `sprint-status.yaml` est corrigé en conséquence.
- **D-510-B — les assiettes entrent au paquet prudentiel, en version `1.3`.** ⛔ Aucun seuil, aucun
  poste, aucun signe, aucune quotité dans le code. Les versions `1.0`, `1.1` et `1.2` restent
  packagées **aux octets** ; la `1.3` reprend les rubriques de provisionnement et de déclassement de
  la `1.2` sans y toucher et ajoute la seule rubrique `ratios.assiettes`. La `1.3` est packagée dans
  `bilan-service` ; `microfinance-service` **reste sur la `1.2`** et n'est pas modifié par cette story.
- **D-510-C — une assiette est une liste de termes `{poste, signe, source}`.** Elle se résout par la
  mécanique de concordance déjà livrée (rattachement d'un solde au **plus long préfixe cité**), qui
  n'est pas recopiée mais réutilisée. Chaque terme porte sa source ; un terme sans source est refusé
  par le validateur.
- **D-510-D — deux assiettes pour « risques portés par une institution ».** `RISQUES_ANNEXE_I`
  (13 postes) et `RISQUES_ANNEXE_VI` (12, sans `A2A`). Le texte les donne sous le **même** intitulé
  avec deux compositions ; les mutualiser élargirait un dénominateur réglementaire et rendrait
  **conforme à tort** un SFD qui ne l'est pas.
- **D-510-E — `L70` et `L80` sont pris d'un seul côté, décidé par le signe du solde.** La liste des
  fonds propres les cite en ajout (report/résultat positif) **et** en déduction (négatif). Les sommer
  des deux côtés compte deux fois un report déficitaire. ⚡ Même famille de faute que le signe de
  concordance appliqué en multiplicateur de STORY-509 : le signe se lit, il ne se rejoue pas.
- **D-510-F — ce que le texte ne donne pas n'est pas fabriqué.** Quatre lacunes, portées par
  l'artefact et publiées telles quelles, chacune avec un motif qui la **nomme** :
  `NUMERATEUR_DECLARATIF_HORS_BALANCE` (annexes III, IV, VI) ·
  `TOTAL_ACTIF_SANS_FORMULE` (annexe VIII) ·
  `VENTILATION_PAR_DUREE_RESIDUELLE_ABSENTE` (annexes II, V) ·
  `POSTES_HORS_BILAN_ABSENTS_DE_L_ARTEFACT` (annexes I, V, VI).
- **D-510-G — l'annexe VII est une norme de dotation, pas un ratio.** Elle est transcrite comme
  telle (base + taux) et **n'est pas évaluée** : le verdict exigerait la dotation réellement
  constatée, que cette story ne détient pas. ⛔ La convention de signe du report déficitaire
  (« + Report à nouveau déficitaire » dans la formule, « après **imputation** » dans le chapeau)
  **n'est écrite nulle part dans l'instruction** : elle n'est pas tranchée ici, elle est consignée.
- **D-510-H — une assiette de liquidité, trois seuils, aucune catégorie déclarée.** Le ratio est
  calculé et publié avec ses deux termes et **les trois seuils candidats**, verdict
  `INDETERMINABLE`, motif `CATEGORIE_PRUDENTIELLE_NON_DECLAREE`. ⛔ La catégorie ne se **dérive
  jamais** des données (un SFD sans dépôt enregistré n'est pas un SFD « qui ne collecte pas de
  dépôts ») et ne se prend **jamais** en paramètre de requête : laisser l'appelant choisir son seuil
  est un trou de conformité, pas une commodité. Sa déclaration est un **hook inerte documenté**.
- **D-510-I — signalé, jamais corrigé.** Un dépassement produit un verdict `NON_CONFORME` et rien
  d'autre : aucune mesure de redressement, aucune écriture, aucun événement. Le produit constate.
- **D-510-J — le rejeu se fait sur la version applicable à la date.** La `1.3` porte
  `_meta.applicableDepuis: "2010-08-30"`, verbatim de l'article 6. Une date d'arrêté antérieure à
  toute version applicable rend `INDETERMINABLE` / `AUCUN_PAQUET_APPLICABLE_A_CETTE_DATE` — jamais un
  verdict. Une version sans `applicableDepuis` (les `1.0` à `1.2`) n'est **pas** sélectionnable par
  date : l'absence ne vaut pas « depuis toujours ».
- **D-510-K — un verdict porte toujours de quoi le refaire à la main.** Chaque ratio publie son
  numérateur et son dénominateur **avec le détail de leurs termes** (poste, libellé, signe, solde
  retenu), le seuil, l'opérateur, la valeur et la source. Un ratio sans ses deux termes n'est pas
  vérifiable — même exigence que « chaque écriture porte sa formule » du moteur fiscal.

## Périmètre

### Livré

- Le paquet prudentiel `prudentiel-sfd-bceao@1.3` : rubrique `ratios.assiettes` (les 11 normes, leurs
  assiettes en postes, l'assiette commune des fonds propres, les conditions d'applicabilité, les
  lacunes du texte marquées), sources verbatim, `applicableDepuis`, packagé dans `bilan-service`.
- Le schéma JSON et la règle de validation **P5** correspondante, avec le script de validation.
- Le moteur de ratios : résolution d'une assiette en postes, somme signée, quotient × 100, comparaison
  au seuil, verdict, ou `INDETERMINABLE` + motif nommé.
- La restitution de chaque ratio avec ses deux termes détaillés, son seuil, sa source et le
  `{code, version, checksum}` du paquet qui l'a produit.
- Le rejeu à une date d'arrêté passée sur la version applicable à cette date.

### Hors périmètre

- Toute **écriture** : ni collection, ni événement Kafka, ni dotation, ni mesure de redressement (D-510-I).
- La **déclaration de la catégorie prudentielle** du SFD — hook inerte documenté (D-510-H).
- Les **données déclaratives** des annexes III, IV et VI, et le **total de l'actif** de l'annexe VIII :
  elles n'existent dans aucun artefact et ne seront pas inventées (D-510-F).
- La **ventilation par durée résiduelle** des postes (annexes II et V).
- Les **postes hors bilan** `N*` / `Q*` : ils supposeraient d'étendre `etats-dimf-sfd-bceao@1.0`,
  ce que cette story ne fait pas.
- La **convention de signe** du report déficitaire de l'annexe VII (D-510-G).
- Le **12ᵉ ratio** de l'Instruction n°016-12-2010 (financement des immobilisations, ≤ 100 %) : autre
  texte, hors de l'Instruction n°010-08-2010.
- `microfinance-service` n'est **pas** modifié ; aucune republication de `sfd-bceao@2.0` ni de
  `etats-dimf-sfd-bceao@1.0`.

## Critères d'acceptation

- [ ] **AC-1 — Tout vient du paquet.** Les ratios, leurs **assiettes** et leurs **seuils** viennent
      **intégralement du paquet prudentiel**. ⛔ Aucun seuil, aucun poste, aucun signe dans le code.
      Test de mutation : changer un seuil **ou un poste d'assiette** au paquet doit changer le verdict.
- [ ] **AC-2 — Un ratio porte ses deux termes.** Chaque ratio est rendu avec son **numérateur**, son
      **dénominateur**, son **seuil** et son **verdict**, numérateur et dénominateur détaillés terme
      par terme (poste, libellé, signe, solde retenu) et exactement recomposables (D-510-K).
- [ ] **AC-3 — Non calculable ⇒ `INDETERMINABLE`.** Un ratio dont une donnée manque rend le statut
      `INDETERMINABLE` avec un **motif qui nomme la lacune**, **jamais zéro et jamais un verdict**.
      ⚡ 4ᵉ occurrence du patron : un booléen de conformité se lit toujours avec son statut. La part
      calculable est publiée quand même — un numérateur connu et un dénominateur absent se disent.
- [ ] **AC-4 — Signalé, jamais corrigé.** Un dépassement de seuil est signalé et rien d'autre : le
      produit constate, il ne décide d'aucune mesure de redressement et n'écrit rien.
- [ ] **AC-5 — Rejeu daté.** Les ratios se rejouent à une date d'arrêté passée avec la **version du
      paquet applicable alors**, publiée avec son checksum. Un seuil révisé en 2026 ne rend pas non
      conforme un arrêté 2024 ; une date antérieure à toute version applicable rend `INDETERMINABLE`.
- [ ] **AC-6 — Les deux compositions de « risques » restent distinctes.** Le dénominateur de
      l'annexe VI ne contient pas `A2A` ; celui de l'annexe I le contient. Un test vire au rouge si
      les deux assiettes sont mutualisées (D-510-D).
- [ ] **AC-7 — `L70` / `L80` comptés une seule fois.** Un report à nouveau déficitaire est **déduit**
      des fonds propres, jamais ajouté puis déduit. Un test mesure les fonds propres d'un jeu où
      `L70 < 0` et `L80 < 0` et rougit au moindre double comptage (D-510-E).
- [ ] **AC-8 — L'annexe VII n'est pas présentée comme un ratio.** Elle est publiée comme norme de
      dotation (base, taux), sans verdict, avec le motif qui dit pourquoi (D-510-G). Un test vérifie
      qu'aucune route ne lui rend un `numerateur`/`denominateur`.

## Table de mutations obligatoire

| ID | Mutation réellement appliquée | Test qui doit virer au rouge |
|---|---|---|
| M1 | Écrire un seuil en dur dans le code au lieu de le lire au paquet | Paquet fictif à seuil modifié ⇒ verdict inversé |
| M2 | Ajouter/retirer un poste d'une assiette dans le code plutôt qu'au paquet | Paquet fictif à assiette modifiée ⇒ numérateur exact différent |
| M3 | Ajouter `A2A` à l'assiette de l'annexe VI (mutualiser I et VI) | AC-6 : les deux dénominateurs diffèrent exactement d'`A2A` |
| M4 | Sommer `L70`/`L80` en ajout **et** en déduction | AC-7 : fonds propres d'un jeu déficitaire |
| M5 | Ignorer le signe du terme (`-` traité comme `+`) | Fonds propres : les 7 déductions retranchent réellement |
| M6 | Rendre `0` au lieu d'`INDETERMINABLE` quand le dénominateur manque | AC-3 : statut + motif, jamais une valeur |
| M7 | Fabriquer le total de l'actif par somme des postes A…D | AC-3 : capitalisation `INDETERMINABLE` / `TOTAL_ACTIF_SANS_FORMULE` |
| M8 | Rendre un verdict de liquidité en choisissant un des trois seuils | AC-3 + D-510-H : `CATEGORIE_PRUDENTIELLE_NON_DECLAREE` et 3 seuils publiés |
| M9 | Accepter la catégorie prudentielle en paramètre de requête | Aucune route n'expose ce paramètre ; le DTO le refuse |
| M10 | Sélectionner une version de paquet sans `applicableDepuis` par date | AC-5 : `AUCUN_PAQUET_APPLICABLE_A_CETTE_DATE` |
| M11 | Servir la `1.3` en ignorant le checksum, ou modifier un octet de la `1.2` | Checksum vérifié au chargement ; `1.0`/`1.1`/`1.2` octets inchangés |
| M12 | Retirer la `source` d'un terme d'assiette dans l'artefact | Règle **P5** du validateur : source exigée par terme |
| M13 | Publier l'annexe VII avec un numérateur/dénominateur et un verdict | AC-8 |
| M14 | Additionner en `number` sans garde d'entier sûr | Refus hors entier sûr sur une somme de postes |

## Definition of Done

- [ ] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [ ] `sprint-status.yaml` corrigé : `service: bilan-service` (D-510-A), avec la raison datée.
- [ ] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts ; chaque fichier neuf couvert.
- [ ] M1 à M14 appliquées une par une, prouvées rouges par assertion, puis restaurées.
- [ ] Artefact `1.3` validé par son script, checksum recalculé et publié ; `1.0`/`1.1`/`1.2` octets inchangés.
- [ ] Vérification docker réelle sur l'état final, après les revues.
- [ ] Revue de code et revue de sécurité sans constat ouvert.
- [ ] Branche `MNV-510`, commit français, PR vers `dev` ; PR docs vers `main` ; rebase-merge, branches supprimées.
- [ ] `docs/referentiels/README-prudentiel-sfd-bceao.md` étendu : provenance des assiettes, pages, lacunes.

## Progress Tracking

- **Statut courant :** `in_progress` — ouverte le 2026-09-19.
- **2026-09-19 — cadrage mesuré :** branches `MNV-510` créées depuis `main` pour `docs/` et depuis
  `dev` pour `bilan-service`, rebasées sur leur origine. Texte officiel retéléchargé et **empreinte
  vérifiée** (`23ac4caa…`), annexes I à IX transcrites, pages sensibles relues **en image**. La
  mesure a déplacé la story de `microfinance-service` vers `bilan-service` (D-510-A, arbitrage user)
  et a révélé six pièges du texte lui-même : deux compositions pour un même agrégat, `L70`/`L80` des
  deux côtés des fonds propres, trois numérateurs déclaratifs, un dénominateur sans formule, des
  assiettes en durée résiduelle, une annexe qui n'est pas un ratio. Base de non-régression relevée
  avant toute écriture.

## Notes

- Source : Instruction n°010-08-2010 du 30 août 2010, annexes I à IX, dans le *Recueil des textes
  légaux et réglementaires régissant les SFD de l'UMOA* (BCEAO, 176 p., sha256 `23ac4caa…a8fba844`),
  pages imprimées 95-112. Décalage page PDF = page imprimée + 2.
- Voir [[STORY-498]], [[STORY-503]], [[STORY-506]] (le pilotage, qui est autre chose), [[STORY-508]],
  [[STORY-509]] (les états DIMF, dont cette story reprend la mécanique de concordance), [[STORY-659]]
  (les seuils), et la spine `architecture-microfinance-service-2026-08-27` (AD-10).
