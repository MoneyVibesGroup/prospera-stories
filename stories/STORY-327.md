# STORY-327 : La continuité d'une période à l'autre — qu'un crédit de taxe ne disparaisse pas en route

Status: done — **livrée le 2026-11-26** : balance-service **#172** (`effdc4a` sur `dev`, le paquet) et
prospera-fiscal-service **#77** (`9db1653` sur `dev`) ; voir « Livraison ». Écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 8 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-031, STORY-327).

**Epic :** EPIC-031 · **Points :** 5 · **FR :** FR-F64 (continuité inter-périodes) · **Architecture :** AD-1 / AD-4 (le
fiscal compare, il ne calcule aucune taxe), AD-9 (la version scellée fait foi), AD-17 (le déclaré est un champ humain)
**Services :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas) ;
`balance-service` (la **source du paquet fiscal**, à C au lot 7, D-L7-3 ; aucune route ne change).
**Après :** STORY-326 (les contrôles de cohérence d'une période et leurs tolérances, fiscal #59), STORY-328 (le patron des
anomalies signalées), STORY-325 (les versions scellées, fiscal #75). **Suite :** STORY-329 (le chemin d'un montant,
l'historique complet).

## Histoire

En tant qu'**expert-comptable**, je veux que les reports d'une période à l'autre soient vérifiés, afin qu'un crédit de taxe
ne disparaisse pas en route. *(FR-F64)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-031)

1. **Étant donné** un crédit de taxe reporté **quand** la période suivante est préparée **alors** le report est repris et
   rapproché.
2. **Étant donné** un déficit reportable **quand** il est imputé **alors** l'imputation respecte les règles du paquet.
3. **Étant donné** une rupture de continuité **quand** elle est détectée **alors** une anomalie est levée en nommant les
   deux périodes concernées.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `7e2bff8`, balance `44be0c1`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Les contrôles d'une période (326) | `POST /obligations/{id}/coherence` et le contrôle à l'enregistrement du déclaré ; `juger` (écart ≤ max(absolue, relative × \|attendu\|)), tolérance lue au paquet (`coherence.tolerances`), `NON_EXECUTE` motivé ; anomalies `TVA_ECART_COMPTABILITE`, `ACOMPTE_ECART_RESULTAT_N1` signalées par `systeme:coherence`, retirées au retour dans la tolérance | `domain/obligations/coherence.ts`, `coherence-obligations.service.ts` |
| Le patron des anomalies (328) | code au `CATALOGUE` (`origine: SIGNALEE`, `bloque: ['A_DEPOSER']`, levable) ; `AnomaliesObligationsService.signaler / retirer` ; empreinte du fait (le même fait ne rouvre pas une levée) ; `409 ANOMALIE_BLOQUANTE` | `domain/obligations/anomalies.ts` |
| Les versions (325) | le dépôt scelle la version courante dans `versions_declaration` (jamais récrite) ; `RegistreVersionsDeclaration.deLObligation` (la plus récente d'abord) ; une rectificative ouvre la n + 1 **en préparation** : le déclaré de l'obligation peut alors différer de ce qui est parti | `version-declaration.ts`, `ports/registre-versions-declaration.ts` |
| La clôture (325) | `409 OBLIGATION_CLOTUREE` sur la liste fermée des routes d'écriture ; un signalement laisse une close telle quelle | `ecritures-des-obligations.ts` |
| Le moteur (balance) | la TVA chaîne son crédit **dans l'exercice** (`creditAnterieurImpute`, `creditRestant` par période, `creditAnterieurDeclare` à l'ouverture) ; le résultat fiscal impute les déficits **selon le paquet** (`resultatFiscal.reportDeficitaire` : 50 % du bénéfice, report sans limite de durée, Art. 101 CGI) et rend `totalDeficitsImputes` | `GET …/fiscal/tva`, `GET …/fiscal/resultat-fiscal` |
| Le paquet | `tva.declaration.reportCredit` (`REPORT_PERIODE_SUIVANTE`, A_CONFIRMER), `resultatFiscal.reportDeficitaire` | source `balance-service/scripts/referentiels/sources/` |

