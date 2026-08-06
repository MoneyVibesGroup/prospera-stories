# STORY-133 : IP des sessions — trancher le proxy de confiance, sinon l'écran « Sessions ouvertes » affiche l'IP de l'app

**Epic :** EPIC-002 — Authentification & sécurité du compte (auth-service)
**Réf. :** STORY-126 § Technical Notes (« IP derrière proxy — à trancher au déploiement ») · FE-021
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** high
**Statut :** done
**Sprint :** 20
**Créée le :** 2026-07-23
**Clôturée le :** 2026-08-06
**Origine :** Integration Gate de **FE-021**, en deux contextes navigateur contre le stack docker
**Services :** `auth-service` (:3001) — **et le `ThrottlerGuard` des 7 autres services** (voir § Scope,
ajouté le 2026-08-03 ; le compte a été corrigé au démarrage : `admin-panel` porte lui aussi un throttler,
donc **8** services et non 7)

> **Complexité `high` malgré 3 points.** Le volume de code est trivial (une ligne par service) ; c'est la
> **décision** qui est chargée, et son mode d'échec est asymétrique : trop restrictive elle ne corrige
> rien, trop permissive elle transforme le rate limiting en passoire. Cf. AC-02/AC-06.

> **Le trou, en une phrase :** l'IP listée n'est pas celle de l'utilisateur — c'est celle de la machine qui
> a appelé l'IdP, aujourd'hui l'app Next elle-même.

---

## Constat — mesuré le 2026-07-23

Deux appareils réellement connectés (Chrome/Windows et Safari/iPhone) sur le stack docker, vus par
`GET /users/me/sessions` :

```
ip: "::ffff:172.22.0.1"   (Chrome/Windows)
ip: "::ffff:172.22.0.1"   (Safari/iPhone)
```

**La même IP pour les deux** : celle de la passerelle docker, parce que la connexion passe par le **BFF** de
l'app cliente (Route Handler Next côté serveur) avant d'atteindre l'IdP. En production derrière un ingress,
ce sera l'IP de l'ingress — jamais celle de l'utilisateur.

