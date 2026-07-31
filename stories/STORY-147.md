# STORY-147 : `balance-service` — la balance porte ses **soldes débiteur / créditeur** en plus de ses mouvements (balance à 4 colonnes) + double contrôle d'équilibre

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A25 · `rapport-bilan-logique-metier-2026-07-12.md` §12 (contrôles GUIDEF) · **STORY-101** (contrat canonique — `LigneBalance`, `SommaireBalance`, checksum) · **STORY-086** (adaptateur Sage) · **STORY-085** (ventilation cahiers) · **STORY-102** (ingestion directe) · **STORY-087** (à-nouveaux) · **STORY-098** (contrôles de cohérence — **consommateur direct**)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** high
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-31
**Sprint :** 19
**Service :** `balance-service` (:3007)
**Branche :** `MNV-147`
**Demande :** PO, 2026-07-31 — « on doit normalement avoir un solde débit et un solde crédit surtout au niveau de la balance »
**⚠️ Modification du contrat KEYSTONE (STORY-101)** — lire « Portée d'impact » avant d'estimer

---

## Le constat : deux colonnes qui ne savent pas ce qu'elles sont

`LigneBalance` (contrat canonique, STORY-101) porte **deux** colonnes de montant :

```ts
export interface LigneBalance {
  compte: string;
  libelle: string;
  debit: number;    // « Cumul débiteur, entier en unités mineures XOF (≥ 0) »
  credit: number;   // « Cumul créditeur, entier en unités mineures XOF (≥ 0) »
  niveauPreuve: NiveauPreuveBalance;
}
```

