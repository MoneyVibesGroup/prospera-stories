# STORY-718 : La chaîne d'audit vérifiable par route — l'auditeur recalcule lui-même

Status: done

**Épic :** EPIC-042 — Exploitation, conformité et recette
**Service :** `paiement-service` · **Points :** 3 · **Rail :** E3
**Prérequis :** [[STORY-240]] (le journal chaîné), [[STORY-286]] (la console d'exploitation)
**Réf. :** AD-10, FR-P61

## User story

En tant qu'**auditeur d'une organisation**, je veux **vérifier moi-même qu'aucune entrée de la piste
d'audit n'a été altérée**, afin de **ne pas croire le service sur parole**.

## Le fait

`JournalAudit.verifierChaineDeCreance` existe depuis [[STORY-240]] et n'avait **aucun appelant
HTTP** ; [[STORY-241]] notait déjà qu'il faudrait un droit `paiement:journal:consulter`.

## Critères d'acceptation

- [x] AC-1 — Une route rend le **verdict** d'une chaîne — par créance (la clef se dérive comme le
      journal la dérive) ou par clef de chaîne (compte, relevés, raccordement, routage, barème).
- [x] AC-2 — ⚡⚡ **La preuve, pas seulement le verdict** : chaque entrée est rendue telle qu'elle a
      été signée, avec son empreinte, et la réponse décrit la méthode. Un test refait le calcul comme
      un auditeur, depuis le JSON reçu.
- [x] AC-3 — Une entrée falsifiée se voit : rupture au rang fautif.
- [x] AC-4 — ⛔ **Cloisonnement** : une seule entrée d'une autre organisation et la chaîne n'existe pas
      (`404` commun) ; une clef mal formée rend le même `404`, sans lecture.
- [x] AC-5 — ⛔ **Lecture seule** : la classe reçoit le modèle du journal, jamais `JournalAudit` ;
      deux `GET` sous le droit de tenant `paiement:journal:consulter`.
- [x] AC-6 — La console d'exploitation la porte pour la plateforme
      (`GET /v1/exploitation/organisations/:o/chaines/:cle`).
- [x] AC-7 — Au-delà de 10 000 entrées : un refus nommé, jamais un verdict sur une chaîne tronquée.

## Livraison — 2026-10-23

`MNV-718` (`9eae3d9`) sur `origin/dev` (`922e0f8`). 4 107 tests unitaires (304 suites), lint 0.

### Points ouverts

1. `paiement:journal:consulter` est un droit de **tenant** : comme les sept de FR-P59, l'IdP ne
   l'attribue pas encore à un rôle de tenant — l'auditeur d'une organisation ne peut pas l'exercer
   avant l'extension du catalogue ; la plateforme, elle, le peut par la console.
2. Lister les chaînes d'une organisation exigerait un index `orgId` sur le journal, posé par le
   compte de maintenance — hors de ce service.
