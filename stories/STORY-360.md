# STORY-360 : Le journal du dossier devient lisible — et l'administrateur voit qui a modifié quoi

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — blocs **L** et **N** · décision **D12** · question **Q10** *(tranchée : option b)* · **STORY-294** *(le même défaut sur le journal des organisations)* · **STORY-144** *(l'écriture sans lecture)*
**Priorité :** Must Have
**Story Points :** 5
**Statut :** 📋 À faire
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