Le contrat les appelle des **cumuls** (= mouvements). Mais l'adaptateur Sage les remplit avec les
**soldes** — `sage.types.ts` dit littéralement « **Solde cumulé** débiteur (XOF, décimal) », et le
parser cherche des colonnes `débit`/`crédit`/**`solde`** en privilégiant « cumulé » puis « solde ».

**Le même champ transporte donc tantôt un mouvement, tantôt un solde, selon la source.** Personne en
aval ne peut savoir lequel il lit. C'est le défaut le plus grave possible sur un contrat keystone :
il est **silencieux**, il passe tous les tests, et il produit des états faux sans jamais lever d'erreur.

Une **balance générale** comptable, celle qu'un cabinet reconnaît et que la DSF attend, porte
**quatre** colonnes : **mouvements** débit / crédit **et** **soldes** débiteur / créditeur. Les deux
ne sont pas redondants et ne se déduisent pas l'un de l'autre dès qu'il y a des à-nouveaux.

---

## Pourquoi ce n'est pas « juste dériver `debit − credit` »

C'est l'objection immédiate, et elle est fausse pour trois raisons :

1. **Les à-nouveaux.** `solde = à-nouveau + mouvements`. Une balance de mouvements seuls ne permet pas
   de retrouver le solde sans le socle d'ouverture (STORY-087). Dériver donnerait un solde **faux**
   sur tout exercice qui n'est pas le premier.
2. **Le fichier source porte les deux, et ils peuvent DIVERGER.** Un export Sage tronqué, un mapping
   de colonnes erroné (STORY-088), un exercice mal borné : la divergence entre le solde **annoncé par
   le fichier** et le solde **recalculé** est un **contrôle d'intégrité de premier ordre**. Dériver le
   solde, c'est se rendre aveugle à l'erreur la plus fréquente d'un import.
3. **Les contrôles officiels portent sur les soldes.** « Actif = Passif » (STORY-098, contrôle n°1 de
   la GUIDEF) est une égalité de **soldes**, pas de mouvements. STORY-098 ne peut pas être écrite
   correctement sur le contrat actuel.

---

## User Story

En tant que **cabinet comptable**,
je veux que ma balance porte **ses mouvements et ses soldes**, chacun nommé pour ce qu'il est,
afin de **retrouver la balance que je connais** — et que les contrôles d'équilibre et d'articulation
portent sur la bonne grandeur, au lieu d'être calculés sur une colonne dont personne ne sait si elle
contient un mouvement ou un solde.

---

## Périmètre

### A. Le contrat de ligne passe à 4 colonnes

```ts
export interface LigneBalance {
  compte: string;
  libelle: string;
  /** Mouvements de l'exercice, entier ≥ 0, unités mineures XOF. */
  mouvementDebit: number;
  mouvementCredit: number;
  /** Solde à la date de la balance, entier ≥ 0, unités mineures XOF. */
  soldeDebiteur: number;
  soldeCrediteur: number;
  niveauPreuve: NiveauPreuveBalance;
}
```

- **Renommage explicite** de `debit`/`credit` en `mouvementDebit`/`mouvementCredit` : garder les
  anciens noms laisserait vivre l'ambiguïté qui est l'objet même de cette story. Un renommage **casse
  la compilation** de tous les appelants — c'est exactement l'effet recherché, chaque site est revu.
- **Invariant par ligne** : `soldeDebiteur` et `soldeCrediteur` ne peuvent pas être **tous deux non
  nuls**. Un compte est débiteur **ou** créditeur, jamais les deux. Contrôle **bloquant**.
- ⚠️ **Arbitrage à trancher au lancement — les à-nouveaux.** Faut-il **6 colonnes** (à-nouveaux D/C
  en plus) ? **Recommandation : non, pas ici.** STORY-087 modélise déjà l'à-nouveau comme une
  **balance distincte** (`origine: A_NOUVEAUX` + `balanceSourceId`), ce qui est plus juste qu'une
  paire de colonnes : le socle a sa propre traçabilité et son propre chaînage. Deux colonnes de plus
  dupliqueraient cette information. **À écrire dans la story comme une décision, pas comme un oubli.**

### B. Le sommaire porte **deux** équilibres, pas un

`SommaireBalance` ne connaît aujourd'hui qu'un seul équilibre (`totalDebiteur`/`totalCrediteur` =
somme des `debit`/`credit`). Il en faut deux :

| Contrôle | Égalité |
|---|---|
| Équilibre des **mouvements** | `Σ mouvementDebit = Σ mouvementCredit` |
| Équilibre des **soldes** | `Σ soldeDebiteur = Σ soldeCrediteur` |

- Les deux sont **bloquants** (une balance qui échoue l'un des deux n'est pas une balance).
- Chacun expose son **écart signé**, comme aujourd'hui — un écart nommé se corrige, un booléen non.
- ⚠️ **Renommer `totalDebiteur`/`totalCrediteur`** : ces noms désignent aujourd'hui des sommes de
  *mouvements* tout en portant le mot *débiteur*, qui en comptabilité désigne un **solde**. C'est la
  même confusion, au niveau du sommaire.

### C. Chaque adaptateur remplit les 4 colonnes — **honnêtement**

| Source | Ce qu'elle sait fournir |
|---|---|
| **Sage** (086) | Les deux : l'export porte mouvements **et** soldes cumulés. Le parser cherche déjà `débit`/`crédit`/`solde` — il faut **cesser de les confondre** et mapper chaque colonne à sa place. Le profil d'import (088) doit pouvoir désigner les 4. |
| **Cahiers / OCR** (085) | Des **mouvements**. Le solde est alors `à-nouveau + mouvements` — et sans à-nouveau chaîné, `solde = mouvement`. **À dire explicitement**, pas à laisser deviner. |
| **Ingestion directe** (102) | Le vertical émetteur fournit ce qu'il a. Le contrat `balance.submitted` doit rendre les 4 champs **explicites** et **rejeter** (code stable `PAYLOAD_INVALIDE`) un envoi ambigu — plutôt que de deviner, ce qui rejouerait le défaut d'origine. |
| **Saisie directe** (101/FE-026) | L'utilisateur saisit un montant et un sens. Décider — et écrire — s'il alimente les mouvements, les soldes, ou les deux à l'identique. **Recommandation : les deux à l'identique**, puisqu'une saisie manuelle sans à-nouveau a un solde égal à son mouvement. |

⚠️ **Le contrôle de divergence** (raison n°2 ci-dessus) : quand la source fournit **à la fois** les
mouvements et les soldes, vérifier que `soldeDebiteur − soldeCrediteur = mouvementDebit −
mouvementCredit` **une fois l'à-nouveau pris en compte**, et **signaler** l'écart (avertissement, pas
bloquant — un décalage légitime existe si la balance n'est pas arrêtée à la même date).

### D. Checksum et statut de preuve

- **Le checksum change de forme.** `computeBalanceChecksum` couvre aujourd'hui
  `{compte, libelle, debit, credit, niveauPreuve}`. Il doit couvrir les 4 colonnes.
  ⇒ **Versionner l'algorithme** (`v2`) plutôt que le muter en silence : une balance déjà stockée doit
  rester vérifiable avec l'algorithme sous lequel elle a été scellée. Un checksum qu'on ne peut plus
  reproduire ne prouve plus rien.
  ⚠️ **Impact frontend** : FE-026 a **porté `computeBalanceChecksum` en TypeScript** et verrouillé une
  **parité par test** sur un vecteur backend (`1864781c…`). Ce test **cassera** — c'est voulu, mais il
  faut **fournir le nouveau vecteur** dans la story pour que le front puisse rejouer la parité.
- **`statutPreuve`** pondère aujourd'hui par `debit + credit`. Sur quelle grandeur pondérer désormais ?
  **Recommandation : les soldes** — le statut de preuve dit « quelle part de ce que la balance
  **affirme** est justifiée », et ce qu'elle affirme, c'est son solde. À trancher explicitement, avec
  le test central de STORY-098 rejoué (« 1 grosse ligne estimée l'emporte sur 50 petites justifiées »).

---

## Portée d'impact — à lire avant d'estimer

Ce renommage **casse la compilation** dans, au minimum :

- `balance.validator.ts`, `balance.calculs.ts`, `balance.checksum.ts`, `balance.service.ts`,
  `schemas/`, `dto/submit-balance.dto.ts`, `dto/balance-response.dto.ts` ;
- les 4 adaptateurs : `sage/` (086), `cahiers/agregation/` (085), `ingestion/` (102), `reprise/` (087) ;
- `rapprochement/` (090) et `tresorerie/` (089), qui lisent des lignes de balance ;
- l'OpenAPI de `:3007` ⇒ **les types générés du front** (FE-024→027 déjà livrées).

**C'est la raison des 8 points** : la logique nouvelle est modeste, la surface est large. C'est aussi
la raison pour laquelle cette story doit passer **le plus tôt possible** — chaque adaptateur ajouté
d'ici là est un site de plus à reprendre.

**Hors périmètre :** les 8 contrôles de cohérence GUIDEF (**STORY-098** — cette story lui fournit la
matière, elle ne les implémente pas) · les colonnes à-nouveaux (cf. arbitrage A) · l'UI (stories
frontend d'amendement de FE-026/FE-027, à ouvrir à la livraison).

---

## Critères d'acceptation

1. `LigneBalance` porte `mouvementDebit`, `mouvementCredit`, `soldeDebiteur`, `soldeCrediteur` ;
   **aucun champ `debit`/`credit` ne subsiste** dans le service.
2. **Invariant bloquant** : une ligne avec `soldeDebiteur > 0` **et** `soldeCrediteur > 0` est
   refusée (400), avec le compte fautif nommé.
3. Le sommaire expose **les deux équilibres** avec leur écart signé ; une balance qui échoue **l'un
   des deux** est refusée (422), le message disant **lequel**.
4. **Sage** : mouvements et soldes sont lus dans **leurs** colonnes respectives — test sur un fichier
   réel portant les deux, prouvant qu'ils ne sont plus confondus.
5. **Cahiers** (085) : les mouvements sont remplis, les soldes valent `à-nouveau + mouvements`
   (= mouvements si aucun socle chaîné) — comportement **écrit dans l'OpenAPI**, pas implicite.
6. **Ingestion directe** (102) : un `balance.submitted` ambigu (colonnes manquantes ou contradictoires)
   est **rejeté** avec le code stable `PAYLOAD_INVALIDE`, jamais interprété au mieux.
7. **Contrôle de divergence** : quand la source fournit les deux, un écart entre solde annoncé et
   solde recalculé est **signalé en avertissement** (non bloquant), avec le compte et l'écart.
8. **Checksum versionné `v2`** : une balance scellée avant cette story reste **vérifiable** avec `v1` ;
   les nouvelles utilisent `v2`. Le **vecteur de test `v2` est publié dans la story** pour la parité
   frontend (FE-026).
9. `statutPreuve` pondère sur la grandeur tranchée en D, et le test central de STORY-098 (« 1 grosse
   ligne estimée l'emporte ») est **rejoué et vert**.
10. Portes DoD du dépôt : lint 0, build OK, couverture maintenue, mutation-tests sur les deux
    équilibres et sur l'invariant débiteur-XOR-créditeur.

---

## Vérification docker (obligatoire)

1. Import Sage d'une balance réelle → les 4 colonnes peuplées, **les deux équilibres verts**.
2. Balance déséquilibrée **en soldes seulement** (mouvements équilibrés) → **422** nommant
   l'équilibre des soldes. *C'est le cas que le contrat actuel laisse passer en silence.*
3. Ligne à double solde → **400** avec le compte nommé.
4. Balance issue des **cahiers** (085) → soldes = mouvements, et le dire dans la réponse.
5. `balance.submitted` ambigu → `PAYLOAD_INVALIDE` dans `balance_ingestions`, **aucune** balance créée.
6. Une balance créée **avant** la story reste lisible et son checksum `v1` reste vérifiable.

---

## Notes

- ⚠️ **Ordre avec STORY-146** : les deux touchent `LigneBalance` et le checksum. **147 d'abord**
  (elle change la forme de la ligne), **146 ensuite** (elle change un champ). L'inverse oblige à
  rebaser une nouvelle colonne sur un renommage de champ.
- ⚠️ **Cette story doit précéder STORY-098.** « Actif = Passif » est une égalité de **soldes** :
  écrire 098 sur le contrat actuel, c'est l'écrire sur une colonne dont le sens dépend de la source.
  Même argument que pour STORY-145 → 098 : le sprint 19 doit sortir **145, 147, 146** avant 098.
- ⚡ **Ce que le défaut apprend** : `debit` documenté « cumul » et rempli avec un « solde » a traversé
  la revue de STORY-101 (le keystone), celle de STORY-086, et six stories d'adaptateurs. Un nom de
  champ n'est pas une documentation — **seul un test qui distingue les deux grandeurs** aurait levé
  l'ambiguïté. L'AC-4 est écrit pour ça.

---

## Progress Tracking

**Statut : `done`** — livrée le 2026-07-31 · PR [`prospera-balance-service#23`](https://github.com/MoneyVibesGroup/prospera-balance-service/pull/23), rebase-mergée sur `dev`, branche `MNV-147` supprimée.

