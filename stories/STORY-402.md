# STORY-402 : Les comptes de trésorerie sont restés ORG-KEYÉS — « une org = une société » recâblé par la porte de derrière

Status: done

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir, comme STORY-401 dans EPIC-011/012*
**Service :** `balance-service` (`:3007`) — `modules/tresorerie`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high
**Origine :** relevée le **2026-08-25** en instruisant **FE-049** (rapprochement bancaire) —
c'est-à-dire en cherchant, contrôleur par contrôleur, ce qui était réellement actionnable.

---

## Le fait, relevé à la source

Trois contrôleurs, deux portées, et elles ne s'accordent pas :

```ts
// rapprochement.controller.ts       ✅ scopé au dossier
@Controller({ path: 'dossiers/:dossierId/rapprochement', version: '1' })

// comptes-tresorerie.controller.ts  ⛔ scopé à l'ORGANISATION
@Controller({ path: 'tresorerie/comptes', version: '1' })

// releves.controller.ts             ⛔ scopé à l'ORGANISATION
@Controller({ path: 'tresorerie/:compteId/releves', version: '1' })
```

⛔ **On rapproche dans un dossier des relevés qui n'appartiennent à aucun dossier.**

---

## Ce que ça coûte, concrètement

Un compte bancaire appartient à une **société**, jamais à un cabinet. Tel quel, un cabinet de
vingt clients voit **une seule liste** de comptes bancaires : ceux de la boulangerie, du garage et
de la pharmacie, mélangés, sous le nom du dossier ouvert.

⚡ **C'est le risque n°2 dans sa forme la plus pure** — celui que tout le bloc FE-EPIC-008 a
démonté, réinstallé **par la porte de derrière** : aucune erreur, aucun symptôme, des chiffres
plausibles. Et le rapprochement bancaire est précisément l'écran où une confusion de périmètre
produit des **appariements faux** plutôt qu'un simple affichage trompeur.

⛔ **Non contournable côté client, et c'est ce qui distingue cette story des précédentes.** Les
contournements de FE-030, FE-043 ou FE-044 étaient pauvres mais possibles. Ici, le DTO de compte
**ne publie aucun `dossierId`** : le front ne peut ni filtrer, ni avertir, ni même *savoir* qu'il
affiche les comptes d'un autre client. Il n'y a rien à dégrader — il n'y a rien à lire.

⇒ **Conséquence pour FE-049 : la story frontend n'est PAS entièrement actionnable.** Le volet
« relevés » attend celle-ci. Le volet rapprochement proprement dit (`dossiers/:id/rapprochement`)
l'est, lui, dès aujourd'hui.

---

## Périmètre

**Inclus**

- Les deux familles passent sous `dossiers/:dossierId/…` :
  `dossiers/:dossierId/tresorerie/comptes` et `dossiers/:dossierId/tresorerie/:compteId/releves`.
- `DossierGate` (celui de STORY-357) appliqué aux deux, avec les mêmes refus que le reste du
  service — `DOSSIER_INTROUVABLE`, `DOSSIER_ARCHIVE` sur les écritures seules (D9).
- `dossierId` **publié au contrat** sur le DTO de compte et sur celui de relevé : sans lui,
  aucun client ne peut vérifier ce qu'il affiche, et l'écart se reproduirait silencieusement au
  prochain écran.
- **Migration des documents existants.** ⚠️ C'est la moitié qui coûte, et elle n'est pas
  mécanique : un compte bancaire déjà saisi n'a **pas** de dossier, et rien dans la donnée ne dit
  lequel choisir. Une org à **un seul** dossier se migre sans ambiguïté ; une org à plusieurs
  demande un arbitrage — à trancher à la conception, et à **écrire**, jamais à deviner en script.
