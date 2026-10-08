# STORY-703 : Les classes de base des read-models de fiscal, paiement et notification concluent démarré à la résolution de run()

Status: done

**Épic :** EPIC-012
**Service :** fiscal-service, paiement-service, notification-service (13 consommateurs via 3 classes de base : fiscal 5, paiement 3, notification 5 dont `DeclenchementConsumer` hors `read-models/`)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** découpage de STORY-693 (décision user du 2026-10-07) — relevé AC-4 de STORY-684.

---

## Le fait

kafkajs **2.2.4** : quand l'adhésion au groupe échoue, `consumer.run()` se **résout** quand même, et
`KafkaJSGroupCoordinatorNotFound` est non-retriable (`Crash` puis `Stopped`, jamais relancé). Un bootstrap
qui pose `started = true` après `await run()` perd son consommateur **en silence**, `/health` restant `up`.

## Périmètre

**Inclus** — la classe de base de chaque service : `fiscal-service`
`src/modules/read-models/consumer-read-model.bootstrap.ts` (5 sous-classes), `paiement-service` et
`notification-service` `src/modules/read-models/consommateur-read-model.bootstrap.ts` (3 et 5 sous-classes).

**Hors périmètre** — les autres services (STORY-693, STORY-702).

## Critères d'acceptation

- [x] AC-1 — La classe de base de chaque service délègue à `SupervisionConsommateur` + `EtatConsommateursService` : toutes ses sous-classes en héritent (état tiré des événements kafkajs, relance bornée, journalisée).
- [x] AC-2 — `/health` rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [x] AC-3 — Test d'invariant par service (balayage des bootstraps consommateurs) ; une mutation qui
      retire la relance vire au rouge.
- [x] AC-4 — Vérification docker par service : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Patron de référence : `SupervisionConsommateur` + `EtatConsommateursService` de `dossier-service`
  (STORY-684), tel que recopié par STORY-693.

## Progress Tracking

**Statut : `done` (2026-10-08).** prospera-fiscal-service#19, prospera-paiement-service#78,
prospera-notification-service#59 rebase-mergées sur `dev`, branches supprimées. Portes rejouées sur l'état
final : fiscal 1782 unit + 124 e2e, paiement 3853 + 322/323, notification 3295 + 233.

**Portes (2026-10-08)** — lint 0, build OK ; couverture fiscal 99,36/96,88/99,09/99,66, paiement
96,19/87,17/90,46/96,06, notification 96,62/87,52/**89,41**/96,59. ⚠️ Deux rouges **préexistants sur `dev`**,
rejoués sur `dev` : seuil fonctions de notification (89,25 % sur `dev`, la story le remonte à 89,41 %) et l'e2e
paiement `notifications-webhook` AC-4 (`read ECONNRESET`, 1 échec identique sur `dev`). ⚠️ La variable
d'environnement de session `CLAUDE_CODE_USER_EMAIL` fait échouer `app-cablage` de notification (garde
« identifiant de passerelle e-mail ») : portes lancées sans elle. Amendements d'invariants de minuterie :
paiement (`setTimeout` autorisé dans la seule supervision, `PORTEURS_DE_RELANCE`), notification (inventaire :
la relance quitte la classe de base pour la supervision).

**Mutations (AC-3)** — 15/15 rouges (5 par service) : relance de crash retirée, relance d'échec de démarrage
retirée, `/health` qui ignore les groupes hors groupe, classe de base qui ne démarre plus sa supervision, sous-classe
qui redéfinit `onApplicationBootstrap`.

**Vérif docker (AC-4, stack neuve, `tmp/verif-docker-703/`)** — fiscal par le compose (src monté), paiement et
notification en images `runtime` de la branche sur le réseau du compose (ils n'ont pas d'entrée dans le compose
racine). Sans broker : relances `1000→30000 ms` journalisées (fiscal 55 lignes, notification 25, paiement 15),
`/health` 503 `kafka: down`. Kafka démarré : 13/13 `groupe … rejoint`, `kafka-consumer-groups --state` :
13 groupes `Stable`, 1 membre ; `/health` kafka `up` partout. Coupure/reprise du broker en cours de route :
fiscal et notification 503 puis 200, 10 adhésions cumulées chacun (relance après `CRASH` exercée en réel).
⚠️ paiement refuse de démarrer sur base neuve tant que le journal d'audit n'est pas indexé par le compte de
maintenance (garde STORY-240, attendue) : index `chaine_creance_unique` posé à la main en dev ; son `/health`
reste 503 à cause de `fournisseurs` (PI-SPI non configuré), `kafka` y est `up`.

**Revue de code (2026-10-08, opus + lentilles ECC)** — 0 bloquant ; 13 sous-classes comparées à `dev` (groupe,
topics, `fromBeginning`, handler identiques). Corrigés dans `MNV-703(revue)` : ① paiement/notification n'avaient
AUCUN test de ce que la classe de base remet à kafkajs (`fromBeginning: false`, `topics: []`, `eachMessage` inerte
restaient verts) ⇒ spec de comportement par service ; ② aucun test du groupe/des topics de CHAQUE sous-classe
(`EntitlementConsumer` lisant `kycGroupId` : 1775 verts) ⇒ table par service, configuration factice à valeurs
distinctes ; ③ le `eachMessage` remis à `run()` n'était jamais exécuté (fiscal appelait `projeter` en direct) ;
④ invariant : seul `KafkaModule` fournit `EtatConsommateursService` (une 2e instance rendrait `/health` aveugle) ;
⑤ commentaires faux (« 4 sous-classes », justification orpheline dans `PORTEURS_DE_MINUTERIE`) ; mesures de
recette régénérées par un e2e et committées par erreur, retirées. Mutations de ces tests : 5/5 rouges (deux
premiers mutants ne compilaient pas — « Tests: 0 total » — réécrits). Lentille ponytail : rien à retirer.
Écartés : message générique dans `/health` (patron commun, confiance ~40) ; titres de test déjà faux sur `dev`.

**Revue de sécurité (2026-10-08, opus)** — 0 constat (`/health` public mais derrière le throttler, n'ajoute que
des noms de groupe ; aucun SASL/secret à journaliser ; relance bornée, non ré-entrante ; handlers, groupes et
topics inchangés ; read-models d'autorisation restent fail-closed pendant le rattrapage).

Historique : `in_progress` (2026-10-08). Branches `MNV-703` sur fiscal-service, paiement-service,
notification-service. Socle copié depuis `kyc-service` (version revue de STORY-702) par `tmp/703/socle.py` ;
les 3 classes de base construisent leur `SupervisionConsommateur` (état injecté par chaque sous-classe) ;
invariant `tmp/703/invariant.py` : la base délègue, chaque `*consumer.bootstrap.ts` en hérite sans piloter
kafkajs ni redéfinir son cycle de vie. ⚠️ La 5e sous-classe de notification vit dans
`modules/declenchement/` — le balayage par nom l'a trouvée, le périmètre « read-models » l'ignorait.

Historique : `ready-for-dev` (2026-10-07), créée par le découpage de STORY-693.