### Décisions

| # | Décision |
|---|---|
| **D-147-1** | Renommage **cassant** `debit`/`credit` → `mouvementDebit`/`mouvementCredit`, + ajout `soldeDebiteur`/`soldeCrediteur`. C'est la rupture de compilation qui a forcé la revue de chaque site — et elle **en a corrigé deux qui lisaient la mauvaise grandeur** (cf. « Ce que le renommage a révélé »). |
| **D-147-2** | **Pas de colonnes à-nouveaux** (arbitrage A de la story confirmé). STORY-087 modélise le socle comme une **balance distincte** (`origine: A_NOUVEAUX` + `balanceSourceId`), avec sa traçabilité et son chaînage propres. Corollaire retenu : **un socle ne porte QUE des soldes**, mouvements à `0` — les mouvements de N-1 appartiennent à N-1, et les remonter les compterait deux fois à la fusion `socle ⊕ mouvements`. |
| **D-147-3** | Sommaire **imbriqué** : `sommaire.mouvements` / `sommaire.soldes`, chacun `{totalDebit, totalCredit, ecart, estEquilibre}`, plus un `estEquilibre` global qui est leur **conjonction**. Les anciens `totalDebiteur`/`totalCrediteur` disparaissent : ils sommaient des *mouvements* sous un mot (*débiteur*) qui désigne un **solde**. |
| **D-147-4** | Checksum **versionné**. `v2` scelle les 4 colonnes ; `v1` est conservé en **vérification seule**. Champ `checksumVersion` **sans `default` Mongoose** — un `default` s'applique à l'hydratation, pas aux documents en base, et un filtre dessus ne matcherait aucune balance antérieure (piège payé en STORY-089). Son **absence** vaut `v1`, et toute lecture passe par `?? CHECKSUM_VERSION_HERITEE`. |
| **D-147-5** | `statutPreuve` pondéré par les **soldes** (recommandation D de la story), avec repli explicite sur les mouvements si tous les soldes sont nuls. ⚠️ **La prémisse de la story était inexacte** : le statut ne pondérait pas « par `debit + credit` », il comptait les **lignes** — d'où le contre-exemple de STORY-098 (« 1 grosse ligne estimée l'emporte sur 50 petites justifiées ») qui, au comptage, donnait *justifiée*. |
| **D-147-6** | Sage : classification des colonnes **exclusive**, « mouvement » l'emportant sur « cumul ». Le parser **déclare** ce que le fichier portait (`familleColonnes`) ; le normalizer **dérive** la grandeur absente et **le dit** dans un avertissement — jamais en silence. |
| **D-147-7** | Ingestion directe : les 4 colonnes sont **exigées**. Un payload partiel est **rejeté** (`PAYLOAD_INVALIDE`) : rien ne dirait si les deux montants portés sont des mouvements ou des soldes, et le deviner rejouerait le défaut d'origine — introduit cette fois par nous. |
| **D-147-8** | `POST /balances` exige les 4 champs, **aucun optionnel, aucun dérivé**. Un client sans à-nouveau envoie le même montant en mouvement et en solde : c'est **sa** décision, écrite dans l'OpenAPI, pas une déduction du serveur. |
| **D-147-9** | Profil d'import (088) : `debiteur`/`crediteur`/`soldeNet` **gardent leur nom et leur sens** (ils désignent bien des *soldes* — « débiteur/créditeur » qualifie une position, « débit/crédit » un mouvement) ⇒ aucun profil existant ne change de comportement. S'y ajoutent `mouvementDebit`/`mouvementCredit`, facultatifs mais **exigés par paire**. |
| **D-147-10** | Documents antérieurs : **aucune migration** (« migration = souci de prod, différé »). La **lecture** est rendue tolérante (`versLigne`/`versSommaire`/`lignesNormalisees`, via `toObject()`), et la projection **n'affirme rien** : elle expose la seule valeur connue sans en inventer une seconde, `checksumVersion: v1` disant de ne pas se fier à la distinction. |

