# STORY-958 : le socle de prospera-comptabilite-service

Status: done

**Complexité :** élevée (dépôt neuf, toute la pile du moteur, trois garanties de cloisonnement, preuve de bout en bout)

**Épic :** EPIC-111 (le socle de la comptabilité)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service` (neuf, créé par l'utilisateur ; `main` et `dev` posées par
cette story)
**Plage :** groupe B, n° 3 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 958 ; D-L3-1, D-L3-4).
**Débloque :** STORY-959 (les exercices et la tenue), puis toute la comptabilité (961 → 970).

---

## Pourquoi

Décision du PO du 2026-08-27 : la comptabilité cesse d'être une fondation différée (`epics-comptabilite-2026-08-27.md`).
Avec elle, Prospera **enregistre** au lieu de justifier : une écriture est un acte. Le socle doit donc être juste avant la
première écriture :

- le module ne s'ouvre que par **l'état publié** (spine du moteur AD-24, `garde-etat-publie-v1`) ;
- tout est cloisonné par **dossier et par exercice** (EPIC-111) : c'est le grain de la tenue (Q1 : un exercice est tenu
  aux cahiers OU au journal, D-L3-4) et de la numérotation (STORY-961) ;
- le référentiel se résout **par dossier et par exercice**, jamais par organisation : c'est l'écart de STORY-422, à ne
  pas recréer ;
- la piste d'audit distingue **« proposé par la machine » de « choisi par l'utilisateur »** dès le socle (Q3, D-L3-4),
  même si l'IA (EPIC-117, 118) n'est pas dans ce lot.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 958)

| Exigence | Fait |
|---|---|
| Node 24, client Kafka de Confluent (`createTopics` avant `subscribe`, `metadataMaxAge` 10 s, consommateur neuf à chaque relance, `/health` borné) | oui : `SupervisionConsommateur` et `KafkaHealthIndicator` de paiement (STORY-957, D-957-6), repris tels quels ; Kafka de la pile **sans création automatique de topics**, le topic est créé par le service |
| MongoDB 8.0 en jeu de répliques, Karapace | oui : compose du dépôt (`mongo:8.0` `rs0`, Karapace 6.2) ; le démarrage refuse un `MONGODB_URI` sans `replicaSet=` ; `/health` vérifie jeu de répliques et primaire |
| Garde sur l'état publié (`garde-etat-publie-v1`) | oui : copie épinglée (sha256 `a830c449…`), consommateur, projection `(epoque, numero)`, garde GLOBALE fermée (D-958-3) |
| Manifeste du module | oui : `manifestes/comptabilite.manifest.ts`, copie à l'octet dans `src/module.manifest.ts` (D-958-2) |
| Cloisonnement par dossier ET par exercice | oui : `PorteeComptable` (organisation du jeton ; dossier et exercice résolus par dossier-service), `filtreCloisonne` / `documentCloisonne` (D-958-4) |
| Référentiel du dossier | oui : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/referentiel` (SN, SMT, SFD-BCEAO, CIMA ; jamais deviné) |
| Piste d'audit : proposé par la machine / choisi par l'utilisateur | oui : `provenance` de chaque entrée, auteur humain, append-only, cloisonnée (D-958-5) |
| Port fixé (3417 proposé, à vérifier) | **3420** : 3417 et 3418 sont déjà réservés (D-958-1) |
| `docker compose up` sain, `/health` 200 ; tests, lint, build verts | oui (§ Preuves) |

## Décisions (prises par défaut, contestables)

