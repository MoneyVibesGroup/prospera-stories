# STORY-366 : Le catalogue de modules est semé, et un pack ne peut plus référencer un module inconnu

Status: done

**Epic :** EPIC-007 — `platform-catalog-service` (catalogue + entitlements)
**Points :** 8 · **Complexité :** medium · **Sprint :** 20 (backend) · **Service :** `platform-catalog-service` (`:3003`) + `frontend-admin-panel`
**Gaps repris :** `GAP-packs-verticaux-sans-module-balance` *(ouvert le 2026-08-11, MESURÉ)* · le trou de
seed des modules du pack distributeur *(nommé par les spines `catalogue-produits`, `stock` et `pdv`)*
**Arbitrage PO du 2026-08-15 :** **les QUATRE verticaux reçoivent `balance`**
**Bloque :** `EPIC-065` (catalogue), `EPIC-075` (stock), `EPIC-085` (pdv) — **le premier épic de trois
modules** — et, aujourd'hui, **le provisioning des quatre verticaux**

---

## Pourquoi cette story existe

**Ce ne sont pas deux problèmes, c'est un seul, et il a été mesuré.**

### ① Il n'existe aucun seed de modules

`PACKS_SEED` sème **quatre packs** au démarrage. Il n'y a **pas de `MODULES_SEED`**. Les quatre packs
référencent **16 codes de module distincts** — et sur une base neuve, **aucun n'existe**.

```
bilan · pdv · stock · catalogue · commande · facturation · pi-spi · credit
collecte · recouvrement · conformite-bceao · finance-transactions
support-client · dashboard · fiscalite · equipe
```

### ② Le trou est dans le seed **par conception**, et le refus est à l'autre bout

Le docstring de `PacksSeedService` l'assume explicitement :

> *« sur une base neuve **aucun** module n'existe encore — la valider ici ne sèmerait donc jamais rien,
> et la console retomberait sur sa config en dur en croyant que le service fait autorité. »*

Le garde-fou vit donc **à l'octroi** : `assertCatalogCoherence` → `modules.findByCodeOrNull` →
**`422`**. ⇒ **le seed laisse passer ce que l'octroi refuse.**

### ③ La conséquence est mesurée, pas déduite

`GAP-packs-verticaux-sans-module-balance`, levé le 2026-08-11 à la vérification docker de STORY-293 :

> *« Après les 6 octrois du pack Finance … `GET /whoami/balance-access` → **403 BALANCE_NOT_ENTITLED**.
> Les logs le disent ligne à ligne : les 6 événements arrivent et sont tous « ignoré (non-balance) ».
> ⇒ **Provisionner un vertical par la console laisse l'Atelier Balance FERMÉ, pour les quatre
> verticaux.** »*

> ⚡ **Et voici le vrai danger :** *« l'écran ne le montre pas : le pack s'affiche « 6 à créer » puis
> « 6 octroyés », donc l'opérateur croit l'organisation complète — **l'échec n'apparaît que chez le
> client, à la première balance**. »*

## L'arbitrage, et pourquoi il tombe de lui-même

**Les quatre verticaux reçoivent `balance`** *(PO, 2026-08-15)*.

L'argument est vérifiable : **`bilan` figure dans les quatre packs**, et `bilan-service` n'ingère que
des **soldes de comptes** (`creer-jeu-etats.dto.ts`). Or les soldes viennent de `balance-service`.
⇒ *un vertical qui a `bilan` sans `balance` possède un module de production d'états **sans source***.

⚡ Et c'est devenu encore plus vrai : `AD-7` de `stock-service` fait du distributeur un **contributeur
du hub** (troisième `origine`). **`balance` va partout où `bilan` va.**

## Ce que la story livre

1. **`MODULES_SEED`, symétrique de `PACKS_SEED`** — semis au démarrage, `$setOnInsert`, **idempotent**,
   ⛔ **n'écrase jamais** une édition faite depuis la console. **17 codes** : les 16 ci-dessus **plus
   `balance`**.
2. **`balance` ajouté aux quatre packs**, `packs.seed-data.ts` **et** son miroir frontend
   `vertical-packs.ts`. ⚡ **En tête d'ordre d'octroi** — c'est le module structurant.
3. ⚡ **La garde que le gap réclame** : un test qui **échoue** si un pack référence un module que le
   seed ne déclare pas. *« Le pendant, côté MODULES, de ce que STORY-293 a livré côté RÉFÉRENTIELS. »*

## ⚠️ Le piège de `referentielFamilies`, à traiter frontalement

