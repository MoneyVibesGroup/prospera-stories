# STORY-692 : `test:cov` de bilan-service sort en code 1 alors que toutes les suites passent

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `bilan-service` (`src/migrate-dossiers-rollback.bootstrap.ts` et sa spec)
**Points :** 1 · **Complexité :** low · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** portes de STORY-681 (2026-10-02) — défaut **antérieur**, reproduit sur `origin/dev` 30a2816.

---

## Le fait, mesuré

`npm run test:cov` : 295 / 295 suites vertes, couverture au-dessus des seuils, **code de sortie 1**. La spec
de `migrate-dossiers-rollback.bootstrap` importe le script, qui s'exécute et appelle `process.exit(1)`
(« process.exit called with "1" »). Une porte qui sort en 1 sur une suite verte apprend à ignorer le code de
sortie — exactement ce qui laisse passer un vrai rouge (cf. STORY-446 : la porte `| grep`).

## Critères d'acceptation

- [x] AC-1 — La spec n'exécute plus le script à l'import (point d'entrée séparé de la logique, ou
      `process.exit` simulé) ; `test:cov` sort en 0.
- [x] AC-2 — La logique de rollback reste couverte (elle est dans un `*bootstrap*`, exclu des seuils :
      la déplacer hors du bootstrap si elle porte des décisions).

## Périmètre

**Inclus** — `avertissements()` (la seule logique du script, qui porte des décisions) quitte
`migrate-dossiers-rollback.bootstrap.ts` pour `RollbackMigrationService` (fichier couvert) ; sa spec
rejoint `rollback-migration.service.spec.ts` ; plus aucune spec n'importe le script.

**Hors périmètre** — `migrate-dossiers.bootstrap.ts` (aucune spec ne l'importe) ; toute garde générique
« aucune spec n'importe un `*bootstrap*` » (à poser si le défaut récidive).

## Notes

- Voir [[STORY-681]], [[STORY-446]].

## Progress Tracking

**Statut : `done` (2026-10-07).** MoneyVibesGroup/prospera-bilan-service#161 rebase-mergée sur `dev`.

### Livré
- `avertissements()` — seule logique du script, porteuse de décisions — quitte
  `migrate-dossiers-rollback.bootstrap.ts` pour `RollbackMigrationService` (fichier **couvert**, 100 %) ;
  corps identique à l'octet. Ses 4 tests rejoignent `rollback-migration.service.spec.ts` (helper renommé
  `rapportRollback`, un `const rapport` local l'aurait masqué) ; la spec du bootstrap est supprimée.
- Au passage : le JSDoc de `bootstrap()`, détaché par celui d'`avertissements`, y est de nouveau rattaché.

### Mesures
- **Avant** (spec d'`origin/dev` rejouée seule) : 4/4 verts, `process.exit called with "1"`, **exit 1**.
- **Après** : `test:cov` 310/310, 99,43 / 97,01 / 99,57 / 99,53, **exit 0** ; e2e 3 288/3 288 exit 0 ; lint 0 ;
  build OK. Mutation (condition de troncature inversée) : 2 tests rouges.
- ⚡ La porte rendue honnête a aussitôt servi : un premier `test:cov` est sorti en 1 sur un VRAI rouge —
  le test de durée de STORY-541 (`homogeneisation.regles`, 589 ms > 500 ms sous instrumentation et charge),
  vert seul et au second passage. Avant 692, ce rouge était indiscernable du faux 1.
- Pas de vérification docker : la story n'écrit pas en base et ne change pas le comportement du script.

### Revues
- Code (opus, lentilles échecs silencieux / tests / types) : 0 constat ; CLI inchangée (stdout, stderr, codes).
- Sécurité (opus) : **0 constat** — garde-fous de la marche arrière (simulation par défaut, alertes) intacts.

Historique : `in_progress` (2026-10-07) ; `ready-for-dev` (2026-10-02) — créée par les portes de STORY-681.
