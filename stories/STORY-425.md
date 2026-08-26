# STORY-425 : Une opération porte deux comptes — le contrat n'en publie qu'un, et le client doit refaire la règle

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers`, `modules/cahiers/agregation`
**Points :** 5 · **Sprint :** S20
**Origine :** **retour direct d'un expert-comptable**, transmis par le PO le **2026-08-26** : *« quelle que soit recette ou dépense, une opération est liée à deux comptes, celui du débiteur et celui du créditeur, et en fonction de ma position »*.

---

## La remarque, et pourquoi elle est structurante

C'est la partie double, et c'est la façon dont un comptable **lit** une opération. Le produit,
lui, stocke **un seul compte par ligne** :

```ts
// LigneRecette → compteProduit  (classe 7)
// LigneDepense → compteCharge   (classe 6)
```

L'autre compte n'existe **nulle part** avant l'agrégation, où il est **déduit** :

```ts
// ventilation.regles.ts — resoudreContrepartie
case 'ESPECES':      return comptes.caisse;
case 'BANQUE':       return comptes.banque;
case 'MOBILE_MONEY': return comptes.mobileMoney;
default:
  if (entree.tiers == null || entree.tiers.trim() === '') return null;
  return sens === 'RECETTE' ? comptes.clients : comptes.fournisseurs;
```

⇒ **Aucune route ne rend, pour une transaction donnée, le couple (compte débité, compte
crédité).** `GET …/cahiers/recettes` rend le compte de produit et le moyen de paiement ; c'est
tout.

---

## Ce que ça coûte, concrètement

**Un écran qui veut montrer une opération comme un comptable la lit doit ré-implémenter
`resoudreContrepartie` côté client** — c'est-à-dire recopier une **règle métier** et la
maintenir en double. C'est exactement ce que le programme refuse ailleurs (NFR-A06, et la leçon
de FE-056 : *« le plan de comptes vient du SERVEUR »*).

Et la copie serait **fragile sur le point qui compte** : le sens.

| opération | compte débité | compte crédité |
|---|---|---|
| vente encaissée en espèces | `571…` **Caisse** | `701…` Ventes |
| achat payé en espèces | `605…` Achats | `571…` **Caisse** |

**Le même compte de trésorerie est débité dans un cas et crédité dans l'autre.** Le sens
n'appartient pas au compte, il appartient à l'opération — c'est le « en fonction de ma
position » de la remarque. Un client qui se trompe d'un cran inverse une trésorerie sans
qu'aucun total ne bouge (les deux restent équilibrés).

⚠️ **Et la contrepartie n'est pas toujours déterminable** : ni moyen de paiement ni tiers ⇒
`null`, la transaction est **écartée**. Le client ne peut le savoir qu'en refaisant le test —
donc en connaissant aussi les **comptes de contrepartie du dossier**
(`GET …/balance/comptes-ventilation`, un second appel) **et** la règle de priorité.

---

## Ce qui est demandé

Publier le couple sur la **transaction**, là où il se lit :

```ts
// LigneRecetteResponseDto / LigneDepenseResponseDto
@ApiProperty({ description: 'Compte débité — reconstitué par la règle de ventilation.' })
compteDebit!: string | null;
@ApiProperty({ description: 'Compte crédité — idem.' })
compteCredit!: string | null;
@ApiProperty({
  enum: ['MOYEN_PAIEMENT', 'TIERS_SANS_MOYEN_PAIEMENT', 'INDETERMINABLE'],
  description: 'D’où vient la contrepartie — et pourquoi elle manque, le cas échéant.',
})
origineContrepartie!: string;
```

1. **`null` des deux côtés quand la contrepartie est indéterminable** — et `origineContrepartie:
   'INDETERMINABLE'`. C'est ce qui permet à l'écran de signaler la ligne **avant** l'agrégation,
   au lieu de la découvrir dans les `nonVentilables` d'un aperçu.
2. **Le sens est porté par le couple, pas par le compte** : un test doit rougir si une dépense
   rend le compte de trésorerie au débit.
3. ⚠️ **Ces champs sont *dérivés*, pas persistés.** Les persister créerait une seconde source de
   vérité qui divergerait au premier changement de `comptes-ventilation` — exactement ce que
   D-085-6 refuse pour les surcharges. Ils se calculent à la lecture, avec les comptes de
   contrepartie **effectifs du dossier**.
4. ⚠️ **Conséquence à assumer** : la lecture d'un cahier charge désormais les comptes de
   ventilation du dossier. C'est **un** aller-retour de plus par requête, pas par ligne
   (`chargerSurcharges` fait déjà exactement ça pour les règles).

---

## Critères d'acceptation

1. `GET …/cahiers/recettes` et `GET …/cahiers/depenses` publient `compteDebit`, `compteCredit`
   et `origineContrepartie` sur chaque ligne.
2. Une recette encaissée en espèces rend `compteDebit = caisse` / `compteCredit = compteProduit` ;
   une dépense payée en espèces rend l'**inverse** sur la trésorerie — testé sur les deux sens.
3. Sans moyen de paiement mais avec tiers : `411…` / `401…` selon le sens, et
   `origineContrepartie = 'TIERS_SANS_MOYEN_PAIEMENT'`.
4. Sans moyen de paiement ni tiers : les deux comptes à `null`, `'INDETERMINABLE'` — et la ligne
   reste **lisible** (aucune erreur).
5. Le couple est cohérent avec ce que `POST …/balance/depuis-cahiers` produira : un test
   compare, sur un jeu de lignes, la ventilation et les champs publiés.
6. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- **Complémentaire de STORY-421**, pas redondante : 421 demande la répartition **agrégée** des
  contreparties sur l'aperçu (« combien de créances fantômes ») ; 425 demande le couple
  **par opération** (« laquelle, et pourquoi »). L'une donne le compteur, l'autre la liste.
- ⚡ **Ce que cette story change pour l'écran** : la partie double cesse d'être une
  *démonstration* dans un encart et devient la **forme normale** de lecture d'une opération —
  c'est ce que la maquette FE-046 dessine désormais, en tête du panneau « Contreparties ».
- Voir [[FE-046]], `stories/STORY-085.md` (D-085-2, D-085-3, D-085-5), `stories/STORY-421.md`.
