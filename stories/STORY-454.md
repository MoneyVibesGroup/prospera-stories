# STORY-454 : Un brouillon créé par erreur ne s'annule pas — aucune route de suppression

> ⚠️ **Le titre d'origine ajoutait « et l'exercice est un libellé saisi ».** C'était vrai à
> la rédaction de la fiche, faux à l'ouverture du dev : STORY-381 (AC-9) l'avait déjà
> corrigé. La clause est retirée du titre et l'écart est instruit dans *Le fait*.

Status: review

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`JeuEtatsController` expose `POST /`, `GET /`, `GET /:id`, `POST /:id/recalculer`,
`POST /:id/valider`, `POST /:id/rouvrir`, `GET /:id/versions`, `GET /:id/versions/:version`.
**Aucune suppression, aucun abandon.**

### ⚠️ Une moitié de la fiche était PÉRIMÉE à l'ouverture du dev

La fiche décrivait `CreerJeuEtatsDto.exercice` comme une **chaîne saisie**, dont une frappe
(« 2O25 », « Exercice 2025 ») créait un jeu définitif. **C'est faux depuis STORY-381
(AC-9)**, livrée avant la rédaction de celle-ci : le champ `exercice` a **disparu du DTO**,
le libellé est **résolu** depuis l'exercice du dossier que la balance nomme, et l'index
unique porte sur `(tenantId, dossierId, exercice)`. L'AC-6 — « l'exercice reste un libellé
libre tant que STORY-381 AC-9 n'est pas livrée » — était donc **déjà satisfait**, et son
motif inexistant.

**Ce qui reste vrai, et qui suffit à la story** : le libellé n'est plus saisi, mais la
**balance** l'est. Ouvrir une liasse sur la mauvaise balance reste l'erreur d'un instant, et
elle **occupe le seul emplacement** que l'index unique accorde à cet exercice — le 2ᵉ essai
rend `409 EXERCICE_A_DEJA_UN_JEU`, sans aucun geste pour s'en sortir. Le scénario a changé,
l'impasse est identique. *(Mesuré en vérification docker : 409 avant la suppression, 201
après.)*

L'immuabilité s'applique aux **versions figées**, pas aux brouillons : confondre les deux fait
payer à l'utilisateur une garantie qui ne le protège de rien.

### ⚠️ La justification de l'AC-5 était inexacte — l'AC, lui, est juste

L'AC-5 dit que sans publication, « le portefeuille resterait à *bilan en cours* pour un jeu
qui n'existe plus ». Vérifié dans `portefeuille.repository.ts` : `BILAN_EN_COURS` est dérivé
de `etatBalance.etat === 'VALIDÉE'`, **pas** de l'état de la liasse — un brouillon supprimé
ne changeait donc pas l'avancement, et ne doit pas le changer. Le vrai défaut est ailleurs et
reste réel : la ligne `etats_liasse_dossier` continuait de publier `etat: BROUILLON` avec un
`jeuEtatsId` que `bilan-service` rend désormais en **404**.

## Critères d'acceptation

- [x] AC-1 — `DELETE …/bilan/etats/:id` **n'accepte qu'un `BROUILLON` n'ayant jamais été validé**
      (aucun snapshot) → sinon `409 JEU_A_DES_VERSIONS`.
