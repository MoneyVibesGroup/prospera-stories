# STORY-1002 : attribuer — charge pondérée, réaffectation motivée, prise en instruction

Status: done

**Complexité :** moyenne (un registre des gestionnaires, une commande du dossier, une liste de choix calculée, l'alerte
du dossier non affecté ; le parcours joué contre le LC fictif)

**Épic :** EPIC-206 (déclarer, ouvrir et attribuer), EPIC-207 (instruire)
**Dépôts :** `prospera-sinistres-service` ; `prospera-stories` (manifeste `sinistres` : routes de lecture)
**Plage :** groupe C, n° 13 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 1001.

---

## Pourquoi

Un dossier ouvert n'a pas de titulaire tant que le responsable du service (`RESP`) ne l'a pas **affecté** à un
gestionnaire du bon volet ; l'accueil oriente mais n'affecte jamais, et aucun gestionnaire ne se prend un dossier
lui-même. Le responsable choisit en voyant la **charge pondérée** de chacun ; il peut **réaffecter** (absence,
surcharge, conflit d'intérêts), toujours avec un motif. Jusqu'ici, `gestionnaireId` n'était posé que par les preuves,
en base : la condition `DOSSIER_AFFECTE` de la prise en instruction (transition 5) n'avait aucune commande pour la
remplir.

**Source** : PRD FR-50, FR-51 (version finale de `prd.md` : plus d'exception « il le prend lui-même ») ; paramètres
`seuil_surcharge_gestionnaire` 1,2, `seuil_disponible_gestionnaire` 0,8, `poids_charge_gravite` (1 ; 1 ; 1,3 ; 1,6),
`poids_charge_domaine_type` « à saisir » (annexe D) ; H-044 (1 jour ouvré) ; démo (`lib/responsable-hub.ts`, vue
`reaffectation`, 14 gestionnaires : 3 corporel, 5 matériel, 3 risques divers, 3 recours) ; LC fictif (STORY-987 :
le personnel du jeu, `GEST-01` → `GEST-14`) ; spine AD-26 (« sans `reseau`, portée lue des affectations de
`sinistres` ») ; plan (« `DOSSIER_AFFECTE` posé par l'affectation ; une réaffectation exige un motif ; le parcours
déclarer → ouvrir → attribuer → instruire se joue contre le LC fictif »).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Le registre des gestionnaires** : `PUT /api/v1/sinistres/gestionnaires/{gestionnaireId}` (`RESP`, `ADMIN`) enregistre nom, rôle (`GEST` ou `GREC`), volet, capacité (défaut du paramètre), absences datées, actif ; `GET /api/v1/sinistres/gestionnaires` (`RESP`, `DT`, `DG`, `AUD`) les rend avec leur charge pondérée, leur taux, le signal `SURCHARGE` / `DISPONIBLE` / `NORMAL` et « absent aujourd'hui » | tests ; pile (les 14 du LC fictif) |
| AC-2 | **La charge pondérée** (FR-51) : poids d'un dossier actif = poids du type (grille `affectation-2026.1`) × coefficient de gravité (léger, modéré 1 ; grave 1,3 ; mortel 1,6), arrondi au demi-point ; charge = somme ÷ capacité ; surchargé au-delà de 1,2, disponible sous 0,8 ; recalculée à chaque lecture (donc après chaque affectation) | tests (paramètre figé par empreinte) |
| AC-3 | **La liste de choix** : `GET /api/v1/sinistres/dossiers/{id}/affectation/candidats` (`RESP`) rend les gestionnaires actifs **du volet du dossier**, les moins chargés d'abord, avec charge, signal, absence et le titulaire actuel marqué | tests ; pile |
| AC-4 | **Affecter** (FR-50) : `POST /api/v1/sinistres/dossiers/{id}/affectation` (`RESP` seul ; `ACC`, `GEST`… : `DROIT_INSUFFISANT`) pose `gestionnaireId` ; motif facultatif à la première affectation ; cible d'un autre volet ⇒ `VOLET_INCOMPATIBLE` ; cible inconnue ou inactive ⇒ `GESTIONNAIRE_INCONNU` ; dossier clos ou pas encore ouvert ⇒ `AFFECTATION_IMPOSSIBLE` ; cible surchargée ou absente ⇒ permis **avec un motif** (`MOTIF_ECRIT` sinon, l'avertissement dans le refus) ; journal « affectation : non affecté → [nom] » avec l'auteur et l'heure ; idempotence, version lue, refus tracés | tests ; pile |
| AC-5 | **Réaffecter** (FR-51) : même route sur un dossier qui a un titulaire — motif obligatoire (`MOTIF_ECRIT`), cible identique refusée (`CIBLE_IDENTIQUE`) ; journal « réaffectation : [ancien] → [nouveau] — motif » ; l'historique des affectations est gardé au dossier | tests ; pile |
| AC-6 | **La prise en instruction** : `OUVERT → EN_INSTRUCTION` (transition 5) refusée sans affectation (`DOSSIER_AFFECTE`, « le dossier doit avoir été attribué par l'encadrement »), acceptée après ; aucun `gestionnaireId` posé en base par la preuve | tests ; pile |
| AC-7 | **L'alerte du responsable** (FR-50, H-044) : dans la file `a-attribuer`, chaque dossier porte `ouvertLe` (la dernière transition vers `OUVERT`) et `nonAffecteEnRetard` (plus de 1 jour ouvré, paramètre) ; la file compte ses lignes en retard (`nonAffectesEnRetard`) | tests |
| AC-8 | **Contre le LC fictif** : sur une pile `sinistres` + `assurance` + `liaison-assureur` + LC fictif, une police du jeu est déclarée, reçoit son numéro du LC (envoi enfilé à la main, D-1002-8), est jugée recevable, ouverte, affectée à un gestionnaire du jeu, réaffectée avec motif, puis prise en instruction | pile |

## Décisions retenues par défaut (contestables)

- **D-1002-1 — `sinistres` tient le registre des gestionnaires** (`sinistres_gestionnaires`) tant que `reseau` n'est
  pas là (spine AD-26 : « sans `reseau`, portée lue des affectations de `sinistres` ») : identifiant = l'identifiant
  de l'utilisateur dans le jeton, nom, rôle, volet, capacité, absences. Le `RESP` (ou `ADMIN`) l'écrit ; quand
  `reseau.affectation.changed@1` existera, son consommateur alimentera ce même registre (story à venir). Pour la démo,
  le registre se charge depuis le personnel du LC fictif (les 14 gestionnaires du jeu).
- **D-1002-2 — Le poids d'un type vaut 1** dans la grille `affectation-2026.1` tant que la compagnie ne l'a pas
  saisie (« grille de la démo non extraite », annexe D) ; la gravité pondère (1 ; 1 ; 1,3 ; 1,6). **Le poids d'un
  dossier n'est pas arrondi** (l'arrondi au demi-point des missions d'expertise ferait 1,3 = 1,6 = 1,5 avec un poids
  de type à 1) ; seul le total des points l'est, au dixième. Un dossier sans déclaration lue (antérieur à
  STORY-1000) pèse 1.
