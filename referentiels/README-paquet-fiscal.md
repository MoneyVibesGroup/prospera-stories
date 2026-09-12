# Packager un paquet fiscal pays — procédure de sourcing (STORY-493, AC-4)

**Pour qui :** la personne qui doit ouvrir un pays — le **Bénin**, par exemple — et qui n'a jamais vu ce
dépôt. Elle a besoin de savoir **où chercher le droit**, **quoi en extraire**, **dans quel ordre**, et
**ce que l'outillage refusera**.

**Comment elle est écrite :** en **refaisant le paquet togolais avec** — chaque étape relue contre
`balance-service/scripts/referentiels/sources/paquet-fiscal-togo-2026.json`, contre le schéma et contre la
garde, les refus cités ayant été **provoqués pour de vrai**. ⚠️ Elle ne pré-approuve aucun pays : chaque
paquet reste une story avec son propre sourcing. On ne package pas une loi de finances par analogie.

## Ce qu'est un paquet fiscal

Un artefact **`pays × année`**, axe **orthogonal** au référentiel comptable (**D-078-1**) : la loi de
finances change tous les ans, le plan de comptes non. Il porte des **taux, seuils, échéances,
déductibilités et codes** — jamais un plan de comptes, jamais une règle de présentation d'état. Le
moteur ne contient **aucun taux** (NFR-A06) : ajouter un pays = *déposer une source + une ligne de
manifeste*, zéro ligne de code.

| Fichier (`balance-service/`) | Rôle |
|---|---|
| `scripts/referentiels/sources/paquet-fiscal-<pays>-<année>.json` | **la source**, celle que vous écrivez |
| `scripts/referentiels/paquet-fiscal.schema.json` | ce qu'un paquet **doit** contenir |
| `scripts/referentiels/valider-paquet-fiscal.mjs` | la **garde** qui refuse de packager |
| `scripts/referentiels/build.mjs` | le **générateur** : découvre, valide, écrit, imprime le sha256 |
| `src/modules/referentiel/assets/` | l'artefact produit — **ne s'édite jamais à la main** |
| `src/modules/referentiel/paquet-fiscal-registry.ts` | le **manifeste** : checksum + `paysSource` |

## Étape 0 — Réunir le texte officiel

Ce qui a servi au Togo, écrit tel quel dans `_meta.source` : « Code Général des Impôts + Livre des
Procédures Fiscales — OTR, **édition 2025** (`CODE-GENERAL-DES-IMPOTS-ET-LIVRE-DES-PROCEDURES-FISCALES-OTR-2025.pdf`,
361 p.). Barème CNSS fourni par l'utilisateur 2026-07-19 (**source distincte** : Code de Sécurité
Sociale). Dates de dépôt DSF fournies par l'utilisateur. » Trois enseignements transposables :

1. **Le code consolidé de l'administration fiscale du pays**, avec son **édition** (l'OTR ici ; la DGI
   pour le Bénin). Le CGI ne suffit pas : les **échéances et sanctions** vivent dans le **LPF**, dont la
   numérotation est **indépendante** — `LPF Art. 56` et `CGI Art. 56` sont deux articles différents.
2. **Une source hors CGI/LPF se déclare comme telle** : le barème CNSS togolais vient du Code de
   Sécurité Sociale et le dit dans `cnss._meta.source`, au lieu de se fondre dans la source d'ensemble.
3. ⚠️ **Vérifier quelle loi de finances le texte consolide.** Le paquet togolais est keyé sur l'exercice
   **2026**, mais son `_meta.loiDeFinances.annee` vaut **2023** : l'édition OTR 2025 ne consolide que
   jusqu'à la LF 2023. L'écart est **réel**, et il se lit dans le `_meta` plutôt que de se deviner.
   Faites la même vérification pour votre pays, et **écrivez le résultat**, même s'il est gênant.

⚠️ **Le PDF officiel n'est pas au dépôt** — seules ses extractions JSON le sont. Citez-le par son nom de
fichier et sa pagination, comme le fait le Togo.

