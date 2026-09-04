# STORY-572 : Read-models, gate d'accès et permissions déclarées au catalogue

Status: done  ·  livrée le 2026-09-04, commit `4d53a7a` sur `MNV-572`

**Épic :** EPIC-054 — Socle `notification-service`, carnet de contacts et cloisonnement
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-570** (scaffold) · **STORY-140** (catalogue de permissions plateforme, livrée)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-18, AR-14.

---

## Le fait

Le gate est `emailVerified` (claim du jeton) + `OrgKycStatus == APPROVED` + entitlement notification
`ACTIVE`, **tous lus des read-models locaux**. Aucun appel réseau sur le chemin d'autorisation : une
autorisation qui dépendrait de la disponibilité d'un autre service tombe avec lui.

⚠️ **Cette story porte deux choses que son titre ne dit pas, et qui n'ont aucun autre porteur dans le
bloc 1** : FR-N54 (une organisation configure ses passerelles sans voir celles d'une autre) et AR-14
(secrets de passerelle chiffrés). Les laisser à EPIC-060 les ferait arriver **après** la première
passerelle configurée.

## Critères d'acceptation

- [x] AC-1 — Gate **`@RequiresEnvoiAccess`** (et non `@RequiresNotificationAccess` : la garde de vocabulaire d'AC-6 de STORY-570 refuse `Notification` comme nom de type) : `emailVerified` → KYC `APPROVED` → entitlement
      `ACTIVE`, **dans cet ordre**, comme les modules existants. Read-models locaux uniquement.
- [x] AC-2 — Le cloisonnement vient de l'`orgId` du **jeton signé**, jamais du corps de requête.
      Une ressource hors organisation répond **`404`, jamais `403`** (anti-énumération).
- [~] AC-3 — ⛔ **PARTIEL, décision PO du 2026-09-04 — voir le bas de ce fichier.** ⚡ **Les cinq droits sont déclarés au catalogue plateforme (STORY-140) et attribuables
      séparément** : rédiger un modèle · exécuter un envoi de masse · valider un envoi de masse ·
      consulter le journal · administrer les canaux. **Aucun rôle codé en dur** — un test de présence
      refuse toute énumération de rôle dans le code d'autorisation.
- [x] AC-4 — FR-N54 : la configuration de passerelle est portée par l'organisation. Un test avec
      **deux organisations réelles** vérifie qu'aucune ne lit ni ne modifie la configuration de
      l'autre.
- [x] AC-5 — ⛔ AR-14 : les secrets de passerelle sont chiffrés **AES-256-GCM**, clé maîtresse en
      environnement et **hors base**. Aucun chemin de lecture en clair : ni restitués par l'API, ni
      journalisés, ni présents dans une trace d'erreur (NFR-7). Prouvé par un test qui lit le
      document en base et n'y trouve pas le secret.

## Notes

- *Q6 du PRD (rôle nouveau ou permission ajoutée à un rôle existant) est délégué au découpage par
  décision produit ; la règle « attribuables séparément » tient dans les deux cas.*

---

## Livré le 2026-09-04 — `MNV-572`, commit `4d53a7a`

490 tests unitaires + 23 e2e, couverture 99,6 % lignes, lint propre, aucune
dépendance externe requise pour les faire tourner.

**Ce que le code a appris, et que ni le diff ni l'historique ne diront :**

- **L'idempotence tient à un ORDRE, pas à un index.** Le marqueur
  `EvenementTraite` est inséré **avant** l'écriture, dans la même transaction.
  Interroger le marqueur puis insérer laisserait la fenêtre entre les deux :
  deux exécutants sur la même partition passeraient tous deux le test.
  Mutualisé dans `ProjectionTransactionnelle` — moule repris de STORY-239, qui a
  livré le même gate pour `paiement-service` la veille.
- **La validation d'enveloppe est sortie des consommateurs Kafka.**
  `collectCoverageFrom` exclut `*bootstrap*`, or c'est exactement là que vit le
  poison-pill : une donnée invalide propagée arrête la partition, le read-model
  d'**autorisation** se fige, et le gate refuse tout le monde sans une trace
  HTTP.
- **`fromBeginning: true` ne rattrape que ce que Kafka détient encore.** Un
  événement sorti de la rétention ne revient jamais, et l'organisation concernée
  resterait refusée en silence. À vérifier avant la mise en recette.
- **Le gate passe avant les droits, et l'inverse serait une fuite.** Interroger
  les droits d'abord rendrait `PERMISSION_DENIED` à une organisation révoquée —
  c'est-à-dire lui apprendrait que la surface existe et que seul son profil lui
  manque.
- **AR-14 : le contexte `(organisation, canal, nom)` est authentifié en AAD.**
  Recopier le blob chiffré d'une organisation dans le document d'une autre le
  rend **illisible**. Sans cela, le chiffrement protégerait la base d'un lecteur
  extérieur mais **pas les organisations les unes des autres** — c'est-à-dire
  pas contre le scénario que FR-N54 décrit. Et `NOTIFICATION_MASTER_KEY` voit
  son **contenu** vérifié au boot : `createCipheriv` ne lèverait qu'au premier
  chiffrement, en production.

### ⛔ AC-3 — arbitrage PO du 2026-09-04, à lire avant de croire la case cochée

Les cinq droits sont **déclarés, typés, attribuables séparément et gardés** dans
`src/common/rbac/droits-notification.ts`, lus du claim `perms`, sans qu'aucun nom
de rôle n'apparaisse sur le chemin d'autorisation (un test de présence le refuse,
contre-preuve comprise). **Mais ils ne sont pas inscrits au catalogue de
permissions de l'IdP**, et c'est une décision, pas un oubli. Deux faits vérifiés :

1. **La règle d'or du catalogue l'interdit aujourd'hui** — « n'ajouter une
   permission que si un guard la vérifie quelque part ». Quatre des cinq n'ont
   aucune surface avant EPIC-055, 056, 060 et 061 ; seul « administrer les
   canaux » en a une, livrée par cette story.
2. **Le catalogue est de périmètre PLATEFORME.** Dans `auth-service`, `perms`
   dérive du `platformRole` **unique** d'un utilisateur ; une membership de
   tenant donne `perms: []`. Or ces droits s'exercent chez un client : les
   déclarer en l'état les rendrait détenables par le seul personnel de la
   plateforme — l'inverse de ce que FR-N53 décrit.

**Story dédiée à créer.** Elle touche les **quatre** copies du catalogue
(`auth-service`, `kyc-service`, `platform-catalog-service`, `admin-panel`),
identiques à l'octet près, **et** exige d'étendre les permissions aux rôles de
tenant côté IdP. Le gate étant déjà branché sur `perms`, rien ne changera dans
`prospera-notification-service` ce jour-là.

### Hors périmètre, ajouté au passage

`.gitattributes` force le LF sur `mongo/`. Sans lui, un clonage Windows extrait
`demarrer-mongo-notification.sh` en CRLF et le conteneur `mongo-notification`
meurt sur `bad interpreter: /bin/bash^M` — une panne invisible au diff, aux tests
et sur le poste qui a écrit le fichier. Le piège avait déjà été payé sur
`prospera-paiement-service` (STORY-238) ; ce dépôt-ci n'avait pas la parade.
