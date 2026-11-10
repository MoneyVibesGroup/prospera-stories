# Relecture « grille de la bonne spine » — `prospera-app`, la coque

Spine relue : `ARCHITECTURE-SPINE.md` (draft, 2026-11-10) ; memlog : `.memlog.md`. Altitude : feature.

## Verdict

La spine fixe bien le paradigme, le sens des dépendances, la garde unique, l'état publié et le « le serveur Next ne porte aucune règle ». Elle n'est cependant pas encore remettable à Dev A : le seed contient un défaut bloquant (`src/app/_coque/` n'est pas routable en Next), le descripteur `ecran.ts` ne porte pas ce dont la matrice des neuf états a besoin, et quatre dimensions de l'altitude (sécurité front, performance du bundle, versions coque/services, accessibilité) sont silencieuses.

Décompte : 2 critiques, 6 hauts, 8 moyens, 6 bas.

---

## CRITIQUES

### K-1 — `src/app/_coque/` n'est pas une route (Next : dossier privé)
- Où : tableau « Serveur Next », AD-8, AD-10, AD-11, Structural Seed.
- Constat : en App Router, un dossier préfixé par `_` est un *dossier privé*, exclu du routage. `src/app/_coque/session/*` ne répond donc jamais sur `/_coque/session/*`. Le routage proxy (AD-8 : « les routes propres au serveur Next vivent sous `/_coque/*` ») et le Traefik de dev s'appuient sur une URL qui n'existe pas. Le memlog classe ce préfixe parmi les décisions « proposées par l'architecte, à valider » : il n'a jamais été éprouvé.
- Correction : choisir un segment réel, sans underscore initial (`src/app/coque-srv/…` → `/coque-srv/*`, ou `/_/`…), ou garder `_coque` en URL avec le dossier `%5Fcoque` (fragile, déconseillé). Ajouter à AD-8 un test de contrat : `GET /<préfixe>/config` répond 200 en e2e derrière Traefik. Réserver aussi `/_next/*` et `/healthz` au serveur Next dans la table de routage du Traefik de dev.

### K-2 — Sécurité front : dimension entière silencieuse
- Où : aucune AD, aucune ligne de Deferred.
- Constat : la coque héberge la session (refresh en cookie), des données multi-organisations et, surtout, injecte à l'exécution des valeurs saisies par des tiers (AD-13 : marque, logo, couleurs, langue venus de `accueil`). Rien n'est décidé sur :
  - CSP (avec Next, une CSP à nonce impose le rendu dynamique de toutes les pages : cela touche AD-1/AD-10) ; en-têtes (`frame-ancestors`/X-Frame-Options, HSTS, `Referrer-Policy`, `X-Content-Type-Options`) ;
  - attributs du cookie de refresh (`HttpOnly`, `Secure`, `SameSite`, `Path` restreint, nom, portée hôte seule). Essai et réel sont deux adresses : si elles partagent un domaine parent, un cookie de domaine envoie la session de l'un à l'autre, ce qui contredit AD-12. En dev, `localhost:3100`, `:3200` et `:8080` partagent leurs cookies (les cookies ignorent le port), donc collision avec l'app expert-comptable ;
  - CSRF des routes de session ; validation de `accueil` (couleurs : format strict hex/oklch, jamais de chaîne CSS libre ; logo : origine autorisée par `img-src`, pas de `javascript:`/SVG actif) ; lien vers « l'autre espace » (liste d'origines autorisées, anti-redirection ouverte) ;
  - le fait que masquer une entrée n'est pas un contrôle d'accès : le backend reste l'autorité (AD-6 ne le dit pas).
- Correction : ajouter une AD « Sécurité du navigateur » avec règles vérifiables : en-têtes posés par un seul fichier de la coque et testés en e2e ; cookie `__Host-` impossible avec `Path` restreint, donc nom propre à l'application + espace (`pra_rt_<espace>`), hôte seul ; validateur zod de `accueil` à la lecture (valeur rejetée ⇒ jeton par défaut) ; CSP décidée (nonce ou hash) et son effet sur le rendu noté. Sinon l'inscrire en Deferred avec une échéance avant le premier déploiement sur site (février).

---

## HAUTES

