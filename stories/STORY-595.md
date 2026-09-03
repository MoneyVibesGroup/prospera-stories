# STORY-595 : Coût restitué en unité mineure et référentiel pays × devise — le XOF n'a aucune décimale

Status: ready-for-dev

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S43
**Prérequis :** **STORY-579** AC-10 (type `Cout`) · **STORY-570** AC-3 (santé dégradée)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-16, AR-15, AR-19.

---

## Le fait

⛔ **Troisième test de la définition de terminé (AR-19) : l'exactitude du XOF à zéro décimale.** Le
traiter à deux décimales donne des coûts **faux d'un facteur 100** sur le marché principal.

⚠️ **Leçon directement applicable de STORY-489** : le contrat canonique de balance a inventé deux
décimales XOF et les a nommées « unités mineures », alors que l'exposant ISO 4217 du XOF vaut **0**.
Le même défaut ici coûterait davantage, parce que **les coûts sont figés et ne se recalculent pas**.

## Critères d'acceptation

- [ ] AC-1 — ⚡ **Le nombre de décimales est lu du référentiel `pays-devises-ao@AAAA.N`, jamais
      présumé** — chargé depuis `platform-catalog-service` par `artifactUri` avec **vérification de
      checksum** (AR-15). Référentiel irrésoluble ⇒ **service dégradé**, jamais un défaut silencieux
      (STORY-570 AC-3 cesse ici d'être théorique).
- [ ] AC-2 — ⛔ Test de la définition de terminé : un coût XOF de 25 F se lit **25**, jamais 2 500.
      Le test couvre aussi le GNF (zéro décimale) et une devise à deux décimales.
- [ ] AC-3 — Aucun flottant, **aucun coût nu en signature de fonction** : `Cout` est le type unique du
      domaine. Test de présence.
- [ ] AC-4 — ⚡ **Jamais d'agrégat inter-devises** : la restitution est **par devise**, sans conversion
      ni total (FR-N57c). *Additionner des XOF et des NGN ne produit aucun nombre qui veuille dire
      quelque chose.* Un test refuse la route qui tenterait le total.
- [ ] AC-5 — Le **tarif appliqué** est enregistré avec l'envoi, **pas recalculé à la lecture**
      (FR-N62). Le coût réellement facturé, quand la passerelle le transporte, porte sa `sourceCout`
      (`REEL` ou `BAREME`).

## Notes

- Le calcul de segments est déjà une fonction pure du domaine depuis STORY-574 : cette story le
  consomme, elle ne le réécrit pas.
