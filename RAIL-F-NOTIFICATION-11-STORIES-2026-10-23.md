# Rail F — `notification-service` : la parole, la remise, les routes

**Date :** 2026-10-23 · **Service :** `prospera-notification-service` (+ `auth-service`, `kyc-service`, `expert-comptable` pour 590) · **Branche d'intégration :** `dev`
**Total :** 11 stories · 37 points · **Identifiants :** STORY-589, STORY-590 (existantes) + **STORY-706 → STORY-714** (neuves).

> Se termine sur un service qui détient seul la parole, dont les envois arrivent et dont chaque route
> est gardée.

Chaque manque a été **vérifié dans le code** le 2026-10-23, sur `origin/dev` (`4e37f08`).

---

## F1 · Le chemin direct · 8 pts

| Story | Titre | Pts | Constat |
|---|---|---|---|
| STORY-589 | Route directe authentifiée pour les messages à secret | 5 | ✅ **Livrée le 2026-10-23** — le jeton de service de 608 ratifié. |
| STORY-590 | Les trois services cessent d'envoyer eux-mêmes | 3 | SM-1 = 0, mesuré. ⚠️ **Se fait après STORY-610** (`auth-service`), hors rail. |

## F2 · Le temps et les secrets · 8 pts

| Story | Titre | Pts | Constat dans le code |
|---|---|---|---|
| STORY-706 | Clôture automatique de la période | 3 | `ClotureService.clore` n'a qu'un appelant : une route manuelle. Prérequis de 647. |
| STORY-707 | Rotation du secret de signature à la remise | 3 | `secretSortantServi` n'a **aucun** appelant ; `remettre` signe avec le seul secret courant. |
| STORY-708 | Liste des envois programmés à venir | 2 | Le journal ne filtre ni ne trie par `remettreLe`. |

## F3 · Délivrabilité et sécurité · 11 pts

| Story | Titre | Pts | Constat dans le code |
|---|---|---|---|
| STORY-709 | Revérification périodique des passerelles et domaines | 3 | Domaine : 30 jours (`VALIDITE_VERIFICATION_JOURS`), personne ne refait la preuve. Passerelle : `VERIFIEE` pour toujours. |
| STORY-710 | SPF et DKIM du domaine d'envoi | 5 | Seule la propriété est attestée (`_prospera-verification`). |
| STORY-711 | Adresse sortante contrôlée après résolution DNS | 3 | ⛔ `adresseSortanteAcceptable` lit l'hôte **écrit** ; le code nomme lui-même le trou. |

## F4 · Données et droits · 10 pts

| Story | Titre | Pts | Constat dans le code |
|---|---|---|---|
| STORY-712 | Un seul compteur de consommation | 3 | L'écran de l'organisation agrège les `Envoi`, l'arrêté lit `compteurs_consommation`. |
| STORY-713 | Retirer un contact d'une liste | 2 | Aucune route de retrait (`listes.controller.ts` : 4 routes, aucune `@Delete`). |
| STORY-714 | Des droits sur les routes non gardées | 5 | `retention.controller.ts` et `droits-personnes.controller.ts` : 7 routes, **aucun** `@RequiertDroit`. Arbitrage : amende AD-18. |

---

## Ordre

F1 (589) → F2 → F3 (709 avant 710) → F4 → 590 en dernier, une fois 610 livrée. Chaque story part
d'`origin/dev`, une branche `MNV-<n>`, et se pousse avant la suivante.
