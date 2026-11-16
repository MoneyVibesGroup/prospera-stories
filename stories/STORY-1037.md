# STORY-1037 : La suite de conformité de la portée et le registre des consommateurs

Status: done

**Complexité :** moyenne (un paquet publié, un registre, une vérification du manifeste)

**Épic :** EPIC-050 (la portée est publiée, et elle fait foi chez les consommateurs)
**Dépôt :** `MoneyVibesGroup/reseau-service` (paquet publié, D-L2-3)
**Plage :** groupe D, n° 8 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Dépend de STORY-1036.

---

## Pourquoi

`reseau-service` publie la portée mais ne filtre les données de personne (AD-9) : la garantie « une portée absente rend
zéro ligne » est tenue chez chaque consommateur. La spine (AD-6) impose une **suite de tests de conformité versionnée**,
jouée dans la CI de chaque consommateur, et un **registre des consommateurs conformes** sur lequel se mesure SM-3.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 8)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Six cas** : absente, vide, totale, héritée, restreinte, révoquée en vol | `CAS_DE_CONFORMITE` |
| AC-2 | **Une portée absente rend zéro ligne** ; la suite **mord** : un consommateur de référence la passe, chaque consommateur fautif rate le cas qui le vise | `src/conformite-portee.spec.ts` (5 défauts) |
| AC-3 | La suite est **publiée comme paquet** dans `reseau-service` (D-L2-3), étiquetée, copiable à l'octet | `conformite-portee-reseau-v1`, sha256 noté |
| AC-4 | **Registre des consommateurs** : un passage complet de la version courante seulement ; la vérification `consommateurs-conformes` du manifeste le lit | intégration sur MongoDB réel |
| AC-5 | **Ticket à C pour 1004** | `tickets/TICKET-BACKEND-conformite-portee-reseau-sinistres.md`, demande au journal de D |

## Décisions retenues par défaut (contestables)

- **D-1037-1 — Un adaptateur de quatre fonctions** (`reinitialiser`, `semer`, `appliquer`, `lire`) sur le **vrai**
  read-model et le **vrai** filtre du consommateur : la suite ne réimplémente rien de son côté.
- **D-1037-2 — Un fichier sans dépendance, copié à l'octet** depuis l'étiquette, comme la garde partagée de B : pas de
  registre npm privé à monter. L'empreinte (`f27799758591688e283c10e7bee04ea8ca7f3edb8c37dcd135f59e2b0851a15c`) se
  garde chez le consommateur.
- **D-1037-3 — « Révoquée en vol »** = un retrait, puis le rejeu d'un fait plus ancien (révision inférieure) : il ne
  rouvre rien. **« Restreinte »** = une portée large puis restreinte : le dernier état absolu gagne.
- **D-1037-4 — Le registre est tenu par module** (code de module, pas nom de service), par des routes de plateforme
  (`PLATFORM_ADMIN`) sous `/instance/reseau`. La vérification reçoit `modulesInstalles` du moteur (le service ne
  projette pas les droits des autres modules). Modules qui filtrent par la portée : `sinistres`, `pdv`, `stock`,
  `commande`, `terrain`, `recouvrement` (liste du service, à compléter).
- **D-1037-5 — Le service ne charge pas le paquet** (la racine de son build en serait déplacée) : il garde la version
  et les codes des cas, et un test vérifie qu'ils égalent ceux du paquet.
- **D-1037-6 — Les invariants des routes** distinguent désormais les routes de plateforme (jamais `@ExigeModule`, toujours
  sous `/instance/reseau`) des routes de tenant (organisation du jeton seulement).

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **46 suites, 434 tests** unitaires ; **13 e2e** ; build.
- MongoDB réel : **71** tests d'intégration (dont 4 du registre : partiel refusé, version périmée refusée, ROUGE puis
  VERT, tenant refusé).
- Recette depuis `origin/dev` (91b7f63, volumes neufs) : `healthy`, 71/71.
- PR reseau-service#8, `dev` 91b7f63, étiquette `conformite-portee-reseau-v1`.
