---
name: 'balance-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — capacité PARTAGÉE, relying-party de l''IdP, HUB MULTI-SOURCE de la balance canonique, producteur d''événements'
scope: 'micro-service balance-service (:3007) — SPINE RÉTROACTIVE CIBLÉE sur la surface PORTANTE : contrat de balance canonique, hub d''ingestion et ses discriminants, résolution de référentiel et artefacts, rattachement et suggestion, cahiers et agrégation, read-model d''exercice. ⛔ NE COUVRE PAS l''intégralité des 9 modules livrés'
status: 'rétroactive — écrite depuis le code livré et confrontée aux 12 écarts de contrat enregistrés (7 fermés, 1 repris, 4 OUVERTS). Les 4 ouverts convergent sur UN SEUL sujet : l''artefact référentiel'
created: '2026-08-15'
updated: '2026-08-15'
binds:
  - 'Le code livré des sprints 10→20 — STORY-077 à STORY-149, 172, 292/293'
  - 'open_contract_gaps de sprint-status.yaml (12 entrées portant ce service)'
sources:
  - 'balance-service/src/modules/balance/types/balance-canonique.ts'
  - 'balance-service/src/modules/balance/balance.validator.ts + balance.checksum.ts + balance.calculs.ts'
  - 'balance-service/src/modules/balance/ingestion/schemas/balance-ingestion.schema.ts (STORY-102)'
  - 'balance-service/src/modules/referentiel/{artifact-loader,referentiel-resolver.service,referentiel-registry}.ts'
  - 'balance-service/src/modules/read-models/entitlement.projection.service.ts (BALANCE_MODULE_CODE)'
  - 'balance-service/src/modules/suggestion/suggestion.service.ts (STORY-139)'
  - 'balance-service/src/modules/cahiers/ (saisie directe, ventilation, agrégation)'
  - 'prospera-dossier-service/src/modules/exercices/ (AD-P14 — la source de vérité de l''exercice)'
  - 'prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.6)'
companions:
  - 'prospera-stories/architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-7, AD-8 — le 4ᵉ contributeur)'
  - 'prospera-stories/stories/STORY-366.md (le module `balance` entre enfin aux packs)'
---

# Architecture Spine — balance-service *(rétroactive)*

> **Pourquoi ce document existe, et pourquoi il arrive après le code.** Le réancrage de l'écosystème
> du 2026-08-15 constate, sans le corriger : *« `balance-service` n'a toujours aucune architecture.
> ~26 écrans en production, quinze familles d'API, et pas un document. **Il est décrit par ses
> consommateurs, jamais par lui-même.** »*
>
> ⚡ **Le déclencheur n'est pas la dette documentaire, c'est une troisième extension.** `AD-7` de
> `stock-service` fait du stock un **contributeur du hub**, et la décision `origine` plutôt que
> `source` a dû être prise **en lisant le code**. Elle sera la troisième après `A_NOUVEAUX` et
> `PROVISIONS_FISCALES`. Sans document, la quatrième se décidera de la même façon.
>
> **Périmètre assumé.** Ce n'est **pas** la spine des 9 modules (30 contrôleurs, 32 schémas,
> 348 fichiers). C'est celle de la **surface portante** : ce sur quoi d'autres services s'appuient
> déjà. Ce qui n'est pas couvert est listé en fin de document, plutôt que passé sous silence.

## Ce que ce service est

**Le hub de la balance canonique.** Il ne « fait » pas la comptabilité : il **reçoit ou construit** une
balance, la **valide contre le référentiel de l'organisation**, la **scelle**, et la tient à
disposition de l'aval. Trois manières d'y arriver, une seule forme en sortie.

| Chemin | `source` | Ce que c'est |
| --- | --- | --- |
| Import Sage | `sage` | Un export d'un logiciel de saisie, normalisé au plan |
| Saisie directe | `direct` | Une balance déposée telle quelle |
| Cahiers | `ocr` | Recettes/dépenses saisies ou lues, **agrégées** en balance |

---

## Inherited Invariants