- **D-1002-3 — La capacité par défaut d'un gestionnaire est de 20 points** `[ASSUMPTION]` (environ 300 dossiers en
  instance pour 14 gestionnaires dans la démo) ; la compagnie la règle par gestionnaire.
- **D-1002-4 — Affecter est une commande hors transition** (`AFFECTER`, patron des relances et de la garantie :
  idempotence, version lue, refus tracé, ligne d'audit chaînée, fait du dossier) ; possible sur un dossier actif à
  partir de `PIECES_ATTENDUES` (un dossier en attente de pièces peut déjà être confié), jamais sur `DECLARE` ni sur un
  dossier sorti du circuit.
- **D-1002-5 — Une cible surchargée ou absente exige un motif**, sous le code `MOTIF_ECRIT` avec l'avertissement
  (`GESTIONNAIRE_SURCHARGE`, `GESTIONNAIRE_ABSENT`) dans les détails : l'avertissement « accepté par un motif » de
  FR-51, sans code nouveau.
- **D-1002-6 — `RESP` seul affecte** ; la délégation d'absence (le `DG` pour le responsable, FR-7) arrive avec
  STORY-1003. Qu'un `GEST` ne prenne en instruction que **ses** dossiers relève de la portée par dossier (STORY-1004) :
  ici, la condition `DOSSIER_AFFECTE` de la table reste celle de la machine (un titulaire existe).
- **D-1002-7 — Le fait `sinistres.dossier.changed@1` ne change pas** : il ne porte ni acteur ni gestionnaire (AD-23) ;
  la nouvelle version du dossier suffit aux consommateurs pour relire.
- **D-1002-8 — Le pont de la déclaration vers le LC se fait à la main dans la preuve.** La préparation a montré que
  `sinistres.declaration.enregistree@1` (spine AD-16 : `liaison-assureur` le consomme) **n'existe nulle part** : ni
  schéma dans `prospera-plateforme`, ni publication dans `sinistres`, ni consommateur dans `liaison-assureur` ; aucune
  story ne le porte. Pour jouer le parcours contre le LC fictif, la preuve enfile la ligne C-13 chez `liaison-assureur`
  par sa route (`POST …/echange/envois`), avec ce que le fait portera ; le numéro du LC revient ensuite par le chemin
  réel (`numero-sinistre.attribue@1`). ⚠️ **Écart nommé au PO** (journal du groupe C) : une story est à créer pour
  le fait et ses deux bouts (avec `sinistres.garantie.decidee@1`, différé par D-1001-5).
- **Routes (proposition)** : `PUT /api/v1/sinistres/gestionnaires/{gestionnaireId}`, `GET /api/v1/sinistres/gestionnaires`
  (lecture seule), `GET /api/v1/sinistres/dossiers/{id}/affectation/candidats` (lecture seule),
  `POST /api/v1/sinistres/dossiers/{id}/affectation`.

## Ce qui a été livré

**2026-11-17** — fusionnées en « Rebase and merge » :

- `prospera-stories` **#584** : le manifeste `sinistres` déclare deux routes de lecture (`GET …/gestionnaires`,
  `GET …/dossiers/{id}/affectation/candidats`).
