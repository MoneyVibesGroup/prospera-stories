# STORY-503 : Le classement sain / en souffrance est DÉRIVÉ d'une date d'arrêté — jamais stocké

Status: ready-for-dev

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

## Notes

- Voir [[STORY-502]], [[STORY-504]], [[STORY-505]], spine AD-2.
