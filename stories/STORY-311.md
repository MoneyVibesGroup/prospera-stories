---
baseline_commit: c467640 (prospera-fiscal-service)
---

# STORY-311 : Familles barème par tranches et forfait par tranche

Status: done

**Complexité :** medium

**Épic :** EPIC-029 — Moteur de familles de calcul  
**Service :** `fiscal-service` seul  
**Points :** 5 · **Sprint :** S25 du tracker ; lot du 14/11 (+5)  
**Assigné à :** Dev B  
**Prérequis :** STORY-310 (registre, `PROPORTIONNELLE`, vérification au chargement)  
**Origine :** FR-F11 ; AD-2, AD-4.

---

## User Story

En tant qu'**expert-comptable**, je veux que les impôts progressifs et forfaitaires se calculent
depuis le paquet, afin qu'un changement de barème ne demande aucune livraison.

## Ce qui existe déjà (vérifié dans le code le 2026-11-14)

- **STORY-310** : `domain/familles` (ensemble fermé, interface `FamilleCalcul`, registre pur,
  `FamillesModule`), `PROPORTIONNELLE` exacte en `BigInt`, détail de calcul, arrondi déclaré
  (`{ mode, pas }`) ou refus `ARRONDI_NON_DECLARE`, paramètres vérifiés au chargement du paquet.
  `BAREME_TRANCHES` et `FORFAIT_TRANCHE` y refusent `FAMILLE_SANS_STRATEGIE`.
- **Paquet Togo 2026 réel** : `irpp.tranches` = 8 tranches `{ de, a, taux }` à **bornes entières
  inclusives** (`de` = `a` précédent + 1 ; la dernière `a: null`), de 0 % à 35 % au-delà de
  20 000 000 ; `irpp.arrondi` n'est que de la prose (« dizaine inférieure »). Les tarifs
  forfaitaires de la TPU (`regimesImposition.synthetique_entreprenant_tpu.composantes.forfaitaire.bareme`)
  sont **vides** (« A_EXTRAIRE »). Ni l'IRPP ni la TPU ne sont au catalogue d'obligations : le paquet
  réel n'est pas touché par cette story.
- **Les montants du paquet sont en unités de la devise (FCFA)** ; ceux du service sont en **unités
  mineures** avec un exposant (`liasse.devise.exposant`, STORY-490).

## Décisions confrontées au code réel (2026-11-14)

- **D-311-1 — Les montants du paquet se mettent à l'échelle de l'exposant.** Bornes de tranches,
  montants forfaitaires et **pas d'arrondi** sont écrits en unités de la devise ; ils sont multipliés
  par `10^exposant`, l'exposant étant une **entrée** du calcul (`entrees.exposant`, entier 0 à 6).
  Exposant absent quand il faut convertir ⇒ refus `EXPOSANT_ABSENT` — jamais deviné.
  ⚠️ **Amende D-310-5** : le `pas` d'arrondi était écrit « en unités mineures » ; il est désormais
  en unités de la devise, comme tout montant du paquet. Aucun paquet ne déclare encore d'arrondi :
  aucune donnée n'est touchée. `PROPORTIONNELLE` n'a besoin de l'exposant que pour arrondir.
- **D-311-2 — Schéma commun des tranches** (`{ tranches: [...] }`, autres clés ignorées) : `de`
  entier ≥ 0, `a` entier ≥ `de` ou `null` pour la seule dernière, première tranche à `de: 0`, ordre
  croissant, **aucun trou ni chevauchement**. Deux écritures de la contiguïté :
  1. `de` = `a` précédent + 1 (la forme du CGI et du paquet réel) ⇒ la borne `a` est **incluse dans
     la tranche basse** ;
  2. `de` = `a` précédent ⇒ le barème doit déclarer `borneCommune: INCLUSE_EN_BAS | INCLUSE_EN_HAUT`,
     sinon le paquet est refusé au chargement (ambiguïté).
  C'est le paquet qui déclare l'inclusion (AC-3), jamais le code.
