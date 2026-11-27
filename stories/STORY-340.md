# STORY-340 : Le montant à régler, net d'acomptes, de crédits et de retenues — ne jamais payer deux fois

Status: in-progress — écrite le 2026-11-27 par la session du groupe C juste avant de la coder (lot 7, n° 12 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-033, STORY-340) et du PRD
fiscalité (FR-F46). Elle ouvre EPIC-033 (340 → 344).

**Epic :** EPIC-033 · **Points :** 5 · **FR :** FR-F46 (le montant à régler tient compte des acomptes déjà versés, des
crédits d'impôt, des retenues déjà opérées et des reports antérieurs) · **Architecture :** AD-1 et AD-4 (le fiscal ne
calcule aucun impôt : il soustrait ce que le paquet dit d'imputer, sur des montants déclarés, payés ou calculés par le
moteur), AD-9 (la version scellée fait foi), NFR-A06 (aucune règle ni aucun texte de loi dans le code)
**Services :** `prospera-fiscal-service` (dossier neuf `reglement`, à C par D-L7-1 ; communs nommés plus bas) et
`balance-service` (la source du paquet fiscal Togo, à C depuis D-L7-3).
**Après :** STORY-322 (le triplet calculé / déclaré / payé), 321 (le calculé du moteur), 325 (les versions scellées), 327
(les reports déclarés), 329 (le chemin d'un montant), 339 (les bases légales et le corpus packagé).
**Suite :** STORY-341 (l'ordre de règlement produit, jamais exécuté, lit ce montant) ; STORY-565 de D (le dépôt automatisé
transporte l'ordre de 341 jusqu'au bon redevable).

## Histoire

En tant qu'**expert-comptable**, je veux connaître le solde réellement dû, afin de ne pas payer deux fois ce qui l'a déjà
été. *(FR-F46)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-033)

1. **Étant donné** des acomptes versés, des crédits d'impôt, des retenues opérées et des reports antérieurs **quand** le
   montant à régler est calculé **alors** tous sont déduits.
2. **Étant donné** un excédent de versement **quand** le calcul s'exécute **alors** il est restitué comme excédent, jamais
   comme un montant dû négatif.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `ffd6f2a`, balance `61997fd`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le triplet (322) | le **calculé** (du moteur, 321, ou saisi par le cabinet, 314 ; indisponible, nommé), le **déclaré** et le **payé**, deux champs humains (`montantDeclare`, `montantPaye` : montant, motif, par, le) | `domain/obligations/triplet.ts` |
| Les versions (325) | le dépôt **scelle** la version courante (`versions_declaration`) : le déclaré et l'assiette, les reports déclarés (327), jamais récrite ; une rectificative ouvre la n + 1 et garde le payé (D-325-5 : « 340 calculera le complément ») | `domain/obligations/version-declaration.ts` |
| Les reports (327) | `reportsDeclares` : `creditAnterieur`, `creditAReporter`, `deficitAnterieur`… ; une TVA en crédit se déclare **0** avec son `creditAReporter` | `domain/obligations/continuite.ts` |
| Le chemin (329) et les bases légales (339) | `GET /obligations/{id}/chemin` ; la citation d'une référence du paquet (livre, article, millésime) mot pour mot depuis le corpus packagé (CGI + LPF OTR 2025) | `domain/obligations/chemin.ts`, `bases-legales.ts`, `corpus-legal.ts` |
| Le catalogue du paquet | les obligations à montant : `TVA`, `IS_ACOMPTE`, `TAF`, `TCA`, `TPU` (« le solde, sous déduction des acomptes versés »), `TPU_ACOMPTE`, `RSH` ; `DSF` et `IRPP_DECLARATION` sont **déclaratives** (sans montant) ; `RETENUE_IRPP` et `COTISATIONS_SOCIALES` naissent de la paie (349, D) | paquet fiscal Togo 2026, `catalogueObligations` |

**Ce qui manque** : aucune lecture ne dit ce qui reste à payer ; le paquet ne dit nulle part ce qui s'impute sur quoi
(les acomptes de TPU sur la TPU, le crédit antérieur sur la TVA), ni ce que devient un excédent.

## Contrat annoncé avant le code (2026-11-27)

**Ajouts seuls** : une route de lecture, un bloc neuf du paquet. Aucun droit, aucun événement, aucune collection ; aucun
champ existant ne change ; manifeste `declarations` inchangé ; aucune route de `balance-service` ne change (le moteur ne
lit pas le bloc neuf).

