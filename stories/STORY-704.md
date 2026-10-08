# STORY-704 : Un message que la projection rejette toujours bloque son consommateur, et /health oscille au lieu de le dire

Status: done

**Épic :** EPIC-012
**Service :** dossier-service, assurance-service, microfinance-service, balance-service, bilan-service (`SupervisionConsommateur` + `EtatConsommateursService` + `KafkaHealthIndicator`)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-693 (2026-10-07) — constat écarté de son périmètre, comportement antérieur.

---

## Le fait

Quand `handleMessage` rejette à chaque passage (erreur de cast, index unique secondaire…), kafkajs 2.2.4
refait 5 essais (~9 s, groupe rejoint, `/health` `up`), puis lève `KafkaJSNumberOfRetriesExceeded`,
**retriable** : `CRASH` avec `restart: true` (groupe hors groupe), relance ~5 s plus tard, `GROUP_JOIN`
(groupe rejoint), relecture du même offset — en boucle. La partition est bloquée pour de bon, mais `/health`
n'est `down` qu'une fraction de chaque cycle, et le seul signal est un `warn` toutes les ~15 s.

## Périmètre

**Inclus** — les trois fichiers du patron, dans les 5 services qui l'ont reçu par STORY-684/693 :
`src/kafka/supervision-consommateur.util.ts` (code identique dans les 5), `src/kafka/etat-consommateurs.service.ts`,
`src/health/indicators/kafka.health.ts`, et leurs specs. **Aucun bootstrap n'est touché** : le signal
« traitement réussi » est pris par la supervision elle-même, en enveloppant `execution.eachMessage`
(et `eachBatch`) qu'elle reçoit déjà.

**Hors périmètre** —
- les 6 autres porteurs du patron (document, kyc, expert-comptable — STORY-702 ; fiscal, paiement,
  notification — STORY-703) : **STORY-705**, recopie à l'identique une fois le patron fixé ici ;
- le **sort du message** (le laisser bloquer = fail-closed, ou le marquer invalide / DLQ) : cette story rend la
  panne **visible**, sans changer la sémantique de traitement ni l'avancement des offsets.

## Décisions

- **D-704-1 — on ne compte que les `CRASH` précédés d'un échec de traitement.** Un `CRASH` d'infrastructure
  (broker perdu, rééquilibrage) sur un consommateur inactif n'est pas un blocage par message : le compter
  ferait passer pour « bloqué » un groupe qui n'a simplement rien à lire. Un tel crash ne compte pas et ne
  remet pas non plus le compteur à zéro. Le `restart` du crash est indifférent : un crash `restart: false`
  relancé par la supervision relit le même offset, c'est la même boucle.