**Rien** ne relie encore deux périodes du fiscal : le déclaré ne porte ni le crédit reporté ni le déficit, et aucun contrôle
ne lit la période précédente.

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, plus **une précision de comportement** (le dépôt relance la continuité de la période suivante). Aucune
route neuve, aucun droit neuf, aucun événement, aucun code renommé ; manifeste `declarations` inchangé ; aucune route de
`balance-service` ne change.

### Le paquet porte ses reports (`balance-service`, source du paquet fiscal Togo 2026)

Bloc neuf **`continuite`** et une tolérance de plus dans **`coherence.tolerances`** :

```
"continuite": {
  "reports": [
    { "code": "CREDIT_TVA", "obligation": "TVA", "sortie": "creditAReporter", "entree": "creditAnterieur",
      "tolerance": { "absolue": 0 }, "regle": "tva.declaration.reportCredit", "source": "…" },
    { "code": "DEFICIT", "obligation": "DSF", "sortie": "deficitAReporter", "entree": "deficitAnterieur",
      "tolerance": { "absolue": 0 }, "regle": "resultatFiscal.reportDeficitaire", "source": "Art. 101 CGI …" }
  ],
  "source": "…"
},
"coherence": { "tolerances": { …, "DSF": { "absolue": 1000 } } }
```

Un report : la **sortie** est le champ du déclaré de la période précédente (lu dans sa dernière version déposée), l'**entrée**
celui de la période contrôlée qui doit le reprendre ; la tolérance suit la règle de 326. Le schéma `paquet-fiscal.schema.json`
le valide ; l'artefact se régénère par `build.mjs` ; empreinte au registre ; la surcouche zone franche en hérite. La copie
du fiscal (`test/fixtures/paquet-fiscal/`) suit. **→ B** : nouvelle empreinte du paquet (copie de `dossier-service`).

### Les reports déclarés — `POST /api/v1/obligations/{id}/reports-declares` (amendé avant la fusion, D-327-12)

> **Écart à l'annonce du 26/11 (#977), décidé au code, avant toute fusion** : les reports devaient passer par le corps de
> `…/montant-declare`. Or la DSF est une obligation **déclarative** (`famille: DECLARATIVE`) : elle ne porte pas de montant
> déclaré (`409 MONTANT_NON_SAISISSABLE`, 322), et ses déficits n'auraient eu aucune voie. Les reports ont donc **leur route
> et leur champ**, sur toute obligation ; `…/montant-declare` ne change pas.

Route neuve (droit `fiscalite:declaration:preparer`, rôles `TENANT_ADMIN` / `TENANT_USER`), corps `{ reports: {
creditAnterieur?, creditAReporter?, deficitAnterieur?, deficitImpute?, deficitAReporter? } }`, chacun entier ≥ 0 (unités de la
devise) ; ils **remplacent** les précédents, `{}` les efface. Permise de `EN_PREPARATION` à `A_DEPOSER` (sinon `409
REPORTS_NON_ENREGISTRABLES` : avant la prise en charge, ou figés depuis le dépôt — une correction est une rectificative) ;
`400` forme ; `403` ; `404 OBLIGATION_INTROUVABLE` ; `409 OBLIGATION_CLOTUREE` (route classée `ecrit-une-obligation` dans la
liste fermée de 325), `OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE`, `TRANSITION_CONCURRENTE`. Acte
**`OBLIGATION_REPORTS_DECLARES`** (`valeurs`, `precedentes` : des montants, aucun texte). Réponse `200` l'obligation, après le
contrôle de cohérence et de continuité (comme `…/montant-declare`). Champ neuf **`ObligationResponseDto.reportsDeclares`** `{
valeurs, par, le } | null` ; en base `reportsDeclares` (humain, `$setOnInsert: null`).

