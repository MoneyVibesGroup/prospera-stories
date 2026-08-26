# STORY-393 : Les cahiers lèvent deux 409 aux gestes opposés, et le contrat n'en documente qu'un

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-082**, **STORY-083**, **STORY-087** et **STORY-374**
**Priorité :** Must Have
**Story Points :** 1
**Statut :** in_progress
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

---

## Progress Tracking

**Statut :** `in_progress` — démarré le 2026-08-26 (branche `MNV-393`, `balance-service` + `docs/`).

### ① Audit à la source — les prémisses de la story, vérifiées et non supposées

Relevé sur `origin/dev` (`e711048`), en **comptant les `throw`**, jamais les puces :

| ce que la story affirme | vérifié | preuve |
|---|---|---|
| `exigerExerciceModifiable` lève **deux** 409, `estClos` **en premier** | ✅ | `cahiers-recettes.service.ts:812-833` · `cahiers-depenses.service.ts:1108-1129` — code **identique** dans les deux |
| les 4 routes d'écriture recettes n'annoncent que `BALANCE_VALIDEE_IMMUABLE` | ✅ | `cahiers-recettes.controller.ts:109,145,261,286` |
| idem dépenses | ✅ | `cahiers-depenses.controller.ts:117,153,276,301` |
| `POST …/pieces/ocr/{lotId}/appliquer` traverse le même verrou | ✅ | `pieces-ocr.controller.ts:218` → `pieces-ocr.service.ts:268-269` → `creerLotOcr` → `exigerExerciceModifiable` |
| `AgregationController` lève aussi `ExerciceClosException` *(point 2 — à vérifier)* | ✅ **confirmé** | `agregation.service.ts:118`, **avant tout autre contrôle** ; son `@ApiConflictResponse` (`agregation.controller.ts:81`) ne nomme que `SYSTEME_COMPTABLE_INDETERMINE` |

### ⚡ Deux écarts que la story n'énonçait pas — relevés par l'audit

1. **La route OCR `appliquer` n'a AUCUN `@ApiConflictResponse`** — elle ne manque pas
   `EXERCICE_CLOS`, elle manque **les deux codes**. N'y déclarer que `EXERCICE_CLOS` recréerait
   à l'identique, en miroir, le mode de panne que cette story existe pour fermer. ⇒ le décorateur
   est **créé** avec les deux, dans l'ordre d'évaluation.
2. **Le reste du service documente déjà `EXERCICE_CLOS`** — `balance.controller.ts:107`,
   `rapprochement.controller.ts` (5 routes), `releves.controller.ts:120`, et toute la famille
   fiscale via la constante partagée `DESCRIPTION_409_GEL` (`fiscal.controller.ts:58`). **Le trou
   est exactement la famille cahiers**, ni plus ni moins : l'AC-1 est donc atteignable dans le
   périmètre de la story, sans déborder.

### 🔁 Réutilisation plutôt que réinvention

`fiscal.controller.ts:58` porte déjà le patron exact que cette story demande — une constante
partagée qui nomme les deux codes **dans l'ordre d'évaluation** :

```ts
export const DESCRIPTION_409_GEL =
  'EXERCICE_CLOS | BALANCE_VALIDEE_IMMUABLE — après validation, tout retraitement est figé.';
```

⇒ la famille cahiers reçoit **la même mécanique**, pas une rédaction ad hoc route par route :
une seule constante, cinq points d'usage, et l'ordre écrit une fois pour toutes.

### ③④ Développement, portes DoD et vérification docker

**Correctif.** `DESCRIPTION_409_GEL_CAHIERS` (`cahiers-communs.exceptions.ts`), sur le modèle de
`DESCRIPTION_409_GEL` côté fiscal et **dérivée des enums de codes** ; posée sur les 8 routes
d'écriture des deux cahiers et sur `POST …/pieces/ocr/{lotId}/appliquer`. `POST …/balance/depuis-cahiers`
reçoit `EXERCICE_CLOS` seul — **pas** `BALANCE_VALIDEE_IMMUABLE`, vérifié absent de ce chemin.

**⚡ Le défaut de cette story, retourné contre son propre correctif — trouvé par la mutation, pas par la revue.**

`@RequiresDossierScope()` pose son `ApiConflictResponse` au niveau de la **classe**. Un
`@ApiConflictResponse` de **méthode** ne s'y ajoute pas : il le **remplace**. Poser le décorateur de
gel sur la route OCR — la seule de la famille qui n'en avait aucun — y a donc **effacé du contrat le
`DOSSIER_ARCHIVE` publié**, un refus bien réel, au moment même où l'on prétendait compléter le contrat.
Ni la garde d'ordre ni celle de non-régression ne pouvaient le voir : elles ne regardent que les deux
codes de gel. ⇒ les trois codes sont désormais portés ensemble, et un **filet dédié** le garde.

