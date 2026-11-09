# Le contrat de module : ce qu'un service doit tenir pour être installable · **document de doctrine**

> **Date :** 2026-11-09 · **Statut :** proposition, **à valider par le PO le vendredi 13/11/2026**
> **Auteur :** Dev B (lot 1 du cadrage, `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` §1.3 et §4)
> **Décision de programme proposée :** **AD-P17**. Elle s'ajoute à
> `architecture-prospera-ecosystem-2026-07-04.md` une fois validée. Le plus haut numéro existant est AD-P16.
> **S'applique à :** tout module du programme, à partir d'**EPIC-045** chez Dev A. **Chaque PRD écrit
> ensuite cite ce document** (§6).
> **Décisions déjà rendues sur lesquelles il repose :** D1 (une seule app `prospera-app`), D2 (deux niveaux
> de dépendance), D3 (un profil `docker compose` par module). Toutes trois tranchées le 2026-11-09.

---

## 0. En une page

**Un module est ce qu'on vend et qu'on installe** : un code au catalogue (`reseau`, `pdv`, `stock`…).
**Un service est ce qu'on déploie** : un dépôt, un conteneur. Un service peut porter plusieurs modules (§4).

**Installer** un module pour un client, c'est poser l'entitlement `(organisation × module)` en `ACTIVE`.
**Le désinstaller**, c'est le passer en `REVOKED`. Un **pack** installe plusieurs modules d'un coup. Tout
cela existe déjà. Ce qui manque, c'est la **règle** qui rend chaque module digne d'être installé seul,
et c'est l'objet de ce document.

Un module est « fini » quand il tient ces dix clauses. L'état est **mesuré sur `origin/dev` le 2026-11-09**.

| # | Le module… | La preuve | État mesuré |
|:--:|---|---|:--:|
| C1 | a un **manifeste** : code, version, dépendances dures et optionnelles, familles de référentiels, droits, événements, profil compose | le catalogue refuse un module dont une dépendance dure manque, avec un code nommé | ⛔ aucun champ de dépendance au catalogue |
| C2 | porte son **socle** : entitlement, gate, cloisonnement par organisation | sans entitlement : un 403 nommé, jamais une donnée | ✅ patron en place (paiement, microfinance, bilan…) |
| C3 | **possède ses données**, et lui seul les écrit | la garde de câblage (STORY-643) ne voit aucune collection d'un autre module | ✅ garde posée dans 5 dépôts |
| C4 | **fonctionne seul** : une dépendance optionnelle absente donne un **emplacement déclaré vide** | un test par dépendance optionnelle désinstallée | ⚠️ règle écrite (pdv AD-7), jamais testée |
| C5 | **parle par contrats nommés** : topic versionné ou endpoint, jamais la base d'un autre | la suite de conformité, jouée par le consommateur | ✅ patron en place (`entitlement.changed` v2) |
| C6 | se **paramètre par des données**, jamais par `if (client === …)` | une garde de balayage | ⚠️ règle écrite (pdv AD-8), aucune garde transverse |
| C7 | **déclare ses droits de tenant**, que l'administrateur du client attribue lui-même | ils apparaissent dans la console du client sans déploiement | ✅ attribution (166, 167) · ⚠️ catalogue des droits fermé |
| C8 | livre son **module d'écran** dans `prospera-app` | une organisation sans le module ne le voit pas dans le menu | ⛔ la coque n'existe pas |
| C9 | s'**installe et se désinstalle sans perte** | test aller-retour : installer, désinstaller, réinstaller, tout est là | ⚠️ le mécanisme le permet, aucun test ne le prouve |
| C10 | **démarre seul** avec le socle minimal | `docker compose --profile <code> up` à chaque gate | ⛔ aucun profil dans le compose |

**Ce que le PO valide vendredi :** les dix clauses, et les **cinq choix du §8** (Q1 → Q5), chacun avec
une recommandation.

---

## 1. Le vocabulaire, fixé une fois

