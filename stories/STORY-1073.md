# STORY-1073 : la facture lit sa fiche légale — l'identité du dossier propre, les coordonnées des comptes d'encaissement ; D fait aussi les deux côtés producteurs

Status: done

**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` §6, amendement du 2026-11-24 (soir), juste après 1076 · **Dépôts :**
`prospera-dossier-service` et `prospera-paiement-service` (**prêtés par B pour cette story seule**, passation du journal
de B, prospera-stories #837, `main` dde8f19 : dossier `origin/dev` = `2bf9dbd`, paiement = `4684d22`, aucune PR
ouverte — constatée au rituel), `prospera-ventes-service` (module `facturation`), `prospera-plateforme`
(`contrats/distributeur/`, dossier de D) · **Plage :** groupe D (1072 → 1078 réservées) · **Consigne de l'utilisateur
(24/11, soir) :** « gère tout cela dans la story 1073 sans attendre la livraison de B ».
**Sources :** Q-D-12 répondue par l'utilisateur (« La fiche légale de l'organisation est normalement renseignée lors de
la création d'un dossier ») et sa décision **D-Q12-1** (une seule source par donnée : l'identité légale du dossier propre,
les coordonnées de paiement des comptes d'encaissement de `paiement`, le DAF ne choisit plus que le ou les comptes
imprimés) ; la demande remplacée du 24/11 (« Demandes aux autres groupes » du journal de D : son contenu est le cahier
des charges) ; STORY-1065 (D-1065-2 : la fiche saisie par le DAF faute de propriétaire) ; PRD distributeur FR-44 ;
STORY-242/243/599 (les comptes d'encaissement : titulaire identifié, saisie tracée, identifiant scellé, NFR-1, AD-14) ;
STORY-301/529/683/696 (`DossierEtatV1`, sa liste blanche, la republication opérateur) ; STORY-303 (les axes datés) ;
STORY-976 (le patron du consommateur de B dans `paiement`).

## « Fini quand » (D-1073-1, le plan ne le fixe pas)

Un dossier propre **mis à jour** (par sa route, `PATCH /dossiers/{id}`) et un compte d'encaissement **déclaré** (par sa
route, `POST /comptes-encaissement`) apparaissent sur la facture émise et dans son PDF, sur la pile `grp-d` de bout en
bout (dossier, paiement, ventes, Kafka, Karapace) ; la fiche saisie en 1065 n'est plus lue pour ce que les deux sources
portent ; un distributeur reçoit bien son dossier propre à sa naissance (prouvé, pas supposé).

## Le découpage : trois dépôts, dans cet ordre

1. **`dossier-service`** — `DossierEtatV1` (`dossier.created` / `dossier.updated`, `schemaVersion` inchangé) gagne neuf
   champs **facultatifs additifs** : `sigle`, `formeJuridique`, `nifSociete` (forme saisie), `rccm`, `numeroCnss`,
   `capitalSocial` (unités mineures), `adresse`, `telephone`, `email` — **sur le seul dossier propre** (D-1073-2) ; ni le
   régime fiscal (D-1073-3). Le rejeu de l'état des dossiers propres existants : la commande opérateur de STORY-696
   (`npm run republier:dossiers`) le fait déjà (D-1073-10).
2. **`paiement`** — le fait d'état **`paiement.compte.changed@1`** (clé `orgId`), enfilé dans la transaction de la
   déclaration et de chaque vérification d'un compte : seulement ce qui s'imprime, **jamais un secret du coffre**
   (D-1073-6).
3. **`ventes` (`facturation`)** — le groupe `ventes-service.emetteur` projette le dossier propre et les comptes ; les
   mentions de l'émetteur en sont tirées, figées sur la facture ; le DAF choisit le ou les comptes imprimés
   (`comptesImprimes`) et garde le régime fiscal (D-1073-4, D-1073-7). Manifeste `facturation` **1.2.0** (C5), catalogue
   des faits du distributeur **v2** (`prospera-plateforme`), manifeste `paiement` **1.1.0** (C5).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan amendé, règles, journaux de A, B, C, D (aucune demande neuve à D ; la passation de B, #837, est
  constatée : dossier `origin/dev` = `2bf9dbd`, paiement = `4684d22`, aucune PR ouverte ; le checkout `dossier-service`
  était sur `MNV-1082` de B, propre, déjà fusionnée : branche `MNV-1073` partie d'`origin/dev`, `MNV-1082` gardée).
- [x] Code des trois dépôts et de la plateforme, preuves sous Node 25 (unitaires, lint, mutations).
- [x] Annonce « ⚠ Contrats » fusionnée avant le code : prospera-stories **#845** (`main` **`bd9340e`** ; manifestes
  `facturation` 1.2.0 et `paiement` 1.1.0 à la source).
- [x] `prospera-plateforme` **#40** fusionnée en rebase (`dev` **`de8f0d3`**), étiquette **`contrats-distributeur-v2`**.
- [x] `dossier-service` **#58** (`dev` **`4352ac3`**), `paiement` **#125** (`dev` **`e2be149`**), `ventes` **#16** (`dev`
  **`bc0f85c`**), fusionnées en rebase ; arbres fusionnés identiques aux commits testés.
- [x] Verrou Docker : tenu par B (1112) au rituel ; **pris à 21:58, une seule prise, rendu le 25/11 à 00:31** (≈ 1 h 50
  perdues à une coupure du réseau pendant les `docker build`) ; aucun conteneur, volume ni réseau `grp-d`.
- [x] PR de docs finale ; **dossier et paiement rendus à B** (journal de D, « Passations »).

## Décisions retenues par défaut (contestables)

- **D-1073-1** — « Fini quand » ci-dessus (le plan ne le fixait pas).
- **D-1073-2 — La fiche légale n'est publiée que pour le dossier propre** (`estLeCabinet: true`). Son seul lecteur est la
  facture de l'organisation ; un dossier client garde la liste blanche de STORY-301/529 (« ni NIF, ni coordonnées »).
  Clé absente — jamais `null` ni vide — quand le dossier ne porte pas le champ ; un capital non entier ou négatif n'est
  pas publié. Lu nommément sur le document (jamais un spread, leçon 496/499). STORY-1077 (bilan : forme juridique et
  capital des dossiers clients) élargira par la même fonction si elle en a l'usage.
- **D-1073-3 — Le régime fiscal n'entre pas dans `DossierEtatV1`.** Sa source unique est la décision d'axes datée
  (`dossier.axes.decides`, par exercice, STORY-303) ; le champ `regimeFiscal` du dossier est un héritage qui « ne décide
  plus rien ». Le publier ferait deux sources du même régime.
- **D-1073-4 — Ce qui reste saisi par le DAF, et pourquoi** : (1) **le choix des comptes imprimés** (D-Q12-1) ; (2) **le
  régime fiscal** (`emetteur.regimeFiscal` des paramètres de la facture, seul champ de la fiche de 1065 encore lu) : le
  dossier propre d'un distributeur n'a pas d'exercice, donc pas de décision d'axes, et la mention FR-44 doit pouvoir
  s'imprimer. Les huit autres champs de `emetteur` restent au contrat (versions déjà écrites) et ne sont plus lus ;
  `emetteur` devient facultatif au `PUT` (absent, la version lue est gardée), `comptesImprimes` naît facultatif.
- **D-1073-5 — La projection du dossier propre** (`facturation_organisations_lues`, une ligne par organisation) : la plus
  haute `version` l'emporte ; **une même version réécrit** (la republication de 696 publie à la version courante) ; deux
  premiers états simultanés : le heurt de la clé unique est rejoué (piège de 1050). Un dossier client est ignoré sans
  bruit ; un fait hors contrat est écarté avec son motif.
- **D-1073-6 — `paiement.compte.changed@1`, et non `paiement.compte-encaissement.changed`** : la convention des topics de
  `paiement` (`MOTIF_TOPIC_PAIEMENT`) refuse le tiret. Charge (modèle fermé, Karapace BACKWARD) : `organisationId`,
  `compteId`, `revision`, `nature` (`MARCHAND`, `BANCAIRE`, `MOBILE_MONEY`, `PI_SPI`), `titulaire`, `fournisseur`
  (banque, opérateur ou agrégateur), `pays`, `devise`, `empreinteVisible` (« ••••4521 »), `destinationPiSpi`
  (numéro de compte et participant agréé, en clair par construction, STORY-599 ; `null` pour une autre nature),
  `verifie` (un booléen, comme STORY-667). **La révision est le rang de l'acte au journal chaîné du compte**
  (`EcritureDArgent` passe désormais l'entrée consignée à `publier`) : croissante, jamais réutilisée, sans champ neuf
  sur le compte. Publiée à la déclaration et à chaque vérification (`verifie` change) ; ni la désignation par défaut ni
  le dépôt de clef (rien d'imprimable ne change). **Aucun secret** : l'identifiant scellé, la clef de notification et
  son ancienne clef ne sortent jamais (NFR-1, AD-14). **Le numéro complet (RIB, IBAN, numéro Mobile Money) est un secret
  du coffre : il ne s'imprime pas** ; la facture imprime l'empreinte visible (et la destination d'un compte PI-SPI) —
  **Q-D-15** au PO.
- **D-1073-7 — Les comptes imprimés** : ceux de `comptesImprimes` (au plus 5, dans l'ordre du DAF, le premier est le
  compte par défaut), connus et de la devise de la facture ; sans choix, le seul compte connu de cette devise s'il est
  seul ; plusieurs sans choix, ou aucun : `EMETTEUR_COORDONNEES_DE_PAIEMENT` manque (fiche `PARAMETRES`). Un compte non
  vérifié s'imprime (le DAF l'a choisi ; `verifie` est figé avec lui). Chaque compte imprimé est figé sur la facture
  (`mentions.emetteur.comptes` : compte, révision, nature, titulaire, fournisseur, numéro, participant, devise, vérifié)
  avec la source de l'identité (`dossierId`, `versionDuDossier`) ; une facture d'avant 1073 garde son RIB saisi (AD-6).
- **D-1073-8 — La forme juridique `AUTRE` ne s'imprime pas** : `dossier-service` la pose à la naissance du dossier propre,
  faute de mieux (STORY-172) ; la mention `EMETTEUR_FORME_JURIDIQUE` manque (fiche `ORGANISATION`) jusqu'à ce que
  l'organisation la déclare. Le capital s'imprime « 25 000 000 F » (NFR-8, espace insécable).
- **D-1073-9 — Les contrats** : manifeste `facturation` **1.2.0** à la source (C5 : + `dossier.created`,
  `dossier.updated`, `paiement.compte.changed@1` consommés ; aucun droit, aucune route) ; manifeste `paiement`
  **1.1.0** (C5 : + `paiement.compte.changed@1` publié) ; catalogue des faits du distributeur **v2**
  (`contrats-distributeur-v2`, + `paiement.compte.changed@1`, origine `MANIFESTE`, consommateur `facturation` ;
  `src/index.ts` inchangé) — sans lui, la garde de `ventes` refuserait le fait consommé. Recopies demandées à B.
- **D-1073-10 — Le rejeu** : dossiers — la commande opérateur existante `npm run republier:dossiers` (STORY-696) publie
  `etatPublie` à la version courante de chaque dossier, donc la fiche légale des dossiers propres existants ; rien à
  écrire de plus (prouvé sur la pile : une projection effacée revient entière). Comptes — **pas de rejeu** : `paiement`
  n'a aucune commande de republication, en écrire une serait une écriture de plus dans l'inventaire fermé
  `ECRITURES_DARGENT` (une trace par acte) ; un compte déclaré avant 1073 se republie à sa prochaine vérification ; aucun
  compte réel n'existe en production (information à B, « ce qui reste »).
- **D-1073-11 — Ni `statut` (retiré) ni `libelle`** : `paiement` n'a ni geste de retrait ni libellé de compte ; les
  publier serait inventer. Ils viendront en ajouts facultatifs avec leur geste (BACKWARD, éprouvé au registre).

- **D-1073-12 — Ce qui reste** (hors de cette story) : (1) **Q-D-15** — le numéro complet imprimé, si le PO le veut :
  une donnée non secrète déclarée avec le compte (`paiement`, B) ; (2) la republication des comptes déclarés avant 1073
  (D-1073-10, information à B) ; (3) l'écran des paramètres de la facture (choisir les comptes, le régime fiscal) — A ou
  D, côté front ; (4) STORY-1077 : la forme juridique et le capital d'un **dossier client** ne sont pas publiés
  (D-1073-2) — 1077 les demandera à B (même fonction, ajout facultatif) ou les lira par la route du dossier ; (5) le
  statut d'un compte retiré et son libellé, avec leur geste chez `paiement` (D-1073-11) ; (6) les recopies des deux
  manifestes au catalogue de `platform-catalog-service` (→ B).

## Contrat annoncé avant le code

Voir « ⚠ Contrats » du journal de D (entrée STORY-1073, annoncée par #845, publiée sans écart).

## Ce qui a été livré

- **`prospera-dossier-service`** (#58) : `fiche-legale-publiee.util.ts` (`ficheLegalePubliee`, pure, lue nommément) ;
  `DossierEtatV1` + neuf champs facultatifs ; `etatPublie` les ajoute pour le seul dossier propre. Rien d'autre : la
  republication de 696 et le consommateur d'`identity.org.created` publient la même charge.
- **`prospera-paiement-service`** (#125) : `contrat/schemas/paiement.compte.changed.json` ;
  `application/comptes/etat-du-compte.ts` (`construireEtatDuCompte`, `faitDEtatDuCompte`) ; `publier` sur la
  déclaration et la vérification ; `EcritureDArgent` passe l'entrée consignée à `publier`.
- **`prospera-plateforme`** (#40) : `contrats/distributeur/catalogue-faits.json` v2 (130 faits) ; README.
- **`prospera-ventes-service`** (#16) : `modules/facturation/emetteur/` (lecture des faits, projections, consommateur) ;
  `mentions.ts` (`emetteurDeLaFacture`, `comptesAImprimer`, `capitalImprime`) ; `parametres` (`comptesImprimes`,
  `emetteur` facultatif) ; `rendu.ts` (`coordonneesDePaiement`, `contactsDe`) ; `KAFKA_EMETTEUR_GROUP_ID` ; copies du
  manifeste 1.2.0 et du catalogue v2 avec leurs empreintes ; recette `scripts/recette/1073/`.

## Preuves

| Où | Quoi | Résultat |
|---|---|---|
| dossier, Node 24 (étage `verification`) | suite unitaire complète ; e2e ; lint des fichiers touchés ; build | **116/116 suites, 1896 tests** ; **10/10, 395** ; 0 ; OK |
| dossier, Node 25 | suite complète | 7 suites rouges connues (6 binding de Confluent, `registre-pays.coherence`), 1880 tests verts |
| dossier, mutations | spread du document, fiche retirée, dossier client publié, capital négatif, capital non entier, vide publié, `null` publié | **7/7 tuées** sur l'assertion |
| paiement, Node 24 | suite unitaire complète ; build | **348/348 suites, 4719 tests** (2 ignorés) ; OK |
| paiement, Karapace | `npm run test:schemas` (sujets jetables) | **11/11** : le sujet neuf en BACKWARD, ajout facultatif compatible, requis ajouté et type changé incompatibles |
| paiement, mutations | déclaration muette, vérification muette, révision figée, `verifie` trop large, destination non projetée, empreinte remplacée, entrée non passée | **7/7 tuées** |
| plateforme, Node 24 | `npm test`, `tsc` | **657** (656 passés, 1 ignoré, 0 échec), OK |
| ventes, Node 24 (MongoDB réel) | unitaires ; intégration ; e2e ; lint ; build | **66/66 suites, 708** ; **18/18 suites, 204** (`fiche-legale.int-spec.ts` : projections sous concurrence — vingt révisions dans le désordre, dix premiers états simultanés —, la facture tirée des deux sources, la précédente figée) ; **24/24** ; 0 ; OK |
| ventes, mutations (Node 25) | devise non filtrée, défaut à plusieurs comptes, ordre du DAF perdu, PI-SPI par l'empreinte, forme `AUTRE` imprimée, RIB saisi relu, coordonnées jamais manquantes, régime fiche `ORGANISATION`, capital sans insécable, dossier client projeté, destination incohérente acceptée, compte en double accepté, PDF sans comptes | **13/13 tuées** |
| pile `grp-d` (dossier, paiement, ventes, Kafka, Karapace, deux MongoDB, Redis), images de la branche | `recette-1073.py` | **29/29** |
| même pile, **images reconstruites depuis `origin/dev`**, volumes neufs | `recette-1073.py` | **29/29** (un premier passage à 28/29 : Karapace 500 juste après `healthy`, schéma non enregistré ; pile relevée de neuf, enregistrement en boucle bornée) |

Ce que le pilote établit, sur les vraies routes : (1) une organisation née par `identity.org.created` (un distributeur :
l'événement ne porte aucun métier) reçoit son dossier propre, forme `AUTRE`, projeté par `facturation` en 3,5 à 4,5 s ;
(2) sans fiche, la facture est refusée (forme, capital, adresse, NIF, RCCM — `ORGANISATION` ; coordonnées —
`PARAMETRES`), sans numéro, la fiche saisie par le DAF n'étant pas lue ; (3) `PATCH /dossiers/{id}` (forme SARL, un
dirigeant, NIF, RCCM, CNSS, capital, adresse, contacts) ⇒ `dossier.updated` v2 projeté en 2,3 à 2,9 s, ni régime ni
dirigeants publiés ; (4) `POST /comptes-encaissement` (Mobile Money) ⇒ `paiement.compte.changed@1` valide au schéma relu
du registre, projeté en 0,7 à 0,8 s ; ni l'identifiant en clair, ni le scellé sur Kafka ou dans l'outbox ; (5) le DAF
choisit le compte imprimé ; **FAC-2026-000001** porte l'identité du dossier v2 et le compte, son PDF (texte lu par pdfjs)
les imprime — « SARL au capital de 25 000 000 F », NIF, RCCM, CNSS, adresse, contacts, « Mobile Money — FEDAPAY — n°
••••••••4521 — titulaire : … » —, jamais l'identifiant ni la saisie du DAF ; (6) une projection effacée revient entière
par `npm run republier:dossiers` (même version), et FAC-2026-000002 porte la même fiche ; (7) `ventes-service.emetteur`
sans retard, les trois services sains.