### `GET /api/v1/obligations/{id}/montant-a-regler` (AC-1, AC-2)

Rôles `TENANT_ADMIN`, `TENANT_USER`, accès fiscal ; portée de l'obligation (comme le chemin) : hors portée ou autre
organisation ⇒ `404 OBLIGATION_INTROUVABLE`. Lecture seule, rien n'est stocké. Réponse `200` :

```
{ obligationId, dossierId, redevableId, taxe, periode, luLe,
  statut: DEPOSEE | AVANT_DEPOT | INDISPONIBLE, motif | null, message | null, complet,
  version: { numero, nature, scellee, versionId | null },
  reference: { montant, origine: VERSION_SCELLEE | DECLARE | CALCULE, chemin } | null,
  regle: { libelle, baseLegale } | null,
  imputations: [{ code, nature: ACOMPTE | CREDIT_IMPOT | RETENUE | REPORT_ANTERIEUR, libelle,
                  mode: DEDUITE | DANS_LE_DECLARE, montant | null, motif | null, message | null,
                  provenances: [{ obligationId, taxe, periode, statut, paye: { montant, par, le } | null, chemin }],
                  report: { champ, version | null } | null, baseLegale }],
  dejaRegle: { montant, par, le } | null,
  aRegler: entier ≥ 0 | null,
  excedents: [{ code, montant, traitement | null, libelle | null, baseLegale | null, motif | null }],
  manques: [{ code, message, obligationId | null, periode | null }],
  paquet: { code, version, checksum } | null, corpus }
```

- **La référence** : déposée, le déclaré **de la version scellée** (`VERSION_SCELLEE`) ; avant le dépôt, le déclaré
  courant (`DECLARE`), sinon le calculé du triplet (`CALCULE`, le moteur ou le cabinet) ; jamais un calculé après le dépôt.
  Sans référence : `INDISPONIBLE`, `aRegler: null`, motif nommé (`SANS_MONTANT`, `MONTANT_A_SAISIR`,
  `CALCUL_DELEGUE_NON_DISPONIBLE`, `DECLARE_ABSENT`).
- **Les imputations** viennent du paquet de l'obligation (`reglement.obligations.<CODE>.imputations`) : un acompte se
  déduit de son **payé enregistré** (322) ; un report de la déclaration elle-même (le crédit de TVA antérieur) est
  **déjà dans le déclaré** (`DANS_LE_DECLARE`) : montré, jamais déduit deux fois. Chacune dit d'où elle vient
  (`provenances` ou `report`, le chemin de 329) et cite sa base légale mot pour mot (citation de 339).
- **Le montant** : `aRegler = max(0, référence − imputations déduites − déjà réglé)` ; **jamais négatif** (AC-2). Un
  excédent est rendu dans `excedents`, avec ce que le paquet dit de son sort et sa base (`EXCEDENT_D_ACOMPTES` de la TPU :
  remboursé sous déduction des autres impôts directs, LPF Art. 57 ; `CREDIT_DE_TVA_A_REPORTER` : imputé sur les
  déclarations ultérieures, CGI Art. 204) ; un payé supérieur au dû est un **`TROP_VERSE`** dont le paquet ne dit pas le
  sort (`TRAITEMENT_NON_DECLARE_AU_PAQUET`), jamais présenté comme un remboursement.
- **Ce qui ne se lit pas ne se déduit pas, et se nomme** : `complet: false` et `manques` (`PAQUET_NON_LISIBLE`,
  `IMPUTATIONS_NON_DECLAREES_AU_PAQUET`, `IMPUTATION_NON_LISIBLE`, `ACOMPTE_SANS_PAIEMENT_ENREGISTRE`).

### Le paquet fiscal Togo 2026 (`balance-service`, source et artefact)

Bloc neuf **`reglement`** `{ _note, obligations: { <CODE>: { libelle, livre, article, millesime, imputations: [{ code,
nature, libelle, source: { type: PAIEMENTS_D_OBLIGATIONS, obligation } | { type: REPORT_DECLARE, champ }, livre, article,
millesime }], excedent: { code, traitement, libelle, source?, livre, article, millesime } | null } } }` — chaque
référence lue dans le corpus OTR 2025 :

