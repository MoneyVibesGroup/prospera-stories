# STORY-523 : États annuels CIMA (art. 433) — une trentaine d'états, pas une liasse

Status: ready-for-dev

**Épic :** EPIC-134 — États annuels CIMA et marge de solvabilité
**Service :** `assurance-service` + `bilan-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-521** (les trois comptes de résultat)
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-10** de la spine.

---

## Le fait

L'article **433 du code CIMA** publie les **états modèles**. Ce n'est pas une liasse de quatre
états : c'est une **trentaine d'états annexes** (répartition des primes, sinistres par branche et
par exercice de survenance, placements, réassurance, engagements réglementés…). L'analyse du
2026-07-21 les a explicitement mis **hors amorce** : *« ventilation fine Vie/Non-Vie, variations de
provisions techniques poste à poste, états annexes C1..C25 → hors amorce, stories dédiées »*.

⛔ **C'est ici que l'écart de promesse se referme ou explose.** Un assureur à qui l'on vend « le
bilan CIMA » comprend **la liasse réglementaire**, c'est-à-dire ces états-là — pas un bilan et un
compte de résultat.

## ⛔ Jalon `format confirmé` — même garde qu'EPIC-032 et STORY-509

**Aucune ligne de code avant d'avoir les gabarits officiels en main.** Le programme a payé deux fois
pour l'avoir oublié (échéances d'acomptes, taux de RSL) : deux erreurs **plausibles**, donc
invisibles à la relecture.

## ✅ TRANCHÉ PAR LE PO — 2026-08-28 : **VOIE A**, le produit dépose

Doctrine posée par [[STORY-525]]. Cette story produit **les états déposables** de l'article 433, sur
le contrat commun de [[STORY-536]] et [[STORY-538]].

⚡ **Et la voie A répond au passage à Q1 (« combien d'états ? ») :** ce n'est plus un choix de
confort, c'est **ce que le dépôt exige**. Le sous-ensemble se déduit du gabarit officiel, pas de la
valeur perçue. ⇒ **Le jalon `format confirmé` devient la story elle-même** : tant que les gabarits
de l'art. 433 ne sont pas au dépôt, il n'y a rien à chiffrer.

⚠️ **13 points est donc une borne basse assumée**, pas une estimation : une trentaine d'états
réglementaires est un lot, et son chiffrage réel sort du jalon.

---

## Ce qui devait être tranché — conservé pour la traçabilité

**Q1 — Combien d'états, et lesquels ?** Une trentaine d'états annexes n'est pas une story de 13
points : c'est un lot. ⇒ **Choisir un sous-ensemble par la valeur** (ceux qu'un contrôle demande en
premier), le livrer complet, et **dire lesquels ne sont pas produits** — plutôt que de tous les
esquisser.

⚠️ **Cette question a la même forme que Q1 de STORY-509 et de STORY-525** : le produit doit adopter
**une seule doctrine de dépôt**, pas trois selon le vertical.

## Critères d'acceptation *(applicables une fois Q1 tranchée)*

- [ ] AC-1 — Chaque état produit est **sourcé** (article, gabarit, version) et porte sa référence.
- [ ] AC-2 — Les états sont produits **depuis la liasse et les agrégats déjà calculés**, jamais
      recalculés en parallèle. Deux moteurs sur le même nombre divergeraient en silence.
- [ ] AC-3 — ⛔ **Les états NON produits sont nommés à l'écran**, avec leur code d'état — jamais
      omis. Un assureur doit savoir ce qu'il devra produire ailleurs. Doctrine FE-073, transposée.
- [ ] AC-4 — Un état non applicable (assureur mono-activité) rend `NON_APPLICABLE`, **visible et
      expliqué**, jamais masqué (STORY-521 AC-5).

## Notes

- Voir [[STORY-509]] et [[STORY-525]] (la même question de doctrine), [[STORY-521]], [[STORY-524]].
