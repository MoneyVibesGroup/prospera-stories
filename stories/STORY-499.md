# STORY-499 : Membres et parts sociales — le sociétaire d'une mutuelle n'est pas un client

Status: ready-for-dev

**Épic :** EPIC-122 — Membres et comptes de dépôts
**Service :** `microfinance-service`
**Points :** 5 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Dans une mutuelle d'épargne et de crédit, celui qui emprunte est **sociétaire**, pas client. La
distinction n'est pas de vocabulaire : elle porte **le capital social**. Les parts sociales
souscrites alimentent les fonds propres de l'institution, et leur remboursement les diminue.

⚡ Et c'est exactement là que le piège du référentiel se referme : en RCSFD, **`57` est le capital
social**, quand `57` est la Caisse en SYSCOHADA. Un module qui rangerait des parts sociales au
« 57 » d'un plan SYSCOHADA les présenterait en **disponibilités**.

## Critères d'acceptation

- [ ] AC-1 — Un membre : identité, date d'adhésion, statut (actif, radié, décédé), rattachement à
      une **agence**. Le membre appartient à un **dossier** (AD-6).
- [ ] AC-2 — Les **parts sociales** sont des **mouvements** (souscription, remboursement,
      annulation), jamais un solde qu'on édite — AD-1 appliqué au capital.
- [ ] AC-3 — Un membre radié ou décédé **conserve son historique** : ses crédits et ses dépôts
      restent lisibles et comptables. Une IMF ne supprime pas un membre, elle le clôt.
- [ ] AC-4 — L'unicité d'un membre est portée par un identifiant **du dossier**, pas global : deux
      IMF différentes peuvent avoir un membre du même nom, et ce ne sont pas les mêmes.
- [ ] AC-5 — ⚠️ **Aucun rattachement de compte codé ici** : le compte SYSCOHADA/RCSFD d'une part
      sociale vient du **référentiel du dossier** (AD-8), comme partout ailleurs.

## Notes

- Voir [[STORY-497]] (socle), [[STORY-422]] (44 racines communes divergentes).
