# STORY-457 : `croissanceCaPct` s'applique au TOTAL DES PRODUITS, pas au chiffre d'affaires

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `projection/ancrage.ts` et `hypotheses/dto/hypotheses.dto.ts` sur `origin/dev`.

---

## Le fait

`extraireAncres` pose `produitsBase = compteResultat.totalProduitsN`, et son propre commentaire le dit
sans détour : *« `produitsBase` est le **total des produits**, pas le chiffre d'affaires au sens strict
(il inclut produits financiers, HAO, reprises) »*. Le moteur multiplie ensuite cette assiette par
`1 + croissanceCaPct/100`.

Le paramètre, lui, s'appelle **`croissanceCaPct`**, et le DTO le décrit *« Croissance du CA (%) »*.

Un comptable qui saisit « 8 % de croissance commerciale » fait donc croître de 8 % par an :
- les produits financiers,
- les produits HAO (une plus-value de cession, par nature non récurrente),
- **les reprises de provisions** — un produit qui n'a aucun rapport avec l'activité.

Sur le dossier de démonstration, `totalProduitsN` vaut **16 375 000** ; personne, dans le produit, ne
peut dire quelle part de ce montant est du chiffre d'affaires.

Le contrat de sortie est, lui, **honnête** : `CompteResultatPrevisionnel.produits` est nommé `produits`
et non `chiffreAffaires`, avec le commentaire *« le contrat ne doit pas promettre plus précis qu'il
n'est »*. L'incohérence est donc **entre l'entrée et la sortie** : on demande un taux de CA, on rend
des produits.

## Critères d'acceptation

- [ ] AC-1 — Le paquet référentiel gagne un **marqueur** `chiffreAffaires` sur le patron additif de
      `tresorerie?` / `role?` (STORY-061), de sorte qu'aucun code de poste (`TA`, `RA`…) n'entre dans
      le moteur — l'invariant P7 tient.
- [ ] AC-2 — `AncresProjection` publie `chiffreAffairesBase` **et** `chiffreAffairesAncre: boolean`,
      sur le patron exact de `tresorerieBase` / `tresorerieAncree`.
- [ ] AC-3 — Quand le marqueur est absent (SFD-BCEAO, CIMA), la croissance s'applique au total des
      produits comme aujourd'hui, et la réponse le **signale** — jamais en silence.
- [ ] AC-4 — Le paramètre est **renommé** ou son libellé corrigé : le DTO doit dire ce que le moteur
      fait. Renommer casse le contrat ⇒ arbitrage PO entre `croissanceProduitsPct` (juste) et le
      maintien du nom avec une description exacte.
      **⚖️ ARBITRÉ PAR LE PO le 2026-09-05 : `croissanceCaPct` → `croissanceProduitsPct`.**
      Rupture de contrat **assumée et annoncée** : mesurée avant de trancher, le champ n'a
      **aucun consommateur hors `bilan-service`** (`frontend-admin-panel` et `admin-panel` ne le
      connaissent pas), et les documents `hypotheses` déjà en base relèvent de la migration
      différée (règle projet). Le nom dit désormais ce que le moteur fait.

## Périmètre — ce que cette story ne fait PAS

**⚖️ ARBITRÉ PAR LE PO le 2026-09-05 : le MOTEUR de projection ne change pas d'assiette.**
La croissance reste appliquée au **total des produits**, pour **tous** les référentiels — y
compris ceux qui déclarent le marqueur. Aucun montant déjà servi ne bouge, et
`MODELE_PROJECTION_VERSION` **reste `1.0.0`**.

C'est la lecture que porte AC-4 lui-même : il n'envisage que le **nommage**, pas un changement
de formule. Faire croître le seul CA (autres produits figés) est un changement de **modèle** —
il change tous les montants SYSCOHADA déjà rendus, impose un bump de version de modèle, et
relève d'une story à part.

Ce que la story livre, c'est donc de rendre le chiffre d'affaires **lisible et signalé** — ce
qui **débloque STORY-458** (le minimum forfaitaire de perception est assis sur le CA HT).

