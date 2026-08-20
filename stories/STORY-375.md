# STORY-375 : les codes de refus deviennent un contrat, pas de la prose — un code ajouté doit casser la compilation du client

Status: ready-for-dev

**Epic :** EPIC-043 — Le dossier client devient l'unité de travail du cabinet
**Points :** 3 · **Complexité :** low · **Sprint :** 20 (backend) · **Service :** `dossier-service`
(`:3009`) — patron réutilisable par les autres
**Origine :** écart relevé à la livraison de **FE-066** (2026-08-20) — la fiche de story nommait
**6** refus, le service en émet **8**, et rien ne pouvait le dire
**Réf. :** leçon **FE-070** *(« la régénération de types n'est jamais le livrable, la garde
d'exhaustivité l'est »)* · leçon **FE-060** *(un code mal nommé retombe en silence)*

---

## Le constat

FE-066 a écrit sa table de messages d'après la fiche de story : **6 codes**. Le service en émet
**8**. Les deux manquants sont exactement ceux qui coûtent :

| Code oublié | Ce qu'un écran écrit d'après la fiche aurait fait |
| --- | --- |
| `EXERCICE_MIGRATION_NON_REOUVRABLE` | Offrir « Rouvrir » sur un exercice repris — **pour le refuser après le clic** |
| `EXERCICE_BORNES_DEJA_UTILISEES` | Dire « clôturez l'exercice ouvert » alors que le geste est l'**opposé** : corriger les dates |

⚡ **Et le service faisait bien son travail.** La description `@ApiResponse` du `409` de `rouvrir`
**liste** `EXERCICE_MIGRATION_NON_REOUVRABLE`, noir sur blanc. Le défaut n'est pas une omission de
documentation : c'est que **cette documentation est de la prose**.

```ts
@ApiResponse({ status: 409, description:
  'EXERCICE_MIGRATION_NON_REOUVRABLE (Q7) — un exercice repris reste en consultation seule. ' +
  'EXERCICE_NON_CLOS — il est déjà ouvert. EXERCICE_DEJA_OUVERT (Q8) — …' })
```

`openapi-typescript` en fait une chaîne de commentaire. Le client ne peut donc écrire que :

```ts
const MESSAGES_REFUS: Record<string, string> = { … }   // ⇐ `string`, pas une union
```

**Un `Record<string, …>` accepte tout et n'exige rien.** Ajouter un code au serveur ne casse rien,
n'alerte personne, et le nouveau refus tombe **silencieusement** dans le message générique — là où il
sera lu comme une panne, pas comme une règle.

> C'est la forme aggravée de FE-060. Là-bas, un code **mal orthographié** (`NIF_DEJA_UTILISE` contre
> `DOSSIER_NIF_DEJA_UTILISE`) retombait en silence. Ici, c'est le **nombre** de codes qui dérive, et
> aucun des deux dépôts ne peut le voir.

---

## User Story

En tant que **développeuse du frontend**,
je veux **que les codes de refus d'une route soient un type, pas un paragraphe**,
afin qu'**un code ajouté côté serveur casse ma compilation au lieu de produire un écran muet**.

---

## Ce que la story livre

- **Un `enum` de codes par module**, exposé dans le schéma OpenAPI — donc **traversant
  `openapi-typescript`** et atterrissant en union de littéraux côté client.
- **Le corps d'erreur devient typé** : un `RefusResponseDto` dont `code` est cet `enum`, référencé
  par les `@ApiResponse` **à la place de** l'énumération en prose. La prose reste — en `description`,
  pour dire *pourquoi* — mais elle cesse d'être la seule source.
- **Une garde côté serveur** : le code passé à un `ConflictException`/`BadRequestException` d'un
  module appartient à l'`enum` de ce module. Un code inventé à la volée ne compile pas.
- **`dossier-service` d'abord**, ses 4 modules (`dossiers`, `exercices`, `axes`, `journal`) — c'est
  lui qui a servi les 3 dernières stories frontend, et son contrat est le plus lu.

## Hors périmètre

- **Les autres services.** `balance-service` en a 78 chemins : les convertir ici ferait une story de
  15 points dont l'essentiel serait mécanique. Cette story pose le **patron** et le prouve sur un
  service ; chaque service le reprend quand il touche déjà son contrat.
- **Traduire les messages.** Le message du serveur parle au client HTTP, l'écran parle à une
  comptable — ce départage reste au frontend, et cette story ne le déplace pas.
- **Le champ `details`.** Sa forme dépend du code (`EXERCICE_DEJA_OUVERT` porte l'exercice bloquant,
  les autres rien). Le typer par code demanderait une union discriminée dans l'OpenAPI : réel, mais
  c'est un autre sujet, et le rétrécissement runtime côté client fait déjà le travail.