### H-1 — Versions : image unique de la coque contre services figés (`VERSION_FIGEE`)
- Où : AD-1, AD-5 ; rien sur le sujet.
- Constat : une seule image sert tous les clients (AD-1) alors que la lecture porte `VERSION_FIGEE` et une `version` par module (memlog) : un client sur site peut garder un service en N-1 pendant que l'image porte des écrans pour N. Aucune règle ne dit comment un écran sait que le service qu'il appelle supporte ses appels, ni la compatibilité entre version de coque et version du contrat d'état publié (`contrat/*.json` copié). La « ligne de version unique » (FR-21) est invoquée dans Prevents mais pas outillée. Deux modules divergeront : l'un sondera `version`, l'autre supposera l'additif.
- Correction : AD « Compatibilité » : (a) les API de services sont additives sur une fenêtre N/N-1, vérifié par le contrat OpenAPI ; (b) tout écran qui dépend d'une capacité récente la teste via `interrupteur(nom)` (déjà offert par `useModule`), jamais via la version brute ; (c) la coque lit une version de contrat dans la lecture, refuse de démarrer sur une version majeure inconnue et affiche l'écran d'état « mise à jour requise » ; (d) la version de l'image (tag = version de la ligne) est affichée dans l'Administration.

### H-2 — Performance : tous les modules dans une seule image, rien sur la taille du bundle
- Où : AD-1, AD-3 (`registre.ts` importe chaque `ecran.ts`).
- Constat : `ecran.ts` exporte des `emplacements` et `contributions` (des composants) ; `registre.ts` les importe tous explicitement et est lui-même importé par la coque (menu, garde). Résultat probable : tous les écrans contributeurs de tous les modules (40 à terme) dans le chunk partagé que paie chaque client, y compris sur mobile 360 px (UJ-3) et connexion faible. Les messages i18n de tous les modules suivent le même chemin. Aucun budget, aucune règle de découpage.
- Correction : règle d'AD-3 : `ecran.ts` ne contient que des métadonnées sérialisables et des références paresseuses (`() => import('./…')` ou `next/dynamic`) ; aucun import de composant dans les descripteurs. Messages chargés par module (`modules.<code>` à la demande, uniquement pour les modules ouverts). Budget chiffré par route (ex. JS initial de `/accueil` ≤ X ko gzip) et par module, vérifié en CI (`@next/bundle-analyzer` ou `size-limit`) ; en Deferred seulement le chiffre, pas le principe.

### H-3 — Le descripteur `ecran.ts` ne permet pas de jouer la matrice des neuf états
- Où : AD-3, AD-4, AD-15.
- Constat : la matrice (§3.1) attend un résultat « par sorte de route » (lecture, écriture, export, état réglementaire). Or `entrees: [{ chemin, droit, cleLibelle }]` ne porte aucune sorte. Autres manques, source de divergence entre modules :
  - quelles routes sont couvertes : une page de détail `/m/stock/articles/42` n'est pas une entrée de menu, quel droit la garde lit-elle ? (« le droit de l'entrée », AD-4, est indéfini hors menu) ;
  - l'export (AD-14 : « atteignable d'ici, quel que soit l'état ») : rien n'oblige un module à déclarer son export, ni comment l'Administration le découvre ;
  - la garde « dans le layout » : un layout Next n'est pas re-rendu à la navigation douce entre pages enfants, et le serveur Next n'a pas de jeton (AD-11), donc la garde est forcément un composant client lisant la requête TanStack. Ni l'un ni l'autre n'est écrit : on s'expose à un flash de contenu du module avant la décision et à un layout qui ne se réévalue pas.
- Correction : étendre le type dans AD-3 : `entrees: [{ chemin, droit, cleLibelle, sorte: 'lecture'|'ecriture'|'export'|'reglementaire', menu: boolean }]`, plus `export?: { cleLibelle, chemin }` obligatoire pour tout module qui détient des données ; règle : toute page sous `m/[code]/` doit correspondre à une entrée (préfixe le plus long), un test le vérifie à partir du registre. AD-4 : « la garde est un composant client qui ne rend rien du module avant la première lecture résolue (squelette) ». Le test en matrice génère ses cas depuis le registre.

