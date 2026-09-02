# STORY-434 : Le TFT bâti sur les variations NETTES double-compte les dotations et les valeurs de cession — l'écart d'articulation vaut exactement `RL + RO`, et il est systématique

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/tft-production.service.ts`, `etats/bilan.types.ts`, `etats/evaluateur-formule.*`, paquet référentiel
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuilles *« TFT »* et *« TABLEAU immo note 3A »*.

---

## Le fait — l'écart n'est pas un aléa, c'est une identité

`FF`…`FI` estiment les flux d'investissement par la **variation du NET** des postes d'actif :

```json
{"poste":"FG","operandes":[{"poste":"AI","signe":"-","mode":"VARIATION","etatSource":"BILAN_ACTIF"}],"statutTft":"ESTIME"}
```

Or `contexteMultiEtats` pose `BILAN_ACTIF|AI` = **`netN`**. Et
`net = brut − acquisitions… − dotations − VNC des cessions`. Les dotations et la valeur
comptable des cessions sont donc **dans** la variation nette — et la **CAFG** (`FA`) vient
précisément de les **rajouter** (`+RL`, `+RO`). Elles comptent deux fois.

**Démonstration, sur le jeu de la maquette FE-033** (chiffres produits en rejouant les
opérandes du paquet, pas écrits à la main) :

| | valeur |
|---|---|
| `ZG` — variation reconstituée par les flux | **1 055 000** |
| variation de trésorerie du Bilan (`BT − DT`, N vs N-1) | **150 000** |
| **écart** | **905 000** |
| dont dotations de l'exercice (`RL`) | 860 000 |
| dont valeur comptable des cessions (`RO`) | 45 000 |

`905 000 = RL + RO`, **au franc près**. Et avec les mouvements **bruts** (525 000
d'acquisitions corporelles, 300 000 de prix de cession — c'est-à-dire la **note 3A**),
`ZC` vaudrait −225 000, `ZG` **150 000**, et **l'écart tombe à zéro**.

⚡ **Ce n'est donc pas « un écart légitime dû aux lignes estimées »**, comme le commentaire du
service le suggère : c'est un **biais structurel**, présent dès qu'il y a une dotation aux
amortissements — c'est-à-dire sur **toute** entité qui possède une immobilisation.

## Deux symptômes visibles du même défaut

1. **Trois lignes portent un montant de sens contraire à leur libellé.**
   « `FO` **+ Emprunts** » vaut **−200 000** (l'emprunt a été remboursé) pendant que
   « `FQ` **− Remboursements** » reste vide ; « `FF` **− Décaissements** » vaut **+80 000** ;
   « `FL` **+ Subventions reçues** » vaut **−30 000** (c'est la *reprise* annuelle). Sur un état
   **déposé**, un remboursement rangé sous « + Emprunts » est une **ligne fausse**.
2. **Le brut ne franchit pas la frontière du moteur.** `PosteActif` publie `brutN`, `amortN`,
   `netN`, `netN1` — **mais ni `brutN1` ni `amortN1`**, et l'évaluateur ne voit que `netN`.
   La variation brute n'est donc **pas calculable aujourd'hui**, même en le voulant.

## ✅ Arbitrage (2026-08-27) — **voie A puis voie B : une seule route, deux étages**

⚠️ **Et la voie A a été re-dérivée avant d'être retenue : elle ne suffit pas.** La première
rédaction de cette fiche annonçait « le TFT reconcilie au franc près dès qu'il n'y a ni cession
ni virement ». **C'est faux dès qu'il y a une cession.** Mesuré sur le jeu de la maquette :

| | `ZC` | `ZG` | écart vs Bilan |
|---|---|---|---|
| aujourd'hui (variation du **net**) | 680 000 | 1 055 000 | **905 000** |
| **voie A** (variation du **brut**) | 75 000 | 450 000 | **300 000** |
| **voie A + B** (mouvements de la **note 3A**) | −225 000 | 150 000 | **0** |

La voie A retire **605 000 sur 905 000 (67 %)** — tout le double-comptage des dotations. Le
résidu de **300 000** vaut **exactement la valeur BRUTE des cessions**, et la balance ne la
publie nulle part : `brut cédé = VNC (RO, 45 000) + amortissements sur le bien cédé (255 000)`,
et le second terme n'est publié par aucun champ. **Seule la note 3A le donne** — c'est sa
colonne « Diminutions ». C'est d'ailleurs *pourquoi* le formulaire OHADA exige la note 3A.

**Décision :**

- **Jalon 1 (voie A) — livrable tout de suite, sans dépendance.** Il retire le biais
  *structurel* (celui qui frappe **toute** entité amortissant un bien, même sans jamais rien
  céder) et il est de toute façon **prérequis** : le brut N-1 est aussi ce qui permettra de
  contrôler l'ouverture de la note 3A (STORY-439) et de corriger les notes (STORY-438).
- **Jalon 2 (voie B) — conditionné à STORY-436.** Dès que les mouvements bruts de la note 3A
  sont saisissables, `FF`/`FG`/`FH` les lisent et l'écart tombe à **zéro**. À rechiffrer à ce
  moment-là ; les 8 points de cette fiche couvrent le jalon 1.
- ⛔ **Voie C écartée.** Un tableau des flux qui ne retombe pas sur la trésorerie du Bilan
  n'est pas un tableau des flux : le formulaire déposé porte lui-même sa ligne de contrôle en
  pied. Assumer l'écart, c'est livrer un état que l'entité ne peut pas déposer.

## Critères d'acceptation — jalon 1 (voie A)

- [x] AC-1 — `PosteActif` porte `brutN1` et `amortN1` (`null` si le jeu N-1 n'est pas produit).
- [x] AC-2 — L'évaluateur résout un opérande `mode: 'VARIATION_BRUT'` sur `BILAN_ACTIF`.
- [x] AC-3 — `FF`/`FG`/`FH` du paquet `syscohada-revise@2.1` passent en `VARIATION_BRUT` ;
      `FI` reste `+TN` (prix de cession, déjà juste). ⚠️ **Leur `statutTft` reste `ESTIME`** —
      il ne passera `CALCULE` qu'au jalon 2 : tant que les cessions brutes ne sont pas connues,
      le montant reste une estimation, et le dire est tout l'intérêt du statut de preuve.
- [x] AC-4 — Test d'articulation, **exact et sans complaisance** : sur un jeu **sans cession ni
      virement**, `ZG === variationBilan` et `ecart === 0` ; sur un jeu **avec cession**,
      `ecart === valeur brute des cessions` — l'écart résiduel est **connu et borné**, pas subi.
      Le test échoue si quelqu'un remet `netN`.
- [ ] ⛔ **AC-5 NON LIVRÉ** (motivé, cf. *Progress Tracking*) — Le jeu de la maquette FE-033 devient un **cas de test versionné** : `ZG` doit passer
      de 1 055 000 à **450 000**, et l'écart de 905 000 à **300 000** (jalon 1), puis à **0**
      au jalon 2.
- [x] AC-6 — Agnosticisme P7 : `sfd-bceao@2.0` traverse sans effet (aucune opérande TFT).
- [x] AC-7 — Le commentaire périmé de `tft.types.ts` (« *`ecart = 0` par construction* »)
      disparaît dans la foulée : il décrit le TFT d'avant STORY-113 et enseigne exactement la
      mauvaise règle.

## Conséquences ailleurs

- **STORY-438** est la **même racine** côté notes annexes (les notes 3/6/7 totalisent du net
  sous des colonnes en brut) : les instruire ensemble, ou l'une résoudra la moitié du problème.
- **STORY-439** (contrôle note ↔ poste) devient calculable seulement après celle-ci.
- Le commentaire de `tft.types.ts` — « *`ecart = 0` par construction* » — est **périmé depuis
  STORY-113** et doit disparaître dans la foulée : il décrit le TFT du temps où ce n'était qu'un
  squelette, et il enseigne exactement la mauvaise règle (celle de `coherenceResultat`).

---

## Progress Tracking

**Statut : `done`** — jalon 1 (voie A) implémenté, validé, revu (code + sécurité),
**vérification docker réelle rejouée sur l'état final**. **DEUX PR rebase-mergées ENSEMBLE** :
`bilan-service` **#65** (4 commits) et `balance-service` **#86** (2 commits), le 2026-09-02.

### ⚡⚡ La prémisse de la fiche ne tient pas sur le référentiel packagé — mesuré

La fiche pose « `net = brut − dotations − VNC des cessions` », donc « les dotations sont dans
la variation du net et la CAFG les rajoute ». Cela suppose que les comptes d'amortissement
soient **rattachés aux postes d'actif**. Sur `syscohada-revise@2.1` et `zone-franche-togo@1.0`,
**aucun ne l'est**, et le plan de comptes ne porte que les racines `28`/`29`. C'est la
« **convention miroir** », déclarée hors périmètre depuis STORY-059.

⚠️ **Correction apportée par la revue à mon propre énoncé** : « aucun `28xx`/`29xx` dans **les
cinq** artefacts » est **faux** — `cima-assurances@1.0` rattache `28` au poste `CA1`, et les
deux `sfd-bceao` rattachent `29` à `BA2`. Sans conséquence (aucun des trois n'a d'opérande
TFT), mais l'énoncé était trop large. De même, `amortN` n'est structurellement nul que sur le
référentiel **packagé** : une **surcharge d'organisation** suffit à l'alimenter (mesuré,
`AK.amortN = 1 605 000`).

**Conséquence mesurée de bout en bout** : sur une balance réaliste, l'**ancien** et le
**nouvel** artefact donnent des résultats **identiques** — `FG = −200 000`, `ZG = −200 000`,
`ecart = 0`. L'écart de 905 000 = `RL + RO` de la fiche ne peut pas se produire : la dotation
sort en **compte non affecté**, ce que le contrôle bloquant signale déjà.

### ⚡⚡ Et la cause RÉELLE est plus profonde — trouvée par la revue de code

Mon premier diagnostic disait « la voie A mordra le jour de la convention miroir ». **Faux.**
`FF`/`FG`/`FH` visent `AD`/`AI`/`AP`/`AQ`, qui sont les **totaux** du bilan DSF déclarés
`type: 'detail'` avec des préfixes larges (`21`, `22|23|24`, `26|27`). La résolution au
**préfixe le plus long** les fait perdre au profit des postes de détail : sur un plan
d'immobilisations réaliste, **`AD`, `AI` et `AQ` ne reçoivent RIEN** (`211000 → AE`,
`231000 → AK`, `261000 → AR`…).

⇒ Les trois lignes de flux d'investissement sont **structurellement mortes**, avec ou sans
amortissements rattachés. Refermer l'écart demandera **aussi** de recâbler `FF`/`FG`/`FH` sur
les postes de détail, ou de modéliser `AD`/`AI`/`AQ` en `type: 'total'`.

⛔ **STORY-436, 438 et 439 sont cadrées sur le diagnostic incomplet** : à re-instruire avec
celui-ci. Le fait est désormais une **garde** dans la batterie — un test mesure que les trois
postes restent vides, et il **rougira le jour du recâblage**.

### Ce qui est livré

- **AC-1** — `PosteActif` porte `brutN1` et `amortN1`, publiés au contrat. Sans eux, la
  variation **brute** n'était pas calculable, même en le voulant : le brut ne franchissait pas
  la frontière du moteur.
- **AC-2** — l'évaluateur résout `VARIATION_BRUT`. ⛔ Poste sans colonne brute ⇒ `null`,
  **jamais** un repli silencieux sur le net. Le semis du contexte porte aussi les colonnes
  brutes, sinon une balance creuse ferait tomber **toute** la cascade. Une **garde d'artefact**
  refuse `VARIATION_BRUT` hors `BILAN_ACTIF`, à la source.
- **AC-3** — `FF`/`FG`/`FH` basculés dans la **source**, artefacts régénérés. ⚠️ **Deux**
  artefacts bougent (`zone-franche-togo@1.0` partage la table), et `syscohada-revise@2.1` est
  recopié **à l'octet** dans `balance-service` ⇒ **deux dépôts**, patron STORY-428.
  `statutTft` reste `ESTIME`.
- **AC-4** — les **deux** jeux, comme l'AC l'exige, sur un référentiel qui *rattache* ses
  amortissements : **sans cession**, `VARIATION` laisse `ecart = 300 000` (= les dotations, au
  franc près) et `VARIATION_BRUT` le ferme à **0** ; **avec cession** (brut 300 000, VNC
  45 000, prix 300 000), l'écart résiduel vaut **exactement 300 000**, la valeur brute sortie
  que la balance ne publie nulle part. L'écart est **connu et borné**, pas subi.
- **AC-6** — `sfd-bceao@2.0` ne déclare aucune opérande TFT : rien à basculer, mesuré.
- **AC-7** — le commentaire « `ecart = 0` par construction » disparaît : périmé depuis
  STORY-113, il enseignait la règle de `CoherenceResultat` (qui ne peut **jamais** rougir) à un
  contrôle qui, lui, compare une cascade reconstituée à une grandeur indépendante.

### ⛔ AC-5 NON LIVRÉ — motivé, et tracé ici

Le jeu de la maquette FE-033 **n'est pas dans la fiche** : seuls ses résultats y figurent
(`ZG` 1 055 000 → 450 000, écart 905 000 → 300 000). Ces chiffres supposent **à la fois** la
convention miroir **et** un câblage de `FF`/`FG`/`FH` qui résolve — deux conditions que le
référentiel packagé ne remplit pas. Les reconstruire aurait été **inventer une donnée pour
faire coïncider un test avec une prémisse fausse**.

⚠️ **Ce qui restait faisable et n'a pas été fait** (constat de revue) : verser le jeu FE-033
comme cas versionné sur un référentiel **synthétique** reproduisant la structure de la
maquette — le procédé même employé pour l'AC-4 — avec l'écart consigné. **À reprendre avec le
jalon 2**, une fois le diagnostic corrigé intégré à STORY-436.

### ⚡⚡ La forme figée dans les snapshots changeait SANS bump (revue de sécurité)

`PosteActif` gagne deux clés ⇒ **chaque ligne d'actif de chaque snapshot opposable** en porte
deux de plus, sous le **même** tampon. Deux snapshots du même dossier, sur un référentiel dont
le checksum n'a **pas** bougé, sortiraient identiques en `referentiel`, `checksum` et
`moteurVersion`, et différents en forme. Le précédent est le même : le bump 1.0.0 → 1.1.0 était
**déjà** un constat de revue de sécurité (STORY-401). ⇒ **`MOTEUR_VERSION` 1.6.0 → 1.7.0**.

⛔ **Et la sonde ne pouvait pas le voir** : elle ne figeait **aucune** forme de ligne du Bilan.
**Quatrième récidive** de la même famille (426 sur `controle`, 431 sur la racine du CR, 433 sur
le TFT). `champsLigneActif` et `champsLignePassif` y entrent. ⚠️ Reste hors sonde, dit
franchement : les **notes annexes**.

⚠️ Portée réelle : l'**empreinte d'export** n'est pas touchée (`modele-liasse` ne projette pas
les champs neufs), donc aucun document réédité ne change.

### Les cinq autres constats de revue

`amortN1` **n'avait aucune assertion discriminante** (mutation mesurée : le remplacer par `0`
laissait **992 tests verts**, alors que le contrat publie que `netN1 = brutN1 − amortN1` est
vérifiable par le client) · la branche « poste sans colonne brute » n'était couverte par rien,
et son `null` ressort en `0` estampillé `CALCULE` via le `?? 0` de la cascade · deux JSDoc
rendus faux par le diff (« Colonne N-1 : Net seul ») · la provenance des digests épinglés était
restée datée « STORY-429 », alors que **429 ajoutait un champ en fin de ligne et 434 modifie
une valeur en place** · côté `balance-service`, deux de mes affirmations étaient fausses (le
loader **lit** bien `operandes`, il ne retient pas `mode`) et `recopieLe` datait de la mauvaise
story.

### Une fixture qui ne gardait rien

La balance N-1 du premier test ne portait **aucun amortissement**, donc `brutN1 === netN1` :
remplacer l'un par l'autre laissait le test **vert**. Mesuré, puis N-1 doté d'un amortissement
antérieur de 100 000.

### Vérification docker réelle — rejouée sur l'état final

| Mesure | Résultat |
|---|---|
| artefact chargé | checksum `b54f6673…`, `integrity: verified` |
| poste `AI` servi | `brutN` 1 200 000, `amortN` **0**, `brutN1` 1 000 000, `amortN1` **0** |
| la dotation | `comptesNonMappes: ['283100']` — elle n'entre pas au Bilan |
| TFT | `FG` −200 000, `ZG` −200 000, `ecart` **0** — identique à l'ancien artefact |
| snapshots | v1 `@1.4.0`, v2 `@1.5.0`, v3 `@1.6.0` **sans** `brutN1` ; v4 `@1.7.0` **avec** |
| byte-identité | `sha256` identique **dans les deux conteneurs** |
| générateur | **reproductible** : relancé, les 5 artefacts sont byte-identiques |

### Portes

lint **0 warning** · build OK · **1396 unitaires** + **401 e2e** verts (`bilan-service`),
**3584** + **884** (`balance-service`) · couverture **98,75 / 93,70 / 98,63 / 98,74** et
**99,14 / 92,37 / 98,65 / 99,24** · **7 mutations rouges par assertion** sur 8 tentées.

⚠️ La 8ᵉ porte sur un **JSDoc** (AC-7) : un commentaire n'est pas servi, donc aucun test ne
peut le garder. Signalé plutôt que maquillé.

⚠️ **Flake e2e pré-existant** de `bilan-service` : une suite **différente** tombe à chaque
exécution complète, toujours sur un refus d'authentification ; verte en isolation. Fiché.
