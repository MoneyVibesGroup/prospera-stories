# STORY-502 : L'échéancier — la pièce contre laquelle le retard se calcule

Status: in-progress

**Complexité :** high

**Épic :** EPIC-123 — Portefeuille de crédits
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

**Le retard ne se calcule pas contre une date de fin, il se calcule contre un échéancier.** Un
crédit à 12 échéances mensuelles dont la 3ᵉ n'est pas payée est en retard **dès le 4ᵉ mois**, même
si sa date de fin est dans neuf mois. Sans échéancier, le classement (STORY-503) n'a rien à
interroger, et le provisionnement (STORY-504) n'a pas d'assiette.

C'est pour cela que l'échéancier est une story à part, avant le classement : **c'est la pièce
maîtresse du portefeuille**, pas un détail de présentation.

## Cadrage (2026-09-14)

Base : le module `credits` de STORY-501 (crédit à conditions immuables, événements append-only, situation dérivée).

### Décisions du 2026-09-14 (user, recueillies pendant le dev de STORY-501)

- **D-502-A — le mode d'amortissement est porté par le CRÉDIT**, obligatoire, sans défaut :
  `ANNUITES_CONSTANTES`, `AMORTISSEMENT_CONSTANT` ou `IN_FINE`.
- **D-502-B — l'intérêt d'une échéance se calcule au TAUX PÉRIODIQUE** (taux annuel ÷ nombre de périodes par
  an) sur le capital restant dû contractuel. La base 360/365 du crédit ne sert pas à l'échéancier.
- **D-502-C — le différé est PARTIEL** : les échéances du différé ne portent que les intérêts, le capital
  s'amortit sur les périodes restantes.
- **D-502-D — l'ordre d'imputation est une condition obligatoire et figée du PRODUIT**
  (`INTERETS_PUIS_CAPITAL` ou `CAPITAL_PUIS_INTERETS`), **copiée dans le crédit à l'octroi**. Pénalités :
  emplacement inerte. Un remboursement anticipé s'impute sur les échéances suivantes **sans recalcul** — le
  recalcul est un rééchelonnement.
- ⚡ **Conséquence sur D-501-C** : la ventilation saisie d'un remboursement est **remplacée** par l'imputation
  déclarée ; aucun contrat n'était publié.

### Hors périmètre, déclaré

Marqueur permanent et compteur de rééchelonnements, contagion (STORY-505) · classement (STORY-503) ·
pénalités de retard · publication en balance (STORY-507).

## Critères d'acceptation

- [ ] AC-1 — L'échéancier est **généré à l'octroi** depuis (montant, taux, durée, périodicité,
      différé), et **figé** : c'est le contrat. Il porte, par échéance, le capital, l'intérêt et le
      total dus, et leur date.
- [ ] AC-2 — Un remboursement s'**impute** sur les échéances selon un ordre **déclaré et non
      supposé** (intérêts, puis capital, puis pénalités — ou l'ordre que le produit de crédit
      déclare). ⚠️ L'ordre change le capital restant dû, donc le provisionnement : le laisser
      implicite rend deux IMF incomparables.
- [ ] AC-3 — Un **rééchelonnement** produit un **nouvel échéancier** et conserve l'ancien. Écraser
      l'échéancier d'origine effacerait la preuve du retard qui l'a motivé.
- [ ] AC-4 — L'**échéance la plus ancienne impayée** et le **nombre de jours de retard** sont
      dérivés à une date d'arrêté, et publiés. C'est l'unique entrée de STORY-503.
- [ ] AC-5 — Un remboursement **anticipé** et un remboursement **partiel** sont tous deux
      exprimables, et se distinguent dans la dérivation.

## Progress Tracking

**Statut : `in-progress` (2026-09-14).** Branches `MNV-502` ouvertes sur `docs` (base `main`) et
`microfinance-service` (base `dev`, qui contient STORY-501). Décisions D-502-A → D-502-D consignées ci-dessus.
PR `microfinance-service` **#6**.

### Développement — livré (sous-agent `opus`, rapport à vérifier en revue)

