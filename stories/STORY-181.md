# STORY-181 : `AdminOrgDetailDto` ne décrit **aucun champ** — le contrat généré ne protège plus la fiche

**Epic :** EPIC-016 — Chaîne KYC complète (admin-panel)
**Réf. :** ticket §C · **AP-02** *(fiche détail)* · **STORY-047** *(vue agrégée des organisations)* · **STORY-132** *(le même symptôme sur `SessionResponseDto`)*
**Découverte par :** AP-INT-1, en auditant les types générés de la console
**Priorité :** Should Have
**Story Points :** 2
**Complexité :** low
**Statut :** done
**Créée le :** 2026-08-04
**Démarrée le :** 2026-08-07
**Clôturée le :** 2026-08-07
**Sprint :** 20
**Service :** `prospera-admin-panel-service` (`:3010`)

---

## Le constat

Les trois blocs de la fiche détail sont déclarés en `type: Object` :

```ts
// admin-panel/src/admin/orgs/dto/admin-org-detail.dto.ts:18-39
@ApiProperty({ description: 'Identité + membres (auth). Toujours présente.', type: Object })
identity!: OrganizationDetail;          // ⚠️ le type TS est juste ; le Swagger ne le voit pas
```

`openapi-typescript` en tire donc, pour les trois, un `Record<string, never>` — un type qui
n'autorise **aucune** propriété *(`frontend-admin-panel/src/types/api/admin.ts:413-421)*.

**Conséquence :** `npm run gen:api` produit, pour cet endpoint précis, des types **inutilisables**.
Le client les recaste à la main :

```ts
// frontend-admin-panel/src/features/orgs/api/orgs-client.ts
const identity = dto.identity as { orgId?: string; name?: string; country?: string; … } | undefined;
```

Et toute la valeur du contrat généré — **qu'un renommage amont casse la compilation du front** —
disparaît sur **le seul écran qui agrège trois services**, c'est-à-dire celui qui a le plus de
raisons de bouger.

> ⚡ **Troisième occurrence du même motif dans ce dépôt.** `STORY-132` traite exactement ça sur
> `SessionResponseDto` *(`userAgent`/`ip` réfléchis en `Object`)*, et FE-024 l'avait relevé sur
> `paquetFiscal`/`stamp`. Ce n'est pas un oubli isolé, c'est un **patron de décorateur** à connaître :
> dès que le type TS n'est pas une classe que Nest peut réfléchir, le Swagger publie un objet informe.

---

## ⚡ Arbitrages rendus au lancement — 2026-08-07

### ① Le vrai coupable n'est pas `type: Object`, c'est **`type: Object` SANS `additionalProperties`**

L'audit de DoD (`grep 'type: Object' src/`) ramène **5 occurrences**, pas 3 :

| Occurrence | Nature |
|---|---|
| `admin-org-detail.dto.ts` ×3 | les cibles de la story — **formes connues**, à typer |
| `admin-entitlement.dto.ts:49` — `config` | **forme libre assumée**, justifiée par écrit dans le fichier |
| `grant-entitlement.dto.ts:72` — `config` | idem, en entrée |

Les deux dernières sont « justifiées » au sens du DoD… **et pourtant elles produisent le même
`Record<string, never>` inutilisable côté console.** Être de forme libre n'excuse pas d'être
**inexploitable** : `{ type: 'object' }` sans plus se traduit par « objet dont aucune propriété n'est
permise », alors que `{ type: 'object', additionalProperties: true }` donne l'index signature attendue.

⇒ **Les 5 occurrences sont traitées** : 3 par un vrai type, 2 en gardant la forme libre **et** en la
rendant utilisable. Le DoD demandait « corrigée **ou** justifiée » ; on peut faire les deux.

### ② `entitlements` réutilise `AdminEntitlementDto`, qui existe déjà

