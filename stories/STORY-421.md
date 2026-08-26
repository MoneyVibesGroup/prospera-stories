# STORY-421 : Un moyen de paiement oublié devient une créance client — la balance tombe juste et le bilan porte un actif qui n'existe pas

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/agregation`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046**, à la revue « expert-comptable venant de Sage » demandée par le PO.

---

## Le fait, relevé à la source

La contrepartie d'une transaction est déduite du **moyen de paiement**, et à défaut, du **tiers** :

```ts
// ventilation.regles.ts — resoudreContrepartie
switch (entree.moyenPaiement) {
  case 'ESPECES':       return comptes.caisse;
  case 'BANQUE':        return comptes.banque;
  case 'MOBILE_MONEY':  return comptes.mobileMoney;
  default:
    if (entree.tiers == null || entree.tiers.trim() === '') return null;
    return sens === 'RECETTE' ? comptes.clients : comptes.fournisseurs;
}
```

Il n'existe **aucun état « à crédit »**. L'absence de moyen de paiement **est** le signal du
crédit. Or ce n'est pas la même chose :

| ce que la donnée dit | ce que le système en conclut |
|---|---|
| « vendu à crédit à SODIFAB » | créance `411` — **correct** |
| « vendu à SODIFAB, j'ai oublié de cocher espèces » | créance `411` — **faux** |

Les deux sont **indiscernables au contrat** : `moyenPaiement` est optionnel, et son absence
n'est jamais rapportée.

---

## Ce que ça coûte, concrètement

C'est le seul défaut de ce lot qui **passe dans les états financiers**, et il est invisible à
tous les contrôles existants :

- la ventilation reste **équilibrée** (`411` au débit, `701` au crédit) ⇒ les deux contrôles
  d'équilibre tombent juste ;
- la transaction n'est **pas écartée** (`resoudreContrepartie` rend un compte) ⇒ elle
  n'apparaît pas dans `nonVentilables` ;
- `avertissements[]` n'en dit rien — il ne porte que l'inventaire, le socle d'à-nouveaux et le
  compte des non ventilables (`agregation.service.ts`, `D-085-9`).

**Conséquence sur la liasse :** la trésorerie est **sous-évaluée** et le poste **Clients**
porte une créance sans débiteur. Au bilan suivant, cette créance ne s'apure jamais — elle
devient un actif douteux qu'aucun rapprochement ne peut expliquer, puisqu'aucun relevé ne la
contredit (l'argent, lui, est bien passé en caisse **sans écriture**).

⇒ Et c'est précisément la population concernée : le cahier papier d'un commerçant est le
support où le moyen de paiement est **le plus souvent** laissé vide, parce que « tout le monde
sait » que c'était du comptant.

---

## Ce qui est demandé

Ce n'est **pas** une story de correction du moteur : la règle de `resoudreContrepartie` est
défendable et la changer serait pire. C'est une story de **visibilité**.

1. **L'aperçu publie la répartition de ses contreparties.** Aujourd'hui `AgregationApercuDto`
   rend des lignes par compte : on voit le solde de `411`, on ne sait pas d'où il vient. Ajouter :

   ```ts
   @ApiProperty({ type: [ContrepartieApercuDto] })
   contreparties!: {
     compte: string;             // '411'
     motif: 'MOYEN_PAIEMENT' | 'TIERS_SANS_MOYEN_PAIEMENT';
     nbTransactions: number;
     montant: number;            // unités mineures XOF
   }[];
   ```

2. **Un avertissement typé** quand `TIERS_SANS_MOYEN_PAIEMENT` est non vide — dans
   `avertissements[]`, à côté de celui de l'inventaire :
   *« N transaction(s) sans moyen de paiement ont été portées en compte de tiers (créance /
   dette). Si elles ont été encaissées ou payées, la trésorerie est sous-évaluée d'autant. »*

3. ⚠️ **Ne PAS refuser**, ne pas écarter, ne pas deviner. Une vente à crédit est parfaitement
   régulière ; c'est au comptable de trancher, et il ne peut le faire que si on lui montre le
   chiffre.

---

## Critères d'acceptation

1. `POST …/balance/depuis-cahiers` (aperçu **et** persistance) publie `contreparties`, avec le
   motif par compte.
2. Une transaction avec `tiers` et **sans** `moyenPaiement` compte en
   `TIERS_SANS_MOYEN_PAIEMENT` — testé sur les **deux** sens (recette → `411`, dépense → `401`).
3. L'avertissement apparaît **si et seulement si** au moins une transaction est dans ce cas, et
   porte le nombre et le montant.
4. Aucune transaction n'est écartée ni refusée du fait de cette story — un test doit rougir si
   `nonVentilables` grossit.
5. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚠️ **Ce que cette story ne fait pas, et qui reste ouvert** : rendre le moyen de paiement
  **obligatoire à la saisie** quand la ligne est cochée « encaissée ». C'est une décision de
  produit (elle alourdit la saisie du seul utilisateur qui tient un cahier papier) ⇒ à poser au
  PO séparément. La visibilité, elle, n'a pas de contrepartie : elle ne coûte rien à personne.
- Voir [[FE-046]] (maquette, panneau « Contreparties »), `stories/STORY-085.md` (D-085-3 :
  aucun compte d'attente, aucune ligne d'écart).
