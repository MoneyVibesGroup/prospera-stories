---
baseline_commit: 5073535d1fdbdf22c75f16d01b5b156e34767db4
---

# STORY-296 : Read-models locaux et gate `@RequiresFiscalAccess`

Status: defined

**Complexité :** high

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal  
**Service :** `fiscal-service`  
**Points :** 8 · **Sprint :** S22  
**Assigné à :** `vivianMoneyVibesGroupes`  
**Prérequis :** STORY-361, STORY-295 (`done`)  
**Origine :** `epics-fiscalite-2026-08-03.md` — AR-03, AR-04 ; spine fiscale AD-16.

---

## User Story

En tant que **membre d'un cabinet habilité**, je veux accéder aux capacités fiscales sans dépendre
d'un appel réseau d'autorisation, afin que le service reste utilisable même si un service voisin est
indisponible.

## Décisions issues du code réel

- Le module du catalogue se nomme **`fiscalite`**, pas `fiscal` : c'est la valeur portée par les
  packs existants de `platform-catalog-service`. Le filtre du consommateur et le read-model emploient
  cette valeur exacte.
- Le gate AD-16 comporte exactement trois paliers, dans cet ordre : claim `emailVerified`, KYC
  `APPROVED`, entitlement `fiscalite` `ACTIVE`. Le statut d'organisation et l'appartenance ne sont pas
  ajoutés comme conditions implicites.
- `identity.*` alimente les membres utiles aux futures affectations : utilisateurs
  (`registered`, `updated`, `suspended`) et appartenances (`membership.changed`). Les topics
  `identity.org.*` ne sont pas recopiés sans lecteur.
- Les contrats consommateurs sont des miroirs locaux des producteurs actuels. En particulier, une
  appartenance suspendue porte `SUSPENDED`, jamais un statut inventé, et `entitlement.changed` v2
  porte `referentiels[]` pour la résolution de paquet de STORY-297.

## Périmètre inclus

- Read-models locaux `identity_users`, `identity_memberships`, `org_kyc_status`,
  `org_fiscal_entitlements` et marqueurs `processed_events`, avec collections explicitement nommées.
- Trois consumer groups propres au service : `fiscal-identity`, `fiscal-kyc`,
  `fiscal-entitlement`; contrats Kafka locaux et démarrage dégradé avec reprise en arrière-plan.
- Projection transactionnelle : marqueur d'idempotence inséré avant l'état absolu, dans la même
  transaction MongoDB ; un rejeu n'a aucun effet.
- Lecture défensive hors des fichiers `*bootstrap*` exclus de la couverture ; poison pill invalide
  ignoré, erreur de traitement propagée pour rejeu Kafka.
- Gate global opt-in `@RequiresFiscalAccess()` ajouté après `RolesGuard`, fail-closed, avec refus
  stables `EMAIL_NOT_VERIFIED`, `KYC_NOT_APPROVED`, `FISCAL_NOT_ENTITLED`.
- Sonde authentifiée `GET /api/v1/diagnostics/fiscal-access` pour prouver le gate avant l'arrivée des
  contrôleurs métier ; la sonde d'identité technique existante reste inchangée.

## Hors périmètre

- Appel REST à `auth-service`, `kyc-service` ou `platform-catalog-service`, au boot ou par requête.
- Création ou modification des contrats producteurs ; aucun autre dépôt de service n'est modifié.
- Résolution, téléchargement, checksum ou cache d'un paquet fiscal : STORY-297.
- Dossier, implantation, obligation, déclaration, affectation ou endpoint métier fiscal.
- Backfill hors rétention Kafka et migration de données de production ; le risque de parc antérieur
  reste une opération de cutover à planifier, jamais un repli fail-open.

## Critères d'acceptation

- [ ] **AC-1 — Projection idempotente et atomique.** Les événements `identity.*`,
      `kyc.status.changed` et `entitlement.changed` mettent à jour leurs read-models en état absolu.
      Le marqueur `eventId` unique et l'écriture sont dans la même transaction ; un rejeu portant une
      charge contraire ne change aucun document.
- [ ] **AC-2 — Contrats réels et convergence.** Les topics, statuts et champs correspondent aux
      producteurs actuels. Une appartenance `SUSPENDED` est projetée, une identité plus ancienne ne
      rétrograde pas une identité plus récente et un entitlement d'un autre module est ignoré sans
      consommer son idempotence.
- [ ] **AC-3 — KYC fail-closed.** Une route `@RequiresFiscalAccess()` sans read-model KYC ou avec un
      statut différent de `APPROVED` répond **403 `KYC_NOT_APPROVED`**. Un statut futur inconnu remplace
      l'ancien `APPROVED` au lieu d'être rejeté par le consommateur.
- [ ] **AC-4 — Entitlement fiscal exact.** Seul `moduleCode: fiscalite` est projeté. Une ligne absente,
      `SUSPENDED` ou `REVOKED` répond **403 `FISCAL_NOT_ENTITLED`** ; seul `ACTIVE` ouvre l'accès. Les
      `referentiels[]`, `versionCode` et `config` restent disponibles pour STORY-297.
- [ ] **AC-5 — Ordre et branchement du gate.** La chaîne réelle d'`AppModule` est exactement
      `Throttler → JwtAuth → EmailVerified → Roles → FiscalAccess`. Retirer ou déplacer le gate rend
      un test structurel rouge. Une route sans décorateur conserve le comportement antérieur.
