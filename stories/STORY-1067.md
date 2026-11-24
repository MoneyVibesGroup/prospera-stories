# STORY-1067 : la commande (3) — modifier une commande `BROUILLON`, `TRANSMISE` ou `VALIDEE` non commencée, avec son historique champ par champ, le rejugement de FR-33 (la commande non comptée deux fois) et la réservation ajustée par un seul appel à `stock`

Status: in-progress

**Épic :** EPIC-228 (la commande : saisie, validation, bon de livraison et prise de commande sur le terrain) ; FR-35
(« modifier ou annuler une commande »), FR-33 (le plafond, « lors d'une modification, la commande elle-même n'est pas
comptée deux fois »), FR-34, FR-31 · **Dépôt :** `prospera-ventes-service` (module `commande` ; la projection du crédit
du même module) ; aucun manifeste ni contrat partagé de `prospera-plateforme` ne change · **Plage :** groupe D, n° 3 du
lot 6 (`PLAN-LOT-6-2026-11-23.md` §6), **dernière story du distributeur de ce lot**. **Dépend de :** STORY-1056 et 1062
(la commande (1) et (2), `ventes` `dev` 10b8ba5 → f49f3a6), livrées ; STORY-1066 (l'avoir, `dev` d9f4264 → adaa2bb),
livrée. **Suivante :** STORY-1068 (assurance : `sinistres` lit `provision.changed@1`).

**Sources :** l'ordre de **D-1062-12 (1)** (« modifier une commande (FR-35 : `BROUILLON`, `TRANSMISE`, `VALIDEE` non
commencée ; delta de réservation `<commandeId>:<version>:<ligne>`, la commande non comptée deux fois au plafond,
historique champ par champ) ») ; PRD distributeur FR-35 (« le propriétaire de la commande ou un rôle de bureau (DC,
RESP_VENTES, COMPTABLE) peut modifier une commande `BROUILLON`, `TRANSMISE` ou `VALIDEE` non commencée » ;
`COMMANDE_NON_MODIFIABLE` ; « modifier une commande `VALIDEE` annule la réservation, applique de nouveau FR-33, puis
réserve de nouveau ; si un contrôle échoue, la commande garde son état précédent » ; « une commande facturée ne
s'annule pas : on émet un avoir » ; « toute modification est dans un historique en lecture seule : champ, ancienne
valeur, nouvelle valeur, auteur, date »), FR-31 (prix figé à la saisie), FR-33, FR-34 ; spine distributeur AD-3, AD-4
(« réservation = `<bonId>:<ligne>` (modification : `<commandeId>:<version>:<ligne>`) »), AD-6, AD-7, **AD-8**
(« modifier une commande validée = émettre un delta (clés `<commandeId>:<version>:<ligne>`) ou un seul appel
`stock.reserver(replace)`, jamais annuler puis recréer en deux temps »), AD-9, AD-12, AD-20, AD-27, AD-34 ;
`socle/encours` (`jugerPlafond` : « pour une commande modifiée, la différence : elle est déjà dans l'engagement ») ;
manifeste `commande` (M08 : `commande:commande:saisir` « créer, modifier ») ; fiches 1056, 1062 (D-1062-7, D-1062-11),
1066 (l'avoir corrige une facture : ce que devient une commande déjà facturée).

## « Fini quand » (D-1067-1)

Le plan du lot 6 ne le fixe pas (§6, ligne 3). Retenu : **une commande `BROUILLON` ou `TRANSMISE` se modifie (lignes,
date souhaitée, message) à la révision lue, une commande `VALIDEE` non commencée aussi — rejugée par FR-33 sur la seule
différence, sa réservation ajustée par un seul appel de remplacement à `stock` —, chaque modification laisse son
historique champ par champ en lecture seule, un contrôle qui échoue laisse la commande telle qu'elle était, et une
commande facturée, en préparation ou annulée est refusée.**

## Le découpage : ce que cette story prend, et pourquoi

1. **La modification sans acte** (`BROUILLON`, `TRANSMISE`) : les lignes, la date souhaitée, le message ; les prix des
   lignes gardées restent figés (FR-31), une ligne neuve prend le prix de la grille ; l'écart `PRIX_CHANGE` d'une
   commande terrain reste à confirmer, à la révision neuve.
2. **La modification d'une commande `VALIDEE`** (tous ses bons `EMIS`) : le rejugement de FR-33 sur la différence, la
   réservation remplacée en un appel (AD-8), l'engagement ajusté, les bons qui gardent leur numéro, les faits de la
   commande validée et chiffrée republiés à la révision neuve (`facturation` facture alors les montants modifiés).
3. **L'historique** champ par champ, en lecture seule, et sa route.
4. **Ce qu'une facture change** : une commande facturée ne se modifie pas (un avoir, STORY-1066) ; la fenêtre entre les
   deux modules ne compte jamais l'engagement deux fois ni zéro fois (comme D-1062-11).

**N'entre pas dans cette story** (D-1067-16) : ajouter un point de stock ou vider un bon d'une commande `VALIDEE` ;
modifier une commande dont la validation attend encore la réservation ; la remise et sa décision ; la dérogation au
plafond ; `commande.commande.changed@1` ; la modification par l'application terrain hors connexion.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel (2026-11-24) : plan du lot 6, règles, journaux de A, B, C, D (aucune demande neuve à D pour le distributeur ;
  les demandes de 1066 à B sont ouvertes et ne bloquent pas), fiches 1056, 1062, 1065, 1066, épic, spine (AD-8),
  PRD (FR-31, FR-33 → FR-35), manifeste `commande`, code de `commande` et de la projection du crédit sur `origin/dev`.
- [x] Code sur `MNV-1067` (`ventes`) ; preuves sans Docker (Node 25 : `tsc`, lint, unitaires, mutations pures 11/11).
- [x] Preuves sous le verrou Docker (Node 24 : unitaires, e2e, intégration sur MongoDB réel, mutations ; pile `grp-d`,
  pilote 23/23) ; PR `ventes` **#15** ouverte.
- [ ] Annonce « ⚠ Contrats » fusionnée avant le code (cette PR de docs).
- [ ] PR `ventes` fusionnée en rebase ; rejeu depuis `origin/dev` ; PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Modifier** : `POST /api/v1/commande/commandes/{commandeId}/modifications` (`commande:commande:saisir`, `Idempotency-Key`) `{ revision, lignes?, dateLivraisonSouhaitee?, messageClient? }` ⇒ 201 la commande à sa révision neuve et la modification (version, changements) ; rejeu : la même ; même clé, autre charge : `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` ; une révision lue qui n'est plus la courante : 409 `REVISION_PERIMEE` (rien d'écrit) ; rien qui change : 400 `MODIFICATION_SANS_EFFET` | unitaires ; MongoDB réel ; pile |
| AC-2 | **Qui** : l'auteur de la commande, ou un membre qui voit le réseau (`commande:reseau:consulter` : le bureau de FR-35) ; une commande `VALIDEE` demande en plus `commande:commande:valider` ; toujours dans la portée d'écriture ; sinon 403 `ROLE_NON_AUTORISE` (le droit requis nommé) ou `HORS_PORTEE` ; hors lecture : 404 | MongoDB réel (HTTP, vraie chaîne de gardes) ; pile |
| AC-3 | **Quelles commandes** : `BROUILLON`, `TRANSMISE` (sans acte) et `VALIDEE` (tous ses bons `EMIS`) ; `PREPARATION` et au-delà, `ANNULEE` : 409 `COMMANDE_NON_MODIFIABLE` ; une validation qui attend la réservation : 409 `VALIDATION_EN_COURS` ; une facture connue : 409 `COMMANDE_FACTUREE` (l'avoir de 1066 la corrige) | MongoDB réel ; pile |
| AC-4 | **Les lignes et leurs prix** : la liste neuve remplace l'ancienne ; une ligne gardée (même article, même point de stock, même unité) garde son prix figé (FR-31), une ligne neuve prend le prix de la grille (`ARTICLE_SANS_PRIX`, `UNITE_NON_VENDUE`) ; HT, TVA par taux, TTC recalculés (FR-45) ; l'écart `PRIX_CHANGE` d'une commande terrain se réduit aux articles restants et se confirme à la révision neuve | unitaires ; MongoDB réel |
| AC-5 | **L'historique** : chaque modification garde ses changements champ par champ (`champ`, `avant`, `apres`), son auteur, sa date, sa version (continue par commande) et son statut ; `GET /api/v1/commande/commandes/{commandeId}/modifications` (droits de lecture, portée) ; en lecture seule ; la piste trace `MODIFICATION` | unitaires ; MongoDB réel ; pile |
| AC-6 | **Une `VALIDEE` rejugée sur la différence** (FR-33, FR-35) : crédit bloqué, `stock` en service, plafond sur `nouveau TTC − ancien` (la commande n'est pas comptée deux fois ; une baisse ne se juge pas au plafond) ; plafond 1 000 000, commande de 600 000 portée à 900 000 : acceptée, à 1 100 000 : `PLAFOND_CREDIT_DEPASSE`, la commande inchangée | unitaires ; MongoDB réel |
| AC-7 | **La réservation ajustée en un appel** (AD-8) : `stock.remplacer` reçoit, sous la clé `<commandeId>:<version>`, chaque ligne de bon touchée (`<commandeId>:<version>:<rang du bon>.<ligne>`, sa réservation `<bonId>:<ligne>`, sa quantité neuve ; 0 = rendue) ; un refus (`STOCK_INSUFFISANT`) laisse la commande, ses bons et l'engagement comme avant ; `stock` injoignable : la modification attend (503 `RESERVATION_INDISPONIBLE`), le rejeu de la même demande la reprend, et la commande ne se modifie ni ne s'annule entre-temps (`MODIFICATION_EN_COURS`) | MongoDB réel ; pile (adaptateur de recette) |
| AC-8 | **Une `VALIDEE` appliquée** : ses bons gardent leur identité, leur numéro `BL-` et leur état `EMIS`, leurs lignes suivent ; l'engagement du tiers suit la différence (état absolu publié) ; `commande.commande.validee@1` et `commande.commande.chiffree@1` repartent à la révision neuve (états absolus, rang plus haut) ; `facturation` facture ensuite les montants modifiés ; annulée ensuite, elle rend son TTC courant et libère ses réservations | MongoDB réel ; pile (faits lus sur Kafka) |
| AC-9 | **La fenêtre avec `facturation`** : une facture émise avant que `commande` la sache ne baisse l'engagement qu'une fois la modification en cours finie ; la facture d'une commande modifiée après elle baisse l'engagement du TTC que tient la commande (jamais deux fois, jamais zéro), anomalie `FACTURE_D_UNE_COMMANDE_MODIFIEE` journalisée et tracée | MongoDB réel |
| AC-10 | Chaque route déclare son droit (invariant) ; aucun schéma de fait ne change ; la collection neuve est au plan d'effacement C13 ; Node 24 (`verification`) : tsc, lint des fichiers touchés, build, unitaires, e2e, intégration ; mutations rouges sur l'assertion ; `docker compose up` sain (module Nest changé, §1.5) ; rejoué depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1067-1 — « Fini quand »** : voir plus haut (le plan ne le fixe pas).
- **D-1067-2 — La tranche** : voir « Le découpage ».
- **D-1067-3 — Une route, la liste neuve, la révision lue.** `POST /api/v1/commande/commandes/{commandeId}/modifications`,
  `Idempotency-Key` exigée (8 à 128). Corps `{ revision, lignes?, dateLivraisonSouhaitee?, messageClient? }` :
  `revision` est celle de la commande lue (« on ne modifie que ce qu'on a lu », comme `prixConfirmes`, D-1062-4) : une
  autre est refusée 409 `REVISION_PERIMEE` (`details` : lue, courante) ; `lignes` absent garde les lignes, présent les
  remplace toutes (la forme de la saisie : article, quantité, point de stock ; au moins une, sinon
  `COMMANDE_SANS_LIGNE`) ; `dateLivraisonSouhaitee` et `messageClient` absents gardent la valeur, `null` l'efface. Une
  demande qui ne change rien : 400 `MODIFICATION_SANS_EFFET`. Réponse 201 : la commande (révision neuve) et
  `modification` ; le rejeu (même clé, même corps) rend la même ; la même clé pour un autre corps :
  `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`.
- **D-1067-4 — Qui modifie (FR-35, sans nom de rôle).** Le droit de la route est `commande:commande:saisir` (le
  manifeste : « créer, modifier »). L'auteur de la commande (`saisiePar`) la modifie ; un autre membre doit **voir le
  réseau** (`commande:reseau:consulter`) : parmi ceux qui saisissent, ce sont exactement DC, RESP_VENTES et COMPTABLE, le
  « rôle de bureau » de FR-35 (un commercial, un freelance, un chargé de prospection ne modifient que leurs commandes).
  Une commande **`VALIDEE`** demande en plus **`commande:commande:valider`** : son rejugement est un acte de validation,
  et un commercial ne valide pas sa propre commande (FR-33). Sinon 403 `ROLE_NON_AUTORISE` (`details.droitRequis`) ;
  toujours dans la portée d'écriture (403 `HORS_PORTEE`) ; hors de la lecture, 404 `COMMANDE_INCONNUE`.
- **D-1067-5 — Quelles commandes.** `BROUILLON` et `TRANSMISE` sans acte ; `VALIDEE` (tous ses bons `EMIS`) : « non
  commencée » est aujourd'hui toujours vrai d'une `VALIDEE` (la préparation viendra avec `entrepot`, qui fera passer la
  commande `PREPARATION`). `PREPARATION`, `EXPEDIEE`, `LIVREE`, `ANNULEE` : 409 `COMMANDE_NON_MODIFIABLE`. Une commande
  dont l'acte est posé mais dont un bon attend sa réservation (statut encore `BROUILLON` ou `TRANSMISE`) : 409
  `VALIDATION_EN_COURS` — on reprend la saga (`POST /commande/validations/{id}/reprise`) ou on annule.
- **D-1067-6 — Une commande facturée ne se modifie pas** (FR-35, AD-6) : une facture projetée de la commande
  (`commande_factures`) refuse 409 `COMMANDE_FACTUREE` (`details` : `factureId`, `numero`) ; la facture se corrige par un
  avoir (STORY-1066, `POST /api/v1/facturation/factures/{factureId}/avoirs`). Même annulée par un avoir total, la
  facture reste émise et la commande reste facturée : on saisit une commande neuve (`commande` ne lit pas les avoirs).
- **D-1067-7 — Les prix d'une commande modifiée** (FR-31, AD-13). Chaque ligne neuve est rapprochée de la première ligne
  ancienne de même article, même point de stock et même unité : **gardée**, elle garde son prix figé (prix, origine,
  version de grille, taux, version affichée), seule sa quantité peut changer ; sinon c'est une **ligne neuve**, au prix
  de la grille à la modification (« ce client » d'abord, `ARTICLE_SANS_PRIX`, `UNITE_NON_VENDUE`). Les montants se
  recalculent par la règle de la saisie (FR-45). Une commande terrain `TRANSMISE` garde son empreinte de transmission
  (un double de l'appareil reste refusé) ; son écart `PRIX_CHANGE` se réduit aux articles qui restent (nul s'il n'en
  reste aucun) et se confirme **à la révision neuve** ; sa validation relit toujours les prix du serveur (D-1062-4).
- **D-1067-8 — L'historique, en lecture seule** (FR-35). Collection neuve `commande_modifications`, une ligne par
  demande, jamais réécrite après son issue : `version` (continue par commande, 1, 2…), `cle`, `empreinte`, `statut`
  (`APPLIQUEE`, `EN_ATTENTE_DE_STOCK`, `REFUSEE`), `demandeePar`, `demandeeLe`, `appliqueeLe`, `revisionAvant`,
  `revisionApres`, `changements` (`{ champ, avant, apres }` : `lignes[<article>@<point de stock>].quantite`, la ligne
  ajoutée ou retirée `lignes[<article>@<point de stock>]` avec sa quantité et son prix, `dateLivraisonSouhaitee`,
  `messageClient`, `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur` ; un second article identique au même point
  de stock est suffixé `#2`), les montants avant et après, le jugement (commande `VALIDEE`), les réservations remplacées,
  le refus (code, détails). `GET /api/v1/commande/commandes/{commandeId}/modifications` (les droits de lecture des
  commandes, sa portée ; hors lecture : 404) les rend par version. La commande lue gagne `modifications` (le nombre
  appliqué) et `modificationEnCours` (`{ version, depuis }` ou `null`). La piste du module trace `MODIFICATION` (les
  champs changés, jamais le texte du message).
- **D-1067-9 — Une `VALIDEE` rejugée sur la seule différence** (FR-33, FR-35 ; AD-3, AD-9, AD-12). Quand ses lignes
  changent : `stock` en service (`STOCK_NON_INSTALLE`) ; puis, si le TTC monte, dans l'ordre d'AD-3 : crédit bloqué
  (`CREDIT_BLOQUE`, `PLAFOND_INCONNU`), plafond jugé par `encours@1` avec la **différence** `nouveau TTC − ancien` en
  supplément (`PLAFOND_CREDIT_DEPASSE` ; la commande est déjà dans l'engagement, elle n'est pas comptée deux fois). Une
  baisse ne se juge pas au plafond ni au crédit bloqué : elle ne peut que baisser l'encours (FR-34 : la réservation d'un
  client bloqué reste posée jusqu'à l'annulation). Les paramètres courants sont figés dans la modification (sa
  `parametresVersion`) ; l'acte de validation n'est pas réécrit (il reste ce qui a été jugé à la validation). Seuls la
  date et le message qui changent : ni rejugement ni appel à `stock`.
- **D-1067-10 — La saga de la modification d'une `VALIDEE`** (AD-8, AD-34 ; « si un contrôle échoue, la commande garde
  son état précédent »).
  1. **Transaction 1** : la modification `EN_ATTENTE_DE_STOCK` ; la commande marquée (`modificationEnCours`, à la
     révision lue, sans acte de modification en cours) ; si le TTC monte, le plafond jugé et l'engagement relevé de la
     différence **à sa révision** (le verrou par tiers d'AD-9 ; état absolu publié) — une baisse attend la fin.
  2. **Un seul appel** `stock.remplacer` (D-1067-11). **Refus** (`STOCK_INSUFFISANT`, atomique chez `stock` : rien n'y a
     changé) : transaction de refus — l'engagement relevé est rendu, la marque levée, la modification `REFUSEE` — puis 409
     `STOCK_INSUFFISANT` ; la commande est telle qu'avant. **`stock` injoignable** : la modification reste
     `EN_ATTENTE_DE_STOCK` (503 `RESERVATION_INDISPONIBLE`) ; le rejeu de la même demande (même clé) rappelle `stock`
     sous la même clé (idempotent) et conclut. Entre-temps, une autre modification ou une annulation est refusée 409
     `MODIFICATION_EN_COURS`.
  3. **Transaction 2** : la commande à sa révision neuve (lignes, montants, marque levée), ses bons, l'engagement baissé
     de la différence si le TTC baisse (état absolu publié), `commande.commande.validee@1` et
     `commande.commande.chiffree@1` à la révision neuve, la modification `APPLIQUEE`, la piste.
- **D-1067-11 — Le port de `stock` gagne `remplacer`** (AD-8 : « un seul appel `stock.reserver(replace)` »).
  `remplacer({ organisationId, cle: <commandeId>:<version>, lignes: [{ cle: <commandeId>:<version>:<rang du bon>.<ligne
  du bon>, reservation: <bonId>:<ligne>, bonId, ligne, pointDeStockId, articleId, quantite }] })` : chaque réservation
  nommée passe à sa quantité neuve (0 : rendue ; une réservation absente est créée), **toutes ou aucune**, idempotent par
  `cle`. La réservation garde sa clé `<bonId>:<ligne>` : l'annulation la rend toujours par elle (D-1062-8). « La ligne »
  de la clé d'AD-4 est la ligne de bon (`<rang du bon>.<ligne>`), stable d'une version à l'autre. Adaptateur non branché :
  `INDISPONIBLE` (sans `stock`, aucune commande n'est `VALIDEE`) ; adaptateur de recette : il applique.
- **D-1067-12 — Les points de stock d'une `VALIDEE` ne changent pas dans cette tranche** : une ligne neuve part d'un point
  de stock de l'un de ses bons, et chaque bon garde au moins une ligne ; sinon 409 `POINT_DE_STOCK_CHANGE`
  (`details` : `ajoutes`, `vides`). Un bon neuf demanderait une réservation puis une émission pendant que la commande
  est `VALIDEE` ; vider un bon le ferait `ANNULE` : la tranche suivante.
- **D-1067-13 — Les bons gardent leur numéro** (AD-5). Un bon `EMIS` garde son identité, son numéro `BL-`, son état ; ses
  lignes suivent la commande dans son ordre : une ligne gardée garde son numéro de ligne de bon, une ligne neuve prend le
  suivant, une ligne retirée disparaît (sa réservation passée à 0). `commande.bon-livraison.emis@1` n'est pas republié
  (un bon est émis une fois) : **`commande.commande.validee@1`** (bons et lignes) et **`commande.commande.chiffree@1`**
  (montants) repartent, dans la transaction 2, au **rang de la révision neuve** (`valideeLe` inchangé) : ce sont des
  états absolus, le consommateur garde le plus haut rang (`facturation` le fait déjà : D-1059-3, D-1061-13). **Aucun
  schéma ne change.**
- **D-1067-14 — La fenêtre avec `facturation`** (AD-7, AD-9 ; comme D-1062-11). La garde `COMMANDE_FACTUREE` ne voit
  qu'une facture connue. (1) Une facture projetée pendant une modification en attente ne baisse l'engagement qu'après
  elle (`EN_ATTENTE`) : la transaction 2 ou celle du refus solde ensuite les factures de la commande. (2) La facture d'une
  commande modifiée après elle (son TTC n'est plus celui de la commande) baisse l'engagement **du TTC que tient la
  commande** (borné au restant) : jamais deux fois, jamais zéro ; l'anomalie `FACTURE_D_UNE_COMMANDE_MODIFIEE` est
  journalisée et tracée ; la facture, figée, se corrige par un avoir (1066) si elle dépasse la commande.
- **D-1067-15 — Le rejeu d'une validation après une modification** rend l'acte (même clé) sans le rejuger : l'empreinte
  de l'acte est celle de la commande validée, pas celle de la commande modifiée.
- **D-1067-16 — Ce qui reste (la commande (4) et suivantes)** : ajouter un point de stock ou vider un bon d'une `VALIDEE`
  (bon neuf réservé puis émis, bon `ANNULE`) ; modifier une commande dont la validation attend la réservation ; la
  livraison et le reliquat (`entrepot`), puis la facture par livraison (D-1062-12 (2)) ; l'allocation du matin, la
  remise, la dérogation (D-1062-12 (3)) ; `commande.commande.changed@1` ; la modification par l'application terrain
  (file d'envoi) ; une facture complémentaire quand la commande modifiée dépasse sa facture.

## Contrat annoncé avant le code

Annoncé dans le journal de D, « ⚠ Contrats », avant la fusion du code. **Ajouts seuls** ; **aucun schéma de fait ne
change** ; **aucun manifeste ne change** (`commande:commande:saisir` couvre déjà « modifier »).

- **Routes neuves** (préfixe `/api/v1/commande`) : `POST /commandes/{commandeId}/modifications`
  (`commande:commande:saisir` ; D-1067-4 ; `Idempotency-Key`) ⇒ 201 `{ …la commande, modification, rejeu }` ; 400
  `CLE_D_IDEMPOTENCE_MANQUANTE`, `COMMANDE_SANS_LIGNE`, `MONTANT_HORS_BORNES`, `MODIFICATION_SANS_EFFET` ; 403
  `ROLE_NON_AUTORISE`, `HORS_PORTEE` ; 404 `COMMANDE_INCONNUE` ; 409 `REVISION_PERIMEE`, `COMMANDE_NON_MODIFIABLE`,
  `VALIDATION_EN_COURS`, `COMMANDE_FACTUREE`, `MODIFICATION_EN_COURS`, `POINT_DE_STOCK_CHANGE`, `ARTICLE_SANS_PRIX`,
  `UNITE_NON_VENDUE`, `CREDIT_BLOQUE`, `PLAFOND_INCONNU`, `STOCK_NON_INSTALLE`, `ENCOURS_NON_INSTALLE`,
  `PLAFOND_CREDIT_DEPASSE`, `STOCK_INSUFFISANT`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` ; 503 `RESERVATION_INDISPONIBLE`.
  `GET /commandes/{commandeId}/modifications` (`commande:reseau:consulter` ou `commande:portefeuille:consulter`) ⇒
  `{ modifications: [...] }`.
- **Routes changées** (ajouts) : la commande lue gagne `modifications` et `modificationEnCours` ;
  `POST /commandes/{commandeId}/annulation` peut refuser 409 `MODIFICATION_EN_COURS`.
- **Faits** : schémas inchangés ; **`commande.commande.validee@1` et `commande.commande.chiffree@1` peuvent repartir
  pour une même commande**, à un rang plus haut, après la modification d'une commande `VALIDEE` (états absolus : garder
  le plus haut rang) ; `commande.engagement-tiers.changed@1` suit la différence.
- **Port `stock`** (AD-8, à servir par l'API de réservation de `stock` quand elle existera) : `remplacer` (D-1067-11).
- **Collection neuve** : `commande_modifications` (au plan d'effacement C13).
