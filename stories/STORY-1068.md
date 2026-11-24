# STORY-1068 : `sinistres` lit `assurance.provision.changed@1` — le dossier montre la provision en vigueur, celle du dernier mouvement effectif d'`assurance`

Status: in-progress

**Épic :** EPIC-215 (les contrats lus, la provision et les états techniques) ; FR-76 (« la dernière provision est la
dernière ligne »), FR-188, FR-75 (les cinq montants, chacun à sa source) · **Dépôt :** `prospera-sinistres-service`
(module `sinistres`) ; `prospera-assurance-service` **ne change pas** (il publie déjà le fait depuis STORY-994) ; aucun
schéma de `prospera-plateforme` ne change · **Plage :** groupe D, n° 4 du lot 6 (`PLAN-LOT-6-2026-11-23.md` §6),
**première story d'assurance de D** (D-L6-3 : dépôts repris de C). **Dépend de :** STORY-994 (la provision : `sinistres`
propose, `assurance` écrit et publie), STORY-1008 et 1016 (les propositions d'ouverture et d'évaluation), livrées par C.
**Suivante :** STORY-1069 (`sinistres.evaluation.arretee@1` publié, D-1013-9).

**Sources :** le reste de C, **D-1016-10** (« le dossier ne lit pas la réponse d'`assurance` : la provision effective
reste à lire par `sinistres`, `assurance.provision.changed@1`, reste de 994 ») ; D-994-1 (la lecture était renvoyée) ;
spine assurance **AD-11** (« `sinistres` n'affiche comme provision en vigueur que le dernier
`assurance.provision.changed@1` effectif »), AD-2, AD-9 (aucun appel synchrone), AD-16 (consommations : `sinistres`
consomme `assurance.provision.changed@1`, pas `a-valider`) ; manifeste `sinistres` (C5 : la consommation est déclarée ;
**C4** : « provision du dossier `NON_INSTALLE` (« provision non tenue ») » sans `assurance`) ; PRD annexe B, ligne 12
(qui lit la provision) et ligne 58 (« EXPE ne voit ni la provision ») ; « ⚠ Contrats » de C du 2026-11-18 (1016 : le
motif `EVALUATION` des trois faits ; un consommateur qui énumère les motifs doit l'accepter) ; contrat
`contrats/assurance/assurance/provision.changed.schema.json` (`prospera-plateforme@8ce4325`) ; code d'`assurance`
(`faits-provision.ts` : clé de partition = organisation, `sequence` = `versionEtat`).

## « Fini quand » (D-1068-1)

Le plan du lot 6 ne le fixe pas (§6, ligne 4). Retenu : **le dossier lu (`GET …/dossiers/{id}`) et ses évaluations
(`GET …/dossiers/{id}/evaluations`, `montants.provision`) montrent la provision du dernier
`assurance.provision.changed@1` effectif (plus haute séquence) ; une révision qui attend le `RESP` ne la change pas ; un
fait rejoué ou en retard ne la fait pas revenir en arrière ; lire un mouvement n'écrit rien au dossier ; prouvé sur une
pile `grp-d` où `sinistres` (branche) et `assurance` (`origin/dev`) partagent Kafka, puis rejoué sur les images
d'`origin/dev`.**

## Le découpage : ce que cette story prend

1. **Le consommateur** de `assurance.provision.changed@1` (groupe `sinistres-service.provision`, patron de STORY-990 et
   1004 : topic créé avant l'abonnement, `metadataMaxAge: 10_000`, relance avec recul, santé) et sa lecture du fait, qui
   n'invente rien ;
2. **le read-model** `sinistres_provisions_en_vigueur` : par dossier, le fait de plus haute séquence ;
3. **la vue** : `provision` au dossier lu, `montants.provision` aux évaluations, avec les droits (annexe B) et
   l'installation d'`assurance` (C4).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan, règles, journaux de A, B, C, D (aucune demande neuve à D pour l'assurance ; la passation de C,
  D-L6-3, constatée : voir le journal de D, « Passations ») ; fiches 994, 1008, 1013, 1016 ; spine AD-11, AD-16.
- [x] Code : `prospera-sinistres-service` `MNV-1068` (ffd6cd5, 14790a4) ; PR **#29** ouverte.
- [x] Preuves sans Docker (Node 25) : 1161 unitaires (seules les 5 attendues du client natif rouges), lint, `tsc` ;
  mutations 12/12. Annonce « ⚠ Contrats » : cette PR de docs, fusionnée avant le code.
- [x] Sous le verrou (pris à 11:29) : Node 24 (étage `verification`) lint, 1328/1328 unitaires sur MongoDB et Redis
  réels, 33 e2e, build, mutations MongoDB 4/4 ; `docker compose up` sain ; pilote 27/27 sur pile `grp-d`.
- [ ] PR de code fusionnée en rebase ; rejeu sur les images d'`origin/dev` ; PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | ⛔ **Le fait est lu au contrat** : copie à l'octet de `provision.changed.schema.json` (empreinte notée dans `contrat/ORIGINE-DES-SCHEMAS.json`) ; un fait valide est lu pour chacun des dix motifs (dont `EVALUATION`, 1016) ; un fait hors contrat (séquence nulle, montant négatif ou décimal, motif inconnu, devise, référence, date, enveloppe) est **écarté entier**, jamais complété ; la liste des motifs du contrat égale celle du service | spec (contrat + `provisionDuFait`) ; mutations |
| AC-2 | ⛔ **La plus haute séquence gagne** par `(organisation, dossier)` : un rejeu, un doublon ou un fait en retard ne fait jamais revenir une provision dépassée ; des faits concurrents donnent la plus haute ; un champ facultatif du mouvement précédent ne survit pas | spec, mémoire **et MongoDB réel** (course rendue déterministe) ; mutations |
| AC-3 | ⛔ **Le dossier montre la provision en vigueur** : `GET …/dossiers/{id}` gagne `provision`, `GET …/evaluations` remplit `montants.provision` (même forme) : `etat` `EN_VIGUEUR` avec montant, devise, séquence, montant avant, motif, origine, date d'effet (proposition, pièce s'il y a lieu) ; `SANS_MOUVEMENT` avant tout mouvement ; montant `null`, jamais 0, hors `EN_VIGUEUR` ; `tenueParAssurance` reste vrai | spec de service ; pilote |
| AC-4 | ⛔ **`sinistres` reste lecteur** (AD-11) : lire un mouvement n'écrit rien au dossier (ni version, ni piste, ni fait publié) ; une révision qui attend le `RESP` (`a-valider`) ne change pas la provision montrée ; acceptée chez `assurance`, la séquence suivante la remplace | spec ; pilote |
| AC-5 | **Les droits et l'installation** : seuls DG, DT, RESP, GEST, AUD lisent la provision (annexe B, ligne 12) — tout autre rôle reçoit `NON_LISIBLE`, sans apprendre si `assurance` est installé ; `assurance` absent ou retiré : `NON_INSTALLE` (C4), même si un mouvement a été reçu ; suspendu : la provision reste tenue | spec ; pilote (accueil, O2 sans `assurance`) |
| AC-6 | **Le consommateur tient sur une pile neuve** : premier mouvement vu au dossier en quelques secondes (topic créé avant l'abonnement, métadonnées à 10 s), un message illisible ou hors contrat écarté sans bloquer la partition, retard du groupe 0, santé 200 | pilote (latence chronométrée) |
| AC-7 | Node 24 (étage `verification`) : unitaires sur MongoDB réel, e2e, lint, build ; `docker compose up` sain (un module Nest change de câblage) ; mutations rouges sur l'assertion | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1068-1 — « Fini quand »** : ci-dessus (le plan ne le fixe pas).
- **D-1068-2 — Un read-model à part, pas un champ du dossier.** La provision est une copie dérivée des faits
  d'`assurance` (`sinistres_provisions_en_vigueur`, une ligne par dossier), jamais écrite par une commande : le dossier ne
  gagne ni version, ni ligne de piste, ni `sinistres.dossier.changed@1` quand un mouvement arrive. L'écrire au dossier
  ferait de `sinistres` un second écrivain apparent de la provision (AD-11) et rendrait `ETAT_PERIME` les commandes en
  cours à chaque mouvement. Différent du numéro officiel (STORY-992, copié au dossier une fois) : la provision change
  souvent.
- **D-1068-3 — Un champ `etat` à côté de `montant` et `tenueParAssurance`** (ajout seul ; les deux champs d'avant gardent
  leur sens) : `EN_VIGUEUR`, `SANS_MOUVEMENT`, `NON_INSTALLE` (C4 du manifeste), `NON_LISIBLE`. L'installation
  d'`assurance` se lit dans l'état publié du moteur : **`assurance` devient un voisin suivi**, comme `reseau` (D-1004-2) ;
  `assurance-service` n'est jamais appelé (AD-9).
- **D-1068-4 — Qui lit la provision : DG, DT, RESP, GEST, AUD** (annexe B, ligne 12 : « Réviser la provision du
  dossier » : L, L, D, É, et L pour AUD). `GREC` et le comité lisent les évaluations mais pas la provision (le recours n'a
  pas de charge au dossier, D-1008-2) ; EXPE, EXPI, MED, ACC, NUM, ARCH, CPT, ADMIN non plus. Un rôle qui ne lit pas la
  provision n'apprend rien, pas même l'installation d'`assurance` (les droits avant l'installation).
- **D-1068-5 — La clé est le `dossierId` du fait** (l'identifiant de `sinistres`, porté à côté de la référence par
  `assurance`, D-994-2) ; **la plus haute `sequence`** gagne (égalité : ignorée) ; un mouvement dont la référence n'est
  pas celle du dossier n'est jamais montré (`SANS_MOUVEMENT`). Les faits d'une organisation partagent une partition (clé
  = organisation) : l'ordre est déjà celui d'`assurance`, la séquence protège le rejeu et le retard.
- **D-1068-6 — `assurance.provision.a-valider@1` n'est pas consommé** : la liste fermée des consommations de la spine
  (AD-16) ne le donne pas à `sinistres`. « En attente du `RESP` » ne se voit donc pas encore au dossier ; il se lit chez
  `assurance` (`GET /api/v1/assurance/provisions/{reference}`, `propositions`). L'ajouter demande d'amender la spine :
  reste nommé.
- **D-1068-7 — Aucun schéma ne change ; `assurance` n'est pas touché.** La copie du contrat consommé entre dans
  `contrat/consommes/` (copie à l'octet de `prospera-plateforme@8ce4325`, blob inchangé jusqu'à `50c12a6`), et un test
  vérifie que sa liste de motifs égale celle du service (un motif ajouté au contrat sans le service écarterait des
  mouvements effectifs).
- **D-1068-8 — Un fait illisible ou hors contrat est écarté entier** (journalisé, jamais une provision devinée) ; il ne
  bloque pas la partition (le rejouer ne le rendrait pas lisible) — patron de `lireProposition` côté `assurance`.
- **D-1068-9 — `assurance` suspendu compte comme installé** (la provision reste tenue, comme `reseau` en 1004) ; retiré
  ou inconnu : `NON_INSTALLE`, même si un mouvement a été reçu avant (« provision non tenue »).
- **D-1068-10 — Sans lecteur câblé** (bancs de test qui ne la prouvent pas), la vue rend `NON_INSTALLE`, jamais un
  montant ; le module câble la lecture (`app-cablage` et `app.module` le vérifient sous Node 24).
- **D-1068-11 — Ce qui reste** : « en attente du `RESP` » au dossier (D-1068-6) ; `expertises` consomme aussi ce fait
  (spine, le budget de la mission) : avec FR-61 (STORY-1071) ; la liste « à revoir » côté `sinistres` ; un écran.

## Contrat annoncé avant le code

Voir le journal de D, « ⚠ Contrats » (2026-11-24, STORY-1068) : routes changées par ajout (`provision`,
`montants.provision`), groupe de consommateurs neuf, collection neuve, `assurance` voisin suivi. Aucun schéma de fait,
aucun manifeste, aucun autre dépôt ne change.
