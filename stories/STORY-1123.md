# STORY-1123 : Les alertes de l'archiviste — retour en retard, échéance proche, quota dépassé, écart d'intégrité et étapes d'une destruction, publiés

Status: done — **livrée le 2026-11-26** : document-service **#37** (`7e65881` sur `dev`), catalogue **#81** (`85aee3a`,
`ged` 1.8.0) ; voir « Livraison ». Fiche écrite le 2026-11-26 par la session du groupe B juste avant de la coder (lot 7, n° 5 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 5 ; identifiant réservé D-L7B-1).

**Service :** `document-service` (GitHub `prospera-ocr-service`, module `ged`) · **Points :** 5 · **Dépend de :**
STORY-1088 (sorties, `enRetard`), STORY-1087 (quota), STORY-1119 (campagnes d'intégrité), STORY-1121 (destruction),
STORY-1122 (index aveugle et son balayage, D-1122-11, D-1122-13) · **Suite :** la cloche et l'e-mail dans
`prospera-notification-service` (**D**, demande écrite au journal de B) ; STORY-1125 (compteurs par cabinet, quota de
l'offre) · **Écran :** FE-143 (A, lot 8)
**Sources :** STORY-1088 (D-1088-3 : « l'alerte de retard est une lecture, sans notification pour l'instant ») ;
STORY-1087 (D-1087-5 : « quota par défaut de 20 Go par cabinet, en alerte seulement ») ; STORY-1119 (D-1119-10 : « la
publication d'un écart et l'alerte de l'archiviste sont nommées pour STORY-1123 ») ; STORY-1121 (D-1121-9 : « l'alerte
d'échéance proche et le fait de destruction sont à STORY-1123 ») ; STORY-1122 (D-1122-11 : « les pièces échues de tout
le cabinet vont à STORY-1123 ») ; PRD des services du cabinet (§4.2 : « alerte au retard » ; FR-11 ; FR-19 : « le
dépassement d'un quota alerte, il ne bloque pas »).

---

## Pourquoi

Aujourd'hui l'archiviste doit **aller voir** : la liste des sorties en retard, les pièces échues fonds par fonds, le
quota dans la réponse d'un dépôt, le résultat d'une campagne de contrôle. Rien ne le prévient, et un original prêté à
un contrôleur peut rester dehors trois mois sans que personne ne le sache. Cette story fait **publier par la GED** les
faits qui méritent une cloche ou un e-mail, avec leurs destinataires connus de la GED, sans un mot du contenu d'une
pièce ; `notification` (D) les transforme en messages. Elle donne aussi la liste des pièces échues **de tout le
cabinet**, servie par l'index de STORY-1122.

## Ce qui est déjà livré (relu dans le code le 26/11)

- **STORY-1088** : `GET …/sorties?enRetard=true` (`joursDeRetard` au-delà de `GED_RETARD_TOLERANCE_JOURS`), une lecture.
- **STORY-1087** : `GET …/quota` et `quotaDepasse` dans la réponse d'un dépôt ; le quota est **un seul paramètre du
  service** (`GED_QUOTA_CABINET_OCTETS`, 20 Go) ; le volume est la somme des versions non détruites du cabinet
  (`DepotGed.volumeCabinet`). **Aucun quota par offre** n'existe au catalogue ni ailleurs (relu : `platform-catalog-service`
  n'a que le champ libre `config` d'un octroi), aucun compteur par cabinet (STORY-1125).
- **STORY-1119** : la campagne d'intégrité (`executerCampagne`) s'achève par une entrée `CONTROLE_PERIODIQUE` qui
  compte les fonds en écart et dit si la chaîne du journal tient ; un avertissement au journal du service, rien d'autre.
- **STORY-1121** : chaque acte d'une destruction s'inscrit au journal dans sa transaction (`DepotIntegrite.inscrire`) ;
  `ged.destruction.decidee@1` est déclaré au manifeste (le contrat de l'assurance), jamais publié. Les pièces échues se
  lisent **fonds par fonds** (`GET …/fonds/{numero}/pieces-echues`).
- **STORY-1122** : une entrée d'index par pièce du cabinet, tenue après chaque écriture et par le **balayage** de la
  file `ged-index` (toutes les `GED_INDEX_BALAYAGE_SECONDES`, défaut 15 ; un tour du cabinet par pages de 500, recommencé
  un jour après sa fin, D-1122-13). L'entrée ne porte **pas** l'échéance.
- **Publication** : la GED publie déjà par l'**outbox** (`OutboxService.enqueue` dans la transaction de l'écriture,
  relais Kafka du service) les faits de l'assurance (`faits-ged.ts`, schémas copiés de `prospera-plateforme`,
  `contrats/assurance/ged/`). **Le cabinet ne publie rien.**
- **`notification`** (D, relu sans y toucher) : la cloche (`in-app`) et l'e-mail existent ; ses règles ne visent que des
  topics d'une liste fermée (`EVENEMENTS_DECLENCHEURS`), et **le module appelant remet la liste des destinataires**
  (FR-N28, AD-19 : `notification` ne cible pas par rôle). D'où `destinataires` dans chaque fait.

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls.** Cinq topics neufs (schémas JSON au dépôt, `contrat/schemas/`, sujets neufs au registre en BACKWARD),
une route de lecture neuve sous `/api/v1/ged/cabinet` (gate `GED_NOT_ENTITLED`, droits par `GET /moi/droits`), une
variable neuve. **Aucun droit neuf** (auth inchangé), aucune dépendance neuve, aucune file neuve, **aucune minuterie
neuve** (D-1123-3). Le chemin de l'assurance ne change pas.

### 1. Les faits (AC-1 → AC-5)

Par l'**outbox**, dans la transaction de ce qui les cause. Topics sans suffixe de version (D-991-3), clé
`organisationId`, enveloppe dans la charge (`eventId` déterministe, `schemaVersion: 1`, `occurredAt`, `emisLe`).
⛔ **Aucun fait ne porte un contenu de pièce** (ni tiers, ni NIF, ni montant, ni texte lu, ni libellé de nature, ni nom
de fichier), **ni** le motif ou l'emprunteur d'une sortie, ni la raison sociale du client, ni une observation (D-1123-5).

Chaque fait porte **`destinataires`** : les identifiants d'utilisateur que la GED connaît pour ce fait (0 à 20, sans
doublon) ; **vide**, c'est à `notification` de choisir (D-1123-6).

