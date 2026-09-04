# STORY-453 : L'échéance de dépôt de la DSF n'est publiée nulle part — une date d'arrêté ne se lit jamais seule

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `balance-service · bilan-service` ⚠️ **corrigé le 2026-09-04** — la fiche annonçait `bilan-service · dossier-service`. `dossier-service` n'est **pas** impacté : il embarque bien une copie du paquet fiscal, mais ne lit que `acomptesProvisionnels.echeances` et sert l'échéance d'**acompte**, jamais celle de dépôt. C'est `balance-service` qui possède l'axe fiscal et résout l'échéance.
**Points :** 3 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

Devant « liasse figée le 22/07/2026 » pour un exercice clos au 31/12/2025, le premier réflexe d'un
expert-comptable est de compter les jours jusqu'au **30 avril**. Le produit ne fait ce rapprochement
nulle part.

Le paquet fiscal embarqué (`paquet-fiscal-togo-2026.json`) ne publie qu'**une** donnée datée :
`acomptesProvisionnels.echeances` — les quatre acomptes d'IS (31-01, 31-05, 31-07, 31-10). Le
`paquet-fiscal.util` de `dossier-service` le dit explicitement : *« c'est la **seule** donnée datée
et structurée du paquet »*. **Aucune date de dépôt de liasse.**

⚠️ Et le `_meta` du paquet annonce pourtant : *« Dates de dépôt DSF fournies par l'utilisateur »* —
une source citée pour une donnée que le fichier ne porte pas. Le paquet promet plus qu'il ne tient.

## ⚠️ RECADRAGE DU 2026-09-04 — la fiche a été dépassée par STORY-413

Cette fiche a été écrite le **2026-08-27**. **STORY-413 a été clôturée le 2026-08-30** et a livré
l'essentiel de ce que les AC-1 à AC-3 demandent — mais **dans `balance-service`**, propriétaire de
l'axe fiscal. Vérifié à la source avant toute ligne de code :

| Ce que la fiche demande | État réel au 2026-09-04 |
|---|---|
| **AC-1** — le paquet gagne `depotLiasse: {echeance, base, source}` par régime | ✅ **livré sous le nom `depot`** : trois échéances (`31-03` TPU déclaratif, `30-04` société, `31-05` assurance/banque), chacune avec `typeContribuable`, `dateLimite`, `modeConstatation`, `note`, `source` (LPF Art. 56, …) |
| **AC-2** — dérivée de la clôture de l'exercice, jamais d'une année civile en dur | ✅ `depot.clotureReference` (`31-12`) est **vérifiée** par `resoudreDateLimiteDepot` : une clôture non calendaire rend `CLOTURE_NON_CALENDAIRE` plutôt qu'un 30 avril faux de plusieurs mois |
| **AC-3** — un régime sans dépôt de liasse rend `null`, l'écran n'invente rien | ✅ quatre motifs d'absence explicites (`DEPOT_NON_PACKAGE`, `CLOTURE_NON_CALENDAIRE`, `DATE_LIMITE_INDETERMINABLE`, `PLUSIEURS_ECHEANCES_APPLICABLES`) |
| **AC-4** — l'échéance accompagne **le jeu d'états** | ⛔ **NON livré** : STORY-413 la publie sur `…/fiscal/liquidation` et `…/fiscal/tpu` de `balance-service`, pas sur la liasse |
| **AC-5** — calculée à la lecture, jetable sans dette | ✅ tenu par 413, et conservé ici |
| **AC-6** — validation par un fiscaliste togolais | ⏸ inchangé, hors code |

⚠️ **Le reproche fait au `_meta` n'est plus fondé.** La fiche relève que le paquet annonce « Dates de
dépôt DSF fournies par l'utilisateur » pour une donnée qu'il ne porte pas. Il la porte depuis 413 :
c'est la fiche qui a vieilli, pas le paquet.

### Ce qui reste, et l'arbitrage tranché

Reste **l'AC-4 seul** : porter l'échéance jusqu'au jeu d'états de `bilan-service`. Trois points de
fait l'ont rendu non trivial :

1. `bilan-service` embarque une lignée **différente et plus ancienne** du paquet fiscal
   (`_meta.statut: "AMORCE"`, 10 rubriques, source du 2026-07-12) contre celle de `balance-service`
   (`COMPLET`, 16 rubriques, édition OTR 2025). Elle **ne porte pas** `depot`.
2. `bilan-service` **ne connaît pas le régime fiscal** d'un dossier : son read-model porte
   `typeEntite`, pas `regime`. Il ne pourrait donc constater que l'échéance « assurance / banque ».
