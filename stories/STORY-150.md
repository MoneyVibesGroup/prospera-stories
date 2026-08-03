# STORY-150 : Scaffold `paiement-service` — relying party RS256/JWKS, base dédiée, outbox transactionnel, santé par fournisseur

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement) — *rescopé PA-1*
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupes A/B/K · §7 NFR-1, NFR-5, NFR-6
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` §Modèle de jetons RS256-JWKS · §Contrats d'événements (Kafka + transactional outbox)
**Réf. code livré (à réutiliser, jamais réécrire) :** **STORY-031** (`platform-catalog-service` : scaffold relying party + `/health` + `KafkaModule` squelette — **le patron de référence**) · **STORY-034** (outbox transactionnel `OutboxEvent`/`OutboxService.enqueue(session)`/`OutboxRelayService`) · **STORY-076** (`balance-service` : scaffold le plus récent) · **STORY-138** (contrat d'erreur `{ message, code }`)
**Dépend de :** aucune — première story du service
**Débloque :** STORY-151, 152, 153, 154 (toutes les autres du service)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** low — le patron est établi cinq fois ; la valeur est dans ce qu'on **n'oublie pas**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **30** — **incrément 1**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `paiement-service` (`:3005`) — base Mongo dédiée `paiement_service`
**Couvre :** FR-P11, FR-P22 *(partiel)*, FR-P61, FR-P62 · NFR-5, NFR-6

---

## Contexte

`paiement-service` est déclaré au `program_backlog` depuis le 2026-07-10 avec le port `:3005` et la
base `paiement_service`, mais **aucune ligne n'existe**. `STORY-016` à `STORY-019` n'ont même pas de
fichier : ce sont cinq titres.

Cette story ne fait **rien de métier**. Elle rend le service démarrable, sécurisé et observable, et
elle pose les deux coutures sur lesquelles tout le reste se branchera : l'**outbox transactionnel**
et la **santé par fournisseur**.

> ⚠️ **Ce service manipule de l'argent.** Deux invariants du PRD s'appliquent dès le scaffold et ne
> peuvent pas être ajoutés après coup sans reprise de données : **NFR-1** (Prospera ne détient jamais
> les fonds — le modèle ne comporte aucune notion de solde détenu) et **NFR-2** (montants en entier
> d'unité mineure, **jamais en flottant**).

---

## User Story

**En tant qu'**équipe plateforme,
**je veux** un `paiement-service` démarrable, authentifiant les jetons de l'IdP et publiant sur le bus,
**afin que** les stories d'encaissement se branchent sur un socle identique à celui des cinq autres
services, sans réinventer l'authentification, l'outbox ni le contrat d'erreur.

---

## Périmètre

### A. Scaffold NestJS + relying party

- Service NestJS sur `:3005`, base Mongo dédiée `paiement_service`, ajouté au `docker-compose.yml` racine.
- **Relying party RS256/JWKS** : validation **locale** des jetons émis par `auth-service`, cache JWKS,
  **aucun appel chaud à l'IdP**. Reprise stricte du patron `platform-catalog-service`.
- Isolation `organizationId` sur toute requête — **NFR-5**.
- Contrat d'erreur `{ message, code }` conforme à **STORY-138** dès le premier endpoint.
- Guard e-mail vérifié aligné sur les 7 autres relying parties (STORY-138).

### B. Outbox transactionnel

- `OutboxEvent` / `OutboxService.enqueue(session)` / `OutboxRelayService`, **calqués sur STORY-034**.
- Aucun événement publié dans cette story — la **couture** est posée et testée à vide, avec un
  commentaire `// Couture STORY-154` au point exact où le premier événement partira.
- Motif : un encaissement et sa publication doivent être **atomiques**. Un encaissement enregistré
  dont l'événement se perd est une créance qui reste due chez le consommateur.

### C. Santé par fournisseur — pas seulement du service

`/health` distingue **trois** états, là où les services précédents n'en distinguaient que deux :

| Composant | États |
|---|---|
| `mongo` | `up` / `down` |
| `kafka` | `up` / `down` |
| **`providers`** | par fournisseur : `up` / `down` / `non configuré` |

**Le service démarre même sans aucun fournisseur configuré** (FR-P11). L'absence d'une passerelle
dégrade **le canal**, jamais le service — même principe que `llm: down` dans `assistant-service`.

### D. Le type monétaire, posé une fois