## Étape 1 — Extraire un corpus citable

Avant le paquet, le Togo a produit deux extractions, dans `docs/referentiels/` :

| Fichier | Contenu | À quoi il sert |
|---|---|---|
| `corpus-complet-cgi-lpf-togo.json` | **1 185 articles** (CGI 644 + LPF 541), `{livre, article, page, texte}` verbatim | retrouver **l'article exact** derrière chaque valeur du paquet |
| `corpus-justificatif-fiscal-togo.json` | **42 articles pivots**, tagués `theme` + `usage_bilan` | justifier un retraitement face à un client ou à l'administration |

Ce corpus rend l'étape suivante mécanique : chaque `source` du paquet devient un renvoi vérifiable, pas
un souvenir. Son `_meta` porte l'avertissement qui vous concerne aussi — « texte extrait automatiquement
d'un PDF […] à valider contre le code officiel avant tout usage contentieux ». **Limite connue :** aucun
script du dépôt ne produit ces corpus, l'extraction ayant été faite hors outillage ; il n'y a rien à
relancer. Reprenez au moins les champs `livre`, `article`, `page`, `texte`.

## Étape 2 — Écrire le `_meta`

| Champ | Togo | Règle |
|---|---|---|
| `artefact` | `"paquet-fiscal"` | constante |
| `pays` | `"TG"` | **ISO 3166-1 alpha-2**, un seul — un paquet ne vaut jamais pour deux droits |
| `paysLibelle` | `"Togo"` | |
| `annee` | `2026` | l'**exercice couvert**, pas l'année d'édition du texte |
| `devise` | `"XOF"` | ISO 4217, monnaie de **tous** les montants du paquet — aucun repli |
| `referentielComptable` | `"syscohada-revise"` | le plan sur lequel les comptes cités ont un sens |
| `source` | l'édition dépouillée (étape 0) | |
| `statut` | `"a-valider-par-expert"` | vocabulaire **fermé** : `certifie` · `a-valider-par-expert` · `amorce` |
| `miseEnGarde` | ce qui manque **et qui doit le valider** | obligatoire dès que `statut ≠ certifie` |
| `loiDeFinances` | `{texte, annee: 2023, reference}` | la réponse à « ces chiffres valent pour quel texte ? » |
| `revision` | `"2026-07-19 — passage AMORCE -> COMPLET…"` | ce qui a changé, daté |

Le vocabulaire de `statut` est **celui des référentiels comptables** (STORY-491) : deux échelles de
maturité parallèles seraient incomparables dans le même produit. La `miseEnGarde` togolaise nomme **deux
manques précis** — l'écart LF 2023 / exercice 2026, et le barème CNSS incomplet (plafond, branches, SMIG)
— puis désigne le valideur : « un fiscaliste togolais, sur la loi de finances de l'exercice cible ». Une
mise en garde qui ne nomme ni le manque ni le valideur ne se distingue pas d'un oubli.

## Étape 3 — Les neuf rubriques obligatoires, dans l'ordre du schéma

Le `required` du schéma en compte dix, `_meta` inclus. Les neuf autres, dans son ordre :

