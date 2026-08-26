# STORY-391 : Le cahier ne publie pas sa preuve — une ligne née d'une pièce ne sait pas le dire

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-082**, **STORY-083** et **STORY-084**
**Priorité :** Must Have
**Story Points :** 3
**Statut :** done
**Complexité :** medium
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

> Story **jumelle de STORY-392** (`document-service`). Chacune ferme **un bout** de la même
> chaîne, et **aucune des deux ne suffit seule** : celle-ci nomme la pièce depuis la ligne, l'autre
> retrouve l'image depuis ce nom. Les livrer séparément ne rend rien de visible.

---

## Le constat

Demande PO du 2026-08-24, à la revue de maquette FE-043 :
*« il faut aussi que pour le cahier, la preuve, je puisse la voir de façon claire »*.

C'est la demande la plus légitime de tout l'Atelier — une balance de commerçant ne se défend que
par ses pièces. **Elle n'est servable par aucune route aujourd'hui**, et le plus troublant est que
**rien ne manque en base** : la donnée est écrite, l'image est stockée, seul le **contrat de
lecture** est muet.

### ① `LigneRecetteResponseDto` ne publie pas `auditOcr`

La ligne de cahier porte, depuis STORY-084 :

```ts
// schemas/audit-ocr.schema.ts — écrit à chaque `POST …/pieces/ocr/{lotId}/appliquer`
export class AuditOcrSub {
  lotId!: string;
  pieceId!: string;
  confiance!: number;               // la confiance OCR au moment de l'application
  brut!: Record<string, string>;    // le texte OCR source, champ par champ
}
```

`versLigneRecetteResponse()` projette quinze champs. **`auditOcr` n'en fait pas partie** —
vérifié à la source sur `origin/dev` le 2026-08-24. Idem pour `versLigneDepenseResponse`.

Conséquence directe : depuis le cahier, **le front ne peut même pas NOMMER la pièce** dont une
ligne est issue. Il voit `origine: 'OCR'` et `niveauPreuve: 'fichier'` — deux mots qui *affirment*
qu'une preuve existe **sans donner le moindre moyen d'y accéder**. C'est la pire des trois formes :
l'écran promet une justification qu'il ne peut pas produire.

### ② `LignePreProposeeDto` porte un `pieceId`, mais aucune URL

Sur l'écran de relecture, avant application, le lot expose bien chaque pièce
(`pieceId`, `type`, `confiance`, `brut`, `avertissements`) — mais **aucune URL d'image**. Le front
s'en tire *pendant* le dépôt parce qu'il détient encore les fichiers choisis par l'utilisateur et
peut en faire des vignettes locales. **Il perd tout au rechargement de la page** : rouvrir un lot
`PRET` déposé la veille montre des chiffres sans les images qui les justifient — exactement le
moment où la relecture compte le plus.

### ③ Et la trace `brut` ne remonte nulle part

`auditOcr.brut` contient le **texte OCR source par champ** — « ce que la machine a cru lire ».
C'est la pièce d'audit prévue par NFR-A07, et le seul moyen d'expliquer un écart *sans* rouvrir
l'image. Elle est écrite à chaque ligne appliquée, et **aucune route ne la rend**.

---

## Ce qui est demandé

1. Publier `auditOcr` sur `LigneRecetteResponseDto` **et** `LigneDepenseResponseDto`, en objet
   **typé** (`@ApiProperty({ type: AuditOcrDto })` — pas un `example` nu : c'est la leçon de
   STORY-376 et STORY-389, on ne la repaie pas une troisième fois).
2. Ajouter à `LignePreProposeeDto` un **`apercuUrl`** — l'URL présignée de consultation de la
   pièce, **valable depuis un navigateur**. Le patron existe déjà et est prouvé en navigateur réel
   (FE-064 / STORY-358, `PieceUrlSigner` + endpoint public MinIO) : il s'agit de le rebrancher,
   pas de l'inventer.
3. **Ne rien changer d'autre.** Aucun calcul, aucun événement, aucune écriture : les trois données
   sont déjà persistées. Cette story ouvre un **contrat de lecture**.

## Critères d'acceptation

