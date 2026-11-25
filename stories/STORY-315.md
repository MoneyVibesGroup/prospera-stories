# STORY-315 : Le calendrier fiscal du portefeuille, en une page, avec filtres et tri

Status: done — **livrée le 2026-11-25** : prospera-fiscal-service **#61** (`7d97ae0` sur `dev`) ; voir « Livraison ».
Écrite le 2026-11-25 par la session du groupe C juste avant de la coder (lot 6) ; contrat #867 avant le code.

**Epic :** EPIC-030 · **Points :** 5 · **FR :** FR-F16, FR-F17 · **NFR :** NFR-F13
**Service :** `prospera-fiscal-service`. **Après :** STORY-305 (les obligations dérivées), STORY-319 (le responsable,
quand il sera désigné), STORY-539 (le calendrier de dépôt, autre vue). **Suite :** STORY-316, 317, 318.

## Histoire

En tant qu'**expert-comptable**, je veux voir en une page toutes les obligations de mon portefeuille, afin de savoir ce
qui risque d'être en retard.

## Critères d'acceptation

1. **Étant donné** un portefeuille de dossiers **quand** j'ouvre le calendrier **alors** chaque ligne porte dossier,
   pays, obligation, période, échéance, responsable et statut.
2. **Étant donné** un calendrier **quand** je filtre par pays, collaborateur, type d'obligation, période ou statut
   **alors** le résultat est cohérent et combinable.
3. **Étant donné** un portefeuille de 500 dossiers portant jusqu'à 12 obligations annuelles **quand** le calendrier est
   demandé **alors** le premier rendu tient sous 2 secondes **et** un filtre s'applique sous 500 ms (NFR-F13).
4. **Étant donné** un collaborateur **quand** il ouvre le calendrier **alors** il ne voit que les dossiers dont il est
   responsable ou contributeur ; l'administrateur du cabinet voit tout le cabinet ; un autre cabinet ne voit jamais rien.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls.**

### La réplique des dossiers porte ce que le calendrier affiche et ce que la portée lit

- `dossiers_fiscal` (read-model de `dossier.created` / `dossier.updated`, STORY-539) projette en plus, champs déjà
  publiés par `dossier-service` : **`raisonSociale`**, **`estLeCabinet`**, **`responsableUserId`**,
  **`contributeursUserIds`**. Un dossier projeté avant cette story ne les porte pas : il reste hors de la portée d'un
  collaborateur jusqu'à son prochain `dossier.updated` (fail-closed), comme dans balance-service (STORY-694).

### La portée

- La règle de `dossier-service`, recopiée comme dans balance-service (`filtrePortee`) : **`TENANT_ADMIN`** voit tout son
  cabinet, « Mon cabinet » compris ; **tout autre porteur** voit les seuls dossiers dont il est responsable ou
  contributeur, jamais « Mon cabinet ». Un filtre de requête, jamais une garde après lecture. Seuls les dossiers
  `ACTIF`.

### La route

