# STORY-684 : Au démarrage à froid, le consommateur KYC de dossier-service crashe et ne revient jamais

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** `dossier-service` (consommateur `kyc.status.changed`, groupe `dossier-kyc`)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** vérification docker de STORY-538 (2026-09-25), passe 1 — constat hors périmètre.

---

## Le fait, observé

Stack neuve (`docker compose down -v` puis `up -d`) : le consommateur `dossier-kyc` a journalisé
`[Consumer] Crash: KafkaJSGroupCoordinatorNotFound` (Kafka pas encore prêt), puis `Stopped` — et **n'a
jamais rejoint son groupe**, alors que `dossier-profil` et `dossier-etats-amont`, dans le même processus,
se sont reconnectés. Le read-model `orgkycstatuses` est resté **vide** ; tout `POST /dossiers` rendait
`403 KYC_NOT_APPROVED` à des organisations approuvées. Un `docker restart` l'a rétabli. **Intermittent** :
la passe 2 (même procédure) n'a pas crashé.

⛔ C'est l'invariant 4 (démarrage dégradé) : Kafka absent au boot ne doit rien tuer — ni le process, ni
**en silence** un consommateur.

## Critères d'acceptation

- [ ] AC-1 — Un crash de consommateur au démarrage est **relancé** (patron des deux autres groupes du
      service, à relire), avec délai croissant et journalisation.
- [ ] AC-2 — `/health` dit `kafka: down` tant qu'un consommateur attendu n'a pas rejoint son groupe.
- [ ] AC-3 — Preuve : Kafka arrêté au boot de dossier-service, puis démarré ⇒ le groupe `dossier-kyc`
      rejoint, le read-model se remplit — en docker, et par un test qui simule le crash.
- [ ] AC-4 — Relever si les autres services partagent ce démarrage de consommateur, sans les corriger ici.

## Notes

- Journal de la passe : `PROSPERA/tmp/verif-docker-538/passe-1/journal.log`.
- Voir [[STORY-538]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-538.
