# STORY-418 : La provenance d'un compte proposé est une phrase en français — l'écran ne peut ni la trier, ni la traduire

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/rattachement`
**Points :** 2 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046** (rattachement au plan comptable), à la revue « expert-comptable venant de Sage » demandée par le PO.

---

## Le fait, relevé à la source

`GET /dossiers/{id}/rattachement/proposition` rend trois champs, et trois seulement :

```ts
// surcharge-rattachement.dto.ts — PropositionRattachementDto
compte!: string;    // '706'
motif!: string;     // 'libellé de la ligne (« prestation »)'
surcharge!: boolean; // vrai si la proposition vient d'une règle de l'organisation
```

Or le moteur (`rattachement.regles.ts` + `cahiers-recettes.regles.ts`) connaît **quatre**
provenances bien distinctes, et il les écrit **en prose** :

| provenance | motif produit | ce que ça vaut pour le comptable |
|---|---|---|
| règle du dossier | `règle de l'organisation sur le libellé « … »` | **décidé par un humain**, tracé, daté — rien à relire |
| mot-clé du libellé | `libellé de la ligne (« vente »)` | plausible, **à confirmer** |
| activité de l'org | `activité de l'organisation (« service »)` | plus faible encore — la ligne, elle, ne disait rien |
| **défaut** | `aucun indice dans la ligne ni dans l'activité — défaut « ventes de marchandises »` | **ce n'est pas un choix** : `COMPTE_PAR_DEFAUT = '701'` |

`surcharge` sépare la première des trois autres. **Rien ne sépare les trois autres entre
elles** — sauf à faire de l'analyse de texte français sur `motif`.

---

## Ce que ça coûte, concrètement

Le quatrième cas est le seul qui compte, et c'est le seul qu'on ne peut pas isoler.

```ts
// cahiers-recettes.regles.ts
const COMPTE_PAR_DEFAUT = '701';
```

Une ligne dont le libellé ne dit rien au moteur (« Facture n° 12 », « Règlement »,
« Versement ») part en **701 Ventes de marchandises**. Pour une entreprise de services, c'est
faux ; pour un commerçant, c'est juste par coïncidence. Dans les deux cas :

- la ligne est **acceptée** (701 est bien de classe 7 et bien au plan) ;
- la balance produite est **parfaitement équilibrée** ;
- **le chiffre d'affaires est mal ventilé**, et rien ne l'indique.

⇒ Un écran qui veut dire « ces 14 lignes-là méritent un coup d'œil » doit aujourd'hui
**chercher une sous-chaîne française dans `motif`**. C'est fragile (un mot changé côté serveur
casse le tri sans casser un test), et c'est **intraduisible** : le front est i18n, le motif ne
l'est pas.

---

## Ce qui est demandé

Ajouter un champ **typé** à `PropositionRattachementDto`, à côté du motif (qui reste — c'est
lui qui rend la proposition contestable) :

```ts
@ApiProperty({ enum: ORIGINES_PROPOSITION, example: 'MOT_CLE' })
origine!: OriginePropositon; // 'REGLE' | 'MOT_CLE' | 'ACTIVITE' | 'DEFAUT'
```

1. **Enum OpenAPI**, pas une chaîne libre : un cas ajouté doit **casser la compilation** du
   client, pas tomber en silence (règle déjà posée par STORY-375).
2. `surcharge` **reste** — le retirer casserait les clients existants ; `origine === 'REGLE'`
   lui est équivalent et le rendra déprécié à terme.
3. La donnée existe déjà : `proposerRattachement` sait dans quelle branche il est. C'est un
   champ à **poser**, pas un calcul à écrire.
4. ⚠️ **Même exigence sur la pré-proposition des lots OCR** si elle porte le même motif
   (`LignePreProposeeDto`) — un écran ne doit pas avoir deux façons de lire la même idée.

---

## Critères d'acceptation

1. `GET …/rattachement/proposition` publie `origine`, typée en enum, sur les 4 branches.
2. Les 4 valeurs sont couvertes par des tests **qui rougissent** si une branche rend la
   mauvaise origine (mutable-testable, pas un simple `toBeDefined`).
3. `motif` est **inchangé** — aucun client existant ne casse.
4. OpenAPI régénéré ; l'enum apparaît dans les types générés du front.

---

## Notes

- Jumelle de **STORY-375** (les codes de refus deviennent un enum) : même patron, même raison —
  une information que le serveur possède, publiée sous une forme que le client doit deviner.
- Voir [[FE-046]] (maquette), `stories/STORY-085.md` (le moteur), `stories/STORY-394.md`
  (l'énumération du plan, qui a levé l'autre moitié du problème).
