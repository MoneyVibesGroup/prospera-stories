# STORY-705 : Recopier la détection du consommateur bloqué (STORY-704) dans les 6 autres porteurs du patron

Status: done

**Épic :** EPIC-012
**Service :** document-service, kyc-service, expert-comptable, fiscal-service, paiement-service, notification-service
**Points :** 2 · **Sprint :** S20 · **Complexité :** low · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** cadrage de STORY-704 (2026-10-08) — périmètre de 704 resserré sur les 5 services de STORY-684/693.

---

## Le fait

STORY-704 rend visible, dans dossier/assurance/microfinance/balance/bilan, un consommateur bloqué par un message
que sa projection rejette toujours (`/health` `down` durable, groupe « bloqué »). Les 6 autres services portent le
même `SupervisionConsommateur` (code identique) mais restent aveugles à cette boucle.

## Critères d'acceptation

- [x] AC-1 — Les trois fichiers du patron (`supervision-consommateur.util.ts`, `etat-consommateurs.service.ts`,
      `kafka.health.ts`) recopiés depuis `dossier-service` tels que livrés par STORY-704, avec leurs specs.
- [x] AC-2 — Mutation « remise à zéro sur `GROUP_JOIN` » ⇒ rouge, par service.
- [x] AC-3 — Vérification docker sur au moins un service par famille (compose ; paiement/notification hors compose).

## Progress Tracking

**Statut : `done` (2026-10-09).** prospera-ocr-service#22 (document-service), prospera-kyc-service#22,
prospera-expert-comptable#9, prospera-fiscal-service#20, prospera-paiement-service#79,
prospera-notification-service#60 rebase-mergées sur `dev`, branches supprimées. Scripts : `PROSPERA/tmp/705/`
(recopie adaptée aux variantes 702/703) et `tmp/verif-docker-705/`.

**Réalisation** — patron de `dossier-service@dev` (STORY-704, compteur par partition) recopié par script :
`supervision-consommateur.util.ts` identique octet pour octet dans les 11 porteurs ; `etat-consommateurs.service.ts`
et `kafka.health.ts` au même code, commentaires de chaque service préservés. Test « transmet l'exécution » (variante
STORY-702) adapté : abonnement tel quel, exécution qui délègue au traitement. Doubles de `GROUP_JOIN` de fiscal,
paiement et notification alignés sur l'événement réel de kafkajs (ils appelaient l'écouteur sans argument).

**Portes (2026-10-09)** — lint 0, build OK partout. test:cov : document 877 (99,14/94,23/98,44/99,17), kyc 516
(95,34/93,35/95,60/95,28), expert-comptable 305 (99,12/93,06/98,94/99,04), fiscal 1806 (99,37/96,93/99,12/99,67),
paiement 3877 (96,22/87,31/90,59/96,10), notification 3319 (96,64/87,66/**89,58**/96,62). test:e2e : document 182,
kyc 104, fiscal 124, notification 233 verts. ⚠️ Rouges **préexistants sur `dev`** (déjà consignés par STORY-702/703) :
e2e billing-plans d'expert-comptable (3), e2e webhook AC-4 de paiement (1, `ECONNRESET`), seuil fonctions de
notification (la story le remonte à 89,58 %). `test:e2e` de paiement réécrit `docs/recette-uj1-mesures.md` :
restauré avant push.

**Mutations (AC-2)** — 84/84 rouges (les 14 mutants de STORY-704 × 6), dont « remise à zéro sur `GROUP_JOIN` ».

**Vérif docker (AC-3, stack neuve)** — famille 702 : expert-comptable ; famille 703 : fiscal-service (Mongo dédié
`mongo-fiscal`, identifiants lus dans le conteneur). Validator impossible posé sur le marqueur d'idempotence
(`processed_kyc_events` / `processed_events`, 1re écriture de la transaction de projection), message
`kyc.status.changed` valide injecté : 2 cycles d'oscillation puis **503 durable** (31 et 32 lectures à 3 s),
journal réel `BLOQUÉ sur kyc.status.changed[0] … (KafkaJSNumberOfRetriesExceeded : Document failed validation)`,
aucun marqueur pendant le blocage ; validator retiré ⇒ `message traité, blocage levé`, 200, marqueur écrit (1).
Fiscal rend le message « bloqué(s) » dans `/health`. ⚠️ **Préexistant, hors périmètre** : le filtre d'erreur global
d'expert-comptable vide le corps des réponses 503 de `/health` (ni `details` ni message — vrai aussi pour « hors
groupe ») ; seul le statut 503 y est observable.

**Revues** — code (opus, ciblée recopie) : 0 constat ; sécurité (opus) : 0 constat.

Historique : `in_progress` (2026-10-08) — dev lancé (APEX, enchaîné après STORY-704 à la demande de l'user).
