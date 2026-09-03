# STORY-444 : La réouverture d'une liasse figée n'exige aucun motif et n'en trace aucun

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`POST /dossiers/:dossierId/bilan/etats/:id/rouvrir` **ne prend aucun corps**. L'événement
`JEU_ROUVERT` est journalisé avec `cible` seule — `journaliser()` accepte pourtant un `contexte`,
qui reste `null` ici.

Rouvrir des comptes **déjà arrêtés** est l'acte le plus engageant du cycle après la validation
elle-même : il retire à une version figée son caractère de référence courante, et il produira des
états différents de ceux que le client — ou l'administration — a peut-être déjà vus.

**C'est le point faible de l'opposabilité que la story FE-034 vend.** Un journal qui dit
« rouverte le 22/07 par 68a1f3…4c02 » sans dire **pourquoi** ne défend rien devant un contrôle.

Le produit sait pourtant déjà faire : `ProposerSurchargeDto` porte un `motif` pour l'arbitrage
d'**un seul compte** (FE-030).

## Critères d'acceptation

- [ ] AC-1 — `POST …/rouvrir` accepte `{ motif: string }`, **obligatoire**, 10 à 500 caractères.
      Un corps absent ou un motif vide → `400`.
- [ ] AC-2 — Le motif est journalisé dans `contexte` de l'événement `JEU_ROUVERT`
      (`{ motif, versionRouverte }`).
- [ ] AC-3 — Le motif est **conservé sur le jeu** (`derniereReouverture: { motif, par, at }`) pour
      que l'écran puisse le rappeler tant que le brouillon est ouvert — un journal se consulte,
      un bandeau se lit.
- [ ] AC-4 — La réouverture d'un jeu **jamais validé** reste refusée (`409 JEU_NON_VALIDE`,
      inchangé) : pas de motif à demander là où il n'y a pas d'acte.
- [ ] AC-5 — `contexte` étant publié par **STORY-442**, le motif apparaît dans le journal sans
      travail supplémentaire côté lecture.

## Conséquences ailleurs

- Dépend de **STORY-442** pour être **visible** (sinon le motif est stocké et invisible, exactement
  le défaut que 458 corrige).
- La maquette FE-034 **dessine le champ** dans le dialogue de réouverture et déclare qu'il n'est
  transmis à personne aujourd'hui — règle PO : dessiner la cible, et le dire.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `bilan-service` **#76** (3 commits) rebase-mergée sur `dev` le
2026-09-03.

Branches créées **avant** la première ligne de code (preuve `git rev-parse --abbrev-ref HEAD`
sur chaque dépôt impacté) :

```
docs             MNV-444
bilan-service    MNV-444
```

**Un seul dépôt impacté** : la route, son DTO, le champ persisté et le contrat de lecture
vivent entièrement dans `bilan-service`. Aucun contrat d'événement ne change (la ligne
d'outbox `liasse.etat.change` publiée par la réouverture garde exactement sa charge), donc
pas de second dépôt. **Aucun consommateur** de `POST …/bilan/etats/:id/rouvrir` n'existe hors
du service — `admin-panel`, `frontend-admin-panel` et `expert-comptable` ne l'appellent nulle
part, vérifié par balayage : le passage de « aucun corps » à « corps obligatoire » ne casse
aucun appelant.

### Ce qui est livré

- **AC-1** — `RouvrirJeuEtatsDto` : `motif` **obligatoire**, 10 à 500 caractères, **rogné
  avant d'être mesuré**, aucun caractère de contrôle. Corps absent, motif vide ou fait
  d'espaces ⇒ **400**, messages en français.
- **AC-2** — la ligne `JEU_ROUVERT` porte `contexte: { motif, versionRouverte }` :
  « pourquoi » ne défend rien si l'on ne sait pas **quelle version** a cessé de faire foi.
- **AC-3** — `derniereReouverture: { motif, par, at }` est écrit **dans la transition gardée
  elle-même** et publié au contrat en classe nommée (`DerniereReouvertureDto`), jamais en
  `object` opaque.
