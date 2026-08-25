# STORY-382 : Le journal nomme son AUTEUR, mais pas les personnes dont il parle

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-journal-affectation-userids-bruts.md` · **STORY-360** *(le journal devient lisible)* · **STORY-294** *(le même piège, côté organisations)* · décision **D12** · question **Q2**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** `review`
**Complexité :** low
**Créée le :** 2026-08-22 — **par FE-068**, qui a consommé le journal pour la première fois
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

STORY-360 a fait exactement ce que STORY-294 exigeait pour l'**auteur** d'une ligne : le `userId`
n'est jamais rendu seul, il est résolu **à la lecture**, par lot, sur le read-model `identity_users`.
Et comme ce read-model **ne réplique aucun statut**, un collaborateur parti reste nommé — c'est Q2,
et c'est délibéré.

**Ce traitement s'arrête à l'auteur. Il ne s'applique pas au CONTENU des entrées.**

`AFFECTATION_MODIFIEE` consigne son couple avant/après ainsi
(`dossiers.service.ts` → `affectationLisible`) :

```json
{
  "avant": { "responsableUserId": "68a1…0001", "contributeursUserIds": [] },
  "apres": { "responsableUserId": "68a1…0002", "contributeursUserIds": ["68a1…0003"] }
}
```

Trois identifiants bruts, qu'aucune résolution ne traverse. Le chemin de départ d'un collaborateur
(`MOTIF_DEPART_COLLABORATEUR`) ajoute même un `partantUserId`, dans la même forme.

## Pourquoi ça compte — et pourquoi le front ne peut pas le réparer seul

Le front les résout sur `GET /users`, l'annuaire du **cabinet**. Ça marche pour les membres actifs, et
**ça échoue précisément là où le journal a le plus de valeur** : un collaborateur **parti** n'y figure
plus. On lit alors :

> Responsable : ~~68a18000cafe0000beef0001~~ → Kofi Santos

C'est mot pour mot le défaut que STORY-294 a documenté et que STORY-360 a corrigé pour l'auteur : *un
identifiant que le client ne sait pas résoudre rend le journal illisible, donc inutile.* Et c'est
**exactement le cas Q2** — celui où l'historique doit survivre à la personne.

⚠️ **Le contournement en place est délibérément visible, pas silencieux** : FE-068 affiche
l'identifiant **et l'annonce comme non résolu** (patron `AuditActor` d'AP-24 — le maquiller en
« utilisateur inconnu » effacerait la seule preuve qui subsiste). C'est un pis-aller : la résolution
appartient au service, seul endroit où le read-model connaît les partants.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **lire les noms des personnes citées par une ligne d'affectation**, pas leurs identifiants,
afin de **comprendre qui a repris quel dossier, même quand la personne a quitté le cabinet**.

---

## Ce que la story livre

Étendre la résolution **déjà présente** dans `JournalService.habiller` aux identifiants portés par
`details` :

| Acte | Clés concernées |
|---|---|
| `AFFECTATION_MODIFIEE` | `avant.responsableUserId`, `apres.responsableUserId`, `avant.contributeursUserIds[]`, `apres.contributeursUserIds[]`, `partantUserId` |

⚡ **Le même lot de résolution suffit** : `habiller()` collecte déjà les `parUserId` de la page en une
requête. Y ajouter les identifiants de `details` ne coûte **aucun aller-retour supplémentaire** —
c'est la même `resoudre()`, sur une liste plus longue.

⚠️ **Sans réécrire les entrées.** Le journal est *append-only*, et ce n'est pas une contrainte subie :
ce qui a été écrit **est** la preuve. La résolution se fait **à la lecture**, comme le libellé de
l'acte et comme l'auteur, en **ajoutant** un champ à côté de l'identifiant plutôt qu'en le
remplaçant :

```jsonc
"apres": {
  "responsableUserId": "68a1…0002",
  // ajouté à la lecture, jamais stocké
  "responsable": { "userId": "68a1…0002", "prenom": "Kofi", "nom": "Santos", "systeme": false }
}
```

## Hors périmètre

- ⛔ Les autres actes : aucun ne porte d'identifiant d'utilisateur dans `details` *(vérifié sur les
  dix — `EXERCICE_*` portent `exerciceId`, `AXES_DECIDES` un `decisionId`)*.
- ⛔ Toute réécriture rétroactive des entrées existantes.

---

## Acceptance Criteria

- [x] `GET /dossiers/:id/journal` et `GET /activite` rendent, pour chaque `AFFECTATION_MODIFIEE`,
      **l'identité des personnes citées en plus de leur identifiant**.
- [x] Un collaborateur **désactivé / parti** y est **nommé** — c'est l'AC central *(Q2)*, et le seul
      qui ne peut pas être satisfait côté client.
- [x] Un identifiant que le read-model ne connaît pas rend la ligne **quand même**, avec son
      identifiant seul : un journal qui perd des entrées parce qu'une jointure échoue ne prouve plus
      rien.
- [x] **Aucune entrée n'est réécrite** — un test de mutation tente une écriture sur la collection et
      échoue si elle passe *(la garde de STORY-360 existe, elle doit continuer de tenir)*.
- [x] **Le nombre de requêtes par page ne change pas** : un test le fige. *(C'est la garde qui empêche
      la résolution ligne à ligne — 25 allers-retours par page.)*

---

## Dépendances

**Prérequise :** **STORY-360** *(la résolution par lot et le read-model `identity_users` existent)*.
**Consommateur :** **FE-068** — le repli client (`CHAMPS_UTILISATEUR`, `estIdentifiantBrut` dans
`journal-presentation.ts`) se retire quand cette story est livrée. ⚠️ **Pas avant** : c'est lui qui
empêche l'écran d'afficher un identifiant nu sans le dire.

## Definition of Done

- [x] Lint 0 · build OK · couverture ≥ seuils.
- [x] e2e : affectation dont l'ancien responsable a quitté le cabinet → **nommé**.
- [x] Vérification docker : un vrai départ de collaborateur (`identity.membership.changed`,
      `SUSPENDED`) suivi d'une lecture du journal.
- [x] `/code-review` + `/security-review` *(le journal est une preuve opposable)*.

## Story Points Breakdown

- Collecte des identifiants de `details` dans le lot existant : 0,5 pt
- Enrichissement du DTO à la lecture, sans réécriture : 1 pt
- Tests (auteur parti, non résolu, nombre de requêtes figé) : 0,5 pt
- **Total : 2 points**

---

## Progress Tracking

**Statut :** `review` — implementee, portes DoD vertes, persistance et non-regression prouvees en docker.
**Branche :** `MNV-382` (`dossier-service`) - **developpee le** 2026-08-25.

### Ce qui a ete livre

`JournalService.habiller()` verse desormais les identifiants **cites** par `details` dans le **meme lot**
que `parUserId`, et `detailsHabilles()` ajoute la personne resolue **a cote** de chaque identifiant.

| Fichier | Ce qui change |
|---|---|
| `src/modules/journal/journal.service.ts` | `identifiantsCites()` (collecte), `detailsHabilles()` (habillage), `auteur()` devient `personne()` et sert tel quel aux personnes citees |
| `src/modules/journal/dto/journal-response.dto.ts` | `details` documente les cles ajoutees (`responsable`, `contributeurs[]`, `partant`) et leur format |
| `journal.service.spec.ts` + `test/journal.e2e-spec.ts` | 9 unitaires + 1 e2e |

**Trois decisions, et leur raison :**

1. **Le tri se fait sur les CLES, pas sur le type d'acte.** Aucun autre acte ne porte d'identifiant
   d'utilisateur dans `details` (verifie sur les dix), donc les deux criteres selectionnent exactement les
   memes entrees - mais celui-ci ne peut pas se desynchroniser d'une enumeration qui grandit. Un test
   garde le hors-perimetre : `EXERCICE_OUVERT` ressort **intact**.
2. **Le nom est AJOUTE, jamais substitue.** `responsableUserId` reste ; `responsable` apparait.
   L'identifiant ecrit est la preuve opposable - le nom n'est qu'une aide a la lecture, et il vient d'un
   read-model qui, lui, peut changer.
3. **Lecture defensive de la charge utile.** `details` n'a jamais ete valide par un DTO et le journal est
   *append-only* : `avant: null` (le cas reel - `typeof null === 'object'`) ou un contributeur non textuel
   doivent etre **rendus**, pas faire tomber la page en 500.

### Portes DoD

| Porte | Resultat |
|---|---|
| Lint | **0 warning** (`eslint --max-warnings 0`) |
| Build | **OK** (`nest build`) |
| Unitaires | **1005 verts** / 77 suites |
| e2e | **215 verts** / 6 suites |
| Couverture globale | **99,26 % st - 93,46 % br - 96,52 % fn - 99,28 % li** (seuils 65/90/90/90) |
| `journal.service.ts` | **100 / 100 / 100 / 100** |

### Mutation-testing - 7 mutations, 7 rouges, restaurees

| Mutation | Test qui rougit |
|---|---|
| Identifiants de `details` retires du lot | **4 tests** : les 3 de nommage + celui qui fige le lot |
| `delete copie.responsableUserId` (le nom REMPLACE l'identifiant) | « SANS remplacer les identifiants » |
| Garde `null` relachee (`!== undefined`) | « n'invente aucune personne pour un responsable ABSENT » |
| `partantUserId` ignore | « nomme le PARTANT d'une reprise apres depart » |
| Contributeurs ignores | 2 tests |
| `estObjet` accepte `null` | « rend une charge utile MALFORMEE sans tomber » |
| `chaines()` ne filtre plus | idem |

**La premiere mutation a revele un test TAUTOLOGIQUE, et c'est le vrai enseignement de la story.**
Le double de `resoudre` etait un `mockResolvedValue(ANNUAIRE)` : il rendait **tout** l'annuaire quel que
soit son argument. Retirer les identifiants de `details` du lot laissait donc les trois assertions de
nommage **VERTES** - seul le test qui inspecte l'argument rougissait. Un double de read-model doit
**honorer le lot qu'on lui passe** ; sinon il ne teste pas la collecte, il la contourne. Corrige en
`mockImplementation` filtrant sur les identifiants demandes : la mutation fait alors tomber 4 tests.

### Verification docker - stack neuve, depart REEL de collaborateur

`docker compose down -v` puis `up --build mongo kafka redis auth-service dossier-service`.
`/health` : `{"mongodb":"up","kafka":"up"}`, consumer `dossier-identity` abonne a
`identity.membership.changed`.

Parcours de bout en bout, sans raccourci sur le chemin teste : inscription du cabinet, invitation de
`Ama Kouassi` (`TENANT_USER`), dossier cree, `PATCH /dossiers/:id/affectation` la nomme responsable,
`PATCH /users/:id {status:"SUSPENDED"}` cote IdP, `identity.membership.changed` consomme, retombee
`AFFECTATION_MODIFIEE` ecrite par `SYSTEME`. *(Seul le read-model de gate `orgkycstatuses` a ete seme
`APPROVED` : `kyc-service` n'etait pas dans le perimetre du parcours.)*

**Ce qui est ecrit** (`dossiers_journal`, brut - la preuve) :

```json
{ "type": "AFFECTATION_MODIFIEE", "parUserId": "SYSTEME",
  "details": { "motif": "Depart du collaborateur ...", "partantUserId": "...b629",
               "avant": { "responsableUserId": "...b629", "contributeursUserIds": [] },
               "apres": { "responsableUserId": "...b609", "contributeursUserIds": [] } } }
