# STORY-1049 : les garde-fous de la commande — paramètres figés à l'acte, plafond de crédit, squelette de la saga

Status: in-progress

**Épic :** EPIC-225 (les garde-fous, l'encours, le plafond de crédit et la saga de réservation) · **Dépôt :**
`prospera-ventes-service` (module `commande`, tenu par D) · **Plage :** groupe D, n° 5 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** STORY-1047, faite (`prospera-plateforme` `dev` b061cec,
étiquette `encours-v1`). **Premier consommateur d'`encours-v1`.** **Suivante :** STORY-1050 (les dettes de
`reseau-service`) ; la commande elle-même (saisie, validation, numéro `BL-`) est STORY-1056.

**Sources :** spine distributeur AD-3 (ordre des contrôles de la validation), AD-4 (clé d'idempotence), AD-8 (la
réservation par ligne de bon, `STOCK_NON_INSTALLE`), AD-9 (l'encours, le plafond, le verrou par tiers, le crédit
bloqué, la dérogation), AD-12 (les garde-fous : paramètres versionnés par organisation, figés à l'acte), AD-21 (piste
d'audit), AD-22 (montants entiers, horloge), AD-34 (la saga de réservation), conventions (`<code>_parametres`, codes
de refus) ; PRD distributeur FR-13, FR-31, FR-33, FR-34, FR-52, FR-187, FR-189, FR-203, FR-220 ; EPIC-225 (« fini
quand ») ; manifeste `commande` (C4 : sans `paiement`, « la commande à crédit est refusée, garde-fou financier non
vérifiable ») ; STORY-1047 (D-1047-1 → 12, Q-D-4).

## Pourquoi

`commande` est le module qui **juge** le crédit (AD-9) : `pdv` affiche, `recouvrement` évalue, `commande` refuse. La
bibliothèque d'encours existe (1047) mais personne ne la joue ; aucun garde-fou n'a encore de paramètre, et rien ne
garantit qu'une règle appliquée plus tard lise le seuil qui valait au moment de l'acte. Cette story pose, dans
`commande`, les trois pièces que la commande (1056) assemblera : les paramètres figés à l'acte, le jugement du plafond
sur l'encours, et l'enchaînement de la saga de réservation, sans transaction entre services.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Paramètres versionnés par organisation** (AD-12) : `commande_parametres`, un document par version, en ajout seul (date d'effet, auteur, motif) ; les valeurs de la démo par défaut ; changer est réservé, tracé dans `commande_audit` (avant, après, motif) ; un changement concurrent ou fondé sur une version périmée est refusé (`PARAMETRES_VERSION_PERIMEE`) ; des valeurs hors bornes sont refusées (`PARAMETRES_INVALIDES`) | MongoDB réel ; HTTP |
| AC-2 | **Figés à l'acte** : l'acte de validation enregistre la `parametresVersion` qu'il a utilisée (et la révision du plafond lu) ; relu après un changement de paramètres, il rend **les valeurs de sa version**, pas les nouvelles | MongoDB réel ; pile `grp-d` |
| AC-3 | **Le plafond de crédit, jugé par la bibliothèque copiée** : `encours/src/index.ts` et `vecteurs-or.json` copiés à l'octet à `encours-v1`, empreintes figées par un test, les dix vecteurs d'or rejoués ; plafond 1 000 000, une commande de 600 000 passe, la seconde est refusée `PLAFOND_CREDIT_DEPASSE` (seuil, encours, dépassement et moyen de le lever dans le refus) ; l'égalité passe ; un encaissement déclaré n'ouvre pas de crédit (Q-D-4) | unitaires ; MongoDB réel ; pile `grp-d` |
| AC-4 | **Le verrou par tiers** (AD-9) : jugement et incrément de l'engagement sont atomiques ; deux validations simultanées de 600 000 sous un plafond de 1 000 000 : une passe, l'autre est refusée `PLAFOND_CREDIT_DEPASSE` | MongoDB réel |
| AC-5 | **Fail-closed, jamais un zéro muet** : sans la Créance (B-963, B-965 pas encore là), les sources `creances` et `creditsTiers` sont `ABSENTE` et la commande à crédit est refusée `ENCOURS_NON_INSTALLE` (les sources absentes nommées) ; sans plafond connu du tiers, `PLAFOND_INCONNU` ; plafond suspendu, `CREDIT_BLOQUE` avant tout autre contrôle ; sans `stock` en service, `STOCK_NON_INSTALLE` ; un refus n'écrit rien | unitaires ; MongoDB réel ; pile `grp-d` |
| AC-6 | **Le squelette de la saga** (AD-34) : une transaction locale écrit l'acte, les bons `EN_ATTENTE_RESERVATION` et l'engagement, puis `stock` est appelé par ligne de bon (clé `<bonId>:<ligne>`) ; un refus ou une panne laisse la ligne en attente avec son motif, sans compensation ; la reprise rejoue les seules lignes en attente ; un crash entre la réservation et l'écriture de son issue se rattrape par la reprise, sans double réservation | MongoDB réel |
| AC-7 | **Rejeu sans effet** (AD-4) : `Idempotency-Key` exigée ; même clé et même charge, même acte, l'engagement n'est compté qu'une fois ; même clé, autre charge, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` | MongoDB réel |
| AC-8 | **Mutations** rouges sur une assertion ; Node 24 ; `docker compose -p grp-d up` : le service démarre, `PLAFOND_CREDIT_DEPASSE` sur un appel réel, les paramètres figés d'un acte ne bougent pas après un changement | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1049-1 — Les paramètres de `commande`, et eux seuls.** AD-12 donne un propriétaire à chaque garde-fou : le
  plafond, sa formule par défaut `max(400 000, 0,6 × CA mensuel)` et le plafond de première commande sont à `pdv`, les
  seuils de retard à `recouvrement`. `commande` tient ce qu'il applique lui-même : `seuilRemisePourDixMille` (1 200,
  soit 12 %, FR-31), `scorePrioriteHaute` (70, FR-33), `alerteValideeNonPrepareeJours` (7, FR-34),
  `alerteCreditBloqueJours` (7, FR-34, FR-203), `heureAllocationDuMatin` (`06:00`, FR-220). Les pourcentages sont en
  dix-millièmes, des entiers (AD-22 : aucun flottant).
