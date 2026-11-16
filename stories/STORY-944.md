# STORY-944 : l'installation, un plan enregistré

Status: done

**Complexité :** grande (un point de décision copié, l'offre, le plan, son exécuteur, l'axe 2 de l'état publié)

**Épic :** EPIC-144 (installer une offre en une action, par un seul point de décision)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 4 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

Le plan du lot 2 demande : « installation idempotente, étapes horodatées, reprise après coupure ; l'axe 2 lu depuis le
plan (fin de D-936-1) ». Jusqu'ici, la partie A n'avait pas de plan d'installation. L'axe 2 de l'état publié se
**déduisait du droit** (D-936-1) : un droit vivant se lisait installé.

Sources :

- spine du moteur, AD-23 : « une installation est un plan enregistré, idempotent, aux étapes horodatées » ;
- PRD du moteur : FR-4 (chemin 1), FR-5, FR-6, FR-7 et FR-40 ;
- contrat de module C13 : les routes de vérification et leur clef d'idempotence.

Le point de décision est livré par STORY-943 (`point-de-decision-v1`).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 4)

| Exigence | Fait |
|---|---|
| Installation idempotente | oui. La même demande (même clef) rend le même plan, sans le relancer ; une clef réutilisée sur une autre demande donne 409. Chaque étape se rejoue sans rien doubler. |
| Étapes horodatées | oui. `debuteLe` et `finiLe` de chaque étape, `creeLe` et `termineLe` du plan, tous lus sur `HorlogeDeReference`. Sans heure de référence, aucune étape ne s'exécute. |
| Reprise après coupure | oui. Une étape commencée et jamais finie reste `A_FAIRE` ; à la reprise, le plan repart à cette étape. L'exécuteur coupé n'écrit plus rien. |
| Axe 2 lu depuis le plan (fin de D-936-1) | oui pour tout module qu'un plan a touché. Les droits posés avant le moteur se déduisent encore du droit, jusqu'à leur réamorçage par STORY-945 (D-944-2). |

## Ce qui a été livré (catalogue #52, `c3c63c8` sur `dev`)

1. **Le point de décision, copie épinglée** (`src/vendor/point-de-decision/`) :
   - copie de `point-de-decision-v1` (`prospera-plateforme`, `5883740`) : `point-de-decision.ts` et `conformite.json` ;
   - `ORIGINE.json` garde leurs sha256 ;
   - un test vérifie les empreintes et rejoue les 14 cas de conformité contre la copie ;
   - `.gitattributes` : `src/vendor/** -text`. Sans cette règle, `core.autocrlf` changerait l'empreinte. La copie
     n'est ni lintée ni formatée.
2. **L'offre** (`PUT|GET /api/v1/offres/{organisationId}`, collection `offres`), FR-1 et FR-2 :
   - l'équipe de déploiement donne les modules demandés ;
   - leurs dépendances dures sont ajoutées avec leur raison, par la même résolution que la console et paiement ;
   - sélection, auteur, date (heure de référence) et `revision` sont enregistrés ;
   - ce sont les **souscrits** que lit le point de décision.
3. **Installer** (`POST /api/v1/installations`) :
   - `decider` est appelé pour chaque module, dans l'ordre des dépendances ; `planifies` = les modules que le plan
     installe avant lui ;
   - **tous** les refus sont rendus (422, champ `refus`), dans l'ordre d'AD-23, même si la console est contournée.
     Le serveur n'ajoute pas les dépendances : il refuse `MODULE_DEPENDANCE_MANQUANTE` ;
   - autres refus : 422 `MODULE_INCONNU` ; 409 `MODULE_DEJA_INSTALLE`, `INSTALLATION_EN_COURS` (avec le plan qui le
     tient) et `CLE_IDEMPOTENCE_REUTILISEE` ;
   - la demande acceptée devient un **plan enregistré** (`plans_installation`), unique sur `(organisation, espace,
     clef)`. La clef vient de `Idempotency-Key` ; à défaut, elle est calculée sur la demande.
4. **Les étapes**, par module, dans l'ordre des dépendances :
   - `INSCRIRE` : l'axe 2 passe `EN_INSTALLATION` (collection `installations`) ;
   - `VERIFIER` : une étape par vérification du manifeste. La route du module est appelée sous l'identité du moteur
     (`INSTALLATION_JETON_SERVICE`), avec `Idempotency-Key = <plan>:<étape>`. Contrat **nouveau** :
     `contrat/verification-installation.schema.json`. Seul `VERT` réussit ; un service non configuré, injoignable,
     trop lent, un statut autre que 200 ou un corps hors contrat donnent `NON_EXECUTEE`, jamais une réussite (FR-6) ;
   - `OUVRIR` : le droit `ACTIVE` est posé par le moteur (`EntitlementsService.upsert`, source `moteur:<plan>`), puis
     l'axe 2 passe `INSTALLE`. Le droit vient d'abord : un module n'est jamais `INSTALLE` sans droit.
     `entitlement.changed` reste émis.
