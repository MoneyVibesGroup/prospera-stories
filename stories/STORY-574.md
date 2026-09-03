# STORY-574 : Modèle de message versionné et multilingue, figé sur l'envoi

Status: ready-for-dev

**Épic :** EPIC-055 — Modèles versionnés, multilingues, et un rendu qui n'exécute rien
**Service :** `notification-service` (nouveau)
**Points :** 5 · **Sprint :** S41
**Prérequis :** **STORY-572** (gate — le droit « rédiger un modèle »)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-9, AR-11.

---

## Le fait

⚡ **La langue est un attribut du couple (modèle, canal), jamais du seul modèle.** Une langue à
caractères non latins bascule le SMS en **UCS-2** : **70 caractères par segment au lieu de 160** — ce
qui change le **coût** et le **point de troncature**. Porter la langue sur le modèle seul rend le
calcul de segments juste sur un canal et faux sur l'autre, sans que rien ne casse.

⚡ **Figement.** La résolution a lieu **à la préparation de l'`Envoi`** et la version résolue est
figée sur lui. Une publication ultérieure ne touche aucun envoi déjà préparé — sinon le journal se
réécrit a posteriori.

## Critères d'acceptation

- [ ] AC-1 — Un `Modele` porte une clé, un canal, une langue, un objet (si le canal en a un) et un
      corps à variables **déclarées et typées**.
- [ ] AC-2 — Les versions sont **immuables une fois utilisées** : modifier **crée une version**, n'en
      réécrit jamais une. Un test de mutation prouve qu'un `update` sur une version employée échoue.
- [ ] AC-3 — ⚡ La langue est portée par le couple `(modèle, canal)`. Un test couvre le cas qui le
      justifie : le **même modèle**, en français et dans une langue non latine, sur le canal SMS,
      donne **deux comptes de segments différents**.
- [ ] AC-4 — AR-11 : le calcul de segments **GSM-7 / UCS-2** est une **fonction pure du domaine**,
      testable sans infrastructure, et **annonçable avant le choix du canal** (FR-N14).
- [ ] AC-5 — ⚡ **Figement** : `modele@version` est écrit sur l'`Envoi` à sa préparation. Publier une
      nouvelle version **ne modifie aucun envoi déjà préparé** — prouvé par un test qui prépare,
      publie, puis relit.
- [ ] AC-6 — FR-N13 : **ajouter une langue est une donnée, pas un développement.** Un test l'atteste
      en ajoutant une troisième langue sans toucher au code — sinon la troisième arrivera par une
      énumération en dur.

## Notes

- `Cout` n'est pas introduit ici : cette story produit le **nombre de segments**, le tarif et la
  devise viennent des capacités du canal (STORY-577) et le montant est figé sur l'`Envoi`
  (STORY-579).
