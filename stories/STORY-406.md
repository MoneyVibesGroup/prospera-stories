# STORY-406 : Un octet nul dans la recherche rend `500` — le refus documenté sort en erreur serveur

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** relevée par la **revue de sécurité de STORY-383**, qui l'a **écartée de son rapport** — le défaut est **strictement pré-existant** (STORY-359) et STORY-383 ne l'amplifie pas.
**Priorité :** Should Have
**Story Points :** 2
**Statut :** `done`
**Complexité :** low
**Créée le :** 2026-08-25 — à la revue de sécurité de STORY-383
**Sprint :** 20
**Service :** `dossier-service`

> ⚠️ **Sur le numéro.** `git log -S"STORY-406"` la trouve dans un état **historique** du dépôt (commit
> `1debcaa`, backlog fiscalité du 2026-08-04, plage 400→456) — cette plage a été **renumérotée depuis**,
> et l'épic fiscalité actuel ne va plus au-delà de STORY-364. Vérifié libre le 2026-08-25 dans l'état
> **actuel** : absente de `stories/`, de `sprint-status.yaml`, de tout `*.md`/`*.yaml`, et de
> `origin/main`. La règle issue de la collision STORY-396 impose de le dire plutôt que de laisser la
> prochaine session refaire le doute.

---

## Le constat — mesuré, pas supposé

```
GET /api/v1/dossiers?q=%00abc     -> HTTP 500     (route ouverte à TENANT_USER)
GET /api/v1/activite?q=%00abc     -> HTTP 500     (route réservée à TENANT_ADMIN)
GET /api/v1/activite?q=abc        -> HTTP 200
```

Corps rendu : `{"statusCode":500,"error":"Internal Server Error","message":"Une erreur interne est survenue."}`

Cause, côté base :

```
BadValue | Regular expression cannot contain an embedded null byte
```

## Pourquoi la saisie arrive intacte jusqu'à Mongo

Deux fonctions se passent la valeur, et **aucune des deux ne connaît l'octet nul** :

