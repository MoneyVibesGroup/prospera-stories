# STORY-461 : Le BFR réel de la base n'est publié nulle part — on saisit un délai clients sans connaître le délai constaté

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `AncresProjection` : ni créances, ni stocks, ni dettes fournisseurs.

---

## Le fait

Le premier geste d'un comptable qui prépare un prévisionnel est de **calculer les délais constatés** de
l'exercice écoulé : `créances / CA × 360`, `stocks / achats × 360`, `dettes fournisseurs / achats × 360`.
Il part de là, puis décide s'il les améliore ou les dégrade.

`AncresProjection` publie cinq nombres — produits, charges, résultat, total actif, trésorerie — et
**aucun poste de BFR**. L'écran de saisie ne peut donc afficher **aucun** délai constaté. Le comptable
saisit à l'aveugle.

Pire : `bfrNormatif` est appliqué **aussi à l'exercice de base** (délibérément, pour que la variation de
la 1ʳᵉ année soit homogène). Le BFR réel du bilan est donc **remplacé** par un BFR normatif dès le
départ, sans que l'écart entre les deux soit jamais montré. Sur le dossier de démonstration, le BFR
normatif de base vaut **2 606 354** — soit **57 jours** de produits, et **46 % du total actif** — sans
qu'on sache s'il ressemble au BFR réel.

## Critères d'acceptation

- [x] AC-1 — `AncresProjection` gagne `bfrReelBase: { stocks, creancesClients, dettesFournisseurs,
      montant } | null`, alimenté par des **marqueurs** de paquet référentiel (patron `tresorerie?`),
      jamais par des codes de poste — l'invariant P7 tient.
- [x] AC-2 — La réponse expose les **délais constatés** correspondants (base 360, mêmes assiettes que
      `bfrNormatif`), pour que la comparaison soit une identité et non un rapprochement.
- [x] AC-3 — `bfrReelBase: null` quand le référentiel ne publie pas les marqueurs — signalé, jamais
      remplacé par un zéro.
- [x] AC-4 — L'écart `bfrNormatif(base) − bfrReelBase` est publié : c'est la mesure du saut que le
      modèle fait à l'exercice 0, et il doit être visible.

## Conséquences ailleurs

- Sans ces valeurs, l'écran FE-035 ne peut proposer **aucune** valeur de départ crédible pour les trois
  délais ; il affiche donc des valeurs choisies par l'écran, et le dit.
- Voir **STORY-469** : les délais du métier se calculent TTC.

---

## Progress Tracking

**Statut : `in_progress`** (2026-09-06) — branches `MNV-461` créées dans **trois** dépôts, **avant** la
première ligne de code.

```
bilan-service   : MNV-461
balance-service : MNV-461
docs            : MNV-461
```

**Périmètre — DEUX dépôts de code**, et ce n'est pas un débordement : la story pose un **marqueur** dans
`table-de-passage-syscohada.json`, donc l'artefact `syscohada-revise-2.1.json` change d'octet — or il est
recopié **à l'octet** dans `balance-service`, dont une batterie compare les deux dépôts côte à côte
(D-078-2, patron **STORY-428**). Régénérer d'un côté sans recopier de l'autre fait rougir le voisin.
`zone-franche-togo-1.0.json` bouge aussi (il **partage** la table de passage) mais n'est pas recopié.

### Ce qui a été livré

- **Marqueur `MappingRule.bfr`** — `STOCKS` | `CREANCES_CLIENTS` | `DETTES_FOURNISSEURS`, champ additif et
  en dernier, sur le patron exact de `tresorerie?` (061), `role?` (112) et `chiffreAffaires?` (457).
  Sourcé sur `BB`, `BI` et `DJ` en SYSCOHADA. **Invariant P7 tenu** : aucun code de poste dans le moteur.
- **Garde de générateur `exigerBfrCompletOuAbsent`** — les **trois** catégories, ou aucune. Le cas
  **partiel** est le cas dangereux : un BFR réel amputé d'une composante se compare faussement au BFR
  normatif complet, et l'écart publié (AC-4) accuserait alors **le modèle** alors que c'est la mesure qui
  est incomplète.
- **Unité pure `bfr-reel.ts`** (patron `bfr.ts` / `tresorerieNette`) — somme par catégorie, `null` quand
  aucun poste marqué n'est **émis**, `0` quand un poste marqué **est** émis à zéro.
- **`BilanProduit.bfrReel`** publié (AC-1), **`AncresProjection.bfrReelBase`** ancré par le même chemin que
  la trésorerie, **`delaisConstatesBase`** (AC-2) et **`ecartBfrBase`** (AC-4) publiés sur la projection.
- **`MOTEUR_VERSION` 1.14.0 → 1.15.0** : la forme figée dans chaque snapshot change.
- **Recopie à l'octet** dans `balance-service` + les **quatre** empreintes figées mises à jour (registre et
  batteries des deux dépôts).

### Le point de conception à ne pas lire de travers

