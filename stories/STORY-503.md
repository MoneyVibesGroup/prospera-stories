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

## Notes

- Voir [[STORY-502]], [[STORY-504]], [[STORY-505]], spine AD-2.
