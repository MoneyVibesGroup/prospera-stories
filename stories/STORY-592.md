# STORY-592 : Instantané de liste, curseur et matérialisation par lot avec reprise

Status: ready-for-dev

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S43
**Prérequis :** **STORY-591** (liste) · **STORY-578** (file `masse`) · **STORY-579** (index d'idempotence)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-13, AR-19.

---

## Le fait

⛔ **Keystone du bloc 3, et son test appartient à la définition de terminé.** Ce qu'elle empêche : un
arrêt en plein lot qui rejoue jusqu'à **500 remises déjà faites** — chez de vrais destinataires, avec
de vrais SMS **facturés deux fois**.

⚡ **`EnvoiDeMasse` est un orchestrateur, pas un `Envoi`** (AD-1) : il produit N `Envoi`, il n'en est
pas un.

## Critères d'acceptation

- [ ] AC-1 — ⚡ **Instantané** : la préparation **fige l'appartenance de la liste**. L'exécution ne
      relit **jamais** la liste vivante. C'est ce qui rend la preuve possible — comparer le journal
      **à l'instantané**.
- [ ] AC-2 — ⚡ **Matérialisation par lot** : chaque lot écrit ses lignes `Envoi{prepare}` en
      `insertMany(ordered: false)` **avant toute remise à un canal**, sous l'index unique
      `(envoiDeMasseId, contactId, canal)`. **Rien n'est écrit d'avance pour la liste entière** — le
      profil de coût reste celui d'un curseur.
- [ ] AC-3 — ⛔ **Test de la définition de terminé** (NFR-2, AR-19) : interrompre en plein lot puis
      reprendre laisse **zéro destinataire non servi et zéro servi deux fois**, prouvé **en
      comptant** le journal contre l'instantané. Pas une recette, pas une inspection.
- [ ] AC-4 — Une reprise avant l'avancée du curseur rejoue l'`insertMany` : les doublons sont
      **rejetés par la base, jamais ré-envoyés**.
- [ ] AC-5 — ⛔ **Un `EnvoiDeMasse` n'a jamais deux exécutants concurrents** : le travail BullMQ porte
      l'identifiant de l'envoi de masse comme **clé de travail** (AD-18). Test avec deux exécutants
      lancés simultanément.
- [ ] AC-6 — L'exécution vit sur la file `masse` et **ne peut en aucun cas** être placée sur une file
      transactionnelle (STORY-578 AC-2).

## Notes

- Progression **observable** : NFR-3 ne fixe pas de cible de bout en bout pour la masse, mais exige
  qu'on puisse voir où en est le curseur.