**La version scellée** (325) porte les reports dans **`contenu.reports`** **seulement s'ils sont déclarés** (aussi sans
déclaré : une DSF) : l'empreinte d'un contenu sans reports ne change pas (les versions déjà scellées et l'estampille de 330
gardent la leur). Les reports entrent dans la garde du scellement (une saisie concurrente fait échouer le dépôt).

### Les contrôles — `POST /api/v1/obligations/{id}/coherence` (route de 326, inchangée pour l'appelant)

La liste `controles` gagne trois codes (`code` : `TVA`, `IS_ACOMPTE`, **`DSF_DEFICIT_IMPUTE`**, **`CONTINUITE_CREDIT_TVA`**,
**`CONTINUITE_DEFICIT`**) et un champ facultatif **`periodePrecedente`** `{ obligationId | null, periode, version | null }`
(les contrôles de continuité seulement).

- **Continuité** (AC-1, AC-3), pour chaque report du paquet dont `obligation` est la taxe de l'obligation : `attendu` = la
  **sortie** dans la **dernière version déposée** de la période précédente (même dossier, redevable, implantation et taxe ;
  `AAAA-MM` → le mois d'avant, janvier → décembre de l'année d'avant ; `AAAA-Tn` → le trimestre d'avant ; `AAAA` → l'année
  d'avant) ; `declare` = l'**entrée** du déclaré de la période (absente ⇒ 0 : rien repris) ; `juger` de 326.
  `NON_EXECUTE`, motif nommé : `TOLERANCE_ABSENTE`, `PERIODE_PRECEDENTE_INDETERMINEE` (autre forme de période),
  `PERIODE_PRECEDENTE_ABSENTE`, `PERIODE_PRECEDENTE_NON_DEPOSEE` (aucune version scellée), `REPORT_PRECEDENT_NON_DECLARE`
  (la version déposée ne dit rien de ce report : jamais pris pour zéro), `DECLARE_ABSENT` — **avec l'attendu rendu** dès qu'il
  est lu : celui qui prépare la période voit ce qu'il doit reprendre.
- **Imputation des déficits** (AC-2), obligation `DSF` : `declare` = `reports.deficitImpute` ; `attendu` =
  `totalDeficitsImputes` du moteur, `GET {balance-service}/api/v1/dossiers/{dossierId}/fiscal/resultat-fiscal?exercice=`
  (ou les bornes de la balance de référence), qui applique `resultatFiscal.reportDeficitaire` du paquet ; tolérance
  `coherence.tolerances.DSF`. Motifs de `NON_EXECUTE` : ceux de 326 (moteur), `DECLARE_ABSENT` (pas d'imputation déclarée).
- **Anomalies** (patron de 328, `origine: SIGNALEE`, `BLOQUANTE`, `bloque: ['A_DEPOSER']`, levables) :
  **`CONTINUITE_CREDIT_TVA_ROMPUE`**, **`CONTINUITE_DEFICIT_ROMPUE`**, **`DEFICIT_IMPUTATION_ECART`** ; l'explication d'une
  rupture **nomme les deux périodes** ; `details` : `periodePrecedente`, `periode`, `obligationPrecedenteId`,
  `versionPrecedente`, `declare`, `attendu`, `ecart`, `tolerance`. Retirées au retour dans la tolérance ; un `NON_EXECUTE` ne
  signale ni ne retire rien.

### Précision de comportement — le dépôt relance la période suivante

`POST /obligations/{id}/transition` `vers: DEPOSEE` (le dépôt, et le redépôt après une rectificative) **relance les contrôles de
continuité de la période suivante**, si elle existe, active et non close : sa référence vient de changer. Sans moteur, sans
changer la réponse du dépôt ni son refus ; une panne est journalisée.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration** (un champ facultatif `reportsDeclares` sur `obligations` ; absent ⇒ `null`). Ni
`app.module.ts`, ni `package.json`, ni `read-models/`, ni manifeste `declarations`. Touchés parmi les communs : **le contrat
OpenAPI** (un champ du corps, deux champs de réponse, trois codes) et **la copie du paquet fiscal**
(`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, recopiée à l'octet, LF, de l'artefact de `balance-service`). Tout
le reste dans les dossiers de C (`domain/obligations`, `application/obligations`, `modules/obligations`, `adapters/mongo` et
`adapters/http` du moteur, `ports/`, `test/utils`, e2e et conformité des obligations). **Rien dans les dossiers de D.**

## Décisions (D-327-n) — prises le 2026-11-26, contestables

- **D-327-1 — La période précédente se lit dans sa dernière version déposée, jamais dans l'obligation.** Une rectificative
  ouverte (325) remet l'obligation en préparation : son déclaré peut dire autre chose que ce qui est parti. La référence est la
  version scellée la plus récente ; sans version (rien déposé, ou une déposée avant 325, D-325-6), le contrôle ne s'exécute pas
  et le dit (`PERIODE_PRECEDENTE_NON_DEPOSEE`).
- **D-327-2 — Le déclaré porte ses reports.** Cinq champs facultatifs (`creditAnterieur`, `creditAReporter`,
  `deficitAnterieur`, `deficitImpute`, `deficitAReporter`) : les lignes du formulaire de TVA (« crédit du mois précédent »,
  « crédit à reporter ») et de la DSF (déficits antérieurs, imputés, à reporter). Acceptés sur toute obligation ; seuls ceux que
  le paquet relie sont contrôlés. Ils entrent dans le contenu scellé **seulement déclarés** : aucune empreinte existante ne
  bouge.
- **D-327-3 — Les reports contrôlés viennent du paquet (NFR-A06).** `continuite.reports[]` dit quelle obligation, quel champ
  sort, quel champ entre, et la tolérance ; ajouter un report = une entrée du paquet. Les **codes** restent une liste fermée du
  service (`CREDIT_TVA`, `DEFICIT`) parce que chacun a son anomalie et son texte ; une entrée de code inconnu, ou dont un champ
  n'est pas l'un des cinq, est ignorée et journalisée (jamais un contrôle deviné).
- **D-327-4 — Tolérance de continuité : 0.** Un report se recopie d'une déclaration à la suivante, il ne se recalcule pas :
  `absolue: 0` (`juger` admet l'égalité et rien d'autre ; la tolérance vient quand même du paquet, AC-2 de 326). Valeur de
  travail, à confirmer par un fiscaliste ; modifiable sans code.
- **D-327-5 — Un report absent de la période vaut « rien repris » ; absent de la précédente, il n'est pas zéro.** Ne pas
  remplir la ligne du crédit antérieur, c'est ne rien reprendre — précisément la disparition que la story veut voir. Mais une
  version déposée qui ne dit rien du crédit à reporter ne dit pas « zéro » : `REPORT_PRECEDENT_NON_DECLARE`.
- **D-327-6 — La période précédente** : même dossier, redevable, implantation et taxe ; `AAAA-MM`, `AAAA-Tn`, `AAAA` ; une autre
  forme (`AAAA-Pk`, `AAAA-En`) n'a pas de précédente définie (`PERIODE_PRECEDENTE_INDETERMINEE`). Une précédente écartée
  compte comme absente ; un changement de périodicité (mensuelle → trimestrielle) se lit `PERIODE_PRECEDENTE_ABSENTE`.
- **D-327-7 — L'imputation des déficits est celle du moteur (AD-1).** Le fiscal ne recalcule ni le plafond de 50 % ni le stock :
  il rapproche l'imputation déclarée de `totalDeficitsImputes`, que le moteur tire du paquet. Symétrique : une imputation
  moindre que celle du moteur est un écart (le moteur impute au plafond), levable en motivant. Tolérance `coherence.tolerances.DSF`
  (1 000 F, valeur de travail des arrondis, comme D-326-2).
- **D-327-8 — Quand.** À l'enregistrement du déclaré et sur demande (comme 326), **et au dépôt de la période précédente**
  (sa référence change : un crédit rectifié en amont rompt la continuité en aval). Le dépôt relance la seule continuité de la
  suivante (pas le moteur), sans changer sa réponse ; une panne est journalisée. Une voie qui déposerait sans
  `POST …/transition` ne relance rien (nommé).
- **D-327-9 — « Repris » veut dire rendu, pas écrit.** Le contrôle rend le report de la période précédente (`attendu`,
  `periodePrecedente`) même sans déclaré : celui qui prépare le reprend. Rien n'écrit le déclaré à sa place (champ humain,
  AD-17).
- **D-327-10 — Les anomalies.** Une par report (`CONTINUITE_CREDIT_TVA_ROMPUE`, `CONTINUITE_DEFICIT_ROMPUE`) et une pour
  l'imputation (`DEFICIT_IMPUTATION_ECART`), bloquantes au dépôt de la période contrôlée, levables. Empreinte :
  `code | déclaré | attendu | obligationPrécédente@numéro` — redéposer la précédente rectifiée est un fait neuf qui rouvre une
  levée.
- **D-327-12 — Les reports ont leur route (écart à l'annonce, avant la fusion).** La DSF, déclarative, n'a pas de montant
  déclaré : des reports rangés dans `montantDeclare` lui auraient été inaccessibles. `POST …/reports-declares` et le champ
  `reportsDeclares`, sur toute obligation ; la période est « déclarée » pour la continuité dès qu'elle porte un déclaré ou des
  reports. Le contenu scellé les porte à sa racine (`contenu.reports`). Les reports ne rendent pas périmée la pièce du client
  (324 compare le déclaré) : nommé.
- **D-327-11 — Hors périmètre, nommé.** TAF, TCA, RSH (aucun report) ; l'excédent d'acompte d'IS ou de TPU reporté ; le
  remboursement d'un crédit de TVA ; la cohérence des reports avec le moteur (`creditRestant`) ; l'écran (A) ; tout événement.

## Preuves attendues

Unitaires (`-w 2`, Node 24) du domaine (période précédente et suivante, lecture des reports du paquet, jugement de continuité,
contenu scellé et empreinte inchangée sans reports) et du service (chaque `NON_EXECUTE`, la version la plus récente lue et non
l'obligation rectifiée, l'anomalie qui nomme les deux périodes, le retrait, l'imputation face au moteur, le dépôt qui relance
la suivante) ; contrat du moteur (`totalDeficitsImputes`) ; `test:conformite` sur MongoDB (les reports enregistrés, scellés et
relus) ; e2e (TVA : un crédit reporté, la période suivante qui l'oublie, l'anomalie, le dépôt refusé, la levée ; la
précédente rectifiée et redéposée qui rompt la continuité de la suivante ; DSF : l'imputation face au moteur) ; toute la suite
du fiscal, celles de D comprises ; balance-service : schéma, registre, e2e du référentiel ; mutations sur la logique neuve ;
`docker compose up` du fiscal et de balance, sain.

## Livraison (2026-11-26)

- **Dépôts** : `balance-service` `MNV-327` → `dev` (**#172**, `effdc4a`) : le paquet (source, schéma, artefact, empreinte
  **`412770f5e3ba139435b33ed89c83c5e8185c10d0fc9ea62d324d09906b845fd6`** au registre, « vingt et unième fois ») ;
  `prospera-fiscal-service` `MNV-327` → `dev` (**#77**, `bd19a48` et `9db1653`, rebasée sur `7d48fd9`, STORY-330 de D, sans
  conflit). Fichiers du fiscal : `domain/obligations/continuite.ts` (périodes précédente et suivante, reports du paquet,
  forme des reports, état où ils s'enregistrent, fait audité), `coherence.ts` (trois codes, `periodePrecedente`,
  `cleDeTolerance`), `version-declaration.ts` (`contenu.reports`, empreinte, garde), `anomalies.ts` (trois codes),
  `calcul-delegue.ts` (la DSF n'est pas chiffrée par le moteur), `coherence-obligations.service.ts` (la continuité,
  l'imputation, `apresDepot`), `triplet-obligations.service.ts` (`declarerReports`), le port et l'adaptateur du moteur
  (`deficitsImputes`), le registre (port, Mongo, mémoire : `enregistrerReports`, `reportsDeclares`), le contrôleur (route
  neuve, relance au dépôt), les DTO ; la route classée dans `test/utils/ecritures-des-obligations.ts` ; copie du paquet.
- **Écart à l'annonce** (#977), amendé **avant la fusion** (#983) : D-327-12 — les reports ont leur route et leur champ
  (`POST …/reports-declares`, `reportsDeclares`, `contenu.reports`) au lieu du corps de `…/montant-declare` : la DSF est
  déclarative, sans montant. Aucune autre décision n'a changé.
- **Preuves** (Node 24, étage `verification`, archive LF de `c2733df`) : fiscal unitaires 232 suites, **3413** tests (une
  suite chronométrée de STORY-537, `balayage-lineaire.spec.ts`, rouge sous la charge, **26/26 seule** en Node 24) ; e2e
  **14/14, 329** (4 neufs : la reprise, la rupture qui nomme les deux périodes, le dépôt refusé, la levée ; la précédente
  rectifiée et redéposée qui rompt la suivante, ses deux versions scellées ; la forme et l'état des reports ; la DSF face au
  moteur) ; conformité **27/27, 173** (MongoDB en jeu de répliques ; neuve : `test/continuite.conformite-spec.ts`, 6 tests) ;
  `nest build` vert ; balance-service unitaires **300/300 suites, 5768** ; e2e **38/38, 2324**. **Mutations** : 34/34 en
  local (domaine, services, contrôleur, catalogue, contrat du moteur ; 4 réécrites qui rougissaient par compilation, 2
  survivantes tuées par deux tests ajoutés : une suivante close, une DSF déclarée par ses seuls reports) et **6/6 sur MongoDB
  réel** (comparaison-échange, relecture, précédentes, transaction, valeurs, `$setOnInsert`). **Pile `grp-c`** fiscal +
  balance (`MNV-327`) saine : santé `ok` des deux, `reports-declares`, `coherence`, `transition` et `…/fiscal/resultat-fiscal`
  en `401` sans jeton, paquet servi `412770f5…`, aucune erreur d'injection, aucun redémarrage. Verrou Docker pris deux fois
  (13:03 → 13:21, 13:21 → 13:23).
- **Tests touchés** : les contrôles de 326 (unitaires et e2e) lisent désormais aussi la continuité : ils filtrent le code
  `TVA` ; « sans contrôle applicable » exclut la DSF ; le catalogue épinglé des anomalies et les faits de la porte gagnent
  trois codes ; la forme figée de la dérivation (`reportsDeclares: null` en `$setOnInsert`). **Aucun fichier de D.**
- **→ B** : nouvelle empreinte du paquet à recopier dans `dossier-service` (message envoyé). **D prévenu** (message).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-26 | Fiche écrite, contrat et communs annoncés avant le code (#977). |
| 2026-11-26 | Amendement avant la fusion : les reports ont leur route (D-327-12, #983). |
| 2026-11-26 | **DONE.** Code : balance-service #172 (`effdc4a`), fiscal #77 (`9db1653`). Preuves : voir « Livraison ». B et D prévenus. |
