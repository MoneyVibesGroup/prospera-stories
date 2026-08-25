# STORY-385 : Les pièces d'un dossier se lisent sans leurs enums ni ce que l'OCR en a tiré

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** écart remonté par **FE-064** *(les pièces du dossier)*, 2026-08-23 — prolonge **STORY-358**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done
**Complexité :** low
**Sprint :** 20
**Service :** `document-service` (`:3006`)

---

## Le constat — deux manques du même contrat de lecture

`GET /api/v1/dossiers/:dossierId/pieces` rend un `PieceDossierResponseDto` qui dit **qu'une lecture a
eu lieu**, jamais **ce qu'elle a lu** — et qui publie ses deux champs discriminants en **`string`
libre**.

### ① `type` et `statutOcr` ne sont pas des enums OpenAPI

```ts
@ApiProperty({ description: 'Type de pièce. Pièce de dossier : STATUTS | CARTE_CFE | …' })
type!: string;              // ← les valeurs sont dans la PROSE, pas dans le schéma
@ApiProperty({ description: "Statut d'extraction OCR : EN_COURS | PRETE | ECHEC, ou SANS_OCR…" })
statutOcr!: string;
```

Le client généré reçoit donc `string`, et **aucune garde d'exhaustivité n'est possible sur la
réponse** : le jour où une septième valeur de `type` apparaît, le front l'affichera sous un libellé
de repli — sans que rien ne rougisse nulle part. C'est **le défaut que STORY-375 vient de fermer sur
les codes d'erreur** *(« un code ajouté doit CASSER la compilation du client au lieu de tomber en
silence »)*, resté ouvert ici.

⚠️ **Les enums existent déjà côté serveur** — `TypePieceDossier`, le type des pièces comptables, et
les quatre statuts : ils sont d'ailleurs **correctement publiés sur les routes de DÉPÔT** de ce même
service. Seule la route de **lecture** les perd. FE-064 a donc dû poser sa garde sur les unions des
routes de dépôt, plus un repli explicite — une garde qui protège *à côté* de ce qu'elle vise.

### ② Rien ne relie une pièce à ce que l'OCR en a tiré

`statutOcr: 'PRETE'` dit que la lecture a réussi. Le DTO ne publie **ni les champs lus, ni le
`correlationId`** — c'est-à-dire rien qui permette de répondre à la question pour laquelle le cabinet
ouvre la pièce : *« d'où vient ce NIF ? »*.

Aller chercher la proposition chez `balance-service` n'est pas une alternative :
`GET /profil-societe/ocr/:extractionId` est **org-keyed**, son identifiant est le `correlationId`
(que la lecture ne publie pas), et la proposition **groupe les deux pièces d'un même dépôt** — elle
ne se rattache donc à aucune pièce en particulier.

**Conséquence** : FE-064 n'a pas pu livrer le §5 de son périmètre *(restitution « déclaré ↔ lu » par
pièce, composant de FE-018)*. Le brancher sur du vide aurait affiché un tableau de tirets, et **une
colonne à moitié servie se lit comme un fait** *(leçon FE-066)*.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **voir, pièce par pièce, ce que le système y a lu**,
afin de **justifier chaque donnée d'identité par le document dont elle vient — et pas seulement
savoir qu'une lecture a eu lieu**.

---

## Ce que la story doit livrer

- **`type` et `statutOcr` publiés en `enum`** sur `PieceDossierResponseDto` *(`@ApiProperty({ enum:
  … })`)*, comme ils le sont déjà au dépôt. ⚠️ Le `type` d'une pièce de dossier et celui d'une pièce
  comptable sont **deux enums distincts** que la liste fusionne : publier leur **union** est le
  livrable, pas en choisir un.
- **`correlationId`** sur la réponse — la clé de regroupement d'un même dépôt. Elle suffit à relier
  une pièce à la proposition de profil correspondante, sans nouveau modèle.
- **Les champs lus par pièce**, servis par ce service *(il les possède : c'est lui qui parse)* :
  au minimum `{ champ, valeurLue, confiance }`. ⚠️ **`document-service` est la bonne source** — le
  read-model de `balance-service` est org-keyed et groupé ; ré-agréger côté client reviendrait à
  reconstituer un lien que le producteur a déjà.
- ⚠️ **Aucun changement de contrat d'ÉVÉNEMENT** : `document.profil.extrait` reste tel quel *(P9,
  compat BACKWARD)*. Cette story n'ajoute que des champs **de lecture HTTP**, tous facultatifs pour
  les pièces déposées avant STORY-358.

