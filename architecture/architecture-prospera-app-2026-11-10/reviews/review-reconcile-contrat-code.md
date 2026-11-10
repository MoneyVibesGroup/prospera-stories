# Revue de réconciliation : spine `prospera-app` contre contrat de module, plan v3 et code expert-comptable

Relecteur : réconciliation des entrées. Date : 2026-11-10. Aucun fichier modifié hors de celui-ci.
Gravité : BLOQUANT (la spine ne marche pas telle quelle) · MAJEUR (exigence perdue ou contradiction coûteuse) · MOYEN · MINEUR.

## Verdict

La spine honore C2, C4, C7, C8 et la matrice des neuf états, et ses ruptures avec l'app expert-comptable (proxy unique, pas de `NEXT_PUBLIC_*`, session hors de `/api/auth`) sont justifiées par AD-8 et AD-10. Mais deux défauts mécaniques de Next la rendraient non buildable ou non gardée (dossier `_coque` non routable, garde `m/[code]/layout.tsx` qui ne couvre pas des pages `m/stock/…`), et trois dépendances (Traefik de dev, endpoint d'état publié, CORS) ne sont pas portées au calendrier.

---

## A. Ce que le contrat et le plan exigent et qui manque ou est contredit dans la spine

### A1 · BLOQUANT : dépendance de calendrier sur l'état publié et le proxy, sans amorce
- Source : plan v3 §5 : Dev A fait le « squelette de la coque (BFF, menu construit…) » en S3 (23/11) et le « module d'écran » de `reseau` en S4 (04/12) ; amendement §6 : l'état publié (moteur, partie A) est en S5 (07/12), la spine du moteur n'est due qu'avant le 07/12.
- Spine : AD-5 fait de `GET /api/instance/v1/etat-publie/{organisationId}` la seule source ; le dev suppose « un Traefik de dev sur :8080 ». Or `docker-compose.yml` ne contient ni Traefik, ni 8080, ni service moteur, ni profil ; la spine range « table de routage du proxy » et « montage de l'instance » en Deferred (moteur, partie B).
- État : aucune amorce prévue pour S3-S4 (fixtures tirées de `contrat/etat-publie.openapi.json`, faux serveur, ou Traefik minimal). La règle « Integration Gate, 0 mock » (spine, Tests ; `.claude/rules/integration-gate.md`) se heurte à une lecture qui n'existe pas encore.
- Correction : ajouter un « pont de démarrage » daté (le fichier de contrat plus un faux serveur d'état publié pour S3-S4, Traefik de dev livré par un propriétaire nommé, gate réelle à S5).

### A2 · MAJEUR : la garde `m/[code]/layout.tsx` ne couvre pas des pages réexportées sous des dossiers statiques
- Source : contrat C8 (preuve : « une URL saisie à la main rend l'écran module non installé ») ; spine AD-4 et Structural Seed : « layout `m/[code]/layout.tsx` … pages fines réexportées depuis `src/modules/<code>/` ».
- Fait Next : si une page vit en `m/stock/page.tsx`, c'est un dossier frère de `m/[code]`, et le layout de `[code]` ne l'enveloppe pas (les layouts s'imbriquent par hiérarchie de dossiers). Ces pages seraient sans garde, ce que C8 interdit.
- Correction : imposer une unique route attrape-tout `m/[code]/[[...chemin]]/page.tsx` qui résout `ecran.ts` dans le registre, plus un test qui échoue si un dossier `m/<autre>/` existe.

### A3 · MAJEUR : « désinstaller et réinstaller sans perte » (démo du 15/01, C9) : rôle de la coque non écrit
- Source : plan §5 sem. 8 « on désinstalle et on réinstalle sans perte » ; §6 ; contrat C9 ; PRD FR-36 (l'action d'installer vit dans la console Money Vibes, pas dans `prospera-app`).
- Spine : la ligne SM-1 de la carte dit « modules sur l'essai de la plateforme » sans dire que l'installation se pilote hors coque, ni ce que la coque doit prouver : menu qui apparaît puis disparaît sans rechargement (30 s, AD-5), URL à la main = « non installé » (AD-4), mêmes données à la réinstallation.
- Trou concret : le cache TanStack garde les données `['stock', …]` après désinstallation. Aucune règle de purge des clés préfixées par le code quand l'état passe à fermé : données périmées ou visibles à tort, preuve de la démo faussée.
- Correction : AD-5 « à la bascule vers un état fermé, la coque supprime les requêtes `['<code>', …]` du cache », et un scénario e2e « installer, voir, désinstaller, écran d'état, réinstaller, relire » dans SM-1.

### A4 · MAJEUR : C4 « emplacement vide » : la spine rend « vide » là où le contrat exige NON_INSTALLE distinct de zéro
- Source : contrat C4 : `{etat:"NON_INSTALLE",module}` différent de `{etat:"DISPONIBLE",valeur:0}`, « les confondre fait croire à un client sans activité ».
- Spine AD-2 : « la coque rend l'emplacement vide » ; « les données d'un autre module se lisent par son API ». Rien sur l'affichage d'un `etat` NON_INSTALLE. De plus, un 403 `<AUTRE>_NOT_ENTITLED` provoqué par la lecture de l'API d'un autre module est capturé par AD-9 (relit l'état) mais aucun écran ne le montre, puisque la garde ne porte que sur le module hôte.
- Correction : AD-2 dit que l'emplacement rend un composant « module non installé » distinct de « 0 », et que la lecture d'un autre module passe d'abord par `useModule(autre).ouvert`, jamais par un 403 attrapé.

### A5 · MAJEUR : l'Administration (`modules/instance`) n'énumère pas les écrans exigés par FR-36 et C11
- Source : PRD FR-36 (« Administration » de `prospera-app`) : mises à jour, essayer, date, revenir, fichier, tunnel de support, donner ou retirer un consentement (DG), exporter, bilan de son installation, rôles et droits, import en autonomie du prospect, compte à rebours et export en `ESSAI_TERMINE` ; contrat C7 : le droit de consentir ne s'attribue que par le DG ; C11 : consentement par finalité.
- Spine AD-14 : rôles, export, et par exclusion « planifier, revenir, fichier, support ». Le consentement DG, le bilan d'installation (seulement un bandeau en AD-7) et l'import du prospect (PRD Reprise : C8 « dès février ») ne figurent nulle part. `CONSENTEMENT_RESERVE_AU_DG` n'apparaît qu'en AD-9.
- Correction : AD-14 liste les écrans par droit `instance:*` (consentement DG-seul compris) et marque ceux livrés au 15/01 contre février.

### A6 · MAJEUR : « le cabinet suit la même règle » (C8 amendé) : un seul point différé
- Source : contrat C8 : « L'app expert-comptable suit la même règle, sur le même état publié » ; PRD FR-34, FR-36 (mêmes écrans d'Administration pour le cabinet).
- Spine : AD-15 partage le contrat ; Deferred : « paquet partagé … quand l'app expert-comptable passe au patron `/m/<code>/` ». Aucun porteur ni jalon. L'app existante s'appuie sur `/tenant/state` et les entitlements du catalogue (`docs/frontend-program-plan.md`), pas sur un état publié.
- Correction : une ligne « Cabinet » dans la carte capacités : propriétaire, jalon (février), et même table §3.1 et même matrice JSON.

### A7 · MOYEN : module n°8 CRM interne et console
- Source : plan §1.5 (CRM = module n°8, `support-crm-service`, installé pour l'organisation Money Vibes, écrans dans la console, §1.4 « apps à part ») ; contrat C8 : tout module livre son dossier dans `prospera-app`.
- Spine : silence. Un auteur du module n°8 peut se croire tenu de faire `src/modules/support-crm/`, ou l'inverse.
- Correction : une ligne « Console Money Vibes et CRM interne : hors coque (FR-36, plan §1.4) ; la coque n'héberge aucun écran plateforme ».

### A8 · MOYEN : format de droit à tiret
- Source : contrat C7 amendé et §7 : `auth-service` refuse les codes à tiret, ticket « avant le premier module à tiret ».
- Spine AD-3 impose le dossier au code du catalogue « tiret compris : `pi-spi` » et le droit `<code>:<objet>:<action>`, sans le préalable.
- Correction : une ligne Deferred « droits des codes à tiret : bloqués par le ticket `auth-service` (contrat §7) ; aucun module à tiret avant ».

### A9 · MINEUR : formulations
- AD-14 : « l'export est atteignable quel que soit l'état (SUSPENDU compris) » : C2 et PRD §3.1 refusent `NON_INSTALLE`. Écrire « sauf `NON_INSTALLE` ».
- AD-9 liste trois codes ; C13.6 ajoute `ECRITURE_REELLE_DEPUIS_ESSAI` (message traduit à prévoir, lié à AD-12).
- Amendement plan §6 sem. 4 range la « spine de la coque » dans la liste « due avant S5 », alors que plan §3 et la spine disent 20/11 : garder une seule date.

---

## B. Contradictions avec les conventions de l'app expert-comptable

### B1 · BLOQUANT : `src/app/_coque/` n'est pas routable
- Spine : Design Paradigm, AD-8, AD-11, Structural Seed : route handlers sous `/_coque/*` dans `src/app/_coque/`.
- Fait Next (App Router) : un dossier préfixé par un tiret bas est un dossier privé, exclu du routage. `src/app/_coque/session/login/route.ts` ne répond jamais (404). Le contourner demande `%5Fcoque` dans le nom du dossier, et alors le cookie devrait porter `path=/%5Fcoque/session` (le navigateur ne normalise pas `%5F`) : piège supplémentaire.
- Justification : quitter `/api/auth/*` est fondé (AD-8 : tout `/api/*` appartient au proxy ; le code socle `auth` donnerait `/api/auth/v1/…`, en collision avec `/api/auth/refresh` du dépôt). Le motif tient, le nom non.
- Coût : sans correction, pas de session et un premier démarrage rouge. Le chemin du cookie suit (`path=/api/auth` dans `src/lib/auth/cookies.ts` ; `BFF_REFRESH_PATH` dans `token-manager.ts` ; `stubSession` e2e) : à regrouper dans une constante.
- Correction : un segment sans tiret bas, p. ex. `src/app/session-coque/*` avec `path=/session-coque`, réservé à la coque dans Traefik.

### B2 · MAJEUR : la garde est un composant client, pas un layout serveur
- Code : `next16-gotchas.md` : « le guard de route est côté client dans `AppShell` (le cookie de refresh est `path=/api/auth` et invisible du middleware) » ; access token en mémoire seulement (`token-manager.ts`), claims décodés côté client (`session-provider.tsx`).
- Spine AD-4 : « layout de garde … lit l'état publié et le droit » sans dire client ou serveur. Avec jeton en mémoire, un composant serveur ne peut pas appeler la lecture.
- Correction : AD-4 « garde = composant client sous `SessionProvider` ; pendant `loading`, rien du module ni du menu n'est rendu ; le backend reste l'autorité ».

### B3 · MAJEUR : le BFF appelle l'IdP par des variables que la spine supprime
- Code : `src/lib/env.ts` exige huit `NEXT_PUBLIC_*_URL` (figées au build) ; `bff.ts` : `idpUrl()` = `resolveApiUrl("/auth/…")` sur `NEXT_PUBLIC_AUTH_URL`. Le doc du dépôt dit « même image configurée par env », ce qui est faux pour `NEXT_PUBLIC_*`.
- Spine AD-10 interdit `NEXT_PUBLIC_*` d'instance : justifié, c'est un vrai défaut du dépôt. Mais la spine ne dit pas comment le serveur Next atteint l'IdP : une variable serveur (`AUTH_SERVICE_URL`) lue à la requête.
- Piège : un layout ou une page qui lit `process.env` peut être prérendu statiquement au build (valeur gelée).
- Correction : AD-10 et AD-11 nomment la variable serveur de l'IdP et imposent un rendu dynamique pour tout ce qui lit l'environnement.

### B4 · MAJEUR : proxy unique contre direct-par-service
- Code : `services.ts` : préfixes logiques `/ec /atelier /bilan /pieces /dossiers /activite` avec `strip` par préfixe ; pièges consignés (`strip:false` sur `/bilan` envoie la liasse au mauvais service ; `/whoami` ambigu entre balance et bilan ; frontière de segment `/documents` contre `/dossiers`).
- Spine AD-8 : `/api/<code>/v1/…` vers `/api/v1/…` du service qui porte `<code>`. Gain réel (le code identifie le service, l'ambiguïté disparaît), justifié. Mais : (1) la table du proxy est renvoyée au moteur sans reprendre les cas non uniformes mesurés ; (2) `users`, `organizations`, `ec` n'ont pas de « code de catalogue », la spine ne cite que `auth`.
- Coût : table à écrire par service, test de sanité par route.
- Correction : AD-8 précise que `users` et `organizations` se servent sous `/api/auth/v1/…`, et que les cas `/bilan` et `/pieces` du dépôt sont des jeux d'essai du proxy.

### B5 · MAJEUR : CORS et ports
- Code : le compose fixe `CORS_ALLOWED_ORIGINS` à `localhost:3100…3120` sur chaque service ; `cors-blocker.md` : l'app cliente sur :3100, :3000 = expert-comptable ; `reuseExistingServer` a déjà pris un backend pour le serveur de test.
- Spine : `prospera-app` sur :3200 (hors de la liste), Traefik :8080, « plus de CORS ». Valable seulement si tout appel du navigateur passe par :8080. Tout test ou outil qui appelle un service en direct échoue au préflight, la panne même du `cors-blocker.md`.
- Correction : Playwright vise :8080 avec `reuseExistingServer` désactivé, et « aucun appel direct à un service depuis :3200 » devient une règle.

### B6 · MAJEUR : session et cookie
- Code : `cookies.ts` : httpOnly, `secure` en production, `sameSite=strict`, `path=/api/auth`, 7 jours, rotation ; refreshs concurrents sérialisés (`token-manager.ts`) pour ne pas déclencher la détection de réutilisation (STORY-024) ; `idpHeaders` reporte le `User-Agent` (FE-021) ; l'IP exige `X-Forwarded-For` plus `TRUSTED_PROXIES` ensemble (FE-072).
- Spine : « patron de l'app expert-comptable » sans reprendre ces acquis. Avec Traefik devant et une relecture toutes les 30 s, le risque de refresh concurrent entre onglets et le masquage du navigateur à l'IdP reviennent.
- Coût du changement de chemin : migration en bloc de `BFF_REFRESH_PATH`, du cookie et des e2e ; aucun cookie existant à convertir (app neuve).
- Correction : AD-11 reprend : User-Agent reporté à l'ouverture de session, refresh sérialisé, `sameSite=strict`, `X-Forwarded-For` et `TRUSTED_PROXIES` posés ensemble ou pas du tout.

### B7 · MOYEN : i18n
- Code : next-intl mono-locale `fr`, sans routing ni proxy, un seul `messages/fr.json`.
- Spine : « langue d'`accueil` », espaces `modules.<code>.*`. La locale serveur est résolue avant toute lecture authentifiée : elle reste `fr`, puis un fournisseur client change après la lecture (flash). La fusion des messages par module n'est pas décrite.
- Correction : écrire que le rendu serveur reste `fr` en v1, que la langue d'`accueil` s'applique côté client, et comment `ecran.ts` expose son espace de messages.

### B8 · MOYEN : pièges Next 16 du dépôt à reprendre dans la spine
1. `middleware` est devenu `proxy.ts` ; le cookie de refresh à chemin restreint est invisible du proxy.
2. `cookies()` de `next/headers` est asynchrone (`await cookies()`) dans les route handlers.
3. `next build --webpack` : Turbopack est corrompu sur la machine Windows locale ; la spine écrit « build webpack » sans la raison et risque de le voir retirer.
4. Le générateur de barrels de l'IDE crée des `src/**/index.ts` (TS2306, TS2308) : la structure `coque/…` et `modules/…` y sera très exposée ; supprimer avant typecheck/build ou désactiver l'extension.
5. `rm -rf .next` au changement de branche (TS2307 sur types de route périmés).
6. TanStack v5 : `data` reste `T | undefined` sous `isPending` ; un `queryFn` qui résout `undefined` met la requête en erreur. La clé unique de l'état publié (AD-5) y est exposée.
7. Versions : le dépôt est sur Next 16.2.10, React 19.2.4, next-intl 4.13, TanStack 5.101 ; la spine annonce 16.4, 19.3, 4.14, 5.107 sans dire que c'est une montée à valider (peer deps de next-intl).
8. `allowedDevOrigins` (`NEXT_DEV_ORIGINS`) pour servir à une autre IP en `next dev` seulement.
9. E2E : attendre sur condition, jamais `waitForTimeout` ; `page.route` ne couvre qu'une page, utiliser `context.route` pour deux onglets (utile aux deux espaces, AD-12).
10. Intégration : confirmer que le stack est `origin/dev` avant de conclure sur le backend (checkouts périmés, déjà payé trois fois).

### B9 · MINEUR : écarts de forme
- Le dépôt a déjà `(app)`, `(auth)` et un `/login` top-level plein écran (décision verrouillée) ; la spine range « connexion » dans `(auth)`. À dire.
- `claims.ts` lit `perms[]` pour l'affichage ; AD-6 l'interdit pour le menu (justifié par C7 amendé et A-2) : ne pas recopier ce fichier tel quel.
- Le kit (`components/ui`, `states`, `brand`) est copié, pas partagé : cohérent avec le Deferred « paquet partagé ».

---

## C. Cohérent (pour mémoire)
- Neuf états : écrans d'état, valeur inconnue lue `NON_INSTALLE`, `SUSPENDU` caché avec export atteignable depuis `instance` (AD-4, AD-5, AD-7, AD-14, AD-15).
- Droits : lecture de `droitsEffectifs`, jamais de `perms[]` (C7, A-5) ; entrées de menu avec droit nommé (C8).
- D1/D2/D3 : une image, emplacements pour les dépendances optionnelles, D3 révisée portée par l'interdiction des `NEXT_PUBLIC_*` d'instance.
- Plages `PRA-01→99` et `PRA-100→199` conformes au plan v3 §3 ; remise le 20/11.
- Deux espaces et marque d'essai permanente (FR-9, FR-42, C13.6) : AD-12.
