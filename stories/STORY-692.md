# STORY-692 : `test:cov` de bilan-service sort en code 1 alors que toutes les suites passent

Status: in_progress

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

- [ ] AC-1 — La spec n'exécute plus le script à l'import (point d'entrée séparé de la logique, ou
      `process.exit` simulé) ; `test:cov` sort en 0.
- [ ] AC-2 — La logique de rollback reste couverte (elle est dans un `*bootstrap*`, exclu des seuils :
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

**Statut : `in_progress` (2026-10-07).** Branches `MNV-692` sur `docs` et `bilan-service`.

Historique : `ready-for-dev` (2026-10-02) — créée par les portes de STORY-681.
