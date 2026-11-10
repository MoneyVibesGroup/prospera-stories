# Relecture adversaire — spine `prospera-app` (coque)

Méthode : pour chaque paire, deux constructions qui respectent AD-1 → AD-15 à la lettre et pourtant ne s'assemblent pas. Gravité : B = bloquant (casse à l'intégration ou en production), M = majeur (divergence silencieuse), m = mineur.

Verdict global : le spine verrouille bien la direction des dépendances et la garde, mais il ne dit presque rien sur les **données partagées entre modules** (clés de requête, emplacements, entités communes), sur **l'identité** (organisation courante, session mobile) et sur les **routes hors garde** (public, export) ; ces trous donnent dix-huit paires incompatibles, dont six graves.

---

## P1 — Clés de requête TanStack : invalidation après une écriture qui change l'état d'un autre module (B)

- **Construction A** (`pdv`) : encaisse une vente, appelle `invalidateQueries(['pdv'])`. Conforme à la convention « clés préfixées par le code ».
- **Construction B** (`stock`) : affiche `['stock', 'niveaux']`. Conforme.
- **Incompatibilité** : la vente décrémente le stock, mais `pdv` n'a aucun droit d'invalider `['stock']` (AD-2 interdit d'importer `stock`, et la clé est un détail interne de `stock`). L'écran de stock affiche un niveau faux jusqu'au prochain refetch. Inversement, si `pdv` invalide `['stock']` par chaîne littérale, la règle de frontière ne le voit pas (ce n'est pas un import) et l'on couple deux modules en silence. De plus, la 30 s de relecture de l'état publié ne concerne que l'état, pas les données métier.
- **Aussi** : AD-9 relit l'état sur 403 nommé, mais **quelle clé** relit quoi ? « Une seule clé » (AD-5) n'est pas nommée ; un module qui préfixe `['instance', …]` peut entrer en collision avec la clé de la coque.
- **AD proposé (AD-16)** : *Rule : la coque réserve le préfixe `['coque', …]` (état publié, session, organisation) ; un module n'invalide que les clés préfixées par son propre code ; un effet croisé se déclare par un **événement de domaine nommé** (`coque.emettre('stock.mouvement')`) que la coque diffuse, et le module intéressé s'abonne et invalide sa propre clé ; la coque invalide en bloc `['<code>']` quand l'état d'un module change (ouvert → fermé, lecture seule).*

## P2 — Module hôte et contributeur d'emplacement : forme des props, qui charge les données (B)

- **Construction A** (hôte `catalogue`) : déclare l'emplacement `fiche-produit` et le rend avec `<Emplacement nom="fiche-produit" produit={produit} />` (objet complet déjà chargé).
- **Construction B** (contributeur `stock`) : dépose un composant qui attend `{ produitId: string }` et charge lui-même `/api/stock/v1/niveaux?produit=`.
- Les deux obéissent à AD-2 (ni l'un ni l'autre n'importe l'autre) ; l'incompatibilité apparaît à l'exécution : props `undefined`, ou N requêtes en cascade par ligne de liste. Rien ne dit non plus si le contributeur reçoit l'identifiant ou l'objet, ni **quel type TypeScript** décrit le contrat de l'emplacement (le type vit chez l'hôte, que le contributeur n'a pas le droit d'importer).
- Variantes : (a) deux contributeurs déposent dans le même emplacement, ordre indéterminé ; (b) un contributeur plante, et fait tomber l'hôte (pas de frontière d'erreur) ; (c) le contributeur n'a pas le droit mais le module est ouvert : montre-t-on la tuile ?
- **AD proposé (AD-17)** : *Rule : le contrat d'un emplacement (nom, type des props, = identifiants seuls, jamais d'objet métier) est déclaré dans `src/coque/emplacements/<nom>.ts`, propriété de la coque et importable par l'hôte comme par les contributeurs ; l'hôte ne passe que des identifiants, le contributeur charge ses propres données par son client d'API ; chaque contribution est rendue dans une frontière d'erreur et un `Suspense` par la coque, triée par `ordre` déclaré, et filtrée par le droit de la contribution.*

## P3 — Deux modules, un même service derrière le proxy : la garde backend ne sait pas quel module est appelé (B)