- **D-311-3 — `BAREME_TRANCHES` progressif** : chaque tranche ne taxe que **la fraction de
  l'assiette comprise entre ses points de coupure** (`a` précédent, `a`), en arithmétique exacte ;
  somme exacte puis arrondi déclaré ou refus (D-310-5). Le détail porte une étape par tranche
  touchée et la somme.
- **D-311-4 — `FORFAIT_TRANCHE`** : `{ tranches: [{ de, a, montant }] }`, `montant` entier ≥ 0 en
  unités de la devise ; la tranche qui contient l'assiette (selon D-311-2) rend son montant, mis à
  l'échelle. Assiette au-delà d'une dernière tranche bornée ⇒ refus `ASSIETTE_HORS_BAREME`. Aucun
  arrondi (le montant est écrit).
- **D-311-5 — Barème vide** : non conforme au schéma (au chargement, s'il est référencé par le
  catalogue). Le barème TPU vide n'est pas au catalogue : il ne bloque rien aujourd'hui.
- **Hors périmètre** : mettre l'IRPP ou la TPU au catalogue d'obligations, structurer
  `irpp.arrondi` (données de `balance-service`) ; le minimum de perception et `MAXIMUM_DE`
  (STORY-312).

## Critères d'acceptation

- [x] **AC-1** — Barème IRPP réel à huit tranches : un revenu dans la tranche haute ne prend 35 % que
  sur la fraction au-delà de 20 000 000.
- [x] **AC-2** — Forfait par tranche : l'assiette tombe dans une tranche, le montant fixe de cette
  tranche est rendu.
- [x] **AC-3** — Assiette exactement égale à une borne : la tranche retenue est celle que le paquet
  déclare comme incluant la borne.
- [x] **AC-4** — Barème mal écrit (trou, chevauchement, ambiguïté de borne, taux hors [0 ; 1],
  tranche ouverte au milieu) : refusé au chargement.

## Fichiers

- NEW `src/domain/familles/tranches.ts` — schéma et lecture des tranches, points de coupure,
  sélection de tranche.
- NEW `src/domain/familles/bareme-tranches.ts`, `src/domain/familles/forfait-tranche.ts`.
- NEW `src/domain/familles/montant-exact.ts` — socle commun (assiette, exposant, conclusion exacte
  et arrondi), extrait de `proportionnelle.ts` (ajouté en cours).
- UPDATE `src/domain/familles/arrondi.ts`, `proportionnelle.ts`, `famille-calcul.ts` — exposant
  (D-311-1), `defautsTaux` partagé, nouveaux refus.
- UPDATE `src/modules/familles/familles.module.ts` — les deux classes enregistrées.
- UPDATE `src/domain/familles/familles.spec.ts` (arrondi avec exposant) ; NEW
  `src/domain/familles/tranches.spec.ts`.

## Definition of Done

- [x] Branche `MNV-311` (fiscal) depuis `origin/dev`, PR fusionnée en rebase ; fiche et tracker par
  PR sur `main`.
- [x] Portes vertes ; le paquet Togo réel se charge ; mutations rouges (borne attribuée à la mauvaise
  tranche, taux appliqué à toute l'assiette, exposant ignoré, trou accepté).

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, après lecture de l'entrée du
tracker (aucun arbitrage), de l'épic, de FR-F11, du paquet Togo 2026 réel (`irpp`, TPU) et du code
de STORY-310.

**2026-11-14 — livrée.** fiscal-service #33, fusionnée en rebase sur `dev`.

- IRPP réel : 25 000 000 ⇒ 5 413 000 (35 % sur les seuls 5 000 000 au-delà de 20 000 000) ;
  en centimes (exposant 2) ⇒ 541 300 000.
- Portes : tsc, lint, 2 199 unitaires, 172 e2e.
- Mutations 7/7 tuées : borne à la tranche haute, taux sur toute l'assiette, exposant ignoré,
  trou accepté, bornes partagées non déclarées acceptées, pas d'arrondi non mis à l'échelle,
  assiette hors barème rendue à la dernière tranche.
