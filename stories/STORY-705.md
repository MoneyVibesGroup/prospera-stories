# STORY-705 : Recopier la détection du consommateur bloqué (STORY-704) dans les 6 autres porteurs du patron

Status: ready-for-dev

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

- [ ] AC-1 — Les trois fichiers du patron (`supervision-consommateur.util.ts`, `etat-consommateurs.service.ts`,
      `kafka.health.ts`) recopiés depuis `dossier-service` tels que livrés par STORY-704, avec leurs specs.
- [ ] AC-2 — Mutation « remise à zéro sur `GROUP_JOIN` » ⇒ rouge, par service.
- [ ] AC-3 — Vérification docker sur au moins un service par famille (compose ; paiement/notification hors compose).

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-08).** Créée par le cadrage de STORY-704.