| Mot | Sens exact | Où il vit aujourd'hui |
|---|---|---|
| **Module** | Une capacité vendable, identifiée par un `code` stable en kebab-case | `platform-catalog-service` › `Module` |
| **Version de module** | Une version du code d'un module ; le manifeste s'y attache (§2, C1) | `ModuleVersion` (`moduleCode`, `version`, `status`) |
| **Pack** | Une liste de modules et de référentiels vendus ensemble pour un métier | `VerticalPack` : `distributeur`, `imf-sfd`, `assurance-cima`, `cabinet` |
| **Installer** | Poser l'entitlement `(organisation × module)` en `ACTIVE` | `Entitlement`, index unique `{organizationId, moduleCode}` |
| **Suspendre** | `SUSPENDED` : le module refuse, les données restent (impayé, STORY-280) | `EntitlementStatus` |
| **Désinstaller** | `REVOKED` : le module refuse, **les données restent** | `EntitlementStatus` |
| **Expiré** | Statut **lu**, jamais écrit, dérivé du terme (`ECHEANCE` dépassée) | `terme.ts` › `STATUT_EXPIRE` |
| **Dépendance dure** (`depends`) | Sans elle, le module n'a pas de sens : son installation est refusée | **n'existe pas** (C1) |
| **Dépendance optionnelle** (`enrichiPar`) | Elle ajoute des informations ; son absence laisse un emplacement vide | **n'existe pas** (C1) |
| **Emplacement vide** | Une donnée que l'API **annonce** comme non disponible, au lieu de la taire ou de rendre 0 | pdv AD-7 (règle écrite) |

---

## 2. Les dix clauses

### C1 : le manifeste

**Règle.** Chaque version de module déclare, dans un manifeste :

```ts
// <service>/src/module.manifest.ts : un fichier par module porté par le service
export const MANIFESTE_PDV = {
  code: 'pdv',
  version: '1.0.0',
  depends: ['reseau'],                       // dures : sans elles, installation refusée
  enrichiPar: ['commande', 'facturation'],   // optionnelles : sans elles, emplacement vide
  referentielFamilies: [],                   // déjà au catalogue (STORY-148)
  droits: ['pdv:fiche:consulter', 'pdv:portefeuille:affecter' /* … */],
  publie: ['pdv.point-de-vente.changed@1'],
  consomme: ['reseau.portee.changed@1', 'entitlement.changed@2', 'identity.*'],
  profilCompose: 'pdv',
} as const;
```

**Où il vit (Q1, recommandation).** La **source** est ce fichier, dans le dépôt du service : c'est le
propriétaire du module qui le tient. Le **catalogue en garde une copie par `ModuleVersion`** : c'est elle
que le moteur d'installation lit. Une **garde de test** compare les deux, sur le patron déjà payé de
`packs.front-snapshot.ts`, où toute divergence doit être déclarée avec son motif.

**Preuve.** Le catalogue refuse d'installer un module dont une dépendance dure n'est pas installée chez
l'organisation : réponse **422 `MODULE_DEPENDANCE_MANQUANTE`**, avec la liste des codes manquants.

**État mesuré.** `Module` porte `code`, `name`, `description`, `status`, `referentielFamilies`.
`ModuleVersion` porte `moduleCode`, `version`, `status`, `deprecationDate`, `releasedAt`. **Aucune
dépendance, aucun droit, aucun événement déclaré.** Le refus d'un module inconnu existe déjà
(`MODULE_INCONNU`, `PACK_MODULE_UNKNOWN`, `MODULE_NON_OCTROYABLE`) : le refus de dépendance s'ajoute à
cette famille de codes. ⚠️ **`reseau` n'est pas enregistré au catalogue** (seed `modules.seed-data.ts`) :
c'est la première tâche de Dev A en semaine 1.

### C2 : le socle (entitlement, gate, cloisonnement)

**Règle.** Le module projette `entitlement.changed` dans un read-model local et refuse **toute** route
métier quand le statut effectif de l'entitlement de l'organisation n'est pas `ACTIVE`. Le refus est un
**403 au code nommé** : `<MODULE>_NOT_ENTITLED`. Chaque lecture et chaque écriture est filtrée par
`organizationId`, et par dossier ou exercice quand le métier l'exige.

**Le patron existe, on le recopie :** un décorateur `requires-<module>-access`, une garde
`<module>-access.guard`, un read-model `entitlement.projection.service`, un code de refus nommé. Il est en
place dans `prospera-paiement-service` (`PAIEMENT_NOT_ENTITLED`), `prospera-microfinance-service`
(`MICROFINANCE_NOT_ENTITLED`) et `bilan-service` (`BILAN_NOT_ENTITLED`).

**Preuve.** Un test e2e par statut (`SUSPENDED`, `REVOKED`, expiré, absent) : un 403 nommé, et **aucune
donnée dans le corps**.

### C3 : le module possède ses données

**Règle.** Seul le module écrit ses collections. Il lit les autres **par leurs événements**, projetés
dans ses propres read-models. **Un read-model n'a jamais autorité** : en cas de doute, la source est le
module propriétaire.