Le schéma `Module` distingue **trois** états, pas deux :

| Valeur | Sens |
| --- | --- |
| Liste non vide | *« ce module consomme ces familles »* |
| `[]` **explicite** | *« décidé : aucune »* |
| **Champ absent** | ⛔ *« pas encore migré »* — c'est le filtre `{ $exists: false }` de STORY-148 |

- **Rule:** ⛔ **le seed ne laisse JAMAIS le champ absent.** Un module semé sans le champ se ferait
  ramasser par une migration comme « à renseigner », alors que la décision a été prise.
- **Rule:** `stock`, `pdv`, `catalogue`, `commande`, `facturation`, `support-client`, `dashboard`,
  `equipe` reçoivent **`[]`** — le docstring du schéma le dit déjà : *« « point de vente », « stock » ou
  « support client » n'ont pas de plan comptable, et leur en inscrire un dans le droit ferait lire à un
  audit un choix normatif que personne n'a fait »*.
- **Rule:** ⛔ **là où la famille n'est pas déterminable depuis un artefact livré, la story
  N'INVENTE RIEN** : le module est semé, et le manque est **signalé comme un écart ouvert**.
  ⚡ Précédent : STORY-172 a refusé d'inventer `longueurCompteDetail` pour CIMA, et
  `TICKET-BACKEND-classes-de-gestion-non-sourcees-par-referentiel` mesure le coût de s'en écarter —
  **un résultat comptable doublé, sans témoin**.

## Critères d'acceptation

- **Étant donné** une **base vierge** **quand** le service démarre **alors** les **17 modules** sont
  créés, et `PUT /entitlements/:orgId/:moduleCode` **cesse de rendre `422`** pour chacun d'eux.
- **Étant donné** un module **édité depuis la console** **quand** le service redémarre **alors** il est
  **laissé strictement intact** — même invariant que `PacksSeedService` : *créer si absent, ne jamais
  écraser*.
- **Étant donné** le pack **Finance** **quand** un opérateur le provisionne entièrement **alors**
  `GET /api/v1/whoami/balance-access` répond **`200`**, et non plus `403 BALANCE_NOT_ENTITLED`.
  ⚡ **C'est la reproduction exacte du constat du 2026-08-11**, et c'est ce qui clôt le gap.
- **Étant donné** les quatre packs **quand** on les inspecte **alors** chacun liste **`balance`**, et le
  miroir frontend `vertical-packs.ts` **dit la même chose** que le backend.
- ⛔ **Étant donné** un pack qui référencerait un module absent de `MODULES_SEED` **quand** la CI passe
  **alors** **un test échoue**, en nommant le pack et le code fautif. C'est la garantie durable ; le
  reste n'est qu'un rattrapage ponctuel.
- **Étant donné** chaque module semé **quand** on lit son document **alors** `referentielFamilies` est
  **présent** — liste sourcée ou `[]` — ⛔ **jamais absent**.
- **Étant donné** un échec de semis **quand** le service démarre **alors** il **démarre quand même**,
  l'erreur journalisée en `error` — même arbitrage que `PacksSeedService` : *le service reste une
  relying party utile sans ses modules*.

## Ce que cette story ne fait PAS

- ⛔ Elle **n'aligne PAS `BALANCE_MODULE_CODE` sur `'bilan'`**. Le gap l'interdit explicitement : *« les
  deux modules sont distincts et le read-model de chaque service doit rester filtré sur le sien, sinon
  `bilan-service` et `balance-service` projetteraient le même octroi. »*
- ⛔ Elle ne renomme pas `catalogue` → `catalogue-produits` (`AD-14` du catalogue) — **story voisine**,
  ⚠️ **mais à livrer AVEC celle-ci** : renommer un code déjà semé coûte une migration.
- ⛔ Elle ne crée aucune `ModuleVersion` ni `ReferentielVersion` : ce sont des **axes orthogonaux**
  (C2), portés par leurs propres collections.

## Definition of Done

- [x] Une base vierge démarrée produit **17 modules** ; aucun octroi ne rend plus `422` pour cause de
      module inconnu.
- [x] **Le scénario du 2026-08-11 est rejoué en docker** : provisionner un pack complet ⇒
      `whoami/balance-access` à `200`. ⚠️ **Vérifié en réel, pas en test unitaire** — c'est une vérif
      docker qui a trouvé le défaut, c'est une vérif docker qui doit le déclarer clos.
