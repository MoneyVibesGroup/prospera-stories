# Story PRA-04 : Le client d'API unique : `creerClient(code)`, les refus nommés, l'erreur qui se retrouve

Status: done — 🏁 **2026-11-25** : `MoneyVibesGroup/prospera-app` **#4** (`dev` `2ff4707`) ; tsc 0, lint 0, Vitest 15 fichiers / 101 tests, build vert, budget 147 055 / 152 123 octets gzip, CI GitHub verte ; 40 mutations rouges. AC-1 → AC-7 prouvés (écarts : `RequeteAnnulee`, types d'`auth` depuis la copie du contrat, tus joué sur une pile fausse). Voir « Livraison » en bas de fiche. *(Créée le 2026-11-24, plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`.)*

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S4 · **Points :** 3
**Dépôt :** `prospera-app` (dossier `src/coque/api/`)
**Spine :** AD-8 (client unique, `creerTeleversement`), AD-9 (refus de droit d'utiliser), AD-18 (`creerClientPublic`), AD-24
**Dépend de :** PRA-03 (le jeton en mémoire). **Débloque :** PRA-05.

---

## User Story

**En tant que** module d'écran,
**je veux** un seul moyen d'appeler mon service, qui ajoute le jeton, le préfixe et l'identifiant de corrélation et
qui sait quoi faire d'un refus de droit d'utiliser,
**afin de** n'écrire ni URL de service, ni gestion du 401, ni capture de `403 <MODULE>_NOT_ENTITLED`.

## Périmètre

**DANS le périmètre :**

1. **`creerClient(code)`** : préfixe `/api/<code>/v1`, jeton de la session (PRA-03), `X-Request-Id` neuf par appel,
   **une seule reprise sur 401**, partagée par toutes les requêtes en vol (la reprise de PRA-03), puis échec.
2. **Les refus de droit d'utiliser** (AD-9) : `403 <MODULE>_NOT_ENTITLED` et `403 ABONNEMENT_EXPIRE` annulent la
   requête **sans rejeu ni message**, et demandent une relecture de l'état publié, **au plus une par rafale de 5 s**.
   PRA-05 branche la relecture ; ici, un point d'accroche (`surRefusDeDroit`) et son test suffisent.
3. **`ApiError`** : statut, code nommé, message du serveur (jamais affiché tel quel), `X-Request-Id`. Tout autre
   refus (par exemple `CONSENTEMENT_RESERVE_AU_DG`) reste une `ApiError` que l'écran traduit.
4. **`creerClientPublic(code)`** : même préfixe, sans jeton, pour les écrans publics (AD-18).
5. **`creerTeleversement(code)`** : `tus-js-client` 4.3.x, qui emprunte au client le jeton, le préfixe et la reprise
   sur 401 (spine de la Reprise, AD-15).
6. **`signaler(erreur)`** : journal structuré (console JSON aujourd'hui), point d'entrée unique pour un collecteur
   plus tard (AD-24). `<ErreurApi>` du kit affiche le message traduit et l'identifiant de corrélation.
7. **Types générés** : un script `npm run contrats` qui génère les types d'un service depuis son OpenAPI
   (`openapi-typescript` 7.13.x), jamais écrits à la main (AD-15). Premier usage : `auth`.

**HORS périmètre :** la lecture de l'état publié (PRA-05) ; les écrans.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Un appel par `creerClient('reseau')` part sur `/api/reseau/v1/…` avec `Authorization` et un `X-Request-Id` | Vitest (MSW ou fetch simulé) |
| AC-2 | Trois requêtes qui reçoivent un 401 en même temps déclenchent **une** reprise et sont rejouées une fois ; un second 401 donne une `ApiError` | Vitest |
| AC-3 | `403 RESEAU_NOT_ENTITLED` : pas de rejeu, pas d'`ApiError` remontée à l'écran, une demande de relecture ; cinq refus en 2 s ⇒ **une** demande | Vitest (horloge simulée) |
| AC-4 | `403 CONSENTEMENT_RESERVE_AU_DG` remonte en `ApiError` avec son code | Vitest |
| AC-5 | `<ErreurApi>` affiche le message traduit du code et l'identifiant de corrélation, jamais le texte brut du serveur | Testing Library |
| AC-6 | Aucune URL de service (`http://`, `:30xx`) n'apparaît dans `src/` | test de recherche dans la CI |
| AC-7 | `creerTeleversement` envoie un fichier par tus avec le jeton et reprend une fois sur 401 | Vitest |

## Notes pour le développeur

- Piège déjà payé : un `queryFn` qui résout `undefined` est une requête **en erreur** pour TanStack Query. Le client
  rend toujours une valeur ou lève.
- Le client de l'app expert-comptable (`src/lib/api/`) est la base ; il ne connaît pas les refus nommés : c'est le
  seul vrai ajout.

## Fini quand

AC-1 → AC-7 prouvés, PR fusionnée, fiche à `done`, journal de A à jour avec PRA-05.

## Livraison (2026-11-25)

**Code :** `MoneyVibesGroup/prospera-app` **#4**, fusionnée en Rebase and merge (`headRefOid` `7bb2c1f`, `mergedAt` 2026-11-25T04:21:16Z) ; `dev` = `2ff4707`. CI verte (lint, tsc, Vitest, build, budget).

**Posé** (`src/coque/api/`, un fichier par rôle, **pas de barrel** : importer fichier par fichier) :
`client.ts` (`creerClient`, `creerClientPublic`, `ClientApi` : `get`/`post`/`put`/`patch`/`supprimer`/`requete`/`envoyer`/`url`), `erreur.ts` (`ApiError`, `RequeteAnnulee`), `refus.ts` (`estRefusDeDroit`, `surRefusDeDroit`, `demanderRelectureEtat`, `DELAI_RAFALE_MS`), `signaler.ts` (`signaler`, `brancherCollecteur`), `televersement.ts` (`creerTeleversement`), `requetes.ts` (`creerQueryClient`, branché dans `FournisseursCoque`), `types/auth.ts` (généré). Hors de ce dossier : `<ErreurApi erreur>` (`src/coque/ui/erreur-api.tsx`, messages `ui.erreur.codes.*` et `ui.erreur.statuts.*` de `fr.json`), `outils/contrats/generer.mjs` (`npm run contrats -- auth`), `contrat/auth/moi-droits.openapi.json`, `tus-js-client` ^4.3.1 et `openapi-typescript` ^7.13.0.

### Preuves

| AC | Preuve |
|:--:|---|
| AC-1 | `client.test.ts` : `creerClient('reseau').get('/organisations/42')` part sur `/api/reseau/v1/organisations/42` avec `Authorization: Bearer T1` ; deux appels, deux `X-Request-Id` différents ; un 204 rend `null`, jamais `undefined` ; un chemin qui est une adresse (`https://…`, `//…`) ou qui ne commence pas par `/` lève `TypeError` sans appel réseau. |
| AC-2 | `client.test.ts` : trois `get` en 401 ensemble ⇒ **1** `fetch` de `/coque/session/rafraichir`, 6 appels au service (3 + 3 rejeux, tous avec le jeton neuf) ; second 401 ⇒ `ApiError` 401, 1 rafraîchissement, 2 appels ; session finie (rafraîchissement refusé) ⇒ `ApiError` 401 sans rejeu ; **401 tardif** d'une requête partie avec l'ancien jeton alors que la session a déjà un jeton neuf ⇒ rejeu sans second rafraîchissement ; le rejeu garde le même `X-Request-Id`. |
| AC-3 | `client.test.ts` : `403 {code:'RESEAU_NOT_ENTITLED'}` ⇒ `RequeteAnnulee` (pas une `ApiError`), 1 seul `fetch`, 1 relecture ; idem `ABONNEMENT_EXPIRE` (code lu dans `message` aussi) ; **cinq refus en 2 s (horloge simulée) ⇒ 1 relecture**, une nouvelle après 5 s ; un 403 d'un autre code (`KYC_NOT_APPROVED`) ou un 400 portant `RESEAU_NOT_ENTITLED` ne sont pas des refus de droit. |
| AC-4 | `client.test.ts` : `403 CONSENTEMENT_RESERVE_AU_DG` ⇒ `ApiError` (statut 403, code, texte du serveur gardé à part), aucune relecture. |
| AC-5 | `erreur-api.test.tsx` (Testing Library) : le message traduit du code et « Référence à communiquer au support : req-9f2c » ; le texte brut du serveur n'est **pas** dans le DOM ; sans code connu, le message du statut ; une `Error` quelconque ⇒ message générique sans fuite ; une `RequeteAnnulee` ne rend rien. |
| AC-6 | `aucune-url.test.ts` (dans `npm test`, donc dans la CI) : lit tout `src/` hors tests et types générés, commentaires retirés, et refuse `https?://` et `:3xxx`. Le détecteur a son propre test (il reconnaît une adresse, ignore un commentaire). |
| AC-7 | `televersement.test.ts` : le vrai `tus-js-client` sur une pile HTTP fausse qui joue le protocole (création `POST` 201 + `Location`, `PATCH` 204) : `Authorization` et un `X-Request-Id` **différent** par requête, création sur `/api/reprise/v1/fichiers`, suite sur `/api/reprise/v1/fichiers/abc` (la `Location` du service, `/api/v1/…`, est ramenée sous le préfixe) ; 401 ⇒ **un** rafraîchissement puis l'envoi reprend avec le jeton neuf et aboutit ; second 401 ⇒ `ApiError` 401, 2 requêtes ; session finie ⇒ `ApiError` 401 sans rejeu ; `403 REPRISE_NOT_ENTITLED` ⇒ `RequeteAnnulee`, 1 requête, 1 relecture. |
| Périmètre 6 | `signaler` : une ligne JSON sur la console (`niveau`, `nom`, `statut`, `code`, `idCorrelation`, `pile`), ou le collecteur branché ; appelé sur panne réseau (`ApiError` statut 0, code `ERREUR_RESEAU`), sur 5xx, sur corps de succès illisible (`REPONSE_ILLISIBLE`) ; pas sur un 4xx attendu (testé). |
| Périmètre 7 | `contrats.test.ts` : le fichier commité `src/coque/api/types/auth.ts` est, à l'octet, la sortie de `generer('auth')` ; un service inconnu est une erreur ; les types se consomment (`components['schemas']['DroitsDuMembre']`). |
| Cache | `requetes.test.ts` : fraîcheur 30 s, mutations jamais rejouées, pas de reprise sur `RequeteAnnulee` ni sur un 4xx, deux reprises au plus sur une panne (statut 0, 5xx). |

**Chiffres :** `tsc` 0 ; `eslint` 0 ; Vitest **15 fichiers / 101 tests** (suite complète rejouée sur le dernier commit, 61 → 101) ; `next build --webpack` vert ; budget **147 055 octets gzip** pour 152 123 (+154 octets sur PRA-03 : `tus-js-client` n'entre que dans les modules qui l'importent) ; `npm ci --dry-run` propre.

**Mutations** (violation posée, rouge constaté, retirée) : **40/40 rouges** (1 à 5 tests rouges chacune) + la preuve d'AC-6 (une `http://localhost:3001` ajoutée dans `constantes.ts` rougit, retirée). Par règle : préfixe sans `v1`, `Authorization` non posée, `X-Request-Id` absent ou constant, 204 rendu en `undefined`, adresse acceptée à la place d'un chemin ; aucune reprise sur 401, rafraîchissement non partagé, seconde reprise après un second 401, 401 tardif qui rafraîchit quand même, rejeu sans le jeton neuf ; `NOT_ENTITLED` ou `ABONNEMENT_EXPIRE` non reconnus, refus remonté en `ApiError`, aucune relecture, pas de rafale, rafale jamais refermée, refus rejoué, tout 403 traité en refus de droit, code perdu dans l'`ApiError` ; message d'erreur = texte du serveur, corrélation perdue, panne réseau non signalée ; client public qui envoie le jeton ou rejoue le 401 ; `<ErreurApi>` qui affiche le texte du serveur, sans corrélation, qui montre un refus de droit ; cache qui rejoue un refus de droit, fraîcheur retirée ; tus : jeton non posé, préfixe perdu, `Location` non ramenée, pas de reprise, reprises sans limite, rejeu malgré session finie, `X-Request-Id` absent, refus de droit en `ApiError`, refus sans relecture ; fichier généré édité à la main.

### Écarts et ce qui n'est pas prouvé

- **`RequeteAnnulee` plutôt qu'une promesse qui ne se résout jamais.** La fiche dit « annule la requête sans message ». Le client **rejette** avec `RequeteAnnulee` (qui n'est pas une `ApiError`) : une promesse éternelle laisserait fuir la requête et bloquerait `Promise.all`. L'écran n'a rien à faire : `<ErreurApi>` ne rend rien pour elle, et le `QueryClient` ne la rejoue pas. Un module qui écrit son propre `catch` doit laisser passer `RequeteAnnulee` (`instanceof`).
- **Types d'`auth` : copie du contrat, pas l'OpenAPI complet.** Les services Nest servent l'OpenAPI sur `/api/docs-json`, qui n'est pas sous `/api/<code>/v1/` (le proxy ne le route pas) et exige la pile levée. Sans Docker (non exigé par les AC), `npm run contrats -- auth` lit la **copie** `contrat/auth/moi-droits.openapi.json` (contrat `moi/droits` d'`auth-service`, `origin/dev` `b49d8ab`) : un seul chemin, `/api/v1/moi/droits`. `npm run contrats -- auth --depuis-url=<origine>` génère depuis le service qui tourne (code écrit, **non rejoué**). L'adresse n'est jamais dans le dépôt.
- **Le protocole tus n'est pas joué contre un vrai serveur.** AC-7 passe par le vrai `tus-js-client` et une pile HTTP fausse. Aucun service de la pile n'expose encore tus. Hypothèse posée, non vérifiée : un service tus répond `Location: /api/v1/…` ; le client la ramène sous `/api/<code>/v1/…`. Si un service rend une adresse absolue vers une autre origine, elle est laissée telle quelle.
- **tus sous Vitest charge l'entrée « node »** (lecteur de `Buffer`) ; le navigateur charge l'entrée « browser » (lecteur de `Blob`). Non rejoué dans un navigateur.
- **Pas de test e2e sur la pile Docker** : aucune AC n'exigeait Docker, aucun verrou pris. Le client n'a donc pas été joué contre le vrai `auth-service` ni Traefik (le 401, le rafraîchissement et le rejeu le sont contre un `fetch` simulé).
- **Le `X-Request-Id` du rejeu est celui de l'appel** (même identifiant sur les deux tentatives). La fiche dit « neuf par appel » : un rejeu est le même appel.
- **L'identifiant de corrélation d'une `ApiError`** est celui que le serveur a écho (`X-Request-Id`), à défaut celui que le client a posé.
- **Le refus de droit ne s'applique qu'au client authentifié** : `creerClientPublic` n'a ni session, ni reprise, ni relecture d'état (AD-18) ; un `403 …_NOT_ENTITLED` y reste une `ApiError`.
- **Réglage du cache** : `staleTime` 30 s et `retry` (2 au plus, jamais sur 4xx ni `RequeteAnnulee`), mutations jamais rejouées. La fiche ne chiffrait rien ; PRA-05 règle l'état publié par ses propres options (30 s, visibilité de l'onglet).
- `npm install` a aussi changé deux lignes sans rapport du `package-lock.json` (`js-yaml` 4.3.0 → 4.3.2, `graceful-fs` perd `dev: true`).
- Un commentaire de `cookie-refresh.ts` citait `http://*.localhost` : reformulé, sans quoi le test d'AC-6 le lisait.

### Ce que PRA-05 doit savoir

- `import { creerClient } from "@/coque/api/client"` ; `const api = creerClient("instance"); api.get<EtatPublie>("/etat-publie/" + org)` appelle `/api/instance/v1/etat-publie/{org}`. Le client rend toujours une valeur (`null` sur 204) ou lève.
- **La relecture se branche ainsi** : `surRefusDeDroit(() => queryClient.invalidateQueries({ queryKey: ["coque", "etat-publie"] }))` (`@/coque/api/refus`), à poser une fois (le débrancher avec `surRefusDeDroit(null)`). Le client dédoublonne : **au plus un appel par rafale de 5 s**, ne pas ajouter de seconde barrière. La lecture périodique, le retour sur l'onglet et la connexion ne sont pas faits ici : c'est PRA-05.
- Un refus de droit lève `RequeteAnnulee` (`@/coque/api/erreur`) : dans une `queryFn`, ne pas l'attraper. `retry` est déjà réglé (aucune reprise dessus).
- Une `ApiError` porte `statut`, `code`, `idCorrelation`, `messageServeur` (journal, jamais affiché). `<ErreurApi erreur={query.error} onReessayer={…} />` fait le reste ; pour un code nommé nouveau, ajouter `ui.erreur.codes.<CODE>` dans `fr.json`.
- Les erreurs inattendues passent par `signaler(erreur, contexte?)` (`@/coque/api/signaler`) ; `brancherCollecteur(fn)` pour un collecteur.
- `QueryClient` : `staleTime` 30 s par défaut ; l'état publié met `refetchInterval: 30_000` et `refetchIntervalInBackground: false` lui-même.
- Types : `npm run contrats -- <service>` ; pour **ajouter un service**, une ligne dans `SERVICES` de `outils/contrats/generer.mjs` (copie du contrat sous `contrat/<service>/` ou `--depuis-url`). Les chemins des types générés sont ceux **du service** (`/api/v1/…`), pas ceux de l'origine de la coque.
- Un module qui envoie un fichier : `creerTeleversement("reprise").televerser(fichier, { chemin: "/fichiers", metadata, onProgres })` rend `{ promesse, abandonner }`.
- `.env.local` toujours nécessaire en dev (`.env.example`) ; sous Vitest, `fetch` se simule par `vi.stubGlobal("fetch", …)` (voir `client.test.ts`).
