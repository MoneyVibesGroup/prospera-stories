# STORY-969 : le lettrage — manuel, automatique (montant, référence, date), partiel, délettrage, écarts de règlement

Status: done

**Complexité :** élevée (un acte neuf sur des écritures inaltérables, qui vit à côté d'elles ; une borne qui doit
tenir sous la concurrence ; une écriture d'écart passée selon les règles de 964 dans la transaction du lettrage ; la
provenance machine / humain de Q3 ; la balance âgée de 968 branchée sans refonte ; une balance publiée qui ne bouge pas)

**Épic :** EPIC-116 (« lettrage : manuel, automatique (montant, référence, date), partiel, délettrage, écarts de
règlement »), d'`epics-comptabilite-2026-08-27.md` ; Q3 (D-L3-4)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service` (et le manifeste `comptabilite` dans `prospera-stories`)
**Plage :** groupe B, n° 14 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 969).
**Dépend de :** STORY-968 (les comptes de tiers, `dev` `92a861a` : le port `SOURCE_DES_LETTRAGES`, D-968-9) ; s'appuie
sur 964 (validation, numérotation, piste chaînée) et 967 (balance publiée).
**Débloque :** STORY-970 (la clôture : les à-nouveaux des collectifs par tiers emporteront le non-lettré).

**Sources lues :** plan du lot 3 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges, « ⚠
Contrats », suivante 969) et journaux de A, C, D (aucune demande ouverte à B qui passe avant cette story ; la demande
de D sur le consommateur de `facturation.facture.emise@1` reste ouverte, sans urgence, hors de ce dépôt) ; fiches 964,
966, 967, 968 ; manifeste `comptabilite` ; paquets de référentiels de `balance-service` sur `origin/dev` (`98078b0`,
lus sans y toucher : `syscohada-revise@2.3`, `smt-togo@1.0`, `cima-assurances@7.0`, `sfd-bceao@2.0`).

---

## Pourquoi

Une facture et son règlement sont deux lignes au compte du client. Tant qu'on ne dit pas qu'elles se soldent, la
balance âgée les montre toutes deux, l'une échue, l'autre en négatif, et le cabinet relance un client qui a payé. C'est
ce qu'un utilisateur de Sage cherche en premier (EPIC-116). Le lettrage le dit — sans jamais toucher une écriture
validée.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 969)

| Exigence | Fait |
|---|---|
| Le lettrage manuel existe | `POST …/lettrages { lignes: [{ ecritureId, ligne, montant? }] }` : des lignes validées d'un même compte de tiers, équilibrées ; code AA, AB… (D-969-1 → 4) |
| Le lettrage automatique existe, par montant, référence et date | `POST …/lettrages/propositions` : RÉFÉRENCE puis MONTANT_ET_DATE (fenêtre de 90 jours) ; il PROPOSE, un membre accepte (`…/propositions/{id}/acceptation`) ou reprend modifié (D-969-7) |
| Le lettrage partiel existe | `montant` par ligne : la ligne garde son reste, jamais lettrée au-delà de son montant, même sous la concurrence (D-969-2, D-969-4) |
| Le délettrage existe | `POST …/lettrages/{id}/delettrage { motif }` : tracé, en ajout seul, refusé sur un exercice clos (D-969-5) |
| Les écarts de règlement sont traités | `solderLEcart` : sous le seuil (1 000 par défaut), une écriture d'écart née validée et numérotée, 658 / 758 en SN et SMT (D-969-8, D-969-9) |
| La balance âgée reflète les lettrages sans refonte | le port `SOURCE_DES_LETTRAGES` de 968 lit les lettrages actifs ; `balanceAgee` inchangé (D-969-6) |
| La balance publiée ne change pas | le lettrage n'affecte aucun solde : même version, même `checksum` (D-969-12) |

## Décisions (prises par défaut, contestables)

- **D-969-1 : ce qu'on lettre.** Des lignes **VALIDÉES** (un brouillard se corrige, il ne se lettre pas), d'un même
  **compte de tiers** : même collectif — la **racine déclarée** par `comptes-collectifs@1` (`411` couvre `411100` et
  `411200`) —, même tiers, même devise. Au moins une ligne au débit et une au crédit, chacune une fois. Une ligne se
  cite par son écriture et son **rang** (à partir de 1, celui du grand livre) ; sa clé est `<ecritureId>:<rang>`
  (D-968-9). Une ligne de collectif validée avant 968, sans tiers, ne se lettre pas (`LIGNE_NON_LETTRABLE`,
  `SANS_TIERS`).
