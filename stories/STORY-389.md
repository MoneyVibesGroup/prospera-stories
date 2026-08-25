# STORY-389 : Le mapping de colonnes n'est typé QUE dans le sens de l'écriture

**Epic :** EPIC-021 — Import & migration Sage (profils d'import)
**Réf. :** écart remonté par **FE-048** *(profil d'import & mapping réutilisable)*, 2026-08-24 — prolonge **STORY-088**, **STORY-089** et **STORY-376**
**Priorité :** Should Have
**Story Points :** 1
**Statut :** done
**Date de clôture :** 2026-08-25
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

---

## Progress Tracking

**Statut : `done`** — vérifiée, gardée, revue, sécurisée et mergée le 2026-08-25.

### ⚡ La prémisse de la story était FAUSSE — et c'est le résultat principal

L'énoncé décrit `mappingPropose` et `mappingColonnes` comme dépourvus de `type:`, donc publiés en `object`
opaque et rendus `Record<string, never>` par `openapi-typescript`. **Ce n'est plus vrai depuis
STORY-376.** Vérifié, pas supposé — sur le document réellement publié par la branche `dev` :

| déclaration | sens | `$ref` publié |
|---|---|---|
| `CreerProfilImportDto.mappingColonnes` | écriture | `#/components/schemas/MappingColonnesDto` |
| `ModifierProfilImportDto.mappingColonnes` | écriture | `#/components/schemas/MappingColonnesDto` |
| `AnalyseFichierResponseDto.mappingPropose` | **lecture** | `#/components/schemas/MappingColonnesDto` |
| `ProfilImportResponseDto.mappingColonnes` | **lecture** | `#/components/schemas/MappingColonnesDto` |

Le commit responsable est identifié : **`185c3c9` — `MNV-376(balance): les 30 « object » opaques du contrat
sont décrits`**, dont le code porte encore le commentaire *« STORY-376 — le DTO existait déjà, dans l'autre
sens »*. `FE-048` a donc été rédigé sur un contrat **antérieur** à ce merge.

⚠️ Deux autres détails de l'énoncé ne correspondent pas au réel, et il vaut mieux le noter que le
découvrir deux fois : `MappingColonnesDto` publie **16** propriétés (l'énoncé en annonce dix-sept), et les
déclarations concernées sont **quatre**, pas trois — les deux du sens écriture comptent, puisque c'est leur
symétrie avec la lecture qui fait tout l'objet du ticket.

### Ce qui manquait réellement : la **garde**, pas le `type:`

`collectCoverageFrom` exclut les `*.dto.ts` : retirer un `type:` d'un `@ApiProperty` ne fait bouger **aucun**
chiffre de couverture. Le seul filet en place était le balayage générique des `object` **opaques** de
`openapi-contract.e2e-spec.ts`. Il est réel, mais il ne couvre **qu'une moitié du risque** :

- il attrape la **perte** du type (retour à `type: 'object'` sans `properties`) ;
- il **ne peut pas** attraper un type **remplacé par le mauvais**. Un `type: ProfilReconnuDto` posé par
  erreur produit un document parfaitement non-opaque, un client parfaitement typé — et parfaitement faux.

C'est exactement le piège d'énoncé que l'en-tête de ce fichier décrit depuis STORY-132 (« le document
publié porte bien un `type` — le **mauvais** »), resté sans filet **nommé** sur le champ qui porte tout le
sens du module d'import. La story livre donc ce filet.

### Ce qui a été livré

| | |
|---|---|
| `openapi-contract.e2e-spec.ts` — garde nommée | les **quatre** déclarations sont assertées une par une (`it.each`) : chacune doit référencer `MappingColonnesDto` **et pas un autre schéma**, et ne doit porter **aucun** `type` nu. |
| garde de **non-vacuité**, posée AVANT | `MappingColonnesDto` doit décrire **au moins 16 colonnes**, et **chacune** doit publier une forme (`oneOf` ou `type`). Sans elle, un `MappingColonnesDto` vidé laisserait les quatre assertions de `$ref` au vert : elles pointeraient sur un type qui ne décrit plus rien, et le client retomberait sur l'objet opaque. Plancher, pas valeur figée — une convention d'import ajoutée demain fait *grandir* ce DTO. |

**Aucune ligne de `src/` n'a été modifiée** : le comportement, les charges utiles et le document publié sont
identiques au bit près. C'est ce qui rend l'AC-3 (« aucune charge utile ne change, les e2e de STORY-088/089
passent inchangés ») vrai **par construction**.

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **2 973 / 2 973**, couverture
**98,98 st / 91,83 br / 98,17 fn / 99,06 li** (seuils 65/90/90/90 — inchangée, aucun `src/` touché) ·
`test:e2e` **694 / 694** (689 + 5).

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| `type: MappingColonnesDto` → `type: ProfilReconnuDto` sur `mappingPropose` | garde nommée `AnalyseFichierResponseDto.mappingPropose` | 🔴 1 rouge — **et le balayage générique reste VERT** |
| une colonne de `MappingColonnesDto` perd son `@ApiPropertyOptional` (16 → 15) | garde de non-vacuité | 🔴 1 rouge |

⚡ **La première mutation est la démonstration de la story** : elle produit un document **non opaque**, que
le filet existant laisse passer sans broncher, et que seule la garde nommée attrape. Sans elle, le contrat
le plus structurant du module d'import pouvait devenir faux **sans qu'aucun test ne rougisse**.

🪤 Une mutation intermédiaire a d'abord échoué **à la compilation** (commenter les décorateurs d'un DTO
casse la syntaxe des propriétés) : rouge sans qu'aucune assertion n'ait jugé quoi que ce soit. Rejouée en
retirant **un seul** décorateur complet — `tsc --noEmit` muet, et la garde rougit sur ce qu'elle prétend
garder.

### Vérification sur la stack — AC-1 lu sur `/api/docs-json` SERVI, pas sur un dump local

L'AC-1 porte littéralement sur `/api/docs-json`. Il a donc été lu **sur le conteneur**, pas sur un document
reconstruit en mémoire :

```
GET http://localhost:3007/api/docs-json → 200
OrigineBalance publié : True         ← preuve que le conteneur porte bien `dev` À JOUR (STORY-388)
AnalyseFichierResponseDto.mappingPropose  → #/components/schemas/MappingColonnesDto
ProfilImportResponseDto.mappingColonnes   → #/components/schemas/MappingColonnesDto
CreerProfilImportDto.mappingColonnes      → #/components/schemas/MappingColonnesDto
ModifierProfilImportDto.mappingColonnes   → #/components/schemas/MappingColonnesDto
```

La ligne `OrigineBalance` n'est pas décorative : elle **date** le document lu. Sans elle, ces quatre
références pourraient venir d'un service démarré sur un code antérieur — c'est le piège du hot-reload
déjà payé en STORY-387.

### Ce qui reste à faire, et par qui

Le contournement `lireMappingBalance` de `FE-048` (`lib/mapping-profil.ts`) peut être retiré **dès
maintenant** : il duplique `EstRefColonneConstraint` alors que le type généré porte déjà l'information. Ce
retrait appartient au dépôt frontend, il ne relève pas de cette story.

### Revue de code (⑥)

**0 constat.** Le diff est **un seul fichier de test**, aucune ligne de `src/`. Ce qui a été relu, et
pourquoi il n'en sort rien :

- **périmètre** — la story demande que le contrat soit typé ; il l'est. Ce qui est livré est la garde qui
  l'y maintient, et rien d'autre. Aucun `src/` touché, donc aucun débordement possible ;
- **non-tautologie** — c'est le point qui méritait l'examen, puisqu'un test ajouté sur un invariant **déjà
  satisfait** passe au vert par construction. Les deux mutations le tranchent : la garde nommée rougit sur
  un type **remplacé**, cas que le balayage générique laisse passer (mesuré : il reste vert) ; la garde de
  non-vacuité rougit sur un DTO amputé d'une colonne ;
- **ordre des gardes** — la non-vacuité est déclarée **avant** les quatre assertions de référence, comme le
  fait déjà la garde de non-vacuité du document en tête de fichier. Une référence vers un schéma vide est
  exactement le genre de « vrai par vacuité » que ce dépôt paie le plus cher ;
- **message d'échec** — la boucle sur les colonnes assert `{ nom, aUneForme }` plutôt qu'un booléen nu :
  un échec **nomme la colonne fautive**. Un `expect(x).toBe(true)` aurait rapporté « false n'est pas true »
  sur seize candidates.

### Revue de sécurité (⑦)

**0 vulnérabilité**, et la raison est structurelle plutôt qu'argumentaire : le diff **ne contient aucun
code exécuté en production** — pas un endpoint, pas un guard, pas un DTO, pas une requête. Vérifié tout de
même, parce que « c'est un test » n'est pas un raisonnement de revue :

- la garde **ne relâche aucune validation** : `EstRefColonneConstraint` et `@IsOptional` restent seuls
  juges de ce qu'un client peut écrire dans `mappingColonnes` ; publier la **forme** d'un champ ne l'ouvre
  pas ;
- **rien de sensible n'entre au document** : `MappingColonnesDto` ne décrit que des **références de
  colonnes** (nom ou index), c'est-à-dire la structure d'un fichier que le cabinet a lui-même déposé —
  aucun identifiant, aucune donnée d'un autre tenant, aucun secret ;
- **aucune surface d'énumération** : les profils restent org-keyed et le contrôleur reste derrière
  `@RequiresBalanceAccess` + `@RequiresDossierScope`.
