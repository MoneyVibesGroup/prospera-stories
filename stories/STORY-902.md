# STORY-902 : Les droits `fiscalite:*` deviennent attribuables, le cabinet a ses rôles, et le mode de compatibilité prend fin

Status: done

**Complexité :** moyenne (deux services, un ordre de déploiement)

**Épic :** EPIC-025 (RBAC de tenant), au service d'EPIC-028 (droits fiscaux, STORY-300)
**Services :** `auth-service` (catalogue de tenant, socle de rôles, émission du jeton), `fiscal-service` (garde des
droits)
**Plage :** groupe A (`PLAN-4-SESSIONS-2026-11-14.md` §1), n° 5 du lot de A
**Origine :**
- **STORY-300**, qui avait laissé un mode de compatibilité (« tant qu'auth-service n'attribue aucun droit
  `fiscalite:*` : `TENANT_ADMIN` = tout, `TENANT_USER` = préparer ») ;
- **la relecture de A** du 2026-11-15 (`coordination/relecture-groupe-A-2026-11-14.md`), qui élargit la story ;
- **la question au PO**, retenue par défaut selon la règle de l'utilisateur (journal de A) : « le mode reste jusqu'à
  la fusion de STORY-902, qui y met fin ».

---

## Pourquoi

STORY-300 a posé trois droits indépendants (`fiscalite:declaration:preparer`, `…:valider`, `…:deposer`).
`auth-service` n'en attribuait aucun, donc fiscal-service **devinait** ces droits à partir du rôle. La relecture a
montré que ce mode :
- **ne laisse aucune trace** : pas de log, pas de métrique, rien au journal ;
- **bascule en tout ou rien** : un jeton sans aucun `fiscalite:*` retombe sur le rôle, et un code `fiscalite:*`
  inconnu coupe la compatibilité sans le dire.

Tant que le rôle décide, un cabinet ne peut pas confier la préparation à un collaborateur et réserver le dépôt à
l'associé signataire. C'est pourtant la raison d'être des trois droits.

## Ce que la story livre

### Dans `auth-service`

1. **Le catalogue de tenant** reçoit les trois codes fiscaux, avec leurs libellés. L'union des deux catalogues
   passe de 30 à 33 droits, sous la borne de 44 (STORY-365).
2. **Deux rôles de cabinet** au socle (`TENANT_SYSTEM_ROLES`, vertical `cabinet`), réalignés au démarrage :
   - `CAB_ASSOCIE`, « Expert-comptable associé » : préparer, valider, déposer. C'est le signataire ;
   - `CAB_COLLABORATEUR`, « Collaborateur » : préparer seulement.