1. `GET …/cahiers/recettes` et `GET …/cahiers/recettes/{…}` rendent `auditOcr` sur toute ligne
   d'origine `OCR`, et **l'omettent** sur une ligne `MANUELLE` — l'absence est signifiante et doit
   rester distinguable, jamais un objet vide.
2. `auditOcr` est **typé dans l'OpenAPI** : le client généré expose `lotId`, `pieceId`,
   `confiance`, `brut`, et non `Record<string, never>`.
3. `LignePreProposeeDto.apercuUrl` ouvre l'image **depuis un navigateur** (endpoint public), et
   non depuis le réseau docker interne — le piège `MINIO_PUBLIC_ENDPOINT` de FE-023 est vérifié
   par un test qui charge réellement l'URL.
4. Un lot rechargé le lendemain rend des `apercuUrl` **valides** (signature regénérée à la lecture,
   jamais figée au dépôt).
5. Aucune régression sur `POST …/appliquer` : les charges utiles écrites sont identiques.

## Ce que le front fait en attendant — et pourquoi ce n'est pas suffisant

FE-043 affiche les vignettes **locales** pendant la relecture (les `File` que l'utilisateur vient
de choisir) : c'est réel, c'est honnête, et **ça ne survit pas à un rechargement**. Dans le cahier,
la colonne « preuve » ne peut afficher qu'un mot (`photo` / `fichier` / `saisie`) et renvoyer vers
l'onglet « Pièces » du dossier — une liste **non filtrée**, où retrouver *la* pièce d'*une* ligne
se fait à l'œil. Le contournement se retire quand cette story **et** STORY-392 sont livrées.

---

## Progress Tracking

**Statut : `done`** — implémentée, vérifiée en docker, revue, sécurisée et mergée le 2026-08-26.

### Arbitrage de périmètre — D-391-1 : la **voie C**, tranchée par l'user

L'énoncé demandait trois choses. **La deuxième n'était pas livrable dans ce dépôt**, et l'instruction
de la story l'a établi à la source avant d'écrire une ligne :

| Vérifié | Constat |
|---|---|
| `balance-service` | **aucun client MinIO**, aucune dépendance `minio` dans `package.json`, aucune variable `MINIO_*` : il ne peut signer **aucune** URL. |
| `document.piece.extrait` | ne porte **pas** de `storageKey` — le contrat d'événement ne donne pas de quoi construire une clé d'objet. |
| `PieceUrlSigner` | vit dans `document-service` et n'est utilisé **que** par `GET /dossiers/:id/pieces`. |
| `pieces-ocr.service.ts` | documente le **garde-fou #2 de STORY-084**, mot pour mot sur la méthode où `apercuUrl` devrait se brancher : *« `lire` — lit le lot **local** ; **jamais** de re-appel HTTP à `document-service` »*. |

Servir `apercuUrl` supposait donc **une route de signature neuve dans `document-service`** (second
dépôt, et le territoire de STORY-392) **plus** un appel HTTP synchrone sur le chemin de lecture, en
amendant un invariant écrit. Trois voies ont été posées à l'user ; il a tranché la **voie C** :

> livrer ① et ③ en entier, **corriger le trou qui rend la jumelle inopérante**, et laisser
> `apercuUrl` à STORY-392 — dont la route signe **déjà** et gagne le filtre `?pieceId=`.

Le front joint donc `ligne → pièce` avec `auditOcr.pieceId` (livré ici) et
`GET /dossiers/{id}/pieces?pieceId=` (STORY-392). **Aucun couplage synchrone neuf, garde-fou #2
intact, un seul dépôt.**

### ⛔ Le trou trouvé en instruisant la story — et il invalidait la jumelle

`document-piece.client.ts` **ne propageait pas `dossierId`** au dépôt d'une pièce de cahier. Or ce
chemin ne s'ouvre que sous `/dossiers/:dossierId/pieces/ocr` : le dossier est **toujours** connu,
déjà résolu et gardé par le `DossierScopeGuard`. Le client **jumeau** de l'OCR profil le propage
depuis STORY-384 ; celui des pièces comptables ne l'a **jamais** fait.

Conséquence, côté `document-service` : `listerParDossier` filtre sur `{ orgId, dossierId }`. Une
pièce de cahier déposée sans dossier **n'apparaît jamais** dans `GET /dossiers/:id/pieces` — la
**seule** route qui sache signer une URL de consultation. L'image était **écrite, conservée, et
introuvable**.

