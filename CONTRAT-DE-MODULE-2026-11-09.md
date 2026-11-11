# Le contrat de module : ce qu'un service doit tenir pour être installable · **document de doctrine**

> **Date :** 2026-11-09 · **Statut :** ✅ **VALIDÉ par le PO le 2026-11-09**, avec ses cinq choix
> Q1 → Q5 (§8), quatre jours avant l'échéance du 13/11. **Amendé le 2026-11-10 par le PO : clause C11
> « module avec IA »**, issue de la table ronde du PRD moteur d'installation.
> **Amendé le 2026-11-11** par la spine du moteur d'installation : C1, C2, C5, C7, C10, C11 (point 5) et
> C13 (voir leurs paragraphes « Amendement (2026-11-11) »).
> **Auteur :** Dev B (lot 1 du cadrage, `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` §1.3 et §4)
> **Décision de programme :** **AD-P17**, inscrite dans `architecture-prospera-ecosystem-2026-07-04.md`.
> **S'applique à :** tout module du programme, à partir d'**EPIC-045** chez Dev A. **Chaque PRD écrit
> ensuite cite ce document** (§6).
> **Décisions déjà rendues sur lesquelles il repose :** D1 (une seule app `prospera-app`), D2 (deux niveaux
> de dépendance), D3 (un profil `docker compose` par module). Toutes trois tranchées le 2026-11-09.

