# STORY-392 : Les pièces d'un dossier portent leur URL, mais rien ne dit quelle ligne elles justifient

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-358**
**Priorité :** Must Have
**Story Points :** 2
**Statut :** done
**Complexité :** low
**Sprint :** 20
**Service :** `document-service` (`:3006`, dépôt `prospera-ocr-service`)

> Story **jumelle de STORY-391** (`balance-service`). Celle-ci rend la pièce **retrouvable** ;
> l'autre la rend **nommable** depuis la ligne. **Aucune des deux ne produit d'écran seule.**

> ⛔ **CORRECTION DE PRÉMISSE, posée le 2026-08-26 en instruisant STORY-391.** Le constat ci-dessous
> dit que `GET /dossiers/{id}/pieces` « fait déjà PRESQUE tout : il agrège les pièces COMPTABLES ».
> C'est vrai du **code**, et c'était **faux des données** : `listerParDossier` filtre sur
> `{ orgId, dossierId }`, et `document-piece.client.ts` (`balance-service`) **ne propageait pas
> `dossierId`** au dépôt d'une pièce de cahier — alors que le chemin ne s'ouvre que sous
> `/dossiers/:dossierId/pieces/ocr`, donc que le dossier est **toujours** connu. **Aucune pièce de
> cahier n'entrait dans cette liste** : mesuré en docker, dépôt `dev` ⇒ `dossierId` absent,
> `storageKey = {org}/{lot}/{uuid}`, pièce introuvable dans la liste. Le filtre `?pieceId=` que
> cette story ajoute aurait donc filtré **un ensemble vide**. ⇒ **Corrigé par STORY-391**
> (`MNV-391`, `balance-service`) : le dépôt propage `dossierId`, la pièce est listée, son
> `urlConsultation` charge l'image depuis un navigateur. **Cette story dépend de ce correctif** —
> l'implémenter avant que `MNV-391` soit sur `dev` la rendrait verte et inopérante.
>
> ⛔ **PÉRIMÈTRE ÉLARGI — `apercuUrl` arrive ici.** STORY-391 demandait un `apercuUrl` sur
> `LignePreProposeeDto` (`balance-service`) : **non livrable dans ce dépôt-là** — `balance-service`
> n'a aucun client MinIO, l'événement `document.piece.extrait` ne porte pas de `storageKey`, et le
> garde-fou #2 de STORY-084 interdit explicitement tout re-appel HTTP à `document-service` depuis
> `lire`. **Voie C, tranchée par l'user le 2026-08-26** : l'écran de relecture d'un lot obtient son
> image par **cette** story, en appelant `GET /dossiers/{id}/pieces?pieceId=…` — la route qui signe
> **déjà**, avec le patron `PieceUrlSigner` prouvé en navigateur réel (FE-064). Rien de neuf à
> inventer côté signature ; c'est le filtre `?pieceId=` déjà au périmètre qui le sert.

---

## Le constat

`GET /dossiers/{dossierId}/pieces` (STORY-358) fait déjà **presque** tout ce qu'il faut : il
agrège les pièces de constitution **et les pièces comptables** (`CAPTURE_TRANSACTION`, `FACTURE`),
et il rend pour chacune une **`urlConsultation` présignée valable depuis un navigateur** — prouvée
en navigateur réel par FE-064.

Il manque **l'identité que balance-service connaît**. Or elle est stockée :

```ts
// document-service · schemas/piece-extraction.schema.ts
correlationId!: string;  // = lotId côté balance-service
pieceId!: string;        // = la pièce dans le lot
// index : { orgId: 1, correlationId: 1, pieceId: 1 }
```

Les deux champs sont **persistés et indexés** — mais `listerParDossier` ne les **projette pas** :

```ts
export interface PieceExtractionListee {
  _id; type; statut; storageKey; nomOrigine; deposePar; createdAt;   // ← ni pieceId, ni correlationId
}
```

et `PieceDossierResponseDto.id` est l'`_id` de **l'extraction**, une valeur que balance-service
n'a jamais vue : c'est lui qui **génère** le `pieceId` et l'envoie en champ de formulaire à
`POST /piece-extractions`.

