# STORY-955 : agent et centrale, premier incrément

Status: done

**Complexité :** grande (deux dépôts neufs, la chaîne de confiance de bout en bout)

**Épic :** EPIC-148 (monter une instance sur site et la superviser)
**Dépôts :** `MoneyVibesGroup/centrale-service` et `MoneyVibesGroup/agent-instance` (neufs, créés par l'utilisateur ;
`main` et `dev` posées par cette story), `prospera-plateforme` en lecture (étiquette `point-de-decision-v1`)
**Plage :** groupe B, n° 15 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

Le moteur a ses contrats signés (STORY-931), sa garde (937) et son point de décision (943), mais **personne ne les lit
encore pour de vrai** : ni centrale qui signe un état voulu, ni agent qui le vérifie. AD-26 exige que l'agent et la
centrale rejouent tous deux les vecteurs signés : un format lu de deux façons doit rougir d'un côté. Le plan du lot 2
fixe la fin : « un agent simulé vérifie un état voulu signé et applique une licence, test croisé des vecteurs ».

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 15)

| Exigence | Fait |
|---|---|
| un agent simulé vérifie un état voulu signé (chaîne racine → certificat → artefact, JWS EdDSA) | oui : l'exécuteur de l'agent, à l'heure de l'horloge scellée |
| … et applique une licence | oui : `lireLicence` du point de décision, licence rangée dans l'état de confiance ; `GET /decision` l'ouvre sur site |
| test croisé des vecteurs | oui : les 16 vecteurs de la plateforme rejoués des deux côtés, mêmes verdicts ; et le jeu croisé de la centrale appliqué par l'agent |

## Ce qui a été livré

### `centrale-service` (port 3401)

