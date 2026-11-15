# TICKET backend : la liste des membres ne dit pas leur rôle métier, donc aucun écran ne peut dire qui peut déposer

**Type :** contrat incomplet. Le droit existe et s'applique ; il est invisible.
**Dépôt :** `prospera-auth-service`. **Tenu par :** groupe B (passation de A, `456035f`, `PLAN-4-SESSIONS-2026-11-14.md` §2).
**Découvert par :** le relevé du front cabinet du 2026-11-15 (`tri-frontend-fevrier-2026-11-15.md` §5).
**Ouvert par :** groupe A, 2026-11-15.
**Bloque :** **FE-115** (les rôles du cabinet), classée en février.
**Priorité :** Must pour février.
**Statut :** ouvert.

---

## Le problème

Depuis STORY-902, le droit de déposer est `fiscalite:declaration:deposer`, porté par `CAB_ASSOCIE` et non par
`CAB_COLLABORATEUR`. Un membre sans `tenantRole` reçoit un rôle **par défaut** selon son rôle d'organisation
(`TENANT_ADMIN` ⇒ `CAB_ASSOCIE`, `TENANT_USER` ⇒ `CAB_COLLABORATEUR`), puis la **surcharge** du rôle s'applique.

Or `UserResponseDto` (`src/modules/users/dto/user-response.dto.ts`, `origin/dev` `f29e902`) ne publie que `role` et
`platformRole`. Le front ne peut donc afficher le rôle métier effectif d'aucun membre. Le déduire de `role` est faux
dès qu'un rôle est attribué (`PUT /organizations/me/members/{userId}/tenant-role`) ou surchargé. La fiche de 902 le
relève déjà (« sans rôle métier » faux).

## Ce qui est attendu

Dans `GET /users` (et `GET /users/{id}`), pour chaque membre :

- le rôle métier **effectif** (code et libellé), en précisant s'il est **attribué** ou **par défaut** ;
- si possible, les droits `fiscalite:*` effectifs après surcharge, pour que l'écran n'ait pas à recalculer la
  surcharge.

Rien ne change au jeton : c'est la réponse de la liste qui manque.

## Critères

1. Un membre `TENANT_ADMIN` sans `tenantRole` est publié `CAB_ASSOCIE`, **par défaut**.
2. Un membre auquel on a attribué un rôle composé est publié avec ce rôle, **attribué**.
3. Une surcharge qui retire `deposer` à `CAB_ASSOCIE` se voit dans les droits effectifs publiés.
4. Le DTO est décoré pour l'OpenAPI (le front génère ses types).
