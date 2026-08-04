# STORY-181 : `AdminOrgDetailDto` ne décrit **aucun champ** — le contrat généré ne protège plus la fiche

**Epic :** EPIC-016 — Chaîne KYC complète (admin-panel)
**Réf. :** ticket §C · **AP-02** *(fiche détail)* · **STORY-047** *(vue agrégée des organisations)* · **STORY-132** *(le même symptôme sur `SessionResponseDto`)*
**Découverte par :** AP-INT-1, en auditant les types générés de la console
**Priorité :** Should Have
**Story Points :** 2
**Statut :** À faire
**Créée le :** 2026-08-04
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
