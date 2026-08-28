# STORY-551 : La colonne N-1 est retraitée avec la table de passage d'aujourd'hui — et la liasse ne le dit pas

Status: ready-for-dev

**Épic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan` (moteur)
**Points :** 3 · **Sprint :** S20
**Origine :** lecture du corpus pédagogique `Image_lecons` (2026-08-28) — fiches **2.2 permanence
des méthodes** et **2.5 indépendance des exercices**, qui sont la justification comptable de la
colonne N-1 et du verrou de référentiel.
**Réf. code :** `bilan-engine.service.ts` (`soldesN`, `soldesN1` → **un seul** `pkg` résolu) ·
`bilan-production.service.ts:construireControle` ·
`comparaison-exercices.service.ts` (`referentielHomogene`, `referentielsEnPresence`)

---

## Le fait

Le moteur résout **un** paquet de référentiel et le passe aux deux agrégations :

```ts
produireBilan(referentielRef, soldesN, soldesN1?)  // un pkg, deux jeux de soldes
```

La colonne N-1 est donc calculée avec **la table de passage, les formules et les surcharges
d'aujourd'hui**, appliquées à la balance de l'année dernière.

⚡ **Ce n'est pas un défaut : c'est ce que la permanence des méthodes demande.** Comparer deux
exercices ventilés selon deux méthodes différentes produirait des variations qui ne mesurent que
le changement de méthode. Le moteur a raison.

⛔ **Le défaut est qu'il le fait en silence.** Le SYSCOHADA révisé impose de **mentionner** tout
retraitement des comparatifs. Ici, un lecteur de la liasse — banquier, associé, contrôleur — voit
deux colonnes qu'il croit être « ce qui a été déposé l'an dernier » et « ce qui sera déposé cette
année ». La colonne N-1 n'est ni l'un ni l'autre : c'est **la balance N-1 relue avec la méthode
N**, ce qui peut différer poste à poste de la liasse réellement déposée en N-1.

## Le contraste interne, et il est frappant

`bilan-service` sait déjà dire ça — **ailleurs**. `ComparaisonExercicesService` (FR-024,
STORY-074) publie :

| Champ | Ce qu'il dit |
|---|---|
| `referentielHomogene: boolean` | les exercices comparés partagent-ils la même version |
| `referentielsEnPresence[]` | lesquelles, nommément |
| `409 REFERENTIELS_HETEROGENES` | codes différents ⇒ aucun tableau honnête n'existe |
| garantie **D4** | *« chaque valeur vient de la colonne N du snapshot de son exercice ; la colonne N-1 d'un snapshot n'est jamais réutilisée »* |

⇒ **La comparaison par snapshots déclare sa méthode. La colonne N-1 du Bilan ne déclare rien.**
Et c'est la seconde que l'écran affiche (FE-031 amendement ① : le comparatif N-1 passe par
`soldesN1` dans le corps du dry-run, pas par `…/comparaison/…`).

⚠️ Les deux ne peuvent pas être alignées par la même réponse : la comparaison lit des liasses
**figées** (D1), le Bilan **recalcule**. C'est justement pourquoi la seconde doit dire qu'elle
recalcule.

## Périmètre

**Inclus**

- `BilanDto` publie un bloc `methodeN1`, présent **uniquement quand `soldesN1` est fourni** :
  - `retraite: true` — la colonne N-1 est produite par la méthode N, pas relue d'un dépôt ;
  - `referentiel: { code, version }` et `stamp` — les mêmes que N, **affirmés** plutôt que
    supposés (aujourd'hui le lecteur doit déduire de l'absence d'un second `stamp`) ;
  - `surchargesAppliquees: number` — combien d'arbitrages de la table de passage ont été
    appliqués aux deux colonnes. Zéro est une information ; le champ absent n'en est pas une.
- Le même bloc sur `CompteResultatDto` et `TftDto`, qui prennent `soldesN1` par le même chemin.

**Hors périmètre**

- **Comparer la colonne N-1 recalculée à la liasse N-1 réellement déposée.** Ce serait la vraie
  information (« votre poste AZ valait 12 M au dépôt, il en vaut 11 M relu à la méthode
  d'aujourd'hui »), et elle exige de lire un `SnapshotLiasse` — donc la persistance, hors
  périmètre ici. ⇒ **À ficher à part si le PO la veut** ; c'est le prolongement naturel de
  FR-024 et le seul chemin qui rendrait le retraitement *chiffré* et non seulement *déclaré*.
- Refuser un `soldesN1` d'un exercice non comparable. Rien ne relie encore une balance à un
  exercice du dossier autrement que par des dates (STORY-381 a livré `exerciceId` côté balance ;
  le dry-run, lui, reçoit des soldes bruts).

## Critères d'acceptation

1. Un dry-run **avec** `soldesN1` publie `methodeN1` complet ; **sans** `soldesN1`, le bloc est
   absent — pas présent à `null`, ce qui laisserait croire à un comparatif vide.
2. `methodeN1.surchargesAppliquees` compte les surcharges `VALIDATED` effectivement appliquées,
   et vaut `0` quand il n'y en a aucune.
3. Une liasse **persistée** (`POST …/bilan/etats`) porte le même bloc dans son snapshot : le
   retraitement doit survivre au figement, sinon la mention disparaît là où elle compte le plus.
4. Le bloc est au contrat OpenAPI avec ses types explicites (règle STORY-398).
5. Témoin de non-régression : aucune valeur de poste, aucun total, aucun `ecartN` ne change.

## Notes

- ⚡ **Deux principes, une seule story** : *permanence des méthodes* (2.2) dit qu'on applique la
  même méthode aux deux exercices — le moteur le fait ; *indépendance des exercices* (2.5) dit
  que chaque exercice porte ses propres charges et produits — d'où l'obligation de signaler
  qu'une des deux colonnes a été relue. Les deux ensemble donnent : **retraiter, et le dire.**
- ⚠️ L'écran distingue déjà « N-1 absent » de « N-1 = 0 »
  (`bilan.etats.comparatif.legendeSansComparatif`). Cette story ajoute la troisième mention qui
  manque : **« N-1 recalculé »**. Restitution : **FE-087**.
