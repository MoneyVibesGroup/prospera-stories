# Solvabilité CIMA — marge (art. 337) et représentation des engagements réglementés (art. 335)

Fiche de référence pour [[STORY-524]] et l'artefact `solvabilite-cima@1.0`. Elle **source** les
exigences, les taux, les plafonds, les planchers et les **bases** des deux contrôles que le Code
CIMA impose à un assureur.

> ⚠️ **Relevé le 2026-09-22** sur le texte officiel du Code CIMA (édition CODE CIMA 2019,
> cima-afrique.org, une page par article). Un texte réglementaire est republié sans préavis : un
> relecteur qui reprendrait ce relevé doit **recomparer**, et non se fier à cette page.

---

## 1. Deux contrôles, et ils n'ont pas la même base

| | Marge de solvabilité | Représentation des engagements réglementés |
|---|---|---|
| Articles | **337, 337-1 à 337-4** | **334, 335, 335-1 à 335-5** |
| Question | les fonds propres suffisent-ils au volume d'affaires ? | le passif provisionné est-il **couvert à l'actif** par des placements admis ? |
| Base | **rapport net/brut** de réassurance, avec plancher | **BRUTE** de réassurance (art. 334, dernier alinéa) |
| État de l'art. 433 | **C11**, gabarit `LIBRE` | **C4**, gabarit `IMPOSE` (139 lignes) |

⛔ **Se tromper de base est l'erreur classique, et le texte tranche lui-même** :

> **Art. 334, dernier alinéa** — « Les provisions techniques mentionnées au 1°) du présent
> article sont calculées, **sans déduction des réassurances cédées** à des entreprises agréées ou
> non […] »

La cession n'allège donc **pas** l'assiette de la représentation : elle apparaît à l'**actif**, et
l'art. 335-5 la borne. À l'inverse, les art. 337-2 et 337-3 intègrent explicitement la
réassurance, par un rapport net/brut. Le choix n'en est pas un : l'artefact le **déclare par
contrôle**, avec la valeur que le Code impose.

## 2. ⛔ Le titre de l'article 335-2 est FAUX dans le recueil officiel

Le `<title>` de la page annonce « entreprises visées au **2°)** de l'article 300 » — **mot pour
mot le titre de l'article 335-1**. Le corps de l'article dit « entreprises visées au **1°)** de
l'article 300 » et vise les **branches 20 à 23**, là où 335-1 vise les **branches 1 à 18**.

⇒ **La clé de sélection est la branche, jamais l'intitulé.** S'y fier applique les règles **vie** à
un assureur **non-vie**. Même motif qu'à [[STORY-510]] (« même intitulé, deux compositions ») et
[[STORY-509]] (« un document officiel qui présente le même état deux fois peut se contredire »).

Et l'art. 335-2 n'est pas une seconde liste : c'est **335-1 plus deux écarts** — le plafond du 6°)
ramené à **35 %**, et deux catégories en plus (avances sur contrats **30 %**, primes restant à
recouvrer **5 %**), rapportées aux **provisions mathématiques**.

## 3. Les six catégories de l'art. 335-1 — et les deux qui portent un MINIMUM

| # | Catégorie | Plafond | **Plancher** |
|---|---|---|---|
| **1°)** | obligations et valeurs d'États CIMA, organismes internationaux, collectivités, IFD | 50 % | **15 %** |
| 2°) | titres de créance, actions cotées, actions d'assureurs, parts de sociétés, OPCVM | 40 % | — |
| 3°) | droits réels immobiliers sur le territoire d'un État membre | 40 % | — |
| 4°) | prêts obtenus ou garantis par les États membres | 20 % | — |
| 5°) | prêts hypothécaires de 1er rang, prêts garantis par établissements de crédit | 10 % | — |
| **6°)** | comptes ouverts dans l'État de souscription, nets des dépôts de garantie | 40 % (**35 %** en vie) | **10 %** |

⚡⚡ **Un modèle « plafond / dépassement » publie `CONFORME` sur une insuffisance qui est une
infraction.** Une catégorie se contrôle dans **les deux sens**, et l'écart publié est **signé**.

⚠️ Le plancher du 6°) n'est pas instantanément opposable : un sinistre coûtant plus de **5 %** des
primes émises qui le fait passer sous 10 % ouvre une **régularisation sous trois mois**.

## 4. ⚡⚡ Quatre bases différentes — une seule aurait donné des dépassements faux