- **D-704-2 — remise à zéro sur un traitement réussi, jamais sur `GROUP_JOIN`.** Un message ignoré pour
  enveloppe invalide est un traitement réussi (le handler se résout, l'offset avance).
- **D-704-3 — seuil : 3 crashs consécutifs** (`SEUIL_DE_BLOCAGE_PAR_DEFAUT`), soit ~45 s de boucle kafkajs
  (5 essais ≈ 9 s + relance ≈ 5 s par cycle) avant `/health` `down` durable. En dessous, un échec transitoire
  (Mongo qui redémarre) se résorbe sans alerte ; au-delà, journal `error` à chaque crash.
- **D-704-4 — tout est tenu par partition (`topic[partition]`)** (revue ⑥) : kafkajs 2.2.4 pousse ensemble les
  lots de toutes les partitions d'un fetch et poursuit les suivants après un rejet (`workerQueue` → `allSettled`).
  Un compteur par groupe était remis à zéro par le trafic sain d'un AUTRE topic du même groupe — la plupart des
  groupes en suivent plusieurs — et le blocage n'aurait jamais été vu. Le groupe est « bloqué » dès qu'une de ses
  partitions atteint le seuil ; un succès sur une autre partition ne le lève pas.
- **D-704-5 — `GROUP_JOIN` oublie les partitions qui ne sont plus assignées au membre** (revue ⑥) : un
  rééquilibrage les a confiées à un autre membre, qui les comptera lui-même ; sans cela, un membre garderait un
  compteur (ou un échec armé sans `CRASH`) sur une partition partie, et un crash d'infrastructure ultérieur le
  ferait passer « bloqué » à tort. La partition encore assignée garde son compteur (D-704-2 tient).
- **D-704-3 bis — l'état « bloqué » est distinct de l'adhésion** dans `EtatConsommateursService` :
  `GROUP_JOIN` remet « rejoint » mais ne lève pas « bloqué ». Seul un traitement réussi le lève (journal `log`).

## Critères d'acceptation

- [x] AC-1 — La supervision compte les `CRASH` successifs précédés d'un échec de traitement **sans traitement
      réussi** entre eux (remise à zéro sur un traitement réussi, pas sur `GROUP_JOIN`) ; au-delà du seuil
      documenté, journal `error` et groupe tenu « bloqué » dans `EtatConsommateursService`.
- [x] AC-2 — `/health` rend `kafka: down` pour un groupe bloqué, avec un message distinct de « hors de leur
      groupe » (`groupesBloques` dans les détails).
- [x] AC-3 — Scénario rejoué en unitaire (consommateur scripté) ; mutation qui remet le compteur à zéro sur
      `GROUP_JOIN` ⇒ rouge.
- [x] AC-4 — Vérification docker : message que la projection rejette toujours ⇒ `/health` durablement `down`
      (« bloqué »), puis levée de l'obstacle ⇒ traitement ⇒ `up`.

## Notes

- Patron commun : la correction se fait dans `dossier-service` puis se recopie dans chaque service porteur.
- AC-4 sans artifice dans le code : le rejet permanent est obtenu en posant au mongosh un `validator`
  impossible sur la collection du read-model visé (`collMod`) — chaque écriture de la projection échoue,
  exactement comme un index unique secondaire ou un cast refusé.

## Progress Tracking

**Statut : `done` (2026-10-08).** prospera-dossier-service#41, prospera-assurance-service#16,
prospera-microfinance-service#18, prospera-balance-service#129, prospera-bilan-service#166 rebase-mergées sur
`dev`, branches supprimées. Scripts : `PROSPERA/tmp/704/` (recopie, mutations, portes) et `tmp/verif-docker-704/`.

**Réalisation** — patron écrit dans `dossier-service`, recopié par script (`tmp/704/recopier.py`) dans les 4
autres : `supervision-consommateur.util.ts` identique octet pour octet dans les 5, `etat-consommateurs.service.ts`
et `kafka.health.ts` au même code (commentaires propres à chaque service). Aucun bootstrap touché.

**Portes (état final, 2026-10-08)** — lint 0, build OK, test:cov et test:e2e verts : dossier 1810 + 351
(99,48/94,97/98,64/99,59), assurance 2141 + 340 (99,62/94,89/99,24/99,67), microfinance 2848 + 594
(99,38/95,77/98,53/99,40), balance 5047 + 1788 (99,33/93,37/99,14/99,45), bilan 11720 + 3289
(99,43/97,09/99,58/99,52). `supervision-consommateur.util.ts` à 100 % partout.

**Mutations (AC-3)** — 70/70 rouges (14 × 5) sur l'état final : remise à zéro sur `GROUP_JOIN` (AC-3),
`GROUP_JOIN` qui lève le blocage, crash d'infrastructure compté, succès qui ne remet pas à zéro, `marquerBloque`
retiré, `/health` qui ignore les bloqués, échec non observé, seuil décalé, compteur par topic (partition ignorée),
réussite qui ne désarme pas l'échec, réassignation ignorée, seuil non validé, bloqué aussi listé hors groupe, levée
alors qu'une partition reste au seuil. (1re passe sur le patron initial : 40/40.)

**Vérif docker (AC-4, stack neuve `down -v`, dossier-service, code de la branche confirmé dans `src/` et `dist/`)**
— validator impossible posé au mongosh sur `orgkycstatuses`, message `kyc.status.changed` valide injecté
(23:51:24). Sonde `/health` toutes les 3 s : oscillation pendant les 2 premiers cycles (503/200), puis **503
« Consommateur(s) bloqué(s) par un message rejeté à chaque passage : dossier-kyc. » durable** de 23:52:25 à
23:54:06 (30 lectures, aucune `up`). Journal réel : `BLOQUÉ sur kyc.status.changed[0] … (KafkaJSNumberOfRetriesExceeded
: Document failed validation)`. Pendant le blocage : `orgkycstatuses` 0, `processed_kyc_events` 0 (transaction
annulée, aucun orphelin). Validator retiré ⇒ `message traité, blocage levé`, `/health` 200, `orgkycstatuses` 1
(`APPROVED`), `processed_kyc_events` 1. Stack arrêtée.

**Revue de code (⑥)** — scan opus + lentilles ECC + ponytail. 6 constats retenus, corrigés dans un commit dédié :
(1) **bloquant** — compteur par groupe remis à zéro par le trafic sain d'un autre topic du groupe (kafkajs poursuit
les lots après un rejet) ⇒ D-704-4, compteur par partition ; (2) partition réassignée gardant son compteur ⇒ D-704-5 ;
(3) `seuilDeBlocage` non borné ⇒ entier ≥ 1 exigé ; (4) groupe bloqué listé aussi « hors groupe » le temps d'une
relance ⇒ dit seulement bloqué ; (5) tests manquants (échec rattrapé puis crash d'infra, journal de levée non
filtré, `groupesBloques` absent du cas hors groupe seul) ; (6) JSDoc dupliqué par le script de recopie (4 services).
Écartés : test contre le vrai runner kafkajs (couvert par l'AC-4) ; ponytail `eachBatch` (aucun appelant, gardé :
6 lignes qui évitent un trou silencieux) et fusion `estBloque`/`marquerDebloque` (cosmétique).

**Revue de sécurité (⑦)** — 0 constat (noms de groupes déjà exposés par `/health`, cause d'erreur déjà
journalisée, vecteur « message empoisonné » préexistant, clés bornées par les partitions assignées).

Historique : `in_progress` (2026-10-08) — cadrage (APEX) : périmètre resserré sur les 5 services du champ
`service` de `sprint-status.yaml`, recopie dans les 6 autres porteurs renvoyée à STORY-705 ; décisions
D-704-1 à 3 bis.
