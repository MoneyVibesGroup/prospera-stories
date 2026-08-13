# STORY-301 : Socle `dossier-service` — modèle Dossier, création, attestation de mandat, historisation, « Mon cabinet » auto-créé

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **B** (noyau) · décisions **D1**, **D2**, **D4**, **D10** · risque **1**
**Priorité :** Must Have
**Story Points :** 8
**Statut :** 🚧 En cours (`in_progress`)
**Complexité :** high
**Créée le :** 2026-08-13
**Sprint :** 20
**Service :** `dossier-service` *(**neuf** — cette story porte son scaffold)*

---

## Le constat — lu dans le code, pas déduit du tracker

Le produit affirme aujourd'hui, **en commentaire de son schéma le plus consommé**, l'inverse exact de
ce que le PO vient de trancher :

> « **Une organisation = une société** […] aucune notion de « dossier » ; un cabinet qui gère
> 20 clients a **20 organisations** »
> — `balance-service/src/modules/profil-societe/schemas/profil-societe.schema.ts` §36-38

Ce n'est pas une intention : c'est **appliqué par un index unique** `{ orgId: 1 }`
(`profil-societe.schema.ts:142`) et un `409 PROFIL_SOCIETE_DEJA_EXISTANT`
(`profil-societe.service.ts:85,96`). Un cabinet qui tente de créer une deuxième société **reçoit un
refus du serveur**. Aucune route ne prend d'`orgId` : le scope vient **toujours** du JWT
(`profil-societe.controller.ts:37-40`).

Autrement dit, la question du PO — « y a-t-il une story qui permet de créer un dossier client au
niveau du cabinet ? » — a pour réponse **non, et le serveur l'interdit activement**.

⚠️ **Le seul « dossier » planifié à ce jour était local à `fiscal-service`** (`dossierId` =
« regroupement, local au service », `architecture-fiscal-service-2026-08-03.md:302,309`) : il
n'aurait ouvert **ni Atelier Balance ni Bilan**. C'est le **risque n°1** du ticket — laisser partir le
module Fiscalité devant produirait **deux concepts de client**, à fusionner plus tard **sur des
données réelles**. Cette story est ce qui passe devant.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **créer un dossier pour chaque société que je traite, en attestant du mandat qui m'y autorise**,
afin que **le travail comptable de mes clients cesse d'exiger une organisation par client**.

---

## Ce que la story livre

### 1. Le scaffold de `dossier-service` (c'est le +3 points du réancrage)

Service NestJS **neuf**, calqué sur `expert-comptable`, sur le port **`:3009`** *(3005 est réservé à
`paiement-service`, 3008 à `notification-service`, 3011 à `assistant-service`, 3012 à
`fiscal-service` ; 3009 est documenté libre)*, base Mongo **`dossier_service`**, préfixe
`/api/v1`, `/api/v1/health`, Swagger `/api/docs`.

- Chaîne de guards globale **`Throttler → JwtAuth (RS256/JWKS) → EmailVerified → Roles`** —
  validation **locale** de la clé publique, **aucun** appel REST à l'IdP sur le chemin chaud.
- Config **validée au boot** (`class-validator`) : le service refuse de démarrer si une variable
  requise manque.
- **Démarrage dégradé** : Kafka absent au boot ⇒ HTTP up quand même, `/health` rend `kafka: down`,
  et une erreur de connexion ne tue jamais le process.
- **CORS** câblé dès le scaffold (`CORS_ALLOWED_ORIGINS`, allowlist explicite, vide ⇒ désactivé) —
  le patron STORY-109, posé **maintenant** et non après coup.
- **Outbox transactionnelle** + relais (`outbox_events`) et **consumer idempotent**
  (`processed_events`), au patron déjà en place dans les quatre services producteurs.
- Service **inscrit au `docker-compose` racine** et à la matrice **CI** (`.github/workflows/ci.yml`) —
  un service hors CI est un service dont personne ne verra la régression *(leçon STORY-173 :
  un livrable mergé et totalement inerte)*.

### 2. Le modèle `Dossier`

Collection **`dossiers`** (nommage explicite, `snake_case`), portant :

- **identité fiscale** de la société traitée, reprise de `ProfilSociete` (STORY-079) : `raisonSociale`,
  `sigle`, `formeJuridique`, `nifSociete`, `rccm`, `numeroCnss`, `dateCreation`, `devise`,
  `objetSocial`, `codeNaema`, `secteur`, `capitalSocial`, `adresse`, `email`, `telephone`,
  `actionnaires[]`, `dirigeants[]` ;
