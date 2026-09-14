# STORY-503 : Le classement sain / en souffrance est DÉRIVÉ d'une date d'arrêté — jamais stocké

Status: in-progress

**Complexité :** high

**Épic :** EPIC-124 — Classement et provisionnement réglementaire
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-502** (l'échéancier) · **STORY-498** (le paquet prudentiel)
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-2** de la spine.

---

## Le fait

Le réflexe est de stocker un statut `SAIN` / `EN_SOUFFRANCE` sur le crédit et de le mettre à jour
par un batch nocturne. **C'est le mauvais modèle, et il ne se rattrape pas.**

⚡ **Un classement au 31/12 doit se recalculer à l'identique en mars, quand le commissaire aux
comptes le demande.** Un statut stocké et mis à jour ne se rejoue pas : il dit ce qu'il était la
dernière fois que le batch est passé, et personne ne peut prouver ce qu'il valait à la date
d'arrêté. Un contrôle demandera précisément qu'il se rejoue.

## Cadrage mesuré avant de coder (2026-09-14)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Les tranches d'ancienneté existent dans le paquet prudentiel | **FAUX** | `prudentiel-sfd-bceao@1.0` : `provisionnement.tranches: []` — amorce vide (D-498-A) |
| L'échéance la plus ancienne impayée et les jours de retard sont dérivés | **VRAI** | STORY-502 (AC-4), sur la seule version en vigueur (D-502-N) |
| Un crédit non décaissé a un retard | **FAUX** | D-502-P : l'échéancier naît du décaissement ; c'est un engagement hors bilan (AD-9) |

### Décision du 2026-09-14

- **D-503-A — MÉCANIQUE SEULE (décision user, doctrine D-498-A)** : `classer` est une fonction pure des jours de retard
  et du paquet ; faute de tranche, le classement rend `NON_CLASSABLE`, avec la version, le checksum du paquet et
  `valeursLivrees: false`. AC-2 est prouvé par un **paquet de test marqué fictif**, jamais servi ni embarqué : changer
  une borne change le classement. Aucune valeur prudentielle n'est écrite.
- Un crédit sans décaissement ou dont l'octroi est annulé n'est **pas** « sain » : il est nommé hors bilan.

### Hors périmètre, déclaré

Contagion par débiteur et crédits restructurés (STORY-505) · provisionnement (STORY-504) · valeurs BCEAO réelles.

## Critères d'acceptation

- [ ] AC-1 — `classer(creditId, dateArrete)` est une **fonction pure** de l'échéancier, des
      remboursements et du paquet prudentiel. Aucun état de classement en base.
- [ ] AC-2 — Les **tranches d'ancienneté** viennent du paquet prudentiel (STORY-498), jamais du
      code. ⛔ Test de mutation : changer une borne dans le paquet doit changer le classement — sinon
      la règle est ailleurs que là où on croit.
- [ ] AC-3 — Le classement rendu porte **sa date d'arrêté, la version du paquet et son checksum**.
      Un classement sans sa règle n'est pas vérifiable.
- [ ] AC-4 — Le classement d'une date passée est **rejouable** : deux appels à trois mois
      d'intervalle sur la même date d'arrêté rendent le même résultat. Test explicite.
- [ ] AC-5 — Performance : le classement de l'ensemble d'un portefeuille à une date donnée est
      calculable en une passe. ⚠️ Une IMF de taille moyenne porte plusieurs milliers de crédits ;
      une dérivation naïve par crédit ne tiendra pas l'arrêté.

## Progress Tracking

**Statut : `in-progress` (2026-09-14).** Branches `MNV-503` ouvertes sur `docs` (base `main`) et
`microfinance-service` (empilée sur la 502, rebasée sur `dev` après son merge). Décision D-503-A ci-dessus.
PR `microfinance-service` **#7** (un commit `7233685`, développé dans un worktree séparé pour ne pas perturber la
vérification docker de 502 en cours sur l'arbre monté).

### Développement — livré (sous-agent `opus`, rapport à vérifier en revue)

- `classerCredit` (fonction pure), règle de partition des tranches, service et routes
  `GET …/classement-credits?dateArrete=` (portefeuille) et `GET …/credits/:creditId/classement?dateArrete=`.
- Paquet de test **fictif** (`test/utils/paquet-prudentiel-fictif.ts`, taux à 0), hors `assets` et hors registre.
- Aucun état de classement en base (spec d'inventaire).

### Décisions prises pendant le dev (2026-09-14)

- **D-503-B — statuts** : `CLASSE` ; `NON_CLASSABLE` (motif `AUCUNE_TRANCHE_DANS_LE_PAQUET`, même pour un crédit à jour) ;
  `HORS_BILAN_NON_DECAISSE`, `OCTROI_ANNULE`, `NON_OCTROYE_A_LA_DATE` (paquet non consulté). Chaque résultat porte le
  paquet (code, version, checksum) et `valeursLivrees`.
- **D-503-C — partition des tranches** : depuis 0 jour, sans trou ni chevauchement, bornes incluses, dernière ouverte ;
  contrôlée au packaging (règle P2 du validateur) et à l'exécution, un test garantit l'accord des deux.
- **D-503-D — « une passe »** : trois lectures par page de 100 crédits au plus, nombre constant ; paquet chargé une
  fois par requête. Mesure indicative sur Mongo réel : 2 000 crédits en 20 pages, ≈ 1 s.
- **D-503-E** — `valeursLivrees` reprend la définition de la route du paquet (vrai dès une règle ou un seuil).
- **D-503-F** — la tranche est citée sans son taux (STORY-504) ; devise et exposant ajoutés au restant dû.
- **D-503-G** — le paquet est chargé avant le crédit : un paquet en erreur rend un 5xx sans rien révéler du crédit.
- ⚠️ Fixture de STORY-498 `TRANCHE_FICTIVE` ramenée à 0 jour (sinon la règle P2 la refuse).

### Portes (HEAD `7233685`, rejouées en session dans le worktree, en séquence)

Lint 0 · build OK · **2 099** unitaires / 107 suites (1 saut conditionnel préexistant), couverture
**99,75 / 96,94 / 99,53 / 99,78** · **314** e2e sur deux passages complets (46 sautés : suites Mongo sans URI) ·
**36/36** sur Mongo réel (`credits.mongo`, `depots.mongo`, `classement`).

### Revue de code (⑥) — aucun bloquant, trois correctifs appliqués d'office

- **[95] Deux noms pour le même concept dans le même contrat HTTP** : le classement publiait `joursDeRetard` et
  `echeanceLaPlusAncienneImpayee`, la situation et l'échéancier de 502 `joursRetard` et
  `echeanceImpayeeLaPlusAncienne`. ⚠️ L'écart venait **du brief de développement**, pas du dev. Aligné sur les noms de
  502, helper `retardPublie` réutilisé — gratuit avant merge, cassant après.
- **[85] `valeursLivrees` pouvait valoir `true` avec `NON_CLASSABLE / AUCUNE_TRANCHE_DANS_LE_PAQUET`** (définition de
  498 : vrai dès une règle ou un seuil) — contraire à D-503-A.
- **[95] Deux commentaires citaient une spec qui ne contient pas le test d'accord** — corrigés.
- Écartés avec preuve : 500 (et non 502) pour des tranches incohérentes, conforme à la table de 498 ; frontières
  testées de 0 à 10⁶ jours ; AC-4 prouvé en unitaire, HTTP et Mongo réel ; AC-5 en lots bornés conforme ; paquet
  fictif hors assets et manifeste ; fixture de 498 modifiée légitimement ; périmètre respecté.

### Décision du 2026-09-14 (après revue)

- **D-503-H — le classement publie `tranchesLivrees`** (vrai seulement si le paquet porte au moins une tranche), et non
  `valeursLivrees` : un même nom ne doit pas porter deux sens selon la route ; la route du paquet de 498 garde le sien.

### Revue de sécurité (⑦) — aucune vulnérabilité

Pistes écartées avec preuve : gardes de classe héritées par les deux routes ; portefeuille filtré org/dossier et
lectures `$in` bornées aux identifiants de la page ; `historique` et `lotDuPortefeuille` publics mais sans autre
entrée qu'un `DossierScope` issu de la garde, `CreditsService` non exporté ; paquet résolu par le référentiel du
dossier sans repli ; aucun oracle d'existence par le 5xx (règle chargée avant le crédit, dépendant du seul dossier) ;
injection NoSQL (DTO existants) ; corps du 500 générique, détail des tranches en journal seulement ; pagination
bornée, paquet servi par le cache du chargeur et jamais muté ; **le paquet fictif ne peut pas être chargé en
production** (aucun import de `test/` depuis `src`, `tsconfig.build` exclut `test`, assets limités aux deux JSON,
manifeste à une clé) ; checksum comparé au manifeste avant parse.

## Notes

- Voir [[STORY-502]], [[STORY-504]], [[STORY-505]], spine AD-2.
