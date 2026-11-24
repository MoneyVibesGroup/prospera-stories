# STORY-1066 : l'avoir — annuler tout ou partie d'une facture émise, sous un numéro `AV-` continu, avec son fait, son PDF « Avoir » et la validation du DAF au-delà du seuil

Status: done

**Épic :** EPIC-230 (la facturation : la facture juste, l'avoir, la proforma et le lien public) ; FR-43 (la suite des
avoirs), FR-45, FR-48, FR-217 (la suite reprise, par série) · **Dépôt :** `prospera-ventes-service` (module
`facturation`) ; manifeste `facturation` amendé à la source (C7, version **1.1.0**) ; aucun contrat partagé de
`prospera-plateforme` · **Plage :** groupe D, n° 2 du lot 6 (`PLAN-LOT-6-2026-11-23.md` §6). **Dépend de :** STORY-1059,
1061 et 1065 (la facture juste (1) à (3), `ventes` `dev` 1c1e944 → 5929438), livrées. **Suivante :** STORY-1067 (la
commande (3), `ventes`).

**Sources :** l'ordre de D-1061-12 (« (2) l'avoir (`AV-`, `AVOIR_SUPERIEUR_A_LA_FACTURE`, `facturation.avoir.emis@1` ;
demande à B pour son consommateur dans `paiement`) ») ; D-1065-14 (« (1) l'avoir : `AV-`, son PDF « Avoir » avec la
référence de la facture ») et **D-1065-15** (la version du manifeste `facturation` monte avec cette story, réponse à
D-979-7 de B) ; plan du lot 6 §6, ligne 2 (« fini quand : un avoir annule tout ou partie d'une facture, numérotation
suivie ») ; PRD distributeur FR-43 (« les avoirs ont leur propre suite continue » ; largeur par défaut de l'avoir : 6),
FR-44 (« le texte indique « Avoir » pour un avoir »), FR-45 (« la même règle sert la facture, l'avoir et la
proforma »), **FR-48**, FR-49 (`ANNULEE_PAR_AVOIR`), FR-217 (« le dernier numéro émis sous Sage, PAR SÉRIE (facture,
avoir, proforma) ») ; spine distributeur AD-4 (« avoir = `<factureId>:avoir:<demandeId>` »), AD-5, AD-6 (« une erreur se
corrige par un avoir (total ou partiel, numéro propre, au plus le reste à créditer, au-delà de 500 000 XOF validation du
DAF) »), AD-7 (« `facturation.avoir.emis@1` (réduit, ou crée un crédit du tiers au-delà du reste dû) »), AD-12, AD-21,
AD-22, AD-29, AD-30, AD-31 ; manifeste `facturation` (M09 : droit `facturation:avoir:emettre` « avoir complet ou partiel,
par taux », fait `facturation.avoir.emis@1` « réduit la Créance, ou crée un crédit du tiers sur une facture payée ») ;
catalogue des faits `contrats-distributeur-v1` (`facturation.avoir.emis@1`, « société et RVC- ; HT crédité par ligne ») ;
table d'accès d'`auth-service` (`facturation:avoir:emettre` = `COMPTABLE`, `DAF`) ; `prospera-paiement-service` lu
seulement (aucun consommateur d'avoir à ce jour).

## Le découpage : ce que cette story prend, et pourquoi

« Fini quand : un avoir annule tout ou partie d'une facture, avec une numérotation suivie ». Cinq sujets, qui ne
demandent ni livraison ni `entrepot` :

1. **L'avoir et ses montants** (FR-48, FR-45) : total, par lignes de la facture, ou montant libre ; motif obligatoire ;
   jamais plus que le reste à créditer, **taux par taux** (`AVOIR_SUPERIEUR_A_LA_FACTURE`).
2. **Sa numérotation** (FR-43, AD-5) : une série `avoirs` propre, `AV-AAAA-NNNNNN`, tirée dans la transaction de l'avoir,
   avec sa tête publiée et sa suite reprenable de Sage (FR-217, par série).
3. **Son fait** (AD-7) : `facturation.avoir.emis@1`, que `paiement` consommera pour réduire la Créance (demande à B).
4. **Son PDF « Avoir »** (FR-44, FR-46, FR-48), figé comme celui de la facture.
5. **La validation du DAF au-delà du seuil** (FR-48, AD-6 : 500 000 XOF, paramètre) et la facture `ANNULEE_PAR_AVOIR`.

**N'entre pas dans cette story** (D-1066-14) : la réduction de la Créance et le crédit du tiers (chez `paiement`, B) ;
les statuts `IMPUTE` et `REMBOURSE` de l'avoir (lus du crédit du tiers de `paiement`, quand il les publiera) ; la
proposition d'entrée en stock d'un retour (AD-29 : par `entrepot`, qui n'existe pas) ; la demande d'avoir d'un comptable
validée ensuite par le DAF (circuit à deux personnes) ; l'interrupteur `avoir-automatique-sur-annulation` ;
`facturation.facture.changed@1` ; le lien public et l'envoi d'un avoir ; les avoirs du freelance (AD-31) ; la liste de
tous les avoirs de l'organisation (avec la liste des factures, D-1061-12 (4)).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 6, règles, journaux de A, B, C, D (aucune demande neuve à D pour le distributeur ; la
  réponse de B à 1065, D-979-7, est celle que D-1065-15 sert ici), fiches 1059 → 1065, épic, spine, PRD, manifeste,
  table d'accès d'`auth`, code de `paiement` (aucun consommateur d'avoir).
- [x] Annonce « ⚠ Contrats » fusionnée avant le code : prospera-stories **#782** (`main` **`24049e4`**) ; manifeste
  `facturation` **1.1.0** à la source.
- [x] `ventes` : PR **#14** fusionnée en rebase (`dev` **`d9f4264`**, `2937af8`, `e9f77dd`, **`adaa2bb`**).
- [x] Verrou Docker : libre ; **pris à 09:20**, une seule prise, **rendu à 09:58** ; aucun conteneur, volume
  ni réseau `grp-d`.
- [x] PR de docs finale (fiche `done`, tracker, journal : demande → B avec le SHA du manifeste à recopier, `24049e4`).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Émettre un avoir** : `POST /api/v1/facturation/factures/{factureId}/avoirs` (`facturation:avoir:emettre`, `Idempotency-Key`) `{ motif, texte?, nature: TOTAL \| LIGNES \| MONTANT, lignes?, montant? }` ⇒ 201 l'avoir (`AV-`, lignes créditées, HT, TVA par taux, TTC, facture et son numéro, cumul et reste à créditer) ; rejeu : le même avoir (200) ; même clé, autre charge : 409 `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` ; corps incohérent : 400 `AVOIR_INVALIDE` (`details.erreurs`), rien d'écrit | unitaires ; MongoDB réel (HTTP) ; pile |
| AC-2 | **Jamais plus que la facture, taux par taux** : par ligne (HT crédité ≤ HT de la ligne), par taux (base et TVA cumulées ≤ celles de la facture), en TTC ; au-delà : 409 `AVOIR_SUPERIEUR_A_LA_FACTURE` (`details` : ce qui dépasse, et le reste à créditer), **aucun numéro consommé** ; la TVA d'un avoir qui solde un taux est le reste exact de ce taux (le cumul égale la facture au franc) ; deux avoirs simultanés qui ensemble dépasseraient : un seul passe | unitaires ; MongoDB réel (concurrence) ; pile |
| AC-3 | **La numérotation suivie** : série `avoirs`, `AV-AAAA-NNNNNN` depuis 1, continue, distincte de `FAC-` ; tirée dans la transaction de l'avoir (un refus ne crée aucun trou) ; tête `facturation.serie.changed@1` (`serie: avoirs`, `prefixe: AV-`) ; la suite des avoirs se reprend de Sage, une fois, comme celle des factures (`PUT /api/v1/facturation/numerotation/avoirs`) ; `GET /api/v1/facturation/numerotation` rend les deux séries ; vingt avoirs en parallèle : vingt numéros consécutifs | unitaires ; MongoDB réel ; pile |
| AC-4 | **Le fait** `facturation.avoir.emis@1` (topic `facturation.avoir.emis`, clé `<organisationId>:<factureId>`) écrit dans la transaction de l'avoir (outbox), conforme à son schéma ; schéma neuf et `facturation.serie.changed` relâché (énumération de `serie` retirée) **compatibles BACKWARD au registre** | unitaires ; Karapace ; pile (fait lu sur Kafka) |
| AC-5 | **La facture annulée par avoir** : un avoir qui crédite tout le reste passe la facture `ANNULEE_PAR_AVOIR` (`statut` de la facture lue) ; un avoir partiel la laisse `EMISE` ou `PARTIELLE` ; la facture rendue porte `avoirs { nombre, HT, TVA, TTC crédités, resteACrediterTtcMineur }` ; après l'annulation, tout avoir neuf est refusé ; le document de la facture n'est pas modifié (AD-6) | MongoDB réel ; pile |
| AC-6 | **La validation du DAF au-delà du seuil** : un avoir dont le TTC dépasse `seuilValidationAvoirMineur` (paramètre de la facture, 500 000 par défaut, facultatif au `PUT`) exige le droit neuf `facturation:avoir:valider` ; sans lui : 403 `VALIDATION_DU_DAF_REQUISE` (`details` : seuil, montant), rien d'écrit, aucun numéro consommé | unitaires ; MongoDB réel (HTTP) ; pile |
| AC-7 | **Le PDF « Avoir »** : produit après l'émission, déterministe, polices embarquées, stocké (`facturation_pdfs_avoirs`) avant `PRODUIT` ; il porte « Avoir », son numéro, la référence et la date de la facture, le motif, les lignes créditées, HT, TVA par taux, TTC, les mentions de l'émetteur et du client de la facture ; `GET /api/v1/facturation/avoirs/{avoirId}/pdf` ; 409 `PDF_EN_ATTENTE`, 500 `PDF_ALTERE` | unitaires ; MongoDB réel ; pile (texte lu par `pdfjs`) |
| AC-8 | **Lire** : `GET /api/v1/facturation/avoirs/{avoirId}` et `GET /api/v1/facturation/factures/{factureId}/avoirs` (`facturation:facture:consulter`) ; hors portée : la même 404 que l'inconnu (`AVOIR_INCONNU`, `FACTURE_INCONNUE`) ; chaque avoir est tracé dans la piste du module (`EMISSION_D_AVOIR`) | MongoDB réel (HTTP) ; pile |
| AC-9 | Chaque route déclare son droit (invariant) ; manifeste recopié à l'octet (1.1.0) ; Node 24 (`verification`) : tsc, lint des fichiers touchés, build, unitaires, e2e, intégration ; mutations rouges sur l'assertion ; `docker compose up` sain (module Nest changé, §1.5) ; rejoué depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1066-1 — La tranche : l'avoir, sa suite, son fait, son PDF, le seuil du DAF.** Voir « Le découpage ». La
  réduction de la Créance est chez `paiement` : sans son consommateur, l'avoir est émis, numéroté, publié et imprimé,
  mais le reste dû lu chez `paiement` ne baisse pas encore (→ B, D-1066-13).
- **D-1066-2 — Trois natures d'avoir, un seul calcul** (FR-48 : « lignes de la facture (quantité et prix) ou un montant
  libre avec motif ») :
  - `TOTAL` : tout le reste à créditer, taux par taux (et ligne par ligne quand les avoirs précédents étaient tous par
    lignes) ;
  - `LIGNES` : `[{ ligne, quantite, prixUnitaireHtMineur? }]` — une ligne de la facture, une quantité entière de 1 à
    celle de la ligne, un prix HT de 1 au prix de la ligne (par défaut, celui de la ligne ; plus bas pour une erreur de
    prix) ; HT = quantité × prix ; une ligne au plus une fois par avoir ;
  - `MONTANT` : `{ montantHtMineur, tauxTvaPourDixMille }` — un HT libre, à l'un des taux de la facture.
  Le **motif est obligatoire** (les cinq de FR-48 : `RETOUR_DE_MARCHANDISE`, `ERREUR_DE_PRIX`, `REMISE_COMMERCIALE`,
  `LITIGE_DE_LIVRAISON`, `ERREUR_DE_FACTURATION`) ; `texte` facultatif (300 caractères au plus, imprimé). Un corps
  incohérent (ligne inconnue, quantité ou prix hors bornes, taux absent de la facture, nature sans ses champs, HT nul) :
  400 `AVOIR_INVALIDE`, chaque défaut nommé.
- **D-1066-3 — La TVA de l'avoir : la règle de FR-45, soldée au dernier franc.** Par taux : base = Σ HT crédités à ce
  taux ; TVA = arrondi au plus proche (moitié vers le haut, la règle de `commande`) de `base × taux`, **bornée au reste de
  TVA de ce taux** ; un avoir dont la base solde le taux prend **exactement** le reste de TVA de ce taux. Ainsi le cumul
  des avoirs ne dépasse jamais la facture, taux par taux, et l'égale au franc quand tout est crédité (sans cette règle,
  trois avoirs de 3, 3 et 1 F de base sur une facture de 7 F à 18 % créditeraient 2 F de TVA sur 1).
- **D-1066-4 — « Au plus le reste à créditer », jugé dans la transaction du numéro.** Le crédit de la facture est un
  document à part, `facturation_credits_des_factures` (un par facture : HT crédité par ligne, base et TVA par taux, TTC,
  nombre d'avoirs, révision) ; **la facture n'est pas modifiée** (AD-6 : figée). Il est créé hors de la transaction
  (idempotent, piège 1052-1 : deux transactions qui créent le même document ne se heurtent qu'à l'acquittement), puis
  lu et réécrit **dans** la transaction de l'avoir : deux avoirs simultanés se heurtent (conflit d'écriture), le second
  est rejoué par la transaction, voit le premier et passe ou est refusé. Un dépassement lève avant toute écriture : la
  transaction est annulée, **aucun numéro n'est consommé**. Le reste à créditer est `TTC de la facture − TTC des avoirs`
  (jamais un encaissement : `facturation` ne tient aucun solde, AD-6).
- **D-1066-5 — La série `avoirs`, `AV-AAAA-NNNNNN`.** Déclarée avec celle des factures ; format par défaut `AV-`, année,
  `-`, largeur 6 (FR-43 : « avoir 6 chiffres ») ; tirée par `emettreDansUneTransaction` (AD-5, AD-30) ; tête publiée sur
  `facturation.serie.changed@1` (`serie: avoirs`, `prefixe: AV-`). **La suite se reprend de Sage par série** (FR-217) :
  la route de 1061 accepte `avoirs` (`PUT /api/v1/facturation/numerotation/avoirs`, mêmes règles : une fois, avant le
  premier avoir, `SUITE_DEJA_REPRISE`, `NUMEROTATION_DEJA_ENGAGEE`) ; sans reprise, la série démarre à 0 (Q-D-10). Le
  format par défaut devient **un format par série** (celui des factures ne change pas).
- **D-1066-6 — `facturation.serie.changed@1` relâché, rien de renommé** (AD-27) : l'énumération `["factures"]` de `serie`
  est **retirée** (BACKWARD : comme 1061 et 1062) ; vérifié au registre contre la version d'`origin/dev`. Un consommateur
  qui ne gardait que la tête des factures filtre `serie = factures`.
- **D-1066-7 — Le fait `facturation.avoir.emis@1`**, dans la transaction de l'avoir (outbox), clé
  `<organisationId>:<factureId>` (les avoirs d'une facture arrivent dans l'ordre), schéma fermé
  `facturation.avoir.emis-value` : `avoirId` (UUID, le `sourceId` de l'avoir), `numero` (`AV-…`, un libellé), `factureId`
  (la Créance à réduire, `(FACTURE, factureId)`), `factureNumero`, `commandeId`, `livraisonId` (`null` dans ce mode),
  `tiersId`, `perimetre` (`SOCIETE` ; jamais un avoir de freelance, AD-31), `devise`, `motif`, `nature`, `lignes`
  (`{ ligne, articleId, quantite, prixUnitaireHtMineur, tauxTvaPourDixMille, montantHtMineur }` : le HT crédité par ligne,
  vide pour un montant libre), `tva` (par taux), `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur` (≥ 1),
  **`ordre`** (le n-ième avoir de la facture), **`cumulTtcMineur`** (le TTC crédité sur la facture après lui, un état
  absolu : un consommateur qui rejoue le désordre garde le plus haut), **`resteACrediterTtcMineur`**, **`soldeLaFacture`**,
  `emisLe`, `rang` (1 : un avoir est émis une fois). Ni désignation, ni nom, ni texte libre.
- **D-1066-8 — La facture `ANNULEE_PAR_AVOIR`, lue, jamais écrite.** La facture rendue gagne `avoirs` (`nombre`,
  `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur` crédités, `resteACrediterTtcMineur`) et **`statut`** :
  `ANNULEE_PAR_AVOIR` si le reste à créditer est 0, sinon le statut du règlement lu chez `paiement` (`INCONNU` se lit
  `EMISE`) : `EMISE`, `PARTIELLE`, `PAYEE`, `CLOTUREE`. `reglement` ne change pas (D-1061-10 : il reste la lecture de
  `paiement`). Après l'annulation, un avoir neuf est refusé `AVOIR_SUPERIEUR_A_LA_FACTURE` (reste 0).
- **D-1066-9 — Le seuil du DAF, par un droit neuf.** FR-48 : « un COMPTABLE, avec validation d'un DAF au-dessus d'un
  seuil, ou un DAF » ; la table d'accès donne `facturation:avoir:emettre` au COMPTABLE **et** au DAF : rien ne les
  distingue, et un rôle ne décide jamais d'un droit (D-960-12). D'où **`facturation:avoir:valider`** (C7 ; rôle par défaut
  proposé : `DIST_DAF` seul ; → B). Au-delà de `seuilValidationAvoirMineur` (TTC de l'avoir, strictement au-dessus ;
  500 000 par défaut, paramètre versionné de la facture, **facultatif au `PUT`** — absent, la valeur de la version lue est
  reprise —, de 0 à 10¹² : les versions de 1065 restent valides et le rendent), l'émission exige ce droit en plus : sinon 403 `VALIDATION_DU_DAF_REQUISE` (`details` :
  `seuilMineur`, `montantTtcMineur`), jugé avant toute écriture. Le circuit à deux personnes (le comptable demande, le
  DAF valide) vient plus tard (D-1066-14) ; jusqu'au service de B, un avoir au-delà du seuil est refusé à tous (échec
  fermé), en deçà il passe.
