# STORY-504 : Provisionnement réglementaire par tranche — calculé, proposé, jamais appliqué d'office

Status: in-progress

**Complexité :** high

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

## Cadrage mesuré avant de coder (2026-09-14)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Les taux de provision par tranche existent | **FAUX** | `prudentiel-sfd-bceao@1.0` : aucune tranche, aucun taux (D-498-A) ; le classement rend `NON_CLASSABLE` (STORY-503) |
| Les garanties admises en déduction sont déclarées par le paquet | **FAUX** | le type `PaquetPrudentielPackage` n'a **aucune rubrique** de garanties admises |
| L'assiette (capital restant dû) est dérivée | **VRAI** | STORY-502 : encours = capital restant dû de la version en vigueur, à toute date |
| Une « version de balance » existe pour empiler la dotation | **FAUX** | la publication en balance est STORY-507, sans code |

### Décisions du 2026-09-14 (user)

- **D-504-A — MÉCANIQUE SEULE** : assiette, taux, provision requise, **dotation en complément** et reprise, chaque
  montant avec sa formule ; paquet servi vide ⇒ `409 PAQUET_PRUDENTIEL_SANS_VALEUR`, **aucune provision proposée sur une
  valeur inventée** ; tout est prouvé par un paquet de test fictif. La rubrique « garanties admises » est ajoutée au
  paquet, **vide**.
- **D-504-B — l'acte explicite d'application écrit un ARRÊTÉ DE PROVISION** append-only (`arretes_provision`), daté,
  attribué, avec formules et checksum du paquet ; dry-run par défaut ; la provision déjà constatée est celle du dernier
  arrêté appliqué ; un contenu identique n'écrit rien. La version de balance est un emplacement inerte (STORY-507).

### Hors périmètre, déclaré

Valeurs BCEAO réelles · écriture comptable et publication en balance (STORY-507) · reprise liée au rééchelonnement
(STORY-505).

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

## Progress Tracking

**Statut : `in-progress` (2026-09-14).** Branches `MNV-504` ouvertes sur `docs` (base `main`) et
`microfinance-service` (worktree empilé sur la 503, rebasé sur `dev` après son merge). Décisions D-504-A et B ci-dessus.

## Notes

- Voir [[STORY-498]], [[STORY-503]], [[STORY-507]] (la publication en balance).
