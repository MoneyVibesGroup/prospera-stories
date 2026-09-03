# STORY-437 : Onze numéros de note sur les trente-cinq de la liasse déposée, et aucun en dehors du Bilan actif — les renvois du compte de résultat ne mènent nulle part

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel (`postes[].note`, `notes[]`) + `scripts/referentiels`
**Points :** 5 → **8** (le périmètre réel de l'AC-2 est de 35 numéros, pas de 12 titres — voir *Chiffrage*)
**Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx` (44 feuilles de notes).

---

## ⚖️ Décision PO du 2026-09-03 — la source de vérité est la BALANCE et le BILAN GUIDEF

**La maquette n'est plus la source pour cette story.** Les renvois et les titres se relèvent sur la
**liasse GUIDEF déposée** (`1000745307_2025_Definitif (1).xlsx`) et sur la **balance**
(`Balance_des_comptes.pdf`). La maquette redevient ce qu'elle est : un **écran**, pas un référentiel.

⚡ **Cette décision n'est pas un arbitrage de confort : elle est contre-vérifiée dans les deux sens,
et c'est ce qui débloque la story.**

| Contre-épreuve | Résultat |
|---|---|
| Les **29 postes du `BILAN_ACTIF`** du paquet livré (transcrits, revus, mergés) vs la colonne `E` de la feuille `BILAN ACTIF` | **0 écart sur 29** |
| Les **29 réf. communes** du compte de résultat, maquette FE-032 vs colonne `H` de la feuille `COMPTE DE RESULTAT` | **0 écart sur 29** |
| Ce que le GUIDEF donne **en plus** de la maquette | `TA`, `TB`, `TC`, `TD` → note `21` (4 couples que FE-032 n'imprime pas) |

⇒ Le seul état déjà transcrit **valide le classeur comme source**, et la maquette **concorde** là où
elle parle. Le risque de STORY-428 — aligner sur la « mauvaise » source — est **mesuré à zéro ici**,
et le classeur est **strictement plus riche**. Il n'y a plus de raison de passer par l'écran, ni
d'attendre qu'il soit étendu.

## ⛔ Correction du « fait » : trois affirmations de la rédaction précédente étaient FAUSSES

Ce sont elles qui déclaraient la story bloquée. Chacune est falsifiée par la mesure.

| Affirmation précédente | Mesure |
|---|---|
| « les **12 titres** n'ont de titre **nulle part**, le formulaire est absent du dépôt » | ⛔ **Faux.** Les **45 titres** sont imprimés sur les feuilles de notes du classeur, à la racine du dossier de travail. Cellules de titre **non saisissables** : c'est le CERFA, pas une déclaration de l'entreprise. **Annexe B.** |
| « le **bilan passif** n'a de renvoi nulle part, pas même dans la maquette » | ⛔ **Faux.** La colonne `F` de la feuille `BILAN PASSIF` porte **21 renvois**, dont `CE → 3E` (*Écarts de réévaluation*), que la maquette n'a jamais transcrit. **Annexe A.** |
| « la colonne `Réf.` est vide, l'appariement se ferait par libellé » | ⛔ **Faux** (erreur de lecture : cellules fusionnées `C:D`). La colonne **`B` porte les codes postes** (`AD`, `CE`, `RL`…). L'appariement est **par code**, exact, sans heuristique. |

**Le fait, corrigé et mesuré :**

```
notes déclarées par le paquet   : 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17   → 11 sur 35
renvois portés par le paquet    : 13   (BILAN_ACTIF seul)
renvois portés par le GUIDEF    : 66   (13 actif + 21 passif + 32 résultat)
                                ⇒ 53 renvois à porter, sur DEUX états entiers
titres officiels disponibles    : 45   (44 feuilles ; « NOTE 23 24 » en porte deux)
```

## ⚡ Ce qui bloquerait VRAIMENT — et que l'AC-7 lève

Le garde-fou AC-6 livré par cette story — *« toute `NoteMeta` déclarée est CITÉE par au moins un
poste »* — **est faux comme règle**, et il rendrait l'AC-2 infranchissable le jour où on déclare les
35 numéros. Mesuré : **18 feuilles ne sont citées par aucun état**, et c'est **normal
comptablement** :

- **notes autonomes** — `1` (dettes garanties par des sûretés réelles), `2` (informations
  obligatoires), `8A` (étalement des charges immobilisées), `31` à `35` (répartition du résultat,
  production, achats destinés à la production, indicateurs, informations sociales). Elles ne se
  rattachent à **aucune ligne d'état** : ce sont des annexes de plein droit, pas des justifications
  de poste ;
- **sous-notes d'un parent cité** — `3A`, `3B`, `15A`, `15B`, `16A`, `16B`, `16Bbis`, `16C`, `27A`,
  `27B`. L'état imprime le **parent** (`3`, `15`, `16`, `27`) ; les feuilles n'existent qu'en
  sous-notes.

⛔ **Et le parent n'est pas une commodité de mise en page.** La feuille `BILAN ACTIF` n'a **qu'une
colonne « Note » (`E`) pour trois colonnes de montants** (`F`=BRUT, `G`=AMORT et DEPREC, `H`=NET).
Le brut de `AI` se justifie en **3A**, sa colonne amortissements en **3C**, ses cessions en **3D** :
le formulaire ne peut pas imprimer trois renvois dans une colonne, il imprime `3` — **le dossier
immobilisations**. Le renvoi est au niveau de la **ligne**, pas de la **cellule**. Pointer `3A`
perdrait l'amortissement ; éclater en `3A…3E` dirait que le brut se justifie par le tableau des
amortissements. Les deux sont faux au fond.

## ⚡ `3C&28` est un objet DIFFÉRENT du parent — ne pas les confondre

`RL` (*Dotations aux amortissements, aux provisions et dépréciations*) agrège **deux natures** : les
dotations aux amortissements se justifient au tableau des amortissements (**3C**), les dotations aux
provisions à l'état des provisions inscrites au bilan (**28**). Deux familles, pas deux sous-notes
d'un même parent.

**La preuve est sur la feuille elle-même** : la ligne symétrique `TJ` (*Reprises d'amortissements,
provisions et dépréciations*) ne porte que `28`, **jamais** `3C&28`. Le formulaire imprime bien ici
une **liste**, avec un `&`.

⇒ Le parent se résout **par préfixe** (AC-7) ; le composite s'exprime **par une liste** (AC-8). Deux
mécanismes, deux critères. Aucun titre inventé dans un cas comme dans l'autre.

---

## Critères d'acceptation

- [ ] **AC-1** — Les postes du `COMPTE_RESULTAT` et du `BILAN_PASSIF` du paquet
      `syscohada-revise@2.1` portent leur `note`, **relevée par code poste** sur les colonnes `F`
      (passif) et `H` (résultat) du GUIDEF. **Les 53 couples sont en Annexe A** : la transcription
      est une recopie, pas un relevé. Le `BILAN_ACTIF` est déjà conforme (0 écart mesuré) et **ne
      doit pas être retouché**.
- [ ] **AC-2** — `pkg.notes` déclare les **35 numéros / 45 feuilles** avec leur **titre officiel
      imprimé** (Annexe B, recopié tel quel) et leur `mode` : **`VENTILATION`** quand le détail de
      la note est dérivable de la **balance** (comptes du plan), **`TRAME`** sinon. Sont `TRAME` par
      construction — aucun compte ne les produit : `1`, `2`, `3A`…`3E`, `16B`, `16Bbis`, `16C`,
      `27B`, `31` à `35`.
- [x] AC-3 — La **granularité des sous-notes** est portée : le poste porte le numéro **tel que le
      formulaire l'imprime**, chaque sous-note déclare sa propre `NoteMeta`. **Tranché et livré**,
      rien n'a été ajouté au contrat.
- [x] AC-4 — `NotesAnnexesProduit.notes` sort **ordonné par numéro de note du formulaire**, pas par
      ordre d'apparition des postes.
- [x] AC-5 — Agnosticisme P7 : `sfd-bceao@2.0` continue de rendre `notes: []` /
      `statut: 'NON_APPLICABLE'`. Aucun titre, aucun numéro codé en dur dans le moteur — la règle
      « une note sans titre déclaré rend `libelle: null` » est **conservée**.
- [x] AC-6 — Garde-fou « pas de renvoi orphelin », dans les deux sens. **Livré — puis amendé par
      l'AC-7, qui en corrige la règle.**
- [ ] **AC-7 (nouveau) — le garde-fou AC-6 est amendé dans ses DEUX sens, sinon il bloque l'AC-2.**
      Zéro champ ajouté au contrat :
      - **sens aller** — un renvoi est servi s'il résout vers au moins une `NoteMeta`,
        **directement OU par préfixe** : `3` est servi parce que `3A`…`3E` existent, `27` par
        `27A`/`27B`, `15` par `15A`/`15B`, `16` par `16A`/`16B`/`16Bbis`/`16C`. Le découpage
        `(entier de tête, suffixe)` de `numero-note.ts` **sait déjà le faire** ;
      - **sens retour** — une `NoteMeta` non citée est **légitime** quand c'est une note autonome ou
        une sous-note d'un parent cité. La garde devient : *toute `NoteMeta` est citée, OU est une
        sous-note d'un numéro cité, OU figure dans la liste **déclarée** des notes autonomes du
        paquet*. ⛔ **La liste des autonomes se déclare dans le PAQUET, jamais dans le moteur** —
        sinon P7 tombe et le comparateur redevient un dictionnaire SYSCOHADA ;
      - le test qui **fige le manque** (« aucun renvoi hors du Bilan actif », comptes 29 et 43) est
        **retiré et remplacé** par les comptes mesurés : **13 / 21 / 32**.
- [ ] **AC-8 (nouveau) — multiplicité et casse du renvoi.**
      - `postes[].note` accepte **`string | string[]`** ; `RL` et `RN` portent `["3C", "28"]`.
        **Champ additif, rétrocompatible** : une chaîne reste une chaîne, les 13 renvois de l'actif
        ne bougent pas.
      - ⚠️ Le GUIDEF écrit `3e` **en minuscule** sur `CE` alors que la feuille s'intitule `NOTE 3E`.
        `comparerNumerosDeNote` **majuscule le suffixe**, donc le *tri* n'y voit rien — mais `3e` et
        `3E` sont **deux clés distinctes** dans l'index `note → NoteMeta` et dans les ensembles de
        l'AC-6/AC-7 : le renvoi de `CE` serait orphelin **sans qu'aucun test d'ordre ne rougisse**.
        Normaliser à la transcription, et un test le dit.
- [ ] **AC-9 (nouveau) — réaligner les 11 titres déjà livrés sur les titres officiels.** Ce ne sont
      pas des variantes de style : **deux sont faux au fond**.
      - `12` — paquet : *« Écart de conversion-**Actif** »* / GUIDEF : **« ECARTS DE CONVERSION »**.
        La note sert l'actif (`BU`), le passif (`DV`) **et** le compte de résultat (`TI`, `TM` —
        transferts de charges). Le titre actuel dit au réviseur qu'elle ne concerne que l'actif : il
        ne rapprochera **jamais** les trois autres.
      - `17` — paquet : *« Fournisseurs, avances versées »* = le libellé d'une **ligne d'actif**
        (`BH`). Le titre de la note est **« FOURNISSEURS D'EXPLOITATION »**, une ligne de **passif**
        (`DJ`). On a pris le renvoi pour la note.
      - ⇒ La liasse est un **document opposable** : le libellé au dossier doit être celui que l'OTR
        lit. Et un paquet moitié officiel / moitié paraphrasé est ingérable — dans six mois personne
        ne saura plus lequel fait foi. Bump de `MOTEUR_VERSION` assumé : c'est exactement ce à quoi
        il sert, et la **R3** le documente déjà.

---

## Annexe A — les 66 renvois, relevés par code poste sur le GUIDEF

Colonne `B` = `Réf.` ; colonne de note = `E` (actif) / `F` (passif) / `H` (résultat).

`BILAN_ACTIF` — **13 renvois** · déjà dans le paquet, **0 écart sur 29 postes** : ne pas retoucher.

```
  AD→3         AI→3         AP→3         AQ→4         BA→5         BB→6
  BH→17        BI→7         BJ→8         BQ→9         BR→10        BS→11
  BU→12
```

`BILAN_PASSIF` — **21 renvois** · absents du paquet ET de la maquette.

```
  CA→13        CB→13        CD→14        CE→3e        CF→14        CG→14
  CH→14        CL→15        CM→15        DA→16        DB→16        DC→16
  DH→5         DI→7         DJ→17        DK→18        DM→19        DN→19
  DQ→20        DR→20        DV→12
```

`COMPTE_RESULTAT` — **32 renvois** · 29 concordent avec FE-032 (**0 écart**), 4 en plus
(`TA`/`TB`/`TC`/`TD`), 1 total non renvoyé.

```
  TA→21        RA→22        RB→6         TB→21        TC→21        TD→21
  TE→6         TF→21        TG→21        TH→21        TI→12        RC→22
  RD→6         RE→22        RF→6         RG→23        RH→24        RI→25
  RJ→26        RK→27        TJ→28        RL→3C&28     TK→29        TL→28
  TM→12        RM→29        RN→3C&28     TN→3D        TO→30        RO→3D
  RP→30        RQ→30
```

⚠️ **Aucune ligne de total (`AZ`, `BZ`, `CP`, `DZ`, `XA`…`XI`) ne porte de renvoi** — un total ne se
justifie pas par une note, il se justifie par ses composantes. C'est la même frontière que le
`repere` du TFT (STORY-435) : ne pas la franchir.

## Annexe B — les 45 titres officiels, recopiés des feuilles de notes

⚠️ **Recopier tel quel, casse et parenthèses comprises.** Le paquet est un document opposable ; ces
chaînes sont celles que l'OTR lit. `NOTE 23 24` est **une feuille pour deux numéros** ; `16B` et
`16Bbis` portent **le même titre**, ce n'est pas une erreur de saisie.

| # | Titre officiel imprimé |
|---|---|
| `1` | DETTES GARANTIES PAR DES SURETES REELLES |
| `2` | INFORMATIONS OBLIGATOIRES |
| `3A` | IMMOBILISATION BRUTE |
| `3B` | BIENS PRIS EN LOCATION ACQUISITION |
| `3C` | IMMOBILISATIONS AMORTISSEMENTS |
| `3D` | IMMOBILISATIONS (PLUS-VALUE ET MOINS-VALUE DE CESSIONS) |
| `3E` | INFORMATIONS SUR LES REEVALUATIONS EFFECTUEES PAR L'ENTITE |
| `4` | IMMOBILISATIONS FINANCIERES |
| `5` | ACTIF CIRCULANT HAO |
| `6` | STOCKS ET EN-COURS (1) |
| `7` | CLIENTS |
| `8` | AUTRES CREANCES |
| `8A` | TABLEAU D'ETALEMENT DES CHARGES IMMOBILISEES |
| `9` | TITRES DE PLACEMENT |
| `10` | VALEURS A ENCAISSER |
| `11` | DISPONIBILITES |
| `12` | ECARTS DE CONVERSION |
| `13` | CAPITAL |
| `14` | PRIMES ET RESERVES |
| `15A` | TOTAL SUBVENTIONS ET PROVISIONS REGLEMENTEES |
| `15B` | AUTRES FONDS PROPRES (1) |
| `16A` | DETTES FINANCIERES ET RESSOURCES ASSIMILEES |
| `16B` | ENGAGEMENTS DE RETRAITE ET AVANTAGES ASSIMILES ( METHODE ACTUARIELLE) |
| `16Bbis` | ENGAGEMENTS DE RETRAITE ET AVANTAGES ASSIMILES (METHODE ACTUARIELLE) |
| `16C` | ACTIFS ET PASSIFS EVENTUELS |
| `17` | FOURNISSEURS D'EXPLOITATION |
| `18` | DETTES FISCALES ET SOCIALES |
| `19` | AUTRES DETTES ET PROVISIONS POUR RISQUES A COURT TERME |
| `20` | BANQUES, CREDIT D'ESCOMPTE ET DE TRESORERIE |
| `21` | CHIFFRE D'AFFAIRES ET AUTRES PRODUITS |
| `22` | ACHATS |
| `23` | TRANSPORTS |
| `24` | SERVICES EXTERIEURS |
| `25` | IMPÔTS ET TAXES |
| `26` | AUTRES CHARGES |
| `27A` | CHARGES DE PERSONNEL |
| `27B` | EFFECTIFS, MASSE SALARIALE ET PERSONNEL EXTERIEUR |
| `28` | PROVISIONS ET DEPRECIATIONS INSCRITES AU BILAN |
| `29` | CHARGES ET REVENUS FINANCIERS |
| `30` | AUTRES CHARGES ET PRODUITS HAO |
| `31` | REPARTITION DU RESULTAT ET AUTRES ELEMENTS CARACTERISTIQUES DES CINQ DERNIERS EXERCICES |
| `32` | PRODUCTION DE L'EXERCICE |
| `33` | ACHATS DESTINES A LA PRODUCTION |
| `34` | FICHE DE SYNTHESE DES PRINCIPAUX INDICATEURS FINANCIERS |
| `35` | LISTE DES INFORMATIONS SOCIALES, ENVIRONNEMENTALES ET SOCIETALES A FOURNIR |

## Chiffrage — pourquoi 5 points ne tenaient pas

L'ancien chiffrage reposait sur « 12 titres ». Le périmètre réel : **53 renvois** sur deux états
entiers, **34 titres** à ajouter, **11 à réaligner**, **deux amendements de contrat** (AC-7, AC-8) et
un bump de `MOTEUR_VERSION`. → **8 points**.

**Découpage possible si le PO préfère trois cartes** (le contrat d'abord, sinon STORY-439 part sur
du sable) : **437a** contrat AC-7/AC-8 + les 45 `NoteMeta` + réalignement AC-9 · **437b** les 32
renvois du compte de résultat · **437c** les 21 renvois du bilan passif.

## Conséquences ailleurs

- **FE-033** affiche « 11 notes produites sur les 35 de la liasse déposée » et « états d'origine
  couverts : 1 / 3 ». Avec cette story : **35 / 35** et **3 / 3**.
- **FE-032** : la colonne « Note » du compte de résultat devient **servie** au lieu d'être relevée
  sur le formulaire (elle est déjà l'AC-3 de STORY-427). ⚡ **Et la maquette gagne 4 renvois qu'elle
  n'imprime pas** : `TA`, `TB`, `TC`, `TD` → `21`. C'est un écart **maquette ⟶ à corriger**, pas
  l'inverse.
- **FE-033 / bilan passif** : la maquette écrit « aucun poste du passif non plus ». **Cette phrase
  est fausse** et doit être retirée : le passif porte 21 renvois sur la liasse déposée.
- ⛔ **STORY-439** (`ready-for-dev`, branche `MNV-439` ouverte) : ses deux premiers rapprochements
  portent sur les notes **3A** et **3C**, que le paquet ne déclare pas encore. **Elle a besoin de
  l'AC-2.** Et un avertissement de conception à lui porter : **`note` est un renvoi documentaire,
  jamais un rapprochement chiffré.** `RK → 27` ne veut pas dire « total de la note 27 = charges de
  personnel » (la `27B` est un état d'effectifs, elle ne s'additionne à rien) ; `RL → ["3C","28"]`
  ne veut pas dire « 3C + 28 = dotations de l'exercice ». Les rapprochements de 439 restent
  **déclarés explicitement**, comme son tableau les écrit.

---

## Progress Tracking

**Statut : `ready-for-dev`** — AC-3, AC-4, AC-5 et AC-6 sont implémentés, validés, revus (code +
sécurité) et mergés — PR `bilan-service` **#68** (3 commits) rebase-mergée sur `dev` le 2026-09-02.
**AC-1 et AC-2 restent à livrer**, avec les trois critères que l'analyse du 2026-09-03 a fait
apparaître (**AC-7**, **AC-8**, **AC-9**).

### ✅ Le blocage est levé — et il faut dire par quoi

La rédaction précédente déclarait trois blocages. **Deux n'existaient pas** (les titres et les
renvois du passif sont dans le classeur ; voir la table de correction plus haut), et le troisième —
le composite `3C&28` — n'était pas une impasse mais **une décision de conception**, tranchée
ci-dessus en AC-8.

⚡ **Le vrai blocage n'était nommé nulle part** : c'est le **sens retour de l'AC-6**, livré par cette
story même. « Toute `NoteMeta` déclarée est citée par au moins un poste » interdit de déclarer les
notes **1, 2, 8A, 31 à 35** — des annexes autonomes qui ne se rattachent à aucune ligne d'état — et
toutes les sous-notes d'un parent. **18 feuilles sur 45.** L'AC-2 était donc littéralement
infranchissable, non par manque de donnée, mais par une règle trop stricte. L'AC-7 la corrige.

⚠️ La note *« ne pas re-transcrire depuis le classeur »* de la version précédente est **caduque**
depuis la décision PO du 2026-09-03 : le classeur **est** la source, et sa concordance avec les deux
transcriptions existantes est mesurée à **0 écart sur 58 postes**.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-3 | **Tranché** : le poste porte le numéro **tel que le formulaire l'imprime** (`note: '3A'`), chaque sous-note déclare sa propre `NoteMeta`. **Rien n'est ajouté au contrat**. |
| AC-4 | Les notes sortent dans l'**ordre du formulaire**, et la garantie **atteint le contrat publié**. |
| AC-5 | SFD-BCEAO (deux versions) et CIMA : ni note déclarée, ni note citée. Aucun numéro codé dans le comparateur ; `libelle: null` conservé. |
| AC-6 | Garde-fou « pas de renvoi orphelin », **dans les deux sens**, sur les cinq paquets. **Son sens retour est amendé par l'AC-7.** |

**AC-3, la décision et son motif.** L'alternative — un `sousNotes: string[]` sur la note mère —
dirait *que* la note 3 se subdivise **sans dire quel poste relève de quelle sous-note** : elle
perdrait exactement la navigation que l'AC appelle « la clé d'un réviseur ». Le champ `note` étant
déjà une chaîne libre, le mécanisme n'a rien coûté au contrat ; c'est le comparateur qui fait le
reste (`3 < 3A < 3B < 4 < 16B < 16Bbis < 23-24`).

**AC-4, le défaut mesuré.** *La note **17** sortait entre la **6** et la **7***, parce que le poste
`BU` qui la porte est déclaré là dans le Bilan actif. Un réviseur qui suit la liasse page à page ne
retrouvait pas ses notes. Les deux tris « évidents » sont faux, et le comparateur les nomme : le tri
**lexical** rend `10, 11, 12, 17, 3, 4…`, un `Number()` échoue sur les **sous-notes** de la liasse
déposée (`3A`…`3E`, `8A`, `15A/B`, `16A/B/Bbis/C`, `23-24`, `27A/B` — 44 feuilles pour 35 numéros).

**AC-6, ce qu'il rend impossible — et ce qu'il interdisait à tort.** La transcription des AC-1/AC-2
ne peut plus se faire **à moitié** : un renvoi sans `NoteMeta` rougit. Ce sens-là est bon et il est
conservé. ⛔ Le **sens retour**, lui, était une sur-contrainte : voir l'AC-7.

`MOTEUR_VERSION` 1.9.0 → **1.10.0** : le nombre de lignes ne change pas, **leur ordre si**, et un
snapshot est un document ordonné qu'un tiers relit page à page.

### ⛔ Revue de code — 6 constats, dont DEUX bloquants

Le second bloquant : **la garantie d'ordre n'atteignait pas le contrat**. La description publiée
disait toujours « ordonnées selon le référentiel » et l'`example` publiait la note **11 avant la
3** — un ordre que le moteur ne peut plus produire. Un intégrateur FE-033 qui en fait sa fixture
testerait son sommaire sur une séquence impossible ; la seule story censée fixer l'ordre n'aurait
**rien publié**. Patron de STORY-400 et STORY-432 (un document qui se contredit lui-même).

Les quatre autres, tous mesurés :

- ③ le test AC-3 était **tautologique** : son entrée était déjà triée et `sort` est stable — mesuré,
  `() => 0` le laissait vert ;
- ④ le tri n'était gardé que par le spec du **TFT**, thématiquement étranger — mesuré, le retirer
  laissait **1 086 tests sur 1 087** verts. La fixture du spec du service déclare désormais ses
  postes dans le désordre (`99, 20, 7, 3`) ;
- ⑤ `zone-franche-togo@1.0` n'était couvert ni par la non-vacuité ni par la liste des paquets
  muets : ses deux `toEqual([])` pouvaient passer sur du vide ;
- ⑥ `localeCompare` **sans locale** — mesuré, `et` classe `S` avant `Z` avant `T`, `lt` place `Y`
  entre `I` et `J` : deux conteneurs de locale différente rendraient **deux ordres pour le même
  `MOTEUR_VERSION`**, la confusion exacte que ce tampon existe pour empêcher.

### Revue de sécurité — aucun constat, une réserve refermée

**Aucune vulnérabilité** au seuil. Trois angles éprouvés **par la mesure** :

1. **Cohérence du comparateur** — force brute sur 51 entrées adverses, **2 601 paires et 132 651
   triplets** : zéro `NaN`, zéro asymétrie, zéro violation de transitivité. C'est ce qui garantit
   que `Array.prototype.sort` a un ordre **défini** — un comparateur incohérent aurait rendu deux
   productions différentes sous le même tampon. Écarter `localeCompare` est **le** point qui protège
   la reproductibilité.
2. **Document opposable** — le snapshot fige la liasse **entière**, ordre compris, et l'export d'une
   version figée relit `snapshot.liasse` **sans recalcul**. `moteurVersion` n'est comparé que par
   **égalité** partout : le piège `"1.10.0" < "1.9.0"` ne se déclenche pas.
3. **Fuite** — néant.

⚡ **Réserve R1 refermée** : la regex de découpe rétro-traquait en **O(N²)** — `$` sans drapeau `m`
n'acceptant pas de saut de ligne final, `.*` ne pouvait pas consommer un `\n`. *Mesuré : 80 001
chiffres suivis d'un `\n` → **5,4 s**, contre **0 ms** avec `[\s\S]*`.* Le chemin est inatteignable
aujourd'hui (paquet embarqué vérifié par sha256 ; les clés de complément de STORY-436 n'entrent
jamais ici), mais la source a vocation à devenir un **registre distant** : une charge armée ne se
laisse pas branchée pour un caractère. Un test la mesure.

### Vérification (état à la PR #68)

Lint 0 warning · build OK · **1 491** unitaires + **409** e2e verts · couverture
**98,74 / 93,81 / 98,67 / 98,72** · `numero-note.ts` à **100 / 100 / 100 / 100**.

**6 mutations**, chacune rouge sur l'assertion visée : tri neutralisé (deux formes), tri redevenu
lexical, suffixe ignoré, comparateur neutralisé, exemple du contrat remis dans le mauvais ordre.

**Vérification docker — rejouée sur l'état final** : le conteneur sert
`3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17` (la note 17 est passée en queue), et son `/api/docs-json`
publie la garantie d'ordre avec un exemple qui la respecte.

### Vérification attendue sur AC-1/AC-2/AC-7/AC-8/AC-9

- le conteneur sert les **35 numéros** dans l'ordre du formulaire, `1` en tête et `35` en queue ;
- un test **par état** compte les renvois : `BILAN_ACTIF` **13**, `BILAN_PASSIF` **21**,
  `COMPTE_RESULTAT` **32** — le test « aucun renvoi hors du Bilan actif » est **supprimé** ;
- une mutation qui remet `3e` en minuscule dans le paquet **rougit** (AC-8), et une qui retire `28`
  de `RL` **rougit** aussi ;
- une mutation qui retire la note `1` de la liste des autonomes déclarées **rougit** (AC-7, sens
  retour), et une qui déclare `27A` sans `27B` **ne rougit pas** — c'est le comportement voulu.

### Hooks et dettes nommés

- **R2** (revue de sécurité, non traitée) : le comparateur fusionne `'3'`/`'03'`/`'3 '` et tout
  entier ≥ 2⁵³ — résolu par la stabilité de `sort`, donc **déterministe**, et aucun paquet n'en
  déclare. ⚠️ L'AC-8 rend cette réserve **plus proche** : la normalisation de casse touche le même
  chemin. La traiter dans la même livraison si elle coûte peu.
- **R3** : consulter une liasse validée **avant** ce bump la re-produit dans le nouvel ordre alors
  que son snapshot garde l'ancien. Comportement de conception documenté pour tout bump, distingué
  par `moteurVersion`, et le chemin opposable reste correct.
- **STORY-438** est la suite directe (les notes 3/6/7 totalisent du **net** là où le formulaire
  attend brut, dépréciations, puis net).
- **STORY-439** a besoin de l'AC-2 (notes `3A` et `3C`) — voir *Conséquences ailleurs*.
