# Sprint Plan — Intégration « Atelier Balance » (Module 1-bis)

**Date :** 2026-07-12
**Auteur :** Claude (à valider)
**Base :** `prd-atelier-balance-2026-07-12.md` (validé), `rapport-bilan-logique-metier-2026-07-12.md` (D1→D12)
**Tracker maître :** `sprint-status.yaml` (v6.0.0) — ce document décrit l'insertion et sert de source aux entrées YAML.

---

## 0. Révision 2026-07-12 (D13/D14) — split CORE/EXTENDED + hub multi-source

**D14 — la balance vient AVANT le bilan.** La production+stockage de la balance quitte `bilan-service` (EPIC-009 **superseded**) et devient le **CORE de `balance-service` au sprint 10** : contrat canonique + stockage + import Sage + saisie manuelle + handoff → la balance est **stockée d'abord**, le `bilan-service` la consomme ensuite. **Bilan (sprints 11-14) inchangé.**
- **CORE (sprint 10, 21 pts)** : STORY-076 (scaffold), 077 (read-models/gate), **101 (contrat canonique)**, 086 (import Sage), 099 (handoff).
- **EXTENDED (sprints 15-19)** : profil OCR, cahiers/OCR, rapprochement, fiscal, conseil (078-098, 100, 102).

**D13 — hub canonique multi-source.** Un contrat de balance standard **tagué référentiel** (SN/SMT/SFD-BCEAO), alimenté par **3 adaptateurs** :
| # | Adaptateur | Story | Cible | Préférence |
|---|---|---|---|---|
| 1 | **Ingestion directe `balance.submitted`** | STORY-102 (S17) | Verticaux intégrés **IMF/distributeur** (leur module compta pousse sa balance) | **Préféré** (toujours à jour, sans export) |
| 2 | **Import fichier** | STORY-086 (CORE S10) | Externe (**Sage**) | Fallback hors-bus |
| 3 | **Construction cahiers/OCR** | STORY-082-085 (S16) | **PME informelle** | Dernier recours |

**Keystone = STORY-101 (contrat canonique)** : rend cabinet/IMF/distributeur interchangeables ; à concevoir dès le sprint 10.

---

## 1. Décision d'intégration

L'Atelier Balance devient un **nouveau service `balance-service` (:3007)**, module **AMONT** qui **produit la balance** consommée par le `bilan-service`. Il est séquencé comme **Module 1-bis**, **après le cœur Bilan (sprint 14)**, car :

1. **Le dogfooding MV n'en dépend pas** (O1) : MV passe par **export Sage → `bilan-service`** (import EPIC-009, sprint 10) → liasse (sprints 11-14). Le cœur Bilan reste prioritaire et inchangé.
2. L'Atelier sert le **marché PME externe** (cahiers/OCR) + apporte le **moteur fiscal** et le **conseil** → vient enrichir le Bilan une fois son socle livré.
3. Le **paiement** (ex-sprint 15) est décalé en **sprint 20** (Module 2, JIT, dépend de PS-1/C8 — décalage sans impact, déjà « proposed »).

> **Épics numérotés à la suite** d'EPIC-016 (admin-panel) : **EPIC-017 → EPIC-024**. **Stories à la suite** de STORY-075 : **STORY-076 → STORY-100**. Conforme à la norme (entrées YAML `not_started` ; docs `.md` créés JIT au sprint-planning de chaque sprint).

---

## 2. Épics (service `balance-service`)

| Epic | Nom | PRD | Sprint |
|---|---|---|---|
| **EPIC-017** | Squelette balance-service (scaffold, gate, read-models, chargement référentiel/paquet fiscal) | infra AB-02 | 15 |
| **EPIC-018** | Profil société & régime (OCR Statuts/CFE, 2 axes SN/SMT + régime fiscal) | AB-01 | 15-16 |
| **EPIC-019** | Référentiels étendus & paramétrage pays (SMT + paquet fiscal `pays×année` + gabarit liasse admin) | AB-02 | 15-16 |
| **EPIC-020** | Construction de balance — chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable) | AB-03 | 16 |
| **EPIC-021** | Import & migration Sage (reprise à-nouveaux) | AB-04 | 17 |
| **EPIC-022** | Rapprochement bancaire (relevés + mobile money) | AB-05 | 17 |
| **EPIC-023** | Moteur fiscal (résultat fiscal, IS = max(MFP, IS), TVA, taxes, provisions) | AB-06 | 18 |
| **EPIC-024** | Simulation & conseil fiscal + contrôles & handoff bilan-service | AB-07 + AB-08 | 19 |