- **D-969-2 : combien, et l'équilibre.** Une ligne se lettre pour son **reste** (son montant moins ce que des lettrages
  actifs en ont pris), ou pour un `montant` demandé qui ne le dépasse pas (409 `LIGNE_DEJA_LETTREE`, `details.reste`).
  Les montants lettrés au débit **égalent** ceux au crédit : tout lettrage est équilibré. Il est **COMPLET** quand
  chaque ligne est soldée, **PARTIEL** quand une ligne garde un reste (un acompte sur une facture). Le type est celui
  de l'acte, à sa date : un PARTIEL suivi d'un second lettrage qui solde la facture reste PARTIEL (deux codes).
- **D-969-3 : le code.** `AA` … `ZZ`, puis `AAA` … : le n-ième émis pour un compte de tiers (racine, tiers) dans un
  exercice. Un compteur par compte (`comptes_de_lettrage.codesEmis`), avancé dans la transaction, et un index unique
  `(exercice, racine, tiers, code)`. **Jamais réutilisé**, même après un délettrage : un code désigne un acte.
- **D-969-4 : jamais au-delà du montant, même sous la concurrence.** Le document du compte de tiers
  (`comptes_de_lettrage`) est posé avant la transaction, puis avancé (`$inc version`) DANS la transaction de chaque
  acte qui touche ce compte (lettrage, délettrage, contre-passation) : deux actes concurrents s'y heurtent,
  `withTransaction` rejoue le perdant, qui relit les restes. Les restes sont toujours jugés sous ce verrou. Prouvé sur
  MongoDB : dix lettrages simultanés de 30 000 sur une facture de 100 000 ⇒ trois passent, sept 409, 90 000 lettrés.
- **D-969-5 : où vit le lettrage, et le délettrage.** Le lettrage **n'écrit jamais une écriture** (D-964-3). Il vit dans
  `lettrages` (**en ajout seul**, garde du programme) ; un délettrage est un document de plus dans `delettrages` (**en
  ajout seul**, un par lettrage : index unique, 409 `LETTRAGE_DEJA_DEFAIT`) qui dit qui, quand et pourquoi.
  `comptes_de_lettrage` est **versionné** (verrou et compteur, aucun fait). Un délettrage défait tout le lettrage (pas
  une ligne seule) ; il est consigné dans la piste chaînée (`LETTRAGE_DEFAIT`) et **refusé sur un exercice clos** (409
  `EXERCICE_CLOS`), comme le lettrage et les propositions.
- **D-969-6 : la date du lettrage et la balance âgée.** La date du lettrage est la plus récente de ses lignes (le
  règlement, en général). Le port `SOURCE_DES_LETTRAGES` (D-968-9) rend, à la date d'arrêté et dans l'instantané de la
  balance âgée, la somme des lettrages **actifs datés au plus tard à cette date** : arrêtée avant le règlement, la
  balance âgée montre la facture entière. Un lettrage défait ne compte **à aucune date** (le délettrage corrige une
  erreur, il ne date pas un fait). Le calcul `balanceAgee` de 968 n'a pas changé d'une ligne.
- **D-969-7 : l'automatique PROPOSE d'abord, il n'applique jamais.** Q3 et la spine de l'IA commune (AD-1, aucun
  décideur `SYSTEME`) : la machine propose, l'humain engage. Règles, compte de tiers par compte de tiers, déterministes :
  1. **RÉFÉRENCE** : les lignes qui portent la même référence (sans casse ni espace), au débit et au crédit, dont les
     restes s'équilibrent, ou ne diffèrent que d'un écart sous le seuil (la proposition dit l'écart) ;
  2. **MONTANT_ET_DATE** : une ligne au débit et une au crédit de même reste, à moins de **90 jours** l'une de l'autre
     (`fenetreJours`, 0 à 366) ; pour chaque débit, du plus ancien au plus récent, le crédit le plus proche en date.
  La **référence** est un champ **ajouté**, facultatif, de la ligne d'écriture (`reference`, 1 à 40 caractères : le
  numéro de la facture portée ou réglée), gardé par la contre-passation et lu au grand livre. Chaque proposition est
  enregistrée (`propositions_de_lettrage`, en ajout seul ; origine `REGLE`, capacité
  `comptabilite/lettrage-automatique@1`). Acceptée **telle quelle** (`…/acceptation`, ou `propositionId` avec les mêmes
  lignes, montants et écart) ⇒ `PROPOSE_PAR_LA_MACHINE`, la proposition citée `ACCEPTEE`, comme en 959 ; **reprise
  modifiée** ⇒ `CHOISI_PAR_L_UTILISATEUR`, `MODIFIEE`. La décision se **déduit** côté serveur, jamais saisie.