- **`typeEntite`** (`ENTREPRISE` · `MICROFINANCE` · `ASSURANCE`) et **`pays`** (ISO-2 majuscules) ;
- les **2 axes** `systemeComptable` / `regimeFiscal`, **courants** à ce stade ;
- **`statut`** (`ACTIF` | `ARCHIVE`, défaut `ACTIF`), **`estLeCabinet`**, **`version`** (entier
  monotone, verrou optimiste), `actif`.

**Saisie progressive conservée** (STORY-079) : hormis `raisonSociale`, `formeJuridique`, `pays` et
`typeEntite`, tout est optionnel en base. Refuser un dossier dont le NIF n'est pas encore connu
condamnerait la création à partir d'une carte CFE en cours d'obtention.

**Deux manques relevés par les maquettes, comblés ici** *(bloc B du ticket, §5)* :
`ActionnaireSub` gagne **`nationalite`** et **`numeroPieceIdentite`** ; les dirigeants deviennent
**variables selon la forme juridique** — la validation exige un dirigeant pour les formes qui en
imposent un, et **n'en exige aucun** pour un entreprenant.

### 3. `POST /dossiers` + l'attestation de mandat (D2)

`@Roles(TENANT_ADMIN)`. Le KYC **reste au cabinet** : le client final n'a pas de compte, on ne peut
pas lui demander de se vérifier. Ce qui le remplace est **l'attestation de mandat** —
**une ligne de journal horodatée et attribuée, pas un formulaire, et sans pièce exigée**.

- Le corps porte un bloc `attestationMandat` **obligatoire** : `atteste: true` (littéral — `false`
  est un `400`, pas un dossier sans mandat), `qualiteSignataire`, `reference?` facultative.
- Le serveur écrit, **dans la même transaction** que le dossier, une entrée de journal
  `MANDAT_ATTESTE` portant `parUserId`, `le` (horodatage **serveur**), la `qualiteSignataire` et le
  **texte de l'attestation en vigueur** figé à l'écriture — une attestation qui citerait une version
  de texte résolue à la lecture ne prouverait rien.
- ⚡ **« Mon cabinet » est la seule exception** : un cabinet ne se mandate pas lui-même. Le dossier
  `estLeCabinet` se crée **sans** attestation, et c'est un critère explicite — appliquer la règle
  uniformément aurait produit soit un mandat fictif attribué au système, soit une exception ouverte
  qui laisserait passer un dossier client sans mandat.

### 4. Historisation append-only

Collection **`dossiers_journal`** — écrite **dans la transaction** de l'écriture qu'elle relate, jamais
après : un journal écrit hors transaction ment le jour où l'écriture échoue. Entrées de cette story :
`DOSSIER_CREE`, `MANDAT_ATTESTE`. Chaque entrée porte `dossierId`, `orgId`, `type`, `parUserId` (ou
`SYSTEME`), `le`, et une charge `details` typée.

**Aucune route de lecture ici** — elle est portée par **STORY-360**. C'est délibéré et tracé : ce dépôt
a déjà payé **trois fois** le défaut « écriture sans lecture » (STORY-144 → 294 ; STORY-079 →
`listerAudits` jamais exposé). Le porteur existe, il est nommé, il est au même sprint.

### 5. Le dossier « Mon cabinet », créé automatiquement (D1)

À la consommation d'**`identity.org.created`**, `dossier-service` crée pour l'organisation son dossier
propre, `estLeCabinet: true`, `raisonSociale` = `name` de l'événement, `pays` = `country`.

- **Aucun appel REST à l'IdP** : l'événement porte déjà tout (invariant P3).
- **Idempotence par la base, pas par un pré-contrôle** : index **unique partiel**
  `{ orgId: 1 }` sur `estLeCabinet: true`. Un rejeu Kafka ou deux consommateurs concurrents ne peuvent
  pas produire deux « Mon cabinet » — un `find`-puis-`create` perd la course, silencieusement.
- **Non supprimable, non détachable** : `estLeCabinet` est **immuable** — il ne se pose ni ne se retire
  par l'API, et **aucune route `DELETE` n'existe** sur les dossiers. Un test **échoue** si une telle
  route apparaît.

### 6. Événements `dossier.*` en outbox transactionnelle

