# STORY-366 : Le catalogue de modules est semé, et un pack ne peut plus référencer un module inconnu

Status: not_started

**Epic :** EPIC-007 — `platform-catalog-service` (catalogue + entitlements)
**Points :** 8 · **Sprint :** 20 (backend) · **Service :** `platform-catalog-service` (`:3003`) + `frontend-admin-panel`
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

- [ ] Une base vierge démarrée produit **17 modules** ; aucun octroi ne rend plus `422` pour cause de
      module inconnu.
- [ ] **Le scénario du 2026-08-11 est rejoué en docker** : provisionner un pack complet ⇒
      `whoami/balance-access` à `200`. ⚠️ **Vérifié en réel, pas en test unitaire** — c'est une vérif
      docker qui a trouvé le défaut, c'est une vérif docker qui doit le déclarer clos.
- [ ] **Test de garde** : ajouter un module fictif à un pack **fait virer la CI au rouge**.
- [ ] Backend et frontend déclarent **la même composition de packs**.
- [ ] Aucun module semé sans `referentielFamilies` **présent**.
- [ ] `GAP-packs-verticaux-sans-module-balance` passe à **fermé**, avec la preuve du rejeu docker.