⚠️ **La prémisse de STORY-392 était donc fausse pour ce parcours** : « `GET /dossiers/{id}/pieces`
fait déjà PRESQUE tout : il agrège les pièces COMPTABLES » est vrai du **code**, faux des
**données** — aucune pièce de cahier n'y entrait. Livrées telles quelles, 391 **et** 392 n'auraient
rien rendu de visible. Le bandeau de correction est posé dans STORY-392.

### Ce qui a été livré

| | |
|---|---|
| `AuditOcrDto` (neuf) | objet **typé** partagé par les deux cahiers : `lotId`, `pieceId`, `confiance`, `brut`. `brut` décrit par `type:'object'` + `additionalProperties:{type:'string'}` — jamais un `object` nu. |
| `LigneRecetteResponseDto` / `LigneDepenseResponseDto` | publient `auditOcr`, **facultatif**, et l'**omettent** sur une ligne `MANUELLE` : la clé est absente, pas vide, pas `null`. |
| `document-piece.client.soumettrePiece` | gagne un 4ᵉ paramètre `dossierId`, **obligatoire** — le compilateur devient le garde-fou : un futur appelant ne peut plus l'oublier (là où le client profil le garde facultatif, l'assistant y déposant parfois avant que le dossier existe). |

### Ce que l'AC-1 nomme et qui n'existe pas

L'AC-1 cite « `GET …/cahiers/recettes` **et** `GET …/cahiers/recettes/{…}` ». **La seconde route
n'existe pas** : le contrôleur expose `POST`, `POST /lot`, `GET /synthese`, `GET /totaux-comptes`,
`GET`, `PATCH :id`, `DELETE :id` — aucun `GET :id`. La projection étant partagée, **toute** route
qui rend une ligne publie `auditOcr` : c'est vérifié en docker sur `GET` **et** sur `PATCH :id`.
Aucune route n'a été ajoutée pour satisfaire la lettre d'un critère — ce serait déborder.

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **3 052 / 3 052**, couverture
**98,98 st / 91,87 br / 98,18 fn / 99,06 li** (seuils 65/90/90/90) · `test:e2e` **720 / 720**.

⚠️ **`collectCoverageFrom` exclut `*.dto.ts`** : `audit-ocr.dto.ts` et les deux projections modifiées
sont **invisibles aux seuils**. Revenir à un `@ApiProperty` nu ne ferait bouger **aucun** chiffre.
Ce sont donc les tests de `openapi-contract.e2e-spec.ts` — et eux seuls — qui empêchent la récidive.

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| `auditOcr` **toujours** émis (recettes), même sur MANUELLE | « une ligne saisie à la main OMET la preuve » + e2e AC-1 | 🔴 1 unit + 1 e2e |
| condition **inversée** (dépenses) : émis sur MANUELLE, omis sur OCR | 2 unitaires + e2e AC-1 dépenses | 🔴 2 unit + 1 e2e |
| `brut` publié en `object` **opaque** (`@ApiProperty` sans `type`) | « décrit `brut` comme une carte de chaînes » + « AUCUN schéma opaque » | 🔴 2 |
| `auditOcr` annoncé **obligatoire** (`@ApiProperty`) | « les DEUX lignes … la laissent FACULTATIVE » | 🔴 1 |
| le dossier part sous un **nom de champ** que `document-service` ne lit pas (`dossier`) | « transmet le dossier » (ancré sur `name="dossierId"`) | 🔴 1 |
| l'**organisation** propagée à la place du dossier | « propage le dossier de l’URL » + e2e HTTP | 🔴 2 unit + 1 e2e |

🪤 **Une mutation a d'abord rougi pour la MAUVAISE raison**, et le constat vaut d'être gardé :
retirer `additionalProperties` en laissant `type: 'object'` est une **erreur de compilation** —
`@nestjs/swagger` type `ApiPropertyOptions` de telle sorte que `additionalProperties` est **requis**
dès que `type: 'object'` est écrit littéralement. La forme réelle du défaut STORY-376 n'est donc pas
celle-là, c'est le `@ApiProperty` **sans `type` du tout** : là, Swagger infère `Object` depuis la
réflexion et publie l'objet opaque, **en compilant**. La mutation a été rejouée sous cette forme —
et c'est elle qui a rougi les deux gardes.

