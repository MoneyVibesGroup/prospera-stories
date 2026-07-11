# PROSPERA / Money Vibes — PLAN FINAL

**Version :** 1.0 — 2026-07-10
**Statut :** plan de référence — remplace `plan-livraison-18-modules-2026-07-10.md` et l'ordre de construction de `modules-prospera-validation-prd-2026-07-10.md` (les fiches de services de ce dernier restent la référence des périmètres)
**Périmètre :** backend — micro-services API NestJS, mono-repo, méthode BMAD v6

---

## 1. Hypothèses de départ (actées)

| Hypothèse | Conséquence |
|---|---|
| Équipe actuelle : **3 devs** (référence du calendrier) | 2 flux de développement en parallèle possibles ; colonnes équipe 5/7 en accélération |
| **Aucun utilisateur externe** aujourd'hui | Phase 1 = **dogfooding interne** : Money Vibes Group est le client zéro (Bilan, Compta, Fiscalité, Commercial, Support pour sa propre gestion) |
| Règle commerciale : *module souscrit → prioritaire* | **En sommeil** tant qu'il n'y a pas de client ; l'ordre par défaut des 18 modules s'applique tel quel |
| Bilan attendu **septembre 2026** | Tenable uniquement via **NB-1** : Bilan v1 calculé depuis une **balance importée** (Excel/CSV), pas depuis des écritures saisies |
| PI SPI (BCEAO) attendu **novembre 2026** | Démarche d'accès au SPI (**PS-1**) à instruire **dès maintenant** — délai administratif externe, indépendant du dev |

---

## 2. Architecture — le socle et le moule

**Socle plateforme (transverse, pas vendable) :**
`auth-service` (IdP, RS256/JWKS) · `gateway` (entrée unique) · `kyc-service` · `platform-catalog-service` (modules + entitlements — renommé, NC-1) · `notification-service` (e-mail/SMS, inséré avant le module Support).