| Rubrique | Ce qu'on en extrait | Au Togo |
|---|---|---|
| `is` | `taux`, `base`, `source` | 27 %, base « bénéfice imposable (résultat fiscal définitif) » — **Art. 113 CGI** |
| `minimumForfaitairePerception` | `taux`, `base`, `regleLiquidation`, `duEnCasDeDeficit`, **`exonerations[]`** | 1 % du CA HT du dernier exercice clos, 2 % pour l'import-revente de véhicules d'occasion (**Art. 120**) ; `impôt dû = max(MFP, IS)` ; **4 exonérations**, chacune avec sa `source` (**Art. 121**) |
| `regimesImposition` | les régimes du droit local, dont **au moins un** déclare son `plafondCA` | `reel_normal`, `reel_simplifie`, `synthetique_entreprenant_tpu` — plafond **60 000 000 FCFA** |
| `tva` | `tauxStandard`, `base`, et `declaration` : périodicités, périodicité par défaut, report du crédit | 18 %, taux unique (**Art. 195**) ; déclaration mensuelle (`moisParPeriode: 1`) |
| `taxes` | un **type par ligne** : `code`, `libelle`, `compteComptable`, `deductible`, `source` — et `codeReintegration` si non déductible | **12 types** ; un seul non déductible : `PENALITES_FISCALES` (compte 647, code de réintégration **20**) |
| `retenuesSource` | chaque retenue, son taux, son assiette, sa nature | loyers **8,75 %** (**Art. 100**), prestations résidentes 3 / 5 / 20 % selon attestation, NIF ou rien (**Art. 99**), non-résidents 20 % (**Art. 98**), capitaux mobiliers (**Art. 79-80**) |
| `depot` | `echeances[]` : `typeContribuable`, `dateLimite` en **`JJ-MM`**, `modeConstatation`, `source` | 31-03 TPU déclaratif (**LPF Art. 56**), 30-04 société, 31-05 assurance/banque — clôture de référence 31-12 (**Art. 96 CGI**) |
| `acomptesProvisionnels` | `nombre` **déclaré**, `echeances[]`, `calcul` | **4** acomptes aux **31-01, 31-05, 31-07, 31-10**, chacun = 1/4 des cotisations du dernier exercice clos (**Art. 114-116**) |
| `resultatFiscal` | `mecanisme`, codes **et** libellés de réintégration / déduction, `reportDeficitaire` | 12 codes de réintégration, 5 de déduction ; report **plafonné à 50 %** du bénéfice, durée **illimitée** (`dureeReportAnnees: null`) — **Art. 101** |

Quatre pièges vus sur le paquet togolais, transposables tels quels :

- **`dateLimite` est un jour-mois, jamais une date** : l'année vient de l'exercice. Et les dates
  togolaises ne valent **que** pour une clôture au 31 décembre — le paquet le dit
  (`clotureReferenceNote`), et le moteur préfère ne servir **aucune** date plutôt qu'un 30 avril faux
  de plusieurs mois.
- **`modeConstatation` n'est pas une catégorie juridique** : il dit à quelle **donnée détenue par la
  plateforme** l'échéance se rattache. L'échéance « société » sort `NON_CONSTATABLE` — **publiée et
  jamais appliquée**, parce que rien dans les données ne distingue une société d'une entreprise
  individuelle au réel. Une date fausse est pire qu'une date absente : elle est crue.
- **`acomptesProvisionnels.nombre` se déclare**, il ne se déduit pas de la longueur de la liste : sinon
  une échéance oubliée passerait pour un régime à trois acomptes.
- **Deux seuils d'un même régime ne sont pas interchangeables** : `plafondCA` (60 M) est la frontière
  **du régime** (réel ↔ synthétique, Art. 128/132), `composantes.forfaitaire.caMax` (30 M) une frontière
  **interne** (Art. 130). Les confondre fait conseiller la bascule au réel à une entreprise parfaitement
  dans son régime.

## Étape 4 — Les rubriques facultatives, et ce qu'on fait des trous

Le schéma n'exige rien au-delà. Le Togo porte **neuf rubriques facultatives** — `irpp` (barème progressif à
8 tranches, tranche haute **35 %**), `liquidation`, `taxeActivitesFinancieres` (TAF 10 %),
`taxeConventionsAssurance`, `droitsAccises`, `factureNormalisee`, `cnss`, `provisions`,
`autresImpotsTaxes` — plus une liste `aFaire`. **On crée une rubrique facultative parce que le droit
local la prévoit, jamais parce que le Togo l'a** : l'exiger obligerait à inventer une donnée.

