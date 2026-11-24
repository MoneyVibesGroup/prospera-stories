# La coque `prospera-app` (EPIC-265) : qui fait quoi, et quand

> **Date :** 2026-11-24 · **Demandé par :** l'utilisateur (Dev B) : « écris les fiches de la coque EPIC-265 pour que A
> et C s'en occupent au bon moment ».
> **Lu par :** les sessions des groupes **A** et **C** (poste principal), puis Dev A à son arrivée.
> **Rang :** s'ajoute au plan du lot en cours de chaque groupe, sans le remplacer. Une story de la coque se prend
> **quand la story en cours du groupe est finie** (poussée, fusionnée, journal à jour), jamais au milieu.
> **Sources :** spine `architecture/architecture-prospera-app-2026-11-10/ARCHITECTURE-SPINE.md` (AD-1 → AD-25),
> `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (§2.3, §3.1, §4.1, §7.1 : EPIC-265, S3 → S8, ★),
> `reserved_ranges` de `sprint-status.yaml` (`EPIC-265`, `PRA-01 → PRA-199`).

---

## 1. Pourquoi maintenant

La coque est sur le chemin de la démo du **15/01** (plan §2.3 : « la coque, mécanique S3 → S5, modules métier
S6 → S8 »). Elle démarre en **S3 (23/11)**. Le plan la donne à Dev A, qui n'arrive qu'en décembre : sans ce document,
personne ne la tient avant S5, et la démo perd sa coque.

**Ce qui a changé depuis la spine (10/11), et que les fiches prennent en compte :**

- **L'état publié est servi pour de vrai.** `platform-catalog-service` sert `GET /api/v1/etat-publie/{organisationId}`
  (STORY-936, chemin public `/api/instance/v1/…`) sur le contrat figé `contrat/etat-publie.openapi.json` 1.0.0
  (STORY-932) et la matrice `contrat/matrice-etats.json` (`versionMatrice: 1`). **La doublure d'AD-23 n'a plus besoin
  d'être un serveur** : elle se réduit à des jeux de lecture générés depuis la matrice, pour les tests (PRA-05). Le
  développement se fait sur la vraie route, derrière le Traefik de PRA-02.
- **Le module `reseau` a son backend** (groupe D, STORY-1030 → 1064, EPIC-044 → 053) : c'est le premier module
  d'écran métier (PRA-10). `pdv`, `catalogue` et `stock` n'ont pas encore de backend : leurs fiches s'écriront quand
  il arrivera (§4).
- Le dépôt GitHub **`MoneyVibesGroup/prospera-app` existe et est vide** : PRA-01 y pose le premier commit.

## 2. Les fiches, dans l'ordre

| # | Story | Groupe | Semaine visée | Dépend de | Points |
|:--:|---|:--:|---|---|:--:|
| 1 | [PRA-01](../frontend-stories/PRA-01.md) Le squelette de la coque | **A** | S3 (fin 27/11) | — | 5 |
| 2 | [PRA-02](../frontend-stories/PRA-02.md) Le profil `coque` du compose : une seule origine sur :8080 | **C** | S3-S4 | — (se prouve sans PRA-01) | 3 |
| 3 | [PRA-03](../frontend-stories/PRA-03.md) La session, la configuration d'exécution, la sécurité | **A** | S4 | PRA-01, PRA-02 | 5 |
| 4 | [PRA-04](../frontend-stories/PRA-04.md) Le client d'API unique | **A** | S4 | PRA-03 | 3 |
| 5 | [PRA-05](../frontend-stories/PRA-05.md) L'état publié lu, une seule fois, jamais recalculé | **A** | S4 (fin 04/12) | PRA-04 | 5 |
| 6 | [PRA-06](../frontend-stories/PRA-06.md) Le registre, le menu, la garde unique, les écrans d'état | **A** | S5 | PRA-05 | 5 |
| 7 | [PRA-07](../frontend-stories/PRA-07.md) Les bandeaux, `<Ecriture>`, les actions hors garde, la marque d'essai | **C** | S5 | PRA-05 | 5 |
| 8 | [PRA-08](../frontend-stories/PRA-08.md) L'habillage, l'accueil et les emplacements | **C** | S5 | PRA-06 | 3 |
| 9 | [PRA-09](../frontend-stories/PRA-09.md) L'Administration, première partie (module `instance`) | **C** | S5-S6 | PRA-06, PRA-07 | 5 |
| 10 | [PRA-10](../frontend-stories/PRA-10.md) Le module d'écran `reseau` | **A** | S6 | PRA-06, PRA-07 | 5 |
| 11 | [PRA-11](../frontend-stories/PRA-11.md) L'Integration Gate de la coque sur le vrai moteur | **A** | S6 (≤ 18/12) | PRA-01 → PRA-10 | 3 |

**Total écrit : 47 points.** Chemin le plus long : PRA-01 → 03 → 04 → 05 → 06 → 10 → 11, tenu par A. C travaille
en parallèle sur PRA-02, puis prend PRA-07 et PRA-08 dès que PRA-05 et PRA-06 sont sur `dev`.

**Repère de date à tenir :** PRA-05 fini le **04/12** (même jour que le socle EPIC-155) ; PRA-11 vert le
**18/12**, avant la pause, jour du jalon « cabinet sur le moteur » (plan §3.1, S6). En janvier, S7-S8 sont pris par
les modules `pdv`, `catalogue`, `stock` (§4) et la démo.

## 3. Le partage du dépôt `prospera-app`

Le plan de février (§3.3) partage ce dépôt **par dossier**. Entre A et C :

| Dossier | Tenu par |
|---|---|
| `src/app/`, `src/coque/api/`, `src/coque/etat-publie/`, `src/coque/registre.ts`, `src/coque/menu/`, `src/coque/garde/`, `src/coque/ui/`, `src/coque/i18n/`, `src/coque/securite/`, `contrat/`, `outils/`, la CI | **A** |
| `src/coque/bandeaux/`, `src/coque/habillage/`, `src/coque/emplacements/`, `src/coque/espace/`, `src/modules/instance/` | **C** |
| `src/modules/reseau/` | **A** |
| `docker-compose.yml` (profil `coque`) et `infra/traefik/` dans **MoneyVibes_Apps** | **C** (PRA-02) |

- Un fichier d'un autre dossier dont on a besoin (par exemple une clé de message dans `src/coque/i18n/`) se demande
  dans son journal, ou s'ajoute dans **sa** PR en le disant dans la description. On ne réécrit jamais le fichier d'un
  autre dossier sans le dire.
- **Docker** : PRA-02 et PRA-11 lèvent une pile. Le verrou `MoneyVibes_Apps\.verrou-docker` du poste principal
  s'applique, piles `grp-a` / `grp-c`, `down -v` à la fin.

## 4. Ce qui n'est pas écrit, et quand l'écrire

Les fiches s'écrivent juste avant de coder (règle des groupes §1.1). Ces quatre-là sont **nommées et réservées**, sans
fiche, parce que leur backend ou leur contrat n'existe pas encore :

| Id réservé | Objet | À écrire quand |
|---|---|---|
| PRA-12 | Module d'écran `pdv` (vue 360°, carte) | le backend `pdv` (EPIC-085 → 087, 091 → 093) est sur `dev` ; visé S6-S7 |
| PRA-13 | Module d'écran `catalogue` (prix résolu) | le backend `catalogue` (EPIC-065 → 070) est sur `dev` ; visé S7 |
| PRA-14 | Module d'écran `stock` (stock lisible) | le backend `stock` (EPIC-075 → 078) est sur `dev` ; visé S7-S8 |
| PRA-15 | L'Administration, deuxième partie : mises à jour, dépôt de fichier, tunnel de support, consentement, interrupteurs | l'agent et la centrale servent leurs routes (EPIC-148 → 153, 157) ; visé S8-S9 |

Les écrans métier du moteur, de la Reprise et des verticales (assurance, distributeur, microfinance) ne sont **pas**
dans EPIC-265 : ce sont les écrans de Dev B (`PRA-100 → 199`), qui suivent la même coque.

## 5. À l'arrivée de Dev A

EPIC-265 revient à Dev A (plan §7.1). À son arrivée, A et C écrivent dans leur journal la passation des fiches **non
commencées**. Une fiche en cours se finit par le groupe qui l'a ouverte.