- L'index d'unicité suit la nouvelle clé.
- ⚡ **La garde d'exercice clos de l'import**, qui est le dégât CONCRET de cette portée et qui
  s'est révélé en instruisant la maquette FE-049 : `releves.service.ts` ne connaît pas de dossier,
  il résout donc « Mon cabinet » et retombe sur l'`orgId` s'il ne le trouve pas
  (`const dossierId = dossierCabinet ?? orgId;`). ⇒ **un relevé s'importe dans un exercice CLOS du
  client**, alors que le pointage (dossier-scopé, lui) le refuse en `EXERCICE_CLOS`. Deux gardes
  du même service disent le contraire l'une de l'autre sur la même période, et c'est la
  permissive qui écrit. Le re-scopage la referme mécaniquement — **à condition qu'un test le
  prouve**, sans quoi rien ne dira qu'elle a jamais été ouverte.

**Hors périmètre**

- `profil-societe` et `profil-societe/ocr`, org-keyés eux aussi et **explicitement exclus de
  STORY-236**. Ils ont leur propre séquence (elle conditionne FE-040/041/042) et les mélanger ici
  ferait une story dont on ne saurait pas dire si elle est finie.
- `balances/suggest-comptes` et `referentiels` : org-keyés **à juste titre** — ils lisent le
  référentiel du **cabinet**, aucune donnée de dossier n'y transite. Vérifié avant de les écarter,
  pour ne pas fabriquer un faux positif de plus dans cette liste.

---

## Conception — les trois décisions écrites avant d'être codées

### D-402-1 · Règle de migration des documents existants (AC-5)

**Cible : le dossier « Mon cabinet »** (`estLeCabinet: true`) de l'organisation, pour
`comptes_tresorerie` — exactement le rattachement que **STORY-356** a appliqué aux 7 autres
collections du service.

⚡ **Ce n'est pas un arbitrage, c'est la mise en base de ce que le code résolvait DÉJÀ à chaque
appel.** `comptes-tresorerie.service.ts` et `releves.service.ts` font tous deux
`resoudreDossierIdCabinet(orgId) ?? orgId` : le dossier lu aujourd'hui pour la ventilation et pour
la garde d'exercice **est** le cabinet. Rattacher au cabinet ne change donc **aucun comportement
observé** — cela fige une résolution qui était refaite à chaque requête, et qui retombait
silencieusement sur l'`orgId` quand elle échouait.

**Org à plusieurs dossiers — la réponse explicite que l'AC-5 exige : on ne devine pas, et on ne
demande pas non plus.** Rien, dans un compte saisi avant cette story, ne dit de quel client il
est : ni le libellé (libre), ni le compte comptable (`521` est une racine partagée), ni l'auteur.
Choisir « le seul dossier actif » ou « le plus récent » **fabriquerait une provenance** — la
faute exacte que STORY-370 interdit ailleurs dans ce service. Le cabinet est le seul rattachement
que la donnée justifie.