- **AC-4** — un jeu jamais validé rend toujours `409 JEU_NON_VALIDE`, **avec un motif
  valide**.
- **AC-5** — le motif se relit sur `GET …/bilan/audit` sans une ligne de code de lecture :
  STORY-442 publie déjà `contexte`.

### ⚠️ Ce que la story change et qui n'était écrit nulle part

`AuditService.journaliser` documentait une propriété : « les huit clés d'aujourd'hui sont
**toutes calculées côté service**, aucune ne vient d'un corps de requête — c'est la propriété
à conserver » (constat de la revue de sécurité de STORY-442). **Cette story la casse
délibérément** : le `motif` est la première clé du journal qui vienne d'une saisie, et il
existe précisément pour être **relu par les collaborateurs du dossier**. Les trois docstrings
qui portaient l'ancienne affirmation (`audit.service.ts`, `audit-event.schema.ts`,
`AuditEventResponseDto.contexte`) sont corrigés dans le même diff — sans quoi le contrat
publié aurait affirmé « seul `EXPORT_EFFECTUE` porte un contexte » alors que le code en écrit
deux.

Ce qui remplace la propriété perdue : toute saisie versée dans `contexte` est **bornée et
rognée par son DTO**, et son champ **annonce au contrat qu'il sera publié**.

### ⛔ L'arbitrage de l'AC-3 : un fait daté ne s'efface pas

`derniereReouverture` n'est **pas** remis à `null` par une re-validation. La fiche dit « tant
que le brouillon est ouvert » ; l'effacer à la validation supprimerait un fait pour économiser
au client une lecture de `statut`, et ferait disparaître du document la seule trace de la
dernière réouverture d'un jeu re-figé. Le contrat le dit explicitement : c'est `statut` qui
décide si le bandeau s'affiche. Vérifié en base (le champ survit à la re-validation) et figé
par un e2e.

### ⚠️ L'ordre des refus est observable, et il est documenté

Les pipes s'exécutent **avant** le handler : sur un jeu déjà `BROUILLON`, un appel **sans**
motif rend **400**, pas `JEU_NON_VALIDE`. Le 409 de l'AC-4 n'apparaît qu'avec un motif valide.
Dit dans l'`@ApiOperation` de la route, et figé par un e2e qui mesure les deux.

### Vérification