- **D-969-8 : l'écart de règlement.** Sous le seuil et avec `solderLEcart`, sur des lignes prises pour tout leur reste
  (sinon 422 `ECART_SUR_LETTRAGE_PARTIEL`) : une **écriture d'écart**, dans la transaction du lettrage, selon les règles
  de 964 — née VALIDÉE, numérotée par `numeroter` dans le journal des opérations diverses du plan arrêté (`OD-000001`),
  datée du lettrage, justifiée par la pièce de la ligne la plus récente, inaltérable, consignée
  (`ECART_DE_REGLEMENT_PASSE`, avec la provenance du lettrage). Deux lignes : le collectif, au tiers, pour l'écart (elle
  entre dans le lettrage), et la contrepartie — **débits > crédits** (un client a payé moins, le dossier a payé plus à
  un fournisseur) ⇒ compte de **charge** ; sinon compte de **produit**. Les comptes sont une donnée par référentiel,
  `comptes-d-ecart@1` : **SN et SMT : 658 « Charges diverses », 758 « Produits divers »** (vérifié : les paquets de
  `balance-service` s'arrêtent à 65 « Autres charges » et 75 « Autres produits », dont 658 et 758 sont les
  divisionnaires du plan SYSCOHADA révisé) ; **CIMA : 844 « Autres pertes exceptionnelles », 849 « Autres profits
  exceptionnels »** (dans le plan CIMA, 658 et 758 sont autre chose : à valider par un expert) ; **SFD-BCEAO : aucun**
  (409 `ECART_NON_DECLARE` ; pas de collectif, donc pas de lettrage). Le délettrage ne touche pas l'écriture d'écart :
  sa ligne de tiers redevient ouverte, et se relettre AVEC elle (sans nouvel écart).
- **D-969-9 : le seuil par défaut est 1 000 unités mineures** (1 000 F CFA, ≈ 1,5 €) : il couvre les arrondis et les
  appoints ; au-delà, un écart est un fait à justifier (frais bancaires, escompte, litige) par une écriture saisie.
  Paramètre du service `LETTRAGE_SEUIL_ECART`, entier de 0 à 100 000, validé au démarrage ; 0 éteint les écarts. Pas
  de seuil par dossier en 969 (il viendra avec les paramètres du dossier, contestable).
- **D-969-10 : une écriture lettrée ne se contre-passe pas.** 409 **`ECRITURE_LETTREE`** (`details.codes`) : on la
  délettre d'abord, puis on la contre-passe, puis on lettre l'originale avec sa contre-passation (même tiers, montants
  inverses). Le refus se juge sous le verrou du compte de tiers (D-969-4) : une course entre un lettrage et une
  contre-passation se tranche. Pourquoi refuser plutôt que délettrer en silence : le lettrage est un acte humain tracé ;
  le défaire est un autre acte, que l'humain fait et que la piste dit.
- **D-969-11 : les lectures.** `GET …/lettrages?tiersId=&apres=&limite=` (actifs et défaits, du plus ancien au plus
  récent), `GET …/lettrages/{id}`, `GET …/tiers/{tiersId}/lignes-a-lettrer` (lignes validées du tiers qui gardent un
  reste : montant, lettré, reste, codes, référence), lues dans un instantané.
- **D-969-12 : la balance publiée ne change pas.** Le lettrage n'est pas une écriture : il n'affecte aucun solde ; la
  publication rejouée après un lettrage rend 200, même version, même `checksum`, rien d'envoyé. Une écriture d'écart,
  elle, EST une écriture validée : elle entre dans le grand livre et la balance comme toute autre.
