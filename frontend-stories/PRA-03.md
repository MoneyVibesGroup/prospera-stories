# Story PRA-03 : La session, la configuration d'exécution, la sécurité du serveur Next

Status: done — 🏁 **2026-11-25**, **hors les écrans de `(auth)`** : `MoneyVibesGroup/prospera-app` **#3** (`dev` `647d336`) ; tsc 0, lint 0, Vitest 9 fichiers / 61 tests, CI verte, budget `/accueil` 146 901 octets gzip (budget 152 123), 13 mutations rouges, e2e 3/3 sur la pile réelle. **AC-0 et AC-7, périmètre 0 et 6 NON faits** : les écrans attendent une maquette validée par l'utilisateur (story de suite à nommer). Voir « Livraison » en bas de fiche. *(Créée le 2026-11-24, plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`.)*

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S4 · **Points :** 5
**Dépôt :** `prospera-app` (dossiers `src/app/(auth)/`, `src/app/coque/`, `src/coque/securite/`)
**API :** `auth-service` (`/api/auth/v1/…` derrière le Traefik de PRA-02), connexion et rafraîchissement comme l'app expert-comptable
**Spine :** AD-10, AD-11, AD-12 (marque d'essai sur la connexion), AD-17, AD-19, convention « Session »
**Dépend de :** PRA-01, PRA-02. **Débloque :** PRA-04.

---

## User Story

**En tant qu'**utilisateur d'une organisation cliente,
**je veux** me connecter à la coque, rester connecté sans ressaisir mon mot de passe, et me déconnecter proprement,
**afin d'**ouvrir mes modules sur le bon espace (essai ou réel), sans que mon jeton puisse être volé par un script.

## Périmètre

**DANS le périmètre :**

0. **Maquette d'abord** (règle n° 1 des écrans) : un prototype neuf `prototypes/prospera-app-prototype.html`, publié
   sur son Artifact et **validé par l'utilisateur avant le code**, avec les écrans génériques de la coque :
   connexion (marque Prospera, et marque d'essai en `ESSAI`), invitation, mot de passe oublié, **les écrans d'état**
   de PRA-06 et **les bandeaux** de PRA-07. Une seule validation couvre PRA-03, PRA-06 et PRA-07. Critère :
   « parcours facile même pour un paresseux » (un geste principal, rien à lire, zéro jargon).
1. **Les routes de session sous `/coque/session/*`** (patron BFF de l'app expert-comptable, déplacé de
   `/api/auth/*`) : ouvrir, rafraîchir, fermer. Le serveur Next n'appelle **que** `auth`, par
   `PROSPERA_PROXY_URL_INTERNE` (AD-11). Il reporte le `User-Agent` du navigateur sur les routes qui ouvrent une
   session. Le rafraîchissement est **sérialisé** (une seule reprise en vol).
2. **Le jeton** : access en mémoire seulement ; refresh en cookie `HttpOnly`, `Secure`, `SameSite=Strict`, sans
   `Domain`, `Path=/coque/session` (AD-19). Routes de session en `POST` seulement, avec un en-tête propre à la coque
   (CSRF).
3. **La configuration d'exécution** `/coque/config` (AD-10) : `espace` (`ESSAI` | `REEL`), `autreEspaceUrl`
   (absente si l'organisation n'a pas d'autre espace), identifiant de déploiement, lus dans l'environnement **à la
   requête**. Aucune `NEXT_PUBLIC_*` propre à une instance.
4. **La santé** `/coque/sante`.
5. **Les en-têtes de sécurité** : CSP à nonce (`frame-ancestors 'none'`), HSTS, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`, posés par `proxy.ts`.
6. **Les écrans `(auth)`** : connexion, invitation, mot de passe, selon la maquette validée, avec la marque d'essai
   en `ESSAI` (AD-12 : sur chaque écran, connexion comprise).
7. **Changer d'organisation ou se déconnecter** vide tout le cache (`queryClient.clear()`, AD-17).

**HORS périmètre :** le client d'API des modules (PRA-04), la lecture de l'état publié et le contrôle « espace lu ≠
configuration » (PRA-05).

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-0 | La maquette est publiée et validée par l'utilisateur (lien de l'Artifact dans la fiche) | lien + validation dans le journal |
| AC-1 | Connexion par `:8080` : le refresh est posé en cookie avec les six attributs d'AD-19 ; l'access n'apparaît ni dans `localStorage` ni dans `sessionStorage` | Playwright (inspection des cookies et du stockage) |
| AC-2 | Deux requêtes qui reçoivent un 401 en même temps ne déclenchent **qu'un** rafraîchissement | Vitest sur la session |
| AC-3 | `/coque/session/*` refuse un `GET` et un `POST` sans l'en-tête de la coque | Vitest des route handlers |
| AC-4 | `auth-service` reçoit le `User-Agent` du navigateur, pas celui de Node | journal d'auth ou test |
| AC-5 | `/coque/config` rend `espace = ESSAI` sur `essai.localhost:8080` et `REEL` sur `reel.localhost:8080`, sans rebuild, selon l'environnement | `curl` sur les deux hôtes |
| AC-6 | Les cinq en-têtes de sécurité sont présents sur `/accueil` et sur la connexion | `curl -I` |
| AC-7 | En `ESSAI`, l'écran de connexion porte la marque d'essai et le titre d'onglet commence par `[ESSAI]` | Playwright |
| AC-8 | La déconnexion vide le cache de TanStack Query et le cookie | Vitest + Playwright |

## Notes pour le développeur

- Relire avant de coder : la mémoire « BFF masque le navigateur » (reporter le `User-Agent` sur les routes qui ouvrent
  une session) et les pièges Next 16 (`cookies()` asynchrone, `proxy.ts`).
- Un dossier préfixé `_` est **privé** dans Next : les route handlers vivent sous `src/app/coque/…`, jamais sous
  `src/app/_x` ni sous `/api/`.
- Les quotas de l'IdP en e2e : réutiliser l'état de session de Playwright plutôt que de se reconnecter à chaque test.

## Fini quand

AC-0 → AC-8 prouvés, PR fusionnée, fiche à `done`, journal de A à jour avec PRA-04.

---

## Livraison (2026-11-25)

**Code :** `MoneyVibesGroup/prospera-app` **#3**, fusionnée en Rebase and merge (`headRefOid` `f9161f0`, `mergedAt` 2026-11-25T03:51:51Z) ; `dev` = `647d336`. CI verte (lint, tsc, Vitest, build, budget).

**Posé.** `src/proxy.ts` (CSP à nonce, HSTS, nosniff, Referrer-Policy) ; `src/app/coque/session/{ouvrir,rafraichir,fermer,accepter-invitation}/route.ts` (POST seulement) ; `src/app/coque/config` et `sante` ; `src/coque/securite/` : `constantes`, `entetes`, `csrf` (en-tête `x-prospera-coque: 1` + contrôle d'`Origin`), `cookie-refresh` (`prospera_refresh`), `amont-auth` (seul appel sortant : `auth` par `PROSPERA_PROXY_URL_INTERNE`, `/api/auth/v1/auth/*`), `session-serveur`, `configuration`, et côté navigateur `gestionnaire-jeton` (access en mémoire, rafraîchissement sérialisé, plafond du `setTimeout`), `claims`, `client-session`, `fournisseur-session` (`FournisseursCoque` = `QueryClientProvider` + session, monté dans le layout racine). `.env.example` : `PROSPERA_ESPACE`, `PROSPERA_DEPLOIEMENT_ID`, `PROSPERA_AUTRE_ESPACE_URL`, `PROSPERA_PROXY_URL_INTERNE`.

### Preuves

| AC | Preuve |
|:--:|---|
| AC-0 | **NON FAIT** : aucune maquette `prototypes/prospera-app-prototype.html`, rien de validé. Accord de la session principale (25/11) : livrer la mécanique sans les écrans, ne pas inventer de maquette. |
| AC-1 | e2e Playwright `e2e/session.spec.ts` sur la pile `grp-a` (Traefik :8080, vrai `auth-service`) : connexion par `essai.localhost:8080/coque/session/ouvrir` ; cookie `prospera_refresh` : `httpOnly`, `secure`, `sameSite=Strict`, `path=/coque/session`, domaine `essai.localhost` (sans point : pas de `Domain`), expiration à 7 jours ; la réponse ne contient pas `refreshToken` ; ni l'access ni le cookie ne sont dans `localStorage`, `sessionStorage` ni `document.cookie` ; `reel.localhost` n'a pas le cookie. Vitest : mêmes attributs sur `cookies().set`. |
| AC-2 | `gestionnaire-jeton.test.ts` : trois `rafraichirJeton()` simultanés = **un** `fetch`. |
| AC-3 | `routes.test.ts` : chaque route n'exporte que `POST` (Next répond 405) ; sans l'en-tête (ou avec une valeur fausse, ou une `Origin` étrangère) : 403, `auth` non appelé, aucun cookie. Par :8080 : `GET` 405, `POST` sans en-tête 403. |
| AC-4 | Vitest : `User-Agent` du navigateur dans l'appel à `auth` (connexion et acceptation d'invitation). **Pile réelle** : `GET /api/auth/v1/users/me/sessions` rend un `userAgent` contenant `Chrome`, pas `node`. |
| AC-5 | **Un seul build**, deux processus `next start` (`PROSPERA_ESPACE=ESSAI` sur :3200, `REEL` sur :3201) : `curl essai.localhost:8080/coque/config` rend `{"espace":"ESSAI","autreEspaceUrl":"http://reel.localhost:8080/","deploiementId":"dep-essai"}` ; `reel.localhost:8080` rend `{"espace":"REEL","deploiementId":"dep-reel"}` (sans `autreEspaceUrl`). |
| AC-6 | `curl -D` sur `essai.localhost:8080/accueil` et sur `/coque/config` : `Content-Security-Policy` (nonce, `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. En production : 0 balise `<script>` sans nonce dans le HTML de `/accueil`. **Pas sur « la connexion »** : l'écran n'existe pas. |
| AC-7 | **NON FAIT** (pas d'écran de connexion). |
| AC-8 | `fournisseur-session.test.tsx` : la fermeture, l'ouverture d'une session d'une autre organisation et l'expiration (401) vident le cache (`queryClient.clear()`) ; la fermeture purge le jeton. e2e : fermeture → 204, cookie effacé, `rafraichir` suivant → 401, après rotation du cookie au rafraîchissement. |

**Chiffres :** `tsc` 0 ; `eslint` 0 ; Vitest **9 fichiers / 61 tests** (suite complète rejouée sur `f9161f0`) ; `next build --webpack` vert (toutes les routes `ƒ`) ; budget **146 901 octets gzip** pour 152 123 (6 scripts) : TanStack Query et la session au layout racine coûtent 8,6 Ko.

**Mutations** (violation posée, rouge constaté, retirée) : CSRF non exigé (5 tests rouges) ; origine étrangère acceptée ; cookie sans `Secure` ; `SameSite=Lax` ; `Path=/` ; `unsafe-inline` dans `script-src` ; `frame-ancestors` retiré ; HSTS retiré ; `User-Agent` non reporté ; rafraîchissement non sérialisé ; fermeture sans `cache.clear()` ; `GET` exporté sur `ouvrir` ; `refreshToken` renvoyé au navigateur. **13/13 rouges** (1 à 5 tests rouges chacune).

### Écarts et ce qui n'est pas prouvé

- **Les écrans `(auth)`** (connexion, invitation, mot de passe, marque d'essai, titre `[ESSAI]`) **ne sont pas faits** : ils attendent une maquette validée par l'utilisateur. Story de suite à nommer. Les routes se prouvent par l'API (e2e) ; la logique de session est prête à être appelée par un écran (`useSession().ouvrir`, `accepterInvitation`, `fermer`).
- **AC-5 par Traefik** : le profil de PRA-02 route les deux hôtes vers le même :3200. Pour la preuve, une COPIE de `dynamique.yml` (hors dépôt) envoyait `reel.localhost` vers :3201. Le dépôt n'est pas modifié : un déploiement réel = un processus par espace.
- **Budget** : `/accueil` est rendue à la demande (la CSP à nonce l'exige : un HTML prérendu ne peut pas porter de nonce). `outils/budget/budget.mjs` ne lit donc plus `.next/server/app/accueil.html` mais le HTML servi par `next start` (port 3299). Budget inchangé.
- **CSP** : `style-src-attr 'unsafe-inline'` (les attributs `style=""` de Radix et Floating UI ne portent pas de nonce) ; les balises `<style>` exigent le nonce en production. En dev : `unsafe-eval` et `unsafe-inline` (outil de Next).
- **Déconnexion** : la route `fermer` transmet le jeton d'accès à `auth` (`/auth/logout` exige un jeton ; le modèle de l'app expert-comptable l'appelait sans et la révocation échouait en silence). Si l'access est déjà expiré, la révocation échoue (au mieux) mais le cookie est effacé.
- **Pas de page technique** : la preuve passe par `fetch` depuis une page de la coque, aucun écran ajouté.
- `Secure` partout, y compris en dev : Chromium le pose sur `http://*.localhost`. Non essayé sous Firefox ni Safari.
- **Pile du gate** : images `grp-a` existantes (`up --no-build`, VM Docker sans DNS ce soir), aucun build.
- Rien de prouvé sur `next dev` derrière Traefik (HMR sous CSP) : prouvé en `next start` seulement.
- Le poste a un `node_modules` en JONCTION vers `_wt-a-pra01` : `next dev` (Turbopack) refuse (« Symlink node_modules is invalid ») ; `next dev --webpack` marche.

### Ce que PRA-04 doit savoir

- Le jeton : `lireJeton()`, `rafraichirJeton()` (sérialisé ; rend `null` si 401 ou panne), `surExpiration()` dans `src/coque/securite/gestionnaire-jeton.ts`. Sur un 401 d'un service : appeler `rafraichirJeton()` UNE fois, rejouer la requête avec le nouveau jeton ; un `null` après 401 = la session est finie (`FournisseurSession` passe à `deconnecte` et vide le cache).
- `FournisseursCoque` (layout racine) monte un `QueryClient` SANS réglage : PRA-04 y règle la fraîcheur. `useSession()` donne `etat` (`chargement`, `connecte`, `deconnecte`), `utilisateur` (`sub`, `org`, `roles`, `perms`), `ouvrir`, `accepterInvitation`, `fermer`.
- Les clés de requête commencent par le code du module ; `['coque', …]` est réservé ; `cache.clear()` est déjà branché.
- Toute l'API passe par l'origine de la coque (`connect-src 'self'`) : le client appelle `/api/<code>/v1/…` en chemin relatif, jamais une autre origine.
- Le serveur Next n'appelle que `auth` (`PROSPERA_PROXY_URL_INTERNE`) ; il lit la configuration à chaque requête : `/coque/config` est `force-dynamic`.
- Le layout racine lit `headers()` (nonce) : toutes les pages sont dynamiques ; le budget se mesure sur `next start`.
- En dev : `.env.local` avec `PROSPERA_ESPACE`, `PROSPERA_DEPLOIEMENT_ID`, `PROSPERA_PROXY_URL_INTERNE=http://127.0.0.1:8080` (voir `.env.example`).
- L'IdP limite la connexion à 5 par minute ; l'inscription exige `vertical` (`cabinet`) ; trois inscriptions du même e-mail en parallèle donnent un 500 : l'e2e est en série.
