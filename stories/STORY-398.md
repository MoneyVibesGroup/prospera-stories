# STORY-398 : Le contrat de rattachement n'est pas publié — et l'un de ses champs est publié FAUX

Status: in_progress

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

**Statut : `in_progress`** — branche `MNV-398` ouverte sur `bilan-service` **et** sur `docs`
(preuve : `git rev-parse --abbrev-ref HEAD` rend `MNV-398` dans les deux dépôts, 2026-08-27).
Aucun contrat d'événement Kafka touché ⇒ **un seul dépôt de code**.