- [x] **Test de garde** : ajouter un module fictif à un pack **fait virer la CI au rouge**.
- [ ] Backend et frontend déclarent **la même composition de packs**. ⇒ **renvoyé à AP-36** (D-366-5) : le back déclare l'écart.
- [x] Aucun module semé sans `referentielFamilies` **présent**.
- [x] `GAP-packs-verticaux-sans-module-balance` passe à **fermé**, avec la preuve du rejeu docker.

## Cadrage du 2026-09-29 — ce que le code dit, et les décisions qui en sortent

Relu sur `origin/dev` de `platform-catalog-service` (tête `f112770`) et sur `origin/dev` de
`frontend-admin-panel` (tête `c7d6c43`, lecture seule).

### Ce qui a changé depuis la rédaction (2026-08-15)

- **Le mécanisme de semis existe** : STORY-497 a livré `ModulesSeedService` + `MODULES_SEED`
  (`$setOnInsert`, entrée par entrée, `echecs` nommés, boot jamais tué). Il ne sème qu'**un** module,
  `microfinance`. ⇒ La story n'écrit pas de semeur : elle **remplit la table**.
- **Les codes sont 17 + `microfinance` = 18** en base neuve (`microfinance` est déjà semé).
- Le pack `imf-sfd` porte déjà un écart déclaré au front sur `modules` (`microfinance`, en queue).

### Décisions

- **D-366-1 — Libellés, descriptions et familles viennent des fixtures de la console**
  (`frontend-admin-panel/src/features/catalog/api/fixtures.ts`, `c7d6c43`). Pour les modules
  normatifs, elles sont **identiques** à `REFERENTIEL_FAMILIES_BY_MODULE` (STORY-148) — les deux
  sources concordent, rien n'est inventé. Les autres reçoivent **`[]` explicite** (règle de la story).
  ⚡ `balance` est **absent** des fixtures : libellé « Atelier de balance » (celui de la carte client,
  cf. STORY-549), familles = le **pont de `balance-service`** (`ReferentielRegistry.PONT_TAG` :
  `syscohada-revise`, `smt-togo`, `sfd-bceao`, `cima-assurances`) — l'artefact livré qui décide ce
  que le service sait servir.
- **D-366-2 — Chaque module semé publie une version `1.0` ACTIVE.** ⛔ Le « hors périmètre » ci-dessus
  (« aucune `ModuleVersion` ») est **incompatible avec l'AC-1** : `assertCatalogCoherence` exige une
  version non `RETIRED`, donc un module sans version reste en `422`. Ce paragraphe date d'avant
  STORY-497, qui sème déjà `microfinance@1.0` par le même chemin. L'AC l'emporte ; les
  `ReferentielVersion`, elles, restent un geste d'exploitation (checksum), non semé.
- **D-366-3 — Statut `ACTIVE` pour les 17.** `ModuleStatus` n'a pas d'état « planifié » (les
  fixtures disent `PLANNED`, que le back ne connaît pas), et l'assistant de la console bloque tout
  module non `ACTIVE` (`plan.ts` → `module-deprecated`).
- **D-366-4 — `balance` en TÊTE des quatre packs** (texte de la story). ⚠️ La garde front ↔ back
  exigeait que la liste du front soit le **préfixe** du seed (écart = ajout en queue). Elle devient :
  la liste du front est une **sous-séquence** du seed (rien retiré, rien permuté), **et** les modules
  ajoutés sont **nommés** pack par pack — une garde nominative, comme celles des versions.
- **D-366-5 — Le front n'est pas modifié ici** (dépôt en lecture seule pour ce flux). L'écart
  `modules` est **déclaré** pour les quatre packs dans `ECARTS_ASSUMES_AU_FRONT`, et le geste front
  est confié au dev frontend par la story **AP-36**. ⇒ La ligne de DoD « backend et frontend
  déclarent la même composition » se ferme **par AP-36**, pas ici.

### Écarts ouverts, signalés et NON inventés

- ⛔ **Deux modules normatifs sont rangés dans un pack qui n'octroie pas leur famille** (fixtures
  + STORY-148) : `facturation` (`zone-franche-togo`) dans `distributeur` (`syscohada-revise`), et
  `finance-transactions` (`syscohada-revise`) dans `assurance-cima` (`cima-assurances`). Un octroi
  par le pack part en `422 REFERENTIEL_INCOMPATIBLE`. Décider laquelle des deux tables a tort est
  une **décision d'offre** : ils sont figés dans une liste d'exceptions nommée
  (`modules.seed-data.spec.ts`) — un troisième cas vire au rouge.
