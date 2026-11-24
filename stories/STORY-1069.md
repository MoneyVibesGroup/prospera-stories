# STORY-1069 : `sinistres.evaluation.arretee@1` publié — l'évaluation arrêtée part au contrat, dans la transaction de l'arrêt

Status: in-progress

**Épic :** EPIC-207 (instruire le dossier) et EPIC-212 (l'échange avec le logiciel de la compagnie, pour le consommateur) ;
FR-75 (une évaluation arrêtée n'est jamais recalculée ; les cinq montants), FR-73 (le montant arrêté est au franc) ·
**Dépôts :** `prospera-plateforme` (`contrats/assurance/sinistres/`, `classification-sante/`, par `_wt-d-plateforme`),
`prospera-sinistres-service` (module `sinistres`) ; `prospera-liaison-assureur-service` (le consommateur, resté à C)
**ne change pas** · **Plage :** groupe D, n° 5 du lot 6 (`PLAN-LOT-6-2026-11-23.md` §6), deuxième story d'assurance de D
(D-L6-3). **Dépend de :** STORY-1013 (l'évaluation arrêtée), 1016 (la proposition d'alignement dans la même transaction),
1015 (le patron d'un fait d'acte de `sinistres` : `garantie.decidee@1`), livrées par C ; 1068 (D). **Suivante :**
STORY-1070 (lever une alerte bloquante, D-1013-10).

**Sources :** le reste de C, **D-1013-9** (« pas de fait `sinistres.evaluation.arretee@1` : contrat neuf exclu par la
règle de légèreté, écart nommé ») et D-1016-9 (inchangée en 1016) ; spine assurance **AD-16** (le fait est au catalogue de
`sinistres` ; **`liaison-assureur` le consomme** ; « le fait spécifique d'un acte est écrit dans la même transaction que le
`.changed` avec la même version » ; aucun texte libre, aucune donnée personnelle ni de santé), AD-11 (la provision est
à `assurance`) ; manifeste `sinistres` (C5 : `sinistres.evaluation.arretee@1` déjà déclaré en `publie`) ; PRD annexe C,
**C-14** (évaluation et provision : montant évalué, montant validé, provision avant et après, motif codé, garantie
retenue, franchise appliquée, auteur ; Prospera → LC, « à chaque changement validé ») ; fiche 1015 (schéma fermé, champs
classés, Ajv strict, copie à l'octet par empreinte) ; « Pièges rencontrés » de C (Ajv `strictRequired`, empreinte du
manifeste) et de D.

## « Fini quand » (D-1069-1)

Le plan du lot 6 ne le fixe pas (§6, ligne 5). Retenu : **chaque arrêt d'évaluation accepté (premier ou correction)
publie un seul `sinistres.evaluation.arretee@1`, dans la transaction de l'arrêt, juste après le `sinistres.dossier.changed@1`
et à sa version (`versionObjet` = `versionEtat`), avant la proposition de provision s'il y en a une ; un arrêt refusé ou
rejoué n'en publie aucun ; le schéma est dans `prospera-plateforme` (fermé, chaque champ classé, BACKWARD), enregistré
dans Karapace et accepté par la garde `classification-sante` ; prouvé sur une pile `grp-d` (le fait lu sur Kafka, valide
au schéma du registre, dans l'ordre), puis rejoué sur l'image d'`origin/dev`.** Le consommateur (`liaison-assureur`,
l'envoi C-14) n'est pas dans cette story : il est à C (D-1069-8).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | ⛔ **Le fait est au contrat** : `contrats/assurance/sinistres/evaluation.arretee.schema.json` (draft-07, `title` = topic, fermé), chaque champ classé au registre `classification-sante` (module `sinistres`) ; copie à l'octet dans `sinistres` (empreinte notée) ; le fait construit par le service est valide en Ajv strict ; un motif écrit, le décompte, la nature corporelle, un montant nul ou décimal, un rôle qui n'évalue pas sont refusés | tests de contrat de la plateforme ; invariant de fait du service ; mutation du registre |
| AC-2 | ⛔ **Un arrêt accepté, un fait, dans la même transaction, à la même version** : ordre `dossier.changed` → `evaluation.arretee` → `provision.revisee` (s'il y a lieu) ; `versionObjet` = `versionEtat` du `dossier.changed` = version du dossier après l'arrêt ; une correction publie un fait de plus, au rang suivant, à une version plus haute | tests de service (mémoire et MongoDB réel) ; mutations |
| AC-3 | ⛔ **Rien pour un arrêt refusé ou rejoué** : montant nul, motif manquant, version périmée, même clé : aucun fait de plus | tests de service ; mutations |
| AC-4 | ⛔ **Aucun texte libre ni contenu sensible ne voyage** : ni le motif écrit, ni le décompte détaillé (lignes), ni le formulaire, ni le renvoi au barème corporel ; le `dossier.changed` reste sans montant ; la provision n'y est pas (elle est à `assurance`, AD-11) | tests de service ; schéma fermé ; pilote |
| AC-5 | **Ce que le fait porte** : `dossierId`, `reference` (et `numeroOfficiel` s'il existe), `versionObjet`, `rang`, `montant` (au franc), `devise`, `auteurId`, `roleExerce` (GEST, GREC, RESP), `arreteeLe`, `survenuLe` ; avec un décompte : `tableVersion`, `tableDeVetusteVersion` (automobile), `franchiseRetenue` ; un arrêt corporel n'a ni table ni franchise | invariant ; tests de service |
| AC-6 | **Sur pile** : le schéma enregistré dans Karapace (sujet neuf, BACKWARD) et accepté par la garde `classification-sante` ; le topic créé au démarrage ; le fait relayé sur Kafka, valide au schéma relu du registre, dans l'ordre de la transaction, clé = organisation ; la provision alignée par `assurance` (1016) et montrée au dossier (1068) ; outbox vide | pilote `grp-d` |
| AC-7 | Node 24 (étage `verification`) : unitaires sur MongoDB réel, e2e, lint, build ; plateforme sous Node 24 ; mutations rouges sur l'assertion | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1069-1 — « Fini quand »** : ci-dessus (le plan ne le fixe pas).
- **D-1069-2 — Le fait porte la version de l'évaluation et son montant, pas son contenu.** `rang` (la plus haute fait
  foi, une plus basse ne remplace jamais), `montant` au franc, `devise`, l'auteur et son rôle, les deux dates, et la
  version du dossier. Avec un décompte, la table, la grille de vétusté et la **franchise retenue** (C-14 : « franchise
  appliquée ») ; le décompte détaillé (lignes, paramètres, alertes) reste au dossier, lu par `GET …/evaluations`. Un fait
  ne porte que des clés, des états et des montants (AD-16, README des contrats d'assurance).
- **D-1069-3 — Le motif écrit ne voyage jamais** (texte libre, AD-16 : « motif codé, jamais de texte libre ») ; le C-14
  porte un motif **codé** (D.3.3), que `liaison-assureur` tire du mouvement de provision qu'il consomme déjà
  (`assurance.provision.changed@1`), pas de l'évaluation.
- **D-1069-4 — Ni la nature corporelle, ni le type de sinistre** : un arrêt corporel se reconnaît à l'absence de table ;
  le volet est déjà dans `dossier.changed@1`. Le registre `classification-sante` refuse tout champ de santé (vérifié par
  le test du registre, sur chaque schéma du dossier).
- **D-1069-5 — Même transaction, même version, ordre fixe** (AD-16) : le crochet `faits` de `ecrireUneCommande` (1015,
  1016) publie `evaluation.arretee` juste après `dossier.changed`, puis la proposition de provision. La clé de partition
  est l'organisation (celle de tous les faits de `sinistres`) : un consommateur lit l'état du dossier, l'acte, puis la
  proposition, dans cet ordre.
- **D-1069-6 — Tout arrêt accepté publie**, recours compris (le fait dit ce qui est arrêté ; c'est le consommateur qui
  choisit ce qu'il envoie au LC, comme pour la garantie, D-1015-8). Seule la proposition de provision dépend de
  l'ouverture (D-1016-4) et du volet (D-1016-5).
- **D-1069-7 — `devise`** : celle de la grille (`parametresDeLaProvisionDOuverture().devise`, `XOF`), la même que la
  proposition d'alignement (D-1016-2) ; le schéma l'écrit comme celui de la proposition (`^[A-Z]{3}$`).
- **D-1069-8 — Le consommateur est `liaison-assureur` (spine AD-16), tenu par C** : D ne touche pas ce dépôt
  (D-L6-3). La demande est écrite dans le journal de D (« → C », information) : consommer le fait pour l'envoi C-14, avec
  la provision avant et après d'`assurance.provision.changed@1`. `expertises` n'est **pas** un consommateur : l'annexe A
  du PRD le nommait, la spine (liste fermée) non ; la mission d'expertise (STORY-1071) dira si elle en a besoin, par un
  amendement de la spine.
- **D-1069-9 — Aucun manifeste ne change** : `sinistres.evaluation.arretee@1` est déjà en `publie` (C5) ; l'invariant
  `topics-publies` le vérifie. Le topic est créé par le relais de l'outbox au démarrage (liste `TOPICS_PUBLIES`).
- **D-1069-10 — L'origine des copies monte** : `contrat/ORIGINE-DES-SCHEMAS.json` passe au SHA de `prospera-plateforme`
  qui porte le schéma (les quatre autres schémas sont inchangés à l'octet, blobs vérifiés).
- **D-1069-11 — Ce qui reste** : le consommateur et l'envoi C-14 (C) ; le « montant validé » du C-14 attend
  `sinistres.decision.validee@1` ; la « garantie retenue » du C-14 n'est pas dans ce fait (elle se lit dans la police et
  la garantie qu'`assurance` et `liaison-assureur` tiennent) ; lever une alerte bloquante (STORY-1070) ; le chiffrage de
  l'expertise comme repère du motif (FR-61, STORY-1071).

## Contrat annoncé avant le code

Voir le journal de D, « ⚠ Contrats » (2026-11-24, STORY-1069) : un fait neuf (schéma au registre), son consommateur
nommé par la spine, l'ordre des faits de l'arrêt. Aucune route, aucun manifeste, aucune collection ne change.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan, règles, journaux de A, B, C, D (aucune demande neuve à D) ; fiches 1013, 1015, 1016, 1068 ; spine
  AD-16, annexe C (C-14).
- [x] Code : `prospera-plateforme` `MNV-1069` (681c9a0) ; `prospera-sinistres-service` `MNV-1069`.
- [ ] Preuves sans Docker (Node 25), annonce fusionnée avant le code.
- [ ] Sous le verrou : Node 24, Karapace, pile `grp-d`.
- [ ] PR de code fusionnées ; rejeu sur `origin/dev` ; PR de docs finale.
