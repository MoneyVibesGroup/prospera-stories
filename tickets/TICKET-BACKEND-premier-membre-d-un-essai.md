# TICKET backend : personne ne peut entrer dans l'essai d'un prospect — le premier membre d'une organisation née par le moteur n'a pas de route

**Type :** route manquante. Le parcours « essayer » ne s'ouvre à personne sans elle.
**Dépôts :** `prospera-auth-service`, `prospera-platform-catalog-service`, `prospera-admin-panel-service` (le BFF).
**Tenus par :** groupe B (plan du lot 6 §2). L'écran (la console qui nomme l'administrateur du prospect) : groupe A.
**Découvert par :** la recette « essayer, puis mettre en service » (STORY-1115, D-1115-6), après STORY-1113 (D-1113-9).
**Ouvert par :** groupe B, 2026-11-24.
**Bloque :** la démo du 15/01 (« chaque client testable par le prospect ») et STORY-1116 (cinq essais) : sans membre,
personne ne se connecte à l'essai, ni sous son nom, ni « en tant que » un compte du jeu (FR-21 exige déjà d'être membre).
**Priorité :** Must avant la démo du 15/01.
**Statut :** **ouvert**, à placer par la session du groupe B.

---

## Le problème

Une organisation d'essai naît par le moteur (`POST /admin/essais` → `POST /naissances` du catalogue de l'essai → `POST
/interne/organisations` d'auth, STORY-938/948) **sans aucun membre**. Ensuite :

- `POST /users` (l'invitation d'un collaborateur, « la route d'auth existante » de D-948-8) exige un `TENANT_ADMIN` **de
  l'organisation** (`@Roles(TENANT_ADMIN)`, `user.tenantId`) : il n'y en a pas ;
- `PUT /interne/organisations/{id}/invitations` (STORY-974) refuse l'essai (403 `ESPACE_D_ESSAI_REFUSE`, D-974-2) ;
- `POST /admin/organizations/{id}/resend-invitation` ne fait que renvoyer l'invitation d'un administrateur **déjà**
  invité (`NO_INVITED_ADMIN` sinon) ;
- l'ordre d'ouverture porte bien `administrateur` (une adresse), mais le catalogue ne s'en sert que pour les avis de
  fin d'essai ;
- `GET /essai/comptes-du-jeu` et `POST /essai/connexion-en-tant-que` (STORY-972) exigent un membre actif de
  l'organisation du jeton.

La preuve de 1113 et la recette de 1115 posent donc ce premier membre **en base** de l'auth d'essai. Tout le reste
(acceptation, invitation du collègue, comptes du jeu, connexion « en tant que », puis l'invitation au réel à la mise en
service) passe déjà par les vraies routes.

## Ce qui est attendu (proposition, à arbitrer dans la story)

1. **auth** : une route du moteur, dans l'espace d'essai, qui invite le premier administrateur d'une organisation née
   par le moteur (adresse, prénom, nom, rôle métier proposé au métier) — par exemple en ouvrant à l'essai
   `PUT /interne/organisations/{id}/invitations` pour un administrateur, ou une route sœur ; l'e-mail part par la
   sortie de l'essai (liste blanche, STORY-951/1113), jamais au réel.
2. **catalogue de l'essai** : à l'ouverture (ou à une reprise), il invite `administrateur` par cette route, sous
   l'identité du moteur de l'essai (même patron que la naissance).
3. **BFF** : rien de neuf si (2) suit l'ouverture ; sinon une route `…/essais/{orgId}/administrateur` relayée.
4. **Recette** : la pose en base de `essai-mise-en-service.recette.ts` (D-1115-6) disparaît ; la garde des écritures en
   base de la recette le vérifie.

## Critères

- Un prospect dont l'essai vient d'ouvrir reçoit (par la sortie de l'essai) un lien, choisit son mot de passe, se
  connecte à l'essai, invite un collègue par `POST /users`, et se connecte « en tant que » un compte du jeu.
- Aucun message ne part au réel depuis l'essai (NFR-3).
- La recette `essai-mise-en-service` n'écrit plus rien en base.
