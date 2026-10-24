# STORY-722 : Audit des notifications refusées — un acte par compte et par jour, jamais un par refus

Status: done

**Épic :** EPIC-042 · **Service :** `paiement-service` · **Points :** 2 · **Rail :** E3
**Prérequis :** [[STORY-286]] (le compteur borné des refus) · **Réf. :** AD-10

## Le fait

[[STORY-286]] **compte** les notifications refusées par compte, motif et jour, hors de toute chaîne :
un compteur modifiable, effacé au bout de 90 jours. Rien d'opposable ne dit qu'un compte a reçu
quarante envois falsifiés un mardi.

## Les trois voies — tranchées à l'ouverture

| Voie | Pourquoi |
|---|---|
| A — le compteur seul | Rien d'opposable ; effacé à 90 jours. |
| **B — un acte par compte et par jour échu** *(retenue)* | Opposable, et **borné** : au plus un acte par compte et par jour, écrit par le service, jamais par l'envoi. |
| C — un acte par refus | Un inconnu, sur une route publique, allongerait sans fin la chaîne d'audit d'un compte. Écartée. |

⚠️ **Décision prise sur la voie qui borne, à confirmer par le PO.**

## Critères d'acceptation

- [x] AC-1 — Chaque jour **échu** se scelle en **un** acte `NOTIFICATIONS_REFUSEES_DU_JOUR` sur la
      chaîne du **compte**, signé du module `SCELLEMENT_DES_REFUS` : jour, total, motifs et nombres.
- [x] AC-2 — ⛔ Quarante mille refus, un acte. Rien de l'envoi n'entre (passé au vrai tamis).
- [x] AC-3 — ⛔ Le jour en cours n'est jamais scellé : il compte encore.
- [x] AC-4 — ⛔ Un jour scellé ne se rescelle pas ; deux tours concurrents : la transition est dans le
      filtre, le second lève et n'écrit pas.
- [x] AC-5 — Une veille horaire délègue ; les inventaires des minuteries et des écritures de la piste
      d'audit sont mis à jour.

## Livraison — 2026-10-23

`MNV-722` (`7ee69dd`) sur `origin/dev` (`93d1614`). 4 143 tests unitaires, 40 e2e, lint 0.

## Point ouvert

- Un refus sur un compte **inexistant** n'est ni compté ni scellé ([[STORY-286]]) : il reste au
  journal applicatif. C'est voulu (rien qu'un inconnu puisse créer), et à revoir si le PO veut voir
  les balayages.
