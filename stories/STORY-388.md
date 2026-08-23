# STORY-388 : Un socle d'à-nouveaux est indiscernable d'une balance importée, et son chaînage est invisible

**Epic :** EPIC-021 — Import & migration Sage (reprise à-nouveaux)
**Réf. :** écart remonté par **FE-047** *(reprise d'à-nouveaux / continuité N-1)*, 2026-08-23 — prolonge **STORY-087** et **STORY-147**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

`BalanceResponseDto` publie quinze champs. **Deux manquent**, et ils vivent tous les deux en base :

```ts
// balance.schema.ts
origine?: OrigineBalance;          // ← 'A_NOUVEAUX' pour un socle d'ouverture
balanceSourceId?: Types.ObjectId;  // ← la balance de clôture N-1 dont il est issu
```

Aucun des deux n'est exposé. Trois conséquences, dans l'ordre de gravité.

### ① Le front ne peut pas dire quelle balance sera reprise — alors que c'est ce que le PO demande

À la revue de maquette FE-047, le PO a tranché : l'écran doit **rendre visible** la balance que le
service va reprendre, sans pour autant fabriquer un choix que l'API n'offre pas.

Le service la sélectionne ainsi (`BalanceRepository.trouverDerniereValidee`) :

```ts
{ 'exercice.debut', 'exercice.fin', etat: 'VALIDÉE', origine: { $ne: ORIGINE_A_NOUVEAUX } }
  .sort({ horodatageValidation: -1, version: -1 })
```

Le front peut reproduire **trois** de ces quatre critères. Il ne peut pas reproduire
`origine ≠ A_NOUVEAUX` : le champ n'est pas servi. Sur un dossier en **continuité d'année en
année** — le cas nominal après la première reprise — l'exercice repris porte à la fois sa balance de
clôture *et* le socle qui l'a ouvert. Si le socle a été validé plus récemment, l'écran désignerait
**le socle** là où le serveur prendra **la clôture**. Un chiffre plausible et faux, sans erreur.

### ② Un socle d'à-nouveaux est indiscernable d'une balance importée, partout

L'onglet « Balances » (FE-027) affiche exercice, source, version, état, statut de preuve, équilibre.
Un socle y apparaît comme une balance ordinaire — il hérite même de la `source` de sa balance
d'origine (`sage`, `direct`…), qui décrit alors **la provenance de son ancêtre**, pas la sienne.
Rien à l'écran ne dit « celle-ci n'a pas été importée, elle a été *reprise* ».

### ③ Le chaînage de la continuité n'existe que dans une réponse éphémère

`ANouveauxResponseDto.balanceSourceId` porte le lien N-1 → N — mais **seulement dans la réponse à la
génération**. Rouvrez la balance le lendemain : le lien a disparu du contrat. La continuité, qui est
l'objet même de STORY-087, n'est consultable qu'au moment où on la crée.

---

## Ce qu'il faut livrer

1. `BalanceResponseDto` publie **`origine`** en **enum OpenAPI** (`SAISIE` | `IMPORT` |
   `A_NOUVEAUX` | … — les valeurs réelles d'`OrigineBalance`), pas en `string` libre : c'est la
   leçon de STORY-385, on ne la repaie pas.
2. `BalanceResponseDto` publie **`balanceSourceId`** (optionnel — seules les balances issues d'une
   reprise en portent un).
3. `GET /dossiers/{id}/balances` accepte un filtre **`origine`**, pour que le front demande
   « les balances hors socle » au serveur au lieu de trier ce qu'il a sous la main.

⚠️ **Aucun changement de calcul, aucun événement touché** : les deux champs sont déjà écrits et déjà
persistés. La story ouvre le contrat de lecture, elle ne produit rien de neuf.

---

## Critères d'acceptation

1. `origine` figure au DTO de lecture, en enum, avec la valeur réelle des documents existants — y
   compris les balances antérieures qui ne portent pas le champ (`origine` absent ⇒ le DTO dit quoi,
   explicitement : ni `A_NOUVEAUX` deviné, ni valeur inventée).
2. `balanceSourceId` figure au DTO, absent quand il n'y en a pas — *absent*, pas `null` ni chaîne vide.
3. `GET …/balances?origine=…` filtre côté serveur ; une valeur inconnue est refusée, pas ignorée.
4. `ANouveauxResponseDto` est inchangé.

---

## Notes

- **Ce que FE-047 a livré en attendant** : l'écran n'affirme rien qu'il ne sache. Avant l'aperçu il
  annonce « dernière balance validée de cet exercice » — une phrase vraie de ce que le front voit ;
  après l'aperçu, il affiche la balance que le **serveur** dit avoir reprise (`balanceSourceId` de la
  réponse), résolue dans la liste déjà chargée. Le contournement se retire quand cette story est
  livrée, **pas avant**.
- Voisine de **STORY-386** et **STORY-387** (mêmes routes, même revue) mais indépendante : celle-ci
  porte sur le **DTO de lecture des balances**, pas sur les refus.
