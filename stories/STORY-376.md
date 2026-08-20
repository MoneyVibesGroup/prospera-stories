# STORY-376 : L'`object` opaque a survécu à STORY-132 — 13 montants de `balance-service` sont indécrivables côté client

**Epic :** transverse / qualité de contrat (`balance-service`)
**Réf. :** **STORY-132** *(le même défaut sur `SessionResponseDto` de l'IdP)* · **STORY-181** *(le même défaut sur `AdminOrgDetailDto` de la console)* · **STORY-130** *(la dette de contrat de l'IdP, dont FE-055 est le retrofit)*
**Réf. process :** règle **Integration Gate** — « les types TS sont générés depuis l'OpenAPI, aucun type écrit à la main »
**Découverte par :** **FE-055**, DoD étendue §4 — « signaler s'il reste un écart pertinent pour le front »
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** low
**Statut :** ready-for-dev
**Créée le :** 2026-08-20
**Service :** `balance-service` (`:3007`)

> **Le trou, en une phrase :** treize **montants** sont publiés en `type: object` sans `properties` —
> `openapi-typescript` en fait des `Record<string, never>`, un type avec lequel **on ne peut ni calculer
> ni formater**. Ce sont des soldes, des écarts et des taux.

---

## Ce n'est pas une reprise de STORY-132, c'est sa **troisième occurrence**

STORY-132 a réparé `SessionResponseDto` (auth-service). STORY-181 a réparé `AdminOrgDetailDto`
(admin-panel). Les deux tickets énonçaient la même cause **structurelle**, et c'est elle qui n'a pas été
transposée : le plugin Swagger de NestJS n'infère pas le type d'une union avec `null`, donc tout
`number | null` décoré d'un `@ApiProperty({ nullable: true })` **sans `type` explicite** est publié en
`object` opaque.

⚠️ **Le piège d'énoncé de STORY-132 vaut encore ici** : le document publié porte bien un `type` — le
**mauvais**. Un critère « toute propriété déclare un `type` » passerait donc **au vert sur le bug qu'il
prétend attraper**. Ce qu'il faut traquer est l'`object` **opaque** : `type: 'object'` sans `properties`,
sans `allOf`/`oneOf`/`anyOf`, sans `additionalProperties` et sans `$ref`.

---

## Constat — mesuré sur l'OpenAPI vivant, pas supposé

Relevé le 2026-08-20 sur `http://localhost:3007/api/docs-json` (stack docker `origin/dev`) : **30**
propriétés opaques. L'`example` du schéma tranche pour 13 d'entre elles — il porte un **nombre** :

| DTO | Propriété | `example` publié |
|---|---|---|
| `TotauxReleveDto` | `soldeFin` | `130000000` |
| `EtatRapprochementResponseDto` | `soldeReleve` | `130000000` |
| `EtatRapprochementResponseDto` | `soldeComptableTheorique` | `122500000` |
| `EtatRapprochementResponseDto` | `soldeComptable` | `122500000` |
| `EtatRapprochementResponseDto` | `ecart` | `0` |
| `SituationCompteResponseDto` | `soldeOuverture` | `100000000` |
| `SituationCompteResponseDto` | `soldeCloture` | `113000000` |
| `EcheanceAcompteResponseDto` | `theorique` | `30000000` |
| `SeuilsTpuDto` | `plafondRegime` | `6000000000` |
| `SeuilsTpuDto` | `forfaitaireCaMax` | `3000000000` |
| `SeuilsTpuDto` | `declaratifCaMin` | `3000000000` |
| `TpuResponseDto` | `taux` | `0.08` |
| `TpuResponseDto` | `minimumAnnuel` | `2000000` |

Les 13 sont `nullable: true` — **exactement** la signature de STORY-132 : c'est l'union avec `null` qui
fait perdre le type, pas le champ.

**C'est un écart de déclaration, pas de comportement** : les valeurs servies sont des nombres.