## Deux dépôts

⚡ **Le marqueur vit dans un artefact de référentiel, donc la story touche `balance-service`
aussi** — même famille qu'un contrat d'événement (leçon STORY-428). `table-de-passage-syscohada.json`
est la source de **deux** paquets (`syscohada-revise@2.1` **et** `zone-franche-togo@1.0`) : les
deux artefacts changent d'empreinte. Or `balance-service` recopie **à l'octet**
`syscohada-revise-2.1.json` et sa `referentiel-assets-coherence.spec.ts` **lit réellement le
dépôt voisin** quand il est présent. Régénérer d'un seul côté fait virer sa suite au rouge sans
qu'aucune de ses stories n'ait rien touché.

⇒ Branche `MNV-457` **et PR** dans `bilan-service` **et** `balance-service`, ouvertes et
intégrées **ensemble**. `zone-franche-togo-1.0.json` n'est pas recopié côté balance : seul
l'artefact SYSCOHADA y est à reporter.

## Conséquences ailleurs

- Bloque en pratique **STORY-458** : le minimum forfaitaire de perception est assis sur le **CA HT**,
  et le produit ne sait pas isoler le CA.
- La maquette FE-035 affiche l'avertissement sur la carte « La base du prévisionnel » et sur le champ
  lui-même — c'est le seul endroit où un utilisateur peut l'apprendre aujourd'hui.

---

## Progress Tracking

**Statut : `in_progress`** (2026-09-05).

### ② Branches créées AVANT la moindre ligne de code

```
docs               MNV-457
bilan-service      MNV-457
balance-service    MNV-457
```

(`git rev-parse --abbrev-ref HEAD` sur chaque dépôt impacté — `balance-service` est recensé
depuis la § *Deux dépôts* ci-dessus, artefact partagé.)

### ③④ Développement et validation

**Le marqueur suit le patron additif à la lettre.** `MappingRule.chiffreAffaires?: true`, émis
**en dernier** par `build.mjs` et **seulement si la source le déclare** — donc toute ligne non
marquée reste byte-identique. Régénération **avant** marquage : les 5 paquets sont ressortis
identiques à l'octet, ce qui prouve que le champ neuf ne déplace rien par lui-même.

**Le chiffre d'affaires arrive aux ancres par le chemin de la trésorerie, pas par un
raccourci.** `CompteResultatProductionService` le dérive (il a le paquet), `CompteResultatProduit`
le porte, `extraireAncres` le lit comme un agrégat. **L'invariant P7 tient inchangé** : la
frontière d'ancrage ne voit toujours ni paquet, ni `sig`, ni code de poste.

**⛔ Un poste de détail marqué mais sans solde vaut `0`, pas `null` — mesuré, pas supposé.**
Le premier test écrit affirmait l'inverse ; il est FAUX. La cascade légale (STORY-427) émet ses
lignes vides, donc un poste **déclaré** est toujours émis, et « aucune vente enregistrée » est
bien un chiffre d'affaires nul. Le seul cas qui retombe sur `null` est un poste `FORMULE`
**sans opérandes**, que l'évaluateur ne calcule pas et qu'aucun compte n'alimente. Le JSDoc du
service a été corrigé sur la mesure.

**⚡ Le bump `MOTEUR_VERSION` 1.13.0 → 1.14.0 a été imposé par une garde du dépôt.**
`chiffreAffairesN` entre dans le **snapshot opposable** : `moteur-version.spec.ts` (ligne posée
par STORY-431) l'a fait rougir. Le montant ne bouge nulle part et `MODELE_PROJECTION_VERSION`
reste `1.0.0` — c'est la **forme** du document figé qui change, exactement ce que ce tampon
distingue d'un changement de valeur.

