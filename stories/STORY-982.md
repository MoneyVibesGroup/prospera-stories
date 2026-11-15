# STORY-982 : `document-service` sur le socle du moteur

Status: done

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

**DONE le 2026-11-15** — `prospera-ocr-service` **#24**, fusionnée sur `dev` (`e46606b`) ; complétée par STORY-990 (ocr #25).

- **Premier passage** (`1562be1`) : sous Node 24, depuis un export LF, 896 unitaires, 183 e2e (tests OCR compris,
  Tesseract réel), lint 0, build ; 3 mutations rouges (BullMQ en 5, `kafkajs`, image Node 22).
- **La recette de l'Atelier a trouvé une régression de la migration** (pile neuve `grp-c-recette`, 50/51) : le seul
  test rouge est celui de `document-service` (profil société par OCR, 502). Cause : `kafkajs` créait un topic absent
  en s'y abonnant ; le client de Confluent ne le crée pas, et ne voit le topic créé ensuite par son producteur qu'au
  rafraîchissement des métadonnées (5 minutes). Le premier `dossier.created` n'était donc pas dans le read-model quand
  la requête est arrivée (404 « Dossier introuvable pour cette organisation »).
- **Corrigé** (`d71a294`, `851ab6a`) : la supervision crée les topics abonnés absents avant de s'abonner, aux réglages
  du broker ; un refus est journalisé et n'empêche pas l'abonnement (3 tests). Et `identity.org.created` est lu en
  lecteur tolérant (`8bd1a2f`, annonce de B en STORY-938 : `createdByUserId` facultatif, `origine`). Sous Node 24 :
  **902 unitaires, 183 e2e, lint 0, build**.
- **Recette de l'Atelier VERTE, 51/51, sur volumes neufs**, image construite depuis `851ab6a` ; journal du service :
  « topics créés avant l'abonnement (dossier.updated) », « (cahier.piece.rattachee) ». PR **#24 fusionnée** en
  « Rebase and merge » sur `dev` (`e46606b`, arbre identique à `851ab6a`) ; le dépôt n'accepte plus que ce mode.
- ⚠️ **Ce que cette recette ne prouvait pas** (trouvé par STORY-990) : créer le topic ne suffit pas. Abonné à un topic
  à peine créé, sans leader encore, le client attend encore le rafraîchissement de 5 minutes ; la recette passait
  parce que sa mise en place dure plus longtemps. **Complété par STORY-990** (ocr #25 : métadonnées toutes les 10 s ;
  mesuré 291 s → 6,9 s).
- **Recette de l'Atelier rejouée depuis `dev`** (images reconstruites ; `document-service` depuis `7068952`, 982 et
  990 compris) : **51/51** sur volumes neufs ; journal du service : « topics créés avant l'abonnement (dossier.created,
  dossier.updated) », « (cahier.piece.rattachee) ».
- **Rencontré en chemin, hors de C** : sur une pile neuve, la recette d'`origin/dev` ne démarre pas, le groupe
  `platform-catalog-abonnements` du catalogue n'existant pas (même cause : ses topics `paiement.abonnement.*` ne sont
  pas créés). Contourné sur la pile jetable de C en créant ces trois topics ; demande à B dans le journal de C.