`src/admin/catalog/dto/admin-entitlement.dto.ts` est le miroir exact du contrat `Entitlement`. En créer
un second serait deux classes à faire diverger. Diff minimal : on l'importe.

### ③ Les feuilles VRAIMENT libres restent libres — et on **trace** au lieu de corriger

`KycExtraction.extracted` / `declared` / `discrepancies` sont des `Record<string, unknown>` **dans le
contrat du BFF**, parce que l'amont les publie ainsi. Leur donner ici une forme concrète serait
**inventer une garantie que le BFF ne tient pas** — exactement ce que le hors-périmètre interdit.

⚠️ **Écart tracé, non corrigé** (comme la story le demande) : `kyc-service` **connaît** ces formes —
`ExtractedFields`, `DeclaredFields` et `FieldDiscrepancy` sont typées dans
`src/kafka/events/document-extrait-events.ts` — mais son propre `AdminKycExtractionDto` les **efface**
en `Record<string, unknown>`. Le BFF ne peut pas être plus précis que sa source : c'est **chez l'amont**
que le contrat se perd, et c'est une story distincte.

### ④ Deux critères sont **hors d'atteinte depuis ce dépôt**

Les critères **nº2** (`npm run gen:api` côté console) et **nº5** (suppression des casts d'`orgs-client.ts`)
portent sur le dépôt de la **console front**, absent de l'espace de travail — constat déjà posé en
`STORY-179` puis `STORY-180`. La preuve livrable ici est `/api/docs-json` : c'est **l'entrée** du
générateur, donc ce qui détermine sa sortie. Le reste est transmis au front avec le schéma mesuré.

### ⑤ Le critère nº4 est **structurellement** garanti, et vérifié quand même

`admin-panel` n'a **ni `ClassSerializerInterceptor`, ni `@Exclude`/`@Expose`, ni
`excludeExtraneousValues`** (vérifié) ; son `ValidationPipe` ne s'applique qu'aux **entrées**. Un
`@ApiProperty` est donc purement **descriptif** : il ne peut pas modifier un octet de la réponse. Le
relevé avant/après est fait malgré tout — une garantie qu'on n'a pas mesurée n'est qu'une conviction.

---

## Périmètre

Typer les trois propriétés d'`AdminOrgDetailDto` avec de vrais `@ApiProperty({ type: … })` :

| Propriété | Type à exposer |
|---|---|
| `identity` | `OrganizationDetailDto` *(identité + membres)* |
| `kyc` | `KycDetailDto`, `nullable` |
| `entitlements` | `EntitlementDto[]`, `nullable` |

⚠️ **Le BFF possède déjà ces formes** — ce sont ses contrats amont
*(`src/upstream/contracts/*.contract.ts`)*. Il ne manque que leur **projection Swagger** : des classes
DTO décorées, pas de nouvelles données ni de nouvelle logique.

### Hors périmètre

Changer la **forme** servie. Cette story rend visible ce qui est déjà renvoyé ; elle ne renomme rien
et n'ajoute aucun champ. ⚠️ Si la projection révèle un écart entre le contrat amont et ce que le BFF
relaie réellement, **le tracer** — ne pas le corriger au passage.

---

## Critères d'acceptation

1. `/api/docs-json` décrit les trois blocs avec leurs propriétés, plus aucun `Record<string, never>`.
2. `npm run gen:api` côté console produit des types **exploitables** pour `GET /admin/orgs/:orgId`.
3. Les `nullable` sont préservés : `kyc` et `entitlements` restent nullables *(la dégradation par
   source en dépend — `null` n'y est pas une erreur)*.
4. Aucun changement de la réponse : un enregistrement avant/après est **identique octet pour octet**.
5. ⚡ Vérification côté console : les casts manuels d'`orgs-client.ts` sont **supprimés**, et le
   typecheck passe sans eux — c'est la seule preuve que le contrat protège vraiment quelque chose.

---

## Progress Tracking

### Ce qui a été livré

`OrganizationDetailDto` + `OrganizationMemberDto` · `KycDetailDto` + `KycDocumentDto` +
`KycExtractionDto` + `KycOcrSummaryDto` · **réutilisation** d'`AdminEntitlementDto`, qui existait déjà.
Plus `additionalProperties: true` sur les deux `config` de forme libre.

### ⚡ Deux pièges que seul le test de contrat a révélés, sous des décorateurs d'apparence juste

**① Le `$ref` nullable.** `@ApiPropertyOptional({ type: KycDetailDto, nullable: true })` publie :

```jsonc
{ "nullable": true, "type": "object", "allOf": [{ "$ref": "…/KycDetailDto" }] }
```

⚠️ **La référence SURVIT** — le piège n'est pas là, et c'est ce qui le rend coriace. Il est dans le
`"type": "object"` émis **à côté**, sans `properties` ni `additionalProperties` : le générateur en tire
`Record<string, never>` et l'**intersecte** avec le type référencé. Une intersection avec « aucune
propriété permise » n'autorise plus rien. Le décorateur a l'air juste, le `$ref` est visible dans le
schéma, et le bloc reste inutilisable. Corrigé en `allOf: [{ $ref: getSchemaPath(…) }]` +
`@ApiExtraModels`. ⚠️ Le cas **tableau** (`entitlements`) ne souffre pas de ce doublon : c'est le
**nullable non-tableau** qui le déclenche.

**② `additionalProperties` ne descend pas dans `items`.** Posé à côté d'`isArray: true`, il reste sur le
**tableau** ; les `items` repartent en `{ type: 'object' }` nu. Le défaut se rouvrait **un cran plus
bas**, sur `discrepancies`. Corrigé en forme longue `type: 'array'` + `items: { … }`.

Aucun des deux n'était visible en relisant le code. Ils ont été trouvés parce que le test assert sur le
**document réellement produit**, jamais sur la présence des décorateurs — qui serait tautologique.

### ⚠️ Ce livrable est INVISIBLE aux seuils de couverture

`collectCoverageFrom` d'`admin-panel` exclut `**/*.dto.ts`. Supprimer ces classes, les vider ou revenir
à `type: Object` ne ferait bouger **aucun chiffre**. C'est le même angle mort que `*bootstrap*`
(STORY-076/108) et que `seeds/**` (STORY-180), rencontré pour la troisième fois en deux stories.
⇒ `test/openapi-contract.e2e-spec.ts` est **la seule garde possible**, et il porte aussi l'invariant
général : *aucun schéma publié ne décrit un objet sans `properties` ni `additionalProperties`*.

### Portes DoD

Lint 0 · build OK · **386** unitaires (99,66 / 92,01 / 100 / 99,63) · **174** e2e.

⚠️ Un e2e a échoué **une fois** sur quatre exécutions, puis trois vertes consécutives — instabilité
connue, sans lien avec le diff (aucun code exécutable n'est modifié). Signalé plutôt que tu.

### Valeur probante — 5 mutations, 5 rouges (après 1 correction)

| # | Mutation | Test viré au rouge |
|---|---|---|
| M1 | `identity` revient à `type: Object` | invariant global + « identity référence OrganizationDetailDto » |
| M2 | `kyc` revient à la forme naïve `type: KycDetailDto` + `nullable` | invariant global |
| M3 | `nullable` retiré de `kyc` | AC-03 |
| M4 | `additionalProperties` retiré de `config` | invariant global + audit |
| M5 | `discrepancies` revient à `isArray` | invariant global + audit |

⚠️ **M2 a d'abord été rouge pour la mauvaise raison** : retirer l'usage de `getSchemaPath` sans retirer
l'import fait échouer la compilation (`TS6133`) — rouge, mais sans qu'aucune assertion soit évaluée.
Rejouée sous la forme qu'un développeur écrirait réellement (import retiré aussi) ⇒ rouge sur
l'invariant. Leçon `STORY-179`, rencontrée pour la deuxième fois.

⚡ **M2 est aussi ce qui a corrigé ma propre analyse** : je décrivais un « écrasement de la référence ».
La mesure dit l'inverse — la référence survit, c'est le `type: 'object'` surnuméraire qui empoisonne.
Le commentaire du code a été réaligné sur le fait.

### Vérification docker — contrôle avant/après sur `/api/docs-json` réel

`admin-panel` monte `src/` en volume : le contrôle se fait en basculant la **branche** et en
**redémarrant** le conteneur (`nest --watch` peut annoncer « Found 0 errors » en servant l'ancien
module — piège connu).

| | objets « `Record<string, never>` » dans **tout** le document servi |
|---|---|
| **AVANT** (`dev`) | **5** |
| **APRÈS** (`MNV-181`) | **0** |

Et les 5 sont **exactement** les 5 occurrences de l'audit — le `grep` et la mesure concordent :

```
AdminOrgDetailDto.properties.identity
AdminOrgDetailDto.properties.kyc
AdminOrgDetailDto.properties.entitlements.items
GrantEntitlementDto.properties.config
AdminEntitlementDto.properties.config
```

**AC-01** — schémas désormais publiés, mesurés sur le conteneur :
`OrganizationDetailDto` (8 propriétés), `OrganizationMemberDto` (7), `KycDetailDto` (8),
`KycDocumentDto` (9), `KycExtractionDto` (7), `KycOcrSummaryDto` (4), `AdminEntitlementDto` (9).

**AC-04 — réponse identique** : `GET /admin/orgs/:orgId` enregistré avant et après sur le **même**
dossier (celui semé par `STORY-180`). Deux lignes diffèrent au brut : les **deux URL présignées**, qui
portent `X-Amz-Date` et `X-Amz-Signature` et changent **à chaque appel par construction** — le seul
champ volatile de la charge utile. Neutralisé ce seul champ :

```
AVANT sha256 = eafdac7e36df1a051b061380de1a2ecb (2269 car.)
APRÈS sha256 = eafdac7e36df1a051b061380de1a2ecb (2269 car.)   ✅ identique
```

Conforme à ce que le code prédit : `admin-panel` n'a ni `ClassSerializerInterceptor` ni
`@Exclude`/`@Expose`, et son `ValidationPipe` ne s'applique qu'aux entrées — un `@ApiProperty` ne peut
pas déplacer un octet. La prédiction est vérifiée, pas supposée.

### ⚡ Revue de code — 2 constats, dont un qui touche le cœur de la story

**① La story avait DÉPLACÉ la dérive au lieu de la supprimer** *(bloquant)*.

L'argument de la story est qu'un renommage amont doit **casser une compilation**. Or `AdminOrgDetailDto`
déclarait ses blocs avec les types du **contrat** (`identity!: OrganizationDetail`) ; les typer avec des
classes DTO — ce que la story exige pour que Swagger les voie — **rompt ce lien**. Après le correctif,
plus rien n'empêchait la projection et le contrat amont de diverger en silence : on avait rendu le
contrat visible au front, et invisible au BFF.

`Conforme<MemeForme<Dto, Contrat>>` (`src/admin/orgs/dto/contrat-projete.ts`) le rétablit un cran plus
haut. Type **purement typographique** (aucun code émis, rien à couvrir : le compilateur *est* le test) et
**bidirectionnel** — la bidirectionnalité n'est pas décorative, `[A] extends [B]` seul laisserait passer
une projection **plus riche** que le contrat, c'est-à-dire une promesse que l'amont ne tient pas.

⚠️ **Le premier jet ne gardait rien, et seule la mutation l'a montré.** `MemeForme` renvoyait `never` en
cas d'écart — or **`type X = never` compile parfaitement** : un alias qui vaut `never` n'est pas une
erreur. La mutation « le contrat gagne un champ » a donc **survécu**. Le renvoi est passé à `false`, que
la contrainte `Conforme<T extends true>` refuse. ⚠️ Et renvoyer `never` casserait **aussi** cette
contrainte, `never` étant assignable à **tout** — y compris à `true`. Les deux détails sont
load-bearing **ensemble** : c'est exactement le profil d'une garde qui a l'air juste et ne garde rien.

**② `flags` était sous-typé** *(non bloquant)*. Laissé en objet libre alors que le contrat le fixe à
**deux booléens**. Sous-typer un champ dont on connaît la forme, c'est le défaut de la story en plus
discret — et il était entouré de **trois voisins légitimement libres** (`extracted`, `declared`,
`discrepancies`) qui le rendaient invisible. `KycFlagsDto` + une assertion qui dit explicitement
*pourquoi* celui-là n'est pas libre.

**Mutations ajoutées après revue — 3 sur la garde de dérive, 3 rouges** : champ **ajouté** au contrat,
champ **inventé** par la projection, champ **renommé** côté contrat. Toutes font échouer `npm run build`.

### Revue de sécurité — **aucune vulnérabilité introduite**

Le diff est **entièrement déclaratif** : 6 fichiers de DTO/type + 1 fichier de test, `0` ligne de chemin
exécutable. La réponse est mesurée **identique** avant/après (AC-04) — un `@ApiProperty` ne peut pas
déplacer un octet en l'absence de `ClassSerializerInterceptor`.

Passé en revue et écarté :
- **Aucun secret dans les exemples** : identifiants fictifs, e-mail de démonstration, ObjectId de
  documentation, URL présignée **tronquée** (`X-Amz-Signature=…`, aucune signature réelle).
- **Aucune surface d'auth, de RBAC, d'isolation tenant ou d'injection** n'est touchée ; aucun endpoint
  n'est ajouté ni ouvert.
- **Pas de donnée nouvellement exposée** : ce sont des **formes**, pas des valeurs.

⚠️ **Une observation PRÉEXISTANTE, signalée et volontairement hors périmètre** : `/api/docs-json` est
servi **sans authentification** (mesuré — la vérification docker l'a interrogé sans en-tête
`Authorization` et a reçu le document). Ce PR rend donc ce document *plus descriptif* pour un lecteur
anonyme. Ce n'est pas une vulnérabilité introduite ici : la posture est celle des 8 services depuis
`main.ts`, et le service publiait déjà l'intégralité de ses autres DTO — les endpoints, eux, restent
derrière `PLATFORM_ADMIN`. Un durcissement de l'exposition Swagger est une décision transverse, pas un
correctif de cette story.

## Definition of Done

- [x] Critères **nº1, nº3 et nº4** vérifiés · `lint` 0 · couverture 99,66 / 92,01 / 100 / 99,63
- [ ] ⚠️ **Critères nº2 et nº5 HORS D'ATTEINTE depuis ce dépôt** : ils portent sur la console front,
      absente de l'espace de travail (3ᵉ constat, après `STORY-179` et `STORY-180`). La preuve livrée est
      `/api/docs-json` — **l'entrée** du générateur, donc ce qui détermine sa sortie : **5 → 0** objets
      inexploitables dans tout le document servi.
- [x] ⚡ **Audit du même motif** : `grep 'type: Object'` ramène **5** occurrences, pas 3. Les 5 sont
      **traitées** — 3 par un vrai type, 2 en gardant la forme libre **et** en la rendant descriptible.
      Aucune n'est laissée « justifiée mais inexploitable ».
- [ ] **Ticket de suivi côté console** pour retirer les casts d'`orgs-client.ts` — à ouvrir dans le dépôt
      front, avec le schéma mesuré en pièce jointe.
- [x] Branche `MNV-181`, PR rebase-mergée sur `dev`
