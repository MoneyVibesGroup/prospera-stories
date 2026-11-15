---
baseline_commit: ca638be (prospera-fiscal-service), 49327aa (balance-service)
---

# STORY-901 : Le paquet fiscal Togo conforme au CGI — arrondis d'assiette, minimum du MFP, zone franche intégrée

Status: review

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
  depuis une source secondaire. ⚠️ **Amendée par D-901-6 pour la zone franche.**
- **D-901-6 — Zone franche : la base est Africarrières, et tout est paramétrable** (décision de
  l'utilisateur, 2026-11-14 : « prends cela comme base tout en étant paramétrable après »). La
  surcouche transcrit le guide employeur « Zones franches » (Togo) d'Africarrières, tableau vérifié au
  06/08/2026 ; elle remplace les sources promotionnelles (manuel, Togo First, MCA-Togo). Chaque valeur
  propre au régime est listée dans `_meta.parametrage` (valeur retenue, plage ou alternatives, ce qui
  la confirmera). Les incohérences de la source sont tranchées et dites : IS après exonération 15 %
  (le corps de la page ; sa FAQ dit 25 %, ailleurs 28 %), durée d'exonération 10 ans (borne basse de
  « 10 à 15 ans selon le secteur »). Ce qui est confronté au texte officiel l'est : MFP (Art. 121 CGI)
  et TVA (Art. 180-6, 175 CGI). Le texte de la loi sur la zone franche (n° 2011-018 selon la CNUCED,
  n° 2012-016 selon la source retenue) et le fiscaliste restent les juges de paix.

## Critères d'acceptation

### Volet A — moteur (`fiscal-service`)

- [x] **AC-A1** — IS, bénéfice 1 234 567, `ARRONDI_ASSIETTE { INFERIEUR, 1000 }` ⇒ assiette 1 234 000,
  montant **333 180** ; le détail porte l'étape « arrondi d'assiette ».
- [x] **AC-A2** — IRPP réel, revenu 25 000 499 ⇒ assiette 25 000 000 ⇒ **5 413 000** ; un produit
  fractionnaire est arrondi à la dizaine inférieure par l'arrondi déclaré.
- [x] **AC-A3** — Ordre d'AD-3 amendée tenu quel que soit l'ordre de déclaration ; un
  `ARRONDI_ASSIETTE` mal formé ou en double fait échouer le chargement.
- [x] **AC-A4** — Spine `fiscal-service` : AD-3 amendée (date, raison, liste à six éléments).

### Volet B — données du paquet `togo@2026` (`balance-service`)

- [x] **AC-B1** — Le paquet structure l'arrondi d'assiette de l'IS (Art. 113) et de l'IRPP (Art. 74),
  l'arrondi du produit IRPP (Art. 74) et le minimum de 20 000 F du MFP au réel (Art. 120), chacun
  avec son article et son texte.
