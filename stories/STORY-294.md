# STORY-294 : `auth-service` — le journal d'audit des organisations est **écrit et illisible** : lui donner sa route de lecture

**Epic :** EPIC-025 — RBAC plateforme & console
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` · **STORY-144** *(qui écrit le journal)* · **STORY-103/105** *(permissions `org:read` / `org:suspend`)* · **AP-20** *(la console qui écrit dedans sans pouvoir l'ouvrir)*
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** low sur le code — **medium sur les arbitrages**, qui sont le vrai objet de la story
**Statut :** ready-for-dev
**Assigné à :** —
**Créée le :** 2026-08-08
**Sprint :** 20
**Service :** `auth-service` (:3001)
**Branche :** `MNV-294`
**Origine :** `tickets/TICKET-BACKEND-journal-d-audit-des-organisations-non-lisible.md` — ouvert par **AP-20** à l'intégration

---

## Le défaut

`admin_audit_logs` est écrit par STORY-144 — **append-only**, dans la **même transaction** que le
changement de statut. Le journal est bien fait. Il est simplement **inatteignable** :

```
GET  /admin/organizations                        (org:read)
GET  /admin/organizations/:id                    (org:read)
POST /admin/organizations/:id/suspend            (org:suspend)   → écrit ORG_SUSPENDED
POST /admin/organizations/:id/reactivate         (org:suspend)   → écrit ORG_REACTIVATED
POST /admin/organizations/:id/resend-invitation  (user:invite)
```

Cinq routes, **aucune lecture**. La console **écrit dans un journal qu'elle ne peut pas ouvrir** : un
opérateur qui suspend une organisation produit une trace nominative immédiate et ne peut la relire par
aucun chemin — pas même l'acte qu'il vient de commettre.

⚡ **Et le manque était anticipé.** L'index posé par STORY-144 décrit *exactement* la requête que
personne ne peut faire :

```ts
// admin-audit-log.schema.ts:53-55
// Lecture naturelle du journal : « l'historique de CETTE organisation, du plus
// récent au plus ancien ».
AdminAuditLogSchema.index({ organizationId: 1, at: -1 });
```

L'index de la lecture existe. La lecture, non.

## Cause racine

**La moitié difficile a été faite, et la moitié facile est restée hors périmètre.** STORY-144 visait à
fermer l'aller simple de la suspension ; écrire la trace en était le **moyen**, pas la finalité. Le
commentaire de son propre schéma pose pourtant la question à laquelle le journal sert à répondre — *« Qui
a suspendu ce cabinet, et quand ? n'avait donc aucune réponse »* — et cette question reste sans réponse.

⚠️ **Une écriture sans lecture ne se signale nulle part** : rien n'échoue, aucun test ne rougit, la
couverture reste verte. C'est la même classe de défaut que les trois occurrences déjà relevées dans ce
dépôt *(délégation nominative jamais retombée)*, sous une forme plus discrète encore : ici, il n'y a
même pas de délégation écrite à ne pas avoir suivie.

## Un second manque, trouvé au passage

`AdminAuditLog.reason` existe, est géré par `admin-audit.service.ts` *(`...(entry.reason ? { reason } : {})`)*
et **testé** *(« sans motif : le champ `reason` est ABSENT »)*. Mais :

```ts
// admin-organizations.controller.ts
async suspend(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser)
```

**Aucune route n'accepte de corps.** Personne ne peut donc fournir de motif, et **toutes les lignes du
journal en sont dépourvues** — un champ prêt pour une information qu'aucun chemin ne permet de donner.

⚠️ C'est précisément ce qu'un lecteur d'audit cherche en premier : *pourquoi* ce cabinet a été coupé.

---

## Les arbitrages à rendre — le vrai objet de la story

### ① Que rend-on de l'acteur : un identifiant, ou une identité ?

Le document porte `actorId` *(ObjectId)*. **La console n'a aucun moyen de le résoudre** : les routes
d'annuaire sont org-scopées, et un opérateur plateforme **n'a pas d'organisation**. Trois réponses :

- **`actorId` seul** — le journal reste fidèle à ce qu'il stocke, et la console affiche un ObjectId à un
  humain. À écarter : ça ne répond pas à « qui ».
- **`actorId` + identité dénormalisée à la lecture** *(jointure sur `users` : e-mail, `firstName`,
  `lastName`)* — **probablement la bonne réponse**. Le journal reste minimal à l'écriture, la lecture
  enrichit. ⚠️ Traiter le cas de l'acteur **supprimé depuis** : rendre l'identifiant seul plutôt que de
  faire disparaître la ligne — un journal qui perd des entrées quand un compte part ne prouve plus rien.
- **Dénormaliser à l'ÉCRITURE** *(figer le nom dans le document)* — c'est la réponse d'un vrai journal
  d'audit : la trace dit qui agissait **au moment de l'acte**, et un changement de nom ne réécrit pas
  l'histoire. Plus coûteux *(migration des lignes existantes, ou tolérer deux formes)*, mais c'est la
  seule qui tienne si le journal doit avoir une valeur probante.

### ② Quel périmètre : le journal des organisations, ou celui de l'administration ?

`AdminAuditAction` ne porte aujourd'hui que `ORG_SUSPENDED` et `ORG_REACTIVATED`, et son commentaire
annonce l'extension *(« On ajoute, on ne renomme pas »)*. Deux formes possibles :

- **Org-scopée** — `GET /admin/organizations/:id/audit`. Simple, alignée sur l'index existant, sert le
  besoin d'aujourd'hui.
- **Transverse** — `GET /admin/audit?organizationId=&action=&actorId=`. Sert aussi « qu'a fait cet
  opérateur ce mois-ci », question d'exploitation qui viendra.

⚠️ **À trancher AVANT d'écrire la route, pas après** : rendre transverse une route org-scopée **déjà
consommée** coûte une migration de contrat côté console. Rien n'interdit de livrer l'org-scopée en
sachant qu'elle est un cas particulier — à condition de le dire ici.

### ③ Ouvre-t-on la saisie d'un motif ?

Si oui, `POST /:id/suspend` accepte un corps optionnel `{ reason?: string }` *(borné, assaini)* et la
console le demande dans sa confirmation. **Si non, `reason` doit être retiré du schéma** — un champ
qu'aucun chemin ne remplit est une promesse que la relecture prendra pour une donnée manquante.

---

## Périmètre

1. **Rendre les trois arbitrages**, et les consigner dans cette story *(ils sont le livrable
   principal ; le code en découle)*.
2. `GET` de lecture du journal, sous **`org:read`** — la lecture d'une trace se délègue à un support ou
   un auditeur ; `org:suspend` reste la permission d'**agir**.
3. **Paginée**, du plus récent au plus ancien *(l'index existe déjà, il n'y a rien à créer)*, plafond de
   page borné comme les autres listes admin.
4. **DTO + OpenAPI** — la console **dérive ses types** de l'OpenAPI ; une route non documentée n'est pas
   consommable par `gen:api`.
5. Tests : lecture nominale, pagination, **403 sans `org:read`**, organisation inconnue, acteur supprimé.

### Hors périmètre

- **Écrire** dans le journal — livré par STORY-144, et à ne pas retoucher.
- **Purge / rétention** du journal. ⚠️ Un journal append-only sans politique de rétention est une
  question réelle, mais c'est une décision d'exploitation, pas cette story. À porter en gap si l'arbitrage
  ② retient la forme transverse *(qui rend le volume visible)*.
- L'écran de la console — c'est **AP-24**.

---

## Critères d'acceptation

1. Une route de lecture rend l'historique d'une organisation, du plus récent au plus ancien, paginé.
2. Elle est gardée par **`org:read`** ; un porteur sans cette permission reçoit **403**.
3. L'acteur est rendu **selon l'arbitrage ①**, et le cas de l'acteur **supprimé** est traité
   explicitement — jamais par la disparition de la ligne.
4. Les **trois arbitrages sont écrits** dans cette story avec leur raison ; l'arbitrage ② dit si la route
   est un cas particulier d'une forme transverse à venir.
5. Selon l'arbitrage ③ : soit un motif peut être **fourni et relu**, soit `reason` **disparaît** du
   schéma. Pas de troisième état.
6. La route est **documentée à l'OpenAPI** et `gen:api` produit un type exploitable.
7. `lint` · `typecheck` · `build` · tests verts ; vérification **docker** sur une organisation réellement
   suspendue depuis la console *(pas sur une fixture)*.

---

## ⚠️ Le piège à ne pas rejouer

**Cette route ne déclenchera rien tant qu'une story frontend ne la nomme pas.** C'est exactement ce qui
est arrivé à STORY-144 : livrée le 2026-08-06, elle est restée **sans aucun consommateur** jusqu'à ce
qu'un audit des actions de la console la rattrape et produise AP-20.

⇒ **AP-24 est créée en même temps que cette story**, et non « quand la route sortira ». Le point de
bascule côté console est déjà en place : l'encart « Historique des décisions : à livrer » d'`AccountCard`
*(`org-detail.tsx`)* est l'emplacement exact du futur journal.

## Liens

- Ticket d'origine : `tickets/TICKET-BACKEND-journal-d-audit-des-organisations-non-lisible.md`
- `GAP-audit-organisations-non-lisible` (`sprint-status.yaml` → `open_contract_gaps`)
- **AP-24** — le consommateur frontend, à livrer après.
- **STORY-144** — écrit le journal. **STORY-292 / 293** — même bloc EPIC-025.
