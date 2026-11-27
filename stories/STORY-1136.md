# STORY-1136 : L'avoir émis réduit la Créance de sa facture — `paiement` consomme `facturation.avoir.emis@1`

Status: in-progress — fiche écrite le 2026-11-27 par une sous-session du groupe B juste avant de coder (lot 7, n° 18 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 18 : la première remplaçante de STORY-1116,
déjà livrée au lot 6 ; D-L7B-3 ; identifiant réservé D-L7B-1).

**Épic :** EPIC-231 (la Créance, le crédit du tiers et l'amendement de `paiement`), d'`epics-distributeur-2026-11-13.md`
· FR-48, FR-49, FR-50, FR-248 · spine distributeur AD-2, AD-7, AD-8, AD-9, AD-20, AD-31
**Dépôt :** `MoneyVibesGroup/prospera-paiement-service` (rendu par D le 26/11 à `dev` `64b5838`, « Passations »)
**Points :** 3 · **Demande de :** D (STORY-1066, D-1066-13 (3) ; journal de B, « Demandes », D-979-14)
**Dépend de :** STORY-1066 (le fait, `prospera-ventes-service@d9f4264`), STORY-976 (le patron du consommateur), STORY-965
(l'état absolu `paiement.creance.changed@1`), STORY-1073 (`publier(resultat, entree)`)

**Sources lues :** fiche STORY-1066 (D-1066-1 → 14 ; D-1066-7 : la charge du fait ; D-1066-13 (3) : « réduire la Créance
`(FACTURE, factureId)` du TTC de l'avoir, en moins de 5 s ; au-delà du reste dû, un crédit du tiers ; clé de rejeu
`avoirId` ») ; schéma du producteur `contrat/schemas/facturation.avoir.emis.json` de `prospera-ventes-service` (`dev`
`dcb5d3b`, inchangé depuis `d9f4264`) et sa lecture de `paiement.creance.changed@1` (`reglements/reglement.ts`) ; PRD
distributeur (FR-48 ; §836 « `reste_du = montant_ttc − montant_avoirs − montant_encaisse`, calculé par `paiement` » ; le
crédit du tiers, « avoir sur une facture payée ») ; spine distributeur AD-7 (« `reste_du = montant_origine − avoirs −
encaissements imputés` », « l'excédent devient un crédit du tiers », « rembourser un crédit du tiers est un ordre à deux
personnes ») ; manifeste `manifestes/paiement.manifest.ts` 1.2.0 (`consomme` déclare déjà le fait) ; fiches STORY-976,
965, 1073, 1141, 1132 ; journal de B (D-L7B-3, passations de `paiement` du 24/11, de 1073 et de 1141, pièges). **Code
relu sur `origin/dev` `64b5838` avant la fiche** : aucun consommateur d'avoir, aucun registre d'avoirs, aucun champ ; le
crédit du tiers est le trop-perçu des Créances du tiers (D-965-6, `compteurs-du-tiers.ts`) ; le reste dû se calcule en un
seul lieu (`decomposerLesRestants`, sommes de `SoldesDeCreances`).

---

## Pourquoi

D-1066-1 : sans ce consommateur, un avoir est émis, numéroté, publié et imprimé, mais **le reste dû lu chez `paiement` ne
baisse pas**. La facture de 507 400 F créditée de 100 000 F reste due à 507 400 F à la relance, à l'encours et dans la
balance âgée ; et l'avoir d'une facture déjà payée ne laisse aucun crédit au client.

## Ce qui doit être vrai à la fin

| AC | Exigence | Preuve |
|:--:|---|---|
| AC-1 | **L'avoir réduit la Créance de sa facture** `(FACTURE, factureId)` du TTC de l'avoir, en moins de 5 s : le reste dû (certain et affiché) baisse, le montant d'origine ne bouge pas | unitaires ; MongoDB réel ; pile (API relue) |
| AC-2 | **Au-delà du reste dû, un crédit du tiers** : sur une facture payée, l'argent reçu au-delà de ce qui est dû devient le trop-perçu de la Créance, compté au crédit du tiers | unitaires ; pile (compteurs du tiers) |
| AC-3 | **Rejouer n'écrit rien** : la clé est `avoirId` ; un fait relivré, rejoué depuis le début ou sous un autre `eventId` ne réduit pas deux fois ; dix livraisons simultanées font une inscription | unitaires ; MongoDB réel ; pile |
| AC-4 | **Une écriture d'argent tracée** : l'avoir, son acte au journal chaîné de la Créance et son état absolu (`paiement.creance.changed@1`, cause `AVOIR`) dans une transaction | invariants ; MongoDB réel |
| AC-5 | **L'avoir avant sa Créance** n'est pas perdu : il est compté dès que la Créance naît | MongoDB réel ; pile |
| AC-6 | **Un refus est ignoré, journalisé, jamais rejoué** ; la partition avance | unitaires ; pile |
| AC-7 | **Le schéma** : celui du producteur au registre (BACKWARD), copié à l'octet avec son origine ; `paiement.creance.changed@1` amendé en ajout seul, BACKWARD prouvé contre le schéma de 965 | unitaires ; Karapace |

## Décisions (prises par défaut, contestables)

- **D-1136-1 — Ce qu'un avoir fait dans `paiement` : il réduit la DETTE, rien d'autre.** Le PRD et la spine le disent
  (« `reste_du = montant_origine − avoirs − encaissements imputés` », AD-7, FR-48) : un avoir n'est ni un encaissement (aucun
  argent n'entre), ni un remboursement (un remboursement est un ordre à deux personnes, AD-7, plus tard), ni une imputation
  (elle se fait sur un crédit, plus tard). **Le montant d'origine reste figé** (AD-2 : c'est le dénominateur de tout) : rien
  n'est décrémenté sur la Créance. L'avoir est une **écriture d'argent** : il change le reste dû. Il passe donc par
  `EcritureDArgent` (inventaire fermé `ECRITURES_DARGENT` + 1 : `reduire-la-creance-par-l-avoir.usecase.ts`), avec un acte
  neuf **`CREANCE_REDUITE_PAR_AVOIR`** sur la chaîne de la Créance (auteur `MODULE` `FAIT_D_AVOIR` : le fait n'a pas de
  membre) et l'état absolu de la Créance (cause neuve `AVOIR`) ; la garde de 965 le compte parmi les changeurs.
- **D-1136-2 — Un registre en ajout seul, `avoirs_de_creance`, sommé au seul lieu des restants.** Un document par avoir
  (clé `<organisationId>|<avoirId>`, `rendreAppendOnly`), portant la clé de la Créance, le TTC, la devise, l'ordre et le
  cumul dits par `facturation`. `SoldesDeCreances.pourCreance` le somme (dans la session) comme il demande les validations et
  les contre-passations à leur registre ; `decomposerLesRestants` le retranche : `dû = max(origine − avoirs, 0)`,
  `restantCertain = max(dû − confirmé, 0)`, `restantAffiche = max(dû − confirmé − déclaré, 0)`,
  `tropPercu = max(confirmé − dû, 0)`. Toute lecture du reste dû (route, lien de paiement, relance, encaissement suivant,
  état publié) voit donc l'avoir, sans une seconde règle. La somme plutôt que le `cumulTtcMineur` du fait : la clé par avoir
  rend la somme juste dans tout ordre d'arrivée ; le cumul est gardé avec l'avoir, pour le dire.
- **D-1136-3 — Le crédit du tiers de cette version reste le trop-perçu.** Au-delà du reste dû, l'argent confirmé devient le
  trop-perçu de la Créance (`tropPercuMineur` de l'état publié), que les compteurs du tiers comptent déjà comme crédit
  (D-965-6, `encours@1`). C'est l'« avoir sur une facture payée » du PRD. Un cumul d'avoirs plus haut que l'origine (origine
  divergente, AD-7) ne crée ni dette négative ni crédit sans argent reçu. **Pas encore** : `paiement.credit-tiers.changed@1`,
  les statuts `IMPUTE` et `REMBOURSE` de l'avoir (D-1066-14), l'imputation et le remboursement.
- **D-1136-4 — L'avoir avant sa Créance est inscrit sous la clé qu'elle aura.** Deux topics, deux groupes, aucun ordre entre
  eux : au rattrapage depuis le début, l'avoir peut passer avant la facture. Le rejouer jusqu'à ce que la Créance existe
  bloquerait la partition (et pour toujours si la facture était refusée) ; l'ignorer perdrait une dette. La clé de la Créance
  se **calcule** de la source (`cleDeCreance`, la même composition que l'ouverture) : l'avoir y est inscrit et tracé (la
  chaîne se dérive de la clé, elle aussi), sans état publié (ni tiers ni échéance à dire encore). L'ouverture **relit ses
  restants dans sa session** (`OuvrirLaCreance` ne les précalcule plus) : la Créance naît en comptant l'avoir. **Reste
  nommé** : une naissance et un avoir commis au même instant ne se heurtent sur aucun document ; l'état de naissance peut
  alors ne pas compter l'avoir (instantané de la transaction) ; la lecture par l'API est juste, et l'état suivant aussi.
- **D-1136-5 — Ce qui est refusé, ignoré et journalisé** (même règle que la facture émise, D-976-4) : un avoir hors du
  périmètre de la société (`AVOIR_HORS_PERIMETRE`, AD-31 : celui d'un freelance a ses faits), d'un autre tiers que la Créance
  (`CREANCE_SOURCE_EN_CONFLIT`), d'une autre devise (`AVOIR_AUTRE_DEVISE`, AD-8), mal formé (`AVOIR_INVALIDE`,
  `CREANCE_INVALIDE`, `MONTANT_INVALIDE`). `ECRITURE_CONCURRENTE` (après trois essais sans minuterie) et toute panne
  remontent : le client relivre, la clé rend le rejeu sûr. Aucune garde d'accès au module sur ce chemin (D-976-3). Un avoir
  d'une autre devise arrivé avant sa Créance reste inscrit sans compter (la somme filtre la devise de la Créance).
- **D-1136-6 — Un groupe neuf, `paiement-avoirs`, depuis le début** (`KAFKA_AVOIRS_GROUP_ID`, facultative) : les avoirs émis
  avant le premier démarrage réduisent leur Créance ; `/health` compte le groupe.
- **D-1136-7 — `paiement.creance.changed@1` : un ajout, pas une version.** `avoirsMineur` (facultatif au schéma, toujours
  publié depuis cette story) et la cause `AVOIR` ; les descriptions de `restantCertainMineur` et `tropPercuMineur` disent les
  avoirs. BACKWARD prouvé au registre contre le schéma de 965 (et l'ajout rendu requis y est refusé). La vue
  `GET /api/v1/creances/{id}/restants` gagne `avoirsMineur`. Les faits fins `.soldee` et `.troppercu.constate` restent des
  faits d'argent reçu : un avoir ne les émet pas.
- **D-1136-8 — Le schéma consommé, copié à l'octet** : `contrat/consommes/facturation.avoir.emis.json` (sha256
  `fe88f304…`, LF), origine épinglée dans `contrat/ORIGINE-DES-SCHEMAS.json` (`prospera-ventes-service@d9f4264`) ; une garde
  unitaire égale l'empreinte, vérifie que chaque champ lu est requis par le producteur. Au registre, le sujet
  `facturation.avoir.emis-value` est celui du producteur : la recette l'y enregistre (BACKWARD), le relit, et valide les
  faits publiés contre lui (patron de 976).
- **D-1136-9 — Manifeste `paiement` 1.3.0** (une mineure : un ajout au fait d'état ; la consommation était déclarée),
  recopié au catalogue après la fusion du code.
- **D-1136-10 — La licence (STORY-1132) n'est pas touchée.** Un avoir ne vise que `(FACTURE, factureId)` ; les Créances
  d'abonnement de Prospera sont sans source (module `ABONNEMENT`) : la somme de leurs avoirs est nulle, `estSoldee` et
  `paiement.abonnement.echeance.encaissee` (que la centrale lit) ne changent pas.
- **D-1136-11 — Les deux e2e rouges sur `e2be149` sont réparés ici** (petits, dans ce dépôt, dans les tests seuls) :
  `health` (le double de Kafka gagne `admin.listTopics`, MNV-957) et `notifications-webhook` (le module de test fournit
  `EtatsDeCreance`, MNV-965).

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Consommation neuve** : `paiement` lit `facturation.avoir.emis` (groupe `paiement-avoirs`, depuis le début) et réduit la
  Créance `(FACTURE, factureId)`. Le manifeste la déclarait déjà.
- **`paiement.creance.changed@1`** (ajout seul, BACKWARD) : `avoirsMineur` facultatif, cause `AVOIR` ; un état de plus à
  chaque avoir ; `restantCertainMineur`, `restantAfficheMineur`, `montantExigibleMineur` et `tropPercuMineur` comptent
  désormais les avoirs.
- **`GET /api/v1/creances/{id}/restants`** : `avoirsMineur` en plus.
- **Variable facultative neuve** : `KAFKA_AVOIRS_GROUP_ID` (défaut `paiement-avoirs`).
- **Manifeste `paiement` 1.3.0**, recopié au catalogue.
- **→ D** (information) : `facturation` lit `restantCertainMineur` : une facture créditée en entier sans paiement passe
  `PAYEE` au règlement lu, sous votre `ANNULEE_PAR_AVOIR` ; `avoirsMineur` est là si vous voulez le distinguer.
  `recouvrement` et `pdv` lisent un reste dû réduit, sans rien changer.
