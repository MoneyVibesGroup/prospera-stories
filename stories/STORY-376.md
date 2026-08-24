# STORY-376 : L'`object` opaque a survécu à STORY-132 — 13 montants de `balance-service` sont indécrivables côté client

**Epic :** transverse / qualité de contrat (`balance-service`)
**Réf. :** **STORY-132** *(le même défaut sur `SessionResponseDto` de l'IdP)* · **STORY-181** *(le même défaut sur `AdminOrgDetailDto` de la console)* · **STORY-130** *(la dette de contrat de l'IdP, dont FE-055 est le retrofit)*
**Réf. process :** règle **Integration Gate** — « les types TS sont générés depuis l'OpenAPI, aucun type écrit à la main »
**Découverte par :** **FE-055**, DoD étendue §4 — « signaler s'il reste un écart pertinent pour le front »
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** low
**Statut :** done
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


---

## Progress Tracking

### ① Le détecteur d'abord — c'est lui qui a piloté le travail

`test/openapi-contract.e2e-spec.ts` (patron de **STORY-181**, transposé) monte les **30 contrôleurs**,
produit le document réellement publié et cherche l'`object` **OPAQUE** : `type: 'object'` sans
`properties`, sans `additionalProperties`, sans `allOf`/`oneOf`/`anyOf` et sans `$ref`.

⚡ **Le piège d'énoncé que la story rappelait est respecté à la lettre** : le critère n'est **pas**
« toute propriété déclare un `type` » — celui-là passerait au vert sur le bug qu'il prétend attraper,
puisque le document porte bien un `type`, le **mauvais**.

**Mesure d'entrée : 30 opaques**, soit exactement la liste de la story, plus
`PaquetFiscalDiagnosticDto.stamp` qu'elle ne citait pas.

### ② Traité par famille — et le classement de la story a dû être corrigé **trois fois**

| Famille | Correctif | Compte |
|---|---|---|
| **Montants** | `type: Number` | **15** *(13 annoncés + `expireApres` et `dureeReportAnnees`)* |
| **Chaînes** | `type: String` | **4** |
| **Structures** | `$ref` vers une classe DTO | **5** |
| **Mappings** | `type: MappingColonnesDto` | **2** |
| **Polymorphes** | `oneOf` | **4** |

⚡ **Ce que la story avait mal rangé, et pourquoi ça compte :**

1. **`expireApres` et `dureeReportAnnees`** étaient classés « objets ou scalaires **structurés** à
   décrire par un `$ref` » : ce sont de simples **nombres**. Leur `example` vaut `null` — le cas où
   l'opacité était la plus trompeuse, puisque même l'exemple publié ne permettait pas de deviner qu'il
   s'agit d'une année.
2. **`WhoamiResponseDto.org`, `BalanceAccessResponseDto.org`, `DecisionRegimeDto.avant|apres`** étaient
   classés « objets structurés » : ce sont des **chaînes**. ⇒ **L'opacité ne dit rien de la nature du
   champ** — elle vient de l'union avec `null`, et de rien d'autre. C'est exactement la cause
   structurelle de STORY-132, et la mal lire aurait fait fabriquer quatre DTO inutiles.
3. **`mappingPropose` / `mappingColonnes`** étaient classés « dictionnaires **réellement libres** » à
   décrire par `additionalProperties`. ⚡ **Faux, et c'est le meilleur constat de la story** :
   `MappingColonnesDto` **existait déjà**, décrivant exactement `MappingProfil`
   (`Partial<MappingColonnes> & Partial<MappingColonnesReleve>`, les mêmes 14 clés) — mais il n'était
   publié que sur le chemin de l'**écriture** (`CreerProfilImportDto`), pas sur celui de la **lecture**.
   **Le champ le plus important du contrat était le seul qu'il ne décrivait pas.** C'est mot pour mot le
   constat de **STORY-389**, refermé ici pour ces deux champs.