- **D-1049-2 — Une version = un document immuable.** `commande_parametres` porte `(organisationId, version)` unique ;
  une nouvelle version s'ajoute, aucune ne se modifie. La date d'effet est l'instant de l'écriture (une date d'effet
  future n'est pas servie : aucun garde-fou du lot ne la demande). La version 1 (les valeurs de la démo, auteur
  `SYSTEME`) est **écrite à la première lecture** de l'organisation, de façon idempotente (index unique) : un acte
  pointe toujours une version persistée, jamais des valeurs du code qui pourraient changer à la livraison suivante.
- **D-1049-3 — « Figé à l'acte » = l'acte garde le numéro de version** (AD-12 : « une règle appliquée plus tard lit
  cette version »). Les versions étant immuables, relire un acte rend les valeurs de sa version. L'acte garde aussi la
  **révision du plafond** lu chez `pdv` et le montant jugé, et la version de la bibliothèque d'encours (AD-9) : le
  jugement se relit tel qu'il a été rendu.
- **D-1049-4 — Qui change un paramètre : `TENANT_ADMIN`, jusqu'à STORY-1053.** AD-12 réserve le geste à `DIST_ADMIN`
  et au DG ; ces rôles arrivent avec B-960 et sont appliqués par D-1053. D'ici là, la route est réservée au
  `TENANT_ADMIN` de l'organisation (même choix que Q-D-3). Le motif est obligatoire ; la piste d'audit garde l'avant et
  l'après. Changer exige la version lue (`versionAttendue`) : deux administrateurs ne s'écrasent pas.
- **D-1049-5 — D'où viennent le plafond et l'encours dans `ventes` aujourd'hui : des read-models locaux, lus par un
  port (`SourcesDuCredit`), en échec fermé.**
  - `commande_plafonds` : l'état absolu du plafond d'un tiers par périmètre (`FIXE` et son montant, ou `SANS_OBJET` ;
    `suspendu` ; `revision`), projection future de `pdv.plafond.changed@1` (FR-189 : la suspension du crédit bloqué
    passe par ce fait, seul chemin du blocage). Pas de document pour le tiers ⇒ `PLAFOND_INCONNU` : la commande à
    crédit est refusée, jamais jugée sur un plafond nul ou infini.
  - `commande_creances`, `commande_credits_tiers` : les états absolus des faits de B-963 et B-965, à la forme de
    l'entrée de la bibliothèque (D-1047-11). **`commande_sources_encours`** dit, par organisation, quelles sources
    sont branchées : **sans document, la source est `ABSENTE`** au sens d'`encours` (comptée zéro, dite dans
    `absentes`, et le jugement rend `NON_INSTALLE` ⇒ refus `ENCOURS_NON_INSTALLE`). C'est l'état de toutes les
    organisations tant que la Créance n'existe pas : **aucune commande à crédit ne passe sur un encours inconnu**
    (manifeste `commande`, C4). Le consommateur de 1059 posera le document quand `paiement` est en service et que sa
    projection tourne, et l'ôtera à la désinstallation.
  - `commande_engagements` : l'engagement du tiers, propre à `commande`, toujours `PRESENTE`.
  - Aucun consommateur Kafka n'est écrit ici : les schémas de `pdv.plafond.changed@1` (pas encore de `pdv-service`)
    et de `paiement.creance.changed@1` (B-963, B-965) ne sont pas fixés. Les read-models se remplissent à la main
    dans les tests et sur la pile de preuve, et c'est dit.
