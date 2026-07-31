# STORY-147 : `balance-service` — la balance porte ses **soldes débiteur / créditeur** en plus de ses mouvements (balance à 4 colonnes) + double contrôle d'équilibre

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A25 · `rapport-bilan-logique-metier-2026-07-12.md` §12 (contrôles GUIDEF) · **STORY-101** (contrat canonique — `LigneBalance`, `SommaireBalance`, checksum) · **STORY-086** (adaptateur Sage) · **STORY-085** (ventilation cahiers) · **STORY-102** (ingestion directe) · **STORY-087** (à-nouveaux) · **STORY-098** (contrôles de cohérence — **consommateur direct**)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** high
**Statut :** ready-for-dev
**Assigné à :** null
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
