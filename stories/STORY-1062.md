# STORY-1062 : la commande (2) — le numéro `CMD-`, la commande transmise du terrain (`TRANSMISE`, `PRIX_CHANGE`, `COMMANDE_PROBABLEMENT_DOUBLE`), l'annulation, et le défaut de concurrence de `commande` corrigé

Status: done

**Épic :** EPIC-228 (la commande : saisie, validation, bon de livraison et prise de commande sur le terrain) ; EPIC-230
pour ce que `facturation` fait d'une commande annulée · **Dépôt :** `prospera-ventes-service` (modules `commande` et
`facturation`) ; `prospera-stories` (manifeste `facturation`, C5) · **Plage :** groupe D, n° 3 du lot 4
(`PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4). **Dépend de :** STORY-1056 (la commande (1), `ventes` `dev` 10b8ba5 →
7221f4c), livrée ; STORY-1059 et 1061 (la facture juste (1) et (2)), livrées. **Suivante :** STORY-1063 🚚 (les
référentiels du distributeur côté réseau).

**Sources :** fiche STORY-1056 (« Ce qui reste pour la commande (2) ») et passation du journal de D (« La commande (1) »,
« Ce qui reste », (2)) ; fiche STORY-1061 (D-1061-13 : le défaut latent nommé dans `commande`) ; PRD distributeur FR-30
(« le numéro `CMD-AAAA-NNNNNN` est attribué à l'enregistrement du brouillon ; deux créations simultanées reçoivent deux
numéros distincts »), FR-31, FR-33, FR-34, FR-35 (modifier, annuler, motifs, bons `ANNULE` qui gardent leur numéro, une
commande facturée ne s'annule pas), FR-37 (commande terrain, `TRANSMISE`, idempotence par l'identifiant de l'appareil) ;
spine distributeur AD-3, AD-4, AD-5, AD-8 (« l'annulation d'une commande libère par la même API »), AD-9 (« l'annulation
d'un reliquat baisse l'engagement, sur son fait »), AD-12, AD-13 (« le prix d'une ligne est celui du serveur à la
validation ; l'appareil envoie la `grilleVersion` affichée ; périmée, la commande reste `TRANSMISE` avec l'écart
`PRIX_CHANGE` ; deux commandes `TRANSMISE` identiques dans une fenêtre paramétrée sont refusées
`COMMANDE_PROBABLEMENT_DOUBLE` »), AD-20, AD-27, AD-30, AD-34 ; EPIC-228 (« fini quand ») ; manifestes `commande` (M08 :
`commande.commande.annulee@1` publié, `commande:commande:annuler`) et `facturation` (M09) ; table d'accès d'`auth`
(`commande:commande:annuler` = DC, RESP_VENTES, COMPTABLE).

## Le découpage : ce que cette story prend, et pourquoi

La commande (2) nommée en 1056 tient en dix sujets ; une story en prend une tranche cohérente : **la vie de la commande
avant la livraison**, qui ne suppose ni `entrepot` ni `stock` ni `pdv` :

1. **le numéro `CMD-`** à l'enregistrement (FR-30) ;
2. **la commande prise sur le terrain** : `TRANSMISE`, l'écart `PRIX_CHANGE` et sa confirmation, le refus
   `COMMANDE_PROBABLEMENT_DOUBLE` (FR-37, AD-13) — le contrat dont l'application terrain a besoin ;
3. **l'annulation** (FR-35) : sans elle, une commande validée par erreur garde son engagement (et bloque le crédit du
   client) pour toujours ; et ce que `facturation` en fait (une commande annulée ne se facture pas) ;
4. **le défaut de concurrence nommé par D-1061-13** dans `commande` et `facturation` (décision du groupe), prouvé
   d'abord par un test rouge.

La livraison et le reliquat (`entrepot`, `livre@1`), l'allocation du matin (réservation par `stock`), la remise, la
dérogation et la modification forment les tranches suivantes (D-1062-12). **La facture par livraison** reste donc
après : cette story ne crée pas la livraison ; ce que la facture en lira est celui que nomme déjà 1059
(`commande.bon-livraison.livre@1`, `livraisonId`, quantités de cette livraison, clé `<livraisonId>:facture`).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 4, règles, journaux de A, B, C, D (aucune demande neuve à D), fiches 1056, 1059, 1061,
  épic, spine, PRD, manifestes, table d'accès d'`auth`.
- [x] Code sur `MNV-1062` (`ventes`) : 7e47ab6 (test rouge), ed9985a (correctif), 8693a3a (la commande (2)) ; tsc, lint
  des fichiers touchés, unitaires et mutations pures verts sous Node 25.
- [x] Annonce « ⚠ Contrats » fusionnée avant le code : prospera-stories **#698** (`main` `b8c2718`), avec le manifeste
  `facturation` amendé.
- [x] Manifeste recopié à l'octet dans `ventes` ; preuves sous le verrou Docker (une seule prise, 20:39 → 21:43).
- [x] PR `ventes` **#11** fusionnée en rebase (`dev` `339a1ad` → `f49f3a6`) ; PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le défaut de D-1061-13 est prouvé, puis corrigé** : dix états concurrents d'une même Créance (`ProjectionDuCredit.plusHauteRevision`, Créance et crédit du tiers) et dix rangs concurrents d'une même commande chiffrée (`CommandesChiffrees.appliquer`), sur douze objets, gardent la plus haute révision partout ; le test est **rouge** sur le code d'avant, vert après ; une mutation qui remet « clé dupliquée = ignoré » rougit | MongoDB réel (avant, après) ; mutations |
| AC-2 | **`CMD-AAAA-NNNNNN`** est tiré à l'enregistrement (brouillon ou transmise), dans la transaction qui écrit la commande (série `commandes`, tête `commande.serie.changed@1`) ; vingt saisies parallèles : vingt numéros distincts et continus ; une saisie refusée ou un rejeu n'engage aucun numéro | MongoDB réel ; pile |
| AC-3 | **La commande terrain** (canal `TERRAIN`) naît `TRANSMISE`, avec la visite et la version de grille affichée de chaque ligne (exigée : `GRILLE_VERSION_MANQUANTE`) ; elle se valide comme un brouillon | MongoDB réel ; pile |
| AC-4 | **`PRIX_CHANGE`** : une version affichée qui n'est pas celle du serveur, ou un prix changé entre la transmission et la validation, laisse la commande `TRANSMISE` avec l'écart (avant, après, ligne à ligne) ; la validation est refusée 409 `PRIX_CHANGE` tant que le prix n'est pas confirmé **à la révision lue** (`prixConfirmes.revision`) ; une commande du bureau garde son prix figé à la saisie (FR-31) | MongoDB réel ; pile |
| AC-5 | **`COMMANDE_PROBABLEMENT_DOUBLE`** : une commande terrain identique (même auteur, même visite, même point de vente, mêmes lignes) dans la fenêtre (paramètre `fenetreCommandeDoubleMinutes`, 30 par défaut) est refusée, la première nommée, sans numéro engagé ; cinq transmissions identiques simultanées : une seule passe | MongoDB réel ; pile |
| AC-6 | **L'annulation** (`POST /api/v1/commande/commandes/{commandeId}/annulation`, `commande:commande:annuler`) : motif de la liste (`AUTRE` exige un texte) ; la commande passe `ANNULEE`, ses bons `ANNULE` (un bon émis **garde son numéro**), l'engagement du tiers baisse du TTC si elle avait un acte, `commande.commande.annulee@1` part, la piste trace ; les réservations sont rendues à `stock` ; rejeu sans effet ; `COMMANDE_DEJA_ANNULEE`, `COMMANDE_FACTUREE`, `TRANSITION_INTERDITE`, portée | MongoDB réel ; pile |
| AC-7 | **`facturation`** lit `commande.commande.annulee@1` et refuse de facturer la commande (`COMMANDE_ANNULEE`, aucun numéro `FAC-` engagé) ; la facture émise dans la fenêtre ne rebaisse pas l'engagement (anomalie tracée) | MongoDB réel ; pile (fait lu sur Kafka) |
| AC-8 | **Contrats** : `commande.commande.annulee@1` au registre ; `commande.serie.changed@1` relâché (énumérations retirées) **compatible BACKWARD** ; manifeste `facturation` amendé (C5) et recopié à l'octet ; chaque route neuve déclare son droit ; Node 24 (tsc, lint, build, unitaires, e2e, intégration) ; mutations rouges sur l'assertion ; `docker compose up` sain ; rejoué depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1062-1 — Le numéro `CMD-` : une série de `commande`, tirée dans la transaction de la commande.** Série
  `commandes`, préfixe `CMD-`, format `CMD-AAAA-NNNNNN` (l'année de l'enregistrement, UTC ; le rang continu sur six
  chiffres au moins, jamais remis à 1), tirée par `NumerotationDesSeries.emettreDansUneTransaction` comme `BL-` : la
  commande, sa tête (`commande.serie.changed@1`, clé `<org>:commandes`) et la ligne de piste sont acquittées ensemble.
  Une transaction annulée (rejeu concurrent, commande probablement double) n'engage pas le numéro (D-1052-6). Index
  unique partiel `(organisation, numero)`. Une commande enregistrée avant 1062 n'a pas de numéro (`null` à la lecture et
  dans les faits). Le numéro `CMD-` n'est pas une pièce fiscale (AD-5 réserve la reprise de Sage aux séries de
  `facturation`) : il démarre à 0.
- **D-1062-2 — La tranche** : voir « Le découpage ».
- **D-1062-3 — La commande terrain** : `POST /api/v1/commande/commandes` avec `canal: TERRAIN` (droit
  `commande:commande:saisir`, portée d'écriture sur le nœud du point de vente, comme au bureau) ; elle naît `TRANSMISE`
  (le commercial transmet, il ne valide pas, AD-3). Elle porte `visiteId` (facultatif) et, pour chaque ligne,
  `grilleVersion` (la version que l'appareil affichait), exigée : sans elle, 400 `GRILLE_VERSION_MANQUANTE`.
  L'identifiant né sur l'appareil reste la clé (AD-4, AD-13) : la même commande retransmise sous une autre clé est
  `COMMANDE_DEJA_SAISIE`, jamais un double. Le contrôle de plafond en avertissement à la saisie (FR-37) reste à l'écran.
- **D-1062-4 — `PRIX_CHANGE`** (AD-13). Le prix d'une ligne est toujours celui du serveur (l'appareil n'en envoie pas).
  (1) À la transmission, une ligne dont la version affichée n'est pas celle de la grille du serveur ouvre l'écart
  (`grilleVersionAvant` = l'affichée, `prixUnitaireHtMineurAvant` = `null`). (2) À la validation d'une commande
  `TRANSMISE`, les lignes sont relues dans la grille : un prix (ou sa version, son taux, son origine) changé depuis
  fait prendre à la commande les prix du serveur (révision suivante, totaux recalculés, piste `PRIX_CHANGE`) et refuse la
  validation avec l'avant et l'après de chaque ligne. (3) Un écart non confirmé exige `prixConfirmes: { revision }` égale
  à la révision de la commande lue (rendue par le refus et par la lecture) : on ne confirme que ce qu'on a vu. La
  confirmation est écrite dans la transaction de l'acte (`confirmeLe`, `confirmePar`). Une commande du bureau garde son
  prix figé à la saisie (FR-31) : aucune relecture.
- **D-1062-5 — Valider une commande `TRANSMISE`** se fait comme un brouillon (FR-33 : « une commande `BROUILLON` ou
  `TRANSMISE` »), mêmes garde-fous ; l'acte est lié à la commande **à la révision jugée** (un prix changé entre la
  lecture et l'acte fait refuser l'acte, rien n'est écrit).
- **D-1062-6 — `COMMANDE_PROBABLEMENT_DOUBLE`** (AD-13). Une commande terrain a une empreinte de contenu (auteur, visite
  ou son absence, point de vente, lignes dans un ordre canonique : article, point de stock, quantité, unité). Une autre
  commande non annulée de même empreinte enregistrée dans la fenêtre est refusée 409, la première nommée (`commandeId`,
  `numero`, `transmiseLe`, `fenetreMinutes`). Le contrôle se fait **dans la transaction du numéro** : deux transmissions
  simultanées se heurtent sur le compteur de la série, et la seconde, rejouée, voit la première. La fenêtre est un
  paramètre de `commande` (AD-12) : **`fenetreCommandeDoubleMinutes`**, 30 par défaut, de 1 à 1 440, **facultatif à la
  pose** (une version écrite avant 1062 se lit avec 30 ; la forme de 1049 reste acceptée). « Passage par un rôle » :
  aucun forçage côté terrain ; le bureau saisit lui-même la seconde commande s'il faut la doubler.
- **D-1062-7 — L'annulation** (FR-35). `POST /api/v1/commande/commandes/{commandeId}/annulation`, droit
  `commande:commande:annuler` (DC, RESP_VENTES, COMPTABLE : un commercial n'annule pas), `Idempotency-Key` exigée, corps
  `{ motif, texte? }` : `CLIENT_ANNULE`, `ERREUR_DE_SAISIE`, `RUPTURE`, `PLAFOND_DE_CREDIT`, `AUTRE` (texte exigé, sinon
  400 `MOTIF_A_PRECISER`). Une transaction : la table des transitions de la commande doit permettre `→ ANNULEE`
  (`BROUILLON`, `TRANSMISE`, `VALIDEE` ; `PREPARATION` quand `entrepot` existera) ; une facture projetée refuse
  (`COMMANDE_FACTUREE`, AD-3 : un avoir) ; l'engagement baisse du TTC si un acte existe (borné au restant, sous condition
  de sa révision, son état absolu publié) ; chaque bon passe `ANNULE` (un bon émis garde son numéro, la série ne recule
  pas, le numéro n'est jamais réémis) ; la commande passe `ANNULEE` avec son annulation (motif, texte, auteur, date,
  statut d'avant, engagement rendu) ; `commande.commande.annulee@1` part. Le rejeu (même clé, même demande) rend la même ;
  la même clé pour un autre motif : `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` ; une autre clé : 409 `COMMANDE_DEJA_ANNULEE`.
  Hors lecture : 404 ; lue mais hors écriture : 403 `HORS_PORTEE`. Annuler une commande `PREPARATION` (le responsable
  stock) viendra avec `entrepot`.
- **D-1062-8 — Les réservations rendues à `stock`** (AD-8, AD-34). Le port `ReservationStock` gagne `liberer` (même clé
  `<bonId>:<ligne>`, idempotent) ; après la transaction, chaque ligne réservée d'un bon annulé est rendue (`A_LIBERER` →
  `LIBEREE`) ; une ligne non rendue garde son motif et le rejeu de l'annulation la rend (la réponse dit `liberations`).
  La saga de validation ne réserve plus que les bons `EN_ATTENTE_RESERVATION`, et une réservation obtenue pour un bon
  annulé pendant l'appel est rendue aussitôt : jamais une réservation sans bon vivant (au pire, `stock` la libère seul
  après son délai). Adaptateur non branché : rien n'est réservé, rien à rendre ; adaptateur de recette : il supprime.
- **D-1062-9 — Les contrats** (AD-27) : `commande.commande.annulee@1` (déjà au manifeste `commande` et au catalogue),
  schéma neuf : `commandeId`, `numero` (`CMD-` ou `null`), `pointDeVenteId`, `noeudId`, `canal`, `statutAvant`, `motif`,
  `bons` (`bonId`, `numero` `BL-` ou `null`, `pointDeStockId`), `annuleeLe`, `rang` ; **ni prix, ni montant, ni texte
  libre** (AD-3). `commande.serie.changed@1` : les énumérations de `serie` (`bons-livraison`) et de `prefixe` (`BL-`)
  sont **retirées** (une série de plus n'est pas un renommage ; un retrait est BACKWARD, piège 1061-3).
- **D-1062-10 — `facturation` ne facture pas une commande annulée** : le groupe `ventes-service.commandes-chiffrees`
  lit aussi `commande.commande.annulee@1` (projection `facturation_commandes_annulees`, à part de la commande chiffrée :
  les deux faits n'ont pas d'ordre garanti) ; `POST /facturation/factures` est refusé 409 `COMMANDE_ANNULEE`, contrôlé
  aussi **dans** la transaction du numéro (aucun `FAC-` engagé). **Manifeste `facturation` amendé (C5)** : + consommé
  `commande.commande.annulee@1`.
- **D-1062-11 — La fenêtre entre les deux modules** : une facture émise avant que `facturation` sache l'annulation, et
  une annulation passée avant que `commande` sache la facture, peuvent coexister (deux services, aucun « même instant »,
  AD-7). Alors la Créance de cette facture **ne rebaisse pas** l'engagement (l'annulation l'a déjà rendu) : la facture
  est marquée soldée avec une baisse de 0, l'anomalie `FACTURE_D_UNE_COMMANDE_ANNULEE` est journalisée et tracée ; elle
  se corrige par un avoir (à venir). Jamais un engagement compté zéro fois.
- **D-1062-12 — Ce qui reste (la commande (3) et suivantes)**, dans l'ordre conseillé :
  1. **modifier une commande** (FR-35 : `BROUILLON`, `TRANSMISE`, `VALIDEE` non commencée ; delta de réservation
     `<commandeId>:<version>:<ligne>`, la commande non comptée deux fois au plafond, historique champ par champ) ;
  2. **la livraison et le reliquat** (avec `entrepot` : confirmation par `livraisonId`, `AVEC_ECART`, `LIVRER_PLUS_TARD`
     / `ANNULER_LE_RELIQUAT`, `commande.bon-livraison.livre@1`), puis **la facture par livraison** et `SANS_BON` côté
     `facturation` (D-1061-12, 3) ;
  3. **l'allocation du matin** (FR-220, quand `stock` réserve) ; la remise et sa décision (`REMISE_AU_DESSUS_DU_SEUIL`,
     `commande.remise.decidee@1`) ; la dérogation au plafond (`commande:plafond:deroger`,
     `commande.derogation.accordee@1`) ;
  4. `commande.commande.changed@1` (état absolu, aucun consommateur encore) ; le numéro `CMD-` dans les faits
     `validee`/`chiffree` (ajout facultatif) quand un consommateur le demande ; la marge (coût de `stock`) ; le PDF du bon ;
     les alertes à N jours ; annuler une commande `PREPARATION` ; l'avoir qui corrige la facture d'une commande annulée
     (D-1062-11).
- **D-1062-13 — Le défaut de D-1061-13, prouvé puis corrigé** (décision du groupe) : le test
  `projections-concurrentes.int-spec.ts` (douze objets, dix états concurrents chacun, dans le désordre) est commité
  **avant** la correction (7e47ab6) et joué rouge sur ce commit ; la correction (ed9985a) reprend celle de 1061 :
  la clé dupliquée de l'upsert est rejouée (trois essais), la révision tenue décide.

## Ce qui a été livré

**2026-11-18** — après l'annonce « ⚠ Contrats » (prospera-stories **#698**, `main` `b8c2718`), une PR fusionnée en « Rebase
and merge » :

- `prospera-ventes-service` **#11** (`dev` **`339a1ad`** (test rouge), `b9a82a6` (correctif), `826105e` (la commande (2)),
  `7cc143b` (manifeste), `46fc30f` (contrat), `805b63c`, `73b7a82`, `cb92e24`, **`f49f3a6`** ; tête de la branche
  `bd99c8f` vérifiée `open` et égale au SHA poussé avant la fusion) :
  - `src/modules/commande/commandes/` : `commandes.service.ts` (le numéro `CMD-` dans la transaction de la commande, le
    canal `TERRAIN`, `PRIX_CHANGE`, `COMMANDE_PROBABLEMENT_DOUBLE`, la validation d'une `TRANSMISE`), `annulation.service.ts`
    (`AnnulationDesCommandes`), `numero-de-bon.ts` (`numeroDeCommande`), `schemas.ts` (numéro, visite, écart de prix,
    annulation ; index), `dto.ts`, `commandes.controller.ts` (route d'annulation) ;
  - `garde-fous/` : `liberer` au port `ReservationStock` ; la saga ne réserve que les bons en attente et rend une
    réservation obtenue pour un bon annulé ; bon `ANNULE` ; paramètre `fenetreCommandeDoubleMinutes` ;
  - `credit/projection-du-credit.service.ts` : la plus haute révision gardée sous concurrence ; la facture d'une commande
    annulée ne rebaisse pas l'engagement ;
  - `facturation/` : `CommandesChiffrees.appliquer` corrigé, `commande.commande.annulee@1` lu
    (`facturation_commandes_annulees`), `COMMANDE_ANNULEE` ; manifeste recopié (`b8c2718`) ;
  - `contrat/schemas/commande.commande.annulee.json` (neuf), `commande.serie.changed.json` (énumérations retirées) ;
  - **recette versionnée** : `scripts/recette/1062/` (`pile-1062.yml`, `emetteur-de-test.mjs`, `recette-1062.py`,
    `mutations-1062.mjs`, `README.md`).
- **Écart à l'annonce : aucun.**

## Preuves

- **Le défaut de D-1061-13, rouge puis vert** (MongoDB 8 en jeu de répliques, image `verification` du commit
  `7e47ab6`, test seul, sans la correction) : trois passages, **rouges sur l'assertion** (facturation 3/3, commande 2/3 :
  « Expected revision: 10 » reçu plus bas). Après la correction : cinq passages verts. La course réelle ne montrant pas le
  défaut à chaque passage (une mutation a survécu une fois), deux tests **déterministes** jouent l'écrivain concurrent dans
  l'appel (la ligne d'un état plus ancien créée juste avant que l'upsert du plus récent heurte sa clé) : la mutation
  « clé dupliquée = ignoré » rougit à chaque passage (4/4 sur deux passages par module).
- **Node 24** (étage `verification`, export `git -c core.autocrlf=false archive`) : `tsc` ; build ; lint de `src` et `test`
  (`endOfLine auto`, `--max-warnings 0`) ; **unitaires : 57/57 suites, 599 tests** (569 avant) ; **e2e : 2/2, 24** ;
  **intégration sur MongoDB réel : 13/13 suites, 150 tests** (123 avant), dont `commande-2.int-spec.ts` (21) et `projections-concurrentes.int-spec.ts` (6) : `CMD-2026-000001`
  puis `000002` et leurs têtes conformes ; vingt saisies parallèles, vingt numéros continus ; rejeu, refus et dix rejeux
  simultanés sans numéro de plus ; terrain `TRANSMISE` puis `VALIDEE` ; grille affichée périmée (`PRIX_CHANGE`, refus
  sans confirmation et à une autre révision, validée à la sienne) ; grille changée avant la validation (prix du serveur
  pris, 356 360 TTC, avant/après, piste, engagement au nouveau TTC) ; prix figé du bureau ; `COMMANDE_PROBABLEMENT_DOUBLE`
  (fenêtre, autre membre, autre visite, paramètre à 5 min, jumelle annulée) ; **cinq transmissions identiques
  simultanées : une seule passe** ; annulation d'un brouillon, d'une commande validée (bons `ANNULE` qui gardent
  `BL-2026-000001`, engagement 344 560 → 0, deux réservations rendues, le numéro suivant `BL-2026-000002`), d'un acte en
  attente (reprise sans réservation) ; rejeu et refus ; `COMMANDE_FACTUREE` sans écriture ; **cinq annulations
  simultanées : une** ; **annulation pendant la réservation** : réservation rendue, aucun `BL-` ; panne de `stock` à la
  libération, puis rejeu ; portée ; `COMMANDE_ANNULEE` chez facturation (aucun `FAC-`) ; la facture d'une commande
  annulée dans la fenêtre : baisse 0, anomalie tracée.
- **Mutations : 5/5 pures et 17/17 sur MongoDB réel, rouges sur une assertion** — numéro sur cinq chiffres, empreinte
  dépendante de l'ordre, pose sans la fenêtre refusée, fenêtre lue à 0, annulation sans date lue ; clé dupliquée =
  ignoré (commande, facturation) ; numéro tiré dans la série des bons ; double non cherché ; fenêtre ignorée ; jumelle
  annulée comptée ; prix changé ignoré ; confirmation à une autre révision ; engagement non rendu ; numéro du bon perdu ;
  commande facturée annulée ; annulation concurrente non vue ; réservations non rendues ; réservation orpheline gardée ;
  reprise qui réserve un bon annulé ; facture d'une commande annulée ; engagement rebaissé.
- **Karapace 6.2** : les schémas d'`origin/dev` d'avant la story enregistrés d'abord, puis ceux de la story :
  `commande.commande.annulee-value` nouveau sujet, `commande.serie.changed-value` **compatible BACKWARD** (énumérations
  retirées). **Témoin** (rencontré en chemin) : la même version avec un `minLength: 1` en remplacement était refusée
  `INCOMPATIBLE` — corrigée avant la fusion (`46fc30f`).
- **Pile `grp-d`** (`scripts/recette/1062/pile-1062.yml`, image de la branche) : `docker compose up` sain (modules Nest
  changés, §1.5) ; pilote **24/24** : transmission `TRANSMISE` `CMD-2026-000001` avec `PRIX_CHANGE`, 403 au commercial,
  409 sans confirmation, `VALIDEE` `BL-2026-000001` à la révision 1 ; `COMMANDE_PROBABLEMENT_DOUBLE` ;
  `GRILLE_VERSION_MANQUANTE` ; `CMD-2026-000002` (aucun numéro perdu) ; facture `FAC-2026-000001` ; 403 et
  `MOTIF_A_PRECISER` ; annulation (bon `ANNULE` qui garde son numéro, deux réservations rendues, engagement rendu) ;
  rejeu ; `COMMANDE_DEJA_ANNULEE` ; `COMMANDE_ANNULEE` (l'annulation lue sur Kafka) ; `COMMANDE_FACTUREE` (la facture lue
  sur Kafka) ; engagement 24 780 ; outbox vide ; `commande.commande.annulee`, `commande.serie.changed` (`CMD-` 1, 2 ;
  `BL-` 1, 2) et `commande.engagement-tiers.changed` (344 560, 369 340, 24 780) lus sur Kafka.
- **Rejeu sur les images reconstruites depuis `origin/dev`** (`f49f3a6`, `--no-cache`, volumes neufs) : registre (avant,
  puis la story : BACKWARD), pilote **24/24** ; sous Node 24 : unitaires **57/57 suites, 599**, e2e **2/2, 24**,
  intégration **13/13 suites, 150**, **mutations 5/5 et 17/17**.
- `git diff --stat` = `--ignore-cr-at-eol` à chaque commit ; aucun `index.ts` non suivi.
- **Verrou Docker** : libre au rituel ; **pris à 20:39** (`D STORY-1062`), une seule prise, **rendu à 21:43** après
  `down -v` ; aucun conteneur, volume ni réseau `grp-d` ne reste.
