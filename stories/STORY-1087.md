# STORY-1087 : La GED s'ouvre au cabinet — le fonds d'archives d'un client, numérisé par lots, contrôlé et versé

Status: in-progress — **écrite le 2026-11-24** par la session du groupe C juste avant de la coder (lot 6,
`PLAN-LOT-6-2026-11-23.md` §4, n° 2 de C), depuis le bloc de `epics-services-cabinet-2026-11-18.md` (EPIC-267, lot
G1) et le PRD des services du cabinet (FR-7 → FR-9, §2.3, D-SC-4 → 6).

**Service :** `document-service` (module `ged`, tenu par C) · **Points :** 8 · **Suite :** STORY-1088 (l'original
papier, retrouver), STORY-1100 (les factures comptabilisées rejoignent le fonds) · **Écrans :** FE-143 (archives du
client), AP-51 (la console voit l'archivage)
**Demandes :** à B (`auth-service` : le rôle `CAB_ARCHIVISTE` et les droits `ged:*` des rôles du cabinet ; le catalogue :
la copie du manifeste `ged`).

---

## Pourquoi

Le retour terrain du 18/11 dit que l'archivage est **le service le plus rentable** d'un cabinet. La GED de Prospera
existe déjà : elle reçoit, lit, contrôle, met en lots, verse avec bordereau et scellé, et ne détruit jamais. Mais elle
a été bâtie pour l'assurance : une pièce et un versement appartiennent à un **dossier sinistre**, les natures sont
celles d'un sinistre, et les droits passent par un rôle de la compagnie. Le cabinet ne peut pas s'en servir.

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls** dans `document-service` : le chemin de l'assurance ne change pas, ses tests passent tels quels (AC-1).
Les routes neuves sont sous `/api/v1/ged/cabinet`. Aucun événement Kafka neuf.

### 1. Le porteur devient générique (AC-1)

- Une pièce, un lot, un fonds et un versement gagnent un champ **`domaine`** : `SINISTRES` ou `CABINET`. Absent, il vaut
  `SINISTRES` (aucune migration : les pièces de l'assurance restent ce qu'elles sont).
- Au `CABINET`, le porteur est un **dossier client** de `dossier-service`, lu dans le read-model local
  `dossiers_dossier` (déjà nourri par `dossier.*`), avec sa portée (responsable, contributeurs). L'invariant AD-3 du
  module (« ged n'importe que ged, common, kafka, socle, ocr ») s'ouvre à ce seul read-model et à l'utilitaire de
  portée, nommés dans le test.

### 2. Le fonds d'archives d'un client (AC-2)

| Geste | Route | Droit |
|---|---|---|
| Ouvrir le fonds | `POST /ged/cabinet/dossiers/{dossierId}/fonds` | `ged:fonds:gerer` |
| Les fonds du dossier | `GET /ged/cabinet/dossiers/{dossierId}/fonds` | `ged:piece:consulter` |
| Un fonds | `GET /ged/cabinet/fonds/{numero}` | `ged:piece:consulter` |

Corps de l'ouverture : `{ code, periode: { debut, fin }, naturesAttendues[], volumetrieAnnoncee? }`. `code` : 2 à 8
majuscules ou chiffres, **choisi à l'ouverture** (`dossier-service` ne donne aucun code client), proposé par l'écran
depuis la raison sociale. Numéro **`ARC-AAAA-<CODE>-NNNNN`** (année d'ouverture, séquence par cabinet et par année,
jamais réutilisée). Refus : 404 `DOSSIER_INCONNU` (hors portée compris), 409 `CODE_DE_FONDS_PRIS` (même code pour un
autre dossier du cabinet), 409 `DOSSIER_ARCHIVE`, 422 `NATURE_INCONNUE`.

### 3. Le plan de classement OHADA (AC-3)

- Une table **versionnée** neuve, `ged-cabinet-2026.1.json` (empreinte SHA-256 épinglée comme `ged-2026.x`) : les
  natures (facture d'achat, facture de vente, avoir, relevé bancaire, pièce de caisse, bulletin de paie, contrat de
  travail, pièce d'identité, pièce médicale, contrat, statuts, procès-verbal, déclaration fiscale, liasse, autre),
  chacune avec `sensible` et sa **durée de conservation** (10 ans par défaut pour les pièces comptables, à confirmer sur
  l'AUDCIF : Q-SC-3) ; les champs d'index : `nature`, `exercice`, `date`, `tiers`, `montant` (facultatif),
  `reference`.
- Le cabinet **ajoute** ses natures : `POST /ged/cabinet/natures` `{ code, libelle, sensible }` (`ged:fonds:gerer`) ;
  `GET /ged/cabinet/natures` rend le plan servi (table, puis natures du cabinet). Une nature ajoutée ne se supprime
  pas.

### 4. Le circuit existant, sous les droits du cabinet (AC-4)

- Pièces, lots, indexation, contrôle humain, versement, scellé, vérification : **les routes existantes**, avec
  `domaine: CABINET` et le `dossierId` du client. Le versement d'un fonds du cabinet ajoute un **bordereau** au fonds
  ouvert (il n'en crée pas un à la clôture, comme pour un sinistre).
- Au `CABINET`, les droits se lisent par **`GET /moi/droits`** d'`auth-service` (jamais dans le jeton, PRD §2.3), et
  non plus par `roleExerce` : `ged:fonds:gerer`, `ged:lot:numeriser`, `ged:piece:indexer`, `ged:versement:verser`,
  `ged:piece:consulter`, `ged:sensible:consulter`. Refus : 403 `DROIT_INSUFFISANT` (`details.droit`).
- **Portée** : le `TENANT_ADMIN` et l'archiviste (`ged:fonds:gerer`) voient les fonds de tous les dossiers du cabinet ;
  un collaborateur, ceux de son portefeuille ; hors portée : 404. `CAB_ARCHIVISTE` **ne lit rien d'autre** du dossier
  (il n'a aucun droit d'un autre module : c'est l'affaire de B).

### 5. Les pièces déjà déposées (AC-5)

`GET /ged/cabinet/fonds/{numero}/pieces-du-dossier` rend, **par référence**, les pièces que le dossier a déjà ailleurs
dans le service (pièces de constitution `profil-documents`, pièces comptables `piece-documents`) : type, nom, date,
empreinte. `POST /ged/cabinet/fonds/{numero}/reprises` `{ references[] }` les **copie** dans la GED avec leur empreinte,
liées à l'original (`origine: { systeme, id, empreinte }`), à indexer puis contrôler comme une pièce reçue. L'original
n'est jamais déplacé ni modifié.

### 6. Les natures sensibles (AC-7)

Bulletins, contrats de travail, pièces médicales, pièces d'identité (et toute nature du cabinet marquée `sensible`) :
lisibles seulement avec `ged:sensible:consulter`, **404** sinon (au `CABINET` ; l'assurance garde son 403). Test par
rôle.

### 7. Chiffrées au repos, jamais supprimées (AC-6)

**Toutes** les pièces du cabinet sont chiffrées par le service (AES-256-GCM, le patron déjà éprouvé des pièces de santé)
avec une clé propre, `GED_CLE_CABINET` ; sans elle, 503 `CHIFFREMENT_INDISPONIBLE`. Le stockage n'a toujours aucune
méthode de suppression.

### 8. Le quota de l'offre (Q-SC-5) — choix par défaut, contestable

**20 Go par cabinet** (paramètre `GED_QUOTA_CABINET_OCTETS`) ; le volume stocké est compté par cabinet ; au-delà, une
**alerte** (`quotaDepasse` dans la réponse du dépôt), **jamais** un blocage du dépôt ni de la consultation. La console
le montre avec AP-51.

### 9. Manifeste

`ged` passe en **1.1.0** dans `prospera-stories/manifestes/ged.manifest.ts` et sa copie du service : la verticale
cabinet, `ged:physique:gerer` (STORY-1088) déclaré, `routesLectureSeule` remis sur les routes réelles (les cinq
d'aujourd'hui sont des propositions qui n'existent pas) et les routes de lecture du cabinet. **→ B** : copie au
catalogue après la fusion.

### Amendement du 2026-11-24 — le plan suit le dossier client d'un cabinet (recherche demandée par l'utilisateur)

**Ce que font les cabinets.** Le dossier d'un client s'y tient en deux parties : le **dossier permanent** (les
informations durables, utiles à toutes les missions : statuts, RCCM, contrats importants, organigramme, lettre de
mission, description de l'activité et du système comptable ; tenu à jour, les documents dépassés en sortent) et le
**dossier annuel**, un par exercice (pièces comptables, déclarations, états, et les travaux du cabinet qui prouvent les
diligences : feuilles de travail, note de synthèse). Le classement se fait par fonction, et chaque document porte le
nom du client et la référence de son sous-dossier. La destruction d'un dossier est approuvée par la direction du
cabinet et inscrite à un registre. En fin de mission, le cabinet restitue au client les documents qu'il lui a confiés.

**Le droit applicable.** L'AUDCIF (OHADA 2017), article 24 : livres, pièces justificatives et documents équivalents
conservés **dix ans**. Togo, loi n° 2017-007 sur les transactions électroniques : l'écrit électronique a la force
probante du papier si son auteur est identifié et son intégrité garantie par sa conservation ; la durée de conservation
des documents électroniques y est de vingt ans, ou celle du papier (un projet d'amendement porte vingt ans au moins pour
les copies électroniques : à vérifier avant de s'y fier). Les référentiels d'une « copie fiable » sont NF Z42-026 (la
numérisation fidèle) et NF Z42-013 / ISO 14641 (la conservation) : non obligatoires, ils servent de preuve en cas de
contrôle ou de litige.

**Ce que cela change au contrat** (ajouts seuls, transmis à la sous-session de code le 24/11) :

- Chaque nature appartient à une **rubrique** : `PERMANENT` (sans exercice ; sous-rubriques `JURIDIQUE`, `CONTRATS`,
  `MISSION`) ou `ANNUEL` (exercice **exigé**, 422 `EXERCICE_REQUIS` ; sous-rubriques `ACHATS`, `VENTES`, `TRESORERIE`,
  `SOCIAL`, `FISCAL`, `ETATS`, `TRAVAUX`). Le fonds rend ses pièces groupées par rubrique, et par exercice pour
  l'annuel. Une nature ajoutée par le cabinet déclare sa rubrique et sa sous-rubrique.
- Chaque nature porte `conservationAns` (**10** par défaut, AUDCIF art. 24) et son point de départ : `FIN_EXERCICE` pour
  l'annuel, `FIN_MISSION` pour le permanent. Affichée seulement : aucune destruction (la destruction, approuvée et
  inscrite au registre, est d'un lot suivant).
- Chaque version déposée au cabinet garde sa **trace de numérisation** quand le dépôt la donne (`format`,
  `resolutionDpi`, `pages`, opérateur, date) ; le contrôle humain reste obligatoire avant le versement. Avec l'empreinte,
  le scellé et le journal déjà en place, c'est la base d'une copie fiable, sans prétendre à une certification.
- La **restitution** en fin de mission (bordereau) appartient à STORY-1088 (AC-4), qui la sert déjà.

Sources : [mémoire « Procédé d'organisation du dossier client »](https://www.memoireonline.com/05/14/8893/Procede-dorganisation-du-dossier-client-et-de-revision-de-comptes.html),
[OQLF, « dossier permanent »](https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/503747/dossier-permanent),
[IBR, « Les documents de travail du réviseur »](https://www.ibr-ire.be/docs/default-source/fr/Documents/reglementation-et-publications/normes-et-recommandations/recommandations/Les-documents-de-travail-du-reviseur.pdf),
[AUDCIF, article 24](https://www.lexenegal.sn/code/ohada-comptabilite-information-financiere/art-24),
[Togo, loi 2017-007](http://kalieu-elongo.com/wp-content/uploads/2018/03/Togo-Loi-2017-07-transactions-electroniques.pdf),
[rapport de l'Assemblée nationale sur son amendement](https://assemblee-nationale.tg/wp-content/uploads/2023/07/Transaction-electro-Rapport.pdf),
[valeur probante, NF Z42-013 et NF Z42-026](https://www.solutions-numeriques.com/dossiers/larchivage-a-vocation-probatoire),
[restitution en fin de mission](https://lawinsider.com/fr/contracts/aKNIuiKl7mS).

### Décisions prises au contrat (contestables)

- **D-1087-1** : le porteur générique est un champ `domaine` plutôt qu'un module neuf : un seul circuit, deux porteurs.
- **D-1087-2** : le code du fonds est choisi à l'ouverture (aucun code client n'existe chez `dossier-service`).
- **D-1087-3** : au cabinet, un fonds s'ouvre d'abord et reçoit des bordereaux au fil de l'eau ; à l'assurance, il
  naît du versement d'un dossier clos. Les deux restent sans suppression.
- **D-1087-4** : les droits du cabinet viennent de `/moi/droits` ; tant que B n'a pas attribué `ged:*` aux rôles du
  cabinet, seul un `TENANT_ADMIN` a ces droits (comme tout droit du tenant d'aujourd'hui).
- **D-1087-5** : quota par défaut de 20 Go par cabinet, en alerte seulement (Q-SC-5 reste à l'utilisateur).

## Critères d'acceptation

- **AC-1** : le chemin de l'assurance ne change pas : ses tests passent tels quels ; une pièce sans `domaine` est une
  pièce de sinistre.
- **AC-2** : un fonds s'ouvre par dossier client, avec sa période, ses natures attendues et sa volumétrie ; son numéro
  est `ARC-AAAA-<CODE>-NNNNN`.
- **AC-3** : le plan de classement OHADA est un paramètre versionné ; le cabinet y ajoute des natures.
- **AC-4** : lots, indexation, contrôle, versement et scellé passent sous les droits `ged:*` lus chez `auth-service` ;
  la portée du collaborateur est respectée ; hors portée, 404.
- **AC-5** : les pièces déjà déposées apparaissent par référence ; les reprendre les copie avec leur empreinte, liées à
  l'original.
- **AC-6** : toutes les pièces du cabinet sont chiffrées au repos ; aucune suppression.
- **AC-7** : une nature sensible ne se lit qu'avec `ged:sensible:consulter` (404 sinon) ; test par rôle.
