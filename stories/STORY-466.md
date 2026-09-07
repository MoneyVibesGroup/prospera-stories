# STORY-466 : La duplication d'un jeu d'hypothèses n'existe pas côté serveur — alors qu'elle est le geste central de la comparaison de scénarios

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en écrivant les critères d'acceptation de FE-035, dont l'AC-3 exige « créer / lister / éditer / dupliquer ».

---

## Le fait

Comparer deux scénarios (FR-021) suppose deux jeux d'hypothèses **proches** : on part du prudent, on
ouvre deux ou trois curseurs, on nomme « optimiste ». C'est le geste que FE-035 doit offrir, et que
`FE-035 AC-3` exige explicitement.

Le contrôleur ne l'offre pas. Le front ne peut donc que faire un **`POST` complet** avec les mêmes
paramètres, ce qui :

1. **recapture le dernier snapshot** au lieu de reprendre la base de l'original (**STORY-465**) — les
   deux jeux peuvent finir sur deux bases différentes sans que personne ne le demande ;
2. **perd l'origine** : rien ne relie la copie à son modèle, alors que c'est la seule information qui
   rend une comparaison lisible (« optimiste = prudent + 10 points de croissance ») ;
3. n'est pas transactionnel si la copie doit aussi reprendre l'historique.

## Critères d'acceptation

- [x] AC-1 — `POST /dossiers/:dossierId/bilan/hypotheses/:id/dupliquer` avec `{ nom }` — copie les
      paramètres **et la `base` de l'original**, sans relire `snapshots.dernier`.
- [x] AC-2 — La copie démarre à `version: 1` avec un historique vide : c'est un jeu neuf, pas une
      branche. L'origine est tracée par `duplicateDe: jeuHypothesesId`.
- [x] AC-3 — `409 HYPOTHESES_EXISTE` si le nom est pris, `404` si l'original est introuvable ou d'un
      autre dossier (anti-énumération).
- [x] AC-4 — La comparaison (STORY-071) peut s'appuyer sur `duplicateDe` pour rendre l'écart lisible.

## Conséquences ailleurs

- Sans cette route, l'AC-3 de **FE-035** est livrable côté front mais **fausse dans son effet** : la
  maquette le montre et le déclare.

## Décisions de cadrage (2026-09-07)

- **D-466-1 — `duplicateDe` est publié sur la réponse du jeu ET sur le scénario de
  comparaison.** L'AC-4 dit « peut s'appuyer sur » : un champ qui n'atteint pas la
  comparaison rendrait l'AC aspirationnel. La comparaison ne **calcule** rien de neuf à
  partir de ce champ — les écarts restent exactement ceux de STORY-071 ; elle le
  **transporte**, ce qui permet à l'écran d'écrire « optimiste = copie de prudent ».
- **D-466-2 — rôles alignés sur la CRÉATION (`TENANT_ADMIN` + `TENANT_USER`)**, et non sur
  `rebaser` / `supprimer`, réservés à l'admin. Dupliquer ne détruit rien, ne déplace rien et
  ne touche aucun jeu existant : le geste est un `POST` de plus, avec la base de l'original.
- **D-466-3 — 201 Created**, contrairement au 200 explicite de `rebaser` : ici une ressource
  est bel et bien créée, et le client en reçoit l'identifiant.
- **D-466-4 — aucune transaction, et c'est une conséquence d'AC-2.** Le point 3 du « fait »
  ne vaut que si la copie reprend l'historique ; AC-2 tranche l'inverse (version 1,
  historique vide). Un seul document est écrit — ouvrir une session serait une cérémonie
  sans objet.
- **D-466-5 — `duplicateDe` peut désigner un jeu supprimé depuis** (STORY-464 a ouvert la
  suppression). L'identifiant est conservé tel quel, sans nettoyage ni cascade : c'est une
  **trace d'origine**, pas une clé étrangère. Même parti que le `conflitAvec: null` de
  STORY-464, qui préfère dire honnêtement qu'il ne désigne plus personne.

### Hors périmètre (explicite)

- Dupliquer **l'historique** de versions de l'original (AC-2 dit le contraire).
- Dupliquer **vers un autre dossier** : le repository est dossier-scopé, l'original et la
  copie vivent dans le même dossier, et rien dans FE-035 ne demande autre chose.
- Faire **calculer** quoi que ce soit à la comparaison à partir de `duplicateDe` (D-466-1).

