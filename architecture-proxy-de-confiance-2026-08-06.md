# Architecture : la chaîne de proxy de confiance (`trust proxy`)

**Date :** 2026-08-06
**Architecte :** vivian
**Version :** 1.0
**Type :** Infrastructure (edge / topologie réseau)
**Statut :** Tranché (remplace la question ouverte de STORY-126 « IP derrière proxy — à trancher au déploiement »)
**Écosystème :** PROSPERA — les **8** services
**Story porteuse :** STORY-133

---

## Le problème, en une phrase

Un service Node ne voit que **l'IP du dernier saut** qui l'a appelé. Dès qu'un proxy s'intercale — BFF de
l'app cliente, ingress, passerelle docker — `req.ip` cesse d'être l'IP de l'utilisateur, et **deux
consommateurs différents** en dépendent :

| Consommateur | Ce qu'il croit lire | Ce qu'il lisait réellement | Conséquence |
|---|---|---|---|
| `extractClientOrigin` (auth-service, STORY-126) | l'IP du navigateur, affichée dans « Sessions ouvertes » | l'IP du BFF / de la passerelle docker | **une colonne mensongère dans un écran de sécurité** : deux appareils réels affichaient `::ffff:172.22.0.1` tous les deux (mesuré le 2026-07-23) |
| `ThrottlerGuard` (les 8 services — son `getTracker` retourne `req.ip`) | une IP cliente, donc un compteur par client | l'IP du reverse-proxy | **un seul seau de jetons pour tous les tenants** : un tenant bruyant épuise la limite des autres, et un attaquant distribué n'est pas plus limité qu'un client unique |

C'est **une seule et même décision de topologie**, servie à deux endroits. La trancher deux fois, c'est se
garantir deux réponses divergentes — d'où ce document unique.

---

## La chaîne de sauts, telle qu'elle est

```
[0] Navigateur (le client réel — la seule IP qui ait un sens pour l'utilisateur)
     │
[1] BFF / Route Handler Next de l'app cliente         ← n'existe que sur les appels passant par l'app
     │   (fetch côté serveur : n'ajoute RIEN à X-Forwarded-For de lui-même)
     │
[2] Ingress / Traefik (prod, cf. architecture-gateway-2026-07-07.md, G5/G6)
     │   ou publication de port docker (dev)
     │
[3] Service PROSPERA  ── req.ip = IP du saut [2], jamais celle du saut [0]
```

---

## Décisions

### D-133-1 — Aucun proxy n'est de confiance par défaut

`TRUSTED_PROXIES` absente ou vide ⇒ `app.set('trust proxy', …)` **n'est pas appelé** ⇒ `req.ip` reste
l'IP du socket, exactement comme avant cette story. Le défaut de sûreté est **l'IP inutile, jamais l'IP
falsifiable** — c'est le choix qu'avait déjà fait STORY-126 en refusant de lire `X-Forwarded-For`, et il
est conservé tel quel pour tout environnement qui ne déclare rien.

### D-133-2 — La confiance se déclare par **IP/CIDR**, jamais par `true`, jamais par nombre de sauts

- `trust proxy: true` fait de `X-Forwarded-For` une **donnée d'entrée non authentifiée** : n'importe quel
  client choisit alors l'IP inscrite en base **et** le compartiment du throttler. Ce serait un
  contournement complet du rate limiting — une régression **pire** que le compteur partagé qu'on corrige.
- `trust proxy: <n>` (nombre de sauts) est falsifiable dès qu'un chemin **contourne** le proxy : sur une
  connexion directe, Express prend alors la n-ième valeur d'un `X-Forwarded-For` entièrement fourni par
  le client. En dev les ports sont publiés sur l'hôte : ce chemin existe.
- Seules formes acceptées : **IPv4, IPv6, CIDR**, et les trois sous-réseaux nommés reconnus par
  `proxy-addr` (`loopback`, `linklocal`, `uniquelocal`).

### D-133-3 — Une valeur non reconnue fait **échouer le démarrage**

Le parseur refuse tout ce qui n'est pas de la forme D-133-2 — `true`, `false`, `*`, `1`, un nom d'hôte —
et l'erreur **nomme la valeur fautive**. Convention du projet : la configuration se valide au boot, et une
chaîne de confiance mal orthographiée doit s'entendre au démarrage, pas se découvrir six mois plus tard
dans une IP falsifiée.