### Vecteur de parité `v2` (pour le portage TypeScript du front, FE-026)

```
6c4a50087ced5290576aaa0b56629cf41ac51c94697092dc49650b9eae049569
```

Jeu de données exact : `balance.checksum.spec.ts`, `const base` — exercice
`2025-01-01T00:00:00.000Z` → `2025-12-31T00:00:00.000Z`, `sage`/`SN`/version 1, deux
lignes (`601` Achats mvt 1000/0 solde 1000/0 · `701` Ventes mvt 0/1000 solde 0/1000),
toutes `niveauPreuve: fichier`.

⚠️ **Le vecteur `v1` verrouillé côté FE-026 (`1864781c…`) porte une AUTRE fixture.**
C'est le **couple** (vecteur + jeu de données) publié ici qui doit servir à rejouer la
parité — pas le vecteur seul. Vecteur `v1` figé côté backend, pour la même fixture :
`48f74471c3ba7b587dd100a40f45321e8e35ebe28e2f6f2c183d25b887d1f22a`.

### Ce que le renommage a révélé

Le renommage cassant n'a pas seulement propagé un contrat : il a mis au jour **deux
lectures de la mauvaise grandeur**, invisibles tant que le champ était ambigu.

- **Rapprochement bancaire** — comparait le solde du relevé au **net des mouvements**.
  Faux du montant de l'à-nouveau sur tout exercice qui n'est pas le premier : l'écart
  affiché n'était pas l'écart réel.
