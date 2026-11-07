# STORY-167 : **Rôles personnalisés** — le distributeur compose les siens, Money Vibes les voit

**Epic :** EPIC-025 — RBAC plateforme *(extension)*
**Réf. code livré :** **STORY-140** (catalogue de permissions) · **STORY-166** (jeu système distributeur)
**Dépend de :** STORY-166
**Débloque :** `DI-02` (l'administrateur crée ses rôles) · `AP-17` (la console les voit)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** medium-high — **la gouvernance est plus difficile que le modèle**
**Statut :** En revue — 2026-11-07 (`MNV-167` : `48f932f` + `d13ca2c`)
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **30** — **socle distributeur, vague 0**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `auth-service` (`:3001`)
**Couvre :** demande PO du 2026-08-02

---

## Contexte

Demande du PO :

> *« Prends en compte qu'un distributeur peut créer des rôles qui sont spécifiques à son activité […]
> Money Vibes doit avoir accès aux rôles par défaut — les 14 personas — **mais aussi à ceux qui
> seront créés par le distributeur**. »*

Deux exigences, et la seconde est celle qui compte : **la console voit les rôles que l'organisation
s'est créés**. Sans elle, Money Vibes accompagne un client dont elle ne comprend plus
l'organisation — et le support devient impossible.

### Pourquoi c'est nécessaire et pas confortable

Le catalogue commercial décrit **14 personas**. Aucun distributeur réel n'a exactement ces
quatorze-là : l'un fusionne DAF et Comptable, l'autre sépare le recouvrement en deux, un troisième a
un « responsable grands comptes » qui n'existe nulle part. **Un jeu de rôles figé oblige chaque
client à se tordre**, ou à donner à quelqu'un plus de droits qu'il n'en faut. C'est ainsi qu'on
obtient des organisations où tout le monde est administrateur.

---

## User Story

**En tant qu'**administrateur d'un distributeur,
**je veux** composer des rôles qui correspondent à mon organisation réelle,
**afin de** ne pas devoir choisir entre un rôle trop large et un rôle qui ne sert à rien.

**En tant que** support Money Vibes,
**je veux** voir les rôles qu'un client s'est créés et ce qu'ils contiennent,
**afin de** pouvoir l'aider quand il m'appelle.

---

## Périmètre

### A. Composer un rôle

Un **rôle personnalisé** est une composition nommée de permissions **choisies dans le catalogue
existant** (`STORY-140`). Il porte : un libellé, une description, une liste de permissions,
l'organisation propriétaire.

⚡ **Aucune permission nouvelle ne se crée ici.** Le catalogue de permissions reste **la propriété de
la plateforme** : une organisation compose, elle n'invente pas. Sinon deux clients auraient deux
vocabulaires, et aucun contrôle ne serait comparable.

### B. Ce qu'un rôle personnalisé ne peut pas faire

| Interdit | Pourquoi |
|---|---|
| Contenir une permission que **l'organisation ne détient pas** *(module non souscrit)* | On ne délègue pas un droit qu'on n'a pas |
| Être créé par quelqu'un qui **ne détient pas lui-même** les permissions qu'il y met | ⚡ Même principe que le mandat de l'assistant IA (`FR-IA36c`) et la portée d'accès (`FR-R36`) : **nul ne délègue au-delà de ce qu'il détient** |
| Porter le même nom qu'un rôle système | Confusion au support |
| Être modifié pour **contourner la séparation des pouvoirs** sans que ce soit dit | Voir §D |

### C. Coexistence système / personnalisé

| | Rôle **système** | Rôle **personnalisé** |
|---|---|---|
| Propriétaire | Prospera | L'organisation |
| Modifiable par le client | ❌ | ✅ |
| Visible de la console | ✅ | ✅ ⚡ |
| Évolue avec le produit | ✅ automatiquement | ❌ figé jusqu'à modification |

⚠️ **La contrepartie de la personnalisation, à écrire dans le produit :** un rôle personnalisé
**n'hérite pas** des permissions ajoutées à un module plus tard. Un client qui personnalise devra
revenir. L'écran doit le dire au moment de la création, pas le laisser découvrir.

### D. La séparation des pouvoirs — signalée, pas interdite

Un distributeur de trois personnes **doit** pouvoir cumuler `declarer`, `valider` et `annuler` — sinon
il ne peut pas travailler.

**Le système ne l'interdit pas ; il le rend visible :**

- À la création du rôle, un **avertissement explicite** nomme le cumul et sa conséquence
- Le rôle porte un **marqueur de cumul** restitué à la console
- Le contrôle **sur la personne** de `STORY-156`/`STORY-158` **continue de s'appliquer** : même avec
  un rôle cumulant, personne ne valide sa propre déclaration

> ⚡ **C'est la distinction qui rend le dispositif utilisable :** on n'empêche pas une petite
> structure de fonctionner, on empêche une personne d'être seule sur un circuit d'argent.

### E. Ce que la console voit

`GET` des rôles d'une organisation : système **et** personnalisés, avec leurs permissions, leur
marqueur de cumul, leur auteur et leur date.

⚠️ **En lecture seule.** Money Vibes voit pour accompagner ; elle ne modifie pas les rôles d'un
client — ce serait agir dans son organisation sans lui.

---

## Critères d'acceptation

1. Une organisation crée un rôle personnalisé en composant des permissions **du catalogue existant** ;
   aucune permission nouvelle n'est créable.
2. Un rôle contenant une permission d'un **module non souscrit** est refusé, avec le module nommé.
3. ⚡ Un utilisateur ne peut pas créer un rôle contenant une permission **qu'il ne détient pas
   lui-même**.
4. Un rôle personnalisé portant le nom d'un rôle système est refusé.
5. Les rôles système **ne sont pas modifiables** par l'organisation.
6. ⚡ Un rôle cumulant `declarer` + `valider` (ou + `annuler`) est **accepté**, avec un **avertissement
   explicite** et un **marqueur de cumul** persisté.
7. ⚡ Le contrôle **sur la personne** reste actif : un utilisateur porteur d'un rôle cumulant **ne
   valide pas sa propre déclaration** — non-régression de `STORY-156` AC 7.
8. ⚡ La console (`PLATFORM_ADMIN`) obtient les rôles **système et personnalisés** d'une organisation,
   avec leurs permissions, en **lecture seule**.
9. Supprimer un rôle porté par des utilisateurs est **refusé**, avec la liste des porteurs.
10. Toute création, modification et suppression de rôle est **journalisée**.
11. Un rôle personnalisé **n'acquiert pas** automatiquement les permissions ajoutées ultérieurement à
    un module ; ce comportement est **documenté dans la réponse d'API**, pas seulement dans un guide.
12. Isolation : une organisation ne voit jamais les rôles d'une autre.

---

## Notes techniques

### Pourquoi la console est en lecture seule

Modifier les rôles d'un client depuis la console reviendrait à agir dans son organisation en son nom.
Le support en a besoin **pour comprendre**, pas pour faire. Si un jour l'intervention devient
nécessaire, elle passera par une demande tracée du client — pas par un accès silencieux.

### Le marqueur de cumul (AC 6)

Ce n'est pas un avertissement d'interface : c'est une **donnée persistée**, restituée à la console et
exploitable en audit. Un avertissement affiché une fois à la création disparaît ; un marqueur reste.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Un client se crée un rôle « super-admin » cumulant tout | **AC 6** : accepté mais marqué ; **AC 7** : le contrôle sur la personne tient quand même |
| Un utilisateur s'octroie des droits qu'il n'a pas via un rôle | **AC 3** |
| Le support ne comprend plus l'organisation d'un client | **AC 8** : la console voit tout, en lecture |
| Un rôle personnalisé se périme sans que le client le sache | **AC 11** : documenté dans la réponse d'API |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : création d'un rôle, refus sur module non souscrit, refus d'escalade de
      droits, cumul marqué, contrôle sur la personne toujours actif, lecture console
- [ ] Revue de sécurité : escalade de privilèges par composition de rôle
- [ ] Branche `MNV-167`, PR rebase-mergée sur `dev`

---

## Progress Tracking

**Statut : en revue — 2026-11-07.** Branche `MNV-167` d'`auth-service` : `48f932f` (rôles composés) + `d13ca2c` (surcharge DELTA). **Un seul dépôt** — aucun front ni service aval à fusionner avec elle.

### ⚠️ Ce que la fiche ne disait pas : l'arbitrage PO du 04/09

Cette fiche date du 2026-08-02 et n'avait jamais été mise à jour. Le **tracker**, lui, portait depuis le 2026-09-05 un arbitrage PO qui la contredit en partie : *ajuster un rôle du SOCLE pour une organisation est un **DELTA**, jamais une copie* — `perms(rôle, org) = ( socle ∪ ajouts ) \ retraits`. Le mode de panne de la copie : le jour où la plateforme ajoute un droit au rôle, aucune copie ne le reçoit — en retard, en silence et pour toujours.

La première livraison (`48f932f`) suivait la fiche seule. L'écart a été vu au moment d'écrire ce suivi et soumis au PO :

| Décision PO du 2026-11-07 | Retenu |
|---|---|
| Quel modèle ? | **Les deux.** Ajuster un rôle publié ⇒ **surcharge DELTA** (suit le produit). Créer un rôle **nouveau** (« responsable grands comptes ») ⇒ **composition** de zéro : elle ne copie rien, elle n'a donc rien à rater. |
| Plafond de délégation (AC 3 contre AC 6) | **L'organisation.** Appliqué au pied de la lettre, AC 3 rendait AC 6 infaisable : aucun rôle du socle ne réunit déclarer et valider, et `DIST_ADMIN` n'a ni l'un ni l'autre (décision 166). Le `TENANT_ADMIN` compose parmi les modules souscrits ; l'anti-escalade porte sur la **personne**. |
| Attribution par l'organisation | **Oui**, plus la console étendue aux rôles personnalisés : sans cela, un rôle personnalisé n'est porté par personne (AC 7, AC 9 invérifiables). |
| Code retiré du catalogue alors qu'une surcharge le cite | **Ignoré à la lecture** : jamais accordé, signalé `codesObsoletes` à la console, aucun démarrage bloqué, rien réécrit en silence. |

### Ce qui est livré

- **Rôle composé** : une ligne de `tenant_roles` avec `organizationId`, nom technique `PERSO_<id>`, libellé unique par organisation (index partiel), marqueur `cumuls` persisté.
- **Surcharge** : `tenant_role_surcharges { organizationId, roleName, ajouts, retraits }`, unique `(organizationId, roleName)` ; une seule résolution, au jeton.
- **Routes organisation** (`TENANT_ADMIN`, organisation = celle du jeton, jamais un paramètre) : `GET|POST organizations/me/tenant-roles`, `GET …/tenant-roles/permissions` (catalogue composable avec motifs, DI-02 §4), `PATCH|DELETE …/tenant-roles/:roleId`, `PUT|DELETE …/tenant-roles/:roleName/surcharge`, `PUT organizations/me/members/:userId/tenant-role`.
- **Console** : `GET admin/organizations/:id/tenant-roles` (`org:read` ou `user:invite`), lecture seule ; l'attribution console existante accepte les rôles personnalisés de l'organisation.
- **Abonnements (AC 2)** : lus chez `platform-catalog-service` avec le jeton de l'administrateur (`CATALOG_SERVICE_URL`) ; `SUSPENDED` refusé comme non souscrit ; catalogue absent, lent ou illisible ⇒ `503 ABONNEMENTS_INDISPONIBLES`, rien n'est écrit.
- **Journal** : `TENANT_ROLE_CREATED|UPDATED|DELETED`, `TENANT_ROLE_SURCHARGE_SET|REMOVED` — permissions **effectives** avant / après, cumuls, ajouts / retraits.

### Critères d'acceptation

| # | Vérifié par |
|---|---|
| 1 | Code inventé, `org:read`, `paiement:grace:attribuer` ⇒ `422 TENANT_PERMISSION_INCONNUE`, nommés — en composition comme en surcharge |
| 2 | Cabinet + `notification` ⇒ 422, module nommé ; distributeur sans abonnement + `paiement` ⇒ 422 ; seuls les ajouts **nouveaux** sont vérifiés |
| 3 | Auto-attribution plus large ⇒ `403 TENANT_ROLE_AUTO_ESCALADE` ; élargir (ou dé-surcharger) un rôle qu'on porte ⇒ 403 ; **revérifié dans la transaction** (voir revue de sécurité) |
| 4 | « Directeur Général », « directeur  general », « DIST_ADMIN », « dist-commercial » ⇒ `409 TENANT_ROLE_NOM_RESERVE` |
| 5 | `PATCH`/`DELETE` d'un rôle du socle ⇒ `403 TENANT_ROLE_SYSTEME_NON_MODIFIABLE` ; une surcharge n'écrit jamais la ligne du socle |
| 6 | déclarer + valider + annuler accepté, deux cumuls nommés et **persistés** ; surcharge cumulante idem |
| 7 | **paiement-service réel** : le porteur du rôle cumulant déclare, puis `409 SEPARATION_POUVOIRS_VIOLEE` en validant ; validé par un collègue du **même** rôle, il ne peut toujours pas annuler |
| 8 | Console : système et personnalisés, permissions effectives, cumuls, auteur, date, porteurs, surcharge ; rien de modifiable ; aucune route d'écriture (404) |
| 9 | Suppression d'un rôle porté ⇒ `409 TENANT_ROLE_PORTE` **avec la liste des porteurs** ; sérialisée avec une attribution concurrente |
| 10 | Cinq actions de journal, dans la transaction de l'écriture |
| 11 | `evolution { suitLeProduit, note }` dans **chaque** réponse ; figé pour un rôle composé (dit à la création), suit le produit pour une surcharge |
| 12 | Un distributeur ne voit, ne modifie, ne supprime, n'attribue pas le rôle d'un autre ; une adhésion **forcée en base** sur le rôle d'une autre organisation ⇒ le jeton n'en reçoit aucun droit |

### Le test du tracker (arbitrage du 04/09)

*« Modifier le socle, et vérifier que les deux organisations le voient, chacune avec sa surcharge. »* Deux distributeurs abonnés : D surcharge le commercial (+ valider, − révoquer), E retire « journal » **avant** que le socle ne l'ait. Le socle reçoit « journal » ⇒ D le reçoit, surcharge comprise ; E ne le reçoit pas, son retrait tient. Vrai en lecture **et** au jeton.

### Revue de sécurité — escalade par composition

- ⛔ **Trouvé et fermé** : les deux gardes de l'anti-escalade lisaient l'état **hors transaction**. Un administrateur envoyant en même temps « élargir R » (il ne le porte pas encore) et « m'attribuer R » (contrôlé sur l'ancien R) aurait porté seul un R élargi. Les deux contrôles sont désormais **revérifiés dans la transaction** ; les deux écritures touchent le même document (le rôle composé, ou la surcharge du rôle du socle), donc l'une rejoue et voit l'autre. **Recette de course** : 40 courses sur un rôle composé, 30 sur une surcharge, délais décalés, les deux ordres d'arrivée observés — **jamais** les deux acceptés.
- Un `TENANT_USER` ne compose pas ; un opérateur plateforme ne compose pas chez un client ; aucune permission plateforme n'entre dans un rôle de tenant.
- Assumé (décision PO) : deux administrateurs d'une même organisation peuvent se donner mutuellement un rôle cumulant — deux personnes, deux lignes de journal, et le contrôle à l'acte du paiement tient (AC 7).