### D-133-4 — Dev docker : `uniquelocal,loopback`

Dans le compose, le seul saut devant un service est soit la passerelle du bridge docker, soit un autre
conteneur : deux adresses RFC 1918, couvertes par `uniquelocal` (10/8, 172.16/12, 192.168/16, fc00::/7).
`loopback` couvre l'appel depuis l'hôte.

> ⚠️ **Cette valeur est un choix de dev, pas un défaut à recopier en prod.** Le compose publie les ports
> sur l'hôte : quiconque atteint la machine depuis un réseau privé peut donc, **en dev**, forger son IP.
> C'est accepté pour pouvoir observer le comportement ; c'est inacceptable en production, où seul D-133-5
> s'applique.

### D-133-5 — Production : le **seul** CIDR de l'ingress, injecté au déploiement

`architecture-gateway-2026-07-07.md` (G6) pose que les services n'ont **aucun port public** : leur unique
pair réseau est Traefik. `TRUSTED_PROXIES` vaut donc le CIDR du réseau de l'ingress, et rien d'autre —
pas `uniquelocal`, qui ferait confiance à **tout** le réseau privé du cluster, y compris à un conteneur
compromis d'un autre workload.

### D-133-6 — Le BFF de l'app cliente doit transmettre l'IP d'origine *(dépendance frontend, non levée ici)*

Le saut [1] est le **premier** : un `fetch` côté serveur Next n'ajoute rien à `X-Forwarded-For`, donc sans
lui l'ingress ne voit jamais que l'app. Les décisions ci-dessus rendent la chaîne **exploitable** dès
qu'elle est alimentée ; **elles ne l'alimentent pas à sa source**.

Conséquence assumée et à ne pas maquiller : pour les appels **passant par le BFF**, l'IP restera celle de
l'app tant que la story frontend correspondante n'est pas livrée. Pour les appels **directs** du
navigateur au service (topologie Option B, STORY-109 — l'essentiel des appels de l'écran « Sessions
ouvertes » y compris le `login`), la chaîne est complète dès cette story.

Le dépôt frontend n'étant pas dans l'espace de travail, la story correspondante est **à créer** ; elle
demandera au Route Handler d'ajouter le `X-Forwarded-For` du navigateur — de la même façon que FE-021 lui
a fait reporter le `User-Agent`.

### D-133-7 — `extractClientOrigin` n'est **pas** modifié

STORY-126 avait posé l'utilitaire pour que la décision se prenne **ailleurs, une seule fois, au
démarrage**. Elle se prend ici : `req.ip` devient la bonne valeur et le code de lecture ne change pas
(seul son docblock est mis à jour, la question qu'il annonçait ouverte étant refermée). Même chose pour le
`ThrottlerGuard` : **aucun `getTracker` maison** — son défaut lit `req.ip`, qui devient juste.

---

## Ce que ça donne, service par service

Identique partout (`main.ts`), après `helmet()` et avant l'écoute :

```ts
const trustedProxies = config.getOrThrow<SecurityConfig>('security').trustedProxies;
if (trustedProxies.length > 0) {
  app.set('trust proxy', trustedProxies);
}
```

- variable d'environnement : `TRUSTED_PROXIES` (liste séparée par des virgules) ;
- parseur + validation : `src/common/utils/trusted-proxies.util.ts` — **volontairement hors de
  `configuration.ts` et de `main.ts`**, que `collectCoverageFrom` exclut : la logique y serait invisible
  aux seuils de couverture (angle mort relevé en STORY-173) ;
- services concernés : `auth-service`, `expert-comptable`, `kyc-service`, `platform-catalog-service`,
  `bilan-service`, `document-service`, `balance-service`, `admin-panel` — les 8 portent un
  `ThrottlerGuard` global, donc les 8 sont concernés, pas seulement l'IdP.

---

## Non traité ici

- **Géolocalisation** (ville/pays à partir de l'IP) — question ouverte de STORY-126, à n'instruire
  qu'une fois l'IP juste.
- **Réécriture des sessions déjà enregistrées** : aucune. Les sessions ouvertes avant le changement
  gardent l'IP telle qu'elle a été vue (AC-04).
- **Un tracker de throttler par organisation** : ce document rend le compteur **par IP cliente**, ce qui
  était l'intention d'origine. Compter par `orgId` serait une autre décision, et elle ne se substitue pas
  à celle-ci (les routes publiques — `login`, `register` — n'ont pas d'organisation).
