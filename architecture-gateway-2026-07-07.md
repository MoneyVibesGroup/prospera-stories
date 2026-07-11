# Architecture Système : Passerelle d'entrée (API Gateway)

**Date :** 2026-07-07
**Architecte :** vivian
**Version :** 1.0
**Type de projet :** Infrastructure (edge / passerelle)
**Statut :** Draft
**Écosystème :** PROSPERA

---

## Vue d'ensemble du document

Ce document définit la **passerelle d'entrée** (API gateway) de l'écosystème PROSPERA : le point d'entrée réseau **unique** par lequel transite **toute** requête externe, avant d'atteindre un service. Il **tranche une décision restée implicite** dans les docs de service — **où le JWT est validé** — et cadre le routage par préfixe et la **résolution multi-version** (`orgId → version`) nécessaire au Bilan versionné (P7/D10).

Point essentiel : **la passerelle n'est pas un service à coder de zéro.** C'est un **produit existant** (Traefik retenu, cf. **G5**) **+ un seul composant maison** : le *résolveur d'entitlements* (~100 lignes), et **seulement le jour où une 2ᵉ version de module existe réellement**.

**Documents liés :**
- **Architecture programme (parent) : `docs/architecture-prospera-ecosystem-2026-07-04.md`** — topologie, principe relying-party (P4), décisions **P9/P10**. Ce document s'y subordonne.
- IdP émetteur des jetons : `docs/architecture-auth-service-2026-07-04.md` (JWKS, rotation `kid`)
- Source du read-model d'entitlement pour le routage : `docs/architecture-catalog-service-2026-07-07.md` (topic `entitlement.changed`)
- Consommateur multi-version : `docs/architecture-bilan-service-2026-07-07.md`
- **Détail déploiement (K8s/Helm/ArgoCD/GitOps) → doc ops/déploiement à rédiger** (hors périmètre ici)

---

## La passerelle expliquée simplement

Imagine un immeuble de bureaux : `auth-service` au 1er, `expert-comptable` au 2e, `kyc-service` au 3e, `bilan-service` au 4e. **Sans passerelle**, chaque visiteur devrait connaître l'adresse exacte de chaque étage, et chaque service aurait son propre vigile exposé sur la rue — ingérable et dangereux.

La **passerelle = la réception unique au rez-de-chaussée**. Tout le monde entre par la **même porte** (`api.prospera.com`) et la réception fait trois choses :

1. **Elle contrôle** — « votre badge ? » (le JWT). Badge faux/expiré → **refoulé à l'entrée**, aucun étage n'est dérangé.
2. **Elle oriente** — « le Bilan ? 4e étage. » C'est une **route** : une règle *« si l'URL commence par `/bilan` → envoyer vers `bilan-service` »*. **Une route = une ligne de configuration.** « Ajouter une route » = ajouter une ligne à ce registre, rien de plus.
3. **Elle protège** — limite le débit (rate limiting) et **les étages n'ont aucune porte sur la rue** : la seule entrée physique du réseau est la réception (**G6**).

Point qui démystifie tout : **la passerelle ne comprend rien au métier.** Elle lit des URLs, vérifie des signatures, transmet. C'est un **aiguilleur, pas un cerveau** — toute l'intelligence métier reste dans les services.

---

## Périmètre

### Dans le périmètre de la passerelle

- **Terminaison réseau** : point d'entrée public unique ; TLS ; les services n'ont **aucun port public** (**G6**).
- **Validation JWT « fail-fast » à l'edge** (signature RS256/JWKS, `iss`/`aud`/`exp`) → rejette tôt les jetons invalides (**G2**).
- **Rate limiting** global et par route (natif produit).
- **Routage par préfixe d'URL** vers l'upstream (**G3**).
- **Résolution multi-version** `orgId → version` via read-model d'entitlement (**G4**, activé seulement à l'arrivée d'une 2ᵉ version).

### Hors périmètre