⇒ **La jointure est impossible dans les deux sens.** L'image est *listable*, jamais *rattachable*
à la ligne de cahier qu'elle justifie. Un cabinet qui a importé 300 pièces sur l'exercice se
retrouve, pour vérifier **une** recette, à parcourir une liste de 300 vignettes à l'œil.

⚠️ **Ce n'est pas un oubli de STORY-358** : elle répondait à « quelles pièces ce dossier
porte-t-il ? », une question de niveau dossier à laquelle `pieceId` n'apportait rien. La question
« **quelle image justifie CETTE ligne ?** » n'existait pas encore — elle naît avec le cahier de
recettes, et c'est FE-043 qui l'a posée.

---

## Ce qui est demandé

1. Projeter et publier `pieceId` et `correlationId` sur `PieceDossierResponseDto` — **optionnels**,
   parce qu'une pièce de constitution (statuts, carte CFE) n'en porte pas, et que les rendre
   obligatoires forcerait une valeur inventée sur toute la famille `PROFIL`.
2. Accepter un filtre serveur `?pieceId=` (répétable) **ou** `?correlationId=` sur la route. Sans
   lui, afficher la preuve d'un mois de cahier veut dire charger **toutes** les pièces du dossier
   pour en garder quatre — le défaut exact que STORY-383 a corrigé sur `GET /activite`, et qu'on
   ne réintroduit pas ici.
3. **Rien d'autre.** Aucune écriture, aucune migration : les deux champs sont écrits depuis
   STORY-084 et déjà indexés ensemble.

## Critères d'acceptation

1. `GET /dossiers/{id}/pieces` publie `pieceId` et `correlationId` sur les pièces **comptables**,
   et les **omet** sur les pièces de constitution.
2. `?pieceId=a&pieceId=b` ne rend que ces pièces — et **une pièce d'une autre organisation ou d'un
   autre dossier n'est jamais rendue**, même si son `pieceId` est deviné (le filtre s'ajoute aux
   critères de portée, il ne les remplace pas : c'est la garde qui compte, pas le filtre).
3. Un `pieceId` inconnu rend une **liste vide**, jamais un 404 — l'anti-énumération de la maison.
4. Aucune régression sur FE-064 : l'appel sans filtre rend exactement les mêmes pièces qu'avant,
   dans le même ordre.

## Le contournement en place, et son coût

FE-043 renvoie vers l'onglet « Pièces » du dossier — non filtré. C'est vrai, et c'est presque
inutilisable dès la deuxième dizaine de pièces. Le contournement se retire quand cette story
**et** STORY-391 sont livrées.

---

## Progress Tracking

**Statut : `done`** — implémentée, vérifiée en docker, revue, sécurisée et mergée le 2026-08-26.
Deux dépôts : `prospera-ocr-service#16` (le livrable) et `prospera-balance-service#57` (la
documentation que ce livrable rend vraie), mergées **dans cet ordre**.

### La prémisse était périmée à MOITIÉ — et l'autre moitié était le vrai trou

L'énoncé disait que `listerParDossier` ne projette « ni `pieceId`, ni `correlationId` ». Vérifié à
la source : **`correlationId` est publié depuis STORY-385**. Seul `pieceId` manquait vraiment. Le
constat décrivait donc l'état d'avant — et il ne faut pas confondre : ce qui **bloquait** la paire
n'était pas là, c'était l'absence de `dossierId` au dépôt côté `balance-service`, corrigée par
STORY-391 (bandeau en tête de ce document).

### Ce qui a été livré

| | |
|---|---|
| `pieceId` | projeté et publié, **facultatif**. Une pièce de constitution n'appartient à aucun lot de cahier : publier `''` inventerait une clé de jointure. Pendant exact d'`auditOcr.pieceId` (STORY-391). |
| `?pieceId=` | **répétable**, sur la famille comptable. Le renseigner **écarte** la famille PROFIL — dit une fois dans le service, plutôt que par un `$in` silencieux sur un champ que `profil_extractions` ne porte pas. |
| `?correlationId=` | **répétable**, sur les **deux** familles. Côté balance c'est le `lotId` : **un seul** paramètre réclame les images de tout un lot, là où `pieceId` en demanderait autant que de pièces. C'est lui qui sert l'écran de relecture (voie C). |
| portée | les critères **s'ajoutent**, jamais ne remplacent. |

