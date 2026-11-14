---
baseline_commit: ca638be (prospera-fiscal-service), 49327aa (balance-service)
---

# STORY-901 : Le paquet fiscal Togo conforme au CGI — arrondis d'assiette, minimum du MFP, zone franche intégrée

Status: ready-for-dev

**Complexité :** large (trois volets, deux services)

**Épic :** EPIC-029 — Moteur de familles de calcul (volet A) ; données du paquet fiscal Togo (volets B, C)  
**Services :** `fiscal-service` (moteur), `balance-service` (paquet `togo@2026`, surcouche `togo-zonefranche@2026`), copies à l'octet chez `dossier-service` et dans les fixtures de `fiscal-service`  
**Points :** 13 (estimation ; à découper au slotting si besoin : A = 3, B = 3, C = 7)  
**Assigné à :** Dev B  
**Prérequis :** STORY-310, 311, 312 (moteur de familles) ; STORY-308 (zone franche résolue par `fiscal-service`) ; STORY-496 (surcouche, axe `regimeDerogatoire`)  
**Origine :** confrontation du lot fiscal du 14/11 au CGI OTR 2025 (le 2026-11-14) ; FR-F11, FR-F12, FR-F75 ; AD-3.

---

## User Story

En tant qu'**expert-comptable**, je veux que les montants calculés par Prospera soient ceux du CGI à
l'arrondi près, et qu'une entreprise en zone franche soit traitée sur un régime transcrit de ses
textes officiels, afin de pouvoir déposer sans recalculer à la main.

## Pourquoi cette story (constats du 2026-11-14)

En confrontant le lot 308 → 312 au CGI OTR 2025, quatre écarts sont apparus :

1. **L'assiette s'arrondit AVANT le calcul, et le moteur ne sait pas le faire.**
   - **Art. 113 CGI** : « toute fraction du bénéfice imposable inférieure à mille (1 000) francs CFA
     est négligée ».
   - **Art. 74 CGI** : « le revenu net annuel imposable arrondi au millier de francs inférieur fait
     l'objet de l'application du barème ».
   - Le moteur (STORY-310) n'arrondit que le montant final. Exemple : bénéfice 1 234 567 ⇒ la loi
     donne 1 234 000 × 27 % = **333 180** ; le moteur calcule 333 333,09 puis le refuse.
2. **Le minimum de 20 000 F du MFP manque au paquet.** **Art. 120 CGI** : « en aucun cas, son
   montant ne peut être inférieur à vingt mille (20 000) francs CFA pour les contribuables qui sont
   au régime du bénéfice réel ». `togo@2026` ne porte que le taux de 1 %.
3. **Les arrondis du paquet ne sont que de la prose.** `is.arrondi` et `irpp.arrondi` sont des
   phrases ; l'arrondi du revenu IRPP au millier (Art. 74) n'y figure même pas.
4. **La surcouche zone franche est une AMORCE.** `togo-zonefranche@2026` (STORY-496) est transcrite
   de sources SECONDAIRES (manuel de l'investissement 2024, Togo First, MCA-Togo), statut
   `a-valider-par-expert`, trois rubriques non consommées (`variantesRegionales`, `taxeDividendes`,
   `fiscaliteDePorte`), aucune validation consignée. Une recherche du 2026-11-14 confirme le texte
   fondateur — **loi n° 2011-018 du 24 juin 2011 portant statut de zone franche industrielle** — et
   montre des sources secondaires **contradictoires** sur les taux d'IS après exonération (8 / 10 /
   20 % dans la surcouche ; une autre source cite 15 %). Le CGI ne la traite que pour la TVA :
   **Art. 180-6** (exonération des entreprises agréées, « pour les biens et services exclusivement
   nécessaires à leur installation et fonctionnement ») et **Art. 175** (produits de la zone franche
   réimportés dans le territoire douanier : TVA et droits dus).

