# STORY-369 : Les classes de gestion sont publiées par le référentiel, et leur absence REFUSE — jamais `[6,7,8]` par défaut

Status: in_progress

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 8 · **Sprint :** 20 (backend) · **Services :** `bilan-service` (`:3004`) **+**
`balance-service` (`:3007`) — ⚠️ **DEUX DÉPÔTS**
**Gap repris :** `GAP-classes-de-gestion-non-sourcees`
**Décision :** **D-078-2** *(source de vérité unique des octets)* · **D-091-3** *(la classe 8 est juste
pour SYSCOHADA)* · **AD-5** de `architecture-balance-service-2026-08-15`
**Dépendances :** ⛔ **STORY-368** — *le manifeste de `balance-service` affirme aujourd'hui une
byte-identité que sa garde ne tient pas ; ajouter une règle pilotée par le référentiel avant de la
réparer, c'est bâtir sur ce mensonge*

---

## Pourquoi cette story existe

`CLASSES_DE_GESTION = [6, 7, 8]` vit dans `src/modules/fiscal/types/fiscal.ts`, **documentée comme une
constante STRUCTURELLE**. Elle a tenu **par accident** :

| Référentiel | Classe 8 | La constante tient ? |
| --- | --- | --- |
| `syscohada-revise@2.1` | **Entièrement HAO/gestion** (81→89) | ✅ oui |
| `sfd-bceao@2.0` | **Aucune classe 8** | ✅ oui |
| `cima-assurances@1.0` | Gestion réelle (80, 82→86) **ET trois comptes de REGROUPEMENT** — `87` *Compte général de pertes et profits*, `88` *Résultats en instance d'affectation*, `89` *Bilan* | ⛔ **NON** |

> ⚡ **Une règle qui appartient au RÉFÉRENTIEL — quelles classes portent la gestion — est écrite en dur
> dans le code du moteur fiscal**, alors que le référentiel publie déjà ses règles `CHARGE`/`PRODUIT`.
> **Rien ne confronte les deux.**

## ⚡ La conséquence est MESURÉE, pas supposée

Sur une balance CIMA dont le résultat de **140 M** est porté par `88`, `calculerResultatComptable`
rend **280 M**.

> ⛔ **Le résultat — donc LA BASE IMPOSABLE — est EXACTEMENT DOUBLÉ.**

### Et le garde-fou qui devrait le pincer est inapplicable

`resoudreCompteResultatNet(cima)` rend `null` (aucun compte de résultat net en classe 1) ⇒
`articulerResultat` sort **`COMPTE_RESULTAT_NON_SOURCE`** au lieu de **signaler l'écart**.

⇒ **chiffre faux publié SANS AUCUN SIGNAL.**

## 🔒 Portée réelle à ce jour : latent, et c'est pourquoi il dort

Aucune organisation CIMA n'existe ; le plan CIMA reste suspendu à **AC-18** (validation actuarielle,
blocker non levé) ; et le provisionnement (STORY-094) **refuse déjà pour CIMA**
(`resoudreCompteImpotResultat` rend `null` aussi).

⚠️ **Défaut LATENT, bloquant à la première organisation CIMA.** *Rien ne le pousse aujourd'hui — c'est
exactement pourquoi il est encore ouvert, et pourquoi il se réveillera sur un chiffre faux et
plausible.*

## Ce que la story livre

1. **Les classes de gestion sont publiées DANS l'artefact**, pour les trois référentiels — via le
   `build.mjs` de `bilan-service` (**D-078-2**), donc **deux dépôts**.
2. **`balance-service` les lit depuis le référentiel résolu**, et ⛔ **`CLASSES_DE_GESTION` disparaît du
   code**.
3. ⛔ **Un référentiel qui ne les déclare PAS produit un REFUS EXPLICITE.**

## ⛔ Les deux fausses réparations, écrites pour qu'on ne les tente pas

**① Ne JAMAIS retomber sur `[6,7,8]` par défaut.**
⚡ *Ce fail-open est précisément ce qui rend le défaut silencieux.* Un référentiel muet doit **refuser**,
pas produire un chiffre.

**② Ne JAMAIS « réparer » en retirant la classe 8.**
Elle est **JUSTE pour SYSCOHADA** (**D-091-3**) : l'en retirer y produirait un **résultat avant HAO et
avant impôt**. ⇒ **la règle appartient au référentiel, dans les deux sens** — ni ajoutée en dur, ni
retirée en dur.

## Critères d'acceptation

- **Étant donné** `syscohada-revise@2.1` **quand** le résultat comptable est calculé **alors** il est
  **inchangé** par rapport à aujourd'hui — ⛔ **aucune régression sur le chemin nominal**, qui est le
  seul en production.
- **Étant donné** une balance **CIMA** dont le résultat est porté par `88` **quand**
  `calculerResultatComptable` s'exécute **alors** il rend **140 M**, ⛔ **et non 280 M**.
- **Étant donné** un référentiel **qui ne déclare pas** ses classes de gestion **quand** le moteur en a
  besoin **alors** il **REFUSE avec un code machine stable**, ⛔ **jamais un chiffre**.
