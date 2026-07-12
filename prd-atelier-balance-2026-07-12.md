# Product Requirements Document : Atelier Balance (module amont)

**Date :** 2026-07-12
**Auteur :** Claude (à valider par l'utilisateur)
**Version :** 0.1 — Draft
**Type de projet :** API (micro-service NestJS) — module amont
**Écosystème :** PROSPERA / Money Vibes
**Documents liés :**
- Cadrage & décisions : `rapport-bilan-logique-metier-2026-07-12.md` (D1→D12, O1→O4)
- Aval consommateur : `prd-bilan-service-2026-07-10.md` (liasse, validation figée, prévisionnel, export)
- Amorces référentiels : `referentiels/` (table de passage SYSCOHADA validée, paquet fiscal Togo, 163 postes GUIDEF)

---

## 1. Vue d'ensemble

`atelier-balance` (service candidat `balance-service`) est le **module AMONT** qui **produit une balance comptable normalisée et contrôlée** à partir de pièces primaires (cahiers, factures, captures OCR, relevés bancaires) **ou** d'un import de logiciel comptable (Sage), puis calcule la **fiscalité** et alimente le `bilan-service` existant qui génère la liasse (DSF), la valide et en dérive le prévisionnel.

> **Frontière module (D1).** `atelier-balance` = *fabriquer la balance + profil société + fiscalité + conseil*. `bilan-service` = *rendre la liasse (DSF complète), figer, prévisionnel, export*. Les deux convergent sur un **contrat de balance normalisée**.

**Positionnement des deux profils clients (O1) :**

```
Client structuré (dont MV, déjà sur Sage) : export Sage → reprise balance d'ouverture → Atelier → balance normalisée → bilan-service
PME informelle (nouvelle structure)        : cahiers/OCR (chemin A) ────────────────────→ balance normalisée → bilan-service
```

---

## 2. Résumé exécutif

Le comptable saisit/importe le **profil fiscal** de la société (manuel ou **extraction OCR** des Statuts + carte CFE), le système détermine le **système comptable OHADA** (Système Normal / **SMT**) et le **régime fiscal** national ; il construit la balance par le **chemin A** (cahiers de recettes/dépenses, captures et factures via **OCR**, rangés par mois, rattachés au **plan comptable SYSCOHADA** via la **table de passage**) **ou** par **import Sage** ; il **rapproche** les relevés bancaires ; il **calcule la fiscalité** (résultat fiscal par réintégrations/déductions, **IS = max(MFP, IS)**, TVA, taxes) qui s'intègre à la balance ; il peut **simuler des scénarios d'optimisation fiscale légale** avec dossier de justification pour **défendre la liasse** ; enfin il **contrôle et livre** une balance normalisée au `bilan-service`.

Le tout est **multi-pays** (Togo d'abord, cible UEMOA/zone OHADA), piloté par des **artefacts versionnés administrables** (référentiel comptable, paquet fiscal `pays×année`, gabarit de liasse par pays).

---

## 3. Objectifs & métriques

### Objectifs métier
1. Permettre à une **nouvelle structure** d'adopter Prospera directement (rapide + efficace) sans logiciel comptable préexistant (D9).
2. Permettre à un **client déjà sur Sage** de **migrer** (reprise de balance) et de continuer dans Prospera (D9).
3. **Intégrer la fiscalité** (calcul de l'impôt) au flux du bilan, avec **conseil pour défendre la liasse** (D11).
4. Poser un socle **multi-pays** réutilisable (D2/D8) sans fork.

### Métriques de succès
- Une balance produite par le **chemin A** (cahiers présents) génère une liasse **équilibrée** (Actif=Passif) via le `bilan-service`.
- Un **import Sage** produit une balance normalisée reprise correctement (à-nouveaux).
- Le **calcul d'IS** (max MFP/IS) et la TVA sont produits et rapprochables du CGI en vigueur.
- Un **scénario d'optimisation** produit un comparatif + un **dossier de justification** traçable ; **aucune** minoration non justifiée possible sur une liasse validée.

---

## 4. Périmètre v1 (décisions)

**INCLUS (v1) :** profil société + extraction OCR (D7) · détermination 2 axes SN/SMT + régime fiscal · **chemin A** de construction de balance (D6) · **OCR captures & factures dès v1** (D4) · import/migration Sage (D9) · rapprochement bancaire · moteur fiscal (résultat fiscal, IS, TVA, taxes) · simulation & conseil fiscal avec garde-fous (D11) · contrôles + livraison balance normalisée au `bilan-service`.

**EXCLUS (v2+) :** reconstruction chemins B (inventaire, marge×qté) et C (dépenses fixes +20 %) (D6) · remplacement de la saisie partie double complète de Sage (`comptabilite-service`, FI-2) · **multi-devises**/Guinée (le PRD bilan pose XOF unique) · référentiel **IFRS anglophone** (Nigeria/Ghana) (D8) · rendu de la **liasse SMT** tant que le gabarit SMT n'est pas fourni.

---

## 5. Exigences fonctionnelles

### EPIC-AB-01 — Profil société & régime

**FR-A01 — Saisie/gestion du profil société (Must).** Champs OHADA : raison sociale, sigle, objet/activité (NAEMA), capital, forme juridique, NIF, RCCM, CNSS, actionnaires & parts, adresse/email/tél. gérant, date de création, dirigeants.
- Stockage keyé `orgId` ; ne duplique pas l'identité auth-service (extension métier — cf. Q ouverte ownership).

**FR-A02 — Extraction OCR des Statuts + carte CFE (Must, D7).** Import des 2 pièces → extraction des champs → **formulaire pré-rempli éditable** (l'humain valide). Champs non extraits = saisis manuellement.

**FR-A03 — Détermination des 2 axes (Must).** Proposer le **système comptable** (SN/SMT selon seuils OHADA) **et** le **régime fiscal** national (réel/synthétique-TPU selon seuils CGI), à partir du pays + objet + CA. **Réglables indépendamment** ; l'humain confirme.

### EPIC-AB-02 — Référentiels & paramétrage pays

**FR-A04 — Chargement du référentiel comptable (Must).** SYSCOHADA révisé (**SN + SMT**), plan de comptes + **table de passage** comptes→postes, chargé par pays (paquet versionné, checksum).

**FR-A05 — Chargement du paquet fiscal `pays×année` (Must, D8).** Taux (IS, MFP, TVA, TPU…), seuils, règles réintégrations/déductions, calendrier d'acomptes — Togo d'abord (`paquet-fiscal-togo-2026`).

**FR-A06 — Gabarit de liasse par pays, géré côté admin (Must, D12).** L'admin-panel **upload/gère le gabarit GUIDEF** de chaque pays ; le moteur le consomme pour restituer la liasse. Aucun code par pays.

**FR-A07 — Table de passage & surcharges locales (Must / Should).** Rattachement compte→poste par la table du référentiel ; comptes non reconnus listés pour arbitrage ; surcharge `(orgId, compte)→poste` tracée.

### EPIC-AB-03 — Construction de balance, chemin A (cahiers + OCR)

**FR-A08 — Cahier de recettes (Must).** Saisie des recettes = chiffre d'affaires, **rangées par mois**, rattachées aux comptes de produits (classe 7). Import possible par **captures d'écran → OCR → montants éditables** (D4).

**FR-A09 — Cahier de dépenses (Must).** Catégories (achat marchandises, loyer, électricité/CEET, factures…), **éditables** (ajout/retrait par le comptable), rattachées aux comptes de charges (classe 6). Import factures via **OCR**.

**FR-A10 — OCR de pièces (Must, D4).** Extraction montants/dates/tiers depuis captures & factures ; **toujours éditable** (jamais figé sur l'OCR seul) ; rangement par mois ; niveau de confiance affiché.

**FR-A11 — Rattachement au plan comptable (Must).** Chaque ligne → compte SYSCOHADA → poste d'état via la **table de passage** (validée). Comptes de tiers/trésorerie ventilés au **solde** (actif si débiteur, passif si créditeur).

### EPIC-AB-04 — Import & migration (profil structuré)

**FR-A12 — Import balance Sage (Must, O3/D9).** Import de l'export **Sage 100 « Balance des comptes »** (comptes 8 car., blocs Mouvements N-1 / période / **Soldes cumulés**). Ignore lignes report ; contrôle via totaux. **Préférence Excel/CSV** ; PDF supporté en secours.

**FR-A13 — Reprise de balance d'ouverture / à-nouveaux (Must, D9).** L'import Sage sert de **balance d'ouverture** ; le client **continue** ensuite dans l'Atelier (cahiers = journaux). Traçabilité de la source.

**FR-A14 — Profil d'import & mapping colonnes (Should).** Mapping colonne→champ mémorisé comme profil réutilisable (formats sources variés).

### EPIC-AB-05 — Rapprochement bancaire

**FR-A15 — Import relevés bancaires (Must).** Upload des relevés (y c. **mobile money** — TMoney/Flooz), par compte de trésorerie.

**FR-A16 — Rapprochement (Must).** Comparaison relevés ↔ cahiers recettes/dépenses ; **hiérarchie de preuve** (bancaire > facture normalisée > reçu/OCR > estimation) ; règle « tout dépôt = entrée = CA ».

**FR-A17 — État de rapprochement & situation de compte (Must).** Production de l'**état de rapprochement bancaire** et de la **situation du compte en fin d'exercice**.

### EPIC-AB-06 — Moteur fiscal (la fiscalité fait partie de la balance)

**FR-A18 — Détermination du résultat fiscal (Must).** Résultat comptable **+ réintégrations − déductions − déficits reportables** = résultat fiscal (mécanisme et **codes officiels** de la DSF ; cf. paquet fiscal).

**FR-A19 — Liquidation de l'impôt (Must).** **IS = max( MFP , IS droit commun )** (Togo : IS 27 %, MFP 1 % CA HT), crédits d'impôt, **4 acomptes**, solde. Pour le régime synthétique : **TPU**.

**FR-A20 — TVA & taxes (Must).** TVA (18 % Togo) collectée/déductible/due/crédit ; taxes du CGI (TH, droits d'enregistrement, retenues RSL/RSH…) ; **catégorie « Autres »** avec taux/montant manuel pour tout impôt hors liste.

**FR-A21 — Intégration des provisions fiscales à la balance (Must).** L'IS/MFP, la TVA due et les taxes calculés sont **écrits dans la balance** (comptes 44/89) → « les impôts font partie de la balance ».

### EPIC-AB-07 — Simulation & conseil fiscal (défendre la liasse)

**FR-A22 — Scénarios d'optimisation légale (Must, D11).** Simuler l'impact IS de **leviers légaux** (provisions, amortissements, report de déficits, réduction d'impôt pour investissement…) via les **réintégrations/déductions**, en tenant compte du plancher **MFP**.

**FR-A23 — Comparatif & dossier de justification (Must, D11).** Restituer un comparatif **« liasse de référence vs scénario optimisé »** et un **dossier de justification** (base légale CGI/LPF + pièce) par retraitement, pour tenir en contrôle OTR.

**FR-A24 — Garde-fous de conformité (Must — NFR liée).** Un scénario est un **brouillon simulé** distinct du réel ; chaque ajustement **tracé et justifié** ; **interdiction** de minorer une base réelle (recettes réelles, charges fictives) ; une liasse **validée reste immuable**. L'outil optimise **la base par des leviers légaux**, il ne falsifie pas la réalité.

### EPIC-AB-08 — Contrôles & livraison au bilan-service

**FR-A25 — Contrôles d'intégrité (Must).** Équilibre (Σ débit = Σ crédit ; Σ soldes = 0, tolérance d'arrondi) ; doublons/comptes vides/non numériques ; comptes non mappés signalés.

**FR-A26 — Contrôles de cohérence (Should).** Répliquer les contrôles officiels de la DSF : Actif=Passif, articulation RNC (CR=Passif=résultat fiscal), CA (CR=liquidation). Anomalies listées avant livraison.

**FR-A27 — Statut de preuve de la balance (Must).** Étiqueter chaque montant par son **niveau de preuve** et la balance par un **statut global** (justifiée / partiellement estimée). Une balance majoritairement estimée n'est pas livrable en « validée » sans mention (prépare chemins B/C v2).

**FR-A28 — Contrat de sortie & handoff (Must).** Produire la **balance normalisée** (schéma stable) consommée par le `bilan-service` (EPIC-009→014) pour générer la liasse, la figer et le prévisionnel.

---

## 6. Exigences non fonctionnelles

- **NFR-A01 Sécurité & accès (Must).** Relying party RS256/JWKS ; gate `@RequiresBilanAccess` (email vérifié + KYC approuvé + entitlement) ; isolation `orgId`.
- **NFR-A02 Multi-tenant (Must).** Toutes les données keyées `orgId`.
- **NFR-A03 Exactitude comptable (Must).** Calculs déterministes, arrondis XOF sans perte ; table de passage testée (jeux de référence rejoués — la balance ETS RELAXED sert de fixture, 0 compte orphelin).
- **NFR-A04 Conformité fiscale & garde-fous (Must, D11).** Traçabilité de tout retraitement (auteur, base légale, pièce) ; immutabilité des liasses validées ; l'outil n'implémente aucun mécanisme de minoration non justifiée.
- **NFR-A05 Qualité OCR (Must, D4).** Montants toujours éditables ; niveau de confiance exposé ; jamais de figement sur OCR seul.
- **NFR-A06 Multi-pays sans fork (Must, D8).** Référentiel + paquet fiscal + gabarit liasse = **données versionnées** ; le code ne contient aucun taux/gabarit en dur.
- **NFR-A07 Immutabilité & audit (Must).** Snapshots append-only ; piste d'audit (import, mapping, calcul fiscal, simulation, validation, export).
- **NFR-A08 Sauvegardes (Must).** Sauvegardes DB dès la prod interne (compta réelle MV).
- **NFR-A09 Performance (Should).** Construction/calcul d'une balance courante en temps interactif.
- **NFR-A10 Observabilité & docs (Should).** Logs corrélés ; Swagger ; seuils de test du programme.

---

## 7. Epics (synthèse)

| Epic | Nom | FR | Priorité |
|---|---|---|---|
| AB-01 | Profil société & régime (OCR Statuts/CFE, 2 axes) | A01-A03 | Must |
| AB-02 | Référentiels & paramétrage pays (SN+SMT, table passage, paquet fiscal, gabarit admin) | A04-A07 | Must |
| AB-03 | Construction balance — chemin A (cahiers + OCR) | A08-A11 | Must |
| AB-04 | Import & migration Sage (reprise à-nouveaux) | A12-A14 | Must |
| AB-05 | Rapprochement bancaire | A15-A17 | Must |
| AB-06 | Moteur fiscal (résultat fiscal, IS max MFP, TVA, taxes) | A18-A21 | Must |
| AB-07 | Simulation & conseil fiscal (défendre la liasse) + garde-fous | A22-A24 | Must |
| AB-08 | Contrôles & livraison balance normalisée → bilan-service | A25-A28 | Must |

---

## 8. Personas

**Deux personas opérateurs seulement** — les utilisateurs du système sont ceux qui *opèrent* l'Atelier, pas les sociétés traitées.

- **Cabinet comptable** *(persona opérateur principal)* — construit la balance, arbitre le mapping, calcule et conseille la fiscalité, défend la liasse, pour ses **dossiers clients**. La comptabilité interne de MV agit comme son **propre cabinet** (dogfooding). **Peut être remplacé par un distributeur** selon le vertical (même rôle opérateur).
- **Administrateur plateforme** *(admin-panel)* — gère référentiels, paquets fiscaux et **gabarits de liasse par pays** (D12).

> **Non-personas.** La **société traitée** — PME informelle **ou** entité déjà sur Sage (migration) — est le **dossier client** du cabinet/distributeur, **pas un utilisateur** du système. « Une nouvelle structure adopte Prospera » (D9) = son dossier est tenu dans Prospera **via** le cabinet/distributeur (ou son propre comptable jouant ce rôle).

---

## 9. User Flows

1. **Profil.** Import Statuts+CFE → OCR → profil pré-rempli → confirmation régime (SN/SMT + fiscal).
2. **Chemin A.** Cahiers recettes/dépenses (+ OCR captures/factures, par mois) → rattachement plan comptable → balance brouillon.
3. **Migration Sage.** Export Sage → reprise à-nouveaux → poursuite dans l'Atelier.
4. **Rapprochement.** Relevés (banque + mobile money) → matching cahiers → état de rapprochement + situation de compte.
5. **Fiscal.** Résultat comptable → réintégrations/déductions → résultat fiscal → **IS=max(MFP,IS)** + TVA/taxes → provisions dans la balance.
6. **Conseil.** Scénario d'optimisation légale → comparatif + dossier de justification (garde-fous).
7. **Livraison.** Contrôles (équilibre, cohérence) + statut de preuve → **balance normalisée → bilan-service** (liasse, validation figée, prévisionnel, export GUIDEF).

---

## 10. Dépendances

- **bilan-service** (aval) — consomme la balance normalisée ; produit la liasse (DSF), fige, prévisionnel, export.
- **auth-service** — JWT RS256/JWKS ; identité `Organization`.
- **kyc-service / catalog** — read-models du gate (KYC, entitlement).
- **document-service** — **OCR** (au-delà du KYC, D4) — à étendre.
- **admin-panel** — gestion des **référentiels, paquets fiscaux, gabarits de liasse par pays** (D12).
- **Référentiels packagés** — `referentiels/` (table de passage SYSCOHADA validée, paquet fiscal Togo, 163 postes GUIDEF).

---

## 11. Hypothèses

- Client zéro = **MV** (dogfooding) via **migration Sage** ; PME externes via **chemin A**.
- **Togo** = premier pays ; modèle **multi-pays UEMOA** dès la conception ; **XOF unique** en v1.
- Régime synthétique = **TPU / entreprenant** (compta SMT) ; régime normal = réel (compta SN).
- La fiscalité (IS/MFP/TVA/taxes) **fait partie de la balance** (provisions écrites en compta).

---

## 12. Hors périmètre (v1)

Reconstruction chemins B/C · remplacement Sage (saisie partie double / `comptabilite-service`) · multi-devises & Guinée · référentiel IFRS anglophone · rendu liasse SMT (jusqu'à obtention du gabarit) · édition des référentiels/paquets (faite en admin, pas ici).

---

## 13. Questions ouvertes

1. **Ownership du profil société** : extension `balance-service` vs auth-service (ne pas dupliquer l'identité) ?
2. **Fournisseur OCR** (captures + documents légaux) : moteur retenu, coût, langue FR ?
3. **Paquet fiscal Togo** : compléter taux **TPU par tranche**, seuils exacts des régimes, **barème CNSS** (source distincte).
4. **Gabarit liasse SMT** (régime synthétique) à obtenir ; **liasse SN** = gabarit GUIDEF fourni.
5. **Export Sage** : obtenir un **Excel/CSV** (pas seulement PDF) pour un parser fiable.
6. **Frontière fiscale exacte** avec `bilan-service` : le moteur fiscal vit dans `atelier-balance` (provisions dans la balance) et le **rendu des états fiscaux de la DSF** dans `bilan-service` — à confirmer.
7. **Validation experte** du paquet fiscal et de la table de passage par un expert-comptable/fiscaliste togolais.

---

## 14. Annexe — Artefacts déjà produits (2026-07-12)

- `referentiels/table-de-passage-syscohada.json|csv` — compte SYSCOHADA → poste GUIDEF (79 détail + 20 totaux), **validée 100 %** sur la balance Sage réelle.
- `referentiels/postes-syscohada-guidef-togo.json|csv` — 163 postes officiels (Bilan/CR/TFT/fiscal).
- `referentiels/paquet-fiscal-togo-2026.json` — IS 27 %, MFP 1 % (max), TVA 18 %, régimes, réintégrations/déductions.
- `referentiels/README.md` — provenance, confiance, validation.

---

*PRD Draft v0.1 — à valider. Prochaine étape après validation : `/bmad:sprint-planning` pour découper AB-01→AB-08 en stories, en priorisant le socle (profil + référentiels + chemin A + handoff) pour un premier jalon dogfooding.*