**Preuve.** La garde de câblage (STORY-643, posée dans auth, kyc, admin-panel, paiement, catalogue) ne
voit aucune collection qui appartient à un autre module. Elle entre dans le gabarit de tout nouveau
service avec `app.module.invariant.spec.ts`.

### C4 : le module fonctionne seul

**Règle.** Quand une dépendance **optionnelle** n'est pas installée, la donnée qu'elle aurait fournie
apparaît comme un **emplacement déclaré vide**. Jamais une erreur, jamais un champ absent, **jamais un
zéro**. C'est déjà la règle du programme (pdv AD-7, troisième occurrence du patron après stock FR-S08c et
catalogue) ; ce contrat la rend **vérifiable**.

**Forme proposée**, la même dans tous les modules :

```json
{ "commandes30j": { "etat": "NON_INSTALLE", "module": "commande" } }
```

à côté du cas métier, qui reste un fait :

```json
{ "commandes30j": { "etat": "DISPONIBLE", "valeur": 0 } }
```

Le premier dit « le client n'a pas le module », le second « le client n'a rien commandé ». Les confondre
fait croire à un client sans activité.

**Preuve.** Pour chaque dépendance de `enrichiPar`, un test qui la désinstalle et vérifie l'état
`NON_INSTALLE` sur chaque emplacement concerné.

### C5 : des contrats nommés

**Règle.** Un module ne parle aux autres que par un **topic Kafka versionné**, avec une enveloppe portant
`schemaVersion` et `eventId` et publiée par outbox, ou par un **endpoint documenté**. Le consommateur
est **idempotent** sur `eventId`. Jamais d'accès à la base d'un autre module.

**Preuve.** Le **consommateur** exécute en CI la suite de conformité du producteur. C'est ce que fait
déjà la spine de `pdv` avec celle de `reseau` (pdv, AD sur la portée).

### C6 : se paramétrer par des données

**Règle.** Ce qui varie d'un client à l'autre passe par des **référentiels versionnés** ou des **règles
structurées à grammaire fermée** (pdv AD-8 : grandeur × comparateur × seuil × état). ⛔ Aucun
`eval`, aucun interpréteur. ⛔ Aucune branche de code sur l'identité d'un client. Un module propre à un
client reste possible, mais c'est **un module du catalogue comme un autre**, avec son manifeste.

**Preuve.** Une **garde de balayage** dans le gabarit de service. Elle cherche des **formes
exécutables**, jamais des mots : une comparaison d'un `organizationId` ou d'un `orgId` à un littéral, et
un nom d'organisation en dur dans `src/` hors des seeds.

### C7 : les droits de tenant

**Règle.** Les droits d'un module ont la forme `<module>:<objet>:<action>`, et **leur préfixe est le
code du module** (`TENANT_PERMISSION_FORMAT` et `moduleDePermission()` dans `auth-service` le font déjà).
Le module les déclare dans son manifeste. L'administrateur du client les attribue lui-même, par des rôles,
**sans déploiement**.