### H-4 — Emplacements (C4) : contrat de composition non fixé, aucune isolation de panne
- Où : AD-2, AD-13.
- Constat : « le contributeur dépose un composant » ne dit ni le typage des propriétés d'un emplacement (qui versionne le contrat hôte/contributeur ?), ni l'ordre, ni la limite d'erreur. Un composant contributeur qui lève une exception casse l'écran de l'hôte ; or l'hôte ne connaît pas le contributeur. Les tuiles `accueil` des 4 modules de Dev A seront écrites chacune à leur façon (chargement, vide, erreur). Les données d'un contributeur appellent la même API que l'hôte : pas de règle de cache (clé `['<code>',…]` de qui ?).
- Correction : AD « Emplacements » : type d'emplacement exporté par l'hôte depuis la coque (`src/coque/emplacements/types.ts`, propriétés immuables, additives seulement), ordre déterministe (`ordre` + code), chaque contribution encadrée par un `ErrorBoundary` et un `Suspense` fournis par la coque (une contribution en échec disparaît et se journalise, l'hôte survit), états vide/chargement/erreur standard de la tuile fournis par le kit.

### H-5 — AD-3/AD-5 reposent sur des champs ou chemins de la lecture qui n'existent pas encore, et l'organisation active n'est pas décidée
- Où : AD-3 (libellé du catalogue), AD-5 (chemin, 30 s), Deferred « champs manquants », AD-10.
- Constat :
  - AD-3 impose que le libellé de premier niveau vienne du catalogue ; Deferred reconnaît que la lecture ne le rend pas et renvoie à AD-10 pour « contourner ». Or AD-10 est une config minimale (adresse de l'autre espace, id de déploiement) et interdit d'y mettre ce que la lecture rend : le contournement du libellé n'est décidé nulle part. Dev A inventera un repli (le code, ou `cleLibelle` du module), et ce repli deviendra la norme.
  - Le chemin `GET /api/instance/v1/etat-publie/{organisationId}`, le seuil 30 s et « < 1 min » sont des ASSUMPTION du PRD (memlog), mais AD-5 est marqué `[ADOPTED]` en les figeant.
  - D'où vient `organisationId` (claim du jeton ? sélection ?) ; un utilisateur multi-organisations (mêmes `memberId` en essai/réel, memlog) change-t-il d'organisation sans recharger ? La « clé de requête unique » (AD-5) ne précise pas qu'elle contient l'organisation ; le cache des modules `['<code>',…]` non plus (fuite inter-organisations).
- Correction : (a) trancher le repli du libellé : « tant que la lecture ne rend pas `libelleMenu`, la coque affiche `cleLibelle` du descripteur ; le champ de la lecture le remplace dès qu'il existe » et le noter en Deferred explicitement avec propriétaire ; (b) marquer le chemin et les valeurs « ASSUMPTION, à confirmer par le PRD moteur » dans l'AD, ou retirer `[ADOPTED]` de la partie chiffrée ; (c) AD-5 : clé `['etat-publie', organisationId]`, convention de clés `[organisationId, code, …]`, et le changement d'organisation vide tout le cache (`queryClient.clear()`).

### H-6 — Accessibilité : dimension entière silencieuse
- Où : aucune AD ; Deferred ne mentionne que le contraste des couleurs de marque, reporté à la console.
- Constat : la coque possède les bandeaux, l'écran d'état, le menu, la marque d'essai, et reçoit des couleurs de tiers sans plancher de contraste (AD-13 : les couleurs surchargent les jetons ; si la console ne les vérifie pas, la coque rend illisible). La marque d'essai repose sur « couleur de bordure » : l'information par la couleur seule. Pas de niveau cible (WCAG 2.1 AA ?), pas de règle sur `aria-live` des bandeaux qui changent à la volée (changement d'état toutes les 30 s), pas de gestion du focus quand la garde remplace un module par un écran d'état, pas de test automatisé.
- Correction : AD « Accessibilité » : cible WCAG 2.1 AA ; la coque calcule le contraste des couleurs d'`accueil` et retombe sur les jetons par défaut sous le seuil (la défense est donc dans la coque, pas seulement dans la console) ; bandeaux `role="status"`/`alert` selon la gravité ; l'essai se signale aussi par texte permanent ; focus déplacé vers le titre de l'écran d'état ; `axe` joué dans Playwright sur l'écran d'état, le menu et le bandeau.

### H-7 — Enveloppe opérationnelle : déploiement, environnements, exploitation
- Où : AD-10, schéma de déploiement, Deferred (« télémétrie »).
- Constat : on sait « une image, deux déploiements » mais pas :
  - sortie de build (`output: 'standalone'` ?), santé (`/healthz` sans appel métier), arrêt propre, journaux sur stdout, variables d'environnement attendues (liste fermée, validée au démarrage avec échec rapide) ;
  - le piège du *version skew* : image remplacée alors que des onglets ouverts demandent d'anciens chunks (404) ; l'identifiant de déploiement est cité dans AD-10 sans règle de comportement ;
  - sur site : livraison hors-ligne de l'image (connexion sortante seulement, memlog), CI/CD, rétention, retour arrière ;
  - Node ≥ 20.9 en Stack : Node 20 est en fin de vie depuis avril 2026 ; viser Node 22 ou 24 LTS ;
  - Traefik 3.7 : TLS, HSTS, compression, cache des assets `/_next/static` (immutable) et aucune mise en cache de la config/lecture.
- Correction : AD « Déploiement » : liste des variables d'exécution (zod au démarrage), `/healthz`, standalone, en-têtes de cache par préfixe, comportement au skew (rechargement proposé sur erreur de chunk), et sortie de la Stack ramenée à Node 22/24. Les détails fins d'infra de plateforme restent en Deferred vers la spine du moteur (due 07/12), mais il faut y inscrire ce que la coque réclame.

### H-8 — Écrans hors lecture : connexion, invitation, mot de passe (groupe `(auth)`)
- Où : Structural Seed `(auth)/`, AD-13 (habillage venu de la lecture), conv. i18n.
- Constat : avant la connexion, il n'y a pas d'`organisationId` ni de lecture, donc ni habillage, ni langue, ni marque d'essai. AD-12 promet une marque d'essai permanente et AD-13 une marque client ; la page de connexion de l'essai est précisément celle où l'on peut saisir du réel par erreur. Rien ne dit d'où viennent la langue, la marque et le signe « ESSAI » avant la lecture.
- Correction : la configuration d'exécution (AD-10) porte aussi `espace` (déployé, immuable par déploiement : ce n'est pas une donnée de la lecture, contrairement à ce que dit AD-12 qui lit `instance.espace`) et le drapeau d'essai est posé dès la page de connexion ; langue = en-tête `Accept-Language` puis `accueil` après connexion ; marque par défaut Prospera tant qu'aucune lecture n'existe. Corriger AD-12 en conséquence (source de l'espace = config, confirmée par la lecture, divergence ⇒ écran d'erreur).

