# STORY-582 : Consentement enregistré par personne, canal et nature — jamais déduit d'une absence de refus

Status: ready-for-dev

**Épic :** EPIC-059 — Consentement, désabonnement et droits des personnes
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-571** (base protégée) · **STORY-573** (carnet)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-14, AD-1.

---

## Le fait

⛔ **Le consentement ne se déduit jamais de l'absence de refus.** Il est enregistré, daté et **sourcé**
(FR-N46).

⚡ **Deux défauts symétriques, et ils coûtent autant l'un que l'autre** : une promotion envoyée à qui
l'a refusée, et une mise en demeure bloquée par un désabonnement marketing.

## Critères d'acceptation

- [ ] AC-1 — `Consentement` porte `(identifiantCanal, canal, nature)`, une date et une **source**.
      Vit dans `notification_service_preuves` (STORY-571).
- [ ] AC-2 — ⚡ **Append-only** : un revirement est **une entrée de plus**, jamais un `update`.
      L'état courant est la **projection de la dernière entrée** par `(identifiantCanal, canal,
      nature)`. Test de mutation contre la vraie base.
- [ ] AC-3 — ⚡ **Le refus suit la personne, pas le module** : le contact étant unique dans
      l'organisation (AD-11), un refus vaut pour **tous** ses modules (FR-N49).
- [ ] AC-4 — ⛔ **Il n'éteint pas les messages transactionnels** (FR-N50, AD-1). Le régime naît du
      point d'entrée, jamais d'un paramètre. Un test envoie une mise en demeure à une personne
      désabonnée de la nature `MASSE` et vérifie qu'elle **part**.
- [ ] AC-5 — Un envoi vers un destinataire refusé rend `DESTINATAIRE_DESABONNE`, code nommé et stable.

## Notes

- Le cloisonnement s'applique : le consentement d'une personne dans l'organisation A est invisible et
  sans effet dans l'organisation B (NFR-5).