**⚡ Et la garde de non-vacuité était VIDE.** Elle exigeait « un `409` est publié » — or ces routes en
publient un **quoi qu'il arrive** (celui de la classe). Elle serait restée verte sur une route dont le
décorateur de gel a **entièrement disparu**. C'est la mutation M3 qui l'a prise en défaut, pas la
lecture. Elle exige désormais que la route **existe**, ce qu'elle voulait dire.

**🪤 Piège de méthode rencontré, et qui a failli faire conclure l'inverse.** Le `git checkout --` de
restauration entre deux mutations a **effacé le correctif `DOSSIER_ARCHIVE` non encore commité** : la
suite complète est repassée au rouge après une batterie annoncée « tout vert », et le rouge « inexpliqué »
de la mutation M5 s'est révélé être un **vrai positif** mal attribué. ⇒ commiter **avant** de muter.

**Batterie de mutation — 7 mutations, 7 rouges, chacune après un `build` OK** (un rouge par erreur de
compilation ne prouve rien) :

| # | mutation | test qui rougit |
|---|---|---|
| M1 | ordre inversé dans la constante partagée | `…EXERCICE_CLOS EN PREMIER` |
| M2 | une route de cahier revient à l'ancienne description | ordre + « aucune autre » |
| M3 | la route OCR reperd son décorateur de gel | ordre + « aucune autre » |
| M4 | `DOSSIER_ARCHIVE` retiré de la constante | filet anti-écrasement |
| M5 | l'agrégation s'aligne « par symétrie » sur `BALANCE_VALIDEE_IMMUABLE` | asymétrie voulue |
| M6 | le gel déclaré sur une **lecture** de cahier | « aucune autre » (branche morte) |
| M7 | ordre **d'exécution** inversé dans `exigerExerciceModifiable` | les 2 tests HTTP d'ordre |

**Portes DoD** — lint 0 warning · build OK · **3 052** unitaires + **729** e2e verts ·
couverture **98,98 / 91,87 / 98,18 / 99,07** (seuils 65/90/90/90).

**Vérification docker** (stack `mongo`+`kafka`+`redis`+`balance-service`, conteneur exécutant bien le
code de la branche — `Found 0 errors. Watching for file changes.`), sur `/api/docs-json` **réellement
servi** par `:3007`, 103 routes publiées :

- **AC-1 a)** les **9** routes à deux verrous nomment les 3 codes, `EXERCICE_CLOS` **avant**
  `BALANCE_VALIDEE_IMMUABLE` — 9/9 ✅ ;
- **AC-1 b)** `…/balance/depuis-cahiers` : `EXERCICE_CLOS` ✅, `SYSTEME_COMPTABLE_INDETERMINE` ✅,
  `DOSSIER_ARCHIVE` préservé ✅, `BALANCE_VALIDEE_IMMUABLE` **absent** ✅ ;
- **AC-1 c)** les **12** autres routes de la famille (lectures, dépôt/lecture de lot OCR) : **0**
  annonce `EXERCICE_CLOS` ✅ — aucune branche morte ;
- **AC-2** prouvé au niveau **HTTP** (le `code` que le client lit sort du filtre d'exception, pas du
  `throw`) : exercice clos **et** balance validée → `EXERCICE_CLOS` sur `POST`, `PATCH` et `DELETE` ;
- **AC-3** aucun message, aucun code, aucun statut modifié — et `DOSSIER_ARCHIVE`, un instant perdu,
  restauré.

### ⛔ Deux écarts MESURÉS, laissés HORS PÉRIMÈTRE (stories suivantes)

Relevés en appliquant la règle de cette story — *compter les `throw`* — au-delà de la famille cahiers.
**Non corrigés ici** : autre famille, autres consommateurs, et le périmètre se respecte à la lettre.

1. **4 routes lèvent `EXERCICE_CLOS` et ne le déclarent pas** — `submit`/`dryRun` de `BalanceService`
   le lèvent **inconditionnellement, en tête de méthode** :
   `POST …/balance/a-nouveaux` (publie `SOCLE_DEJA_GENERE`) · `POST …/balance/affectation-resultat`
   (`RESULTAT_DEJA_AFFECTE`) · `POST …/balance/import` (`PROFIL_INACTIF`) · `POST …/balance/import/sage`.
   C'est **exactement** le défaut de STORY-393, dans la famille des adaptateurs #1/#2.
2. **45 routes** sous `/dossiers/{dossierId}` publient un `409` **sans** `DOSSIER_ARCHIVE` : leur
   `@ApiConflictResponse` de méthode masque celui de `@RequiresDossierScope()`. Défaut **de mécanisme**,
   pas d'oubli — il se reproduira à chaque route d'écriture ajoutée tant que le masquage n'est pas traité.
