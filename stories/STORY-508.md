# STORY-508 : Les engagements hors bilan sont tenus — et n'entrent jamais au bilan

Status: in_progress

**Complexité :** high
**Épic :** EPIC-126 — Articulation portefeuille → balance
**Service :** `microfinance-service`
**Points :** 5 · **Sprint :** S20
**Prérequis :** **STORY-501** (crédits par événements) · **STORY-504** (garanties admises par le paquet) · **STORY-507** (publication canonique)
**Assigné :** `vivianMoneyVibesGroupes`
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-9** de la spine.

---

## Le fait

Un crédit **octroyé et non décaissé** n'est pas un encours : c'est un **engagement**. Une **garantie
reçue** d'un membre n'est pas un actif de l'institution. Les deux vivent hors bilan dans le RCSFD,
et l'analyse du 2026-07-21 les a explicitement laissés **hors amorce** : *« classe 8 (hors-bilan /
engagements) : hors états DIMF 2000/2080 »*.

⇒ Cette story ne republie pas le référentiel comptable et ne fabrique pas de comptes manquants. Elle
tient les engagements dans le vertical, par événements, les restitue à une date d'arrêté et protège
la frontière posée par STORY-507 : **aucun montant d'engagement n'entre dans une balance canonique**.

⛔ **Le risque exact à éviter :** faire entrer un crédit octroyé non décaissé dans l'encours
gonflerait l'actif et le produit d'intérêts, sans qu'aucun déséquilibre n'apparaisse.

## Cadrage mesuré avant de coder (2026-09-17)

| Mesure | État constaté | Conséquence pour STORY-508 |
|---|---|---|
| Crédit accordé non décaissé | `situationALaDate` dérive déjà `engagementNonDecaisse = octroyé − décaissé`, à partir de l'octroi immuable et des mouvements append-only | Réutiliser cette source ; ne stocker ni encours ni engagement calculé |
| Bascule vers l'encours | Chaque tranche est un `DECAISSEMENT` append-only, sous verrou transactionnel ; l'identité octroyé = décaissé + non décaissé est déjà calculable à toute date | La restitution cite les événements qui expliquent la baisse de l'engagement ; aucun second mouvement miroir |
| Garanties reçues | Les garanties sont figées sur l'octroi (`credit.garanties`) avec type, valeur et référence ; le provisionnement lit les types admis et leur quotité depuis le paquet | Les restituer depuis l'octroi, et réutiliser exactement la règle du paquet pour l'admission en déduction |
| Dénouement d'une garantie | Le nantissement connaît la levée de son blocage ; les autres garanties n'ont aucun événement de libération | Ajouter un mouvement de libération de garantie, sans modifier la garantie d'origine |
| Caution donnée par l'IMF | Aucun agrégat ni événement ne la représente | Ajouter l'agrégat append-only minimal `engagements_hors_bilan` + ses dénouements |
| Classe 8 comptable | `sfd-bceao@2.0` s'arrête aux classes 1 à 7 ; le README et l'analyse déclarent la classe 8 hors amorce | Ne pas étendre ni republier l'artefact ; aucun compte ne sera inventé |
| Publication canonique | STORY-507 ne publie que les reclassements, provisions, reprises et pertes décidés | Aucun changement de contrat Kafka ni de `balance-service` ; la preuve de non-régression porte sur le constructeur réel de contribution |
| Parcours complet | Le provisionnement et les indicateurs partagent un plafond de coût, deux emplacements par processus et un par organisation | La restitution non paginée réutilise ces trois gardes, et mutualise les appels identiques en vol |

## Décisions de cadrage du 2026-09-17 — à relire en revue

- **D-508-A — hors bilan signifie hors contrat de balance.** Aucun compte de classe 8 n'est ajouté,
  aucun `balance.submitted` n'est produit et `balance-service` n'est pas modifié. Les engagements
  vivent dans le contrat HTTP du vertical et serviront directement STORY-510.
- **D-508-B — une source par fait.** Le crédit non décaissé vient exclusivement de l'octroi et des
  mouvements de crédit existants ; les garanties reçues viennent exclusivement des garanties
  figées à l'octroi ; une caution donnée indépendante vient de l'agrégat d'engagement. Aucun fait
  n'est recopié dans deux collections.