3. Recalculer l'échéance dans `bilan-service` dupliquerait la dérivation de `resoudreDateLimiteDepot`
   — **deux moteurs pour une date légale dont le manquement coûte une majoration de 40 %**.

⇒ **Décision de l'user du 2026-09-04 : `balance-service` reste seul auteur de la règle et publie
l'échéance DÉJÀ RÉSOLUE par événement ; `bilan-service` la réplique en read-model local.** C'est
l'invariant d'archi nº 2 appliqué tel quel, et cela ferme la divergence plutôt que de l'ouvrir.

⚠️ **Contrat d'événement ⇒ 2 dépôts** (`balance-service` producteur, `bilan-service` consommateur),
plus `docs/`. Champ **additif** sur `balance.created`, `schemaVersion` inchangé, **omis** jamais
`null` — le patron déjà suivi par `dossierId` (STORY-236), `exerciceId` et `checksumVersion`
(STORY-381).

## Critères d'acceptation

- [ ] AC-1 — Le paquet fiscal gagne `depotLiasse: { echeance, base, source }` par régime — pour le
      Togo : **30 avril** de l'année suivant la clôture, avec sa référence au LPF.
- [ ] AC-2 — La date est **dérivée de la clôture de l'exercice du dossier**, jamais d'une année
      civile en dur.
- [ ] AC-3 — Un régime **sans** dépôt de liasse (TPU libératoire) rend `null` — et l'écran
      n'invente rien, comme pour les acomptes d'IS.
- [ ] AC-4 — L'échéance accompagne le jeu d'états (`echeanceDepot`, `joursRestants` signé) : c'est
      là qu'on regarde une date d'arrêté.
- [ ] AC-5 — ⚠️ Le **calendrier fiscal complet** appartient au module Fiscalité (STORY-315/316,
      sprint 25). Cette story publie **une** échéance, dérivée du paquet, **calculée à la lecture** —
      même patron « jetable sans dette » que l'échéance minimale du portefeuille.
- [ ] AC-6 — ⚠️ Validation par un fiscaliste togolais avant mise en production, comme tout le
      paquet (son `_meta` le demande déjà).

## Conséquences ailleurs

- La maquette FE-034 affiche le rapprochement et le retard (**83 jours** sur le scénario de démo),
  en nommant cette story — c'est la seule information légale de l'écran, et elle vient de nulle part.
- Prérequis naturel de **STORY-446** (dépôt) : on ne constate pas un dépôt sans savoir s'il est
  dans les temps.

---

## Progress Tracking

**Statut : `done`** — PR `balance-service` **#88** (3 commits) et `bilan-service` **#85**
(2 commits) rebase-mergées sur `dev` **ensemble** le 2026-09-04 — un changement de contrat
d'événement ne s'intègre pas à moitié. Revue de code + revue de sécurité + vérification
docker du round-trip, **rejouée** après le correctif de sécurité.

Branches créées **avant** la première ligne de code :

```
docs             MNV-453
balance-service  MNV-453
bilan-service    MNV-453
```

⚠️ **Trois dépôts, pas deux** — la fiche annonçait `bilan-service · dossier-service` ;
`dossier-service` n'est pas touché (cf. le recadrage ci-dessus).

### Ce qui est livré — l'AC-4 seul, les autres étant tenus par STORY-413