Lint 0 warning · build OK · **1 637 unitaires + 451 e2e verts** · couverture **98,8 / 93,97 /
98,74 / 98,82** · **5 mutations rouges par assertion**, aucune par erreur de compilation (la
mutation « le repo n'écrit plus le motif » a dû être réécrite avec un `void reouverture;` pour
compiler avant d'être comptée) :

| mutation | ce qui vire au rouge |
|---|---|
| le `@Transform` ne rogne plus | 3 unitaires + 2 e2e (dix espaces redeviennent un motif valide) |
| `derniereReouverture` retiré du patch du repository | le spec de repository (patch `toEqual`) |
| la route ne verse plus de `contexte` au journal | 1 unitaire + 1 e2e (AC-2) |
| le charset de contrôle remplacé par `/^[\s\S]*$/u` | 5 unitaires (saut de ligne, octet nul, C1…) |
| `derniereReouverture: null` ajouté au patch de validation | l'e2e « le champ SURVIT à une re-validation » |

⚠️ **Le `*.dto.ts` étant hors `collectCoverageFrom`**, la garde de l'AC-1 est éprouvée par un
spec dédié qui instancie la **vraie** `ValidationPipe` avec les options de `main.ts` — sans
lui, retirer le rognage ou desserrer une borne ne ferait bouger aucun seuil.

**Vérification docker sur la route réelle** — stack `docker compose` (mongo, kafka, redis,
auth-service, mailhog, bilan-service), **JWT réel de l'IdP** (inscription, vérification de
l'e-mail par le lien Mailhog, connexion), read-models semés à la main :

| critère | mesure |
|---|---|
| AC-1 | corps absent · `""` · 14 espaces · saut de ligne · 5 caractères ⇒ **400** cinq fois ; le jeu reste `VALIDE` en base et **0** ligne au journal |
| AC-1 | motif envoyé entouré d'espaces ⇒ **72 caractères en base**, aucun espace de bord : c'est la valeur rognée qui est conservée |
| AC-3 | `derniereReouverture` en base porte un **`ObjectId`** et une **`Date`** réels, pas des chaînes |
| AC-2 | une seule ligne `JEU_ROUVERT`, `contexte = { motif, versionRouverte: 1 }` |
| AC-5 | `GET …/bilan/audit?type=JEU_ROUVERT` rend ce contexte tel quel — zéro ligne de code de lecture |
| AC-3 | re-validation ⇒ `statut: VALIDE` **et** le motif toujours là ; 2ᵉ réouverture ⇒ `versionRouverte: 2`, le jeu porte le nouveau motif, le journal **garde les deux** |
| AC-4 | jeu jamais validé : **400** sans motif, **409 `JEU_NON_VALIDE`** avec un motif valide |
| atomicité | la ligne d'outbox `liasse.etat.change` (`etat: BROUILLON`, `version: 1`) est écrite avec le jeu ; **0** jeu `BROUILLON` portant encore un `validePar` |

⚠️⚠️ **La vérification docker a été prouvée NON-VACANTE** : rejouée sur le code **muté** (le
repository n'écrit plus `derniereReouverture`), la 3ᵉ réouverture laisse en base le motif de
la **2ᵉ** — le contrôle tombe. Une vérification qui ne discrimine pas ne prouve rien.

⚠️ **Le hot-reload a menti une fois de plus** : après le passage des messages de validation en
français, le conteneur servait encore les messages anglais ; `docker restart` a été nécessaire
(piège déjà fiché).

### ⚡⚡ Revue de code — aucun défaut de comportement, une garde plus étroite que sa justification

**`\p{Cc}` seul ne fermait pas ce que son docstring annonçait.** La garde disait exister pour
qu'« un saut de ligne ne fasse pas déborder la ligne qui l'affiche » ; or **U+2028 LINE
SEPARATOR et U+2029 PARAGRAPH SEPARATOR sont en `Zl`/`Zp`, pas en `Cc`**, `trim()` ne les
retire pas quand ils sont internes, et ils coupent la ligne au rendu exactement comme un
`\n`. Un motif `"Correction du poste 641<U+2028>suite au contrôle"` passait en **200**, était
persisté et versé au journal — et **les cinq cas de la batterie, tous en `Cc`, restaient
verts**. Corrigé, et la mutation (charset ramené à `Cc`) fait rougir les deux nouveaux cas.

⚠️ Second constat, sur un commentaire de test : celui du catalogue de
`bilan-dossier-scope.e2e-spec.ts` **se contredisait dans la même phrase** (« sans corps la
pipe rendrait 400 » / « le guard refuse AVANT la pipe »). Sur un dossier archivé, le 409 part
bien avant la validation du corps. Réécrit.

♻️ **Ponytail** — les deux tests du repository partageaient leur montage pour deux assertions
sur le même appel : repliés en un seul, sans perdre de garde.

### ⚡⚡ Revue de sécurité — un motif pouvait s'afficher autrement qu'il n'est stocké

**Un constat, `Low`, confiance 95, corrigé avant le merge.** Le charset excluait `Cc`, `Zl` et
`Zp`, **jamais `Cf`**. Cette catégorie porte **U+202E RIGHT-TO-LEFT OVERRIDE** et les isolats
U+2066–U+2069 : un motif qui les contient **s'affiche autrement qu'il n'est stocké**. Un
journal d'audit dont la ligne rendue à l'écran diffère du `mongosh` que lira un contrôleur ne
défend plus rien — c'est la propriété même que la story existe pour établir.

⛔ `Cf` porte aussi les caractères de **largeur nulle** : **douze U+200B faisaient douze
caractères**, `trim()` n'en retirait aucun (U+200B n'est pas dans le `WhiteSpace` d'ECMAScript
depuis ES2015), et l'AC-1 était satisfait par un motif **vide à l'œil**. Mesuré avec la vraie
pipe.

⚠️ **Et ce que la garde NE FAIT PAS est désormais écrit dans le code** : U+2800 (Braille
blank, `So`) et U+3164 (Hangul filler, catégorie **`Lo` — une LETTRE qui ne rend rien**)
restent acceptés, comme `aaaaaaaaaa`. La recommandation « exiger au moins N lettres » a été
**écartée après vérification** : elle ne fermerait rien (U+3164 *est* une lettre) tout en
donnant l'illusion du contraire. Ce qui répond de la qualité d'un motif, c'est son **auteur
nommé et daté**, pas un jeu de caractères.

**Ce que la revue a explicitement blanchi** : aucune injection NoSQL (la valeur n'est jamais
une clé ni un fragment de filtre ; le patch est un littéral à clés statiques) · aucune
pollution de prototype (mesurée) · aucune injection de log (le motif n'atteint **aucun** log :
`autoLogging: false`, les quatre messages de validation sont customs et n'écho pas la valeur) ·
aucun XSS exploitable (sortie JSON, `nosniff`, zéro consommateur hors du service) · le motif
ne franchit **pas** la frontière Kafka (`liasse.etat.change` inchangé) · aucun élargissement du
lectorat (`GET …/bilan/audit` et `GET …/bilan/etats/:id` portent la **même** chaîne de gardes
et les mêmes rôles que la route qui écrit) · pas de nouvel oracle d'énumération (les gardes
précèdent les pipes, et le 400 est uniforme).

### ⚠️ Deux réserves consignées, hors périmètre de cette story

1. **Ce qui remplace l'invariant mécanique est une convention en prose.** Le seul garde-fou
   exécutable contre une future clé non bornée dans `contexte` est l'assertion `undefined` en
   4ᵉ argument, et elle ne couvre que `JEU_VALIDE` et `JEU_COMPLEMENTS_SAISIS`. Si le projet
   veut regagner un filet, l'endroit est `AuditService.journaliser` (liste blanche de clés par
   `AuditType`, ou plafond de taille), pas un docstring. ⛔ Poser cette liste blanche
   contredirait l'AC-4 de STORY-442 : arbitrage à ouvrir, pas à trancher ici.
