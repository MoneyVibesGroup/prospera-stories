# STORY-148 : `platform-catalog-service` — le référentiel devient conditionnel au module (`referentielFamilies` au catalogue, référentiel optionnel sur l'entitlement)

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` · **STORY-032** (catalogue admin CRUD) · **STORY-033** (entitlements grant/update/revoke) · **STORY-038** (`ReferentielPackage`) · **AP-04** / **AP-05** (console)
**Priorité :** Should Have
**Story Points :** 5
**Complexité :** medium — le code est simple ; c'est le **sens du défaut** (module sans famille = non normatif) qui décide si l'absence de migration ouvre une porte ou en ferme une
**Statut :** in_progress *(démarrée le 2026-08-05)*
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 20
**Service :** `platform-catalog-service` — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-148`

---

## ⚠️ Correction du 2026-08-05 (relecture du code au démarrage) — la prémisse était fausse, le défaut est pire

La story affirme ci-dessous que le référentiel est **obligatoire** sur l'entitlement. **C'est faux depuis
STORY-033** (commit `0872181`, 2026-07-14) : `UpsertEntitlementDto.referentiel` est `@IsOptional()`, le
`@Prop({ type: Object })` du schéma n'est pas `required`, et le service gère explicitement son absence par
un `$unset` (commentaire « un module sans référentiel — ex. `stock` »). Le contrat backend accepte donc
**déjà** un octroi sans référentiel. L'« écart de contrat » qu'AP-05 croyait assumer n'a jamais existé
dans ce sens-là.

**La conséquence retourne l'urgence, elle ne l'annule pas.** Le vrai défaut n'est pas un 400 qui bloque un
module non normatif : c'est que **`bilan` peut être octroyé sans plan comptable, aujourd'hui, sans la
moindre erreur** — et que rien en aval ne le rattrape. La règle conditionnelle de cette story est donc le
**seul** garde-fou, pas un assouplissement.

Deux conséquences de périmètre :

- le critère « `referentielCode`/`referentielVersion` deviennent optionnels » est **déjà satisfait** — il est
  constaté, pas réimplémenté. Aucun changement de contrat d'événement (`entitlement.changed` porte déjà
  `referentiel?`), donc **un seul dépôt** ;
