# STORY-587 : Fin de relation — export puis suppression complète à 90 jours, et le §9.3 du PRD est amendé

Status: ready-for-dev

**Épic :** EPIC-062 — Rétention, purge et fin de relation 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-586** (purge tracée)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-15, AR-20.

---

## Le fait

À la résiliation : export du carnet et du journal **mis à disposition**, puis **suppression complète à
90 jours**. Aucune donnée d'un client résilié ne survit ni ne sert à un autre.

⛔ **Cette story porte aussi un correctif de document, pas seulement du code (AR-20).** Le **§9.3 du
PRD est faux** : il affirme que ne pas conserver le rendu évite de dupliquer les variables sensibles
au journal — alors que FR-N35 **les journalise explicitement**. `{montantDu, nom}` est aussi personnel
que le texte rendu. L'horloge des variables (STORY-586) rend l'affirmation vraie **au bout de 90
jours** ; le texte, lui, reste à amender.

## Critères d'acceptation

- [ ] AC-1 — À la résiliation, un export du carnet et du journal est **mis à disposition** de
      l'organisation, dans un format lisible et complet.
- [ ] AC-2 — **Suppression complète à 90 jours** (FR-N67), tracée comme toute purge (STORY-586 AC-5).
- [ ] AC-3 — La preuve de désabonnement **survit** à la suppression (FR-N68, AD-14).
- [ ] AC-4 — ⛔ AR-20 : le **§9.3 du PRD est amendé** dans
      `prds/prd-notification-2026-08-02/prd.md`, et l'amendement dit ce qui est vrai — les variables
      sont journalisées, et c'est leur horloge de 90 jours qui borne l'exposition. *Un PRD qui ment
      sur sa minimisation est une pièce opposée à l'organisation.*

## Notes

🏁 Clôt EPIC-062.
