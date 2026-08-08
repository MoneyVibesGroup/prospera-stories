# TICKET backend — objets imbriqués **déclarés par l'exemple**, donc non typés dans l'OpenAPI (`Record<string, never>`)

**Type :** dette de contrat (documentation d'API)
**Service :** `balance-service` (:3007) — mais le défaut est un **patron de code**, pas une route
**Ouvert par :** **FE-057** (migration du contrat de balance à 4 colonnes), 2026-08-08
**Priorité :** Should — un objet non typé n'est pas exploitable par un client généré, et se contourne
par des casts, c'est-à-dire par des contrats inventés côté appelant

---

## Le problème

Plusieurs propriétés d'objet sont déclarées avec un `@ApiProperty({ description, example })` **sans
`type` ni classe de schéma**. NestJS/Swagger n'a alors rien à sérialiser : la propriété sort dans
l'OpenAPI comme un objet **sans aucune propriété**, et `openapi-typescript` la rend en
`Record<string, never>` — c'est-à-dire « un objet dont aucune clé n'est permise ».

Relevé après régénération sur `balance-service@origin/dev` (`61d6365`) : **33 occurrences**. Les
quatre qui touchent des écrans déjà livrés :

| Schéma | Propriété | Ce que l'exemple annonce |
|---|---|---|
| `ReferentielDiagnosticDto` | `referentiel` | `{ code, version }` |
| `ReferentielDiagnosticDto` | `stamp` | `{ code, version, checksum }` |
| `PaquetFiscalDiagnosticDto` | `paquetFiscal` | `{ pays, annee }` |
| `PaquetFiscalDiagnosticDto` | `stamp` | `{ pays, annee, checksum }` |
| `WhoamiResponseDto` | `org` | organisation de rattachement (claim `org`) |

Les 28 autres sont du même patron (`mappingPropose`, `mappingColonnes`, `valeur`, `avant`/`apres`,
`soldeReleve`, `soldeComptable`, `exerciceSourceClos`…), sur des routes que le front n'a pas encore
consommées — ils deviendront le même problème à mesure que les écrans arrivent.

## Pourquoi c'est un problème

L'`example` **décrit** la forme, il ne la **garantit pas**. Un client généré ne peut donc lire aucune
de ces clés, et il ne lui reste que deux issues, toutes deux mauvaises :

1. **caster** (`as { code: string; version: string }`) — c'est écrire côté appelant un contrat que le
   serveur ne s'est engagé à rien tenir ; le jour où la forme change, rien ne devient rouge, l'écran
   affiche `undefined` ;
2. **renoncer** — c'est ce que le front a fait (FE-024, puis FE-057) : les écrans de l'Atelier
   s'appuient uniquement sur les champs **réellement typés** (`libelle`, `checksum`, `planCount`,
   `cache`, `statut`, `devise`…) et **n'affichent pas** le couple `code@version` du référentiel ni le
   couple `pays@annee` du paquet fiscal, alors même que le serveur les connaît et les envoie.

Le second choix est le bon tant que le contrat ne dit rien — mais il coûte à l'écran une information
que l'utilisateur a de bonnes raisons de vouloir : *sous quel référentiel, et sous quelle année
fiscale, ma balance a-t-elle été produite ?*

⚠️ Ce ticket est **voisin mais distinct** de `TICKET-BACKEND-tag-referentiel-non-expose.md`. Celui-là
demande une donnée que le serveur **ne donne pas** (le tag `SN|SMT|SFD-BCEAO`) ; celui-ci porte sur des
données que le serveur **donne déjà** mais que le contrat **ne décrit pas**. Les corriger séparément
est légitime ; les confondre ferait croire que l'un règle l'autre.

## Résolution attendue

Déclarer chacun de ces objets par une **classe de vue** portant ses `@ApiProperty`, et la référencer
(`@ApiProperty({ type: ReferentielRefView })`), exactement comme `EquilibreView`/`SommaireView` l'ont
été par STORY-147 — le patron existe déjà dans le service, il suffit de l'appliquer.

Une classe pour chaque forme, pas un `type: Object` ni un `additionalProperties: true` : le but n'est
pas de faire taire le générateur, c'est de **dire ce que la réponse contient**.

## Definition of Done

- [ ] Les cinq propriétés du tableau ci-dessus sont typées par une classe de vue dans l'OpenAPI de `:3007`.
- [ ] `npm run gen:api` côté front ne produit plus de `Record<string, never>` pour ces cinq-là.
- [ ] Une story frontend est nommée pour **consommer** ce qui est enfin typé — sans elle, la
      correction backend ne change rien à l'écran (défaut de chaînage déjà constaté trois fois :
      une story backend livrée ne déclenche rien tant qu'une story frontend ne la nomme pas).
- [ ] Le patron est appliqué, ou explicitement daté, pour les 28 autres occurrences.
