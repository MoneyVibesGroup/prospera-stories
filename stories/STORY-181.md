# STORY-181 : `AdminOrgDetailDto` ne décrit **aucun champ** — le contrat généré ne protège plus la fiche

**Epic :** EPIC-016 — Chaîne KYC complète (admin-panel)
**Réf. :** ticket §C · **AP-02** *(fiche détail)* · **STORY-047** *(vue agrégée des organisations)* · **STORY-132** *(le même symptôme sur `SessionResponseDto`)*
**Découverte par :** AP-INT-1, en auditant les types générés de la console
**Priorité :** Should Have
**Story Points :** 2
**Complexité :** low
**Statut :** in_progress
**Créée le :** 2026-08-04
**Démarrée le :** 2026-08-07
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

## Definition of Done

- [ ] Les 5 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ Un **audit du même motif** sur les autres DTO du BFF : `grep 'type: Object'` sur `src/`, et
      chaque occurrence restante est soit corrigée, soit justifiée par écrit
- [ ] Ticket de suivi côté console pour retirer les casts *(la story backend seule ne les enlève pas)*
- [ ] Branche `MNV-181`, PR rebase-mergée sur `dev`