- [ ] **AC-6 — Zéro dépendance chaude.** Après convergence des read-models, arrêter
      `auth-service`, `kyc-service` et `platform-catalog-service` ne change pas la décision du gate
      pour un JWT encore valide ; aucun client HTTP n'existe dans ce chemin.
- [ ] **AC-7 — Démarrage dégradé.** Kafka absent au boot ne tue pas le service HTTP ; les trois
      consommateurs réessaient en arrière-plan et convergent après le retour du broker.
- [ ] **AC-8 — Persistance réelle.** Sur stack Docker neuve, des événements Kafka réels créent les
      cinq collections attendues dans `fiscal_service`, sans écriture dans `fiscal_service_audit` ;
      les indexes uniques sont présents et aucun marqueur orphelin ne subsiste après un échec forcé.

## Tâches / Sous-tâches

- [ ] **T1 — Miroiter les contrats et schémas** (AC-1, AC-2, AC-4)
  - [ ] Contrats `identity.*`, KYC et entitlement v2 recopiés depuis les producteurs.
  - [ ] Schémas snake_case et indexes uniques des quatre read-models + marqueur partagé.
- [ ] **T2 — Projeter transactionnellement** (AC-1, AC-2, AC-8)
  - [ ] Service commun marqueur-puis-écriture avec abort gardé et session sur toutes les écritures.
  - [ ] Lecteurs défensifs couverts, projections absolues et garde dernier-écrit-gagne des identités.
- [ ] **T3 — Consommer sans bloquer le boot** (AC-2, AC-7)
  - [ ] Trois consumer groups propres, `fromBeginning: true`, retry non ré-entrant et arrêt propre.
  - [ ] Donnée invalide ignorée ; erreur Mongo propagée à Kafka.
- [ ] **T4 — Câbler le gate** (AC-3 à AC-6)
  - [ ] Décorateur, guard local fail-closed et codes de refus exacts.
  - [ ] `ReadModelsModule`, ordre des `APP_GUARD` et sonde fiscale documentée Swagger.
- [ ] **T5 — Prouver** (AC-1 à AC-8)
  - [ ] Unitaires par fichier, invariants du vrai `AppModule`, e2e des paliers du gate.
  - [ ] Stack neuve, Kafka réel, Mongo réel, panne des trois services voisins et atomicité forcée.

## Table de mutations obligatoire

| ID | Mutation volontaire | Test qui doit rougir |
|---|---|---|
| M1 | rejouer le même `eventId` avec une charge contraire | idempotence : état et compteurs inchangés |
| M2 | écrire le read-model sans la `session` de la transaction | spec transactionnelle + preuve d'absence de marqueur orphelin |
| M3 | accepter un entitlement dont `moduleCode != fiscalite` | projection : aucune ligne ni marqueur |
| M4 | rejeter un futur statut KYC inconnu au lieu de le projeter | gate : l'ancien `APPROVED` doit être fermé |
| M5 | traiter `SUSPENDED` ou `REVOKED` comme actif | guard : `FISCAL_NOT_ENTITLED` exact |
| M6 | retirer `FiscalAccessGuard` des vrais `APP_GUARD` | invariant structurel du vrai `AppModule` |
| M7 | permuter `RolesGuard` et `FiscalAccessGuard` | invariant d'ordre exact de la chaîne |
| M8 | appliquer une identité plus ancienne que l'état courant | LWW : aucun recul, puis événement récent encore appliqué |

## Definition of Done

- [ ] Branches `MNV-296` issues de `main`/`dev`, PR service vers `dev`, rebase-merge.
- [ ] Story synchronisée aux trois emplacements BMAD avec `completed_date`.
- [ ] Porte unique verte : eslint, build, test:cov, test:e2e ; chaque source neuve couverte.
- [ ] M1 à M8 réellement rouges puis restaurées.
- [ ] Vérification Docker neuve : convergence Kafka, gate local services voisins arrêtés,
      persistance/indexes et atomicité Mongo réelles.
- [ ] Revue de code Codex, correctifs, re-vérification Docker et revue de sécurité Codex réalisées.
- [ ] Aucun appel synchrone inter-service, aucun secret, aucun métier de STORY-297+ anticipé.

## Notes techniques

- Références d'implémentation : `paiement-service/src/modules/read-models/` pour les trois flux et
  le gate ; `bilan-service` STORY-441 pour l'identité multi-topic et sa garde LWW corrigée.
- Une condition de fraîcheur ne doit jamais entrer dans le filtre d'un `upsert` : lire dans la
  session, comparer `lastEventAt`, puis écrire avec une clé pure, sinon un événement périmé produit
  `E11000` et bouche la partition.
- Les fichiers `*bootstrap*.ts` restent exclus de `collectCoverageFrom` à l'échelle du projet : toute
  décision de validation vit donc dans un utilitaire ou service couvert ; les bootstraps restent de
  purs tuyaux.
- Le read-model KYC conserve un statut chaîne sans enum Mongoose fermée : un statut futur inconnu doit
  fermer l'accès. Le guard est le seul endroit qui compare à `APPROVED`.

## Progress Tracking

**Statut : `defined` (2026-09-18).** Story créée depuis AR-03/AR-04/AD-16 après la clôture de
STORY-295. Branches `docs/MNV-296` et `fiscal-service/MNV-296` créées et rebasées avant le code.
Le cadrage a été confronté aux producteurs réels et aux implémentations paiement/bilan : module
catalogue `fiscalite`, appartenance `SUSPENDED`, entitlement v2 pluriel et garde LWW hors filtre
d'upsert.
