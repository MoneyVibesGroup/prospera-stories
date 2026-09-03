# STORY-572 : Read-models, gate d'accès et permissions déclarées au catalogue

Status: ready-for-dev

**Épic :** EPIC-054 — Socle `notification-service`, carnet de contacts et cloisonnement
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-570** (scaffold) · **STORY-140** (catalogue de permissions plateforme, livrée)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-18, AR-14.

---

## Le fait

Le gate est `emailVerified` (claim du jeton) + `OrgKycStatus == APPROVED` + entitlement notification
`ACTIVE`, **tous lus des read-models locaux**. Aucun appel réseau sur le chemin d'autorisation : une
autorisation qui dépendrait de la disponibilité d'un autre service tombe avec lui.

⚠️ **Cette story porte deux choses que son titre ne dit pas, et qui n'ont aucun autre porteur dans le
bloc 1** : FR-N54 (une organisation configure ses passerelles sans voir celles d'une autre) et AR-14
(secrets de passerelle chiffrés). Les laisser à EPIC-060 les ferait arriver **après** la première
passerelle configurée.

## Critères d'acceptation

- [ ] AC-1 — Gate `@RequiresNotificationAccess` : `emailVerified` → KYC `APPROVED` → entitlement
      `ACTIVE`, **dans cet ordre**, comme les modules existants. Read-models locaux uniquement.
- [ ] AC-2 — Le cloisonnement vient de l'`orgId` du **jeton signé**, jamais du corps de requête.
      Une ressource hors organisation répond **`404`, jamais `403`** (anti-énumération).
- [ ] AC-3 — ⚡ **Les cinq droits sont déclarés au catalogue plateforme (STORY-140) et attribuables
      séparément** : rédiger un modèle · exécuter un envoi de masse · valider un envoi de masse ·
      consulter le journal · administrer les canaux. **Aucun rôle codé en dur** — un test de présence
      refuse toute énumération de rôle dans le code d'autorisation.
- [ ] AC-4 — FR-N54 : la configuration de passerelle est portée par l'organisation. Un test avec
      **deux organisations réelles** vérifie qu'aucune ne lit ni ne modifie la configuration de
      l'autre.
- [ ] AC-5 — ⛔ AR-14 : les secrets de passerelle sont chiffrés **AES-256-GCM**, clé maîtresse en
      environnement et **hors base**. Aucun chemin de lecture en clair : ni restitués par l'API, ni
      journalisés, ni présents dans une trace d'erreur (NFR-7). Prouvé par un test qui lit le
      document en base et n'y trouve pas le secret.

## Notes

- *Q6 du PRD (rôle nouveau ou permission ajoutée à un rôle existant) est délégué au découpage par
  décision produit ; la règle « attribuables séparément » tient dans les deux cas.*
