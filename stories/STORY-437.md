# STORY-437 : Onze numéros de note sur les trente-cinq de la liasse déposée, et aucun en dehors du Bilan actif — les renvois du compte de résultat ne mènent nulle part

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel (`postes[].note`, `notes[]`) + `scripts/referentiels`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx` (44 feuilles de notes).

---

## Le fait

```
notes déclarées par le paquet : 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17   → 11
postes qui portent un renvoi   : AD, AI, AP, AQ, BA, BB, BI, BJ, BQ, BR, BS, BU, BH
                                 → TOUS de `BILAN_ACTIF`
postes du BILAN_PASSIF avec note      : 0
postes du COMPTE_RESULTAT avec note   : 0
```

La DSF déposée compte **44 feuilles de notes pour 35 numéros** (`3A`, `3B`, `3C`, `3D`, `3E`,
`8A`, `15A/B`, `16A/B/Bbis/C`, `23-24`, `27A/B`). La « note 3 » du paquet en recouvre **cinq**
à elle seule.

⚡ **Et l'écran voisin affiche déjà les renvois manquants.** Le compte de résultat (FE-032)
imprime `21`, `22`, `23`, `24`, `25`, `26`, `27`, `28`, `29`, `30`, `3C&28`, `3D`, `6`, `12`
dans sa colonne « Note » — **relevés sur le formulaire, pas sur le contrat**. Un comptable qui
clique sur « note 27 » (charges de personnel) ne trouvera rien. C'est le manque que
**STORY-427 §③** avait relevé côté compte de résultat ; celle-ci en est la moitié *annexes*.

## Critères d'acceptation

- [ ] AC-1 — Les postes du `COMPTE_RESULTAT` et du `BILAN_PASSIF` du paquet
      `syscohada-revise@2.1` portent leur `note`, relevée sur le formulaire GUIDEF/DSF.
- [ ] AC-2 — `pkg.notes` déclare les **35 numéros** avec leur titre officiel et leur `mode`
      (`VENTILATION` quand le détail est dérivable de la balance, `TRAME` sinon).
- [ ] AC-3 — La **granularité des sous-notes** est portée : soit `note: '3A'` sur les postes,
      soit un champ `sousNotes: string[]` sur la `NoteMeta`. **À trancher à la rédaction** —
      mais pas à éluder : c'est la clé de navigation d'un réviseur.
- [ ] AC-4 — `NotesAnnexesProduit.notes` sort **ordonné par numéro de note du formulaire**, pas
      par ordre d'apparition des postes.
- [ ] AC-5 — Agnosticisme P7 : `sfd-bceao@2.0` continue de rendre `notes: []` /
      `statut: 'NON_APPLICABLE'`. Aucun titre, aucun numéro codé en dur dans le moteur — la
      règle « une note sans titre déclaré rend `libelle: null` » est **conservée**.
- [ ] AC-6 — Un test de couverture : tout poste de `BILAN_ACTIF`/`BILAN_PASSIF`/`COMPTE_RESULTAT`
      qui porte une `note` a une `NoteMeta` correspondante, et réciproquement — pas de renvoi orphelin.

## Conséquences ailleurs

- **FE-033** affiche « 11 notes produites sur les 35 de la liasse déposée » et
  « états d'origine couverts : 1 / 3 ». Sans cette story, l'onglet Notes annexes est **une annexe
  de l'actif**, pas les annexes de la liasse.
- **FE-032** : la colonne « Note » du compte de résultat devient enfin **servie** au lieu d'être
  relevée sur le formulaire (elle est déjà l'AC-3 de STORY-427 — les deux se recoupent, **les
  instruire ensemble**).
