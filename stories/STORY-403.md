# STORY-403 : Une page de cahier porte les DEUX sens — la destination doit devenir une propriété de la ligne, pas du lot

Status: done

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

**Statut : `done`** — implémentée, validée, vérifiée en docker sur stack neuve, revue (code +
sécurité), vérification **rejouée** sur l'état final, mergée en rebase sur `dev`. Clôturée le
**2026-08-27**.

**PR** : `prospera-balance-service` **#61**, 2 commits — feature (`aab87b9`) puis revue (`729e977`).
Un seul dépôt : la story ne touche aucun contrat d'événement.

### Livré

- **`LigneRetenueDto.destination?`** (`RECETTES | DEPENSES`, `@IsOptional() @IsIn([...DESTINATIONS_LOT])`)
  — **omise, elle reprend celle du lot** : aucune migration, aucun client cassé.
- **`PiecesOcrService.appliquer` partitionne** les lignes retenues par destination effective et appelle
  les **deux** cahiers, **celui du lot d'abord**. Quand rien n'est redirigé, la seconde moitié est vide
  et n'est jamais appelée : le chemin reste exactement celui d'avant (AC-2).
- **Le rapport nomme par cahier** : `creeesParCahier: { recettes, depenses }` (classe explicite, jamais
  un `Record` qui publierait un `object` opaque — leçon STORY-376) et une `destination` sur chaque
  `RejetPieceDto`. Les rejets se réalignent sur **leur moitié**, plus sur la liste globale.
- **`avertissementsApresArbitrage`** (pure, `pieces-ocr.regles.ts`) : `SENS_CONTRAIRE` tombe quand la
  destination choisie **s'accorde** avec le sens lu ; l'inverse reste porté.
- **L'arbitrage est reposé sur le brouillon** (`marquerAppliquee` gagne `{ destination, avertissements }`,
  dans la transaction existante) : sans quoi le brouillon d'une page mixte annoncerait le cahier du LOT
  pour une pièce entrée dans l'autre. `LignePreProposeeDto` publie désormais cette `destination`.

### ⛔ Le défaut que la partition aurait introduit, trouvé AVANT le premier test

`construireEntree` construisait l'entrée depuis `brouillon.destination`, celle du **lot**. Les deux
cahiers nomment différemment la même chose — `tiers` en recettes, `fournisseur` en dépenses — et
refusent tout champ étranger (`forbidNonWhitelisted`). Une ligne redirigée aurait donc envoyé
`fournisseur` au cahier de recettes et se serait fait **rejeter en bloc** : l'AC-1 n'aurait pas tenu,
et rien dans la story ne le disait. Elle prend désormais la destination **effective**.

### Portes de qualité

Lint **0 warning** · build OK · **3101 unitaires** + **743 e2e** verts · couverture globale
**99,13 / 92 / 98,55 / 99,23** (seuils 65/90/90/90) · `pieces-ocr.service.ts` 100 / 85,1 / 100 / 100.

**9 mutations appliquées, chacune vérifiée ROUGE puis restaurée** :

| # | mutation | test qui vire au rouge |
|---|---|---|
| 1 | `construireEntree` repart de `brouillon.destination` | « le tiers d'une ligne REDIRIGÉE prend le nom du cahier d'ARRIVÉE » |
| 2 | la partition ignore la destination de ligne | 6 tests, dont le cas du persona |
| 3 | `avertissementsApresArbitrage` filtre toujours | 2 tests (règle pure + service) |
| 4 | le brouillon reçoit la destination du LOT | AC-5 « l'arbitrage est REPOSÉ sur le brouillon » |
| 5 | les rejets se réalignent sur la liste globale | AC-4 + « un rejet du SECOND cahier nomme la pièce de SA moitié » |
| 6 | le refus global remonte toujours | « ce qui est déjà écrit est RAPPORTÉ, jamais perdu » |
| 7 | le refus global est toujours converti en rapport | « le 409 RESTE un 409 » |
| 8 | la trace en échec redevient bloquante | « n'empêche pas la SECONDE moitié d'entrer au cahier » |
| 9 | une erreur non métier se déguise en rapport | « une erreur NON MÉTIER remonte toujours » |

⚠️ Les mutations 7 et 9 ne compilent pas telles quelles : le **typage** de `decrireRefus(erreur: HttpException)`
interdit qu'une erreur non narrowée l'atteigne. Il a fallu ajouter un `as HttpException` pour les rendre
exécutables — le compilateur est ici une seconde garde, et il fallait la contourner pour prouver que le
test en est une aussi.

