# STORY-088 : Profil d'import & mapping de colonnes réutilisable

**Epic :** EPIC-021 — Hub multi-source (D13) : adaptateur #2 (import fichier)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A14 · STORY-086 (import Sage — amorce la structure `SageImportProfile`)
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** medium
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 17 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A14 (profil d'import & mapping de colonnes)

> **Ce qui rend l'import fichier utilisable au-delà du seul format Sage standard.** STORY-086 sait lire l'export « Balance des comptes » de **Sage 100**. Mais un cabinet gère des clients avec des exports **hétérogènes** : autres logiciels, versions anciennes, colonnes renommées, fichiers Excel bricolés. Plutôt que d'écrire un parser par format (dette sans fin), cette story rend le mapping **configurable et mémorisable** : le comptable **désigne une fois** quelle colonne est le compte, laquelle est le débit — et le **profil est réutilisé** aux imports suivants.

---

## User Story

En tant que **cabinet comptable** important des balances de **provenances variées**,
je veux **désigner une fois** la correspondance entre les colonnes de mon fichier et les champs attendus, puis **enregistrer ce mapping**,
afin que **les imports suivants du même format soient automatiques**, sans redemander le mapping ni écrire un parser dédié.

---

## Description

### Contexte

L'import Sage (STORY-086) suppose un fichier **conforme** au format « Balance des comptes » de Sage 100 (colonnes : *Numéro compte*, *Intitulé*, mouvements N-1, mouvements période, **soldes cumulés** D/C). Dans la réalité d'un cabinet :

- un client exporte depuis un **autre logiciel** (colonnes différentes) ;
- un autre a **renommé** ou **réordonné** les colonnes ;
- un troisième fournit un **Excel retravaillé** à la main.

Écrire un parser par cas est intenable. La solution standard : un **profil d'import** = un mapping `colonne du fichier → champ du contrat`, **nommé, mémorisé, réutilisable**, avec **détection automatique** quand le format est reconnu.

> **Le mapping ne dispense d'aucun contrôle.** Une fois les colonnes mappées, le fichier passe **exactement** les mêmes validations que tout le reste (équilibre FR-A25, doublons, format de compte — `BalanceValidator`, STORY-101). Un mapping ne « force » jamais une balance à passer.

### Périmètre

**Inclus :**

- **Modèle `ProfilImport`** (collection `profils_import`, keyée `orgId`) :
  - `nom` (« Sage 100 standard », « Export client Kossi »), `formatFichier` (`XLSX` | `CSV`), `separateur?` (`,` / `;`), `encodage?`, `ligneEntete` (n° de ligne des en-têtes), `ligneDebutDonnees`.
  - **`mappingColonnes`** : `{ compte, libelle, debiteur?, crediteur?, soldeNet?, ... }` → chaque champ pointe vers un **nom de colonne** ou un **index**.
  - `signature` : empreinte des en-têtes (permet la **détection automatique** au prochain import).
  - `actif`, `derniereUtilisation`.
- **Assistant de mapping** (`POST /api/v1/imports/analyser`) :
  - Upload d'un fichier → **200** `{ colonnesDetectees: [...], apercu: [5 lignes], mappingPropose, profilReconnu? }`.
  - **Détection automatique** : si la `signature` des en-têtes correspond à un profil existant → **profil proposé** (l'humain confirme).
  - **Proposition heuristique** sinon : reconnaissance par mots-clés (« compte », « n° compte », « débit », « crédit », « solde », « intitulé », « libellé ») — **toujours modifiable**.
- **CRUD des profils** (`@RequiresBalanceAccess`, isolation `orgId`) :
  - `POST /api/v1/imports/profils` → **201** ; `GET` (liste) ; `PATCH` ; **désactivation** (pas de suppression dure si des balances en dépendent — traçabilité).
- **Import via profil** — **extension de STORY-086** :
  - `POST /api/v1/balance/import` accepte désormais `profilImportId?` (à défaut : format Sage standard, comportement actuel **inchangé**).
  - Sémantique **inchangée** : **dry-run (défaut) → 200** (aperçu + warnings, aucune persistance) ; **`dryRun=false` → 201** (persiste via `BalanceRepository`).
- **Deux conventions de montants supportées** :
  - **Débit/Crédit séparés** (2 colonnes) — cas Sage ;
  - **Solde net signé** (1 colonne : positif = débiteur, négatif = créditeur) — cas fréquent des exports simplifiés → converti en `debiteur`/`crediteur` à la normalisation.
- **Validation du mapping** : un mapping **incomplet** (pas de colonne « compte », ni montant exploitable) → **400** explicite (`MAPPING_INCOMPLET`, champs manquants listés).
- **Traçabilité (NFR-A07)** : chaque balance importée conserve le **`profilImportId`** et la **`signature`** du fichier → on sait **comment** elle a été lue.
- **Tests** : analyse d'un fichier → colonnes détectées + mapping proposé ; **détection automatique** d'un profil déjà enregistré (signature) ; mapping manuel → import correct ; **solde net signé** → conversion D/C correcte ; mapping incomplet → **400** ; profil réutilisé au 2ᵉ import (aucune ressaisie) ; isolation `orgId` (un profil n'est **jamais** visible d'une autre org) ; **les contrôles FR-A25 s'appliquent quel que soit le profil**.

**Hors périmètre :**

- **Parser Sage standard** → **STORY-086** (CORE) : cette story l'**étend**, elle ne le remplace pas.
- **OCR d'un PDF** → hors périmètre (STORY-086 renvoie vers un export Excel/CSV).
- **Partage de profils entre organisations** (bibliothèque globale de formats) → **hors v1** ; un profil est **propre à l'org** (isolation). *(Une bibliothèque partagée gérée en admin serait une évolution naturelle.)*
- **Mapping des cahiers/OCR** → STORY-084/085 (autre mécanique).

### Flux

1. Le cabinet reçoit un export d'un **logiciel inconnu** (colonnes : *Cpte*, *Désignation*, *Solde*).
2. `POST /imports/analyser` → **200** : colonnes détectées, aperçu de 5 lignes, **mapping proposé** par heuristique (`Cpte → compte`, `Désignation → libelle`, `Solde → soldeNet`), **aucun profil reconnu**.
3. Le comptable **ajuste** (rien à corriger ici) et **enregistre** le profil : « Export client Kossi » → **201**.
4. Il lance l'import avec `profilImportId` → **dry-run 200** : aperçu, `Σ D = Σ C` ✔, 2 avertissements (comptes sans libellé).
5. Il confirme (`dryRun=false`) → **201** : balance persistée (STORY-101), avec `profilImportId` **tracé**.
6. **L'année suivante**, même fichier : `POST /imports/analyser` **reconnaît la signature** → profil « Export client Kossi » **proposé automatiquement** → import en **un clic**.

---

## Acceptance Criteria

- [ ] **`ProfilImport`** persisté (keyé `orgId`) : nom, format, séparateur/encodage, lignes d'en-tête/données, **`mappingColonnes`**, **`signature`**.
- [ ] **`POST /imports/analyser`** → **200** `{ colonnesDetectees, apercu, mappingPropose, profilReconnu? }` — **aucune persistance**.
- [ ] **Détection automatique** : si la **signature** des en-têtes correspond à un profil existant de l'org → **profil proposé** (confirmation humaine requise, jamais appliqué en silence).
- [ ] **Proposition heuristique** par mots-clés (compte / libellé / débit / crédit / solde) — **toujours modifiable**.
- [ ] **CRUD profils** (gate) : `POST` **201**, `GET`, `PATCH`, **désactivation** (pas de suppression dure si des balances y référent).
- [ ] **Import via profil** : `POST /balance/import` accepte `profilImportId?` ; **sans profil → comportement Sage standard inchangé** (non-régression STORY-086).
- [ ] **Sémantique HTTP inchangée** : dry-run (défaut) → **200** (aucune persistance) ; `dryRun=false` → **201** (persiste).
- [ ] **Deux conventions de montants** : **débit/crédit séparés** **et** **solde net signé** (positif = débiteur, négatif = créditeur) → converties correctement.
- [ ] **Mapping incomplet** (pas de compte ou pas de montant exploitable) → **400** `MAPPING_INCOMPLET` avec les champs manquants.
- [ ] **Les contrôles s'appliquent quel que soit le profil** : `BalanceValidator` (équilibre FR-A25, doublons, format de compte) — un mapping ne « force » **jamais** une balance à passer (test dédié : mapping valide + balance déséquilibrée → **rejet**).
- [ ] **Isolation** : un profil d'import n'est **jamais** visible d'une autre organisation (test e2e).
- [ ] **Traçabilité** : la balance importée conserve `profilImportId` + `signature` du fichier.
- [ ] **Réutilisation** : au 2ᵉ import du même format, **aucune ressaisie** du mapping (test).
- [ ] **Tests** : analyse, détection par signature, mapping manuel, solde net signé, mapping incomplet (400), contrôles appliqués, isolation, réutilisation. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Modèle

```typescript
export interface ProfilImport {
  orgId: string;                       // isolation stricte — jamais partagé entre orgs (v1)
  nom: string;                         // « Export client Kossi »
  formatFichier: 'XLSX' | 'CSV';
  separateur?: ',' | ';';
  encodage?: 'utf-8' | 'latin1';
  ligneEntete: number;                 // 1-based
  ligneDebutDonnees: number;

  mappingColonnes: {
    compte: string | number;           // nom de colonne OU index
    libelle?: string | number;
    // Convention A : débit/crédit séparés (Sage)
    debiteur?: string | number;
    crediteur?: string | number;
    // Convention B : solde net signé (positif = débiteur, négatif = créditeur)
    soldeNet?: string | number;
  };

  signature: string;                   // hash des en-têtes → détection auto
  actif: boolean;
  derniereUtilisation?: Date;
}

db.profils_import.createIndex({ orgId: 1, nom: 1 }, { unique: true });
db.profils_import.createIndex({ orgId: 1, signature: 1 });
```

### Normalisation — les deux conventions de montants

```typescript
normaliserMontants(row: Record<string, unknown>, m: MappingColonnes): { debiteur?: number; crediteur?: number } {
  // Convention A — colonnes séparées (Sage)
  if (m.debiteur != null || m.crediteur != null) {
    const d = toXof(row[m.debiteur as string]);
    const c = toXof(row[m.crediteur as string]);
    return { debiteur: d || undefined, crediteur: c || undefined };
  }

  // Convention B — solde net signé
  if (m.soldeNet != null) {
    const net = toXof(row[m.soldeNet as string]);
    return net >= 0 ? { debiteur: net } : { crediteur: Math.abs(net) };
  }

  throw new BadRequestException({ code: 'MAPPING_INCOMPLET', manquants: ['debiteur/crediteur ou soldeNet'] });
}
```

### Un mapping ne force jamais une balance à passer

```typescript
// Après application du mapping, on passe par le MÊME validateur que toutes les sources.
const balance = this.normalizer.normalize(lignes, profil);
await this.balanceValidator.validate(balance);   // FR-A25 : Σ D = Σ C — non négociable
```

---

## Décisions de cadrage (arrêtées à l'ouverture du dev, 2026-07-29)

Le cadrage du 2026-07-12 a été écrit **avant** la livraison de STORY-086 : trois points sont
recalés sur le code réellement en place.

- **D-088-1 — Route d'import.** STORY-086 a livré `POST /api/v1/balance/import/sage`, pas
  `POST /api/v1/balance/import`. Les deux existent désormais : `@Post('sage')` reste **inchangé**
  (non-régression 086, parsing Sage standard, aucun profil) et un `@Post()` **générique** est ajouté
  sur le même contrôleur → `POST /api/v1/balance/import`, qui accepte `profilImportId?` et **retombe
  sur le parsing Sage standard quand il est absent** — exactement la sémantique de l'AC. Un seul
  orchestrateur derrière les deux : les contrôles ne sont écrits qu'une fois.
- **D-088-2 — `profils_import` remplace l'amorce `sage_import_profiles`.** STORY-086 avait provisionné
  la collection `sage_import_profiles` en **hook inerte** (« le mapping assisté est le périmètre de
  STORY-088 »), avec une forme `(orgId, source, profilNom, mappingColonnes: Record<string,string>)`
  incompatible avec le modèle que cette story spécifie (index `(orgId, nom)` unique +
  `(orgId, signature)`, mapping `string | number`, format/séparateur/encodage/lignes). Le hook est
  **retiré** au profit de `profils_import` : aucune écriture n'a jamais eu lieu dessus (vérifié en
  docker en 086), il n'y a donc **rien à migrer**. Laisser deux schémas concurrents serait le vrai
  risque.
- **D-088-3 — `source` reste `sage`.** `SOURCES_BALANCE = ['sage', 'direct', 'ocr']` désigne les **trois
  branches du hub**, pas les logiciels : `sage` est la branche « **import fichier** ». Un import par
  profil (fichier d'un autre logiciel) reste donc `source: 'sage'`. Ajouter une valeur d'énumération
  casserait le checksum, la clé d'idempotence `(orgId, exercice, source, version)` et le contrat
  `balance.created` (STORY-099) — hors périmètre, sans bénéfice. C'est `profilImportId` + `signature`
  qui portent la provenance fine (NFR-A07).
- **D-088-4 — Traçabilité par marquage interne.** `profilImportId` et `signatureFichier` rejoignent
  `origine`/`balanceSourceId` dans `MarquageBalance` — le canal **interne** de `BalanceService`, sans
  contrepartie dans `SubmitBalanceDto`. Un client HTTP ne doit pas pouvoir **déclarer** avec quel profil
  sa balance a été lue : la trace serait un champ libre au lieu d'une preuve. Le `checksum` ne couvrant
  que `exercice/source/referentiel/version/lignes`, ces deux champs s'ajoutent **sans** migration ni
  changement de contrat.
- **D-088-5 — Suppression d'un profil.** `DELETE /imports/profils/:id` ne supprime **dur** que si
  **aucune** balance ne référence le profil ; sinon **409 `PROFIL_REFERENCE`** qui aiguille vers la
  désactivation (`PATCH { actif: false }`). C'est la lecture littérale de « pas de suppression dure si
  des balances en dépendent » : la trace `profilImportId` d'une balance persistée ne doit jamais devenir
  un identifiant orphelin.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| Un mapping erroné produit une balance fausse **mais équilibrée** | L'**aperçu (dry-run 200)** est obligatoire avant persistance ; le comptable **voit** les 5 premières lignes mappées |
| Détection automatique appliquée en silence | Le profil reconnu est **proposé**, jamais appliqué sans confirmation |
| Mapping incomplet → import silencieusement partiel | **400 `MAPPING_INCOMPLET`** avec les champs manquants listés |
| Un mapping « contourne » les contrôles | **Impossible** : `BalanceValidator` s'applique **après** le mapping, identique pour toutes les sources (test dédié) |
| Fuite de profils entre organisations | Isolation `orgId` stricte (test e2e) ; pas de bibliothèque partagée en v1 |
| Suppression d'un profil utilisé → balance non explicable | **Désactivation** au lieu de suppression ; `profilImportId` conservé sur la balance |
| Séparateur/encodage FR (`;`, latin1) mal détecté | Paramétrables dans le profil ; détection proposée, corrigeable |

---

## Definition of Done

- [ ] Modèle `ProfilImport` + index (orgId+nom unique, orgId+signature)
- [ ] `POST /imports/analyser` (colonnes, aperçu, mapping proposé, profil reconnu)
- [ ] Détection automatique par **signature** (proposée, jamais imposée)
- [ ] CRUD profils + désactivation (pas de suppression si référencé)
- [ ] Import via `profilImportId` ; **sans profil → Sage standard inchangé** (non-régression 086)
- [ ] Deux conventions de montants (D/C séparés **et** solde net signé)
- [ ] `MAPPING_INCOMPLET` → 400 explicite
- [ ] **Contrôles FR-A25 appliqués quel que soit le profil** (test : mapping valide + balance déséquilibrée → rejet)
- [ ] Isolation inter-org (e2e) ; traçabilité (`profilImportId` + `signature` sur la balance)
- [ ] Réutilisation sans ressaisie au 2ᵉ import
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte

---

## Progress Tracking

- **2026-07-29 — `in_progress`** : branche `MNV-088` ouverte sur `docs/` (base `main`) et sur
  `balance-service` (base `dev`). Cadrage recalé sur le code livré par STORY-086 (décisions
  D-088-1 à D-088-5 ci-dessus).

- **2026-07-30 — `done`** : livrée (PR #20 `prospera-balance-service`, `MNV-088` → `dev`, *Rebase and
  merge*, branche supprimée). 3 commits : implémentation, correctifs de revue de code, correctif du
  filtre `?actif`.

### Livré

Module `src/modules/balance/imports/` : `ProfilImport` (collection **`profils_import`**, keyée
`orgId`, index `(orgId, nom)` unique + `(orgId, signature)`) · `POST /api/v1/imports/analyser`
(200, aucune écriture : colonnes, aperçu 5 lignes, mapping heuristique, profil reconnu par
signature) · CRUD `/api/v1/imports/profils` (POST 201 · GET liste avec filtre `actif` / détail ·
PATCH dont désactivation · DELETE 204 si non référencé, **409 `PROFIL_REFERENCE`** sinon) ·
`POST /api/v1/balance/import` générique acceptant `profilImportId?` **à côté** de
`/balance/import/sage` inchangé · deux conventions de montants (D/C séparés **et** solde net signé) ·
traçabilité `profilImportId` + `signatureFichier` sur la balance via `MarquageBalance`.

La lecture de fichier tabulaire (XLSX/CSV, refus PDF, séparateur/encodage) est **extraite** dans
`imports/fichier-tabulaire.ts` et **partagée** par les deux parsers : un même octet est lu de la même
façon quelle que soit la route emprunée.

### Ce que la story n'avait pas prévu

- **⚠️ `/^total/i` ne reconnaît pas « Totaux »** — le libellé français le plus courant. La ligne était
  importée **comme un compte**, gonflant débit **et** crédit du même montant : la balance restait
  **parfaitement équilibrée**, et ni FR-A25, ni le checksum, ni aucun contrôle existant ne pouvait la
  rejeter. Seul l'aperçu dry-run l'aurait révélée, à condition de regarder. Défaut **préexistant à
  STORY-086**, corrigé par un prédicat `estLigneDeTotal` partagé par les deux parsers.
- **⚠️ La signature doit être dérivée côté serveur.** L'accepter du client, c'est accepter qu'elle soit
  calculée autrement : le profil s'enregistre sans erreur puis n'est **jamais** reconnu. Corollaire :
  `separateur`/`encodage` doivent être paramétrables **dès `/analyser`**, sinon un export FR `latin1`
  analysé en `utf-8` fige une signature abîmée qui ne correspondra plus à celle calculée à l'import
  (leçon STORY-139, même famille).
- **⚠️ `class-transformer` peuple *toutes* les propriétés déclarées du DTO** : les champs optionnels
  omis arrivaient présents et vides, et Mongoose les écrivait en `null`. Le profil stocké portait
  `debiteur: null, crediteur: null` à côté d'un `soldeNet` renseigné — un document qui ne dit plus
  quelle convention il porte. `nettoyerMapping` les retire ; le filtre doit tester `!== undefined &&
  !== null` et **jamais** la falsyness, sinon l'index de colonne **0** disparaît.
- **⚠️ Le hot-reload a menti.** `nest --watch` affichait « Found 0 errors » en exécutant encore
  l'ancien module : le correctif ci-dessus semblait sans effet en base. Pire, la réponse du `POST`
  paraissait **propre** pour une raison sans rapport — `JSON.stringify` omet les `undefined`, alors
  que le `GET` (qui relit la base) montrait les `null`. `docker restart` avant de conclure.

### Constats de revue de code (⑥, `opus`, corrigés avant merge)

1. **`PATCH` acceptait un mapping que `POST` refuse.** Sans `colonnes` dans le corps, aucun contrôle
   n'était joué : `{ compte }` seul était enregistré en 200 puis échouait en 400 sur **chaque** import
   — la fausse assurance que la création prend soin d'éviter. ⇒ `validerStructureMapping` (contrôle
   structurel jouable sans en-têtes) ; deux niveaux désormais.
2. **`/analyser` annonçait un montant manquant alors qu'il venait de le trouver.** Dès que `compte`
   était absent, le diagnostic court-circuitait vers une liste figée : sur `zzz;Solde`, l'heuristique
   proposait `soldeNet: 'Solde'` et le comptable lisait pourtant « désignez une colonne de montant ».
   ⇒ diagnostic toujours délégué à `resoudreMapping`.

### Revue de sécurité (⑦, `opus`, en session)

**Aucune vulnérabilité exploitable** (commentaire publié sur la PR #20). Points **sondés sur la stack
docker**, pas seulement lus : mass-assignment de `orgId`/`signature`/`actif`/`_id` → 400 · opérateurs
Mongo dans `mappingColonnes` et en query string → 400 · `__proto__` écarté sans pollution · fichiers
traités **en mémoire seule** (aucun chemin construit depuis `originalname`) · `limits.files: 1`
**ajouté** à `/balance/import/sage` qui ne bornait que la taille · SHA-256 = empreinte de format,
jamais un contrôle d'autorisation.

**Contrat inter-services vérifié explicitement** — un débordement en aurait fait un changement à
**2 dépôts** : `profilImportId`/`signatureFichier` **ne fuient pas** dans `balance.created` (le mapper
`buildBalanceCreatedEvent` est une liste blanche ; payload observé sur le fil sans ces champs). Contrat
v1 intact, PR mono-dépôt.

Un **défaut de correction** est sorti de ce sondage : **`?actif=false` listait les profils ACTIFS** et
`?actif=nimportequoi` passait pour `true`, sans erreur — `Boolean("false") === true` sous
`enableImplicitConversion`. Corrigé par un `@Transform` lisant l'objet **brut** (`obj`, pas `value`
déjà coercé) : l'idiome était **déjà posé** par `ListerCategoriesQueryDto` (STORY-083), je ne l'avais
pas réutilisé. Ce n'était pas une faille (filtre org-scopé, aucune valeur non primitive n'atteint
Mongo).