- **Étant donné** `sfd-bceao@2.0` — **sans aucune classe 8** — **quand** le moteur s'exécute **alors** le
  comportement est **inchangé** : l'absence d'une classe n'est pas l'absence de la déclaration.
- ⛔ **Étant donné** le code du moteur **quand** on le cherche **alors** **aucune liste de classes
  comptables n'y figure** — l'autorité est l'artefact (`AD-5`).

## Definition of Done

- [x] Les trois artefacts déclarent leurs classes de gestion ; les deux dépôts portent **les mêmes
      octets** et **les mêmes checksums** — vérifié `src` **et** `dist` dans les deux conteneurs.
- [x] ⚡ **MUTATION-TEST EXIGÉ** : rétabli `[6,7,8]` en dur ⇒ **3 tests CIMA rouges**, sans erreur de
      compilation. Une seconde mutation (garde de refus retirée) ⇒ **2 tests rouges**.
- [x] **Test de non-régression SYSCOHADA** : suite de `calculerResultatComptable` inchangée dans ses
      attentes, plus le résultat mesuré en docker sur l'artefact réel.
- [x] Un référentiel sans déclaration produit un **refus nommé** — 409 `CLASSES_GESTION_NON_SOURCEES`,
      vérifié au moteur pur **et** au service (champ absent **et** liste vide).
- [x] `CLASSES_DE_GESTION` **n'existe plus** dans `src/` en tant que symbole (cf. § ⑸).
- [x] Les snapshots de liasse impactés par la régénération sont **identifiés et traités** : un snapshot
      à l'ancien checksum se relit sans erreur (mesuré en base) — aucune migration.

## Progress Tracking

▶️ **Démarrée le 2026-08-17** — branches `MNV-369` sur `bilan-service` et `balance-service`
(+ `docs/`). Amont `STORY-368` **done** le 2026-08-17 : le manifeste de `balance-service` dit
désormais la vérité sur ses octets, et sa garde inter-dépôts lit réellement l'autre dépôt.

### Ce qui a été livré

**`bilan-service` — source de vérité des octets (D-078-2)**