**Les délais publiés ne sont PAS les ratios comptables du métier.** AC-2 exige « les mêmes assiettes que
`bfrNormatif` », donc le délai stocks et le délai fournisseurs s'apprécient sur le **coût des ventes du
modèle**, lui-même dérivé du `tauxMargePct` **saisi**. Conséquence directe et assumée : **ces délais bougent
quand l'utilisateur change son taux de marge**, alors qu'ils décrivent un exercice **passé**. C'est le prix
de l'identité — un ratio comptable, lui, ne se réinjecterait pas dans le modèle et ne reproduirait pas le
BFR réel. La mise en garde est portée par le contrat publié, et un test l'épingle pour qu'un futur lecteur
ne prenne pas ce comportement pour un défaut. Les ratios du métier (TTC) relèvent de **STORY-469**, que la
fiche cite déjà.

### Portes de qualité

`bilan-service` : lint 0 warning · build OK · **1 991 unitaires** + **549 e2e** verts · couverture
98,89 / 94,39 / 98,86 / 98,91, **100 %** sur `bfr-reel.ts` et `bfr.ts`.
`balance-service` : lint 0 warning · build OK · **3 662 unitaires** verts.

**Mutations éprouvées** (chacune compile) :

| Mutation | Résultat |
|---|---|
| source : une catégorie de BFR retirée (déclaration partielle) | ✅ le **générateur lève**, en nommant `DETTES_FOURNISSEURS` |
| artefact régénéré sans recopie dans `balance-service` | ✅ rouge (4 empreintes figées, 2 dépôts) |
| `MOTEUR_VERSION` laissée à 1.14.0 | ✅ rouge (la sonde de forme voit `bfrReel` arriver) |

### Vérification docker (2026-09-06, conteneur **redémarré**)

1. **Contrat servi** — `BfrReelDto` (4 propriétés), `DelaisConstatesDto` (3 délais `number` **nullables**),
   `ancres.bfrReelBase`, `delaisConstatesBase` et `BilanDto.bfrReel` publiés en `$ref` **nullable** ;
   `ecartBfrBase` en nombre nullable. **Aucun `object` opaque** sur le livrable de la story.
2. **⚡⚡ AC-3 mesuré sur un cas RÉEL, pas construit** — la projection d'un jeu d'hypothèses assis sur un
   snapshot **figé avant la story** rend `bfrReelBase`, `delaisConstatesBase` et `ecartBfrBase` **tous les
   trois à `null`**, pendant que le BFR normatif, lui, est calculé. C'est le chemin `?? null` d'`ancrage.ts`
   qui l'assure : sans lui, `undefined` aurait traversé les lectures aval (leçon STORY-457, même ligne).
3. **BFR réel sur une balance réelle** (dry-run) — `{stocks: 1 200 000, creancesClients: 2 400 000,
   dettesFournisseurs: 900 000, montant: 2 700 000}` depuis les seuls postes `BB`/`BI`/`DJ` **émis** ; le
   poste de trésorerie `BS` (300 000), non marqué, n'y entre pas.
4. **Nouveau snapshot** (version 2, produit par la revalidation de la liasse) — `moteurVersion:
   bilan-engine@1.15.0`, checksum de référentiel `da8b59a1…`, et `bilan.bfrReel` figé dedans avec
   **`stocks: 0`** : le dossier de démonstration n'a aucun compte de stock, mais `BB` **est émis**, donc
   c'est un **zéro mesuré**, pas un `null`. La distinction que garde `bfr-reel.spec.ts`, observée en base.
5. **⚡⚡ Le fait de la story, chiffré sur le dossier de démonstration** :

   | | stocks | clients | fournisseurs | montant |
   |---|---|---|---|---|
   | BFR **réel** | 0 | 2 000 000 | 25 000 | **1 975 000** |
   | BFR **normatif** (délais saisis 30/45/60) | 955 208 | 2 046 875 | 1 910 417 | **1 091 666** |

   **`ecartBfrBase = −883 334`** : le modèle **sous-estimait** le BFR réel de 45 %, en silence. Les délais
   **constatés** publiés sont **44 / 0 / 1 jours** contre **45 / 30 / 60** saisis — le délai fournisseurs
   saisi valait **soixante fois** le constaté.
6. **⚡⚡ AC-2 prouvé par ALLER-RETOUR sur la base réelle** — les trois délais constatés réinjectés en
   hypothèses ramènent l'écart de **−883 334** à **−5 451**, soit **un huitième d'une journée de produits**
   (45 486). L'identité tient à l'arrondi des délais au jour entier près, et rien d'autre.

⚠️ **Deux écritures assumées pendant la vérification**, en base de dev locale : la liasse de démonstration a
été **rouverte puis revalidée** pour produire un snapshot au nouveau moteur (elle est bien revenue à
`VALIDE`), et l'`orgId` du read-model de balance a été **aligné sur le `tenantId` du jeu d'états** — il
pointait sur l'organisation d'une vérification antérieure, ce qui faisait échouer la revalidation en
`BALANCE_INTROUVABLE`. Aucun autre document modifié hors des jeux `v461-*`.