- **Chiffre d'affaires du régime fiscal** (STORY-080) — n'était juste que par
  coïncidence (un compte de gestion n'a pas d'à-nouveau). Le calcul porte désormais
  explicitement sur les **mouvements** : un CA est un flux de période.

### Vérification docker (stack `down -v`, obligatoire — les e2e mockent la couche données)

| # | Scénario | Résultat |
|---|---|---|
| ① | Balance à 4 colonnes | **201** · `checksumVersion: v2` · mouvements **25 000 000** ≠ soldes **15 000 000** — les deux grandeurs vivent bien séparément |
| ② | Mouvements équilibrés, **soldes déséquilibrés** | **422** « équilibre **des soldes** non satisfait : écart de 2 000 000 » — *le cas que le contrat à 2 colonnes laissait passer en silence* |
| ③ | Ligne à double solde | **400** « Compte « 411 » à double solde… » |
| ④ | Balance depuis les **cahiers** | soldes = net des mouvements sur les 3 comptes ; équilibres mvt **13 000 000** / soldes **10 000 000** (le compte de banque est mouvementé des deux côtés) |
| ⑤ | `balance.submitted` **amputé** | `PAYLOAD_INVALIDE` dans `balance_ingestions`, **0 balance créée** ; le même payload complet est ingéré (`checksumVersion: v2`) |
| ⑥ | Balance **héritée** (2 colonnes, sans `checksumVersion`) | **200**, montants restitués, exposée `v1`, **checksum v1 recalculé = checksum stocké** |
| + | **Atomicité** | 1 valide + 1 rejet ⇒ `balances = 1`, `outbox_events = 1` — jamais l'un sans l'autre |
| + | Sage « **Mouvements cumulés** » (constat de revue) | les colonnes de **solde** sont bien celles qui sont lues, divergences vides |
| + | **CWE-770** (constat de sécurité) | 250 lignes toutes divergentes ⇒ liste de **100**, total **250**, réponse de **9 Ko** au lieu de croître avec le fichier |

