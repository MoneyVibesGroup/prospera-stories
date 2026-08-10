# STORY-292 : `balance-service` — le référentiel **CIMA** est attribuable par la console mais inconnu de la balance : l'ajouter au manifeste **et au contrat canonique**

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § NFR-A06 (piloté par données) · **STORY-078** (registre + résolution) · **STORY-101** (contrat canonique de balance) · **STORY-122** (paquet CIMA livré côté `bilan-service`) · **STORY-147** (précédent de changement du contrat)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** review
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-08-07
**Sprint :** 20
**Service :** `balance-service` (:3007)
**Branche :** `MNV-292`
**Origine :** `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ① — ouvert par la maquette **FE-056**

---

## Le défaut, en une phrase

La console **peut attribuer** `cima-assurances@1.0` à une organisation (pack vertical Assurance,
AP-06) ; `balance-service` **ne sait pas le charger** ; l'organisation reçoit un
**`500 REFERENTIEL_UNAVAILABLE`** dès qu'elle touche à une balance.

## Pourquoi ce n'est pas une copie de fichier

L'artefact **existe déjà** et il est **validé** : STORY-122 l'a livré puis corrigé côté `bilan-service`
(done le 2026-07-27), checksum `7e644ab171cc9da261e951ace1be0f9614ee451232d278d47758859813c3bd4e`.
La décision **D-078-2** est claire : *un artefact = un checksum = un contenu*, les octets de
`balance-service` sont **ceux de `bilan-service`**, et `referentiel-assets-coherence.spec.ts` casse la CI
à la moindre dérive. La copie est donc mécanique.

**Le point dur est ailleurs — c'est le contrat canonique de la balance :**

```ts
// balance/types/balance-canonique.ts
export const REFERENTIELS_BALANCE = ['SN', 'SMT', 'SFD-BCEAO'] as const;
export type ReferentielBalance = (typeof REFERENTIELS_BALANCE)[number];
```

`BalanceCanonique.referentiel` est typé dessus, et le pont `PONT_TAG` du registre est **exhaustif par
construction** (`Record<ReferentielBalance, ReferentielRef>` : TypeScript refuse de compiler si un tag
n'est pas résolu). Ajouter `CIMA` **étend l'énumération publique** : DTO, Swagger, validateurs `@IsIn`,
et **types générés côté front**. C'est une extension additive — aucune balance existante ne change de
valeur, donc **aucune migration** — mais elle traverse le contrat, et c'est ce qui vaut ses 5 points.

⚠️ **`@1.0` n'a jamais été attribué à une organisation** (STORY-122 le note explicitement, c'est ce qui
lui a permis de corriger le checksum en place). Il n'y a donc **aucune donnée à reprendre** : la story
est un ajout pur.

---

## Périmètre

1. **Asset** — copier `cima-assurances-1.0.json` depuis
   `bilan-service/src/modules/bilan/referentiel/assets/` vers
   `balance-service/src/modules/referentiel/assets/`, **octets identiques** (D-078-2).
2. **Manifeste** — une entrée dans `ReferentielRegistry`, `locator` + `checksum` **exactement** celui de
   `bilan-service`.
   ⚠️ **`longueurCompteDetail` : à OMETTRE tant que le niveau de détail du plan CIMA n'est pas
   sourcé.** STORY-146 avait délibérément laissé ce champ vide pour le SFD, et STORY-172 n'a pu le
   remplir qu'après avoir **trouvé la source** (RCSFD, pages 29-42) et **compté les comptes**. Inventer
   un chiffre par analogie avec SYSCOHADA rejouerait le défaut que 172 a corrigé. Champ omis ⇒ aucune
   exigence de niveau de détail, comportement identique au SFD d'avant 172.
3. **Contrat canonique** — ajouter le tag à `REFERENTIELS_BALANCE` et le résoudre dans `PONT_TAG`
   (`{ code: 'cima-assurances', version: '1.0' }`). Le nom du tag est à trancher dans la story
   (`CIMA` est le candidat évident ; il doit rester cohérent avec ce qu'expose `bilan-service`).
4. **Surface HTTP** — l'enum remonte au Swagger et aux DTO qui la citent (`AgregationApercuDto`,
   `SubmitBalanceDto`, les query d'état). Vérifier qu'aucun `@IsIn` littéral ne double l'énumération.
5. **Régénération des types front** — l'extension change `openapi.json`. Ouvrir le ticket frontend
   correspondant (ou l'adosser à FE-057 si elle n'est pas encore soldée).

### Hors périmètre

- **Le contenu comptable du plan CIMA** — il appartient à `bilan-service` (STORY-122) et reste à valider
  par un actuaire (AC-18 de 122, blocker métier non levé). Cette story **transporte** l'artefact, elle
  ne le juge pas.
- **Vie / Non-Vie, provisions techniques, C1..C25** — hors livraison de STORY-122, donc hors de celle-ci.
- **Le vertical Assurance côté console** (modules, offre) — objet du pack AP-06.
- **`smt-togo@1.0`** — son refus `409 REFERENTIEL_NON_PACKAGE` est **déjà correct** (constat ② du ticket).

---

## Critères d'acceptation

1. `cima-assurances@1.0` se **charge** : une organisation dont l'entitlement porte ce couple obtient une
   résolution normale, plus aucun `500 REFERENTIEL_UNAVAILABLE`.
2. Les **octets sont identiques** à ceux de `bilan-service` — prouvé par
   `referentiel-assets-coherence.spec.ts` étendu au nouvel artefact, checksum épinglé **hors** du
   registre (le piège du test tautologique relevé en revue de STORY-122).
3. `REFERENTIELS_BALANCE` porte le nouveau tag, `PONT_TAG` le résout, **et la compilation prouve
   l'exhaustivité** (mutation : retirer l'entrée du pont ⇒ build rouge).
4. Une balance soumise avec ce tag est **acceptée, stockée et relue** à l'identique ; le `checksum` de
   la balance reste stable (le tag entre dans le contenu métier haché).
5. **Aucune balance existante ne change** : `SN`, `SMT`, `SFD-BCEAO` inchangés, relecture des balances
   antérieures non affectée, **aucune migration**.
6. `POST /balances/suggest-comptes` sur une organisation CIMA rend des suggestions **du plan CIMA**, avec
   l'enveloppe `referentiel { code: 'cima-assurances', version: '1.0' }` et le checksum du paquet.
7. `longueurCompteDetail` **absent** du manifeste, et un commentaire dit **pourquoi** (non sourcé), avec
   le geste attendu le jour où la source existera.
8. Swagger à jour ; `openapi.json` régénéré ; ticket frontend de régénération des types ouvert.
9. `lint` 0 warning · `build` OK · couverture du dossier touché 100/100/100/100 · non-régression.

## Vérification docker (DoD)

- Deux organisations fraîches, JWT RS256 réel : l'une `syscohada-revise@2.1`, l'autre
  `cima-assurances@1.0`.
- Sur la seconde : suggestion → comptes **du plan CIMA** ; soumission de balance → 201 ; relecture →
  tag CIMA conservé ; re-soumission identique → 200 idempotent.
- Sur la première : **non-régression stricte**, aucune valeur ne bouge.
- Cas négatif conservé : une organisation portant un code **toujours** hors manifeste continue de rendre
  `500 REFERENTIEL_UNAVAILABLE` — la lacune reste **bruyante**, on ne la remplace pas par un défaut
  silencieux.

## Liens

- Ticket d'origine : `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ①
- `GAP-cima-non-servi-par-balance` (`sprint-status.yaml` → `open_contract_gaps`)
- Maquette **FE-056** — l'écran rend déjà ce refus et nomme le contrat manquant ; à la livraison de cette
  story, l'encart « À livrer côté backend » disparaît pour le vertical Assurance.

