# STORY-426 : Le contrôle « résultat du CR = résultat au passif du Bilan » est une tautologie — le seul chiffre indépendant, la case `CJ`, n'est comparé à rien

Status: needs-po-decision

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan/bilan-engine.service.ts`
**Points :** 5 · **Sprint :** à slotter
**Origine :** maquette **FE-032** (compte de résultat N/N-1), 2026-08-27. Confronté au fichier
client réel `1000745307_2025_Definitif (1).xlsx` — une **DSF déposée**, feuille
*« Contôle de Cohérence »*.

---

## Le fait

`CompteResultatDto.coherenceResultat` porte le nom du contrôle nº 2 de la liasse déposée
(« *Contrôle Egalité Résultat Net Comptable au CR et au Passif du Bilan* »). Il n'en fait pas
le travail.

`bilan-engine.service.ts` :

```ts
const compteResultat = this.crProduction.produire(pkg, soldesN, soldesN1, surcharges);
const bilan          = this.production.produire(pkg, soldesN, soldesN1, surcharges);
const coherence      = this.coherenceResultat(bilan, compteResultat);
// ecart = compteResultat.resultatNetN − bilan.controle.resultatNetN
```

Les **deux** grandeurs sont produites dans le même appel, depuis les **mêmes** soldes, par la
**même** agrégation `Σ (crédit − débit)`. Le code le dit lui-même : « *ecart=0 **par
construction*** ». Le champ **prouve un invariant du moteur** ; il ne contrôle rien, et il ne
peut jamais rougir.

## Le chiffre indépendant existe, et il n'est publié nulle part

Le référentiel packagé rattache le **compte 13** au poste `CJ` :

```json
{ "etat": "BILAN_PASSIF", "poste": "CJ",
  "libelle": "Resultat net de l'exercice (+ benefice / - perte)",
  "regle": "SOLDE_CREDITEUR", "comptesSyscohada": ["13"], "role": "RESULTAT_BILAN" }
