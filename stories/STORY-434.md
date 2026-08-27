# STORY-434 : Le TFT bâti sur les variations NETTES double-compte les dotations et les valeurs de cession — l'écart d'articulation vaut exactement `RL + RO`, et il est systématique

Status: needs-po-decision

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/tft-production.service.ts`, `etats/bilan.types.ts`, `etats/evaluateur-formule.*`, paquet référentiel
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuilles *« TFT »* et *« TABLEAU immo note 3A »*.

---

## Le fait — l'écart n'est pas un aléa, c'est une identité

`FF`…`FI` estiment les flux d'investissement par la **variation du NET** des postes d'actif :

```json
{"poste":"FG","operandes":[{"poste":"AI","signe":"-","mode":"VARIATION","etatSource":"BILAN_ACTIF"}],"statutTft":"ESTIME"}
```

Or `contexteMultiEtats` pose `BILAN_ACTIF|AI` = **`netN`**. Et
`net = brut − acquisitions… − dotations − VNC des cessions`. Les dotations et la valeur
comptable des cessions sont donc **dans** la variation nette — et la **CAFG** (`FA`) vient
précisément de les **rajouter** (`+RL`, `+RO`). Elles comptent deux fois.

**Démonstration, sur le jeu de la maquette FE-033** (chiffres produits en rejouant les
opérandes du paquet, pas écrits à la main) :

| | valeur |
|---|---|
| `ZG` — variation reconstituée par les flux | **1 055 000** |
| variation de trésorerie du Bilan (`BT − DT`, N vs N-1) | **150 000** |
| **écart** | **905 000** |
| dont dotations de l'exercice (`RL`) | 860 000 |
| dont valeur comptable des cessions (`RO`) | 45 000 |

`905 000 = RL + RO`, **au franc près**. Et avec les mouvements **bruts** (525 000
d'acquisitions corporelles, 300 000 de prix de cession — c'est-à-dire la **note 3A**),
`ZC` vaudrait −225 000, `ZG` **150 000**, et **l'écart tombe à zéro**.

⚡ **Ce n'est donc pas « un écart légitime dû aux lignes estimées »**, comme le commentaire du
service le suggère : c'est un **biais structurel**, présent dès qu'il y a une dotation aux
amortissements — c'est-à-dire sur **toute** entité qui possède une immobilisation.

## Deux symptômes visibles du même défaut

1. **Trois lignes portent un montant de sens contraire à leur libellé.**
   « `FO` **+ Emprunts** » vaut **−200 000** (l'emprunt a été remboursé) pendant que
   « `FQ` **− Remboursements** » reste vide ; « `FF` **− Décaissements** » vaut **+80 000** ;
   « `FL` **+ Subventions reçues** » vaut **−30 000** (c'est la *reprise* annuelle). Sur un état
   **déposé**, un remboursement rangé sous « + Emprunts » est une **ligne fausse**.
2. **Le brut ne franchit pas la frontière du moteur.** `PosteActif` publie `brutN`, `amortN`,
   `netN`, `netN1` — **mais ni `brutN1` ni `amortN1`**, et l'évaluateur ne voit que `netN`.
   La variation brute n'est donc **pas calculable aujourd'hui**, même en le voulant.

## Ce qu'il faut trancher (PO)

- **Voie A — publier le brut et l'amortissement N-1**, ajouter un `etatSource: 'BILAN_ACTIF_BRUT'`
  (ou un mode `VARIATION_BRUT`), et corriger les opérandes `FF`/`FG`/`FH` du paquet. Le TFT
  reconcilie alors **au franc près** dès qu'il n'y a ni cession ni virement de poste à poste.
- **Voie B — brancher la note 3A** (mouvements bruts réels : acquisitions, cessions, virements),
  qui est la source **exacte** — mais qui n'est **pas dérivable d'une balance** (STORY-436/FE-080).
- **Voie C — statu quo assumé** : garder l'estimation et rendre l'écart **explicite et décomposé**
  à l'écran (ce que la maquette fait déjà), en acceptant que le TFT ne soit **pas déposable en l'état**.

⚠️ **Ne pas choisir est un choix** : aujourd'hui le produit publie un TFT faux de 604 % avec
`valide: true`.

## Critères d'acceptation (voie A, à confirmer)

- [ ] AC-1 — `PosteActif` porte `brutN1` et `amortN1` (`null` si le jeu N-1 n'est pas produit).
- [ ] AC-2 — L'évaluateur résout un opérande `mode: 'VARIATION_BRUT'` sur `BILAN_ACTIF`.
- [ ] AC-3 — `FF`/`FG`/`FH` du paquet `syscohada-revise@2.1` passent en `VARIATION_BRUT`, et
      `FI` reste `+TN` (prix de cession, déjà juste). Leur `statutTft` passe de `ESTIME` à
      `CALCULE` **seulement** en l'absence de virement de poste à poste — sinon il reste `ESTIME`.
- [ ] AC-4 — Un test d'articulation : sur un jeu sans virement, `ZG === variationBilan` **et**
      `ZH === tresorerieClotureN`, `ecart === 0`. Le test échoue si quelqu'un remet `netN`.
- [ ] AC-5 — Le jeu de la maquette FE-033 devient un **cas de test versionné** : `ZG` doit passer
      de 1 055 000 à 150 000, et l'écart de 905 000 à 0.
- [ ] AC-6 — Agnosticisme P7 : `sfd-bceao@2.0` traverse sans effet (aucune opérande TFT).

## Conséquences ailleurs

- **STORY-438** est la **même racine** côté notes annexes (les notes 3/6/7 totalisent du net
  sous des colonnes en brut) : les instruire ensemble, ou l'une résoudra la moitié du problème.
- **STORY-439** (contrôle note ↔ poste) devient calculable seulement après celle-ci.
- Le commentaire de `tft.types.ts` — « *`ecart = 0` par construction* » — est **périmé depuis
  STORY-113** et doit disparaître dans la foulée : il décrit le TFT du temps où ce n'était qu'un
  squelette, et il enseigne exactement la mauvaise règle (celle de `coherenceResultat`).