(Le cinquième constat — un exemple TPU de test pris dans le régime forfaitaire — est déjà corrigé :
fiscal-service #37.)

## Décisions validées (par l'utilisateur, le 2026-11-14)

- **D-901-1 — D-310-5 CONFIRMÉE** : un montant fractionnaire sans règle d'arrondi déclarée est
  refusé (`ARRONDI_NON_DECLARE`), jamais arrondi en silence. Le `pas` est en unités de la devise
  (D-311-1).
- **D-901-2 — L'arrondi d'assiette entre au pipeline : AD-3 est AMENDÉE.** Nouvel élément de la liste
  fermée, `ARRONDI_ASSIETTE` (`{ mode, pas }`, écrit ou référencé, pas en unités de la devise), placé
  **après le plancher/plafond et avant l'aiguillage** :
  `assiette → PLANCHER/PLAFOND_ASSIETTE → ARRONDI_ASSIETTE → AIGUILLAGE → famille → MAXIMUM_DE → MINIMUM_PERCEPTION`.
  Il s'applique aussi à l'assiette du second calcul de `MAXIMUM_DE` si celui-ci le déclare.
  L'amendement est écrit dans la spine de `fiscal-service` (AD-3, avec sa date et sa raison).
- **D-901-3 — Le paquet `togo@2026` porte ces règles en DONNÉES**, chacune avec son article :
  - IS : `ARRONDI_ASSIETTE { INFERIEUR, 1000 }` (Art. 113) ;
  - IRPP : `ARRONDI_ASSIETTE { INFERIEUR, 1000 }` et arrondi du produit `{ INFERIEUR, 10 }` (Art. 74) ;
  - MFP : `montantMinimum` 20 000, `regimesConcernes: [REEL]` (Art. 120) ;
  - les phrases existantes restent, en `texte`, à côté de la donnée structurée.
  Régénération par `build.mjs`, nouvelle empreinte, réépinglage, copies à l'octet (dossier-service,
  fixtures de fiscal-service) — même chemin que STORY-305/307.
