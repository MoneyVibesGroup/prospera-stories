# STORY-596 : Consommation par période, canal et nature, et ventilation par utilisateur et par rôle

Status: ready-for-dev

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-595** (coût et devises)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-16.

---

## Le fait

⚡ **Aucun envoi n'est anonyme** : il porte l'utilisateur qui l'a déclenché, ou à défaut le module ou
la règle automatique à l'origine (FR-N57).

⚡ **Le rattachement organisationnel de l'auteur est figé au moment de l'envoi**, et c'est ce qui évite
qu'un changement d'équipe **réécrive l'historique** de consommation de l'ancienne.

## Critères d'acceptation

- [ ] AC-1 — Restitution par **période, canal et nature** : volume envoyé, délivré, échoué, coût
      (FR-N59) — **par devise** (STORY-595 AC-4).
- [ ] AC-2 — Ventilation interne **par utilisateur et par rôle** au v1, lus du read-model d'identité
      (FR-N60).
- [ ] AC-3 — ⚡ Le rattachement est **figé à l'envoi**, jamais recalculé (FR-N58). Test : changer le
      rôle d'un utilisateur **ne modifie pas** la ventilation historique.
- [ ] AC-4 — La ventilation par **équipe** au sens métier arrivera avec le module Équipe (#18) et
      n'exigera **aucune reprise de données** — précisément parce que le rattachement est déjà figé.
      Documenté comme tel.
- [ ] AC-5 — ⚠️ **Aucune facturation ni blocage sur dépassement au v1** (FR-N63). Le modèle de coût
      est complet pour que la facturation s'y branche sans reprise, **pas pour qu'elle existe**. Un
      test refuse tout chemin de blocage.

## Notes

- La restitution est bornée à l'organisation du jeton. La vue toutes-organisations est STORY-597, et
  elle passe par un autre chemin de lecture.