| Règle | Base |
|---|---|
| 335-1, 1°) → 6°) | montant total des **engagements réglementés** |
| 335-2 (avances, primes à recouvrer) | **provisions mathématiques** |
| 335-3 al. 1 | **provision pour risques en cours** |
| 335-3 al. 2 · 335-5 al. 2 | **provisions techniques des branches 4 à 7, 11 et 12** |
| 335-4 | engagements réglementés, mais **par émetteur / par immeuble** |

⇒ **« La somme des catégories égale le total » ne peut pas tenir** : 335-3 et 335-5 sont des
dérogations qui **se superposent** aux catégories de 335-1. Elles sont publiées **à part**.

## 5. La marge : deux termes, deux planchers, et un article sans population

**Marge disponible** (art. 337-1) — huit éléments, **après déduction** des pertes, des
amortissements sur commissions, des frais d'établissement et des autres incorporels. Deux verrous :
les titres subordonnés sont plafonnés à **50 %** de la marge (**25 %** à durée déterminée) — un
plafond **auto-référent** — et les plus-values latentes exigent « l'**accord de la Commission de
Contrôle** », donc une décision exogène qu'aucune balance ne porte.

**Marge à constituer** :

| Article | Agrément | Méthode | Plancher du rapport |
|---|---|---|---|
| **337-2** | dommages (br. 1-18) | **le plus élevé** de : 20 % des primes nettes d'annulations · 25 % du **tiers** de la charge moyenne **triennale** | **50 %** |
| **337-3** | vie (br. 20-23) | 5 % des provisions des **1° et 3°** de l'art. 334-2, brutes de cessions | **85 %** |
| **337-4** | sociétés mixtes | somme des deux | — |

⛔ **Les deux planchers diffèrent** : une constante unique dans le code se tromperait sur l'un des
deux.
⛔ **Le minimum est LE PLUS ÉLEVÉ des deux méthodes** : une seule méthode calculable ne borne rien.
⛔ **L'art. 337-3 ne prend que les postes 1° et 3°** de l'art. 334-2 — pas la participation aux
excédents, pas le risque d'exigibilité. Prendre « toutes les provisions vie » surestime la marge.
⛔ **L'art. 337-4 est un article sans population** : il renvoie au dernier alinéa de l'art. 326,
qui ouvrait un délai de **trois ans** aux sociétés pratiquant les deux activités « à la date
d'application du présent Code ». Le Code s'applique depuis 1995. Une balance
`INCOMPATIBLE_ART_326` ne reçoit donc **pas** la somme des deux marges — elle reçoit l'absence de
verdict et ce motif.

## 6. ⛔⛔ Ce que le plan packagé ne permet PAS — et c'est le livrable

Sur `cima-assurances@5.0`, **aucun des 17 contrôles ne rend de verdict**. Ce n'est pas un défaut de
transcription : c'est le **grain du plan**, qui s'arrête au 2ᵉ chiffre en classes 1, 2 et 5.

> ⚠️ La story pensait que le poste `CA1` était en cause. Il ne l'est pas : **l'art. 431 ventile
> déjà les placements**, et il le fait avec le vocabulaire même de la représentation — compte
> **23** « Valeurs mobilières et titres assimilés *(affectables à la représentation)* », **24**
> idem, **51** « Prêts *non* affectables à la représentation ». `CA1` est un poste d'**état**, pas
> une racine de plan.

Ce qui bloque réellement :

