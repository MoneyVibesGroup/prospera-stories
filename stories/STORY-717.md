# STORY-717 : Plusieurs participants dans un déploiement — chaque organisation est servie chez le sien

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Rail :** E2 (RAIL-E-PAIEMENT-11-STORIES-2026-10-23)
**Prérequis :** [[STORY-666]] (le raccordement porte le participant de l'organisation)

---

## User story

En tant qu'**organisation dont la banque n'est pas celle de Money Vibes**,
je veux **que mes demandes partent chez MON établissement**,
afin de **pouvoir encaisser par le schéma sans changer de banque**.

## Le fait

L'interface d'un client business est exposée par l'établissement qui tient ses comptes, sous un
chemin qui porte son code : `https://no-mtls.piz.simulateurs.pi-bceao.com/TGD999`. Ce code était lu
de **l'environnement** (`PI_SPI_API_BASE_URL`) : un déploiement ne servait qu'un participant, et une
organisation dont la banque est une autre aurait été servie chez la première. Le participant de
chaque organisation existait pourtant déjà — sur son raccordement ([[STORY-666]]), vérifié contre
chaque compte appelé.

Mesures du 2026-10-23 :

| Élément | Portée |
|---|---|
| Serveur de jetons (Cognito) | commun à la plateforme |
| Préfixe de portée (`piz/`) | commun |
| Hôte (`no-mtls.piz.simulateurs.pi-bceao.com`) | commun |
| Code participant du chemin | **par établissement** — ⚠️ non contrôlé par le simulateur (`/SND777/comptes` rend nos comptes) |

## Les trois voies — tranchées à l'ouverture

| Voie | Ce qu'elle coûte |
|---|---|
| **A — hôte en environnement, participant du raccordement** *(retenue)* | Rien de neuf à déclarer : le participant est déjà sur le raccordement, déjà vérifié contre le compte. |
| B — une table d'origines par participant en configuration | Une configuration à tenir par établissement ; un oubli fait tomber une organisation. |
| C — un participant par déploiement, refusé à la déclaration | Ferme le service à toute organisation d'une autre banque. |

⚠️ **Décision prise sur la voie évidente, à confirmer par le PO.**

## Critères d'acceptation

- [x] AC-1 — L'origine d'un appel est `hôte + participant du raccordement de l'organisation`, pour
      les onze appels de l'adaptateur (demande, compte, alias, consultation, ordres, relève, épreuve…).
- [x] AC-2 — Deux organisations raccordées à deux participants sont servies chacune chez le sien
      (test : deux épreuves, deux chemins).
- [x] AC-3 — **Compatibilité** : une URL d'environnement qui porte encore un code participant est
      réduite à son hôte au démarrage, et le journal le dit.
- [x] AC-4 — Recette réelle inchangée : 14 prouvés, 1 bloqué nommé, 0 échec.

## Ce que cette story ne fait pas

- Elle **ne prouve pas le routage** : le simulateur ne contrôle pas le segment ; la production le fera.
- Elle **ne change pas** le serveur de jetons, commun à la plateforme.

## Livraison — 2026-10-23

**Code :** `prospera-paiement-service`, branche `MNV-717` (`6443bba`), basée sur `origin/dev`
(`922e0f8`). 4 094 tests unitaires, 83 e2e, lint 0. `.env.example` documente l'hôte seul.

### Point ouvert

- Le `docker-compose.yml` racine garde une valeur par défaut avec `/TGD999` : sans effet (réduite à
  l'hôte), à simplifier au prochain passage dans ce dépôt.
