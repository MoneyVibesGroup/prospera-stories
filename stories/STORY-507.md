# STORY-507 : Le portefeuille publie une BALANCE canonique — pas des écritures

Status: done

**Complexité :** high
**Épic :** EPIC-126 — Articulation portefeuille → balance
**Service :** `microfinance-service` + `balance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-501** · **STORY-504** · **STORY-489** (la devise au contrat)
**Assigné :** `vivianMoneyVibesGroupes`
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-5** de la spine.

---

## Le fait

C'est la story qui **relie ce vertical au reste du produit**, et sa forme est déjà connue :
`stock-service` a subi exactement la même correction en août. Son PRD promettait de « publier une
valeur de stock » ; vérification faite, `bilan-service` n'ingère que des **soldes de comptes**. Le
module publie donc **une balance**, au contrat canonique.

⇒ **Une balance n'est pas un journal.** Le portefeuille publie une contribution équilibrée de
soldes, avec son `origine`, sa devise et son `checksum`. La liasse, le fiscal et le prévisionnel
continuent de consommer le contrat canonique ; ils ne connaissent pas le modèle du crédit.

⚠️ `SOURCES_BALANCE` reste fermé (`direct`, `import`, `api`). Le nouveau producteur est distingué
par une **origine**, jamais par une quatrième source. Les origines sont des artefacts dérivés et ne
doivent devenir ni une balance de travail, ni une base fiscale, ni un motif de gel du dossier.

## Cadrage mesuré avant de coder (2026-09-16)

| Mesure | État constaté | Conséquence pour STORY-507 |
|---|---|---|
| Bus inter-services | `microfinance-service` possède déjà une outbox transactionnelle ; aucun événement de balance n'est encore produit | La publication part de l'outbox, dans la transaction qui applique l'arrêté |
| Point de décision | Une proposition de provision est calculée hors transaction ; seul `appliquer` persiste l'arrêté et ses lignes | Une proposition ne publie jamais ; un arrêté effectivement appliqué publie une fois |
| Contrat entrant | `balance.submitted.v1` exige aujourd'hui un référentiel et ne porte ni `origine` ni `devise` | Le contrat est étendu ; le référentiel absent est résolu côté `balance-service` depuis le dossier |
| Modèle canonique | `ORIGINES_BALANCE` contient `A_NOUVEAUX` et `PROVISIONS_FISCALES` ; plusieurs requêtes n'excluent que `A_NOUVEAUX` | Une liste unique porte les origines et toutes les lectures « balance complète » excluent les artefacts partiels |
| Idempotence | La clé unique canonique ignore `origine` | L'origine entre dans la clé ; deux producteurs ne se volent plus une version |
| Référentiel SFD | Le paquet servi possède les comptes RCSFD mais aucun marqueur sémantique exploitable | Les comptes sont résolus par libellé métier unique dans le référentiel du dossier ; zéro ou plusieurs correspondances échouent fermé |
| Contrepartie comptable | Le vertical ne connaît ni la caisse ni la banque qui a financé parts, dépôts ou crédits | La story ne fabrique pas une balance générale : elle publie uniquement les reclassements, provisions, reprises et pertes décidés |
| Devise | STORY-489 dérive l'exposant dans `balance-service` à partir de la devise | Le producteur envoie la devise ; le service canonique dérive et persiste l'exposant |

## Décisions de cadrage du 2026-09-16 — à relire en revue

- **D-507-A — origine unique :** `PORTEFEUILLE_SFD` est ajouté à la source unique
  `ORIGINES_BALANCE`. Le type TypeScript, le schéma Mongoose, le schéma JSON publié et les gardes
  d'ingestion en dérivent.
- **D-507-B — source inchangée :** l'événement porte `source: direct`. Un producteur métier n'ouvre
  pas `SOURCES_BALANCE`.
- **D-507-C — fait publié :** la publication est déclenchée par l'application réussie d'un arrêté de
  provision. L'enqueue outbox utilise la **même session Mongo** que l'arrêté et ses lignes. Une
  proposition, un calcul à blanc ou un arrêté refusé ne publie rien.
- **D-507-D — contribution cumulative :** la balance exprime, à la date de l'arrêté, les
  reclassements d'encours, provisions constituées, reprises et passages en perte. Elle est
  auto-équilibrée. Elle n'inclut ni parts sociales, ni dépôts, ni décaissements, ni trésorerie : le
  vertical ne possède pas leur contrepartie comptable.
- **D-507-E — aucune écriture :** les lignes publiées sont des soldes canoniques agrégés par compte.
  Aucun débit/crédit chronologique, aucune date de mouvement et aucun identifiant de crédit ne
  franchit la frontière du service.
- **D-507-F — comptes issus du dossier :** `microfinance-service` charge le référentiel du dossier,
  résout chaque compte par un libellé métier unique et produit seulement les numéros de compte
  obtenus. Aucun numéro de compte n'est écrit en dur. Le message ne porte aucun code de
  référentiel ; `balance-service` relit celui du dossier et revalide les comptes.
- **D-507-G — classement prudentiel :** les crédits restructurés vont vers « Crédits immobilisés » ;
  les crédits en souffrance et leurs provisions sont ventilés dans les tranches 0–6 mois, 6–12 mois
  et 12–24 mois du RCSFD. Les bornes viennent des tranches en jours déjà calculées par STORY-504,
  sans conversion mois → jours.
- **D-507-H — version et rejeu :** la version canonique est la version de l'arrêté appliqué. Le rejeu
  de la même date retourne l'arrêté existant et ne crée ni second événement ni seconde balance. La
  clé canonique inclut l'origine ; le checksum protège le contenu.
- **D-507-I — devise :** l'événement porte la devise du dossier. `balance-service` dérive l'exposant
  via le registre de STORY-489, recalcule le checksum avec l'algorithme canonique et refuse toute
  divergence.
- **D-507-J — lecture partielle :** `PORTEFEUILLE_SFD`, comme `A_NOUVEUX` et
  `PROVISIONS_FISCALES`, est concernée par des exclusions, mais elles ne sont pas toutes identiques.
  Dans le détail, `PORTEFEUILLE_SFD`, comme `A_NOUVEAUX`, est exclue des recherches de balance
  complète/courante, de la balance de clôture et du gel du référentiel. La base fiscale exclut en
  plus `PROVISIONS_FISCALES`, qui reste une balance complète enrichie pour les autres lectures.
  Chaque origine partielle reste consultable explicitement par son origine.
- **D-507-K — résultat d'ingestion :** l'ingestion Kafka conserve le comportement existant : balance
  créée en brouillon ou rejeu idempotent ; rejet métier sur `balance.rejected`. La validation reste
  une décision explicite de l'API canonique avant production de la liasse.
- **D-507-L — périmètre contractuel :** `balance.submitted.v1` reste en version 1 avec ajout de champs
  compatibles pour les producteurs existants. `origine` est absente pour une balance complète et
  obligatoire pour la publication SFD ; `devise` garde le défaut rétrocompatible de STORY-489.
- **D-507-M — créance classée au-delà de 24 mois :** le RCSFD n'ouvre aucun groupe de comptes de
  souffrance au-delà de 24 mois et le passage en perte reste une décision explicite du SFD. Une
  créance toujours classée au-delà de cette borne reste donc dans le dernier groupe de souffrance,
  intégralement provisionnée ; elle ne bascule jamais artificiellement au compte 669.
- **D-507-N — résolution du référentiel SFD :** `balance-service` conserve la cascade existante
  axes datés du dossier → profil de l'organisation, puis utilise le `typeEntite` du read-model
  dossier comme troisième marche. `MICROFINANCE` désigne `SFD-BCEAO` ; une entité inconnue ou un
  dossier absent reste indéterminé, sans repli permissif.

## Périmètre

### Livré

- production transactionnelle de `balance.submitted` par `microfinance-service` ;
- constructeur pur de la contribution canonique et résolution des comptes RCSFD du dossier ;
- extension du contrat Kafka, de sa documentation et de son schéma publié ;
- ingestion de l'origine et de la devise par `balance-service`, dérivation du référentiel et de
  l'exposant, contrôle du checksum ;
- idempotence canonique par origine et audit de toutes les lectures qui exigent une balance complète ;
- tests unitaires, e2e, mutations et preuve docker jusqu'à la liasse SFD.

### Hors périmètre

- produire la comptabilité générale des parts sociales, dépôts, décaissements ou encaissements ;
- publier des écritures comptables ou reconstituer une trésorerie que le vertical ne possède pas ;
- créer automatiquement une balance validée ;
- consommer `balance.rejected` dans un nouveau read-model du vertical ;
- modifier les règles de provisionnement, de classement ou de passage en perte des stories 504/505.

## Critères d'acceptation

- [x] **AC-1 — Origine canonique.** `PORTEFEUILLE_SFD` est disponible au contrat canonique. Le type,
      la validation, le schéma de persistance et la liste publiée dérivent d'une source unique.
- [x] **AC-2 — Référentiel du dossier.** Les comptes produits viennent du référentiel SFD du dossier,
      résolus par le service et jamais codés en dur. Le message n'envoie aucun code de référentiel ;
      `balance-service` le résout et revalide chaque compte.
- [x] **AC-3 — Devise, exposant et intégrité.** L'événement porte la devise ; la balance persistée et
      sa réponse portent devise + exposant. `balance-service` recalcule le checksum et rejette toute
      divergence.
- [x] **AC-4 — Rejeu.** La même date d'arrêté republiée produit la même version et le même contenu,
      ou un `200` idempotent — jamais un second événement ni un doublon canonique.
- [x] **AC-5 — Provision décidée seulement.** Une proposition ne publie rien. Seul un arrêté appliqué
      avec succès, dans la même transaction que l'outbox, entre dans la contribution.
- [x] **AC-6 — Contribution équilibrée et isolée.** Chaque publication est équilibrée, ne contient
      que les reclassements/provisions/reprises/pertes du portefeuille et n'est jamais sélectionnée
      comme balance complète, base fiscale, clôture ou motif de gel.
- [x] **AC-7 — Compatibilité.** Les producteurs existants de `balance.submitted.v1` restent acceptés ;
      une origine inconnue, une devise invalide, un compte absent du référentiel ou un checksum faux
      sont rejetés sans créer de balance.
- [x] **AC-8 — Chaîne réelle.** Sur stack docker neuve : arrêté appliqué → outbox → Kafka → balance
      brouillon `PORTEFEUILLE_SFD` → validation explicite → liasse SFD produite. Les collections sont
      inspectées avec `mongosh`, sans doublon ni orphelin après échec.

## Table de mutations obligatoire

| ID | Mutation réellement appliquée | Test qui doit virer au rouge |
|---|---|---|
| M1 | Retirer `PORTEFEUILLE_SFD` de la liste publiée sans modifier le type | Contrat source unique |
| M2 | Supprimer `origine` de l'événement ou de la persistance | Ingestion + lecture explicite par origine |
| M3 | Ne plus exclure `PORTEFEUILLE_SFD` d'une recherche de balance complète/gel/fiscal/clôture | Balayage des requêtes de sélection |
| M4 | Enqueue l'événement hors session ou avant l'insertion de l'arrêté | Test transactionnel d'échec sans outbox orpheline |
| M5 | Publier depuis la proposition plutôt que depuis `appliquer` | Proposition sans écriture ni événement |
| M6 | Remplacer une résolution sémantique par un numéro de compte ou accepter deux libellés | Résolution unique contre le paquet réellement servi |
| M7 | Inverser une borne 6/12 mois dans la ventilation prudentielle | Fixtures exactement aux bornes |
| M8 | Inclure une provision proposée/non constituée | Contribution calculée depuis les lignes décidées |
| M9 | Altérer une ligne après calcul du checksum | Rejet `CHECKSUM_MISMATCH`, zéro balance |
| M10 | Retirer l'origine de la clé d'idempotence | Deux origines de même version ne peuvent plus coexister |
| M11 | Omettre la devise ou forcer `XOF` | Devise du dossier + exposant dérivé |
| M12 | Rejouer l'arrêté en créant un nouvel `eventId` | Un arrêté, un outbox, une balance |

## Definition of Done

- [x] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [x] Documentation du contrat Kafka et schéma JSON mis à jour dans les deux services concernés.
- [x] `microfinance-service` : lint 0 warning, build, couverture et e2e verts.
- [x] `balance-service` : lint 0 warning, build, couverture et e2e verts.
- [x] Chaque ligne M1–M12 est mutée, exécutée rouge puis restaurée ; aucune mutation ne survit.
- [x] Vérification docker sur volumes neufs, puis rejeu sur l'état final après les revues.
- [x] Revue de code et revue de sécurité sans constat ouvert.
- [x] Branches `MNV-507`, commits français, PR vers `dev` pour les services et vers `main` pour docs,
      rebase-merge, branches distantes supprimées.

## Progress Tracking

- **Statut courant :** `done`
- **2026-09-16 — cadrage et démarrage :** authentification GitHub confirmée sous
  `vivianMoneyVibesGroupes` ; branches `MNV-507` créées depuis `main` pour docs et depuis `dev` pour
  `microfinance-service` et `balance-service`, toutes rebasées sur leur origine. Mesure du code,
  lecture des AD-5/AD-7 et des stories 489/499–506. Décisions D-507-A à L prises avant le premier
  changement de code. Point structurant : le vertical ne possède pas la contrepartie de trésorerie ;
  il publie donc la contribution prudentielle équilibrée décidée, pas une fausse balance générale.
- **2026-09-17 — implémentation et portes de handoff :** `microfinance-service` construit la
  contribution prudentielle cumulative depuis l'arrêté décidé, résout les comptes par les libellés
  uniques du paquet servi et écrit `balance.submitted` dans la transaction de l'arrêté. Le contrat,
  la documentation et le schéma JSON portent l'origine et la devise. `balance-service` accepte et
  persiste `PORTEFEUILLE_SFD`, résout le référentiel depuis le dossier, dérive l'exposant, recalcule
  le checksum, isole l'origine dans la clé d'idempotence et l'écarte de toutes les lectures qui
  exigent une balance complète. Les décisions D-507-M/N ferment les deux cas découverts en cours
  d'implémentation. Portes finales avant revue :
  - `microfinance-service` : lint 0 warning, build vert, 134 suites/2 689 tests unitaires verts,
    couverture statements 99,72 %, branches 96,99 %, fonctions 99,56 %, lignes 99,73 % ; 13 suites
    e2e vertes, 377 tests exécutés et 83 sentinelles Mongo sautées comme prévu sans URI ;
  - `balance-service` : lint 0 warning, build vert, 203 suites/4 172 tests unitaires verts,
    couverture statements 99,17 %, branches 92,74 %, fonctions 98,58 %, lignes 99,26 % ; 29 suites
    e2e/1 077 tests verts.
- **2026-09-17 — mutations :** M1 à M12 ont chacune été appliquées au code, ont fait virer leur test
  gardien au rouge, puis ont été restaurées. Rejeu de référence après restauration : 10 suites/405
  tests ciblés verts côté `balance-service`, 5 suites/100 tests ciblés verts côté
  `microfinance-service`.
- **2026-09-17 — vérification Docker initiale sur volumes neufs :** build frais des deux images,
  services HTTP et Kafka/Mongo sains, puis parcours réel réussi : dossier
  `6aab2f5bbb66ae606cba9194`, arrêté `6aab2f5c62baf776da42bfa6`, balance
  `6aab2f5eadf7a0d7dd428be3` et jeu d'états `6aab2f61a363a8afb226da90`. L'arrêté produit exactement
  1 ligne et 1 événement `balance.submitted` `SENT`; l'événement produit exactement 1 balance
  `PORTEFEUILLE_SFD` en XOF, exposant 2, 2 lignes, validée explicitement ; le rejeu laisse ces
  cardinalités à 1. La projection Bilan et le jeu d'états portent le même `balanceId` et le même
  checksum, avec le référentiel `sfd-bceao@2.0`. Inspection `mongosh` : 0 ligne d'arrêté orpheline,
  1 ingestion et 1 marqueur de traitement. La suite Mongo réelle de provisionnement a d'abord
  révélé une assertion d'outbox globale contaminée par le scénario précédent ; resserrée sur le
  dossier courant, elle passe 29/29, dont le rollback au deuxième lot laisse 0 en-tête et 0 ligne.
  La stack a été arrêtée proprement. Le rejeu Docker final reste à exécuter après les revues.
- **2026-09-17 — revue de code :** lecture intégrale des diffs des deux PR, puis vérification des
  invariants d'atomicité, d'idempotence par origine, de résolution tenant-scopée du référentiel, de
  recalcul du checksum, de compatibilité du contrat v1 et du balayage des lectures complètes. Aucun
  défaut de code retenu. Un constat documentaire non bloquant a été corrigé : D-507-J assimilait à
  tort `PROVISIONS_FISCALES` aux origines toujours partielles, alors qu'elle n'est exclue que de la
  base fiscale. La lentille Ponytail conclut « Lean already. Ship. » : aucun niveau d'abstraction,
  dépendance ou mécanisme spéculatif à retirer.
- **2026-09-17 — revue de sécurité :** 0 vulnérabilité de confiance ≥ 80. L'organisation et le
  dossier sont recoupés avant toute résolution ; le consommateur refuse origine, devise, compte,
  référentiel ou checksum incohérent avant persistance ; balance, lignes, arrêté et outbox restent
  atomiques et idempotents ; aucun endpoint, rôle, secret, journal sensible ni dépendance n'est
  ajouté. La confiance inter-service C8 préexistante n'est ni élargie ni contournée par cette story.
- **2026-09-17 — rejeu Docker final après revues :** volumes supprimés puis stack relancée par
  Portly. Le parcours complet est resté vert sur le dossier `6aab7724c153b0bfd10cd647` : arrêté
  `6aab77278825b8720d2a8ede`, événement unique `SENT`, balance
  `6aab7728c0bf40df903cc40a` `PORTEFEUILLE_SFD` validée en XOF/exposant 2 avec deux lignes, puis jeu
  d'états `6aab772a2985e568ff4f64b9` en `sfd-bceao@2.0`. Le rejeu conserve une seule balance et un seul
  événement ; `mongosh` confirme 1 en-tête, 1 ligne liée, 0 ligne orpheline, 1 marqueur de traitement,
  1 projection, 1 jeu d'états et des checksums identiques de bout en bout. Stack arrêtée proprement.
- **Implémentation :** terminée et intégrée.
- **Revue de code :** terminée, 1 constat documentaire corrigé, 0 constat ouvert.
- **Vérification docker :** passage initial et rejeu final après revues verts sur volumes neufs.
- **Revue de sécurité :** terminée, 0 vulnérabilité.
- **Clôture :** PR `microfinance-service` #14 rebase-mergée sur `dev` (`be001755`) ; PR
  `balance-service` #107 rebase-mergée sur `dev` (`d22535a8`) ; clôture documentaire portée par la
  PR `prospera-stories` #280 vers `main`. Branches distantes des services supprimées.

## Notes

- Voir la spine `architecture-microfinance-service-2026-08-27` (AD-5), la spine
  `architecture-stock-service-2026-08-15` (AD-7, le patron), [[STORY-101]], [[STORY-489]],
  [[STORY-504]] et [[STORY-505]].
