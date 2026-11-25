# STORY-917 : Les recettes croisées sur le point de décision unique ; la console installe par le moteur

Status: done

**Complexité :** moyenne (cinq recettes réordonnées ou réécrites, six routes relayées)

**Épic :** EPIC-144, part de A (D-L2-2) — fusion conjointe avec B-945 (catalogue #55, fusionnée le 2026-11-16)
**Dépôts :** `prospera-recette`, `prospera-admin-panel-service`
**Plage :** groupe A, n° 13 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2).
Fiche écrite pendant le codage (écart à la règle : la demande de B rendait les recettes rouges sur `dev`).

---

## Pourquoi

STORY-945 retire les quatre chemins d'octroi hors du moteur : l'échéance soldée n'ouvre plus rien (le module est
« acquis, à installer » à l'offre), le vertical et la propagation des packages n'ouvrent plus rien, et le `PUT` de la
console passe par un plan `CONSOLE_PUT` joué par le point de décision unique. Les recettes croisées sont rouges sur
`dev` depuis sa fusion (demande de B, journal de B ; `stories/STORY-945.md`, § Fusion).

## Ce que la story livre

1. **Recettes** (`prospera-recette`) :
   - `balance` avant `bilan` (dépendance dure, C1) : `atelier-balance`, `zone-franche`, `referentiel-par-dossier` ;
     `reseau` avant `microfinance` ;
   - `abonnement` (631, 280, 728) : après le paiement, chaque module du contrat est **acquis** à l'offre
     (`GET /api/v1/offres/{org}` : source `abonnement:<id>`, échéance couverte, palier), **aucun droit** n'existe ; le
     moteur l'installe (le `PUT` de la console, dépendances d'abord) et le droit naît `moteur:<plan>` avec le terme,
     l'échéance, le palier et les référentiels payés ;
   - 727 : un package modifié et le vertical d'une organisation **n'ouvrent plus rien** (FR-4) — prouvé par l'absence.
2. **BFF de la console** : l'offre et les plans d'installation relayés —
   `GET/PUT /admin/orgs/{orgId}/offre`, `POST/GET /admin/orgs/{orgId}/installations`,
   `GET …/installations/{planId}`, `POST …/installations/{planId}/reprendre`. Les refus du point de décision traversent
   **projetés** : liste fermée de codes, refus module par module, modules cités, `planId` — jamais le corps amont brut.
   `PUT /admin/orgs/{orgId}/entitlements/{moduleCode}` est **déprécié**.

## Décisions

- **D-917-1 — Le BFF expose le chemin du moteur, il ne réimplémente pas le `PUT`.** Le `PUT` du catalogue passe déjà
  par un plan (STORY-945) ; refaire dans le BFF « offre, plan, attente, relecture du droit » doublerait l'orchestration
  et perdrait la configuration (palier). L'ancienne route reste un relais, dépréciée, tant que la console n'a pas migré
  (D-L2-2) ; la migration des écrans est le lot de D (EPIC-144, écrans `AP-`).
- **D-917-2 — Un plan se lit par son organisation.** `GET …/installations/{planId}` et « reprendre » vérifient que le
  plan appartient à l'organisation de l'URL : sinon `404`, et rien n'est repris.
- **D-917-3 — Les recettes installent par le `PUT` de la console** (chemin servi par le moteur), avec les référentiels
  de l'acquis : c'est le geste de l'opérateur aujourd'hui.

## Critères d'acceptation

- **AC-1** : recettes `pile`, `zone-franche`, `atelier-balance`, `referentiel-par-dossier`, `abonnement` (631, 632,
  649, 650/651, 727, 728) **vertes depuis `dev`**, sur des images reconstruites.
- **AC-2** : un refus `MODULE_DEPENDANCE_MANQUANTE` traverse le BFF avec son code et ses `refus` ; un code hors liste
  ne traverse pas ; un plan d'une autre organisation rend `404`.

## Definition of Done

- [x] BFF : unitaires, lint, `tsc` verts (Node 24, étage `verification`).
- [x] Recettes vertes depuis `dev` (catalogue de 945).
- [x] PR code et docs fusionnées ; demande de B close dans son journal.

## Livraison (2026-11-16)