- **D-969-13 : aucun droit neuf.** Lettrer, délettrer, proposer, accepter : `comptabilite:lettrage:realiser` (déclaré
  depuis 958, attribué en 971 à `CAB_ASSOCIE` et `CAB_COLLABORATEUR`). Lire : `comptabilite:dossier:consulter`. Rien à
  faire dans auth.
- **D-969-14 : le manifeste.** Trois routes de lecture en `routesLectureSeule`, commentaire du lettrage et des droits,
  « lettrages » dans l'avertissement de désinstallation ; recopié à l'octet dans le service après la fusion de
  l'annonce.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Routes neuves**, sous `/api/v1/dossiers/{d}/exercices/{e}` :
  - `POST …/lettrages` (`comptabilite:lettrage:realiser`) `{ lignes: [{ ecritureId, ligne, montant? }] (2 à 200),
    solderLEcart?, propositionId? }` → 201 `Lettrage` ;
  - `POST …/lettrages/propositions` `{ tiersId?, fenetreJours? }` → 201 `{ dossierId, exerciceId, fenetreJours,
    seuilEcart, propositions: [{ id, critere: REFERENCE | MONTANT_ET_DATE, racine, tiers, lignes: [LigneDeTiers],
    totalDebit, totalCredit, ecart }] }` ;
  - `POST …/lettrages/propositions/{propositionId}/acceptation` → 201 `Lettrage` ;
  - `POST …/lettrages/{lettrageId}/delettrage` `{ motif }` → 201 `Lettrage` (etat `DEFAIT`) ;
  - `GET …/lettrages`, `GET …/lettrages/{lettrageId}`, `GET …/tiers/{tiersId}/lignes-a-lettrer`
    (`comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`).
  - `Lettrage` = `{ id, dossierId, exerciceId, code, racine, tiers: { id, code, nom }, type: COMPLET | PARTIEL, etat:
    ACTIF | DEFAIT, dateDuLettrage, lignes: [{ cle, ecritureId, ligne, compte, sens, dateEcriture, montantDeLaLigne,
    montant, resteApres }], totalDebit, totalCredit, ecart: { ecritureId, numero, montant, compte } | null, provenance,
    proposition: { propositionId, origine, capacite, decision } | null, creePar, creeLe, delettrage: { motif, creePar,
    creeLe } | null }`.
- **Champ AJOUTÉ (facultatif), rien de renommé** : `reference` sur les lignes de `POST …/ecritures` et `PUT
  …/ecritures/{id}`, sur les lignes de toute écriture lue et sur les mouvements du grand livre (966, 968).
- **Comportement** : la contre-passation d'une écriture lettrée est refusée (409 `ECRITURE_LETTREE`).
- **Refus nommés neufs** : 422 `LIGNE_EN_DOUBLE`, `LIGNE_NON_LETTRABLE` (`details.motif`), `COMPTES_DE_TIERS_DIFFERENTS`,
  `LETTRAGE_D_UN_SEUL_SENS`, `LETTRAGE_DESEQUILIBRE`, `ECART_SUR_LETTRAGE_PARTIEL`, `ECART_AU_DELA_DU_SEUIL`,
  `FENETRE_INVALIDE` ; 409 `LIGNE_DEJA_LETTREE`, `ECART_NON_DECLARE`, `LETTRAGE_DEJA_DEFAIT`, `ECRITURE_LETTREE` ; 404
  `LIGNE_INTROUVABLE`, `LETTRAGE_INTROUVABLE`, `PROPOSITION_INTROUVABLE`.
- **Piste** : actes neufs `LETTRAGE_REALISE`, `LETTRAGE_DEFAIT`, `ECART_DE_REGLEMENT_PASSE`.
- **Base** : collections neuves `lettrages`, `delettrages`, `propositions_de_lettrage` (en ajout seul),
  `comptes_de_lettrage` (versionnée). **Donnée** du service : `comptes-d-ecart@1`. **Variable** facultative neuve :
  `LETTRAGE_SEUIL_ECART` (1 000 par défaut).
- **Inchangés** : `balance.submitted` (forme, lignes, sceau) ; aucun topic, aucun schéma au registre.
- **Manifeste** : D-969-14.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 18/11, l'annonce d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #672 (fiche, tracker, manifeste amendé, annonce du contrat, AVANT le code) | `main` `7009dfd` |
| `prospera-comptabilite-service` | #9 | `dev` **`3f8806b`** (rejoué de `a0af53a` ; arbre identique) |

