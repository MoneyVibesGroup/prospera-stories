# STORY-989 : versions et échéances du dossier — « modifié par X à hh:mm », et un échéancier qu'une restauration ne rejoue pas

Status: done

**Complexité :** grande (le refus de version lisible, le référentiel daté des échéances, le calcul des termes, la file
BullMQ et l'époque)

**Épic :** EPIC-205 (le dossier : machine à états, versions et échéances)
**Dépôt :** `MoneyVibesGroup/prospera-sinistres-service` (module `sinistres`)
**Plage :** groupe C, n° 1 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4).

---

## Pourquoi

Deux agents travaillent sur le même dossier (FR-28) : le second ne doit jamais écraser le premier, et il doit savoir
**qui** a changé le dossier et **quand**, sans perdre sa saisie. Chaque dossier porte aussi des **échéances** (FR-140 →
FR-142) : légales au corporel automobile (Code CIMA, art. 231 et suivants), internes partout ailleurs, chacune avec un
départ, un arrêt, une durée, une source et une conséquence. La spine en fait un composant de `sinistres` (AD-27) : un
échéancier BullMQ, clé `(dossierId, échéance, epoque)`, qu'une **restauration ne rejoue jamais** (AD-20, moteur AD-16).

**Source** : `prds/prd-assurance-2026-11-13/prd.md` FR-28, FR-140 → FR-142 (codes `ECHEANCE_INCOMPLETE`,
`SUSPENSION_NON_MOTIVEE`) ; spine assurance AD-18 (temps et délais), AD-20 (restauration), AD-27 (échéancier).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **« Modifié par X à hh:mm »** : une commande sur une version périmée est refusée `ETAT_PERIME` ; le message nomme l'agent et l'heure (fuseau de la compagnie) de la dernière écriture ; les détails portent la version, l'auteur, l'instant et la commande refusée, pour que l'écran garde la saisie | tests ; pile |
| AC-2 | **Le référentiel des échéances est une donnée datée et versionnée** (`referentiel-des-echeances.json`, version `2026.1`) : les lignes de FR-141 et FR-142 avec nature (`REGLEMENTAIRE`, `INTERNE`, `SUIVI`), départ, arrêt, durée et unité, source, conséquence, applicabilité, seuil d'alerte (45 jours avant pour le réglementaire, 85 % du délai pour l'interne) ; une ligne sans départ ou sans arrêt empêche le chargement (`ECHEANCE_INCOMPLETE`) ; **un dossier est jugé selon la version en vigueur à sa date de survenance** | tests de la donnée |
| AC-3 | **Le calcul des termes** : mois civils depuis le départ, jours calendaires, jours et heures **ouvrés** par un port de calendrier (jours ouvrés et fériés paramétrés) ; jours restants négatifs une fois dépassés ; un dossier matériel ou de risques divers n'a **aucune** échéance réglementaire | tests |
| AC-4 | **Les événements du dossier ouvrent et arrêtent les échéances** (déclaration, ouverture, offre envoyée, accord, dernier règlement, clôture, sorties) ; chaque jalon (alerte, terme) est planifié dans BullMQ sous la clé `(dossierId, échéance, jalon, epoque)`, **idempotent** ; à l'heure dite, le travailleur relit l'horloge, n'agit pas sur une échéance arrêtée, et constate le jalon **une seule fois** | tests ; Redis réel |
| AC-5 | **Une restauration ne rejoue aucune échéance** : une nouvelle `epoque` retire les tâches des époques antérieures (sans effet si elles tombent quand même) ; un jalon dont l'heure est passée avant l'ouverture de l'époque n'est pas rejoué, il est noté « non rejoué » | tests ; pile |
| AC-6 | **Suspensions et prorogations** : `POST …/dossiers/{id}/echeances/{code}/suspensions` avec article, début, fin et motif ; sans article ou sans motif : `SUSPENSION_NON_MOTIVEE` ; la suspension décale le terme sans l'effacer et reste dans l'historique ; version du dossier contrôlée | tests |
| AC-7 | **La lecture** : `GET …/dossiers/{id}/echeances` rend pour chacune son nom, sa nature, ses départ et arrêt, sa durée, son terme, ses jours restants, sa source, sa conséquence, la version du référentiel, ses suspensions et ses jalons constatés | tests ; pile |
| AC-8 | Suites vertes sous Node 24, lint 0, build ; la pile démarre avec Redis (santé `redis`) ; un dossier corporel automobile sur la pile : échéances posées, un jalon passé constaté, une restauration simulée qui ne rejoue rien | pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-989-1 — Une tâche différée à identifiant stable, pas un ordonnanceur répétitif.** La spine nomme
  `upsertJobScheduler` ; une échéance est un instant unique, et BullMQ 6.7 réserve les ordonnanceurs aux répétitions.
  La clé d'AD-27 devient l'identifiant de la tâche (`dossierId|code|jalon|epoque`, sans `:`), ce qui donne la même
  idempotence ; « mettre à jour » une échéance (suspension) = retirer la tâche et la reposer. Patron du catalogue
  (STORY-933).