**Le moule unique de tout module métier** (ce qui rend 18 modules tenables à 3 devs) :
relying party JWKS (jamais d'appel IdP sur le chemin chaud) · read-models Kafka · MongoDB dédiée par service · événements en état absolu (`eventId`, `schemaVersion`, outbox, keyés `orgId`) · gate d'accès local (e-mail vérifié + KYC + entitlement) · socle NestJS dupliqué (K4) · abstractions provider pour tout ce qui est externe (`PaymentProvider`, `EInvoicingProvider`, `OcrProvider`, `LlmProvider`).

**Invariants non négociables** (coût faible maintenant, énorme à rattraper) :
JWT = identité seulement · abonnement (vertical) ≠ entitlement (catalog) ≠ exécution paiement (paiement-service) · immutabilité des écritures/documents validés — l'automatisation (OCR, IA) **propose**, l'humain **valide** · une base = un service.

**Simplifications actées tant qu'il n'y a pas d'utilisateur externe :**
- Garde-fou **N/N-1** et **routage multi-version** gateway : différés (une seule version en service) — le mécanisme reste prévu dans le schéma d'entitlement, l'implémentation sort du chemin critique.
- **Cutover auth** (STORY-030) et évolutions de schéma : sans risque, pas de données clientes à migrer.
- **Outils de migration client** (reprise Sage/Excel d'historique) : différés — seul l'**import de balance** (NB-1) reste, nécessaire même en interne.
- Ce qui ne se relâche **pas** : les invariants ci-dessus + **sauvegardes Mongo dès septembre** (ce sera votre propre comptabilité) + doc ops minimal (M11).

---

## 3. Phase 0 — Socle (juillet → mi-septembre 2026) — en cours

| Sprint | Flux A | Flux B | Sortie |
|--------|--------|--------|--------|
| **S4** (juil.) | Fin `auth-service` : STORY-025 (en cours), 026, 027 (`identity.*`) | Instruction **PS-1** (dossier SPI BCEAO) + PRD Bilan | IdP complet |
| **S5** (août) | EPIC-006 : expert-comptable relying party (028-030) | Scaffold `platform-catalog-service` + entitlements minimum (031-033 réduites) | validation JWKS partout, entitlements actifs |
| **S6** (août-sept.) | KYC rebasé : kyc-service (020-021) | EPIC-008 : bilan squelette (035-038) | gate complet e-mail+KYC+entitlement |

Glissent en tâche de fond (ne bloquent pas le module 1) : revue KYC admin (013-014), durcissement catalog (034, N/N-1 différé), décision C8 (auth M2M — à trancher avant paiement-service).

---

## 4. Phase 1 — Dogfooding interne (sept. 2026 → mi-2027)

Money Vibes Group utilise chaque module en production interne avant toute vente. Chaque livraison = un jalon **interne** ; l'ouverture externe se décide module par module quand il est éprouvé.

| N° | Module | Service | Livraison (éq. 3) | Éq. 5 | Éq. 7 | Contenu clé |
|----|--------|---------|-------------------|-------|-------|-------------|
| 0 | **Chaîne KYC complète** 🏁 (AD-2) | `admin-panel` + `document-service` | **Sept. 2026** | Sept. 26 | Sept. 26 | Livrée en premier, en 2 flux : **flux A = admin-panel v1 (BFF)** — vue agrégée des orgs (identité + KYC + entitlements), **revue/validation KYC** et grant d'entitlement proxifiés vers les services propriétaires, ne possède aucune donnée (~1 sprint : les endpoints admin existent déjà dans les stories 007, 013, 026, 032-033) · **flux B = document-service v1 (OCR KYC, périmètre strict DO-1)** — consomme `kyc.document.uploaded`, extraction RCCM/CFE (Tesseract via `OcrProvider`), comparaison **déclaré vs lu**, détection pièce expirée/illisible → `document.extrait` → profil enrichi pour la revue. Résultat : parcours inscription → upload → OCR → revue → approbation testable de bout en bout ; l'ouverture externe est dé-risquée quel que soit son moment |
| 1 | **Bilan & prévisionnel** 🏁 | `bilan-service` | **Oct. 2026** *(+1 mois, accepté AD-2)* | Sept. 26 | Sept. 26 | **NB-1** : import de balance + table de passage SYSCOHADA/SFD + états + **prévisionnel** (hypothèses → projection). Premier utilisateur : la compta interne MV |
| 2 | **PI SPI** | `paiement-service` | **Déc. 2026** | Sept. 26 | Sept. 26 | `SpiProvider` (BCEAO) + `FedapayProvider`, webhooks idempotents, abonnements plateforme (EPIC-004 rescopé, PA-1) — dépend de PS-1 (le délai administratif reste le vrai chemin critique de ce module) |
| 3 | **Fiscalité** | `fiscal-service` | **Févr. 2027** | Oct. 26 | Sept. 26 | DSF/liasse depuis la balance, TVA déclarative simple ; FI-2 : insertion du moteur d'écritures à décider ici |
| 4 | **Conformité BCEAO & LCB/FT** | `conformite-service` | **Avr. 2027** | Oct. 26 | Oct. 26 | screening sanctions/PEP, seuils, piste d'audit, reporting CENTIF (patron kyc réutilisé) — s'appuie sur l'OCR KYC déjà en place |
| — | *Insertion :* **notification-service** | | *avant module 5* | | | e-mail/SMS centralisés — socle des modules 5, 11, 17 (petit epic) |
| 5 | **Support client / Relance** | `support-service` | **Juin 2027** | Déc. 26 | Oct. 26 | ticketing + relances multicanal (usage interne MV aussi) |

> Décalage **+1 mois** de toute la séquence éq. 3 (AD-2) : accepté en échange de la chaîne KYC livrée en premier. Les colonnes éq. 5/7 restent les cibles du document Money Vibes (l'ajout de devs résorbe le décalage).

## 5. Phase 2 — Extension verticale (mi-2027 → 2029, éq. 3 — dates décalées d'un mois, AD-2)

| N° | Module | Service | Éq. 3 | Éq. 5 | Éq. 7 |
|----|--------|---------|-------|-------|-------|
| 6 | Commercial / Agent terrain | `crm-service` | Août 2027 | Déc. 26 | Oct. 26 |
| 7 | Crédit (cœur IMF) | `credit-service` | Oct. 2027 | Janv. 27 | Déc. 26 |
| 8 | Équipe | `equipe-service` | Déc. 2027 | Janv. 27 | Déc. 26 |
| 9 | Dashboard | `reporting-service` | Févr. 2028 | Mars 27 | Déc. 26 |
| 10 | Collecte | `collecte-service` | Avr. 2028 | Mars 27 | Janv. 27 |
| 11 | Recouvrement | `recouvrement-service` | Juin 2028 | Avr. 27 | Janv. 27 |
| 12 | Finance (Transactions) | `tresorerie-service` | Août 2028 | Avr. 27 | Janv. 27 |
| 13 | Stock | `stock-service` | Oct. 2028 | Juin 27 | Mars 27 |
| 14 | Catalogue produits | `catalogue-produits-service` | Déc. 2028 | Juin 27 | Mars 27 |
| 15 | Commande | `commande-service` | Févr. 2029 | Juil. 27 | Mars 27 |
| 16 | Facturation | `facturation-service` | Avr. 2029 | Juil. 27 | Avr. 27 |
| 17 | Marketing | `marketing-service` | Juin 2029 | Sept. 27 | Avr. 27 |
| 18 | Point de vente (PDV) | `pdv-service` | Août 2029 | Sept. 27 | Avr. 27 |

**Fondations différées, insérées sur déclencheur :**
- `comptabilite-service` (moteur d'écritures) → déclencheur : TVA fine (module 3), ou premier client voulant *saisir* chez nous, ou automatisation Facturation→compta (FI-2)
- `document-service` : **plus différé** — v1 (OCR KYC) insérée dès sept.-oct. 2026 (voir Phase 1). Restent différées ses **extensions** : factures fournisseurs (avec la compta/facturation) et dossiers de Crédit (module 7) — même service, nouveaux types de documents
- `ia-service` (Qwen — anomalies, imputation, analyse, chat) → déclencheur : passage à l'équipe 5/7, ou demande client (propositions au dossier : IA-0…IA-5)
- Verticaux formels `distributeur` / `microfinance` / `assurance` / Money Vibes App → au premier client externe de chaque segment (forme mince : plans, abonnement, provisioning)

---

## 6. Journal des décisions du plan

| ID | Décision | Statut | Échéance |
|----|----------|--------|----------|
| **NB-1** | Bilan v1 par **import de balance** (pas d'écritures) | ✅ actée | — |
| **AD-2** | **La chaîne KYC d'abord** (remplace AD-1 et amende DO-1) : admin-panel v1 (revue/validation KYC, vue agrégée, grants proxifiés) **+** document-service v1 (OCR KYC, périmètre strict) livrés ensemble en **sept. 2026**, en 2 flux parallèles. En échange : **Bilan et toute la séquence éq. 3 décalés de +1 mois** (Bilan → oct. 2026). Parcours inscription → OCR → revue → approbation testable de bout en bout avant tout le reste | ✅ actée | S7 (sept.) |
| **PS-1** | Modalités d'accès **SPI BCEAO** (direct/agrégateur, sandbox, certification) | 🔴 à instruire **immédiatement** | dossier lancé en juillet |
| **PA-1** | EPIC-004 rescopé : checkout/webhooks → `paiement-service` ; plans/abonnement → vertical | ✅ actée | avant S7 |
| **NC-1** | Renommage `catalog-service` → `platform-catalog-service` | ✅ actée | rev 1.3 doc programme |
| **C8** | Auth service-à-service (M2M via auth-service recommandé) | 🟡 à trancher | avant paiement-service |
| **FI-2** | Quand insérer le moteur d'écritures (`comptabilite-service`) | 🟡 ouverte | au PRD Fiscalité |
| **DG-1** | Dogfooding : chaque module validé en interne avant vente ; N/N-1 & multi-version différés jusqu'au 1er client externe | ✅ actée | — |
| **DO-1** | OCR : Tesseract derrière `OcrProvider` (bascule vers OCR managé possible sans toucher au métier) ; périmètre v1 strictement KYC ; `kyc.document.uploaded` publié par kyc-service dès la STORY-020 ; l'OCR assiste la revue, n'approuve jamais | ✅ actée (calendrier : voir AD-2) | S7 |
| CO-2, FA-1, IA-0…5 | Immutabilité, facturation partagée, IA | 💤 en sommeil, valables | au réveil des modules concernés |

## 7. Calendrier des PRD (juste-à-temps : 1-2 sprints avant l'epic)

| PRD | Fenêtre de rédaction | Motif |
|-----|----------------------|-------|
| 1. `/bmad:prd bilan` (NB-1 + prévisionnel) | **maintenant** (juillet) | dev en sept.-oct., livraison oct. |
| 2. `/bmad:prd paiement-service` (FedaPay + SPI) | sept.-oct. | dev nov.-déc., nourri par PS-1 |
| 3. `/bmad:prd fiscal-service` | déc. 2026-janv. 2027 | tranche FI-2 |
| 4. `/bmad:prd conformite-service` | févr.-mars 2027 | |
| 5. notification + support | avr.-mai 2027 | |
| 6+ | au fil de l'eau | 1-2 sprints avant chaque module |

Aucun PRD lourd pour : auth, kyc, platform-catalog, gateway (docs existants) ; admin-panel v1 et document-service v1 (AD-2) = **tech-specs courtes** suffisent, leurs périmètres sont déjà cadrés dans ce plan et le doc de validation ; compta/IA différés (propositions au dossier).

## 8. Actions immédiates (cette semaine)

1. 🔴 Lancer l'instruction **PS-1** (SPI BCEAO) — chemin critique administratif du module 2
2. Démarrer `/bmad:prd bilan` (NB-1 + prévisionnel)
3. Amender le doc programme **rev 1.3** : 18 modules → services, NC-1, 5 projets + usage interne, simplifications DG-1
4. Mettre à jour `sprint-status.yaml` : EPIC-009 révisé (import de balance + prévisionnel), EPIC-004 rescopé (PI SPI), modules 3-18 en `proposed`
5. Trancher **C8** (avant le PRD paiement)
6. Doc ops minimal (M11) : au moins **sauvegardes Mongo** avant septembre

---

## 9. Jalons

```
🏁 Sept. 2026  Chaîne KYC complète : upload → OCR → revue admin-panel → approbation (AD-2)
🏁 Oct. 2026   Bilan + prévisionnel en prod INTERNE (compta Money Vibes)
🏁 Déc. 2026   PI SPI opérationnel (si PS-1 aboutit à temps — vrai chemin critique du module)
🏁 Févr. 2027  Fiscalité interne (DSF)
🏁 Avr. 2027   Conformité LCB/FT (s'appuie sur l'OCR KYC en place)
🏁 Juin 2027   Support client — le socle « gestion interne MV » est complet
   Ensuite     ouverture externe module par module + extension IMF/Distributeurs (modules 6-18)
```

*Un seul plan, un seul moule de service, un client zéro exigeant : vous-mêmes. Le reste est de l'exécution sprint par sprint via BMAD.*