# STORY-538 : Transmission, accusé — et REJET : l'état que le produit ne connaît pas et qui coûte 40 %

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-446** (état `DEPOSE` + accusé — **existante, non livrée**) · **STORY-536**
**Origine :** arbitrage PO du 2026-08-28 — voie A.

---

## Le fait

Le cycle de vie servi par `bilan-service` s'arrête à **VALIDE**, c'est-à-dire **figée dans
Prospera**. La voie A ajoute trois états que le produit ne connaît pas, et **le troisième est celui
qu'on oublie** :

```
FIGEE  →  TRANSMISE  →  ACCEPTEE (accusé)
                     ↘  REJETEE  (motif, et l'échéance continue de courir)
```

⛔ **Un rejet non traité est une échéance manquée.** Au Togo, une échéance manquée coûte **40 %** —
et c'est précisément le contraste que STORY-413 avait déjà relevé : *le produit est précis sur ce
qui se rattrape et muet sur ce qui ne se rattrape pas*.

⚡ Et c'est le seul état qui **ne dépend pas du cabinet** : il arrive de l'administration, à un
moment que personne ne choisit.

## Critères d'acceptation

- [ ] AC-1 — Le cycle de vie porte `TRANSMISE`, `ACCEPTEE`, `REJETEE`, en plus des états existants.
      Chaque transition est **horodatée, attribuée et append-only** : un dépôt ne se réécrit pas.
- [ ] AC-2 — Un dépôt cite **la version figée** qu'il a transmise **et son empreinte** (STORY-452).
      On dépose **une** version, pas « la liasse ».
- [ ] AC-3 — Un **rejet** porte son **motif** tel que l'administration le rend, **non reformulé**.
      ⚠️ Un motif traduit ou résumé fait perdre le vocabulaire exact que le cabinet devra citer au
      guichet.
- [ ] AC-4 — ⛔ **Un rejet ne clôt rien** : l'échéance reste ouverte, le retard continue de se
      compter, et l'écran le dit. C'est l'inverse du réflexe — un état terminal se lit « c'est fini ».
- [ ] AC-5 — Une **retransmission** après rejet crée un **nouveau dépôt** lié au précédent, et
      conserve les deux. Le rejet fait partie du dossier de contrôle.
- [ ] AC-6 — ⚠️ **La transmission elle-même est optionnelle et déclarée par le paquet** : tous les
      canaux ne sont pas automatisables. Un canal `physique` produit le fichier et **enregistre un
      dépôt déclaré par l'utilisateur** — le cycle de vie est le même, l'automatisation non.
- [ ] AC-7 — Aucun secret d'authentification à un téléservice n'est stocké en clair. ⚠️ C'est
      exactement la condition bloquante C8 déjà rencontrée par `notification-service` : **la
      nommer ici évite de la redécouvrir au moment de brancher le premier téléservice.**

## Notes

- Voir [[STORY-446]] (le blocage réel de FE-081), [[STORY-452]], [[STORY-453]], [[STORY-413]],
  [[STORY-539]], [[FE-081]].
