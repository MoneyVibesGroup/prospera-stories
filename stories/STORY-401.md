# STORY-401 : Aucun contrôle bloquant ne regarde les comptes non affectés — le hook de FR-006 n'a jamais été posé

Status: ready-for-dev

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008) · *atterrit dans le
code d'EPIC-011 (batterie de contrôles) et s'applique par le gate d'EPIC-012*
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan/jeu-etats`
**Points :** 3 · **Sprint :** S20
**Origine :** remontée le **2026-08-24** par **FE-030**, en écrivant le bandeau de garde
que son AC-4 exigeait — et en découvrant que la phrase demandée était fausse.

---

## Le fait, relevé à la source

La batterie bloquante compte **quatre** contrôles, et pas un ne regarde les comptes non
affectés :

```ts
// controles-coherence.types.ts
export type CodeControle =
  | 'EQUILIBRE_BILAN'
  | 'COHERENCE_RESULTAT'
  | 'VARIATION_TRESORERIE'
  | 'ARTICULATION_NOTES';
```

Et la validation n'exige rien d'autre que leur drapeau :

```ts
// jeu-etats.service.ts — valider()
if (!liasse.controles.valide) { /* 422 */ }
```

Le service **le dit lui-même**, dans le commentaire de son propre contrat :

> `nonMappes` est le signal qu'**EPIC-011** consommera pour bloquer la validation sur des
> comptes **significatifs** (la « significativité » = solde, indisponible ici → hook).

⛔ **Le hook n'a jamais été posé.** EPIC-011 est clôturé, EPIC-012 aussi, et
`nonMappes` n'apparaît dans aucun des deux.

---

## Ce que ça coûte, concrètement

Un compte non affecté n'est pas ignoré au sens du rattachement — il est bien listé — mais
son **solde est écarté de tous les états** : `BilanProductionService.agreger` n'itère que
sur `rattachement.mappes`. Une liasse peut donc être **produite et validée** en laissant
plusieurs millions de francs hors des totaux, sans qu'aucun contrôle ne le dise.

⚠️ **Ce n'est pas invisible pour autant, et c'est ce qui rend la story utile plutôt
qu'urgente** : comme le débit et le crédit écartés ne se compensent pas, l'omission
déséquilibre ce qui reste, et `EQUILIBRE_BILAN` finit par échouer. Le refus arrive donc —
mais **il désigne la mauvaise cause**. « L'actif ne correspond pas au passif » envoie
chercher une erreur d'écriture ; la cause réelle est ailleurs, et elle est nommable.

⚠️ **Et il existe un cas où rien ne le dit du tout** : si les montants écartés se
compensent (autant au débit qu'au crédit), la liasse est **équilibrée, validable, et
fausse** — un total d'actif et un total de passif tous deux minorés du même montant.

⇒ **Contournement en place (FE-030), et il a exigé de réécrire l'AC-4** : l'écran
n'annonce **pas** que la validation sera bloquée — elle ne l'est pas, et le serveur
l'aurait démenti au premier essai. Il annonce ce qui est **calculable et démontrable** :
les montants écartés au débit et au crédit, l'écart qui en résulte, et le fait que la
balance retenue étant équilibrée, ce qui en reste ne peut plus l'être. Un montant et une
conséquence, pas une menace.

---

## Périmètre

**Inclus**

- Un **cinquième contrôle** dans la batterie — `COMPTES_NON_AFFECTES` — porté par la même
  mécanique que les quatre autres (`categorie`, `statut`, `ecart`, `elements`).
- **Définir la significativité, et la définir par une valeur, pas par un adjectif.** La
  définition la plus défendable, et celle que le front applique déjà : *un compte non
  affecté est significatif si son solde est non nul*. Un seuil en francs est possible mais
  demande un arbitrage PO — et un seuil non tranché vaut moins qu'une règle nette.
- `BLOQUANT` ou `INFORMATIF` : **à trancher explicitement**, et le choix se justifie dans
  la story. `BLOQUANT` ferme le cas silencieux (montants qui se compensent) ; `INFORMATIF`
  laisse valider une liasse dont on sait qu'elle écarte des montants.
- Les `elements` de l'anomalie nomment **les comptes concernés et leur solde** — c'est
  tout l'intérêt par rapport à `EQUILIBRE_BILAN`, qui ne peut désigner que des totaux
  (« jamais un compte deviné », dit son propre contrat).

**Hors périmètre**

- **Affecter automatiquement** un compte non reconnu : l'automatisation propose, l'humain
  arbitre (invariant programme). Ce contrôle **signale**, il ne corrige pas.
- Le seuil de significativité en francs, s'il devait être autre chose que « solde ≠ 0 » :
  c'est une **décision PO**, à poser avant, pas à improviser dans le code.

---

## Critères d'acceptation

1. `CodeControle` compte un cinquième membre, et l'ajout **casse la compilation** de tout
   exhaustif qui ne le traite pas (patron STORY-375).
2. Une liasse produite sur des soldes dont un compte non affecté porte un solde non nul
   fait apparaître le contrôle en `ANOMALIE`, avec **les comptes** et **leurs soldes** en
   `elements`.
3. Les comptes non affectés **à solde nul** ne déclenchent rien — ils ne déplacent aucun
   total, et une alerte généralisée est pire que pas d'alerte.
4. Le cas **silencieux** est couvert par un test dédié : des montants écartés qui se
   compensent exactement produisent une liasse `EQUILIBRE_BILAN = OK` **et** ce contrôle
   en `ANOMALIE`.
5. La catégorie retenue (`BLOQUANT` / `INFORMATIF`) est **écrite et justifiée**, et le
   comportement de `valider()` s'y conforme.

---

## Notes

- ⚠️ **La story ne rouvre pas EPIC-011/012** : le hook qu'elle pose est déclaré par
  **FR-006** (`table-de-passage.types.ts`), c'est-à-dire par EPIC-010. Elle atterrit
  simplement dans le code des deux épics clôturés.
- ⚠️ **Conséquence frontend à ne pas oublier** : le jour où ce contrôle existe, le bandeau
  de FE-030 peut redevenir la phrase que la fiche demandait au départ — et **FE-034** peut
  lister ce blocage parmi les autres. Consommateurs nommés : **FE-030**, **FE-034**.
- ⚠️ **Écart de même famille que STORY-386** (« un champ de réponse dont l'échec est
  refusé en amont n'est pas un verdict ») : ici, c'est l'inverse exact — un verdict que la
  fiche annonçait et que **rien** ne produit. Dans les deux cas, la fiche décrivait un
  comportement que le service n'a pas.
