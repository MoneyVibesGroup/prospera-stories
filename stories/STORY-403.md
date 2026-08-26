# STORY-403 : Une page de cahier porte les DEUX sens — la destination doit devenir une propriété de la ligne, pas du lot

Status: in_progress

> ⛔ **RENUMÉROTÉE 396 → 403 le 2026-08-25, à la fusion des branches — le contenu n'a pas changé d'un mot.**
>
> Deux stories différentes avaient pris l'id **STORY-396** le même jour, dans deux sessions
> concurrentes : celle-ci (ouverte par **FE-044**, sur question du PO à la revue de maquette) et
> « Une panne d'infrastructure rendue comme *votre pièce est illisible* » (`document-service`,
> ouverte à la vérification docker de STORY-385). Chaque session avait pourtant vérifié —
> `ls stories/` **et** `git log -S` — et chacune voyait l'id libre : **elles ne partageaient aucun
> commit**.
>
> ⇒ **Règle appliquée : l'id PUBLIÉ gagne.** L'autre était déjà sur `origin/main` *et* déjà
> référencée par `stories/STORY-385.md` ; la renuméroter aurait cassé une référence publiée. Celle-ci
> était locale et non poussée.
>
> ⇒ **Règle pour la suite : `ls stories/` + `git log -S` ne suffisent pas quand deux sessions
> travaillent en parallèle sans avoir fusionné** — ils ne voient que ce que la branche locale
> connaît. Faire `git fetch` et vérifier **aussi** `origin/main` avant d'attribuer un id.

**Épic :** EPIC-020 — Cahiers & pièces (Atelier Balance)
**Service :** `balance-service` (`:3007`) — module `cahiers/pieces-ocr`
**Points :** 5 · **Sprint :** S20
**Origine :** exigence PO du **2026-08-24**, posée à la revue de la maquette FE-044 :
> *« dans certains cas comme dans les cahiers des commerçants, les dépenses et les recettes sont mélangées sur une même image — comment tu gères cela ? »*

---

## Le fait, relevé à la source

`POST /dossiers/{id}/pieces/ocr` prend une **`destination` de LOT** (`RECETTES | DEPENSES`),
et l'application branche le lot **entier** :

```ts
// pieces-ocr.service.ts
const resultat =
  lot.destination === 'RECETTES'
    ? await this.recettes.creerLotOcr(user, dossier, exercice, aEcrire)
    : await this.depenses.creerLotOcr(user, dossier, exercice, aEcrire);
```

⚡ **L'extraction, elle, connaît déjà le sens de CHAQUE pièce.** `LignePreProposeeDto`
publie `sens?: 'ENTREE' | 'SORTIE'`, et `pieces-ocr.regles.ts` lève
`SENS_CONTRAIRE` quand il contredit la destination du lot :

```ts
export function sensContredit(sens: SensPiece | undefined, destination: DestinationLot): boolean {
  if (!sens) return false;
  return destination === 'RECETTES' ? sens === 'SORTIE' : sens === 'ENTREE';
}
```

⇒ **Le service VOIT la ligne qui appartient à l'autre cahier, et n'a aucun moyen de
l'y écrire.** C'est le seul avertissement de la liste qui ne désigne pas un défaut de
lecture (date illisible, montant illisible, faible confiance, doublon, TVA incohérente)
mais une **limite du contrat d'écriture**.

---

## Pourquoi ce n'est pas un cas limite

C'est le **cas nominal du persona**. Un commerçant tient **un** cahier, pas deux : la
page du 14 mars porte « vendu 12 000 » à la ligne 3 et « acheté carburant 5 000 » à la
ligne 4. Le découpage recettes / dépenses est une catégorie **comptable**, pas une
catégorie **physique** — et c'est précisément parce que le client ne fait pas ce
découpage que le cabinet existe.

⚠️ **Le risque n'est pas l'échec, c'est le résultat faux.** Une dépense rangée dans les
recettes gonfle le chiffre d'affaires **et** minore les charges : le résultat est faux
**deux fois**, et les deux erreurs se compensent assez bien pour survivre à une
relecture rapide. C'est exactement ce que `CompteHorsClasse6Exception` protège côté
saisie manuelle — et que le chemin OCR ne peut aujourd'hui pas protéger, faute de
pouvoir aiguiller.

---

## Contournement en place (FE-044), et ce qu'il coûte

