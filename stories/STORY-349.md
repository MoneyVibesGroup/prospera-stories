# STORY-349 : Les obligations sociales dans le calendrier, le cycle et la preuve

Status: in-progress — fiche écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 6,
`PLAN-LOT-7-2026-11-24.md` §4) ; contrat et fichiers communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs »
du journal de D). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-034).

**Épic :** EPIC-034 — Base de rémunération et obligations sociales (**la dernière story de l'épic**)
**Points :** 3 · **Service :** `fiscal-service` (`:3012`), dossier de D `remuneration` (D-L7-1)
**FR :** `FR-F31` *(les obligations sociales au calendrier, au cycle et à la preuve, au même titre que les fiscales)* ·
`FR-F10` *(une obligation qu'on ne sait pas dater est dérivée non datée et nommée)* · `NFR-F04` *(aucune date dans le
code)* · `AD-21` *(aucune donnée nominative hors de la base)*
**Décision :** **AD-17** *(une seule écriture des obligations, les champs humains survivent à la re-dérivation)* ·
**AD-2** *(les familles)* — `architecture-fiscal-service-2026-08-03`
**Dépend de :** **STORY-364** ✅ (fiscal #68, `dev` `d41dbe6`) · **STORY-348** ✅ (les échéances de la période lues au
paquet, `echeancesDe`, D-348-9) · **STORY-319** de C ✅ (fiscal #71, `dev` `0cc79a7` : *« une obligation sociale
enregistrée comme les fiscales (`RegistreObligations.enregistrer`) est affectable, comptée à la charge et alertée sans
rien de plus »*) · **STORY-317** de C ✅ (`cnss.collecte` au paquet).

## Histoire

En tant qu'**expert-comptable**, je veux voir mes échéances sociales à côté des fiscales, afin d'avoir un calendrier
complet. *(FR-F31)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-034)

1. **Étant donné** une obligation sociale dérivée **quand** j'ouvre le calendrier **alors** elle y figure au même titre
   qu'une obligation fiscale.
2. **Étant donné** une obligation sociale **quand** elle progresse **alors** elle suit le même cycle de vie et produit la
   même piste d'audit.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `0cc79a7`)

| Pièce | Ce qu'elle porte | Où |
| --- | --- | --- |
| L'écriture unique des obligations | `RegistreObligations.enregistrer(orgId, ObligationDerivee[])` : idempotente sur `(dossier, redevable, implantation, taxe, période)`, `$set` des champs dérivés, `$setOnInsert` des champs humains (statut, responsable, déclarations, report…), acte `OBLIGATION_DERIVEE` ou `OBLIGATION_REDERIVEE` au journal chaîné `obligation:<id>` dans la transaction | port `ports/registre-obligations.ts` (C), exporté par `ObligationsModule` |
| Le calendrier | du dossier (`GET /exercices/{id}/obligations`, `duDossier`) et du portefeuille (`GET /obligations/calendrier`, 315) : toute obligation active de l'année, quelle que soit sa taxe ; filtre `taxe` libre | C |
| Le cycle et la preuve | `POST /obligations/{id}/transition` (323) : onze états, droits par état d'arrivée, gardes (écartée, anomalies 328), bases à la prise en charge (320 : la balance du dossier à la date de la période), acte `OBLIGATION_TRANSITION` ; affectation, charge, alertes (318, 319) | C |
| Les échéances sociales | `echeancesDe(contenu, periode)` : `COTISATIONS_SOCIALES` par `cnss.collecte`, `RETENUE_IRPP` par `irpp.retenueALaSource.reversement` (`jourLimite`, `moisSuivant`, source) ; `NON_DECLAREE` avec le manque sinon | `domain/remuneration/calcul-social.ts` (D, 348) |
| Le catalogue du paquet Togo 2026 | `TVA`, `IS_ACOMPTE`, `DSF`, `TAF`, `TCA`, `IRPP_DECLARATION`, `TPU`, `TPU_ACOMPTE`, `RSH` : **aucune obligation sociale** | copie du paquet (C) |

**Ce qui manque** : aucune obligation sociale n'est jamais écrite. Le calendrier, le cycle et la preuve sont prêts à les
recevoir ; rien ne les dérive.

## Ce que la story livre

La **dérivation des obligations sociales d'une période**, depuis sa base de rémunération et le paquet de l'année : deux
obligations de l'employeur, **`COTISATIONS_SOCIALES`** (les trois branches de la CNSS et l'AMU, Q-D-22) et
**`RETENUE_IRPP`** (la retenue à la source sur les traitements et salaires), datées au jour que le paquet déclare, écrites
par **l'écriture unique des obligations** (`RegistreObligations.enregistrer`). Elles entrent ainsi au calendrier, au
cycle, à la piste d'audit, à l'affectation, à la charge et aux alertes **par le même chemin que les fiscales** — sans
une ligne de code dans les dossiers de C.

## Décisions