- `prospera-sinistres-service` **#13** (`dev` `d337ec7`) : `src/modules/sinistres/affectation/` — le registre des
  gestionnaires (`sinistres_gestionnaires`), la charge pondérée (`affectation-2026.1`, figé par empreinte), la commande
  `AFFECTER` (affectation et réaffectation motivée, historique ajouté, journal « affectation : non affecté → [nom] »),
  la liste de choix, l'alerte de la file `a-attribuer` ; le manifeste recopié de `1b3cdee` et un invariant qui vérifie
  que les lectures y sont déclarées.
- **Node 24** : 888 unitaires sur vrai MongoDB, 19 e2e ; lint 0, build vert.
- **Pile `grp-c-1002`, contre le LC fictif** (`sinistres`, `assurance`, `liaison-assureur`, LC fictif, Karapace) :
  - le jeu réduit : 5 180 projections, 4 880 versions sur 4 880 copiées par `assurance` ;
  - les 14 gestionnaires du personnel du LC fictif chargés au registre (3 corporel, 5 matériel, 3 risques divers,
    3 recours), un absent ;
  - `POL-AUTO-RC-000003` déclarée (`DEC-2026-00001`), l'envoi enfilé à la main (D-1002-8), le numéro
    `LCF-2026-000001` revenu au dossier par `numero-sinistre.attribue@1` ;
  - recevabilité `CONTRAT_VALIDE`, garantie applicable ; garantie acquise ; les 6 pièces validées dans `ged` (faits au
    contrat) ; ouvert ; dans la file « à attribuer » ;
  - refus : prise en instruction sans titulaire **409 `DOSSIER_AFFECTE`** ; l'accueil qui affecte 403 ; un
    gestionnaire corporel 409 `VOLET_INCOMPATIBLE` ; l'absent sans motif 400 `MOTIF_ECRIT` (`GESTIONNAIRE_ABSENT`) ;
    réaffecter sans motif 400 `MOTIF_ECRIT`, vers le même 409 `CIBLE_IDENTIQUE` ;
  - la liste de choix : les 5 gestionnaires matériel, l'absent en dernier ; affecté à Edem Akakpo, réaffecté avec
    motif à Dzifa Adjovi, qui prend le dossier en instruction (`EN_INSTRUCTION`) ;
  - piste intègre (2 commandes `AFFECTER`, 4 refus tracés) ; **aucun `gestionnaireId` posé en base**.
- **Rejouée sur les images reconstruites depuis `dev`** (`sinistres` `d337ec7`, pile `grp-c-1002d`) : même scénario,
  même issue.
- **Ce que la preuve a montré** :
  - `sinistres.declaration.enregistree@1` n'existe nulle part (D-1002-8) ;
  - l'ancien titulaire peut encore prendre le dossier en instruction : la portée par dossier vient avec STORY-1004
    (D-1002-6) ;
  - des lignes d'erreur aux journaux, au premier passage (2 chez `assurance`) et au premier rejeu depuis `dev` (4, 4,
    7, 8 sur les quatre services), **non reproduites** aux passages suivants, rejoués à l'identique (0 partout) : leur
    texte n'a pas été gardé, elles ne sont pas expliquées.

**Reste** : le fait `sinistres.declaration.enregistree@1` et ses deux bouts (D-1002-8) ; le consommateur de
`reseau.affectation.changed@1` vers le registre (D-1002-1) ; la grille de poids par type de la compagnie (D-1002-2) ; la
délégation d'absence du responsable (STORY-1003, FR-7) ; seul le titulaire instruit (STORY-1004).
