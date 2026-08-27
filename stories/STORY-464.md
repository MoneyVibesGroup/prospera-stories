# STORY-464 : Un jeu d'hypothèses ne se supprime pas et ne se renomme pas — et son nom, saisi à la main, est confisqué pour toujours

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `JeuHypothesesController` : POST / GET / GET :id / GET :id/versions / GET :id/versions/:v / PUT :id. Rien d'autre.

---

## Le fait

`JeuHypothesesController` n'expose **ni `DELETE`, ni renommage** : `EditerHypothesesDto` ne contient
qu'un objet `hypotheses`, jamais le `nom`. Et l'index unique porte sur `(tenantId, dossierId, nom)`,
donc sur un **libellé saisi à la main**.

Conséquence, quotidienne en cabinet : « Optismiste 2026 » créé sur une faute de frappe reste dans la
liste du dossier **pour toujours**, et **confisque son nom** — recréer le jeu correctement exige d'en
choisir un autre. Le refus est en outre muet sur le coupable : il vient d'un `E11000` traduit en
`409 HYPOTHESES_EXISTE`, qui **ne nomme pas** le jeu en conflit.

C'est la **deuxième occurrence** du même angle mort après **STORY-454** (un brouillon de liasse créé par
erreur ne s'annule pas). Le patron se répète : un objet métier créé par un geste d'écran n'a aucun
geste d'annulation.

## Critères d'acceptation

- [ ] AC-1 — `DELETE /dossiers/:dossierId/bilan/hypotheses/:id` — supprime le jeu **et** ses versions,
      dans une transaction (deux collections écrites).
- [ ] AC-2 — La suppression est **refusée** (409) si une version du jeu a servi à un export figé —
      dès que **STORY-073** journalise le triplet de reproductibilité, cette condition devient
      vérifiable. Tant qu'elle ne l'est pas, la suppression est autorisée et l'écran le dit.
- [ ] AC-3 — `PATCH …/:id` (ou l'extension de `PUT`) accepte un `nom` ; l'unicité est re-vérifiée et le
      `E11000` reste traduit en 409.
- [ ] AC-4 — Le 409 de nom pris **nomme** le jeu en conflit (`conflitAvec: { id, nom }`) — un refus qui
      oblige l'écran à retrouver le coupable dans sa propre liste est un refus incomplet.
- [ ] AC-5 — Rôle : suppression réservée au `TENANT_ADMIN` (voir **STORY-470**).

## Conséquences ailleurs

- Même famille que **STORY-454**. À traiter d'un même mouvement si le PO le souhaite : le patron
  « créer sans pouvoir annuler » est un défaut de module, pas d'agrégat.