- Échéancier **généré et persisté à l'octroi** dans `echeanciers_credit` (append-only, index
  `unicite_version_echeancier_par_credit`), écrit dans la même transaction que le crédit ; fonctions pures de
  génération et d'imputation. Remboursement à montant unique imputé ; rééchelonnement versionné ; route
  `GET …/credits/:creditId/echeancier?dateArrete=` et `POST …/reechelonnements`.

### Décisions prises pendant le dev (2026-09-14)

- **D-502-E** — l'excédent d'un remboursement paie les échéances suivantes **en entier, intérêts compris**, dans
  l'ordre du produit ; refus au-delà de tout le restant dû. ⚠️ Écart au brief (qui proposait « capital restant +
  intérêts échus ») : sinon un emprunteur soldant son capital par avance paraîtrait en retard sur des intérêts
  futurs — soumis à la revue.
- **D-502-F** — taux périodique = points de base × mois de la période / 120 000 ; `A_ECHEANCE` = taux × durée
  en années.
- **D-502-G** — durée multiple du pas de périodicité, sinon `400 DUREE_INCOMPATIBLE_AVEC_PERIODICITE`.
- **D-502-H** — arrondi demi-unité vers le haut, une fois par intérêt et pour l'annuité ; capital constant en
  partie entière ; la dernière échéance absorbe l'écart ; capital d'annuité borné au restant dû.
- **D-502-I** — l'échéancier porte sur le montant **octroyé**, première échéance à l'octroi + 1 pas, même en
  décaissement partiel — soumis à la revue (effet sur 503/504).
- **D-502-J** — le jour est l'unité ; les flux d'un même jour se compensent.
- **D-502-K** — une annulation de remboursement retire les derniers montants imputés, à sa date.
- **D-502-L** — une échéance est échue dès son jour ; jours de retard = arrêté − échéance (0 le jour même).
- **D-502-M** — rééchelonnement au début, à une échéance ou après la dernière de la version en vigueur ; base
  capital restant dû > 0 sans intérêt payé d'avance ; intérêts échus impayés reportés sur la première échéance ;
  consolidation (aucun mouvement ni annulation antérieurs ensuite) ; non annulable.
- **D-502-N** — statut `REMPLACEE` ; le retard ne se lit que sur la version en vigueur.
- **D-502-O** — remboursement à montant unique, capital et intérêts dérivés (remplace D-501-C).

### Revue de code (⑥) — deux bloquants, un non bloquant (vérifiés en exécutant les fonctions pures)

- **[bloquant, 95] Un crédit dont l'octroi est annulé restait publié EN RETARD** : octroi annulé, rien décaissé ⇒
  à l'arrêté 149 jours de retard, échéance n°1 impayée, 1 000 000 de capital restant dû. STORY-503 aurait classé
  en souffrance un crédit qui n'a jamais existé.
- **[bloquant, 90] D-502-I contredisait l'invariant « capital remboursé ≤ décaissé »** : l'échéancier exigeait un
  capital qu'on ne pouvait pas rembourser. Décaissement partiel de 500 000 sur 1 000 000 payé ponctuellement ⇒
  échéance 7 refusée, 152 jours de retard au 31/12, deux assiettes divergentes (encours ≠ capital restant dû).
- **[95] La garde « somme du capital = montant » ne gardait rien en annuités** : le plafonnement au restant dû
  rattrapait l'écart par hasard sur les jeux de test.
- **D-502-E validée** par la revue (seule lecture cohérente avec « sans recalcul »).

### Décisions user du 2026-09-14 (après la revue)

- **D-502-P — l'échéancier NAÎT DU DÉCAISSEMENT (remplace D-502-I)** : aucun échéancier ni retard sans
  décaissement ; version 1 au premier décaissement, sur le décaissé, date de fin fixée à ce moment ; chaque tranche
  suivante écrit une nouvelle version sur le capital restant dû, même date de fin ; tranche en cours de période
  refusée (prorata inerte).
- **D-502-E confirmée** : un remboursement anticipé paie les échéances suivantes en entier ; réduire les intérêts
  passe par un rééchelonnement explicite.

### Correctifs de revue (commits `0e88b37`, `cb492ea`) et décisions qui en découlent

