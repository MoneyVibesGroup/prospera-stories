# STORY-681 : Un accusé consigné dans fiscal-service ne marque pas la liasse déposée — la propagation `ACCEPTEE` → `DEPOSE`

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (producteur, **outbox à créer**) + `bilan-service` (consommateur) — contrat d'événement = **2 dépôts**
**Points :** 8 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-538 (2026-09-25) — **décision user** : la propagation y était un hook inerte.

---

## Le fait, mesuré

STORY-538 porte le cycle `TRANSMISE → ACCEPTEE | REJETEE` dans `fiscal-service` ; `bilan-service` porte
depuis STORY-446 l'état `DEPOSE` (dépôt **constaté**, `depots[]`, `liasse.etat.change` en `DEPOSEE`,
relu par `dossier-service` pour le portefeuille). **Rien ne relie les deux** : un accusé consigné dans
fiscal-service laisse la liasse `VALIDE`, et le portefeuille dit « figée ».

⚡ La vérification docker de 538 l'a montré de bout en bout : la chaîne publie
`ACCUSE_NON_REPORTE_SUR_LA_LIASSE`, et la divergence ne se résorbe que par un `POST …/deposer` saisi à la
main dans bilan-service — le même fait, saisi deux fois.

⚠️ `fiscal-service` n'a **aucune outbox** : l'architecture (§ *Contrats d'événements produits*) la prévoit
(`fiscal.declaration.deposee`), aucune story ne l'a posée.

## Critères d'acceptation

- [x] AC-1 — Outbox transactionnelle dans `fiscal-service` (patron STORY-099) : l'événement s'écrit dans
      la **même** écriture que la transition `ACCEPTEE`, jamais après le commit.
- [x] AC-2 — Contrat : **état absolu** (le dépôt accepté : version, empreinte, date et numéro d'accusé,
      canal), `eventId`, `schemaVersion` — jamais un delta.
- [x] AC-3 — `bilan-service` consomme de façon **idempotente** (`ProcessedEvent`) et pose `DEPOSE` avec
      les faits du dépôt ; ⚠️ le signataire exigé par STORY-446 n'est pas porté par fiscal-service :
      trancher (champ facultatif côté bilan, ou saisie à l'accusé) **avant** le code.
      ✅ **Tranché le 2026-10-01 (user) : saisi à l'accusé.** `POST …/accepter` de fiscal-service exige
      `signataire { nom, numeroOrdre }` (mêmes règles que `SignataireDepotDto` de bilan-service), conservé
      sur le dépôt et porté par l'événement ; bilan-service garde son invariant (un `DEPOSE` a toujours
      un signataire). ⚠️ Donnée personnelle d'un tiers sur le bus : jamais journalisée.
- [x] AC-4 — Un rejet **ne** publie **pas** `DEPOSE` ; une liasse déjà `DEPOSE` ne se réécrit pas.
- [x] AC-5 — La divergence publiée par `GET /depots` disparaît sans saisie manuelle — prouvé en docker.

## Notes

- Voir [[STORY-538]] (D-538-6, hook inerte), [[STORY-446]], [[STORY-453]].
- ⚠️ Démarrage dégradé (invariant 4) : voir [[STORY-684]] — un consommateur qui crashe au boot ne se
  relance pas tout seul dans `dossier-service`.

## Progress Tracking

**Statut : `done` (2026-10-02).** Contrat sur 2 dépôts, intégrés dans l'ordre consommateur puis producteur : `prospera-bilan-service#155` puis `prospera-fiscal-service#13`, en rebase-merge sur `dev`.

### Contrat — `fiscal.declaration.deposee` v1 (état absolu)

`schemaVersion`, `eventId` (aussi en en-tête Kafka), `occurredAt`, `orgId` (clé de partition), `depotId`,
`dossierId`, `jeuEtatsId`, `pays`, `etat`, `statut: 'ACCEPTEE'`, `version`, `empreinteLiasse`,
`canal {type, mode}`, `transmisLe`, `accepteLe`, `numeroAccuse` (`null` possible), `signataire {nom, numeroOrdre}`,
`auteur`, `enregistreLe`. Documenté des deux côtés (`src/kafka/events/declaration-events.ts` ↔ `fiscal-events.ts`).

### Décisions

- AC-3 : signataire **saisi à l'accusé** (user, 2026-10-01), règles identiques à `SignataireDepotDto` ; jamais journalisé ni dans `audit_events`.
- `deposeLe` = jour de **transmission** (la date d'accusé voyage aussi) — retenu.
- Refus métier côté bilan ⇒ marqueur `REJETE` + code, jamais rejoué, la divergence reste publiée par fiscal ; erreur technique ⇒ remonte, Kafka rejoue.
- `enregistrePar` = l'auteur de l'accusé. Empreinte confrontée au sceau du snapshot (`EMPREINTE_DIVERGENTE`).

### Livré

- **fiscal-service** : première outbox du service (`outbox_events`, relais ordonné par organisation) ; transaction ouverte par `MongoRegistreDepots.transitionner` pour l'accusé ; un rejet ne publie rien (AC-4).
- **bilan-service** : consommateur `depot-fiscal/` (group `bilan-fiscal`), même logique que `POST …/deposer` (options `dansLaTransaction`/`verifierVersion`/`verifierJeu`) ; idempotence technique (`ProcessedEvent` dans la transaction) **et** métier (même version et même numéro déjà dans `depots[]` ⇒ rien n'est écrit) ; `TenantContext.executerHorsRequete`.

### Revues

- **Sécurité** — 1 constat corrigé (CWE-863) : l'événement contournait les gardes de la route manuelle (dossier `ARCHIVE`, accès Bilan KYC + entitlement). La condition est extraite dans `guards/acces-bilan.ts`, partagée par `BilanAccessGuard` et le consommateur.
- **Code** — 5 constats, 4 corrigés : idempotence métier sur `depots[]` (dépôt manuel puis réouverture, ou marqueur expiré) ; numéro d'accusé non rogné côté fiscal ; accusés concurrents sous transaction ⇒ `WriteConflict` traduit en course perdue 409 (puis, sur contre-revue, **seul** `WriteConflict` : une panne étiquetée `TransientTransactionError` remonte au lieu d'un 409 muet) ; course avec réouverture relue (`REJETE`/`JEU_NON_VALIDE`). 1 laissé → STORY-691.

### Preuves (sur l'état final, branches rebasées)

- fiscal : lint 0 · build OK · 107 suites / 1 602 tests · couverture 99,28 / 96,43 / 99,02 / 99,64 · e2e 8 / 119.
- bilan : lint 0 · build OK · 295 suites / 10 873 tests · couverture 99,4 / 97 / 99,58 / 99,51 · e2e 36 / 2 522. ⚠️ `test:cov` sort en code 1 par le `process.exit(1)` de `migrate-dossiers-rollback.bootstrap` — préexistant, reproduit sur `origin/dev` 30a2816 → STORY-692.
- Mutations : fiscal 19 / 19 + 1 sur le dernier correctif ; bilan 27 / 27 (passe interrompue par un redémarrage, mutant résiduel retiré, passe rejouée **en entier** dans un worktree détaché).
- **Vérif docker** sur stack neuve, code exécuté prouvé (sha256 hôte = conteneur) : 0 KO réel. Rejet ⇒ aucune outbox ; validateur forcé en échec sur `outbox_events` ⇒ dépôt reste `TRANSMISE` ; nominal : outbox `SENT`, liasse `DEPOSE`, `depots[]` complet, `liasse.etat.change` DEPOSEE ×1, **divergence disparue de `GET /depots` (AC-5)** ; rejeu ⇒ no-op ; second `eventId` ⇒ `DEJA_DEPOSEE` ; dossier archivé / entitlement révoqué ⇒ `REJETE`, liasse inchangée ; dépôt manuel puis réouverture/revalidation puis accusé ⇒ rien n'est écrit ; Kafka coupé ⇒ accusé 200, outbox `PENDING`, livré au retour ; aucun nom ni numéro d'ordre de signataire dans les logs de la stack. Le chemin `WriteConflict` n'est prouvé qu'en unitaire : la course réelle a donné le 409 `DEPOT_DEJA_ACCEPTE`. Scripts : `tmp/verif-docker-681/`, `tmp/verif-docker-final-681-682/`.

### Suites

- STORY-691 — un accusé sans numéro (canaux `DEPOT_PHYSIQUE`/`COURRIEL`) n'a aucune issue : publié par fiscal, refusé par bilan (`NUMERO_ACCUSE_ABSENT`), et la route manuelle exige aussi le numéro.
- STORY-692 — `test:cov` de bilan-service sort en code 1 alors que toutes les suites passent (préexistant).

### Historique

- 2026-10-01 — `in_progress`. Branches `MNV-681` (fiscal-service, empilée sur `MNV-682` ; bilan-service ; docs). AC-3 tranché par l'user.
- 2026-09-25 — `ready-for-dev`. Créée par la clôture de STORY-538.