---

## Acceptance Criteria

- [ ] `PieceDossierResponseDto.type` et `.statutOcr` sont des **enums** dans `/api/docs-json` ; le
      client régénéré obtient une **union**, et une valeur ajoutée côté serveur **casse la
      compilation** d'un `Record<Union, …>` côté front *(vérifié par mutation)*.
- [ ] La réponse porte le `correlationId` de la pièce.
- [ ] La réponse porte ce que l'OCR a lu, **par pièce**, avec sa confiance — **absent** *(et non
      vide)* pour une pièce `SANS_OCR`, `EN_COURS` ou `ECHEC` : « pas encore lu », « illisible » et
      « lu, rien trouvé » sont trois faits différents et ne se confondent pas.
- [ ] Non-régression : les pièces déposées **avant** STORY-358 restent listables *(champs
      facultatifs absents, jamais `null`)*.
- [ ] Non-régression : le chemin **KYC** n'est pas touché *(D2)*.

---

## Dépendances

**Prérequise :** **STORY-358** ✅.
**Consommateur :** **FE-064** *(livrée le 2026-08-23 — l'onglet affiche l'état de lecture ; la
restitution « déclaré ↔ lu » attend cette story)*, et **FE-018** dont le composant est déjà écrit.

---

## Note de provenance

Remontée par **FE-064**. Les deux manques sont regroupés **délibérément** : ils portent sur le même
DTO, et l'un sans l'autre laisserait le front avec des champs lus qu'il ne peut pas typer, ou des
types qu'il ne peut rien faire lire.

---

## Progress Tracking