- **D-1066-10 — L'avoir imprime les mentions figées de sa facture** (émetteur, client, désignations, conservation) :
  il corrige **cette** facture, au même client ; son PDF se rend de ses seules données et de celles-ci, des années plus
  tard (D-1065-6). Une facture d'avant 1065 (sans mentions) reçoit un avoir, sans PDF (`PDF_INDISPONIBLE`). Le PDF : A4,
  « Avoir », `N° AV-…`, « Avoir sur la facture FAC-… du jj/mm/aaaa », motif (et texte), lignes créditées (un montant
  libre est une ligne « Montant libre »), HT, TVA par taux, TTC, « Montant porté au crédit du client », zone « Signature
  et cachet », pied « Avoir AV-… — page n / N » ; mêmes polices et même déterminisme que la facture (D-1065-8).
  Production asynchrone comme la facture (D-1065-7 : après la réponse, balayage, cinq essais), octets dans
  `facturation_pdfs_avoirs` (index unique par avoir, écriture majoritaire) avant `PRODUIT`.
- **D-1066-11 — Les routes**, sous le préfixe du module : `POST /factures/{factureId}/avoirs` (émettre) ;
  `GET /factures/{factureId}/avoirs` (les avoirs d'une facture, par ordre) ; `GET /avoirs/{avoirId}` ;
  `GET /avoirs/{avoirId}/pdf` (`application/pdf`, `ETag`, `X-Empreinte-Sha256`). Lire : `facturation:facture:consulter`
  (« tout rôle qui voit une facture peut l'imprimer », FR-46). La portée réseau est celle de la facture : hors de la
  lecture, la même 404 que l'inconnu ; lisible mais hors de l'écriture, 403 `HORS_PORTEE` à l'émission.
- **D-1066-12 — Idempotence** (AD-4) : `Idempotency-Key` exigée (8 à 128 caractères) ; clé unique par organisation ;
  clé d'origine `<factureId>:avoir:<clé>` (le `demandeId` d'AD-4 est la clé de la demande) ; l'empreinte est celle de la
  facture et du corps normalisé ; le rejeu rend l'avoir (200, `rejeu: true`), même après d'autres avoirs.
- **D-1066-13 — Un droit neuf, aucun fait neuf au manifeste ; sa version monte en 1.1.0** (D-1065-15). Le manifeste
  déclarait déjà `facturation:avoir:emettre` et `facturation.avoir.emis@1` ; il gagne `facturation:avoir:valider` (C7) :
  un ajout, donc une **mineure** (1.0.0 → 1.1.0, qui porte aussi `facturation:parametres:modifier` de 1065). **→ B** :
  (1) le droit au catalogue de tenant d'`auth`, hors du jeton, `DIST_DAF` seul (comme `facturation:parametres:modifier`,
  STORY-979) ; (2) recopier le manifeste 1.1.0 au catalogue (`copies.json`, SHA de `prospera-stories` donné au journal de
  D) ; (3) **consommer `facturation.avoir.emis@1` dans `paiement`** (réduire la Créance `(FACTURE, factureId)` du TTC de
  l'avoir, en moins de 5 s ; au-delà du reste dû, un crédit du tiers ; clé de rejeu `avoirId`).
- **D-1066-14 — Ce qui reste (l'avoir (2) et suivantes)** : la demande d'avoir d'un comptable validée par le DAF (circuit à
  deux personnes, tracé) ; `IMPUTE` et `REMBOURSE` lus chez `paiement` ; la proposition d'entrée en stock d'un retour
  (`entrepot`, `<avoirId>:retour`) ; l'interrupteur `avoir-automatique-sur-annulation` ; `facturation.facture.changed@1`
  (statut `ANNULEE_PAR_AVOIR` publié) ; l'envoi d'un avoir (lien public, `notification`) ; la liste des avoirs de
  l'organisation (onglet « E-facturation et avoirs ») ; les avoirs du freelance (AD-31) et sur un `RVC-` ; les routes
  C13 (effacement des avoirs et de leurs PDF, conservation de 10 ans).

## Contrat annoncé avant le code

Annoncé dans le journal de D, « ⚠ Contrats », avant la fusion du code. **Ajouts seuls** ; un fait neuf publié (déjà
déclaré au manifeste) ; un schéma relâché ; un droit neuf au manifeste `facturation` (C7), version **1.1.0**.

- **Routes neuves** (préfixe `/api/v1/facturation`) : `POST /factures/{factureId}/avoirs` (`facturation:avoir:emettre`
  ; au-delà du seuil, + `facturation:avoir:valider` ; `Idempotency-Key`) ⇒ 201 l'avoir, 200 au rejeu ; 400
  `AVOIR_INVALIDE`, `CLE_D_IDEMPOTENCE_MANQUANTE` ; 403 `VALIDATION_DU_DAF_REQUISE`, `HORS_PORTEE` ; 404
  `FACTURE_INCONNUE` ; 409 `AVOIR_SUPERIEUR_A_LA_FACTURE`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`. `GET
  /factures/{factureId}/avoirs`, `GET /avoirs/{avoirId}` (404 `AVOIR_INCONNU`), `GET /avoirs/{avoirId}/pdf` (409
  `PDF_EN_ATTENTE`, `PDF_INDISPONIBLE` ; 500 `PDF_ALTERE`) : `facturation:facture:consulter`.
- **Routes changées** (ajouts) : `PUT /numerotation/{serie}` accepte `avoirs` ; `GET /numerotation` rend aussi la série
  `avoirs` ; la facture rendue gagne `statut` et `avoirs` ; les paramètres gagnent `seuilValidationAvoirMineur`
  (500 000 par défaut, facultatif au `PUT`, rendu par toute version lue).
- **Fait neuf publié** : `facturation.avoir.emis@1` (D-1066-7). **Fait relâché** : `facturation.serie.changed@1`
  (énumération de `serie` retirée ; la série `avoirs` y paraît).
- **Collections neuves** : `facturation_avoirs`, `facturation_credits_des_factures`, `facturation_pdfs_avoirs`.
- **Droit neuf** : `facturation:avoir:valider` (manifeste `facturation` 1.1.0) ; **→ B** : D-1066-13.

## Ce qui a été livré

**2026-11-24** — après l'annonce « ⚠ Contrats » (prospera-stories **#782**, `main` `24049e4`), une PR fusionnée en « Rebase
and merge » :

- `prospera-ventes-service` **#14** (`dev` **`d9f4264`**, `2937af8`, `e9f77dd`, **`adaa2bb`** ; tête de la branche `624cee9`
  vérifiée `open` et égale au SHA poussé avant la fusion) :
  - `src/modules/facturation/avoirs/` : `avoirs.ts` (la demande lue et nommée, les montants et ce qui dépasse, le crédit
    après l'avoir, le statut de la facture, le seuil ; pur), `schemas.ts` (`facturation_avoirs`,
    `facturation_credits_des_factures`, `facturation_pdfs_avoirs`), `avoirs.service.ts` (`AvoirsDesFactures` : émettre
    dans la transaction du numéro, lire, lister), `avoirs.controller.ts` (les quatre routes) ;
  - `src/modules/facturation/pdf/` : `rendu.ts` (`rendreLAvoir` ; le rendu de la facture inchangé à l'octet),
    `pdfs-avoirs.service.ts` (`PdfDesAvoirs` : production, balayage, octets vérifiés) ;
  - `factures/faits.ts` (`faitSerie`, `faitAvoirEmis`, série `avoirs` déclarée), `factures.service.ts` (`statut`, `avoirs`
    de la facture lue), `numerotation/` (format par défaut par série, `avoirs` reprenable), `parametres/`
    (`seuilValidationAvoirMineur`, facultatif et repris), `erreurs.ts` (quatre codes) ;
  - `contrat/schemas/facturation.avoir.emis.json` (neuf), `facturation.serie.changed.json` (énumération de `serie`
    retirée) ; `module.manifest.ts` recopié à l'octet (`24049e4`, empreinte refigée) ;
  - **recette versionnée** : `scripts/recette/1066/` (`pile-1066.yml`, `emetteur-de-test.mjs`, `recette-1066.py`,
    `texte-du-pdf.mjs`, `mutations-1066.mjs`, `README.md`).
- **Écart à l'annonce : aucun.** Précisions : un `PUT` des paramètres sans le seuil reprend celui de la version lue
  (D-1066-9) ; dans `lignes`, `quantite` et `prixUnitaireHtMineur` valent `null` pour le reste d'une ligne déjà en partie
  créditée (avoir `TOTAL`).
- **→ B** : D-1066-13 (journal de D, « Demandes aux autres groupes ») : le droit, la recopie du manifeste 1.1.0
  (`prospera-stories` `24049e4`), le consommateur de `paiement`.

## Preuves

- **Node 24** (étage `verification`, export `git -c core.autocrlf=false archive`) : `tsc` ; lint des fichiers touchés
  (`endOfLine auto`) ; build ; **unitaires : 64/64 suites, 654 tests** (634 avant) ; **e2e : 2/2, 24** ; **intégration sur
  MongoDB 8 en jeu de répliques : 16/16 suites, 181 tests** (171 avant), dont `avoir-http.int-spec.ts` (10, vraie chaîne de
  gardes) : partiel puis total (`AV-2026-000001`, `000002`, facture `ANNULEE_PAR_AVOIR` au franc, document de la facture
  inchangé, faits et têtes, piste intègre) ; dépassement sans numéro ; `AVOIR_INVALIDE` ; rejeu et
  `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` ; seuil du DAF (comptable refusé sans numéro, DAF passe, seuil abaissé et repris
  par un `PUT` sans lui) ; droits et portée (403, 404 `FACTURE_INCONNUE`, `AVOIR_INCONNU`) ; **deux avoirs simultanés qui
  ensemble dépasseraient : un seul passe ; vingt avoirs en parallèle : vingt numéros consécutifs** ; suite des avoirs
  reprise de Sage (`AV00412` ⇒ `AV00413`) ; PDF (attente, empreinte, conservation jusqu'au 24/11/2036, altéré ⇒
  `PDF_ALTERE`, facture d'avant 1065 ⇒ `PDF_INDISPONIBLE`) ; balayage et cinq échecs ⇒ `ECHEC`.
- **Mutations : 16/16 rouges sur une assertion** — 10 pures (Node 25, puis Node 24 dans l'image) : TVA d'un taux soldé
  par l'arrondi, TVA non bornée, ligne créditée au-delà de son reste, prix au-dessus de la ligne, total réparti par ligne
  après un montant libre, seuil atteint au lieu de dépassé, préfixe `AV-` perdu, seuil par défaut changé, facture datée
  de l'avoir sur le PDF, fait sous la clé de l'avoir ; 6 sur MongoDB réel : crédit tenu ignoré, seuil ignoré, facture
  soldée non signalée, jamais `ANNULEE_PAR_AVOIR`, octets altérés servis, suite des avoirs absente des séries lues.
- **Karapace 6.2** sur la pile : les schémas d'`origin/dev` d'avant la story enregistrés d'abord, puis ceux de la story :
  `facturation.avoir.emis-value` **nouveau sujet**, `facturation.serie.changed-value` **compatible BACKWARD** (énumération
  retirée) ; **témoin** : une énumération et un champ exigé remis sont refusés `INCOMPATIBLE`.
- **Pile `grp-d`** (`scripts/recette/1066/pile-1066.yml`, image de la branche) : `docker compose up` sain (module Nest
  changé, §1.5) ; pilote **25/25** : facture `FAC-2026-000001`, séries `factures` et `avoirs` ; `AV-2026-000001` (29 500),
  rejeu, dépassement (la ligne nommée) et motif refusés sans numéro ; seuil abaissé, comptable 403, DAF `AV-2026-000002`
  (315 060) ; facture `ANNULEE_PAR_AVOIR` ; **texte du PDF lu par `pdfjs-dist`** (« Avoir », numéro, « Avoir sur la facture
  FAC-2026-000001 du 24/11/2026 », motif, ligne, totaux, A4) ; mêmes octets après `docker restart` ; outbox vide ;
  `facturation.avoir.emis` (deux faits, clé de la facture, cumul, solde) et la tête `avoirs` lus sur Kafka ; piste intègre.
- **Rejeu sur les images reconstruites depuis `origin/dev`** (`adaa2bb`, arbre identique à la branche ; construction avec
  cache, l'étage `base` reconstruit dans la même prise après deux échecs réseau de `npm ci`) : sous Node 24, unitaires
  **64/64 suites, 654**, e2e **2/2, 24**, intégration **16/16 suites, 181** ; pile neuve (volumes neufs) : `docker compose
  up` sain, pilote **25/25** ; au registre, Karapace a répondu en erreur sur une partie de l'enregistrement « d'avant »
  juste après `healthy` (§1.9) : les schémas de la story s'enregistrent et le témoin est refusé `INCOMPATIBLE` (la
  compatibilité BACKWARD du relâchement est celle de la première pile).
- `git diff --stat` = `--ignore-cr-at-eol` à chaque commit ; aucun `index.ts` non suivi.
- **Verrou Docker** : libre au rituel ; **pris à 09:20** (`D STORY-1066`), une seule prise, **rendu à 09:58** après `down -v`
  (pile, MongoDB de test et son réseau) ; aucun conteneur, volume ni réseau `grp-d` ne reste.