| Hérité | Source | Ce qu'il contraint ici |
| --- | --- | --- |
| **AD-P14 — l'exercice appartient au dossier** | écosystème v1.4 | ✅ **Le STATUT est lu dans `exercices_dossier`** depuis STORY-367 ; `ExerciceAtelier` vit toujours ici, mais en **repli** et pour ce qu'il est seul à savoir (AD-10) |
| **AD-P13 — le dossier est l'unité de travail** | écosystème v1.4 | ✅ La clé de la balance porte `dossierId` depuis STORY-236 ; les 6 collections filtrent dessus (AD-10) |
| **AD-P16 — lecture plateforme inter-org** | écosystème v1.6 | ⛔ **Pas de route `@PlatformReadOnly` ici** — écart ouvert (§ Non couvert) |
| Capacité partagée · entitlement `(org × module)` | P7/P8 | Code de module **`balance`** ⚠️ voir AD-3 |
| Relying-party / JWKS · Database-per-service · Outbox | écosystème | Moule commun |
| Unités mineures entières | STORY-101 | ⚠️ **XOF : zéro décimale**, et `isSafeInteger` par ligne **et** par total |

---

## Invariants & Rules

### AD-1 — La balance canonique est un CONTRAT, et il est scellé

- **Binds:** STORY-101, STORY-147 · **Prevents:** une balance altérée en transit, ou réinterprétée
- **Rule:** une balance porte `(orgId, exercice{debut,fin}, source, referentiel, version, lignes)`, et
  la clé unique est **`(orgId, exercice.debut, exercice.fin, source, version)`**.
- **Rule:** ⚡ **le checksum scelle le CONTENU MÉTIER, hors champs injectés par le serveur** (`orgId`,
  `auteur`, `horodatage`, `etat`). L'adaptateur le calcule, **le serveur le recalcule et compare**.
- **Rule:** ⚡ **l'algorithme de checksum est VERSIONNÉ, jamais muté en silence.** Le passage à quatre
  colonnes (STORY-147) a changé ce qui est scellé ⇒ `v1` **n'est jamais utilisé pour sceller une
  balance neuve**, il ne sert qu'à **re-vérifier l'existant**. ⛔ Muter l'algorithme aurait fait qu'un
  checksum ancien **ne prouve plus rien**, sans qu'aucun test ne tombe.
- **Rule:** trois états — `BROUILLON`, `VALIDÉE`, `REJETÉE` — et l'immutabilité s'attache à `VALIDÉE`.
- **Rule:** ⚠️ **une correction est une VERSION `N+1`, jamais une réécriture.** L'affectation du
  résultat empile ; c'est la dernière version qui fait foi.

### AD-2 — Deux discriminants orthogonaux : `source` (d'où ça vient) et `origine` (ce que c'est)

> ⚡ **C'est la décision la moins écrite et la plus sollicitée du service.** Elle vient d'être
> mobilisée pour la troisième fois (`stock-service` AD-7), et les deux premières fois **rien ne la
> documentait**.

- **Binds:** `SOURCES_BALANCE`, `ORIGINES_BALANCE` · STORY-087, STORY-094, `stock-service` AD-7
- **Rule:** **`source` = mode d'ACQUISITION d'une balance externe complète** — `sage`, `direct`,
  `ocr`. Elle entre dans la **clé unique** et dans le **checksum**.