### Qualité

Lint 0 warning · build OK · **1498 unit + 319 e2e** verts · couverture
**99.08 / 92.82 / 98.36 / 99.06** (module `imports` : 99.7 / 93 / 100 / 100) — seuils 65/90/90/90.

**Mutation-tests : 12 mutations jouées, toutes rouges après correction de 3 tests non filtrants.**
Les trois valaient le détour : la garde d'en-tête restait invisible parce que le montant de la ligne
d'en-tête se parse à **0** (donc comptée en « compte sans mouvement » — c'est ce compteur qui prouve
la garde) ; la traçabilité était assertée **en amont** de `buildCanonique` ; et distinguer
`actif=true` de `actif=false` exige **deux profils d'états opposés** (avec un seul, les deux filtres
renvoient la même chose et le test ne peut pas échouer). À noter : retirer `orgId` d'un filtre du
repository est un **échec de compilation** (TS6133, le paramètre devient inutilisé) — garde plus forte
qu'un test, mais qui ne dispense pas d'asserter la **forme** du filtre (mutation « `orgId` filtré en
chaîne au lieu d'ObjectId », leçon STORY-141).

### Vérification docker — stack NEUVE (`down -v`), 12/12 + isolation

Analyse sans écriture · **signature identique analyse↔profil** · détection automatique par signature ·
dry-run **200 sans persistance** · persist **201** avec `profilImportId` **en ObjectId** (le cast
conditionne le comptage de références) · **solde net négatif → créditeur** (150000 en unités mineures)
· ligne « Totaux » **écartée** · `derniereUtilisation` posée après commit seulement · réutilisation
v1→v2 sans ressaisie · `MAPPING_INCOMPLET` **400** avec `details.manquants` · déséquilibre **422 sans
orphelin** (`balances` **et** `outbox_events` inchangés) · non-régression `/sage` (aucune trace de
profil, « Totaux » écartée) · **409 `PROFIL_REFERENCE`** puis désactivation → **409 `PROFIL_INACTIF`**
→ réactivation OK · profil désactivé **plus proposé** mais toujours **lisible** · index partiel
`(orgId, profilImportId)` présent.

**Isolation inter-organisations** (deux orgs réelles amorcées sur l'IdP) : liste vide, **404** sur
détail / PATCH / DELETE / import, profil de la victime intact après les tentatives, **aucune
reconnaissance cross-tenant à signature identique**, et deux orgs peuvent porter un profil **du même
nom** (unicité keyée `orgId`).

### Risque résiduel assumé

Fenêtre **TOCTOU** étroite entre le comptage des balances référentes et la suppression dure d'un
profil : au pire une référence d'audit pointant vers un profil supprimé, **au sein d'une même
organisation sur ses propres données**. Aucune frontière de confiance franchie, aucun privilège gagné.
La corriger proprement demanderait à l'import de re-vérifier le profil **dans sa propre transaction** —
disproportionné pour 3 points.

### Hors périmètre (confirmé)

Parser Sage standard (STORY-086) · OCR PDF · **bibliothèque de profils partagée entre organisations**
(v1 : un profil est propre à son org) · mapping des cahiers/OCR (STORY-084/085).

---

**Status:** done
**Dependencies:** **STORY-086** (import Sage — cette story l'étend), **STORY-101** (`BalanceValidator`, persistance) · **complète** l'adaptateur #2 du hub (D13)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A14