1. **Émetteur de l'état voulu** (AD-22, AD-25) : à chaque contact, un JWS `prospera-etat-voulu+jws` signé par la clé
   `centrale`, qui porte trois artefacts signés à part :
   - la **licence** (réémise seulement si modules, mise à jour ou sanctions changent ; sinon la même, à l'octet) ;
   - l'**heure de référence** (neuve à chaque contact) ;
   - la **liste de révocation** (réémise si elle change).
   `schemaEtatVoulu`, `revision` et `agentCible` sont aussi dans l'en-tête protégé.
2. **Registre** (`node:sqlite`) :
   - un compteur **par clé** pour tout ce qu'elle signe ;
   - la révision par instance ;
   - les contacts **par clef d'idempotence** (NFR-6) ;
   - les émissions sont sérialisées ; une émission annulée ne consomme aucun numéro.
3. **Clé d'exécution vérifiée au démarrage** (AD-28). La centrale refuse de démarrer si la clé n'est pas certifiée
   `centrale` par la racine attendue, si elle est hors validité, d'un autre environnement, ou si elle ne correspond pas
   à son certificat.
4. **`POST /api/centrale/v1/contacts`** : corps fermé. Refus `400 CONTACT_INVALIDE`, `404 INSTANCE_INCONNUE`, `413`.
   **`503 CONTACT_MTLS_NON_LIVRE`** hors profil de simulation. `GET /health`.
5. **Le jeu croisé** `vecteurs-centrale/` : trois états voulus émis par le vrai émetteur, reproductibles à l'octet :
   - r1 : licence n° 2, deux modules ;
   - r2 : même licence, heure neuve ;
   - r3 : licence n° 8 avec `fiscal`, clé de 2025 révoquée.

### `agent-instance` (port interne 3403) : une image, deux processus (AD-36)

1. **L'exécuteur** vérifie puis applique **tout ou rien**. Il vérifie dans l'ordre :
   - la chaîne de l'état voulu, à l'heure scellée ;
   - `schemaEtatVoulu` (plus récent ⇒ `ETAT_VOULU_TROP_RECENT`, avec `agentCible`) ;
   - le contrat, l'instance et la révision (antérieure ⇒ refus ; égale ⇒ déjà appliquée) ;
   - la liste de révocation, puis aucun signataire révoqué ;
   - l'heure de référence (numéro supérieur) ;
   - la licence (`lireLicence`).

   Il applique ensuite en une transaction : licence, révision, clés révoquées, horloge corrigée et journal. Au-dehors,
   un refus dit `ETAT_VOULU_REFUSE` ; le détail va au journal.
2. **L'horloge scellée** (AD-5) :
   - elle avance du temps mesuré ;
   - au redémarrage, elle prend la date du serveur si celle-ci avance, de 48 h au plus ;
   - seule une heure signée de numéro supérieur la corrige.
3. **Le magasin** (`node:sqlite`) et son **journal chaîné** (AD-12). `GET /health` passe en 503 si une entrée est
   retouchée.
4. **Le contact** tire de la centrale et dépose l'état voulu tel quel. Il ne vérifie rien. Sa clef d'idempotence est
   gardée jusqu'à ce que le contact aboutisse.
5. **Les routes internes** : `GET /heure` (le port `HorlogeDeReference` d'AD-6, `horlogeId: SCELLEE`), `GET /etat`,
   `GET /decision?module=` (le point de décision sur site lit la licence acceptée, AD-8), `GET /health`.

### Commun

- `vendor/prospera-plateforme/` copié **à l'étiquette `point-de-decision-v1`** (`5883740`) par
  `npm run plateforme:copier`, empreintes dans `ORIGINE.json`.
- Dans l'agent : `vendor/centrale-service/` copié à un commit fusionné du `dev` de la centrale.
- `test/vendor.test.ts` refuse une copie retouchée.
- Dockerfile avec étage `verification`, `docker-compose.yml` du profil de simulation, README (qui écrit, comment
  travailler).

## Preuves

- **Node 24** (`docker build --target verification`, export de chaque branche) : **centrale 41/41**, **agent 52/52**.
- **Test croisé** :
  - les 16 vecteurs de la plateforme rendent, dans les deux dépôts, le verdict attendu par `vecteurs/index.json` ;
  - l'émetteur de la centrale reproduit à l'octet le jeu croisé versionné ;
  - l'agent applique ce jeu, copié au commit `5671fab`, de r1 à r3 : licence n° 2 puis n° 8, horloge corrigée à
    chaque heure de référence, clé de 2025 révoquée.
- **Attaques** (agent). Chacune est refusée **sans rien changer** à l'état de confiance ni à l'horloge :
  - une signature altérée au milieu ;
  - un état voulu d'une autre instance ;
  - une révision antérieure ;
  - un `schemaEtatVoulu` 2 (`ETAT_VOULU_TROP_RECENT` + `agentCible`) ;
  - une clé révoquée, pourtant certifiée et valide ;
  - une licence signée par une clé de CI ;
  - une licence antérieure ;
  - une heure de référence antérieure ;
  - une licence d'une autre instance.
- **Horloge** : « + 10 ans » ⇒ + 48 h ; « recul de 40 jours » ⇒ inchangée ; correction en arrière par un numéro
  supérieur ; la correction survit au redémarrage.
- **Centrale** :
  - elle refuse de démarrer avec une racine de test en production, un certificat de CI, une clé expirée, une clé qui
    n'est pas la sienne, ou une clé « production » sous la racine de test ;
  - dix contacts simultanés donnent dix révisions et aucun numéro double ;
  - un contact rejoué rend le même document.
- **Mutations** (7, chacune rougit sur une assertion) :
  - centrale : idempotence retirée, licence toujours réémise, contact ouvert hors simulation ;
  - agent : révocation ignorée, révision antérieure acceptée, avance au démarrage non bornée, schéma trop récent
    accepté.
- **`docker compose up`** (`grp-b-955`, sous le verrou Docker, depuis `agent-instance`), centrale, exécuteur et
  contact `healthy` :
  - l'agent a tiré et appliqué l'état voulu de la vraie centrale : licence n° 2 ;
  - `GET /decision?module=bilan` ⇒ ouvert, `?module=assurance` ⇒ `MODULE_HORS_LICENCE` ;
  - `GET /heure` ⇒ `SCELLEE`, n° 5 ;
  - après le redémarrage de la centrale et de l'exécuteur : licence gardée, révisions 3 → 5 appliquées, journal
    `INTACT` ;
  - puis `down -v`, verrou rendu.

## Décisions

- **D-955-1 — Une seule étiquette pour toutes les copies : `point-de-decision-v1`.** Elle porte `@prospera/signature`,
  les six contrats, les vecteurs (inchangés depuis STORY-931, vérifié par `git diff`) et le point de décision. Aucune
  étiquette nouvelle n'a été posée.
- **D-955-2 — Pas de NestJS au premier incrément, ni dans l'agent ni dans la centrale.** Les deux tournent en
  TypeScript natif sous Node 24 (`node src/…`, `node --test`), comme `prospera-plateforme` dont ils copient le code. Les
  raisons :
  - `jose` 6 est ESM seul ;
  - l'exécuteur doit rester minimal (AD-36).

  Écart à la convention « les nouveaux services suivent le socle » (spine, Stack) ; **contestable**. La centrale
  passera à NestJS 11, MongoDB et Kafka (Confluent) quand elle gagnera le parc, le contact mTLS et les routes
  authentifiées de la console (suite d'EPIC-148).
- **D-955-3 — Le contact sans mTLS n'existe qu'en profil de simulation.** Hors de ce profil, la route rend
  `503 CONTACT_MTLS_NON_LIVRE`. Jamais un état voulu à un appelant non authentifié.
- **D-955-4 — Le magasin n'est pas encore chiffré, ni doublé d'un miroir, ni sous bail** (AD-34, AD-4, AD-3) : ils
  arrivent avec le montage. Le niveau d'ancrage affiché est `LOGICIEL`.
- **D-955-5 — Un état voulu s'applique tout entier ou pas du tout.** Une licence refusée, une heure antérieure, une clé
  révoquée : tout l'état voulu est refusé, et l'agent garde le précédent (AD-8 : « l'instance garde la précédente »).
- **D-955-6 — Un compteur par clé à la centrale** pour tous les artefacts qu'elle signe. Chaque type a ainsi un numéro
  strictement croissant (AD-7, AD-8, AD-25), sans compteur à tenir par type.
- **D-955-7 — L'échange entre le contact et l'exécuteur se fait par un volume** (`charge-contact.json`, `depot/`). Le
  socket local d'AD-36 viendra avec les commandes.

## Suite (EPIC-148)

- Le montage et l'enrôlement (jeton à usage unique, certificat mTLS, AD-29), le contact mTLS.
- Le magasin chiffré, son miroir, le bail.
- La remise de la licence aux espaces (`instance.licence.acceptee` / `.projetee`).
- Le parc et le témoin d'AD-4 dans la centrale (NestJS, MongoDB), l'alerte J+7.
- Le gabarit Compose de l'instance.
- Le réglage « Rebase and merge » seul des deux dépôts, qui revient à l'utilisateur.
