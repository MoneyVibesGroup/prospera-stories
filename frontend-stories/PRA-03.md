# Story PRA-03 : La session, la configuration d'exécution, la sécurité du serveur Next

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

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
