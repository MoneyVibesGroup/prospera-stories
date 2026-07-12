# Rapport — Logique métier « Bilan » (construction de la balance en amont)

**Date :** 2026-07-12
**Auteur :** Claude (à valider par l'utilisateur avant mise en stories)
**Statut :** DÉCISIONS PRISES (2026-07-12) — cadrage validé, questions résiduelles ouvertes

---

## 0. Décisions validées par l'utilisateur (2026-07-12)

- **D1 (ex-Q1) — Périmètre : MODULE AMONT DISTINCT.** On crée un module amont « **Atelier Balance** » (service candidat `balance-service`) qui **produit la balance** et **alimente** le `bilan-service` existant (lequel reste inchangé en aval : liasse → validation figée → prévisionnel → export). On ne fusionne pas.
- **D2 (ex-Q3) — Pays : Togo en premier, MAIS cible = toute l'Afrique de l'Ouest.** Le modèle doit être **multi-pays dès la conception** : le **paquet fiscal** (taux TPU/IS/TVA/CNSS) ET le **modèle de liasse** sont **keyés par pays** (`togo@2026` d'abord), pas codés en dur. Togo = premier paquet, pas une exception de code.
- **D3 (ex-Q5) — « GUIDEF » = format de liasse CIBLE, importé.** La liasse officielle (par pays) est **importée dans le système comme gabarit cible** à renseigner (structure des postes à remplir), et non un format inventé par nous. → Prévoir un **import de gabarit de liasse par pays**.
- **D4 (ex-Q6) — OCR dès la v1** : captures d'écran + factures → OCR → montants éditables → rangés par mois. Étend `document-service` au-delà du KYC dès la v1.
- **D5 — Verticaux futurs : SFD-BCEAO (microfinance) ET assurances.** En plus du référentiel SFD-BCEAO déjà prévu, un **vertical assurance** est visé plus tard → le découplage moteur ⊥ référentiel doit rester générique (ne rien coder de spécifique cabinet).
- **D6 (ex-Q2) — Ambition v1 = CHEMIN A d'abord.** v1 = cas nominal (**les 2 cahiers présents**) + OCR + fiscalité + rapprochement bancaire → balance. Les **reconstitutions B (inventaire, marge×qté) et C (dépenses fixes +20 %) sont différées en v2**. Jalon plus court, on éprouve le cœur d'abord (dogfooding MV).
- **D7 (ex-Q7) — Extraction OCR Statuts/CFE DÈS la v1.** Import Statuts + carte CFE → extraction auto des champs → **formulaire pré-rempli éditable** dès la v1. Conséquence : l'**OCR v1 a un double emploi** — pièces comptables (recettes/dépenses/factures) **et** documents légaux (profil société). Charge OCR du 1er jalon à dimensionner en conséquence.
- **D8 (raffinement de D2 — analyse régionale §10) — Périmètre géographique = zone OHADA/UEMOA (zone franc XOF) d'abord.** Le **référentiel comptable SYSCOHADA révisé (SN+SMT) est UN paquet unique** couvrant toute la zone OHADA (UEMOA + Guinée). Le **paquet fiscal est par pays × année** ; **Togo = première instance de données, pas un cas de code** — le schéma du paquet fiscal doit absorber TPU/CGU/TPS/IME sans enum spécifique. **Guinée (Conakry)** = même compta mais **monnaie GNF** → attendre le **multi-devises** (le PRD bilan pose « XOF unique v1 », à lever). **CEDEAO anglophone (Nigeria, Ghana…)** = **référentiel IFRS/GAAP local distinct** → **piste séparée, hors v1** (pas une extension de config).
- **O2 (fichier fourni, §12) — la liasse « GUIDEF » = la DSF complète du Togo (OTR), Système Normal, 92 feuilles.** C'est le **contrat de sortie exact** du système : états SYSCOHADA (Bilan Actif/Passif, CR, TFT, codes postes officiels AD/AE/…, N/N-1) + 35 notes annexes + **partie fiscale intégrée** (détermination du résultat fiscal par réintégrations/déductions → liquidation **IS = max(MFP, IS droit commun)** → acomptes) + détails charges/produits + contrôles de cohérence. **Trois conséquences :** (1) le périmètre « liasse » du PRD bilan (EPIC-011) est **à élargir** à la DSF entière ; (2) le **référentiel de postes + la table de passage peuvent être amorcés depuis ce fichier officiel** (accélère la question ouverte #2 du PRD) ; (3) **la fiscalité est DANS la liasse, pas un Module 3 séparé** (confirme l'exigence de l'user).
- **D11 (features ajoutées par l'user, §13) — (a) bilan prévisionnel** (déjà EPIC-013, confirmé first-class) **et (b) simulation & conseil fiscal pour défendre la liasse.** La (b) s'appuie sur le mécanisme légal **réintégrations/déductions** de la DSF : simuler l'impact IS de leviers **légaux** (provisions, amortissements, report déficitaire, réduction d'impôt pour investissement…) et **documenter la justification** de chaque retraitement pour tenir en cas de contrôle OTR. **Garde-fou de conformité (impératif) :** l'outil optimise la **base imposable par des leviers légaux** et sécurise la liasse ; il **ne minore pas la réalité** (recettes réelles, charges fictives = fraude fiscale) — l'immutabilité + piste d'audit + étiquetage « retraité/justifié » sont les garde-fous. Voir §13.
- **D12 (user 2026-07-12) — le gabarit GUIDEF est un artefact PAR PAYS géré CÔTÉ ADMIN.** L'admin-panel doit permettre d'**uploader/gérer le gabarit de liasse de chaque pays** (Togo, puis Sénégal, CI…), que le moteur consomme — zéro code par pays. Cohérent avec le paquet fiscal `pays×année` (D3/D8) : gabarit liasse + paquet fiscal + référentiel = artefacts versionnés administrables.
- **O3 (fichier fourni, §14) — format d'import Sage caractérisé (répond Q10).** `Balance_des_comptes.pdf` = export **Sage 100 i7 « Balance des comptes / Complète »** : comptes **8 caractères** (SYSCOHADA, alphanumériques possibles), 3 blocs Débit/Crédit (**Mouvements N-1 / Mouvements période / Soldes cumulés**), montants XOF sans décimale, lignes « À reporter/Report » et « Totaux » à ignorer/contrôler, split **comptes de bilan (1-5) vs gestion (6-7)**. → parser Sage cadrable ; **préférer l'export Excel/CSV au PDF** (positionnel/lossy).
- **D13 (user 2026-07-12) — `balance-service` = HUB canonique multi-source.** Un **contrat de balance standard** tagué référentiel (SN/SMT/SFD-BCEAO), alimenté par **3 adaptateurs** : (#1) **ingestion DIRECTE `balance.submitted`** — verticaux intégrés IMF/distributeur poussent leur balance (**préféré** : toujours à jour, sans export) → STORY-102 ; (#2) **import fichier** (Sage, externe) → STORY-086 ; (#3) **construction cahiers/OCR** (PME informelle) → STORY-082-085. Déclenché par l'analyse de l'image prospera-IMF (module compta = matérialisation du `comptabilite-service` FI-2 par vertical ; référentiel **SFD-BCEAO** déjà planifié ; l'écart Actif/Passif affiché = le **contrôle d'équilibre FR-A25**). **Pièce maîtresse = STORY-101 (contrat de balance canonique)** : rend cabinet/IMF/distributeur **interchangeables**.
- **D14 (user 2026-07-12) — la balance vient AVANT le bilan (split CORE/EXTENDED).** La production+stockage de la balance **quitte le `bilan-service`** (EPIC-009 **superseded**) et devient le **CORE de `balance-service`, séquencé au sprint 10** (contrat canonique + stockage + import Sage + saisie manuelle + handoff) → la balance est **stockée avant** le Bilan. **Bilan (sprints 11-14) inchangé → Bilan MV non retardé 🏁.** **EXTENDED** (profil OCR, cahiers/OCR, rapprochement, fiscal, conseil) = sprints 15-19. Tracker mis à jour : 20 sprints, 0 doublon, stories 001→102 ; STORY-101 (contrat canonique) + STORY-102 (ingestion directe) ajoutées.
- **O4 (fichier fourni, §15) — taux fiscaux Togo 2026 confirmés + Q4 tranchée.** CGI 2026 : **IS 27 %** (Art. 113), **MFP 1 % du CA HT → impôt = max(MFP, IS)** (Art. 120), **TVA 18 %** unique (Art. 195), **4 acomptes** (Art. 114). **Q4 : « régime synthétique » = régime fiscal de l'entreprenant / TPU** (Chap. V CGI, personnes physiques/EI, seuil CA ~30 M) ↔ compta **SMT**. Amorces produites : `referentiels/paquet-fiscal-togo-2026.json` + `referentiels/postes-syscohada-guidef-togo.{csv,json}` (163 postes).
- **O1 (observation terrain, §11) — la compta interne MV tourne déjà sur Sage 100 Comptabilité i7** (partie double, journaux Achats/Ventes/Trésorerie/Général/Situation, plan SYSCOHADA, XOF, exercice 2026). Conséquence directe : **le dogfooding MV passe par l'EXPORT de balance Sage → `bilan-service`** (flux NB-1, dé-risqué), **pas** par l'Atelier Balance. → **DEUX profils clients à servir** : structuré (export logiciel) vs informel (Atelier Balance). Répond à la question ouverte n°1 du PRD bilan : **format d'import prioritaire = export Sage 100**.
- **D9 (ex-Q9) — Sage = pont de MIGRATION, pas substrat permanent ; Prospera = système primaire visé.** Les clients déjà sur Sage **importent leur Sage dans Prospera pour continuer** (migration) ; le **but** est qu'une **nouvelle structure adopte Prospera directement** (rapide + efficace). Synthèse retenue : **l'import Sage = reprise de la balance d'ouverture (à-nouveaux)**, puis le client **continue à enregistrer dans l'Atelier Prospera** (cahiers = journaux) ; le nouveau venu démarre à zéro dans l'Atelier. Les deux profils convergent vers le `bilan-service`. *(⇒ on ne se contente pas d'une liasse one-shot au-dessus de Sage : Prospera doit être l'outil du quotidien. Le remplacement de la saisie partie double complète reste hors v1 — l'Atelier/SMT en est la forme légère.)* Export Sage réel (Q10) : **fourni par l'user (à venir)** pour caler le parser.
**Documents liés :**
- `prd-bilan-service-2026-07-10.md` (PRD v1.0, 24 FR — décision NB-1 : bilan calculé *depuis une balance importée*)
- `architecture-bilan-service-2026-07-07.md` (moteur paramétré par référentiel, gate `@RequiresBilanAccess`)
- `synthese-services-prospera-2026-07-10.md` (PLAN FINAL — FI-2 comptabilité différée, Module 3 fiscalité, DO-1 OCR hors périmètre)

---

## 1. Objet

Tu as décrit la **logique métier réelle du travail d'un comptable en Afrique de l'Ouest** pour aboutir à un bilan. Ce rapport :
1. **reformule** ta logique en un modèle structuré,
2. **ajoute** la couche comptable/fiscale OHADA qui manque (mapping normalisé),
3. **répond** à ta demande sur les documents/référentiels à réunir,
4. **situe** tout cela par rapport à ce qui est déjà décidé (PRD + archi) et **signale l'écart majeur de périmètre**,
5. liste les **questions à trancher** avant d'écrire les stories.

---

## 2. ⚠️ Constat central : tu décris un périmètre PLUS EN AMONT que le PRD actuel

C'est le point le plus important à valider **avant tout découpage**.

| | **PRD `bilan-service` actuel (v1.0, NB-1)** | **Ce que tu viens de décrire** |
|---|---|---|
| Point de départ | Une **balance déjà faite**, importée en Excel/CSV | Des **pièces primaires brutes** : cahiers recettes/dépenses, factures, captures d'écran, relevés bancaires, inventaire physique |
| Rôle du logiciel | Prendre une balance équilibrée → produire la liasse | **Construire la balance elle-même** à partir de preuves hétérogènes (voire la reconstituer quand un cahier manque) |
| Fiscalité | **Hors périmètre** (renvoyée au Module 3 `fiscal-service`) | **Incluse** : TPU, IS, TVA, taxes, à intégrer dans la balance |
| OCR / captures | **Hors périmètre** (DO-1 : OCR = strictement KYC en v1) | **Central** : capture d'écran → OCR → montants éditables → rangés par mois |
| Saisie / reconstitution | **Hors périmètre** (FI-2 : `comptabilite-service` différé) | Reconstitution par inventaire, marge × quantité, majoration 20 % |
| Rapprochement bancaire | Non prévu | **Prévu** (upload relevés → comparaison cahiers) |

**Conclusion.** Ta description recouvre en réalité **trois briques** que le plan actuel avait volontairement séparées et différées :
- une **pré-comptabilité / atelier de construction de balance** (≈ le `comptabilite-service` différé en FI-2),
- un **moteur fiscal** (taux d'imposition, TPU/IS/TVA — ≈ le `fiscal-service` du Module 3),
- de l'**OCR de pièces** (≈ `document-service` au-delà du KYC).

Le `bilan-service` existant reste **valable et réutilisable en aval** (balance → liasse → validation figée → prévisionnel → export). Ta logique est **l'étage du dessous** qui *produit la balance* qu'il consomme.

👉 **Décision à prendre (Q1) :** on élargit le périmètre v1 pour couvrir cette construction de balance (produit beaucoup plus ambitieux, très adapté au terrain ouest-africain), ou on la traite comme un **module amont distinct** (« Atelier Balance ») qui alimente le `bilan-service` existant ? *Ma recommandation en §8.*

---

## 3. Reformulation structurée de ta logique métier

### 3.1 Profil de la société (identité comptable & fiscale)

Saisie **manuelle** OU **automatique** par import + extraction (OCR/parsing) de **2 pièces** : les **Statuts** et la **carte CFE**. Champs cibles à extraire :

| Champ | Source typique | Usage |
|---|---|---|
| Raison sociale / nom | Statuts, CFE | Identité, en-tête liasse |
| Objet social (activité) | Statuts | **Détermine le régime fiscal et le taux TPU** |
| Capital social | Statuts | Passif (capitaux propres) |
| Régime fiscal | CFE / déclaration | **Pilote tout le calcul** (voir 3.2) |
| Actionnaires & parts | Statuts | Annexe, répartition capital |
| Forme juridique (SARL, SA, SAS, EI…) | Statuts | Règles de présentation, obligations |
| NIF | CFE | Identifiant fiscal |
| CNSS | CFE / immatriculation | Charges sociales |
| RCCM | CFE | Immatriculation registre commerce |
| Adresse / e-mail / tél. du gérant | Statuts, CFE | Coordonnées liasse |
| Date de création | Statuts / RCCM | Ancienneté, premier exercice |

> ⚠️ **Ownership.** L'`Organization` (raison sociale, orgId) appartient déjà à **auth-service**. Ces champs comptables/fiscaux sont un **profil étendu** propre au domaine bilan → à stocker côté service métier, **sans dupliquer** l'identité. (À arbitrer en Q7.)

### 3.2 Régimes → **DEUX axes orthogonaux** (comptable OHADA ⊥ fiscal national) *(couche que j'ajoute — corrigée)*

> **Correction d'une approximation d'une version antérieure.** « Régime synthétique = SMT » est **corrélé, pas équivalent**. Il faut distinguer deux axes indépendants, portés séparément par le profil de la société ; le système propose un défaut cohérent mais ne les confond pas.

**Axe A — Système COMPTABLE (SYSCOHADA révisé, AUDCIF 2017 — harmonisé dans toute la zone OHADA) :**

| Système | Base | Pour qui | Base de calcul |
|---|---|---|---|
| **Système Normal (SN)** | Engagements (créances/dettes) | Au-dessus du seuil OHADA | comptabilité d'engagement |
| **Système Minimal de Trésorerie (SMT)** | **Trésorerie** (encaissements/décaissements) | Sous le seuil (AUDCIF art. 13) | recettes − dépenses |

Ta logique de **cahiers recettes/dépenses** *est* la comptabilité du **SMT** (états simplifiés : bilan, compte de résultat de trésorerie, notes). Le seuil SN/SMT dépend du **CA annuel par type d'activité** (donnée à versionner). **Le PRD `bilan-service` actuel ne couvre QUE le SN** → **le SMT est un manque à packager comme référentiel.**

**Axe B — Régime FISCAL (national, NON harmonisé — voir §10) :** réel normal / réel simplifié / micro-forfaitaire. Nom et seuils **propres à chaque pays** (TPU Togo, CGU Sénégal, TPS Bénin, IME Côte d'Ivoire, Impôt Synthétique Mali…). Détermine **quels impôts** s'appliquent et **si la TVA** est due.

**Corrélation typique (défaut proposé, non imposé) :** petite entreprise → régime fiscal simplifié **+** compta SMT ; grande → réel normal **+** SN avec/sans TVA. Mais les deux axes se règlent indépendamment (une entité peut être au réel simplifié fiscalement tout en tenant un SN comptable).

### 3.3 Construction de la balance — **3 chemins de données**

Le cœur de ta logique. Le système doit gérer trois situations :

**Chemin A — Les deux cahiers présents (cas nominal)**
- **Recettes** → Total Général = **Chiffre d'affaires**. Saisie possible par **captures d'écran → OCR → montants éditables → rangés par mois**. Rattachées au **plan comptable (classe 7 – Produits)**.
- **Dépenses** → catégorisées (achat marchandises, loyer, électricité/CEET, factures, etc.), **imports éditables** (le comptable ajoute/retire). Rattachées au **plan comptable (classe 6 – Charges)**.
- → **Balance** = agrégation soldes classes + rattachement postes.

**Chemin B — Cahier de recettes ABSENT (reconstitution du CA)**
- Si **CA de l'année passée connu** → simulation.
- Sinon, à partir des **factures d'achat de l'année** → **inventaire** (ce qui a été acheté vs vendu) → CA reconstitué = **Σ (marge × quantité vendue)**, à partir du prix d'achat et du prix de revente par produit.
- → CA déduit de l'inventaire (déstockage).

**Chemin C — Cahier de dépenses ABSENT (reconstitution des charges)**
- **Dépenses fixes** : loyer, salaires, déplacements, prestations de service.
- **+ majoration de 20 %** → constitue le cahier de dépenses reconstitué.

> 🔴 **Garde-fou métier (important, §7).** Les chemins B et C produisent une balance **estimée/reconstituée**, pas certifiée. Elle doit être **étiquetée comme telle** (statut « reconstituée » vs « justifiée ») et **traçable** (quelle méthode, quelles hypothèses) — enjeu de responsabilité professionnelle du comptable.

### 3.4 Hiérarchie des preuves & sources acceptées

Tu poses une **hiérarchie de fiabilité** — à formaliser comme règle du moteur :

1. **Rapprochement bancaire** (le meilleur) : upload des **relevés bancaires** → *tous les dépôts sont des entrées = CA* ; comparaison avec cahiers recettes/dépenses.
2. **Factures normalisées / cahier de recettes / factures de vente** : relevé sur l'année, tous les dépôts constituent le CA.
3. **Factures d'achat** (fournisseurs) : base de l'inventaire et de la reconstitution.
4. **Reçus / captures** : via OCR, éditables.
5. **Estimation manuelle** : **uniquement si prouvable** (dernier recours).

**Tiers (clients / fournisseurs) :** n'accepter que **cahier de recettes ou facture normalisée** comme pièce probante.

### 3.5 Fiscalité — **doit faire partie de la balance** *(couche que j'ajoute + précise)*

Les **impôts et taxes** entrent dans la balance. Logique par régime :

- **Régime synthétique (déclaratif/forfaitaire)** :
  - **TPU** (Taxe Professionnelle Unique) — selon **LPF/CGI**, fonction de l'**objet** et du **régime**.
  - **Taxe d'habitation**, **droit d'enregistrement sur le loyer**, etc.
- **Régime réel (sans/avec TVA)** :
  - **Impôt sur les Sociétés (IS)**.
  - **TVA** (si applicable) — **ressortir le taux** utilisé.
  - Liste complète des impôts issue du **LPF / CGI** du pays.

**Règle que tu poses (à retenir) :** *ne pas chercher les articles, mais les **taux d'imposition*** pour le bilan. → Le système a besoin d'un **barème de taux versionné** (pas d'un moteur juridique). Prévoir une **catégorie « Autres »** pour tout impôt hors liste, avec saisie d'un taux/montant manuel.

> 💡 **Tie-in architecture.** Ces taux changent chaque année (loi de finances) et par pays. Ils se packagent **exactement comme les référentiels comptables** de l'archi existante : un **« paquet fiscal » versionné par pays + année** (`togo-cgi@2026`, taux TVA/IS/TPU/CNSS), chargé par le moteur au même titre que la table de passage. Zéro fork, cohérent avec P7/B2.

### 3.6 Livrables attendus

- **Balance** générée sur la période.
- **Bilan** / états financiers (→ réutilise le `bilan-service` existant : Bilan, Compte de résultat, TFT/TAFIRE, annexes, colonnes N/N-1).
- **État de rapprochement bancaire** (relevés vs cahiers).
- **Situation du compte en fin d'année**.
- **Quittances de paiement** (des impôts/taxes).
- **Liasse** au format cible (« GUIDEF » — *format à confirmer, Q5*).

---

## 4. Rattachement au plan comptable & aux référentiels *(synthèse de ma valeur ajoutée)*

- **Référentiel comptable = SYSCOHADA révisé (AUDCIF 2017)** pour tous les pays OHADA/UEMOA. Deux systèmes à packager :
  - **Système Normal (SN)** → régime normal (déjà prévu au PRD).
  - **Système Minimal de Trésorerie (SMT)** → régime synthétique (**à ajouter** — ta logique cahiers = SMT).
- **Rattachement** : chaque ligne (recette/dépense/facture) → **compte du plan** (classes 6/7 en priorité pour le résultat, 1-5 pour le bilan) → **poste d'état** via la **table de passage** (mécanisme FR-006 déjà spécifié). Ta logique alimente donc **en amont** ce mécanisme existant.
- **IFRS** : réservé aux **groupes/consolidation** (comme tu l'as dit) → **hors v1** (déjà hors périmètre PRD).
- **SFD-BCEAO** : référentiel des IMF/microfinance, déjà prévu — orthogonal à ta logique cabinet.

---

## 5. Documents & référentiels à réunir *(réponse à ta demande)*

Tu as cité : LPF, OHADA, CGI, Plan comptable, IFRS (groupes). Voici la **liste complète et précise** :

### 5.1 Socle comptable OHADA (commun à tous les pays UEMOA)
- ✅ **AUDCIF / SYSCOHADA révisé (2017)** — Acte uniforme + **plan de comptes normalisé** + **modèles d'états financiers** du **Système Normal ET du SMT** + **seuils** SN/SMT (art. 13). *Source : Journal officiel OHADA / ohada.org.*
- ✅ **AUSCGIE** (Acte uniforme sur les sociétés commerciales et le GIE) — utile pour **parser les Statuts** (formes juridiques, capital, parts d'actionnaires).

### 5.2 Socle fiscal **par pays** (à réunir pays par pays)
- ✅ **CGI** du pays — **taux** IS, TVA, TPU, IRPP, retenues à la source, droits d'enregistrement.
- ✅ **LPF** du pays — régimes d'imposition, **seuils**, obligations déclaratives, échéances.
- ✅ **Barème CNSS** du pays — taux de cotisations sociales (part patronale/salariale).
- ✅ **Modèle de liasse fiscale / DSF** du pays (format de dépôt à l'administration) — *ex. Togo : e-liasse OTR ; « GUIDEF » à confirmer (Q5)*.

> ⚠️ **Indices dans ta description** (CEET, CNSS, TPU, carte CFE) pointent vers **le Togo** comme premier pays. **À confirmer (Q3)** : quel pays en premier ? La structure est multi-pays, mais le **paquet fiscal** doit être constitué pays par pays.

### 5.3 Réservé plus tard
- **IFRS** (groupes/consolidation) — hors v1.
- **Instruction/plan comptable SFD-BCEAO** — pour le vertical microfinance (déjà prévu).

**Ce dont j'ai besoin de ta part :** les **PDF officiels** (ou liens) du **CGI + LPF + barème CNSS + modèle de liasse** du **pays cible n°1**, et la **table de passage SMT** si elle existe déjà quelque part (sinon à construire — c'est un chantier référentiel à part entière, cf. question ouverte n°2 du PRD).

---

## 6. Écarts avec le PRD/archi existants & impacts

| Élément de ta logique | Statut dans le plan actuel | Impact |
|---|---|---|
| Construction de balance depuis pièces | **Hors NB-1** (balance importée) | Nouveau périmètre / nouveau module (Q1) |
| OCR captures & factures | **Hors DO-1** (OCR = KYC only) | Étend `document-service` ; fiabilité OCR + **édition humaine obligatoire** |
| Reconstitution (inventaire, marge×qté, +20 %) | **Hors FI-2** | Logique nouvelle ; **statut « estimée »** obligatoire |
| Fiscalité (TPU/IS/TVA/taxes) | **Module 3 différé** | Avancer un **mini-moteur fiscal** (taux, pas juridique) |
| Rapprochement bancaire | Absent | Nouveau : upload relevés + moteur de matching |
| **SMT (système minimal trésorerie)** | **Absent du PRD** (SN only) | **Ajout référentiel** — cœur du régime synthétique |
| Bilan / liasse / N-1 / validation figée / export | **Déjà couvert** (FR-009→023) | ✅ **Réutilisé tel quel en aval** |
| Gate accès / entitlement / multi-tenant / immutabilité | **Déjà couvert** (archi EPIC-008) | ✅ Réutilisé |

**Bonne nouvelle :** toute la moitié « aval » (liasse, immutabilité, prévisionnel, export, sécurité, multi-tenant) est **déjà spécifiée**. Ta logique ajoute la moitié « amont » (produire la balance) — cohérente avec l'archi *moteur paramétré par référentiel* si on y branche **SMT + paquet fiscal**.

---

## 7. Risques & garde-fous à intégrer dès la conception

1. **Balance reconstituée ≠ balance justifiée.** Chemins B/C → marquer chaque montant par son **niveau de preuve** (bancaire > facture > reçu/OCR > estimation) et le **statut global** de la balance. Empêcher la **validation figée** (FR-014/015) d'une balance majoritairement estimée sans mention explicite. *Responsabilité professionnelle.*
2. **OCR faillible.** Toujours **montants éditables** après extraction (tu l'as déjà dit) ; ne jamais figer sur l'OCR seul.
3. **Taux fiscaux = données réglementaires datées.** Versionner par **pays + année** (loi de finances) ; un mauvais taux fausse tout le bilan. Catégorie **« Autres »** pour l'imprévu.
4. **Mobile money / captures.** En Afrique de l'Ouest une grande part des flux passe par **mobile money** (relevés en capture d'écran). C'est un **atout produit majeur** mais l'OCR de ces captures doit rester **vérifié humainement** et **rangé par mois**.
5. **Piste d'audit** (déjà FR-017) : étendre aux **actions de reconstitution** (qui a estimé quoi, sur quelle base).

---

## 8. Proposition de découpage (candidats épics — à valider AVANT stories)

> Recommandation : traiter ta logique comme un **module amont « Atelier Balance »** qui **alimente** le `bilan-service` existant (plutôt que tout fusionner). On garde l'aval déjà spécifié intact, et on livre l'amont par incréments. Fusion vs module séparé = **Q1**.

- **EPIC-A — Profil société & extraction** : saisie manuelle + import Statuts/CFE → extraction champs (§3.1). *Dépend de : ownership auth-service (Q7).*
- **EPIC-B — Référentiels étendus** : packager **SMT** + **paquet fiscal pays** (taux TPU/IS/TVA/CNSS versionnés). *Cœur ; conditionne l'exactitude.*
- **EPIC-C — Saisie recettes/dépenses & OCR** : cahiers, catégories, captures→OCR→éditable→par mois, rattachement plan comptable (§3.3-A).
- **EPIC-D — Reconstitution** : chemins B (inventaire, marge×qté) et C (dépenses fixes +20 %), avec statut « estimée » (§3.3-B/C, §7).
- **EPIC-E — Moteur fiscal** : calcul TPU / IS / TVA / taxes selon régime → intégration dans la balance (§3.5).
- **EPIC-F — Rapprochement bancaire** : upload relevés, matching cahiers, état de rapprochement, situation de compte (§3.4, §3.6).
- **EPIC-G — Génération balance → handoff bilan-service** : produire la balance normalisée consommée par les EPIC-009→014 existants (§3.6).

*(Estimations et stories : à faire au sprint planning, après validation de ce rapport.)*

---

## 9. Questions résiduelles (après décisions §0)

**Tranchées :** Q1→D1, Q3→D2, Q5→D3, Q6→D4, Q2→D6, Q7→D7 (extraction OCR dès v1 ; ownership champs fiscaux = à confirmer au PRD, reco : extension côté `balance-service`, ne pas dupliquer l'identité auth-service).

**Restent ouvertes :**
- **Q4 — SMT.** Confirmer que « régime synthétique » = **Système Minimal de Trésorerie OHADA** (structure des états simplifiés à cadrer). *(confirmation attendue)*
- **Q8 — Documents Togo.** Fournir **CGI + LPF + barème CNSS + gabarit de liasse (GUIDEF)** du **Togo**, et une éventuelle **table de passage SMT** existante.

---

*Cadrage validé (module amont « Atelier Balance », multi-pays Togo→AO, OCR v1 double emploi, chemin A d'abord). Prochaine étape : rédiger le **PRD « Atelier Balance »** dédié (feeder du `bilan-service`), puis découper en stories. Q4/Q8 alimentent le PRD sans le bloquer.*

---

## 10. Analyse régionale Afrique de l'Ouest (posture expert-comptable & fiscale)

> Point clé : **« Afrique de l'Ouest » n'est PAS un espace comptable homogène.** Il recouvre trois mondes incompatibles. Ne pas concevoir « pour le Togo » ni supposer qu'un pays = juste un nouveau paquet de config.

### 10.1 Les trois blocs

| Bloc | Pays | Référentiel comptable | Monnaie | TVA std (indic.) | Statut produit |
|---|---|---|---|---|---|
| **UEMOA** (zone franc) | Bénin, Burkina, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, **Togo** | **SYSCOHADA révisé** (SN + SMT) | **XOF** | 18 % (Niger 19 %) | ✅ **Cible v1** — compta identique, seul le fiscal varie |
| **OHADA hors UEMOA** | **Guinée (Conakry)** | SYSCOHADA révisé | **GNF** | 18 % | ⚠️ Même compta, **autre monnaie + fiscalité** → besoin multi-devises |
| **CEDEAO anglophone / lusophone** | **Nigeria, Ghana**, Sierra Leone, Liberia, Gambie, Cap-Vert | **IFRS / GAAP local** (hors OHADA) | NGN, GHS, … | Nigeria 7,5 %, Ghana ~15 %+ | 🔴 **2ᵉ référentiel comptable** — piste séparée, hors v1 |

*(Taux et noms indicatifs — à confirmer sur les textes en vigueur. C'est précisément pourquoi le fiscal doit être une DONNÉE versionnée, pas du code.)*

### 10.2 Panorama fiscal UEMOA — régimes « petit contribuable » (axe B)

Le **référentiel comptable est commun** ; **la fiscalité ne l'est pas**. Régime simplifié par pays (indicatif, à sourcer au CGI) :

| Pays | Régime simplifié / micro | Réel | TVA |
|---|---|---|---|
| **Togo** | **TPU** (Taxe Professionnelle Unique) | Réel (simplifié / normal) | 18 % |
| **Sénégal** | **CGU** (Contribution Globale Unique) | RSI / réel normal | 18 % |
| **Côte d'Ivoire** | **IME** / entreprenant (TEE/TCE) | RSI / RNI | 18 % |
| **Bénin** | **TPS** (Taxe Professionnelle Synthétique) | Réel | 18 % |
| **Mali** | **Impôt Synthétique** | Réel | 18 % |
| **Burkina Faso** | **CME** (Contribution des Micro-Entreprises) | RSI / réel normal | 18 % |
| **Niger** | Régime synthétique | Réel | 19 % |
| **Guinée-Bissau** | (régime simplifié local) | Réel | — |

IS (impôt sur les sociétés) : globalement **≈ 25–30 % selon le pays** (à fixer par paquet fiscal). Directive TVA UEMOA : taux dans une bande harmonisée (~15–20 %).

### 10.3 Conséquences de conception (au-delà du Togo)

1. **Un seul référentiel comptable packagé** (`syscohada-revise` : SN + SMT) sert **toute la zone OHADA** — on ne le duplique pas par pays.
2. **Paquet fiscal générique keyé `pays × année`** : `{ régimes[], seuils, taxes[], taux, gabaritLiasse }`. Le schéma doit absorber TPU **et** CGU **et** IME **sans** enum spécifique-pays. **Togo = 1ʳᵉ instance de données.**
3. **Profil société = 2 axes** : `systemeComptable` (SN/SMT) **+** `regimeFiscal` (national), proposés selon pays + CA, réglables indépendamment (§3.2).
4. **Monnaie = attribut par pays**, pas une constante. XOF pour l'UEMOA ; **Guinée impose le multi-devises (GNF)** → lever l'hypothèse « XOF unique » du PRD bilan quand la Guinée entre.
5. **Anglophone = second moteur de référentiel** (IFRS/GAAP local), langue EN, fiscalité autre → **ne pas** le promettre comme simple extension ; piste distincte, chiffrée à part.
6. **Gabarit de liasse (D3/GUIDEF) = par pays** (chaque administration a son format) → import de gabarit keyé pays, cohérent avec le paquet fiscal.

### 10.4 Trajectoire recommandée

**v1 :** SYSCOHADA (SN+SMT) + **paquet fiscal Togo** + XOF → éprouvé en dogfooding MV.
**v1.x :** ajout paquets fiscaux UEMOA (Sénégal, CI, Bénin…) — **zéro code, que de la donnée**.
**v2 :** multi-devises → **Guinée (GNF)**.
**Piste séparée (non planifiée v1/v2) :** référentiel **IFRS/GAAP anglophone** → Nigeria/Ghana.

---

## 11. Analyse terrain — la comptabilité interne MV tourne sur Sage 100 (impact dogfooding)

> Captures fournies le 2026-07-12 : **Sage 100 Comptabilité i7**, société « MONEY VIBES », **exercice 2026** (01/01→31/12), **XOF (F CFA)**.

### 11.1 Faits observés

- **Partie double complète** : saisie d'**écritures** dans des **journaux** (Débit/Crédit, « Solde à équilibrer », « Équilibrer »), **compte général + compte tiers**, N° pièce / N° facture / libellé / échéance.
- **5 types de journaux** : **Achats, Ventes, Trésorerie, Général, Situation** (création du journal `ACH` / « JA ACHAT » montrée).
- **Plan SYSCOHADA** probable : compte `6011 – ACHAT DE MARCHANDISE` (601 = marchandises en SYSCOHADA ; le PCG français utiliserait 607).
- **Monnaie** F CFA / **code ISO XOF**, décimales 0 ; **longueur de compte** variable 3→13 ; **numérotation** de pièces paramétrable ; **ventilation analytique** disponible.
- ⚠️ **Fiche société aux défauts FRANÇAIS non localisés** : `Pays = FRANCE`, `SIRET`, `NAF (APE)`, `Identifiant TVA` (Sage = produit français), **pas** de NIF/RCCM/CNSS natifs.

### 11.2 Implications (analyse)

1. **Le dogfooding MV n'a PAS besoin de l'Atelier Balance.** MV tient une vraie compta → chemin le plus court vers ses états financiers oct. 2026 = **export balance Sage → `bilan-service` → liasse** (= flux NB-1 déjà spécifié, désormais concrètement faisable). **L'Atelier Balance sert les PME externes sans logiciel**, pas MV.
2. **DEUX profils clients à modéliser** (convergent vers le même format de balance) :

| Profil | Réalité | Chemin |
|---|---|---|
| **Structuré (dont MV)** | Compta partie double (Sage 100…) | **Export balance logiciel → `bilan-service`** |
| **Informel (PME)** | Cahiers / reçus / mobile money | **Atelier Balance** (OCR, reconstitution) → balance → `bilan-service` |

3. **Répond à la question ouverte n°1 du PRD bilan** (« format de balance prioritaire ») : **export Sage 100** (balance générale ; potentiellement grand livre / journaux / FEC). → cadrer le format exact (Q10).
4. **Pont informel ↔ formel** : tes **cahiers = journaux Sage** (recettes→Ventes, dépenses→Achats, banque/caisse→Trésorerie). La balance = agrégation des journaux par compte, quel que soit le chemin → **même contrat de sortie** vers le `bilan-service`.
5. **Fiche société à re-localiser OHADA** : ce que Sage stocke en SIRET/NAF/Identifiant TVA doit être re-mappé sur **NIF / RCCM / CNSS / forme juridique OHADA** dans notre profil société (§3.1). Ne pas hériter des libellés français.

### 11.3 Posture Sage — TRANCHÉE (D9)

**Sage = pont de migration, pas substrat permanent.** Les clients déjà sur Sage **importent leur Sage pour continuer dans Prospera** ; le but est qu'une **nouvelle structure adopte Prospera directement** (rapide + efficace). Donc Prospera est le **système primaire**, pas une couche de reporting posée sur Sage à demeure.

**Modèle unifié qui en découle (fort) :**

```
Client déjà sur Sage :  export Sage ─▶ REPRISE balance d'ouverture (à-nouveaux) ─▶ continue dans l'Atelier Prospera (cahiers = journaux) ─▶ balance ─▶ bilan-service
Nouvelle structure    :  démarre à zéro ─────────────────────────────────────────▶ Atelier Prospera (cahiers/OCR) ──────────────────────▶ balance ─▶ bilan-service
```

- L'**import Sage** devient un **cas particulier de la reprise d'exercice** (balance d'ouverture), pas un flux séparé permanent.
- Prospera doit être **l'outil du quotidien** (enregistrement continu), pas une liasse one-shot.
- **Hors v1** : remplacer la **saisie partie double complète** de Sage (= `comptabilite-service`, FI-2) ; l'**Atelier / SMT** en est la **forme légère** suffisante pour PME et nouvelles structures.

### 11.4 Question restante

- **Q10 — Format d'export Sage 100** à cibler : balance générale (Excel/CSV) en priorité ; grand livre / journaux / format d'échange Sage / FEC à évaluer. **Export réel anonymisé : fourni par l'user (à venir)** → calage du parser d'import + de la reprise à-nouveaux.

---

## 12. Analyse du fichier GUIDEF — la liasse fiscale cible (DSF Togo / OTR)

> Fichier fourni le 2026-07-12 : `1000745307_2025_Definitif (1).xlsx`, **92 feuilles**. Entité « PARVIS DE LA MAISON SAINTE », **NIF 1000745307**, Région **Maritime / Golfe (Lomé) → Togo**, exercice clos **31/12/2025**, **Système Normal**. C'est le **contrat de sortie exact** que notre système doit générer.

### 12.1 Structure de la DSF (ce que le système doit produire)

| Bloc | Feuilles | Contenu |
|---|---|---|
| **Identification** | Page de garde, Fiche conditions/dépôt, NAEMA, Table des codes, Fiche identification 1&2, Fiche dirigeants | Identité entité, dirigeants, activité (nomenclature **NAEMA** = AFRISTAT, commune UEMOA) |
| **États financiers SYSCOHADA** | Bilan Actif, Bilan Passif, Compte de Résultat, TFT | **Codes postes officiels** (AD, AE, AF, AG, AH, AI…), colonnes **N/N-1**, BRUT / AMORT-DÉPREC / NET, renvois aux notes |
| **Notes annexes** | Note 1 → Note 35 (+ sous-notes 3A-E, 8A, 15A/B, 16A/B/C…) | Les 35 états annexes réglementaires SYSCOHADA |
| **🔑 Fiscal** | Résultat fiscal, Détail réintégrations/déductions, Liquidation IS_IR_MP, Liquidation DP, Gestion déficits-crédits | Passage résultat comptable → fiscal → **liquidation de l'impôt** |
| **Détails** | P64-P82 (charges/produits, transactions intragroupe, coût d'achat/production/ventes, CA fiscal, capitaux propres, dettes/créances fiscales, TVA, TVM, provisions) | Ventilations détaillées |
| **Tiers & compléments** | Liste principaux clients / fournisseurs, P85 amortissements, P86 renseignements | |
| **Contrôles** | Balance (Optionnel), **Contrôle de Cohérence, Type de Contrôles** | Balance importable + **contrôles d'articulation intégrés** |

### 12.2 Le moteur fiscal (spécifié par les feuilles « Résultat fiscal » + « Liquidation »)

**Chaîne de détermination de l'impôt (à implémenter) :**

```
RÉSULTAT COMPTABLE (bénéfice/perte net)
  + RÉINTÉGRATIONS (codes 10-80) : amort. excédentaires, IS/IR/MFP, provisions non déductibles,
      amendes & pénalités, rémunération exploitant, charges somptuaires, jetons de présence,
      intérêts excédentaires comptes courants associés, autres réintégrations
  − DÉDUCTIONS (codes 90-125) : provisions antérieurement taxées, plus-values exonérées,
      réduction d'impôt pour investissement de bénéfice, autres déductions
  = RÉSULTAT FISCAL avant imputation
  − déficits antérieurs reportables − amortissements réputés différés
  = RÉSULTAT FISCAL DÉFINITIF (bénéficiaire / déficitaire)

LIQUIDATION : CA → Minimum Forfaitaire de Perception (MFP)
              IS droit commun sur résultat fiscal
              IMPÔT DÛ = max( MFP , IS droit commun )    ← concept clé Togo
              − crédits d'impôt → IMPÔT NET LIQUIDÉ
              − 4 acomptes provisionnels (31 jan/mai/juil/oct) = SOLDE à verser
```

- **Concept clé Togo : IS = max(MFP, IS)** — même en perte, un minimum (MFP, assis sur le CA) est dû → à porter dans le paquet fiscal Togo (taux MFP, taux IS).
- Les **codes** (10-170 pour le résultat fiscal, A-L pour la liquidation) sont des identifiants officiels → à modéliser comme structure du **paquet fiscal**.

### 12.3 Contrôles de cohérence (feuille « Type de Contrôles ») — spec directe de FR-013

Contrôles « intermontant » officiels à répliquer (légende 0=erreur / 1=bon) :
- **Actif = Passif** (en N)
- **Résultat Net Comptable** : CR = Passif Bilan = Détermination résultat fiscal
- **Résultat Fiscal** : CR ↔ Détermination résultat fiscal
- **CA** : CR = Liquidation IS_IR_MP (cohérence chiffre d'affaires)
- Cohérence n° compte bancaire, effectifs, cotation des valeurs numériques par poste.

> ⚠️ **Fait marquant : l'exemplaire « Définitif » fourni échoue 2/8 contrôles** (dont Actif≠Passif en N). → **preuve concrète de la valeur** de contrôles proactifs *avant* dépôt : le système attrape ce qu'un dépôt manuel laisse passer.

### 12.4 Conséquences produit

1. **Élargir le périmètre « liasse » du PRD bilan (EPIC-011)** de « Bilan/CR/TFT/notes » à la **DSF complète** (35 notes + section fiscale + détails + contrôles). C'est un incrément important à chiffrer.
2. **Amorcer le référentiel de postes + la table de passage depuis ce fichier** (codes officiels présents) → répond partiellement à la question ouverte #2 du PRD (« source de vérité du plan normalisé »). **Prochaine action possible : extraire automatiquement la nomenclature complète des postes de ce classeur.**
3. **Le gabarit d'export final = ce classeur** (D3/GUIDEF) : le système remplit cette structure. **Import de gabarit par pays** (Togo d'abord), format Excel officiel.
4. **Confirme les deux référentiels** : ce fichier est le **Système Normal** ; le **SMT** (régime synthétique) aura sa propre liasse simplifiée (à obtenir).

---

## 13. Nouvelles features demandées (D11) — prévisionnel & conseil fiscal

### 13.1 Bilan prévisionnel (confirmé first-class)

Déjà couvert par le `bilan-service` **EPIC-013** (hypothèses paramétrables, projection 3 ans, plan de trésorerie 12 mois, scénarios). L'user le reconfirme comme feature centrale. **Ajout au vu du §12 :** le prévisionnel doit pouvoir produire un **bilan/CR prévisionnel + une estimation d'IS prévisionnel** (via le même moteur fiscal) — utile au pilotage (« combien d'impôt l'an prochain selon ce scénario »).

### 13.2 Simulation & conseil fiscal pour « défendre la liasse » — cadrage + garde-fous

**Besoin exprimé :** le client peut demander de **réduire la base pour payer moins d'impôt** ; le système doit **conseiller** et permettre de **bien défendre le bilan proposé**.

**Traduction professionnelle (le vrai métier de l'expert-comptable) :** ce besoin se réalise **exactement** via le mécanisme **réintégrations/déductions** de la DSF (§12.2). L'optimisation fiscale **légale** consiste à :
- **activer les leviers légaux** qui réduisent le résultat fiscal : provisions déductibles, amortissements (y c. réputés différés), **report des déficits**, **réduction d'impôt pour investissement de bénéfice**, choix de régime, etc. ;
- **simuler des scénarios** (« avec / sans cette provision », « si on impute tel déficit ») et afficher l'**impact chiffré sur l'IS** (en tenant compte du plancher **MFP**) ;
- **documenter la base légale** (article CGI/LPF, pièce justificative) de chaque retraitement, pour que la liasse **tienne en cas de contrôle OTR**.

**🔴 Garde-fou de conformité — à intégrer dès la conception (non négociable) :**

| ✅ Ce que l'outil fait (optimisation légale) | 🚫 Ce que l'outil NE fait PAS (fraude) |
|---|---|
| Simuler l'IS selon des **retraitements fiscaux légaux** (réintégrations/déductions) | **Minorer les recettes réelles** / dissimuler du CA |
| Maximiser les **déductions/réductions autorisées** justifiées | Créer des **charges fictives** sans justificatif |
| Choisir des **options fiscales** offertes par la loi (report déficit, amortissements) | Modifier « en douce » une liasse **validée** (immutabilité) |
| **Documenter** chaque ajustement (base légale + pièce) pour défendre la liasse | Produire des chiffres **non traçables** |

**Mécanique système :** un scénario d'optimisation est un **brouillon simulé** distinct du réel, chaque ajustement **tracé et justifié** (auteur, base légale, pièce), la version **validée reste immuable** (FR-014/015). Le résultat = un **comparatif « liasse déposée vs scénario optimisé »** + un **dossier de justification** (le « pourquoi » qui défend le bilan). C'est de l'**optimisation fiscale sécurisée**, pas de l'évasion — et c'est précisément ce qui fait la valeur du conseil.

**Épic candidat ajouté :** **EPIC-H — Moteur fiscal & conseil** : détermination résultat fiscal (réintégrations/déductions) + liquidation IS (max MFP/IS) + simulation de scénarios légaux + dossier de justification. *(Dépend du paquet fiscal Togo — Q8.)*

---

## 14. Analyse du fichier balance Sage (format d'import — répond Q10)

> Fichier fourni : `Balance_des_comptes.pdf` — export **Sage 100 Comptabilité i7 8.50**, entité « ETS RELAXED » (commerçant, régime réel avec TVA), édition « **Balance des comptes / Complète** », période 01/01/23→31/12/23.

### 14.1 Structure de l'export

| Colonne | Détail |
|---|---|
| **Numéro de compte** | **8 caractères**, plan **SYSCOHADA** (10=capital, 24=immo, 31=marchandises, 40=fournisseurs, 41=clients, 44=État/impôts, 52=banque, 57=caisse, 60-70=gestion). ⚠️ **alphanumérique possible** (ex. `5211BOA0`) → le parser ne doit pas supposer que du numérique |
| **Intitulé des comptes** | libellé |
| **Mouvements au 31/12/N-1** (Débit/Crédit) | position antérieure (utile **N-1 / à-nouveaux**) |
| **Mouvements** (Débit/Crédit) | mouvements de la période |
| **Soldes cumulés** (Débit/Crédit) | **soldes de clôture** — l'entrée principale du bilan |
| Lignes **« À reporter » / « Report »** | reports de pagination → **à ignorer** |
| Lignes **« Totaux comptes de bilan / de gestion / de la balance »** | **contrôles** (Σ débit = Σ crédit) → vérifier l'équilibre |

### 14.2 Enseignements pour le parser (EPIC-G / import)

1. **Cible = « Soldes cumulés » (clôture)** pour le bilan N, **« Mouvements N-1 »** pour le comparatif — mais ⚠️ ici N-1 = *position*, pas un solde net : à normaliser (solde = débit − crédit par compte).
2. **Montants XOF sans décimale**, séparateur d'espace pour les milliers → nettoyage `strip(" ")`.
3. **Ignorer** les lignes de report ; **utiliser** les totaux comme **contrôle d'équilibre** (FR-002).
4. **Split bilan (classes 1-5) vs gestion (6-7)** déjà fourni par Sage → aide au rattachement (6-7 → Compte de résultat, 1-5 → Bilan).
5. **⚠️ Recommandation : demander l'export Excel/CSV de Sage** plutôt que le PDF. Le PDF est **positionnel** (colonnes reconstituées par espaces) → fragile ; l'Excel/CSV Sage (ou le format d'échange Sage / FEC) donnera un parseur fiable. Le PDF confirme le **modèle de colonnes** ; la production doit viser le fichier structuré.
6. **Détails fiscaux visibles dans la balance** (utiles au mapping) : `44xx` État/impôts (TVA facturée/récupérable/due/crédit, impôt bénéfices, **droit d'enregistrement**, **TH**, retenues **RSL/RSH**), `43` CNSS — confirme les postes fiscaux à rattacher.

---

## 15. Analyse du CGI/LPF Togo 2026 — amorce du paquet fiscal

> Fichier fourni : `CGI et LPF 2026_ (1).pdf` (~365 pages). Taux d'en-tête lus **directement dans le texte** (références d'articles ci-dessous). Amorce structurée : **`referentiels/paquet-fiscal-togo-2026.json`**.

### 15.1 Taux confirmés (Togo 2026)

| Élément | Valeur | Base | Réf. |
|---|---|---|---|
| **IS** | **27 %** | bénéfice imposable (résultat fiscal définitif) | Art. 113 |
| **MFP** (minimum forfaitaire) | **1 % du CA HT** | **impôt dû = max(MFP, IS)** | Art. 120 |
| **TVA** | **18 %** | taux unique, CA HT | Art. 195 |
| **Acomptes** | **4** (31 jan/mai/juil/oct) | ¼ des cotisations de l'exercice précédent | Art. 114 |
| Intérêts c/c associés | déductibles ≤ taux légal +3 pts, plafond 30 % | | Art. ~ |

### 15.2 Régimes (Q4 tranchée)

- **Régime réel** (normal / simplifié) → **Système Normal (SN)** — grandes/moyennes entreprises (seuils exacts à confirmer, zone 500 M / 1 Md FCFA).
- **Régime fiscal synthétique de l'entreprenant et des entreprises individuelles** (Chap. V CGI, Art. 128-135) → **TPU** (libératoire), régime **forfaitaire** (collectivités) + **déclaratif** (État), cible personnes physiques/EI, seuil CA ~**30 M FCFA** → compta **SMT**. **✅ C'est le « régime synthétique » de l'user (Q4).**

### 15.3 Autres impôts recensés dans le CGI (pour la catégorie « Autres » + verticaux futurs)

IRPP (barème progressif, tranche haute 30 %) · TVM · TAF · **TCA (taxe conventions d'assurance — futur vertical assurance)** · droits d'accises · patente / taxe foncière / **TH** · droits d'enregistrement (loyers, cessions, fusions 1 %) · **retenues à la source (RSL loyers, RSH honoraires)**.

### 15.4 Reste à compléter (avant validation experte)

- Taux **TPU par tranche** (Art. 134 déclaratif / 135 forfaitaire) ; seuils exacts des régimes.
- **Barème CNSS** (source distincte du CGI — à fournir).
- Taux TAF / TCA / TVM si dans le périmètre.
- **Validation par un expert-comptable/fiscaliste togolais** (le JSON marque `statut` par élément).
