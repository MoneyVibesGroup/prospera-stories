# STORY-534 : L'inventaire de clôture — le seul chiffre qu'un cahier ne peut pas produire, et sans lequel la marge est fausse

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — module `inventaire` (nouveau)
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-532** (les bornes de l'exercice) — un inventaire est daté à la **clôture**, et la liasse ne connaît pas sa date de clôture.
**Origine :** §8.1 de `analyse-scalabilite-multireferentiel-2026-08-27.md`, validé par le PO le 2026-08-28. **Geste ① sur trois.**

---

## Le fait, et sa portée exacte

Le produit le dit déjà, en toutes lettres, dans l'onglet Rattachement :

> *« Il n'y a ici aucun compte de classe 1, 2 ou 3 — c'est normal, et ce n'est pas suffisant. Un
> cahier n'enregistre que des flux : ni capital, ni immobilisations, **ni stocks** — ils ne se
> déduisent d'aucune recette. »*

⇒ **Sans inventaire, la marge brute d'un dossier commercial tenu aux cahiers est fausse.** Et rien
ne le signale : la balance reste équilibrée, la liasse se calcule, tous les contrôles passent.

⚡ **Portée : uniquement la persona « cahiers ».** Un export Sage, une reprise d'à-nouveaux ou une
saisie directe portent déjà les comptes de classe 3 et la variation — le client a fait son
inventaire, il est dans les soldes. **Cette story ne touche pas ces trois chemins.** C'est ce qui la
rend petite, et c'est pourquoi elle remplace `stock-service` pour la vente cabinet : un cabinet
arrête des comptes, il ne pilote pas un stock.

## ⚠️ Le piège : les deux familles ont des conventions OPPOSÉES

| Famille | Comptes | Variation | Sens si le stock augmente |
|---|---|---|---|
| Biens **achetés** (marchandises, matières, approvisionnements) | `603x` | **SI − SF** | **crédit** de `603x` (la charge diminue) |
| Biens et services **produits** (en-cours, produits finis) | `73x` | **SF − SI** | **crédit** de `73x` (le produit augmente) |

Un moteur qui applique la même formule aux deux **inverse le signe d'une des deux**, et l'erreur ne
déséquilibre rien : elle déplace du résultat.

## Critères d'acceptation

- [ ] AC-1 — Saisie, par compte de **classe 3 du référentiel du dossier** : **stock initial** et
      **stock final**, à la date de clôture de l'exercice. Les comptes proposés viennent du
      référentiel du **dossier** (doctrine STORY-422), jamais d'une liste codée.
- [ ] AC-2 — La variation est **calculée**, jamais saisie, et porte **sa formule et son compte de
      contrepartie** (`603x` ou `73x`) — même exigence que les écritures d'impôt.
- [ ] AC-3 — ⛔ **Les deux conventions de signe sont testées dans les deux sens** : stock qui monte
      et stock qui descend, pour un bien acheté **et** pour un bien produit. Quatre cas, quatre
      assertions. C'est le test de cette story.
- [ ] AC-4 — Le **stock initial est pré-rempli depuis la balance d'ouverture** quand elle existe
      (reprise d'à-nouveaux), et **un écart entre les deux est signalé, jamais corrigé d'office**.
      Un stock initial qui ne correspond pas au stock final de l'exercice précédent est une
      information, pas une faute de frappe à écraser.
- [ ] AC-5 — L'inventaire produit des lignes de balance par le **même mécanisme que les provisions
      fiscales** : **dry-run par défaut**, écriture sur acte explicite, **nouvelle version** de
      balance. On n'écrase jamais, on empile.
- [ ] AC-6 — La **dépréciation des stocks** (`39x`) est **proposable et jamais appliquée d'office** :
      c'est un jugement, au même titre que l'affectation du résultat et la provision pour perte de
      change.
- [ ] AC-7 — Les montants portent leur **devise** (STORY-489). Aucune constante `XOF`.
- [ ] AC-8 — ⚠️ Un référentiel **sans classe 3 marchande** (`sfd-bceao`, `cima-assurances`) rend
      l'écran **non applicable et le dit**, plutôt que de proposer une saisie sans objet.

## Ce que cette story NE fait PAS

- Ni entrées/sorties, ni lots, ni valorisation CUMP, ni inventaire permanent : c'est
  **`stock-service`** (EPIC-075→084, vertical distributeur), et il n'est **pas** tiré pour la vente
  cabinet.
- Elle ne touche pas les dossiers dont la balance vient d'un export, d'une reprise ou d'une saisie
  directe. **Non-régression obligatoire** — c'est la majorité des dossiers.

## Notes

- Voir [[STORY-535]] (le contrôle qui rend l'oubli visible), [[FE-084]] (l'écran et la phrase),
  [[STORY-532]], `analyse-scalabilite-multireferentiel-2026-08-27.md` §8.1.