### Défauts trouvés par la vérification docker (invisibles aux tests)

Ni l'unitaire ni l'e2e ne pouvaient les voir : les uns comme les autres manipulent des
objets simples, jamais des documents Mongoose hydratés.

1. **`checksumVersion` n'était pas persisté.** Le constructeur de
   `BalanceRepository.insert` est une **liste blanche** : un champ absent est ignoré
   **sans erreur**. Toute balance neuve était scellée en `v2` puis relue en `v1` — son
   checksum devenait invérifiable, en silence. *(Même piège que le corps d'erreur de
   STORY-085.)*
2. **`{ ...sousDocumentMongoose }`** copie aussi les internes (`$__parent`, `$__`,
   `_doc`), dont une chaîne qui remonte au `MongoClient` : réponse **non sérialisable**,
   donc **500** sur une balance pourtant écrite.
3. **Une balance antérieure faisait un 500, puis s'affichait sans montants.** Deux
   causes enchaînées : `'mouvements' in sommaire` est **vrai même quand la donnée est
   absente** (Mongoose hydrate d'après le *schéma*, pas d'après le document) — le
   discriminant teste désormais la **valeur** ; et les champs hérités ne sont
   accessibles que via `toObject()`.

### Revue de code — 3 bloquants, tous reproduits avant correction

1. **Le parser Sage réintroduisait le défaut de la story, un cran plus bas.**
   `MOTS_SOLDE` et `MOTS_MOUVEMENT` n'étaient pas exclusifs : « **Mouvements cumulés**
   Débit » matchait `mouvement` **et** `cumul`, était retenu comme les deux, et les
   vraies colonnes de solde n'étaient jamais lues. Le fichier était annoncé
   `MOUVEMENTS_ET_SOLDES` (donc aucun avertissement), la divergence se comparait à
   elle-même, et tout compte mouvementé des deux côtés ressortait en **400 « double
   solde »** — sur un export valide, avec un message accusant la comptabilité.
2. **Les colonnes de mouvement d'un profil n'allaient pas par paire** (`||` au lieu du
   `&&` du parser Sage) : un profil à moitié mappé faisait lire `0` de l'autre côté, pris
   pour une donnée ⇒ **422** à chaque import d'un fichier pourtant correct, sans jamais
   nommer la colonne manquante.
