# STORY-969 : le lettrage — manuel, automatique (montant, référence, date), partiel, délettrage, écarts de règlement

Status: in-progress

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

_(à la fusion)_

## Preuves

_(à la fusion)_

## Pour la suite

- **Clôture (970)** : les à-nouveaux des collectifs se dérivent par tiers et ne reprennent que le non-lettré (ou
  toutes les lignes, avec leur lettrage reporté) ; un exercice clos refuse déjà lettrage et délettrage.
- Un seuil d'écart par dossier ; un délettrage d'une seule ligne ; l'acceptation de plusieurs propositions d'un coup.

## Definition of Done

- [ ] Tests unitaires (Node 24, étage `verification`), lint des fichiers touchés, `tsc`, build.
- [ ] `test:socle` sur un vrai MongoDB 8.0 en jeu de répliques et un vrai Kafka, sous `timeout`.
- [ ] Mutations rouges sur l'assertion (logique neuve).
- [ ] `docker compose up` sain (module Nest neuf).
- [ ] Balance publiée inchangée.
- [ ] PR de code fusionnée en rebase ; PR de docs (fiche, tracker, journal).
