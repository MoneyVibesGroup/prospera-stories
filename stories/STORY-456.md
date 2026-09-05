# STORY-456 : Le déficit reportable est le seul poste de la liasse sans piste d'audit publiée — alors qu'il est persisté

Status: in_progress

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`
**Points :** 2 · **Complexité :** low · **Sprint :** S20
**Origine :** relevée le **2026-08-27** par la **passe expert-comptable de FE-050**, en cherchant quoi
afficher dans la colonne de justification du stock de déficits — et en ne trouvant rien à afficher.

---

## Le fait, relevé à la source

Le schéma **persiste** la piste d'audit. Le DTO ne la **publie pas**.

`deficit-reportable.schema.ts` :

```ts
@Prop() baseLegale?: string;
@Prop() justification?: string;
@Prop({ required: true }) parUserId!: string;   // « piste d'audit (NFR-A07) »
createdAt?: Date;  updatedAt?: Date;            // { timestamps: true }
```

`DeclarerDeficitDto` **accepte** `baseLegale` et `justification`, et `declarerDeficit` les **écrit**
(`resultat-fiscal.service.ts`, avec `parUserId: user.userId`).

`DeficitResponseDto` / `DeficitDeclareResponseDto` publient : `id`, `exerciceOrigine`, `montant`,
`montantDejaImpute`, `restant`, `expireApres`, `perime`, `imputableSurExercice`.

⛔ **Aucun des cinq champs d'audit ne ressort.** Le cabinet écrit une justification que **personne ne
peut relire** — ni lui, ni l'écran, ni un contrôle.

### Le contraste, dans le même service et sur le même écran

`PosteRetraitementResponseDto` publie, lui, **tout** : `baseLegale`, `justification`, `pieceRef`,
`parUserId`, `le`. FE-050 affiche donc, côte à côte sur le même écran :

| | traçabilité à l'écran |
|---|---|
| un retraitement de 1 800 000 F, sur **un** exercice | article invoqué, motif écrit, auteur, date, pièce |
| un report de 8 000 000 F, sur **plusieurs** exercices | **rien** |

**C'est l'inverse de la hiérarchie du risque.**

---

## ⚖️ AVIS D'EXPERT-COMPTABLE

### ① En contrôle, le report est ce qui se justifie en premier

Un retraitement se défend sur l'exercice vérifié : la pièce est dans le dossier de l'année. Un
**report déficitaire**, lui, vient d'un exercice **antérieur** — souvent hors période vérifiée,
souvent antérieur au cabinet en place. C'est pour cela que le vérificateur commence par là : il
demande la liasse d'origine, et à défaut il **rejette l'imputation**. Un report non justifié n'est
pas un report faible : c'est un report perdu.

### ② `montantDejaImpute` est *déclaré* — donc c'est une affirmation, pas une donnée

Le produit le dit lui-même (D-091-9) : cette colonne n'est pas dérivée, elle est **saisie**. Une
affirmation non signée et non datée ne vaut rien : le confrère qui reprend le dossier ne peut ni la
vérifier, ni savoir si elle a été posée avant ou après la liasse qu'il a sous les yeux. C'est
d'autant plus vrai que le stock est **figé par le gel** dès la première clôture suivante — ce qui a
été déclaré une fois ne se corrige plus (et, tant que **STORY-455** n'est pas livrée, ne se met jamais
à jour non plus).

### ③ La date de déclaration compte autant que l'auteur

`createdAt` existe déjà. Savoir qu'un report de 8 000 000 F a été déclaré **le lendemain d'un
contrôle** ou **trois ans avant** ne dit pas la même chose sur le dossier. C'est le champ le moins
cher du lot et probablement le plus utile.

### ④ Le coût est nul, et c'est ce qui rend le manque anormal

Il n'y a **rien à collecter, rien à migrer, rien à calculer** : la donnée est écrite en base depuis
STORY-091. Il manque cinq lignes de DTO. Un écart de ce prix qui survit à deux revues mérite qu'on
note **pourquoi** il a survécu : la revue de contrat lit ce que le contrat **publie**, jamais ce que
le schéma **stocke** — les deux listes n'ont jamais été confrontées.

⇒ **Règle : quand un schéma porte un champ d'audit, vérifier qu'un DTO le rend. Un champ persisté et
jamais publié est du travail déjà payé, et une garantie qui n'existe pas.**

---

## Critères d'acceptation

1. `DeficitResponseDto` **et** `DeficitDeclareResponseDto` publient `baseLegale`, `justification`,
   `parUserId` et la **date de déclaration** (`createdAt`, exposée sous un nom métier — `le`, comme
   sur les retraitements, pour que les deux surfaces se lisent pareil).
2. Les champs sont **optionnels au contrat** (`@ApiPropertyOptional`) : les déficits déclarés avant
   cette story n'ont ni `baseLegale` ni `justification`, et un défaut inventé serait pire que
   l'absence. `parUserId` et la date, eux, existent sur **tous** les documents (`required` /
   `timestamps`) et sont donc publiés sans réserve.
3. **`justification` devient obligatoire à la déclaration** — même exigence que sur un retraitement
   (`JUSTIFICATION_REQUISE`, NFR-A04), et pour la même raison : un report non motivé est
   indéfendable. ⚠️ **Rupture de contrat assumée** sur `DeclarerDeficitDto` : à annoncer, et à ne
   retenir que si le PO l'arbitre — sinon, se limiter aux AC-1/2 et laisser le champ facultatif.
   *(L'écran FE-050 propose déjà les deux champs ; il ne les impose pas.)*

   > **✅ ARBITRÉ PAR LE PO le 2026-09-05 — AC-3 RETENU, sur `justification` seule.**
   > `baseLegale` **reste facultative** : sur un report l'article invoqué est le même pour tout le
   > monde (art. 101 CGI), l'exiger ajoute une case à remplir sans ajouter d'information — là où la
   > justification nomme l'**origine**, qui est précisément ce que le vérificateur demande. La
   > rupture ne coûte presque rien aujourd'hui (aucune production, l'écran propose déjà le champ) et
   > ne fera qu'enchérir : seules les déclarations **futures** sont concernées, aucune reprise
   > rétroactive, aucune migration.
4. **Aucune rétro-attribution** : un déficit sans auteur exploitable rend le champ absent, jamais un
   utilisateur système. Signer a posteriori une déclaration qu'on n'a pas vue est pire que ne pas la
   signer.
5. ⚠️ **Correctif de commentaire, dans la même passe** : `resultat-fiscal.service.ts` documente
   l'index unique comme `(orgId, exerciceOrigine)` alors que le schéma porte
   `(dossierId, exerciceOrigine)` (corrigé par STORY-236, le commentaire ne l'a pas suivi). Tel quel,
   il décrit un défaut multi-dossiers **qui n'existe pas** — un cabinet ne pourrait déclarer qu'un
   seul déficit 2022 pour tous ses clients. Il a déjà coûté une vérification.
6. **Tests** : ① les quatre champs ressortent sur un déficit déclaré avec justification ; ② un
   déficit antérieur ressort sans `baseLegale`/`justification` mais **avec** auteur et date ;
   ③ (si AC-3 retenu) une déclaration sans justification est refusée `400 JUSTIFICATION_REQUISE`.

---

## Impact frontend

FE-050 affiche aujourd'hui, pour chaque déficit, sa règle de report et son imputation — et **rien**
sur son origine. Les quatre champs se posent dans la colonne « Exercice d'origine » sur le patron
**déjà écrit** pour les retraitements (`saisi par {auteur} le {date}`), soit une ligne de composant.
⇒ story frontend **inutile** : à intégrer au premier passage sur l'écran.

**Dépendance de lecture :** se lit avec **STORY-455**. Celle-ci rend le stock *justifiable*, 455 le
rend *juste*. Livrer 456 seule affiche proprement l'origine d'un chiffre qui continue de dériver.

---

## Progress Tracking

**Statut : `in_progress`** — 2026-09-05. Développement fait, portes DoD franchies, vérification
docker faite sur la base réelle. Reste : revue de code, revue de sécurité, merge.

### L'arbitrage de l'AC-3

Retenu, sur `justification` **seule** (cf. l'encadré de l'AC-3). `baseLegale` reste facultative.

### Ce qui a été livré

**Les quatre champs sont publiés sur `DeficitDeclareResponseDto`**, donc sur les **deux** surfaces —
`DeficitResponseDto` en hérite. C'est ce qui garantit qu'une déclaration et sa relecture montrent la
**même** origine ; deux surfaces divergentes seraient pires que l'absence d'origine. `createdAt` sort
sous le nom métier `le`, comme sur un retraitement : les deux cohabitent sur l'écran de FE-050, et un
même fait n'y porte pas deux noms.

**La piste est lue sur le document persisté, jamais recopiée du DTO** (`versAudit`). La ligne qu'on
écrit spontanément — `justification: dto.justification` — afficherait une justification que la base
n'aurait pas gardée si un `@Prop` venait à la transformer. Un unitaire dédié fait échouer exactement
cette ligne (le document mocké porte une justification **différente** du corps).

**La jointure est faite APRÈS la projection**, dans la même map que l'historique de STORY-455 :
`projeterDeficits` alimente aussi `GET /resultat-fiscal`, qui n'a pas à publier ces champs. Le moteur
reste ce qu'il était.

**Les quatre sont `@ApiPropertyOptional`, pour deux raisons distinctes** et dites dans le code.
`baseLegale`/`justification` sont réellement absents des déficits antérieurs (AC-2). `parUserId` et la
date sont portés par **tous** les documents que le produit écrit — `required: true` et
`timestamps: true` depuis le **commit de création** de la collection, vérifié à la source
(`git show 7b90587`) — mais l'AC-4 exige que leur absence reste **représentable** : un contrat qui les
annoncerait obligatoires interdirait au mapping de ne rien inventer.

### ⛔ Le refus de l'AC-3 n'a PAS de `code`, et le contrat le dit

**Mesuré, pas supposé.** Une déclaration sans justification rend le refus du `ValidationPipe` :
`{"statusCode":400,"message":["justification should not be empty", …]}`, **sans `code`**. Une garde de
service qui lèverait `JustificationRequiseException` serait **inatteignable** — le pipe répond avant
elle. Elle avait été écrite, puis **retirée** une fois la mesure faite : du code mort dans un fichier
couvert.

⇒ le contrat publie le refus **tel qu'il sort**. Annoncer `JUSTIFICATION_REQUISE` sur cette route
aurait publié un code que la route n'émet jamais — **le défaut même que cette story corrige**.

> ⚠️ **Constat hors périmètre, à reprendre à part.** `POST …/fiscal/retraitements` publie
> `JUSTIFICATION_REQUISE` sur son `400` alors qu'il se comporte **exactement pareil** : mesuré sur la
> route, il rend le même refus de pipe, sans `code`. `validerRetraitementManuel` porte bien la règle,
> mais le `@IsNotEmpty()` de `CreerRetraitementDto` la court-circuite. C'est la même famille d'écart
> que celui de cette story, dans l'autre sens : un contrat qui **annonce** ce que le code n'émet pas.

### AC-5 — trois copies du commentaire faux, pas une

La fiche en nommait une (`resultat-fiscal.service.ts`). Le balayage en a trouvé **trois**, et la
troisième n'était pas un commentaire :

| # | Emplacement | Nature |
|---|---|---|
| 1 | `resultat-fiscal.service.ts` (mapping du `E11000`) | commentaire — celui de la fiche |
| 2 | `exceptions/fiscal.exceptions.ts`, doc de `DeficitDejaDeclareException` | commentaire |
| 3 | `test/fiscal.e2e-spec.ts` | ⛔ **le harnais REJOUAIT la mauvaise clé** |

⛔ Le harnais e2e dédoublonnait sur `(orgId, exerciceOrigine)` : il aurait **refusé une implémentation
correcte** laissant deux dossiers d'un même cabinet déclarer chacun leur déficit 2022. Sans effet sur
les tests existants — ils visent tous le dossier unique de `sousDossier` — et c'est précisément pour
cela qu'il pouvait rester faux si longtemps. Corriger le commentaire sans corriger le code qu'il décrit
aurait fabriqué un second mensonge.

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | **0 warning** |
| Build | OK |
| Unitaires | **3 662** verts |
| e2e | **895** verts |
| Couverture | **99,17 / 92,46 / 98,68 / 99,27** (seuils 65/90/90/90) |

### Mutations — 7 valides, 7 rouges ciblées

| # | Mutation | Résultat |
|---|---|---|
| M1 | la lecture ne joint plus `versAudit` | 🔴 « chaque déficit du stock porte sa piste d'audit » |
| M2 | la déclaration **recopie le DTO** au lieu de relire le document | 🔴 « lue sur le DOCUMENT, jamais recopiée du DTO » |
| M3 | AC-4 — un auteur **inventé** (`?? 'systeme'`) | 🔴 « n'invente ni motif, ni auteur, ni date » |
| M4 | AC-4 — une date **inventée** (`?? new Date()`) | 🔴 idem |
| M5 | la clé `baseLegale` **toujours posée**, `undefined` compris | 🔴 idem — et **verte en e2e** : `JSON.stringify` efface un `undefined`, l'assertion unitaire est le seul filet |
| M6 | AC-3 — `@IsNotEmpty()` retiré du DTO **de déficit** | 🔴 « une déclaration SANS justification est refusée 400 » |
| M7 | AC-5 — le harnais e2e revient à la clé `(orgId, …)` | 🟢 **verte, et c'est la mesure** : aucun test e2e ne peut voir la portée — seule la vérification docker le prouve (mesure ⑤) |

⚠️ **M6 a d'abord été verte pour une mauvaise raison** : le bloc de décorateurs
`@Trim() @IsString() @IsNotEmpty() @MaxLength(2000) justification!: string` est **identique** sur
`CreerRetraitementDto`, et le remplacement avait muté le **retraitement**. Rejouée sur le bon DTO, elle
est rouge. Une mutation qui touche un autre site ne prouve rien — elle « valide » un test qu'elle n'a
jamais mis à l'épreuve.

### ⚠️ Vérification docker — 7 mesures sur la base réelle

Stack `docker compose`, cabinet `6a9abdb4…9bcf`. ⚠️ Le conteneur servait le **contrat d'avant la
story** au premier passage — `/api/docs-json` annonçait `DeclarerDeficitDto.required =
['exerciceOrigine','montant']` ; `docker compose restart balance-service` a suffi (piège déjà fiché en
STORY-454 et 455, revu ici pour la troisième fois).

| # | Mesure | Résultat |
|---|---|---|
| ① | Le déficit **écrit par la vérification de STORY-455** (`6a9bbc2d…823b`), relu par `GET /fiscal/deficits` | `baseLegale: 'Art. 101 CGI'`, `justification: 'Report DSF 2022'`, `parUserId: 6a9abdb4…9bd0`, `le: 2026-09-05T06:52:29.540Z` — **la donnée était en base depuis un jour, invisible** |
| ② | `POST /fiscal/deficits` avec motif ⇒ **201** | les 4 champs dans la réponse de **création** ; le document relu en base les porte, et `le` **égale** `createdAt` **à la milliseconde** |
| ③ | `POST` **sans** justification ⇒ **400** | refus du pipe, `message` nommant `justification`, **aucun `code`** ; `"     "` (blancs) ⇒ **400** aussi (le `@Trim()` passe avant) ; **0 document écrit** |
| ④ | Trois déficits du même dossier, relus ensemble | origine 2019 (**sans auteur**, semé en direct) ⇒ **aucun champ** ; origine 2020 (ère STORY-091) ⇒ `parUserId` + `le`, **sans** motif ; origine 2022 (contrat neuf) ⇒ `justification` + `parUserId` + `le`. **Rien d'inventé nulle part** — AC-2 et AC-4 |
| ⑤ | ⚡ **AC-5 — la même année d'origine dans DEUX dossiers du MÊME cabinet** | **201 / 201**. Le défaut multi-dossiers que décrivait le commentaire **n'existe pas**. C'est la mesure que **le harnais e2e ne peut pas faire** (mutation M7 verte) |
| ⑥ | Le doublon **dans un même** dossier | **409 `DEFICIT_DEJA_DECLARE`** — l'index mord bien, à la portée du dossier |
| ⑦ | `getIndexes()` sur `deficits_reportables` | un seul index métier : `{dossierId: 1, exerciceOrigine: 1}` **unique**. Aucun index sur `orgId` — **preuve directe** que le commentaire corrigé dit la vérité |
| ⑧ | Balayage d'invariants sur toute la collection (6 documents) | 0 justification blanche, 0 auteur vide, 0 montant négatif, 0 doublon sur la clé dossier |

⚠️ **Ce que la vérification a dû changer dans la base de dev, et qui est dit** : le profil société du
cabinet était au régime `SYNTHETIQUE` (laissé par la mesure SECU-2 de STORY-455), ce qui ferme toute la
surface fiscale — remis à `REEL` par un `updateOne` filtré sur l'`_id` **exact** du document (jamais sur
un libellé : leçon STORY-445). Deux dossiers **vierges** ont été semés dans le read-model
(`456000…0001` / `456000…0002`) : les deux dossiers existants portent chacun une balance 2026 arrêtée,
donc le gel du stock y interdit toute déclaration antérieure à 2026 — sans dossier neuf, la mesure ⑤
était impossible.
