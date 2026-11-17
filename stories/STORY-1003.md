# STORY-1003 : les actes qui font une partie au dossier ; cumuls interdits ; matrice de délégation

Status: done

**Complexité :** moyenne (deux paramètres figés, la machine lit les actes de partie et la délégation, une commande de
contrôle du niveau 1)

**Épic :** EPIC-202 (rôles, séparation des tâches, délégation)
**Dépôts :** `prospera-sinistres-service`
**Plage :** groupe C, n° 14 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 998.

---

## Pourquoi

Jusqu'ici, la séparation des tâches de la machine était une table de trois lignes écrite dans le code (« celui qui a
passé la transition 5 ou 7 ne passe pas la 10a »). Le PRD la définit autrement : une **liste fermée d'actes** rend une
personne **partie au dossier** (FR-29), et **16 cumuls** sont interdits sur un même dossier (FR-7). L'affectation et le
contrôle du niveau 1 sont des actes de partie qui n'étaient pas des transitions ; un gestionnaire réaffecté reste
partie. Et la **matrice de délégation** (FR-8) dit qui valide quoi : la table nomme une instance `COMITE` qu'aucun rôle
du jeton ne porte, et la validation d'un dossier de 1 500 000 FCFA par le seul responsable passait.

**Source** : PRD FR-7, FR-8, FR-29, FR-78 (défauts H-014, H-015, H-016) ; table des transitions `2026.2` (10a :
`SEPARATION_DES_TACHES`, `CONTROLE_ABSENT`) ; plan (« un test par acte de FR-29 ; un cumul interdit de FR-7 refusé ; la
délégation est un paramètre daté (résout `COMITE`) »).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Partie au dossier** (FR-29) : la liste fermée des actes (`AFFECTER`, `INSTRUIRE`, `EVALUER`, `VALIDER`, `CONTROLER`, `ENREGISTRER_ACCORD`, `EMETTRE`, `REMETTRE`, `RAPPROCHER`) ; chaque acte est lu dans l'historique (transitions, affectations, contrôles) ; une transition qui n'est pas un acte ne rend pas partie ; un réaffecté reste partie ; la vue du dossier liste ses parties et leurs actes | un test par acte ; tests |
| AC-2 | **Les cumuls interdits** (FR-7) sont un paramètre figé (`separation-2026.1`) : 1, 2, 3, 4, 13, 14, et le contrôle du niveau 1 (contrôleur distinct de l'instructeur et du validateur, FR-8) refusés par `SEPARATION_DES_TACHES`, le refus nommant le cumul ; 7 (s'attribuer un dossier) refusé à l'affectation ; les neuf autres nommés avec ce qu'ils attendent | un test par cumul gardé |
| AC-3 | **La matrice de délégation est un paramètre daté** (`delegation-2026.1`, valable du 2026-11-17) : la version qui fait foi est la plus récente dont la date est atteinte ; « jusqu'à » 1 000 000 inclus : niveau 1 ; au-delà : le comité ; règlement commercial : le DG | tests (paramètre figé par empreinte) |
| AC-4 | **La délégation résout `COMITE`** : à la validation (10a), un signataire hors de la délégation du niveau requis est refusé (403 `DROIT_INSUFFISANT`, le niveau requis et le cumul nommés) ; au-delà du niveau 1, aucun rôle seul ne valide | tests ; pile |
| AC-5 | **Le contrôle du niveau 1** : `POST …/dossiers/{id}/controle` (`GEST`, `GREC`, `RESP`), avis écrit ; pose `CONTROLE_ABSENT` ; refusé hors validation ou au-delà du niveau 1 (`CONTROLE_IMPOSSIBLE`) ; au-delà du niveau 1, la condition n'a pas d'objet | tests ; pile |

## Décisions retenues par défaut (contestables)