- [x] AC-2 — Un jeu `VALIDE` n'est **jamais** supprimable, ni ses snapshots : c'est l'invariant.
- [x] AC-3 — La suppression est **journalisée** (`AuditType.JEU_SUPPRIME`, avec le libellé
      d'exercice dans la cible) — supprimer est un acte, il se trace.
- [x] AC-4 — `@Roles(TENANT_ADMIN)` (cohérent avec **STORY-447**).
- [x] AC-5 — L'événement `liasse.etat.change` publie la disparition, sans quoi le portefeuille
      resterait à « bilan en cours » pour un jeu qui n'existe plus (même famille que STORY-445).
- [x] AC-6 — ⚠️ **Ne corrige pas la cause.** ⛔ Son motif était **périmé** (cf. plus haut) :
      **STORY-381 AC-9 est livrée**, l'exercice n'est plus un libellé libre. L'esprit de l'AC
      est tenu tel quel — la story n'empêche pas d'ouvrir une liasse sur la mauvaise
      **balance**, elle rend cette erreur **réparable**.

## Conséquences ailleurs

- Nommée à l'écran par la maquette FE-034.
- À instruire avec **STORY-381** (le libellé d'exercice vient de `dossier-service`) : livrer les
  deux supprime le problème au lieu de le rendre réparable.

---

## Progress Tracking

**Statut : `review`** (dev + validation faits ; revue de code, revue de sécurité et merge à suivre).

### Ce qui a été livré

**`bilan-service` (producteur)** — `DELETE /dossiers/:dossierId/bilan/etats/:id`, **204**,
`@Roles(TENANT_ADMIN)` + `@CodeRefusRole(VALIDATION_RESERVEE_ADMIN)`, quatrième acte
engageant du module. Le service refuse sur `snapshots.exists({jeuEtatsId})` — **le critère
est le snapshot, jamais le statut** — puis supprime dans une **transaction** qui porte aussi
la ligne d'outbox `liasse.etat.change` en `etat: SUPPRIMEE`, `version: null`. Le dépôt
expose `supprimerSiBrouillon`, dont le filtre de garde `(tenant, dossier, statut BROUILLON)`
est désormais **extrait et partagé** avec `majSiStatut` : deux écritures gardées, un seul
filtre. Nouveau code de refus `JEU_A_DES_VERSIONS`, inscrit à l'inventaire. Nouveau type
d'audit `JEU_SUPPRIME`, **sans `contexte`** — la cible porte déjà le libellé d'exercice, et
c'est la dernière trace que le jeu ait existé.

**`dossier-service` (consommateur)** — `SUPPRIMEE` entre dans `EtatLiasseRecu` et dans la
liste acceptée par `validerLiasseEtat` : sans elle, la garde d'enveloppe rejetterait chaque
suppression en « etat inconnu », **sans qu'aucune erreur ne remonte à l'utilisateur**. La
projection écrit une **pierre tombale**, elle n'efface pas la ligne : la garde de fraîcheur
est portée par le `occurredAt` **de la ligne**, donc l'effacer laisserait un `FIGEE`
antérieur, rejoué dans le désordre, ressusciter la liasse. `avancement` n'a **délibérément
aucune branche** `SUPPRIMEE` — la branche « naturelle » (`→ BALANCE_ATTENDUE`) court avant
celle de la balance et ferait **reculer** un dossier dont la balance est validée.

### Deux écarts de fiche, instruits plus haut

1. **Prémisse périmée** — `exercice` n'est plus saisi depuis STORY-381 (AC-9). Titre corrigé,
   AC-6 requalifié, périmètre inchangé : l'impasse existe toujours, par la **balance**.
2. **Justification d'AC-5 inexacte** — `BILAN_EN_COURS` vient de la balance, pas de la
   liasse. L'AC reste juste pour une autre raison, nommée.

### ⚠️ Vérification docker — le round-trip complet, sur la base réelle

Stack `docker compose`, tenant `6a9abdb4…9bcf`, dossier `452000000000000000000001`.

| # | Mesure | Résultat |
|---|---|---|
| ① | `POST …/bilan/etats` sur une balance dont l'exercice a déjà un jeu | **409 `EXERCICE_A_DEJA_UN_JEU`** — l'emplacement est bien occupé par l'index unique réel |
| ② | `DELETE …/etats/6a9adcde…db21` (BROUILLON jamais validé) | **204**, corps vide |
| ③ | `bilan_service.jeux_etats` | le document a **disparu** (3 → 2) |
| ④ | `bilan_service.outbox_events` | +1 ligne `liasse.etat.change`, `etat: "SUPPRIMEE"`, `version: null`, bon `jeuEtatsId` et bon `dossierId` |
| ⑤ | `bilan_service.audit_events` | `JEU_SUPPRIME`, `cible.libelle: "Exercice 2026"`, `contexte: null` |
| ⑥ | `dossier_service.etats_liasse_dossier` après relais Kafka | ligne **créée**, `etat: "SUPPRIMEE"`, `occurredAt` = l'instant du producteur |
| ⑦ | **`POST` à nouveau sur la MÊME balance** | **201** — ⚡ **l'emplacement est réellement libéré**, c'est le livrable de la story |
| ⑧ | `DELETE` sur le jeu `VALIDE` de 2025 | **409 `JEU_A_DES_VERSIONS`** ; jeu et ses 2 snapshots intacts |
| ⑨ | `rouvrir` 2025 (→ `BROUILLON` **portant 2 snapshots**) puis `DELETE` | **409** — le cas piège qu'une garde sur le statut laisserait passer |
| ⑩ | Après les deux refus | **0 orphelin** : jeu présent, 2 snapshots, **1 seule** ligne d'outbox `SUPPRIMEE`, **1 seule** ligne `JEU_SUPPRIME` — un refus n'écrit rien |
| ⑩bis | Balayage global | 0 snapshot orphelin, 0 jeu d'hypothèses orphelin (leur `base` **exige** un snapshot, donc un jeu supprimable n'en porte jamais) |

⛔ **Le conteneur servait encore le module d'avant la story** au premier passage : le
watcher `nest start --watch` rate les événements sur un montage macOS. `docker compose
restart bilan-service` a suffi — piège déjà fiché, revu ici dans sa variante « contrat
Swagger périmé ».

⚠️ **Atomicité — ce qui est prouvé et ce qui ne l'est pas.** Le chemin **nominal** est
mesuré (jeu retiré **et** ligne d'outbox présents ensemble) et le chemin de **refus** aussi
(rien n'est écrit). L'abort sur échec de publication n'est pas forçable depuis l'extérieur :
il est couvert par mutation (M6 ci-dessous).

⚠️ **Non mesuré, et dit comme tel** : l'affichage du portefeuille de `dossier-service`. Ses
propres read-models sont vides pour ce tenant (KYC et dossier jamais projetés dans cette
stack) et les semer aurait fabriqué cinq documents pour lire une chaîne — c'est-à-dire
mesurer mes fixtures. La branche d'avancement est épinglée par un test sur le **vrai**
constructeur de pipeline, mutation M7 à l'appui.

🪝 **Plafond assumé, mesuré** : supprimer puis **recréer** un brouillon sur le même exercice
laisse la ligne d'aval sur `SUPPRIMEE`, nommant le jeu supprimé, **jusqu'à la validation** du
nouveau brouillon — la création n'a jamais publié d'événement. Imprécision d'affichage, pas
un état faux (`avancement` ne lit pas cette valeur). Refermer suppose de publier `BROUILLON`
**à la création**, donc de rendre `creerBrouillon` transactionnel : hors périmètre. Le
plafond et son chemin de reprise sont écrits dans `liasse-events.ts`.

### Mutation-testing — 7 mutations, 7 rouges ciblés

| # | Mutation | Test qui rougit |
|---|---|---|
| M1 | Garde sur le **statut** au lieu du snapshot | e2e « un BROUILLON ROUVERT porte ses versions » |
| M2 | `statut` retiré du filtre de suppression | dépôt « supprime le BROUILLON du tenant ET du dossier » |
| M3 | Publier `BROUILLON` au lieu de `SUPPRIMEE` | service « publie `SUPPRIMEE` DANS la transaction » |
| M4 | `SUPPRIMEE` retiré de la liste acceptée du consommateur | enveloppe « AC-5 — accepte `SUPPRIMEE` » |
| M5 | `@Roles`/`@CodeRefusRole` ouverts au collaborateur | exhaustivité « les quatre actes engageants » **et** e2e AC-4 |
| M6 | Publication déplacée **après** le commit | service « un échec de publication AVORTE la suppression » |
| M7 | Branche `SUPPRIMEE → BALANCE_ATTENDUE` ajoutée | portefeuille « aucune branche ne mentionne `SUPPRIMEE` » |

### Portes de qualité

| Porte | `bilan-service` | `dossier-service` |
|---|---|---|
| Lint (0 warning) | ✅ | ✅ |
| Build | ✅ | ✅ |
| Unitaires + couverture | ✅ 1 828 tests, seuils tenus | ✅ 1 134 tests, seuils tenus |
| e2e | ✅ 508/508 | ✅ 255/255 |

⚠️ **Les e2e de `bilan-service` échouent par intermittence en exécution PARALLÈLE, et ce
n'est pas cette story** : sur l'arbre **propre** (changements remisés), la suite complète
tombe aussi — un autre fichier, même symptôme (timeouts à 5 s, un `401` au lieu d'un `404`
sous contention JWKS). En série (`--runInBand`), 508/508 passent avec les changements.
Flakiness d'environnement préexistante, à instruire hors de cette story.
