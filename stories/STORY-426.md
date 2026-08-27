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

## ⚠️ Décision PO demandée avant de coder

Le contrôle est **faisable** — mais son verdict n'est pas une question de produit :

**Q1.** Un compte 13 non soldé rend-il la liasse **non validable** (nouveau motif dans la
batterie bloquante de STORY-063, à côté d'`EQUILIBRE_BILAN`, `COHERENCE_RESULTAT`,
`VARIATION_TRESORERIE`, `ARTICULATION_NOTES`) — ou est-ce un **avertissement** ?
*Recommandation : **bloquant**. L'administration refusera la liasse ; laisser passer, c'est
déplacer le refus au guichet.*

**Q2.** `coherenceResultat` doit-il **changer de sens** (comparer le CR à `CJ`) ou **gagner un
second couple de champs** ? *Recommandation : **second couple**. Le champ actuel prouve un
invariant utile du moteur ; le renommer ferait mentir les tests de STORY-060/063 qui l'attestent.*

---

## Critères d'acceptation

- [ ] AC-1 — `CompteResultatDto.coherenceResultat` gagne `resultatPorteAuPassif: number | null`
      (= `montantN` du poste marqué `role='RESULTAT_BILAN'`, `null` si le référentiel n'en
      déclare aucun) et `ecartAuPassif: number | null`.
- [ ] AC-2 — `BilanDto.controle` publie la même valeur, sous le même nom, pour que les deux
      états racontent la même chose (un seul endroit où le nombre est calculé).
- [ ] AC-3 — `ecartAuPassif ≠ 0` ⇒ selon Q1, `LIASSE_NON_VALIDABLE` avec le motif
      `RESULTAT_NON_AFFECTE`, ou drapeau non bloquant. Le motif **nomme le compte** (13) et le
      **geste** (affecter le résultat de l'exercice précédent).
- [ ] AC-4 — Un référentiel sans poste `role='RESULTAT_BILAN'` rend `null` / `coherent: true`
      (**non applicable**, jamais « échec ») — même patron que `coherenceSig` pour SFD-BCEAO.
- [ ] AC-5 — Test sur une balance à compte 13 non soldé : `equilibre: true`,
      `coherenceSousTotaux.coherent: true`, `coherenceResultat.coherent: true`, **et**
      `ecartAuPassif = 600 000`. C'est la preuve que le nouveau champ voit ce qu'aucun des trois
      autres ne voit.

## Vigilance

- ⛔ **Ne pas « corriger » `emettrePassif` en y ajoutant le résultat.** `BZ = DZ` tient
  aujourd'hui *parce que* le placement se fait dans le contexte des sous-totaux et **là
  seulement**. L'ajouter aussi au poste de détail compterait le résultat deux fois dans `DZ`.
- ⚠️ La valeur reste en **unités mineures XOF**, comme tout le reste du contrat.

## Conséquences ailleurs

- **FE-032** (compte de résultat) et **FE-079** (ligne `CJ` au passif du Bilan) consomment ce
  champ. Sans lui, les deux écrans affichent un ✅ qui rassure à tort.
- **STORY-063** (contrôles d'articulation) est le point d'accroche naturel de Q1.