---

## 3. Stories & séquencement (STORY-076 → STORY-100)

### Sprint 15 — Socle balance-service + profil société (≈21 pts)
| Story | Titre | Epic | Pts |
|---|---|---|---|
| STORY-076 | Scaffold `balance-service` (:3007, relying party JWKS, health, Kafka) | EPIC-017 | 3 |
| STORY-077 | Read-models (entitlement.changed + kyc.status.changed) + gate `@RequiresBalanceAccess` | EPIC-017 | 5 |
| STORY-078 | Chargement référentiel comptable + **paquet fiscal** (loader + checksum + cache) | EPIC-017/019 | 5 |
| STORY-079 | Profil société : modèle + CRUD (NIF, RCCM, CNSS, actionnaires, forme juridique…) keyé `orgId` | EPIC-018 | 5 |
| STORY-080 | Détermination **2 axes** (SN/SMT + régime fiscal) proposée selon pays + objet + CA | EPIC-018 | 3 |

### Sprint 16 — OCR profil + chemin A cahiers (≈23 pts)
| Story | Titre | Epic | Pts |
|---|---|---|---|
| STORY-081 | Extraction **OCR Statuts + carte CFE** → profil pré-rempli éditable *(étend document-service EPIC-015)* | EPIC-018 | 5 |
| STORY-082 | **Cahier de recettes** (saisie + rangement par mois + rattachement produits classe 7) | EPIC-020 | 5 |
| STORY-083 | **Cahier de dépenses** (catégories éditables + rattachement charges classe 6) | EPIC-020 | 5 |
| STORY-084 | **OCR captures & factures** → montants éditables, par mois *(étend document-service)* | EPIC-020 | 5 |
| STORY-085 | Rattachement au **plan comptable** (transaction → compte) + ventilation | EPIC-020 | 3 |

### Sprint 17 — Import Sage + rapprochement bancaire (≈21 pts)
| Story | Titre | Epic | Pts |
|---|---|---|---|
| STORY-086 | **Import balance Sage 100** (Excel/CSV prioritaire, PDF secours ; comptes 8 car. alphanum ; blocs N-1/mvts/soldes) | EPIC-021 | 5 |
| STORY-087 | **Reprise balance d'ouverture / à-nouveaux** + continuité dans l'Atelier | EPIC-021 | 5 |
| STORY-088 | Profil d'import & mapping colonnes réutilisable | EPIC-021 | 3 |
| STORY-089 | Import **relevés bancaires** (banque + **mobile money** TMoney/Flooz) | EPIC-022 | 3 |
| STORY-090 | **Rapprochement** (relevés ↔ cahiers) + état de rapprochement + situation de compte | EPIC-022 | 5 |

### Sprint 18 — Moteur fiscal (≈21 pts)
| Story | Titre | Epic | Pts |
|---|---|---|---|
| STORY-091 | **Détermination du résultat fiscal** (réintégrations/déductions, codes DSF) | EPIC-023 | 5 |
| STORY-092 | **Liquidation IS = max(MFP, IS)** + 4 acomptes + crédits d'impôt (paquet Togo) | EPIC-023 | 5 |
| STORY-093 | **TVA** (collectée/déductible/due/crédit) + taxes + **catégorie « Autres »** | EPIC-023 | 5 |
| STORY-094 | **Intégration des provisions fiscales à la balance** (comptes 44/89) | EPIC-023 | 3 |
| STORY-095 | Régime **synthétique / TPU** (calcul forfaitaire + déclaratif) | EPIC-023 | 3 |

### Sprint 19 — Conseil fiscal + contrôles + handoff 🏁 (≈21 pts)
| Story | Titre | Epic | Pts |
|---|---|---|---|
| STORY-096 | **Scénarios d'optimisation légale** (leviers réintégrations/déductions → impact IS, plancher MFP) | EPIC-024 | 5 |
| STORY-097 | **Comparatif + dossier de justification** (base légale CGI/LPF + pièce) + **garde-fous conformité** | EPIC-024 | 5 |
| STORY-098 | Contrôles d'intégrité + cohérence (Actif=Passif, articulation) + **statut de preuve** de la balance | EPIC-024 | 5 |
| STORY-099 | **Contrat de sortie & handoff** balance normalisée → `bilan-service` | EPIC-024 | 3 |
| STORY-100 | **e2e Atelier (docker)** : cahiers/OCR + Sage → balance → fiscal → handoff bilan-service | EPIC-024 | 3 |

