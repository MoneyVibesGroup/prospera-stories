# STORY-504 : Provisionnement réglementaire par tranche — calculé, proposé, jamais appliqué d'office

Status: ready-for-dev

**Épic :** EPIC-124 — Classement et provisionnement réglementaire
**Service :** `microfinance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-503** (le classement dérivé)
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-4** de la spine — Q1 tranchée.

---

## ⚡ Le cœur du vertical

C'est ce qu'une IMF cherche dans les cinq premières minutes, et c'est le **seul endroit du programme
où l'absence est un risque réglementaire pour le client, pas un inconfort** : une IMF
sous-provisionnée est **en infraction**, pas en retard.

## Pourquoi « proposé » et non « appliqué »

Une dotation aux provisions est **une écriture**. La passer sans décision humaine ferait signer à
l'outil ce que la direction et le conseil arrêtent. C'est exactement la doctrine déjà appliquée à
l'**affectation du résultat** dans la reprise d'à-nouveaux — *« rien n'est proposé par défaut »* —
et à la **provision pour perte de change** (STORY-495 AC-4).

## Critères d'acceptation

- [ ] AC-1 — Pour une date d'arrêté : par crédit et par tranche, l'**assiette** (capital restant dû,
      éventuellement diminué des garanties admises), le **taux** du paquet, la **dotation** et la
      **reprise** par rapport à la provision déjà constatée.
- [ ] AC-2 — ⚡ **La dotation est un COMPLÉMENT, jamais un brut.** Une provision déjà constatée se
      déduit. C'est exactement l'erreur que le moteur fiscal a évitée sur le compte 891 (« écrire
      1 402 650 en brut aurait doublé la charge, et aucun contrôle d'équilibre ne s'en serait
      aperçu »). Ici le montant est bien plus gros.
- [ ] AC-3 — **Chaque montant porte sa formule** : assiette × taux, avec la tranche et sa borne. Un
      montant sans sa formule est un chiffre qu'il faut croire — même exigence que les écritures
      d'impôt.
- [ ] AC-4 — ⛔ **Dry-run par défaut.** L'écriture demande un acte explicite, et elle **empile une
      version** de balance : on n'écrase jamais, on ajoute. Même patron que « provisions à la
      balance » du moteur fiscal.
- [ ] AC-5 — Les **garanties admises en déduction** sont déclarées par le paquet prudentiel, jamais
      supposées. ⚠️ Déduire une garantie non admise **sous-provisionne** — c'est-à-dire produit
      exactement l'infraction que la story sert à éviter.
- [ ] AC-6 — Réappliquer un contenu identique **n'écrit rien** : l'opération se répète sans dégât.

## Notes

- Voir [[STORY-498]], [[STORY-503]], [[STORY-507]] (la publication en balance).