- [x] **AC-B2** — Le moteur de `balance-service` applique les mêmes règles depuis la donnée (pas
  d'écart entre les deux moteurs sur IS, IRPP, MFP) ; un test d'égalité le tient.
- [x] **AC-B3** — Nouvelle empreinte, registre et tests réépinglés, copies à l'octet chez
  `dossier-service` et dans les fixtures de `fiscal-service` ; le paquet réel se charge dans
  `fiscal-service` (vérification des paramètres au chargement, STORY-310).

### Volet C — zone franche intégrée

- [x] **AC-C1** (amendé par D-901-6) — Chaque valeur de `togo-zonefranche@2026` cite sa source :
  article du CGI là où le texte officiel est lu (MFP Art. 121, TVA Art. 180-6 et 175), Africarrières
  sinon, PARAMÉTRABLE (`_meta.parametrage`) ; plus aucune source promotionnelle.
- [x] **AC-C2** — Plus aucune rubrique non consommée sans justification écrite ; les variantes
  régionales sont transcrites depuis le texte ou retirées.
- [ ] **AC-C3** — `_meta.validations` consigne la validation élément par élément ; `statut` ne dit
  plus « amorce ». ⚠️ **Partiel** : la mise en garde ne dit plus « amorce » (« Régime INTÉGRÉ ») et
  `_meta.parametrage` nomme ce qui reste à confirmer ; mais aucune validation n'est consignée dans
  `_meta.validations` — personne n'a encore validé (le fiscaliste, ou toi sur pièce). Le `statut` reste
  `a-valider-par-expert`, comme le paquet de droit commun lui-même.
- [x] **AC-C4** — Un dossier en zone franche est liquidé par `balance-service` et ses obligations
  dérivées par `fiscal-service` sur la surcouche intégrée, de bout en bout (recette). ✅ **Recette
  Docker verte à froid** (2026-11-15, `prospera-recette` #16, `recette/zone-franche.recette.ts`,
  projet `recette901`, volumes neufs, 5/5) : catalogue → dossier → balance → fiscal, le même artefact
  (empreinte `da92a432…`) des deux côtés.

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

**2026-11-14 — volets A, B et C livrés** (D-901-6 pour C). balance-service #143, dossier-service #47,
fiscal-service #40, fusionnées en rebase dans cet ordre ; fiche, tracker et spine par PR sur `main`.

- **A** : `ARRONDI_ASSIETTE` (AD-3 amendée dans la spine), y compris pour le second calcul de
  `MAXIMUM_DE`. Paquet réel : IS 1 234 567 ⇒ 333 180 ; IRPP 25 000 499 ⇒ 5 413 000.
- **B** : paquet `togo@2026` régénéré (sha256 `17d66e23…`), schéma étendu ; moteur de
  `balance-service` : IS sur l'assiette arrondie, MFP au minimum de 20 000 F au réel, seuil de
  STORY-417 avec le pas (invariant F-417-2 éprouvé) ; le même cas rend le même chiffre dans les deux
  moteurs. Copie de `dossier-service` RATTRAPÉE (elle avait manqué MNV-100 et STORY-568).
- **C** : surcouche `togo-zonefranche@2026` (sha256 `da92a432…`) intégrée sur base Africarrières,
  paramétrable ; nouveau mode d'exonération du MFP `REGIME_DEROGATOIRE` (Art. 121), ignoré dans un
  paquet de droit commun (fail-closed).
- **Tests déplacés par la loi** : dans `balance-service`, les jeux de données trop petits ont été
  relevés (résultat 9 195 000 au lieu de 5 195 000 ; le cas de STORY-417 × 10) pour que le minimum du
  MFP n'efface pas l'intention des tests ; les attendus zone franche suivent la nouvelle surcouche.
- **Portes** : fiscal-service 2 279 unitaires, 187 e2e ; balance-service 5 374 unitaires, 1 876 e2e ;
  dossier-service 129 (portefeuille). Restent, préexistants sur `origin/dev` : 5 e2e en 502
  (`regime-derogatoire`) et 1 (`tpu` : « barème TPU indisponible », périmé depuis MNV-100) ; et deux
  écarts propres au poste Windows (CRLF face à bilan-service, chemins `\`).
- **Mutations** : 4/4 (A) et 5/5 (B, C) tuées.
- **Recette Docker (2026-11-15, `prospera-recette` #16)** : fiscal-service levé pour la première fois
  dans la pile de recette (`docker-compose.fiscal.yml`, MongoDB replica set authentifié, audience de
  l'IdP). Le catalogue publie les deux paquets comme de vrais artefacts et les octroie ; trois
  dossiers, même balance (résultat 9 195 000) : zone franche 3ᵉ année ⇒ impôt 0 ; 12ᵉ année ⇒
  1 365 000 ; droit commun ⇒ 2 457 000 (MFP au minimum 2 000 000) ; fiscal-service dérive 17
  obligations signalées `ZONE_FRANCHE`, même empreinte que balance-service.
- ⚠️ **Constat de la recette — catalogue** : le seed n'ouvre aucune famille `fiscal-tg-*` au module
  `declarations` (seulement `syscohada-revise`, `zone-franche-togo`) ⇒ `422 REFERENTIEL_INCOMPATIBLE`
  à l'octroi. Sans le geste d'administration (`PATCH /admin/modules/declarations`), fiscal-service ne
  reçoit AUCUN paquet en production. À semer dans `platform-catalog-service` (story à ouvrir).
- **Reste** : AC-C3 (validation consignée) ; les familles `fiscal-tg-*` du module `declarations` au seed du catalogue ; le texte officiel
  de la loi zone franche ; la limite connue de la STORY-417 sous Art. 113 — au seuil conseillé, l'IS
  dépasse le plancher d'au plus taux × 1 000 F (ex. 4 806 000 pour 4 800 000 unités).