**Total : 25 stories, ≈107 pts, 5 sprints (15-19).** Paiement (016-019, 039) → **sprint 20**.

---

## 4. Coordinations & points à trancher (éviter les doublons)

1. **Table de passage (comptes → postes)** reste dans **`bilan-service` EPIC-010 (STORY-055)**. L'Atelier ne fait que **transaction → compte** (plan comptable) ; `bilan-service` fait **compte → poste**. Pas de duplication. *(La table de passage déjà amorcée et validée `referentiels/table-de-passage-syscohada.json` alimente STORY-055.)*
2. **Import balance** : `bilan-service` **STORY-050** (import Excel/CSV générique, sprint 10) sert le **dogfooding MV** ; `balance-service` **STORY-086** (import Sage riche + reprise à-nouveaux) sert le **flux Atelier**. À l'implémentation, factoriser le parser (candidat : bibliothèque partagée) — sinon STORY-050 reste le chemin court, STORY-086 le chemin complet.
3. **Rendu de la section fiscale de la liasse (DSF)** : le **moteur fiscal** vit dans `balance-service` (EPIC-023, produit résultat fiscal + IS + provisions) ; le **rendu des états fiscaux** dans la liasse est dans `bilan-service` **EPIC-011**. → `bilan-service` consomme les sorties fiscales de `balance-service`. **Résout Q6 du PRD.** Coordination à figer au sprint-planning de S12/S18.
4. **Module 3 « Fiscalité » (fiscal-service, 2027-02)** est **partiellement anticipé** par EPIC-023/024 (calcul IS/TVA/TPU + conseil). Ce qui reste à Module 3 : **télédéclaration/dépôt DSF**, TVA déclarative périodique avancée, autres impôts. → annoter `program_backlog.module 3` « re-scopé (calcul avancé au Module 1-bis) ».
5. **OCR** : EPIC-018/020 (Statuts/CFE, captures, factures) **étendent `document-service` (EPIC-015)** — cohérent avec `deferred_foundations` (« document-service extensions : factures fournisseurs »). Dépend du scaffold document-service (STORY-041, sprint 8).
6. **Paquet fiscal & gabarit liasse** : packagés dans **`platform-catalog-service`** (comme les référentiels) + gérés côté **admin-panel** (D12) ; consommés par `balance-service` et `bilan-service`. STORY-078 = chargement côté balance-service.
7. **Reconstruction chemins B/C** (D6) = **hors v1**, non planifiée ici → backlog v2.

---

## 5. Impact planning

- **Sprints 15-19** = Atelier Balance (Module 1-bis). **Bilan livré 🏁 sprint 14 inchangé.**
- **Paiement (Module 2)** décalé **sprint 15 → sprint 20** (JIT, sans impact — déjà « proposed », dépend PS-1/C8).
- À **~24 pts/sprint (1 dev)**, +107 pts ≈ **+5 sprints** → Atelier livré ≈ **mi-mars 2027** (après Bilan fin janv. 2027). Module 3 Fiscalité (re-scopé) recalé en conséquence.
- **Prérequis** : EPIC-008 (squelette bilan, sprint 8), EPIC-015 document-service (OCR, sprints 8-9), EPIC-007 catalog (paquet fiscal packaging, sprint 7). Tous **avant** sprint 15 → pas de blocage.

---

## 6. Questions ouvertes (héritées du PRD §13)

Ownership profil société (balance-service vs auth) · fournisseur OCR · compléter taux TPU/CNSS · gabarit liasse SMT · export Sage Excel/CSV · **frontière fiscale bilan/balance (§4.3, résolue proposée)** · validation experte. Aucune ne bloque le découpage.

---

*Plan d'intégration à valider. Une fois validé, les entrées sont portées dans `sprint-status.yaml` (fait) ; chaque story reçoit son doc `.md` en JIT au sprint-planning de son sprint (norme).*