**⚡ Le contrat publié a mordu deux fois, et c'est le livrable.** `openapi-contract.e2e-spec.ts`
a signalé `compteResultat.chiffreAffairesN : rendu par la route, NON publié` — j'aurais recréé
le défaut de STORY-432/456 (un champ servi mais illisible du contrat) dans la story qui le
corrige. Le champ est publié sur `CompteResultatDto` **et** sur `AncresProjectionDto`
(`nullable: true` : sans lui, un client généré type `number` et casse sur SFD-BCEAO/CIMA).
🪝 Le harnais ne monte que **trois** contrôleurs, donc `ProjectionController` et
`HypothesesController` échappaient au balayage : leurs DTO y entrent par `extraModels`, ce qui
garde le livrable **sans** élargir l'inventaire `opaques()`. Le trou de fond reste ouvert et
nommé (même famille que STORY-448).

**⛔⛔ Le défaut le plus grave n'était visible d'aucun type : `undefined` traverse `!== null`.**
Un snapshot figé **avant** cette story ne porte pas `chiffreAffairesN` ; il est relu de Mongo,
donc TypeScript ne garde rien. Sans le `?? null` d'`ancrage.ts`, la projection d'une liasse
ancienne annonçait **`chiffreAffairesAncre: true` avec un montant absent** — le signal d'AC-3
faux exactement sur la population qu'il devait couvrir. Les 5 snapshots en base sont dans ce
cas.

### AC-4 — la rupture de contrat rendue VISIBLE

**⛔ Mesuré en docker AVANT toute correction : un jeu d'hypothèses écrit sous
`croissanceCaPct` rendait HTTP 200 avec produits, résultat et trésorerie tous à `null`** — les
`NaN` de `produits × (1 + undefined/100)` sérialisés — et un `equilibre: false` qui accusait le
modèle. `hypotheses` est persisté en `@Prop({ type: Object })` : rien ne refuse la forme
ancienne.

Une rupture de contrat servie en 200 muet n'est pas *assumée*, elle est **cachée**. La garde
`exigerFormeCourante` rend désormais **422 `HYPOTHESES_FORME_OBSOLETE`**, sur les **deux**
chemins de projection (annuel et mensuel) — un seul juge, deux appels, jamais depuis
`getVersion` : **consulter** un vieux jeu doit rester possible, c'est le **calculer** qui ne
l'est plus. Elle ne migre rien (hors périmètre, règle projet) : elle nomme la casse.

### Vérification docker — 10 mesures sur la base réelle

| # | Mesure | Résultat |
|---|---|---|
| 1 | `POST /compte-resultat/dry-run`, balance réelle | `totalProduitsN` **16 375 000** · `chiffreAffairesN` **12 000 000** · écart **4 375 000** (produits financiers `771`) |
| 2 | Document `jeux_hypotheses` après création | porte `croissanceProduitsPct` ; **0** document à l'ancien nom |
| 3 | Projection sur snapshot **antérieur** (moteur 1.13.0) | `chiffreAffairesBase: null`, `chiffreAffairesAncre: false` — le signal AC-3 n'annonce pas un CA qu'il n'a pas |
| 4 | Snapshot **neuf** après validation | `bilan-engine@1.14.0`, `chiffreAffairesN: 12 000 000` |
| 5 | Invariant de forme sur toute la collection | 1.14.0 **sans** le champ : **0** · 1.13.0 **avec** : **0** · 5 snapshots antérieurs intacts |
| 6 | Projection sur le snapshot neuf | `produitsBase` 16 375 000, `chiffreAffairesBase` 12 000 000, produits N+1 **17 685 000 = 16 375 000 × 1,08** — **le modèle est inchangé**, `modeleVersion` **1.0.0** |
| 7 | Jeu à l'ancien nom, **avant** la garde | **HTTP 200**, tous les chiffres à `null` |
| 8 | Jeu à l'ancien nom, **après** la garde, chemin annuel | **422 `HYPOTHESES_FORME_OBSOLETE`** |
| 9 | Même document, chemin **mensuel** | **422 `HYPOTHESES_FORME_OBSOLETE`** |
| 10 | Témoin positif, forme courante, les deux routes | **200 / 200** |

