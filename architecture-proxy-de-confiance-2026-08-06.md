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

### D-133-4 — Dev docker : **aucun proxy de confiance** *(amendée en revue de sécurité)*

> ⚠️ **Cette décision disait initialement `uniquelocal,loopback` dans le compose. C'était une faute, et
> la revue de sécurité l'a bloquée avant le merge.** Elle est conservée ici en toutes lettres parce que le
> raisonnement qui l'avait produite est séduisant et se reproduira.

Le raisonnement d'origine : « le seul saut devant un service, dans le compose, est la passerelle du bridge
docker ou un conteneur voisin — deux adresses RFC 1918, donc `uniquelocal` ». Il est exact sur les faits et
faux sur la conclusion, pour deux raisons :

1. **il n'y a aucun reverse-proxy devant les services dans ce compose.** Le navigateur et le BFF tapent
   directement le port publié. Déclarer un proxy de confiance n'apporte donc **rien** ;
2. **l'adresse source d'un appel entrant est *toujours* une adresse RFC 1918** — la passerelle du bridge
   (`192.168.65.1` sur Docker Desktop, `172.17.0.1` sur Linux) ou, en DNAT, l'IP du poste appelant sur le
   LAN. Autrement dit `uniquelocal` fait de **tout appelant** un proxy de confiance. Le coût est exactement
   ce que D-133-2 refuse par ailleurs : `X-Forwarded-For` forgeable depuis l'hôte et le LAN, donc IP de
   session choisie par le client **et rate limiting entièrement contournable** — un seau neuf par valeur
   d'en-tête.

Un défaut « laxiste mais pratique » a donc réintroduit, par la porte de la configuration, la régression que
le parseur ferme à grand-peine par la porte du code. **Le compose ne déclare plus aucun proxy de confiance.**
Pour observer la chaîne en dev, on passe la valeur à la demande :

```bash
TRUSTED_PROXIES=uniquelocal,loopback docker compose up -d <service>
```

### D-133-5 — Production : le **seul** CIDR de l'ingress, **et c'est vérifié au boot**

`architecture-gateway-2026-07-07.md` (G6) pose que les services n'ont **aucun port public** : leur unique
pair réseau est Traefik. `TRUSTED_PROXIES` vaut donc le CIDR du réseau de l'ingress, et rien d'autre —
pas `uniquelocal`, qui ferait confiance à **tout** le réseau privé du cluster, y compris à un conteneur
compromis d'un autre workload.

⚡ **Amendement de la revue de sécurité : cette règle ne se contente plus d'être écrite.** Quand
`NODE_ENV=production`, `parseTrustedProxies` **refuse les sous-réseaux nommés** et fait échouer le
démarrage en les nommant. Un nom comme `uniquelocal` est la même sur-confiance que le `true` refusé en
D-133-2, simplement écrite sans le mot ; documenter la différence ne suffisait pas — c'est le mode d'échec
« livrable inerte » de STORY-173. Un CIDR explicite (`10.244.0.0/16`) passe.

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

### D-133-7 — `req.ip` reste la source unique… mais il faut **valider que c'en est une**

STORY-126 avait posé l'utilitaire pour que la décision se prenne **ailleurs, une seule fois, au
démarrage**. Elle se prend ici, et `extractClientOrigin` n'a effectivement pas eu à changer de source :
il lit toujours `req.ip`.

⚠️ **Mais la revue de sécurité a montré que `req.ip` n'est pas garanti d'être une adresse IP** dès que
`trust proxy` est déclaré. Express délègue à `proxy-addr`, qui ne valide le format que des maillons qu'il
teste pour la **confiance** : la valeur finalement retenue est un **jeton brut** de `X-Forwarded-For`,
découpé sur la virgule et rien de plus. Mesuré :

```
socket=172.17.0.1  xff="AAAA<script>…"   => req.ip = "AAAA<script>…"
socket=172.17.0.1  xff=("X" × 300)       => req.ip = ("X" × 300)
```

Deux dégâts, et le second est le plus grave :

1. l'IP **persistée en session** deviendrait un texte choisi par l'appelant, restitué tel quel dans un
   écran de sécurité ;
2. le **compteur du throttler** est keyé sur cette valeur, et le stockage in-memory de `@nestjs/throttler`
   **ne supprime jamais une entrée** (son minuteur décrémente le compteur, il ne retire pas la clé) : une
   valeur inédite à chaque requête fait croître le tas **sans borne** (CWE-770), sans authentification,
   sur n'importe quel endpoint `@Public()`.

D'où deux amendements :

- `normaliserIpCliente` (dans le même utilitaire) ne rend `req.ip` que si `isIP()` le reconnaît, sinon
  retombe sur l'IP du **socket**, la seule que la pile réseau garantisse ;
- un **`IpThrottlerGuard`** remplace le `ThrottlerGuard` nu dans les 8 `app.module.ts` : son `getTracker`
  passe par la même normalisation, et range tout ce qui n'est reconnaissable nulle part dans un
  compartiment unique (`inconnu`) — fail-closed délibéré, mieux vaut partager un seau que d'en distribuer
  un par chaîne inventée.

La garde est **indépendante de la chaîne de confiance déclarée** : elle tient même si une plage est trop
large, ou si un ingress transmet `X-Forwarded-For` au lieu de l'enrichir.

---

## Ce que ça donne, service par service

Identique partout (`main.ts`), juste après la lecture d'`appConfig` et **avant** `helmet()` — c'est un
réglage de la pile Express, pas un middleware : il doit être posé avant qu'une requête n'atteigne quoi que
ce soit qui lise `req.ip`.

```ts
const securityConfig = app
  .get(ConfigService)
  .getOrThrow<SecurityConfig>('security');
configurerProxysDeConfiance(app, securityConfig.trustedProxies);
```

La garde « liste vide ⇒ on ne pose pas le réglage » vit **dans** `configurerProxysDeConfiance`, pas ici :
c'est ce qui la rend testable (`main.ts` est exclu de la couverture).

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