---

## Progress Tracking

**Branche :** `MNV-292` (`balance-service`, base `dev`) · **Statut :** review (2026-08-10)

### Livré

1. **Asset** — `cima-assurances-1.0.json` copié octet pour octet depuis `bilan-service`
   (sha256 `7e644ab171cc9da261e951ace1be0f9614ee451232d278d47758859813c3bd4e`, vérifié par
   `diff` + `sha256sum` avant tout commit).
2. **Manifeste** (`ReferentielRegistry`) — entrée `cima-assurances@1.0` (locator + checksum),
   `longueurCompteDetail` **omis** (commentaire explicite : non sourcé pour CIMA, cf. §Périmètre).
3. **Contrat canonique** — `REFERENTIELS_BALANCE = ['SN', 'SMT', 'SFD-BCEAO', 'CIMA']`, `PONT_TAG.CIMA`
   ajouté (`{ code: 'cima-assurances', version: '1.0' }`), exhaustivité prouvée par compilation
   **et** par test (`referentiel-registry.spec.ts`).
4. **Surface HTTP** — aucun `@IsIn` littéral ne double l'énumération (grep vérifié) ; tous les DTO
   (`submit-balance.dto.ts`, `balance-response.dto.ts`, `rejet-response.dto.ts`,
   `agregation.dto.ts`) dérivent leur Swagger `enum` de `REFERENTIELS_BALANCE` — CIMA y apparaît
   sans modification de ces fichiers.
