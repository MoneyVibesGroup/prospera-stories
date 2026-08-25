# STORY-404 : Un dossier peut être affecté à quelqu'un qui n'a jamais appartenu au cabinet

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** **STORY-353** *(l'affectation, qui a posé le défaut)* · **STORY-382** *(qui l'a rendu exploitable, puis en a fermé la retombée)* · décision **D6** · question **Q2**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** `ready-for-dev`
**Complexité :** medium
**Créée le :** 2026-08-25 — **par la revue de sécurité de STORY-382**
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

`PATCH /dossiers/:id/affectation` **ne vérifie à aucun moment** que le
`responsableUserId` et les `contributeursUserIds` fournis appartiennent au cabinet de l'appelant. Le DTO
ne pose qu'un `@IsMongoId()` ; `OrgMembersService` n'est utilisé nulle part sur ce chemin.
`modifierAffectation` convertit l'identifiant reçu en `ObjectId` et l'écrit tel quel dans le dossier
**et** dans le journal.

**Mesuré en vérification docker de STORY-382, sur stack neuve** : l'administratrice d'un cabinet A a
affecté comme contributeur l'identifiant du gérant d'un cabinet B. Réponse : **`200`**.

## Pourquoi ça compte

Deux dommages, de natures différentes :

1. **Cohérence des données.** Un dossier peut porter un responsable qui n'a jamais appartenu au cabinet.
   L'incohérence est **silencieuse** : `filtrePortee` filtre aussi sur `orgId`, donc l'utilisateur
   étranger n'obtient **aucun accès** — le dossier a simplement un responsable qui ne le verra jamais,
   et le portefeuille affiche un identifiant qui ne se résoudra jamais.
2. **Surface d'injection.** C'est ce chemin qui a permis à STORY-382 de devenir, un instant, un oracle
   d'identité inter-cabinet : le journal résolvait en nom des identifiants que l'appelant avait
   lui-même déposés. ⚠️ **La divulgation, elle, est déjà fermée** — STORY-382 filtre la résolution sur
   `org_members`. Ce qui reste ouvert, c'est **l'écriture**, et donc toute retombée future qui ferait
   confiance à ces identifiants.

## User Story

En tant qu'**administratrice de cabinet**,
je veux **que le serveur refuse une affectation vers quelqu'un qui n'est pas de mon cabinet**,
afin de **ne pas confier un dossier à une personne qui ne le verra jamais** — et de ne pas laisser
d'identifiant étranger entrer dans mes données.

---

## Ce que la story livre

`modifierAffectation` valide `responsableUserId` **et chaque** `contributeursUserIds` contre le
read-model local `org_members` (`{ orgId, userId }`), **avant** d'écrire.

| Point | Décision attendue |
|---|---|
| Read-model consulté | `org_members` — **local**, alimenté par `identity.membership.changed`. ⛔ Jamais d'appel synchrone à l'IdP (invariant P3) |
| Statut exigé | à trancher : `ACTIVE` seul, ou toute appartenance connue. ⚠️ Exiger `ACTIVE` **empêche de réaffecter à un suspendu**, ce qui est probablement voulu ici — c'est l'inverse de STORY-382, où le filtre porte sur une **lecture d'historique** et ne doit surtout pas exclure les partants |
| Code de refus | nouveau code stable, nommé dans Swagger, du type `MEMBRE_HORS_CABINET` (400) |
| Anti-énumération | ⚠️ Le refus ne doit **pas** distinguer « cet identifiant n'existe pas » de « il existe mais hors de votre cabinet » : **un seul message**, sinon la validation redevient l'oracle que STORY-382 vient de fermer |

⚠️ **Le compromis à assumer, et à documenter** : `org_members` est une projection **éventuellement en
retard**. Un membre fraîchement invité peut être refusé quelques instants. C'est le prix du
*fail-closed*, et il est préférable à l'incohérence actuelle — mais il doit être **écrit** dans la
réponse d'erreur, pas découvert en production.

## Hors périmètre

- ⛔ La résolution en nom à la lecture du journal : **faite**, STORY-382.
- ⛔ Toute réparation rétroactive des dossiers déjà affectés à un identifiant étranger *(migration de
  données = souci de prod, différé)*. Poser en revanche un **compteur ou un log** au refus, pour savoir
  si le cas existe en base.
- ⛔ La retombée automatique après départ (`reaffecterDossiersDuMembre`) : son repreneur vient déjà de
  `trouverAdministrateur`, donc de `org_members` — il est valide par construction.

---

## Acceptance Criteria

- [ ] Affecter un `responsableUserId` **hors du cabinet** rend **400** avec un code stable, et **rien
      n'est écrit** — ni le dossier, ni la ligne de journal.
- [ ] Idem pour **un seul** contributeur étranger dans une liste par ailleurs valide : la liste entière
      est refusée, il n'y a pas d'affectation partielle.
- [ ] **Le refus ne distingue pas** « identifiant inconnu de la plateforme » de « membre d'un autre
      cabinet » — même code, même message. *(Un test le fige : les deux réponses sont identiques
      octet pour octet.)*
- [ ] Affecter un membre **de son propre cabinet** continue de fonctionner, journal compris — les e2e
      de STORY-353 restent verts.
- [ ] Le nombre de requêtes par affectation reste **borné** : **une** lecture `org_members` pour tout
      le lot, jamais une par identifiant.

## Dépendances

**Prérequise :** aucune — `org_members` et `OrgMembersService.membresDe()` existent (STORY-353,
STORY-382).
**Ne bloque pas** STORY-382, qui est close : la divulgation est déjà fermée côté lecture.

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : affectation vers un identifiant d'un autre cabinet → 400, dossier et journal inchangés.
- [ ] **Mutation** : retirer la validation fait rougir le test de refus ; distinguer les deux messages
      fait rougir le test d'anti-énumération.
- [ ] Vérification docker : rejouer **exactement** le scénario de STORY-382 (second cabinet réel,
      identifiant étranger déposé) et constater **400** là où il rendait **200**.
- [ ] `/code-review` + `/security-review`.

## Story Points Breakdown

- Validation par lot contre `org_members` + code de refus : 1,5 pt
- Anti-énumération (message unique) et son test : 0,5 pt
- Tests (unit, e2e, mutation) + vérif docker : 1 pt
- **Total : 3 points**
