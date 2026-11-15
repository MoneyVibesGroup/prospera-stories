# STORY-936 : La matrice des neuf états et la vraie route

Status: done

**Complexité :** élevée (le calcul de l'état publié, sa route, son émetteur, ses tâches d'échéance)

**Épic :** EPIC-145 (l'état publié fait foi pour la coque et pour chaque garde)
**Dépôt :** `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 7 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

« Première story : la matrice des neuf états, en cas exécutables ; l'état publié se calcule à la lecture, depuis les faits
et le port `HorlogeDeReference` ; la vraie route `GET /api/instance/v1/etat-publie/{organisationId}`, servie avant la
démo ; émission de `etat-publie.changed.essai` et `.reel` par des tâches BullMQ à l'heure dite » (EPIC-145, AD-6,
AD-24). Le contrat a été figé en STORY-932, les tâches posées en STORY-933.

## Ce qui doit être vrai à la fin (plan §4, n° 7)

| Exigence | Fait |
|---|---|
| Cas exécutables | oui : les **33 cas** de `contrat/matrice-etats.json` sont rejoués par le calcul lui-même |
| L'état se calcule à la lecture depuis `HorlogeDeReference`, aucun `Date.now()` pour décider | oui : l'heure est un argument du calcul ; un test pousse l'horloge du conteneur à +10 ans, l'état ne change pas |
| `GET /api/instance/v1/etat-publie/{organisationId}` servie | oui : chemin du service `/api/v1/etat-publie/…`, appelée pour de vrai dans la pile, réponse conforme au contrat figé |

## Ce qui a été livré

1. **`src/etat-publie/calcul.ts`** :
   - `calculerEtat`, une fonction pure, la seule qui dise l'état publié ; la route, l'émetteur et les tâches
     l'appellent ;
   - `transitionsAVenir` : préavis, lecture seule, fin d'essai, effacement ;
   - `installationDeduiteDuDroit` (D-936-1).
2. **La route** :
   - calculée à chaque lecture, au contrat ;
   - chaque module connu du catalogue y figure, et `instance` toujours `EN_SERVICE` ;
   - `droitsEffectifs` = droits du jeton ∩ modules ouverts, `instance:*` toujours ;
   - les droits déclarés ne vont qu'aux administrateurs (`instance:bilan:consulter`) ;
   - refus : 403 `ORGANISATION_HORS_JETON`, 400 `ORGANISATION_ID_INVALIDE`, et 503 `HORLOGE_INDISPONIBLE` quand aucun
     instant n'est connu.
3. **`EmetteurEtatPublie`**, seul émetteur de `etat-publie.changed.<espace>`. Il recalcule :
   - dans la **transaction** de `entitlement.changed`, pour tout fait du droit (les quatre chemins d'octroi, la
     révocation, le terme) ;
   - à l'échéance : il est le vrai `DeclencheurDeTransition`, et l'amorce de STORY-933 est retirée ;
   - au démarrage, pour chaque droit, ce qui rattrape un arrêt ou un Redis vidé.

   Il ne publie que si l'état change, avec un `numero` croissant (mémoire `etats_emis`). Il repose les tâches à venir ;
   Redis hors service ne fait pas échouer l'écriture d'un droit.

## Preuves

- `docker build --target verification` (Node 24) : **1193/1193**.
- **Mutation** : des bornes inclusives au lieu d'exclusives font rougir 3 cas (échéance, fin du préavis, fin d'essai).
- `test:socle` (vrai MongoDB, transactions) : **9/9**. Le parcours vérifié :
  - un droit à échéance publie EN_SERVICE (n° 1) ;
  - la tâche de l'échéance publie PREAVIS (n° 2) ;
  - le démarrage d'après le préavis publie LECTURE_SEULE (n° 3) ;
  - chaque rejeu ne publie rien.
- **Pile `grp-b`**, image de la branche, jetons RS256 signés par un JWKS local (`host.docker.internal`) :
  - `PUT` du droit `pdv` (201), puis la route donne `pdv EN_SERVICE` et des `droitsEffectifs` filtrés ;
  - `DELETE` du droit (200), puis la route donne `pdv DESINSTALLE` ;
  - sur Kafka, `etat-publie.changed.reel` porte les numéros 1 (EN_SERVICE) puis 2 (DESINSTALLE) ;
  - une autre organisation reçoit 403, un appel sans jeton 401, un identifiant invalide 400 ;
  - **la réponse réelle valide le schéma figé** `EtatPublie`.

## Décisions

- **D-936-1 — L'axe 2 se déduit du droit jusqu'à EPIC-144** : un droit vivant se lit installé, révoqué désinstallé,
  absent non installé. C'est un chemin de transition nommé, que remplacera l'état du plan d'installation. Le cas
  « droit `ACTIVE` sans installation » de la matrice reste vrai du calcul : c'est la source de l'axe 2 qui change à la
  bascule. Sans cette déduction, tout module de tout client se lirait `NON_INSTALLE` dès aujourd'hui.
- **D-936-2 — Pas de 404 `ORGANISATION_INCONNUE` avant le registre des naissances.** La partie A ne tient pas encore
  les organisations : la naissance arrive avec STORY-938 et EPIC-144. Le contrat garde le 404, la route ne le rend pas
  encore.
- **D-936-3 — Un jeton de service n'est pas encore lu** (claim `organisationId`) : seuls les membres lisent la route.
  Les identités de service arrivent avec STORY-938.
- **D-936-4 — Ce qui n'est pas encore tenu se publie à sa valeur sûre** : `interrupteurs: []` (un nom absent se lit
  éteint), `estDG: false` (registre, EPIC-157), instance `NORMAL` et version non figée (agent, EPIC-148), époque 0.
- **D-936-5 — La relecture de A** demandée « avant figeage » pour 936 n'a plus d'objet de contrat : ni la matrice ni
  la route n'ont changé depuis l'étiquette `contrat-etat-publie-v1`. La conformité est prouvée par la réponse réelle,
  validée contre le schéma figé, et par les 33 cas rejoués.

## Suite

- STORY-937 : la garde partagée, qui applique l'état publié seul, et paiement en double lecture.