⚡ **Deux cas que le plugin Swagger n'aurait pas sauvés** (cf. la décision ci-dessous) :
`PropositionAxeDto<T>` — un **générique** n'existe pas à l'exécution, le décorateur ne voyait rien à
décrire ⇒ union des deux énumérations d'axe ; et les `unknown` de l'OCR, **réellement** polymorphes
(l'`example` de `ChampRetenuDto.valeur` est la **chaîne** `'1000745307'`, un NIF) ⇒ `oneOf`.

### ③ ⛔ Décision actée : le plugin Swagger **n'est pas** activé

Le scope laissait le choix — l'activer ou l'acter par écrit. **Acté**, motivé en trois points dans
`main.ts` :

1. il changerait le contrat **bien au-delà** de ces 30 propriétés (inférence globale des types, des
   `required`, des descriptions) sur 30 contrôleurs et une centaine de DTO — l'inverse du « aucun
   changement de comportement » que la story s'impose ;
2. **il n'aurait vu ni le générique ni le `unknown`** — les deux cas les plus subtils du lot ;
3. il ne dispenserait **pas** du test, alors que le test dispense de lui.

### ④ Mutation-test — ce qui prouve que la garde filtre

| Mutation | Attendu | Mesuré |
|---|---|---|
| Un `object` opaque réintroduit (`type: String` retiré de `Whoami.org`) | rouge, en **nommant** le chemin fautif | ✅ `components.schemas.WhoamiResponseDto.properties.org` |
| Document publié **sans schémas ni chemins** | rouge | ✅ la garde de **non-vacuité** — sans elle, tout le fichier deviendrait vacant le jour où le document ne se construit plus |

### ⑤ Portes

| | `balance-service` |
|---|---|
| Lint / build | ✅ 0 / ✅ |
| Unitaires | ✅ **2942** / 171 suites |
| e2e | ✅ **671** / 26 suites |
| Couverture | **98,97 / 91,81 / 98,16 / 99,06** |

⚠️ **`collectCoverageFrom` exclut les `*.dto.ts`** : les décorateurs corrigés sont **invisibles aux
seuils**. Revenir en arrière ne ferait bouger aucun chiffre — `test/openapi-contract.e2e-spec.ts` est
la seule chose qui empêche la récidive.

### ⑥ Vérification docker + **CA-5 prouvé pour de vrai**, pas par équivalence

Stack docker, `docker restart` du service, document lu sur `/api/docs-json` du service **vivant** :

| Mesure | Résultat |
|---|---|
| Schémas publiés / chemins | **215** / **78** |
| `object` **opaques** | ⚡ **0** *(CA-3)* |
| Les 13 montants de la story | **13/13** publient `"type": "number"` *(CA-1)* |
| Nouveaux `$ref` publiés | `ReferentielRefDto`, `PaquetFiscalRefDto`, `EffectiveReferentielStampDto`, `EffectifPaquetFiscalStampDto` |

⚡ **CA-5 — la génération client a été RÉELLEMENT exécutée.** Le dépôt frontend de FE-055 n'est pas
cloné, mais `frontend-admin-panel` embarque `openapi-typescript@7.13.0` : le client a donc été généré
depuis le document du service vivant, avec le générateur exact que la DoD nomme.

| Mesure sur le client généré | Résultat |
|---|---|
| `Record<string, never>` | **2**, et ce sont **exactement les deux tolérés** : `webhooks` et `$defs` |
| `EtatRapprochementResponseDto.soldeReleve` | `number \| null` — **on peut calculer et formater** |
| `PropositionAxeDto.valeur` | `"SN" \| "SMT" \| "REEL" \| "SYNTHETIQUE"` |
| `ChampProposeDto.valeur` | `string \| number \| boolean` |

Stack arrêtée (`docker compose stop`).


### ⑦ Revue de code — 2 constats, et le second s'est **retourné contre la revue**

| # | Constat | Traitement |
|---|---|---|
| **R1** | L'`oneOf` de la valeur OCR est **asymétrique** : `array` uniquement dans le sens de l'**écriture** | **Vérifié, c'est justifié** — le cabinet peut corriger un champ structuré (`actionnaires`), mais en sortie la valeur ne vient que de l'OCR, qui « rend du texte » *(docstring de `proposition-profil.schema.ts`)*, et `appliquer` **lit** la proposition pour écrire le profil : il ne la réécrit jamais. Documenté pour que l'asymétrie ne se lise pas comme un oubli |
| **R2** | La garde de non-vacuité était à **`> 50`** pour **215** schémas et **78** chemins réels : la **moitié** des contrôleurs pouvait disparaître sans que rien ne rougisse | **Corrigé** — resserré à 180 / 70 |

⚠️⚠️ **ET C'EST LÀ QUE LE PIÈGE DE STORY-373 A FRAPPÉ.** Le premier correctif de R2
**n'a jamais été appliqué** : le motif de remplacement ne matchait plus après le reformat de prettier,
le script a échoué **en silence**, et la mutation de vérification *(100 schémas sur 215)* s'est lue
**verte**. J'allais consigner un correctif inexistant, et la « preuve » aurait dit l'inverse de la
réalité.

⇒ **Ce qui a levé le doute** : le chiffre. `SCHEMAS= 100` avec un test vert était **impossible** si le
seuil valait 180 — donc le seuil ne valait pas 180. Un `assert` sur le motif, puis la mutation
**rejouée** (`Received: 100`, rouge), l'ont confirmé.

⇒ **RÈGLE** : un script de correctif **sans `assert` sur son motif** ne dit pas s'il a corrigé quoi que
ce soit. Et une mutation **verte** peut prouver l'**inverse** de ce qu'on croit — il faut lire ce que le
test **mesure**, pas seulement sa couleur.

### ⑧ Revue de sécurité — **0 vulnérabilité**

| Piste | Pourquoi elle ne tient pas |
|---|---|
| Un champ **nouvellement servi** | Non : les seules lignes de propriété ajoutées appartiennent aux **classes de description** (`PaquetFiscalRefDto` & co). Les interfaces qu'elles décrivent étaient **déjà sérialisées** — `stamp`, `referentiel`, `paquetFiscal` sont des propriétés d'avant la story, `checksum` compris. Le contrat cesse de **taire** ce qui sortait déjà |
| Secret dans un `example` ou une `description` | Aucun *(balayage `secret\|password\|token\|jwt\|mongodb://\|api_key`)* |
| Le test qui monte 30 contrôleurs | Il vit dans `test/`, **hors du build** — `dist/test` n'existe pas |
| Swagger non authentifié, désormais plus détaillé | Antérieur à la story, et sans objet : les 4 schémas ajoutés décrivent le référentiel comptable et le paquet fiscal — aucune topologie interne, aucun secret |

### ⑨ Clôture

- **2026-08-24** — ✅ **CLÔTURÉE**. PR `prospera-balance-service#47` rebase-mergée sur `dev`, 2 commits
  (`185c3c9` feature, `05cfe4e` revue). Branche supprimée.
- ⚡ **Ce que cette story change vraiment** : les montants de `balance-service` **se calculent et se
  formatent** côté client. La troisième occurrence du défaut est aussi la première à laisser derrière
  elle **la garde qui empêche la quatrième** — STORY-130 se disait « patron transposable » ; la
  transposition était le livrable, elle est faite.
- **Dette ouverte, transmise :**
  - ⚠️ **STORY-389 est partiellement refermée** : ses deux champs (`mappingPropose`,
    `mappingColonnes`) publient désormais `MappingColonnesDto`. Ce qu'elle porte encore doit être
    re-vérifié avant de la tirer.
  - ⚠️ Le CA-5 a été prouvé avec l'`openapi-typescript@7.13.0` de **`frontend-admin-panel`**, pas avec
    celui de `prospera-frontend-expert-comptable` *(non cloné)* : même outil, même version majeure, mais
    la commande `npm run gen:api -- balance` du dépôt cible reste à rejouer par la story front.
  - ⚠️ **Le plugin Swagger n'est pas activé** *(décision actée, motivée dans `main.ts`)* : c'est
    `test/openapi-contract.e2e-spec.ts` qui tient la non-récidive. Le jour où on l'activera, c'est lui
    qui dira si le document s'en trouve amélioré ou abîmé.