```

C'est **cette case** que la DSF contrôle. `emettrePassif` la produit — avec le solde du compte
13 **et rien d'autre** ; le résultat calculé n'entre que dans le contexte des **sous-totaux**
(`contexteDetailBilan`, placement `role='RESULTAT_BILAN'`). Personne ne compare les deux.

## Le cas ordinaire qui rend la faille visible — et il ne déséquilibre rien

Un dossier dont l'assemblée n'a pas encore **affecté** le résultat porte au compte 13 le
résultat de l'exercice **précédent**, pendant que les classes 6 et 7 portent celui de
l'exercice en cours.

| ce que l'écran montre | valeur | verdict |
|---|---|---|
| `controle.equilibre` | `true` | ✅ (une balance vérifie `A = P + R` par construction) |
| `coherenceSousTotaux.coherent` (`BZ = DZ`) | `true` | ✅ (le placement du résultat ferme la cascade) |
| `coherenceResultat.coherent` | `true` | ✅ (200 000 = 200 000) |
| **ligne `CJ` du passif** | **800 000** | ⛔ **c'est le résultat de l'an dernier** |
| résultat net du CR (`XI`) | 200 000 | — |

⚠️ **Trois voyants au vert et une case fausse.** Aucune valeur de `CJ` ne peut être juste tant
que le compte 13 n'est pas soldé : ni `800 000` (le compte seul), ni `1 000 000` (compte +
résultat placé) ne valent `200 000`. La liasse partirait au dépôt et **c'est l'OTR qui le
dirait**.

---

## ⛔ CORRECTION DU 2026-08-27 — le critère de la première rédaction était FAUX

> Question du PO : *« un compte 13 non soldé rend-il la liasse non validable, ou est-ce un simple
> avertissement ? »* — et la recommandation de départ était **« bloquant »**. En re-dérivant le
> critère, puis en ouvrant la **balance client réelle du dépôt**, les deux se sont révélés faux.

### ① L'écart `résultat CR − CJ` ne peut pas servir de critère : il est non nul dans les DEUX états normaux

Une balance au 31/12 existe dans **trois** états, et le premier réflexe — « CJ doit égaler le
résultat du CR » — n'en décrit **aucun** :

| état de la balance | comptes 6/7 | compte 13 | `résultat CR` | `CJ` | écart | verdict |
|---|---|---|---|---|---|---|
| **(a)** avant écritures de clôture | ouverts | 0 | 200 000 | 0 | **200 000** | ✅ **normal** — c'est l'état attendu pour produire la liasse |
| **(b)** après détermination du résultat | soldés | 200 000 | **0** | 200 000 | **−200 000** | ✅ **légitime** — mais le compte de résultat est **entièrement VIDE** *(→ STORY-432)* |
| **(c)** résultat antérieur non affecté | ouverts | 800 000 | 200 000 | 800 000 | 600 000 | ⚠️ **ambigu** |

⇒ Le critère de la première rédaction **rougirait sur (a)**, c'est-à-dire sur **toute balance
correctement préparée**. Un contrôle qui refuse le cas nominal n'est pas un contrôle, c'est une
panne.

### ② Et la co-occurrence — le critère de repli — est l'état d'une VRAIE balance client

`Balance_des_comptes.pdf` (**ETS RELAXED**, Sage 100 i7, exercice 2023, 51 comptes) porte
**simultanément** :

```
13100000  Résultat net de l'exercice        ← compte 13 alimenté
13110000  Résultat net de l'exercice        ← et un second sous-compte
12000000  Report à nouveau
60150000 … 66410000   (8 comptes de charges)  ← classes 6 et 7 OUVERTES
70110000              (1 compte de produits)
```

⇒ Le cas **(c)** n'est pas une anomalie de laboratoire : **c'est ce que Sage sort chez un client
ordinaire**. Bloquer dessus reviendrait à bloquer la quasi-totalité des dossiers d'un cabinet — et
à enseigner aux comptables à contourner le contrôle.

⚠️ Et le moteur **ne peut pas** trancher : distinguer « résultat de l'exercice précédent non
affecté » (à corriger) de « résultat déjà déterminé » (légitime) suppose de connaître **l'exercice
des soldes**, que le `dry-run` ne reçoit même pas (**STORY-430**). L'ambiguïté est structurelle.

---

## ✅ RECOMMANDATION RÉVISÉE — avertir au diagnostic, bloquer au dépôt, et sur la CO-OCCURRENCE

**Q1 — bloquant ou avertissement ? Les deux, mais pas au même endroit.**

- **Au `dry-run` : AVERTISSEMENT, jamais un blocage.** C'est l'écran qui *diagnostique* ; refuser
  de produire l'état priverait le comptable de ce qui lui dit quoi corriger. *(Cohérent avec
  FE-031 : pas de bouton « Valider » sur un dry-run.)*
- **À la validation d'une liasse persistée (STORY-063/064) : BLOQUANT.** À cet instant on est sur
  le point de **déposer**, et la case `CJ` ne peut pas porter deux résultats à la fois : le
  contrôle nº 2 de l'OTR échouera au guichet. Le coût du blocage est nul (l'affectation est une
  écriture ordinaire) ; le coût du non-blocage est un rejet de dépôt.

**Q1 bis — le critère : la CO-OCCURRENCE, pas l'écart.**
`solde(13) ≠ 0` **ET** `resultatNetCR ≠ 0`. Zéro faux positif sur (a) et (b) ; le seul cas visé
est celui où deux résultats coexistent.

**Q2 — `coherenceResultat` gagne des champs, il n'en change pas le sens.** *(inchangé)* Le champ
actuel prouve un invariant utile du moteur ; le renommer ferait mentir les tests de
STORY-060/063 qui l'attestent.

---

## Critères d'acceptation (révisés le 2026-08-27)

- [ ] AC-1 — `CompteResultatDto.coherenceResultat` et `BilanDto.controle` publient
      `resultatPorteAuPassif: number | null` = `montantN` du poste marqué `role='RESULTAT_BILAN'`.
      ⚠️ **`null` veut dire « le référentiel ne déclare pas ce poste »** ; un poste déclaré mais
      **non alimenté** vaut **`0`**. Les deux ne se confondent pas — c'est précisément la
      confusion qui rendait le critère d'origine faux.
- [ ] AC-2 — `etatBalance: 'AVANT_CLOTURE' | 'APRES_DETERMINATION' | 'RESULTAT_NON_AFFECTE'`,
      dérivé de la co-occurrence ci-dessus (`13 = 0` / `CR = 0` / les deux non nuls). Une seule
      grandeur à lire pour l'écran, une seule règle à tester.
- [ ] AC-3 — **Aucun refus au `dry-run`.** `etatBalance = 'RESULTAT_NON_AFFECTE'` est une
      **information**, pas une erreur : `200`, l'état est produit.
- [ ] AC-4 — À la **validation** (STORY-063) : `etatBalance = 'RESULTAT_NON_AFFECTE'` ⇒
      `422 LIASSE_NON_VALIDABLE`, motif `RESULTAT_NON_AFFECTE`. Le motif **nomme le compte**
      (13, avec son solde) et le **geste** (affecter le résultat de l'exercice précédent).
- [ ] AC-5 — Un référentiel sans poste `role='RESULTAT_BILAN'` ⇒ `resultatPorteAuPassif: null`,
      `etatBalance: null`, **non applicable, jamais « échec »** — patron `coherenceSig` / SFD-BCEAO.
- [ ] AC-6 — **Trois tests, un par état.** (a) balance sans compte 13 ⇒ `AVANT_CLOTURE`, aucun
      motif, **validable** ; (b) classes 6/7 soldées ⇒ `APRES_DETERMINATION`, **validable** ;
      (c) les deux non nuls ⇒ `RESULTAT_NON_AFFECTE`, `dry-run` en `200`, validation en `422`.
      **Le test (a) est le plus important : c'est celui que la première version aurait fait rougir.**

## Vigilance

- ⛔ **Ne pas « corriger » `emettrePassif` en y ajoutant le résultat.** `BZ = DZ` tient
  aujourd'hui *parce que* le placement se fait dans le contexte des sous-totaux et **là
  seulement**. L'ajouter aussi au poste de détail compterait le résultat deux fois dans `DZ`.
- ⚠️ La valeur reste en **unités mineures XOF**, comme tout le reste du contrat.
- ⚠️ Le rattachement est **par préfixe** : `13100000` et `13110000` tombent tous deux sur `CJ`
  (vérifié sur la table de passage). Le critère porte sur la **somme** du poste, pas sur un compte.

## Conséquences ailleurs

- **FE-032** (compte de résultat) et **FE-079** (ligne `CJ` au passif du Bilan) consomment ce
  champ. Sans lui, les deux écrans affichent un ✅ qui rassure à tort.
- **STORY-063** (contrôles d'articulation) est le point d'accroche naturel de Q1.