- **D-349-1 — Dérivées de la base, pas du catalogue, et écrites par la même écriture.** Le catalogue du paquet (C)
  catalogue les obligations **par type d'entité** ; qu'un dossier paie des rémunérations un mois donné n'est pas un axe
  du catalogue, c'est le fait que porte la base de rémunération (D). Une entrée `CNSS` au catalogue ferait naître des
  cotisations pour toute entreprise, salariés ou non. La dérivation sociale est donc un **calcul pur du dossier
  `remuneration`** (`domain/remuneration/obligations-sociales.ts`) qui rend des `ObligationDerivee` — le type de la
  dérivation du catalogue, lu sans écriture —, et **les écrit par `RegistreObligations.enregistrer`** : la clé, l'idempotence,
  les champs humains intouchés et l'acte `OBLIGATION_DERIVEE` sont ceux de toute obligation (AD-17). Le cas d'usage du
  catalogue (`DeriverObligationsService`) reste le seul à dériver le catalogue ; il n'efface aucune obligation qu'il n'a
  pas dérivée (vérifié : `enregistrer` n'upserte que ce qu'il reçoit). C'est la voie qu'annonçait 319.
- **D-349-2 — Ce qui fait naître une obligation sociale : la base d'une période.** Une base constituée pour `AAAA-MM`
  (au moins une ligne : `BASE_VIDE` refuse déjà une base sans ligne) ⇒ **deux** obligations pour cette période,
  quelles que soient les lignes : un dirigeant dont les cotisations sont bloquées (364) n'efface pas l'obligation de
  l'employeur — le blocage se lit au calcul (`GET …/calcul`), l'obligation reste au calendrier (FR-F25). ⛔ **Un mois
  sans base n'est pas dérivé** : rien ne dit au code qu'un dossier est employeur ce mois-là, et une déclaration « néant »
  à la CNSS n'est pas sourcée (**Q-D-24**, choix par défaut : non).