2. **Aucun chemin d'effacement d'un motif.** Journal append-only jamais purgé +
   `derniereReouverture` jamais remis à `null` + publication à tous les collaborateurs : une
   donnée personnelle collée par erreur dans un motif est définitive. Risque de gouvernance à
   assumer, pas une vulnérabilité.

### ⛔ La revue de sécurité a redécouvert le défaut de STORY-445

En balayant les gardes de `rouvrir`, elle a relevé que **`refuserSiExerciceClos()` est appelée
par `valider()` et pas par `rouvrir()`** — une liasse d'exercice clos peut être ramenée au
brouillon et y rester bloquée. Signalé « préexistant, non modifié, non rendu nouvellement
exploitable ». C'est **exactement** le fait de STORY-445, dont la prémisse se trouve ainsi
confirmée par une lecture indépendante.

### Vérification docker rejouée sur l'état final

Après les deux correctifs de revue (le charset a changé deux fois), la vérification a été
**rejouée entièrement** : **dix** entrées refusées en `400` (corps absent, motif vide, 14
espaces, saut de ligne, 9 caractères, 501 caractères, U+2028, **U+202E**, **12 × U+200B**,
**U+00AD**), le jeu resté `VALIDE` et **aucune** ligne ajoutée au journal ; puis une
réouverture nominale motif entouré d'espaces ⇒ `200`, motif **rogné** en base, `contexte =
{ motif, versionRouverte: 5 }` relu tel quel par `GET …/bilan/audit`, **0** jeu `BROUILLON`
portant encore un `validePar`.

⚠️ Le hot-reload a menti **deux fois** dans cette story (messages français, puis charset) :
`docker restart` à chaque fois.