| Étape | `src/modules/dossiers/recherche.util.ts` | Ce qu'elle en fait |
|---|---|---|
| `normaliserPourRecherche` | `NFD` → retrait des diacritiques → minuscules → `\s+` → `trim()` | **rien** — ce n'est ni un diacritique ni un blanc au sens de `\s`, et `trim()` ne l'élague pas |
| `echapperRegex` | échappe `. * + ? ^ $ { } ( ) | [ ] \` | **rien** — ce n'est pas un métacaractère, donc il n'est pas dans la classe |

La chaîne part alors en `$regex` telle quelle, et le pilote la refuse **au niveau BSON**.

⚠️ **Ce n'est PAS une injection** : la valeur reste une valeur, jamais une clé ni un opérateur — la
revue de sécurité l'a établi sur les deux étages (parser `simple` d'Express 5 + `forbidNonWhitelisted`).
C'est un **défaut de correction** : le contrat annonce `400` pour une saisie invalide, et il sort `500`.

⚡ **Le même patron que STORY-405**, à une entrée près : là, `@IsMongoId()` acceptait le préfixe `0x`
et le `400` documenté sortait en `500`. Ici, c'est le champ de recherche. Une saisie qu'un utilisateur
peut produire — un copier-coller depuis un export mal terminé suffit — ne doit jamais consommer le
budget d'erreur `5xx`, où elle noie les vrais incidents.

---

## User Story

En tant qu'**exploitant de la plateforme**,
je veux qu'une **saisie de recherche invalide** soit refusée proprement,
afin que **le budget d'erreur `5xx` ne décrive que de vrais incidents serveur**.

---

## Ce que la story livre

Un seul geste, dans la fonction que **tous** les appelants traversent :

- `normaliserPourRecherche` retire les **caractères de contrôle** de la saisie — c'est déjà elle qui
  replie les accents et réduit les blancs, c'est donc là que « ce qui n'est pas du texte cherchable »
  se retire.

⚠️ **Le geste est dans la fonction PARTAGÉE, pas chez chaque appelant.** Ils sont **trois** aujourd'hui
(`journal.repository.ts:187`, `portefeuille.repository.ts:225` et `:237`), et un correctif posé chez
deux d'entre eux laisserait le troisième ouvert sans que rien ne le signale.

⚠️ **`normaliserNif` doit être vérifiée aussi** : `portefeuille.repository.ts:237` échappe un NIF
normalisé par un **autre** chemin. Si `normaliserNif` laisse passer la même saisie, le correctif
ci-dessus ne couvre pas cette clause.

## Hors périmètre

- ⛔ **Aucun changement d'`echapperRegex`** : elle échappe des **métacaractères**, et un caractère de
  contrôle n'en est pas un. Y ajouter un cas mélangerait deux responsabilités — « rendre un motif
  littéral » et « nettoyer une saisie ».
- ⛔ Aucune nouvelle route, aucun nouveau code de refus : une saisie devenue vide après nettoyage suit
  la règle **déjà en vigueur** — traitée comme **absente**, pas comme « ne correspond à rien ».

---

## Acceptance Criteria

- [x] `GET /api/v1/dossiers?q=%00abc` et `GET /api/v1/activite?q=%00abc` rendent un résultat **normal**
      (la recherche porte sur `abc`), **jamais `500`**.
- [x] La même saisie **seule** est traitée comme **absente** — la règle existante des blancs.
- [x] Les **autres caractères de contrôle** subissent le même sort, et **un test les balaye** plutôt
      que de n'éprouver que le premier.
- [x] Un caractère **accentué** et un **espace insécable** continuent de se comporter comme
      aujourd'hui — la non-régression de STORY-359.
- [x] La clause **NIF** (`normaliserNif`) est vérifiée sur la même entrée, et corrigée si elle est
      atteinte.
- [x] **Vérification docker** : la mesure ci-dessus rejouée sur la vraie base, `500` devenu `200`.

---

## Definition of Done

- [x] Lint 0 · build OK · couverture ≥ seuils.
- [x] Mutation : retirer le nettoyage fait **rougir** le test — sinon il ne garde rien.
- [x] `/code-review` + `/security-review`.

## Story Points Breakdown

- Nettoyage dans `normaliserPourRecherche` + vérification de `normaliserNif` : 0,5 pt
- Tests (balayage des caractères de contrôle, non-régression accents) : 1 pt
- Vérification docker sur les deux routes : 0,5 pt
- **Total : 2 points**


---

## Progress Tracking

**Statut :** `done` — **clôturée le 2026-08-25**. PR **`dossier-service#18`** rebase-mergée sur `dev`
(correctif + commit de revue + commit de sécurité), branche `MNV-406` supprimée.
**Dépôt unique** — aucun contrat d'événement touché, aucun index, aucune migration.

### Ce qui a été livré

`retirerControles()` — nouvelle fonction de `recherche.util.ts` — retire les caractères de contrôle
d'une saisie. Elle est appelée **aux deux endroits où une saisie devient un motif** :

| Chemin | Appel | Ce qui aurait cassé sans lui |
|---|---|---|
| texte | `normaliserPourRecherche` (les **3** appelants la traversent) | `$regex` refusé au niveau BSON ⇒ `500` |
| NIF | `normaliserNif(retirerControles(q))` (`portefeuille.repository:247`) | clause NIF **tombée** du `$or` ⇒ recherche **muette** |

⚠️ **Trois décisions, chacune gardée par un test.**

1. **La classe exclut `\u0009`–`\u000D`.** Ces cinq-là sont des blancs pour `\s` : ils doivent devenir
   **une espace**, pas disparaître — sinon `1000 745<TAB>307` cesserait de valoir `1000 745 307`.
2. **Le retrait précède la réduction des blancs.** Placé après, retirer un caractère entouré d'espaces
   laisserait une **double** espace que plus rien ne replierait, et la saisie cesserait de correspondre au
   champ stocké — qui subit exactement la même transformation.
3. **C'est `q` qu'on nettoie au site NIF, pas `texte`.** Ce dernier est déjà minusculé et ses accents
   dépliés : « société2 » y deviendrait le « NIF » `SOCIETE2` et rouvrirait le balayage d'index que
   `MOTIF_NIF` existe pour empêcher.

