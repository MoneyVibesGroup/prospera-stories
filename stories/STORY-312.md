---
baseline_commit: 3334be0 (prospera-fiscal-service)
---

# STORY-312 : Pipeline de modificateurs ordonné

Status: in-progress

**Complexité :** medium

**Épic :** EPIC-029 — Moteur de familles de calcul  
**Service :** `fiscal-service` seul  
**Points :** 5 · **Sprint :** S25 du tracker ; lot du 14/11 (+5)  
**Assigné à :** Dev B  
**Prérequis :** STORY-310, STORY-311  
**Origine :** FR-F12 ; AD-3, AD-4.

---

## User Story

En tant qu'**expert-comptable**, je veux que plancher, taux et minimum s'appliquent toujours dans le
même ordre, afin que deux calculs de la même taxe donnent le même montant.

## Ce qui existe déjà (vérifié dans le code le 2026-11-14)

- **STORY-310/311** : registre de familles (`PROPORTIONNELLE`, `BAREME_TRANCHES`,
  `FORFAIT_TRANCHE`), socle `montant-exact` (assiette, `exposant`, conclusion exacte, arrondi déclaré),
  paramètres d'une entrée du catalogue vérifiés au chargement du paquet. Aucun modificateur.
- **Paquet Togo 2026 réel** : `is.taux` = 0,27 ; `minimumForfaitairePerception.taux` = 0,01 (MFP sur
  le chiffre d'affaires ; « impôt dû = max(MFP, IS) ») ;
  `regimesImposition.synthetique_entreprenant_tpu.composantes.declaratif.taux.montantMinimumAnnuel`
  = 20 000 F (minimum de la TPU) ; le **SMIG n'est que de la prose** (`cnss.assiette.plancher`) :
  aucun nombre à référencer — le plancher d'assiette se prouve sur une donnée de test.
- Aucune entrée du catalogue réel ne déclare de modificateur : le paquet réel n'est pas touché.

## Décisions confrontées au code réel (2026-11-14)

- **D-312-1 — Liste FERMÉE de modificateurs (AD-3)** : `PLANCHER_ASSIETTE`, `PLAFOND_ASSIETTE`,
  `AIGUILLAGE`, `MAXIMUM_DE`, `MINIMUM_PERCEPTION`. Un autre type dans un paquet ⇒ **refus au
  chargement** (`PAQUET_PARAMETRES_DE_CALCUL_INVALIDES`, chemin `modificateurs[i].type`).
- **D-312-2 — Déclarés par l'entrée du catalogue** : `modificateurs: [{ type, … }]`, clé optionnelle
  et nouvelle ; valeurs écrites ou RÉFÉRENCÉES. Un type au plus une fois. Paramètres :
  `PLANCHER_ASSIETTE` / `PLAFOND_ASSIETTE` / `MINIMUM_PERCEPTION` → `montant` (entier ≥ 0, unités
  de la devise, mis à l'échelle de l'exposant — D-311-1) ; `MAXIMUM_DE` → un **second calcul** :
  `famille` (avec stratégie), `assiette` (le nom de l'entrée de calcul qui le porte, ex.
  `chiffreAffaires`), `parametres`, `arrondi?` — vérifiés au chargement par le schéma de sa famille.
  Plancher supérieur au plafond ⇒ refus au chargement.
- **D-312-3 — L'ordre est celui du CODE, jamais celui de la déclaration** :
  `assiette → PLANCHER/PLAFOND_ASSIETTE → AIGUILLAGE → famille → MAXIMUM_DE → MINIMUM_PERCEPTION`.
  Deux paquets qui déclarent les mêmes modificateurs dans un ordre différent rendent le même montant.
- **D-312-4 — `AIGUILLAGE` est déclarable, pas encore exécutable** (STORY-313) : au calcul, refus
  `MODIFICATEUR_SANS_STRATEGIE` — jamais ignoré en silence. (Corrige la mention « STORY-312 » laissée
  par 310 sur `TAUX_A_AIGUILLER` : c'est STORY-313.)
- **D-312-5 — Aucun modificateur ignoré** : une référence de modificateur qui ne mène à rien ⇒ refus
  au calcul `PARAMETRES_DE_CALCUL_ABSENTS` (modificateur cité), jamais un calcul sans lui. Entrée de
  `MAXIMUM_DE` absente des entrées ⇒ `ASSIETTE_INVALIDE` du second calcul.
- **D-312-6 — Le détail raconte le pipeline** : une étape par modificateur appliqué (assiette
  retenue, second calcul et ses étapes, maximum retenu, minimum retenu), les arrondis des deux calculs,
  et `parametres.modificateurs` tels qu'appliqués.
- **Hors périmètre** : `AIGUILLAGE` (STORY-313) ; mettre l'IS, le MFP ou la TPU au catalogue
  d'obligations, structurer le SMIG (données de `balance-service`).

## Critères d'acceptation

- [ ] **AC-1** — IS et MFP : un IS de droit commun inférieur au minimum ⇒ `MAXIMUM_DE` retient le
  minimum (taux réels du paquet).
- [ ] **AC-2** — TPU calculée sous le minimum de perception (20 000 F réels) ⇒ le montant rendu vaut
  le minimum.
- [ ] **AC-3** — Assiette sociale sous le salaire minimum ⇒ `PLANCHER_ASSIETTE` retient le plancher.
- [ ] **AC-4** — Un modificateur absent de la liste déclarée dans un paquet ⇒ le chargement échoue.
- [ ] **AC-5** — Même déclaration dans un autre ordre ⇒ même montant (AD-3).

## Fichiers

- NEW `src/domain/familles/modificateurs.ts` — liste fermée, schéma, résolution.
- UPDATE `src/domain/familles/registre-familles.ts` — le pipeline.
- UPDATE `src/domain/familles/famille-calcul.ts`, `parametres-paquet.ts`,
  `src/domain/obligations/catalogue.ts` (`modificateurs` lus, jamais exigés), `proportionnelle.ts`
  (mention STORY-313).
- NEW `src/domain/familles/modificateurs.spec.ts`.

## Definition of Done

- [ ] Branche `MNV-312` (fiscal) depuis `origin/dev`, PR fusionnée en rebase ; fiche et tracker par
  PR sur `main`.
- [ ] Portes vertes ; le paquet Togo réel se charge ; mutations rouges (ordre inversé
  minimum/maximum, plancher ignoré, modificateur inconnu accepté, référence absente ignorée).

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, après lecture de l'entrée du
tracker (aucun arbitrage), de l'épic, de FR-F12, d'AD-3, du paquet Togo 2026 réel (IS, MFP, TPU,
CNSS) et du code de STORY-310/311.
