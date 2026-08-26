# STORY-422 : La balance est étiquetée du référentiel du DOSSIER, mais ses comptes sont validés contre celui de l'ORGANISATION

Status: needs-po-decision

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/referentiel`, `modules/cahiers/agregation`, `modules/read-models`
**Points :** — *(à chiffrer après arbitrage)* · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046**. ⚡ **Écart qui n'existe qu'à la maquette** — il naît de la **jonction de deux stories justes**, mises côte à côte sur un même écran. Ni la revue de l'une, ni celle de l'autre ne pouvait le voir.

---

## Les deux moitiés, chacune correcte

### ① Le **tag** de la balance vient des AXES DU DOSSIER (STORY-303)

```ts
// agregation.service.ts
// ⚡ **STORY-303 — le tag vient des axes DU DOSSIER**, à la date de l'exercice agrégé.
// Il venait du profil, UNIQUE PAR ORGANISATION : la balance d'un client était taguée du
// système comptable du CABINET, ou refusée parce que le cabinet n'en avait pas.
this.axes.resoudre(orgId, dossierId, exercice.debut),
…
const systemeComptable = this.exigerReferentiel(axesAvecRepli(axes, profil).systemeComptable);
// → 'SN' | 'SMT' | 'SFD-BCEAO' | 'CIMA'
```

C'est **la bonne correction** : un cabinet tient des dossiers de natures différentes.

### ② Le **plan de comptes** qui valide chaque compte vient de l'ORGANISATION (STORY-078 / 394)

```ts
// agregation.service.ts
private async chargerReferentiel(orgId: string) …          // ⬅ orgId SEUL

// referentiel.service.ts — planComptes(organizationId, filtre)
// referentiel.controller.ts
return this.referentielService.planComptes(user.tenantId ?? '', …);
```

Et le contrat le déclare comme une **garantie de sécurité**, ce qu'elle est :

> *« Aucun champ `referentiel` : le plan lu est **toujours** celui de l'organisation appelante
> (read-model d'entitlement), jamais un paramètre — laisser l'appelant le choisir permettrait
> de lire le plan d'un référentiel auquel l'organisation n'a pas droit. »*

---

## Ce que la jonction produit

**Rien ne force les deux à concorder.** Conséquences vérifiables :

1. Un dossier dont l'axe `systemeComptable` vaut **`SMT`** produit une balance **taguée `SMT`**
   dont **tous les comptes ont été contrôlés contre `syscohada-revise@2.1` (SN)** — le
   référentiel de l'organisation. Le tag dit une chose, la validation en a fait une autre.
2. Le tag `SMT` pointe sur `smt-togo@1.0`, **déclaré non packagé** (D-078-3, refus explicite
   `REFERENTIEL_NON_PACKAGE`). Une balance porte donc un tag que **rien ne peut résoudre en
   aval** — alors qu'elle a été construite sans erreur.
3. **Côté écran, la conséquence est immédiate et visible** : la liste de comptes de
   `GET /referentiels/plan-comptes` (STORY-394) est **la même pour tous les dossiers du
   cabinet**. Un cabinet qui tient un dossier SFD et un dossier commercial se voit proposer, sur
   les deux, les comptes du référentiel de **son organisation** — pas de celui du dossier ouvert.

⚠️ **Ce n'est pas un bug de code** : chaque moitié fait exactement ce que sa story demandait.
C'est une **question de contrat** que personne n'a eu l'occasion de poser, parce qu'il faut les
deux moitiés sous les yeux en même temps.

---

## Ce qui doit être tranché (PO + architecture)

**Q1 — Le plan de comptes doit-il devenir dépendant du DOSSIER ?**

- **Voie A — oui.** `GET /dossiers/{id}/referentiels/plan-comptes` : le plan suit l'axe du
  dossier, comme le tag. Cohérent de bout en bout. ⚠️ **Mais il faut alors répondre à la
  question de sécurité que STORY-394 avait fermée** : l'entitlement porte-t-il les référentiels
  **par dossier** ou seulement par organisation ? Si c'est le second, la voie A ouvre la lecture
  d'un plan auquel l'org n'a pas droit — précisément ce qui était refusé.
- **Voie B — non, et on refuse la divergence.** L'agrégation lève un 409 quand l'axe du dossier
  ne correspond pas au référentiel de l'organisation. Simple, sûr, mais **bloque tout cabinet
  multi-référentiel** — c'est-à-dire le cas que STORY-303 venait d'ouvrir.
- **Voie C — non, et on l'assume à l'écran.** Le tag reste celui du dossier, la validation celle
  de l'org, et **le contrat le publie** (`referentielValidation` à côté de `referentiel`) pour
  que l'écran puisse dire « comptes contrôlés contre SN ». Le moins coûteux, le moins propre.

**Q2 — Que vaut une balance taguée d'un référentiel non packagé ?** Faut-il refuser sa
construction (`REFERENTIEL_NON_PACKAGE` à l'agrégation), ou l'accepter et laisser le refus
tomber en aval, chez le consommateur ? ⚠️ Aujourd'hui elle est **acceptée**, et le refus
n'arrive qu'au moment où quelqu'un veut en faire quelque chose.

---

## Ce qui est FAIT en attendant

La maquette **FE-046** publie l'écart en toutes lettres dans son panneau « Refus », plutôt que
de laisser croire que la liste de comptes est celle du dossier. **Aucune ligne de code
frontend ne doit être écrite sur cette zone avant l'arbitrage** — les trois voies ne donnent
pas le même appel.

---

## Notes

- ⚡ **Deuxième occurrence du patron « écart né d'une jonction »** après **STORY-417**
  (résultat fiscal × plancher MFP, 2026-08-26). ⇒ Confirme la règle : **mettre côte à côte les
  deux moitiés d'un même écran est un acte de revue à part entière** — ni le code, ni le
  référentiel ne l'auraient donné.
- Voir [[FE-046]], `stories/STORY-303.md` (le tag vient du dossier), `stories/STORY-078.md`
  (D-078-3, SMT non packagé), `stories/STORY-394.md` (l'énumération du plan, org-scopée),
  `stories/STORY-304.md`.