### Vérification docker réelle — stack complète, 2026-08-26

Stack : `mongo` + `kafka` + `redis` + `minio` + `auth-service` + `dossier-service` + `document-service`
+ `kyc-service` + `balance-service`. Organisation, dossier, exercice et jeton RS256 créés **par les
API réelles** ; KYC/entitlement semés dans les read-models locaux.

⚠️ **Le premier relevé de l'état « AVANT » était FAUX, et c'est le piège documenté du hot-reload** :
`nest start --watch` a bien recompilé après le retour au code `dev` (`File change detected` →
`Found 0 errors`) **sans redémarrer le process** — l'application servait toujours le build MNV-391
chargé au boot. La mesure disait donc l'inverse de la vérité. Rejouée après un
`docker compose restart balance-service` explicite, `Nest application successfully started` vérifié
dans les logs, et le `dist` du conteneur inspecté champ par champ.

| # | Acte | Résultat | Ce qui est prouvé |
|---|---|---|---|
| 1 | **AVANT** (code `dev`) — dépôt d'une pièce sous `/dossiers/{d}/pieces/ocr` | `piece_extractions.dossierId` **ABSENT**, `storageKey = {org}/{lot}/{uuid}` | la pièce est stockée **hors de tout dossier** |
| 2 | **AVANT** — `GET /dossiers/{d}/pieces` | la pièce **n'y est pas** | elle est **introuvable** par la seule route qui signe |
| 3 | **APRÈS** — même dépôt | `dossierId` posé, `storageKey = dossiers/{org}/{dossier}/{uuid}` | le dossier traverse le proxy |
| 4 | **APRÈS** — `GET /dossiers/{d}/pieces` | pièce **listée**, `urlConsultation` sur `http://localhost:9000` | hôte **public**, résoluble par un navigateur — pas `minio:9000` (piège FE-023 / STORY-179) |
| 5 | l'URL présignée est **réellement chargée** | **HTTP 200**, 703 octets, `application/pdf`, **`cmp` octet pour octet** avec le fichier déposé | ce n'est pas une URL bien formée, c'est l'image |
| 6 | round-trip OCR complet : dépôt → `document.piece.extrait` → `lignes_pre_proposees` → `POST …/appliquer` | ligne créée, `lignes_recettes.auditOcr = {lotId, pieceId, confiance: 0, brut: {}}` **en base** | le chemin d'écriture de STORY-084 est **intact** (AC-5) |
| 7 | `GET …/cahiers/recettes?exercice=2026` | ligne `OCR` → `auditOcr` **complet** ; ligne `MANUELLE` → **`'auditOcr' in ligne === false`** | **AC-1**, testé sur la présence de la **clé**, pas sur `undefined` |
| 8 | `GET …/cahiers/depenses?exercice=2026` (lot `DEPENSES` appliqué) | même résultat sur les deux origines | AC-1 sur **les deux** cahiers |
| 9 | `PATCH …/cahiers/recettes/{id}` | rend `auditOcr` | la route qui rend une ligne **seule** le publie aussi |
| 10 | la jointure de bout en bout | `auditOcr.pieceId` retrouve `piece_extractions` du **bon dossier**, dont l'URL charge l'image de l'acte 5 | **la ligne désigne sa preuve, et la preuve s'ouvre** |
| 11 | dégradation : dossier retiré du read-model de `document-service` (retard de projection simulé) | **502 `DOCUMENT_SERVICE_INJOIGNABLE`**, lot `ECHEC`, `/health` **200** | le nouveau refus possible suit la dégradation gracieuse **existante**, sans nouvelle forme de panne |

⚠️ **Observation, hors périmètre et non corrigée** : le PDF déposé à l'acte 6 est ressorti
`statut: ECHEC` avec `champs: []` — `document-service` lève `Cannot find module '@napi-rs/canvas'`
sur le rendu de page PDF, et Tesseract `RuntimeError: Aborted(-1)` sur une image synthétique. C'est
un **manque de l'image de développement**, pas un défaut de cette story : la chaîne de bout en bout
(événement, brouillon, application, `auditOcr` écrit **et publié**) a fonctionné sur ce lot `ECHEC`,
`brut` valant `{}` — soit exactement le cas « lu, rien trouvé » que le contrat sait exprimer.
Noté pour que ce ne soit pas relu comme une régression.