3. **Un rôle métier par défaut, par vertical.** Une adhésion **sans** `tenantRole` reçoit, à l'émission du jeton,
   le rôle par défaut de son vertical :
   - dans un `cabinet`, `TENANT_ADMIN` reçoit `CAB_ASSOCIE` et `TENANT_USER` reçoit `CAB_COLLABORATEUR` ;
   - ailleurs, rien (le distributeur reçoit son rôle explicitement, `DIST_ADMIN` à l'entrée).

   Une adhésion qui porte un `tenantRole` garde le sien, et la **surcharge** de l'organisation (STORY-167)
   s'applique au rôle par défaut comme à tout rôle du socle. Personne ne perd l'accès : un cabinet obtient
   exactement ce que la compatibilité lui donnait, mais en vrais droits, portés par le jeton, visibles et
   modifiables.
4. **La borne du jeton, relecture de 365** :
   - les DTO de composition de rôle passent de `@ArrayMaxSize(50)` à la borne (44) ;
   - la connexion et le rafraîchissement hors borne sont **testés** : à la connexion, aucune session n'est créée ;
     au rafraîchissement, aucune rotation n'a lieu ;
   - le refus est **journalisé** avec l'utilisateur, l'organisation et le nombre de droits.

### Dans `fiscal-service`

5. **Fin du mode de compatibilité.** Seuls les codes connus de `DROITS_FISCAUX` portés par le jeton comptent. Un
   jeton sans droit fiscal n'a **aucun** droit fiscal, et son refus est journalisé (`HABILITATION_REFUSEE`). Un code
   `fiscalite:*` inconnu est ignoré, jamais compté.
6. **Un invariant des routes d'écriture.** Toute méthode `POST`, `PUT`, `PATCH` ou `DELETE` d'un contrôleur porte
   `@ExigeDroitFiscal`, ou figure dans une liste blanche nommée et justifiée : l'espace déclarant `moi/*`, le refus
   public d'une invitation. Un contrôleur neuf qui l'oublie fait rougir le test.

## Critères d'acceptation

- **AC-1** : `TenantPermission` porte les trois codes, avec leurs libellés ; le test des codes figés et le test de
  la borne restent verts.
- **AC-2** : le socle porte `CAB_ASSOCIE` (les trois droits) et `CAB_COLLABORATEUR` (préparer), au vertical
  `cabinet`. Aucun rôle du distributeur ne reçoit de droit fiscal.
- **AC-3** : le fondateur d'un cabinet (`TENANT_ADMIN`, sans `tenantRole`) reçoit dans son jeton les trois droits ;
  un collaborateur (`TENANT_USER`), préparer seulement. Une adhésion qui porte un `tenantRole` garde le sien. Une
  surcharge qui retire `deposer` à `CAB_ASSOCIE` le retire au jeton. Un membre d'un distributeur sans rôle métier
  reçoit toujours `[]`.
- **AC-4** : à la connexion et au rafraîchissement, un jeton hors borne est refusé (`JETON_HORS_BORNE`), sans
  session créée ni rotation, et le refus est journalisé avec l'utilisateur, l'organisation et le nombre de droits.
  Les DTO refusent plus de 44 droits.
- **AC-5** : dans fiscal-service, un `TENANT_ADMIN` dont le jeton ne porte aucun droit fiscal est **refusé** (403)
  sur une route d'écriture. Avant cette story, il était autorisé par le rôle. Un code `fiscalite:*` inconnu ne
  donne rien. Le test de mutation (rétablir la compatibilité) rougit.
- **AC-6** : l'invariant des routes d'écriture est vert sur le code actuel, et il rougit sur un contrôleur de test
  qui oublie le décorateur.
- **AC-7** : les recettes croisées qui passent par fiscal-service (zone franche, STORY-901) restent vertes sur des
  images reconstruites depuis `dev`, **sans aucun geste de plus** : le fondateur du cabinet y obtient ses droits par
  le rôle par défaut.

## Ordre de déploiement (à inscrire au guide de mise en service)

**`auth-service` d'abord, `fiscal-service` ensuite.** Dans l'ordre inverse, pendant l'intervalle, les jetons ne
portent pas encore de droit fiscal : chaque écriture fiscale est refusée. Ce refus est sûr, il n'élargit rien, mais il
bloque. Un jeton déjà émis reçoit ses droits à son prochain rafraîchissement (15 minutes au plus).

## Ce que cette story ne fait PAS

- Elle ne crée **pas** de route d'attribution nouvelle : l'attribution d'un `tenantRole` et la surcharge existent
  depuis STORY-166 et 167.
- Elle ne fait **pas** sortir les droits du jeton. C'est la décision d'architecture demandée à B avant février
  (journal de A).
- Elle n'ajoute **pas** de droit `fiscalite:declaration:lire`. La lecture suit le rôle (règle d'or de STORY-300,
  retenue par défaut dans le journal de A).

## Definition of Done

- [x] Tests, lint et build verts dans les deux services. **`docker compose up`** de chacun, sur une image
      reconstruite.
- [x] Mutation-tests :
  - rétablir la compatibilité dans fiscal-service rougit AC-5 ;
  - retirer le rôle par défaut dans auth-service rougit AC-3.
- [x] La recette zone franche est verte depuis `dev`, après la fusion des deux PR.
- [x] Le README de fiscal-service (« Mise en service ») porte l'ordre de déploiement.
- [x] Passation de `prospera-auth-service` à B, écrite dans le journal de A, avec le dernier commit sur `dev`.

---

## Livraison (2026-11-15)

**PR :**
- MoneyVibesGroup/prospera-auth-service#37, fusionnée en premier (`dev` : `456035f`) ;
- MoneyVibesGroup/prospera-fiscal-service#43, fusionnée ensuite (`dev` : `b82df6b`).

