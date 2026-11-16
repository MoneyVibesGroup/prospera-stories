# STORY-1031 : Gate, read-models et cloisonnement de `reseau-service`

Status: done

**Complexité :** moyenne (trois read-models, la garde complète, une outbox)

**Épic :** EPIC-044 (socle `reseau-service`, capacité partagée et cloisonnement)
**Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 2 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Dépend de STORY-1030.

---

## Pourquoi

La spine (AD-10) veut une garde qui exige `emailVerified`, le KYC `APPROVED` et le droit `ACTIVE`, **lus dans les
read-models locaux, jamais interrogés à chaud**. La portée, le journal et les commerciaux ont besoin d'un annuaire
(`identity.*`) et d'une outbox transactionnelle. Le cloisonnement par organisation (FR-R39, NFR-5) doit être tenu
par un contrôle, pas par la discipline de chaque route.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 2)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | La garde refuse **403 `KYC_NOT_APPROVED`** quand le KYC de l'organisation est inconnu, en attente, en revue ou rejeté, même avec le module en service ; aucune donnée dans le corps | unitaires de la garde, e2e |
| AC-2 | Ordre des refus : e-mail → organisation du jeton → KYC → droit → lecture seule | unitaires (KYC lu avant le droit) |
| AC-3 | Read-model KYC : `kyc.status.changed` v1 projeté exactement une fois, jamais à rebours | intégration sur MongoDB réel, pile réelle |
| AC-4 | Read-model d'identité : `identity.user.*` et `identity.membership.changed` projetés ; l'annuaire ne rend que les membres de l'organisation demandée | intégration, pile réelle |
| AC-5 | `orgId` tiré du jeton seulement : un décorateur de requête ou un DTO reçu qui porte l'organisation fait échouer la suite | invariant + mutation |
| AC-6 | Outbox transactionnelle : un fait ne s'écrit que dans une transaction ; annulée, rien ne reste ; le relais publie dans l'ordre par clé, sans perte sur panne du broker, un seul relais à la fois | intégration, relais réel sur la pile |
| AC-7 | Énumérations de topics séparées (`ReseauTopic`, `PorteeTopic`), chaque topic déclaré au manifeste | `topics.spec.ts` |

## Décisions retenues par défaut (contestables)

- **D-1031-1 — L'ordre des refus est celui d'`assurance-service`** (`EMAIL_NOT_VERIFIED`, `KYC_NOT_APPROVED`,
  `<MODULE>_NOT_ENTITLED`, `ABONNEMENT_EXPIRE`), précédé du contrôle « organisation présente dans le jeton » qui
  rend `RESEAU_NOT_ENTITLED` (un opérateur plateforme sans organisation n'a aucun module). Le KYC avant le droit : un
  refus nomme d'abord ce que l'organisation doit faire elle-même.
- **D-1031-2 — Le KYC est exigé**, comme la spine (AD-10) et le plan le disent, contrairement à sinistres (D-980-3).
  À revoir au mode « sur site » (EPIC-148, agent d'instance) : une instance chez le client n'aura pas forcément de
  `kyc-service`. Question ouverte au PO, choix par défaut : KYC exigé.
- **D-1031-3 — Annuaire cloisonné.** Le port `Annuaire` ne rend l'identité d'un utilisateur que s'il appartient à
  l'organisation demandée ; sinon `null` (« utilisateur inconnu »). Un rôle inconnu de ce service est gardé tel quel :
  `auth-service` ajoute des rôles métier (STORY-942).
- **D-1031-4 — Topics sans suffixe de version sur le fil** : `reseau.portee.changed@1` du manifeste se publie sur
  le topic `reseau.portee.changed`, `schemaVersion: 1` dans l'enveloppe et l'en-tête, comme `etat-publie.changed@1`
  du moteur (`etat-publie.changed.reel`).
- **D-1031-5 — L'enveloppe des faits publiés** : `eventId`, `schemaVersion`, `occurredAt`, `organisationId` (le neuf
  écrit `organisationId`). Elle prime sur la charge : un cas d'usage ne peut pas usurper ces champs.
- **D-1031-6 — Le relais crée les topics publiés manquants** avant sa première publication : les consommateurs du
  client de Confluent (C-1004 en premier) ne voient pas un topic absent (STORY-990).
- **D-1031-7 — Une suite d'intégration contre un vrai MongoDB** (`npm run test:int`, `MONGODB_URI_TEST`) : les
  transactions, les index uniques et les courses ne se prouvent pas avec des simulacres. Sans URI, la suite échoue
  au lieu de se sauter.
- **D-1031-8 — `ConsommateurDeFaits`** factorise la mécanique des trois consommateurs (topics créés avant
  l'abonnement, `metadataMaxAge` 10 s, relance, santé) ; `appliquerUneFois` factorise le marqueur d'idempotence.

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **37 suites, 342 tests** unitaires ; **13 e2e** ; build.
- MongoDB réel : **12 tests d'intégration** (rejeu, fait plus ancien, course sur un même `eventId`, suspension avant
  inscription, annuaire cloisonné, outbox annulée et validée, ordre par clé sous panne, échec définitif, bail).
- Pile `grp-d` : trois groupes abonnés (`droits`, `kyc`, `identite`) ; KYC, inscription et appartenance publiés sur
  Kafka puis projetés ; un fait de l'outbox publié par le relais réel sur `reseau.portee.changed`, clé
  `organisation:utilisateur`, en-têtes `eventId` et `schemaVersion` ; huit topics publiés créés.
- Mutations : KYC retiré de la garde ⇒ 6 rouges ; `@Query('orgId')` ajouté à la route ⇒ invariant rouge ; blocage
  par clé retiré du relais ⇒ intégration rouge.
- Recette sur image reconstruite depuis `origin/dev` (64537b1), volumes neufs : `healthy`, trois groupes abonnés.

## Ce qui reste hors de cette story

- Le premier écrivain de l'outbox : STORY-1032 (zones et agences).
- La bascule de la garde sur l'état publié du moteur (D-1030-2).
