# STORY-424 : Le compte de travail du cabinet (8 caractères) devient une donnée de premier rang, à côté du compte de plan

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/referentiel`, `modules/balance`, `modules/cahiers`
**Points :** 8 · **Sprint :** S20
**Origine :** **retour direct d'un expert-comptable**, transmis par le PO le **2026-08-26** : *« tous les comptes qui doivent être présents sur la plateforme doivent être sur 8 chiffres »*.

---

## ✅ ARBITRAGE PO DU 2026-08-26 — **VOIE B**

> **« Je prends la voie B. »**

**L'identité canonique d'une ligne de balance reste le compte de plan (≤ 6).** La liasse ne
bouge pas, `bilan-service` ne bouge pas, le contrat canonique (STORY-101) ne bouge pas.

**Ce qui change** : la plateforme cesse de *jeter* le compte du cabinet. Le compte à
**8 caractères** devient une donnée de premier rang — **accepté à la saisie**, **conservé**, et
**publié** à côté du compte de plan dont il dérive.

⚠️ **La voie B au sens strict (affichage seul) ne débloque pas FE-046** : sans acceptation à la
saisie, un comptable ne peut toujours pas écrire `44280002` dans une règle de rattachement ni
dans une catégorie de dépense. L'extension à la saisie faisait partie de la recommandation
présentée au PO avec la voie B ; elle est donc dans le périmètre. *(Si l'intention était
l'affichage seul, retirer les AC-3 et AC-4 et repasser à 5 points.)*

**Écartées :** la voie A (le compte de travail devient l'identité canonique) — trop invasive,
elle rouvre STORY-101 et `bilan-service` ; la voie C (`longueurCompteDetail: 8`) — **fausse** :
plus rien ne serait regroupé et la liasse recevrait des comptes que l'administration ne
reconnaît pas.

---

## Le fait, mesuré sur une balance cliente réelle

`Balance_des_comptes.pdf` — **ETS RELAXED**, Sage 100 Comptabilité i7 8.50, exercice 2023.

| relevé | valeur |
|---|---|
| comptes de la balance | **51** |
| comptes à **8 chiffres** | **51** — soit **100 %** |

Et « ramener au compte de plan » n'est pas neutre :

| ramené à 6 | comptes fondus | ce qui disparaît |
|---|---|---|
| `442800` | `44280001` **Droit d'enregistrement** + `44280002` **TH 2023** | deux impôts distincts, une seule ligne |
| `447800` | `44780000` + `44780001` + `44780002` | trois comptes, une seule ligne |

**5 comptes réduits à 2 sur une seule balance.**

---

## Ce qui est demandé

### ① Publier les comptes d'origine sur la ligne de balance

L'information **existe déjà** côté import Sage (`normalisation-comptes.ts`) : `Regroupement`
porte `compte`, `comptesSources` et `sourcesTotal`. Elle est rendue à l'appelant **au moment de
l'import**, puis perdue. Elle doit vivre **sur la ligne** :

```ts
// LigneBalanceApercuDto / la ligne canonique
@ApiProperty({ type: [String], description:
  'Comptes du plan de travail du cabinet (8 caractères) qui alimentent cette ligne. ' +
  'Vide quand le compte saisi est déjà un compte de plan.' })
comptesSources!: string[];
@ApiProperty({ description: 'Nombre exact de comptes sources, même si la liste est plafonnée.' })
sourcesTotal!: number;
```

⚠️ **Plafonner la liste, jamais le compteur** (patron déjà retenu par STORY-370) : une ligne
`411…` peut fondre des centaines d'auxiliaires ; `sourcesTotal` doit rester exact.

### ② Produire la même information sur le chemin **cahiers**

Aujourd'hui `comptesSources` n'existe que sur le chemin Sage. Une balance construite depuis les
cahiers doit porter le compte **tel que le comptable l'a saisi**, même quand il est ramené.

### ③ Accepter 8 caractères **à la saisie**

Les six portes gardées par `isCompteDeDetail` acceptent le compte du cabinet, **conservent le
compte saisi** et **dérivent** le compte de plan :

| porte | aujourd'hui | après |
|---|---|---|
| saisie de recette (`compteProduit`) | refus > 6 | accepté, `compteSaisi` conservé |
| saisie de dépense (`compteCharge`) | refus > 6 | idem |
| règle de rattachement (`surcharges`) | refus > 6 | idem |
| catégorie de dépense (`compteCharge`) | refus > 6 | idem |
| comptes de contrepartie | refus > 6 | idem |
| soumission de balance | refus > 6 | accepté, ramené + `comptesSources` |

⚠️ **La dérivation est celle qui existe déjà** — `normalisation-comptes.ts`, plus long préfixe
du plan. **Ne pas en écrire une seconde** : deux normalisations divergeraient, et l'écart ne se
verrait qu'à la liasse.

### ④ Ce qui ne change PAS, et il faut le tester

- Le **tag** et le **format** de la balance canonique (STORY-101) ;
- ce que reçoit `bilan-service` — la liasse continue de se déposer sur des comptes de plan ;
- l'invariant d'équilibre et les deux contrôles (STORY-147).

---

## Critères d'acceptation

1. `LigneBalanceApercuDto` publie `comptesSources` et `sourcesTotal`, sur les **trois**
   adaptateurs (cahiers, Sage, saisie directe).
2. Une balance importée dont deux comptes fondent rend les **deux** numéros d'origine sur la
   ligne — testé sur le cas réel `44280001` + `44280002` → `442800`.
3. Une recette saisie sur `70730000` est **acceptée**, et la ligne de balance produite porte
   `compte: '707300'` (ou le compte de plan dérivé) **et** `comptesSources: ['70730000']`.
4. Une règle de rattachement sur un compte à 8 caractères est **acceptée** et **s'applique** —
   c'est-à-dire que `estCompteDeDetail` cesse d'être la garde de saisie (elle reste celle de la
   **soumission au plan**).
5. `bilan-service` reçoit exactement ce qu'il recevait avant — testé par comparaison d'une
   balance produite avant/après.
6. Aucune seconde implémentation de la normalisation : un test d'architecture ou une revue le
   constate.
7. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚡ **La donnée décisive était déjà dans le dépôt** : `Balance_des_comptes.pdf` dormait à la
  racine de `MoneyVibes_Apps` et n'avait jamais été ouvert. Il a tranché la question de format
  en une commande. ⇒ **avant d'arbitrer un format métier, chercher un fichier client réel.**
- ⚠️ **Q3 reste ouverte et n'est pas bloquante** : `longueurCompteDetail` vit dans le
  **manifeste du service** alors que le commentaire de STORY-146 admet que sa place est dans
  **l'artefact**. Un cabinet à 8 et un autre à 6 sont deux paramétrages légitimes du même
  référentiel. À traiter quand un second cabinet le demandera, pas avant.
- Consommateur nommé : **FE-046**. Voir `stories/STORY-146.md`, `stories/STORY-172.md`,
  `stories/STORY-086.md`, `stories/STORY-370.md`, `stories/STORY-101.md`.