⛔ **Conséquence assumée, à annoncer au cabinet** : un compte bancaire du client X saisi avant
cette story apparaît sous « Mon cabinet », **pas** sous le dossier de X. Le geste de reprise est
de le **re-déclarer** dans le dossier du client puis d'y **ré-importer** ses relevés — l'empreinte
anti-doublon étant portée par `(dossier, compte, checksum)`, le ré-import n'a rien à dédupliquer
contre l'ancien compte. Aucune route de ré-affectation n'est ouverte ici : elle relève de
STORY-407 (retrait d'un relevé), qui n'existe pas encore.

⚠️ **Les lignes de relevé ne se résolvent JAMAIS par leur `orgId`** : `lignes_releve.dossierId`
est celui **de leur compte** (`compteTresorerieId`), jamais celui du cabinet résolu à part. Les
deux donnent aujourd'hui le même résultat — et c'est précisément pourquoi il faut écrire lequel
fait foi : une ligne dont le dossier divergerait de son compte serait **invisible depuis le
dossier qui l'a importée tout en restant comptée dans ses totaux**, soit le mode de panne muet que
cette story ferme.

**Zéro orphelin, sinon sortie en erreur** — même discipline que STORY-356 : `dossierId` n'est
rendu `required` qu'une fois la migration convergée.

### D-402-2 · L'index unique obsolète se supprime NOMMÉMENT

⚠️ **Mongoose crée les nouveaux index et ne supprime JAMAIS les anciens** (leçon STORY-357).
`comptes_tresorerie` porte aujourd'hui `{orgId, libelle}` **unique**. Laissé en place à côté du
nouveau `{dossierId, libelle}`, il refuse en `E11000` que deux dossiers du même cabinet déclarent
chacun « BOA — compte courant » : **exactement la collision que cette story vient corriger**, mais
sans plus aucune ligne de code applicative pour la nommer — le symptôme serait un 409
« libellé existant » sur un libellé que le dossier n'a jamais utilisé. La migration le **drop**
explicitement, et la vérification docker l'observe sur `db.comptes_tresorerie.getIndexes()`.

Même geste pour `lignes_releve` : `{orgId, compteTresorerieId, checksumLigne}` →
`{dossierId, compteTresorerieId, checksumLigne}`. Celui-là n'est pas nuisible (un compte
n'appartient qu'à un dossier, les deux clés sont équivalentes en effet), mais le laisser ferait
mentir l'invariant « aucun index d'unicité de ce service ne reste préfixé `orgId` » que
STORY-236 a posé et gardé par un test.

### D-402-3 · Ce que ce re-scopage NE ferme PAS — hooks inertes nommés

- `RelevesRepository.listerParOrg` (écarts demandés **sans** `compteId`) et
  `trouverUneParOrg` (qualification d'un écart par `ligneId` seul) restent **org-larges** : ce
  sont deux lectures du module `rapprochement`, et elles sont le périmètre nommé de **STORY-411**.
  Elles survivent délibérément à ce re-scopage — le commentaire de code le dit, pour que la
  prochaine lecture ne les prenne pas pour un oubli.
- L'index `{orgId, lignesReleve}` **unique partiel** d'`appariements` reste préfixé `orgId`. Sa
  justification d'origine tombe (les relevés cessent d'être visibles depuis tous les dossiers du
  cabinet) mais la contrainte reste **strictement plus forte** que son équivalent dossier-keyé :
  la relâcher n'apporterait rien et rouvrirait la porte au même mouvement bancaire justifiant deux
  comptabilités. Seul le **commentaire** qui la motive est corrigé — laisser une justification
  devenue fausse est ce qui fait revenir un défaut.
- `profil-societe` et `profil-societe/ocr` : hors périmètre, séquence propre (cf. *Périmètre*).

---

## Critères d'acceptation

1. Les comptes de trésorerie et leurs relevés se lisent et s'écrivent sous `dossiers/:dossierId/…`,
   et **uniquement** là.
2. Un compte créé dans le dossier A est **invisible** depuis le dossier B de la même organisation —
   un test le prouve sur deux dossiers d'un même tenant, pas sur deux tenants (le cloisonnement
   inter-organisations, lui, n'a jamais été en cause).
3. `dossierId` est publié au contrat sur les deux DTO de lecture.
4. Les deux familles répondent aux refus de dossier comme le reste du service, `DOSSIER_ARCHIVE`
   sur les écritures seules.
5. La règle de migration des documents existants est **écrite** dans la story avant d'être codée,
   et le cas « org à plusieurs dossiers » a une réponse explicite — fût-elle « on ne migre pas
   automatiquement, on demande ».

---

## Notes

- ⚠️ **Même forme que STORY-401, et le même piège d'épic** : EPIC-022 est clôturé depuis le
  2026-07-30. Cette story y atterrit **sans le rouvrir** — elle corrige une portée, elle n'ajoute
  pas de fonction.
