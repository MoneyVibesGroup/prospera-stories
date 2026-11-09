# STORY-643 : La garde de câblage dans les dépôts qui ne l'avaient pas — une suite verte veut dire que l'application DÉMARRE

Status: review

**Bloc :** Convergence E0 — le substrat de recette (`CONVERGENCE-RAILS-C-D-2026-09-08.md`, § 1)
**Points :** 5
**Services :** `auth-service`, `kyc-service`, `admin-panel`
**Branches :** `MNV-643` dans les trois dépôts, base `origin/dev`.

La fiche n'avait jamais été écrite. Elle l'est à la livraison, le 2026-11-09.

**Récit :** en tant qu'**équipe**, je veux qu'une suite verte signifie que l'application démarre,
afin de ne plus livrer un module qui ne boote pas.

**Pourquoi :** au gate Docker du 2026-09-07, 5 703 tests étaient verts et deux services ne
démarraient pas (`UnknownDependenciesException`). Aucun test ne monte `AppModule` : les e2e
assemblent leurs propres modules et les unitaires construisent les services à la main.

## Où en était la garde

La fiche de convergence vise cinq dépôts. Deux l'avaient déjà :
- `prospera-paiement-service` : `src/app-cablage.invariant.spec.ts`, posée par le correctif de
  `RoutageModule` (AC-6 de la convergence, parti de `origin/dev` et fusionné seul) ;
- `platform-catalog-service` : posée par STORY-279, puis complétée par 280 et 727.

Les trois autres (`auth`, `kyc`, `admin-panel`) ne l'avaient pas. C'est le périmètre de cette
livraison.

## Critères d'acceptation

- [x] AC-1 — Chaque dépôt porte `src/app-cablage.invariant.spec.ts`. `NestFactory.create(AppModule,
      { preview: true })` résout tout le graphe **sans instancier** Mongo, Redis, BullMQ, Kafka, MinIO
      ni les minuteries d'outbox. La garde interroge aussi, avec `application.get`, les pièces que le
      démarrage exerce en premier :
  - auth : `AuthService`, `SigningKeyService`, `OutboxRelayService` ;
  - kyc : `KycDocumentsService`, `DocumentExtraitConsumer`, `OutboxRelayService` ;
  - admin-panel : `JwtRelayService`, `CatalogServiceClient`, `OrgActionsService`.
- [x] AC-2 — `abortOnError: false` est posé. Sans lui, Nest appelle `process.exit(1)` et jest ne
      rend que « process.exit called with 1 ».
- [x] AC-3 — La garde pose son propre décor d'environnement. Ce sont les seules variables
      obligatoires de chaque `env.validation.ts`, avec les valeurs du compose racine :
  - auth : `MONGODB_URI`, `REDIS_HOST`, `KAFKA_BROKERS`, `JWT_REFRESH_SECRET`,
    `PASSWORD_RESET_URL_TENANT`, `PASSWORD_RESET_URL_PLATFORM` ;
  - kyc : `MONGODB_URI`, `KAFKA_BROKERS`, `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE` ;
  - admin-panel : `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE` et les trois URL amont.

      `app.module` est importé **après** (`await import`), et l'environnement est restauré en fin de
      suite.
- [x] AC-4 — Contre-épreuve : on retire un import connu, et la garde rougit avec l'exception exacte
      que le conteneur afficherait.

      | Dépôt | Import retiré | Message de la garde |
      |---|---|---|
      | auth | `MailModule` de `AuthModule` | `Nest can't resolve dependencies of the AuthService (…) — "BullQueue_auth-notification" at index [1]` |
      | kyc | `DocumentExtractModule` de `KycModule` | `… of the KycAdminService (…) — DocumentExtractionAssistReadModel at index [4]` |
      | admin-panel | `UpstreamModule` de `AdminModule` | `… of the OrgAggregationService (…) — AuthServiceClient at index [0]` |

- [x] AC-5 — Les applications démarrent réellement (pile `recette728`, images construites depuis
      `origin/dev`, volumes neufs, 2026-11-09). Chaque journal affiche
      `Nest application successfully started` :
  - auth, kyc, catalogue, paiement et notification, dans la pile de recette ;
  - admin-panel, construit depuis `MNV-643` et ajouté à la même pile : `healthy`, `/api/v1/health`
    rend 200.
- [x] AC-6 — Sans objet ici : le correctif du paiement est déjà sur `dev`.

## Preuves

- `auth-service` `MNV-643` (`28469e3`), `kyc-service` `MNV-643` (`d6140d5`), `admin-panel`
  `MNV-643` (`a149807`) : un seul fichier ajouté par dépôt ; la garde est verte, lint et `tsc`
  propres.
- Durée sur ce poste : 46 à 123 s au premier passage (cache de `ts-jest` froid, pile Docker en
  marche), 2 à 7 s une fois le cache chaud (contre-épreuves). Le délai du test est de 60 s, comme
  au catalogue. ⚠️ Le premier passage d'auth (123 s) l'a dépassé **sans** expirer. L'explication
  probable, non vérifiée : la compilation synchrone des imports tardifs retient la minuterie. À
  surveiller sur une CI à froid ; si la garde y expire, relever le délai.

## Piège payé pendant la livraison

⛔ **Une mutation qui ne compile pas ressemble à une garde qui marche.** La première contre-épreuve ne
commentait que l'entrée du tableau `imports`. `noUnusedLocals` rend alors une erreur
`TS6133: 'MailModule' is declared but its value is never read`, et le test rougit. Le message de
`TSError` est fait de codes ANSI, donc jest l'affiche **vide**. Il faut commenter **aussi** la ligne
`import`, puis lire le message : il doit nommer un fournisseur, pas un fichier.

## Notes

Voir [[STORY-279]], [[STORY-644]], [[STORY-645]], [[STORY-646]], [[STORY-728]].