- l'⚠️ « ordre imposé » du §Migration se lit à l'envers : la fenêtre dangereuse n'est pas *avant* de rendre
  le champ optionnel (il l'est depuis trois semaines), elle est **entre le déploiement du code et
  l'exécution de la migration** — et pendant cette fenêtre, un module normatif non migré est traité comme
  non normatif, donc **fail-open**, exactement l'état d'aujourd'hui. Voir §Migration pour la décision.

---

## Contexte

**Le modèle actuel suppose que tout module consomme un référentiel comptable. C'est faux.**

`Entitlement` porte `referentielCode` et `referentielVersion` ~~**obligatoires**~~ *(faux — cf. correction
ci-dessus)*. L'hypothèse tenait
tant que le catalogue ne contenait que `bilan` et `pi-spi` — deux modules normatifs. Le catalogue
en compte désormais **18** (AP-04), dont onze qui n'ont aucune notion de plan comptable : point de
vente, stock, commande, marketing, support client, collecte, recouvrement, équipe, dashboard,
catalogue, commercial terrain.

Octroyer « Point de vente » oblige aujourd'hui à inscrire un référentiel dans le droit. Deux issues,
toutes deux mauvaises :

- **une valeur par défaut** : le droit porte une norme que personne n'a choisie, et que rien en aval
  ne saura remettre en cause — un audit lira « PDV octroyé sous SYSCOHADA » et le croira ;
- **une valeur vide** : le champ est obligatoire, l'appel échoue en 400.

⚠️ **La console a déjà pris de l'avance et le documente.** `frontend-admin-panel` porte
`CatalogModule.referentielFamilies` et rend `referentielCode`/`referentielVersion` optionnels **côté
front uniquement** (cf. `src/features/catalog/types.ts` et `src/features/entitlements/types.ts`,
commentaires pointant cette story). L'écart ne se manifeste pas encore en production : les deux
seuls modules octroyables à ce jour exigent tous deux un référentiel, donc **aucun octroi sans
référentiel ne peut être émis**. Il se manifestera au premier module non normatif livré.

---

## User Story

En tant que **`platform-catalog-service`**,
je veux **savoir quels modules consomment un référentiel, et n'en exiger un que pour ceux-là**,
afin que **l'octroi d'un module non normatif n'inscrive pas dans le droit une norme arbitraire**.

---

## Périmètre

**Inclus :**

1. **Catalogue — `referentielFamilies`.** Nouvel attribut sur le module : liste des **codes de
   familles** de référentiels que le module sait consommer (`["syscohada-revise", "sfd-bceao",
   "cima-assurances"]`). Absent ou vide ⇒ le module ne consomme aucun référentiel.
2. **Entitlement — référentiel optionnel**, *conditionné par le catalogue* (voir §Règle).
3. **Migration** des documents existants (voir §Migration).
4. Exposition dans l'OpenAPI, pour que `npm run gen:api` le rende au front.

**Hors périmètre :**
- Le dépôt d'artefact de référentiel — c'est **STORY-149** (ex 146, renumérotée le 2026-07-31).
- Toute notion de compatibilité par *version* de référentiel (on raisonne par famille).

---

## Pourquoi une liste et non un booléen `requiresReferentiel`

C'est le point de conception de cette story, et il mérite d'être tranché explicitement.

Un booléen répond à « faut-il poser la question ? ». Une liste répond en plus à « quelles réponses
sont valides ? ». Avec un booléen, `bilan + cima-assurances` (un module de comptabilité générale
sous le plan des assurances) passe tous les contrôles : les deux existent, le champ est rempli, le
type est bon. Le droit est **syntaxiquement correct et métier absurde**, et rien en aval ne le
rattrape — `bilan-service` chargera le paquet CIMA sans broncher, et sortira des états faux.

Le booléen se dérive de la liste (`length > 0`) ; l'inverse est impossible. On stocke donc la liste.

---

## Règle d'autorisation du référentiel à l'octroi

À la réception d'un `PUT /catalog/entitlements/:orgId/:moduleCode` :

| Module | Référentiel fourni | Attendu |
|---|---|---|
| `referentielFamilies` non vide | absent | **400** — `REFERENTIEL_REQUIRED` |
| `referentielFamilies` non vide | d'une famille listée | **accepté** |
| `referentielFamilies` non vide | d'une famille **non** listée | **422** — `REFERENTIEL_INCOMPATIBLE` |
| vide / absent | absent | **accepté** |
| vide / absent | fourni | **422** — `REFERENTIEL_NOT_APPLICABLE` |

⚠️ Le dernier cas est refusé et non ignoré silencieusement : accepter puis jeter la valeur ferait
croire à l'appelant que son choix a été enregistré.

---

## Critères d'acceptation

- [ ] `referentielFamilies?: string[]` sur le module, créable et éditable par `catalog/admin`.
- [ ] Chaque code de famille est **vérifié contre le registre des référentiels** à l'écriture :
      une famille inexistante est refusée (422), sinon le catalogue décrirait une compatibilité
      avec un référentiel qui n'existe pas.
- [ ] `referentielCode` / `referentielVersion` deviennent **optionnels** sur l'entitlement.
- [ ] Les 5 règles du tableau ci-dessus sont appliquées et couvertes par des tests.
- [ ] Les codes d'erreur (`REFERENTIEL_REQUIRED`, `REFERENTIEL_INCOMPATIBLE`,
      `REFERENTIEL_NOT_APPLICABLE`) sont **dans le corps de la réponse**, pas seulement dans le
      message — la console les ancre sur le bon champ de formulaire.
- [ ] OpenAPI régénéré ; `GET /catalog/modules` expose l'attribut.
- [ ] Migration jouée et **idempotente**.

---

## Migration

Les entitlements existants portent tous un référentiel : **rien à retirer**, la migration est
additive côté droits.

Côté catalogue, `referentielFamilies` doit être **rempli** pour les modules normatifs, sinon la
règle ci-dessus les traiterait comme non normatifs et accepterait un octroi sans référentiel — une
régression silencieuse sur les deux modules en production.