- ⚠️ **Ce que la migration de STORY-236 n'a pas emporté** est plus large qu'on ne le croit :
  `balance`, `cahiers`, `rattachement`, `fiscal`, `exercices`, `imports`, `pieces/ocr` sont passés
  au dossier ; `tresorerie` (2 contrôleurs) et `profil-societe` (2 contrôleurs) ne le sont pas.
  ⇒ Le relevé complet vaut mieux que la découverte au coup par coup : c'est **la troisième fois**
  qu'un écran frontend découvre un survivant org-keyé en essayant de le consommer.
- ⚠️ **Deux voisines, ouvertes le même jour par la même lecture, et qui ne se recouvrent pas** :
  **STORY-411** (les écarts sans `compteId` lisent les relevés de toute l'organisation — un appel
  org-large *à l'intérieur* d'un service dossier-scopé, qui survivra à ce re-scopage s'il n'est pas
  nommément corrigé) et **STORY-407** (aucune route ne retire un relevé importé — ce qui rend
  l'erreur de compte que cette portée rend probable **définitive**).
- Consommateur nommé : **FE-049**.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée
deux fois sur l'état final**, mergée en rebase sur `dev`. Clôturée le **2026-08-28**.

**PR** : `prospera-balance-service` **#63**, 3 commits — feature (`be507bf`), revue de code
(`d4a5b73`), revue de sécurité (`a5f9a0e`). Branche `MNV-402` ouverte sur `balance-service`
**et** sur `docs`. **Un seul dépôt de code** : aucun contrat d'événement Kafka n'est touché.

### Portes de qualité

Lint **0 warning** · build OK · **3130 tests verts** (176 suites) · e2e verts ·
couverture **99,16 % stmts / 92,06 % branches / 98,61 % fonctions / 99,25 % lignes**
(seuils 65/90/90/90).

### Passe de mutation — 6 mutations, 6 rouges, toutes restaurées

| # | Mutation | Ce qui vire au rouge |
|---|---|---|
| **M1** | index unique de `comptes_tresorerie` re-préfixé `orgId` | `index-dossier.schema.spec.ts` — 2 rouges (le cas nommé **et** le filet global) |
| **M2** | la portée du dépôt de comptes retombe sur l'org seule | `tresorerie.repositories.spec.ts` — 4 rouges |
| **M2b** | `@RequiresDossierScope()` retiré du contrôleur | `dossier-scope.invariant.spec.ts` — 1 rouge |
| **M3** | la garde d'exercice clos retombe sur l'`orgId` (le repli d'avant 402) | `releves.service.spec.ts` — 2 rouges |
| **M4** | l'index obsolète n'est plus droppé par la migration | `dossiers-migration.service.spec.ts` — 1 rouge |
| **M5** | les lignes de relevé rattachées par ORG au lieu de leur COMPTE | `dossiers-migration.service.spec.ts` — 1 rouge |
| **M6b** | le contrat publie un `dossierId` **faux** (l'`orgId`) | e2e — 1 rouge (AC-3) |

⚠️ **M2 a montré une limite du harnais e2e, et elle est nommée** : muter le *dépôt* laisse
l'e2e vert, parce qu'il le double. C'est M2b — retirer le décorateur — qui met la chaîne HTTP
à l'épreuve. Deux mutations pour un même invariant, parce qu'aucune des deux seule ne le
couvre.

### Vérification docker — stack neuve (`down -v`), Mongo `rs0`, mongosh direct

Organisation `6a91…1f57`, dossiers **A = « Mon cabinet »** (`…10a1`), **B = « Boulangerie du
Port »** (`…10b2`), **archivé** (`…10c3`).

**① AC-1/AC-2 — le même libellé dans deux dossiers, et l'invisibilité croisée**

| Appel | HTTP | Code |
|---|---|---|
| `POST /dossiers/A/tresorerie/comptes` « BOA — compte courant » | **201** | `dossierId: …10a1` publié |
| `POST /dossiers/B/tresorerie/comptes` **même libellé** | **201** | `dossierId: …10b2` publié |
| idem une 2ᵉ fois **dans A** | **409** | `COMPTE_TRESORERIE_LIBELLE_EXISTANT` |
| `GET /dossiers/B/tresorerie/comptes/{idA}` | **404** | `COMPTE_TRESORERIE_INTROUVABLE` |
| `PATCH` / `DELETE` idem depuis B | **404** | `COMPTE_TRESORERIE_INTROUVABLE` (jamais 403) |

`db.comptes_tresorerie` : **2 documents**, `orgId` identique, `dossierId` distincts. Chaque
liste ne rend que son dossier.

**② AC-4 — les refus de dossier, comme le reste du service**

`dossier inconnu → 404 DOSSIER_INTROUVABLE` · `dossierId mal formé → 400 DOSSIER_ID_INVALIDE` ·
`dossier ARCHIVÉ : GET → 200` (D9) **et** `POST → 409 DOSSIER_ARCHIVE`.

**③ ⚡ La garde d'exercice clos — le dégât concret, MESURÉ des deux côtés**

Exercice 2026 **CLOS sur le dossier B**, **OUVERT sur le cabinet A**. Même appel, deux codes :

- `POST /dossiers/B/tresorerie/{compteB}/releves` → **409 `EXERCICE_CLOS`**, 0 ligne écrite ;
- `POST /dossiers/A/tresorerie/{compteA}/releves` → **201**, 2 lignes écrites, chacune portant
  `dossierId = …10a1`.

⚡ **Et le comportement d'AVANT a été rejoué sur la même stack** : le service patché pour lire
le dossier « Mon cabinet » (le `dossierCabinet ?? orgId` d'origine), **redémarré** pour ne pas
se fier au hot-reload, répond **201** au même appel sur B et **écrit 2 lignes dans l'exercice
CLOS du client**. Aucune erreur, aucun symptôme. Code restauré, service redémarré, les 2 lignes
parasites supprimées, et le 409 re-mesuré ensuite. **Le re-scopage referme la garde
mécaniquement — donc silencieusement : sans cette mesure, rien ne dirait qu'elle a jamais été
ouverte.**

**④ Atomicité (D-089-5) — prouvée sur le vrai replica set, pas sur un mock**

Index unique **temporaire de vérification** `(dossierId, compteTresorerieId, montant)`, puis
import d'un CSV de 2 lignes de **même montant** : la 2ᵉ insertion viole l'index **au milieu de
la transaction** → **409 `IMPORT_RELEVE_CONCURRENT`**, `lignes exercice 2025 = 0`, total
inchangé (**2**). **Zéro orphelin** : la 1ʳᵉ ligne n'a pas survécu. Index temporaire retiré.

**⑤ Migration `migrate:dossiers` — état PRÉ-402 rejoué, puis migré**

Semis : 1 compte **sans** `dossierId`, 3 lignes **sans** `dossierId` rattachées au compte du
**dossier B** (donc *pas* au cabinet), et les 4 index obsolètes recréés.

Rapport de la commande : `rattaches: { comptes_tresorerie: 1, lignes_releve: 3 }`,
`orphelins: { … 0 partout }`, `aDesOrphelins: false`,
`indexSupprimes: [comptes_tresorerie.orgId_1_libelle_1, comptes_tresorerie.orgId_1_actif_1,
lignes_releve.orgId_1_compteTresorerieId_1_checksumLigne_1,
lignes_releve.orgId_1_compteTresorerieId_1_date_1]`.

En base après migration : `index comptes = _id_ | dossierId_1_libelle_1 | dossierId_1_actif_1`
(les org-keyés ont disparu) · le compte orphelin porte le **dossier du cabinet** ·
⚡ **les 3 lignes legacy portent le dossier B — celui de LEUR COMPTE — et non le cabinet**, ce
qui est exactement la discrimination que D-402-1 exige · agrégat de contrôle croisé :
**0 ligne dont le `dossierId` diffère de celui de son compte**.

**2ᵉ exécution** : `rattaches` tout à 0, `indexSupprimes: []`, `aDesOrphelins: false` —
**idempotente**, comme STORY-356.

Enfin, l'index obsolète une fois droppé, `PATCH` du compte de B vers **« BOA — compte
courant »** → **200**, et les deux dossiers portent le même libellé en base. La collision que
la story corrige est bien refermée **de bout en bout**.

### ⚠️ Deux constats d'exploitation, mesurés, à ne pas perdre

1. **L'index obsolète `{orgId, libelle}` ne peut pas COEXISTER avec la donnée que la story rend
   légitime.** Tenté de le recréer alors que deux dossiers portaient déjà « BOA — compte
   courant », Mongo refuse : `E11000 … index: orgId_1_libelle_1 dup key`. C'est la
   démonstration en creux de D-402-2 : laissé en place, il n'aurait pas *toléré* la nouvelle
   donnée — il l'aurait **interdite**, avec un 409 sur un libellé que le dossier n'a jamais
   utilisé.
2. **Ordre d'exploitation en prod : la migration AVANT la construction du nouvel index.**
   `autoIndex` n'est pas désactivé dans ce service (défaut Mongoose `true`) : sur une base
   pré-402 où **tous** les `dossierId` sont absents, ils valent `null` pour l'index, et deux
   comptes de même libellé — fût-ce dans deux organisations différentes — font **échouer la
   construction** de `{dossierId, libelle}` unique. Mesuré ici (`dup key: { dossierId: null,
   libelle: "Ecobank — heritage" }`). ⚠️ **Propriété héritée de STORY-236/356**, identique sur
   `balances` et `exercices_atelier` : ce n'est pas un défaut introduit ici, et le projet
   diffère la migration de données à la prod (CLAUDE.md). Nommé pour que la séquence de
   déploiement ne se découvre pas le jour J.

---

## Revue de code — 5 constats, 5 corrigés (commit `d4a5b73`)

**① Le seul qui coûtait quelque chose : un défaut de PLAN, invisible au HTTP.** La migration
droppait `lignes_releve.orgId_1_compteTresorerieId_1_date_1`. Ce n'est **pas** un index
d'unicité — l'invariant de STORY-236 ne le vise donc pas — et c'était le **dernier index
préfixé `orgId`** de la collection, alors que `listerParOrg` reste org-large jusqu'à STORY-411.
⚡ **Mesuré des deux côtés en docker** : avec l'index, `explain()` rend `IXSCAN` sur
`orgId_1_compteTresorerieId_1_date_1` ; sans lui, **`COLLSCAN`** — un balayage multi-tenant de
la plus grosse collection du module à chaque ouverture de l'écran des écarts. Aucun test ne
pouvait le voir : les e2e doublent la couche données et les unitaires assertent la *forme* du
filtre, pas le plan. Retiré de la liste, avec la raison écrite au-dessus.

**② Une justification devenue fausse — et cette fois, activement dangereuse.**
`appariement.schema.ts` affirmait encore « les lignes de relevé vivent dans `tresorerie`, resté
org-keyed » et se terminait par une **instruction** : « à rebasculer sur `dossierId` le jour où
`tresorerie` sera lui-même re-scopé, **pas avant** ». Ce jour est arrivé — et la décision de
D-402-3 est l'**inverse** : l'index org-keyé devient redondant mais reste **strictement plus
fort**, le relâcher rouvrirait le cas qu'il ferme. La prochaine story de rapprochement aurait
suivi la phrase écrite et supprimé la seule garde empêchant qu'un même mouvement bancaire
justifie **deux comptabilités**. Corrigée là, plus dans `appariements.repository.ts`,
`dossier-scope.guard.ts`, `dossier-cabinet.resolver.ts` et `test/utils/dossier-scope.ts`.

**③ Le contrat publiait les refus métier et EFFAÇAIT les refus de dossier.** `@nestjs/swagger`
fusionne classe et méthode par un spread **au niveau du code de statut** : le `404` (ou le `409`)
déclaré sur un handler **remplace intégralement** celui posé par `@RequiresDossierScope`. Les
**sept** handlers déclarant le leur, `DOSSIER_ARCHIVE` et `DOSSIER_INTROUVABLE` — deux refus
**mesurés en vérification docker** — disparaissaient du document publié, et `gen:api` en livrait
un client qui les ignore. Fragments partagés + un bloc de garde dans
`openapi-contract.e2e-spec.ts` (patron STORY-393). ⚠️ **Dette pré-existante nommée** : une
dizaine de contrôleurs plus anciens du service ont le même trou ; la balayer relevait d'une story
propre, pas de celle-ci.

**④ Un test vacant.** `DOSSIER` et `PROFIL` valaient la **même** chaîne dans
`releves.service.spec.ts` : l'assertion « le dossierId est propagé » ne pouvait pas distinguer le
dossier du profil — deux `string` d'ObjectId lus à trois lignes d'écart dans `importer`.
Mutation **M7** (passer le profil à la place du dossier) : verte avant, rouge après.

**⑤ Un commentaire faux et un titre plus fort que ses assertions.** La phase 0 n'était pas
*contrainte* d'être première (un `$set` n'effleure aucune clé de `{orgId, libelle}`), et le test
« avant tout rattachement » n'assertait **aucun ordre**. Justification corrigée, ordre réellement
asserté via `invocationCallOrder` — puis **inversé** par la revue de sécurité (voir ci-dessous).

**Ponytail (lentille sur-ingénierie)** : index `{dossierId, exercice.debut, date}` retiré — aucun
lecteur avant STORY-411, coût d'écriture immédiat sur la plus grosse collection — et
`collectionsVerifiees()` inline (une méthode, un appelant). `net −26 lignes`. Écarté : factoriser
les deux `portee()` privées des dépôts, qui sont chacune le point de mutation de leur propre
suite.

---

## Revue de sécurité — 2 constats confirmés, 2 corrigés (commit `a5f9a0e`)

**① CWE-639 / OWASP A01 — Broken Access Control sur un chemin d'ÉCRITURE** (confiance 88).

`POST …/rapprochement/ecarts/qualifier` prend `ligneId` **dans le corps** de la requête, pas
d'une lecture déjà bornée. `trouverUneParOrg` et `marquerStatut` ne filtrant que sur
l'organisation, un appelant ouvrant les écarts du **dossier A** qualifiait la ligne du
**dossier B** du même cabinet — et **contournait deux verrous** :

- le **dossier ARCHIVÉ** : le `DossierScopeGuard` n'inspecte que le dossier de l'URL, donc un
  dossier B archivé voyait ses lignes mutées via l'URL d'un dossier A actif ;
- l'**exercice CLOS** : `exigerExerciceOuvert` l'évalue sur le dossier **A** avec les dates de la
  ligne de **B** — exactement la classe de défaut que cette story revendique de fermer côté
  import.

Et l'état de rapprochement de B — pièce justificative de clôture — devenait faux : une ligne déjà
`CONFIRME` dans B n'apparaît pas dans `lignesConfirmees(orgId, dossierId = A)`, donc le
pré-contrôle ne levait rien et le `RAPPROCHE` était écrasé en `ECARTE`.

⚡ **Et le commentaire que cette PR venait d'ajouter affirmait le contraire** : « les identifiants
arrivent d'appariements et de lectures déjà bornées ». Faux pour ce chemin — c'est précisément la
phrase qui aurait fait tenir le point pour couvert lors de STORY-411.

`trouverUneParOrg` devient `trouverUneParDossier`, `marquerStatut` prend le dossier ; tous leurs
appelants le détenaient déjà. **Mesuré sur stack docker** : qualifier depuis A une ligne de B rend
**404 `LIGNE_RELEVE_INTROUVABLE`** et n'écrit rien (`statutRapprochement` inchangé, 0
qualification) ; le **même** appel depuis B rend **200** et la qualification atterrit sous B.

**② CWE-693 / OWASP A04 — la migration laissait une fenêtre SANS aucune contrainte d'unicité**
(confiance 80).

`autoIndex` est actif : Mongoose tente de construire `{dossierId, libelle}` **unique au boot** —
quand *aucun* document ne porte encore de dossier. Tous s'indexent alors sur la clé
`(null, libelle)`, et **deux organisations ayant chacune une « Caisse » suffisent** à faire
échouer la construction, **en silence** (Nest n'écoute pas l'événement `index`). La phase 0
supprimait ensuite `{orgId, libelle}` — **le seul index d'unicité vivant**. Résultat : jusqu'au
prochain redémarrage, deux `POST` concurrents créaient deux comptes homonymes dans le même
dossier, `E11000 → 409` ne se déclenchait **jamais**, l'aiguillage des imports devenait dépendant
de l'ordre de lecture et le rapprochement cessait d'être reproductible.

⚡ **Mesuré sur un état pré-402 à deux organisations partageant le libellé « Caisse »** :
`createIndex({dossierId, libelle}, {unique})` échoue en
`dup key: { dossierId: null, libelle: "Caisse" }`.

Le drop passe **après** le rattachement (les documents portent alors leur dossier, la construction
réussit), les nouveaux index sont construits **explicitement** avant, et un index d'unicité
obsolète n'est supprimé **que si son remplaçant existe** — sinon la commande **refuse** et le dit.
Après migration sur le même état : `index comptes = _id_ | dossierId_1_actif_1 |
dossierId_1_libelle_1`, les deux « Caisse » vivent dans deux dossiers distincts, et un doublon de
libellé **dans le même dossier** est refusé en `E11000` — **le filet est vivant, il ne l'a jamais
cessé**. 2ᵉ exécution : `indexSupprimes: []`, 0 rattachement, 0 orphelin.

⚠️ **Ceci remplace le « constat d'exploitation n°2 » consigné plus haut** : ce qui y était décrit
comme une propriété héritée de STORY-236/356 à documenter est, côté trésorerie, **corrigé dans le
code** — la migration ne dépend plus de l'ordre de déploiement.

**⛔ Constat NON corrigé, et nommé** : `RelevesRepository.listerParOrg` (écarts demandés **sans**
`compteId`) reste org-large. C'est une **lecture d'écran**, périmètre explicite de **STORY-411**,
que cette PR ne rend pas *nouvellement* exploitable — l'appelant a déjà les droits de lecture sur
les autres dossiers du cabinet. La refermer ici trancherait, sans story, l'arbitrage que 411 pose
sur le caractère facultatif de `compteId`.

---

## Bilan de la passe de mutation — 12 mutations, 12 rouges

Aux 6 mutations du développement s'ajoutent **M4b** (phase 0 déplacée), **M7** (profil passé à la
place du dossier), **M8** (404 ré-effacé), **M9** (portée de `trouverUneParDossier`), **M10**
(portée de `marquerStatut`), **M11b** (garde du remplaçant rendue décorative) et **M12** (drop
remis avant le rattachement). Toutes restaurées.

⚠️ **Ce que M2 et M9 ont appris, et qui vaut pour la suite** : muter un **dépôt** laisse l'e2e
**vert**, parce qu'il le double. C'est M2b — retirer `@RequiresDossierScope()` du contrôleur — qui
met la chaîne HTTP à l'épreuve. Deux mutations pour un même invariant, parce qu'aucune des deux
seule ne le couvre.

### État final

Lint **0 warning** · build OK · **3132 unitaires + 777 e2e verts** · couverture
**99,13 / 92,04 / 98,62 / 99,23** (seuils 65/90/90/90) · **vérification docker rejouée deux fois**,
stack neuve (`down -v`) à chaque passe.