### Vérification docker (stack neuve, `down -v`) — puis REJOUÉE sur l'état final

Parcours réel : `register` → dossier propagé par Kafka → référentiel `syscohada-revise@2.1` attaché à
l'entitlement → catégorie de dépense créée par HTTP → lot + brouillons semés en base (ce que la
projection écrit ; la story ne la touche pas) → `POST …/appliquer`.

- **⚡ Le cas du persona, mesuré en base** : lot déposé en `DEPENSES`, 3 pièces dont 2 de `sens: ENTREE`
  dirigées vers `RECETTES` ⇒ **une seule requête**, **2 `lignes_recettes`** (champ **`tiers`**) +
  **1 `lignes_depenses`** (champ **`fournisseur`**), toutes `origine: OCR`.
- **Arbitrage persisté** : les 3 brouillons portent la destination **effective** et `avertissements: []`
  — le `SENS_CONTRAIRE` des deux ventes a disparu (AC-5), celui d'une ligne contredisant son sens reste.
- **Liens non orphelins** : 3 `outbox_events` `cahier.piece.rattachee`, chaque `ligneCahierId` pointant
  une ligne réelle **du bon cahier**. 0 orphelin.
- **AC-4** : dépense sans `categorieId` ⇒ **200** + rejet par ligne
  (`LIGNE_INVALIDE`, `destination: DEPENSES`), la recette de la même requête entre normalement. La pièce
  rejetée ne laisse **aucune** trace (0 brouillon marqué, 0 outbox).
- **Atomicité de la trace** prouvée par un **index unique piège** (partiel, borné au lot) qui fait échouer
  la 2ᵉ insertion d'outbox en cours de transaction ⇒ **0** brouillon marqué, **0** outbox : tout ou rien.
- **Rejouée après le correctif de revue** : page mixte identique (2 + 1, liens intacts) ; puis exercice
  **clos par `dossier-service`** (chemin Kafka réel, read-model `exercices_dossier` passé à `CLOS`) ⇒
  **409 `EXERCICE_CLOS`**, `lignes_recettes`/`lignes_depenses` **inchangées**, 0 brouillon marqué.

⚠️ **Ce que la vérification docker ne peut PAS atteindre, et pourquoi** : le refus global du **second**
cahier après écriture du premier. Les deux cahiers évaluent le **même** verrou sur le **même** exercice
et le **même** dossier — un refus frappe donc toujours le premier appel. Ce chemin n'existe que sous
**concurrence** (une balance validée entre les deux appels). Il est couvert en unitaire et en e2e, avec
les mutations 6, 7 et 9 pour preuve que les tests filtrent.

### Hors périmètre (assumé, documenté)

- **Deviner la destination depuis le `sens`** sans confirmation humaine : invariant D4 / NFR-A05. Le
  serveur ne redirige **jamais** de lui-même ; `destination` est pré-remplie **à l'écran**.
- **Déduplication d'une image déposée deux fois** : le contournement FE-044 reste licite.

### Défauts PRÉ-EXISTANTS relevés, non corrigés ici

1. **`POST …/appliquer` n'est pas idempotente** : rien ne lit `brouillon.ligneCreeeId` avant d'écrire, un
   rejeu duplique les lignes. Antérieur à cette story ; le correctif de revue en réduit la probabilité
   (un refus du second cahier ne pousse plus au rejeu) sans fermer la porte.
2. **Un même `pieceId` répété dans `lignesRetenues`** crée deux lignes. Cette story en change la couleur —
   les deux doublons peuvent désormais atterrir dans **deux cahiers différents**, et `marquerAppliquee`
   n'en trace que le dernier.
3. **`tracerApplication` relance son erreur** au lieu de journaliser sans propager, contrairement à
   `.agents/rules/transactions-mongo.md` (« hooks post-commit isolés ») **et à son propre JSDoc** : une
   trace en échec rend un 500 sur une écriture comptable pourtant réussie. Mesuré pendant la vérification
   docker. Cette story se borne à ne plus laisser cet échec bloquer la seconde moitié.

## Revue de code — 3 constats, dont 1 bloquant

### ⛔ BLOQUANT — un refus global du SECOND cahier effaçait le rapport du premier