🏁 **DONE** — prospera-recette #22 (dev `97cf8d7`), admin-panel #35 (dev `f27d10a`). Recettes réordonnées sur les
dépendances du catalogue (balance → bilan → declarations ; reseau → microfinance) ; `abonnement` installe par le moteur
(acquis à l'offre, puis installation). BFF : 527 unitaires sous Node 24 ; six routes d'installation relayées, codes du
moteur en liste blanche. Recettes depuis `dev` vertes (87/87, `abonnement` 15/15 rejouée seule après une pile
recréée). La demande de B (945) est close.

## Correctif du 2026-11-25 — le CORS du BFF annonce `Idempotency-Key` (groupe B, lot 7, ordre « c′ »)

**Demande :** A, AP-55 (journal de A, « → B (25/11, AP-55) : autoriser `Idempotency-Key` dans le CORS du BFF
`admin-panel` », et « Pièges », AP-55 (1)) ; placée par la session de groupe en ordre « c′ » du lot 7 de B, avant c
(D-L7B-7). **Aucun identifiant neuf.** **Dépôt :** `prospera-admin-panel-service` (le BFF), branche `MNV-917-cors`,
commits `MNV-917(admin-panel): …` · **Exécutée par :** groupe B.

**Pourquoi :** cette story a ouvert le relais de `Idempotency-Key` (`POST /admin/orgs/{orgId}/installations`,
`@Headers('idempotency-key')`, relayé au catalogue) sans l'ajouter aux en-têtes annoncés par le CORS du BFF
(`allowedHeaders: Authorization, Content-Type, If-Match`). La console appelle le BFF en cross-origin (`:3110` ⇒
`:3010`) : le préflight d'un `fetch` qui porte l'en-tête est refusé, et le navigateur rend « échec réseau », sans code
et sans une ligne au journal du BFF. Un `curl` ne le voit pas (il n'y a pas de préflight hors d'un navigateur) ; le gate
réel d'AP-55 l'a trouvé, et la console a dû retirer l'en-tête (`installation-client.ts`). C'est le piège d'AP-26
(`If-Match`), une deuxième fois dans ce BFF.

### Où en est-on

- [x] Rituel : plan du lot 7, journaux de A, B, C, D (la demande de A du 25/11 à B, placée en « c′ ») ; le BFF était en
  HEAD détachée sur `origin/dev` (**`911c450`**), propre, sans worktree vivant ; branche `MNV-917-cors` partie
  d'`origin/dev`. Verrou Docker tenu par C (STORY-1020) : non pris.
- [x] Code relu avant d'écrire : `git log -S"idempotency-key"` ne désigne que `f27d10a` (MNV-917) ; inventaire des
  en-têtes lus et émis par le BFF (D-917-6).
- [x] Code, preuves sous Node 25 (unitaires, e2e, lint, `tsc`, build, mutations, BFF construit démarré).
- [x] « ⚠ Contrats » du journal de B annoncé avant la fusion du code (cette PR de docs ; PR de code #44).
- [ ] PR de code fusionnée en rebase ; SHA rejoué sur `dev`.
- [ ] PR de docs finale (fiche, tracker, journal de B).

### Décisions retenues par défaut (contestables)

- **D-917-4 — Le correctif se rattache à STORY-917, pas à STORY-1080.** C'est 917 qui a ouvert le relais de l'en-tête
  (`f27d10a` : `@Headers('idempotency-key')` au contrôleur, `lancerInstallation(…, cleIdempotence)` au client du
  catalogue) ; STORY-1080 n'a ajouté qu'une lecture sans en-tête neuf (`GET …/etat-publie`). Même geste qu'AP-26 pour
  `If-Match` : l'en-tête se corrige chez la story qui l'a fait lire.
- **D-917-5 — La configuration CORS vit dans `configurerCors` (`src/common/utils/cors.util.ts`), que `main.ts` et les e2e
  appellent tous les deux, et un garde lit les sources.** L'e2e de STORY-173 recopiait la configuration de `main.ts`
  (« volontairement non factorisé », patron STORY-109 commun aux autres services) : une recopie peut s'écarter de ce qui
  tourne sans que le test rougisse. Le patron de `configurerProxysDeConfiance` (STORY-133) est le bon : une fonction,
  un appel dans `main.ts`, le même dans le test. Le garde (`cors.util.spec.ts`) relève tout `@Headers(nom)` d'un
  contrôleur et tout `headers[nom]` d'un middleware : il rougit dès qu'un en-tête lu n'est pas annoncé. C'est ce qui
  aurait arrêté 917. Les autres services gardent leur patron : rien n'y change.
- **D-917-6 — Inventaire : deux en-têtes de requête et un en-tête de réponse de plus, rien d'autre.** Lus par le BFF
  au 25/11 : `authorization` (56 lectures `@Headers`), `if-match` (3, KYC), `idempotency-key` (1, installation), `x-request-id`
  (`ClsModule` et `nestjs-pino`, la corrélation des journaux). **`X-Request-Id` entre dans la liste** : le BFF le lit et
  le garde dans ses journaux, la console peut vouloir nommer ses appels, et l'annoncer ne donne rien de plus qu'à un
  appel serveur. Il n'est pas relayé aux amont, et rien ne change à ce sujet. Émis : les relais ne recopient **aucun**
  en-tête d'un amont (`res.status` seulement, jamais `res.set`) ; le garde de débit du BFF (`@nestjs/throttler` 6.5,
  `setHeaders` vrai par défaut) pose `X-RateLimit-Limit`, `-Remaining` et `-Reset` sur chaque réponse, et `Retry-After`
  sur son `429`. **`Retry-After` est exposé** : c'est le seul moyen pour la console de dire « réessayez dans N s » au
  lieu de deviner. **Les `X-RateLimit-*` ne le sont pas** : aucun lecteur, et un compteur par adresse IP, derrière des
  proxys, n'a pas de sens pour l'opérateur. `ETag` est servi dans le corps (`etag`, STORY-182), pas en en-tête : rien à
  exposer.
- **D-917-7 — Sans Docker.** Aucun module Nest, aucune dépendance, aucun Dockerfile ne change. `main.ts` change, et le
  test e2e ne le voit pas : la preuve est le BFF construit (`dist/main.js`), démarré localement contre un JWKS et un
  faux catalogue, avec un préflight puis un `POST` d'installation qui porte l'en-tête, et une contre-épreuve sur
  `origin/dev`. Verrou non pris (tenu par C).
- **D-917-8 — Ce qui reste à A.** La console décide si elle remet `Idempotency-Key` sur le lancement d'une installation
  (le catalogue déduplique la demande sans lui, journal de A) ; une clé par geste de l'opérateur, rejouée telle quelle
  en cas de doute réseau, rend le même plan (`200`). Le `PUT` d'octroi unitaire reste côté console jusqu'au n° 11 de B
  (journal de A) : ce correctif n'y touche pas.
