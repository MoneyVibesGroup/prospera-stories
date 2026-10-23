# STORY-711 : L'adresse sortante est contrôlée APRÈS résolution DNS

Status: ready-for-dev

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

- [ ] AC-1 — Une règle pure du domaine dit si une **adresse IP** est publique : refuse les plages
      privées, de bouclage, lien-local, réservées et de partage IPv4 et IPv6, y compris les IPv4
      enrobées en IPv6.
- [ ] AC-2 — ⛔ La remise et le défi de vérification se connectent à une adresse **résolue et
      contrôlée au moment de la connexion** (la fonction de résolution de la connexion refuse) : un
      nom qui résout vers une adresse privée est refusé, même si la vérification de l'adresse a réussi
      la veille.
- [ ] AC-3 — Un nom qui résout vers **plusieurs** adresses dont **une** est privée est refusé.
- [ ] AC-4 — ⚠️ Le refus est une remise non acceptée, comptée en échec, sans le nom ni l'adresse dans
      le journal.
- [ ] AC-5 — Les redirections restent non suivies (STORY-641).
