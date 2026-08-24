# STORY-375 : les codes de refus deviennent un contrat, pas de la prose — un code ajouté doit casser la compilation du client

Status: done

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


---

## Progress Tracking

### ① Ce que le dispositif comporte — trois pièces, dont deux qui ne voient pas la même chose

| Pièce | Rôle | Ce qu'elle ne voit pas |
|---|---|---|
| **L'inventaire** `CODES_REFUS_<MODULE>` (`as const`) | source unique, reprise **par composition** depuis `CODES_REFUS_TRANSVERSES` | rien par elle-même — un `as const` ne garde aucune exhaustivité (leçon **FE-070**) |
| **La garde de TYPE** — `fabriqueRefus<CodeRefusX>()` | `refus.conflit('CODE_INVENTE', …)` **ne compile pas** | un code que personne ne lève plus (code mort dans l'inventaire) |
| **La garde d'EXHAUSTIVITÉ** — un test qui confronte **deux inventaires** | l'égalité des ensembles, dans les deux sens | un code passé en **paramètre**… *(cf. ② — c'est le fait le plus utile de cette story)* |

Le corps de refus devient **déclaré** : `RefusResponseDto` (abstraite) + un `Refus<Module>Dto` par module
qui redéclare **`code`** avec `@ApiProperty({ enum, enumName })`. C'est ce `code` qui traverse
`openapi-typescript` et atterrit en union de littéraux.

### ② ⚡⚡ La garde de type a trouvé deux codes que l'inventaire avait manqués

`DOSSIER_CABINET_NON_AFFECTABLE` et `DOSSIER_CABINET_NON_ARCHIVABLE` **ne sont écrits nulle part** sous
la forme `code: '…'` : ils sont passés en **paramètre** à `refuserSiCabinet(dossier, code, message)`. Un
balayage textuel — celui que l'AC-2 décrit, et celui que j'avais écrit — ne peut pas les voir. C'est
`tsc` qui a refusé de compiler.

⇒ **Deux conséquences, appliquées** :
1. le paramètre est typé **`CodeRefusDossier`**, pas `string` — c'était le seul refus du module dont le
   code arrive par argument, donc le seul endroit où la garde de type n'aurait rien gardé ;
2. le balayage de la garde d'exhaustivité couvre désormais **trois** formes d'écriture : la fabrique,
   le `new XxxException({code})` hérité, et le code passé à une garde `refuser*`.

⇒ **Et une leçon** : *un inventaire par balayage et un inventaire par typage ne voient pas les mêmes
choses.* La story demandait de prouver les deux (AC-3) ; c'est en les prouvant qu'on a vu pourquoi.

### ③ Une correction de l'AC-2 : l'égalité stricte par module était **fausse**

Le premier jet du test a rougi sur `exercices` : il publiait `DOSSIER_ARCHIVE`, `DOSSIER_INTROUVABLE`,
`ORGANISATION_REQUISE` et `PORTEUR_NON_IDENTIFIABLE` sans les lever. **Le test avait raison et l'AC était
imprécis** : ces codes **sortent** bel et bien d'une route d'exercices, mais ils sont levés par ses
**collaborateurs** (`DossiersService.refuserSiArchive`, `portee.util`). Les exiger dans le module aurait
rendu le test faux ; ne pas les publier aurait laissé le client sans message pour un refus réel.

⇒ La garde est donc **trois** assertions, pas une :

| Assertion | Ce qu'elle attrape |
|---|---|
| égalité des codes **propres** (transverses exclus) | inventaire en retard **et** code mort — les deux sens |
| tout code **levé** dans le module est **publié** par son inventaire | le défaut exact de FE-066 : un code qui sort sans être déclaré |
| chaque **transverse** est levé quelque part dans le service | un transverse mort, que les 4 inventaires publieraient en chœur |

### ④ Mutation-test — **5 mutations, dans les deux sens** (AC-3)

| Mutation | Attendu | Mesuré |
|---|---|---|
| Retirer `EXERCICE_MIGRATION_NON_REOUVRABLE` de l'inventaire | test rouge **et** build rouge | ✅ **2 tests rouges** + `tsc` : `Found 1 error` |
| Ajouter `CODE_FANTOME` que personne ne lève | test rouge | ✅ **1 rouge** |
| `throw refus.conflit('CODE_INVENTE_A_LA_VOLEE', …)` | **ne compile pas** | ✅ `TS2345` |
| `error` omis par la fabrique | test rouge | ✅ **5 rouges** |
| `details: {}` posé même vide | test rouge | ✅ **5 rouges** |

⚠️ **Piège rencontré et à retenir** : `npm run build \| grep -c "error TS"` a rendu **0** sur une
mutation qui échouait bel et bien — les séquences ANSI de `nest build` coupent le motif. C'est un
comptage faussé qui aurait fait conclure « la garde de type ne mord pas ». Lire `Found N error(s)`.

### ⑤ Portes de qualité

| | `dossier-service` |
|---|---|
| Lint (`--max-warnings 0`) | ✅ 0 |
| Build | ✅ |
| Unitaires | ✅ **985** / 76 suites |
| e2e | ✅ **214** / 6 suites |
| Couverture | **99,24 / 93,22 / 96,47 / 99,26** · `refus.ts` et les 4 `*.codes.ts` à **100 %** |

⚡ **AC-4, la preuve la plus forte, et elle est gratuite** : **34 sites de `throw` réécrits, et pas un
seul test existant modifié.** Les 985 unitaires et 214 e2e — qui assertent `code`, `details`, statuts et
messages — passent tels quels.

### ⑥ Vérification docker — l'`enum` traverse, et **rien** ne change à l'exécution

**AC-1 — les inventaires sont des schémas OpenAPI nommés**, lus sur `/api/docs-json` du service vivant :

| Schéma | Littéraux |
|---|---|
| `CodeRefusExercice` | **12** — dont `EXERCICE_MIGRATION_NON_REOUVRABLE` **en littéral d'enum**, plus en fragment de commentaire |
| `CodeRefusDossier` | **13** — dont les 2 trouvés par la garde de type |
| `CodeRefusAxes` | **11** |
| `CodeRefusJournal` | **6** |
| Réponses `4xx` typées `Refus*` | **28** — aucune réponse 4xx sans schéma, hors `403` |

**AC-4 — diff des réponses `dev` → `MNV-375`, sur le service réel** : les **10** refus provoqués (les 8
d'`exercices` + `DOSSIER_INTROUVABLE` + un `400` de validation), capturés **deux fois** sur la **même
base** en basculant la branche sous le volume `src/` (`Found 0 errors` à chaque recompilation),
`requestId` normalisé :

```
diff avant375.txt apres375.txt  →  ZÉRO différence
```

Statuts, `error` *(y compris la casse `Conflict` / `Bad Request`)*, `message`, `code`, `details` :
identiques. Y compris `EXERCICE_DEJA_OUVERT`, le seul refus qui porte un `details`.

Stack arrêtée (`docker compose stop`).

### Écarts de périmètre relevés — et ce qui en a été fait

| Constat | Décision |
|---|---|
| La story annonce **4 modules**, mais **6** émettent des codes : `portefeuille` (`PORTEUR_NON_IDENTIFIABLE`) et `acces` (`ORGANISATION_REQUISE`) en émettent aussi | **Périmètre tenu à la lettre** — les deux ne lèvent que des codes **transverses**, désormais déclarés une fois et publiés par les 4 inventaires. Aucun code propre à eux n'est laissé hors contrat |
| `ACOMPTE_IS` apparaît dans un `grep "code: '"` de `portefeuille` | **Faux positif** : c'est un code d'**échéance fiscale** (une donnée), pas un refus. La garde d'exhaustivité ne balaye que les `code:` **dans un throw** ou passés à une garde `refuser*` |
| La DoD demande de rejouer `npm run gen:api -- dossier` **depuis le dépôt frontend** | ⛔ **Non exécutable ici** : le seul dépôt frontend présent est `frontend-admin-panel`, qui n'a ni `dossier.ts` ni cible `dossier` — FE-066 vit dans un dépôt non cloné. L'équivalent **serveur** est prouvé à la place (⑥ ci-dessus) : l'`enum` est un schéma nommé de littéraux, ce que `openapi-typescript` transforme mécaniquement en union. La note reste à porter au frontend |


### ⑦ Revue de code — 2 constats, dont un sur **mon propre test**

Scan délégué **impossible** (`529 Overloaded` sur deux tentatives) : la revue a été faite **dans la
session**, en `opus` — le mode par défaut du projet. Vérifications **outillées**, pas à l'œil :
extraction mécanique des triplets *(statut, code, message)* de `dev` **et** de la branche, puis
comparaison.

| # | Constat | Traitement |
|---|---|---|
| **R1 — BLOQUANT** | ⚡ **La prémisse « le `403` reste nu » est vraie d'un guard sur deux.** `RolesGuard`/`PermissionsGuard` lèvent bien un `ForbiddenException` nu, mais `EmailVerifiedGuard` et `DossierAccessGuard` en lèvent un **codifié** — les **15** réponses `403` du service nomment `EMAIL_NOT_VERIFIED` et `KYC_NOT_APPROVED`, **en prose**. C'est le trou exact que la story ferme ailleurs, et l'écran doit distinguer « vérifiez votre e-mail » de « KYC en attente » | **Corrigé** — `CODES_REFUS_GARDE` + `RefusGardeDto`, `code` **optionnel** (un `403` de rôle n'en porte aucun : le publier obligatoire serait un mensonge de contrat dans l'autre sens). Les deux guards passent par la fabrique typée ; `DossierAccessGuard` reçoit son code en **paramètre** — comme `refuserSiCabinet`, l'endroit même où un `string` n'aurait rien gardé |
| **R2 — non-bloquant, valeur probante** | ⚡ **La garde d'exhaustivité pouvait devenir vacante sans rougir** : elle lit `__dirname`. Depuis `dist`, ou ce spec déplacé, `fichiersTs` ne rend plus aucun `.ts` ⇒ « aucun code levé n'échappe » passe **trivialement** sur un ensemble vide | **Corrigé** — le balayage doit avoir trouvé ≥ 1 code par module. Mutations : racine inexistante ⇒ **17 rouges**, filtre `.ts` cassé ⇒ **9 rouges** |

**Vérifié sans constat** : les 34 refus conservent leur *(statut, code)* **et** leur message
(comparaison mécanique `dev` ↔ branche, **0 écart**) · aucune `@ApiResponse` `4xx` sans `type` · aucun
`*.codes.ts` ne matche ses propres motifs de balayage · les appels multi-lignes sont bien captés.

### ⑧ Revue de sécurité — **0 vulnérabilité**, et un **troisième code dans le même trou**

| Piste | Pourquoi elle ne tient pas |
|---|---|
| Anti-énumération changée par le refactoring | Correspondance **1:1** vérifiée : 18 `conflit`, 10 `requeteInvalide`, 4 `introuvable`, 4 `interdit` — aucun `404` devenu `403` ni l'inverse. `DOSSIER_INTROUVABLE` confond toujours « hors portée » et « inexistant » |
| `details` recopié tel quel | Aucun appelant ne le construit depuis une entrée utilisateur ; les deux cas porteurs d'identifiants (`DOSSIER_NIF_DEJA_UTILISE`, `EXERCICE_DEJA_OUVERT`) restent **dans la portée déjà visible** de l'appelant, et un `details` vide n'est jamais émis |
| Chaîne de guards réécrite | Même endroit, même ordre, même statut, même corps. Les objets levés restent de **vraies** instances (`new ForbiddenException`) : tout `instanceof` amont matche encore |
| ⚡ Interaction avec les `catch` de transaction | `estConflitDEcriture()`/`estDuplicata()` lisent `erreur.code` au **premier niveau** ; le code applicatif vit dans `getResponse().code` — un refus métier levé dans un `try` ne peut donc pas être **reclassé** en conflit d'écriture. Identique à `dev` |
| Inventaires publiés dans un Swagger non authentifié | Antérieur à la PR, et sans objet : ces mêmes codes figuraient **déjà en prose** dans les `description` des mêmes réponses, sur la même page. Un code de refus nomme un motif que l'appelant obtient en déclenchant le refus — jamais l'existence d'une ressource hors portée |

⚡ **Le constat qu'elle a rapporté, hors sécurité mais dans le mille** :
`PORTEUR_NON_IDENTIFIABLE` appartient **aux deux familles** — transverse (400/404/409 des modules)
**et** de garde (**403** du portefeuille). Publié par les inventaires de module, **absent du DTO du
403** : un `GET /dossiers` pouvait rendre un code que le client ne couvrait pas. **Ajouté**, et le
dernier `throw` codifié qui contournait encore la fabrique (`portefeuille.service.ts`) y passe.

### ⑨ Vérification docker **rejouée sur l'état final**

| Rejeu | Résultat |
|---|---|
| Diff des 10 refus, avant/après les 2 commits de revue | **ZÉRO différence** — les correctifs n'ont rien changé aux corps |
| Schémas d'enum publiés | **5** : `CodeRefusExercice` (12), `CodeRefusDossier` (13), `CodeRefusAxes` (11), `CodeRefusJournal` (6), **`CodeRefusGarde` (3)** |
| Réponses `4xx` typées `Refus*` | **43** *(28 avant la revue — les 15 `403` s'y ajoutent)*, **0** sans schéma |
| `403` réel, e-mail dé-vérifié en base | `{"statusCode":403,"error":"Forbidden","message":"Adresse e-mail non vérifiée…","code":"EMAIL_NOT_VERIFIED"}` — le code sort bien, et il est désormais **déclaré** |

Stack arrêtée (`docker compose stop`).

### Portes après revue

| | `dossier-service` |
|---|---|
| Lint / build | ✅ 0 / ✅ |
| Unitaires | ✅ **996** / 77 suites |
| e2e | ✅ **214** / 6 suites |
| Couverture | **99,25 / 93,22 / 96,47 / 99,27** |
| Mutations | **7** au total, toutes rouges comme attendu |


### ⑩ Clôture

- **2026-08-24** — ✅ **CLÔTURÉE**. PR `prospera-dossier-service#13` rebase-mergée sur `dev`, 3 commits
  (`58ec125` feature, `4bddd7e` revue de code, `1ee0714` revue de sécurité). Branche supprimée. Statut
  aligné aux 3 endroits, `completed_date` posée.
- ⚡ **Ce que cette story change vraiment** : un code de refus ajouté au serveur **casse la compilation
  du client** au lieu de tomber en silence dans le message générique. Et l'inventaire ne peut plus
  dériver : il est gardé des **deux** côtés — par le type à l'écriture, par le balayage à l'exécution
  des tests.
- **Le patron est posé, pas généralisé** : `balance-service` et ses 78 chemins restent hors périmètre
  (décision de la story). Chaque service le reprend quand il touche déjà son contrat — le kit tient en
  trois fichiers : `common/erreurs/refus.ts`, un `<mod>.codes.ts`, un `Refus<Mod>Dto`.
- ⚡ **La leçon la plus réutilisable, et elle a été payée deux fois ici** : *un inventaire par
  **balayage** et un inventaire par **typage** ne voient pas les mêmes choses.* Le typage a trouvé deux
  codes passés en **paramètre** (invisibles à tout `grep`) ; le balayage a trouvé un inventaire qui
  publiait ce que personne ne lève. La story demandait de prouver les deux mécanismes par mutation —
  c'est **en les prouvant** qu'on a vu pourquoi il en faut deux.
- **Dette ouverte, transmise :**
  - ⚠️ **`npm run gen:api -- dossier` n'a pas pu être rejoué** : le dépôt frontend de FE-066 n'est pas
    cloné ici (seul `frontend-admin-panel` l'est, sans cible `dossier`). L'équivalent serveur est
    prouvé — les cinq `enum` sont des **schémas nommés de littéraux**, ce que `openapi-typescript`
    transforme mécaniquement en union — mais la **note à FE-066** reste à porter : sa
    `MESSAGES_REFUS` passe en `Record<CodeRefusExercice, string>` en une ligne, et **c'est cette
    ligne qui livre la valeur de la story**.
  - ⚠️ **`details` n'est toujours pas typé par code** (hors périmètre assumé) : sa forme dépend du
    code, et le typer demanderait une union discriminée dans l'OpenAPI.
  - ⚠️ **Les 3 `ForbiddenException` nus subsistent** (`roles.guard`, `permissions.guard`) : c'est
    voulu — leur inventer un code fabriquerait des synonymes d'une même chose. `RefusGardeDto` publie
    donc `code` en **optionnel**, ce qui décrit fidèlement les deux moitiés de la chaîne de guards.