⚠️ **L'AC-2 de la story dit « `?pieceId=` **ou** `?correlationId=` »** ; les deux sont livrés. Ce
n'est pas un débordement : `pieceId` sert le cahier (une ligne → une image) et `correlationId` sert
la relecture d'un lot (N images en un appel) — et c'est ce second usage que la **voie C** de
STORY-391 a explicitement transféré ici en renonçant à `apercuUrl`.

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **664 / 664**, couverture
**99,15 st / 92,85 br / 98,16 fn / 99,19 li** (seuils 65/90/90/90), `modules/dossier-pieces` à
**100 %** sur les quatre colonnes · `test:e2e` **106 / 106**.

⚠️ `collectCoverageFrom` exclut `*.dto.ts` : toute la logique du filtre est **invisible aux seuils**.
C'est `lister-pieces-dossier-query.dto.spec.ts` — qui instancie le **vrai** `ValidationPipe` avec les
quatre options de `main.ts` — qui la garde, et lui seul.

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| le filtre est épandu **avant** la portée | « la portée reste en tête » | 🔴 1 |
| la famille PROFIL est interrogée malgré un `pieceId` | « écarte la famille PROFIL » | 🔴 1 |
| le filtre n'est pas transmis au dépôt des pièces | 3 tests de service | 🔴 3 |
| le contrôleur accepte le filtre et l'**ignore** | contrôleur + e2e | 🔴 2 + 3 |
| `pieceId: ''` publié **aussi** sur une pièce de constitution | service | 🔴 2 unit *(e2e vert — voir ci-dessous)* |
| `pieceId` annoncé **obligatoire** | garde OpenAPI | 🔴 1 |
| `@Transform` retiré (une valeur seule n'est plus un tableau) | DTO + e2e | 🔴 2 + 2 |
| `@Matches` retiré | DTO + e2e | 🔴 2 + 2 |
| le filtre publié en **chaîne simple** au lieu de tableau | garde OpenAPI | 🔴 1 |
| *(après revue)* `find({ orgId, dossierId, ...filtre })` | garde de recouvrement **réparée** | 🔴 1 |

🪤 **Une mutation est rouge en unitaire et VERTE en e2e**, et le test a été renommé plutôt que le
constat tu : publier `pieceId: ''` sur une pièce de constitution ne fait pas rougir l'e2e, parce que
le service y est **doublé** — le mapping n'y est jamais exercé. Ce que l'e2e garde réellement, c'est
que la clé traverse le fil telle quelle, ni ajoutée ni retirée par une couche HTTP. Le titre le dit
désormais.

### Vérification docker réelle — 2 organisations, 3 dossiers, 2026-08-26

| # | Acte | Résultat | Ce qui est prouvé |
|---|---|---|---|
| 1 | **AVANT** (`dev`) — `GET /dossiers/{d}/pieces` | 5 pièces, **0** portant `pieceId` | la jointure est impossible |
| 2 | **AVANT** — `?pieceId=<la bonne pièce>` | **les 5 reviennent** | le filtre est **accepté puis ignoré en silence** — la pire forme : le front croit avoir filtré |
| 3 | **AVANT** — `?zzz=1` | **200** | aucune validation de requête |
| 4 | **APRÈS** — sans filtre | 5 pièces, `pieceId` sur les **4** comptables, **absent** sur la pièce de constitution | **AC-1** et **AC-4** |
| 5 | **APRÈS** — `?pieceId=` (1 puis 2 valeurs) | 1 puis 2 | le filtre restreint réellement |
| 6 | **APRÈS** — `?pieceId=` d'un **autre dossier** de la même org | **0** | **AC-2**, franchissement de dossier |
| 7 | **APRÈS** — `?pieceId=` d'une **autre organisation** | **0** | **AC-2**, franchissement d'organisation |
| 8 | **APRÈS** — le **dossier** de l'autre org | **404 `DOSSIER_INTROUVABLE`** | jamais 403 — anti-énumération |
| 9 | **APRÈS** — `?pieceId=jamais-vu` | **200 `[]`** | **AC-3** |
| 10 | **APRÈS** — `?correlationId=` d'un lot de constitution | 1 pièce `CARTE_CFE`, `pieceId` absent | le critère atteint bien les **deux** familles |
| 11 | **jointure de bout en bout** | `auditOcr.pieceId` → **un seul** appel → URL présignée sur `localhost:9000` → **HTTP 200**, image **octet pour octet** | **la paire 391+392 rend enfin quelque chose de visible** |
| 12 | *(après revue)* dépôt PROFIL `correlationId=prop 2026.08` puis relecture sur la même valeur | **202** puis **200, 1 pièce** | le correctif C4 : plus aucune pièce déposée n'est infiltrable |

🪤 **Un « ✘ contenu différent » a été lu à tort à l'acte 11** : `cmp -s` rend non-zéro pour un
fichier **absent** exactement comme pour un contenu différent, et le fichier de référence avait
disparu du scratchpad entre les deux stories. Référence régénérée (le générateur est déterministe),
comparaison rejouée : identique.

### Revue de code (⑥)

Scan par `prospera-code-review`, synthèse en session. **7 constats, 7 traités** — aucun bloquant pour
le merge, tous corrigés avant.

#### ⚡⚡ C2 — une garde **invariante sous la mutation exacte** qu'elle prétendait attraper

Le test « un filtre ne peut PAS recouvrir la portée » passait `{ pieceId: ['a1'] }` — donc **jamais**
de clé de portée — et s'ancrait sur `Object.keys(requete).slice(0, 2)`. Or un épandage postérieur
**écrase la valeur en gardant la position d'insertion**. Mesuré :

```js
{ orgId: 'org-1', ...{ orgId: 'evil' } }
//  Object.keys() → ['orgId']   ⇒ assertion VERTE
//  .orgId        → 'evil'      ⇒ portée recouverte
```

Un refactor en `find({ orgId, dossierId, ...filtre })` — simplification naturelle, que rien
n'interdit puisque le type `FiltrePiecesDossier` ne porte pas les clés de portée — l'aurait laissée
**verte dans les deux dépôts**. Et le commentaire posait l'invariant faux en toutes lettres
(« l'ordre des clés est la garantie structurelle »). ⇒ les deux gardes passent désormais les clés de
portée **pour de bon** et vérifient les **valeurs** ; la mutation `...filtre` rejouée les fait
**rougir**. La vraie garantie, écrite là où elle vit : les opérandes de l'épandage sont des
**littéraux à clés codées en dur**, et `filtre` n'est lu que pour des **valeurs**.

#### ⚡ C4 — le filtre était plus étroit que la route de dépôt qu'il doit servir

`?correlationId=` appliquait aux **deux** familles l'alphabet de la seule famille comptable. Or
`POST /profil-extractions` accepte un `correlationId` en **chaîne libre** bornée à 128, et le refus
de le contraindre est une décision **écrite** du dépôt : *« Le contraindre ici refuserait des dépôts
que la route de dépôt a acceptés. »* Une pièce déposée avec `correlationId=prop 2026.08` recevait
donc **202 au dépôt et 400 à la relecture** — définitivement infiltrable. C'est **le mode de panne
que cette story dit fermer**, rouvert par l'autre porte. ⇒ `@Matches` retiré sur ce seul critère,
l'asymétrie avec `pieceId` documentée et testée **dans les deux sens**, et prouvée en docker
(acte 12).

#### C3 — le rationale nommait la mauvaise porte

Le commentaire justifiait la garde par « Express fait un **objet** d'un `?pieceId[$ne]=x` ». Ce dépôt
tourne sur **express 5**, `query parser: 'simple'` : la requête produit la **clé littérale**
`"pieceId[$ne]"`, jamais un objet — vérifié. Le 400 vient donc de `forbidNonWhitelisted`, pas de
`@IsString({ each: true })`. Le résultat était juste, l'argument faux. ⇒ nommé justement, et le
validateur **conservé** comme seconde barrière si `query parser` repassait un jour à `'extended'`.
Même famille que le constat de MNV-391 et celui de MNV-381 : *un commentaire qui affirme une
garantie que le mécanisme n'offre pas.*

#### C1 — trois promesses conditionnées, devenues fausses le jour où la condition s'est réalisée

STORY-391 avait **conditionné** trois descriptions publiées à l'arrivée de cette story. Elles
disaient au présent « la route d'en face ne publie pas ce champ et n'accepte pas encore
`?pieceId=` ». Le front génère son client depuis l'OpenAPI de `balance-service` — **la seule**
surface où il lit `auditOcr.pieceId` : il y aurait lu que le geste est impossible et serait resté sur
le contournement FE-043. ⇒ corrigé dans `prospera-balance-service#57`, mergée **après** le livrable.

#### C5, C6, C7

Le nouveau `@Query()` fait rendre **400** à tout paramètre inconnu là où la route rendait 200 — c'est
la convention maison, désormais **documentée**, avec le piège `?pieceId[]=` (sérialisation par défaut
d'axios pour un tableau, que le parseur `simple` refuse) · le bloc JSDoc de `PieceExtractionListee`,
rendu orphelin par l'insertion de `FiltrePiecesDossier`, lui est rendu · la copie privée
d'`IDENTIFIANT_OPAQUE` de `rattacher-dossier-correlation` est remplacée par l'import de la source
exportée — deux routes qui désignent le **même** lot ne peuvent plus diverger en silence.

#### Constat ponytail écarté

La lentille over-engineering proposait de factoriser les deux piles de décorateurs jumelles
(`applyDecorators`, −18 lignes). **Écarté** : le correctif C4 rend les deux critères légitimement
différents, et factoriser aurait **masqué l'asymétrie qu'on venait de découvrir**.

### Revue de sécurité (⑦)

Scan par `prospera-security-review` (`opus`, aucun downgrade), synthèse en session.
**Aucune vulnérabilité de confiance ≥ 80 — 0 constat, 0 correctif.** Chaque question tranchée par la
chaîne d'appel réelle **et par la mesure** :

| Question | Réponse établie |
|---|---|
| Injection NoSQL jusqu'au `$in` ? | **Non**, trois barrières indépendantes. express 5 en mode `simple` ne peut **pas** produire d'objet imbriqué (`?pieceId[$ne]=x` → clé littérale) ; le DTO refuse en 400 les 17 charges hostiles essayées avec le pipe réel ; Mongoose casterait de toute façon en `String`. |
| Recouvrement de portée ? | **Impossible par construction** : aucune clé de la requête ne vient de l'appelant — `orgId`/`dossierId` et les clés épandues sont tous des **littéraux**, seules deux *valeurs* traversent. Il n'y a **aucun `...filtre`**. |
| Isolation multi-tenant ? | Mesurée sur 23 000 documents : `nReturned=0` sur les `pieceId`/`correlationId` d'une autre organisation. **Aucun oracle temporel** — le cas « existe ailleurs » est même le plus **rapide** (9,6 ms contre 13,2 ms), le préfixe d'index étant `orgId`. |
| DoS ? | Plafond réel (101 valeurs ⇒ 400, service non appelé) · **aucun COLLSCAN** dans les six formes testées · le filtre **réduit** toujours le jeu de travail (500 docs/17 ms → 100/8 ms) · throttler global couvrant. |
| `pieceId` (sha256) publié ? | **Aucune exposition nouvelle** : la même réponse contient déjà `urlConsultation`, qui donne le **fichier lui-même**. Qui lit le condensat pouvait déjà le calculer. |

**Pré-existants signalés, non corrigés** : aucune pagination ni plafond de résultat sur cette route
(STORY-358) — et **cette PR l'atténue** plutôt qu'elle ne l'aggrave · portée = l'organisation et non
le portefeuille (limite assumée STORY-236/357/358) · l'URL présignée reste un porteur hors chaîne de
guards, TTL 300 s.