- **D-1049-6 — Ordre des contrôles** (AD-3) : plafond inconnu ou crédit bloqué (le plafond porte la suspension), puis
  `stock` en service, puis le plafond sur l'encours. `stock` en service se lit dans l'état des modules : la projection
  de `entitlement.changed` garde désormais aussi le module **voisin** `stock` (la garde ne lit toujours que les modules
  hébergés). La suffisance du stock se juge à la réservation (AD-8 : atomique chez `stock`), pas avant.
- **D-1049-7 — Le jugement** : `calculerEncours` puis `jugerPlafond` de la copie, sur l'encours **certain** (Q-D-4),
  avec le TTC de la commande en supplément. `SANS_OBJET` (enseigne interne, client comptoir) passe sans jugement de
  crédit ; l'engagement compte quand même. Un refus de la bibliothèque (devise, périmètre, révision incohérente) devient
  `ENCOURS_INCALCULABLE` avec son code. Le plafond se juge **dans la transaction** de l'acte : l'engagement est lu puis
  incrémenté sous condition de sa révision (verrou optimiste par `(tiers, périmètre)`) ; une validation concurrente
  fait rejouer la transaction, qui relit l'engagement et refuse. La dérogation (`commande:plafond:deroger`) n'est pas
  servie ici : elle vient avec la commande (1056) ou ses suivantes ; le refus nomme ce droit comme moyen de le lever.
- **D-1049-8 — Le squelette de la saga s'arrête avant l'émission.** Étape 1, une transaction : l'acte
  (`commande_validations`), les bons `EN_ATTENTE_RESERVATION` (`commande_bons`), l'engagement, la ligne d'audit.
  Étape 2 : un appel au port `ReservationStock` par ligne, clé `<bonId>:<ligne>` (AD-4) ; `RESERVEE` est noté sur la
  ligne ; `STOCK_INSUFFISANT` ou une panne laissent la ligne en attente avec son motif (aucune compensation, AD-34).
  Le bon reste `EN_ATTENTE_RESERVATION` : la bascule `EMIS` et le numéro `BL-` (série `bons-livraison`, déjà copiée)
  sont **STORY-1056** ; l'acte rend la liste des bons dont toutes les lignes sont réservées (`aEmettre`). L'adaptateur
  du port est `ReservationStockNonBranchee` (motif `RESERVATION_NON_BRANCHEE`) : l'API de réservation de `stock` n'existe
  pas encore (amendement d'AD-27). La reprise (`POST …/reservations`) rejoue les lignes en attente ; la libération des
  réservations orphelines est à `stock` (AD-34).
- **D-1049-9 — L'acte reçoit la commande dans son corps, en attendant la saisie.** `POST /api/v1/commande/validations`
  prend `commandeId` (UUID, AD-4 : l'identifiant naît chez l'appelant), le tiers, le périmètre, la devise, le TTC et
  les bons. C'est un squelette sans consommateur (aucun écran, aucun service) : 1056 y branchera la commande saisie et
  décidera de sa forme définitive. Une commande ne se valide qu'une fois (`COMMANDE_DEJA_VALIDEE`).
- **D-1049-10 — Aucun fait publié ici.** L'engagement est écrit dans la transaction, avec sa révision et
  `versionEncours`, prêt à publier ; `commande.engagement-tiers.changed@1` (au catalogue `contrats-distributeur-v1`)
  sera publié par l'outbox de 1056, avec son schéma et la copie de `contrats/distributeur/` (garde
  `verifierFaitsDuModule` sur les quatre manifestes). Aucun libellé n'est rendu non plus (les refus portent un code et un
  message technique) : `vocabulaires/` n'est pas copiée ici.
- **D-1049-11 — Codes de refus neufs de `commande`** : `PARAMETRES_INVALIDES`, `PARAMETRES_VERSION_PERIMEE`,
  `PARAMETRES_VERSION_INCONNUE`, `CLE_D_IDEMPOTENCE_MANQUANTE`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`,
  `COMMANDE_DEJA_VALIDEE`, `VALIDATION_INCONNUE`, `PLAFOND_INCONNU`, `CREDIT_BLOQUE`, `STOCK_NON_INSTALLE`,
  `ENCOURS_NON_INSTALLE`, `ENCOURS_INCALCULABLE`, `PLAFOND_CREDIT_DEPASSE`. Ceux de la spine gardent son sens.

## Ce qui n'est pas fait ici

La saisie et la machine d'états de la commande, l'émission du bon et son numéro (1056) ; la dérogation ; la remise
au-dessus du seuil ; la publication de faits ; les consommateurs de `pdv.plafond.changed@1`, de la Créance (1059) et
de `stock` ; les rôles du distributeur (1053).

## Preuves

À remplir.