⚠️ **Précaution de méthode, deux fois nécessaire** : `nest start --watch` a **recompilé le
`dist` sans que le process recharge le module**. Le code compilé était juste et la route
répondait à l'ancien. Toute mesure a été refaite après `docker compose up -d --force-recreate`,
et l'artefact servi vérifié dans le conteneur (`bilan-engine@1.14.0`, checksum
`82e79d1d…`). Une mesure prise sur un process périmé ne prouve rien.

### Mutations — 5 valides, 5 rouges ciblées

| # | Mutation | Test rougi |
|---|---|---|
| M1 | Marqueur retiré de la source **+ empreintes reportées** | 3 des 5 tests de `chiffre-affaires-marqueur.spec.ts` (SFD/CIMA et l'unicité restent vrais : la garde **discrimine**) |
| M2 | `?? null` retiré d'`ancrage.ts` | « traite un snapshot ANTÉRIEUR comme non ancré » |
| M4 | `@ApiProperty` retiré de `chiffreAffairesBase` | garde de contrat OpenAPI |
| M5 | `exigerFormeCourante` retirée du **seul** chemin mensuel | « 422 sur le chemin MENSUEL aussi » |
| M8 | Repli `null` → `0` dans la dérivation | « un paquet sans marqueur rend `null` — jamais 0 » |

⛔ **M1 a d'abord été ROUGE POUR LA MAUVAISE RAISON** : muter la source et régénérer change le
checksum, et le loader rejette l'artefact (`ReferentielIntegrityError`) — la garde du marqueur
n'était jamais atteinte. Refaite en reportant aussi les empreintes, comme
[[story-428-artefact-partage-deux-depots]] l'exige. **Une mutation qui rougit avant d'atteindre
sa cible ne prouve rien.**

⚡ **Une garde a été RETIRÉE parce qu'elle était vacante** : « le marqueur ne prend jamais la
valeur `false` » ne pouvait rougir sur aucune entrée — `build.mjs` refuse déjà toute valeur
autre que `true`, et un artefact édité à la main casse son checksum avant.

**Garde d'unicité du générateur, prouvée à part** (elle vit dans un script hors couverture Jest) :
`TA` marqué en plus de `XB` ⇒ `build.mjs` **lève** en nommant les deux postes. État restauré,
même checksum.

⛔ **Piège de restauration, rencontré pour de vrai** : restaurer une mutation par
`git checkout <fichier>` sur un fichier **non committé** ne défait pas la mutation — elle
ramène le fichier à `HEAD`, donc **efface tout le travail de la story** sur ce fichier. Le DTO
des ancres s'est ainsi retrouvé amputé de ses deux `@ApiProperty` **et** de ses deux
propriétés. Pris par le compilateur (`implements AncresProjection`) puis confirmé par la garde
de contrat — les deux filets ont fonctionné, mais la bonne pratique est de restaurer une
mutation par l'**édition inverse**, jamais par `git checkout`.

### ⑧ Vérification docker sur l'état FINAL — 6 mesures

Base **neuve** (le volume Mongo avait été détruit par un panic WiredTiger au démarrage,
réinitialisé sur décision de l'user). Jeu semé : produits N = **16 375 000** dont un chiffre
d'affaires de **12 500 000** (`TA` 9 000 000 + `TB` 3 000 000 + `TC` 500 000), le reste étant
2 500 000 de produits financiers et 1 375 000 de reprises de provisions.

| # | Ce qui est mesuré | Résultat |
|---|---|---|
| 1 | **AC-1 — le CA est ÉCRIT dans le snapshot figé** | `chiffreAffairesN: 12 500 000` en base, contre `totalProduitsN: 16 375 000` — **écart 3 875 000**, exactement les produits financiers et les reprises. `moteurVersion: bilan-engine@1.14.0`. Le SIG `XB` porte la même valeur : le marqueur lit bien l'agrégat du paquet. |
| 2 | **AC-2 — les ancres publient le CA** | `chiffreAffairesBase: 12 500 000`, `chiffreAffairesAncre: true`, `produitsBase: 16 375 000`. |
| 3 | **Le moteur ne change PAS d'assiette** | `modeleVersion: 1.0.0` et produits N+1 = `18 012 500` = `16 375 000 × 1,10` — la croissance porte toujours sur les **produits**, marqueur présent. |
| 4 | **AC-3 — snapshot ANTÉRIEUR à la story** | Champ retiré du document (forme d'avant) ⇒ `chiffreAffairesBase: null` et `chiffreAffairesAncre: **false**`. ⛔ Sans le `?? null` d'`ancrage.ts`, `undefined` traversait `!== null` et la réponse annonçait « ancré » avec un montant absent. |
| 5 | **Garde de forme sur les TROIS chemins** | Jeu semé à l'ancien `croissanceCaPct` ⇒ **422 `HYPOTHESES_FORME_OBSOLETE`** sur la projection annuelle, la projection mensuelle **et** la comparaison, chacun **nommant** le scénario fautif. |
| 6 | **Byte-identité inter-dépôts** | `cmp` OK entre `bilan-service` et `balance-service`, empreinte unique `82e79d1d…daea4`. |

**Témoin positif** : deux jeux en forme courante comparés ⇒ **200**, avec de vraies mesures
(`tresorerieMinimale` 5 020 128 et 4 836 971) — la garde ne crie pas sur ce qui est correct.

### ⑦ Revue de sécurité — 1 constat, bloquant, corrigé

⛔⛔ **La garde de forme manquait sur le TROISIÈME chemin de projection.**
`ComparaisonService.comparer` appelle les moteurs **sans** passer par `ProjectionService` :
la garde ne le couvrait pas, et le commentaire de sa batterie affirmait « les DEUX chemins ».
Famille **STORY-445** — une garde posée sur un seul des chemins, avec une docstring qui la
localise là où elle est.

**Le défaut y était PIRE qu'une projection muette.** `Math.min(...)` de `NaN` vaut `NaN`,
`indexOf(NaN)` rend `-1` (l'égalité stricte est fausse sur `NaN`) donc `moisTresorerieMinimale`
sortait à **`0`**, un mois qui n'existe pas ; et `filter(c => c < 0)` ne retient aucun `NaN`,
donc `moisTresorerieNegative` sortait à **`0`** — *« aucun mois de trésorerie négative »* sur un
scénario qui n'a **rien** calculé. Tous deux typés `number` **non nullable** : indiscernables
d'une mesure, et l'erreur penche du côté **faussement rassurant** sur un indicateur de risque de
cessation de paiements.

*Mesuré sur la base réelle avant correctif, en **HTTP 200** :*
`{"tresorerieMinimale": null, "moisTresorerieMinimale": 0, "moisTresorerieNegative": 0}`

⇒ garde **extraite hors de tout service** (`forme-hypotheses.ts`) pour qu'aucun appelant ne
puisse croire qu'elle le couvre déjà, et le refus **nomme** le scénario fautif — sur une
comparaison de trois scénarios, il faut savoir lequel ré-enregistrer.

### Mutations

| # | Mutation | Attendu | Constat |
|---|---|---|---|
| M1 | Deux postes marqués `chiffre_affaires` dans la source | le générateur LÈVE | ✅ rouge, message nommant `COMPTE_RESULTAT/TA` et `COMPTE_RESULTAT/XB` |
| M9 | Retirer la garde du **troisième** chemin (comparaison) | 2 tests rouges | ✅ rouge — ⚠️ d'abord **invalide** : sans retirer aussi l'import, la suite échouait à la **compilation**, et une mutation rouge par erreur de compilation ne prouve rien |

🪝 **Hook laissé, mesuré et documenté** : la fabrication des indicateurs mensuels
(`comparaison.service.ts`) reste sensible aux non-finis — `indexOf` sur un `Math.min` qui vaut
`NaN` rend `-1`, donc `0` après `+1`. La garde de forme ferme le seul chemin qui y menait ;
durcir la fabrication elle-même serait une défense en profondeur, hors périmètre de cette story.
