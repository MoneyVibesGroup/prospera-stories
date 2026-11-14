---
baseline_commit: e91dcc6 (prospera-fiscal-service)
---

# STORY-310 : Registre de familles, famille proportionnelle et détail de calcul

Status: in-progress

**Complexité :** medium

**Épic :** EPIC-029 — Moteur de familles de calcul (registre de stratégies typées, pas d'interpréteur)  
**Service :** `fiscal-service` seul  
**Points :** 5 · **Sprint :** S24 du tracker ; lot du 14/11 (+5)  
**Assigné à :** Dev B  
**Prérequis :** STORY-305 (catalogue d'obligations au paquet), STORY-307 (`parametres` référencés)  
**Origine :** FR-F11, FR-F14, FR-F15 ; AD-2, AD-4.

---

## User Story

En tant qu'**expert-comptable**, je veux voir comment un montant a été obtenu, afin de pouvoir le
défendre.

## Ce qui existe déjà (vérifié dans le code le 2026-11-14)

- **Aucun moteur de calcul dans `fiscal-service`.** Pas de `domain/familles` (la carte des
  capacités de la spine l'y place, I1). Aucun appelant : la chaîne déclarative (I3) qui
  consommera des montants n'existe pas encore.
- **Le catalogue d'obligations du paquet** (`domain/obligations/catalogue.ts`, STORY-305) lit pour
  chaque entrée une `famille` (texte libre aujourd'hui) et, depuis STORY-307, des `parametres`
  (valeur ou référence `{ref, filtre?, champ?}`, résolue par `resoudre()`).
- **Paquet Togo 2026 réel** : familles `PROPORTIONNELLE` (TVA, IS_ACOMPTE, TAF, TCA) et
  `DECLARATIVE` (DSF). Paramètres : TAF → `taxeActivitesFinancieres.taux` (un nombre) ; TCA →
  `taxeConventionsAssurance.tauxParNature` (un **objet de taux par nature**) ; TVA et IS_ACOMPTE :
  **aucun**. Les règles d'arrondi du paquet sont de la **prose** (`irpp.arrondi`, `is.arrondi`) :
  aucune n'est structurée.
- **Chargement** : `PaquetsService.chargerEtVerifier` vérifie empreinte, structure, pays, année,
  consommateur, puis lit le résumé de validation (STORY-298), et met en cache. Un seul `new
  PaquetsService(` hors Nest (`paquets.service.spec.ts`).
- Gardes AST existantes à imiter : `purete-du-domaine.spec.ts`, `garde-agnosticisme-balance.spec.ts`.

## Décisions confrontées au code réel (2026-11-14)

- **D-310-1 — Ensemble FERMÉ de familles, en données du domaine.** Calculables en v1 :
  `PROPORTIONNELLE`, `BAREME_TRANCHES`, `FORFAIT_TRANCHE`. Déclarables hors v1 (FR-F14) :
  `SPECIFIQUE_UNITE`, `PAR_ACTE`, `VALEUR_LOCATIVE`. Sans montant : `DECLARATIVE` (une
  déclaration pure, comme la DSF). Une famille hors de cet ensemble au catalogue d'un paquet ⇒ le
  paquet est **refusé au chargement** (`PAQUET_FAMILLE_INCONNUE`, taxe citée).
- **D-310-2 — Registre de stratégies typées (AD-2).** Une interface unique `FamilleCalcul`
  (`code`, `validerParametres`, `calculer`) ; le registre est un objet du **domaine** (pur), construit
  au démarrage par un provider Nest (`FamillesModule`), refuse deux stratégies pour un même code.
  En 310, seule `PROPORTIONNELLE` est enregistrée ; les deux autres arrivent en STORY-311.
- **D-310-3 — Une famille sans stratégie refuse, nommément (AD-4)** : `FAMILLE_SANS_STRATEGIE`
  (calculable v1 non encore enregistrée), `FAMILLE_NON_CALCULABLE` (hors v1 : montant à saisir),
  `FAMILLE_SANS_MONTANT` (`DECLARATIVE`). Jamais un zéro, jamais une valeur par défaut.
- **D-310-4 — `PROPORTIONNELLE` : arithmétique EXACTE en unités mineures.** Assiette = entier sûr ≥ 0
  (sinon `ASSIETTE_INVALIDE`). Taux = nombre décimal dans [0 ; 1], au plus 8 décimales, converti
  sans perte en fraction décimale ; produit calculé en `BigInt`. Montant hors des entiers sûrs ⇒
  `MONTANT_HORS_BORNE`. Les paramètres acceptés : un taux (`number`) ou des **taux par nature**
  (objet de taux, la forme réelle de la TCA) — validés au chargement l'un comme l'autre ; calculer
  sur des taux par nature exige le choix d'une nature, qui est le modificateur `AIGUILLAGE`
  (STORY-312) : d'ici là, refus `TAUX_A_AIGUILLER`.
- **D-310-5 — L'arrondi est DÉCLARÉ ou le montant est refusé.** ⚠️ *Décision par défaut, à
  confirmer par le PO.* Un résultat exact entier n'a pas d'arrondi. Un résultat fractionnaire exige
  une règle d'arrondi déclarée sur l'entrée du catalogue (`arrondi: { mode: INFERIEUR | SUPERIEUR |
  PLUS_PROCHE, pas: entier ≥ 1 }`, valeur ou référence — clé **optionnelle et nouvelle** : aucun
  paquet ne la porte encore) ; à défaut, refus `ARRONDI_NON_DECLARE` — jamais un arrondi silencieux.
  `PLUS_PROCHE` : la demie va au-dessus.
- **D-310-6 — Les paramètres sont validés AU CHARGEMENT, jamais au calcul.** Dans
  `chargerEtVerifier`, après les contrôles existants : pour chaque entrée du catalogue dont la
  famille a une stratégie, les `parametres` et l'`arrondi` **résolus** passent le schéma de la
  famille ; non conformes ⇒ refus `PAQUET_PARAMETRES_DE_CALCUL_INVALIDES` (taxe, famille et motif
  cités), le paquet n'entre pas en cache. Une référence qui ne mène à rien n'est pas une
  non-conformité : c'est une absence, qui se nomme au calcul (`PARAMETRES_DE_CALCUL_ABSENTS`,
  AD-4) — c'est le cas réel de la TVA et d'IS_ACOMPTE. Paquet sans catalogue : rien à valider. Le
  paquet **effectif** d'une dérogation (STORY-308) passe par la même vérification après fusion.
- **D-310-7 — Le détail de calcul (FR-F15)** est une valeur du domaine, sérialisable :
  `famille`, `entrees`, `parametres`, `etapes` (libellé, opération, résultat décimal exact),
  `arrondis` (règle, avant, après), `resultat`. Restitué par chaque calcul, refus compris (le refus
  porte son code et les entrées vues).
- **D-310-8 — Aucune évaluation dynamique, nulle part (AD-2)** : garde AST sur tout `src/` hors
  tests — `eval`, `Function`/`new Function`, module `vm`, `setTimeout`/`setInterval` avec une
  chaîne. Le scanner est testé sur des extraits piégés.
- **Hors périmètre** : `BAREME_TRANCHES` et `FORFAIT_TRANCHE` (STORY-311) ; le pipeline de
  modificateurs dont `AIGUILLAGE` (STORY-312) ; l'exposition HTTP et la persistance du détail avec la
  déclaration (chaîne déclarative I3) ; structurer dans le paquet Togo les taux de la TVA ou les
  arrondis aujourd'hui en prose (changement de données de `balance-service`).

## Critères d'acceptation

- [ ] **AC-1** — `PROPORTIONNELLE` au taux de 18 % sur une assiette de 10 000 000 ⇒ 1 800 000, en
  unités mineures entières.
- [ ] **AC-2** — Un calcul restitue son détail : entrées, étapes, arrondis, résultat.
- [ ] **AC-3** — Des paramètres de paquet non conformes au schéma de leur famille font échouer le
  chargement, jamais le calcul.
- [ ] **AC-4** — Aucune évaluation dynamique d'expression dans le code (garde AST).
- [ ] **AC-5** (AD-4) — Une famille sans stratégie, hors v1 ou sans montant refuse nommément.

## Fichiers

- NEW `src/domain/familles/famille-calcul.ts` — ensemble fermé, interface, `DetailCalcul`, refus.
- NEW `src/domain/familles/registre-familles.ts` — registre pur.
- NEW `src/domain/familles/proportionnelle.ts` — stratégie + arithmétique décimale exacte.
- NEW `src/domain/familles/arrondi.ts` — règle d'arrondi, lecture et application.
- NEW `src/domain/familles/parametres-paquet.ts` — validation des paramètres du catalogue d'un paquet.
- UPDATE `src/domain/obligations/catalogue.ts` — `arrondi` optionnel sur l'entrée (lu, jamais
  exigé).
- NEW `src/modules/familles/familles.module.ts` — provider du registre ; importé par `PaquetsModule`.
- UPDATE `src/modules/paquets/paquets.service.ts` — vérification au chargement (D-310-6).
- UPDATE `src/application/obligations/deriver-obligations.service.ts` — même vérification sur le
  paquet effectif d'une dérogation.
- NEW `src/garde-evaluation-dynamique.spec.ts` — garde AST (D-310-8).

## Definition of Done

- [ ] Branche `MNV-310` (fiscal) depuis `origin/dev`, PR fusionnée en rebase ; fiche et tracker par
  PR sur `main`.
- [ ] Portes vertes (tsc, lint, unitaires, e2e) ; le paquet Togo réel et la surcouche zone franche se
  chargent toujours ; mutations rouges (taux flottant non exact, arrondi silencieux, validation
  déplacée au calcul, `eval` introduit).

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, après lecture de l'entrée du
tracker (aucun arbitrage), de l'épic EPIC-029, de FR-F11→F15, d'AD-1→AD-4, du paquet Togo 2026 réel
et du code du catalogue et du chargeur de paquet.
