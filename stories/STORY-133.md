# STORY-133 : IP des sessions — trancher le proxy de confiance, sinon l'écran « Sessions ouvertes » affiche l'IP de l'app

**Epic :** EPIC-002 — Authentification & sécurité du compte (auth-service)
**Réf. :** STORY-126 § Technical Notes (« IP derrière proxy — à trancher au déploiement ») · FE-021
**Priorité :** Should Have
**Story Points :** 3
**Statut :** à faire
**Sprint :** à planifier (avant toute mise en production de l'écran)
**Créée le :** 2026-07-23
**Origine :** Integration Gate de **FE-021**, en deux contextes navigateur contre le stack docker
**Services :** `auth-service` (:3001)

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

**Hors périmètre :** géolocalisation (ville/pays) — reste la question ouverte de STORY-126, distincte de
celle-ci et à instruire seulement une fois l'IP juste.

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

---

## Dependencies

- **Ne bloque pas** FE-021 : l'écran est livrable, il affiche l'IP telle que servie et ne promet rien
  d'autre (la note de bas de carte dit explicitement que l'IP est « celle vue par nos serveurs »).
- **Bloque** toute promesse de sécurité faite à l'utilisateur autour du lieu de connexion.

---

## Definition of Done

- Les 5 AC passent, dont **AC-02 vérifié par un test de falsification** (en-tête forgé depuis une IP non
  fiable) — sans lui, le correctif est une régression de sécurité.
- Décision de topologie **écrite** (note d'architecture ou section dédiée), pas seulement codée.
- lint 0 warning · build OK · unit + e2e verts.