---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-07. PR `bilan-service` #96 rebase-mergée sur `dev`.

### Livré

| Fichier | Ce qui change |
|---|---|
| `hypotheses.schema.ts` | champ `duplicateDe?: Types.ObjectId`, optionnel et sans cascade |
| `dto/dupliquer-hypotheses.dto.ts` | corps `{ nom }` — **aucun** champ `hypotheses` |
| `hypotheses.service.ts` | `dupliquer(id, nom)` — base **reportée**, `version: 1`, copie profonde |
| `hypotheses.controller.ts` | `POST …/:id/dupliquer`, 201, `TENANT_ADMIN` + `TENANT_USER` |
| `dto/hypotheses-response.dto.ts` | `duplicateDe` publié, `nullable`, jamais absent |
| `projection/comparaison.{types,service}.ts` + son DTO | `duplicateDe` **transporté** jusqu'au scénario (AC-4) |

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 erreur, 0 avertissement |
| Build | `nest build` OK |
| Unitaires + couverture | **2 094 tests verts**, seuils tenus — 98,89 % lignes / 94,62 % branches (planchers 90/65) |
| E2E | **599 tests verts** (`--runInBand`), dont 10 neufs sur la duplication |

### Table de mutations — 9 mutations, 9 rouges

| # | Mutation | Verdict |
|---|---|---|
| M1 | la `base` est **relue** au dernier snapshot au lieu d'être reportée (le défaut même de la story) | ROUGE |
| M2 | `version: 1` → version de l'original (la copie devient une branche) | ROUGE |
| M3 | `duplicateDe` retiré de l'écriture | ROUGE |
| M4 | copie profonde retirée (les deux documents partagent leurs tableaux) | ROUGE |
| M5 | normalisation retirée (un échéancier `null` hérité se recopie) | ROUGE |
| M6 | garde 404 retirée (lecture directe du dépôt) | ROUGE |
| M7 | `duplicateDe` absent de la projection de réponse | ROUGE |
| M8 | la comparaison publie toujours `null` | ROUGE |
| M9 | bornes du nom divergentes sur le DTO de duplication | ROUGE |

⚠️ **M8 a été écrite parce que rien ne la gardait.** Le champ traverse la comparaison par une
projection **identité** (`ComparaisonResponseDto.from` rend son entrée telle quelle) : rien n'aurait
signalé qu'il n'y arrivait pas. La batterie du contrôleur de comparaison n'assertait que
`modeleVersion` et `baseHomogene`.

⚠️ **M9 garde un point de recopie, pas une règle.** Le triplet
`@IsString() @Length(1, 64) @Matches(/\S/)` est désormais recopié **trois fois** (créer, renommer,
dupliquer) sur la même colonne sous le même index unique. `noms-jeu-hypotheses.spec.ts` rejoue onze
noms sur les trois DTO et exige d'eux le **même** verdict. ⚠️ Les `*.dto.ts` étant hors
`collectCoverageFrom`, aucune couverture ne regardait ces fichiers.

### Vérification docker (stack réelle, données réelles)

Stack `mongo + kafka + redis + bilan-service + auth-service`, base `bilan_service` portant les
**21 jeux** de la vérification de STORY-465, dont **10 périmés** sur la version 1 d'une liasse
aujourd'hui en version 3.