⛔ **`normaliserNif` n'est PAS modifiée**, et c'est délibéré : elle dérive aussi la **clé d'unicité**
`nifSocieteNormalise` (STORY-354, D14). C'est la **saisie** qu'on nettoie, jamais la dérivation stockée —
la changer ferait collider deux NIF aujourd'hui distincts. `echapperRegex` reste intacte elle aussi
(hors périmètre déclaré) : elle rend un motif littéral, elle ne nettoie pas une saisie.

### ⚡⚡ Ce que le dev vert n'avait PAS vu — la revue de code

Le premier correctif fermait le `500` **et transformait le chemin NIF en recherche muette**. Mesuré :
`?q=1000<NUL>745307` rendait `200` + liste **vide**, là où `?q=1000745307` rend le dossier. Cause :
`normaliserNif` laisse passer le caractère, `MOTIF_NIF` (`/^[0-9A-Z-]+$/`, ancrée) l'échoue, et la clause
`nifSocieteNormalise` **tombait** du `$or` — `rechercheNormalisee` ne portant PAS le NIF, plus rien ne le
trouvait. Un dossier introuvable par son numéro se lit « il n'existe pas ».

⚠️ **L'AC-1 demandait un résultat NORMAL, pas seulement « plus de 500 ».** Le premier jet lisait l'AC-5
(« corrigée **si** elle est atteinte ») comme « le 500 ne l'atteint pas, donc rien à faire » — alors que
la story disait aussi, une ligne plus haut : « **si `normaliserNif` laisse passer la même saisie, le
correctif ne couvre pas cette clause** ». Elle le laisse passer. La condition était remplie.

⚠️ Et l'argument qui semblait fermer le débat — « toucher `normaliserNif` ferait collider deux NIF » —
était **vrai mais hors sujet** : il ne vaut que pour la dérivation **stockée**. Nettoyer la **saisie** au
site de requête ne touche aucune clé d'unicité. Un argument juste peut protéger la mauvaise conclusion.

**2 autres constats**, corrigés : les descriptions Swagger de `q` n'annonçaient la règle « traité comme
absent » que pour le vide et les espaces (elles nomment désormais les caractères **invisibles**) ; et les
titres d'`it.each` interpolaient un octet nul, ce qui rend la sortie Jest **binaire** — `grep` cesse de
compter, et on ne distingue plus un rouge d'assertion d'un rouge de compilation, ce qu'une table de
mutations doit précisément trancher. 🪤 **C'est arrivé pendant ce dev même**, et la première lecture des
mutations avait été faussée par là.

**Constat écarté** (ponytail-review) : le test « la sortie ne porte JAMAIS de caractère de contrôle » est
dominé par le balayage `0x00`–`0x9F` (~13 lignes supprimables). **Gardé** : c'est l'assertion qui *nomme*
l'invariant que Mongo refuse, et la DoD prime sur la concision.

### Revue de sécurité — 0 vulnérabilité ≥ 80

