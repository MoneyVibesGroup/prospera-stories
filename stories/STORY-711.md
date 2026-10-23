# STORY-711 : L'adresse sortante est contrôlée APRÈS résolution DNS

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F3 · ⛔ **Sécurité**
**Prérequis :** **STORY-641** (faits remis chez l'organisation)
**Origine :** rail F · point ouvert écrit dans `domain/sortie/fait-sortant.ts`.

---

## Le récit

En tant que **plateforme**, je veux qu'aucune adresse déclarée par un client ne puisse nous faire
appeler un service interne, quel que soit le nom qu'elle porte.

## Le fait

⛔⛔ **Le contrôle porte sur l'hôte ÉCRIT.** `adresseSortanteAcceptable` refuse `localhost`,
`169.254.…`, `10.…` — mais un nom public (`hook.client.tg`) qui **résout** vers `10.0.0.12` ou vers le
service de métadonnées passe, et c'est nous qui faisons l'appel, avec nos accès réseau. Le code le dit
lui-même : « il ne ferme pas le cas d'un nom public qui résout vers une adresse privée ». Le motif ne
couvre pas non plus les plages IPv6 privées (`fc00::/7`, `fe80::/10`) ni les adresses IPv4 enrobées
(`::ffff:127.0.0.1`).

⚡ **Résoudre puis appeler ne suffit pas** : entre les deux, le DNS peut changer de réponse
(*rebinding*). Le contrôle doit porter sur **l'adresse à laquelle on se connecte**.

## Critères d'acceptation

- [x] AC-1 — Une règle pure du domaine dit si une **adresse IP** est publique : refuse les plages
      privées, de bouclage, lien-local, réservées et de partage IPv4 et IPv6, y compris les IPv4
      enrobées en IPv6.
- [x] AC-2 — ⛔ La remise et le défi de vérification se connectent à une adresse **résolue et
      contrôlée au moment de la connexion** (la fonction de résolution de la connexion refuse) : un
      nom qui résout vers une adresse privée est refusé, même si la vérification de l'adresse a réussi
      la veille.
- [x] AC-3 — Un nom qui résout vers **plusieurs** adresses dont **une** est privée est refusé.
- [x] AC-4 — ⚠️ Le refus est une remise non acceptée, comptée en échec, sans le nom ni l'adresse dans
      le journal.
- [x] AC-5 — Les redirections restent non suivies (STORY-641).

---

## Livré le 2026-10-23 — branche `MNV-711` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 495/3 495 (261 suites) · `npm run test:e2e` 248/248 · lint 0 · build vert.

- **`estAdressePublique`** (`domain/sortie/adresse-ip.ts`) : une liste de plages **non publiques**, tout
  le reste est public (la liste inverse change avec chaque attribution régionale). IPv4 : `0/8`, `10/8`,
  `100.64/10` (CGNAT), `127/8`, `169.254/16` (métadonnées du nuage), `172.16/12`, `192.168/16`, plages de
  documentation et de bancs d'essai, multidiffusion, réservé. IPv6 : `::`, `::1`, `fc00::/7`,
  `fe80::/10` (zone comprise), `ff00::/8`, `2001:db8::/32`, `100::/64` — et **l'IPv4 transportée décide**
  pour `::ffff:…` (y compris en hexadécimal) et NAT64 `64:ff9b::/96`.
- ⛔⛔ **L'adaptateur passe de `fetch` à `node:https`**, parce que `fetch` ne laisse pas choisir la
  résolution du socket. L'option `lookup` est **contrôlée** (`resolution-controlee.ts`) : l'adresse
  jugée **est** celle à laquelle le socket se connecte, ce qui ferme aussi le *rebinding* (aucune seconde
  résolution entre le contrôle et l'appel). Une **IP littérale** n'est jamais résolue par Node : elle est
  jugée avant la requête. `agent: false` : aucun socket gardé vivant, jugé sous une autre résolution.
- AC-3 : **une seule** adresse non publique parmi celles rendues suffit à refuser, y compris quand Node
  demande toutes les adresses (`all: true`).
- AC-4 : le refus est une remise non acceptée, journalisée sous le code `ADRESSE_NON_PUBLIQUE` — ni le
  nom, ni l'adresse.
- À la déclaration, `adresseSortanteAcceptable` juge désormais une IP littérale par la règle complète (le
  motif d'origine laissait passer `[fd00::1]`, `[::ffff:127.0.0.1]`, `100.64.0.1`).
- ⚡ **Preuve contre un vrai socket** : un serveur écoute en local, et le test vérifie qu'il ne reçoit
  **aucune connexion** — pour une IP littérale, une IPv6, et un **nom** (`localhost`) qui résout vers le
  bouclage. **Contre-preuve faite** : sans la résolution contrôlée, ce dernier test rougit.
- Le statut HTTP de STORY-707 et l'absence de redirection suivie sont conservés (testés sur
  `https.request` remplacé).

⛔ **Ouvert** : les adaptateurs SMS, WhatsApp et push appellent toujours `fetch` vers des points de
terminaison saisis dans les réglages de passerelle — même classe de risque, hors périmètre de cette story.
