# STORY-064 : Cycle de vie brouillon → validé (l'humain valide ; gate sur contrôles bloquants) — FR-014

**Epic :** EPIC-012 — Validation, clôture & immutabilité (snapshot figé) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-014 (Cycle de vie brouillon → validé) ; NFR-003 (exactitude/reproductibilité) ; NFR-004 (immutabilité & traçabilité — invariant programme : l'automatisation **propose**, l'humain **valide**)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` (relying party, gate `@RequiresBilanAccess`, isolation `orgId`, invariant P7) ; CLAUDE.md §Definition of Done, §Garde-fous (anti-énumération → 404 inter-org, `E11000` générique)
**Réf. code livré :** **STORY-063** (`ControlesCoherenceProductionService` + `BilanEngineService.produireControlesCoherence` → batterie d'articulation + **drapeau `valide`** = tous les contrôles **BLOQUANT** OK ; c'est le gate de validation que 064 **applique**) · **STORY-058** (`MappingOverride` — patron d'agrégat **persisté tenant-scoped** : schéma `@Schema({timestamps})`, `TenantScopedRepository`, workflow d'états `PROPOSED→VALIDATED`, index unique partiel, mapping `E11000`→générique) · **STORY-059→062/110→114** (`BilanEngineService.produire*` — liasse produite sur soldes fournis)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + auto-revue + intégrée dans `dev` le 2026-07-21 — PR #20 bilan-service, MNV-064 « Rebase and merge », HEAD `2fd71b2`, branche supprimée)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 14

---

## User Story

**En tant que** cabinet comptable produisant sa liasse OHADA dans `bilan-service`,
**je veux** conserver un **jeu d'états** à l'état **BROUILLON** (recalculable à volonté) puis le **valider par un acte humain explicite** — la validation n'étant **acceptée que si les contrôles bloquants passent** (équilibre actif=passif, cohérence du résultat…), et **enregistrant** qui valide et quand,
**afin que** l'automatisation (mapping, calcul) ne fasse que **proposer** un brouillon corrigeable, sans **jamais** valider à ma place (invariant programme), et qu'une liasse **validée** cesse d'être recalculable — socle de l'immutabilité (STORY-065) et de la piste d'audit (STORY-067).

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

Jusqu'ici `bilan-service` **ne persiste rien** : la liasse (Bilan/CR/TFT/notes/contrôles) est produite en **dry-run** sur des soldes fournis dans le corps (`BilanDiagnosticsController`, endpoints `*/dry-run`, `200`, aucune écriture). EPIC-012 ouvre la **persistance** : STORY-064 introduit le premier agrégat persisté — le **jeu d'états** (`JeuEtats`) — et sa **machine à deux états** `BROUILLON → VALIDÉ`, gardée par le **drapeau `valide`** déjà calculé par STORY-063.

**Invariant programme (NFR-004) matérialisé ici** : *l'automatisation propose, l'humain valide*. Le calcul produit un **BROUILLON** ; la **validation** est un endpoint distinct, déclenché explicitement par un utilisateur, et **jamais** un effet de bord du calcul.

### La machine à états (périmètre 064)

```
           POST /bilan/etats                 POST /bilan/etats/:id/valider
   (soldes) ───────────────► BROUILLON ─────────────────────────────────► VALIDÉ
                                 ▲   │                (gate : controles.valide === true)
             POST /:id/recalculer│   │ (soldes figés à la validation)
                    (maj soldes) └───┘        VALIDÉ ⇒ recalcul refusé (409)