- **Rule:** **`origine` = nature d'une CONTRIBUTION produite dans la plateforme** — partielle, et
  ⛔ **jamais une base de calcul**. `A_NOUVEAUX` (socle d'ouverture), `PROVISIONS_FISCALES`
  (base ⊕ écritures fiscales), **et `STOCK` à venir**.
- **Rule:** ⚡ **`origine` est OPTIONNELLE, et c'est ce qui la rend extensible sans douleur** : son
  absence est le cas courant, donc l'ajouter n'a touché **ni le checksum, ni une migration, ni le
  contrat `balance.created`**. C'est le mécanisme d'extension du hub — **le seul**.
- **Rule:** ⛔ **toute `origine` s'accompagne de SES EXCLUSIONS, chacune motivée.** Trois existent, et
  aucune n'est décorative :

  | Exclusion | Pourquoi |
  | --- | --- |
  | **Agrégation** (STORY-085) | reconnaît `A_NOUVEAUX` et **l'ajoute** aux mouvements au lieu de tout recalculer |
  | **Gel du cahier** (D-082-3) | un socle d'ouverture **n'est pas « la balance que le cahier justifie »** ; le laisser geler l'exercice qu'il ouvre rendrait la saisie impossible **dès le premier jour** |
  | **Moteur fiscal** (D-094-2) | calculer l'impôt sur une balance qui **porte déjà** la charge d'impôt est un raisonnement circulaire — c'est aussi ce qui rend le provisionnement **idempotent par construction** |

- **Rule:** ⚠️ **la définition écrite dit « dérivée d'une AUTRE BALANCE ».** `STOCK` ne l'est pas — il
  vient de mouvements physiques. **Il se comporte comme une `origine` sans correspondre à sa
  définition** ⇒ `EPIC-081` doit **élargir la définition avant d'ajouter la valeur**.
- **Rule:** ⛔ **une nouvelle `source` se justifie autrement qu'une nouvelle `origine`.** Ajouter à
  `SOURCES_BALANCE` touche **la clé unique et le checksum** ; ajouter à `ORIGINES_BALANCE` ne touche
  rien. **La question à poser n'est pas « d'où ça vient » mais « est-ce une balance complète ? »**

### AD-3 — Ce service lit `balance`, jamais `bilan` — et l'un des deux n'existait nulle part

- **Binds:** `BALANCE_MODULE_CODE`, `GAP-packs-verticaux-sans-module-balance` · **repris par STORY-366**
- **Rule:** la projection d'entitlement est **filtrée sur `moduleCode === 'balance'`**, et la gate
  `@RequiresBalanceAccess` exige **cet** entitlement. `bilan-service` fait de même avec `bilan`.
- **Rule:** ⛔ **ne JAMAIS aligner `BALANCE_MODULE_CODE` sur `'bilan'`** pour « réparer ». Les deux
  modules sont distincts ; le read-model de chaque service doit rester filtré sur le sien, **sinon les
  deux services projetteraient le même octroi**.
- **Rule:** ⚠️ **le défaut mesuré le 2026-08-11** : aucun des quatre packs ne listait `balance` ⇒
  provisionner un vertical laissait **l'Atelier fermé, pour les quatre**, avec un écran affichant
  « 6 octroyés ». ⇒ `STORY-366` sème les modules et **pose la garde** qui fait échouer la CI si un pack
  référence un module inconnu.
- **Rule:** ⚡ **règle générale qu'il faut en tirer :** *ce que la console attribue doit être ce que les
  services savent lire*. Elle a été violée **deux fois** — une fois sur la **version** du référentiel
  (STORY-292/293), une fois sur le **code de module**. Les deux fois, l'écran disait « fait ».

### AD-4 — Fail-closed sur le référentiel : jamais de défaut, jamais de repli

- **Binds:** `ReferentielResolver`, STORY-078, STORY-080
- **Rule:** le référentiel de l'organisation est lu dans le **read-model local**
  `OrgBalanceEntitlement.referentiel` — ⛔ **aucun appel réseau à `platform-catalog-service` sur le
  chemin chaud** (invariant P4/B3).
- **Rule:** ⛔ **entitlement absent ou non `ACTIVE` ⇒ refus TYPÉ, jamais un référentiel « par
  défaut ».** ⚡ C'est une **défense en profondeur** de la gate : la projection conserve le champ après
  révocation (état absolu), et des appelants **hors chemin HTTP** (jobs, recalculs) n'ont aucune gate
  au-dessus d'eux.
- **Rule:** un **point de résolution UNIQUE** répond aux deux questions — *quel référentiel comptable ?*
  et *quel paquet fiscal ?*. ⚠️ Le paquet fiscal vient encore de `PAQUET_FISCAL_PAR_DEFAUT` (D-078-5) :
  **hook centralisé, temporaire et assumé**, à remplacer par le profil société et le régime fiscal.

### AD-5 — ⛔ L'artefact fait foi ; ce qui n'y est pas ne s'invente PAS

> ⚡ **C'est ici que convergent les QUATRE écarts encore ouverts du service.** Ils n'ont pas quatre
> causes : ils en ont une.

- **Binds:** `GAP-artefact-sfd-tronque`, `GAP-sfd-bceao-2-0-octets-divergents`,
  `GAP-classes-de-gestion-non-sourcees`, `GAP-auxiliaires-fusionnes-a-l-import`
- **Prevents:** un chiffre comptable faux, plausible, et sans témoin

- **Rule:** l'artefact référentiel est chargé **par checksum vérifié** ; un artefact dont l'empreinte ne
  correspond pas au manifeste est **rejeté**, pas chargé avec un avertissement.
- **Rule:** ⛔ **une donnée comptable ne s'arbitre pas dans un `.ts`.** Chaque fois que la règle a été
  écrite en dur, elle a tenu par accident jusqu'au référentiel suivant :

  | Constante en dur | Ce qui l'a cassée | Coût mesuré |
  | --- | --- | --- |
  | `/^[0-9A-Za-z]{2,20}$/` (validité d'un compte) | Le plan de l'organisation | Comptes Sage à 8 chiffres acceptés en balance — **fermé** par STORY-146/172 |
  | `longueurCompteDetail` | Non dérivable du plan | Déclaré **au manifeste**, sourcé — **fermé** |
  | **`CLASSES_DE_GESTION = [6, 7, 8]`** | `cima-assurances@1.0` : sa classe 8 mêle gestion réelle **et** comptes de regroupement (`87`, `88`, `89`) | ⚡ **RÉSULTAT EXACTEMENT DOUBLÉ** — 280 M au lieu de 140 M — **et aucun signal** : le garde-fou rend `COMPTE_RESULTAT_NON_SOURCE` au lieu de pincer l'écart. **OUVERT** |

- **Rule:** ⛔ **le fail-open est le défaut, pas la valeur.** Un référentiel qui ne déclare pas ses
  classes de gestion doit produire un **refus explicite**, ⛔ **jamais un `[6,7,8]` de repli** — *ce
  repli est précisément ce qui rend le défaut silencieux*.
- **Rule:** ⚠️ **et l'inverse est aussi vrai : ne pas « réparer » en retirant.** La classe 8 est
  **juste pour SYSCOHADA** (D-091-3) ; l'en retirer y produirait un résultat avant HAO et avant impôt.
  ⇒ **la règle appartient au référentiel, pas au moteur** — dans les deux sens.
- **Rule:** ⚡ **la normalisation d'import ne doit jamais DÉTRUIRE une distinction qu'elle ne sait pas
  reconstituer.** `5211BOA0` et `5211ECO1` deviennent tous deux `521100` et **fusionnent** : la
  provenance disparaît de la ligne. Le rapprochement bancaire ne peut alors **pas** restituer une
  position par banque — *l'information n'existe plus*. ⛔ Et le corriger **à l'appariement** serait
  pire : *deviner une ventilation que personne n'a déclarée serait pire que le silence*.
- **Rule:** ⚠️ **le pire cas de cette famille n'émet AUCUN avertissement** : l'appariement retient
  **une** ligne (`nbComptesApparies = 1`) sur un solde pourtant **cumulé** ⇒ un cabinet à deux banques
  voit le solde des deux présenté comme celui d'une seule, **face au relevé d'une seule**.

### AD-6 — Une garde qu'on n'a pas mise en défaut n'est pas une garde

> ⚡ **Élevée au rang d'invariant parce que le service en compte TROIS occurrences.**

- **Binds:** `GAP-sfd-bceao-2-0-octets-divergents` · constat ⑤ de STORY-292 · test tautologique de STORY-149
- **Rule:** ⛔ **un test qui compare une valeur à une constante recopiée depuis un autre dépôt ne
  vérifie rien.** `referentiel-assets-coherence.spec.ts` s'intitule *« byte-identité avec
  `bilan-service` »* et compare l'asset local à une constante *« recopiée du manifeste de
  `bilan-service` »* — **qui n'y figure pas**. Il compare **la copie périmée à elle-même**.
- **Rule:** ⚠️ **son commentaire affirme le contraire de ce qu'il fait** : *« si l'un des deux services
  régénère un paquet sans l'autre, ce test tombe »*. `bilan-service` **a** régénéré (STORY-120), et le
  test est **resté vert**.
- **Rule:** ⛔ **soit la garde lit réellement la source de l'autre dépôt** (submodule, artefact de CI
  partagé), **soit l'invariant cesse d'être ANNONCÉ comme vérifié**. Un invariant faussement garanti
  est pire qu'un invariant absent : *le prochain développeur lira le commentaire, s'y fiera, et sera
  dans l'erreur sans qu'aucune CI le lui dise*.
- **Rule:** ⚡ **toute garde de ce type porte son MUTATION-TEST** : remettre l'ancien état doit faire
  virer le test au rouge. C'est la seule preuve qu'elle détecte quelque chose.

### AD-7 — La délégation nominative se vérifie AU MOMENT où on l'écrit

> ⚡ **Trois occurrences dans ce seul service.** C'est une règle de méthode, et elle a coûté des
> livraisons entières.

- **Binds:** `GAP-balance-validation-etat`, `GAP-compte-non-valide-par-referentiel`
- **Rule:** ⛔ **écrire « c'est le périmètre de X » sans vérifier dans X** produit un renvoi en boucle
  que personne ne voit. Le cas mesuré : STORY-101 délègue à « 098/099 » ; 099 délègue à « 098 » ; 098
  pose une **précondition** sur un acte qu'elle ne crée pas. ⇒ **aucune route ne faisait passer une
  balance de brouillon à validée**, alors que l'immutabilité était affichée partout.
- **Rule:** même motif sur le prédicat de compte : STORY-078 écrit *« le branchement appartient à
  STORY-085 »* ; 085 l'a branché **sur le seul chemin cahiers**. Le validateur de balance est resté sur
  sa regex.
- **Rule:** ⚡ **corollaire produit, vérifié trois fois en une semaine :** *une story backend livrée ne
  déclenche rien tant qu'une story frontend ne la NOMME pas*. Fermer un gap côté service **ne le ferme
  pas côté produit**.

### AD-8 — Le validateur est pur, et il refuse à la PREMIÈRE violation

- **Binds:** `BalanceValidator`, FR-A25, STORY-147, STORY-146
- **Rule:** **pur, aucune I/O** — donc appelable par un adaptateur **hors chemin HTTP**. Il reçoit le
  référentiel résolu ; ⛔ **il n'embarque plus aucune regex de compte**.
- **Rule:** **deux familles d'erreurs, et la distinction est tenue** : `400` pour un contenu
  **malformé** (format, doublon, montant, énumération, checksum), `422` pour l'invariant **métier**
  d'équilibre.
- **Rule:** ⚡ **DEUX équilibres, tous deux bloquants** — mouvements **et** soldes — et le message dit
  **lequel** a échoué. *Le cas que le contrat à deux colonnes laissait passer en silence est
  précisément une balance équilibrée en mouvements et déséquilibrée en soldes.*
- **Rule:** tolérance **< 1 XOF** (100 unités mineures).
- **Rule:** ⚡ **`isSafeInteger` par ligne ET par total.** Même si chaque ligne est représentable, la
  **somme** peut franchir 2^53 ⇒ on **refuse le total imprécis** plutôt que de statuer sur un équilibre
  calculé faux.
- **Rule:** **débiteur XOR créditeur** par compte (STORY-147).
- **Rule:** ⚡ **deux prédicats, deux questions** : `isCompteValide` (rattachable) ≠ `isCompteDeDetail`
  (rattachable **et** au niveau de détail). `60100000` reste **rattachable** pour la ventilation et
  cesse d'être **déposable** en balance. ⇒ **le refus a migré de l'agrégation vers la configuration**,
  là où l'utilisateur peut le comprendre.

### AD-9 — Une balance rejetée ne consomme pas la clé, et la trace ne s'efface pas

- **Binds:** STORY-102, D-102-2, NFR-A07
- **Rule:** l'ingestion écrit **une ligne par événement traité, quelle que soit l'issue** — acceptée
  (`BROUILLON`) ou refusée (`REJETÉE`), avec son `motifCode` **stable**.
- **Rule:** ⛔ **le rejet vit dans SA collection, pas comme une `Balance` en état `REJETÉE`.** Trois
  raisons, toutes structurelles : ① il **consommerait la clé unique**, et la re-soumission **corrigée
  de la même version** entrerait en collision avec le rejet qu'elle répare ; ② il polluerait
  `listByOrg` et `existeBalanceValidee`, **donc le handoff aval et la garde du cahier** ; ③ la
  traçabilité exige **les deux** issues, et `Balance` ne parle que des acceptées.
- **Rule:** ⚡ **une charge utile trop malformée pour être lue laisse quand même une trace** —
  coordonnées optionnelles. *Un rejet muet serait pire.*
- **Rule:** ⛔ **cette trace n'expire pas.** Contrairement au marqueur `ProcessedEvent` (TTL 30 j,
  purement technique), c'est **la preuve d'audit de ce que le vertical a transmis et de ce que le hub
  en a fait**.