- **D-901-4 — La zone franche est intégrée comme CIMA et SFD : plus une amorce.** Critères :
  1. **sources PRIMAIRES** seulement : loi n° 2011-018 et ses textes d'application en vigueur, CGI
     (Art. 175, 180-6), loi de finances 2026 si elle y touche ; chaque valeur porte son article ;
     plus aucune valeur tirée d'un manuel, d'un article de presse ou d'un site promotionnel ;
  2. **toutes les rubriques consommées** ou retirées avec leur raison : `variantesRegionales`
     transcrites si le texte les fixe, sinon retirées ; `taxeDividendes` et `fiscaliteDePorte`
     consommées par le moteur qui en a l'usage, ou sorties du paquet fiscal (la fiscalité de porte est
     douanière) — plus de `rubriquesNonConsommees` sans justification écrite ;
  3. **les conditions d'agrément** qui changent l'impôt (part de production exportée, date d'agrément,
     durée) sont des données, lues avec l'axe daté `regimeDerogatoire` de dossier-service (STORY-496) ;
  4. **validation consignée** dans `_meta.validations` (STORY-298) : qui, quand, sur quel texte ;
     `statut` passe de `a-valider-par-expert` à `valide` élément par élément — **seulement** pour ce
     qui est confronté au texte officiel ;
  5. **consommée de bout en bout** : `balance-service` (liquidation, STORY-496) et `fiscal-service`
     (STORY-308 ; le barème d'IS par année d'exploitation est un `AIGUILLAGE` sur l'ancienneté de
     l'agrément — voir dépendance STORY-313).
- **D-901-5 — Aucune valeur sans texte officiel.** Si un point de la loi 2011-018 ne peut être lu (le
  PDF de FAOLEX est un scan sans texte), il reste `a-valider` et la story le dit — jamais comblé
  depuis une source secondaire.

## Critères d'acceptation

### Volet A — moteur (`fiscal-service`)

- [ ] **AC-A1** — IS, bénéfice 1 234 567, `ARRONDI_ASSIETTE { INFERIEUR, 1000 }` ⇒ assiette 1 234 000,
  montant **333 180** ; le détail porte l'étape « arrondi d'assiette ».
- [ ] **AC-A2** — IRPP réel, revenu 25 000 499 ⇒ assiette 25 000 000 ⇒ **5 413 000** ; un produit
  fractionnaire est arrondi à la dizaine inférieure par l'arrondi déclaré.
- [ ] **AC-A3** — Ordre d'AD-3 amendée tenu quel que soit l'ordre de déclaration ; un
  `ARRONDI_ASSIETTE` mal formé ou en double fait échouer le chargement.
- [ ] **AC-A4** — Spine `fiscal-service` : AD-3 amendée (date, raison, liste à six éléments).

### Volet B — données du paquet `togo@2026` (`balance-service`)

- [ ] **AC-B1** — Le paquet structure l'arrondi d'assiette de l'IS (Art. 113) et de l'IRPP (Art. 74),
  l'arrondi du produit IRPP (Art. 74) et le minimum de 20 000 F du MFP au réel (Art. 120), chacun
  avec son article et son texte.
- [ ] **AC-B2** — Le moteur de `balance-service` applique les mêmes règles depuis la donnée (pas
  d'écart entre les deux moteurs sur IS, IRPP, MFP) ; un test d'égalité le tient.
- [ ] **AC-B3** — Nouvelle empreinte, registre et tests réépinglés, copies à l'octet chez
  `dossier-service` et dans les fixtures de `fiscal-service` ; le paquet réel se charge dans
  `fiscal-service` (vérification des paramètres au chargement, STORY-310).

### Volet C — zone franche intégrée

- [ ] **AC-C1** — Chaque valeur de `togo-zonefranche@2026` cite un article d'un texte officiel
  (loi 2011-018, textes d'application, CGI) ; plus aucune source secondaire.
- [ ] **AC-C2** — Plus aucune rubrique non consommée sans justification écrite ; les variantes
  régionales sont transcrites depuis le texte ou retirées.
- [ ] **AC-C3** — `_meta.validations` consigne la validation élément par élément ; `statut` ne dit
  plus « amorce ».
- [ ] **AC-C4** — Un dossier en zone franche est liquidé par `balance-service` et ses obligations
  dérivées par `fiscal-service` sur la surcouche intégrée, de bout en bout (recette).

## Dépendances et risques

- **Texte officiel de la loi 2011-018** : le PDF de FAOLEX
  (`faolex.fao.org/docs/pdf/tog167340.pdf`) est un scan sans couche texte ; ce poste n'a pas de quoi le
  rendre (pas de poppler). Il faut soit l'OCR (Tesseract via `document-service` ne lit pas un PDF :
  passer par des images), soit le texte fourni par l'utilisateur, soit le Journal officiel. **Bloquant
  pour le volet C.**
- **Validation experte** : la story consigne la confrontation aux textes ; la signature d'un
  fiscaliste togolais reste une étape de mise en production (PRD §13), hors de cette story.
- **STORY-313 (aiguillage)** : le barème d'IS par année d'exploitation dans `fiscal-service` en
  dépend ; `balance-service` l'applique déjà (STORY-496).
- Paquet `togo@2026` modifié en parallèle par l'autre session (STORY-568, `49327aa`) : rebase avant
  PR, une seule régénération par fusion.

## Hors périmètre

- La réduction pour charges de famille de l'IRPP (10 000 F par personne et par mois) : assiette en
  amont du barème, à structurer avec la chaîne IRPP.
- Le barème forfaitaire de la TPU (Art. 135, `bareme: []` aujourd'hui) : story de données à part.
- L'exonération du MFP (Art. 121 : entreprises nouvelles, coopératives…) : conditions à modéliser
  avec l'aiguillage (STORY-313).

## Definition of Done

- [ ] Branches `MNV-901` (fiscal-service, balance-service, dossier-service) depuis `origin/dev`, PR
  fusionnées en rebase (balance, dossier, puis fiscal) ; fiche, tracker et spine par PR sur `main`.
- [ ] Portes vertes dans les trois services ; conformité MongoDB réel pour fiscal-service ; mutations
  rouges (arrondi d'assiette ignoré, appliqué après la famille, minimum MFP ignoré).
- [ ] Recette de bout en bout d'un dossier en zone franche (AC-C4).

## Progress Tracking

**2026-11-14 — fiche écrite** à la demande de l'utilisateur, après la confrontation du lot 308 → 312
au CGI OTR 2025 (Art. 74, 113, 120, 131, 134, 175, 180-6), la lecture de la surcouche zone franche et
une recherche des textes de la zone franche. Décisions D-901-1 → D-901-5 validées par l'utilisateur le
même jour.