- **Construction A** (`credit`) : appelle `/api/credit/v1/dossiers/42`.
- **Construction B** (`collecte`) : appelle `/api/collecte/v1/dossiers/42` ; les deux codes visent le même service (AD-8 : « plusieurs codes peuvent viser un même service »).
- Le proxy retire `/api/<code>` et envoie `/api/v1/…` : **le code du module est perdu**. Le service reçoit la même route pour deux modules, dont l'un peut être `SUSPENDU` et l'autre `EN_SERVICE`. Le `403 <MODULE>_NOT_ENTITLED` (C2) ne peut être produit que si le service connaît l'appelant ; sinon un module fermé contourne sa fermeture en passant par le code de son voisin (ou l'inverse : le service refuse les deux).
- Pire, AD-9 relit l'état pour « le » module ; `<MODULE>` du refus et `code` du client ne sont pas liés.
- **AD proposé (AD-18)** : *Rule : le proxy transmet le code appelé dans un en-tête `X-Prospera-Module` (posé par le proxy, jamais par le client, et écrasé s'il arrive du navigateur), la garde du service applique l'habilitation de **ce** module, et le `403` nommé porte ce code dans `module` ; `creerClient(code)` de la coque est le seul constructeur d'URL, et un test de contrat refuse tout couple (code, route) absent de la table de routage.*

## P4 — Deux propriétaires d'une même entité (M à B)

- **Construction A** (`catalogue`) : écran « Produit » avec création et édition, type `Produit { id, libelle, prixMinor }` écrit à la main.
- **Construction B** (`stock`) : écran « Référence » qui crée des produits à la volée à la réception de marchandises, avec son propre type `Produit { id, designation, prix: number }` (décimal).
- AD-2 interdit l'import entre modules ; AD-15 ne partage que l'état publié ; la convention des montants n'impose le couple (entier mineur, devise) que « dans les données ». Les deux types sont valides, mais **deux écrans de création** de la même ressource côté API, deux validations zod divergentes, deux libellés de menu.
- Les montants : `prix: number` en décimal contre `prixMinor` ; la convention existe, mais aucune brique commune ne l'impose (pas de type `Montant` de la coque).
- **AD proposé (AD-19)** : *Rule : chaque entité métier a un **module propriétaire** unique, inscrit dans une table `contrat/proprietaires.json` (entité → code) ; seul ce module porte son écran de création/modification et exporte son schéma zod via le client d'API du **code du propriétaire** ; les autres modules la lisent par un type généré depuis l'OpenAPI du service (jamais écrit à la main), et la coque fournit les types `Montant`, `Quantite`, `Horodatage` communs.*

## P5 — Types de l'API : générés pour l'état publié seulement (M)

- AD-15 ne génère que l'état publié. Chaque module écrit à la main son « client d'API typé » (AD-3) : deux modules qui parlent au même service écrivent deux types pour la même réponse (cf. P4). Un changement de service casse l'un et pas l'autre.
- **AD proposé** (resserre AD-15 / AD-3) : *Rule : tout client d'API de module est généré depuis l'OpenAPI du service qui porte son code (`contrat/<code>.openapi.json`, copie gardée comparée à la source en CI) ; aucun type de réponse n'est écrit à la main.*

## P6 — Coque web et app mobile : session, jeton, organisation courante (B)

- **Construction A** (web) : session par refresh en cookie httpOnly, access en mémoire, `organisationId` pris dans la lecture de session.
- **Construction B** (mobile) : jeton de bout en bout dans le coffre de l'appareil, `organisationId` mémorisé localement au premier choix (le spine défère l'authentification mobile « code + PKCE »).
- Les deux consomment le même proxy (AD-8) ; mais rien ne définit **où vit l'organisation courante** : dans le jeton, dans un paramètre d'URL, dans un en-tête, ou dans le chemin de `etat-publie/{organisationId}` ? Le web peut interroger l'état de l'organisation A tout en agissant avec un jeton rattaché à B.
- **AD proposé (AD-20)** : *Rule : l'organisation courante est portée par le **jeton** (revendication `org`) et par lui seul ; toute lecture `…/{organisationId}` la prend du jeton (ou refuse une valeur différente par `403 ORGANISATION_INCOHERENTE`), et le changement d'organisation est un **nouvel échange de jeton** commun au web et au mobile.*

## P7 — Utilisateur membre de deux organisations (B)

