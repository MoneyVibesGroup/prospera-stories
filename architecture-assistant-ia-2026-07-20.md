# Architecture — Assistant IA transverse (analyse & proposition sur données)

> **Date :** 2026-07-20 · **Statut :** proposition d'architecture — à valider avant stories
> **Périmètre (décidé 2026-07-20) :** capacité IA **transverse** — analyse des données + **propositions**, branchable sur plusieurs surfaces
> du produit (mapping, conseil fiscal, analyse financière, prévisionnel…), pas une feature isolée.
> **Fondé sur :** la feature déjà cadrée EPIC-AB-07 / EPIC-024 (« Simulation & conseil fiscal », FR-A22-A24) + D11(b)
> ([rapport-bilan §13.2](rapport-bilan-logique-metier-2026-07-12.md)) + le **corpus RAG** livré le 2026-07-19
> (`referentiels/corpus-complet-cgi-lpf-togo.json` 1185 art., `corpus-justificatif` 42 art.).

---

## 0. Principe cardinal — l'IA **propose**, le déterministe **calcule et décide**

La frontière est non négociable :

- Les **moteurs déterministes** restent la **source de vérité des chiffres** : `bilan-service` (liasse, EPIC-011/011B), le futur moteur
  fiscal (EPIC-023), la table de passage. L'IA **ne recalcule jamais** un montant officiel.
- L'IA **analyse, explique et propose** : elle produit des **Propositions** (brouillons) — un mapping suggéré, un levier fiscal légal, une
  lecture de ratios, un point d'attention. **Rien n'est appliqué sans validation humaine**, et toute application repasse par les moteurs
  déterministes qui recalculent l'impact réel.

C'est le prolongement direct des garde-fous déjà écrits (D11 / FR-A24 / NFR-A04/A07) : brouillon simulé ≠ réel, tracé, justifié, immuable,
**aucune minoration de la réalité**.

---

## 1. Placement — un service dédié `assistant-service`

Nouveau micro-service, **relying party** comme les autres (mêmes invariants), avec sa **base Mongo propre** :

| Attribut | Valeur |
|---|---|
| Rôle | Capacité IA transverse : analyse + génération de **Propositions** justifiées |
| Port | `3011` (prochain libre après admin-panel 3010) |
| Base Mongo | `assistant_service` — stocke Propositions, dossiers de justification, historique, feedback d'acceptation, **versions de prompts/gabarits**, audit |
| Auth | RS256/JWKS (valide localement, jamais d'appel chaud à l'IdP) ; gate `@Requires…Access` selon la surface ; isolation `orgId` |
| Démarrage dégradé | si le `LlmProvider` est indisponible au boot → service **up**, `/health` renvoie `llm: down` (comme le patron `kafka: down`) |

Pourquoi un service dédié (et pas un module dans bilan/balance) : isole les préoccupations propres à l'IA — **gestion du modèle** (versions,
coût, latence), **prompts** versionnés, **RAG**, **rate-limiting**, **audit renforcé** — sans polluer les moteurs métier. Patron « une
capacité = un service » déjà appliqué (kyc, document, catalog).

---

## 2. Le moteur — abstraction `LlmProvider` (API OpenAI-compatible)

Le service ne dépend **jamais** d'un modèle concret. Un port `LlmProvider` (patron `OcrProvider` / `PaymentProvider` déjà en place)
expose `chat(messages, options)` et parle **l'API OpenAI-compatible** — ce que servent Ollama (`/v1`), vLLM, Mistral, et via un shim la
plupart des hébergeurs.

| Environnement | Modèle (décision 2026-07-20) | Comment |
|---|---|---|
| **Dev / test** | **`qwen2.5:3b`** via **Ollama en Docker** (CPU) | service compose `ollama:11434` ; `LLM_BASE_URL=http://ollama:11434/v1`, `LLM_MODEL=qwen2.5:3b`. Sert à **valider la mécanique** (appel, RAG, contrat de Proposition), pas la qualité (un 3B **hallucine les citations légales**). |
| **Prod / proche** | **modèle performant auto-hébergé sur serveur MV** — candidat **GLM-5** (ou Qwen2.5-72B / Mistral Large) | même API ; on change **`LLM_BASE_URL` + `LLM_MODEL`**, **zéro code**. |

