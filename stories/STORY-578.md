# STORY-578 : Trois files séparées, la file déterminée par la nature de l'envoi et jamais par l'appelant

Status: ready-for-dev

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-577** (port de canal et adaptateur e-mail)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-1, AD-18, AR-04.

---

## Le fait

⛔ **Cette story ferme un défaut que la recette ne verrait pas.** Sur une file commune, un envoi de
masse de 50 000 retarde de **plusieurs heures** le code de vérification dont NFR-3 exige
**P95 < 10 s** — et personne ne s'en aperçoit tant que le volume reste petit.

⚡ **La file est déterminée par la nature de l'envoi, jamais choisie par l'appelant.** Aucun DTO
d'entrée ne porte ce mot (AD-1). Il suffirait d'un `nature` à « TRANSACTIONNEL » écrit par
copier-coller pour qu'une promotion parte sous le régime « service » chez quelqu'un qui l'a refusée,
**sans qu'aucun test ne casse**.

## Critères d'acceptation

- [ ] AC-1 — Trois files BullMQ **disjointes** — `transactionnel-prioritaire`, `transactionnel`,
      `masse` — avec **pools d'exécutants séparés**.
- [ ] AC-2 — ⛔ **Aucun cas d'usage n'accepte `nature` en entrée.** Un test de présence refuse le
      champ dans tout DTO d'entrée. La nature naît du **point d'entrée** : le cas d'usage
      transactionnel produit `TRANSACTIONNEL`, l'exécution d'un `EnvoiDeMasse` produit `MASSE`.
- [ ] AC-3 — La file `transactionnel-prioritaire` est réservée aux envois **sensibles au temps**
      (code de vérification). Le critère est une donnée du modèle, pas un paramètre d'appel.
- [ ] AC-4 — ⚡ **Preuve de la séparation** : 5 000 travaux poussés sur `masse`, puis un envoi
      prioritaire, dont la latence reste **sous la cible NFR-3**. Mesuré, consigné, et **non
      extrapolé**.
- [ ] AC-5 — ⚠️ **Aucun `setInterval`, aucune minuterie applicative, aucun ordonnancement en mémoire
      de processus — nulle part dans le service** (AD-18). Tout fait temporel est un travail BullMQ
      **à clé idempotente**. Test de présence sur l'ensemble des sources.

## Notes

- La règle AD-18 se pose **ici** parce que c'est la story qui introduit BullMQ. Posée plus tard, elle
  arriverait après les premières minuteries.