- **D-958-1 : le port est 3420, pas 3417.** 3417 est réservé à `prospera-ia-service` (ex-`assistant-service`, spine
  de l'IA commune, `manifestes/assistant.manifest.ts`, amendement du plan de février), 3418 à `prospera-ia-centrale`,
  3419 est publié par `reseau-service`. 3410 → 3416 sont aux services de C et de D. 3420 n'apparaît dans aucun compose,
  aucun `.env`, aucun document du poste (recherche du 17/11).
- **D-958-2 : le code du module est `comptabilite`, et son manifeste est neuf, sans numéro M.** La liste
  `manifestes-a-produire.md` ne connaît que M22 `finance-transactions` (transactions et ordres de paiement, hors février),
  qui ne passe aucune écriture de grand livre : ce n'est pas ce module. `comptabilite` est aussi l'origine que A a
  ouverte au hub de balance (A-921). Neuf droits `comptabilite:*` sont déclarés ; ils ne sont pas attribuables avant le
  retrait de `perms[]` (borne du jeton), et le socle ne les lit pas (D-958-9).
- **D-958-3 : la garde est GLOBALE et lit l'état publié SEUL.** Chaîne `JwtAuthGuard → EmailVerifiedGuard →
  GardeComptabilite` en `APP_GUARD`, dans cet ordre (test de câblage) : toute route qui n'est pas `@Public()` est gardée,
  sans décorateur à oublier. Le service naît après le moteur : aucune double lecture, jamais `entitlement.changed`.
  Fermée : organisation absente du jeton, aucun état reçu, valeur inconnue ou version de matrice inconnue ⇒ refus. La
  garde ne relit pas le KYC (AD-24 : l'état publié décide) ; la route du référentiel le subit quand même, par la garde de
  dossier-service (403 `KYC_NOT_APPROVED` relayé).
- **D-958-4 : la portée est résolue par `dossier-service`, avec le jeton du membre, à chaque requête.** Pas de
  read-model local des dossiers ni des affectations : la portée d'un collaborateur est la règle de dossier-service
  (STORY-353, 404 hors portée), et la recopier ferait deux vérités. Deux lectures, bornées à 3 s
  (`DOSSIER_SERVICE_DELAI_MS`), fermées (503 `DOSSIER_SERVICE_INDISPONIBLE`, jamais une portée devinée). Défense en
  profondeur : un dossier dont l'`orgId` n'est pas celui du jeton, ou des axes évalués sur un autre exercice que celui
  demandé, sont introuvables. **Les exercices sont ceux de dossier-service** (`exerciceId`) : la comptabilité ne crée pas
  ses propres exercices, elle y attache sa tenue (STORY-959). Contestable si la latence le demande : un read-model
  alimenté par `dossier.*` et `dossier.exercice.*` pourra remplacer la lecture, derrière le même port (`SourceDuDossier`).
- **D-958-5 : la piste d'audit dit qui engage et qui a choisi.** Chaque entrée a un `auteurId` (toujours un humain : la
  machine n'est jamais auteur, IA commune AD-1) et une `provenance` : `CHOISI_PAR_L_UTILISATEUR` ou
  `PROPOSE_PAR_LA_MACHINE`. La proposition éventuelle est citée avec le vocabulaire du contrat de proposition (AD-5 :
  `origine` REGLE | MODELE | LANGAGE, décision ACCEPTEE | MODIFIEE | REJETEE). Règle : « proposé par la machine » ⇔
  proposition ACCEPTÉE telle quelle ; une proposition modifiée ou rejetée laisse la valeur à l'utilisateur, et reste
  citée. Toute autre combinaison lève. La collection est append-only ; le chaînage par empreinte et la numérotation
  continue (séquentialité prouvée) viennent avec la validation inaltérable (STORY-964), comme des ajouts de champs. Les
  actes de service (Reprise, moteur) ajouteront un type d'auteur le jour où un tel acte existe.
- **D-958-6 : `/health` lit MongoDB et Kafka, pas dossier-service ni Karapace.** dossier-service est une dépendance de
  la requête, pas du processus. Le fil ne dépend pas du registre (comme paiement et le catalogue) : Karapace est dans la
  pile et le script `schemas:*` est prêt, mais le socle ne produit aucun fait, donc aucun sujet (le premier : 959).
- **D-958-7 : la pile du service est dans le dépôt** (`docker-compose.yml`, profil `comptabilite`, patron des services
  de D), avec un Kafka qui **ne crée aucun topic seul** (`KAFKA_AUTO_CREATE_TOPICS_ENABLE=false`) : une pile qui créerait
  ses topics cacherait l'oubli du `createTopics` avant `subscribe`.
- **D-958-8 : le service n'entre pas encore dans la recette.** Rien de croisé à jouer tant que le catalogue ne connaît
  pas le module et que la comptabilité ne publie rien. Le moment viendra avec la balance dérivée (B-967) : demande
  écrite à A, pour information, dans le journal de B.
- **D-958-9 : la lecture du référentiel est ouverte à tout membre dont la portée couvre le dossier**, comme la lecture
  des axes chez dossier-service (pas de `@Roles`). Les droits du manifeste seront lus par `/moi/droits` dès la
  première route d'écriture (STORY-959).

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 17/11 ; le dépôt a été amorcé par cette story.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #604 (annonce du contrat, AVANT le code) | `main` `17dd951` |
| `prospera-comptabilite-service` | #1 | `dev` **`8f36ef9`** (rejoué de `330a7d0` ; arbre identique à celui éprouvé, `4e3b84c`) |

- **Amorce du dépôt** : `main` et `dev` partent de `08c6c54` (README d'une ligne, `.gitignore`, `.gitattributes`
  `* text=auto eol=lf`) ; branche par défaut `main` ; `core.autocrlf=false` dans le checkout du poste. Les réglages du
  dépôt ne sont pas touchés (ils n'admettent déjà que le rebase).
- `src/acces/` : projection et consommateur de l'état publié, `GardeComptabilite` (garde globale) ;
  `src/vendor/garde-etat-publie/` (copie épinglée, `ORIGINE.json`, `.prettierignore`) ;
- `src/portee/` : `PorteeComptable`, `filtreCloisonne`, `documentCloisonne` ;
- `src/referentiel/` : port `SourceDuDossier` et son adaptateur HTTP borné, `ResolveurDePortee`, `referentielEffectif`,
  route du référentiel ;
- `src/piste/` : `EntreeDePiste` (append-only), `provenance.ts` (Q3), `PisteAuditService` ;
- `src/kafka/`, `src/health/` : repris de paiement (STORY-957) ; `src/auth/` : JWT RS256/JWKS, e-mail vérifié ;
- `src/module.manifest.ts`, `docker-compose.yml`, `Dockerfile` (étage `verification`), `scripts/schemas/registre.mjs`,
  `test/socle/` (suite de bout en bout).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive`) : **16 suites,
  180 passés, 2 sautés** (les deux comparaisons aux sources de `prospera-plateforme` et `prospera-stories`, absentes
  du conteneur) ; `npm run lint` et `npm run build` verts. Sur le poste (Node 25, `npm ci --ignore-scripts`) : `tsc`
  et lint verts.
