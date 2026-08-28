# STORY-530 : Le périmètre de groupe — mère, filiales, pourcentages, et la date à laquelle tout ça était vrai

Status: ready-for-dev

**Épic :** EPIC-136 — Multi-société et périmètre de groupe
**Service :** `dossier-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-529** (plusieurs sociétés par organisation)
**Origine :** §6.3 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

Avant toute consolidation, il faut un **périmètre** : quelles sociétés, détenues à quel pourcentage,
depuis quand, et selon quelle méthode.

⚠️ **Un périmètre est daté, et c'est ce qui le rend difficile.** Une filiale acquise en juin n'entre
au périmètre qu'à partir de juin ; une filiale cédée en octobre en sort. Un périmètre sans dates est
un organigramme, pas un périmètre — et il produirait une consolidation fausse dont personne ne
verrait la cause.

## Critères d'acceptation

- [ ] AC-1 — Un **lien de participation** : société détentrice, société détenue, **pourcentage de
      contrôle** et **pourcentage d'intérêt** (les deux, ils diffèrent en cascade), **date d'effet**
      et date de fin éventuelle.
- [ ] AC-2 — La **méthode** est portée par le lien : intégration globale, intégration proportionnelle,
      mise en équivalence, hors périmètre. ⛔ Elle est **déclarée**, jamais déduite du pourcentage —
      le contrôle peut exister sans la majorité, et la majorité sans le contrôle.
- [ ] AC-3 — Le périmètre est **restituable à une date** : `perimetre(dossierId, date)` rend les
      sociétés retenues avec leur méthode et leurs pourcentages **à cette date**.
- [ ] AC-4 — Les **participations en cascade** sont supportées (mère → fille → petite-fille), et le
      pourcentage d'intérêt est calculé par produit des chaînes. ⚠️ Les **participations
      circulaires** sont **détectées et refusées**, pas calculées en boucle.
- [ ] AC-5 — ⛔ **Aucune consolidation dans cette story.** Elle livre le périmètre, et le périmètre
      seul a déjà une valeur : il permet à un cabinet de voir son groupe.
- [ ] AC-6 — Le périmètre appartient au **dossier de la mère**, et ne franchit jamais la frontière de
      l'organisation : deux cabinets ne partagent pas un périmètre.

## Notes

- Voir [[STORY-529]], [[STORY-531]].
