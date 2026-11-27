# STORY-344 : L'estimation des pénalités et majorations, comme un risque

Status: in-progress — écrite le 2026-11-27 par la session du groupe C juste avant de la coder (lot 7, n° 16 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3 ; **elle finit EPIC-033**) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et
« ⚠ Communs » du journal de C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md`
(EPIC-033, STORY-344), du PRD fiscalité (FR-F50 : « Les pénalités et majorations encourues (30 / 40 / 80 % selon la
gravité) sont estimées à partir des règles du paquet fiscal et affichées comme **risque estimé**, jamais confondues avec
un montant dû constaté » ; hypothèse **H5** : « le taux dépend-il d'une appréciation ? ») et de ce que STORY-343 a nommé
pour elle (« elle lit le retard des règlements **non annulés** »).

**Epic :** EPIC-033 · **Points :** 3 · **FR :** FR-F50 · **Architecture :** AD-1 / AD-4 / NFR-A06 (aucun taux dans le
code : le paquet, par pays et par année), AD-10 (les textes cités mot pour mot, par le corpus packagé) · **PRD** §3.3 :
« Prospera prépare, rapproche et prouve ; il n'exécute pas. »
**Service :** `prospera-fiscal-service` (dossiers `reglement` de C — module, application — et un dossier de domaine neuf
de C, `domain/penalites`) ; **la source du paquet fiscal Togo** dans `prospera-balance-service` (à C, D-L7-3).
**Après :** STORY-340 (le montant à régler : la référence et le reste), 342 (les règlements rapprochés, leur date et la date
limite de leur canal), 343 (« déposée » et « payée » ; les règlements non annulés), 317 (l'échéance applicable et ses
reports, `qualifierRetard`), 318 (`qualifierEcheance`, qui la prolonge), 325 (la version scellée : la date du dépôt), 339 (la
citation mot pour mot).
**Dans la même story** : la **demande de D (STORY-561)** — déclarer au **schéma** du paquet la rubrique racine facultative
`automatisation`, **sans aucune instance** au paquet Togo (« ← D : servie »).
**Suite :** la demande FE-097 de A (balance-service, PR à part, décision de la session de groupe), puis STORY-350 (FE-158
de A en tête), puis STORY-566.

## Histoire

En tant qu'**expert-comptable**, je veux mesurer ce qu'un retard coûterait, afin de prioriser mes rattrapages.
*(FR-F50)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-033)

1. **Étant donné** une obligation en retard **quand** l'estimation s'exécute **alors** les majorations sont calculées
   depuis les règles du paquet (30 / 40 / 80 % selon la gravité).
2. **Étant donné** cette estimation **quand** elle est affichée **alors** elle est présentée comme un **risque estimé**,
   jamais confondue avec un montant dû constaté.

Et, posés pour cette story : elle **ne change ni** le montant à régler (340), ni l'ordre (341), ni le rapprochement (342),
ni « Payée » (343) ; les taux, assiettes et délais viennent **du texte** (LPF, corpus packagé), portés au paquet avec
article et millésime, jamais de mémoire ; **ce que le texte ne fixe pas se dit par un motif nommé** ; le retard se lit sur
la date **applicable** (317, 318) et sur « déposée » / « payée » (343) ; l'article est cité mot pour mot (339).

## Ce que dit le texte (corpus `corpus-complet-cgi-lpf-togo.json`, LPF OTR 2025, LF 2023)

| Article | Ce qu'il fixe | Ce qu'en fait 344 |
|---|---|---|
| **LPF Art. 115** | « tout retard dans le paiement des impôts, droits, taxes, redevances, ou sommes quelconques donne lieu à l'application d'une pénalité égale, pour le premier mois à **10 %** du montant des sommes dont le versement a été différé. Ce taux est progressivement majoré, chaque mois, à raison de **1 %** à l'expiration du 1er mois de retard. Pour le calcul de cette pénalité, qui ne peut être inférieure à **mille (1 000) francs CFA**, toute période d'un (01) mois **commencée est comptée entièrement**. La même sanction est applicable en matière d'acomptes provisionnels, de précomptes et de retenues à la source. » | **chiffrée** : le retard de paiement |
| **LPF Art. 121** | « En cas de taxation d'office à défaut de déclaration dans les délais prescrits, les droits mis à la charge du contribuable sont majorés de **30 %** des droits dus pour chaque période d'imposition si la situation est régularisée dans les quinze (15) jours qui suivent la notification de la taxation d'office […]. A l'expiration de ce délai, la majoration est portée à **40 %** […]. Dans le cas d'évaluation ou de rectification d'office des bases d'imposition suite à une dissimulation, […] une majoration de **80 %**. » | **chiffrée en paliers** : le retard de déclaration (les 30 / 40 / 80 % de l'AC-1) |
| **LPF Art. 113, 5)** | « Le défaut de déclaration soit pour absence de base taxable en toute matière fiscale, soit pour TVA créditrice, est sanctionné par une amende de **cinquante mille (50 000) francs CFA** sauf dispositions contraires. » | **chiffrée** : le retard de déclaration d'un déclaré nul |
| **LPF Art. 113, 1)** | l'amende du défaut de déclaration **des résultats** selon le **segment** du contribuable (2 000 000 / 1 000 000 / 300 000 / 25 000 F) | **nommée, non chiffrée** : le segment (grandes, moyennes entreprises…) est fixé par l'Administration, le dossier ne le porte pas |
| **LPF Art. 153** | les retenues d'IRPP non versées dans les délais, retard de plus d'un mois : en sus de la pénalité de l'Art. 115, une amende de 500 000 à 3 000 000 F et un emprisonnement | **nommée, non chiffrée** : une sanction pénale, prononcée par le juge |
| LPF Art. 110, 117, 118 | la motivation écrite de toute sanction ; les majorations d'un redressement (insuffisance, mauvaise foi) | hors périmètre : ce ne sont pas des retards (D-344-11) |

**H5 (PRD) répondue par le texte, en partie** : le retard de paiement est mécanique (Art. 115) ; la majoration d'un défaut
de déclaration ne l'est pas — son taux dépend de faits de l'Administration (la notification de la taxation d'office, la
régularisation dans les quinze jours, une dissimulation). D'où les **paliers** (D-344-5).

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `57c7504`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le montant à régler (340, 342, 343) | la **référence** (le déclaré scellé ; avant le dépôt, le déclaré, sinon le calculé), les imputations, le déjà réglé (`max(payé, rapproché non annulé)`), `aRegler ≥ 0`, `complet` et ses manques | `domain/reglement/montant-a-regler.ts`, `MontantAReglerService.lire` |
| Les règlements rapprochés (342, 343) | chaque quittance : montant, `regleLe`, canal et son `delaiSupplementaireJours` (télépaiement : trois jours, LPF Art. 460), `annulation` | `domain/reglement/reglement-rapproche.ts`, `RegistreReglements` |
| L'échéance (317, 318) | l'**applicable** (la date reportée s'il y a un report) et la légale ; `qualifierRetard`, que `qualifierEcheance` prolonge | `domain/obligations/report-echeance.ts`, `alertes-echeance.ts` |
| La version scellée (325) | chaque dépôt scelle sa version, datée (`scellee.le`) ; `RegistreVersionsDeclaration.deLObligation` | `domain/obligations/version-declaration.ts` |
| La citation (339, 340) | `citerUneReference` : la référence du paquet cherchée au corpus, mot pour mot, ou un motif nommé | `domain/obligations/bases-legales.ts` |
| Le paquet (balance-service) | aucun bloc des pénalités ; `PENALITES_FISCALES` n'y est qu'une réintégration (CGI Art. 99) et `PENALITE_DEPOT_TARDIF` un poste de liasse | `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` |

**Ce qui manque** : rien ne dit ce qu'un retard coûterait ; le paquet ne porte aucun taux de pénalité.

## Contrat annoncé avant le code (2026-11-27)

**Ajouts seulement** : une route de lecture, un bloc du paquet, une rubrique déclarée au schéma du paquet. Aucun champ
existant ne change ni ne disparaît ; aucun événement ; aucune écriture ; ni le montant à régler, ni l'ordre, ni les
règlements, ni le calendrier, ni le cycle ne bougent.

### `GET /api/v1/obligations/{id}/risque-de-penalites[?aLa=AAAA-MM-JJ]` (AC-1, AC-2)

Rôles `TENANT_ADMIN`, `TENANT_USER`, accès fiscal (comme le montant à régler) ; portée de l'obligation (`404
OBLIGATION_INTROUVABLE`, même réponse hors portée) ; `aLa` : le jour de l'estimation, aujourd'hui par défaut, jamais un
jour passé (`400 DATE_D_ESTIMATION_INVALIDE`). Réponse `200` :

```
nature: "RISQUE_ESTIME"                     — toujours : une estimation, jamais une dette constatée (AC-2)
avertissement: texte                         — « … n'est ni un montant dû, ni un montant à régler … »
obligationId, dossierId, taxe, periode, aLa, estimeLe
statut: RISQUE_ESTIME | AUCUN_RISQUE_ESTIME | NON_ESTIMABLE
motif: null | OBLIGATION_ECARTEE | ECHEANCE_NON_DATEE | PAQUET_NON_LISIBLE | PENALITES_NON_DECLAREES_AU_PAQUET
message: texte | null
echeance: { applicable, legale, reportee }   — 317 : le retard se compte sur l'applicable
retards: {
  declaration: { enRetard: boolean | null, deposee: boolean, deposeeLe: jour | null, jours: entier | null },
  paiement:    { enRetard: boolean | null, jours: entier | null }
}
composantes: [{
  code, nature: RETARD_DE_PAIEMENT | RETARD_DE_DECLARATION, libelle,
  baseLegale,                                  — citée mot pour mot (339), ou son motif
  estimation: { minimum, maximum },            — entiers ≥ 0, en unités de la devise
  assiette: { montant, origine } | null,       — RETARD_DE_DECLARATION : les droits de la période (la référence de 340)
  portions: [{ origine: RESTE_NON_REGLE | REGLEMENT_TARDIF, reglementId | null, assiette, depuis, jusquAu,
               moisCommences, taux, montant, minimumApplique }],       — RETARD_DE_PAIEMENT
  paliers:  [{ gravite, libelle, taux, montant }],                      — RETARD_DE_DECLARATION, assiette > 0
  amende:   { code, libelle, montant, baseLegale } | null               — RETARD_DE_DECLARATION, assiette nulle
}]
nonChiffres: [{ code, libelle, motif, raison, baseLegale }]  — ce que le texte ne permet pas de chiffrer ici
reserves: [{ code, message }]   — GRAVITE_NON_CONSTATEE, PAIEMENT_SANS_DATE, DATE_DE_DEPOT_INCONNUE,
                                  ASSIETTE_INDISPONIBLE, MONTANT_A_REGLER_INCOMPLET, ARRONDI_NON_FIXE_PAR_LE_TEXTE