> **Confidentialité — résolue par l'auto-hébergement.** En hébergeant le modèle **sur le serveur MV**, les données financières/fiscales des
> tenants **ne quittent pas l'infra** → le plus gros risque de gouvernance (résidence des données, envoi à une API tierce) **disparaît**. Si un
> jour une **API externe** est envisagée, elle exigera : DPA (pas d'entraînement sur les données), **minimisation** du contexte envoyé,
> **opt-in par tenant**, audit de chaque prompt. Le `LlmProvider` rend les deux mondes interchangeables.

---

## 3. RAG — ancrage légal du conseil

Le conseil (surtout fiscal) doit être **adossé au texte de loi**, pas inventé :

- **Base de connaissance** : le corpus déjà livré (`corpus-complet-cgi-lpf-togo.json` = 1185 articles CGI+LPF verbatim ; `corpus-justificatif`
  = 42 pivots tagués `theme`/`usage_bilan`). C'est **de la donnée versionnée** `pays × année` (invariant NFR-A06 : rien en dur).
- **Embeddings (dev)** : **`bge-m3`** (multilingue, excellent français) via Ollama — swappable comme le LLM. Le corpus est petit (~925 Ko) :
  un index simple (cosine) suffit au départ ; vector store dédié seulement si nécessaire.
- **Règle dure** : toute affirmation à portée légale/fiscale **DOIT citer l'article source** (retour du RAG). Pas de citation → la Proposition
  est marquée « non sourcée » et **non applicable**. Anti-hallucination structurel.

---

## 4. OCR — **inchangé** : Tesseract reste la baseline (décision 2026-07-20)

L'OCR **n'entre pas** dans ce service. Il reste dans `document-service` derrière l'`OcrProvider` (impl. **Tesseract**), pour les docs typés
(KYC RCCM/CFE). Rappel : `qwen2.5:3b` est un **LLM texte, il ne fait pas d'OCR** ; l'OCR-par-IA exige un **VLM** (Qwen2.5-VL, Pixtral, Mistral
OCR). Décision : **garder Tesseract pour les tests** ; un `OcrProvider` **VLM hébergé** (photos de cahiers/factures — chemin A FR-A08-A11,
manuscrit, extraction structurée) sera ajouté **plus tard**, même patron de swap, **hors périmètre de cette note**.

---

## 5. Contrat de **Proposition** (le cœur)

Toute sortie de l'IA est une **`Proposition`** persistée, jamais un effet de bord direct :

```ts
interface Proposition {
  id: string;
  orgId: string;                 // isolation tenant
  surface: 'MAPPING' | 'CONSEIL_FISCAL' | 'ANALYSE_FINANCIERE' | 'ANOMALIE_BALANCE' | 'NOTE_ANNEXE' | 'KYC_ASSIST';
  contexteRef: string;           // à quoi ça se rapporte (compte, exercice, liasse, dossier…)
  contenu: unknown;              // la proposition (mapping suggéré, scénario, analyse…)
  justifications: {              // ancrage obligatoire
    source: 'CGI'|'LPF'|'AUDCIF'|'REGLE_COMPTABLE'|'DONNEE';
    reference: string;           // ex. "Art. 100 CGI"  ← RAG
    extrait?: string;
  }[];
  confiance: number;             // 0..1 exposé
  statut: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  validePar?: string;            // humain qui a tranché
  modele: string;                // traçabilité (qwen2.5:3b / glm-5 …) + version de prompt
  createdAt: string;
}
```

Cycle : **PROPOSED → (humain) ACCEPTED/REJECTED**. Une Proposition acceptée est **transmise à la surface consommatrice**, qui l'applique via
**son** flux déterministe existant. Exemple parfait : la **surcharge de mapping** (`bilan-service` FR-008) est déjà « une proposition validée
par un humain et tracée » → **l'IA alimente ce flux**, elle ne le court-circuite pas.

---

## 6. Surfaces branchables (use cases transverses)

| Surface | Ce que l'IA propose | S'appuie sur |
|---|---|---|
| **Mapping comptes** | rattachement compte→poste pour les comptes non reconnus | table de passage (FR-006/008 ✅) — **surface pilote la plus sûre** |
| **Conseil fiscal** | leviers légaux (provisions, amort., report déficit…) + dossier justifié | moteur fiscal EPIC-023 + corpus RAG (EPIC-024) |
| **Analyse financière** | lecture de ratios, tendances, points d'attention sur Bilan/CR/**prévisionnel** | liasse ✅ + prévisionnel EPIC-013 |
| **Anomalies balance** | incohérences, comptes suspects, écarts | contrôles FR-A25/A26 (assist) |
| **Notes annexes** | pré-remplir les **trames « à compléter »** (narratif) | notes v1 (STORY-114) |
| **Assistance revue KYC** | synthèse déclaré↔lu, points de vigilance | document.extrait (déjà OCR) |

L'IA **assiste** partout ; elle ne **décide** nulle part.

---

## 7. Intégration technique

- **Off hot-path** : le conseil est **interactif, initié par l'utilisateur** — pas sur le chemin chaud de validation JWT. Un appel **REST
  synchrone** frontend/BFF → `assistant-service` est acceptable (l'invariant « pas d'appel REST synchrone » vise l'IdP sur le chemin chaud, pas
  l'advisory).
- **Contexte fourni par l'appelant** : la surface qui détient déjà la donnée (liasse chargée, balance, profil) **passe le contexte** dans la
  requête → `assistant-service` **ne réplique aucun read-model** et reste découplé (pas de couplage cross-service supplémentaire). Il ne
  persiste que les **Propositions** et l'audit.
- **Pas de nouveau bus** : aucune raison de toucher Kafka. Si un besoin async apparaît (batch d'analyses), file **interne** BullMQ/Redis
  (invariant : Redis = jobs internes), jamais Kafka pour ça.

---

## 8. Garde-fous & conformité (récap opposable)

1. **Frontière déterministe** — l'IA ne calcule aucun chiffre officiel ; les moteurs recalculent l'impact d'une Proposition acceptée.
2. **Human-in-the-loop** — aucune écriture sur des données réelles/validées ; Propositions = brouillons.
3. **Ancrage** — toute affirmation légale cite un article (RAG) ; sinon « non sourcée ».
4. **Immutabilité & audit** — chaque prompt + réponse + citations + modèle/version **loggés** (prolonge NFR-A07) ; liasses validées immuables.
5. **Confidentialité** — modèle **auto-hébergé** ⇒ données tenant dans l'infra MV ; API externe ⇒ DPA + minimisation + opt-in.
6. **Conformité fiscale** — optimise la **base par leviers légaux**, **jamais** de minoration du réel (FR-A24).

---

## 9. Invariants écosystème — respectés

| Invariant | Respect |
|---|---|
| Kafka = seul bus inter-services | ✅ l'assistant n'introduit **aucun** nouveau topic ; il consomme du contexte passé en requête |
| Redis/BullMQ = jobs internes | ✅ (si async un jour) |
| RS256/JWKS, pas de secret partagé | ✅ relying party |
| Une base Mongo par service | ✅ `assistant_service` |
| Démarrage dégradé | ✅ `llm: down` au `/health` si provider absent |
| Moteur agnostique, connaissance = donnée (P7/NFR-A06) | ✅ modèle + prompts + corpus = **config/données**, pas de code métier en dur |
| Tenant isolation | ✅ tout keyé `orgId` |

---

## 10. EPIC proposé & placement roadmap

**EPIC-026 — Assistant IA transverse (analyse & proposition).** Découpage indicatif :

| Story | Objet | Dépend de |
|---|---|---|
| **A** | Scaffold `assistant-service` (:3011, relying party JWKS, health `llm:` inclus, base `assistant_service`) | — |
| **B** | `LlmProvider` (OpenAI-compatible) + Ollama dev (`qwen2.5:3b`) + config swap prod | A |
| **C** | Contrat **Proposition** + persistance + cycle PROPOSED→ACCEPTED/REJECTED + audit | A |
| **D** | **RAG** corpus CGI/LPF + embeddings `bge-m3` + règle de citation obligatoire | B |
| **E** | **1ʳᵉ surface pilote = Mapping comptes** (alimente le flux FR-008 existant, risque le plus faible) | C, D |
| (suite) | Surfaces conseil fiscal (⇐ EPIC-023) · analyse financière (⇐ prévisionnel EPIC-013) · notes/anomalies | epics respectifs |

**Placement :** le **socle** (A→E) peut démarrer **après le cœur Bilan** (EPIC-011B/012), en parallèle du track Atelier. Les surfaces à forte
valeur s'attachent à leurs epics : **conseil fiscal** après le moteur fiscal (EPIC-023, ~S19), **analyse financière** avec le prévisionnel
(EPIC-013, ~S15). → **placement exact à trancher au sprint-planning** (non figé ici, comme B8).

---

## 11. Décisions ouvertes

1. **Modèle de prod / hébergement serveur** : GLM-5 vs Qwen2.5-72B vs Mistral Large — à benchmarker (français + raisonnement fiscal + citation) ; spécifier le **serveur** (GPU requis pour un gros modèle en temps interactif).
2. **Vector store** : index simple en base vs store dédié — trancher quand le corpus grossit (multi-pays).
3. **Nom du service** : `assistant-service` vs `conseil-service` vs `copilote-service`.
4. **Placement sprints** : quand slotter le socle EPIC-026 (nouvelle reprogrammation `sprint-status.yaml`).
5. **Budget/latence** cible par surface (analyse interactive vs dossier fiscal lourd).
