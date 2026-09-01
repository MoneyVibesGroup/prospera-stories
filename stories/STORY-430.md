# STORY-430 : Le comparatif N-1 n'est ni ordonné, ni daté, ni duré — rien n'empêche de comparer 2025 à 2022, ni 12 mois à 9

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `dto/bilan-dry-run-request.dto.ts`, `modules/bilan/etats`
**Points :** 3 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27. Confirmé sur la DSF déposée
`1000745307_2025_Definitif (1).xlsx`, dont l'en-tête porte **« Durée (en mois) : 12 »**.

---

## Le fait

`BilanDryRunRequestDto` reçoit `soldesN` et `soldesN1` — **deux tableaux de soldes nus** :

```ts
soldesN!:   LigneSoldeDto[];   // { compte, soldeDebiteur, soldeCrediteur }
soldesN1?:  LigneSoldeDto[];
```

Aucune identité d'exercice n'accompagne les soldes. Le serveur ne sait donc pas :

- **quel exercice** est N, ni quel exercice est N-1 ;
- **dans quel ordre** ils sont (rien n'interdit de poster 2022 en `soldesN1` d'un 2025, ni
  l'inverse) ;
- **combien de mois** chacun couvre.

⇒ Le comparatif est **entièrement à la charge de l'écran**, et une erreur d'appariement
**ne rougit nulle part** : elle s'affiche comme un fait, et toutes les variations calculées
dessus se lisent comme des anomalies de gestion.

## La durée n'est pas un raffinement

Le formulaire officiel porte la durée **dans son en-tête**, précisément parce qu'un exercice de
**9 mois** (création en cours d'année, changement de date de clôture) ne se compare pas à un
exercice de 12. Sur le CR de FE-032, toutes les variations seraient fausses de **25 %** — sans
qu'une seule ligne ne paraisse anormale.

## Ce qui existe déjà, et qui ne suffit pas

`ExerciceView` (STORY-066) porte `{ debut, fin }`. Mais **Q6 a donné le dernier mot sur les
exercices au dossier**, et le `dry-run` ne reçoit pas de `dossierId` d'exercice : les dates
existent quelque part, elles n'arrivent jamais jusqu'au calcul. C'est le même défaut de
chaînage que STORY-381 (`bilan-service` ne connaît aucun `balanceId`) — **une liasse ne peut
pas dire d'où elle sort.**

---

## Critères d'acceptation

- [x] AC-1 — `BilanDryRunRequestDto` accepte `exerciceN: { debut, fin }` et
      `exerciceN1?: { debut, fin }` (ISO-8601, dates de **clôture** comprises).
- [x] AC-2 — `400 EXERCICES_NON_ORDONNES` si `exerciceN1.fin >= exerciceN.debut`. Le motif
      **nomme les deux périodes**, pas un code seul.
- [x] AC-3 — `BilanDto` et `CompteResultatDto` publient `exerciceN` / `exerciceN1` **et**
      `dureeMoisN` / `dureeMoisN1` (dérivées), pour que l'écran étiquette ses colonnes avec ce
      que le serveur a réellement calculé, et non avec ce que l'écran croit avoir envoyé.
- [x] AC-4 — `dureeMoisN ≠ dureeMoisN1` ⇒ drapeau `comparabiliteReduite: true` dans la réponse.
      **Non bloquant** : un exercice court est licite, il doit juste être *dit*.
- [x] AC-5 — Les champs sont **optionnels** ⇒ aucun appel existant ne casse ; leur absence rend
      `null` et `comparabiliteReduite: false`.
- [x] AC-6 — Test : mêmes soldes, `exerciceN1` de 9 mois ⇒ `comparabiliteReduite: true` et les
      montants **inchangés** (le drapeau informe, il ne proratise rien).

## Vigilance

- ⛔ **Ne rien proratiser.** Ramener un exercice de 9 mois à 12 est une décision de gestion, pas
  une règle comptable : la liasse déposée ne le fait pas, l'état ne doit pas le faire non plus.
- ⚠️ Ce contrôle est une **garde**, pas un appariement : le serveur ne devine toujours pas quel
  exercice est le N-1 d'un autre. C'est FE-032/FE-031 qui **désignent** — et la maquette l'écrit
  (« le comparatif se désigne, il ne se devine pas », règle posée par FE-031).
- ⚠️ `soldesN` est plafonné à **5 000 lignes** (`ArrayMaxSize`) : un cabinet à auxiliaires par
  point de vente le dépasse. Hors périmètre ici, mais à ficher si le cas se présente.

## Conséquences ailleurs

- **FE-031** et **FE-032** étiquettent tous deux leurs colonnes « Exercice 2025 / 2024 · N mois » :
  aujourd'hui c'est l'écran qui l'affirme, demain c'est le serveur qui le confirme.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker réelle
rejouée sur l'état final**, PR `bilan-service` **#60** rebase-mergée sur `dev`.

### Ce qui est livré

- **AC-1** — `exerciceN` / `exerciceN1` optionnels sur `BilanDryRunRequestDto`, bornes
  **`AAAA-MM-JJ`**, date de clôture **incluse**. ⚠️ **Plus étroit qu'« ISO-8601 » à dessein** :
  `@IsDateString()` accepte les formes **semaine** (`2024-W01-1`) et **ordinale** (`2024-060`)
  que V8 ne parse pas — la comparaison d'ordre sur `NaN` vaut `false`, donc la garde les
  laisserait filer jusqu'au calcul de durée.
- **AC-2** — `400 EXERCICES_NON_ORDONNES`, motif **nommant les deux périodes**. Le code couvre
  **trois** situations, toutes « l'ordre du temps n'est pas respecté » : N-1 qui déborde sur N,
  et chacune des deux périodes qui se termine avant de commencer. Ces deux dernières ne sont pas
  du confort : sans elles `dureeEnMois` publierait une durée **négative** comme un fait.
- **AC-3** — `BilanDto` et `CompteResultatDto` **héritent** de `ComparabiliteExercicesDto` : une
  seule déclaration pour les deux états, et le contrôleur **étale** le résumé — TypeScript exige
  alors sa présence, le bloc **ne peut pas être oublié** (mutation M6 : retirer le spread ⇒
  `TS2739`).
- **AC-4 / AC-6** — `comparabiliteReduite` **informe**, ne proratise rien. Mesuré en docker :
  mêmes soldes avec un N-1 de 9 mois ⇒ drapeau levé, `actif`/`passif`/`sousTotaux`/`controle`/
  `coherenceSousTotaux` **identiques au franc**.
- **AC-5** — absents ⇒ `null` / `false`. `null` est **accepté comme l'absence** : `@IsOptional()`
  le laisse traverser (précédent STORY-409), donc la signature l'annonce et les lectures sont des
  tests de **vérité**, jamais des `!== undefined`.

⛔ **Garde sur les CINQ routes, publication sur les DEUX** qui ont des colonnes à étiqueter. Le
corps est partagé : accepter des bornes sur le TFT pour les **jeter en silence** serait le défaut
même que la story supprime.

### `dureeEnMois` — mois RÉVOLUS, et c'est un choix

Décompte sur `[debut, fin+1j)`. **Exact** pour tout exercice qui commence un 1ᵉʳ et s'achève un
dernier jour de mois — donc **toute liasse déposée** —, et **tronqué** pour une période partielle
(15 janvier → 31 décembre rend **11**, pas 12). Compter les mois *touchés* rendrait 12 et ferait
passer onze mois et demi pour un exercice plein : l'affirmation muette que cette story existe pour
supprimer. ⚠️ Aucun arrondi sur une durée **moyenne** de mois (`jours / 30,44`) : la durée publiée
dépendrait de la position de l'exercice dans l'année. `dossier-service` a tranché dans le même sens
en publiant, lui, des **jours**.

### ⚡⚡ Deux pièges refermés PENDANT le dev, avant tout commit

- **`exerciceN: []` traversait la validation sans une seule erreur** — `@IsOptional()` +
  `@ValidateNested()` **sans `each`** laissent passer un tableau (piège STORY-373). Et `[]` est
  **truthy** : la garde de chronologie ne levait rien, puis `dureeEnMois` lisait
  `undefined.slice(…)` ⇒ **500 au lieu de 400**. Refermé par `@IsObject()`, avec une batterie de
  non-régression dans `objets-imbriques-requis.spec.ts` (7 formes refusées, 3 acceptées).
- **Une garde de FORME ne dit rien du CALENDRIER** — `2026-02-30` franchit n'importe quelle
  expression régulière et `new Date()` l'**absorbe** en `2026-03-02` sans erreur (piège
  STORY-395). Refermé par un aller-retour UTC, qui ferme du même coup `2025-13-01`, `2025-01-00`
  et `0099-01-01` (année à deux chiffres réinterprétée en 1999 par `Date.UTC`).

### Portes DoD

Lint **0 warning** · build OK · **1 358 unitaires + 372 e2e** verts · couverture
**98,67 / 93,61 / 98,63 / 98,64** (seuils 65/90/90/90), `periode-exercice.ts` à
**100 / 100 / 100 / 100**. **7 mutations, 7 rouges par assertion**, aucune par erreur de
compilation.

| Mutation | Ce qu'elle retire | Rouge |
|---|---|---|
| M1 | l'aller-retour calendaire de `estDateCalendaire` | `2026-02-30`, `2023-02-29`, `2100-02-29`, `2025-04-31` |
| M2 | `>=` → `>` sur le recouvrement N-1/N | « N-1 s'achevant le jour même du début de N » |
| M3 | la troncature des mois non révolus | 3 périodes partielles |
| M4 | `comparabiliteReduite` toujours `false` | AC-4 |
| M5 | la garde de chronologie sur la route TFT | `produireTft → 400` |
| M6 | la publication de l'identité sur le CR | AC-3 côté compte de résultat |
| M7 | proratiser les montants **sur place** | AC-6 — **et c'est cette mutation qui a démasqué la tautologie** (cf. revue) |

### Vérification docker — stack réelle, rejouée après les correctifs de revue

⚠️ Cette story **n'écrit rien** (les cinq `dry-run` sont `@LectureSeule`) : la vérification porte
donc sur ce que les e2e **ne peuvent pas** prouver — le `ValidationPipe` de **production**
(`enableImplicitConversion: true`, **absent** du pipe des e2e) et le schéma **réellement servi**
par Swagger.

| Mesure | Résultat |
|---|---|
| AC-3 | `{2025-01-01→12-31, 2024-01-01→12-31}` ⇒ `12 / 12`, drapeau `false` |
| AC-4 | N-1 du `2024-04-01` ⇒ `9`, `comparabiliteReduite: true` |
| AC-6 | `actif`, `passif`, `sousTotaux`, `controle`, `coherenceSousTotaux` **identiques au franc** |
| AC-2 | `400 EXERCICES_NON_ORDONNES`, motif portant les **deux** périodes |
| ⚡ `exerciceN: []` | **`400 « must be an object »`**, jamais 500 |
| ⚡ `2026-02-30` · forme ISO semaine | `400` de validation, **sans** code métier |
| ⚡ borne **numérique** `20250101` | `400` — l'`enableImplicitConversion` de prod la stringifie, la regex la refuse |
| 3 autres routes | refus actif, **aucun champ 430 publié** |
| écriture | **aucune** — comptes de documents identiques avant/après |
| contrat servi | les 5 champs **requis** sur `BilanDto` et `CompteResultatDto`, `PeriodeExerciceDto: {debut, fin}`, et les **cinq** routes annoncent les **deux** formes de `400` |

### Revue de code — 5 constats, tous traités (commit dédié)

⚡⚡ **L'assertion unitaire AC-6 « les montants ne bougent pas » était une TAUTOLOGIE.**
`mockResolvedValue({ bilan: bilanProduit() })` n'évalue la fixture qu'**une fois** : les deux
appels résolvaient le **même objet**, `sansDate.actif` et `courtN1.actif` étaient la **même
référence**, et `toEqual` valait `expect(x).toEqual(x)`. **Mesuré** : en proratisant les montants
**sur place** — l'interdit ⛔ de la story —, l'assertion restait **VERTE**. AC-6 n'était gardé que
par l'e2e, avec l'apparence trompeuse d'un double filet. Passé en `mockImplementation` : la même
mutation le rend désormais **ROUGE** (M7).

⚡ **La description du `400` affirmait une forme que la route dément** : « corps
`{ message, code }` », alors que le **même statut** est aussi rendu par le `ValidationPipe` sous
`{ message: string[] }` **sans `code`** — ce que l'e2e de la story constate lui-même sur
`2026-02-30`. Un client faisant `switch (body.code)` sur tout 400 serait tombé sur `undefined`.
Les deux formes sont désormais annoncées, avec le critère qui les distingue.

⚡ **JSDoc détaché — 4ᵉ récidive du piège maison** : le bloc « la branche NON nulle, que rien
d'autre ne traverse » séparé de ses deux `it` par trois déclarations, donc rattaché à l'inventaire
de dette. Recollé.

Lentille over-engineering : `FORME_DATE_CALENDAIRE` exporté sans consommateur hors du fichier, et
`OPAQUES_CR` paramétrée par un `nom` pour **un seul** appelant. Retirés.

### Revue de sécurité — **aucune vulnérabilité**

L'axe sensible — les bornes de l'appelant **réinjectées** dans le message d'erreur *et*
**republiées** dans le `200` — a été **mesuré**, pas raisonné : `<img src=x onerror=alert(1)>`,
CRLF, `{$ne: null}`, chaîne de 200 000 caractères, `__proto__` / `constructor.prototype` — **tous
refusés en `400` sans écho de la valeur**. Les six `APP_GUARD` s'exécutent **avant les pipes** ⇒
un dossier d'un autre tenant rend `404` **avant** que le corps ne soit lu : le nouveau `400` est
**inatteignable cross-tenant**. `0000-01-01` et `0099-01-01` refusés ; `0100-01-01 → 9999-12-31`
rend `118800`, exact.

### ⚠️ Deux dettes NOMMÉES, hors périmètre

1. **`CompteResultatDto` publie encore 4 propriétés en `object` opaque** (`referentiel`, `stamp`,
   `coherenceResultat`, `coherenceSig`) — typées par des **interfaces**, même famille que
   STORY-376/398. Le test de contrat les nomme **une par une** (patron STORY-427) : tout écart
   *neuf* rougit, y compris sur les champs de cette story.
2. **`{"toString": 1}` sur un champ typé `string` ⇒ `500` au lieu de `400`** : `class-transformer`
   lève **dans** l'`enableImplicitConversion` de production. **Pré-existant et non ouvert par cette
   PR** — identique sur `soldesN[].compte`, requis sur les **cinq mêmes** routes. Mérite sa story.

### Conséquence pour STORY-433

Le cadrage de STORY-433 (colonne N-1 du TFT) demandait d'instruire **avec** STORY-430 : « sans
elle, un `soldesN2` non identifié aggrave le problème ». C'est fait — un troisième jeu de soldes
pourra désormais être **daté et ordonné** par la même garde.