| Mesure | Résultat |
|---|---|
| ⚡⚡ **AC-1 — la divergence, mesurée** | Duplication de `v460-tardif` (base v1) → la copie garde **`base.version = 1`**, même `snapshotId`. Le **`POST` complet** que le front faisait faute de route, joué sur les **mêmes** paramètres, capture **`base.version = 3`**. Deux scénarios « identiques à un curseur près » reposaient sur **deux bases différentes**. |
| AC-1 en base | `base` de la copie identique **à l'octet** à celle de l'original (`JSON.stringify` comparés), `hypotheses` idem, `tenantId`/`dossierId` hérités du contexte. |
| ⚡ **AC-2 — pas une branche** | Copie de `v459-amort` (**version 4, 3 lignes d'historique**) → copie en **version 1** avec **0** ligne dans `versions_hypotheses`, et l'original conserve ses **3**. |
| AC-2 | `duplicateDe` persisté en **`ObjectId`** (pas en chaîne), pointant l'original. |
| AC-3 | nom pris → **409 `HYPOTHESES_EXISTE`** avec `details.conflitAvec` nommant le jeu ; **aucun** document créé (toujours exactement 1 porteur du nom). |
| AC-3 | original inconnu → **404**. Original d'un **autre dossier du même cabinet** → **404** lui aussi, et rien d'écrit — l'anti-énumération inter-dossier est structurelle (dépôt dossier-scopé). |
| AC-3 | corps `{}`, `{"nom":""}`, `{"nom":"   "}` → **400**. |
| ⚡ **AC-4 — sur données réelles** | `GET …/previsionnel/comparaison?ids=v459-amort,v466-copie-de-amort` → le second scénario publie `duplicateDe` = l'id du premier, écarts à **0** : le cas exact que la story rend lisible. |
| **Rétro-compatibilité** | Les **21 jeux antérieurs** se relisent sans erreur et publient `duplicateDe: null` — aucun n'a le champ en base. |
| **D-466-5** | L'original d'une copie a été **supprimé** (204) : la copie se relit toujours, `duplicateDe` désigne un jeu qui n'existe plus. Trace d'origine, pas clé étrangère — conforme. |

⚠️ **Écriture non-lecture assumée** : le mot de passe du compte de vérification
`verif458@cabinet.tg` a été réinitialisé pour obtenir un jeton, comme lors de STORY-460. Aucun autre
document existant n'a été modifié ; les jeux créés pour la mesure portent le préfixe `v466-`.

⚠️ **D-466-2 (un `TENANT_USER` peut dupliquer) est prouvé en e2e, pas en docker** : l'organisation de
vérification ne compte qu'un seul membre, et lui en fabriquer un second aurait touché les
read-models d'identité, hors périmètre. L'e2e traverse la **vraie** chaîne de guards (`RolesGuard`
compris) avec un jeton `TENANT_USER` et obtient **201**, là où `rebaser` et `supprimer` rendent 403.

### ⚠️ Rouge intermittent PRÉEXISTANT de la suite e2e — hors périmètre

La suite e2e complète échoue par intermittence, **et déjà sur `dev` sans cette story** : mesuré
**1 échec sur 7 passes** sur `dev` seul, **3 sur 7** avec la branche, **y compris quand le bloc e2e
neuf est désactivé** — ce n'est donc pas lui qui déclenche. Le test fautif **change à chaque fois**
(`bilan-jeu-etats`, `bilan-comparaison`, `mapping-overrides`, `bilan-dossier-scope`) et la signature
est toujours la même : **401 `Unauthorized`** ou 404 là où la requête devrait passer, c'est-à-dire la
fixture RS256/JWKS locale qui ne répond plus — exactement le diagnostic posé en STORY-465 (« un 401
généralisé se diagnostique côté **émetteur de clés**, pas côté jeton »). **À traiter par une story
dédiée** : c'est un défaut de l'outillage de test, pas du code de celle-ci.

### Revue de code — 6 constats, aucun bloquant, tous corrigés

1. ⚡⚡ **La batterie d'accord des trois DTO de nom CERTIFIAIT UNE RÈGLE QUE L'APPLICATION
   N'APPLIQUE PAS.** `plainToInstance` y tournait **sans les options du `ValidationPipe` de
   production** — `main.ts` monte le pipe en `transform: true` +
   `transformOptions: { enableImplicitConversion: true }`. La batterie affirmait donc que les
   trois écrivains refusent un `nom` numérique. **Vérifié contre le service réel en docker** :
   `POST …/dupliquer` avec `{"nom": 42}` rend **201** et crée un jeu nommé `"42"` ; `PATCH`
   renomme de la même façon. La coercition vaut aussi pour un booléen (`"true"`) et pour un
   objet (`"[object Object]"`).

   ⛔ **Le défaut est PRÉEXISTANT** — `creer` et `renommer` le partagent depuis toujours — donc
   le durcir déborderait STORY-466 : c'est une story dédiée sur les **trois** écrivains à la
   fois. La correction retenue est de rendre la batterie **honnête** : options de production
   passées, et les trois cas de coercition écrits pour ce qu'ils sont, avec la raison. Elle
   cassera le jour où le durcissement ne sera appliqué qu'à deux écrivains sur trois — ce qui
   est exactement son office.

2. ⚡⚡ **`expect(jeu.version).toBe(1)` était TAUTOLOGIQUE.** Le faux dépôt rendait
   `version: 1` **en dur**, quoi que le service ait demandé d'écrire. Muter le service en
   `version: original.version` — c'est-à-dire faire de la copie une **branche**, le défaut que
   l'AC-2 interdit — laissait cette assertion **VERTE** ; seule sa sœur
   `toHaveBeenCalledWith` virait au rouge. Le faux dépôt renvoie désormais ce qu'on lui a
   demandé d'écrire. Mutation rejouée **en neutralisant la sœur** : rouge.

3. ⚡⚡ **Le saut service → DTO → corps HTTP de `duplicateDe` n'était gardé par RIEN.**
   `ComparaisonResponseDto.from` est une **projection identité** : rien n'aurait signalé que
   le champ n'arrivait pas au client. La batterie du contrôleur de comparaison n'assertait que
   `modeleVersion` et `baseHomogene`, et l'e2e de comparaison ne lit pas le champ. Blanchir
   `duplicateDe` dans la projection laissait les 4 essais **verts**. Assertion ajoutée,
   mutation **M10 rouge**.

4. Le docstring de STORY-464 s'était retrouvé **au-dessus du `describe` de STORY-466** :
   l'insertion l'avait séparé de son bloc, qui se retrouvait sans documentation. Même famille
   qu'un constat de STORY-464 et de STORY-465, deux fichiers plus loin.

5. Un renvoi de docstring vers `noms-hypotheses.spec.ts` — le fichier s'appelle
   `src/modules/bilan/dto/noms-jeu-hypotheses.spec.ts`. Un lecteur cherchant « la batterie
   dédiée » annoncée ne la trouvait pas.

6. Un paramètre à **valeur par défaut qu'aucun appelant ne passe** dans le helper e2e
   (`attendu = 201`) — la flexibilité inatteignable que le dépôt a lui-même retirée dans
   `echeancier.ts`. Retiré. Au passage, le titre « → 400, **et rien n'est créé** » est
   désormais **mesuré** (comptage de la liste avant/après), pas seulement promis.

**Seconde lentille (over-engineering)** : le code livré est sobre — `structuredClone` plutôt
qu'un copieur maison, le 409 et le 404 réutilisés de `creer`, aucune abstraction neuve. Une
seule redondance retirée : `expect('duplicateDe' in res).toBe(true)` à côté d'un
`toBeNull()`, qui refuse déjà l'absence.

**Mutations rejouées après correctifs : 9 + 2 = 11, toutes rouges.**

### Revue de sécurité — 0 vulnérabilité

Onze axes instruits et clos. Les plus utiles, avec ce qui a été **mesuré sur la stack** et non
seulement lu :

- **Forcer la `base`** — un corps portant `base: {…snapshot version 3…}` rend **400** :
  `forbidNonWhitelisted` refuse tout champ hors `nom`. Idem pour un corps portant `tenantId`,
  `dossierId`, `duplicateDe` ou `version`. Le `DossierScopedRepository.create` **force** de
  toute façon `tenantId` et `dossierId` depuis le contexte, l'ordre du spread étant
  load-bearing.
- **Injection NoSQL** — `{"nom": {"$ne": null}}` **ne devient jamais un opérateur** : la
  coercition le transforme en la chaîne `"[object Object]"` avant que `@IsString()` ne
  regarde, et le seul filtre Mongo qui reçoit une valeur d'appelant (`findOne({ nom })` du
  409) est réduit par le `scope()` à `{nom, tenantId, dossierId}`.
- **Élévation de privilège par `TENANT_USER`** (la route lui est ouverte, contrairement à
  `rebaser` et `supprimer`) : la duplication n'écrit **rien** sur l'original, ne crée aucune
  version, et la `base` copiée vient d'un document **déjà chargé sous le double scope** — elle
  ne peut donc désigner ni un snapshot ni une liasse d'un autre dossier. Un `TENANT_USER`
  pouvait déjà créer un jeu par `POST` : aucun privilège net gagné.
- **Anti-énumération du 409** — l'`E11000` ne peut venir que de l'index
  `(tenantId, dossierId, nom)`, donc le jeu nommé dans `details.conflitAvec` est
  **nécessairement** dans le dossier de l'appelant, qui peut déjà le lister. Structurel, pas
  ajouté.
- **`structuredClone` sur un chemin `Mixed`** — pas de prototype pollution : le clonage
  structuré crée les propriétés par `CreateDataProperty`, jamais par affectation.
- **404 inter-dossier mesuré** : dupliquer un original du dossier A depuis l'URL du dossier B
  du **même cabinet** rend **404**, et rien n'est écrit.