| Phase | État | Preuve |
|---|---|---|
| Cadrage / branche | ✅ 2026-08-24 | branche `MNV-385` sur `docs/` et sur `prospera-ocr-service` |
| Développement | ✅ 2026-08-24 | 1 dépôt (`document-service`), aucun contrat d'événement touché |
| Portes DoD | ✅ 2026-08-24 | lint 0 warning · build OK · **594 unit** (99,14 % st. / 92,46 br. / 98,13 fn. / 99,18 li.) · **90 e2e** |
| Mutation-test | ✅ 2026-08-24 | **6 mutations, 6 rouges** (voir table ci-dessous) |
| Vérification docker | ✅ 2026-08-24, **rejouée sur l'état final** | stack neuve, 4 pièces réellement déposées, 4 états prouvés en base **et** sur le fil |
| Revue de code | ✅ 2026-08-24 | **1 constat retenu** (non-bloquant, confiance 90) + 2 coupes over-engineering + 1 JSDoc orphelin — tous corrigés |
| Revue de sécurité | ✅ 2026-08-24 | **0 vulnérabilité**, argument exécutable (voir ci-dessous) |
| Merge | ✅ 2026-08-24 | PR [ocr-service#14](https://github.com/MoneyVibesGroup/prospera-ocr-service/pull/14), **rebase-merge**, branche supprimée |

### Ce qui a été livré

- `type` et `statutOcr` publiés en **enum OpenAPI**, dérivés par `Object.values` de l'**union** des deux
  familles que la liste fusionne — `TypePieceDossier` ∪ `PieceDocumentType` (6 valeurs) et
  `ProfilExtractionStatut` ∪ `PieceExtractionStatut` (4 valeurs). **Dédoublonnées** : `EN_COURS`, `PRETE` et
  `ECHEC` existent des **deux** côtés, et un `enum` JSON Schema doublonné est invalide.
- `correlationId` publié sur la réponse (obligatoire : les deux schémas le portent depuis STORY-081/084).
- `champsLus: [{ champ, valeurLue, confiance }]` — **absent** tant que la pièce n'a pas été lue.

### ⚡ Le point qui ne se voyait qu'en base : `finaliser` écrit `champs` AUSSI en `ECHEC`

Publier `doc.champs` tel quel aurait rendu **`[]`** pour une pièce illisible — c'est-à-dire exactement la
forme qui signifie « lu, rien trouvé ». C'est le **statut** qui décide, jamais la présence du tableau. Les
trois faits sont désormais distincts, et la distinction est prouvée sur données réelles (lecture 1 / 2
ci-dessous).

### Mutation-test — 6 mutations, 6 rouges

| # | Mutation | Effet attendu | Constaté |
|---|---|---|---|
| M1 | union de `type` amputée à 2 valeurs sur 6 | e2e OpenAPI rouge | 1 échec / 7 |
| M2 | `estLue` rend toujours vrai *(sans casser la compilation)* | unit rouge | 6 échecs / 30 |
| M3 | `new Set` du dédoublonnage des statuts retiré | unit **et** e2e rouges | 1/30 puis 1/7 |
| M4 | garde de statut **inversée** dans `champsLus()` | unit rouge | 8 échecs / 30, **9 / 31** après le renfort de la revue |
| M5 | `correlationId` ne traverse plus la projection | unit rouge | 2 échecs / 30 |
| M6 | `type: [ChampLuDto]` retiré *(→ `object` opaque)* | e2e OpenAPI rouge | 3 échecs / 7 |

🪤 **Deux mutations ont d'abord viré au rouge PAR ERREUR DE COMPILATION** (import devenu inutilisé) — ce qui
ne prouve rien, leçon STORY-179. Elles ont été rejouées sous une forme qui **compile** (M2 : `estLue` rend
vrai en gardant `STATUTS_LUS` utilisé ; M4 : garde inversée plutôt que supprimée). C'est seulement à ce
moment-là que le rouge a eu une valeur.

🪤 Et une `git checkout <fichier>` de restauration après mutation a **effacé le DTO** — le fichier n'était
pas encore indexé, donc `checkout` l'a ramené à `dev`, pas à mon état. ⇒ **committer avant de muter**.

### Vérification docker — stack neuve (`down -v`), parcours réel

| # | Point vérifié | Résultat |
|---|---|---|
| 1 | Cabinet créé via l'IdP, JWT RS256 `TENANT_ADMIN`, dossier du cabinet **projeté par Kafka** dans `document_service.dossiers_dossier` | ✅ 1 doc |
| 2 | **4 pièces réellement déposées**, les deux familles : `STATUTS` (PNG) → `PRETE`, `STATUTS` (PDF) → `ECHEC`, `LETTRE_MISSION` → `SANS_OCR`, `FACTURE` → `PRETE` | ✅ |
| 3 | En base, la pièce `ECHEC` porte bien **`champs: []`** — le cas piège existe pour de vrai | ✅ |
| 3 bis | **Rejoué après revue** : `ECHEC` **sous-seuil** (confiance 0,19) portant en base **2 champs LUS** (`nif=1O00l23456`, `raisonSociale=ACNE SARI`) → `champsLus` **toujours absent** du fil | ✅ |
| 4 | Réponse HTTP : `type` porte les valeurs des **deux** familles (`STATUTS`, `LETTRE_MISSION`, `FACTURE`) | ✅ |
| 5 | Réponse HTTP : `correlationId` présent sur **les 4** lignes | ✅ |
| 6 | `champsLus` = **7 champs réels lus par Tesseract** sur les 2 pièces `PRETE` *(`raisonSociale`, `capitalSocial`, `dirigeant`… / `montantTTC`, `nifEmetteur`…)* | ✅ |
| 7 | `champsLus` **ABSENT** pour `SANS_OCR` **et** pour `ECHEC` — malgré `champs: []` en base | ✅ |
| 8 | `PRETE` forcé avec `champs: []` → `champsLus: []` : « lu, rien trouvé » ≠ « illisible » ≠ « pas encore lu » | ✅ |
| 9 | `/api/docs-json` **vivant** : `type` = 6 valeurs, `statutOcr` = 4 valeurs sans doublon, `champsLus` = `array` de `$ref ChampLuDto`, **hors** de `required` | ✅ |
| 10 | Non-régression pré-STORY-358 (`nomOrigine`/`deposePar`/`createdAt` retirés) : la ligne reste rendue, **aucune valeur `null`**, les clés sont simplement absentes | ✅ |
| 11 | **D2** — `document_extractions` (KYC) intouchée, aucun document n'y porte de `dossierId` | ✅ |
| 12 | Ni `brut` *(fragment OCR source)* ni `zone` n'apparaissent **nulle part** dans la réponse entière | ✅ |

### Revue de sécurité — 0 vulnérabilité, et l'argument est EXÉCUTABLE

Le point qui porte tout le reste : **le plafond de divulgation était déjà atteint avant cette story.** La
réponse publiait **déjà** `urlConsultation` — une URL MinIO **présignée** sur le document **original**,
servie à *chaque* ligne depuis STORY-358. `champsLus` est donc un **sous-ensemble strict, dérivé par
regex, de ce que le même appelant pouvait déjà télécharger en entier, dans la même réponse HTTP, sous la
même garde**. Le plancher de permission ajouté est **vide** — ce n'est pas une opinion, c'est vérifiable
en ouvrant l'URL que la ligne d'à côté porte déjà.

Corollaire, et il compte : la limite connue « un `TENANT_USER` de l'organisation **non affecté** au dossier
passe » (STORY-236/357) **n'est pas aggravée**. Cet utilisateur-là obtient déjà le PDF des statuts.

Instruit et écarté par ailleurs : `correlationId` n'ouvre rien *(la route d'aval de `balance-service` est
org-keyed et exige `@RequiresBalanceAccess`, et il n'entre dans aucune clé MinIO devinable — l'UUID
terminal reste)* · `zone` et `brut` ne fuient nulle part *(mapping explicite par déstructuration, aucun
spread, aucun `ClassSerializerInterceptor`)* · `DossierGate`, le refiltrage `orgId` en base et les codes
d'erreur sont **intacts** · aucune matière OCR en journal *(`autoLogging: false`, l'intercepteur n'écrit
que méthode/URL/statut/durée)*.

