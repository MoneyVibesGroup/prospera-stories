# STORY-528 : Les dotations rejoignent la balance, et la Note 3 cesse d'être restituée sans source

Status: ready-for-dev

**Épic :** EPIC-135 — Immobilisations et amortissements
**Service :** module `immobilisations` + `balance-service` + `bilan-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-527** (le plan d'amortissement)
**Origine :** §6.2 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

C'est la story qui **referme** le constat du cadrage du 16/08 : aujourd'hui `STORY-059` restitue les
colonnes **Brut / Amort / Net** et `STORY-062` les notes d'immobilisations, **à partir de soldes que
personne ne produit**. Une fois STORY-527 livrée, ces soldes ont enfin une source.

⚠️ **Et c'est le moment dangereux** : deux endroits porteront des amortissements — la balance
importée (Sage, cahiers, saisie) et le registre. **Il faut dire lequel fait foi**, sinon le produit
en aura deux qui divergeront en silence.

## Critères d'acceptation

- [ ] AC-1 — Les dotations calculées entrent en balance par le **même mécanisme que les provisions
      fiscales** : **dry-run par défaut**, écriture sur acte explicite, **nouvelle version** de
      balance — on n'écrase jamais, on empile.
- [ ] AC-2 — ⚡ **La dotation portée est un COMPLÉMENT, jamais un brut.** Une balance importée peut
      déjà porter des amortissements ; les écrire en brut les **doublerait**, et aucun contrôle
      d'équilibre ne s'en apercevrait. C'est exactement l'erreur évitée sur le compte 891 (« écrire
      1 402 650 en brut aurait doublé la charge »).
- [ ] AC-3 — ⛔ **Une confrontation registre ↔ balance est publiée** : compte par compte,
      l'amortissement du registre et celui de la balance, avec l'écart. Un écart n'est pas
      corrigé d'office — il est **montré**.
- [ ] AC-4 — La **Note 3** (tableau des immobilisations) est alimentée par le registre : valeurs
      brutes, entrées, sorties, amortissements cumulés, dotations, reprises. Elle cesse d'être une
      restitution sans source.
- [ ] AC-5 — Un dossier **sans registre** continue de fonctionner exactement comme aujourd'hui : les
      colonnes viennent de la balance importée, et l'écran dit d'où elles viennent. ⚠️ Non-régression
      obligatoire — la majorité des dossiers actuels sont dans ce cas.
- [ ] AC-6 — L'invariant `amortissements ≤ valeur brute` est vérifié **à la publication**, pas
      seulement au calcul.

## Notes

- Voir [[STORY-526]], [[STORY-527]], [[STORY-059]], [[STORY-062]], `cadrage-immobilisations-2026-08-16.md`.