**Les trous se déclarent, à trois niveaux.** Une valeur dont l'article n'a pas été retrouvé porte une
`source` qui commence par **`A_CONFIRMER —`** et dit pourquoi (« périodicité non extraite de l'édition
OTR 2025 ; à valider par un fiscaliste togolais avant mise en production »). Une question ouverte entre
dans **`aFaire`** (six entrées au Togo : périodicité TVA, comptes SYSCOHADA, validation experte, loi de
finances de l'exercice cible, seuils réel normal / simplifié, barème CNSS). Une donnée manquante au
point de rendre un calcul impossible reste **explicitement vide** : le barème forfaitaire de la TPU est
un tableau `[]` avec `baremeStatut: "A_EXTRAIRE"`, et le moteur **refuse** (`BAREME_TPU_INDISPONIBLE`)
au lieu de produire un impôt plausible et faux.

## Étape 5 — La référence légale, valeur par valeur

C'est la seule chose qui empêche « vraisemblable » d'entrer. **Deux filets, qui ne se remplacent pas :**

1. **le schéma exige `source` nommément** sur chaque élément de collection — chaque exonération de MFP,
   chaque type de taxe, chaque échéance de dépôt. C'est le filet **principal** ;
2. **le balayage R4** refuse toute valeur numérique ou booléenne qu'aucune `source` ne couvre, ni la
   sienne ni celle d'un ancêtre de sa rubrique. C'est le **second**.

⚠️ **Le balayage seul ne suffit pas, et c'est mesuré** : sur les 52 nœuds porteurs d'une `source` du
paquet togolais, en supprimer une n'est détecté par le seul balayage que **36 fois sur 52** — et les 16
muettes incluent les **quatre exonérations de MFP**, exactement les valeurs que STORY-412 avait vues
publiées en prose et jamais exposées au contrat.

## Étape 6 — Déposer, générer, reporter le checksum

```bash
# 1. la source, nommée EXACTEMENT paquet-fiscal-<pays>-<année>.json : c'est le NOM DU FICHIER qui porte
#    la clé, et le répertoire qui fait foi — rien n'est énuméré à la main
cp paquet-fiscal-benin-2027.json balance-service/scripts/referentiels/sources/

# 2. la garde, avant même de générer — elle nomme TOUTES ses fautes d'un coup
cd balance-service && node scripts/referentiels/valider-paquet-fiscal.mjs \
  scripts/referentiels/sources/paquet-fiscal-benin-2027.json

# 3. le générateur : valide (encore), écrit l'asset, imprime rubriques / statut / sha256
node scripts/referentiels/build.mjs
```

Sur le Togo, le générateur imprime `rubriques : 19` (les 20 clés de premier niveau moins le `_meta`),
`statut : a-valider-par-expert` et l'empreinte
`d8d2c5675d562815cbab51f0929d0cd13146a15f78997c7c3f3d42d92df7b3ed` — exactement la valeur déclarée au
manifeste. **4. La reporter à la main** dans `paquet-fiscal-registry.ts`, avec le code pays ISO :

```ts
['benin@2027', { locator: 'paquet-fiscal-benin-2027.json', checksum: '…', paysSource: 'BJ' }],
```

⛔ **`paysSource` est le seul lien entre la clé du manifeste et le code ISO du dossier.** La clé est un
nom en minuscules (`togo`) que **rien** ne relie à `TG`. Une entrée mal câblée (`benin@2027` → artefact
togolais) passerait tous les contrôles — checksum conforme, année conforme — et le service servirait des
**taux étrangers sous le bon libellé**.

Si le report est faux ou oublié, le loader compare l'empreinte réelle de l'asset au checksum déclaré et
lève `ArtefactIntegrityError` : **tout** chargement du paquet échoue. Il refuse aussi, à la lecture, un
`statut` hors vocabulaire et un paquet non `certifie` sans `miseEnGarde`. Une fois l'entrée en place, le
pays est **supporté** sans autre geste : la liste des pays servis et la résolution « dossier `BJ` → son
paquet » se dérivent du manifeste, par `paysSource` et par lui seul (la configuration
`PAQUET_FISCAL_PAR_DEFAUT`, de la forme `pays@AAAA`, ne sert que de repli global).

**Déterminisme** : même entrée ⇒ mêmes octets ⇒ même checksum (indentation 2, aucun horodatage, **ordre
des clés préservé**) — réordonner les rubriques d'une source change le checksum sans changer une seule
valeur, à faire sciemment ou pas du tout. **Enfin, la batterie** :
`src/modules/referentiel/paquet-fiscal-schema.spec.ts` relance le **vrai** validateur (le binaire, pas une
copie de ses règles) sur **tous** les assets fiscaux et exige que manifeste et répertoire d'assets se
recouvrent exactement. C'est elle qui fait tourner la garde en CI : le générateur vit hors du `rootDir`
de Jest et n'est exécuté par aucune porte automatique.

## Étape 7 — Quand la garde refuse

Elle rend **toutes** les fautes d'un coup, chacune nommée. Refus **réel**, provoqué sur une copie mutée
du paquet togolais (rubrique `depot` supprimée, `miseEnGarde` supprimée, `source` d'une exonération de
MFP supprimée, `source` de la TAF supprimée) :

```
FAUTE …/mute.json — 4 faute(s)
   • paquet.depot : manquant — rubrique obligatoire du paquet fiscal
   • paquet.minimumForfaitairePerception.exonerations[0].source : manquant — rubrique obligatoire du paquet fiscal
   • R1 mise en garde : `_meta.statut` vaut "a-valider-par-expert", donc `_meta.miseEnGarde` est obligatoire — elle dit ce qui manque et qui doit le valider
   • R4 référence légale : la valeur `taxeActivitesFinancieres.taux` n'est couverte par aucune `source` — ni la sienne, ni celle d’un ancêtre de sa rubrique
```

Les familles de règles, dans l'ordre où elles s'appliquent : **le schéma** (rubriques et champs
obligatoires, types, formats — c'est lui qui **nomme la section manquante**) ; **R1** mise en garde
exigée d'un paquet non `certifie` ; **R2** au moins un régime déclarant son `plafondCA` avec sa
`source` ; **R3** une taxe non déductible nomme son `codeReintegration`, **et** ce code existe dans
`resultatFiscal.reintegrations_codes` ; **R4** le balayage des valeurs sans référence légale.

La garde s'exécute **avant** l'écriture : un paquet incomplet ne doit pas exister sur le disque, et
surtout pas porter un checksum qui le ferait passer pour vérifié.

## Ce qui se valide par un fiscaliste — et ce qui ne se valide pas

**Se valide par un fiscaliste du pays**, et par personne d'autre : taux, seuils, assiettes, exonérations,
périodicités, dates légales, déductibilité **type par type**, codes officiels de réintégration et de
déduction, régime du crédit de TVA, et **loi de finances applicable à l'exercice cible**. Tout ce que le
paquet marque `A_CONFIRMER` est, par construction, sur cette liste.

**Ne se valide pas par un fiscaliste** — c'est de l'ingénierie, et le lui soumettre lui ferait valider
une question qu'il ne peut pas trancher :

- le **`modeConstatation`** d'une échéance : il décrit ce que la plateforme sait **prouver** sur un
  dossier, pas une catégorie de droit ;
- les **comptes comptables** cités (TVA 443 / 445 / 4441 / 4449, TPU 641 / 441, impôt sur le résultat
  891 / 441) : ils relèvent du **plan du référentiel comptable** et sont validés contre lui à
  l'exécution — un compte que le plan ne reconnaît pas est signalé, jamais utilisé en silence ;
- les **libellés de postes** de la liasse : transcrits **à l'identique** de l'artefact comptable,
  typographie comprise, et une garde fait rougir la suite si les deux divergent d'un caractère ;
- la **forme** du fichier, le checksum, le manifeste.

**Limite connue :** le schéma n'a **aucun champ** pour consigner une validation — ni valideur, ni date,
ni portée. Elle ne peut s'inscrire aujourd'hui que dans `_meta.revision`, dans la `miseEnGarde` et dans
la story. C'est pour cela que le paquet togolais reste `a-valider-par-expert` : **aucun fiscaliste
togolais n'a consigné de validation.**

## Ce qu'un paquet ne doit JAMAIS contenir

1. **Une valeur sans référence légale.** La garde l'attrape, mais la discipline passe avant la garde :
   si vous ne savez pas citer l'article, la valeur n'entre pas.
2. **Un taux recopié d'un autre pays « par analogie ».** Le Bénin n'est pas le Togo à 27 %. Un taux
   emprunté sous une `source` recopiée est **indétectable** — voir ci-dessous.
3. **Un statut `certifie` sans validation consignée.** Le statut voyage jusqu'au tampon publié sur les
   surfaces fiscales : un barème présenté comme certifié quand il ne l'est pas est le seul défaut de ce
   produit qui puisse coûter un redressement à un client.

## Ce que la garde ne voit pas — mesuré, pas supposé

Sondée sur une copie du paquet togolais, la garde rend **`OK`, code 0**, sur un paquet où `is.taux` est
passé à **30 %** et la retenue sur loyers à **10 %** — leurs `source` d'origine intactes. Et elle rend
`OK` aussi sur des acomptes posés en **trimestriel** (`31-03`, `30-06`, `30-09`, `31-12`) au lieu des
dates réelles. Une seule conclusion, et c'est le cœur de cette procédure :

> **La garde vérifie qu'une référence existe, jamais qu'elle dit ce que la valeur affirme.** Seule la
> relecture article par article le fait. Aucun outil de ce dépôt ne la remplace.

Une deuxième limite existait et a été **refermée par cette story** : le format `JJ-MM` ne contrôlait que
la **forme**, si bien que `31-02` et `31-04` le franchissaient — une échéance posée sur un jour qui
n'existe pas est soit absorbée en silence par le mois suivant, soit une date fausse, et une date fausse
est pire qu'une date absente parce qu'elle est crue. Le schéma déclare désormais `"format":
"jour-mois"`, vérifié sur le **calendrier**. Février reste admis jusqu'au 29 : le jour existe, c'est
l'exercice qui dira s'il tombe cette année-là.

C'est exactement ainsi que **deux erreurs de maquette** ont été corrigées : des acomptes posés en
trimestriel au lieu des dates réelles (31-01, 31-05, 31-07, 31-10), et un taux de retenue sur loyers à
10 % au lieu de **8,75 %** — que le paquet décompose d'ailleurs en 3,75 % imputés sur la taxe foncière et
5 % sur l'impôt sur le revenu. Elles ont été vues **parce que le paquet portait la bonne valeur**, pas
parce qu'un outil les a détectées. D'où la règle projet : **les chiffres d'une maquette fiscale se
prennent dans le PAQUET, jamais dans le vraisemblable.**

## Corriger un paquet, ou en publier un autre

L'axe fiscal est versionné **`pays × année`** : une nouvelle loi de finances est une **nouvelle année**,
donc une nouvelle source et une nouvelle entrée de manifeste — pas une révision. Une correction sur
l'année en cours se fait en place (source → `build.mjs` → checksum reporté au manifeste). ⚠️ Ne pas
confondre avec la règle « corriger en place vs publier une nouvelle version » du [`README.md`](README.md)
de ce dossier : elle porte sur les **référentiels comptables** `code@version` catalogués dans
`platform-catalog-service`, ce que les paquets fiscaux ne sont pas. En revanche un paquet fiscal chargé
est **tamponné** (`pays`, `annee`, `checksum`, `statut`, `miseEnGarde`) sur les bases de calcul d'impôt :
le jour où un calcul figé doit être rejoué, c'est ce tampon qui dit quels taux ont servi.

## Où aller ensuite

- `docs/stories/STORY-493.md` — schéma, garde, statut publié, copies divergentes recensées (D-493-A) ;
- [`README.md`](README.md) — provenance de tous les référentiels et règle de versionnement ;
- [`README-smt-togo.md`](README-smt-togo.md) et [`README-zone-franche-togo.md`](README-zone-franche-togo.md)
  — ce qu'on écrit quand une donnée **n'est pas** sourcée : on la déclare absente, on ne la remplit pas.