- **D-502-P appliquée** : l'octroi n'écrit plus d'échéancier ; version 1 au premier décaissement ; chaque tranche
  écrit une nouvelle version sur le capital restant dû + la tranche, dont les dates sont les **dates d'échéance
  restantes recopiées** de la version en vigueur (la date de fin ne bouge pas) ; différé = différé en vigueur moins
  les échéances échues ; intérêts échus impayés reportés.
- **D-502-Q — un décaissement ne s'annule plus** (`409 ANNULATION_DECAISSEMENT_CONSOLIDE`) : sous D-502-P, chaque
  décaissement a fixé une version. ⚠️ **Retire l'annulation de tranche livrée en STORY-501** ; un crédit décaissé ne
  peut plus voir son octroi annulé. Correction d'un décaissement erroné = emplacement inerte
  `CORRECTION_D_UN_DECAISSEMENT`.
- **D-502-R** — une tranche est refusée avant le dernier mouvement, en cours de période, à ou après la date de fin,
  ou après des intérêts payés par anticipation (quatre codes typés).
- **D-502-S** — toute version de rang ≥ 2 (tranche ou rééchelonnement) **consolide** ce qui la précède
  (`MOUVEMENT_CONSOLIDE_PAR_UNE_VERSION`) ; la version 1 ne consolide rien.
