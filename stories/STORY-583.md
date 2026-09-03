# STORY-583 : Surface publique de désabonnement — jeton opaque, opposabilité immédiate, aucune lecture du carnet

Status: ready-for-dev

**Épic :** EPIC-059 — Consentement, désabonnement et droits des personnes
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-582** (registre de consentement)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-17, AR-13.

---

## Le fait

⛔ **Exactement deux préfixes sont exemptés de la validation JWT à la gateway, nommément et de manière
énumérée, jamais par un motif large** : la surface publique de désabonnement et les webhooks de
passerelle. Aucune autre route n'est publique.

⚡ **Le jeton est opaque à forte entropie**, sans aucun identifiant devinable — ni `orgId`, ni
identifiant de contact, ni séquence. Sans quoi le lien devient un outil d'**énumération des
destinataires** d'une organisation.

## Critères d'acceptation

- [ ] AC-1 — Tout message de masse porte un moyen de désabonnement **adapté au canal** (FR-N47).
      Pour l'e-mail et l'in-app : le lien public.
- [ ] AC-2 — Le jeton **ne désigne qu'un couple `(identifiantCanal, canal)`** et **n'ouvre aucune
      lecture du carnet**. Aucune donnée de contact n'est rendue par la page.
- [ ] AC-3 — ⛔ **Un jeton inconnu et un jeton révoqué rendent la même réponse.** Les distinguer
      révèle l'existence du contact. Test explicite sur les deux cas.
- [ ] AC-4 — Le désabonnement est **opposable immédiatement** (FR-N48) : l'entrée de consentement est
      écrite avant que la page réponde.
- [ ] AC-5 — AR-13 : la surface porte **son propre plafond de débit, par jeton et par IP**.
      Les deux préfixes publics sont **énumérés** en configuration de gateway, et un test de présence
      refuse tout motif large.
- [ ] AC-6 — Le gabarit de la page est **livré avec le code** — c'est la seule surface servie par ce
      service (AD-17), et son rendu emprunte le moteur de gabarits système, pas celui des modèles de
      base (AD-8).

## Notes

⚠️ **FR-N47 reste partielle jusqu'à EPIC-064.** Sur les canaux où le refus arrive comme un message
entrant — « répondez STOP » en SMS et WhatsApp — l'interception vit dans EPIC-064. L'écart est sans
effet tant qu'EPIC-063 n'est pas ordonnancé ; **il redevient bloquant le jour où il l'est**.