```

**Ce que la lecture rend** - `avant.responsable`, `apres.responsable` et `partant` ajoutes, identifiants
conserves :

```json
"partant": { "userId": "...b629", "prenom": "Ama", "nom": "Kouassi", "systeme": false },
"avant":   { "responsableUserId": "...b629",
             "responsable": { "userId": "...b629", "prenom": "Ama", "nom": "Kouassi", "systeme": false } }
```

| Ce qui est prouve | Preuve |
|---|---|
| **AC central (Q2)** - un collaborateur PARTI est nomme | `memberships` cote IdP : `{"role":"TENANT_USER","status":"SUSPENDED"}`, et la ligne rend quand meme « Ama Kouassi ». `Object.keys(identity_users)` = `_id, userId, __v, createdAt, lastEventAt, nom, prenom` - **aucun statut replique**, la faute est impossible a commettre |
| **Aucune requete ajoutee** | Profilage Mongo (`setProfilingLevel(2)`) sur une page de 4 entrees citant 3 personnes : **UNE seule** requete `identity_users`, `{"userId":{"$in":["...b629","...b609"]}}` - auteur **et** personnes citees, dedoublonnes, `SYSTEME` exclu |
| **Aucune entree reecrite** | 5 entrees avant la lecture, 5 apres ; **0 operation d'ecriture** profilee sur `dossiers_journal`. La garde *append-only* de STORY-360 (hooks `pre`) tient, et rien ne la sollicite |
| **Jointure qui echoue => ligne rendue** | Suppression du partant d'`identity_users` : `total = 4`, 4 entrees rendues, `partant: {"userId":"...b629","systeme":false}` - identifiant seul, aucune ligne perdue |

Stack arretee (`docker compose stop`) apres consignation.

### Suite

**FE-068 peut retirer son repli client** (`CHAMPS_UTILISATEUR`, `estIdentifiantBrut` dans
`journal-presentation.ts`) : le service resout desormais ce que l'annuaire `GET /users` ne peut pas.