- **`balance-service`** résout l'échéance **à la validation de la balance** et la joint à
  `balance.etat.document.change` sous un bloc `depotLiasse` **additif** (`schemaVersion`
  inchangé, clé omise quand elle n'a rien à dire).
- **`bilan-service`** la réplique dans `balances_balance` et la sert sur
  `GET /bilan/etats/{id}` avec ses **jours restants signés**.

### ⛔ Pourquoi l'échéance voyage RÉSOLUE, et non sous forme de calendrier

`bilan-service` ne peut pas la dériver : lignée plus ancienne du paquet fiscal (sans
`depot`) et aucun régime fiscal dans son read-model. Et il ne **doit** pas essayer — ce
serait un **second moteur pour une date légale** dont le manquement déclenche la taxation
d'office et une majoration de 40 %. Deux dérivations d'une même règle finissent corrigées
d'un seul côté : motif déjà constaté quatre fois dans ce dépôt.

`EcheanceDepotService` n'invente donc **aucune règle** : il câble `extraireCalendrierDepot`
+ `resoudreDateLimiteDepot` (STORY-413) et la cascade de régime de STORY-303
(`axesAvecRepli` + `versRegimeFiscalConnu`), dont le docstring prévoit explicitement que
les sites « ne font que la câbler ».

### ⚠️ Deux propriétés qui ne se voient nulle part ailleurs

- **La résolution ne LÈVE JAMAIS.** Une échéance est un confort de lecture ; la validation
  d'une balance est un acte comptable. Un paquet injoignable laisse la balance se valider,
  et l'événement part sans le bloc.
- **`undefined` et un `motif` ne disent pas la même chose.** Le premier : « la question n'a
  pas pu être posée » ; le second : « elle l'a été, aucune échéance n'est constatable ».
  Les confondre afficherait un incident comme une règle fiscale.

### ⚠️ Aucun cycle de modules

`FiscalModule` importe `BalanceModule` : l'inverse était impossible. Le read-model du
dossier entre donc par `forFeature` (aucune dépendance de module créée) et `AxesResolver`
par `ReadModelsModule`, la couche basse — le patron déjà utilisé dans ce fichier pour
`CompteTresorerie` et `ProfilSociete`.

### 🪝 Hooks inertes documentés

- **`GET /bilan/etats/{id}` seule résout l'échéance** — la route de l'écran de la liasse.
  Les routes d'écriture rendent `null` : leur faire lire le read-model ajouterait une
  requête à chaque acte comptable pour un champ d'affichage. Un e2e rend ce choix
  **délibéré** ; le jour où un écran en a besoin ailleurs, il rougit.
- **Le `30-04` de la majorité du portefeuille reste sans date** — `formeJuridique` manque
  au contrat `DossierEtatV1`, dette nommée par STORY-413 et toujours ouverte. Rien ne
  distingue une société d'une entreprise individuelle au réel : l'échéance sort
  `DATE_LIMITE_INDETERMINABLE`, et c'est le comportement voulu.
- **AC-6 — validation par un fiscaliste togolais** avant mise en production : hors code,
  inchangé.

### Portes de qualité (2026-09-04)

| Porte | `balance-service` | `bilan-service` |
|---|---|---|
| lint | 0 warning | 0 warning |
| build | OK | OK |
| unitaires | 3 610 | 1 813 |
| couverture | 99,13 / 92,31 / 98,66 / 99,23 | 98,83 / 94,15 / 98,79 / 98,85 |
| e2e | 884 | 503 |

⚠️ Un premier passage e2e de `bilan-service` a fait tomber `openapi-contract` ; la suite
passe en isolation et la ré-exécution complète est verte. C'est le **flake déjà documenté**
de ce dépôt (suite différente à chaque fois, toujours un refus d'authentification), sans
rapport avec ce diff.

### ⚠️ Vérification docker — le ROUND-TRIP Kafka de bout en bout

Le contrat traverse deux services : la seule preuve qui compte est le trajet complet.
Tenant réel, dossier et profil semés, exercice clos au **31/12/2026** (le paquet
`togo@2026` est le seul embarqué), régime `SYNTHETIQUE`.

| Étape | Mesure |
|---|---|
| ① `balance_service.outbox_events` après `POST …/balances/{id}/valider` | topic `balance.etat.document.change`, `schemaVersion: 1` **inchangé**, `depotLiasse: {echeance: "2027-03-31", typeContribuableRetenu: "entreprise individuelle / TPU declaratif", source: "LPF Art. 56"}` |
| **AC-2** — projection sur l'année suivant la clôture | clôture 31/12/**2026** ⇒ échéance **2027**-03-31, jamais une année civile en dur |
| ② `bilan_service.balances_balance` après relais Kafka | `etat: VALIDÉE`, `depotLiasse` identique, `echeance` stockée en **`Date`** (convertie une seule fois) |
| ③ `GET /dossiers/{id}/bilan/etats/{jeu}` | `echeanceDepot: {date: "2027-03-31…", joursRestants: 208, typeContribuableRetenu, source}` |
| **AC-4** — décompte signé, calculé à la lecture | 208 jours au 2026-09-04, cohérent au jour près |

⛔⛔ **Le premier passage a montré une projection VIDE, et ce n'était pas un bug du code** :
le conteneur `bilan-service` exécutait encore le module d'avant la story. Le message
consommé avait avancé l'offset — un `docker restart` seul ne suffit pas, il a fallu
**re-valider une nouvelle version de balance** pour produire un message neuf. C'est le
piège du hot-reload déjà fiché, dans sa variante Kafka : *l'offset consommé ne se rejoue
pas*.

⚠️ **Atomicité** : rien de neuf. `depotLiasse` est un champ de plus sur l'écriture
transactionnelle existante (transition + outbox, STORY-359/381) ; cette story n'introduit
aucun nouveau chemin d'écriture multi-documents.

### ⑥ Revue de code — 6 constats, aucun bloquant, tous corrigés

⛔⛔ **Le champ ne voyageait que par effet de bord du spread.**
`BalanceEventsService.etatDocumentChange` ne **déclarait** pas `depotLiasse` : le bloc
traversait quand même, parce qu'un `...(x ? {x} : {})` dans un littéral échappe au contrôle
des propriétés excédentaires de TypeScript. Destructurer `params` — geste banal de
nettoyage — l'aurait supprimé en laissant **build, lint et 3 603 unitaires verts**, et
`bilan-service` aurait servi `null`, que le contrat définit comme « pas d'information » :
indiscernable du cas dégradé nominal. Le champ est typé, et le segment **service → outbox**
est désormais gardé — le spec de `BalanceService` mocke l'émetteur, il ne prouvait que
l'appel. Mutation vérifiée, build vert.

⛔⛔ **Le calcul de l'échéance échappait aux seuils de couverture.** `collectCoverageFrom`
exclut les `*.dto.ts`, et les deux seules fonctions de calcul du consommateur y vivaient :
remplacer `Math.round` par `Math.floor` en retirant les cas d'heure aurait laissé la
couverture à 98,85 % pour un décompte **faux d'un jour** au voisinage de l'échéance —
c'est-à-dire un dépôt réputé « dans les temps » la veille. Le calcul vit maintenant dans
`echeance-depot.ts`, couvert.

Quatre autres, corrigés : la forme du bloc **redéclarée quatre fois** sans lien typé (un
site oublié suffisait à écrire un champ neuf en base puis à le jeter à la lecture, sans que
le compilateur dise rien) · le `forFeature(DossierDossier)` **mort** dans `BalanceModule`,
dont le commentaire justifiait une précaution devenue caduque · **trois docstrings arrachés**
à ce qu'ils documentaient, dont celui de `marquerEtat`.

⚠️ **Et le constat qu'on ne referme PAS.** La date est **figée à la validation** et rien ne
peut la re-résoudre : `VALIDÉE` est terminal, le producteur n'a aucun chemin de
ré-émission. Le jour où la rubrique `depot` sera corrigée — ce que l'**AC-6 rend attendu** —
`…/fiscal/liquidation` et `…/fiscal/tpu` serviront la date corrigée (ils résolvent à la
lecture) et `GET /bilan/etats/{id}` l'ancienne, indéfiniment, sur toutes les balances déjà
validées : deux surfaces du même produit, deux dates légales, et la fausse est celle de
l'écran de la liasse. C'est une conséquence **assumée** de la voie « publiée déjà résolue »
tranchée par l'user, désormais **nommée** dans le schéma du read-model avec son chemin de
reprise. ⚠️ Elle nuance aussi l'AC-5 : « calculée à la lecture, jetable sans dette » ne vaut
que pour `joursRestants` ; la **date**, elle, est écrite durablement.

### ⑦ Revue de sécurité — 0 vulnérabilité, un durcissement appliqué

`EcheanceDepotService` lisait `dossiers_dossier` sur le seul `dossierId` — la **seule** des
quatre lectures de la méthode à ne pas porter son tenant. Non exploitable (le
`DossierScopeGuard` a déjà croisé le couple avec l'organisation du JWT, `dossierId` est
unique globalement, et `marquerEtat` re-lit la balance org+dossier-scopée avant), mais une
lecture fail-closed ne se repose pas sur une garde en amont. Filtre complété, et le double
du test **applique** désormais le filtre au lieu de le recevoir.

Déclaré propre par la revue : pas de pollution de prototype ni d'injection NoSQL (liste
blanche de quatre clés, valeurs primitives, jamais en position d'opérateur) · le `catch`
n'avale aucune décision d'autorisation, et un artefact altéré est journalisé en `error` par
le loader **avant** d'être levé · pas de fenêtre TOCTOU (`exercice` est immuable après
création) · **toutes** les dérives du régime vont dans le sens alarmant ou absent, jamais
rassurant.

### ⑧ Vérification docker REJOUÉE après le correctif de sécurité

Le correctif change un **filtre de lecture** déjà éprouvé : la vérification a été rejouée
sur l'état final, après `docker restart` du producteur et validation d'une troisième version
de balance. Événement et projection **identiques** : `depotLiasse: {echeance:
"2027-03-31", typeContribuableRetenu: "entreprise individuelle / TPU declaratif", source:
"LPF Art. 56"}`, `schemaVersion: 1`.
