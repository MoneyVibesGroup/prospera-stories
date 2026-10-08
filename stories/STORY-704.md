# STORY-704 : Un message que la projection rejette toujours bloque son consommateur, et /health oscille au lieu de le dire

Status: in_progress

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
- **D-704-3 bis — l'état « bloqué » est distinct de l'adhésion** dans `EtatConsommateursService` :
  `GROUP_JOIN` remet « rejoint » mais ne lève pas « bloqué ». Seul un traitement réussi le lève (journal `log`).

## Critères d'acceptation

- [ ] AC-1 — La supervision compte les `CRASH` successifs précédés d'un échec de traitement **sans traitement
      réussi** entre eux (remise à zéro sur un traitement réussi, pas sur `GROUP_JOIN`) ; au-delà du seuil
      documenté, journal `error` et groupe tenu « bloqué » dans `EtatConsommateursService`.
- [ ] AC-2 — `/health` rend `kafka: down` pour un groupe bloqué, avec un message distinct de « hors de leur
      groupe » (`groupesBloques` dans les détails).
- [ ] AC-3 — Scénario rejoué en unitaire (consommateur scripté) ; mutation qui remet le compteur à zéro sur
      `GROUP_JOIN` ⇒ rouge.
- [ ] AC-4 — Vérification docker : message que la projection rejette toujours ⇒ `/health` durablement `down`
      (« bloqué »), puis levée de l'obstacle ⇒ traitement ⇒ `up`.

## Notes

- Patron commun : la correction se fait dans `dossier-service` puis se recopie dans chaque service porteur.
- AC-4 sans artifice dans le code : le rejet permanent est obtenu en posant au mongosh un `validator`
  impossible sur la collection du read-model visé (`collMod`) — chaque écriture de la projection échoue,
  exactement comme un index unique secondaire ou un cast refusé.

## Progress Tracking

**Statut : `in_progress` (2026-10-08).** Cadrage (APEX) : périmètre resserré sur les 5 services du champ
`service` de `sprint-status.yaml`, recopie dans les 6 autres porteurs renvoyée à STORY-705 ; décisions
D-704-1 à 3 bis.