- **D-349-3 — La clé et les champs de l'obligation.** Dossier ; redevable **`entreprise`** (l'employeur, jamais un
  bénéficiaire) ; implantation **`principale`** (la base est celle du dossier) ; taxe `COTISATIONS_SOCIALES` |
  `RETENUE_IRPP` (les codes des échéances de 348) ; période `AAAA-MM` de la base, année de la période. Famille (AD-2) :
  `PROPORTIONNELLE` pour les cotisations (des taux sur une assiette), `BAREME_TRANCHES` pour la retenue (le barème de
  l'Art. 74) ; le mode du montant suit la règle de toute dérivation (`modeDuMontant`, 314) : ni « à saisir » ni refusé.
  Libellé et assiette en clair (des textes, aucune règle). `parametres`, `gabarit`, `derogation` : `null`. ⛔ **AD-21** :
  ni bénéficiaire, ni montant, ni nom sur l'obligation ni dans son acte d'audit — la période et l'échéance seulement.
- **D-349-4 — L'échéance, lue au paquet par la fonction du calcul.** `echeancesDe` (348) : le 15 du mois suivant pour
  les deux au paquet Togo 2026 (`cnss.collecte` depuis 317, `irpp.retenueALaSource.reversement`, LPF Art. 27) ;
  `2026-12` ⇒ `2027-01-15`. Une échéance `NON_DECLAREE` ⇒ l'obligation est **dérivée non datée et nommée** (FR-F10) :
  `derivable: false`, `motifNonDerivable: ECHEANCE_ABSENTE_DU_PAQUET`, `detailNonDerivable` = le chemin
  (`cnss.collecte`) ; le jour où le paquet la déclare, la dérivation suivante la date, **sans livraison**. ⛔ Aucun 15
  dans le code (NFR-F04). `baseLegale.article` = la source de l'échéance telle que le paquet l'écrit ; `canal` =
  l'organisme que le bloc du paquet nomme (`cnss.collecte.organisme`, « CNSS Togo »), sinon **`NON_DECLARE`** (le
  paquet ne nomme pas l'organisme du reversement de la retenue : → C, information) ; `signalements` = les éléments non
  validés du paquet que la date emploie (`cnss.collecte`, `irpp.retenueALaSource.reversement`), comme pour une
  obligation du catalogue (298).
- **D-349-5 — Un seul écrivain par clé : le catalogue fait foi.** Si le catalogue du paquet porte un jour une entrée du
  même code (`COTISATIONS_SOCIALES` ou `RETENUE_IRPP`), sa clé serait celle de la dérivation sociale et deux écrivains
  se la disputeraient : la dérivation sociale **s'écarte de ce code, nommément** (`ecartees[] { taxe, motif:
  CATALOGUE_LA_PORTE }`), sans rien écrire pour lui.
- **D-349-6 — Le déclencheur : l'écriture de la base.** La saisie (`PUT …/remuneration/{periode}`) et l'import
  (`POST …/import`) dérivent les obligations sociales de la période **après** l'écriture de la base, qu'elle soit
  `CREEE` ou `INCHANGEE` : re-soumettre la même base re-dérive sans rien créer de plus (idempotent), et c'est ainsi
  qu'un paquet complété date une obligation restée non datée. Pas de route neuve. Le paquet est celui du pays du dossier
  et de l'année de la période (le chargeur du calcul, D-348-11). **Paquet inaccessible** : la base est écrite (elle ne
  dépend pas du paquet), et la réponse le dit (`obligationsSociales.statut: NON_DERIVEES`, le code et le message du
  refus du paquet) — jamais en silence. Une panne de l'écriture des obligations après la base rend l'erreur (5xx) ; la
  base reste écrite et la re-soumission dérive.
- **D-349-7 — Le cycle et la preuve : rien de neuf, et c'est le critère.** Une obligation sociale prend la même route de
  transition (323), les mêmes droits par état, les mêmes gardes (écartée, anomalies 328), la même affectation (319), la
  même charge et les mêmes alertes (318) ; à la prise en charge, les mêmes bases (320 : la balance du dossier qui couvre
  le dernier jour du mois). Sa piste est celle de toute obligation, au journal chaîné `obligation:<id>` :
  `OBLIGATION_DERIVEE`, `OBLIGATION_REDERIVEE` (échéance changée), `OBLIGATION_TRANSITION`, etc. Que la prise en charge
  d'une obligation sociale se fonde sur la balance plutôt que sur la base de rémunération est un choix par défaut
  (**Q-D-25**) : le changer touche les bases de 320 (C). Le calculé du triplet (322, 321) reste indisponible pour une
  obligation sociale (le moteur de `balance-service` ne la chiffre pas) ; son chiffre est au calcul social (`GET
  …/calcul`, 348) : le brancher au triplet est une suite, à placer (dossier de C).
- **D-349-8 — Contrat, communs.** **Un champ ajouté** aux réponses de la saisie et de l'import, `obligationsSociales`
  (ci-dessous) ; aucune route, aucun droit, aucun topic, aucune migration, aucune collection. **Communs** : le contrat
  OpenAPI seul. `remuneration.module.ts` (D) importe `ObligationsModule` (C), qui exporte déjà `RegistreObligations` :
  **aucun fichier de C ne change**. → C (information, 350) : `ObligationsModule` ne pourra pas importer
  `RemunerationModule` sans `forwardRef` (le module de 350 peut importer les deux).

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Routes** | `PUT /api/v1/dossiers/{dossierId}/remuneration/{periode}` et `POST …/{periode}/import` : inchangées (statuts, refus, gardes) ; leur réponse gagne un champ |
| **Champ ajouté** | `obligationsSociales` (toujours présent après une écriture réussie) |
| `obligationsSociales` | `DERIVEES` : `{ statut, paquet { code, version }, enregistrement { creees, actualisees, inchangees }, obligations[], ecartees[] }` · `NON_DERIVEES` : `{ statut, refus { code, message } }` (le refus du paquet, tel quel) |
| `obligations[]` | `{ taxe: COTISATIONS_SOCIALES \| RETENUE_IRPP, periode, echeance (AAAA-MM-JJ \| null), derivable, motifNonDerivable, detailNonDerivable }` |
| `ecartees[]` | `{ taxe, motif: CATALOGUE_LA_PORTE }` |
| **Au calendrier** | rien de neuf : les deux obligations sont des lignes du calendrier du dossier et du portefeuille (`taxe`, `periode`, `echeance`, `statut`, `responsable`…), filtrables par `taxe=COTISATIONS_SOCIALES` |

## Ce que cette story ne fait PAS

- ⛔ Elle ne touche ni le catalogue du paquet (C), ni la dérivation du catalogue, ni le cycle, ni les bases, ni le
  triplet, ni le calendrier (dossiers de C) : elle les **emploie**.
- ⛔ Elle ne calcule rien de neuf (348 et 364 calculent) et ne met aucun montant sur l'obligation (D-349-7).
- ⛔ Elle n'invente ni date, ni organisme, ni déclaration « néant » (D-349-2, D-349-4).
- ⛔ Elle ne fait pas le dépôt d'une déclaration sociale (EPIC-032) ni la notification des alertes (hors lot 7).

## Definition of Done

- [ ] Une base écrite (saisie et import) ⇒ ses deux obligations sociales au calendrier du dossier et du portefeuille, au
      même titre qu'une `TVA` du même dossier (e2e et MongoDB réel).
- [ ] Une obligation sociale traverse le cycle par la route de transition et laisse `OBLIGATION_DERIVEE` puis
      `OBLIGATION_TRANSITION` au journal chaîné, chaîne intacte ; une re-dérivation garde statut et responsable
      (MongoDB réel).
- [ ] **Mutations** qui rougissent sur une assertion : échéance au 15 en dur ; `NON_DECLAREE` datée quand même ;
      garde du catalogue retirée ; redevable ou implantation autres ; dérivation retirée de la saisie ou de l'import ;
      `INCHANGEE` qui ne dérive pas ; paquet refusé qui refuse la base ou qu'on tait.
- [ ] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, le module monté.