### Revue de code (⑥)

Scan par `prospera-code-review` (`haiku` contexte + `opus` analyse), synthèse en session. **2 constats
retenus, tous deux corrigés** (commit dédié `MNV-391(revue)`), aucun bloquant.

#### ⚡ La garde du champ multipart ne gardait qu'à MOITIÉ

Le test de propagation posait **deux `toContain` indépendants** — `name="dossierId"` d'un côté, la
valeur de l'autre. C'est le motif hérité du client jumeau (STORY-384), et il ne distingue **pas**
« la valeur est **sous** ce nom » de « la valeur traîne quelque part dans le corps » — précisément
ce que le commentaire que j'avais écrit prétendait exclure.

**Vérifié par la mutation que le constat décrivait**, plutôt que pris pour argent comptant :
échanger les deux `append` (`pieceId` ↔ `dossierId`) laisse **54 tests verts** — 4 unitaires du
client, 25 du service, 25 e2e. En production, chaque dépôt aurait envoyé le **sha256** comme
`dossierId` ; `@EstObjectId()` le refuse en 400, donc **tout lot serait parti en `ECHEC` + 502**.
La mutation M5 de ma propre table (changer le **nom** du champ) rougissait, et c'est ce qui m'avait
fait croire la garde solide : elle ne couvrait qu'un des deux échanges possibles.

⇒ ancrage sur le **couple nom→valeur**, dans les **deux sens** (dossier *et* pièce) : sans la
seconde ancre, l'échange inverse restait muet. Mutation rejouée : 🔴.

#### Trois descriptions publiées promettaient une jointure qui n'existe pas encore

« C'est `auditOcr.pieceId` qui permet de retrouver l'image côté `document-service` » et « c'est
**sous ce nom** que `document-service` conserve l'image » sont **faux au présent** :

- `GET /dossiers/:id/pieces` ne **publie pas** `pieceId` et n'accepte **pas** `?pieceId=` — c'est
  exactement le périmètre de STORY-392 ;
- l'image est stockée sous `dossiers/{orgId}/{dossierId}/{uuid}`, jamais sous le sha256, qui n'est
  que la 3ᵉ colonne de la clé unique `(orgId, correlationId, pieceId)`.

Un front généré depuis ce contrat n'aurait eu que `lotId` à apparier — donc le **lot entier**,
c'est-à-dire le contournement « à l'œil » que la story elle-même décrit comme insuffisant. C'est
mot pour mot la classe de défaut du commit précédent de ce dépôt
(`MNV-381(revue): un commentaire affirmait une garantie que la méthode n'offre pas`), et
STORY-392 aurait été cadrée d'après ce texte.

⇒ promesse **conditionnée**, et distinction « **connaît** la pièce » / « **stocke** l'image »
rétablie aux trois endroits.

#### Constat écarté

Le nouveau mode de panne — le dépôt déclenche désormais `DossierGate` chez `document-service`, donc
un retard de projection rend 404 ⇒ lot `ECHEC` + 502 — est une **décision documentée et mesurée**
(acte 11 de la vérification docker). Le cas « archivé » est de toute façon intercepté en amont par
le `DossierScopeGuard` (409, un POST est une écriture), et le client jumeau expose la même surface
depuis STORY-384.

### Revue de sécurité (⑦)

Scan par `prospera-security-review` (`opus`, aucun downgrade), synthèse en session.
**Aucune vulnérabilité de confiance ≥ 80 — 0 constat, 0 correctif.** Les points instruits, chacun
par la chaîne d'appel réelle :

