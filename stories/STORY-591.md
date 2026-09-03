# STORY-591 : Liste : sélection, import ou remise par un module — jamais construite ici

Status: ready-for-dev

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-573** (carnet)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-19.

---

## Le fait

⛔ **La dérive la plus probable du service commence ici**, et le PRD la nomme lui-même comme une
frontière mince. Une liste remise par un module appelant est **exécutée** ici ; elle n'est pas
**construite** ici.

Le ciblage appartient à Marketing (#10), la décision de relancer à Relance (#24). L'argument « les
données y sont déjà » reviendra — d'où une garde de schéma plutôt qu'une règle de revue.

## Critères d'acceptation

- [ ] AC-1 — Une `Liste` est un ensemble **nommé** de contacts, constitué par sélection, par import,
      ou **remis par un module appelant** (FR-N28).
- [ ] AC-2 — ⛔ **Aucun critère de segmentation métier n'entre dans le modèle de données.** Un test de
      schéma refuse tout champ de critère ou de requête stockée sur `Liste`.
- [ ] AC-3 — Une liste est cloisonnée à son organisation et ne référence que des contacts de celle-ci.
- [ ] AC-4 — Une liste est **alimentable après création** — c'est ce que FR-N28 autorise, et c'est
      précisément ce qui rend l'instantané de STORY-592 nécessaire.

## Notes

- Le nom du domaine est `EnvoiDeMasse`, **jamais « campagne »** : la campagne est l'objet du module
  Marketing (#10).