- **D-508-C — cautions données append-only.** Une caution porte une référence documentaire au
  charset fermé, un montant, une date d'effet, la devise du dossier et l'auteur injecté. Elle est
  immuable ; ses dénouements partiels ou total sont des mouvements append-only, datés et motivés,
  écrits sous un verrou de révision. Le cumul des dénouements ne dépasse le montant à aucune date.
- **D-508-D — garanties reçues événementielles.** L'octroi est leur événement d'effet. Une
  libération est un nouveau mouvement du crédit qui désigne le rang immuable de la garantie ; elle
  ne réécrit ni l'octroi ni son tableau. Pour un nantissement de dépôt, la levée du blocage le
  dénoue également à sa propre date. Une garantie libérée deux fois est refusée par un index unique.
- **D-508-E — bascule sans duplication.** Chaque décaissement réduit exactement l'engagement non
  décaissé et augmente le décaissé dans le même historique de crédit. La restitution ne crée aucun
  événement miroir. À toute date avant annulation : `montantOctroye = decaisse + engagementNonDecaisse`.
- **D-508-F — restitution complète et exacte.** `GET …/engagements?dateArrete=` rend en une réponse
  non paginée les engagements donnés et reçus, leurs montants restants, événements explicatifs,
  sous-totaux et totaux en unités mineures avec devise/exposant. Les sommes sont en `BigInt` puis
  refusées hors entier sûr ; un total est recomposable exactement depuis les lignes publiées.
- **D-508-G — admission prudentielle, jamais supposée.** Chaque garantie de crédit publie le code,
  la quotité et la source de la règle quand son type est admis par le paquet ; sinon elle publie
  `TYPE_NON_ADMIS_PAR_LE_PAQUET`. Une garantie dénouée est `DENOUEE` et n'est jamais présentée
  comme déductible. Le code réutilise `regleDeProvisionnement`, sans recopier sa formule.
- **D-508-H — coût borné par les protections partagées.** Le portefeuille est compté avant lecture,
  les calculs passent par l'unique `EmplacementsDeCalcul`, et deux requêtes identiques en vol
  partagent leur promesse. Une route jumelle sans ces protections reproduirait le défaut de STORY-506.
- **D-508-I — ordre des dates.** Une ouverture ne précède pas sa date d'effet ; un dénouement ou une
  libération ne précède pas le fait qu'il dénoue. Les lectures à une date passée ignorent les
  événements postérieurs et se rejouent à l'identique après redémarrage.

## Périmètre

### Livré

- agrégat append-only des cautions données et de leurs dénouements ;
- mouvement de libération d'une garantie de crédit, sans réécriture de l'octroi ;
- restitution non paginée, à une date d'arrêté, des engagements donnés et reçus avec événements,
  sous-totaux et totaux ;
- qualification de l'admission des garanties depuis le paquet prudentiel chargé et vérifié ;
- preuve comportementale qu'aucun engagement ne rejoint la contribution canonique de STORY-507 ;
- tests unitaires, e2e, Mongo réel, mutations et vérification Docker.

### Hors périmètre

- ajouter la classe 8 au paquet comptable, inventer un numéro de compte ou republier
  `sfd-bceao@2.0` ;
- publier les engagements sur Kafka ou modifier `balance-service` ;
- calculer les ratios prudentiels et leurs seuils (STORY-510) ;
- décider un octroi, une caution ou une mesure de redressement ;
- ajouter une identité libre de bénéficiaire : seule une référence documentaire bornée est tenue ;
- inventer une valeur prudentielle absente du paquet servi, actuellement en statut `amorce`.

## Critères d'acceptation

- [ ] **AC-1 — Tenue par événements.** Les crédits accordés non décaissés et cautions données,
      ainsi que les garanties et nantissements reçus, sont restitués depuis leurs événements avec
      montant, date d'effet et historique de dénouement. Aucun montant courant n'est stocké.
- [ ] **AC-2 — ⛔ Jamais dans la balance.** Aucun engagement ni garantie ne figure dans la
      contribution canonique publiée par STORY-507. Le test vire au rouge si une ligne ou un
      montant d'engagement y est ajouté, même si la balance reste équilibrée.
- [ ] **AC-3 — Bascule sans doublon.** Un décaissement de tranche réduit l'engagement du même
      montant et augmente le décaissé, sans événement miroir ni double compte. Une caution ou une
      garantie se dénoue par un événement append-only ; le rejeu à la veille reste inchangé.
