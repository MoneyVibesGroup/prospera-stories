# STORY-360 : Le journal du dossier devient lisible — et l'administrateur voit qui a modifié quoi

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — blocs **L** et **N** · décision **D12** · question **Q10** *(tranchée : option b)* · **STORY-294** *(le même défaut sur le journal des organisations)* · **STORY-144** *(l'écriture sans lecture)*
**Priorité :** Must Have
**Story Points :** 5
**Statut :** 🔍 **En revue** — `MNV-360` (`dossier-service`) poussée, portes vertes et vérification docker consignée
**Complexité :** medium
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

C'est la **troisième occurrence** du même défaut dans ce dépôt : *une écriture sans lecture ne se
signale nulle part — rien n'échoue, aucun test ne rougit.*

- **STORY-144** écrit `admin_audit_logs` ; **aucune route ne le relit** → STORY-294 le corrige, au
  sprint 20, en ce moment même.
- **STORY-079** écrit `profils_societe_audit` en append-only. `listerAudits` **existe** — mais il n'est
  appelé que pour reconstituer l'état à une date passée, en interne, au service du snapshot de liasse
  (`profil-societe.service.ts:356`). **Aucun contrôleur ne l'expose.** L'historique est écrit, complet,
  et invisible.

Et **D12 ajoute une exigence neuve** : un collaborateur peut modifier un dossier qui lui est affecté,
**mais l'administrateur doit être informé de chaque modification et de son auteur**. Le droit est
large ; c'est la traçabilité remontée qui l'encadre, pas une liste de champs interdits.

⚠️ **`notification-service` n'existe pas dans ce dépôt** — architecture cadrée le 2026-08-04
(spine AD-1→AD-19, port `:3008`), **aucun code**. **Q10 a tranché l'option (b)** : un fil d'activité
lisible dans l'application en v1 ; la notification poussée viendra quand le service existera.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **voir ce qui a été modifié sur mes dossiers, par qui et quand**,
afin de **laisser mes collaborateurs travailler sans perdre le contrôle de ce qui change**.

---

## Ce que la story livre

- **`GET /dossiers/:id/journal`** — l'historique d'un dossier, paginé, antéchronologique : horodatage,
  auteur *(identité, pas seulement un identifiant)*, nature de l'acte, et le couple **avant/après** du
  champ touché. Types d'actes : `DOSSIER_CREE`, `MANDAT_ATTESTE`, `IDENTITE_MODIFIEE`,
  `AXES_MODIFIES`, `RESPONSABLE_CHANGE`, `EXERCICE_OUVERT`, `EXERCICE_CLOS`, `EXERCICE_ROUVERT`,
  `DOSSIER_ARCHIVE`, `DOSSIER_REACTIVE`.
- **`GET /activite`** — le **fil d'activité du portefeuille**, réservé à `TENANT_ADMIN` : les
  modifications de **tous** ses dossiers, dans un seul flux, avec un **compteur de non-lus** et
  `POST /activite/lu` pour l'acquitter. C'est la réponse concrète à D12 sans `notification-service`.
- **Résolution de l'auteur** : l'identité (prénom, nom) vient du read-model `OrgMembers` alimenté par
  `identity.*`. ⚡ Ne **jamais** rendre un `userId` brut : STORY-294 documente exactement ce piège — un
  identifiant que le client ne sait pas résoudre rend le journal illisible, donc inutile.
- **Le journal survit aux personnes** : un collaborateur parti reste nommé dans les lignes qu'il a
  écrites. L'historique appartient au dossier, pas à l'employé (Q2).
- **Append-only garanti par le schéma**, pas par un commentaire : hooks `pre` bloquant
  `updateOne` / `deleteMany` / `findOneAndUpdate` sur la collection — la leçon exacte de la revue de
  STORY-079, où l'append-only n'était qu'un JSDoc et où tout module futur pouvait effacer la piste.

## Hors périmètre

- **`notification-service`** et toute notification **poussée** (e-mail, push) → Q10 option (b) ; à
  reprendre quand le service existera. Un hook est laissé, inerte et documenté.
- Le journal du **cabinet** (organisations, suspensions) → **STORY-294**, `auth-service`. Même forme,
  autre objet.
- La lecture de `profils_societe_audit` **historique**, écrit par STORY-079 avant la migration : il est
  repris par **STORY-356** dans le journal du dossier, avec sa date d'origine.

---

## Acceptance Criteria

- [ ] `GET /dossiers/:id/journal` rend les entrées **antéchronologiques**, paginées, chacune portant
      horodatage, **auteur nommé**, type d'acte et couple avant/après. Dossier hors portée → **404**.
- [ ] Les **dix** types d'actes listés produisent une entrée. *(Test par type — c'est le seul moyen de
      constater qu'un acte a été oublié au branchement.)*
- [ ] `GET /activite` — `TENANT_ADMIN` → **200** avec le flux consolidé et le compteur de non-lus ;
      `TENANT_USER` → **403**. `POST /activite/lu` remet le compteur à zéro pour cet administrateur.
- [ ] **D12 vérifié de bout en bout** : un collaborateur modifie l'identité d'un dossier qui lui est
      affecté → l'administrateur voit la ligne dans `/activite`, avec **le nom du collaborateur** et le
      champ modifié. *(C'est l'AC central de la story.)*
- [ ] Un auteur **désactivé** depuis reste **nommé** dans ses anciennes entrées ; aucune ligne ne
      devient anonyme.
- [ ] **Append-only prouvé par mutation** : un test tente `updateOne` et `deleteMany` sur la collection
      de journal et **échoue** si l'écriture passe.
- [ ] Le journal est écrit **dans la même transaction** que l'acte : un acte réussi sans entrée de
      journal, ou une entrée sans acte, font rougir un test.
- [ ] Les entrées reprises de `profils_societe_audit` (STORY-356) apparaissent avec leur **date
      d'origine**, pas la date de migration.

---

## Notes techniques

```ts
JournalDossierSchema.index({ orgId: 1, dossierId: 1, le: -1 });   // journal d'un dossier
JournalDossierSchema.index({ orgId: 1, le: -1 });                  // fil d'activité du portefeuille
```

- ⚡ **Poser l'index de lecture ne suffit pas** : STORY-144 avait posé
  `{ organizationId: 1, at: -1 }` en décrivant en commentaire *« l'historique de CETTE organisation, du
  plus récent au plus ancien »* — c'est-à-dire **exactement la requête que personne ne pouvait faire**.
  L'index de la lecture existait, la lecture non. Cette story livre les deux, et un test le vérifie.
- Le **compteur de non-lus** est un curseur par administrateur (`derniereLectureLe`), pas un drapeau
  par ligne : un drapeau par ligne coûte une écriture par lecture et se désynchronise à deux onglets.
- Le **hook inerte** pour la notification poussée est un point d'extension **documenté et testé comme
  inerte** — la leçon de STORY-173 (« ne pas rejouer un livrable inerte » : on le nomme, on le teste
  vide, on ne fait pas semblant qu'il fonctionne).

---

## Dépendances

**Prérequises :** **STORY-301** *(le journal y est écrit)* · **STORY-353** *(portée, et les actes
d'affectation/archivage à journaliser)* · **STORY-355** *(actes d'exercice)*.
**Patron à rejouer :** **STORY-294** *(auth-service — mêmes trois arbitrages : identité de l'acteur,
portée de la route, motif)*.
**Reprend :** **STORY-356** *(entrées historiques de `profils_societe_audit`)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : journal paginé et nommé, les 10 types d'actes, `/activite` réservé à l'admin, compteur de
      non-lus, auteur désactivé toujours nommé, append-only par mutation, transactionnalité.
- [ ] Vérification docker : **un vrai collaborateur** modifie un dossier, **un vrai administrateur**
      le voit dans son fil — deux jetons RS256 distincts, pas des fixtures.
- [ ] `/code-review` + `/security-review` (le journal est une preuve opposable).

---

## Story Points Breakdown

- Modèle `JournalDossier` + append-only par hooks + index : 1 pt
- Branchement des 10 types d'actes, dans la transaction : 1,5 pt
- `GET /dossiers/:id/journal` + résolution de l'auteur via `OrgMembers` : 1 pt
- `GET /activite` + curseur de non-lus + `POST /activite/lu` : 1 pt
- Tests (mutation append-only, transactionnalité, auteur parti) + docker à deux rôles : 0,5 pt
- **Total : 5 points**

---

## Progress Tracking

**Statut :** ✅ **Développée et validée** — `MNV-360` (`dossier-service`), en attente de revue.

### Ce qui a été livré

| Livrable | Où |
|---|---|
| `GET /dossiers/:id/journal` — antéchronologique, paginé, portée appliquée, auteur nommé | `modules/journal/journal.controller.ts` |
| `GET /activite` + `POST /activite/lu` — fil du cabinet, compteur de non-lus | `modules/journal/activite.controller.ts` |
| Curseur de lecture par administrateur (`activite_lectures`, index unique) | `modules/journal/schemas/lecture-activite.schema.ts` |
| Read-model `identity_users` (prénom/nom) + 2 topics souscrits | `modules/identity/{schemas/identity-user.schema,identity-users.service}.ts` |
| Append-only par **hooks de schéma** (8 opérations + `save()` hydraté) | `modules/dossiers/schemas/dossier-journal-entry.schema.ts` |
| Libellé humain des 10 actes, exhaustivité tenue par le **type** | `modules/journal/libelles-evenement.ts` |
| `IDENTITE_MODIFIEE` branché sur l'enrichissement de migration, en transaction | `modules/dossiers/dossiers.service.ts` |
| `_id` ajouté aux 2 index du journal (tri total) | `modules/dossiers/schemas/dossier-journal-entry.schema.ts` |

### ⚡⚡ Trois constats qui ont changé le périmètre

**1. La prémisse de l'AC-8 est FAUSSE — rien n'est « repris de `profils_societe_audit` ».**
L'AC demande que les entrées reprises de l'audit historique apparaissent à leur date d'origine.
Vérifié chez le producteur : l'événement `profil.societe.consolide`
(`modules/migration/events/profil-societe-events.ts`) ne porte **aucun historique** — seulement
l'état consolidé courant. STORY-356 n'importe donc **aucune** entrée d'audit, et il n'y a rien à
afficher. Ce qui survit de l'AC, et qui a été implémenté et testé : la lecture trie sur **`le`**,
l'horodatage de l'**acte**, jamais sur l'ordre d'insertion — le schéma est d'ailleurs
`timestamps: false`, il n'existe pas de `createdAt` sur lequel se tromper. Une entrée datée du passé
insérée aujourd'hui se range à sa vraie place (e2e + vérification docker). Si la reprise de
`profils_societe_audit` est voulue, elle exige un **changement de contrat d'événement chez
`balance-service`** — donc 2 dépôts, et sa propre story.

**2. `IDENTITE_MODIFIEE` n'avait aucun écrivain — et l'enrichissement de « Mon cabinet » ne laissait
aucune trace.** C'était la seule des 10 valeurs de `TypeEvenementDossier` qu'aucun chemin de code
n'écrivait. Le coupable n'était pas une route manquante : c'est
`DossiersService.enrichirCabinet`, qui **change l'identité fiscale** du dossier cabinet (raison
sociale, NIF, RCCM, forme juridique, les 2 axes) à chaque `profil.societe.consolide`, **hors
transaction et sans journal**. La dernière écriture de dossier du service sans trace. Elle écrit
désormais son entrée dans la **même transaction** que la mise à jour, datée de l'`occurredAt` du
profil — la date d'origine de l'acte, pas celle du script.

**3. L'append-only par hooks casse les DEUX marches arrière de migration.**
`RollbackDossiersService` et `MigrationAxesService.annuler` font un `journalModel.deleteMany` : avec
les hooks, ils lèvent. Ils descendent désormais au **pilote brut** (`.collection.deleteMany`), qui ne
passe par aucun middleware Mongoose. Ce n'est pas un contournement mais l'inverse : c'est ce qui rend
la seule exception admise **repérable d'un `grep .collection.`** — un `deleteMany` ordinaire se
lirait comme n'importe quelle autre écriture. Chemins **CLI uniquement**, inatteignables par une
route. Les deux specs ont été corrigées pour doubler `.collection`, **pas** le modèle : doubler
`journalModel.deleteMany` ferait passer un test que le vrai schéma fait lever.

### Écarts assumés au périmètre de la story

- **Le « hook inerte » de notification poussée est DOCUMENTÉ, pas codé** (en-tête d'
  `activite.controller.ts`). La story demandait un hook « inerte, documenté et testé comme tel ». Ce
  dépôt tient qu'« une méthode sans appelant est du code mort que ses propres tests font passer pour
  une capacité vérifiée » (`dossiers.repository.ts`), et STORY-173 a mergé un livrable **totalement
  inerte** que personne n'a vu ne pas tourner. Le point d'extension est donc **nommé** : quand
  `notification-service` existera, la notification se branchera **sur l'écriture** du journal — dans
  la transaction de l'acte, via l'outbox déjà présente, en publiant `dossier.journalise` — et non sur
  sa lecture. Écrire un *no-op* aujourd'hui donnerait une capacité que la couverture ferait passer
  pour testée.
- **Le compteur de non-lus exclut les actes de l'appelant** (le fil, lui, ne masque rien). D12 exige
  que l'administrateur soit informé des modifications *et de leur auteur* ; il n'a pas à être notifié
  de ce qu'il vient de faire, et un compteur qui s'incrémente sur sa propre écriture est un compteur
  qu'on apprend à ignorer.
- **`exigerTenant` / `porteeDeLAppelant` remontés dans `portee.util.ts`** : la même méthode privée
  était recopiée dans `DossiersController`, `ExercicesController` et `AxesController`. La 4ᵉ copie
  (journal + activité) aurait fait quatre endroits où corriger le même refus, dont le code
  (`ORGANISATION_REQUISE`) est publié dans Swagger.

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | **0 warning** (`eslint --max-warnings 0`) |
| Build | **OK** (`nest build`) |
| Unitaires | **919 verts** (71 suites) |
| e2e | **203 verts** (5 suites), dont **25** pour STORY-360 |
| Couverture | **99,04 / 92,75 / 96,33 / 99,05** — seuils 65/90/90/90 |

### Table de mutations — 18 mutations, 17 rouges et probantes

Chaque garde a été **volontairement cassée**, la suite relancée, puis le code restauré. Une mutation
non appliquée ou rouge **par erreur de compilation** est signalée comme non concluante (leçons
STORY-373 et STORY-179).

| Mutation | Verdict |
|---|---|
| Tri `{le:-1,_id:-1}` → `{le:-1}` (tri non total) | 🔴 e2e pagination des ex æquo |
| Index sans départage `_id` | 🔴 spec de schéma |
| `deleteMany` retiré de la liste des opérations gardées | 🔴 spec de schéma |
| Middleware de **requête** non enregistré (`query: false`) | 🔴 7 tests de schéma |
| `save()` sur document hydraté non gardé | 🔴 spec de schéma |
| Garde `estAdmin` retirée du **service** `/activite` | 🔴 2 tests de service |
| Portée retirée de la porte d'entrée du journal | 🔴 2 e2e (404 collaborateur, « Mon cabinet ») |
| Compteur : `$gt` → `$gte` | 🔴 spec de repository |
| Compteur : les actes de l'appelant recomptés | 🔴 e2e |
| Résolution du nom filtrée sur un statut | 🔴 2 tests (auteur parti anonymisé) |
| `IDENTITE_MODIFIEE` datée de `new Date()` | 🔴 spec de service |
| Entrée écrite même sans changement d'identité | 🔴 spec de service |
| Journal d'enrichissement dans une **autre** transaction | 🔴 spec de service |
| Marche arrière repassant par Mongoose | 🔴 spec de migration |
| Topic `user.registered` désabonné | 🔴 spec de contrat |
| Enveloppe : prénom vide accepté | 🔴 spec d'enveloppe |
| Libellé d'un acte vidé | 🔴 spec de libellés |
| `session` retirée de `enrichirCabinet` | ⚠️ **erreur de compilation** — non concluant *(et c'est le point : la signature exige la session, le compilateur est la garde)* |

⚡ **Une mutation a révélé un test réellement vacant, et il a été corrigé.** Retirer `_id` du tri
laissait les 25 e2e **verts** : `Array.prototype.sort` est **stable** en V8, donc le double de
`Model.find` rendait toujours le même ordre pour les ex æquo. Mongo n'offre **aucune** garantie
d'ordre entre documents de même clé de tri. Le double **permute désormais les ex æquo d'une lecture à
l'autre** ; seul un tri total y résiste, et la mutation vire au rouge.

### Vérification docker — stack NEUVE (`down -v`), round-trip Kafka réel, deux jetons RS256 distincts

Deux personnes réelles : `Awa Diallo` (`TENANT_ADMIN`) et `Koffi Mensah` (`TENANT_USER`, invité par
la vraie route `POST /users`), chacune avec son jeton RS256 issu d'`auth-service` — **pas** des
fixtures.

| Vérification | Résultat |
|---|---|
| Round-trip Kafka `identity.user.registered/updated` → `identity_users` | **2/2 utilisateurs** projetés avec `prenom`/`nom`, aucun statut stocké |
| Collections créées, nommage explicite | `identity_users`, `activite_lectures`, `dossiers_journal` |
| Index de `dossiers_journal` | `{dossierId:1, le:-1, _id:-1}` **et** `{orgId:1, le:-1, _id:-1}` |
| Index de `activite_lectures` | `{orgId:1, userId:1}` **unique** |
| Index de `identity_users` | `{userId:1}` **unique** |
| **D12 de bout en bout** | Koffi ouvre un exercice → Awa lit `EXERCICE_OUVERT \| Boulangerie du Golfe \| par Koffi Mensah` dans `/activite` |
| Auteur nommé, jamais un `userId` brut | `{userId, prenom:"Koffi", nom:"Mensah", systeme:false}` |
| Acte `SYSTEME` (création D1 de « Mon cabinet ») | `systeme: true`, **aucun nom inventé** |
| **Ex æquo RÉELS** (`DOSSIER_CREE` et `MANDAT_ATTESTE` à la même milliseconde) | paginés 1 par 1 : **4 entrées distinctes**, aucune perdue, aucune doublée |
| Compteur de non-lus | `total 5 / nonLus 2` — les 3 actes d'Awa exclus, ceux de Koffi et du système comptés |
| `POST /activite/lu` | `nonLus: 0`, curseur écrit en base, compteur toujours 0 à la relecture |
| Portée (D11) | collaborateur sur le journal de « Mon cabinet » → **404** ; administratrice → **200** |
| Anti-énumération | dossier inexistant → **404**, jamais 403 |
| Absence de route d'écriture | `POST`/`PATCH`/`PUT`/`DELETE .../journal` → **404** |
| **Append-only, contre la VRAIE base** *(schéma compilé chargé dans le conteneur)* | **8/8 opérations bloquées** (`updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, `findOneAndDelete`, `replaceOne`, `save()` hydraté) — 5 entrées avant, **5 après**, aucun `parUserId` usurpé |
| **Atomicité** — création refusée sur doublon de NIF (`E11000` **dans** la transaction) | `7 journal / 3 dossiers / 5 outbox` **avant et après** le 409 ; **0 entrée orpheline** |

⚠️ **Ce que la stack neuve ne peut pas prouver** (leçon STORY-357) : sur une base **existante**, les
index `{dossierId:1, le:-1}` et `{orgId:1, le:-1}` posés par STORY-301 **subsistent** — Mongoose ne
supprime jamais un index qu'il ne déclare plus. Ils sont **non uniques et redondants** : aucun effet
sur la correction, seulement de l'espace. Nettoyage en prod, à faire une fois :

```
db.dossiers_journal.dropIndex('dossierId_1_le_-1'); db.dossiers_journal.dropIndex('orgId_1_le_-1');
```