| Topic | Quand | Charge (en plus de l'enveloppe et de `organisationId`) | `destinataires` |
|---|---|---|---|
| **`ged.original.retour-en-retard`** | une sortie non rentrée atteint **1, 7 puis 30 jours** de retard (tolérance déduite, `GED_RETARD_TOLERANCE_JOURS`) ; un fait par palier, le plus haut atteint seul | `sortieId`, `fondsNumero`, `dossierId`, `boiteId`, `cote?`, `pieceId?`, `retourPrevuLe` (`AAAA-MM-JJ`), `joursDeRetard`, `palier` (1, 7, 30), `sortiPar`, `constateLe` | qui a enregistré la sortie, le responsable du dossier |
| **`ged.conservation.echeance-proche`** | des pièces d'un fonds **entrent dans l'horizon** d'échéance (`GED_ALERTE_ECHEANCE_JOURS`, défaut 90) — y compris déjà échues, la première fois qu'elles sont vues ; une pièce n'est annoncée qu'une fois par échéance | `fondsNumero`, `dossierId`, `pieces` (annoncées par ce fait), `dontEchues`, `premiereEcheance`, `horizonJours`, `jusquau`, `constateLe` | le responsable du dossier |
| **`ged.quota.depasse`** | le volume du cabinet **passe au-dessus** de son quota (une fois par franchissement ; repassé dessous, il se réarme) | `volumeOctets`, `quotaOctets`, `constateLe` | aucun (D-1123-6) |
| **`ged.integrite.ecart`** | une campagne d'intégrité se termine avec **au moins un fonds en écart** ou **un journal rompu** | `campagneId`, `origine` (`PERIODIQUE`, `DEMANDE`), `fonds`, `enEcart`, `journalOk`, `ruptureRang?`, `termineeLe` | qui a demandé la campagne (`DEMANDE`) |
| **`ged.destruction.changed`** | une destruction change d'état : `PROPOSEE`, `VISEE`, `REFUSEE`, `ACCORDEE`, `ABANDONNEE`, `EXECUTEE` (`EN_EXECUTION` n'est pas publiée) | `destruction` (`DES-…`), `fondsNumero`, `dossierId`, `etat`, `etatPrecedent?`, `pieces`, `par`, `bordereau?` (`BDE-…`), `procesVerbal?` (`PVD-…`), `detruites?`, `exclues?`, `changeLe` | les personnes de la destruction (proposant, viseur, qui a demandé l'exécution), sauf `par` |

- **Une seule fois** : les paliers de retard se marquent sur la sortie, l'échéance annoncée sur l'entrée d'index de la
  pièce, l'état du quota par cabinet, **dans la transaction du fait** ; un état de destruction est un acte unique.
  `eventId` = empreinte de `topic | identité` (`organisation|sortie|palier`, `organisation|fonds|jour`, `organisation|
  quota|jour`, `organisation|campagne`, `organisation|destruction|état`).
- `ged.destruction.decidee@1` reste déclaré pour l'assurance, non publié (D-1123-7).

### 2. Quand la GED regarde (AC-6)

**Le balayage de STORY-1122** (file `ged-index`, planificateur `ged-index-balayage`, toutes les
`GED_INDEX_BALAYAGE_SECONDES`) porte aussi **le passage des alertes**, **une fois par jour** (jour UTC du service), au
premier balayage du jour : les retards (sorties ouvertes de tous les cabinets), les échéances (lues dans l'index), les
quotas (un par cabinet qui a un fonds). Un passage pris par une instance ne se rejoue pas le même jour ; ce qu'il
n'a pas annoncé (une panne) l'est au passage suivant (les marques ne sont posées qu'avec leur fait). Les faits de
destruction et d'intégrité partent avec leur acte, sans attendre le passage. `GED_INDEX_BALAYAGE_SECONDES=0` coupe
l'index et les alertes du passage (D-1123-3).

### 3. L'échéance dans l'index (AC-7)

- Chaque entrée de `ged_index_recherche` gagne **`echeance`** (`AAAA-MM-JJ`, la règle de STORY-1121 :
  `echeanceDeConservation`, nature du plan, exercice, période et fermeture du fonds), et **`echeanceAnnoncee`** (l'échéance
  déjà annoncée par un fait). L'écriture d'une entrée garde `echeanceAnnoncee` tant que l'échéance ne change pas.
- **Tenue** : à chaque indexation (après une écriture, au balayage) ; et le **tour du cabinet** compare l'échéance tenue à
  celle de la pièce (plan et fonds lus une fois par page) et la corrige sans réindexer le texte — ce qui rattrape la
  fermeture d'un fonds (une échéance `FIN_MISSION` naît, toujours des années plus tard : D-1123-8), un changement de durée
  au plan, et les entrées d'avant cette story (au tour suivant).

### 4. Les pièces échues de tout le cabinet (AC-8)

`GET /ged/cabinet/pieces-echues?horizonJours=&curseur=&limite=` (`ged:fonds:gerer`, tout le cabinet) → `{ aujourdhui,
jusquau, pieces, masquees, curseur? }` :

- sans `horizonJours` (ou `0`) : les pièces **échues** (échéance passée) ; avec `horizonJours` (1 → 3 650) : aussi celles
  dont l'échéance tombe d'ici là (`echue: false`) ;
- **ordre** : par échéance, puis par pièce ; `limite` ≤ 200 (défaut 100) ; `curseur` opaque (400 `CURSEUR_INVALIDE`) ;
- chaque ligne : celle de la liste d'un fonds (`pieceId`, `nature`, `libelleNature`, `sensible`, `exercice?`, `date?`,
  `reference?`, `echeance`, `versions`, `original?`, `blocage?`) plus **`echue`**, **`fondsNumero`**, **`dossierId`**,
  **`raisonSociale`** ; une pièce échue gelée, sortie ou déjà proposée porte son `blocage` comme dans la liste du fonds ;
- **la pièce relue fait foi** (D-1122-9) : candidate lue dans l'index, jugée sur la pièce et son fonds ; détruite ou
  devenue non échue, elle est écartée ; une nature sensible ne se montre qu'avec `ged:sensible:consulter` (sinon comptée
  dans `masquees`).

### Données, configuration, manifeste

- Champs neufs : `ged_index_recherche.echeance`, `.echeanceAnnoncee` (index partiels `echeances_du_cabinet`
  `{ organisationId, echeance, pieceId }` et `echeances` `{ echeance }`) ; `ged_sorties.retardAnnonce` (le palier) ;
  collection neuve **`ged_alertes`** (le jour du dernier passage ; l'état du quota de chaque cabinet).
- Variable neuve **`GED_ALERTE_ECHEANCE_JOURS`** (90 ; 1 → 3 650).
- **Manifeste `ged` 1.8.0** (`manifestes/ged.manifest.ts`, cette PR) : les cinq topics en `publie`, `GET
  /api/v1/ged/cabinet/pieces-echues` en `routesLectureSeule` ; `droits`, `consomme` inchangés ; recopié dans le service par
  le code, **puis au catalogue par B** après la fusion du code.
- **Registre** : `npm run schemas:enregistrer` (BACKWARD par sujet ; les cinq sujets sont neufs).
- **OpenAPI** : la route neuve et son DTO de réponse ; A en génère les types.

## Livraison (2026-11-26)

- **Code** : document-service (`prospera-ocr-service`) **#37**, `7e65881` sur `dev` (un commit, arbre identique à `d4220d6`
  poussé) : `src/modules/ged/cabinet/` `faits-du-cabinet.ts` (topics, constructeurs, paliers, destinataires,
  `PublicationDuCabinet` par l'outbox), `alertes.service.ts` (`AlertesDeLArchiviste.passer`), `depot-alertes.ts`
  (`ged_alertes`) ; `depot-recherche.ts` (`echeance`, `echeanceAnnoncee`, l'annonce gardée par l'écriture, liste par échéance,
  fonds à annoncer, annonce dans la transaction), `index-de-recherche.ts` (l'échéance posée à l'indexation et corrigée par
  le tour), `recherche.planificateur.ts` (le passage après le balayage), `destruction.service.ts` (six étapes publiées,
  `piecesEchuesDuCabinet`), `integrite.service.ts` (l'écart publié avec son entrée), `depot-physique.ts` (sorties en retard,
  palier marqué), `depot-cabinet.ts` (`resumesDesFonds`, `organisationsDuCabinet`), `dossiers-clients.ts` (`responsable`) ;
  cinq schémas dans `contrat/schemas/` ; `GED_ALERTE_ECHEANCE_JOURS`. Manifeste `ged` **1.8.0** recopié depuis
  `prospera-stories@becec97` (#950), empreinte épinglée.
- **Catalogue** : `platform-catalog-service` **#81**, `85aee3a` sur `dev` : `ged` 1.8.0 recopié depuis
  `prospera-stories@5b54ed7` (seul manifeste qui change ; `manifestes:garde` verte, 48).
- **Preuves** :
  - document-service, Node 25 : unitaires 1 336 passés (115 suites ; 2 rouges connues du poste, copies CRLF de
    `ged.service.spec`, chemins Windows de `piece-conservation.spec`) ; e2e **217/217** (recensement de STORY-695 compris :
    `GET ged/cabinet/pieces-echues` classée) ; lint des fichiers touchés, `tsc`.
  - Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive d4220d6`) : **115/115 suites**, 1 339
    passés ; e2e **217/217**.
  - Mutations **13/14** rouges sur assertion (+1 équivalente, M4 : la borne de la requête des sorties en retard est redoublée
    par `joursDeRetard`) : palier un jour trop tard, la personne qui agit destinataire, passage rejoué, palier republié sans
    marque, échéance annoncée deux fois, annonce perdue à la réécriture, quota réarmé qui publie, tour qui ne corrige pas,
    indexation sans échéance, pièce relue qui ne fait pas foi, visa refusé publié `VISEE`, journal rompu sans fait, curseur
    fabriqué accepté (la suite ne termine plus : comptée tuée). Catalogue 1/1.
  - **Pile `grp-b` neuve** (image depuis l'archive ; Mongo rs0, Kafka, Karapace 6.2, Redis, MinIO Chainguard, doublure
    d'auth ; `GED_INDEX_BALAYAGE_SECONDES=2`, `GED_QUOTA_CABINET_OCTETS=1000`) : échéances à l'index (2015 → 2025-12-31,
    2016 → 2026-12-31, statuts d'un fonds ouvert : aucune) ; le passage pris par le balayage en 2,1 s ; **retour en retard**
    (sortie prévue dix jours plus tôt : palier 7, destinataires qui a sorti et le responsable du dossier, cote, ni motif ni
    emprunteur) ; **échéance proche** (un fait : 3 pièces dont 2 échues, première échéance 2025-12-31, horizon 2027-02-24) ;
    **quota dépassé** (une pièce de 4 Ko : 4 098 octets pour 1 000, un fait, état `depasse`) ; marques posées (sortie au
    palier 7, échéances annoncées) ; **une pièce réindexée garde son annonce** (le remplacement par pipeline) ; un second
    passage le même jour ne publie rien ; `GET …/pieces-echues` : les deux de 2015, avec 60 jours la 2016 (`echue: false`),
    `400 CURSEUR_INVALIDE`, collaborateur `403` ; **destruction** proposée, visée, accordée, exécutée par la file : quatre
    faits dans l'ordre, destinataires sans la personne qui agit, `PVD-2026-00001`, plus aucune pièce échue, entrée détruite
    sans échéance ; **écart d'intégrité** (un objet remplacé dans MinIO : campagne `FICHIER_MODIFIE`, un fait à qui l'a
    demandée) ; tout `SENT` ; **Kafka** : 1 + 1 + 1 + 1 + 4 messages lus, chacun valide contre son contrat ; **registre** : 14
    sujets enregistrés (5 neufs), `schemas:compatibilite` verte (BACKWARD) ; aucun contenu de pièce dans les faits ; aucune
    erreur au journal du service. Verrou 05:11 → 07:04 (sous-session coupée par la limite de l'API pendant la pile, pile
    descendue à la reprise : piège), puis une passe de 07:17 à 07:26, `down -v`.
- **Variable neuve** : `GED_ALERTE_ECHEANCE_JOURS` (90 ; 1 → 3 650).

### Écarts au contrat, décidés au code

- **D-1123-12 — Le curseur de la liste du cabinet suit celui de la liste d'un fonds** : il est rendu dès qu'une page est
  pleine ; une dernière page pleine en rend un, et la suivante est vide.
- **D-1123-13 — Le quota se regarde au passage du jour** : le dépôt continue de dire `quotaDepasse` sur-le-champ (STORY-1087) ;
  le fait part au passage suivant (au plus un jour).
- **D-1123-14 — En mémoire, une panne de l'outbox n'annule pas l'écriture** (les doubles n'ont pas de transaction) : les
  tests prouvent que l'acte n'est pas inscrit ; l'annulation de la proposition elle-même est celle de la transaction
  MongoDB (même session que l'acte et le fait), non rejouée en panne sur la pile.

## Critères d'acceptation

- **AC-1** : une sortie non rentrée publie `ged.original.retour-en-retard` à 1, 7 et 30 jours de retard, une fois par
  palier ; rentrée, plus rien ; sans motif ni emprunteur.
- **AC-2** : les pièces d'un fonds qui entrent dans l'horizon publient **un** `ged.conservation.echeance-proche` par fonds
  et par passage ; une pièce n'est annoncée qu'une fois par échéance ; une pièce détruite, jamais.
- **AC-3** : le franchissement du quota publie `ged.quota.depasse` une fois ; repassé dessous puis dessus, encore une
  fois ; jamais un blocage.
- **AC-4** : une campagne d'intégrité en écart (ou au journal rompu) publie `ged.integrite.ecart` dans la transaction de
  son entrée `CONTROLE_PERIODIQUE` ; une campagne sans écart, rien.
- **AC-5** : chaque étape d'une destruction publie `ged.destruction.changed` dans la transaction de son acte ; la course
  perdue d'une proposition ne publie rien.
- **AC-6** : le passage des alertes se fait une fois par jour, porté par le balayage de STORY-1122 ; deux instances ne le
  jouent pas deux fois.
- **AC-7** : l'entrée d'index porte l'échéance de la pièce, corrigée par le tour (fermeture d'un fonds, durée changée,
  entrée d'avant la story) ; l'annonce se garde tant que l'échéance ne change pas.
- **AC-8** : `GET …/ged/cabinet/pieces-echues` rend les pièces échues (et proches, avec l'horizon) de tous les fonds, par
  échéance, sans parcourir les fonds ; les blocages et le masquage des natures sensibles sont ceux de la liste d'un fonds.
- **AC-9** : chaque fait est valide contre son schéma ; aucun ne contient un tiers, un NIF, un montant, un texte lu, un
  motif, un emprunteur ni une raison sociale ; les cinq sujets s'enregistrent au registre (BACKWARD).

## Décisions prises au contrat (contestables)

- **D-1123-1 — Des faits, pas des messages** : la GED dit ce qui arrive et à qui elle le sait ; `notification` (D) choisit
  la cloche, l'e-mail, les gabarits et le reste des destinataires. La demande est écrite au journal de B (« Demandes »).
- **D-1123-2 — Un fait par fonds et par jour pour l'échéance, par palier pour un retard** : une cloche par pièce noierait
  l'archiviste (un fonds verse 1 500 pièces d'un coup) ; un retard se rappelle à 7 et 30 jours, jamais chaque jour.
- **D-1123-3 — Aucune minuterie neuve : le rythme de STORY-1122** (D-1122-13) : le passage quotidien des alertes est porté
  par le balayage `ged-index` (le premier du jour), comme le tour de l'index ; les faits d'acte partent avec leur acte.
  Une seule bascule (`GED_INDEX_BALAYAGE_SECONDES=0`) coupe l'index et le passage.
- **D-1123-4 — Le quota reste celui du service** (D-1087-5 : `GED_QUOTA_CABINET_OCTETS`, 20 Go) et le volume, celui de
  `volumeCabinet` : **aucun compteur par cabinet** ici. STORY-1125 apporte les compteurs et le quota de l'offre ; l'alerte
  les lira alors (une ligne de `etatDuQuota`). Q-SC-5 (le quota de l'offre et son prix) reste à l'utilisateur.
- **D-1123-5 — Ce qu'un fait ne porte jamais** : rien du contenu d'une pièce (tiers, NIF, montant, texte lu, libellé), ni le
  motif, l'emprunteur ou l'observation d'une sortie (texte libre, souvent un nom), ni la raison sociale (le fonds et le
  dossier se nomment par leurs numéros ; l'écran les retrouve). Un bus est durable et rejouable.
- **D-1123-6 — `destinataires` : ce que la GED sait, rien de plus** : qui a enregistré la sortie, le responsable du dossier
  (read-model local `dossiers_dossier`), les personnes d'une destruction, qui a demandé la campagne. La GED ne connaît pas
  les membres d'un rôle (archivistes, associés, administrateur) : un fait sans destinataire (`quota`, une campagne
  périodique, une proposition qui attend un visa) laisse le choix à `notification` (recommandation dans la demande à D :
  l'administrateur du cabinet, ou les destinataires écrits par le cabinet sur sa règle).
- **D-1123-7 — `ged.destruction.changed`, pas `ged.destruction.decidee`** : le nom déclaré vient du contrat de l'assurance
  (double visa `RESP` puis `DG`, `contrats/assurance/ged/` de la plateforme, à D) et dit un seul moment ; le cabinet a six
  étapes, dont trois attendent quelqu'un (visa, accord, exécution). Un fait d'état, comme `ged.lot.changed`.
- **D-1123-8 — La fermeture d'un fonds n'exige pas de recalcul immédiat** : elle fait naître l'échéance des pièces
  `FIN_MISSION` à **fermeture + durée** (dix ans au moins), jamais dans l'horizon ; le tour la tient dans la journée.
- **D-1123-9 — Les pièces déjà échues à la première vue sont annoncées** (`dontEchues`) : un fonds d'archives anciennes
  versé aujourd'hui est exactement ce que l'archiviste doit savoir.
- **D-1123-10 — L'export prêt et la fermeture d'un fonds ne sont pas publiés** (STORY-1120 les nommait ici) : la personne
  qui les demande est devant l'écran ; nommés pour plus tard.
- **D-1123-11 — La recette de l'Atelier n'est pas rejouée** si le diff ne touche ni l'OCR, ni les extractions, ni le
  module Nest commun (seul `GedModule` gagne des fournisseurs), comme D-1122-12.

## Nommé pour plus tard

- La cloche et l'e-mail (D, `prospera-notification-service`).
- Le quota de l'offre et les compteurs par cabinet (STORY-1125) ; un seuil d'approche (80 %).
- L'export prêt, la fermeture d'un fonds (D-1123-10) ; une alerte sur la file « à rattacher » du cabinet.