- [ ] **AC-4 — Restitution séparée.** Les engagements donnés et reçus sont rendus dans deux blocs,
      avec lignes, sous-totaux et totaux exactement recomposables. Le contrat expose la matière
      que STORY-510 consommera, sans calculer ses ratios.
- [ ] **AC-5 — Garantie admise par le paquet seulement.** Une garantie n'est annoncée déductible
      du provisionnement que si son type est déclaré dans le paquet prudentiel, avec code,
      quotité et source ; paquet vide ou type absent ⇒ non admise, jamais un défaut permissif.
- [ ] **AC-6 — Rejeu et concurrence.** Une date passée se rejoue à l'identique, en désordre et
      après redémarrage. Deux dénouements concurrents ne dépassent jamais le montant initial et
      deux libérations concurrentes ne créent qu'un seul mouvement.

## Table de mutations obligatoire

| ID | Mutation réellement appliquée | Test qui doit virer au rouge |
|---|---|---|
| M1 | Stocker un `montantRestant` mutable sur une caution | Garde de schéma + dérivation depuis les mouvements |
| M2 | Retirer la session d'un dénouement ou placer le verrou après la lecture | Course Mongo : le cumul ne dépasse jamais le montant |
| M3 | Rendre modifiable/supprimable un engagement ou un mouvement | Hooks append-only sur Mongo réel |
| M4 | Compter le décaissement dans l'engagement et dans l'encours | Identité exacte octroyé = décaissé + non décaissé |
| M5 | Appliquer une libération avant sa date dans une lecture passée | Rejeu veille/jour du dénouement |
| M6 | Marquer une garantie admise quand son type est absent du paquet | Paquet fictif : absent ≠ admis ; paquet vide fermé |
| M7 | Recopier une quotité au lieu de lire `regleDeProvisionnement` | Changer la quotité de la fixture change exactement la réponse |
| M8 | Injecter une ligne d'engagement dans la contribution STORY-507 | AC-2 : lignes et montants canoniques exacts |
| M9 | Additionner en `number` ou accepter un cumul hors entier sûr | Refus `ENGAGEMENTS_HORS_BORNE` |
| M10 | Parcourir le portefeuille sans plafond ou sans emplacement partagé | Refus avant lecture + concurrence croisée avec les indicateurs |
| M11 | Paginer la restitution ou calculer un total sur une seule page | Somme de toutes les lignes = total sur plusieurs pages internes |
| M12 | Omettre orgId/dossierId d'une lecture d'engagement | Portée autre organisation/dossier = même 404 que l'inexistant |

## Definition of Done

- [ ] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [ ] Schémas en collections `snake_case`, indexes uniques nommés, Swagger et DTO validés.
- [ ] Lint 0 warning, build, couverture et e2e verts ; chaque nouveau fichier source couvert par
      son `*.spec.ts`.
- [ ] M1 à M12 appliquées une par une, rouges par assertion, puis restaurées sans effacer le travail.
- [ ] Vérification Mongo réelle : écritures, indexes, courses, aucun orphelin ; e2e seuls non invoqués
      comme preuve de persistance.
- [ ] Vérification Docker sur volumes neufs, puis rejeu sur l'état final après les revues ; stack arrêtée.
- [ ] Revue de code et revue de sécurité sans constat ouvert.
- [ ] Branche `MNV-508`, commit français, PR vers `dev`; PR docs vers `main`; rebase-merge et branches supprimées.

## Progress Tracking

- **Statut courant :** `in_progress`
- **2026-09-17 — cadrage et démarrage :** branches `MNV-508` créées depuis `main` pour `docs/`
  et depuis `dev` pour `microfinance-service`, toutes deux rebasées sur leur origine. Le code
  confirme que l'engagement non décaissé et les garanties de crédit ont déjà leurs sources
  événementielles ; seuls la caution donnée et le dénouement explicite d'une garantie manquent.
  D-508-A à I ferment la frontière : aucune extension de `sfd-bceao@2.0`, aucun contrat Kafka,
  aucun changement de `balance-service`.
- **Implémentation :** en cours.
- **Revue de code :** à faire.
- **Vérification docker :** à faire.
- **Revue de sécurité :** à faire.

## Notes

- Voir la spine `architecture-microfinance-service-2026-08-27` (AD-9), [[STORY-501]],
  [[STORY-504]], [[STORY-507]] et [[STORY-510]].
