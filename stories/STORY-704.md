# STORY-704 : Un message que la projection rejette toujours bloque son consommateur, et /health oscille au lieu de le dire

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** transverse — `SupervisionConsommateur` (dossier-service, assurance, microfinance, balance, bilan ; puis 702/703)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-693 (2026-10-07) — constat écarté de son périmètre, comportement antérieur.

---

## Le fait

Quand `handleMessage` rejette à chaque passage (erreur de cast, index unique secondaire…), kafkajs 2.2.4
refait 5 essais (~9 s, groupe rejoint, `/health` `up`), puis lève `KafkaJSNumberOfRetriesExceeded`,
**retriable** : `CRASH` avec `restart: true` (groupe hors groupe), relance ~5 s plus tard, `GROUP_JOIN`
(groupe rejoint), relecture du même offset — en boucle. La partition est bloquée pour de bon, mais `/health`
n'est `down` qu'une fraction de chaque cycle, et le seul signal est un `warn` toutes les ~15 s.

## Critères d'acceptation

- [ ] AC-1 — La supervision compte les `CRASH` `restart: true` successifs **sans traitement réussi** entre eux
      (remise à zéro sur un traitement réussi, pas sur `GROUP_JOIN`) ; au-delà d'un seuil documenté, journal
      `error` et groupe tenu « bloqué » dans `EtatConsommateursService`.
- [ ] AC-2 — `/health` rend `kafka: down` pour un groupe bloqué, avec un message distinct de « hors de leur groupe ».
- [ ] AC-3 — Scénario rejoué en unitaire (consommateur scripté) ; mutation qui remet le compteur à zéro sur
      `GROUP_JOIN` ⇒ rouge.
- [ ] AC-4 — Vérification docker : message injecté que la projection rejette ⇒ `/health` durablement `down`.

## Notes

- Décider du sort du message (le laisser bloquer = fail-closed, ou le marquer invalide) est hors de cette story :
  elle rend la panne **visible**, sans changer la sémantique de traitement.
- Patron commun : la correction se fait dans `dossier-service` puis se recopie dans chaque service porteur.

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-07).** Créée par la revue de STORY-693.