### AD-10 — ✅ La bascule vers `dossier-service` est FAITE côté lecture ⚠️ *(deux écrivains subsistent)*

> ⚡⚡ **RÉÉCRITE le 2026-08-18 à la clôture de STORY-367.** La version précédente décrivait l'état du
> 2026-08-15 et est devenue fausse sur **cinq** de ses affirmations en trois jours (STORY-236 le 16,
> STORY-367 le 18). Elle est conservée en fin de section, datée, parce que la chronologie de cette bascule
> est ce qui explique les décisions — **pas** parce qu'elle décrit encore le système.

- **Binds:** **AD-P14** · **AD-P13** · STORY-355, STORY-356, **STORY-236**, **STORY-367**
- **Rule:** ✅ **`balance-service` n'est plus source de vérité sur le statut de l'exercice.**
  `ExercicesRepository.estClos` — **seul** point de passage de ses 6 appelants — lit le read-model
  `exercices_dossier` (alimenté par `dossier.exercice.ouvert|clos|rouvert`) et ne retombe sur
  `ExerciceAtelier` que pour les exercices que **lui seul** connaît.
- **Rule:** ⚠️ **DEUX ÉCRIVAINS SUBSISTENT, et c'est ce qu'il faut savoir avant de toucher à cette
  garde.** `RepriseService` clôt N-1 dans `exercices_atelier` **sans rien publier** (D-087-5), et `AD-P14`
  interdit de supprimer ce modèle avant la fin de la bascule. Les deux sources peuvent donc se
  contredire, et **la contradiction ne se lève pas sur le seul `statut`** : read-model `OUVERT` + local
  `CLOS` se lit à l'identique pour une **réouverture** (qui doit rouvrir) et pour une **clôture de
  reprise** (qui doit verrouiller). ⇒ arbitrage à la **date de la dernière transition**, et
  **fail-closed** sans horodatage exploitable.
