# STORY-422 : La balance est étiquetée du référentiel du DOSSIER, mais ses comptes sont validés contre celui de l'ORGANISATION

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/referentiel`, `modules/cahiers/agregation`, `modules/read-models`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-533** (l’entitlement porte N référentiels par organisation) — sans elle, la voie A ne peut pas poser sa question de sécurité.
**✅ Prérequis LEVÉ le 2026-08-31** — STORY-533 est `done`. `estHabilite(orgId, referentiel)` est
servi par `balance-service` (`ReferentielService`/`ReferentielResolver`), fail-closed prouvé par
mutation, et `GET /referentiels/actifs` publie `referentielsHabilites`. ⚠️ **Deux choses à savoir
avant de prendre cette story :**
1. `resoudreReferentiel(orgId)` lève désormais **`409 REFERENTIEL_AMBIGU`** dès que l'organisation
   porte deux référentiels — c'est un **hook explicite de 422**, pas un défaut : la question « quel
   est LE référentiel de cette org ? » n'a plus de réponse, et on refuse au lieu de deviner. Les
   **20 points d'appel** de `chargerReferentiel` (et non 6 comme l'annonce le § *Ce que A coûte*)
   passent tous par `versHttpDepuisErreurReferentiel` ; c'est cette branche que 422 rend morte.
2. Le corps du 409 porte déjà **`details.referentielsHabilites`** en champ structuré : AC-A3 (« le
   refus nomme le référentiel du dossier ET celui auquel l'organisation a droit ») n'a plus qu'à y
   ajouter le référentiel **du dossier**.
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

## ⚖️ RECOMMANDATION (2026-08-26, demandée par le PO) — **VOIE A, avec le refus de la voie B comme garde-fou**

### Le fait qui tranche : un même numéro ne désigne pas la même chose

Comparaison des deux artefacts packagés, racine par racine (`syscohada-revise@2.1`, 174 comptes ;
`sfd-bceao@2.0`, 372 comptes) :

**44 racines à deux chiffres existent dans les DEUX plans. Les 44 divergent. Aucune ne concorde.**

| racine | SYSCOHADA (SN) | SFD-BCEAO (microfinance) |
|---|---|---|
| `10` | **Capital** | Valeurs en caisse |
| `41` | **Clients et comptes rattachés** | Immobilisations financières |
| `52` | **Banques** | Provisions réglementées |
| `57` | **Caisse** | **Capital social** |
| `64` | Impôts et taxes | **Charges de personnel** |
| `70` | **Ventes** | Produits d'exploitation financière |

⇒ Valider les comptes d'un dossier **microfinance** contre le plan **SYSCOHADA** ne « marche pas
à peu près » : **tout passe**, parce que les racines existent des deux côtés — et **tout est
faux**. Un `57…` d'une IMF est son **capital social** ; la plateforme le reconnaît comme
**Caisse**, l'utilise comme contrepartie de trésorerie, et le bilan présente du capital en
disponibilités.

**C'est le mode de panne le plus grave du programme : aucun refus, aucun déséquilibre, aucun
signal — et des états financiers faux.**

### Pourquoi A, et pas B ni C

1. **Le référentiel n'est pas un réglage d'affichage : c'est le cadre comptable de l'entité
   tenue.** Il appartient au **dossier**, jamais au cabinet. Un cabinet tient une SARL
   commerciale, une IMF et une compagnie d'assurance ; ces trois-là n'ont pas le même plan, et
   ce n'est pas négociable.
2. **STORY-303 a déjà tranché cette question — pour l'autre moitié.** Le tag venait du profil du
   **cabinet** ; on l'a fait venir des axes du **dossier**, et le commentaire du code le dit :
   *« la balance d'un client était taguée du système comptable du CABINET »*. **STORY-422 est le
   même défaut, dans la moitié qu'on n'a pas corrigée.** Choisir autre chose que A, c'est
   maintenir volontairement l'incohérence que 303 est venue supprimer.
3. **L'objection de sécurité se traite DANS la voie A, elle ne s'y oppose pas.** La crainte
   légitime — *« lire le plan d'un référentiel auquel l'organisation n'a pas droit »* — se règle
   en posant une question **plus stricte** qu'aujourd'hui : *l'organisation est-elle habilitée au
   référentiel de CE dossier ?* Si non, ce n'est pas un cas à valider contre un autre plan,
   c'est un cas à **refuser** (`409`). Un cabinet non habilité au RCSFD n'a pas à tenir une IMF
   dans l'outil. ⇒ **A absorbe B**, au bon endroit.
4. **Bénéfice collatéral : le cas SMT cesse d'être bancal.** Sous A, un dossier `SMT` reçoit un
   `409 REFERENTIEL_NON_PACKAGE` **explicite** au lieu de la substitution silencieuse d'un plan
   SYSCOHADA qui n'est pas le sien.
5. **C est la pire pour un praticien.** Publier « vos comptes ont été contrôlés contre un
   référentiel autre que celui de votre dossier » n'est pas une information exploitable : c'est
   un aveu, et la faute continue de se produire.

### Ce que A coûte, honnêtement

- **Ne touche pas** le contrat canonique (STORY-101), ni la liasse, ni `bilan-service`.
- `GET /referentiels/plan-comptes` devient `GET /dossiers/{id}/referentiels/plan-comptes`.
- `chargerReferentiel(orgId)` devient `chargerReferentiel(orgId, dossierId)` — **6 points
  d'appel** (agrégation, rattachement, cahiers recettes, cahiers dépenses, comptes de
  ventilation, soumission de balance).
- Le read-model d'entitlement doit répondre « cette org a-t-elle droit à ce référentiel ? ».
  ⚠️ **C'est le seul vrai inconnu**, et il conditionne le chiffrage.

**Estimation si l'entitlement porte déjà l'information : 5 pts. S'il faut l'étendre : 8 à 13.**

---

---

## ✅ ARBITRAGE PO — **VOIE A** (rendu le 2026-08-26, confirmé et complété le 2026-08-27)

> « *Valider une balance d’une IMF doit être contre son plan, de même pour une assurance.* »
> — PO, 2026-08-27, en réponse à la revue expert-comptable de la maquette cumulative.

⚠️ **Écart de traçabilité relevé le 2026-08-27 :** `sprint-status.yaml` portait « ARBITRÉ PAR LE PO LE 2026-08-26 : VOIE A », 8 pts, `ready-for-dev` — **et l'en-tête de cette fiche disait encore `needs-po-decision`**. Le tracker faisait foi, la fiche non, et c'est la fiche que lit celui qui prend la story. ⇒ **Règle : un arbitrage se pose aux DEUX endroits le jour où il est rendu.** 3ᵉ occurrence du patron « la fiche ne fait pas foi sur l'état réel » (après FE-064 et FE-066).

**Q1 — tranchée le 2026-08-26 : voie A.** Le plan de comptes suit le **dossier**. La recommandation du 26/08 est
retenue telle quelle, y compris son garde-fou : l’objection de sécurité se traite **dans** la voie A
en posant une question plus stricte — *l’organisation est-elle habilitée au référentiel de CE
dossier ?* — et non en renonçant au dossier comme porteur.

**Q2 — tranchée le 2026-08-27 : refus à la CONSTRUCTION.** *(restée ouverte le 26/08)* Une balance dont le référentiel du dossier n’est pas
packagé n’est pas construite : `409 REFERENTIEL_NON_PACKAGE`, avec son motif. Motif comptable :
une balance est un **objet daté et opposable**, pas un brouillon d’attente. En produire une qui ne
pourra jamais devenir une liasse, c’est créer une pièce dont on découvrira l’inutilité à
l’arrêté des comptes — au pire moment de l’année. ⇒ **STORY-487** porte ce refus.

⚠️ **Q2 est réversible à coût nul tant que 487 n’est pas démarrée**, et seulement jusque-là :
après, des balances existeront ou n’existeront pas, et le rejeu n’est pas symétrique.

### Ce que l’arbitrage ajoute à la définition de terminé

- [ ] AC-A1 — `chargerReferentiel` n’est **jamais** appelable sans `dossierId` : la signature le
      refuse (paramètre requis), et non un contrôle à l’exécution.
- [ ] AC-A2 — **Test de mutation obligatoire, et c’est LE test de cette story** : une balance de
      dossier **SFD-BCEAO** dont les comptes sont valides en SFD et **invalides en SYSCOHADA**
      doit être acceptée ; la même, validée contre `syscohada-revise@2.1`, doit être **refusée**.
      Aujourd’hui les deux passent — c’est exactement le silence à briser. Un vert obtenu sans que
      la variante SYSCOHADA vire au rouge ne prouve rien.
- [ ] AC-A3 — Le refus d’habilitation (`409`) **nomme le référentiel du dossier** et celui auquel
      l’organisation a droit. « Accès refusé » sans les deux noms envoie l’appel au support.

## Ce qui devait être tranché (PO + architecture) — RÉSOLU, conservé pour la traçabilité

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
