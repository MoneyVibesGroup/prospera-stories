# STORY-457 : `croissanceCaPct` s'applique au TOTAL DES PRODUITS, pas au chiffre d'affaires

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `projection/ancrage.ts` et `hypotheses/dto/hypotheses.dto.ts` sur `origin/dev`.

---

## Le fait

`extraireAncres` pose `produitsBase = compteResultat.totalProduitsN`, et son propre commentaire le dit
sans détour : *« `produitsBase` est le **total des produits**, pas le chiffre d'affaires au sens strict
(il inclut produits financiers, HAO, reprises) »*. Le moteur multiplie ensuite cette assiette par
`1 + croissanceCaPct/100`.

Le paramètre, lui, s'appelle **`croissanceCaPct`**, et le DTO le décrit *« Croissance du CA (%) »*.

Un comptable qui saisit « 8 % de croissance commerciale » fait donc croître de 8 % par an :
- les produits financiers,
- les produits HAO (une plus-value de cession, par nature non récurrente),
- **les reprises de provisions** — un produit qui n'a aucun rapport avec l'activité.

Sur le dossier de démonstration, `totalProduitsN` vaut **16 375 000** ; personne, dans le produit, ne
peut dire quelle part de ce montant est du chiffre d'affaires.

Le contrat de sortie est, lui, **honnête** : `CompteResultatPrevisionnel.produits` est nommé `produits`
et non `chiffreAffaires`, avec le commentaire *« le contrat ne doit pas promettre plus précis qu'il
n'est »*. L'incohérence est donc **entre l'entrée et la sortie** : on demande un taux de CA, on rend
des produits.

## Critères d'acceptation

- [ ] AC-1 — Le paquet référentiel gagne un **marqueur** `chiffreAffaires` sur le patron additif de
      `tresorerie?` / `role?` (STORY-061), de sorte qu'aucun code de poste (`TA`, `RA`…) n'entre dans
      le moteur — l'invariant P7 tient.
- [ ] AC-2 — `AncresProjection` publie `chiffreAffairesBase` **et** `chiffreAffairesAncre: boolean`,
      sur le patron exact de `tresorerieBase` / `tresorerieAncree`.
- [ ] AC-3 — Quand le marqueur est absent (SFD-BCEAO, CIMA), la croissance s'applique au total des
      produits comme aujourd'hui, et la réponse le **signale** — jamais en silence.
- [ ] AC-4 — Le paramètre est **renommé** ou son libellé corrigé : le DTO doit dire ce que le moteur
      fait. Renommer casse le contrat ⇒ arbitrage PO entre `croissanceProduitsPct` (juste) et le
      maintien du nom avec une description exacte.

## Conséquences ailleurs

- Bloque en pratique **STORY-458** : le minimum forfaitaire de perception est assis sur le **CA HT**,
  et le produit ne sait pas isoler le CA.
- La maquette FE-035 affiche l'avertissement sur la carte « La base du prévisionnel » et sur le champ
  lui-même — c'est le seul endroit où un utilisateur peut l'apprendre aujourd'hui.