- **Autorisation fine** (rôles, `emailVerified`, gate d'accès métier) → **reste dans chaque service** (relying party souverain, **G2**). La passerelle ne fait qu'une validation *grossière*.
- **Émission/rotation des jetons** → `auth-service`.
- **Logique métier, entitlements (source de vérité)** → services / `catalog-service`.
- **Déploiement (K8s/Helm/ArgoCD, `platform-config` GitOps, images semver)** → doc ops dédié.

---

## Le pipeline (ce que traverse chaque requête)

```
Requête externe
   │
   ▼
[1] Terminaison réseau (TLS) ── seule entrée publique ; services sans port public
   │
   ▼
[2] Validation JWT fail-fast ── signature RS256 via JWKS (kid) + iss/aud/exp
   │        └─ invalide ─────────────► 401 (le service n'est jamais appelé)
   │        └─ route @Public ────────► saute [2] (ex. /auth/login, JWKS, webhooks)
   ▼
[3] Rate limiting ── global + par route (ex. login plus strict)
   │        └─ dépassé ──────────────► 429
   ▼
[4] Résolution de version (résolveur d'entitlements) ── PASSE-PLAT tant qu'1 seule version
   │        lit  Redis  entitlements:{org}:{module}  → réécrit l'upstream (bilan-v2 vs bilan-v1)
   ▼
[5] Routage par préfixe ── /bilan → bilan-service(:version) ; transmet le JWT tel quel
   │
   ▼
Service (relying party) ── RE-valide le JWT + autorisation fine (rôles, emailVerified, gate)
```

Étapes **1, 3, 5** = **configuration pure** du produit. Étape **2** = **plugin JWT/JWKS natif** (Traefik/Kong). Étape **4** = **le seul composant maison**, et **différé** (voir G4).

---

## Décision structurante : où le JWT est-il validé ?

> Cette décision était **implicite** dans les docs de service (« chaque relying party valide via JWKS »). La passerelle l'explicite **sans la changer**.

**Retenu (G2) — validation à DEUX niveaux, défense en profondeur (zéro-trust) :**

| Niveau | Qui | Quoi | But |
|---|---|---|---|
| **Edge (passerelle)** | Traefik + plugin JWKS | Signature RS256 (`kid`), `iss`/`aud`/`exp` — validation **grossière** | **Fail-fast** : refouler 99 % des jetons invalides avant tout service ; alléger les services |
| **Service (relying party)** | chaque service | **Re-valide** la signature **+** autorisation **fine** : `roles`, `emailVerified`, gate d'accès (`@RequiresBilanAccess`…) | **Souveraineté** : le service ne fait **jamais** confiance aveuglément à l'edge |

**Pourquoi les deux et pas seulement l'edge ?** Parce que la passerelle est une **optimisation**, pas l'autorité. Un service qui ferait confiance à un en-tête injecté par l'edge deviendrait vulnérable dès qu'un appel contourne la passerelle (débogage, service-à-service interne, faille de config réseau). **Le modèle relying-party (P4) est préservé intact** : chaque service reste souverain sur son autorisation. La validation edge ne fait que **réduire la charge** et **échouer vite**.

**Conséquence :** aucune modification des docs de service — ils continuent de valider via JWKS. La passerelle **ajoute** une couche, elle n'en **retire** aucune.

---

## Le registre de routes (config de démarrage)

Le « registre » est une table déclarative. Version de démarrage (avant tout multi-version) :

| Si l'URL commence par… | Envoyer vers… | JWT exigé à l'edge ? |
|---|---|---|
| `/auth` | `auth-service` | **Non** (c'est ici qu'on **obtient** le badge : login/register/refresh) |
| `/.well-known/jwks.json` | `auth-service` | Non (clé publique) |
| `/ec` | `expert-comptable` | Oui |
| `/ec/webhooks/fedapay` | `expert-comptable` | **Non** (FedaPay a sa **propre** signature HMAC, vérifiée par le service) |
| `/kyc` | `kyc-service` | Oui |
| `/catalog` | `catalog-service` | Oui |
| `/bilan` | `bilan-service` | Oui |

- **Une route = 4-5 lignes** dans le fichier de config. **Ajouter un module = ajouter une entrée** (convention de routage par préfixe, alignée sur P10 — aucun code existant touché).
- Les routes `@Public` (login, JWKS, webhooks signés) **sautent l'étape [2]** : le service gère leur propre sécurité.

---

## Résolution multi-version (étape [4], différée)

C'est le mécanisme qui rend le Bilan versionné par organisation **transparent** pour le client (même URL `/bilan/...`, upstream différent selon l'org).

