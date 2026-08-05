# STORY-148 : `platform-catalog-service` — le référentiel devient conditionnel au module (`referentielFamilies` au catalogue, référentiel optionnel sur l'entitlement)

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` · **STORY-032** (catalogue admin CRUD) · **STORY-033** (entitlements grant/update/revoke) · **STORY-038** (`ReferentielPackage`) · **AP-04** / **AP-05** (console)
**Priorité :** Should Have
**Story Points :** 5
**Complexité :** medium — le code est simple ; c'est le **sens du défaut** (module sans famille = non normatif) qui décide si l'absence de migration ouvre une porte ou en ferme une
**Statut :** ✅ Terminée *(2026-08-05)*
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

### Ce qui a été livré

| Élément | Fichier |
|---|---|
| `referentielFamilies` sur le module (`default: undefined`, pas le `[]` implicite) | `catalog/schemas/module.schema.ts` |
| Écriture gardée par le registre (422 `REFERENTIEL_FAMILY_UNKNOWN`) | `catalog/services/modules.service.ts` |
| Registre des familles (axe `code`, **sans** filtre de statut) | `catalog/services/referentiel-versions.service.ts` |
| Règle des 5 cas, **pure** | `entitlements/referentiel-rule.ts` |
| Câblage dans l'octroi (lecture du module, plus `exists()`) | `entitlements/services/entitlements.service.ts` |
| Migration idempotente + rapport | `migrations/backfill-referentiel-families.ts` · `npm run migrate:referentiel-families` |

Deux décisions non écrites dans la story et tranchées ici :

- **le registre des familles ne filtre pas le statut.** Une famille dont toutes les versions sont `RETIRED`
  reste une famille *connue*. Filtrer la ferait disparaître du registre le jour du dernier retrait, et le
  module basculerait **silencieusement** en « non normatif » — donc octroyable sans plan comptable, le
  défaut même que la story ferme. Le statut reste contrôlé à l'octroi, sur la **version**.
- **la règle passe avant la lecture du registre.** Un référentiel fourni à un module non normatif doit
  s'entendre dire « ce module n'en consomme pas », et non « ce référentiel n'existe pas », qui enverrait
  chercher au mauvais endroit.

### Portes DoD

| Porte | Résultat |
|---|---|
| Lint | 0 warning |
| Build | OK |
| Unitaires | **353** verts (35 suites) |
| e2e | **121** verts (4 suites) |
| Couverture | **99,8 st / 94,61 br / 100 fn / 99,89 li** — seuils 65/90/90/90 ; `referentiel-rule.ts` et la migration à 100 % partout |

### Mutation-tests — 5 mutations, 5 rougissements

| Mutation | Test qui vire au rouge |
|---|---|
| `assertReferentielAllowed` n'est plus appelée dans l'octroi | 4 unitaires + 4 e2e |
| `default: undefined` retiré du `@Prop` | « un module créé SANS familles n'a pas du tout le champ » |
| migration sans le filtre `{ $exists: false }` | « n'écrit QUE si le champ est absent » |
| garde des familles retirée du `PATCH` | 2 unitaires |
| règle déplacée **après** la lecture du registre | « la règle passe AVANT la lecture du registre » |

⚠️ La 1ʳᵉ mutation est celle qui compte : `referentiel-rule.spec.ts` (9 tests) reste **entièrement vert**
sous elle. Une fonction pure parfaitement testée ne prouve rien de son câblage — c'est le piège de
STORY-172, reproduit ici volontairement.

### Vérification docker — contrôle avant/après sur Mongo réel

Stack : `mongo` + `kafka` + `redis` + `auth-service` + `platform-catalog-service`, `health` → `mongodb: up`,
`kafka: up`. Jeton `PLATFORM_ADMIN` par `seed:admin` + login. Base `catalog_service`.

**① Le défaut, reproduit avant migration.** `bilan` créé sans familles (état pré-migration), octroi
`{"versionCode":"2.0"}` **sans référentiel** → **201**, document écrit **sans champ `referentiel`**. C'est
le fail-open que la story ferme, observé en vrai — et non celui qu'elle décrivait.

**② Migration, 1ᵉʳ passage.**

```
{"modified":["bilan"],"alreadySet":[],
 "absent":["pi-spi","fiscalite","conformite-bceao","credit","finance-transactions","facturation"],
 "unknownFamilies":["cima-assurances","zone-franche-togo"]}