---

## Acceptance Criteria

- [ ] **AC-1** — `npm run gen:api -- dossier` produit une **union de littéraux** pour le champ `code`
      des réponses `4xx` des 4 modules. *(Contrôle : le type généré contient
      `"EXERCICE_MIGRATION_NON_REOUVRABLE"` comme littéral, pas comme fragment de commentaire.)*
- [ ] **AC-2** — L'`enum` publié est **exhaustif** : chaque code atteignable par un `throw` du module
      y figure. *(Test : un balayage des `code:` littéraux du module confronté à l'`enum` — deux
      inventaires, et c'est leur ÉGALITÉ qui est assertée.)*
- [ ] **AC-3** — ⚡ **La garde se prouve par MUTATION, pas par lecture.** Retirer une entrée de
      l'`enum` doit rendre le test d'AC-2 **rouge** ; ajouter un `throw` avec un code absent doit
      **ne pas compiler**. Un test qui passerait dans les deux cas ne prouve rien — c'est
      exactement le piège documenté par FE-070 (`as const satisfies` ne voit pas ce qui manque).
- [ ] **AC-4** — Aucun **changement de réponse à l'exécution** : mêmes statuts, mêmes codes, mêmes
      messages, même `details`. *(Diff des réponses avant/après sur les 8 refus d'`exercices`.)*
- [ ] **AC-5** — La description en prose des `@ApiResponse` **subsiste** : elle porte le *pourquoi*
      (« Q7 — un exercice repris reste en consultation seule »), que l'`enum` ne dit pas.

---

## Notes techniques

⚡ **Le livrable n'est pas l'`enum`, c'est ce qu'il rend POSSIBLE côté client** — et c'est mesurable :

```ts
// AVANT — accepte tout, n'exige rien
const MESSAGES_REFUS: Record<string, string> = { … };

// APRÈS — un code ajouté au serveur casse `tsc` tant qu'il n'a pas de message
const MESSAGES_REFUS: Record<CodeRefusExercice, string> = { … };
```

⚠️ **Et seul le `Record<Union, …>` a cet effet** : `as const satisfies Record<string, string>` **ne
voit pas** ce qui manque. La leçon est datée et payée (FE-070) — la reproduire ici gaspillerait la
story.

⚠️ **`@ApiProperty({ enum })` sur un champ de DTO d'erreur suffit** : c'est le chemin déjà utilisé
par `ExerciceResponseDto.statut`/`origine`, qui sortent bien en unions de littéraux dans
`src/types/api/dossier.ts`. Aucune mécanique nouvelle à inventer — juste l'appliquer au corps de
refus, qui est aujourd'hui le seul DTO non déclaré.

⚠️ **`AllExceptionsFilter` construit déjà la réponse par liste blanche**
(`statusCode`/`error`/`message`/`code`/`details`). Le contrat existe donc **en fait** ; cette story
le rend **déclaré**. C'est ce qui rend l'AC-4 tenable : rien à changer dans le filtre.

⚠️ **Le `403` reste sans code**, et ce n'est pas à corriger ici : `RolesGuard` lève un
`ForbiddenException` nu, partagé par tous les modules. Lui inventer un code par module fabriquerait
huit synonymes d'une même chose. Le client le reconnaît par son **statut**, et cette story le note
explicitement pour que personne ne « complète » l'`enum` avec.

---

## Dépendances

**Prérequise :** aucune — le filtre et le patron `@ApiProperty({ enum })` existent déjà.
**Bénéficiaires immédiats :** **FE-066** *(sa `MESSAGES_REFUS` passe en `Record<Union, …>` en une
ligne)* · **FE-065**, **FE-061** *(mêmes tables, mêmes angles morts)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] Test d'exhaustivité (AC-2) **prouvé par mutation** (AC-3), les deux sens.
- [ ] Diff des réponses avant/après sur les 8 refus d'`exercices` : **identique** (AC-4).
- [ ] `npm run gen:api -- dossier` rejoué depuis le dépôt frontend : le type attendu est bien là.
- [ ] Note portée à **FE-066** pour que la table de messages passe en `Record<Union, …>`.

---

## Story Points Breakdown

- `enum` + `RefusResponseDto` + branchement des `@ApiResponse` des 4 modules : 1,5 pt
- Garde d'exhaustivité serveur + preuve par mutation dans les deux sens : 1 pt
- Vérification de non-régression des réponses (AC-4) + `gen:api` côté front : 0,5 pt