- **Source** : un **mini-consumer Kafka** du topic **`entitlement.changed`** (même patron read-model que les verticaux) alimente un cache **Redis** : `entitlements:{orgId}:{module} → { versionCode }`.
- **Résolveur** (~100 lignes) : extrait `org` du JWT (déjà validé en [2]), lit `entitlements:{org}:bilan` dans Redis, **réécrit l'upstream** vers `bilan-v2.svc` ou `bilan-v1.svc`. Rien de nouveau conceptuellement — c'est le read-model d'entitlement que `catalog-service` publie déjà, consommé côté edge.
- **CRITICAL — passe-plat par défaut :** **tant qu'il n'existe qu'une seule version d'un module en prod, l'étape [4] est un no-op.** Le résolveur ne se **code que le jour où `bilan-v2` existe réellement**. **Ne pas le construire avant** — la passerelle de démarrage = **routes par préfixe + validation JWKS + rate limit**, point.
- Cohérent avec la stratégie de `bilan-service` : *écart de code majeur* → 2 déploiements routés ici ; *écart de référentiel seul* → **pas** de routage edge (chargé par tenant dans le service).

---

## Sécurité (posture edge)

- **Services sans port public (G6)** : en prod, les services n'exposent **aucun** port sur l'extérieur ; la passerelle est la **seule** surface exposée. Réduit drastiquement la surface d'attaque et **rend la passerelle physiquement obligatoire** (pas seulement par convention).
- **JWKS caché** : la passerelle met en cache la clé publique de l'IdP et la rafraîchit ; la **rotation `kid`** est absorbée sans reconfiguration (**G5**).
- **Rate limiting par tiers** : global (ex. 100/min/IP) + routes sensibles plus strictes (login 5/min) — cohérent avec les valeurs des services.
- **Terminaison TLS** à l'edge ; trafic interne sur réseau privé du cluster/compose.
- **Défense en profondeur** : la validation service (relying party) protège même si une requête contourne l'edge.

---

## Choix produit — Traefik (G5)

Retenu : **Traefik**, pour deux raisons concrètes au contexte PROSPERA :
1. **Intégration native `docker-compose`** (contrainte « démarrage docker compose » conservée) **et CRD Kubernetes natives** (`IngressRoute`) → **même produit** du dev au prod.
2. Le **plugin JWT communautaire consomme directement le JWKS** → la **rotation `kid`** d'`auth-service` fonctionne **sans reconfiguration**. *(Kong OSS exige de coller la clé publique PEM à la main et de la mettre à jour à chaque rotation — friction évitée.)*

*Alternatives :* Kong (plus riche, mais JWKS/rotation moins fluide en OSS), NGINX Ingress (puissant, config plus verbeuse). Réversible : le contrat (routes + JWKS + rate limit) est standard.

---

## Dev vs prod

