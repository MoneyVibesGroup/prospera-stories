# STORY-398 : Le contrat de rattachement n'est pas publié — et l'un de ses champs est publié FAUX

Status: review

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/dto`, `modules/bilan/mapping-override/dto`
**Points :** 2 → **3** ⬆️ *(2026-08-25 : périmètre étendu aux DTO de liasse, voir §③)*
· **Sprint :** S20 · **Complexité :** medium
**Origine :** remontée le **2026-08-24** par **FE-030**, en câblant la table de passage —
c'est-à-dire en essayant de **consommer** `POST …/bilan/table-de-passage/dry-run`.
**Étendue le 2026-08-25 par FE-031**, qui a livré le consommateur que cette story attendait
pour traiter les DTO de liasse — son hors-périmètre d'origine les y renvoyait nommément.

---

## Le fait, relevé à la source

### ① Le champ publié FAUX — `RattachementResultDto.mappes`

```ts
// modules/bilan/dto/rattachement-result.dto.ts
@ApiProperty({
  description: 'Comptes rattachés à au moins un poste (plusieurs pour les classes 4/5).',
  example: [{ compte: '211000', rattachements: [ /* … */ ] }],
})
mappes!: RattachementCompte[];          // ← pas de `type:`
```

Faute de `type`, Swagger déduit la forme de l'`example` — un **tableau** — et publie
`array of string`. `openapi-typescript` rend donc côté client :

```ts
mappes: string[];   // ⛔ FAUX : le serveur envoie des OBJETS
```

⛔ **C'est un cran pire qu'un objet vide.** Les `Record<string, never>` du ticket voisin
sont *inexploitables*, mais ils sont **visibles** : toute tentative de lecture ne compile
pas. Ici le type est **faux et cohérent** : `mappes.map(c => c.trim())` passe `tsc`, passe
`lint`, passe `build`, et rend `[object Object]` à l'écran. **Rien ne devient rouge.**

C'est le champ central de la route : il porte le compte, l'état, le code du poste, son
libellé, la règle de solde, le préfixe retenu et — surtout — la `source`
(`referentiel` | `surcharge`), seul témoin qu'un arbitrage humain a pris effet.

### ② Les objets non typés — le patron déjà relevé pour `balance-service`

`@ApiProperty({ example })` ou `@ApiProperty({ type: Object })` sans schéma :

| Schéma | Propriété | Forme réelle |
|---|---|---|
| `ReferentielDiagnosticDto` | `referentiel` | `{ code, version }` |
| `ReferentielDiagnosticDto` | `stamp` | `{ code, version, checksum }` |
| `RattachementResultDto` | `referentiel` | `{ code, version }` |
| `SurchargeResponseDto` | `cible` | `{ etat, poste }` |
| `SurchargeResponseDto` | `ancienPoste` | `{ etat, poste }` \| `null` |
| `SurchargeResponseDto` | `validePar` / `valideAt` / `motif` | `string` \| `null` |
| `JeuEtatsResponseDto` · `LiasseDto` · `JeuEtatsSommaireDto` | 20+ autres | — |

### ③ ⬆️ ÉTENDU LE 2026-08-25 — `BilanDto` : **six propriétés sur huit**, dont **trois FAUSSES**

⚡ **Cette extension est celle que la story avait elle-même prévue.** Son hors-périmètre disait :
*« les 20+ objets non typés des DTO de liasse […] **reviendront avec FE-031→034** ; les traiter ici
ferait une story sans consommateur »*. **FE-031 est livrée le 2026-08-25** — le consommateur
existe, la condition est remplie.

⛔ **Et le cas est PIRE que celui de `mappes`.** Là où le rattachement avait *un* champ faux,
`BilanDto` en a **trois**, et ce sont **les tableaux qui SONT l'écran** :

| Propriété | Type publié | Forme réelle (relevée sur l'`example` et le moteur) |
|---|---|---|
| `actif` | **`string[]`** | `{ etat, poste, libelle, brutN, amortN, netN, netN1 }[]` |
| `passif` | **`string[]`** | `{ etat, poste, libelle, montantN, montantN1 }[]` |
| `sousTotaux` | **`string[]`** | `{ etat, poste, libelle, valeurN, valeurN1 }[]` |
| `controle` | `Record<string, never>` | `{ totalActifN, totalPassifN, resultatNetN, ecartN, equilibreN, …N1 }` |
| `coherenceSousTotaux` | `Record<string, never>` | `{ bz, dz, totalActifDirect, totalPassifResultatDirect, ecartEquilibre, equilibre, coherent }` ou `null` |
| `referentiel` / `stamp` | `Record<string, never>` | `{ code, version }` / `{ code, version, checksum }` |

⛔ **`controle` en `Record<string, never>` interdit d'écrire `controle.ecartN`** — c'est-à-dire de
lire **l'objet même de FE-031**. Le contrôle d'équilibre, la question que tout expert-comptable
pose en ouvrant une liasse, n'est **pas atteignable par le type généré**.

⚠️ **Deux nuances que le correctif doit préserver, sous peine d'en créer une pire :**

1. **Les comparatifs N-1 valent `null`, jamais `undefined`** — et `null` ≠ `0`. « Ce poste
   n'existait pas en N-1 » et « il valait zéro » mènent à des décisions différentes. Les schémas
   doivent déclarer `nullable: true`, pas rendre les champs optionnels.
2. **`coherenceSousTotaux` peut valoir `null`** en toute légitimité (« non applicable sans
   sous-total » — SFD-BCEAO n'en déclare aucun). Ce `null`-là est une **réponse**, pas une absence
   de donnée : le distinguer d'un échec de lecture est ce qui a obligé le front à envelopper ses
   lectures dans un `{ valeur }`.

⇒ Coût actuel côté front : **7 lecteurs supplémentaires** dans `api/lecture-contrat.ts`
(`lireActif`, `lirePassif`, `lireSousTotaux`, `lireControleEquilibre`, `lireCoherenceSousTotaux`,
`lireStamp`, + les primitives `lireNombreOuNul` / `lireBooleen`), **44 tests unitaires** qui ne
prouvent qu'une chose : que le front **refuse** ce que le serveur ne garantit pas.

---

## Ce que ça coûte, concrètement

`referentiel {code, version}` est **exactement ce que l'AC-1 de FE-030 demande
d'afficher** (« référentiel actif, code + version »). Le serveur l'envoie ; le contrat ne
le décrit pas. Les deux issues habituelles sont mauvaises : **caster**, c'est écrire côté
appelant un contrat que le serveur ne tient à rien ; **renoncer** (le choix de FE-024 puis
FE-057 côté Atelier), c'est ici ne pas livrer la story.

⇒ **Contournement en place (FE-030), et il n'est pas gratuit** : un module
`api/lecture-contrat.ts` **vérifie la forme à l'exécution**, champ par champ, et rend
`null` quand elle ne tient pas. L'écran affiche alors un état « **contrat inattendu** »,
*sans* bouton « Réessayer » — le serveur a répondu 200, c'est son contrat qui a bougé.
C'est honnête et testable, mais c'est **80 lignes de front qui décrivent un contrat
serveur**, avec le défaut structurel de tout doublon : le jour où le serveur ajoute un
champ, personne ne le sait.

---

## Périmètre

**Inclus**

- Donner un `type` à `mappes` — c'est-à-dire déclarer les classes de DTO qui manquent :
  `RattachementCompteDto { compte, rattachements: PosteRattacheDto[] }` et
  `PosteRattacheDto { etat, poste, libelle, type, regle, prefixe, source }`.
- `type` et/ou classe de schéma sur les objets du tableau ci-dessus, **à commencer par
  ceux que des écrans consomment déjà** : `referentiel`, `stamp`, `cible`, `ancienPoste`,
  `validePar`, `valideAt`, `motif`.
- `type` et `source` déclarés en **enum OpenAPI** (`'detail' | 'total'`,
  `'referentiel' | 'surcharge'`), sur le patron de STORY-375 : une valeur ajoutée doit
  **casser la compilation** du client, pas tomber en silence.
- ⚠️ L'`example` de `RattachementResultDto.mappes` **omet `source`** alors que
  `mapComptes` le pose systématiquement (`rattachementSurcharge` comme `rattacher`) :
  l'exemple est à corriger en même temps, sinon il continuera de désinformer.

**Inclus — volet liasse, ajouté le 2026-08-25 (consommateur : FE-031)**

- Déclarer les classes de DTO qui manquent à `BilanDto` : `PosteActifDto`, `PostePassifDto`,
  `SousTotalDto`, `ControleEquilibreDto`, `CoherenceSousTotauxDto` — et donner un `type` à
  `actif`, `passif`, `sousTotaux`, `controle`, `coherenceSousTotaux`, `referentiel`, `stamp`.
- **`nullable: true`** sur tous les comparatifs N-1 (`netN1`, `montantN1`, `valeurN1`,
  `totalActifN1`, `totalPassifN1`, `resultatNetN1`, `ecartN1`, `equilibreN1`) et sur
  `coherenceSousTotaux` lui-même. ⛔ **Ne pas les rendre `optional`** : `null` porte un fait
  (« pas de comparatif »), `undefined` n'en porte aucun.
- `etat` déclaré en **enum** (`BILAN_ACTIF` | `BILAN_PASSIF` | `BILAN`), même patron que `type` et
  `source` ci-dessus : une valeur ajoutée doit **casser la compilation** du client.

**Hors périmètre**

- Les DTO des **trois autres états** — compte de résultat, TFT, notes annexes — et
  `JeuEtatsResponseDto` / `LiasseDto`. Leurs consommateurs (**FE-032/033/034**) ne sont pas
  livrés ; les traiter ici rejouerait exactement l'orphelinat que ce hors-périmètre existe pour
  éviter. ⚠️ **Ils reviendront de la même façon** : à la livraison du premier écran qui les
  consomme.

---

## Critères d'acceptation

1. `GET /dossiers/{id}/bilan/table-de-passage/dry-run` publie `mappes` comme un tableau
   d'objets **complètement décrits** ; les types régénérés côté client le rendent en
   `RattachementCompteDto[]`, jamais en `string[]`.
2. `type` et `source` sont des **enums** dans l'OpenAPI.
3. `referentiel`, `stamp`, `cible`, `ancienPoste`, `validePar`, `valideAt` et `motif`
   sortent avec leurs propriétés, pas en `Record<string, never>`.
4. Un test de contrat compare le **document OpenAPI généré** à la forme réellement
   renvoyée par la route — pas deux descriptions parallèles.
5. Les `example` restants sont cohérents avec les schémas (`source` présent).
6. ⬆️ **(2026-08-25)** `POST /dossiers/{id}/bilan/etats/bilan/dry-run` publie `actif`, `passif` et
   `sousTotaux` comme des tableaux d'objets **complètement décrits** — jamais en `string[]` — et
   `controle`, `coherenceSousTotaux`, `referentiel`, `stamp` avec leurs propriétés.
7. ⬆️ **(2026-08-25)** Les comparatifs N-1 sortent **`nullable`**, pas optionnels ; un test de
   contrat vérifie qu'un dry-run **sans `soldesN1`** rend bien `null` (et non `0`, ni le champ
   absent) sur `netN1`, `montantN1`, `valeurN1` et les quatre champs `…N1` de `controle`.
8. ⬆️ **(2026-08-25)** Un dry-run sur un référentiel **sans cascade** (SFD-BCEAO) rend
   `sousTotaux: []` et `coherenceSousTotaux: null` — les deux déclarés comme tels au contrat, pour
   qu'aucun client ne les lise comme une erreur.

---

## Notes

- ⚠️ **Voisin mais distinct** de `TICKET-BACKEND-objets-imbriques-non-types-dans-l-openapi`
  (ouvert par FE-057 sur `balance-service`, 33 occurrences) et de **STORY-376** / 
  **STORY-389**, qui portent le même patron sur d'autres services. Ce qui est **propre à
  celle-ci**, et ce qui la rend plus urgente : les autres publient un objet **vide**, 
  celle-ci publie un type **faux**.
- ⚠️ Après livraison, le front doit **régénérer** (`npm run gen:api -- bilan`) *et*
  **retirer** `api/lecture-contrat.ts` : laisser les deux en place ferait vivre deux
  descriptions du même contrat. Consommateurs nommés : **FE-030** *(table de passage)* et
  ⬆️ **FE-031** *(Bilan actif/passif)*, pour ne pas rejouer l'orphelinat de STORY-144.
- ⬆️ **(2026-08-25)** ⚠️ **Le retrait de `lecture-contrat.ts` devient une opération à deux
  temps** : FE-032/033/034 en écriront d'autres pour les DTO restés hors périmètre. Ne retirer
  que les lecteurs dont le schéma est effectivement publié, et vérifier par **mutation** (casser
  un champ, exiger un rouge) plutôt qu'en se fiant à la régénération — `gen:api` régénère tous les
  services sans dire lequel a changé.
- ⬆️ **(2026-08-25)** ⚠️ **Le défaut a un coût qui se répète, et il se chiffre** : 2 stories
  frontend ont dû écrire, tester et documenter un contrat serveur (FE-030 : 208 lignes + 156 de
  tests ; FE-031 : ~300 lignes + 256 de tests). C'est le troisième service touché par le même
  patron `@ApiProperty` sans `type` (après `balance-service` et ceux de STORY-376 / 389) ⇒
  **candidat à une règle d'architecture**, pas à une n-ième story de rattrapage.

---

## Progress Tracking

**Statut : `review`** — implémentée, portes de qualité passées, 7 mutations rouges, vérification
docker faite sur le **service réel**. Branche `MNV-398` ouverte sur `bilan-service` **et** sur `docs`
(preuve : `git rev-parse --abbrev-ref HEAD` rend `MNV-398` dans les deux dépôts, 2026-08-27).
Aucun contrat d'événement Kafka touché ⇒ **un seul dépôt de code**.

### ⚠️ Une prémisse de la story est FAUSSE — l'AC-8 corrigé

L'AC-8 et le tableau du §③ annoncent que, sans cascade de sous-totaux, le serveur rend
`coherenceSousTotaux: null`. **Il ne l'a jamais rendu.** Sur SFD-BCEAO il rend l'**objet**, avec
`bz`/`dz`/`ecartEquilibre` à `null` et `equilibre`/`coherent` à `true` (« non applicable ») — c'est
ce que dit le type `CoherenceSousTotaux` (« Sans sous-totaux (SFD) : tout `null`,
`coherent`/`equilibre = true` ») et ce que l'e2e `bilan-etats` assertait déjà
(`body.coherenceSousTotaux.bz` → `null`, `.coherent` → `true`).

Publier `nullable: true` sur l'objet, comme le périmètre le demandait, aurait donc **annoncé au
client un `null` que le serveur n'émet jamais** — le « mensonge dans l'autre sens » : chaque
lecteur front aurait dû écrire une garde qui ne peut pas se déclencher, et il aurait cherché le
signal « pas de cascade » au mauvais endroit (le vrai signal est `bz === null`). L'AC-4 tranche le
conflit : le contrat publie **ce que la route renvoie**. `coherenceSousTotaux` est donc publié
**requis et non nullable**, ses trois grandeurs `nullable`.

⚡ Ce n'est pas une décision sur parole : la **mutation n°4** (publier l'objet `nullable`, comme
l'AC-8 le demandait) fait virer le test AC-8 au **rouge**.

### Livré

- **12 classes de DTO déclarées**, chacune `implements` son interface de domaine —
  `PosteRattacheDto`, `RattachementCompteDto` · `ReferentielRefDto`, `ReferentielStampDto` (fichier
  partagé neuf) · `PosteActifDto`, `PostePassifDto`, `SousTotalDto`, `ControleEquilibreDto`,
  `CoherenceSousTotauxDto` · `PosteCibleDto`. `implements` est le **lien** qui interdit les deux
  descriptions parallèles : l'interface bouge ⇒ le DTO ne compile plus.
- **`type` et `source` en enums NOMMÉES** (`TypePoste`, `SourceRattachement`), **dérivées des
  constantes du service** : `TYPES_POSTE` / `SOURCES_RATTACHEMENT` sont ajoutées à
  `table-de-passage.types.ts` et l'union du type comme l'énumération publiée en sortent. Une valeur
  ajoutée est publiée **automatiquement** — la leçon de STORY-390, où une liste recopiée en
  littéraux avait publié en lecture un vocabulaire plus étroit que celui accepté en écriture.
- **`etat` en enum d'un seul littéral par classe** (`BILAN_ACTIF` / `BILAN_PASSIF` / `BILAN`), pas
  l'union des trois : `PosteActifDto.etat` ne vaudra jamais `BILAN_PASSIF`, et publier l'union
  serait un contrat plus large que la réalité. Les constantes sont **typées par l'interface**
  (`const ETAT_ACTIF: PosteActif['etat']`), donc un renommage casse la compilation.
- **Comparatifs N-1 `nullable`, jamais optionnels** — les 8 champs de l'AC-7 plus `bz`, `dz`,
  `ecartEquilibre`. `null` porte un fait, `undefined` n'en porte aucun.
- **Journal de surcharge requis ET nullable** : `validePar`, `valideAt`, `ancienPoste`, `motif`
  passent de `required: false` à requis + `nullable`. `SurchargeResponseDto.from()` les pose
  **systématiquement** (`?? null`) — `required: false` annonçait une absence que le serveur n'a
  jamais produite. Ils perdent leur `?` en TypeScript : `tsc` oblige désormais `from()` à tous les
  fournir.
- **`example` de `mappes` corrigé** (il omettait `source`, AC-5) — et c'est **de lui** que Swagger
  déduisait le type faux.
- **`test/openapi-contract.e2e-spec.ts`** (13 tests) — voir ci-dessous.

### Ce qui décide de la story : AC-4, « pas deux descriptions parallèles »

Le garde-fou n'est pas une liste d'assertions recopiant le schéma attendu — ce serait une
troisième description, libre de vieillir avec les deux autres. `ecartsContrat()` **descend en
parallèle le schéma publié et le corps HTTP réel** de 5 routes, et rend un écart pour chacun de :
propriété publiée `required` et absente de la réponse · clé rendue par la route et **non publiée** ·
`null` rendu sur un champ publié non-`nullable` · valeur hors énumération · type qui ne correspond
pas · schéma **opaque**. L'`example` de `mappes` passe dans **le même** validateur.

⚠️ **Le piège d'énoncé, hérité de STORY-132/376** : ici le document publiait bien un `type` — le
**mauvais**. Une garde « toute propriété déclare un `type` » serait passée **au vert sur le bug
qu'elle prétend attraper**. Ce qui est traqué est l'`object` **opaque** (ni `properties`, ni
`additionalProperties`, ni `allOf`/`oneOf`/`anyOf`, ni `$ref`) **et** la confrontation à la réponse
réelle.

⚠️ **L'inventaire des objets opaques est FIGÉ, pas seuillé** : `expect(opaques()).toEqual([…17
chemins…])`. Il rougit dans les **deux** sens — un nouvel opaque sur un DTO du périmètre (récidive)
comme la fermeture d'un des 17 (l'inventaire doit rétrécir avec la dette). Un `toBeLessThan(20)`
aurait laissé passer exactement le défaut que la story corrige.

### Portes de qualité

Lint **0 warning** · build OK · **1147 unitaires** (1 skipped) + **300 e2e** verts (287 → 300, les
13 du contrat) · seuils 65/90/90/90 tenus. Les `*.dto.ts` étant **exclus de `collectCoverageFrom`**,
aucun décorateur corrigé ici n'est visible aux seuils : `openapi-contract.e2e-spec.ts` est le seul
filet contre la récidive.

**7 mutations appliquées, chacune vérifiée ROUGE puis restaurée** :

| # | mutation | tests qui virent au rouge |
|---|---|---|
| 1 | `type: [RattachementCompteDto]` retiré de `mappes` (**le bug d'origine**) | AC-1, AC-2, AC-5, AC-4 (4 rouges) |
| 2 | `source` retiré de l'`example` de `mappes` | AC-5 |
| 3 | `nullable: true` retiré de `netN1` | AC-7, AC-8 |
| 4 | `coherenceSousTotaux` publié `nullable` (**ce que l'AC-8 demandait**) | AC-8 |
| 5 | `validePar` remis en `required: false` + `?` | inventaire opaque, AC-3 (les 2 branches) |
| 6 | énumération `source` recopiée en littéraux (`['referentiel']`) | AC-2, AC-4 |
| 7 | `BilanDto.referentiel` retypé sur l'**interface** `ReferentielRef` + `example` (code d'origine) | inventaire opaque, AC-6, AC-7, AC-8, AC-3 (5 rouges) |

⚡ **Une mutation est restée VERTE, et elle apprend quelque chose** : retirer `type: ReferentielRefDto`
en **gardant** le champ typé `ReferentielRefDto` ne casse rien — `emitDecoratorMetadata` réfléchit la
**classe** et Swagger publie le `$ref` tout seul. Le `type:` explicite est donc redondant *tant que
la propriété est typée par une classe*. La vraie régression est le retour au **type d'interface**
(mutation 7), qui n'existe pas à l'exécution — c'est elle qui rougit. ⚠️ La première écriture de
cette mutation a échoué **à la compilation** (import devenu inutilisé) : une mutation rouge par
erreur de compilation ne prouve rien, elle a été nettoyée pour que ce soit le **test** qui rougisse
(leçon STORY-179).

### Vérification docker — sur le service RÉEL, tous contrôleurs montés

⚠️ Cette story n'écrit **rien en base** : la vérification qui compte n'est pas `mongosh`, c'est le
**document réellement publié** par le service. La batterie e2e ne monte que 2 contrôleurs (26
schémas) ; le service en monte 13 (**78 schémas, 37 chemins**), et rien ne garantissait a priori que
les deux documents coïncident.

`docker compose up -d mongo kafka redis bilan-service` (`Found 0 errors`, `/health` → `mongodb: up`,
`kafka: up`), puis `GET http://localhost:3004/api/docs-json` (102 763 octets) :