Livré, honnête, et **sans changement backend** : la même image se dépose **deux fois**,
une fois par cahier. Chaque passage :

- ne **pré-coche pas** les pièces marquées `SENS_CONTRAIRE` — elles appartiennent à
  l'autre cahier ;
- l'annonce en toutes lettres (« *n pièces de cette page appartiennent à l'autre
  cahier* ») et renvoie vers lui.

**Ce que ça donne de bon** : rien n'est perdu, rien n'entre en double, et la pièce reste
justifiée des deux côtés (elle est stockée sous deux `pieceId`).

**Ce que ça coûte, et qui ne se règle pas côté écran** :

1. **l'OCR tourne deux fois** sur la même image — coût réel chez `document-service`,
   et deux `piece_extractions` pour une seule page physique ;
2. **le comptable relit deux fois la même page** ;
3. **la preuve est dédoublée** : deux `pieceId` pour une image, ce qui rend
   `STORY-392` (jointure ligne ↔ image) et `STORY-395` (pièces par exercice)
   plus bruyantes qu'elles ne devraient l'être ;
4. **rien n'empêche d'oublier le second passage** : la moitié dépenses d'une page
   disparaît alors sans trace côté serveur — seul l'écran l'avait signalée.

---

## Périmètre

**Inclus**

- `LigneRetenueDto` gagne une **`destination?: 'RECETTES' | 'DEPENSES'`** — omise, elle
  reprend celle du lot (aucune migration, aucun client cassé).
- `PiecesOcrService.appliquer` **partitionne** les lignes retenues par destination
  effective et appelle `recettes.creerLotOcr` **et** `depenses.creerLotOcr`.
- Le rapport (`AppliquerLotResponseDto`) distingue les lignes créées **par cahier** :
  un « 6 lignes créées » qui ne dirait pas où elles sont entrées serait invérifiable.
- `SENS_CONTRAIRE` cesse d'être levé quand la ligne porte une `destination` explicite
  qui **s'accorde** avec son sens : l'avertissement doit désigner ce qui reste douteux,
  pas ce que l'humain vient de trancher.

**Hors périmètre**

- **Deviner** la destination depuis le sens sans confirmation humaine. `sens` est une
  lecture machine ; l'invariant D4 / NFR-A05 (*l'humain seul crée des lignes de
  cahier*) ne se négocie pas, et un montant rangé du mauvais côté par déduction
  automatique est exactement l'erreur que cette story existe pour empêcher.
  ⇒ `destination` par ligne est **pré-remplie** depuis `sens` à l'écran, **jamais**
  appliquée sans que la pièce soit cochée.
- La déduplication d'une image déposée deux fois (le contournement reste licite).

---

## Critères d'acceptation

1. Un lot déposé en `DEPENSES` dont deux pièces portent `sens: 'ENTREE'` peut être
   appliqué en **une seule requête** et produit **2 lignes de recettes** + le reste en
   dépenses.
2. Une ligne retenue **sans** `destination` explicite entre dans le cahier du lot —
   comportement d'aujourd'hui, **inchangé** (test de non-régression).
3. Le rapport nomme, **par cahier**, ce qui est entré et ce qui a été rejeté.
4. Une ligne dirigée vers `DEPENSES` **sans `categorieId`** est rejetée **par ligne**,
   avec son motif — jamais un échec global du lot.
5. `SENS_CONTRAIRE` n'est plus levé sur une ligne dont la `destination` explicite
   s'accorde avec son `sens`.
6. Tests unitaires sur la partition, **et** un test qui couvre explicitement la page
   mixte de bout en bout.

---

## Notes

- Créée le **2026-08-24** par **FE-044**, sur question directe du PO. Le contrat a été
  relevé à la source (`pieces-ocr.service.ts`, `pieces-ocr.regles.ts`,
  `appliquer-lot.dto.ts`) **avant** rédaction — l'avertissement `SENS_CONTRAIRE`
  existait déjà et prouve que le besoin avait été **vu** côté serveur, sans être servi.
- ⚠️ **Recouvrement à surveiller avec STORY-392 / STORY-395** : les trois touchent la
  traçabilité d'une pièce. Celle-ci est la seule qui change une **écriture**.

---

## Progress Tracking

**Statut : `in_progress`** — développement démarré le **2026-08-26**, branche `MNV-403` sur
`prospera-balance-service` (base `dev`).
