# STORY-598 : Console d'exploitation bornée à quatre actions, et le fournisseur de candidats de l'assistant

Status: ready-for-dev

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-594** (envoi de masse suspendable) · **STORY-586** (fenêtre de rejeu de 90 jours)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-19.

---

## Le fait

⚡ **Bornée à quatre actions, et la borne est la fonctionnalité** : file d'attente, échecs et motifs,
rejeu d'un envoi échoué, suspension d'un envoi de masse (FR-N55). Une cinquième action ferait de la
console un **second chemin d'écriture** sur des objets qui ont déjà le leur.

## Critères d'acceptation

- [ ] AC-1 — Console sur `admin-panel`, **exactement quatre actions**, énumérées. Un test de contrat
      refuse toute route supplémentaire.
- [ ] AC-2 — ⚠️ **Le rejeu est borné à 90 jours (STORY-586 AC-4) et la console l'annonce.** Au-delà,
      les variables ont été retirées et le message ne peut plus être rendu — erreur nommée
      `FENETRE_REJEU_EXPIREE`. *Une action grisée sans motif serait lue comme une panne.*
- [ ] AC-3 — ⛔ Les secrets de passerelle ne sont **jamais restitués** en lecture, ni journalisés, ni
      renvoyés par l'API (FR-N56, NFR-7). **La console est le dernier endroit où la tentation
      existe** — un test le vérifie sur la réponse réelle, pas sur le DTO.
- [ ] AC-4 — ⚡ **Fournisseur de candidats** pour le moteur de règles de l'assistant (FR-N56b,
      `FR-IA03b`) : envois échoués non rejoués, destinataires dont **tous** les canaux échouent,
      modèles en attente d'approbation, envois de masse préparés jamais exécutés.
- [ ] AC-5 — ⛔ Il **propose** des candidats ; **il ne déclenche aucune automatisation** (AD-19). Un
      test refuse tout chemin d'exécution depuis ce fournisseur.

## Notes

🏁 Clôt EPIC-060, le **bloc 3**, et le **Module 1** — hors EPIC-063 et EPIC-064, dont le déclencheur
est la signature du premier contrat de passerelle.

⚠️ **Une exigence reste partielle** : FR-N47 exige un moyen de désabonnement **adapté au canal**.
STORY-583 le livre pour l'e-mail et l'in-app ; sur les canaux où le refus arrive comme un message
entrant, il exige l'interception d'EPIC-064. **Les deux ne se séparent pas.**
