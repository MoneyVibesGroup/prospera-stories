# STORY-422 : La balance est étiquetée du référentiel du DOSSIER, mais ses comptes sont validés contre celui de l'ORGANISATION

Status: done

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

---

## Progress Tracking

**Statut : `done`** — démarrée **et** clôturée le **2026-08-31**, juste après son prérequis
[[STORY-533]] (le même jour). PR `balance-service` **#80**, rebase-mergée sur `dev`.

### ⚡⚡ Le fait de la story, MESURÉ — et il est pire que ce que la fiche annonce

La fiche dit « 44 racines communes, les 44 divergent ». C'est vrai, mais ce n'est pas le chiffre qui
compte. `isCompteValide` rattache **par préfixe** — une balance réelle porte des comptes subdivisés
(`5211BOA0`, `411FACTURE`) que le plan normalisé ne liste pas un par un. Conséquence mesurée sur les
artefacts livrés :

> Sur les **372 comptes du RCSFD**, SYSCOHADA n'en refuse que **21**.
> **Les 351 autres — 94 % — passent la validation et sont rattachés au mauvais poste.**

Ce n'était donc pas « quelques comptes exotiques » qui échappaient au contrôle : c'était la
**quasi-totalité d'une balance de microfinance**, acceptée sans un signal et présentée dans un bilan
SYSCOHADA. Les 21 refusés sont précisément le cœur de métier d'une IMF (`20…` « Crédits aux membres »,
`202` « Crédits à court terme », `2022` « Crédits ordinaires »).

⇒ Ce fait est désormais **exécutable** : `referentiel-assets-coherence.spec.ts` charge les **vrais**
octets et le constate. Le jour où quelqu'un régénère un artefact et fait converger les deux plans, il
rougit — et la story perd sa raison d'être avant que quiconque ne s'en aperçoive en production.

### Le périmètre réel, et trois écarts assumés

| Ce que la fiche annonce | Ce qui est |
|---|---|
| « **6 points d'appel** » de `chargerReferentiel` | **20** — le compilateur les a tous énumérés dès que `dossierId` est devenu requis (AC-A1 : c'est la signature qui refuse, pas un contrôle à l'exécution). 12 services + 8 appels indirects. |
| « `GET /referentiels/plan-comptes` devient `GET /dossiers/{id}/…` » | **`actifs` bouge aussi** — ⚠️ **conséquence FORCÉE d'AC-A1**, pas un débordement : dès que `chargerReferentiel` refuse d'être appelée sans dossier, un diagnostic org-scopé n'a plus de référentiel à charger. Le laisser en l'état l'aurait figé sur le `409 REFERENTIEL_AMBIGU` de 533 pour **exactement** les cabinets multi-secteur que cette story vient servir. |
| — | **`reintegrations` reste org-scopé**, dans un contrôleur séparé : cette énumération sort du **paquet FISCAL**, dont l'axe est `(pays, année)`, pas du référentiel comptable. La déplacer l'aurait soumise à `@RequiresDossierScope()` pour une donnée qui ne dépend d'aucun dossier, et aurait cassé une URL publiée que la story ne touche pas. |

### Décisions de conception

**1. Les trois questions, dans cet ordre** : ① l'organisation a-t-elle un droit d'usage `ACTIVE` ?
② de quel système comptable relève **ce dossier** ? ③ y est-elle habilitée ? Chaque marche a son refus
typé, et le référentiel n'est **jamais** deviné.

**2. La cascade du tag est celle d'`axesAvecRepli`, à l'identique.** En prendre une autre ferait
diverger le tag (STORY-303) et le plan — c'est-à-dire **recréer** le défaut à plus petite échelle. Le
repli sur le profil de l'organisation reste la marche de non-régression de 303, et il est désormais
**gardé par l'habilitation**.

**3. `ReferentielResolver` injecte le MODÈLE `ProfilSociete`, pas `ProfilSocieteRepository`.**
`ProfilSocieteModule` importe `ReferentielModule` (il dérive de `PaquetFiscalRegistry` la liste des
pays supportés) : injecter son repository fermerait un **cycle**. `MongooseModule.forFeature` n'en
crée aucun ; le résolveur lit un seul champ, en lecture seule, dans la base du même service.

