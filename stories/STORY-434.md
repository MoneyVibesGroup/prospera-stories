# STORY-434 : Le TFT bâti sur les variations NETTES double-compte les dotations et les valeurs de cession — l'écart d'articulation vaut exactement `RL + RO`, et il est systématique

Status: in_progress

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/tft-production.service.ts`, `etats/bilan.types.ts`, `etats/evaluateur-formule.*`, paquet référentiel
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuilles *« TFT »* et *« TABLEAU immo note 3A »*.

---

## Le fait — l'écart n'est pas un aléa, c'est une identité

`FF`…`FI` estiment les flux d'investissement par la **variation du NET** des postes d'actif :

```json
{"poste":"FG","operandes":[{"poste":"AI","signe":"-","mode":"VARIATION","etatSource":"BILAN_ACTIF"}],"statutTft":"ESTIME"}
```

Or `contexteMultiEtats` pose `BILAN_ACTIF|AI` = **`netN`**. Et
`net = brut − acquisitions… − dotations − VNC des cessions`. Les dotations et la valeur
comptable des cessions sont donc **dans** la variation nette — et la **CAFG** (`FA`) vient
précisément de les **rajouter** (`+RL`, `+RO`). Elles comptent deux fois.

**Démonstration, sur le jeu de la maquette FE-033** (chiffres produits en rejouant les
opérandes du paquet, pas écrits à la main) :

| | valeur |
|---|---|
| `ZG` — variation reconstituée par les flux | **1 055 000** |
| variation de trésorerie du Bilan (`BT − DT`, N vs N-1) | **150 000** |
| **écart** | **905 000** |
| dont dotations de l'exercice (`RL`) | 860 000 |
| dont valeur comptable des cessions (`RO`) | 45 000 |

`905 000 = RL + RO`, **au franc près**. Et avec les mouvements **bruts** (525 000
d'acquisitions corporelles, 300 000 de prix de cession — c'est-à-dire la **note 3A**),
`ZC` vaudrait −225 000, `ZG` **150 000**, et **l'écart tombe à zéro**.

⚡ **Ce n'est donc pas « un écart légitime dû aux lignes estimées »**, comme le commentaire du
service le suggère : c'est un **biais structurel**, présent dès qu'il y a une dotation aux
amortissements — c'est-à-dire sur **toute** entité qui possède une immobilisation.

## Deux symptômes visibles du même défaut

1. **Trois lignes portent un montant de sens contraire à leur libellé.**
   « `FO` **+ Emprunts** » vaut **−200 000** (l'emprunt a été remboursé) pendant que
   « `FQ` **− Remboursements** » reste vide ; « `FF` **− Décaissements** » vaut **+80 000** ;
   « `FL` **+ Subventions reçues** » vaut **−30 000** (c'est la *reprise* annuelle). Sur un état
   **déposé**, un remboursement rangé sous « + Emprunts » est une **ligne fausse**.
2. **Le brut ne franchit pas la frontière du moteur.** `PosteActif` publie `brutN`, `amortN`,
   `netN`, `netN1` — **mais ni `brutN1` ni `amortN1`**, et l'évaluateur ne voit que `netN`.
   La variation brute n'est donc **pas calculable aujourd'hui**, même en le voulant.

## ✅ Arbitrage (2026-08-27) — **voie A puis voie B : une seule route, deux étages**

⚠️ **Et la voie A a été re-dérivée avant d'être retenue : elle ne suffit pas.** La première
rédaction de cette fiche annonçait « le TFT reconcilie au franc près dès qu'il n'y a ni cession
ni virement ». **C'est faux dès qu'il y a une cession.** Mesuré sur le jeu de la maquette :

| | `ZC` | `ZG` | écart vs Bilan |
|---|---|---|---|
| aujourd'hui (variation du **net**) | 680 000 | 1 055 000 | **905 000** |
| **voie A** (variation du **brut**) | 75 000 | 450 000 | **300 000** |
| **voie A + B** (mouvements de la **note 3A**) | −225 000 | 150 000 | **0** |

La voie A retire **605 000 sur 905 000 (67 %)** — tout le double-comptage des dotations. Le
résidu de **300 000** vaut **exactement la valeur BRUTE des cessions**, et la balance ne la
publie nulle part : `brut cédé = VNC (RO, 45 000) + amortissements sur le bien cédé (255 000)`,
et le second terme n'est publié par aucun champ. **Seule la note 3A le donne** — c'est sa
colonne « Diminutions ». C'est d'ailleurs *pourquoi* le formulaire OHADA exige la note 3A.

**Décision :**

- **Jalon 1 (voie A) — livrable tout de suite, sans dépendance.** Il retire le biais
  *structurel* (celui qui frappe **toute** entité amortissant un bien, même sans jamais rien
  céder) et il est de toute façon **prérequis** : le brut N-1 est aussi ce qui permettra de
  contrôler l'ouverture de la note 3A (STORY-439) et de corriger les notes (STORY-438).
- **Jalon 2 (voie B) — conditionné à STORY-436.** Dès que les mouvements bruts de la note 3A
  sont saisissables, `FF`/`FG`/`FH` les lisent et l'écart tombe à **zéro**. À rechiffrer à ce
  moment-là ; les 8 points de cette fiche couvrent le jalon 1.
- ⛔ **Voie C écartée.** Un tableau des flux qui ne retombe pas sur la trésorerie du Bilan
  n'est pas un tableau des flux : le formulaire déposé porte lui-même sa ligne de contrôle en
  pied. Assumer l'écart, c'est livrer un état que l'entité ne peut pas déposer.

## Critères d'acceptation — jalon 1 (voie A)

- [ ] AC-1 — `PosteActif` porte `brutN1` et `amortN1` (`null` si le jeu N-1 n'est pas produit).
- [ ] AC-2 — L'évaluateur résout un opérande `mode: 'VARIATION_BRUT'` sur `BILAN_ACTIF`.
- [ ] AC-3 — `FF`/`FG`/`FH` du paquet `syscohada-revise@2.1` passent en `VARIATION_BRUT` ;
      `FI` reste `+TN` (prix de cession, déjà juste). ⚠️ **Leur `statutTft` reste `ESTIME`** —
      il ne passera `CALCULE` qu'au jalon 2 : tant que les cessions brutes ne sont pas connues,
      le montant reste une estimation, et le dire est tout l'intérêt du statut de preuve.
- [ ] AC-4 — Test d'articulation, **exact et sans complaisance** : sur un jeu **sans cession ni
      virement**, `ZG === variationBilan` et `ecart === 0` ; sur un jeu **avec cession**,
      `ecart === valeur brute des cessions` — l'écart résiduel est **connu et borné**, pas subi.
      Le test échoue si quelqu'un remet `netN`.
- [ ] AC-5 — Le jeu de la maquette FE-033 devient un **cas de test versionné** : `ZG` doit passer
      de 1 055 000 à **450 000**, et l'écart de 905 000 à **300 000** (jalon 1), puis à **0**
      au jalon 2.
- [ ] AC-6 — Agnosticisme P7 : `sfd-bceao@2.0` traverse sans effet (aucune opérande TFT).
- [ ] AC-7 — Le commentaire périmé de `tft.types.ts` (« *`ecart = 0` par construction* »)
      disparaît dans la foulée : il décrit le TFT d'avant STORY-113 et enseigne exactement la
      mauvaise règle.

## Conséquences ailleurs

- **STORY-438** est la **même racine** côté notes annexes (les notes 3/6/7 totalisent du net
  sous des colonnes en brut) : les instruire ensemble, ou l'une résoudra la moitié du problème.
- **STORY-439** (contrôle note ↔ poste) devient calculable seulement après celle-ci.
- Le commentaire de `tft.types.ts` — « *`ecart = 0` par construction* » — est **périmé depuis
  STORY-113** et doit disparaître dans la foulée : il décrit le TFT du temps où ce n'était qu'un
  squelette, et il enseigne exactement la mauvaise règle (celle de `coherenceResultat`).

---

## Progress Tracking

**Statut : `in_progress`** — branches `MNV-434` ouvertes sur `bilan-service` **et**
`balance-service` (base `dev`), flux APEX-PROSPERA lancé le 2026-09-02.

### ⚠️ Prémisse la plus risquée, instruite AVANT de coder : la story touche DEUX dépôts

L'AC-3 modifie `syscohada-revise@2.1`. Or cet artefact est **byte-identique** dans les deux
dépôts — `sha256` mesuré, même préfixe `fb959403a7f9f0f6` dans
`bilan-service/src/modules/bilan/referentiel/assets/` et
`balance-service/src/modules/referentiel/assets/`. Et
`balance-service/src/modules/referentiel/referentiel-assets-coherence.spec.ts` **lit le dépôt
voisin** quand les deux sont côte à côte (« *empreintes figées, recopiées de `bilan-service`* »,
D-078-2) : régénérer d'un côté **fait rougir l'autre**.

⇒ **Deux branches `MNV-434`, deux PR, ouvertes et intégrées ENSEMBLE** — patron STORY-428.
Le générateur (`scripts/referentiels/build.mjs`) vit dans `bilan-service` avec les sources ;
`balance-service` n'a que la source du paquet fiscal et reçoit une **copie**.

⚠️ Les checksums sont **épinglés** dans quatre fichiers au moins :
`bilan-service/…/referentiel-registry.ts` + `referentiels-additionnels-coherence.spec.ts`,
`balance-service/…/referentiel-registry.ts` + `referentiel-registry.spec.ts` +
`bundled-artifact-source.spec.ts` + `referentiel-assets-coherence.spec.ts`.

### ⚠️ Le jeu de la maquette FE-033 n'est PAS dans la fiche

L'AC-5 demande que « le jeu de la maquette FE-033 devienne un cas de test versionné » et donne
les **résultats** (`ZG` 1 055 000 → 450 000, écart 905 000 → 300 000) mais **pas les soldes**.
Le jeu sera donc **reconstruit** à partir des grandeurs que la fiche énonce — `RL` 860 000,
`RO` 45 000, prix de cession 300 000, acquisitions brutes 525 000, variation de trésorerie du
Bilan 150 000 — et l'écart entre le jeu reconstruit et les chiffres annoncés sera **consigné
honnêtement** plutôt que forcé.
