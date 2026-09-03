# STORY-443 : `GET /bilan/audit` n'a ni pagination, ni fenêtre de dates, ni filtre par cible — un journal append-only jamais purgé rend tout

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

La route ne prend qu'un paramètre : `?type=` (un `AuditType`). Elle rend **tous** les événements
du dossier, du plus récent au plus ancien, sans limite.

Trois manques, du plus grave au plus gênant :

1. **Aucun filtre par cible.** Le journal est celui du **dossier** : il mélange les jeux d'états
   et les exercices. La question naturelle — « le journal de **cette** liasse » — n'est pas
   servie, alors que `cible.id` est stocké sur chaque ligne.
2. **Aucune pagination.** La collection est **append-only** et n'est jamais purgée : la réponse
   grossit indéfiniment, et l'écran la charge en entier à chaque ouverture.
3. **Aucune fenêtre de dates.** « Ce qui s'est passé pendant la campagne 2025 » n'est pas
   exprimable.

## Critères d'acceptation

- [x] AC-1 — `?cibleId=` (et `?cibleCollection=`) filtrent sur `cible`. L'index existant
      `{tenantId, dossierId, createdAt:-1}` est complété si le plan d'exécution le demande.
- [x] AC-2 — Pagination **par curseur** sur `createdAt` (`?avant=`, `?limite=`, défaut 50,
      plafond 200) — pas d'`offset` : un journal append-only en tête de liste déplace les pages.
- [x] AC-3 — `?depuis=` / `?jusqua=` (dates ISO, bornes incluses).
- [x] AC-4 — La réponse porte `{ evenements: [...], curseurSuivant: string | null }`.
- [x] AC-5 — Les combinaisons de filtres sont **ET**, jamais **OU**.

## Conséquences ailleurs

- La maquette FE-034 n'offre que le filtre par **type** — le seul servi — et l'écrit à l'écran.
- À livrer avec **STORY-442** (même DTO, même route).

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `bilan-service` **#75** (4 commits) rebase-mergée sur `dev` le
2026-09-03.

Branches créées **avant** la première ligne de code (preuve `git rev-parse --abbrev-ref HEAD`
sur chaque dépôt impacté) :

```
docs             MNV-443
bilan-service    MNV-443
```

**Un seul dépôt impacté** : la route, son DTO et ses index vivent entièrement dans
`bilan-service`. Aucun contrat d'événement ne change, donc pas de second dépôt. **Aucun
consommateur** de `GET …/bilan/audit` n'existe hors du service — `admin-panel`,
`frontend-admin-panel` et `expert-comptable` ne l'appellent nulle part, vérifié par balayage.
Le changement de forme de la réponse (AC-4) ne casse donc aucun appelant.

### Ce qui est livré

- **AC-1** — `?cibleId=` et `?cibleCollection=` filtrent sur les chemins imbriqués
  `cible.id` / `cible.collection`. `cibleCollection` n'est **délibérément pas** une
  énumération : `cible` est une carte libre, et figer la liste ferait d'un filtre légitime un
  400 le jour où le journal, lui, porterait déjà la ligne.
- **AC-2** — pagination **par curseur**, défaut 50, plafond 200 **silencieux** (un refus
  obligerait le client à connaître le plafond pour ne pas casser ; un plafond ignoré rendrait
  le journal entier, c'est-à-dire le défaut que la story ferme).
- **AC-3** — `?depuis=` / `?jusqua=`, **bornes incluses**, en UTC.
- **AC-4** — la réponse devient `{ evenements, curseurSuivant }`.
- **AC-5** — les trois contraintes chronologiques passent par un **`$and` explicite**.
- **Index** — `_id` complète l'index de tri ; un second index sert le filtre par cible.

### ⚡⚡ Ce qui portait la story — le curseur ne pouvait pas être une date

Deux événements écrits dans la **même milliseconde** sont ex æquo. Un curseur réduit à
`createdAt` devrait choisir entre les **sauter** (`$lt`) et les **répéter** (`$lte`), et le
défaut **ne se voit qu'en pagination** — jamais sur une lecture unique. Mesuré sur la stack
docker, 260 lignes et 51 grappes d'ex æquo, départage retiré : **77 documents perdus sur 260**
à `limite=7`, en réponses 200, sans le moindre signal. C'est la reprise exacte du défaut fiché
en STORY-187 (55 documents sautés sur 181).

L'index porte la même clé de queue. Sans elle, le tri ne serait plus servi par l'index :
Mongo ajouterait une étape `SORT` **en mémoire**, plafonnée à 32 Mo — la requête n'échouerait
qu'une fois le journal gros, c'est-à-dire exactement dans le cas que la story vient traiter.

**Et `jusqua=2025-12-31` n'est pas minuit.** Pris au pied de la lettre, il aurait fait
disparaître **toute la journée du 31**, en rendant 200 et une liste plausible. « Bornes
incluses » n'aurait été vrai que de la borne basse.

### ⚡⚡ Revue de code — un curseur de FORME valide rendait 500

**① Bloquant.** `MOTIF_CURSEUR` ne contrôlait que des **chiffres** :
`?avant=2025-13-45T99:99:99.999Z_<24 hex>` le traversait, `new Date()` en faisait une
`Invalid Date`, et Mongo cassait au cast — le filtre global rend alors **500** (son filet de
`CastError` est restreint à `kind === 'ObjectId'`). Donc **500 sur une saisie client**, là où
un curseur tronqué rend 400. Reproduit sur la stack docker avant correctif. Variante de même
racine : `2025-02-30T…` n'était pas invalide mais **absorbé** en 2025-03-02 (piège fiché en
STORY-395) — le curseur repositionnait alors silencieusement la page.

