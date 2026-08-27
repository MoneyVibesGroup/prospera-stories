# STORY-428 : Deux libellés pour le même poste dans le même paquet — un état déposé sort avec des lignes sans accents

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel + `scripts/referentiels`
**Points :** 2 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27.

---

## Le fait

Le service sert **deux sources de libellé différentes dans la même réponse** :

| ce qui est servi | d'où il vient | forme |
|---|---|---|
| poste de **détail** (`TA`, `RH`, `RI`…) | `cible.libelle` = **table de passage** | **sans accents** |
| **SIG** (`XA`…`XI`) | `libellesPostes()` = **`pkg.postes`** | **avec accents** |

`compte-resultat-production.service.ts` :

```ts
// détail  → accu.libelle = cible.libelle              (tableDePassage)
// SIG     → libelle: libelles.get(r.poste)            (pkg.postes)
```

Les deux versions cohabitent dans `syscohada-revise-2.1.json`, à quelques lignes l'une de
l'autre :

```
tableDePassage : "Achats de matieres et fournitures liees"   ← servi
pkg.postes     : "Achats de matières et fournitures liées"   ← existe, non servi
```

Un écran qui restitue la liasse mélange donc, **ligne à ligne**, « *Impots et taxes* »,
« *Services exterieurs* », « *Reprises d'amortissements, provisions et depreciations* » avec
des paliers correctement accentués (« *VALEUR AJOUTEE* » est en capitales sur le formulaire
officiel, ce n'est pas le même cas).

Sur un état **destiné au dépôt**, ce n'est pas un détail cosmétique.

## Le même défaut frappe le Bilan

`BILAN_ACTIF` / `BILAN_PASSIF` servent aussi le libellé de `tableDePassage` — donc
« *Resultat net de l'exercice (+ benefice / - perte)* ». Corriger seulement le compte de
résultat laisserait l'incohérence d'un état à l'autre.

---

## Critères d'acceptation

- [ ] AC-1 — Les libellés de `tableDePassage` du paquet `syscohada-revise@2.1` sont alignés sur
      les libellés officiels de `pkg.postes` (accents compris), pour **tous** les états.
- [ ] AC-2 — Un test de cohérence de paquet (famille `*-coherence.spec.ts`, déjà 6 fichiers)
      **échoue** si un `tableDePassage[].libelle` diffère du `pkg.postes[].libelle` du même code,
      à la ponctuation de fin près (les repères `A`/`B`/`C`/`D` en queue de libellé officiel).
- [ ] AC-3 — Aucun changement de code moteur : la correction est **une donnée**, pas une règle
      (invariant P7).
- [ ] AC-4 — Même vérification passée sur `sfd-bceao@2.0`, `cima-assurances@1.0` et
      `zone-franche-togo@1.0` ; les écarts constatés sont corrigés ou explicitement listés.

## Vigilance

- ⚠️ Le **checksum** du paquet change ⇒ le `stamp` (`EffectiveReferentielStamp`, FR-005 AC-3)
  change avec lui. Toute liasse déjà **enregistrée** portera l'ancien tampon : c'est le
  comportement voulu (traçabilité), mais il faut que la **version** du paquet bouge
  (`2.1` → `2.2`), sinon deux contenus différents partagent une version.
- ⚠️ Ne pas régénérer le paquet depuis `scripts/referentiels/sources/*.json` sans vérifier que
  la source elle-même est accentuée : le défaut peut y être né.

## Conséquences ailleurs

- **FE-032** affiche aujourd'hui le mélange **tel quel**, volontairement : maquiller un libellé
  côté écran ferait diverger l'affichage du contenu qui sera exporté (STORY-064/065).