- **Dev (aujourd'hui)** : les services gardent leurs ports directs (`:3000`–`:3004`) via le `docker-compose` racine — plus simple pour coder au quotidien. La passerelle n'est **pas nécessaire** tant qu'on développe un service à la fois. *(Le retrait des ports publics est une bascule de prod, pas une contrainte de dev.)*
- **Prod** : passerelle **obligatoire**, services **sans port public**, TLS, résolveur multi-version activé si ≥ 2 versions. Détail K8s/Helm/ArgoCD → doc ops.

---

## Journal de décisions

**G1 — Passerelle = produit existant + un seul composant maison (vs service codé de zéro)**
✓ On ne réinvente ni la validation JWT, ni le rate limiting, ni le routage (config déclarative). ✗ Un produit à opérer. *Le seul code maison est le résolveur d'entitlements (étape [4]), et il est différé.*

**G2 — Validation JWT à deux niveaux : edge fail-fast + service souverain (vs edge-only ou service-only)**
✓ Refoule tôt les jetons invalides **sans** retirer la souveraineté des relying parties ; préserve P4 (zéro-trust). ✗ Double vérification de signature (coût négligeable). *Le service ne fait **jamais** confiance aveuglément à l'edge ; l'autorisation fine (rôles, emailVerified, gate) reste dans le service.*

**G3 — Routage par préfixe d'URL (une ligne par module)**
✓ Ajouter un module = une entrée de config, aucun code touché ; lisible. ✗ Convention de préfixes à tenir (`/auth`, `/ec`, `/kyc`, `/catalog`, `/bilan`). *Aligné P10 (la liste des modules grandit, la forme ne bouge pas).*

**G4 — Résolveur de version = passe-plat jusqu'à la 2ᵉ version (ne pas construire avant)**
✓ Complexité introduite **uniquement** quand elle sert (`bilan-v2` réel) ; read-model Redis alimenté par `entitlement.changed` (patron existant). ✗ Un mini-consumer + cache à opérer le moment venu. *La passerelle de démarrage = routes + JWKS + rate limit.*

**G5 — Traefik (vs Kong / NGINX Ingress)**
✓ Natif docker-compose **et** CRD K8s ; JWKS/rotation `kid` sans reconfiguration. ✗ Écosystème de plugins plus restreint que Kong. *Même produit dev→prod ; réversible (contrat standard).*

**G6 — Services sans port public (passerelle = seule surface exposée)**
✓ Surface d'attaque minimale ; passerelle physiquement obligatoire. ✗ Débogage direct d'un service nécessite un accès réseau interne. *Bascule de prod ; le dev conserve les ports directs.*

---

## Risques & points ouverts

1. **Sur-ingénierie précoce** — construire le résolveur multi-version avant `bilan-v2` = complexité inutile. Garde-fou : **G4** (passe-plat par défaut).
2. **Faux sentiment de sécurité edge** — croire que « la passerelle a validé » dispense le service. Garde-fou : **G2** (le service re-valide **toujours**).
3. **Cache d'entitlement obsolète** (étape [4]) — une révocation doit se propager vite au cache Redis edge ; lag de consommation à surveiller (métrique), état absolu → rejeu sûr.
4. **Webhooks** — les routes de webhooks (FedaPay) doivent rester `@Public` à l'edge (signature propre au service) ; ne jamais exiger de JWT dessus.
5. **Cohérence des tiers de rate limit** entre edge et services — source unique de vérité des limites à documenter (éviter la divergence).
6. **Détail déploiement** (K8s/Helm/ArgoCD/`platform-config`) reporté au doc ops ; ce document fixe le rôle et les invariants edge.

---

## Historique des révisions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2026-07-07 | vivian | Architecture initiale de la passerelle : pipeline en 5 étapes, **décision de validation JWT à deux niveaux (edge fail-fast + service souverain, G2)**, routage par préfixe, résolution multi-version différée (G4), services sans port public (G6), choix Traefik (G5). Subordonné à P4/P9/P10 de l'architecture programme. |

---

**Document créé avec BMAD Method v6 — Phase 3 (Solutioning)**
*Prochaine étape (différée) : doc ops/déploiement (K8s/Helm/ArgoCD/GitOps) ; config Traefik concrète (routes + JWKS) au moment d'introduire la passerelle en prod. Le squelette du résolveur ne se code qu'à l'arrivée d'une 2ᵉ version de module.*
