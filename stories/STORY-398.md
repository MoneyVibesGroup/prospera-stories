# STORY-398 : Le contrat de rattachement n'est pas publié — et l'un de ses champs est publié FAUX

Status: ready-for-dev

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/dto`, `modules/bilan/mapping-override/dto`
**Points :** 2 · **Sprint :** S20
**Origine :** remontée le **2026-08-24** par **FE-030**, en câblant la table de passage —
c'est-à-dire en essayant de **consommer** `POST …/bilan/table-de-passage/dry-run`.

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

**Hors périmètre**

- Les 20+ objets non typés des DTO de **liasse** (`LiasseDto`, `JeuEtatsResponseDto`) —
  aucun écran ne les consomme encore ; ils reviendront avec FE-031→034. Les traiter ici
  ferait une story sans consommateur, c'est-à-dire STORY-144 une fois de plus.

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

---

## Notes

- ⚠️ **Voisin mais distinct** de `TICKET-BACKEND-objets-imbriques-non-types-dans-l-openapi`
  (ouvert par FE-057 sur `balance-service`, 33 occurrences) et de **STORY-376** / 
  **STORY-389**, qui portent le même patron sur d'autres services. Ce qui est **propre à
  celle-ci**, et ce qui la rend plus urgente : les autres publient un objet **vide**, 
  celle-ci publie un type **faux**.
- ⚠️ Après livraison, le front doit **régénérer** (`npm run gen:api -- bilan`) *et*
  **retirer** `api/lecture-contrat.ts` : laisser les deux en place ferait vivre deux
  descriptions du même contrat. Consommateur nommé : **FE-030**, pour ne pas rejouer
  l'orphelinat de STORY-144.
