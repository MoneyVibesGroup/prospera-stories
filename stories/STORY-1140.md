# STORY-1140 : l'export C13 du bilan aussi en CSV (Q-D-19)

Status: done

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §4 bis (amendement du 26/11), n° **5c** · **Dépôt :**
`prospera-bilan-service` (tenu par D jusqu'au prochain plan ; `origin/dev` au départ : `027075d`, STORY-1139) ;
**contrat** dans `prospera-plateforme/contrats/instance/` (à **B** : D n'y écrit pas) · **Plage :** groupe D,
`STORY-1140 → 1141` (réservées le 26/11 ; 1140 s'en détache en entrée propre, la plage garde 1141) · **Dépend de :**
STORY-1075 ✅ (l'export JSON, D-1075-6, D-1075-13).
**Sources :** réponse de l'utilisateur du 25/11 à **Q-D-19** (journal de D, « Questions ») : « l'export sort **aussi en
CSV** (C13 point 7). Les contrats restent à publier par B dans `prospera-plateforme/contrats/instance/` » ;
`CONTRAT-DE-MODULE-2026-11-09.md` C13 point 7 (« un export en CSV et JSON ») et C2 (l'export passe toujours, seul
`NON_INSTALLE` le refuse) ; **`stories/STORY-1021.md`, D-1021-6 → 8 et D-1021-13** (C, `prospera-balance-service`
`b52d262`) : la forme par objet que le plan impose « pour qu'il n'y ait qu'une seule forme sur le poste ». **Code relu,
sans rien y changer** : `balance-service` `origin/dev` `44be0c1` — `instance-c13/export-c13.ts` (la demande, l'ordre des
refus, le nom du fichier), `instance-c13/export-csv.ts` (l'aplatissement), `fiscal/export-liasse.regles.ts` (BOM, `;`,
CRLF, `echapperCsv`, `neutraliserFormule`), `instance-c13.controller.ts` (`@Res({ passthrough: true })`,
`StreamableFile`, `Cache-Control: no-store`), `export-csv.spec.ts` (six vecteurs). Bilan `origin/dev` `027075d` :
`instance-c13/export-c13.ts`, `instance-c13.controller.ts`, `refus.ts`, `plan-d-export.ts`, `export-c13.spec.ts`,
`test/instance-c13.e2e-spec.ts` ; aucun CSV dans le service avant cette story (`git grep` : ni BOM ni neutralisation).
**Rituel (2026-11-26, 05:10) :** aucune demande neuve à D chez A, B et C (celle de C du 26/11, notification sur
`fiscal.obligation.alerte-echeance@1`, est déjà reçue et hors lot 7) ; 319 et 325 de C non fusionnées (fiscal
`origin/dev` `cefbe20`, 318 ; C fait 319) : D reste sur 5c → 5d. `bilan-service` : aucune PR ouverte, `origin/dev`
`027075d`, deux brouillons non suivis connus (`cr-map.txt`, `cr-postes.txt`), laissés. Verrou Docker libre, aucun
conteneur `grp-d`.

## « Fini quand » (plan)

« L'export du module sort en JSON et en CSV ; le CSV prend la forme par objet de `balance-service` (D-1021-7, C), pour
qu'il n'y ait qu'une seule forme sur le poste ; **→ B** : le contrat publié. »

## Ce qui existait déjà

`GET /api/v1/instance/bilan/{organisationId}/export` (STORY-1075) rend 200 l'enveloppe JSON `{ schemaVersion: 1, module:
'bilan', organisationId, espace, exporteLe, objets: [{ objet, collection, nombre, enregistrements }] }` (huit objets
depuis 1139, documents en Extended JSON relaxed), sous l'identité `MOTEUR` seule, limitée à l'organisation du chemin ;
état publié absent ou `NON_INSTALLE` ⇒ 403 `BILAN_NOT_ENTITLED`. **Aucun paramètre** de requête n'est lu, **aucun
CSV**, aucun en-tête de cache. `balance-service` sert depuis 1021 le même JSON **et** le CSV par objet.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant le code (« ⚠ Contrats » du journal de D) ; la demande à B est écrite (« Demandes ») | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | Sans paramètre (ou `format=json`), l'export rend **le même JSON qu'avant** (les huit objets, dans l'ordre du plan) ; `objet=<objet>` le réduit à cet objet ; la réponse porte `Cache-Control: no-store` | `export-c13.spec` ; e2e ; pile `grp-d` |
| AC-3 | **Le CSV** : `?format=csv&objet=<objet>` rend un objet du plan en `text/csv; charset=utf-8`, pièce jointe `export-bilan-<objet>-<organisationId>.csv`, `Cache-Control: no-store` ; BOM UTF-8, `;`, CRLF ; une ligne d'en-tête (les chemins des champs, dans l'ordre où ils apparaissent d'un document à l'autre), puis une ligne par document ; sous-document aplati en `a.b`, valeur Extended JSON en feuille, tableau en JSON, absent ou `null` vide ; le texte est neutralisé puis échappé, un nombre ou un booléen seulement échappé | `export-csv.spec` (les six vecteurs de balance, à la lettre) ; e2e ; pile |
| AC-4 | Les refus de la demande, **avant toute lecture** : `format` hors `json` / `csv` ⇒ 400 `FORMAT_NON_SERVI` ; CSV sans `objet` ⇒ 400 `OBJET_REQUIS` ; `objet` hors du plan ⇒ 422 `OBJET_INCONNU` ; chacun avec la liste servie dans `details` | `export-c13.spec` ; e2e ; pile |
| AC-5 | Puis l'état publié, en CSV comme en JSON : absent ou `NON_INSTALLE` ⇒ 403 `BILAN_NOT_ENTITLED`, aucune donnée lue ; tout autre état ⇒ 200 | `export-c13.spec` ; e2e ; pile |
| AC-6 | L'identité d'abord, en CSV comme en JSON : sans jeton 401 ; jeton d'utilisateur 403 `IDENTITE_DE_SERVICE_REQUISE` ; moteur d'une autre organisation 403 `ORGANISATION_HORS_JETON` ; rien de lu | e2e ; pile |
| AC-7 | **Une seule forme sur le poste** : pour les mêmes documents, bilan écrit l'octet que balance écrit (mêmes vecteurs, mêmes chaînes attendues) | `export-csv.spec` |
| AC-8 | Rien d'autre ne bouge : plans d'export et d'effacement, santé, `migrer`, import, effacement inchangés ; aucun module Nest, aucune dépendance, aucun Dockerfile | `git diff --stat` ; suites complètes |

## Contrat (annoncé avant le code)

**Route existante, ajouts seuls** : `GET /api/v1/instance/bilan/{organisationId}/export` (identité `MOTEUR` seule,
limitée à l'organisation du chemin, hors limite de débit, dans les deux espaces — inchangé).

- **Deux paramètres de requête neufs, facultatifs** :
  - `format` : `json` (défaut) | `csv` ;
  - `objet` : un objet du plan (`jeux-etats`, `snapshots-liasse`, `jeux-hypotheses`, `versions-hypotheses`,
    `mapping-overrides`, `exercices`, `reperes-analyse`, `audit-events`) ; **exigé en CSV** ; en JSON, il réduit `objets`
    à cet objet.
- **200 JSON** : l'enveloppe de 1075, inchangée (sans `objet` : les huit objets).
- **200 CSV** : `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment;
  filename="export-bilan-<objet>-<organisationId>.csv"`, `Content-Length`. Corps : BOM UTF-8 (`EF BB BF`), séparateur
  `;`, fin de ligne CRLF (après la dernière ligne aussi), échappement RFC 4180 (une cellule qui contient `;`, `"`, CR ou LF
  est entre guillemets, ses guillemets doublés). Ligne d'en-tête : les chemins des champs, dans l'ordre de leur première
  apparition d'un document à l'autre ; puis une ligne par document (ordre de l'export JSON : par `_id`). Un sous-document
  s'aplatit en `a.b` ; un objet à une seule clé en `$` (`$oid`, `$date`, `$numberDecimal`, `$numberLong`…) est une feuille
  (sa valeur) ; un tableau s'écrit en JSON dans sa cellule ; `{}` s'écrit `{}` ; absent ou `null` ⇒ vide. Une cellule de
  texte (noms de colonnes compris) qui commence par `=`, `+`, `-`, `@`, tabulation ou CR est préfixée d'une apostrophe,
  **puis** échappée ; un nombre, un booléen et une valeur `$number…` sont seulement échappés. Aucun document ⇒ le BOM et
  une ligne vide.
- **En-tête neuf, JSON et CSV** : `Cache-Control: no-store`.
- **Refus, dans cet ordre, rien de lu avant le dernier** : 401 (sans jeton) ; 403 `IDENTITE_DE_SERVICE_REQUISE` |
  `IDENTITE_DE_SERVICE_REFUSEE` | `ORGANISATION_HORS_JETON` (inchangés) ; **400 `FORMAT_NON_SERVI`**
  (`details.formatsServis: ['json', 'csv']`) ; **400 `OBJET_REQUIS`** (CSV sans `objet` ; `details.objetsServis`) ;
  **422 `OBJET_INCONNU`** (`details.objetsServis` ; code déjà à l'inventaire) ; 403 `BILAN_NOT_ENTITLED` (inchangé).
  **Deux codes neufs** à `CODES_REFUS_C13` : `FORMAT_NON_SERVI`, `OBJET_REQUIS` — ceux de balance (D-1021-13).
- **Ce qui ne change pas** : l'enveloppe JSON, les plans C13, la santé, `migrer`, l'import, l'effacement, le manifeste
  `bilan` (le chemin est celui qu'il déclare : rien à recopier au catalogue), aucun topic, aucune collection, aucun droit.
- **→ B (demande, journal de D)** : publier le contrat de l'export C13 dans `prospera-plateforme/contrats/instance/`, à
  la forme ci-dessus, servie à l'identique par balance (1021) et bilan (1140) ; les deux s'y rangeront par une recopie
  à l'octet.

## Décisions retenues par défaut (contestables)

- **D-1140-1 — La forme de balance, à la lettre** (D-1021-6 → 8) : mêmes paramètres, même ordre des refus, mêmes codes,
  même nom de fichier (au module près), mêmes en-têtes, mêmes règles de cellule. Le plan le demande (« une seule forme
  sur le poste ») ; s'en écarter ferait deux contrats pour un seul moteur.
- **D-1140-2 — Les règles du CSV recopiées, pas partagées.** Bilan n'a aucun CSV et aucune bibliothèque commune ne porte
  celles de balance (`fiscal/export-liasse.regles.ts`, qui sert aussi la liasse fiscale de C). Un module pur neuf,
  `instance-c13/export-csv.ts`, porte les cinq règles (BOM, `;`, CRLF, `echapperCsv`, `neutraliserFormule`, recopiées
  mot pour mot) et l'aplatissement de balance (`cellulesDe`, `objetEnCsv`). La spec reprend **les six vecteurs** de
  `balance-service/src/modules/instance-c13/export-csv.spec.ts` avec les mêmes chaînes attendues : un écart de forme
  rougit ici. Quand B publiera le contrat, les deux services s'y rangeront.
- **D-1140-3 — Un objet par fichier** (la raison de D-1021-7) : des collections différentes n'ont pas les mêmes colonnes,
  et une réponse HTTP n'a qu'un corps ; le moteur appelle la route une fois par objet (la liste est dans le JSON, et
  dans `details.objetsServis` d'un refus).
- **D-1140-4 — L'identité avant la demande, la demande avant l'état publié** : `exigerLeMoteur` d'abord (rien n'est dit
  de la forme à qui n'a pas le droit de demander), puis `format` / `objet` sans rien lire, puis la matrice de l'état
  publié, puis la lecture des seules étapes demandées.
- **D-1140-5 — `Cache-Control: no-store` sur le JSON aussi** (comme balance) : ce sont les données d'une organisation ;
  aucun cache intermédiaire ne les garde. Seul en-tête neuf.
- **D-1140-6 — Deux codes neufs** à `CODES_REFUS_C13` (`FORMAT_NON_SERVI`, `OBJET_REQUIS`) ; `OBJET_INCONNU` existe
  (import). Aucun code n'est inventé hors de ceux de balance.
- **D-1140-7 — Un paramètre répété ou vide est refusé, jamais deviné** : `format=` ou `format=csv&format=json` ⇒ 400
  `FORMAT_NON_SERVI` ; `objet=` en CSV ⇒ 400 `OBJET_REQUIS` ; `objet` répété ⇒ 422 `OBJET_INCONNU`. La casse compte
  (`CSV` ⇒ 400). C'est ce que fait balance.
- **D-1140-8 — Docker** : aucun module Nest, aucune dépendance, aucun Dockerfile ne change (§1.5 ne l'exige pas), mais le
  comportement de bout en bout de la route change : une pile `grp-d` (mongo, kafka, l'image `runtime`, un IdP de test
  RS256 qui sert son JWKS) joue le JSON, le CSV, les refus et l'état publié sur de vrais documents, sous le verrou.

- **D-1140-9 — Le contrat de B, recopié dans la même PR** (servi pendant la story : plateforme #41,
  `contrats-instance-v1.1`, d68a468). `export-c13-reponse.schema.json` et `export-c13-csv.cas.json` sont copiés **à
  l'octet** dans `instance-c13/contrat/` (sha256 dans `ORIGINE.json`, `copie.invariant` : huit copies, origine
  `contrats-instance-v1.1` dans `autresOrigines`) ; la réponse JSON est relue par Ajv contre le schéma ; les **huit cas** du
  CSV sont rejoués à l'octet par `objetEnCsv` (`export-csv.contrat.spec.ts`). Le seul écart de B à la forme annoncée,
  `organisationId` générique (1 → 64 caractères), est plus large : nos 24 hex y tiennent, rien ne change.

## Livraison

**prospera-bilan-service #195**, fusionnée en rebase le 2026-11-26 : **`dev` `c29fcc2`** (le CSV) puis **`7f96163`** (la
copie du contrat de B) ; `head` `f2186c9`, arbre de `dev` identique. Annonce avant le code : prospera-stories #953 (`main`
67efaf9). **Conforme à l'annonce, sans écart.**

- `instance-c13/export-csv.ts` (neuf, pur) : les règles de balance recopiées (`SEPARATEUR_CSV`, `FIN_DE_LIGNE_CSV`,
  `BOM_UTF8`, `echapperCsv`, `neutraliserFormule`) et l'aplatissement (`cellulesDe`, `objetEnCsv`).
- `export-c13.ts` : `exporter(organisationId, { format, objet })` ⇒ `ResultatDExport` (`json` : l'enveloppe ; `csv` : le
  fichier et son nom) ; refus de la demande avant l'état publié ; seules les étapes demandées sont lues ;
  `FORMATS_D_EXPORT`, `OBJETS_SERVIS`.
- `instance-c13.controller.ts` : `@Query('format')`, `@Query('objet')`, `@Res({ passthrough: true })`, `StreamableFile`
  pour le CSV, `Cache-Control: no-store` sur les deux ; Swagger (`ApiQuery`, `ApiProduces`).
- `refus.ts` : `FORMAT_NON_SERVI`, `OBJET_REQUIS`.
- `contrat/` : deux copies neuves, `ORIGINE.json`, `copie.invariant.spec.ts`, `validerReponseDExport`.
- Tests neufs : `export-csv.spec` (8 : les six vecteurs de balance à la lettre, les règles, un document à plusieurs
  niveaux), `export-c13.spec` (+21 : JSON inchangé, `objet` qui réduit et ne lit que lui, CSV et son nom, objet vide,
  cinq formats refusés, deux CSV sans objet, quatre objets inconnus, demande jugée avant l'état publié, état publié en CSV),
  `export-csv.contrat.spec` (11 : les huit cas de B à l'octet, le schéma JSON), e2e `instance-c13` (+3 : CSV et ses
  en-têtes, refus et état publié, identité).

## Preuves

| Preuve | Résultat |
|---|---|
| Node 24 (étage `verification`, image de l'archive LF de `e13d874`) — unitaires complets, deux passes `--shard` | **373/373 suites** : passe 1/2 187/187 (7 649 tests, 3 ignorés), passe 2/2 186/186 (5 168 tests, 3 ignorés) — **12 817 tests verts, aucun rouge** |
| Node 24 — e2e complets (`e13d874`) | **45/45 suites, 3 592/3 592** |
| Node 24 — `npm run build` | 0 |
| Node 24 — second commit (`f2186c9`) : `instance-c13`, `read-models`, `app-cablage` ; e2e `instance-c13` et `openapi-contract` | **52/52 suites (927 tests, 1 ignoré)** ; **2/2 suites, 608 tests** |
| Node 25 — `instance-c13` (unitaires) et e2e `instance-c13` | 13/13 suites (141) ; 38/38 |
| Pile `grp-d` (mongo 8.0 `rs0`, kafka 3.9.0, un IdP de test RS256 qui sert son JWKS, l'image runtime de `f2186c9`) | `/health` `ok` ; 0 `UnknownDependencies` sur 602 lignes de journal ; **15/15 cas** ci-dessous |
| Mutations (Node 25) | **32/32 tuées sur une assertion** ; sept réécrites parce que leur première forme ne compilait pas (`TS6133`, paramètre ou import devenu inutile : « 0 total » ou « 8 passed » sans la suite visée) |
| Lint des fichiers touchés, `tsc --noEmit` | 0 |
| Verrou Docker | attendu (B) ; pris à 07:26:41, rendu à 08:10:29 (trap) ; repris à 08:23:13 (après C), rendu à 08:27:59 ; B et C prévenus ; aucun conteneur, volume ni réseau `grp-d` |

**Les cas de la pile** (A `EN_SERVICE` avec deux repères, l'un à `tenantId` ObjectId, l'autre en chaîne ; B sans état
publié avec un repère ; C `NON_INSTALLE`) :

| Cas | Réponse |
|---|---|
| `GET …/A/export` | **200** JSON, huit objets, `reperes-analyse` 2 (rien de B), `Cache-Control: no-store` |
| `?objet=reperes-analyse` | **200** JSON, ce seul objet (2) |
| `?format=csv&objet=reperes-analyse` | **200** `text/csv; charset=utf-8`, `attachment; filename="export-bilan-reperes-analyse-<A>.csv"`, `Cache-Control: no-store`, `Content-Length: 465` ; octets `EF BB BF` ; en-tête `_id;tenantId;dossierId;indicateur;version;apres.statut;apres.sens;apres.bornes;motif;taux;le` ; bornes en JSON échappé ; le motif `=HYPERLINK("http://x";"clic")` écrit `"'=HYPERLINK(""http://x"";""clic"")"` ; `-12.50` (décimal) sans apostrophe ; cellules vides du second document |
| `?format=csv&objet=exercices` (aucun document) | **200**, `EF BB BF 0D 0A` |
| `?format=xml` ; `?format=csv` ; `?format=csv&objet=` | **400 `FORMAT_NON_SERVI`** (`formatsServis`) ; **400 `OBJET_REQUIS`** (`objetsServis`, huit) ; **400 `OBJET_REQUIS`** |
| `?format=csv&objet=balances-balance` ; `?objet=jeux_etats` | **422 `OBJET_INCONNU`** (`objetsServis`) ; **422 `OBJET_INCONNU`** |
| CSV de B (aucun état) ; de C (`NON_INSTALLE`) | **403 `BILAN_NOT_ENTITLED`** (`etatPublie: null`) ; **403 `BILAN_NOT_ENTITLED`** (`NON_INSTALLE`) |
| CSV sans jeton ; jeton d'utilisateur de A ; moteur de B sur A | **401** ; **403 `IDENTITE_DE_SERVICE_REQUISE`** ; **403 `ORGANISATION_HORS_JETON`** |
| `GET …/A/sante` | **200** `{"etat":"OK"}` |

La première pile (images de `e13d874`, 07:28) a démarré saine mais n'a rien enregistré : sous `MSYS_NO_PATHCONV=1`,
`curl.exe` n'écrit pas à un chemin `/c/…` (piège 1140-1) ; rejouée sur `f2186c9` avec des chemins Windows.

## Ce qui reste (hors story)

- **← B : le contrat — servi** (plateforme #41, d68a468) et recopié ici (D-1140-9). `balance-service` (C) peut s'y ranger
  à son tour (copie et cas) : information pour C, rien ne bloque.
- Un export volumineux se lit en un seul corps (comme balance) : pagination ou flux quand le contrat le dira ; une cellule
  CSV de plus de 32 767 caractères ne s'ouvre pas entière dans un tableur, le JSON reste la forme fidèle.
