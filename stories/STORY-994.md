# STORY-994 : la provision dossier par dossier — `sinistres` propose, `assurance` seul écrivain des mouvements

Status: done

**Complexité :** grande (trois contrats de faits, un module qui écrit pour la première fois, un seuil glissant, une
décision du responsable, une grille paramétrée versionnée)

**Épic :** EPIC-215 (les contrats lus, la provision et les états techniques)
**Dépôts :** `prospera-plateforme` (dossiers de C), `prospera-sinistres-service`, `prospera-assurance-service`
**Plage :** groupe C, n° 5 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 993.

---

## Pourquoi

La provision est la charge estimée du sinistre. Le régulateur la veut **dossier par dossier, en brut** (art. 334-12) ;
la compagnie veut qu'elle ne soit **jamais écrasée** et qu'une révision importante passe par le responsable. La spine
(AD-11) partage le travail : **`sinistres` propose** (`sinistres.provision.revisee@1`), **`assurance` écrit seul** les
mouvements, évalue seul le seuil glissant et publie la provision effective (`assurance.provision.changed@1`) ou la
révision qui attend le responsable (`assurance.provision.a-valider@1`).

**Source** : PRD FR-49, FR-76, FR-188 ; annexe A (C2, C3, C13 `provision-jamais-ecrasee`), annexe B (12), annexe D
(`arrondi_provision_fcfa`, `provision.*`) ; démo (`BAREMES`, `MotifProvision`, `estimationInitiale`) ; spine AD-11,
AD-12, AD-16.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Contrats** : `sinistres.provision.revisee` (dossier, référence, montant ou volet et gravité pour l'ouverture, motif de la liste fermée, pièce, auteur, rôle exercé), `assurance.provision.changed` (état absolu : dossier, séquence, avant, après, motif, origine, effective le), `assurance.provision.a-valider` ; chaque champ classé, aucune donnée personnelle ; Karapace BACKWARD | tests ; Karapace |
| AC-2 | **`sinistres` propose** : `POST /api/v1/sinistres/dossiers/{id}/provision` (`GEST` ou `RESP`, rôle exercé du jeton) ; motif hors liste ou absent → 400 `MOTIF_OBLIGATOIRE` ; le fait part par l'outbox, dans la transaction | tests ; pile |
| AC-3 | **`assurance` écrit les mouvements, ajout seul** : séquence par dossier (index unique), date de valeur, avant, après, motif, auteur, pièce, `origine` `HUMAIN` ; un nouveau montant égal à l'actuel est refusé (`MONTANT_INCHANGE`, proposition rejetée, aucun mouvement) ; aucun mouvement n'est modifié ni supprimé ; un fait rejoué ne crée rien | tests ; vrai MongoDB (pile) |
| AC-4 | **Ouverture** (FR-49) : sans estimation, le milieu de la tranche de la gravité dans la grille du volet (`provision.grille_ouverture` `2026.1`, données de la démo), arrondi à 5 000 FCFA ; avec l'estimation du déclarant, elle, conservée comme source ; une seconde ouverture est refusée (`DEJA_OUVERTE`) | tests |
| AC-5 | **Seuil glissant** (D12, AD-11) : une révision d'un `GEST` dont l'écart cumulé depuis la dernière validation dépasse 2 000 000 FCFA attend le `RESP` (`EN_ATTENTE_RESP`, `a-valider` publié) et ne change pas la provision ; sous le seuil, effective ; une révision du `RESP` est effective ; la révision à zéro de **clôture** en est exemptée | tests |
| AC-6 | **Le responsable décide** : `POST /api/v1/assurance/provisions/{reference}/propositions/{id}/decision` (`RESP` seul, motif) — acceptée → mouvement « validation hiérarchique » effectif ; refusée → aucun mouvement ; une proposition décidée ne se redécide pas | tests ; pile |
| AC-7 | **Lecture** : `GET /api/v1/assurance/provisions/{reference}` (provision courante, mouvements, propositions en attente) ; `GET …/provisions/a-revoir` (sans mouvement depuis 90 jours, « ancienne » au-delà de 365) ; `GET …/provisions/grille-ouverture` | tests ; pile |

## Décisions retenues par défaut (contestables)

- **D-994-1 — Le périmètre** : `assurance` complet pour la provision effective ; `sinistres` publie la proposition. La
  **lecture** de `assurance.provision.changed@1` par `sinistres` (afficher la provision en vigueur sur le dossier) et
  la provision d'ouverture **posée par la commande d'ouverture** viennent avec STORY-1001 (ouvrir) ; ici la proposition
  d'ouverture passe par la même route que les révisions. Le report de revue (`assurance:provision:reporter`) et l'écart
  de 15 % avec l'estimation de référence (expert, devis) attendent l'expertise (EPIC-208) : ils ne sont pas codés ici.
- **D-994-2 — La clé du dossier côté `assurance` est la référence `DEC-AAAA-NNNNN`** (spine, « Clés d'origine » :
  mouvement = `(numéro de sinistre ou DEC-, séquence)`) : elle existe dès la déclaration, le numéro officiel arrive
  plus tard et ne change pas la clé. L'identifiant interne du dossier `sinistres` est porté à côté.
- **D-994-3 — Le seuil glissant** : somme des écarts absolus des mouvements effectifs **depuis la dernière validation
  du `RESP`** (ou depuis l'ouverture), plus l'écart proposé ; au-delà de `provision.ecart_validation` (2 000 000 FCFA),
  la proposition d'un `GEST` attend. Une révision proposée par le `RESP` est effective et remet le cumul à zéro. Le
  seuil est lu **à la date de l'acte** (AD-12, version du paramètre en vigueur).
- **D-994-4 — L'ouverture se calcule chez `assurance`** : la grille par volet et gravité est une donnée d'`assurance`
  (annexe A, C3) ; `sinistres` envoie volet, gravité et, s'il est saisi, l'estimation du déclarant. Gravité
  `LEGER | MODERE | GRAVE | MORTEL` → tranche de même rang (règle de la démo) ; volet `CORPOREL | MATERIEL |
  RISQUES_DIVERS`. Arrondi au plus proche multiple de 5 000 (une demi-unité monte).
- **D-994-5 — La décision du `RESP` se prend chez `assurance`** (qui publie `a-valider`) ; le rôle exercé vient du
  corps et doit figurer dans les rôles du jeton (patron D-988-2). Un `RESP` qui a lui-même proposé ne décide pas sa
  propre proposition (séparation des tâches, FR-7).
- **D-994-6 — Une proposition rejetée par `assurance`** (`MONTANT_INCHANGE`, `DEJA_OUVERTE`, `PAS_OUVERTE`) **est
  gardée** avec son code, visible à la lecture ; aucun fait n'est publié pour elle (le refus synchrone appartient à
  la route de `sinistres` pour ce qu'elle sait juger : motif, montant entier positif).

## Ce qui a été livré

**2026-11-16** — trois PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#15** (`dev` `f666c36`) : `sinistres.provision.revisee`, `assurance.provision.changed`,
  `assurance.provision.a-valider` ; le module `assurance` entre au registre `classification-sante`, chaque champ
  classé ; 408/408.
- `prospera-sinistres-service` **#7** (`dev` `b8d6a22`) : `POST /api/v1/sinistres/dossiers/{id}/provision` (`GEST`,
  `RESP`), la proposition tracée au dossier et publiée par l'outbox dans la même transaction ; `MOTIF_OBLIGATOIRE`,
  `MONTANT_REQUIS`. Node 24 : 788 unitaires (MongoDB réel) + 19 e2e, lint 0.
- `prospera-assurance-service` **#23** (`dev` `4eeab2d`) : module `assurance`, sous-dossier `provision/` — mouvements
  en ajout seul, propositions gardées, règles `provision` `2026.1` (grille, arrondi 5 000, seuil 2 000 000, 90 et 365
  jours, empreinte figée), seuil glissant, décision du `RESP`, liste « à revoir », consommateur supervisé
  `assurance.sinistres`. Node 24 : 2 315 unitaires + 363 e2e, lint 0, build.
- **Pile `grp-c-994`** (`sinistres` et `assurance` sur le même Kafka, Karapace) :
  - ouverture par la grille (CORPOREL, MODERE) → **600 000** ; une révision `GEST` de 900 000 → effective ; la
    suivante (cumul **2 200 000**) → `EN_ATTENTE_RESP`, provision inchangée, `a-valider` publié ; même montant →
    rejetée `MONTANT_INCHANGE` ; sans motif → 400 `MOTIF_OBLIGATOIRE` ; `ACC` → 403 ;
  - décision d'un `GEST` → 403 ; du `RESP` → 200, mouvement « validation hiérarchique » (2 800 000) ; redécider → 409 ;
    clôture → 0 ; quatre mouvements `1:null→600000 | 2:→1500000 | 3:→2800000 | 4:→0`, jamais réécrits ;
  - 5 propositions sur Kafka, 4 `provision.changed` et 1 `a-valider` publiés (outbox `SENT`) ; `TENANT_ADMIN` → 403 ;
  - Karapace : 4 sujets enregistrés, garde `classification-sante` 0 refus ; 0 erreur au journal.
  - Au premier passage : un test du banc MongoDB réel trop strict (le fait relu porte son enveloppe, corrigé), un
    `TimeoutError` de Karapace (non reproduit sur un registre neuf ni au passage suivant), et 6 + 4 lignes d'erreur au
    journal, **non reproduites** au passage suivant (journaux perdus avec la pile) : non expliquées.
  - **Rejouée sur les images reconstruites depuis `dev`** (sinistres `b8d6a22`, assurance `4eeab2d`) : même
    scénario, mêmes nombres, Karapace 4 sujets 0 refus, 0 erreur au journal.

**Reste** : `sinistres` lit `assurance.provision.changed@1` et pose la provision d'ouverture par la commande d'ouverture
(STORY-1001) ; le report de revue et l'écart de 15 % avec l'estimation de référence (avec l'expertise) ; l'état PSAP
(brut, cédé, net) ; les droits fins `assurance:provision:*` à `auth-service`.
