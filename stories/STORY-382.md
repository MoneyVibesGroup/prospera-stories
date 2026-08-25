# STORY-382 : Le journal nomme son AUTEUR, mais pas les personnes dont il parle

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-journal-affectation-userids-bruts.md` · **STORY-360** *(le journal devient lisible)* · **STORY-294** *(le même piège, côté organisations)* · décision **D12** · question **Q2**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** `done`
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

**Statut :** `done` — clôturée le 2026-08-25, PR `dossier-service#14` rebase-mergée sur `dev`.
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

---

## Revue de code — 3 constats, 3 corriges (commit `MNV-382(revue)`)

### 1. ⚡ Le contrat annoncait un code de motif QUI N EXISTE PAS

Le Swagger que la story avait ecrit disait que `partant` apparait « sur une reprise apres depart
(`motif = DEPART_COLLABORATEUR`) ». **Cette valeur n existe nulle part.** Le seul producteur
(`dossiers.service.ts`, retombee de depart) ecrit `MOTIF_DEPART_COLLABORATEUR`, qui vaut la phrase :

> « Depart du collaborateur — retombee automatique a l administrateur du cabinet (Q2). »

Le dump de la verification docker le montrait deja, ligne par ligne — je ne l avais pas relu contre ce
que j avais publie.

**Scenario reel** : FE-068, le consommateur nomme par la story, ecrit
`if (details.motif === 'DEPART_COLLABORATEUR')`. La condition est **fausse a jamais** : la reprise
automatique s affiche comme une reaffectation manuelle ordinaire, et le bloc « qui a repris le dossier
de qui » — **le cas exact que la story sert** — n est jamais mis en avant.

**Aggravant** : les deux fixtures de test reprenaient le meme litteral inexistant, donc aucun test ne
pouvait rougir dessus. `expect(details.motif).toBe('DEPART_COLLABORATEUR')` n assertait que le
passe-plat de sa propre fixture.

**Corrige** : le contrat dit que `motif` est du **texte libre** et que le discriminant est la
**PRESENCE de `partant`** ; les fixtures importent `MOTIF_DEPART_COLLABORATEUR`.

### 2. `contributeurs` dependait d un champ VOISIN

La sortie anticipee « rien a habiller » rendait `contributeurs` present ou absent selon qu une **autre
face** de la meme entree citait quelqu un. Une cle dont la presence depend d un champ voisin n est
descriptible dans aucun contrat, et un client qui ecrit `avant.contributeurs.length` tombe sur un
`TypeError`. Le cas n est pas atteignable aujourd hui (`responsableUserId` est toujours ecrit) — il l
est desormais **par construction**. Sortie anticipee supprimee, un test fige l uniformite.

### 3. Deux traversees des memes cles, sans rien qui les y contraigne

`identifiantsCites()` construit le lot, `detailsHabilles()` produit les personnes : deux enumerations
distinctes. Une story future qui journaliserait un `validateurUserId` et ne l ajouterait qu a
l habillage rendrait une personne **jamais resolue** — un identifiant nu a l ecran, sans erreur, sans
log, sans test rouge. Plutot qu une indirection en production, un invariant **derive de la SORTIE** :
toute personne rendue, ou qu elle soit dans la charge utile, doit etre dans le lot. Il attrape n
importe quelle cle future, dans les deux sens.

---

## Revue de securite — 1 constat, moyenne, confiance 90 (commit `MNV-382(securite)`)

**CWE-359 (exposition de donnees personnelles) + CWE-639 (autorisation contournee par cle controlee
par l utilisateur) — OWASP A01, Broken Access Control.**

### ⚠️⚠️ La PR transformait une faiblesse sans impact en FUITE D IDENTITE INTER-CABINET

`identity_users` est keye par utilisateur, **sans `orgId`** : alimente par
`identity.user.registered` pour **toute inscription de la plateforme**, il porte les noms de **tous les
cabinets**. Tant que seul `parUserId` y etait resolu, l isolation tenait **en amont** — cette valeur
est posee par le serveur depuis le jeton, donc l auteur a necessairement agi dans ce cabinet. Le
commentaire d `IdentityUsersService.resoudre()` le disait explicitement.

**La PR invalidait cette premisse.** `PATCH /dossiers/:id/affectation` **n exige pas** que le
`responsableUserId` ni les `contributeursUserIds` soient membres du cabinet (le DTO ne pose qu un
`@IsMongoId()`). **La portee garde le CONTENANT, pas les identifiants que l appelant y a lui-meme
deposes.**

**Exploitation**, en `TENANT_ADMIN` d un cabinet legitime (e-mail verifie, KYC approuve) :

1. creer un dossier client ordinaire ;
2. `PATCH .../affectation` avec 50 identifiants etrangers dans `contributeursUserIds` — **accepte** ;
3. `GET /dossiers/:id/journal` — le dossier est dans sa portee, l entree lui est rendue ;
4. il lit 50 prenoms/noms d utilisateurs d autres cabinets, et repete a volonte.

Deux dommages : **divulgation de donnees personnelles inter-tenant**, et surtout **oracle d existence
de compte a l echelle de la plateforme** (nom rendu ⇒ le compte existe) — exactement l anti-enumeration
que `securite.md` classe CRITICAL, elargie de son tenant a toute la base d utilisateurs.

### Le correctif