| vérifié sur le document du service réel | résultat |
|---|---|
| les **12 classes** de la story présentes | 12/12 |
| `RattachementResultDto.mappes.items` | `$ref → RattachementCompteDto` (jamais `{type: string}`) |
| `TypePoste.enum` / `SourceRattachement.enum` | `["detail","total"]` / `["referentiel","surcharge"]` |
| `BilanDto.actif/passif/sousTotaux` `.items` | `$ref → PosteActifDto` / `PostePassifDto` / `SousTotalDto` |
| `controle`, `coherenceSousTotaux`, `referentiel`, `stamp` | `allOf: [$ref …]`, jamais opaques |
| `coherenceSousTotaux` requis, **non** `nullable` | ✅ (AC-8 corrigé) |
| `SurchargeResponseDto.required` | les 10 champs, journal compris |
| objets **opaques** sur les 14 classes du périmètre | **0** |

⚡ **Chiffre nouveau, et il corrige la story** : le service complet porte encore **62 objets
opaques** répartis sur **29 DTO** — là où la story annonçait « 20+ autres ». Le détail (`LiasseDto` 6,
`JeuEtatsResponseDto` 5, `SnapshotResponseDto` 5, `ConsultationIndexItemDto` 4, `TftDto` 6,
`CompteResultatDto` 7…) est le vrai inventaire de la dette laissée à FE-032/033/034, et il appuie la
note de la story : **c'est un candidat à une règle d'architecture, pas à une n-ième story de
rattrapage**.

