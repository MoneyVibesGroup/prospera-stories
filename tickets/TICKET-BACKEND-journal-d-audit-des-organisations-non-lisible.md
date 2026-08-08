# TICKET-BACKEND — le **journal d'audit des organisations** est écrit, et aucune route ne le relit

**Cible :** `auth-service` (:3001)
**Ouvert par :** **AP-20** (barry thierno alhassane, 2026-08-07)
**Priorité :** Should — rien n'est cassé, mais une question d'exploitation reste sans réponse
**État :** ➡️ **REPRIS le 2026-08-08 par [STORY-294](../stories/STORY-294.md)** *(sprint 20, 3 pts)* ·
consommateur frontend **[AP-24](../frontend-stories/AP-24.md)** *(`blocked`, nommé en même temps)*

> ⚠️ **STORY-294 est désormais la source de vérité.** Ce fichier est conservé pour tracer l'origine et
> **ne se modifie plus** — deux sources de vérité sur le même sujet sont exactement le défaut que ce
> dépôt a déjà rencontré trois fois.
>
> ⚡ **Un TROISIÈME point de conception a été trouvé à la rédaction de la story** et ne figure pas
> ci-dessous : `AdminAuditLog.reason` existe, est géré par le service et **testé**, mais **aucune route
> n'accepte de corps** — aucune ligne du journal n'a donc de motif. Voir STORY-294 ③.

---

## Pourquoi ce ticket existe

**STORY-144 a fait la moitié difficile du travail, et c'est ce qui rend l'autre moitié frustrante.**

Le journal existe, il est bien fait, et il est cité comme un acquis dans la story elle-même :

> `admin_audit_logs`, **append-only**, écrit dans la **même transaction** que le changement de statut
> (`ORG_SUSPENDED` / `ORG_REACTIVATED`).

Le commentaire du schéma dit même exactement à quoi il sert :

```ts
// auth-service/src/modules/audit/schemas/admin-audit-log.schema.ts
// L'événement porte un **état absolu** (« cette org est SUSPENDED ») et **jamais l'acteur**.
// « Qui a suspendu ce cabinet, et quand ? » n'avait donc aucune réponse dans le […]
```

Ce ticket ne demande pas de produire la donnée. **Elle est produite, transactionnellement, depuis le
2026-08-06.** Il demande de l'exposer.

## Le constat

`admin-organizations.controller.ts` porte cinq routes. Aucune ne lit le journal :

```
GET  /admin/organizations                        (org:read)
GET  /admin/organizations/:id                    (org:read)
POST /admin/organizations/:id/suspend            (org:suspend)   → écrit ORG_SUSPENDED
POST /admin/organizations/:id/reactivate         (org:suspend)   → écrit ORG_REACTIVATED
POST /admin/organizations/:id/resend-invitation  (user:invite)
```

⚡ **La console écrit donc dans un journal qu'elle ne peut pas ouvrir.** Un opérateur qui suspend une
organisation produit une trace nominative, immédiatement, et ne peut la relire par aucun chemin — pas
même pour l'acte qu'il vient de commettre.

## Ce que la console fait en attendant

AP-20 **nomme le manque** sur la fiche organisation, encart « Historique des décisions : à livrer ».

⚠️ **Et surtout : elle n'affiche PAS l'acte de la session en cours**, alors que c'était la solution
la plus facile. Un journal qui se vide au rechargement est un journal en lequel personne ne peut avoir
confiance — il aurait donné l'apparence de la traçabilité sans en donner la propriété, et c'est pire
que de dire honnêtement qu'on ne sait pas.

## Ce qui est demandé

Une route de **lecture**, sur le périmètre déjà écrit :

```
GET /admin/organizations/:id/audit               (org:read)
    → [{ actorId, action, at }]  — paginé, du plus récent au plus ancien
```

**Deux points de conception à trancher côté backend**, que le frontend ne peut pas décider seul :

1. **`actorId` ou l'identité de l'acteur ?** Un identifiant technique ne répond pas à « qui ». La
   console n'a **aucun moyen de résoudre un `userId` d'opérateur plateforme** en nom : les routes
   d'annuaire sont org-scopées, et un opérateur plateforme n'a pas d'organisation. Servir l'e-mail ou
   `firstName`/`lastName` à côté de l'identifiant éviterait à la console d'inventer un chemin.
2. **Le périmètre du journal.** `admin_audit_logs` est-il destiné à ne porter que les changements de
   statut d'organisation, ou à recevoir d'autres actes d'administration *(octrois, décisions KYC)* ?
   La réponse change la forme de la route — org-scopée comme ci-dessus, ou transverse avec un filtre.
   ⚠️ La trancher **avant** d'écrire la route : rendre transverse une route org-scopée déjà consommée
   coûte une migration de contrat.

## Ce qui se rallume côté console quand ce ticket est repris

Le remplacement de l'encart par le journal, sur la fiche organisation — travail cadré et court. Le
point de bascule est unique et déjà en place :

```tsx
// src/features/orgs/components/org-detail.tsx — AccountCard
```

⚠️ **Ne pas refermer ce ticket en livrant seulement la route** : tant qu'aucune story frontend ne la
**nomme**, elle ne déclenche rien. C'est le défaut de chaînage qui a laissé STORY-144 sans consommateur
pendant tout son cycle de vie — AP-20 n'existe que parce qu'un audit des actions de la console l'a
rattrapé après coup.
