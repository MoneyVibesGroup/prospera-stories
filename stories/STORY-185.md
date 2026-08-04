# STORY-185 : Le dossier **« à compléter »** — l'état qui rend la main au cabinet

**Epic :** EPIC-003 — Chaîne KYC
**Réf. :** **AP-03** *(revue KYC : la consolidation produit trois issues, le contrat n'en connaît que deux)* · **STORY-013** *(revue admin)* · **STORY-128** *(verdict par pièce)* · **STORY-176** *(le motif par pièce — ce que cet état transporte)* · **STORY-183** *(historique)* · `epics-notification-2026-08-04.md`
**Découverte par :** revue de la maquette AP-06 confrontée au contrat généré, 2026-08-04
**Priorité :** Must Have
**Story Points :** 5
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `kyc-service` (`:3002`) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-185`

---

## Le constat

La console consolide une revue en **trois** issues *(`features/kyc/types.ts`)* :

```ts
export type FileOutcome = "approved" | "incomplete" | "pending";
```

Le contrat amont n'en connaît que **quatre états, dont aucun ne dit « à compléter »** :

```ts
kycStatus: "PENDING_DOCUMENTS" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
```

Aujourd'hui, quand l'opérateur conclut « à compléter », voici **tout** ce qui se passe côté serveur :
les pièces reçoivent leurs marques *(STORY-128)* et… **c'est tout**. Le client `submitDecision`
n'appelle la décision globale **que** si l'issue est `approved` :

```ts
// frontend-admin-panel/src/features/kyc/api/kyc-client.ts
if (input.outcome === "approved") {
  await apiFetch(`/admin/orgs/${orgId}/kyc/approve`, { method: "POST" });
}
```

⇒ **Le dossier reste `UNDER_REVIEW`.** Il reste dans la file de l'opérateur, qui l'a pourtant
traité. Et **rien ne part vers le cabinet.**

## Pourquoi c'est plus grave qu'un état manquant

**Le cabinet ne sait pas que la balle est dans son camp.** Il a déposé ses pièces, l'écran client lui
dit « en cours d'examen » — et il attend. Personne ne l'attend en retour : personne ne lui a demandé
quoi que ce soit. Des deux côtés, chacun croit que l'autre travaille.

C'est **l'impasse la plus coûteuse de la chaîne d'onboarding** : elle ne produit ni erreur, ni
alerte, ni ticket. Elle produit du silence, et le client finit par appeler.

**Trois effets en cascade, tous mesurables :**

1. **La file de revue ment.** Un dossier « à compléter » y reste indéfiniment, indistinguable d'un
   dossier jamais ouvert. Le tri par ancienneté — qui **est** ce qui fait d'une liste une file —
   remonte donc en tête des dossiers sur lesquels il n'y a **rien à faire** tant que le cabinet n'a
   pas répondu.
2. **Le compteur « en attente » d'AP-02 et d'AP-07 est faux**, et personne ne peut le savoir.
3. **Rejeter à la place** — le seul geste disponible aujourd'hui — **punit un client qui a
   simplement oublié une pièce**. `REJECTED` est une décision négative sur le fond ; « il manque la
   page 2 » n'en est pas une.

> ⚡ **La distinction n'est pas cosmétique, elle est déjà écrite dans le code du front** :
> « Un dossier « incomplet » garde ses marques et RESTE dans la file : il attend des pièces, il
> n'est pas rejeté — les confondre punirait un client qui a simplement oublié un document. »
> Le front a eu raison sur le fond et n'a eu **aucun endroit où le dire**.

---

## Périmètre

### 1. Un cinquième état : `INCOMPLETE`

`kycStatus: PENDING_DOCUMENTS | UNDER_REVIEW | **INCOMPLETE** | APPROVED | REJECTED`

**Sémantique, à écrire dans l'OpenAPI :** *le dossier a été examiné, une ou plusieurs pièces
demandent une correction, **la main est au cabinet**.* Ce n'est ni un refus ni une attente
d'instruction : c'est une **demande de complément**.

⚠️ **`INCOMPLETE` n'est pas `PENDING_DOCUMENTS`.** La confusion est tentante — dans les deux cas il
manque quelque chose — et elle serait fausse : `PENDING_DOCUMENTS` = *personne n'a encore rien
regardé* ; `INCOMPLETE` = *quelqu'un a regardé, et voici ce qui cloche*. Les fusionner ferait
disparaître le travail de l'opérateur et remettrait le dossier au fond de la file.

### 2. La route qui le pose

`POST /api/v1/admin/kyc/:orgId/request-completion`

- **Aucun corps** : le motif n'est pas ici. Il est **déjà** sur les pièces refusées
  *(STORY-176 §incrément 1)* — c'est exactement ce que cet état transporte. Rédiger un second motif
  global créerait deux vérités sur la même demande.
- **409** si le dossier n'est pas `UNDER_REVIEW` *(même garde que `approve` / `reject`)*.
- **422** si **aucune pièce n'est en `REJECTED`** : demander un complément sans dire lequel est un
  message vide. ⚡ C'est le garde-fou qui **fait tenir** le couplage avec STORY-176 — sans lui, on
  peut poser l'état sans jamais avoir donné une raison.
- Permission **`kyc:reject`** — c'est un verdict défavorable, il relève du même droit. Ne **pas**
  créer une permission neuve : le catalogue est figé *(D15)* et une 13ᵉ permission pour un geste
  intermédiaire serait une granularité que personne n'a demandée.

### 3. La sortie de l'état — dans les deux sens

- **Le cabinet reverse une pièce** ⇒ le dossier repasse **automatiquement** en `UNDER_REVIEW` et
  revient dans la file. ⚡ **C'est la moitié qui compte** : un état où l'on entre sans savoir en
  sortir est un cul-de-sac déplacé, pas un cul-de-sac résolu.
- **L'opérateur se ravise** ⇒ `approve` et `reject` restent recevables depuis `INCOMPLETE`. Un
  dossier « à compléter » n'est pas gelé.

### 4. L'événement — le seul qui sorte du service

`kyc.status.changed` est **déjà** émis par les décisions existantes. Il porte le nouvel état :
`INCOMPLETE` n'ajoute **aucun** événement, il ajoute une **valeur**.

⚠️ **Contrat de compatibilité à respecter :** tout consommateur qui filtre `kyc.status.changed` sur
une liste fermée de statuts *(read-model de l'app cliente, dashboard)* verra passer une valeur
inconnue. Recenser les abonnés **avant** de livrer, et vérifier qu'un statut non reconnu est
**ignoré** et non fatal.

### Hors périmètre

- **L'envoi du message au cabinet.** Il appartient au `notification-service` en cours de cadrage
  *(`epics-notification-2026-08-04.md`, FR-N27 : les envois d'`auth-service`, `kyc-service` et
  `expert-comptable` y sont **migrés**)*. Cette story **produit le fait** — l'état et l'événement ;
  elle ne produit pas le courrier.
  ⚡ **Mais elle doit rendre le message écrivable** : l'événement doit porter de quoi le composer
  *(l'organisation, et les pièces refusées avec leur motif)* — sinon le service de notification
  devra rappeler `kyc-service` pour savoir quoi dire, et on aura déplacé le problème.
- **L'écran client** *(le cabinet voit ce qu'on lui demande et redépose)* — story frontend cabinet, à
  créer. Elle est **inutile sans celle-ci**, et **celle-ci reste utile sans elle** : la file de revue
  cesse déjà de mentir.
- La **cause** d'un rejet de pièce (`CONTENU` / `ILLISIBLE`) — tracée en STORY-176, non traitée.

---

## Critères d'acceptation

1. `kycStatus` accepte `INCOMPLETE` ; l'OpenAPI le décrit avec sa sémantique *(« la main est au
   cabinet »)*, distincte de `PENDING_DOCUMENTS`.
2. `POST /admin/kyc/:orgId/request-completion` fait passer un dossier `UNDER_REVIEW` en `INCOMPLETE`.
3. **409** hors `UNDER_REVIEW` ; **422** si aucune pièce n'est refusée ; **403** sans `kyc:reject`.
4. ⚡ Le dépôt d'une nouvelle version d'une pièce sur un dossier `INCOMPLETE` le **repasse en
   `UNDER_REVIEW`**, sans intervention d'un opérateur.
5. `approve` et `reject` restent recevables depuis `INCOMPLETE`.
6. `kyc.status.changed` est émis avec `INCOMPLETE`, et porte **de quoi rédiger la demande** :
   l'organisation, et la liste des pièces refusées **avec leur motif**.
7. ⚡ La file `GET /admin/kyc?status=UNDER_REVIEW` **ne contient plus** les dossiers `INCOMPLETE` —
   c'est l'effet observable qui justifie la story : la file cesse de mentir.
8. Les consommateurs de `kyc.status.changed` recensés, et **aucun ne casse** sur une valeur inconnue
   *(vérifié, pas supposé)*.

---

## Definition of Done

- [ ] Les 8 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker, le cycle complet** : dossier soumis → rejet d'une pièce **avec motif**
      *(STORY-176)* → `request-completion` → **le dossier quitte la file** → le cabinet reverse la
      pièce → **il y revient** → approbation
- [ ] Migration : aucun dossier existant n'est déplacé vers `INCOMPLETE` — l'état ne se rétro-attribue
      pas, personne n'a examiné ces dossiers-là
- [ ] ⚡ La console câble l'issue `incomplete` sur la nouvelle route ; `submitDecision` cesse de
      terminer en silence — c'est le signal que la dette est soldée
- [ ] Branche `MNV-185`, PR rebase-mergée sur `dev`

---

## Lié

- **STORY-176** — le motif par pièce. ⚠️ **185 sans 176 pose un état vide** : le cabinet apprend
  qu'il doit corriger, sans savoir quoi. Les deux se tirent dans le même sprint, **176 d'abord**.
- **STORY-183** — historique des décisions : une demande de complément est un événement d'historique
  à part entière, entre le dépôt et la resoumission.
- **STORY-184** — numéro de soumission : c'est très exactement ce cycle qui l'incrémente.
