---
baseline_commit: c1f820b (prospera-fiscal-service)
---

# STORY-309 : Agnosticisme de la source de balance

Status: done

**Complexité :** small

**Épic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé  
**Service :** `fiscal-service` seul  
**Points :** 3 · **Sprint :** S24 du tracker ; lot du 14/11 (+5)  
**Assigné à :** Dev B  
**Prérequis :** STORY-305 (dérivation), STORY-307 (taxes sectorielles au catalogue), STORY-308  
**Origine :** FR-F76, FR-F77, AD-14 (et AD-15).

---

## User Story

En tant que **vertical microfinance, assurance ou distributeur**, je veux obtenir les capacités
fiscales sans développement spécifique, afin qu'une balance conforme suffise.

## Ce qui existe déjà (vérifié dans le code le 2026-11-14)

- **Aucun port de balance dans `fiscal-service`.** Il ne consomme aucun topic `balance.*` et
  n'appelle pas `balance-service`. Les chiffres issus d'une balance n'y entrent que par la **liasse
  figée** de `bilan-service` (`adapters/http/contrat-bilan-service.ts` :
  `interpreterVersionLiasse`, `interpreterContenuLiasse`, `interpreterVersionDeposee`,
  `interpreterJeuDepose`), en **lecture tolérante** (champ non lu ignoré).
- **La provenance existe en amont, pas ici.** `balance-service` porte `source`
  (`sage` | `direct` | `ocr`) et `origine` (`A_NOUVEAUX`, `PROVISIONS_FISCALES`,
  `PORTEFEUILLE_SFD`, `AMORTISSEMENTS`, `INVENTAIRE`) ; un vertical pousse sa balance par
  `balance.submitted` (`source: direct`, `dossierId` + `exercice` requis, STORY-102/367). La
  version figée de `bilan-service` expose `balanceId`, `balanceVersion`, `balanceChecksum`,
  `balanceChecksumVersion` — métadonnées de provenance, **jamais lues** par `fiscal-service`.
- **Balayage du 2026-11-14 : zéro occurrence** dans `src/` (hors tests) des littéraux d'origine ou de
  source, des noms de topics `balance.*`, de `sourceSystem`. L'AC-2 tient déjà — **rien ne le
  garde**.
- **La dérivation ne dépend que du type d'entité.** `typePaquetDuDossier(typeEntite)` →
  `codePaquet(type, pays)` → `fiscal-tg-<type>` (rattachement : `mongo-rattachements-paquet.ts` ;
  implantations : `domain/implantation/implantation.ts`). Les taxes sectorielles sont des
  **données** du catalogue (TAF pour `MICROFINANCE`, TCA pour `ASSURANCE`, STORY-307).
- `dossier-service` connaît trois types : `ENTREPRISE`, `MICROFINANCE`, `ASSURANCE`. **Le
  distributeur est une `ENTREPRISE`** : il n'a pas de type à lui, ni ne doit en avoir ici.
- Gardes sur l'AST déjà en place, à imiter : `src/domain/purete-du-domaine.spec.ts` (STORY-361),
  `src/domain/redevables/garde-identifiant-fiscal.spec.ts` (STORY-563).

## Décisions confrontées au code réel (2026-11-14)

- **D-309-1 — L'agnosticisme se prouve aux deux seules portes.** (a) la lecture de la liasse :
  deux réponses de `bilan-service` qui ne diffèrent **que par la provenance** (`balanceId`,
  `balanceVersion`, `balanceChecksum*`, et tout `source` / `origine` / `sourceSystem` qu'il
  ajouterait demain) donnent **la même** liasse figée et **le même** contenu, à l'égalité profonde ;
  (b) la dérivation des obligations, qui ne lit que le type d'entité et le paquet octroyé.
- **D-309-2 — Garde exécutable sur l'AST, sur tout `src/` hors tests** (pas seulement le
  domaine : un adaptateur qui lirait l'origine la ferait remonter). Interdits : les littéraux de
  `SOURCES_BALANCE` et `ORIGINES_BALANCE` (recopiés de `balance-service`, sans librairie partagée
  — K4), les noms de topics `balance.submitted|created|rejected`, et tout identifiant ou
  propriété `sourceBalance`, `origineBalance`, `sourceSystem`, `balanceSource`, `balanceOrigine` ;
  ainsi que les littéraux qui nommeraient un **vertical produit** (`DISTRIBUTEUR`, `IMF`,
  `VERTICAL`). `MICROFINANCE` et `ASSURANCE` restent permis : ce sont des **types d'entité**
  (AD-15), portés par la donnée. Les commentaires ne comptent pas. Le scanner est exporté et
  testé sur des extraits, pour qu'une garde qui ne trouverait plus rien ne passe pas pour verte.