| Fichier | Changement |
| --- | --- |
| `sources/table-de-passage-{syscohada,sfd,sfd-v2,cima}.json` | `_meta.racines_de_gestion` — la déclaration, **une par référentiel** |
| `scripts/referentiels/build.mjs` | émet `racinesDeGestion` (spread conditionnel : un référentiel muet n'émet **rien**) + le trace au build |
| `assets/*.json` (**les 5**) | régénérés — diff **strictement additif** : 28 lignes ajoutées, **0 supprimée** |
| `referentiel-registry.ts` | 5 checksums, chacun avec son motif |
| `referentiels-additionnels-coherence.spec.ts` | 5 digests épinglés + **4 tests neufs** (§ ci-dessous) |

**`balance-service` — le consommateur**

| Fichier | Changement |
| --- | --- |
| `types/fiscal.ts` | ⛔ `CLASSES_DE_GESTION` **supprimée** ; à sa place, le pourquoi et les **deux fausses réparations** |
| `fiscal.regles.ts` | `resoudreRacinesDeGestion()` neuve · `calculerResultatComptable(lignes, **racines**)` · `EntreeResultatFiscal.racinesDeGestion` **requis** |
| `resultat-fiscal.service.ts` | point de résolution **unique** — muet ⇒ 409 |
| `exceptions/fiscal.exceptions.ts` | `CLASSES_GESTION_NON_SOURCEES` + `ClassesDeGestionNonSourceesException` (409) |
| `referentiel-loader.service.ts` + `types/referentiel-package.ts` | lecture défensive ; ⛔ absence ⇒ `undefined`, **jamais `[]`** |
| `assets/*.json` (3) + manifeste + garde de byte-identité | octets **recopiés** de `bilan-service`, 3 checksums alignés |

### ⑴ Des RACINES, pas des numéros de classe — et c'est CIMA qui l'impose

Une déclaration au niveau de la **classe** ne saurait pas exclure `87`/`88`/`89`, les trois comptes de
**regroupement** de la classe 8 CIMA. La déclaration porte donc des **racines**, rapprochées **par
préfixe** comme partout ailleurs dans les deux services. Une classe entière s'exprime par sa racine à un
chiffre — `"8"` pour SYSCOHADA, dont la classe 8 est **entièrement** HAO/gestion (`81`→`89`).

| Référentiel | Déclaré | Pourquoi |
| --- | --- | --- |
| `syscohada-revise@2.1` · `zone-franche-togo@1.0` | `6 7 8` | classe 8 entièrement HAO/gestion — **l'en retirer** produirait un résultat *avant* HAO et *avant* impôt (**D-091-3**) |
| `sfd-bceao@1.0` · `@2.0` | `6 7` | plan bancaire, **aucune** classe 8 — il **déclare**, il ne se tait pas |
| `cima-assurances@1.0` | `6 7 80 82 83 84 85 86` | gestion réelle **sans** `87`/`88`/`89` |

### ⑵ MUTATION-TEST — deux fois, et **sans** erreur de compilation

⚠️ Le piège de STORY-179 évité explicitement : une mutation rouge **par `tsc`** ne prouve rien. Les deux
mutations laissent `tsc --noEmit` **vide** ; elles échouent sur le **comportement**.

| Mutation | Effet mesuré |
| --- | --- |
| `[6,7,8]` **rétabli en dur** dans `calculerResultatComptable` (paramètre encore consommé) | ⛔ **3 rouges** — les 3 tests CIMA. SYSCOHADA reste **vert**, ce qui est correct : la mutation y restaure sa propre déclaration |
| garde de refus **retirée** du service + repli `?? ['6','7','8']` réintroduit | ⛔ **2 rouges** — les deux tests de 409 |

⇒ la règle est **réellement** sourcée, **et** le refus n'est pas décoratif.

### ⑶ Vérification docker — sur stack NEUVE (`down -v`), 2026-08-18

**① Octets convergents `src` **et** `dist`, dans les DEUX conteneurs** — c'est le code exécuté, pas le
code du dépôt :

| Artefact | `balance` src/dist | `bilan` src/dist |
| --- | --- | --- |
| `syscohada-revise-2.1` | `d7d96063…` / `d7d96063…` | `d7d96063…` / `d7d96063…` |
| `sfd-bceao-2.0` | `bb319837…` / `bb319837…` | `bb319837…` / `bb319837…` |
| `cima-assurances-1.0` | `13e8fe3f…` / `13e8fe3f…` | `13e8fe3f…` / `13e8fe3f…` |

**② Le constat de la story, reproduit sur le code COMPILÉ et les octets LIVRÉS** (`node` dans le
conteneur `balance-service`, sur `dist/`) :

```
syscohada-revise@2.1  racinesDeGestion=["6","7","8"]
sfd-bceao@2.0         racinesDeGestion=["6","7"]
cima-assurances@1.0   racinesDeGestion=["6","7","80","82","83","84","85","86"]

résultat CIMA (racines de SON artefact) = 140 000 000   ✅
résultat CIMA (repli [6,7,8] supprimé)  = 280 000 000   ⛔ le défaut, mesuré
résultat SYSCOHADA                      =  56 000 000   (480 − 412 − 12, classe 8 comprise)
référentiel muet ⇒ resoudreRacinesDeGestion = null      ⇒ 409
```

**③ La garde d'intégrité est VIVE sur les nouveaux octets** — un octet muté dans `dist` ⇒
`ArtefactIntegrityError`, pas un chargement dégradé. Artefact restauré, empreinte revérifiée.

**④ Snapshots de liasse — DoD** : un `snapshots_liasse` portant l'**ancien** checksum
(`01b892c0…`) inséré en base **se relit sans erreur**, montants intacts. Preuve structurelle à l'appui :
le `checksum` d'un snapshot n'est que **transporté** (schéma → DTO), et l'**unique** comparaison de
checksum du service est `digest !== entry.checksum` dans `referentiel-loader.service.ts:80` — elle porte
sur l'**artefact vs le registre**, jamais sur un snapshot. Aucune migration, aucune invalidation.

### ⑷ Portes DoD

| | `balance-service` | `bilan-service` |
| --- | --- | --- |
| lint (0 warning) | ✅ | ✅ |
| build | ✅ | ✅ |
| unitaires | **2 799** ✅ | **965** ✅ (1 skip préexistant) |
| e2e | **666** ✅ | **190** ✅ |
| couverture (br/fn/li/st) | **91,83 / 98,19 / 99,08 / 99** | **93,19 / 98,60 / 98,64 / 98,68** |

Seuils 65/90/90/90 — **aucun n'a été touché**.

⚠️ `sage-parser.service.spec.ts` a échoué **une fois**, pendant que les deux suites complètes tournaient
en parallèle sur la même machine (parsing XLSX en mémoire). Rejoué seul : **18/18 verts**. Contention, pas
régression — dit plutôt que tu.

### ⑸ Ce qui a été laissé de côté, et pourquoi

- ⛔ **`CLASSES_DE_GESTION` n'est plus un symbole** ; le nom subsiste **en prose**, dans le bloc de
  commentaire qui documente sa suppression et nomme les deux fausses réparations. C'est délibéré :
  `AD-5` dit que le risque est qu'un développeur la **réintroduise** — un grep qui tombe sur « a été
  SUPPRIMÉE ici, et voici pourquoi » vaut mieux qu'un silence.
- `CLASSE_CHARGES = 6` / `CLASSE_PRODUITS = 7` (module `cahiers`) restent en dur. **Hors périmètre** :
  ils gouvernent l'**imputation à la saisie**, pas le résultat comptable, et `AD-5` ne les liste pas.
  Ils sont justes pour les trois référentiels servis. Signalé, non corrigé.
- `PREFIXE_RESULTAT_NET` / `PREFIXE_IMPOT_RESULTAT` et les deux classes **scalaires** de recherche dans
  le plan restent : ils ne décident d'**aucun montant** et rendent `null` — donc un motif explicite —
  quand ils échouent. L'AC vise « aucune **liste** de classes comptables ».