### Décisions prises en codant (contestables ; règle de l'utilisateur : « appliquer ce que je recommande »)

- **D-902-1 : un rôle métier par défaut, par vertical, plutôt qu'une migration.** Une membership peut naître par
  cinq chemins : inscription, invitation, console, démonstration, reclassement. Écrire `tenantRole` sur chacune
  aurait fait perdre ses droits, en silence, au premier membre d'un chemin oublié. La table
  `ROLE_METIER_PAR_DEFAUT` est lue à l'émission du jeton, et l'organisation n'est lue que si la membership n'a pas
  de `tenantRole`. C'est une donnée du socle, visible, que la surcharge de l'organisation modifie.
- **D-902-2 : `CAB_ASSOCIE` cumule préparer, valider et déposer**, parce qu'il est le signataire. Seul
  `CAB_COLLABORATEUR` est restreint (préparer). Un cabinet qui veut séparer davantage compose un rôle (STORY-167).
- **D-902-3 : la disponibilité d'un droit fiscal à la console.** Le module qui l'ouvre n'est pas son préfixe :
  c'est `declarations` (STORY-549), ou l'ancien `fiscalite` pour les octrois existants. Cela fait la table
  `MODULES_DU_PREFIXE`, qui reprend `FISCAL_MODULE_CODES` de fiscal-service.
- **D-902-4 : `JETON_HORS_BORNE` reste un 500 nommé**, contre la suggestion de la relecture (un 4xx). C'est le
  choix motivé de STORY-365 : l'utilisateur n'y peut rien, c'est la composition de ses rôles qui dépasse. Le refus
  est désormais **journalisé** (utilisateur, organisation, nombre de droits). Le **contrôle à l'attribution** est
  sans objet tant que l'union des catalogues tient sous la borne (33 ≤ 44), ce que garde `borne-du-jeton.spec.ts`.
  Il deviendra nécessaire avec la décision d'architecture demandée à B (droits hors du jeton).
- **D-902-5 : pas de marque `via` au fait d'audit d'un refus.** Avec la compatibilité supprimée, un droit ne vient
  plus que du jeton : la marque ne distinguerait plus rien.
- **D-902-6 : l'IdP des e2e de fiscal-service émet ce que l'IdP réel émet.** Un jeton signé sans `perms` porte les
  droits du rôle par défaut du cabinet (`permsDuCabinet`). Un test qui veut autre chose, y compris rien
  (`perms: []`), le dit.

### Preuves

- **auth-service** :
  - unitaires **1248/1248** (91 suites) et `nest build` vert ;
  - **mutation-test** : sans le rôle par défaut, 2 tests rougissent ; le code rétabli, ils repassent au vert.
- **fiscal-service** :
  - unitaires **2328/2328**, e2e **187/187**, `nest build` vert ;
  - **mutation-test** : rétablir la compatibilité par le rôle rougit l'unitaire (1) et l'e2e d'AC-5 (1).
- **Recette croisée zone franche (STORY-901), 5/5**, sur les images reconstruites des deux branches (pile `grp-a`,
  auth-service réel, fiscal-service strict). Elle n'a demandé **aucun geste de plus** : le jeton du fondateur
  (`TENANT_ADMIN`, sans `tenantRole`) a reçu `preparer` par le rôle par défaut, et la dérivation des obligations
  (`POST …/obligations/derivation`, `@ExigeDroitFiscal(PREPARER)`) est passée.
- Les arbres Git fusionnés sur `dev` sont **identiques** à ceux qui ont été recettés : `c8e5de3` pour auth-service,
  `86f6196` pour fiscal-service.
- La garde des routes d'écriture recense **6** routes libres, toutes de l'espace déclarant `moi/*`, dont un refus
  `@Public`. Toutes les autres portent `@ExigeDroitFiscal`.

### Écarts, à porter ailleurs

- **La console affiche « sans rôle métier »** pour un membre de cabinet qui reçoit le rôle par défaut : l'API
  d'administration rend le `tenantRole` stocké, pas le rôle effectif. Le jeton, lui, est juste. C'est à corriger
  dans `auth-service` (rendre le rôle effectif), au lot suivant de B, qui tient désormais ce dépôt.
- **La décision « droits hors du jeton »** reste ouverte chez B (journal de A, demande du 2026-11-15).
