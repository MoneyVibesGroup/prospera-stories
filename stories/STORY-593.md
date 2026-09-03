# STORY-593 : Préparation, prévisualisation sur échantillon, retenus et écartés avec leur motif

Status: ready-for-dev

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-592** (instantané et curseur) · **STORY-574** (segments)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-13.

---

## Le fait

⚡ **Les trois temps sont distincts et l'objet préparé est réutilisable** : préparer, prévisualiser sur
un échantillon, exécuter (FR-N29).

⚡ **Les écartés sont écrits eux aussi**, avec leur motif nommé. Le compte rendu préalable devient
alors une simple **agrégation**, sans machinerie supplémentaire.

## Critères d'acceptation

- [ ] AC-1 — Préparation, prévisualisation sur échantillon et exécution sont **trois actes distincts**.
      L'objet préparé est **réutilisable**.
- [ ] AC-2 — Les destinataires écartés sont **persistés** avec leur motif nommé : `DESABONNE`,
      `CANAL_ABSENT`, `IDENTIFIANT_INVALIDE`.
- [ ] AC-3 — Le compte rendu préalable (FR-N31) rend **retenus, écartés et pourquoi, nombre de
      segments et coût estimé** — par simple agrégation sur ce qui est déjà écrit.
- [ ] AC-4 — Le nombre de segments et le coût estimé viennent de la **fonction pure** de STORY-574 :
      annonçables **avant** le choix du canal.
- [ ] AC-5 — Un envoi de masse est **interruptible en cours d'exécution**, avec **état exact au moment
      de l'arrêt** (FR-N32) — conséquence directe du curseur, aucun mécanisme dédié.
- [ ] AC-6 — La prévisualisation emprunte le chemin de rendu **qui ne peut pas produire d'`Envoi`**
      (STORY-575 AC-4) : aucun quota, aucun coût, aucune ligne au journal.

## Notes

- Le coût estimé est **étiqueté comme estimation**. Le coût réel est figé à l'envoi (STORY-595) et
  porte sa `sourceCout`.
