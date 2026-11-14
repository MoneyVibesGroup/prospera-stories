# Journal du groupe A (poste principal)

> Écrit par le groupe A seulement. Lot : `PLAN-4-SESSIONS-2026-11-14.md` §3.

## État

- **2026-11-14 (soir)** : journal ouvert. Prochaine étape : la relecture de STORY-299, 300, 365 et 563 (§3.1).
- **2026-11-14 (soir)** : STORY-569 livrée (fiscal #39, notification #86) ; elle sort du lot, remplacée par STORY-345.
  Le lot se termine par la relecture de tout ce qu'ont fait les quatre groupes (§3.4).
- Déjà fusionné le 14/11 par les deux sessions de la journée : STORY-178, 177, 175, 174, 365, 176, 100, 563, 567, 568
  (et 293 clôturée) ; STORY-299, 298, 300, 362, 305 → 312.
- **En cours sur le poste principal** : STORY-901, branches `MNV-901` avec des modifications **non commitées** dans
  `prospera-fiscal-service` et `prospera-balance-service`.
- **Docker** : la pile `recette100` et un MongoDB jetable (`mongo-fiscal-567`) tournent encore.

## Dépôts tenus

`prospera-fiscal-service`, `prospera-balance-service`, `prospera-bilan-service`, `prospera-dossier-service`,
`prospera-kyc-service`, `prospera-admin-panel-service`, `prospera-recette`, `prospera-auth-service` (jusqu'à STORY-902),
et plus `prospera-notification-service` (cédé à B, voir Passations).

## Passations

- **2026-11-14 : `prospera-notification-service` cédé à B**, dernier commit sur `dev` : `8916ee4`
  (STORY-569 livrée). A n'y touche plus.
- Prévue : `prospera-auth-service` → B à la fusion de STORY-902.
- **2026-11-14 (nuit) : FE-069 remise à D** (sur demande de l'utilisateur), branche **`fe-069`** poussée
  dans `prospera-frontend-expert-comptable`, commit **`4148d65`**, sans PR. A ne touche plus ce dépôt.

## Demandes aux autres groupes

- **À D — reprendre FE-069 sur la branche `fe-069`** (plan, ligne FE-069 du lot de D : « D la reprend où elle en est »).
  - **À lire d'abord** : la section « Recensement des écarts frontend ↔ backend (2026-11-14) » de la fiche
    `frontend-stories/FE-069.md` (#480) — ruptures A1→A3, écarts de schéma B1→B17, routes sans écran C1→C17,
    et le découpage proposé au PO (A+B dans FE-069, C en stories nommées — **pas encore validé**).
  - **État de la branche** : typecheck **rouge à dessein** — les types sont régénérés depuis la pile `recette100`
    (8/8 services, `origin/dev` du 14/11) et font remonter les écarts B. A1/A2 sont faits dans le code
    (`referentiels/actifs` et `tresorerie/*` sous `/dossiers/{id}/`, clés de cache sous `["dossier", id, …]`) ;
    restent `tresorerie.test.ts`, `scope-dossier.guard.test.ts`, les stubs e2e (A3), puis B.
  - **Le gate e2e** : `npx playwright test -c playwright.gate.config.ts` (`e2e/gate/`, aucune interception).
    `pile.ts` amorce un cabinet réel par API (inscription, lien Mailhog, KYC approuvé, modules, collaborateur).
    Vert jusqu'à la création du dossier par l'assistant ; bute ensuite sur A1 (Atelier fermé, faux « KYC non
    approuvé »). Le serveur `next start -p 3100` est **réutilisé** s'il tourne : le relancer après tout changement.
  - **La pile** : `recette100` tourne, **`expert-comptable` ajouté** (worktree `_wt-r100-expert-comptable`,
    surcouche avec `NODE_ENV: production`, sinon crash `pino-pretty`).

## Réponses aux demandes reçues

- *(aucune)*

## ⚠ Contrats

- *(aucun changement annoncé)*

## Questions à l'utilisateur ou au PO

- **STORY-300** : le mode de compatibilité par rôle des droits fiscaux (TENANT_ADMIN = tout, TENANT_USER = préparer)
  reste-t-il, et jusqu'à quand ? La réponse conditionne STORY-902.

## Procédures

- *(à écrire)* republication du paquet fiscal Togo 2026 au catalogue, à la mise en service.

## Pièges rencontrés

- La recette de `prospera-recette` fait `up` **sans** `--build` : reconstruire à la main l'image du service modifié.
- `prospera-fiscal-service` : `test:conformite` exige un MongoDB en jeu de répliques ; un `mongo:7` jetable lancé avec
  `mongo/demarrer-mongo-fiscal.sh` (scripts en LF), `-p 127.0.0.1:27020:27017`, `MONGO_HOTE_ANNONCE=localhost:27017`.
- La suite unitaire du fiscal est instable en parallèle complet : `-w 2`.