- **Suite du socle** (`npm run test:socle`, réseau `grp-b_default`, vrai MongoDB 8.0 `rs0`, vrai Kafka **sans création
  automatique de topics**, doublures HTTP d'auth et de dossier-service) : **20/20**.
  - Le consommateur crée `etat-publie.changed.reel` avant de s'abonner et rejoint son groupe en 0,4 s.
  - Sans état publié : 403 `COMPTABILITE_NOT_ENTITLED`, et dossier-service n'est pas appelé.
  - `EN_SERVICE` publié sur Kafka : projeté en 2,7 s ; la route répond 200 (`SMT`) à cette organisation, 403 à une
    autre.
  - Rejeu plus ancien (`SUSPENDU` n° 0) ignoré, `LECTURE_SEULE` n° 2 appliqué (la lecture reste ouverte) ; un message
    illisible est sauté et le suivant projeté.
  - Jeton d'une autre clé ou d'une autre audience : 401 ; e-mail non vérifié : 403.
  - Jeton du membre relayé tel quel à dossier-service.
  - Portée : dossier hors portée 404, exercice d'un autre dossier 404 `EXERCICE_INTROUVABLE`, dossier d'une autre
    organisation 404, identifiant malformé 400, dossier-service lent 503 en 0,8 s.
  - Piste : transaction validée relue dans sa portée et vide ailleurs (autre exercice, autre dossier, autre
    organisation) ; transaction abandonnée, aucune entrée ; `updateOne` et `deleteMany` lèvent sur le vrai pilote ;
    provenance incohérente refusée avant la base.
- **Mutations : 20/20 rougissent sur une assertion** (script joué dans l'image de vérification) : garde (état inconnu,
  organisation non vérifiée, `ABONNEMENT_EXPIRE`), projection (`(epoque, numero)`, autre module), enveloppe, portée (clé
  fixée à la main, exercice remplacé), référentiel (SN par défaut), résolveur (organisation, exercice), source (jeton,
  401, borne), Q3 (acceptée tenue pour choisie, machine sans proposition), piste (append-only, auteur), environnement
  (jeu de répliques), câblage (ordre des gardes). Une neuvième mutation de la garde (espace lu toujours `REEL`) est
  équivalente : la matrice figée ne distingue les espaces que pour l'import, la reprise et les contrôles.
- **Pile `grp-b`** (compose du dépôt, image runtime du commit final, volumes neufs, verrou Docker pris de façon
  atomique après celui de D) : `docker compose up` sain, les quatre conteneurs `healthy` ; `/api/v1/health` **200**
  (`mongodb` : `rs0`, primaire ; `kafka` : up) ; la route sans jeton : 401. Le vrai service a aussi consommé les six
  messages de la suite (groupe `comptabilite-etat-publie`, offset 6/6, retard 0). Kafka arrêté : 503 en 3,0 s (trois
  contrôles) ; Kafka relancé : 200 en 6 s. `npm run schemas:compatibilite` : registre joignable, aucun schéma (0 sujet).
  Pile descendue avec ses volumes (`down -v`), verrou rendu.
- **Piège trouvé en route** : `prettier --write "src/**/*.ts"` avait reformaté la copie épinglée de la garde (empreinte
  `01f9e769…` au lieu de `a830c449…`). Le test d'empreinte l'a vu sous Node 24 ; la copie a été reprise à l'étiquette et
  `src/vendor/` est désormais dans `.prettierignore`.

## Pour la suite

- **STORY-959** (les exercices et la tenue) : la première écriture. Elle consigne `EXERCICE_OUVERT` dans la piste,
  dans la transaction de l'acte (`PisteAuditService.consigner(portee, …, session)`), résout sa portée par
  `ResolveurDePortee`, et lit les droits par `/moi/droits`. Le premier fait (`comptabilite.exercice.changed@1` ou
  équivalent) passe par une outbox et s'annonce dans « ⚠ Contrats » avant la fusion, avec son schéma au registre
  (`contrat/schemas/`, `npm run schemas:enregistrer`).
- **Le module au catalogue** (story de B, à placer avant que le moteur doive l'installer) : manifeste
  `comptabilite` dans `platform-catalog-service` et ses gardes ; tant qu'il n'y est pas, le module se lit
  `NON_INSTALLE` et la garde refuse tout. Avec lui : `enrichiPar` de `balance` gagne `comptabilite`.
- **Routes d'instance** (C13 : vérification `referentiel-resolu`, export, import, effacement, santé, `migrer`) : à
  créer avant que le moteur installe le module.
- **Recette** (A) : `comptabilite-service` dans `AUTH_AUDIENCE` de l'IdP et dans `docker-compose.recette.yml`, à la
  première recette croisée (B-967).
