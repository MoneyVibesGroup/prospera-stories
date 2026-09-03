# STORY-585 : Durées paramétrables et plafond opposable — un dépassement est refusé, jamais ramené en silence

Status: ready-for-dev

**Épic :** EPIC-062 — Rétention, purge et fin de relation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-579** (journal et ses horloges)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-15.

---

## Le fait

⛔ **Le cœur de cette story est le refus, pas le paramètre.** Toute durée est paramétrable par
organisation **dans la limite d'un plafond que le service refuse de dépasser**.

Ramener en silence est le défaut coûteux : l'organisation **croit** avoir configuré ce qu'elle n'a
pas, et ne le découvre qu'au litige.

## Critères d'acceptation

- [ ] AC-1 — Les durées de conservation sont paramétrables **par organisation** (FR-N64), chacune
      bornée par un **plafond opposable**.
- [ ] AC-2 — ⛔ Une tentative au-delà du plafond est **rejetée** par l'erreur nommée
      `DUREE_AU_DELA_DU_PLAFOND` (`422`), **jamais ramenée silencieusement**. Test explicite.
- [ ] AC-3 — Les plafonds ne sont **pas en configuration d'environnement** : ce sont des données du
      domaine, versionnées et lisibles.
- [ ] AC-4 — La durée effective d'une organisation est **restituable** : elle doit pouvoir vérifier
      ce qui s'applique réellement.

## Notes

- Exception connue et bornée : le message à valeur probante (mise en demeure) est conservé **5 ans**,
  plafond **10** (AD-15).