⛔ **Ni les unitaires ni les e2e ne pouvaient l'atteindre** : ils **mockent le dépôt**, donc le
cast n'a jamais lieu. Et la vérif docker n'avait exercé que des curseurs **bien formés** — la
forme qu'on produit soi-même n'est jamais la forme qui casse.

C'était exactement le mode de panne qu'`estInstantIso` ferme sur les bornes de fenêtre : le
contrôle existait, il n'avait simplement pas été appliqué à la moitié date du curseur.

**② Non-bloquant.** Les formes ISO **réduites** `2025` et `2025-06` étaient acceptées et lues
au **premier instant** de la période, la règle du jour entier ne s'y appliquant pas :
`jusqua=2025` refermait la fenêtre sur le 1ᵉʳ janvier, `jusqua=2025-06` perdait tout le mois de
juin. Refusées plutôt qu'étendues — inventer une arithmétique de fin de mois pour deux formes
que personne n'écrit coûte plus que ça ne rapporte.

### ⚡ Revue de sécurité — aucun bloquant, une justification fausse corrigée

Injection d'opérateur fermée sur les **six** paramètres (400 avant tout accès base, y compris
`__proto__` et les paramètres répétés) · plafond de page inviolable (`1e20`, `0x1000`,
`201e0`, `+201` → 200 ; `-5`, `NaN`, `Infinity`, tableau → 400) · le curseur ne peut pas sortir
du dossier, `DossierScopedRepository.scope()` fusionnant `{tenantId}` puis `{dossierId}` **en
dernier, au premier niveau**, hors du `$and` · les nouveaux 400 ne sont **pas** un oracle
d'énumération, les guards statuant **avant** les pipes : un dossier d'une autre organisation
rend 404 sans jamais atteindre le DTO.

⚠️ **Un durcissement retenu, et il portait sur une PHRASE.** Le JSDoc de `cibleId` attribuait
la fermeture de `?cibleId[$ne]=x` à `@IsString()`. C'est **faux** sous
`enableImplicitConversion` (l'option de `main.ts`) : class-transformer convertit l'objet en la
**chaîne** `'[object Object]'`, qui traverse `@IsString()` sans broncher et n'échoue que sur le
**charset**. Vérifié en exécutant le DTO. La porte est fermée aujourd'hui ; le risque était
qu'un élargissement futur du motif (« `cible` est une carte libre, ouvrons-le ») s'appuie sur
une garantie inexistante.

### Vérification

Lint 0 warning · build OK · **1 617 unitaires + 439 e2e verts** · couverture
**98,8 / 93,97 / 98,74 / 98,82** (module `audit` à 100 % partout) · **12 mutations rouges par
assertion**, aucune par erreur de compilation — le contrôle a été mécanique : trois premières
mutations rouges **par erreur de compilation** (variable devenue inutilisée, import orphelin)
ont été **réécrites** pour compiler avant d'être comptées.

⚠️ **Une exécution complète des e2e a montré le flake connu** (une suite tombe sur un refus
d'auth, fiche `flake-e2e-bilan-service`) ; réexécution intégralement verte, et
`bilan-audit.e2e-spec.ts` passe 32/32 en isolation.

**Vérification docker sur la route réelle** — stack `docker compose`, **JWT réel de l'IdP**
(inscription, vérification d'e-mail par le lien de Mailhog, connexion), read-models semés,
10 puis 260 événements dont 51 grappes d'ex æquo :

| critère | mesure |
|---|---|
| AC-2 | 260 lignes en 38 pages à `limite=7`, et en 6 pages à `limite=50` — **0 doublon, 0 sauté**, ordre identique à la base |
| AC-2 | `limite=1000` rend **200** lignes sans erreur ; sans `limite`, 50 |
| AC-3 | les deux événements posés **exactement** sur les bornes sont rendus ; fenêtre inversée ⇒ liste vide, jamais une erreur |
| AC-1 / AC-5 | `type` ET `cible` ET fenêtre ⇒ 2 lignes ; une combinaison sans intersection ⇒ **0** (un OU en rendrait 6) |
| plan | cas nominal `LIMIT ← FETCH ← IXSCAN`, **aucune étape SORT bloquante**, 51 clés pour 51 lignes ; avec curseur, `SORT_MERGE` de **deux IXSCAN du même index** — une fusion de parcours déjà triés, bornée, pas un tri en mémoire |
| index | l'index de cible fait tomber `?cibleId=` de **260 clés examinées à 3** |
| revue | les 4 entrées corrigées en revue rendent **400** (dont celle qui rendait 500) |

⚠️⚠️ **La vérification a été prouvée NON-VACANTE** : rejouée sur le code **muté** (départage
des ex æquo retiré), elle échoue en perdant 77 documents sur 260. Une vérification qui ne
tombe pas sur le code bugué ne prouve rien — celle-ci discrimine.

⚠️ L'ancien index `{tenantId, dossierId, createdAt:-1}` **reste en base** : Mongoose crée le
nouveau et ne supprime jamais l'ancien (piège fiché en STORY-357), et `DossiersMigrationService`
ne traite que les index **uniques** remplacés par STORY-357. Sans effet sur la justesse — le
planificateur choisit le meilleur, mesuré — mais c'est une ligne de ménage pour la migration de
production, différée par convention de projet.
