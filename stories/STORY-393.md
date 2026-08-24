# STORY-393 : Les cahiers lèvent deux 409 aux gestes opposés, et le contrat n'en documente qu'un

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-082**, **STORY-083**, **STORY-087** et **STORY-374**
**Priorité :** Must Have
**Story Points :** 1
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

`CahiersRecettesController` annonce **un seul** `409` sur ses trois routes d'écriture :

```ts
@ApiConflictResponse({
  description: 'BALANCE_VALIDEE_IMMUABLE : la balance de cet exercice est validée, le cahier est figé (NFR-A07).',
})
```

Le service en lève **deux**, et il teste l'autre **en premier** :

```ts
// cahiers-recettes.service.ts — appelé par creer, creerLot, modifier, supprimer, appliquer OCR
private async exigerExerciceModifiable(orgId, dossierId, exercice) {
  if (await this.exercices.estClos(orgId, dossierId, exercice)) {
    throw new ExerciceClosException();          // ← 409 EXERCICE_CLOS — non documenté
  }
  if (await this.balances.existeBalanceValidee(...)) {
    throw new BalanceValideeImmuableException(); // ← 409 BALANCE_VALIDEE_IMMUABLE — documenté
  }
}
```

`ExerciceClosException` vit dans `modules/balance/reprise/exceptions/reprise.exceptions.ts` et
porte `code: EXERCICE_CLOS`. Elle est parfaitement propre — **elle n'est simplement déclarée nulle
part sur ces routes**, ni dans le Swagger des recettes, ni dans celui des dépenses, ni dans celui
de `POST …/pieces/ocr/{lotId}/appliquer` qui les traverse.

## Pourquoi ce n'est pas une coquille de documentation

**Les deux refus appellent des gestes opposés, sur deux écrans différents :**

| code | ce qui bloque | ce qu'il faut faire | où |
|---|---|---|---|
| `EXERCICE_CLOS` | l'exercice a été **clos** dans le dossier | **rouvrir l'exercice** (acte motivé, tracé) | fiche du dossier — FE-066 |
| `BALANCE_VALIDEE_IMMUABLE` | une balance validée **justifie** ce cahier | **repartir d'une nouvelle version de balance** | onglet Balances |

Un écran qui n'aurait lu que le contrat aurait traité **tout** `409` comme « balance validée » et
envoyé le comptable créer une version de balance — **sans effet**, puisque la cause est ailleurs.
C'est mot pour mot le mode de panne de `EXERCICE_MIGRATION_NON_REOUVRABLE` /
`EXERCICE_BORNES_DEJA_UTILISEES` relevé par FE-066, et la raison de la règle qui en est sortie :
**compter les `throw` du service, pas les puces de la fiche.**

⚠️ Et le refus est **d'autant plus atteignable** depuis STORY-374 : `estClos` interroge le
read-model `exercices_dossier`, alimenté par les événements `dossier.exercice.*`. Sa cohérence est
**différée** — un exercice rouvert à l'instant peut encore y être clos quelques secondes. Le front
ne peut donc pas se contenter de désactiver la saisie sur `statut: "CLOS"` lu depuis `:3009` : il
**doit** savoir recevoir ce `409` sur un exercice que son écran affiche « ouvert ». Un code qu'il
ne connaît pas le rend muet précisément là où il faut expliquer.

---

## Ce qui est demandé

1. Déclarer `EXERCICE_CLOS` dans l'`@ApiConflictResponse` des routes d'écriture des **deux**
   cahiers (`POST`, `POST /lot`, `PATCH /:id`, `DELETE /:id`) **et** de
   `POST …/pieces/ocr/{lotId}/appliquer`, en nommant **l'ordre d'évaluation** — clos d'abord,
   balance validée ensuite.
2. Auditer la même famille en passant : `AgregationController` (`POST …/balance/depuis-cahiers`)
   lève lui aussi `ExerciceClosException`. **Le vérifier, ne pas le supposer.**
3. ⚠️ **Ne pas fusionner les deux refus** ni les ranger sous un code générique. C'est
   exactement ce que cette story existe pour empêcher.

## Critères d'acceptation

1. `/api/docs-json` de `:3007` nomme `EXERCICE_CLOS` sur chacune des routes qui peut le lever,
   et sur aucune autre — une branche morte côté client est aussi trompeuse qu'un refus oublié
   (leçon FE-047).
2. Un test d'intégration prouve l'**ordre** : sur un exercice clos **dont la balance est aussi
   validée**, la réponse est `EXERCICE_CLOS`, jamais `BALANCE_VALIDEE_IMMUABLE`.
3. Aucun message, aucun code, aucun statut existant n'est modifié.

## Lien avec STORY-375 — et pourquoi elle ne suffit pas

⚡ **STORY-375 est `done` depuis le 2026-08-24, et elle NE FERME PAS cet écart.** Vérifié à la
source sur `origin/dev` **après** sa clôture (`c2e982e`) : `CahiersRecettesController` n'annonce
toujours qu'un seul `409`, et les seuls enums de codes publiés vivent sur `marquer-etat`,
l'ingestion et le profil société — **aucun sur les cahiers**.

C'est le piège symétrique de celui que ce dépôt connaît bien : on se méfie d'un `blocked` daté
qu'on n'a pas revérifié ; **une story `done` dont on suppose la portée coûte exactement la même
chose**, dans l'autre sens — sauf qu'elle donne l'illusion rassurante que le travail est fait.

⇒ Cette story reste entière. Elle coûte 1 point, elle débloque un écran, et le jour où la
mécanique de STORY-375 est **étendue aux cahiers**, elle devient vérifiable par le compilateur
plutôt que par une relecture.
