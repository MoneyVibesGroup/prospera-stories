# STORY-597 : Vue plateforme sur compteurs pré-agrégés — le filtre d'organisation n'est jamais levé

Status: ready-for-dev

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-596** (restitution par organisation)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-16, AR-12.

---

## Le fait

⛔⛔ **L'erreur de cette story ne se voit pas en test fonctionnel, seulement en audit.** La restitution
commerciale est **la porte** par laquelle le cloisonnement tombe.

Le raccourci coûte cinq minutes à écrire — un `if PLATFORM_ADMIN` dans un dépôt — et rend lisibles
hors de leur organisation un contact, un journal ou un modèle. **Ce qu'aucune exigence ne demande.**

## Critères d'acceptation

- [ ] AC-1 — La vue toutes-organisations (FR-N61) lit **exclusivement des compteurs pré-agrégés** par
      `(orgId, canal, nature, période, devise)`, **maintenus à l'écriture** (AR-12).
- [ ] AC-2 — ⛔ **Aucun chemin de code ne rend l'`orgId` facultatif sur une collection
      opérationnelle** : pas de `if PLATFORM_ADMIN` dans un dépôt, pas de filtre conditionnel.
      **Test de présence** sur l'ensemble des dépôts du service.
- [ ] AC-3 — La vue est réservée au **rôle plateforme**, et un rôle tenant y reçoit `404` — jamais
      `403` (anti-énumération).
- [ ] AC-4 — Aucun contact, aucun modèle, aucune ligne de journal n'est atteignable par ce chemin :
      il ne rend que des **nombres**. Test explicite.
- [ ] AC-5 — Les compteurs sont **par devise** et ne sont jamais totalisés entre devises.

## Notes

- C'est la story du module dont la revue de sécurité doit être la plus attentive : le défaut est
  **fail-open par construction** si la garde est écrite comme une exception plutôt que comme une
  absence de chemin.