```

- **BROUILLON** : les **soldes source** sont stockés ; la liasse est **recalculable** — `GET /:id` la **produit à la volée** via `BilanEngineService` (états courants du référentiel effectif de l'org), et `POST /:id/recalculer` **remplace** les soldes puis re-produit. Rien n'est figé.
- **Validation** (`POST /:id/valider`) : acte **humain**. Le service produit la **batterie de contrôles** (STORY-063) sur les soldes stockés et **exige `valide === true`** (tous les contrôles **BLOQUANT** OK). Sinon → **422** `LIASSE_NON_VALIDABLE` avec la liste des anomalies bloquantes (aucune transition). Si OK → statut `VALIDÉ`, **`validePar`** (userId du JWT) + **`valideAt`** (horodatage) enregistrés, soldes **figés**.
- **VALIDÉ** : **non recalculable** — `POST /:id/recalculer` et `POST /:id/valider` répondent **409** `JEU_VALIDE_NON_RECALCULABLE` / `JEU_DEJA_VALIDE`. La liasse reste **reproductible** (mêmes soldes figés + même référentiel + même moteur ⇒ mêmes états, NFR-003).

### Frontière nette avec STORY-065 (immutabilité & versions)

064 **ne** livre **pas** le snapshot append-only versionné ni la ré-ouverture pour correction. Le « figé » de 064 = les **soldes source verrouillés** dans le doc `JeuEtats` (l'état VALIDÉ n'est plus mutable via l'API) — pas une collection de snapshots immuables. STORY-065 (FR-015) transforme ce verrou en **snapshot immuable, append-only, versionné** (états produits + provenance : balance source, référentiel code+version, version de code du moteur, validateur, horodatage) et gère **correction → nouvelle version, historique conservé**. 064 pose les **hooks documentés** (champ `checksum`/`referentiel` capturés à la validation, méthode d'écriture isolée) pour que 065 s'y greffe sans réécrire la machine à états.

### Provenance & exercice

- L'**exercice** est ici un **libellé/identifiant fourni** (`exercice: string`, ex. `"2025"`). La **gestion réelle des exercices** (dates, ouvert/clos, un seul jeu validé courant, chaînage N/N-1) = **STORY-066** (FR-016). 064 stocke le libellé tel quel (hook inerte : aucune unicité imposée à ce stade).
- À la **création** et à la **validation**, on capture le **référentiel effectif** (`{code, version}`) et le **checksum** du paquet (`resolveReferentielForOrg`) — traçabilité de reproductibilité, réutilisée par 065.

### Isolation & anti-énumération

Agrégat **tenant-scoped** via `TenantScopedRepository` (fail-closed : `{ tenantId }` fusionné/forcé). Tout `:id` inexistant **ou** appartenant à une autre org → **404 générique** (jamais 403, jamais de fuite — CLAUDE.md §Garde-fous). Gate d'accès `@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)` sur tous les endpoints (données financières sensibles, NFR-001).

---

## Scope

**Dans le périmètre :**

- **Schéma persisté** `JeuEtats` (collection `jeux_etats`) : `tenantId`, `exercice` (string), `soldesN`, `soldesN1?`, `referentiel {code,version}`, `checksum`, `statut` (`BROUILLON|VALIDE`), `validePar?`, `valideAt?`, timestamps. Enum `JeuEtatsStatut`.
- **`JeuEtatsRepository`** héritant de `TenantScopedRepository` (création `{tenantId}` forcé, lecture par `_id` scoping tenant, mise à jour gardée par statut).
- **`JeuEtatsService`** : `creerBrouillon`, `recalculer` (garde BROUILLON), `valider` (gate `controles.valide`, attribution), `consulter` (produit la liasse à la volée pour un BROUILLON ; renvoie soldes figés + méta pour un VALIDÉ). Réutilise `BilanEngineService.produire*`.
- **`JeuEtatsController`** (`/bilan/etats`) : `POST /` (créer brouillon, 201), `GET /:id` (consulter), `POST /:id/recalculer` (200), `POST /:id/valider` (200). DTOs entrée/sortie + Swagger.
- **Câblage** dans `BilanModule` (schéma `forFeature`, providers, contrôleur).
- **Tests** unitaires (service : create/recalculer/valider gate pass+fail/anti-énum ; controller ; repository si logique propre) + **e2e** (contrat HTTP, couche données mockée) + non-régression dry-run (059→063 inchangés). Vérification **docker réelle** (persistance + transitions + gate + isolation).

**Hors périmètre (frontières nettes) :**

- **Snapshot immuable append-only + versions + ré-ouverture** → STORY-065 (FR-015).
- **Exercices (dates, ouvert/clos, un seul validé courant, N/N-1)** → STORY-066 (FR-016).
- **Piste d'audit** (journal des actions) → STORY-067 (FR-017).
- **Consumer balance réel** (`balance.created`) : les soldes restent **fournis** (le moteur se prouve en dry-run, comme 059→063) — interop aval.
- **Export PDF/Excel** → EPIC-014.

---

## Critères d'acceptation

- [ ] `POST /bilan/etats` (corps : `exercice`, `soldesN`, `soldesN1?`) crée un jeu **BROUILLON** keyé `orgId`, capture `referentiel`+`checksum` effectifs, renvoie **201** avec l'`id` et le statut.
- [ ] `GET /bilan/etats/:id` d'un BROUILLON **produit la liasse à la volée** (Bilan/CR/TFT/notes/contrôles) + le drapeau `valide` courant ; d'un VALIDÉ, renvoie la liasse produite sur les soldes **figés** + `validePar`/`valideAt`.
- [ ] `POST /bilan/etats/:id/recalculer` sur un **BROUILLON** remplace les soldes et re-produit (**200**) ; sur un **VALIDÉ** → **409** `JEU_VALIDE_NON_RECALCULABLE`.
- [ ] `POST /bilan/etats/:id/valider` **exige** `controles.valide === true` : si un contrôle **BLOQUANT** échoue → **422** `LIASSE_NON_VALIDABLE` (+ anomalies), **aucune** transition ; sinon statut → **VALIDÉ**, `validePar` (userId JWT) + `valideAt` enregistrés (**200**).
- [ ] Un jeu déjà **VALIDÉ** re-validé → **409** `JEU_DEJA_VALIDE` (idempotence défensive, pas de re-signature).
- [ ] L'**automatisation ne valide jamais** : `creerBrouillon`/`recalculer` ne posent **jamais** `statut=VALIDE` (invariant testé).
- [ ] **Isolation** : un `:id` d'une autre org (ou inexistant) → **404 générique** (jamais 403/500, pas de fuite d'existence).
- [ ] Tous les endpoints derrière `@RequiresBilanAccess` + `@Roles` : gate refusé → **403 `{code}`** ; sans jeton → **401**.
- [ ] **Non-régression** : les endpoints `*/dry-run` (059→063) restent **200** et inchangés.

---

## Notes techniques

### Composants

- **Nouveau dossier** `src/modules/bilan/jeu-etats/` : `jeu-etats.enums.ts` (`JeuEtatsStatut`), `jeu-etats.schema.ts`, `jeu-etats.repository.ts`, `jeu-etats.service.ts`, `jeu-etats.controller.ts`, `jeu-etats.errors.ts`, `dto/` (create + response).
- **Réutilise** `BilanEngineService.produireControlesCoherence` (drapeau `valide`) + `produireBilan`/`CompteResultat`/`Tft`/`NotesAnnexes` pour la consultation. **Aucune** logique comptable dupliquée.
- **Câblage** `BilanModule` : `MongooseModule.forFeature([{ JeuEtats }])`, providers `JeuEtatsRepository`+`JeuEtatsService`, contrôleur `JeuEtatsController`.

### Schéma (esquisse)

```ts
@Schema({ timestamps: true, collection: 'jeux_etats' })
class JeuEtats {
  @Prop({ type: Types.ObjectId, required: true }) tenantId: Types.ObjectId;
  @Prop({ required: true }) exercice: string;             // libellé (066 : entité Exercice)
  @Prop({ type: [LigneSoldeSchema], required: true }) soldesN: LigneSolde[];
  @Prop({ type: [LigneSoldeSchema], default: null }) soldesN1?: LigneSolde[] | null;
  @Prop({ type: Object, required: true }) referentiel: { code: string; version: string };
  @Prop({ required: true }) checksum: string;
  @Prop({ enum: JeuEtatsStatut, default: JeuEtatsStatut.BROUILLON }) statut: JeuEtatsStatut;
  @Prop({ type: Types.ObjectId, default: null }) validePar?: Types.ObjectId | null;
  @Prop({ type: Date, default: null }) valideAt?: Date | null;
}
```

### Sécurité & transactions

- **Écritures mono-document** (création = 1 insert ; validation/recalcul = 1 update) → **pas** de transaction Mongo requise (règle `transactions-mongo.md` : ≥ 2 documents). Le passage à VALIDÉ (065, snapshot + doc) sera transactionnel — **hook documenté**.
- `valider` : re-produire les contrôles côté serveur (ne **jamais** faire confiance à un `valide` fourni par le client). Transition via `updateOne({_id, tenantId, statut: BROUILLON}, ...)` — la garde de statut dans le filtre évite la course concurrente (double validation).
- **404 générique** pour tout accès hors tenant (le `TenantScopedRepository` fusionne `{tenantId}` ; un `findById` qui ne matche pas → `NotFoundException` générique).

### Cas limites

- `soldesN` vide / bornes montants → réutiliser la validation DTO existante (`BilanDryRunRequestDto` comme référence) ; `MontantHorsBornesError` → 400 (patron du contrôleur existant).
- Recalcul concurrent d'un même brouillon : dernière écriture gagne (acceptable ; l'immutabilité arrive en 065).
- Validation d'un jeu dont le référentiel a changé depuis la création : on re-résout le référentiel effectif **au moment de la validation** et on recapture `checksum` (traçabilité 065).

---

## Dépendances

**Prérequis :**
- **STORY-063** (drapeau `valide` + batterie de contrôles) — livré ✅.
- **STORY-058** (patron agrégat persisté tenant-scoped) — livré ✅.
- **EPIC-008** (gate `@RequiresBilanAccess`, `TenantScopedRepository`, read-models) — livré ✅.

**Débloque :**
- **STORY-065** (snapshot immuable append-only + versions) — greffe la transition VALIDÉ sur un snapshot.
- **STORY-067** (audit) — journalise `valider`/`recalculer`.
- **STORY-068** (prévisionnel) — base = jeu **validé**.

---

## Definition of Done

- [ ] Lint 0 warning (`eslint --max-warnings 0`) · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (seuils projet, jamais baissés).
- [ ] Unitaires + e2e verts ; non-régression 059→063.
- [ ] Endpoints documentés dans Swagger (`/api/docs`).
- [ ] **Vérification docker réelle** consignée dans *Progress Tracking* : création d'un brouillon (doc réel en base), recalcul, validation gate PASS (équilibrée → VALIDÉ, `validePar`/`valideAt` en base) et FAIL (déséquilibrée → 422, aucune transition), VALIDÉ non recalculable (409), isolation inter-org (404), gate 403/401.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.
- [ ] Flux git : branche `MNV-064` sur `dev`, PR `MNV-064(bilan): …`, `/code-review`, « Rebase and merge », branche supprimée.

---

## Story Points Breakdown

- **Backend** (schéma + repo + service machine à états + gate) : 2 pts
- **Contrôleur + DTOs + Swagger** : 0,5 pt
- **Tests (unit + e2e) + vérif docker** : 0,5 pt
- **Total : 3 pts**

**Rationale :** Machine à deux états simple, gate déjà calculé (063), patron d'agrégat persisté déjà éprouvé (058). Écritures mono-document (pas de transaction). Le gros du calcul est réutilisé du moteur existant.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (Scrum Master).
- 2026-07-21 : Développée (Developer) — agrégat `JeuEtats` + machine BROUILLON→VALIDÉ + gate `valide` (063). Livrée et intégrée dans `dev` (PR #20, MNV-064, rebase-merge, HEAD `2fd71b2`).

**Réalisé :**
- **Contrat/moteur** : `BilanEngineService.produireLiasseComplete` (Bilan+CR+cohérence+TFT+notes+contrôles en **une** résolution du référentiel effectif ; réutilisé par consultation + validation). Aucune règle comptable dupliquée.
- **Persistance** : `JeuEtats` (collection `jeux_etats`, tenant-scoped) + `JeuEtatsRepository` (hérite `TenantScopedRepository` + `majSiBrouillon` = transition **gardée par statut**, course concurrente fermée).
- **Service** : `creerBrouillon` (produit la liasse **avant** de persister → agrégation hors bornes échoue sans écriture ; statut toujours BROUILLON), `consulter` (liasse à la volée, 404 anti-énum), `recalculer` (garde BROUILLON, 409 si VALIDÉ), `valider` (acte humain, gate `controles.valide`, 422 `LIASSE_NON_VALIDABLE` + anomalies bloquantes dans `message[]`, sinon VALIDÉ + `validePar`/`valideAt`), `lister`.
- **Contrôleur** `/bilan/etats` (POST créer / GET lister / GET :id / POST :id/recalculer / POST :id/valider) — `@RequiresBilanAccess` + `@Roles`, `MontantHorsBornesError`→400, erreurs référentiel→mapper.
- **Décision de conception** : les anomalies bloquantes du 422 sont portées par `message: string[]` (le filtre global `AllExceptionsFilter` supprime tout champ hors enveloppe `{statusCode,error,message,code}` — un champ `anomalies` custom n'atteindrait jamais le client).
- **Hooks 065** : `referentiel`+`checksum` capturés à la création **et** re-capturés à la validation ; écriture de transition isolée (`majSiBrouillon`) — prêts pour le snapshot immuable versionné.

**Qualité (DoD) :** lint 0 warning · `npm run build` OK · **394 unit + 81 e2e** verts · couverture `jeu-etats` **98.5 / 96.8 / 100 / 98.4**, `bilan-engine` **100 %**, globale 98.3/92.4/98.6/98.3 (> 65/90/90/90) · non-régression `*/dry-run` 059→063 / 110→114 (200 inchangés) · Swagger documenté.

**Vérification docker réelle (obligatoire — persistance & atomicité) :** stack neuve (`down -v` ; mongo `rs0` healthy, kafka up), org réelle `6a5ec161…` (register auth → e-mail vérifié → login RS256, JWT `emailVerified=true`/`TENANT_ADMIN`), read-models semés (`orgkycstatuses` APPROVED, `orgbilanentitlements` ACTIVE + `syscohada-revise@2.1`).
- **Création** `POST /bilan/etats` (balance équilibrée) → **201**, `valide=true`, checksum `01b892c0`. Doc réel `jeux_etats` : statut `BROUILLON`, `tenantId` = org, `checksum`, 7 soldes, `validePar=null`.
- **Consulter** `GET :id` → 200 · **recalculer** (BROUILLON) → 200.
- **Valider** (gate **PASS**) → **200** `VALIDE`, `validePar`=userId + `valideAt` horodaté. Doc réel `jeux_etats` : statut `VALIDE`, `validePar`/`valideAt` **persistés**.
- **Valider** (gate **FAIL**, balance déséquilibrée écart 100 000) → **422** `LIASSE_NON_VALIDABLE` (`message`=[`EQUILIBRE_BILAN : ANOMALIE (écart 100000)`]) ; le jeu reste **BROUILLON** (aucune transition, vérifié en base).
- **VALIDÉ non recalculable** : `POST :id/recalculer` → **409** `JEU_VALIDE_NON_RECALCULABLE`.
- **Isolation** : jeu inséré pour une **autre** org, lu avec mon jeton → **404** `JEU_ETATS_INTROUVABLE` (cloisonnement `TenantScopedRepository`) ; id inexistant → 404.
- **Gate** : entitlement `REVOKED` → **403** ; sans jeton → **401**.

**Actual Effort :** ~3 pts (conforme).
