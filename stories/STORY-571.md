# STORY-571 : Deux bases Mongo aux rôles restreints — les preuves d'envoi sont ineffaçables

Status: ready-for-dev

**Épic :** EPIC-054 — Socle `notification-service`, carnet de contacts et cloisonnement
**Service :** `notification-service` (nouveau)
**Points :** 2 · **Sprint :** S41
**Prérequis :** **STORY-570** (scaffold)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-14, AR-03, AR-18.

---

## Le fait

Les privilèges MongoDB sont **additifs et sans deny**. Un `readWrite` accordé sur la base métier
**redonne `remove`** sur une simple collection de preuves qui y vivrait : un privilège de collection
ne protège rien. Seule la séparation de **base** tient — patron `fiscal-service` AD-10, déjà repris
par `paiement-service` STORY-238.

⚡ **Les deux bases vivent sur le même réplica set `rs0`, et c'est la raison du choix, pas une
commodité.** L'entrée d'audit s'écrit dans la **même transaction Mongo** que le passage de l'`Envoi`
à `envoye` (AD-14). Une instance séparée rendrait cette transaction impossible et produirait des
remises **sans trace** exactement dans le cas qui compte : le plantage.

## Critères d'acceptation

- [ ] AC-1 — Deux bases sur `rs0` : `notification_service` (compte applicatif en `readWrite`) et
      `notification_service_preuves` (compte applicatif en **`find` + `insert` uniquement**).
      ⚠️ Nommage vérifié sur le `docker-compose` réel : `<service>_service`, jamais
      `notification` / `notification_audit`.
- [ ] AC-2 — `consentements`, `desabonnements` et `audit_envois` vivent dans la base protégée.
      Aucune de ces collections n'existe dans la base métier.
- [ ] AC-3 — ⛔ **Preuve par mutation, pas par lecture de configuration** : depuis le compte
      applicatif, un `remove` et un `update` sur `audit_envois` **échouent** contre la vraie base.
      Le test s'exécute en Docker, pas contre un doublon Mongoose.
- [ ] AC-4 — Un **second compte de maintenance**, absent de la configuration du service, porte la
      purge et la restauration. Sa chaîne de connexion n'apparaît dans aucune variable
      d'environnement lue par le service.
- [ ] AC-5 — Une transaction **multi-base** écrit dans `notification_service` et
      `notification_service_preuves` en un seul commit, prouvée en Docker sur `rs0`.
- [ ] AC-6 — Politique de sauvegarde **distincte** pour `notification_service_preuves` (AR-18),
      documentée avec sa fréquence et sa durée de rétention.

## Notes

- Un revirement de consentement est **une entrée de plus**, jamais un `update` (AD-14). L'état
  courant est la projection de la dernière entrée par `(identifiantCanal, canal, nature)`. La règle
  se pose ici parce que c'est ici que le schéma naît.
