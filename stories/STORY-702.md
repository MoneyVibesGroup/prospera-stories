# STORY-702 : document-service, kyc-service et expert-comptable gardent un consommateur Kafka que kafkajs peut abandonner en silence

Status: in_progress

**Épic :** EPIC-012
**Service :** document-service, kyc-service, expert-comptable (7 consommateurs)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** découpage de STORY-693 (décision user du 2026-10-07) — relevé AC-4 de STORY-684.

---

## Le fait

kafkajs **2.2.4** : quand l'adhésion au groupe échoue, `consumer.run()` se **résout** quand même, et
`KafkaJSGroupCoordinatorNotFound` est non-retriable (`Crash` puis `Stopped`, jamais relancé). Un bootstrap
qui pose `started = true` après `await run()` perd son consommateur **en silence**, `/health` restant `up`.

## Périmètre

**Inclus** — les consommateurs du relevé de STORY-684 :
`document-service` (read-models dossier et identity, piece-extraction cahier-piece, extraction
kyc-document-uploaded), `kyc-service` (document-extract), `expert-comptable` (identity, kyc-events).

**Hors périmètre** — les autres services (STORY-693, STORY-703).

## Critères d'acceptation

- [ ] AC-1 — Chaque consommateur listé passe par `SupervisionConsommateur` + `EtatConsommateursService` : état tiré des événements kafkajs, relance d'un crash non relancé à délai croissant borné, journalisée.
- [ ] AC-2 — `/health` rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [ ] AC-3 — Test d'invariant par service (balayage des bootstraps consommateurs) ; une mutation qui
      retire la relance vire au rouge.
- [ ] AC-4 — Vérification docker par service : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Patron de référence : `SupervisionConsommateur` + `EtatConsommateursService` de `dossier-service`
  (STORY-684), tel que recopié par STORY-693.

## Progress Tracking

**Statut : `in_progress` (2026-10-08).** Branches `MNV-702` sur document-service, kyc-service,
expert-comptable. Bootstraps réécrits par les scripts de STORY-693 adaptés (`tmp/702/`) : le nom
`kyc-document-uploaded.consumer.bootstrap.ts` (point, pas tiret) a imposé d'élargir le balayage de
l'invariant à `*consumer.bootstrap.ts`.

**Portes (2026-10-08)** — lint 0, build OK, couverture : document 99,12/93,97/98,36/99,15 (851 tests),
kyc 95,13/92,76/95,25/95,07 (490), expert-comptable 99,06/92,16/98,82/98,97 (279) ; e2e document 182/182,
kyc 104/104, expert-comptable 43/46. ⚠️ Les 3 rouges sont dans `billing-plans.e2e-spec.ts` et
**préexistent sur `dev`** (rejoués sur l'arbre stashé : 3 échecs identiques) : MNV-379 a ajouté
`includedUsers`/`extraUserAmount` au plan sans mettre l'e2e à jour. Hors périmètre, signalé.

**Mutations (AC-3)** — 12/12 rouges (4 par service) : relance de crash retirée, relance d'échec de
démarrage retirée, `/health` qui ignore les groupes hors groupe, un bootstrap qui ne démarre plus sa
supervision (côté document : le fichier à POINT, preuve que le balayage élargi le voit).

**Vérif docker (AC-4, stack neuve)** — services démarrés sans broker : 7/7 consommateurs en
`démarrage en échec … relance n°k dans 1000→30000 ms`, `/health` 503. Kafka démarré : 7/7
`groupe … rejoint`, `/health` 200 sur les 3 services en ≤ 60 s, `kafka-consumer-groups --state` : 7 groupes
`Stable`, 1 membre. Fenêtre d'adhésion (AC-2) : `kyc-service` redémarré broker joignable, sondé toutes les
0,3 s ⇒ 503 « Consommateur(s) hors de leur groupe : kyc-document-extract. » puis 200.

Historique : `ready-for-dev` (2026-10-07), créée par le découpage de STORY-693.
