# STORY-437 : Onze numéros de note sur les trente-cinq de la liasse déposée, et aucun en dehors du Bilan actif — les renvois du compte de résultat ne mènent nulle part

Status: review

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel (`postes[].note`, `notes[]`) + `scripts/referentiels`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx` (44 feuilles de notes).

---

## Le fait

```
notes déclarées par le paquet : 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17   → 11
postes qui portent un renvoi   : AD, AI, AP, AQ, BA, BB, BI, BJ, BQ, BR, BS, BU, BH
                                 → TOUS de `BILAN_ACTIF`
postes du BILAN_PASSIF avec note      : 0
postes du COMPTE_RESULTAT avec note   : 0
```

La DSF déposée compte **44 feuilles de notes pour 35 numéros** (`3A`, `3B`, `3C`, `3D`, `3E`,
`8A`, `15A/B`, `16A/B/Bbis/C`, `23-24`, `27A/B`). La « note 3 » du paquet en recouvre **cinq**
à elle seule.

⚡ **Et l'écran voisin affiche déjà les renvois manquants.** Le compte de résultat (FE-032)
imprime `21`, `22`, `23`, `24`, `25`, `26`, `27`, `28`, `29`, `30`, `3C&28`, `3D`, `6`, `12`
dans sa colonne « Note » — **relevés sur le formulaire, pas sur le contrat**. Un comptable qui
clique sur « note 27 » (charges de personnel) ne trouvera rien. C'est le manque que
**STORY-427 §③** avait relevé côté compte de résultat ; celle-ci en est la moitié *annexes*.

## Critères d'acceptation

- [ ] AC-1 — Les postes du `COMPTE_RESULTAT` et du `BILAN_PASSIF` du paquet
      `syscohada-revise@2.1` portent leur `note`, relevée sur le formulaire GUIDEF/DSF.
- [ ] AC-2 — `pkg.notes` déclare les **35 numéros** avec leur titre officiel et leur `mode`
      (`VENTILATION` quand le détail est dérivable de la balance, `TRAME` sinon).
- [x] AC-3 — La **granularité des sous-notes** est portée : soit `note: '3A'` sur les postes,
      soit un champ `sousNotes: string[]` sur la `NoteMeta`. **À trancher à la rédaction** —
      mais pas à éluder : c'est la clé de navigation d'un réviseur.
- [x] AC-4 — `NotesAnnexesProduit.notes` sort **ordonné par numéro de note du formulaire**, pas
      par ordre d'apparition des postes.
- [x] AC-5 — Agnosticisme P7 : `sfd-bceao@2.0` continue de rendre `notes: []` /
      `statut: 'NON_APPLICABLE'`. Aucun titre, aucun numéro codé en dur dans le moteur — la
      règle « une note sans titre déclaré rend `libelle: null` » est **conservée**.
- [x] AC-6 — Un test de couverture : tout poste de `BILAN_ACTIF`/`BILAN_PASSIF`/`COMPTE_RESULTAT`
      qui porte une `note` a une `NoteMeta` correspondante, et réciproquement — pas de renvoi orphelin.

## Conséquences ailleurs

- **FE-033** affiche « 11 notes produites sur les 35 de la liasse déposée » et
  « états d'origine couverts : 1 / 3 ». Sans cette story, l'onglet Notes annexes est **une annexe
  de l'actif**, pas les annexes de la liasse.
- **FE-032** : la colonne « Note » du compte de résultat devient enfin **servie** au lieu d'être
  relevée sur le formulaire (elle est déjà l'AC-3 de STORY-427 — les deux se recoupent, **les
  instruire ensemble**).

---

## Progress Tracking

**Statut : `review`** — **et PAS `done`, délibérément.** AC-3, AC-4, AC-5 et AC-6 sont implémentés,
validés, revus (code + sécurité) et mergés — PR `bilan-service` **#68** (3 commits) rebase-mergée sur
`dev` le 2026-09-02. Mais **AC-1 et AC-2 ne sont pas livrés**, et ce sont eux qui portent le titre de
la story : *les renvois du compte de résultat ne mènent toujours nulle part*. Clore en `done`
affirmerait que le problème est réglé.

⛔ **Ce qui bloque, et ce qu'il faut décider** (arbitrage PO) :

1. **Les 12 titres officiels manquants** (`21`…`30`, `3C&28`, `3D`) — à relever sur le formulaire
   GUIDEF/DSF, absent du dépôt. `NoteMeta.libelle` est requis et ne s'invente pas.
2. **Les renvois COMPOSITES** — `RL` et `RN` renvoient à `3C&28`, soit **deux notes sur un poste**.
   Le champ `note` est une chaîne unique ; l'AC-3 ne tranche que la granularité des sous-notes, pas
   la **multiplicité**. C'est une décision de conception, pas une transcription.
3. **Le bilan passif** n'a de renvoi nulle part, pas même dans la maquette.

⚠️ **Les 32 couples du compte de résultat, eux, sont DÉJÀ transcrits** dans la maquette FE-032 : la
reprise part de là, **jamais du classeur** (cf. STORY-428).

### ⛔ AC-1 et AC-2 non livrés — et il faut être EXACT sur ce qui manque

Ma première rédaction disait « la donnée n'existe nulle part » : **c'était faux**, et la revue de
code l'a pris. Le tableau réel :

| Ce qui manque vraiment | Mesure |
|---|---|
| ✅ Les **32 couples poste→note du compte de résultat** existent | `docs/prototypes/prospera-prototype.html`, colonne « Note » de FE-032, **relevés sur la liasse déposée** |
| ⛔ Les **TITRES** manquent | sur les **14 numéros** que ces couples citent, **2 seulement** (`6`, `12`) ont une `NoteMeta` ; les **12 autres** (`21`…`30`, `3C&28`, `3D`) n'ont de titre **nulle part** |
| ⛔ **Deux couples sont COMPOSITES** | `RL` et `RN` renvoient à **`3C&28`**, soit **deux notes sur un poste**. `note` est une chaîne unique : le contrat ne sait pas l'exprimer, et l'AC-3 ne tranche que la **granularité**, pas la **multiplicité** |
| ⛔ Le **bilan passif** n'a de renvoi nulle part | pas même dans la maquette, qui l'écrit : « aucun poste du passif non plus » |

⇒ `NoteMeta.libelle` est **requis** et ne s'invente pas : **l'AC-1 ne peut pas atterrir sans
l'AC-2**, et le garde-fou de l'AC-6 — que cette même story livre — le rend littéralement
infranchissable. Une donnée réglementaire absente **se reporte, elle ne se reconstitue pas**
(STORY-427, STORY-434, STORY-435).

⚡ **Et la correction de cette justification était le premier constat BLOQUANT de la revue** :
écrire « la donnée n'existe nulle part » aurait envoyé la prochaine story re-transcrire depuis le
classeur DSF **32 couples déjà transcrits et déjà validés à l'écran** — c'est-à-dire rouvrir le
risque de STORY-428, où aligner sur la « mauvaise » source a rendu **quatre libellés faux**.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-3 | **Tranché** : le poste porte le numéro **tel que le formulaire l'imprime** (`note: '3A'`), chaque sous-note déclare sa propre `NoteMeta`. **Rien n'est ajouté au contrat**. |
| AC-4 | Les notes sortent dans l'**ordre du formulaire**, et la garantie **atteint le contrat publié**. |
| AC-5 | SFD-BCEAO (deux versions) et CIMA : ni note déclarée, ni note citée. Aucun numéro codé dans le comparateur ; `libelle: null` conservé. |
| AC-6 | Garde-fou « pas de renvoi orphelin », **dans les deux sens**, sur les cinq paquets. |

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

**AC-6, ce qu'il rend impossible.** La transcription des AC-1/AC-2 ne peut plus se faire **à
moitié** : un renvoi sans `NoteMeta` rougit, une `NoteMeta` que plus aucun poste ne cite aussi. Un
test **fige le manque** — « aucun renvoi hors du Bilan actif », avec les comptes 29 et 43 — et
rougira le jour de la transcription, obligeant à le mettre à jour en connaissance de cause.

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

### Vérification

Lint 0 warning · build OK · **1 491** unitaires + **409** e2e verts · couverture
**98,74 / 93,81 / 98,67 / 98,72** · `numero-note.ts` à **100 / 100 / 100 / 100**.

**6 mutations**, chacune rouge sur l'assertion visée : tri neutralisé (deux formes), tri redevenu
lexical, suffixe ignoré, comparateur neutralisé, exemple du contrat remis dans le mauvais ordre.

**Vérification docker — rejouée sur l'état final** : le conteneur sert
`3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17` (la note 17 est passée en queue), et son `/api/docs-json`
publie la garantie d'ordre avec un exemple qui la respecte.

### Hooks et dettes nommés

- **AC-1/AC-2 à reprendre ensemble**, avec les 32 couples **déjà transcrits dans la maquette**
  (ne pas re-transcrire depuis le classeur), les **12 titres** manquants, et une **décision sur les
  renvois composites** (`3C&28`) que le contrat ne sait pas exprimer.
- **R2** (revue de sécurité, non traitée) : le comparateur fusionne `'3'`/`'03'`/`'3 '` et tout
  entier ≥ 2⁵³ — résolu par la stabilité de `sort`, donc **déterministe**, et aucun paquet n'en
  déclare.
- **R3** : consulter une liasse validée **avant** ce bump la re-produit dans le nouvel ordre alors
  que son snapshot garde l'ancien. Comportement de conception documenté pour tout bump, distingué
  par `moteurVersion`, et le chemin opposable reste correct.
- **STORY-438** est la suite directe (les notes 3/6/7 totalisent du **net** là où le formulaire
  attend brut, dépréciations, puis net).