5. **L'exécuteur** (`ExecuteurDePlans`) :
   - un **bail** par plan, prolongé à chaque étape. Un exécuteur qui l'a perdu n'écrit plus rien, même sur l'étape
     qu'un autre rejoue ;
   - il reprend les plans interrompus au démarrage, puis par un balayage toutes les `INSTALLATION_BAIL_MS` ;
   - FR-5 : un échec bloque son module et ses dépendants du plan, et seulement eux ; le plan passe `EN_ATTENTE` ;
   - `GET /api/v1/installations/{planId}` donne les étapes horodatées, le **bilan** ligne par ligne (VERT, ROUGE avec
     l'étape en cause, ORANGE en attente de telle dépendance) et `interrompueA` quand personne ne joue le plan ;
   - `POST …/reprendre` (« Reprendre » / « Réessayer ») ne rejoue que les étapes en échec ;
   - `GET /api/v1/installations?organisationId=` donne les 50 derniers plans.
6. **L'état publié** :
   - l'axe 2 se lit dans `installations` (`axe2` de `faits-du-catalogue.ts`), à la lecture comme à l'émission ;
   - l'émetteur relit aussi les installations au démarrage ;
   - un module sans ligne se déduit encore du droit (D-944-2).
7. **Le filtre d'erreurs global** : `refus`, `modules` et `planId` passent la liste blanche, gardés par leur forme
   complète. Sans eux, le 422 partait avec son seul premier code (constaté sur la pile).
8. **Configuration** :
   - `INSTALLATION_SERVICES` : `code=url,…`, l'adresse du service de chaque module ;
   - `INSTALLATION_JETON_SERVICE` ;
   - `INSTALLATION_DELAI_VERIFICATION_MS` : 10 s par défaut ;
   - `INSTALLATION_BAIL_MS` : 30 s par défaut.

## Preuves

- **Node 24** (étage `verification`, export `git archive`) : **90 suites, 1 288/1 288**, lint et build verts.
- **`test:socle`**, contre un vrai MongoDB 8 en jeu de répliques et un vrai Redis : **15/15**, dont 6 nouveaux :
  - le plan est joué au bout, chaque étape une fois et horodatée, et les états publiés sont `EN_INSTALLATION` puis
    `EN_SERVICE` ;
  - coupé au milieu d'une vérification, il est repris **à cette étape** par un autre exécuteur, sans doublon ;
  - le revenant n'écrit rien, même quand il répond pendant que le nouveau porteur joue la même étape ;
  - FR-5 : ROUGE, puis « Reprendre » ;
  - FR-6 : `NON_EXECUTEE` reste un échec ;
  - sans heure de référence, rien ne s'exécute.
- **Mutations**, chacune rougit sur l'assertion :
  - une dépendance ignorée par `prochaineEtape` ;
  - l'axe 2 ignoré ;
  - l'ordre des refus défait ;
  - le code de vérification non contrôlé ;
  - `refus` retiré du filtre ;
  - le bail retiré de `finir` : elle survivait d'abord, d'où le test du revenant sur la même étape ;
  - `NON_EXECUTEE` comptée comme réussite.
- **Pile `grp-b-944`** : image de la branche, MongoDB 8, Kafka, Redis, et un bouchon pour les routes de vérification
  et le JWKS local.
  - **Démarrage** : le catalogue démarre `healthy` ; l'émetteur relit les installations au démarrage.
  - **Offre et refus** :
    - offre `pdv` ⇒ `reseau` ajouté avec sa raison ;
    - sans offre : 422 avec deux refus ;
    - `pdv` seul : 422 `MODULE_DEPENDANCE_MANQUANTE` ;
    - un membre de tenant : 403.
  - **Installation de `pdv` et `reseau`**, 11 étapes, `reseau` d'abord :
    1. un bouchon à 15 s donne `DELAI_DEPASSE` (`NON_EXECUTEE`). Bilan : `reseau` ROUGE à l'étape 2, `pdv` ORANGE en
       attente de `reseau` ;
    2. « Reprendre », puis **`docker kill` au milieu de l'étape 4** (une tentative, `A_FAIRE`, bail encore tenu) ;
    3. redémarrage du conteneur : « repris après interruption », puis TERMINE ;
    4. les étapes 2 et 4 comptent 2 tentatives, avec la même clef d'idempotence au bouchon ; toutes les autres une
       seule ;
    5. le jeton du moteur est présenté à chaque appel.
  - **Écritures** :
    - 2 droits `ACTIVE`, source `moteur:<plan>` ;
    - 2 `entitlement.changed` ;
    - 4 `etat-publie.changed.essai` : `EN_INSTALLATION` (n° 1), puis `EN_SERVICE` (n° 2), pour chaque module.
  - **Après l'installation** :
    - l'état publié lu donne `pdv` et `reseau` `EN_SERVICE` ;
    - le rejeu de la même clef donne 200 et le même plan ;
    - une autre clef sur `pdv` donne 409 `MODULE_DEJA_INSTALLE` ;
    - une clef réutilisée sur une autre demande donne 409 `CLE_IDEMPOTENCE_REUTILISEE` ;
    - `stock` donne 422 avec `refus` complet : `MODULE_NON_SOUSCRIT`, puis `MODULE_DEPENDANCE_MANQUANTE` sur
      `catalogue`.
  - La pile est descendue avec ses volumes.
- MinIO n'était pas dans la pile (image indisponible sur ce poste) : le catalogue démarre sans lui. Seul le dépôt de
  paquets de référentiels s'en sert.

## Décisions

- **D-944-1 — Les souscrits sont l'offre enregistrée.** Le point de décision lit « les modules souscrits au contrat ».
  La partie A ne garde pas le contrat (il est dans paiement). L'offre de FR-1, choisie « dans les limites du
  contrat », en tient lieu. Sans offre, rien n'est souscrit. STORY-945 l'alimente depuis le contrat : chemin 2,
  « acquis, à installer ».
- **D-944-2 — L'axe 2 vient du plan, sinon du droit, jusqu'à STORY-945.** Lire le plan seul fermerait tout module
  ouvert par les quatre chemins d'avant le moteur. Le cabinet en vit, et l'épic exige qu'il ne se ferme pas avant la
  S6. La déduction ne vaut plus que pour un module sans ligne d'installation. STORY-945 réamorce ces droits par le
  moteur, puis retire `installationDeduiteDuDroit`.
- **D-944-3 — Le serveur n'ajoute pas les dépendances à l'installation.** Il refuse `MODULE_DEPENDANCE_MANQUANTE`
  (FR-4). C'est l'offre qui les ajoute (FR-2), et la console envoie la liste résolue.
- **D-944-4 — Les vérifications appellent la route du module.** Elles vont directement à l'adresse déclarée dans
  `INSTALLATION_SERVICES`, pas encore par le proxy de l'espace, qui n'existe pas. Aucun module ne sert encore ses
  routes de vérification. Jusqu'à ce qu'il les serve, ses vérifications restent `NON_EXECUTEE` : ROUGE au bilan,
  jamais une réussite. Ce contrat attend les propriétaires des modules.
- **D-944-5 — Les prérequis du manifeste ne s'exécutent pas encore.** Ils n'ont pas de route (C1) : ils restent dans
  le manifeste pour le bilan des écrans.
- **D-944-6 — Le bail est un minuteur technique** (horloge du conteneur), comme celui du relais d'outbox. Il ne décide
  aucun état. Le porteur est `hostname:pid` : un conteneur redémarré reprend aussitôt ses propres plans.
- **D-944-7 — Sur site, la partie A ne tient pas encore la licence.** `licence: null` y vaut fermé :
  `MODULE_HORS_LICENCE`. La licence acceptée arrive avec EPIC-150.
- **D-944-8 — Droits existants réutilisés.** Écrire demande `entitlement:grant` (l'opérateur qui ouvrait les modules
  à la main) ; lire demande `org:read`. Un droit dédié viendra avec les écrans de la console.

## Suite

- **STORY-945, la bascule** :
  - retirer les quatre chemins qui posent `ACTIVE` et la migration `rattrapage-packs` ;
  - réamorcer une seule fois les droits de `dev` par le moteur : une ligne `installations` `INSTALLE` par droit vivant,
    puis retirer `installationDeduiteDuDroit` ;
  - le chemin 2 note « acquis, à installer » dans l'offre ;
  - le `PUT` de la console passe par un plan ;
  - le tout fusionné avec A-917.
- **Bilan publié** `instance.bilan.changed` et passage « En service » (FR-7, FR-8) : avec 951.
- **Écrans de la console** (S5) : ticket pour D au lot frontend.
