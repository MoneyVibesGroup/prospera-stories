# STORY-484 : Une projection n'est ni figée, ni horodatée, ni tracée — alors qu'elle est remise à un tiers

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Complexité :** medium · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé par la checklist posée en FE-034 puis étendue en FE-035 : pour tout objet qu'un cabinet REMET À UN TIERS, demander « qui a le droit » ET « qui le saura ».

---

## Le fait

`ProjectionController` et `ComparaisonController` sont en **lecture pure** : rien n'est écrit, rien
n'est journalisé. C'est un bon choix d'architecture — une projection est une **dérivation**, il n'y a
rien à stocker donc rien à invalider — et il rend la projection **rejouable** grâce au triplet
`(snapshotId, versionHypothesesId, modeleVersion)` et au paramètre `?versionHypotheses=`.

**Rejouable n'est pas retrouvable.** Le produit ne sait pas dire :

- **qui** a sorti le prévisionnel remis à la banque (`AuditType` ne compte aucun acte de projection,
  et les contrôleurs n'injectent pas `AuditService`) ;
- **quand** il a été produit (la réponse ne porte aucune date) ;
- **lequel** a été remis, s'il y en a eu plusieurs.

Le contraste est frappant avec la **liasse** dont ce prévisionnel découle : elle porte un journal
complet, des versions figées et une piste d'audit (FE-034). Le document qui en dérive — celui qui sort
du cabinet — n'en porte aucun.

⚠️ Même famille que **STORY-471** (aucune piste d'audit sur les hypothèses), objet différent : ici
c'est l'acte de **restitution** qui n'est pas tracé.

## Critères d'acceptation

- [x] AC-1 — La réponse porte `produitLe` (horodatage serveur) et `produitPar` (identifiant de
      l'appelant). Une date posée par le client serait une date qu'il choisit.
- [x] AC-2 — Un `AuditType.PROJECTION_CONSULTEE` est journalisé par appel, avec le triplet de
      reproductibilité — c'est ce triplet, et non la réponse, qui permet de rejouer.
- [x] AC-3 — Le rôle : `@Roles(TENANT_ADMIN, TENANT_USER)` sur les deux contrôleurs. **Arbitrage PO
      requis**, même arbitrage que **STORY-470** : un prévisionnel remis à un tiers engage le cabinet.
      À trancher **avant** la première ligne de code, le rôle changeant la forme de l'écran.
- [x] AC-4 — Aucune écriture métier n'est introduite : la projection reste une dérivation. Le journal
      est un effet de bord d'observabilité, pas un agrégat.

## Conséquences ailleurs

- Si le PO veut un prévisionnel **opposable** (figé, versionné, exportable tel quel), c'est une autre
  story — et elle appartient à **FE-038** (export). Celle-ci se limite à savoir **qui a produit quoi,
  et quand**.

---

## Arbitrages de cadrage (2026-09-09, avant la première ligne)

### D-484-1 — AC-3 est DÉJÀ satisfait, et on ne le « livre » donc pas

`projection.controller.ts:52` et `comparaison.controller.ts:42` portent **exactement**
`@Roles(Role.TENANT_ADMIN, Role.TENANT_USER)`, plus `@RequiresBilanAccess()` et
`@RequiresDossierScope()`. Le critère décrit **l'état courant** : il n'y a rien à écrire.

⛔ **L'arbitrage PO qu'il appelle reste donc OUVERT, et cette story ne le tranche pas.** Restreindre
la restitution à `TENANT_ADMIN` serait un **rétrécissement de droit** qui change la forme de l'écran —
exactement ce que la fiche dit devoir être décidé avant de coder. Le faire ici, sans décision, serait
déborder du périmètre dans le sens le plus coûteux : casser l'usage d'un `TENANT_USER` qui sort
aujourd'hui légitimement un prévisionnel.

⇒ AC-3 est **coché comme constaté**, avec la mesure qui le prouve, et la question de la restriction
est renvoyée au PO. Si la réponse est « TENANT_ADMIN seul », c'est une story d'une ligne.

### D-484-2 — TROIS routes, pas deux contrôleurs

La fiche parle des « deux contrôleurs ». Ce qui compte pour AC-1 et AC-2, ce sont les **routes** :

| route | contrôleur |
|---|---|
| `GET …/hypotheses/:id/projection` | `ProjectionController` |
| `GET …/hypotheses/:id/projection-mensuelle` | `ProjectionController` |
| `GET …/previsionnel/comparaison` | `ComparaisonController` |

⛔ Compter les contrôleurs plutôt que les routes est **précisément** la façon dont ce dépôt a produit
quatre fois le même défaut — une garde posée sur un seul des chemins (STORY-445, STORY-457,
STORY-483). Les trois routes sont tracées, et un test **énumère les routes** plutôt que de les nommer
une par une.

### D-484-3 — une SEULE implémentation, injectée, jamais recopiée trois fois

`RestitutionService` porte l'unique geste : horodater, journaliser, rendre le couple. Les trois
handlers l'appellent, ils ne le réimplémentent pas. C'est ce qui rend le test d'énumération capable de
prouver quelque chose : si une route l'oublie, elle n'a **rien** au lieu d'avoir une variante.

### D-484-4 — `journaliser`, jamais `journaliserDansTransaction`

Le module expose les deux, et le choix est un **arbitrage de sécurité déjà rendu** (STORY-454) :
`journaliser` **avale** ses erreurs, `journaliserDansTransaction` les **propage**. La règle qui les
départage est écrite dans le dépôt : la seconde est réservée aux actes **destructeurs**, dont la ligne
de journal est la **seule trace attribuée**.

Ici l'acte est une **lecture**. Une restitution non journalisée est une perte de confort ; une
restitution **refusée** parce que `audit_events` est indisponible serait une panne fabriquée sur un
document qu'un cabinet doit pouvoir sortir. ⇒ `journaliser`, doublé du filet `try/catch` du patron
`ExportService.tracer` — « aucune évolution de l'audit ne pourra transformer une restitution réussie
en erreur ».

C'est aussi ce qui satisfait **AC-4** : le journal est un effet de bord d'observabilité, il ne peut
ni écrire un agrégat, ni faire échouer la dérivation.

### D-484-5 — `produitLe` est une DATE SERVEUR, `produitPar` l'identifiant du JWT

`new Date().toISOString()` côté serveur, et `user.userId` **résolu du jeton**, jamais d'un champ du
corps ou d'un paramètre. AC-1 le dit : « une date posée par le client serait une date qu'il choisit ».
La même phrase vaut pour l'auteur — c'est la règle d'anti-répudiation déjà appliquée aux hypothèses
(STORY-471, « du JWT, jamais du corps »).

⚠️ **`produitPar` est un IDENTIFIANT, pas un nom.** Résoudre le nom de la personne est un autre geste,
avec son propre read-model et ses propres pièges (STORY-382, STORY-441). La fiche demande
« l'identifiant de l'appelant » : c'est ce qui est servi, et la description du contrat le dit.

### D-484-6 — la cible du journal est le JEU D'HYPOTHÈSES

`AuditCible` exige `{ collection, id }` et une projection **n'a aucun document**. Le même problème
s'est posé en STORY-454 pour une suppression. La cible naturelle est le **jeu d'hypothèses** dont la
projection dérive : c'est l'objet que l'utilisateur nomme, et celui sur lequel le journal se relit.

Pour la **comparaison**, qui porte 2 à 5 jeux, la cible est le **premier** identifiant — celui que la
réponse désigne déjà comme la **référence** des écarts — et le contexte porte la liste complète.

### Hors périmètre, nommé

- **Un prévisionnel opposable** (figé, versionné, exportable tel quel) : la fiche le renvoie
  elle-même à FE-038.
- **La restriction du rôle à `TENANT_ADMIN`** : arbitrage PO non rendu, cf. D-484-1.
- **La résolution du nom de la personne** derrière `produitPar` : autre read-model, autre story.
- **`EXPORT_EFFECTUE`** : l'export du prévisionnel est **déjà** journalisé, cette story ne le touche
  pas. Un même prévisionnel sorti puis exporté produira deux lignes, de deux types différents — c'est
  la lecture voulue, ce sont deux actes.

---

## Progress Tracking

### Développement (2026-09-09)

Un seul dépôt, `bilan-service`. Quatre AC : **trois livrés, un constaté déjà satisfait**.

**Ce que la lecture du code a changé au cadrage :**

1. **AC-3 était déjà vrai.** Les deux contrôleurs portent `@Roles(TENANT_ADMIN, TENANT_USER)`,
   `@RequiresBilanAccess()` et `@RequiresDossierScope()`. Le critère décrivait l'état courant.
2. **La fiche parle de deux contrôleurs, il y a TROIS routes.** C'est la différence qui compte : la
   projection annuelle et la mensuelle vivent dans le même contrôleur, et compter les contrôleurs
   plutôt que les routes est exactement la façon dont ce dépôt a produit quatre fois une garde posée
   sur un seul des chemins.
3. **L'arbitrage `journaliser` / `journaliserDansTransaction` était déjà rendu**, par la revue de
   sécurité de STORY-454, et sa règle est écrite dans le dépôt : le canal qui **propage** est réservé
   aux actes **destructeurs**. Une lecture prend l'autre.

### La garde e2e qu'il a fallu DÉPLACER, et pourquoi ce n'est pas l'affaiblir

⚡⚡ **Deux tests existants affirmaient « deux appels rendent une réponse identique »** — un
`JSON.stringify(a) === JSON.stringify(b)` sur le corps entier. Un horodatage les rend **faux par
construction**, et c'est la story qui a raison : le document remis à un tiers doit dire quand il a été
produit.

⛔ **La tentation était de remplacer l'assertion exhaustive par un `toEqual` sur quelques champs
choisis.** C'aurait transformé une garde qui couvre **tout le corps** en un échantillon — le mode de
panne que ce dépôt paie régulièrement. La garde a donc été **déplacée d'un cran** :

- tout le corps **moins les deux champs de traçabilité** reste comparé au caractère près ;
- une seconde assertion épingle que **ces deux-là, et eux seuls**, sont ce qui varie.

Sans la seconde, ajouter demain un troisième champ non déterministe passerait inaperçu.

### Le câblage que seul l'e2e pouvait révéler

⚡ **Trois modules de test montaient les contrôleurs sans le service neuf.** Les tests de contrôleur
instancient la classe à la main : ils prouvent le geste, pas son **injection**. Les e2e ont rendu
`Nest can't resolve dependencies of the ProjectionController` — puis, une fois le provider ajouté,
`can't resolve dependencies of the RestitutionService`, parce que deux de ces modules ne fournissaient
pas non plus `AuditService`. Trois montages à réparer, qu'aucun test unitaire n'aurait signalés.

### Table de mutations — 5 sur 5 ROUGES, par assertion

| # | Mutation | Résultat |
|---|---|---|
| M1 | `produitPar` vient du paramètre de route, plus du JWT | ROUGE — 2 routes |
| M2 | l'horodatage devient un littéral figé | ROUGE — 2 routes |
| M3 | le type d'acte journalisé devient `EXPORT_EFFECTUE` | ROUGE |
| M4 | la collection cible perd son `snake_case` explicite | ROUGE |
| M5 | le triplet perd `versionHypothesesId` | ROUGE — 2 routes |

⚠️ **Chaque rouge a été relu pour vérifier qu'il vient d'une ASSERTION et non d'une erreur de
compilation** — le piège qui a produit trois fausses lectures en STORY-483. M2 et M5 ont été rejouées
isolément : deux tests nommés échouent à chaque fois, un par route.

### Vérification docker — les trois routes, sur les documents réellement écrits

⚠️ Version servie confirmée avant de conclure : le conteneur a recompilé (`Found 0 errors`) et sert
`RestitutionService`.

**AC-1 — les trois réponses HTTP :**

```
annuelle    produitLe 2026-09-09T06:58:15.253Z   produitPar 6aa0c1548a0d92a3c5470501
mensuelle   produitLe 2026-09-09T06:58:15.790Z   produitPar 6aa0c1548a0d92a3c5470501
comparaison produitLe 2026-09-09T06:58:45.652Z   produitPar 6aa0c1548a0d92a3c5470501
```

`produitPar` est bien le **sujet du jeton**, pas l'identifiant de jeu passé dans le chemin.

**AC-2 — les trois lignes écrites dans `audit_events`**, relues directement :

| restitution | cible | contexte |
|---|---|---|
| `PROJECTION_ANNUELLE` | `jeux_hypotheses` / le jeu | triplet complet |
| `PROJECTION_MENSUELLE` | `jeux_hypotheses` / le jeu | triplet **+ `exercice: 3`** |
| `COMPARAISON` | `jeux_hypotheses` / le jeu de **référence** | `jeux` (les deux ids), `jeuEtatsId`, `versionsSnapshot`, `modeleVersion` |

⛔ **La comparaison ne publie PAS de `snapshotId`**, et c'est délibéré : elle porte 2 à 5 scénarios
dont les versions de snapshot peuvent différer. Réutiliser le triplet de la projection annuelle aurait
sérialisé un `snapshotId: undefined` — un champ qui *paraît* renseigné et ne l'est pas.

**AC-4** — aucune écriture métier : les trois routes restent des `@Get`, aucune transaction n'est
ouverte, et un journal en panne rend quand même la réponse **avec** son horodatage, prouvé par trois
tests qui rejettent l'écriture d'audit.

### Revue de code et revue de sécurité — 10 constats, tous réels, tous traités

**Sécurité — un constat, et il visait la propriété même de la story.**

⚡⚡ `cibleJeu` recopiait le segment d'URL **brut**. Or `Types.ObjectId.isValid` accepte
l'hexadécimal en **MAJUSCULES** : appeler la route avec un identifiant en majuscules résout **le
même document**, rend 200 et sort le prévisionnel. Mais la relecture du journal par cible est une
**égalité de chaîne**, et la réponse publie l'identifiant en **minuscules**. La question « qui a
sorti CE prévisionnel ? », posée avec l'identifiant que la réponse elle-même donne, rendait donc
une **liste vide** sur un document réellement sorti du cabinet.

⛔ Un appelant ordinaire, sans aucune élévation, choisissait sa casse et se rendait invisible au
seul contrôle ciblé — c'est-à-dire exactement ce que cette story existe pour livrer. Et le dépôt
avait **déjà tranché ce cas**, cinq fichiers plus loin, dans `ExportService`, avec le même `HEX_24`
et le même commentaire. Le correctif n'y avait pas été repris.

**Code — neuf constats, dont un bloquant.**

| # | Constat | Ce qu'il produisait |
|---|---|---|
| 1 | le contrat OpenAPI affirmait encore « Aucune écriture : dérivation déterministe » | un intégrateur comparant deux réponses conclut que le prévisionnel a bougé, à chaque appel |
| 2 | l'exercice journalisé venait de la **requête**, défaut recopié à la main | le jour où ce défaut change, le journal ment sur **lequel** des trois documents est sorti |
| 3 | le `it.each` présenté comme une énumération était une **liste manuelle** | une 4ᵉ route non tracée la laisserait verte, sous un docstring qui promet le contraire |
| 4 | aucune batterie ne montait `BilanModule` | retirer le provider laisse tout vert et l'application **ne démarre pas** |
| 5 | `expect(ua.produitPar).toBe(ub.produitPar)` — **vacant** | `undefined` des deux côtés passe ; c'était la seule assertion e2e du champ |
| 6 | l'identité d'une comparaison ignorait la version de chaque scénario | rejouer donne d'autres chiffres, et rien ne le dit |
| 7 | la description publiée des contextes ignorait le type neuf | un écran lit `contexte.snapshotId` et affiche une case vide sur les comparaisons |

⚡⚡ **Le constat 2 est celui qui instruit le plus.** Le code lisait `query.exercice ?? 1` et **le
test recopiait le même littéral** : les deux auraient bougé ensemble, et le test qui prétendait
garder ce champ ne pouvait que confirmer le défaut. La correction ne se limite pas au code — la
fixture **diverge maintenant volontairement** de la requête, seule construction où les deux valeurs
sont discernables.

⚡ **Le constat 3 a produit un vrai test.** La liste écrite à la main a été gardée, mais un test lit
désormais les **métadonnées Nest** du prototype et exige que chaque route déclarée y figure : c'est
lui l'énumération, et il rougit tout seul. Le docstring dit maintenant la vérité.

### Table de mutations finale — 7 mutations, 7 rouges par assertion

Chaque rouge relu pour vérifier qu'il vient d'une assertion, jamais d'une erreur de compilation.

| # | Mutation | Résultat |
|---|---|---|
| M1 | `produitPar` vient du paramètre de route | ROUGE — 2 routes |
| M2 | l'horodatage devient un littéral figé | ROUGE — 2 routes |
| M3 | le type d'acte journalisé devient `EXPORT_EFFECTUE` | ROUGE |
| M4 | la collection cible perd son `snake_case` | ROUGE |
| M5 | le triplet perd `versionHypothesesId` | ROUGE — 2 routes |
| M6 | la canonisation de l'identifiant est retirée | ROUGE |
| M7 | le provider est retiré de `BilanModule` | ROUGE |

### Vérification docker REJOUÉE sur l'état final

Le scénario de la revue de sécurité, mesuré sur la stack :

```
appel en MAJUSCULES : 200
cible.id journalisé : 6aa0c337addcc6aab64cac70
retrouvé par la requête en MINUSCULES : 1
```

Le document sort, et il est **retrouvable** par l'identifiant que la réponse publie. Avant le
correctif, la même requête rendait zéro.

### Clôture — 2026-09-09

PR `MNV-484(bilan)` rebase-mergée sur `dev`, branche supprimée. PR `docs/` mergée sur `main`.
Assigné à : `vivianMoneyVibesGroupes`.
