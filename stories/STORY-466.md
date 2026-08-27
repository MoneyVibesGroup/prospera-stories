# STORY-466 : Ni le jeu d'états ni son snapshot ne nomment la balance dont ils sortent

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

*« Elle sort de quelle balance ? »* est la première question d'un réviseur devant une liasse.
Le produit ne sait pas y répondre.

`POST …/bilan/etats` reçoit un **tableau de `soldesN` bruts**, sans aucune référence à la balance
d'origine — `bilan-service` ne connaît **aucun `balanceId`** (écart déjà relevé par FE-028 sous le
ticket `TICKET-BACKEND-bilan-ne-reference-pas-sa-balance-source`, que cette story **régularise en
story**). Le snapshot fige donc les **soldes** — ce qui suffit à la reproductibilité — mais pas
l'**identité** de leur source.

Conséquence propre au cycle de vie, et invisible aujourd'hui : après une réouverture, la
**version 2 peut être arrêtée sur une balance différente de la version 1**, sans que l'historique
ni le journal ne le montrent. Deux versions « du même exercice » peuvent ne pas parler du même
arrêté.

## Critères d'acceptation

- [ ] AC-1 — `CreerJeuEtatsDto` et `RecalculerJeuEtatsDto` acceptent
      `source: { balanceId, version, checksum }` — **obligatoire** à terme, optionnel pendant la
      transition.
- [ ] AC-2 — Le jeu et **chaque snapshot** conservent cette source ; `JeuEtatsResponseDto` et
      `SnapshotSommaireDto` la publient.
- [ ] AC-3 — Le serveur **vérifie** que la balance citée existe, appartient au dossier et est
      **VALIDÉE** — aujourd'hui seul l'écran le fait (FE-028), c'est-à-dire personne.
- [ ] AC-4 — Deux versions d'un même jeu bâties sur des balances **différentes** sont **signalées**
      dans la liste des versions (drapeau, pas refus : c'est parfois légitime).
- [ ] AC-5 — Dépendance nommée : sans **STORY-134** (consommation de `balance.created`), la
      référence reste déclarative. La vérification d'AC-3 exige le read-model.

## Conséquences ailleurs

- Remplace le ticket ouvert par FE-028 (un écart sans numéro est invérifiable depuis une maquette —
  règle FE-046).
- La maquette FE-034 affiche « **non publiée** » dans la colonne *Balance source* de l'historique,
  plutôt qu'une valeur plausible : le snapshot n'en garde rien.
