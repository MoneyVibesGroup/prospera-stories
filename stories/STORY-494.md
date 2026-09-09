# STORY-494 : `smt-togo@1.0` est déclaré et non packagé — la TPE, persona la plus nombreuse du marché, est la seule à recevoir un refus

Status: done

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `balance-service` + `bilan-service` (`referentiels/`, `ReferentielRegistry`)
**Points :** 13 · **Sprint :** S20
**Se tire avec :** **STORY-487** — les deux ensemble, ou aucune des deux.
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 ; décision D-078-3 rouverte.

---

## Le fait

Le Système Minimal de Trésorerie est **le système comptable du petit commerçant** : celui de la
boutique, de l'entreprenant, de la très petite entreprise — la persona que le produit sert par ses
**cahiers de recettes et de dépenses**, et de loin la plus nombreuse du marché visé.

`smt-togo@1.0` est **déclaré et non packagé**. La décision d'origine était assumée et raisonnable :
« le packager reviendrait à inventer du comptable ». Deux choses ont changé depuis :

1. Le produit a construit **toute une chaîne de saisie destinée à cette persona** — cahiers mois par
   mois, OCR, rattachement au plan, catégories de dépenses. Cette chaîne débouche aujourd'hui sur un
   `409 REFERENTIEL_NON_PACKAGE`.
2. **Le produit sait maintenant packager un référentiel sans inventer** : trois artefacts sourcés
   l'ont prouvé (SFD-BCEAO complet, CIMA, zone franche). Et le fichier
   `LIASSE SYSCOHADA REVISE- SMT-Réf 24-01-19.xlsx` est **présent au dépôt** : le gabarit d'états SMT
   existe, sourcé, et n'a jamais été packagé.

   ⚠️ **CORRECTION DE FICHE (2026-09-09, au développement)** — le classeur `.xlsx` n'est **pas**
   au dépôt : aucun fichier `.xlsx` n'existe dans le workspace. Ce qui y est, c'est son
   **extraction**, `docs/referentiels/postes-smt-togo.json`, produite le 2026-07-19 et marquée
   « AMORCE — structure officielle extraite … À valider expert ». La fiche est donc juste sur le
   fond (le gabarit est sourcé et transcrit) et fausse sur la lettre. Le packaging s'appuie sur
   cette extraction, pas sur un classeur qu'on ne peut plus ouvrir.

⛔ **Conséquence produit aujourd'hui : la petite entreprise est servie en Système Normal.** C'est
disproportionné — le SN exige des états qu'une TPE n'a pas à produire — et c'est faux : son axe dit
`SMT`, sa validation se fait contre `SN` (le défaut que STORY-422 corrige). **Elle est donc à la fois
mal servie et mal validée.**

## Ce que le SMT est, et ce qu'il n'est pas

Le SMT est une **comptabilité de trésorerie** : elle enregistre les encaissements et les
décaissements, pas les engagements. Sa liasse est **simplifiée** — pas de tableau des flux, un jeu de
notes réduit. C'est exactement la forme de dégradation que le moteur sait déjà rendre pour SFD-BCEAO
(`postes: []`, contrôle `NON_APPLICABLE`, `coherent: true`) : **le mécanisme existe, il n'a jamais
servi ici.**

## Critères d'acceptation

- [ ] AC-1 — `smt-togo@1.0` est packagé : plan de comptes, postes, table de passage et gabarit
      d'états, **sourcés** depuis le référentiel SYSCOHADA révisé (partie SMT) et le gabarit de
      liasse SMT présent au dépôt. Aucune donnée inventée ; ce qui n'est pas sourcé n'est pas
      packagé, et son absence est déclarée.
- [ ] AC-2 — `_meta` renseigné selon **STORY-491** : zone `OHADA`, pays, devise, norme source, statut
      `a-valider-par-expert` tant qu'un expert-comptable ne l'a pas relu.
- [ ] AC-3 — Les états non prévus par le SMT rendent `NON_APPLICABLE` et `coherent: true`, **jamais
      une anomalie** — et l'onglet correspondant **reste visible et s'explique**, comme il le fait
      déjà pour SFD-BCEAO. Un onglet qui disparaît est pire qu'un onglet vide.