**État mesuré, et ce qu'il change au plan.**
- ✅ **L'attribution existe** : STORY-166 (socle de rôles de tenant, `perms[]` rempli pour un membre) et
  STORY-167 (rôles composés et surcharge DELTA) sont **fusionnées sur `dev`**. **STORY-365 (« le RBAC
  s'étend au tenant », `not_started`) est donc largement dépassée** : à requalifier au lot 1 avant de
  la chiffrer, sans la coder telle quelle.
- ⚠️ **Le catalogue des droits est fermé** : `TenantPermission` est un `enum` dans `auth-service`, avec
  13 codes (paiement et notification). Ajouter les droits d'un module demande **une PR dans
  `auth-service`**. C'est acceptable : on ajoute un droit au moment où on livre le module, et l'attribution
  reste sans déploiement. Le moteur d'installation pourra lire les droits depuis les manifestes plus tard.
- ⚠️ **À mesurer** : un droit d'un module **non installé** reste-t-il dans `perms[]` ? Il ne doit pas
  ouvrir d'écran (C8), mais la console du client ne doit pas non plus le proposer.

**Preuve.** Une garde dans le dépôt du module : `manifeste.droits ⊂ TENANT_PERMISSION_CATALOG`, et chaque
droit commence par `<code>:`.

### C8 : le module d'écran

**Règle.** Dans `prospera-app` (D1), chaque module livre son dossier `src/modules/<code>/` : routes,
écrans, client d'API typé, et ses **entrées de menu, chacune avec le droit qu'elle exige**. Une entrée
est visible si et seulement si l'entitlement effectif est `ACTIVE` **et** l'utilisateur a le droit.

**Preuve.** Un test de la coque : une organisation sans le module ne voit pas ses entrées, et une URL
saisie à la main rend l'écran « module non installé », jamais une page cassée.

**Dépend de** la spine de la coque, troisième pièce du lot 1, due le 20/11 à Dev A.

### C9 : installer et désinstaller sans perte

**Règle.** Installer est **idempotent** : l'index unique `{organizationId, moduleCode}` le garantit déjà.
Désinstaller (`REVOKED`) **ne supprime rien**. Réinstaller retrouve **exactement** l'état d'avant.
Effacer les données est un **acte séparé**, demandé, tracé, et hors de ce contrat (Q4).

**Preuve.** Le test aller-retour, joué sur le vrai backend à chaque Integration Gate : créer des données,
désinstaller (403 nommé), réinstaller, relire les mêmes données.

### C10 : démarrer seul

**Règle.** Chaque service déclare `profiles: ["<code>"]` dans `docker-compose.yml`, un profil par module
qu'il porte. Le **socle minimal** (Mongo, Kafka, `auth-service`, `platform-catalog-service`) n'a **pas
de profil** : il démarre toujours. `docker compose --profile <code> up` doit suffire à lever le module et à
passer sa recette.

**État mesuré.** ⛔ **`docker-compose.yml` ne déclare aucun profil.** `prospera-microfinance-service`,
`prospera-assurance-service` et `prospera-fiscal-service` **n'y figurent pas**. Le profil est aussi la
première brique de l'installation chez le client (D3).

**Preuve.** La commande ci-dessus, lancée à chaque gate, puis la recette du module.

---

## 3. Les dépendances (D2), en règles

1. **Deux niveaux, et seulement deux.** `depends` bloque l'installation, `enrichiPar` ne bloque jamais.
2. **Par code, pas par version (Q5).** `depends: ['reseau']`, et non `reseau >= 1.2`. C'est la règle déjà
   choisie pour les référentiels (« la compatibilité se raisonne par famille, jamais par version »,
   STORY-148). Une rupture de contrat se traite par la version du **topic** (C5), pas par la dépendance.
3. **Pas de cycle.** Le catalogue refuse un manifeste qui en crée un : **422 `MANIFESTE_CYCLE`**.
4. **Installer un pack**, c'est installer ses modules **dans l'ordre des dépendances**, en une action,
   et de façon idempotente.
5. **Désinstaller un module dont un autre a besoin** (Q2, recommandation) : **refusé**, **409
   `MODULE_REQUIS_PAR`**, avec la liste des modules qui en dépendent. Pas de cascade silencieuse.
6. **Une dépendance dure est une garantie d'installation, pas un couplage d'exécution.** Le module lit
   sa dépendance par ses read-models (C3). Si elle est suspendue (Q3), il ne s'arrête pas : ce qu'il en
   lit se déclare `SUSPENDU`, sur le patron de l'emplacement vide.

---

## 4. Un module n'est pas forcément un microservice

Plusieurs modules peuvent vivre dans un même service quand ils **partagent le même agrégat**, chacun
derrière **sa propre gate**. Par exemple, `credit`, `collecte` et `caisse` partagent le compte du membre
et vivent dans `microfinance-service`. Chaque nouveau service coûte environ 13 points de socle, et les PRD
l'ont oublié quatre fois de suite.

**Critère de découpage :** **un agrégat distinct, c'est un service distinct.** Si deux modules écrivent
le même document, ils sont dans le même service. Sinon, on les sépare. La preuve est la garde de
câblage : deux modules dans un même service ne partagent pas de collection **qu'ils écrivent tous les
deux** sans que la spine le dise.

---

## 5. Exemple : ce que Dev A pose pour `reseau` en semaine 1

| Clause | Pour `reseau` |
|---|---|
| C1 | `reseau` **enregistré au catalogue** ; manifeste : `depends: []`, `enrichiPar: []`, publie `reseau.portee.changed@1` |
| C2 | `requires-reseau-access` + `RESEAU_NOT_ENTITLED` (EPIC-044, le socle) |
| C3 | ses collections seules ; garde de câblage dès le squelette |
| C7 | droits `reseau:<objet>:<action>` ajoutés à `TenantPermission` par une PR dans `auth-service` |
| C10 | `profiles: ["reseau"]` dès le premier commit du service dans le compose |

`pdv`, qui vient ensuite, déclare `depends: ['reseau']` : c'est le premier vrai cas de dépendance dure, et
le premier test de `MODULE_DEPENDANCE_MANQUANTE`.

---

## 6. Ce que chaque PRD, chaque épic et chaque story en tire

**Dans chaque PRD,** une section **« Contrat de module »** de dix lignes, une par clause : la valeur pour
ce module (manifeste, gate, données possédées, emplacements vides, topics, paramètres, droits, écrans,
profil), ou **« sans objet » avec sa raison**. Une ligne vide fait échouer le contrôle de préparation
(`bmad-check-implementation-readiness`).

**Le premier épic de chaque module est son socle :** C1, C2, C3 et C10. C'est ce qui manquait aux PRD et
coûtait les 13 points oubliés.

**Dans chaque fiche de story,** la définition de « fini » cite les clauses qu'elle touche. **La story qui
livre la gate livre aussi le test aller-retour (C9).**

---

## 7. Écarts mesurés, et qui les porte

| Écart (2026-11-09) | Porteur | Quand |
|---|---|---|
| Aucun manifeste ni `depends` au catalogue ; pas de `MODULE_DEPENDANCE_MANQUANTE` | Dev B, moteur d'installation (n°26) | sem. 5 (07/12) |
| `reseau` absent du catalogue | Dev A | sem. 1 |
| Aucun profil compose ; microfinance, assurance et fiscal hors du compose | Dev A pour `reseau` ; ticket pour rétro-équiper les services existants | sem. 1, puis au fil des gates |
| Catalogue des droits fermé dans `auth-service` | accepté en v1 (C7) ; lecture depuis les manifestes au moteur | sem. 5 |
| Un droit d'un module non installé est-il filtré ? | Dev B, à mesurer au lot 1 | sem. 1 |
| STORY-365 dépassée par 166 et 167 | Dev B, à requalifier | sem. 1 |
| ⚠️ **Le plan v2 (§1.1) dit que les packs citent des modules non enregistrés.** C'est **périmé** : `pdv`, `stock`, `catalogue`, `commande` et `facturation` sont au seed du catalogue | ✅ corrigé dans le plan, dans la même PR que ce document | 2026-11-09 |

---

## 8. Les choix demandés au PO pour vendredi 13/11

| # | Question | Recommandation | Pourquoi |
|---|---|---|---|
| **Q1** | Où vit le manifeste ? | **Dans le dépôt du service** (source), **copié au catalogue par version**, avec une garde de comparaison | Le propriétaire du module le tient ; le moteur lit le catalogue ; le patron « copie + garde » est déjà payé |
| **Q2** | Désinstaller un module dont un autre dépend ? | **Refuser (409 `MODULE_REQUIS_PAR`)** | Une cascade silencieuse ferme des écrans que personne n'a choisi de fermer |
| **Q3** | Une dépendance dure est **suspendue** (impayé) : que fait le module qui en dépend ? | **Il reste ouvert** ; ce qu'il lit d'elle se déclare `SUSPENDU` | L'impayé suspend déjà **tous les droits à échéance ouverts par le même contrat** (STORY-280). Le cas restant est une dépendance suspendue **seule** : un litige décidé par un opérateur, ou un module pris sur un autre contrat. Fermer le dépendant punirait un module payé |
| **Q4** | Combien de temps garde-t-on les données après désinstallation ? | **Sans limite jusqu'à une demande d'effacement**, qui est un acte séparé et tracé | Réinstaller sans perte (C9) l'exige. ⚠️ **À confirmer côté juridique** (données personnelles), comme le point PI-SPI de STORY-668 |
| **Q5** | Une dépendance se déclare par code ou par version ? | **Par code** en v1 | La même règle que les référentiels (STORY-148) ; la version du topic porte les ruptures |

---

## 9. Ce que ce document ne fait PAS

- Il **ne spécifie pas l'API du moteur d'installation** (installer un pack, ordre des dépendances, refus).
  C'est la deuxième pièce du lot 1 : son PRD cite ce contrat.
- Il **ne dessine pas la coque `prospera-app`.** C'est la troisième pièce du lot 1 : sa spine part de C8.
- Il **ne traite pas l'installation complète chez le client** (images, mises à jour, licence) : D3 la
  renvoie après les 8 semaines. Seul le profil compose (C10) est dans le périmètre.
- Il **ne crée aucune story.** Les écarts du §7 entrent dans les épics du moteur d'installation
  (EPIC-142 et suivants, plage de Dev B) ou dans la story qui les touche.
