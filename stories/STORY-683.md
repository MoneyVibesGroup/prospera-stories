# STORY-683 : bilan-service sert les liasses d'un dossier à tout collaborateur de l'organisation, affecté ou non

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** `bilan-service` (`DossierScopeGuard`, read-model du dossier)
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de sécurité de STORY-538 (2026-09-25) — constat **pré-existant**, hors périmètre de 538.

---

## Le fait, mesuré dans le code (`bilan-service` `dev` `8bb2e54`)

`src/modules/read-models/guards/dossier-scope.guard.ts:116` : `findOne({ dossierId, orgId })` — la
« portée de dossier » de bilan-service **ne filtre que par organisation**. Son read-model du dossier ne
porte ni le responsable ni les contributeurs. `dossier-service`, lui, applique la portée par
collaborateur (`porteeDeLAppelant` : un collaborateur non affecté reçoit `404`).

⇒ Un `TENANT_USER` non affecté à un dossier lit chez bilan-service ses liasses, versions figées,
contrôles, piste d'audit — tout ce que dossier-service lui refuse. STORY-538 a dû contourner le trou
(portée re-vérifiée chez dossier-service) ; STORY-537 le fait aussi.

## Critères d'acceptation

- [ ] AC-1 — La portée par collaborateur est appliquée par `bilan-service` lui-même, **localement**
      (read-model des affectations alimenté par événement — invariant 2 : aucun appel synchrone sur le
      chemin chaud), fail-closed.
- [ ] AC-2 — Un collaborateur non affecté reçoit `404` sur **toutes** les routes `dossiers/:dossierId/…`,
      jamais `403` ; un `TENANT_ADMIN` garde l'accès à tous les dossiers de l'organisation (règle
      d'affectation de dossier-service, relue — jamais supposée).
- [ ] AC-3 — e2e avec jeton `TENANT_USER` non affecté sur chaque famille de routes, **mutation** de la garde.
- [ ] AC-4 — Relever les autres relying parties qui reprennent le même garde (balance-service…) et le
      dire, sans les corriger ici.

## Notes

- Voir [[STORY-538]] (revue de sécurité), [[STORY-537]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-538.
