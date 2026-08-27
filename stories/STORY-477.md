# STORY-477 : Deux jeux d'hypothèses aux neuf paramètres identiques sont comparés sans un mot

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en cochant, dans le sélecteur de la maquette, le jeu « Optismiste 2026 » — la faute de frappe que FE-035 a montrée indéboulonnable.

---

## Le fait

`ComparaisonQueryDto` porte une garde `IdsDupliquesConstraint` : elle refuse deux fois le **même
identifiant**. Elle ne regarde **jamais les valeurs**.

Le dossier de démonstration porte « Optimiste 2026 » et « Optismiste 2026 » — deux jeux distincts, aux
**neuf paramètres identiques**, nés de la faute de frappe que **STORY-464** a établie comme
indéboulonnable (ni suppression, ni renommage). Les comparer rend **tous les écarts à 0** et superpose
deux courbes, sans un mot.

Ce n'est pas un cas de laboratoire : c'est la conséquence mécanique de l'absence de duplication
(**STORY-466**) — l'utilisateur ressaisit à la main, et une ressaisie produit tôt ou tard un doublon.

## Critères d'acceptation

- [ ] AC-1 — La réponse porte `doublons: [{ hypothesesIds: string[] }]` — les groupes de scénarios dont
      les neuf paramètres sont **strictement égaux**. Comparaison sur les valeurs, pas sur un hachage
      d'objet dont l'ordre des clés varierait.
- [ ] AC-2 — Ce n'est **pas** un refus : comparer un scénario avec sa copie est un usage légitime
      (vérifier qu'une ressaisie est fidèle). Le contrat le **signale**, il ne l'interdit pas.
- [ ] AC-3 — Test : deux jeux aux mêmes valeurs ⇒ `doublons` non vide et tous les écarts nuls.