- **Construction A** (coque) : au choix d'organisation, remplace l'`organisationId` du contexte React et relit l'état ; le cache TanStack garde `['stock', …]` de l'organisation précédente (la clé du module ne contient pas l'organisation).
- **Construction B** (module `pdv`) : clé `['pdv','ventes']` sans organisation.
- Résultat : au retour d'un changement d'organisation, **les ventes de A s'affichent sous B** pendant la durée de `staleTime` ; pire, une écriture optimiste atterrit chez l'autre. Aussi : un onglet ouvert sur A et un autre sur B partagent le même refresh en cookie httpOnly : le second écrase la session du premier.
- **AD proposé (AD-21)** : *Rule : le changement d'organisation **vide tout le cache TanStack** (`queryClient.clear()`) et recharge la page ; l'organisation courante est un segment d'URL (`/o/<org>/m/<code>/…`) ou, à défaut, un cookie par onglet est interdit ; les clés de requête de module sont construites par `cle(code, …)` de la coque, qui y inclut l'organisation.*

## P8 — Administration (`instance`) et un module : l'export (B)

- AD-14 : « l'export de chaque module est atteignable depuis `instance`, quel que soit l'état du module (`SUSPENDU` compris) ». Mais qui détient l'écran d'export, et quelle route ?
- **Construction A** (`instance`) : un écran « Exports » listant les modules, qui appelle `/api/<code>/v1/export`.
- **Construction B** (`stock`) : son propre bouton « Exporter » dans `/m/stock/export`.
- Avec le module `SUSPENDU`, la garde AD-4 de `/m/stock/…` rend l'écran d'état : B est inatteignable alors que A passe. Et `/api/stock/v1/export` peut être refusé par le service (`MODULE_NOT_ENTITLED`) pour le même état, puisque AD-9 ne distingue pas lecture d'export (P3 aggrave). Deux formats d'export possibles (CSV d'un côté, archive de l'autre).
- **AD proposé (AD-22)** : *Rule : l'export est un écran unique de `instance` (`/m/instance/exports/<code>`) qui appelle la route normalisée `GET /api/<code>/v1/export` ; un module n'écrit jamais d'écran d'export, il déclare seulement son `exportable: true` dans `ecran.ts` ; la garde backend traite cette route comme `LECTURE_EXPORT` autorisée en `SUSPENDU` et `LECTURE_SEULE`.*

## P9 — Libellé de menu (catalogue) et sous-entrées (module) (M)

- AD-3 : le libellé de premier niveau vient du catalogue, les sous-entrées du module. Champ « libellé de menu du module commercial » absent de la lecture (Deferred), contourné par la configuration — **ce qu'AD-10 interdit** (« tout ce que la lecture rend ne se met pas en configuration »).
- **Construction A** (coque) : en l'absence du champ, retombe sur la clé `modules.<code>.titre` du module. **Construction B** (module) : sa clé `titre` dit « Stock » pendant que le catalogue dira « Gestion des stocks ». Même module, deux titres selon la source ; l'ordre des entrées de premier niveau n'est pas non plus défini (alphabétique ? catalogue ?).
- Variante : un module commercial (offre) qui regroupe deux codes techniques (`stock` + `pdv` sous « Distribution ») : la coque doit-elle fusionner deux dossiers sous un même premier niveau ? AD-3 suppose 1 code = 1 premier niveau.
- **AD proposé (resserre AD-3)** : *Rule : l'entrée de premier niveau est celle du **module commercial** de la lecture (libellé, ordre, icône) ; tant que le champ manque, la coque affiche le **code** et non une clé de message, et la table « module commercial → codes » vient de la lecture ; un module ne déclare jamais de libellé de premier niveau ni d'icône dans son `ecran.ts`.*

## P10 — App expert-comptable et coque lisent la même matrice (M)

- AD-15 : la coque garde une copie de `matrice-etats.json` comparée à la source ; l'app expert-comptable (autre dépôt, :3100) fait la sienne, sans le test. Deux copies, deux versions : l'état `ESSAI_TERMINE` apparaît dans l'une et pas l'autre. Le mot « copie » est la faille : qui bloque la fusion de la source tant que les deux copies ne sont pas à jour ?
- Aussi, le **type** de l'état est un enum fermé : un état inconnu se lit `NON_INSTALLE` dans la coque (AD-4), mais l'app expert-comptable l'ignore et rend le module ouvert (fail-open).
- **AD proposé (resserre AD-15)** : *Rule : la matrice porte un `version` entier, la lecture renvoie la version qu'elle suppose, et tout consommateur dont la copie est plus ancienne ferme (`NON_INSTALLE`, fail-closed) et lève une alerte ; la CI de la source échoue si un consommateur déclaré dans `contrat/consommateurs.json` n'est pas à la même version.*

## P11 — Écran public sans session (lien de paiement, page publique) (B)

- AD-4 : « toute page de module vit sous `(app)/m/[code]/…` avec un seul layout de garde » ; la garde lit l'état avec un jeton. Aucun emplacement pour un écran **sans session**.
- **Construction A** (`paiement`) : place la page de lien dans `src/app/pay/[jeton]/page.tsx`, hors `(app)`, hors garde, appelle `/api/paiement/v1/liens/<jeton>` sans jeton d'accès : conforme à AD-8 (proxy), contraire à AD-4 « une seule garde ».
- **Construction B** (`distributeur`, page publique) : la met sous `m/distributeur/public/…` ; la garde exige une session et renvoie à la connexion, le payeur anonyme est bloqué.
- Et l'état de l'instance (suspension) : un payeur anonyme peut-il payer sur un module `SUSPENDU` ? Personne ne décide. `creerClient(code)` ajoute le jeton, 401 déclenche la reprise → boucle de redirection pour l'anonyme.
- **AD proposé (AD-23)** : *Rule : les écrans publics vivent uniquement sous `src/app/(public)/p/[code]/…`, avec leur propre layout, sans session ni menu ; ils se déclarent dans `ecran.ts` (`publics: [{ chemin, etatsAutorises }]`), utilisent `creerClientPublic(code)` (sans jeton, sans reprise sur 401), et la coque sert une page d'indisponibilité si l'état du module n'est pas dans `etatsAutorises` ; la lecture de cet état pour un anonyme passe par un point d'accès public à champs minimaux.*

## P12 — Dates affichées : fuseau et horloge de référence (M)

- Convention : ISO 8601 « telle que rendue », affichée avec `Intl` dans la langue d'`accueil`. Le **fuseau** n'est pas dit.
- **Construction A** (coque) : formate `effacementLe` avec le fuseau du navigateur (Intl par défaut) → un utilisateur à Paris voit « 12 nov. 01:00 », un autre à Lomé « 12 nov. 00:00 ».
- **Construction B** (module `pdv`) : formate la clôture de caisse en UTC. Une vente à 23:30 locale apparaît le lendemain dans la liste du jour du module et la veille dans la coque.
- Pour « essai terminé, effacement le … », l'affichage et la décision du serveur ne coïncident pas : la date de calendrier affichée peut être celle de la veille. L'horloge de référence de l'instance (horloge de recette en `staging`, cf. 649) n'est pas exposée ; le navigateur d'un utilisateur dont l'horloge est fausse affiche un compte à rebours faux (« reste 3 jours » alors que l'état a changé).
- **AD proposé (AD-24)** : *Rule : toute date s'affiche par `formaterDate(valeur, { style })` de la coque, dans le **fuseau de l'organisation** (`organisation.fuseau`, repli `Africa/Lome`), et tout « reste N jours » est calculé à partir de `maintenant` fourni par la lecture (`horlogeReference`), jamais de `Date.now()` ; les modules n'emploient pas `Intl.DateTimeFormat` ni `toLocale*` directement (règle lint).*

## P13 — Deux écrans d'état différents à l'intérieur d'un même module : états à grain fin (M)

- AD-5 : `useModule(code)` rend `{ ouvert, peutEcrire, sante, interrupteur }`. `interrupteur(nom)` : qui nomme les interrupteurs ? Module A lit `interrupteur('lecture-seule-stock')`, la lecture fournit `lectureSeuleStock` ; deux modules inventent deux conventions (kebab vs camel), l'un retombe sur `false` (fail-open).
- **AD proposé (resserre AD-5)** : *Rule : les noms d'interrupteurs sont déclarés dans le manifeste du module et dans son `ecran.ts` (`interrupteurs: [...]`), la coque refuse (test) un nom absent de l'un des deux, et `interrupteur(nom)` d'un nom inconnu renvoie `false` pour toute action d'écriture et `true` pour toute restriction (fail-closed).*

## P14 — Contribution à l'emplacement `accueil` : tuiles et données (M)

- AD-13 fait de l'accueil un emplacement où chaque module ouvert dépose ses tuiles. Deux modules déposent des tuiles qui chargent chacune leurs chiffres ; ils n'ont ni taille de grille, ni ordre, ni gestion du refus (un 403 d'un module fermé en cours de route). Une tuile en erreur casse la page d'accueil (P2 b).
- Couvert par AD-17 (frontière d'erreur, ordre) ; ajouter : *chaque tuile déclare `taille` ∈ {S, M, L} et un `droit`, et le tableau d'accueil n'affiche pas de tuile dont le droit n'est pas dans `droitsEffectifs`.*

## P15 — Droit d'une entrée vs droit d'une action (M)

- AD-3 : chaque **entrée** exige un droit. Les **actions** à l'intérieur de l'écran (supprimer, valider) n'en exigent pas par règle, seulement `<Ecriture>` (état). Module A masque « Supprimer » par `droitsEffectifs.includes('stock:mouvement:supprimer')`, module B laisse le bouton visible et attend le 403. La lecture `droitsEffectifs` est lue par la coque ; les modules y accèdent comment ? `useModule` ne rend pas les droits.
- **AD proposé (resserre AD-6)** : *Rule : un module teste un droit par `useDroit('<code>:<objet>:<action>')` de la coque, seule voie d'accès à `droitsEffectifs` ; toute action d'écriture porte un droit nommé en plus de `<Ecriture>` ; le 403 de droit est traité comme `AUCUN_DROIT` par la coque (message unique), non comme une erreur de module.*

## P16 — Rafraîchissement 401 contre relecture 403, concurrence (m à M)

- Deux modules déclenchent en parallèle un 401 : « une seule reprise sur 401 » est dans la convention, mais pas **la file** : deux reprises parallèles consomment deux fois un refresh à rotation → la seconde échoue, déconnexion. Et 403 nommés simultanés : N relectures d'état en rafale.
- **AD proposé (précise AD-8/AD-9)** : *Rule : le client d'API partage une seule promesse de reprise (single-flight) et dédoublonne la relecture de l'état publié (au plus une en vol).*

## P17 — Routes et noms : `m/[code]` contre dossiers à tiret, segments dynamiques (m)

- Le code `pi-spi` donne `/m/pi-spi/…`, mais l'espace de messages `modules.pi-spi.*` et la clé `['pi-spi']` : les clés next-intl avec tiret passent mal en notation pointée dans certains outils d'extraction ; un module qui convertit en `pi_spi` ou `piSpi` casse le test « les dossiers coïncident avec le registre ».
- Et deux modules déclarant la même `chemin` d'entrée (`/m/stock/mouvements` vs un sous-chemin que `pdv` réexporte) : les chemins sont-ils relatifs à `/m/<code>` ? Non précisé.
- **AD proposé (resserre AD-3)** : *Rule : `chemin` est toujours relatif à `/m/<code>` et ne commence jamais par `/`; l'espace de messages est `modules['<code>']` (accès par crochets), la clé de requête `['<code>', …]` ; un test rejette tout `ecran.ts` dont un chemin sort de son préfixe.*

## P18 — Espace d'essai et module de l'essai : données de démonstration (m)

- AD-12 : un déploiement lit son propre moteur. Mais le lien « vers l'autre espace » est une configuration ; un module qui construit lui-même un lien profond vers l'autre espace (`${config.autreEspace}/m/stock/…`) arrive sur un module qui n'existe pas dans l'autre espace → écran « non installé ». Aucun module ne doit construire de lien inter-espaces.
- **AD proposé (précise AD-12)** : *Rule : seul `coque/espace/` produit un lien vers l'autre espace, et uniquement vers sa racine ; un module n'en construit pas.*

---

## Synthèse des trous les plus graves (ordre de priorité)

1. P3 — le proxy perd le code du module : la garde du service ne sait pas lequel est appelé (AD-18).
2. P7 + P6 — organisation courante : cache et jeton non liés à l'organisation, multi-appartenance (AD-20, AD-21).
3. P2 — contrat d'emplacement non défini : props, chargement, erreurs (AD-17).
4. P1 — invalidation croisée entre modules sans voie légale (AD-16).
5. P11 — écran public sans session non prévu par la garde unique (AD-23).
6. P8 — export : deux écrans possibles, l'un bloqué par la garde en `SUSPENDU` (AD-22).

Suivent, par gravité : P4/P5 (propriétaire d'entité, types générés), P12 (fuseau et horloge), P10 (versions de la matrice), P9 (libellé), P13/P15 (interrupteurs et droits d'action), le reste en mineur.

## Nouveaux AD à écrire (récapitulatif)

AD-16 isolation et invalidation des clés ; AD-17 contrat d'emplacement ; AD-18 en-tête de module posé par le proxy ; AD-19 propriétaire unique d'entité ; AD-20 organisation courante portée par le jeton ; AD-21 changement d'organisation = cache vidé, clés construites par la coque ; AD-22 export unique dans `instance` ; AD-23 écrans publics ; AD-24 dates (fuseau, horloge de référence). Resserrements : AD-3 (libellé, chemins relatifs, messages), AD-5 (interrupteurs fail-closed), AD-6 (`useDroit`), AD-8/9 (single-flight), AD-12 (liens inter-espaces), AD-15 (types d'API générés, version de la matrice).
