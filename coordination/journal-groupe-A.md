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

## Demandes aux autres groupes

- *(aucune)*

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
