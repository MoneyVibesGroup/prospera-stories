# STORY-133 : IP des sessions — trancher le proxy de confiance, sinon l'écran « Sessions ouvertes » affiche l'IP de l'app

**Epic :** EPIC-002 — Authentification & sécurité du compte (auth-service)
**Réf. :** STORY-126 § Technical Notes (« IP derrière proxy — à trancher au déploiement ») · FE-021
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** high
**Statut :** in_progress
**Sprint :** 20
**Créée le :** 2026-07-23
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
| **D-133-4** | **Dev docker** : `uniquelocal,loopback` — le seul saut devant un service y est le bridge docker ou un conteneur voisin. Valeur de dev **assumée comme laxiste**, à ne pas recopier en prod. |
| **D-133-5** | **Prod** : le seul CIDR de l'ingress (G6 : les services n'ont aucun port public, leur unique pair est Traefik). Pas `uniquelocal`, qui ferait confiance à tout le réseau du cluster. |
| **D-133-6** | Le **BFF de l'app cliente** doit ajouter le XFF du navigateur : c'est le premier saut, et un `fetch` serveur n'ajoute rien de lui-même. **Story frontend à créer** — dépôt absent de l'espace de travail, donc **non levée par cette story** : sur les appels passant par le BFF, l'IP restera celle de l'app. Sur les appels **directs** navigateur → service (topologie Option B, l'essentiel des appels de FE-021 dont `login`), la chaîne est complète dès ici. |
| **D-133-7** | `extractClientOrigin` **n'est pas modifié** (seul son docblock l'est) et le `ThrottlerGuard` **ne reçoit pas de `getTracker` maison** : tous deux lisent `req.ip`, qui devient juste. C'est exactement la propriété pour laquelle STORY-126 avait isolé l'utilitaire. |

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

*(rempli au fil du développement)*