---

## MOYENNES

### M-1 — AD-5 : « aucune date lue » non vérifiable en l'état
La règle interdit l'emploi des dates pour décider, mais aucun contrôle ne l'applique (Consistency mentionne seulement `Date.now()`). Correction : règle ESLint `no-restricted-syntax` sur `Date.now()`/`new Date()` dans `src/coque/etat-publie/` et `src/modules/**` hors fichiers d'affichage ; ou typer `finLe`/`effacementLe` en `AffichageSeul<string>` dans les types générés. Préciser aussi `refetchIntervalInBackground: false` (économie de charge, FR-34 retrouvé au retour d'onglet) et la gestion d'une lecture en échec (dernier état connu affiché, pas d'état « ouvert » par défaut ; à l'inverse de l'état inconnu ⇒ `NON_INSTALLE`).

### M-2 — AD-9 : le comportement après relecture n'est pas défini
Après le 403 nommé, la requête échouée est-elle rejouée ? Boucle possible entre 403 et relecture. Correction : « ni rejeu automatique, ni toast d'erreur ; la requête est annulée ; le module est rerendu par la garde ou `<Ecriture>` » et un plafond de relectures (1 par rafale de 5 s).

### M-3 — Cache des données d'un module fermé
Désinstaller/réinstaller sans perte (SM-1) : les données `['stock',…]` restent dans le cache TanStack quand le module se ferme, puis réapparaissent périmées. Correction : AD-5 ou conventions : quand un module quitte l'ensemble `ouvert`, la coque `removeQueries(['<code>'])`.

### M-4 — Données hors lecture : conventions UI incomplètes
Pas de convention pour pagination, tri, états vide/chargement/erreur, tableaux, formulaires (zod partagé ?), toasts, confirmations destructrices. Deux modules de Dev A les écriront différemment (SM-1 : quatre modules en six semaines). Correction : le kit (`coque/ui`) les expose en composants obligatoires (`<Liste>`, `<EtatVide>`, `<ErreurApi>`) et AD-2 ajoute une règle ESLint contre l'import direct de `radix-ui` hors du kit.