Topics **`dossier.created`** et **`dossier.updated`**, au contrat du projet : **état absolu**
(jamais un delta), `eventId` pour l'idempotence, `schemaVersion`, **publication après persistance**
via l'outbox.

⚠️ **Hook inerte, documenté et testé comme tel** : **aucun consommateur n'existe encore** — ils
arrivent avec STORY-236 (`balance-service`), STORY-357 (`bilan-service`) et STORY-358
(`document-service`). Le producteur émet pour que la projection côté relying party soit un **ajout
local**, sans nouveau changement de contrat. Le payload ne transporte **aucun secret** et **aucune
donnée d'identité de compte**.

---

## Hors périmètre — explicitement

| Ce qui n'est pas ici | Porteur |
|---|---|
| `responsableUserId`, `contributeursUserIds`, **portée** de lecture par rôle, **archivage** et sa route | **STORY-353** |
| **Unicité du NIF** de société (`nifNormalise` + index unique **partiel**, 409 nommant le dossier existant) | **STORY-354** |
| **Résolution** `typeEntite` → référentiel + paquet fiscal, et la garde « type figé dès qu'un exercice est validé » | **STORY-304** |
| Durcissement de la **clé `(dossier, pays)`** et forme prête au multi-implantation | **STORY-302** |
| **Exercices** du dossier (cycle de vie, un seul ouvert, `GET`) | **STORY-355** |
| **Migration** des profils existants et `dossierId` rendu obligatoire | **STORY-356** |
| **Datation par exercice** des 2 axes | **STORY-303** |
| **Lecture** du portefeuille (pagination, compteurs, échéance) | **STORY-359** |
| **Lecture** du journal et fil d'activité | **STORY-360** |
| Re-scopage de `balance-service` / `bilan-service` / `document-service` | **STORY-236 / 357 / 358** |
| `notification-service` (D12) | inexistant — Q10 tranche l'option **(b)**, portée par STORY-360 |

⚠️ **Arbitrage de frontière assumé, à lire avant de contester le périmètre.** `typeEntite` et `pays`
sont posés **ici** et non en STORY-302, parce que **STORY-304 les consomme et passe avant 302 dans
l'ordre de tirage** (`301 → 353 → 354 → 304 → 302 → …`). 302 conserve tout son objet : elle durcit
l'invariant mono-pays (D10) et fige la clé `(dossier, pays)` pour que le multi-implantation du module
Fiscalité s'y branche **sans migration**. Poser un `typeEntite` en 304 puis le redéplacer en 302 aurait
fait payer deux fois exactement ce que le ticket existe pour éviter.

---

## Acceptance Criteria

### Scaffold

- [ ] **AC-01** — `dossier-service` démarre sur `:3009`, expose `/api/v1/health`, `/api/docs`, et
      **refuse de démarrer** si une variable d'environnement requise manque (test de config).
- [ ] **AC-02** — **Démarrage dégradé** : Kafka injoignable au boot ⇒ le process **reste vivant**,
      HTTP répond, `/api/v1/health` rend `kafka: down`.
- [ ] **AC-03** — La chaîne de guards est active : requête **sans jeton** → `401` ; jeton d'un
      **autre tenant** → aucune donnée du tenant courant n'est visible ; e-mail non vérifié →
      `EMAIL_NOT_VERIFIED`.