`OrgMembersService.membresDe(orgId, lot)` filtre les identifiants **CITES** sur `org_members`,
read-model local deja alimente par `identity.membership.changed`.

| Decision | Pourquoi |
|---|---|
| **Aucun filtre de statut** | ⚡ C est l AC CENTRAL (Q2). `org_members` n efface jamais une ligne : un depart arrive en `SUSPENDED` et l `updateOne` conserve l appartenance. Ajouter `statut: 'ACTIVE'` « par prudence » aurait anonymise precisement les lignes qui parlent d un collaborateur parti — tout l objet de la story |
| **L AUTEUR n y passe PAS** | Son identifiant vient du jeton. Le soumettre a un read-model qui peut etre en retard l anonymiserait sans rien proteger, et casserait STORY-360 |
| **Les 3 lectures restent PARALLELES** | Filtrer le lot avant `resoudre()` aurait serialise deux allers-retours. Le nom d un non-membre est eventuellement lu, il ne quitte jamais le processus |
| **Fail-closed** | Un identifiant absent de `org_members` — meme par simple retard de projection — retombe sur le patron « personne non resolue » deja teste : identifiant nu, ligne rendue |

⚠️ **La RACINE n est pas corrigee ici** : `modifierAffectation` accepte toujours n importe quel
`MongoId`. Hors perimetre de cette story ⇒ **STORY-404 ouverte**.

---

## Mutation-testing — 13 mutations au total, 13 rouges

Les 4 dernieres (correctif de securite) ont ete verifiees avec `npm run build` a **0 erreur TS** : une
mutation rouge par erreur de compilation ne prouve rien *(lecon STORY-179)*.

| Mutation | Ce qui rougit |
|---|---|
| ⑧ Une cle habillee mais retiree du lot | 3 tests, dont l invariant de synchronisation |
| ⑨ La sortie anticipee revient | « rend `contributeurs` meme quand l entree ne cite PERSONNE » |
| ⑩ Tout identifiant demande repute membre *(la fuite revient)* | les 2 tests d isolation, unitaire **et** e2e |
| ⑪ L auteur soumis au filtre d appartenance | 2 tests |
| ⑫ `statut: 'ACTIVE'` ajoute au filtre | « nomme l ancien responsable meme s il a QUITTE le cabinet » |
| ⑬ `orgId` neutralise dans le filtre | 2 tests |

⚠️ **Piege rencontre deux fois** : `npm test -- <chemin>` a rendu `Tests: 0 total` et
`40 passed` alors qu une **suite entiere echouait a compiler**. Le compte de tests verts ne dit rien
d une suite qui n a pas tourne — lire `Test Suites:` et `failed to run`.

## Portes, sur l etat FINAL (apres les deux commits de correction)

| Porte | Resultat |
|---|---|
| Lint | **0 warning** |
| Build | **OK** |
| Unitaires | **1012 verts** / 77 suites |
| e2e | **216 verts** / 6 suites |
| Couverture globale | **99,26 st - 93,48 br - 96,56 fn - 99,28 li** (seuils 65/90/90/90) |
| `journal.service.ts` / `org-members.service.ts` | **100 / 100 / 100 / 100** |

⚠️ **Constat honnete** : une execution e2e a echoue **une fois** (1 test sur 216) en cours de session,
**non reproduite sur 10 executions completes** consecutives ensuite ; le nom du test n a pas ete
capture. Signale plutot que passe sous silence.

## Verification docker REJOUEE sur l etat final — second cabinet reel

Stack redemarree, container `dossier-service` **redemarre explicitement** (le hot-reload peut mentir),
`Found 0 errors` confirme.

Un **second cabinet** a ete inscrit pour de vrai. L identifiant de son gerant, **connu d
`identity_users`** (`{prenom: "Yao", nom: "Adjo"}`) mais absent d `org_members` du cabinet A, a ete
depose par l administratrice du cabinet A dans `contributeursUserIds` :

- le `PATCH` rend **`200`** — *l injection existe bel et bien, c est STORY-404* ;
- le journal rend `{"userId": "…61c2", "systeme": false}` — **aucun nom**, la fuite est fermee ;
- la ligne de retombee rend `{"userId": "…b629", "prenom": "Ama", "nom": "Kouassi"}` alors que
  `org_members` porte `{"userId": "…b629", "statut": "SUSPENDED"}` — **l AC central Q2 tient**.

| Ce qui est prouve | Preuve |
|---|---|
| Isolation inter-cabinet a la resolution | filtre `org_members` : `{"orgId": "…b608", "userId": {"$in": [3 identifiants]}}` |
| Le partant reste nomme | `statut: SUSPENDED` en base, nom rendu |
| Nombre de requetes borne | **2** lectures constantes et paralleles par page (`identity_users` + `org_members`), jamais une par ligne |
| Rien n est reecrit | **0** operation d ecriture profilee sur `dossiers_journal` |

Stack arretee (`docker compose stop`).

## Suivi ouvert

- **STORY-404** — `modifierAffectation` doit refuser un identifiant hors cabinet (racine du constat de
  securite). ⚠️ Son refus devra etre **anti-enumerant** : ne pas distinguer « inconnu » de « autre
  cabinet », sinon la validation redevient l oracle que cette story vient de fermer.
- **FE-068** peut retirer son repli client (`CHAMPS_UTILISATEUR`, `estIdentifiantBrut`).
