# STORY-914 : La lecture seule et l'export suivent l'état publié — préavis, horloge, liste blanche

Status: done

**Complexité :** moyenne (une règle, quatre services, une liste blanche par module)

**Épic :** EPIC-159 (le cabinet sur le moteur), volet (c) ; FR-43
**Services :** `balance-service`, `bilan-service`, `prospera-fiscal-service`, `dossier-service`
**Plage :** groupe A, n° 10 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Dépend de 905, 912, 913.
Fiche écrite **avant** de coder.

---

## Pourquoi

FR-43 pose **une seule règle** pour la lecture seule : les lectures passent ; toute écriture est refusée, **sauf** les
routes d'export et d'états réglementaires que le module déclare à son manifeste (`routesLectureSeule`). Et un droit
échu n'est pas en lecture seule tout de suite : il ouvre un **préavis de 30 jours** (`PREAVIS`, module ouvert), puis la
lecture seule (décision du PO du 2026-11-10 ; contrat de module, « Expiré »).

Aujourd'hui, dans les services du cabinet :

- l'**ancienne garde** (état publié inconnu, STORY-727) passe en lecture seule **dès l'échéance**, et lit l'heure par
  `new Date()` caché en valeur par défaut d'un paramètre ;
- la **nouvelle garde** (912, 913) ne connaît que deux sortes de route, `lecture` et `ecriture` : un export est refusé
  sous `SUSPENDU` ou `DESINSTALLE` (où la matrice l'ouvre), et un dépôt de liasse ou un accusé de l'administration est
  refusé sous `LECTURE_SEULE` (où la matrice ouvre les états réglementaires).

## Ce que la story livre

1. **Le préavis dans l'ancienne garde** (`lecture-seule.ts`, copié à l'identique dans balance, bilan et fiscal) : fin du
   préavis = `preavisJusquau` s'il est connu, sinon `echeanceLe` + 30 jours — la formule du moteur
   (`platform-catalog-service`, `etat-publie/calcul.ts`, D-932-5). Lecture seule **après** la fin du préavis seulement.
2. **L'horloge de référence** : un fournisseur `Horloge` (`common/horloge/`), seul lecteur de l'heure ; les gardes et
   les règles le reçoivent. `maintenant` devient un paramètre **obligatoire** des règles pures. Un invariant interdit
   `new Date()` et `Date.now()` dans les gardes et les règles de lecture seule.
3. **La liste blanche** : un décorateur `@SorteDeRoute('export' | 'etat-reglementaire')`, posé sur les routes du
   manifeste qui existent ; la liste déclarée `ROUTES_D_EXPORT_ET_D_ETATS` ; la garde passe cette sorte à
   `deciderGarde`. Ancienne garde : une route de la liste n'est jamais refusée en lecture seule.
4. **dossier** : la même règle de préavis pour la lecture seule du cabinet (`etatDuCabinet`), par la même horloge.

## Décisions

- **D-914-1 — Le préavis se calcule chez le service, à la formule du moteur.** `entitlement.changed` ne porte pas
  `preavisJusquau` : `echeanceLe` + 30 jours (D-932-5). L'état publié, lui, porte déjà `PREAVIS` et sa fin : il décide
  dès qu'il est connu.
- **D-914-2 — L'horloge de référence de la plateforme est l'horloge système du service** (addendum §A-1 : sur la
  plateforme, l'horloge de Money Vibes). Le fournisseur `Horloge` est le seul endroit qui la lit : une horloge de
  recette ou l'horloge scellée sur site s'y brancheront sans toucher aux gardes.
- **D-914-3 — Liste blanche = les routes du manifeste qui EXISTENT** :
  - balance : `GET dossiers/:dossierId/balances/:id/export`, `GET dossiers/:dossierId/fiscal/resultat-fiscal/export`
    (export) ;
  - bilan : `GET dossiers/:dossierId/bilan/export/etats/:jeuEtatsId`,
    `GET dossiers/:dossierId/bilan/export/previsionnel/:hypothesesId` (export) ;
    `POST dossiers/:dossierId/bilan/etats/:id/deposer` (état réglementaire, [À CONFIRMER] au manifeste) ;
  - fiscal : `GET depots/:id/fichier` (export) ; `POST depots/:id/accuse`, `POST depots/:id/rejet` (état réglementaire).
  Les routes `instance/<module>/{organisationId}/export` sont « à créer » (C13) : hors story.
- **D-914-4 — Les autres routes de `routesLectureSeule` restent des lectures** (`GET`) ou des `@LectureSeule()`
  (dry-runs, 905) : la garde les ouvre déjà en `LECTURE_SEULE`.

## Critères d'acceptation

- **AC-1** : ancienne garde, droit échu depuis 10 jours ⇒ écriture **ouverte** (préavis) ; échu depuis 31 jours ⇒
  `403 ABONNEMENT_EXPIRE` ; la frontière tombe à `echeanceLe + 30 j` exactement (exclusive comme l'échéance).
- **AC-2** : les décisions dépendent de l'horloge injectée, pas de l'heure système (horloge figée dans les tests).
- **AC-3** : état publié `SUSPENDU` : la route d'export passe, une lecture ordinaire est refusée `<MODULE>_NOT_ENTITLED`.
- **AC-4** : état publié `LECTURE_SEULE` : `POST …/deposer` (bilan), `POST depots/:id/accuse` (fiscal) passent ; toute
  autre écriture est refusée `ABONNEMENT_EXPIRE`.
- **AC-5** : les handlers marqués `@SorteDeRoute` sont EXACTEMENT la liste déclarée (balayage des contrôleurs).
- **AC-6** : dossier : droits échus depuis 10 jours ⇒ création de dossier ouverte ; 31 jours ⇒ lecture seule.

## Definition of Done

- [x] Unitaires (Node 24, étage `verification`), conformité fiscale, lint, `tsc` verts.
- [x] Mutations : préavis retiré ⇒ rouge ; sorte d'export ignorée ⇒ rouge.
- [x] Pile réelle : export sous `SUSPENDU` (200) et écriture en préavis (2xx) prouvés.
- [x] PR code et docs fusionnées.

## Livraison (2026-11-16)

🏁 **DONE** — balance #150 (dev `34a1ae1`), bilan #176 (dev `31e4a55`), fiscal #50 (dev `9e28d56`), dossier #51 (dev
`6ce9f1b`). Préavis de 30 jours (`preavisJusquau`, sinon échéance + 30 j), horloge injectée (plus de `Date.now()`
dans les gardes), liste blanche `@SorteDeRoute('export' | 'etat-reglementaire')` tenue par un invariant
(`ROUTES_D_EXPORT_ET_D_ETATS`). Node 24 : dossier 1 817 unitaires et 353 e2e ; balance, bilan et fiscal verts, les
seuls échecs (export STORY-555, minutages) passent rejoués seuls. Mutations rouges (préavis retiré, sorte d'export
ignorée) ; pile : export sous `SUSPENDU` en 200, écriture en préavis en 2xx.