- **`GET /api/v1/obligations/calendrier`** (mêmes rôles et accès fiscal que `GET /exercices/{id}/obligations`).
  Filtres combinables, tous facultatifs :
  - `annee` (l'année de l'obligation ; par défaut l'année en cours) ;
  - `pays` (répétable, code ISO) ;
  - `responsable` (`userId`, ou `AUCUN` pour les obligations sans responsable) ;
  - `taxe` (répétable, code du catalogue) ;
  - `periode` (préfixe : `2026`, `2026-03`, `2026-T1`, `2026-E2`) ;
  - `statut` (répétable, états du cycle de 323) ;
  - `dossierId` ;
  - `tri` : `ECHEANCE` (défaut, la plus proche d'abord, sans échéance en dernier), `DOSSIER`, `STATUT` ;
  - `limite` (1 à 500, défaut 200) et `apres` (curseur opaque rendu par la page précédente).
- → `200 { lignes: [{ obligationId, dossierId, raisonSociale, pays, taxe, libelle, periode, echeance, responsable,
  statut, redevableId }], suivant: string | null }`. Les obligations écartées (`active: false`) n'y sont pas.
- **Le pays** d'une ligne : celui de son implantation (STORY-362) ; l'implantation principale prend le pays du dossier.
- Un filtre inconnu ou mal formé : `400`.

### La performance

- Index neuf sur les obligations, à l'appui du tri et des filtres : `{ orgId, annee, echeance, _id }`.
- Une preuve sur un vrai MongoDB (suite `test:conformite`) : 500 dossiers × 12 obligations ; la première page tient
  sous 2 s et une page filtrée sous 500 ms, mesurées et écrites dans la livraison.

### Livraison (2026-11-25)

- **Code** (#61) : `domain/obligations/calendrier-portefeuille.ts`, `application/obligations/calendrier-portefeuille.service.ts`,
  `modules/read-models/guards/portee-collaborateur.util.ts` (la règle de balance-service), `adapters/mongo/mongo-source-dossiers-calendrier.ts`,
  deux méthodes du registre (`calendrierParEcheance`, `calendrierComplet`), la réplique `dossiers_fiscal` étendue, l'index
  `calendrier_du_portefeuille`. Codé par une sous-session ; revue, preuves et gate par C.
- **Preuves** (Node 24) : unitaires **2618** (3 suites lentes rejouées seules, 134/134), e2e **11/11, 230** (dont 7 neufs) ;
  **`test:conformite` 16/16 suites, 102/102** sur le vrai `mongo-fiscal`. **NFR-F13 mesurée** (500 dossiers × 12 obligations) :
  première page de 200 lignes en **60 ms**, page filtrée (pays + taxe + période) en **24 ms**, tri par dossier en **157 ms** ;
  `explain` lit l'index ; le curseur parcourt les 6 000 lignes sans trou ni doublon ; portée sur de vrais ObjectId (admin,
  collaborateur affecté, sans affectation, « Mon cabinet », archivé, autre cabinet) ; mutation **9/9** ; gate `grp-c` :
  `fiscal-service` `healthy`, la route en `401` sans jeton, **un vrai `dossier.updated` publié sur Kafka** remplit la réplique
  (raison sociale, « Mon cabinet », responsable, contributeurs).
- Un attendu du test de portée filtrée par pays était faux (14 au lieu de 13 : deux dossiers du collaborateur sont au Bénin) ;
  corrigé dans le test (`b106cb2`), le code n'avait pas tort.

### Écarts au contrat, décidés au code

- **D-315-5** : l'administrateur est `TENANT_ADMIN` sans `PLATFORM_ADMIN` (lecture stricte, comme balance-service) : un jeton
  qui porte les deux tombe dans la branche restreinte.
- **D-315-6** : les tris `DOSSIER` et `STATUT` se font en mémoire (au plus 20 000 lignes lues) ; l'index sert `ECHEANCE`.
- **D-315-7** : `lireDossier` projette maintenant `raisonSociale` et `estLeCabinet` (devise et version ne passent toujours pas).
- **D-315-8** : un dossier projeté avant cette story a `raisonSociale: ''` (jamais un nom deviné) ; un jeton sans organisation
  voit une liste vide ; `redevableId` vaut `entreprise` pour l'entreprise.
- **D-315-9** : au plus 5 000 dossiers lus par page.
- **D-315-10** : la page par échéance se lit en deux temps (les échéances datées, puis les sans-date par `_id`), parce que
  MongoDB range `null` avant toute chaîne. `pays` : deux lettres ; `taxe` libre (un code inconnu ne rend rien).

### Décisions prises au contrat (contestables)

- **D-315-1** : la portée se lit dans la réplique locale des dossiers, jamais par un appel à `dossier-service` par
  dossier (500 appels ne tiennent pas en 2 s).
- **D-315-2** : `responsable` est le champ de l'obligation (STORY-319 le désignera) ; tant qu'il n'est pas désigné, le
  filtre `AUCUN` le montre.
- **D-315-3** : pagination par curseur sur le tri retenu, `_id` en dernier critère : la page suivante ne saute ni ne
  répète une ligne quand le tri a des égalités.
- **D-315-4** : le calendrier des **obligations** (cette story) et celui des **dépôts** (STORY-539, `GET /echeances`)
  restent deux vues ; aucun des deux ne change l'autre.