- **D-309-3 — Un même chemin pour les trois verticaux.** L'e2e des obligations est paramétré sur
  `ENTREPRISE` (distributeur), `MICROFINANCE` (IMF) et `ASSURANCE` : la même route, le paquet
  `fiscal-tg-<type>` octroyé, des obligations dérivées — dont la taxe sectorielle portée par le
  catalogue (TAF, TCA) — sans aucune branche par vertical.
- **Hors périmètre** : la chaîne déclarative qui lira des montants (I3, `adapters/balance`) — la
  garde D-309-2 la couvrira sans réécriture ; la publication des codes `fiscal-tg-microfinance` et
  `fiscal-tg-assurance` au catalogue (geste d'administration) ; un type d'entité « distributeur »
  (n'existe pas chez `dossier-service`).

## Critères d'acceptation

- [x] **AC-1** — Une liasse établie sur une balance ingérée directement (`source: direct`) et une
  autre établie sur une balance de l'atelier ou d'un import se lisent à l'identique : seule la
  provenance diffère, et elle n'est pas lue.
- [x] **AC-2** — Aucune lecture ni test sur l'origine de la balance dans le code : une garde AST le
  tient, et elle rougit si on en introduit une.
- [x] **AC-3** — Pour chaque type d'entité d'un vertical, avec son paquet publié, les obligations
  sont dérivées par le chemin commun, sans code dédié.

## Fichiers

- NEW `src/garde-agnosticisme-balance.spec.ts` — garde AST (D-309-2), scanner exporté et testé.
- NEW `src/adapters/http/contrat-bilan-service.provenance.spec.ts` — preuve D-309-1 (a) (fichier
  à part plutôt que dans les deux specs existantes : la preuve couvre les deux lectures).
- UPDATE `test/obligations.e2e-spec.ts` — paramétrage D-309-3 (type d'entité de l'implantation et
  du rattachement mutables ; remis à `ENTREPRISE` dans le `beforeEach`).
- Aucun code de production attendu. S'il en faut, c'est un écart à dire avant de le faire.

## Definition of Done

- [x] Branche `MNV-309` (fiscal) depuis `origin/dev`, PR fusionnée en rebase ; fiche et tracker par
  PR sur `main`.
- [x] Portes vertes (tsc, lint, unitaires, e2e) ; mutation : une lecture de `source === 'direct'`
  glissée dans le domaine ou un adaptateur rougit la garde.

## Notes pour le développement

- Pièges du poste : barrels `index.ts` recréés par l'IDE (purger les non suivis avant chaque
  porte, jamais `git add -A`) ; CRLF (`--ignore-cr-at-eol` pour juger un diff) ; suite unitaire en
  `-w 2`.
- Une autre session code aussi `fiscal-service` : `git fetch` et rebase avant la PR.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, après lecture de l'entrée du
tracker (aucun arbitrage), de l'épic, de FR-F76/F77, d'AD-14/AD-15 et du code de `fiscal-service`,
`balance-service` (contrat `balance.submitted`, `SOURCES_BALANCE`, `ORIGINES_BALANCE`),
`bilan-service` (`SnapshotResponseDto`) et `dossier-service` (`TypeEntite`).

**2026-11-14 — livrée.** fiscal-service #31, fusionnée en rebase sur `dev`. Aucun code de
production : l'agnosticisme était déjà vrai, il est désormais gardé.

- Portes : tsc, lint, 2 155 unitaires, 172 e2e.
- Mutations 5/5 tuées : branche sur `source === 'direct'` dans le domaine, `sourceSystem` lu
  dans un adaptateur (garde AST) ; provenance recopiée dans la liasse puis dans le contenu
  (preuve AC-1, rouge sur l'assertion et non sur la compilation) ; dérivation qui ignore le type
  d'entité (e2e AC-3).
