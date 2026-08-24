# STORY-389 : Le mapping de colonnes n'est typé QUE dans le sens de l'écriture

**Epic :** EPIC-021 — Import & migration Sage (profils d'import)
**Réf. :** écart remonté par **FE-048** *(profil d'import & mapping réutilisable)*, 2026-08-24 — prolonge **STORY-088**, **STORY-089** et **STORY-376**
**Priorité :** Should Have
**Story Points :** 1
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

Le contrat des profils d'import est **asymétrique**, et l'asymétrie tombe exactement sur le champ
qui porte tout le sens de la story.

**Côté écriture — typé :**

```ts
// CreerProfilImportDto / ModifierProfilImportDto
@ApiProperty({ type: MappingColonnesDto })
mappingColonnes!: MappingColonnesDto;
```

⇒ l'OpenAPI publie `components["schemas"]["MappingColonnesDto"]`, avec ses dix-sept propriétés et
leurs types (`string | number`, `string[]`). Le client généré est exact.

**Côté lecture — non typé :**

```ts
// AnalyseFichierResponseDto
@ApiProperty({ description: '…', example: { compte: 'Cpte', libelle: 'Désignation', soldeNet: 'Solde' } })
mappingPropose!: Partial<MappingProfil>;      // ← pas de `type:`

// ProfilImportResponseDto
@ApiProperty({ example: { compte: 'Cpte', soldeNet: 'Solde' } })
mappingColonnes!: MappingProfil;              // ← pas de `type:`
```

⇒ l'OpenAPI n'a **aucun schéma** à émettre et retombe sur l'objet vide :

```ts
// src/types/api/balance.ts, généré
mappingPropose: Record<string, never>;
mappingColonnes: Record<string, never>;
```

## Pourquoi c'est plus gênant ici qu'ailleurs

C'est la même famille d'écart que **STORY-376** (les `object` opaques) et que le ticket FE-024 sur
`referentiel`/`stamp`. La différence est de **portée** : là-bas, les champs non typés étaient des
métadonnées d'affichage, et les écrans pouvaient s'appuyer sur les champs voisins réellement typés.

Ici, `mappingColonnes` **est** l'objet de la story. Un écran de profils d'import qui ne peut pas
lire le mapping ne peut rien afficher du tout : ni la grille pré-remplie par la suggestion du
serveur, ni le résumé « compte → Cpte · soldeNet → Solde » dans la liste.

Le champ le plus important du contrat est le seul que le contrat ne décrit pas.

## Ce que le front a fait en attendant, et ce que ça coûte

`FE-048` ne caste pas — un `as MappingColonnesDto` affirmerait une forme que le serveur ne garantit
pas. Il **projette** (`lib/mapping-profil.ts`) :

```ts
export function lireMappingBalance(brut: unknown): MappingBalance {
  // ne garde que les champs de cible BALANCE, et seulement quand leur valeur
  // est une référence de colonne exploitable (nom non vide | entier ≥ 0)
}
```

La projection est correcte et testée. Elle a deux coûts, tous deux permanents tant que ce ticket
n'est pas livré :

1. **Elle duplique `EstRefColonneConstraint`.** Le contrôle « nom non vide ou entier ≥ 0 » existe
   déjà côté serveur ; le client le réécrit parce qu'il ne peut pas se fier au type. Deux règles
   parallèles finissent par diverger.
2. **Elle est muette sur ce qu'elle jette.** Le jour où le contrat gagne un champ de mapping, la
   projection l'ignore — sans erreur, sans avertissement. C'est précisément la dérive silencieuse
   que la garde d'exhaustivité de `CHAMPS_BALANCE` attrape *pour les champs déjà connus*, et
   qu'elle ne peut pas attraper pour un champ que le type ne publie pas.

## Ce qui est demandé

Poser `type:` sur les trois déclarations, et rien d'autre :

```ts
// imports-response.dto.ts
@ApiProperty({ type: MappingColonnesDto, description: '…' })
mappingPropose!: Partial<MappingProfil>;

@ApiProperty({ type: MappingColonnesDto })
mappingColonnes!: MappingProfil;
```

⚠️ **`MappingColonnesDto` réunit les deux cibles** (BALANCE et RELEVE), toutes propriétés
optionnelles — c'est déjà le cas côté écriture, et c'est correct : `class-validator` n'exprime pas
d'union, et la `cible` du profil lève seule l'ambiguïté de lecture. Le publier en lecture ne
promet donc rien de plus que ce que le serveur accepte déjà en écriture.

⚠️ **Aucun changement de comportement.** Les charges utiles émises sont identiques au caractère
près ; seule la description du contrat change. C'est ce qui rend ce ticket à 1 point.

## Critères d'acceptation

1. `GET /dossiers/{id}/imports/profils` et `POST …/imports/analyser` publient un
   `mappingColonnes` / `mappingPropose` typé `MappingColonnesDto` dans `/api/docs-json`.
2. `npm run gen:api -- balance` côté frontend rend `components["schemas"]["MappingColonnesDto"]`
   pour ces deux champs, et non plus `Record<string, never>`.
3. Aucune charge utile ne change : les tests e2e existants de STORY-088/089 passent inchangés.

## Effet côté frontend, une fois livrée

`lireMappingBalance` se réduit à un **filtre de cible** : le contrôle de valeur disparaît, et le
type généré redevient la seule source. Le suivi est nommé dans `lib/mapping-profil.ts` et dans
`features/atelier/api/types.ts`.