STORY-126 a **délibérément** choisi de ne pas lire `X-Forwarded-For` (« aucune donnée contrôlée par le
client n'entre en base ») et a renvoyé la décision au déploiement. C'est le bon défaut tant que la question
n'est pas tranchée : une IP falsifiable serait pire qu'une IP inutile. Mais tant qu'elle ne l'est pas :

1. l'IP affichée dans « Sessions ouvertes » **n'aide pas** l'utilisateur à reconnaître une connexion ;
2. le repère « lieu inhabituel » (dérivé côté affichage : IP différente de la session courante) **ne se
   déclenchera jamais**, puisque toutes les sessions portent la même IP ;
3. l'IP conservée en base n'a aucune valeur pour le support en cas d'incident.

⚠️ À ne pas confondre avec l'**agent utilisateur**, corrigé côté frontend en FE-021 : le BFF reporte
désormais le `User-Agent` du navigateur, et les libellés d'appareil sont justes. L'IP, elle, ne peut pas
être corrigée depuis le front sans que le backend accepte un en-tête — c'est exactement la décision à
prendre ici.

---

## Scope

- **Trancher** la chaîne de confiance : quel(s) proxy(s) sont de confiance (ingress, load balancer, BFF de
  l'app cliente) et sur quelle base (réseau interne, en-tête signé, mTLS).
- Selon la décision, activer `app.set('trust proxy', …)` **avec une liste explicite d'IP/CIDR de
  confiance** — jamais `true` global, qui rendrait l'IP falsifiable par n'importe quel client.
- Faire porter la décision par `extractClientOrigin` (l'utilitaire unique et testable posé par STORY-126) :
  un seul point à modifier, un seul point à tester.
- Décider si le **BFF de l'app cliente** doit lui-même transmettre l'IP d'origine (il est le premier saut :
  sans lui, l'ingress ne voit que l'app). Si oui, la story frontend correspondante est à créer.

### ⚠️ Ajout du 2026-08-03 — la même décision gouverne le `ThrottlerGuard`, sur **tous** les services

Relevé en revue de sécurité de **STORY-145** (`balance-service`), à un endroit qui n'avait rien à voir
avec l'écran « Sessions ouvertes ». `trust proxy` n'étant configuré **nulle part**, le tracker par défaut
du `ThrottlerGuard` retombe lui aussi sur `req.ip`, c'est-à-dire sur l'IP du reverse-proxy :

1. **un seul compteur pour tout le monde.** Toutes les organisations partagent le même seau de jetons —
   un tenant bruyant (ou une simple boucle de rattrapage) épuise la limite de **tous les autres**. La
   protection anti-abus devient un vecteur de déni de service entre tenants ;
2. **et la limite par IP ne veut plus rien dire** : un attaquant distribué n'est pas plus limité qu'un
   client unique, puisque leurs requêtes tombent de toute façon dans le même compartiment.

C'est la **même** décision de topologie, appliquée à un second consommateur — d'où le rattachement ici
plutôt qu'une story séparée : trancher deux fois la chaîne de confiance, c'est se garantir deux réponses
divergentes. Le correctif est le même `app.set('trust proxy', <liste explicite>)`, à porter dans le
`main.ts` de chaque service.

⚠️ Et le risque de le faire vite est **exactement** celui d'AC-02 : un `trust proxy: true` global rendrait
le compteur du throttler pilotable par un simple en-tête `X-Forwarded-For` forgé — **contournement complet
du rate limiting**, une régression bien pire que le compteur partagé qu'il corrige.

**Services concernés** : `expert-comptable` (:3000), `kyc-service` (:3002), `platform-catalog-service`
(:3003), `bilan-service` (:3004), `document-service` (:3006), `balance-service` (:3007) — plus
`admin-panel` (:3010) s'il porte un throttler.

> ✅ **Vérifié au démarrage (2026-08-06)** : `admin-panel` porte bien un `ThrottlerGuard` global
> (`app.module.ts:65` + `APP_GUARD` ligne 98), comme les sept autres. Le « s'il porte un throttler » est
> donc levé : **8 services**, 8 dépôts, 8 PR.

**Hors périmètre :** géolocalisation (ville/pays) — reste la question ouverte de STORY-126, distincte de
celle-ci et à instruire seulement une fois l'IP juste.

---

## La décision, tranchée le 2026-08-06

Écrite en entier dans **[`docs/architecture-proxy-de-confiance-2026-08-06.md`](../architecture-proxy-de-confiance-2026-08-06.md)**
(c'est le livrable « décision **écrite**, pas seulement codée » de la DoD). En résumé :

| # | Décision |
|---|---|
| **D-133-1** | **Aucun proxy de confiance par défaut.** `TRUSTED_PROXIES` vide/absente ⇒ `trust proxy` non appelé ⇒ comportement identique à aujourd'hui. Le défaut de sûreté est l'IP **inutile**, jamais l'IP **falsifiable**. |
| **D-133-2** | La confiance se déclare en **IP / CIDR** (+ les 3 sous-réseaux nommés de `proxy-addr`). **Jamais `true`** (XFF devient une entrée non authentifiée), **jamais un nombre de sauts** (falsifiable dès qu'un chemin contourne le proxy — et en dev les ports sont publiés sur l'hôte, donc ce chemin existe). |
| **D-133-3** | Une valeur non reconnue **fait échouer le démarrage**, en nommant la valeur fautive. |
| **D-133-4** | **Dev docker : AUCUN proxy de confiance.** ⚠️ *Amendée en revue de sécurité* — elle disait d'abord `uniquelocal,loopback`. Faux : ce compose ne place aucun reverse-proxy devant les services (le navigateur tape le port publié), et l'adresse source d'un appel entrant est **toujours** RFC 1918 ⇒ `uniquelocal` faisait de **tout appelant** un proxy de confiance, donc XFF forgeable depuis l'hôte et le LAN. Valeur passée à la demande pour observer la chaîne. |
| **D-133-5** | **Prod** : le seul CIDR de l'ingress (G6 : les services n'ont aucun port public, leur unique pair est Traefik). ⚡ *Amendée* : ce n'est plus seulement écrit — en `NODE_ENV=production`, un **sous-réseau nommé est refusé au boot**. |
| **D-133-6** | Le **BFF de l'app cliente** doit ajouter le XFF du navigateur : c'est le premier saut, et un `fetch` serveur n'ajoute rien de lui-même. **Story frontend à créer** — dépôt absent de l'espace de travail, donc **non levée par cette story** : sur les appels passant par le BFF, l'IP restera celle de l'app. Sur les appels **directs** navigateur → service (topologie Option B, l'essentiel des appels de FE-021 dont `login`), la chaîne est complète dès ici. |
| **D-133-7** | `req.ip` reste la source unique — mais ⚡ *amendée en revue de sécurité* : **`req.ip` n'est pas garanti d'être une IP** dès que `trust proxy` est posé (`proxy-addr` rend un jeton **brut** de `X-Forwarded-For`). D'où `normaliserIpCliente` (valide, sinon retombe sur le socket) et un **`IpThrottlerGuard`** dont le traceur passe par elle. Sans quoi : texte hostile persisté dans un écran de sécurité, et surtout une clé de compteur arbitraire dans un stockage qui **ne supprime jamais rien** ⇒ croissance du tas sans borne (CWE-770). |

---

## Acceptance Criteria

- **AC-01** — Depuis un client réel derrière la chaîne de proxy retenue, l'IP enregistrée est **celle du
  client**, pas celle du dernier saut.
- **AC-02** — Une requête portant un `X-Forwarded-For` forgé et **provenant d'une IP non listée comme
  proxy de confiance** est ignorée : l'IP enregistrée reste l'IP du socket (test explicite, sinon le
  correctif ouvre une falsification).
- **AC-03** — Deux appareils réellement distincts produisent **deux IP distinctes** dans
  `GET /users/me/sessions` (aujourd'hui : une seule et même IP).
- **AC-04** — Les sessions ouvertes avant le changement gardent leur IP telle quelle (aucune réécriture).
- **AC-05** — La configuration de confiance est pilotée par l'environnement (rien codé en dur) et
  documentée avec le compose / le manifeste de déploiement.
- **AC-06** *(ajouté le 2026-08-03)* — Sur au moins un service relying party, **deux organisations
  distinctes ne partagent plus le compteur du `ThrottlerGuard`** : l'une saturant sa limite, l'autre
  passe toujours. Et le pendant de falsification, qui est le vrai risque du correctif : un
  `X-Forwarded-For` forgé depuis une IP **non** listée comme proxy de confiance ne déplace **pas** le
  compteur — sans ce test, on échange un compteur partagé contre un rate limiting contournable.

---

## Dependencies

- **Ne bloque pas** FE-021 : l'écran est livrable, il affiche l'IP telle que servie et ne promet rien
  d'autre (la note de bas de carte dit explicitement que l'IP est « celle vue par nos serveurs »).
- **Bloque** toute promesse de sécurité faite à l'utilisateur autour du lieu de connexion.
- **Bloque également** *(2026-08-03)* toute promesse d'isolation du rate limiting **entre organisations**
  sur les relying parties : tant que la chaîne de confiance n'est pas tranchée, le `ThrottlerGuard`
  compte tous les tenants dans un seul seau.

---

## Definition of Done

- Les **6** AC passent, dont **AC-02 vérifié par un test de falsification** (en-tête forgé depuis une IP
  non fiable) — sans lui, le correctif est une régression de sécurité.
- Décision de topologie **écrite** (note d'architecture ou section dédiée), pas seulement codée.
- lint 0 warning · build OK · unit + e2e verts, **sur les 8 dépôts**.

---

## Notes techniques (cadrage du 2026-08-06)

- **Où vit le code.** `src/common/utils/trusted-proxies.util.ts` porte le parseur ET la validation, puis
  `configuration.ts` l'appelle et `main.ts` pose `app.set('trust proxy', …)`.
  ⚠️ **Pas dans `configuration.ts` ni dans `main.ts`** : `collectCoverageFrom` les exclut tous les deux,
  la logique y serait **invisible aux seuils** — c'est l'angle mort qui a rendu STORY-173 entièrement
  inerte sans qu'aucun test ne bronche.
- **Aucune écriture en base.** La story ne crée ni ne migre de document (AC-04 = *ne rien réécrire*). La
  vérification docker porte donc sur le **comportement observable** : IP enregistrée à l'ouverture d'une
  session, et compartimentage du throttler — pas sur un `mongosh` de comptage.
- **Le compose ne vit dans aucun dépôt** (racine non versionnée, cf. STORY-173). Le bloc
  `TRUSTED_PROXIES` ajouté aux 8 services est donc **recopié in extenso** dans *Progress Tracking* — sans
  ça il sera perdu au prochain poste, comme l'a été le CORS du BFF.

---

## Progress Tracking

### Implémentation (2026-08-06) — branche `MNV-133` sur les 8 dépôts

Identique partout : `src/common/utils/trusted-proxies.util.ts` (parseur + validation +
`configurerProxysDeConfiance`), appelé par `configuration.ts` (`security.trustedProxies`) et par
`main.ts` (`app.set('trust proxy', …)`), `TRUSTED_PROXIES` déclarée dans `env.validation.ts` et
`.env.example`. `NestFactory.create` devient `NestFactory.create<NestExpressApplication>` — sans quoi
`.set()` n'existe pas au type.

`extractClientOrigin` **n'a pas changé** (auth-service) : seul son docblock, qui annonçait la question
comme ouverte, est mis à jour. Aucun `getTracker` maison sur le `ThrottlerGuard`.

### Portes DoD — les 8 dépôts

| Service | lint | build | unit (couverture) | e2e |
|---|---|---|---|---|
| auth-service | 0 | OK | 703 (97,09 / 90,18 / 97,72 / 97,13) | 187 |
| expert-comptable | 0 | OK | 208 (99,14 / 90,75 / 98,59 / 99,06) | 41 |
| kyc-service | 0 | OK | 262 (95,64 / 90,45 / 94,28 / 95,52) | 73 |
| platform-catalog-service | 0 | OK | 465 (99,82 / 95,34 / 100 / 99,90) | 150 |
| bilan-service | 0 | OK | 816 (98,49 / 92,57 / 98,53 / 98,43) | 190 |
| document-service | 0 | OK | 366 (99,40 / 92,21 / 99,19 / 99,35) | 40 |
| balance-service | 0 | OK | 2 640 (98,99 / 91,85 / 98,21 / 99,07) | 550 |
| admin-panel | 0 | OK | 357 (99,65 / 91,54 / 100 / 99,62) | 161 |

Ajouts de tests : 40 unitaires (`trusted-proxies.util.spec.ts`, dans **chacun** des 8), 3 e2e
`throttler-proxy.e2e-spec.ts` (dans chacun des 8) et 7 e2e `trusted-proxies.e2e-spec.ts` (auth-service,
l'IP des sessions).

⚠️ **Un test e2e a échoué une fois puis est repassé** : `balance-service/test/cahiers-depenses.e2e-spec.ts`,
sur l'exécution complète de la suite. Rejoué seul (59/59) **et** en suite complète (550/550) : vert les
deux fois. Instabilité de charge, pas une régression de cette story — la suite ajoutée est isolée (app,
contrôleur et stockage de throttler qui lui sont propres, aucun état partagé).

### Mutation-tests — 8 mutations, **7 rouges, 1 verte, et la verte est la leçon**

| # | Mutation | Verdict |
|---|---|---|
| M1 | retirer la garde `length > 0` de `configurerProxysDeConfiance` | 🔴 |
| M2 | accepter `true` comme sous-réseau nommé | 🔴 |
| M3 | supprimer la borne haute du préfixe CIDR (`/33` passerait) | 🔴 |
| M4 | supprimer le contrôle de forme du préfixe (`/huit`, `/08`) | 🔴 |
| M5 | faire nommer par le message d'erreur **toutes** les entrées au lieu des fautives | 🔴 |
| M6 | `app.set('trust proxy', true)` — la falsification devient possible | 🔴 (e2e IP des sessions) |
| M7 | idem, côté throttler | 🔴 (e2e throttler) |
| **M8** | **supprimer l'appel `configurerProxysDeConfiance(app, …)` de `main.ts`** | **🟢 SURVÉCUE** |

⚡ **M8 était prévisible et a été prédite avant d'être mesurée.** `main.ts` est exclu de
`collectCoverageFrom`, et les e2e appellent l'utilitaire **eux-mêmes** pour monter leur app : aucun test
automatisé ne peut voir que `main.ts` a cessé de le faire. C'est très exactement le motif « les specs
d'une fonction pure ne prouvent rien du câblage » payé en STORY-172, et le motif « livrable mergé et
totalement inerte » payé en STORY-173. **La vérification docker ci-dessous n'est donc pas une formalité :
c'est le seul contrôle qui ferme M8**, et c'est pour ça qu'elle est faite en avant/après sur un même
conteneur, à code identique, en ne changeant que la variable d'environnement.

### Vérification docker — stack neuve (`down -v`), avant/après sur conteneur réel

Toutes les mesures ci-dessous sont **réelles** : `docker compose`, `curl` depuis l'hôte,
`mongosh` dans le conteneur. La socket vue par les services depuis l'hôte est `::ffff:192.168.65.1`
(passerelle Docker Desktop, dans `192.168/16` donc dans `uniquelocal`).

**1. AC-01 / AC-03 / AC-04 — l'IP des sessions (`auth_service.sessions`)**

| Session | `TRUSTED_PROXIES` | `X-Forwarded-For` envoyé | `ip` écrite en base |
|---|---|---|---|
| `SondeSTORY133` | *(vide)* | `203.0.113.7` | `::ffff:192.168.65.1` ← **le bug de la story** |
| `Sonde-203.0.113.7` | `uniquelocal,loopback` | `203.0.113.7` | `203.0.113.7` |
| `Sonde-198.51.100.4` | `uniquelocal,loopback` | `198.51.100.4` | `198.51.100.4` |
| `Sonde-sans-xff` | `uniquelocal,loopback` | *(aucun)* | `::ffff:192.168.65.1` |
| `Sonde-AC02` | `10.255.255.0/24` | `203.0.113.99` | `::ffff:192.168.65.1` ← **AC-02** |

- **AC-03 tenu** : deux clients distincts ⇒ deux IP distinctes. Le constat du 2026-07-23 était l'inverse
  (deux appareils réels, une seule IP).
- **AC-02 tenu** : la passerelle docker n'appartient pas à `10.255.255.0/24`, l'en-tête forgé est ignoré.
- **AC-04 tenu** : la session `SondeSTORY133`, ouverte **avant** le changement, garde son IP telle quelle
  après le redémarrage — aucune réécriture.
- **M8 fermée** : même image, même conteneur, même code — seule la variable change, et le résultat
  change. Le `main.ts` appelle donc bien la configuration.

**2. AC-06 — compteur du `ThrottlerGuard`, sur `expert-comptable` (relying party, limite 100/min)**

| `TRUSTED_PROXIES` | client A #101 | client B #1 | client C #1 |
|---|---|---|---|
| *(vide)* | 429 | **429** ← un seul seau pour tous | 429 |
| `uniquelocal,loopback` | 429 | **200** ← seau propre | 200 |

Et le **pendant de falsification**, celui sans lequel la story serait une régression : avec
`TRUSTED_PROXIES=10.255.255.0/24` (la passerelle docker n'y est pas), 101 appels annonçant une IP
**différente à chaque fois** ⇒ le 101ᵉ est **429**. Un en-tête forgé n'offre pas de seau neuf.

Même contraste vérifié sur l'IdP (`POST /auth/login`, limite 5/min) : sans confiance, le 6ᵉ appel de A
met B et C à 429 immédiatement ; avec confiance, A sature à 6 et B passe encore.

**3. D-133-3 — une valeur invalide tue le démarrage.** `TRUSTED_PROXIES=true` :

```
ERROR [ExceptionHandler] Error: TRUSTED_PROXIES invalide : true. Attendu : une liste séparée par des
virgules d'adresses IP, de CIDR (ex. 10.0.0.0/8) ou de sous-réseaux nommés (loopback, linklocal,
uniquelocal). Ni `true` ni un nombre de sauts ne sont acceptés : ils rendraient l'IP cliente — et donc
le compteur du throttler — pilotables par un simple en-tête X-Forwarded-For forgé.
    at parseTrustedProxies (/app/src/common/utils/trusted-proxies.util.ts:85:11)
    at InstanceWrapper.exports.default (/app/src/config/configuration.ts:177:42)
```

`/api/v1/health` reste injoignable (`http=000`) et le conteneur ne devient jamais `healthy`.
⚠️ **Nuance de dev à connaître** : sous `nest start --watch`, le *watcher* survit à l'échec, donc le
conteneur reste `running` — c'est l'**application** qui n'a pas démarré. Sur l'image de production
(`target: runtime`, `node dist/main`), le process sort.

**4. Non-régression.** Les **8** services démarrent et passent `healthy` avec
`TRUSTED_PROXIES=uniquelocal,loopback`.

### Revue de code — 4 constats, aucun bloquant, **tous corrigés**

1. ⚡ **`/0` était ACCEPTÉ par le parseur, et le test le certifiait valide.** Or `0.0.0.0/0` est l'écriture
   CIDR de « je fais confiance à tout le monde », c'est-à-dire le `trust proxy: true` refusé deux lignes
   plus haut : **refuser le mot et accepter son équivalent en notation réseau** était une passoire ouverte
   par distraction. Et `proxy-addr` rejette `range <= 0`, donc le boot mourait quand même — sur un
   `TypeError: invalid range on address` qui ne nomme **ni la variable ni la raison**, à l'opposé de
   D-133-3.
2. ⚡ **Le test « nomme TOUTES les valeurs fautives » restait VERT sous la mutation qu'il prétend
   attraper** : `toContain('true')` passait grâce au **texte statique** du message (« Ni `true` ni un
   nombre de sauts… »), si bien que n'énumérer que la **dernière** fautive laissait les 4 assertions
   vertes. L'assertion porte désormais sur la première phrase seule.
3. **Le câblage `TRUSTED_PROXIES` → `security.trustedProxies` n'était couvert par aucun test**, alors que
   STORY-109 avait posé ce garde-fou pour CORS dans le même fichier. `configuration.ts` étant exclu de la
   couverture, une faute de frappe sur le nom de la variable rendait la story **totalement inerte, tous
   tests verts** — c'est la moitié *testable* de l'angle mort M8. `configuration.spec.ts` créé dans les 3
   services qui n'en avaient pas.
4. La note d'architecture décrivait un placement (`après helmet()`) que les 8 `main.ts` ne suivent pas.

Mutations de contrôle : **3 / 3 rouges** (réaccepter `/0` ; ne nommer que la dernière fautive ; lire
`TRUSTED_PROXY` au lieu de `TRUSTED_PROXIES`).

### Revue de sécurité — 2 vulnérabilités, **la première bloquante**, toutes deux corrigées

#### 🔴 S-1 — Le défaut de dev `uniquelocal,loopback` rendait `X-Forwarded-For` forgeable depuis l'hôte et le LAN

CWE-348 · A05:2021 · confiance 95. **La story se tirait une balle dans le pied par sa propre
configuration.** `uniquelocal` couvre tout le RFC 1918 — or l'adresse source qu'un conteneur voit pour un
appel arrivant par un port publié est **toujours** RFC 1918 (passerelle du bridge, ou IP du poste en
DNAT). Le défaut livré faisait donc de **tout appelant** un proxy de confiance :

- le `@Throttle({ limit: 5 })` du login devenait *une limite par valeur d'en-tête choisie par
  l'attaquant*, donc **aucune limite** — exactement le « on échange un compteur partagé contre un rate
  limiting contournable » que l'énoncé de la story met en garde, réintroduit par la porte de la config ;
- l'IP de session devenait choisie par le client : un attaquant muni d'identifiants volés annonce l'IP
  habituelle de la victime et sa session est **indiscernable** dans « Sessions ouvertes ».

⚡ **Rien ne justifiait ce défaut** : le compose ne place aucun reverse-proxy devant les services. Défaut
passé à **vide**, valeur passée à la demande pour observer la chaîne. Et pour que D-133-5 cesse d'être
décorative, `parseTrustedProxies` **refuse désormais les sous-réseaux nommés quand `NODE_ENV=production`**.

#### 🟠 S-2 — `req.ip` n'est pas garanti d'être une IP ⇒ clé de throttler arbitraire dans un stockage qui ne purge jamais

CWE-770 / CWE-400 · A04:2021 · confiance 90. Deux faits vérifiés dans les dépendances réelles :

```
socket=172.17.0.1  xff="AAAA<script>…"  => req.ip = "AAAA<script>…"
socket=172.17.0.1  xff=("X" × 300)      => req.ip = ("X" × 300)
```

et `@nestjs/throttler`/`throttler.service.js` **ne contient aucun `delete`** : son minuteur décrémente le
compteur, il ne retire pas la clé. Chaque valeur d'en-tête inédite laisse donc une entrée **définitive**
dans le tas — croissance non bornée jusqu'à l'OOM, sans authentification, sur n'importe quel endpoint
`@Public()`.

Corrigé par `normaliserIpCliente` (valide via `isIP`, sinon retombe sur le socket) + un **`IpThrottlerGuard`**
monté à la place du `ThrottlerGuard` nu dans les 8 `app.module.ts`. La garde tient **indépendamment de la
chaîne de confiance déclarée**. Conséquence assumée : `extractClientOrigin` **rejette** désormais ce qui
n'est pas une IP au lieu de le tronquer à 64 caractères — `slice(0, 64)` bornait la **taille**, pas le
**contenu**, et tronquer une chaîne hostile, c'est encore la persister et l'afficher. Le test de
STORY-126 a été réécrit en conséquence.

Mutations de contrôle : **S-M1 rouge** (retirer la garde de production), **S-M2 rouge** (ne plus valider
`req.ip`), **S-M3 🟢 SURVÉCUE** — rebrancher le `ThrottlerGuard` nu dans `app.module.ts` laisse **tout
vert**, `*.module.ts` étant lui aussi exclu de la couverture et les e2e montant le guard eux-mêmes. Même
famille que M8, et fermée de la même façon : **en docker** (voir ci-dessous).

### Vérification docker **rejouée** après les correctifs de sécurité

Le compose est un artefact déjà vérifié et il a changé : la phase ④ est reprise sur l'état final.

| Contrôle | Configuration | Résultat mesuré |
|---|---|---|
| **A** — le défaut LIVRÉ est sûr | compose tel quel (vide) | XFF `203.0.113.200` ignoré, `ip = ::ffff:172.19.0.1` ; 5 XFF différents ⇒ **429 dès le 5ᵉ** (aucun seau neuf) |
| **B** — la fonctionnalité marche toujours | `uniquelocal,loopback` | XFF `203.0.113.42` ⇒ `ip = 203.0.113.42` |
| **D** — **ferme S-M3** | `uniquelocal,loopback` | 6 appels avec une **chaîne poubelle différente** (`poubelle-1..6`) ⇒ **429 au 6ᵉ** : le compteur n'a pas bougé, donc `IpThrottlerGuard` est bien **le guard réellement monté**. Et `X-Forwarded-For: <script>alert(1)</script>` sur un login réussi ⇒ `ip = ::ffff:172.19.0.1`, pas le script |
| **C** — garde de production | `NODE_ENV=production` + `uniquelocal,loopback` | `✅ REFUSÉ : TRUSTED_PROXIES trop large pour la production : uniquelocal, loopback…` |
| **C bis** | `NODE_ENV=production` + `10.244.0.0/16` | accepté ⇒ `["10.244.0.0/16"]` |
| **C ter** | `NODE_ENV=development` + `uniquelocal,loopback` | accepté ⇒ la valeur de dev reste utilisable |

### ⚠️ Le compose ne vit dans aucun dépôt — bloc recopié ici

La racine PROSPERA n'est versionnée nulle part (leçon STORY-173 : le correctif de compose y avait été
perdu, rendant la story inerte). Bloc **identique ajouté aux 8 services** de `docker-compose.yml`, juste
après leur `CORS_ALLOWED_ORIGINS` :

```yaml
      # STORY-133 — chaîne de proxys de confiance (`trust proxy`).
      # ⚠️ **Défaut VIDE, et c'est délibéré** (corrigé en revue de sécurité) :
      # ce compose ne place AUCUN reverse-proxy devant les services — le
      # navigateur et le BFF tapent directement le port publié. Déclarer un
      # proxy de confiance ici n'apporterait donc rien, et coûterait cher : les
      # ports sont publiés sur l'hôte, et l'adresse source d'un appel entrant
      # est TOUJOURS une adresse RFC 1918 (passerelle du bridge, ou IP du poste
      # en DNAT). Un défaut `uniquelocal` rendrait donc `X-Forwarded-For`
      # forgeable depuis l'hôte et le LAN ⇒ IP de session choisie par le client
      # ET rate limiting contournable — exactement la régression que D-133-2
      # refuse par ailleurs, réintroduite par la porte de la config.
      # Pour observer la chaîne en dev, passer la valeur à la demande :
      #   TRUSTED_PROXIES=uniquelocal,loopback docker compose up -d <service>
      # Prod : le SEUL CIDR de l'ingress (D-133-5) — un sous-réseau nommé y est
      # désormais refusé au boot.
      # ⚠️ `-` et NON `:-` : sur `${VAR:-défaut}` une variable VIDE réactive le
      # défaut (piège payé en STORY-173).
      TRUSTED_PROXIES: ${TRUSTED_PROXIES-}
```

⚡ Le choix `${VAR-défaut}` (sans `:`) est **délibéré et divergent** du reste du fichier : avec la forme
`:-` employée par `CORS_ALLOWED_ORIGINS`, vider la variable **réactive** le défaut, et le défaut de sûreté
D-133-1 deviendrait inatteignable depuis l'environnement. Le défaut étant désormais vide, la forme sert
surtout à ce que passer une valeur à la demande reste possible sans éditer le fichier.

### Ce qui reste ouvert

- **D-133-6 — le BFF frontend n'ajoute pas encore le `X-Forwarded-For` du navigateur.** Story frontend à
  créer ; le dépôt n'est pas dans l'espace de travail. Conséquence à ne pas maquiller : **sur les appels
  passant par le BFF, l'IP reste celle de l'app.** La chaîne est complète sur les appels **directs**
  navigateur → service (topologie Option B), ce qui couvre `login` et l'essentiel de FE-021.
- **AC-01/AC-03 « depuis un client réel »** : prouvés au protocole (deux IP annoncées ⇒ deux IP en base),
  pas avec deux appareils physiques — ce qui exige justement D-133-6.
- **Géolocalisation** : hors périmètre, inchangé.
- **Valeur de prod** : `TRUSTED_PROXIES` doit être renseignée au déploiement avec le seul CIDR de
  l'ingress (D-133-5). Tant qu'elle ne l'est pas, le comportement est celui d'avant — sans risque.
