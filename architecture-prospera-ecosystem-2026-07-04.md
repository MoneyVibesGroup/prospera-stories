# Architecture Programme : Écosystème PROSPERA

**Date :** 2026-07-04 (rev 1.3 : 2026-07-10)
**Architecte :** vivian
**Version :** 1.3
**Type :** Architecture programme (niveau écosystème, au-dessus des architectures de service)
**Statut :** Draft

---

## Vue d'ensemble du document

PROSPERA n'est pas un micro-service unique mais un **écosystème multi-vertical**. Ce document est l'architecture de **niveau programme** : il définit la topologie cible, la répartition des responsabilités entre services, les contrats partagés (jetons, événements) et la roadmap des extractions. Les architectures de service individuelles s'y subordonnent :

- `docs/architecture-expert-comptable-2026-07-02.md` — vertical métier (comptabilité + facturation)
- `docs/architecture-kyc-service-2026-07-03.md` — capacité partagée KYC
- `docs/architecture-auth-service-2026-07-04.md` — IdP (fournisseur d'identité) ; source de vérité des schémas d'identité et du contrat `identity.*`
- `docs/architecture-catalog-service-2026-07-07.md` — capacité plateforme `platform-catalog-service` (renommé, NC-1) : catalogue de modules/versions/référentiels + entitlements ; source de vérité du contrat `entitlement.changed`
- `docs/architecture-bilan-service-2026-07-07.md` — capacité partagée : états financiers, moteur pluggable par référentiel comptable (fonctionnel comptable → PRD/tech-spec Bilan à rédiger)
- `docs/architecture-gateway-2026-07-07.md` — passerelle d'entrée (edge) : validation JWT fail-fast, routage par préfixe, résolution multi-version ; posture « services sans port public »

**Ce document est la source de vérité** de la topologie, de l'**ownership map**, du **modèle de jetons** et des **contrats d'événements `identity.*`**. Toute divergence dans un doc de service se résout ici.

---

## Motivation

Le projet a démarré comme un monolithe modulaire (`expert-comptable`) couvrant identité, KYC et facturation. Deux besoins transverses ont émergé :

1. **Le KYC** (vérification d'un cabinet) est réutilisable par plusieurs produits → extrait en `kyc-service` (décision du 2026-07-03).
2. **L'identité/authentification** est consommée par **tous** les futurs verticaux (`expert-comptable`, `distributeur`, `microfinance`, …) → doit devenir un **fournisseur d'identité** (IdP) autonome (décision du 2026-07-04).

Contrairement au KYC (une *feuille* du graphe de dépendances), l'auth en est la **racine** : guards, contexte de tenant, stratégie JWT, `Users` et `Tenants` en dépendent. L'extraire **inverse le sens des dépendances** — chaque vertical devient *relying party* de l'auth. D'où la nécessité d'un cadrage programme avant d'implémenter.

**Décisions produit actées :**
- **P1** — `auth-service` est un **fournisseur d'identité complet (IdP)** : possède utilisateurs, credentials, vérification e-mail, invitations, rôles, et émet les JWT.
- **P2** — L'**organisation cliente est partagée entre verticaux** : une même organisation peut consommer plusieurs produits PROSPERA ; son identité et l'appartenance de ses utilisateurs vivent dans `auth-service`.
- **P3** — **Re-cadrage avant code** : ce document et la roadmap précèdent l'implémentation.

---

## Topologie cible

```
                    ┌──────────────────────────────────────────────┐
                    │  auth-service (IdP) — identité & comptes       │
                    │  Users · Organizations · Memberships · RBAC    │
                    │  émission JWT (RS256) · JWKS · refresh rotatif  │
                    └───────────────────────┬──────────────────────-┘
                                            │ clé publique JWKS +
    Bus Apache Kafka :                      │ événements de domaine
    identity.* · kyc.status.changed · entitlement.*
   ┌───────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
   ▼               ▼              ▼              ▼              ▼              ▼
┌──────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌────────────┐
│kyc-service│ │bilan-service│ │catalog-svc │ │ Verticaux  │ │ admin-panel  │ │  (futures  │
│ (fam. 2) │ │  (fam. 2)  │ │  (fam. 2)  │ │  (fam. 3)  │ │  BFF + front │ │  capacités)│
│kyc.status│ │états fin.  │ │modules ·   │ │expert-compta│ │croise iden-  │ │ OCR, notif │
│.changed  │ │moteur      │ │versions ·  │ │distributeur │ │tité+KYC+     │ │            │
│          │ │pluggable   │ │référentiels│ │microfinance │ │entitlements  │ │            │
│          │ │(réf./tenant)│ │entitlement.│ │relying party│ │(lecture)     │ │            │
│          │ │            │ │changed     │ │            │ │              │ │            │
└──────────┘ └────────────┘ └────────────┘ └────────────┘ └──────────────┘ └────────────┘
  Bus inter-services : Apache Kafka (topics identity.* / kyc.status.changed / entitlement.changed)
  Infra partagée : MongoDB (1 base/service) · Kafka · Redis (cache + jobs internes BullMQ) · MinIO · Mailhog
  Orchestration  : docker-compose RACINE du dépôt PROSPERA (dev) ; K8s/GitOps en prod (doc ops dédié)
```

**Familles de services :**
1. **IdP** (`auth-service`) — l'autorité d'identité. Un seul, la racine.
2. **Capacités partagées** (`kyc-service`, `bilan-service`, `catalog-service`, demain OCR/notifications…) — des fonctions transverses consommées par plusieurs verticaux. `catalog-service` est la capacité **plateforme** qui possède le catalogue de modules et les entitlements.
3. **Verticaux métier** (`expert-comptable`, `distributeur`, `microfinance`) — les produits. Tous *relying parties* de l'IdP.
4. **BFF / front** (`admin-panel`) — agrège en **lecture** identité + KYC + entitlements (résout FR-012) ; ne possède aucune donnée.

---

## Principe relying-party

Chaque service consommateur (capacité ou vertical) :
- **Valide le JWT localement** via la clé publique JWKS de l'IdP (mise en cache, rafraîchie périodiquement) — **jamais d'appel réseau à `auth-service` sur le chemin chaud**.
- Maintient des **read-models locaux** de ce dont il a besoin (identité d'organisation/utilisateur/rôles, statut KYC), tenus à jour par **événements**.
- Ne possède **que sa part métier** ; il ne duplique jamais la source de vérité d'un autre service.

Ce principe garantit : autonomie de fonctionnement (un vertical tourne même si l'IdP est momentanément indisponible, tant que les JWT sont valides), latence nulle d'autorisation, et découplage de déploiement.

---

## Ownership map (source de vérité)

| Donnée | Propriétaire | Réplication chez les consommateurs |
|---|---|---|
| `User` (identité, credentials, e-mail vérifié, refresh hash, statut) | **auth-service** | read-model (id, nom, e-mail, statut) |
| `Organization` (ex-`Tenant` : name, slug, country, status) | **auth-service** | read-model (id, nom, statut) |
| `Membership` (user ↔ org ↔ rôle) | **auth-service** | read-model des rôles par org |
| Vérification e-mail, invitations, seed PLATFORM_ADMIN | **auth-service** | — |
| Clés de signature JWT + JWKS | **auth-service** | clé publique cachée |
| `TenantKycProfile` + `KycDocument` | **kyc-service** | read-model du statut KYC |
| `Subscription`, `Plan`, `Transaction` (**paiement/abonnement**) | **chaque vertical** | — |
| États financiers / bilans (données métier d'une capacité partagée) | **`bilan-service`** | read-model si besoin |
| `Module`, `ModuleVersion`, `ReferentielVersion` (catalogue) | **`catalog-service`** | — |
| **Entitlement** `(org × module) → { version_code, référentiel, config, actif }` | **`catalog-service`** | read-model local (service concerné, gateway, admin-panel) |

> **Séparation abonnement ≠ entitlement.** Le *paiement/abonnement* (FedaPay) reste au **vertical** ; le *droit d'usage + version/référentiel* d'un module appartient à **`catalog-service`**. Un seul déclencheur met à jour l'entitlement (le vertical ou `admin-panel` après paiement) → pas de double source de vérité. Cet amendement remplace l'ancienne ligne « Entitlement → chaque vertical », qui ne tenait que pour un module mono-vertical (cf. **P8**).

**Règle d'or :** le JWT transporte l'**identité** (qui es-tu, dans quelle org, avec quels rôles, e-mail vérifié ?), **jamais** l'état qui change par action tierce (statut KYC, abonnement, **entitlement, version/référentiel de module**) — ceux-ci sont lus dans les read-models locaux. C'est la généralisation du principe déjà retenu pour le `TenantStateGuard` d'`expert-comptable`.

### Note de vocabulaire : `Tenant` → `Organization`

Le concept « cabinet » devient une **organisation** partagée entre verticaux, possédée par `auth-service`. Pour éviter un rename massif et risqué, **la clé d'isolation reste `tenantId`** (= identifiant d'organisation) dans toute la mécanique existante (`TenantScopedRepository`, `TenantContext`). Seule la **source de vérité de l'identité** de l'organisation se déplace vers l'IdP ; l'isolation multi-tenant des verticaux est inchangée.

---

## Modules partagés & versioning par organisation

Le KYC a montré qu'un module réutilisé par plusieurs verticaux devient une **capacité partagée** (famille 2). Le **Bilan** suit le même chemin : consommé par `expert-comptable`, `distributeur` et `microfinance`, il est extrait en **`bilan-service`** — et non maintenu comme module d'un vertical. Ses données (états financiers) sont **keyées par `orgId`**, comme le KYC, **jamais par vertical** (préserve le cross-sell **P2**).

**Deux axes de variabilité orthogonaux — à ne jamais mélanger dans le versioning :**

1. **Version de code** de la capacité (`bilan-service`), en **semver** (`2.0.3`) : moteur de calcul, API, machine à états.
2. **Référentiel comptable** = **paquet de données versionné indépendamment** (plan de comptes, mapping des états financiers, règles de présentation) : `syscohada-revise@2.1`, `sfd-bceao@1.3`. L'IMF utilise le référentiel des **SFD/BCEAO**, les cabinets et distributeurs le **SYSCOHADA révisé** — c'est une **dimension de configuration, pas un fork** du service.

Chaque organisation reçoit, **par module**, un couple `(version_code, référentiel)` + config :

| Organisation | Vertical | Module | version_code | référentiel |
|---|---|---|---|---|
| Cabinet Alpha | expert-comptable | bilan | 2.0 | `syscohada-revise@2.1` |
| IMF Espoir | microfinance | bilan | 2.0 | `sfd-bceao@1.3` |
| Distributeur Koffi | distributeur | bilan | 1.2 | `syscohada-revise@2.0` |
| Distributeur Koffi | distributeur | stock | 3.1 | — |

Une même org peut consommer **plusieurs modules à des versions différentes** ; deux orgs peuvent partager la version de code et différer par le référentiel.

**Qui détient cette information ?** Ni le vertical (il ne possède pas le Bilan), ni `auth-service` (**A3** : n'émet aucun état métier). → **`catalog-service`** possède le **catalogue** (`Module`, `ModuleVersion`, `ReferentielVersion`) et les **entitlements** `(org × module) → { version_code, référentiel, config }`. Il publie **`entitlement.changed`** (keyé `orgId`) ; chaque service concerné le consomme en **read-model local** (**P4**). **Le JWT reste inchangé** : il porte l'identité, jamais l'entitlement ni la version (règle d'or).

**Gate d'accès (ex-`TenantStateGuard` / FR-007).** L'accès au Bilan est aujourd'hui gardé, *dans* `expert-comptable`, par la machine à états du tenant (e-mail → KYC → abonnement). En capacité partagée, `bilan-service` **réimplémente ce gate en relying party**, nourri par ses read-models `kyc.status.changed` **et** `entitlement.changed` — sans appel réseau à un autre service sur le chemin chaud (**P4**).

**Discipline d'exploitation (obligatoire).** Au plus **2 versions majeures simultanées** (N et N-1) par module, avec dépréciation **datée**. Deux stratégies :
- **Écart de référentiel seul (même code)** → **une seule instance** ; le référentiel est chargé **par tenant** depuis le read-model d'entitlement au moment du calcul.
- **Écart de code majeur (API incompatible)** → **deux déploiements** (`bilan-v1`, `bilan-v2`) derrière le même service logique ; le routage `orgId → version` se fait à l'**edge** (gateway) via le read-model d'entitlement. **Base/collections séparées par version majeure** (pas de schéma partagé).

> Le détail **routage edge + GitOps multi-version** (gateway, images semver, Helm/ArgoCD, schema registry) relève d'un futur **doc ops/déploiement**. Ce document programme n'en fixe que les **invariants** : deux axes orthogonaux, keyé `orgId`, JWT inchangé, N/N-1.

---

## Modèle de jetons — RS256 / JWKS

**État actuel :** `expert-comptable` émet des JWT en **HS256** (secret symétrique partagé, `token.service.ts`). Acceptable pour un émetteur unique, **inadapté** à un IdP multi-consommateurs (chaque validateur devrait détenir le secret de *signature*).

**Cible :** signature **asymétrique RS256**.
- `auth-service` signe l'access token avec sa **clé privée** et expose `GET /.well-known/jwks.json` (clés publiques, rotation par `kid`).
- Chaque relying party valide la signature avec la **clé publique** (JWKS caché) — **aucun secret de signature ne circule**.
- **Claims access token :**
  ```
  { iss: "prospera-auth", aud: ["expert-comptable","kyc-service",…],
    sub: <userId>, org: <orgId (ex-tenantId)>, roles: [<rôles org-scopés>],
    emailVerified: <bool>, iat, exp }
  ```
- **Refresh token** : rotation + détection de réutilisation + hash en base, **conservés dans `auth-service`** (mécanique existante d'`expert-comptable` réutilisée telle quelle). Le refresh ne quitte jamais l'IdP.

**Transition :** tant qu'`auth-service` n'existe pas, `expert-comptable` reste l'émetteur (HS256). Le socle de validation des relying parties (stratégie JWT + guards) est conçu pour **basculer HS256 → RS256/JWKS par configuration**, afin que l'arrivée de l'IdP ne demande pas de réécriture.

---

## Contrats d'événements (bus Apache Kafka)

**Transport inter-services = Kafka.** Chaque famille d'événements est un **topic** (`identity.*`, `kyc.status.changed`), partitionné par **clé = `orgId`** (ordre garanti par organisation). Chaque service consommateur a son **consumer group** dédié → plusieurs verticaux consomment le même topic indépendamment (**fan-out natif**, sans duplication côté producteur).

**Séparation des rôles Kafka / Redis :**
- **Kafka** = *événements de domaine inter-services* (pub/sub durable, rejouable, multi-consommateurs) : `identity.*`, `kyc.status.changed`.
- **Redis + BullMQ** = *jobs de fond internes à un service* (work queue avec retry/backoff), ex. l'envoi d'e-mails de chaque service (`MAIL_QUEUE`) — **jamais** un canal inter-services. Redis sert aussi de cache (JWKS, compteurs de rate-limit).

Tous les événements suivent le même patron : **état absolu**, `eventId` (UUID, clé d'idempotence), `schemaVersion`, publication **après** persistance, consommateur **idempotent** (marqueur d'événement traité — Kafka garantit *at-least-once*). L'ordre par organisation est assuré par le partitionnement sur `orgId`.

**Fiabilité de publication (Mongo → Kafka) :** l'écriture Mongo et la publication Kafka ne sont pas atomiques. Cible de robustesse : **transactional outbox** — l'événement est écrit dans une collection `outbox` **dans la même transaction** que le changement métier, puis un relais le publie sur Kafka et le marque publié (au moins une fois, dédupliqué par `eventId` côté consommateur). En démarrage, un simple *publish-after-commit* + rattrapage à la transition suivante (état absolu) est acceptable ; l'outbox est le durcissement.

### `identity.*` — producteur `auth-service`

| Événement | Déclencheur | Consommé pour |
|---|---|---|
| `identity.org.created` / `identity.org.updated` | création / MAJ (dont suspension) d'organisation | provisionner et maintenir le read-model d'org |
| `identity.user.registered` | inscription / création d'utilisateur | read-model utilisateur |
| `identity.membership.changed` | ajout/rôle/suspension d'un membre | read-model des rôles |
| `identity.user.suspended` | suspension d'utilisateur | couper l'accès dans les verticaux |

> **Schémas détaillés = `docs/architecture-auth-service-2026-07-04.md` § Contrat d'événements `identity.*`** (ce document en fixe le transport et les conventions, l'auth-service en détaille les payloads).

Un vertical **provisionne sa part métier** (ex. profil de facturation vide) lorsqu'une organisation commence à le consommer — déclenché par événement ou au premier accès.

### `kyc.status.changed` — producteur `kyc-service`

Topic déjà spécifié en détail dans le doc kyc-service ; c'est un **topic Kafka**. Inchangé sur le fond ; keyé par `orgId` ; chaque vertical intéressé le consomme via son propre consumer group.

### `entitlement.changed` — producteur `catalog-service`

| Événement | Déclencheur | Consommé pour |
|---|---|---|
| `entitlement.changed` | activation / MAJ / révocation d'un module pour une org (version_code, référentiel, config, statut actif) | mettre à jour le read-model local `(org × module) → version/référentiel/actif` de chaque service concerné (**`bilan-service`**, verticaux, **`admin-panel`**, **gateway** pour le routage multi-version) |

**État absolu** (l'entièreté de l'entitlement de l'org pour ce module), keyé `orgId`, `eventId`/`schemaVersion` comme les autres topics. Les événements **métier** propres au Bilan (calcul terminé, etc.) seront spécifiés dans le doc `bilan-service`. Schémas détaillés → doc `catalog-service` (à rédiger).

### Fan-out multi-consommateurs

**Résolu nativement par Kafka.** Un topic est lu par autant de **consumer groups** que de services intéressés, chacun à son propre rythme et offset. Ajouter un nouveau vertical qui réagit aux événements KYC ou identité = créer un consumer group, **sans aucune modification du producteur**. (C'est l'avantage décisif de Kafka sur une work queue comme BullMQ, où il aurait fallu dupliquer les messages côté producteur.)

---

## Roadmap des extractions

Ordre imposé par le graphe de dépendances (l'auth est la racine ; le kyc valide les jetons de l'auth) :

1. **Re-cadrage écosystème** *(ce document)* — maintenant.
2. **`auth-service` (IdP)** — **nouvel EPIC** :
   - Re-héberger l'identité : `Users`, `Organizations`, `Memberships`, credentials, vérification e-mail, invitations, seed PLATFORM_ADMIN.
   - Émission **RS256 + JWKS**, refresh rotatif.
   - Publier les événements `identity.*`.
   - **Refactor `expert-comptable` en relying party** : validation via JWKS + read-model d'identité alimenté par `identity.*`.
   - *Extraction racine — la plus lourde (~30 pts de logique déjà livrée à re-héberger + nouveautés IdP/relying-party).*
3. **`kyc-service`** — extraction déjà spécifiée (STORY-020/021/013/014), **rebasée sur `auth-service`** (validation JWKS, clé `orgId`). Glisse **après** auth-service.
4. **`catalog-service` + `entitlement.changed`** — petit service **plateforme**, mais il doit exister **avant** que le Bilan soit multi-vertical (personne d'autre ne peut dire quelle version servir à l'org X). Livre le catalogue, les entitlements et le topic.
5. **`bilan-service`** — extrait avec **référentiels packagés séparément dès le jour 1** (moteur pluggable) : bien moins coûteux que de dé-hardcoder le SYSCOHADA plus tard. Réimplémente le gate d'accès en relying party (KYC + entitlement). `admin-panel` (BFF, FR-012 agrégé) peut suivre.
6. **Verticaux métier** — FedaPay/billing d'`expert-comptable` (EPIC-004) en relying party ; puis scaffolding de `distributeur` / `microfinance` réutilisant le socle relying-party.

> La **re-planification chiffrée** (ré-estimation des points, ré-affectation des sprints) est réalisée via `/bmad:sprint-planning`. Ce document fixe la **séquence** et l'**ordre de grandeur**, pas les points définitifs.

---

## Journal de décisions (programme)

**P1 — `auth-service` = IdP complet (vs autorité de jetons fine)**
✓ Découple réellement : les verticaux ne partagent plus ni store d'utilisateurs ni logique d'auth. ✗ Extraction lourde (racine du graphe). *Seul modèle cohérent pour un écosystème multi-vertical partageant les mêmes utilisateurs.*

**P2 — Organisation partagée entre verticaux (vs org par-vertical)**
✓ Cross-sell (une org consomme plusieurs produits) ; identité et membership uniques. ✗ La notion d'« org » devient distribuée (identité à l'IdP, métier dans chaque vertical). *Chaque service possède sa tranche ; l'IdP possède l'identité.*

**P3 — Jetons RS256 / JWKS (vs HS256 partagé)**
✓ Aucun secret de signature ne circule ; validation locale par clé publique ; standard IdP. ✗ Gestion de rotation de clés (`kid`). *Indispensable dès qu'il y a >1 validateur ; le kyc-service en sera le premier bénéficiaire.*

**P4 — Communication par événements + read-models (vs REST synchrone)**
✓ Autonomie et latence nulle d'autorisation ; résilience à l'indisponibilité de l'IdP. ✗ Cohérence éventuelle (quelques secondes). *Déjà retenu pour le KYC ; généralisé à l'identité.*

**P5 — `Tenant` reste la clé d'isolation, `Organization` le concept**
✓ Pas de rename massif ; mécanique d'isolation intacte. ✗ Double vocabulaire transitoire. *Pragmatique ; seule l'ownership de l'identité d'org se déplace.*

**P6 — Apache Kafka pour les événements inter-services (vs BullMQ/Redis)**
✓ Pub/sub durable et rejouable ; **consumer groups = fan-out natif** (plusieurs verticaux sur un même topic sans effort producteur) ; ordre par partition (`orgId`) ; découplage fort. ✗ Infra plus lourde qu'une file Redis (broker Kafka à exploiter). *Redis/BullMQ est conservé pour les jobs internes à un service (e-mails avec retry) ; Kafka est réservé aux événements de domaine inter-services. La reprise de fiabilité Mongo→Kafka vise le patron transactional outbox.*

**P7 — `bilan-service` = capacité partagée + versioning par organisation (vs module d'un vertical)** — *prolonge D1/D8 (réversibilité d'un module en service)*
✓ Réutilisable par N verticaux ; **deux axes orthogonaux** (version de code semver ⊥ référentiel packagé) ; keyé `orgId` (cross-sell préservé). ✗ Le gate d'accès (ex-`TenantStateGuard`/FR-007) doit être réimplémenté en relying party ; discipline **N/N-1** obligatoire. *Le Bilan cesse d'être un module d'`expert-comptable`. La variabilité OHADA (SYSCOHADA révisé vs SFD-BCEAO) est une **dimension de configuration**, pas un fork.*

**P8 — `catalog-service` = source de vérité des entitlements + `admin-panel` BFF (vs entitlement par vertical)**
✓ Un module partagé a **un seul** propriétaire d'entitlement ; **sépare abonnement (paiement, vertical) et droit/version (catalog)** ; résout le point ouvert **FR-012** (dashboard admin agrégé) par un BFF croisant identité + KYC + entitlements. ✗ Nouvelle brique plateforme + topic `entitlement.changed`. *Amende l'ownership map : « Entitlement → chaque vertical » ne tenait que pour un module mono-vertical. **JWT inchangé** (règle d'or préservée) ; A3 préservé (l'IdP n'émet toujours aucun état métier).*

**P9 — Schema registry adopté maintenant (vs « à envisager »)**
✓ Trois familles de topics (`identity.*`, `kyc.status.changed`, `entitlement.changed`) + événements Bilan à venir → **compatibilité BACKWARD imposée mécaniquement en CI** (un producteur ne peut plus retirer un champ lu par un consommateur) : le garde-fou anti-régression le plus fort. ✗ Infra à opérer (Confluent Schema Registry ou Apicurio). *Fait passer le risque #4 de « envisager » à **planifié**. JSON-Schema/Avro versionnés ; le rejet du merge en CI remplace la discipline manuelle `schemaVersion` + doc. Complète les tests de contrat consommateur (NFR-006).*

**P10 — Mono-repo maintenant, poly-repo différé (topologie du code)**
✓ Un seul dépôt (services en sous-dossiers, `docker-compose` racine, socle dupliqué — cf. K4) : changements cross-service **atomiques**, une seule matrice CI, simplicité pour une équipe réduite ; correspond à l'état actuel. ✗ Pas de cadence de release indépendante par service. *Déclencheur de bascule vers **poly-repo** (`prospera-*` séparés + repo `platform-config` GitOps) : équipe/services qui grossissent, ou besoin de versionner/déployer les services **indépendamment**. Le versioning d'images **semver** (multi-version) fonctionne dans les deux topologies — la bascule n'est donc pas bloquante.*

**P11 — Dogfooding interne d'abord + simplifications actées (DG-1, PLAN FINAL 2026-07-10)**
✓ Aucun utilisateur externe aujourd'hui → **Money Vibes Group est le client zéro** : chaque module est éprouvé en production interne (Bilan, Compta, Fiscalité, Commercial, Support) avant toute ouverture externe, décidée **module par module**. Tant qu'il n'y a pas de client externe, les **garde-fous N/N-1 et le routage multi-version gateway sont différés** (une seule version en service ; le mécanisme reste prévu au schéma d'entitlement) et le **cutover auth + évolutions de schéma** sont sans risque (pas de données clientes). ✗ Décalage assumé (chaîne KYC d'abord → toute la séquence éq. 3 glisse de +1 mois, **AD-2**). *Ne se relâchent PAS : les invariants (JWT=identité seule ; abonnement ≠ entitlement ≠ paiement ; immutabilité des écritures/documents validés — l'automatisation **propose**, l'humain **valide** ; une base = un service) + **sauvegardes Mongo dès septembre** (c'est votre propre comptabilité) + doc ops minimal.*

**P12 — 18 modules → 18 services + renommage `platform-catalog-service` (NC-1)**
✓ Le programme se déploie en **18 services métier** suivant le même moule (relying party JWKS, read-models Kafka, MongoDB/service, outbox keyé `orgId`, gate d'accès local, abstractions provider `PaymentProvider`/`EInvoicingProvider`/`OcrProvider`/`LlmProvider`) — ce qui rend 18 modules tenables à 3 devs. Ordre de construction et cible interne : voir `program_backlog` de `docs/sprint-status.yaml` et le PLAN FINAL `docs/synthese-services-prospera-2026-07-10.md`. **Phase 1** : Module 0 chaîne KYC (`admin-panel` v1 + `document-service` v1 OCR, **AD-2**) → Module 1 Bilan (`bilan-service`, **NB-1** import de balance + prévisionnel) → Module 2 PI SPI (`paiement-service`, **PA-1** : checkout/webhooks BCEAO/FedaPay hors du vertical) → Fiscalité → Conformité → Support. **NC-1** : `catalog-service` est renommé **`platform-catalog-service`** — à lire ainsi partout dans ce document. ✗ Duplication du socle NestJS (K4, assumée). *Les fondations `comptabilite-service` (moteur d'écritures, FI-2), les extensions `document-service` (factures/crédit) et `ia-service` (Qwen) restent différées, insérées sur déclencheur.*

---

## Risques & points d'attention

1. **Inversion de dépendance** : extraire la racine relocalise ~30 pts de code identité déjà livré et transforme `expert-comptable` en consommateur — la refonte la plus profonde du programme. Séquencer avec buffer.
2. **Cohérence éventuelle** des read-models d'identité (latence de propagation) ; réconciliation périodique en extension si besoin.
3. **Rotation de clés RS256** (`kid`, JWKS caché côté relying parties) — standard mais nouveau pour l'équipe.
4. **Contrats de topics dupliqués** (`identity.*`, `kyc.status.changed`, `entitlement.changed`) : `schemaVersion` + ce document comme référence unique **en attendant le schema registry désormais planifié (P9)** — compatibilité BACKWARD imposée en CI.
5. **Exploitation de Kafka** : broker à opérer (KRaft mono-nœud en dev via docker-compose ; cluster géré en prod). Plus lourd qu'une file Redis — c'est le prix du découplage inter-services. Fiabilité de publication Mongo→Kafka via transactional outbox (cible).
6. **Frontière de confiance** : les relying parties font confiance au JWT signé (org/rôles) sans revalider auprès de l'IdP → la robustesse de la clé privée et de sa rotation est critique en production.
7. **Prolifération de versions** : sans la discipline **N/N-1** + dépréciation datée, coût d'exploitation ingérable (p. ex. 6 versions de bilan en prod). Limite stricte à **2 versions majeures simultanées** par module.
8. **Mélange des deux axes** : ne jamais encoder le référentiel dans la version de code (ni l'inverse). Un écart de **référentiel seul** ne justifie **pas** un multi-déploiement (chargement par tenant).
9. **Frontière abonnement / entitlement** : éviter la double source de vérité — *paiement* au vertical, *droit/version* au `catalog-service` ; un seul déclencheur de MAJ d'entitlement.
10. **Gate d'accès relocalisé** : en devenant partagé, `bilan-service` perd le `TenantStateGuard` d'`expert-comptable` ; il doit rejouer le gate via ses read-models `kyc.status.changed` + `entitlement.changed`.
11. **Routage multi-version & GitOps** : détail (gateway, Helm/ArgoCD, images semver, schema registry) reporté à un **doc ops dédié** ; le programme n'en fixe que les invariants.
12. Contraintes conservées : tout en français, démarrage `docker compose` racine, anti-énumération, lint 0 warning, couverture 65/90/90/90, commits uniquement sur demande explicite.

---

## Historique des révisions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2026-07-04 | vivian | Architecture programme initiale : topologie multi-vertical, IdP `auth-service`, ownership map, jetons RS256/JWKS, **bus d'événements Apache Kafka** (topics `identity.*` / `kyc.status.changed`, consumer groups, Redis/BullMQ réservé aux jobs internes), roadmap des extractions |
| 1.1 | 2026-07-07 | vivian | **Modules partagés & versioning par organisation** : `bilan-service` (capacité partagée, 2 axes version de code ⊥ référentiel packagé, gate d'accès en relying party) et `catalog-service` (entitlements `(org × module)`, topic `entitlement.changed`, `admin-panel` BFF pour FR-012). Amende l'ownership map (entitlement → catalog ; abonnement reste vertical) ; ajoute **P7/P8** ; insère catalog + bilan dans la roadmap ; risques N/N-1 & routage multi-version. JWT/A3 inchangés. |
| 1.2 | 2026-07-07 | vivian | **Couche edge/exécution** : décisions **P9** (schema registry adopté maintenant — compatibilité BACKWARD en CI) et **P10** (mono-repo maintenant, poly-repo différé) ; ajout du doc `architecture-gateway` (validation JWT fail-fast à l'edge + services souverains, routage par préfixe, résolution multi-version, services sans port public). Risque #4 (schema registry) passé de « envisager » à « planifié ». |
| 1.3 | 2026-07-10 | vivian | **Alignement PLAN FINAL** (`docs/synthese-services-prospera-2026-07-10.md`) : décisions **P11** (dogfooding interne d'abord — Money Vibes = client zéro ; N/N-1 & routage multi-version différés jusqu'au 1er client externe, **DG-1** ; chaîne KYC livrée d'abord, **AD-2**) et **P12** (18 modules → 18 services suivant le moule unique ; **NC-1** `catalog-service` → `platform-catalog-service` ; **NB-1** Bilan par import de balance + prévisionnel ; **PA-1** checkout/webhooks → `paiement-service`). Ordre de construction et backlog des 18 modules → `program_backlog` de `sprint-status.yaml`. Invariants inchangés. |

---

**Document créé avec BMAD Method v6 — Phase 3 (Solutioning, niveau programme)**
*Prochaine étape : `/bmad:sprint-planning` pour ré-estimer et ré-ordonner les sprints (EPIC auth-service en tête, kyc rebasé ensuite, FedaPay après).*