- `src/lettrage/` (neuf) :
  - `regles-du-lettrage.ts` : code AA…, lignes distinctes, ligne lettrable, un seul compte de tiers, montants à
    lettrer (jamais au-delà du reste), équilibre et écart, type, date, décision sur la proposition ;
  - `propositions.ts` : le lettrage automatique (RÉFÉRENCE, MONTANT_ET_DATE, fenêtre), pur et déterministe ;
  - `ecarts-declares.json` (`comptes-d-ecart@1`) et `ecarts-de-reglement.ts` : comptes d'écart validés au chargement,
    les deux lignes de l'écriture d'écart ;
  - `lettrage.schema.ts` : `lettrages`, `delettrages`, `propositions_de_lettrage` (en ajout seul),
    `comptes_de_lettrage` (versionnée) ;
  - `registre-des-lettrages.ts` : le verrou du compte de tiers, les lettrages actifs d'une ligne, le port de la balance
    âgée (`SOURCE_DES_LETTRAGES`), le refus de contre-passer une écriture lettrée ;
  - `lettrage.service.ts`, `lettrage.controller.ts`, `lettrage.dto.ts`, `vue.ts`, `lettrage.module.ts`.
- `src/tiers/tiers.module.ts` : `SOURCE_DES_LETTRAGES` ⇒ `RegistreDesLettrages` (à la place d'`AucunLettrage`) ;
  `balance-agee.ts` inchangé.
- `src/ecritures/` : `reference` sur la ligne (pièce, schéma, DTO, contrôleur, vue, contre-passation) ; la
  contre-passation prépare puis verrouille les comptes de tiers de l'écriture et refuse une écriture lettrée.
- `src/grand-livre/` : `reference` sur les mouvements. `src/config/` : `LETTRAGE_SEUIL_ECART` (validée au démarrage).
  `src/common/refus.ts` (quinze refus neufs). `src/module.manifest.ts` recopié à l'octet depuis `main`. README,
  `docker-compose.yml` (la variable).
- `test/socle/lettrage.socle-spec.ts` (26 tests).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` du commit poussé) :
  **47 suites, 714 passés, 3 sautés** ; `npm run lint`, `tsc --noEmit` et `npm run build` verts.
- **`npm run test:socle`** (vrai MongoDB 8.0 `rs0`, vrai Kafka ; doublures HTTP d'auth, de dossier-service et de
  document-service), sous `timeout 1400` et `--forceExit` : **203/203**, dont 26 neufs. Horloge FIXÉE (2026-05-04),
  seuil 1 000. Sur un jeu connu de sept pièces (CKODJO, CAFI, FSOTRA) :
  - **référence** saisie, gardée, lue ; référence malformée 400 ;
  - **refus nommés, rien d'écrit** : brouillard (`NON_VALIDEE`), ligne de produit (`HORS_COLLECTIF`), deux tiers ou
    deux collectifs, déséquilibre (écart 68 000, non soldable), ligne en double, un seul sens, ligne ou écriture
    introuvable, montant au-delà du reste (409, reste 59 000), proposition introuvable ; corps invalides 400 ; sans
    `lettrage:realiser` 403 ;
  - **automatique** : RÉFÉRENCE pour CKODJO (trois lignes, écart 600), MONTANT_ET_DATE pour CAFI (28 jours), rien pour
    FSOTRA ; à 20 jours, CAFI n'est plus proposé ; acceptée telle quelle ⇒ AA COMPLET `PROPOSE_PAR_LA_MACHINE`, la
    proposition citée `ACCEPTEE` dans la piste ; reprise modifiée ⇒ PARTIEL `CHOISI_PAR_L_UTILISATEUR`, `MODIFIEE` ;
  - **partiel** : FSOTRA lettré à 120 000 sur 200 000, reste 80 000 ;
  - **écart** : le solde à 600 près ⇒ 422 sans `solderLEcart` (soldable), puis `OD-000001` née validée, 411100 C 600
    au tiers / 658 D 600, pièce du règlement, AB COMPLET ; écart de 2 000 ⇒ 422 `ECART_AU_DELA_DU_SEUIL`, aucune
    écriture ; écart sur un partiel ⇒ 422 ; un client qui paie 300 de plus ⇒ `OD-000002`, 411200 D 300 / 758 C 300 ;
  - **balance âgée avant / après** : au 30/04, CKODJO (600) et CAFI (0) sortent, FSOTRA garde −80 000 en 0-30 (une
    ligne au lieu de sept) ; au 25/02, seul le lettrage daté du 20/02 compte (CKODJO 68 000, une ligne au lieu de
    deux), CAFI et FSOTRA identiques à l'avant ; le collectif 411 concorde toujours ;
  - **inaltérabilité** : la facture lettrée n'a pas changé d'un octet en base ; `updateOne` sur `lettrages` et
    `delettrages` lève ; piste chaînée intacte ;
  - **délettrage** : AB DEFAIT, tracé (`LETTRAGE_DEFAIT`), rejoué 409 ; les restes reviennent, la ligne d'écart
    redevient ouverte (CKODJO solde 0 en trois lignes) ; relettré AVEC la ligne d'écart ⇒ AC (AB n'est pas
    réutilisé), aucune écriture d'écart de plus ; la liste garde AB défait ;
  - **contre-passation** : écriture lettrée ⇒ 409 `ECRITURE_LETTREE` (`codes: AA`) ; délettrée, contre-passée, puis
    lettrée avec sa contre-passation (COMPLET) ;
  - **concurrence** : dix lettrages simultanés de 30 000 sur une facture de 100 000 ⇒ trois 201 (AD, AE, AF), sept
    409 `LIGNE_DEJA_LETTREE` ; 90 000 lettrés en base, reste 10 000 ; piste intacte ;
  - **balance publiée** : publiée (201), lettrée, republiée ⇒ 200, même version, même `checksum`, rien dans l'outbox ;
  - **exercice clos** : lettrage, délettrage et propositions ⇒ 409 `EXERCICE_CLOS` ; le lettrage se lit.
- **Mutations** (« rouge » = `Tests: … failed` et aucune erreur de compilation) : **unitaires 32/32** (code, bornes du
  reste, un seul sens, seuil, écart partiel, type, date, décision, devise, statut, sens, casse, doublon, partielle ;
  écart de référence, fenêtre, plus proche, devise du groupe, montant égal, un seul sens d'une référence (deux règles),
  ligne prise une fois, ligne sans reste, borne de la fenêtre ; sens de l'écart, charge, produit, classe du compte ;
  seuil de l'environnement et son défaut ; référence gardée par la contre-passation ; garde de la contre-passation).
  Quatre premières écritures n'étaient pas probantes (deux survivantes, une qui ne compilait pas, une introuvable après prettier) : deux tests renforcés, deux mutations réécrites. **Socle
  5/6** : date d'arrêté ignorée par le port, lettrages défaits comptés, numéro provisoire sur l'écart, port vide,
  exercice clos non contrôlé. **Survivante nommée** : le `$inc` de `version` du verrou retiré — équivalente
  aujourd'hui, car la tête de la piste chaînée de l'exercice (écrite par tout acte) sérialise déjà les transactions ;
  le verrou reste, pour ne pas dépendre de la piste et pour le compteur des codes.
- **`docker compose -p grp-b --profile comptabilite up -d --build`** : conteneurs `healthy`, `/api/v1/health` 200,
  les sept routes neuves mappées. Pile descendue avec ses volumes, image de vérification supprimée, **verrou Docker
  rendu** (pris à 01:54, rendu à 02:29).

## Pour la suite

- **Clôture (970)** : les à-nouveaux des collectifs se dérivent par tiers et ne reprennent que le non-lettré (ou
  toutes les lignes, avec leur lettrage reporté) ; un exercice clos refuse déjà lettrage et délettrage.
- Un seuil d'écart par dossier ; un délettrage d'une seule ligne ; l'acceptation de plusieurs propositions d'un coup.

## Definition of Done

- [x] Tests unitaires (Node 24, étage `verification`), lint des fichiers touchés, `tsc`, build.
- [x] `test:socle` sur un vrai MongoDB 8.0 en jeu de répliques et un vrai Kafka, sous `timeout`.
- [x] Mutations rouges sur l'assertion (logique neuve).
- [x] `docker compose up` sain (module Nest neuf).
- [x] Balance publiée inchangée.
- [x] PR de code fusionnée en rebase ; PR de docs (fiche, tracker, journal).