Stack arrêtée après la vérification (`docker compose stop`).

### Hors périmètre — tenu, et documenté

Les DTO des trois autres états (compte de résultat, TFT, notes annexes), `ControlesCoherenceDto`,
`JeuEtatsResponseDto` / `LiasseDto` / `JeuEtatsSommaireDto` et les autres n'ont **pas** été touchés,
bien que `ReferentielRefDto` / `ReferentielStampDto` existent désormais et suffiraient à en refermer
une partie en quelques lignes. Leurs consommateurs (**FE-032/033/034**) ne sont pas livrés : les
traiter ici rejouerait l'orphelinat de STORY-144, que le hors-périmètre existe pour éviter. Les 17
chemins visibles depuis les 2 contrôleurs du périmètre sont **figés dans le test** — ils rougiront
le jour où on les refermera, ce qui force à mettre l'inventaire à jour au lieu de l'oublier.

### Note aux consommateurs

**FE-030** *(table de passage)* et **FE-031** *(Bilan actif/passif)* : régénérer
(`npm run gen:api -- bilan`) puis **retirer** `api/lecture-contrat.ts` — mais seulement les lecteurs
dont le schéma est effectivement publié ci-dessus (`lireActif`, `lirePassif`, `lireSousTotaux`,
`lireControleEquilibre`, `lireCoherenceSousTotaux`, `lireStamp`). ⚠️ `lireCoherenceSousTotaux` ne doit
plus envelopper un `null` d'objet : le serveur rend **toujours** l'objet ; c'est `bz === null` qui
signifie « référentiel sans cascade ». Vérifier le retrait **par mutation** (casser un champ, exiger
un rouge) plutôt qu'en se fiant à `gen:api`, qui régénère tous les services sans dire lequel a changé.