### Revue de code — 1 constat retenu, et il portait sur ce que j'avais ÉCRIT, pas sur ce que le code FAIT

**C1 (non-bloquant, confiance 90)** — mon commentaire affirmait « `finaliser` écrit `champs` aussi sur une
extraction `ECHEC` *(une pièce illisible rend une liste vide)* », et le test ne montait que cette
forme-là : `champs: []`. **Faux pour le chemin d'échec le plus courant.** Vérifié dans les deux
processeurs :

```ts
const champs = this.parsers.parse(this.resolveType(data.type), ocr);
const statut = ocr.confiance < SEUIL_CONFIANCE_ECHEC ? ECHEC : PRETE;   // seuil = 0,3
await this.finaliser(eventId, data, champs, ocr.confiance, statut);
```

Une photo floue à 0,22 de confiance est finalisée **`ECHEC` avec les champs que le parseur a quand même
produits** — un NIF lu `1O00l23456` est bel et bien en base. Le code était **juste** *(c'est le statut qui
décide)* ; c'est la **preuve** qui était faible et la **prose** qui était fausse. Corrigé : le test monte
désormais des champs non vides *(l'échec dur garde son propre test)*, le commentaire dit ce que la garde
protège vraiment — **ne pas afficher au cabinet une valeur que le système vient lui-même de juger non
fiable** — et le point 3 bis de la vérification docker le prouve sur données réelles.

**Lentille over-engineering** *(seconde passe, report-only)* — 5 coupes proposées, **2 appliquées** :
interface à un seul usage inlinée, `map` déstructurée. **3 déclinées et pourquoi** : le `new Set` sur les
*types* *(prospectif assumé — `TypePieceDossier` est déclaré comme un sur-ensemble qui grossit, et un `enum`
JSON Schema doublonné casse les générateurs de client)* ; `estLue` réduit à une comparaison littérale *(la
version courte suppose que les deux familles nommeront toujours leur succès `PRETE` — le jour où l'une
renomme, la comparaison cesse de reconnaître cette famille-là, sans erreur nulle part)* ; le test « aucune
valeur étrangère » *(il rougirait si quelqu'un recopiait la liste à la main plutôt que de la dériver —
c'est précisément la récidive que la story empêche)*.

⚠️ **Écart d'infrastructure rencontré, hors périmètre** : dans l'image docker, l'OCR d'un **PDF** échoue sur
`Cannot find module '@napi-rs/canvas'` (`pdf-page-renderer`). La dépendance est bien déclarée mais absente de
l'image. Sans effet sur cette story — le chemin PNG fonctionne, et l'échec a même **fourni** le cas `ECHEC`
réel dont la story avait besoin — mais **le rendu PDF est mort en docker** : ouvert en **STORY-396** *(la panne y est instruite pour ce
qu'elle est vraiment — un défaut de SERVICE rendu au cabinet sous le statut d'un défaut de PIÈCE)*.
