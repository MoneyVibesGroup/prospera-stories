# STORY-650 : Money Vibes agit POUR une organisation — contrôleurs d'administration, `orgId` explicite, et la liste blanche de ce qui est délégable

Status: done

**Épic :** EPIC-025 — Fondation RBAC (catalogue de permissions, rôles, portée)
**Service :** `paiement-service` (`:3005`) + `notification-service` (`:3008`)
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — le S32 proposé le 2026-09-05 a été **clôturé** (27/27) avant l’intégration de cette fiche ; le slotting reste à rendre au prochain sprint-planning. Elle se tire avec STORY-166/167, dont elle dépend. ⚠️ **RENUMÉROTÉE DEUX FOIS le 2026-09-08** (ex-STORY-599, puis brièvement 631) : la branche locale `r1-rbac-tenant` n’était pas poussée, et le cadrage PI-SPI du 2026-09-05 a repris 599 et 600 en ne balayant que les branches distantes. Le tracker de `main` demandait cette renumérotation. ⚠️ La plage **631 → 649** est ensuite revenue au plan de convergence des rails C et D (document du 2026-09-08) : ces deux fiches se posent donc au-delà, en 650 et 651.
**Prérequis :** **STORY-166** (socle de rôles) · **STORY-167** (surcharge par organisation) — les deux `not_started` au S31
**Origine :** arbitrage PO du 2026-09-04, **Q2 = oui** : *« je dois pouvoir le faire pour lui… mais le client doit le voir dans son journal, c'est important pour la traçabilité »*.

---

## Le fait

**Aucune route de ces deux services n'est appelable par un opérateur plateforme.** Vérifié dans le
code le 2026-09-04 : les quatre familles servies (`comptes-encaissement`, `contacts`, `modeles`,
`passerelles`) prennent l'organisation de `@CurrentUser('tenantId')`. `passerelles.controller.ts` le
revendique comme une propriété de sécurité, et il a raison :

> *« Aucune route ne prend d'identifiant d'organisation, ni en chemin, ni en corps, ni en requête.
> C'est ce qui rend FR-N54 vrai **par construction** plutôt que par vigilance : il n'existe aucune
> valeur à falsifier. »*

