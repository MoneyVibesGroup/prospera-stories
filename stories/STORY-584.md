# STORY-584 : Droits des personnes — l'effacement conserve la preuve du désabonnement

Status: ready-for-dev

**Épic :** EPIC-059 — Consentement, désabonnement et droits des personnes 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-583** (désabonnement)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-14.

---

## Le fait

⚡ **Le contresens à ne pas commettre : effacer sa propre preuve de conformité en même temps que la
donnée qu'elle protège.** Un effacement supprime le contact et le journal détaillé, et **conserve la
preuve du désabonnement** — c'est-à-dire la pièce qui prouve qu'on avait le droit de se taire.

## Critères d'acceptation

- [ ] AC-1 — Restitution, rectification et effacement **par identifiant de canal**, sur demande
      **transmise par l'organisation responsable** (FR-N51). Ce service n'a pas de relation directe
      avec la personne.
- [ ] AC-2 — ⛔ L'effacement supprime le `Contact` et le journal détaillé, et **laisse intacte**
      l'entrée de désabonnement dans `notification_service_preuves` (FR-N52).
- [ ] AC-3 — La garantie est un **privilège serveur, pas une vigilance de code** : depuis le compte
      applicatif, l'effacement de la preuve **échoue** contre la vraie base (STORY-571 AC-3).
- [ ] AC-4 — La restitution est **cloisonnée** : l'organisation A ne restitue que ce qu'elle détient
      sur cette personne, jamais ce que l'organisation B détient (NFR-5).
- [ ] AC-5 — Chaque acte est **tracé** dans la base protégée avec sa date, son auteur et son motif.

## Notes

🏁 Clôt EPIC-059.