Instruit puis écarté **avec l'argument**, jamais « rien trouvé » : injection NoSQL (le nettoyage passe
**avant** `echapperRegex`, jamais après — un nettoyage postérieur casserait une séquence d'échappement ;
balayage des 1 114 112 points de code : le motif final est **toujours** un littéral) · élargissement de la
clause NIF (`retirerControles` ne fait que **retrancher** : tout motif atteignable l'était déjà par une
saisie propre ; et le `$` de JavaScript n'apparie **pas** avant un LF final, contrairement à PCRE) ·
élargissement de la « recherche absente » (rend la **portée de l'appelant**, soit ce qu'il obtient déjà en
omettant `q` ; sur `/activite`, le filtre `dossierId` survit) · portée multi-tenant (le hunk est
**entièrement contenu** dans `clausesRecherche` ; `filtrePortee` reste en premier spread, l'alternative
rejoint le `$or` **existant** sous `$and`, jamais un second `$or` racine) · champ **stocké**
`rechercheNormalisee` (aucun index unique dessus ; les 2 index uniques dérivent de `normaliserNif`,
laissée intacte) · ReDoS (motif littéral borné à 120) · guards, throttler, anti-énumération,
journalisation, CORS, secrets : hors diff et intacts.

⚡ **Un point retenu sous le seuil, corrigé quand même** : `retirerControles` était la seule des trois
fonctions du fichier à ne **pas** être fail-closed (`valeur: string` + `.replace` sans garde, là où
`normaliserNif` et `normaliserPourRecherche` prennent `unknown`). Or c'est elle qui touche la saisie **en
premier** : une valeur non-chaîne y lèverait un `TypeError`, donc un **`500`** — le défaut même que cette
story ferme. Aucune n'est atteignable par HTTP aujourd'hui (le `ValidationPipe` refuse un tableau en `400`,
coerce un objet en `"[object Object]"`, et `qs` en `allowPrototypes: false` écarte la clé `toString`) : le
test garde donc la **propriété**, pas la mesure.

### Vérification docker — `dossier_service`, stack réelle

Cabinet de vérification : 5 dossiers dont un porteur du NIF `1000745307`.

| Appel | AVANT | APRÈS |
|---|---|---|
| `/dossiers?q=%00abc` | **500** | 200 |
| `/dossiers?q=%00kossi` | **500** | 200 + « Ets Kossi Distribution » |
| `/dossiers?q=kossi%00` | **500** | 200 + « Ets Kossi Distribution » |
| `/dossiers?q=%00` *(seul)* | **500** | 200, traité comme **absent** |
| `/dossiers?q=1000%00745307` | **500** | 200 + « Société Générale du Bè » *(par le **NIF**)* |
| `/dossiers?q=%01kossi` | 200 **vide** | 200 + « Ets Kossi Distribution » |
| `/dossiers?q=%1Fkossi` | 200 **vide** | 200 + « Ets Kossi Distribution » |
| `/activite?q=%00abc` | **500** | 200 |
| `/activite?q=%00cabinet` | **500** | 200, `total=1` — **identique** à `?q=cabinet` |
| `/dossiers?q=kossi` · `?q=1000745307` | 200 | 200 *(non-régression)* |
| `/dossiers?q[$ne]=x` | 400 | 400 *(non-régression)* |

Cause confirmée mot pour mot dans les journaux du service :
`Regular expression cannot contain an embedded null byte`.

⚡ **Les caractères de contrôle AUTRES que le nul ne rendaient pas `500`** : ils rendaient une liste
**vide**, en silence. Seul le nul est fatal à BSON ; les autres passent et n'apparient rien. Une story
écrite sur le seul symptôme `500` serait passée à côté de la moitié du défaut.

🪤 **La première mesure de l'état « AVANT » était FAUSSE, et elle disait le contraire.** `nest --watch` a
bien affiché `File change detected` puis `Found 0 errors`, **sans redémarrer le process** : aucun second
`Nest application successfully started` dans les journaux. Le conteneur exécutait donc encore le code
**corrigé** tout en montrant le fichier **non corrigé** sur le volume monté — et les 14 appels rendaient
`200`, ce qui se lisait « le défaut n'existe pas ». `docker compose restart` a rendu les 7 `500`. Le
compteur à surveiller est `Nest application successfully started`, jamais `Found 0 errors`.

### Portes

Lint **0** · build OK · **1126** unitaires + **255** e2e verts · couverture
**99.28 / 93.83 / 96.68 / 99.3** (`recherche.util.ts` et `portefeuille.repository.ts` à **100 %** partout).

**Table de mutations — 6, toutes rouges par ASSERTION, 0 erreur de compilation :**

| # | Mutation | Rouges |
|---|---|---|
| M1 | nettoyage retiré de `normaliserPourRecherche` | **18** |
| M2 | nettoyage placé **après** la réduction des blancs | **1** *(le seul cas qui distingue les deux mondes)* |
| M3 | classe `\p{Cc}` entière (TAB/CR retirés au lieu d'être repliés) | **2** |
| M5 | nettoyage retiré du **site NIF** | **5** |
| M6 | `texte` au lieu de `q` au site NIF | **1** |
| M7 | garde fail-closed retirée de `retirerControles` | **5** |

🪤 **M5 et M6 ont d'abord rougi par `TS6133`** (import devenu inutilisé), et **M7 n'aurait pas compilé**
sans un cast. Un rouge de compilation ne prouve **rien** : les trois ont été rejouées en supprimant aussi
l'import / en ajoutant le cast, pour que le rouge vienne bien de l'assertion.
