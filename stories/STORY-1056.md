# STORY-1056 : la commande (1) — saisie, validation, bon de livraison `EMIS` avec son numéro `BL-` par les séries

Status: in-progress

**Épic :** EPIC-228 (la commande : saisie, validation, bon de livraison) · **Dépôt :** `prospera-ventes-service`
(module `commande`, tenu par D) ; `prospera-stories` (manifeste `commande`, C5). **Plage :** groupe D, n° 12 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** STORY-1049 (les garde-fous, `dev` c8f5fd2) et STORY-1052
(les séries hébergées, `dev` e4a27c7), faites ; STORY-1053 (droits, portée, `dev` 9e626fa). **Suivante :** STORY-1057
🛡 (la recette de la démo assurance, `prospera-assureur-fictif`).

**Sources :** spine distributeur AD-3 (états écrits par `commande` seul, transitions en donnée versionnée,
`TRANSITION_INTERDITE` ; la commande est `VALIDEE` quand tous ses bons sont `EMIS` ; `validee@1` sans prix), AD-4 (clé
par geste, arbitrée par un index unique), AD-5 (`commande` possède `BL-AAAA-NNNNNN` ; le numéro naît à l'émission,
jamais au brouillon ; compteur continu, l'année n'est qu'un préfixe ; `commande.serie.changed@1` ; numéros de bon dans
`commande.bon-livraison.emis@1`), AD-8 (réservation par ligne de bon), AD-9 (`commande.engagement-tiers.changed@1`),
AD-20 (catalogue des faits), AD-21 (piste), AD-22 (montants entiers, TVA par taux sur le total HT, un arrondi par
taux), AD-23 (portée, données privées), AD-30 (aucun numéro perdu ni réémis), AD-34 (saga : transaction locale, puis
`stock`, puis bascule `EMIS`) ; PRD distributeur §5.1, FR-30, FR-31, FR-33, FR-36, FR-38 ; EPIC-228 (« fini quand ») ;
STORY-1049 (D-1049-8 : « la bascule `EMIS` et le numéro `BL-` sont 1056 » ; D-1049-9 : « 1056 décidera de la forme
définitive » de l'acte ; D-1049-10 : l'outbox et la copie de `contrats/distributeur/`) ; STORY-1052 (D-1052-8,
D-1052-11) ; STORY-1053 (D-1053-2, D-1053-5, D-1053-8 : « y lire le nœud du point de vente au lieu du corps ») ;
catalogue `contrats-distributeur-v1` (STORY-1045).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel, lecture, fiche, annonce « ⚠ Contrats » (prospera-stories #654, `main` bb02021).
- [x] Code sur `MNV-1056` (ventes), poussé (6f3db76) : saisie, validation branchée, émission des bons, outbox,
  schémas, copie de `contrats/distributeur/`, tests ; tsc et lint verts en local.
- [x] Verrou Docker pris à 16:01 (libre au moment de lever, B l'avait rendu).
- [ ] Preuves Node 24 (sous le verrou Docker), pile `grp-d`, rejeu depuis `origin/dev`.
- [ ] PR ventes fusionnée en rebase ; PR de docs finale (fiche `done`, tracker, journal).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Saisie** : `POST /api/v1/commande/commandes` crée une commande `BROUILLON` pour un point de vente connu de `commande` (jamais un texte libre), dans la portée d'écriture du membre (nœud du point de vente) ; chaque ligne porte le prix **figé à la saisie** depuis la grille (« ce client », puis société ; origine et version de grille gardées), sinon `ARTICLE_SANS_PRIX` ; totaux HT, TVA par taux sur le total HT, TTC, en entiers (10 × 6 000 = 60 000 HT, 10 800 TVA, 70 800 TTC) ; clé d'idempotence exigée, rejeu sans effet | unitaires ; MongoDB réel ; pile |
| AC-2 | **Validation** : `POST /api/v1/commande/validations` reçoit `{ commandeId }` et juge la commande saisie (garde-fous de 1049 inchangés : crédit bloqué, stock en service, plafond sur l'encours sous verrou par tiers) ; l'acte et la commande se lient dans **la même transaction** ; une commande qui n'est plus `BROUILLON` est refusée `TRANSITION_INTERDITE` | MongoDB réel ; pile |
| AC-3 | **Bon `EMIS` et numéro `BL-`** : un bon dont toutes les lignes sont réservées bascule `EMIS` avec un numéro `BL-AAAA-NNNNNN` tiré par `NumerotationDesSeries` (série `bons-livraison`), **dans la transaction du bon** : aucun numéro sans bon, aucun bon sans numéro ; la commande passe `VALIDEE` quand tous ses bons sont `EMIS` | MongoDB réel ; pile |
| AC-4 | **Concurrence** : N validations parallèles (commandes distinctes) émettent N numéros **distincts et continus**, aucun doublon ; une émission concurrente du même bon n'émet qu'un numéro | MongoDB réel |
| AC-5 | **Rejeu** : la même validation rejouée (même clé, même charge) rend le même acte et les mêmes numéros ; **aucun numéro n'est réémis**, la tête de série ne bouge pas | MongoDB réel ; pile |
| AC-6 | **Faits** : `commande.engagement-tiers.changed@1` (dans la transaction de l'acte), `commande.bon-livraison.emis@1`, `commande.serie.changed@1` et `commande.commande.validee@1` (dans la transaction du bon) passent par l'outbox ; chaque nom est au catalogue `contrats-distributeur-v1` et au manifeste ; schémas au registre en BACKWARD ; aucune charge ne porte un prix sur `validee@1` ni sur `bon-livraison.emis@1` | unitaires ; MongoDB réel ; pile (lus sur Kafka, outbox vidée) |
| AC-7 | **`contrats/distributeur/`** copié à l'octet (`index.ts`, `catalogue-faits.json`) avec un test d'empreinte ; `verifierFaitsDuModule` rejoué sur les quatre manifestes de `ventes` | unitaires |
| AC-8 | **Droits et portée** : chaque route neuve déclare son droit (invariant de 1053) ; un rôle non autorisé reçoit 403 ; une commande hors de la portée de lecture est introuvable (404) | unitaires ; MongoDB réel ; pile |
| AC-9 | **Mutations** rouges sur une assertion ; Node 24 ; `docker compose -p grp-d up` ; rejoué sur l'image reconstruite depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1056-1 — Le cycle servi par 1056 : `BROUILLON` → `VALIDEE`.** Les transitions sont **une donnée versionnée**
  (`transitions-commande@1`, AD-3) : la table entière de la spine (`BROUILLON`, `TRANSMISE`, `VALIDEE`, `PREPARATION`,
  `EXPEDIEE`, `LIVREE`, `ANNULEE`) y est écrite, chaque commande garde sa `transitionsVersion`, mais **une seule
  transition a une route** ici : la validation d'un `BROUILLON`. Entre l'acte et le dernier bon `EMIS`, la commande reste
  `BROUILLON` avec son acte (`validation`), comme le veut AD-34 (« la commande est `VALIDEE` quand tous ses bons sont
  `EMIS` ») : elle ne se revalide plus (`COMMANDE_DEJA_VALIDEE`), et la reprise de la saga (route de 1049) finit le
  travail. Une transition absente de la table est refusée `TRANSITION_INTERDITE`.
- **D-1056-2 — La saisie lit le point de vente chez `commande`, jamais dans le corps** (D-1053-8). Le read-model
  `commande_points_de_vente` (projection future de `pdv.point-de-vente.changed@1` : nœud du réseau, point de stock
  source, statut) dit où vit le point de vente ; **sans document, `POINT_DE_VENTE_INCONNU`** (échec fermé, comme le
  plafond en 1049). Le nœud du point de vente doit être dans la portée d'**écriture** du membre, sinon 403
  `PDV_HORS_PERIMETRE` (FR-30). Le point de stock source vient du point de vente ; une ligne peut en nommer un autre
  (deux points de stock ⇒ deux bons, FR-36). Aucun consommateur Kafka n'est écrit ici (`pdv-service` n'existe pas) : le
  read-model se remplit à la main dans les tests et sur la pile, et c'est dit.
- **D-1056-3 — Le prix est figé à la saisie, lu dans la grille** (FR-31) : read-model `commande_prix` (projection
  future de `catalogue.grille.publiee@1`), une entrée par `(article, grille)` : `CLIENT` (prix négocié du point de
  vente) puis `SOCIETE`. Elle porte le prix unitaire HT en unité mineure, l'unité de vente, la devise, le **taux de TVA**
  (celui du paquet fiscal du pays, posé par la projection : jamais dans le code, AD-22) et la version de la grille. La
  ligne garde le prix, l'origine (`PRIX_NEGOCIE_CLIENT` | `GRILLE_SOCIETE`) et la version. Sans prix dans la devise de
  la commande : `ARTICLE_SANS_PRIX` (l'article nommé) ; une unité qui n'est pas celle de la grille : `UNITE_NON_VENDUE`.
  Un changement de grille après la saisie ne touche pas la commande.
- **D-1056-4 — Les montants** (FR-31, FR-45, AD-22) : `HT ligne = prix × quantité` ; `HT = Σ lignes` ; la TVA se calcule
  **par taux sur le total HT** de ce taux, un seul arrondi par taux (au plus proche, la moitié vers le haut, à l'unité
  mineure) ; `TTC = HT + TVA`. Entiers seulement (calcul en `BigInt`, bornes vérifiées). Pas de remise en 1056 (la
  remise au-dessus du seuil est une décision, commande (2)). La marge n'est pas calculée : le coût vient de `stock`, qui
  n'est pas branché ; `margeMineur` reste `null` (« non calculable », jamais 0).
- **D-1056-5 — La forme définitive de l'acte : `POST /api/v1/commande/validations` reçoit `{ commandeId }`**, la
  commande saisie (D-1049-9 l'annonçait ; aucun consommateur). Les champs du squelette (`tiersId`, `perimetre`,
  `devise`, `montantTtcMineur`, `noeudId`, `margeMineur`, `bons`) ne sont plus reçus (400 : le service refuse un champ
  inconnu). L'acte est **construit depuis la commande** : tiers = point de vente, périmètre `SOCIETE`, devise et TTC de la
  saisie, nœud du point de vente, un bon par point de stock. Les garde-fous de 1049 ne changent pas. L'acte et le
  marquage de la commande (`validation`) s'écrivent dans **la même transaction** : une commande qui n'est plus
  `BROUILLON` fait échouer la transaction (`TRANSITION_INTERDITE`), et rien n'est écrit.
- **D-1056-6 — L'émission du bon** : dès qu'un bon a toutes ses lignes réservées (à la validation, ou à la reprise),
  `NumerotationDesSeries.emettreDansUneTransaction('commande', org, 'bons-livraison', …)` ouvre la transaction
  `majority` qui porte **le numéro et le bon** : le bon passe `EN_ATTENTE_RESERVATION` → `EMIS` sous condition de son
  état, avec son numéro, la commande compte ses bons émis, les faits partent dans l'outbox, la piste reçoit sa ligne.
  Un bon déjà `EMIS` (émission concurrente) fait **annuler** la transaction : le numéro tiré n'est pas engagé et sera
  repris par l'émission suivante (D-1052-6), aucun trou. Le schéma refuse un bon `EMIS` sans numéro. La commande passe
  `VALIDEE` dans la transaction du dernier bon (compteur sur le document de la commande : deux bons émis en même temps
  se heurtent sur lui, l'un est rejoué).
- **D-1056-7 — Le numéro affiché : `BL-AAAA-NNNNNN`** (PRD §5.1, AD-5) : `AAAA` est l'année d'émission (UTC, qui est
  l'heure de Lomé), `NNNNNN` le compteur **continu** de la série `bons-livraison` sur six chiffres au moins ; il ne
  repart jamais à 1 au changement d'année. Le bon garde aussi le rang dans la série et l'époque (AD-30).
- **D-1056-8 — Les faits publiés par 1056, et seulement eux** (outbox transactionnelle `socle_outbox`, patron de
  `reseau`, un seul relais à la fois ; topic sans `@1`, `schemaVersion: 1` dans l'enveloppe et l'en-tête ; chaque fait
  porte `organisationId`, l'identifiant de son objet et un `rang`, AD-20) :
  - `commande.engagement-tiers.changed@1` — état absolu de l'engagement par `(tiers, périmètre)` (la forme de
    `FaitEngagement` d'`encours@1` : `revision`, `tiersId`, `perimetre`, `devise`, `restantAFacturerMineur`,
    `versionEncours`), clé `<organisationId>:<tiersId>:<perimetre>`, écrit **dans la transaction de l'acte** ;
  - `commande.bon-livraison.emis@1` — le bon émis : `bonId`, `commandeId`, `numero`, `rangDansLaSerie`, `epoque`,
    `pointDeStockId`, `pointDeVenteId`, lignes (article, quantité) ; **ni prix, ni marge, ni plafond** (AD-3) ;
  - `commande.serie.changed@1` — la tête de la série (`serie`, `prefixe`, `dernier`, `epoque`), clé
    `<organisationId>:bons-livraison` ;
  - `commande.commande.validee@1` — la commande validée, **sans prix ni identité de freelance** : point de vente,
    nœud, canal, bons (numéro, point de stock, lignes et quantités).
  Schémas dans `contrat/schemas/` de `ventes`, enregistrés dans Karapace sur `<topic>-value` en BACKWARD (modèle fermé :
  un ajout facultatif reste compatible ; un renommage passe par un `@2`). **Manifeste `commande` amendé** (C5) : `+
  commande.engagement-tiers.changed@1` et `+ commande.serie.changed@1`, faits « nouveaux » d'AD-20 ; recopié à
  l'octet dans `ventes`. `commande.commande.chiffree@1`, `.changed@1`, `.annulee@1`, `.remise.decidee@1`,
  `.derogation.accordee@1`, `.bon-livraison.livre@1` ne sont **pas** publiés ici.
- **D-1056-9 — La copie de `contrats/distributeur/`** : `src/index.ts` et `catalogue-faits.json` à l'étiquette
  `contrats-distributeur-v1` (`baa38dd`), à l'octet, dans `src/socle/contrats-distributeur/` (empreintes figées par un
  test). La copie d'`acces.ts` (`acces-distributeur-v1`, STORY-1053) est un autre fichier de la même source : elle ne
  change pas, aucune copie n'est en double. `verifierFaitsDuModule` est rejoué sur les quatre manifestes, et chaque topic
  publié par l'outbox doit être au manifeste et au catalogue sous le publieur `commande`.
- **D-1056-10 — Tant que `stock` n'est pas branché** : l'adaptateur reste `ReservationStockNonBranchee` (motif
  `RESERVATION_NON_BRANCHEE`) : la validation est acquise, l'engagement compté, mais **aucun bon n'est émis** et la
  commande reste `BROUILLON` avec son acte (échec fermé : jamais un `BL-` sans réservation). Pour la recette, une
  variable choisit un adaptateur de recette, `COMMANDE_RESERVATION_STOCK=recette` (**refusée au démarrage en
  production**), qui réserve toute ligne, idempotent par clé (`commande_reservations_de_recette`).
- **D-1056-11 — Tant que la Créance n'est pas branchée** : rien ne change depuis 1049 (`ENCOURS_NON_INSTALLE`) ; la
  recette pose les sources à la main, comme 1049.
- **D-1056-12 — Routes et droits** (invariant de 1053 : chaque route déclare son droit) :
  `POST /api/v1/commande/commandes` ⇒ `commande:commande:saisir` ; `GET /api/v1/commande/commandes` et
  `GET /api/v1/commande/commandes/{commandeId}` ⇒ `commande:reseau:consulter` ou `commande:portefeuille:consulter`
  (filtrés par la portée de lecture ; hors portée, 404 `COMMANDE_INCONNUE`) ; la validation et la reprise gardent
  `commande:commande:valider`. Canaux servis : `BUREAU`, `TELEPHONE`, `WHATSAPP` (le message du client peut être collé,
  FR-38), `COMPTOIR` ; `TERRAIN` (qui naît `TRANSMISE`) est refusé `CANAL_NON_SERVI` jusqu'à la commande (2).
- **D-1056-13 — Codes neufs de `commande`** : `COMMANDE_INCONNUE` (404), `COMMANDE_DEJA_SAISIE` (409, même
  `commandeId` sous une autre clé), `POINT_DE_VENTE_INCONNU` (409), `PDV_HORS_PERIMETRE` (403), `ARTICLE_SANS_PRIX`
  (409), `UNITE_NON_VENDUE` (409), `COMMANDE_SANS_LIGNE` (400), `CANAL_NON_SERVI` (400), `TRANSITION_INTERDITE` (409).
  Ceux de la spine gardent son sens.

## Ce qui reste pour la commande (2) (remplaçante du lot)

`TRANSMISE` (commande terrain et WhatsApp transmis, `PRIX_CHANGE`, `COMMANDE_PROBABLEMENT_DOUBLE`) ; modifier et
annuler (FR-35 : delta de réservation, bons `ANNULE` qui gardent leur numéro, historique en lecture seule, motifs) ; la
remise et sa décision (`REMISE_AU_DESSUS_DU_SEUIL`, `commande.remise.decidee@1`) ; la dérogation au plafond
(`commande:plafond:deroger`, `commande.derogation.accordee@1`) ; le numéro `CMD-` de la commande (FR-30) ;
`commande.commande.chiffree@1`, `.changed@1`, `.annulee@1` ; la marge (coût de `stock`) ; la livraison et le reliquat
(`livre@1`, `AVEC_ECART`, FR-41) ; l'allocation du matin (FR-220) ; le PDF du bon ; les alertes à N jours ; les
consommateurs qui rempliront `commande_points_de_vente`, `commande_prix`, `commande_plafonds` (pdv, catalogue) et
l'API de réservation de `stock` ; la rétention sans expiration du topic `commande.serie.changed` (réglage du broker).

## Preuves

(à écrire)