> **Amendement du 2026-11-10 (PRD moteur d'installation) : à valider par le PO le 13/11.**
> Source : `prds/prd-moteur-installation-2026-11-09/prd.md` §8.4. Les dix premières clauses et les cinq
> choix Q1 → Q5 restent validés tels quels ; ce qui suit s'y **ajoute** ou les **précise**.
>
> | Où | Changement |
> |---|---|
> | **C12** *(nouvelle)* | Migrations rétrocompatibles pendant 7 jours ; exception déclarée `retourArriere: AVEC_PERTE`, interdite sur la plateforme |
> | **C13** *(nouvelle)* | Installable sous contrôle : prérequis, vérifications, santé, interception en essai, export, import et effacement par organisation |
> | **C1** | `depends: [{ code, raison }]` ; nouveaux champs du manifeste ; `MANIFESTE_CYCLE` et `MANIFESTE_DEPENDANCE_MINEURE` ; module `instance` au catalogue |
> | **C2** | La garde lit l'état publié poussé ; `LECTURE_SEULE` ; export ouvert, y compris en `SUSPENDU` ; identité de service du moteur |
> | **C6** | Même schéma de données pour toutes les organisations |
> | **C7** | Droits `instance:*` du module `instance` ; format d'`auth-service` à élargir aux codes à tiret |
> | **C8** | Visible en `EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS` ; en `LECTURE_SEULE` : visible, lecture et export seulement |
> | **C9, Q4** | Deux exceptions écrites à la règle « sans limite jusqu'à une demande d'effacement » |
> | **C11** | Une clause par finalité ; remise des indicateurs de niveau 0 à l'agent d'instance |
> | **Q3** | Sa raison (« l'impayé suspend déjà tous les droits ») n'est plus vraie ; la décision est à reconfirmer |
> | **§0, §1** | Installer = tout octroi passe par le moteur ; Pack = mot commercial ; socle de vertical ; Suspendre n'est pas Désinstaller |
> | **§6, §7** | Section « Contrat de module » de **treize** lignes ; nouveaux écarts mesurés |
> | **§9** | Suit la révision de D3 (instance sur site prête avant février 2027) |

---

## 0. En une page

**Un module est ce qu'on vend et qu'on installe** : un code au catalogue (`reseau`, `pdv`, `stock`…).
**Un service est ce qu'on déploie** : un dépôt, un conteneur. Un service peut porter plusieurs modules (§4).

**Installer** un module pour un client, c'est le **faire passer par le moteur d'installation**, qui
l'installe puis le met en service : l'entitlement `(organisation × module)` passe alors en `ACTIVE`.
**Aucun autre chemin ne pose `ACTIVE`** (le paiement, un pack, un opérateur ou une licence ne font que
prolonger ou rouvrir un module déjà installé), sauf le module `instance`, qui naît avec l'organisation.
**Le désinstaller**, c'est le passer en `REVOKED`. Un **pack** est un mot commercial : l'offre qui
préselectionne plusieurs modules. Le mécanisme existe déjà. Ce qui manque, c'est la **règle** qui rend
chaque module digne d'être installé seul, et c'est l'objet de ce document.

Un module est « fini » quand il tient les dix premières clauses, plus la onzième s'il embarque de l'IA, plus les deux dernières (C12 et C13, ajoutées le 2026-11-10). L'état est
**mesuré sur `origin/dev` le 2026-11-09**.

| # | Le module… | La preuve | État mesuré |
|:--:|---|---|:--:|
| C1 | a un **manifeste** : code, version, dépendances dures et optionnelles, familles de référentiels, droits, événements, profil compose | le catalogue refuse un module dont une dépendance dure manque, avec un code nommé | ⛔ aucun champ de dépendance au catalogue |
| C2 | porte son **socle** : entitlement, gate, cloisonnement par organisation | sans entitlement : un 403 nommé, jamais une donnée ; en lecture seule, l'écriture refusée et l'export ouvert | ✅ patron en place (paiement, microfinance, bilan…) |
| C3 | **possède ses données**, et lui seul les écrit | la garde de câblage (STORY-643) ne voit aucune collection d'un autre module | ✅ garde posée dans 5 dépôts |
| C4 | **fonctionne seul** : une dépendance optionnelle absente donne un **emplacement déclaré vide** | un test par dépendance optionnelle désinstallée | ⚠️ règle écrite (pdv AD-7), jamais testée |
| C5 | **parle par contrats nommés** : topic versionné ou endpoint, jamais la base d'un autre | la suite de conformité, jouée par le consommateur | ✅ patron en place (`entitlement.changed` v2) |
| C6 | se **paramètre par des données**, jamais par `if (client === …)` | une garde de balayage | ⚠️ règle écrite (pdv AD-8), aucune garde transverse |
| C7 | **déclare ses droits de tenant**, que l'administrateur du client attribue lui-même | ils apparaissent dans la console du client sans déploiement | ✅ attribution (166, 167) · ⚠️ catalogue des droits fermé |
| C8 | livre son **module d'écran** dans `prospera-app` | une organisation sans le module ne le voit pas dans le menu ; en lecture seule, il est visible sans action d'écriture | ⛔ la coque n'existe pas |
| C9 | s'**installe et se désinstalle sans perte** | test aller-retour : installer, désinstaller, réinstaller, tout est là | ⚠️ le mécanisme le permet, aucun test ne le prouve |
| C10 | **démarre seul** avec le socle minimal | `docker compose --profile <code> up` à chaque gate | ⛔ aucun profil dans le compose |
| C11 | **s'il embarque de l'IA** : journal local des prédictions et corrections, modèle à deux étages, entraînement là où vivent les données, rien ne sort sans consentement | une mise à jour laisse la calibration du client intacte ; une contribution sans consentement est refusée | ⛔ aucun module IA en code (l'IA des démos est maquettée) |
| C12 | **migre sans casser la version précédente pendant 7 jours** : étendre puis contracter, lecteur tolérant, topics `@2`, interrupteurs qui ne changent jamais la forme des données | le test « promouvoir, saisir, revenir, tout se relit » | ⛔ aucun module ne le tient ni ne le teste |
| C13 | est **installable sous contrôle** : prérequis et vérifications avec critère, santé, interception en essai, export, import et effacement par organisation | un test par obligation, dont la matrice des neuf états publiés | ⛔ aucun manifeste ne le déclare |

**Validé le 2026-11-09 :** les dix clauses, et les **cinq choix du §8** (Q1 → Q5), tous tranchés selon
la recommandation.

---

## 1. Le vocabulaire, fixé une fois

| Mot | Sens exact | Où il vit aujourd'hui |
|---|---|---|
| **Module** | Une capacité vendable, identifiée par un `code` stable en kebab-case | `platform-catalog-service` › `Module` |
| **Version de module** | Une version du code d'un module ; le manifeste s'y attache (§2, C1) | `ModuleVersion` (`moduleCode`, `version`, `status`) |
| **Pack** | **Mot commercial** : une liste de modules et de référentiels vendus ensemble pour un métier. Il préselectionne, il n'octroie rien | `VerticalPack` : `distributeur`, `imf-sfd`, `assurance-cima`, `cabinet` (le **catalogue du vertical**) |
| **Socle de vertical** | N'ouvre plus aucun module : il devient la **liste d'applications** du vertical (l'offre préchargée) | `VerticalPack` ; STORY-727 lot 7 ajusté |
| **Installer** | Passer par le moteur : il installe, puis met en service, ce qui pose l'entitlement `(organisation × module)` en `ACTIVE`. **Tout octroi** passe par lui ; hors le module `instance` (naissance de l'organisation), aucun autre chemin ne pose `ACTIVE` | `Entitlement`, index unique `{organizationId, moduleCode}` |
| **Mettre en service** | Ouvrir à l'utilisateur un module déjà installé et vérifié, dans l'espace réel ; l'espace d'essai précède toujours | PRD moteur FR-7, FR-8 |
| **Suspendre** | `SUSPENDED` : le module refuse, les données restent. C'est une **sanction décidée** (litige, contrat non respecté), **plus** l'impayé (qui suit le préavis, puis la lecture seule). **Suspendre n'est pas Désinstaller** : la suspension se lève, la désinstallation se rouvre par le moteur. L'export reste ouvert | `EntitlementStatus` ; STORY-280 ajustée |
| **Désinstaller** | `REVOKED` : le module refuse, **les données restent** | `EntitlementStatus` |
| **Expiré** | Statut **lu**, jamais écrit, dérivé du terme (`ECHEANCE` dépassée). Il ouvre un **préavis de 30 jours** (`PREAVIS`, module ouvert), puis la **lecture seule** | `terme.ts` › `STATUT_EXPIRE` ; STORY-727 lot 4 ajusté |
| **Lecture seule** | `LECTURE_SEULE` : le module est **visible**, on le lit et on l'exporte, on n'y écrit rien (C2, C8) | PRD moteur FR-43 |
| **Dépendance dure** (`depends`, chaque entrée porte sa `raison`) | Sans elle, le module n'a pas de sens : son installation est refusée | **n'existe pas** (C1) |
| **Dépendance optionnelle** (`enrichiPar`) | Elle ajoute des informations ; son absence laisse un emplacement vide | **n'existe pas** (C1) |
| **Emplacement vide** | Une donnée que l'API **annonce** comme non disponible, au lieu de la taire ou de rendre 0 | pdv AD-7 (règle écrite) |

---

## 2. Les treize clauses

### C1 : le manifeste

**Règle.** Chaque version de module déclare, dans un manifeste :

```ts
// <service>/src/module.manifest.ts : un fichier par module porté par le service
export const MANIFESTE_PDV = {
  code: 'pdv',
  version: '1.0.0',
  depends: [{ code: 'reseau', raison: 'Un point de vente se rattache à une agence.' }], // dures : sans elles, installation refusée
  enrichiPar: ['commande', 'facturation'],   // optionnelles : sans elles, emplacement vide
  referentielFamilies: [],                   // déjà au catalogue (STORY-148)
  droits: ['pdv:fiche:consulter', 'pdv:portefeuille:affecter' /* … */],
  publie: ['pdv.point-de-vente.changed@1'],
  consomme: ['reseau.portee.changed@1', 'entitlement.changed@2', 'identity.*'],
  profilCompose: 'pdv',
  // ajoutés le 2026-11-10 (C12, C13) :
  prerequis: [/* serveur conforme, ressources externes */],
  verifications: [/* { code, route, critere } : bilan d'installation */],
  retourArriere: 'SANS_PERTE',               // ou 'AVEC_PERTE' (C12)
  interrupteurs: [],                         // changements de comportement visibles (C12)
  routesLectureSeule: [/* export, états réglementaires */],
} as const;
```

**Où il vit (Q1, ✅ tranchée).** La **source** est ce fichier, dans le dépôt du service : c'est le
propriétaire du module qui le tient. Le **catalogue en garde une copie par `ModuleVersion`** : c'est elle
que le moteur d'installation lit. Une **garde de test** compare les deux, sur le patron déjà payé de
`packs.front-snapshot.ts`, où toute divergence doit être déclarée avec son motif.

**Preuve.** Le catalogue refuse d'installer un module dont une dépendance dure n'est pas installée chez
l'organisation : réponse **422 `MODULE_DEPENDANCE_MANQUANTE`**, avec la liste des codes manquants.

**Amendement (2026-11-10).** Le manifeste porte aussi : `depends: [{ code, raison }]` (la raison
s'affiche au choix de l'offre) ; les **prérequis** ; les **vérifications**, chacune avec son critère et sa
route ; les **droits de tenant** ; `retourArriere: SANS_PERTE | AVEC_PERTE` ; les `interrupteurs` ; les
**routes autorisées en lecture seule** ; le profil compose ; et `ia` s'il y a de l'IA (C11). Le catalogue
refuse à la publication un manifeste qui crée un cycle (**422 `MANIFESTE_CYCLE`**) et une **version
mineure qui ajoute une dépendance dure** (`MANIFESTE_DEPENDANCE_MINEURE`) : une dépendance nouvelle
n'arrive qu'avec une version majeure, et elle est fournie sans facturation. Le **moteur d'installation
est lui-même un module du catalogue** : `code: instance`, `depends: []`. **Un module qui n'est pas au
catalogue avec son manifeste ne se vend pas.**

**État mesuré.** `Module` porte `code`, `name`, `description`, `status`, `referentielFamilies`.
`ModuleVersion` porte `moduleCode`, `version`, `status`, `deprecationDate`, `releasedAt`. **Aucune
dépendance, aucun droit, aucun événement déclaré.** Le refus d'un module inconnu existe déjà
(`MODULE_INCONNU`, `PACK_MODULE_UNKNOWN`, `MODULE_NON_OCTROYABLE`) : le refus de dépendance s'ajoute à
cette famille de codes. ⚠️ **`reseau` n'est pas enregistré au catalogue** (seed `modules.seed-data.ts`) :
c'est la première tâche de Dev A en semaine 1.

**Amendement (2026-11-11, spine du moteur d'installation, AD-23 et AD-42).** Le schéma de `ModuleVersion`
au catalogue reçoit les champs du manifeste : les **dépendances** (`depends`, avec leur raison), les
**droits**, les **événements** publiés et consommés, les **vérifications** (route, critère), `retourArriere`,
les **interrupteurs**, les **routes de lecture seule**, les **migrations** (un point d'entrée `migrer`
idempotent, C13) et les **schémas d'événements** (JSON Schema, enregistrés au registre par l'agent à
l'étape de migration). Le manifeste signé de la version de plateforme les reprend tels quels. La garde de
test qui compare la source à la copie du catalogue couvre ces champs aussi.

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

**Amendement (2026-11-10).** La garde ne lit jamais l'horloge de son conteneur : elle lit l'**état publié**
que le moteur lui pousse (neuf états : `NON_INSTALLE`, `EN_INSTALLATION`, `DESINSTALLE`, `EN_SERVICE`,
`ESSAI_PROSPECT`, `PREAVIS`, `LECTURE_SEULE`, `ESSAI_TERMINE`, `SUSPENDU`).
- **`LECTURE_SEULE`** : la garde laisse passer `GET`, `HEAD` et `OPTIONS`, et refuse toute écriture par un
  **403 `ABONNEMENT_EXPIRE`**, sauf les routes que le module déclare à son manifeste comme autorisées en
  lecture seule (export, états réglementaires).
- **L'export passe toujours.** Chaque module expose une route d'export par organisation, exemptée de la
  garde, réservée au détenteur de `instance:donnees:exporter`. Elle est ouverte dans **tous les états où le
  module peut garder des données de l'organisation**, `SUSPENDU` compris : récupérer ses données est un
  droit du client, et une sanction commerciale ne crée pas de manquement réglementaire chez lui. Seul
  `NON_INSTALLE` la refuse (403 `<MODULE>_NOT_ENTITLED`, aucune donnée).
- **Pendant `EN_INSTALLATION`**, les routes de vérification déclarées au manifeste laissent passer
  l'**identité de service du moteur**, et elle seule. Pendant un **rejeu** du dossier d'installation, les
  **routes d'import** déclarées au manifeste (C13) laissent passer l'identité de service du moteur et celle
  de la Reprise de données, et elles seules (amendement du 2026-11-11, PRD moteur FR-42).
- **Preuve ajoutée.** Une matrice : pour chacun des neuf états et chaque sorte de route (lecture,
  écriture, export, état réglementaire), **un seul attendu**, et le menu de la coque (C8) concorde avec la
  garde.

**Amendement (2026-11-11, spine du moteur d'installation, AD-24).** La garde lit **l'état publié seul**.
`entitlement.changed` ne sert plus à fermer un module, et `echeanceLe` n'est plus lu pour décider : le
moteur calcule l'état publié à la lecture et émet `etat-publie.changed` à l'heure dite. Il y a **un état
publié par espace** (essai, réel), et un topic par espace.

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

**Amendement (2026-11-11, spine du moteur d'installation, AD-27).** Les **nouveaux** contrats écrivent
`organisationId`, une seule graphie. L'existant garde la sienne, service par service ; un renommage passe par un topic `@2`, jamais par un changement de champ en place (C12).

### C6 : se paramétrer par des données

**Règle.** Ce qui varie d'un client à l'autre passe par des **référentiels versionnés** ou des **règles
structurées à grammaire fermée** (pdv AD-8 : grandeur × comparateur × seuil × état). ⛔ Aucun
`eval`, aucun interpréteur. ⛔ Aucune branche de code sur l'identité d'un client. Un module propre à un
client reste possible, mais c'est **un module du catalogue comme un autre**, avec son manifeste.

**Preuve.** Une **garde de balayage** dans le gabarit de service. Elle cherche des **formes
exécutables**, jamais des mots : une comparaison d'un `organizationId` ou d'un `orgId` à un littéral, et
un nom d'organisation en dur dans `src/` hors des seeds.

**Amendement (2026-11-10).** Un module a **le même schéma de données pour toutes les organisations** :
aucune variante par client (C6, C11), ce qui rend possible un modèle commun et une mise à jour unique.

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

**Amendement (2026-11-10).** Le **module `instance`** (le moteur) est au catalogue et naît avec chaque
organisation. Ses droits `instance:*` (dont `instance:donnees:exporter`) s'attribuent comme les autres et
ne dépendent d'aucun autre module installé. Le droit de **consentir** (C11) ne s'attribue que par le DG.
⚠️ Le format de droit d'`auth-service` refuse les codes de module **à tiret** : à élargir. Les droits
d'un manifeste, lus par le moteur, remplacent à terme l'`enum` fermé.

**Amendement (2026-11-11, spine du moteur d'installation).** Le format de droit s'élargit aux **codes de
module à tiret** (`<module>:<objet>:<action>` où le module peut contenir un tiret). La story `auth-service` qui l'élargit se livre **avant la semaine 5**, avec la route de
naissance à identifiant imposé (PRD moteur, FR-42).

### C8 : le module d'écran

**Règle.** Dans `prospera-app` (D1), chaque module livre son dossier `src/modules/<code>/` : routes,
écrans, client d'API typé, et ses **entrées de menu, chacune avec le droit qu'elle exige**. Une entrée
est visible si et seulement si l'entitlement effectif est `ACTIVE` **et** l'utilisateur a le droit.

**Preuve.** Un test de la coque : une organisation sans le module ne voit pas ses entrées, et une URL
saisie à la main rend l'écran « module non installé », jamais une page cassée.

**Dépend de** la spine de la coque, troisième pièce du lot 1, due le 20/11 à Dev A.

**Amendement (2026-11-10).** Une entrée de menu est visible si et seulement si l'**état publié** vaut
`EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS` **ou `LECTURE_SEULE`**, **et** si l'utilisateur a le droit.
- En **`LECTURE_SEULE`**, le module est **visible, en lecture et en export seulement** : les actions
  d'écriture sont absentes ou désactivées, et un bandeau dit pourquoi.
- Une valeur d'état inconnue de la coque se lit `NON_INSTALLE` : on ferme, on n'ouvre pas.
- L'app expert-comptable (le cabinet) suit **la même règle**, sur le même état publié.
- En `SUSPENDU`, le module n'est pas au menu ; l'export reste atteignable par l'écran d'Administration du
  module `instance`.

### C9 : installer et désinstaller sans perte

**Règle.** Installer est **idempotent** : l'index unique `{organizationId, moduleCode}` le garantit déjà.
Désinstaller (`REVOKED`) **ne supprime rien**. Réinstaller retrouve **exactement** l'état d'avant.
Effacer les données est un **acte séparé**, demandé, tracé, et hors de ce contrat (Q4).

**Preuve.** Le test aller-retour, joué sur le vrai backend à chaque Integration Gate : créer des données,
désinstaller (403 nommé), réinstaller, relire les mêmes données.

**Amendement (2026-11-10).** La règle « effacer est un acte séparé » n'a que **deux exceptions écrites**,
détaillées à Q4 (§8) : l'essai prospect non signé, et l'acheteur hébergé sur la plateforme qui arrête son
abonnement d'hébergement. Désinstaller ne supprime toujours rien, y compris les copies que gardent les
voisins : elles restent stockées et masquées.

### C10 : démarrer seul

**Règle.** Chaque service déclare `profiles: ["<code>"]` dans `docker-compose.yml`, un profil par module
qu'il porte. Le **socle minimal** (Mongo, Kafka, `auth-service`, `platform-catalog-service`) n'a **pas
de profil** : il démarre toujours. `docker compose --profile <code> up` doit suffire à lever le module et à
passer sa recette.

**État mesuré.** ⛔ **`docker-compose.yml` ne déclare aucun profil.** `prospera-microfinance-service`,
`prospera-assurance-service` et `prospera-fiscal-service` **n'y figurent pas**. Le profil est aussi la
première brique de l'installation chez le client (D3).

**Preuve.** La commande ci-dessus, lancée à chaque gate, puis la recette du module.

**Amendement (2026-11-11, spine du moteur d'installation, AD-10 et AD-27).** Le **socle d'un espace**
inclut, en plus de ce qui précède, le **registre de schémas** (Karapace), **Redis** (jobs BullMQ) et
**MinIO**, un jeu par espace. **L'agent d'instance** n'est pas dans le socle ni dans un profil : il vit
dans son propre projet Compose, `<instance>-agent`, hors profils, et remplace les images des services sans
être remplacé par eux.

### C11 : le module avec IA (ajoutée le 2026-11-10)

**Pourquoi.** L'IA des projets n'est pas un service à part : elle vit **dans chaque module** (scoring de
crédit, alertes de comptes dormants, résumé automatique de sinistre, recommandation de produit…), et
l'offre assurance promet une **IA locale calibrée sur l'historique du client**. Le but déclaré du PO est
d'en tirer un **modèle commun** à partir des historiques de tous les clients, le plus tôt possible.
Cette clause rend les deux possibles sans trahir la donnée d'un client.

**Règle.** Un module qui embarque un modèle :

1. **le déclare dans son manifeste** (C1) : `ia: { modeles: [...], finalites: [...] }`. Un module sans ce
   champ n'a pas d'IA, et la clause ne s'applique pas à lui.
2. **journalise localement chaque prédiction et chaque correction humaine** : référence de l'objet, sortie,
   version du modèle, date, et la correction le cas échéant. Ce journal est une donnée du module (C3) et
   la matière première de toute amélioration.
3. **sépare deux étages de modèle** :
   - le **modèle commun**, livré par Money Vibes, signé et versionné comme du code ;
   - la **calibration locale**, qui est une **donnée du client**. ⛔ **Une mise à jour ne l'écrase
     jamais** ; elle est sauvegardée et restaurée avec les autres données (C9).
4. **s'entraîne là où vivent les données**. Le programme d'entraînement est livré comme une mise à jour ;
   les données ne se déplacent pas pour lui.
5. **ne fait rien sortir hors du canal de données de l'instance**, et seulement au niveau qu'autorise un
   **consentement valide** du client : niveau 0 (indicateurs agrégés), 1 (échantillon pseudonymisé
   approuvé à chaque export), 2 (accès encadré), 3 (mise en commun consentie). ⚡ **La règle vaut aussi
   quand l'instance est hébergée chez Money Vibes** (cas des distributeurs) : avoir la donnée sur nos
   serveurs ne donne pas le droit de la mettre en commun.
6. **affiche toute prédiction avec sa provenance** : modèle, version, date. Une prédiction sans provenance
   ne s'affiche jamais comme un fait (règle déjà posée par pdv AD-7 pour les scores).

**Preuve.**
- Une **empreinte de la calibration** identique avant et après une mise à jour.
- Une contribution à la mise en commun **sans consentement valide** : refus nommé `CONSENTEMENT_ABSENT`,
  et rien n'est sorti.
- Une correction humaine fait **croître** le journal, et l'indicateur agrégé de niveau 0 la compte.
- Un consentement retiré **exclut** le client du tour d'entraînement suivant. ⚠️ Il ne « désentraîne » pas
  un modèle déjà produit : le contrat client doit le dire (prérequis juridique, hors de ce document).

**État mesuré.** ⛔ Aucun module IA n'existe en code : `assistant-service` est cadré (EPIC-095 → 105) mais
non construit, et l'IA des démos de `prospera-font-end` est maquettée. Le registre des consentements et le
canal de données sont portés par le PRD du moteur d'installation (partie C).

**Amendement (2026-11-10).**
- **Point 5, précisé.** Le consentement se donne **par finalité** : une clause par finalité, une ligne du
  registre par finalité. L'IA de Money Vibes lit les données par un **compte de service dédié** qui passe
  par la garde du registre (jamais par un accès direct à la base).
- **Niveau 0.** Chaque module avec IA remet ses **indicateurs agrégés** (taux d'erreur par modèle,
  nombre de corrections, dérive) à l'agent d'instance par un **contrat nommé** (C5), sous un schéma fermé.
  Aucun indicateur ne contient un identifiant de personne ou de dossier.
- **Preuve ajoutée.** Un test échoue si un champ non déclaré sort dans l'indicateur.

**Amendement (2026-11-11, spine du moteur d'installation, AD-13 et AD-14 ; point 5).**
- Le **compte de service IA de la plateforme** est un compte dédié, qui ne lit que par la **garde du
  registre** : une lecture sans consentement valide pour la finalité est refusée `CONSENTEMENT_ABSENT`, et
  rien ne sort. Les **lectures d'exploitation** des routes de lecture d'un module (assistance, support)
  sont **journalisées**, sans export en masse, et ne servent **jamais** à l'apprentissage : cette règle
  tient lieu de référence à AD-P16 pour la partie C (AD-P16 reste la règle de l'exploitation).
- Sur site, ces routes de lecture ne sont atteignables que pendant un tunnel de support ouvert par le DSI.

### C12 : migrations rétrocompatibles pendant 7 jours (ajoutée le 2026-11-10)

**Pourquoi.** Le client doit pouvoir **revenir à la version précédente en un clic, sans perte**, pendant
les 7 jours qui suivent une promotion. Cela suppose que la version précédente **relise** ce que la
nouvelle a écrit. Cette clause en fait une propriété de chaque module.

**Règle.**
1. **Étendre puis contracter.** Pendant les 7 jours, une migration est **additive** : ajouter un champ,
   une collection, un index. Supprimer, renommer ou changer le type d'un champ se fait dans la version
   **suivante**, hors de la fenêtre.
2. **Lecteur tolérant sur les topics.** Un consommateur ignore les champs qu'il ne connaît pas. Un
   changement incompatible passe par un **topic `@2`**, le `@1` restant publié pendant la fenêtre (C5).
3. **Valeurs d'énumération.** Une valeur ajoutée ne casse pas la version précédente : elle la lit comme
   inconnue sans planter. On commence par la **lire** partout, puis on l'**écrit**.
4. **Interrupteurs.** Tout changement de comportement visible des utilisateurs est déclaré au manifeste
   (`interrupteurs: [...]`). Un interrupteur **ne change jamais la forme des données** : il ne commande que
   du comportement. Un changement de forme est une migration, soumise aux points 1 à 3.
5. **Exception déclarée.** Une version dont une migration ne peut pas être rétrocompatible déclare
   `retourArriere: AVEC_PERTE`. Elle est **permise sur site seulement** : bandeau rouge **avant** le choix
   de la date, jamais en vague automatique, retour arrière par restauration de la sauvegarde d'avant
   promotion. Elle est **interdite sur la plateforme** : le catalogue refuse (`AVEC_PERTE_INTERDIT_PLATEFORME`).
   Le défaut est `SANS_PERTE`.

**Preuve.** Un test par module, joué à chaque version : **promouvoir, saisir, revenir, tout se relit** ;
re-promouvoir, tout se relit encore. Un second test joue chaque interrupteur éteint puis allumé.

**État mesuré.** ⛔ Aucun module ne déclare `retourArriere` ni ne joue ce test. Les services existants
sont à rétro-équiper au fil de leurs gates.

### C13 : installable sous contrôle (ajoutée le 2026-11-10)

**Pourquoi.** Le moteur installe, vérifie, met à jour et efface des modules qu'il n'a pas écrits. Il ne le
peut que si chaque module **dit ce qu'il lui faut, prouve qu'il marche, et rend ses données**.

**Règle.** Le module, par son manifeste (C1) et son code :
1. **Déclare ses prérequis** (serveur conforme, ressources externes), vérifiés pendant l'installation.
2. **Déclare ses vérifications avec leur critère** : chacune a une route, un résultat 🟢, 🟠 ou 🔴 et un
   critère **chiffré**, pas un « OK ». Elles passent sous l'identité de service du moteur (C2).
3. **Rend sa santé** : `OK | DEGRADE`. Un module `DEGRADE` **reste ouvert** ; la santé ne ferme rien.
4. **Lit l'état publié poussé** (C2), jamais une date ni l'horloge de son conteneur.
5. **Déclare sa lecture seule** : la liste de ses routes autorisées en `LECTURE_SEULE` (C2).
6. **Intercepte ses sorties dans l'espace d'essai** : aucun envoi réel (message, courriel, paiement,
   connecteur) n'en part. Une tentative d'écriture réelle depuis l'essai est refusée avec un code nommé
   (`ECRITURE_REELLE_DEPUIS_ESSAI`).
7. **Exporte, importe et efface par organisation** : un export en CSV et JSON ; un import de **sa part**
   d'un dossier d'installation, rejouable sans doublon ; un effacement tracé, avec certificat.
8. **Rend ses vérifications idempotentes** : chaque vérification a une clef d'idempotence ; la rejouer ne
   double rien. Une installation interrompue reprend là où elle s'est arrêtée.
9. **Ne bloque pas les autres** : un prérequis en échec marque rouge le module et orange ses dépendants ;
   le reste reste utilisable.

**Preuve.**
- La **matrice** de C2 : neuf états publiés, un seul attendu par sorte de route.
- Une vérification **rejouée deux fois** ne crée rien de plus.
- **Exporter, effacer, importer** rend les mêmes données.
- Une sortie en essai est **interceptée et comptée**, jamais envoyée.
- Un module `DEGRADE` répond toujours à ses routes métier.

**État mesuré.** ⛔ Aucun manifeste ne déclare ces obligations. Le moteur d'installation (module
`instance`) est le premier à les tenir ; les modules existants s'y mettent à leur prochaine gate.

**Amendement (2026-11-11, spine du moteur d'installation, AD-17 et AD-33).** Le manifeste **nomme** les
routes d'**export**, d'**import**, d'**effacement** et de **vérification** de la clause (point 7), et la
route de lecture de l'état publié ; il déclare un **point d'entrée `migrer`**, **idempotent** : l'agent
l'appelle à l'étape de migration d'une promotion, sous verrou, et le rejouer ne double rien (C12).

---

## 3. Les dépendances (D2), en règles

1. **Deux niveaux, et seulement deux.** `depends` bloque l'installation, `enrichiPar` ne bloque jamais.
2. **Par code, pas par version (Q5, ✅ tranchée).** `depends: [{ code: 'reseau', raison }]`, et non `reseau >= 1.2`. C'est la règle déjà
   choisie pour les référentiels (« la compatibilité se raisonne par famille, jamais par version »,
   STORY-148). Une rupture de contrat se traite par la version du **topic** (C5), pas par la dépendance.
3. **Pas de cycle.** Le catalogue refuse un manifeste qui en crée un : **422 `MANIFESTE_CYCLE`**.
4. **Installer un pack**, c'est installer ses modules **dans l'ordre des dépendances**, en une action,
   et de façon idempotente.
5. **Désinstaller un module dont un autre a besoin** (Q2, ✅ tranchée) : **refusé**, **409
   `MODULE_REQUIS_PAR`**, avec la liste des modules qui en dépendent. Pas de cascade silencieuse.
6. **Une dépendance dure est une garantie d'installation, pas un couplage d'exécution.** Le module lit
   sa dépendance par ses read-models (C3). Si elle est suspendue (Q3, ✅ tranchée), il ne s'arrête pas : ce qu'il en
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
| C12, C13 | `retourArriere: SANS_PERTE` et les routes d'export déclarés dès le squelette ; la matrice de C2 jouée sur `RESEAU_NOT_ENTITLED` (neuf états) |

`pdv`, qui vient ensuite, déclare `depends: ['reseau']` : c'est le premier vrai cas de dépendance dure, et
le premier test de `MODULE_DEPENDANCE_MANQUANTE`.

---

## 6. Ce que chaque PRD, chaque épic et chaque story en tire

**Dans chaque PRD,** une section **« Contrat de module »** de **treize** lignes, une par clause (C11 « sans objet » pour un module
sans IA) : la valeur pour
ce module (manifeste, gate, données possédées, emplacements vides, topics, paramètres, droits, écrans,
profil), ou **« sans objet » avec sa raison**. Une ligne vide fait échouer le contrôle de préparation
(`bmad-check-implementation-readiness`), **qui est mis à jour pour treize lignes** (C12 et C13 ne sont
jamais « sans objet » sans raison écrite).

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
| Aucun module ne déclare C12 ni C13 (`retourArriere`, prérequis, vérifications, export, effacement) | chaque auteur de module, par la gate ; le moteur donne le gabarit | à chaque gate |
| La garde des modules lit encore les dates, pas l'état publié ; `LECTURE_SEULE` n'a pas sa liste d'export | Dev B, moteur d'installation (FR-34, FR-43) ; `paiement-service` et STORY-727 lot 4 ajustés | sem. 5 et suivantes |
| Format de droit d'`auth-service` : refuse les codes de module à tiret | Dev B, ticket `auth-service` | avant le premier module à tiret |
| Les 18 modules du distributeur (et ceux des autres verticaux) ne sont pas tous au catalogue | Dev B pour la liste (module, propriétaire, date), chaque auteur pour son manifeste | liste avant le 13/11 |

---

## 8. Les choix du PO (✅ tous tranchés le 2026-11-09, selon la recommandation)

| # | Question | ✅ Décision | Pourquoi |
|---|---|---|---|
| **Q1** | Où vit le manifeste ? | **Dans le dépôt du service** (source), **copié au catalogue par version**, avec une garde de comparaison | Le propriétaire du module le tient ; le moteur lit le catalogue ; le patron « copie + garde » est déjà payé |
| **Q2** | Désinstaller un module dont un autre dépend ? | **Refuser (409 `MODULE_REQUIS_PAR`)**, en nommant les modules qui en dépendent | Une cascade silencieuse ferme des écrans que personne n'a choisi de fermer |
| **Q3** | Une dépendance dure est **suspendue** (impayé) : que fait le module qui en dépend ? | **Il reste ouvert** ; ce qu'il lit d'elle se déclare `SUSPENDU` | L'impayé suspend déjà **tous les droits à échéance ouverts par le même contrat** (STORY-280). Le cas restant est une dépendance suspendue **seule** : un litige décidé par un opérateur, ou un module pris sur un autre contrat. Fermer le dépendant punirait un module payé. ⚠️ **Amendé le 2026-11-10 :** la raison « l'impayé suspend déjà tous les droits » n'est **plus vraie** (l'impayé ne suspend plus : préavis de 30 jours, puis lecture seule ; `SUSPENDU` est une sanction décidée). La décision tient pour une dépendance suspendue ou en lecture seule, mais le PO la **reconfirme le 13/11** |
| **Q4** | Combien de temps garde-t-on les données après désinstallation ? | **Sans limite jusqu'à une demande d'effacement**, qui est un acte séparé et tracé | Réinstaller sans perte (C9) l'exige. ⚠️ Risque résiduel, non bloquant : une revue juridique des données personnelles pourra imposer une durée ; elle s'appliquerait à l'effacement, pas au contrat. ⚡ **Deux exceptions écrites le 2026-11-10** (PRD moteur FR-33 et FR-32) : **(1)** l'essai d'un prospect qui ne signe pas est effacé 30 jours après sa fin, avec trace et certificat d'effacement, l'export restant possible avant ; ouvrir l'essai vaut accepter cet effacement. **(2)** L'acheteur hébergé sur la plateforme qui arrête son abonnement d'hébergement et de maintenance a un préavis de 30 jours, puis **90 jours de lecture seule** avec export de ses données, puis ses données sont **supprimées par Money Vibes** selon la loi 2019-014 (ou il passe sur site) |
| **Q5** | Une dépendance se déclare par code ou par version ? | **Par code** en v1 | La même règle que les référentiels (STORY-148) ; la version du topic porte les ruptures |

---

## 9. Ce que ce document ne fait PAS

- Il **ne spécifie pas l'API du moteur d'installation** (installer un pack, ordre des dépendances, refus).
  C'est la deuxième pièce du lot 1 : son PRD cite ce contrat.
- Il **ne dessine pas la coque `prospera-app`.** C'est la troisième pièce du lot 1 : sa spine part de C8.
- Il **ne traite pas l'installation complète chez le client** (images, mises à jour, licence, retour
  arrière, canal de données). **D3 est révisée** (décision du PO, séance du 2026-11-09, actée à
  l'amendement du plan v3 du 2026-11-10) : l'instance sur site est **prête avant février 2027**, et non plus
  « après les 8 semaines ». Son périmètre est celui du PRD du moteur d'installation ; ce contrat n'y garde
  que les clauses que les modules doivent tenir (C10, C12, C13).
- Il **ne crée aucune story.** Les écarts du §7 entrent dans les épics du moteur d'installation
  (EPIC-142 et suivants, plage de Dev B) ou dans la story qui les touche.
