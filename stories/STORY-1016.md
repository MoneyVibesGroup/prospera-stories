# STORY-1016 : l'arrêt de l'évaluation propose la provision (FR-76)

Status: done

**Complexité :** petite à moyenne (un motif dans trois contrats, une proposition dans la transaction de l'arrêt, un motif de plus chez `assurance`)

**Épic :** EPIC-215 (la provision) pour le motif et la lecture chez `assurance`, EPIC-207 (instruire le dossier) pour l'arrêt
**Dépôts :** `prospera-plateforme` (dossiers de C, `contrats/assurance/`), `prospera-sinistres-service`, `prospera-assurance-service`
**Porteur :** groupe C, n° 4 et dernier du lot 4 (`coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §5). Sans Docker pour le code
(le poste est tenu par FE-069) : la preuve Node 24 est un script prêt par dépôt, à jouer au retour de Docker.
Origine : D-1013-8 (« provision non réalignée à l'évaluation »). Ancrage : FR-76 (« à l'évaluation, la provision s'aligne
sur le montant évalué, avec une ligne distincte *provision réajustée à l'évaluation* »), FR-188, AD-11 (`sinistres`
propose, `assurance` écrit seul les mouvements), STORY-994 (la proposition, les mouvements, le seuil glissant).

---

## Pourquoi

1013 a livré l'évaluation arrêtée et a nommé un écart : la provision n'est pas réalignée, car la liste fermée des motifs
de provision (`MOTIFS_DE_PROVISION`, et l'énumération du fait `sinistres.provision.revisee@1`) n'a pas de motif
« évaluation ». Résultat : un dossier évalué à 395 500 FCFA garde une provision d'ouverture de 600 000 jusqu'à ce qu'un
gestionnaire pense à la réviser à la main. FR-76 veut que l'arrêt de l'évaluation **propose** l'alignement.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | ⛔ **Le motif `EVALUATION` existe** dans la liste fermée des trois faits (`sinistres.provision.revisee`, `assurance.provision.changed`, `assurance.provision.a-valider`) et dans `MOTIFS_DE_PROVISION` des deux services ; **compatible en arrière** (un message d'avant reste valide ; le motif reste obligatoire ; la liste reste fermée) | test de contrat dans `prospera-plateforme` ; invariant de fait des deux services (copie à l'octet par empreinte) |
| AC-2 | ⛔ **Arrêter l'évaluation propose la provision au montant arrêté**, motif `EVALUATION`, dans la **même transaction** que l'état du dossier (outbox) ; le montant est celui du gestionnaire, au franc, jamais le repère du décompte ; l'auteur et son rôle sont portés | test de service (deux faits, dans l'ordre, une écriture) ; mutation |
| AC-3 | ⛔ **`assurance` reste le seul écrivain des mouvements** : `sinistres` n'écrit aucun mouvement ni montant de provision (la provision d'ouverture du dossier n'est pas touchée ; `montants.provision` reste « tenue par assurance ») ; `assurance` pose la ligne distincte (avant, après, motif `EVALUATION`), sans écraser | test de service des deux côtés |
| AC-4 | **Le seuil glissant s'applique** : un alignement d'écart supérieur ou égal à 2 000 000 FCFA proposé par un gestionnaire attend le `RESP` (FR-76) ; même montant : `MONTANT_INCHANGE`, rien n'est écrit | test de service d'`assurance` |
| AC-5 | **Une version d'évaluation, une proposition** : corriger l'évaluation propose une fois de plus (identifiant dérivé de la version) ; rejouer une commande (même clé) n'en propose pas une seconde ; un arrêt refusé ne propose rien | tests de service |
| AC-6 | **Sans provision ouverte, rien ne part** et l'arrêt réussit ; la piste d'audit dit pourquoi (`provision non proposée (PROVISION_NON_OUVERTE)`) ; un recours ne se provisionne pas | tests purs et de service |

## Décisions retenues par défaut (contestables)

- **D-1016-1 — Le motif entre par la liste fermée des trois faits, pas par un champ de plus.** D-1013-8 parlait d'un
  « ajout facultatif BACKWARD » : c'est une valeur de plus dans l'énumération existante (`motif` reste obligatoire), donc
  un message d'avant reste valide. Les deux faits d'`assurance` portent aussi le motif du mouvement : sans lui, le premier
  alignement ferait rejeter `provision.changed` par le registre. Aucun champ neuf, aucune version `@2`.
- **D-1016-2 — Le montant proposé est le montant arrêté**, au franc, recopié. C'est la valeur que FR-76 et la démo
  (l. 80 : « provision réajustée à 395 500 ») alignent ; le repère du décompte n'est jamais proposé.
- **D-1016-3 — Un identifiant par version : `evaluation-<dossierId>-<rang>`.** Dérivé comme `ouverture-<dossierId>` (D-1008-6) ;
  `assurance` déduplique par l'identifiant du fait (eventId) et par la proposition.
- **D-1016-4 — Rien ne part sans provision ouverte (`provisionOuverture` absent).** L'arrêt n'ouvre pas la provision
  (c'est l'ouverture, FR-49, par la machine ou à la main) ; une proposition sans ouverture serait rejetée `PAS_OUVERTE`
  par `assurance` et ferait du bruit. L'arrêt n'est jamais refusé à cause de la provision (comme l'ouverture, D-1008-7).
  Écart nommé : un corporel non ouvert à la main n'est pas aligné.
- **D-1016-5 — Un recours ne se provisionne pas** (D-1008-2 : le volet `RECOURS` n'a pas de charge au dossier).
- **D-1016-6 — Le corporel propose aussi.** À l'ouverture, la machine ne calcule pas de provision corporelle (FR-71) ; ici le
  montant est celui que le gestionnaire a arrêté : aucune valeur produite par la machine.
- **D-1016-7 — Rôle du fait : `RESP` s'il arrête, sinon `GEST`** (`roleDeLaProposition`, D-1008-3) : `GREC` propose comme
  `GEST`, donc le seuil glissant s'applique à lui. Le schéma de 994 n'admet que ces deux rôles.
- **D-1016-8 — Un crochet `faits` dans l'écriture d'une commande** (`ecrireUneCommande`) : les faits propres à la commande
  partent dans la même transaction que l'état du dossier. Même texte que celui de STORY-1015 (garantie décidée) pour
  que les deux PR se rebasent sans conflit de fond.
- **D-1016-9 — Pas de fait `sinistres.evaluation.arretee@1`** (D-1013-9 inchangée) : l'évaluation reste une donnée du dossier ;
  seule la proposition de provision, déjà au contrat, part.
- **D-1016-10 — Le dossier ne lit pas la réponse d'`assurance`.** La provision effective (ou « en attente du `RESP` ») reste
  à lire par `sinistres` (`assurance.provision.changed@1`, reste de 994) ; l'arrêt ne dit pas si l'alignement a été retenu.

## Hors story

- Lire `assurance.provision.changed@1` côté `sinistres` pour afficher la provision en vigueur (reste de 994).
- Le report de revue et l'écart de 15 % avec l'estimation de référence (EPIC-208, expertise).
- Un bouton « aligner la provision » côté écran, et le cas d'un corporel jamais ouvert.

## Preuves attendues (règles des groupes)

Tests unitaires sur banc mémoire des deux services et test de contrat de la plateforme, mutation d'un AC clé, lint des
fichiers touchés, `tsc --noEmit` ; Node 24 (étage `verification`) rejoué par script au retour de Docker, puis depuis
l'export d'`origin/dev` après fusion. Aucune pile : aucun module Nest ne change de câblage.

## Ce qui a été livré

**2026-11-18** — trois PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#35** (`dev` `8ce4325`) : le motif `EVALUATION` dans `sinistres.provision.revisee`, `assurance.provision.changed`
  et `assurance.provision.a-valider` ; 6 tests de contrat de plus (116/116).
- `prospera-assurance-service` **#26** (`dev` `8dc3285`) : `MOTIFS_DE_PROVISION` ; la proposition est lue, jugée au seuil
  glissant (2,5 M par un `GEST` : `EN_ATTENTE_RESP`), `MONTANT_INCHANGE`, `PAS_OUVERTE` ; copies du contrat à l'octet.
- `prospera-sinistres-service` **#28** (`dev` `ea1a111`, après STORY-1015 `87e0074`) : `provision-evaluation.ts` (pur), le
  crochet `faits` de `ecrireUneCommande` (même texte que 1015), la proposition dans la transaction de l'arrêt, piste
  d'audit « provision proposée (id) » ou « provision non proposée (raison) ».
- **Tests** : sinistres 6 purs + 6 de service (deux dépôts) + 1 d'invariant de contrat ; assurance 3 de service ;
  mutations (`provisionOuverte` forcé à vrai : 3 rouges ; `EVALUATION` retiré de la liste d'assurance : 3 rouges).
- **Node 24** (étage `verification`, image depuis `git archive`) : plateforme 116/116, typecheck 0 ; assurance lint 0, 127
  suites / 2392 tests, 12 suites / 367 e2e, build 0 ; sinistres lint 0, 1306 unitaires sur MongoDB réel, 33 e2e, build 0.
  Un test du banc MongoDB (STORY-1003, « réaffecté reste partie ») a rougi au hasard dans la suite complète, sans lien avec
  la story ; le fichier rejoué seul en `-w 1` : 238/238. `docker compose up` de `sinistres` (le crochet `faits` change le
  câblage) : healthy, `/api/v1/health` 200. Les dev rejoués : diff vide entre `origin/dev` et les branches vérifiées.

**Reste** : lire `assurance.provision.changed@1` côté `sinistres` (provision en vigueur sur le dossier, D-1016-10) ; le
corporel jamais ouvert n'est pas aligné (D-1016-4) ; le report de revue et l'écart de 15 % (expertise).

