# STORY-588 : Consumers du bus et correspondance événement → modèle, configurable par organisation

Status: ready-for-dev

**Épic :** EPIC-058 — Le service devient l'organe de parole unique
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S42
**Prérequis :** **STORY-579** (envoi unitaire et sa clé d'idempotence) · **STORY-576** (résolution de modèle)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-2, AR-05.

---

## Le fait

⚡ **C'est cette story qui justifie rétrospectivement la clé d'idempotence étendue de STORY-579.** La
correspondance étant configurable par organisation, `kyc.status.changed` déclenche légitimement
**deux** envois — le dirigeant par e-mail, le gestionnaire de compte en in-app. Une clé réduite à
`(orgId, eventId, canal)` avalerait le second **en silence**. Le `regleDeclenchementId` de la clé naît
ici.

## Critères d'acceptation

- [ ] AC-1 — Consumers sur `identity.*`, `kyc.status.changed`, `entitlement.changed`, `document.*`,
      `paiement.*`. Démarrage **dégradé** si un topic est absent : le processus reste vivant, HTTP
      répond, le consumer rejoint plus tard (patron `dossier-service`).
- [ ] AC-2 — La correspondance **événement → modèle** est une **règle de déclenchement** configurable
      par organisation (FR-N24), portant un identifiant stable — celui qui entre dans la clé
      d'idempotence.
- [ ] AC-3 — ⚡ Un événement déclenchant **deux règles** produit **deux `Envoi`**, aucun avalé.
      Test explicite avec `kyc.status.changed` sur deux destinataires et deux canaux.
- [ ] AC-4 — La `cleIdempotence` vient de l'`eventId` du bus quand l'entrée est un événement.
      Rejouer l'événement ne produit rien de plus (STORY-579 AC-4 rejoué sur le chemin bus).
- [ ] AC-5 — ⛔ **Aucun de ces événements ne porte de secret.** Un test de contrat le vérifie sur les
      schémas consommés : c'est le discriminant d'AD-2, et il porte sur le **contenu**, jamais sur
      l'appelant.

## Notes

- Un poison-pill sur un de ces topics tue le consumer sans tuer le conteneur : la leçon
  `document-service` s'applique — un consommateur peut mourir dans un conteneur `healthy`.
