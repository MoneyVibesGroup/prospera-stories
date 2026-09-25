# STORY-679 : Une balance se valide sous un référentiel que l'organisation ne détient plus — la validation ne revérifie pas l'habilitation

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `balance-service` — validation de la balance canonique
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** vérification docker de STORY-677 (2026-09-25) — défaut **antérieur**, identique sur `dev`.

---

## Le fait, mesuré

Par les API réelles, sur une stack neuve :

1. L'organisation D dépose un **brouillon** de balance `SN` alors qu'elle détient `syscohada-revise@2.1`.
2. Son habilitation `balance` passe à `smt-togo@1.0` (octroi du catalogue → `entitlement.changed`).
3. Une **nouvelle** soumission `SN` est bien refusée : `409 REFERENTIEL_NON_HABILITE`, sans écriture.
4. Mais `POST …/balances/:id/valider` sur le brouillon existant répond **200** : la balance passe
   BROUILLON → **VALIDÉE**, `historiqueMutations` gagne une entrée, l'outbox publie
   `balance.etat.change` et `balance.etat.document.change`, et `bilan-service` la projette VALIDÉE.

## Pourquoi

Seul le dépôt (`POST /balances`) passe par le résolveur de référentiel. `preparerValidation` et
`marquerEtat` n'appellent jamais `controleurDeCompte` ni le résolveur : la validation relit la balance,
**jamais le référentiel ni l'habilitation**.

## Critères d'acceptation

- [ ] AC-1 — `valider` résout le référentiel du dossier **au moment de la validation**, par le même
      résolveur que le dépôt (couple exact détenu, pont `SN` par préférence — STORY-677) ; non détenu
      ⇒ `409 REFERENTIEL_NON_HABILITE`, **sans aucune écriture** (balance, historique, outbox).
- [ ] AC-2 — Les comptes du brouillon sont revalidés contre le plan du référentiel servi à la
      validation (un compte accepté sous `@2.2` et absent de `@2.1` est signalé si l'org est revenue en
      `@2.1`) — même contrôleur que le dépôt, jamais une seconde implémentation.
- [ ] AC-3 — Vérification docker : le scénario ci-dessus rend 409, compteurs inchangés ; une org
      toujours habilitée valide comme avant.
- [ ] AC-4 — Mutation : retirer la résolution à la validation fait rougir AC-1.

## Notes

- La description Swagger de `habilite` (inventaire des référentiels) signale la limite depuis 677 :
  la retirer à la livraison.
- Voir [[STORY-677]], [[STORY-533]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-677.
