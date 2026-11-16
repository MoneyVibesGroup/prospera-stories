# STORY-945 : la bascule — retrait des quatre chemins d'octroi

Status: done

**Complexité :** grande (quatre chemins retirés ou rebranchés, une garde d'exécution, une migration, l'axe 2)

**Épic :** EPIC-144 (installer une offre en une action, par un seul point de décision)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service` (paiement : aucun changement, D-945-8)
**Plage :** groupe B, n° 5 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3). **Fusion liée à A-917**
(décision D-L2-2).

---

## Pourquoi

« Tout octroi passe par le moteur » (décision du PO du 2026-11-10, PRD FR-4) : seul le chemin 1, un plan
d'installation, **ouvre** un module. Les chemins 2 à 6 prolongent ou rouvrent un module déjà installé ; « un chemin
2 à 6 qui trouve un module jamais installé ne crée aucun droit : le module est noté acquis, à installer ».

Quatre chemins posaient encore `ACTIVE` hors du moteur (EPIC-144, « Bascule ») :

1. l'échéance soldée d'un contrat (`octroi-par-abonnement`) ;
2. le vertical d'une organisation (`octroi-par-vertical`) ;
3. la propagation d'un package modifié à ses titulaires (`propagation-des-packs`) ;
4. le `PUT /catalog/entitlements/{org}/{module}` de la console.

S'y ajoute la migration `rattrapage-packs`.

STORY-944 a laissé deux ponts, à retirer ici : l'axe 2 se **déduisait du droit** pour un module sans ligne
d'installation (D-944-2), et les souscrits n'étaient que l'offre choisie (D-944-1).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 5)

| Exigence | Fait |
|---|---|
| Aucun `ACTIVE` hors du moteur | oui : garde d'exécution dans `EntitlementsService.upsert` (`ACTIVE` exige une source `moteur:<plan>`), et garde statique `aucun-active-hors-du-moteur` sur tout le code du service |
| `entitlement.changed` toujours émis, même forme | oui : le moteur écrit par `EntitlementsService.upsert`, qui publie dans sa transaction ; le message n'a pas changé |
| Le `PUT` de la console reste servi, mais passe par le plan | oui : `PassageParLeMoteur` (voir « Ce qui a été livré », 3) |
| Annonce « ⚠ Contrats » avant la fusion | oui : journal de B, dans la PR de docs, **avant** toute fusion du code (la PR de code reste ouverte, voir « Fusion ») |

## Ce qui a été livré (catalogue #55, `99ba2db` et `9798ff5` sur `dev`)

1. **L'échéance soldée (chemin 2) n'ouvre plus rien.**
   - Elle prolonge les modules installés, comme avant (axe 3).
   - Elle note les autres « acquis, à installer » à l'offre de l'organisation (`offres.acquis`), dans la même
     transaction que sa trace d'idempotence.
   - L'acquis garde ce que le contrat a payé : la fin de la période couverte, le palier de dossiers, les packages et
     leurs référentiels. Quand le moteur ouvre le module, le droit reçoit `terme: ECHEANCE`, son échéance, son début et
     ses packages.
   - Une échéance suivante, tant que le module n'est pas installé, ne fait qu'allonger la période de l'acquis.
   - Le bilan rend `acquis` à la place d'`ouverts`. La règle pure rend `ACQUERIR` à la place de `CREER`.
2. **Les souscrits** que lit le point de décision sont l'offre **et** les acquis (fin de D-944-1).
3. **Le `PUT` de la console passe par le moteur** (`PassageParLeMoteur`, contrôleur `ConsoleEntitlementsController`,
   même chemin, même corps) :
   - la cohérence du catalogue est vérifiée d'abord ; ses refus (422, `400 REFERENTIEL_REQUIRED`) sont inchangés ;
   - **module pas installé** : il est noté acquis (source `console`). Un plan `origine: CONSOLE_PUT` l'installe ensuite
     par le point de décision unique, et il est **joué avant la réponse** : 201 avec le droit ouvert, source
     `moteur:<plan>` ;
   - **module installé** : le moteur réécrit le droit, sans nouveau plan (200). Cela couvre la version, les
     référentiels, la configuration et la levée d'une sanction ;
   - **statut autre qu'`ACTIVE`** (sanction, chemin 5) : écrit sans plan ; il n'ouvre rien ;
   - **refus nouveaux** :
     - 422 `MODULE_DEPENDANCE_MANQUANTE` (champ `refus`) : la dépendance s'ouvre d'abord ;
     - 422 `MODULE_INCONNU` : module sans manifeste ;
     - 409 `INSTALLATION_EN_COURS` ;
     - 409 `INSTALLATION_INACHEVEE`, avec `planId`.
4. **Une vérification différée, pour ce seul `PUT`.** Aucun module ne sert encore ses routes de vérification (C13).
   Dans un plan `CONSOLE_PUT`, une vérification d'un module **sans adresse déclarée** (`SERVICE_NON_CONFIGURE`) est
   notée « différée » au plan et n'empêche pas l'ouverture. Tout autre échec reste un échec : service déclaré mais
   injoignable, délai dépassé, statut inattendu, corps hors contrat, voyant ROUGE ou ORANGE. Un plan de
   `POST /installations` ne diffère jamais rien (FR-6, inchangé).
5. **Retirés** :
   - l'octroi par vertical : le consommateur `identity.org.*` reste abonné, car la pile de recette attend son groupe
     et la naissance par le moteur (948) en est la suite. Il lit, journalise, et n'octroie rien ;
   - la propagation d'un package modifié aux titulaires (chemin 4 : un package ne vaut que pour les nouveaux contrats) ;
   - la migration `rattrapage-packs` et son script.
6. **L'axe 2 ne se déduit plus du droit** (fin de D-936-1 et de D-944-2) : un module sans ligne d'installation est
   `NON_INSTALLE`. `installationDeduiteDuDroit` est retirée.
7. **Le réamorçage, une seule fois, par le moteur** : `npm run migrate:reamorcage-moteur`, ou
   `node dist/migrations/reamorcage-par-le-moteur.js` dans l'image.
   - Pour chaque droit d'avant le moteur, une ligne d'installation est écrite avec l'état que la déduction lui donnait :
     `INSTALLE` pour un droit vivant, `DESINSTALLE` pour un droit révoqué. Elle est signée du plan `reamorcage-945` et
     horodatée à l'heure de référence ; l'état publié de chaque module touché est recalculé.
   - Aucun droit n'est écrit. Une ligne existante n'est jamais réécrite. Le script est idempotent.
8. **Garde statique** (`src/aucun-active-hors-du-moteur.invariant.spec.ts`) : une écriture de `status: ACTIVE` ou une
   création de droit hors de trois fichiers nommés fait rougir la CI. Les trois fichiers :
   - l'exécuteur du plan ;
   - l'écrivain bas niveau, gardé à l'exécution ;
   - la régularisation d'un impayé (chemin 3), qui rétablit un droit installé suspendu par ce même impayé.

## Preuves

- **Node 24** (étage `verification`, export `git archive` du commit rebasé sur 948) : **91 suites, 1 310/1 310** ; lint (tout `src/`)
  et build verts. Avant le rebase : 90 suites, 1 266/1 266. En parallèle complet (`-w 4`), `verifications.spec.ts` (non
  modifié, appels HTTP à délai court) échoue une fois sur deux et passe seul (20/20) : instabilité de charge, pas de 945.
- **`test:socle`** (MongoDB 8 en jeu de répliques, Redis réel) : **18/18**, dont 3 nouveaux :
  - un plan `CONSOLE_PUT` dont le module ne déclare aucune adresse est TERMINE, la vérification notée
    « différée » ;
  - le même échec dans un plan `INSTALLATION` reste ROUGE et n'ouvre rien (FR-6) ;
  - un module acquis par le contrat s'ouvre avec `terme: ECHEANCE`, l'échéance, le début, les packages, le palier et
    les référentiels payés.

  Le test 936 de l'émetteur sème désormais la ligne que le réamorçage pose.
- **Tests unitaires neufs** :
  - `acquis.spec.ts` : souscrits, complément du contrat, vérification différée et ses cinq refus ;
  - `passage-par-le-moteur.service.spec.ts` : les six branches du `PUT` ;
  - `reamorcage-par-le-moteur.spec.ts` ;
  - `aucun-active-hors-du-moteur.invariant.spec.ts` ;
  - l'échéance soldée réécrite (acquis, période allongée) ;
  - les cas d'`upsert` sans source du moteur.
- **Mutations**, chacune rougit sur son assertion :
  1. l'échéance soldée qui recrée un droit : la garde statique et 3 tests de l'échéance rougissent ;
  2. la garde d'exécution retirée : `ACTIVE_HORS_DU_MOTEUR` rougit ;
  3. la vérification différée pour toute origine : le test « POST /installations ne diffère jamais » rougit (une
     première version ne compilait pas, refaite) ;
  4. le complément du contrat ignoré : le test d'intégration du contrat rougit.
- **Pile `grp-b-945`** (image de la branche, MongoDB 8, Kafka, Redis, bouchon des vérifications de `reseau` et
  JWKS ; MinIO indisponible sur ce poste, comme en 942, 944 et 950) :
  - **`PUT` de la console** :
    1. `PUT pdv` avant `reseau` : **422** `MODULE_DEPENDANCE_MANQUANTE`, `refus: [{module: pdv, modules: [reseau]}]` ;
    2. `PUT reseau` : **201**, source `moteur:<plan>`. Plan `CONSOLE_PUT` TERMINE ; ses 4 vérifications sont appelées
       au bouchon et rendent VERT ;
    3. `PUT pdv` : **201**, source `moteur:<plan>`. Ses 3 vérifications sont FAITE, NON_EXECUTEE (différée),
       puisque `pdv` n'a pas d'adresse ;
    4. rejeu avec une configuration nouvelle : **200**, même plan source ;
    5. `SUSPENDED` : **200**, source `admin` ;
    6. `ACTIVE` de nouveau (levée de la sanction) : **200**, source `moteur:<plan>` ;
    7. module inconnu : 422 (cohérence, inchangé) ;
    8. offre : `pdv:console`, `reseau:console` ; état publié : `pdv` et `reseau` EN_SERVICE, `stock` NON_INSTALLE.
  - **Chemin 2** : `paiement.abonnement.echeance.encaissee` (`STOCK`, `CATALOGUE`, palier 40) publié au broker.
    - Journal : « acquis, à installer [catalogue, stock] » ; **aucun droit** (404 sur les deux).
    - Les acquis portent l'échéance couverte (`2026-12-07`) et le palier.
    - `PUT catalogue` ensuite : **201**, `terme: ECHEANCE`, `echeanceLe: 2026-12-07`, `config: {dossiersMax: 40}`.
  - **Vertical** : `identity.org.created` avec `vertical: distributeur` publié au broker. Journal : « connue, rien
    n'est ouvert » ; **0 droit** pour l'organisation.
  - **Réamorçage** : deux droits d'avant le moteur sont écrits en base, sans ligne d'installation.
    - Avant : état publié `NON_INSTALLE` pour les deux (la déduction est bien retirée).
    - `node dist/migrations/reamorcage-par-le-moteur.js` dans le conteneur : `stock` EN_SERVICE, `pdv` (révoqué)
      DESINSTALLE. Lignes signées `reamorcage-945`, aucun droit touché.
    - Rejeu : `{"droits":5,"ecrites":0,"deja":5}`.
  - Pile descendue avec ses volumes, verrou rendu.
- **Recettes croisées : non jouées sur ce poste.** Elles déposent des paquets de référentiels au catalogue (MinIO),
  et l'image `minio/minio` n'est pas téléchargeable ici. Leur issue avec 945 se lit dans le code, et la pile la prouve
  (voir « Fusion »).

## Décisions

- **D-945-1 — Le `PUT` passe par le point de décision, dépendances comprises.** Un `PUT bilan` avant `balance` est
  refusé `MODULE_DEPENDANCE_MANQUANTE` : FR-4 le veut « même si la console a été contournée », et le serveur n'ajoute
  pas les dépendances (D-944-3). La console, ou la recette, ouvre `balance` d'abord.
- **D-945-2 — La vérification différée ne vaut que pour le `PUT`, et pour un service non déclaré.** Sans elle, plus rien
  ne s'ouvrirait nulle part tant que les modules ne servent pas leurs vérifications. Le `PUT` est le chemin de
  transition que le plan veut garder servi. Le plan note la vérification « différée » : elle n'est jamais comptée comme
  une réussite cachée. `POST /installations` reste strict (FR-6).
- **D-945-3 — L'acquis porte le contrat.** Sans lui, un module payé puis installé naîtrait sans terme et ne fermerait
  jamais. L'échéance soldée recopie ce qu'elle aurait écrit au droit ; le moteur l'y pose à l'ouverture.
- **D-945-4 — `ACTIVE` sans source du moteur est une erreur de programmation, pas un refus métier.** La garde
  d'exécution lève ; aucun chemin servi ne l'atteint, et la garde statique le prouve.
- **D-945-5 — Le réamorçage est un script, pas un geste du démarrage.** Le rejouer au démarrage masquerait une
  régression : un droit créé hors du moteur recevrait sa ligne en silence. Il se joue au déploiement de la bascule,
  comme `migrate:familles-fiscales`.
- **D-945-6 — Le consommateur `identity.org.*` reste abonné, sans octroi.** La recette attend son groupe
  (`platform-catalog-identite`), et la naissance d'une organisation par le moteur (STORY-948) en est la suite. Le
  retirer forcerait une modification de la recette (dépôt de A) pour rien.
- **D-945-7 — Un acquis reste à l'offre après l'installation.** C'est l'historique du contrat. La console croise
  l'acquis avec l'axe 2 pour afficher « à installer ».
- **D-945-8 — Paiement ne change pas.** Son seul chemin d'octroi est le `PUT` de son amorçage (`paiement`,
  `notification`, sans dépendance), toujours servi, désormais par un plan. Le retrait demandé « dans le catalogue et
  paiement » (D-L2-2) n'y trouve rien d'autre à retirer.
- **D-945-9 — Fusion AVANT A-917, sur décision de l'utilisateur (2026-11-16).** La règle de départ voulait la PR de code
  ouverte jusqu'à A-917 (D-L2-2), puisque les recettes croisées rougissent. A est à STORY-913, A-917 est loin ;
  l'utilisateur a décidé de fusionner 945 maintenant. A corrigera les recettes rouges (`atelier-balance`,
  `zone-franche`, `referentiel-par-dossier`, `abonnement`) à sa vérification. **Les recettes de `dev` sont donc
  rouges, et c'est connu** (voir « Fusion »).

## Fusion

**Catalogue #55 fusionnée le 2026-11-16** (`99ba2db`, `9798ff5` sur `dev`), avant A-917, sur décision de
l'utilisateur (D-945-9). **Les recettes croisées de `prospera-recette` sont rouges sur `dev` à partir de ce commit**,
jusqu'à leur correction par A. Ce qui rougit, et pourquoi :

| Recette | Ligne(s) | Ce qui casse | Correctif (A-917) |
|---|---|---|---|
| `atelier-balance` | 333-334 | `octroyer(bilan)` avant `octroyer(balance)` : `bilan` dépend durement de `balance` ⇒ 422 `MODULE_DEPENDANCE_MANQUANTE` | ouvrir `balance` d'abord |
| `zone-franche` | 445-446 (472 : `declarations` après `bilan`, bon ordre) | idem | idem |
| `referentiel-par-dossier` | 295-296 ; 390 | idem ; `microfinance` dépend de `reseau` | `balance` d'abord ; ouvrir `reseau` avant `microfinance` |
| `abonnement` (631, 632, 649, 650/651, 727, 728) | 634, 944, 1098 ; 770 | l'échéance soldée n'ouvre plus rien : le droit `source: abonnement:<id>` n'existe plus, le module est « acquis, à installer » (`GET /api/v1/offres/{org}`, champ `acquis`) ; le vertical n'ouvre plus rien (`vertical:distributeur`) | après le paiement, installer le module par le moteur (`PUT` ou `POST /installations`) ; le droit naît `moteur:<plan>`, avec le terme et l'échéance du contrat. L'attente sur le vertical tombe (FR-4 : le vertical n'est plus un chemin) |

Le `PUT` de la console reste servi et garde son corps et ses succès (201, 200). Seuls l'ordre des dépendances et la
`source` du droit changent pour un appelant. Après la fusion conjointe : jouer `migrate:reamorcage-moteur` sur toute
base existante (les piles neuves de recette n'en ont pas besoin).

**Vérification finale** :
- sur le commit rebasé sur 948, 949 et 952 (`88ac181`) :
  - Node 24, étage `verification`, constructeur classique depuis les images en cache : **94 suites, 1 374/1 374**,
    lint et build verts ;
  - `test:socle` : **18/18** ;
- GitHub a rejoué la PR sur 953 (`4dfde25`), fusionnée entre-temps. Sur le `dev` qui en résulte :
  - typecheck, garde statique et specs de l'essai, de l'installation et de l'état publié : **215/215** ;
  - 953 n'écrit aucun `ACTIVE` ;
  - la suite complète n'a pas été rejouée sur ce commit.

## Suite

- **A** (à sa vérification) : corriger les recettes croisées rouges (demande du journal de B), et jouer
  `migrate:reamorcage-moteur` au déploiement.
- **D** (lot frontend) : la console lit les nouveaux refus du `PUT` et l'offre (`acquis`) ; ticket à écrire avec les
  écrans d'EPIC-144.
- **Déploiement** : jouer `migrate:reamorcage-moteur` après le catalogue de 945.