### M-5 — Stratégie de tests : pas de test de module, rien avant l'arrivée du moteur
La Consistency liste des outils mais pas ce que chaque module doit livrer (couverture, fixtures d'états publiés, test e2e minimal). La matrice des neuf états et le contrat OpenAPI viennent du moteur dont la spine est « due avant le 07/12 », alors que le squelette démarre le 23/11 ; « 0 mock » n'a lieu qu'au Integration Gate. Correction : décider un double de développement de la lecture (fixtures JSON des neuf états générées depuis `matrice-etats.json`, serveur de maquette Playwright), l'étiqueter comme dette à éteindre au premier gate, et fixer la Definition of Done d'un module d'écran (test de garde, test d'`<Ecriture>`, axe, budget).

### M-6 — Observabilité
Deferred : « aucun besoin dans le PRD ». Mais l'Administration porte un tunnel de support (FR-36) et l'état publié a une `sante` : sans identifiant de corrélation, ni rapport d'erreur, ni journal d'`ApiError`, le support n'a rien à lire côté front. Chaque module inventera son `console.error`. Correction : règle minimale : `creerClient` pose un `x-request-id` généré, `ApiError` le porte, un point unique `signaler(erreur)` (journal console structuré aujourd'hui, branchable plus tard) ; ne différer que le collecteur.

### M-7 — AD-11 : formulation trop absolue
« N'appelle aucun service avec le jeton d'un utilisateur » : la route de refresh appelle bien `auth` avec le refresh token. Et sans jeton côté serveur, aucune donnée n'est rendue côté serveur : l'application est de fait une SPA servie par Next (SSR de la coque seulement). À écrire pour que personne n'introduise un `fetch` en Server Component. Correction : « le serveur Next n'appelle que `auth` (refresh/déconnexion) ; aucune page n'est rendue avec des données de service ; tout accès aux données est client ».

### M-8 — Cohérence entre modules du socle d'URL et de la navigation
Pas de convention pour l'URL interne d'un module (liste/détail/création), les retours, le fil d'Ariane, la sélection persistante dans l'URL (filtres). Des liens profonds entre modules (un module qui mène à un autre) : AD-2 interdit l'import mais pas le lien ; lien vers un module non installé ⇒ écran d'état, mais qui fournit le chemin ? Correction : `lienVers(code, entree)` fourni par la coque, qui lit le registre ; interdire les chemins `/m/<autre>` écrits à la main (règle de lint sur la chaîne).

---

## BASSES

- B-1 — Diagramme 1 : il manque l'arête `C -.-> M` « par registre », que le texte sous le schéma autorise ; `&lt;code&gt;` dans un libellé de nœud Mermaid peut s'afficher littéralement selon le moteur : préférer `#lt;code#gt;` ou retirer les chevrons (`modules/CODE/`). Les autres diagrammes sont syntaxiquement valides (le sequenceDiagram place le 403 comme venant de `M->>E` alors qu'il vient de l'API : légende à corriger).
- B-2 — AD-6 contient une note de procédure `*(Addendum §A-5 à amender …)*` : c'est une action de gestion, pas une règle. La sortir vers le memlog/la page de remise.
- B-3 — Stack : « Playwright 1.6x » est vague ; fixer la politique (versions exactes verrouillées par `package-lock`, mises à jour mensuelles) et noter l'écart Next 16.4 contre 16.2.10 de l'app expert-comptable (copie du squelette, D-9).
- B-4 — Deferred « Paquet partagé » : D-9 (validée) copie le squelette sans paquet partagé ; trois dérives des mêmes briques (session, client d'API, kit) sont certaines. Ajouter dans « Revoir quand » une condition mesurable (« dès que la 2e correction de sécurité doit être appliquée aux deux copies »).
- B-5 — Consistency / Identifiants : plafonds `PRA-01 → 99` et `PRA-100 → 199` sans règle de réservation des collisions (cf. la leçon de collision d'ids) ; renvoyer à la règle MAX sur toutes les branches.
- B-6 — Vocabulaire mêlé : composants en français (`<Ecriture>`, `useModule`, `creerClient`), mais clés/fichiers en anglais ou latin (`contrat/`, `etat-publie.openapi.json`) ; sans conséquence, mais fixer la règle (français sans accent dans les identifiants).

---

## Réponse aux six questions de la grille

1. **Points de divergence couverts ?** Bien couverts : dépendances, garde, état, droits, écriture/bandeaux, origine API, configuration, serveur Next, contrat partagé. Manqués : sorte de route et export dans le descripteur (H-3), contrat des emplacements et isolation de panne (H-4), compatibilité services/coque (H-1), organisation active et clés de cache (H-5), conventions UI (M-4), liens inter-modules (M-8), écrans d'avant-lecture (H-8).
2. **Rules vérifiables / préviennent-elles ?** Vérifiables : AD-2 (ESLint), AD-3 (test registre), AD-13 (test de recherche), AD-15 (test de concordance). Faibles : AD-5 (« aucune date », M-1), AD-7 (rien n'empêche d'afficher une écriture sans `<Ecriture>` ; ajouter une règle ESLint sur les appels `POST/PUT/PATCH/DELETE` via `creerClient` dans un composant sans `peutEcrire` ou une écriture centralisée par un hook `useEcriture`), AD-9 (comportement après relecture, M-2), AD-12 (la « marque qu'aucun réglage ne peut retirer » n'est pas testée : ajouter un test e2e qui change la marque et vérifie que le bandeau reste).
3. **Deferred sans divergence ?** Trois entrées en laissent : « champs manquants » (H-5, le repli du libellé n'est décidé nulle part), « télémétrie » (M-6), « contraste des couleurs » (H-6, la coque doit se défendre). Les autres sont légitimes.
4. **Dimensions de l'altitude :** sécurité front (K-2), accessibilité (H-6), performance/bundle (H-2), versions coque/services (H-1), déploiement/exploitation (H-7), observabilité (M-6) : silencieuses ou différées sans motif. i18n : outil et espace de noms décidés, mais pas le chargement par module (H-2), la langue avant connexion (H-8), le repli de langue ni le formatage `Intl` des montants (la Consistency fixe `Intl` mais pas la locale quand `accueil.langue` manque). Tests : voir M-5.
5. **Rationale / mermaid :** les AD sont maigres et dans le format attendu (Binds / Prevents / Rule), sans rationale parasite ; AD-5, AD-14 et AD-6 contiennent des consignes de procédure ou des détails d'implémentation à alléger (B-2). Mermaid : valides à la lecture, avec les réserves de B-1.
6. **Marquage `[ADOPTED]` (confronté au memlog) :**
   - Légitimes : AD-1 (D-1), AD-4 (D-2), AD-5 (D-5, sous réserve H-5), AD-6 (D-6), AD-7 (D-7), AD-10 (D-4), AD-11 (D-10), AD-15 (D-9).
   - AD-8 : le principe de l'origine unique (D-3) est validé, mais le préfixe `/_coque/*`, la table `/api/<code>/v1/…` → `/api/v1/…` et le chemin de l'état publié figurent dans la liste « proposés par l'architecte, à valider » ; marquer `[ADOPTED]` ne couvre que le principe. Scinder ou retirer le marquage des détails (et K-1 le prouve).
   - **Manque le marquage :** AD-2 (D-8 « Validé », y compris la règle ESLint) n'est pas marqué `[ADOPTED]`.
   - Non marqués à bon droit (proposés, jamais validés, non triviaux) : AD-3 (forme du descripteur, qui est la décision la plus structurante pour Dev A : à valider en priorité), AD-9, AD-12, AD-13, AD-14. Aucun n'est trivial.
   - AD-3 et AD-4 mélangent un adopté (garde unique) et un proposé (forme de `ecran.ts`, registre explicite) : traiter AD-3 comme décision à valider avant remise.

## Priorités avant la remise du 20/11
1. K-1 et H-3 (le seed et le descripteur : Dev A les copiera tels quels).
2. K-2, H-1, H-2 : une AD chacune (ou une ligne de Deferred datée).
3. H-5 et H-8 : trancher le repli du libellé, la source de l'espace avant connexion et l'organisation active.
4. H-4, H-6, H-7 : une AD courte chacune.
5. Passer AD-2 en `[ADOPTED]`, retirer le marquage des détails non validés d'AD-8.