- [ ] **AC-04** — Le service est présent dans le `docker-compose` racine **et** dans la matrice CI
      (lint · test+couverture · build d'image).

### Modèle & création

- [ ] **AC-05** — `POST /dossiers` en `TENANT_ADMIN` → **201**, document réellement écrit dans
      `dossiers` avec `orgId` **issu du JWT** (jamais du corps), `statut: ACTIF`, `version: 1`,
      `estLeCabinet: false`.
- [ ] **AC-06** — Un `orgId` **fourni dans le corps** est ignoré, pas honoré : le dossier créé porte
      l'organisation du jeton. *(Mutation-test dédié.)*
- [ ] **AC-07** — **Saisie progressive** : un dossier se crée avec `raisonSociale`, `formeJuridique`,
      `pays`, `typeEntite` et l'attestation **seuls** — sans NIF, sans RCCM, sans dirigeant.
- [ ] **AC-08** — `pays` est normalisé en **ISO-2 majuscules** ; `typeEntite` hors énumération → `400`.
- [ ] **AC-09** — `ActionnaireSub` accepte et persiste `nationalite` et `numeroPieceIdentite` ; les
      **dirigeants exigés varient selon la forme juridique** — un **entreprenant** se crée sans aucun
      dirigeant (`201`), une forme qui en impose un sans dirigeant → `400`.

### Attestation de mandat (D2)

- [ ] **AC-10** — `POST /dossiers` **sans** `attestationMandat` → **400** ; avec `atteste: false` →
      **400**. Aucun dossier client n'existe sans mandat attesté.
- [ ] **AC-11** — L'attestation produit une entrée `MANDAT_ATTESTE` dans `dossiers_journal`, portant
      `parUserId` **du jeton**, un horodatage **serveur** (un `le` envoyé par le client est ignoré) et
      le **texte de l'attestation figé à l'écriture**.
- [ ] **AC-12** — **Atomicité prouvée** : si l'écriture du journal échoue, **aucun** dossier n'est
      créé — zéro orphelin dans `dossiers`. Vérifié en **docker**, par requête `mongosh` réelle.

### « Mon cabinet » (D1)

- [ ] **AC-13** — À la réception d'`identity.org.created`, un dossier `estLeCabinet: true` est créé
      pour l'organisation, sans attestation de mandat, `raisonSociale` = `name`, `pays` = `country`.
- [ ] **AC-14** — **Rejeu du même événement** ⇒ toujours **un seul** « Mon cabinet » (`ProcessedEvent`
      + index unique partiel). Un **second** `identity.org.created` forgé pour la même org, **hors
      table d'idempotence**, est **refusé par l'index** — pas par un `find` préalable.
      *(Mutation-test : retirer l'index laisse passer le doublon.)*
- [ ] **AC-15** — `estLeCabinet` est **immuable par l'API** : il ne peut être ni posé à la création
      (`POST /dossiers` l'ignore) ni modifié ensuite.
- [ ] **AC-16** — **Aucune route `DELETE`** n'existe sur `/dossiers` — un test **échoue** si le
      contrôleur en déclare une.

### Journal & événements

- [ ] **AC-17** — Toute création écrit `DOSSIER_CREE` dans `dossiers_journal`, **append-only** : aucun
      chemin de code ne met à jour ni ne supprime une entrée existante.
- [ ] **AC-18** — `dossier.created` est déposé **dans la transaction** en `outbox_events` et publié par
      le relais **après** commit — jamais avant. Payload en **état absolu**, avec `eventId` et
      `schemaVersion`, **sans secret**.
- [ ] **AC-19** — Si le commit échoue, **aucun** événement n'est publié — vérifié en docker
      (`outbox_events` vide, `dossiers` vide).
- [ ] **AC-20** — Le caractère **inerte** du hook est testé : aucun consommateur de `dossier.*` n'est
      déclaré dans le dépôt à ce stade, et c'est **assumé**, pas oublié.

---

## Notes techniques

### Schéma (extrait)

```ts
@Schema({ collection: 'dossiers', timestamps: true })
export class Dossier {
  /** Cabinet propriétaire — **issu du JWT**, jamais d'un paramètre client. */
  @Prop({ type: Types.ObjectId, required: true }) orgId!: Types.ObjectId;

  @Prop({ required: true }) raisonSociale!: string;
  @Prop({ type: String, enum: Object.values(FormeJuridique), required: true })
  formeJuridique!: FormeJuridique;
  @Prop({ required: true }) pays!: string;                    // ISO-2 majuscules
  @Prop({ type: String, enum: Object.values(TypeEntite), required: true })
  typeEntite!: TypeEntite;

  @Prop() nifSociete?: string;                                // unicité ⇒ STORY-354
  // … reste de l'identité fiscale (saisie progressive)

  @Prop({ type: String, enum: Object.values(SystemeComptable) }) systemeComptable?: SystemeComptable;
  @Prop({ type: String, enum: Object.values(RegimeFiscal) })    regimeFiscal?: RegimeFiscal;

  @Prop({ type: String, enum: Object.values(StatutDossier), required: true, default: StatutDossier.ACTIF })
  statut!: StatutDossier;

  /** D1 — posé **uniquement** par le consumer `identity.org.created`, jamais par l'API. */
  @Prop({ type: Boolean, required: true, default: false }) estLeCabinet!: boolean;

  @Prop({ type: Number, required: true, default: 1, min: 1 }) version!: number;
}

// D1 — l'index est le VRAI filet : un pré-contrôle perd toute course concurrente.
DossierSchema.index(
  { orgId: 1 },
  { unique: true, partialFilterExpression: { estLeCabinet: true } },
);
```

- ⚠️ **`partialFilterExpression`, pas un index plein** : un unique sur `{ orgId }` seul rejouerait
  exactement le défaut qu'on est en train de corriger — un seul dossier par organisation.
- Le journal et l'outbox s'écrivent **dans la transaction** de l'écriture métier ; les `ObjectId` sont
  **pré-générés** pour que le journal cite le dossier avant son insertion, et l'`abort` est **gardé**
  (patron `.agents/rules/transactions-mongo.md`).
- Le contrat `dossier.*` vit dans un fichier dédié (`kafka/outbox/dossier-events.ts`), sur le modèle
  d'`identity-events.ts` : **enum de topics** + interfaces `…V1`. ⚠️ Piège connu du projet — côté
  consommateur, `Object.values(DossierTopic)` abonne automatiquement le consumer group : la synchro
  producteur ↔ consommateur se fera **dans le même sprint** que 236/357/358.
- ⚠️ **Angle mort de la couverture** : `collectCoverageFrom` exclut `*bootstrap*.ts` — c'est là que
  les trois bugs du round-trip Kafka de STORY-076/108 sont restés cachés. **Aucune logique du
  consumer « Mon cabinet » ne doit vivre dans un fichier `*bootstrap*`.**

### Frontière d'*ownership*

`auth-service` possède l'**identité de compte** (`Organization.name`, `status`) ;
`dossier-service` possède le **dossier**. `raisonSociale` **n'est pas** une réplication du `name` de
compte — c'est la dénomination légale déclarée à la DSF, donnée propre, ni synchronisée ni écrasée
depuis `identity.*` après la création initiale de « Mon cabinet ». Même frontière que celle déjà tenue
par `ProfilSociete`.

---

## Dépendances

**Prérequises :** **STORY-006** *(rôles)* · **STORY-076/108** *(round-trip Kafka, outbox + consumer
idempotent — patron)* · **STORY-109** *(CORS)* · `identity.org.created` *(livré)*.

**Débloque :** **toute EPIC-043** — 353, 354, 304, 302, 355, 356, 236, 357, 358, 303, 359, 360 — et par
elles le bloc frontend `FE-EPIC-008` (FE-059 → FE-069), entièrement `blocked` sur cette story.

---

## Definition of Done

- [ ] Lint **0 warning** · build OK · couverture ≥ **65 / 90 / 90 / 90**, **service neuf ⇒ 100 % par
      fichier** sur les sources livrées.
- [ ] Unit + **e2e** verts : création, saisie progressive, refus sans mandat, `orgId` non usurpable,
      absence de `DELETE`, `estLeCabinet` immuable, démarrage dégradé.
- [ ] **Vérification docker réelle** (stack neuve `down -v`, JWT **RS256** réels) : documents
      effectivement écrits dans `dossiers` et `dossiers_journal`, **liens** entre les deux, **aucun
      orphelin après échec**, `outbox_events` cohérent avec le commit, « Mon cabinet » créé à
      l'activation d'une org fraîche et **non dupliqué** au rejeu. Consignée dans *Progress Tracking*.
- [ ] **Mutation-tests** rouges sur les gardes qui protègent d'une régression précise : retrait de
      l'index partiel (doublon « Mon cabinet »), `orgId` lu du corps, journal écrit hors transaction,
      attestation rendue facultative.
- [ ] Endpoints documentés dans **Swagger**.
- [ ] `/code-review` + `/security-review` — la story ouvre une **surface HTTP neuve** et un **bus
      d'événements neuf**.

---

## Story Points Breakdown

- Scaffold du service (config validée, guards, health, CORS, Docker, CI) : **2 pts**
- Modèle `Dossier` + enums + DTO + validations variables selon forme juridique : **1,5 pt**
- `POST /dossiers` + attestation de mandat + journal append-only transactionnel : **2 pts**
- Consumer `identity.org.created` + « Mon cabinet » idempotent (index partiel) : **1,5 pt**
- Contrat + outbox `dossier.*` : **0,5 pt**
- e2e + vérification docker + mutation-tests : **0,5 pt**
- **Total : 8 points**

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | 2026-08-13 |
| Développement | ⏳ | |
| Validation (DoD) | ⏳ | |
| Vérification docker | ⏳ | |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | |
| Clôture | ⏳ | |