| Obligation | Règle | Imputations | Excédent |
|---|---|---|---|
| `TPU` | LPF Art. 57 : « Le solde de l'impôt est acquitté spontanément, au moment du dépôt des états financiers » | `ACOMPTES_TPU` (ACOMPTE) : les payés des `TPU_ACOMPTE` de l'année, LPF Art. 57 | `EXCEDENT_D_ACOMPTES` : « remboursé sous déduction des autres impôts, droits et taxes directs », LPF Art. 57 |
| `TVA` | LPF Art. 60 : la déclaration indique « le montant de la taxe exigible ou, le cas échéant, le crédit de taxe » | `CREDIT_TVA_ANTERIEUR` (REPORT_ANTERIEUR) : `creditAnterieur` déclaré, CGI Art. 204 | `CREDIT_DE_TVA_A_REPORTER` : `creditAReporter` déclaré, imputé sur les déclarations ultérieures, CGI Art. 204 |
| `IS_ACOMPTE` | LPF Art. 55 | aucune | — |
| `TPU_ACOMPTE` | LPF Art. 57 | aucune | — |
| `RSH` | LPF Art. 99 | aucune | — |
| `RETENUE_IRPP` | LPF Art. 27 | aucune | — |

Garde **R13** au packaging : chaque obligation, imputation et excédent porte sa référence (livre CGI | LPF, article sous
la forme du corpus, millésime) **ou** ce qui reste à confirmer, jamais les deux ; une nature, un type de source, un champ
de report hors des listes fermées est refusé ; une source `PAIEMENTS_D_OBLIGATIONS` nomme une obligation du catalogue.
`_meta.revision` gagne sa ligne. Nouvelle empreinte, réépinglée ; **B prévenu** (recopie de `dossier-service`), **D
prévenu**.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration**, aucune collection, aucune écriture. Communs touchés dans le fiscal : **`app.module.ts`** (import de
`ReglementModule`) ; **le contrat OpenAPI** (la route neuve) ; **la copie du paquet**
(`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, recopiée à l'octet de balance-service). Tout le reste dans des
dossiers de C : `domain/reglement`, `application/reglement`, `modules/reglement` (neufs) ; `domain/obligations/bases-legales.ts`
(la citation d'une référence, factorisée pour être partagée) ; la garde AST de 321 (`garde-calcul-delegue.spec.ts`), qui
s'étend au règlement ; `test/obligations.e2e-spec.ts`. `ObligationsModule` n'est pas modifié (il exporte déjà les registres
des obligations et des versions). Ni `package.json`, ni `read-models/`, ni manifeste.

## Décisions (D-340-n) — prises le 2026-11-27, contestables

- **D-340-1 — Une lecture composée, rien n'est stocké.** Le montant à régler se recompose à la demande : la version scellée
  (ou l'obligation avant le dépôt), le paquet de l'obligation, les payés des obligations qui s'imputent. 341 produira l'ordre
  à partir de cette lecture.
- **D-340-2 — La référence suit le dépôt.** Déposée : le déclaré de la version scellée courante (AD-9) ; une obligation
  déposée avant 325, sans version, lit son déclaré figé au dépôt (322) ; avant le dépôt : le déclaré courant, sinon le
  calculé du triplet (`statut: AVANT_DEPOT`). Après le dépôt, jamais de repli sur le calculé : ce qui compte est ce qui est
  parti.
- **D-340-3 — Ce qui s'impute sur quoi est une donnée du paquet.** Le domaine ne connaît que deux sources fermées
  (`PAIEMENTS_D_OBLIGATIONS`, `REPORT_DECLARE`) et quatre natures (`ACOMPTE`, `CREDIT_IMPOT`, `RETENUE`,
  `REPORT_ANTERIEUR`) ; la règle de chaque obligation (quelle source, quel code, quel article) est au paquet, gardée par
  R13. Aucun taux, aucun seuil, aucun article dans le code ; la garde AST de 321 couvre le règlement, et une garde neuve
  tient le domaine du règlement sans littéral numérique autre que 0.
- **D-340-4 — Un acompte se déduit de ce qui a été payé.** Le payé enregistré (322) des obligations du code source, même
  dossier, même redevable, même année (`annee`), y compris une écartée qui porte un payé (sinon on paierait deux fois) ;
  jamais son calculé ni son déclaré. Un acompte sans payé n'est pas déduit et se nomme (`ACOMPTE_SANS_PAIEMENT_ENREGISTRE`,
  « s'il a été payé, enregistrez son paiement ») ; aucune obligation source dans l'année : rien à déduire, dit.
- **D-340-5 — Le report de la déclaration est dans le déclaré.** LPF Art. 60 : la déclaration de TVA indique la taxe
  exigible ou le crédit ; 327 déclare 0 et son `creditAReporter` quand la période est en crédit. Le crédit antérieur déclaré
  est donc **montré** (`DANS_LE_DECLARE`, avec sa base, CGI Art. 204), jamais soustrait une seconde fois ; non déclaré, il
  est nommé (`REPORT_NON_DECLARE`) sans changer le montant. Le crédit à reporter est l'excédent de la période.
- **D-340-6 — Le déjà réglé est le payé de l'obligation.** Une rectificative garde le payé de la version n (D-325-5) : le
  montant à régler est le complément. Un payé supérieur au dû est un `TROP_VERSE`, dont le paquet ne dit pas le sort.
- **D-340-7 — Jamais un dû négatif (AC-2).** `aRegler ≥ 0` toujours ; tout excédent part dans `excedents`, avec son
  traitement et sa base quand le paquet les donne, et `TRAITEMENT_NON_DECLARE_AU_PAQUET` sinon.
- **D-340-8 — Ce qui ne se lit pas ne se déduit pas.** Un paquet illisible, une obligation absente du bloc, une imputation
  mal formée, un acompte sans payé : rien n'en est déduit, `complet: false`, et le manque est nommé. Le montant rendu est
  celui qui est prouvé ; `aRegler: null` seulement quand la référence manque.
- **D-340-9 — Chaque déduction dit d'où elle vient.** Les obligations et leurs payés (qui, quand), ou le champ de report
  et sa version ; le chemin de 329 de chacune ; la base légale citée mot pour mot (la citation d'une référence de 339,
  factorisée).
- **D-340-10 — Un module `reglement`.** Le dossier que D-L7-1 réserve à C ; il importe `ObligationsModule` (registres des
  obligations et des versions) et `PaquetsModule`, et exporte le service pour 341 et pour 565 (D). `ObligationsModule`
  n'importe rien de neuf.
- **D-340-11 — Hors périmètre, nommé.** (1) **Le solde d'IS** (LPF Art. 55 : « acquitté spontanément, au moment du dépôt de
  la déclaration de résultat ») : il n'a pas d'obligation à montant au catalogue (la DSF est déclarative) ; le moteur de
  balance-service le liquide déjà (`GET …/fiscal/liquidation` : max(IS ; MFP) − acomptes − crédits d'impôt), sur ses propres
  enregistrements d'acomptes et de crédits, distincts des payés des `IS_ACOMPTE` du fiscal : les relier est une story à
  placer (question au PO ci-dessous). (2) **L'IRPP de la personne** (`IRPP_DECLARATION`, déclarative) : l'imputation des
  retenues de l'employeur est le calcul de 564 (`irpp.retenueALaSource`), que 566 expliquera. (3) **Les crédits d'impôt et
  retenues subies attestés** (LPF Art. 99 : « attestations individuelles de retenues » que le bénéficiaire fait valoir sur
  ses cotisations) : aucune obligation à montant du catalogue ne les reçoit aujourd'hui ; les natures `CREDIT_IMPOT` et
  `RETENUE` sont prêtes, leur source (une attestation déclarée) viendra avec (1). (4) `TAF`, `TCA` : absentes du bloc,
  nommées `IMPUTATIONS_NON_DECLAREES_AU_PAQUET`. (5) L'ordre (341), le rapprochement (342), « déposée » / « payée » (343), les
  pénalités (344), l'écran (A).
- **D-340-12 — Question au PO, avec le choix par défaut.** Le solde d'IS et ses crédits d'impôt (D-340-11 (1)) : une
  obligation `IS_SOLDE` au catalogue (avec la DSF au réel), chiffrée par la liquidation du moteur, ses acomptes pris des
  payés du fiscal. **Défaut** : nommé ici, non codé au lot 7 ; à placer.

## Preuves attendues

Unitaires (Node 24, `-w 2`) : le calcul pur (référence, chaque source, chaque manque, l'excédent jamais négatif, le trop
versé, le déjà réglé d'une rectificative, l'ordre, la base légale), le service (portée, version scellée, obligations
sources, paquet illisible), la citation factorisée (les tests de 339 inchangés) ; balance-service : R13 (le paquet Togo la
passe, chaque faute refusée), l'artefact régénéré et réépinglé ; e2e (une TPU déposée nette de ses acomptes payés, un
acompte non payé nommé, l'excédent d'acomptes restitué ; une TVA en crédit : 0 à régler, le crédit à reporter en excédent ;
une rectificative : le complément ; hors portée 404) ; toute la suite du fiscal, celles de D comprises ; mutations sur la
logique neuve ; `docker compose up` du fiscal, sain (module neuf).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-27 | Fiche écrite, contrat et communs annoncés avant le code. |