Or un opérateur Money Vibes est **org-less** : pas de `tenantId`, donc aucune de ces routes. Le
support ne peut rien faire pour un client, et **AP-13 suppose exactement le contraire** depuis sa
rédaction (*« l'administration saisit **pour** un client »*).

## Le mécanisme n'est pas à inventer — il existe deux fois

| Précédent | Forme |
|---|---|
| `kyc-service/src/modules/kyc/kyc-admin.controller.ts` | `GET /:orgId` · `POST /:orgId/approve` · `POST /:orgId/reject` · `POST /:orgId/documents/:documentId/approve` |
| `platform-catalog-service/.../entitlements.controller.ts` | `PUT /:orgId/:moduleCode` · `DELETE /:orgId/:moduleCode` · `GET /:orgId` |

Un **contrôleur `*-admin` séparé**, un **`orgId` explicite en chemin**, une **permission
plateforme**. Money Vibes approuve déjà un KYC et octroie déjà un entitlement *pour* un client par
ce chemin (STORY-048, `done`). Cette story l'étend aux deux services, **sans concept nouveau**.

⛔ **La voie écartée, et pourquoi.** Donner au support une *membership* dans chaque organisation
cliente : il faudrait la créer et la retirer dans **chacune**, le support hériterait de la portée de
lecture d'un membre, et surtout **le journal du client dirait « un membre a fait X »** — pas
« Money Vibes a fait X », c'est-à-dire l'inverse de ce que l'arbitrage demande.

## Ce que ça coûte, et qu'il faut écrire

⚠️ **La garantie de FR-N54 passe de « par construction » à « par vigilance ».** Ce n'est pas une
raison de renoncer, c'est une raison de la compenser — et les AC ci-dessous sont cette compensation.
Le point de rupture serait un `orgId` **optionnel** ajouté aux routes existantes : il paraîtrait
économique, et un jour quelqu'un le rendrait lisible depuis le corps de la requête.

## Critères d'acceptation

- [ ] AC-1 — **Contrôleurs séparés**, un par service : `comptes-encaissement-admin`,
      `passerelles-admin`, `modeles-admin`. ⛔ **Aucun paramètre d'organisation ajouté à une route
      existante** — les routes de tenant restent exactement telles qu'elles sont, `orgId` du jeton
      compris. Un test de contrat le prouve en comparant les signatures avant/après.
- [ ] AC-2 — L'`orgId` est **en chemin**, jamais dans le corps ni en requête, comme chez
      `kyc-admin`. Une organisation inconnue rend **`404`**, jamais `403` (anti-énumération, règle
      déjà tenue par les quatre familles).
- [ ] AC-3 — ⛔ **Un jeton TENANT sur une route d'administration rend `404`.** C'est le patron exact
      de STORY-597 AC-3, à recopier : la route ne doit pas seulement refuser, elle ne doit pas
      **exister** pour un client. Prouvé par mutation : retirer la garde fait virer le test au rouge.
- [ ] AC-4 — ⛔⛔ **Liste blanche explicite des actes délégables, déclarée en code et testée.**
      **Configuration ⇒ oui · Argent ⇒ non.**
      | Délégable | Non délégable |
      |---|---|
      | déclarer un compte d'encaissement · armer une passerelle · corriger un modèle | déclarer un encaissement · valider un encaissement · enregistrer une annulation · attribuer une grâce |
      ⚡ **Le motif n'est pas la prudence, c'est `NFR-1` (« Prospera ne détient jamais les fonds »)
      et `AD-11`.** Un opérateur qui pourrait déclarer *et* valider à la place du client viderait la
      séparation des pouvoirs de STORY-241 de son objet — et **elle ne le verrait pas**, puisqu'elle
      s'établit contre le journal, où les deux actes porteraient le même auteur.
- [ ] AC-5 — Les **secrets restent non restituables par ce chemin aussi** : un opérateur peut
      *écrire* les identifiants d'un fournisseur ou d'une passerelle, **jamais les relire**. C'est
      la ligne qu'AP-13 avait déjà trouvée (*« saisit pour un client, sans jamais pouvoir relire »*)
      et que STORY-243 tient côté chiffrement.
- [ ] AC-6 — Le **titulaire d'un compte d'encaissement n'est jamais pré-rempli avec Money Vibes**
      (AP-13, `422 TITULAIRE_REQUIS`). Un opérateur qui saisit pour un client saisit **le titulaire
      du client**.
- [ ] AC-7 — Chaque acte délégué émet l'entrée de journal de **STORY-651**. ⛔ Un acte délégable qui
      n'écrit pas au journal du client **ne passe pas la DoD** : la traçabilité est la condition de
      l'arbitrage, pas son complément.

## Ce qui NE fait PAS partie de cette story

- L'extension du catalogue aux droits de tenant : **STORY-166/167**.
- La console qui appelle ces routes : **AP-13** (comptes d'encaissement), **AP-30/32/33**.
- L'usurpation d'identité au sens strict (agir *sous* l'identité du client) : écartée, voir ci-dessus.

## Notes

- Voir [[STORY-166]], [[STORY-167]], [[STORY-651]], [[STORY-241]], [[STORY-243]], [[STORY-048]],
  [[AP-13]], `kyc-admin.controller.ts` et `entitlements.controller.ts` (les deux précédents).

---

## ✅ Livraison du 2026-11-08 — 650 et 651 ensemble, paiement ET notification

### Arbitrages PO rendus au lancement (2026-11-08)

1. **650 et 651 se livrent ensemble**, et **la partie notification-service se fait dans cette même
   story** (« gère la fiche de notification en même temps, pas besoin de créer 730 »). Aucune fiche
   séparée n'a été créée.
2. **651 AC-6 : rien n'est masqué au client.** L'entrée nomme l'opérateur (identifiant), son
   organisation (Money Vibes), ses rôles et ses permissions effectives au moment de l'acte.
3. **Un code plateforme dédié par service** : `paiement:delegation:configurer` et
   `notification:delegation:configurer`. Le catalogue passe de 15 à **17 codes**, copiés à l'octet
   près dans les 4 dépôts (auth, kyc, catalogue, admin-panel), sur le modèle de STORY-632.

### ⚠️ Écarts entre la fiche (rédigée le 04/09) et le code du 08/11

- **« Un opérateur Money Vibes est org-less » est FAUX depuis STORY-289/601/632.** L'opérateur est
  un **membre de l'organisation Money Vibes** qui porte un rôle plateforme. La porte de la délégation
  le reconnaît par l'identité de son organisation (`PorteDeLaPlateforme`), jamais par un nom de
  rôle. C'est aussi ce qui permet de nommer une « organisation opératrice » au journal.
- **Les surfaces plateforme existantes laissent fuir un `403`.** Le registre, l'exploitation et les
  abonnements appellent leur porte DANS le contrôleur. Or le `DroitsGuard` global passe avant : un
  client sans le droit reçoit `403 PERMISSION_DENIED` et apprend que la route existe. Pour AC-3, la
  porte de la délégation est un **guard placé juste après l'authentification**. ⚠️ **Le défaut
  reste ouvert** sur les trois surfaces antérieures (hors périmètre, à reprendre).
- **La séparation des pouvoirs (STORY-241) laissait passer tout auteur non `UTILISATEUR`.** Un
  opérateur aurait donc pu déclarer *et* valider un encaissement sans un mot. Une seconde serrure
  est posée : tout geste d'argent par un `OPERATEUR_PLATEFORME` est refusé (`409
  POUVOIR_D_ARGENT_NON_DELEGABLE`), même si aucune route ne l'ouvre.
- **notification-service n'avait aucun journal des actes de configuration.** Il en reçoit un
  (`interventions_plateforme`), qui ne trace **que** les interventions de Money Vibes. Les actes du
  client continuent de ne rien produire (651 AC-7 au sens strict).
- **Deux notions de « plateforme » cohabitent dans notification.** La vue toutes-organisations
  (STORY-597) reconnaît l'opérateur SANS organisation (`tenantId === null`) ; la délégation
  reconnaît un MEMBRE de Money Vibes (`ORGANISATION_PLATEFORME_ID`). Aucune route ne porte les deux
  portes. L'alignement de la vue 597 sur le modèle de 632 reste à décider.

### Ce qui est livré

| | paiement-service | notification-service |
|---|---|---|
| Surface (AC-1) | `admin/organisations/:orgId/comptes-encaissement` : lister, déclarer, défaut, clef de notification, vérifier | `admin/organisations/:orgId/passerelles` : lister, consulter, enregistrer, re-vérifier, retirer · `admin/organisations/:orgId/modeles` : lister, consulter, créer, ajouter une version, publier |
| Routes du client | inchangées (test de contrat sur les signatures) | inchangées (test de contrat) |
| AC-2 | `orgId` en chemin seulement ; inconnue / sans KYC / sans droit ⇒ même `404` ; vers Money Vibes elle-même ⇒ `422 DELEGATION_VERS_LA_PLATEFORME` ; corps portant `orgId` ⇒ `400` | idem |
| AC-3 | `PorteDeLaDelegationGuard` juste après `JwtAuthGuard` : un client reçoit le `404` avant le gate (contre-preuve e2e : sans elle, `403 PERMISSION_DENIED`) | idem, juste après `JetonDeServiceGuard` |
| AC-4 | `NATURE_DES_DROITS` (`Record<DroitPaiement, …>`) : seul `compte:administrer` se délègue ; émettre, révoquer, déclarer, valider, annuler, accorder une grâce restent au client | seuls `canal:administrer` et `modele:rediger` ; envoi de masse, données personnelles et audit non délégables ; l'essai (qui envoie) n'a pas de route d'administration |
| AC-5 | mêmes vues que le client : aucun secret restitué | l'intervention retient les NOMS des secrets, jamais leur valeur, ni le jeton de webhook |
| AC-6 | mêmes DTO : titulaire obligatoire, jamais pré-rempli | — |
| AC-7 (→ 651) | entrée au journal chaîné du client, même transaction (`EcritureDArgent`) | intervention dans la même transaction (`connection.transaction` + transaction implicite Mongoose) |

### Preuves au 2026-11-08 (avant rebase sur `dev`)

| Dépôt | Branche | Résultat |
|---|---|---|
| prospera-paiement-service | `MNV-650` | 4 440 unitaires + 351 e2e verts · lint 0 · 15 mutations, toutes rouges |
| prospera-notification-service | `MNV-650` | 3 734 unitaires + 285 e2e verts · lint 0 · 14 mutations : 13 rouges, 1 équivalente (contrôle redondant de la porte plateforme) |
| auth-service · kyc-service · platform-catalog-service · admin-panel | `MNV-650` | 1 213 · 526 · 980 · 484 unitaires verts ; `permission.enum.ts` identique dans les 4 (17 codes) |
| prospera-recette | `MNV-650` + `MNV-650-attente` | recette croisée `delegation.recette.ts` |

### ✅ Integration Gate — 2026-11-08, DEPUIS `dev` (après rebase par le PO)

Images reconstruites depuis `origin/dev` des cinq services (auth `5ef9d4a`, kyc `ae24228`, catalogue
`350a6a9`, paiement `b42565d`, notification `8759ca8`), une à la fois, projet `recette650`.

- **`delegation.recette.ts` : 10/10 sur volumes NEUFS** (`down -v` puis 0 volume avant le passage) :
  jeton du support signé avec les deux droits ; 404 au client sur chaque route d'administration ;
  404 au support pour une organisation inconnue ; aucune surface d'argent ; compte déclaré POUR le
  client et lu chez lui ; le client lit dans SA chaîne `COMPTE_ENCAISSEMENT_DECLARE_PAR_MONEY_VIBES`,
  auteur `OPERATEUR_PLATEFORME` (opérateur, Money Vibes, organisation cible, permissions) ;
  passerelle SMS armée sans jamais restituer les secrets ; modèle créé et publié ; le client lit
  ses interventions (verbe suffixé, libellé « par Money Vibes », opérateur nommé, aucun secret) ;
  un acte du client n'écrit aucune intervention.
- **Conformité notification `delegation-transaction.conformite-spec.ts` : 4/4 contre le vrai Mongo**
  (`rs-notification`) — l'acte écrit SANS session rejoint la transaction ; une trace qui échoue
  annule l'acte ; un acte qui échoue à mi-chemin ne laisse rien ; l'intervention ne se réécrit pas.
  ⚡ Contre-preuve : acte exécuté HORS transaction ⇒ 2 tests rouges.
- **Non-régression des recettes existantes : toutes vertes** — 632 (distributeur), 631
  (abonnement), 649 (facturation), pile.

⚠️ **Deux défauts de la RECETTE, mesurés au premier passage** (corrigés sur `MNV-650-attente`) :
1. le KYC et le droit d'usage du client arrivent par Kafka — quelques secondes après l'accueil, le
   gate dit encore `*_NOT_ENTITLED` : la recette attend la projection ;
2. ⚡ **Money Vibes n'avait AUCUN droit d'usage `notification`.** Les surfaces d'administration
   passent par le gate de l'organisation de l'OPÉRATEUR, comme au paiement (où elle a `paiement`) :
   **en exploitation, Money Vibes doit détenir le module `notification` pour agir pour un client.**
   La recette le lui octroie ; l'amorçage de Money Vibes ne le fait pas encore.

### Ce qui reste ouvert

- La **console** qui appelle ces routes : AP-13, AP-30/32/33.
- **Notifier** le client d'une intervention (651, point 2) : non fait, question PO toujours ouverte.
- Le `403` qui fuit sur le registre, l'exploitation et les abonnements du paiement (voir plus haut).