- **D-1003-1 — Les actes viennent de l'historique, jamais d'un champ « parties » écrit** : transitions (5 instruire,
  7 évaluer, 10a valider, 14 enregistrer l'accord, 17 et 18 émettre, 20 remettre), affectations (`par`), contrôles
  (`par`). `RAPPROCHER` est dans la liste ; son acte vit chez `paiement`.
- **D-1003-2 — Évaluer compte comme instruire** pour SEP-01 et les cumuls 13 (l'ancienne table de la machine le
  faisait déjà : l'évaluation est un acte d'instruction).
- **D-1003-3 — Affecter puis valider est permis** : le responsable affecte et valide ; l'affectation ne compte que pour
  le cumul 16 (lever un blocage fraude), qui attend les revues de fraude.
- **D-1003-4 — Émettre n'est plus interdit à celui qui a instruit** : l'ancienne table l'interdisait (17 après 5 ou 7),
  FR-7 ne le liste pas (SEP-02 : « celui qui décide ne paie pas »). La règle suit le PRD.
- **D-1003-5 — Le niveau 1 est signé par `RESP`, `DT` ou `DG`** (une délégation supérieure couvre l'inférieure) ;
  FR-8 ne nomme que le responsable.
- **D-1003-6 — Le cumul anti-fractionnement (SEP-03) est, aujourd'hui, le montant évalué du dossier** : les montants
  acceptés et ordonnés non annulés viendront avec les offres et les ordres.
- **D-1003-7 — Au-delà du niveau 1, la validation est refusée à tout signataire seul** : la séance du comité (quorum,
  votes, procès-verbal, visa du directeur technique, FR-79) est une story à venir. Le refus le dit (instance `COMITE`).
- **D-1003-8 — Le contrôle du niveau 1 pose le constat `CONTROLE_ABSENT`** (nom de la condition de la table : remplie
  quand le contrôle est fait).

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#14** (`dev` `4473e07`), fusionnée en « Rebase and merge » :

- `src/modules/sinistres/partie/` : la liste fermée des actes de partie (FR-29), lus dans l'historique ; les cumuls
  interdits en paramètre figé (`separation-2026.1`) ; la vue du dossier liste ses parties.
- `src/modules/sinistres/delegation/` : la matrice de délégation, paramètre daté (`delegation-2026.1`, valable du
  2026-11-17), lue par la machine à la validation (10a) ; l'ancienne table de séparation codée en dur disparaît.
- La commande `CONTROLER` (`POST …/dossiers/{id}/controle`) ; le cumul 7 refusé à l'affectation.
- **Node 24** : 929 unitaires sur vrai MongoDB, 19 e2e ; lint 0, build vert. ⚠️ Au premier passage, 20 tests du
  dépôt MongoDB ont échoué (le fichier a mis 862 s) ; rejoués, 136/136 en 70 s sur ce fichier, puis toute la suite
  verte en 93 s : lenteur de l'environnement, non reproduite.
- **Pile `grp-c-1003`** (`sinistres`, IdP de test) :
  - cumul 7 : le responsable qui s'attribue un dossier → 409 `SEPARATION_DES_TACHES` (cumul `7`) ; contrôle hors
    validation → 409 `CONTROLE_IMPOSSIBLE` ;
  - A (395 500, niveau 1) : valider sans contrôle → 409 `CONTROLE_ABSENT` ; l'instructeur contrôle → 409
    `SEPARATION_DES_TACHES` (`1-controle`) ; un second responsable contrôle → `CONTROLE_ABSENT` posé ; ce contrôleur
    valide → 409 `SEPARATION_DES_TACHES` (`1-validation`) ; le responsable qui a affecté valide → validation acquise ;
    parties : `resp-1` [affecter, valider], `GEST-05` [instruire, évaluer], `resp-2` [contrôler] ;
  - B (1 500 000) : le responsable, puis le DG seul → 403 `DROIT_INSUFFISANT`, niveau `COMITE` nommé ; contrôle du
    niveau 1 → `CONTROLE_IMPOSSIBLE` ;
  - piste intègre ; `CONTROLE_ABSENT` posé par la commande seule ; 0 erreur au journal. Les constats des étapes dont la
    commande n'existe pas encore (pièces, montant évalué, expertise, garantie, complément) sont posés en base par la
    preuve, et nommés.
- **Rejouée sur l'image reconstruite depuis `dev`** (`4473e07`, pile `grp-c-1003d`) : même issue, 0 erreur.

**Reste** : la séance du comité (quorum, votes, procès-verbal, visa du DT, FR-79) ; le cumul anti-fractionnement sur
les montants acceptés et ordonnés (avec les offres et les ordres) ; les neuf cumuls qui attendent leur objet (5, 6, 8,
9, 10, 11, 12, 15, 16 : `horsPerimetre` du paramètre) ; la suppléance datée (FR-78) ; les limites de provision par
rôle ; les délégations réelles de la compagnie (H-014, à la séance d'immersion).