- **D-989-2 — L'époque de l'instance est lue par un port** (`EpoqueDeLInstance`) : en attendant l'agent (EPIC-148), sa
  valeur et sa date d'ouverture viennent de la configuration (`INSTANCE_EPOQUE`, `INSTANCE_EPOQUE_OUVERTE_LE`).
- **D-989-3 — Constater un jalon, c'est l'écrire sur l'échéance** (`EN_ALERTE`, `DEPASSEE`, avec la date), une fois
  par époque ; l'envoi des alertes et les relances viennent avec STORY-999 et le module `notification`.
- **D-989-4 — La date de survenance se donne à la création** (`survenuLe`, facultative : à défaut, la date de la
  déclaration) ; elle choisit la version du référentiel et sert de départ aux délais légaux (« date de l'accident »).
- **D-989-5 — Les événements que le circuit ne produit pas encore** (décès, consolidation, procès-verbal reçu, numéro
  officiel, rapport d'expert, chèque émis, versement) sont déclarés au référentiel ; leurs échéances s'ouvriront avec
  les stories qui produisent ces événements.
- **D-989-6 — La mise à jour de l'écran de l'autre agent sans rechargement** (FR-28, second volet) passe par le fait
  `sinistres.dossier.changed@1`, publié avec STORY-991, et par l'écran (lot frontend).
- **D-989-7 — Les « heures ouvrées » sont les heures des jours ouvrés** (24 par jour ouvré) : 48 heures ouvrées depuis
  un vendredi midi arrivent le mardi midi. Si la compagnie compte des heures de bureau, c'est un paramètre de plus.
- **D-989-8 — Une échéance plus courte que sa fenêtre d'alerte est sous alerte dès son départ**, jamais avant (la
  dénonciation de 15 jours, réglementaire, alerte « 45 jours avant ») ; trouvé par les tests.

## Ce qui a été livré

**2026-11-16** — `prospera-sinistres-service` **#4** fusionnée en « Rebase and merge » (`dev` `4a1b817`) :

- `src/modules/sinistres/echeances/` : `referentiel-des-echeances.json` (version `2026.1`, 26 lignes, contrôlé au
  chargement), `temps.ts` (mois civils, jours et heures ouvrés, fuseau), `echeancier.ts` (événements → échéances,
  termes, suspensions, alertes, jalons, vue), `echeancier.service.ts` et `echeances.processor.ts` (file BullMQ
  `sinistres-echeances`, constat unique dans `sinistres_jalons`, balayage par `upsertJobScheduler`, époque).
- Le dossier porte `survenuLe`, `versionEcheances`, `echeances` et `modifiePar` ; `ETAT_PERIME` dit « modifié par X à
  hh:mm » ; `GET …/{id}/echeances`, `POST …/{id}/echeances/{code}/suspensions` ; Redis dans la pile et la santé.
- **Défaut trouvé par le banc Redis réel, corrigé** : BullMQ 6.7 ne charge `ioredis` que s'il est déclaré ; sans lui,
  le service n'aurait jamais joint Redis (aucun test en mémoire ne le voyait).
- **Preuves** :
  - Node 24 (étage `verification`, export LF) : 746 unitaires et 19 e2e, lint 0, build ; le service sur un **vrai
    MongoDB** et l'échéancier sur un **vrai Redis** (un jalon tombe par BullMQ, constaté une fois ; la nouvelle époque
    retire et ne rejoue rien).
  - **Pile `grp-c`** : un dossier corporel automobile survenu le 01/10/2025 → échéances légales et internes, six
    jalons passés constatés ; « Le dossier a été modifié par acc-1 à 02:47 » au second agent ; suspension (art. 249)
    qui décale le terme de 42 jours ; **redémarrage en époque 2** : les six jalons passés notés `NON_REJOUE`, **aucun
    rejoué**, seules les tâches de l'époque 2 dans Redis. **Rejoué sur l'image reconstruite depuis `dev`** : vert.

**Reste** : l'envoi des alertes et les relances (STORY-999, avec `notification`) ; les événements que le circuit ne
produit pas encore (décès, consolidation, numéro officiel, chèque…, D-989-5) ; l'époque fournie par l'agent (EPIC-148) ;
la mise à jour de l'écran par le fait de STORY-991.