### Défauts trouvés en chemin

- ⛔ **Le filtre d'exceptions de l'IdP tronquait tout refus à `{ message, code }`** : les `porteurs` (AC 9), les `modules` (AC 2) — et le `roles` du `409 VERTICAL_ROLES_INCOMPATIBLES` de **STORY-171** — étaient construits, testés à l'unitaire, puis perdus au bord HTTP. Corrigé par une **liste blanche** de détails (`roles`, `permissions`, `modules`, `porteurs`), relayés seulement avec un `code`.
- ⚠️ **notification-service ne refuse PAS** que la personne qui valide un envoi de masse soit celle qui l'exécute (`valider()` conserve le nom, sans contrôle). Le marqueur `notification:executer+valider` le **dit** au lieu de promettre une protection. À ouvrir côté notification si le PO veut l'équivalent d'AD-11.
- ⚠️ **Pile docker** : sans l'override de watch, `platform-catalog-service` (image de production, `.env` en `NODE_ENV=development`) tombe sur `pino-pretty` absent. Contourné pour la vérification par un override `NODE_ENV: production` ; le `.env` du catalogue reste à corriger.
- ⚠️ `docker-compose.yml` (racine, non versionnée) : `CATALOG_SERVICE_URL` ajoutée à `auth-service`.

### Vérification

- **Unitaires 1 205/1 205** · **e2e 269/269** · lint 0 sur les fichiers touchés · couverture globale 98 %, `organization-roles` 99,7 %.
- **Docker** (IdP, catalogue et paiement réels) : recette 167 **61/61**, recette surcharge **38/38**, 70 courses sans escalade. Données de recette nettoyées ; le journal (ajout seul) et les écritures du paiement sont conservés ; le cabinet de démonstration garde le droit `paiement` posé par la vraie route du catalogue — il était déjà actif dans le read-model du paiement, sans trace au catalogue.

### Suites

- **Front** : DI-02 (composer, surcharger, attribuer) et AP-17 (lecture console) ont leur backend.
- **Journal des services aval** : le même nom de rôle ne donnant plus les mêmes droits d'un client à l'autre, la piste d'audit de paiement et notification doit porter les permissions **effectives** au moment de l'acte (STORY-600 AC-5) — hors d'auth-service.
- `paiement:grace:attribuer` reste hors catalogue (aucune garde ne le vérifie).
