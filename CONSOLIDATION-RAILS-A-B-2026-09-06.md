# Consolidation — ce qui n'existe qu'une fois les deux rails livrés

**Date :** 2026-09-06 · **Total :** 28 points · **À ne tirer qu'après** `RAIL-A` **et** `RAIL-B`.

> Les deux rails de 20 se livrent **en parallèle et sans se parler**. Chacun teste sa frontière
> contre un double : le rail A appelle un service de notification simulé, le rail B est appelé par
> un client simulé. Ce document porte les cinq stories qui ne peuvent **pas** être testées ainsi,
> parce qu'elles n'ont de sens que quand les deux vrais services se répondent.

---

## Pourquoi ces cinq-là ne sont dans aucun rail

| Story | Ce qu'elle traverse |
|---|---|
| STORY-279 | `paiement` → `platform-catalog-service` |
| STORY-609 | `platform-catalog-service`, contrat lu par **tous** les verticaux |
| STORY-610 | `auth-service` → `notification-service` |
| STORY-630 | les quatre services, dans un seul scénario |
| STORY-631 | les quatre services, dans un scénario **sans** Money Vibes au milieu |

---

## 1 · STORY-279 — Le catalogue consomme les événements d'abonnement

**Service :** `platform-catalog-service` · **Points :** 5 · **Prérequis :** rail A jusqu'à 278

⚡ **C'est ce qui remplace la décision C8, ouverte depuis STORY-034.** Sans elle, encaisser un
abonnement ne fait rien : les droits restent ce qu'un humain en a fait.

- Échéance encaissée → l'entitlement est octroyé, **idempotent sur l'identifiant d'événement**.
- Impayé → révoqué. Régularisé → rétabli.
- ⛔ `paiement-service` **n'écrit jamais** d'entitlement : il déclenche, il relit comme tout le monde.

## 2 · STORY-609 — Le droit d'usage porte une échéance, le renouvellement prolonge

**Service :** `platform-catalog-service` · **Points :** 5 · **Fiche écrite :** `stories/STORY-609.md`

⛔ **La seule story de cet ensemble qui ne sert pas la démonstration mais le REVENU.** Un droit
octroyé ne s'éteint aujourd'hui que sur révocation, qui exige le réseau **et** quelqu'un qui y pense.
Un droit qui expire par défaut fait que **le silence ferme**.

⚠️ **Change un contrat lu par `bilan`, `fiscal`, `dossier`, `balance` et `paiement`.** À annoncer aux
équipes avant livraison : un service qui teste *différent de révoqué* ouvrirait un module expiré.

## 3 · STORY-610 — Les sept courriels de compte passent par la notification

**Service :** `auth-service` · **Points :** 8 · **Fiche écrite :** `stories/STORY-610.md`
**Prérequis :** rail B jusqu'à 611 et 617

⛔ **Le sens des dépendances est le risque.** L'authentification est la **racine** du graphe ; la
notification en est une feuille. L'appel de la racine vers la feuille n'est acceptable qu'à une
condition, et elle est vérifiée par un test avec le service coupé : **l'inscription réussit quand
même**.

## 4 · STORY-630 🆕 — Recette croisée : un cabinet paie son abonnement

**Points :** 5 · **Prérequis :** tout ce qui précède

**Récit :** en tant que **direction**, je veux voir un cabinet payer son abonnement de bout en bout,
afin de savoir que le modèle économique fonctionne avant d'ouvrir la verticale.

Le scénario complet, en un seul test, sur le bac à sable :

- [ ] AC-1 — Un utilisateur s'inscrit ; le message de vérification part **par le service de
      notification**, sous la marque de son organisation.
- [ ] AC-2 — Money Vibes ouvre un abonnement pour le cabinet : périodicité, montant, échéance.
- [ ] AC-3 — L'échéance **est une créance** ; une demande est émise, un lien est créé.
- [ ] AC-4 — Le lien arrive au cabinet par courriel, **sous l'identité d'envoi de Money Vibes**.
- [ ] AC-5 — ⛔ Aucun jeton de lien n'a transité par le bus ni n'apparaît dans un journal.
      Vérifié sur la trace, pas sur le code.
- [ ] AC-6 — Le cabinet paie sur la page publique ; la notification signée du fournisseur crée
      l'encaissement.
- [ ] AC-7 — Le droit d'usage du cabinet s'**ouvre** sans intervention manuelle, et son échéance est
      **prolongée**, pas recréée.
- [ ] AC-8 — Une cloche annonce l'échéance suivante dans l'application du cabinet.
- [ ] AC-9 — ⛔ Le compte crédité est celui de **Money Vibes**, et un test vérifie l'invariant
      inverse : aucune créance du cas client n'a pour bénéficiaire un compte que Money Vibes
      contrôle.

## 5 · STORY-631 🆕 — Recette croisée : un distributeur encaisse pour lui-même

**Points :** 5 · **Prérequis :** STORY-630

**Récit :** en tant que **direction**, je veux voir une organisation cliente encaisser **chez elle**,
afin de prouver que Prospera ne détient jamais les fonds.

⚡ **C'est la recette qui matérialise NFR-1**, et c'est la seule qui sépare vraiment le cas
plateforme du cas client. Les deux empruntent le même code ; seule la configuration change.

- [ ] AC-1 — Un distributeur enregistre **ses propres** clés de fournisseur et **son propre** compte
      d'encaissement, par la surface de l'organisation, pas par l'administration.
- [ ] AC-2 — Il enregistre **sa propre** passerelle d'envoi, et son message part sous **son**
      expéditeur, prouvé par comparaison avec l'envoi de Money Vibes du scénario précédent.
- [ ] AC-3 — Il matérialise une créance depuis son module, encaisse par lien, et le solde se
      décompose.
- [ ] AC-4 — Il encaisse aussi **en espèces déclarées**, validées par un **second rôle**.
- [ ] AC-5 — ⛔ L'argent atterrit sur le compte du distributeur. Un test vérifie qu'aucun compte
      contrôlé par Money Vibes n'apparaît dans la chaîne.
- [ ] AC-6 — Un second distributeur, avec d'autres clés, ne voit **rien** du premier : ni compte, ni
      passerelle, ni créance. Le refus est un **introuvable**, jamais un interdit.

---

## Ordre de tirage recommandé

```
Rail A ────────────────────────────────┐
  (20 stories, 73 pts, sprints 34-36)  │
                                       ├──► 279 ──► 609 ──► 630 ──► 631
Rail B ────────────────────────────────┘         (610 après B-611/617)
  (20 stories, 80 pts, sprints 34-36)
```

Les deux rails démarrent le **même** sprint. La consolidation ouvre au sprint suivant la fin du plus
lent des deux. **Total des trois ensembles : 45 stories, 181 points.**

---

## Identifiants réservés le 2026-09-06

`604` `605` `606` `607` `608` `609` `610` `611` `612` `613` `614` `615` `616` `617` `618` `619`
`620` `621` `622` `623` `624` `625` `626` `627` `628` `629` `630` `631`

⚠️ Dernier numéro pris avant cette série, toutes branches distantes et locales confondues : **603**.
Le prochain identifiant libre est désormais **632**.
