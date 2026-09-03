# STORY-576 : Résolution en chaîne plateforme puis organisation, et déclaration des variables

Status: ready-for-dev

**Épic :** EPIC-055 — Modèles versionnés, multilingues, et un rendu qui n'exécute rien 🏁
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-574** (modèle versionné) · **STORY-575** (rendu par substitution)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-8, AD-9.

---

## Le fait

⚡ **Une seule copie du socle, portée par `orgId = null`.** La résolution cherche
`Modele(orgId, cle, canal, langue)` puis retombe sur `Modele(null, cle, canal, langue)`.

**Copier le socle au moment de la surcharge est le défaut symétrique, et c'est le plus tentant à
implémenter** : une correction du socle — une faute, une mention légale manquante — n'atteindrait
alors **jamais** les organisations qui ont surchargé, et rien ne le signalerait.

## Critères d'acceptation

- [ ] AC-1 — Prospera livre un **socle de modèles système** porté par `orgId = null`. Une
      organisation surcharge **sans altérer** le socle des autres (FR-N11).
- [ ] AC-2 — ⛔ **La surcharge ne copie pas le socle.** Un test le prouve dans le sens qui compte :
      corriger un modèle socle **atteint** une organisation qui a surchargé un **autre** modèle, et
      **n'atteint pas** celle qui a surchargé **celui-là**.
- [ ] AC-3 — La chaîne de résolution est testée sur ses quatre issues : surcharge trouvée · socle
      trouvé · langue absente · modèle absent (`MODELE_INTROUVABLE`).
- [ ] AC-4 — ⚡ Le modèle **déclare** ses variables et leur type. Une variable manquante ou mal typée
      à l'envoi est un **refus nommé** — `VARIABLE_MANQUANTE`, `VARIABLE_MAL_TYPEE` — **jamais** un
      trou dans le message ni la chaîne `undefined` chez un client.
- [ ] AC-5 — Le refus survient **avant** toute écriture d'`Envoi` et avant toute remise : aucun quota
      consommé, aucun coût, aucune ligne au journal pour un modèle qu'on a refusé de rendre.

## Notes

🏁 Clôt EPIC-055.

- C'est le seul endroit du bloc où un défaut se voit **chez le destinataire** et pas dans les
  journaux : un `undefined` dans un message part et ne revient pas.