- [ ] AC-4 — Un dossier `SMT` construit une balance, la valide **contre le plan SMT**, et produit sa
      liasse simplifiée de bout en bout. Vérifié en docker, sur stack neuve.
- [ ] AC-5 — Le **franchissement de seuil** est nommé, pas traité. Une TPE qui dépasse le seuil
      bascule au Système Normal en cours de vie ; l'axe du dossier est daté (STORY-303) et un
      changement d'axe « ne rejoue pas les exercices déjà clos ». Cette story **n'ouvre pas** la
      conversion SMT → SN : elle vérifie que la bascule d'axe ne casse rien, et le documente.

## Conséquences ailleurs

- Sans elle, **STORY-487** transforme un défaut silencieux en blocage bruyant pour la TPE.
- Le prototype cesse d'afficher « TPE (SMT) ⚠ » et son encart de manque backend.

## Notes

- **13 points, pas 8** : le coût n'est pas le packaging, c'est le **sourcing et la relecture
  comptable** du plan et du gabarit. Sous-estimer ce poste est ce qui avait produit la décision
  d'origine.
- Voir [[STORY-078]] (D-078-3), [[STORY-487]], [[STORY-491]], [[STORY-422]].

---

## Progress Tracking

**Statut : `done` (2026-09-09)** — PR `bilan-service#119` et `balance-service#97` mergées ENSEMBLE (artefact partagé à l'octet), après revue de code (3 bloquants traités) et revue de sécurité (aucune vulnérabilité).

### Décisions de sourcing (le cœur des 13 points)

| Pièce | Décision | Pourquoi ce n'est pas une invention |
|---|---|---|
| **Plan de comptes** | `plan-comptable-syscohada.json` **réutilisé tel quel** | Le SMT n'est pas un référentiel comptable distinct : c'est un **régime de présentation allégé** de l'AUDCIF, tenu sur le plan normalisé. Écrire un « plan SMT » aurait inventé exactement ce que D-078-3 refusait d'inventer. Patron `zone-franche-togo`, qui réutilise déjà les sources SYSCOHADA. |
| **Postes** | Transcrits de `docs/referentiels/postes-smt-togo.json` | Extraction du formulaire officiel, faite le 2026-07-19. 28 postes, 3 états. Accents **restaurés** : l'amorce les avait perdus à l'extraction (elle écrit « Systeme Minimal de Tresorerie »), les autres sources du dépôt les portent. |
| **Table de passage** | Bâtie sur les **préfixes de `table-de-passage-syscohada.json`** | Chaque compte rattaché à un poste SMT vient d'une ligne SYSCOHADA existante, agrégée aux lignes plus grossières du formulaire. Même méthode que la table SYSCOHADA elle-même (« construite, règles standard »), validée à l'époque contre 50 comptes Sage réels. ⚠️ **Une exception, nommée** (constat N6) : `622` (Locations et charges locatives) vient du **plan de comptes** et non de la table packagée, qui s'arrête à `62`. « Aucun préfixe nouveau » était faux, et c'est cette déclaration que porte l'AC-1. |
| **`_meta`** | Vocabulaire de **STORY-491**, sur ce seul paquet | `zoneComptable: OHADA`, `pays: ['TG']`, `devisePresentation: 'XOF'`, `normeSource`, `statut: 'a-valider-par-expert'`. ⛔ Les **quatre paquets existants ne sont pas touchés** : compléter leur `_meta` change leur checksum, ce que la procédure de sourcing interdit en place dès qu'un `code@version` est catalogué. C'est le périmètre de 491, avec la montée de version que cela impose. `smt-togo@1.0` est neuf, donc jamais catalogué. |

### ⚡⚡ Le défaut que le développement a produit, et qui serait parti en production

`CRH` (RÉSULTAT DE L'EXERCICE) somme les trois lignes de variation du formulaire (`CRD`/`CRE`/`CRF`).
Elles ont d'abord été déclarées **au gabarit seulement** (`postes[]`), sans ligne de table de passage.

Or le moteur **ne sème son contexte d'évaluation que depuis `tableDePassage`**
(`contexteDetailCR`/`contexteDetailBilan`, lignes `type: 'detail'`). Une opérande visant un poste absent
de ce contexte lève `OperandeNonResolueError`, **catchée nulle part** ⇒ **500 sur toute la liasse**.

**Et rien ne l'attrapait.** Les vingt suites du module `referentiel` sont restées vertes :

1. aucune ne chargeait le paquet neuf — **chaque garde d'artefact énumère sa liste à la main**, et
   `operandes-coherence` n'en montait que **deux sur cinq** ;
2. cette garde lisait l'**union** `tableDePassage ∪ postes`, où le poste existe bel et bien.

Les deux trous sont fermés dans cette story :

- `ReferentielRegistry.cles()` (bilan-service) énumère le manifeste, et `operandes-coherence` balaie
  désormais **les six paquets** au lieu de deux ;
- la règle de résolution du filet **colle au semis du runtime** (table de passage seule) ;
- `referentiel-assets-coherence` (balance-service) gagne une garde d'**exhaustivité** : la liste des
  artefacts partagés est comparée au **contenu du disque**, donc un artefact recopié sans y être inscrit
  fait rougir la CI au lieu de dériver en silence.

### Ce qui n'est PAS livré, et qui est déclaré

- **Les 4 notes du formulaire SMT ne sont pas packagées** (l'AC-1 borne le paquet au plan, aux postes, à
  la table de passage et au gabarit) ⇒ l'état des notes rend `NON_APPLICABLE`, onglet visible.
- **Aucun marqueur `chiffreAffaires`.** Le formulaire sépare « Recettes sur ventes » et « Recettes sur
  prestations », et leur total inclut les autres recettes : **aucune des trois lignes n'est le chiffre
  d'affaires**. En marquer une le publierait faux (famille STORY-457). ⚠️ **Conséquence assumée** : la
  liquidation TPU d'un dossier SMT répondra `CA_NON_SOURCE` tant qu'une story ne packagera pas la table
  « CA » du formulaire — à ouvrir, la persona SMT étant précisément la persona TPU.
- **Comptes sans ligne propre au formulaire** : `50` (titres de placement) et `51` (valeurs à
  encaisser) sont rattachés à **`AC5` « Banque (+/‑) »**, la ligne de trésorerie du SMT — classement
  conforme à SYSCOHADA, qui range `BQ` et `BR` en trésorerie-actif. ⚡⚡ **C'est un correctif de revue
  (B1), pas un choix initial** : je les avais laissés hors table, ce qui rendait **non validable** la
  liasse d'une balance parfaitement équilibrée portant un chèque à l'encaissement. Voir plus bas.
  Les écarts de conversion `478`/`479`, eux, sont rattachés par le préfixe `47` : présentés en
  « Clients et débiteurs divers » ou « Fournisseurs et créditeurs divers » selon leur sens. Imprécis,
  mais aucun montant n'est perdu et le SMT n'a pas de ligne pour eux.
- **Les surfaces de documents FIGÉS ne portent pas `statut`** (`stamp` du jeu d'états et du snapshot) :
  décision antérieure, écrite en toutes lettres dans `jeu-etats-response.dto.ts`, et story à part. Les
  **six routes de production** le portent bien — vérifié.

### Vérification docker (stack réelle, `prospera-*`)

Cabinet `verif494@cabinet.tg` / org `6aa1c72a3f5f36e39f6543f3`, dossier TPE
`6aa1c78f93394a06b2f3f1b4` au SMT, exercice 2025.

| Preuve | Commande / route | Résultat |
|---|---|---|
| Artefact présent, byte-identique dans les 2 conteneurs | `sha256sum` dans les deux conteneurs | `c4d0318a…d8628f`, identique dans les deux et au manifeste des deux dépôts |
| Balance SMT acceptée (elle était refusée avant) | `POST /dossiers/{id}/balances` | **201** ; `db.balances` : `referentiel: 'SMT'`, 14 lignes, `estEquilibre: true`, checksum `eb70a456…` |
| Validation + round-trip Kafka | `POST …/balances/{id}/valider` | **200**, `etat: 'VALIDÉE'` ; `bilan_service.balances_balance` a reçu le document |
| Liasse simplifiée produite, puis **RECALCULÉE sur l'artefact corrigé** | `POST /dossiers/{id}/bilan/etats` puis `…/recalculer` | **201** puis **200**, `referentiel: smt-togo@1.0`, `valide: true`, tampon portant le checksum final `c4d0318a…` |
| Bilan équilibré | jeu d'états | ACTIF `AC1..AC5` = **1 550 000**, PASSIF = **1 550 000**, écart **0** |
| Compte de résultat de trésorerie | jeu d'états | recettes **750 000**, dépenses **500 000**, solde **250 000**, résultat **250 000** |
| **Les 3 cases de variation sont NOMMÉES et vides** | jeu d'états | `CRD`/`CRE`/`CRF` **émises à 0** — le formulaire n'est pas tronqué |
| AC-3 — états non prévus | jeu d'états | TFT `postes: []`, `NON_APPLICABLE`, `coherent: true` ; notes `NON_APPLICABLE` ; `valide: true` |
| AC-2 — le statut atteint le lecteur | `POST …/etats/bilan/dry-run` | `stamp.statut = "a-valider-par-expert"` |
| ⚡ **B1 rejoué sur l'état FINAL** — balance ÉQUILIBRÉE portant un `511000` (chèque à l'encaissement) | dry-run bilan + contrôles | `AC5` absorbe la valeur (400 000 → 500 000), `ACZ = PAZ = 1 550 000`, `ecartN: 0`, `comptesNonMappes: []`, **`valide: true`**. Avant le correctif : écart **−100 000**, `EQUILIBRE_BILAN` en **ANOMALIE**, liasse **non validable** |
| AC-5 — bascule d'axe | nouvel axe `SN` au 2026-01-01 | l'exercice 2025 **reste** `smt-togo@1.0` et la liasse déjà produite est intacte |

⚠️ **Dit comme tel** : l'habilitation, le KYC et les read-models de dossier ont été **posés directement en
base** pour monter le scénario (le dossier n'est pas passé par `dossier-service`). Ce qui est réellement
prouvé de bout en bout est la chaîne **balance → Kafka → liasse** ; l'octroi d'entitlement, lui, ne l'est
pas par cette vérification.

### ⛔ Ma mesure du « défaut pré-existant » était FAUSSE — prise par la revue de code

J'avais écrit qu'un compte de classe 4 **débiteur** dont un préfixe plus long est déclaré au passif
(`421000`, Personnel — avances et acomptes) rendait la liasse **déséquilibrée**, donc non validable, au
Système Normal comme au SMT, avec un écart de 77 700 à l'appui.

**C'est faux, et l'erreur est dans ma mesure** : j'avais ajouté le compte **sans contrepartie**, donc
sur une balance que j'avais moi-même déséquilibrée. L'écart annoncé était exactement le déséquilibre
que je venais d'introduire — `1 550 000 − 77 700 = 1 472 300`. Rejoué **avec sa contrepartie** :

| | `smt-togo@1.0` | `syscohada-revise@2.1` (témoin) |
|---|---|---|
| `ecartN` | **0** | **0** |
| `EQUILIBRE_BILAN` | **OK** | **OK** |
| `valide` | **true** | **true** |
| présentation | `PA4` = 122 300 au lieu de 200 000 | `DK` rendu à **−77 700** |

⇒ Le défaut réel est un défaut de **présentation** — l'avance au personnel est portée en diminution
d'un poste de passif au lieu d'être présentée à l'actif — et il ne déséquilibre **rien** : déplacer un
montant de l'actif vers un passif négatif préserve l'identité `actif = passif + résultat`. Il est
pré-existant (comportement identique sous SYSCOHADA) et hors périmètre.

⚡⚡ **C'est le même biais de mesure qui m'a fait rater le bloquant des comptes `50`/`51`** : là aussi
ma preuve docker (« dry-run avec un `501000` → nommé, totaux inchangés ») avait été prise sur une
balance rendue déséquilibrée par l'ajout du compte, si bien qu'elle **ne pouvait pas** montrer la
conséquence. **Une mesure ne prouve que ce qu'elle interroge, et ajouter une ligne à une balance sans
sa contrepartie change la question posée.**

### Constats de revue traités

| # | Constat | Traitement |
|---|---|---|
| **B1** | `50`/`51` sans ligne SMT ⇒ sur une balance **équilibrée**, `EQUILIBRE_BILAN` en anomalie et liasse **non validable**, alors que `balance-service` acceptait la balance | ⚡⚡ **corrigé** : rattachés à `AC5` « Banque (+/‑) », la ligne de trésorerie du formulaire — classement conforme à SYSCOHADA (`BQ`/`BR` en trésorerie-actif). Nouveau checksum |
| **B2** | Deux descriptions **OpenAPI publiées** citaient encore le SMT comme exemple du référentiel non livré | corrigé — le code d'erreur reste documenté, l'exemple périmé retiré |
| **B3** | La section « défaut pré-existant » de cette fiche était fausse | réécrite ci-dessus, sur une mesure refaite |
| **N1** | Deux commentaires du filet d'opérandes périmés par la story elle-même | corrigés |
| **N2** | Quatre autres endroits affirmaient encore que le SMT n'est pas packagé | corrigés |
| **N4** | ⚡ La fixture ne portait **aucun amortissement** : le signe de `CRG` dans `CRH` n'était gardé par **rien** (mutation verte mesurée par la revue) | `681` ajouté à la fixture ; mutation rejouée ⇒ **rouge sur 2 tests** |
| **N5** | Les 4 champs d'identité n'avaient pas été recopiés dans le type de `balance-service`, pourtant nommé « troisième point de recopie » | recopiés ; la garde du statut couvre le SMT dans les **deux** dépôts |
| **N6** | « Aucun préfixe nouveau » était faux d'exactement un : `622` | justification corrigée, et **mesurée** par un test |
| **N7** | Le test « deux marqueurs de trésorerie » était aveugle à un **troisième**, porté par `PA3`, qui marquait les emprunts long terme comme trésorerie | marqueur retiré (SYSCOHADA ne marque pas `DA`/`DB`) ; l'assertion porte sur l'**ensemble complet** |
| **N8** | Pas de fiche de provenance, alors que les 3 autres paquets non-SYSCOHADA en ont une | `docs/referentiels/README-smt-togo.md` écrit |
| **N3** | `cles()` créée pour tuer les listes écrites à la main, appliquée à **une seule** des huit gardes | ⚠️ **partiellement traité** : `statut-paquet` étendu dans les deux dépôts (c'est la garde que le paquet neuf rendait aveugle en introduisant un statut). Les six autres restent à lister ; la revue les a rejouées à la main sur le paquet SMT, qui les passerait. **Dette nommée, à ouvrir en story.** |

⚠️ **Toute la vérification ci-dessus a été REJOUÉE sur l'état final**, après les correctifs de revue :
le correctif B1 change l'artefact, donc son checksum, donc tout résultat mesuré avant lui ne valait plus
rien. Les deux services ont été redémarrés et la liasse recalculée.

### Portes de qualité

Mesurées **après** les correctifs de revue.

| | balance-service | bilan-service |
|---|---|---|
| Lint | 0 warning | 0 warning |
| Build | OK | OK |
| Unitaires | **3 706** verts, 186 suites | **2 623** verts, 169 suites |
| End-to-end | **902** verts, 26 suites | **797** verts, 23 suites |
| Couverture | ≥ seuils (65/90/90/90), portes passées | ≥ seuils, portes passées |

⚠️ Un premier passage a montré `sage-parser.service.spec.ts` rouge sur un **dépassement de délai** (5 s) ;
rejoué isolément **et** en suite complète, il passe. Flakiness sous charge, sans rapport avec la story.

### Mutations (rouges puis restaurées)

| Mutation | Filet visé | Résultat |
|---|---|---|
| Retirer `CRD` de la table de passage (checksum régénéré, pour que le rouge ne vienne pas d'un refus d'intégrité) | `operandes-coherence` **et** production de liasse | **Rouge des deux côtés**, avec `OperandeNonResolueError` sur `CRH` — le défaut de production reproduit |
| Rétablir la règle laxiste `tableDePassage ∪ postes` dans le filet | fixture « poste au gabarit seulement » | **Rouge**, un seul test, pour la bonne raison |
| ⚡ Inverser le signe de `CRG` dans `CRH` **et** l'ajouter aux opérandes de `CRB` | batterie de liasse SMT | **Verte avant le correctif N4** (la fixture ne portait aucun amortissement) ⇒ **rouge sur 2 tests** après ajout du compte `681` à la fixture |