| Question | Réponse établie |
|---|---|
| Le contrat élargi expose-t-il plus que le périmètre d'accès existant ? | **Non.** Même chaîne de guards (`@Roles` + `@RequiresBalanceAccess` + `@RequiresDossierScope`), mêmes filtres `{orgId, dossierId}`. Et `brut` était **déjà** publié au même public par `GET …/pieces/ocr/:lotId` depuis STORY-084 : la PR le rend disponible **plus longtemps**, pas à **plus de monde**. |
| `brut` est un `Mixed` issu d'un fichier utilisateur — pollution de prototype ? | **Non**, et c'est **mesuré**. Les **clés** ne viennent jamais du texte OCR : les 11 clés possibles sont des littéraux codés en dur dans les deux parseurs ; seules les **valeurs** dérivent du fichier. Et même une clé `__proto__` serait inerte — `Object.fromEntries` emploie `CreateDataProperty`, pas `Set`, et le désérialiseur `bson` du dépôt fait de même : propriété **propre**, aucun prototype touché. |
| Traversée de chemin / rattachement cross-tenant via `dossierId` ? | **Non.** `dossierId` sort d'un `ObjectId.toString()` (24 hex), est re-validé par `@EstObjectId()` (motif strict, pas `isValid` qui accepte les nombres), puis **re-prouvé indépendamment** par `DossierGate` contre le read-model de `document-service` — **avant** le `putObject`. Une divergence entre les deux read-models donne un **refus**, jamais un accès. |
| Le champ neuf casse-t-il `forbidNonWhitelisted` ? | **Non** — `CreerPieceExtractionDto` déclare `dossierId` depuis STORY-358. Mesuré en exécutant la validation réelle : valeur valide ⇒ accepté ; `"../autre-org"`, tableau (champ **dupliqué** dans le multipart), nombre ⇒ **refusés**. Le garde-fou MNV-084 tient toujours : un `orgId` ajouté au formulaire reste refusé. |
| `pieceId` (sha256) publié est-il sensible ? | **Non**, et **ce n'est même pas un ajout** : `construireEntree` pose déjà `pieceRef: brouillon.pieceId`, publié par les deux DTO depuis STORY-084. ⚡ Ce que la story change n'est donc pas l'**exposition** de la valeur mais sa **dicibilité** — sous `pieceRef`, un champ dont le contrat annonce « référence de pièce » (`FAC-2026-031`) et qu'un humain saisit lui-même, le front ne pouvait pas deviner qu'il lit un sha256 sur une ligne OCR. Aucune route ne prend de `pieceId` : le connaître ne donne **rien**. |
| Intégrité comptable — `auditOcr` devenu lisible peut-il être **forgé** ? | **Non.** `construireEtat` ne lit `auditOcr` que depuis `options`, alimenté par `creerLotOcr` à partir du brouillon **en base** ; et `validerLigneBrute` tourne en `forbidNonWhitelisted`, donc un `auditOcr` — ou un `origine: 'OCR'` — glissé dans le corps de `/appliquer` fait **rejeter la ligne**. |

**Relevé positif** : la projection Kafka **ignore délibérément** le `dossierId` porté par l'événement
et n'emploie que celui du **lot local** — la valeur venue du bus n'est jamais une source d'autorité.

**Pré-existants, hors périmètre, signalés sans correction** :

1. **Portée = l'organisation, pas le portefeuille** — un `TENANT_USER` non affecté au dossier lit les
   cahiers et, désormais, les pièces. Limite identique et assumée en STORY-236 / 357 / 358 (le
   contrat `dossier.*` v1 ne diffuse pas l'affectation). La PR fait passer les images de
   « invisibles à tous » à « visibles par tout membre de l'org » : c'est l'objet même de la story
   (NFR-A07), **à l'intérieur** de la frontière d'autorisation existante.
2. **`POST /piece-extractions` directement joignable** avec un `correlationId` arbitraire : un membre
   peut injecter un brouillon dans un lot de sa **propre** organisation. Aucune escalade (il peut
   déjà écrire au cahier), aucun chemin inter-org. Inchangé par la PR.
3. **Couplage de déploiement** — un `document-service` **antérieur à STORY-358** face à ce
   `balance-service` refuserait le champ `dossierId` en 400 ⇒ 502 sur tout dépôt. Ce n'est pas une
   faille (pas d'attaquant), mais c'est le seul risque opérationnel de la PR. Non bloquant ici :
   STORY-358 est sur `dev` depuis le 2026-08-20, et les deux services se déploient du **même**
   `docker-compose`.