- ⚠️ **La console envoie `referentiel` (singulier) à chaque module du pack** (`runner.ts` →
  `grantEntitlement`). Depuis STORY-533 le DTO attend `referentiels` et refuse le champ inconnu
  (`forbidNonWhitelisted`) ⇒ **400** ; et un module non normatif recevrait
  `422 REFERENTIEL_NOT_APPLICABLE`. Relevé dans AP-36 (le pluriel est déjà porté par AP-29).
- ⛔ Le renommage `catalogue` → `catalogue-produits` (AD-14) n'est **pas** livré avec : aucune story
  n'en est ouverte, et le périmètre l'exclut. Le code `catalogue` est donc semé tel quel.

## Progress Tracking

- 2026-09-29 — cadrage (ci-dessus) ; branches `MNV-366` ouvertes sur `docs/` et
  `platform-catalog-service` ; statut `in_progress`.
- 2026-09-29 — dev (`MNV-366`, 2 commits) : `MODULES_SEED` porte 18 codes (17 + `microfinance`),
  `referentielFamilies` toujours écrit, `balance` en tête des 4 packs, garde CI « aucun module de pack
  absent du semis », `ECARTS_DE_FAMILLE_AU_PACK` (2 écarts nommés). Story front **AP-36** rédigée.
- Portes : lint 0 · build OK · 818 unitaires (99,73 / 96,8 / 100 / 99,78) · 200 e2e.
- **Mutations — 8/8 tuées** (`tmp/mutations-366/`) : module fantôme dans un pack (3 rouges) ·
  familles omises si vides (1) · `balance` en queue du cabinet (1) · `balance` retiré d'Assurance (2)
  · familles de `facturation` changées (2) · `stock` retiré du semis (3) · `smt-togo` retiré de
  `balance` (1) · famille inventée sur `dashboard` (2).
- **Vérification docker sur stack NEUVE** (`tmp/verif-docker-366/`, état final `64d6dc3`) — 52 OK :
  - p1 (21 OK) : journal « créés : 18 · échecs : 0 » ; `modules` = les 18 codes ; aucun document
    sans `referentielFamilies` ; les 9 non normatifs à `[]` ; `balance` sur ses 4 familles ; 18
    `moduleversions` en `1.0 ACTIVE` ; `GET /catalog/modules` publie `[]` ; `balance` en tête des
    4 packs, aucun module de pack inconnu du catalogue.
  - p2 (8 OK) : `stock` édité et `dashboard` DEPRECATED par l'API, redémarrage du conteneur ⇒
    documents **strictement identiques**, journal « créés : 0 · non touchés : 18 · échecs : 0 ».
  - p3 (10 OK) : organisation Finance, KYC approuvé ⇒ `whoami/balance-access` **403
    `BALANCE_NOT_ENTITLED`** (le constat du 2026-08-11, reproduit) ; dépôt `sfd-bceao@2.0` ; pack lu
    par l'API et octroyé ENTIER (8 modules, **aucun 400/422**) ; 8 entitlements ACTIVE, 8 événements ;
    read-model `balance` ACTIVE `sfd-bceao@2.0` ⇒ **`balance-access` 200**.
  - p4 (13 OK) : `fantome` 422 · `facturation` sous syscohada `422 REFERENTIEL_INCOMPATIBLE` ·
    non normatif + référentiel `422 REFERENTIEL_NOT_APPLICABLE` · `balance` sans référentiel
    `400 REFERENTIEL_REQUIRED` · champ singulier de la console 400 ; **aucun entitlement ni événement
    écrit par les refus** (non-vacance : les 8 octrois lus avant).
  - ⚠️ Un KO de ma requête de preuve (organizationId interrogé en ObjectId) corrigé et rejoué (p3b).
    **Constat préexistant, hors périmètre** : le schéma `Entitlement` déclare
    `organizationId: Types.ObjectId`, mais la base porte des **chaînes** (8/8) — cohérent, lectures
    comprises, sans effet fonctionnel mesuré ; à surveiller si une écriture passe un jour par un autre
    chemin (index unique `(organizationId, moduleCode)` sur deux types).
- Revue de code ⑥ : 4 constats non bloquants (commentaires rendus faux) corrigés (`MNV-366(revue)`) ;
  ponytail-review : rien à retrancher. Revue de sécurité ⑦ : **0 constat**.
- `prospera-platform-catalog-service#27` rebase-mergée sur `dev` (`3e6c2d1`), branche supprimée.
  Statut `done`.