**4. `resoudreReferentiel(orgId)` et `ReferentielAmbiguError` sont SUPPRIMÉS.** STORY-533 avait écrit :
*« STORY-422 remplace ces appels par une résolution scopée au dossier ; cette branche redevient alors
morte »*. Elle l'est : plus aucun appelant de production. Le `409 REFERENTIEL_AMBIGU` disparaît du
contrat de `balance-service` — **le hook est consommé, pas laissé en place**.
⚠️ `bilan-service` garde le sien : la story ne le touche pas.

**5. Un 500 disparaît, et c'est un progrès.** Avant 422, l'entitlement alimentait **directement** le
loader : une version fantaisiste (`syscohada-revise@9.9`) y produisait un `ArtefactNotFoundError`, donc
un **500** — une panne serveur pour une donnée d'octroi mal saisie. Le référentiel vient désormais du
**pont tag → couple**, exhaustif par construction : le loader ne reçoit jamais de clé inconnue, et
l'octroi fantaisiste sort en **409 `REFERENTIEL_NON_HABILITE`** que l'appelant peut corriger.

### Passe de mutation — AC-A2

| Mutation | Attendu | Constaté |
|---|---|---|
| rendre `habilites[0]` au lieu du référentiel du tag (**le comportement d'AVANT 422**) | rouge sur les tests d'AC-A2 et d'AC-A3 | ✅ **4 rouges / 46**, et la mutation **compile** |

### ⚠️ Rupture de contrat HTTP — une story FE est nécessaire

Deux routes publiées changent d'URL :

| Avant | Après |
|---|---|
| `GET /api/v1/referentiels/plan-comptes` | `GET /api/v1/dossiers/{dossierId}/referentiels/plan-comptes` |
| `GET /api/v1/referentiels/actifs` | `GET /api/v1/dossiers/{dossierId}/referentiels/actifs` |
| `GET /api/v1/referentiels/reintegrations` | **inchangée** (paquet fiscal, axe pays/année) |

La rupture est **assumée et voulue** : c'est elle qui empêche un écran d'afficher la liste de comptes
du cabinet sur le dossier ouvert — le point ③ du § *Ce que la jonction produit*. Mais elle exige une
story frontend, que le backend ne peut pas porter (l'user n'a pas de droit de push sur les dépôts
frontend). ⇒ **À ficher**, avec le passage du panneau « Refus » de la maquette **FE-046** — dont la
mention provisoire (« la liste de comptes n'est pas celle du dossier ») devient **fausse** et doit
être retirée.

Deux codes de refus neufs à câbler côté écran, tous deux `409` et tous deux **actionnables** :

- `REFERENTIEL_NON_HABILITE` — corps : `details.referentielDuDossier` **et**
  `details.referentielsHabilites`. L'écran peut dire « ce dossier relève du RCSFD, votre cabinet a
  droit à SYSCOHADA » et proposer les deux gestes : corriger l'axe, ou demander l'habilitation.
- `SYSTEME_COMPTABLE_INDETERMINE` — le geste est « renseigner les axes du dossier ».

Et un code qui **disparaît** de `balance-service` : `REFERENTIEL_AMBIGU` (hook de STORY-533 consommé).

### ⚠️ Un piège que `tsc` ne pouvait pas voir

Ajouter deux paramètres au constructeur de `ReferentielResolver` **compile partout** — mais les suites
e2e qui construisent le résolveur **réel** (et non un mock) montent leur `TestingModule` à
l'exécution : `Nest can't resolve dependencies of the ReferentielResolver … AxesResolver at index [2]`.

Deux suites sont dans ce cas (`referentiel.e2e-spec.ts`, `suggestion.e2e-spec.ts`) ; les autres mockent
`ReferentielService` et n'ont rien vu. **Le typage ne garde pas l'injection** — seul le fait de lancer
les suites l'a trouvé.

⚠️ Corollaire de méthode, payé une fois ici : **lire les TOTAUX d'une exécution, jamais la liste des
`●`.** Une première lecture m'a fait attribuer l'échec à `cahiers-depenses` (dont les `●` provenaient
d'une exécution antérieure du fichier de sortie) alors que la suite fautive était `suggestion` — qui,
elle, ne rendait qu'**une** ligne d'erreur de résolution répétée vingt fois.

### Vérification docker — la persistance et le contrat réels

Stack : `mongo` (rs0) + `kafka` + `redis` + `auth-service` + `platform-catalog-service` +
`balance-service`, hot-reload confirmé (`Found 0 errors` postérieur au dernier commit).
Organisation réelle `cabinet533@prospera.local` (`6a953e…4240`), dossier
**« Mutuelle d'Épargne Bè »** (`6a953e…4299`, `typeEntite: IMF`) semé dans les read-models
`dossiers_dossier` et `axes_dossier` — tous deux alimentés par Kafka, donc inatteignables autrement.

| # | Ce qui est prouvé | Résultat mesuré |
|---|---|---|
| ⓐ | **AC-A2, moitié « accepté »** — dossier d'axe `SFD-BCEAO`, organisation habilitée aux **deux** | `GET /dossiers/{id}/referentiels/plan-comptes?prefixe=20` → **`sfd-bceao@2.0`**, comptes `['20','202','2022','20227','2023','203','2031','2037']` — **`20` « Crédits aux membres » présent** |
| ⓑ | **AC-A2, la CONTRE-ÉPREUVE** — **même** organisation, **même** entitlement, on bascule le **seul axe** en `SN` | → **`syscohada-revise@2.1`**, `comptes: []`, **`20` absent**. ⚠️ Avant 422, ces deux appels rendaient le **même** plan : celui de l'entitlement. |
| ⓒ | **AC-A3** — dossier SFD, organisation habilitée au **seul** SYSCOHADA | **409 `REFERENTIEL_NON_HABILITE`** : *« Ce dossier relève du référentiel « sfd-bceao@2.0 », auquel l'organisation … n'est pas habilitée (elle a droit à : syscohada-revise@2.1) »*, avec `details.referentielDuDossier` **et** `details.referentielsHabilites` en champ structuré |
| ⓓ | Le tag n'est jamais deviné (D-085-7) — aucun axe, aucun profil | **409 `SYSTEME_COMPTABLE_INDETERMINE`** : *« renseigner les axes du dossier avant de traiter ses comptes »* |
| ⓕ | Le déplacement de routes est **effectif** | `/api/v1/referentiels/plan-comptes` → **404** · `/actifs` → **404** · `/reintegrations` → **200** (elle ne bouge pas, cf. § *Décisions*) |

⚠️ **Ce que cette vérification NE prouve pas, et pourquoi je le dis** : la moitié « une balance SFD est
**refusée** contre SYSCOHADA » n'a **pas** été rejouée par une soumission HTTP — le calcul du checksum
côté harnais de vérification n'a pas convergé avec celui du serveur, et diagnostiquer cet écart-là
relève du harnais, pas de la story. Le lien est établi **par composition**, chaque maillon étant
vérifié indépendamment :

1. `referentiel-assets-coherence.spec.ts` constate sur les **vrais octets** que `202` est
   `isCompteValide` en `sfd-bceao@2.0` et **ne l'est pas** en `syscohada-revise@2.1` ;
2. `referentiel-resolver.service.spec.ts` prouve **quel paquet** est choisi selon l'axe du dossier
   (mutation : le comportement d'avant 422 fait rougir) ;
3. `BalanceValidator` appelle `estDeposable = isCompteDeDetail`, via
   `controleurDeCompte(orgId, dossierId, exercice.debut)` — dont le plan vient désormais du dossier.
   ⚠️ **Ce n'est PAS le même prédicat que celui mesuré au point 1** (`isCompteValide`) — correctif de
   revue de code. Le lien tient parce qu'`estCompteDeDetail` commence par
   `if (!estCompteRattachable(…)) return false` : `isCompteDeDetail ⟹ isCompteValide`, donc la moitié
   « **refusé** contre SYSCOHADA » se transporte telle quelle. La moitié « **accepté** en SFD » exige en
   plus une longueur ≤ 6 et un numéro numérique — vrai pour les comptes cités, mais **non prouvé par
   cette spec** ;
4. ⓐ/ⓑ ci-dessus montrent le changement de plan **de bout en bout, en HTTP**.

⇒ **À rejouer en soumission de balance complète le jour où le harnais de checksum sera fiabilisé** —
fiché ici plutôt que passé sous silence.

Stack arrêtée après la vérification.


---

## Revue de code (phase ⑥) — 9 constats, 9 traités

⚡⚡ **Le premier était un défaut que J'AI INTRODUIT, et c'est celui que la story existe pour tuer,
recréé à l'intérieur d'une seule requête.**

### ① ⛔ BLOQUANT — le plan était résolu à la date du JOUR pendant que le tag l'était à `exercice.debut`

`BalanceService.submit` construit son `exercice` soixante lignes avant d'appeler `controleurDeCompte`
— et ne le passait pas. `chargerReferentiel(orgId, dossierId, date = new Date())` retombait donc sur
**aujourd'hui**, pour tout le hub de soumission (HTTP, agrégation, reprise, provisions, sage, et
l'ingestion Kafka).

**Scénario** : dossier passé de `SN` (2025) à `SFD-BCEAO` (2026-03), organisation habilitée aux deux.
Une agrégation de l'exercice **2025** résolvait le **tag** à `exercice.debut` → `SN`, et faisait juger
ses **comptes** par le plan **du jour** → RCSFD. Balance taguée `SN`, comptes validés contre le RCSFD.
⚠️ **Aucun test ne pouvait l'attraper** : `dryRun` et `submit` prenaient tous deux « aujourd'hui »,
donc ils étaient cohérents **entre eux**.

**Correctif** : `date` devient **REQUISE** sur la façade — le même remède qu'AC-A1 pour `dossierId`.
C'est le compilateur qui pose la question à chaque appelant, et les 6 sites qui avaient un exercice en
portée sans le passer (dont `taxes` ×2 et `sage-import`, constat ⑨) sont corrigés du même coup. Un
appelant qui n'a réellement aucun exercice écrit `new Date()` **sur place**, où le choix se voit.
⚠️ Le parallèle que j'invoquais avec `chargerPaquetFiscal(orgId, exercice?)` **ne tenait pas** : là-bas
l'absence rend le paquet *par défaut de la configuration*, ici elle rendait un **plan de comptes
différent**, sans le dire.
**Mutation** : revenir à `new Date()` fait rougir le test dédié, et compile.

### ② ⛔ BLOQUANT — le contrat publié affirmait encore que le plan vient de l'ORGANISATION

Cinq `summary`/`description` OpenAPI, dont une qui **contredisait sa voisine dans le même DTO** :
`referentiel` documenté « effectif de l'org » deux champs au-dessus de `referentielsHabilites`
documenté « `referentiel` ci-dessus est celui du **DOSSIER** ». **4ᵉ occurrence du patron « le
bloquant est une description OpenAPI »** après STORY-400, 376 et 533.
⇒ La story FE annoncée se serait codée là-dessus : mémoïsation du plan **par cabinet**, et réaffichage
des comptes SYSCOHADA sur le dossier IMF — le point ③ de *Ce que la jonction produit*, que cette story
existe pour fermer.

### ③ NON-BLOQUANT — mon déplacement de `describe` n'a pas rendu un test vacant : il a rendu la suite DÉPENDANTE DE L'ORDRE

Le bloc AC-A2 est le premier de l'histoire du fichier à charger `sfd-bceao@2.0` **avec succès**, et le
cache de `ReferentielLoader` est partagé par toute la suite. Mesuré en revue : `--randomize` fait
tomber **4 seeds sur 8**, toujours sur les deux tests de corruption d'artefact.

**Correctif** : on ne contourne pas par la position — on rend la supposition **bruyante**. Un
`exigerNonCharge(code, version)` interroge `ReferentielLoader.has()` et échoue avec un message qui dit
quoi faire, au lieu d'un `200` que personne ne sait expliquer. Vérifié sur les 4 seeds.
⚠️ **Honnêteté** : la suite reste dépendante de l'ordre — `npm run test:e2e` n'utilise pas
`--randomize`, donc elle est déterministe en CI, et toute réorganisation future échouera **en le
disant**. Ce n'est pas l'indépendance d'ordre, c'est sa mise sous garde.

### ④ NON-BLOQUANT — la scission du contrôleur a fait sortir `reintegrations` du contrat sous test

`ReintegrationsResponseDto` n'est référencé que par ce contrôleur : absent d'`openapi-contract.e2e`, il
disparaissait du document, et la garde « aucun schéma opaque » ne le voyait plus. Le docblock de ce
fichier décrit **exactement** ce mode de panne : *« en oublier un ferait porter la garde sur un schéma
absent — elle passerait au vert sans rien avoir vu »*.

### ⑤ NON-BLOQUANT — `estHabilite` était MORT, et sa logique dupliquée

J'avais réécrit le test d'habilitation **en ligne** dans le résolveur au lieu d'appeler le prédicat que
STORY-533 venait de livrer pour ça — pendant que son docblock affirmait « la question que STORY-422
pose, et la seule ». La décision n°4 supprimait l'autre méthode morte au motif que « le hook est
consommé » ; celle-ci restait, en double. ⇒ Prédicat pur `estHabiliteParmi`, appelé par les deux.

### ⑥ NON-BLOQUANT — « (STORY-422) » dans un message RENDU À L'UTILISATEUR

`MESSAGE_SAISIE_COMPTE` n'est pas un commentaire : c'est le `message` de 17 champs de DTO. Un
comptable recevait un 400 se terminant par un numéro de ticket. Retiré.

### ⑦ NON-BLOQUANT — `expect.any(String)` affaiblissait le seul test qui pouvait voir `?? orgId`

Dans `suggestion`, le seul endroit du diff qui puisse envoyer un `orgId` en guise de `dossierId` était
aussi le seul dont le test ne regardait pas l'argument. Remplacé par le dossier exact.

### ⑧ NON-BLOQUANT — deux refus jumeaux disaient encore « de cette organisation »

`balance.validator` disait « de ce dossier », les exceptions de cahiers disaient l'inverse **pour le
même compte et le même plan**. Aligné.

### ⑨ NON-BLOQUANT — trois autres points d'appel avaient l'exercice en portée sans le passer

Fermé par le correctif ① (`date` requise) : `taxes` ×2, `sage-import`, `rapprochement`.

### Ce que la revue a corrigé dans MA propre rédaction

Ma section « AC-A2 prouvé par composition » décrivait un maillon **faux** : j'écrivais que
« `BalanceValidator` appelle exactement ce prédicat », alors que la spec d'artefacts mesure
`isCompteValide` et que le validateur appelle `estDeposable = isCompteDeDetail`. **Deux prédicats
différents.** La chaîne survit parce qu'`estCompteDeDetail` commence par
`if (!estCompteRattachable(...)) return false` — donc `isCompteDeDetail ⟹ isCompteValide`, et la moitié
« **refusé** contre SYSCOHADA » se transporte telle quelle. Mais la moitié « **accepté** en SFD » exige
en plus une longueur ≤ 6 et un numéro numérique : vrai pour les comptes cités, **pas prouvé par cette
spec**. Reformulé ci-dessous plutôt que laissé tel quel.


---

## Revue de sécurité (phase ⑦) — **0 vulnérabilité**

⚠️ **Ce n'était pas une formalité** : la story change **qui décide** du plan de comptes contre lequel
les écritures d'un dossier sont validées. Le verdict de la revue est que le changement va dans le sens
du **durcissement** — le référentiel cesse d'être un attribut de l'organisation appliqué
indistinctement à tous ses dossiers, et devient une donnée du dossier **confrontée** au droit d'usage.
Il n'est à aucun moment un paramètre de l'appelant.

Points examinés et trouvés sains :

- **Le `dossierId` d'URL est toujours croisé avec l'`orgId` du JWT avant d'être utilisé.** Le
  contrôleur ne lit **jamais** le paramètre brut : `exigerDossierId(dossier)` rend la valeur déjà
  résolue par `DossierScopeGuard`, qui filtre `{dossierId, orgId}` et rend **404** (jamais 403) sur un
  dossier d'un autre tenant — anti-énumération respectée. ✅ **Vérifié à la main** : le guard est bien
  le **dernier** `APP_GUARD` d'`app.module.ts`, donc après `JwtAuthGuard`.
- **Le repli sur le profil est tenant-scopé** : `findOne({ orgId: ObjectId(organizationId) })` où
  l'`organizationId` vient **exclusivement** du JWT, sur un champ à **index unique**. Le cast interdit
  toute injection NoSQL par opérateur, et l'`orgId` n'est de toute façon jamais un paramètre.
- **Le `409 REFERENTIEL_NON_HABILITE` ne fuit rien** : ses `details` ne portent que le référentiel d'un
  dossier **déjà prouvé appartenir à l'org du JWT** et les habilitations de **cette même org**. Aucun
  409 n'est atteignable pour un dossier tiers — la porte 404 du guard précède.
- **Les deux refus neufs ne sont pas un oracle** : ils ne naissent que derrière `DossierScopeGuard`, et
  `BalanceAccessGuard` s'exécutant avant, une org sans droit reçoit 403 avant toute résolution.
- **L'ancienne surface est réellement morte** : plus aucun appelant de `resoudreReferentiel` ni de
  `REFERENTIEL_AMBIGU`, et les 28 sites d'appel de `chargerReferentiel` passent tous un `dossierId` —
  la signature à trois paramètres requis rend l'oubli **non compilable**.
- **`reintegrations` resté org-scopé est sûr** : la scission conserve `@Roles` + `@RequiresBalanceAccess`
  et les guards globaux, et la donnée servie sort du **paquet fiscal par défaut de la configuration** —
  identique pour tous les tenants, aucune donnée d'organisation n'y transite.
- **Le consommateur Kafka vérifie le dossier AVANT de résoudre le référentiel** : `resoudreDossier`
  interroge `{dossierId, orgId}` et rejette `DOSSIER_INCONNU` avant `soumettre()`. ✅ **Vérifié à la
  main.** Un producteur forgé ne peut pas faire valider une balance contre le plan d'un dossier tiers.
- **`estHabiliteParmi`** : comparaison de chaînes, aucune valeur réseau utilisée comme **clé d'objet**,
  et le tag passe la liste blanche `REFERENTIELS_BALANCE` **avant** d'indexer `PONT_TAG` — `__proto__`
  est écarté en amont. Couple **exact**, jamais la famille.
- **Fail-closed conservé** partout, y compris le `catch` typé d'`estHabilite` (une panne d'infra ne
  devient pas un « non habilité »).

**Écarté, avec raison** : le choix de la **date** de résolution par l'appelant (`exercice.debut` en
query) permet à un utilisateur légitime de viser une date antérieure à toute décision d'axe et de
retomber sur le profil de l'organisation. L'issue reste **bornée aux référentiels que l'org détient
déjà**, tout se passe intra-tenant, et c'est le comportement délibérément documenté — risque
d'intégrité métier, pas d'élévation de privilège.


---

## Ce qui reste ouvert, fiché plutôt que tu

1. **Une story FRONTEND est nécessaire** (l'user n'a pas de droit de push sur les dépôts frontend) :
   deux URL changent, deux codes de refus neufs sont à câbler (`REFERENTIEL_NON_HABILITE` avec ses
   `details`, `SYSTEME_COMPTABLE_INDETERMINE`), un code disparaît (`REFERENTIEL_AMBIGU`), et la mention
   provisoire du panneau « Refus » de **FE-046** devient **fausse** — elle doit être retirée.
2. **Le rejeu de la moitié « balance REFUSÉE » en soumission HTTP**, quand le harnais de vérification
   docker saura recalculer le checksum comme le serveur. Le lien est aujourd'hui établi par
   composition, avec ses quatre maillons nommés et la réserve du maillon 3 écrite noir sur blanc.
3. ⚠️ **Relevé par la revue, hors périmètre : rien ne croise le `referentiel` DÉCLARÉ par l'appelant
   (`SubmitBalanceDto.referentiel`) avec le plan RÉSOLU.** Un `POST /dossiers/D/balances` avec
   `referentiel: 'CIMA'` sur un dossier `SN` est **encore accepté**, tagué CIMA, comptes validés
   SYSCOHADA. C'est le sujet même de **Q2 → STORY-487**, et le résolveur neuf le rend **fermable en une
   ligne** dans `validerReferentiel`. ⇒ À signaler à qui prendra 487.
4. Le refus `SYSTEME_COMPTABLE_INDETERMINE` **s'ouvre à des endpoints qui ne refusaient rien**
   (plan-comptes, suggestion, catégories, trésorerie, rattachement) pour les dossiers dont le
   read-model d'axes n'a pas convergé **et** dont le profil n'a pas de `systemeComptable`. C'est le prix
   assumé de D-085-7 — STORY-303 imposait déjà ce refus à l'agrégation — mais c'est un **risque de
   déploiement** à connaître.