3. **Quatre sites internes lisaient les nouveaux noms sur un document Mongoose** —
   régression du renommage (avant, ils lisaient `debit`/`credit`, présents sur les
   documents anciens). `undefined ?? 0` publiait des chiffres faux qui ont l'air de
   chiffres : le **rapprochement** affichait un solde comptable de `0`, donc un écart
   égal à la totalité du solde bancaire, **à côté de la référence de la balance censée
   le justifier**.

Qualité : vecteur `v1` **figé** (le test était auto-référentiel — il restait vert si
l'algorithme dérivait, rendant tout l'existant invérifiable) · divergence exposée aussi
sur le chemin **persistant** · couverture des branches `familleColonnes` · fixture périmée.

### Revue de sécurité — 1 constat (CWE-770), corrigé

`divergencesSoldes` produisait **une entrée par ligne fautive**, sans plafond, sur les
deux réponses d'import, et était calculé **avant** `dryRun`/`submit`. Le scénario
n'exige qu'un tenant légitime : un CSV à lignes appariées, soldes nuls et mouvements non
nuls, produit une balance **parfaitement valide** (les deux équilibres et l'invariant XOR
sont satisfaits, le checksum concorde) dont **100 % des lignes divergent**. Sur les 50 Mo
autorisés : ~2 M d'entrées, réponse de ~150 Mo, OOM du process — indisponibilité pour
**tous** les tenants. Ironie : cinq lignes plus bas, la version *textuelle* du même
diagnostic était déjà plafonnée, commentaire CWE-770 à l'appui.

Corrigé sur le patron `MAX_DIAGNOSTIC` des relevés (089) : troncature **à la
construction** (tronquer après allocation ne protège de rien), plus
`divergencesSoldesTotal`/`avertissementsTotal` pour que le compte reste **exact**.

Examinés sans constat : downgrade de checksum impossible (`checksumVersion` n'existe dans
aucun DTO d'entrée, est écrit en dur côté serveur, et le seul contrôle réel appelle
toujours `v2`) · ingestion Kafka (orgId d'enveloppe faisant autorité, double filet
d'idempotence, autorisation fail-closed) · tolérance aux documents hérités inatteignable
par entrée utilisateur (schéma `required`, DTO `@IsInt`) · invariant XOR et double
équilibre non contournables (sommaire **toujours** recalculé serveur) · isolation tenant.

### Portes de qualité

Lint **0 warning** · build OK · **1830 unitaires + 381 e2e** verts · couverture
**98.76 / 90.97 / 98.01 / 98.78** (seuils 65/90/90/90).

**10 mutation-tests** joués, chacun vire au rouge : conjonction des deux équilibres ·
contrôle des soldes par le validateur · invariant XOR · pondération du `statutPreuve` ·
prise en compte du socle dans la divergence · cumul (vs netting) des mouvements ·
précédence « mouvement » sur « cumul » · exigence de paire des colonnes de mouvement ·
lecture par `toObject()` · plafond du diagnostic.

### Leçon transverse

**Un double de test qui ne représente pas ce que la production fournit ne prouve rien.**
Trois vagues de correctifs ont buté sur le même point : les doubles rendaient des objets
simples là où la production rend des documents Mongoose. Ils portent désormais
`toObject()` — et un socle se construit **par fonction**, un `{ ...socle, lignes: … }`
ne surchargeant que `lignes` et laissant `toObject()` rendre les anciennes.

### Périmètre

**Un seul dépôt.** `balance.created` ne transporte pas les lignes et `bilan-service` ne
lit pas les balances : aucun contrat inter-services n'est touché, pas de PR jumelle.
En revanche le **contrat HTTP** change de forme (4 colonnes, sommaire à deux équilibres,
`checksumVersion`) ⇒ les types générés de **FE-024→027** sont périmés, et **FE-026** doit
rejouer la parité de checksum sur le couple publié ci-dessus.

Restés hors périmètre, comme cadré : les 8 contrôles GUIDEF (**STORY-098**, que cette
story débloque), les colonnes à-nouveaux (D-147-2), l'UI.
