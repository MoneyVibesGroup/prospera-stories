# STORY-172 : `balance-service` — refermer les deux angles morts de STORY-146 : les comptes de **paramétrage** échappent au niveau de détail, et le **SFD-BCEAO** n'en déclarait aucun (désormais sourcé)

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A04, NFR-A06 · **STORY-146** (l'autorité passe au référentiel) · **STORY-078** (`ReferentielPackageBalance`) · **STORY-085** (ventilation) · **STORY-057** (extraction du plan SFD)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-08-03
**Sprint :** 20 (proposé)
**Service :** `balance-service` (:3007)
**Branche :** `MNV-172`
**Origine :** ① constat de **revue de code de STORY-146**, écarté du périmètre et tracé dans `open_contract_gaps` · ② **recherche de source** demandée à la clôture de 146 (le niveau de détail du RCSFD n'était pas sourcé)

---

## A. Un compte accepté à la configuration, refusé à l'agrégation

STORY-146 a fait du **plan de comptes de l'organisation** le juge des comptes d'une balance, via
deux prédicats distincts :

| Prédicat | Question posée | Reconnaissance |
|---|---|---|
| `isCompteValide` | « à quelle racine du plan ça se rattache ? » | **par préfixe** |
| `isCompteDeDetail` | « est-ce un compte du plan, **déposable** en balance ? » | préfixe **+ niveau de détail** |

Le second n'est branché que sur `BalanceValidator`. **Les comptes de paramétrage, eux, sont
restés sur le premier** — alors qu'ils **deviennent des lignes de balance** en passant par
l'agrégation des cahiers (STORY-085) :

| Fichier | Ligne | Ce que l'utilisateur déclare |
|---|---|---|
| `cahiers/agregation/comptes-ventilation.service.ts` | 91 | comptes de contrepartie (caisse, banque, TVA, clients, fournisseurs) |
| `cahiers/categories-depenses.service.ts` | 242, 270 | `compteCharge` d'une catégorie de dépense |
| `cahiers/rattachement/rattachement.service.ts` | 88, 160 | surcharges `libellé → compte` de l'organisation |

**Le scénario de défaillance, en clair** : un cabinet SYSCOHADA paramètre
`compteCharge: "60100000"` (le compte que lui donne son logiciel de saisie). C'est **accepté**
— `60100000` commence par `601`, donc il est *rattachable*. Des semaines plus tard, la première
agrégation de son cahier de dépenses produit une balance portant ce compte, et `BalanceValidator`
la **refuse** en nommant un compte que l'utilisateur n'a jamais saisi dans ce cahier. Le refus
arrive **loin de la cause**, et la cause — un champ de configuration validé trop faiblement —
n'est nommée nulle part.

⚠️ **C'est une divergence que STORY-146 a CRÉÉE**, pas une lacune préexistante : avant 146,
`60100000` était accepté des deux côtés. C'est aussi, pour la **quatrième fois** dans ce dépôt,
le même motif — *une garde posée à un endroit et pas à l'autre* (cf. `GAP-balance-validation-etat`,
`GAP-compte-non-valide-par-referentiel`).

### Périmètre A

- Les **trois** sites ci-dessus passent à `isCompteDeDetail`, avec un message qui **nomme le
  référentiel actif** (comme le fait déjà `BalanceValidator` depuis 146).
- ⚠️ **Deux sites restent délibérément sur `isCompteValide`**, et la story doit le **dire dans le
  code** plutôt que de laisser croire à un oubli :
  - `tresorerie/comptes-tresorerie.service.ts:240` — le `compteComptable` d'un compte de
    trésorerie est un compte de **rattachement** (l'exemple du DTO est `521`, une racine) ;
  - `suggestion/suggestion.service.ts:64` — la suggestion **propose**, elle n'engage rien ; le
    validateur reste seul juge (décision D-139-4).
- `cahiers-depenses.service.ts:931` et `cahiers-recettes.service.ts:580,639` : **à trancher au
  lancement** — ce sont des comptes de ligne de cahier, qui alimentent eux aussi l'agrégation.
  Les inclure si l'analyse confirme qu'ils atterrissent en balance ; sinon documenter pourquoi.

---

## B. Le niveau de détail du RCSFD est désormais **sourcé** — 6 chiffres

STORY-146 a délibérément **laissé `sfd-bceao@2.0` sans `longueurCompteDetail`** : la donnée
n'était pas sourcée, et inventer un chiffre aurait rejoué le défaut que la story corrigeait.
Conséquence assumée et vérifiée en docker : **la règle « 6 chiffres » ne vaut aujourd'hui que
pour SYSCOHADA**, et une organisation SFD peut déposer un compte à 8 chiffres.

**La source a été trouvée** — relevé complet dans
[`referentiels/rcsfd-bceao-longueur-compte-2026-08-03.md`](../referentiels/rcsfd-bceao-longueur-compte-2026-08-03.md) :

> *Référentiel comptable spécifique des Systèmes Financiers Décentralisés de l'UMOA*,
> Commission Bancaire de l'UMOA — plan de comptes, pages 29 à 42 du PDF officiel.

**372 comptes** extraits, distribution des longueurs :

| Longueur | Comptes | Exemples |
|---|---|---|
| 2 | 48 | `10` Valeurs en caisse |
| 3 | 130 | `101` Billets et monnaies |
| 4 | 178 | `1011` Billets et monnaies émis par la BCEAO |
| 5 | 14 | `20227` Créances rattachées · `25116` Dettes rattachées |
| **6** | **2** | `602511` Intérêts sur comptes ordinaires créditeurs · `602512` Intérêts sur comptes ordinaires sur livrets créditeurs |

➡️ **6 chiffres**, comme SYSCOHADA — mais **pour une raison propre et vérifiée**, pas par analogie.

⚠️ Le référentiel **ne fixe nulle part une longueur maximale en toutes lettres** : il dit
seulement que « *le premier chiffre représente la classe* » et que « *les autres chiffres décrivent
de façon plus détaillée la nature des opérations* ». La longueur se **constate sur le plan
lui-même** — c'est exactement pourquoi 146 ne pouvait pas la deviner.

### Périmètre B

- `ReferentielRegistry` déclare `longueurCompteDetail: 6` pour `sfd-bceao@2.0`, avec la **source
  en commentaire** (document + pages + les deux comptes qui portent le niveau 6).
- Non-régression **prouvée** : les comptes officiels les plus détaillés restent acceptés.

---

## ⚠️ Le constat annexe qui rend B possible sans risque

`assets/sfd-bceao-2.0.json` ne porte que **156 comptes** (48 × 2 chiffres + 108 × 3), là où le
plan officiel en compte **372** et descend à 6 : **les niveaux 4, 5 et 6 sont absents de
l'artefact**. La troncature remonte à l'extraction de STORY-057 (le `README-sfd-bceao.md` de
`docs/referentiels/` cite pourtant des comptes à 4 chiffres dans sa prose — ils n'ont pas été
repris dans le JSON).

**Et pourtant B est sûr**, parce que la reconnaissance est **par préfixe** : contrôlé sur
`602511`, `602512`, `20227`, `25116`, `25316`, `1011`, `1131` → **tous rattachables** à une racine
que l'artefact déclare. Déclarer `6` ne refuse donc **aucun** compte officiel, et refuse bien un
compte à 8 chiffres d'un logiciel de saisie.

**Hors périmètre :** enrichir l'artefact aux 372 comptes. Les octets sont ceux de `bilan-service`
(**D-078-2**, source de vérité unique) : cela passe par son `build.mjs`, donc **2 dépôts**,
2 régénérations, 2 checksums — et cela mérite sa propre story. À tracer dans
`open_contract_gaps`.

---

## C. ⚡ Le constat trouvé **en cadrant cette story**, et qui la dépasse : STORY-146 casse le rapprochement bancaire des paramétrages existants

`rapprochement.service.ts:683` apparie le compte de trésorerie à sa ligne de balance par
**égalité stricte** :

```ts
const ligneBalance = balance
  ? lignesNormalisees(balance).find((l) => l.compte === compte.compteComptable)
  : undefined;
const soldeComptable = balance
  ? (ligneBalance?.soldeDebiteur ?? 0) - (ligneBalance?.soldeCrediteur ?? 0)
  : null;
```

Or **STORY-146 vient de changer le compte que porte la balance** : l'import Sage écrivait
`5211BOA0` tel quel, il écrit désormais `521100`. Un cabinet qui avait déclaré son compte de
trésorerie avec le compte de son logiciel (`5211BOA0`) — ou avec la racine `521`, **l'exemple
donné par le DTO lui-même** — ne matche plus rien.

**Reproduit** (balance portant `521100`, solde 100 000 XOF) :

| `compteComptable` déclaré | Ligne trouvée | `soldeComptable` publié |
|---|---|---|
| `521` (exemple du DTO) | ❌ non | **0** → écart = **totalité** du solde bancaire |
| `5211BOA0` (compte Sage, valide avant 146) | ❌ non | **0** → idem |
| `521100` | ✅ oui | 10 000 000 (correct) |

⚠️ **C'est exactement le défaut payé en revue de STORY-147** — un solde comptable à `0` publié
**à côté de la référence de la balance censée le justifier**, donc un écart présenté comme une
donnée comptable alors qu'il n'est qu'un appariement raté. Le commentaire du code met en garde
contre la confusion « balance absente » / « aucun mouvement »… et ne voit pas que le compte peut
tout simplement ne **plus** porter le même numéro.

**⚠️ Ce point CHANGE la taille de la story (3 → 5 pts)** et n'est pas un simple alignement de
prédicats. Deux options à trancher **au lancement** :

- **(a)** le compte de trésorerie doit être un **compte de détail** (`isCompteDeDetail`), et
  l'appariement reste une égalité — mais cela ne suffit pas : `521` **est** un compte de détail
  valide (3 ≤ 6) et échouerait encore ;
- **(b)** l'appariement du rapprochement se fait **par la même normalisation que l'import**
  (comparer `normaliserCompte(compteComptable)` à la ligne), ce qui aligne les deux côtés sur une
  seule définition. **Recommandation : (b)**, parce que c'est le seul choix qui reste juste quel
  que soit ce que l'utilisateur a déclaré — et parce que faire dépendre la justesse d'un écart
  financier de la façon dont un comptable a saisi un champ de configuration est précisément ce
  qu'il faut éviter.

**À vérifier au lancement** : combien de comptes de trésorerie existent réellement en base avec
un `compteComptable` qui ne matche plus ? Si le parc est vide, le sujet est de prévention.

---

## Critères d'acceptation

1. Les comptes de **contrepartie de ventilation**, le **`compteCharge`** d'une catégorie de
   dépense et les **surcharges de rattachement** sont validés par `isCompteDeDetail`.
2. Le refus **nomme le référentiel actif** (`« … inconnu du plan syscohada-revise@2.1 »`) et
   survient **à la configuration**, plus à l'agrégation.
3. `60100000` en `compteCharge` est **refusé** ; `601000` et `601` restent acceptés.
4. Les deux sites qui restent sur `isCompteValide` (trésorerie, suggestion) portent un
   **commentaire qui dit pourquoi** — un lecteur ne doit pas y voir un oubli.
5. `sfd-bceao@2.0` déclare `longueurCompteDetail: 6`, **source citée** dans le code.
6. **Non-régression SFD prouvée** : `602511`, `20227`, `25116`, `1011` et les racines à 2-3
   chiffres restent acceptés ; `60251100` (8 chiffres) est refusé.
7. **Le rapprochement retrouve sa ligne de balance** quel que soit le compte déclaré
   (`521`, `5211BOA0`, `521100`) sur une balance produite après STORY-146 — et le
   `soldeComptable` publié n'est **jamais** `0` par appariement raté.
8. Portes DoD : lint 0, build OK, couverture maintenue, **mutation-tests** sur chacun des sites
   rebranchés (retirer la garde ⇒ test rouge) **et** sur l'appariement du rapprochement.

---

## Vérification docker (obligatoire)

1. Organisation **SYSCOHADA** : `PATCH` des comptes de ventilation avec `60100000` → **400**
   nommant `syscohada-revise@2.1` ; avec `601000` → **200**.
2. Catégorie de dépense avec `compteCharge: "60100000"` → **400** ; `601000` → **201**.
3. Organisation **SFD-BCEAO** : dépôt d'une balance portant `602511` → **201** ; portant
   `60251100` → **400** (c'est le comportement que B ajoute).
4. Compte de trésorerie déclaré `521`, balance importée de Sage portant `521100` → le
   rapprochement publie le **vrai** solde comptable, pas `0`.
5. **Le scénario complet de bout en bout** : paramétrer une ventilation valide, saisir un cahier,
   agréger → la balance produite passe le validateur. C'est la preuve que les deux gardes
   **s'accordent** désormais, ce qui est tout l'objet de la story.

---

## Notes

- ⚡ **Le motif de fond, une fois de plus** : une garde renforcée d'un côté d'un flux doit être
  renforcée **partout où la donnée entre**. STORY-146 a fermé la porte de sortie (le validateur)
  sans fermer les portes d'entrée (le paramétrage). Le symptôme — « accepté ici, refusé
  là-bas » — est le même que celui des deux gaps précédents de ce dépôt.
- La partie **B** est petite (une ligne de manifeste + des tests) mais **ne doit pas être livrée
  seule** : c'est la même question — « qui décide qu'un compte est déposable » — et la même
  batterie de non-régression.