- **Rule:** ⛔ **L'arbitrage se fait sur `occurredAt`, JAMAIS sur `updatedAt`.** Le second date la
  *projection* : un rejeu du topic (marqueur `ProcessedEvent` purgé au TTL 30 j, reset d'offsets) le
  réécrit à *maintenant* et **lèverait un verrou comptable** sans qu'aucune transition n'ait eu lieu.
  Le read-model porte donc l'horodatage **métier** de l'événement, soumis au même `$unset` que les autres
  optionnels pour que l'état projeté reste **absolu**.
- **Rule:** ✅ **Les écritures sont DÉGELÉES** (STORY-236 + STORY-367) : le gel du 15/08 — schéma exigeant
  `dossierId` sans aucun chemin d'écriture pour le poser — est levé, et le parcours Atelier→Bilan **en
  écriture réelle** a été vérifié en docker, case que STORY-356 avait laissée décochée.
- **Rule:** ✅ **La clé de la balance porte `dossierId`** (STORY-236) : un cabinet à N dossiers porte deux
  balances de bornes identiques pour deux sociétés différentes. Les 6 collections filtrent sur
  `(orgId, dossierId)`, 22 contrôleurs sont nichés sous `/dossiers/:dossierId` derrière
  `DossierScopeGuard` (**404**, jamais 403).
- **Rule:** ✅ **Le hub n'invente plus de rattachement** (STORY-367) : `balance.submitted` porte
  `balance.dossierId` **requis**, vérifié sur `{ dossierId, orgId }` ; le repli « Mon cabinet » est
  supprimé — il déposait la balance d'un **client** sur la société du **comptable**, *un chiffre juste sur
  la mauvaise société, sans signal*. Codes stables `DOSSIER_ABSENT`, `DOSSIER_INCONNU`, `DOSSIER_ARCHIVE`.
- **Rule:** ✅ **Le sort de la marche arrière est tranché** : celle de `balance-service` a été **retirée**
  (STORY-236), celle de `bilan-service` **bornée** (STORY-372/373 : simulation par défaut + borne
  temporelle). La fenêtre de migration est fermée des deux côtés.
- **Rule:** ⚠️ **Ce qui reste ouvert** : `bilan-service` expose toujours `POST /bilan/exercices`
  (STORY-357) — la double **écriture** inter-services n'est donc pas encore refermée là-bas, même si la
  double **lecture** l'est ici.

<details><summary>État antérieur — rédigé le 2026-08-15, conservé pour la chronologie (⛔ PÉRIMÉ)</summary>

#### AD-10 — ⚠️ La bascule vers `dossier-service` est POSÉE et NON TERMINÉE *(version du 15/08)*

- **Binds:** **AD-P14** · STORY-355, STORY-356, STORY-357
- **Rule:** ⚡ **c'est l'écart le plus dangereux du système à cette date, et il traverse ce service.**
  `dossier-service` fait foi sur l'exercice depuis STORY-355 ; le read-model `exercices_dossier` est
  **posé ici et personne ne le lit encore**, délibérément — la projection doit converger *avant* que
  STORY-357 en dépende.
- **Rule:** ⚡ **MISE À JOUR le 2026-08-15, quelques heures après la rédaction : `STORY-356` a été
  clôturée** (4 PR rebase-mergées ensemble). ⇒ `dossierId` est désormais porté par **9 schémas de ce
  service**, **`required: true` au schéma**, avec read-models `dossiers_dossier`, script de migration
  idempotent et marche arrière testée.
- **Rule:** ⛔ **ET LES ÉCRITURES SONT GELÉES.** `AC-4` a été livré **à la lettre** : le schéma **exige**
  `dossierId`, et **aucun chemin d'écriture ne le pose**. ⇒ **`STORY-236` et `STORY-367` ne sont plus
  des améliorations : ce sont les deux stories qui DÉGÈLENT le service.**
- **Rule:** ⚠️ **`STORY-356` a rempli LA DONNÉE ; elle n'a touché NI UN INDEX, NI UN FILTRE.** Vérifié
  dans `@dev` : `BalanceSchema.index({orgId, bornes, source, version}, {unique:true})` et
  `ExerciceAtelierSchema.index({orgId, bornes}, {unique:true})` sont **inchangés**, et les dépôts de
  cahiers filtrent toujours sur `orgId` seul. *Rattacher sans filtrer ne change rien de visible.*
- **Rule:** ⚠️ **une limite documentée et NON corrigée reste ouverte** : *« la marche arrière détache
  TOUT `dossierId` sans discriminer son origine — à RETIRER OU BORNER à la clôture de 236/357 »*.
- **Rule:** ⛔ **tant que 236/357 ne sont pas livrées, il existe DEUX écritures possibles pour un même
  fait** : `ExerciceAtelier` vit toujours ici, `POST /bilan/exercices` existe toujours là-bas.
- **Rule:** ⚠️ **la clé de la balance est encore `(orgId, exercice, source, version)` — SANS
  `dossierId`.** ⇒ un cabinet à N dossiers ne peut pas porter deux balances de **bornes identiques**
  pour deux sociétés différentes. **Ce n'est pas théorique** : c'est exactement le cas que `AD-P13`
  décrit comme normal (*une organisation, vingt dossiers*).
- **Rule:** ⇒ **toute story qui touche la clé de balance doit trancher ce point**, et
  **`stock-service`, qui porte `dossierId` de bout en bout (AD-6), sera le premier contributeur à s'y
  heurter**.

</details>

---

## Consistency Conventions *(observées dans le code, pas prescrites après coup)*

| Sujet | Convention |
| --- | --- |
| Collections | `balances`, `balance_ingestions` *(journal, append-only)*, `exercices_atelier`, `surcharges_rattachement`, `comptes_ventilation`, `cahiers_*`, `profils_import` |
| Montants | Entier d'unité mineure ⚠️ **XOF : zéro décimale** · `isSafeInteger` ligne **et** total |
| Refus | `ECART_EQUILIBRE`, `COMPTE_RESULTAT_NON_SOURCE`, `BALANCE_NOT_ENTITLED` — codes **stables** |
| Erreurs | `400` = malformé · `422` = invariant métier · `403` = gate |
| Index nommés | ⚡ **explicitement**, pour distinguer *quel* invariant un `E11000` a violé |
| Tri | **Total** — un tri non total fait perdre des lignes dès qu'on pagine dessus (leçon STORY-187) |

## Stack

NestJS · MongoDB (base propre) · Kafka (consommateur `balance.submitted`, `entitlement.changed`,
`kyc.status.changed`, `identity.*`, `dossier.exercice.*` *(posé, non lu)* ; producteur `balance.*`) ·
JWT RS256 en relying-party · artefacts référentiels **embarqués dans l'image**, chargés par checksum.

---

## ⛔ Ce que cette spine NE couvre PAS

Écrit pour que l'absence soit **déclarée** plutôt que découverte.

| Non couvert | Pourquoi |
| --- | --- |
| `tresorerie`, `rapprochement` | Modules livrés, **aucun consommateur externe** — hors surface portante |
| `fiscal` (moteur, provisionnement) | Décrit par `architecture-fiscal-service` **côté consommateur** ⚠️ mais `CLASSES_DE_GESTION` vit **ici** (AD-5) |
| `cahiers` en détail | Seule leur **agrégation** est portante (exclusion `A_NOUVEAUX`, AD-2) |
| `profil-societe` | ⚠️ **En migration vers `dossier-service`** (STORY-356/357) — deux propriétaires déclarés |
| Route de lecture plateforme | ⛔ **`AD-P16` n'est pas implémentée ici** — écart ouvert, non repris par une story |

## ⚡ Les 4 écarts encore ouverts, et ce qu'ils ont en commun

| Gap | Effet aujourd'hui | Ce qui le rend dangereux |
| --- | --- | --- |
| `GAP-classes-de-gestion-non-sourcees` | **Latent** — aucune organisation CIMA | ⚡ **Résultat DOUBLÉ, sans aucun signal**, à la première org CIMA |
| `GAP-auxiliaires-fusionnes-a-l-import` | **Actif** | Deux banques présentées comme une, **sans avertissement possible** |
| `GAP-sfd-bceao-2-0-octets-divergents` | **Nul** | ⚡ C'est ce qui le rend dangereux : le commentaire **affirme** une garantie que le test ne tient pas |
| `GAP-artefact-sfd-tronque` | **Nul** — reconnaissance par préfixe | La suggestion ne proposera **jamais** un compte de niveau 4 à un SFD |

> ⚡ **Les quatre disent la même chose, et c'est `AD-5` :** *l'autorité doit être l'artefact, et ce
> qu'il ne dit pas doit produire un refus — jamais une valeur de repli.* Trois d'entre eux ont un effet
> **nul ou latent** aujourd'hui, ce qui est exactement pourquoi ils sont encore ouverts : **rien ne les
> pousse**. Le premier qui se réveillera le fera sur un chiffre faux et plausible.

⚠️ **Trois des quatre exigent DEUX DÉPÔTS** : les octets de l'artefact sont ceux de `bilan-service`
(source de vérité unique, **D-078-2**) ⇒ passage par son `build.mjs`, deux régénérations, deux
checksums, **et l'effet de bord habituel sur les snapshots de liasse qui référencent le checksum**.
⛔ Ne pas les improviser dans une story de `balance-service`.