| Ce qui manque | Contrôles touchés |
|---|---|
| le compte **23** porte les catégories **1°) et 2°)** (plafonds 50 % et 40 %, et un plancher d'un côté) ; le **24** porte les **4°) et 5°)** (20 % et 10 %) | 5 |
| 3 des 4 composantes des **engagements réglementés** n'ont aucun compte propre : créances privilégiées, dépôts de garantie des agents et assurés, provision de prévoyance | 10 |
| l'art. 335-4 raisonne **par émetteur** et **par immeuble** — axe absent de toute balance | 3 |
| « trois mois de date », « un an de date » : le compte **41** n'a pas d'axe d'**antériorité** | 2 |
| les **branches** 4 à 7, 11 et 12 — le plan n'a aucun axe de branche | 2 |
| les postes **1° et 3°** de l'art. 334-2, agrégés dans le compte **31** | 2 |
| la **localisation** de l'établissement dans l'État de souscription (6°) | 1 |

⇒ **C'est un résultat, pas un échec.** La table dit exactement ce qu'un plan affiné
([[STORY-671]]) devrait isoler. *Un verdict rendu sur une assiette amputée serait faux dans le
sens qui rassure.*

## 7. ⚠️ Le rattachement se fait par NUMÉRO, jamais par libellé

Il serait tentant de dériver l'admissibilité d'un actif en lisant « (affectables à la
représentation) » dans le libellé du compte. **C'est un piège** : `README-cima-assurances.md`
mesure que **26 des 79 libellés packagés sont abrégés**, et que plusieurs perdent la restriction
« dans le pays concerné » — rétablissement planifié en [[STORY-671]].

Un verdict réglementaire adossé à un libellé changerait ce jour-là, **sans que rien ne le lève**.
Le rattachement compte → catégorie se **déclare dans l'artefact, par numéro**, sourcé article par
article. C'est la porte qui vaut le générateur.

⚠️ Et un numéro ne qualifie rien **hors de son plan** : `syscohada-revise@2.1` déclare les mêmes
numéros à deux chiffres. Le pont ne part que du paquet CIMA, et le générateur vérifie que le plan
porte les comptes propres à l'assurance — jamais `meta.code`, qui cesserait de garder le jour où
un référentiel se renomme ([[STORY-521]]).

## 8. L'artefact

`solvabilite-cima@1.0` — `sha256 41c2b17f89c6727a9c8f40e5f909e2e8cfdda7c03aa0da541be19743703a2f48`

- **Généré par** `bilan-service/scripts/referentiels/build-solvabilite-cima.mjs` depuis
  `sources/solvabilite-cima.json` (source de vérité des octets).
- **17 contrôles, 19 assiettes, 8 termes, 26 éléments sans compte**, 14 documents sourcés avec
  leur sha256.
- **Non recopié** dans les autres dépôts : aucun consommateur n'existe hors du moteur, et
  `ratios-prudentiels-sfd-bceao` ne l'est pas davantage. Recopier par symétrie créerait une
  empreinte à maintenir pour personne.
- **`applicableDepuis: 2016-04-08`** — ⚠️ ce n'est **pas** la date du Code, mais celle de la
  modification la plus récente des articles transcrits (art. 337-3, décision du 8 avril 2016). Un
  arrêté antérieur n'est jugé par **aucun** contrôle.

### Les portes du générateur

| Porte | Ce qu'elle empêche |
|---|---|
| tout compte déclaré existe dans `cima-assurances@5.0` | un compte mal recopié contribuerait **0** en silence |
| le paquet porte les comptes propres à l'assurance | appliquer des contrôles d'assureur à une balance SYSCOHADA |
| la règle de lecture est celle que **le plan** déclare | lire un solde créditeur à l'envers |
| toute borne figure dans son `formuleVerbatim` | un chiffre saisi à côté du texte qu'il prétend transcrire |
| un contrôle porte un plafond **ou** un plancher | un contrôle qui ne contrôle rien |
| les **six** catégories de l'art. 335-1, dans les deux sens | dispenser un assureur d'une limite qu'il doit respecter |
| les **trois** marges visent trois agréments distincts | une marge jamais servie |
| `LE_PLUS_ELEVE` exige ≥ 2 méthodes | une règle qui ment sur ce qu'elle fait |
| tout motif du vocabulaire est employé | une lacune qu'on croit couverte |
| aucun document, aucune assiette orpheline | du poids mort dans un artefact réglementaire |

## 9. ⚠️ Constat annexe — cinq comptes de gestion non routés

Mesuré en passant, **hors périmètre de STORY-524** : cinq comptes de gestion de
`cima-assurances@5.0` ne sont rattachés à **aucun poste** de la table de passage — `69`, **`73`**,
`74`, `78`, `79`.

Le **73 « Réductions et ristournes de primes »** est une **réduction de produit** : non routé, il
laisse les primes du **compte de résultat** surévaluées de leurs annulations. Le moteur de
solvabilité n'est pas affecté — il lit la **balance**, pas les états — mais la liasse CIMA l'est.
À traiter dans une story dédiée.

## 10. Ce que cet artefact ne couvre PAS

- **La localisation et la congruence** de l'art. 335 (territoire de souscription, quotité de 50 %
  dans les autres États membres) : le plan le rend *dicible* (`21` vs `28`), mais les libellés qui
  le portent attendent [[STORY-671]].
- **Les modalités d'évaluation** des actifs (art. 335-12, 335-13) : la balance porte les valeurs.
- **La solvabilité ajustée** (art. 337-5 à 337-5-6) : régime de groupe, hors EPIC-134.
- **La transcription ligne à ligne** des états C4 et C11 : lot de stories dédiées (D-523-2).
- **Toute exposition HTTP** : aucune route, comme [[STORY-509]] et [[STORY-510]].