5. **Régénération des types front** — ticket ouvert : voir §Ticket frontend ci-dessous.

### ⚠️ Angle mort trouvé en cours de dev (absent du cadrage)

`COMPTES_REPRISE` (`reprise.regles.ts`, STORY-087 — reprise d'à-nouveaux) est un **second**
`Record<ReferentielBalance, ComptesReprise>` **exhaustif par construction**, distinct de `PONT_TAG`
et non mentionné par la story. Ajouter `CIMA` à `REFERENTIELS_BALANCE` casse la compilation tant que
cette table n'a pas d'entrée `CIMA` — ce n'est pas optionnel, TypeScript refuse `nest build`.

Le plan CIMA n'isole **aucun** compte de classe 1 dédié au résultat net (`13` y désigne les
« Réserves réglementaires », pas le résultat, contrairement à SYSCOHADA) ; le résultat semble plutôt
vivre en classe 8 (`88` « Résultats en instance d'affectation »), mais le trancher sans validation
actuarielle aurait rejoué **exactement** le défaut que 172 a fermé pour `longueurCompteDetail`
(inventer une donnée comptable par analogie).

**Décision prise (même patron que `nonPackage` du manifeste)** : `COMPTES_REPRISE` porte un type
`EntreeComptesReprise = ComptesReprise | { nonSource: string }` ; CIMA y est `nonSource`. Le nouveau
résolveur `comptesRepriseSources()` (pur, aucune I/O) renvoie `null` pour CIMA ; `RepriseService`
traduit `null` en `ComptesRepriseNonSourcesException` (409, code `COMPTES_REPRISE_NON_SOURCES`) aux
deux points d'appel (`genererANouveaux`, `affecterResultat`). La reprise d'à-nouveaux CIMA est donc
**refusée explicitement**, jamais un socle silencieusement faux — testé unitairement (refus + valeur
`null`) et en intégration service (deux tests dédiés, un par point d'appel).

### Qualité

- `eslint --max-warnings 0` : 0 warning (après `--fix`, uniquement du formatage prettier).
- `nest build` : OK.
- `test:cov` : **148 suites / 2675 tests**, tous verts. Couverture des fichiers touchés : 100 %
  lignes/fonctions/statements sur `referentiel-registry.ts`, `balance-canonique.ts`,
  `reprise.exceptions.ts` ; `reprise.regles.ts` et `reprise.service.ts` à 100 % lignes (les deux
  branches non couvertes — L338 du comparateur de tri, L464 du `catch` générique de
  `chargerReferentiel` — sont **antérieures** à cette story, hors diff).
- `test:e2e` : **25 suites / 552 tests**, tous verts, dont les ajouts CIMA (`referentiel.e2e-spec.ts`,
  `suggestion.e2e-spec.ts`).

### Vérification docker (DoD) — 2026-08-10, stack `docker compose` à la racine (via Portly/PROSPERA/compose)

Deux organisations fraîches enregistrées via l'IdP réel (`POST /auth/register` + `cabinetName`,
e-mail vérifié en base, JWT RS256 obtenu par `POST /auth/login`), KYC `APPROVED` et entitlement
`ACTIVE` seedés directement dans les read-models `balance_service.orgkycstatuses` /
`orgbalanceentitlements` (collections **pluriel Mongoose**, pas snake_case — piège connu).

| Org | `organizationId` | `referentiel` seedé |
|---|---|---|
| CIMA | `6a7a44a6bae839101487bd61` | `{ code: 'cima-assurances', version: '1.0' }` |
| SN | `6a7a44a6bae839101487bd73` | `{ code: 'syscohada-revise', version: '2.1' }` |

**Org CIMA :**
- `GET /referentiels/actifs` → **200**, `referentiel:{code:'cima-assurances',version:'1.0'}`,
  `checksum` = celui du manifeste, `integrity:'verified'`, `planCount:80` — **plus de 500
  REFERENTIEL_UNAVAILABLE**.
- `POST /balances/suggest-comptes` avec `"Frais de personnel dans le pays concerné"` → compte `61`,
  `origine:EXACT` — **le plan CIMA**, ni `66` (SYSCOHADA) ni `64` (SFD-BCEAO).
- `POST /balances` (référentiel `CIMA`, 2 lignes équilibrées, checksum v2 calculé côté script de
  vérif) → **201**, document réel confirmé par `mongosh` (`db.balances.findOne(...)`) : `referentiel:
  'CIMA'`, `checksumVersion:'v2'`, un seul document en base.
- Re-soumission **identique** → **200** (idempotence HTTP **et** un seul document en base après
  re-soumission — pas de doublon).
- `GET /balances/:id` → tag `CIMA` conservé à l'identique.

**Org SN — non-régression stricte :**
- `GET /referentiels/actifs` → `checksum` **inchangé** (`01b892c0…`), `planCount:174`.
- `POST /balances` (référentiel `SN`) → **201**, valeurs inchangées.

**Cas négatif conservé :** entitlement CIMA basculé en base vers un code hors manifeste
(`referentiel-fantome@0.0`) → `GET /referentiels/actifs` → **500 REFERENTIEL_UNAVAILABLE** — la
lacune reste **bruyante**, aucun défaut silencieux introduit.

Stack arrêtée (`docker compose stop`) après vérification, conformément à la convention du projet.

### Ticket frontend ouvert

`docs/tickets/TICKET-FRONTEND-regeneration-types-cima-story-292.md` — régénération des types
générés depuis `openapi.json` (nouveau tag `CIMA` dans l'enum `ReferentielBalance`).

### ⑥ Revue de code — 5 constats, 4 corrigés, 1 tracé

Scan via `prospera-code-review` ; **synthèse, filtrage et correctifs en session `opus`** (bascule
demandée et faite avant traitement, conformément au garde-fou du projet). Correctifs dans un commit
**dédié** (`MNV-292(revue)`), séparé du commit de feature.

**① BLOQUANT — la garde CIMA était INATTEIGNABLE.** Placée *après* `comptesGestionOuverts`, elle ne
pouvait jamais s'exécuter sur une balance CIMA réelle : le résultat CIMA vit en `88` (**classe 8**),
que `comptesGestionOuverts` compte parmi les comptes hors bilan « encore ouverts ». Le cabinet
recevait donc `RESULTAT_NON_DETERMINE` — *« soldez les classes 6 et 7 »* — un conseil **impossible à
suivre** (il n'y a rien à solder), qui l'accuse d'une faute inexistante et masque la vraie cause.
C'est le motif « refus loin de la cause, cause jamais nommée » que STORY-172 a corrigé ailleurs.
La garde ne dépend que du référentiel ⇒ **déplacée avant**. **Vérifié empiriquement** (`88` et classe
`0` déclenchent bien `comptesGestionOuverts`) puis **mutation-testé** : ordre remis à l'ancien ⇒ test
**rouge** sur `Received: "RESULTAT_NON_DETERMINE"`.

**② La fixture du test CIMA était une balance SYSCOHADA** (résultat en `13`, gestion à zéro) : elle
ne franchissait la garde que dans le **seul cas inobservable en production** et restait **verte**
alors même que la garde était morte — le motif de fausse assurance de STORY-094, reproduit dans les
tests de cette story. Remplacée par une **vraie clôture CIMA** (résultat en `88`, classe `0`
présente). C'est ce qui donne au test son pouvoir de détection, prouvé par la mutation ci-dessus.

**③ Le motif `nonSource` était une donnée morte** — écrit dans la table, lu par personne : seul
`'nonSource' in entree` était évalué, le texte n'atteignait jamais l'appelant. Il est désormais
**porté par le type de retour** (`ResolutionComptesReprise`, donc impossible à oublier côté appelant)
et transite par **`details`** — jamais à la racine, qu'`AllExceptionsFilter` jetterait par liste
blanche (piège déjà payé par `AffectationIncompleteException`).

**④ TRACÉ, NON CORRIGÉ — `CLASSES_DE_GESTION` ment pour CIMA.** Voir la section dédiée ci-dessous.

**⑤ Assertion d'exhaustivité sans pouvoir de détection** : `not.toBeUndefined()` ne pouvait jamais
échouer (la fonction rend un objet ou un refus, et le `Record` interdit déjà l'entrée manquante).
Elle exige maintenant **soit** 4 rôles numériques complets, **soit** un refus **motivé** — jamais un
entre-deux, qui produirait un socle partiellement affecté.

### ⑦ Revue de sécurité — aucune vulnérabilité

Scan via `prospera-security-review` (analyse en `opus`, jamais dégradée). **Zéro constat ≥ 80.**
Points vérifiés sur le code réel, pas seulement sur le patch :

- **Anti-énumération préservée** : le 409 est posé *après* les lectures tenant-scopées
  (`trouverDerniereValidee(orgId, …)`, `trouverSocleANouveaux(orgId, …)`), il n'est donc atteignable
  que par le propriétaire de la balance et ne crée aucun oracle d'existence inter-tenant.
  ⚠️ Le correctif ① **déplace** la garde CIMA — mais **en aval de ces deux lectures**, donc la
  propriété est conservée (revérifié après correctif).
- **Pas de pollution de prototype** : la clé d'indexation de `COMPTES_REPRISE` est verrouillée par
  `@IsIn(REFERENTIELS_BALANCE)`, l'`enum` du schéma Mongoose et le typage ; l'accès est en lecture
  seule. `__proto__`/`constructor` inatteignables.
- **Fail-closed** : le diff n'ajoute aucun chemin d'écriture, il insère un refus **avant** tout calcul
  et toute persistance (y compris en `dryRun`). Aucun contrôle existant relâché.
- **Artefact** : aucune URL, aucun identifiant, aucune donnée personnelle ; le sha256 épinglé est le
  **contrôle** anti-altération (haché et comparé **avant** `JSON.parse`, seul le vérifié est mis en
  cache). Aucun `eval`/`new Function`/`vm` dans `src/`.

### ⛔ Angle mort n° 2, TRACÉ et NON corrigé : `CLASSES_DE_GESTION` ment pour CIMA

`CLASSES_DE_GESTION = [6, 7, 8]` est documentée comme **structurelle**. L'admission tenait parce que
les deux référentiels servis jusqu'ici la vérifiaient — classe 8 de SYSCOHADA **entièrement** HAO
(`81`→`89`), et **aucune** classe 8 dans SFD-BCEAO. **CIMA est le premier à la casser** : sa classe 8
mêle gestion réelle (`80`, `82`→`86`) et **trois comptes de regroupement** — `87` Compte général de
pertes et profits, `88` Résultats en instance d'affectation, `89` Bilan.

⚡ **Mesuré** : sur une balance CIMA dont le résultat de 140 M est porté par `88`,
`calculerResultatComptable` rend **280 M** — résultat, donc **base imposable**, **exactement doublé**.
Et le garde-fou qui le pincerait est **inapplicable** : `resoudreCompteResultatNet(cima)` rend `null`,
donc `articulerResultat` sort `COMPTE_RESULTAT_NON_SOURCE` au lieu de signaler l'écart ⇒ **chiffre
faux publié sans aucun signal**.

**Pourquoi ce n'est pas corrigé ici** : la correction juste n'est *pas* d'arbitrer les classes dans le
`.ts` (retirer la classe 8 serait **faux pour SYSCOHADA**, D-091-3). Il faut que le **référentiel
déclare** ses classes de gestion ⇒ régénération d'artefact via le `build.mjs` de `bilan-service`
(**2 dépôts**, D-078-2) — exactement la même dette que `longueurCompteDetail`. Hors périmètre de 292,
qui *transporte* l'artefact et ne le *juge* pas (§ Hors périmètre).

🔒 **Risque latent, pas actif** : aucune organisation CIMA n'existe, le plan CIMA reste suspendu à
AC-18 (validation actuarielle, blocker non levé), et le provisionnement de STORY-094 **refuse déjà**
pour CIMA. C'est le résultat fiscal **en lecture** qui est muet.

➡️ **Hook inerte documenté** posé sur la constante (chiffres, mesure, renvoi au ticket) ·
`GAP-classes-de-gestion-non-sourcees` (`sprint-status.yaml`) ·
`tickets/TICKET-BACKEND-classes-de-gestion-non-sourcees-par-referentiel.md`.

### Qualité après correctifs de revue

Rejoués intégralement sur l'état final : `eslint --max-warnings 0` → **0 warning** · `nest build` →
**OK** · `test:cov` → **148 suites / 2675 tests** verts, **100 %** lignes/fonctions/statements sur
tous les fichiers touchés (`reprise.regles.ts`, `reprise.service.ts`, `reprise.exceptions.ts`,
`referentiel-registry.ts`, `balance-canonique.ts`, `fiscal.ts`) · `test:e2e` → **25 suites / 552
tests** verts.

⚠️ **Vérification docker non rejouée, et c'est justifié** : les correctifs de revue ne touchent ni
l'artefact, ni son checksum, ni aucun chemin vérifié en docker (résolution du référentiel,
suggestion, soumission, idempotence, non-régression, cas négatif). Ils portent sur la **reprise
d'à-nouveaux** — endpoint qui **ne faisait pas partie** de la vérification docker — sur des libellés
d'exception et sur des fixtures de test. Aucun résultat mesuré en ④ n'est invalidé.

### Reste à faire

- ⑧ Rebase-merge de la PR `balance-service#35` sur `dev`.
- ⑨ Clôture : statut `done` + `completed_date`, PR `docs/` sur `main`.