Valeurs à poser (alignées sur les fixtures de la console, `frontend-admin-panel/src/features/catalog/api/fixtures.ts`) :

| Module | Familles |
|---|---|
| `bilan` | `syscohada-revise`, `sfd-bceao`, `cima-assurances` |
| `pi-spi` | `sfd-bceao` |
| `fiscalite` | `syscohada-revise`, `zone-franche-togo` |
| `conformite-bceao` | `sfd-bceao` |
| `credit` | `sfd-bceao` |
| `finance-transactions` | `syscohada-revise` |
| `facturation` | `zone-franche-togo` |
| *(les 11 autres)* | — aucune |

⚠️ **Ordre imposé** : poser `referentielFamilies` **avant** de rendre le champ optionnel sur
l'entitlement. L'inverse ouvre une fenêtre où `bilan` peut être octroyé sans plan comptable.

### Décisions de migration prises le 2026-08-05

| Question | Décision | Pourquoi |
|---|---|---|
| Script manuel ou seed au boot ? | **Script** `npm run migrate:referentiel-families`, sur le patron de `seed-platform-admin.ts` | Le catalogue est une donnée **d'exploitation**, pas dérivée du code : un seed au boot qui réaligne 18 modules écraserait à chaque redémarrage ce qu'un administrateur a édité. Le projet diffère par ailleurs les migrations (`CLAUDE.md` §Garde-fous). |
| Idempotence | Écriture **uniquement si le champ est absent** (`referentielFamilies: { $exists: false }`) | Rejouable sans effet **et** non destructif : une édition admin postérieure n'est jamais rétablie de force. Le 2ᵉ passage rapporte `0 modifié`. |
| Module absent du catalogue | **Ignoré**, compté et rapporté | La table ci-dessus est le mapping *cible* (fixtures console) ; un environnement où `facturation` n'existe pas encore ne doit pas faire échouer la migration des sept autres. |
| Famille inconnue du registre des référentiels | **Écrite quand même**, avec un **avertissement** nominatif | L'API refuse (422) une famille inexistante — garde-fou contre la faute de frappe d'un opérateur. La migration, elle, porte un mapping **relu et versionné** : refuser laisserait `fiscalite` **fail-open** (octroyable sans plan comptable), alors que l'écrire le rend **fail-closed** (tout octroi refusé tant que la famille n'est pas déposée — STORY-149). Entre une porte ouverte en silence et une porte fermée bruyamment, on ferme. |

---

## Permissions

Aucune permission nouvelle. L'écriture de `referentielFamilies` relève de `catalog:manage`, comme le
reste du catalogue.

⚠️ **Dépendance à signaler** : `catalog/admin` est encore gardé par `@Roles(PLATFORM_ADMIN)` et non
par `@RequirePermissions(catalog:manage)` — migration portée par **STORY-140**. Cette story ne la
refait pas, elle en hérite.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests unitaires + e2e verts.
- [ ] Migration jouée sur un environnement de recette, idempotence prouvée (double exécution).
- [ ] OpenAPI publié ; `npm run gen:api` régénère le front sans erreur.
- [ ] Front `frontend-admin-panel` rebasculé sur les types générés (retrait des commentaires
      « champ front uniquement »).

---

## Progress Tracking

### Démarrage 2026-08-05 — état trouvé dans le code

Relecture de `platform-catalog-service` avant toute écriture :

| Point | État réel |
|---|---|
| `referentielFamilies` | **aucune occurrence** — ni schéma, ni DTO, ni service (confirme la note de `sprint-status.yaml`) |
| `Entitlement.referentiel` | **déjà optionnel** depuis STORY-033 — cf. §Correction en tête de story |
| Règle conditionnelle | **inexistante** : `assertCatalogCoherence` ne vérifie que l'existence/`RETIRED` du référentiel *quand il est fourni* |
| Contrat `entitlement.changed` | porte déjà `referentiel?` → **aucun changement d'événement, un seul dépôt** |
| Codes d'erreur dans le corps | `AllExceptionsFilter` propage déjà un `code` (STORY-138) → rien à ajouter côté filtre |
| Migration | aucune infrastructure de migration ; patron le plus proche = `auth-service/src/seeds/seed-platform-admin.ts` |