- Rééchelonnement sans décaissement ⇒ `409 REECHELONNEMENT_SANS_DECAISSEMENT`.
- Preuves : C1 (octroi annulé ou jamais décaissé ⇒ 0 jour, aucune échéance), C2 (décaissement tardif sans retard
  avant la 1re échéance ; partiel payé ponctuellement : 12 échéances sans refus, 0 jour ; **encours = capital restant
  dû à toute date**, unitaire + e2e + Mongo réel), C3 (cinq jeux d'annuités où la mutation rougit).
- ⚠️ Codes devenus inatteignables par l'API, gardés en défense : `CAPITAL_REMBOURSE_SUPERIEUR_AU_DECAISSE`,
  `ANNULATION_OCTROI_ANTERIEURE_A_UN_MOUVEMENT`.
- ⚠️ Flake e2e : un `404` sur `POST produits-credit` une fois pendant un passage complet, non reproduit — même profil
  que l'échec non reproduit de STORY-501 ; cause recherchée en revue ciblée.

### Revue ciblée des correctifs — C1, C2, C3 fermés ; un nouveau bloquant

- Vérifié en exécutant les règles réelles : octroi annulé ⇒ 0 jour ; partiel payé ponctuellement ⇒ aucun refus,
  encours = capital restant dû chaque jour sur 16 mois ; cumul de 5 versions (tranches, rééchelonnement, annulation)
  cohérent ; annuités exactes sur quatre jeux dont des montants de 7 et 123 457.
- **[bloquant, 95] Une tranche, même d'UNE unité, effaçait le retard** : 900 000 décaissés, aucun paiement, 150 jours
  de retard ; tranche de 1 ⇒ le lendemain **0 jour** — la nouvelle version réamortissait les arriérés. Rééchelonnement
  déguisé, sans motif ni marqueur : un crédit non entièrement décaissé restait « sain » indéfiniment.
- **[90] Le paiement du jour, saisi après la tranche du même jour, était refusé** par la consolidation.
- **[95] `ANNULATION_OCTROI_ANTERIEURE_A_UN_MOUVEMENT` inatteignable**, testé sur des données impossibles.

### ⚠️ Vérification docker (premier passage, HEAD `cb492ea`) — onze points prouvés, UN ÉCHEC

Code servi prouvé (démarrage après la dernière modification, md5 disque = conteneur, marqueurs sur le port, idem
après redémarrage). Montants attendus calculés AVANT les appels par un calcul indépendant en fractions exactes.

| Point | Verdict |
|---|---|
| **P1** `echeanciers_credit` + index de version ; octroi ⇒ **aucune version** | PROUVÉ |
| **P2** trois modes + différé : dates, capital, intérêt, total = calcul indépendant ; somme du capital exacte | PROUVÉ |
| **P3** ordres d'imputation opposés ⇒ 965 000 / 950 000 conformes ; anticipé et partiel distingués | PROUVÉ |
| **P4** retard 0 / 0 / 1 / 49 aux frontières ; jamais décaissé et octroi annulé ⇒ 0 jour | PROUVÉ |
| **P5** partiel payé ponctuellement : 0 jour ; encours = capital restant dû = `mongosh` à trois dates | PROUVÉ |
| **P6** tranche en cours de période ⇒ 409 ; tranche à échéance ⇒ v2 conforme, **v1 identique à l'octet** ; décaissement non annulable | PROUVÉ |
| **P7** rééchelonnement : v2 conforme, v1 intacte, mouvement antidaté ⇒ 409 consolidé, sans décaissement ⇒ 409 | PROUVÉ |
| **P8** rejeu au 30/04 : diff vide après écritures ultérieures et après redémarrage (premier passage invalidé par une écriture du harnais datée avant l'arrêté, rejoué) | PROUVÉ |
| **P9** remboursements concurrents ⇒ `[201, 409]` × 5 | PROUVÉ |
| **P9** ⛔ **deux rééchelonnements à la même date ⇒ `[201, 201]`**, simultanés **ou successifs** : deux versions identiques | **ÉCHEC** |
| **P10** portée ⇒ 404 au corps de l'inexistant ; dossier d'entreprise ⇒ 409 | PROUVÉ |
| **P11** exercice clos ⇒ 409, rien écrit ; réouvert ⇒ 201 | PROUVÉ |
| **P12** 30 versions : 0 orpheline, contiguës, `mouvementId` cohérent ; aucune 5xx sur 199 appels ; journaux sans motif | PROUVÉ |

⛔ **P9 n'était pas une course** : D-502-M admet un rééchelonnement « au début de la version en vigueur », et la v2
débute précisément à cette date — un double clic créait deux rééchelonnements que STORY-505 compterait.

### Décisions du 2026-09-14 (seconde vague)

- **D-502-T — une tranche est refusée tant qu'une échéance échue reste impayée (décision user)**
  (`DECAISSEMENT_SUR_ECHEANCE_IMPAYEE`), celle du jour comprise. Pour débloquer un crédit en retard : régulariser ou
  rééchelonner explicitement. Ferme aussi le refus du paiement du jour saisi après la tranche.
- **D-502-U — une nouvelle version de rang ≥ 2 est datée STRICTEMENT après le début de la version en vigueur**
  (correctif du défaut P9).
- Code mort `ANNULATION_OCTROI_ANTERIEURE_A_UN_MOUVEMENT` retiré ; `CAPITAL_REMBOURSE_SUPERIEUR_AU_DECAISSE` gardé en
  défense en profondeur.

### ⚡ Flake e2e — cause établie

Les deux échecs e2e non reproduits (STORY-501, puis un `404` sur `POST produits-credit` en 502) viennent du
**transport de test**, pas du service : `app.init()` sans écoute ⇒ supertest ouvre `listen(0)` sur `::` à **chaque
requête** puis appelle `127.0.0.1:<port>`. Sous macOS les ports IPv4 et IPv6 sont comptés séparément : le port tiré
peut être tenu en IPv4 seul par un autre processus (mesuré : deux écouteurs VS Code répondant 404 et 401 sur l'URL
exacte) ⇒ la requête part chez lui. Mécanisme reproduit par script. C'est celui de STORY-630 (bilan-service), dont le
correctif `ecouterPourSupertest` **n'avait jamais été porté** ici : helper `test/utils/serveur-e2e.ts` (écoute unique
sur `127.0.0.1`) appliqué à tous les montages et au JWKS de test.

### Revue de sécurité (⑦) — aucune vulnérabilité

Pistes écartées avec preuve : IDOR sur échéanciers et rééchelonnement (filtres org/dossier/membre/crédit, verrou
identique), 404 jamais 403, `version` et statut jamais lus du corps, concurrence (verrou en première écriture + index
`(creditId, version)`), contournement de la consolidation par annulation ou mouvement antidaté, exercice clos à la
date du rééchelonnement, débordement (pire cas 3·10¹³ < 2⁵³), coût BigInt négligeable, aucune journalisation du motif.

## Notes

- Voir [[STORY-501]], [[STORY-503]], [[STORY-505]] (rééchelonnements et contagion).
