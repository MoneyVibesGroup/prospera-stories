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
PR `microfinance-service` **#8** (un commit `a84951c`, rebasé sur `dev`).

### Développement — livré (sous-agent `opus`, rapport à vérifier en revue)

- `GET …/provisionnement?dateArrete=` (dry-run) : par crédit, assiette, taux, provision requise, dotation ou reprise,
  formule ; sous-totaux par tranche ; crédits non provisionnés comptés par statut ; empreinte de la proposition.
- `POST …/arretes-provision` `{ dateArrete, empreinte }` : l'acte explicite écrit un arrêté dans `arretes_provision`
  (201) ou répond `dejaApplique` (200) pour un contenu identique.
- Paquet prudentiel : rubrique `provisionnement.garantiesAdmises: []` ajoutée **vide** (schéma, validateur, chargeur,
  types) ; checksum `a4d29eb5…` → `b4b79e8a…` ; `sfd-bceao-2.0` inchangé.

### Décisions prises pendant le dev (2026-09-14)

- **D-504-C** — paquet servi sans tranche ⇒ `409 PAQUET_PRUDENTIEL_SANS_VALEUR` avant toute lecture de crédit ; taux ou
  garantie illisible ⇒ 500 journalisée.
- **D-504-D** — une garantie admise par type (règle P3), déduite à la quotité du paquet ; un nantissement dont le
  blocage est levé à l'arrêté n'est pas déduit.
- **D-504-E** — calcul exact en BigInt, **un seul arrondi par ligne, par excès** (prudence) ; totaux = sommes de lignes ;
  dépassement des entiers sûrs ⇒ `409 PROVISIONNEMENT_HORS_BORNE`.
- **D-504-F** — empreinte = sha256 du contenu canonique hors provision déjà constatée, dotation, reprise et formule ;
  empreinte périmée ⇒ `409 PROPOSITION_PROVISION_PERIMEE`.
- **D-504-G** — provision déjà constatée = provision requise au dernier arrêté ; date antérieure au dernier arrêté ⇒ 409.
- **D-504-H** — rang par dossier sous index unique ; le perdant d'une course relit le gagnant (`dejaApplique` ou 409).
- **D-504-I** — un crédit non classé donne une ligne **sans** provision, jamais une provision à 0.
- **D-504-J** — l'arrêté est la seule exemption, fermée, du contrôle « aucun état de classement stocké » de 503.
- Réserves avouées : ≈ 21 000 crédits au plus par arrêté (limite de document) ; pas de route de lecture des arrêtés ;
  dotations écrites ≠ revues si un arrêté intervient entre la revue et l'acte ; mainlevée suivie pour le seul
  nantissement ; une devise divergente bloque la proposition.

### Portes (HEAD `a84951c`, rejouées en session dans le worktree, en séquence)

Lint 0 · build OK · **2 289** unitaires / 116 suites (1 saut conditionnel préexistant), couverture
**99,78 / 97,17 / 99,59 / 99,81** · **341** e2e (56 sautés : suites Mongo sans URI) · **46/46** sur Mongo réel
(`credits.mongo`, `depots.mongo`, `classement-credits.mongo`, `provisionnement.mongo`).

## Notes

- Voir [[STORY-498]], [[STORY-503]], [[STORY-507]] (la publication en balance).
