# STORY-982 : `document-service` sur le socle du moteur

Status: in-progress

**Complexité :** moyenne (migration du bus, de la file de tâches et de Node ; un service dont le cabinet dépend)

**Épic :** EPIC-201 (le socle technique : services, migrations et protection des données)
**Dépôt :** `MoneyVibesGroup/prospera-ocr-service` (= `document-service`, tenu par C)
**Plage :** groupe C, n° 3 du lot de C (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

La spine assurance (Stack, AD-3) a mesuré `document-service` sur `node:22-slim`, `kafkajs` 2.2.4 et BullMQ 5.81 : hors
de la pile du moteur. Le module `ged` (EPIC-214) s'y ajoutera ; la spine impose la migration **avant** toute nouvelle
fonction. Le service est **déjà en service pour le cabinet** : pièces KYC, profil société par OCR (Statuts, CFE),
cahiers de l'Atelier lus par OCR et transformés en balance. La migration ne doit rien casser de ce chemin.

## Ce qui doit être vrai à la fin (plan §5, n° 3)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Node 24** : `engines.node: 24.x`, toutes les images `node:24-slim`, stage `verification` | invariant de la pile |
| AC-2 | **`kafkajs` → `@confluentinc/kafka-javascript` 1.11** : client, producteur, relais d'outbox, quatre consommateurs (`kyc.document.uploaded`, pièces de cahier, `dossier.*`, `identity.*`), santé ; supervision reprise de STORY-981 | invariant ; suites vertes |
| AC-3 | **BullMQ 5 → 6.7** (`bullmq ~6.7.0`, `@nestjs/bullmq ^11.0.5`, comme le catalogue en STORY-933) : les deux files d'OCR (pièces, profil) enfilent et traitent comme avant ; aucun identifiant de tâche ne contient `:` | unitaires des processeurs et services ; e2e d'extraction |
| AC-4 | **L'OCR du cabinet tient** : les tests OCR du service (Tesseract, rendu PDF) verts sous Node 24 ; la **recette croisée de l'Atelier** (STORY-100, `atelier-balance.recette.ts` : profil société par OCR, balance depuis les cahiers en source `ocr`) **verte** sur la vraie pile avec l'image de la branche | sorties ; recette |
| AC-5 | Lint 0, build, suites existantes vertes ; le service démarre **healthy** sur la pile | sorties ; compose |

## Décisions retenues par défaut (contestables)

- **D-982-1 — OCR inchangé.** tesseract.js 5.1.1, pdfjs-dist 4.10.38 et `@napi-rs/canvas` restent à leurs versions : la
  spine renvoie leur montée à la story de pointe de `ged`, après mesure (Deferred). Seul le moteur Node change ; les
  tests OCR le prouvent sous Node 24.
- **D-982-2 — La recette de l'Atelier sur une pile à part.** Elle se joue avec `COMPOSE_PROJECT_NAME=grp-c-recette` (volumes
  neufs) et une surcouche **hors dépôt** qui repointe le `build.context` de `document-service` sur la branche
  (`RECETTE_SURCOUCHES`, prévu par `prospera-recette`) : C lance la pile de A sans la modifier (plan §2).
- **D-982-3 — Pas de module `ged` ici.** Le profil de démarrage `ged`, le bucket propre et les routes du module viennent
  avec EPIC-214 ; cette story ne change aucune route.

## Contexte pour le développeur

- **Patron** : STORY-981 (`prospera-assurance-service` #20) — mêmes fichiers Kafka (la supervision est identique à
  l'octet à celle d'`assurance-service` avant 981), même invariant de pile, même construction de l'image de
  vérification depuis `git -c core.autocrlf=false archive HEAD`.
- **BullMQ 6** (journal de B, STORY-933) : un identifiant de tâche ne peut pas contenir `:` ; `queue.client` et `ping`
  n'existent plus. Ici, `jobId = extractionId` (un ObjectId) : sans `:`.
- **Données de Tesseract** : `src/ocr/assets/tessdata/*.traineddata.gz`, embarquées, jamais téléchargées.

## Ce qui a été livré

*(en cours au 2026-11-15)* — code sur `MNV-982`, PR **brouillon** `prospera-ocr-service` #24 (`1562be1`). Sous Node 24,
depuis un export LF : 896 unitaires, 183 e2e (tests OCR compris, Tesseract réel), lint 0, build ; 3 mutations rouges
(BullMQ en 5, `kafkajs`, image Node 22). **Reste AC-4 : la recette de l'Atelier**, bloquée tant que la pile `grp-b`
tient les ports du compose racine (3003, 27017, 6379, 9000) sur ce poste. La PR ne sera fusionnée qu'après elle.