```

En base : `bilan.referentielFamilies = ["syscohada-revise","sfd-bceao","cima-assurances"]`.
L'avertissement nomme les deux familles à déposer (STORY-149) — écrites quand même, décision assumée.

**③ Idempotence (2ᵉ passage)** : `{"modified":[],"alreadySet":["bilan"],…}` — aucune écriture.

**④ Non-destruction (3ᵉ passage après édition admin)** : `PATCH` restreint `bilan` à `["syscohada-revise"]`,
migration rejouée → `modified: []`, et la base garde **l'édition admin**. Un seed au démarrage aurait
rétabli les trois familles à chaque redémarrage : c'est ce qui a fait écarter cette voie.

**⑤ Les 5 règles, contre le vrai Mongo :**

| Cas | Observé |
|---|---|
| normatif, sans référentiel | **400** `REFERENTIEL_REQUIRED` — message listant les 3 familles |
| normatif, famille listée (`sfd-bceao`) | **200** |
| normatif, famille non listée (`autre-plan`) | **422** `REFERENTIEL_INCOMPATIBLE` |
| non normatif, sans référentiel | **201** |
| non normatif, avec référentiel | **422** `REFERENTIEL_NOT_APPLICABLE` |

Les trois `code` sont **dans le corps**, avec un `error` correct (`Bad Request` / `Unprocessable Entity`) —
le piège de l'exception construite à partir d'un objet est évité.

**⑥ Aucun orphelin.** L'organisation qui n'a essuyé que des refus (`eee…`) compte **0** entitlement ;
`outbox_events` contient exactement **3** événements, un par écriture réussie — aucun refus n'a émis.

**⑦ Écriture gardée** : `PATCH` avec `famille-fantome` → **422** `REFERENTIEL_FAMILY_UNKNOWN`, message
nommant la famille fautive, **rien écrit**.

**⑧ OpenAPI** : `referentielFamilies` présent dans `ModuleResponseDto`, `CreateModuleDto` et
`UpdateModuleDto` de `/api/docs-json`, et rendu par `GET /catalog/modules` (absent du module non normatif,
présent sur `bilan`).

> ⚠️ **Note d'exploitation** : `docker-compose.override.yml` ne monte pas `package.json` — en dev, la
> migration s'invoque `./node_modules/.bin/ts-node src/migrations/backfill-referentiel-families.ts` dans le
> conteneur. `npm run migrate:referentiel-families` fonctionne dès que l'image est reconstruite.

### Revue de code — 2 constats, aucun bloquant, les deux corrigés

1. **L'avertissement de la migration annonçait le mauvais refus.** Il promettait « refuseront tout octroi
   (422 `REFERENTIEL_INCOMPATIBLE`) » ; en réalité une famille **listée mais non déposée** fait tomber
   l'octroi en 422 « référentiel inexistant ou RETIRED », **sans champ `code`** — la famille *est* listée,
   donc la règle passe. Et « tout octroi » ne vaut que si **toutes** les familles du module sont inconnues
   (`facturation`) : `fiscalite` reste octroyable via `syscohada-revise`. Un opérateur qui filtrait ses
   logs sur `REFERENTIEL_INCOMPATIBLE` ne trouvait rien. Message et docblock corrigés.
2. **Bloc e2e mal placé** : il s'était intercalé entre le commentaire d'introduction de STORY-140 et le
   `describe` que ce commentaire documente. Déplacé après.

Constats écartés, avec leur motif : `@ApiOkResponse` (200) sur un `POST` qui renvoie 201 — **préexistant**,
hors diff ; `npm run migrate:*` inutilisable dans l'image `runtime` — patron **déjà assumé** par
`auth-service` (`seed:admin`) et migrations différées par `CLAUDE.md` ; ordre 422-avant-404 sur un `PATCH`
de module inexistant — jugement de conception, aucune règle violée.

### Revue de sécurité — **aucune vulnérabilité** (0 constat ≥ 80)

Six points examinés spécifiquement, tous fermés :

| Point | Conclusion |
|---|---|
| Injection Mongo par `referentielFamilies` | `@IsArray` + `@IsString({each})` rejettent tout opérateur (`{"$ne":null}`) en 400, **même sous** `enableImplicitConversion` — la sortie de conversion est revalidée. Regex linéaire, sans `g`/`y` : pas de ReDoS ni de `lastIndex` partagé malgré la constante mutualisée. |
| Croissance non bornée d'un document rejouable | `PATCH` fait un **remplacement absolu**, pas un `$push` ; plafond dur `ArrayMaxSize(32)` × `MaxLength(64)`. Le piège CWE-770 de STORY-145 ne se reproduit pas. |
| `distinct('code', { code: { $in: codes } })` | Champ projeté littéral ; les `codes` viennent soit des DTO validés, soit d'une constante. Aucun objet brut n'atteint le `$in`. |
| `findByCodeOrNull` en remplacement d'`exists()` | Même filtre, même statut, même message qu'avant ; lecture `.lean()` dont seul `referentielFamilies` est consommé — rien de nouveau ne remonte au client. |
| Divulgation par les nouveaux messages | Routes gardées `catalog:manage` / `entitlement:grant` — populations **plateforme** (les rôles tenant ont `perms: []` par construction, D15). L'information citée est déjà publiée par `GET /catalog/modules`. Aucun oracle inter-tenant, aucun 403 là où un 404 est requis. |
| Migration | Script à invocation manuelle, sans entrée externe ; `Object.entries` sur une constante (pas de pollution de prototype) ; `updateOne` filtré `$exists: false`, donc sûr en exécution concurrente. |

Point de conception confirmé au passage : `assertReferentielAllowed` est appelée **avant** l'ouverture de la
session Mongo — un refus n'écrit rien et n'enfile aucun événement, l'invariant « pas d'écriture sans
événement, pas d'événement sans écriture » tient. `upsert()` est le **seul** chemin d'écriture du champ
`referentiel`, et son unique appelant est le contrôleur gardé : la règle n'est pas contournable.

### Clôture

PR **#11** rebase-mergée sur `dev`, branche `MNV-148` supprimée. Statut synchronisé aux 3 endroits.

⚠️ **Reste à faire, hors périmètre** : le point 4 de la Definition of Done (« front `frontend-admin-panel`
rebasculé sur les types générés ») ne peut pas être fait ici — ce dépôt n'est pas présent dans l'espace de
travail. Le backend expose désormais l'attribut dans l'OpenAPI ; le retrait des commentaires « champ front
uniquement » relève d'AP-INT-0.