---

## Scope

- Ajouter `type: Number` aux `@ApiProperty` des **13 propriétés** ci-dessus.
- **Qualifier les 17 autres propriétés opaques** (sans `example` numérique) — elles ne sont *pas*
  toutes des bugs, et les confondre serait faux :
  - `WhoamiResponseDto.org`, `BalanceAccessResponseDto.org`, `OuvertureResponseDto.exerciceSourceClos`,
    `DecisionRegimeDto.avant|apres`, `DeficitResponseDto.expireApres`,
    `StockDeficitsResponseDto.dureeReportAnnees` → objets ou scalaires **structurés** : à décrire par un
    `$ref` (le patron `OrganizationInfo` de STORY-130).
  - `AnalyseFichierResponseDto.mappingPropose`, `ProfilImportResponseDto.mappingColonnes`,
    `PaquetFiscalDiagnosticDto.paquetFiscal`, `ReferentielDiagnosticDto.referentiel|stamp` →
    dictionnaires **réellement libres** : `additionalProperties` explicite, ce qui produit un
    `Record<string, X>` exploitable au lieu d'un `Record<string, never>` inutilisable.
  - `PropositionAxeDto.valeur`, `ChampProposeDto.valeur`, `ChampRetenuDto.valeur`,
    `ConflitChampDto.autreValeur` → valeurs polymorphes assumées : `oneOf` (l'`example` de
    `ChampRetenuDto.valeur` est la **chaîne** `"1000745307"`, pas un nombre — l'union est réelle).
- **Activer le plugin Swagger** dans `nest-cli.json`, ou acter par écrit qu'on ne l'active pas : sans
  lui, chaque nouveau `T | null` rejouera ce ticket. STORY-132 avait identifié la cause sans la traiter,
  et c'est précisément pourquoi le défaut est ici.
- **Garde-fou** : un test de contrat qui échoue si un schéma publié porte un `object` opaque
  (définition ci-dessus, pas « déclare un `type` »). STORY-130 se disait « patron transposable » — trois
  occurrences plus tard, la transposition est le livrable.

**Hors périmètre :** toute modification du comportement de l'API (les valeurs servies ne changent pas) ·
la régénération côté frontend (elle suivra dans la story front qui consommera ces surfaces).

---

## Ce que ça coûte au front — et pourquoi ce n'est **pas** urgent

⚠️ À la date de création, **aucun écran du front cabinet ne consomme ces DTO** : `EtatRapprochement`,
`SituationCompte`, `Tpu` et `TotauxReleve` appartiennent aux familles rapprochement / trésorerie /
fiscal, qui n'ont pas d'écran (constat de portée établi par **FE-063** : 10 familles sur 15 sans
consommateur front). Le ticket est donc **tracé, pas bloquant**.

Il le deviendra au premier écran qui affiche un de ces montants : `Record<string, never>` ne se formate
pas, et la seule issue serait un `as number` aveugle — soit exactement le type écrit à la main que
l'Integration Gate interdit, et que FE-021 avait dû contourner à l'exécution avant STORY-132.

**⇒ à traiter AVANT la story front qui ouvrira l'écran de rapprochement**, pas après.

---

## Critères d'acceptation

1. Les 13 propriétés du tableau publient `"type": "number"` dans `/api/docs-json`.
2. Les 17 autres sont **qualifiées** : chacune porte un `$ref`, un `additionalProperties` ou un `oneOf`,
   ou bien une note justifiant qu'elle reste libre.
3. Le décompte des `object` opaques du service est **zéro**, ou justifié ligne à ligne.
4. Un test de contrat échoue si un `object` opaque réapparaît (et il est vérifié **par mutation** : on
   en introduit un, le test rougit).
5. `npm run gen:api -- balance` côté `prospera-frontend-expert-comptable` ne produit plus aucun
   `Record<string, never>` hors `webhooks` et `$defs`.