Les deux cahiers écrivent dans **deux transactions distinctes**. Un refus **global** du second —
`BALANCE_VALIDEE_IMMUABLE`, `EXERCICE_CLOS`, `DOSSIER_ARCHIVE` — remontait tel quel alors que le premier
venait de commiter ses lignes. Le comptable recevait un **409 nu**, sans un mot sur ce qui était déjà au
cahier ; l'application n'étant pas idempotente, il rejouait la requête et **doublait** ses lignes.

⚠️ **Le JSDoc affirmait pourtant l'inverse** — « la première moitié […] est rapportée comme telle » — et
la prémisse qui l'accompagnait (« les refus globaux s'évaluent sur le même état, le premier cahier échoue
avant d'écrire ») ne vaut **qu'en l'absence de concurrence** : `exigerExerciceModifiable` relit la base au
début de **chaque** appel.

Corrigé en distinguant les deux moments, ce qu'aucune des deux réponses seules n'aurait fait
correctement :

- **rien n'est encore écrit** ⇒ le refus **reste** un refus. Le convertir en rapport rendrait **morte** la
  branche 409 que le contrat publie — exactement le défaut que STORY-393 a fermé ;
- **la première moitié est commitée** ⇒ le refus devient un rejet **par ligne** de la seconde. C'est aussi
  ce que dit l'AC-4 : *jamais un échec global du lot* ;
- **erreur non métier** (bug, panne) ⇒ elle remonte toujours, l'incident reste visible.

### ⚠️ Une trace en échec privait le comptable de la seconde moitié

Conséquence **nouvelle** de la partition : `tracerApplication` relançant son erreur, un échec sur la
première moitié empêchait la seconde d'être écrite — alors que la story promet **une** requête pour toute
la page. L'erreur est désormais levée **après** les deux écritures. Comportement inchangé sur un lot à un
seul cahier.

### ⚠️ Le JSDoc de `LigneRetenueDto` rattachait encore `valeurs` au LOT

Dans le fichier même qui rend la destination propre à la ligne. C'est précisément la lecture « le lot
décide » qui produit l'envoi de `fournisseur` au cahier de recettes.

### Constat écarté

« Arbre de travail non restauré, ne compile pas » : la mutation en cause avait été laissée par l'outil de
revue **lui-même**, jamais commitée. Le code poussé était correct.

### Seconde lentille — over-engineering

`creees` est accumulé dans la boucle plutôt que reconstruit par un second `flatMap`, et `ordreDEcriture`
redevient une constante locale commentée : une traversée et une méthode en moins. Rien d'autre à retirer —
`CreeesParCahierDto`, `avertissementsApresArbitrage` et `LigneAEcrire` sont exigés par les AC ou par les
conventions du dépôt.

## Revue de sécurité — 0 vulnérabilité introduite

Garde centrale **vérifiée activement** : `@IsIn([...DESTINATIONS_LOT])` sur `LigneRetenueDto.destination`
filtre réellement — muter la liste pour y admettre `IMMOBILISATIONS` fait virer l'e2e au rouge. Sans elle,
une chaîne arbitraire atteindrait `aEcrire[destination]` puis le `$set` Mongo.

Examinés puis écartés, avec leur raison :

- **Aucune asymétrie d'autorisation entre les deux cahiers** : mêmes `@Roles(TENANT_ADMIN, TENANT_USER)`,
  `@RequiresBalanceAccess()`, `@RequiresDossierScope()`, même `exigerExerciceModifiable`. Rediriger une
  ligne ne fait franchir aucun verrou plus faible.
- **Isolation multi-tenant** : `orgId` (JWT) **et** `dossierId` dans tout filtre ; lot d'une autre org ⇒
  **404** générique, jamais 403 ; `pieceId` inconnu de la `Map` scopée ⇒ `PIECE_INCONNUE`, indistinguable.
- **Injection NoSQL** : `destination` contrainte par `@IsIn`, `pieceId` par `@IsString/@MaxLength(128)`,
  `avertissements` recopiés depuis un enum fermé. Prototype pollution fermée par `@IsIn`.
- **`valeurs` inchangé**, toujours validé en `forbidNonWhitelisted` par les DTO des cahiers ;
  `niveauPreuve` et `pieceRef` restent posés **après** le spread, non surchargeables.
- **Charge Kafka inchangée** ; **aucun secret journalisé** (le nouveau log n'ajoute que des compteurs).
