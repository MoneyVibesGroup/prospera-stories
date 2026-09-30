# STORY-679 : Une balance se valide sous un référentiel que l'organisation ne détient plus — la validation ne revérifie pas l'habilitation

Status: done

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

- [x] AC-1 — `valider` résout le référentiel du dossier **au moment de la validation**, par le même
      résolveur que le dépôt (couple exact détenu, pont `SN` par préférence — STORY-677) ; non détenu
      ⇒ `409 REFERENTIEL_NON_HABILITE`, **sans aucune écriture** (balance, historique, outbox).
- [x] AC-2 — Les comptes du brouillon sont revalidés contre le plan du référentiel servi à la
      validation (un compte accepté sous `@2.2` et absent de `@2.1` est signalé si l'org est revenue en
      `@2.1`) — même contrôleur que le dépôt, jamais une seconde implémentation.
- [x] AC-3 — Vérification docker : le scénario ci-dessus rend 409, compteurs inchangés ; une org
      toujours habilitée valide comme avant.
- [x] AC-4 — Mutation : retirer la résolution à la validation fait rougir AC-1.

## Notes

- La description Swagger de `habilite` (inventaire des référentiels) signale la limite depuis 677 :
  la retirer à la livraison.
- Voir [[STORY-677]], [[STORY-533]].

## Progress Tracking

**Statut : `done` (2026-09-30).** `prospera-balance-service#125` rebase-mergée sur `dev` (branche supprimée).

**Livré** — `preparerValidation` (`balance.service.ts`) appelle `controleurDeCompte(orgId, dossierId,
doc.exercice.debut)` — la méthode du dépôt : même résolveur (couple exact, pont `SN` par préférence),
même date, même traduction HTTP — puis `validator.validerComptesAuPlan` (`exigerCompteDuPlan` extrait de
`validerLignes` et partagé + `validerComptesSources`) : aucune seconde implémentation. Placé **après**
la lecture tenant/dossier-scopée (autre tenant ⇒ 404, jamais 409) et le court-circuit `VALIDÉE`,
**avant** l'échéance, le constat fiscal et toute session : un refus n'écrit rien. Un **rejet** reste
possible sans habilitation. Swagger : variante 409 dans le `oneOf` de `valider` ; mention de la limite
retirée de `habilite`.

**Portes** — lint 0 · build · 4 898 unitaires / 1 282 e2e · couverture 99,28 / 93,26 / 98,95 / 99,41.
⚡ Un test de durée hors diff (`plan-amortissement.regles`, seuil 3 s) a rougi une fois pendant que la
stack docker tournait (3,9 s) ; vert à froid.

**Mutations (AC-4)** — rouges par assertion : résolution + revalidation retirées (9 échecs) ;
revalidation des comptes seule retirée (4) ; court-circuit réécrit en `etat !== 'BROUILLON'` (le test
REJETÉE ajouté en revue rougit). L'e2e 409 simule le service (contrat HTTP : `code` + `details`
traversent le filtre) — il ne prouve pas la résolution, et ne le prétend pas.

**Vérif docker** (stack neuve, `tmp/verif-docker-678-679/`, 56 OK / 0 KO) : org D — brouillon `SN`
déposé sous `@2.1`, habilitation `balance` passée à `smt-togo@1.0` ; `POST valider` → **409
`REFERENTIEL_NON_HABILITE`**, `details` {`syscohada-revise@2.2` ; `smt-togo@1.0`} ; compteurs de
**toutes** les collections de `balance_service` inchangés ; document (`etat`, `updatedAt`,
`historiqueMutations`) inchangé ; jamais projetée `VALIDÉE` dans `bilan_service`. Orgs A et B
(habilitées `@2.2`) : balances `VALIDÉE` comme avant. AC-2 prouvé en unitaire (résolveur et
validateur réels câblés).

**Revue de code** — 1 constat non bloquant corrigé dans un commit dédié : aucun test ne couvrait
`REJETÉE → VALIDÉE` à travers la résolution. **Revue de sécurité** — 0 constat.

⚠️ **Hors périmètre, à suivre** : (1) le tag scellé de la balance n'est pas comparé au tag servi — si
l'axe du dossier change de système comptable, seule la revalidation des comptes protège (même écart
qu'au dépôt) ; (2) le 409 porte `error: "CONFLICT"` (mapper partagé, déjà vrai au dépôt).

— Historique — **Statut : `in_progress` (2026-09-30).** Branches `MNV-679` (balance-service + docs), lancée avec STORY-678.

— Historique — `ready-for-dev` (2026-09-25) : créée par la clôture de STORY-677.
