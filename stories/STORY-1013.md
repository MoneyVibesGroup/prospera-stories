# STORY-1013 : une évaluation arrêtée n'est jamais recalculée

Status: done

**Complexité :** moyenne (une commande d'écriture, une lecture, un instantané du décompte, deux tables figées à la survenance)

**Épic :** EPIC-207 (instruire le dossier)
**Dépôt :** `prospera-sinistres-service` (module `sinistres`, dossier `evaluation/`) ; une route de lecture au manifeste `sinistres` ; aucun fait neuf
**Plage :** groupe C, n° 10 et dernier du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1010 (le décompte) et 1012 (la grille de vétusté).
Ancrage : FR-75 (une évaluation arrêtée n'est jamais recalculée ; les cinq montants), FR-55 (modifier le formulaire après l'arrêt n'altère pas l'évaluation), FR-73 (le montant arrêté est au franc), FR-29 (partie « évaluer »).

---

## Pourquoi

1010 a livré le décompte et renvoyé ici la commande « arrêter l'évaluation » (D-1010-1) ; 1012 a ajouté une grille de vétusté à part (D-1012-1) et dit que 1013 garderait les deux versions. Sans cette story, `montantEvalue` n'est écrit par aucune commande, la condition `MONTANT_EVALUE` de la transition 7 ne peut jamais être remplie par l'application, et rien ne protège un montant arrêté d'un barème ou d'un formulaire qui change ensuite : le même dossier donnerait deux montants selon le jour où on le relit.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | ⛔ **Arrêter l'évaluation écrit le montant du gestionnaire, au franc, avec le décompte du moment** (ses lignes, la table du décompte et la grille de vétusté) ; le montant devient `montantEvalue`, la transition 7 passe ensuite | test de service (deux dépôts) ; la transition 7 refusée `MONTANT_EVALUE` avant, acceptée après |
| AC-2 | ⛔ **Les tables se jugent à la date de survenance, jamais à celle de l'arrêt** : une table publiée ensuite, ou qui n'entre en vigueur qu'après le sinistre, ne change pas l'évaluation | tests purs et de service ; mutation (table choisie à une autre date) |
| AC-3 | ⛔ **Un changement de table ne modifie pas une évaluation arrêtée** : la lecture rend ce qui a été écrit (`toEqual` avant/après publication), et la correction suivante prend la table de la survenance | test de service |
| AC-4 | ⛔ **Modifier le formulaire après l'arrêt n'altère pas l'évaluation** (FR-55) | test de service |
| AC-5 | **Corriger, c'est arrêter une nouvelle version, avec motif** ; l'ancienne reste lisible, intacte ; la dernière fait foi ; permis en `EN_INSTRUCTION` et `EVALUE`, refusé ensuite (`EVALUATION_IMPOSSIBLE`) | tests de service ; mutation (écraser au lieu d'ajouter) |
| AC-6 | **Le montant est celui du gestionnaire, jamais le repère d'office** : un écart au décompte exige un motif (`MOTIF_ECRIT`), un montant nul `MONTANT_EVALUE`, non entier ou démesuré `MONTANT_INVALIDE` | tests purs et de service |
| AC-7 | ⛔ **Cinq montants distincts** : l'évaluation, la provision, l'offre, le règlement et le recours ont chacun leur source ; arrêter l'évaluation ne touche ni la provision proposée à `assurance`, ni aucun autre, et ne publie que `dossier.changed@1` | tests purs et de service (faits comparés avant et après) |
| AC-8 | **Une commande d'écriture comme les autres** : rôle (GEST, GREC, RESP), portée (1004), idempotence, version lue, refus tracé, piste chaînée, partie « évaluer » (1003) | test de service ; e2e HTTP ; invariant de route |

## Décisions retenues par défaut (contestables)

- **D-1013-1 — Une commande à part, avant la transition 7.** La condition `MONTANT_EVALUE` lit `montantEvalue` : le montant s'écrit donc avant `EN_INSTRUCTION → EVALUE`, par `POST …/dossiers/{id}/evaluations`, sans toucher à la table figée des transitions. La transition 7 reste celle de la machine (pièces, expertises, garantie, montant).
- **D-1013-2 — Le montant est obligatoire et jamais écrit d'office** (FR-73, FR-75). Entier de francs, supérieur à zéro, au plus `montantMax` de la table ; jamais arrondi.
- **D-1013-3 — Le décompte se calcule UNE fois, à l'arrêt, et se copie.** L'évaluation porte les cinq lignes avec leur source et leurs paramètres, `tableVersion`, `tableDeVetusteVersion`, la date de survenance, la version du formulaire figée et le rang de l'enregistrement qui a servi. Aucune lecture ne rappelle `calculerLeDecompte` ; une écriture n'en réécrit aucune.
- **D-1013-4 — Les deux tables se jugent à la survenance du dossier.** `tableEnVigueur(survenuLe)` et `tableDeVetusteEnVigueur(survenuLe)`, jamais la date de l'arrêt. Une évaluation garde donc les deux versions (D-1012-1), et un test publie une table de plus pour le prouver.
- **D-1013-5 — Ajout seul, une version de plus par arrêt.** `evaluations[]` s'ajoute, la dernière fait foi et pose `montantEvalue` ; motif de 10 caractères au moins dès la version 2. Permis en `EN_INSTRUCTION` (y compris après une contre-proposition, transition 15) et en `EVALUE` ; au-delà, le montant est entre les mains de la validation : `EVALUATION_IMPOSSIBLE`.
- **D-1013-6 — Rôles GEST, GREC, RESP ; arrêter, c'est évaluer.** Les rôles de la transition 7 ; l'auteur devient partie « évaluer » (FR-29) sans changer le paramètre figé `separation-2026.1` : le code lit `evaluations[]` comme il lit déjà les enregistrements du formulaire pour « instruire » (D-1011-6) ; le cumul est jugé comme pour la transition 7.
- **D-1013-7 — Le motif se compare au décompte.** Le PRD parle du chiffrage validé par l'expertise ; aucune expertise n'existe encore (FR-61). Tant qu'il n'y en a pas, le repère est `indemniteCalculee`. Quand la mission d'expertise arrivera, le chiffrage validé s'ajoutera à la comparaison.
- **D-1013-8 — La provision n'est PAS réalignée ici (écart nommé).** FR-76 veut une ligne « provision réajustée à l'évaluation ». `assurance` reste le seul écrivain des mouvements (AD-11) et `sinistres` ne fait que proposer par `sinistres.provision.revisee@1` ; or la liste fermée des motifs (`MOTIFS_DE_PROVISION`) et le schéma du fait n'ont pas de motif « évaluation » : l'ajouter est un changement de contrat, exclu par la règle de légèreté. Arrêter l'évaluation ne propose donc rien (c'est ce que la preuve des cinq montants vérifie). À faire avec le contrat : motif `EVALUATION` au fait `provision.revisee@1` (ajout facultatif, BACKWARD) et la proposition dans la transaction de l'arrêt.
- **D-1013-9 — Pas de fait `sinistres.evaluation.arretee@1`.** Contrat neuf exclu par la règle de légèreté : écart nommé. L'évaluation est une donnée du dossier, jamais dans un fait ; seul `dossier.changed@1` part, sans montant.
- **D-1013-10 — Une alerte BLOQUANTE du décompte empêche l'arrêt** (`ALERTE_BLOQUANTE_NON_LEVEE`, FR-55, FR-75). La commande qui la lève avec un motif n'existe pas encore : tant qu'elle n'est pas écrite, un dossier en RC seule avec assuré fautif ne s'évalue pas (le montant serait de toute façon nul).
- **D-1013-11 — Pas de formulaire enregistré, pas d'évaluation** (`INSTRUCTION_NON_ENREGISTREE`) : le décompte est le repère, on n'arrête pas un chiffre sans lui. Un dossier sans type de sinistre : `TYPE_DE_SINISTRE_ABSENT`. Un décompte impossible (épave sans valeur d'épave, `DECOMPTE_IMPOSSIBLE`) ou incohérent (`DECOMPTE_INVALIDE`) est refusé, jamais remplacé par zéro.
- **D-1013-12 — Le dommage corporel s'arrête sans décompte** (FR-70) : accident du travail, décès, collision corporelle, RC avec dommage corporel. Le montant est celui du gestionnaire ; l'évaluation porte `renvoi: BAREME_CORPOREL`, sans table ni décompte ; la saisie poste par poste reste à l'épic corporel.

Cinq montants (FR-75) : `GET …/evaluations` rend `montants` = `evaluation` (arrêtée par `sinistres`), `provision` (tenue par `assurance` : `montant: null, tenueParAssurance: true`, `sinistres` ne connaît pas son montant), `offre`, `reglement`, `recours` (`null` : leurs stories ne sont pas écrites). Un montant qui n'existe pas est `null`, jamais zéro ni la valeur d'un voisin.

## Ce qui a été livré

**2026-11-17** — `prospera-stories` **#643** (manifeste, `main` 7bba9ca) puis `prospera-sinistres-service` **#24** (`dev` 4ce28c8 et a12c5c6, deux commits) :

- `src/modules/sinistres/evaluation/` : `evaluation.ts` (pur : `jugerLArret`, `montantsDuDossier`, `EvaluationArretee`), `evaluation.spec.ts` (16), `evaluation.invariant.spec.ts` (route de lecture déclarée, écriture non). Dossier : `evaluations[]` (schéma Mixed, lu et écrit par le dépôt Mongo). Service : `arreterLEvaluation` et `evaluations` ; routes `POST` et `GET /api/v1/sinistres/dossiers/{id}/evaluations` ; partie « évaluer » dans `partie.ts`. Manifeste `sinistres` : le GET en lecture seule (copie à l'octet, commit et empreinte `54d88ef8…` dans `sources-des-manifestes.ts`).
- **Tests** : 16 purs, 11 de service sur les deux dépôts (mémoire et MongoDB réel), 1 e2e HTTP, 2 d'invariant. Trois mutations (table choisie à une autre date, écraser au lieu d'ajouter, `montantEvalue` non posé) : chacune rougit sur l'assertion.
- **Node 24** (étage `verification`, image depuis `git archive`, MongoDB réel en jeu de répliques, `-w 2`) : lint 0, 1212 unitaires (60 suites + 1 sautée), 26 e2e, build 0. Rejeu depuis l'export d'`origin/dev` a12c5c6 : lint 0, 1212 unitaires, 26 e2e, build 0. Aucune pile : aucun module Nest ne change de câblage (plan : « Docker : non »).
- Premier jet de l'e2e : 500, la déclaration posée sans dates de réception faisait lever `vueDeLaDeclaration` ; corrigé (second commit).

**Reste**
- Réaligner la provision à l'évaluation (FR-76) : motif `EVALUATION` au fait `provision.revisee@1`, proposition dans la transaction de l'arrêt (D-1013-8).
- `sinistres.evaluation.arretee@1` si un consommateur en a besoin (D-1013-9).
- Lever une alerte bloquante avec motif (D-1013-10) ; le chiffrage validé par l'expertise comme repère du motif (D-1013-7, FR-61).
- La route et l'écran « Pourquoi ce montant ? » (FR-74) lisent `GET …/evaluations` ; la saisie du corporel poste par poste (FR-70).