estimation: { minimum, maximum } | null      — la somme des composantes ; null : aucune
devise: "XOF" | null
chemins: { montantARegler, reglements }      — ce qui reste dû se lit là, jamais ici
paquet: { code, version, checksum } | null, corpus
```

### Le paquet fiscal Togo 2026 (balance-service) — bloc racine neuf `penalites`, garde **R14**

- `penalites.retardDePaiement` : `{ code, libelle, livre: "LPF", article: "Art. 115", millesime, assiette:
  "SOMMES_DONT_LE_VERSEMENT_A_ETE_DIFFERE", tauxPremierMois: 0.1, majorationParMois: 0.01, decompte: "MOIS_COMMENCE",
  minimum: 1000, portee, source }`.
- `penalites.retardDeDeclaration` : `{ code, libelle, livre: "LPF", article: "Art. 121", millesime, assiette:
  "DROITS_DE_LA_PERIODE", paliers: [{ gravite: REGULARISEE_DANS_LE_DELAI, taux: 0.3 }, { gravite: NON_REGULARISEE, taux:
  0.4 }, { gravite: DISSIMULATION, taux: 0.8 }] (chacun son libellé, la condition du texte), sansBaseTaxable: { code,
  libelle, montant: 50000, livre: "LPF", article: "Art. 113", millesime }, source }`.
- `penalites.nonChiffrees` : `[{ code, libelle, livre, article, millesime, retard: DECLARATION | PAIEMENT, obligations?:
  [codes du catalogue], motif, raison }]` — LPF Art. 113, 1) pour la DSF (`SEGMENT_DU_CONTRIBUABLE_NON_LU`) ; LPF Art. 153
  pour la retenue d'IRPP (`SANCTION_PENALE`).
- **R14** (au packaging) : chaque entrée cite son livre, son article (forme du corpus) et son millésime, ou dit ce qui
  reste à confirmer ; codes en MAJUSCULES ; assiette et décompte dans des listes **fermées** (celles que fiscal-service
  sait lire) ; taux dans `]0, 1]`, majoration dans `[0, 1]`, minimum et amende entiers ; paliers non vides, gravités
  uniques ; une obligation nommée est du catalogue ; au moins une des deux règles. Un paquet sans `penalites` (un autre
  pays) n'est pas concerné. Le moteur de balance-service ne lit pas ce bloc.
- **← D (561)** : le schéma déclare la rubrique racine facultative **`automatisation`** (`connecteurs[]`, de la forme de
  `STORY-561.md`, « Le contrat du bloc ») ; **aucune instance** au paquet Togo. Une instance future devra porter une `source`
  qui couvre ses valeurs numériques (le balayage R4, qui vaut pour tout le paquet) : dit à D.
- `_meta.revision`, artefact régénéré, **nouvelle empreinte** (au « Livré ») ; la copie du fiscal
  (`test/fixtures/paquet-fiscal/`) suit.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration, aucune collection, aucune écriture** : une lecture composée à la demande. Communs touchés dans le
fiscal : **le contrat OpenAPI** (la route neuve et ses DTO) et **la copie du paquet** (`test/fixtures/paquet-fiscal/
paquet-fiscal-togo-2026.json`, recopiée de balance-service à l'octet). Tout le reste dans des dossiers de C :
`domain/penalites` (neuf : la règle pure et sa garde AST), `application/reglement` (un service neuf,
`RisqueDePenalitesService`, qui lit `MontantAReglerService.lire` et `RegistreVersionsDeclaration`), `modules/reglement`
(la route, ses DTO, un fournisseur de plus). **`MontantAReglerService`, `OrdreDeReglementService` et
`RapprochementReglementService` ne changent pas** (constructeurs, signatures, ce qu'ils lisent) ; aucune classe instanciée
par `DepotsModule` ne change. Ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni `config/`, ni manifeste
`declarations`. Les gardes FR-F47 (aucune exécution de paiement) et D-340-3 (aucune règle d'imposition dans
`domain/reglement`) passent sans modification.

## Décisions (D-344-n) — prises le 2026-11-27, contestables

- **D-344-1 — Un risque estimé, jamais une dette** (AC-2). Une route de lecture à part, rien n'est stocké ; la réponse dit
  ce qu'elle est (`nature: RISQUE_ESTIME`, un avertissement) et renvoie au montant à régler pour ce qui est dû
  (`chemins`). ⛔ Rien d'autre ne la lit : le montant à régler, l'ordre, le rapprochement, le calendrier et « Payée » sont
  inchangés — une estimation n'entre dans aucun dû ni dans aucun ordre.
- **D-344-2 — Les taux, l'assiette et le décompte viennent du texte, au paquet** (AC-1, NFR-A06) : bloc `penalites`, garde
  R14, cités mot pour mot depuis le corpus. ⛔ Le domaine (`domain/penalites`) ne porte aucun taux, aucun seuil, aucun
  article, aucun code d'obligation : une garde AST le tient (seuls 0 et 1, pour compter, y sont des nombres).
- **D-344-3 — Le retard se lit sur l'échéance applicable** (317 : `qualifierRetard`, que `qualifierEcheance` de 318
  prolonge ; un report la déplace). Un **règlement rapproché non annulé** (342, 343) est en retard s'il est réglé après la
  date limite **de son canal** (l'applicable plus le délai supplémentaire du canal : trois jours pour le télépaiement, LPF
  Art. 460 — la règle de `REGLE_APRES_LA_DATE_LIMITE`) ; le **reste non réglé** (le `aRegler` de 340) l'est depuis
  l'applicable jusqu'au jour de l'estimation (le canal de ce qui n'est pas réglé n'est pas connu : aucun délai de canal).
- **D-344-4 — « Déposée » se lit comme en 343 ; la date du dépôt est celle du premier scellement** (325). Le retard de
  déclaration : déposée après l'applicable (le jour du scellement de la plus ancienne version), ou non déposée et le jour
  de l'estimation la dépasse. Une rectificative ou un rejet ouvre la version n + 1 : le premier dépôt reste celui qui
  compte (le traitement d'un dépôt rejeté est hors périmètre). Une obligation déposée avant 325, sans version :
  `DATE_DE_DEPOT_INCONNUE`, rien n'est estimé pour sa déclaration.
- **D-344-5 — La gravité n'est pas constatée : chaque palier est montré, aucun n'est retenu** (AC-1, H5). La notification
  de la taxation d'office, la régularisation dans les quinze jours et la dissimulation sont des faits de l'Administration ;
  l'estimation rend les trois paliers de l'Art. 121 avec leur montant, et une **fourchette** (le plus bas, le plus haut),
  réserve `GRAVITE_NON_CONSTATEE`. Un déclaré nul : l'amende de l'Art. 113, 5), à la place des paliers.
- **D-344-6 — L'assiette.** Retard de paiement : la somme dont le versement a été différé — la quittance tardive, ou le
  reste du montant à régler de 340 (net d'acomptes, de crédits, de retenues et du déjà réglé). Retard de déclaration :
  « les droits dus pour chaque période d'imposition » — la **référence** de 340 (le déclaré scellé ; avant le dépôt, le
  déclaré, sinon le calculé), jamais nette des acomptes ; son origine est rendue.
- **D-344-7 — Le décompte de l'Art. 115.** Mois commencés : le plus petit n ≥ 1 tel que la date limite plus n mois
  atteint le jour du versement (ou de l'estimation) ; une fin de mois est bornée (31 janvier + 1 mois = 28 février).
  Taux : `tauxPremierMois + majorationParMois × (n − 1)`, calculé exactement (fractions décimales, 310). Le minimum vaut
  par somme différée. **L'arrondi** n'est pas fixé par le texte : le franc supérieur (une estimation de risque ne
  s'arrondit pas vers le bas), réserve `ARRONDI_NON_FIXE_PAR_LE_TEXTE` dès qu'un produit est fractionnaire.
- **D-344-8 — Ce qui ne se chiffre pas se nomme.** Au paquet (`nonChiffrees`) : l'Art. 113, 1) pour la DSF (le segment du
  contribuable n'est pas au dossier) et l'Art. 153 pour la retenue d'IRPP (une sanction pénale), rendus quand le retard
  qu'ils visent existe. Côté produit : le **payé saisi au triplet** sans quittance n'est pas daté du versement
  (`PAIEMENT_SANS_DATE`), sauf s'il a été saisi au plus tard à la date limite ; une assiette qui ne se lit pas
  (`ASSIETTE_INDISPONIBLE`, avec le motif de 340) ; un montant à régler incomplet (`MONTANT_A_REGLER_INCOMPLET` : le reste
  peut être surestimé).
- **D-344-9 — Deux infractions, deux composantes, une somme.** Le défaut de déclaration (Art. 121, 113) et le retard de
  paiement (Art. 115) sont deux faits distincts, chacun son texte : l'estimation les additionne. Le non-cumul de l'Art. 109
  (« une infraction ne peut donner lieu qu'à une seule amende fiscale ») vaut pour une même infraction ; celui de l'Art. 116
  vise la majoration d'un titre de recouvrement, pas un impôt déclaré spontanément.
- **D-344-10 — Le jour de l'estimation.** Aujourd'hui par défaut ; un jour futur pour prioriser (« si je régularise le … ») ;
  jamais un jour passé (les règlements d'aujourd'hui y seraient mal placés) : `400 DATE_D_ESTIMATION_INVALIDE`.
- **D-344-11 — Hors périmètre, nommé.** (1) L'écran (A). (2) Le calendrier et la vue de charge : aucun champ neuf (une
  estimation par ligne relirait le paquet et les versions de 500 lignes). (3) Les majorations d'un redressement (Art. 117,
  118) et la motivation de la sanction (Art. 110) : des actes de l'Administration, pas des retards. (4) Le dépôt rejeté. (5)
  Le dossier de contrôle (D, 336). (6) Le statut : `AUCUN_RISQUE_ESTIME` dit que rien n'est estimé, pas qu'il n'y a pas de
  retard — les réserves disent ce qui n'a pas pu l'être.
- **D-344-12 — ← D (561) servie dans la même PR du paquet** : la rubrique `automatisation` déclarée au schéma, facultative,
  de la forme annoncée par D ; aucune instance ; une recopie n'est pas nécessaire pour elle.

## Preuves attendues

Balance (Node 24, `-w 2`) : la garde R14 (le paquet Togo la passe ; chaque faute nommée ; un paquet sans `penalites`
passe ; une référence à confirmer passe) ; la rubrique `automatisation` (absente : passe ; une instance de la forme de
D passe, une forme fausse est nommée, une valeur numérique sans `source` l'est par R4) ; l'empreinte épinglée ; toute la
suite, e2e comprises ; mutations sur R14. Fiscal (Node 24, `-w 2`) : la règle pure (le décompte des mois et la fin de mois ;
le taux exact ; le minimum ; l'arrondi ; chaque palier ; l'amende d'un déclaré nul ; l'échéance applicable et le report ;
le délai du canal ; les annulés exclus ; le payé sans date ; la date du premier dépôt ; chaque motif et chaque réserve ; les
non-chiffrés filtrés par retard et par obligation ; jamais un montant dû) ; la garde AST du domaine ; le service (portée,
une lecture des versions) ; e2e (une TVA déposée en retard et impayée : paliers 30 / 40 / 80 et pénalité de retard ; une
quittance tardive ; un report qui efface le retard ; un déclaré nul ; une DSF : nommée, non chiffrée ; `aLa` passé : 400 ;
le montant à régler identique avant et après) ; toute la suite du fiscal, celles de D comprises ; mutations sur la logique
neuve ; `docker compose up` du fiscal et de balance, sain (un fournisseur de plus).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-27 | Fiche écrite, contrat et communs annoncés avant le code. |