Un type `Montant { valeurMineure: number (entier), devise: string }` est défini **au scaffold** et
utilisé partout ensuite. Aucun montant ne circule en nombre nu.

> ⚠️ **Le XOF n'a pas de décimale.** Un montant de 400 000 F se stocke `400000`, pas `40000000`.
> Le nombre de décimales est lu d'une table de devises, jamais supposé à 2.

### E. Ce que cette story **ne fait pas**

Aucun endpoint métier, aucun fournisseur réel, aucune persistance de demande ou d'encaissement.
`GET /health` et la validation du jeton sont les seules surfaces.

---

## Critères d'acceptation

1. `docker compose up` démarre `paiement-service` sur `:3005` ; `GET /health` répond `200` avec
   `mongo: up`, `kafka: up`, `providers: []`.
2. Un jeton RS256 valide émis par `auth-service` est accepté ; un jeton expiré, mal signé, ou signé
   par une autre clé est **rejeté 401** avec `{ message, code }`.
3. **Aucun appel réseau vers `auth-service`** n'est émis pendant la validation d'un jeton (JWKS en cache).
4. Le service **démarre et répond `200` sur `/health`** avec Kafka arrêté, en signalant `kafka: down`.
5. `OutboxService.enqueue(session)` inscrit un événement dans la même transaction Mongo que l'écriture
   métier ; un test prouve qu'un `abort()` de la transaction **n'enregistre ni l'un ni l'autre**.
6. `OutboxRelayService` publie les événements en attente et les marque publiés ; un relais interrompu
   puis relancé **ne publie pas deux fois** le même événement.
7. Le type `Montant` refuse une valeur non entière et refuse une devise inconnue de la table.
8. Un montant en XOF de `400000` restitué par l'API vaut `400 000 F`, **pas `4 000,00 F`**.
9. Le guard e-mail non vérifié retourne `403 { message, code: 'EMAIL_NOT_VERIFIED' }`, identique aux
   7 autres services.
10. Une requête portant un `organizationId` différent de celui du jeton est **rejetée**, pas filtrée.
11. ⚡ **CORS activé dès le scaffold**, sur les origines des applications clientes. La topologie est
    **direct-par-service** (décision PO 2026-08-02) : le navigateur appelle `:3005` directement.
    Sans CORS, **aucun appel navigateur ne passe le préflight** — c'est exactement ce que `STORY-109`
    a dû corriger en urgence sur cinq services livrés sans. Ce service ne doit pas être le sixième.

---

## Notes techniques

### Ce qui se copie, et ce qui ne se copie pas

| À reprendre tel quel | À **ne pas** reprendre |
|---|---|
| `JwksGuard`, cache JWKS, `TenantGuard` | Les read-models d'entitlement — ce service n'en a pas besoin au v1 |
| `OutboxEvent` + relay (STORY-034) | Le `EntitlementsModule` |
| Filtre d'exception `{ message, code }` (STORY-138) | Le schéma de `Module`/`ModuleVersion` |
| `/health` composite | La notion de `referentiel` |

### Le piège du `providers: []`

Un tableau vide **n'est pas une erreur** : c'est l'état nominal au premier démarrage. Le service doit
le dire (`non configuré`) et non le taire, sinon l'exploitant croit à une panne.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Le type monétaire est ajouté « plus tard » et les premiers montants sont des `number` nus | **AC 7/8** le rendent bloquant dès cette story. Une reprise de données monétaires après coup est la plus coûteuse qui soit |
| L'outbox est posée mais jamais testée à vide, et le premier événement révèle un défaut d'atomicité | **AC 5/6** exigent la preuve avant tout usage réel |
| Une notion de solde détenu s'introduit « pour simplifier » | Revue de conception : **NFR-1b** interdit portefeuille, séquestre, reversement. Leur apparition signale un changement de régime juridique |

---

## Definition of Done

- [ ] Les 10 critères d'acceptation vérifiés
- [ ] `lint` 0 · couverture ≥ 90 % sur les modules livrés
- [ ] **Vérification docker obligatoire** sur stack neuve (`down -v`) : démarrage, `/health`, jeton
      valide/invalide, Kafka arrêté, atomicité de l'outbox prouvée par un `abort()` provoqué
- [ ] Revue de sécurité : aucun secret journalisé, aucune trace d'erreur exposant un identifiant
- [ ] `docker-compose.yml` racine mis à jour
- [ ] Branche `MNV-150`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
